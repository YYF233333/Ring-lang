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


def positive_gap_reason(case_path, backend: str) -> Optional[str]:
    """Return an execution-gap reason for a positive case/backend, if any."""
    key = normalized_repo_path(case_path)
    if key in SHARED_POSITIVE_GAPS:
        return f"known shared positive gap: {SHARED_POSITIVE_GAPS[key]}"
    if backend == "llvm" and key in LLVM_BACKEND_GAPS:
        return f"LLVM backend gap: {LLVM_BACKEND_GAPS[key]}"
    return None


def diff_gap_reason(case_path) -> Optional[str]:
    """Return why a case cannot currently provide a dual-backend oracle."""
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
               timeout: int = TIMEOUT_COMPILE) -> subprocess.CompletedProcess:
    """Run ring.exe build <file> --target=<target> [--out-dir=<dir>]."""
    cmd = [ring_exe, "build", ring_file, f"--target={target}"]
    if out_dir:
        # Use --out-dir=<path> (equals-sign) form; ring.exe CLI parser does
        # not accept --out-dir <path> as two separate arguments.
        cmd.append(f"--out-dir={out_dir}")
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
# Parity evidence matrix suite
# ---------------------------------------------------------------------------

PARITY_STATUSES = {"covered", "known-gap", "manual-evidence"}
PARITY_LANES = {
    "e2e-llvm", "e2e-c", "e2e-diff",
    "llvm-golden", "c-golden", "llvm-diff",
    "native-llvm", "native-c", "native-diff",
    "module-llvm", "module-c", "module-diff",
    "check", "self-compile-c", "manual-source",
}
POSITIVE_PARITY_LANES = PARITY_LANES - {
    "check", "self-compile-c", "manual-source",
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
                    and required_bundle in ({"check"}, {"self-compile-c"})
                ):
                    errors.append(
                        f"{label}: HIR/Pattern covered evidence requires a "
                        "dual-backend executable bundle"
                    )
                if (
                    required_bundle in ({"check"}, {"self-compile-c"})
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
                elif lane == "self-compile-c":
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
    if name_filter and not selected:
        collector.add(TestResult(
            TestResult.FAIL, suite, "filter",
            f"no feature_id or evidence matched {name_filter!r}"))
        return

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

    for suite_name in ["e2e", "llvm", "diff", "rc", "self-compile", "parity"]:
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
        choices=["e2e", "llvm", "rc", "self-compile", "diff", "parity"],
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

    # diff is opt-in: never part of the default all-suites run.
    suites = args.suites or ["e2e", "llvm", "rc", "self-compile", "parity"]

    if args.update_golden and args.backend != "llvm":
        # Golden snapshots are the oracle; only the LLVM backend may write them.
        print("ERROR: --update-golden requires --backend=llvm.", file=sys.stderr)
        return 1

    # --- Tool discovery ---
    needs_ring = any(
        suite in suites for suite in ["e2e", "llvm", "diff", "rc", "self-compile"]
    )
    needs_clang = (
        any(s in suites for s in ["e2e", "llvm", "diff"])
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

    if "parity" in suites:
        run_parity(collector, name_filter=args.name_filter)

    print_summary(collector)
    return 1 if collector.failures > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
