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
from windows_job import preflight_job_support, run_in_job


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


@unittest.skipUnless(os.name == "nt", "Windows Job Object tests require Windows")
class WindowsJobTests(unittest.TestCase):
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
