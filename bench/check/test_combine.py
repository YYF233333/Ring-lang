from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import combine
import run as harness


class StrictCombineTests(unittest.TestCase):
    def _compiler_rows(self) -> list[dict]:
        durations = {
            "input_entry_load": 10,
            "entry_parse": 20,
            "project_module_load_parse": 0,
            "type_effect_check_lower": 30,
            "resource_plan_verify": 0,
            "command_total": 100,
        }
        entry = str((harness.REPO_ROOT / "tests" / "cases" / "hello.ring").resolve())
        return [
            {
                "schema": harness.COMPILER_PHASE_SCHEMA,
                "schema_version": 1,
                "lane": "fixture_cold",
                "phase": phase,
                "duration_ns": durations[phase],
                "unit": "ns",
                "compiler_identity": "sha256:" + "d" * 64,
                "source_identity": "git:" + "a" * 40,
                "entry_file": entry,
                "executed": phase not in {
                    "project_module_load_parse",
                    "resource_plan_verify",
                },
                "complete": True,
                "command_success": True,
            }
            for phase in harness.COMPILER_PHASE_ORDER
        ]

    def _manifest(self) -> dict:
        return {
            "schema": harness.MANIFEST_SCHEMA,
            "description": "combine fixture",
            "fingerprint_flags": {
                "compiler": ["-O3"],
                "runtime": ["-O3"],
                "runner_runtime": ["-O2"],
                "link": ["-flto=thin"],
            },
            "lanes": [
                {
                    "case_id": "fixture",
                    "description": "fixture",
                    "policy": "full_gate",
                    "cache_states": ["cold", "warm"],
                    "argv": ["{ring}", "check", "{repo}/fixture.ring"],
                    "cwd": "{repo}",
                    "timeout_seconds": 10,
                    "expected_exit_codes": [0],
                    "requires": ["tool:ring"],
                    "runner_summary": False,
                    "artifacts": [],
                    "phase_trace_paths": [],
                }
            ],
        }

    def _schema(self, keys: set[str]) -> dict:
        return {
            "$id": harness.RESULT_SCHEMA,
            "type": "object",
            "additionalProperties": False,
            "required": sorted(keys),
            "properties": {key: {} for key in keys},
        }

    def _record(
        self,
        *,
        run_id: str,
        case_id: str,
        state: str,
        index: int,
        source_sha: str,
        manifest_sha: str,
    ) -> dict:
        return {
            "run_id": run_id,
            "sample_id": f"{run_id}-{index}",
            "case_id": case_id,
            "index": index,
            "included": True,
            "source_sha": source_sha,
            "manifest_sha": manifest_sha,
            "cache": {
                "thinlto_cache": state,
                "output": "fresh",
                "os_file_cache": "uncontrolled",
            },
            "wall_ns": 100 + index,
            "cpu_user_ns": 10,
            "cpu_kernel_ns": 5,
            "peak_root_rss_bytes": 1000,
            "sampled_peak_tree_rss_bytes": 1000,
            "max_worker_peak_rss_bytes": None,
            "peak_job_commit_bytes": 2000,
            "rss_complete": True,
            "measurement_errors": [],
            "runner_runtime": {"errors": []},
            "phase_traces": [],
            "invalid_reason": None,
        }

    def _write_run(
        self,
        root: Path,
        *,
        state: str,
        run_id: str,
        source_sha: str = "a" * 40,
    ) -> Path:
        run_dir = root / run_id
        run_dir.mkdir()
        manifest = self._manifest()
        manifest_path = run_dir / "manifest.snapshot.json"
        harness._json_dump(manifest_path, manifest)
        manifest_sha = harness._sha256_file(manifest_path)
        case_id = f"fixture_{state}"
        records = [
            self._record(
                run_id=run_id,
                case_id=case_id,
                state=state,
                index=index,
                source_sha=source_sha,
                manifest_sha=manifest_sha,
            )
            for index in range(3)
        ]
        schema = self._schema(set(records[0]))
        harness._json_dump(run_dir / "result.schema.json", schema)
        samples_path = run_dir / "samples.jsonl"
        samples_path.write_text(
            "".join(harness._json_line(record) + "\n" for record in records),
            encoding="utf-8",
        )
        lane_summary = harness.summarize_lane(
            {"case_id": case_id, "policy": "full_gate"}, records, 3
        )
        summary = {
            "schema": harness.SUMMARY_SCHEMA,
            "run_id": run_id,
            "source_sha": source_sha,
            "manifest_sha": manifest_sha,
            "samples_jsonl": harness._file_record(samples_path),
            "lanes": [lane_summary],
            "complete": True,
        }
        harness._json_dump(run_dir / "summary.json", summary)
        environment = {
            "schema": harness.ENVIRONMENT_SCHEMA,
            "run_id": run_id,
            "source_sha": source_sha,
            "git_dirty": False,
            "manifest_sha": manifest_sha,
            "dist_c_sha256": "b" * 64,
            "runtime_sha256": "c" * 64,
            "tools": {
                "ring": {"path": "ring.exe", "version": "v", "sha256": "d" * 64}
            },
            "flags": manifest["fingerprint_flags"],
            "os": {"system": "Windows", "release": "fixture", "version": "1", "machine": "AMD64"},
            "cpu": {"model": "fixture cpu", "logical_cores": 8},
            "memory_bytes": 16 * 1024 * 1024 * 1024,
            "power": {
                "active_scheme": "fixture scheme",
                "ac_line_status": 1,
                "battery_flag": 0,
                "battery_life_percent": 50,
            },
        }
        harness._json_dump(run_dir / "environment.json", environment)
        return run_dir

    def test_combines_complete_cold_and_warm_batches(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            warm = self._write_run(root, state="warm", run_id="warm-run")
            output = root / "combined"
            summary = combine.combine_runs([cold, warm], output)
            self.assertTrue(summary["complete"])
            self.assertEqual(summary["coverage"]["actual_lane_count"], 2)
            self.assertEqual(summary["cache_states"]["cold"]["included_samples"], 3)
            self.assertEqual(summary["cache_states"]["warm"]["included_samples"], 3)
            self.assertEqual(
                len((output / "combined-samples.jsonl").read_text().splitlines()), 6
            )
            self.assertTrue((output / "combined-summary.json").is_file())

    def test_phase_timing_control_reports_median_mad_and_p95_delta(self) -> None:
        def lane(wall: dict) -> dict:
            return {"summary": {"metrics": {"wall_ns": wall}}}

        timed = {"median": 110, "mad": 4, "empirical_p95": 140}
        control = {"median": 100, "mad": 3, "empirical_p95": 125}
        origins = {
            f"tiny_hello_check_{state}": lane(timed)
            for state in ("cold", "warm")
        }
        origins.update(
            {
                f"tiny_hello_check_no_phase_{state}": lane(control)
                for state in ("cold", "warm")
            }
        )
        comparison = combine._phase_timing_control_comparison(origins)
        self.assertEqual(
            comparison["cold"]["delta_ns"],
            {"median": 10, "mad": 1, "empirical_p95": 15},
        )

    def test_revalidates_embedded_compiler_phase_trace(self) -> None:
        rows = self._compiler_rows()
        record = {
            "sample_id": "fixture",
            "wall_ns": 150,
            "exit": {"code": 0},
            "phase_traces": [
                {"path": "trace.jsonl", "line": index, "value": row}
                for index, row in enumerate(rows, 1)
            ],
        }
        lane = {
            "case_id": "fixture_cold",
            "compiler_phase_timing": True,
            "phase_trace_paths": ["{sample_dir}/trace.jsonl"],
        }
        environment = {
            "source_sha": "a" * 40,
            "tools": {"ring": {"sha256": "d" * 64}},
        }
        combine._validate_embedded_phase_timing(record, lane, environment)
        rows[0]["compiler_identity"] = "sha256:" + "e" * 64
        with self.assertRaisesRegex(harness.HarnessError, "compiler identity mismatch"):
            combine._validate_embedded_phase_timing(record, lane, environment)

    def test_rejects_lane_records_after_target_is_reached(self) -> None:
        records = [
            {"index": index, "included": included, "invalid_reason": reason}
            for index, included, reason in (
                (0, True, None),
                (1, True, None),
                (2, True, None),
                (3, False, "late invalid"),
            )
        ]
        with self.assertRaisesRegex(harness.HarnessError, "continued after"):
            combine._validate_lane_schedule("full_gate", records, 3, "fixture_cold")

    def test_rejects_incomplete_run(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            summary_path = cold / "summary.json"
            summary = json.loads(summary_path.read_text(encoding="utf-8"))
            summary["complete"] = False
            harness._json_dump(summary_path, summary)
            with self.assertRaisesRegex(harness.HarnessError, "incomplete"):
                combine.combine_runs([cold], root / "combined")

    def test_rejects_identity_drift(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            warm = self._write_run(
                root, state="warm", run_id="warm-run", source_sha="e" * 40
            )
            with self.assertRaisesRegex(harness.HarnessError, "identity/toolchain drift"):
                combine.combine_runs([cold, warm], root / "combined")

    def test_rejects_machine_identity_drift(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            warm = self._write_run(root, state="warm", run_id="warm-run")
            environment_path = warm / "environment.json"
            environment = json.loads(environment_path.read_text(encoding="utf-8"))
            environment["cpu"]["logical_cores"] = 16
            harness._json_dump(environment_path, environment)
            with self.assertRaisesRegex(harness.HarnessError, "identity/toolchain drift"):
                combine.combine_runs([cold, warm], root / "combined")

    def test_rejects_incomplete_machine_identity(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            environment_path = cold / "environment.json"
            environment = json.loads(environment_path.read_text(encoding="utf-8"))
            environment["power"]["active_scheme"] = None
            harness._json_dump(environment_path, environment)
            with self.assertRaisesRegex(harness.HarnessError, "machine identity is incomplete"):
                combine.combine_runs([cold], root / "combined")

    def test_rejects_environment_flags_that_differ_from_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            environment_path = cold / "environment.json"
            environment = json.loads(environment_path.read_text(encoding="utf-8"))
            environment["flags"]["compiler"] = ["-O0"]
            harness._json_dump(environment_path, environment)
            with self.assertRaisesRegex(harness.HarnessError, "flags differ"):
                combine.combine_runs([cold], root / "combined")

    def test_rejects_raw_cache_misclassification(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            warm = self._write_run(root, state="warm", run_id="warm-run")
            samples_path = warm / "samples.jsonl"
            rows = [json.loads(line) for line in samples_path.read_text().splitlines()]
            rows[0]["cache"]["thinlto_cache"] = "cold"
            samples_path.write_text(
                "".join(harness._json_line(row) + "\n" for row in rows),
                encoding="utf-8",
            )
            summary_path = warm / "summary.json"
            summary = json.loads(summary_path.read_text(encoding="utf-8"))
            summary["samples_jsonl"] = harness._file_record(samples_path)
            harness._json_dump(summary_path, summary)
            with self.assertRaisesRegex(harness.HarnessError, "cache classification"):
                combine.combine_runs([cold, warm], root / "combined")

    def test_rejects_duplicate_lane_across_runs(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            first = self._write_run(root, state="cold", run_id="cold-one")
            second = self._write_run(root, state="cold", run_id="cold-two")
            with self.assertRaisesRegex(harness.HarnessError, "duplicate lane"):
                combine.combine_runs([first, second], root / "combined")

    def test_rejects_missing_cold_warm_coverage(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            with self.assertRaisesRegex(harness.HarnessError, "coverage mismatch"):
                combine.combine_runs([cold], root / "combined")


if __name__ == "__main__":
    unittest.main()
