import hashlib
import io
import json
import os
import subprocess
import sys
import tempfile
import threading
import unittest
from contextlib import redirect_stderr
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch


TESTS_DIR = Path(__file__).resolve().parent
if str(TESTS_DIR) not in sys.path:
    sys.path.insert(0, str(TESTS_DIR))

import run_tests as runner


class CompilerArtifactCacheTests(unittest.TestCase):
    def setUp(self) -> None:
        runner._PHASE_TRACER = None

    def tearDown(self) -> None:
        runner._PHASE_TRACER = None

    @staticmethod
    def make_plan(root: Path) -> runner._CompilerBuildPlan:
        anchor = root / "compiler" / "dist-c" / "main.c"
        runtime = root / "ring_runtime.cpp"
        clang = root / "tools" / "clang.exe"
        clangxx = root / "tools" / "clang++.exe"
        linker = root / "tools" / "lld-link.exe"
        anchor.parent.mkdir(parents=True)
        clang.parent.mkdir(parents=True)
        anchor.write_bytes(b"tracked anchor\n")
        runtime.write_bytes(b"runtime\n")
        clang.write_bytes(b"clang tool\n")
        clangxx.write_bytes(b"clang++ tool\n")
        linker.write_bytes(b"linker tool\n")
        return runner._CompilerBuildPlan(
            anchor_source=anchor,
            runtime_source=runtime,
            clang=str(clang),
            runtime_compiler=str(clangxx),
            runtime_frontend_flags=(),
            linker=str(linker),
            exe_name="ring.exe",
            compile_flags=("-O3", "-flto=thin"),
            test_link_flags=("-fuse-ld=lld", "-lmsvcrt"),
            compiler_link_flags=("-flto=thin",),
        )

    @staticmethod
    def seed_cache(
        cache_root: Path,
        plan: runner._CompilerBuildPlan,
        payload: bytes = b"compiler artifact\n",
    ):
        inputs = runner._compiler_cache_inputs(plan)
        key = runner._compiler_cache_key(inputs)
        cache_root.parent.mkdir(parents=True, exist_ok=True)
        staging = Path(tempfile.mkdtemp(
            prefix=f"seed-{key[:8]}-", dir=str(cache_root.parent),
        ))
        executable = staging / plan.exe_name
        executable.write_bytes(payload)
        artifact = runner._publish_cached_compiler(
            cache_root, key, inputs, plan.exe_name, executable,
        )
        return inputs, key, artifact

    def test_key_is_stable_and_invalidates_on_every_trust_input(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            plan = self.make_plan(root)
            baseline_inputs = runner._compiler_cache_inputs(plan)
            baseline_key = runner._compiler_cache_key(baseline_inputs)
            self.assertEqual(
                baseline_inputs["commands"]["linker_selection_flags"],
                ["-fuse-ld=lld"],
            )
            self.assertEqual(
                runner._compiler_cache_key(runner._compiler_cache_inputs(plan)),
                baseline_key,
            )

            plan.anchor_source.write_bytes(b"changed tracked anchor\n")
            self.assertNotEqual(
                runner._compiler_cache_key(runner._compiler_cache_inputs(plan)),
                baseline_key,
            )
            plan.anchor_source.write_bytes(b"tracked anchor\n")

            plan.runtime_source.write_bytes(b"changed runtime\n")
            self.assertNotEqual(
                runner._compiler_cache_key(runner._compiler_cache_inputs(plan)),
                baseline_key,
            )
            plan.runtime_source.write_bytes(b"runtime\n")

            changed_flags = runner._CompilerBuildPlan(
                **{
                    **plan.__dict__,
                    "compiler_link_flags": ("-flto=thin", "-Wl,changed"),
                }
            )
            self.assertNotEqual(
                runner._compiler_cache_key(
                    runner._compiler_cache_inputs(changed_flags)
                ),
                baseline_key,
            )

            Path(plan.linker).write_bytes(b"changed linker tool\n")
            self.assertNotEqual(
                runner._compiler_cache_key(runner._compiler_cache_inputs(plan)),
                baseline_key,
            )
            Path(plan.linker).write_bytes(b"linker tool\n")

            with patch.object(runner.platform, "machine", return_value="other-cpu"):
                self.assertNotEqual(
                    runner._compiler_cache_key(
                        runner._compiler_cache_inputs(plan)
                    ),
                    baseline_key,
                )

    def test_cache_miss_builds_from_a_verified_source_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            plan = self.make_plan(root / "fixture")
            inputs = runner._compiler_cache_inputs(plan)
            staging = root / "staging"
            staging.mkdir()

            staged_plan = runner._staged_compiler_build_plan(
                plan, inputs, staging,
            )
            self.assertEqual(staged_plan.anchor_source.parent, staging / "inputs")
            self.assertEqual(staged_plan.runtime_source.parent, staging / "inputs")
            self.assertEqual(
                staged_plan.anchor_source.read_bytes(), b"tracked anchor\n",
            )
            self.assertEqual(
                staged_plan.runtime_source.read_bytes(), b"runtime\n",
            )

            plan.anchor_source.write_bytes(b"later worktree edit\n")
            self.assertEqual(
                staged_plan.anchor_source.read_bytes(), b"tracked anchor\n",
            )

    def test_partial_stale_and_corrupt_entries_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            cache_root = root / "cache"
            plan = self.make_plan(root / "fixture")
            inputs = runner._compiler_cache_inputs(plan)
            key = runner._compiler_cache_key(inputs)
            receipt_path, _ = runner._cache_paths(cache_root, key)
            receipt_path.parent.mkdir(parents=True)

            receipt_path.write_text("{", encoding="utf-8")
            self.assertIsNone(runner._validated_cached_compiler(
                cache_root, key, inputs, plan.exe_name,
            ))

            _, _, artifact = self.seed_cache(cache_root, plan)
            receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
            receipt["key"] = "0" * 64
            receipt_path.write_text(json.dumps(receipt), encoding="utf-8")
            self.assertIsNone(runner._validated_cached_compiler(
                cache_root, key, inputs, plan.exe_name,
            ))

            self.seed_cache(cache_root, plan)
            artifact.write_bytes(b"corrupt after receipt\n")
            self.assertIsNone(runner._validated_cached_compiler(
                cache_root, key, inputs, plan.exe_name,
            ))

    def test_invalid_receipt_fails_loud_without_rebuilding(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            cache_root = root / "cache"
            plan = self.make_plan(root / "fixture")
            inputs = runner._compiler_cache_inputs(plan)
            key = runner._compiler_cache_key(inputs)
            receipt_path, _ = runner._cache_paths(cache_root, key)
            receipt_path.parent.mkdir(parents=True)
            receipt_path.write_text("{", encoding="utf-8")

            with (
                patch.object(runner, "COMPILER_ARTIFACT_CACHE", cache_root),
                patch.dict(os.environ, {runner.COMPILER_CACHE_ENV: "1"}),
                patch.object(runner, "_build_compiler_in_directory") as build,
            ):
                with self.assertRaisesRegex(
                    runner.CompilerPreparationError,
                    "compiler cache entry failed validation",
                ):
                    runner._prepare_compiler(plan)

            build.assert_not_called()

    def test_hit_copies_verified_artifact_to_each_fresh_run_directory(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            cache_root = root / "cache"
            plan = self.make_plan(root / "fixture")
            self.seed_cache(cache_root, plan)
            with (
                patch.object(runner, "COMPILER_ARTIFACT_CACHE", cache_root),
                patch.dict(os.environ, {runner.COMPILER_CACHE_ENV: "1"}),
                patch.object(runner, "_build_compiler_in_directory") as build,
            ):
                first = Path(runner._prepare_compiler(plan))
                second = Path(runner._prepare_compiler(plan))

            build.assert_not_called()
            self.assertNotEqual(first.parent, second.parent)
            self.assertNotEqual(first.parent, cache_root)
            self.assertEqual(first.read_bytes(), b"compiler artifact\n")
            self.assertEqual(second.read_bytes(), b"compiler artifact\n")

    def test_fresh_copy_rechecks_the_content_address(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            original = b"verified artifact\n"
            artifact_hash = hashlib.sha256(original).hexdigest()
            artifact = root / f"{artifact_hash}.exe"
            artifact.write_bytes(b"changed after validation\n")

            with self.assertRaisesRegex(
                runner.CompilerPreparationError,
                "fresh compiler copy failed hash validation",
            ):
                runner._copy_compiler_for_run(artifact, "ring.exe")

    def test_cache_hit_uses_single_phase_timing_authority(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            cache_root = root / "cache"
            trace_path = root / "trace.jsonl"
            plan = self.make_plan(root / "fixture")
            self.seed_cache(cache_root, plan)
            with (
                patch.object(runner, "COMPILER_ARTIFACT_CACHE", cache_root),
                patch.dict(os.environ, {runner.COMPILER_CACHE_ENV: "1"}),
                patch.object(
                    runner.time, "perf_counter_ns",
                    side_effect=[0, 10, 25, 50],
                ),
                patch.object(runner, "_build_compiler_in_directory") as build,
            ):
                tracer = runner.PhaseTimingTrace(str(trace_path))
                runner._PHASE_TRACER = tracer
                runner._prepare_compiler(plan)
                tracer.finish(complete=True, outcome="success", exit_code=0)
                tracer.close()

            build.assert_not_called()
            records = [
                json.loads(line)
                for line in trace_path.read_text(encoding="utf-8").splitlines()
            ]
            self.assertEqual(
                [row["stage"] for row in records],
                [
                    "compiler_prepare",
                    "orchestration_residual",
                    "runner_total",
                ],
            )
            record, residual, total = records
            self.assertEqual(set(record), runner.PHASE_TIMING_FIELDS)
            self.assertEqual(record["duration_ns"], 15)
            self.assertFalse(record["executed"])
            self.assertTrue(record["complete"])
            self.assertEqual(record["outcome"], "cached")
            self.assertIsNone(record["exit_code"])
            self.assertIsNone(record["command_category"])
            self.assertEqual(residual["duration_ns"], 35)
            self.assertEqual(total["duration_ns"], 50)
            self.assertEqual(
                record["duration_ns"] + residual["duration_ns"],
                total["duration_ns"],
            )

    def test_cache_miss_keeps_the_three_compiler_subprocess_stages(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            cache_root = root / "cache"
            trace_path = root / "trace.jsonl"
            plan = self.make_plan(root / "fixture")

            def successful_tool(command, **_kwargs):
                if "-c" not in command:
                    output = Path(command[command.index("-o") + 1])
                    output.write_bytes(b"linked compiler\n")
                return subprocess.CompletedProcess(command, 0, b"", b"")

            with (
                patch.object(runner, "COMPILER_ARTIFACT_CACHE", cache_root),
                patch.object(runner, "THINLTO_CACHE", root / "thinlto"),
                patch.dict(os.environ, {runner.COMPILER_CACHE_ENV: "1"}),
                patch.object(
                    runner.time, "perf_counter_ns",
                    side_effect=[0, 10, 20, 30, 40, 50, 60, 70, 100],
                ),
                patch.object(
                    runner.subprocess, "run", side_effect=successful_tool,
                ) as child_run,
            ):
                tracer = runner.PhaseTimingTrace(str(trace_path))
                runner._PHASE_TRACER = tracer
                runner._prepare_compiler(plan)
                tracer.finish(complete=True, outcome="success", exit_code=0)
                tracer.close()

            self.assertEqual(child_run.call_count, 3)
            records = [
                json.loads(line)
                for line in trace_path.read_text(encoding="utf-8").splitlines()
            ]
            self.assertEqual(
                [row["stage"] for row in records],
                [
                    "compiler_anchor_compile",
                    "compiler_runtime_compile",
                    "compiler_link",
                    "orchestration_residual",
                    "runner_total",
                ],
            )
            for record in records[:3]:
                self.assertTrue(record["executed"])
                self.assertTrue(record["complete"])
                self.assertEqual(record["outcome"], "success")
                self.assertEqual(record["exit_code"], 0)
                self.assertEqual(record["command_category"], "clang")
            self.assertEqual(
                sum(row["duration_ns"] for row in records[:4]),
                records[-1]["duration_ns"],
            )

    def test_build_failure_is_not_published_or_retried(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            cache_root = root / "cache"
            plan = self.make_plan(root / "fixture")
            failure = subprocess.CalledProcessError(
                23, [plan.clang, "-c"], stderr=b"original compiler failure",
            )
            with (
                patch.object(runner, "COMPILER_ARTIFACT_CACHE", cache_root),
                patch.dict(os.environ, {runner.COMPILER_CACHE_ENV: "1"}),
                patch.object(
                    runner, "_build_compiler_in_directory",
                    side_effect=failure,
                ) as build,
            ):
                with self.assertRaises(subprocess.CalledProcessError) as raised:
                    runner._prepare_compiler(plan)

            self.assertIs(raised.exception, failure)
            build.assert_called_once()
            self.assertFalse((cache_root / "receipts").exists())
            self.assertFalse((cache_root / "artifacts").exists())
            self.assertEqual(list(cache_root.glob(".staging-*")), [])

    def test_build_failure_report_preserves_original_diagnostics(self) -> None:
        failure = subprocess.CalledProcessError(
            23, ["clang", "-c", "main.c"],
            output=b"original stdout\n", stderr=b"original stderr\n",
        )
        captured = io.StringIO()
        with redirect_stderr(captured):
            runner._report_compiler_preparation_failure(failure)

        report = captured.getvalue()
        self.assertIn("command exited 23", report)
        self.assertIn("original stdout", report)
        self.assertIn("original stderr", report)

    def test_disable_switch_bypasses_an_existing_entry(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            cache_root = root / "cache"
            plan = self.make_plan(root / "fixture")
            self.seed_cache(cache_root, plan, b"cached compiler\n")

            def build_uncached(_plan, build_dir):
                executable = build_dir / plan.exe_name
                executable.write_bytes(b"uncached compiler\n")
                return executable

            with (
                patch.object(runner, "COMPILER_ARTIFACT_CACHE", cache_root),
                patch.dict(os.environ, {runner.COMPILER_CACHE_ENV: "0"}),
                patch.object(
                    runner, "_build_compiler_in_directory",
                    side_effect=build_uncached,
                ) as build,
            ):
                executable = Path(runner._prepare_compiler(plan))

            build.assert_called_once()
            self.assertEqual(executable.read_bytes(), b"uncached compiler\n")
            self.assertNotEqual(executable.parent, cache_root)

    def test_concurrent_misses_publish_only_complete_entries(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            cache_root = root / "cache"
            plan = self.make_plan(root / "fixture")
            barrier = threading.Barrier(2)

            def concurrent_build(_plan, build_dir):
                executable = build_dir / plan.exe_name
                executable.write_bytes(b"concurrent compiler\n")
                barrier.wait(timeout=5)
                return executable

            with (
                patch.object(runner, "COMPILER_ARTIFACT_CACHE", cache_root),
                patch.dict(os.environ, {runner.COMPILER_CACHE_ENV: "1"}),
                patch.object(
                    runner, "_build_compiler_in_directory",
                    side_effect=concurrent_build,
                ) as build,
            ):
                with ThreadPoolExecutor(max_workers=2) as pool:
                    paths = list(pool.map(
                        lambda _index: Path(runner._prepare_compiler(plan)),
                        range(2),
                    ))

            self.assertEqual(build.call_count, 2)
            self.assertNotEqual(paths[0].parent, paths[1].parent)
            self.assertEqual(
                [path.read_bytes() for path in paths],
                [b"concurrent compiler\n", b"concurrent compiler\n"],
            )
            inputs = runner._compiler_cache_inputs(plan)
            key = runner._compiler_cache_key(inputs)
            self.assertIsNotNone(runner._validated_cached_compiler(
                cache_root, key, inputs, plan.exe_name,
            ))
            self.assertEqual(list(cache_root.glob(".staging-*")), [])


if __name__ == "__main__":
    unittest.main()
