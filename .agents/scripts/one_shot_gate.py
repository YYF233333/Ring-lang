#!/usr/bin/env python3
"""Durable, non-retryable execution receipts for one-shot repository gates.

This module is the schema and lifecycle authority.  Platform adapters may
launch and measure a child, but only this module creates attempts, classifies
outcomes, writes verdicts, audits recovery state, and archives evidence.
"""

from __future__ import annotations

import argparse
import errno
import hashlib
import importlib.util
import json
import os
import re
import secrets
import signal
import subprocess
import sys
import tarfile
import threading
import time
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any, Callable, Mapping, Sequence


CONTRACT_VERSION = 1
ATTEMPT_SCHEMA = "ring.one-shot.attempt.v1"
VERDICT_SCHEMA = "ring.one-shot.verdict.v1"
AUDIT_SCHEMA = "ring.one-shot.audit.v1"
ARCHIVE_SCHEMA = "ring.one-shot.archive.v1"

ATTEMPT_NAME = "attempt.json"
VERDICT_NAME = "verdict.json"
STDOUT_NAME = "stdout.raw"
STDERR_NAME = "stderr.raw"
RAW_NAMES = (STDOUT_NAME, STDERR_NAME)
COMPLETE_NAMES = tuple(sorted((ATTEMPT_NAME, VERDICT_NAME, *RAW_NAMES)))

GATE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")
HEX_64_RE = re.compile(r"^[0-9a-f]{64}$")
ATTEMPT_ID_RE = re.compile(r"^[0-9A-F]{64}$")
ENV_NAME_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_()]*$")
SECRET_ENV_FRAGMENTS = (
    "TOKEN",
    "SECRET",
    "PASSWORD",
    "PASSWD",
    "CREDENTIAL",
    "COOKIE",
    "PRIVATE_KEY",
    "API_KEY",
    "AUTHORIZATION",
)


class OneShotError(RuntimeError):
    """Base failure for the one-shot contract."""


class ContractError(OneShotError):
    """Static request or packet state violates the contract."""


class ResultSchemaError(OneShotError):
    """A post-child result failed its gate-specific schema."""


class AdapterError(OneShotError):
    """A platform adapter failed after producing a structured outcome."""

    def __init__(self, message: str, outcome: Mapping[str, Any]):
        super().__init__(message)
        self.outcome = dict(outcome)


def _reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ContractError(f"duplicate JSON key {key!r}")
        result[key] = value
    return result


def _load_json(path: Path) -> Any:
    try:
        return json.loads(
            path.read_text(encoding="utf-8"),
            object_pairs_hook=_reject_duplicate_keys,
        )
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise ContractError(f"cannot read JSON {path}: {exc}") from exc


def _json_bytes(value: Any) -> bytes:
    return (
        json.dumps(value, ensure_ascii=True, indent=2, sort_keys=True) + "\n"
    ).encode("ascii")


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    try:
        with path.open("rb") as stream:
            while True:
                chunk = stream.read(1024 * 1024)
                if not chunk:
                    break
                digest.update(chunk)
    except OSError as exc:
        raise ContractError(f"cannot hash {path}: {exc}") from exc
    return digest.hexdigest()


def _fsync_directory(path: Path) -> None:
    if os.name == "nt":
        return
    flags = os.O_RDONLY
    if hasattr(os, "O_DIRECTORY"):
        flags |= os.O_DIRECTORY
    descriptor = os.open(path, flags)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def exclusive_write_bytes(path: Path, data: bytes) -> None:
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_BINARY"):
        flags |= os.O_BINARY
    try:
        descriptor = os.open(path, flags, 0o600)
    except OSError as exc:
        raise ContractError(f"exclusive create failed for {path}: {exc}") from exc
    try:
        view = memoryview(data)
        offset = 0
        while offset < len(view):
            written = os.write(descriptor, view[offset:])
            if written <= 0:
                raise OSError(f"write made no progress: {written}")
            offset += written
        os.fsync(descriptor)
    except BaseException as exc:
        raise ContractError(f"durable write failed for {path}: {exc}") from exc
    finally:
        os.close(descriptor)
    _fsync_directory(path.parent)


def exclusive_write_json(path: Path, value: Any) -> None:
    exclusive_write_bytes(path, _json_bytes(value))


def _strict_keys(value: Any, expected: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ContractError(f"{label} is not an object")
    if set(value) != expected:
        raise ContractError(
            f"{label} keys differ: {sorted(value)} != {sorted(expected)}"
        )
    return value


def _json_safe(value: Any, label: str = "value") -> None:
    if value is None or isinstance(value, (str, bool)):
        return
    if type(value) in (int, float):
        return
    if isinstance(value, list):
        for index, item in enumerate(value):
            _json_safe(item, f"{label}[{index}]")
        return
    if isinstance(value, dict):
        for key, item in value.items():
            if not isinstance(key, str):
                raise ContractError(f"{label} has a non-string key")
            _json_safe(item, f"{label}.{key}")
        return
    raise ContractError(f"{label} is not JSON-safe: {type(value).__name__}")


@dataclass(frozen=True)
class Limits:
    wall_seconds: float
    stdout_cap_bytes: int
    stderr_cap_bytes: int
    job_memory_bytes: int | None = None
    active_process_limit: int | None = None
    poll_ms: int = 10

    def validate(self) -> None:
        if not isinstance(self.wall_seconds, (int, float)) or self.wall_seconds <= 0:
            raise ContractError("wall_seconds must be positive")
        for label, value in (
            ("stdout_cap_bytes", self.stdout_cap_bytes),
            ("stderr_cap_bytes", self.stderr_cap_bytes),
        ):
            if type(value) is not int or value < 0:
                raise ContractError(f"{label} must be a non-negative integer")
        if self.job_memory_bytes is not None and (
            type(self.job_memory_bytes) is not int or self.job_memory_bytes <= 0
        ):
            raise ContractError("job_memory_bytes must be positive when requested")
        if self.active_process_limit is not None and (
            type(self.active_process_limit) is not int
            or self.active_process_limit <= 0
        ):
            raise ContractError("active_process_limit must be positive when requested")
        if self.poll_ms != 10:
            raise ContractError("one-shot process sampling interval is fixed at 10 ms")

    def receipt(self) -> dict[str, Any]:
        return {
            "wall_seconds": float(self.wall_seconds),
            "stdout_cap_bytes": self.stdout_cap_bytes,
            "stderr_cap_bytes": self.stderr_cap_bytes,
            "job_memory_bytes": self.job_memory_bytes,
            "active_process_limit": self.active_process_limit,
            "poll_ms": self.poll_ms,
        }


@dataclass(frozen=True)
class OneShotSpec:
    evidence_dir: Path
    gate_id: str
    argv: tuple[str, ...]
    reviewed_argv: tuple[str, ...]
    cwd: Path
    env: Mapping[str, str]
    reviewed_env: tuple[tuple[str, str], ...]
    limits: Limits
    success_exit_codes: tuple[int, ...] = (0,)


def _validate_platform_support(limits: Limits) -> None:
    if os.name == "nt":
        return
    unsupported: list[str] = []
    if limits.job_memory_bytes is not None:
        unsupported.append("job_memory_bytes")
    if limits.active_process_limit is not None:
        unsupported.append("active_process_limit")
    if unsupported:
        raise ContractError(
            "non-Windows adapter cannot prove requested process-tree limits: "
            + ", ".join(unsupported)
        )


def _validate_spec(spec: OneShotSpec) -> tuple[dict[str, Any], dict[str, str]]:
    spec.limits.validate()
    _validate_platform_support(spec.limits)
    root = spec.evidence_dir
    if not root.is_absolute() or not root.is_dir():
        raise ContractError("evidence_dir must be an existing absolute directory")
    if root.is_symlink():
        raise ContractError("evidence_dir must not be a symlink")
    try:
        inventory = list(os.scandir(root))
    except OSError as exc:
        raise ContractError(f"cannot inventory evidence_dir: {exc}") from exc
    if inventory:
        raise ContractError(
            "fresh evidence_dir is not empty; retry/overwrite is forbidden"
        )
    if GATE_ID_RE.fullmatch(spec.gate_id) is None:
        raise ContractError("gate_id has invalid characters or length")
    if not spec.argv or not all(
        isinstance(part, str) and part and "\x00" not in part for part in spec.argv
    ):
        raise ContractError("argv must be non-empty strings without NUL")
    if spec.argv != spec.reviewed_argv:
        raise ContractError("actual argv differs from explicitly reviewed argv")
    if not spec.cwd.is_absolute() or not spec.cwd.is_dir():
        raise ContractError("cwd must be an existing absolute directory")
    if not spec.success_exit_codes or not all(
        type(code) is int for code in spec.success_exit_codes
    ):
        raise ContractError("success_exit_codes must be non-empty integers")

    env = dict(spec.env)
    reviewed_pairs = list(spec.reviewed_env)
    if not all(
        isinstance(pair, tuple)
        and len(pair) == 2
        and isinstance(pair[0], str)
        and isinstance(pair[1], str)
        for pair in reviewed_pairs
    ):
        raise ContractError("reviewed_env must contain exact (name, value) pairs")
    reviewed = [pair[0] for pair in reviewed_pairs]
    if (
        len(reviewed) != len(set(reviewed))
        or reviewed_pairs != sorted(reviewed_pairs, key=lambda pair: pair[0])
    ):
        raise ContractError("reviewed_env pairs must have unique sorted names")
    reviewed_env = dict(reviewed_pairs)
    if env != reviewed_env:
        raise ContractError("child env differs from the exact reviewed env values")
    for key, value in env.items():
        if ENV_NAME_RE.fullmatch(key) is None:
            raise ContractError(f"environment name is invalid: {key!r}")
        upper = key.upper()
        if any(fragment in upper for fragment in SECRET_ENV_FRAGMENTS):
            raise ContractError(
                f"secret-like environment name cannot enter a receipt: {key!r}"
            )
        if not isinstance(value, str) or "\x00" in value:
            raise ContractError(f"environment value for {key!r} is invalid")

    tool = Path(spec.argv[0])
    if not tool.is_absolute() or tool.is_symlink() or not tool.is_file():
        raise ContractError("argv[0] must be an absolute regular non-link tool")
    try:
        tool_size = tool.stat().st_size
    except OSError as exc:
        raise ContractError(f"cannot stat tool {tool}: {exc}") from exc
    execution = {
        "argv": list(spec.reviewed_argv),
        "cwd": os.fspath(spec.cwd),
        "tool": {
            "path": os.fspath(tool),
            "size": tool_size,
            "sha256": _sha256_file(tool),
        },
        "env": [
            {"name": key, "value": env[key]} for key in reviewed
        ],
    }
    return execution, env


def _attempt_record(
    spec: OneShotSpec, execution: Mapping[str, Any], attempt_id: str
) -> dict[str, Any]:
    return {
        "schema": ATTEMPT_SCHEMA,
        "contract_version": CONTRACT_VERSION,
        "attempt_id": attempt_id,
        "gate_id": spec.gate_id,
        "created_unix_ns": time.time_ns(),
        "execution": dict(execution),
        "limits": spec.limits.receipt(),
        "success_exit_codes": list(spec.success_exit_codes),
        "state": "attempt-created",
    }


ATTEMPT_KEYS = {
    "schema",
    "contract_version",
    "attempt_id",
    "gate_id",
    "created_unix_ns",
    "execution",
    "limits",
    "success_exit_codes",
    "state",
}


EXECUTION_KEYS = {"argv", "cwd", "tool", "env"}
TOOL_KEYS = {"path", "size", "sha256"}
ENV_ENTRY_KEYS = {"name", "value"}
LIMIT_KEYS = {
    "wall_seconds",
    "stdout_cap_bytes",
    "stderr_cap_bytes",
    "job_memory_bytes",
    "active_process_limit",
    "poll_ms",
}


def _validate_execution_receipt(value: Any, label: str) -> dict[str, Any]:
    execution = _strict_keys(value, EXECUTION_KEYS, label)
    argv = execution["argv"]
    if not isinstance(argv, list) or not argv or not all(
        isinstance(part, str) and part and "\x00" not in part for part in argv
    ):
        raise ContractError(f"{label}.argv is invalid")
    if not isinstance(execution["cwd"], str) or not execution["cwd"]:
        raise ContractError(f"{label}.cwd is invalid")
    tool = _strict_keys(execution["tool"], TOOL_KEYS, f"{label}.tool")
    if not isinstance(tool["path"], str) or not tool["path"]:
        raise ContractError(f"{label}.tool.path is invalid")
    if type(tool["size"]) is not int or tool["size"] < 0:
        raise ContractError(f"{label}.tool.size is invalid")
    if not isinstance(tool["sha256"], str) or HEX_64_RE.fullmatch(
        tool["sha256"]
    ) is None:
        raise ContractError(f"{label}.tool.sha256 is invalid")
    env = execution["env"]
    if not isinstance(env, list):
        raise ContractError(f"{label}.env is not a list")
    names: list[str] = []
    for index, entry_value in enumerate(env):
        entry = _strict_keys(
            entry_value, ENV_ENTRY_KEYS, f"{label}.env[{index}]"
        )
        name = entry["name"]
        value = entry["value"]
        if not isinstance(name, str) or ENV_NAME_RE.fullmatch(name) is None:
            raise ContractError(f"{label}.env[{index}].name is invalid")
        if any(fragment in name.upper() for fragment in SECRET_ENV_FRAGMENTS):
            raise ContractError(f"{label}.env contains a secret-like name")
        if not isinstance(value, str) or "\x00" in value:
            raise ContractError(f"{label}.env[{index}].value is invalid")
        names.append(name)
    if names != sorted(set(names)):
        raise ContractError(f"{label}.env names are not unique/sorted")
    return execution


def _validate_limits_receipt(value: Any, label: str) -> dict[str, Any]:
    limits = _strict_keys(value, LIMIT_KEYS, label)
    if not isinstance(limits["wall_seconds"], (int, float)) or limits[
        "wall_seconds"
    ] <= 0:
        raise ContractError(f"{label}.wall_seconds is invalid")
    for key in ("stdout_cap_bytes", "stderr_cap_bytes"):
        if type(limits[key]) is not int or limits[key] < 0:
            raise ContractError(f"{label}.{key} is invalid")
    for key in ("job_memory_bytes", "active_process_limit"):
        if limits[key] is not None and (
            type(limits[key]) is not int or limits[key] <= 0
        ):
            raise ContractError(f"{label}.{key} is invalid")
    if limits["poll_ms"] != 10:
        raise ContractError(f"{label}.poll_ms is invalid")
    return limits


def _validate_attempt(value: Any) -> dict[str, Any]:
    attempt = _strict_keys(value, ATTEMPT_KEYS, "attempt")
    if attempt["schema"] != ATTEMPT_SCHEMA:
        raise ContractError("attempt schema mismatch")
    if attempt["contract_version"] != CONTRACT_VERSION:
        raise ContractError("attempt contract version mismatch")
    if not isinstance(attempt["attempt_id"], str) or ATTEMPT_ID_RE.fullmatch(
        attempt["attempt_id"]
    ) is None:
        raise ContractError("attempt_id is invalid")
    if not isinstance(attempt["gate_id"], str) or GATE_ID_RE.fullmatch(
        attempt["gate_id"]
    ) is None:
        raise ContractError("attempt gate_id is invalid")
    if type(attempt["created_unix_ns"]) is not int or attempt["created_unix_ns"] <= 0:
        raise ContractError("attempt timestamp is invalid")
    if attempt["state"] != "attempt-created":
        raise ContractError("attempt state mismatch")
    _validate_execution_receipt(attempt["execution"], "attempt.execution")
    _validate_limits_receipt(attempt["limits"], "attempt.limits")
    if not isinstance(attempt["success_exit_codes"], list) or not (
        attempt["success_exit_codes"]
        and all(type(code) is int for code in attempt["success_exit_codes"])
    ):
        raise ContractError("attempt success_exit_codes are invalid")
    return attempt


STREAM_KEYS = {
    "path",
    "captured_size",
    "sha256",
    "bytes_seen",
    "cap_bytes",
    "truncated_at_cap",
    "fsynced",
    "error",
}


OUTCOME_KEYS = {
    "adapter",
    "support",
    "stage",
    "exit_code",
    "timed_out",
    "memory_limit_hit",
    "process_limit_hit",
    "output_limit_hit",
    "launch_error",
    "pipe_error",
    "thread_error",
    "infrastructure_error",
    "measurements",
    "streams",
}


def _validate_stream_record(
    value: Any, stream: str, expected_path: str, expected_cap: int
) -> dict[str, Any]:
    record = _strict_keys(value, STREAM_KEYS, f"stream.{stream}")
    if record["path"] != expected_path:
        raise ContractError(f"stream.{stream} path mismatch")
    for key in ("captured_size", "bytes_seen", "cap_bytes"):
        if type(record[key]) is not int or record[key] < 0:
            raise ContractError(f"stream.{stream}.{key} is invalid")
    if record["cap_bytes"] != expected_cap:
        raise ContractError(f"stream.{stream} cap mismatch")
    if not isinstance(record["sha256"], str) or HEX_64_RE.fullmatch(
        record["sha256"]
    ) is None:
        raise ContractError(f"stream.{stream} sha256 is invalid")
    for key in ("truncated_at_cap", "fsynced"):
        if type(record[key]) is not bool:
            raise ContractError(f"stream.{stream}.{key} is not boolean")
    if record["error"] is not None and not isinstance(record["error"], str):
        raise ContractError(f"stream.{stream}.error is invalid")
    if record["captured_size"] > record["cap_bytes"]:
        raise ContractError(f"stream.{stream} exceeds its cap")
    if record["truncated_at_cap"]:
        if record["captured_size"] != record["cap_bytes"]:
            raise ContractError(f"stream.{stream} truncated prefix is not exact cap")
        if record["bytes_seen"] < record["captured_size"]:
            raise ContractError(f"stream.{stream} bytes_seen is inconsistent")
    elif record["bytes_seen"] != record["captured_size"]:
        raise ContractError(f"stream.{stream} lost uncapped bytes")
    return record


def _validate_adapter_outcome(
    value: Any, limits: Limits
) -> dict[str, Any]:
    outcome = _strict_keys(value, OUTCOME_KEYS, "adapter outcome")
    if not isinstance(outcome["adapter"], str) or not outcome["adapter"]:
        raise ContractError("adapter name is invalid")
    support = _strict_keys(outcome["support"], SUPPORT_KEYS, "adapter support")
    if not all(isinstance(value, str) and value for value in support.values()):
        raise ContractError("adapter support has invalid values")
    if outcome["stage"] != "child-sealed":
        raise ContractError("adapter did not seal the child evidence")
    if outcome["exit_code"] is not None and type(outcome["exit_code"]) is not int:
        raise ContractError("adapter exit_code is invalid")
    for key in (
        "timed_out",
        "memory_limit_hit",
        "process_limit_hit",
        "output_limit_hit",
    ):
        if type(outcome[key]) is not bool:
            raise ContractError(f"adapter {key} is not boolean")
    for key in (
        "launch_error",
        "pipe_error",
        "thread_error",
        "infrastructure_error",
    ):
        if outcome[key] is not None and not isinstance(outcome[key], str):
            raise ContractError(f"adapter {key} is invalid")
    if not isinstance(outcome["measurements"], dict):
        raise ContractError("adapter measurements are not an object")
    streams = _strict_keys(outcome["streams"], {"stdout", "stderr"}, "streams")
    _validate_stream_record(
        streams["stdout"], "stdout", STDOUT_NAME, limits.stdout_cap_bytes
    )
    _validate_stream_record(
        streams["stderr"], "stderr", STDERR_NAME, limits.stderr_cap_bytes
    )
    if not streams["stdout"]["fsynced"] or not streams["stderr"]["fsynced"]:
        raise ContractError("adapter returned before raw streams were fsynced")
    expected_output_hit = bool(
        streams["stdout"]["truncated_at_cap"]
        or streams["stderr"]["truncated_at_cap"]
    )
    if outcome["output_limit_hit"] != expected_output_hit:
        raise ContractError("adapter output-limit classification mismatches raw streams")
    _json_safe(outcome["measurements"], "adapter.measurements")
    return outcome


def _verify_raw_identity(root: Path, streams: Mapping[str, Any]) -> None:
    for stream, expected_name in (("stdout", STDOUT_NAME), ("stderr", STDERR_NAME)):
        record = streams[stream]
        path = root / expected_name
        if path.is_symlink() or not path.is_file():
            raise ContractError(f"{stream} raw file is missing/non-regular")
        try:
            size = path.stat().st_size
        except OSError as exc:
            raise ContractError(f"cannot stat {stream} raw: {exc}") from exc
        if size != record["captured_size"]:
            raise ContractError(f"{stream} raw size changed before verdict")
        if _sha256_file(path) != record["sha256"]:
            raise ContractError(f"{stream} raw hash changed before verdict")


def _verify_tool_identity(execution: Mapping[str, Any]) -> None:
    tool = execution["tool"]
    path = Path(tool["path"])
    if path.is_symlink() or not path.is_file():
        raise ContractError("execution tool disappeared or became non-regular")
    if path.stat().st_size != tool["size"]:
        raise ContractError("execution tool size changed during the attempt")
    if _sha256_file(path) != tool["sha256"]:
        raise ContractError("execution tool hash changed during the attempt")


def _classify_outcome(
    outcome: Mapping[str, Any], success_codes: Sequence[int]
) -> tuple[str, str | None]:
    if outcome["launch_error"] is not None:
        return "launch_error", outcome["launch_error"]
    if outcome["pipe_error"] is not None:
        return "pipe_error", outcome["pipe_error"]
    if outcome["thread_error"] is not None:
        return "thread_error", outcome["thread_error"]
    if outcome["infrastructure_error"] is not None:
        return "infrastructure_error", outcome["infrastructure_error"]
    if outcome["process_limit_hit"]:
        return "process_limit", "active process limit was reached"
    if outcome["memory_limit_hit"]:
        return "memory_limit", "job memory limit was reached"
    if outcome["timed_out"]:
        return "timeout", "wall-time limit was reached"
    if outcome["output_limit_hit"]:
        return "output_limit", "one or more output streams reached their cap"
    if outcome["exit_code"] not in success_codes:
        return "child_nonzero", f"child exited {outcome['exit_code']}"
    return "success", None


VERDICT_KEYS = {
    "schema",
    "contract_version",
    "attempt_id",
    "attempt_sha256",
    "gate_id",
    "status",
    "classification",
    "stage",
    "execution",
    "limits",
    "success_exit_codes",
    "child",
    "measurements",
    "streams",
    "error",
    "created_unix_ns",
}


CHILD_KEYS = {
    "adapter",
    "support",
    "exit_code",
    "timed_out",
    "memory_limit_hit",
    "process_limit_hit",
    "output_limit_hit",
    "launch_error",
    "pipe_error",
    "thread_error",
    "infrastructure_error",
}
SUPPORT_KEYS = {"wall", "output", "job_memory", "active_process"}


def _validate_child_receipt(value: Any, label: str) -> dict[str, Any]:
    child = _strict_keys(value, CHILD_KEYS, label)
    if not isinstance(child["adapter"], str) or not child["adapter"]:
        raise ContractError(f"{label}.adapter is invalid")
    support = _strict_keys(child["support"], SUPPORT_KEYS, f"{label}.support")
    if not all(isinstance(value, str) and value for value in support.values()):
        raise ContractError(f"{label}.support has invalid values")
    if child["exit_code"] is not None and type(child["exit_code"]) is not int:
        raise ContractError(f"{label}.exit_code is invalid")
    for key in (
        "timed_out",
        "memory_limit_hit",
        "process_limit_hit",
        "output_limit_hit",
    ):
        if type(child[key]) is not bool:
            raise ContractError(f"{label}.{key} is not boolean")
    for key in (
        "launch_error",
        "pipe_error",
        "thread_error",
        "infrastructure_error",
    ):
        if child[key] is not None and not isinstance(child[key], str):
            raise ContractError(f"{label}.{key} is invalid")
    return child


def _validate_verdict(value: Any) -> dict[str, Any]:
    verdict = _strict_keys(value, VERDICT_KEYS, "verdict")
    if verdict["schema"] != VERDICT_SCHEMA:
        raise ContractError("verdict schema mismatch")
    if verdict["contract_version"] != CONTRACT_VERSION:
        raise ContractError("verdict contract version mismatch")
    if not isinstance(verdict["attempt_id"], str) or ATTEMPT_ID_RE.fullmatch(
        verdict["attempt_id"]
    ) is None:
        raise ContractError("verdict attempt_id is invalid")
    if not isinstance(verdict["attempt_sha256"], str) or HEX_64_RE.fullmatch(
        verdict["attempt_sha256"]
    ) is None:
        raise ContractError("verdict attempt hash is invalid")
    if verdict["status"] not in {"success", "failure"}:
        raise ContractError("verdict status is invalid")
    if not isinstance(verdict["classification"], str):
        raise ContractError("verdict classification is invalid")
    if not isinstance(verdict["stage"], str):
        raise ContractError("verdict stage is invalid")
    if verdict["error"] is not None and not isinstance(verdict["error"], str):
        raise ContractError("verdict error is invalid")
    if type(verdict["created_unix_ns"]) is not int:
        raise ContractError("verdict timestamp is invalid")
    _validate_execution_receipt(verdict["execution"], "verdict.execution")
    limits = _validate_limits_receipt(verdict["limits"], "verdict.limits")
    if not isinstance(verdict["success_exit_codes"], list) or not (
        verdict["success_exit_codes"]
        and all(type(code) is int for code in verdict["success_exit_codes"])
    ):
        raise ContractError("verdict success_exit_codes are invalid")
    _validate_child_receipt(verdict["child"], "verdict.child")
    _json_safe(verdict["measurements"], "verdict.measurements")
    streams = _strict_keys(
        verdict["streams"], {"stdout", "stderr"}, "verdict.streams"
    )
    _validate_stream_record(
        streams["stdout"],
        "stdout",
        STDOUT_NAME,
        limits["stdout_cap_bytes"],
    )
    _validate_stream_record(
        streams["stderr"],
        "stderr",
        STDERR_NAME,
        limits["stderr_cap_bytes"],
    )
    if not streams["stdout"]["fsynced"] or not streams["stderr"]["fsynced"]:
        raise ContractError("verdict cannot precede fsynced raw streams")
    return verdict


def _load_windows_adapter() -> Callable[..., dict[str, Any]]:
    global _WINDOWS_ADAPTER
    if _WINDOWS_ADAPTER is not None:
        return _WINDOWS_ADAPTER
    repo_root = Path(__file__).resolve().parents[2]
    path = repo_root / "bench" / "check" / "windows_job.py"
    spec = importlib.util.spec_from_file_location("ring_windows_job", path)
    if spec is None or spec.loader is None:
        raise ContractError(f"cannot import Windows adapter {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    adapter = getattr(module, "run_one_shot_job", None)
    if not callable(adapter):
        raise ContractError("windows_job.py lacks run_one_shot_job")
    _WINDOWS_ADAPTER = adapter
    return _WINDOWS_ADAPTER


_WINDOWS_ADAPTER: Callable[..., dict[str, Any]] | None = None


class _PrefixSink:
    """Non-Windows simultaneous stream sink with the shared raw schema."""

    def __init__(self, path: Path, relative_path: str, cap: int) -> None:
        self.path = path
        self.relative_path = relative_path
        self.cap = cap
        self.captured = 0
        self.seen = 0
        self.truncated = False
        self.error: str | None = None
        self.digest = hashlib.sha256()
        self._fd: int | None = None

    def open(self) -> None:
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
        if hasattr(os, "O_BINARY"):
            flags |= os.O_BINARY
        self._fd = os.open(self.path, flags, 0o600)

    def consume(self, chunk: bytes) -> None:
        self.seen += len(chunk)
        remaining = self.cap - self.captured
        prefix = chunk[: max(0, remaining)]
        if prefix and self._fd is not None:
            view = memoryview(prefix)
            offset = 0
            while offset < len(view):
                written = os.write(self._fd, view[offset:])
                if written <= 0:
                    raise OSError(f"stream write made no progress: {written}")
                self.digest.update(view[offset : offset + written])
                offset += written
            self.captured += len(prefix)
        if len(chunk) > len(prefix):
            self.truncated = True

    def seal(self) -> None:
        if self._fd is not None:
            os.fsync(self._fd)
            os.close(self._fd)
            self._fd = None
        _fsync_directory(self.path.parent)

    def record(self) -> dict[str, Any]:
        return {
            "path": self.relative_path,
            "captured_size": self.captured,
            "sha256": self.digest.hexdigest(),
            "bytes_seen": self.seen,
            "cap_bytes": self.cap,
            "truncated_at_cap": self.truncated,
            "fsynced": self._fd is None,
            "error": self.error,
        }


def _posix_group_exists(pgid: int) -> bool:
    try:
        os.killpg(pgid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True


def _run_non_windows_job(
    argv: Sequence[str],
    *,
    cwd: Path,
    env: Mapping[str, str],
    stdout_path: Path,
    stderr_path: Path,
    limits: Limits,
) -> dict[str, Any]:
    _validate_platform_support(limits)
    if os.name == "nt":
        raise ContractError("portable process-group adapter requires POSIX")
    stdout_sink = _PrefixSink(stdout_path, STDOUT_NAME, limits.stdout_cap_bytes)
    stderr_sink = _PrefixSink(stderr_path, STDERR_NAME, limits.stderr_cap_bytes)
    stdout_sink.open()
    try:
        stderr_sink.open()
    except BaseException:
        stdout_sink.seal()
        raise
    process: subprocess.Popen[bytes] | None = None
    stop = threading.Event()
    thread_errors: list[str] = []
    threads: list[threading.Thread] = []
    timed_out = False
    launch_error: str | None = None
    infrastructure_errors: list[str] = []
    pgid: int | None = None
    group_kill_reason: str | None = None
    group_quiesced = False
    descendant_leak = False
    started_ns = time.perf_counter_ns()

    def kill_group(reason: str) -> None:
        nonlocal group_kill_reason
        if pgid is None:
            return
        if pgid == os.getpgrp():
            infrastructure_errors.append(
                "refused to signal the parent process group"
            )
            return
        if group_kill_reason is None:
            group_kill_reason = reason
        try:
            os.killpg(pgid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        except OSError as exc:
            infrastructure_errors.append(
                f"killpg({reason}): {type(exc).__name__}: {exc}"
            )

    def wait_group_quiescence() -> bool:
        if pgid is None:
            return True
        deadline = time.monotonic() + 5
        while _posix_group_exists(pgid):
            if time.monotonic() >= deadline:
                infrastructure_errors.append(
                    "process group did not quiesce within 5 seconds"
                )
                return False
            time.sleep(limits.poll_ms / 1000)
        return True

    def reader(stream, sink: _PrefixSink, label: str) -> None:
        try:
            while True:
                chunk = os.read(stream.fileno(), 65536)
                if not chunk:
                    break
                sink.consume(chunk)
                if sink.truncated:
                    stop.set()
                    break
        except BaseException as exc:
            message = f"{label}: {type(exc).__name__}: {exc}"
            sink.error = message
            thread_errors.append(message)
            stop.set()

    try:
        process = subprocess.Popen(
            list(argv),
            cwd=cwd,
            env=dict(env),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            close_fds=True,
            start_new_session=True,
        )
        pgid = process.pid
        try:
            observed_pgid = os.getpgid(process.pid)
            if observed_pgid != pgid:
                raise ContractError(
                    f"new-session pgid mismatch {observed_pgid} != {pgid}"
                )
        except ProcessLookupError:
            # A very short root may already be a zombie; its session/group ID
            # remains the root PID for descendant cleanup.
            pass
        assert process.stdout is not None and process.stderr is not None
        threads = [
            threading.Thread(
                target=reader,
                args=(process.stdout, stdout_sink, "stdout"),
                daemon=True,
            ),
            threading.Thread(
                target=reader,
                args=(process.stderr, stderr_sink, "stderr"),
                daemon=True,
            ),
        ]
        for thread in threads:
            thread.start()
        deadline = time.monotonic() + limits.wall_seconds
        while process.poll() is None:
            if stop.is_set():
                kill_group(
                    "output-cap"
                    if stdout_sink.truncated or stderr_sink.truncated
                    else "stream-stop"
                )
                break
            if time.monotonic() >= deadline:
                timed_out = True
                kill_group("timeout")
                break
            time.sleep(limits.poll_ms / 1000)
        process.wait(timeout=5)
        if _posix_group_exists(pgid):
            if group_kill_reason is None:
                descendant_leak = True
                infrastructure_errors.append(
                    "root exited while descendants survived in its process group"
                )
                kill_group("surviving-descendants")
            group_quiesced = wait_group_quiescence()
        else:
            group_quiesced = True
    except BaseException as exc:
        message = f"{type(exc).__name__}: {exc}"
        if process is None:
            launch_error = message
        else:
            infrastructure_errors.append(message)
            kill_group("adapter-exception")
            try:
                process.wait(timeout=5)
            except BaseException as wait_exc:
                infrastructure_errors.append(
                    f"root wait: {type(wait_exc).__name__}: {wait_exc}"
                )
            group_quiesced = wait_group_quiescence()
    finally:
        if process is not None and pgid is not None and _posix_group_exists(pgid):
            if group_kill_reason is None:
                descendant_leak = True
                infrastructure_errors.append(
                    "cleanup found surviving descendants in the process group"
                )
            kill_group("final-cleanup")
            if process.poll() is None:
                try:
                    process.wait(timeout=5)
                except BaseException as exc:
                    infrastructure_errors.append(
                        f"final root wait: {type(exc).__name__}: {exc}"
                    )
            group_quiesced = wait_group_quiescence()
        for thread in threads:
            thread.join(timeout=5)
        if process is not None:
            for stream in (process.stdout, process.stderr):
                if stream is not None:
                    try:
                        stream.close()
                    except OSError as exc:
                        thread_errors.append(
                            f"pipe-close: {type(exc).__name__}: {exc}"
                        )
            for thread in threads:
                if thread.is_alive():
                    thread.join(timeout=1)
        if not threads:
            for sink in (stdout_sink, stderr_sink):
                try:
                    sink.seal()
                except BaseException as exc:
                    thread_errors.append(f"seal: {type(exc).__name__}: {exc}")
        for sink in (stdout_sink, stderr_sink):
            try:
                sink.seal()
            except BaseException as exc:
                message = f"final-seal: {type(exc).__name__}: {exc}"
                sink.error = message
                thread_errors.append(message)
    alive = [thread.name for thread in threads if thread.is_alive()]
    thread_error = (
        "; ".join(thread_errors)
        if thread_errors
        else (f"threads did not quiesce: {alive}" if alive else None)
    )
    return {
        "adapter": "subprocess-v1",
        "support": {
            "wall": "enforced",
            "output": "enforced",
            "job_memory": "unsupported-not-requested",
            "active_process": "unsupported-not-requested",
        },
        "stage": "child-sealed",
        "exit_code": process.returncode if process is not None else None,
        "timed_out": timed_out,
        "memory_limit_hit": False,
        "process_limit_hit": False,
        "output_limit_hit": stdout_sink.truncated or stderr_sink.truncated,
        "launch_error": launch_error,
        "pipe_error": next(
            (sink.error for sink in (stdout_sink, stderr_sink) if sink.error), None
        ),
        "thread_error": thread_error,
        "infrastructure_error": (
            "; ".join(dict.fromkeys(infrastructure_errors))
            if infrastructure_errors
            else None
        ),
        "measurements": {
            "wall_ns": time.perf_counter_ns() - started_ns,
            "process_count": None,
            "peak_job_memory_bytes": None,
            "thread_count": len(threads),
            "process_group_id": pgid,
            "process_group_quiesced": group_quiesced,
            "process_group_kill_reason": group_kill_reason,
            "surviving_descendant_detected": descendant_leak,
        },
        "streams": {
            "stdout": stdout_sink.record(),
            "stderr": stderr_sink.record(),
        },
    }


def _select_adapter() -> Callable[..., dict[str, Any]]:
    return _load_windows_adapter() if os.name == "nt" else _run_non_windows_job


@dataclass
class PreparedAttempt:
    spec: OneShotSpec
    attempt: dict[str, Any]
    env: dict[str, str]
    _executed: bool = False

    def execute(
        self,
        *,
        result_validator: Callable[[Mapping[str, Any]], None] | None = None,
        _adapter: Callable[..., dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        if self._executed:
            raise ContractError("prepared attempt has already executed")
        self._executed = True
        root = self.spec.evidence_dir
        if (root / VERDICT_NAME).exists() or any(
            (root / name).exists() for name in RAW_NAMES
        ):
            raise ContractError("attempt contains prior raw/verdict; retry is forbidden")
        adapter = _select_adapter() if _adapter is None else _adapter
        outcome: dict[str, Any]
        adapter_exception: str | None = None
        try:
            outcome = adapter(
                self.spec.argv,
                cwd=self.spec.cwd,
                env=self.env,
                stdout_path=root / STDOUT_NAME,
                stderr_path=root / STDERR_NAME,
                limits=self.spec.limits,
            )
        except AdapterError as exc:
            adapter_exception = str(exc)
            outcome = dict(exc.outcome)
        except BaseException as exc:
            adapter_exception = f"{type(exc).__name__}: {exc}"
            outcome = _outcome_from_existing_raw(
                root, self.spec.limits, adapter_exception
            )
        try:
            outcome = _validate_adapter_outcome(outcome, self.spec.limits)
            _verify_raw_identity(root, outcome["streams"])
        except ContractError as exc:
            adapter_exception = f"adapter schema: {exc}"
            outcome = _validate_adapter_outcome(
                _outcome_from_existing_raw(
                    root, self.spec.limits, adapter_exception
                ),
                self.spec.limits,
            )
            _verify_raw_identity(root, outcome["streams"])
        try:
            _verify_tool_identity(self.attempt["execution"])
        except ContractError as exc:
            adapter_exception = f"execution identity: {exc}"
            outcome = dict(outcome)
            outcome["infrastructure_error"] = adapter_exception
        if adapter_exception is not None and outcome["infrastructure_error"] is None:
            outcome = dict(outcome)
            outcome["infrastructure_error"] = adapter_exception
        classification, error = _classify_outcome(
            outcome, self.spec.success_exit_codes
        )
        stage = "child"
        if classification == "success" and result_validator is not None:
            stage = "result-schema"
            try:
                result_validator(outcome)
            except ResultSchemaError as exc:
                classification = "schema_error"
                error = str(exc)
            except BaseException as exc:
                classification = "schema_error"
                error = f"{type(exc).__name__}: {exc}"
        status = "success" if classification == "success" else "failure"
        attempt_path = root / ATTEMPT_NAME
        verdict = {
            "schema": VERDICT_SCHEMA,
            "contract_version": CONTRACT_VERSION,
            "attempt_id": self.attempt["attempt_id"],
            "attempt_sha256": _sha256_file(attempt_path),
            "gate_id": self.spec.gate_id,
            "status": status,
            "classification": classification,
            "stage": stage,
            "execution": self.attempt["execution"],
            "limits": self.attempt["limits"],
            "success_exit_codes": self.attempt["success_exit_codes"],
            "child": {
                "adapter": outcome["adapter"],
                "support": outcome["support"],
                "exit_code": outcome["exit_code"],
                "timed_out": outcome["timed_out"],
                "memory_limit_hit": outcome["memory_limit_hit"],
                "process_limit_hit": outcome["process_limit_hit"],
                "output_limit_hit": outcome["output_limit_hit"],
                "launch_error": outcome["launch_error"],
                "pipe_error": outcome["pipe_error"],
                "thread_error": outcome["thread_error"],
                "infrastructure_error": outcome["infrastructure_error"],
            },
            "measurements": outcome["measurements"],
            "streams": outcome["streams"],
            "error": error,
            "created_unix_ns": time.time_ns(),
        }
        _validate_verdict(verdict)
        exclusive_write_json(root / VERDICT_NAME, verdict)
        return verdict


def _outcome_from_existing_raw(
    root: Path, limits: Limits, error: str
) -> dict[str, Any]:
    streams: dict[str, Any] = {}
    for stream, name, cap in (
        ("stdout", STDOUT_NAME, limits.stdout_cap_bytes),
        ("stderr", STDERR_NAME, limits.stderr_cap_bytes),
    ):
        path = root / name
        if path.is_file() and not path.is_symlink():
            size = path.stat().st_size
            try:
                descriptor = os.open(path, os.O_RDWR)
                try:
                    os.fsync(descriptor)
                finally:
                    os.close(descriptor)
                fsynced = True
            except OSError:
                fsynced = False
            streams[stream] = {
                "path": name,
                "captured_size": size,
                "sha256": _sha256_file(path),
                "bytes_seen": size,
                "cap_bytes": cap,
                "truncated_at_cap": size == cap and cap > 0,
                "fsynced": fsynced,
                "error": error,
            }
        else:
            exclusive_write_bytes(path, b"")
            streams[stream] = {
                "path": name,
                "captured_size": 0,
                "sha256": _sha256_bytes(b""),
                "bytes_seen": 0,
                "cap_bytes": cap,
                "truncated_at_cap": False,
                "fsynced": True,
                "error": error,
            }
    return {
        "adapter": "unknown-adapter-v1",
        "support": {
            "wall": "unknown",
            "output": "unknown",
            "job_memory": "unknown",
            "active_process": "unknown",
        },
        "stage": "child-sealed",
        "exit_code": None,
        "timed_out": False,
        "memory_limit_hit": False,
        "process_limit_hit": False,
        "output_limit_hit": any(
            record["truncated_at_cap"] for record in streams.values()
        ),
        "launch_error": None,
        "pipe_error": None,
        "thread_error": None,
        "infrastructure_error": error,
        "measurements": {},
        "streams": streams,
    }


def prepare_attempt(spec: OneShotSpec) -> PreparedAttempt:
    execution, env = _validate_spec(spec)
    attempt_id = secrets.token_hex(32).upper()
    attempt = _attempt_record(spec, execution, attempt_id)
    _validate_attempt(attempt)
    exclusive_write_json(spec.evidence_dir / ATTEMPT_NAME, attempt)
    return PreparedAttempt(spec=spec, attempt=attempt, env=env)


def run_one_shot(
    spec: OneShotSpec,
    *,
    result_validator: Callable[[Mapping[str, Any]], None] | None = None,
    _adapter: Callable[..., dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return prepare_attempt(spec).execute(
        result_validator=result_validator, _adapter=_adapter
    )


def audit_attempt(evidence_dir: Path) -> dict[str, Any]:
    root = evidence_dir.resolve()
    result = {
        "schema": AUDIT_SCHEMA,
        "contract_version": CONTRACT_VERSION,
        "evidence_dir": os.fspath(root),
        "consumed": False,
        "state": "absent",
        "status": "unknown",
        "classification": "unknown",
        "errors": [],
    }
    attempt_path = root / ATTEMPT_NAME
    if not os.path.lexists(attempt_path):
        if root.exists() and any(root.iterdir()):
            result["state"] = "incomplete"
            result["errors"].append("evidence exists without an attempt marker")
        return result
    result["consumed"] = True
    if attempt_path.is_symlink() or not attempt_path.is_file():
        result["state"] = "incomplete"
        result["errors"].append("attempt marker is not a regular non-link file")
        return result
    try:
        attempt = _validate_attempt(_load_json(attempt_path))
    except ContractError as exc:
        result["state"] = "incomplete"
        result["errors"].append(str(exc))
        return result
    verdict_path = root / VERDICT_NAME
    if verdict_path.is_symlink() or not verdict_path.is_file():
        result["state"] = "incomplete"
        result["errors"].append("attempt has no verdict (parent crash/unknown)")
        return result
    try:
        verdict = _validate_verdict(_load_json(verdict_path))
    except ContractError as exc:
        result["state"] = "incomplete"
        result["errors"].append(str(exc))
        return result
    if verdict["attempt_id"] != attempt["attempt_id"]:
        result["errors"].append("attempt/verdict id mismatch")
    if verdict["attempt_sha256"] != _sha256_file(attempt_path):
        result["errors"].append("attempt bytes changed after verdict")
    if verdict["gate_id"] != attempt["gate_id"]:
        result["errors"].append("attempt/verdict gate mismatch")
    if verdict["execution"] != attempt["execution"]:
        result["errors"].append("attempt/verdict execution identity mismatch")
    if verdict["limits"] != attempt["limits"]:
        result["errors"].append("attempt/verdict limits mismatch")
    if verdict["success_exit_codes"] != attempt["success_exit_codes"]:
        result["errors"].append("attempt/verdict success exit codes mismatch")
    child = verdict["child"]
    preliminary, _preliminary_error = _classify_outcome(
        child, attempt["success_exit_codes"]
    )
    if verdict["classification"] == "schema_error":
        if preliminary != "success" or verdict["stage"] != "result-schema":
            result["errors"].append("schema_error lacks a successful child/schema stage")
    else:
        if verdict["classification"] != preliminary:
            result["errors"].append("verdict classification contradicts child facts")
        if verdict["stage"] != "child":
            result["errors"].append("non-schema verdict stage is not child")
    expected_status = (
        "success" if verdict["classification"] == "success" else "failure"
    )
    if verdict["status"] != expected_status:
        result["errors"].append("verdict status contradicts classification")
    if expected_status == "success" and verdict["error"] is not None:
        result["errors"].append("successful verdict unexpectedly has an error")
    if expected_status == "failure" and verdict["error"] is None:
        result["errors"].append("failed verdict lacks an error class/message")
    try:
        inventory = sorted(entry.name for entry in os.scandir(root))
        if inventory != list(COMPLETE_NAMES):
            result["errors"].append(
                f"complete inventory mismatch: {inventory} != {list(COMPLETE_NAMES)}"
            )
    except OSError as exc:
        result["errors"].append(f"cannot inventory evidence: {exc}")
    for stream, expected_name in (("stdout", STDOUT_NAME), ("stderr", STDERR_NAME)):
        record = verdict["streams"].get(stream)
        try:
            cap = attempt["limits"][f"{stream}_cap_bytes"]
            validated = _validate_stream_record(record, stream, expected_name, cap)
            raw_path = root / expected_name
            if raw_path.is_symlink() or not raw_path.is_file():
                raise ContractError(f"{stream} raw file is missing/non-regular")
            actual_size = raw_path.stat().st_size
            actual_hash = _sha256_file(raw_path)
            if actual_size != validated["captured_size"]:
                raise ContractError(f"{stream} raw size mismatch")
            if actual_hash != validated["sha256"]:
                raise ContractError(f"{stream} raw hash mismatch")
            if not validated["fsynced"]:
                raise ContractError(f"{stream} was not sealed before verdict")
        except (ContractError, OSError, KeyError) as exc:
            result["errors"].append(str(exc))
    stream_limit_hit = bool(
        verdict["streams"]["stdout"]["truncated_at_cap"]
        or verdict["streams"]["stderr"]["truncated_at_cap"]
    )
    if child["output_limit_hit"] != stream_limit_hit:
        result["errors"].append("child output-limit flag contradicts raw streams")
    if result["errors"]:
        result["state"] = "incomplete"
        result["status"] = "unknown"
        result["classification"] = "unknown"
    else:
        result["state"] = "complete"
        result["status"] = verdict["status"]
        result["classification"] = verdict["classification"]
    return result


def _archive_inventory(evidence_dir: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for path in sorted(evidence_dir.rglob("*"), key=lambda item: item.as_posix()):
        if path.is_symlink():
            raise ContractError(f"archive evidence contains symlink: {path}")
        if path.is_dir():
            continue
        if not path.is_file():
            raise ContractError(f"archive evidence contains non-file: {path}")
        relative = path.relative_to(evidence_dir).as_posix()
        records.append(
            {
                "path": relative,
                "size": path.stat().st_size,
                "sha256": _sha256_file(path),
            }
        )
    return records


def create_archive(evidence_dir: Path, archive_path: Path) -> dict[str, Any]:
    root = evidence_dir.resolve()
    target = archive_path.resolve()
    if root == target or root in target.parents:
        raise ContractError("archive must be outside the evidence directory")
    records = _archive_inventory(root)
    manifest = {
        "schema": ARCHIVE_SCHEMA,
        "contract_version": CONTRACT_VERSION,
        "file_count": len(records),
        "files": records,
    }
    manifest_bytes = _json_bytes(manifest)
    try:
        with tarfile.open(target, mode="x") as archive:
            for record in records:
                source = root / record["path"]
                archive.add(source, arcname=f"evidence/{record['path']}", recursive=False)
            info = tarfile.TarInfo("archive-manifest.json")
            info.size = len(manifest_bytes)
            info.mtime = 0
            import io

            archive.addfile(info, io.BytesIO(manifest_bytes))
    except (OSError, tarfile.TarError) as exc:
        raise ContractError(f"cannot create exclusive archive {target}: {exc}") from exc
    verified = verify_archive(target)
    if verified != manifest:
        raise ContractError("archive round-trip manifest differs")
    return manifest


def verify_archive(archive_path: Path) -> dict[str, Any]:
    path = archive_path.resolve()
    try:
        with tarfile.open(path, mode="r:") as archive:
            members = archive.getmembers()
            by_name = {member.name: member for member in members}
            if len(by_name) != len(members):
                raise ContractError("archive contains duplicate member names")
            manifest_member = by_name.get("archive-manifest.json")
            if manifest_member is None or not manifest_member.isfile():
                raise ContractError("archive manifest member is missing")
            manifest_stream = archive.extractfile(manifest_member)
            if manifest_stream is None:
                raise ContractError("cannot read archive manifest member")
            manifest = json.loads(
                manifest_stream.read().decode("utf-8"),
                object_pairs_hook=_reject_duplicate_keys,
            )
            _strict_keys(
                manifest,
                {"schema", "contract_version", "file_count", "files"},
                "archive manifest",
            )
            if manifest["schema"] != ARCHIVE_SCHEMA:
                raise ContractError("archive schema mismatch")
            if manifest["contract_version"] != CONTRACT_VERSION:
                raise ContractError("archive contract version mismatch")
            files = manifest["files"]
            if (
                type(manifest["file_count"]) is not int
                or not isinstance(files, list)
                or manifest["file_count"] != len(files)
            ):
                raise ContractError("archive file count mismatch")
            expected_names = {"archive-manifest.json"}
            seen_relative_paths: set[str] = set()
            for record in files:
                _strict_keys(record, {"path", "size", "sha256"}, "archive file")
                relative = record["path"]
                posix_relative = (
                    PurePosixPath(relative) if isinstance(relative, str) else None
                )
                if (
                    not isinstance(relative, str)
                    or not relative
                    or "\\" in relative
                    or posix_relative is None
                    or posix_relative.is_absolute()
                    or ".." in posix_relative.parts
                    or ":" in relative
                ):
                    raise ContractError("archive path is unsafe")
                if relative in seen_relative_paths:
                    raise ContractError("archive manifest repeats a file path")
                seen_relative_paths.add(relative)
                if type(record["size"]) is not int or record["size"] < 0:
                    raise ContractError("archive member size is invalid")
                if not isinstance(record["sha256"], str) or HEX_64_RE.fullmatch(
                    record["sha256"]
                ) is None:
                    raise ContractError("archive member SHA-256 is invalid")
                member_name = f"evidence/{relative}"
                expected_names.add(member_name)
                member = by_name.get(member_name)
                if member is None or not member.isfile():
                    raise ContractError(f"archive member missing: {member_name}")
                stream = archive.extractfile(member)
                if stream is None:
                    raise ContractError(f"cannot read archive member: {member_name}")
                data = stream.read()
                if len(data) != record["size"] or _sha256_bytes(data) != record["sha256"]:
                    raise ContractError(f"archive member identity mismatch: {member_name}")
            if set(by_name) != expected_names:
                raise ContractError("archive member count/name inventory mismatch")
            return manifest
    except (OSError, UnicodeError, json.JSONDecodeError, tarfile.TarError) as exc:
        if isinstance(exc, ContractError):
            raise
        raise ContractError(f"cannot verify archive {path}: {exc}") from exc


def _main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    audit_parser = subparsers.add_parser("audit")
    audit_parser.add_argument("evidence_dir", type=Path)
    archive_parser = subparsers.add_parser("archive")
    archive_parser.add_argument("evidence_dir", type=Path)
    archive_parser.add_argument("archive_path", type=Path)
    verify_parser = subparsers.add_parser("verify-archive")
    verify_parser.add_argument("archive_path", type=Path)
    args = parser.parse_args(argv)
    try:
        if args.command == "audit":
            output = audit_attempt(args.evidence_dir)
        elif args.command == "archive":
            output = create_archive(args.evidence_dir, args.archive_path)
        else:
            output = verify_archive(args.archive_path)
        print(json.dumps(output, ensure_ascii=True, sort_keys=True))
        return 0
    except OneShotError as exc:
        print(f"one-shot gate: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(_main())
