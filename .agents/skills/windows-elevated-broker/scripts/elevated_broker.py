"""Start and use a bounded Windows elevated-command broker."""

from __future__ import annotations

import argparse
import ctypes
import datetime as dt
import importlib.util
import json
import math
import os
import secrets
import socket
import struct
import subprocess
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Mapping, Sequence

import elevated_broker_core as core


SCRIPT_PATH = Path(__file__).resolve()
SKILL_DIR = SCRIPT_PATH.parents[1]
DEFAULT_REPO_ROOT = SCRIPT_PATH.parents[4]
AUTH_MAGIC = b"REB1"
AUTH_OK = b"\x01"
AUTH_DENIED = b"\x00"
SOCKET_TIMEOUT_SECONDS = 5.0
ACCEPT_POLL_SECONDS = 0.5


def _utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def _utc_from_epoch(epoch: float) -> str:
    return (
        dt.datetime.fromtimestamp(epoch, dt.timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


def _write_exclusive(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    descriptor = os.open(path, flags, 0o600)
    try:
        with os.fdopen(descriptor, "wb", closefd=False) as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
    finally:
        os.close(descriptor)


def _write_json_exclusive(path: Path, value: Any) -> None:
    _write_exclusive(path, core.canonical_json_bytes(value))


def _write_json_atomic(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    _write_exclusive(temporary, core.canonical_json_bytes(value))
    os.replace(temporary, path)


def _read_json(path: Path, label: str) -> Any:
    try:
        return core.strict_json_loads(path.read_bytes(), label)
    except OSError as exc:
        raise core.BrokerError(f"cannot read {label} at {path}: {exc}") from exc


def _ensure_empty_sidecar(path: Path) -> None:
    if not path.exists():
        _write_exclusive(path, b"")


def _resolve_control_root(
    repo: Path, results_root: Path, raw: str | os.PathLike[str] | None
) -> Path:
    candidate = results_root / "elevated-broker" if raw is None else Path(raw)
    if not candidate.is_absolute():
        candidate = repo / candidate
    control = candidate.resolve(strict=False)
    if control == results_root or not core.is_within(control, results_root):
        raise core.BrokerError("control root must be a strict child of results root")
    return control


def _file_record(path: Path) -> dict[str, str]:
    resolved = path.resolve(strict=True)
    return {"path": str(resolved), "sha256": core.sha256_file(resolved)}


def _authority_file_records(repo: Path) -> list[dict[str, str]]:
    return [
        _file_record(repo / "bench" / "check" / "run.py"),
        _file_record(repo / "bench" / "check" / "windows_job.py"),
    ]


def _broker_file_records() -> list[dict[str, str]]:
    return [_file_record(SCRIPT_PATH), _file_record(SCRIPT_PATH.with_name("elevated_broker_core.py"))]


def _validate_prior_active(control_root: Path) -> None:
    active_path = control_root / "active.json"
    if not active_path.exists():
        return
    active = _read_json(active_path, "active broker pointer")
    if not isinstance(active, dict) or set(active) != {
        "schema",
        "broker_id",
        "state_path",
    }:
        raise core.BrokerError(f"active broker pointer is malformed: {active_path}")
    if active.get("schema") != core.ACTIVE_SCHEMA:
        raise core.BrokerError(f"active broker pointer schema is unknown: {active_path}")
    state_path = Path(active["state_path"])
    state = _read_json(state_path, "broker state")
    if not isinstance(state, dict) or state.get("broker_id") != active["broker_id"]:
        raise core.BrokerError("active pointer and broker state disagree")
    if state.get("status") == "running":
        raise core.BrokerError(
            "an active broker is already recorded; use status/stop or a different control root"
        )
    if state.get("status") != "stopped":
        raise core.BrokerError("prior broker state is neither running nor stopped")


def _build_bootstrap(args: argparse.Namespace) -> dict[str, Any]:
    repo = core.resolve_repo(args.repo)
    results_root = core.resolve_results_root(repo, args.results_root)
    control_root = _resolve_control_root(repo, results_root, args.control_root)
    core.ensure_git_ignored(repo, results_root)
    core.ensure_git_ignored(repo, control_root)
    limits = core.validate_limits(
        args.ttl_seconds,
        args.request_timeout_max_seconds,
        args.job_memory_limit_bytes,
        args.active_process_limit,
    )
    executable_allowlist, python_script_roots = core.build_allowlist(
        repo,
        args.allow_executable,
        args.python_root,
        sys.executable,
    )
    broker_id = uuid.uuid4().hex
    prefix = f"broker-{broker_id}"
    config = {
        "schema": core.BOOTSTRAP_SCHEMA,
        "broker_id": broker_id,
        "repo_root": str(repo),
        "results_root": str(results_root),
        "control_root": str(control_root),
        "authkey_path": str(control_root / f"{prefix}.authkey"),
        "bootstrap_path": str(control_root / f"{prefix}.bootstrap.json"),
        "state_path": str(control_root / f"{prefix}.state.json"),
        "active_path": str(control_root / "active.json"),
        "start_receipt_path": str(control_root / f"{prefix}.start-receipt.json"),
        "stop_receipt_path": str(control_root / f"{prefix}.stop-receipt.json"),
        "startup_failure_receipt_path": str(
            control_root / f"{prefix}.startup-failure.json"
        ),
        "broker_python": _file_record(Path(sys.executable)),
        "broker_files": _broker_file_records(),
        "authority_files": _authority_file_records(repo),
        "executable_allowlist": executable_allowlist,
        "python_script_roots": python_script_roots,
        "path_sha256": core.path_env_sha256(),
        "limits": limits,
    }
    if len(core.canonical_json_bytes(config)) > core.MAX_BOOTSTRAP_BYTES:
        raise core.BrokerError("allowlist snapshot exceeds the fixed bootstrap size limit")
    return config


def _launch_elevated(config: Mapping[str, Any], bootstrap_hash: str) -> None:
    if os.name != "nt":
        raise core.BrokerError("live broker start requires Windows")
    shell32 = ctypes.WinDLL("shell32", use_last_error=True)
    shell32.ShellExecuteW.argtypes = [
        ctypes.c_void_p,
        ctypes.c_wchar_p,
        ctypes.c_wchar_p,
        ctypes.c_wchar_p,
        ctypes.c_wchar_p,
        ctypes.c_int,
    ]
    shell32.ShellExecuteW.restype = ctypes.c_void_p
    parameters = subprocess.list2cmdline(
        [
            str(SCRIPT_PATH),
            "_serve",
            "--bootstrap",
            config["bootstrap_path"],
            "--bootstrap-sha256",
            bootstrap_hash,
        ]
    )
    result = shell32.ShellExecuteW(
        None,
        "runas",
        config["broker_python"]["path"],
        parameters,
        config["repo_root"],
        0,
    )
    code = int(result or 0)
    if code <= 32:
        error = ctypes.get_last_error()
        detail = f" Win32 error {error}: {ctypes.WinError(error)}" if error else ""
        raise core.BrokerError(f"UAC broker launch was denied or failed ({code}).{detail}")


def _load_authkey(path: Path, expected_hash: str | None = None) -> bytes:
    try:
        text = path.read_text(encoding="ascii")
    except (OSError, UnicodeError) as exc:
        raise core.AuthenticationError(f"cannot read authkey file {path}: {exc}") from exc
    key = core.decode_authkey(text)
    if expected_hash is not None and core.sha256_bytes(key) != expected_hash:
        raise core.AuthenticationError("authkey content hash drifted after broker start")
    return key


def _recv_exact(connection: socket.socket, size: int) -> bytes:
    chunks: list[bytes] = []
    remaining = size
    while remaining:
        chunk = connection.recv(remaining)
        if not chunk:
            raise core.AuthenticationError("authenticated connection closed unexpectedly")
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)


def _send_frame(connection: socket.socket, payload: bytes) -> None:
    if len(payload) > core.MAX_FRAME_BYTES:
        raise core.BrokerError("response exceeds fixed frame limit")
    connection.sendall(struct.pack("!I", len(payload)) + payload)


def _recv_frame(connection: socket.socket) -> bytes:
    length = struct.unpack("!I", _recv_exact(connection, 4))[0]
    if length > core.MAX_FRAME_BYTES:
        raise core.BrokerError("request exceeds fixed frame limit")
    return _recv_exact(connection, length)


def _server_authenticate(connection: socket.socket, authkey: bytes) -> None:
    nonce = secrets.token_bytes(core.AUTH_NONCE_BYTES)
    connection.sendall(AUTH_MAGIC + nonce)
    actual = _recv_exact(connection, core.AUTH_PROOF_BYTES)
    try:
        core.verify_proof(actual, core.client_proof(authkey, nonce))
    except core.AuthenticationError:
        connection.sendall(AUTH_DENIED)
        raise
    connection.sendall(AUTH_OK + core.server_proof(authkey, nonce))


def _client_authenticate(connection: socket.socket, authkey: bytes) -> None:
    challenge = _recv_exact(connection, len(AUTH_MAGIC) + core.AUTH_NONCE_BYTES)
    if challenge[: len(AUTH_MAGIC)] != AUTH_MAGIC:
        raise core.AuthenticationError("broker authentication magic did not match")
    nonce = challenge[len(AUTH_MAGIC) :]
    connection.sendall(core.client_proof(authkey, nonce))
    result = _recv_exact(connection, 1)
    if result != AUTH_OK:
        raise core.AuthenticationError("broker rejected HMAC challenge-response proof")
    actual = _recv_exact(connection, core.AUTH_PROOF_BYTES)
    core.verify_proof(actual, core.server_proof(authkey, nonce))


def _rpc_to_state(state: Mapping[str, Any], request: Mapping[str, Any]) -> dict[str, Any]:
    authkey = _load_authkey(
        Path(state["authkey_path"]), state.get("authkey_sha256")
    )
    address = state["address"]
    if not isinstance(address, dict) or set(address) != {"host", "port"}:
        raise core.BrokerError("broker state has a malformed loopback address")
    if address["host"] != "127.0.0.1":
        raise core.BrokerError("broker state is not bound to IPv4 loopback")
    try:
        with socket.create_connection(
            (address["host"], address["port"]), timeout=SOCKET_TIMEOUT_SECONDS
        ) as connection:
            connection.settimeout(SOCKET_TIMEOUT_SECONDS)
            _client_authenticate(connection, authkey)
            _send_frame(connection, core.canonical_json_bytes(request))
            response = core.strict_json_loads(_recv_frame(connection), "broker response")
    except (OSError, TimeoutError) as exc:
        raise core.BrokerError(f"cannot reach elevated broker: {exc}") from exc
    if not isinstance(response, dict) or not isinstance(response.get("ok"), bool):
        raise core.BrokerError("broker response is malformed")
    return response


def _active_state(control_root: Path) -> dict[str, Any]:
    active = _read_json(control_root / "active.json", "active broker pointer")
    if not isinstance(active, dict) or set(active) != {
        "schema",
        "broker_id",
        "state_path",
    }:
        raise core.BrokerError("active broker pointer is malformed")
    if active["schema"] != core.ACTIVE_SCHEMA:
        raise core.BrokerError("active broker pointer schema is unsupported")
    state = _read_json(Path(active["state_path"]), "broker state")
    if not isinstance(state, dict) or state.get("schema") != core.STATE_SCHEMA:
        raise core.BrokerError("broker state schema is unsupported")
    if state.get("broker_id") != active["broker_id"]:
        raise core.BrokerError("active pointer and broker state identity disagree")
    return state


def _client_roots(args: argparse.Namespace) -> tuple[Path, Path, Path]:
    repo = core.resolve_repo(args.repo)
    results = core.resolve_results_root(repo, args.results_root)
    control = _resolve_control_root(repo, results, args.control_root)
    return repo, results, control


def command_start(args: argparse.Namespace) -> int:
    config = _build_bootstrap(args)
    sanitized = {**config, "authkey_path": config["authkey_path"]}
    if args.dry_run:
        print(json.dumps({"dry_run": True, "bootstrap": sanitized}, indent=2))
        return 0

    control_root = Path(config["control_root"])
    control_root.mkdir(parents=True, exist_ok=True)
    if control_root.resolve(strict=True) != control_root:
        raise core.BrokerError("control root changed identity while it was created")
    _validate_prior_active(control_root)
    authkey_path = Path(config["authkey_path"])
    bootstrap_path = Path(config["bootstrap_path"])
    authkey = secrets.token_bytes(core.AUTHKEY_BYTES)
    config["authkey_sha256"] = core.sha256_bytes(authkey)
    _write_exclusive(authkey_path, (core.encode_authkey(authkey) + "\n").encode("ascii"))
    bootstrap_bytes = core.canonical_json_bytes(config)
    try:
        _write_exclusive(bootstrap_path, bootstrap_bytes)
        _launch_elevated(config, core.sha256_bytes(bootstrap_bytes))
    except BaseException:
        for created in (bootstrap_path, authkey_path):
            try:
                created.unlink(missing_ok=True)
            except OSError:
                pass
        raise

    deadline = time.monotonic() + args.startup_timeout_seconds
    state_path = Path(config["state_path"])
    failure_path = Path(config["startup_failure_receipt_path"])
    while time.monotonic() < deadline:
        if failure_path.exists():
            failure = _read_json(failure_path, "startup failure receipt")
            raise core.BrokerError(f"elevated broker failed during startup: {failure}")
        if state_path.exists():
            state = _read_json(state_path, "broker state")
            response = _rpc_to_state(
                state, {"schema": core.REQUEST_SCHEMA, "operation": "status"}
            )
            if response.get("ok") is True:
                print(json.dumps(response, indent=2))
                return 0
        time.sleep(0.1)
    raise core.BrokerError(
        "elevated broker did not become ready before startup timeout; retained "
        f"control artifacts at {control_root} for diagnosis"
    )


def command_status(args: argparse.Namespace) -> int:
    _repo, _results, control = _client_roots(args)
    state = _active_state(control)
    if state.get("status") == "stopped":
        print(json.dumps({"ok": True, "state": state}, indent=2))
        return 0
    response = _rpc_to_state(
        state, {"schema": core.REQUEST_SCHEMA, "operation": "status"}
    )
    print(json.dumps(response, indent=2))
    return 0 if response["ok"] else 2


def command_stop(args: argparse.Namespace) -> int:
    _repo, _results, control = _client_roots(args)
    state = _active_state(control)
    if state.get("status") == "stopped":
        print(json.dumps({"ok": True, "state": state}, indent=2))
        return 0
    response = _rpc_to_state(
        state, {"schema": core.REQUEST_SCHEMA, "operation": "stop"}
    )
    print(json.dumps(response, indent=2))
    return 0 if response["ok"] else 2


def command_run(args: argparse.Namespace) -> int:
    repo, _results, control = _client_roots(args)
    state = _active_state(control)
    if state.get("status") != "running":
        raise core.BrokerError("broker is not running")
    argv = list(args.command)
    if argv and argv[0] == "--":
        argv.pop(0)
    request = {
        "schema": core.REQUEST_SCHEMA,
        "operation": "run",
        "request_id": args.request_id or uuid.uuid4().hex,
        "argv": argv,
        "cwd": str(Path(args.cwd or repo).resolve(strict=True)),
        "output_dir": str(Path(args.output_dir).resolve(strict=False)),
        "timeout_seconds": args.timeout_seconds,
    }
    core.validate_request_schema(request)
    response = _rpc_to_state(state, request)
    print(json.dumps(response, indent=2))
    if not response["ok"]:
        return 2
    return 0 if response.get("command_success") is True else 1


def _validate_bootstrap(config: Any, bootstrap_path: Path) -> dict[str, Any]:
    expected = {
        "schema",
        "broker_id",
        "repo_root",
        "results_root",
        "control_root",
        "authkey_path",
        "authkey_sha256",
        "bootstrap_path",
        "state_path",
        "active_path",
        "start_receipt_path",
        "stop_receipt_path",
        "startup_failure_receipt_path",
        "broker_python",
        "broker_files",
        "authority_files",
        "executable_allowlist",
        "python_script_roots",
        "path_sha256",
        "limits",
    }
    if not isinstance(config, dict) or set(config) != expected:
        raise core.BrokerError("bootstrap fields do not exactly match the v1 schema")
    if config.get("schema") != core.BOOTSTRAP_SCHEMA:
        raise core.BrokerError("bootstrap schema is unsupported")
    broker_id = config.get("broker_id")
    try:
        parsed_id = uuid.UUID(hex=broker_id)
    except (AttributeError, TypeError, ValueError) as exc:
        raise core.BrokerError("bootstrap broker_id is not a canonical UUID hex value") from exc
    if parsed_id.hex != broker_id:
        raise core.BrokerError("bootstrap broker_id is not canonical lowercase UUID hex")
    if Path(config["bootstrap_path"]).resolve(strict=True) != bootstrap_path:
        raise core.BrokerError("bootstrap path does not match its pinned configuration")
    repo = core.resolve_repo(config["repo_root"])
    results = core.resolve_results_root(repo, config["results_root"])
    control = _resolve_control_root(repo, results, config["control_root"])
    prefix = f"broker-{broker_id}"
    expected_control_paths = {
        "authkey_path": control / f"{prefix}.authkey",
        "bootstrap_path": control / f"{prefix}.bootstrap.json",
        "state_path": control / f"{prefix}.state.json",
        "active_path": control / "active.json",
        "start_receipt_path": control / f"{prefix}.start-receipt.json",
        "stop_receipt_path": control / f"{prefix}.stop-receipt.json",
        "startup_failure_receipt_path": control / f"{prefix}.startup-failure.json",
    }
    for field, expected_path in expected_control_paths.items():
        if Path(config[field]).resolve(strict=False) != expected_path.resolve(strict=False):
            raise core.BrokerError(f"bootstrap {field} escapes its fixed control path")
    core.ensure_git_ignored(repo, results)
    core.ensure_git_ignored(repo, control)
    core.validate_limits(**config["limits"])
    if core.path_env_sha256() != config["path_sha256"]:
        raise core.BrokerError("PATH changed across the UAC boundary")
    for field in ("authkey_sha256", "path_sha256"):
        value = config[field]
        if (
            not isinstance(value, str)
            or len(value) != 64
            or any(character not in "0123456789abcdef" for character in value)
        ):
            raise core.BrokerError(f"bootstrap {field} is not a SHA-256 hex digest")
    python_record = config["broker_python"]
    core.verify_file_records([python_record], "broker Python interpreter")
    if Path(sys.executable).resolve(strict=True) != Path(python_record["path"]).resolve(
        strict=True
    ):
        raise core.BrokerError("elevated broker started with an unexpected Python interpreter")
    core.verify_file_records(config["broker_files"], "broker implementation")
    core.verify_file_records(config["authority_files"], "measurement authority")
    expected_broker_files = {
        SCRIPT_PATH,
        SCRIPT_PATH.with_name("elevated_broker_core.py").resolve(strict=True),
    }
    actual_broker_files = {
        Path(record["path"]).resolve(strict=True) for record in config["broker_files"]
    }
    if actual_broker_files != expected_broker_files:
        raise core.BrokerError("broker implementation paths are not the launched skill files")
    expected_authorities = {
        (repo / "bench" / "check" / "run.py").resolve(strict=True),
        (repo / "bench" / "check" / "windows_job.py").resolve(strict=True),
    }
    actual_authorities = {
        Path(record["path"]).resolve(strict=True)
        for record in config["authority_files"]
    }
    if actual_authorities != expected_authorities:
        raise core.BrokerError("measurement authority paths are not the repository originals")
    for root_record in config["python_script_roots"]:
        root = Path(root_record["root"]).resolve(strict=True)
        if not core.is_within(root, repo):
            raise core.BrokerError("Python script root escaped the repository")
    core.verify_allowlist_snapshot(
        config["executable_allowlist"], config["python_script_roots"]
    )
    return config


def _load_bootstrap(path: Path, expected_hash: str) -> dict[str, Any]:
    resolved = path.resolve(strict=True)
    data = resolved.read_bytes()
    actual = core.sha256_bytes(data)
    if actual != expected_hash:
        raise core.BrokerError(
            f"bootstrap content hash mismatch: expected {expected_hash}, got {actual}"
        )
    return _validate_bootstrap(
        core.strict_json_loads(data, "broker bootstrap"), resolved
    )


def _load_authority(config: Mapping[str, Any]) -> tuple[Any, Any]:
    core.verify_file_records(config["authority_files"], "measurement authority")
    records = {Path(record["path"]).name: Path(record["path"]) for record in config["authority_files"]}
    job_path = records.get("windows_job.py")
    run_path = records.get("run.py")
    if job_path is None or run_path is None:
        raise core.BrokerError("measurement authority file set is incomplete")

    job_spec = importlib.util.spec_from_file_location("windows_job", job_path)
    if job_spec is None or job_spec.loader is None:
        raise core.BrokerError("cannot load windows_job.py authority")
    job_module = importlib.util.module_from_spec(job_spec)
    sys.modules["windows_job"] = job_module
    job_spec.loader.exec_module(job_module)

    run_spec = importlib.util.spec_from_file_location(
        "_ring_elevated_measurement_harness", run_path
    )
    if run_spec is None or run_spec.loader is None:
        raise core.BrokerError("cannot load run.py measurement lock authority")
    run_module = importlib.util.module_from_spec(run_spec)
    sys.modules[run_spec.name] = run_module
    run_spec.loader.exec_module(run_module)
    return run_module, job_module


def _administrator_identity() -> dict[str, Any]:
    if os.name != "nt":
        raise core.BrokerError("elevated broker requires Windows")
    shell32 = ctypes.WinDLL("shell32", use_last_error=True)
    shell32.IsUserAnAdmin.argtypes = []
    shell32.IsUserAnAdmin.restype = ctypes.c_bool
    is_admin = bool(shell32.IsUserAnAdmin())
    if not is_admin:
        raise core.BrokerError("broker process does not hold an administrator token")
    from ctypes import wintypes

    advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
    advapi32.GetUserNameW.argtypes = [ctypes.c_wchar_p, ctypes.POINTER(wintypes.DWORD)]
    advapi32.GetUserNameW.restype = wintypes.BOOL
    size = wintypes.DWORD(257)
    buffer = ctypes.create_unicode_buffer(size.value)
    if not advapi32.GetUserNameW(buffer, ctypes.byref(size)):
        error = ctypes.get_last_error()
        raise core.BrokerError(
            f"cannot query administrator username: {ctypes.WinError(error)}"
        )
    return {"username": buffer.value, "is_admin": True}


def _state_from_config(
    config: Mapping[str, Any],
    *,
    address: tuple[str, int],
    administrator: Mapping[str, Any],
    job_preflight: Mapping[str, Any],
    created_at_epoch: float,
) -> dict[str, Any]:
    limits = config["limits"]
    expires_at_epoch = created_at_epoch + limits["ttl_seconds"]
    return {
        "schema": core.STATE_SCHEMA,
        "broker_id": config["broker_id"],
        "status": "running",
        "pid": os.getpid(),
        "administrator": dict(administrator),
        "address": {"host": address[0], "port": address[1]},
        "created_at_utc": _utc_from_epoch(created_at_epoch),
        "expires_at_utc": _utc_from_epoch(expires_at_epoch),
        "expires_at_epoch": expires_at_epoch,
        "ttl_seconds": limits["ttl_seconds"],
        "repo_root": config["repo_root"],
        "results_root": config["results_root"],
        "control_root": config["control_root"],
        "authkey_path": config["authkey_path"],
        "authkey_sha256": config["authkey_sha256"],
        "bootstrap_path": config["bootstrap_path"],
        "state_path": config["state_path"],
        "start_receipt_path": config["start_receipt_path"],
        "stop_receipt_path": config["stop_receipt_path"],
        "path_sha256": config["path_sha256"],
        "broker_python": config["broker_python"],
        "broker_files": config["broker_files"],
        "authority_files": config["authority_files"],
        "executable_allowlist": config["executable_allowlist"],
        "python_script_roots": config["python_script_roots"],
        "resource_caps": {
            "job_memory_limit_bytes": limits["job_memory_limit_bytes"],
            "active_process_limit": limits["active_process_limit"],
            "request_timeout_max_seconds": limits["request_timeout_max_seconds"],
        },
        "job_preflight": dict(job_preflight),
    }


def _write_start_state(config: Mapping[str, Any], state: Mapping[str, Any]) -> None:
    state_path = Path(config["state_path"])
    _write_json_exclusive(state_path, state)
    start_receipt = {
        **state,
        "schema": core.START_RECEIPT_SCHEMA,
        "state_schema": core.STATE_SCHEMA,
    }
    _write_json_exclusive(Path(config["start_receipt_path"]), start_receipt)
    active = {
        "schema": core.ACTIVE_SCHEMA,
        "broker_id": config["broker_id"],
        "state_path": config["state_path"],
    }
    _write_json_atomic(Path(config["active_path"]), active)


def _stream_record(path: Path) -> dict[str, Any]:
    return {"path": str(path), "bytes": path.stat().st_size, "sha256": core.sha256_file(path)}


def _execution_context(state: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "broker_id": state["broker_id"],
        "broker_pid": state["pid"],
        "administrator": state["administrator"],
        "expires_at_utc": state["expires_at_utc"],
        "expires_at_epoch": state["expires_at_epoch"],
        "executable_allowlist": state["executable_allowlist"],
        "resource_caps": state["resource_caps"],
    }


def _execute_run(
    request: Mapping[str, Any],
    state: Mapping[str, Any],
    config: Mapping[str, Any],
    run_module: Any,
    job_module: Any,
    frozen_environment: Mapping[str, str],
    deadline_monotonic: float,
) -> dict[str, Any]:
    core.validate_request_timing(
        request,
        remaining_ttl_seconds=deadline_monotonic - time.monotonic(),
        request_timeout_max_seconds=state["resource_caps"][
            "request_timeout_max_seconds"
        ],
    )
    repo = Path(state["repo_root"]).resolve(strict=True)
    results = Path(state["results_root"]).resolve(strict=True)
    core.ensure_git_ignored(repo, results)
    cwd, output_dir = core.validate_request_paths(request, repo, results)
    core.verify_allowlist_snapshot(
        state["executable_allowlist"], state["python_script_roots"]
    )
    executable_identity = core.validate_executable_request(
        request["argv"],
        state["executable_allowlist"],
        state["python_script_roots"],
    )
    core.verify_file_records(config["authority_files"], "measurement authority")
    os.mkdir(output_dir)
    if output_dir.resolve(strict=True) != output_dir:
        raise core.RequestError("fresh output directory changed identity during creation")

    request_path = output_dir / "request.json"
    stdout_path = output_dir / "stdout.bin"
    stderr_path = output_dir / "stderr.bin"
    measurement_path = output_dir / "measurement.json"
    receipt_path = output_dir / "run-receipt.json"
    failure_path = output_dir / "failure-receipt.json"
    _write_json_exclusive(request_path, request)
    started_at = _utc_now()
    caps = state["resource_caps"]
    try:
        with run_module.measurement_machine_lock():
            measurement = job_module.run_in_job(
                request["argv"],
                cwd=cwd,
                env=frozen_environment,
                stdout_path=stdout_path,
                stderr_path=stderr_path,
                timeout_seconds=request["timeout_seconds"],
                poll_ms=10,
                memory_limit_bytes=caps["job_memory_limit_bytes"],
                active_process_limit=caps["active_process_limit"],
            )
    except BaseException as exc:
        _ensure_empty_sidecar(stdout_path)
        _ensure_empty_sidecar(stderr_path)
        failure = {
            "schema": core.FAILURE_RECEIPT_SCHEMA,
            "outcome": "failed-loud",
            "error_type": type(exc).__name__,
            "error": str(exc),
            "request": dict(request),
            "executable_identity": executable_identity,
            "execution_context": _execution_context(state),
            "started_at_utc": started_at,
            "finished_at_utc": _utc_now(),
            "stdout": _stream_record(stdout_path),
            "stderr": _stream_record(stderr_path),
        }
        _write_json_exclusive(failure_path, failure)
        return {
            "ok": False,
            "error_type": type(exc).__name__,
            "error": str(exc),
            "output_dir": str(output_dir),
            "failure_receipt": str(failure_path),
        }

    measurement_bytes = core.canonical_json_bytes(measurement)
    _write_exclusive(measurement_path, measurement_bytes)
    measurement_errors = measurement.get("measurement_errors", [])
    command_success = (
        measurement.get("exit_code") == 0
        and measurement.get("timed_out") is False
        and measurement_errors == []
    )
    receipt = {
        "schema": core.RUN_RECEIPT_SCHEMA,
        "outcome": "success" if command_success else "command-or-measurement-failed",
        "request": dict(request),
        "executable_identity": executable_identity,
        "execution_context": _execution_context(state),
        "started_at_utc": started_at,
        "finished_at_utc": _utc_now(),
        "stdout": _stream_record(stdout_path),
        "stderr": _stream_record(stderr_path),
        "measurement": {
            "path": str(measurement_path),
            "bytes": len(measurement_bytes),
            "sha256": core.sha256_bytes(measurement_bytes),
        },
    }
    _write_json_exclusive(receipt_path, receipt)
    return {
        "ok": True,
        "command_success": command_success,
        "exit_code": measurement.get("exit_code"),
        "timed_out": measurement.get("timed_out"),
        "measurement_errors": measurement_errors,
        "output_dir": str(output_dir),
        "stdout": str(stdout_path),
        "stderr": str(stderr_path),
        "measurement": str(measurement_path),
        "receipt": str(receipt_path),
    }


def _response_for_request(
    raw: bytes,
    state: Mapping[str, Any],
    config: Mapping[str, Any],
    run_module: Any,
    job_module: Any,
    frozen_environment: Mapping[str, str],
    deadline_monotonic: float,
) -> tuple[dict[str, Any], bool]:
    try:
        parsed = core.strict_json_loads(raw, "broker request")
        request = core.validate_request_schema(parsed)
        if request["operation"] == "status":
            return {"ok": True, "state": state}, False
        if request["operation"] == "stop":
            return {"ok": True, "state": state, "stopping": True}, True
        return (
            _execute_run(
                request,
                state,
                config,
                run_module,
                job_module,
                frozen_environment,
                deadline_monotonic,
            ),
            False,
        )
    except BaseException as exc:
        return {
            "ok": False,
            "error_type": type(exc).__name__,
            "error": str(exc),
        }, False


def _finalize_state(
    config: Mapping[str, Any], state: Mapping[str, Any], reason: str
) -> dict[str, Any]:
    stopped = {
        **state,
        "status": "stopped",
        "stopped_at_utc": _utc_now(),
        "stop_reason": reason,
    }
    try:
        _write_json_atomic(Path(config["state_path"]), stopped)
        _write_json_exclusive(
            Path(config["stop_receipt_path"]),
            {
                **stopped,
                "schema": core.STOP_RECEIPT_SCHEMA,
                "state_schema": core.STATE_SCHEMA,
            },
        )
    finally:
        for transient in (
            Path(config["authkey_path"]),
            Path(config["bootstrap_path"]),
        ):
            try:
                transient.unlink(missing_ok=True)
            except OSError:
                pass
    return stopped


def _run_server(config: Mapping[str, Any]) -> int:
    run_module, job_module = _load_authority(config)
    administrator = _administrator_identity()
    limits = config["limits"]
    job_preflight = job_module.preflight_job_support(
        limits["job_memory_limit_bytes"], limits["active_process_limit"]
    )
    authkey = _load_authkey(
        Path(config["authkey_path"]), config["authkey_sha256"]
    )
    frozen_environment = dict(os.environ)
    if core.path_env_sha256(frozen_environment.get("PATH", "")) != config["path_sha256"]:
        raise core.BrokerError("PATH changed while the broker initialized")

    listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 0)
    listener.bind(("127.0.0.1", 0))
    listener.listen(8)
    listener.settimeout(ACCEPT_POLL_SECONDS)
    address = listener.getsockname()
    created_at_epoch = time.time()
    deadline_monotonic = time.monotonic() + limits["ttl_seconds"]
    state = _state_from_config(
        config,
        address=(address[0], int(address[1])),
        administrator=administrator,
        job_preflight=job_preflight,
        created_at_epoch=created_at_epoch,
    )
    _write_start_state(config, state)

    reason = "ttl_expired"
    fatal: BaseException | None = None
    try:
        while time.monotonic() < deadline_monotonic:
            try:
                connection, peer = listener.accept()
            except socket.timeout:
                continue
            with connection:
                remaining = deadline_monotonic - time.monotonic()
                if remaining <= 0:
                    continue
                connection.settimeout(min(SOCKET_TIMEOUT_SECONDS, remaining))
                if peer[0] != "127.0.0.1":
                    continue
                try:
                    _server_authenticate(connection, authkey)
                    response, should_stop = _response_for_request(
                        _recv_frame(connection),
                        state,
                        config,
                        run_module,
                        job_module,
                        frozen_environment,
                        deadline_monotonic,
                    )
                    _send_frame(connection, core.canonical_json_bytes(response))
                    if should_stop:
                        reason = "manual_stop"
                        break
                except (
                    core.AuthenticationError,
                    core.BrokerError,
                    OSError,
                    TimeoutError,
                ):
                    continue
    except BaseException as exc:
        reason = f"fatal:{type(exc).__name__}"
        fatal = exc
    finally:
        listener.close()
        _finalize_state(config, state, reason)
    if fatal is not None:
        raise fatal
    return 0


def _write_startup_failure(config: Mapping[str, Any], exc: BaseException) -> None:
    path = Path(config["startup_failure_receipt_path"])
    if path.exists():
        return
    try:
        _write_json_exclusive(
            path,
            {
                "schema": core.FAILURE_RECEIPT_SCHEMA,
                "outcome": "startup-failed-loud",
                "broker_id": config["broker_id"],
                "pid": os.getpid(),
                "error_type": type(exc).__name__,
                "error": str(exc),
                "recorded_at_utc": _utc_now(),
                "executable_allowlist": config["executable_allowlist"],
                "resource_caps": config["limits"],
            },
        )
    except OSError:
        pass


def command_serve(args: argparse.Namespace) -> int:
    config: dict[str, Any] | None = None
    try:
        config = _load_bootstrap(Path(args.bootstrap), args.bootstrap_sha256)
        return _run_server(config)
    except BaseException as exc:
        if config is not None:
            _write_startup_failure(config, exc)
        raise


def _add_client_roots(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--repo", default=str(DEFAULT_REPO_ROOT))
    parser.add_argument("--results-root", default="bench/check/results")
    parser.add_argument("--control-root")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Bounded one-UAC Windows elevated-command broker"
    )
    subparsers = parser.add_subparsers(dest="command_name", required=True)

    start = subparsers.add_parser("start", help="start one fixed-TTL elevated broker")
    _add_client_roots(start)
    start.add_argument("--ttl-seconds", type=int, default=core.DEFAULT_TTL_SECONDS)
    start.add_argument(
        "--request-timeout-max-seconds",
        type=int,
        default=core.DEFAULT_REQUEST_TIMEOUT_MAX_SECONDS,
    )
    start.add_argument(
        "--job-memory-limit-bytes",
        type=int,
        default=core.DEFAULT_JOB_MEMORY_LIMIT_BYTES,
    )
    start.add_argument(
        "--active-process-limit", type=int, default=core.DEFAULT_ACTIVE_PROCESS_LIMIT
    )
    start.add_argument("--allow-executable", action="append", default=[])
    start.add_argument("--python-root", action="append", default=[])
    start.add_argument("--startup-timeout-seconds", type=float, default=30.0)
    start.add_argument("--dry-run", action="store_true")
    start.set_defaults(handler=command_start)

    status = subparsers.add_parser("status", help="query broker without UAC")
    _add_client_roots(status)
    status.set_defaults(handler=command_status)

    run = subparsers.add_parser("run", help="run one exact argv without a shell")
    _add_client_roots(run)
    run.add_argument("--cwd")
    run.add_argument("--output-dir", required=True)
    run.add_argument("--timeout-seconds", type=float, required=True)
    run.add_argument("--request-id")
    run.add_argument("command", nargs=argparse.REMAINDER)
    run.set_defaults(handler=command_run)

    stop = subparsers.add_parser("stop", help="stop broker without UAC")
    _add_client_roots(stop)
    stop.set_defaults(handler=command_stop)

    serve = subparsers.add_parser("_serve", help=argparse.SUPPRESS)
    serve.add_argument("--bootstrap", required=True)
    serve.add_argument("--bootstrap-sha256", required=True)
    serve.set_defaults(handler=command_serve)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    startup_timeout = getattr(args, "startup_timeout_seconds", 1)
    if (
        not math.isfinite(startup_timeout)
        or startup_timeout <= 0
        or startup_timeout > 60
    ):
        raise core.BrokerError("startup timeout must be in (0, 60] seconds")
    return int(args.handler(args))


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (core.BrokerError, OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
