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
import atexit
import hashlib
import json
import os
import platform
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import threading
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
COMPILER_ARTIFACT_CACHE = (
    Path(tempfile.gettempdir()) / "ring-lang-compiler-anchor-cache-v3"
)
COMPILER_CACHE_ENV = "RING_TEST_COMPILER_CACHE"
IDENTITY_CANDIDATE_ENV = "RING_IDENTITY_CANDIDATE_EXE"
COMPILER_CACHE_SCHEMA = "ring.test-runner-compiler-anchor-cache.v3"
COMPILER_CACHE_VERSION = 3
COMPILER_CACHE_POISON_SCHEMA = "ring.test-runner-compiler-anchor-poison.v1"
COMPILER_CACHE_POISON_VERSION = 1
COMPILER_CACHE_MAX_ENTRIES = 16
COMPILER_CACHE_MAX_BYTES = 4 * 1024 * 1024 * 1024
COMPILER_CACHE_STALE_SECONDS = 24 * 60 * 60
COMPILER_CACHE_MAX_CONFLICTS = 32
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
    exempt_min: int = 0
    exempt_counts: Tuple[Tuple[str, int], ...] = ()
    finding_counts: Tuple[Tuple[str, int], ...] = ()
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
STRUCTURAL_ORACLE_FIXTURES = {
    "backend.c_line_directives": tuple(
        fixture
        for _, _, fixtures in C_LINE_BUILD_CASES
        for fixture in fixtures
    ),
    "backend.extern_handle_rc_structural": (EXTERN_RC_FIXTURE,),
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


@dataclass(frozen=True)
class _CompilerBuildPlan:
    anchor_source: Path
    runtime_source: Path
    clang: str
    runtime_compiler: str
    runtime_frontend_flags: Tuple[str, ...]
    linker: str
    exe_name: str
    compile_flags: Tuple[str, ...]
    test_link_flags: Tuple[str, ...]
    compiler_link_flags: Tuple[str, ...]
    controlled: bool
    cache_supported: bool
    target: Optional[str]
    driver_flags: Tuple[str, ...]
    linker_pin_flags: Tuple[str, ...]
    environment: Tuple[Tuple[str, str], ...]


class CompilerPreparationError(RuntimeError):
    """The tracked compiler could not be prepared without weakening trust."""


@dataclass(frozen=True)
class _CachedAnchor:
    path: Path
    sha256: str
    size: int
    mode: int


_CONTROLLED_ENV_NAMES = (
    "SystemRoot",
    "WINDIR",
    "TEMP",
    "TMP",
    "INCLUDE",
    "LIB",
    "LIBPATH",
    "CPATH",
    "C_INCLUDE_PATH",
    "CPLUS_INCLUDE_PATH",
    "OBJC_INCLUDE_PATH",
    "LIBRARY_PATH",
    "COMPILER_PATH",
    "GCC_EXEC_PREFIX",
    "SDKROOT",
    "MACOSX_DEPLOYMENT_TARGET",
    "VCINSTALLDIR",
    "VCToolsInstallDir",
    "VCToolsVersion",
    "VSINSTALLDIR",
    "VisualStudioVersion",
    "WindowsSdkDir",
    "WindowsSDKVersion",
    "UniversalCRTSdkDir",
    "UCRTVersion",
)
_CACHE_THREAD_LOCKS: Dict[str, threading.RLock] = {}
_CACHE_THREAD_LOCKS_GUARD = threading.Lock()


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while True:
            chunk = stream.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def _stable_file_identity(path: Path, *, include_mode: bool = False) -> Dict[str, Any]:
    resolved = path.resolve(strict=True)
    before = resolved.stat()
    if not stat.S_ISREG(before.st_mode):
        raise CompilerPreparationError(f"cache input is not a regular file: {resolved}")
    digest = _sha256_file(resolved)
    after = resolved.stat()
    if (
        before.st_size != after.st_size
        or before.st_mtime_ns != after.st_mtime_ns
    ):
        raise CompilerPreparationError(f"cache input changed while hashing: {resolved}")
    record: Dict[str, Any] = {
        "path": os.path.normcase(str(resolved)),
        "size": after.st_size,
        "sha256": digest,
    }
    if include_mode:
        record["mode"] = stat.S_IMODE(after.st_mode)
    return record


def _resolved_executable(executable: str) -> Optional[str]:
    candidate = shutil.which(executable)
    if candidate is None:
        path = Path(executable)
        if not path.is_file():
            return None
        candidate = str(path)
    try:
        return str(Path(candidate).resolve(strict=True))
    except OSError:
        return None


def _find_lld_linker(clang: str) -> Optional[str]:
    if sys.platform == "win32":
        names = ("lld-link.exe", "lld-link")
    elif sys.platform == "darwin":
        names = ("ld64.lld", "ld.lld", "lld")
    else:
        names = ("ld.lld", "lld")

    try:
        clang_dir = Path(clang).resolve(strict=True).parent
    except OSError:
        clang_dir = Path(clang).parent
    for name in names:
        sibling = clang_dir / name
        if sibling.is_file():
            return str(sibling.resolve())
    for name in names:
        resolved = _resolved_executable(name)
        if resolved is not None:
            return resolved
    return None


def _environment_value(name: str) -> Optional[str]:
    folded = name.casefold()
    for key, value in os.environ.items():
        if key.casefold() == folded:
            return value
    return None


def _controlled_environment(*tools: str) -> Tuple[Tuple[str, str], ...]:
    environment: Dict[str, str] = {}
    for name in _CONTROLLED_ENV_NAMES:
        value = _environment_value(name)
        if value is not None:
            environment[name] = value

    path_dirs: List[str] = []
    for tool in tools:
        directory = str(Path(tool).resolve(strict=True).parent)
        if os.path.normcase(directory) not in {
            os.path.normcase(existing) for existing in path_dirs
        }:
            path_dirs.append(directory)
    system_root = environment.get("SystemRoot") or environment.get("WINDIR")
    if system_root:
        system32 = str(Path(system_root) / "System32")
        if os.path.normcase(system32) not in {
            os.path.normcase(existing) for existing in path_dirs
        }:
            path_dirs.append(system32)
    environment["PATH"] = os.pathsep.join(path_dirs)
    environment["LC_ALL"] = "C"
    environment["LANG"] = "C"
    environment["SOURCE_DATE_EPOCH"] = "0"
    return tuple(sorted(environment.items(), key=lambda item: item[0].casefold()))


def _plan_environment(plan: _CompilerBuildPlan) -> Optional[Dict[str, str]]:
    if not plan.controlled:
        return None
    return dict(plan.environment)


def _probe_controlled_target(
    compiler: str,
    environment: Tuple[Tuple[str, str], ...],
) -> Optional[str]:
    try:
        result = subprocess.run(
            [compiler, "--no-default-config", "-dumpmachine"],
            check=True,
            capture_output=True,
            text=True,
            timeout=10,
            cwd=str(REPO),
            env=dict(environment),
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError):
        return None
    target = result.stdout.strip()
    if not target or re.fullmatch(r"[A-Za-z0-9_.+-]+", target) is None:
        return None
    return target


def _system_include_probe_source(path: Path) -> str:
    """Return preprocessor directives while preserving conditional includes."""

    try:
        source = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return ""
    directives: List[str] = []
    continuing = False
    for line in source.splitlines():
        stripped = line.lstrip()
        if continuing or stripped.startswith("#"):
            directives.append(line)
            continuing = line.rstrip().endswith("\\")
        else:
            # Preserve line boundaries so a directive cannot be joined to an
            # adjacent token, but omit ordinary declarations and definitions.
            directives.append("")
    probe = "\n".join(directives) + ("\n" if source.endswith(("\n", "\r")) else "")
    if re.search(r"(?m)^\s*#\s*include\s*<", probe) is None:
        return ""
    return probe


def _probe_controlled_system_headers(
    compiler: str,
    driver_flags: Tuple[str, ...],
    environment: Tuple[Tuple[str, str], ...],
    source_path: Path,
    language: str,
    standard: str,
    extra_flags: Tuple[str, ...] = (),
) -> bool:
    """Prove the candidate controlled driver can resolve actual system headers."""

    probe_source = _system_include_probe_source(source_path)
    if not probe_source:
        return False
    command = [
        compiler,
        *driver_flags,
        *extra_flags,
        f"-std={standard}",
        *COMPILER_COMPILE_FLAGS,
        "-iquote",
        str(source_path.parent.resolve()),
        "-E",
        "-x",
        language,
        "-",
    ]
    try:
        result = subprocess.run(
            command,
            input=probe_source,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            timeout=TIMEOUT_COMPILE,
            cwd=str(REPO),
            env=dict(environment),
        )
    except (subprocess.TimeoutExpired, OSError):
        return False
    return result.returncode == 0


def _compiler_build_plan() -> Optional[_CompilerBuildPlan]:
    if not DIST_C_MAIN.is_file() or not RUNTIME_CPP.is_file():
        return None
    clang_discovered = find_clang()
    if clang_discovered is None:
        return None
    clang = _resolved_executable(clang_discovered)
    if clang is None:
        return None

    cpp_discovered = shutil.which("clang++")
    cpp_compiler = (
        _resolved_executable(cpp_discovered)
        if cpp_discovered is not None else None
    )
    if cpp_compiler is None:
        runtime_compiler = clang
        runtime_frontend_flags = ("-x", "c++")
    else:
        runtime_compiler = cpp_compiler
        runtime_frontend_flags = ()

    linker = _find_lld_linker(clang)
    controlled = False
    cache_supported = False
    target: Optional[str] = None
    driver_flags: Tuple[str, ...] = ()
    linker_pin_flags: Tuple[str, ...] = ()
    environment: Tuple[Tuple[str, str], ...] = ()
    if sys.platform == "win32" and linker is not None:
        environment = _controlled_environment(
            clang, runtime_compiler, linker,
        )
        clang_target = _probe_controlled_target(clang, environment)
        runtime_target = _probe_controlled_target(runtime_compiler, environment)
        if clang_target is not None and clang_target == runtime_target:
            candidate_driver_flags = (
                "--no-default-config",
                f"--target={clang_target}",
            )
            c_headers = _probe_controlled_system_headers(
                clang,
                candidate_driver_flags,
                environment,
                DIST_C_MAIN,
                "c",
                "c11",
            )
            cxx_headers = _probe_controlled_system_headers(
                runtime_compiler,
                candidate_driver_flags,
                environment,
                RUNTIME_CPP,
                "c++",
                "c++17",
                runtime_frontend_flags + ("-D_CRT_SECURE_NO_WARNINGS",),
            )
            if c_headers and cxx_headers:
                controlled = True
                cache_supported = True
                target = clang_target
                driver_flags = candidate_driver_flags
                linker_pin_flags = (f"-B{Path(linker).resolve().parent}",)
    return _CompilerBuildPlan(
        anchor_source=DIST_C_MAIN,
        runtime_source=RUNTIME_CPP,
        clang=clang,
        runtime_compiler=runtime_compiler,
        runtime_frontend_flags=runtime_frontend_flags,
        # The ordinary path preserves clang's own -fuse-ld=lld discovery.
        # Only the controlled Windows cache path requires an explicit linker.
        linker=linker or "",
        exe_name="ring.exe" if sys.platform == "win32" else "ring",
        compile_flags=tuple(COMPILER_COMPILE_FLAGS),
        test_link_flags=tuple(CLANG_LINK_FLAGS),
        compiler_link_flags=tuple(COMPILER_LINK_FLAGS),
        controlled=controlled,
        cache_supported=cache_supported,
        target=target,
        driver_flags=driver_flags,
        linker_pin_flags=linker_pin_flags,
        environment=environment,
    )


def _tool_identity(executable: str) -> Dict[str, Any]:
    return _stable_file_identity(Path(executable))


def _anchor_driver_arguments(
    plan: _CompilerBuildPlan,
    anchor_source: Path,
) -> List[str]:
    arguments = [
        *plan.driver_flags,
        "-std=c11",
        *plan.compile_flags,
    ]
    if plan.controlled:
        tracked_anchor_dir = plan.anchor_source.parent.resolve()
        arguments.extend([
            "-iquote", str(tracked_anchor_dir),
            f"-ffile-prefix-map={anchor_source.parent}={tracked_anchor_dir}",
        ])
    return arguments


def _compiler_commands(
    plan: _CompilerBuildPlan,
    build_dir: Path,
    anchor_source: Path,
) -> Tuple[List[str], List[str], List[str], Path, Path]:
    object_path = build_dir / "main.o"
    runtime_object_path = build_dir / "runtime.o"
    exe_path = build_dir / plan.exe_name
    anchor_cmd = [
        plan.clang,
        *_anchor_driver_arguments(plan, anchor_source),
        "-c", str(anchor_source), "-o", str(object_path),
    ]
    runtime_cmd = [
        plan.runtime_compiler,
        *plan.driver_flags,
        *plan.runtime_frontend_flags,
        "-std=c++17", *plan.compile_flags,
        "-D_CRT_SECURE_NO_WARNINGS", "-c", str(plan.runtime_source),
        "-o", str(runtime_object_path),
    ]
    link_cmd = [
        plan.clang,
        *plan.driver_flags,
        *plan.linker_pin_flags,
        str(object_path), str(runtime_object_path), "-o", str(exe_path),
        *plan.test_link_flags, *plan.compiler_link_flags,
    ]
    return anchor_cmd, runtime_cmd, link_cmd, exe_path, object_path


def _canonical_compiler_recipes(plan: _CompilerBuildPlan) -> Dict[str, List[str]]:
    tracked_anchor_dir = str(plan.anchor_source.parent.resolve())
    anchor_prefix_map = (
        f"-ffile-prefix-map=$anchor_snapshot_dir={tracked_anchor_dir}"
    )
    anchor_arguments: List[str] = [
        "$clang", *plan.driver_flags, "-std=c11", *plan.compile_flags,
    ]
    if plan.controlled:
        anchor_arguments.extend([
            "-iquote", tracked_anchor_dir,
            anchor_prefix_map,
        ])
    return {
        "anchor_dependency_scan": [
            *anchor_arguments,
            "-E", "-dM", "-MD",
            "-MT", "ring-cache-probe", "-MF", "$depfile",
            "$tracked_anchor_snapshot",
        ],
        "anchor_compile": [
            *anchor_arguments,
            "-c", "$tracked_anchor_snapshot", "-o", "$anchor_object",
        ],
        "runtime_compile": [
            "$runtime_compiler", *plan.driver_flags,
            *plan.runtime_frontend_flags,
            "-std=c++17", *plan.compile_flags,
            "-D_CRT_SECURE_NO_WARNINGS", "-c", "$runtime",
            "-o", "$runtime_object",
        ],
        "link": [
            "$clang", *plan.driver_flags, *plan.linker_pin_flags,
            "$anchor_object", "$runtime_object", "-o", "$compiler_executable",
            *plan.test_link_flags, *plan.compiler_link_flags,
        ],
    }


def _parse_make_dependencies(text: str) -> List[str]:
    flattened = re.sub(r"\\\r?\n", " ", text)
    prefix = "ring-cache-probe:"
    if not flattened.startswith(prefix):
        raise CompilerPreparationError(
            "compiler dependency output has an unexpected target"
        )
    body = flattened[len(prefix):]
    tokens: List[str] = []
    current: List[str] = []
    index = 0
    while index < len(body):
        char = body[index]
        if char.isspace():
            if current:
                tokens.append("".join(current).replace("$$", "$"))
                current = []
            index += 1
            continue
        if char == "\\" and index + 1 < len(body):
            following = body[index + 1]
            if following.isspace() or following == "#":
                current.append(following)
                index += 2
                continue
        current.append(char)
        index += 1
    if current:
        tokens.append("".join(current).replace("$$", "$"))
    if not tokens:
        raise CompilerPreparationError("compiler dependency closure is empty")
    return tokens


def _scan_anchor_dependencies(
    plan: _CompilerBuildPlan,
    anchor_snapshot: Path,
    probe_dir: Path,
) -> Tuple[Tuple[Dict[str, Any], ...], str]:
    descriptor, depfile_name = tempfile.mkstemp(
        prefix="anchor-", suffix=".d", dir=str(probe_dir),
    )
    os.close(descriptor)
    depfile = Path(depfile_name)
    try:
        command = [
            plan.clang,
            *_anchor_driver_arguments(plan, anchor_snapshot),
            "-E", "-dM", "-MD",
            "-MT", "ring-cache-probe", "-MF", str(depfile),
            str(anchor_snapshot),
        ]
        result = _run_subprocess(
            "compiler_anchor_dependency_scan", command,
            check=True,
            capture_output=True,
            timeout=TIMEOUT_COMPILE,
            cwd=str(REPO),
            env=_plan_environment(plan),
        )
        try:
            dependency_text = depfile.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            raise CompilerPreparationError(
                f"cannot read compiler dependency closure: {exc}"
            ) from exc
    finally:
        depfile.unlink(missing_ok=True)

    snapshot_resolved = anchor_snapshot.resolve(strict=True)
    dependencies: Dict[str, Dict[str, Any]] = {}
    for token in _parse_make_dependencies(dependency_text):
        candidate = Path(token)
        if not candidate.is_absolute():
            candidate = REPO / candidate
        try:
            resolved = candidate.resolve(strict=True)
        except OSError as exc:
            raise CompilerPreparationError(
                f"compiler dependency cannot be resolved: {token!r}"
            ) from exc
        if resolved == snapshot_resolved:
            continue
        record = _stable_file_identity(resolved)
        dependencies[record["path"]] = record
    closure = tuple(dependencies[path] for path in sorted(dependencies))
    preprocessor_state = hashlib.sha256(result.stdout).hexdigest()
    return closure, preprocessor_state


def _compiler_cache_inputs(
    plan: _CompilerBuildPlan,
    anchor_snapshot: Path,
    probe_dir: Path,
) -> Dict[str, Any]:
    if not plan.cache_supported or not plan.controlled:
        raise CompilerPreparationError(
            "compiler anchor cache requires a controlled Windows recipe"
        )
    dependencies, preprocessor_state = _scan_anchor_dependencies(
        plan, anchor_snapshot, probe_dir,
    )
    anchor_identity = _stable_file_identity(anchor_snapshot)
    anchor_identity["path"] = "$tracked_c_anchor"
    return {
        "schema": COMPILER_CACHE_SCHEMA,
        "version": COMPILER_CACHE_VERSION,
        "anchor": anchor_identity,
        "dependency_closure": list(dependencies),
        "preprocessor_state_sha256": preprocessor_state,
        "recipes": _canonical_compiler_recipes(plan),
        "tools": {
            "clang": _tool_identity(plan.clang),
            "runtime_compiler": _tool_identity(plan.runtime_compiler),
            "linker": _tool_identity(plan.linker),
        },
        "target": plan.target,
        "working_directory": os.path.normcase(str(REPO.resolve())),
        "platform": {
            "sys_platform": sys.platform,
            "os_name": os.name,
            "system": platform.system(),
            "release": platform.release(),
            "machine": platform.machine(),
        },
        "environment": dict(plan.environment),
    }


def _compiler_cache_key(inputs: Dict[str, Any]) -> str:
    encoded = json.dumps(
        inputs, sort_keys=True, separators=(",", ":"), allow_nan=False,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _compiler_cache_enabled() -> bool:
    value = os.environ.get(COMPILER_CACHE_ENV, "1")
    return value.strip().casefold() not in {"0", "false", "no", "off"}


def _stage_anchor_snapshot(
    plan: _CompilerBuildPlan,
    staging_dir: Path,
) -> Path:
    source_dir = staging_dir / "inputs"
    source_dir.mkdir()
    staged_anchor = source_dir / "main.c"
    before = _stable_file_identity(plan.anchor_source)
    shutil.copy2(plan.anchor_source, staged_anchor)
    staged = _stable_file_identity(staged_anchor)
    after = _stable_file_identity(plan.anchor_source)
    for field in ("size", "sha256"):
        if before[field] != staged[field] or before[field] != after[field]:
            raise CompilerPreparationError(
                "tracked C anchor changed while taking the cache snapshot"
            )
    return staged_anchor


def _compile_anchor(
    plan: _CompilerBuildPlan,
    build_dir: Path,
    anchor_source: Path,
) -> Path:
    anchor_cmd, _, _, _, object_path = _compiler_commands(
        plan, build_dir, anchor_source,
    )
    THINLTO_CACHE.mkdir(parents=True, exist_ok=True)
    _run_subprocess(
        "compiler_anchor_compile", anchor_cmd,
        check=True, capture_output=True, timeout=TIMEOUT_SELFCOMPILE,
        cwd=str(REPO), env=_plan_environment(plan),
    )
    if not object_path.is_file():
        raise CompilerPreparationError(
            "anchor compilation succeeded without producing main.o"
        )
    return object_path


def _compile_runtime_and_link(
    plan: _CompilerBuildPlan,
    build_dir: Path,
    anchor_source: Path,
) -> Path:
    _, runtime_cmd, link_cmd, exe_path, _ = _compiler_commands(
        plan, build_dir, anchor_source,
    )
    _run_subprocess(
        "compiler_runtime_compile", runtime_cmd,
        check=True, capture_output=True, timeout=TIMEOUT_COMPILE,
        cwd=str(REPO), env=_plan_environment(plan),
    )
    # A cache hit skips _compile_anchor(), which normally creates this shared
    # LLD ThinLTO cache directory before the fresh link.
    THINLTO_CACHE.mkdir(parents=True, exist_ok=True)
    _run_subprocess(
        "compiler_link", link_cmd,
        check=True, capture_output=True, timeout=TIMEOUT_COMPILER_LINK,
        cwd=str(REPO), env=_plan_environment(plan),
    )
    if not exe_path.is_file():
        raise CompilerPreparationError(
            "compiler link succeeded without producing the executable"
        )
    return exe_path


def _cache_paths(cache_root: Path, key: str) -> Tuple[Path, Path]:
    return cache_root / "receipts" / f"{key}.json", cache_root / "artifacts"


def _cache_poison_path(cache_root: Path, key: str) -> Path:
    return cache_root / "poisoned" / f"{key}.json"


def _cache_thread_lock(path: Path) -> threading.RLock:
    key = os.path.normcase(str(path.resolve()))
    with _CACHE_THREAD_LOCKS_GUARD:
        lock = _CACHE_THREAD_LOCKS.get(key)
        if lock is None:
            lock = threading.RLock()
            _CACHE_THREAD_LOCKS[key] = lock
        return lock


class _CacheFileLock:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._stream: Any = None
        self._thread_lock = _cache_thread_lock(path)

    def __enter__(self) -> "_CacheFileLock":
        self._thread_lock.acquire()
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self._stream = self.path.open("a+b")
            self._stream.seek(0, os.SEEK_END)
            if self._stream.tell() == 0:
                self._stream.write(b"\0")
                self._stream.flush()
            self._stream.seek(0)
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(self._stream.fileno(), msvcrt.LK_LOCK, 1)
            else:
                import fcntl
                fcntl.flock(self._stream.fileno(), fcntl.LOCK_EX)
            return self
        except BaseException:
            if self._stream is not None:
                self._stream.close()
                self._stream = None
            self._thread_lock.release()
            raise

    def __exit__(self, exc_type, exc, traceback) -> None:
        try:
            if os.name == "nt":
                import msvcrt
                self._stream.seek(0)
                msvcrt.locking(self._stream.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl
                fcntl.flock(self._stream.fileno(), fcntl.LOCK_UN)
        finally:
            self._stream.close()
            self._stream = None
            self._thread_lock.release()


def _cache_global_lock(cache_root: Path) -> _CacheFileLock:
    return _CacheFileLock(cache_root / "locks" / "global.lock")


def _cache_key_lock(cache_root: Path, key: str) -> _CacheFileLock:
    # A fixed stripe preserves same-key exclusion without allowing an
    # unbounded lock-file/thread-lock registry as cache keys turn over.
    return _CacheFileLock(cache_root / "locks" / "keys" / f"{key[:2]}.lock")


def _artifact_mode(path: Path) -> int:
    return stat.S_IMODE(path.stat().st_mode)


def _validated_cached_anchor(
    cache_root: Path,
    key: str,
    inputs: Dict[str, Any],
) -> Optional[_CachedAnchor]:
    receipt_path, artifacts_dir = _cache_paths(cache_root, key)
    try:
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
        if set(receipt) != {
            "schema", "version", "key", "inputs", "artifact",
            "artifact_sha256", "artifact_size", "artifact_mode",
        }:
            return None
        if (
            receipt["schema"] != COMPILER_CACHE_SCHEMA
            or receipt["version"] != COMPILER_CACHE_VERSION
            or receipt["key"] != key
            or receipt["inputs"] != inputs
            or _compiler_cache_key(receipt["inputs"]) != key
        ):
            return None
        artifact_hash = receipt["artifact_sha256"]
        artifact_size = receipt["artifact_size"]
        artifact_mode = receipt["artifact_mode"]
        if (
            not isinstance(artifact_hash, str)
            or re.fullmatch(r"[0-9a-f]{64}", artifact_hash) is None
            or not isinstance(artifact_size, int)
            or isinstance(artifact_size, bool)
            or artifact_size < 0
            or not isinstance(artifact_mode, int)
            or isinstance(artifact_mode, bool)
            or artifact_mode < 0
        ):
            return None
        artifact_name = f"{artifact_hash}.o"
        if receipt["artifact"] != artifact_name:
            return None
        artifact_path = artifacts_dir / artifact_name
        if artifact_path.stat().st_size != artifact_size:
            return None
        if _sha256_file(artifact_path) != artifact_hash:
            return None
        if _artifact_mode(artifact_path) != artifact_mode:
            return None
        return _CachedAnchor(
            artifact_path, artifact_hash, artifact_size, artifact_mode,
        )
    except (OSError, ValueError, TypeError, KeyError):
        return None


def _write_json_temp(parent: Path, prefix: str, value: Dict[str, Any]) -> Path:
    parent.mkdir(parents=True, exist_ok=True)
    descriptor, temp_name = tempfile.mkstemp(
        prefix=prefix, suffix=".tmp", dir=str(parent),
    )
    temp_path = Path(temp_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as stream:
            json.dump(
                value, stream, sort_keys=True,
                separators=(",", ":"), allow_nan=False,
            )
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        return temp_path
    except BaseException:
        temp_path.unlink(missing_ok=True)
        raise


def _hardlink_once(source: Path, destination: Path) -> bool:
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.link(source, destination)
        return True
    except FileExistsError:
        return False
    except OSError as exc:
        raise CompilerPreparationError(
            f"compiler cache requires atomic hard-link publication: {exc}"
        ) from exc


def _create_json_once(path: Path, value: Dict[str, Any]) -> bool:
    temp_path = _write_json_temp(path.parent, f".{path.stem}-", value)
    try:
        return _hardlink_once(temp_path, path)
    finally:
        temp_path.unlink(missing_ok=True)


def _touch_cache_access(cache_root: Path, key: str) -> None:
    access = cache_root / "access" / key
    access.parent.mkdir(parents=True, exist_ok=True)
    access.touch(exist_ok=True)


def _record_cache_conflict_locked(
    cache_root: Path,
    key: str,
    winner: _CachedAnchor,
    candidate: _CachedAnchor,
) -> Path:
    evidence_dir = cache_root / "conflicts" / key
    evidence_path = evidence_dir / (
        f"{time.time_ns()}-{os.getpid()}-{threading.get_ident()}.json"
    )
    evidence = {
        "schema": COMPILER_CACHE_SCHEMA,
        "version": COMPILER_CACHE_VERSION,
        "key": key,
        "winner": {
            "sha256": winner.sha256,
            "size": winner.size,
            "mode": winner.mode,
        },
        "candidate": {
            "sha256": candidate.sha256,
            "size": candidate.size,
            "mode": candidate.mode,
        },
    }
    if not _create_json_once(evidence_path, evidence):
        raise CompilerPreparationError(
            f"compiler cache conflict evidence already exists: {evidence_path}"
        )
    _prune_cache_conflicts_locked(cache_root)
    return evidence_path


def _poison_cache_key_locked(
    cache_root: Path,
    key: str,
    winner: _CachedAnchor,
    candidate: _CachedAnchor,
) -> Path:
    poison_path = _cache_poison_path(cache_root, key)
    receipt_path, _ = _cache_paths(cache_root, key)
    poison_path.parent.mkdir(parents=True, exist_ok=True)
    marker = {
        "schema": COMPILER_CACHE_POISON_SCHEMA,
        "version": COMPILER_CACHE_POISON_VERSION,
        "key": key,
        "reason": "same_key_divergent_anchor_objects",
        "winner": {
            "sha256": winner.sha256,
            "size": winner.size,
            "mode": winner.mode,
        },
        "candidate": {
            "sha256": candidate.sha256,
            "size": candidate.size,
            "mode": candidate.mode,
        },
    }
    try:
        # The existing receipt is already durable and immutable.  Rename it as
        # the poison commit point before writing best-effort conflict details.
        # Thus a later diagnostic fsync/hard-link failure cannot turn a proven
        # same-key divergence back into a normal cache miss.
        os.replace(receipt_path, poison_path)
    except OSError as exc:
        try:
            if _create_json_once(poison_path, marker) or poison_path.is_file():
                return poison_path
        except BaseException:
            # Last independent persistence path: destroy the valid receipt in
            # place and replace it with a poison record that lookup and cleanup
            # both understand.  Opening with "w" truncates before any later
            # write/fsync error, so it cannot remain a valid cache hit.
            try:
                with receipt_path.open("w", encoding="utf-8", newline="\n") as stream:
                    json.dump(
                        marker, stream, sort_keys=True,
                        separators=(",", ":"), allow_nan=False,
                    )
                    stream.write("\n")
                    stream.flush()
                    os.fsync(stream.fileno())
                return receipt_path
            except BaseException as fallback_exc:
                raise CompilerPreparationError(
                    "cannot durably poison divergent compiler cache key: "
                    f"rename={exc}; fallback={fallback_exc}"
                ) from fallback_exc
    return poison_path


def _is_cache_poison_record(value: Any, key: str) -> bool:
    return (
        isinstance(value, dict)
        and set(value) == {
            "schema", "version", "key", "reason",
            "winner", "candidate",
        }
        and value.get("schema") == COMPILER_CACHE_POISON_SCHEMA
        and value.get("version") == COMPILER_CACHE_POISON_VERSION
        and value.get("key") == key
        and value.get("reason") == "same_key_divergent_anchor_objects"
        and _is_cache_poison_identity(value.get("winner"))
        and _is_cache_poison_identity(value.get("candidate"))
        and value["winner"] != value["candidate"]
    )


def _is_cache_poison_identity(value: Any) -> bool:
    return (
        isinstance(value, dict)
        and set(value) == {"sha256", "size", "mode"}
        and isinstance(value.get("sha256"), str)
        and re.fullmatch(r"[0-9a-f]{64}", value["sha256"]) is not None
        and isinstance(value.get("size"), int)
        and not isinstance(value["size"], bool)
        and value["size"] >= 0
        and isinstance(value.get("mode"), int)
        and not isinstance(value["mode"], bool)
        and value["mode"] >= 0
    )


def _reject_poisoned_cache_key_locked(cache_root: Path, key: str) -> None:
    poison_path = _cache_poison_path(cache_root, key)
    receipt_path, _ = _cache_paths(cache_root, key)
    poisoned_in_place = False
    if receipt_path.is_file():
        try:
            poisoned_in_place = _is_cache_poison_record(
                json.loads(receipt_path.read_text(encoding="utf-8")), key,
            )
        except (OSError, ValueError, TypeError):
            pass
    if poison_path.exists() or poisoned_in_place:
        evidence_path = poison_path if poison_path.exists() else receipt_path
        raise CompilerPreparationError(
            "compiler anchor cache key is poisoned by a prior divergent build; "
            f"disable {COMPILER_CACHE_ENV} or purge the cache entry to recover: "
            f"{evidence_path}"
        )


def _same_cached_anchor(left: _CachedAnchor, right: _CachedAnchor) -> bool:
    return (
        left.sha256 == right.sha256
        and left.size == right.size
        and left.mode == right.mode
    )


def _remove_path(path: Path) -> None:
    if path.is_dir():
        shutil.rmtree(path)
    else:
        path.unlink(missing_ok=True)


def _cleanup_compiler_cache_locked(
    cache_root: Path,
    *,
    now: Optional[float] = None,
    protected_keys: Tuple[str, ...] = (),
) -> None:
    current_time = time.time() if now is None else now
    stale_before = current_time - COMPILER_CACHE_STALE_SECONDS
    for path in cache_root.glob(".staging-*"):
        if path.stat().st_mtime < stale_before:
            _remove_path(path)
    for directory_name in ("receipts", "artifacts", "poisoned"):
        directory = cache_root / directory_name
        if directory.is_dir():
            for path in directory.glob(".*.tmp"):
                if path.stat().st_mtime < stale_before:
                    _remove_path(path)
    conflict_root = cache_root / "conflicts"
    if conflict_root.is_dir():
        for path in conflict_root.glob("*/.*.tmp"):
            if path.stat().st_mtime < stale_before:
                _remove_path(path)

    receipt_dir = cache_root / "receipts"
    artifacts_dir = cache_root / "artifacts"
    entries: List[Dict[str, Any]] = []
    if receipt_dir.is_dir():
        for receipt_path in receipt_dir.glob("*.json"):
            key = receipt_path.stem
            access_path = cache_root / "access" / key
            artifact_name: Optional[str] = None
            artifact_size: Optional[int] = None
            try:
                receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
                if _is_cache_poison_record(receipt, key):
                    last_used = (
                        access_path.stat().st_mtime
                        if access_path.is_file() else receipt_path.stat().st_mtime
                    )
                    entries.append({
                        "key": key,
                        "receipt": receipt_path,
                        "access": access_path,
                        "artifact": None,
                        "size": 0,
                        "last_used": last_used,
                    })
                    continue
                if set(receipt) != {
                    "schema", "version", "key", "inputs", "artifact",
                    "artifact_sha256", "artifact_size", "artifact_mode",
                }:
                    raise ValueError("unexpected compiler cache receipt fields")
                artifact_hash = receipt["artifact_sha256"]
                claimed_size = receipt["artifact_size"]
                artifact_mode = receipt["artifact_mode"]
                if (
                    re.fullmatch(r"[0-9a-f]{64}", key) is None
                    or receipt["schema"] != COMPILER_CACHE_SCHEMA
                    or receipt["version"] != COMPILER_CACHE_VERSION
                    or receipt["key"] != key
                    or _compiler_cache_key(receipt["inputs"]) != key
                    or not isinstance(artifact_hash, str)
                    or re.fullmatch(r"[0-9a-f]{64}", artifact_hash) is None
                    or receipt["artifact"] != f"{artifact_hash}.o"
                    or not isinstance(claimed_size, int)
                    or isinstance(claimed_size, bool)
                    or claimed_size < 0
                    or not isinstance(artifact_mode, int)
                    or isinstance(artifact_mode, bool)
                    or artifact_mode < 0
                ):
                    raise ValueError("invalid compiler cache receipt identity")
                artifact_name = receipt["artifact"]
                artifact_path = artifacts_dir / artifact_name
                artifact_stat = artifact_path.stat()
                if (
                    not stat.S_ISREG(artifact_stat.st_mode)
                    or artifact_stat.st_size != claimed_size
                    or stat.S_IMODE(artifact_stat.st_mode) != artifact_mode
                ):
                    raise ValueError("compiler cache artifact metadata mismatch")
                # Capacity accounting trusts the filesystem, never receipt data.
                artifact_size = artifact_stat.st_size
            except (OSError, ValueError, TypeError, KeyError):
                receipt_path.unlink(missing_ok=True)
                access_path.unlink(missing_ok=True)
                continue
            last_used = (
                access_path.stat().st_mtime
                if access_path.is_file() else receipt_path.stat().st_mtime
            )
            entries.append({
                "key": key,
                "receipt": receipt_path,
                "access": access_path,
                "artifact": artifact_name,
                "size": artifact_size,
                "last_used": last_used,
            })
    poison_dir = cache_root / "poisoned"
    if poison_dir.is_dir():
        for poison_path in poison_dir.glob("*.json"):
            key = poison_path.stem
            if re.fullmatch(r"[0-9a-f]{64}", key) is None:
                poison_path.unlink(missing_ok=True)
                continue
            # A poison tombstone dominates any receipt left by an interrupted
            # older implementation.  It is a zero-artifact cache entry with
            # the same LRU/count lifecycle as ordinary receipts.
            for entry in tuple(entries):
                if entry["key"] == key:
                    entry["receipt"].unlink(missing_ok=True)
                    entries.remove(entry)
            access_path = cache_root / "access" / key
            last_used = (
                access_path.stat().st_mtime
                if access_path.is_file() else poison_path.stat().st_mtime
            )
            entries.append({
                "key": key,
                "receipt": poison_path,
                "access": access_path,
                "artifact": None,
                "size": 0,
                "last_used": last_used,
            })
    protected = set(protected_keys)
    entries.sort(
        key=lambda entry: (
            entry["key"] in protected,
            entry["last_used"],
        ),
        reverse=True,
    )
    kept: List[Dict[str, Any]] = []
    kept_artifacts: Dict[str, int] = {}
    total_bytes = 0
    for entry in entries:
        artifact_name = entry["artifact"]
        extra_bytes = 0
        if artifact_name is not None and artifact_name not in kept_artifacts:
            extra_bytes = entry["size"]
        retain = entry["key"] in protected or (
            len(kept) < COMPILER_CACHE_MAX_ENTRIES
            and total_bytes + extra_bytes <= COMPILER_CACHE_MAX_BYTES
        )
        if retain:
            kept.append(entry)
            if artifact_name is not None and artifact_name not in kept_artifacts:
                kept_artifacts[artifact_name] = entry["size"]
                total_bytes += extra_bytes
        else:
            entry["receipt"].unlink(missing_ok=True)
            entry["access"].unlink(missing_ok=True)

    referenced = set(kept_artifacts)
    if artifacts_dir.is_dir():
        for artifact in artifacts_dir.glob("*.o"):
            if artifact.name not in referenced:
                artifact.unlink(missing_ok=True)

    access_dir = cache_root / "access"
    if access_dir.is_dir():
        retained_keys = {entry["key"] for entry in kept}
        for access_path in access_dir.iterdir():
            if access_path.is_file() and access_path.name not in retained_keys:
                access_path.unlink(missing_ok=True)

    _prune_cache_conflicts_locked(cache_root)


def _prune_cache_conflicts_locked(cache_root: Path) -> None:
    conflict_root = cache_root / "conflicts"
    if not conflict_root.is_dir():
        return
    conflicts = sorted(
        conflict_root.glob("*/*.json"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    for conflict in conflicts[COMPILER_CACHE_MAX_CONFLICTS:]:
        conflict.unlink(missing_ok=True)
    for directory in conflict_root.iterdir():
        if directory.is_dir() and not any(directory.iterdir()):
            directory.rmdir()


def _candidate_anchor(path: Path) -> _CachedAnchor:
    identity = _stable_file_identity(path, include_mode=True)
    return _CachedAnchor(
        path=path,
        sha256=identity["sha256"],
        size=identity["size"],
        mode=identity["mode"],
    )


def _publish_cached_anchor(
    cache_root: Path,
    key: str,
    inputs: Dict[str, Any],
    staged_object: Path,
) -> _CachedAnchor:
    candidate = _candidate_anchor(staged_object)
    if candidate.size > COMPILER_CACHE_MAX_BYTES:
        raise CompilerPreparationError(
            "compiler anchor object exceeds the persistent cache byte limit"
        )
    receipt_path, artifacts_dir = _cache_paths(cache_root, key)
    artifact_path = artifacts_dir / f"{candidate.sha256}.o"
    with _cache_global_lock(cache_root):
        with _cache_key_lock(cache_root, key):
            _reject_poisoned_cache_key_locked(cache_root, key)
            winner = _validated_cached_anchor(cache_root, key, inputs)
            if receipt_path.exists():
                if winner is None:
                    raise CompilerPreparationError(
                        f"compiler cache entry failed validation: {receipt_path}"
                    )
                _cleanup_compiler_cache_locked(
                    cache_root, protected_keys=(key,),
                )
                if not _same_cached_anchor(winner, candidate):
                    poison = _poison_cache_key_locked(
                        cache_root, key, winner, candidate,
                    )
                    evidence = _record_cache_conflict_locked(
                        cache_root, key, winner, candidate,
                    )
                    raise CompilerPreparationError(
                        "same compiler cache key produced divergent anchor objects; "
                        f"poison: {poison}; evidence: {evidence}"
                    )
                _touch_cache_access(cache_root, key)
                return winner

            _cleanup_compiler_cache_locked(cache_root)

            try:
                # Windows rejects fsync on a read-only CRT descriptor even
                # though no bytes are written here.  Open read/write solely to
                # make the durability barrier portable before publication.
                with staged_object.open("r+b") as stream:
                    os.fsync(stream.fileno())
            except OSError as exc:
                raise CompilerPreparationError(
                    f"cannot flush staged compiler anchor object: {exc}"
                ) from exc
            if not artifact_path.exists():
                _hardlink_once(staged_object, artifact_path)
            published = _candidate_anchor(artifact_path)
            if not _same_cached_anchor(published, candidate):
                raise CompilerPreparationError(
                    "content-addressed compiler anchor artifact is inconsistent"
                )
            receipt = {
                "schema": COMPILER_CACHE_SCHEMA,
                "version": COMPILER_CACHE_VERSION,
                "key": key,
                "inputs": inputs,
                "artifact": artifact_path.name,
                "artifact_sha256": candidate.sha256,
                "artifact_size": candidate.size,
                "artifact_mode": candidate.mode,
            }
            if not _create_json_once(receipt_path, receipt):
                winner = _validated_cached_anchor(cache_root, key, inputs)
                if winner is None:
                    raise CompilerPreparationError(
                        f"compiler cache receipt lost its immutable CAS: {receipt_path}"
                )
                if not _same_cached_anchor(winner, candidate):
                    poison = _poison_cache_key_locked(
                        cache_root, key, winner, candidate,
                    )
                    evidence = _record_cache_conflict_locked(
                        cache_root, key, winner, candidate,
                    )
                    raise CompilerPreparationError(
                        "same compiler cache key produced divergent anchor objects; "
                        f"poison: {poison}; evidence: {evidence}"
                    )
                _touch_cache_access(cache_root, key)
                return winner
            winner = _validated_cached_anchor(cache_root, key, inputs)
            if winner is None:
                raise CompilerPreparationError(
                    "published compiler anchor cache entry failed validation"
                )
            _touch_cache_access(cache_root, key)
            _cleanup_compiler_cache_locked(
                cache_root, protected_keys=(key,),
            )
            return winner


def _copy_cached_anchor(source: _CachedAnchor, destination: Path) -> None:
    shutil.copy2(source.path, destination)
    copied = _candidate_anchor(destination)
    if not _same_cached_anchor(source, copied):
        raise CompilerPreparationError(
            "fresh compiler anchor copy failed receipt validation"
        )


def _lookup_cached_anchor(
    cache_root: Path,
    key: str,
    inputs: Dict[str, Any],
    destination: Path,
) -> bool:
    receipt_path, _ = _cache_paths(cache_root, key)
    with _cache_global_lock(cache_root):
        with _cache_key_lock(cache_root, key):
            _reject_poisoned_cache_key_locked(cache_root, key)
            cached = _validated_cached_anchor(cache_root, key, inputs)
            if receipt_path.exists() and cached is None:
                raise CompilerPreparationError(
                    f"compiler cache entry failed validation: {receipt_path}"
                )
            if cached is None:
                _cleanup_compiler_cache_locked(cache_root)
                return False
            _cleanup_compiler_cache_locked(
                cache_root, protected_keys=(key,),
            )
            _copy_cached_anchor(cached, destination)
            _touch_cache_access(cache_root, key)
            return True


def _prepare_compiler(plan: _CompilerBuildPlan) -> str:
    run_dir = Path(tempfile.mkdtemp(prefix="ring_build_"))
    try:
        if not plan.controlled:
            _compile_anchor(plan, run_dir, plan.anchor_source)
            executable = _compile_runtime_and_link(
                plan, run_dir, plan.anchor_source,
            )
        elif not plan.cache_supported or not _compiler_cache_enabled():
            anchor_snapshot = _stage_anchor_snapshot(plan, run_dir)
            _compile_anchor(plan, run_dir, anchor_snapshot)
            executable = _compile_runtime_and_link(
                plan, run_dir, anchor_snapshot,
            )
        else:
            cache_root = COMPILER_ARTIFACT_CACHE
            tracer = _PHASE_TRACER
            cache_root.mkdir(parents=True, exist_ok=True)
            staging_dir = Path(tempfile.mkdtemp(
                prefix=".staging-lookup-", dir=str(cache_root),
            ))
            try:
                anchor_snapshot = _stage_anchor_snapshot(plan, staging_dir)
                inputs = _compiler_cache_inputs(
                    plan, anchor_snapshot, staging_dir,
                )
                key = _compiler_cache_key(inputs)
                run_object = run_dir / "main.o"
                prepare_started_ns = (
                    time.perf_counter_ns() if tracer is not None else None
                )
                hit = _lookup_cached_anchor(
                    cache_root, key, inputs, run_object,
                )
                if hit:
                    if tracer is not None and prepare_started_ns is not None:
                        tracer.record_stage(
                            suite=None,
                            case="runner",
                            stage="compiler_anchor_prepare",
                            duration_ns=(
                                time.perf_counter_ns() - prepare_started_ns
                            ),
                            executed=False,
                            complete=True,
                            outcome="cached",
                        )
                    confirmed_inputs = _compiler_cache_inputs(
                        plan, anchor_snapshot, staging_dir,
                    )
                    if confirmed_inputs != inputs:
                        raise CompilerPreparationError(
                            "compiler anchor cache inputs changed during lookup"
                        )
                else:
                    staged_object = _compile_anchor(
                        plan, staging_dir, anchor_snapshot,
                    )
                    confirmed_inputs = _compiler_cache_inputs(
                        plan, anchor_snapshot, staging_dir,
                    )
                    if confirmed_inputs != inputs:
                        raise CompilerPreparationError(
                            "compiler anchor cache inputs changed during construction"
                        )
                    cached = _publish_cached_anchor(
                        cache_root, key, inputs, staged_object,
                    )
                    _copy_cached_anchor(cached, run_object)
                executable = _compile_runtime_and_link(
                    plan, run_dir, anchor_snapshot,
                )
            finally:
                shutil.rmtree(staging_dir, ignore_errors=True)
    except BaseException:
        shutil.rmtree(run_dir, ignore_errors=True)
        raise
    atexit.register(shutil.rmtree, str(run_dir), True)
    return str(executable)


def find_ring_exe() -> Optional[str]:
    """Prepare the compiler from the tracked C anchor in a fresh run dir."""
    plan = _compiler_build_plan()
    if plan is None:
        return None
    return _prepare_compiler(plan)


def _subprocess_output_text(value: Any) -> str:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return "" if value is None else str(value)


def _report_compiler_preparation_failure(exc: BaseException) -> None:
    print("ERROR: failed to build ring.exe from tracked inputs.", file=sys.stderr)
    if isinstance(exc, subprocess.CalledProcessError):
        command = exc.cmd
        if isinstance(command, (list, tuple)):
            command_text = subprocess.list2cmdline([str(arg) for arg in command])
        else:
            command_text = str(command)
        print(
            f"  command exited {exc.returncode}: {command_text}",
            file=sys.stderr,
        )
        for label, value in (("stdout", exc.stdout), ("stderr", exc.stderr)):
            output = _subprocess_output_text(value).rstrip()
            if output:
                print(f"  {label}:", file=sys.stderr)
                print(output, file=sys.stderr)
        return
    if isinstance(exc, subprocess.TimeoutExpired):
        print(f"  command timed out after {exc.timeout}s: {exc.cmd}", file=sys.stderr)
        for label, value in (("stdout", exc.stdout), ("stderr", exc.stderr)):
            output = _subprocess_output_text(value).rstrip()
            if output:
                print(f"  {label}:", file=sys.stderr)
                print(output, file=sys.stderr)
        return
    print(f"  {exc}", file=sys.stderr)


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


def expected_panic_diagnostic(expected_raw: str) -> str:
    """Return the optional exact runtime diagnostic after EXPECT_PANIC."""
    lines = norm(expected_raw).splitlines()
    marker_index = next(
        (index for index, line in enumerate(lines) if line.strip()), None)
    if marker_index is None:
        return ""
    return "\n".join(lines[marker_index + 1:]).strip()


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
        return True, (r.stdout or "") + (r.stderr or ""), ""

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

    # --- Positive single-file cases ---
    positive = discover_positive_cases(CASES_DIR)
    # Also include cases from subdirectories (negative/, errors/) that have .expected
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
                diagnostic = expected_panic_diagnostic(expected_raw)
                actual = norm(stdout).strip()
                if diagnostic and actual != diagnostic:
                    collector.add(TestResult(
                        TestResult.FAIL, suite, str(rel),
                        f"expected runtime diagnostic {diagnostic!r}, got {actual!r}"))
                else:
                    detail = (
                        "expected runtime diagnostic observed"
                        if diagnostic else "expected panic observed"
                    )
                    collector.add(TestResult(
                        TestResult.PASS, suite, str(rel), detail))
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
    pattern = re.compile(
        rf"\bfn\s+{re.escape(function_name)}\s*"
        rf"\([^{{}}]*\)[^{{}}\n]*\{{")
    matches = list(pattern.finditer(masked))
    if len(matches) != 1:
        return None, f"Ring function {function_name} found {len(matches)} times"
    open_index = masked.rfind("{", matches[0].start(), matches[0].end())
    try:
        close_index = matching_delimiter(masked, open_index, "{", "}")
    except ValueError as exc:
        return None, f"Ring function {function_name}: {exc}"
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


def structural_fixture_integrity_errors() -> List[str]:
    """Enforce fixture-to-oracle closure before either runner consumes it."""
    errors: List[str] = []
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


def identity_checkpoint_contract_errors(
    sources: dict[str, str],
) -> List[str]:
    """Lock the behavior-preserving I-prime exact-slot transport."""
    errors: List[str] = []
    required_tokens = {
        "hir": (
            "pub struct HPatternBinding",
            "Drop { name: Str, def_id: Int, ty: Type, span: Span }",
            "SYNTHETIC_DICT_DEF_ID_BASE",
            "SYNTHETIC_ANF_DEF_ID_BASE",
            "SYNTHETIC_RC_DEF_ID_BASE",
            "pub fn is_synthetic_dict_def_id(",
            "pub fn validate_hir_binder_def_ids",
            "fn validate_hir_local_reference(",
            "block_local_init(stmts, id)",
        ),
        "infer": (
            "fn infer_scoped_block(",
            "fn exact_pattern_bindings(",
            "freshen_default_argument_hir(ctx, dh)",
            "bindings: pattern_bindings",
            "resume_binding: resume_binding",
        ),
        "infer_decl": (
            "trait default parameter has no exact DefId",
            "effect default parameter has no exact DefId",
            "def_id: some(effect_param_def_id)",
            "def_id: some(exact_effect_def_id)",
            "def_id: some(trait_param_def_id)",
            "def_id: some(exact_trait_def_id)",
        ),
        "infer_ctx": (
            "struct OrPatternBindingAuthority",
            "fn collect_or_pattern_binding_names(",
            "fn same_or_pattern_binding_names(",
            "fn report_duplicate_or_pattern_bindings(",
            "Or-pattern alternatives must bind the same variables",
            "Pattern repeats binding '${duplicate}'",
            "Or-pattern must contain at least one alternative",
            "authority.scheme.ty, candidate.ty",
            "ctx.env.bind(authority.name, authority.scheme)",
            "canonical or-pattern binding has no exact DefId",
            "or-pattern alternative binding has no exact DefId",
        ),
        "dict": (
            "synthetic_def_id(",
            "SYNTHETIC_DICT_DEF_ID_BASE",
            "validate_hir_binder_def_ids(lowered)",
        ),
        "perceus": (
            "struct OwnedSlot",
            "fn owned_find_def_id(",
            "SYNTHETIC_ANF_DEF_ID_BASE",
            "SYNTHETIC_RC_DEF_ID_BASE",
            "def_id: slot.def_id",
            "validate_hir_binder_def_ids(transformed)",
            "mutate_drop_identity_capture(anf_program)",
        ),
        "cctx": (
            "pub value_slots_by_def_id: Map<Int, Str>",
            "pub name_only_slots: Map<Str, Str>",
            "pub value_slot_names_by_def_id: Map<Int, Str>",
            "pub fn c_local_def(",
            "pub fn c_param_def(",
            "pub fn c_value_slot(",
            "pub fn c_exact_value_slot(",
            "pub fn c_name_only_value(",
            "value_slots_by_def_id: ctx.value_slots_by_def_id",
            "ctx.value_slots_by_def_id = saved.value_slots_by_def_id",
        ),
        "cexpr": (
            "let found = match def_id",
            "some(id) => match c_exact_value_slot(ctx, name, id)",
            "let exact_local_callee = match callee",
            "let closure_result = gen_c_closure_call(ctx, slot, arg_vals)",
            "some(id) => c_local_def(ctx, cap.name, some(id))",
            "none => c_local(ctx, cap.name)",
            "fn c_lookup_call_mut_flags(",
            "fn c_pattern_local(",
            "bind_c_root_pattern_after_success(",
            "C codegen: Drop '${name}' has no exact DefId slot",
            "C codegen: assignment '${name}' has no exact DefId",
            "fn c_is_name_only_dict_def_id(",
            "let is_name_only_dict = c_is_name_only_dict_def_id(def_id)",
            "let val = gen_c_expr(ctx, init)",
        ),
        "verify": (
            "def_ids: List<Int>",
            "if ctx.def_ids[i] == def_id",
            "fn v_lookup_name(",
            "local reference '${name}' has no exact DefId",
            "fn v_drop(name: Str, def_id: Int",
            "ctx.kinds[idx] == K_BORROW || ctx.kinds[idx] == K_CAPTURE",
            "for binding in arm.bindings",
            "def_id, \"assignment '${name}'\"",
        ),
    }
    for label, tokens in required_tokens.items():
        source = sources[label]
        for token in tokens:
            if token not in source:
                errors.append(f"{label}: missing exact-slot contract {token!r}")

    infer_source = sources["infer"]
    if len(re.findall(r"\binfer_scoped_block\b", infer_source)) != 5:
        errors.append("infer: scoped-block helper must have one definition and four call sites")
    scoped_placements = (
        "infer_scoped_block(ctx, expr, some(subst))",
        "infer_scoped_block(ctx, body, some(subst))",
        "infer_scoped_block(ctx, then_branch, some(s))",
        "infer_scoped_block(ctx, eb, some(s))",
    )
    for placement in scoped_placements:
        if infer_source.count(placement) != 1:
            errors.append(f"infer: scoped-block placement drifted: {placement}")

    # Tracked gen0 accepts source OrPattern syntax but cannot lower a shared
    # body that reads payload variables bound by its alternatives.  Keep the
    # I-prime compiler implementation crossing-compatible without constraining
    # the language feature itself: each formerly shared traversal arm is an
    # explicit arm that delegates to a common helper.
    crossing_split_inventory = (
        ("hir", "validate_hir_stmt",
         "HStmt::Let { name, def_id, init, .. }",
         "HStmt::Var { name, def_id, init, .. }",
         "validate_hir_local_binding("),
        ("hir", "validate_hir_expr",
         "HExpr::StructLit { fields, spread, .. }",
         "HExpr::NamedVariantConstruct { fields, spread, .. }",
         "validate_hir_field_values("),
        ("hir", "validate_hir_expr",
         "HExpr::ListLit { elements, .. }",
         "HExpr::TupleLit { elements, .. }",
         "validate_hir_expr_values("),
        ("infer", "collect_default_stmt_binders",
         "HStmt::Let { name, def_id, init, .. }",
         "HStmt::Var { name, def_id, init, .. }",
         "collect_default_local_binder("),
        ("infer", "collect_default_expr_binders",
         "HExpr::StructLit { fields, spread, .. }",
         "HExpr::NamedVariantConstruct { fields, spread, .. }",
         "collect_default_field_binders("),
        ("infer", "collect_default_expr_binders",
         "HExpr::ListLit { elements, .. }",
         "HExpr::TupleLit { elements, .. }",
         "collect_default_expr_value_binders("),
    )
    crossing_bodies: dict[tuple[str, str], str] = {}
    for label, function_name, left, right, helper in crossing_split_inventory:
        key = (label, function_name)
        body = crossing_bodies.get(key)
        if body is None:
            body, extract_error = extract_ring_function_body(
                sources[label], function_name)
            if extract_error:
                errors.append(extract_error)
                continue
            crossing_bodies[key] = body
        for arm in (left, right):
            arm_token = f"{arm} =>"
            if body.count(arm_token) != 1:
                errors.append(
                    f"{function_name}: crossing split arm {arm!r} matched "
                    f"{body.count(arm_token)} times")
        if body.count(helper) != 2:
            errors.append(
                f"{function_name}: crossing helper {helper!r} matched "
                f"{body.count(helper)} times")
        combined = re.compile(
            rf"{re.escape(left)}\s*\|\s*{re.escape(right)}")
        if combined.search(mask_ring_strings_and_comments(body)):
            errors.append(
                f"{function_name}: payload-binding OrPattern arm regained")

    payload_or_pattern = re.compile(
        r"(?m)^\s*[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*\s*"
        r"(?:\{(?!\s*\.\.\s*\})[^{}\n]+\}|"
        r"\(\s*(?!\s*\))[^()\n]+\))\s*\|(?!\|)")
    for (label, function_name), body in crossing_bodies.items():
        match = payload_or_pattern.search(mask_ring_strings_and_comments(body))
        if match is not None:
            errors.append(
                f"{label}.{function_name}: payload-binding source OrPattern "
                f"remains at {match.group(0).strip()!r}")

    if sources["cexpr"].count("bind_c_root_pattern_after_success(") != 3:
        errors.append(
            "C or-pattern lowering must have one shared-slot helper and "
            "two success-edge calls")

    assign_body, assign_error = extract_ring_function_body(
        sources["cexpr"], "emit_c_assign")
    if assign_error:
        errors.append(assign_error)
    else:
        if "c_exact_value_slot(ctx, name, exact_def_id)" not in assign_body:
            errors.append("C assignment no longer selects the exact DefId slot")
        if "ctx.named_values" in assign_body:
            errors.append("DefId-bearing C assignment regained a name fallback")

    call_body, call_error = extract_ring_function_body(
        sources["cexpr"], "gen_c_call")
    if call_error:
        errors.append(call_error)
    elif not all(token in call_body for token in (
            "let exact_local_callee = match callee",
            "c_exact_value_slot(ctx, name, id)",
            "gen_c_closure_call(ctx, slot, arg_vals)")):
        errors.append("exact local callable no longer takes the closure ABI path")

    stmt_body, stmt_error = extract_ring_function_body(
        sources["cexpr"], "emit_c_stmt")
    if stmt_error:
        errors.append(stmt_error)
    elif not all(token in stmt_body for token in (
            "let is_name_only_dict = c_is_name_only_dict_def_id(def_id)",
            "let val = gen_c_expr(ctx, init)")):
        errors.append("Dict alias provenance is not derived from exact synthetic DefId")
    elif stmt_body.count("gen_c_expr(ctx, init)") != 2:
        # One Let and one Var arm; the Let arm must have no second init read.
        errors.append("statement lowering changed the exact one-read-per-init contract")

    lambda_body, lambda_error = extract_ring_function_body(
        sources["cexpr"], "gen_c_lambda")
    if lambda_error:
        errors.append(lambda_error)
    else:
        capture_registration = (
            "let cv = match cap.def_id {\n"
            "                    some(id) => c_local_def("
            "ctx, cap.name, some(id)),\n"
            "                    none => c_local(ctx, cap.name)\n"
            "                }")
        if lambda_body.count(capture_registration) != 1:
            errors.append(
                "lambda capture extraction does not split exact and "
                "name-only registration")
        if "c_local_def(ctx, cap.name, cap.def_id)" in lambda_body:
            errors.append(
                "lambda capture extraction routes missing DefId through exact local")

    dict_id_body, dict_id_error = extract_ring_function_body(
        sources["cexpr"], "c_is_name_only_dict_def_id")
    if dict_id_error:
        errors.append(dict_id_error)
    elif "is_synthetic_dict_def_id(id)" not in dict_id_body:
        errors.append("Dict name-only provenance is not the synthetic DefId namespace")

    mut_flags_body, mut_flags_error = extract_ring_function_body(
        sources["cexpr"], "c_lookup_call_mut_flags")
    if mut_flags_error:
        errors.append(mut_flags_error)
    else:
        local_gate = "c_exact_value_slot(ctx, name, id).is_some()"
        exact_gate_block = (
            "some(id) => if c_exact_value_slot(ctx, name, id).is_some() {\n"
            "                    return none"
        )
        module_lookup = "ctx.fn_mut_params.get(resolved_key)"
        if (
            local_gate not in mut_flags_body
            or exact_gate_block not in mut_flags_body
            or mut_flags_body.index(local_gate) > mut_flags_body.index(module_lookup)
        ):
            errors.append(
                "exact/local callable mut flags are not gated before module metadata")

    name_only_body, name_only_error = extract_ring_function_body(
        sources["cctx"], "c_name_only_value")
    if name_only_error:
        errors.append(name_only_error)
    elif (
        "ctx.name_only_slots.get(name)" not in name_only_body
        or "ctx.named_values" in name_only_body
    ):
        errors.append("backend name-only lookup is not an independent slot map")

    exact_local_body, exact_local_error = extract_ring_function_body(
        sources["cctx"], "c_local_def")
    if exact_local_error:
        errors.append(exact_local_error)
    elif "name_only_slots" in exact_local_body:
        errors.append("exact source local registration contaminates name-only slots")

    lookup_body, lookup_error = extract_ring_function_body(
        sources["verify"], "v_lookup")
    if lookup_error:
        errors.append(lookup_error)
    elif "ctx.names[i]" in lookup_body or "ctx.def_ids[i] == def_id" not in lookup_body:
        errors.append("RC verifier lookup is not exact-DefId-only")

    drops_body, drops_error = extract_ring_function_body(
        sources["perceus"], "drops_for")
    if drops_error:
        errors.append(drops_error)
    elif not all(token in drops_body for token in (
            "let mut index = names.len()", "index = index - 1",
            "def_id: slot.def_id")):
        errors.append("Perceus cleanup is not reverse-order exact-slot")

    for function_name, required in (
        ("check_effect_decl", (
            "let effect_param_def_id = ctx.env.fresh_def_id()",
            "def_id: some(effect_param_def_id)",
            "let exact_effect_def_id = match p.def_id",
            "def_id: some(exact_effect_def_id)",
        )),
        ("check_trait_decl", (
            "let trait_param_def_id = ctx.env.fresh_def_id()",
            "def_id: some(trait_param_def_id)",
        )),
        ("check_trait_default_body", (
            "let exact_trait_def_id = match p.def_id",
            "def_id: some(exact_trait_def_id)",
        )),
    ):
        body, extract_error = extract_ring_function_body(
            sources["infer_decl"], function_name)
        if extract_error:
            errors.append(extract_error)
        else:
            for token in required:
                if body.count(token) != 1:
                    errors.append(
                        f"{function_name}: exact default parameter contract "
                        f"{token!r} matched {body.count(token)} times")

    bind_pattern_body, bind_pattern_error = extract_ring_function_body(
        sources["infer_ctx"], "bind_pattern")
    if bind_pattern_error:
        errors.append(bind_pattern_error)
    else:
        authority_tokens = (
            "if patterns.len() == 0",
            "report_duplicate_or_pattern_bindings(",
            "same_or_pattern_binding_names(",
            "if !binding_sets_valid",
            "fail.raise(CompileError {})",
            "authority.scheme.ty, candidate.ty",
            "ctx.env.bind(authority.name, authority.scheme)",
        )
        for token in authority_tokens:
            if token not in bind_pattern_body:
                errors.append(
                    f"bind_pattern OrPattern authority missing {token!r}")
        if "expected_names.len() > 0" in bind_pattern_body:
            errors.append(
                "bind_pattern incorrectly rejects legal empty binding sets")

    for function_name, pattern_name in (
        ("infer_match", "match_pattern"),
        ("infer_catch", "catch_pattern"),
        ("infer_if_let_from_result", "iflet_pattern"),
    ):
        body, extract_error = extract_ring_function_body(
            sources["infer"], function_name)
        if extract_error:
            errors.append(extract_error)
            continue
        bind_anchor = f"bind_pattern(ctx, {pattern_name}"
        transport_match = re.search(
            rf"exact_pattern_bindings\s*\(\s*ctx\.env\s*,\s*"
            rf"{re.escape(pattern_name)}\s*\)",
            body,
        )
        if bind_anchor not in body or transport_match is None:
            errors.append(
                f"{function_name}: missing bind_pattern→exact HIR transport")
        elif body.index(bind_anchor) > transport_match.start():
            errors.append(
                f"{function_name}: HIR extracts pattern IDs before authority")

    # I-prime is identity only: the S-prime producer split and A-prime Take /
    # ownership metadata must remain absent from this checkpoint.
    forbidden = {
        "perceus": ("DROP_PRODUCER_NOOP_NONE", "is_option_none_ctor_ident"),
        "hir": ("OwnershipMetadata", "Take {"),
        "cctx": ("exact_value_names", "name_only_values"),
        "cexpr": (
            'starts_with("__ring_dictlocal_")',
            "let is_name_only_dict = match init",
            "c_is_name_only_dict_init",
            "init_for_classification",
            "init_for_codegen",
        ),
    }
    for label, tokens in forbidden.items():
        for token in tokens:
            if token in sources[label]:
                errors.append(f"{label}: I-prime imported forbidden {token!r}")
    return errors


def default_body_identity_generated_c_errors(ring_exe: str) -> List[str]:
    """Require distinct parameter/shadow slots in trait/effect default C."""
    errors: List[str] = []
    with tempfile.TemporaryDirectory(prefix="ring_identity_default_c_") as tmpdir:
        c_path, _, build_error = build_c_artifacts_fresh(
            ring_exe, "tests/cases/default_body_exact_param_identity.ring",
            Path(tmpdir), no_c_lines=True,
            phase_case="compiler.identity_checkpoint/default-body-c",
        )
        if build_error:
            return [build_error]
        assert c_path is not None
        source = c_path.read_text(encoding="utf-8")
        masked = mask_c_strings_and_comments(source)

    def exact_shadow_slot_errors(body: str, label: str) -> List[str]:
        slot_errors: List[str] = []
        if not re.search(r"\bvoid\s*\*\s*r_value_2(?:\s*=\s*NULL)?\s*;", body):
            slot_errors.append(
                f"{label} generated C omitted the distinct shadow declaration")
        if len(re.findall(r"\br_value_2\s*=\s*t[0-9]+\s*;", body)) != 1:
            slot_errors.append(
                f"{label} generated C must assign the exact shadow slot once")
        if not re.search(r"\bt[0-9]+\s*=\s*r_value\s*;", body):
            slot_errors.append(
                f"{label} generated C did not read the exact parameter slot")
        if not re.search(
                r"\(\(void\*\*\)t[0-9]+\)\[1\]\s*=\s*r_value_2\s*;",
                body):
            slot_errors.append(
                f"{label} generated C did not capture the exact shadow slot")
        return slot_errors

    trait_body, trait_error = extract_c_function_body(
        source, "__ExactDefaultTrait_compute")
    if trait_error:
        errors.append(trait_error)
    else:
        errors.extend(exact_shadow_slot_errors(trait_body, "trait default"))

    lambda_symbols = re.findall(
        r"(?m)^void\*\s+(ring_c_lambda_[0-9]+)\s*"
        r"\(void\* env, void\* r_value\)\s*\{",
        masked,
    )
    effect_bodies: List[str] = []
    for symbol in lambda_symbols:
        body, extract_error = extract_c_function_body(source, symbol)
        if extract_error is None and "RING_INT(2)" in body:
            effect_bodies.append(body)
    if len(effect_bodies) != 1:
        errors.append(
            "effect default generated C expected one value+2 closure, "
            f"found {len(effect_bodies)}")
    else:
        errors.extend(exact_shadow_slot_errors(
            effect_bodies[0], "effect default"))

    mixed_body, mixed_error = extract_c_function_body(
        source, "ring_mixed_evidence_capture")
    if mixed_error:
        errors.append(mixed_error)
        return errors

    same_spelling = r"r___ring_T_Ord(?:_[0-9]+)?"
    outer_stores = re.findall(
        rf"\(\(void\*\*\)(t[0-9]+)\)\[([0-9]+)\]\s*=\s*"
        rf"({same_spelling})\s*;",
        mixed_body,
    )
    stores_by_env: dict[str, set[str]] = {}
    for env_name, _, value_name in outer_stores:
        stores_by_env.setdefault(env_name, set()).add(value_name)
    if not any(len(values) == 2 for values in stores_by_env.values()):
        errors.append(
            "mixed evidence capture did not store distinct same-spelled "
            "exact and name-only values")

    lambda_refs = set(re.findall(
        r"\(\(void\*\*\)t[0-9]+\)\[0\]\s*=\s*"
        r"\(void\*\)(ring_c_lambda_[0-9]+)\s*;",
        mixed_body,
    ))
    separated_lambdas: List[str] = []
    for symbol in lambda_refs:
        body, extract_error = extract_c_function_body(source, symbol)
        if extract_error is not None:
            continue
        condition = re.search(
            r"RING_COND\s*\(\s*(t[0-9]+)\s*\)", body)
        evidence = re.search(
            rf"\(\(void\*\*\)({same_spelling})\)\[1\]", body)
        if condition is None or evidence is None:
            continue
        condition_temp = condition.group(1)
        condition_source = re.search(
            rf"\b{re.escape(condition_temp)}\s*=\s*"
            rf"({same_spelling})\s*;",
            body,
        )
        if condition_source is None:
            continue
        condition_name = condition_source.group(1)
        evidence_name = evidence.group(1)
        if condition_name == evidence_name:
            continue
        extractions = {
            name: slot for name, slot in re.findall(
                rf"\b({same_spelling})\s*=\s*"
                r"\(\(void\*\*\)env\)\[([0-9]+)\]\s*;",
                body,
            )
        }
        if (
            condition_name in extractions
            and evidence_name in extractions
            and extractions[condition_name] != extractions[evidence_name]
        ):
            separated_lambdas.append(symbol)
    if len(separated_lambdas) != 1:
        errors.append(
            "mixed evidence generated C expected one lambda with distinct "
            "exact-condition and name-only-dict capture slots, found "
            f"{len(separated_lambdas)}")
    return errors


def identity_checkpoint_source_errors() -> List[str]:
    paths = {
        "hir": REPO / "compiler" / "hir.ring",
        "infer": REPO / "compiler" / "infer.ring",
        "infer_decl": REPO / "compiler" / "infer_decl.ring",
        "infer_ctx": REPO / "compiler" / "infer_ctx.ring",
        "dict": REPO / "compiler" / "dict_lower.ring",
        "perceus": REPO / "compiler" / "perceus.ring",
        "cctx": REPO / "compiler" / "codegen_c_ctx.ring",
        "cexpr": REPO / "compiler" / "codegen_c_expr.ring",
        "verify": REPO / "compiler" / "verify_rc.ring",
    }
    sources: dict[str, str] = {}
    errors: List[str] = []
    for label, path in paths.items():
        try:
            sources[label] = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            errors.append(f"cannot read {display_path(path)}: {exc}")
    if errors:
        return errors
    errors.extend(identity_checkpoint_contract_errors(sources))

    mutations = (
        ("Drop DefId", "hir", "Drop { name: Str, def_id: Int, ty: Type, span: Span }",
         "Drop { name: Str, ty: Type, span: Span }"),
        ("default freshening", "infer", "freshen_default_argument_hir(ctx, dh)", "dh"),
        ("assignment exact slot", "cexpr", "c_exact_value_slot(ctx, name, exact_def_id)",
         "ctx.named_values.get(name)"),
        ("exact local closure call", "cexpr",
         "let closure_result = gen_c_closure_call(ctx, slot, arg_vals)",
         "let closure_result = gen_c_direct_call(ctx, name, arg_vals, dict_vals)"),
        ("name-only lambda capture extraction", "cexpr",
         "none => c_local(ctx, cap.name)",
         "none => c_local_def(ctx, cap.name, none)"),
        ("synthetic Dict provenance", "cexpr",
         "is_synthetic_dict_def_id(id)",
         "is_synthetic_anf_def_id(id)"),
        ("Let Dict DefId routing", "cexpr",
         "let is_name_only_dict = c_is_name_only_dict_def_id(def_id)",
         "let is_name_only_dict = false"),
        ("exact local mut-flag isolation", "cexpr",
         "some(id) => if c_exact_value_slot(ctx, name, id).is_some() {\n                    return none",
         "some(id) => if c_exact_value_slot(ctx, name, id).is_some() {\n                    return ctx.fn_mut_params.get(name)"),
        ("independent name-only slot map", "cctx",
         "ctx.name_only_slots.get(name)", "ctx.named_values.get(name)"),
        ("verifier exact lookup", "verify", "ctx.def_ids[i] == def_id",
         "ctx.names[i] == name"),
        ("or-pattern shared slot", "cexpr", "bind_c_root_pattern_after_success(",
         "bind_c_nested_pattern("),
        ("effect default HParam identity", "infer_decl", "def_id: some(effect_param_def_id)",
         "def_id: none"),
        ("effect default body identity", "infer_decl", "def_id: some(exact_effect_def_id)",
         "def_id: some(ctx.env.fresh_def_id())"),
        ("trait default HParam identity", "infer_decl", "def_id: some(trait_param_def_id)",
         "def_id: none"),
        ("trait default body identity", "infer_decl", "def_id: some(exact_trait_def_id)",
         "def_id: some(ctx.env.fresh_def_id())"),
        ("or-pattern canonical restore", "infer_ctx",
         "ctx.env.bind(authority.name, authority.scheme)",
         "ctx.env.bind(authority.name, candidate)"),
        ("or-pattern type compatibility", "infer_ctx",
         "authority.scheme.ty, candidate.ty",
         "authority.scheme.ty, authority.scheme.ty"),
        ("or-pattern duplicate rejection", "infer_ctx",
         "if report_duplicate_or_pattern_bindings(\n                        ctx.sink, duplicates, span) {",
         "if false {"),
        ("nested scope", "infer", "infer_scoped_block(ctx, expr, some(subst))",
         "infer_block(ctx, expr, some(subst))"),
        ("HIR crossing arm split", "hir",
         "HStmt::Let { name, def_id, init, .. } =>\n"
         "            validate_hir_local_binding(\n"
         "                name, def_id, init, seen, scope),\n"
         "        HStmt::Var { name, def_id, init, .. } =>\n"
         "            validate_hir_local_binding(\n"
         "                name, def_id, init, seen, scope)",
         "HStmt::Let { name, def_id, init, .. } |\n"
         "        HStmt::Var { name, def_id, init, .. } =>\n"
         "            validate_hir_local_binding(\n"
         "                name, def_id, init, seen, scope)"),
        ("default traversal crossing arm split", "infer",
         "HExpr::ListLit { elements, .. } =>\n"
         "            collect_default_expr_value_binders(ctx, elements, remap),\n"
         "        HExpr::TupleLit { elements, .. } =>\n"
         "            collect_default_expr_value_binders(ctx, elements, remap)",
         "HExpr::ListLit { elements, .. } |\n"
         "        HExpr::TupleLit { elements, .. } =>\n"
         "            collect_default_expr_value_binders(ctx, elements, remap)"),
    )
    for label, source_name, anchor, replacement in mutations:
        if sources[source_name].count(anchor) < 1:
            errors.append(f"mutation {label}: anchor missing")
            continue
        mutated = dict(sources)
        mutated[source_name] = sources[source_name].replace(anchor, replacement, 1)
        if not identity_checkpoint_contract_errors(mutated):
            errors.append(f"mutation {label} escaped exact-slot source oracle")
    return errors


def identity_checkpoint_candidate_identity(
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Resolve and hash the explicitly selected I-prime candidate compiler."""
    raw = os.environ.get(IDENTITY_CANDIDATE_ENV)
    if raw is None:
        return None, None, None
    if not raw:
        return None, None, f"{IDENTITY_CANDIDATE_ENV} is empty"
    candidate = Path(raw)
    if not candidate.is_absolute():
        return None, None, f"{IDENTITY_CANDIDATE_ENV} must be an absolute path"
    try:
        resolved = candidate.resolve(strict=True)
        before = resolved.stat()
        if not stat.S_ISREG(before.st_mode):
            return None, None, (
                f"{IDENTITY_CANDIDATE_ENV} is not a regular file: {resolved}")
        digest = _sha256_file(resolved)
        after = resolved.stat()
    except OSError as exc:
        return None, None, (
            f"cannot resolve/hash {IDENTITY_CANDIDATE_ENV}: {exc}")
    if (
        before.st_size != after.st_size
        or before.st_mtime_ns != after.st_mtime_ns
    ):
        return None, None, (
            f"{IDENTITY_CANDIDATE_ENV} changed while hashing: {resolved}")
    return str(resolved), digest, None


def identity_checkpoint_errors() -> Tuple[List[str], str]:
    errors = identity_checkpoint_source_errors()
    candidate, digest, candidate_error = identity_checkpoint_candidate_identity()
    if candidate_error is not None:
        errors.append(candidate_error)
        return errors, f"{IDENTITY_CANDIDATE_ENV}=invalid"
    if candidate is None:
        return errors, f"{IDENTITY_CANDIDATE_ENV}=unset; source/mutation only"
    assert digest is not None
    detail = f"candidate={candidate}; sha256={digest}"
    errors.extend(default_body_identity_generated_c_errors(candidate))
    post_candidate, post_digest, post_error = (
        identity_checkpoint_candidate_identity())
    if post_error is not None:
        errors.append(
            f"candidate identity unavailable after generated-C gate: {post_error}")
    elif post_candidate != candidate or post_digest != digest:
        errors.append("candidate executable identity changed during generated-C gate")
    return errors, detail


def run_structural(ring_exe: str, collector: ResultCollector, *,
                   name_filter: Optional[str] = None) -> None:
    """Run generated-C source-map and extern-handle ownership oracles."""
    suite = "structural"
    integrity_errors = structural_fixture_integrity_errors()
    if integrity_errors:
        for index, error in enumerate(integrity_errors, 1):
            collector.add(TestResult(
                TestResult.FAIL, suite, f"fixture validation {index}", error))
        return

    identity_label = "compiler.identity_checkpoint"
    if matches_filter(identity_label, name_filter):
        identity_errors, identity_detail = identity_checkpoint_errors()
        detail_parts = [identity_detail, *identity_errors]
        collector.add(TestResult(
            TestResult.PASS if not identity_errors else TestResult.FAIL,
            suite, identity_label, "; ".join(detail_parts)))

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
    with tempfile.TemporaryDirectory(prefix="ring_structural_") as tmpdir:
        temp_root = Path(tmpdir)
        for label, kind, entry, fixtures in jobs:
            if kind == "line":
                errors = run_c_line_oracle(
                    ring_exe, temp_root, entry, fixtures, label)
            else:
                errors = run_extern_rc_oracle(ring_exe, temp_root, label)
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
                    companion = evidence_path.with_suffix(".error")
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
            "exact reference identity live",
            "tests/cases/verify_rc/exact_reference_def_id.ring",
            ("--verify-rc",), True, fatal_exact=0,
        ),
        RcInvocationContract(
            "exact-DefId shadowing live", "tests/cases/verify_rc/shadow_overwrite.ring",
            ("--verify-rc",), True, fatal_exact=0,
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
            "variable overwrite", "tests/cases/verify_rc/overwrite_var.ring",
            ("--verify-rc-strict",), False, strict=True, fatal_exact=0, exempt_min=1,
            exempt_counts=(("x-overwrite-var", 1),),
            finding_counts=(("x-overwrite-var", 1),),
        ),
        RcInvocationContract(
            "spread source", "tests/cases/verify_rc/spread_leak.ring",
            ("--verify-rc-strict",), False, strict=True, fatal_exact=0, exempt_min=1,
            exempt_counts=(("x-spread", 1),), finding_counts=(("x-spread", 1),),
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
            "shadow mismatch lax", "tests/cases/verify_rc/shadow_mismatch.ring",
            ("--verify-rc",), True, fatal_exact=0, exempt_min=1,
            exempt_counts=(("x-effect-value", 1),),
        ),
        RcInvocationContract(
            "shadow mismatch strict", "tests/cases/verify_rc/shadow_mismatch.ring",
            ("--verify-rc-strict",), False, strict=True,
            fatal_exact=0, exempt_min=1,
            exempt_counts=(("x-effect-value", 1),),
            finding_counts=(("x-effect-value", 1),),
            finding_lines=(("x-effect-value", (12,)),),
        ),
    )

    fixture_files = {
        normalized_repo_path(path) for path in RC_NEG_DIR.glob("*.ring")
    } if RC_NEG_DIR.is_dir() else set()
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
        if (
            failure is None
            and contract.name == "exact-DefId shadowing live"
            and "x-shadow-overwrite" in process_output(result)
        ):
            failure = "exact-DefId shadowing still reports shared-name overwrite"
        collector.add(TestResult(
            TestResult.PASS if failure is None else TestResult.FAIL,
            suite,
            name,
            failure or "",
        ))

    identity_fixture = "tests/cases/verify_rc/exact_reference_def_id.ring"
    identity_mutations = (
        ("local", "strip-local-ident-def-id"),
        ("capture", "strip-capture-ident-def-id"),
    )
    for mutation_name, mutation in identity_mutations:
        label = f"neg/exact reference {mutation_name} DefId mutation"
        if not (
            matches_filter(label, name_filter)
            or matches_filter(identity_fixture, name_filter)
        ):
            continue
        try:
            result = ring_check(
                ring_exe, str(REPO / identity_fixture),
                extra_args=["--verify-rc", f"--rc-mutate={mutation}"],
                phase_suite=suite, phase_case=label,
            )
        except subprocess.TimeoutExpired:
            collector.add(TestResult(TestResult.FAIL, suite, label, "timed out"))
            continue
        output = strip_ansi(process_output(result))
        failure = None
        if result.returncode == 0:
            failure = "stripped exact local reference DefId did not fail"
        elif "HIR Ident local reference" not in output:
            failure = (
                "missing fail-loud exact-reference diagnostic: "
                + output[:300]
            )
        collector.add(TestResult(
            TestResult.PASS if failure is None else TestResult.FAIL,
            suite, label, failure or "",
        ))

    capture_drop_label = "neg/exact capture Drop mutation"
    if (
        matches_filter(capture_drop_label, name_filter)
        or matches_filter(identity_fixture, name_filter)
    ):
        try:
            result = ring_check(
                ring_exe, str(REPO / identity_fixture),
                extra_args=["--verify-rc", "--rc-mutate=drop-capture"],
                phase_suite=suite, phase_case=capture_drop_label,
            )
        except subprocess.TimeoutExpired:
            collector.add(TestResult(
                TestResult.FAIL, suite, capture_drop_label, "timed out"))
        else:
            output = strip_ansi(process_output(result))
            failure = None
            if result.returncode == 0:
                failure = "Drop of borrowed exact capture did not fail"
            elif (
                "rc-verify[uaf-drop-borrow]" not in output
                or "capture_slot" not in output
            ):
                failure = (
                    "missing exact capture Drop finding: " + output[:300])
            collector.add(TestResult(
                TestResult.PASS if failure is None else TestResult.FAIL,
                suite, capture_drop_label, failure or "",
            ))


# ---------------------------------------------------------------------------
# Self-compile suite
# ---------------------------------------------------------------------------

def run_self_compile(ring_exe: str, collector: ResultCollector, *,
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
    try:
        ring_exe = find_ring_exe() if needs_ring else None
    except (
        subprocess.CalledProcessError,
        subprocess.TimeoutExpired,
        CompilerPreparationError,
        OSError,
    ) as exc:
        _report_compiler_preparation_failure(exc)
        return 1

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
    needs_runtime = any(suite in suites for suite in ["e2e", "golden"])
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
            ring_exe, collector, name_filter=args.name_filter,
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
