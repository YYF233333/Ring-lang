"""Build the tracked C bootstrap into a fresh benchmark output directory.

This helper mirrors ``compiler/scripts/build_native.ps1`` without writing root
artifacts.  Its JSONL phase trace lets the B-176 harness retain compile/runtime/
link wall-time composition while the enclosing Job Object owns exact totals.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Sequence


def _write_trace(stream: object, value: dict[str, object]) -> None:
    stream.write(json.dumps(value, sort_keys=True) + "\n")
    stream.flush()


def _run_stage(
    name: str,
    argv: Sequence[str],
    *,
    cwd: Path,
    trace_stream: object,
) -> int:
    start_ns = time.perf_counter_ns()
    completed = subprocess.run(list(argv), cwd=cwd, check=False)
    wall_ns = time.perf_counter_ns() - start_ns
    _write_trace(
        trace_stream,
        {
            "schema": "ring.check-benchmark.bootstrap-phase.v1",
            "phase": name,
            "argv": list(argv),
            "wall_ns": wall_ns,
            "exit_code": completed.returncode,
        },
    )
    return completed.returncode


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--clang", required=True)
    parser.add_argument("--clangxx", required=True)
    parser.add_argument("--cache", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    repo = args.repo.resolve()
    output = args.output_dir.resolve()
    if output.exists():
        if not output.is_dir() or any(output.iterdir()):
            print(f"ERROR: output directory must be fresh and empty: {output}", file=sys.stderr)
            return 2
    else:
        output.mkdir(parents=True)
    args.cache.mkdir(parents=True, exist_ok=True)

    anchor = repo / "compiler" / "dist-c" / "main.c"
    runtime = repo / "ring_runtime.cpp"
    if not anchor.is_file() or not runtime.is_file():
        print("ERROR: tracked C anchor or runtime is missing", file=sys.stderr)
        return 2

    compiler_object = output / "ring_compiler_lto.o"
    runtime_object = output / "ring_runtime_lto.o"
    executable = output / "ring.exe"
    trace = output / "phase-trace.jsonl"
    commands = [
        (
            "anchor_compile",
            [
                args.clang,
                "-c",
                str(anchor),
                "-o",
                str(compiler_object),
                "-std=c11",
                "-O3",
                "-flto=thin",
            ],
        ),
        (
            "runtime_compile",
            [
                args.clangxx,
                "-c",
                str(runtime),
                "-o",
                str(runtime_object),
                "-std=c++17",
                "-D_CRT_SECURE_NO_WARNINGS",
                "-O3",
                "-flto=thin",
            ],
        ),
        (
            "link",
            [
                args.clang,
                str(compiler_object),
                str(runtime_object),
                "-o",
                str(executable),
                "-lmsvcrt",
                "-Wl,/STACK:536870912",
                "-Wl,/MANIFEST:EMBED",
                "-Wl,/MANIFESTUAC:level='asInvoker'",
                "-flto=thin",
                "-fuse-ld=lld",
                f"-Wl,/lldltocache:{args.cache.resolve()}",
                (
                    "-Wl,/lldltocachepolicy:cache_size_bytes=1073741824:"
                    "cache_size_files=4096:prune_after=168h"
                ),
            ],
        ),
    ]

    with trace.open("w", encoding="utf-8", newline="\n") as trace_stream:
        for name, command in commands:
            exit_code = _run_stage(name, command, cwd=repo, trace_stream=trace_stream)
            if exit_code != 0:
                return exit_code
    print(f"Built: {executable}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
