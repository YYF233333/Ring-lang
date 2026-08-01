#!/usr/bin/env python3
"""
Ring-lang Python test runner (B-151 P2).

Replaces the Node-based test harnesses (e2e.test.ts, llvm_diff.test.mjs,
verify_rc.test.mjs, native_selfcompile.test.mjs) with a single Python script
that depends only on the stdlib.

Usage:
    python tests/run_tests.py                        # all suites
    python tests/run_tests.py --suite e2e            # single-file e2e
    python tests/run_tests.py --suite llvm           # golden snapshots
    python tests/run_tests.py --suite rc             # RC verify sweep
    python tests/run_tests.py --suite self-compile   # self-compile x3
    python tests/run_tests.py --suite diff           # dual-backend diff (opt-in)
    python tests/run_tests.py --suite structural     # generated-C structural gates
    python tests/run_tests.py --suite parity         # static evidence matrix
    python tests/run_tests.py --backend=c            # compile via C backend
    python tests/run_tests.py --filter substr        # only cases matching substr
    python tests/run_tests.py --update-golden        # regenerate .expected
"""

from __future__ import annotations

import argparse
import atexit
import filecmp
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

REPO = Path(__file__).resolve().parent.parent
CASES_DIR = REPO / "tests" / "cases"
LLVM_CASES_DIR = CASES_DIR / "llvm"
NATIVE_ONLY_DIR = CASES_DIR / "native_only"
MODULES_DIR = CASES_DIR / "modules"
RC_NEG_DIR = CASES_DIR / "verify_rc"
RUNTIME_CPP = REPO / "ring_runtime.cpp"
RUNTIME_O = REPO / "ring_runtime.o"
DIST_LLVM_DIR = REPO / "compiler" / "dist-llvm"
PARITY_MATRIX = REPO / "tests" / "parity_matrix.json"
STRUCTURAL_DIR = CASES_DIR / "structural"

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
TIMEOUT_RUN = 30       # seconds, per test program execution
TIMEOUT_SELFCOMPILE = 900  # seconds, for self-compile / rc self-verify (600 was
                           # grazed at +2.4k compiler lines after B-163 step 5)

# B-163 Phase 2 parity classification.  These maps intentionally describe
# different scopes: a backend-specific failure must never hide the other
# backend, and check-only failures are independent of codegen entirely.
# Every retained gap carries an actionable reason instead of a bare skip name.
LLVM_BACKEND_GAPS = {
    "tests/cases/default_effect_topo.ring": (
        "LLVM backend access violation; C backend passes "
        "(B-163 Phase2 P2.1 probe 2026-07-27)"
    ),
}

SHARED_POSITIVE_GAPS = {
    "tests/cases/iterator.ring": (
        "both backends access-violate in the shared iterator/runtime path "
        "(B-163 Phase2 P2.1 probe 2026-07-27)"
    ),
    "tests/cases/tuple_eq.ring": (
        "both backends fail the same tuple equality assertion (audit #221)"
    ),
    "tests/cases/tuple_eq_struct.ring": (
        "both backends fail the same structural tuple equality assertion "
        "(audit #221)"
    ),
}

# Positive cases whose `ring check` itself fails today.  Unlike the two maps
# above these are frontend blockers rather than codegen gaps, so every lane
# that would compile or RC-verify the case (llvm, diff, rc) must skip it with
# the same actionable reason.
CHECK_BLOCKED_POSITIVE_GAPS = {
    "tests/cases/llvm/set_ops.ring": (
        "E0503 on `set_from([])`: call-site dict resolution fails closed on "
        "the unsolved element TypeVar before the `Set<Int>` annotation "
        "propagates; pre-existing checker limitation, surfaced when set_from "
        "gained its T: Hash + Eq bound (B-170)"
    ),
}

CHECK_ONLY_GAPS = {}

# Root-level positives that import sibling files and therefore use the
# compiler's project-mode --out-dir contract.
PROJECT_MODE_CASES = {"$compiler_intrinsic$prelude$slot.ring"}

# B-163 step 8: the C backend supports project/module mode (generate_c_project).
C_BACKEND_SUPPORTS_MODULES = True

# Windows-specific clang link flags.
# /MANIFEST:EMBED + /MANIFESTUAC:asInvoker prevents Windows Installer Detection
# from requiring elevation for test exes whose names contain "update"/"install"/etc.
CLANG_LINK_FLAGS = [
    "-lmsvcrt",
    "-Wl,/STACK:536870912",
    "-Wl,/MANIFEST:EMBED",
    "-Wl,/MANIFESTUAC:level='asInvoker'",
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
# Tool discovery
# ---------------------------------------------------------------------------

def find_clang() -> Optional[str]:
    """Return the clang executable path, or None."""
    return shutil.which("clang")


def find_ring_exe() -> Optional[str]:
    """Locate ring.exe: PATH, then project root, then try to build from
    dist-llvm/ .o files."""

    # 1. On PATH
    found = shutil.which("ring")
    if found:
        return found

    # 2. Project root
    exe_name = "ring.exe" if sys.platform == "win32" else "ring"
    root_exe = REPO / exe_name
    if root_exe.is_file():
        return str(root_exe)

    # 3. Build from dist-llvm/ (requires clang + runtime)
    dist_o = DIST_LLVM_DIR / "main.o"
    if not dist_o.is_file():
        return None

    clang = find_clang()
    if clang is None:
        return None

    # Ensure runtime .o exists
    if not ensure_runtime(clang):
        return None

    # Link into a temp directory (cleaned up on process exit via atexit).
    tmpdir = tempfile.mkdtemp(prefix="ring_build_")
    atexit.register(shutil.rmtree, tmpdir, True)
    exe_path = os.path.join(tmpdir, exe_name)

    # ring.exe needs LLVM-C; find the lib dir
    clang_path = Path(shutil.which("clang") or clang)
    llvm_root = clang_path.parent.parent
    llvm_lib_dir = llvm_root / "lib"

    link_cmd = [
        clang, str(dist_o), str(RUNTIME_O),
        "-o", exe_path,
        *CLANG_LINK_FLAGS,
        f"-L{llvm_lib_dir}",
        "-lLLVM-C",
    ]
    try:
        subprocess.run(link_cmd, check=True, capture_output=True, timeout=TIMEOUT_LINK)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        shutil.rmtree(tmpdir, ignore_errors=True)
        return None

    if os.path.isfile(exe_path):
        return exe_path

    shutil.rmtree(tmpdir, ignore_errors=True)
    return None


def ensure_runtime(clang: str) -> bool:
    """Build ring_runtime.o from ring_runtime.cpp if missing or stale."""
    if not RUNTIME_CPP.is_file():
        return False
    if RUNTIME_O.is_file():
        if RUNTIME_O.stat().st_mtime >= RUNTIME_CPP.stat().st_mtime:
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
        subprocess.run(cpp_cmd, check=True, capture_output=True, timeout=TIMEOUT_COMPILE,
                       cwd=str(REPO))
        return RUNTIME_O.is_file()
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        return False


def warn_if_stale_root_exe() -> None:
    """Audit #265 process fix: warn when the root ring.exe predates the
    committed compiler object.

    A stale root ring.exe masked a checker regression (#265) for three days:
    after a merge rebuilt compiler/dist-llvm/main.o, nobody relinked ring.exe,
    so every suite kept exercising the previous compiler. This check never
    fails the run (a PATH exe or a freshly linked temp exe is legitimate);
    it only makes the mismatch impossible to miss. Both paths are derived
    from this script's own location, so worktree checkouts compare their own
    exe against their own dist-llvm. Skipped when either file is absent.
    """
    exe_name = "ring.exe" if sys.platform == "win32" else "ring"
    root_exe = REPO / exe_name
    dist_o = DIST_LLVM_DIR / "main.o"
    if not root_exe.is_file() or not dist_o.is_file():
        return
    if root_exe.stat().st_mtime >= dist_o.stat().st_mtime:
        return
    banner = "!" * 74
    for line in (
        banner,
        f"WARNING: stale root exe: {root_exe}",
        f"         is OLDER than:  {dist_o}",
        "The root ring.exe was not relinked after the last dist-llvm rebuild, so",
        "this run may test a STALE compiler (this masked regression #265 for",
        "three days). Relink it:",
        "  clang compiler/dist-llvm/main.o ring_runtime.o -o ring.exe \\",
        "    -lmsvcrt <link flags from CLAUDE.md>",
        "Note: a `ring` on PATH takes precedence over the root exe for this run;",
        "if the runner is using a PATH exe, verify that one is fresh yourself.",
        banner,
    ):
        print(line, file=sys.stderr)


# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------

def norm(s: str) -> str:
    """Normalize CRLF to LF."""
    return s.replace("\r\n", "\n")


def matches_filter(name: str, name_filter: Optional[str]) -> bool:
    """Case-insensitive substring match; no filter matches everything.

    Backslashes are normalized to '/' so filters like "llvm/" work on Windows.
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


def check_blocked_gap_reason(case_path) -> Optional[str]:
    """Return the frontend-blocker reason for a positive case, if any."""
    key = normalized_repo_path(case_path)
    if key in CHECK_BLOCKED_POSITIVE_GAPS:
        return f"known check-blocked positive: {CHECK_BLOCKED_POSITIVE_GAPS[key]}"
    return None


def positive_gap_reason(case_path, backend: str) -> Optional[str]:
    """Return an execution-gap reason for a positive case/backend, if any."""
    blocked = check_blocked_gap_reason(case_path)
    if blocked:
        return blocked
    key = normalized_repo_path(case_path)
    if key in SHARED_POSITIVE_GAPS:
        return f"known shared positive gap: {SHARED_POSITIVE_GAPS[key]}"
    if backend == "llvm" and key in LLVM_BACKEND_GAPS:
        return f"LLVM backend gap: {LLVM_BACKEND_GAPS[key]}"
    return None


def diff_gap_reason(case_path) -> Optional[str]:
    """Return why a case cannot currently provide a dual-backend oracle."""
    blocked = check_blocked_gap_reason(case_path)
    if blocked:
        return blocked
    key = normalized_repo_path(case_path)
    if key in SHARED_POSITIVE_GAPS:
        return f"known shared positive gap: {SHARED_POSITIVE_GAPS[key]}"
    if key in LLVM_BACKEND_GAPS:
        return f"LLVM oracle unavailable: {LLVM_BACKEND_GAPS[key]}"
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

def ring_build(ring_exe: str, ring_file: str, *,
               out_dir: Optional[str] = None,
               target: str = "llvm",
               extra_args: Optional[List[str]] = None,
               timeout: int = TIMEOUT_COMPILE) -> subprocess.CompletedProcess:
    """Run ring.exe build with an explicit target and optional extra flags."""
    cmd = [ring_exe, "build", ring_file, f"--target={target}"]
    if out_dir:
        # Use --out-dir=<path> (equals-sign) form; ring.exe CLI parser does
        # not accept --out-dir <path> as two separate arguments.
        cmd.append(f"--out-dir={out_dir}")
    if extra_args:
        cmd.extend(extra_args)
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                          cwd=str(REPO))


def ring_check(ring_exe: str, ring_file: str, *,
               extra_args: Optional[List[str]] = None,
               timeout: int = TIMEOUT_COMPILE) -> subprocess.CompletedProcess:
    """Run ring.exe check <file> [extra_args...]."""
    cmd = [ring_exe, "check", ring_file]
    if extra_args:
        cmd.extend(extra_args)
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                          cwd=str(REPO))


def clang_link(clang: str, o_file: str, exe_file: str) -> subprocess.CompletedProcess:
    """Link .o + runtime into an executable."""
    cmd = [clang, o_file, str(RUNTIME_O), "-o", exe_file, *CLANG_LINK_FLAGS]
    return subprocess.run(cmd, capture_output=True, text=True, timeout=TIMEOUT_LINK,
                          cwd=str(REPO))


def run_exe(exe_path: str, timeout: int = TIMEOUT_RUN) -> subprocess.CompletedProcess:
    """Execute a linked test binary."""
    return subprocess.run([exe_path], capture_output=True, text=True, timeout=timeout,
                          cwd=str(REPO))


# ---------------------------------------------------------------------------
# Test-case helpers
# ---------------------------------------------------------------------------

def compile_link_run(ring_exe: str, clang_path: str, ring_file: str,
                     tmpdir: str, *, is_module: bool = False,
                     backend: str = "llvm",
                     expect_panic: bool = False) -> Tuple[bool, str, str]:
    """Compile a .ring file, link, run, return (ok, stdout, error_detail).

    On success, ok=True and stdout contains the program output.
    On failure, ok=False and error_detail describes the failure.

    backend selects the codegen target ("llvm" or "c"). The C backend always
    compiles with --out-dir=<tmpdir> (contract: emits <tmpdir>/<base>.c and
    <tmpdir>/<base>.o) so no artifacts land next to the test sources.
    Linking and running are backend-independent.
    """
    base = Path(ring_file).stem

    if backend == "c" or is_module:
        out_dir = tmpdir
    else:
        out_dir = None

    # Compile
    try:
        r = ring_build(ring_exe, ring_file, out_dir=out_dir, target=backend)
    except subprocess.TimeoutExpired:
        return False, "", "compile timed out"

    if r.returncode != 0:
        return False, "", f"compile failed (exit {r.returncode}): {(r.stderr or r.stdout or '')[:500]}"

    # Locate the .o file
    if out_dir is not None:
        o_file = os.path.join(out_dir, base + ".o")
    else:
        # Single-file LLVM: .o placed next to the .ring file
        o_file = str(Path(ring_file).with_suffix(".o"))

    if not os.path.isfile(o_file):
        return False, "", f".o file not found: {o_file}"

    # Link
    exe_file = os.path.join(tmpdir, base + ".exe")
    try:
        r = clang_link(clang_path, o_file, exe_file)
    except subprocess.TimeoutExpired:
        return False, "", "link timed out"
    finally:
        # Clean up .o if single-file LLVM (placed next to source)
        if out_dir is None and os.path.isfile(o_file):
            os.remove(o_file)
        # Clean up ring_output.ll if generated
        ll_file = REPO / "ring_output.ll"
        if ll_file.is_file():
            ll_file.unlink()

    if r.returncode != 0:
        return False, "", f"link failed (exit {r.returncode}): {(r.stderr or '')[:500]}"

    # Run
    try:
        r = run_exe(exe_file)
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


def run_e2e(ring_exe: str, clang_path: str, collector: ResultCollector, *,
            backend: str = "llvm",
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

            gap_reason = positive_gap_reason(ring_file, backend)
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
                                                  is_module=name in PROJECT_MODE_CASES,
                                                  backend=backend,
                                                  expect_panic=expect_panic)
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
            r = ring_check(ring_exe, str(ring_file))
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

            if backend == "c" and not C_BACKEND_SUPPORTS_MODULES:
                collector.add(TestResult(TestResult.SKIP, suite, f"mod:{mod_name}",
                                         "C backend: project mode not yet supported"))
                continue
            expected_file = main_file.parent / "main.expected"
            expected = norm(expected_file.read_text(encoding="utf-8"))

            # Per-case work dir: module cases all emit "main.o", so a shared
            # directory would let a case that failed to place its artifact
            # silently link a predecessor's main.o and run the wrong binary.
            case_dir = os.path.join(tmpdir, mod_name)
            os.makedirs(case_dir, exist_ok=True)
            ok, stdout, detail = compile_link_run(
                ring_exe, clang_path, str(main_file), case_dir, is_module=True,
                backend=backend)
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
            r = ring_check(ring_exe, str(main_file))
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


# ---------------------------------------------------------------------------
# LLVM golden-snapshot suite
# ---------------------------------------------------------------------------

def run_llvm(ring_exe: str, clang_path: str, collector: ResultCollector,
             *, update_golden: bool = False,
             backend: str = "llvm",
             name_filter: Optional[str] = None) -> None:
    """Run the golden-snapshot regression suite (backend-selectable)."""
    suite = "llvm"
    cases = discover_positive_cases(LLVM_CASES_DIR)
    if not cases:
        print(f"WARNING: no LLVM cases found in {LLVM_CASES_DIR}", file=sys.stderr)
        return

    with tempfile.TemporaryDirectory(prefix="ring_llvm_") as tmpdir:
        for ring_file in cases:
            name = ring_file.name
            expected_file = ring_file.with_suffix(".expected")

            if not matches_filter(name, name_filter):
                continue

            gap_reason = positive_gap_reason(ring_file, backend)
            if gap_reason:
                collector.add(TestResult(
                    TestResult.SKIP, suite, name, gap_reason))
                continue

            ok, stdout, detail = compile_link_run(ring_exe, clang_path, str(ring_file),
                                                  tmpdir, backend=backend)
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
# Dual-backend diff suite (B-163: C backend vs LLVM oracle)
# ---------------------------------------------------------------------------

# Backends compared by --suite diff: (oracle, candidate).
DIFF_BACKENDS = ("llvm", "c")


def run_diff(ring_exe: str, clang_path: str, collector: ResultCollector, *,
             name_filter: Optional[str] = None) -> None:
    """Dual-backend differential suite (plan-c-backend.md §2.3).

    Every positive case -- golden (tests/cases/llvm/), e2e single-file, and
    modules -- is compiled, linked and run under both DIFF_BACKENDS; the
    normalized stdout must match byte-for-byte. Normal golden contents are not
    consulted: the LLVM backend is the oracle, agreement is the assertion.
    The native-only EXPECT_PANIC marker remains a shared handwritten oracle.

    Backend-specific and shared gaps are reported with their exact scope.
    Native-only EXPECT_PANIC cases pass when both backends exit non-zero.
    Module cases are SKIPped while the C backend lacks project mode.
    """
    suite = "diff"
    case_seq = [0]  # mutable counter for unique per-case work dirs

    def diff_one(label: str, ring_file: Path, tmpdir: str, *,
                 is_module: bool = False,
                 expect_panic: bool = False) -> None:
        case_seq[0] += 1
        outputs: List[str] = []
        for side, backend in enumerate(DIFF_BACKENDS):
            side_dir = os.path.join(tmpdir, f"case{case_seq[0]}_side{side}")
            os.makedirs(side_dir)
            ok, stdout, detail = compile_link_run(
                ring_exe, clang_path, str(ring_file), side_dir,
                is_module=is_module, backend=backend,
                expect_panic=expect_panic)
            if not ok:
                collector.add(TestResult(TestResult.FAIL, suite, label,
                                         f"[{backend}] {detail}"))
                return
            outputs.append(norm(stdout))

        if expect_panic:
            collector.add(TestResult(
                TestResult.PASS, suite, label,
                "both backends observed expected panic"))
            return

        if outputs[0] == outputs[1]:
            collector.add(TestResult(TestResult.PASS, suite, label))
        else:
            collector.add(TestResult(
                TestResult.FAIL, suite, label,
                f"backend outputs differ: {DIFF_BACKENDS[0]}={outputs[0][:200]!r}, "
                f"{DIFF_BACKENDS[1]}={outputs[1][:200]!r}"))

    # --- Single-file positive cases: e2e (incl. subdirs) + golden ---
    single = discover_positive_cases(CASES_DIR)
    for subdir_name in EXTRA_NEG_DIRS:
        single.extend(discover_positive_cases(CASES_DIR / subdir_name))
    single.extend(discover_positive_cases(NATIVE_ONLY_DIR))
    single.extend(discover_positive_cases(LLVM_CASES_DIR))

    with tempfile.TemporaryDirectory(prefix="ring_diff_") as tmpdir:
        for ring_file in single:
            name = ring_file.name
            rel = str(ring_file.relative_to(CASES_DIR))

            if not matches_filter(rel, name_filter):
                continue
            gap_reason = diff_gap_reason(ring_file)
            if gap_reason:
                collector.add(TestResult(
                    TestResult.SKIP, suite, rel, gap_reason))
                continue

            expected_raw = ring_file.with_suffix(".expected").read_text(
                encoding="utf-8")
            diff_one(rel, ring_file, tmpdir,
                     is_module=name in PROJECT_MODE_CASES,
                     expect_panic=case_expects_panic(ring_file, expected_raw))

        # --- Module positive cases ---
        for main_file in discover_module_positive(MODULES_DIR):
            mod_name = main_file.parent.name
            label = f"mod:{mod_name}"

            if not matches_filter(label, name_filter):
                continue
            if not C_BACKEND_SUPPORTS_MODULES:
                collector.add(TestResult(TestResult.SKIP, suite, label,
                                         "C backend: project mode not yet supported"))
                continue
            diff_one(label, main_file, tmpdir, is_module=True)


# ---------------------------------------------------------------------------
# Generated-C structural suite (B-163 Phase 2 manual-gate automation)
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
            ring_exe, str(entry), out_dir=str(out_dir), target="c",
            extra_args=extra_args)
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
        ring_exe, entry, temp_root, no_c_lines=False)
    if error:
        return [error]
    off_c, _, error = build_c_artifacts_fresh(
        ring_exe, entry, temp_root, no_c_lines=True)
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


def run_extern_rc_oracle(ring_exe: str, temp_root: Path) -> List[str]:
    """Inspect local generated-C bodies without executing any raw handle."""
    errors = c_probe_mutation_matrix_errors()
    c_path, _, error = build_c_artifacts_fresh(
        ring_exe, EXTERN_RC_FIXTURE, temp_root, no_c_lines=True)
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
                    ring_exe, temp_root, entry, fixtures)
            else:
                errors = run_extern_rc_oracle(ring_exe, temp_root)
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
    "e2e-llvm", "e2e-c", "e2e-diff",
    "llvm-golden", "c-golden", "llvm-diff",
    "native-llvm", "native-c", "native-diff",
    "module-llvm", "module-c", "module-diff",
    "check", "self-compile-c", "c-structural", "manual-source",
}
POSITIVE_PARITY_LANES = PARITY_LANES - {
    "check", "self-compile-c", "c-structural", "manual-source",
}
PARITY_GAP_TABLES = {
    "llvm-backend": LLVM_BACKEND_GAPS,
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

    llvm_paths = discover_positive_cases(LLVM_CASES_DIR)
    native_paths = discover_positive_cases(NATIVE_ONLY_DIR)
    module_paths = discover_module_positive(MODULES_DIR)
    module_check_paths = discover_module_negative(MODULES_DIR)

    e2e = {repo_relative(path) for path in e2e_paths}
    llvm = {repo_relative(path) for path in llvm_paths}
    native = {repo_relative(path) for path in native_paths}
    modules = {repo_relative(path) for path in module_paths}
    checks = {repo_relative(path) for path in check_paths + module_check_paths}
    structural = structural_fixture_paths()

    return {
        "e2e-llvm": e2e,
        "e2e-c": e2e,
        "e2e-diff": e2e,
        "llvm-golden": llvm,
        "c-golden": llvm,
        "llvm-diff": llvm,
        "native-llvm": native,
        "native-c": native,
        "native-diff": native,
        "module-llvm": modules,
        "module-c": modules,
        "module-diff": modules,
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
    if (
        key in LLVM_BACKEND_GAPS
        and lane in {"e2e-llvm", "e2e-diff", "llvm-golden", "llvm-diff"}
    ):
        return LLVM_BACKEND_GAPS[key]
    return None


def expected_gap_lanes(scope: str, evidence: str,
                       members: dict[str, set[str]]) -> Optional[set[str]]:
    """Return the exact skipped lanes for a classified matrix gap."""
    if scope == "check-only":
        return {"check"}
    if evidence in members["e2e-llvm"]:
        if scope == "llvm-backend":
            return {"e2e-llvm", "e2e-diff"}
        if scope == "shared-positive":
            return {"e2e-llvm", "e2e-c", "e2e-diff"}
    if evidence in members["llvm-golden"]:
        if scope == "llvm-backend":
            return {"llvm-golden", "llvm-diff"}
        if scope == "shared-positive":
            return {"llvm-golden", "c-golden", "llvm-diff"}
    return None


def expected_covered_lanes(
    evidence: str,
    members: dict[str, set[str]],
) -> Optional[set[str]]:
    """Return the complete executable bundle required for covered evidence."""
    bundles = [
        ("c-structural", {"c-structural"}),
        ("llvm-golden", {"llvm-golden", "c-golden", "llvm-diff"}),
        ("e2e-llvm", {"e2e-llvm", "e2e-c", "e2e-diff"}),
        ("native-llvm", {"native-llvm", "native-c", "native-diff"}),
        ("module-llvm", {"module-llvm", "module-c", "module-diff"}),
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
    if not C_BACKEND_SUPPORTS_MODULES:
        errors.append(
            "C project/module lanes are disabled but matrix evidence requires them"
        )
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
                    and required_bundle in (
                        {"check"}, {"self-compile-c"}, {"c-structural"})
                ):
                    errors.append(
                        f"{label}: HIR/Pattern covered evidence requires a "
                        "dual-backend executable bundle"
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
                           timeout=TIMEOUT_SELFCOMPILE)
            if r.returncode == 0 and "RC verify: 0 errors" in (r.stdout or ""):
                collector.add(TestResult(TestResult.PASS, suite, "self-verify (compiler/main.ring)"))
            else:
                combined = (r.stdout or "") + (r.stderr or "")
                collector.add(TestResult(
                    TestResult.FAIL, suite, "self-verify (compiler/main.ring)",
                    f"exit {r.returncode}: {combined[:500]}"))
        except subprocess.TimeoutExpired:
            collector.add(TestResult(TestResult.FAIL, suite, "self-verify", f"timed out ({TIMEOUT_SELFCOMPILE}s)"))
    else:
        collector.add(TestResult(TestResult.SKIP, suite, "self-verify", "compiler/main.ring not found"))

    # 2. Positive case sweep: tests/cases/*.ring and tests/cases/llvm/*.ring
    for directory, label in [(CASES_DIR, "cases"), (LLVM_CASES_DIR, "llvm")]:
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
                r = ring_check(ring_exe, str(ring_file), extra_args=["--verify-rc"])
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

    # 3. Negative suite: tests/cases/verify_rc/*.ring — each should trigger
    #    verify-rc errors (the ring check itself may pass or fail; we just need
    #    the verifier to report findings).
    if RC_NEG_DIR.is_dir():
        for ring_file in sorted(RC_NEG_DIR.glob("*.ring")):
            name = f"neg/{ring_file.name}"
            if not matches_filter(name, name_filter):
                continue
            try:
                r = ring_check(ring_exe, str(ring_file), extra_args=["--verify-rc"])
            except subprocess.TimeoutExpired:
                collector.add(TestResult(TestResult.FAIL, suite, name, "timed out"))
                continue

            combined = (r.stdout or "") + (r.stderr or "")
            # The verifier should report findings (rc-verify[...] pattern)
            if "rc-verify[" in combined or "RC verify:" in combined:
                collector.add(TestResult(TestResult.PASS, suite, name))
            else:
                collector.add(TestResult(
                    TestResult.FAIL, suite, name,
                    f"expected verify-rc findings, got: {combined[:300]}"))


# ---------------------------------------------------------------------------
# Self-compile suite
# ---------------------------------------------------------------------------

def run_self_compile(ring_exe: str, collector: ResultCollector, *,
                     backend: str = "llvm",
                     name_filter: Optional[str] = None) -> None:
    """Build the compiler 3x and compare the backend's primary artifact."""
    suite = "self-compile"
    # Coarse-grained: the whole suite is one unit; filter matches the suite name.
    if not matches_filter(suite, name_filter):
        return
    compiler_main = REPO / "compiler" / "main.ring"
    if not compiler_main.is_file():
        collector.add(TestResult(TestResult.SKIP, suite, "all", "compiler/main.ring not found"))
        return

    artifact_name = "main.c" if backend == "c" else "main.o"
    outputs: List[str] = []

    with tempfile.TemporaryDirectory(prefix="ring_selfcompile_") as tmpdir:
        for i in range(1, 4):
            run_dir = os.path.join(tmpdir, f"run{i}")
            os.makedirs(run_dir)

            try:
                r = ring_build(ring_exe, str(compiler_main),
                               out_dir=run_dir, target=backend,
                               timeout=TIMEOUT_SELFCOMPILE)
            except subprocess.TimeoutExpired:
                collector.add(TestResult(
                    TestResult.FAIL, suite, f"run {i}/3",
                    f"timed out ({TIMEOUT_SELFCOMPILE}s)"))
                return

            if r.returncode != 0:
                combined = (r.stdout or "") + (r.stderr or "")
                collector.add(TestResult(
                    TestResult.FAIL, suite, f"run {i}/3",
                    f"exit {r.returncode}: {combined[:500]}"))
                return

            artifact = os.path.join(run_dir, artifact_name)
            if not os.path.isfile(artifact):
                collector.add(TestResult(
                    TestResult.FAIL, suite, f"run {i}/3",
                    f"{artifact_name} not produced for --target={backend}"))
                return

            outputs.append(artifact)
            collector.add(TestResult(
                TestResult.PASS, suite, f"run {i}/3",
                f"{artifact_name} produced via --target={backend}"))

        # Compare outputs: runs 2 and 3 must match run 1 byte-for-byte
        consistent = True
        for i in [1, 2]:
            if not filecmp.cmp(outputs[0], outputs[i], shallow=False):
                collector.add(TestResult(
                    TestResult.FAIL, suite, f"consistency {i+1} vs 1",
                    f"output differs (run {i+1} vs run 1)"))
                consistent = False

        if consistent:
            collector.add(TestResult(
                TestResult.PASS, suite,
                f"consistency ({artifact_name} 3/3 identical)"))


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

def print_summary(collector: ResultCollector) -> None:
    """Print the final summary block."""
    print()
    print("=== Summary ===")
    summary = collector.summary()

    for suite_name in [
        "e2e", "llvm", "diff", "rc", "self-compile", "structural", "parity",
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

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Ring-lang Python test runner (B-151 P2)")
    parser.add_argument(
        "--suite",
        choices=[
            "e2e", "llvm", "rc", "self-compile", "diff", "structural", "parity",
        ],
        action="append", dest="suites",
        help="Test suite(s) to run. Omit for all (diff is opt-in only).")
    parser.add_argument(
        "--backend", choices=["llvm", "c"], default="llvm",
        help="Codegen backend for e2e/llvm positive cases and self-compile "
             "(default: llvm). Negative (check) cases are backend-independent.")
    parser.add_argument(
        "--filter", dest="name_filter", metavar="SUBSTR", default=None,
        help="Only run cases whose name contains SUBSTR (case-insensitive, "
             "applies to all suites).")
    parser.add_argument(
        "--update-golden", action="store_true",
        help="Regenerate .expected golden snapshots instead of comparing.")
    args = parser.parse_args()

    warn_if_stale_root_exe()

    # diff is opt-in: never part of the default all-suites run.
    suites = args.suites or [
        "e2e", "llvm", "rc", "self-compile", "structural", "parity",
    ]

    if args.update_golden and args.backend != "llvm":
        # Golden snapshots are the oracle; only the LLVM backend may write them.
        print("ERROR: --update-golden requires --backend=llvm.", file=sys.stderr)
        return 1

    # --- Tool discovery ---
    needs_ring = any(
        suite in suites
        for suite in ["e2e", "llvm", "diff", "rc", "self-compile", "structural"]
    )
    needs_clang = (
        any(s in suites for s in ["e2e", "llvm", "diff", "structural"])
        or ("self-compile" in suites and args.backend == "c")
    )
    clang_path = find_clang() if needs_clang else None
    ring_exe = find_ring_exe() if needs_ring else None

    if needs_ring and ring_exe is None:
        print("ERROR: ring.exe not found.", file=sys.stderr)
        print("  Looked in: PATH, project root, compiler/dist-llvm/ (tried to build).",
              file=sys.stderr)
        return 1

    if needs_clang and clang_path is None:
        print("ERROR: clang not found (required for executable/codegen suites).",
              file=sys.stderr)
        return 1

    # Ensure runtime .o is built
    if needs_clang and clang_path:
        if not ensure_runtime(clang_path):
            print("ERROR: failed to build ring_runtime.o from ring_runtime.cpp.", file=sys.stderr)
            return 1

    if ring_exe:
        print(f"ring.exe: {ring_exe}")
    if clang_path:
        print(f"clang:    {clang_path}")
    print(f"suites:   {', '.join(suites)}")
    if args.backend != "llvm":
        print(f"backend:  {args.backend}")
    if args.name_filter:
        print(f"filter:   {args.name_filter}")
    print()

    collector = ResultCollector()

    if "e2e" in suites:
        run_e2e(ring_exe, clang_path or "", collector,
                backend=args.backend, name_filter=args.name_filter)

    if "llvm" in suites:
        run_llvm(ring_exe, clang_path or "", collector,
                 update_golden=args.update_golden,
                 backend=args.backend, name_filter=args.name_filter)

    if "diff" in suites:
        run_diff(ring_exe, clang_path or "", collector,
                 name_filter=args.name_filter)

    if "rc" in suites:
        run_rc(ring_exe, collector, name_filter=args.name_filter)

    if "self-compile" in suites:
        run_self_compile(ring_exe, collector, backend=args.backend,
                         name_filter=args.name_filter)

    if "structural" in suites:
        run_structural(ring_exe, collector, name_filter=args.name_filter)

    if "parity" in suites:
        run_parity(collector, name_filter=args.name_filter)

    if args.name_filter and not collector.results:
        collector.add(TestResult(
            TestResult.FAIL, "runner", "filter",
            f"no selected suite matched {args.name_filter!r}"))

    print_summary(collector)
    return 1 if collector.failures > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
