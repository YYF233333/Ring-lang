from __future__ import annotations

import os
import socket
import sys
import tempfile
import threading
import time
import types
import unittest
from contextlib import nullcontext
from pathlib import Path
from unittest import mock

import elevated_broker as broker
import elevated_broker_core as core


class AuthenticationTests(unittest.TestCase):
    def test_authkey_round_trip_and_proofs_are_role_separated(self) -> None:
        key = bytes(range(core.AUTHKEY_BYTES))
        nonce = bytes(reversed(range(core.AUTH_NONCE_BYTES)))
        self.assertEqual(core.decode_authkey(core.encode_authkey(key)), key)
        self.assertNotEqual(core.client_proof(key, nonce), core.server_proof(key, nonce))
        core.verify_proof(core.client_proof(key, nonce), core.client_proof(key, nonce))
        with self.assertRaises(core.AuthenticationError):
            core.verify_proof(core.client_proof(key, nonce), b"x" * 32)

    def test_socket_challenge_response_never_sends_authkey(self) -> None:
        key = b"k" * core.AUTHKEY_BYTES
        server_socket, client_socket = socket.socketpair()
        server_socket.settimeout(2)
        client_socket.settimeout(2)
        errors: list[BaseException] = []

        def server() -> None:
            try:
                broker._server_authenticate(server_socket, key)
            except BaseException as exc:  # pragma: no cover - diagnostic capture
                errors.append(exc)
            finally:
                server_socket.close()

        thread = threading.Thread(target=server)
        thread.start()
        try:
            broker._client_authenticate(client_socket, key)
        finally:
            client_socket.close()
        thread.join(2)
        self.assertFalse(thread.is_alive())
        self.assertEqual(errors, [])

    def test_wrong_authkey_fails_closed(self) -> None:
        server_key = b"s" * core.AUTHKEY_BYTES
        client_key = b"c" * core.AUTHKEY_BYTES
        server_socket, client_socket = socket.socketpair()
        server_socket.settimeout(2)
        client_socket.settimeout(2)
        errors: list[BaseException] = []

        def server() -> None:
            try:
                broker._server_authenticate(server_socket, server_key)
            except BaseException as exc:
                errors.append(exc)
            finally:
                server_socket.close()

        thread = threading.Thread(target=server)
        thread.start()
        with self.assertRaises(core.AuthenticationError):
            broker._client_authenticate(client_socket, client_key)
        client_socket.close()
        thread.join(2)
        self.assertEqual(len(errors), 1)
        self.assertIsInstance(errors[0], core.AuthenticationError)


class ElevatedLaunchTests(unittest.TestCase):
    def test_uac_launch_is_visible_until_broker_hides_its_console(self) -> None:
        shell32 = mock.MagicMock()
        shell32.ShellExecuteW.return_value = 33
        config = {
            "bootstrap_path": "C:\\repo\\bootstrap.json",
            "broker_python": {"path": "C:\\Python\\python.exe"},
            "repo_root": "C:\\repo",
        }
        with mock.patch.object(broker.ctypes, "WinDLL", return_value=shell32):
            broker._launch_elevated(config, "a" * 64)
        self.assertEqual(shell32.ShellExecuteW.call_args.args[-1], broker.SW_SHOWNORMAL)


class AllowlistTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.repo = self.root / "repo"
        self.repo.mkdir()
        self.tool = self.root / "tool.exe"
        self.tool.write_bytes(b"tool-v1")
        self.python_root = self.repo / "scripts"
        self.python_root.mkdir()
        self.script = self.python_root / "task.py"
        self.script.write_text("print('ok')\n", encoding="utf-8")

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_fixed_hash_is_rechecked_for_every_request(self) -> None:
        entries, roots = core.build_allowlist(
            self.repo, [str(self.tool)], [], sys.executable
        )
        identity = core.validate_executable_request(
            [str(self.tool), "arg"], entries, roots
        )
        self.assertEqual(identity["sha256"], core.sha256_file(self.tool))
        self.tool.write_bytes(b"tool-v2")
        with self.assertRaisesRegex(core.RequestError, "hash drifted"):
            core.validate_executable_request([str(self.tool)], entries, roots)

    def test_python_requires_pinned_script_and_exact_root_inventory(self) -> None:
        entries, roots = core.build_allowlist(
            self.repo, [], [str(self.python_root)], sys.executable
        )
        identity = core.validate_executable_request(
            [str(Path(sys.executable).resolve()), str(self.script.resolve())],
            entries,
            roots,
        )
        self.assertEqual(identity["kind"], "python")
        outsider = self.repo / "outside.py"
        outsider.write_text("pass\n", encoding="utf-8")
        with self.assertRaisesRegex(core.RequestError, "not pinned"):
            core.validate_executable_request(
                [str(Path(sys.executable).resolve()), str(outsider.resolve())],
                entries,
                roots,
            )
        (self.python_root / "added.py").write_text("pass\n", encoding="utf-8")
        with self.assertRaisesRegex(core.BrokerError, "inventory drifted"):
            core.verify_allowlist_snapshot(entries, roots)

    def test_python_referenced_executables_must_also_be_pinned(self) -> None:
        entries, roots = core.build_allowlist(
            self.repo,
            [str(self.tool)],
            [str(self.python_root)],
            sys.executable,
        )
        identity = core.validate_executable_request(
            [
                str(Path(sys.executable).resolve()),
                str(self.script.resolve()),
                "--tool",
                str(self.tool.resolve()),
            ],
            entries,
            roots,
        )
        self.assertEqual(identity["referenced_executables"][0]["path"], str(self.tool.resolve()))
        unpinned = self.root / "other.exe"
        unpinned.write_bytes(b"other")
        with self.assertRaisesRegex(core.RequestError, "not explicitly pinned"):
            core.validate_executable_request(
                [
                    str(Path(sys.executable).resolve()),
                    str(self.script.resolve()),
                    str(unpinned.resolve()),
                ],
                entries,
                roots,
            )

    def test_python_cannot_be_added_as_generic_executable(self) -> None:
        with self.assertRaisesRegex(core.BrokerError, "explicit Python roots"):
            core.build_allowlist(
                self.repo, [str(Path(sys.executable).resolve())], [], sys.executable
            )


class PathAndOverwriteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.repo = self.root / "repo"
        self.results = self.repo / "results"
        self.cwd = self.repo / "work"
        self.results.mkdir(parents=True)
        self.cwd.mkdir()

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def _request(self, output: Path, cwd: Path | None = None) -> dict[str, str]:
        return {
            "cwd": str((cwd or self.cwd).resolve()),
            "output_dir": str(output),
        }

    def test_paths_are_bounded_to_repo_and_results(self) -> None:
        output = self.results / "fresh"
        cwd, validated = core.validate_request_paths(
            self._request(output), self.repo.resolve(), self.results.resolve()
        )
        self.assertEqual(cwd, self.cwd.resolve())
        self.assertEqual(validated, output.resolve(strict=False))
        with self.assertRaisesRegex(core.RequestError, "results root"):
            core.validate_request_paths(
                self._request(self.root / "outside"),
                self.repo.resolve(),
                self.results.resolve(),
            )
        with self.assertRaisesRegex(core.RequestError, "inside the repository"):
            core.validate_request_paths(
                self._request(self.results / "other", self.root),
                self.repo.resolve(),
                self.results.resolve(),
            )

    def test_existing_output_refuses_sidecar_overwrite(self) -> None:
        output = self.results / "occupied"
        output.mkdir()
        (output / "stdout.bin").write_bytes(b"keep")
        with self.assertRaisesRegex(core.RequestError, "overwrite is forbidden"):
            core.validate_request_paths(
                self._request(output), self.repo.resolve(), self.results.resolve()
            )
        self.assertEqual((output / "stdout.bin").read_bytes(), b"keep")


class TimingAndSchemaTests(unittest.TestCase):
    def test_ttl_and_resource_caps_are_fixed_and_bounded(self) -> None:
        limits = core.validate_limits(
            core.DEFAULT_TTL_SECONDS,
            core.DEFAULT_REQUEST_TIMEOUT_MAX_SECONDS,
            core.DEFAULT_JOB_MEMORY_LIMIT_BYTES,
            core.DEFAULT_ACTIVE_PROCESS_LIMIT,
        )
        self.assertEqual(limits["job_memory_limit_bytes"], 12 * 1024**3)
        self.assertEqual(limits["active_process_limit"], 5)
        with self.assertRaises(core.BrokerError):
            core.validate_limits(59, 1, 12 * 1024**3, 5)
        with self.assertRaises(core.BrokerError):
            core.validate_limits(3600, 1800, 12 * 1024**3 + 1, 5)

    def test_request_must_fit_both_maximum_and_remaining_ttl(self) -> None:
        request = {"timeout_seconds": 10.0}
        core.validate_request_timing(
            request,
            remaining_ttl_seconds=20.0,
            request_timeout_max_seconds=15,
        )
        request["timeout_seconds"] = 15.0
        with self.assertRaisesRegex(core.RequestError, "outlive"):
            core.validate_request_timing(
                request,
                remaining_ttl_seconds=20.0,
                request_timeout_max_seconds=15,
            )

    def test_request_schema_rejects_shell_strings_unknown_fields_and_bool_timeout(self) -> None:
        with self.assertRaisesRegex(core.RequestError, "not a shell command string"):
            core.validate_request_schema("cmd.exe /c whoami")
        valid = {
            "schema": core.REQUEST_SCHEMA,
            "operation": "run",
            "request_id": "request-1",
            "argv": [str(Path(sys.executable).resolve()), "C:\\task.py"],
            "cwd": "C:\\repo",
            "output_dir": "C:\\repo\\results\\one",
            "timeout_seconds": 10,
        }
        core.validate_request_schema(valid)
        with self.assertRaisesRegex(core.RequestError, "exactly match"):
            core.validate_request_schema({**valid, "shell": True})
        with self.assertRaisesRegex(core.RequestError, "positive number"):
            core.validate_request_schema({**valid, "timeout_seconds": True})
        with self.assertRaisesRegex(core.RequestError, "positive number"):
            core.validate_request_schema({**valid, "timeout_seconds": float("nan")})

    def test_malformed_authenticated_request_returns_fail_loud_response(self) -> None:
        response, should_stop = broker._response_for_request(
            b'{"schema":"wrong","operation":"status"}',
            {},
            {},
            None,
            None,
            {},
            100.0,
        )
        self.assertFalse(response["ok"])
        self.assertEqual(response["error_type"], "RequestError")
        self.assertFalse(should_stop)

    def test_duplicate_json_keys_are_rejected(self) -> None:
        with self.assertRaises(core.BrokerError):
            core.strict_json_loads(b'{"operation":"status","operation":"stop"}')
        with self.assertRaises(core.BrokerError):
            core.strict_json_loads(b'{"timeout_seconds":NaN}')

    def test_state_exposes_identity_expiry_hashes_and_caps(self) -> None:
        config = {
            "broker_id": "0" * 32,
            "repo_root": "C:\\repo",
            "results_root": "C:\\repo\\results",
            "control_root": "C:\\repo\\results\\broker",
            "authkey_path": "C:\\repo\\results\\broker\\key",
            "authkey_sha256": "1" * 64,
            "bootstrap_path": "C:\\repo\\results\\broker\\bootstrap",
            "state_path": "C:\\repo\\results\\broker\\state",
            "start_receipt_path": "C:\\repo\\results\\broker\\start",
            "stop_receipt_path": "C:\\repo\\results\\broker\\stop",
            "path_sha256": "2" * 64,
            "broker_python": {"path": "C:\\python.exe", "sha256": "3" * 64},
            "broker_files": [],
            "authority_files": [],
            "executable_allowlist": [
                {"path": "C:\\xperf.exe", "sha256": "4" * 64, "kind": "executable"}
            ],
            "python_script_roots": [],
            "limits": {
                "ttl_seconds": 3600,
                "request_timeout_max_seconds": 1800,
                "job_memory_limit_bytes": 12 * 1024**3,
                "active_process_limit": 5,
            },
        }
        state = broker._state_from_config(
            config,
            address=("127.0.0.1", 12345),
            administrator={"username": "user", "is_admin": True},
            job_preflight={
                "job_memory_limit_bytes": 12 * 1024**3,
                "active_process_limit": 5,
            },
            created_at_epoch=1000.0,
        )
        self.assertEqual(state["pid"], os.getpid())
        self.assertTrue(state["administrator"]["is_admin"])
        self.assertEqual(state["expires_at_epoch"], 4600.0)
        self.assertEqual(state["executable_allowlist"][0]["sha256"], "4" * 64)
        self.assertEqual(state["resource_caps"]["job_memory_limit_bytes"], 12 * 1024**3)
        self.assertEqual(state["resource_caps"]["active_process_limit"], 5)


class FailLoudExecutionTests(unittest.TestCase):
    def test_authority_loader_registers_dataclass_module(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            job_path = root / "windows_job.py"
            run_path = root / "run.py"
            job_path.write_text("AUTHORITY = 'job'\n", encoding="utf-8")
            run_path.write_text(
                "from dataclasses import dataclass\n"
                "@dataclass(frozen=True)\n"
                "class LockAuthority:\n"
                "    name: str\n",
                encoding="utf-8",
            )
            config = {
                "authority_files": [
                    {"path": str(run_path), "sha256": core.sha256_file(run_path)},
                    {"path": str(job_path), "sha256": core.sha256_file(job_path)},
                ]
            }
            loaded_run, loaded_job = broker._load_authority(config)
            self.assertEqual(loaded_run.LockAuthority("lock").name, "lock")
            self.assertEqual(loaded_job.AUTHORITY, "job")

    def test_spawn_failure_preserves_streams_and_writes_failure_receipt(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            repo = Path(temporary) / "repo"
            results = repo / "results"
            cwd = repo / "work"
            results.mkdir(parents=True)
            cwd.mkdir()
            tool = repo / "tool.exe"
            tool.write_bytes(b"tool")
            authority = repo / "authority.py"
            authority.write_text("# pinned\n", encoding="utf-8")
            executable = {
                "path": str(tool.resolve()),
                "sha256": core.sha256_file(tool),
                "kind": "executable",
            }
            state = {
                "broker_id": "0" * 32,
                "pid": os.getpid(),
                "administrator": {"username": "user", "is_admin": True},
                "expires_at_utc": "2099-01-01T00:00:00Z",
                "expires_at_epoch": time.time() + 100,
                "repo_root": str(repo.resolve()),
                "results_root": str(results.resolve()),
                "executable_allowlist": [executable],
                "python_script_roots": [],
                "resource_caps": {
                    "job_memory_limit_bytes": 12 * 1024**3,
                    "active_process_limit": 5,
                    "request_timeout_max_seconds": 60,
                },
            }
            config = {
                "authority_files": [
                    {
                        "path": str(authority.resolve()),
                        "sha256": core.sha256_file(authority),
                    }
                ]
            }
            output = results / "failed-request"
            request = {
                "schema": core.REQUEST_SCHEMA,
                "operation": "run",
                "request_id": "failed-request",
                "argv": [str(tool.resolve())],
                "cwd": str(cwd.resolve()),
                "output_dir": str(output.resolve(strict=False)),
                "timeout_seconds": 10.0,
            }
            run_module = types.SimpleNamespace(measurement_machine_lock=nullcontext)

            def fail_spawn(*_args: object, **_kwargs: object) -> None:
                raise RuntimeError("spawn failed")

            job_module = types.SimpleNamespace(run_in_job=fail_spawn)
            with mock.patch.object(core, "ensure_git_ignored", return_value=None):
                response = broker._execute_run(
                    request,
                    state,
                    config,
                    run_module,
                    job_module,
                    {},
                    time.monotonic() + 100,
                )
            self.assertFalse(response["ok"])
            self.assertEqual((output / "stdout.bin").read_bytes(), b"")
            self.assertEqual((output / "stderr.bin").read_bytes(), b"")
            receipt = core.strict_json_loads(
                (output / "failure-receipt.json").read_bytes()
            )
            self.assertEqual(receipt["outcome"], "failed-loud")
            self.assertEqual(receipt["error"], "spawn failed")


if __name__ == "__main__":
    unittest.main()
