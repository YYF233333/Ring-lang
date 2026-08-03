from __future__ import annotations

import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import run as harness
import windows_job
from windows_job import (
    current_process_handle_count,
    preflight_job_support,
    run_in_job,
)


class ManifestAndPolicyTests(unittest.TestCase):
    def test_manifest_and_schema_self_validate(self) -> None:
        manifest = harness._load_json(harness.DEFAULT_MANIFEST)
        schema = harness._load_json(harness.DEFAULT_RESULT_SCHEMA)
        harness.validate_manifest(manifest)
        harness.validate_schema_definition(schema)
        lanes = harness.expand_lanes(manifest)
        self.assertEqual(len(lanes), len(manifest["lanes"]) * 2)
        self.assertEqual(len({lane["case_id"] for lane in lanes}), len(lanes))
        self.assertTrue(any(lane["case_id"] == "full_gate_cold" for lane in lanes))
        self.assertTrue(any(lane["case_id"] == "full_gate_warm" for lane in lanes))

    def test_result_schema_rejects_unknown_root_field(self) -> None:
        schema = harness._load_json(harness.DEFAULT_RESULT_SCHEMA)
        with self.assertRaises(harness.HarnessError):
            harness.validate_json({"unexpected": True}, schema)

    def test_empirical_p95_only_exists_for_twenty_one_values(self) -> None:
        self.assertIn("empirical_p95", harness._metric_stats(list(range(21))))
        self.assertNotIn("empirical_p95", harness._metric_stats(list(range(5))))

    def _fake_record(self, *, included: bool, warmup: bool, wall_ns: int) -> dict:
        record = {
            "included": included,
            "invalid_reason": "warmup" if warmup else (None if included else "invalid"),
            "wall_ns": wall_ns,
            "cpu_user_ns": 1,
            "cpu_kernel_ns": 1,
            "peak_root_rss_bytes": 1,
            "sampled_peak_tree_rss_bytes": 1,
            "max_worker_peak_rss_bytes": 1,
            "peak_job_commit_bytes": 1,
            "rss_complete": True,
            "measurement_errors": [],
            "runner_runtime": {"errors": []},
        }
        return record

    def _exercise_policy(self, policy: str, wall_ns: int, valid: bool = True) -> dict:
        lane = {"case_id": "policy_probe_warm", "policy": policy}

        def fake_execute(**kwargs: object) -> dict:
            warmup = bool(kwargs["is_warmup"])
            return self._fake_record(
                included=valid and not warmup,
                warmup=warmup,
                wall_ns=wall_ns,
            )

        with (
            mock.patch.object(harness, "execute_invocation", side_effect=fake_execute),
            mock.patch.object(harness, "validate_json"),
        ):
            _records, summary = harness.run_lane(
                lane=lane,
                run_id="run",
                run_dir=Path("."),
                environment={},
                manifest_sha="0" * 64,
                result_schema={},
                tools={},
                thinlto_cache=Path("."),
                jsonl_stream=io.StringIO(),
            )
        return summary

    def test_direct_policy_retains_one_warmup_then_twenty_one(self) -> None:
        summary = self._exercise_policy("direct_short", wall_ns=1)
        self.assertEqual(summary["target_valid_samples"], 21)
        self.assertEqual(summary["valid_samples"], 21)
        self.assertEqual(summary["attempts"], 22)

    def test_adaptive_policy_uses_three_for_long_first_valid(self) -> None:
        summary = self._exercise_policy(
            "adaptive", wall_ns=harness.LONG_LANE_THRESHOLD_NS
        )
        self.assertEqual(summary["target_valid_samples"], 3)
        self.assertEqual(summary["attempts"], 3)

    def test_adaptive_policy_stops_after_target_plus_two_invalid_attempts(self) -> None:
        summary = self._exercise_policy("adaptive", wall_ns=1, valid=False)
        self.assertEqual(summary["target_valid_samples"], 5)
        self.assertEqual(summary["attempts"], 7)
        self.assertFalse(summary["complete"])

    def test_incomplete_rss_is_invalid_and_explicit_in_summary(self) -> None:
        measurement = harness._empty_metrics()
        measurement.update(
            {
                "exit_code": 0,
                "wall_ns": 1,
                "cpu_user_ns": 1,
                "cpu_kernel_ns": 1,
                "peak_root_rss_bytes": 1,
                "peak_job_commit_bytes": 1,
                "sampled_peak_tree_rss_bytes": 1,
                "process_count": {"total": 1},
                "job_io": {},
                "rss_complete": False,
            }
        )
        reason = harness._invalid_reason(
            is_warmup=False,
            measurement=measurement,
            measurement_error=None,
            expected_exit_codes=[0],
            runner_expected=False,
            runner_summary=None,
            artifacts=[],
            phase_errors=[],
            runtime_errors=[],
        )
        self.assertEqual(reason, "rss_incomplete")
        record = self._fake_record(included=False, warmup=False, wall_ns=1)
        record["rss_complete"] = False
        record["sampled_peak_tree_rss_bytes"] = 7
        record["measurement_errors"] = ["missed worker"]
        summary = harness.summarize_lane(
            {"case_id": "quality", "policy": "adaptive"}, [record], 1
        )
        self.assertEqual(summary["resource_quality"]["rss_incomplete_samples"], 1)
        self.assertEqual(summary["resource_quality"]["measurement_error_samples"], 1)
        self.assertEqual(
            summary["resource_quality"]["rss_lower_bound"]["median"], 7
        )

    def test_runner_runtime_isolation_restores_ignored_root_object(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            repo = Path(temp)
            source = repo / "ring_runtime.cpp"
            root_object = repo / "ring_runtime.o"
            prepared = repo / "prepared.o"
            source.write_text("runtime", encoding="utf-8")
            root_object.write_bytes(b"original")
            prepared.write_bytes(b"prepared")
            setup = {
                "mode": "warm",
                "root_path": str(root_object),
                "source_sha256": harness._sha256_file(source),
                "flags": ["-O2"],
                "original_root": harness._optional_file_state(root_object),
                "prepared": {
                    **harness._optional_file_state(prepared),
                    "path": str(prepared),
                },
            }
            lane = {"isolate_runner_runtime": True}
            sample = repo / "sample"
            sample.mkdir()
            with mock.patch.object(harness, "REPO_ROOT", repo):
                record, transaction = harness._begin_runner_runtime_isolation(
                    lane, setup, sample
                )
                self.assertEqual(root_object.read_bytes(), b"prepared")
                harness._finish_runner_runtime_isolation(record, setup, transaction)
            self.assertEqual(root_object.read_bytes(), b"original")
            self.assertTrue(record["restored"])
            self.assertEqual(record["errors"], [])

    def _runtime_transaction_fixture(
        self, repo: Path
    ) -> tuple[Path, dict, dict, Path]:
        source = repo / "ring_runtime.cpp"
        root_object = repo / "ring_runtime.o"
        prepared = repo / "prepared.o"
        source.write_text("runtime", encoding="utf-8")
        root_object.write_bytes(b"original")
        prepared.write_bytes(b"prepared")
        setup = {
            "mode": "warm",
            "root_path": str(root_object),
            "source_sha256": harness._sha256_file(source),
            "flags": ["-O2"],
            "original_root": harness._optional_file_state(root_object),
            "prepared": {
                **harness._optional_file_state(prepared),
                "path": str(prepared),
            },
        }
        sample = repo / "sample"
        sample.mkdir()
        return root_object, setup, {"isolate_runner_runtime": True}, sample

    def test_runtime_backup_failure_keeps_unique_root_untouched(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            repo = Path(temp)
            root, setup, lane, sample = self._runtime_transaction_fixture(repo)
            real_replace = os.replace

            def fail_backup(source: object, destination: object) -> None:
                if Path(source) == root and ".backup.o" in str(destination):
                    raise OSError("injected backup failure")
                real_replace(source, destination)

            with (
                mock.patch.object(harness, "REPO_ROOT", repo),
                mock.patch.object(harness.os, "replace", side_effect=fail_backup),
                self.assertRaises(harness.HarnessError),
            ):
                harness._begin_runner_runtime_isolation(lane, setup, sample)
            self.assertEqual(root.read_bytes(), b"original")
            self.assertEqual(list(repo.glob("ring_runtime.b176-*.backup.o")), [])
            self.assertEqual(list(repo.glob("ring_runtime.b176-*.install.o")), [])

    def test_runtime_install_failure_restores_atomic_backup(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            repo = Path(temp)
            root, setup, lane, sample = self._runtime_transaction_fixture(repo)
            real_replace = os.replace

            def fail_install(source: object, destination: object) -> None:
                if ".install.o" in str(source) and Path(destination) == root:
                    raise OSError("injected install failure")
                real_replace(source, destination)

            with (
                mock.patch.object(harness, "REPO_ROOT", repo),
                mock.patch.object(harness.os, "replace", side_effect=fail_install),
                self.assertRaises(harness.HarnessError),
            ):
                harness._begin_runner_runtime_isolation(lane, setup, sample)
            self.assertEqual(root.read_bytes(), b"original")
            self.assertEqual(list(repo.glob("ring_runtime.b176-*.backup.o")), [])
            self.assertEqual(list(repo.glob("ring_runtime.b176-*.install.o")), [])

    def test_runtime_cleanup_failure_does_not_skip_original_restore(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            repo = Path(temp)
            root, setup, lane, sample = self._runtime_transaction_fixture(repo)
            with mock.patch.object(harness, "REPO_ROOT", repo):
                record, transaction = harness._begin_runner_runtime_isolation(
                    lane, setup, sample
                )
                staging = Path(transaction["staging"])
                staging.write_bytes(b"stale-install")
                real_unlink = Path.unlink

                def fail_staging(path: Path, *args: object, **kwargs: object) -> None:
                    if path == staging:
                        raise OSError("injected cleanup failure")
                    real_unlink(path, *args, **kwargs)

                with mock.patch.object(Path, "unlink", new=fail_staging):
                    harness._finish_runner_runtime_isolation(
                        record, setup, transaction
                    )
            self.assertEqual(root.read_bytes(), b"original")
            self.assertTrue(record["restored"])
            self.assertFalse(record["backup_exists_after"])
            self.assertTrue(record["staging_exists_after"])
            self.assertTrue(any("staging cleanup failed" in e for e in record["errors"]))
            staging.unlink()

    def test_runtime_restore_failure_retains_backup_as_unique_original(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            repo = Path(temp)
            root, setup, lane, sample = self._runtime_transaction_fixture(repo)
            with mock.patch.object(harness, "REPO_ROOT", repo):
                record, transaction = harness._begin_runner_runtime_isolation(
                    lane, setup, sample
                )
                backup = Path(transaction["backup"])
                real_replace = os.replace

                def fail_restore(source: object, destination: object) -> None:
                    if Path(source) == backup and Path(destination) == root:
                        raise OSError("injected restore failure")
                    real_replace(source, destination)

                with mock.patch.object(
                    harness.os, "replace", side_effect=fail_restore
                ):
                    harness._finish_runner_runtime_isolation(
                        record, setup, transaction
                    )
            self.assertEqual(root.read_bytes(), b"prepared")
            self.assertEqual(backup.read_bytes(), b"original")
            self.assertFalse(record["restored"])
            self.assertTrue(record["backup_exists_after"])
            self.assertTrue(any("restore failed" in e for e in record["errors"]))
            os.replace(backup, root)
            self.assertEqual(root.read_bytes(), b"original")


@unittest.skipUnless(os.name == "nt", "Windows Job Object tests require Windows")
class WindowsJobTests(unittest.TestCase):
    def test_preflight_and_invocations_do_not_leak_job_handles(self) -> None:
        evidence = preflight_job_support()
        self.assertEqual(evidence["handle_count_before"], evidence["handle_count_after"])
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            # CPython initializes two process-global synchronization handles on
            # its first low-level CreateProcess call.  Warm that one-time state,
            # then require steady-state handle equality.
            run_in_job(
                [sys.executable, "-c", "pass"],
                cwd=Path.cwd(),
                env=os.environ,
                stdout_path=root / "warmup-stdout.txt",
                stderr_path=root / "warmup-stderr.txt",
                timeout_seconds=5,
            )
            before = current_process_handle_count()
            with mock.patch.object(
                windows_job, "_new_job", wraps=windows_job._new_job
            ) as new_job:
                result = run_in_job(
                    [sys.executable, "-c", "pass"],
                    cwd=Path.cwd(),
                    env=os.environ,
                    stdout_path=root / "stdout.txt",
                    stderr_path=root / "stderr.txt",
                    timeout_seconds=5,
                )
            self.assertEqual(result["exit_code"], 0)
            self.assertEqual(new_job.call_count, 1)
            self.assertIsNone(result["max_worker_peak_rss_bytes"])
            self.assertEqual(current_process_handle_count(), before)

    def test_process_tree_metrics_and_separate_streams(self) -> None:
        preflight_job_support()
        child_code = (
            "import subprocess,sys; "
            "print('root-out'); print('root-err', file=sys.stderr); "
            "p=subprocess.Popen([sys.executable,'-c',"
            "\"import sys,time; print('child-out'); "
            "print('child-err',file=sys.stderr); time.sleep(0.08)\"]); p.wait()"
        )
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            stdout = root / "stdout.txt"
            stderr = root / "stderr.txt"
            result = run_in_job(
                [sys.executable, "-c", child_code],
                cwd=Path.cwd(),
                env=os.environ,
                stdout_path=stdout,
                stderr_path=stderr,
                timeout_seconds=5,
            )
            self.assertEqual(result["exit_code"], 0)
            self.assertGreaterEqual(result["process_count"]["total"], 2)
            self.assertGreaterEqual(result["rss_observed_process_count"], 2)
            self.assertTrue(result["rss_complete"])
            self.assertGreater(result["peak_job_commit_bytes"], 0)
            self.assertGreater(result["peak_root_rss_bytes"], 0)
            self.assertGreater(result["sampled_peak_tree_rss_bytes"], 0)
            self.assertGreater(result["max_worker_peak_rss_bytes"], 0)
            self.assertIn("root-out", stdout.read_text(encoding="utf-8"))
            self.assertIn("child-out", stdout.read_text(encoding="utf-8"))
            self.assertIn("root-err", stderr.read_text(encoding="utf-8"))
            self.assertIn("child-err", stderr.read_text(encoding="utf-8"))

    def test_timeout_terminates_the_job(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            result = run_in_job(
                [sys.executable, "-c", "import time; time.sleep(2)"],
                cwd=Path.cwd(),
                env=os.environ,
                stdout_path=root / "stdout.txt",
                stderr_path=root / "stderr.txt",
                timeout_seconds=0.05,
            )
            self.assertTrue(result["timed_out"])
            self.assertNotEqual(result["exit_code"], 0)


if __name__ == "__main__":
    unittest.main()
