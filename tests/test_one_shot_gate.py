from __future__ import annotations

import hashlib
import gc
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / ".agents" / "scripts"))
sys.path.insert(0, str(REPO_ROOT / "bench" / "check"))

import one_shot_gate as gate  # noqa: E402
import windows_job  # noqa: E402


MIB = 1024 * 1024


def sanitized_env() -> dict[str, str]:
    if os.name != "nt":
        return {
            "PATH": os.pathsep.join(
                (str(Path(sys.executable).resolve().parent), "/usr/bin", "/bin")
            ),
            "PYTHONIOENCODING": "utf-8",
        }
    system_root = os.environ.get("SystemRoot", r"C:\Windows")
    return {
        "PATH": os.pathsep.join(
            (str(Path(sys.executable).resolve().parent), str(Path(system_root) / "System32"))
        ),
        "PYTHONIOENCODING": "utf-8",
        "SystemRoot": system_root,
        "WINDIR": os.environ.get("WINDIR", system_root),
    }


def make_spec(
    evidence_dir: Path,
    code: str,
    *,
    wall_seconds: float = 3,
    stdout_cap: int = 4096,
    stderr_cap: int = 4096,
    memory: int | None = None,
    processes: int | None = None,
    gate_id: str = "synthetic",
) -> gate.OneShotSpec:
    if os.name == "nt":
        if memory is None:
            memory = 256 * MIB
        if processes is None:
            processes = 1
    env = sanitized_env()
    argv = (str(Path(sys.executable).resolve()), "-c", code)
    return gate.OneShotSpec(
        evidence_dir=evidence_dir.resolve(),
        gate_id=gate_id,
        argv=argv,
        reviewed_argv=argv,
        cwd=REPO_ROOT.resolve(),
        env=env,
        reviewed_env=tuple(sorted(env.items())),
        limits=gate.Limits(
            wall_seconds=wall_seconds,
            stdout_cap_bytes=stdout_cap,
            stderr_cap_bytes=stderr_cap,
            job_memory_bytes=memory,
            active_process_limit=processes,
        ),
    )


def raw_record(
    root: Path, name: str, cap: int, data: bytes, error: str | None = None
) -> dict[str, object]:
    gate.exclusive_write_bytes(root / name, data)
    return {
        "path": name,
        "captured_size": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "bytes_seen": len(data),
        "cap_bytes": cap,
        "truncated_at_cap": False,
        "fsynced": True,
        "error": error,
    }


def synthetic_fault_adapter(kind: str):
    def adapter(argv, *, cwd, env, stdout_path, stderr_path, limits):
        del argv, cwd, env
        message = f"synthetic-{kind}"
        stdout = raw_record(
            stdout_path.parent, gate.STDOUT_NAME, limits.stdout_cap_bytes, b"out\n"
        )
        stderr = raw_record(
            stderr_path.parent,
            gate.STDERR_NAME,
            limits.stderr_cap_bytes,
            b"err\n",
            message if kind == "pipe" else None,
        )
        return {
            "adapter": "synthetic-fault-v1",
            "support": {
                "wall": "synthetic",
                "output": "synthetic",
                "job_memory": "synthetic",
                "active_process": "synthetic",
            },
            "stage": "child-sealed",
            "exit_code": 0,
            "timed_out": False,
            "memory_limit_hit": False,
            "process_limit_hit": False,
            "output_limit_hit": False,
            "launch_error": None,
            "pipe_error": message if kind == "pipe" else None,
            "thread_error": message if kind == "thread" else None,
            "infrastructure_error": None,
            "measurements": {"wall_ns": 1, "thread_count": 2},
            "streams": {"stdout": stdout, "stderr": stderr},
        }

    return adapter


class OneShotGateTests(unittest.TestCase):
    def test_nonzero_preserves_unique_82_byte_stderr_and_refuses_retry(self) -> None:
        prefix = b"validator-worker unique stderr: "
        message = prefix + b"x" * (82 - len(prefix) - 1) + b"\n"
        self.assertEqual(len(message), 82)
        code = (
            "import sys;"
            "sys.stdout.buffer.write(b'unique-stdout\\n');sys.stdout.flush();"
            f"sys.stderr.buffer.write(bytes.fromhex('{message.hex()}'));"
            "sys.stderr.flush();raise SystemExit(7)"
        )
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            spec = make_spec(root, code, gate_id="historical-82-byte")
            verdict = gate.run_one_shot(spec)
            self.assertEqual(verdict["classification"], "child_nonzero")
            self.assertEqual(verdict["child"]["exit_code"], 7)
            self.assertEqual((root / gate.STDOUT_NAME).read_bytes(), b"unique-stdout\n")
            self.assertEqual((root / gate.STDERR_NAME).read_bytes(), message)
            stderr_record = verdict["streams"]["stderr"]
            self.assertEqual(stderr_record["captured_size"], 82)
            self.assertEqual(stderr_record["sha256"], hashlib.sha256(message).hexdigest())
            self.assertNotIn(message.decode("ascii").strip(), verdict["error"])
            audit = gate.audit_attempt(root)
            self.assertEqual(audit["state"], "complete")
            self.assertEqual(audit["classification"], "child_nonzero")
            with self.assertRaisesRegex(gate.ContractError, "retry/overwrite"):
                gate.run_one_shot(spec)
            with self.assertRaisesRegex(gate.ContractError, "exclusive create"):
                gate.exclusive_write_json(root / gate.VERDICT_NAME, verdict)

    def test_output_cap_preserves_exact_prefix_and_classification(self) -> None:
        code = "import sys;sys.stdout.buffer.write(b'A'*4096);sys.stdout.flush()"
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            verdict = gate.run_one_shot(
                make_spec(root, code, stdout_cap=37, stderr_cap=64)
            )
            self.assertEqual(verdict["classification"], "output_limit")
            record = verdict["streams"]["stdout"]
            self.assertTrue(record["truncated_at_cap"])
            self.assertEqual(record["captured_size"], 37)
            self.assertGreaterEqual(record["bytes_seen"], 37)
            self.assertEqual((root / gate.STDOUT_NAME).read_bytes(), b"A" * 37)
            audit = gate.audit_attempt(root)
            self.assertEqual(audit["state"], "complete", audit)

    def test_timeout_preserves_marker_and_measurement(self) -> None:
        code = (
            "import sys,time;sys.stderr.buffer.write(b'before-timeout\\n');"
            "sys.stderr.flush();time.sleep(5)"
        )
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            verdict = gate.run_one_shot(
                make_spec(root, code, wall_seconds=0.08)
            )
            self.assertEqual(verdict["classification"], "timeout")
            self.assertTrue(verdict["child"]["timed_out"])
            self.assertEqual(
                (root / gate.STDERR_NAME).read_bytes(), b"before-timeout\n"
            )
            self.assertGreater(verdict["measurements"]["wall_ns"], 0)

    @unittest.skipUnless(os.name == "nt", "Windows Job memory cap required")
    def test_windows_job_memory_limit_has_unique_reason(self) -> None:
        code = (
            "import time;xs=[]\n"
            "while True:\n"
            "    try: xs.append(bytearray(8*1024*1024))\n"
            "    except MemoryError: time.sleep(2)\n"
        )
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            verdict = gate.run_one_shot(
                make_spec(root, code, wall_seconds=3, memory=48 * MIB)
            )
            self.assertEqual(verdict["classification"], "memory_limit")
            self.assertTrue(verdict["child"]["memory_limit_hit"])
            self.assertIn(
                gate_path := verdict["streams"]["stderr"]["path"],
                (gate.STDERR_NAME,),
            )
            self.assertEqual(gate_path, gate.STDERR_NAME)

    @unittest.skipUnless(os.name == "nt", "Windows Job process cap required")
    def test_windows_job_process_limit_has_unique_reason(self) -> None:
        code = (
            "import subprocess,sys,time\n"
            "try: subprocess.run([sys.executable,'-c','pass'],check=False)\n"
            "except BaseException as e: sys.stderr.write(type(e).__name__+'\\n');sys.stderr.flush()\n"
            "time.sleep(2)\n"
        )
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            verdict = gate.run_one_shot(
                make_spec(root, code, wall_seconds=3, processes=1)
            )
            self.assertEqual(verdict["classification"], "process_limit")
            self.assertTrue(verdict["child"]["process_limit_hit"])

    @unittest.skipUnless(os.name == "nt", "Windows handle count required")
    def test_windows_one_shot_adapter_does_not_leak_handles(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            warm = base / "warm"
            warm.mkdir()
            gate.run_one_shot(make_spec(warm, "pass"))
            gc.collect()
            before = windows_job.current_process_handle_count()
            steady = base / "steady"
            steady.mkdir()
            gate.run_one_shot(make_spec(steady, "pass"))
            gc.collect()
            self.assertEqual(windows_job.current_process_handle_count(), before)

    def test_pipe_and_thread_faults_have_distinct_durable_verdicts(self) -> None:
        for kind, expected in (("pipe", "pipe_error"), ("thread", "thread_error")):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as temp:
                root = Path(temp) / "attempt"
                root.mkdir()
                spec = make_spec(root, "pass")
                verdict = gate.run_one_shot(
                    spec, _adapter=synthetic_fault_adapter(kind)
                )
                self.assertEqual(verdict["classification"], expected)
                self.assertEqual(gate.audit_attempt(root)["state"], "complete")

    @unittest.skipUnless(os.name == "nt", "Windows pipe fault injection required")
    def test_windows_child_pipe_fault_seals_raw_before_verdict(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            spec = make_spec(root, "import time;time.sleep(1)")
            with mock.patch.object(
                windows_job.os,
                "read",
                side_effect=OSError("synthetic-pipe-read"),
            ):
                verdict = gate.run_one_shot(
                    spec, _adapter=windows_job.run_one_shot_job
                )
            self.assertEqual(verdict["classification"], "pipe_error")
            self.assertIn("synthetic-pipe-read", verdict["child"]["pipe_error"])
            self.assertTrue(verdict["streams"]["stdout"]["fsynced"])
            self.assertTrue(verdict["streams"]["stderr"]["fsynced"])
            self.assertEqual(gate.audit_attempt(root)["state"], "complete")

    @unittest.skipIf(os.name == "nt", "native POSIX process groups required")
    def test_non_windows_adapter_uses_shared_schema_when_caps_not_requested(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            base = make_spec(root, "print('portable')")
            portable = gate.OneShotSpec(
                **{
                    **base.__dict__,
                    "limits": gate.Limits(
                        wall_seconds=2,
                        stdout_cap_bytes=128,
                        stderr_cap_bytes=128,
                        job_memory_bytes=None,
                        active_process_limit=None,
                    ),
                }
            )
            verdict = gate.run_one_shot(
                portable, _adapter=gate._run_non_windows_job
            )
            self.assertEqual(verdict["status"], "success")
            self.assertEqual(verdict["child"]["adapter"], "subprocess-v1")
            self.assertEqual(
                verdict["child"]["support"]["job_memory"],
                "unsupported-not-requested",
            )
            portable_audit = gate.audit_attempt(root)
            self.assertEqual(
                portable_audit["state"],
                "complete",
                {
                    "audit": portable_audit,
                    "stream": verdict["streams"]["stdout"],
                    "raw_size": (root / gate.STDOUT_NAME).stat().st_size,
                },
            )

    @unittest.skipIf(os.name == "nt", "native POSIX process groups required")
    def test_posix_timeout_kills_grandchild_holding_pipes(self) -> None:
        grandchild = "import time;time.sleep(30)"
        code = (
            "import subprocess,sys,time\n"
            f"p=subprocess.Popen([sys.executable,'-c',{grandchild!r}])\n"
            "print(p.pid,flush=True)\n"
            "time.sleep(30)\n"
        )
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            verdict = gate.run_one_shot(
                make_spec(root, code, wall_seconds=0.15),
                _adapter=gate._run_non_windows_job,
            )
            self.assertEqual(verdict["classification"], "timeout")
            pid = int((root / gate.STDOUT_NAME).read_text().strip())
            with self.assertRaises(ProcessLookupError):
                os.kill(pid, 0)
            self.assertTrue(
                verdict["measurements"]["process_group_quiesced"]
            )
            self.assertEqual(
                verdict["measurements"]["process_group_kill_reason"], "timeout"
            )

    @unittest.skipIf(os.name == "nt", "native POSIX process groups required")
    def test_posix_output_cap_kills_grandchild_holding_pipes(self) -> None:
        grandchild = (
            "import sys,time;"
            "sys.stdout.buffer.write(b'Z'*8192);sys.stdout.flush();time.sleep(30)"
        )
        code = (
            "import subprocess,sys,time\n"
            f"p=subprocess.Popen([sys.executable,'-c',{grandchild!r}])\n"
            "print(p.pid,file=sys.stderr,flush=True)\n"
            "time.sleep(30)\n"
        )
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            verdict = gate.run_one_shot(
                make_spec(root, code, stdout_cap=41, stderr_cap=128),
                _adapter=gate._run_non_windows_job,
            )
            self.assertEqual(verdict["classification"], "output_limit")
            self.assertEqual((root / gate.STDOUT_NAME).read_bytes(), b"Z" * 41)
            pid = int((root / gate.STDERR_NAME).read_text().strip())
            with self.assertRaises(ProcessLookupError):
                os.kill(pid, 0)
            self.assertTrue(
                verdict["measurements"]["process_group_quiesced"]
            )
            self.assertEqual(
                verdict["measurements"]["process_group_kill_reason"],
                "output-cap",
            )

    @unittest.skipIf(os.name == "nt", "native POSIX process groups required")
    def test_posix_normal_root_exit_with_descendant_is_failure_and_cleanup(self) -> None:
        grandchild = "import time;time.sleep(30)"
        code = (
            "import subprocess,sys\n"
            f"p=subprocess.Popen([sys.executable,'-c',{grandchild!r}])\n"
            "print(p.pid,flush=True)\n"
        )
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            verdict = gate.run_one_shot(
                make_spec(root, code), _adapter=gate._run_non_windows_job
            )
            self.assertEqual(verdict["classification"], "infrastructure_error")
            self.assertTrue(
                verdict["measurements"]["surviving_descendant_detected"]
            )
            self.assertEqual(
                verdict["measurements"]["process_group_kill_reason"],
                "surviving-descendants",
            )
            pid = int((root / gate.STDOUT_NAME).read_text().strip())
            with self.assertRaises(ProcessLookupError):
                os.kill(pid, 0)
            self.assertEqual(gate.audit_attempt(root)["state"], "complete")

    def test_parent_crash_attempt_only_is_consumed_unknown_and_no_retry(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            spec = make_spec(root, "pass")
            prepared = gate.prepare_attempt(spec)
            self.assertFalse(prepared._executed)
            audit = gate.audit_attempt(root)
            self.assertTrue(audit["consumed"])
            self.assertEqual(audit["state"], "incomplete")
            self.assertEqual(audit["classification"], "unknown")
            with self.assertRaisesRegex(gate.ContractError, "retry/overwrite"):
                gate.prepare_attempt(spec)

    def test_result_schema_failure_keeps_raw_and_unique_verdict(self) -> None:
        def reject(_outcome) -> None:
            raise gate.ResultSchemaError("synthetic result schema mismatch")

        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            spec = make_spec(
                root,
                "import sys;sys.stdout.buffer.write(b'schema-out\\n');"
                "sys.stderr.buffer.write(b'schema-err\\n')",
            )
            verdict = gate.run_one_shot(spec, result_validator=reject)
            self.assertEqual(verdict["classification"], "schema_error")
            self.assertEqual((root / gate.STDOUT_NAME).read_bytes(), b"schema-out\n")
            self.assertEqual((root / gate.STDERR_NAME).read_bytes(), b"schema-err\n")
            self.assertEqual(gate.audit_attempt(root)["state"], "complete")

    def test_recovery_rejects_missing_and_tampered_raw(self) -> None:
        for mutation in ("missing", "tampered"):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as temp:
                root = Path(temp) / "attempt"
                root.mkdir()
                gate.run_one_shot(make_spec(root, "print('ok')"))
                stderr = root / gate.STDERR_NAME
                if mutation == "missing":
                    stderr.unlink()
                else:
                    stderr.write_bytes(stderr.read_bytes() + b"tamper")
                audit = gate.audit_attempt(root)
                self.assertTrue(audit["consumed"])
                self.assertEqual(audit["state"], "incomplete")
                self.assertEqual(audit["classification"], "unknown")

    def test_recovery_rejects_verdict_classification_tamper(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            gate.run_one_shot(make_spec(root, "print('ok')"))
            verdict_path = root / gate.VERDICT_NAME
            verdict = json.loads(verdict_path.read_text(encoding="utf-8"))
            verdict["status"] = "failure"
            verdict["classification"] = "child_nonzero"
            verdict["error"] = "forged"
            verdict_path.write_text(
                json.dumps(verdict, indent=2, sort_keys=True) + "\n",
                encoding="utf-8",
            )
            audit = gate.audit_attempt(root)
            self.assertEqual(audit["state"], "incomplete")
            self.assertEqual(audit["classification"], "unknown")
            self.assertTrue(
                any("contradicts child facts" in error for error in audit["errors"])
            )

    def test_archive_round_trip_verifies_count_size_and_hash_without_cleanup(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            root = base / "attempt"
            root.mkdir()
            gate.run_one_shot(make_spec(root, "print('archive')"))
            before = {
                path.name: (path.stat().st_size, hashlib.sha256(path.read_bytes()).hexdigest())
                for path in root.iterdir()
            }
            archive = base / "evidence.tar"
            manifest = gate.create_archive(root, archive)
            self.assertEqual(manifest["file_count"], 4)
            self.assertEqual(gate.verify_archive(archive), manifest)
            self.assertEqual(gate.audit_attempt(root)["status"], "success")
            with self.assertRaisesRegex(gate.ContractError, "cannot create exclusive"):
                gate.create_archive(root, archive)
            after = {
                path.name: (path.stat().st_size, hashlib.sha256(path.read_bytes()).hexdigest())
                for path in root.iterdir()
            }
            self.assertEqual(after, before)

    def test_secret_env_and_unsupported_non_windows_caps_fail_before_attempt(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "secret"
            root.mkdir()
            spec = make_spec(root, "pass")
            secret_env = dict(spec.env)
            secret_env["API_TOKEN"] = "not-recordable"
            bad = gate.OneShotSpec(
                **{
                    **spec.__dict__,
                    "env": secret_env,
                    "reviewed_env": tuple(sorted(secret_env.items())),
                }
            )
            with self.assertRaisesRegex(gate.ContractError, "secret-like"):
                gate.prepare_attempt(bad)
            self.assertEqual(list(root.iterdir()), [])

            non_windows_root = Path(temp) / "non-windows"
            non_windows_root.mkdir()
            non_windows_spec = make_spec(non_windows_root, "pass", memory=64 * MIB)
            with mock.patch.object(gate.os, "name", "posix"):
                with self.assertRaisesRegex(gate.ContractError, "cannot prove"):
                    gate.prepare_attempt(non_windows_spec)
            self.assertEqual(list(non_windows_root.iterdir()), [])

    def test_mutating_allowed_env_value_after_spec_creation_fails_before_attempt(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "attempt"
            root.mkdir()
            spec = make_spec(root, "pass")
            self.assertIsInstance(spec.env, dict)
            spec.env["PATH"] = spec.env["PATH"] + os.pathsep + "unreviewed"
            with self.assertRaisesRegex(gate.ContractError, "exact reviewed env values"):
                gate.prepare_attempt(spec)
            self.assertEqual(list(root.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
