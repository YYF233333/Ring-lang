"""Bounded, replayable measurement harness for Ring ``check`` feedback."""

from __future__ import annotations

import argparse
import ctypes
import datetime as dt
import hashlib
import json
import math
import os
import platform
import re
import shutil
import statistics
import subprocess
import sys
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

from windows_job import JobMeasurementError, preflight_job_support, run_in_job


BENCH_DIR = Path(__file__).resolve().parent
REPO_ROOT = BENCH_DIR.parents[1]
DEFAULT_MANIFEST = BENCH_DIR / "manifest.json"
DEFAULT_RESULT_SCHEMA = BENCH_DIR / "result.schema.json"
MANIFEST_SCHEMA = "ring.check-benchmark.manifest.v2"
RESULT_SCHEMA = "ring.check-benchmark.invocation.v2"
ENVIRONMENT_SCHEMA = "ring.check-benchmark.environment.v1"
SUMMARY_SCHEMA = "ring.check-benchmark.summary.v1"
COMPILER_PHASE_SCHEMA = "ring.compiler-phase-timing.v1"
BOOTSTRAP_PHASE_SCHEMA = "ring.check-benchmark.bootstrap-phase.v1"
RUNNER_SUMMARY_CONTRACT_SCHEMA = "ring.check-benchmark.runner-summary-contract.v1"
WARM_CACHE_RECEIPT_SCHEMA = "ring.check-benchmark.warm-cache-seed.v1"
# Updated mechanically after result.schema.json changes.  The constant pins the
# complete nested contract, not merely its public $id.
RESULT_SCHEMA_CANONICAL_SHA256 = "95e0bd9037a80e879bad2588d9d89edde5facaa827dd840225f639c800c36947"
COMPILER_PHASE_ORDER = (
    "input_entry_load",
    "entry_parse",
    "project_module_load_parse",
    "type_effect_check_lower",
    "resource_plan_verify",
    "command_total",
)
BOOTSTRAP_PHASE_ORDER = ("anchor_compile", "runtime_compile", "link")
RING_INT_MAX = (1 << 62) - 1
ALLOWED_POLICIES = {"direct_short", "adaptive", "full_gate"}
ALLOWED_CACHE_STATES = {"cold", "warm"}
ALLOWED_PLACEHOLDERS = {
    "repo",
    "python",
    "ring",
    "clang",
    "clangxx",
    "powershell",
    "run_dir",
    "sample_dir",
    "thinlto_cache",
}
DIRECT_VALID_SAMPLES = 21
DIRECT_WARMUPS = 1
SHORT_VALID_SAMPLES = 5
LONG_VALID_SAMPLES = 3
FULL_GATE_VALID_SAMPLES = 3
MAX_EXTRA_ATTEMPTS = 2
LONG_LANE_THRESHOLD_NS = 300 * 1_000_000_000
RSS_POLL_MS = 10
WARM_CACHE_SEED_TIMEOUT_SECONDS = 600
WARM_CACHE_RECEIPT_NAME = "ring-lang-b176-warm-seed-receipt.json"
WARM_CACHE_OUTPUT_NAME = "ring-lang-b176-warm-seed-output"
SAMPLE_ID_RE = re.compile(
    r"^(?P<case_id>[a-z][a-z0-9_]*)-(?P<index>[0-9]{3})-(?P<nonce>[0-9a-f]{8})$"
)


class HarnessError(RuntimeError):
    """Configuration, preflight, or measurement-integrity failure."""


class DuplicateJsonKeyError(HarnessError):
    """A JSON object contained two spellings of the same exact key."""


def _strict_json_loads(text: str, source: str) -> Any:
    def reject_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        value: dict[str, Any] = {}
        for key, item in pairs:
            if key in value:
                raise DuplicateJsonKeyError(
                    f"duplicate JSON key {key!r} while reading {source}"
                )
            value[key] = item
        return value

    try:
        return json.loads(text, object_pairs_hook=reject_duplicates)
    except json.JSONDecodeError as exc:
        raise HarnessError(f"invalid JSON in {source}: {exc}") from exc


def _load_json(path: Path) -> Any:
    try:
        return _strict_json_loads(path.read_text(encoding="utf-8"), str(path))
    except (OSError, UnicodeError) as exc:
        raise HarnessError(f"cannot load JSON {path}: {exc}") from exc


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _json_dump(path: Path, value: Any) -> None:
    path.write_text(
        json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False, allow_nan=False)
        + "\n",
        encoding="utf-8",
    )


def _json_line(value: Any) -> str:
    return json.dumps(value, sort_keys=True, ensure_ascii=False, allow_nan=False)


def _is_json_type(value: Any, expected: str) -> bool:
    if expected == "null":
        return value is None
    if expected == "boolean":
        return isinstance(value, bool)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return (
            isinstance(value, (int, float))
            and not isinstance(value, bool)
            and math.isfinite(value)
        )
    if expected == "string":
        return isinstance(value, str)
    if expected == "array":
        return isinstance(value, list)
    if expected == "object":
        return isinstance(value, dict)
    raise HarnessError(f"schema uses unsupported JSON type {expected!r}")


def validate_json(
    value: Any,
    schema: Mapping[str, Any],
    path: str = "$",
    _root_schema: Mapping[str, Any] | None = None,
) -> None:
    """Validate the deliberately small JSON-Schema subset used by this harness."""

    root_schema = schema if _root_schema is None else _root_schema
    reference = schema.get("$ref")
    if reference is not None:
        if not isinstance(reference, str) or not reference.startswith("#/"):
            raise HarnessError(f"{path}: unsupported schema reference {reference!r}")
        target: Any = root_schema
        for raw_component in reference[2:].split("/"):
            component = raw_component.replace("~1", "/").replace("~0", "~")
            if not isinstance(target, dict) or component not in target:
                raise HarnessError(f"{path}: unresolved schema reference {reference!r}")
            target = target[component]
        if not isinstance(target, dict):
            raise HarnessError(f"{path}: schema reference is not an object")
        validate_json(value, target, path, root_schema)
        return

    expected_types = schema.get("type")
    if expected_types is not None:
        if isinstance(expected_types, str):
            expected_types = [expected_types]
        if not isinstance(expected_types, list) or not expected_types:
            raise HarnessError(f"{path}: schema type must be a string or non-empty list")
        if not any(_is_json_type(value, item) for item in expected_types):
            actual = type(value).__name__
            raise HarnessError(f"{path}: expected type {expected_types}, got {actual}")

    if "const" in schema and value != schema["const"]:
        raise HarnessError(f"{path}: expected constant {schema['const']!r}")
    if "enum" in schema and value not in schema["enum"]:
        raise HarnessError(f"{path}: {value!r} is not one of {schema['enum']!r}")
    if isinstance(value, str) and "minLength" in schema:
        if len(value) < int(schema["minLength"]):
            raise HarnessError(f"{path}: string is shorter than minLength")
    if isinstance(value, str) and "pattern" in schema:
        if re.fullmatch(str(schema["pattern"]), value) is None:
            raise HarnessError(f"{path}: string does not match the required pattern")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            raise HarnessError(f"{path}: value is below minimum {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            raise HarnessError(f"{path}: value is above maximum {schema['maximum']}")

    if isinstance(value, list):
        if "minItems" in schema and len(value) < int(schema["minItems"]):
            raise HarnessError(f"{path}: array is shorter than minItems")
        if "maxItems" in schema and len(value) > int(schema["maxItems"]):
            raise HarnessError(f"{path}: array is longer than maxItems")
        if schema.get("uniqueItems"):
            canonical = [_json_line(item) for item in value]
            if len(set(canonical)) != len(canonical):
                raise HarnessError(f"{path}: array items are not unique")
        if "items" in schema:
            item_schema = schema["items"]
            for index, item in enumerate(value):
                validate_json(item, item_schema, f"{path}[{index}]", root_schema)

    if isinstance(value, dict):
        required = schema.get("required", [])
        missing = [key for key in required if key not in value]
        if missing:
            raise HarnessError(f"{path}: missing required keys {missing}")
        properties = schema.get("properties", {})
        for key, item in value.items():
            if key in properties:
                validate_json(item, properties[key], f"{path}.{key}", root_schema)
            else:
                additional = schema.get("additionalProperties")
                if additional is False:
                    raise HarnessError(f"{path}: unexpected key {key!r}")
                if isinstance(additional, dict):
                    validate_json(item, additional, f"{path}.{key}", root_schema)


def validate_schema_definition(schema: Mapping[str, Any]) -> None:
    if schema.get("$id") != RESULT_SCHEMA:
        raise HarnessError(
            f"result schema $id must be {RESULT_SCHEMA!r}, got {schema.get('$id')!r}"
        )
    canonical = json.dumps(
        schema, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")
    actual_sha = _sha256_bytes(canonical)
    if actual_sha != RESULT_SCHEMA_CANONICAL_SHA256:
        raise HarnessError(
            "result schema definition does not match the canonical invocation.v2 "
            f"contract: expected {RESULT_SCHEMA_CANONICAL_SHA256}, got {actual_sha}"
        )


def _placeholders(text: str) -> set[str]:
    return set(re.findall(r"\{([a-z][a-z0-9_]*)\}", text))


def _validate_runner_summary_contract(
    contract: Any, prefix: str
) -> None:
    required = {
        "schema",
        "expected_total",
        "expected_status_counts",
        "expected_suite_counts",
        "skip_policy",
        "fail_policy",
        "reported_exit_policy",
    }
    if not isinstance(contract, dict) or set(contract) != required:
        raise HarnessError(f"{prefix} must use the exact runner-summary contract fields")
    if contract["schema"] != RUNNER_SUMMARY_CONTRACT_SCHEMA:
        raise HarnessError(f"{prefix}.schema is unsupported")
    total = contract["expected_total"]
    if not _is_trace_int(total) or total < 1:
        raise HarnessError(f"{prefix}.expected_total must be a positive integer")
    statuses = contract["expected_status_counts"]
    status_keys = {"pass", "fail", "skip"}
    if (
        not isinstance(statuses, dict)
        or set(statuses) != status_keys
        or any(not _is_trace_int(value) or value < 0 for value in statuses.values())
        or sum(statuses.values()) != total
    ):
        raise HarnessError(f"{prefix}.expected_status_counts is inconsistent")
    suites = contract["expected_suite_counts"]
    if not isinstance(suites, dict) or not suites:
        raise HarnessError(f"{prefix}.expected_suite_counts must be a non-empty object")
    accumulated = {key: 0 for key in status_keys}
    for suite, counts in suites.items():
        if not isinstance(suite, str) or not suite:
            raise HarnessError(f"{prefix}.expected_suite_counts has an invalid suite")
        if (
            not isinstance(counts, dict)
            or set(counts) != status_keys
            or any(not _is_trace_int(value) or value < 0 for value in counts.values())
        ):
            raise HarnessError(f"{prefix}.expected_suite_counts[{suite!r}] is invalid")
        for key in status_keys:
            accumulated[key] += counts[key]
    if accumulated != statuses:
        raise HarnessError(f"{prefix} suite/status counts disagree")
    if contract["skip_policy"] != "exact":
        raise HarnessError(f"{prefix}.skip_policy must be 'exact'")
    if contract["fail_policy"] != "zero" or statuses["fail"] != 0:
        raise HarnessError(f"{prefix}.fail_policy must require zero failures")
    if contract["reported_exit_policy"] != "required_match_raw":
        raise HarnessError(
            f"{prefix}.reported_exit_policy must be 'required_match_raw'"
        )


def validate_manifest(manifest: Mapping[str, Any]) -> None:
    if manifest.get("schema") != MANIFEST_SCHEMA:
        raise HarnessError(f"manifest schema must be {MANIFEST_SCHEMA!r}")
    flags = manifest.get("fingerprint_flags")
    if not isinstance(flags, dict):
        raise HarnessError("manifest fingerprint_flags must be an object")
    for name in ("compiler", "runtime", "runner_runtime", "link"):
        if not isinstance(flags.get(name), list) or not all(
            isinstance(item, str) for item in flags[name]
        ):
            raise HarnessError(f"fingerprint_flags.{name} must be a string array")

    lanes = manifest.get("lanes")
    if not isinstance(lanes, list) or not lanes:
        raise HarnessError("manifest lanes must be a non-empty array")
    seen: set[str] = set()
    for index, lane in enumerate(lanes):
        prefix = f"manifest.lanes[{index}]"
        if not isinstance(lane, dict):
            raise HarnessError(f"{prefix} must be an object")
        required = {
            "case_id",
            "description",
            "policy",
            "cache_states",
            "argv",
            "cwd",
            "timeout_seconds",
            "expected_exit_codes",
            "requires",
            "runner_summary",
            "artifacts",
            "phase_trace_paths",
        }
        missing = sorted(required - set(lane))
        if missing:
            raise HarnessError(f"{prefix} missing keys {missing}")
        case_id = lane["case_id"]
        if not isinstance(case_id, str) or not re.fullmatch(r"[a-z][a-z0-9_]*", case_id):
            raise HarnessError(f"{prefix}.case_id must be snake_case")
        if case_id in seen:
            raise HarnessError(f"duplicate manifest case_id {case_id!r}")
        seen.add(case_id)
        if lane["policy"] not in ALLOWED_POLICIES:
            raise HarnessError(f"{prefix}.policy is invalid")
        if lane["cache_states"] != ["cold", "warm"]:
            raise HarnessError(f"{prefix}.cache_states must be exactly ['cold', 'warm']")
        if not isinstance(lane["argv"], list) or not lane["argv"] or not all(
            isinstance(item, str) and item for item in lane["argv"]
        ):
            raise HarnessError(f"{prefix}.argv must be a non-empty string array")
        if not isinstance(lane["cwd"], str) or not lane["cwd"]:
            raise HarnessError(f"{prefix}.cwd must be a non-empty string")
        if not isinstance(lane["timeout_seconds"], (int, float)) or lane[
            "timeout_seconds"
        ] <= 0:
            raise HarnessError(f"{prefix}.timeout_seconds must be positive")
        exits = lane["expected_exit_codes"]
        if not isinstance(exits, list) or not exits or not all(
            isinstance(code, int) and not isinstance(code, bool) for code in exits
        ):
            raise HarnessError(f"{prefix}.expected_exit_codes must be an integer array")
        if not isinstance(lane["requires"], list) or not all(
            isinstance(item, str) for item in lane["requires"]
        ):
            raise HarnessError(f"{prefix}.requires must be a string array")
        runner_contract = lane["runner_summary"]
        if runner_contract is not None:
            _validate_runner_summary_contract(
                runner_contract, f"{prefix}.runner_summary"
            )
        if "isolate_runner_runtime" in lane and not isinstance(
            lane["isolate_runner_runtime"], bool
        ):
            raise HarnessError(f"{prefix}.isolate_runner_runtime must be boolean")
        if "compiler_phase_timing" in lane and not isinstance(
            lane["compiler_phase_timing"], bool
        ):
            raise HarnessError(f"{prefix}.compiler_phase_timing must be boolean")
        for field in ("artifacts", "phase_trace_paths"):
            if not isinstance(lane[field], list) or not all(
                isinstance(item, str) for item in lane[field]
            ):
                raise HarnessError(f"{prefix}.{field} must be a string array")

        texts = list(lane["argv"]) + [lane["cwd"]]
        texts += lane["requires"] + lane["artifacts"] + lane["phase_trace_paths"]
        unknown = set().union(*(_placeholders(text) for text in texts)) - ALLOWED_PLACEHOLDERS
        if unknown:
            raise HarnessError(f"{prefix} uses unknown placeholders {sorted(unknown)}")
        for artifact in lane["artifacts"] + lane["phase_trace_paths"]:
            if "{sample_dir}" not in artifact:
                raise HarnessError(
                    f"{prefix}: output path must live under {{sample_dir}}: {artifact}"
                )
        if len(lane["phase_trace_paths"]) != len(set(lane["phase_trace_paths"])):
            raise HarnessError(f"{prefix}.phase_trace_paths contains duplicates")
        for phase_path in lane["phase_trace_paths"]:
            if _placeholders(phase_path) != {"sample_dir"}:
                raise HarnessError(
                    f"{prefix}: phase trace paths may use only {{sample_dir}}"
                )
        if lane.get("compiler_phase_timing", False):
            if (
                len(lane["argv"]) < 3
                or lane["argv"][0] != "{ring}"
                or lane["argv"][1] != "check"
            ):
                raise HarnessError(
                    f"{prefix}.compiler_phase_timing requires a direct ring check lane"
                )
            if lane["expected_exit_codes"] not in ([0], [1]):
                raise HarnessError(
                    f"{prefix}.compiler_phase_timing requires one expected exit (0 or 1)"
                )
            if len(lane["phase_trace_paths"]) != 1:
                raise HarnessError(
                    f"{prefix}.compiler_phase_timing requires exactly one phase trace path"
                )
            if any(arg.startswith("--phase-timing") for arg in lane["argv"]):
                raise HarnessError(
                    f"{prefix}: phase timing flags are owned by the harness"
                )
            expected_executed = lane.get("expected_executed_phases")
            if not isinstance(expected_executed, list) or not all(
                isinstance(phase, str) for phase in expected_executed
            ):
                raise HarnessError(
                    f"{prefix}.expected_executed_phases must be a string array"
                )
            expected_set = set(expected_executed)
            if expected_set - set(COMPILER_PHASE_ORDER):
                raise HarnessError(
                    f"{prefix}.expected_executed_phases contains unknown phases"
                )
            canonical = [
                phase for phase in COMPILER_PHASE_ORDER if phase in expected_set
            ]
            if expected_executed != canonical or "command_total" not in expected_set:
                raise HarnessError(
                    f"{prefix}.expected_executed_phases must be unique, canonical, "
                    "and include command_total"
                )
        elif "expected_executed_phases" in lane:
            raise HarnessError(
                f"{prefix}.expected_executed_phases requires compiler_phase_timing"
            )


def expand_lanes(manifest: Mapping[str, Any]) -> list[dict[str, Any]]:
    expanded: list[dict[str, Any]] = []
    for template in manifest["lanes"]:
        for cache_state in template["cache_states"]:
            lane = dict(template)
            lane.pop("cache_states")
            lane["base_case_id"] = lane["case_id"]
            lane["case_id"] = f"{lane['case_id']}_{cache_state}"
            lane["cache"] = {
                "thinlto_cache": cache_state,
                "output": "fresh",
                "os_file_cache": "uncontrolled",
            }
            lane.setdefault("isolate_runner_runtime", False)
            lane.setdefault("compiler_phase_timing", False)
            expanded.append(lane)
    return expanded


def _git(repo: Path, *args: str) -> str:
    completed = subprocess.run(
        ["git", "-C", str(repo), *args],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=15,
    )
    return completed.stdout.strip()


def _tool_path(name: str, explicit: str | None = None) -> str | None:
    candidate = explicit or shutil.which(name)
    if candidate is None:
        return None
    resolved = Path(candidate).resolve()
    return str(resolved) if resolved.is_file() else None


def _tool_version(path: str | None) -> str | None:
    if path is None:
        return None
    try:
        completed = subprocess.run(
            [path, "--version"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=15,
            check=False,
        )
    except OSError:
        return None
    output = (completed.stdout + "\n" + completed.stderr).strip()
    return output


def _windows_cpu_model() -> str | None:
    if os.name != "nt":
        return platform.processor() or None
    try:
        import winreg

        with winreg.OpenKey(
            winreg.HKEY_LOCAL_MACHINE,
            r"HARDWARE\DESCRIPTION\System\CentralProcessor\0",
        ) as key:
            return str(winreg.QueryValueEx(key, "ProcessorNameString")[0]).strip()
    except OSError:
        return platform.processor() or None


def _windows_memory_bytes() -> int | None:
    if os.name != "nt":
        return None

    class MEMORYSTATUSEX(ctypes.Structure):
        _fields_ = [
            ("dwLength", ctypes.c_ulong),
            ("dwMemoryLoad", ctypes.c_ulong),
            ("ullTotalPhys", ctypes.c_ulonglong),
            ("ullAvailPhys", ctypes.c_ulonglong),
            ("ullTotalPageFile", ctypes.c_ulonglong),
            ("ullAvailPageFile", ctypes.c_ulonglong),
            ("ullTotalVirtual", ctypes.c_ulonglong),
            ("ullAvailVirtual", ctypes.c_ulonglong),
            ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
        ]

    value = MEMORYSTATUSEX()
    value.dwLength = ctypes.sizeof(value)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(value)):
        return None
    return int(value.ullTotalPhys)


def _windows_power() -> dict[str, Any]:
    result: dict[str, Any] = {
        "ac_line_status": None,
        "battery_flag": None,
        "battery_life_percent": None,
        "active_scheme": None,
    }
    if os.name != "nt":
        return result

    class SYSTEM_POWER_STATUS(ctypes.Structure):
        _fields_ = [
            ("ACLineStatus", ctypes.c_ubyte),
            ("BatteryFlag", ctypes.c_ubyte),
            ("BatteryLifePercent", ctypes.c_ubyte),
            ("SystemStatusFlag", ctypes.c_ubyte),
            ("BatteryLifeTime", ctypes.c_ulong),
            ("BatteryFullLifeTime", ctypes.c_ulong),
        ]

    status = SYSTEM_POWER_STATUS()
    if ctypes.windll.kernel32.GetSystemPowerStatus(ctypes.byref(status)):
        result.update(
            {
                "ac_line_status": int(status.ACLineStatus),
                "battery_flag": int(status.BatteryFlag),
                "battery_life_percent": int(status.BatteryLifePercent),
            }
        )
    powercfg = shutil.which("powercfg")
    if powercfg:
        try:
            completed = subprocess.run(
                [powercfg, "/getactivescheme"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=10,
                check=False,
            )
            if completed.returncode == 0:
                result["active_scheme"] = completed.stdout.strip()
        except OSError:
            pass
    return result


def build_tools(ring_override: str | None) -> dict[str, str | None]:
    return {
        "python": str(Path(sys.executable).resolve()),
        "ring": _tool_path("ring.exe", ring_override or str(REPO_ROOT / "ring.exe")),
        "clang": _tool_path("clang"),
        "clangxx": _tool_path("clang++"),
        "powershell": _tool_path("powershell"),
    }


def _bytes_record(data: bytes) -> dict[str, Any]:
    return {"sha256": _sha256_bytes(data), "bytes": len(data)}


def _cache_inventory(cache: Path) -> dict[str, Any]:
    root = cache.resolve()
    entries: list[dict[str, Any]] = []
    if root.is_dir():
        for candidate in sorted(root.rglob("*"), key=lambda path: path.as_posix()):
            if candidate.is_symlink():
                raise HarnessError(
                    f"ThinLTO cache may not contain symbolic links: {candidate}"
                )
            if not candidate.is_file():
                continue
            resolved = candidate.resolve()
            try:
                relative = resolved.relative_to(root).as_posix()
            except ValueError as exc:
                raise HarnessError(
                    f"ThinLTO cache file escapes its root: {candidate}"
                ) from exc
            entries.append(
                {
                    "path": relative,
                    "sha256": _sha256_file(resolved),
                    "bytes": resolved.stat().st_size,
                }
            )
    payload = {
        "files": len(entries),
        "bytes": sum(item["bytes"] for item in entries),
        "entries": entries,
    }
    canonical = json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")
    return {**payload, "sha256": _sha256_bytes(canonical)}


def _warm_cache_paths(cache: Path) -> tuple[Path, Path]:
    resolved = cache.resolve()
    if resolved.name != "ring-lang-thinlto-cache":
        raise HarnessError(
            "warm cache must be a directory named 'ring-lang-thinlto-cache'"
        )
    return (
        resolved.parent / WARM_CACHE_RECEIPT_NAME,
        resolved.parent / WARM_CACHE_OUTPUT_NAME,
    )


def _seed_tool_records(tools: Mapping[str, str | None]) -> dict[str, Any]:
    records: dict[str, Any] = {}
    for name in ("python", "clang", "clangxx"):
        path = tools.get(name)
        if not isinstance(path, str) or not Path(path).is_file():
            raise HarnessError(f"warm-cache seed requires tool {name}")
        records[name] = {
            "path": str(Path(path).resolve()),
            "version": (
                platform.python_version() if name == "python" else _tool_version(path)
            ),
            "sha256": _sha256_file(Path(path)),
        }
    return records


def _warm_cache_seed_recipe(
    cache: Path, tools: Mapping[str, str | None]
) -> dict[str, Any]:
    _receipt_path, output = _warm_cache_paths(cache)
    records = _seed_tool_records(tools)
    argv = [
        records["python"]["path"],
        str((BENCH_DIR / "bootstrap.py").resolve()),
        "--repo",
        str(REPO_ROOT.resolve()),
        "--output-dir",
        str(output.resolve()),
        "--clang",
        records["clang"]["path"],
        "--clangxx",
        records["clangxx"]["path"],
        "--cache",
        str(cache.resolve()),
    ]
    return {
        "argv": argv,
        "cwd": str(REPO_ROOT.resolve()),
        "timeout_seconds": WARM_CACHE_SEED_TIMEOUT_SECONDS,
    }


def _warm_cache_source_identity() -> dict[str, Any]:
    return {
        "git_sha": _git(REPO_ROOT, "rev-parse", "HEAD"),
        "git_dirty": bool(
            _git(REPO_ROOT, "status", "--porcelain", "--untracked-files=no")
        ),
        "dist_c": _file_record(REPO_ROOT / "compiler" / "dist-c" / "main.c"),
        "runtime": _file_record(REPO_ROOT / "ring_runtime.cpp"),
        "bootstrap": _file_record(BENCH_DIR / "bootstrap.py"),
    }


def _warm_cache_flags(manifest: Mapping[str, Any]) -> dict[str, Any]:
    flags = manifest["fingerprint_flags"]
    return {
        "compiler": list(flags["compiler"]),
        "runtime": list(flags["runtime"]),
        "link": list(flags["link"]),
    }


def _validate_warm_cache_receipt_shape(receipt: Any) -> None:
    required = {
        "schema", "recipe_version", "source", "tools", "flags", "cache_path",
        "seed_invocation", "outcome", "cache_inventory",
    }
    if not isinstance(receipt, dict) or set(receipt) != required:
        raise HarnessError("warm-cache receipt fields differ from the strict contract")
    if receipt["schema"] != WARM_CACHE_RECEIPT_SCHEMA or receipt["recipe_version"] != 1:
        raise HarnessError("warm-cache receipt schema/version is unsupported")
    if not isinstance(receipt["source"], dict) or set(receipt["source"]) != {
        "git_sha", "git_dirty", "dist_c", "runtime", "bootstrap",
    }:
        raise HarnessError("warm-cache receipt source identity is malformed")
    source = receipt["source"]
    if (
        not isinstance(source["git_sha"], str)
        or len(source["git_sha"]) != 40
        or source["git_dirty"] is not False
    ):
        raise HarnessError("warm-cache receipt git identity is malformed")
    for name in ("dist_c", "runtime", "bootstrap"):
        value = source[name]
        if (
            not isinstance(value, dict)
            or set(value) != {"path", "sha256", "bytes"}
            or not isinstance(value["path"], str)
            or not Path(value["path"]).is_absolute()
            or not isinstance(value["sha256"], str)
            or len(value["sha256"]) != 64
            or not _is_trace_int(value["bytes"])
            or value["bytes"] < 0
        ):
            raise HarnessError(f"warm-cache receipt source {name} is malformed")
    if not isinstance(receipt["tools"], dict) or set(receipt["tools"]) != {
        "python", "clang", "clangxx",
    }:
        raise HarnessError("warm-cache receipt tool identity is malformed")
    for name, value in receipt["tools"].items():
        if (
            not isinstance(value, dict)
            or set(value) != {"path", "version", "sha256"}
            or not isinstance(value["path"], str)
            or not Path(value["path"]).is_absolute()
            or not isinstance(value["version"], str)
            or not value["version"]
            or not isinstance(value["sha256"], str)
            or len(value["sha256"]) != 64
        ):
            raise HarnessError(f"warm-cache receipt tool {name} is malformed")
    if not isinstance(receipt["flags"], dict) or set(receipt["flags"]) != {
        "compiler", "runtime", "link",
    }:
        raise HarnessError("warm-cache receipt flags are malformed")
    invocation = receipt["seed_invocation"]
    if not isinstance(invocation, dict) or set(invocation) != {
        "argv", "cwd", "timeout_seconds",
    }:
        raise HarnessError("warm-cache seed invocation is malformed")
    if (
        not isinstance(invocation["argv"], list)
        or not invocation["argv"]
        or not all(isinstance(item, str) and item for item in invocation["argv"])
        or not isinstance(invocation["cwd"], str)
        or not Path(invocation["cwd"]).is_absolute()
        or invocation["timeout_seconds"] != WARM_CACHE_SEED_TIMEOUT_SECONDS
    ):
        raise HarnessError("warm-cache seed invocation values are malformed")
    outcome = receipt["outcome"]
    if not isinstance(outcome, dict) or set(outcome) != {
        "exit_code", "stdout", "stderr",
    }:
        raise HarnessError("warm-cache seed outcome is malformed")
    if outcome["exit_code"] != 0:
        raise HarnessError("warm-cache receipt does not record a successful seed")
    for stream in ("stdout", "stderr"):
        value = outcome[stream]
        if (
            not isinstance(value, dict)
            or set(value) != {"sha256", "bytes"}
            or not isinstance(value["sha256"], str)
            or len(value["sha256"]) != 64
            or not _is_trace_int(value["bytes"])
            or value["bytes"] < 0
        ):
            raise HarnessError(f"warm-cache seed {stream} outcome is malformed")
    inventory = receipt["cache_inventory"]
    if not isinstance(inventory, dict) or set(inventory) != {
        "files", "bytes", "entries", "sha256",
    }:
        raise HarnessError("warm-cache inventory fields are malformed")
    entries = inventory["entries"]
    if not isinstance(entries, list) or not entries:
        raise HarnessError("warm-cache inventory must contain files")
    if any(
        not isinstance(item, dict)
        or set(item) != {"path", "sha256", "bytes"}
        or not isinstance(item["path"], str)
        or not item["path"]
        or Path(item["path"]).is_absolute()
        or ".." in Path(item["path"]).parts
        or not isinstance(item["sha256"], str)
        or len(item["sha256"]) != 64
        or not _is_trace_int(item["bytes"])
        or item["bytes"] < 0
        for item in entries
    ):
        raise HarnessError("warm-cache inventory entry is malformed")
    if [item["path"] for item in entries] != sorted(item["path"] for item in entries):
        raise HarnessError("warm-cache inventory entries are not canonical")
    if len({item["path"] for item in entries}) != len(entries):
        raise HarnessError("warm-cache inventory contains duplicate paths")
    payload = {
        "files": len(entries),
        "bytes": sum(item["bytes"] for item in entries),
        "entries": entries,
    }
    canonical = json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")
    if (
        inventory["files"] != payload["files"]
        or inventory["bytes"] != payload["bytes"]
        or inventory["sha256"] != _sha256_bytes(canonical)
    ):
        raise HarnessError("warm-cache inventory summary/hash is inconsistent")


def prepare_warm_cache_seed(
    manifest: Mapping[str, Any], tools: Mapping[str, str | None], cache: Path
) -> Path:
    cache = cache.resolve()
    receipt_path, output = _warm_cache_paths(cache)
    if receipt_path.exists():
        raise HarnessError(f"warm-cache receipt already exists: {receipt_path}")
    if output.exists():
        raise HarnessError(f"warm-cache seed output already exists: {output}")
    if cache.exists() and (not cache.is_dir() or any(cache.iterdir())):
        raise HarnessError(f"warm-cache seed requires a fresh empty cache: {cache}")
    cache.mkdir(parents=True, exist_ok=True)
    source = _warm_cache_source_identity()
    if source["git_dirty"]:
        raise HarnessError("warm-cache seed requires a clean tracked worktree")
    recipe = _warm_cache_seed_recipe(cache, tools)
    try:
        completed = subprocess.run(
            recipe["argv"], cwd=recipe["cwd"], capture_output=True,
            timeout=recipe["timeout_seconds"], check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise HarnessError(f"warm-cache seed invocation failed: {exc}") from exc
    if completed.returncode != 0:
        raise HarnessError(
            "warm-cache seed failed with exit "
            f"{completed.returncode}; output retained at {output}"
        )
    inventory = _cache_inventory(cache)
    if inventory["files"] == 0:
        raise HarnessError("warm-cache seed succeeded but produced an empty cache")
    receipt = {
        "schema": WARM_CACHE_RECEIPT_SCHEMA,
        "recipe_version": 1,
        "source": source,
        "tools": _seed_tool_records(tools),
        "flags": _warm_cache_flags(manifest),
        "cache_path": str(cache),
        "seed_invocation": recipe,
        "outcome": {
            "exit_code": completed.returncode,
            "stdout": _bytes_record(completed.stdout),
            "stderr": _bytes_record(completed.stderr),
        },
        "cache_inventory": inventory,
    }
    _validate_warm_cache_receipt_shape(receipt)
    try:
        shutil.rmtree(output)
    except OSError as exc:
        raise HarnessError(f"cannot remove bounded warm-cache seed output: {exc}") from exc
    _json_dump(receipt_path, receipt)
    return receipt_path


def validate_warm_cache_seed(
    manifest: Mapping[str, Any], tools: Mapping[str, str | None], cache: Path
) -> tuple[Path, dict[str, Any]]:
    cache = cache.resolve()
    receipt_path, _output = _warm_cache_paths(cache)
    receipt = _load_json(receipt_path)
    _validate_warm_cache_receipt_shape(receipt)
    assert isinstance(receipt, dict)
    expected = {
        "source": _warm_cache_source_identity(),
        "tools": _seed_tool_records(tools),
        "flags": _warm_cache_flags(manifest),
        "cache_path": str(cache),
        "seed_invocation": _warm_cache_seed_recipe(cache, tools),
        "cache_inventory": _cache_inventory(cache),
    }
    for field, value in expected.items():
        if receipt[field] != value:
            raise HarnessError(f"warm-cache seed {field} drifted from its receipt")
    if receipt["source"]["git_dirty"]:
        raise HarnessError("warm-cache seed receipt was captured from a dirty worktree")
    return receipt_path, receipt


def validate_retained_warm_cache_seed(
    environment: Mapping[str, Any], run_dir: Path
) -> Mapping[str, Any]:
    state = environment.get("cache_state")
    if state not in ALLOWED_CACHE_STATES:
        raise HarnessError("formal environment cache_state is unsupported")
    seed = environment.get("warm_cache_seed")
    if not isinstance(seed, dict) or set(seed) != {"identity", "receipt"}:
        raise HarnessError("formal environment lacks a warm-cache seed receipt")
    identity = seed["identity"]
    _validate_warm_cache_receipt_shape(identity)
    retained = (run_dir.resolve() / "warm-cache-seed-receipt.json").resolve()
    actual_record = _actual_file_record(retained, "warm-cache seed receipt")
    if seed["receipt"] != actual_record:
        raise HarnessError("warm-cache receipt file provenance mismatch")
    if _load_json(retained) != identity:
        raise HarnessError("retained warm-cache receipt content mismatch")
    if environment.get("thinlto_cache_inventory") != identity["cache_inventory"]:
        raise HarnessError("formal cache bytes differ from the warm-cache seed")
    source = identity["source"]
    if source["git_sha"] != environment.get("source_sha") or source["git_dirty"]:
        raise HarnessError("warm-cache seed source commit mismatch")
    if source["dist_c"].get("sha256") != environment.get("dist_c_sha256"):
        raise HarnessError("warm-cache seed dist-c identity mismatch")
    if source["runtime"].get("sha256") != environment.get("runtime_sha256"):
        raise HarnessError("warm-cache seed runtime identity mismatch")
    tools = environment.get("tools")
    if not isinstance(tools, dict):
        raise HarnessError("formal environment tool identity is missing")
    for name in ("python", "clang", "clangxx"):
        if identity["tools"][name] != tools.get(name):
            raise HarnessError(f"warm-cache seed tool {name} identity mismatch")
    flags = environment.get("flags")
    if not isinstance(flags, dict) or identity["flags"] != {
        "compiler": flags.get("compiler"),
        "runtime": flags.get("runtime"),
        "link": flags.get("link"),
    }:
        raise HarnessError("warm-cache seed build flags mismatch")
    return identity


def capture_environment(
    manifest: Mapping[str, Any],
    manifest_sha: str,
    run_id: str,
    tools: Mapping[str, str | None],
    thinlto_cache: Path,
    cache_state: str | None,
    warm_cache_seed: Mapping[str, Any] | None,
    warm_cache_receipt_path: Path | None,
) -> dict[str, Any]:
    source_sha = _git(REPO_ROOT, "rev-parse", "HEAD")
    dirty = bool(_git(REPO_ROOT, "status", "--porcelain", "--untracked-files=no"))
    anchor = REPO_ROOT / "compiler" / "dist-c" / "main.c"
    runtime = REPO_ROOT / "ring_runtime.cpp"
    tool_records: dict[str, Any] = {}
    for name, path in tools.items():
        tool_records[name] = {
            "path": path,
            "version": (
                platform.python_version() if name == "python" else _tool_version(path)
            ),
            "sha256": _sha256_file(Path(path)) if path and Path(path).is_file() else None,
        }
    cache_inventory = _cache_inventory(thinlto_cache)
    return {
        "schema": ENVIRONMENT_SCHEMA,
        "run_id": run_id,
        "captured_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source_sha": source_sha,
        "git_dirty": dirty,
        "manifest_sha": manifest_sha,
        "dist_c_sha256": _sha256_file(anchor),
        "runtime_sha256": _sha256_file(runtime),
        "tools": tool_records,
        "flags": manifest["fingerprint_flags"],
        "cache_state": cache_state,
        "thinlto_cache_path": str(thinlto_cache.resolve()),
        "thinlto_cache_inventory": cache_inventory,
        "warm_cache_seed": (
            {
                "identity": dict(warm_cache_seed),
                "receipt": _file_record(warm_cache_receipt_path),
            }
            if warm_cache_seed is not None and warm_cache_receipt_path is not None
            else None
        ),
        "os": {
            "system": platform.system(),
            "release": platform.release(),
            "version": platform.version(),
            "machine": platform.machine(),
        },
        "cpu": {
            "model": _windows_cpu_model(),
            "logical_cores": os.cpu_count(),
        },
        "memory_bytes": _windows_memory_bytes(),
        "power": _windows_power(),
    }


def _optional_file_state(path: Path) -> dict[str, Any]:
    exists = path.is_file()
    return {
        "exists": exists,
        "sha256": _sha256_file(path) if exists else None,
        "bytes": path.stat().st_size if exists else None,
        "mtime_ns": path.stat().st_mtime_ns if exists else None,
    }


def prepare_runner_runtime(
    manifest: Mapping[str, Any],
    lanes: Sequence[Mapping[str, Any]],
    cache_state: str | None,
    tools: Mapping[str, str | None],
    run_dir: Path,
) -> dict[str, Any]:
    """Prepare an isolated runner ``ring_runtime.o`` state outside measurement."""

    root_object = REPO_ROOT / "ring_runtime.o"
    source = REPO_ROOT / "ring_runtime.cpp"
    needs_object = any(lane.get("isolate_runner_runtime", False) for lane in lanes)
    flags = list(manifest["fingerprint_flags"]["runner_runtime"])
    setup: dict[str, Any] = {
        "mode": cache_state if needs_object else "not_applicable",
        "isolated": needs_object,
        "root_path": str(root_object.resolve()),
        "source_sha256": _sha256_file(source),
        "flags": flags,
        "original_root": _optional_file_state(root_object),
        "prepared": None,
        "preparation_stdout": None,
        "preparation_stderr": None,
    }
    if not needs_object or cache_state == "cold":
        return setup
    if cache_state != "warm":
        raise HarnessError("runner runtime isolation requires a cold or warm cache state")
    clangxx = tools.get("clangxx")
    if clangxx is None:
        raise HarnessError("warm runner runtime preparation requires clang++")

    prepared_dir = run_dir / "prepared" / "runner-runtime"
    prepared_dir.mkdir(parents=True, exist_ok=False)
    prepared_object = prepared_dir / "ring_runtime.o"
    stdout_path = prepared_dir / "stdout.txt"
    stderr_path = prepared_dir / "stderr.txt"
    command = [
        clangxx,
        "-c",
        str(source),
        "-o",
        str(prepared_object),
        *flags,
    ]
    completed = subprocess.run(
        command,
        cwd=REPO_ROOT,
        capture_output=True,
        timeout=120,
        check=False,
    )
    stdout_path.write_bytes(completed.stdout)
    stderr_path.write_bytes(completed.stderr)
    if completed.returncode != 0 or not prepared_object.is_file():
        raise HarnessError(
            "warm runner runtime preparation failed; see "
            f"{stdout_path} and {stderr_path}"
        )
    if prepared_object.stat().st_mtime_ns < source.stat().st_mtime_ns:
        timestamp = source.stat().st_mtime_ns + 1_000_000_000
        os.utime(prepared_object, ns=(timestamp, timestamp))
    setup["prepared"] = {
        **_optional_file_state(prepared_object),
        "path": str(prepared_object.resolve()),
        "argv": command,
    }
    setup["preparation_stdout"] = _file_record(stdout_path)
    setup["preparation_stderr"] = _file_record(stderr_path)
    return setup


def _begin_runner_runtime_isolation(
    lane: Mapping[str, Any],
    setup: Mapping[str, Any],
    sample_dir: Path,
) -> tuple[dict[str, Any], dict[str, Any]]:
    applies = bool(lane.get("isolate_runner_runtime", False))
    root_object = Path(setup["root_path"])
    token = re.sub(r"[^a-zA-Z0-9_-]", "_", sample_dir.name)
    backup = root_object.with_name(f"ring_runtime.b176-{token}.backup.o")
    staging = root_object.with_name(f"ring_runtime.b176-{token}.install.o")
    transaction = {
        "root": root_object,
        "backup": backup,
        "staging": staging,
        "applies": applies,
    }
    record: dict[str, Any] = {
        "mode": setup["mode"] if applies else "not_applicable",
        "isolated": applies,
        "root_path": setup["root_path"] if applies else None,
        "source_sha256": setup["source_sha256"] if applies else None,
        "flags": list(setup["flags"]) if applies else [],
        "original_exists": False,
        "original_sha256": None,
        "pre_exists": False,
        "pre_sha256": None,
        "post_exists": False,
        "post_sha256": None,
        "restored": True,
        "backup_path": str(backup.resolve()) if applies else None,
        "backup_exists_after": False,
        "staging_path": str(staging.resolve()) if applies else None,
        "staging_exists_after": False,
        "errors": [],
    }
    if not applies:
        return record, transaction

    if backup.exists() or staging.exists():
        raise HarnessError(
            "runner runtime transaction path already exists; refusing to overwrite "
            f"backup={backup.exists()} staging={staging.exists()}"
        )
    original = _optional_file_state(root_object)
    record["original_exists"] = original["exists"]
    record["original_sha256"] = original["sha256"]
    expected_original = setup["original_root"]
    if (
        original["exists"] != expected_original["exists"]
        or original["sha256"] != expected_original["sha256"]
    ):
        raise HarnessError("root runtime object changed since environment capture")

    original_moved = False
    try:
        if original["exists"]:
            # Both paths are beside one another, so os.replace is an atomic
            # same-volume rename.  A failed call leaves the sole original at
            # one of these two known paths; it is never unlinked first.
            os.replace(root_object, backup)
            original_moved = True
            if _sha256_file(backup) != original["sha256"]:
                raise HarnessError("runner runtime backup hash mismatch")
        if setup["mode"] == "warm":
            prepared = setup.get("prepared")
            if not isinstance(prepared, dict) or not prepared.get("path"):
                raise HarnessError("warm runner runtime object was not prepared")
            # Copy into a sibling staging file, verify it, then atomically
            # install.  A partial copy can never replace the root path.
            shutil.copy2(Path(prepared["path"]), staging)
            if _sha256_file(staging) != prepared["sha256"]:
                raise HarnessError("runner runtime install staging hash mismatch")
            os.replace(staging, root_object)
            source = REPO_ROOT / "ring_runtime.cpp"
            if root_object.stat().st_mtime_ns < source.stat().st_mtime_ns:
                timestamp = source.stat().st_mtime_ns + 1_000_000_000
                os.utime(root_object, ns=(timestamp, timestamp))
        pre = _optional_file_state(root_object)
        record["pre_exists"] = pre["exists"]
        record["pre_sha256"] = pre["sha256"]
        return record, transaction
    except BaseException as exc:
        recovery_errors: list[str] = []
        # An injected/OS error may occur after an atomic rename completed, so
        # inspect the paths as well as the local flag before recovery.
        original_moved = original_moved or (
            bool(original["exists"]) and backup.is_file() and not root_object.is_file()
        )
        try:
            if original_moved:
                if backup.is_file():
                    try:
                        os.replace(backup, root_object)
                    except OSError as restore_exc:
                        recovery_errors.append(f"restore failed: {restore_exc}")
                else:
                    recovery_errors.append("restore failed: backup disappeared")
            elif not original["exists"] and root_object.is_file():
                try:
                    root_object.unlink()
                except OSError as cleanup_exc:
                    recovery_errors.append(f"installed-object cleanup failed: {cleanup_exc}")
        finally:
            if staging.exists():
                try:
                    staging.unlink()
                except OSError as cleanup_exc:
                    recovery_errors.append(f"staging cleanup failed: {cleanup_exc}")
        if recovery_errors:
            raise HarnessError(
                f"runner runtime transaction failed: {exc}; "
                f"recovery={' | '.join(recovery_errors)}; "
                f"root_exists={root_object.is_file()} "
                f"backup_exists={backup.is_file()} "
                f"staging_exists={staging.is_file()}"
            ) from exc
        raise HarnessError(
            f"runner runtime transaction failed and was safely rolled back: {exc}"
        ) from exc


def _finish_runner_runtime_isolation(
    record: dict[str, Any],
    setup: Mapping[str, Any],
    transaction: Mapping[str, Any],
) -> None:
    if not record["isolated"]:
        return
    root_object = Path(transaction["root"])
    backup = Path(transaction["backup"])
    staging = Path(transaction["staging"])
    try:
        post = _optional_file_state(root_object)
        record["post_exists"] = post["exists"]
        record["post_sha256"] = post["sha256"]
        if not post["exists"]:
            record["errors"].append("runner did not materialize ring_runtime.o")
        if record["mode"] == "warm" and post["exists"]:
            prepared = setup.get("prepared")
            expected_hash = prepared.get("sha256") if isinstance(prepared, dict) else None
            if post["sha256"] != expected_hash:
                record["errors"].append("runner replaced the prepared warm runtime object")
    finally:
        # Restore first.  os.replace atomically swaps the preserved original
        # over any generated object without deleting the backup beforehand.
        try:
            if record["original_exists"]:
                if backup.is_file():
                    try:
                        os.replace(backup, root_object)
                    except OSError as restore_exc:
                        record["errors"].append(f"original restore failed: {restore_exc}")
                else:
                    current = _optional_file_state(root_object)
                    if current["sha256"] != record["original_sha256"]:
                        record["errors"].append("original restore failed: backup missing")
            elif root_object.exists():
                try:
                    root_object.unlink()
                except OSError as cleanup_exc:
                    record["errors"].append(
                        f"generated runtime cleanup failed: {cleanup_exc}"
                    )
        finally:
            # Cleanup can fail independently, but it must never prevent the
            # original-object restoration attempt above.
            if staging.exists():
                try:
                    staging.unlink()
                except OSError as cleanup_exc:
                    record["errors"].append(f"install staging cleanup failed: {cleanup_exc}")
        restored = _optional_file_state(root_object)
        record["restored"] = (
            restored["exists"] == record["original_exists"]
            and restored["sha256"] == record["original_sha256"]
        )
        record["backup_exists_after"] = backup.is_file()
        record["staging_exists_after"] = staging.is_file()
        if not record["restored"]:
            record["errors"].append(
                "failed to restore root runtime state; preserved backup is retained when present"
            )


def _context(
    tools: Mapping[str, str | None],
    run_dir: Path,
    sample_dir: Path,
    thinlto_cache: Path,
) -> dict[str, str]:
    missing = [name for name, value in tools.items() if value is None]
    values = {name: value or f"<missing:{name}>" for name, value in tools.items()}
    values.update(
        {
            "repo": str(REPO_ROOT),
            "run_dir": str(run_dir),
            "sample_dir": str(sample_dir),
            "thinlto_cache": str(thinlto_cache),
        }
    )
    if "python" in missing:
        raise HarnessError("current Python executable could not be resolved")
    return values


def _format(text: str, context: Mapping[str, str]) -> str:
    try:
        return text.format_map(context)
    except KeyError as exc:
        raise HarnessError(f"unknown placeholder {exc.args[0]!r} in {text!r}") from exc


def select_lanes(lanes: Sequence[dict[str, Any]], selected: Sequence[str]) -> list[dict[str, Any]]:
    by_id = {lane["case_id"]: lane for lane in lanes}
    missing = [case_id for case_id in selected if case_id not in by_id]
    if missing:
        raise HarnessError(f"unknown case ids: {missing}")
    return [by_id[case_id] for case_id in selected]


def preflight_lanes(
    lanes: Sequence[Mapping[str, Any]],
    tools: Mapping[str, str | None],
    run_dir: Path,
    thinlto_cache: Path,
) -> None:
    errors: list[str] = []
    dummy = run_dir / "preflight-sample"
    context = _context(tools, run_dir, dummy, thinlto_cache)
    for lane in lanes:
        case_id = lane["case_id"]
        argv = [_format(item, context) for item in lane["argv"]]
        cwd = Path(_format(lane["cwd"], context))
        if not cwd.is_dir():
            errors.append(f"{case_id}: cwd does not exist: {cwd}")
        executable = Path(argv[0])
        if not executable.is_file() and shutil.which(argv[0]) is None:
            errors.append(f"{case_id}: executable does not exist: {argv[0]}")
        for requirement in lane["requires"]:
            if requirement.startswith("tool:"):
                tool = requirement.removeprefix("tool:")
                if tool not in tools or tools[tool] is None:
                    errors.append(f"{case_id}: required tool is unavailable: {tool}")
            elif requirement.startswith("path:"):
                path = Path(_format(requirement.removeprefix("path:"), context))
                if not path.exists():
                    errors.append(f"{case_id}: required path does not exist: {path}")
            else:
                errors.append(f"{case_id}: invalid requirement {requirement!r}")
        for output in lane["artifacts"] + lane["phase_trace_paths"]:
            path = Path(_format(output, context)).resolve()
            try:
                path.relative_to(dummy.resolve())
            except ValueError:
                errors.append(f"{case_id}: output escapes sample_dir: {path}")
    if errors:
        raise HarnessError("preflight failed:\n  " + "\n  ".join(errors))


def _file_record(path: Path) -> dict[str, Any]:
    return {
        "path": str(path.resolve()),
        "sha256": _sha256_file(path),
        "bytes": path.stat().st_size,
    }


def _artifact_records(paths: Iterable[Path]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for path in paths:
        exists = path.is_file()
        records.append(
            {
                "path": str(path.resolve()),
                "exists": exists,
                "sha256": _sha256_file(path) if exists else None,
                "bytes": path.stat().st_size if exists else None,
            }
        )
    return records


def _phase_trace_records(paths: Iterable[Path]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for path in paths:
        if not path.is_file():
            continue
        resolved = str(path.resolve())
        line_number = 0
        try:
            with path.open("r", encoding="utf-8") as stream:
                for line_number, line in enumerate(stream, 1):
                    if not line.strip():
                        continue
                    try:
                        value = _strict_json_loads(
                            line, f"phase trace {resolved}:{line_number}"
                        )
                    except DuplicateJsonKeyError:
                        records.append(
                            {
                                "path": resolved,
                                "line": line_number,
                                "value": None,
                                "read_error": "duplicate_json_key",
                            }
                        )
                        continue
                    except HarnessError:
                        records.append(
                            {
                                "path": resolved,
                                "line": line_number,
                                "value": None,
                                "read_error": "invalid_json",
                            }
                        )
                        continue
                    if not isinstance(value, dict):
                        records.append(
                            {
                                "path": resolved,
                                "line": line_number,
                                "value": None,
                                "read_error": "row_not_object",
                            }
                        )
                        continue
                    records.append(
                        {
                            "path": resolved,
                            "line": line_number,
                            "value": value,
                            "read_error": None,
                        }
                    )
        except (OSError, UnicodeError):
            records.append(
                {
                    "path": resolved,
                    "line": line_number + 1,
                    "value": None,
                    "read_error": "io_or_unicode_error",
                }
            )
    return records


def resolve_phase_trace_paths(
    lane: Mapping[str, Any], sample_dir: Path
) -> list[Path]:
    resolved: list[Path] = []
    for template in lane["phase_trace_paths"]:
        if _placeholders(template) != {"sample_dir"}:
            raise HarnessError("phase trace path cannot be reconstructed from sample_dir")
        resolved.append(
            Path(template.replace("{sample_dir}", str(sample_dir.resolve()))).resolve()
        )
    return resolved


def _is_trace_int(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def resolve_invocation_entry(argv: Sequence[str], cwd: str) -> str:
    if len(argv) < 3:
        raise HarnessError("direct compiler invocation has no entry argv")
    entry = Path(argv[2])
    if not entry.is_absolute():
        entry = Path(cwd) / entry
    return str(entry.resolve())


@dataclass(frozen=True)
class PhaseValidation:
    hard_errors: tuple[str, ...]
    eligibility_errors: tuple[str, ...]


def _classify_compiler_phase_rows(
    rows: Sequence[Mapping[str, Any]],
    *,
    expected_lane: str,
    expected_compiler_identity: str,
    expected_source_identity: str,
    expected_entry_file: str,
    expected_success: bool,
    expected_executed_phases: Sequence[str],
    wall_ns: int | None,
) -> PhaseValidation:
    hard: list[str] = []
    eligibility: list[str] = []
    required = {
        "schema",
        "schema_version",
        "lane",
        "phase",
        "duration_ns",
        "unit",
        "compiler_identity",
        "source_identity",
        "entry_file",
        "executed",
        "complete",
        "command_success",
    }
    valid_rows: list[Mapping[str, Any]] = []
    for index, row in enumerate(rows, 1):
        prefix = f"compiler phase row {index}"
        if set(row) != required:
            hard.append(
                f"{prefix} fields differ: missing={sorted(required - set(row))}, "
                f"unknown={sorted(set(row) - required)}"
            )
            continue
        valid_rows.append(row)
        if (
            row["schema"] != COMPILER_PHASE_SCHEMA
            or not _is_trace_int(row["schema_version"])
            or row["schema_version"] != 1
        ):
            hard.append(f"{prefix} has unsupported schema/version")
        if not isinstance(row["phase"], str):
            hard.append(f"{prefix} phase must be a string")
        if row["lane"] != expected_lane:
            hard.append(f"{prefix} lane identity mismatch")
        if row["compiler_identity"] != expected_compiler_identity:
            hard.append(f"{prefix} compiler identity mismatch")
        if row["source_identity"] != expected_source_identity:
            hard.append(f"{prefix} source identity mismatch")
        if not isinstance(row["entry_file"], str):
            hard.append(f"{prefix} entry_file must be a string")
        elif row["entry_file"] and not Path(row["entry_file"]).is_absolute():
            hard.append(f"{prefix} entry_file must be absolute")
        if row["entry_file"] != expected_entry_file:
            hard.append(f"{prefix} entry_file identity mismatch")
        if row["unit"] != "ns":
            hard.append(f"{prefix} unit must be ns")
        duration = row["duration_ns"]
        if not _is_trace_int(duration) or not 0 <= duration <= RING_INT_MAX:
            hard.append(f"{prefix} duration_ns is outside Ring Int nanoseconds")
        if not isinstance(row["executed"], bool):
            hard.append(f"{prefix} executed must be boolean")
        if not isinstance(row["complete"], bool):
            hard.append(f"{prefix} complete must be boolean")
        elif not row["complete"]:
            eligibility.append(f"{prefix} is incomplete")
        if not isinstance(row["command_success"], bool):
            hard.append(f"{prefix} command_success must be boolean")
        elif row["command_success"] != expected_success:
            eligibility.append(f"{prefix} command outcome mismatch")
        if row["executed"] is False and _is_trace_int(duration) and duration != 0:
            eligibility.append(f"{prefix} skipped phase must have zero duration")

    if any(
        not isinstance(row.get("phase"), str)
        or not isinstance(row.get("entry_file"), str)
        for row in valid_rows
    ):
        return PhaseValidation(tuple(hard), tuple(eligibility))
    phases = [row["phase"] for row in valid_rows]
    if phases != list(COMPILER_PHASE_ORDER):
        hard.append(
            f"compiler phase order/coverage mismatch: expected "
            f"{list(COMPILER_PHASE_ORDER)}, got {phases}"
        )
        return PhaseValidation(tuple(hard), tuple(eligibility))
    entry_files = {row["entry_file"] for row in valid_rows}
    if len(entry_files) != 1:
        hard.append("compiler phase rows disagree on entry_file")
    by_phase = {row["phase"]: row for row in valid_rows}
    if by_phase["input_entry_load"]["executed"] and not by_phase[
        "input_entry_load"
    ]["entry_file"]:
        hard.append("executed input_entry_load requires a non-empty entry_file")
    expected_executed = set(expected_executed_phases)
    for phase in COMPILER_PHASE_ORDER:
        expected = phase in expected_executed
        if by_phase[phase]["executed"] is not expected:
            eligibility.append(
                f"compiler phase {phase} executed={by_phase[phase]['executed']!r}; "
                f"expected {expected}"
            )
    phase_sum = sum(
        row["duration_ns"]
        for row in valid_rows
        if row["phase"] != "command_total" and _is_trace_int(row["duration_ns"])
    )
    command_total = by_phase["command_total"]["duration_ns"]
    if _is_trace_int(command_total) and phase_sum > command_total:
        eligibility.append(
            f"compiler phase sum {phase_sum} exceeds command total {command_total}"
        )
    if wall_ns is None or not _is_trace_int(wall_ns):
        eligibility.append("job wall time is unavailable for compiler phase validation")
    elif _is_trace_int(command_total) and command_total > wall_ns:
        eligibility.append(
            f"compiler command total {command_total} exceeds job wall time {wall_ns}"
        )
    return PhaseValidation(tuple(hard), tuple(eligibility))


def _classify_bootstrap_phase_rows(
    rows: Sequence[Mapping[str, Any]], *, wall_ns: int | None
) -> PhaseValidation:
    hard: list[str] = []
    eligibility: list[str] = []
    required = {"schema", "phase", "argv", "wall_ns", "exit_code"}
    valid_rows: list[Mapping[str, Any]] = []
    for index, row in enumerate(rows, 1):
        prefix = f"bootstrap phase row {index}"
        if set(row) != required:
            hard.append(
                f"{prefix} fields differ: missing={sorted(required - set(row))}, "
                f"unknown={sorted(set(row) - required)}"
            )
            continue
        valid_rows.append(row)
        if row["schema"] != BOOTSTRAP_PHASE_SCHEMA:
            hard.append(f"{prefix} has unsupported schema")
        if not isinstance(row["phase"], str):
            hard.append(f"{prefix} phase must be a string")
        if not isinstance(row["argv"], list) or not row["argv"] or not all(
            isinstance(item, str) and item for item in row["argv"]
        ):
            hard.append(f"{prefix} argv must be a non-empty string array")
        if not _is_trace_int(row["wall_ns"]) or row["wall_ns"] < 0:
            hard.append(f"{prefix} wall_ns must be non-negative")
        if not _is_trace_int(row["exit_code"]):
            hard.append(f"{prefix} exit_code must be an integer")
        elif row["exit_code"] != 0:
            eligibility.append(f"{prefix} is incomplete (exit {row['exit_code']})")
    phases = [row.get("phase") for row in valid_rows]
    if phases != list(BOOTSTRAP_PHASE_ORDER):
        hard.append(
            f"bootstrap phase order/coverage mismatch: expected "
            f"{list(BOOTSTRAP_PHASE_ORDER)}, got {phases}"
        )
    phase_sum = sum(
        row["wall_ns"] for row in valid_rows if _is_trace_int(row["wall_ns"])
    )
    if wall_ns is None or not _is_trace_int(wall_ns):
        eligibility.append("job wall time is unavailable for bootstrap phase validation")
    elif phase_sum > wall_ns:
        eligibility.append(f"bootstrap phase sum {phase_sum} exceeds job wall time {wall_ns}")
    return PhaseValidation(tuple(hard), tuple(eligibility))


def _classify_phase_trace_records(
    records: Sequence[Mapping[str, Any]],
    *,
    paths: Sequence[Path],
    sample_dir: Path,
    lane: Mapping[str, Any],
    environment: Mapping[str, Any],
    expected_entry_file: str,
    exit_code: int | None,
    wall_ns: int | None,
) -> PhaseValidation:
    hard: list[str] = []
    eligibility: list[str] = []
    sample_root = sample_dir.resolve()
    declared = [str(path.resolve()) for path in paths]
    if len(declared) != len(set(declared)):
        hard.append("declared phase trace paths are not unique")
    for path in paths:
        try:
            path.resolve().relative_to(sample_root)
        except ValueError:
            hard.append(f"declared phase trace path escapes sample_dir: {path.resolve()}")
    grouped: dict[str, list[Mapping[str, Any]]] = {path: [] for path in declared}
    required_wrapper = {"path", "line", "value", "read_error"}
    for record in records:
        if set(record) != required_wrapper:
            hard.append("phase trace wrapper fields differ from the strict contract")
            continue
        path = record.get("path")
        if path not in grouped:
            hard.append("phase trace record is not associated with a declared path")
            continue
        grouped[path].append(record)

    compiler_expected = lane.get("compiler_phase_timing", False)
    expected_schema = COMPILER_PHASE_SCHEMA if compiler_expected else BOOTSTRAP_PHASE_SCHEMA
    for path, wrappers in grouped.items():
        if not wrappers:
            eligibility.append(f"phase trace {path} has no rows")
            continue
        lines = [wrapper.get("line") for wrapper in wrappers]
        if any(not _is_trace_int(line) or line < 1 for line in lines):
            hard.append(f"phase trace {path} has invalid line numbers")
        elif lines != list(range(1, len(wrappers) + 1)):
            hard.append(
                f"phase trace {path} line numbers must be unique and contiguous from 1"
            )
        rows: list[Mapping[str, Any]] = []
        for wrapper in wrappers:
            value = wrapper.get("value")
            read_error = wrapper.get("read_error")
            if read_error is not None:
                if read_error == "duplicate_json_key":
                    hard.append(
                        f"phase trace {path}:{wrapper.get('line')} contains a duplicate JSON key"
                    )
                elif read_error not in {
                    "invalid_json",
                    "row_not_object",
                    "io_or_unicode_error",
                }:
                    hard.append(
                        f"phase trace {path}:{wrapper.get('line')} has unknown read error"
                    )
                else:
                    eligibility.append(
                        f"phase trace {path}:{wrapper.get('line')} read error: {read_error}"
                    )
                if value is not None:
                    hard.append(
                        f"phase trace {path}:{wrapper.get('line')} has value and read error"
                    )
            elif isinstance(value, dict):
                rows.append(value)
            else:
                hard.append(
                    f"phase trace {path}:{wrapper.get('line')} has neither row nor read error"
                )
        if not rows:
            continue
        schemas = [row.get("schema") for row in rows]
        if any(not isinstance(schema, str) for schema in schemas) or set(schemas) != {expected_schema}:
            hard.append(
                f"phase trace {path} schema mismatch: expected {expected_schema}, "
                f"got {sorted(str(schema) for schema in schemas)}"
            )
            continue
        if compiler_expected:
            compiler_sha = environment.get("tools", {}).get("ring", {}).get("sha256")
            source_sha = environment.get("source_sha")
            if not isinstance(compiler_sha, str) or not compiler_sha:
                hard.append("compiler executable identity is unavailable")
                continue
            if not isinstance(source_sha, str) or not source_sha:
                hard.append("source identity is unavailable")
                continue
            classified = _classify_compiler_phase_rows(
                    rows,
                    expected_lane=lane["case_id"],
                    expected_compiler_identity=f"sha256:{compiler_sha}",
                    expected_source_identity=f"git:{source_sha}",
                    expected_entry_file=expected_entry_file,
                    expected_success=exit_code == 0,
                    expected_executed_phases=lane["expected_executed_phases"],
                    wall_ns=wall_ns,
                )
            hard.extend(classified.hard_errors)
            eligibility.extend(classified.eligibility_errors)
        else:
            classified = _classify_bootstrap_phase_rows(rows, wall_ns=wall_ns)
            hard.extend(classified.hard_errors)
            eligibility.extend(classified.eligibility_errors)
    return PhaseValidation(tuple(hard), tuple(eligibility))


def _runner_summary(stdout_path: Path) -> dict[str, Any] | None:
    text = stdout_path.read_text(encoding="utf-8", errors="replace")
    suite_counts: dict[str, dict[str, int]] = {}
    status_counts = {"pass": 0, "fail": 0, "skip": 0}
    for match in re.finditer(r"^\[(PASS|FAIL|SKIP)\]\s+([^:\r\n]+):", text, re.MULTILINE):
        status = match.group(1).lower()
        suite = match.group(2).strip()
        status_counts[status] += 1
        suite_record = suite_counts.setdefault(suite, {"pass": 0, "fail": 0, "skip": 0})
        suite_record[status] += 1
    exit_matches = list(
        re.finditer(
            r"^Exit code:\s*(-?\d+)(?:\s+\([^\r\n]*\))?\s*$",
            text,
            re.MULTILINE,
        )
    )
    final_exit = (
        exit_matches[0]
        if len(exit_matches) == 1 and not text[exit_matches[0].end() :].strip()
        else None
    )
    if not suite_counts and not exit_matches:
        return None
    return {
        "status_counts": status_counts,
        "suite_counts": suite_counts,
        "reported_exit_code": int(final_exit.group(1)) if final_exit else None,
    }


def _validate_runner_summary_result(
    summary: Mapping[str, Any], contract: Mapping[str, Any], raw_exit_code: int | None
) -> None:
    reported = summary.get("reported_exit_code")
    if not _is_trace_int(reported):
        raise HarnessError("runner summary is missing its unique final reported exit")
    if not _is_trace_int(raw_exit_code) or reported != raw_exit_code:
        raise HarnessError(
            "runner reported exit does not match the raw process exit"
        )
    statuses = summary.get("status_counts")
    suites = summary.get("suite_counts")
    if not isinstance(statuses, dict) or not isinstance(suites, dict):
        raise HarnessError("runner summary counts are malformed")
    failures = statuses.get("fail")
    if not _is_trace_int(failures) or ((raw_exit_code == 0) != (failures == 0)):
        raise HarnessError("runner raw exit and failure count are inconsistent")
    if statuses != contract["expected_status_counts"]:
        raise HarnessError(
            "runner status counts do not match the manifest contract"
        )
    if suites != contract["expected_suite_counts"]:
        raise HarnessError(
            "runner suite counts do not match the manifest contract"
        )
    if sum(statuses.values()) != contract["expected_total"]:
        raise HarnessError("runner total does not match the manifest contract")


def derive_invalid_reason(
    *,
    policy: str,
    index: int,
    invocation_error: str | None,
    measurement: Mapping[str, Any],
    exit_code: int | None,
    expected_exit_codes: Sequence[int],
    runner_expected: bool,
    runner_summary: Mapping[str, Any] | None,
    artifacts: Sequence[Mapping[str, Any]],
    phase_errors: Sequence[str],
    runtime_errors: Sequence[str],
) -> str | None:
    if policy not in ALLOWED_POLICIES:
        raise HarnessError(f"cannot derive eligibility for unknown policy {policy!r}")
    warmups = DIRECT_WARMUPS if policy == "direct_short" else 0
    if index < warmups:
        return "warmup"
    if invocation_error is not None:
        return f"measurement_error: {invocation_error}"
    if measurement["timed_out"]:
        return "timeout"
    if exit_code not in expected_exit_codes:
        return f"unexpected_exit: {exit_code}"
    exact_fields = (
        "cpu_user_ns",
        "cpu_kernel_ns",
        "peak_root_rss_bytes",
        "peak_job_commit_bytes",
        "process_count",
        "job_io",
    )
    missing = [field for field in exact_fields if measurement.get(field) is None]
    if missing:
        return f"missing_exact_metrics: {','.join(missing)}"
    if measurement["measurement_errors"]:
        return f"measurement_errors: {'; '.join(measurement['measurement_errors'])}"
    if not measurement["rss_complete"]:
        return "rss_incomplete"
    if runtime_errors:
        return f"runner_runtime_invalid: {'; '.join(runtime_errors)}"
    if runner_expected and runner_summary is None:
        return "runner_summary_missing"
    missing_artifacts = [item["path"] for item in artifacts if not item["exists"]]
    if missing_artifacts:
        return f"artifact_missing: {','.join(missing_artifacts)}"
    if phase_errors:
        return f"phase_trace_invalid: {'; '.join(phase_errors)}"
    return None


@dataclass(frozen=True)
class ValidatedAttempt:
    invalid_reason: str | None
    runner_summary: Mapping[str, Any] | None
    phase_eligibility_errors: tuple[str, ...]


def _attempt_replay_context(
    environment: Mapping[str, Any], run_dir: Path, sample_dir: Path,
    expected_lane: Mapping[str, Any]
) -> dict[str, str]:
    tools = environment.get("tools")
    if not isinstance(tools, dict):
        raise HarnessError("environment tools record is unavailable")
    context: dict[str, str] = {}
    for name, tool in tools.items():
        path = tool.get("path") if isinstance(tool, dict) else None
        context[name] = path if isinstance(path, str) and path else f"<missing:{name}>"
    cache_path = environment.get("thinlto_cache_path")
    if expected_lane["cache"]["thinlto_cache"] == "cold":
        invocation_cache = sample_dir / "temp" / "ring-lang-thinlto-cache"
    elif isinstance(cache_path, str) and cache_path:
        invocation_cache = Path(cache_path)
    else:
        raise HarnessError("environment ThinLTO cache path is unavailable")
    context.update(
        {
            "repo": str(REPO_ROOT),
            "run_dir": str(run_dir),
            "sample_dir": str(sample_dir),
            "thinlto_cache": str(invocation_cache),
        }
    )
    return context


def _actual_file_record(path: Path, label: str) -> dict[str, Any]:
    try:
        if not path.is_file():
            raise HarnessError(f"missing retained {label}: {path}")
        return _file_record(path)
    except OSError as exc:
        raise HarnessError(f"cannot verify retained {label} {path}: {exc}") from exc


def _validate_runner_runtime_provenance(
    record: Mapping[str, Any], expected_lane: Mapping[str, Any],
    environment: Mapping[str, Any], sample_dir: Path
) -> None:
    runtime = record["runner_runtime"]
    applies = bool(expected_lane.get("isolate_runner_runtime", False))
    if not applies:
        expected = {
            "mode": "not_applicable",
            "isolated": False,
            "root_path": None,
            "source_sha256": None,
            "flags": [],
            "original_exists": False,
            "original_sha256": None,
            "pre_exists": False,
            "pre_sha256": None,
            "post_exists": False,
            "post_sha256": None,
            "restored": True,
            "backup_path": None,
            "backup_exists_after": False,
            "staging_path": None,
            "staging_exists_after": False,
            "errors": [],
        }
        if runtime != expected:
            raise HarnessError(
                f"runner runtime provenance mismatch in {record['sample_id']}"
            )
        return

    setup = environment.get("runner_runtime")
    if not isinstance(setup, dict):
        raise HarnessError("environment runner runtime setup is unavailable")
    root_text = setup.get("root_path")
    if not isinstance(root_text, str) or not root_text:
        raise HarnessError("environment runner runtime root is unavailable")
    root = Path(root_text)
    token = re.sub(r"[^a-zA-Z0-9_-]", "_", sample_dir.name)
    backup = root.with_name(f"ring_runtime.b176-{token}.backup.o").resolve()
    staging = root.with_name(f"ring_runtime.b176-{token}.install.o").resolve()
    original = setup.get("original_root")
    if not isinstance(original, dict):
        raise HarnessError("environment original runtime state is unavailable")
    expected_fields = {
        "mode": expected_lane["cache"]["thinlto_cache"],
        "isolated": True,
        "root_path": str(root.resolve()),
        "source_sha256": setup.get("source_sha256"),
        "flags": setup.get("flags"),
        "original_exists": original.get("exists"),
        "original_sha256": original.get("sha256"),
        "backup_path": str(backup),
        "staging_path": str(staging),
    }
    for field, expected in expected_fields.items():
        if runtime.get(field) != expected:
            raise HarnessError(
                f"runner runtime {field} provenance mismatch in {record['sample_id']}"
            )
    if runtime["mode"] == "cold":
        expected_pre = (False, None)
    else:
        prepared = setup.get("prepared")
        if not isinstance(prepared, dict):
            raise HarnessError("prepared warm runtime state is unavailable")
        expected_pre = (prepared.get("exists"), prepared.get("sha256"))
    if (runtime["pre_exists"], runtime["pre_sha256"]) != expected_pre:
        raise HarnessError(
            f"runner runtime pre-state mismatch in {record['sample_id']}"
        )
    if not runtime["errors"] and (
        not runtime["post_exists"]
        or not runtime["restored"]
        or runtime["backup_exists_after"]
        or runtime["staging_exists_after"]
    ):
        raise HarnessError(
            f"runner runtime clean-state mismatch in {record['sample_id']}"
        )
    if (
        runtime["mode"] == "warm"
        and runtime["post_exists"]
        and isinstance(setup.get("prepared"), dict)
        and runtime["post_sha256"] != setup["prepared"].get("sha256")
    ):
        raise HarnessError(
            f"runner runtime warm post-state mismatch in {record['sample_id']}"
        )


def _validate_measurement_invariants(record: Mapping[str, Any]) -> None:
    sample_id = record.get("sample_id")
    wall_ns = record.get("wall_ns")
    covered_ns = record.get("rss_covered_ns")
    ratio = record.get("rss_coverage_ratio")
    errors = record.get("measurement_errors")
    if not isinstance(errors, list) or any(not isinstance(item, str) for item in errors):
        raise HarnessError(f"measurement error record is malformed in {sample_id}")
    if errors != sorted(set(errors)):
        raise HarnessError(f"measurement errors are not canonical in {sample_id}")
    invocation_error = record.get("invocation_error")
    if invocation_error is not None and errors != [invocation_error]:
        raise HarnessError(
            f"invocation/measurement errors disagree in {sample_id}"
        )
    if wall_ns is None:
        expected_ratio = 0.0
        if covered_ns != 0:
            raise HarnessError(f"RSS coverage exists without wall time in {sample_id}")
    elif _is_trace_int(wall_ns) and wall_ns >= 0 and _is_trace_int(covered_ns):
        expected_ratio = min(1.0, covered_ns / wall_ns) if wall_ns else 0.0
    else:
        raise HarnessError(f"wall/RSS coverage fields are malformed in {sample_id}")
    if ratio != expected_ratio:
        raise HarnessError(f"RSS coverage ratio mismatch in {sample_id}")

    observed = record.get("rss_observed_process_count")
    job_total = record.get("rss_job_total_processes")
    process_count = record.get("process_count")
    if not _is_trace_int(observed) or not _is_trace_int(job_total):
        raise HarnessError(f"RSS process counts are malformed in {sample_id}")
    if observed > job_total:
        raise HarnessError(f"observed RSS processes exceed Job total in {sample_id}")
    if process_count is None:
        if job_total != 0:
            raise HarnessError(f"Job total lacks exact process accounting in {sample_id}")
    elif process_count.get("total") != job_total:
        raise HarnessError(f"Job process totals disagree in {sample_id}")
    expected_complete = (
        observed >= job_total
        and expected_ratio >= 0.95
        and not errors
        and process_count is not None
    )
    if record.get("rss_complete") is not expected_complete:
        raise HarnessError(f"rss_complete formula mismatch in {sample_id}")


def validate_attempt_boundary(
    record: Mapping[str, Any], expected_lane: Mapping[str, Any],
    environment: Mapping[str, Any], run_dir: Path,
    result_schema: Mapping[str, Any], *, verify_stored: bool
) -> ValidatedAttempt:
    """Validate one untrusted attempt before eligibility or aggregation.

    Structural/schema/provenance failures always raise.  Only after that
    boundary succeeds are completeness and measurement outcomes allowed to
    become an eligibility reason.
    """

    validate_schema_definition(result_schema)
    validate_json(record, result_schema)
    run_root = run_dir.resolve()
    if record.get("run_id") != environment.get("run_id"):
        raise HarnessError("sample run identity mismatch")
    if record.get("source_sha") != environment.get("source_sha"):
        raise HarnessError("sample source identity mismatch")
    if record.get("manifest_sha") != environment.get("manifest_sha"):
        raise HarnessError("sample manifest identity mismatch")
    case_id = record.get("case_id")
    if case_id != expected_lane["case_id"]:
        raise HarnessError(f"sample case identity mismatch: {case_id!r}")
    if record.get("cache") != expected_lane["cache"]:
        raise HarnessError(f"sample cache contract mismatch in {case_id}")
    sample_id = record.get("sample_id")
    match = SAMPLE_ID_RE.fullmatch(sample_id) if isinstance(sample_id, str) else None
    if (
        match is None
        or match.group("case_id") != case_id
        or int(match.group("index")) != record.get("index")
    ):
        raise HarnessError(f"unsafe or non-canonical sample_id {sample_id!r}")
    case_root = (run_root / "samples" / case_id).resolve()
    expected_sample_dir = (case_root / sample_id).resolve()
    try:
        case_root.relative_to(run_root)
        expected_sample_dir.relative_to(case_root)
    except ValueError as exc:
        raise HarnessError(f"sample path escapes its lane root in {sample_id}") from exc
    if expected_sample_dir.parent != case_root:
        raise HarnessError(f"sample path is not a direct lane child in {sample_id}")
    sample_dir_text = record.get("sample_dir")
    if (
        not isinstance(sample_dir_text, str)
        or not Path(sample_dir_text).is_absolute()
        or sample_dir_text != str(expected_sample_dir)
    ):
        raise HarnessError(f"sample_dir provenance mismatch in {sample_id}")

    context = _attempt_replay_context(
        environment, run_root, expected_sample_dir, expected_lane
    )
    expected_argv = [_format(item, context) for item in expected_lane["argv"]]
    phase_paths = resolve_phase_trace_paths(expected_lane, expected_sample_dir)
    if expected_lane.get("compiler_phase_timing", False):
        compiler_sha = environment.get("tools", {}).get("ring", {}).get("sha256")
        if not isinstance(compiler_sha, str) or not compiler_sha:
            raise HarnessError("compiler executable identity is unavailable")
        expected_argv.extend(
            [
                f"--phase-timing={phase_paths[0]}",
                f"--phase-timing-lane={expected_lane['case_id']}",
                f"--phase-timing-compiler=sha256:{compiler_sha}",
                f"--phase-timing-source=git:{environment['source_sha']}",
            ]
        )
    expected_cwd = str(Path(_format(expected_lane["cwd"], context)).resolve())
    if record.get("argv") != expected_argv or record.get("cwd") != expected_cwd:
        raise HarnessError(f"invocation provenance mismatch in {sample_id}")

    stdout_path = expected_sample_dir / "stdout.txt"
    stderr_path = expected_sample_dir / "stderr.txt"
    actual_stdout = _actual_file_record(stdout_path, "stdout")
    actual_stderr = _actual_file_record(stderr_path, "stderr")
    if record.get("stdout") != actual_stdout or record.get("stderr") != actual_stderr:
        raise HarnessError(f"stream provenance mismatch in {sample_id}")

    runner_contract = expected_lane["runner_summary"]
    actual_runner = _runner_summary(stdout_path) if runner_contract is not None else None
    if record.get("runner_summary") != actual_runner:
        raise HarnessError(f"runner summary provenance mismatch in {sample_id}")
    if actual_runner is not None:
        _validate_runner_summary_result(
            actual_runner, runner_contract, record["exit"]["code"]
        )

    artifact_paths = [
        Path(_format(item, context)).resolve()
        for item in expected_lane["artifacts"]
    ]
    for path in artifact_paths:
        try:
            path.relative_to(expected_sample_dir)
        except ValueError as exc:
            raise HarnessError(
                f"declared artifact escapes sample_dir in {sample_id}: {path}"
            ) from exc
    actual_artifacts = _artifact_records(artifact_paths)
    if record.get("artifacts") != actual_artifacts:
        raise HarnessError(f"artifact provenance mismatch in {sample_id}")

    actual_phase_traces = _phase_trace_records(phase_paths)
    if record.get("phase_traces") != actual_phase_traces:
        raise HarnessError(f"phase trace provenance mismatch in {sample_id}")
    phase_validation = _classify_phase_trace_records(
        actual_phase_traces,
        paths=phase_paths,
        sample_dir=expected_sample_dir,
        lane=expected_lane,
        environment=environment,
        expected_entry_file=(
            resolve_invocation_entry(expected_argv, expected_cwd)
            if expected_lane.get("compiler_phase_timing", False)
            else ""
        ),
        exit_code=record["exit"]["code"],
        wall_ns=record["wall_ns"],
    )
    if phase_validation.hard_errors:
        raise HarnessError(
            f"hard phase trace validation failed in {sample_id}: "
            + "; ".join(phase_validation.hard_errors)
        )

    _validate_runner_runtime_provenance(
        record, expected_lane, environment, expected_sample_dir
    )
    _validate_measurement_invariants(record)
    exit_code = record["exit"]["code"]
    expected_exit = exit_code in expected_lane["expected_exit_codes"]
    if record["exit"]["expected"] is not expected_exit:
        raise HarnessError(f"stored exit eligibility mismatch in {sample_id}")

    reason = derive_invalid_reason(
        policy=expected_lane["policy"],
        index=record["index"],
        invocation_error=record["invocation_error"],
        measurement=record,
        exit_code=exit_code,
        expected_exit_codes=expected_lane["expected_exit_codes"],
        runner_expected=runner_contract is not None,
        runner_summary=actual_runner,
        artifacts=actual_artifacts,
        phase_errors=phase_validation.eligibility_errors,
        runtime_errors=record["runner_runtime"]["errors"],
    )
    if verify_stored:
        if record.get("invalid_reason") != reason:
            raise HarnessError(
                f"stored invalid_reason mismatch in {sample_id}: "
                f"expected {reason!r}, got {record.get('invalid_reason')!r}"
            )
        if record.get("included") is not (reason is None):
            raise HarnessError(f"stored included eligibility mismatch in {sample_id}")
    return ValidatedAttempt(
        invalid_reason=reason,
        runner_summary=actual_runner,
        phase_eligibility_errors=phase_validation.eligibility_errors,
    )


def _empty_metrics() -> dict[str, Any]:
    return {
        "root_pid": None,
        "wall_ns": None,
        "cpu_user_ns": None,
        "cpu_kernel_ns": None,
        "peak_root_rss_bytes": None,
        "sampled_peak_tree_rss_bytes": None,
        "max_worker_peak_rss_bytes": None,
        "peak_job_commit_bytes": None,
        "rss_poll_ms": RSS_POLL_MS,
        "rss_samples_observed": 0,
        "rss_covered_ns": 0,
        "rss_coverage_ratio": 0.0,
        "rss_observed_process_count": 0,
        "rss_job_total_processes": 0,
        "rss_complete": False,
        "process_count": None,
        "job_io": None,
        "exit_code": None,
        "timed_out": False,
        "measurement_errors": [],
    }


def execute_invocation(
    *,
    lane: Mapping[str, Any],
    index: int,
    run_id: str,
    run_dir: Path,
    environment: Mapping[str, Any],
    manifest_sha: str,
    result_schema: Mapping[str, Any],
    tools: Mapping[str, str | None],
    thinlto_cache: Path,
) -> dict[str, Any]:
    sample_id = f"{lane['case_id']}-{index:03d}-{uuid.uuid4().hex[:8]}"
    sample_dir = run_dir / "samples" / lane["case_id"] / sample_id
    sample_dir.mkdir(parents=True, exist_ok=False)
    sample_temp = sample_dir / "temp"
    sample_temp.mkdir()
    stdout_path = sample_dir / "stdout.txt"
    stderr_path = sample_dir / "stderr.txt"
    cache_state = lane["cache"]["thinlto_cache"]
    invocation_cache = (
        sample_temp / "ring-lang-thinlto-cache"
        if cache_state == "cold"
        else thinlto_cache
    )
    context = _context(tools, run_dir, sample_dir, invocation_cache)
    argv = [_format(item, context) for item in lane["argv"]]
    cwd = _format(lane["cwd"], context)
    artifact_paths = [Path(_format(item, context)) for item in lane["artifacts"]]
    phase_paths = resolve_phase_trace_paths(lane, sample_dir)
    if lane.get("compiler_phase_timing", False):
        compiler_sha = environment["tools"]["ring"]["sha256"]
        if not compiler_sha:
            raise HarnessError("selected compiler executable has no SHA-256 identity")
        argv.extend(
            [
                f"--phase-timing={phase_paths[0]}",
                f"--phase-timing-lane={lane['case_id']}",
                f"--phase-timing-compiler=sha256:{compiler_sha}",
                f"--phase-timing-source=git:{environment['source_sha']}",
            ]
        )
    child_env = dict(os.environ)
    temp_root = sample_temp if cache_state == "cold" else thinlto_cache.parent
    child_env["TEMP"] = str(temp_root)
    child_env["TMP"] = str(temp_root)
    child_env["RING_BENCH_RUN_ID"] = run_id
    child_env["RING_BENCH_SAMPLE_ID"] = sample_id

    measurement: dict[str, Any] | None = None
    measurement_error: str | None = None
    runtime_setup = environment["runner_runtime"]
    runtime_record, runtime_transaction = _begin_runner_runtime_isolation(
        lane, runtime_setup, sample_dir
    )
    try:
        try:
            measurement = run_in_job(
                argv,
                cwd=cwd,
                env=child_env,
                stdout_path=stdout_path,
                stderr_path=stderr_path,
                timeout_seconds=float(lane["timeout_seconds"]),
                poll_ms=RSS_POLL_MS,
            )
        except (OSError, ValueError, JobMeasurementError) as exc:
            measurement_error = str(exc)
            measurement = _empty_metrics()
            measurement["measurement_errors"] = [measurement_error]
            stdout_path.touch(exist_ok=True)
            stderr_path.touch(exist_ok=True)
    finally:
        _finish_runner_runtime_isolation(
            runtime_record, runtime_setup, runtime_transaction
        )

    assert measurement is not None
    stdout = _file_record(stdout_path)
    stderr = _file_record(stderr_path)
    artifacts = _artifact_records(artifact_paths)
    phase_traces = _phase_trace_records(phase_paths)
    runner = (
        _runner_summary(stdout_path)
        if lane["runner_summary"] is not None
        else None
    )
    exit_code = measurement.pop("exit_code")
    record = {
        "schema": RESULT_SCHEMA,
        "run_id": run_id,
        "sample_id": sample_id,
        "sample_dir": str(sample_dir.resolve()),
        "case_id": lane["case_id"],
        "index": index,
        "included": False,
        "source_sha": environment["source_sha"],
        "manifest_sha": manifest_sha,
        "argv": argv,
        "cwd": str(Path(cwd).resolve()),
        "cache": lane["cache"],
        "runner_runtime": runtime_record,
        **measurement,
        "exit": {
            "code": exit_code,
            "expected": (
                exit_code in lane["expected_exit_codes"] if exit_code is not None else False
            ),
        },
        "stdout": stdout,
        "stderr": stderr,
        "runner_summary": runner,
        "artifacts": artifacts,
        "phase_traces": phase_traces,
        "invocation_error": measurement_error,
        "invalid_reason": None,
    }
    validated = validate_attempt_boundary(
        record, lane, environment, run_dir, result_schema,
        verify_stored=False,
    )
    record["invalid_reason"] = validated.invalid_reason
    record["included"] = validated.invalid_reason is None
    if cache_state == "cold":
        shutil.rmtree(sample_temp, ignore_errors=True)
    return record


def _metric_stats(values: Sequence[int]) -> dict[str, Any]:
    ordered = sorted(values)
    median = statistics.median(ordered)
    absolute_deviations = [abs(value - median) for value in ordered]
    result: dict[str, Any] = {
        "count": len(ordered),
        "median": median,
        "mad": statistics.median(absolute_deviations),
        "range": [ordered[0], ordered[-1]],
    }
    if len(ordered) == DIRECT_VALID_SAMPLES:
        result["empirical_p95"] = ordered[math.ceil(0.95 * len(ordered)) - 1]
    return result


def _summarize_compiler_phase_timing(
    records: Sequence[Mapping[str, Any]],
) -> dict[str, Any] | None:
    samples: list[tuple[Mapping[str, Any], dict[str, Mapping[str, Any]]]] = []
    for record in records:
        values = [
            item["value"]
            for item in record.get("phase_traces", [])
            if isinstance(item.get("value"), dict)
            and item["value"].get("schema") == COMPILER_PHASE_SCHEMA
        ]
        if values:
            samples.append((record, {value["phase"]: value for value in values}))
    if not samples:
        return None

    phases: dict[str, Any] = {}
    for phase in COMPILER_PHASE_ORDER:
        rows = [by_phase[phase] for _record, by_phase in samples]
        phases[phase] = {
            "executed_samples": sum(1 for row in rows if row["executed"]),
            "duration_ns": _metric_stats([row["duration_ns"] for row in rows]),
        }

    measured_sums: list[int] = []
    unattributed: list[int] = []
    outside_command: list[int] = []
    for record, by_phase in samples:
        measured = sum(
            by_phase[phase]["duration_ns"]
            for phase in COMPILER_PHASE_ORDER
            if phase != "command_total"
        )
        command_total = by_phase["command_total"]["duration_ns"]
        measured_sums.append(measured)
        unattributed.append(command_total - measured)
        outside_command.append(record["wall_ns"] - command_total)
    return {
        "schema": COMPILER_PHASE_SCHEMA,
        "unit": "ns",
        "sample_count": len(samples),
        "phases": phases,
        "accounting": {
            "measured_phase_sum_ns": _metric_stats(measured_sums),
            "unattributed_command_ns": _metric_stats(unattributed),
            "outside_instrumented_command_ns": _metric_stats(outside_command),
        },
    }


def summarize_lane(
    lane: Mapping[str, Any],
    records: Sequence[Mapping[str, Any]],
    target: int,
) -> dict[str, Any]:
    included = [record for record in records if record["included"]]
    metrics: dict[str, Any] = {}
    for field in (
        "wall_ns",
        "cpu_user_ns",
        "cpu_kernel_ns",
        "peak_root_rss_bytes",
        "sampled_peak_tree_rss_bytes",
        "max_worker_peak_rss_bytes",
        "peak_job_commit_bytes",
    ):
        values = [record[field] for record in included if record[field] is not None]
        if values:
            metrics[field] = _metric_stats(values)
    reasons: dict[str, int] = {}
    measurement_error_counts: dict[str, int] = {}
    for record in records:
        if record["invalid_reason"] is not None:
            reason = record["invalid_reason"]
            reasons[reason] = reasons.get(reason, 0) + 1
        for error in record.get("measurement_errors", []):
            measurement_error_counts[error] = measurement_error_counts.get(error, 0) + 1
    rss_incomplete = [record for record in records if not record.get("rss_complete", False)]
    lower_bounds = [
        record["sampled_peak_tree_rss_bytes"]
        for record in rss_incomplete
        if record.get("sampled_peak_tree_rss_bytes") is not None
    ]
    runtime_error_samples = sum(
        1 for record in records if record.get("runner_runtime", {}).get("errors")
    )
    resource_quality: dict[str, Any] = {
        "rss_complete_samples": len(records) - len(rss_incomplete),
        "rss_incomplete_samples": len(rss_incomplete),
        "included_rss_incomplete_samples": sum(
            1 for record in included if not record.get("rss_complete", False)
        ),
        "worker_peak_unavailable_samples": sum(
            1 for record in records if record.get("max_worker_peak_rss_bytes") is None
        ),
        "measurement_error_samples": sum(
            1 for record in records if record.get("measurement_errors")
        ),
        "measurement_error_counts": measurement_error_counts,
        "runner_runtime_error_samples": runtime_error_samples,
        "rss_lower_bound": _metric_stats(lower_bounds) if lower_bounds else None,
    }
    return {
        "case_id": lane["case_id"],
        "policy": lane["policy"],
        "target_valid_samples": target,
        "valid_samples": len(included),
        "attempts": len(records),
        "complete": len(included) == target,
        "invalid_reasons": reasons,
        "resource_quality": resource_quality,
        "metrics": metrics,
        "compiler_phase_timing": _summarize_compiler_phase_timing(included),
    }


def run_lane(
    *,
    lane: Mapping[str, Any],
    run_id: str,
    run_dir: Path,
    environment: Mapping[str, Any],
    manifest_sha: str,
    result_schema: Mapping[str, Any],
    tools: Mapping[str, str | None],
    thinlto_cache: Path,
    jsonl_stream: Any,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    policy = lane["policy"]
    warmups = DIRECT_WARMUPS if policy == "direct_short" else 0
    target: int | None
    if policy == "direct_short":
        target = DIRECT_VALID_SAMPLES
    elif policy == "full_gate":
        target = FULL_GATE_VALID_SAMPLES
    else:
        target = None

    records: list[dict[str, Any]] = []
    valid = 0
    measured_attempts = 0
    index = 0
    while True:
        is_warmup = index < warmups
        if not is_warmup:
            provisional_target = target if target is not None else SHORT_VALID_SAMPLES
            if valid >= provisional_target:
                break
            if measured_attempts >= provisional_target + MAX_EXTRA_ATTEMPTS:
                break

        record = execute_invocation(
            lane=lane,
            index=index,
            run_id=run_id,
            run_dir=run_dir,
            environment=environment,
            manifest_sha=manifest_sha,
            result_schema=result_schema,
            tools=tools,
            thinlto_cache=thinlto_cache,
        )
        validate_json(record, result_schema)
        jsonl_stream.write(_json_line(record) + "\n")
        jsonl_stream.flush()
        records.append(record)
        if not is_warmup:
            measured_attempts += 1
            if record["included"]:
                valid += 1
                if policy == "adaptive" and target is None:
                    target = (
                        LONG_VALID_SAMPLES
                        if record["wall_ns"] >= LONG_LANE_THRESHOLD_NS
                        else SHORT_VALID_SAMPLES
                    )
        index += 1

    final_target = target if target is not None else SHORT_VALID_SAMPLES
    summary = summarize_lane(lane, records, final_target)
    return records, summary


def _probe_lane(tools: Mapping[str, str | None]) -> dict[str, Any]:
    return {
        "case_id": "probe_python_noop_warm",
        "base_case_id": "probe_python_noop",
        "description": "single-invocation harness probe; not baseline evidence",
        "policy": "full_gate",
        "cache": {
            "thinlto_cache": "warm",
            "output": "fresh",
            "os_file_cache": "uncontrolled",
        },
        "argv": [
            "{python}",
            "-c",
            "import sys; print('probe-out'); print('probe-err', file=sys.stderr)",
        ],
        "cwd": "{repo}",
        "timeout_seconds": 10,
        "expected_exit_codes": [0],
        "requires": ["tool:python"],
        "runner_summary": None,
        "artifacts": [],
        "phase_trace_paths": [],
        "probe_target": 1,
    }


def run_probe(
    *,
    lane: Mapping[str, Any],
    run_id: str,
    run_dir: Path,
    environment: Mapping[str, Any],
    manifest_sha: str,
    result_schema: Mapping[str, Any],
    tools: Mapping[str, str | None],
    thinlto_cache: Path,
    jsonl_stream: Any,
) -> dict[str, Any]:
    record = execute_invocation(
        lane=lane,
        index=0,
        run_id=run_id,
        run_dir=run_dir,
        environment=environment,
        manifest_sha=manifest_sha,
        result_schema=result_schema,
        tools=tools,
        thinlto_cache=thinlto_cache,
    )
    validate_json(record, result_schema)
    jsonl_stream.write(_json_line(record) + "\n")
    jsonl_stream.flush()
    summary = summarize_lane(lane, [record], 1)
    summary["policy"] = "probe"
    return summary


def _new_run_id() -> str:
    timestamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return f"{timestamp}-{uuid.uuid4().hex[:10]}"


def _prepare_output(path: Path) -> None:
    if path.exists():
        if not path.is_dir():
            raise HarnessError(f"output exists and is not a directory: {path}")
        if any(path.iterdir()):
            raise HarnessError(f"output directory must be fresh and empty: {path}")
    else:
        path.mkdir(parents=True)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--result-schema", type=Path, default=DEFAULT_RESULT_SCHEMA)
    parser.add_argument("--case", action="append", dest="cases", default=[])
    parser.add_argument("--ring", help="explicit ring.exe for direct lanes")
    parser.add_argument(
        "--thinlto-cache",
        type=Path,
        default=Path(tempfile.gettempdir()) / "ring-lang-thinlto-cache",
    )
    parser.add_argument("--confirm-cache-state", choices=sorted(ALLOWED_CACHE_STATES))
    parser.add_argument(
        "--prepare-warm-cache", action="store_true",
        help="create the exact bounded ThinLTO seed cache and signed receipt",
    )
    parser.add_argument("--output", type=Path)
    parser.add_argument("--list", action="store_true", help="list expanded lanes")
    parser.add_argument("--preflight", action="store_true", help="validate without running lanes")
    parser.add_argument("--probe", action="store_true", help="run one non-baseline harness probe")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    manifest_path = args.manifest.resolve()
    schema_path = args.result_schema.resolve()
    manifest = _load_json(manifest_path)
    result_schema = _load_json(schema_path)
    if not isinstance(manifest, dict) or not isinstance(result_schema, dict):
        raise HarnessError("manifest and result schema roots must be objects")
    validate_manifest(manifest)
    validate_schema_definition(result_schema)
    lanes = expand_lanes(manifest)

    tools = build_tools(args.ring)
    if args.prepare_warm_cache:
        if (
            args.cases or args.list or args.preflight or args.probe
            or args.output is not None or args.confirm_cache_state is not None
        ):
            raise HarnessError(
                "--prepare-warm-cache is a standalone operation"
            )
        receipt = prepare_warm_cache_seed(
            manifest, tools, args.thinlto_cache.resolve()
        )
        print(
            _json_line(
                {
                    "status": "ok",
                    "warm_cache_receipt": str(receipt),
                    "sha256": _sha256_file(receipt),
                }
            )
        )
        return 0

    if args.list:
        for lane in lanes:
            print(f"{lane['case_id']:<40} {lane['policy']:<12} {lane['description']}")
        return 0
    if args.probe and args.cases:
        raise HarnessError("--probe cannot be combined with --case")
    if not args.probe and not args.cases and not args.preflight:
        raise HarnessError("select at least one --case, or use --list/--preflight/--probe")

    selected = select_lanes(lanes, args.cases) if args.cases else lanes
    if args.probe:
        selected = [_probe_lane(tools)]
    job_preflight = preflight_job_support()
    preflight_root = (args.output or BENCH_DIR / "results" / "preflight").resolve()
    preflight_lanes(selected, tools, preflight_root, args.thinlto_cache.resolve())

    state: str | None = None
    seed_receipt_path: Path | None = None
    seed_receipt: dict[str, Any] | None = None
    if not args.probe:
        states = {lane["cache"]["thinlto_cache"] for lane in selected}
        if len(states) != 1:
            raise HarnessError("cold and warm lanes must be run separately")
        state = next(iter(states))
        if args.confirm_cache_state != state:
            raise HarnessError(
                f"selected lanes declare thinlto_cache={state}; pass "
                f"--confirm-cache-state {state} after preparing that state"
            )
        seed_receipt_path, seed_receipt = validate_warm_cache_seed(
            manifest, tools, args.thinlto_cache.resolve()
        )

    if args.preflight:
        print(
            _json_line(
                {
                    "status": "ok",
                    "manifest": str(manifest_path),
                    "result_schema": str(schema_path),
                    "lanes": [lane["case_id"] for lane in selected],
                    "job_preflight": job_preflight,
                    "warm_cache_receipt": str(seed_receipt_path) if seed_receipt_path else None,
                }
            )
        )
        return 0

    run_id = _new_run_id()
    run_dir = (args.output or BENCH_DIR / "results" / run_id).resolve()
    _prepare_output(run_dir)
    manifest_bytes = manifest_path.read_bytes()
    manifest_sha = _sha256_bytes(manifest_bytes)
    (run_dir / "manifest.snapshot.json").write_bytes(manifest_bytes)
    shutil.copyfile(schema_path, run_dir / "result.schema.json")
    active_cache = args.thinlto_cache.resolve()
    retained_receipt_path: Path | None = None
    if seed_receipt_path is not None and seed_receipt is not None:
        retained_receipt_path = run_dir / "warm-cache-seed-receipt.json"
        shutil.copyfile(seed_receipt_path, retained_receipt_path)
        if _load_json(retained_receipt_path) != seed_receipt:
            raise HarnessError("retained warm-cache receipt differs from preflight")
        if state == "warm":
            active_cache = (
                run_dir / "prepared" / "warm-cache" / "ring-lang-thinlto-cache"
            ).resolve()
            active_cache.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(args.thinlto_cache.resolve(), active_cache)
            if _cache_inventory(active_cache) != seed_receipt["cache_inventory"]:
                raise HarnessError("isolated warm-cache copy differs from its seed")
    environment = capture_environment(
        manifest,
        manifest_sha,
        run_id,
        tools,
        active_cache,
        state,
        seed_receipt,
        retained_receipt_path,
    )
    if not args.probe and environment["git_dirty"]:
        raise HarnessError("formal measurements require a clean tracked worktree")
    environment["job_preflight"] = job_preflight
    environment["runner_runtime"] = prepare_runner_runtime(
        manifest,
        selected,
        state,
        tools,
        run_dir,
    )
    _json_dump(run_dir / "environment.json", environment)

    lane_summaries: list[dict[str, Any]] = []
    samples_path = run_dir / "samples.jsonl"
    with samples_path.open("w", encoding="utf-8", newline="\n") as jsonl_stream:
        for lane in selected:
            if args.probe:
                lane_summary = run_probe(
                    lane=lane,
                    run_id=run_id,
                    run_dir=run_dir,
                    environment=environment,
                    manifest_sha=manifest_sha,
                    result_schema=result_schema,
                    tools=tools,
                    thinlto_cache=active_cache,
                    jsonl_stream=jsonl_stream,
                )
            else:
                _records, lane_summary = run_lane(
                    lane=lane,
                    run_id=run_id,
                    run_dir=run_dir,
                    environment=environment,
                    manifest_sha=manifest_sha,
                    result_schema=result_schema,
                    tools=tools,
                    thinlto_cache=active_cache,
                    jsonl_stream=jsonl_stream,
                )
            lane_summaries.append(lane_summary)

    summary = {
        "schema": SUMMARY_SCHEMA,
        "run_id": run_id,
        "source_sha": environment["source_sha"],
        "manifest_sha": manifest_sha,
        "samples_jsonl": _file_record(samples_path),
        "lanes": lane_summaries,
        "complete": all(lane["complete"] for lane in lane_summaries),
    }
    _json_dump(run_dir / "summary.json", summary)
    print(_json_line({"run_dir": str(run_dir), "complete": summary["complete"]}))
    return 0 if summary["complete"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (HarnessError, JobMeasurementError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
