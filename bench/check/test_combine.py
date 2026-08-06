from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import combine
import run as harness


def phase_errors(classified: harness.PhaseValidation) -> list[str]:
    return [*classified.hard_errors, *classified.eligibility_errors]


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
                    "runner_summary": None,
                    "artifacts": ["{sample_dir}/artifact.bin"],
                    "phase_trace_paths": [],
                }
            ],
        }

    def _schema(self, _keys: set[str]) -> dict:
        return harness._load_json(harness.DEFAULT_RESULT_SCHEMA)

    def _seed_receipt(
        self, root: Path, source_sha: str, manifest: dict
    ) -> dict:
        cache = (root / "thinlto-cache").resolve()
        cache.mkdir(exist_ok=True)
        seed_file = cache / "seed.bin"
        if not seed_file.exists():
            seed_file.write_bytes(b"seed")
        tools = {
            name: {
                "path": str((root / f"{name}.exe").resolve()),
                "version": "fixture",
                "sha256": character * 64,
            }
            for name, character in (
                ("python", "1"), ("clang", "2"), ("clangxx", "3")
            )
        }
        return {
            "schema": harness.WARM_CACHE_RECEIPT_SCHEMA,
            "recipe_version": 1,
            "source": {
                "git_sha": source_sha,
                "git_dirty": False,
                "dist_c": {"path": str((root / "dist-c").resolve()), "sha256": "b" * 64, "bytes": 1},
                "runtime": {"path": str((root / "runtime").resolve()), "sha256": "c" * 64, "bytes": 1},
                "bootstrap": {"path": str((root / "bootstrap").resolve()), "sha256": "e" * 64, "bytes": 1},
            },
            "tools": tools,
            "flags": {
                name: manifest["fingerprint_flags"][name]
                for name in ("compiler", "runtime", "link")
            },
            "cache_path": str(cache),
            "seed_invocation": {
                "argv": ["fixture-seed"],
                "cwd": str(root.resolve()),
                "timeout_seconds": harness.WARM_CACHE_SEED_TIMEOUT_SECONDS,
            },
            "outcome": {
                "exit_code": 0,
                "stdout": {"sha256": "4" * 64, "bytes": 0},
                "stderr": {"sha256": "5" * 64, "bytes": 0},
            },
            "cache_inventory": harness._cache_inventory(cache),
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
        run_dir: Path,
    ) -> dict:
        sample_id = f"{case_id}-{index:03d}-{index:08x}"
        sample_dir = (run_dir / "samples" / case_id / sample_id).resolve()
        sample_dir.mkdir(parents=True)
        stdout_path = sample_dir / "stdout.txt"
        stderr_path = sample_dir / "stderr.txt"
        artifact_path = sample_dir / "artifact.bin"
        stdout_path.write_bytes(b"")
        stderr_path.write_bytes(b"")
        artifact_path.write_bytes(b"artifact")
        return {
            "schema": harness.RESULT_SCHEMA,
            "run_id": run_id,
            "sample_id": sample_id,
            "sample_dir": str(sample_dir),
            "case_id": case_id,
            "index": index,
            "included": True,
            "source_sha": source_sha,
            "manifest_sha": manifest_sha,
            "argv": ["ring.exe", "check", f"{harness.REPO_ROOT}/fixture.ring"],
            "cwd": str(harness.REPO_ROOT.resolve()),
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
            "root_pid": 1,
            "rss_poll_ms": harness.RSS_POLL_MS,
            "rss_samples_observed": 1,
            "rss_covered_ns": 100 + index,
            "rss_coverage_ratio": 1.0,
            "rss_observed_process_count": 1,
            "rss_job_total_processes": 1,
            "rss_complete": True,
            "process_count": {
                "total": 1,
                "active_at_query": 0,
                "terminated": 1,
            },
            "job_io": {
                "read_operations": 0,
                "write_operations": 0,
                "other_operations": 0,
                "read_bytes": 0,
                "write_bytes": 0,
                "other_bytes": 0,
            },
            "timed_out": False,
            "measurement_errors": [],
            "runner_runtime": {
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
            },
            "exit": {"code": 0, "expected": True},
            "stdout": harness._file_record(stdout_path),
            "stderr": harness._file_record(stderr_path),
            "runner_summary": None,
            "artifacts": harness._artifact_records([artifact_path]),
            "phase_traces": [],
            "invocation_error": None,
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
                run_dir=run_dir,
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
                "ring": {"path": "ring.exe", "version": "v", "sha256": "d" * 64},
                **self._seed_receipt(root, source_sha, manifest)["tools"],
            },
            "flags": manifest["fingerprint_flags"],
            "cache_state": state,
            "thinlto_cache_path": str((root / "thinlto-cache").resolve()),
            "thinlto_cache_inventory": self._seed_receipt(
                root, source_sha, manifest
            )["cache_inventory"],
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
        receipt = self._seed_receipt(root, source_sha, manifest)
        receipt_path = run_dir / "warm-cache-seed-receipt.json"
        harness._json_dump(receipt_path, receipt)
        environment["warm_cache_seed"] = {
            "identity": receipt,
            "receipt": harness._file_record(receipt_path),
        }
        harness._json_dump(run_dir / "environment.json", environment)
        return run_dir

    def _rewrite_samples_and_summary(
        self, run_dir: Path, mutate
    ) -> None:
        samples_path = run_dir / "samples.jsonl"
        records = [
            json.loads(line)
            for line in samples_path.read_text(encoding="utf-8").splitlines()
        ]
        mutate(records)
        samples_path.write_text(
            "".join(harness._json_line(record) + "\n" for record in records),
            encoding="utf-8",
        )
        summary_path = run_dir / "summary.json"
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
        lane_summary = summary["lanes"][0]
        summary["lanes"] = [
            harness.summarize_lane(
                {
                    "case_id": lane_summary["case_id"],
                    "policy": lane_summary["policy"],
                },
                records,
                lane_summary["target_valid_samples"],
            )
        ]
        summary["samples_jsonl"] = harness._file_record(samples_path)
        harness._json_dump(summary_path, summary)

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

    def test_unpaired_descriptive_control_reports_median_mad_and_p95_delta(self) -> None:
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
        comparison = combine._unpaired_descriptive_control(origins)
        self.assertEqual(
            comparison["cold"]["delta_ns"],
            {"median": 10, "mad": 1, "empirical_p95": 15},
        )

    def test_revalidates_wrapped_compiler_phase_trace(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            sample_dir = Path(temp).resolve()
            path = sample_dir / "trace.jsonl"
            rows = self._compiler_rows()
            wrappers = [
                {
                    "path": str(path),
                    "line": index,
                    "value": row,
                    "read_error": None,
                }
                for index, row in enumerate(rows, 1)
            ]
            lane = {
                "case_id": "fixture_cold",
                "compiler_phase_timing": True,
                "expected_executed_phases": [
                    "input_entry_load",
                    "entry_parse",
                    "type_effect_check_lower",
                    "command_total",
                ],
                "phase_trace_paths": ["{sample_dir}/trace.jsonl"],
            }
            environment = {
                "source_sha": "a" * 40,
                "tools": {"ring": {"sha256": "d" * 64}},
            }
            errors = phase_errors(harness._classify_phase_trace_records(
                wrappers,
                paths=[path],
                sample_dir=sample_dir,
                lane=lane,
                environment=environment,
                expected_entry_file=str(
                    (harness.REPO_ROOT / "tests" / "cases" / "hello.ring").resolve()
                ),
                exit_code=0,
                wall_ns=150,
            ))
            self.assertEqual(errors, [])
            rows[0]["compiler_identity"] = "sha256:" + "e" * 64
            errors = phase_errors(harness._classify_phase_trace_records(
                wrappers,
                paths=[path],
                sample_dir=sample_dir,
                lane=lane,
                environment=environment,
                expected_entry_file=str(
                    (harness.REPO_ROOT / "tests" / "cases" / "hello.ring").resolve()
                ),
                exit_code=0,
                wall_ns=150,
            ))
            self.assertTrue(any("compiler identity mismatch" in error for error in errors))

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

    def test_rejects_old_or_lax_schema_before_reading_raw_samples(self) -> None:
        mutations = {
            "old_v1": lambda schema: schema.update(
                {"$id": "ring.check-benchmark.invocation.v1"}
            ),
            "same_id_lax": lambda schema: schema["properties"]["runner_summary"][
                "properties"
            ].__setitem__("suite_counts", {"type": "object"}),
        }
        for name, mutate in mutations.items():
            with self.subTest(case=name), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                cold = self._write_run(root, state="cold", run_id="cold-run")
                schema_path = cold / "result.schema.json"
                schema = json.loads(schema_path.read_text(encoding="utf-8"))
                mutate(schema)
                harness._json_dump(schema_path, schema)
                (cold / "samples.jsonl").write_text("not-json\n", encoding="utf-8")
                expected = r"\$id" if name == "old_v1" else "canonical invocation.v2"
                with self.assertRaisesRegex(harness.HarnessError, expected):
                    combine.combine_runs([cold], root / "combined")

    def test_duplicate_json_keys_fail_in_metadata_and_nested_samples(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            environment_path = cold / "environment.json"
            environment_path.write_text(
                '{"schema":"first","nested":{"x":1,"x":2}}',
                encoding="utf-8",
            )
            with self.assertRaisesRegex(harness.DuplicateJsonKeyError, "duplicate JSON key"):
                combine.combine_runs([cold], root / "combined")

        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            samples_path = cold / "samples.jsonl"
            lines = samples_path.read_text(encoding="utf-8").splitlines()
            lines[0] = lines[0].replace(
                '"cache": {', '"cache": {"output":"fresh",', 1
            )
            samples_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            summary_path = cold / "summary.json"
            summary = json.loads(summary_path.read_text(encoding="utf-8"))
            summary["samples_jsonl"] = harness._file_record(samples_path)
            harness._json_dump(summary_path, summary)
            with self.assertRaisesRegex(harness.DuplicateJsonKeyError, "duplicate JSON key"):
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

    def test_rejects_wrong_seed_across_batches_and_retained_receipt_drift(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            warm = self._write_run(root, state="warm", run_id="warm-run")
            environment_path = warm / "environment.json"
            environment = json.loads(environment_path.read_text(encoding="utf-8"))
            receipt = environment["warm_cache_seed"]["identity"]
            receipt["outcome"]["stdout"]["sha256"] = "9" * 64
            receipt_path = warm / "warm-cache-seed-receipt.json"
            harness._json_dump(receipt_path, receipt)
            environment["warm_cache_seed"]["receipt"] = harness._file_record(receipt_path)
            harness._json_dump(environment_path, environment)
            with self.assertRaisesRegex(harness.HarnessError, "identity/toolchain drift"):
                combine.combine_runs([cold, warm], root / "combined")

        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            receipt_path = cold / "warm-cache-seed-receipt.json"
            receipt_path.write_bytes(receipt_path.read_bytes() + b" ")
            with self.assertRaisesRegex(harness.HarnessError, "receipt file provenance"):
                combine.combine_runs([cold], root / "combined")

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

    def test_rejects_coordinated_eligibility_field_tampering(self) -> None:
        mutations = {
            "rss_complete": lambda rows: rows[0].__setitem__("rss_complete", False),
            "measurement_errors": lambda rows: rows[0].__setitem__(
                "measurement_errors", ["forged measurement failure"]
            ),
        }
        for label, mutate in mutations.items():
            with self.subTest(label=label), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                cold = self._write_run(root, state="cold", run_id="cold-run")
                self._rewrite_samples_and_summary(cold, mutate)
                with self.assertRaisesRegex(
                    harness.HarnessError, "rss_complete formula mismatch"
                ):
                    combine.combine_runs([cold], root / "combined")

    def test_rejects_coordinated_artifact_list_tampering(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            self._rewrite_samples_and_summary(
                cold, lambda rows: rows[0].__setitem__("artifacts", [])
            )
            with self.assertRaisesRegex(harness.HarnessError, "artifact provenance"):
                combine.combine_runs([cold], root / "combined")

    def test_rejects_coordinated_stream_metadata_tampering(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")

            def mutate(rows: list[dict]) -> None:
                rows[0]["stdout"]["sha256"] = "f" * 64

            self._rewrite_samples_and_summary(cold, mutate)
            with self.assertRaisesRegex(harness.HarnessError, "stream provenance"):
                combine.combine_runs([cold], root / "combined")

    def test_rejects_coordinated_runner_summary_tampering(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")
            forged = {
                "status_counts": {"pass": 1, "fail": 0, "skip": 0},
                "suite_counts": {"forged": {"pass": 1, "fail": 0, "skip": 0}},
                "reported_exit_code": 0,
            }
            self._rewrite_samples_and_summary(
                cold, lambda rows: rows[0].__setitem__("runner_summary", forged)
            )
            with self.assertRaisesRegex(harness.HarnessError, "runner summary provenance"):
                combine.combine_runs([cold], root / "combined")

    def test_rejects_coordinated_runtime_error_tampering(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            cold = self._write_run(root, state="cold", run_id="cold-run")

            def mutate(rows: list[dict]) -> None:
                rows[0]["runner_runtime"]["errors"] = ["forged runtime failure"]

            self._rewrite_samples_and_summary(cold, mutate)
            with self.assertRaisesRegex(harness.HarnessError, "runtime provenance"):
                combine.combine_runs([cold], root / "combined")

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
