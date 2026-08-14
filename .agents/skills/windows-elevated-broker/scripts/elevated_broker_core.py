"""Pure validation and authentication primitives for the elevated broker."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import math
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence


BOOTSTRAP_SCHEMA = "ring.windows-elevated-broker.bootstrap.v2"
REQUEST_SCHEMA = "ring.windows-elevated-broker.request.v1"
STATE_SCHEMA = "ring.windows-elevated-broker.state.v1"
ACTIVE_SCHEMA = "ring.windows-elevated-broker.active.v1"
START_RECEIPT_SCHEMA = "ring.windows-elevated-broker.start-receipt.v1"
STOP_RECEIPT_SCHEMA = "ring.windows-elevated-broker.stop-receipt.v1"
RUN_RECEIPT_SCHEMA = "ring.windows-elevated-broker.run-receipt.v1"
FAILURE_RECEIPT_SCHEMA = "ring.windows-elevated-broker.failure-receipt.v1"

DEFAULT_TTL_SECONDS = 3_600
MAX_TTL_SECONDS = 21_600
DEFAULT_REQUEST_TIMEOUT_MAX_SECONDS = 1_800
MAX_REQUEST_TIMEOUT_SECONDS = 7_200
DEFAULT_JOB_MEMORY_LIMIT_BYTES = 12 * 1024**3
DEFAULT_ACTIVE_PROCESS_LIMIT = 5
MIN_JOB_MEMORY_LIMIT_BYTES = 64 * 1024**2
JOB_TIMEOUT_GRACE_SECONDS = 6.0
AUTHKEY_BYTES = 32
AUTH_NONCE_BYTES = 32
AUTH_PROOF_BYTES = hashlib.sha256().digest_size
MAX_FRAME_BYTES = 1024 * 1024
MAX_BOOTSTRAP_BYTES = 512 * 1024
MAX_ARG_COUNT = 256
MAX_ARG_CHARS = 131_072
REQUEST_ID_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}\Z")
PYTHON_SUFFIXES = {".py", ".pyw"}
DANGEROUS_GENERIC_NAMES = {
    "bash.exe",
    "cmd.exe",
    "cscript.exe",
    "mshta.exe",
    "powershell.exe",
    "powershell_ise.exe",
    "pwsh.exe",
    "py.exe",
    "regsvr32.exe",
    "rundll32.exe",
    "sh.exe",
    "wsl.exe",
    "wslhost.exe",
    "wscript.exe",
}


class BrokerError(RuntimeError):
    """A broker invariant could not be established."""


class RequestError(BrokerError):
    """An authenticated request violated the fixed broker contract."""


class AuthenticationError(BrokerError):
    """The HMAC challenge-response exchange failed."""


class DuplicateJsonKeyError(ValueError):
    """A JSON object repeated a key."""


def strict_json_loads(data: str | bytes, source: str = "JSON") -> Any:
    """Load JSON while rejecting duplicate object keys."""

    def reject_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise DuplicateJsonKeyError(f"duplicate JSON key {key!r} in {source}")
            result[key] = value
        return result

    def reject_nonstandard_constant(value: str) -> Any:
        raise ValueError(f"non-standard JSON constant {value!r} in {source}")

    try:
        return json.loads(
            data,
            object_pairs_hook=reject_duplicates,
            parse_constant=reject_nonstandard_constant,
        )
    except (ValueError, UnicodeDecodeError) as exc:
        raise BrokerError(f"invalid {source}: {exc}") from exc


def canonical_json_bytes(value: Any) -> bytes:
    return (
        json.dumps(
            value,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
            allow_nan=False,
        )
        + "\n"
    ).encode("utf-8")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: str | os.PathLike[str]) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def path_env_sha256(path_value: str | None = None) -> str:
    value = os.environ.get("PATH", "") if path_value is None else path_value
    return sha256_bytes(value.encode("utf-8", errors="surrogatepass"))


def is_within(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def resolve_repo(path: str | os.PathLike[str]) -> Path:
    repo = Path(path).resolve(strict=True)
    if not repo.is_dir() or not (repo / ".git").exists():
        raise BrokerError(f"repository root is not a Git worktree: {repo}")
    return repo


def resolve_results_root(repo: Path, path: str | os.PathLike[str]) -> Path:
    candidate = Path(path)
    if not candidate.is_absolute():
        candidate = repo / candidate
    resolved = candidate.resolve(strict=False)
    if resolved == repo or not is_within(resolved, repo):
        raise BrokerError("results root must be a strict descendant of the repository")
    if is_within(resolved, (repo / ".git").resolve(strict=False)):
        raise BrokerError("results root must not be inside Git metadata")
    return resolved


def ensure_git_ignored(repo: Path, path: Path) -> None:
    """Prove that Git ignores path before any broker state is written."""

    try:
        relative_probes = [
            probe.relative_to(repo)
            for probe in (
                path / ".windows-elevated-broker-ignore-probe",
                path / "broker-state.json",
                path / "fresh-request" / "stdout.bin",
            )
        ]
    except ValueError as exc:
        raise BrokerError(f"results path is outside repository: {path}") from exc
    for relative in relative_probes:
        completed = subprocess.run(
            ["git", "-C", str(repo), "check-ignore", "-q", "--", str(relative)],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
        if completed.returncode == 1:
            raise BrokerError(f"Git does not ignore broker results root: {path}")
        if completed.returncode != 0:
            detail = completed.stderr.strip() or f"exit {completed.returncode}"
            raise BrokerError(f"cannot prove results root is ignored: {detail}")


def _require_plain_int(value: Any, label: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise BrokerError(f"{label} must be an integer")
    return value


def validate_limits(
    ttl_seconds: Any,
    request_timeout_max_seconds: Any,
    job_memory_limit_bytes: Any,
    active_process_limit: Any,
) -> dict[str, int]:
    ttl = _require_plain_int(ttl_seconds, "TTL")
    request_max = _require_plain_int(
        request_timeout_max_seconds, "request timeout maximum"
    )
    memory = _require_plain_int(job_memory_limit_bytes, "Job memory limit")
    active = _require_plain_int(active_process_limit, "active-process limit")
    if not 60 <= ttl <= MAX_TTL_SECONDS:
        raise BrokerError(f"TTL must be between 60 and {MAX_TTL_SECONDS} seconds")
    if not 1 <= request_max <= MAX_REQUEST_TIMEOUT_SECONDS:
        raise BrokerError(
            "request timeout maximum must be between 1 and "
            f"{MAX_REQUEST_TIMEOUT_SECONDS} seconds"
        )
    if request_max + JOB_TIMEOUT_GRACE_SECONDS >= ttl:
        raise BrokerError("request timeout maximum must leave room for broker expiry")
    if not MIN_JOB_MEMORY_LIMIT_BYTES <= memory <= DEFAULT_JOB_MEMORY_LIMIT_BYTES:
        raise BrokerError(
            "Job memory limit must be between 64 MiB and the 12 GiB hard ceiling"
        )
    if not 1 <= active <= DEFAULT_ACTIVE_PROCESS_LIMIT:
        raise BrokerError("active-process limit must be between 1 and 5")
    return {
        "ttl_seconds": ttl,
        "request_timeout_max_seconds": request_max,
        "job_memory_limit_bytes": memory,
        "active_process_limit": active,
    }


def _resolve_absolute_file(raw: str | os.PathLike[str], label: str) -> Path:
    path = Path(raw)
    if not path.is_absolute():
        raise BrokerError(f"{label} must be an absolute path: {raw}")
    try:
        resolved = path.resolve(strict=True)
    except OSError as exc:
        raise BrokerError(f"cannot resolve {label} {path}: {exc}") from exc
    if not resolved.is_file():
        raise BrokerError(f"{label} is not a regular file: {resolved}")
    return resolved


def _normalized_path(path: str | os.PathLike[str]) -> str:
    return os.path.normcase(os.fspath(Path(path).resolve(strict=False)))


def _deny_generic_executable(path: Path, python_executable: Path) -> None:
    name = path.name.casefold()
    if _normalized_path(path) == _normalized_path(python_executable):
        raise BrokerError(
            "the broker Python interpreter is allowed only through explicit Python roots"
        )
    if name in DANGEROUS_GENERIC_NAMES or re.fullmatch(r"python(?:w|\d+(?:\.\d+)*)?\.exe", name):
        raise BrokerError(f"generic shell or interpreter is not allowlisted: {path.name}")


def _snapshot_python_root(repo: Path, raw_root: str | os.PathLike[str]) -> dict[str, Any]:
    repo = repo.resolve(strict=True)
    root_path = Path(raw_root)
    if not root_path.is_absolute():
        root_path = repo / root_path
    root = root_path.resolve(strict=True)
    if not root.is_dir() or not is_within(root, repo):
        raise BrokerError(f"Python script root must be inside the repository: {root}")
    scripts: list[dict[str, str]] = []
    for directory, directory_names, file_names in os.walk(root, followlinks=False):
        directory_path = Path(directory)
        for name in list(directory_names):
            child = directory_path / name
            if child.is_symlink():
                raise BrokerError(f"symlinked Python directory is not allowed: {child}")
        for name in file_names:
            child = directory_path / name
            if child.suffix.casefold() not in PYTHON_SUFFIXES:
                continue
            if child.is_symlink():
                raise BrokerError(f"symlinked Python script is not allowed: {child}")
            resolved = child.resolve(strict=True)
            if not is_within(resolved, root):
                raise BrokerError(f"Python script escapes its declared root: {child}")
            scripts.append({"path": str(resolved), "sha256": sha256_file(resolved)})
    scripts.sort(key=lambda item: os.path.normcase(item["path"]))
    if not scripts:
        raise BrokerError(f"Python script root contains no .py/.pyw files: {root}")
    return {"root": str(root), "scripts": scripts}


def build_allowlist(
    repo: Path,
    executable_paths: Iterable[str],
    python_roots: Iterable[str],
    python_executable: str | os.PathLike[str] = sys.executable,
) -> tuple[list[dict[str, str]], list[dict[str, Any]]]:
    repo = repo.resolve(strict=True)
    python_path = _resolve_absolute_file(python_executable, "Python interpreter")
    entries: list[dict[str, str]] = []
    seen: set[str] = set()
    for raw in executable_paths:
        executable = _resolve_absolute_file(raw, "allowlisted executable")
        _deny_generic_executable(executable, python_path)
        normalized = _normalized_path(executable)
        if normalized in seen:
            raise BrokerError(f"duplicate executable allowlist entry: {executable}")
        seen.add(normalized)
        entries.append(
            {"path": str(executable), "sha256": sha256_file(executable), "kind": "executable"}
        )

    roots: list[dict[str, Any]] = []
    root_names: set[str] = set()
    for raw in python_roots:
        snapshot = _snapshot_python_root(repo, raw)
        normalized = _normalized_path(snapshot["root"])
        if normalized in root_names:
            raise BrokerError(f"duplicate Python script root: {snapshot['root']}")
        snapshot_path = Path(snapshot["root"])
        for existing in roots:
            existing_path = Path(existing["root"])
            if is_within(snapshot_path, existing_path) or is_within(
                existing_path, snapshot_path
            ):
                raise BrokerError(
                    "Python script roots must not overlap: "
                    f"{snapshot_path} and {existing_path}"
                )
        root_names.add(normalized)
        roots.append(snapshot)
    roots.sort(key=lambda item: os.path.normcase(item["root"]))
    if roots:
        normalized = _normalized_path(python_path)
        if normalized in seen:
            raise BrokerError("Python interpreter appears twice in the allowlist")
        entries.append(
            {"path": str(python_path), "sha256": sha256_file(python_path), "kind": "python"}
        )
    entries.sort(key=lambda item: os.path.normcase(item["path"]))
    if not entries:
        raise BrokerError("at least one executable or Python script root is required")
    return entries, roots


def verify_file_records(records: Sequence[Mapping[str, Any]], label: str) -> None:
    for record in records:
        if not {"path", "sha256"}.issubset(record):
            raise BrokerError(f"malformed {label} record")
        path = _resolve_absolute_file(record["path"], label)
        actual = sha256_file(path)
        if actual != record["sha256"]:
            raise BrokerError(
                f"{label} content hash drifted: {path}; expected {record['sha256']}, got {actual}"
            )


def verify_allowlist_snapshot(
    executable_allowlist: Sequence[Mapping[str, Any]],
    python_script_roots: Sequence[Mapping[str, Any]],
) -> None:
    verify_file_records(executable_allowlist, "allowlisted executable")
    for root_record in python_script_roots:
        if set(root_record) != {"root", "scripts"} or not isinstance(
            root_record["scripts"], list
        ):
            raise BrokerError("malformed Python script-root snapshot")
        root = Path(root_record["root"]).resolve(strict=True)
        if not root.is_dir():
            raise BrokerError(f"Python script root disappeared: {root}")
        verify_file_records(root_record["scripts"], "allowlisted Python script")
        pinned = {
            _normalized_path(record["path"]) for record in root_record["scripts"]
        }
        current: set[str] = set()
        for directory, directory_names, file_names in os.walk(root, followlinks=False):
            directory_path = Path(directory)
            for name in directory_names:
                if (directory_path / name).is_symlink():
                    raise BrokerError(
                        f"Python script root gained a symlinked directory: {directory_path / name}"
                    )
            for name in file_names:
                path = directory_path / name
                if path.suffix.casefold() not in PYTHON_SUFFIXES:
                    continue
                if path.is_symlink():
                    raise BrokerError(f"Python script root gained a symlink: {path}")
                current.add(_normalized_path(path.resolve(strict=True)))
        if current != pinned:
            added = sorted(current - pinned)
            removed = sorted(pinned - current)
            raise BrokerError(
                "Python script-root inventory drifted after startup: "
                f"added={added}, removed={removed}"
            )


def _validate_argv(value: Any) -> list[str]:
    if not isinstance(value, list) or not value or len(value) > MAX_ARG_COUNT:
        raise RequestError(f"argv must contain 1..{MAX_ARG_COUNT} string elements")
    if not all(isinstance(part, str) and part and "\x00" not in part for part in value):
        raise RequestError("argv elements must be non-empty NUL-free strings")
    if sum(len(part) for part in value) > MAX_ARG_CHARS:
        raise RequestError("argv exceeds the fixed character budget")
    if not Path(value[0]).is_absolute():
        raise RequestError("argv[0] must be an absolute executable path; PATH lookup is forbidden")
    return list(value)


def validate_request_schema(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise RequestError("request must be a JSON object, not a shell command string")
    operation = value.get("operation")
    if operation in {"status", "stop"}:
        expected = {"schema", "operation"}
        if set(value) != expected or value.get("schema") != REQUEST_SCHEMA:
            raise RequestError(f"{operation} request schema is not exact")
        return dict(value)
    if operation != "run":
        raise RequestError("operation must be exactly status, stop, or run")
    expected = {
        "schema",
        "operation",
        "request_id",
        "argv",
        "cwd",
        "output_dir",
        "timeout_seconds",
    }
    if set(value) != expected or value.get("schema") != REQUEST_SCHEMA:
        raise RequestError("run request fields do not exactly match the v1 schema")
    request_id = value["request_id"]
    if not isinstance(request_id, str) or REQUEST_ID_RE.fullmatch(request_id) is None:
        raise RequestError("request_id must use 1..64 safe identifier characters")
    argv = _validate_argv(value["argv"])
    if not isinstance(value["cwd"], str) or not value["cwd"]:
        raise RequestError("cwd must be a non-empty string")
    if not isinstance(value["output_dir"], str) or not value["output_dir"]:
        raise RequestError("output_dir must be a non-empty string")
    timeout = value["timeout_seconds"]
    if (
        isinstance(timeout, bool)
        or not isinstance(timeout, (int, float))
        or not math.isfinite(float(timeout))
        or timeout <= 0
    ):
        raise RequestError("timeout_seconds must be a positive number")
    return {**value, "argv": argv, "timeout_seconds": float(timeout)}


def validate_request_timing(
    request: Mapping[str, Any],
    *,
    remaining_ttl_seconds: float,
    request_timeout_max_seconds: int,
) -> None:
    timeout = float(request["timeout_seconds"])
    if timeout > request_timeout_max_seconds:
        raise RequestError(
            f"request timeout {timeout:g}s exceeds fixed maximum "
            f"{request_timeout_max_seconds}s"
        )
    if remaining_ttl_seconds <= JOB_TIMEOUT_GRACE_SECONDS:
        raise RequestError("broker TTL has expired")
    if timeout + JOB_TIMEOUT_GRACE_SECONDS >= remaining_ttl_seconds:
        raise RequestError("request timeout would outlive the broker's fixed TTL")


def validate_request_paths(
    request: Mapping[str, Any], repo_root: Path, results_root: Path
) -> tuple[Path, Path]:
    repo_root = repo_root.resolve(strict=True)
    results_root = results_root.resolve(strict=True)
    cwd_raw = Path(request["cwd"])
    if not cwd_raw.is_absolute():
        raise RequestError("cwd must be absolute")
    try:
        cwd = cwd_raw.resolve(strict=True)
    except OSError as exc:
        raise RequestError(f"cwd cannot be resolved: {exc}") from exc
    if not cwd.is_dir() or not is_within(cwd, repo_root):
        raise RequestError("cwd must be an existing directory inside the repository")

    output_raw = Path(request["output_dir"])
    if not output_raw.is_absolute():
        raise RequestError("output_dir must be absolute")
    if output_raw.exists():
        raise RequestError("output_dir already exists; sidecar overwrite is forbidden")
    try:
        parent = output_raw.parent.resolve(strict=True)
    except OSError as exc:
        raise RequestError(f"output_dir parent cannot be resolved: {exc}") from exc
    output = parent / output_raw.name
    if output == results_root or not is_within(output, results_root):
        raise RequestError("output_dir must be a fresh child of the fixed results root")
    return cwd, output


def validate_executable_request(
    argv: Sequence[str],
    executable_allowlist: Sequence[Mapping[str, Any]],
    python_script_roots: Sequence[Mapping[str, Any]],
) -> dict[str, Any]:
    executable = _resolve_absolute_file(argv[0], "requested executable")
    normalized = _normalized_path(executable)
    entries = {
        _normalized_path(entry["path"]): entry for entry in executable_allowlist
    }
    entry = entries.get(normalized)
    if entry is None:
        raise RequestError(f"executable was not fixed at broker startup: {executable}")
    actual_hash = sha256_file(executable)
    if actual_hash != entry["sha256"]:
        raise RequestError(f"executable content hash drifted after broker startup: {executable}")
    identity: dict[str, Any] = dict(entry)
    if entry["kind"] == "python":
        if len(argv) < 2 or not Path(argv[1]).is_absolute():
            raise RequestError(
                "Python requests must put an absolute pinned .py/.pyw script at argv[1]"
            )
        script = _resolve_absolute_file(argv[1], "requested Python script")
        pinned: dict[str, Mapping[str, Any]] = {}
        for root in python_script_roots:
            for record in root["scripts"]:
                pinned[_normalized_path(record["path"])] = record
        record = pinned.get(_normalized_path(script))
        if record is None:
            raise RequestError(f"Python script was not pinned under an explicit root: {script}")
        script_hash = sha256_file(script)
        if script_hash != record["sha256"]:
            raise RequestError(f"Python script content hash drifted after startup: {script}")
        identity["script"] = dict(record)
        referenced_executables: list[dict[str, Any]] = []
        for argument in argv[2:]:
            candidate_text = argument.split("=", 1)[1] if "=" in argument else argument
            candidate = Path(candidate_text)
            if not candidate.is_absolute() or candidate.suffix.casefold() not in {
                ".com",
                ".exe",
            }:
                continue
            referenced = _resolve_absolute_file(
                candidate, "Python request referenced executable"
            )
            referenced_entry = entries.get(_normalized_path(referenced))
            if referenced_entry is None or referenced_entry["kind"] != "executable":
                raise RequestError(
                    "Python request referenced an executable that was not explicitly "
                    f"pinned at broker startup: {referenced}"
                )
            referenced_hash = sha256_file(referenced)
            if referenced_hash != referenced_entry["sha256"]:
                raise RequestError(
                    f"Python request referenced executable hash drifted: {referenced}"
                )
            referenced_executables.append(dict(referenced_entry))
        identity["referenced_executables"] = referenced_executables
    return identity


def encode_authkey(authkey: bytes) -> str:
    if not isinstance(authkey, bytes) or len(authkey) != AUTHKEY_BYTES:
        raise AuthenticationError(f"authkey must contain exactly {AUTHKEY_BYTES} random bytes")
    return base64.urlsafe_b64encode(authkey).decode("ascii")


def decode_authkey(text: str) -> bytes:
    if not isinstance(text, str):
        raise AuthenticationError("authkey file must contain text")
    try:
        key = base64.b64decode(text.strip(), altchars=b"-_", validate=True)
    except (ValueError, UnicodeEncodeError) as exc:
        raise AuthenticationError("authkey file is not strict base64") from exc
    if len(key) != AUTHKEY_BYTES:
        raise AuthenticationError(f"authkey must decode to exactly {AUTHKEY_BYTES} bytes")
    return key


def client_proof(authkey: bytes, nonce: bytes) -> bytes:
    if len(nonce) != AUTH_NONCE_BYTES:
        raise AuthenticationError("authentication nonce has the wrong size")
    return hmac.new(authkey, b"client\x00" + nonce, hashlib.sha256).digest()


def server_proof(authkey: bytes, nonce: bytes) -> bytes:
    if len(nonce) != AUTH_NONCE_BYTES:
        raise AuthenticationError("authentication nonce has the wrong size")
    return hmac.new(authkey, b"server\x00" + nonce, hashlib.sha256).digest()


def verify_proof(actual: bytes, expected: bytes) -> None:
    if not hmac.compare_digest(actual, expected):
        raise AuthenticationError("HMAC challenge-response proof did not match")
