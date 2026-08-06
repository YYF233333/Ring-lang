"""Strictly combine complete B-176 measurement batches into one baseline record."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Any, Mapping, Sequence

import run as harness


COMBINED_SCHEMA = "ring.check-benchmark.combined.v1"


def _require_file(run_dir: Path, name: str) -> Path:
    path = run_dir / name
    if not path.is_file():
        raise harness.HarnessError(f"missing {name} in run directory {run_dir}")
    return path


def _load_samples(path: Path, schema: Mapping[str, Any]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    try:
        with path.open("r", encoding="utf-8") as stream:
            for line_number, line in enumerate(stream, 1):
                if not line.strip():
                    continue
                value = json.loads(line)
                if not isinstance(value, dict):
                    raise harness.HarnessError(
                        f"{path}:{line_number}: sample row is not an object"
                    )
                harness.validate_json(value, schema, f"{path}:{line_number}")
                records.append(value)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise harness.HarnessError(f"cannot read samples {path}: {exc}") from exc
    if not records:
        raise harness.HarnessError(f"samples file is empty: {path}")
    return records


def _fingerprint(
    environment: Mapping[str, Any], manifest_path: Path, schema_path: Path
) -> dict[str, Any]:
    os_record = environment.get("os")
    cpu = environment.get("cpu")
    power = environment.get("power")
    tools = environment.get("tools")
    if not isinstance(os_record, dict) or not isinstance(cpu, dict) or not isinstance(power, dict):
        raise harness.HarnessError("environment lacks stable machine identity records")
    ring = tools.get("ring") if isinstance(tools, dict) else None
    required_build_values = {
        "source_sha": environment.get("source_sha"),
        "manifest_sha": environment.get("manifest_sha"),
        "dist_c_sha256": environment.get("dist_c_sha256"),
        "runtime_sha256": environment.get("runtime_sha256"),
        "tools.ring.path": ring.get("path") if isinstance(ring, dict) else None,
        "tools.ring.version": ring.get("version") if isinstance(ring, dict) else None,
        "tools.ring.sha256": ring.get("sha256") if isinstance(ring, dict) else None,
    }
    missing_build = [
        name
        for name, value in required_build_values.items()
        if not isinstance(value, str) or not value
    ]
    if missing_build:
        raise harness.HarnessError(
            f"environment build identity is incomplete: {missing_build}"
        )
    required_machine_values = {
        "os.system": os_record.get("system"),
        "os.release": os_record.get("release"),
        "os.version": os_record.get("version"),
        "os.machine": os_record.get("machine"),
        "cpu.model": cpu.get("model"),
        "cpu.logical_cores": cpu.get("logical_cores"),
        "memory_bytes": environment.get("memory_bytes"),
        "power.active_scheme": power.get("active_scheme"),
        "power.ac_line_status": power.get("ac_line_status"),
    }
    missing = [name for name, value in required_machine_values.items() if value is None or value == ""]
    if missing:
        raise harness.HarnessError(f"environment machine identity is incomplete: {missing}")
    return {
        "source_sha": environment.get("source_sha"),
        "manifest_sha": environment.get("manifest_sha"),
        "manifest_file_sha256": harness._sha256_file(manifest_path),
        "result_schema_sha256": harness._sha256_file(schema_path),
        "dist_c_sha256": environment.get("dist_c_sha256"),
        "runtime_sha256": environment.get("runtime_sha256"),
        "tools": tools,
        "flags": environment.get("flags"),
        "machine": {
            "os": os_record,
            "cpu": {
                "model": cpu["model"],
                "logical_cores": cpu["logical_cores"],
            },
            "memory_bytes": environment.get("memory_bytes"),
            "power": {
                "active_scheme": power["active_scheme"],
                "ac_line_status": power["ac_line_status"],
            },
        },
    }


def _expected_target(policy: str, records: Sequence[Mapping[str, Any]]) -> int:
    if policy == "direct_short":
        return harness.DIRECT_VALID_SAMPLES
    if policy == "full_gate":
        return harness.FULL_GATE_VALID_SAMPLES
    if policy != "adaptive":
        raise harness.HarnessError(f"unknown lane policy {policy!r}")
    first_valid = next(
        (
            record
            for record in sorted(records, key=lambda record: record.get("index", -1))
            if record.get("included") is True
        ),
        None,
    )
    if first_valid is None:
        raise harness.HarnessError("complete adaptive lane has no included sample")
    return (
        harness.LONG_VALID_SAMPLES
        if first_valid.get("wall_ns", 0) >= harness.LONG_LANE_THRESHOLD_NS
        else harness.SHORT_VALID_SAMPLES
    )


def _validate_lane_schedule(
    policy: str, records: Sequence[Mapping[str, Any]], target: int, case_id: str
) -> None:
    ordered = sorted(records, key=lambda record: record.get("index", -1))
    indices = [record.get("index") for record in ordered]
    if indices != list(range(len(ordered))):
        raise harness.HarnessError(f"non-contiguous sample indices in lane {case_id}")
    warmups = [record for record in ordered if record.get("invalid_reason") == "warmup"]
    expected_warmups = harness.DIRECT_WARMUPS if policy == "direct_short" else 0
    if len(warmups) != expected_warmups:
        raise harness.HarnessError(f"warm-up policy mismatch in lane {case_id}")
    if warmups and (warmups[0].get("index") != 0 or warmups[0].get("included") is not False):
        raise harness.HarnessError(f"warm-up placement mismatch in lane {case_id}")
    measured = ordered[expected_warmups:]
    if sum(record.get("included") is True for record in measured) != target:
        raise harness.HarnessError(f"valid-sample target mismatch in lane {case_id}")
    if not measured or measured[-1].get("included") is not True:
        raise harness.HarnessError(f"lane continued after reaching its target: {case_id}")
    max_attempts = target + harness.MAX_EXTRA_ATTEMPTS + expected_warmups
    if len(ordered) > max_attempts:
        raise harness.HarnessError(f"attempt budget exceeded in lane {case_id}")


def _replay_context(
    environment: Mapping[str, Any], run_dir: Path, sample_dir: Path,
    expected_lane: Mapping[str, Any]
) -> dict[str, str]:
    tools = environment.get("tools")
    if not isinstance(tools, dict):
        raise harness.HarnessError("environment tools record is unavailable")
    context: dict[str, str] = {}
    for name, tool in tools.items():
        path = tool.get("path") if isinstance(tool, dict) else None
        context[name] = path if isinstance(path, str) and path else f"<missing:{name}>"
    cache_path = environment.get("thinlto_cache_path")
    if expected_lane["cache"]["thinlto_cache"] == "cold":
        invocation_cache = sample_dir / "temp" / "ring-lang-thinlto-cache"
    elif isinstance(cache_path, str) and cache_path:
        invocation_cache = Path(cache_path)
    else:
        raise harness.HarnessError("environment ThinLTO cache path is unavailable")
    context.update(
        {
            "repo": str(harness.REPO_ROOT),
            "run_dir": str(run_dir),
            "sample_dir": str(sample_dir),
            "thinlto_cache": str(invocation_cache),
        }
    )
    return context


def _actual_file_record(path: Path, label: str) -> dict[str, Any]:
    try:
        if not path.is_file():
            raise harness.HarnessError(f"missing retained {label}: {path}")
        return harness._file_record(path)
    except OSError as exc:
        raise harness.HarnessError(f"cannot verify retained {label} {path}: {exc}") from exc


def _validate_runner_runtime_provenance(
    record: Mapping[str, Any], expected_lane: Mapping[str, Any],
    environment: Mapping[str, Any], sample_dir: Path
) -> None:
    runtime = record["runner_runtime"]
    applies = bool(expected_lane.get("isolate_runner_runtime", False))
    if not applies:
        expected = {
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
        }
        if runtime != expected:
            raise harness.HarnessError(
                f"runner runtime provenance mismatch in {record['sample_id']}"
            )
        return

    setup = environment.get("runner_runtime")
    if not isinstance(setup, dict):
        raise harness.HarnessError("environment runner runtime setup is unavailable")
    root_text = setup.get("root_path")
    if not isinstance(root_text, str) or not root_text:
        raise harness.HarnessError("environment runner runtime root is unavailable")
    root = Path(root_text)
    token = re.sub(r"[^a-zA-Z0-9_-]", "_", sample_dir.name)
    backup = root.with_name(f"ring_runtime.b176-{token}.backup.o").resolve()
    staging = root.with_name(f"ring_runtime.b176-{token}.install.o").resolve()
    original = setup.get("original_root")
    if not isinstance(original, dict):
        raise harness.HarnessError("environment original runtime state is unavailable")
    expected_fields = {
        "mode": expected_lane["cache"]["thinlto_cache"],
        "isolated": True,
        "root_path": str(root.resolve()),
        "source_sha256": setup.get("source_sha256"),
        "flags": setup.get("flags"),
        "original_exists": original.get("exists"),
        "original_sha256": original.get("sha256"),
        "backup_path": str(backup),
        "staging_path": str(staging),
    }
    for field, expected in expected_fields.items():
        if runtime.get(field) != expected:
            raise harness.HarnessError(
                f"runner runtime {field} provenance mismatch in {record['sample_id']}"
            )
    if runtime["mode"] == "cold":
        expected_pre = (False, None)
    else:
        prepared = setup.get("prepared")
        if not isinstance(prepared, dict):
            raise harness.HarnessError("prepared warm runtime state is unavailable")
        expected_pre = (prepared.get("exists"), prepared.get("sha256"))
    if (runtime["pre_exists"], runtime["pre_sha256"]) != expected_pre:
        raise harness.HarnessError(
            f"runner runtime pre-state mismatch in {record['sample_id']}"
        )
    if not runtime["errors"] and (
        not runtime["post_exists"]
        or not runtime["restored"]
        or runtime["backup_exists_after"]
        or runtime["staging_exists_after"]
    ):
        raise harness.HarnessError(
            f"runner runtime clean-state mismatch in {record['sample_id']}"
        )
    if (
        runtime["mode"] == "warm"
        and runtime["post_exists"]
        and isinstance(setup.get("prepared"), dict)
        and runtime["post_sha256"] != setup["prepared"].get("sha256")
    ):
        raise harness.HarnessError(
            f"runner runtime warm post-state mismatch in {record['sample_id']}"
        )


def _revalidate_record_eligibility(
    record: Mapping[str, Any],
    expected_lane: Mapping[str, Any],
    environment: Mapping[str, Any],
    run_dir: Path,
) -> None:
    sample_id = record["sample_id"]
    expected_sample_dir = (
        run_dir / "samples" / expected_lane["case_id"] / sample_id
    ).resolve()
    try:
        expected_sample_dir.relative_to(run_dir)
    except ValueError as exc:
        raise harness.HarnessError(
            f"sample_dir escapes run directory in {sample_id}"
        ) from exc
    sample_dir_text = record.get("sample_dir")
    if (
        not isinstance(sample_dir_text, str)
        or not Path(sample_dir_text).is_absolute()
        or sample_dir_text != str(expected_sample_dir)
    ):
        raise harness.HarnessError(
            f"sample_dir provenance mismatch in {sample_id}"
        )
    context = _replay_context(
        environment, run_dir, expected_sample_dir, expected_lane
    )
    expected_argv = [harness._format(item, context) for item in expected_lane["argv"]]
    phase_paths = harness.resolve_phase_trace_paths(
        expected_lane, expected_sample_dir
    )
    if expected_lane.get("compiler_phase_timing", False):
        compiler_sha = environment["tools"]["ring"]["sha256"]
        expected_argv.extend(
            [
                f"--phase-timing={phase_paths[0]}",
                f"--phase-timing-lane={expected_lane['case_id']}",
                f"--phase-timing-compiler=sha256:{compiler_sha}",
                f"--phase-timing-source=git:{environment['source_sha']}",
            ]
        )
    expected_cwd = str(Path(harness._format(expected_lane["cwd"], context)).resolve())
    if record["argv"] != expected_argv or record["cwd"] != expected_cwd:
        raise harness.HarnessError(f"invocation provenance mismatch in {sample_id}")

    stdout_path = expected_sample_dir / "stdout.txt"
    stderr_path = expected_sample_dir / "stderr.txt"
    for stream_path in (stdout_path, stderr_path):
        try:
            stream_path.resolve().relative_to(expected_sample_dir)
        except ValueError as exc:
            raise harness.HarnessError(
                f"stream path escapes sample_dir in {sample_id}: {stream_path.resolve()}"
            ) from exc
    actual_stdout = _actual_file_record(stdout_path, "stdout")
    actual_stderr = _actual_file_record(stderr_path, "stderr")
    if record["stdout"] != actual_stdout or record["stderr"] != actual_stderr:
        raise harness.HarnessError(f"stream provenance mismatch in {sample_id}")
    actual_runner = (
        harness._runner_summary(stdout_path)
        if expected_lane["runner_summary"]
        else None
    )
    if record["runner_summary"] != actual_runner:
        raise harness.HarnessError(f"runner summary provenance mismatch in {sample_id}")

    artifact_paths = [
        Path(harness._format(item, context)).resolve()
        for item in expected_lane["artifacts"]
    ]
    for path in artifact_paths:
        try:
            path.relative_to(expected_sample_dir)
        except ValueError as exc:
            raise harness.HarnessError(
                f"declared artifact escapes sample_dir in {sample_id}: {path}"
            ) from exc
    actual_artifacts = harness._artifact_records(artifact_paths)
    if record["artifacts"] != actual_artifacts:
        raise harness.HarnessError(f"artifact provenance mismatch in {sample_id}")

    actual_phase_traces = harness._phase_trace_records(phase_paths)
    if record["phase_traces"] != actual_phase_traces:
        raise harness.HarnessError(f"phase trace provenance mismatch in {sample_id}")
    _validate_runner_runtime_provenance(
        record, expected_lane, environment, expected_sample_dir
    )
    exit_record = record["exit"]
    exit_code = exit_record["code"]
    expected_exit = exit_code in expected_lane["expected_exit_codes"]
    if exit_record["expected"] is not expected_exit:
        raise harness.HarnessError(
            f"stored exit eligibility mismatch in {sample_id}"
        )
    phase_errors = harness._validate_phase_trace_records(
        actual_phase_traces,
        paths=phase_paths,
        sample_dir=expected_sample_dir,
        lane=expected_lane,
        environment=environment,
        expected_entry_file=(
            harness.resolve_invocation_entry(expected_argv, expected_cwd)
            if expected_lane.get("compiler_phase_timing", False)
            else ""
        ),
        exit_code=exit_code,
        wall_ns=record["wall_ns"],
    )
    reason = harness.derive_invalid_reason(
        policy=expected_lane["policy"],
        index=record["index"],
        invocation_error=record["invocation_error"],
        measurement=record,
        exit_code=exit_code,
        expected_exit_codes=expected_lane["expected_exit_codes"],
        runner_expected=expected_lane["runner_summary"],
        runner_summary=actual_runner,
        artifacts=actual_artifacts,
        phase_errors=phase_errors,
        runtime_errors=record["runner_runtime"]["errors"],
    )
    if record["invalid_reason"] != reason:
        raise harness.HarnessError(
            f"stored invalid_reason mismatch in {sample_id}: "
            f"expected {reason!r}, got {record['invalid_reason']!r}"
        )
    if record["included"] is not (reason is None):
        raise harness.HarnessError(
            f"stored included eligibility mismatch in {sample_id}"
        )


def _load_run(run_dir: Path) -> dict[str, Any]:
    run_dir = run_dir.resolve()
    if not run_dir.is_dir():
        raise harness.HarnessError(f"run directory does not exist: {run_dir}")
    manifest_path = _require_file(run_dir, "manifest.snapshot.json")
    schema_path = _require_file(run_dir, "result.schema.json")
    environment_path = _require_file(run_dir, "environment.json")
    samples_path = _require_file(run_dir, "samples.jsonl")
    summary_path = _require_file(run_dir, "summary.json")

    manifest = harness._load_json(manifest_path)
    schema = harness._load_json(schema_path)
    environment = harness._load_json(environment_path)
    summary = harness._load_json(summary_path)
    if not all(isinstance(value, dict) for value in (manifest, schema, environment, summary)):
        raise harness.HarnessError(f"run metadata roots must be objects: {run_dir}")
    harness.validate_manifest(manifest)
    harness.validate_schema_definition(schema)
    expanded_lanes = {lane["case_id"]: lane for lane in harness.expand_lanes(manifest)}
    if environment.get("schema") != harness.ENVIRONMENT_SCHEMA:
        raise harness.HarnessError(f"environment schema mismatch: {run_dir}")
    if environment.get("flags") != manifest["fingerprint_flags"]:
        raise harness.HarnessError(f"environment flags differ from manifest: {run_dir}")
    fingerprint = _fingerprint(environment, manifest_path, schema_path)
    if environment.get("git_dirty") is not False:
        raise harness.HarnessError(f"formal run was not captured from a clean worktree: {run_dir}")
    if summary.get("schema") != harness.SUMMARY_SCHEMA or summary.get("complete") is not True:
        raise harness.HarnessError(f"run summary is incomplete or unsupported: {run_dir}")
    if summary.get("run_id") != environment.get("run_id"):
        raise harness.HarnessError(f"run/environment identity mismatch: {run_dir}")
    manifest_sha = harness._sha256_file(manifest_path)
    if environment.get("manifest_sha") != manifest_sha or summary.get("manifest_sha") != manifest_sha:
        raise harness.HarnessError(f"manifest hash mismatch: {run_dir}")
    if summary.get("source_sha") != environment.get("source_sha"):
        raise harness.HarnessError(f"summary source identity mismatch: {run_dir}")
    sample_record = summary.get("samples_jsonl")
    if not isinstance(sample_record, dict):
        raise harness.HarnessError(f"summary samples_jsonl record is missing: {run_dir}")
    if sample_record.get("sha256") != harness._sha256_file(samples_path):
        raise harness.HarnessError(f"samples hash mismatch: {run_dir}")
    if sample_record.get("bytes") != samples_path.stat().st_size:
        raise harness.HarnessError(f"samples byte count mismatch: {run_dir}")

    records = _load_samples(samples_path, schema)
    lane_summaries = summary.get("lanes")
    if not isinstance(lane_summaries, list) or not lane_summaries:
        raise harness.HarnessError(f"summary has no lanes: {run_dir}")
    by_lane: dict[str, list[dict[str, Any]]] = {}
    seen_sample_ids: set[str] = set()
    for record in records:
        if record.get("run_id") != summary["run_id"]:
            raise harness.HarnessError(f"sample run identity mismatch: {run_dir}")
        if record.get("source_sha") != environment["source_sha"]:
            raise harness.HarnessError(f"sample source identity mismatch: {run_dir}")
        if record.get("manifest_sha") != manifest_sha:
            raise harness.HarnessError(f"sample manifest identity mismatch: {run_dir}")
        sample_id = record.get("sample_id")
        if not isinstance(sample_id, str) or sample_id in seen_sample_ids:
            raise harness.HarnessError(f"duplicate or invalid sample_id {sample_id!r}: {run_dir}")
        seen_sample_ids.add(sample_id)
        case_id = record.get("case_id")
        if not isinstance(case_id, str):
            raise harness.HarnessError(f"sample case_id is invalid: {run_dir}")
        by_lane.setdefault(case_id, []).append(record)

    verified_lanes: dict[str, dict[str, Any]] = {}
    for lane_summary in lane_summaries:
        if not isinstance(lane_summary, dict):
            raise harness.HarnessError(f"lane summary is not an object: {run_dir}")
        case_id = lane_summary.get("case_id")
        if not isinstance(case_id, str) or case_id in verified_lanes:
            raise harness.HarnessError(f"duplicate or invalid lane summary {case_id!r}: {run_dir}")
        expected_lane = expanded_lanes.get(case_id)
        if expected_lane is None:
            raise harness.HarnessError(f"lane is absent from expanded manifest: {case_id}")
        if lane_summary.get("complete") is not True:
            raise harness.HarnessError(f"incomplete lane {case_id}: {run_dir}")
        lane_records = by_lane.pop(case_id, [])
        if any(record.get("cache") != expected_lane["cache"] for record in lane_records):
            raise harness.HarnessError(
                f"raw cache classification/output contract mismatch in lane {case_id}: {run_dir}"
            )
        indices = [record.get("index") for record in lane_records]
        if len(indices) != len(set(indices)):
            raise harness.HarnessError(f"duplicate sample index in lane {case_id}: {run_dir}")
        if lane_summary.get("policy") != expected_lane["policy"]:
            raise harness.HarnessError(f"manifest policy mismatch in lane {case_id}: {run_dir}")
        for record in lane_records:
            _revalidate_record_eligibility(
                record, expected_lane, environment, run_dir
            )
        expected_target = _expected_target(expected_lane["policy"], lane_records)
        if lane_summary.get("target_valid_samples") != expected_target:
            raise harness.HarnessError(f"manifest target mismatch in lane {case_id}: {run_dir}")
        _validate_lane_schedule(
            expected_lane["policy"], lane_records, expected_target, case_id
        )
        recomputed = harness.summarize_lane(
            {"case_id": case_id, "policy": expected_lane["policy"]},
            lane_records,
            expected_target,
        )
        if recomputed != lane_summary:
            raise harness.HarnessError(
                f"lane summary does not match raw samples for {case_id}: {run_dir}"
            )
        verified_lanes[case_id] = lane_summary
    if by_lane:
        raise harness.HarnessError(
            f"samples reference lanes absent from summary: {sorted(by_lane)}"
        )

    return {
        "run_dir": run_dir,
        "run_id": summary["run_id"],
        "manifest": manifest,
        "schema": schema,
        "fingerprint": fingerprint,
        "environment_path": environment_path,
        "summary_path": summary_path,
        "samples_path": samples_path,
        "manifest_path": manifest_path,
        "schema_path": schema_path,
        "records": records,
        "lanes": verified_lanes,
    }


def _state_rollup(records: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    included = [record for record in records if record["included"]]
    metrics: dict[str, Any] = {}
    for field in (
        "wall_ns",
        "cpu_user_ns",
        "cpu_kernel_ns",
        "peak_root_rss_bytes",
        "sampled_peak_tree_rss_bytes",
        "max_worker_peak_rss_bytes",
        "peak_job_commit_bytes",
    ):
        values = [record[field] for record in included if record.get(field) is not None]
        if values:
            metrics[field] = harness._metric_stats(values)
    return {
        "raw_samples": len(records),
        "included_samples": len(included),
        "metrics": metrics,
        "compiler_phase_timing": harness._summarize_compiler_phase_timing(included),
    }


def _unpaired_descriptive_control(
    lane_origin: Mapping[str, Mapping[str, Any]],
) -> dict[str, Any]:
    required = {
        f"tiny_hello_check{suffix}_{state}"
        for suffix in ("", "_no_phase")
        for state in ("cold", "warm")
    }
    if not required.issubset(lane_origin):
        return {}
    result: dict[str, Any] = {}
    for state in ("cold", "warm"):
        timed = lane_origin[f"tiny_hello_check_{state}"]["summary"]["metrics"]["wall_ns"]
        control = lane_origin[f"tiny_hello_check_no_phase_{state}"]["summary"]["metrics"]["wall_ns"]
        fields = ("median", "mad", "empirical_p95")
        delta = {
            field: timed[field] - control[field]
            for field in fields
            if field in timed and field in control
        }
        ratio = {
            field: timed[field] / control[field]
            for field in fields
            if field in timed and field in control and control[field] != 0
        }
        result[state] = {
            "unit": "ns",
            "timed_wall_ns": timed,
            "control_wall_ns": control,
            "delta_ns": delta,
            "ratio": ratio,
        }
    return result


def combine_runs(run_dirs: Sequence[Path], output: Path) -> dict[str, Any]:
    resolved = [path.resolve() for path in run_dirs]
    if not resolved:
        raise harness.HarnessError("provide at least one --run-dir")
    if len(resolved) != len(set(resolved)):
        raise harness.HarnessError("duplicate run directory")
    runs = [_load_run(path) for path in resolved]
    run_ids = [run["run_id"] for run in runs]
    if len(run_ids) != len(set(run_ids)):
        raise harness.HarnessError("duplicate run identity")
    fingerprint = runs[0]["fingerprint"]
    for run in runs[1:]:
        if run["fingerprint"] != fingerprint:
            raise harness.HarnessError(
                f"run identity/toolchain drift: {run['run_dir']} differs from {runs[0]['run_dir']}"
            )

    manifest = runs[0]["manifest"]
    expected_lanes = harness.expand_lanes(manifest)
    expected_ids = [lane["case_id"] for lane in expected_lanes]
    lane_origin: dict[str, dict[str, Any]] = {}
    all_records: list[dict[str, Any]] = []
    all_sample_ids: set[str] = set()
    for run in runs:
        for case_id, lane_summary in run["lanes"].items():
            if case_id in lane_origin:
                raise harness.HarnessError(f"duplicate lane across runs: {case_id}")
            lane_origin[case_id] = {
                "run_id": run["run_id"],
                "run_dir": str(run["run_dir"]),
                "summary": lane_summary,
            }
        for record in run["records"]:
            if record["sample_id"] in all_sample_ids:
                raise harness.HarnessError(
                    f"duplicate sample identity across runs: {record['sample_id']}"
                )
            all_sample_ids.add(record["sample_id"])
            all_records.append(record)
    actual_ids = set(lane_origin)
    if actual_ids != set(expected_ids):
        raise harness.HarnessError(
            "combined lane coverage mismatch: "
            f"missing={sorted(set(expected_ids) - actual_ids)}, "
            f"unknown={sorted(actual_ids - set(expected_ids))}"
        )

    harness._prepare_output(output.resolve())
    output = output.resolve()
    shutil.copyfile(runs[0]["manifest_path"], output / "manifest.snapshot.json")
    shutil.copyfile(runs[0]["schema_path"], output / "result.schema.json")
    records_by_lane: dict[str, list[dict[str, Any]]] = {}
    for record in all_records:
        records_by_lane.setdefault(record["case_id"], []).append(record)
    ordered_records: list[dict[str, Any]] = []
    for case_id in expected_ids:
        ordered_records.extend(
            sorted(records_by_lane[case_id], key=lambda record: record["index"])
        )
    combined_samples = output / "combined-samples.jsonl"
    with combined_samples.open("w", encoding="utf-8", newline="\n") as stream:
        for record in ordered_records:
            stream.write(harness._json_line(record) + "\n")

    coverage: list[dict[str, Any]] = []
    for template in manifest["lanes"]:
        base = template["case_id"]
        states: dict[str, Any] = {}
        for state in ("cold", "warm"):
            case_id = f"{base}_{state}"
            origin = lane_origin[case_id]
            states[state] = {
                "case_id": case_id,
                "run_id": origin["run_id"],
                "valid_samples": origin["summary"]["valid_samples"],
                "attempts": origin["summary"]["attempts"],
            }
        coverage.append({"base_case_id": base, "states": states})

    ordered_lanes = [
        {"run_id": lane_origin[case_id]["run_id"], **lane_origin[case_id]["summary"]}
        for case_id in expected_ids
    ]
    state_records = {
        state: [record for record in ordered_records if record["cache"]["thinlto_cache"] == state]
        for state in ("cold", "warm")
    }
    summary = {
        "schema": COMBINED_SCHEMA,
        "created_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "identity": fingerprint,
        "inputs": [
            {
                "run_id": run["run_id"],
                "run_dir": str(run["run_dir"]),
                "environment": harness._file_record(run["environment_path"]),
                "summary": harness._file_record(run["summary_path"]),
                "samples": harness._file_record(run["samples_path"]),
                "lanes": sorted(run["lanes"]),
            }
            for run in runs
        ],
        "combined_samples_jsonl": harness._file_record(combined_samples),
        "coverage": {
            "expected_lane_count": len(expected_ids),
            "actual_lane_count": len(lane_origin),
            "cold_lane_count": sum(case_id.endswith("_cold") for case_id in expected_ids),
            "warm_lane_count": sum(case_id.endswith("_warm") for case_id in expected_ids),
            "matrix": coverage,
        },
        "cache_states": {
            state: _state_rollup(records) for state, records in state_records.items()
        },
        "unpaired_descriptive_control": _unpaired_descriptive_control(lane_origin),
        "lanes": ordered_lanes,
        "complete": True,
    }
    harness._json_dump(output / "combined-summary.json", summary)
    return summary


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-dir", action="append", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    summary = combine_runs(args.run_dir, args.output)
    print(
        harness._json_line(
            {
                "combined_summary": str((args.output.resolve() / "combined-summary.json")),
                "complete": summary["complete"],
            }
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except harness.HarnessError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
