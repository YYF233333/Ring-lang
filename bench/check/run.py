"""Bounded, replayable measurement harness for Ring ``check`` feedback.

This first B-176 continuity unit owns measurement integrity only.  It does not
change the compiler or test runner, and it does not publish a baseline.
"""

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
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

from windows_job import JobMeasurementError, preflight_job_support, run_in_job


BENCH_DIR = Path(__file__).resolve().parent
REPO_ROOT = BENCH_DIR.parents[1]
DEFAULT_MANIFEST = BENCH_DIR / "manifest.json"
DEFAULT_RESULT_SCHEMA = BENCH_DIR / "result.schema.json"
MANIFEST_SCHEMA = "ring.check-benchmark.manifest.v1"
RESULT_SCHEMA = "ring.check-benchmark.invocation.v1"
ENVIRONMENT_SCHEMA = "ring.check-benchmark.environment.v1"
SUMMARY_SCHEMA = "ring.check-benchmark.summary.v1"
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


class HarnessError(RuntimeError):
    """Configuration, preflight, or measurement-integrity failure."""


def _load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
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


def validate_json(value: Any, schema: Mapping[str, Any], path: str = "$") -> None:
    """Validate the deliberately small JSON-Schema subset used by this harness."""

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
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            raise HarnessError(f"{path}: value is below minimum {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            raise HarnessError(f"{path}: value is above maximum {schema['maximum']}")

    if isinstance(value, list) and "items" in schema:
        item_schema = schema["items"]
        for index, item in enumerate(value):
            validate_json(item, item_schema, f"{path}[{index}]")

    if isinstance(value, dict):
        required = schema.get("required", [])
        missing = [key for key in required if key not in value]
        if missing:
            raise HarnessError(f"{path}: missing required keys {missing}")
        properties = schema.get("properties", {})
        for key, item in value.items():
            if key in properties:
                validate_json(item, properties[key], f"{path}.{key}")
            elif schema.get("additionalProperties") is False:
                raise HarnessError(f"{path}: unexpected key {key!r}")


def validate_schema_definition(schema: Mapping[str, Any]) -> None:
    if schema.get("$id") != RESULT_SCHEMA:
        raise HarnessError(
            f"result schema $id must be {RESULT_SCHEMA!r}, got {schema.get('$id')!r}"
        )
    if schema.get("type") != "object":
        raise HarnessError("result schema root must be an object")
    if schema.get("additionalProperties") is not False:
        raise HarnessError("result schema root must reject additional properties")
    required = schema.get("required")
    properties = schema.get("properties")
    if not isinstance(required, list) or not isinstance(properties, dict):
        raise HarnessError("result schema must define required and properties")
    absent = sorted(set(required) - set(properties))
    if absent:
        raise HarnessError(f"result schema requires undefined properties: {absent}")


def _placeholders(text: str) -> set[str]:
    return set(re.findall(r"\{([a-z][a-z0-9_]*)\}", text))


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
        if not isinstance(lane["runner_summary"], bool):
            raise HarnessError(f"{prefix}.runner_summary must be boolean")
        if "isolate_runner_runtime" in lane and not isinstance(
            lane["isolate_runner_runtime"], bool
        ):
            raise HarnessError(f"{prefix}.isolate_runner_runtime must be boolean")
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


def capture_environment(
    manifest: Mapping[str, Any],
    manifest_sha: str,
    run_id: str,
    tools: Mapping[str, str | None],
    thinlto_cache: Path,
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
    cache_files = list(thinlto_cache.rglob("*")) if thinlto_cache.is_dir() else []
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
        "thinlto_cache_path": str(thinlto_cache.resolve()),
        "thinlto_cache_inventory": {
            "exists": thinlto_cache.is_dir(),
            "files": sum(1 for path in cache_files if path.is_file()),
            "bytes": sum(path.stat().st_size for path in cache_files if path.is_file()),
        },
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
) -> tuple[dict[str, Any], Path | None]:
    applies = bool(lane.get("isolate_runner_runtime", False))
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
        "errors": [],
    }
    if not applies:
        return record, None

    root_object = Path(setup["root_path"])
    original = _optional_file_state(root_object)
    record["original_exists"] = original["exists"]
    record["original_sha256"] = original["sha256"]
    expected_original = setup["original_root"]
    if (
        original["exists"] != expected_original["exists"]
        or original["sha256"] != expected_original["sha256"]
    ):
        record["errors"].append("root runtime object changed since environment capture")
    backup = sample_dir / "runner-runtime-original.o" if original["exists"] else None
    try:
        if backup is not None:
            shutil.copy2(root_object, backup)
        root_object.unlink(missing_ok=True)
        if setup["mode"] == "warm":
            prepared = setup.get("prepared")
            if not isinstance(prepared, dict) or not prepared.get("path"):
                raise HarnessError("warm runner runtime object was not prepared")
            shutil.copy2(Path(prepared["path"]), root_object)
            source = REPO_ROOT / "ring_runtime.cpp"
            if root_object.stat().st_mtime_ns < source.stat().st_mtime_ns:
                timestamp = source.stat().st_mtime_ns + 1_000_000_000
                os.utime(root_object, ns=(timestamp, timestamp))
        pre = _optional_file_state(root_object)
        record["pre_exists"] = pre["exists"]
        record["pre_sha256"] = pre["sha256"]
        return record, backup
    except BaseException:
        root_object.unlink(missing_ok=True)
        if backup is not None and backup.is_file():
            shutil.copy2(backup, root_object)
            backup.unlink(missing_ok=True)
        raise


def _finish_runner_runtime_isolation(
    record: dict[str, Any],
    setup: Mapping[str, Any],
    backup: Path | None,
) -> None:
    if not record["isolated"]:
        return
    root_object = Path(record["root_path"])
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
        root_object.unlink(missing_ok=True)
        if backup is not None and backup.is_file():
            shutil.copy2(backup, root_object)
            backup.unlink(missing_ok=True)
        restored = _optional_file_state(root_object)
        record["restored"] = (
            restored["exists"] == record["original_exists"]
            and restored["sha256"] == record["original_sha256"]
        )
        if not record["restored"]:
            record["errors"].append("failed to restore pre-existing root runtime object")


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


def _phase_trace_records(paths: Iterable[Path]) -> tuple[list[dict[str, Any]], list[str]]:
    records: list[dict[str, Any]] = []
    errors: list[str] = []
    for path in paths:
        if not path.is_file():
            errors.append(f"missing phase trace: {path}")
            continue
        try:
            with path.open("r", encoding="utf-8") as stream:
                for line_number, line in enumerate(stream, 1):
                    if not line.strip():
                        continue
                    value = json.loads(line)
                    if not isinstance(value, dict):
                        raise ValueError("trace row is not an object")
                    records.append(
                        {
                            "path": str(path.resolve()),
                            "line": line_number,
                            "value": value,
                        }
                    )
        except (OSError, UnicodeError, json.JSONDecodeError, ValueError) as exc:
            errors.append(f"invalid phase trace {path}: {exc}")
    return records, errors


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
    exit_match = re.search(r"^Exit code:\s*(-?\d+)\b", text, re.MULTILINE)
    if not suite_counts and exit_match is None:
        return None
    return {
        "status_counts": status_counts,
        "suite_counts": suite_counts,
        "reported_exit_code": int(exit_match.group(1)) if exit_match else None,
    }


def _invalid_reason(
    *,
    is_warmup: bool,
    measurement: Mapping[str, Any] | None,
    measurement_error: str | None,
    expected_exit_codes: Sequence[int],
    runner_expected: bool,
    runner_summary: Mapping[str, Any] | None,
    artifacts: Sequence[Mapping[str, Any]],
    phase_errors: Sequence[str],
    runtime_errors: Sequence[str],
) -> str | None:
    if is_warmup:
        return "warmup"
    if measurement_error is not None:
        return f"measurement_error: {measurement_error}"
    assert measurement is not None
    if measurement["timed_out"]:
        return "timeout"
    if measurement["exit_code"] not in expected_exit_codes:
        return f"unexpected_exit: {measurement['exit_code']}"
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
    is_warmup: bool,
    run_id: str,
    run_dir: Path,
    environment: Mapping[str, Any],
    manifest_sha: str,
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
    phase_paths = [Path(_format(item, context)) for item in lane["phase_trace_paths"]]
    child_env = dict(os.environ)
    temp_root = sample_temp if cache_state == "cold" else thinlto_cache.parent
    child_env["TEMP"] = str(temp_root)
    child_env["TMP"] = str(temp_root)
    child_env["RING_BENCH_RUN_ID"] = run_id
    child_env["RING_BENCH_SAMPLE_ID"] = sample_id

    measurement: dict[str, Any] | None = None
    measurement_error: str | None = None
    runtime_setup = environment["runner_runtime"]
    runtime_record, runtime_backup = _begin_runner_runtime_isolation(
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
            runtime_record, runtime_setup, runtime_backup
        )

    stdout = _file_record(stdout_path)
    stderr = _file_record(stderr_path)
    artifacts = _artifact_records(artifact_paths)
    phase_traces, phase_errors = _phase_trace_records(phase_paths)
    runner = _runner_summary(stdout_path) if lane["runner_summary"] else None
    reason = _invalid_reason(
        is_warmup=is_warmup,
        measurement=measurement,
        measurement_error=measurement_error,
        expected_exit_codes=lane["expected_exit_codes"],
        runner_expected=lane["runner_summary"],
        runner_summary=runner,
        artifacts=artifacts,
        phase_errors=phase_errors,
        runtime_errors=runtime_record["errors"],
    )
    assert measurement is not None
    if cache_state == "cold":
        shutil.rmtree(sample_temp, ignore_errors=True)
    exit_code = measurement.pop("exit_code")
    record = {
        "schema": RESULT_SCHEMA,
        "run_id": run_id,
        "sample_id": sample_id,
        "case_id": lane["case_id"],
        "index": index,
        "included": reason is None,
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
        "invalid_reason": reason,
    }
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
            is_warmup=is_warmup,
            run_id=run_id,
            run_dir=run_dir,
            environment=environment,
            manifest_sha=manifest_sha,
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
        "runner_summary": False,
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
        is_warmup=False,
        run_id=run_id,
        run_dir=run_dir,
        environment=environment,
        manifest_sha=manifest_sha,
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
        selected = [_probe_lane(build_tools(args.ring))]
    tools = build_tools(args.ring)
    job_preflight = preflight_job_support()
    preflight_root = (args.output or BENCH_DIR / "results" / "preflight").resolve()
    preflight_lanes(selected, tools, preflight_root, args.thinlto_cache.resolve())

    state: str | None = None
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
        if state == "warm":
            cache = args.thinlto_cache.resolve()
            if cache.name != "ring-lang-thinlto-cache":
                raise HarnessError(
                    "warm runner lanes require a cache directory named "
                    "'ring-lang-thinlto-cache' because the current runner derives "
                    "that path from TEMP"
                )
            if not cache.is_dir() or not any(path.is_file() for path in cache.rglob("*")):
                raise HarnessError(
                    f"warm cache is absent or empty: {cache}; prewarm it before running"
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
    environment = capture_environment(
        manifest,
        manifest_sha,
        run_id,
        tools,
        args.thinlto_cache.resolve(),
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
                    thinlto_cache=args.thinlto_cache.resolve(),
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
                    thinlto_cache=args.thinlto_cache.resolve(),
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
