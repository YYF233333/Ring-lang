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

        by_base = {lane["case_id"]: lane for lane in manifest["lanes"]}
        timed = by_base["tiny_hello_check"]
        control = by_base["tiny_hello_check_no_phase"]
        for field in (
            "policy",
            "cache_states",
            "argv",
            "cwd",
            "timeout_seconds",
            "expected_exit_codes",
            "requires",
            "runner_summary",
            "artifacts",
        ):
            self.assertEqual(timed[field], control[field])
        self.assertTrue(timed["compiler_phase_timing"])
        self.assertFalse(control["compiler_phase_timing"])
        self.assertEqual(control["phase_trace_paths"], [])

    def test_result_schema_rejects_unknown_root_field(self) -> None:
        schema = harness._load_json(harness.DEFAULT_RESULT_SCHEMA)
        with self.assertRaises(harness.HarnessError):
            harness.validate_json({"unexpected": True}, schema)

    def test_result_schema_requires_strict_phase_trace_wrapper(self) -> None:
        schema = harness._load_json(harness.DEFAULT_RESULT_SCHEMA)
        phase_schema = schema["properties"]["phase_traces"]
        with self.assertRaisesRegex(harness.HarnessError, "read_error"):
            harness.validate_json(
                [{"path": "trace.jsonl", "line": 1, "value": {}}],
                phase_schema,
            )

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
            warmup = (
                policy == "direct_short"
                and int(kwargs["index"]) < harness.DIRECT_WARMUPS
            )
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

    def test_warmup_reason_is_derived_before_bad_attempt_details(self) -> None:
        reason = harness.derive_invalid_reason(
            policy="direct_short",
            index=0,
            invocation_error="launch failed",
            measurement={},
            exit_code=None,
            expected_exit_codes=[0],
            runner_expected=False,
            runner_summary=None,
            artifacts=[],
            phase_errors=["bad trace"],
            runtime_errors=["bad runtime"],
        )
        self.assertEqual(reason, "warmup")

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
        reason = harness.derive_invalid_reason(
            policy="adaptive",
            index=0,
            invocation_error=None,
            measurement=measurement,
            exit_code=measurement["exit_code"],
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


class PhaseTimingTests(unittest.TestCase):
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
                "lane": "tiny_hello_check_cold",
                "phase": phase,
                "duration_ns": durations[phase],
                "unit": "ns",
                "compiler_identity": "sha256:" + "a" * 64,
                "source_identity": "git:" + "b" * 40,
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

    def _validate(self, rows: list[dict], *, wall_ns: int = 150) -> list[str]:
        return harness._validate_compiler_phase_rows(
            rows,
            expected_lane="tiny_hello_check_cold",
            expected_compiler_identity="sha256:" + "a" * 64,
            expected_source_identity="git:" + "b" * 40,
            expected_entry_file=str(
                (harness.REPO_ROOT / "tests" / "cases" / "hello.ring").resolve()
            ),
            expected_success=True,
            expected_executed_phases=[
                "input_entry_load",
                "entry_parse",
                "type_effect_check_lower",
                "command_total",
            ],
            wall_ns=wall_ns,
        )

    def test_compiler_phase_trace_validates_and_summarizes_accounting(self) -> None:
        rows = self._compiler_rows()
        self.assertEqual(self._validate(rows), [])
        record = {
            "included": True,
            "wall_ns": 150,
            "phase_traces": [
                {
                    "path": "trace.jsonl",
                    "line": index,
                    "value": row,
                    "read_error": None,
                }
                for index, row in enumerate(rows, 1)
            ],
        }
        summary = harness._summarize_compiler_phase_timing([record])
        assert summary is not None
        self.assertEqual(summary["sample_count"], 1)
        self.assertEqual(
            summary["accounting"]["measured_phase_sum_ns"]["median"], 60
        )
        self.assertEqual(
            summary["accounting"]["unattributed_command_ns"]["median"], 40
        )
        self.assertEqual(
            summary["accounting"]["outside_instrumented_command_ns"]["median"],
            50,
        )

    def test_bad_or_incomplete_compiler_trace_fails_closed(self) -> None:
        rows = self._compiler_rows()
        rows[2]["complete"] = False
        self.assertTrue(any("incomplete" in error for error in self._validate(rows)))
        rows = self._compiler_rows()
        rows[0]["schema_version"] = True
        self.assertTrue(
            any("schema/version" in error for error in self._validate(rows))
        )
        reason = harness.derive_invalid_reason(
            policy="adaptive",
            index=0,
            invocation_error=None,
            measurement={
                "timed_out": False,
                "exit_code": 0,
                "cpu_user_ns": 1,
                "cpu_kernel_ns": 1,
                "peak_root_rss_bytes": 1,
                "peak_job_commit_bytes": 1,
                "process_count": {"total": 1},
                "job_io": {},
                "measurement_errors": [],
                "rss_complete": True,
            },
            exit_code=0,
            expected_exit_codes=[0],
            runner_expected=False,
            runner_summary=None,
            artifacts=[],
            phase_errors=["compiler phase row 3 is incomplete"],
            runtime_errors=[],
        )
        self.assertEqual(
            reason,
            "phase_trace_invalid: compiler phase row 3 is incomplete",
        )

    def test_unknown_phase_trace_schema_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            sample_dir = Path(temp).resolve()
            path = sample_dir / "unknown.jsonl"
            row = self._compiler_rows()[0]
            row["schema"] = "unknown.phase.v1"
            errors = harness._validate_phase_trace_records(
                [
                    {
                        "path": str(path),
                        "line": 1,
                        "value": row,
                        "read_error": None,
                    }
                ],
                paths=[path],
                sample_dir=sample_dir,
                lane={
                    "case_id": "tiny_hello_check_cold",
                    "compiler_phase_timing": True,
                    "expected_executed_phases": [
                        "input_entry_load",
                        "entry_parse",
                        "type_effect_check_lower",
                        "command_total",
                    ],
                },
                environment={
                    "source_sha": "b" * 40,
                    "tools": {"ring": {"sha256": "a" * 64}},
                },
                expected_entry_file=str(
                    (harness.REPO_ROOT / "tests" / "cases" / "hello.ring").resolve()
                ),
                exit_code=0,
                wall_ns=150,
            )
        self.assertTrue(any("schema mismatch" in error for error in errors))

    def test_phase_sum_and_command_total_must_fit_job_wall(self) -> None:
        rows = self._compiler_rows()
        rows[-1]["duration_ns"] = 50
        errors = self._validate(rows, wall_ns=40)
        self.assertTrue(any("phase sum" in error for error in errors))
        self.assertTrue(any("job wall" in error for error in errors))

    def test_entry_file_may_be_empty_only_when_input_is_skipped(self) -> None:
        rows = self._compiler_rows()
        for row in rows:
            row["entry_file"] = ""
        self.assertTrue(
            any("executed input_entry_load" in error for error in self._validate(rows))
        )
        rows[0]["executed"] = False
        rows[0]["duration_ns"] = 0
        errors = harness._validate_compiler_phase_rows(
            rows,
            expected_lane="tiny_hello_check_cold",
            expected_compiler_identity="sha256:" + "a" * 64,
            expected_source_identity="git:" + "b" * 40,
            expected_entry_file="",
            expected_success=True,
            expected_executed_phases=[
                "entry_parse",
                "type_effect_check_lower",
                "command_total",
            ],
            wall_ns=150,
        )
        self.assertEqual(errors, [])

    def test_entry_file_is_bound_to_the_invocation_entry(self) -> None:
        rows = self._compiler_rows()
        forged = str((harness.REPO_ROOT / "compiler" / "main.ring").resolve())
        for row in rows:
            row["entry_file"] = forged
        errors = self._validate(rows)
        self.assertTrue(any("entry_file identity mismatch" in error for error in errors))
        self.assertFalse(any("disagree on entry_file" in error for error in errors))

    def test_trace_wrappers_require_manifest_path_and_contiguous_lines(self) -> None:
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
            wrappers[1]["line"] = 3
            errors = harness._validate_phase_trace_records(
                wrappers,
                paths=[path],
                sample_dir=sample_dir,
                lane={
                    "case_id": "tiny_hello_check_cold",
                    "compiler_phase_timing": True,
                    "expected_executed_phases": [
                        "input_entry_load",
                        "entry_parse",
                        "type_effect_check_lower",
                        "command_total",
                    ],
                },
                environment={
                    "source_sha": "b" * 40,
                    "tools": {"ring": {"sha256": "a" * 64}},
                },
                expected_entry_file=str(
                    (harness.REPO_ROOT / "tests" / "cases" / "hello.ring").resolve()
                ),
                exit_code=0,
                wall_ns=150,
            )
            self.assertTrue(any("unique and contiguous" in error for error in errors))
            outside = sample_dir.parent / "outside.jsonl"
            errors = harness._validate_phase_trace_records(
                [],
                paths=[outside],
                sample_dir=sample_dir,
                lane={"case_id": "bootstrap", "phase_trace_paths": [str(outside)]},
                environment={},
                expected_entry_file="",
                exit_code=0,
                wall_ns=150,
            )
            self.assertTrue(any("escapes sample_dir" in error for error in errors))

    def test_bootstrap_phase_schema_remains_supported_and_strict(self) -> None:
        rows = [
            {
                "schema": harness.BOOTSTRAP_PHASE_SCHEMA,
                "phase": phase,
                "argv": ["tool", phase],
                "wall_ns": 10,
                "exit_code": 0,
            }
            for phase in harness.BOOTSTRAP_PHASE_ORDER
        ]
        self.assertEqual(
            harness._validate_bootstrap_phase_rows(rows, wall_ns=40), []
        )
        rows[0]["unknown"] = True
        self.assertTrue(
            any(
                "fields differ" in error
                for error in harness._validate_bootstrap_phase_rows(rows, wall_ns=40)
            )
        )

    def test_timing_is_hidden_opt_in_with_disabled_default(self) -> None:
        cli = (harness.REPO_ROOT / "compiler" / "cli.ring").read_text(encoding="utf-8")
        timing = (harness.REPO_ROOT / "compiler" / "phase_timing.ring").read_text(
            encoding="utf-8"
        )
        self.assertIn('let mut phase_timing_file = ""', cli)
        self.assertNotIn("--phase-timing", cli[cli.index("fn usage()") :])
        disabled = timing[
            timing.index("if output_path.len() == 0") : timing.index("let actual_lane")
        ]
        self.assertIn("return PhaseTiming", disabled)
        self.assertNotIn("ring_bench_monotonic_ns", disabled)
        self.assertNotIn("${entry_file}", disabled)
        self.assertIn("if self.enabled == false { return }", timing)
        self.assertIn("phase != phase_timing_phase(self.next_phase)", timing)
        self.assertIn("if self.next_phase != 5 { self.integrity = false }", timing)


_PHASE_TEST_COMPILER = os.environ.get("RING_PHASE_TEST_COMPILER", "")


@unittest.skipUnless(
    _PHASE_TEST_COMPILER and Path(_PHASE_TEST_COMPILER).is_file(),
    "set RING_PHASE_TEST_COMPILER to run native phase-timing parity",
)
class NativeCliPhaseTimingTests(unittest.TestCase):
    def test_timed_and_untimed_cli_contract_matrix(self) -> None:
        compiler = str(Path(_PHASE_TEST_COMPILER).resolve())
        command_only = ["command_total"]
        single_parse = ["input_entry_load", "entry_parse", "command_total"]
        single_checked = [
            "input_entry_load",
            "entry_parse",
            "type_effect_check_lower",
            "command_total",
        ]
        project_parse = [
            "input_entry_load",
            "entry_parse",
            "project_module_load_parse",
            "command_total",
        ]
        project_checked = [
            "input_entry_load",
            "entry_parse",
            "project_module_load_parse",
            "type_effect_check_lower",
            "command_total",
        ]
        rc_checked = [
            "input_entry_load",
            "entry_parse",
            "type_effect_check_lower",
            "resource_plan_verify",
            "command_total",
        ]
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp).resolve()
            parse_project = root / "parse-project"
            type_project = root / "type-project"
            parse_project.mkdir()
            type_project.mkdir()
            main_source = (
                "use lib::value\n\n"
                "fn main() {\n"
                "    print(value())\n"
                "}\n"
            )
            (parse_project / "main.ring").write_text(main_source, encoding="utf-8")
            (parse_project / "lib.ring").write_text(
                "pub fn value( {\n", encoding="utf-8"
            )
            (type_project / "main.ring").write_text(main_source, encoding="utf-8")
            (type_project / "lib.ring").write_text(
                'pub fn value() -> Int { "bad" }\n', encoding="utf-8"
            )
            cases = [
                ("help_success", ["help"], 0, command_only),
                ("lsp_failure", ["lsp"], 1, command_only),
                (
                    "single_success",
                    ["check", str(harness.REPO_ROOT / "tests/cases/hello.ring")],
                    0,
                    single_checked,
                ),
                (
                    "single_parse_failure",
                    ["check", str(harness.REPO_ROOT / "tests/cases/error_multi_parse.ring")],
                    1,
                    single_parse,
                ),
                (
                    "single_type_failure",
                    ["check", str(harness.REPO_ROOT / "tests/cases/error_undefined.ring")],
                    1,
                    single_checked,
                ),
                (
                    "project_success",
                    [
                        "check",
                        str(
                            harness.REPO_ROOT
                            / "tests/cases/modules/diamond_dep/main.ring"
                        ),
                    ],
                    0,
                    project_checked,
                ),
                (
                    "project_parse_failure",
                    ["check", str(parse_project / "main.ring")],
                    1,
                    project_parse,
                ),
                (
                    "project_type_failure",
                    ["check", str(type_project / "main.ring")],
                    1,
                    project_checked,
                ),
                (
                    "rc_success",
                    [
                        "check",
                        str(
                            harness.REPO_ROOT
                            / "tests/cases/verify_rc/option_temp_leak.ring"
                        ),
                        "--verify-rc",
                    ],
                    0,
                    rc_checked,
                ),
                (
                    "rc_fatal",
                    [
                        "check",
                        str(
                            harness.REPO_ROOT
                            / "tests/cases/verify_rc/option_temp_leak.ring"
                        ),
                        "--verify-rc",
                        "--rc-mutate=skip-anf",
                    ],
                    1,
                    rc_checked,
                ),
            ]
            for name, argv, expected_exit, expected_executed in cases:
                with self.subTest(case=name):
                    untimed = subprocess.run(
                        [compiler, *argv],
                        cwd=harness.REPO_ROOT,
                        capture_output=True,
                        timeout=120,
                        check=False,
                    )
                    trace = root / f"{name}.jsonl"
                    timed = subprocess.run(
                        [
                            compiler,
                            *argv,
                            f"--phase-timing={trace}",
                            f"--phase-timing-lane={name}",
                            "--phase-timing-compiler=native-matrix",
                            "--phase-timing-source=native-matrix-source",
                        ],
                        cwd=harness.REPO_ROOT,
                        capture_output=True,
                        timeout=120,
                        check=False,
                    )
                    self.assertEqual(untimed.returncode, expected_exit)
                    self.assertEqual(timed.returncode, untimed.returncode)
                    self.assertEqual(timed.stdout, untimed.stdout)
                    self.assertEqual(timed.stderr, untimed.stderr)
                    rows = [
                        json.loads(line)
                        for line in trace.read_text(encoding="utf-8").splitlines()
                    ]
                    self.assertEqual(len(rows), len(harness.COMPILER_PHASE_ORDER))
                    self.assertEqual(
                        [row["phase"] for row in rows],
                        list(harness.COMPILER_PHASE_ORDER),
                    )
                    required = {
                        "schema",
                        "schema_version",
                        "lane",
                        "phase",
                        "duration_ns",
                        "unit",
                        "compiler_identity",
                        "source_identity",
                        "entry_file",
                        "executed",
                        "complete",
                        "command_success",
                    }
                    for row in rows:
                        self.assertEqual(set(row), required)
                        self.assertEqual(row["schema"], harness.COMPILER_PHASE_SCHEMA)
                        self.assertEqual(row["schema_version"], 1)
                        self.assertEqual(row["lane"], name)
                        self.assertEqual(row["compiler_identity"], "native-matrix")
                        self.assertEqual(row["source_identity"], "native-matrix-source")
                        self.assertEqual(row["unit"], "ns")
                        self.assertIs(type(row["duration_ns"]), int)
                        self.assertGreaterEqual(row["duration_ns"], 0)
                        self.assertTrue(row["complete"])
                        self.assertEqual(
                            row["command_success"], expected_exit == 0
                        )
                    actual_executed = [
                        row["phase"] for row in rows if row["executed"]
                    ]
                    self.assertEqual(actual_executed, expected_executed)
                    self.assertTrue(
                        all(
                            row["duration_ns"] == 0
                            for row in rows
                            if not row["executed"]
                        )
                    )
                    errors = harness._validate_compiler_phase_rows(
                        rows,
                        expected_lane=name,
                        expected_compiler_identity="native-matrix",
                        expected_source_identity="native-matrix-source",
                        expected_entry_file=(
                            str(Path(argv[1]).resolve())
                            if "input_entry_load" in expected_executed
                            else ""
                        ),
                        expected_success=expected_exit == 0,
                        expected_executed_phases=expected_executed,
                        wall_ns=harness.RING_INT_MAX,
                    )
                    self.assertEqual(errors, [])


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
