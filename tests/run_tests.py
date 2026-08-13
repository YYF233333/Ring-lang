#!/usr/bin/env python3
"""
Ring-lang Python test runner (B-151 P2).

Replaces the retired Node-based test harnesses with a single C-native Python
runner that depends only on the stdlib.

Usage:
    python tests/run_tests.py                        # all suites
    python tests/run_tests.py --suite e2e            # single-file e2e
    python tests/run_tests.py --suite golden         # golden snapshots
    python tests/run_tests.py --suite rc             # RC verify sweep
    python tests/run_tests.py --suite self-compile   # tracked dist-c fixed point
    python tests/run_tests.py --suite structural     # generated-C structural gates
    python tests/run_tests.py --suite parity         # static evidence matrix
    python tests/run_tests.py --filter substr        # only cases matching substr
    python tests/run_tests.py --update-golden        # regenerate .expected
"""

from __future__ import annotations

import argparse
import ast
import atexit
import hashlib
import json
import os
import re
import shutil
import subprocess
import symtable
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

REPO = Path(__file__).resolve().parent.parent
CASES_DIR = REPO / "tests" / "cases"
GOLDEN_CASES_DIR = CASES_DIR / "golden"
NATIVE_ONLY_DIR = CASES_DIR / "native_only"
MODULES_DIR = CASES_DIR / "modules"
RC_NEG_DIR = CASES_DIR / "verify_rc"
RUNTIME_CPP = REPO / "ring_runtime.cpp"
RUNTIME_O = REPO / "ring_runtime.o"
DIST_C_DIR = REPO / "compiler" / "dist-c"
DIST_C_MAIN = DIST_C_DIR / "main.c"
THINLTO_CACHE = Path(tempfile.gettempdir()) / "ring-lang-thinlto-cache"
PARITY_MATRIX = REPO / "tests" / "parity_matrix.json"
STRUCTURAL_DIR = CASES_DIR / "structural"
CODEGEN_C_SOURCE = REPO / "compiler" / "codegen_c.ring"
NATIVE_REAL_PROGRAM = REPO / "tests" / "native" / "real_program.ring"
NATIVE_REAL_PROGRAM_EXPECTED = NATIVE_REAL_PROGRAM.with_suffix(".expected")

# CLI-observable contracts that used to live in the retired in-process Node
# harness.  Keeping them explicit prevents companion discovery from silently
# dropping parser-recovery and rich-diagnostic coverage.
RECOVERY_CASES = (
    "error_recovery_match.ring",
    "error_recovery_handle.ring",
    "error_recovery_if.ring",
)

# Frontend-positive ownership contracts that deliberately have no execution
# companion.  They are checked with the exact compiler supplied to the runner;
# no C build or source-text oracle may stand in for acceptance.
POSITIVE_CHECK_ONLY_CASES = (
    "tests/cases/ownership_callable_or_pattern_projection_paths.ring",
)

ANSI_ESCAPE_RE = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
RC_FINDING_RE = re.compile(
    r"^(.+):(\d+):(\d+)\s+rc-verify\[([^\]]+)\]\s+(.+)$",
    re.MULTILINE,
)
RC_SUMMARY_RE = re.compile(
    r"^RC verify:\s*(\d+) errors?,\s*(\d+) exempt \(documented\) findings$",
    re.MULTILINE,
)
RC_EXEMPT_RE = re.compile(r"^rc-verify exempt classes:\s*(.*)$", re.MULTILINE)
RC_BOUNDARY_MARKER = "HIR-level proof. Codegen-level drops are outside this check"
RING_TAGGED_INT_MIN = -(1 << 62)
RING_TAGGED_INT_MAX = (1 << 62) - 1
CALLABLE_INFERENCE_TERM_LIMIT = 4_000_000_000_000_000_000


@dataclass(frozen=True)
class RcFindingLine:
    file: str
    line: int
    column: int
    category: str
    message: str


@dataclass(frozen=True)
class RcReport:
    fatal: int
    exempt: int
    exempt_counts: Dict[str, int]
    findings: Tuple[RcFindingLine, ...]


@dataclass(frozen=True)
class RcInvocationContract:
    name: str
    fixture: str
    args: Tuple[str, ...]
    exit_zero: bool
    strict: bool = False
    fatal_exact: Optional[int] = None
    fatal_min: int = 0
    local_finding_exact: Optional[int] = None
    exempt_min: int = 0
    exempt_counts: Tuple[Tuple[str, int], ...] = ()
    finding_counts: Tuple[Tuple[str, int], ...] = ()
    global_finding_counts: Tuple[Tuple[str, int], ...] = ()
    finding_lines: Tuple[Tuple[str, Tuple[int, ...]], ...] = ()
    finding_function_bindings: Tuple[Tuple[str, str, str], ...] = ()

# Generated-C evidence owned by the structural suite.  This map is also the
# parity contract: every fixture below must exist, every structural .ring file
# must appear exactly once, and the matching matrix row must list the same set.
C_LINE_BUILD_CASES = (
    (
        "single-file",
        "tests/cases/structural/c_line_single.ring",
        ("tests/cases/structural/c_line_single.ring",),
    ),
    (
        "minimal-project",
        "tests/cases/structural/c_line_project/main.ring",
        (
            "tests/cases/structural/c_line_project/main.ring",
            "tests/cases/structural/c_line_project/probe.ring",
        ),
    ),
)
EXTERN_RC_FIXTURE = "tests/cases/structural/extern_handle_rc.ring"
CLOSURE_ENV_RC_FIXTURE = (
    "tests/cases/structural/closure_env_rc_mask.ring"
)
SPREAD_SOURCE_SEQUENCE_FIXTURE = (
    "tests/cases/structural/spread_source_sequence.ring"
)
STRUCTURAL_ORACLE_FIXTURES = {
    "backend.c_line_directives": tuple(
        fixture
        for _, _, fixtures in C_LINE_BUILD_CASES
        for fixture in fixtures
    ),
    "backend.extern_handle_rc_structural": (EXTERN_RC_FIXTURE,),
    "backend.closure_env_rc_mask_structural": (CLOSURE_ENV_RC_FIXTURE,),
    "backend.spread_source_sequence_structural": (
        SPREAD_SOURCE_SEQUENCE_FIXTURE,
    ),
}

# Subdirectories within tests/cases/ that also contain negative test cases.
EXTRA_NEG_DIRS = ["negative", "errors"]

TIMEOUT_COMPILE = 60   # seconds, for ring.exe build / check
TIMEOUT_LINK = 60      # seconds, for clang link
TIMEOUT_COMPILER_LINK = 300  # cold ThinLTO link on slower CI hosts
TIMEOUT_RUN = 30       # seconds, per test program execution
TIMEOUT_SELFCOMPILE = 1200  # seconds, for self-compile / rc self-verify (900 was
                            # exceeded after B-170; clean builds take ~18 min)

PHASE_TIMING_SCHEMA = "ring.test-runner-phase.v1"
PHASE_TIMING_VERSION = 1
PHASE_TIMING_FIELDS = frozenset({
    "schema", "version", "sequence", "suite", "case", "stage",
    "duration_ns", "executed", "complete", "outcome", "exit_code",
    "command_category",
})

# Every retained gap carries an actionable reason instead of a bare skip name.
SHARED_POSITIVE_GAPS = {}

# Positive cases whose `ring check` itself fails today.  Unlike shared
# execution gaps, these are frontend blockers, so every lane
# that would compile or RC-verify the case (golden/e2e/native/module, rc) must
# skip it with the same actionable reason.
CHECK_BLOCKED_POSITIVE_GAPS = {}

CHECK_ONLY_GAPS = {}

# Windows-specific clang link flags.
# /MANIFEST:EMBED + /MANIFESTUAC:asInvoker prevents Windows Installer Detection
# from requiring elevation for test exes whose names contain "update"/"install"/etc.
CLANG_LINK_FLAGS = [
    # Keep every test link on LLD.  On hosted Windows runners, clang's default
    # MSVC linker/manifest path can exhaust the runner's USER-handle allowance
    # and return 1158 before the first executable is produced.  The compiler
    # link already used LLD; using the same path here is both faster and stable.
    "-fuse-ld=lld",
    "-lmsvcrt",
    "-Wl,/STACK:536870912",
    "-Wl,/MANIFEST:EMBED",
    "-Wl,/MANIFESTUAC:level='asInvoker'",
]

# The self-hosted compiler is CPU-bound. O3 + ThinLTO is about 20% faster on a
# compiler/main.ring check than the former O2 build. The content-addressed LLD
# cache makes repeat links effectively free while bounding cache growth.
COMPILER_COMPILE_FLAGS = ["-O3", "-flto=thin"]
COMPILER_LINK_FLAGS = [
    "-flto=thin",
    f"-Wl,/lldltocache:{THINLTO_CACHE}",
    (
        "-Wl,/lldltocachepolicy:cache_size_bytes=1073741824:"
        "cache_size_files=4096:prune_after=168h"
    ),
]

# ---------------------------------------------------------------------------
# Result tracking
# ---------------------------------------------------------------------------

class TestResult:
    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"

    def __init__(self, status: str, suite: str, name: str, detail: str = ""):
        self.status = status
        self.suite = suite
        self.name = name
        self.detail = detail

    def __str__(self) -> str:
        tag = f"[{self.status}]"
        label = f"{self.suite}: {self.name}"
        if self.detail:
            return f"{tag} {label} -- {self.detail}"
        return f"{tag} {label}"


class ResultCollector:
    def __init__(self) -> None:
        self.results: List[TestResult] = []

    def add(self, r: TestResult) -> None:
        self.results.append(r)
        print(str(r), flush=True)

    def summary(self) -> dict[str, dict[str, int]]:
        """Return {suite: {pass: N, fail: N, skip: N}}."""
        out: dict[str, dict[str, int]] = {}
        for r in self.results:
            if r.suite not in out:
                out[r.suite] = {"pass": 0, "fail": 0, "skip": 0}
            key = r.status.lower()
            out[r.suite][key] = out[r.suite].get(key, 0) + 1
        return out

    @property
    def failures(self) -> int:
        return sum(1 for r in self.results if r.status == TestResult.FAIL)


# ---------------------------------------------------------------------------
# Opt-in phase timing
# ---------------------------------------------------------------------------

@dataclass
class _SuitePhaseState:
    name: str
    started_ns: int
    child_duration_ns: int = 0


class PhaseTimingTrace:
    """Monotonic JSONL trace for the explicitly enabled timing mode."""

    def __init__(self, output_path: str) -> None:
        self._stream = open(output_path, "w", encoding="utf-8", newline="\n")
        self._sequence = 0
        self._runner_started_ns = time.perf_counter_ns()
        self._runner_accounted_ns = 0
        self._suite_state: Optional[_SuitePhaseState] = None
        self._finished = False

    @property
    def current_suite(self) -> Optional[str]:
        if self._suite_state is None:
            return None
        return self._suite_state.name

    def close(self) -> None:
        self._stream.close()

    def _emit(
        self,
        *,
        suite: Optional[str],
        case: Optional[str],
        stage: str,
        duration_ns: int,
        executed: bool,
        complete: bool,
        outcome: str,
        exit_code: Optional[int],
        command_category: Optional[str],
    ) -> None:
        self._sequence += 1
        record = {
            "schema": PHASE_TIMING_SCHEMA,
            "version": PHASE_TIMING_VERSION,
            "sequence": self._sequence,
            "suite": suite,
            "case": case,
            "stage": stage,
            "duration_ns": max(0, duration_ns),
            "executed": executed,
            "complete": complete,
            "outcome": outcome,
            "exit_code": exit_code,
            "command_category": command_category,
        }
        self._stream.write(json.dumps(
            record, sort_keys=True, separators=(",", ":"), allow_nan=False,
        ))
        self._stream.write("\n")
        self._stream.flush()

    def _account_child(self, suite: Optional[str], duration_ns: int) -> None:
        if self._suite_state is not None and suite == self._suite_state.name:
            self._suite_state.child_duration_ns += duration_ns
        else:
            self._runner_accounted_ns += duration_ns

    def record_stage(
        self,
        *,
        suite: Optional[str],
        case: Optional[str],
        stage: str,
        duration_ns: int,
        executed: bool,
        complete: bool,
        outcome: str,
        exit_code: Optional[int] = None,
        command_category: Optional[str] = None,
    ) -> None:
        """Record a non-overlapping stage measured by runner orchestration."""
        self._account_child(suite, duration_ns)
        self._emit(
            suite=suite, case=case, stage=stage, duration_ns=duration_ns,
            executed=executed, complete=complete, outcome=outcome,
            exit_code=exit_code, command_category=command_category,
        )

    def run_subprocess(
        self,
        stage: str,
        command: Sequence[str],
        *,
        suite: Optional[str],
        case: Optional[str],
        command_category: str,
        run_kwargs: Dict[str, Any],
    ) -> subprocess.CompletedProcess:
        started_ns = time.perf_counter_ns()
        try:
            result = subprocess.run(command, **run_kwargs)
        except subprocess.TimeoutExpired:
            duration_ns = time.perf_counter_ns() - started_ns
            self._account_child(suite, duration_ns)
            self._emit(
                suite=suite, case=case, stage=stage, duration_ns=duration_ns,
                executed=True, complete=False, outcome="timeout",
                exit_code=None, command_category=command_category,
            )
            raise
        except subprocess.CalledProcessError as exc:
            duration_ns = time.perf_counter_ns() - started_ns
            self._account_child(suite, duration_ns)
            self._emit(
                suite=suite, case=case, stage=stage, duration_ns=duration_ns,
                executed=True, complete=True, outcome="nonzero",
                exit_code=exc.returncode, command_category=command_category,
            )
            raise
        except OSError:
            duration_ns = time.perf_counter_ns() - started_ns
            self._account_child(suite, duration_ns)
            self._emit(
                suite=suite, case=case, stage=stage, duration_ns=duration_ns,
                executed=False, complete=False, outcome="spawn-error",
                exit_code=None, command_category=command_category,
            )
            raise
        except BaseException:
            duration_ns = time.perf_counter_ns() - started_ns
            self._account_child(suite, duration_ns)
            self._emit(
                suite=suite, case=case, stage=stage, duration_ns=duration_ns,
                executed=True, complete=False, outcome="exception",
                exit_code=None, command_category=command_category,
            )
            raise

        duration_ns = time.perf_counter_ns() - started_ns
        self._account_child(suite, duration_ns)
        exit_code = result.returncode
        self._emit(
            suite=suite, case=case, stage=stage, duration_ns=duration_ns,
            executed=True, complete=True,
            outcome="success" if exit_code == 0 else "nonzero",
            exit_code=exit_code, command_category=command_category,
        )
        return result

    def run_suite(self, suite: str, callback: Callable[[], None]) -> None:
        if self._suite_state is not None:
            raise RuntimeError("phase-timed suites must not be nested")
        state = _SuitePhaseState(suite, time.perf_counter_ns())
        self._suite_state = state
        complete = False
        outcome = "exception"
        exit_code: Optional[int] = None
        try:
            callback()
            complete = True
            outcome = "completed"
        except subprocess.TimeoutExpired:
            outcome = "timeout"
            raise
        except subprocess.CalledProcessError as exc:
            outcome = "nonzero"
            exit_code = exc.returncode
            raise
        finally:
            duration_ns = time.perf_counter_ns() - state.started_ns
            self._suite_state = None
            residual_ns = max(0, duration_ns - state.child_duration_ns)
            self._emit(
                suite=suite, case=None, stage="orchestration_residual",
                duration_ns=residual_ns, executed=True, complete=complete,
                outcome=outcome, exit_code=exit_code, command_category=None,
            )
            self._emit(
                suite=suite, case=None, stage="suite_total",
                duration_ns=duration_ns, executed=True, complete=complete,
                outcome=outcome, exit_code=exit_code, command_category=None,
            )
            self._runner_accounted_ns += duration_ns

    def finish(self, *, complete: bool, outcome: str,
               exit_code: Optional[int]) -> None:
        if self._finished:
            return
        self._finished = True
        duration_ns = time.perf_counter_ns() - self._runner_started_ns
        residual_ns = max(0, duration_ns - self._runner_accounted_ns)
        self._emit(
            suite=None, case="runner", stage="orchestration_residual",
            duration_ns=residual_ns, executed=True, complete=complete,
            outcome=outcome, exit_code=exit_code, command_category=None,
        )
        self._emit(
            suite=None, case="runner", stage="runner_total",
            duration_ns=duration_ns, executed=True, complete=complete,
            outcome=outcome, exit_code=exit_code, command_category=None,
        )


_PHASE_TRACER: Optional[PhaseTimingTrace] = None


def _phase_timing_path(value: str) -> str:
    if not os.path.isabs(value):
        raise argparse.ArgumentTypeError(
            "--phase-timing requires an absolute output path")
    return value


def _phase_command_category(stage: str) -> str:
    if stage in {"ring_check", "ring_build"}:
        return "ring"
    if stage == "run_exe":
        return "generated-program"
    return "clang"


def _run_subprocess(
    stage: str,
    command: Sequence[str],
    *,
    phase_suite: Optional[str] = None,
    phase_case: Optional[str] = None,
    **run_kwargs: Any,
) -> subprocess.CompletedProcess:
    """Run one child, adding timing only when the trace is explicitly enabled."""
    tracer = _PHASE_TRACER
    if tracer is None:
        return subprocess.run(command, **run_kwargs)
    suite = phase_suite if phase_suite is not None else tracer.current_suite
    case = phase_case if phase_case is not None else (
        "runner" if suite is None else None
    )
    return tracer.run_subprocess(
        stage, command, suite=suite, case=case,
        command_category=_phase_command_category(stage),
        run_kwargs=run_kwargs,
    )


def _run_timed_suite(suite: str, callback: Callable[[], None]) -> None:
    tracer = _PHASE_TRACER
    if tracer is None:
        callback()
        return
    tracer.run_suite(suite, callback)


# ---------------------------------------------------------------------------
# Tool discovery
# ---------------------------------------------------------------------------

def find_clang() -> Optional[str]:
    """Return the clang executable path, or None."""
    return shutil.which("clang")


def find_ring_exe() -> Optional[str]:
    """Build the compiler executable from the tracked dist-c source anchor."""

    exe_name = "ring.exe" if sys.platform == "win32" else "ring"
    if not DIST_C_MAIN.is_file():
        return None

    clang = find_clang()
    if clang is None:
        return None

    # Compile and link in a temp directory, so test discovery never trusts a
    # stale root ring.exe or a compiler from PATH.
    tmpdir = tempfile.mkdtemp(prefix="ring_build_")
    atexit.register(shutil.rmtree, tmpdir, True)
    object_path = os.path.join(tmpdir, "main.o")
    runtime_object_path = os.path.join(tmpdir, "runtime.o")
    exe_path = os.path.join(tmpdir, exe_name)

    try:
        THINLTO_CACHE.mkdir(parents=True, exist_ok=True)
        _run_subprocess(
            "compiler_anchor_compile",
            [
                clang, "-std=c11", *COMPILER_COMPILE_FLAGS,
                "-c", str(DIST_C_MAIN),
                "-o", object_path,
            ],
            check=True,
            capture_output=True,
            timeout=TIMEOUT_SELFCOMPILE,
            cwd=str(REPO),
        )
        cpp_compiler = shutil.which("clang++")
        if cpp_compiler:
            runtime_cmd = [
                cpp_compiler, "-std=c++17", *COMPILER_COMPILE_FLAGS,
                "-D_CRT_SECURE_NO_WARNINGS", "-c", str(RUNTIME_CPP),
                "-o", runtime_object_path,
            ]
        else:
            runtime_cmd = [
                clang, "-x", "c++", "-std=c++17", *COMPILER_COMPILE_FLAGS,
                "-D_CRT_SECURE_NO_WARNINGS", "-c", str(RUNTIME_CPP),
                "-o", runtime_object_path,
            ]
        _run_subprocess(
            "compiler_runtime_compile",
            runtime_cmd,
            check=True,
            capture_output=True,
            timeout=TIMEOUT_COMPILE,
            cwd=str(REPO),
        )
        link_cmd = [
            clang, object_path, runtime_object_path, "-o", exe_path,
            *CLANG_LINK_FLAGS, *COMPILER_LINK_FLAGS,
        ]
        _run_subprocess(
            "compiler_link",
            link_cmd, check=True, capture_output=True,
            timeout=TIMEOUT_COMPILER_LINK,
            cwd=str(REPO),
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        shutil.rmtree(tmpdir, ignore_errors=True)
        return None

    if os.path.isfile(exe_path):
        return exe_path

    shutil.rmtree(tmpdir, ignore_errors=True)
    return None


def ensure_runtime(clang: str) -> bool:
    """Build ring_runtime.o from ring_runtime.cpp if missing or stale."""
    tracer = _PHASE_TRACER
    prepare_started_ns = (
        time.perf_counter_ns() if tracer is not None else None
    )
    if not RUNTIME_CPP.is_file():
        if tracer is not None and prepare_started_ns is not None:
            tracer.record_stage(
                suite=None, case="runner", stage="runtime_prepare",
                duration_ns=time.perf_counter_ns() - prepare_started_ns,
                executed=False, complete=False, outcome="missing-input",
            )
        return False
    if RUNTIME_O.is_file():
        if RUNTIME_O.stat().st_mtime >= RUNTIME_CPP.stat().st_mtime:
            if tracer is not None and prepare_started_ns is not None:
                tracer.record_stage(
                    suite=None, case="runner", stage="runtime_prepare",
                    duration_ns=time.perf_counter_ns() - prepare_started_ns,
                    executed=False, complete=True, outcome="cached",
                )
            return True
    cmd = [
        clang, "-c", str(RUNTIME_CPP), "-o", str(RUNTIME_O),
        "-std=c++17", "-O2", "-D_CRT_SECURE_NO_WARNINGS",
    ]
    try:
        # Use clang++ for C++ files -- clang can link C++ but compiling needs
        # the C++ frontend (clang++ or clang -x c++).
        cpp_cmd = list(cmd)
        cpp_compiler = shutil.which("clang++")
        if cpp_compiler:
            cpp_cmd[0] = cpp_compiler
        else:
            # Fall back to clang -x c++
            cpp_cmd = [clang, "-x", "c++"] + cmd[1:]
        _run_subprocess(
            "runtime_prepare", cpp_cmd, check=True, capture_output=True,
            timeout=TIMEOUT_COMPILE, cwd=str(REPO),
        )
        return RUNTIME_O.is_file()
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        return False


# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------

def norm(s: str) -> str:
    """Normalize CRLF to LF."""
    return s.replace("\r\n", "\n")


def matches_filter(name: str, name_filter: Optional[str]) -> bool:
    """Case-insensitive substring match; no filter matches everything.

    Backslashes are normalized to '/' so filters work on Windows.
    """
    if not name_filter:
        return True
    return name_filter.replace("\\", "/").lower() in name.replace("\\", "/").lower()


def positive_check_only_exact_filter(name_filter: Optional[str]) -> bool:
    """Return whether the filter names exactly one registered positive check."""
    if not name_filter:
        return False
    normalized_filter = name_filter.replace("\\", "/").casefold()
    for fixture in POSITIVE_CHECK_ONLY_CASES:
        ring_file = REPO / fixture
        rel = ring_file.relative_to(CASES_DIR).as_posix()
        exact_names = {
            fixture.casefold(),
            rel.casefold(),
            ring_file.name.casefold(),
        }
        if normalized_filter in exact_names:
            return True
    return False


def pure_positive_check_only_e2e_selection(
    suites: List[str],
    name_filter: Optional[str],
) -> bool:
    """Recognize an e2e invocation that can only execute frontend checks."""
    return set(suites) == {"e2e"} and positive_check_only_exact_filter(name_filter)


def normalized_repo_path(path) -> str:
    """Normalize an absolute or repo-relative path to forward-slash form."""
    text = str(path).replace("\\", "/")
    candidate = Path(text)
    if not candidate.is_absolute():
        candidate = REPO / candidate
    return candidate.resolve().relative_to(REPO.resolve()).as_posix()


def _phase_file_identity(path: str) -> str:
    """Return a stable case identity without exposing file contents."""
    try:
        return normalized_repo_path(path)
    except ValueError:
        return Path(path).name


def _phase_relative_identity(path: Path, prefix: str = "") -> str:
    """Return a platform-independent identity for an already-relative case."""
    return prefix + path.as_posix()


def check_blocked_gap_reason(case_path) -> Optional[str]:
    """Return the frontend-blocker reason for a positive case, if any."""
    key = normalized_repo_path(case_path)
    if key in CHECK_BLOCKED_POSITIVE_GAPS:
        return f"known check-blocked positive: {CHECK_BLOCKED_POSITIVE_GAPS[key]}"
    return None


def positive_gap_reason(case_path) -> Optional[str]:
    """Return an execution-gap reason for a positive C-native case, if any."""
    blocked = check_blocked_gap_reason(case_path)
    if blocked:
        return blocked
    key = normalized_repo_path(case_path)
    if key in SHARED_POSITIVE_GAPS:
        return f"known shared positive gap: {SHARED_POSITIVE_GAPS[key]}"
    return None


def is_expect_panic(expected_raw: str) -> bool:
    """Whether the first non-blank expected line requests a non-zero exit."""
    first = next((line.strip() for line in expected_raw.splitlines()
                  if line.strip()), "")
    return first == "// EXPECT_PANIC"


def case_expects_panic(ring_file: Path, expected_raw: str) -> bool:
    """EXPECT_PANIC is valid only for the handwritten native-only lane."""
    return (
        ring_file.resolve().parent == NATIVE_ONLY_DIR.resolve()
        and is_expect_panic(expected_raw)
    )


# ---------------------------------------------------------------------------
# Compile + link + run helpers
# ---------------------------------------------------------------------------

# Ring diagnostics and program output are UTF-8 contracts.  Windows CI's
# locale may be a legacy code page, so every decoded child-process stream must
# opt into UTF-8 instead of inheriting locale.getpreferredencoding().

def ring_build(ring_exe: str, ring_file: str, *,
               out_dir: Optional[str] = None,
               extra_args: Optional[List[str]] = None,
               timeout: int = TIMEOUT_COMPILE,
               phase_suite: Optional[str] = None,
               phase_case: Optional[str] = None) -> subprocess.CompletedProcess:
    """Run the C-only ring.exe build with optional extra flags."""
    cmd = [ring_exe, "build", ring_file, "--target=c"]
    if out_dir:
        # Use --out-dir=<path> (equals-sign) form; ring.exe CLI parser does
        # not accept --out-dir <path> as two separate arguments.
        cmd.append(f"--out-dir={out_dir}")
    if extra_args:
        cmd.extend(extra_args)
    if _PHASE_TRACER is not None and phase_case is None:
        phase_case = _phase_file_identity(ring_file)
    return _run_subprocess(
        "ring_build", cmd,
        phase_suite=phase_suite, phase_case=phase_case,
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        timeout=timeout, cwd=str(REPO),
    )


def ring_check(ring_exe: str, ring_file: str, *,
               extra_args: Optional[List[str]] = None,
               timeout: int = TIMEOUT_COMPILE,
               phase_suite: Optional[str] = None,
               phase_case: Optional[str] = None) -> subprocess.CompletedProcess:
    """Run ring.exe check <file> [extra_args...]."""
    cmd = [ring_exe, "check", ring_file]
    if extra_args:
        cmd.extend(extra_args)
    if _PHASE_TRACER is not None and phase_case is None:
        phase_case = _phase_file_identity(ring_file)
    return _run_subprocess(
        "ring_check", cmd, phase_suite=phase_suite, phase_case=phase_case,
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        timeout=timeout, cwd=str(REPO),
    )


def clang_link(clang: str, o_file: str, exe_file: str, *,
               phase_suite: Optional[str] = None,
               phase_case: Optional[str] = None) -> subprocess.CompletedProcess:
    """Link .o + runtime into an executable."""
    cmd = [clang, o_file, str(RUNTIME_O), "-o", exe_file, *CLANG_LINK_FLAGS]
    return _run_subprocess(
        "clang_link", cmd, phase_suite=phase_suite, phase_case=phase_case,
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        timeout=TIMEOUT_LINK, cwd=str(REPO),
    )


def run_exe(exe_path: str, timeout: int = TIMEOUT_RUN, *,
            phase_suite: Optional[str] = None,
            phase_case: Optional[str] = None) -> subprocess.CompletedProcess:
    """Execute a linked test binary."""
    return _run_subprocess(
        "run_exe", [exe_path], phase_suite=phase_suite, phase_case=phase_case,
        capture_output=True, text=True, encoding="utf-8",
        errors="replace", timeout=timeout, cwd=str(REPO),
    )


# ---------------------------------------------------------------------------
# Test-case helpers
# ---------------------------------------------------------------------------

def compile_link_run(ring_exe: str, clang_path: str, ring_file: str,
                     tmpdir: str, *,
                     expect_panic: bool = False,
                     phase_suite: Optional[str] = None,
                     phase_case: Optional[str] = None) -> Tuple[bool, str, str]:
    """Compile a .ring file, link, run, return (ok, stdout, error_detail).

    On success, ok=True and stdout contains the program output.
    On failure, ok=False and error_detail describes the failure.

    The C backend compiles with --out-dir=<tmpdir> (contract: emits
    <tmpdir>/<base>.c and <tmpdir>/<base>.o) so no artifacts land next to the
    test sources.
    """
    base = Path(ring_file).stem

    out_dir = tmpdir

    # Compile
    try:
        r = ring_build(
            ring_exe, ring_file, out_dir=out_dir,
            phase_suite=phase_suite, phase_case=phase_case,
        )
    except subprocess.TimeoutExpired:
        return False, "", "compile timed out"

    if r.returncode != 0:
        return False, "", f"compile failed (exit {r.returncode}): {(r.stderr or r.stdout or '')[:500]}"

    # Locate the .o file
    o_file = os.path.join(out_dir, base + ".o")

    if not os.path.isfile(o_file):
        return False, "", f".o file not found: {o_file}"

    # Link
    exe_file = os.path.join(tmpdir, base + ".exe")
    try:
        r = clang_link(
            clang_path, o_file, exe_file,
            phase_suite=phase_suite, phase_case=phase_case,
        )
    except subprocess.TimeoutExpired:
        return False, "", "link timed out"

    if r.returncode != 0:
        return False, "", f"link failed (exit {r.returncode}): {(r.stderr or '')[:500]}"

    # Run
    try:
        r = run_exe(
            exe_file, phase_suite=phase_suite, phase_case=phase_case,
        )
    except subprocess.TimeoutExpired:
        return False, "", "execution timed out (30s)"

    if expect_panic:
        if r.returncode == 0:
            return False, r.stdout, (
                "expected panic (non-zero exit), but program exited 0: "
                f"{(r.stdout or '')[:300]}"
            )
        return True, r.stdout, ""

    if r.returncode != 0:
        return False, "", f"runtime crash (exit {r.returncode}): {(r.stderr or '')[:300]}"

    return True, r.stdout, ""


# ---------------------------------------------------------------------------
# E2E suite
# ---------------------------------------------------------------------------

def discover_positive_cases(directory: Path) -> List[Path]:
    """Return sorted list of .ring files that have a corresponding .expected."""
    if not directory.is_dir():
        return []
    cases = []
    for f in sorted(directory.iterdir()):
        if f.suffix == ".ring" and f.with_suffix(".expected").is_file():
            cases.append(f)
    return cases


def discover_negative_cases(directory: Path) -> List[Path]:
    """Return sorted list of .ring files that have a corresponding .error."""
    if not directory.is_dir():
        return []
    cases = []
    for f in sorted(directory.iterdir()):
        if f.suffix == ".ring" and f.with_suffix(".error").is_file():
            cases.append(f)
    return cases


def run_positive_check_only_cases(
    ring_exe: str,
    collector: ResultCollector,
    *,
    name_filter: Optional[str] = None,
    check_runner: Callable[..., subprocess.CompletedProcess] = ring_check,
) -> None:
    """Require explicitly registered frontend-positive cases to check cleanly."""
    suite = "e2e"
    for fixture in POSITIVE_CHECK_ONLY_CASES:
        ring_file = REPO / fixture
        rel = ring_file.relative_to(CASES_DIR)
        label = f"check-pos:{rel}"

        if not (
            matches_filter(fixture, name_filter)
            or matches_filter(str(rel), name_filter)
        ):
            continue
        if not ring_file.is_file():
            collector.add(TestResult(
                TestResult.FAIL, suite, label,
                f"positive check-only fixture not found: {fixture}",
            ))
            continue

        try:
            result = check_runner(ring_exe, str(ring_file))
        except subprocess.TimeoutExpired:
            collector.add(TestResult(
                TestResult.FAIL, suite, label, "check timed out"))
            continue

        if result.returncode == 0:
            collector.add(TestResult(TestResult.PASS, suite, label))
            continue

        combined = (result.stdout or "") + (result.stderr or "")
        collector.add(TestResult(
            TestResult.FAIL, suite, label,
            f"expected check exit 0, got {result.returncode}: {combined[:300]}",
        ))


def error_contract_failure(contract_text: str, output: str) -> Optional[str]:
    """Return why compiler output violates a .error contract, if it does.

    Legacy contracts without a `!` line remain one exact multiline substring.
    Contracts containing `!` treat each non-empty line independently: ordinary
    lines are required substrings and `!pattern` lines are forbidden substrings.
    """
    contract = contract_text.strip()
    if not contract:
        return "malformed .error contract: empty or whitespace-only"

    lines = [line.strip() for line in contract.splitlines() if line.strip()]
    has_forbidden = any(line.startswith("!") for line in lines)
    if has_forbidden:
        required = [line for line in lines if not line.startswith("!")]
        forbidden: List[str] = []
        for line in lines:
            if line.startswith("!"):
                pattern = line[1:].strip()
                if not pattern:
                    return "malformed .error contract: empty forbidden pattern"
                forbidden.append(pattern)
        if not required:
            return (
                "malformed .error contract: forbidden-pattern mode requires "
                "at least one required pattern"
            )
    else:
        required = [contract]
        forbidden = []

    output_lower = output.lower()
    for pattern in required:
        if pattern.lower() not in output_lower:
            return f'missing required diagnostic pattern "{pattern}"'
    for pattern in forbidden:
        if pattern.lower() in output_lower:
            return f'found forbidden diagnostic pattern "{pattern}"'
    return None


def discover_module_positive(modules_dir: Path) -> List[Path]:
    """Return sorted list of module main.ring files that have main.expected."""
    if not modules_dir.is_dir():
        return []
    cases = []
    for d in sorted(modules_dir.iterdir()):
        if d.is_dir():
            main = d / "main.ring"
            expected = d / "main.expected"
            if main.is_file() and expected.is_file():
                cases.append(main)
    return cases


def discover_module_negative(modules_dir: Path) -> List[Path]:
    """Return sorted list of module main.ring files that have main.error."""
    if not modules_dir.is_dir():
        return []
    cases = []
    for d in sorted(modules_dir.iterdir()):
        if d.is_dir():
            main = d / "main.ring"
            error = d / "main.error"
            if main.is_file() and error.is_file():
                cases.append(main)
    return cases


def run_cli_diagnostic_contracts(
    ring_exe: str,
    collector: ResultCollector,
    *,
    name_filter: Optional[str] = None,
) -> None:
    """Run unique recovery/warning/formatter contracts from the old E2E harness."""
    suite = "e2e"

    def execute(label: str, fixture: Path, args: List[str], validator) -> None:
        fixture_key = normalized_repo_path(fixture)
        if not (
            matches_filter(label, name_filter)
            or matches_filter(fixture_key, name_filter)
        ):
            return
        if not fixture.is_file():
            collector.add(TestResult(
                TestResult.FAIL, suite, label,
                f"diagnostic fixture not found: {fixture_key}",
            ))
            return
        try:
            result = ring_check(
                ring_exe, str(fixture), extra_args=args,
                phase_suite=suite, phase_case=label,
            )
        except subprocess.TimeoutExpired:
            collector.add(TestResult(TestResult.FAIL, suite, label, "check timed out"))
            return
        failure = validator(result)
        collector.add(TestResult(
            TestResult.PASS if failure is None else TestResult.FAIL,
            suite,
            label,
            failure or "",
        ))

    def llm_error(
        result: subprocess.CompletedProcess,
        code: str,
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        if result.returncode == 0:
            return None, "expected non-zero exit, got 0"
        diagnostics, failure = llm_diagnostics(result.stdout or "")
        if failure is not None or diagnostics is None:
            return None, failure
        diagnostic = diagnostic_by_code(diagnostics, code)
        if diagnostic is None:
            return None, f"expected {code} in LLM diagnostics"
        return diagnostic, None

    def warning_failure(
        result: subprocess.CompletedProcess,
        code: str,
        *,
        llm: bool,
        line: Optional[int] = None,
    ) -> Optional[str]:
        if result.returncode != 0:
            return f"expected warning-only exit 0, got {result.returncode}"
        if "OK" not in (result.stdout or ""):
            return f"expected OK on stdout, got: {(result.stdout or '')[:200]}"
        stderr = result.stderr or ""
        if llm:
            diagnostics, failure = llm_diagnostics(stderr)
            if failure is not None or diagnostics is None:
                return failure
            diagnostic = diagnostic_by_code(diagnostics, code)
            if diagnostic is None or diagnostic.get("severity") != "warning":
                return f"expected warning diagnostic {code} in LLM JSON"
            if line is not None:
                span = diagnostic.get("span")
                if not isinstance(span, dict) or span.get("line") != line:
                    return f"expected {code} span on line {line}, got {span!r}"
            return None
        human = strip_ansi(stderr)
        if f"warning[{code}]" not in human:
            return f"expected warning[{code}] on stderr, got: {human[:300]}"
        if line is not None and f":{line}:" not in human:
            return f"expected {code} source span on line {line}"
        return None

    def recovery_failure(result: subprocess.CompletedProcess) -> Optional[str]:
        if result.returncode == 0:
            return "expected recovered parse/type diagnostics to exit non-zero"
        output = strip_ansi(process_output(result))
        match = re.search(r"\[debug\]\s+parse-recovery\s+decls=(\d+)", output)
        if match is None:
            return "missing '[debug] parse-recovery decls=<N>' marker"
        if int(match.group(1)) < 2:
            return f"expected at least 2 recovered declarations, got {match.group(1)}"
        for code in ("E0103", "E0301"):
            if code not in output:
                return f"expected recovered diagnostic {code}, got: {output[:500]}"
        return None

    def suggestion_human_failure(result: subprocess.CompletedProcess) -> Optional[str]:
        if result.returncode == 0:
            return "expected type mismatch to exit non-zero"
        output = strip_ansi(result.stderr or "")
        for pattern in ("error[E0301]", "help:", "parse_int", "note:", "expected"):
            if pattern not in output:
                return f"human diagnostic omitted {pattern!r}: {output[:500]}"
        return None

    def suggestion_llm_failure(result: subprocess.CompletedProcess) -> Optional[str]:
        diagnostic, failure = llm_error(result, "E0301")
        if failure is not None or diagnostic is None:
            return failure
        if diagnostic.get("category") != "type":
            return f"expected category 'type', got {diagnostic.get('category')!r}"
        suggestions = diagnostic.get("suggestions")
        if not isinstance(suggestions, list) or not suggestions:
            return "expected at least one conversion suggestion"
        if "parse_int" not in " ".join(
            str(item.get("message", "")) for item in suggestions
            if isinstance(item, dict)
        ):
            return "expected parse_int in LLM suggestions"
        notes = diagnostic.get("notes")
        if not isinstance(notes, list) or len(notes) < 2:
            return "expected at least two type-constraint notes"
        first = str(notes[0].get("message", "")) if isinstance(notes[0], dict) else ""
        second = str(notes[1].get("message", "")) if isinstance(notes[1], dict) else ""
        if "expected" not in first or "Int" not in first:
            return f"first constraint note lost expected Int: {first!r}"
        if "Str" not in second:
            return f"second constraint note lost actual Str: {second!r}"
        return None

    def return_notes_failure(result: subprocess.CompletedProcess) -> Optional[str]:
        diagnostic, failure = llm_error(result, "E0301")
        if failure is not None or diagnostic is None:
            return failure
        notes = diagnostic.get("notes")
        if not isinstance(notes, list) or len(notes) < 2:
            return "expected at least two return-type constraint notes"
        text = " ".join(
            str(item.get("message", "")) for item in notes
            if isinstance(item, dict)
        )
        if "return type" not in text and "declared" not in text:
            return f"missing declared return-type note: {text!r}"
        if "body" not in text and "evaluates" not in text:
            return f"missing function-body type note: {text!r}"
        return None

    def empty_list_failure(result: subprocess.CompletedProcess) -> Optional[str]:
        diagnostic, failure = llm_error(result, "E0301")
        if failure is not None or diagnostic is None:
            return failure
        suggestions = diagnostic.get("suggestions")
        if not isinstance(suggestions, list):
            return "expected empty-list suggestions array"
        matching = [
            item for item in suggestions
            if isinstance(item, dict)
            and (
                "type annotation" in str(item.get("message", ""))
                or "List<" in str(item.get("message", ""))
            )
        ]
        if not matching:
            return "expected an empty-list type-annotation suggestion"
        if matching[0].get("replacement") is None:
            return "expected replacement text for empty-list suggestion"
        return None

    def effect_failure(result: subprocess.CompletedProcess) -> Optional[str]:
        diagnostic, failure = llm_error(result, "E0403")
        if failure is not None or diagnostic is None:
            return failure
        notes = diagnostic.get("notes")
        if not isinstance(notes, list):
            return "expected unhandled-effect notes array"
        note_text = " ".join(
            str(item.get("message", "")) for item in notes
            if isinstance(item, dict)
        )
        if "Logger" not in note_text:
            return f"expected Logger in unhandled-effect notes: {note_text!r}"
        suggestions = diagnostic.get("suggestions")
        if not isinstance(suggestions, list) or not suggestions:
            return "expected an unhandled-effect suggestion"
        matching = [
            item for item in suggestions
            if isinstance(item, dict)
            and "handle" in str(item.get("message", "")).lower()
            and "Logger" in str(item.get("message", ""))
        ]
        if not matching:
            return "expected suggestion to handle the Logger effect"
        replacement = matching[0].get("replacement")
        if not isinstance(replacement, str) or "handle" not in replacement:
            return "expected handle replacement in LLM suggestion"
        return None

    def parse_llm_failure(result: subprocess.CompletedProcess) -> Optional[str]:
        if result.returncode == 0:
            return "expected parse errors to exit non-zero"
        diagnostics, failure = llm_diagnostics(result.stdout or "")
        if failure is not None or diagnostics is None:
            return failure
        first_code = diagnostics[0].get("code")
        if not isinstance(first_code, str) or not first_code.startswith("E01"):
            return f"expected first LLM diagnostic to be a parse error, got {first_code!r}"
        return None

    def json_derive_span_failure(
        result: subprocess.CompletedProcess,
    ) -> Optional[str]:
        diagnostic, failure = llm_error(result, "E0503")
        if failure is not None or diagnostic is None:
            return failure
        if diagnostic.get("message") != (
            "Cannot derive Json for 'JsonFieldMissing': every field must "
            "provide Json evidence"
        ):
            return f"unexpected first E0503: {diagnostic.get('message')!r}"
        span = diagnostic.get("span")
        expected = {"line": 4, "col": 0, "end_line": 4, "end_col": 13}
        if span != expected:
            return f"expected exact @derive(Json) span {expected!r}, got {span!r}"
        return None

    def clean_llm_failure(result: subprocess.CompletedProcess) -> Optional[str]:
        if result.returncode != 0:
            return f"expected clean check exit 0, got {result.returncode}"
        if "OK" not in (result.stdout or ""):
            return f"expected OK on stdout, got: {(result.stdout or '')[:200]}"
        if (result.stderr or "").strip():
            return f"clean LLM check emitted diagnostics: {(result.stderr or '')[:300]}"
        return None

    def module_llm_failure(
        result: subprocess.CompletedProcess, code: str,
    ) -> Optional[str]:
        if result.returncode == 0:
            return "expected module diagnostic to exit non-zero"
        diagnostics, failure = module_llm_diagnostics(result.stderr or "")
        if failure is not None or diagnostics is None:
            return failure
        actual = diagnostics[0].get("code")
        if actual != code:
            return f"expected first module diagnostic {code}, got {actual!r}"
        return None

    for recovery_name in RECOVERY_CASES:
        execute(
            f"recovery:{recovery_name}",
            CASES_DIR / recovery_name,
            ["--debug"],
            recovery_failure,
        )

    execute(
        "warning:catch-pure-W0001",
        CASES_DIR / "catch_pure_expr.ring",
        [],
        lambda result: warning_failure(result, "W0001", llm=False),
    )
    execute(
        "warning:where-W0002-human",
        CASES_DIR / "where_clause_warning.ring",
        [],
        lambda result: warning_failure(result, "W0002", llm=False, line=11),
    )
    execute(
        "warning:where-W0002-llm",
        CASES_DIR / "where_clause_warning.ring",
        ["--error-format=llm"],
        lambda result: warning_failure(result, "W0002", llm=True, line=11),
    )
    execute(
        "diagnostic:type-suggestion-human",
        CASES_DIR / "error_with_suggestion.ring",
        [],
        suggestion_human_failure,
    )
    execute(
        "diagnostic:type-suggestion-llm",
        CASES_DIR / "error_with_suggestion.ring",
        ["--error-format=llm"],
        suggestion_llm_failure,
    )
    execute(
        "diagnostic:return-notes-llm",
        CASES_DIR / "error_diagnostic_notes.ring",
        ["--error-format=llm"],
        return_notes_failure,
    )
    execute(
        "diagnostic:empty-list-suggestion-llm",
        CASES_DIR / "error_empty_list_suggestion.ring",
        ["--error-format=llm"],
        empty_list_failure,
    )
    execute(
        "diagnostic:effect-suggestion-llm",
        CASES_DIR / "error_effect_suggestion.ring",
        ["--error-format=llm"],
        effect_failure,
    )
    execute(
        "diagnostic:parse-errors-llm-schema",
        CASES_DIR / "error_multi_parse.ring",
        ["--error-format=llm"],
        parse_llm_failure,
    )
    execute(
        "diagnostic:json-derive-E0503-span-llm",
        CASES_DIR / "error_json_derive_field_missing.ring",
        ["--error-format=llm"],
        json_derive_span_failure,
    )
    execute(
        "diagnostic:clean-check-llm",
        CASES_DIR / "hello.ring",
        ["--error-format=llm"],
        clean_llm_failure,
    )
    execute(
        "diagnostic:module-resolver-E0702-llm",
        MODULES_DIR / "error_not_found" / "main.ring",
        ["--error-format=llm"],
        lambda result: module_llm_failure(result, "E0702"),
    )
    execute(
        "diagnostic:module-checker-E0703-llm",
        MODULES_DIR / "error_symbol_not_found" / "main.ring",
        ["--error-format=llm"],
        lambda result: module_llm_failure(result, "E0703"),
    )


def run_native_real_program_contract(
    ring_exe: str,
    clang_path: str,
    collector: ResultCollector,
    *,
    name_filter: Optional[str] = None,
) -> None:
    """Preserve the repeated native-frontend/RC regression and execute it."""
    suite = "e2e"
    key = "tests/native/real_program.ring"
    if not (
        matches_filter("native-real-program", name_filter)
        or matches_filter(key, name_filter)
    ):
        return
    if not NATIVE_REAL_PROGRAM.is_file() or not NATIVE_REAL_PROGRAM_EXPECTED.is_file():
        collector.add(TestResult(
            TestResult.FAIL, suite, "native-real-program",
            "real_program.ring or its .expected companion is missing",
        ))
        return

    rc_contract = RcInvocationContract(
        name="native-real-program RC",
        fixture=key,
        args=("--verify-rc",),
        exit_zero=True,
        fatal_exact=0,
    )
    for run_number in range(1, 4):
        label = f"native-real-program:frontend+rc {run_number}/3"
        try:
            result = ring_check(
                ring_exe,
                str(NATIVE_REAL_PROGRAM),
                extra_args=list(rc_contract.args),
                phase_suite=suite,
                phase_case=label,
            )
        except subprocess.TimeoutExpired:
            collector.add(TestResult(TestResult.FAIL, suite, label, "check timed out"))
            continue
        failure = rc_contract_failure(rc_contract, result.returncode, process_output(result))
        collector.add(TestResult(
            TestResult.PASS if failure is None else TestResult.FAIL,
            suite,
            label,
            failure or "",
        ))

    expected = norm(NATIVE_REAL_PROGRAM_EXPECTED.read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory(prefix="ring_real_program_") as tmpdir:
        ok, stdout, detail = compile_link_run(
            ring_exe, clang_path, str(NATIVE_REAL_PROGRAM), tmpdir,
            phase_suite=suite,
            phase_case="native-real-program:execute 1/3",
        )
        first_failure = detail if not ok else None
        if ok and norm(stdout) != expected:
            first_failure = f"expected {expected!r}, got {norm(stdout)!r}"
        collector.add(TestResult(
            TestResult.PASS if first_failure is None else TestResult.FAIL,
            suite,
            "native-real-program:execute 1/3",
            first_failure or "",
        ))
        if not ok:
            for run_number in (2, 3):
                collector.add(TestResult(
                    TestResult.FAIL, suite,
                    f"native-real-program:execute {run_number}/3",
                    "first compile/link/run failed",
                ))
            return
        executable = os.path.join(tmpdir, "real_program.exe")
        for run_number in (2, 3):
            label = f"native-real-program:execute {run_number}/3"
            try:
                result = run_exe(
                    executable, phase_suite=suite, phase_case=label,
                )
            except subprocess.TimeoutExpired:
                collector.add(TestResult(TestResult.FAIL, suite, label, "execution timed out"))
                continue
            failure = None
            if result.returncode != 0:
                failure = f"runtime crash (exit {result.returncode}): {(result.stderr or '')[:300]}"
            elif norm(result.stdout or "") != expected:
                failure = f"expected {expected!r}, got {norm(result.stdout or '')!r}"
            collector.add(TestResult(
                TestResult.PASS if failure is None else TestResult.FAIL,
                suite,
                label,
                failure or "",
            ))


def run_e2e(ring_exe: str, clang_path: str, collector: ResultCollector, *,
            name_filter: Optional[str] = None) -> None:
    """Run the E2E test suite."""
    suite = "e2e"
    check_only_exact = positive_check_only_exact_filter(name_filter)

    # --- Positive single-file cases ---
    positive = [] if check_only_exact else discover_positive_cases(CASES_DIR)
    # Also include cases from subdirectories (negative/, errors/) that have .expected
    if not check_only_exact:
        for subdir_name in EXTRA_NEG_DIRS:
            subdir = CASES_DIR / subdir_name
            positive.extend(discover_positive_cases(subdir))
        # Hand-written native semantic oracles, including EXPECT_PANIC cases.
        positive.extend(discover_positive_cases(NATIVE_ONLY_DIR))

    with tempfile.TemporaryDirectory(prefix="ring_e2e_") as tmpdir:
        for ring_file in positive:
            name = ring_file.name
            rel = ring_file.relative_to(CASES_DIR)

            if not matches_filter(str(rel), name_filter):
                continue

            gap_reason = positive_gap_reason(ring_file)
            if gap_reason:
                collector.add(TestResult(
                    TestResult.SKIP, suite, str(rel), gap_reason))
                continue

            expected_file = ring_file.with_suffix(".expected")
            expected_raw = expected_file.read_text(encoding="utf-8")
            expect_panic = case_expects_panic(ring_file, expected_raw)
            expected = norm(expected_raw)

            ok, stdout, detail = compile_link_run(ring_exe, clang_path, str(ring_file),
                                                  tmpdir,
                                                  expect_panic=expect_panic,
                                                  phase_suite=suite,
                                                  phase_case=_phase_relative_identity(rel))
            if not ok:
                collector.add(TestResult(TestResult.FAIL, suite, str(rel), detail))
                continue

            if expect_panic:
                collector.add(TestResult(
                    TestResult.PASS, suite, str(rel), "expected panic observed"))
                continue

            actual = norm(stdout)
            if actual == expected:
                collector.add(TestResult(TestResult.PASS, suite, str(rel)))
            else:
                # Show a concise diff
                exp_repr = repr(expected[:200])
                act_repr = repr(actual[:200])
                collector.add(TestResult(
                    TestResult.FAIL, suite, str(rel),
                    f"expected {exp_repr}, got {act_repr}"))

    # --- Positive check-only cases ---
    run_positive_check_only_cases(
        ring_exe, collector, name_filter=name_filter)
    if check_only_exact:
        return

    # --- Negative single-file cases ---
    negative = discover_negative_cases(CASES_DIR)
    for subdir_name in EXTRA_NEG_DIRS:
        subdir = CASES_DIR / subdir_name
        negative.extend(discover_negative_cases(subdir))

    for ring_file in negative:
        rel = ring_file.relative_to(CASES_DIR)
        name = ring_file.name

        # Negative cases go through `ring check` only -- backend-independent.
        if not matches_filter(str(rel), name_filter):
            continue

        check_key = normalized_repo_path(ring_file)
        if check_key in CHECK_ONLY_GAPS:
            collector.add(TestResult(
                TestResult.SKIP, suite, f"neg:{rel}",
                f"known check-only gap: {CHECK_ONLY_GAPS[check_key]}"))
            continue

        error_file = ring_file.with_suffix(".error")
        contract = error_file.read_text(encoding="utf-8")

        try:
            r = ring_check(
                ring_exe, str(ring_file), phase_suite=suite,
                phase_case=_phase_relative_identity(rel, "neg:"),
            )
        except subprocess.TimeoutExpired:
            collector.add(TestResult(TestResult.FAIL, suite, f"neg:{rel}", "check timed out"))
            continue

        if r.returncode == 0:
            collector.add(TestResult(
                TestResult.FAIL, suite, f"neg:{rel}",
                "expected non-zero exit, got 0"))
            continue

        # Check all output (stdout + stderr) against the companion contract.
        combined = (r.stdout or "") + (r.stderr or "")
        contract_failure = error_contract_failure(contract, combined)
        if contract_failure is None:
            collector.add(TestResult(TestResult.PASS, suite, f"neg:{rel}"))
        else:
            collector.add(TestResult(
                TestResult.FAIL, suite, f"neg:{rel}",
                f"{contract_failure}; output: {combined[:300]}"))

    # --- Module positive ---
    mod_positive = discover_module_positive(MODULES_DIR)
    with tempfile.TemporaryDirectory(prefix="ring_mod_") as tmpdir:
        for main_file in mod_positive:
            mod_name = main_file.parent.name

            if not matches_filter(f"mod:{mod_name}", name_filter):
                continue

            expected_file = main_file.parent / "main.expected"
            expected = norm(expected_file.read_text(encoding="utf-8"))

            # Per-case work dir: module cases all emit "main.o", so a shared
            # directory would let a case that failed to place its artifact
            # silently link a predecessor's main.o and run the wrong binary.
            case_dir = os.path.join(tmpdir, mod_name)
            os.makedirs(case_dir, exist_ok=True)
            ok, stdout, detail = compile_link_run(
                ring_exe, clang_path, str(main_file), case_dir,
                phase_suite=suite, phase_case=f"mod:{mod_name}",
            )
            if not ok:
                collector.add(TestResult(TestResult.FAIL, suite, f"mod:{mod_name}", detail))
                continue

            actual = norm(stdout)
            if actual == expected:
                collector.add(TestResult(TestResult.PASS, suite, f"mod:{mod_name}"))
            else:
                exp_repr = repr(expected[:200])
                act_repr = repr(actual[:200])
                collector.add(TestResult(
                    TestResult.FAIL, suite, f"mod:{mod_name}",
                    f"expected {exp_repr}, got {act_repr}"))

    # --- Module negative ---
    mod_negative = discover_module_negative(MODULES_DIR)
    for main_file in mod_negative:
        mod_name = main_file.parent.name

        # check-only, backend-independent (see single-file negative above)
        if not matches_filter(f"mod-neg:{mod_name}", name_filter):
            continue

        error_file = main_file.parent / "main.error"
        contract = error_file.read_text(encoding="utf-8")

        try:
            r = ring_check(
                ring_exe, str(main_file), phase_suite=suite,
                phase_case=f"mod-neg:{mod_name}",
            )
        except subprocess.TimeoutExpired:
            collector.add(TestResult(TestResult.FAIL, suite, f"mod-neg:{mod_name}", "timed out"))
            continue

        if r.returncode == 0:
            collector.add(TestResult(
                TestResult.FAIL, suite, f"mod-neg:{mod_name}",
                "expected non-zero exit, got 0"))
            continue

        combined = (r.stdout or "") + (r.stderr or "")
        contract_failure = error_contract_failure(contract, combined)
        if contract_failure is None:
            collector.add(TestResult(TestResult.PASS, suite, f"mod-neg:{mod_name}"))
        else:
            collector.add(TestResult(
                TestResult.FAIL, suite, f"mod-neg:{mod_name}",
                f"{contract_failure}; output: {combined[:300]}"))

    run_cli_diagnostic_contracts(
        ring_exe, collector, name_filter=name_filter,
    )
    run_native_real_program_contract(
        ring_exe, clang_path, collector, name_filter=name_filter,
    )


# ---------------------------------------------------------------------------
# Golden-snapshot suite
# ---------------------------------------------------------------------------

def run_golden(ring_exe: str, clang_path: str, collector: ResultCollector,
               *, update_golden: bool = False,
               name_filter: Optional[str] = None) -> None:
    """Run the C-native golden-snapshot regression suite."""
    suite = "golden"
    cases = discover_positive_cases(GOLDEN_CASES_DIR)
    if not cases:
        print(f"WARNING: no golden cases found in {GOLDEN_CASES_DIR}", file=sys.stderr)
        return

    with tempfile.TemporaryDirectory(prefix="ring_golden_") as tmpdir:
        for ring_file in cases:
            name = ring_file.name
            expected_file = ring_file.with_suffix(".expected")

            if not matches_filter(name, name_filter):
                continue

            gap_reason = positive_gap_reason(ring_file)
            if gap_reason:
                collector.add(TestResult(
                    TestResult.SKIP, suite, name, gap_reason))
                continue

            ok, stdout, detail = compile_link_run(ring_exe, clang_path, str(ring_file),
                                                  tmpdir, phase_suite=suite,
                                                  phase_case=name)
            if not ok:
                collector.add(TestResult(TestResult.FAIL, suite, name, detail))
                continue

            actual = norm(stdout)

            if update_golden:
                expected_file.write_text(actual, encoding="utf-8")
                collector.add(TestResult(TestResult.PASS, suite, name, "golden updated"))
                continue

            expected = norm(expected_file.read_text(encoding="utf-8"))
            if actual == expected:
                collector.add(TestResult(TestResult.PASS, suite, name))
            else:
                exp_repr = repr(expected[:200])
                act_repr = repr(actual[:200])
                collector.add(TestResult(
                    TestResult.FAIL, suite, name,
                    f"expected {exp_repr}, got {act_repr}"))


# ---------------------------------------------------------------------------
# Generated-C structural suite (C-native codegen invariants)
# ---------------------------------------------------------------------------

C_LINE_MARKER_RE = re.compile(
    r"\blet\s+(c_line_marker_[a-z][a-z0-9_]*)\b")
C_LINE_DIRECTIVE_RE = re.compile(
    r'#line[ \t]+(?P<line>[0-9]+)[ \t]+"'
    r'(?P<path>(?:\\.|[^"\\])*)"[ \t]*')


def structural_fixture_paths() -> set[str]:
    """Return every .ring fixture owned by the structural suite."""
    if not STRUCTURAL_DIR.is_dir():
        return set()
    return {
        repo_relative(path)
        for path in STRUCTURAL_DIR.rglob("*.ring")
        if path.is_file()
    }


def ring_line_markers(path: Path) -> Tuple[List[Tuple[str, int]], Optional[str]]:
    """Find real-code line markers, ignoring lookalikes in strings/comments."""
    try:
        source = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        return [], f"cannot read {display_path(path)}: {exc}"
    masked = mask_ring_strings_and_comments(source)
    markers = []
    for match in C_LINE_MARKER_RE.finditer(masked):
        line = masked.count("\n", 0, match.start(1)) + 1
        markers.append((match.group(1), line))
    return markers, None


def extract_ring_function_body(
    source: str,
    function_name: str,
) -> Tuple[Optional[str], Optional[str]]:
    """Extract one named Ring fixture function body, ignoring decoy text."""
    masked = mask_ring_strings_and_comments(source)
    headers = list(re.finditer(
        rf"\bfn\s+{re.escape(function_name)}\b", masked))
    bodies: List[Tuple[int, int]] = []
    errors: List[str] = []
    for header in headers:
        cursor = header.end()
        while cursor < len(masked) and masked[cursor].isspace():
            cursor += 1
        if cursor < len(masked) and masked[cursor] == "<":
            try:
                cursor = matching_delimiter(masked, cursor, "<", ">") + 1
            except ValueError as exc:
                errors.append(str(exc))
                continue
            while cursor < len(masked) and masked[cursor].isspace():
                cursor += 1
        if cursor >= len(masked) or masked[cursor] != "(":
            continue
        try:
            params_close = matching_delimiter(masked, cursor, "(", ")")
        except ValueError as exc:
            errors.append(str(exc))
            continue
        cursor = params_close + 1
        open_index = -1
        while cursor < len(masked):
            candidate = masked.find("{", cursor)
            if candidate < 0:
                break
            if re.search(r"\bwith\s*$", masked[cursor:candidate]):
                try:
                    cursor = matching_delimiter(
                        masked, candidate, "{", "}") + 1
                except ValueError as exc:
                    errors.append(str(exc))
                    break
                continue
            open_index = candidate
            break
        if open_index < 0:
            continue
        try:
            close_index = matching_delimiter(masked, open_index, "{", "}")
        except ValueError as exc:
            errors.append(str(exc))
            continue
        bodies.append((open_index, close_index))
    if len(bodies) != 1:
        detail = f"; {errors[0]}" if errors else ""
        return None, (
            f"Ring function {function_name} found {len(bodies)} bodies"
            f"{detail}"
        )
    open_index, close_index = bodies[0]
    return source[open_index + 1:close_index], None


EXTERN_FIXTURE_CONTRACTS = (
    (
        "raw extern type",
        r"\bextern\s+type\s+StructuralRawHandle\b",
    ),
    (
        "raw/owned holder field order",
        r"\bstruct\s+StructuralHolder\s*\{\s*"
        r"raw\s*:\s*StructuralRawHandle\s*,\s*owned\s*:\s*Str\s*\}",
    ),
    (
        "raw/owned enum variant order",
        r"\benum\s+StructuralChoice\s*\{\s*"
        r"Raw\s*\(\s*StructuralRawHandle\s*\)\s*,\s*"
        r"Owned\s*\(\s*Str\s*\)\s*\}",
    ),
    (
        "raw identity parameter",
        r"\bfn\s+structural_raw_identity\s*\(\s*"
        r"value\s*:\s*StructuralRawHandle\s*\)\s*->\s*"
        r"StructuralRawHandle\b",
    ),
    (
        "owned identity parameter",
        r"\bfn\s+structural_owned_identity\s*\(\s*"
        r"value\s*:\s*Str\s*\)\s*->\s*Str\b",
    ),
    (
        "raw Option parameter",
        r"\bfn\s+structural_raw_option\s*\(\s*"
        r"value\s*:\s*StructuralRawHandle\s*\)",
    ),
    (
        "owned Option parameter",
        r"\bfn\s+structural_owned_option\s*\(\s*"
        r"value\s*:\s*Str\s*\)",
    ),
    (
        "raw List parameter",
        r"\bfn\s+structural_raw_list\s*\(\s*"
        r"value\s*:\s*StructuralRawHandle\s*\)",
    ),
    (
        "owned List parameter",
        r"\bfn\s+structural_owned_list\s*\(\s*"
        r"value\s*:\s*Str\s*\)",
    ),
    (
        "non-executing main",
        r"\bfn\s+main\s*\(\s*\)\s*\{\s*\}",
    ),
)

EXTERN_FUNCTION_BODY_CONTRACTS = {
    "structural_raw_identity": (
        r"\A\s*let\s+local\s*=\s*value\s+local\s*\Z"),
    "structural_owned_identity": (
        r"\A\s*let\s+local\s*=\s*value\s+local\s*\Z"),
    "structural_raw_option": (
        r"\A\s*let\s+wrapped\s*=\s*some\s*\(\s*value\s*\)\s*\Z"),
    "structural_owned_option": (
        r"\A\s*let\s+wrapped\s*=\s*some\s*\(\s*value\s*\)\s*\Z"),
    "structural_raw_list": (
        r"\A\s*let\s+mut\s+values\s*:\s*"
        r"List\s*<\s*StructuralRawHandle\s*>\s*=\s*\[\s*\]\s+"
        r"values\s*\.\s*push\s*\(\s*value\s*\)\s*\Z"),
    "structural_owned_list": (
        r"\A\s*let\s+mut\s+values\s*:\s*"
        r"List\s*<\s*Str\s*>\s*=\s*\[\s*\]\s+"
        r"values\s*\.\s*push\s*\(\s*value\s*\)\s*\Z"),
}


def extern_fixture_source_errors(extern_source: str) -> List[str]:
    """Validate that every named fixture body still performs its probe."""
    errors: List[str] = []
    masked = mask_ring_strings_and_comments(extern_source)
    for description, pattern in EXTERN_FIXTURE_CONTRACTS:
        count = len(re.findall(pattern, masked))
        if count != 1:
            errors.append(
                f"{EXTERN_RC_FIXTURE}: {description} contract matched "
                f"{count} times (expected 1)")
    for function_name, body_pattern in EXTERN_FUNCTION_BODY_CONTRACTS.items():
        body, extract_error = extract_ring_function_body(
            extern_source, function_name)
        if extract_error:
            errors.append(f"{EXTERN_RC_FIXTURE}: {extract_error}")
            continue
        masked_body = mask_ring_strings_and_comments(body)
        if re.fullmatch(body_pattern, masked_body) is None:
            errors.append(
                f"{EXTERN_RC_FIXTURE}: {function_name} body no longer "
                "matches its exact structural probe")
    return errors


CLOSURE_ENV_FIXTURE_CONTRACTS = (
    (
        "foreign handle declaration",
        r"\bextern\s+type\s+StructuralCaptureHandle\b",
    ),
    (
        "owner-bearing dead-capture type",
        r"\bstruct\s+StructuralDeadResource\s*\{\s*id\s*:\s*Int\s*\}"
        r"\s*impl\s+Drop\s+for\s+StructuralDeadResource\b",
    ),
    (
        "ordinary Ptr capture signature",
        r"\bfn\s+structural_ordinary_ptr_capture\s*\(\s*"
        r"value\s*:\s*Ptr\s*<\s*Int\s*>\s*\)\s*->\s*"
        r"fn\s*\(\s*\)\s*->\s*Int\b",
    ),
    (
        "ordinary foreign-handle capture signature",
        r"\bfn\s+structural_ordinary_handle_capture\s*\(\s*"
        r"value\s*:\s*StructuralCaptureHandle\s*\)\s*->\s*"
        r"fn\s*\(\s*\)\s*->\s*Int\b",
    ),
    (
        "ordinary List<foreign> capture signature",
        r"\bfn\s+structural_ordinary_list_handle_capture\s*\(\s*"
        r"values\s*:\s*List\s*<\s*StructuralCaptureHandle\s*>\s*\)"
        r"\s*->\s*fn\s*\(\s*\)\s*->\s*Int\b",
    ),
    (
        "ordinary Str control signature",
        r"\bfn\s+structural_ordinary_str_capture\s*\(\s*"
        r"value\s*:\s*Str\s*\)\s*->\s*fn\s*\(\s*\)\s*->\s*Int\b",
    ),
    (
        "handler Ptr capture signature",
        r"\bfn\s+structural_handler_ptr_capture\s*\(\s*"
        r"value\s*:\s*Ptr\s*<\s*Int\s*>\s*\)\s*->\s*Int\b",
    ),
    (
        "handler foreign-handle capture signature",
        r"\bfn\s+structural_handler_handle_capture\s*\(\s*"
        r"value\s*:\s*StructuralCaptureHandle\s*\)\s*->\s*Int\b",
    ),
    (
        "handler List<foreign> capture signature",
        r"\bfn\s+structural_handler_list_handle_capture\s*\(\s*"
        r"values\s*:\s*List\s*<\s*StructuralCaptureHandle\s*>\s*\)"
        r"\s*->\s*Int\b",
    ),
    (
        "handler Str control signature",
        r"\bfn\s+structural_handler_str_capture\s*\(\s*"
        r"value\s*:\s*Str\s*\)\s*->\s*Int\b",
    ),
    (
        "handler Int control signature",
        r"\bfn\s+structural_handler_int_capture\s*\(\s*"
        r"value\s*:\s*Int\s*\)\s*->\s*Int\b",
    ),
    (
        "effectful named function declaration",
        r"\bfn\s+structural_bound_read\s*\(\s*\)\s*->\s*Int\s*"
        r"with\s*\{\s*StructuralBoundRead\s*\}",
    ),
    (
        "local named-value wrapper signature",
        r"\bfn\s+structural_named_value_local\s*\(\s*\)\s*->\s*Int\b",
    ),
    (
        "early local named-value wrapper signature",
        r"\bfn\s+structural_named_value_early_local\s*\(\s*\)"
        r"\s*->\s*Int\b",
    ),
    (
        "dead lambda return signature",
        r"\bfn\s+structural_dead_lambda_return\s*\(\s*source\s*:\s*"
        r"StructuralDeadResource\s*\)\s*->\s*Int\b",
    ),
    (
        "dead lambda Never signature",
        r"\bfn\s+structural_dead_lambda_never\s*\(\s*source\s*:\s*"
        r"StructuralDeadResource\s*\)\s*->\s*Int\b",
    ),
    (
        "dead handler return signature",
        r"\bfn\s+structural_dead_handler_return\s*\(\s*source\s*:\s*"
        r"StructuralDeadResource\s*\)\s*->\s*Int\b",
    ),
    (
        "dead handler Never signature",
        r"\bfn\s+structural_dead_handler_never\s*\(\s*source\s*:\s*"
        r"StructuralDeadResource\s*\)\s*->\s*Int\b",
    ),
)

CLOSURE_ENV_FUNCTION_BODY_CONTRACTS = {
    "structural_ordinary_ptr_capture": (
        r"\A\s*fn\s*\(\s*\)\s*->\s*Int\s*\{\s*"
        r"observe_capture_ptr\s*\(\s*value\s*\)\s*\}\s*\Z"),
    "structural_ordinary_handle_capture": (
        r"\A\s*fn\s*\(\s*\)\s*->\s*Int\s*\{\s*"
        r"observe_capture_handle\s*\(\s*value\s*\)\s*\}\s*\Z"),
    "structural_ordinary_list_handle_capture": (
        r"\A\s*fn\s*\(\s*\)\s*->\s*Int\s*\{\s*"
        r"values\s*\.\s*len\s*\(\s*\)\s*\}\s*\Z"),
    "structural_ordinary_str_capture": (
        r"\A\s*fn\s*\(\s*\)\s*->\s*Int\s*\{\s*"
        r"value\s*\.\s*len\s*\(\s*\)\s*\}\s*\Z"),
    "structural_handler_ptr_capture": (
        r"\A\s*handle\s*\{\s*StructuralCaptureRead\.read\(\)\s*\}"
        r"\s*with\s*\{\s*StructuralCaptureRead\.read\(\)\s*=>\s*"
        r"observe_capture_ptr\(value\)\s*,\s*\}\s*\Z"),
    "structural_handler_handle_capture": (
        r"\A\s*handle\s*\{\s*StructuralCaptureRead\.read\(\)\s*\}"
        r"\s*with\s*\{\s*StructuralCaptureRead\.read\(\)\s*=>\s*"
        r"observe_capture_handle\(value\)\s*,\s*\}\s*\Z"),
    "structural_handler_list_handle_capture": (
        r"\A\s*handle\s*\{\s*StructuralCaptureRead\.read\(\)\s*\}"
        r"\s*with\s*\{\s*StructuralCaptureRead\.read\(\)\s*=>\s*"
        r"values\.len\(\)\s*,\s*\}\s*\Z"),
    "structural_handler_str_capture": (
        r"\A\s*handle\s*\{\s*StructuralCaptureRead\.read\(\)\s*\}"
        r"\s*with\s*\{\s*StructuralCaptureRead\.read\(\)\s*=>\s*"
        r"value\.len\(\)\s*,\s*\}\s*\Z"),
    "structural_handler_int_capture": (
        r"\A\s*handle\s*\{\s*StructuralCaptureRead\.read\(\)\s*\}"
        r"\s*with\s*\{\s*StructuralCaptureRead\.read\(\)\s*=>\s*"
        r"value\s*,\s*\}\s*\Z"),
    "structural_named_value_local": (
        r"\A\s*handle\s*\{\s*let\s+reader\s*=\s*"
        r"structural_bound_read\s+reader\(\)\s*\}\s*with\s*\{"
        r"\s*StructuralBoundRead\.read\(\)\s*=>\s*31\s*,\s*\}\s*\Z"),
    # The zero is an unreachable type witness required by the current
    # expression typer after an explicit return. It does not construct a
    # second function-value wrapper.
    "structural_named_value_early_local": (
        r"\A\s*handle\s*\{\s*let\s+reader\s*=\s*"
        r"structural_bound_read\s+return\s+reader\(\)\s+0\s*\}"
        r"\s*with\s*\{\s*StructuralBoundRead\.read\(\)\s*=>\s*32"
        r"\s*,\s*\}\s*\Z"),
    "structural_dead_lambda_return": (
        r"\A\s*let\s+reader\s*=\s*fn\s*\(\s*\)\s*->\s*Int\s*\{"
        r"\s*return\s+71\s+source\.id\s*\}\s+reader\(\)\s*\Z"),
    "structural_dead_lambda_never": (
        r"\A\s*let\s+reader\s*=\s*fn\s*\(\s*\)\s*->\s*Int\s*\{"
        r"\s*panic\s*\(\s*\)\s+source\.id\s*\}\s+72\s*\Z"),
    "structural_dead_handler_return": (
        r"\A\s*handle\s*\{\s*StructuralCaptureRead\.read\(\)\s*\}"
        r"\s*with\s*\{\s*StructuralCaptureRead\.read\(\)\s*=>\s*\{"
        r"\s*return\s+73\s+source\.id\s*\}\s*,\s*\}\s*\Z"),
    "structural_dead_handler_never": (
        r"\A\s*handle\s*\{\s*74\s*\}\s*with\s*\{\s*"
        r"StructuralCaptureRead\.read\(\)\s*=>\s*\{\s*panic\s*\(\s*\)"
        r"\s+source\.id\s*\}\s*,\s*\}\s*\Z"),
}


def closure_env_fixture_source_errors(source: str) -> List[str]:
    """Keep every physical-mask fixture entry semantically non-empty."""
    errors: List[str] = []
    masked = mask_ring_strings_and_comments(source)
    for description, pattern in CLOSURE_ENV_FIXTURE_CONTRACTS:
        count = len(re.findall(pattern, masked))
        if count != 1:
            errors.append(
                f"{CLOSURE_ENV_RC_FIXTURE}: {description} contract matched "
                f"{count} times (expected 1)")
    for function_name, body_pattern in CLOSURE_ENV_FUNCTION_BODY_CONTRACTS.items():
        body, extract_error = extract_ring_function_body(source, function_name)
        if extract_error:
            errors.append(f"{CLOSURE_ENV_RC_FIXTURE}: {extract_error}")
            continue
        masked_body = mask_ring_strings_and_comments(body)
        if re.fullmatch(body_pattern, masked_body) is None:
            errors.append(
                f"{CLOSURE_ENV_RC_FIXTURE}: {function_name} body no longer "
                "matches its exact capture probe")
    return errors


def brace_depth_before(masked: str, offset: int) -> int:
    """Return brace nesting before an offset in already-masked source."""
    depth = 0
    for char in masked[:offset]:
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
    return depth


def top_level_pattern_matches(masked: str, pattern: str) -> List[re.Match[str]]:
    """Find regex matches outside every nested brace-delimited control body."""
    return [
        match for match in re.finditer(pattern, masked)
        if brace_depth_before(masked, match.start()) == 0
    ]


def spread_source_sequence_fixture_contract_errors(source: str) -> List[str]:
    """Pin the top-level loop statements that magnify all four paths."""
    errors: List[str] = []
    body, extract_error = extract_ring_function_body(source, "main")
    if extract_error:
        return [f"{SPREAD_SOURCE_SEQUENCE_FIXTURE}: {extract_error}"]
    masked = mask_ring_strings_and_comments(body)
    loops = list(re.finditer(
        r"\bfor\s+i\s+in\s+0\s*\.\.\s*256\s*\{", masked))
    if len(loops) != 1:
        return [
            f"{SPREAD_SOURCE_SEQUENCE_FIXTURE}: expected exactly one "
            f"0..256 main loop, found {len(loops)}"
        ]
    loop_open = loops[0].end() - 1
    try:
        loop_close = matching_delimiter(masked, loop_open, "{", "}")
    except ValueError as exc:
        return [f"{SPREAD_SOURCE_SEQUENCE_FIXTURE}: {exc}"]
    if masked[:loops[0].start()].strip() or masked[loop_close + 1:].strip():
        errors.append(
            f"{SPREAD_SOURCE_SEQUENCE_FIXTURE}: the 0..256 loop must be "
            "the complete main body")
    loop_body = masked[loop_open + 1:loop_close]
    path_contracts = (
        (
            "Never struct",
            r"\blet\s+from_never\s*=\s*"
            r"spread_never_struct\s*\(\s*i\s*\)",
            r"\bassert\s*\(\s*from_never\s*\.\s*scalar\s*==\s*i\b",
        ),
        (
            "Never variant",
            r"\blet\s+variant_never\s*=\s*"
            r"spread_never_variant\s*\(\s*i\s*\)",
            r"\bmatch\s+variant_never\s*\{",
        ),
        (
            "borrowed struct",
            r"\blet\s+borrowed\s*=\s*"
            r"spread_borrowed_struct\s*\(\s*holder\s*\)",
            r"\bassert\s*\(\s*borrowed\s*\.\s*scalar\s*==\s*i\b",
        ),
        (
            "borrowed variant",
            r"\blet\s+variant_borrowed\s*=\s*"
            r"spread_borrowed_variant\s*\(\s*variant_holder\s*\)",
            r"\bmatch\s+variant_borrowed\s*\{",
        ),
    )
    for label, initializer_pattern, use_pattern in path_contracts:
        initializers = top_level_pattern_matches(
            loop_body, initializer_pattern)
        uses = top_level_pattern_matches(loop_body, use_pattern)
        if len(initializers) != 1:
            errors.append(
                f"{SPREAD_SOURCE_SEQUENCE_FIXTURE}: {label} top-level "
                f"binding initializer matched {len(initializers)} times "
                "inside the loop (expected 1)")
        if len(uses) != 1:
            errors.append(
                f"{SPREAD_SOURCE_SEQUENCE_FIXTURE}: {label} top-level "
                f"binding use matched {len(uses)} times inside the loop "
                "(expected 1)")
        if (len(initializers) == 1 and len(uses) == 1 and
                uses[0].start() <= initializers[0].end()):
            errors.append(
                f"{SPREAD_SOURCE_SEQUENCE_FIXTURE}: {label} binding must be "
                "used after its exact initializer")
    return errors


def spread_source_sequence_fixture_source_errors(source: str) -> List[str]:
    """Run the source contract plus four independent dead-decoy mutations."""
    errors = spread_source_sequence_fixture_contract_errors(source)
    mutations = (
        (
            "Never struct",
            "let from_never = spread_never_struct(i)",
            "spread_never_struct(i)",
            "let from_never = make_packet(i)",
        ),
        (
            "Never variant",
            "let variant_never = spread_never_variant(i)",
            "spread_never_variant(i)",
            "let variant_never = make_envelope(i)",
        ),
        (
            "borrowed struct",
            "let borrowed = spread_borrowed_struct(holder)",
            "spread_borrowed_struct(holder)",
            "let borrowed = make_packet(i)",
        ),
        (
            "borrowed variant",
            "let variant_borrowed = spread_borrowed_variant(variant_holder)",
            "spread_borrowed_variant(variant_holder)",
            "let variant_borrowed = make_envelope(i)",
        ),
    )
    for label, original, decoy_call, replacement in mutations:
        pattern = rf"(?m)^(?P<indent>[ \t]*){re.escape(original)}[ \t]*$"

        def dead_decoy(match: re.Match[str]) -> str:
            indent = match.group("indent")
            return (
                f"{indent}if false {{\n"
                f"{indent}    let decoy = {decoy_call}\n"
                f"{indent}}}\n{indent}{replacement}"
            )

        mutated, count = re.subn(pattern, dead_decoy, source, count=1)
        if count != 1:
            errors.append(
                f"{SPREAD_SOURCE_SEQUENCE_FIXTURE}: could not construct "
                f"{label} dead-decoy mutation")
            continue
        mutation_errors = spread_source_sequence_fixture_contract_errors(
            mutated)
        if not any(
            f"{label} top-level binding initializer" in error
            for error in mutation_errors
        ):
            errors.append(
                f"{SPREAD_SOURCE_SEQUENCE_FIXTURE}: {label} dead-decoy "
                "mutation escaped source integrity")
    return errors


def positive_check_only_fixture_integrity_errors() -> List[str]:
    """Keep explicit check-positive fixtures normalized and companion-free."""
    errors: List[str] = []
    configured = list(POSITIVE_CHECK_ONLY_CASES)
    duplicates = sorted({
        fixture for fixture in configured if configured.count(fixture) > 1
    })
    if duplicates:
        errors.append(
            "positive check-only fixtures registered more than once: "
            + ", ".join(duplicates))

    for fixture in configured:
        if "\\" in fixture or Path(fixture).is_absolute():
            errors.append(
                f"positive check-only fixture is not repo-relative: {fixture}")
            continue
        try:
            normalized = normalized_repo_path(fixture)
        except ValueError:
            errors.append(
                f"positive check-only fixture escapes repository: {fixture}")
            continue
        if normalized != fixture:
            errors.append(
                f"positive check-only fixture is not normalized: {fixture}")

        ring_file = REPO / fixture
        if ring_file.suffix != ".ring":
            errors.append(
                f"positive check-only fixture is not a .ring file: {fixture}")
        if not ring_file.is_file():
            errors.append(
                f"positive check-only fixture is missing: {fixture}")
            continue
        companions = [
            companion
            for companion in (
                ring_file.with_suffix(".expected"),
                ring_file.with_suffix(".error"),
            )
            if companion.is_file()
        ]
        if companions:
            errors.append(
                f"positive check-only fixture has an execution/error companion: "
                f"{fixture}")
    return errors


def positive_check_only_lane_self_test_errors() -> List[str]:
    """Prove that blanket rejection cannot satisfy the positive check lane."""
    errors: List[str] = []
    if not POSITIVE_CHECK_ONLY_CASES:
        return ["positive check-only lane has no registered fixtures"]

    class RecordingCollector:
        def __init__(self) -> None:
            self.results: List[TestResult] = []

        def add(self, result: TestResult) -> None:
            self.results.append(result)

    fixture = POSITIVE_CHECK_ONLY_CASES[0]
    ring_file = REPO / fixture
    compiler_sentinel = "fresh-compiler-check-probe"
    probes = (
        ("accepted", 0, TestResult.PASS, ""),
        ("blanket-overreject", 1, TestResult.FAIL, "E0801 blanket rejection"),
    )
    for probe_name, returncode, expected_status, stderr in probes:
        calls: List[Tuple[str, str]] = []

        def fake_check(ring_exe: str, path: str) -> subprocess.CompletedProcess:
            calls.append((ring_exe, path))
            return subprocess.CompletedProcess(
                [ring_exe, "check", path], returncode,
                stdout="", stderr=stderr,
            )

        collector = RecordingCollector()
        run_positive_check_only_cases(
            compiler_sentinel,
            collector,
            name_filter=ring_file.name,
            check_runner=fake_check,
        )
        expected_call = [(compiler_sentinel, str(ring_file))]
        if calls != expected_call:
            errors.append(
                f"positive check-only {probe_name} self-test invoked {calls!r}, "
                f"expected {expected_call!r}")
        if len(collector.results) != 1:
            errors.append(
                f"positive check-only {probe_name} self-test produced "
                f"{len(collector.results)} results, expected 1")
            continue
        result = collector.results[0]
        if result.status != expected_status:
            errors.append(
                f"positive check-only {probe_name} self-test returned "
                f"{result.status}, expected {expected_status}")
        if (
            returncode != 0
            and "expected check exit 0" not in result.detail
        ):
            errors.append(
                "positive check-only blanket-overreject self-test did not "
                "preserve the exit-zero contract")
    return errors


def positive_check_only_lane_wiring_errors(
    source: Optional[str] = None,
) -> List[str]:
    """Require run_e2e to invoke the positive check-only production lane."""
    if source is None:
        try:
            source = Path(__file__).read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            return [f"cannot read runner source for positive check wiring: {exc}"]
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        return [f"cannot parse runner source for positive check wiring: {exc}"]
    try:
        lexical_tree = symtable.symtable(source, str(Path(__file__)), "exec")
    except SyntaxError as exc:
        return [f"cannot analyze runner bindings for positive check wiring: {exc}"]

    run_e2e_defs = [
        node for node in tree.body
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        and node.name == "run_e2e"
    ]
    if len(run_e2e_defs) != 1:
        return [
            "positive check-only wiring requires exactly one run_e2e definition, "
            f"found {len(run_e2e_defs)}"
        ]

    run_e2e = run_e2e_defs[0]
    if not isinstance(run_e2e, ast.FunctionDef):
        return [
            "positive check-only wiring requires run_e2e to be an "
            "undecorated synchronous FunctionDef"
        ]

    helper_name = "run_positive_check_only_cases"
    errors: List[str] = []
    if run_e2e.decorator_list:
        errors.append(
            "positive check-only wiring requires run_e2e to be undecorated")

    calls = [
        node for node in ast.walk(run_e2e)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == helper_name
    ]
    if len(calls) != 1:
        return errors + [
            "run_e2e must invoke run_positive_check_only_cases exactly once, "
            f"found {len(calls)} calls"
        ]

    call = calls[0]

    class CurrentScopeControlVisitor(ast.NodeVisitor):
        def __init__(self) -> None:
            self.exit_lines: List[int] = []
            self.yield_lines: List[int] = []
            self.helper_global_lines: List[int] = []
            self.helper_write_lines: List[int] = []

        def visit_Return(self, node: ast.Return) -> None:
            self.exit_lines.append(node.lineno)
            self.generic_visit(node)

        def visit_Raise(self, node: ast.Raise) -> None:
            self.exit_lines.append(node.lineno)
            self.generic_visit(node)

        def visit_Yield(self, node: ast.Yield) -> None:
            self.yield_lines.append(node.lineno)
            self.generic_visit(node)

        def visit_YieldFrom(self, node: ast.YieldFrom) -> None:
            self.yield_lines.append(node.lineno)
            self.generic_visit(node)

        def visit_Global(self, node: ast.Global) -> None:
            if helper_name in node.names:
                self.helper_global_lines.append(node.lineno)

        def visit_Name(self, node: ast.Name) -> None:
            if (
                node.id == helper_name
                and isinstance(node.ctx, (ast.Store, ast.Del))
            ):
                self.helper_write_lines.append(node.lineno)

        def _visit_function_header(
            self,
            node: ast.FunctionDef | ast.AsyncFunctionDef,
        ) -> None:
            for expression in node.decorator_list:
                self.visit(expression)
            for expression in node.args.defaults:
                self.visit(expression)
            for expression in node.args.kw_defaults:
                if expression is not None:
                    self.visit(expression)

        def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
            self._visit_function_header(node)

        def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
            self._visit_function_header(node)

        def visit_Lambda(self, node: ast.Lambda) -> None:
            for expression in node.args.defaults:
                self.visit(expression)
            for expression in node.args.kw_defaults:
                if expression is not None:
                    self.visit(expression)

        def visit_ClassDef(self, node: ast.ClassDef) -> None:
            for expression in node.decorator_list:
                self.visit(expression)
            for expression in node.bases:
                self.visit(expression)
            for keyword in node.keywords:
                self.visit(keyword.value)
            for statement in node.body:
                self.visit(statement)

    controls = CurrentScopeControlVisitor()
    for statement in run_e2e.body:
        controls.visit(statement)
    if controls.yield_lines:
        errors.append(
            "run_e2e must not contain Yield or YieldFrom in its current "
            "scope; found at line(s) "
            + ", ".join(str(line) for line in controls.yield_lines))
    if controls.helper_global_lines:
        write_lines = (
            ", ".join(str(line) for line in controls.helper_write_lines)
            if controls.helper_write_lines
            else "none"
        )
        errors.append(
            f"run_e2e synchronous scope must not declare global {helper_name} "
            "at line(s) "
            + ", ".join(str(line) for line in controls.helper_global_lines)
            + f"; Store/Del line(s) {write_lines}")

    direct_call_statements = [
        statement
        for statement in run_e2e.body
        if isinstance(statement, ast.Expr)
        and isinstance(statement.value, ast.Call)
        and isinstance(statement.value.func, ast.Name)
        and statement.value.func.id == helper_name
    ]
    if (
        len(direct_call_statements) != 1
        or direct_call_statements[0].value is not call
    ):
        errors.append(
            "run_e2e positive check-only call must be a top-level statement, "
            "not a conditional or nested decoy")
    else:
        call_statement = direct_call_statements[0]
        call_index = run_e2e.body.index(call_statement)

        exits = CurrentScopeControlVisitor()
        for statement in run_e2e.body[:call_index]:
            exits.visit(statement)
        if exits.exit_lines:
            errors.append(
                "run_e2e may exit before the positive check-only call at "
                "line(s) "
                + ", ".join(str(line) for line in exits.exit_lines))

        following = (
            run_e2e.body[call_index + 1]
            if call_index + 1 < len(run_e2e.body)
            else None
        )
        if not (
            isinstance(following, ast.If)
            and isinstance(following.test, ast.Name)
            and following.test.id == "check_only_exact"
            and len(following.body) == 1
            and isinstance(following.body[0], ast.Return)
            and following.body[0].value is None
            and not following.orelse
        ):
            errors.append(
                "run_e2e positive check-only call must be immediately followed "
                "by the check_only_exact return guard")

    lexical_run_e2e = [
        table for table in lexical_tree.get_children()
        if table.get_name() == "run_e2e"
        and table.get_lineno() == run_e2e.lineno
    ]
    if len(lexical_run_e2e) != 1:
        errors.append(
            "positive check-only wiring requires exactly one run_e2e "
            f"lexical scope, found {len(lexical_run_e2e)}")
    else:
        try:
            helper_symbol = lexical_run_e2e[0].lookup(helper_name)
        except KeyError:
            helper_symbol = None
        if helper_symbol is not None and (
            helper_symbol.is_local()
            or helper_symbol.is_parameter()
            or helper_symbol.is_imported()
            or helper_symbol.is_assigned()
        ):
            binding_kinds = [
                label
                for label, active in (
                    ("local", helper_symbol.is_local()),
                    ("parameter", helper_symbol.is_parameter()),
                    ("import", helper_symbol.is_imported()),
                    ("assignment/definition", helper_symbol.is_assigned()),
                )
                if active
            ]
            errors.append(
                f"run_e2e locally shadows {helper_name}: "
                + ", ".join(binding_kinds))

    positional_names = [
        arg.id if isinstance(arg, ast.Name) else None for arg in call.args
    ]
    if positional_names != ["ring_exe", "collector"]:
        errors.append(
            "run_e2e positive check-only call must pass ring_exe and collector")
    keyword_names = [keyword.arg for keyword in call.keywords]
    if keyword_names != ["name_filter"]:
        errors.append(
            "run_e2e positive check-only call must pass only name_filter")
    elif not (
        isinstance(call.keywords[0].value, ast.Name)
        and call.keywords[0].value.id == "name_filter"
    ):
        errors.append(
            "run_e2e positive check-only call must forward the active name_filter")
    return errors


def positive_check_only_lane_wiring_self_test_errors() -> List[str]:
    """Prove that control-flow and definition mutations fail closed."""
    try:
        source = Path(__file__).read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read runner source for wiring self-test: {exc}"]

    call_source = (
        "    run_positive_check_only_cases(\n"
        "        ring_exe, collector, name_filter=name_filter)\n"
    )
    if source.count(call_source) != 1:
        return [
            "positive check-only wiring self-test could not isolate the "
            "production call"
        ]
    definition_source = "def " + "run_e2e("
    if source.count(definition_source) != 1:
        return [
            "positive check-only wiring self-test could not isolate the "
            "run_e2e definition"
        ]

    mutations = (
        (
            "pre-call guard",
            source.replace(
                call_source,
                "    if not check_only_exact:\n"
                "        return\n"
                + call_source,
                1,
            ),
            "may exit before",
        ),
        (
            "local helper rebind",
            source.replace(
                call_source,
                "    run_positive_check_only_cases = "
                "lambda *args, **kwargs: None\n"
                + call_source,
                1,
            ),
            "locally shadows",
        ),
        (
            "async definition",
            source.replace(
                definition_source, "async " + definition_source, 1),
            "undecorated synchronous FunctionDef",
        ),
        (
            "yield",
            source.replace(call_source, "    yield None\n" + call_source, 1),
            "must not contain Yield or YieldFrom",
        ),
        (
            "decorator",
            source.replace(
                definition_source,
                "@staticmethod\n" + definition_source,
                1,
            ),
            "requires run_e2e to be undecorated",
        ),
        (
            "class body exit",
            source.replace(
                call_source,
                "    class CheckOnlyExit:\n"
                "        if check_only_exact:\n"
                "            raise SystemExit(0)\n"
                + call_source,
                1,
            ),
            "may exit before",
        ),
        (
            "class body global rebind",
            source.replace(
                call_source,
                "    class CheckOnlyRebind:\n"
                "        global run_positive_check_only_cases\n"
                "        run_positive_check_only_cases = "
                "lambda *args, **kwargs: None\n"
                + call_source,
                1,
            ),
            "Store/Del line(s)",
        ),
    )
    errors: List[str] = []
    for label, mutated, required_error in mutations:
        mutation_errors = positive_check_only_lane_wiring_errors(mutated)
        if not any(required_error in error for error in mutation_errors):
            errors.append(
                f"positive check-only {label} mutation escaped wiring gate: "
                f"{mutation_errors!r}")

    method_body_source = source.replace(
        call_source,
        "    class DeferredExit:\n"
        "        def exit_later(self):\n"
        "            raise SystemExit(0)\n"
        + call_source,
        1,
    )
    method_body_errors = positive_check_only_lane_wiring_errors(
        method_body_source)
    if method_body_errors:
        errors.append(
            "positive check-only class method body mutation must remain "
            f"outside the current scope: {method_body_errors!r}")

    method_global_source = source.replace(
        call_source,
        "    class DeferredRebind:\n"
        "        def rebind_later(self):\n"
        "            global run_positive_check_only_cases\n"
        "            run_positive_check_only_cases = "
        "lambda *args, **kwargs: None\n"
        + call_source,
        1,
    )
    method_global_errors = positive_check_only_lane_wiring_errors(
        method_global_source)
    if method_global_errors:
        errors.append(
            "positive check-only class method global mutation must remain "
            f"outside the current scope: {method_global_errors!r}")
    return errors


def structural_fixture_integrity_errors() -> List[str]:
    """Enforce fixture-to-oracle closure before either runner consumes it."""
    errors: List[str] = []
    errors.extend(positive_check_only_fixture_integrity_errors())
    errors.extend(positive_check_only_lane_self_test_errors())
    errors.extend(positive_check_only_lane_wiring_errors())
    errors.extend(positive_check_only_lane_wiring_self_test_errors())
    actual = structural_fixture_paths()
    configured = [
        fixture
        for fixtures in STRUCTURAL_ORACLE_FIXTURES.values()
        for fixture in fixtures
    ]
    configured_set = set(configured)

    duplicates = sorted({path for path in configured if configured.count(path) > 1})
    if duplicates:
        errors.append(
            "structural fixtures mapped to multiple oracles: "
            + ", ".join(duplicates))
    missing = sorted(configured_set - actual)
    orphan = sorted(actual - configured_set)
    if missing:
        errors.append("structural oracle fixtures missing: " + ", ".join(missing))
    if orphan:
        errors.append("structural fixtures without oracle: " + ", ".join(orphan))

    marker_ids: dict[str, str] = {}
    for case_name, entry, fixtures in C_LINE_BUILD_CASES:
        if entry not in fixtures:
            errors.append(f"{case_name}: build entry is absent from fixture bundle")
        case_markers: List[Tuple[str, int, str]] = []
        for fixture in fixtures:
            path = REPO / fixture
            markers, error = ring_line_markers(path)
            if error:
                errors.append(error)
                continue
            case_markers.extend(
                (marker_id, line, fixture) for marker_id, line in markers)
        if len(case_markers) != 1:
            errors.append(
                f"{case_name}: expected exactly one real-code c_line_marker_ "
                f"declaration across its fixture bundle, found {len(case_markers)}")
            continue
        marker_id, line, fixture = case_markers[0]
        if marker_id in marker_ids:
            errors.append(
                f"duplicate structural marker id {marker_id}: "
                f"{marker_ids[marker_id]} and {fixture}")
        marker_ids[marker_id] = fixture
        if line < 1:
            errors.append(f"{fixture}: marker {marker_id} has invalid line {line}")

    extern_path = REPO / EXTERN_RC_FIXTURE
    try:
        extern_source = extern_path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        errors.append(f"cannot read {EXTERN_RC_FIXTURE}: {exc}")
    else:
        errors.extend(extern_fixture_source_errors(extern_source))

    closure_env_path = REPO / CLOSURE_ENV_RC_FIXTURE
    try:
        closure_env_source = closure_env_path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        errors.append(f"cannot read {CLOSURE_ENV_RC_FIXTURE}: {exc}")
    else:
        errors.extend(closure_env_fixture_source_errors(closure_env_source))

    spread_path = REPO / SPREAD_SOURCE_SEQUENCE_FIXTURE
    try:
        spread_source = spread_path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        errors.append(
            f"cannot read {SPREAD_SOURCE_SEQUENCE_FIXTURE}: {exc}")
    else:
        errors.extend(
            spread_source_sequence_fixture_source_errors(spread_source))

    # Json enum metadata mismatch is an internal compiler invariant that cannot
    # be triggered by a well-formed source fixture. Keep a source-level oracle:
    # codegen must fail while compiling and must never invent declaration-order
    # tags for a missing CEnumVariantInfo entry.
    try:
        codegen_source = CODEGEN_C_SOURCE.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        errors.append(f"cannot read {display_path(CODEGEN_C_SOURCE)}: {exc}")
    else:
        masked_codegen = mask_ring_strings_and_comments(codegen_source)
        if re.search(r"\bfallback_tag\b", masked_codegen):
            errors.append("Json enum codegen still contains fallback_tag")
        fail_loud = re.search(
            r"enum_info\.variants\.get\s*\(\s*variant\.name\s*\)"
            r"[\s\S]{0,240}?none\s*=>\s*panic\s*\(",
            masked_codegen,
        )
        if fail_loud is None:
            errors.append(
                "Json enum missing-variant metadata is not compile-time fail-loud")

    return errors


def mask_c_strings_and_comments(source: str) -> str:
    """Blank C strings, character literals, and comments, preserving offsets."""
    masked: List[str] = []
    state = "code"
    index = 0
    while index < len(source):
        char = source[index]
        next_char = source[index + 1] if index + 1 < len(source) else ""

        if state == "code":
            if char == "/" and next_char == "/":
                masked.extend([" ", " "])
                index += 2
                state = "line-comment"
            elif char == "/" and next_char == "*":
                masked.extend([" ", " "])
                index += 2
                state = "block-comment"
            elif char == '"':
                masked.append(" ")
                index += 1
                state = "string"
            elif char == "'":
                masked.append(" ")
                index += 1
                state = "char"
            else:
                masked.append(char)
                index += 1
            continue

        if state == "line-comment":
            if char == "\n":
                masked.append("\n")
                state = "code"
            else:
                masked.append(" ")
            index += 1
            continue

        if state == "block-comment":
            if char == "*" and next_char == "/":
                masked.extend([" ", " "])
                index += 2
                state = "code"
            else:
                masked.append("\n" if char == "\n" else " ")
                index += 1
            continue

        # String/character literal. Escapes keep both bytes inside the literal.
        quote = '"' if state == "string" else "'"
        if char == "\\" and next_char:
            masked.append(" ")
            masked.append("\n" if next_char == "\n" else " ")
            index += 2
        elif char == quote:
            masked.append(" ")
            index += 1
            state = "code"
        else:
            masked.append("\n" if char == "\n" else " ")
            index += 1

    return "".join(masked)


def matching_delimiter(masked: str, open_index: int,
                       opening: str, closing: str) -> int:
    """Return the matching delimiter index in already-masked C text."""
    if open_index >= len(masked) or masked[open_index] != opening:
        raise ValueError(f"expected {opening!r} at offset {open_index}")
    depth = 0
    for index in range(open_index, len(masked)):
        char = masked[index]
        if char == opening:
            depth += 1
        elif char == closing:
            depth -= 1
            if depth == 0:
                return index
    raise ValueError(f"unclosed {opening!r} at offset {open_index}")


def ownership_shadow_layout_errors() -> List[str]:
    """Validate Unit-1 ownership transport representation and authority."""
    errors: List[str] = []
    source_contracts = (
        (
            "FnMeta", REPO / "compiler" / "types.ring",
            r"(?m)^[ \t]*pub[ \t]+struct[ \t]+FnMeta[ \t]*\{",
            ("effects", "ownership_id"),
        ),
        (
            "Type::FnType", REPO / "compiler" / "types.ring",
            r"(?m)^[ \t]*FnType[ \t]*\{",
            ("params", "return_type", "meta"),
        ),
        (
            "HExpr::Call", REPO / "compiler" / "hir.ring",
            r"(?m)^[ \t]*Call[ \t]*\{[ \t]*callee[ \t]*:",
            (
                "callee", "args", "type_args", "resolved_dicts",
                "dict_dispatch", "ty", "effects", "span",
            ),
        ),
        (
            "HDecl::Fn", REPO / "compiler" / "hir.ring",
            r"(?m)^[ \t]*Fn[ \t]*\{[ \t]*name[ \t]*:",
            (
                "name", "def_id", "type_params", "params", "return_type",
                "effects", "body", "is_pub", "trait_bounds", "span",
            ),
        ),
        (
            "HParam", REPO / "compiler" / "hir.ring",
            r"(?m)^[ \t]*pub[ \t]+struct[ \t]+HParam[ \t]*\{",
            ("name", "ty", "def_id", "flags"),
        ),
        (
            "HTraitMethod", REPO / "compiler" / "hir.ring",
            r"(?m)^[ \t]*pub[ \t]+struct[ \t]+HTraitMethod[ \t]*\{",
            (
                "name", "def_id", "params", "return_type", "effects",
                "has_default", "body",
            ),
        ),
        (
            "TraitMethodDef", REPO / "compiler" / "env.ring",
            r"(?m)^[ \t]*pub[ \t]+struct[ \t]+TraitMethodDef[ \t]*\{",
            (
                "name", "def_id", "ty", "has_default",
                "param_mutabilities", "method_type_params",
            ),
        ),
    )

    source_cache: dict[Path, str] = {}
    for label, path, header_pattern, expected_fields in source_contracts:
        try:
            source = source_cache.setdefault(
                path, path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as exc:
            errors.append(f"{label}: cannot read {display_path(path)}: {exc}")
            continue
        masked = mask_ring_strings_and_comments(source)
        matches = list(re.finditer(header_pattern, masked))
        if len(matches) != 1:
            errors.append(f"{label}: source declaration found {len(matches)} times")
            continue
        open_index = masked.find("{", matches[0].start(), matches[0].end())
        try:
            close_index = matching_delimiter(masked, open_index, "{", "}")
        except ValueError as exc:
            errors.append(f"{label}: {exc}")
            continue
        body = masked[open_index + 1:close_index]
        fields = tuple(match.group(1) for match in re.finditer(
            r"(?:^|,)[ \t\r\n]*(?:pub[ \t]+)?"
            r"([A-Za-z_][A-Za-z0-9_]*)[ \t]*:",
            body,
            re.MULTILINE,
        ))
        if fields != expected_fields:
            errors.append(
                f"{label}: expected source fields {expected_fields}, found {fields}")

    all_compiler_sources: dict[Path, str] = {}
    compiler_sources: dict[Path, str] = {}
    for path in sorted((REPO / "compiler").glob("*.ring")):
        try:
            raw_source = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            errors.append(f"dynamic descriptors: cannot read {display_path(path)}: {exc}")
            continue
        masked_source = mask_ring_strings_and_comments(raw_source)
        all_compiler_sources[path] = masked_source
        if (
            "CallableOwnershipDescriptor" in raw_source
            or "callable_descriptors" in raw_source
        ):
            compiler_sources[path] = masked_source

    body_inferred_writes: List[str] = []
    for path, masked in all_compiler_sources.items():
        for match in re.finditer(r"\bCALLABLE_SOURCE_BODY_INFERRED\b", masked):
            prefix = masked[max(0, match.start() - 40):match.start()]
            if path == REPO / "compiler" / "types.ring" and re.search(
                r"pub[ \t]+const[ \t]*$", prefix
            ):
                continue
            body_inferred_writes.append(
                f"{display_path(path)}:{masked.count(chr(10), 0, match.start()) + 1}")
    if body_inferred_writes:
        errors.append(
            "ownership provenance: BODY_INFERRED appears before the solver at "
            + ", ".join(body_inferred_writes))

    def function_body(path: Path, name: str) -> Optional[str]:
        masked = all_compiler_sources.get(path, "")
        match = re.search(
            rf"(?m)^[ \t]*(?:pub[ \t]+)?fn[ \t]+{re.escape(name)}[ \t]*\(",
            masked,
        )
        if match is None:
            errors.append(
                f"ownership authority: {display_path(path)}::{name} is missing")
            return None
        open_index = masked.find("{", match.end())
        try:
            close_index = matching_delimiter(masked, open_index, "{", "}")
        except ValueError as exc:
            errors.append(
                f"ownership authority: {display_path(path)}::{name}: {exc}")
            return None
        return masked[open_index + 1:close_index]

    register_path = REPO / "compiler" / "infer_register.ring"
    for function_name in ("register_fn_common", "register_impl_method"):
        body = function_body(register_path, function_name)
        if body is not None:
            if "interface_callable_ownership(params)" not in body:
                errors.append(
                    f"ownership authority: {function_name} does not consume the "
                    "explicit parameter contract")
            if "exact_prelude_extern_" in body or "ring_slot_" in body:
                errors.append(
                    f"ownership authority: {function_name} contains a raw-slot "
                    "name fallback")

    infer_decl_path = REPO / "compiler" / "infer_decl.ring"
    registered_method_body = function_body(
        infer_decl_path, "registered_impl_method_scheme")
    if (
        registered_method_body is not None
        and not all(token in registered_method_body for token in (
            "let scheme = match trait_name",
            "some(value) => value",
            "none => panic",
        ))
    ):
        errors.append(
            "ownership authority: missing impl callable registration can fall "
            "back to a leaf binding")
    impl_check_body = function_body(
        infer_decl_path, "check_impl_decl_canonical")
    if (
        impl_check_body is not None
        and impl_check_body.count("some(registration_scheme)") < 2
    ):
        errors.append(
            "ownership authority: fn and extern impl methods do not both "
            "consume their exact captured registration")
    extern_check_body = function_body(
        infer_decl_path, "check_extern_fn_decl")
    if (
        extern_check_body is not None
        and "registration_override" not in extern_check_body
    ):
        errors.append(
            "ownership authority: extern checking has no exact registration input")

    delegate_register_body = function_body(
        register_path, "register_delegate_traits")
    if delegate_register_body is not None:
        delegate_registration_contracts = (
            r"new_local_callable_scheme[ \t\r\n]*\(",
            r"exact_method_schemes[ \t\r\n]*\.[ \t\r\n]*insert"
            r"[ \t\r\n]*\([ \t\r\n]*tm[ \t\r\n]*\.[ \t\r\n]*name"
            r"[ \t\r\n]*,[ \t\r\n]*scheme[ \t\r\n]*\)",
            r"method_schemes[ \t\r\n]*:[ \t\r\n]*exact_method_schemes",
        )
        if not all(re.search(pattern, delegate_register_body)
                   for pattern in delegate_registration_contracts):
            errors.append(
                "ownership authority: delegate registration does not publish "
                "the localized wrapper scheme")

    delegate_expand_body = function_body(
        infer_decl_path, "expand_delegate_impls")
    if delegate_expand_body is not None:
        delegate_hir_contracts = (
            r"wrapper_entry[ \t\r\n]*\.[ \t\r\n]*method_schemes"
            r"[ \t\r\n]*\.[ \t\r\n]*get[ \t\r\n]*\("
            r"[ \t\r\n]*tm[ \t\r\n]*\.[ \t\r\n]*name[ \t\r\n]*\)",
            r"resolved_method_scheme[ \t\r\n]*\.[ \t\r\n]*def_id",
            r"def_id[ \t\r\n]*:[ \t\r\n]*some[ \t\r\n]*\("
            r"[ \t\r\n]*resolved_method_def_id[ \t\r\n]*\)",
        )
        if not all(re.search(pattern, delegate_expand_body)
                   for pattern in delegate_hir_contracts):
            errors.append(
                "ownership authority: delegate HIR does not reuse the exact "
                "registered wrapper DefId")
        if re.search(
            r"HDecl::Fn[ \t\r\n]*\{(?:(?!HDecl::).)*"
            r"def_id[ \t\r\n]*:[ \t\r\n]*some[ \t\r\n]*\("
            r"[ \t\r\n]*ctx[ \t\r\n]*\.[ \t\r\n]*env"
            r"[ \t\r\n]*\.[ \t\r\n]*fresh_def_id",
            delegate_expand_body,
            re.DOTALL,
        ):
            errors.append(
                "ownership authority: delegate HIR allocates a fresh callable DefId")
        if "ctx.env.lookup" in delegate_expand_body:
            errors.append(
                "ownership authority: delegate HIR falls back to a name lookup")

    prelude_body = function_body(
        REPO / "compiler" / "checker.ring", "load_prelude")
    if prelude_body is not None and not all(token in prelude_body for token in (
        "exact_prelude_extern_ownership",
        "exact_prelude_extern_source",
        "update_local_callable_scheme",
        "prelude_extern_identity",
    )):
        errors.append(
            "ownership authority: exact prelude contract/origin rebind is incomplete")

    reexport_body = function_body(
        REPO / "compiler" / "exports.ring", "copy_exported_name")
    if reexport_body is not None:
        if "env.lookup(origin)" not in reexport_body:
            errors.append(
                "ownership re-export: canonical origin is not remapped through "
                "the current environment")
        if re.search(
            r"values[ \t\r\n]*\.[ \t\r\n]*insert[ \t\r\n]*\("
            r"[ \t\r\n]*local_name[ \t\r\n]*,[ \t\r\n]*scheme",
            reexport_body,
        ):
            errors.append(
                "ownership re-export: foreign TypeScheme is copied verbatim")

    types_path = REPO / "compiler" / "types.ring"
    types_masked = compiler_sources.get(types_path, "")
    init_matches = list(re.finditer(
        r"callable_descriptors[ \t]*:[ \t]*map_new[ \t]*\([ \t]*\)",
        types_masked,
    ))
    if len(init_matches) != 1:
        errors.append(
            "dynamic descriptors: expected one empty callable_descriptors "
            f"initializer, found {len(init_matches)}")

    descriptor_values: List[str] = []
    descriptor_writes: List[str] = []
    for path, masked in compiler_sources.items():
        for match in re.finditer(r"\bCallableOwnershipDescriptor[ \t]*\{", masked):
            line_start = masked.rfind("\n", 0, match.start()) + 1
            prefix = masked[line_start:match.start()]
            if not re.search(r"\bpub[ \t]+struct[ \t]*$", prefix):
                descriptor_values.append(
                    f"{display_path(path)}:{masked.count(chr(10), 0, match.start()) + 1}")
        for match in re.finditer(
            r"\bcallable_descriptors[ \t\r\n]*\.[ \t\r\n]*insert[ \t\r\n]*\(",
            masked,
        ):
            descriptor_writes.append(
                f"{display_path(path)}:{masked.count(chr(10), 0, match.start()) + 1}")
    if descriptor_values:
        errors.append(
            "dynamic descriptors: Unit 1 constructs descriptor values at "
            + ", ".join(descriptor_values))

    checker_path = REPO / "compiler" / "checker.ring"
    expected_write_prefix = f"{display_path(checker_path)}:"
    if len(descriptor_writes) != 1 or not descriptor_writes[0].startswith(
        expected_write_prefix
    ):
        errors.append(
            "dynamic descriptors: expected only checker hydration to write the "
            f"table, found {descriptor_writes}")
    checker_masked = compiler_sources.get(checker_path, "")
    hydration_copy = re.search(
        r"for[ \t]+entry[ \t]+in[ \t]+mod_\.ownership_metadata\."
        r"callable_descriptors\.entries\(\)[ \t\r\n]*\{.*?"
        r"let[ \t]*\([ \t]*ownership_id,[ \t]*descriptor[ \t]*\)"
        r"[ \t]*=[ \t]*entry.*?callable_descriptors\.insert\("
        r"[ \t\r\n]*ownership_id,[ \t\r\n]*descriptor[ \t\r\n]*\)",
        checker_masked,
        re.DOTALL,
    )
    if hydration_copy is None:
        errors.append(
            "dynamic descriptors: checker write is not a copy from imported "
            "ownership metadata")

    return errors


def extract_c_function_body(c_source: str, symbol: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract one exact generated C function body using its definition symbol."""
    masked = mask_c_strings_and_comments(c_source)
    pattern = re.compile(
        rf"(?m)^[ \t]*(?:static[ \t]+)?void[ \t]*\*?[ \t]+"
        rf"{re.escape(symbol)}[ \t]*\([^;{{}}\n]*\)[ \t]*\{{")
    matches = list(pattern.finditer(masked))
    if len(matches) != 1:
        return None, f"generated function {symbol} found {len(matches)} times"
    open_index = masked.rfind("{", matches[0].start(), matches[0].end())
    try:
        close_index = matching_delimiter(masked, open_index, "{", "}")
    except ValueError as exc:
        return None, f"generated function {symbol}: {exc}"
    return c_source[open_index + 1:close_index], None


def extract_c_switch_cases(
    function_body: str,
) -> Tuple[dict[str, str], Optional[str]]:
    """Extract top-level bodies from the sole switch in a generated function."""
    masked = mask_c_strings_and_comments(function_body)
    switches = list(re.finditer(r"\bswitch\s*\(", masked))
    if len(switches) != 1:
        return {}, f"expected one switch, found {len(switches)}"
    paren_open = masked.find("(", switches[0].start(), switches[0].end())
    try:
        paren_close = matching_delimiter(masked, paren_open, "(", ")")
    except ValueError as exc:
        return {}, str(exc)
    brace_open = paren_close + 1
    while brace_open < len(masked) and masked[brace_open].isspace():
        brace_open += 1
    if brace_open >= len(masked) or masked[brace_open] != "{":
        return {}, "switch has no braced body"
    try:
        brace_close = matching_delimiter(masked, brace_open, "{", "}")
    except ValueError as exc:
        return {}, str(exc)

    inner_masked = masked[brace_open + 1:brace_close]
    inner_source = function_body[brace_open + 1:brace_close]
    labels: List[Tuple[str, int, int]] = []
    depth = 0
    index = 0
    label_re = re.compile(r"(?:case\s+(-?[0-9]+)\s*|default\s*):")
    while index < len(inner_masked):
        char = inner_masked[index]
        if char == "{":
            depth += 1
            index += 1
            continue
        if char == "}":
            depth -= 1
            index += 1
            continue
        if depth == 0:
            match = label_re.match(inner_masked, index)
            if match:
                label = match.group(1) if match.group(1) is not None else "default"
                labels.append((label, match.start(), match.end()))
                index = match.end()
                continue
        index += 1

    if not labels:
        return {}, "switch contains no top-level case labels"
    cases: dict[str, str] = {}
    for label_index, (label, start, body_start) in enumerate(labels):
        if label in cases:
            return {}, f"duplicate switch label {label}"
        body_end = (
            labels[label_index + 1][1]
            if label_index + 1 < len(labels)
            else len(inner_source)
        )
        cases[label] = inner_source[body_start:body_end]
    return cases, None


def c_rc_counts(c_body: str) -> Tuple[int, int]:
    """Return exact (ring_dup, ring_drop) call counts in a local C body."""
    masked = mask_c_strings_and_comments(c_body)
    return (
        len(re.findall(r"\bring_dup\s*\(", masked)),
        len(re.findall(r"\bring_drop\s*\(", masked)),
    )


C_IDENTIFIER = r"[A-Za-z_][A-Za-z0-9_]*"
CLOSURE_ENV_ALLOC_RE = re.compile(
    rf"(?m)^[ \t]*(?P<env>{C_IDENTIFIER})[ \t]*=[ \t]*ring_alloc\s*\("
    r"\s*\(int64_t\)\s*\(\s*sizeof\s*\(\s*int64_t\s*\)\s*\+\s*"
    r"(?P<capture_count>[0-9]+)\s*\*\s*sizeof\s*\(\s*void\s*\*\s*\)"
    r"\s*\+\s*(?P<mask_count>[0-9]+)\s*\*\s*"
    r"sizeof\s*\(\s*intptr_t\s*\)\s*\)\s*,\s*"
    r"(?P<type_id>[0-9]+)\s*\)\s*;"
)


@dataclass(frozen=True)
class CClosureEnvRecord:
    """One literal-count masked closure environment in a generated C body."""

    env: str
    capture_count: int
    type_id: int
    captures: Tuple[str, ...]
    masks: Tuple[int, ...]
    start: int
    end: int


def parse_c_closure_env_records(
    c_body: str,
) -> Tuple[List[CClosureEnvRecord], List[str]]:
    """Parse exact capture/mask slots without depending on a numeric typeid."""
    masked = mask_c_strings_and_comments(c_body)
    matches = list(CLOSURE_ENV_ALLOC_RE.finditer(masked))
    records: List[CClosureEnvRecord] = []
    errors: List[str] = []
    for match_index, match in enumerate(matches):
        env = match.group("env")
        capture_count = int(match.group("capture_count"))
        mask_count = int(match.group("mask_count"))
        type_id = int(match.group("type_id"))
        region_start = match.start()
        region_end = (
            matches[match_index + 1].start()
            if match_index + 1 < len(matches)
            else len(masked)
        )
        region = masked[region_start:region_end]
        if capture_count != mask_count:
            errors.append(
                f"{env}: capture/mask allocation counts differ "
                f"({capture_count}/{mask_count})")

        header_re = re.compile(
            rf"\*\s*\(\s*int64_t\s*\*\s*\)\s*{re.escape(env)}\s*"
            rf"=\s*{capture_count}\s*;")
        headers = list(header_re.finditer(region))
        if len(headers) != 1:
            errors.append(
                f"{env}: expected one count header {capture_count}, "
                f"found {len(headers)}")

        capture_re = re.compile(
            rf"\(\(\s*void\s*\*\s*\*\s*\)\s*{re.escape(env)}\s*\)"
            rf"\s*\[\s*([0-9]+)\s*\]\s*=\s*({C_IDENTIFIER})\s*;")
        capture_entries = [
            (int(store.group(1)), store.group(2))
            for store in capture_re.finditer(region)
        ]
        expected_capture_indexes = list(range(1, capture_count + 1))
        actual_capture_indexes = sorted(index for index, _ in capture_entries)
        if actual_capture_indexes != expected_capture_indexes:
            errors.append(
                f"{env}: capture slots {actual_capture_indexes} != "
                f"{expected_capture_indexes}")
        captures_by_index = {index: value for index, value in capture_entries}
        captures = tuple(
            captures_by_index.get(index, "<missing>")
            for index in expected_capture_indexes
        )

        mask_re = re.compile(
            rf"\(\(\s*intptr_t\s*\*\s*\)\s*\(\s*"
            rf"\(\s*char\s*\*\s*\)\s*{re.escape(env)}\s*\+\s*"
            rf"sizeof\s*\(\s*int64_t\s*\)\s*\+\s*{capture_count}\s*"
            rf"\*\s*sizeof\s*\(\s*void\s*\*\s*\)\s*\)\s*\)"
            rf"\s*\[\s*([0-9]+)\s*\]\s*=\s*([01])\s*;")
        mask_entries = [
            (int(store.group(1)), int(store.group(2)))
            for store in mask_re.finditer(region)
        ]
        expected_mask_indexes = list(range(capture_count))
        actual_mask_indexes = sorted(index for index, _ in mask_entries)
        if actual_mask_indexes != expected_mask_indexes:
            errors.append(
                f"{env}: mask slots {actual_mask_indexes} != "
                f"{expected_mask_indexes}")
        masks_by_index = {index: value for index, value in mask_entries}
        masks = tuple(
            masks_by_index.get(index, -1)
            for index in expected_mask_indexes
        )

        env_links = list(re.finditer(
            rf"\(\(\s*void\s*\*\s*\*\s*\)\s*{C_IDENTIFIER}\s*\)"
            rf"\s*\[\s*1\s*\]\s*=\s*{re.escape(env)}\s*;",
            region,
        ))
        if len(env_links) != 1:
            errors.append(
                f"{env}: expected one closure env link, found {len(env_links)}")

        records.append(CClosureEnvRecord(
            env=env,
            capture_count=capture_count,
            type_id=type_id,
            captures=captures,
            masks=masks,
            start=region_start,
            end=region_end,
        ))
    return records, errors


def exact_c_unary_call_count(c_body: str, callee: str, argument: str) -> int:
    """Count one-argument C calls with an exact identifier argument."""
    masked = mask_c_strings_and_comments(c_body)
    return len(re.findall(
        rf"\b{re.escape(callee)}\s*\(\s*{re.escape(argument)}\s*\)",
        masked,
    ))


@dataclass(frozen=True)
class CProbeStatement:
    """One statement in the deliberately tiny generated-C probe grammar."""

    kind: str
    offset: int
    text: str
    target: Optional[str] = None
    callee: Optional[str] = None
    args: Tuple[str, ...] = ()


@dataclass(frozen=True)
class CProbeEvent:
    """A probe statement with identifier origins frozen at its execution point."""

    statement: CProbeStatement
    arg_origins: Tuple[str, ...] = ()
    result_origin: Optional[str] = None


@dataclass(frozen=True)
class CProbeProgram:
    """The sole evaluated truth consumed by the exact body template."""

    events: Tuple[CProbeEvent, ...]


C_PROBE_CALL_ARITIES = {
    "ring_Option_some": 1,
    "ring_list_new": 0,
    "ring_List_push": 2,
}
C_PROBE_VALUE_ROOT = "parameter:r_value"
C_PROBE_UNIT_ROOT = "constant:RING_UNIT"
# Intentionally lock the complete alpha-normalized lowering.  Independent
# semantic/RC summaries admitted use-after-drop reorderings in these probes.
C_PROBE_TEMPLATES = {
    "ring_structural_raw_identity": (
        ("declare", "v0"),
        ("declare", "v1"),
        ("declare", "v2"),
        ("alias", "v0", "$value"),
        ("alias", "v1", "v0"),
        ("alias", "v2", "v1"),
        ("return", "v2"),
    ),
    "ring_structural_owned_identity": (
        ("declare", "v0"),
        ("declare", "v1"),
        ("declare", "v2"),
        ("declare", "v3"),
        ("declare", "v4"),
        ("alias", "v0", "$value"),
        ("rc", "ring_dup", "v0"),
        ("alias", "v1", "v0"),
        ("alias", "v2", "v1"),
        ("rc", "ring_dup", "v2"),
        ("alias", "v3", "v2"),
        ("rc", "ring_drop", "v1"),
        ("alias", "v4", "v3"),
        ("return", "v4"),
    ),
    "ring_structural_raw_option": (
        ("declare", "v0"),
        ("declare", "v1"),
        ("declare", "v2"),
        ("alias", "v0", "$value"),
        ("call", "v1", "ring_Option_some", "v0"),
        ("alias", "v2", "v1"),
        ("return", "$unit"),
    ),
    "ring_structural_owned_option": (
        ("declare", "v0"),
        ("declare", "v1"),
        ("declare", "v2"),
        ("alias", "v0", "$value"),
        ("rc", "ring_dup", "v0"),
        ("call", "v1", "ring_Option_some", "v0"),
        ("alias", "v2", "v1"),
        ("rc", "ring_drop", "v2"),
        ("return", "$unit"),
    ),
    "ring_structural_raw_list": (
        ("declare", "v0"),
        ("declare", "v1"),
        ("declare", "v2"),
        ("declare", "v3"),
        ("declare", "v4"),
        ("call", "v0", "ring_list_new"),
        ("alias", "v1", "v0"),
        ("alias", "v2", "$value"),
        ("alias", "v3", "v1"),
        ("call", "v4", "ring_List_push", "v3", "v2"),
        ("return", "$unit"),
    ),
    "ring_structural_owned_list": (
        ("declare", "v0"),
        ("declare", "v1"),
        ("declare", "v2"),
        ("declare", "v3"),
        ("declare", "v4"),
        ("declare", "v5"),
        ("declare", "v6"),
        ("call", "v0", "ring_list_new"),
        ("alias", "v1", "v0"),
        ("alias", "v2", "$value"),
        ("alias", "v3", "v1"),
        ("call", "v4", "ring_List_push", "v3", "v2"),
        ("alias", "v5", "$unit"),
        ("rc", "ring_drop", "v1"),
        ("alias", "v6", "v5"),
        ("return", "v6"),
    ),
}


def c_probe_lexical_errors(symbol: str, c_body: str) -> List[str]:
    """Fail closed before applying the six probes' finite statement grammar."""
    errors: List[str] = []
    for marker, description in (
        ("//", "line comment"),
        ("/*", "block comment"),
        ("*/", "block-comment terminator"),
    ):
        if marker in c_body:
            errors.append(f"{symbol}: {description} is outside finite grammar")
    if '"' in c_body:
        errors.append(f"{symbol}: string literal is outside finite grammar")
    if "'" in c_body:
        errors.append(f"{symbol}: character literal is outside finite grammar")
    if re.search(r"\\\r?\n", c_body):
        errors.append(
            f"{symbol}: backslash-newline splice is outside finite grammar")
    if re.search(r"(?m)^[ \t]*#", c_body):
        errors.append(
            f"{symbol}: preprocessor directive is outside finite grammar")
    if "{" in c_body or "}" in c_body:
        errors.append(f"{symbol}: nested block is outside finite grammar")
    controls = sorted(set(re.findall(
        r"\b(?:goto|if|switch|for|while|do|break|continue|case|default)\b",
        c_body)))
    if controls:
        errors.append(
            f"{symbol}: control flow is outside finite grammar: "
            f"{', '.join(controls)}")
    return errors


def parse_c_probe_statements(
    symbol: str,
    c_body: str,
) -> Tuple[List[CProbeStatement], List[str]]:
    """Fully consume a body using only the accepted straight-line grammar."""
    errors = c_probe_lexical_errors(symbol, c_body)
    if errors:
        return [], errors

    ident = r"[A-Za-z_][A-Za-z0-9_]*"
    statements: List[CProbeStatement] = []
    cursor = 0
    for terminator in re.finditer(r";", c_body):
        segment = c_body[cursor:terminator.start()]
        leading = len(segment) - len(segment.lstrip())
        offset = cursor + leading
        text = segment.strip()
        cursor = terminator.end()
        if not text:
            errors.append(f"{symbol}: empty statement is outside finite grammar")
            continue

        declaration = re.fullmatch(rf"void\s*\*\s*({ident})", text)
        if declaration:
            statements.append(CProbeStatement(
                "declare", offset, text, target=declaration.group(1)))
            continue

        assigned_call = re.fullmatch(
            rf"({ident})\s*=\s*({ident})\s*\(([^()]*)\)", text)
        if assigned_call:
            target, callee, args_text = assigned_call.groups()
            args = (
                tuple(arg.strip() for arg in args_text.split(","))
                if args_text.strip() else ())
            if callee not in C_PROBE_CALL_ARITIES:
                errors.append(
                    f"{symbol}: assigned call {callee} is outside finite grammar")
                continue
            if any(re.fullmatch(ident, arg) is None for arg in args):
                errors.append(
                    f"{symbol}: {callee} arguments are outside finite grammar")
                continue
            expected_arity = C_PROBE_CALL_ARITIES[callee]
            if len(args) != expected_arity:
                errors.append(
                    f"{symbol}: {callee} arity {len(args)} != "
                    f"{expected_arity}")
                continue
            statements.append(CProbeStatement(
                "call", offset, text, target=target, callee=callee,
                args=args))
            continue

        alias = re.fullmatch(rf"({ident})\s*=\s*({ident})", text)
        if alias:
            statements.append(CProbeStatement(
                "alias", offset, text, target=alias.group(1),
                args=(alias.group(2),)))
            continue

        standalone_call = re.fullmatch(
            rf"({ident})\s*\(([^()]*)\)", text)
        if standalone_call:
            callee, args_text = standalone_call.groups()
            args = (
                tuple(arg.strip() for arg in args_text.split(","))
                if args_text.strip() else ())
            if callee not in {"ring_dup", "ring_drop"}:
                errors.append(
                    f"{symbol}: standalone call {callee} is outside "
                    "finite grammar")
                continue
            if len(args) != 1 or re.fullmatch(ident, args[0]) is None:
                errors.append(
                    f"{symbol}: {callee} requires one identifier operand")
                continue
            statements.append(CProbeStatement(
                "rc", offset, text, callee=callee, args=args))
            continue

        returned = re.fullmatch(rf"return\s+({ident})", text)
        if returned:
            statements.append(CProbeStatement(
                "return", offset, text, args=(returned.group(1),)))
            continue

        errors.append(
            f"{symbol}: statement is outside finite grammar: {text[:100]!r}")

    if c_body[cursor:].strip():
        errors.append(
            f"{symbol}: unterminated text is outside finite grammar: "
            f"{c_body[cursor:].strip()[:100]!r}")
    if not statements and not errors:
        errors.append(f"{symbol}: finite grammar parsed no statements")
    return statements, errors


def evaluate_c_probe_statements(
    symbol: str,
    statements: List[CProbeStatement],
) -> Tuple[Optional[CProbeProgram], List[str]]:
    """Freeze every identifier's origin once, in source execution order."""
    errors: List[str] = []
    declared = set()
    assigned = set()
    origins = {
        "r_value": C_PROBE_VALUE_ROOT,
        "RING_UNIT": C_PROBE_UNIT_ROOT,
    }
    events: List[CProbeEvent] = []
    executable_seen = False

    def resolve(name: str, offset: int) -> str:
        if name in origins:
            return origins[name]
        if name in declared:
            errors.append(
                f"{symbol}: {name} used before initialization at offset "
                f"{offset}")
        else:
            errors.append(
                f"{symbol}: undeclared identifier {name} used at offset "
                f"{offset}")
        return f"invalid:{name}@{offset}"

    def assign(target: str, origin: str, offset: int) -> None:
        if target not in declared:
            errors.append(
                f"{symbol}: assignment target {target} was not declared at "
                f"offset {offset}")
        if target in assigned:
            errors.append(
                f"{symbol}: assignment target {target} assigned more than once")
            return
        assigned.add(target)
        origins[target] = origin

    for statement in statements:
        if statement.kind == "declare":
            target = statement.target or ""
            if executable_seen:
                errors.append(
                    f"{symbol}: declaration {target} follows executable code")
            if target in declared or target in origins:
                errors.append(f"{symbol}: duplicate declaration {target}")
            declared.add(target)
            events.append(CProbeEvent(statement))
            continue

        executable_seen = True
        arg_origins = tuple(
            resolve(arg, statement.offset) for arg in statement.args)
        if statement.kind == "alias":
            result_origin = arg_origins[0]
            assign(statement.target or "", result_origin, statement.offset)
            events.append(CProbeEvent(
                statement, arg_origins, result_origin))
        elif statement.kind == "call":
            result_origin = (
                f"call:{statement.offset}:{statement.callee}")
            assign(statement.target or "", result_origin, statement.offset)
            events.append(CProbeEvent(
                statement, arg_origins, result_origin))
        else:
            events.append(CProbeEvent(statement, arg_origins))

    return_events = [
        event for event in events if event.statement.kind == "return"]
    if len(return_events) != 1:
        errors.append(
            f"{symbol}: expected exactly one return event, found "
            f"{len(return_events)}")
    elif not events or events[-1].statement.kind != "return":
        errors.append(f"{symbol}: return event is not the final statement")

    if errors:
        return None, errors
    return CProbeProgram(tuple(events)), []


def canonical_c_probe_events(
    symbol: str,
    program: CProbeProgram,
) -> Tuple[Tuple[Tuple[str, ...], ...], List[str]]:
    """Alpha-normalize locals while preserving every statement and operand."""
    errors: List[str] = []
    locals_by_name: dict[str, str] = {}
    normalized: List[Tuple[str, ...]] = []

    def identifier(name: str, offset: int) -> str:
        if name == "r_value":
            return "$value"
        if name == "RING_UNIT":
            return "$unit"
        local = locals_by_name.get(name)
        if local is None:
            errors.append(
                f"{symbol}: cannot canonicalize identifier {name} at "
                f"offset {offset}")
            return f"$invalid:{name}"
        return local

    for event in program.events:
        statement = event.statement
        if statement.kind == "declare":
            target = statement.target or ""
            canonical = f"v{len(locals_by_name)}"
            if target in locals_by_name:
                errors.append(
                    f"{symbol}: cannot canonicalize duplicate local {target}")
            locals_by_name[target] = canonical
            normalized.append(("declare", canonical))
            continue

        target = (
            identifier(statement.target, statement.offset)
            if statement.target is not None else None)
        args = tuple(
            identifier(arg, statement.offset) for arg in statement.args)
        if statement.kind == "alias":
            normalized.append(("alias", target or "$invalid", *args))
        elif statement.kind == "call":
            normalized.append((
                "call", target or "$invalid", statement.callee or "", *args))
        elif statement.kind == "rc":
            normalized.append(("rc", statement.callee or "", *args))
        elif statement.kind == "return":
            normalized.append(("return", *args))
        else:
            errors.append(
                f"{symbol}: cannot canonicalize event kind {statement.kind}")
    return tuple(normalized), errors


def c_probe_template_errors(
    symbol: str,
    program: CProbeProgram,
) -> List[str]:
    """Match the complete alpha-normalized body, including exact ordering."""
    expected = C_PROBE_TEMPLATES.get(symbol)
    if expected is None:
        return [f"{symbol}: no canonical probe template"]
    actual, errors = canonical_c_probe_events(symbol, program)
    if errors:
        return errors
    if actual == expected:
        return []
    mismatch = next(
        (index for index, pair in enumerate(zip(actual, expected))
         if pair[0] != pair[1]),
        min(len(actual), len(expected)),
    )
    actual_event = actual[mismatch] if mismatch < len(actual) else "<end>"
    expected_event = (
        expected[mismatch] if mismatch < len(expected) else "<end>")
    return [
        f"{symbol}: normalized event template mismatch at {mismatch}: "
        f"{actual_event!r} != {expected_event!r} "
        f"(actual/expected events {len(actual)}/{len(expected)})"
    ]


def validate_c_probe_body(symbol: str, c_body: str) -> List[str]:
    """Parse, source-order evaluate, and template-check one probe body."""
    statements, parse_errors = parse_c_probe_statements(symbol, c_body)
    if parse_errors:
        return parse_errors
    program, evaluation_errors = evaluate_c_probe_statements(
        symbol, statements)
    if evaluation_errors:
        return evaluation_errors
    if program is None:
        return [f"{symbol}: finite-grammar evaluator produced no program"]
    return c_probe_template_errors(symbol, program)


C_PROBE_MUTATION_MATRIX = (
    (
        "identity-wrong-rc-roots",
        "ring_structural_owned_identity",
        """void* t1; void* r_local; void* t2; void* r_scope;
void* t3; void* r_decoy;
t1 = r_value; r_decoy = RING_UNIT; ring_dup(r_decoy);
r_local = t1; t2 = r_local; ring_dup(r_decoy); r_scope = t2;
ring_drop(r_decoy); t3 = r_scope; return t3;""",
        "normalized event template mismatch",
    ),
    (
        "option-wrong-rc-roots",
        "ring_structural_owned_option",
        """void* t1; void* t2; void* r_wrapped; void* r_decoy;
t1 = r_value; r_decoy = RING_UNIT; ring_dup(r_decoy);
t2 = ring_Option_some(t1); r_wrapped = t2;
ring_drop(r_decoy); return RING_UNIT;""",
        "normalized event template mismatch",
    ),
    (
        "list-wrong-drop-root",
        "ring_structural_owned_list",
        """void* t1; void* r_values; void* t2; void* t3; void* t4;
t1 = ring_list_new(); r_values = t1; t2 = r_value; t3 = r_values;
t4 = ring_List_push(t3, t2); ring_drop(r_value); return RING_UNIT;""",
        "normalized event template mismatch",
    ),
    (
        "list-use-after-drop",
        "ring_structural_owned_list",
        """void* t1; void* r_values; void* t2; void* t3; void* t4;
void* r_scope; void* t5;
t1 = ring_list_new(); r_values = t1; t2 = r_value; t3 = r_values;
ring_drop(r_values); t4 = ring_List_push(t3, t2);
r_scope = RING_UNIT; t5 = r_scope; return t5;""",
        "normalized event template mismatch",
    ),
    (
        "identity-wrong-return-root",
        "ring_structural_raw_identity",
        """void* t1; void* t2;
t1 = r_value; t2 = RING_UNIT; return t2;""",
        "normalized event template mismatch",
    ),
    (
        "option-wrong-payload-root",
        "ring_structural_raw_option",
        """void* t1; void* t2; void* r_wrapped; void* r_decoy;
r_decoy = RING_UNIT; t1 = r_decoy;
t2 = ring_Option_some(t1); r_wrapped = t2; return RING_UNIT;""",
        "normalized event template mismatch",
    ),
    (
        "option-wrong-result-local",
        "ring_structural_owned_option",
        """void* t1; void* t2; void* r_wrapped;
t1 = r_value; ring_dup(t1); t2 = ring_Option_some(t1);
r_wrapped = t1; ring_drop(t2); return RING_UNIT;""",
        "normalized event template mismatch",
    ),
    (
        "option-use-after-drop",
        "ring_structural_owned_option",
        """void* t1; void* t2; void* r_wrapped;
t1 = r_value; ring_dup(t1); t2 = ring_Option_some(t1);
ring_drop(t2); r_wrapped = t2; return RING_UNIT;""",
        "normalized event template mismatch",
    ),
    (
        "option-missing-constructor",
        "ring_structural_raw_option",
        """void* t1; void* r_wrapped;
t1 = r_value; r_wrapped = t1; return RING_UNIT;""",
        "normalized event template mismatch",
    ),
    (
        "list-wrong-push-receiver",
        "ring_structural_raw_list",
        """void* t1; void* r_values; void* t2; void* t3;
t1 = ring_list_new(); r_values = t1; t2 = r_value;
t3 = ring_List_push(t2, t2); return RING_UNIT;""",
        "normalized event template mismatch",
    ),
    (
        "list-missing-push",
        "ring_structural_raw_list",
        """void* t1; void* r_values;
t1 = ring_list_new(); r_values = t1; return RING_UNIT;""",
        "normalized event template mismatch",
    ),
    (
        "return-before-dead-rc",
        "ring_structural_owned_option",
        """void* t1; void* t2; void* r_wrapped;
t1 = r_value; ring_dup(t1); t2 = ring_Option_some(t1);
r_wrapped = t2; return RING_UNIT; ring_drop(r_wrapped);""",
        "return event is not the final statement",
    ),
    (
        "conditional-rc",
        "ring_structural_owned_option",
        """void* t1; void* t2; void* r_wrapped;
t1 = r_value; ring_dup(t1); t2 = ring_Option_some(t1);
r_wrapped = t2; if (r_value) { ring_drop(r_wrapped); }
return RING_UNIT;""",
        "control flow is outside finite grammar",
    ),
    (
        "aborting-extra-call",
        "ring_structural_owned_option",
        """void* t1; void* t2; void* r_wrapped;
t1 = r_value; ring_dup(t1); t2 = ring_Option_some(t1);
r_wrapped = t2; ring_drop(r_wrapped); ring_panic(r_wrapped);
return RING_UNIT;""",
        "standalone call ring_panic is outside finite grammar",
    ),
    (
        "late-rc-alias",
        "ring_structural_owned_option",
        """void* t1; void* t2; void* r_wrapped; void* r_late;
t1 = r_value; ring_dup(r_late); t2 = ring_Option_some(t1);
r_wrapped = t2; ring_drop(r_wrapped); r_late = r_value;
return RING_UNIT;""",
        "r_late used before initialization",
    ),
    (
        "future-payload-alias",
        "ring_structural_owned_option",
        """void* t1; void* t2; void* r_wrapped; void* r_late;
t1 = r_late; ring_dup(r_value); t2 = ring_Option_some(t1);
r_wrapped = t2; ring_drop(r_wrapped); r_late = r_value;
return RING_UNIT;""",
        "r_late used before initialization",
    ),
    (
        "future-result-alias",
        "ring_structural_owned_option",
        """void* t1; void* t2; void* r_wrapped;
t1 = r_value; ring_dup(t1); r_wrapped = t2;
t2 = ring_Option_some(t1); ring_drop(r_wrapped);
return RING_UNIT;""",
        "t2 used before initialization",
    ),
    (
        "preprocessor-hidden-probe",
        "ring_structural_owned_option",
        """void* t1; void* t2; void* r_wrapped;
#ifdef RING_NEVER_DEFINED
t1 = r_value; ring_dup(t1); t2 = ring_Option_some(t1);
r_wrapped = t2; ring_drop(r_wrapped);
#endif
return RING_UNIT;""",
        "preprocessor directive is outside finite grammar",
    ),
    (
        "line-spliced-comment-hidden-probe",
        "ring_structural_owned_option",
        "void* t1; void* t2; void* r_wrapped;\n"
        "// hidden probe \\\n"
        "t1 = r_value; \\\n"
        "ring_dup(t1); \\\n"
        "t2 = ring_Option_some(t1); \\\n"
        "r_wrapped = t2; \\\n"
        "ring_drop(r_wrapped);\n"
        "return RING_UNIT;",
        "backslash-newline splice is outside finite grammar",
    ),
)


def c_probe_mutation_matrix_errors() -> List[str]:
    """Keep every accepted Argument counterexample permanently rejected."""
    errors: List[str] = []
    for name, symbol, body, expected_fragment in C_PROBE_MUTATION_MATRIX:
        mutation_errors = validate_c_probe_body(symbol, body)
        if not mutation_errors:
            errors.append(f"mutation {name} was accepted")
            continue
        if not any(expected_fragment in error for error in mutation_errors):
            errors.append(
                f"mutation {name} missed {expected_fragment!r}: "
                f"{' | '.join(mutation_errors)}")
    return errors


def decode_c_path(encoded: str) -> str:
    """Decode the limited C escapes emitted in generated #line paths."""
    result: List[str] = []
    escapes = {
        "\\": "\\", '"': '"', "n": "\n", "r": "\r", "t": "\t",
    }
    index = 0
    while index < len(encoded):
        char = encoded[index]
        if char != "\\":
            result.append(char)
            index += 1
            continue
        if index + 1 >= len(encoded) or encoded[index + 1] not in escapes:
            raise ValueError(f"unsupported C escape in #line path: {encoded!r}")
        result.append(escapes[encoded[index + 1]])
        index += 2
    return "".join(result)


def parse_c_line_directives(
    c_source: str,
) -> Tuple[List[Tuple[int, int, str]], List[str]]:
    """Parse every directive-like line and require canonical column-0 syntax."""
    directives: List[Tuple[int, int, str]] = []
    errors: List[str] = []
    offset = 0
    for line_number, line in enumerate(c_source.splitlines(keepends=True), 1):
        text = line.rstrip("\r\n")
        if re.match(r"^[ \t]*#[ \t]*line\b", text):
            match = C_LINE_DIRECTIVE_RE.fullmatch(text)
            if not match:
                errors.append(
                    f"generated C line {line_number} has non-canonical #line: "
                    f"{text[:120]!r}")
            else:
                try:
                    path = decode_c_path(match.group("path"))
                except ValueError as exc:
                    errors.append(f"generated C line {line_number}: {exc}")
                else:
                    directives.append((offset, int(match.group("line")), path))
        offset += len(line)
    return directives, errors


def normalized_newline_bytes(path: Path) -> bytes:
    """Read bytes while normalizing only platform line endings."""
    return path.read_bytes().replace(b"\r\n", b"\n")


def without_c_line_directives(data: bytes) -> bytes:
    """Remove canonical column-0 #line records from normalized generated C."""
    return b"".join(
        line for line in data.splitlines(keepends=True)
        if not line.startswith(b"#line ")
    )


def build_c_artifacts_fresh(
    ring_exe: str,
    entry_text: str,
    temp_root: Path,
    *,
    no_c_lines: bool,
    phase_case: Optional[str] = None,
) -> Tuple[Optional[Path], Optional[Path], Optional[str]]:
    """Build into a newly-created empty dir and require fresh .c/.o outputs."""
    mode = "off" if no_c_lines else "default"
    out_dir = Path(tempfile.mkdtemp(prefix=f"{mode}_", dir=str(temp_root)))
    if any(out_dir.iterdir()):
        return None, None, f"fresh output directory was not empty: {out_dir}"
    entry = (REPO / entry_text).resolve()
    extra_args = ["--no-c-lines"] if no_c_lines else None
    try:
        result = ring_build(
            ring_exe, str(entry), out_dir=str(out_dir),
            extra_args=extra_args, phase_suite="structural",
            phase_case=phase_case)
    except subprocess.TimeoutExpired:
        return None, None, f"{mode} C build timed out for {entry_text}"
    if result.returncode != 0:
        output = norm(result.stderr or result.stdout or "")[:500]
        return None, None, (
            f"{mode} C build failed (exit {result.returncode}) for "
            f"{entry_text}: {output}")

    expected_c = out_dir / f"{entry.stem}.c"
    expected_o = out_dir / f"{entry.stem}.o"
    actual_c = sorted(path.resolve() for path in out_dir.rglob("*.c"))
    actual_o = sorted(path.resolve() for path in out_dir.rglob("*.o"))
    if actual_c != [expected_c.resolve()] or actual_o != [expected_o.resolve()]:
        return None, None, (
            f"{mode} C build emitted unexpected artifacts for {entry_text}: "
            f".c={len(actual_c)}, .o={len(actual_o)}")
    if expected_c.stat().st_size == 0 or expected_o.stat().st_size == 0:
        return None, None, f"{mode} C build emitted an empty artifact for {entry_text}"
    return expected_c, expected_o, None


def validate_line_directive_pair(
    default_c: Path,
    off_c: Path,
    marker_path: Path,
    marker_id: str,
    marker_line: int,
) -> List[str]:
    """Validate mapping, global disablement, and byte-equivalence modulo lines."""
    errors: List[str] = []
    try:
        default_bytes = normalized_newline_bytes(default_c)
        off_bytes = normalized_newline_bytes(off_c)
        default_source = default_bytes.decode("utf-8")
        off_source = off_bytes.decode("utf-8")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read generated C: {exc}"]

    directives, parse_errors = parse_c_line_directives(default_source)
    errors.extend(parse_errors)
    if not directives:
        errors.append("default generated C contains no canonical #line directives")

    # Every non-synthetic directive must name an absolute, existing source and
    # a line inside that source. The marker below proves exact statement-level
    # mapping, rather than accepting a merely in-range number.
    source_line_counts: dict[str, int] = {}
    for _, line, path_text in directives:
        if path_text == "<perceus>":
            if line != 0:
                errors.append(f"synthetic <perceus> directive uses line {line}")
            continue
        source_path = Path(path_text)
        if not source_path.is_absolute():
            errors.append(f"#line path is not absolute: {path_text}")
            continue
        if path_text not in source_line_counts:
            try:
                source_line_counts[path_text] = len(
                    source_path.read_text(encoding="utf-8").splitlines())
            except (OSError, UnicodeError) as exc:
                errors.append(f"#line source cannot be read: {path_text}: {exc}")
                continue
        if line < 1 or line > source_line_counts[path_text]:
            errors.append(
                f"#line {line} is outside source {path_text} "
                f"(1..{source_line_counts[path_text]})")

    off_directives, off_parse_errors = parse_c_line_directives(off_source)
    errors.extend(off_parse_errors)
    if off_directives or re.search(r"(?m)^[ \t]*#[ \t]*line\b", off_source):
        errors.append("--no-c-lines generated C still contains a #line directive")

    masked_c = mask_c_strings_and_comments(default_source)
    assignment_re = re.compile(
        rf"(?m)^[ \t]*r_{re.escape(marker_id)}[ \t]*=")
    assignments = list(assignment_re.finditer(masked_c))
    if len(assignments) != 1:
        errors.append(
            f"generated marker assignment r_{marker_id} found "
            f"{len(assignments)} times")
    else:
        prior = [directive for directive in directives
                 if directive[0] < assignments[0].start()]
        if not prior:
            errors.append(f"marker {marker_id} has no preceding #line directive")
        else:
            _, actual_line, actual_path = prior[-1]
            expected_path = str(marker_path.resolve())
            if actual_line != marker_line or actual_path != expected_path:
                errors.append(
                    f"marker {marker_id} maps to {actual_path}:{actual_line}, "
                    f"expected {expected_path}:{marker_line}")

    if without_c_line_directives(default_bytes) != off_bytes:
        errors.append(
            "default generated C after removing #line records differs from "
            "--no-c-lines output")
    return errors


def run_c_line_oracle(
    ring_exe: str,
    temp_root: Path,
    entry: str,
    fixtures: Tuple[str, ...],
    phase_case: Optional[str] = None,
) -> List[str]:
    """Build one line-directive fixture in both modes and compare artifacts."""
    markers: List[Tuple[Path, str, int]] = []
    for fixture in fixtures:
        path = REPO / fixture
        found, error = ring_line_markers(path)
        if error:
            return [error]
        markers.extend((path, marker_id, line) for marker_id, line in found)
    if len(markers) != 1:
        return [f"{entry}: expected one real-code marker, found {len(markers)}"]

    default_c, _, error = build_c_artifacts_fresh(
        ring_exe, entry, temp_root, no_c_lines=False,
        phase_case=phase_case)
    if error:
        return [error]
    off_c, _, error = build_c_artifacts_fresh(
        ring_exe, entry, temp_root, no_c_lines=True,
        phase_case=phase_case)
    if error:
        return [error]
    marker_path, marker_id, marker_line = markers[0]
    return validate_line_directive_pair(
        default_c, off_c, marker_path, marker_id, marker_line)


def exact_rc_error(symbol: str, body: str,
                   expected: Tuple[int, int]) -> Optional[str]:
    actual = c_rc_counts(body)
    if actual != expected:
        return (
            f"{symbol}: expected ring_dup/ring_drop {expected[0]}/{expected[1]}, "
            f"found {actual[0]}/{actual[1]}")
    return None


CLOSURE_ENV_HOST_EXPECTATIONS = {
    "ring_structural_ordinary_ptr_capture": (
        (1, ("r_value",), (0,)),
    ),
    "ring_structural_ordinary_handle_capture": (
        (1, ("r_value",), (0,)),
    ),
    "ring_structural_ordinary_list_handle_capture": (
        (1, ("r_values",), (0,)),
    ),
    "ring_structural_ordinary_str_capture": (
        (1, ("r_value",), (1,)),
    ),
    "ring_structural_handler_ptr_capture": (
        (1, ("r_value",), (0,)),
    ),
    "ring_structural_handler_handle_capture": (
        (1, ("r_value",), (0,)),
    ),
    "ring_structural_handler_list_handle_capture": (
        (1, ("r_values",), (0,)),
    ),
    "ring_structural_handler_str_capture": (
        (1, ("r_value",), (1,)),
    ),
    "ring_structural_handler_int_capture": (
        (1, ("r_value",), (1,)),
    ),
    # Handler arm env (zero captures), then the named function-value wrapper
    # whose sole thunk-visible slot is the current evidence.
    "ring_structural_named_value_local": (
        (0, (), ()),
        (1, ("r___ring_ev_StructuralBoundRead",), (1,)),
    ),
    "ring_structural_named_value_early_local": (
        (0, (), ()),
        (1, ("r___ring_ev_StructuralBoundRead",), (1,)),
    ),
    # Reads after Return/Never are unreachable and must not become capture
    # slots in either the ordinary-lambda or handler-arm collector.
    "ring_structural_dead_lambda_return": (
        (0, (), ()),
    ),
    "ring_structural_dead_lambda_never": (
        (0, (), ()),
    ),
    "ring_structural_dead_handler_return": (
        (0, (), ()),
    ),
    "ring_structural_dead_handler_never": (
        (0, (), ()),
    ),
}


def validate_closure_env_host(
    c_source: str,
    symbol: str,
    expected: Tuple[Tuple[int, Tuple[str, ...], Tuple[int, ...]], ...],
) -> Tuple[List[str], List[CClosureEnvRecord], Optional[str]]:
    """Validate all masked envs and exact dup roots in one host function."""
    body, extract_error = extract_c_function_body(c_source, symbol)
    if extract_error:
        return [extract_error], [], None
    records, parse_errors = parse_c_closure_env_records(body)
    errors = [f"{symbol}: {error}" for error in parse_errors]
    if len(records) != len(expected):
        errors.append(
            f"{symbol}: expected {len(expected)} masked closure envs, "
            f"found {len(records)}")

    expected_dups: dict[str, int] = {}
    expected_capture_names: set[str] = set()
    for index, spec in enumerate(expected):
        count, captures, masks = spec
        for capture, mask in zip(captures, masks):
            expected_capture_names.add(capture)
            expected_dups[capture] = expected_dups.get(capture, 0) + mask
        if index >= len(records):
            continue
        record = records[index]
        actual = (record.capture_count, record.captures, record.masks)
        if actual != spec:
            errors.append(
                f"{symbol}: env {index} shape {actual!r} != {spec!r}")

    for capture in sorted(expected_capture_names):
        actual_dups = exact_c_unary_call_count(body, "ring_dup", capture)
        expected_count = expected_dups[capture]
        if actual_dups != expected_count:
            errors.append(
                f"{symbol}: expected ring_dup({capture}) {expected_count} "
                f"times, found {actual_dups}")
        # These fixture parameters are borrowed at the host boundary. Their
        # only physical release, when eligible, belongs to the env mask.
        if not capture.startswith("r___ring_ev_"):
            direct_drops = exact_c_unary_call_count(
                body, "ring_drop", capture)
            if direct_drops != 0:
                errors.append(
                    f"{symbol}: capture root {capture} has {direct_drops} "
                    "direct ring_drop calls")
    return errors, records, body


def special_env_cleanup_order_errors(
    symbol: str,
    body: str,
    record: CClosureEnvRecord,
    evidence: str,
) -> List[str]:
    """Require owned evidence before its lexical handler ref is released."""
    masked = mask_c_strings_and_comments(body)
    region = masked[record.start:record.end]

    def sole(pattern: str, description: str) -> Optional[int]:
        matches = list(re.finditer(pattern, region))
        if len(matches) != 1:
            errors.append(
                f"{symbol}: {record.env} expected one {description}, "
                f"found {len(matches)}")
            return None
        return matches[0].start()

    errors: List[str] = []
    dup_at = sole(
        rf"\bring_dup\s*\(\s*{re.escape(evidence)}\s*\)",
        "evidence dup",
    )
    capture_at = sole(
        rf"\(\(\s*void\s*\*\s*\*\s*\)\s*{re.escape(record.env)}\s*\)"
        rf"\s*\[\s*1\s*\]\s*=\s*{re.escape(evidence)}\s*;",
        "evidence capture store",
    )
    mask_at = sole(
        rf"\(\(\s*intptr_t\s*\*\s*\).*?\)\s*\[\s*0\s*\]"
        rf"\s*=\s*1\s*;",
        "owned mask store",
    )
    link_at = sole(
        rf"\(\(\s*void\s*\*\s*\*\s*\)\s*{C_IDENTIFIER}\s*\)"
        rf"\s*\[\s*1\s*\]\s*=\s*{re.escape(record.env)}\s*;",
        "wrapper env link",
    )
    drop_matches = list(re.finditer(
        rf"\bring_drop\s*\(\s*{re.escape(evidence)}\s*\)", region))
    return_matches = list(re.finditer(r"\breturn\b", region))
    if not drop_matches:
        errors.append(f"{symbol}: no lexical evidence drop after wrapper build")
    if not return_matches:
        errors.append(f"{symbol}: no return after wrapper build")
    if (
        None not in (dup_at, capture_at, mask_at, link_at)
        and drop_matches and return_matches
    ):
        order = (
            dup_at, capture_at, mask_at, link_at,
            drop_matches[0].start(), return_matches[0].start(),
        )
        if list(order) != sorted(order):
            errors.append(
                f"{symbol}: evidence dup/store/mask/link/drop/return "
                f"order is invalid: {order}")
    return errors


def masked_closure_runtime_errors(
    generated_type_ids: set[int],
) -> Tuple[List[str], Optional[int]]:
    """Tie generated env typeids to the runtime's mask-aware destructor."""
    errors: List[str] = []
    try:
        runtime_source = RUNTIME_CPP.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read ring_runtime.cpp: {exc}"], None
    masked = mask_c_strings_and_comments(runtime_source)
    macro_matches = re.findall(
        r"(?m)^\s*#\s*define\s+RING_TYPEID_CLOSURE_ENV_MASKED\s+"
        r"([0-9]+)\s*$",
        masked,
    )
    if len(macro_matches) != 1:
        errors.append(
            "runtime must define RING_TYPEID_CLOSURE_ENV_MASKED exactly once")
        return errors, None
    masked_type_id = int(macro_matches[0])
    if generated_type_ids != {masked_type_id}:
        errors.append(
            f"generated masked env typeids {sorted(generated_type_ids)} != "
            f"runtime masked typeid {masked_type_id}")

    registration = re.findall(
        r"drop_table\s*\[\s*RING_TYPEID_CLOSURE_ENV_MASKED\s*\]\s*="
        r"\s*drop_closure_env_masked\s*;",
        masked,
    )
    if len(registration) != 1:
        errors.append(
            "runtime must register drop_closure_env_masked exactly once")

    drop_body, extract_error = extract_c_function_body(
        runtime_source, "drop_closure_env_masked")
    if extract_error:
        errors.append(extract_error)
        return errors, masked_type_id
    masked_body = mask_c_strings_and_comments(drop_body)
    slots_match = re.search(
        rf"void\s*\*\s*\*\s*(?P<slots>{C_IDENTIFIER})\s*=\s*"
        r"\(\s*void\s*\*\s*\*\s*\)\s*\(\s*\(\s*char\s*\*\s*\)"
        r"\s*data\s*\+\s*(?:sizeof\s*\(\s*int64_t\s*\)|8)\s*\)"
        r"\s*;",
        masked_body,
    )
    mask_match = None
    if slots_match is not None:
        slots_name = slots_match.group("slots")
        mask_match = re.search(
            rf"intptr_t\s*\*\s*(?P<mask>{C_IDENTIFIER})\s*=\s*"
            r"\(\s*intptr_t\s*\*\s*\)\s*\(\s*\(\s*char\s*\*\s*\)"
            rf"\s*{re.escape(slots_name)}\s*\+\s*count\s*\*\s*"
            r"sizeof\s*\(\s*void\s*\*\s*\)\s*\)\s*;",
            masked_body,
        )
    if slots_match is None:
        errors.append("drop_closure_env_masked has no exact capture array")
    if mask_match is None:
        errors.append("drop_closure_env_masked has no parallel intptr_t mask")
    if slots_match is not None and mask_match is not None:
        slots = slots_match.group("slots")
        rc_mask = mask_match.group("mask")
        guarded_drop = re.search(
            rf"if\s*\(\s*{re.escape(rc_mask)}\s*\[\s*"
            rf"(?P<index>{C_IDENTIFIER})\s*\]\s*!=\s*0\s*&&\s*"
            rf"{re.escape(slots)}\s*\[\s*(?P=index)\s*\]\s*\)\s*"
            rf"(?:\{{\s*)?ring_drop\s*\(\s*{re.escape(slots)}\s*"
            rf"\[\s*(?P=index)\s*\]\s*\)\s*;",
            masked_body,
        )
        if guarded_drop is None:
            errors.append(
                "drop_closure_env_masked does not guard slot drop by mask")
    return errors, masked_type_id


def run_closure_env_rc_oracle(
    ring_exe: str, temp_root: Path,
    phase_case: Optional[str] = None,
) -> List[str]:
    """Inspect closure env capture masks without fabricating raw values."""
    c_path, _, error = build_c_artifacts_fresh(
        ring_exe, CLOSURE_ENV_RC_FIXTURE, temp_root, no_c_lines=True,
        phase_case=phase_case)
    if error:
        return [error]
    try:
        c_source = c_path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read generated closure-env C: {exc}"]
    errors: List[str] = []
    if re.search(r"(?m)^[ \t]*#[ \t]*line\b", c_source):
        errors.append("closure-env --no-c-lines artifact contains #line")

    host_records: List[CClosureEnvRecord] = []
    host_bodies: dict[str, str] = {}
    for symbol, expected in CLOSURE_ENV_HOST_EXPECTATIONS.items():
        host_errors, records, body = validate_closure_env_host(
            c_source, symbol, expected)
        errors.extend(host_errors)
        host_records.extend(records)
        if body is not None:
            host_bodies[symbol] = body

    evidence = "r___ring_ev_StructuralBoundRead"
    for symbol in (
        "ring_structural_named_value_local",
        "ring_structural_named_value_early_local",
    ):
        body = host_bodies.get(symbol)
        _, records, _ = validate_closure_env_host(
            c_source, symbol, CLOSURE_ENV_HOST_EXPECTATIONS[symbol])
        if body is not None and len(records) >= 2:
            errors.extend(special_env_cleanup_order_errors(
                symbol, body, records[1], evidence))

    # Every recognized masked env must use the runtime-registered destructor.
    generated_type_ids = {record.type_id for record in host_records}
    runtime_errors, masked_type_id = masked_closure_runtime_errors(
        generated_type_ids)
    errors.extend(runtime_errors)

    masked_source = mask_c_strings_and_comments(c_source)
    legacy_allocs = re.findall(
        r"(?m)^[^\n]*\bring_alloc\s*\([^\n]*,\s*15\s*\)\s*;",
        masked_source,
    )
    if legacy_allocs:
        errors.append(
            "generated C still contains legacy typeid-15 closure env "
            f"allocations ({len(legacy_allocs)})")
    if masked_type_id is not None:
        masked_alloc_lines = re.findall(
            rf"(?m)^[^\n]*\bring_alloc\s*\([^\n]*,\s*"
            rf"{masked_type_id}\s*\)\s*;",
            masked_source,
        )
        all_records, all_parse_errors = parse_c_closure_env_records(c_source)
        errors.extend(
            f"generated C: {parse_error}"
            for parse_error in all_parse_errors
        )
        masked_records = [
            record for record in all_records
            if record.type_id == masked_type_id
        ]
        if len(masked_alloc_lines) != len(masked_records):
            errors.append(
                f"masked typeid {masked_type_id} allocations/parsed envs differ "
                f"({len(masked_alloc_lines)}/{len(masked_records)})")
    return errors


def run_extern_rc_oracle(ring_exe: str, temp_root: Path,
                         phase_case: Optional[str] = None) -> List[str]:
    """Inspect local generated-C bodies without executing any raw handle."""
    errors = c_probe_mutation_matrix_errors()
    c_path, _, error = build_c_artifacts_fresh(
        ring_exe, EXTERN_RC_FIXTURE, temp_root, no_c_lines=True,
        phase_case=phase_case)
    if error:
        return [error]
    try:
        c_source = c_path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read generated extern-handle C: {exc}"]
    if re.search(r"(?m)^[ \t]*#[ \t]*line\b", c_source):
        errors.append("extern-handle --no-c-lines artifact contains #line")

    function_expectations = {
        **{symbol: None for symbol in C_PROBE_TEMPLATES},
        "ring_drop_StructuralHolder": (0, 1),
    }
    bodies: dict[str, str] = {}
    for symbol, expected in function_expectations.items():
        body, extract_error = extract_c_function_body(c_source, symbol)
        if extract_error:
            errors.append(extract_error)
            continue
        bodies[symbol] = body
        if expected is not None:
            count_error = exact_rc_error(symbol, body, expected)
            if count_error:
                errors.append(count_error)
        if symbol in C_PROBE_TEMPLATES:
            errors.extend(validate_c_probe_body(symbol, body))

    holder_body = bodies.get("ring_drop_StructuralHolder")
    if holder_body is not None:
        masked_holder = mask_c_strings_and_comments(holder_body)
        holder_slots = re.findall(
            r"\bring_drop\s*\(\s*\(\(void\s*\*\s*\*\)p\)"
            r"\s*\[\s*([0-9]+)\s*\]\s*\)",
            masked_holder,
        )
        if holder_slots != ["1"]:
            errors.append(
                "ring_drop_StructuralHolder must drop exactly owned slot 1; "
                f"found slots {holder_slots}")

    choice_body, extract_error = extract_c_function_body(
        c_source, "ring_drop_StructuralChoice")
    if extract_error:
        errors.append(extract_error)
    else:
        count_error = exact_rc_error(
            "ring_drop_StructuralChoice", choice_body, (0, 1))
        if count_error:
            errors.append(count_error)
        cases, case_error = extract_c_switch_cases(choice_body)
        if case_error:
            errors.append(f"ring_drop_StructuralChoice: {case_error}")
        elif set(cases) != {"0", "1", "default"}:
            errors.append(
                "ring_drop_StructuralChoice labels differ from "
                f"0/1/default: {sorted(cases)}")
        else:
            for label, expected in (("0", (0, 0)), ("1", (0, 1)),
                                    ("default", (0, 0))):
                count_error = exact_rc_error(
                    f"ring_drop_StructuralChoice case {label}",
                    cases[label], expected)
                if count_error:
                    errors.append(count_error)
            masked_owned = mask_c_strings_and_comments(cases["1"])
            owned_slots = re.findall(
                r"\bring_drop\s*\(\s*\(\(void\s*\*\s*\*\)p\)"
                r"\s*\[\s*([0-9]+)\s*\]\s*\)",
                masked_owned,
            )
            if owned_slots != ["1"]:
                errors.append(
                    "StructuralChoice::Owned must drop exactly payload slot 1; "
                    f"found slots {owned_slots}")

    return errors


def spread_never_body_sequence_errors(
    body: str, symbol: str, source_callee: str,
) -> List[str]:
    """Require a reachable top-level source statement before return and alloc."""
    errors: List[str] = []
    masked = mask_c_strings_and_comments(body)
    statements = top_level_c_statements(masked)
    source_statements = [
        statement for statement in statements
        if re.search(rf"\b{source_callee}\s*\(", statement[2])
    ]
    return_statements = [
        statement for statement in statements
        if re.match(r"\s*return\b", statement[2])
    ]
    alloc_statements = [
        statement for statement in statements
        if re.search(r"\bring_alloc\s*\(", statement[2])
    ]
    source_lhs: Optional[str] = None
    if len(source_statements) != 1:
        errors.append(
            f"{symbol}: expected one reachable top-level {source_callee} "
            f"evaluation statement, found {len(source_statements)}")
    else:
        source_assignment = re.fullmatch(
            rf"\s*(?:void\s*\*\s*)?"
            rf"(?P<lhs>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*"
            rf"{source_callee}\s*\([^;]*\)\s*;\s*",
            source_statements[0][2],
        )
        if source_assignment is None:
            errors.append(
                f"{symbol}: source call is not a standalone reachable "
                "top-level evaluation statement")
        else:
            source_lhs = source_assignment.group("lhs")
    if not alloc_statements:
        errors.append(
            f"{symbol}: missing reachable top-level destination allocation")
    else:
        first_alloc = alloc_statements[0]
        early_returns = [
            statement for statement in return_statements
            if statement[0] < first_alloc[0]
        ]
        if len(early_returns) != 1:
            errors.append(
                f"{symbol}: expected exactly one early return before the "
                f"destination allocation, found {len(early_returns)}")
        elif source_lhs is not None and re.fullmatch(
            rf"\s*return\s+{re.escape(source_lhs)}\s*;\s*",
            early_returns[0][2],
        ) is None:
            errors.append(
                f"{symbol}: early return must return the exact source "
                f"assignment '{source_lhs}'")
        if (len(source_statements) == 1 and return_statements and not (
                source_statements[0][0] < return_statements[0][0] <
                first_alloc[0])):
            errors.append(
                f"{symbol}: destination allocation must follow the "
                "Never/Return spread source")
    if "RING_INEG" in masked:
        errors.append(
            f"{symbol}: unreachable explicit fields/tail survived "
            "physical spread pruning")
    return errors


def top_level_c_statements(masked_body: str) -> List[Tuple[int, int, str]]:
    """Split semicolon statements executed at function-body brace depth zero."""
    statements: List[Tuple[int, int, str]] = []
    depth = 0
    start = 0
    for index, char in enumerate(masked_body):
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                # A completed compound control statement is not an evaluation
                # statement merely because it contains a nested semicolon.
                start = index + 1
        elif char == ";" and depth == 0:
            text = masked_body[start:index + 1]
            if text.strip():
                statements.append((start, index + 1, text))
            start = index + 1
    return statements


def spread_sequence_statement_oracle_self_test_errors() -> List[str]:
    """Challenge the C oracle with independent valid/reordered/dead programs."""
    errors: List[str] = []
    cases = (
        ("ring_spread_never_struct", "ring_make_packet"),
        ("ring_spread_never_variant", "ring_make_envelope"),
    )
    for symbol, source_callee in cases:
        valid = (
            f"tmp_source = {source_callee}(RING_INT(0));\n"
            "return tmp_source;\n"
            "tmp_destination = ring_alloc(16, 1);\n"
            "tmp_field = RING_INT(1);\n"
            "return tmp_destination;\n"
        )
        valid_errors = spread_never_body_sequence_errors(
            valid, symbol, source_callee)
        if valid_errors:
            errors.append(
                f"{symbol}: independent valid sequence rejected by oracle: "
                + "; ".join(valid_errors))

        reordered = (
            "tmp_destination = ring_alloc(16, 1);\n"
            f"tmp_source = {source_callee}(RING_INT(0));\n"
            "return tmp_source;\n"
            "tmp_field = RING_INT(1);\n"
            "return tmp_destination;\n"
        )
        reordered_errors = spread_never_body_sequence_errors(
            reordered, symbol, source_callee)
        if not any(
            "destination allocation must follow" in error
            for error in reordered_errors
        ):
            errors.append(
                f"{symbol}: independent reordered statements escaped the "
                "generated-C sequence oracle")

        dead_decoy = (
            f"if (0) {{ tmp_decoy = {source_callee}(RING_INT(0)); }}\n"
            "return existing_value;\n"
            "tmp_destination = ring_alloc(16, 1);\n"
            "tmp_field = RING_INT(1);\n"
            "return tmp_destination;\n"
        )
        decoy_errors = spread_never_body_sequence_errors(
            dead_decoy, symbol, source_callee)
        if not any(
            "reachable top-level" in error for error in decoy_errors
        ):
            errors.append(
                f"{symbol}: dead-if source decoy escaped the generated-C "
                "sequence oracle")

        wrong_lhs = (
            f"wrong_source = {source_callee}(RING_INT(0));\n"
            "return unrelated_source;\n"
            "wrong_destination = ring_alloc(16, 1);\n"
            "wrong_field = RING_INT(1);\n"
            "return wrong_destination;\n"
        )
        wrong_lhs_errors = spread_never_body_sequence_errors(
            wrong_lhs, symbol, source_callee)
        if not any(
            "early return must return the exact source assignment "
            "'wrong_source'" in error
            for error in wrong_lhs_errors
        ):
            errors.append(
                f"{symbol}: independent wrong-lhs body escaped exact source "
                "return validation")

        multiple_early = (
            f"first_source = {source_callee}(RING_INT(0));\n"
            "return first_source;\n"
            "return first_source;\n"
            "first_destination = ring_alloc(16, 1);\n"
            "first_field = RING_INT(1);\n"
            "return first_destination;\n"
        )
        multiple_early_errors = spread_never_body_sequence_errors(
            multiple_early, symbol, source_callee)
        if not any(
            "expected exactly one early return before the destination "
            "allocation, found 2" in error
            for error in multiple_early_errors
        ):
            errors.append(
                f"{symbol}: independent multiple-early body escaped exact "
                "early-return cardinality validation")

        missing_early = (
            f"late_source = {source_callee}(RING_INT(0));\n"
            "late_destination = ring_alloc(16, 1);\n"
            "late_field = RING_INT(1);\n"
            "return late_destination;\n"
        )
        missing_early_errors = spread_never_body_sequence_errors(
            missing_early, symbol, source_callee)
        if not any(
            "expected exactly one early return before the destination "
            "allocation, found 0" in error
            for error in missing_early_errors
        ):
            errors.append(
                f"{symbol}: independent missing-early body escaped exact "
                "early-return cardinality validation")
    return errors


def spread_source_sequence_generated_c_errors(c_source: str) -> List[str]:
    """Pin source-before-allocation and borrowed-result RC in local C bodies."""
    errors = spread_sequence_statement_oracle_self_test_errors()
    never_functions = (
        ("ring_spread_never_struct", "ring_make_packet"),
        ("ring_spread_never_variant", "ring_make_envelope"),
    )
    for symbol, source_callee in never_functions:
        body, extract_error = extract_c_function_body(c_source, symbol)
        if extract_error:
            errors.append(extract_error)
            continue
        errors.extend(spread_never_body_sequence_errors(
            body, symbol, source_callee))

    for symbol in (
        "ring_spread_borrowed_struct",
        "ring_spread_borrowed_variant",
    ):
        body, extract_error = extract_c_function_body(c_source, symbol)
        if extract_error:
            errors.append(extract_error)
            continue
        masked = mask_c_strings_and_comments(body)
        unwraps = list(re.finditer(r"\bring_Option_unwrap\s*\(", masked))
        destination_alloc = re.search(r"\bring_alloc\s*\(", masked)
        if len(unwraps) != 1 or destination_alloc is None:
            errors.append(
                f"{symbol}: expected one Option.unwrap before one or more "
                "destination/field allocations")
        elif unwraps[0].start() >= destination_alloc.start():
            errors.append(
                f"{symbol}: borrowed spread call must be evaluated before "
                "destination allocation")
        drops = re.findall(r"\bring_drop\s*\(", masked)
        if drops:
            errors.append(
                f"{symbol}: borrowed spread result acquired {len(drops)} "
                "cleanup Drop call(s)")
    return errors


def run_spread_source_sequence_oracle(
    ring_exe: str, temp_root: Path,
    phase_case: Optional[str] = None,
) -> List[str]:
    """Inspect generated C, then require alloc/free balance with stats runtime."""
    c_path, object_path, error = build_c_artifacts_fresh(
        ring_exe, SPREAD_SOURCE_SEQUENCE_FIXTURE, temp_root,
        no_c_lines=True, phase_case=phase_case)
    if error:
        return [error]
    try:
        c_source = c_path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read generated spread-sequence C: {exc}"]

    errors = spread_source_sequence_generated_c_errors(c_source)
    clang = find_clang()
    cpp_compiler = shutil.which("clang++")
    if clang is None or cpp_compiler is None:
        return errors + ["clang/clang++ unavailable for spread alloc-stats gate"]

    runtime_object = temp_root / "spread-runtime-stats.o"
    executable = temp_root / (
        "spread-source-sequence.exe" if sys.platform == "win32"
        else "spread-source-sequence")
    runtime_cmd = [
        cpp_compiler, "-std=c++17", "-O2",
        "-D_CRT_SECURE_NO_WARNINGS", "-DRING_ALLOC_STATS",
        "-c", str(RUNTIME_CPP), "-o", str(runtime_object),
    ]
    try:
        compiled_runtime = subprocess.run(
            runtime_cmd, capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=TIMEOUT_COMPILE, cwd=str(REPO))
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return errors + ["spread alloc-stats runtime compilation failed"]
    if compiled_runtime.returncode != 0:
        return errors + [
            "spread alloc-stats runtime compile failed: "
            + process_output(compiled_runtime)[:500]
        ]

    try:
        linked = subprocess.run(
            [clang, str(object_path), str(runtime_object), "-o",
             str(executable), *CLANG_LINK_FLAGS],
            capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=TIMEOUT_LINK, cwd=str(REPO))
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return errors + ["spread alloc-stats link failed"]
    if linked.returncode != 0:
        return errors + [
            "spread alloc-stats link failed: " + process_output(linked)[:500]
        ]

    try:
        executed = run_exe(str(executable))
    except subprocess.TimeoutExpired:
        return errors + ["spread alloc-stats execution timed out"]
    if executed.returncode != 0:
        return errors + [
            f"spread alloc-stats runtime exit {executed.returncode}: "
            + process_output(executed)[:500]
        ]
    if norm(executed.stdout or "") != "":
        errors.append("spread alloc-stats fixture emitted unexpected stdout")

    reports = re.findall(
        r"\[alloc-stats\]\s+allocs=(\d+)\s+frees=(\d+)\s+live=(\d+)",
        norm(executed.stderr or ""),
    )
    if len(reports) != 1:
        errors.append(
            f"spread alloc-stats expected one final report, found "
            f"{len(reports)}")
    else:
        allocs, frees, live = (int(value) for value in reports[0])
        if allocs < 4096:
            errors.append(
                f"spread alloc-stats loop did not magnify the path: "
                f"allocs={allocs}")
        if live != 0 or frees != allocs:
            errors.append(
                "spread alloc-stats must balance exactly: "
                f"allocs={allocs} frees={frees} live={live}")
    return errors


def run_structural(ring_exe: str, collector: ResultCollector, *,
                   name_filter: Optional[str] = None) -> None:
    """Run generated-C source-map and physical ownership oracles."""
    suite = "structural"
    integrity_errors = structural_fixture_integrity_errors()
    integrity_errors.extend(callable_inference_limit_source_errors())
    integrity_errors.extend(callable_nominal_walk_source_errors())
    integrity_errors.extend(callable_contract_merge_source_errors())
    integrity_errors.extend(ownership_bootstrap_transition_source_errors())
    if integrity_errors:
        for index, error in enumerate(integrity_errors, 1):
            collector.add(TestResult(
                TestResult.FAIL, suite, f"fixture validation {index}", error))
        return

    ownership_label = "compiler.ownership_shadow_layout"
    explicit_ownership_probe = (
        name_filter is not None
        and matches_filter(ownership_label, name_filter)
    )
    if explicit_ownership_probe:
        ownership_errors = ownership_shadow_layout_errors()
        collector.add(TestResult(
            TestResult.PASS if not ownership_errors else TestResult.FAIL,
            suite,
            ownership_label,
            "; ".join(ownership_errors),
        ))

    jobs = []
    for case_name, entry, fixtures in C_LINE_BUILD_CASES:
        feature_id = "backend.c_line_directives"
        label = f"{feature_id}/{case_name}"
        if (
            matches_filter(label, name_filter)
            or any(matches_filter(path, name_filter) for path in fixtures)
        ):
            jobs.append((label, "line", entry, fixtures))
    feature_id = "backend.extern_handle_rc_structural"
    if (
        matches_filter(feature_id, name_filter)
        or matches_filter(EXTERN_RC_FIXTURE, name_filter)
    ):
        jobs.append((feature_id, "extern", EXTERN_RC_FIXTURE, (EXTERN_RC_FIXTURE,)))
    feature_id = "backend.closure_env_rc_mask_structural"
    if (
        matches_filter(feature_id, name_filter)
        or matches_filter(CLOSURE_ENV_RC_FIXTURE, name_filter)
    ):
        jobs.append((
            feature_id,
            "closure-env",
            CLOSURE_ENV_RC_FIXTURE,
            (CLOSURE_ENV_RC_FIXTURE,),
        ))
    feature_id = "backend.spread_source_sequence_structural"
    if (
        matches_filter(feature_id, name_filter)
        or matches_filter(SPREAD_SOURCE_SEQUENCE_FIXTURE, name_filter)
    ):
        jobs.append((
            feature_id,
            "spread-sequence",
            SPREAD_SOURCE_SEQUENCE_FIXTURE,
            (SPREAD_SOURCE_SEQUENCE_FIXTURE,),
        ))
    with tempfile.TemporaryDirectory(prefix="ring_structural_") as tmpdir:
        temp_root = Path(tmpdir)
        for label, kind, entry, fixtures in jobs:
            if kind == "line":
                errors = run_c_line_oracle(
                    ring_exe, temp_root, entry, fixtures, label)
            elif kind == "closure-env":
                errors = run_closure_env_rc_oracle(
                    ring_exe, temp_root, label)
            elif kind == "spread-sequence":
                errors = run_spread_source_sequence_oracle(
                    ring_exe, temp_root, label)
            else:
                errors = run_extern_rc_oracle(ring_exe, temp_root, label)
                # The existing extern structural job already owns compiler/HIR
                # ownership-boundary validation. Fold the shadow transport
                # invariant into that result so the default runner gains no
                # result, scheduling phase, or pre-job scan. The explicit
                # filter above remains available for a cheap focused probe.
                if not explicit_ownership_probe:
                    errors.extend(ownership_shadow_layout_errors())
            if errors:
                collector.add(TestResult(
                    TestResult.FAIL, suite, label, "; ".join(errors)))
            else:
                collector.add(TestResult(TestResult.PASS, suite, label))


# ---------------------------------------------------------------------------
# Parity evidence matrix suite
# ---------------------------------------------------------------------------

PARITY_STATUSES = {"covered", "known-gap", "manual-evidence"}
PARITY_LANES = {
    "e2e-c", "golden-c", "native-c", "module-c",
    "check", "self-compile-c", "c-structural", "manual-source",
}
POSITIVE_PARITY_LANES = PARITY_LANES - {
    "check", "self-compile-c", "c-structural", "manual-source",
}
PARITY_GAP_TABLES = {
    "shared-positive": SHARED_POSITIVE_GAPS,
    "check-only": CHECK_ONLY_GAPS,
}


def repo_relative(path: Path) -> str:
    """Return a normalized repo-relative path."""
    return normalized_repo_path(path)


def parity_lane_members() -> dict[str, set[str]]:
    """Collect the exact evidence paths owned by each executable runner lane."""
    e2e_paths = discover_positive_cases(CASES_DIR)
    check_paths = discover_negative_cases(CASES_DIR)
    check_paths.extend(REPO / fixture for fixture in POSITIVE_CHECK_ONLY_CASES)
    for subdir_name in EXTRA_NEG_DIRS:
        e2e_paths.extend(discover_positive_cases(CASES_DIR / subdir_name))
        check_paths.extend(discover_negative_cases(CASES_DIR / subdir_name))

    golden_paths = discover_positive_cases(GOLDEN_CASES_DIR)
    native_paths = discover_positive_cases(NATIVE_ONLY_DIR)
    module_paths = discover_module_positive(MODULES_DIR)
    module_check_paths = discover_module_negative(MODULES_DIR)

    e2e = {repo_relative(path) for path in e2e_paths}
    golden = {repo_relative(path) for path in golden_paths}
    native = {repo_relative(path) for path in native_paths}
    modules = {repo_relative(path) for path in module_paths}
    checks = {repo_relative(path) for path in check_paths + module_check_paths}
    structural = structural_fixture_paths()

    return {
        "e2e-c": e2e,
        "golden-c": golden,
        "native-c": native,
        "module-c": modules,
        "check": checks,
        "self-compile-c": {"compiler/main.ring"},
        "c-structural": structural,
    }


def display_path(path: Path) -> str:
    """Use repo-relative paths when possible, absolute paths for temp probes."""
    try:
        return repo_relative(path)
    except ValueError:
        return path.resolve().as_posix()


def companion_integrity_errors(
    cases_dir: Path = CASES_DIR,
    native_dir: Path = NATIVE_ONLY_DIR,
) -> List[str]:
    """Reject orphan companions and EXPECT_PANIC outside native_only."""
    errors: List[str] = []
    for companion in cases_dir.rglob("*"):
        if not companion.is_file() or companion.suffix not in {".expected", ".error"}:
            continue
        ring_file = companion.with_suffix(".ring")
        if not ring_file.is_file():
            errors.append(
                f"orphan companion without same-stem .ring: "
                f"{display_path(companion)}"
            )
        if companion.suffix != ".expected":
            continue
        try:
            expected_raw = companion.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            errors.append(f"cannot read {display_path(companion)}: {exc}")
            continue
        if (
            is_expect_panic(expected_raw)
            and companion.resolve().parent != native_dir.resolve()
        ):
            errors.append(
                f"EXPECT_PANIC outside native_only: {display_path(companion)}"
            )
    return errors


def mask_ring_strings_and_comments(source: str) -> str:
    """Blank strings and // comments while preserving offsets and newlines."""
    masked: List[str] = []
    state = "code"
    index = 0
    while index < len(source):
        char = source[index]
        next_char = source[index + 1] if index + 1 < len(source) else ""

        if state == "code":
            if char == "/" and next_char == "/":
                masked.extend([" ", " "])
                index += 2
                state = "comment"
                continue
            if char == '"':
                masked.append(" ")
                index += 1
                state = "string"
                continue
            masked.append(char)
            index += 1
            continue

        if state == "comment":
            if char == "\n":
                masked.append("\n")
                state = "code"
            else:
                masked.append(" ")
            index += 1
            continue

        # String state.  Escaped quotes and escaped backslashes remain inside
        # the string; newlines are preserved so diagnostics keep line numbers.
        if char == "\\" and next_char:
            masked.append(" ")
            masked.append("\n" if next_char == "\n" else " ")
            index += 2
        elif char == '"':
            masked.append(" ")
            index += 1
            state = "code"
        else:
            masked.append("\n" if char == "\n" else " ")
            index += 1

    return "".join(masked)


def extract_enum_variants(source_path: Path, enum_name: str) -> set[str]:
    """Extract top-level variants from a Ring enum declaration.

    The parser is deliberately small but brace-aware: commas inside struct
    fields, tuples, lists, or generic arguments do not split variants.
    """
    source = mask_ring_strings_and_comments(
        source_path.read_text(encoding="utf-8"))
    match = re.search(
        rf"\bpub\s+enum\s+{re.escape(enum_name)}\s*\{{", source)
    if not match:
        raise ValueError(
            f"enum {enum_name} not found in {display_path(source_path)}")

    open_index = match.end() - 1
    outer_depth = 0
    close_index = None
    for index in range(open_index, len(source)):
        char = source[index]
        if char == "{":
            outer_depth += 1
        elif char == "}":
            outer_depth -= 1
            if outer_depth == 0:
                close_index = index
                break
    if close_index is None:
        raise ValueError(f"enum {enum_name} has no closing brace")

    body = source[open_index + 1:close_index]
    entries: List[str] = []
    current: List[str] = []
    depths = {"{": 0, "(": 0, "[": 0, "<": 0}
    closing = {"}": "{", ")": "(", "]": "[", ">": "<"}
    for char in body:
        if char in depths:
            depths[char] += 1
        elif char in closing and depths[closing[char]] > 0:
            depths[closing[char]] -= 1
        if char == "," and all(depth == 0 for depth in depths.values()):
            entries.append("".join(current))
            current = []
        else:
            current.append(char)
    if "".join(current).strip():
        entries.append("".join(current))

    variants: set[str] = set()
    for entry in entries:
        variant = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)", entry)
        if variant:
            variants.add(variant.group(1))
    return variants


def gap_reason_for_lane(evidence_path, lane: str) -> Optional[str]:
    """Return a classified gap if this case is skipped in the given lane."""
    key = normalized_repo_path(evidence_path)
    if lane == "check":
        return CHECK_ONLY_GAPS.get(key)
    if lane not in POSITIVE_PARITY_LANES:
        return None
    if key in SHARED_POSITIVE_GAPS:
        return SHARED_POSITIVE_GAPS[key]
    return None


def strip_ansi(text: str) -> str:
    """Remove terminal colour escapes before parsing stable CLI contracts."""
    return ANSI_ESCAPE_RE.sub("", text)


def process_output(result: subprocess.CompletedProcess) -> str:
    """Return stdout and stderr in the same order used by companion checks."""
    return (result.stdout or "") + (result.stderr or "")


def llm_diagnostics(
    output: str,
) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str]]:
    """Strictly decode one complete formatter-v1 JSON channel."""
    clean = output.strip()
    if not clean:
        return None, "expected formatter-v1 JSON diagnostics, got an empty channel"
    try:
        document = json.loads(clean)
    except json.JSONDecodeError as exc:
        return None, f"diagnostic channel is not exactly one JSON object: {exc.msg}"
    return validate_llm_document(document)


def module_llm_diagnostics(
    output: str,
) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str]]:
    """Decode exactly ``<formatter JSON>\nCompilation failed[\n]``."""
    clean = output.replace("\r\n", "\n")
    if clean.endswith("\n"):
        clean = clean[:-1]
    suffix = "\nCompilation failed"
    if not clean.endswith(suffix):
        return None, (
            "module LLM stderr must be one JSON object followed by "
            "'Compilation failed'"
        )
    json_text = clean[:-len(suffix)]
    if json_text != json_text.strip():
        return None, "module LLM JSON has unexpected surrounding whitespace"
    try:
        document = json.loads(json_text)
    except json.JSONDecodeError as exc:
        return None, f"module diagnostic prefix is not exactly one JSON object: {exc.msg}"
    return validate_llm_document(document)


def validate_llm_document(
    document: Any,
) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str]]:
    """Validate the stable formatter-v1 envelope and diagnostic array."""
    if not isinstance(document, dict):
        return None, "expected diagnostic JSON top level to be an object"
    if document.get("version") != 1:
        return None, f"expected diagnostic JSON version 1, got {document.get('version')!r}"
    items = document.get("diagnostics")
    if not isinstance(items, list) or not items:
        return None, "expected a non-empty diagnostics array"
    diagnostics: List[Dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            return None, "diagnostics array contains a non-object entry"
        diagnostics.append(item)
    return diagnostics, None


def diagnostic_by_code(
    diagnostics: List[Dict[str, Any]], code: str,
) -> Optional[Dict[str, Any]]:
    """Return the first diagnostic with an exact stable code."""
    return next((item for item in diagnostics if item.get("code") == code), None)


def parse_rc_report(output: str) -> Tuple[Optional[RcReport], Optional[str]]:
    """Parse the stable text contract emitted by ``format_rc_findings``."""
    clean = strip_ansi(output)
    summaries = RC_SUMMARY_RE.findall(clean)
    if len(summaries) != 1:
        return None, f"expected exactly one RC summary, found {len(summaries)}"
    fatal, exempt = (int(value) for value in summaries[0])

    exempt_lines = RC_EXEMPT_RE.findall(clean)
    if len(exempt_lines) > 1:
        return None, "expected at most one RC exempt-class summary"
    exempt_counts: Dict[str, int] = {}
    if exempt_lines:
        for token in exempt_lines[0].split():
            match = re.fullmatch(r"([^=\s]+)=(\d+)", token)
            if match is None:
                return None, f"malformed RC exempt-class token: {token!r}"
            category, count_text = match.groups()
            if category in exempt_counts:
                return None, f"duplicate RC exempt class: {category}"
            exempt_counts[category] = int(count_text)
    if exempt > 0 and not exempt_lines:
        return None, "RC report omitted exempt-class counts"
    if exempt == 0 and exempt_lines:
        return None, "RC report emitted exempt-class counts for zero exemptions"
    if sum(exempt_counts.values()) != exempt:
        return None, (
            "RC exempt-class counts disagree with summary: "
            f"classes={sum(exempt_counts.values())}, summary={exempt}"
        )
    if RC_BOUNDARY_MARKER not in clean:
        return None, "RC report omitted the documented HIR/codegen boundary"

    findings = tuple(
        RcFindingLine(
            file=match.group(1),
            line=int(match.group(2)),
            column=int(match.group(3)),
            category=match.group(4),
            message=match.group(5),
        )
        for match in RC_FINDING_RE.finditer(clean)
    )
    return RcReport(fatal, exempt, exempt_counts, findings), None


def rc_contract_failure(
    contract: RcInvocationContract,
    returncode: int,
    output: str,
) -> Optional[str]:
    """Return why an RC CLI invocation violates its exact migrated contract."""
    if contract.exit_zero and returncode != 0:
        return f"expected exit 0, got {returncode}: {strip_ansi(output)[:300]}"
    if not contract.exit_zero and returncode == 0:
        return "expected non-zero exit, got 0"

    report, parse_failure = parse_rc_report(output)
    if parse_failure is not None or report is None:
        return parse_failure
    if contract.fatal_exact is not None and report.fatal != contract.fatal_exact:
        return f"expected {contract.fatal_exact} fatal findings, got {report.fatal}"
    if report.fatal < contract.fatal_min:
        return f"expected at least {contract.fatal_min} fatal findings, got {report.fatal}"
    if report.exempt < contract.exempt_min:
        return f"expected at least {contract.exempt_min} exempt findings, got {report.exempt}"

    printed_expected = report.fatal + (report.exempt if contract.strict else 0)
    if len(report.findings) != printed_expected:
        mode = "strict" if contract.strict else "non-strict"
        return (
            f"{mode} RC report printed {len(report.findings)} findings; "
            f"expected {printed_expected}"
        )

    for category, minimum in contract.exempt_counts:
        actual = report.exempt_counts.get(category, 0)
        if actual < minimum:
            return f"expected {category}>={minimum} exempt findings, got {actual}"

    fixture_suffix = contract.fixture.replace("\\", "/").lower()
    by_category: Dict[str, List[RcFindingLine]] = {}
    for finding in report.findings:
        by_category.setdefault(finding.category, []).append(finding)
    local_findings = [
        finding for finding in report.findings
        if finding.file.replace("\\", "/").lower().endswith(fixture_suffix)
    ]
    if (
        contract.local_finding_exact is not None
        and len(local_findings) != contract.local_finding_exact
    ):
        return (
            f"expected exactly {contract.local_finding_exact} findings in "
            f"{contract.fixture}, got {len(local_findings)}"
        )
    for category, minimum in contract.finding_counts:
        matching = by_category.get(category, [])
        local = [
            finding for finding in matching
            if finding.file.replace("\\", "/").lower().endswith(fixture_suffix)
        ]
        if len(local) < minimum:
            return (
                f"expected {category}>={minimum} findings in {contract.fixture}, "
                f"got {len(local)} local / {len(matching)} total"
            )
    for category, expected in contract.global_finding_counts:
        actual = len(by_category.get(category, []))
        if actual != expected:
            return (
                f"expected exactly {expected} global {category} findings, "
                f"got {actual}"
            )
    for category, required_lines in contract.finding_lines:
        actual_lines = {
            finding.line for finding in by_category.get(category, [])
            if finding.file.replace("\\", "/").lower().endswith(fixture_suffix)
        }
        missing = sorted(set(required_lines) - actual_lines)
        if missing:
            return f"{category} findings missing fixture lines {missing}"
    for category, function_name, binding_name in contract.finding_function_bindings:
        expected_message = (
            f"in {function_name}: Drop of borrowed binding '{binding_name}' "
            "(param/pattern/for-in projection) — frees a reference owned elsewhere"
        )
        matching = [
            finding for finding in by_category.get(category, [])
            if finding.message == expected_message
        ]
        if len(matching) != 1:
            return (
                f"expected exactly one {category} finding for "
                f"{function_name}/{binding_name}, got {len(matching)}"
            )
    return None


def expected_gap_lanes(scope: str, evidence: str,
                       members: dict[str, set[str]]) -> Optional[set[str]]:
    """Return the exact skipped lanes for a classified matrix gap."""
    if scope == "check-only":
        return {"check"}
    if evidence in members["e2e-c"]:
        if scope == "shared-positive":
            return {"e2e-c"}
    if evidence in members["golden-c"]:
        if scope == "shared-positive":
            return {"golden-c"}
    if evidence in members["native-c"]:
        if scope == "shared-positive":
            return {"native-c"}
    if evidence in members["module-c"]:
        if scope == "shared-positive":
            return {"module-c"}
    return None


def expected_covered_lanes(
    evidence: str,
    members: dict[str, set[str]],
) -> Optional[set[str]]:
    """Return the complete executable bundle required for covered evidence."""
    bundles = [
        ("c-structural", {"c-structural"}),
        ("golden-c", {"golden-c"}),
        ("e2e-c", {"e2e-c"}),
        ("native-c", {"native-c"}),
        ("module-c", {"module-c"}),
        ("check", {"check"}),
        ("self-compile-c", {"self-compile-c"}),
    ]
    for membership_lane, bundle in bundles:
        if evidence in members[membership_lane]:
            return bundle
    return None


def positive_check_only_matrix_integrity_errors(rows: List[dict]) -> List[str]:
    """Require every registered positive check lane member in one matrix row."""
    errors: List[str] = []
    for fixture in POSITIVE_CHECK_ONLY_CASES:
        owners = [
            row for row in rows
            if isinstance(row.get("evidence"), list)
            and fixture in row["evidence"]
        ]
        if len(owners) != 1:
            errors.append(
                f"positive check-only fixture {fixture} must have exactly one "
                f"parity matrix row, found {len(owners)}")
            continue
        row = owners[0]
        if row.get("lane") != ["check"]:
            errors.append(
                f"{row.get('feature_id')}: positive check-only fixture must use "
                "the exact check lane")
        if row.get("status") != "covered":
            errors.append(
                f"{row.get('feature_id')}: positive check-only fixture must be covered")
    return errors


def validate_parity_matrix(
    matrix_data: Optional[dict] = None,
    gap_tables: Optional[dict[str, dict[str, str]]] = None,
) -> Tuple[List[dict], List[str]]:
    """Validate matrix schema, enum closure, lanes, evidence, and gap closure."""
    errors: List[str] = []
    if matrix_data is None:
        try:
            raw = json.loads(PARITY_MATRIX.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            return [], [f"cannot read parity matrix: {exc}"]
    else:
        raw = matrix_data
    active_gap_tables = (
        PARITY_GAP_TABLES if gap_tables is None else gap_tables
    )

    if not isinstance(raw, dict):
        return [], ["matrix root must be an object"]
    if raw.get("schema_version") != 1:
        errors.append("schema_version must equal 1")
    features = raw.get("features")
    if not isinstance(features, list):
        return [], errors + ["features must be a list"]

    members = parity_lane_members()
    errors.extend(structural_fixture_integrity_errors())
    expected_scopes = set(PARITY_GAP_TABLES)
    if set(active_gap_tables) != expected_scopes:
        errors.append(
            f"gap table scopes {sorted(active_gap_tables)} != "
            f"{sorted(expected_scopes)}"
        )
    for scope, table in active_gap_tables.items():
        if not isinstance(table, dict):
            errors.append(f"{scope}: gap table must be an object")
            continue
        for path_text, gap_reason in table.items():
            if (
                not isinstance(path_text, str)
                or "\\" in path_text
                or Path(path_text).is_absolute()
            ):
                errors.append(f"{scope}: invalid normalized gap path {path_text!r}")
                continue
            try:
                normalized = normalized_repo_path(path_text)
            except ValueError:
                errors.append(f"{scope}: gap path escapes repository: {path_text}")
                continue
            if normalized != path_text:
                errors.append(
                    f"{scope}: gap path is not normalized: {path_text}"
                )
            if not isinstance(gap_reason, str) or not gap_reason:
                errors.append(f"{scope}: empty gap reason for {path_text}")

    valid_gap_tables = {
        scope: table for scope, table in active_gap_tables.items()
        if isinstance(table, dict)
    }
    scopes = sorted(valid_gap_tables)
    for index, left_scope in enumerate(scopes):
        for right_scope in scopes[index + 1:]:
            overlap = sorted(
                set(valid_gap_tables[left_scope])
                & set(valid_gap_tables[right_scope])
            )
            if overlap:
                errors.append(
                    f"gap tables {left_scope}/{right_scope} overlap: "
                    f"{', '.join(overlap)}"
                )

    required = {"feature_id", "evidence", "oracle", "lane", "status", "reason"}
    seen_ids: set[str] = set()
    valid_rows: List[dict] = []
    gap_cases: dict[str, dict[str, str]] = {
        scope: {} for scope in valid_gap_tables
    }

    for index, row in enumerate(features):
        label = f"features[{index}]"
        if not isinstance(row, dict):
            errors.append(f"{label} must be an object")
            continue
        missing = sorted(required - set(row))
        if missing:
            errors.append(f"{label} missing fields: {', '.join(missing)}")
            continue

        feature_id = row["feature_id"]
        evidence = row["evidence"]
        oracle = row["oracle"]
        lanes = row["lane"]
        status = row["status"]
        reason = row["reason"]

        if not isinstance(feature_id, str) or not feature_id:
            errors.append(f"{label}.feature_id must be a non-empty string")
            continue
        if feature_id in seen_ids:
            errors.append(f"duplicate feature_id: {feature_id}")
        seen_ids.add(feature_id)
        label = feature_id

        if (
            not isinstance(evidence, list) or not evidence
            or any(not isinstance(item, str) or not item for item in evidence)
        ):
            errors.append(f"{label}: evidence must be a non-empty string list")
            continue
        if len(evidence) != len(set(evidence)):
            errors.append(f"{label}: evidence paths must be unique")
        if (
            not isinstance(lanes, list) or not lanes
            or any(not isinstance(lane, str) for lane in lanes)
        ):
            errors.append(f"{label}: lane must be a non-empty string list")
            continue
        if len(lanes) != len(set(lanes)):
            errors.append(f"{label}: lanes must be unique")
        unknown_lanes = sorted(set(lanes) - PARITY_LANES)
        if unknown_lanes:
            errors.append(f"{label}: unknown lanes: {', '.join(unknown_lanes)}")
        if not isinstance(status, str) or status not in PARITY_STATUSES:
            errors.append(f"{label}: invalid status {status!r}")
            continue
        if not isinstance(oracle, str) or not oracle:
            errors.append(f"{label}: oracle must be a non-empty string")
        if not isinstance(reason, str) or not reason:
            errors.append(f"{label}: reason must be a non-empty string")

        if status == "manual-evidence" and set(lanes) != {"manual-source"}:
            errors.append(f"{label}: manual-evidence requires manual-source lane")
        if status == "covered" and "manual-source" in lanes:
            errors.append(f"{label}: covered evidence cannot use manual-source")
        if status != "manual-evidence" and set(lanes) == {"manual-source"}:
            errors.append(f"{label}: manual-source must be manual-evidence")

        for evidence_text in evidence:
            if "\\" in evidence_text or Path(evidence_text).is_absolute():
                errors.append(
                    f"{label}: evidence must be normalized repo-relative: "
                    f"{evidence_text}"
                )
                continue
            evidence_path = (REPO / evidence_text).resolve()
            try:
                evidence_path.relative_to(REPO.resolve())
            except ValueError:
                errors.append(f"{label}: evidence escapes repository: {evidence_text}")
                continue
            if not evidence_path.is_file():
                errors.append(f"{label}: evidence file missing: {evidence_text}")
                continue

            if status == "covered":
                gap_scopes = sorted(
                    scope for scope, table in valid_gap_tables.items()
                    if evidence_text in table
                )
                if gap_scopes:
                    errors.append(
                        f"{label}: covered evidence is present in gap table(s) "
                        f"{', '.join(gap_scopes)}: {evidence_text}"
                    )
                required_bundle = expected_covered_lanes(
                    evidence_text, members)
                if required_bundle is None:
                    errors.append(
                        f"{label}: covered evidence has no supported runner bundle: "
                        f"{evidence_text}"
                    )
                elif set(lanes) != required_bundle:
                    errors.append(
                        f"{label}: covered lanes {sorted(lanes)} != complete "
                        f"bundle {sorted(required_bundle)} for {evidence_text}"
                    )
                if (
                    feature_id.startswith(
                        ("HExpr.", "HStmt.", "HDecl.", "Pattern."))
                    and required_bundle not in (
                        {"e2e-c"}, {"golden-c"}, {"native-c"}, {"module-c"})
                ):
                    errors.append(
                        f"{label}: HIR/Pattern covered evidence requires a "
                        "C executable/golden/module/native lane"
                    )
                if (
                    required_bundle in (
                        {"check"}, {"self-compile-c"}, {"c-structural"})
                    and not feature_id.startswith("backend.")
                ):
                    errors.append(
                        f"{label}: single-lane covered evidence is reserved "
                        "for backend.* surfaces"
                    )

            for lane in lanes:
                if lane == "manual-source":
                    continue
                if evidence_text not in members.get(lane, set()):
                    errors.append(
                        f"{label}: {evidence_text} is not collected by {lane}"
                    )
                    continue
                if lane == "check":
                    companion = (
                        None
                        if evidence_text in POSITIVE_CHECK_ONLY_CASES
                        else evidence_path.with_suffix(".error")
                    )
                elif lane in {"self-compile-c", "c-structural"}:
                    companion = None
                else:
                    companion = evidence_path.with_suffix(".expected")
                if companion is not None and not companion.is_file():
                    errors.append(
                        f"{label}: missing {companion.suffix} companion for "
                        f"{evidence_text} in {lane}"
                    )

                if status == "covered":
                    gap_reason = gap_reason_for_lane(evidence_text, lane)
                    if gap_reason:
                        errors.append(
                            f"{label}: covered evidence is classified as a gap "
                            f"in {lane}: {evidence_path.name}"
                        )

        if status == "known-gap":
            scope = row.get("gap_scope")
            if not isinstance(scope, str) or scope not in valid_gap_tables:
                errors.append(f"{label}: invalid or missing gap_scope")
            elif len(evidence) != 1:
                errors.append(f"{label}: known-gap requires exactly one evidence path")
            else:
                case_name = evidence[0]
                table = valid_gap_tables[scope]
                if case_name not in table:
                    errors.append(
                        f"{label}: {case_name} is not classified in {scope}"
                    )
                else:
                    if table[case_name] != reason:
                        errors.append(
                            f"{label}: reason differs from runner gap classification"
                        )
                    if case_name in gap_cases[scope]:
                        errors.append(
                            f"{label}: duplicate matrix gap for {scope}/{case_name}"
                        )
                    gap_cases[scope][case_name] = feature_id
                    expected_lanes = expected_gap_lanes(
                        scope, evidence[0], members)
                    if expected_lanes is None:
                        errors.append(
                            f"{label}: gap evidence has no executable collection lane"
                        )
                    elif set(lanes) != expected_lanes:
                        errors.append(
                            f"{label}: gap lanes {sorted(lanes)} != "
                            f"{sorted(expected_lanes)}"
                        )
        elif "gap_scope" in row:
            errors.append(f"{label}: gap_scope is only valid for known-gap")

        valid_rows.append(row)

    errors.extend(positive_check_only_matrix_integrity_errors(valid_rows))

    # Structural fixtures and matrix rows form a closed two-way contract. A
    # newly added fixture, a deleted dependency, or an unrelated row claiming
    # this lane must all fail parity validation instead of silently weakening
    # the generated-C oracle.
    expected_structural = {
        feature_id: set(fixtures)
        for feature_id, fixtures in STRUCTURAL_ORACLE_FIXTURES.items()
    }
    actual_structural: dict[str, set[str]] = {}
    structural_paths = structural_fixture_paths()
    for row in valid_rows:
        feature_id = row.get("feature_id")
        evidence = row.get("evidence")
        lanes = row.get("lane")
        if not isinstance(evidence, list) or not isinstance(lanes, list):
            continue
        evidence_set = set(evidence)
        if "c-structural" in lanes:
            if row.get("status") != "covered":
                errors.append(
                    f"{feature_id}: c-structural evidence must be covered")
            actual_structural[feature_id] = evidence_set
        elif evidence_set & structural_paths:
            errors.append(
                f"{feature_id}: structural fixture evidence requires the "
                "c-structural lane")

    missing_features = sorted(set(expected_structural) - set(actual_structural))
    extra_features = sorted(set(actual_structural) - set(expected_structural))
    if missing_features:
        errors.append(
            "c-structural oracle rows missing from matrix: "
            + ", ".join(missing_features))
    if extra_features:
        errors.append(
            "orphan c-structural matrix rows: " + ", ".join(extra_features))
    for feature_id in sorted(set(expected_structural) & set(actual_structural)):
        if actual_structural[feature_id] != expected_structural[feature_id]:
            missing_evidence = sorted(
                expected_structural[feature_id] - actual_structural[feature_id])
            orphan_evidence = sorted(
                actual_structural[feature_id] - expected_structural[feature_id])
            details = []
            if missing_evidence:
                details.append("missing " + ", ".join(missing_evidence))
            if orphan_evidence:
                details.append("orphan " + ", ".join(orphan_evidence))
            errors.append(
                f"{feature_id}: fixture/matrix evidence mismatch "
                f"({'; '.join(details)})")

    # Every runner gap is present exactly once, and the matrix has no orphan gap.
    for scope, table in valid_gap_tables.items():
        matrix_cases = set(gap_cases[scope])
        table_cases = set(table)
        missing = sorted(table_cases - matrix_cases)
        extra = sorted(matrix_cases - table_cases)
        if missing:
            errors.append(f"{scope}: gaps missing from matrix: {', '.join(missing)}")
        if extra:
            errors.append(f"{scope}: orphan matrix gaps: {', '.join(extra)}")

    # The compiler enum declarations are the authority: adding a variant makes
    # this suite fail until an evidence mapping is added.
    enum_specs = [
        ("HExpr", REPO / "compiler" / "hir.ring"),
        ("HStmt", REPO / "compiler" / "hir.ring"),
        ("HDecl", REPO / "compiler" / "hir.ring"),
        ("Pattern", REPO / "compiler" / "ast.ring"),
    ]
    for enum_name, source_path in enum_specs:
        try:
            variants = extract_enum_variants(source_path, enum_name)
        except (OSError, ValueError) as exc:
            errors.append(str(exc))
            continue
        expected_ids = {f"{enum_name}.{variant}" for variant in variants}
        mapped_ids = {
            feature_id for feature_id in seen_ids
            if feature_id.startswith(f"{enum_name}.")
        }
        missing = sorted(expected_ids - mapped_ids)
        extra = sorted(mapped_ids - expected_ids)
        if missing:
            errors.append(
                f"{enum_name}: variants missing matrix evidence: "
                f"{', '.join(missing)}"
            )
        if extra:
            errors.append(
                f"{enum_name}: orphan variant mappings: {', '.join(extra)}"
            )

    errors.extend(companion_integrity_errors())

    return valid_rows, errors


def run_parity(collector: ResultCollector, *,
               name_filter: Optional[str] = None) -> None:
    """Validate parity evidence wiring without executing semantic programs."""
    suite = "parity"
    features, errors = validate_parity_matrix()
    if errors:
        for index, error in enumerate(errors, 1):
            collector.add(TestResult(
                TestResult.FAIL, suite, f"matrix validation {index}", error))
        return

    selected = [
        row for row in features
        if matches_filter(row["feature_id"], name_filter)
        or any(matches_filter(path, name_filter) for path in row["evidence"])
    ]
    for row in selected:
        detail = (
            f"{row['status']}; matrix/lane wiring only, semantic evidence "
            "not executed by parity suite"
        )
        if row["status"] == "covered":
            collector.add(TestResult(
                TestResult.PASS, suite, row["feature_id"], detail))
        else:
            collector.add(TestResult(
                TestResult.SKIP, suite, row["feature_id"],
                f"{detail}: {row['reason']}"))


# ---------------------------------------------------------------------------
# RC verify suite
# ---------------------------------------------------------------------------

def run_rc(ring_exe: str, collector: ResultCollector, *,
           name_filter: Optional[str] = None) -> None:
    """Run the RC verify suite."""
    suite = "rc"

    # 1. Self-verify: compiler/main.ring --verify-rc
    compiler_main = REPO / "compiler" / "main.ring"
    if not matches_filter("self-verify (compiler/main.ring)", name_filter):
        pass
    elif compiler_main.is_file():
        try:
            r = ring_check(ring_exe, str(compiler_main),
                           extra_args=["--verify-rc"],
                           timeout=TIMEOUT_SELFCOMPILE,
                           phase_suite=suite,
                           phase_case="self-verify (compiler/main.ring)")
            contract = RcInvocationContract(
                name="self-verify (compiler/main.ring)",
                fixture="compiler/main.ring",
                args=("--verify-rc",),
                exit_zero=True,
                fatal_exact=0,
            )
            failure = rc_contract_failure(
                contract, r.returncode, process_output(r),
            )
            if failure is None:
                collector.add(TestResult(TestResult.PASS, suite, "self-verify (compiler/main.ring)"))
            else:
                collector.add(TestResult(
                    TestResult.FAIL, suite, "self-verify (compiler/main.ring)",
                    failure))
        except subprocess.TimeoutExpired:
            collector.add(TestResult(TestResult.FAIL, suite, "self-verify", f"timed out ({TIMEOUT_SELFCOMPILE}s)"))
    else:
        collector.add(TestResult(TestResult.SKIP, suite, "self-verify", "compiler/main.ring not found"))

    # 2. Positive case sweep: tests/cases/*.ring and tests/cases/golden/*.ring
    for directory, label in [(CASES_DIR, "cases"), (GOLDEN_CASES_DIR, "golden")]:
        positive = discover_positive_cases(directory)
        for ring_file in positive:
            name = f"{label}/{ring_file.name}"
            if not matches_filter(name, name_filter):
                continue
            blocked = check_blocked_gap_reason(ring_file)
            if blocked:
                collector.add(TestResult(TestResult.SKIP, suite, name, blocked))
                continue
            try:
                r = ring_check(
                    ring_exe, str(ring_file), extra_args=["--verify-rc"],
                    phase_suite=suite, phase_case=name,
                )
            except subprocess.TimeoutExpired:
                collector.add(TestResult(TestResult.FAIL, suite, name, "timed out"))
                continue

            if r.returncode == 0:
                collector.add(TestResult(TestResult.PASS, suite, name))
            else:
                combined = (r.stdout or "") + (r.stderr or "")
                if "rc-verify[leak-temp]" in combined:
                    collector.add(TestResult(TestResult.SKIP, suite, name,
                                            "known rc-verify limitation (leak-temp)"))
                else:
                    collector.add(TestResult(
                        TestResult.FAIL, suite, name,
                        f"exit {r.returncode}: {combined[:300]}"))

    # 3. Exact negative/degradation contracts migrated from the legacy RC harness.
    #    In particular, a generic "RC verify: 0 errors" line is not evidence
    #    for a negative case: every expected category/count/location is checked.
    rc_contracts = (
        RcInvocationContract(
            "field-overwrite lax", "tests/cases/verify_rc/field_overwrite_leak.ring",
            ("--verify-rc",), True, fatal_exact=0, exempt_min=2,
            exempt_counts=(("x-overwrite-field", 2),),
        ),
        RcInvocationContract(
            "field-overwrite strict", "tests/cases/verify_rc/field_overwrite_leak.ring",
            ("--verify-rc-strict",), False, strict=True, fatal_exact=0, exempt_min=2,
            exempt_counts=(("x-overwrite-field", 2),),
            finding_counts=(("x-overwrite-field", 2),),
            finding_lines=(("x-overwrite-field", (14, 15)),),
        ),
        RcInvocationContract(
            "option-temporary live", "tests/cases/verify_rc/option_temp_leak.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "option-temporary skip-anf mutation", "tests/cases/verify_rc/option_temp_leak.ring",
            ("--verify-rc", "--rc-mutate=skip-anf"), False, fatal_min=2,
            finding_counts=(("leak-temp", 2),),
            finding_lines=(("leak-temp", (11, 27)),),
        ),
        RcInvocationContract(
            "drop-borrow live", "tests/cases/verify_rc/drop_borrow_uaf.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "drop-borrow drop-params mutation", "tests/cases/verify_rc/drop_borrow_uaf.ring",
            ("--verify-rc", "--rc-mutate=drop-params"), False, fatal_min=2,
            finding_function_bindings=(
                ("uaf-drop-borrow", "describe", "name"),
                ("uaf-drop-borrow", "describe", "age"),
            ),
        ),
        RcInvocationContract(
            "Move logical Take live", "tests/cases/verify_rc/move_str_take.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "Move logical missing-Take mutation", "tests/cases/verify_rc/move_str_take.ring",
            ("--verify-rc", "--rc-mutate=missing-take"), False,
            # The mutation applies to imported std bodies as well. FORCE/OWNING
            # provenance can legitimately expose additional dependency Takes;
            # keep the source fixture exact without freezing that global count.
            fatal_min=6, local_finding_exact=6,
            finding_counts=(("uaf-call-missing-take", 6),),
            finding_lines=(("uaf-call-missing-take", (26, 32, 34, 36, 49, 55)),),
        ),
        RcInvocationContract(
            "synthetic scope Move Take live",
            "tests/cases/verify_rc/synthetic_scope_move_take.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "synthetic scope missing-Take mutation",
            "tests/cases/verify_rc/synthetic_scope_move_take.ring",
            ("--verify-rc", "--rc-mutate=missing-take"), False,
            fatal_min=2, local_finding_exact=2,
            finding_counts=(("uaf-call-missing-take", 2),),
            finding_lines=(("uaf-call-missing-take", (10, 18)),),
        ),
        RcInvocationContract(
            "exact-DefId shadowing live", "tests/cases/verify_rc/shadow_overwrite.ring",
            ("--verify-rc",), True, fatal_exact=0, local_finding_exact=0,
        ),
        RcInvocationContract(
            "control-flow value", "tests/cases/verify_rc/cf_value_leak.ring",
            ("--verify-rc-strict",), False, strict=True, fatal_exact=0, exempt_min=2,
            exempt_counts=(("x-cf-value", 2),),
            finding_counts=(("x-cf-value", 2),),
        ),
        RcInvocationContract(
            "effect value", "tests/cases/verify_rc/effect_value.ring",
            ("--verify-rc-strict",), False, strict=True, fatal_exact=0, exempt_min=1,
            exempt_counts=(("x-effect-value", 1),),
            finding_counts=(("x-effect-value", 1),),
        ),
        RcInvocationContract(
            "parameter overwrite", "tests/cases/verify_rc/overwrite_param.ring",
            ("--verify-rc-strict",), False, strict=True, fatal_exact=0, exempt_min=1,
            exempt_counts=(("x-overwrite-param", 1),),
            finding_counts=(("x-overwrite-param", 1),),
        ),
        RcInvocationContract(
            "owned variable reassignment live", "tests/cases/verify_rc/overwrite_var.ring",
            ("--verify-rc",), True, fatal_exact=0, local_finding_exact=0,
        ),
        RcInvocationContract(
            "spread source live", "tests/cases/verify_rc/spread_leak.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "spread source skip-materialization mutation",
            "tests/cases/verify_rc/spread_leak.ring",
            ("--verify-rc", "--rc-mutate=skip-spread-materialization"),
            False, fatal_exact=4, local_finding_exact=4,
            finding_counts=(("leak-spread-source", 2), ("leak-temp", 2)),
            finding_lines=(
                ("leak-spread-source", (15, 16)),
                ("leak-temp", (15, 17)),
            ),
        ),
        RcInvocationContract(
            "mixed spread branch live",
            "tests/cases/verify_rc/spread_mixed_branch.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "mixed spread branch post-plan mutation",
            "tests/cases/verify_rc/spread_mixed_branch.ring",
            ("--verify-rc", "--rc-mutate=mixed-spread-source"),
            False, fatal_exact=2,
            finding_counts=(("invalid-spread-source", 2),),
            finding_lines=(("invalid-spread-source", (28, 39)),),
        ),
        RcInvocationContract(
            "discard owned", "tests/cases/verify_rc/discard_owned.ring",
            ("--verify-rc-strict",), False, strict=True, fatal_exact=0, exempt_min=1,
            exempt_counts=(("x-discard", 1),), finding_counts=(("x-discard", 1),),
        ),
        RcInvocationContract(
            "boxed overwrite", "tests/cases/verify_rc/overwrite_boxed.ring",
            ("--verify-rc-strict",), False, strict=True, fatal_exact=0, exempt_min=1,
            exempt_counts=(("x-overwrite-boxed", 1),),
            finding_counts=(("x-overwrite-boxed", 1),),
        ),
        RcInvocationContract(
            "callee call materialized", "tests/cases/verify_rc/callee_call.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "callee call synthetic metadata strip",
            "tests/cases/verify_rc/callee_call.ring",
            ("--verify-rc", "--rc-mutate=strip-anf-callable-metadata"),
            False, fatal_exact=2,
            finding_counts=(("uaf-call-contract", 1),),
            global_finding_counts=(("uaf-call-contract", 2),),
        ),
        RcInvocationContract(
            "callee call synthetic role strip",
            "tests/cases/verify_rc/callee_call.ring",
            ("--verify-rc", "--rc-mutate=strip-anf-callable-result-roles"),
            False, fatal_exact=4,
            global_finding_counts=(("uaf-call-result-role", 4),),
        ),
        RcInvocationContract(
            "callable metadata live",
            "tests/cases/verify_rc/callable_metadata_strip.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "callable metadata strip mutation",
            "tests/cases/verify_rc/callable_metadata_strip.ring",
            ("--verify-rc", "--rc-mutate=strip-callable-metadata"), False,
            fatal_min=3,
            finding_counts=(("uaf-call-contract", 3),),
        ),
        RcInvocationContract(
            "slot result role live",
            "tests/cases/verify_rc/slot_result_role.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "slot result missing-drop mutation",
            "tests/cases/verify_rc/slot_result_role.ring",
            ("--verify-rc", "--rc-mutate=missing-slot-result-drop"),
            False, fatal_min=1,
        ),
        RcInvocationContract(
            "slot result role-strip mutation",
            "tests/cases/verify_rc/slot_result_role.ring",
            ("--verify-rc", "--rc-mutate=strip-callable-result-roles"),
            False, fatal_min=2,
        ),
        RcInvocationContract(
            "Range loop edges live",
            "tests/cases/verify_rc/range_loop_edges.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "Range Break cleanup strip mutation",
            "tests/cases/verify_rc/range_loop_edges.ring",
            ("--verify-rc", "--rc-mutate=strip-range-break-cleanup"),
            False, fatal_exact=1,
            finding_counts=(("leak-loop-exit", 1),),
        ),
        RcInvocationContract(
            "Range Continue cleanup injection mutation",
            "tests/cases/verify_rc/range_loop_edges.ring",
            ("--verify-rc", "--rc-mutate=inject-range-continue-cleanup"),
            False, fatal_exact=1,
            finding_counts=(("uaf-loop-auto-drop", 1),),
        ),
        RcInvocationContract(
            "owned LIVE/MOVED common Drop",
            "tests/cases/verify_rc/maybe_moved_common_drop.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "retained Never guard RC neutrality",
            "tests/cases/verify_rc/retained_never_guard.ring",
            ("--verify-rc",), True, fatal_exact=0,
            local_finding_exact=0,
        ),
        RcInvocationContract(
            "short-circuit condition Take post-unbox Drop",
            "tests/cases/golden/andor_lower_hotloop.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "shadow mismatch lax", "tests/cases/verify_rc/shadow_mismatch.ring",
            ("--verify-rc",), True, fatal_exact=0, local_finding_exact=0,
            exempt_min=1, exempt_counts=(("x-effect-value", 1),),
        ),
        RcInvocationContract(
            "shadow mismatch strict", "tests/cases/verify_rc/shadow_mismatch.ring",
            ("--verify-rc-strict",), False, strict=True, fatal_exact=0,
            local_finding_exact=1, exempt_min=1,
            exempt_counts=(("x-effect-value", 1),),
            finding_counts=(("x-effect-value", 1),),
            finding_lines=(("x-effect-value", (13,)),),
        ),
    )

    fixture_files = {
        normalized_repo_path(path) for path in RC_NEG_DIR.glob("*.ring")
    } if RC_NEG_DIR.is_dir() else set()
    # The condition-box ownership contract deliberately reuses the executable
    # golden fixture whose generated C is checked by the structural lane. Keep
    # this cross-lane admission exact; arbitrary contracts outside verify_rc/
    # must still fail the wiring inventory.
    fixture_files.add("tests/cases/golden/andor_lower_hotloop.ring")
    contracted_files = {contract.fixture for contract in rc_contracts}
    if fixture_files != contracted_files:
        missing = sorted(fixture_files - contracted_files)
        stale = sorted(contracted_files - fixture_files)
        detail = f"uncontracted={missing}; missing fixtures={stale}"
        collector.add(TestResult(TestResult.FAIL, suite, "negative contract wiring", detail))

    for contract in rc_contracts:
        name = f"neg/{contract.name}"
        if not (
            matches_filter(name, name_filter)
            or matches_filter(contract.fixture, name_filter)
        ):
            continue
        ring_file = REPO / contract.fixture
        try:
            result = ring_check(
                ring_exe,
                str(ring_file),
                extra_args=list(contract.args),
                phase_suite=suite,
                phase_case=name,
            )
        except subprocess.TimeoutExpired:
            collector.add(TestResult(TestResult.FAIL, suite, name, "timed out"))
            continue
        failure = rc_contract_failure(
            contract, result.returncode, process_output(result),
        )
        collector.add(TestResult(
            TestResult.PASS if failure is None else TestResult.FAIL,
            suite,
            name,
            failure or "",
        ))


# ---------------------------------------------------------------------------
# Callable inference namespace bootstrap regression
# ---------------------------------------------------------------------------

def callable_inference_limit_source_errors() -> List[str]:
    """Lock the inference bound inside Ring's exact tagged-Int range."""
    errors: List[str] = []
    types_path = REPO / "compiler" / "types.ring"
    try:
        source = types_path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read compiler/types.ring: {exc}"]

    masked = mask_ring_strings_and_comments(source)
    limit_matches = re.findall(
        r"(?m)^[ \t]*pub[ \t]+const[ \t]+"
        r"CALLABLE_INFERENCE_TERM_LIMIT[ \t]*:[ \t]*Int[ \t]*=[ \t]*"
        r"(-?[0-9]+)[ \t]*$",
        masked,
    )
    expected = str(CALLABLE_INFERENCE_TERM_LIMIT)
    if limit_matches != [expected]:
        errors.append(
            "compiler/types.ring must define exactly one callable inference "
            f"limit equal to {expected}; found {limit_matches}"
        )

    body, extract_error = extract_ring_function_body(
        source, "fresh_callable_ownership_inference_term")
    if extract_error:
        errors.append(extract_error)
    else:
        masked_body = mask_ring_strings_and_comments(body)
        boundary_contracts = (
            (
                "exclusive upper-bound guard",
                r"\bterm[ \t\r\n]*>=[ \t\r\n]*"
                r"CALLABLE_INFERENCE_TERM_LIMIT\b",
            ),
            (
                "final in-range increment",
                r"next_callable_inference_term[ \t\r\n]*=[ \t\r\n]*"
                r"term[ \t\r\n]*\+[ \t\r\n]*1\b",
            ),
            (
                "duplicate-term guard",
                r"callable_inference_parents[ \t\r\n]*\.[ \t\r\n]*"
                r"contains_key[ \t\r\n]*\([ \t\r\n]*term[ \t\r\n]*\)",
            ),
            ("fail-loud exhaustion", r"\bpanic[ \t\r\n]*\("),
        )
        for description, pattern in boundary_contracts:
            count = len(re.findall(pattern, masked_body))
            if count != 1:
                errors.append(
                    "fresh_callable_ownership_inference_term: "
                    f"{description} matched {count} times (expected 1)"
                )

    large_decimal = re.compile(
        r"(?<![A-Za-z0-9_.])(?P<sign>-?)(?P<digits>[0-9]{16,})"
        r"(?![A-Za-z0-9_.])"
    )
    for path in sorted((REPO / "compiler").glob("*.ring")):
        try:
            compiler_source = mask_ring_strings_and_comments(
                path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as exc:
            errors.append(f"cannot scan {display_path(path)}: {exc}")
            continue
        for match in large_decimal.finditer(compiler_source):
            value = int(match.group("sign") + match.group("digits"))
            if value < RING_TAGGED_INT_MIN or value > RING_TAGGED_INT_MAX:
                line = compiler_source.count("\n", 0, match.start()) + 1
                errors.append(
                    f"{display_path(path)}:{line}: decimal Int literal {value} "
                    "is outside the exact tagged range "
                    f"[{RING_TAGGED_INT_MIN}, {RING_TAGGED_INT_MAX}]"
                )
    return errors


def callable_nominal_walk_body_errors(body: str) -> List[str]:
    """Validate the reachable nominal walk inside its extracted function body."""
    errors: List[str] = []
    masked = mask_ring_strings_and_comments(body)

    def lambda_body_open_after(params_close: int) -> Optional[int]:
        cursor = params_close + 1
        while cursor < len(masked) and masked[cursor].isspace():
            cursor += 1
        if cursor < len(masked) and masked[cursor] == "{":
            return cursor
        if not masked.startswith("->", cursor):
            return None

        # An annotated lambda has a complete type expression before its body.
        # Stop on expression/declaration delimiters so a function type cannot
        # borrow an unrelated later brace.  Record return types and `with {}`
        # effect rows consume their own balanced braces before the body brace.
        cursor += 2
        type_start = cursor
        round_depth = 0
        square_depth = 0
        angle_depth = 0
        type_started = False
        while cursor < len(masked):
            char = masked[cursor]
            if char == "(":
                round_depth += 1
            elif char == ")":
                if round_depth == 0 and square_depth == 0 and angle_depth == 0:
                    return None
                round_depth -= 1
            elif char == "[":
                square_depth += 1
            elif char == "]":
                if round_depth == 0 and square_depth == 0 and angle_depth == 0:
                    return None
                square_depth -= 1
            elif char == "<":
                angle_depth += 1
            elif char == ">" and (cursor == 0 or masked[cursor - 1] != "-"):
                if angle_depth > 0:
                    angle_depth -= 1
            elif (
                char == "{" and round_depth == 0
                and square_depth == 0 and angle_depth == 0
            ):
                prefix = masked[type_start:cursor].rstrip()
                if not type_started or re.search(r"\bwith\s*$", prefix):
                    try:
                        cursor = matching_delimiter(masked, cursor, "{", "}")
                    except ValueError:
                        return None
                    type_started = True
                else:
                    return cursor
            elif (
                char in ",=;}" and round_depth == 0
                and square_depth == 0 and angle_depth == 0
            ):
                return None
            if not char.isspace():
                type_started = True
            cursor += 1
        return None

    # A function type and a lambda both start with `fn(`.  Resolve only an
    # immediate body (after the optional return type); the old "next brace"
    # scan could attach a function type to an unrelated later match arm.
    for match in re.finditer(r"\bfn[ \t\r\n]*\(", masked):
        params_open = masked.find("(", match.start(), match.end())
        try:
            params_close = matching_delimiter(masked, params_open, "(", ")")
        except ValueError as exc:
            errors.append(
                "type_reaches_callable_through_nominals closure: " + str(exc))
            continue
        closure_open = lambda_body_open_after(params_close)
        if closure_open is None:
            continue
        try:
            closure_close = matching_delimiter(
                masked, closure_open, "{", "}")
        except ValueError as exc:
            errors.append(
                "type_reaches_callable_through_nominals closure: " + str(exc))
            continue
        closure_body = masked[closure_open + 1:closure_close]
        if re.search(r"\bnominal_visited\b", closure_body):
            line = body.count("\n", 0, match.start()) + 1
            errors.append(
                "type_reaches_callable_through_nominals captures mutable "
                f"nominal_visited in a closure at body line {line}"
            )

        params = masked[params_open + 1:params_close]
        if re.search(r"\bnominal_visited\b", params):
            line = body.count("\n", 0, match.start()) + 1
            errors.append(
                "type_reaches_callable_through_nominals shadows mutable "
                f"nominal_visited in a lambda parameter at body line {line}"
            )

    outer_matches = top_level_pattern_matches(
        masked, r"\bmatch[ \t\r\n]+ty[ \t\r\n]*\{")
    if len(outer_matches) != 1:
        errors.append(
            "type_reaches_callable_through_nominals must have exactly one "
            f"top-level match ty; found {len(outer_matches)}"
        )
        return errors
    outer_prefix = masked[:outer_matches[0].start()]
    outer_guard = (
        r"\s*if\s+type_reaches_callable\s*\(\s*ty\s*,\s*subst\s*\)"
        r"\s*\{\s*return\s+true\s*\}\s*"
    )
    if re.fullmatch(outer_guard, outer_prefix, re.DOTALL) is None:
        errors.append(
            "type_reaches_callable_through_nominals must begin with the "
            "exact reachable direct-callable guard before its sole match ty"
        )
    outer_open = outer_matches[0].end() - 1
    try:
        outer_close = matching_delimiter(masked, outer_open, "{", "}")
    except ValueError as exc:
        errors.append(
            "type_reaches_callable_through_nominals match ty: " + str(exc))
        return errors
    if masked[outer_close + 1:].strip():
        errors.append(
            "type_reaches_callable_through_nominals match ty must be the "
            "final top-level expression"
        )
    match_body = masked[outer_open + 1:outer_close]

    tail_arms = (
        (
            "record",
            r"Type::RecordType\s*\{\s*fields\s*,\s*tail\s*,\s*\.\.\s*\}"
            r"\s*=>\s*\{",
            r"\s*for\s+field\s+in\s+fields\s*\{\s*"
            r"if\s+type_reaches_callable_through_nominals\s*\(\s*"
            r"field\.ty\s*,\s*subst\s*,\s*env\s*,\s*"
            r"nominal_visited\s*\)\s*\{\s*return\s+true\s*\}\s*\}\s*",
        ),
        (
            "effect-row",
            r"Type::EffectRowType\s*\{\s*effects\s*,\s*tail\s*\}"
            r"\s*=>\s*\{",
            r"\s*for\s+eff\s+in\s+effects\s*\{\s*"
            r"if\s+effect_reaches_callable_through_nominals\s*\(\s*"
            r"eff\s*,\s*subst\s*,\s*env\s*,\s*"
            r"nominal_visited\s*\)\s*\{\s*return\s+true\s*\}\s*\}\s*",
        ),
    )
    tail_walk_body = re.compile(
        r"\s*some\s*\(\s*id\s*\)\s*=>\s*"
        r"type_reaches_callable_through_nominals\s*\(\s*"
        r"Type::TypeVar\s*\{\s*id\s*:\s*id\s*,\s*"
        r"name\s*:\s*none\s*\}\s*,\s*subst\s*,\s*env\s*,\s*"
        r"nominal_visited\s*\)\s*,\s*"
        r"none\s*=>\s*false\s*,?\s*",
        re.DOTALL,
    )
    for label, header_pattern, prefix_pattern in tail_arms:
        headers = top_level_pattern_matches(match_body, header_pattern)
        if len(headers) != 1:
            errors.append(
                "type_reaches_callable_through_nominals must have exactly "
                f"one {label} arm binding tail; found {len(headers)}"
            )
            continue
        # The header contains the pattern's own `{ ... }`; the regex ends at
        # the match-arm body opener, so use that final delimiter exactly.
        arm_open = headers[0].end() - 1
        try:
            arm_close = matching_delimiter(match_body, arm_open, "{", "}")
        except ValueError as exc:
            errors.append(
                f"type_reaches_callable_through_nominals {label} arm: {exc}")
            continue
        arm_body = match_body[arm_open + 1:arm_close]
        if re.search(
            r"\b(?:let|var)\s+(?:mut\s+)?nominal_visited\b", arm_body,
        ):
            errors.append(
                "type_reaches_callable_through_nominals must not shadow "
                f"nominal_visited in the {label} arm"
            )

        tail_matches = top_level_pattern_matches(
            arm_body, r"\bmatch[ \t\r\n]+tail[ \t\r\n]*\{")
        if len(tail_matches) != 1:
            errors.append(
                "type_reaches_callable_through_nominals must have exactly one "
                f"top-level final match tail in the {label} arm; found "
                f"{len(tail_matches)}"
            )
            continue
        tail_open = tail_matches[0].end() - 1
        try:
            tail_close = matching_delimiter(arm_body, tail_open, "{", "}")
        except ValueError as exc:
            errors.append(
                f"type_reaches_callable_through_nominals {label} tail: {exc}")
            continue
        prefix = arm_body[:tail_matches[0].start()]
        if re.fullmatch(prefix_pattern, prefix, re.DOTALL) is None:
            errors.append(
                "type_reaches_callable_through_nominals must keep the exact "
                f"reachable {label} child walk before its tail"
            )
        terminators = top_level_pattern_matches(
            prefix, r"\b(?:return|break|continue|panic)\b")
        if terminators:
            errors.append(
                "type_reaches_callable_through_nominals has a top-level "
                f"terminator before the {label} tail walk"
            )
        if arm_body[tail_close + 1:].strip():
            errors.append(
                "type_reaches_callable_through_nominals must keep the "
                f"{label} tail walk as the final arm expression"
            )
        tail_body = arm_body[tail_open + 1:tail_close]
        if tail_walk_body.fullmatch(tail_body) is None:
            errors.append(
                "type_reaches_callable_through_nominals must recursively walk "
                f"the bound {label} tail through the same nominal_visited set "
                "on the reachable some arm"
            )
    return errors


def callable_nominal_walk_authority_errors(source: str) -> List[str]:
    """Require the unifier's conservative selector to reach the nominal walk."""
    errors: List[str] = []
    masked_source = mask_ring_strings_and_comments(source)
    walk_header = (
        r"\bfn\s+type_reaches_callable_through_nominals\s*\(\s*"
        r"ty\s*:\s*Type\s*,\s*subst\s*:\s*UnionFind\s*,\s*"
        r"env\s*:\s*TypeEnv\s*,\s*mut\s+nominal_visited\s*:\s*"
        r"Set\s*<\s*Str\s*>\s*\)\s*->\s*Bool\s*\{"
    )
    header_count = len(re.findall(walk_header, masked_source))
    if header_count != 1:
        errors.append(
            "type_reaches_callable_through_nominals must retain one exact "
            "mutable-visited function header; found "
            f"{header_count}"
        )
    wrapper_body, extract_error = extract_ring_function_body(
        source, "type_may_hide_callable")
    if extract_error:
        errors.append(extract_error)
    else:
        wrapper_masked = mask_ring_strings_and_comments(wrapper_body)
        wrapper_contract = (
            r"\s*if\s*!\s*type_contains_nominal\s*\(\s*ty\s*,\s*subst\s*\)"
            r"\s*\{\s*return\s+false\s*\}\s*"
            r"let\s+nominal_visited\s*:\s*Set\s*<\s*Str\s*>\s*=\s*"
            r"set_new\s*\(\s*\)\s*"
            r"type_reaches_callable_through_nominals\s*\(\s*"
            r"ty\s*,\s*subst\s*,\s*env\s*,\s*nominal_visited\s*\)\s*"
        )
        if re.fullmatch(wrapper_contract, wrapper_masked, re.DOTALL) is None:
            errors.append(
                "type_may_hide_callable must guard on nominal reachability and "
                "terminally invoke the exact nominal walk with one fresh Set"
            )

    pair_body, extract_error = extract_ring_function_body(
        source, "unification_pair_reaches_callable")
    if extract_error:
        errors.append(extract_error)
    else:
        pair_masked = mask_ring_strings_and_comments(pair_body)
        pair_match_body: Optional[str] = None
        pair_matches = top_level_pattern_matches(
            pair_masked,
            r"\bmatch\s*\(\s*matched_left\s*,\s*matched_right\s*\)\s*\{",
        )
        if len(pair_matches) != 1:
            errors.append(
                "unification_pair_reaches_callable must have one top-level "
                "matched-input dispatch; found "
                f"{len(pair_matches)}"
            )
        else:
            pair_prefix = pair_masked[:pair_matches[0].start()]
            pair_prefix_contract = (
                r"\s*let\s+direct_left\s*=\s*left\s*"
                r"let\s+direct_right\s*=\s*right\s*"
                r"let\s+hidden_left\s*=\s*left\s*"
                r"let\s+hidden_right\s*=\s*right\s*"
                r"let\s+matched_left\s*=\s*left\s*"
                r"let\s+matched_right\s*=\s*right\s*"
                r"let\s+forward_struct\s*=\s*left\s*"
                r"let\s+forward_record\s*=\s*right\s*"
                r"let\s+reverse_record\s*=\s*left\s*"
                r"let\s+reverse_struct\s*=\s*right\s*"
                r"if\s+type_reaches_callable\s*\(\s*direct_left\s*,\s*"
                r"subst\s*\)\s*\|\|\s*type_reaches_callable\s*\(\s*"
                r"direct_right\s*,\s*subst\s*\)\s*\{\s*"
                r"return\s+true\s*\}\s*"
                r"if\s+type_may_hide_callable\s*\(\s*hidden_left\s*,\s*"
                r"subst\s*,\s*env\s*\)\s*\|\|\s*"
                r"type_may_hide_callable\s*\(\s*hidden_right\s*,\s*"
                r"subst\s*,\s*env\s*\)\s*\{\s*"
                r"return\s+true\s*\}\s*"
            )
            if re.fullmatch(
                    pair_prefix_contract, pair_prefix, re.DOTALL) is None:
                errors.append(
                    "unification_pair_reaches_callable must retain the exact "
                    "left/right aliases and reachable direct/hidden OR guards "
                    "before its matched-input dispatch"
                )
            pair_open = pair_matches[0].end() - 1
            try:
                pair_close = matching_delimiter(
                    pair_masked, pair_open, "{", "}")
            except ValueError as exc:
                errors.append(
                    "unification_pair_reaches_callable matched-input dispatch: "
                    + str(exc))
            else:
                pair_match_body = pair_body[pair_open + 1:pair_close]
                if ring_contract_tokens(pair_body[pair_close + 1:]):
                    errors.append(
                        "unification_pair_reaches_callable matched-input "
                        "dispatch must be its final expression"
                    )
        hidden_guard_pattern = (
            r"\bif\s+type_may_hide_callable\s*\(\s*hidden_left\s*,\s*"
            r"subst\s*,\s*env\s*\)\s*\|\|\s*"
            r"type_may_hide_callable\s*\(\s*hidden_right\s*,\s*"
            r"subst\s*,\s*env\s*\)\s*\{"
        )
        hidden_guards = top_level_pattern_matches(
            pair_masked, hidden_guard_pattern)
        if len(hidden_guards) != 1:
            errors.append(
                "unification_pair_reaches_callable must keep one reachable "
                "top-level hidden-left OR hidden-right guard; found "
                f"{len(hidden_guards)}"
            )
        else:
            guard_open = hidden_guards[0].end() - 1
            try:
                guard_close = matching_delimiter(
                    pair_masked, guard_open, "{", "}")
            except ValueError as exc:
                errors.append(
                    "unification_pair_reaches_callable hidden guard: "
                    + str(exc))
            else:
                guard_body = pair_masked[guard_open + 1:guard_close]
                if re.fullmatch(
                        r"\s*return\s+true\s*", guard_body) is None:
                    errors.append(
                        "unification_pair_reaches_callable hidden graph OR "
                        "guard must immediately return true"
                    )
        hidden_calls = re.findall(
            r"type_may_hide_callable\s*\(\s*hidden_(left|right)\s*,\s*"
            r"subst\s*,\s*env\s*\)",
            pair_masked,
        )
        if hidden_calls != ["left", "right"]:
            errors.append(
                "unification_pair_reaches_callable must test the complete "
                "hidden nominal graph of left then right exactly once; found "
                f"{hidden_calls}"
            )
        if pair_match_body is not None:
            errors.extend(terminal_top_level_ring_expression_wildcard_errors(
                pair_match_body,
                "false",
                "unification_pair_reaches_callable matched-input dispatch",
            ))
            pair_headers = (
                ("left TypeVar", r"\(\s*Type::TypeVar\s*\{\s*id\s*,\s*"
                 r"\.\.\s*\}\s*,\s*other\s*\)\s*=>"),
                ("right TypeVar", r"\(\s*other\s*,\s*Type::TypeVar\s*"
                 r"\{\s*id\s*,\s*\.\.\s*\}\s*\)\s*=>"),
                ("Struct/Record", r"\(\s*Type::StructType\s*\{\s*\.\.\s*"
                 r"\}\s*,\s*Type::RecordType\s*\{\s*\.\.\s*\}\s*\)"
                 r"\s*=>"),
                ("Record/Struct", r"\(\s*Type::RecordType\s*\{\s*\.\.\s*"
                 r"\}\s*,\s*Type::StructType\s*\{\s*\.\.\s*\}\s*\)"
                 r"\s*=>"),
                ("Struct/Struct", r"\(\s*Type::StructType\s*\{\s*"
                 r"name\s*:\s*an\s*,\s*type_params\s*:\s*aa\s*\}\s*,\s*"
                 r"Type::StructType\s*\{\s*name\s*:\s*bn\s*,\s*"
                 r"type_params\s*:\s*ba\s*\}\s*\)\s*=>"),
                ("Enum/Enum", r"\(\s*Type::EnumType\s*\{\s*"
                 r"name\s*:\s*an\s*,\s*type_params\s*:\s*aa\s*\}\s*,\s*"
                 r"Type::EnumType\s*\{\s*name\s*:\s*bn\s*,\s*"
                 r"type_params\s*:\s*ba\s*\}\s*\)\s*=>"),
                ("Generic/Generic", r"\(\s*Type::GenericType\s*\{\s*"
                 r"base\s*:\s*ab\s*,\s*args\s*:\s*aa\s*\}\s*,\s*"
                 r"Type::GenericType\s*\{\s*base\s*:\s*bb\s*,\s*"
                 r"args\s*:\s*ba\s*\}\s*\)\s*=>"),
                ("Record/Record", r"\(\s*Type::RecordType\s*\{\s*"
                 r"fields\s*:\s*af\s*,\s*\.\.\s*\}\s*,\s*"
                 r"Type::RecordType\s*\{\s*fields\s*:\s*bf\s*,\s*"
                 r"\.\.\s*\}\s*\)\s*=>"),
                ("EffectRow/EffectRow", r"\(\s*Type::EffectRowType\s*\{\s*"
                 r"effects\s*:\s*ae\s*,\s*tail\s*:\s*at\s*\}\s*,\s*"
                 r"Type::EffectRowType\s*\{\s*effects\s*:\s*be\s*,\s*"
                 r"tail\s*:\s*bt\s*\}\s*\)\s*=>"),
                ("Tuple/Tuple", r"\(\s*Type::TupleType\s*\{\s*"
                 r"elements\s*:\s*aa\s*\}\s*,\s*Type::TupleType\s*\{\s*"
                 r"elements\s*:\s*ba\s*\}\s*\)\s*=>"),
                ("Ptr/Ptr", r"\(\s*Type::PtrType\s*\{\s*pointee\s*:\s*a"
                 r"\s*\}\s*,\s*Type::PtrType\s*\{\s*pointee\s*:\s*b\s*"
                 r"\}\s*\)\s*=>"),
                ("terminal wildcard", r"(?<![A-Za-z0-9_])_\s*=>"),
            )
            errors.extend(exact_top_level_ring_match_arm_headers_errors(
                pair_match_body,
                pair_headers,
                "unification_pair_reaches_callable matched-input dispatch",
            ))
    return errors


def callable_nominal_walk_source_errors() -> List[str]:
    """Lock the allocation-safe nominal walk and adversarial source gate."""
    path = REPO / "compiler" / "unify.ring"
    try:
        source = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read compiler/unify.ring: {exc}"]
    body, extract_error = extract_ring_function_body(
        source, "type_reaches_callable_through_nominals")
    if extract_error:
        return [extract_error]

    errors = callable_nominal_walk_body_errors(body)
    errors.extend(callable_nominal_walk_authority_errors(source))
    if errors:
        return errors

    masked = mask_ring_strings_and_comments(body)
    tail_call_pattern = re.compile(
        r"type_reaches_callable_through_nominals\s*\(\s*"
        r"Type::TypeVar\s*\{\s*id\s*:\s*id\s*,\s*"
        r"name\s*:\s*none\s*\}\s*,\s*subst\s*,\s*env\s*,\s*"
        r"nominal_visited\s*\)",
        re.DOTALL,
    )
    tail_calls = list(tail_call_pattern.finditer(masked))
    tail_matches = list(re.finditer(r"\bmatch\s+tail\s*\{", masked))
    if len(tail_calls) != 2 or len(tail_matches) != 2:
        return [
            "type_reaches_callable_through_nominals mutation authority must "
            f"find two tail calls/matches; found {len(tail_calls)}/"
            f"{len(tail_matches)}"
        ]

    def replace_span(start: int, end: int, replacement: str) -> str:
        return body[:start] + replacement + body[end:]

    outer_matches = top_level_pattern_matches(
        masked, r"\bmatch[ \t\r\n]+ty[ \t\r\n]*\{")
    outer_match = outer_matches[0]
    mutations = [
        (
            "record tail removal",
            replace_span(tail_calls[0].start(), tail_calls[0].end(), "false"),
        ),
        (
            "effect tail removal",
            replace_span(tail_calls[1].start(), tail_calls[1].end(), "false"),
        ),
        (
            "dead prefix",
            replace_span(
                tail_matches[0].start(), tail_matches[0].start(),
                "return false\n            ",
            ),
        ),
        (
            "nested always-terminating prefix",
            replace_span(
                tail_matches[0].start(), tail_matches[0].start(),
                "if true { return false }\n            ",
            ),
        ),
        (
            "fresh nominal_visited shadow",
            replace_span(
                tail_matches[1].start(), tail_matches[1].start(),
                "let nominal_visited = nominal_visited\n            ",
            ),
        ),
        (
            "visited-set reset",
            replace_span(
                tail_matches[1].start(), tail_matches[1].start(),
                "nominal_visited.clear()\n            ",
            ),
        ),
        (
            "nested dead tail decoy",
            replace_span(
                tail_calls[0].start(), tail_calls[0].end(),
                "if false { " + tail_calls[0].group(0) + " } else { false }",
            ),
        ),
        (
            "lambda capture",
            replace_span(
                outer_match.start(), outer_match.start(),
                "let capture_probe = fn() { "
                "nominal_visited.contains(\"probe\") }\n    ",
            ),
        ),
        (
            "annotated lambda capture",
            replace_span(
                outer_match.start(), outer_match.start(),
                "let capture_probe = fn() -> Bool { "
                "nominal_visited.contains(\"probe\") }\n    ",
            ),
        ),
        (
            "lambda parameter shadow",
            replace_span(
                outer_match.start(), outer_match.start(),
                "let shadow_probe = fn(nominal_visited: Int) { false }\n    ",
            ),
        ),
        (
            "outer early return",
            replace_span(
                outer_match.start(), outer_match.start(),
                "return false\n    ",
            ),
        ),
        (
            "outer visited-set reset",
            replace_span(
                outer_match.start(), outer_match.start(),
                "nominal_visited.clear()\n    ",
            ),
        ),
        (
            "outer match negation",
            replace_span(
                outer_match.start(), outer_match.start(), "!"),
        ),
    ]
    initial_guards = top_level_pattern_matches(
        masked,
        r"\bif\s+type_reaches_callable\s*\(\s*ty\s*,\s*subst\s*\)"
        r"\s*\{\s*return\s+true\s*\}",
    )
    if len(initial_guards) != 1:
        errors.append(
            "type_reaches_callable_through_nominals mutation authority must "
            f"find one initial direct guard; found {len(initial_guards)}"
        )
    else:
        mutations.append((
            "disabled initial direct guard",
            replace_span(
                initial_guards[0].start(), initial_guards[0].end(),
                "if false { return true }",
            ),
        ))
    for label, mutated_body in mutations:
        mutation_errors = callable_nominal_walk_body_errors(mutated_body)
        if not mutation_errors:
            errors.append(
                "type_reaches_callable_through_nominals "
                f"{label} mutation escaped source gate"
            )

    tuple_arms = list(re.finditer(
        r"Type::TupleType\s*\{\s*elements\s*\}\s*=>\s*\{", masked))
    if len(tuple_arms) != 1:
        errors.append(
            "type_reaches_callable_through_nominals mutation authority must "
            f"find one tuple arm; found {len(tuple_arms)}"
        )
    else:
        function_type_body = replace_span(
            tuple_arms[0].end(), tuple_arms[0].end(),
            "\n            let callable_shape: fn(Int) -> Int = "
            "callable_shape_source",
        )
        function_type_errors = callable_nominal_walk_body_errors(
            function_type_body)
        if function_type_errors:
            errors.append(
                "type_reaches_callable_through_nominals function-type "
                "lookalike was misclassified as a lambda: "
                + "; ".join(function_type_errors)
            )

    authority_call_pattern = re.compile(
        r"type_reaches_callable_through_nominals\s*\(\s*"
        r"ty\s*,\s*subst\s*,\s*env\s*,\s*nominal_visited\s*\)")
    disconnected_wrapper, wrapper_count = authority_call_pattern.subn(
        "false", source, count=1)
    hidden_left_pattern = re.compile(
        r"type_may_hide_callable\s*\(\s*hidden_left\s*,\s*"
        r"subst\s*,\s*env\s*\)")
    disconnected_pair, pair_count = hidden_left_pattern.subn(
        "false", source, count=1)
    pair_or_pattern = re.compile(
        r"(type_may_hide_callable\s*\(\s*hidden_left\s*,\s*"
        r"subst\s*,\s*env\s*\))\s*\|\|\s*"
        r"(type_may_hide_callable\s*\(\s*hidden_right\s*,\s*"
        r"subst\s*,\s*env\s*\))")
    conjunctive_pair, pair_or_count = pair_or_pattern.subn(
        r"\1 && \2", source, count=1)
    hidden_right_alias_pattern = re.compile(
        r"\blet\s+hidden_right\s*=\s*right\b")
    swapped_hidden_right, hidden_right_count = hidden_right_alias_pattern.subn(
        "let hidden_right = left", source, count=1)
    pair_header_pattern = re.compile(
        r"(fn\s+unification_pair_reaches_callable\s*\(\s*"
        r"left\s*:\s*Type\s*,\s*right\s*:\s*Type\s*,\s*"
        r"subst\s*:\s*UnionFind\s*,\s*env\s*:\s*TypeEnv\s*\)"
        r"\s*->\s*Bool\s*\{)")
    dead_pair_prefix, pair_header_count = pair_header_pattern.subn(
        r"\1\n    if true { return false }", source, count=1)
    walk_header_mode_pattern = re.compile(
        r"(fn\s+type_reaches_callable_through_nominals\s*\([^)]*?)"
        r"\bmut\s+nominal_visited\b", re.DOTALL)
    immutable_header, header_mode_count = walk_header_mode_pattern.subn(
        r"\1nominal_visited", source, count=1)
    pair_wildcard_first = source
    pair_binder_first = source
    pair_or_prefixed = source
    pair_wildcard_count = 0
    pair_binder_count = 0
    pair_or_prefix_count = 0
    pair_function_body, pair_extract_error = extract_ring_function_body(
        source, "unification_pair_reaches_callable")
    if pair_extract_error:
        errors.append(pair_extract_error)
    else:
        pair_function_masked = mask_ring_strings_and_comments(
            pair_function_body)
        pair_dispatches = top_level_pattern_matches(
            pair_function_masked,
            r"\bmatch\s*\(\s*matched_left\s*,\s*matched_right\s*\)\s*\{",
        )
        if len(pair_dispatches) != 1:
            errors.append(
                "unification_pair_reaches_callable wildcard-first mutation "
                f"found {len(pair_dispatches)} dispatches (expected 1)"
            )
        else:
            pair_open = pair_dispatches[0].end() - 1
            try:
                pair_close = matching_delimiter(
                    pair_function_masked, pair_open, "{", "}")
            except ValueError as exc:
                errors.append(
                    "unification_pair_reaches_callable wildcard-first "
                    f"mutation: {exc}")
            else:
                pair_match_body = pair_function_body[
                    pair_open + 1:pair_close]
                mutated_match_body, mutation_error = (
                    move_top_level_ring_expression_wildcard_first(
                        pair_match_body, "false")
                )
                if mutation_error:
                    errors.append(
                        "unification_pair_reaches_callable " + mutation_error)
                elif mutated_match_body is not None:
                    mutated_pair_body = (
                        pair_function_body[:pair_open + 1]
                        + mutated_match_body
                        + pair_function_body[pair_close:]
                    )
                    pair_wildcard_count = source.count(pair_function_body)
                    if pair_wildcard_count == 1:
                        pair_wildcard_first = source.replace(
                            pair_function_body, mutated_pair_body, 1)
                binder_match_body = (
                    "\n        (shadow_left, shadow_right) => false,\n"
                    + pair_match_body
                )
                binder_pair_body = (
                    pair_function_body[:pair_open + 1]
                    + binder_match_body
                    + pair_function_body[pair_close:]
                )
                pair_binder_count = source.count(pair_function_body)
                if pair_binder_count == 1:
                    pair_binder_first = source.replace(
                        pair_function_body, binder_pair_body, 1)
                or_prefix_pattern = re.compile(
                    r"\(\s*Type::StructType\s*\{\s*\.\.\s*\}\s*,\s*"
                    r"Type::RecordType\s*\{\s*\.\.\s*\}\s*\)\s*=>")
                or_prefixed_match_body, pair_or_prefix_count = (
                    or_prefix_pattern.subn(
                        lambda match: "_ | " + match.group(0),
                        pair_match_body,
                        count=1,
                    )
                )
                if pair_or_prefix_count == 1:
                    or_prefixed_pair_body = (
                        pair_function_body[:pair_open + 1]
                        + or_prefixed_match_body
                        + pair_function_body[pair_close:]
                    )
                    if source.count(pair_function_body) == 1:
                        pair_or_prefixed = source.replace(
                            pair_function_body, or_prefixed_pair_body, 1)
    authority_mutations = (
        ("wrapper disconnect", disconnected_wrapper, wrapper_count, None),
        ("pair disconnect", disconnected_pair, pair_count, None),
        ("pair OR weakened to AND", conjunctive_pair, pair_or_count, None),
        ("hidden-right source swapped", swapped_hidden_right,
         hidden_right_count, None),
        ("pair hidden guards made unreachable", dead_pair_prefix,
         pair_header_count, None),
        ("mutable visited header removed", immutable_header,
         header_mode_count, None),
        ("pair wildcard moved before concrete arms", pair_wildcard_first,
         pair_wildcard_count,
         "matched-input dispatch wildcard arm must remain terminal"),
        ("pair irrefutable binder inserted before concrete arms",
         pair_binder_first, pair_binder_count,
         "exact direct arm-header inventory and order"),
        ("pair Struct/Record arm widened by irrefutable OR-prefix",
         pair_or_prefixed, pair_or_prefix_count,
         "direct Struct/Record arm pattern must remain exact"),
    )
    for label, mutated_source, count, expected_error in authority_mutations:
        if count != 1:
            errors.append(
                "type_reaches_callable_through_nominals "
                f"{label} mutation matched {count} times (expected 1)"
            )
            continue
        mutation_errors = callable_nominal_walk_authority_errors(
            mutated_source)
        if not mutation_errors:
            errors.append(
                "type_reaches_callable_through_nominals "
                f"{label} mutation escaped authority gate"
            )
        elif (expected_error is not None
              and not any(expected_error in error
                          for error in mutation_errors)):
            errors.append(
                "type_reaches_callable_through_nominals "
                f"{label} mutation missed targeted gate {expected_error!r}: "
                f"{mutation_errors}"
            )
    return errors


def callable_contract_merge_source_errors() -> List[str]:
    """Keep NoBase absorption explicit for the legacy bootstrap anchor."""
    path = REPO / "compiler" / "ownership.ring"
    try:
        source = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read compiler/ownership.ring: {exc}"]
    body, extract_error = extract_ring_function_body(
        source, "merge_callable_contract_resolution")
    if extract_error:
        return [extract_error]

    masked = mask_ring_strings_and_comments(body)
    left_count = len(re.findall(
        r"\(\s*CallableContractResolution::NoBase\s*,\s*_\s*\)\s*=>",
        masked,
    ))
    right_count = len(re.findall(
        r"\(\s*_\s*,\s*CallableContractResolution::NoBase\s*\)\s*=>",
        masked,
    ))
    errors: List[str] = []
    if left_count != 1 or right_count != 1:
        errors.append(
            "merge_callable_contract_resolution must spell the two NoBase "
            "absorbing cases as independent match arms; found "
            f"left={left_count}, right={right_count}"
        )
    return errors


def direct_drop_duplicate_source_oracles() -> Tuple[List[str], List[str]]:
    """Lock exact prelude idempotency and fail-loud Drop conflicts."""
    try:
        source = (REPO / "compiler" / "codegen_c.ring").read_text(
            encoding="utf-8")
        ctx_source = (REPO / "compiler" / "codegen_c_ctx.ring").read_text(
            encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        detail = f"cannot read direct Drop codegen sources: {exc}"
        return [detail], [detail]

    register_body, register_error = extract_ring_function_body(
        source, "register_c_direct_drop_method")
    equality_body, equality_error = extract_ring_function_body(
        source, "c_direct_drop_infos_equal")
    if register_error or equality_error:
        errors = [error for error in (register_error, equality_error) if error]
        return errors.copy(), errors.copy()

    positive_errors: List[str] = []
    negative_errors: List[str] = []
    register_masked = mask_ring_strings_and_comments(register_body)
    equality_masked = mask_ring_strings_and_comments(equality_body)

    # Positive oracle: the already-registered arm has only a negated exact
    # equality guard.  Equality therefore falls through idempotently, while
    # insertion remains exclusive to the absent-entry arm.
    duplicate_guard = re.findall(
        r"some\s*\(\s*existing\s*\)\s*=>\s*\{.*?"
        r"if\s*!\s*c_direct_drop_infos_equal\s*\(\s*"
        r"ctx\.merged_ownership_metadata\s*,\s*existing\s*,\s*candidate\s*"
        r"\)\s*\{\s*panic\s*\(\s*"
        r"\"unreachable: direct Drop target has multiple destructor HIR roles\""
        r"\s*\)\s*\}\s*\}",
        register_body,
        re.DOTALL,
    )
    absent_insert = re.findall(
        r"none\s*=>\s*ctx\.direct_drop_methods\.insert\s*\(\s*"
        r"target_type\s*,\s*candidate\s*\)",
        register_masked,
    )
    if len(duplicate_guard) != 1 or len(absent_insert) != 1:
        positive_errors.append(
            "exact duplicate must fall through one negated equality guard and "
            "only an absent declaration may insert; found "
            f"guard={len(duplicate_guard)}, insert={len(absent_insert)}"
        )

    # Negative oracle: sharing a C name is insufficient.  Exact registry
    # identity, arity, checked signature, evidence ABI and destructor role
    # must all be independent conjunctions before the fail-loud guard above.
    equality_contracts = (
        ("exact fn_key", r"\ba\.fn_key\s*==\s*b\.fn_key\b"),
        ("resolved c_name", r"\ba\.c_name\s*==\s*b\.c_name\b"),
        ("C ABI arity", r"\ba\.total_params\s*==\s*b\.total_params\b"),
        (
            "destructor owner role",
            r"\ba\.drop_owner_param\s*==\s*b\.drop_owner_param\b",
        ),
        (
            "parameter ownership/role flags",
            r"\bc_direct_drop_int_lists_equal\s*\(\s*"
            r"a\.param_flags\s*,\s*b\.param_flags\s*\)",
        ),
        (
            "trait-bound ABI",
            r"\bc_direct_drop_trait_bounds_equal\s*\(\s*"
            r"a\.trait_bounds\s*,\s*b\.trait_bounds\s*\)",
        ),
        (
            "effect-evidence ABI",
            r"\bc_direct_drop_str_lists_equal\s*\(\s*"
            r"a\.evidence_params\s*,\s*b\.evidence_params\s*\)",
        ),
        (
            "Ring parameter types",
            r"Type::TupleType\s*\{\s*elements\s*:\s*a\.param_types\s*\}"
            r"\s*,\s*Type::TupleType\s*\{\s*elements\s*:\s*"
            r"b\.param_types\s*\}",
        ),
        (
            "Ring return type",
            r"types_equal_with_ownership\s*\(\s*metadata\s*,\s*"
            r"a\.return_type\s*,\s*b\.return_type\s*\)",
        ),
        (
            "declared effect signature",
            r"Type::EffectRowType\s*\{\s*effects\s*:\s*"
            r"a\.declared_effects\.effects\s*,\s*tail\s*:\s*"
            r"a\.declared_effects\.tail\s*\}.*?"
            r"Type::EffectRowType\s*\{\s*effects\s*:\s*"
            r"b\.declared_effects\.effects\s*,\s*tail\s*:\s*"
            r"b\.declared_effects\.tail\s*\}",
        ),
    )
    for description, pattern in equality_contracts:
        count = len(re.findall(pattern, equality_masked, re.DOTALL))
        if count != 1:
            negative_errors.append(
                f"direct Drop conflict oracle {description} matched {count} "
                "times (expected 1)"
            )

    info_match = re.search(
        r"pub\s+struct\s+CDirectDropInfo\s*\{(?P<body>.*?)\}",
        mask_ring_strings_and_comments(ctx_source),
        re.DOTALL,
    )
    required_fields = {
        "fn_key", "c_name", "total_params", "param_types", "param_flags",
        "return_type", "declared_effects", "trait_bounds",
        "evidence_params", "drop_owner_param",
    }
    if info_match is None:
        negative_errors.append("CDirectDropInfo declaration not found")
    else:
        fields = set(re.findall(
            r"\bpub\s+([A-Za-z_][A-Za-z0-9_]*)\s*:",
            info_match.group("body"),
        ))
        if fields != required_fields:
            negative_errors.append(
                "CDirectDropInfo exact field inventory changed: "
                f"expected {sorted(required_fields)}, found {sorted(fields)}"
            )

    role_contracts = (
        r"if\s+drop_owner_param\s*>=\s*0\s*\{\s*panic\s*\(",
        r"if\s+drop_owner_param\s*!=\s*0\s*\{\s*panic\s*\(",
    )
    for pattern in role_contracts:
        if len(re.findall(pattern, register_masked)) != 1:
            negative_errors.append(
                "destructor declaration must reject duplicate or displaced "
                f"owner roles: missing {pattern}"
            )
    return positive_errors, negative_errors


def ring_contract_tokens(source: str) -> Tuple[str, ...]:
    """Return exact Ring syntax tokens after comments/strings are masked."""
    masked = mask_ring_strings_and_comments(source)
    return tuple(re.findall(
        r"[A-Za-z_][A-Za-z0-9_]*|[0-9]+|::|->|=>|\.\.|==|!=|"
        r"<=|>=|\|\||&&|[^\s]",
        masked,
    ))


def exact_ring_function_contract_errors(
    source: str,
    function_name: str,
    header_pattern: str,
    expected_body: str,
    description: str,
) -> List[str]:
    """Lock one Ring function's exact header and comment-insensitive body."""
    errors: List[str] = []
    masked_source = mask_ring_strings_and_comments(source)
    header_count = len(re.findall(header_pattern, masked_source, re.DOTALL))
    if header_count != 1:
        errors.append(
            f"{description}: exact function header matched {header_count} "
            "times (expected 1)"
        )
    body, extract_error = extract_ring_function_body(source, function_name)
    if extract_error:
        errors.append(extract_error)
        return errors
    actual_tokens = ring_contract_tokens(body)
    expected_tokens = ring_contract_tokens(expected_body)
    if actual_tokens != expected_tokens:
        mismatch = next((
            index for index, (actual, expected) in enumerate(
                zip(actual_tokens, expected_tokens))
            if actual != expected
        ), min(len(actual_tokens), len(expected_tokens)))
        actual = actual_tokens[mismatch] if mismatch < len(actual_tokens) else "<end>"
        expected = (
            expected_tokens[mismatch]
            if mismatch < len(expected_tokens) else "<end>"
        )
        errors.append(
            f"{description}: exact body token {mismatch} changed "
            f"(expected {expected!r}, found {actual!r}; "
            f"lengths {len(expected_tokens)}/{len(actual_tokens)})"
        )
    return errors


def extract_unique_top_level_ring_brace_body(
    source: str,
    header_pattern: str,
    description: str,
) -> Tuple[Optional[str], Optional[str]]:
    """Extract one direct brace body from an already scoped Ring fragment."""
    masked = mask_ring_strings_and_comments(source)
    headers = top_level_pattern_matches(masked, header_pattern)
    if len(headers) != 1:
        return None, (
            f"{description} found {len(headers)} direct bodies (expected 1)"
        )
    open_index = headers[0].end() - 1
    try:
        close_index = matching_delimiter(masked, open_index, "{", "}")
    except ValueError as exc:
        return None, f"{description}: {exc}"
    return source[open_index + 1:close_index], None


def terminal_top_level_ring_expression_wildcard_errors(
    match_body: str,
    expression: str,
    description: str,
) -> List[str]:
    """Require one exact expression wildcard as the final direct match arm."""
    masked = mask_ring_strings_and_comments(match_body)
    pattern = (
        r"(?<![A-Za-z0-9_])_\s*=>\s*"
        + re.escape(expression)
        + r"\b\s*,?"
    )
    matches = top_level_pattern_matches(masked, pattern)
    if len(matches) != 1:
        return [
            f"{description} must retain one direct _ => {expression} arm; "
            f"found {len(matches)}"
        ]
    if ring_contract_tokens(match_body[matches[0].end():]):
        return [f"{description} wildcard arm must remain terminal"]
    return []


def terminal_top_level_ring_empty_wildcard_errors(
    match_body: str,
    description: str,
) -> List[str]:
    """Require one exact empty-brace wildcard as the final direct match arm."""
    masked = mask_ring_strings_and_comments(match_body)
    headers = top_level_pattern_matches(
        masked, r"(?<![A-Za-z0-9_])_\s*=>\s*\{")
    if len(headers) != 1:
        return [
            f"{description} must retain one direct _ => {{}} arm; "
            f"found {len(headers)}"
        ]
    arm_open = headers[0].end() - 1
    try:
        arm_close = matching_delimiter(masked, arm_open, "{", "}")
    except ValueError as exc:
        return [f"{description} wildcard arm: {exc}"]
    if ring_contract_tokens(match_body[arm_open + 1:arm_close]):
        return [f"{description} wildcard arm body must remain empty"]
    suffix_tokens = ring_contract_tokens(match_body[arm_close + 1:])
    if suffix_tokens not in ((), (",",)):
        return [f"{description} wildcard arm must remain terminal"]
    return []


def exact_top_level_ring_match_arm_headers_errors(
    match_body: str,
    expected_headers: Tuple[Tuple[str, str], ...],
    description: str,
) -> List[str]:
    """Require the exact direct arm-header inventory and order for one match."""
    masked = mask_ring_strings_and_comments(match_body)
    expected_arrow_offsets: List[int] = []
    errors: List[str] = []

    def direct_token_offsets(token: str) -> List[int]:
        offsets: List[int] = []
        stack: List[str] = []
        closing = {"(": ")", "[": "]", "{": "}"}
        for offset, char in enumerate(masked):
            if char in closing:
                stack.append(char)
            elif char in ")]}":
                if not stack or closing[stack[-1]] != char:
                    raise ValueError(
                        f"unbalanced delimiter {char!r} at offset {offset}")
                stack.pop()
            elif not stack and masked.startswith(token, offset):
                offsets.append(offset)
        if stack:
            raise ValueError(
                f"unclosed delimiter {stack[-1]!r} in direct match body")
        return offsets

    try:
        direct_arrows = direct_token_offsets("=>")
        direct_commas = direct_token_offsets(",")
    except ValueError as exc:
        return [f"{description}: {exc}"]
    arm_starts: Dict[int, int] = {}
    comma_index = 0
    previous_separator = -1
    for arrow_offset in direct_arrows:
        while (comma_index < len(direct_commas)
               and direct_commas[comma_index] < arrow_offset):
            previous_separator = direct_commas[comma_index]
            comma_index += 1
        arm_starts[arrow_offset] = previous_separator + 1
    for label, pattern in expected_headers:
        matches = top_level_pattern_matches(masked, pattern)
        if len(matches) != 1:
            errors.append(
                f"{description} direct {label} arm matched {len(matches)} "
                "times (expected 1)"
            )
            continue
        arrow_offset = masked.find("=>", matches[0].start(), matches[0].end())
        if arrow_offset < 0:
            errors.append(
                f"{description} direct {label} arm header lost its arrow")
            continue
        expected_arrow_offsets.append(arrow_offset)
        arm_start = arm_starts.get(arrow_offset)
        if arm_start is None:
            errors.append(
                f"{description} direct {label} arm arrow is not top-level")
            continue
        expected_pattern_tokens = ring_contract_tokens(
            match_body[matches[0].start():arrow_offset])
        actual_pattern_tokens = ring_contract_tokens(
            match_body[arm_start:arrow_offset])
        if actual_pattern_tokens != expected_pattern_tokens:
            errors.append(
                f"{description} direct {label} arm pattern must remain exact; "
                f"expected {expected_pattern_tokens!r}, found "
                f"{actual_pattern_tokens!r}"
            )
    if (len(expected_arrow_offsets) != len(expected_headers)
            or expected_arrow_offsets != direct_arrows):
        errors.append(
            f"{description} must retain the exact direct arm-header inventory "
            f"and order; expected {len(expected_headers)} arrows, found "
            f"{len(direct_arrows)}"
        )
    return errors


def move_top_level_ring_expression_wildcard_first(
    match_body: str,
    expression: str,
) -> Tuple[Optional[str], Optional[str]]:
    """Build a compile-plausible mutation that moves one wildcard arm first."""
    masked = mask_ring_strings_and_comments(match_body)
    pattern = (
        r"(?<![A-Za-z0-9_])_\s*=>\s*"
        + re.escape(expression)
        + r"\b\s*,?"
    )
    matches = top_level_pattern_matches(masked, pattern)
    if len(matches) != 1:
        return None, (
            f"wildcard-first mutation found {len(matches)} direct "
            f"_ => {expression} arms (expected 1)"
        )
    match = matches[0]
    mutated = (
        f"\n        _ => {expression},\n"
        + match_body[:match.start()]
        + match_body[match.end():]
    )
    return mutated, None


def move_top_level_ring_empty_wildcard_first(
    match_body: str,
) -> Tuple[Optional[str], Optional[str]]:
    """Build a compile-plausible mutation that moves one empty wildcard first."""
    masked = mask_ring_strings_and_comments(match_body)
    headers = top_level_pattern_matches(
        masked, r"(?<![A-Za-z0-9_])_\s*=>\s*\{")
    if len(headers) != 1:
        return None, (
            f"wildcard-first mutation found {len(headers)} direct "
            "_ => {} arms (expected 1)"
        )
    arm_open = headers[0].end() - 1
    try:
        arm_close = matching_delimiter(masked, arm_open, "{", "}")
    except ValueError as exc:
        return None, f"wildcard-first mutation: {exc}"
    arm_end = arm_close + 1
    while arm_end < len(masked) and masked[arm_end].isspace():
        arm_end += 1
    if arm_end < len(masked) and masked[arm_end] == ",":
        arm_end += 1
    mutated = (
        "\n        _ => {},\n"
        + match_body[:headers[0].start()]
        + match_body[arm_end:]
    )
    return mutated, None


def prelude_ownership_firebreak_source_errors(
    registration_source: str,
    checker_source: str,
) -> List[str]:
    """Lock trusted prelude registration and exact HIR emission firebreaks."""
    errors: List[str] = []
    errors.extend(exact_ring_function_contract_errors(
        registration_source,
        "register_prelude_decl_public",
        r"\bpub\s+fn\s+register_prelude_decl_public\s*\(\s*"
        r"mut\s+ctx\s*:\s*InferCtx\s*,\s*decl\s*:\s*Decl\s*\)\s*\{",
        """
        match decl {
            Decl::Struct { name, type_params, fields, derive_attrs, span, .. } => {
                if name == BUILTIN_LIST || name == BUILTIN_MAP ||
                   name == BUILTIN_SET {
                    let definition_name = name
                    let definition_derive_attrs = derive_attrs
                    preregister_struct_definition(
                        ctx, definition_name, type_params, definition_derive_attrs)
                } else {
                    let registered_name = name
                    preregister_struct(
                        ctx, registered_name, type_params, derive_attrs, span)
                }
                complete_struct_fields(ctx, name, fields)
            },
            _ => register_decl(ctx, decl)
        }
        """,
        "register_prelude_decl_public trusted branch",
    ))
    errors.extend(exact_ring_function_contract_errors(
        registration_source,
        "preregister_struct",
        r"\bfn\s+preregister_struct\s*\(\s*mut\s+ctx\s*:\s*InferCtx\s*,"
        r"\s*name\s*:\s*Str\s*,\s*type_params\s*:\s*"
        r"List\s*<\s*TypeParam\s*>\s*,\s*derive_attrs\s*:\s*"
        r"List\s*<\s*DeriveAttribute\s*>\s*,\s*span\s*:\s*Span\s*\)\s*\{",
        """
        if reject_reserved_ownership_nominal(ctx, name, span) { return }
        preregister_struct_definition_firebreak(
            ctx, name, type_params, derive_attrs)
        """,
        "preregister_struct reserved-name gate",
    ))
    errors.extend(exact_ring_function_contract_errors(
        registration_source,
        "preregister_struct_definition_firebreak",
        r"\bfn\s+preregister_struct_definition_firebreak\s*\(\s*"
        r"mut\s+ctx\s*:\s*InferCtx\s*,\s*name\s*:\s*Str\s*,\s*"
        r"type_params\s*:\s*List\s*<\s*TypeParam\s*>\s*,\s*"
        r"derive_attrs\s*:\s*List\s*<\s*DeriveAttribute\s*>\s*\)\s*\{",
        """
        let definition_name = name
        let definition_type_params = type_params
        let definition_derive_attrs = derive_attrs
        preregister_struct_definition(
            ctx, definition_name, definition_type_params,
            definition_derive_attrs)
        """,
        "preregister_struct_definition_firebreak whole-value transfer",
    ))
    errors.extend(exact_ring_function_contract_errors(
        checker_source,
        "record_emitted_prelude_extern_firebreak",
        r"\bfn\s+record_emitted_prelude_extern_firebreak\s*\(\s*"
        r"mut\s+emitted\s*:\s*Set\s*<\s*Int\s*>\s*,\s*"
        r"def_id\s*:\s*Int\s*\)\s*\{",
        """
        let emitted_def_id = def_id
        emitted.insert(emitted_def_id)
        """,
        "record_emitted_prelude_extern_firebreak exact DefId",
    ))
    errors.extend(exact_ring_function_contract_errors(
        checker_source,
        "append_prelude_extern_hdecl_firebreak",
        r"\bfn\s+append_prelude_extern_hdecl_firebreak\s*\(\s*"
        r"mut\s+prelude_hdecls\s*:\s*List\s*<\s*HDecl\s*>\s*,\s*"
        r"name\s*:\s*Str\s*,\s*abi_name\s*:\s*Str\s*,\s*"
        r"def_id\s*:\s*Int\?\s*,\s*type_params\s*:\s*"
        r"List\s*<\s*TypeParam\s*>\s*,\s*params\s*:\s*"
        r"List\s*<\s*HParam\s*>\s*,\s*return_type\s*:\s*Type\s*,\s*"
        r"effects\s*:\s*EffectRow\s*,\s*is_pub\s*:\s*Bool\s*,\s*"
        r"span\s*:\s*Span\s*\)\s*\{",
        """
        let emitted_name = name
        let emitted_abi_name = abi_name
        let emitted_def_id = def_id
        let emitted_type_params = type_params
        let emitted_params = params
        let emitted_return_type = return_type
        let emitted_effects = effects
        let emitted_span = span
        prelude_hdecls.push(HDecl::ExternFn {
            name: emitted_name,
            abi_name: emitted_abi_name,
            def_id: emitted_def_id,
            type_params: emitted_type_params,
            params: emitted_params,
            return_type: emitted_return_type,
            effects: emitted_effects,
            is_pub: is_pub,
            span: emitted_span
        })
        """,
        "append_prelude_extern_hdecl_firebreak exact HIR payload",
    ))

    load_body, extract_error = extract_ring_function_body(
        checker_source, "load_prelude")
    if extract_error:
        errors.append(extract_error)
        return errors
    masked = mask_ring_strings_and_comments(load_body)
    outer_std_matches = top_level_pattern_matches(
        masked, r"\bmatch\s+find_std_dir\s*\(\s*\)\s*\{")
    if len(outer_std_matches) == 1:
        outer_open = outer_std_matches[0].end() - 1
        try:
            outer_close = matching_delimiter(masked, outer_open, "{", "}")
        except ValueError as exc:
            errors.append("load_prelude top-level find_std_dir match: " + str(exc))
        else:
            if re.fullmatch(
                    r"\s*let\s+mut\s+prelude_hdecls\s*:\s*"
                    r"List\s*<\s*HDecl\s*>\s*=\s*\[\s*\]\s*",
                    masked[:outer_std_matches[0].start()],
                    re.DOTALL,
            ) is None:
                errors.append(
                    "load_prelude must begin with its exact result list "
                    "before the reachable find_std_dir match"
                )
            if re.fullmatch(
                    r"\s*prelude_hdecls\s*",
                    masked[outer_close + 1:],
                    re.DOTALL,
            ) is None:
                errors.append(
                    "load_prelude find_std_dir match must be followed only "
                    "by the final prelude_hdecls result"
                )
    if re.search(r"\b(?:return|break|continue)\b", masked):
        errors.append(
            "load_prelude must not terminate before its ordered registration "
            "and HIR-emission phases"
        )
    std_match_body, scope_error = extract_unique_top_level_ring_brace_body(
        load_body,
        r"\bmatch\s+find_std_dir\s*\(\s*\)\s*\{",
        "load_prelude top-level find_std_dir match",
    )
    if scope_error:
        errors.append(scope_error)
        std_match_body = None
    std_some_body: Optional[str] = None
    if std_match_body is not None:
        std_some_body, scope_error = extract_unique_top_level_ring_brace_body(
            std_match_body,
            r"\bsome\s*\(\s*std_dir\s*\)\s*=>\s*\{",
            "load_prelude direct std_dir arm",
        )
        if scope_error:
            errors.append(scope_error)
    if std_some_body is not None:
        file_loop_body, scope_error = extract_unique_top_level_ring_brace_body(
            std_some_body,
            r"\bfor\s+file\s+in\s*\(\s*STD_FILES\s*\)\s*\{",
            "load_prelude direct std-file loop",
        )
        if scope_error:
            errors.append(scope_error)
        else:
            expected_file_loop = """
                let file_path = path_join(std_dir, file)
                if file_exists(file_path) {
                    let source = read_file(file_path)
                    let prelude_sink = new_collecting_sink()
                    let ast = parse(source, file_path, prelude_sink)
                    for decl in ast.decls {
                        let canonical_decl =
                            canonicalize_loaded_prelude_decl_firebreak(decl)
                        let registration_decl = canonical_decl
                        register_prelude_decl_public(ctx, registration_decl)
                        all_prelude_decls.push(canonical_decl)
                    }
                }
            """
            if (ring_contract_tokens(file_loop_body)
                    != ring_contract_tokens(expected_file_loop)):
                errors.append(
                    "load_prelude direct std-file loop must retain the exact "
                    "std_dir/file path, read, parse, registration, and append "
                    "dataflow"
                )
            file_body, scope_error = extract_unique_top_level_ring_brace_body(
                file_loop_body,
                r"\bif\s+file_exists\s*\(\s*file_path\s*\)\s*\{",
                "load_prelude direct existing-file branch",
            )
            if scope_error:
                errors.append(scope_error)
            else:
                registration_body, scope_error = (
                    extract_unique_top_level_ring_brace_body(
                        file_body,
                        r"\bfor\s+decl\s+in\s+ast\.decls\s*\{",
                        "load_prelude direct parsed-declaration loop",
                    )
                )
                if scope_error:
                    errors.append(scope_error)
                else:
                    expected_registration = """
                        let canonical_decl =
                            canonicalize_loaded_prelude_decl_firebreak(decl)
                        let registration_decl = canonical_decl
                        register_prelude_decl_public(ctx, registration_decl)
                        all_prelude_decls.push(canonical_decl)
                    """
                    if (ring_contract_tokens(registration_body)
                            != ring_contract_tokens(expected_registration)):
                        errors.append(
                            "load_prelude parsed-declaration loop must retain "
                            "the exact canonicalize, register, then append "
                            "sequence on the same declaration"
                        )
    phase_two_body: Optional[str] = None
    if std_some_body is not None:
        std_some_masked = mask_ring_strings_and_comments(std_some_body)
        declared_lists = top_level_pattern_matches(
            std_some_masked,
            r"\blet\s+mut\s+all_prelude_decls\s*:\s*"
            r"List\s*<\s*Decl\s*>\s*=\s*\[\s*\]",
        )
        all_decl_bindings = re.findall(
            r"\b(?:let|var)\s+(?:mut\s+)?all_prelude_decls\b",
            std_some_masked,
        )
        file_loops = top_level_pattern_matches(
            std_some_masked,
            r"\bfor\s+file\s+in\s*\(\s*STD_FILES\s*\)\s*\{",
        )
        decl_loops = top_level_pattern_matches(
            std_some_masked,
            r"\bfor\s+decl\s+in\s+all_prelude_decls\s*\{",
        )
        emitted_sets = top_level_pattern_matches(
            std_some_masked,
            r"\blet\s+mut\s+emitted_prelude_externs\s*:\s*"
            r"Set\s*<\s*Int\s*>\s*=\s*set_new\s*\(\s*\)",
        )
        if len(all_decl_bindings) != 1:
            errors.append(
                "load_prelude must retain exactly one authoritative "
                "all_prelude_decls binding; found "
                f"{len(all_decl_bindings)}"
            )
        if (len(declared_lists) != 1 or len(file_loops) != 1
                or len(decl_loops) != 2 or len(emitted_sets) != 1
                or not (
                    declared_lists[0].start() < file_loops[0].start()
                    < decl_loops[0].start() < emitted_sets[0].start()
                    < decl_loops[1].start()
                )):
            errors.append(
                "load_prelude must retain declared-list -> file collection "
                "-> phase-one -> emitted-set -> phase-two order; found "
                f"declared={len(declared_lists)}, files={len(file_loops)}, "
                f"loops={len(decl_loops)}, sets={len(emitted_sets)}"
            )
        else:
            file_loop_open = file_loops[0].end() - 1
            phase_one_open = decl_loops[0].end() - 1
            phase_two_open = decl_loops[1].end() - 1
            try:
                file_loop_close = matching_delimiter(
                    std_some_masked, file_loop_open, "{", "}")
                phase_one_close = matching_delimiter(
                    std_some_masked, phase_one_open, "{", "}")
                phase_two_close = matching_delimiter(
                    std_some_masked, phase_two_open, "{", "}")
            except ValueError as exc:
                errors.append(
                    "load_prelude direct file/phase-one skeleton: "
                    + str(exc))
            else:
                expected_between_file_and_phase_one = """
                    let map_get_name = map_index_helper_source_name()
                    let map_get_identity = map_index_helper_identity()
                    match ctx.env.lookup(map_get_identity) {
                        some(scheme) => {
                            let bound_map_get_name = map_get_name
                            ctx.env.bind(bound_map_get_name, scheme)
                            record_value_origin(
                                ctx, map_get_name, map_get_identity)
                        },
                        none => {}
                    }
                """
                skeleton_gaps = (
                    std_some_body[:declared_lists[0].start()],
                    std_some_body[
                        declared_lists[0].end():file_loops[0].start()],
                    std_some_body[
                        phase_one_close + 1:emitted_sets[0].start()],
                    std_some_body[
                        emitted_sets[0].end():decl_loops[1].start()],
                    std_some_body[phase_two_close + 1:],
                )
                if any(ring_contract_tokens(gap) for gap in skeleton_gaps):
                    errors.append(
                        "load_prelude phase skeleton must not contain extra "
                        "statements before collection or between phase-one, "
                        "emitted-set, and phase-two"
                    )
                between_file_and_phase_one = std_some_body[
                    file_loop_close + 1:decl_loops[0].start()]
                if (ring_contract_tokens(between_file_and_phase_one)
                        != ring_contract_tokens(
                            expected_between_file_and_phase_one)):
                    errors.append(
                        "load_prelude phase skeleton must retain the exact "
                        "Map-index alias publication between file collection "
                        "and phase-one"
                    )
                phase_one_body = std_some_body[
                    phase_one_open + 1:phase_one_close]
                expected_phase_one = """
                    match decl {
                        Decl::ExternFn { name, params, .. } => {
                            let exact_origin = prelude_extern_identity(name)
                            let source = exact_prelude_extern_source(name)
                            if source == CALLABLE_SOURCE_BUILTIN {
                                match ctx.env.lookup(name) {
                                    some(scheme) => {
                                        let updated =
                                            update_local_callable_scheme(
                                                ctx.env, scheme,
                                                exact_prelude_extern_ownership(
                                                    ctx.env, name, params),
                                                source)
                                        let exact_def_id = match updated.def_id {
                                            some(id) => id,
                                            none => panic("")
                                        }
                                        set_callable_result_role(
                                            ctx.env.types.ownership_metadata,
                                            exact_def_id,
                                            exact_prelude_extern_result_role(
                                                name))
                                        rebind_prelude_extern_firebreak(
                                            ctx, name, updated)
                                    },
                                    none => panic("")
                                }
                            }
                            record_value_origin(ctx, name, exact_origin)
                        },
                        _ => {}
                    }
                """
                if (ring_contract_tokens(phase_one_body)
                        != ring_contract_tokens(expected_phase_one)):
                    errors.append(
                        "load_prelude phase-one loop must retain the exact "
                        "extern identity, ownership rebind, result-role, and "
                        "origin publication body"
                    )
            loop_open = decl_loops[1].end() - 1
            try:
                loop_close = matching_delimiter(
                    std_some_masked, loop_open, "{", "}")
            except ValueError as exc:
                errors.append(
                    "load_prelude direct phase-two declaration loop: "
                    + str(exc))
            else:
                phase_two_body = std_some_body[loop_open + 1:loop_close]
    decl_match_body: Optional[str] = None
    if phase_two_body is not None:
        phase_two_masked = mask_ring_strings_and_comments(phase_two_body)
        phase_two_matches = top_level_pattern_matches(
            phase_two_masked, r"\bmatch\s+decl\s*\{")
        if len(phase_two_matches) == 1:
            phase_two_match_open = phase_two_matches[0].end() - 1
            try:
                phase_two_match_close = matching_delimiter(
                    phase_two_masked, phase_two_match_open, "{", "}")
            except ValueError as exc:
                errors.append(
                    "load_prelude direct phase-two declaration match: "
                    + str(exc))
            else:
                if (ring_contract_tokens(
                        phase_two_body[:phase_two_matches[0].start()])
                        or ring_contract_tokens(
                            phase_two_body[phase_two_match_close + 1:])):
                    errors.append(
                        "load_prelude phase-two loop must contain only its "
                        "direct authoritative match decl expression"
                    )
        decl_match_body, scope_error = extract_unique_top_level_ring_brace_body(
            phase_two_body,
            r"\bmatch\s+decl\s*\{",
            "load_prelude direct phase-two declaration match",
        )
        if scope_error:
            errors.append(scope_error)
        elif decl_match_body is not None:
            errors.extend(terminal_top_level_ring_empty_wildcard_errors(
                decl_match_body,
                "load_prelude phase-two declaration match",
            ))
            phase_two_headers = (
                ("Struct", r"Decl::Struct\s*\{\s*\.\.\s*\}\s*=>"),
                ("Enum", r"Decl::Enum\s*\{\s*\.\.\s*\}\s*=>"),
                ("Trait", r"Decl::Trait\s*\{\s*\.\.\s*\}\s*=>"),
                ("Impl", r"Decl::Impl\s*\{\s*target_type\s*,\s*"
                 r"type_params\s*,\s*trait_name\s*,\s*methods\s*,\s*"
                 r"span\s*\}\s*=>"),
                ("Fn", r"Decl::Fn\s*\{\s*\.\.\s*\}\s*=>"),
                ("ExternFn", r"Decl::ExternFn\s*\{\s*\.\.\s*\}\s*=>"),
                ("terminal wildcard", r"(?<![A-Za-z0-9_])_\s*=>"),
            )
            errors.extend(exact_top_level_ring_match_arm_headers_errors(
                decl_match_body,
                phase_two_headers,
                "load_prelude phase-two declaration match",
            ))
    extern_arm_body: Optional[str] = None
    if decl_match_body is not None:
        extern_arm_body, scope_error = extract_unique_top_level_ring_brace_body(
            decl_match_body,
            r"Decl::ExternFn\s*\{\s*\.\.\s*\}\s*=>\s*\{",
            "load_prelude direct ExternFn declaration arm",
        )
        if scope_error:
            errors.append(scope_error)
    if extern_arm_body is not None:
        expected_arm = """
            let result = some(check_prelude_decl(ctx, decl)) catch { _ => none }
            match result {
                some(HDecl::ExternFn {
                    name, abi_name, def_id, type_params, params,
                    return_type, effects, is_pub, span
                }) => {
                    let emit = match def_id {
                        some(id) => {
                            if emitted_prelude_externs.contains(id) {
                                false
                            } else {
                                record_emitted_prelude_extern_firebreak(
                                    emitted_prelude_externs, id)
                                true
                            }
                        },
                        none => true
                    }
                    let exact_name = match def_id {
                        some(id) => match ctx.use_aliases.get(id) {
                            some(origin) => origin,
                            none => name
                        },
                        none => name
                    }
                    if emit {
                        append_prelude_extern_hdecl_firebreak(
                            prelude_hdecls, exact_name, abi_name,
                            def_id, type_params, params,
                            return_type, effects, is_pub, span)
                    }
                },
                some(_) => {},
                none => {}
            }
        """
        if (ring_contract_tokens(extern_arm_body)
                != ring_contract_tokens(expected_arm)):
            errors.append(
                "load_prelude direct ExternFn declaration arm must retain "
                "the exact checked-result, DefId dedupe, canonical-name "
                "proof, and guarded HIR emission order"
            )
    for function_name in (
        "record_emitted_prelude_extern_firebreak",
        "append_prelude_extern_hdecl_firebreak",
    ):
        count = len(re.findall(
            rf"\b{function_name}\s*\(", masked))
        if count != 1:
            errors.append(
                f"load_prelude must call {function_name} exactly once; "
                f"found {count}"
            )
    return errors


def direct_callable_identity_firebreak_source_errors(source: str) -> List[str]:
    """Lock the complete HIR If identity join, including its fresh result."""
    errors: List[str] = []
    body, extract_error = extract_ring_function_body(
        source, "hexpr_callable_def_id")
    if extract_error:
        return [extract_error]
    masked = mask_ring_strings_and_comments(body)
    outer_matches = top_level_pattern_matches(
        masked, r"\bmatch\s+expr\s*\{")
    if len(outer_matches) != 1:
        return [
            "hexpr_callable_def_id must have one top-level match expr; found "
            f"{len(outer_matches)}"
        ]
    outer_open = outer_matches[0].end() - 1
    try:
        outer_close = matching_delimiter(masked, outer_open, "{", "}")
    except ValueError as exc:
        return ["hexpr_callable_def_id match expr: " + str(exc)]
    direct_prefix = masked[:outer_matches[0].start()]
    if re.fullmatch(
            r"\s*if\s*!\s*expr_has_reachable_value\s*\(\s*expr\s*\)"
            r"\s*\{\s*return\s+none\s*\}\s*",
            direct_prefix,
            re.DOTALL,
    ) is None:
        errors.append(
            "hexpr_callable_def_id must begin with the exact non-value "
            "rejection before its reachable match expr"
        )
    if masked[outer_close + 1:].strip():
        errors.append(
            "hexpr_callable_def_id match expr must be its final top-level "
            "expression"
        )
    match_body_source = body[outer_open + 1:outer_close]
    match_body = masked[outer_open + 1:outer_close]
    errors.extend(terminal_top_level_ring_expression_wildcard_errors(
        match_body_source,
        "none",
        "hexpr_callable_def_id match expr",
    ))
    direct_headers = (
        ("Ident", r"HExpr::Ident\s*\{\s*def_id\s*,\s*\.\.\s*\}\s*=>"),
        ("Lambda", r"HExpr::Lambda\s*\{\s*def_id\s*,\s*\.\.\s*\}\s*=>"),
        ("Call", r"HExpr::Call\s*\{\s*callable_result_def_id\s*,\s*"
         r"\.\.\s*\}\s*=>"),
        ("Block", r"HExpr::Block\s*\{\s*tail\s*,\s*\.\.\s*\}\s*=>"),
        ("IfExpr", r"HExpr::IfExpr\s*\{\s*then_branch\s*,\s*"
         r"else_branch\s*,\s*\.\.\s*\}\s*=>"),
        ("MatchExpr", r"HExpr::MatchExpr\s*\{\s*arms\s*,\s*\.\.\s*\}"
         r"\s*=>"),
        ("Clone", r"HExpr::Clone\s*\{\s*inner\s*,\s*\.\.\s*\}\s*=>"),
        ("UnsafeBlock", r"HExpr::UnsafeBlock\s*\{\s*body\s*,\s*"
         r"\.\.\s*\}\s*=>"),
        ("terminal wildcard", r"(?<![A-Za-z0-9_])_\s*=>"),
    )
    errors.extend(exact_top_level_ring_match_arm_headers_errors(
        match_body_source,
        direct_headers,
        "hexpr_callable_def_id match expr",
    ))
    if_headers = top_level_pattern_matches(
        match_body,
        r"HExpr::IfExpr\s*\{\s*then_branch\s*,\s*else_branch\s*,\s*"
        r"\.\.\s*\}\s*=>\s*\{",
    )
    if len(if_headers) != 1:
        return [
            "hexpr_callable_def_id must have one exact IfExpr arm; found "
            f"{len(if_headers)}"
        ]
    arm_open = if_headers[0].end() - 1
    try:
        arm_close = matching_delimiter(match_body, arm_open, "{", "}")
    except ValueError as exc:
        return ["hexpr_callable_def_id IfExpr arm: " + str(exc)]
    arm_body = match_body[arm_open + 1:arm_close]
    expected_arm = """
        let then_id = hexpr_callable_def_id(then_branch)
        match else_branch {
            some(branch) => {
                let else_id = hexpr_callable_def_id(branch)
                match (then_id, else_id) {
                    (some(left), some(right)) =>
                        if left == right {
                            let owned_left = left
                            some(owned_left)
                        } else { none },
                    (some(left), none) =>
                        if !expr_has_reachable_value(branch) {
                            let owned_left = left
                            some(owned_left)
                        } else { none },
                    (none, some(right)) =>
                        if !expr_has_reachable_value(then_branch) {
                            let owned_right = right
                            some(owned_right)
                        } else { none },
                    (none, none) => none
                }
            },
            none => none
        }
    """
    if ring_contract_tokens(arm_body) != ring_contract_tokens(expected_arm):
        errors.append(
            "hexpr_callable_def_id IfExpr arm must retain the exact "
            "same-DefId join and fresh selected-result firebreak"
        )
    return errors


def exact_variant_ctor_identity_firebreak_source_errors(
    source: str,
) -> List[str]:
    """Lock canonical ctor-origin proof before the fresh exact-DefId result."""
    errors: List[str] = []
    errors.extend(exact_ring_function_contract_errors(
        source,
        "exact_variant_ctor_def_id_result_firebreak",
        r"\bfn\s+exact_variant_ctor_def_id_result_firebreak\s*\(\s*"
        r"def_id\s*:\s*Int\s*\)\s*->\s*Int\?\s*\{",
        """
        let exact_def_id = def_id
        some(exact_def_id)
        """,
        "exact_variant_ctor_def_id_result_firebreak",
    ))
    errors.extend(exact_ring_function_contract_errors(
        source,
        "exact_variant_ctor_def_id",
        r"\bfn\s+exact_variant_ctor_def_id\s*\(\s*env\s*:\s*TypeEnv\s*,"
        r"\s*def\s*:\s*EnumDef\s*,\s*variant\s*:\s*EnumVariant\s*\)"
        r"\s*->\s*Int\?\s*\{",
        """
        if variant.field_names.is_some() || variant.fields.len() == 0 {
            return none
        }
        let ctor_origin = variant_ctor_name(def.name, variant.name)
        match env.lookup(ctor_origin) {
            some(scheme) => match (scheme.def_id, scheme.ty) {
                (some(def_id), Type::FnType { .. }) => {
                    match env.types.variant_ctor_origins.get(def_id) {
                        some(origin) => {
                            if origin != ctor_origin { panic("") }
                        },
                        none => panic("")
                    }
                    exact_variant_ctor_def_id_result_firebreak(def_id)
                },
                _ => panic("")
            },
            none => panic("")
        }
        """,
        "exact_variant_ctor_def_id canonical origin proof",
    ))
    errors.extend(exact_ring_function_contract_errors(
        source,
        "variant_ctor_scheme",
        r"\bfn\s+variant_ctor_scheme\s*\(\s*env\s*:\s*TypeEnv\s*,\s*"
        r"def\s*:\s*EnumDef\s*,\s*variant\s*:\s*EnumVariant\s*\)\s*"
        r"->\s*TypeScheme\s*\{",
        """
        let enum_params = def.type_param_vars.map(fn(id) {
            Type::TypeVar { id: id, name: none }
        })
        let enum_name = def.name
        let enum_type = Type::EnumType {
            name: enum_name, type_params: enum_params
        }
        let ctor_type = if variant.field_names.is_some() ||
                           variant.fields.len() == 0 {
            enum_type
        } else {
            let ctor_params = variant.fields
            Type::FnType {
                params: ctor_params, return_type: enum_type,
                meta: fn_meta(EMPTY_ROW, CALLABLE_MOVE_OWNED)
            }
        }
        let scheme_type_vars = def.type_param_vars
        TypeScheme {
            ty: ctor_type,
            type_vars: scheme_type_vars,
            bounds: [],
            def_id: exact_variant_ctor_def_id(env, def, variant)
        }
        """,
        "variant_ctor_scheme canonical constructor identity",
    ))
    scheme_body, extract_error = extract_ring_function_body(
        source, "variant_ctor_scheme")
    if extract_error:
        errors.append(extract_error)
    else:
        scheme_masked = mask_ring_strings_and_comments(scheme_body)
        call_count = len(re.findall(
            r"\bdef_id\s*:\s*exact_variant_ctor_def_id\s*"
            r"\(\s*env\s*,\s*def\s*,\s*variant\s*\)",
            scheme_masked,
        ))
        if call_count != 1:
            errors.append(
                "variant_ctor_scheme must call the canonical exact-identity "
                f"resolver once; found {call_count}"
            )
        if re.search(
                r"\b(?:let|var|fn)\s+(?:mut\s+)?"
                r"exact_variant_ctor_def_id\b",
                scheme_masked):
            errors.append(
                "variant_ctor_scheme must not shadow the canonical exact "
                "variant-constructor identity resolver"
            )
    return errors


def droppable_producer_lattice_source_errors(
    perceus_source: str,
    verify_source: str,
) -> List[str]:
    """Lock the independent pre/post-RC droppable-producer lattices."""
    errors: List[str] = []

    constant_contracts = (
        (perceus_source, "DROP_PRODUCER_OWNED", 0, "Perceus owned"),
        (perceus_source, "DROP_PRODUCER_NOOP_NONE", 1, "Perceus none"),
        (perceus_source, "DROP_PRODUCER_OPAQUE", 2, "Perceus opaque"),
        (verify_source, "V_DROP_PRODUCER_OWNED", 0, "verifier owned"),
        (verify_source, "V_DROP_PRODUCER_NOOP_NONE", 1, "verifier none"),
        (verify_source, "V_DROP_PRODUCER_OPAQUE", 2, "verifier opaque"),
    )
    for source, name, value, description in constant_contracts:
        count = len(re.findall(
            rf"\bconst\s+{name}\s*:\s*Int\s*=\s*{value}\b",
            mask_ring_strings_and_comments(source),
        ))
        if count != 1:
            errors.append(
                f"{description} producer class constant matched {count} "
                "times (expected 1)"
            )

    perceus_contracts = (
        (
            "merge_droppable_branch_classes",
            r"\bfn\s+merge_droppable_branch_classes\s*\(\s*"
            r"classes\s*:\s*List\s*<\s*Int\?\s*>\s*\)\s*"
            r"->\s*Int\s*\{",
            """
                let mut saw_value = false
                let mut saw_owned = false
                for maybe_class in classes {
                    match maybe_class {
                        some(class) => {
                            saw_value = true
                            if class == DROP_PRODUCER_OPAQUE {
                                return DROP_PRODUCER_OPAQUE
                            }
                            if class == DROP_PRODUCER_OWNED {
                                saw_owned = true
                            }
                        },
                        none => {}
                    }
                }
                if !saw_value {
                    DROP_PRODUCER_OPAQUE
                } else if saw_owned {
                    DROP_PRODUCER_OWNED
                } else {
                    DROP_PRODUCER_NOOP_NONE
                }
            """,
            "Perceus droppable producer join",
        ),
        (
            "droppable_branch_producer_class",
            r"\bfn\s+droppable_branch_producer_class\s*\(\s*"
            r"body\s*:\s*HExpr\s*,\s*externs\s*:\s*Set\s*<\s*Str\s*>\s*,\s*"
            r"ownership\s*:\s*OwnershipMetadata\s*\)\s*->\s*Int\?\s*\{",
            """
                if expr_diverges(body) {
                    none
                } else {
                    match body {
                        HExpr::Block { tail, .. } => match tail {
                            some(value) => some(droppable_producer_class(
                                value, externs, ownership)),
                            none => some(DROP_PRODUCER_OPAQUE)
                        },
                        _ => some(droppable_producer_class(body, externs, ownership))
                    }
                }
            """,
            "Perceus droppable branch classifier",
        ),
        (
            "droppable_producer_class",
            r"\bfn\s+droppable_producer_class\s*\(\s*"
            r"init\s*:\s*HExpr\s*,\s*externs\s*:\s*Set\s*<\s*Str\s*>\s*,\s*"
            r"ownership\s*:\s*OwnershipMetadata\s*\)\s*->\s*Int\s*\{",
            """
                if !type_is_physical_rc_eligible(hexpr_type(init), externs) {
                    return DROP_PRODUCER_OPAQUE
                }
                if is_option_none_ctor_ident(init) {
                    return DROP_PRODUCER_NOOP_NONE
                }
                match init {
                    HExpr::IfExpr { then_branch, else_branch, .. } => match else_branch {
                        some(other) => merge_droppable_branch_classes([
                            droppable_branch_producer_class(
                                then_branch, externs, ownership),
                            droppable_branch_producer_class(
                                other, externs, ownership)
                        ]),
                        none => DROP_PRODUCER_OPAQUE
                    },
                    HExpr::MatchExpr { arms, .. } => {
                        let mut classes: List<Int?> = []
                        for arm in arms {
                            classes.push(droppable_branch_producer_class(
                                arm.body, externs, ownership))
                        }
                        merge_droppable_branch_classes(classes)
                    },
                    HExpr::Block { tail, .. } => match tail {
                        some(value) => droppable_producer_class(
                            value, externs, ownership),
                        none => DROP_PRODUCER_OPAQUE
                    },
                    _ => if is_droppable_leaf_init(init, externs, ownership) {
                        DROP_PRODUCER_OWNED
                    } else {
                        DROP_PRODUCER_OPAQUE
                    }
                }
            """,
            "Perceus droppable producer classifier",
        ),
        (
            "is_droppable_init",
            r"\bfn\s+is_droppable_init\s*\(\s*"
            r"init\s*:\s*HExpr\s*,\s*externs\s*:\s*Set\s*<\s*Str\s*>\s*,\s*"
            r"ownership\s*:\s*OwnershipMetadata\s*\)\s*->\s*Bool\s*\{",
            """
                droppable_producer_class(init, externs, ownership) ==
                    DROP_PRODUCER_OWNED
            """,
            "Perceus droppable producer wrapper",
        ),
    )
    verify_contracts = (
        (
            "v_merge_droppable_branch_classes",
            r"\bfn\s+v_merge_droppable_branch_classes\s*\(\s*"
            r"classes\s*:\s*List\s*<\s*Int\?\s*>\s*\)\s*"
            r"->\s*Int\s*\{",
            """
                let mut saw_value = false
                let mut saw_owned = false
                for maybe_class in classes {
                    match maybe_class {
                        some(class) => {
                            saw_value = true
                            if class == V_DROP_PRODUCER_OPAQUE {
                                return V_DROP_PRODUCER_OPAQUE
                            }
                            if class == V_DROP_PRODUCER_OWNED {
                                saw_owned = true
                            }
                        },
                        none => {}
                    }
                }
                if !saw_value {
                    V_DROP_PRODUCER_OPAQUE
                } else if saw_owned {
                    V_DROP_PRODUCER_OWNED
                } else {
                    V_DROP_PRODUCER_NOOP_NONE
                }
            """,
            "verifier droppable producer join",
        ),
        (
            "v_droppable_branch_producer_class",
            r"\bfn\s+v_droppable_branch_producer_class\s*\(\s*"
            r"body\s*:\s*HExpr\s*,\s*externs\s*:\s*Set\s*<\s*Str\s*>\s*,\s*"
            r"ownership\s*:\s*OwnershipMetadata\s*\)\s*->\s*Int\?\s*\{",
            """
                if expr_diverges(body) {
                    none
                } else {
                    some(v_droppable_producer_class(body, externs, ownership))
                }
            """,
            "verifier droppable branch classifier",
        ),
        (
            "v_droppable_producer_class",
            r"\bfn\s+v_droppable_producer_class\s*\(\s*"
            r"init\s*:\s*HExpr\s*,\s*externs\s*:\s*Set\s*<\s*Str\s*>\s*,\s*"
            r"ownership\s*:\s*OwnershipMetadata\s*\)\s*->\s*Int\s*\{",
            """
                if !type_is_physical_rc_eligible(hexpr_type(init), externs) {
                    return V_DROP_PRODUCER_OPAQUE
                }
                if is_option_none_ctor_ident(init) {
                    return V_DROP_PRODUCER_NOOP_NONE
                }
                match init {
                    HExpr::IfExpr { then_branch, else_branch, .. } => match else_branch {
                        some(other) => v_merge_droppable_branch_classes([
                            v_droppable_branch_producer_class(
                                then_branch, externs, ownership),
                            v_droppable_branch_producer_class(
                                other, externs, ownership)
                        ]),
                        none => V_DROP_PRODUCER_OPAQUE
                    },
                    HExpr::MatchExpr { arms, .. } => {
                        let mut classes: List<Int?> = []
                        for arm in arms {
                            classes.push(v_droppable_branch_producer_class(
                                arm.body, externs, ownership))
                        }
                        v_merge_droppable_branch_classes(classes)
                    },
                    HExpr::Block { stmts, tail, .. } => match tail {
                        some(value) => match value {
                            HExpr::Ident { def_id, .. } => match def_id {
                                some(id) => match v_block_local_init(stmts, id) {
                                    some(local_init) => v_droppable_producer_class(
                                        local_init, externs, ownership),
                                    none => if is_option_none_ctor_ident(value) {
                                        V_DROP_PRODUCER_NOOP_NONE
                                    } else if is_nullary_variant_ctor_ident(value) ||
                                              is_materialized_fn_value(value) {
                                        V_DROP_PRODUCER_OWNED
                                    } else {
                                        V_DROP_PRODUCER_OPAQUE
                                    }
                                },
                                none => if is_option_none_ctor_ident(value) {
                                    V_DROP_PRODUCER_NOOP_NONE
                                } else if is_nullary_variant_ctor_ident(value) ||
                                          is_materialized_fn_value(value) {
                                    V_DROP_PRODUCER_OWNED
                                } else {
                                    V_DROP_PRODUCER_OPAQUE
                                }
                            },
                            _ => v_droppable_producer_class(
                                value, externs, ownership)
                        },
                        none => V_DROP_PRODUCER_OPAQUE
                    },
                    _ => if v_droppable_leaf_init(init, externs, ownership) {
                        V_DROP_PRODUCER_OWNED
                    } else {
                        V_DROP_PRODUCER_OPAQUE
                    }
                }
            """,
            "verifier droppable producer classifier",
        ),
        (
            "v_droppable_init",
            r"\bfn\s+v_droppable_init\s*\(\s*"
            r"init\s*:\s*HExpr\s*,\s*externs\s*:\s*Set\s*<\s*Str\s*>\s*,\s*"
            r"ownership\s*:\s*OwnershipMetadata\s*\)\s*->\s*Bool\s*\{",
            """
                v_droppable_producer_class(init, externs, ownership) ==
                    V_DROP_PRODUCER_OWNED
            """,
            "verifier droppable producer wrapper",
        ),
        (
            "v_block_local_init",
            r"\bfn\s+v_block_local_init\s*\(\s*"
            r"stmts\s*:\s*List\s*<\s*HStmt\s*>\s*,\s*"
            r"def_id\s*:\s*Int\s*\)\s*->\s*HExpr\?\s*\{",
            """
                let mut found: HExpr? = none
                for s in stmts {
                    match s {
                        HStmt::Let { def_id: binding_def_id, init, .. } => {
                            match binding_def_id {
                                some(actual_def_id) => {
                                    if actual_def_id == def_id {
                                        let matched_init = init
                                        found = some(matched_init)
                                    }
                                },
                                none => {}
                            }
                        },
                        HStmt::Var { def_id: binding_def_id, init, .. } => {
                            match binding_def_id {
                                some(actual_def_id) => {
                                    if actual_def_id == def_id {
                                        let matched_init = init
                                        found = some(matched_init)
                                    }
                                },
                                none => {}
                            }
                        },
                        _ => {},
                    }
                    if !stmt_reaches_next(s) { return found }
                }
                found
            """,
            "verifier exact-DefId block-local producer lookup",
        ),
    )
    for function_name, header, body, description in (
            perceus_contracts + verify_contracts):
        source = (
            verify_source if function_name.startswith("v_")
            else perceus_source
        )
        errors.extend(exact_ring_function_contract_errors(
            source, function_name, header, body, description))

    rc_body, extract_error = extract_ring_function_body(
        perceus_source, "rc_block_inner")
    if extract_error:
        errors.append(extract_error)
    else:
        expected_tail = ring_contract_tokens("""
            let tmp_tail = if escape &&
                    gensym.counters.get(1) != some(1) {
                HExpr::Take { name: result_name,
                    source_def_id: result_def_id, ty: result_ty,
                    effects: te, span: ts }
            } else {
                HExpr::Ident { name: result_name,
                    resolved_name: none, def_id: some(result_def_id),
                    dict_closure_dicts: none, ty: result_ty,
                    effects: te, span: ts }
            }
        """)
        actual_tokens = ring_contract_tokens(rc_body)
        occurrences = sum(
            actual_tokens[index:index + len(expected_tail)] == expected_tail
            for index in range(len(actual_tokens) - len(expected_tail) + 1)
        )
        if occurrences != 1:
            errors.append(
                "rc_block_inner synthetic move-out must retain one exact "
                "original-escape/mutation-controlled Take-to-Ident contract; "
                f"found {occurrences}"
            )
    return errors


def maybe_moved_verifier_source_errors(
    verify_source: str, *, exercise_mutations: bool = True
) -> List[str]:
    """Lock the bounded LIVE/MOVED join and every legal discharge boundary."""
    errors = exact_ring_function_contract_errors(
        verify_source,
        "v_join_binding_state",
        r"\bfn\s+v_join_binding_state\s*\(\s*kind\s*:\s*Int\s*,\s*"
        r"left\s*:\s*Int\s*,\s*right\s*:\s*Int\s*\)\s*->\s*"
        r"\(\s*Int\s*,\s*Bool\s*\)\s*\{",
        """
            if !v_state_is_known(left) || !v_state_is_known(right) {
                panic("unreachable: RC verifier encountered an unknown binding state")
            }
            if kind != K_OWNED &&
               (left == S_MAYBE_MOVED || right == S_MAYBE_MOVED) {
                panic("unreachable: non-owned RC slot entered MAYBE_MOVED state")
            }
            if left == right {
                return ((left, true))
            }
            let left_pending = left == S_LIVE || left == S_MOVED ||
                left == S_MAYBE_MOVED
            let right_pending = right == S_LIVE || right == S_MOVED ||
                right == S_MAYBE_MOVED
            if kind == K_OWNED && left_pending && right_pending {
                return ((S_MAYBE_MOVED, true))
            }
            ((S_MOVED, false))
        """,
        "RC verifier LIVE/MOVED binding-state join",
    )

    errors.extend(exact_ring_function_contract_errors(
        verify_source,
        "v_check_exact_capture_reads",
        r"\bfn\s+v_check_exact_capture_reads\s*\(\s*body\s*:\s*HExpr\s*,\s*"
        r"mut\s+ctx\s*:\s*VCtx\s*\)\s*\{",
        """
            let mut candidates: Set<Int> = set_new()
            for candidate in ctx.def_ids {
                match candidate {
                    some(def_id) => {
                        let candidate_def_id = def_id
                        candidates.insert(candidate_def_id)
                    },
                    none => {}
                }
            }
            for capture in collect_exact_free_bindings(body, candidates) {
                let capture_def_id = capture.def_id
                let index = v_lookup_def(ctx, capture_def_id)
                if index >= 0 {
                    let state = ctx.states[index]
                    if !v_state_is_known(state) {
                        panic("unreachable: RC verifier capture read saw unknown state")
                    }
                    if state != S_LIVE {
                        let capture_span = capture.span
                        v_report(ctx, "uaf-use-after-drop", true,
                            "capture reads an unavailable slot", capture_span)
                    }
                }
            }
        """,
        "capture must reject every non-LIVE joined state",
    ))

    def direct_if_body_errors(
        scope: str, header: str, expected_body: str, description: str
    ) -> List[str]:
        branch_body, branch_error = extract_unique_top_level_ring_brace_body(
            scope, header, description)
        if branch_error:
            return [branch_error]
        if ring_contract_tokens(branch_body or "") != ring_contract_tokens(
                expected_body):
            return [f"{description} direct branch body must remain exact"]
        return []

    ident_body, ident_error = extract_ring_function_body(
        verify_source, "v_ident")
    if ident_error:
        errors.append(ident_error)
    else:
        errors.extend(direct_if_body_errors(
            ident_body,
            r"\bif\s+ctx\.states\s*\[\s*idx\s*\]\s*==\s*"
            r"S_MAYBE_MOVED\s*\{",
            """
                let read_span = span
                v_report(ctx, "uaf-use-after-drop", true,
                    "read is not live on every path", read_span)
                if !type_is_physical_rc_eligible(ty, ctx.externs) {
                    return CLS_EXCLUDED
                }
                return CLS_BORROW
            """,
            "read/Take must reject MAYBE_MOVED",
        ))

    assign_body, assign_error = extract_ring_function_body(
        verify_source, "v_assign")
    if assign_error:
        errors.append(assign_error)
    else:
        match_body, match_error = extract_unique_top_level_ring_brace_body(
            assign_body, r"\bmatch\s+target\s*\{",
            "assignment target dispatch")
        if match_error:
            errors.append(match_error)
        else:
            ident_arm, arm_error = extract_unique_top_level_ring_brace_body(
                match_body or "",
                r"\bHExpr::Ident\s*\{\s*name\s*,\s*def_id\s*,\s*ty\s*,\s*"
                r"\.\.\s*\}\s*=>\s*\{",
                "assignment exact-Ident arm")
            if arm_error:
                errors.append(arm_error)
            else:
                errors.extend(direct_if_body_errors(
                    ident_arm or "",
                    r"\bif\s+ctx\.states\s*\[\s*idx\s*\]\s*==\s*"
                    r"S_MAYBE_MOVED\s*\{",
                    """
                        if ctx.kinds[idx] != K_OWNED {
                            panic("unreachable: non-owned RC slot entered MAYBE_MOVED state")
                        }
                        let overwrite_span = span
                        v_report(ctx, "rc-imbalance", true,
                            "assignment overwrites a path-dependent slot",
                            overwrite_span)
                    """,
                    "assignment must reject MAYBE_MOVED",
                ))

    drop_body, drop_error = extract_ring_function_body(
        verify_source, "v_drop")
    if drop_error:
        errors.append(drop_error)
    else:
        errors.extend(direct_if_body_errors(
            drop_body,
            r"\bif\s+ctx\.states\s*\[\s*idx\s*\]\s*==\s*"
            r"S_MAYBE_MOVED\s*\{",
            """
                if ctx.kinds[idx] != K_OWNED {
                    panic("unreachable: non-owned RC slot entered MAYBE_MOVED state")
                }
                ctx.states.set(idx, S_DROPPED)
                return
            """,
            "common Drop must be the unique MAYBE_MOVED discharge",
        ))

    capture_body, capture_error = extract_ring_function_body(
        verify_source, "v_expr")
    if capture_error:
        errors.append(capture_error)
    elif len(re.findall(
            r"\bv_check_exact_capture_reads\s*\(",
            mask_ring_strings_and_comments(capture_body))) != 2:
        errors.append(
            "lambda and handler construction must retain two exact capture "
            "availability checks"
        )

    # These functions are the complete transition authority for read/Take,
    # overwrite, and Drop.  Hash the complete normalized function body rather
    # than a masked/tokenized projection: Ring string interpolation may execute
    # effectful expressions, so even a standalone string can alter reachability.
    # Any comment, string, early return, dead wrapper, reordered state check, or
    # alternate sink must therefore be reviewed as an intentional authority
    # change. Path.read_text already normalizes CRLF to LF for stable hashing.
    exact_transition_headers = {
        "v_ident": (
            r"\bfn\s+v_ident\s*\(\s*name\s*:\s*Str\s*,\s*"
            r"def_id\s*:\s*Int\?\s*,\s*ty\s*:\s*Type\s*,\s*"
            r"span\s*:\s*Span\s*,\s*mode\s*:\s*Int\s*,\s*"
            r"mut\s+ctx\s*:\s*VCtx\s*\)\s*->\s*Int\s*\{"),
        "v_assign": (
            r"\bfn\s+v_assign\s*\(\s*target\s*:\s*HExpr\s*,\s*"
            r"value\s*:\s*HExpr\s*,\s*span\s*:\s*Span\s*,\s*"
            r"mut\s+ctx\s*:\s*VCtx\s*\)\s*\{"),
        "v_drop": (
            r"\bfn\s+v_drop\s*\(\s*name\s*:\s*Str\s*,\s*"
            r"def_id\s*:\s*Int\s*,\s*span\s*:\s*Span\s*,\s*"
            r"mut\s+ctx\s*:\s*VCtx\s*\)\s*\{"),
    }
    masked_verify_source = mask_ring_strings_and_comments(verify_source)
    for function_name, header_pattern in exact_transition_headers.items():
        header_count = len(re.findall(
            header_pattern, masked_verify_source, re.DOTALL))
        if header_count != 1:
            errors.append(
                f"{function_name} transition header changed: "
                f"found {header_count} exact headers (expected 1)"
            )

    exact_transition_digests = {
        "v_ident": "18D89D61F2AC0D304F98A89AB4D4E8365578A388BC69751CF79E29BEFE1F96F4",
        "v_assign": "8D8B2412A8D7B0CD9911E34AD84EE4B273C76E809F8609EAF7EA4BB41C8DF595",
        "v_drop": "D9E4B00BC9DA92AF12A9193DB6E6FD666A8A20F7EEEB6D3928E968CEC15FE9D0",
    }
    for function_name, expected_digest in exact_transition_digests.items():
        function_body, function_error = extract_ring_function_body(
            verify_source, function_name)
        if function_error:
            errors.append(function_error)
            continue
        actual_digest = hashlib.sha256(
            function_body.encode("utf-8")).hexdigest().upper()
        if actual_digest != expected_digest:
            errors.append(
                f"{function_name} whole transition authority changed: "
                f"expected {expected_digest}, found {actual_digest}"
            )

    if exercise_mutations:
        mutation_specs = (
            (
                "overbroad-kind", "v_join_binding_state",
                r"\bif\s+kind\s*==\s*K_OWNED\s*&&\s*left_pending\s*&&\s*"
                r"right_pending\s*\{", "binding-state join",
            ),
            (
                "dead capture", "v_check_exact_capture_reads",
                r"\bif\s+state\s*!=\s*S_LIVE\s*\{",
                "capture must reject",
            ),
            (
                "dead read", "v_ident",
                r"\bif\s+ctx\.states\s*\[\s*idx\s*\]\s*==\s*"
                r"S_MAYBE_MOVED\s*\{", "read/Take must reject",
            ),
            (
                "dead assignment", "v_assign",
                r"\bif\s+ctx\.states\s*\[\s*idx\s*\]\s*==\s*"
                r"S_MAYBE_MOVED\s*\{", "assignment must reject",
            ),
            (
                "dead Drop", "v_drop",
                r"\bif\s+ctx\.states\s*\[\s*idx\s*\]\s*==\s*"
                r"S_MAYBE_MOVED\s*\{", "common Drop must",
            ),
        )
        for label, function_name, header, expected_error in mutation_specs:
            function_body, function_error = extract_ring_function_body(
                verify_source, function_name)
            if function_error:
                errors.append(function_error)
                continue
            masked_body = mask_ring_strings_and_comments(function_body)
            matches = list(re.finditer(header, masked_body, re.DOTALL))
            if len(matches) != 1:
                errors.append(
                    f"MAYBE_MOVED {label} mutation found {len(matches)} "
                    "target blocks (expected 1)"
                )
                continue
            open_index = matches[0].end() - 1
            try:
                close_index = matching_delimiter(
                    masked_body, open_index, "{", "}")
            except ValueError as exc:
                errors.append(f"MAYBE_MOVED {label} mutation: {exc}")
                continue
            mutated_body = (
                function_body[:matches[0].start()]
                + "if false {\n"
                + function_body[matches[0].start():close_index + 1]
                + "\n}"
                + function_body[close_index + 1:]
            )
            mutated = verify_source.replace(
                function_body, mutated_body, 1)
            mutation_errors = maybe_moved_verifier_source_errors(
                mutated, exercise_mutations=False)
            if not any(expected_error in error for error in mutation_errors):
                errors.append(
                    f"MAYBE_MOVED {label} mutation escaped targeted "
                    f"contract {expected_error!r}: {mutation_errors}"
                )
        prefix_mutation_specs = (
            ("v_ident", "return CLS_BORROW\n", "v_ident whole transition"),
            ("v_assign", "return\n", "v_assign whole transition"),
            ("v_drop", "return\n", "v_drop whole transition"),
            (
                "v_ident", '"${panic(name)}"\n',
                "v_ident whole transition",
            ),
            ("v_ident", '"probe"\n', "v_ident whole transition"),
        )
        for function_name, prefix, expected_error in prefix_mutation_specs:
            function_body, function_error = extract_ring_function_body(
                verify_source, function_name)
            if function_error:
                errors.append(function_error)
                continue
            mutated_body = prefix + function_body
            mutated = verify_source.replace(
                function_body, mutated_body, 1)
            mutation_errors = maybe_moved_verifier_source_errors(
                mutated, exercise_mutations=False)
            if not any(expected_error in error for error in mutation_errors):
                errors.append(
                    f"MAYBE_MOVED {function_name} prefix mutation "
                    f"escaped whole transition authority: {mutation_errors}"
                )
        original_assign_header = (
            "fn v_assign(target: HExpr, value: HExpr, span: Span, "
            "mut ctx: VCtx)")
        swapped_assign_header = (
            "fn v_assign(value: HExpr, target: HExpr, span: Span, "
            "mut ctx: VCtx)")
        if verify_source.count(original_assign_header) != 1:
            errors.append(
                "MAYBE_MOVED v_assign formal-swap mutation found "
                f"{verify_source.count(original_assign_header)} exact headers "
                "(expected 1)"
            )
        else:
            mutated = verify_source.replace(
                original_assign_header, swapped_assign_header, 1)
            mutation_errors = maybe_moved_verifier_source_errors(
                mutated, exercise_mutations=False)
            if not any(
                    "v_assign transition header changed" in error
                    for error in mutation_errors):
                errors.append(
                    "MAYBE_MOVED v_assign formal-swap mutation escaped "
                    f"transition header authority: {mutation_errors}"
                )
    return errors


def maybe_moved_fixture_source_errors() -> List[str]:
    """Keep every control-flow shape that exercises the bounded join live."""
    path = REPO / "tests" / "cases" / "verify_rc" / "maybe_moved_common_drop.ring"
    try:
        source = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read {display_path(path)}: {exc}"]
    contracts = (
        (
            "if_let_common_drop",
            r"\bfn\s+if_let_common_drop\s*\(\s*flag\s*:\s*Bool\s*\)\s*\{",
            """
                let value = Resource { id: 4 }
                let marker = if flag { some(1) } else { none }
                if let some(_) = marker {
                    let moved = consume(value)
                    print(moved.id)
                }
            """,
            "IfLet LIVE/MOVED common Drop fixture",
        ),
        (
            "nested_break_common_drop",
            r"\bfn\s+nested_break_common_drop\s*\(\s*outer\s*:\s*Bool\s*,\s*"
            r"inner\s*:\s*Bool\s*\)\s*\{",
            """
                let value = Resource { id: 6 }
                while outer {
                    while inner {
                        let moved = consume(value)
                        print(moved.id)
                        break
                    }
                    break
                }
            """,
            "nested Break LIVE/MOVED common Drop fixture",
        ),
        (
            "multiple_break_common_drop",
            r"\bfn\s+multiple_break_common_drop\s*\(\s*run\s*:\s*Bool\s*,\s*"
            r"take_first\s*:\s*Bool\s*\)\s*\{",
            """
                let value = Resource { id: 7 }
                while run {
                    if take_first {
                        let moved = consume(value)
                        print(moved.id)
                        break
                    }
                    break
                }
            """,
            "multiple Break LIVE/MOVED common Drop fixture",
        ),
        (
            "main",
            r"\bfn\s+main\s*\(\s*\)\s*\{",
            """
                if_common_drop(true)
                if_common_drop(false)
                match_common_drop(0)
                match_common_drop(1)
                guard_common_drop(0)
                guard_common_drop(1)
                if_let_common_drop(true)
                if_let_common_drop(false)
                break_common_drop(true)
                break_common_drop(false)
                nested_break_common_drop(true, true)
                nested_break_common_drop(true, false)
                nested_break_common_drop(false, true)
                multiple_break_common_drop(true, true)
                multiple_break_common_drop(true, false)
                multiple_break_common_drop(false, true)
            """,
            "LIVE/MOVED fixture call matrix",
        ),
    )
    errors: List[str] = []
    for function_name, header, body, description in contracts:
        errors.extend(exact_ring_function_contract_errors(
            source, function_name, header, body, description))
    return errors


def ownership_bootstrap_transition_source_errors() -> List[str]:
    """Lock the narrow prelude and fresh-value ownership transition."""
    errors: List[str] = []
    paths = {
        "registration": REPO / "compiler" / "infer_register.ring",
        "checker": REPO / "compiler" / "checker.ring",
        "hir": REPO / "compiler" / "hir.ring",
        "ownership": REPO / "compiler" / "ownership.ring",
        "infer_ctx": REPO / "compiler" / "infer_ctx.ring",
        "perceus": REPO / "compiler" / "perceus.ring",
        "verify_rc": REPO / "compiler" / "verify_rc.ring",
        "exports": REPO / "compiler" / "exports.ring",
        "runtime": REPO / "ring_runtime.cpp",
        "list": REPO / "std" / "list.ring",
        "map": REPO / "std" / "map.ring",
        "result": REPO / "std" / "result.ring",
        "set": REPO / "std" / "set.ring",
    }
    sources: Dict[str, str] = {}
    for label, path in paths.items():
        try:
            sources[label] = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            errors.append(f"cannot read {display_path(path)}: {exc}")
    if errors:
        return errors

    errors.extend(prelude_ownership_firebreak_source_errors(
        sources["registration"], sources["checker"]))
    errors.extend(droppable_producer_lattice_source_errors(
        sources["perceus"], sources["verify_rc"]))
    errors.extend(maybe_moved_verifier_source_errors(sources["verify_rc"]))
    errors.extend(maybe_moved_fixture_source_errors())

    const_body, extract_error = extract_ring_function_body(
        sources["registration"], "register_const")
    if extract_error:
        errors.append(extract_error)
    else:
        count = len(re.findall(
            r"\brecord_callable_ownership\s*\(\s*"
            r"ctx\.env\.types\.ownership_metadata\s*,\s*did\s*,\s*"
            r"CALLABLE_BORROW_OWNED\s*,\s*CALLABLE_SOURCE_DECLARED\s*\)",
            mask_ring_strings_and_comments(const_body),
        ))
        if count != 1:
            errors.append(
                "register_const must publish one exact zero-argument getter "
                f"descriptor; found {count}"
            )

    load_body, extract_error = extract_ring_function_body(
        sources["checker"], "load_prelude")
    if extract_error:
        errors.append(extract_error)
    else:
        masked = mask_ring_strings_and_comments(load_body)
        count = len(re.findall(
            r"\bregister_prelude_decl_public\s*\(", masked))
        if count != 1:
            errors.append(
                "load_prelude must use register_prelude_decl_public exactly "
                f"once; found {count}"
            )
        dedupe_contracts = (
            (
                "final-DefId set",
                r"\blet\s+mut\s+emitted_prelude_externs\s*:\s*"
                r"Set\s*<\s*Int\s*>\s*=\s*set_new\s*\(\s*\)",
            ),
            (
                "duplicate test",
                r"\bemitted_prelude_externs\.contains\s*\(\s*id\s*\)",
            ),
        )
        for description, pattern in dedupe_contracts:
            count = len(re.findall(pattern, masked))
            if count != 1:
                errors.append(
                    f"load_prelude extern dedupe {description} matched "
                    f"{count} times (expected 1)"
                )

    expected_duplicate_externs = {
        "ring_buf_alloc": ("list.ring", "map.ring", "str.ring"),
        "ring_buf_copy_at": ("list.ring", "str.ring"),
        "ring_buf_dealloc": ("list.ring", "map.ring", "str.ring"),
        "ring_buf_set_byte": ("map.ring", "str.ring"),
        "ring_slot_alloc": ("list.ring", "map.ring"),
        "ring_slot_dealloc": ("list.ring", "map.ring"),
        "ring_slot_drop": ("list.ring", "map.ring"),
        "ring_slot_read": ("list.ring", "map.ring"),
        "ring_slot_replace": ("list.ring", "map.ring"),
        "ring_slot_take": ("list.ring", "map.ring"),
        "ring_slot_write": ("list.ring", "map.ring"),
        "ring_str_as_ptr": ("list.ring", "str.ring"),
        "ring_str_from_ptr": ("list.ring", "str.ring"),
    }
    extern_sources: Dict[str, List[str]] = {}
    for path in sorted((REPO / "std").glob("*.ring")):
        try:
            masked = mask_ring_strings_and_comments(
                path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as exc:
            errors.append(f"cannot inventory {display_path(path)}: {exc}")
            continue
        for name in re.findall(
                r"(?m)^\s*extern\s+fn\s+([A-Za-z_][A-Za-z0-9_]*)\b",
                masked):
            extern_sources.setdefault(name, []).append(path.name)
    duplicate_externs = {
        name: tuple(files)
        for name, files in sorted(extern_sources.items())
        if len(files) > 1
    }
    if duplicate_externs != expected_duplicate_externs:
        errors.append(
            "prelude duplicate extern inventory changed: "
            f"expected {expected_duplicate_externs}, found {duplicate_externs}"
        )

    clone_body, clone_error = extract_c_function_body(
        sources["runtime"], "ring_cl_clone_rc")
    if clone_error:
        errors.append(clone_error)
    elif (len(re.findall(r"\bring_dup\s*\(\s*val\s*\)", clone_body)) != 1
          or len(re.findall(r"\breturn\s+val\s*;", clone_body)) != 1):
        errors.append(
            "primitive Clone closure must duplicate and return its exact value")
    clone_dict_body, clone_dict_error = extract_c_function_body(
        sources["runtime"], "ring_make_clone_dict")
    if clone_dict_error:
        errors.append(clone_dict_error)
    elif len(re.findall(
            r"d\s*\[\s*0\s*\]\s*=\s*ring_make_closure\s*\(\s*"
            r"\(\s*void\s*\*\s*\)\s*ring_cl_clone_rc\s*\)",
            mask_c_strings_and_comments(clone_dict_body))) != 1:
        errors.append(
            "primitive Clone dictionary must publish ring_cl_clone_rc at slot 0")
    if len(re.findall(
            r"\bhas_trait_suffix\s*\(\s*\"Clone\"\s*\)",
            sources["runtime"])) != 1:
        errors.append(
            "ring_get_builtin_dict must dispatch exact primitive Clone once")

    pattern_body, extract_error = extract_ring_function_body(
        sources["ownership"], "register_pattern_slots")
    if extract_error:
        errors.append(extract_error)
    else:
        masked = mask_ring_strings_and_comments(pattern_body)
        borrowed = len(re.findall(
            r"\bregister_slot\s*\(\s*plan\s*,\s*binding\.def_id\s*,"
            r"\s*true\s*,",
            masked,
        ))
        if borrowed != 1:
            errors.append(
                "register_pattern_slots must retain exactly one borrowed slot "
                f"registration; found {borrowed}"
            )

    none_body, extract_error = extract_ring_function_body(
        sources["hir"], "is_option_none_ctor_ident")
    if extract_error:
        errors.append(extract_error)
    else:
        masked = mask_ring_strings_and_comments(none_body)
        name_count = len(re.findall(
            r"\bname\s*==\s*BUILTIN_OPTION\b", masked))
        identity_count = len(re.findall(
            r"\brn\s*==\s*variant_ctor_name\s*"
            r"\(\s*BUILTIN_OPTION\s*,\s*\"none\"\s*\)",
            none_body,
        ))
        if name_count != 1 or identity_count != 1:
            errors.append(
                "is_option_none_ctor_ident lost exact Option identity "
                f"contract: name={name_count}, identity={identity_count}"
            )
    for function_name, source_label in (
        ("move_edge_has_reachable_bare_binding", "hir"),
        ("plan_expr", "ownership"),
        ("anf_should_materialize", "perceus"),
        ("is_owner_bearing", "perceus"),
        ("droppable_producer_class", "perceus"),
        ("is_droppable_leaf_init", "perceus"),
        ("v_droppable_producer_class", "verify_rc"),
        ("v_droppable_leaf_init", "verify_rc"),
        ("v_expr", "verify_rc"),
    ):
        function_body, extract_error = extract_ring_function_body(
            sources[source_label], function_name)
        if extract_error:
            errors.append(extract_error)
            continue
        count = len(re.findall(
            r"\bis_option_none_ctor_ident\s*\(\s*(?:expr|init)\s*\)",
            mask_ring_strings_and_comments(function_body),
        ))
        if count != 1:
            errors.append(
                f"{function_name} must classify exact Option::none once; "
                f"found {count}"
            )

    identity_sources_body, extract_error = extract_ring_function_body(
        sources["ownership"], "collect_callable_identity_sources")
    if extract_error:
        errors.append(extract_error)
    elif len(re.findall(
            r"if\s*!\s*expr_has_reachable_value\s*\(\s*expr\s*\)\s*"
            r"\{\s*return\s+true\s*\}",
            mask_ring_strings_and_comments(identity_sources_body))) != 1:
        errors.append(
            "callable identity collection must treat non-value paths as neutral")

    direct_identity_body, extract_error = extract_ring_function_body(
        sources["hir"], "hexpr_callable_def_id")
    if extract_error:
        errors.append(extract_error)
    else:
        masked = mask_ring_strings_and_comments(direct_identity_body)
        if len(re.findall(
                r"if\s*!\s*expr_has_reachable_value\s*\(\s*expr\s*\)\s*"
                r"\{\s*return\s+none\s*\}", masked)) != 1:
            errors.append(
                "direct callable identity must reject non-value expressions")
    errors.extend(direct_callable_identity_firebreak_source_errors(
        sources["hir"]))
    errors.extend(exact_variant_ctor_identity_firebreak_source_errors(
        sources["exports"]))

    # Keep the exact firebreak validators adversarial: each mutation preserves
    # plausible Ring syntax while breaking one ownership/identity authority.
    mutation_specs = (
        (
            "Option none droppable producer class",
            "perceus",
            "return DROP_PRODUCER_NOOP_NONE",
            "return DROP_PRODUCER_OPAQUE",
            lambda mutated: droppable_producer_lattice_source_errors(
                mutated, sources["verify_rc"]),
            "Perceus droppable producer classifier",
        ),
        (
            "verifier exact-DefId block lookup",
            "verify_rc",
            "v_block_local_init(stmts, id)",
            "v_block_local_init(stmts, id + 1)",
            lambda mutated: droppable_producer_lattice_source_errors(
                sources["perceus"], mutated),
            "verifier droppable producer classifier",
        ),
        (
            "verifier Let DefId comparison remains borrowed",
            "verify_rc",
            "HStmt::Let { def_id: binding_def_id, init, .. } => {\n"
            "                match binding_def_id {\n"
            "                    some(actual_def_id) => {\n"
            "                        if actual_def_id == def_id {\n"
            "                            let matched_init = init\n"
            "                            found = some(matched_init)\n"
            "                        }\n"
            "                    },\n"
            "                    none => {}\n"
            "                }\n"
            "            },",
            "HStmt::Let { def_id: binding_def_id, init, .. } => {\n"
            "                if binding_def_id == some(def_id) {\n"
            "                    let matched_init = init\n"
            "                    found = some(matched_init)\n"
            "                }\n"
            "            },",
            lambda mutated: droppable_producer_lattice_source_errors(
                sources["perceus"], mutated),
            "verifier exact-DefId block-local producer lookup",
        ),
        (
            "verifier Var DefId comparison remains borrowed",
            "verify_rc",
            "HStmt::Var { def_id: binding_def_id, init, .. } => {\n"
            "                match binding_def_id {\n"
            "                    some(actual_def_id) => {\n"
            "                        if actual_def_id == def_id {\n"
            "                            let matched_init = init\n"
            "                            found = some(matched_init)\n"
            "                        }\n"
            "                    },\n"
            "                    none => {}\n"
            "                }\n"
            "            },",
            "HStmt::Var { def_id: binding_def_id, init, .. } => {\n"
            "                if binding_def_id == some(def_id) {\n"
            "                    let matched_init = init\n"
            "                    found = some(matched_init)\n"
            "                }\n"
            "            },",
            lambda mutated: droppable_producer_lattice_source_errors(
                sources["perceus"], mutated),
            "verifier exact-DefId block-local producer lookup",
        ),
        (
            "synthetic scope original escape",
            "perceus",
            "if escape && gensym.counters.get(1) != some(1)",
            "if tail_escape && gensym.counters.get(1) != some(1)",
            lambda mutated: droppable_producer_lattice_source_errors(
                mutated, sources["verify_rc"]),
            "rc_block_inner synthetic move-out",
        ),
        (
            "trusted prelude set",
            "registration",
            "name == BUILTIN_LIST || name == BUILTIN_MAP ||\n"
            "               name == BUILTIN_SET",
            "name == BUILTIN_LIST || name == BUILTIN_MAP",
            lambda mutated: prelude_ownership_firebreak_source_errors(
                mutated, sources["checker"]),
            "register_prelude_decl_public trusted branch",
        ),
        (
            "reserved-name early return",
            "registration",
            "if reject_reserved_ownership_nominal(ctx, name, span) { return }\n"
            "    preregister_struct_definition_firebreak("
            "\n        ctx, name, type_params, derive_attrs)",
            "if reject_reserved_ownership_nominal(ctx, name, span) {}\n"
            "    preregister_struct_definition_firebreak("
            "\n        ctx, name, type_params, derive_attrs)",
            lambda mutated: prelude_ownership_firebreak_source_errors(
                mutated, sources["checker"]),
            "preregister_struct reserved-name gate",
        ),
        (
            "emitted extern exact DefId",
            "checker",
            "record_emitted_prelude_extern_firebreak(\n"
            "                                                "
            "emitted_prelude_externs, id)",
            "record_emitted_prelude_extern_firebreak(\n"
            "                                                "
            "emitted_prelude_externs, id + 1)",
            lambda mutated: prelude_ownership_firebreak_source_errors(
                sources["registration"], mutated),
            "load_prelude direct ExternFn declaration arm",
        ),
        (
            "guarded HIR exact name",
            "checker",
            "prelude_hdecls, exact_name, abi_name",
            "prelude_hdecls, name, abi_name",
            lambda mutated: prelude_ownership_firebreak_source_errors(
                sources["registration"], mutated),
            "load_prelude direct ExternFn declaration arm",
        ),
        (
            "prelude file-path authority",
            "checker",
            "let file_path = path_join(std_dir, file)",
            "let file_path = path_join(file, file)",
            lambda mutated: prelude_ownership_firebreak_source_errors(
                sources["registration"], mutated),
            "load_prelude direct std-file loop",
        ),
        (
            "prelude parse-source authority",
            "checker",
            "let ast = parse(source, file_path, prelude_sink)",
            "let ast = parse(file_path, file_path, prelude_sink)",
            lambda mutated: prelude_ownership_firebreak_source_errors(
                sources["registration"], mutated),
            "load_prelude direct std-file loop",
        ),
        (
            "prelude registration reachability",
            "checker",
            "register_prelude_decl_public(ctx, registration_decl)",
            "if false {\n"
            "                            register_prelude_decl_public("
            "ctx, registration_decl)\n"
            "                        }",
            lambda mutated: prelude_ownership_firebreak_source_errors(
                sources["registration"], mutated),
            "load_prelude parsed-declaration loop",
        ),
        (
            "direct callable mixed identity",
            "hir",
            "if left == right {",
            "if left != right {",
            direct_callable_identity_firebreak_source_errors,
            "hexpr_callable_def_id IfExpr arm",
        ),
        (
            "direct callable match reachability",
            "hir",
            "if !expr_has_reachable_value(expr) { return none }\n"
            "    match expr {",
            "if !expr_has_reachable_value(expr) { return none }\n"
            "    if true { return none }\n"
            "    match expr {",
            direct_callable_identity_firebreak_source_errors,
            "hexpr_callable_def_id must begin",
        ),
        (
            "variant constructor result identity",
            "exports",
            "exact_variant_ctor_def_id_result_firebreak(def_id)",
            "exact_variant_ctor_def_id_result_firebreak("
            "variant.fields.len())",
            exact_variant_ctor_identity_firebreak_source_errors,
            "exact_variant_ctor_def_id canonical origin proof",
        ),
        (
            "variant constructor resolver shadow",
            "exports",
            "let ctor_params = variant.fields",
            "let exact_variant_ctor_def_id = fn(\n"
            "            env: TypeEnv, def: EnumDef, variant: EnumVariant\n"
            "        ) -> Int? { none }\n"
            "        let ctor_params = variant.fields",
            exact_variant_ctor_identity_firebreak_source_errors,
            "variant_ctor_scheme must not shadow",
        ),
    )
    for label, source_label, old, new, validator, expected_error in mutation_specs:
        count = sources[source_label].count(old)
        if count != 1:
            errors.append(
                f"ownership bootstrap {label} mutation matched {count} "
                "times (expected 1)"
            )
            continue
        mutated = sources[source_label].replace(old, new, 1)
        mutation_errors = validator(mutated)
        if not mutation_errors:
            errors.append(
                f"ownership bootstrap {label} mutation escaped source gate"
            )
        elif not any(expected_error in error for error in mutation_errors):
            errors.append(
                f"ownership bootstrap {label} mutation missed its targeted "
                f"gate {expected_error!r}: {mutation_errors}"
            )

    direct_body, direct_extract_error = extract_ring_function_body(
        sources["hir"], "hexpr_callable_def_id")
    if direct_extract_error:
        errors.append(direct_extract_error)
    else:
        direct_masked = mask_ring_strings_and_comments(direct_body)
        direct_matches = top_level_pattern_matches(
            direct_masked, r"\bmatch\s+expr\s*\{")
        if len(direct_matches) != 1:
            errors.append(
                "ownership bootstrap callable wildcard-first mutation found "
                f"{len(direct_matches)} direct matches (expected 1)"
            )
        else:
            direct_open = direct_matches[0].end() - 1
            try:
                direct_close = matching_delimiter(
                    direct_masked, direct_open, "{", "}")
            except ValueError as exc:
                errors.append(
                    "ownership bootstrap callable wildcard-first mutation: "
                    + str(exc))
            else:
                direct_match_body = direct_body[
                    direct_open + 1:direct_close]
                mutated_match_body, mutation_error = (
                    move_top_level_ring_expression_wildcard_first(
                        direct_match_body, "none")
                )
                if mutation_error:
                    errors.append(
                        "ownership bootstrap callable " + mutation_error)
                elif mutated_match_body is not None:
                    mutated_direct_body = (
                        direct_body[:direct_open + 1]
                        + mutated_match_body
                        + direct_body[direct_close:]
                    )
                    direct_body_count = sources["hir"].count(direct_body)
                    if direct_body_count != 1:
                        errors.append(
                            "ownership bootstrap callable wildcard-first "
                            f"mutation matched {direct_body_count} function "
                            "bodies (expected 1)"
                        )
                    else:
                        mutated_hir = sources["hir"].replace(
                            direct_body, mutated_direct_body, 1)
                        mutation_errors = (
                            direct_callable_identity_firebreak_source_errors(
                                mutated_hir)
                        )
                        expected_error = (
                            "hexpr_callable_def_id match expr wildcard arm "
                            "must remain terminal"
                        )
                        if not mutation_errors:
                            errors.append(
                                "ownership bootstrap callable wildcard-first "
                                "mutation escaped source gate"
                            )
                        elif not any(
                                expected_error in error
                                for error in mutation_errors):
                            errors.append(
                                "ownership bootstrap callable wildcard-first "
                                "mutation missed its terminal-arm gate: "
                                f"{mutation_errors}"
                            )
                binder_match_body = (
                    "\n        shadow_expr => none,\n" + direct_match_body)
                binder_direct_body = (
                    direct_body[:direct_open + 1]
                    + binder_match_body
                    + direct_body[direct_close:]
                )
                direct_body_count = sources["hir"].count(direct_body)
                if direct_body_count != 1:
                    errors.append(
                        "ownership bootstrap callable binder-first mutation "
                        f"matched {direct_body_count} function bodies "
                        "(expected 1)"
                    )
                else:
                    binder_hir = sources["hir"].replace(
                        direct_body, binder_direct_body, 1)
                    mutation_errors = (
                        direct_callable_identity_firebreak_source_errors(
                            binder_hir)
                    )
                    expected_error = (
                        "hexpr_callable_def_id match expr must retain the "
                        "exact direct arm-header inventory and order"
                    )
                    if not mutation_errors:
                        errors.append(
                            "ownership bootstrap callable binder-first "
                            "mutation escaped source gate"
                        )
                    elif not any(
                            expected_error in error
                            for error in mutation_errors):
                        errors.append(
                            "ownership bootstrap callable binder-first "
                            "mutation missed its arm-inventory gate: "
                            f"{mutation_errors}"
                        )

                clone_header_pattern = re.compile(
                    r"HExpr::Clone\s*\{\s*inner\s*,\s*\.\.\s*\}\s*=>")
                or_prefixed_match_body, clone_prefix_count = (
                    clone_header_pattern.subn(
                        lambda match: "inner | " + match.group(0),
                        direct_match_body,
                        count=1,
                    )
                )
                if clone_prefix_count != 1:
                    errors.append(
                        "ownership bootstrap callable OR-prefix mutation "
                        f"matched {clone_prefix_count} Clone arms (expected 1)"
                    )
                else:
                    or_prefixed_direct_body = (
                        direct_body[:direct_open + 1]
                        + or_prefixed_match_body
                        + direct_body[direct_close:]
                    )
                    direct_body_count = sources["hir"].count(direct_body)
                    if direct_body_count != 1:
                        errors.append(
                            "ownership bootstrap callable OR-prefix mutation "
                            f"matched {direct_body_count} function bodies "
                            "(expected 1)"
                        )
                    else:
                        or_prefixed_hir = sources["hir"].replace(
                            direct_body, or_prefixed_direct_body, 1)
                        mutation_errors = (
                            direct_callable_identity_firebreak_source_errors(
                                or_prefixed_hir)
                        )
                        expected_error = (
                            "hexpr_callable_def_id match expr direct Clone arm "
                            "pattern must remain exact"
                        )
                        if not mutation_errors:
                            errors.append(
                                "ownership bootstrap callable OR-prefix "
                                "mutation escaped source gate"
                            )
                        elif not any(
                                expected_error in error
                                for error in mutation_errors):
                            errors.append(
                                "ownership bootstrap callable OR-prefix "
                                "mutation missed its exact-pattern gate: "
                                f"{mutation_errors}"
                            )

    load_body, load_error = extract_ring_function_body(
        sources["checker"], "load_prelude")
    if load_error:
        errors.append(load_error)
    else:
        load_masked = mask_ring_strings_and_comments(load_body)
        extern_headers = list(re.finditer(
            r"Decl::ExternFn\s*\{\s*\.\.\s*\}\s*=>\s*\{",
            load_masked,
        ))
        if len(extern_headers) != 1:
            errors.append(
                "ownership bootstrap checked-ExternFn dead-decoy mutation "
                f"found {len(extern_headers)} source arms (expected 1)"
            )
        else:
            arm_open = extern_headers[0].end() - 1
            try:
                arm_close = matching_delimiter(
                    load_masked, arm_open, "{", "}")
            except ValueError as exc:
                errors.append(
                    "ownership bootstrap checked-ExternFn mutation: "
                    + str(exc))
            else:
                original_arm = load_body[
                    extern_headers[0].start():arm_close + 1]
                dead_decoy_arm = (
                    "Decl::ExternFn { .. } => {\n"
                    "    let result = some(check_prelude_decl(ctx, decl)) "
                    "catch { _ => none }\n"
                    "    match result { some(_) => {}, none => {} }\n"
                    "    if false { match decl {\n"
                    + original_arm
                    + ",\n        _ => {}\n    } }\n}"
                )
                mutated_load = (
                    load_body[:extern_headers[0].start()]
                    + dead_decoy_arm
                    + load_body[arm_close + 1:]
                )
                mutated_checker = sources["checker"].replace(
                    load_body, mutated_load, 1)
                mutation_errors = prelude_ownership_firebreak_source_errors(
                    sources["registration"], mutated_checker)
                expected_error = (
                    "load_prelude direct ExternFn declaration arm")
                if not mutation_errors:
                    errors.append(
                        "ownership bootstrap checked-ExternFn move-to-dead-"
                        "decoy mutation escaped source gate"
                    )
                elif not any(
                        expected_error in error for error in mutation_errors):
                    errors.append(
                        "ownership bootstrap checked-ExternFn move-to-dead-"
                        "decoy mutation missed its direct-arm gate: "
                        f"{mutation_errors}"
                    )

        file_headers = list(re.finditer(
            r"\bfor\s+file\s+in\s*\(\s*STD_FILES\s*\)\s*\{",
            load_masked,
        ))
        phase_headers = list(re.finditer(
            r"\bfor\s+decl\s+in\s+all_prelude_decls\s*\{",
            load_masked,
        ))
        if len(file_headers) != 1 or len(phase_headers) != 2:
            errors.append(
                "ownership bootstrap phase-order mutation authority found "
                f"files={len(file_headers)}, phases={len(phase_headers)} "
                "(expected 1/2)"
            )
        else:
            file_open = file_headers[0].end() - 1
            phase_two_open = phase_headers[1].end() - 1
            try:
                file_close = matching_delimiter(
                    load_masked, file_open, "{", "}")
                phase_two_close = matching_delimiter(
                    load_masked, phase_two_open, "{", "}")
            except ValueError as exc:
                errors.append(
                    "ownership bootstrap phase-order mutation: " + str(exc))
            else:
                file_segment = load_body[
                    file_headers[0].start():file_close + 1]
                reordered_load = (
                    load_body[:file_headers[0].start()]
                    + load_body[file_close + 1:phase_two_close + 1]
                    + "\n            " + file_segment
                    + load_body[phase_two_close + 1:]
                )
                reordered_checker = sources["checker"].replace(
                    load_body, reordered_load, 1)
                mutation_errors = prelude_ownership_firebreak_source_errors(
                    sources["registration"], reordered_checker)
                expected_error = (
                    "load_prelude must retain declared-list -> file "
                    "collection -> phase-one -> emitted-set -> phase-two "
                    "order"
                )
                if not mutation_errors:
                    errors.append(
                        "ownership bootstrap file-loop-after-phase-two "
                        "mutation escaped source gate"
                    )
                elif not any(
                        expected_error in error for error in mutation_errors):
                    errors.append(
                        "ownership bootstrap file-loop-after-phase-two "
                        "mutation missed its order gate: "
                        f"{mutation_errors}"
                    )

                phase_two_body = load_body[
                    phase_two_open + 1:phase_two_close]
                phase_two_masked = mask_ring_strings_and_comments(
                    phase_two_body)
                declaration_matches = top_level_pattern_matches(
                    phase_two_masked, r"\bmatch\s+decl\s*\{")
                if len(declaration_matches) != 1:
                    errors.append(
                        "ownership bootstrap phase-two wildcard-first "
                        f"mutation found {len(declaration_matches)} direct "
                        "matches (expected 1)"
                    )
                else:
                    declaration_open = declaration_matches[0].end() - 1
                    try:
                        declaration_close = matching_delimiter(
                            phase_two_masked, declaration_open, "{", "}")
                    except ValueError as exc:
                        errors.append(
                            "ownership bootstrap phase-two wildcard-first "
                            f"mutation: {exc}")
                    else:
                        declaration_body = phase_two_body[
                            declaration_open + 1:declaration_close]
                        mutated_declaration_body, mutation_error = (
                            move_top_level_ring_empty_wildcard_first(
                                declaration_body)
                        )
                        if mutation_error:
                            errors.append(
                                "ownership bootstrap phase-two "
                                + mutation_error)
                        elif mutated_declaration_body is not None:
                            mutated_phase_two = (
                                phase_two_body[:declaration_open + 1]
                                + mutated_declaration_body
                                + phase_two_body[declaration_close:]
                            )
                            mutated_load = (
                                load_body[:phase_two_open + 1]
                                + mutated_phase_two
                                + load_body[phase_two_close:]
                            )
                            mutated_checker = sources["checker"].replace(
                                load_body, mutated_load, 1)
                            mutation_errors = (
                                prelude_ownership_firebreak_source_errors(
                                    sources["registration"], mutated_checker)
                            )
                            expected_error = (
                                "load_prelude phase-two declaration match "
                                "wildcard arm must remain terminal"
                            )
                            if not mutation_errors:
                                errors.append(
                                    "ownership bootstrap phase-two wildcard-"
                                    "first mutation escaped source gate"
                                )
                            elif not any(
                                    expected_error in error
                                    for error in mutation_errors):
                                errors.append(
                                    "ownership bootstrap phase-two wildcard-"
                                    "first mutation missed its terminal-arm "
                                    f"gate: {mutation_errors}"
                                )
                        binder_declaration_body = (
                            "\n                    shadow_decl => {},\n"
                            + declaration_body
                        )
                        binder_phase_two = (
                            phase_two_body[:declaration_open + 1]
                            + binder_declaration_body
                            + phase_two_body[declaration_close:]
                        )
                        binder_load = (
                            load_body[:phase_two_open + 1]
                            + binder_phase_two
                            + load_body[phase_two_close:]
                        )
                        binder_checker = sources["checker"].replace(
                            load_body, binder_load, 1)
                        mutation_errors = (
                            prelude_ownership_firebreak_source_errors(
                                sources["registration"], binder_checker)
                        )
                        expected_error = (
                            "load_prelude phase-two declaration match must "
                            "retain the exact direct arm-header inventory "
                            "and order"
                        )
                        if not mutation_errors:
                            errors.append(
                                "ownership bootstrap phase-two binder-first "
                                "mutation escaped source gate"
                            )
                        elif not any(
                                expected_error in error
                                for error in mutation_errors):
                            errors.append(
                                "ownership bootstrap phase-two binder-first "
                                "mutation missed its arm-inventory gate: "
                                f"{mutation_errors}"
                            )

                        struct_header_pattern = re.compile(
                            r"Decl::Struct\s*\{\s*\.\.\s*\}\s*=>")
                        or_prefixed_declaration_body, struct_prefix_count = (
                            struct_header_pattern.subn(
                                lambda match: "_ | " + match.group(0),
                                declaration_body,
                                count=1,
                            )
                        )
                        if struct_prefix_count != 1:
                            errors.append(
                                "ownership bootstrap phase-two OR-prefix "
                                f"mutation matched {struct_prefix_count} "
                                "Struct arms (expected 1)"
                            )
                        else:
                            or_prefixed_phase_two = (
                                phase_two_body[:declaration_open + 1]
                                + or_prefixed_declaration_body
                                + phase_two_body[declaration_close:]
                            )
                            or_prefixed_load = (
                                load_body[:phase_two_open + 1]
                                + or_prefixed_phase_two
                                + load_body[phase_two_close:]
                            )
                            or_prefixed_checker = sources["checker"].replace(
                                load_body, or_prefixed_load, 1)
                            mutation_errors = (
                                prelude_ownership_firebreak_source_errors(
                                    sources["registration"],
                                    or_prefixed_checker,
                                )
                            )
                            expected_error = (
                                "load_prelude phase-two declaration match "
                                "direct Struct arm pattern must remain exact"
                            )
                            if not mutation_errors:
                                errors.append(
                                    "ownership bootstrap phase-two OR-prefix "
                                    "mutation escaped source gate"
                                )
                            elif not any(
                                    expected_error in error
                                    for error in mutation_errors):
                                errors.append(
                                    "ownership bootstrap phase-two OR-prefix "
                                    "mutation missed its exact-pattern gate: "
                                    f"{mutation_errors}"
                                )

                phase_one_open = phase_headers[0].end() - 1
                try:
                    phase_one_close = matching_delimiter(
                        load_masked, phase_one_open, "{", "}")
                except ValueError as exc:
                    errors.append(
                        "ownership bootstrap phase-one mutation: " + str(exc))
                else:
                    empty_phase_one = (
                        load_body[:phase_one_open + 1]
                        + "\n            "
                        + load_body[phase_one_close:]
                    )
                    empty_checker = sources["checker"].replace(
                        load_body, empty_phase_one, 1)
                    mutation_errors = (
                        prelude_ownership_firebreak_source_errors(
                            sources["registration"], empty_checker)
                    )
                    expected_error = (
                        "load_prelude phase-one loop must retain the exact "
                        "extern identity"
                    )
                    if not mutation_errors:
                        errors.append(
                            "ownership bootstrap empty phase-one mutation "
                            "escaped source gate"
                        )
                    elif not any(
                            expected_error in error
                            for error in mutation_errors):
                        errors.append(
                            "ownership bootstrap empty phase-one mutation "
                            "missed its exact-body gate: "
                            f"{mutation_errors}"
                        )

                    shadowed_phase_one = (
                        load_body[:phase_headers[0].start()]
                        + "let all_prelude_decls: List<Decl> = []\n            "
                        + load_body[phase_headers[0].start():]
                    )
                    shadowed_checker = sources["checker"].replace(
                        load_body, shadowed_phase_one, 1)
                    mutation_errors = (
                        prelude_ownership_firebreak_source_errors(
                            sources["registration"], shadowed_checker)
                    )
                    expected_error = (
                        "load_prelude must retain exactly one authoritative "
                        "all_prelude_decls binding"
                    )
                    if not mutation_errors:
                        errors.append(
                            "ownership bootstrap all_prelude_decls shadow "
                            "mutation escaped source gate"
                        )
                    elif not any(
                            expected_error in error
                            for error in mutation_errors):
                        errors.append(
                            "ownership bootstrap all_prelude_decls shadow "
                            "mutation missed its binding gate: "
                            f"{mutation_errors}"
                        )

                    reset_before_phase_two = (
                        load_body[:phase_headers[1].start()]
                        + "all_prelude_decls = []\n            "
                        + load_body[phase_headers[1].start():]
                    )
                    reset_checker = sources["checker"].replace(
                        load_body, reset_before_phase_two, 1)
                    mutation_errors = (
                        prelude_ownership_firebreak_source_errors(
                            sources["registration"], reset_checker)
                    )
                    expected_error = (
                        "load_prelude phase skeleton must not contain extra "
                        "statements"
                    )
                    if not mutation_errors:
                        errors.append(
                            "ownership bootstrap pre-phase-two list reset "
                            "mutation escaped source gate"
                        )
                    elif not any(
                            expected_error in error
                            for error in mutation_errors):
                        errors.append(
                            "ownership bootstrap pre-phase-two list reset "
                            "mutation missed its phase-skeleton gate: "
                            f"{mutation_errors}"
                        )

                    shadowed_phase_two_decl = (
                        load_body[:phase_two_open + 1]
                        + "\n                let decl = decl"
                        + load_body[phase_two_open + 1:]
                    )
                    shadowed_checker = sources["checker"].replace(
                        load_body, shadowed_phase_two_decl, 1)
                    mutation_errors = (
                        prelude_ownership_firebreak_source_errors(
                            sources["registration"], shadowed_checker)
                    )
                    expected_error = (
                        "load_prelude phase-two loop must contain only its "
                        "direct authoritative match decl expression"
                    )
                    if not mutation_errors:
                        errors.append(
                            "ownership bootstrap phase-two decl shadow "
                            "mutation escaped source gate"
                        )
                    elif not any(
                            expected_error in error
                            for error in mutation_errors):
                        errors.append(
                            "ownership bootstrap phase-two decl shadow "
                            "mutation missed its direct-match gate: "
                            f"{mutation_errors}"
                        )

                    panic_after_phase_two = (
                        load_body[:phase_two_close + 1]
                        + "\n            panic(\"phase-two suffix probe\")"
                        + load_body[phase_two_close + 1:]
                    )
                    panic_checker = sources["checker"].replace(
                        load_body, panic_after_phase_two, 1)
                    mutation_errors = (
                        prelude_ownership_firebreak_source_errors(
                            sources["registration"], panic_checker)
                    )
                    expected_error = (
                        "load_prelude phase skeleton must not contain extra "
                        "statements"
                    )
                    if not mutation_errors:
                        errors.append(
                            "ownership bootstrap post-phase-two panic "
                            "mutation escaped source gate"
                        )
                    elif not any(
                            expected_error in error
                            for error in mutation_errors):
                        errors.append(
                            "ownership bootstrap post-phase-two panic "
                            "mutation missed its phase-skeleton gate: "
                            f"{mutation_errors}"
                        )

    ctor_scheme_body, extract_error = extract_ring_function_body(
        sources["exports"], "variant_ctor_scheme")
    if extract_error:
        errors.append(extract_error)
    else:
        ctor_scheme_masked = mask_ring_strings_and_comments(ctor_scheme_body)
        count = len(re.findall(
            r"\bdef_id\s*:\s*exact_variant_ctor_def_id\s*"
            r"\(\s*env\s*,\s*def\s*,\s*variant\s*\)",
            ctor_scheme_masked,
        ))
        if count != 1:
            errors.append(
                "variant_ctor_scheme must retain exactly one canonical "
                f"constructor DefId; found {count}"
            )
        if re.search(
                r"\b(?:let|var|fn)\s+(?:mut\s+)?"
                r"exact_variant_ctor_def_id\b",
                ctor_scheme_masked):
            errors.append(
                "variant_ctor_scheme must not shadow the canonical exact "
                "variant-constructor identity resolver"
            )
        scheme_expressions = top_level_pattern_matches(
            ctor_scheme_masked, r"\bTypeScheme\s*\{")
        if len(scheme_expressions) != 1:
            errors.append(
                "ownership bootstrap ctor pattern-shadow mutation found "
                f"{len(scheme_expressions)} direct TypeScheme expressions "
                "(expected 1)"
            )
        else:
            scheme_open = scheme_expressions[0].end() - 1
            try:
                scheme_close = matching_delimiter(
                    ctor_scheme_masked, scheme_open, "{", "}")
            except ValueError as exc:
                errors.append(
                    "ownership bootstrap ctor pattern-shadow mutation: "
                    + str(exc))
            else:
                original_scheme = ctor_scheme_body[
                    scheme_expressions[0].start():scheme_close + 1]
                wrapped_scheme = (
                    "match some(fn(\n"
                    "        env: TypeEnv, def: EnumDef, "
                    "variant: EnumVariant\n"
                    "    ) -> Int? { none }) {\n"
                    "        some(exact_variant_ctor_def_id) => "
                    + original_scheme
                    + ",\n        none => panic(\"\")\n    }"
                )
                mutated_ctor_body = (
                    ctor_scheme_body[:scheme_expressions[0].start()]
                    + wrapped_scheme
                    + ctor_scheme_body[scheme_close + 1:]
                )
                ctor_body_count = sources["exports"].count(ctor_scheme_body)
                if ctor_body_count != 1:
                    errors.append(
                        "ownership bootstrap ctor pattern-shadow mutation "
                        f"matched {ctor_body_count} function bodies "
                        "(expected 1)"
                    )
                else:
                    mutated_exports = sources["exports"].replace(
                        ctor_scheme_body, mutated_ctor_body, 1)
                    mutation_errors = (
                        exact_variant_ctor_identity_firebreak_source_errors(
                            mutated_exports)
                    )
                    expected_error = (
                        "variant_ctor_scheme canonical constructor identity")
                    if not mutation_errors:
                        errors.append(
                            "ownership bootstrap ctor pattern-shadow mutation "
                            "escaped source gate"
                        )
                    elif not any(
                            expected_error in error
                            for error in mutation_errors):
                        errors.append(
                            "ownership bootstrap ctor pattern-shadow mutation "
                            "missed its exact-function gate: "
                            f"{mutation_errors}"
                        )

    import_alias_body, extract_error = extract_ring_function_body(
        sources["infer_ctx"], "localize_exact_import_alias_scheme")
    if extract_error:
        errors.append(extract_error)
    else:
        masked = mask_ring_strings_and_comments(import_alias_body)
        alias_contracts = (
            (
                "source-state lookup",
                r"\bcallable_state_by_def_id\.get\s*"
                r"\(\s*source_def_id\s*\)",
            ),
            (
                "checker-local callable allocation",
                r"\bnew_local_callable_identity_scheme\s*"
                r"\(\s*ctx\.env\s*,\s*alias_scheme\s*,\s*"
                r"ownership_term\s*,\s*source\s*\)",
            ),
        )
        for description, pattern in alias_contracts:
            count = len(re.findall(pattern, masked))
            if count != 1:
                errors.append(
                    "localize_exact_import_alias_scheme "
                    f"{description} matched {count} times (expected 1)"
                )

    project_value_body, extract_error = extract_ring_function_body(
        sources["infer_ctx"], "apply_project_value_binding")
    if extract_error:
        errors.append(extract_error)
    else:
        masked = mask_ring_strings_and_comments(project_value_body)
        count = len(re.findall(
            r"\blocalize_exact_import_alias_scheme\s*"
            r"\(\s*ctx\s*,\s*source_scheme\s*\)",
            masked,
        ))
        if count != 1:
            errors.append(
                "apply_project_value_binding must localize callable metadata "
                f"exactly once; found {count}"
            )
        if re.search(
                r"set_current_scope_value\s*\([^;{}]*TypeScheme\s*\{",
                masked):
            errors.append(
                "apply_project_value_binding must not install a raw TypeScheme"
            )

    initial_mode_body, extract_error = extract_ring_function_body(
        sources["ownership"], "initial_solver_param_mode")
    if extract_error:
        errors.append(extract_error)
    else:
        masked = mask_ring_strings_and_comments(initial_mode_body)
        mode_contracts = (
            (
                "authoritative Drop owner",
                r"\bhparam_is_external_drop_owner\s*\(\s*param\s*\)"
                r"\s*\{\s*return\s+PARAM_OWNERSHIP_MOVE\b",
            ),
            (
                "mutable receiver",
                r"\bhparam_is_mutable\s*\(\s*param\s*\)\s*\{\s*"
                r"PARAM_OWNERSHIP_MUT_BORROW\b",
            ),
        )
        for description, pattern in mode_contracts:
            count = len(re.findall(pattern, masked))
            if count != 1:
                errors.append(
                    f"initial_solver_param_mode {description} matched "
                    f"{count} times (expected 1)"
                )
    state_body, extract_error = extract_ring_function_body(
        sources["ownership"], "new_callable_solve_state")
    if extract_error:
        errors.append(extract_error)
    else:
        count = len(re.findall(
            r"\bmodes\.push\s*\(\s*initial_solver_param_mode\s*"
            r"\(\s*param\s*\)\s*\)",
            mask_ring_strings_and_comments(state_body),
        ))
        if count != 1:
            errors.append(
                "new_callable_solve_state must consume the exact initial "
                f"parameter mode once; found {count}"
            )

    plan_body, extract_error = extract_ring_function_body(
        sources["ownership"], "plan_stmt")
    if extract_error:
        errors.append(extract_error)
    else:
        masked = mask_ring_strings_and_comments(plan_body)
        arm_match = re.search(
            r"HStmt::ForIn\s*\{\s*binding\b(?P<body>.*?)"
            r"HStmt::Break\s*\{",
            masked,
            re.DOTALL,
        )
        if arm_match is None:
            errors.append("plan_stmt Range HStmt::ForIn arm not found")
        else:
            arm = arm_match.group("body")
            owned = len(re.findall(
                r"\bregister_slot\s*\(\s*body_plan\s*,\s*id\s*,"
                r"\s*false\s*,\s*none\s*\)",
                arm,
            ))
            borrowed = len(re.findall(
                r"\bregister_slot\s*\(\s*body_plan\s*,\s*id\s*,"
                r"\s*true\s*,\s*none\s*\)",
                arm,
            ))
            if owned != 2 or borrowed != 0:
                errors.append(
                    "plan_stmt Range bindings must be fresh owned values for "
                    "both direct and recovery bindings; found "
                    f"owned={owned}, borrowed={borrowed}"
                )

    set_transfer_contracts = (
        ("set_from", "item", 0),
        ("union", "item", 0),
        ("intersect", "owned_item", 1),
        ("difference", "owned_item", 1),
        ("filter", "kept", 1),
    )
    for function_name, owned_name, expected_borrows in set_transfer_contracts:
        function_body, extract_error = extract_ring_function_body(
            sources["set"], function_name)
        if extract_error:
            errors.append(extract_error)
            continue
        masked = mask_ring_strings_and_comments(function_body)
        slot_reads = len(re.findall(
            rf"\blet\s+{owned_name}\s*=\s*ring_slot_read\s*"
            r"\(\s*items\.buf\s*,\s*i\s*\)",
            masked,
        ))
        inserts = len(re.findall(
            rf"\bresult\.insert\s*\(\s*{owned_name}\s*\)", masked))
        borrowed_projections = len(re.findall(
            r"\bitems\.get\s*\(\s*i\s*\)", masked))
        if (slot_reads != 1 or inserts != 1 or
                borrowed_projections != expected_borrows):
            errors.append(
                f"{function_name} must transfer exactly one fresh slot value "
                "while retaining only predicate projection borrows; found "
                f"slot_reads={slot_reads}, inserts={inserts}, "
                f"items.get={borrowed_projections} "
                f"(expected {expected_borrows})"
            )

    iter_body, extract_error = extract_ring_function_body(
        sources["list"], "iter")
    if extract_error:
        errors.append(extract_error)
    else:
        masked = mask_ring_strings_and_comments(iter_body)
        clones = len(re.findall(
            r"\blist\s*:\s*list_clone\s*\(\s*self\s*\)", masked))
        direct = len(re.findall(r"\blist\s*:\s*self\b", masked))
        if clones != 1 or direct != 0:
            errors.append(
                "List Iterable.iter must preserve its borrow contract with one "
                f"owned wrapper clone; found clones={clones}, direct={direct}"
            )

    map_source = mask_ring_strings_and_comments(sources["map"])
    map_signature = len(re.findall(
        r"\bfn\s+map_from\s*<\s*K\s*:\s*Hash\s*\+\s*Eq\s*\+\s*"
        r"Clone\s*,\s*V\s*:\s*Clone\s*>\s*\(",
        map_source,
    ))
    map_body, extract_error = extract_ring_function_body(
        sources["map"], "map_from")
    if extract_error:
        errors.append(extract_error)
    else:
        masked = mask_ring_strings_and_comments(map_body)
        map_contracts = (
            r"\blet\s+pair\s*=\s*ring_slot_read\s*"
            r"\(\s*entries\.buf\s*,\s*i\s*\)",
            r"\bm\.insert\s*\(\s*pair\.0\.clone\s*\(\s*\)\s*,"
            r"\s*pair\.1\.clone\s*\(\s*\)\s*\)",
        )
        counts = [len(re.findall(pattern, masked))
                  for pattern in map_contracts]
        if map_signature != 1 or counts != [1, 1]:
            errors.append(
                "map_from must clone both borrowed tuple projections from one "
                "fresh slot value; found "
                f"signature={map_signature}, contracts={counts}"
            )

    result_source = mask_ring_strings_and_comments(sources["result"])
    result_signatures = (
        r"\bpub\s+impl\s*<\s*T\s*,\s*E\s*:\s*Clone\s*>\s*Result\b",
        r"\bpub\s+impl\s*<\s*T\s*:\s*Clone\s*,\s*E\s*>\s*Result\b",
        r"\bpub\s+impl\s*<\s*T\s*,\s*E\s*>\s*Result\b",
        r"\bfn\s+to_result\s*<\s*T\s*,\s*E\s*:\s*Clone\s*>\s*"
        r"\(\s*f\s*:\s*fn\s*\(\s*\)\s*->\s*T\s*with\s*"
        r"\{\s*fail\s*<\s*E\s*>\s*\}\s*\)",
    )
    signature_counts = [len(re.findall(pattern, result_source))
                        for pattern in result_signatures]
    if signature_counts != [1, 1, 1, 1]:
        errors.append(
            "Result ownership/effect signature inventory changed; found "
            f"{signature_counts}"
        )
    result_body_contracts = (
        ("map", "e", "v"),
        ("and_then", "e", "v"),
        ("unwrap_or", "v", "e"),
        ("to_result", "e", "v"),
    )
    for function_name, cloned_name, forbidden_name in result_body_contracts:
        function_body, extract_error = extract_ring_function_body(
            sources["result"], function_name)
        if extract_error:
            errors.append(extract_error)
            continue
        masked = mask_ring_strings_and_comments(function_body)
        clones = len(re.findall(
            rf"\b{cloned_name}\.clone\s*\(\s*\)", masked))
        forbidden = len(re.findall(
            rf"\b{forbidden_name}\.clone\s*\(\s*\)", masked))
        if clones != 1 or forbidden != 0:
            errors.append(
                f"Result.{function_name} clone inventory is not minimal: "
                f"required={clones}, forbidden={forbidden}"
            )
    return errors


def callable_inference_limit_generated_c_errors(c_source: str) -> List[str]:
    """Reject bootstrap codegen that wraps the positive limit negative."""
    masked = mask_c_strings_and_comments(c_source)
    pattern = re.compile(
        r"void\s*\*\s*[A-Za-z_][A-Za-z0-9_]*"
        r"CALLABLE__INFERENCE__TERM__LIMIT\s*\(\s*void\s*\)\s*\{\s*"
        r"return\s+RING_INT\s*\(\s*(-?[0-9]+)\s*\)\s*;\s*\}",
        re.DOTALL,
    )
    values = pattern.findall(masked)
    expected = str(CALLABLE_INFERENCE_TERM_LIMIT)
    if values != [expected]:
        return [
            "generated callable inference limit must be one positive "
            f"RING_INT({expected}) definition; found {values}"
        ]
    return []


def callable_nominal_walk_generated_c_errors(c_source: str) -> List[str]:
    """Reject the old-anchor parameter/Cell layout mismatch in generated C."""
    symbol = (
        "ringmod_ring__unify_m_m__"
        "type__reaches__callable__through__nominals"
    )
    body, extract_error = extract_c_function_body(c_source, symbol)
    if extract_error:
        return [extract_error]
    masked = mask_c_strings_and_comments(body)
    if re.search(
        r"\*\s*\(\s*void\s*\*\s*\*\s*\)\s*r_nominal_visited\b",
        masked,
    ):
        return [
            "generated nominal callable walk reads its Set parameter as a "
            "closure Cell slot"
        ]
    return []


def callable_contract_merge_generated_c_errors(c_source: str) -> List[str]:
    """Require both generated NoBase cases to retain their tuple tag guards."""
    symbol = (
        "ringmod_ring__ownership_m_m__"
        "merge__callable__contract__resolution"
    )
    body, extract_error = extract_c_function_body(c_source, symbol)
    if extract_error:
        return [extract_error]
    masked = mask_c_strings_and_comments(body)
    calls = list(re.finditer(
        r"CallableContractResolution__NoBase\s*\(\s*\)", masked))
    guards = list(re.finditer(
        r"if\s*\(\s*\*\s*\(\s*int64_t\s*\*\s*\)\s*"
        r"[A-Za-z_][A-Za-z0-9_]*\s*!=\s*2\s*\)\s*goto\b",
        masked,
    ))
    if len(calls) != 2:
        return [
            "generated callable contract merge must construct NoBase in two "
            f"separate guarded arms; found {len(calls)} constructors"
        ]
    if len(guards) < 2:
        return [
            "generated callable contract merge lost one or both NoBase "
            f"tuple tag guards; found {len(guards)} guards"
        ]
    if not (guards[0].start() < calls[0].start() <
            guards[1].start() < calls[1].start()):
        return [
            "generated callable contract merge emitted an unconditional or "
            "misordered NoBase arm"
        ]
    return []


def run_callable_inference_boundary_probes(
    ring_exe: str, clang_path: str, temp_root: Path,
) -> List[Tuple[str, Optional[str]]]:
    """Execute the last valid term and the exclusive fail-loud boundary."""
    source_dir = temp_root / "callable-limit-source"
    source_dir.mkdir()
    try:
        shutil.copy2(REPO / "compiler" / "types.ring", source_dir / "types.ring")
    except OSError as exc:
        return [("setup", f"cannot stage compiler/types.ring: {exc}")]

    probes = (
        (
            "limit - 1 succeeds",
            "callable_limit_success.ring",
            """use types::{CALLABLE_INFERENCE_TERM_LIMIT,
    fresh_callable_ownership_inference_term, new_ownership_metadata}

fn main() {
    let mut metadata = new_ownership_metadata()
    metadata.next_callable_inference_term =
        CALLABLE_INFERENCE_TERM_LIMIT - 1
    let term = fresh_callable_ownership_inference_term(metadata)
    if metadata.next_callable_inference_term !=
       CALLABLE_INFERENCE_TERM_LIMIT {
        panic(\"callable inference limit advanced incorrectly\")
    }
    print(term)
}
""",
            False,
        ),
        (
            "limit fails loudly",
            "callable_limit_failure.ring",
            """use types::{CALLABLE_INFERENCE_TERM_LIMIT,
    fresh_callable_ownership_inference_term, new_ownership_metadata}

fn main() {
    let mut metadata = new_ownership_metadata()
    metadata.next_callable_inference_term = CALLABLE_INFERENCE_TERM_LIMIT
    let term = fresh_callable_ownership_inference_term(metadata)
    print(term)
}
""",
            True,
        ),
    )
    results: List[Tuple[str, Optional[str]]] = []
    for label, filename, source, expect_panic in probes:
        ring_file = source_dir / filename
        ring_file.write_text(source, encoding="utf-8", newline="\n")
        out_dir = temp_root / f"{ring_file.stem}-out"
        out_dir.mkdir()
        try:
            build = ring_build(
                ring_exe, str(ring_file), out_dir=str(out_dir),
                extra_args=["--no-c-lines"],
            )
        except subprocess.TimeoutExpired:
            results.append((label, "compile timed out"))
            continue
        if build.returncode != 0:
            results.append((
                label,
                "compile failed: " + process_output(build)[:500],
            ))
            continue

        object_path = out_dir / f"{ring_file.stem}.o"
        executable = out_dir / f"{ring_file.stem}.exe"
        if not object_path.is_file():
            results.append((label, f"missing object: {object_path}"))
            continue
        try:
            linked = clang_link(
                clang_path, str(object_path), str(executable))
        except subprocess.TimeoutExpired:
            results.append((label, "link timed out"))
            continue
        if linked.returncode != 0:
            results.append((
                label,
                "link failed: " + process_output(linked)[:500],
            ))
            continue
        try:
            executed = run_exe(str(executable))
        except subprocess.TimeoutExpired:
            results.append((label, "execution timed out"))
            continue

        output = process_output(executed)
        if expect_panic:
            if executed.returncode == 0:
                results.append((label, "expected non-zero panic exit"))
            elif "callable ownership inference namespace exhausted" not in output:
                results.append((
                    label,
                    "wrong panic at exclusive limit: " + output[:300],
                ))
            else:
                results.append((label, None))
        else:
            expected_output = str(CALLABLE_INFERENCE_TERM_LIMIT - 1)
            if executed.returncode != 0:
                results.append((
                    label,
                    f"runtime exit {executed.returncode}: {output[:300]}",
                ))
            elif norm(executed.stdout or "").strip() != expected_output:
                results.append((
                    label,
                    f"expected {expected_output}, got "
                    f"{norm(executed.stdout or '').strip()!r}",
                ))
            else:
                results.append((label, None))
    return results


# ---------------------------------------------------------------------------
# Self-compile suite
# ---------------------------------------------------------------------------

def run_self_compile(ring_exe: str, clang_path: str,
                     collector: ResultCollector, *,
                     name_filter: Optional[str] = None) -> None:
    """Regenerate the tracked C anchor and require an exact fixed point."""
    suite = "self-compile"
    # Coarse-grained: the whole suite is one unit; filter matches the suite name.
    if not matches_filter(suite, name_filter):
        return
    compiler_main = REPO / "compiler" / "main.ring"
    if not compiler_main.is_file():
        collector.add(TestResult(TestResult.FAIL, suite, "source",
                                 "compiler/main.ring not found"))
        return
    if not DIST_C_MAIN.is_file():
        collector.add(TestResult(TestResult.FAIL, suite, "anchor",
                                 "tracked compiler/dist-c/main.c not found"))
        return

    with tempfile.TemporaryDirectory(prefix="ring_selfcompile_") as tmpdir:
        duplicate_errors, conflict_errors = (
            direct_drop_duplicate_source_oracles())
        collector.add(TestResult(
            TestResult.PASS if not duplicate_errors else TestResult.FAIL,
            suite,
            "direct Drop duplicate: exact declaration is idempotent",
            "; ".join(duplicate_errors),
        ))
        collector.add(TestResult(
            TestResult.PASS if not conflict_errors else TestResult.FAIL,
            suite,
            "direct Drop duplicate: same C name conflict fails loudly",
            "; ".join(conflict_errors),
        ))
        if duplicate_errors or conflict_errors:
            return

        source_errors = callable_inference_limit_source_errors()
        source_errors.extend(callable_nominal_walk_source_errors())
        source_errors.extend(callable_contract_merge_source_errors())
        source_errors.extend(ownership_bootstrap_transition_source_errors())
        collector.add(TestResult(
            TestResult.PASS if not source_errors else TestResult.FAIL,
            suite,
            "callable inference limit source",
            "; ".join(source_errors),
        ))
        if source_errors:
            return

        for label, failure in run_callable_inference_boundary_probes(
            ring_exe, clang_path, Path(tmpdir)):
            collector.add(TestResult(
                TestResult.PASS if failure is None else TestResult.FAIL,
                suite,
                f"callable inference boundary: {label}",
                failure or "",
            ))
            if failure is not None:
                return

        try:
            r = ring_build(
                ring_exe,
                str(compiler_main),
                out_dir=tmpdir,
                extra_args=["--no-c-lines"],
                timeout=TIMEOUT_SELFCOMPILE,
                phase_suite=suite,
                phase_case="regenerate",
            )
        except subprocess.TimeoutExpired:
            collector.add(TestResult(
                TestResult.FAIL, suite, "regenerate",
                f"timed out ({TIMEOUT_SELFCOMPILE}s)"))
            return

        if r.returncode != 0:
            combined = (r.stdout or "") + (r.stderr or "")
            collector.add(TestResult(
                TestResult.FAIL, suite, "regenerate",
                f"exit {r.returncode}: {combined[:500]}"))
            return

        generated_c = Path(tmpdir) / "main.c"
        generated_o = Path(tmpdir) / "main.o"
        if not generated_c.is_file():
            collector.add(TestResult(
                TestResult.FAIL, suite, "generated C", "main.c not produced"))
            return
        if not generated_o.is_file():
            collector.add(TestResult(
                TestResult.FAIL, suite, "generated object", "main.o not produced"))
            return
        collector.add(TestResult(
            TestResult.PASS, suite, "generated object",
            "main.o produced by the tracked C-native compiler"))

        try:
            generated_source = generated_c.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            collector.add(TestResult(
                TestResult.FAIL, suite, "callable inference limit generated C",
                f"cannot read generated main.c: {exc}"))
            return
        generated_limit_errors = callable_inference_limit_generated_c_errors(
            generated_source)
        generated_limit_errors.extend(
            callable_nominal_walk_generated_c_errors(generated_source))
        generated_limit_errors.extend(
            callable_contract_merge_generated_c_errors(generated_source))
        collector.add(TestResult(
            TestResult.PASS if not generated_limit_errors else TestResult.FAIL,
            suite,
            "callable inference limit generated C",
            "; ".join(generated_limit_errors),
        ))
        if generated_limit_errors:
            return

        anchor_bytes = DIST_C_MAIN.read_bytes()
        generated_bytes = generated_c.read_bytes()
        anchor_hash = hashlib.sha256(anchor_bytes).hexdigest()
        generated_hash = hashlib.sha256(generated_bytes).hexdigest()
        if anchor_bytes != generated_bytes:
            collector.add(TestResult(
                TestResult.FAIL, suite, "tracked anchor fixed point",
                f"dist-c/main.c sha256={anchor_hash}, regenerated sha256={generated_hash}"))
            return
        collector.add(TestResult(
            TestResult.PASS, suite, "tracked anchor fixed point",
            f"byte-identical sha256={anchor_hash}"))


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

def print_summary(collector: ResultCollector) -> None:
    """Print the final summary block."""
    print()
    print("=== Summary ===")
    summary = collector.summary()

    for suite_name in [
        "e2e", "golden", "rc", "self-compile", "structural", "parity",
        "runner",
    ]:
        if suite_name not in summary:
            continue
        s = summary[suite_name]
        parts = [f"{s['pass']} pass", f"{s['fail']} fail"]
        if s.get("skip", 0) > 0:
            parts.append(f"{s['skip']} skip")
        print(f"  {suite_name}: {', '.join(parts)}")

    total_fail = collector.failures
    if total_fail > 0:
        print(f"\nExit code: 1 ({total_fail} failure{'s' if total_fail != 1 else ''})")
    else:
        total_pass = sum(1 for r in collector.results if r.status == TestResult.PASS)
        print(f"\nExit code: 0 (all {total_pass} tests passed)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def _run_selected(args: argparse.Namespace) -> int:
    suites = args.suites or [
        "e2e", "golden", "rc", "self-compile", "structural", "parity",
    ]

    # --- Tool discovery ---
    needs_ring = any(
        suite in suites
        for suite in ["e2e", "golden", "rc", "self-compile", "structural"]
    )
    needs_clang = needs_ring
    clang_path = find_clang() if needs_clang else None
    ring_exe = find_ring_exe() if needs_ring else None

    if needs_ring and ring_exe is None:
        print("ERROR: ring.exe not found.", file=sys.stderr)
        print("  Expected tracked compiler/dist-c/main.c and a working C toolchain.",
              file=sys.stderr)
        return 1

    if needs_clang and clang_path is None:
        print("ERROR: clang not found (required for executable/codegen suites).",
              file=sys.stderr)
        return 1

    # Ensure runtime .o is built
    pure_check_only_e2e = pure_positive_check_only_e2e_selection(
        suites, args.name_filter)
    needs_runtime = any(
        suite in suites for suite in ["e2e", "golden", "self-compile"]
    ) and not pure_check_only_e2e
    if needs_runtime and clang_path:
        if not ensure_runtime(clang_path):
            print("ERROR: failed to build ring_runtime.o from ring_runtime.cpp.", file=sys.stderr)
            return 1

    if ring_exe:
        print(f"ring.exe: {ring_exe}")
    if clang_path:
        print(f"clang:    {clang_path}")
    print(f"suites:   {', '.join(suites)}")
    if args.name_filter:
        print(f"filter:   {args.name_filter}")
    print()

    collector = ResultCollector()

    if "e2e" in suites:
        _run_timed_suite("e2e", lambda: run_e2e(
            ring_exe, clang_path or "", collector,
            name_filter=args.name_filter,
        ))

    if "golden" in suites:
        _run_timed_suite("golden", lambda: run_golden(
            ring_exe, clang_path or "", collector,
            update_golden=args.update_golden,
            name_filter=args.name_filter,
        ))

    if "rc" in suites:
        _run_timed_suite("rc", lambda: run_rc(
            ring_exe, collector, name_filter=args.name_filter,
        ))

    if "self-compile" in suites:
        _run_timed_suite("self-compile", lambda: run_self_compile(
            ring_exe, clang_path or "", collector,
            name_filter=args.name_filter,
        ))

    if "structural" in suites:
        _run_timed_suite("structural", lambda: run_structural(
            ring_exe, collector, name_filter=args.name_filter,
        ))

    if "parity" in suites:
        _run_timed_suite("parity", lambda: run_parity(
            collector, name_filter=args.name_filter,
        ))

    if args.name_filter and not collector.results:
        collector.add(TestResult(
            TestResult.FAIL, "runner", "filter",
            f"no selected suite matched {args.name_filter!r}"))

    print_summary(collector)
    return 1 if collector.failures > 0 else 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Ring-lang Python test runner (B-151 P2)")
    parser.add_argument(
        "--suite",
        choices=[
            "e2e", "golden", "rc", "self-compile", "structural", "parity",
        ],
        action="append", dest="suites",
        help="Test suite(s) to run. Omit for all C-native suites.")
    parser.add_argument(
        "--filter", dest="name_filter", metavar="SUBSTR", default=None,
        help="Only run cases whose name contains SUBSTR (case-insensitive, "
             "applies to all suites).")
    parser.add_argument(
        "--update-golden", action="store_true",
        help="Regenerate .expected golden snapshots instead of comparing.")
    parser.add_argument(
        "--phase-timing", type=_phase_timing_path, metavar="ABSOLUTE_JSONL",
        default=None,
        help="Write opt-in monotonic phase timings as JSONL to an absolute path.")
    args = parser.parse_args()

    if args.phase_timing is None:
        return _run_selected(args)

    try:
        tracer = PhaseTimingTrace(args.phase_timing)
    except OSError as exc:
        parser.error(f"cannot open --phase-timing output: {exc}")

    global _PHASE_TRACER
    _PHASE_TRACER = tracer
    try:
        try:
            exit_code = _run_selected(args)
        except BaseException as exc:
            outcome = "exception"
            trace_exit_code: Optional[int] = None
            if isinstance(exc, subprocess.TimeoutExpired):
                outcome = "timeout"
            elif isinstance(exc, subprocess.CalledProcessError):
                outcome = "nonzero"
                trace_exit_code = exc.returncode
            elif isinstance(exc, KeyboardInterrupt):
                outcome = "interrupted"
            try:
                tracer.finish(
                    complete=False, outcome=outcome,
                    exit_code=trace_exit_code,
                )
            except Exception:
                # Preserve the original runner failure if trace finalization also
                # fails; successfully emitted records have already been flushed.
                pass
            try:
                tracer.close()
            except Exception:
                pass
            raise

        try:
            tracer.finish(
                complete=True,
                outcome="success" if exit_code == 0 else "failure",
                exit_code=exit_code,
            )
        finally:
            tracer.close()
        return exit_code
    finally:
        _PHASE_TRACER = None


if __name__ == "__main__":
    sys.exit(main())
