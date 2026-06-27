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
    python tests/run_tests.py --update-golden        # regenerate .expected
"""

from __future__ import annotations

import argparse
import atexit
import filecmp
import os
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
MODULES_DIR = CASES_DIR / "modules"
RC_NEG_DIR = CASES_DIR / "verify_rc"
RUNTIME_CPP = REPO / "ring_runtime.cpp"
RUNTIME_O = REPO / "ring_runtime.o"
DIST_LLVM_DIR = REPO / "compiler" / "dist-llvm"

# Subdirectories within tests/cases/ that also contain negative test cases.
EXTRA_NEG_DIRS = ["negative", "errors"]

TIMEOUT_COMPILE = 60   # seconds, for ring.exe build / check
TIMEOUT_LINK = 60      # seconds, for clang link
TIMEOUT_RUN = 30       # seconds, per test program execution
TIMEOUT_SELFCOMPILE = 600  # seconds, for self-compile

# Cases not yet supported by the LLVM backend; skipped but reported.
LLVM_SKIP = {
    "default_effect_body_io.ring",
    "default_effect_topo.ring",
    "mod_effect_evidence.ring",
    "api_clone.ring",
    "map_clone.ring",
    "iterator.ring",
    "map_iteration.ring",
    "set_struct_eq.ring",
    "set_ops_deep_eq.ring",
    "trait_alias.ring",
    "scc_mutual_recursion.ring",
}

# Windows-specific clang link flags.
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
        "-std=c++17", "-O0", "-D_CRT_SECURE_NO_WARNINGS",
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


# ---------------------------------------------------------------------------
# Compile + link + run helpers
# ---------------------------------------------------------------------------

def ring_build(ring_exe: str, ring_file: str, *,
               out_dir: Optional[str] = None,
               timeout: int = TIMEOUT_COMPILE) -> subprocess.CompletedProcess:
    """Run ring.exe build <file> --target=llvm [--out-dir=<dir>]."""
    cmd = [ring_exe, "build", ring_file, "--target=llvm"]
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
                     tmpdir: str, *, is_module: bool = False) -> Tuple[bool, str, str]:
    """Compile a .ring file, link, run, return (ok, stdout, error_detail).

    On success, ok=True and stdout contains the program output.
    On failure, ok=False and error_detail describes the failure.
    """
    base = Path(ring_file).stem

    if is_module:
        out_dir = tmpdir
    else:
        out_dir = None

    # Compile
    try:
        r = ring_build(ring_exe, ring_file, out_dir=out_dir)
    except subprocess.TimeoutExpired:
        return False, "", "compile timed out"

    if r.returncode != 0:
        return False, "", f"compile failed (exit {r.returncode}): {(r.stderr or r.stdout or '')[:500]}"

    # Locate the .o file
    if is_module:
        o_file = os.path.join(tmpdir, base + ".o")
    else:
        # Single-file: .o placed next to the .ring file
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
        # Clean up .o if single-file (placed next to source)
        if not is_module and os.path.isfile(o_file):
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


def run_e2e(ring_exe: str, clang_path: str, collector: ResultCollector) -> None:
    """Run the E2E test suite."""
    suite = "e2e"

    # --- Positive single-file cases ---
    positive = discover_positive_cases(CASES_DIR)
    # Also include cases from subdirectories (negative/, errors/) that have .expected
    for subdir_name in EXTRA_NEG_DIRS:
        subdir = CASES_DIR / subdir_name
        positive.extend(discover_positive_cases(subdir))

    with tempfile.TemporaryDirectory(prefix="ring_e2e_") as tmpdir:
        for ring_file in positive:
            name = ring_file.name
            rel = ring_file.relative_to(CASES_DIR)

            if name in LLVM_SKIP:
                collector.add(TestResult(TestResult.SKIP, suite, str(rel), "LLVM_SKIP"))
                continue

            expected_file = ring_file.with_suffix(".expected")
            expected = norm(expected_file.read_text(encoding="utf-8"))

            ok, stdout, detail = compile_link_run(ring_exe, clang_path, str(ring_file), tmpdir)
            if not ok:
                collector.add(TestResult(TestResult.FAIL, suite, str(rel), detail))
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
        error_file = ring_file.with_suffix(".error")
        pattern = error_file.read_text(encoding="utf-8").strip()

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

        # Check all output (stdout + stderr) for the pattern
        combined = (r.stdout or "") + (r.stderr or "")
        if pattern.lower() in combined.lower():
            collector.add(TestResult(TestResult.PASS, suite, f"neg:{rel}"))
        else:
            collector.add(TestResult(
                TestResult.FAIL, suite, f"neg:{rel}",
                f'expected pattern "{pattern}" in output, got: {combined[:300]}'))

    # --- Module positive ---
    mod_positive = discover_module_positive(MODULES_DIR)
    with tempfile.TemporaryDirectory(prefix="ring_mod_") as tmpdir:
        for main_file in mod_positive:
            mod_name = main_file.parent.name
            expected_file = main_file.parent / "main.expected"
            expected = norm(expected_file.read_text(encoding="utf-8"))

            ok, stdout, detail = compile_link_run(
                ring_exe, clang_path, str(main_file), tmpdir, is_module=True)
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
        error_file = main_file.parent / "main.error"
        pattern = error_file.read_text(encoding="utf-8").strip()

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
        if pattern.lower() in combined.lower():
            collector.add(TestResult(TestResult.PASS, suite, f"mod-neg:{mod_name}"))
        else:
            collector.add(TestResult(
                TestResult.FAIL, suite, f"mod-neg:{mod_name}",
                f'expected "{pattern}" in output, got: {combined[:300]}'))


# ---------------------------------------------------------------------------
# LLVM golden-snapshot suite
# ---------------------------------------------------------------------------

def run_llvm(ring_exe: str, clang_path: str, collector: ResultCollector,
             *, update_golden: bool = False) -> None:
    """Run the LLVM golden-snapshot regression suite."""
    suite = "llvm"
    cases = discover_positive_cases(LLVM_CASES_DIR)
    if not cases:
        print(f"WARNING: no LLVM cases found in {LLVM_CASES_DIR}", file=sys.stderr)
        return

    with tempfile.TemporaryDirectory(prefix="ring_llvm_") as tmpdir:
        for ring_file in cases:
            name = ring_file.name
            expected_file = ring_file.with_suffix(".expected")

            ok, stdout, detail = compile_link_run(ring_exe, clang_path, str(ring_file), tmpdir)
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
# RC verify suite
# ---------------------------------------------------------------------------

def run_rc(ring_exe: str, collector: ResultCollector) -> None:
    """Run the RC verify suite."""
    suite = "rc"

    # 1. Self-verify: compiler/main.ring --verify-rc
    compiler_main = REPO / "compiler" / "main.ring"
    if compiler_main.is_file():
        try:
            r = ring_check(ring_exe, str(compiler_main),
                           extra_args=["--verify-rc"],
                           timeout=300)
            if r.returncode == 0 and "RC verify: 0 errors" in (r.stdout or ""):
                collector.add(TestResult(TestResult.PASS, suite, "self-verify (compiler/main.ring)"))
            else:
                combined = (r.stdout or "") + (r.stderr or "")
                collector.add(TestResult(
                    TestResult.FAIL, suite, "self-verify (compiler/main.ring)",
                    f"exit {r.returncode}: {combined[:500]}"))
        except subprocess.TimeoutExpired:
            collector.add(TestResult(TestResult.FAIL, suite, "self-verify", "timed out (300s)"))
    else:
        collector.add(TestResult(TestResult.SKIP, suite, "self-verify", "compiler/main.ring not found"))

    # 2. Positive case sweep: tests/cases/*.ring and tests/cases/llvm/*.ring
    for directory, label in [(CASES_DIR, "cases"), (LLVM_CASES_DIR, "llvm")]:
        positive = discover_positive_cases(directory)
        for ring_file in positive:
            name = f"{label}/{ring_file.name}"
            try:
                r = ring_check(ring_exe, str(ring_file), extra_args=["--verify-rc"])
            except subprocess.TimeoutExpired:
                collector.add(TestResult(TestResult.FAIL, suite, name, "timed out"))
                continue

            if r.returncode == 0:
                collector.add(TestResult(TestResult.PASS, suite, name))
            else:
                combined = (r.stdout or "") + (r.stderr or "")
                collector.add(TestResult(
                    TestResult.FAIL, suite, name,
                    f"exit {r.returncode}: {combined[:300]}"))

    # 3. Negative suite: tests/cases/verify_rc/*.ring — each should trigger
    #    verify-rc errors (the ring check itself may pass or fail; we just need
    #    the verifier to report findings).
    if RC_NEG_DIR.is_dir():
        for ring_file in sorted(RC_NEG_DIR.glob("*.ring")):
            name = f"neg/{ring_file.name}"
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

def run_self_compile(ring_exe: str, collector: ResultCollector) -> None:
    """Run the self-compile suite: build compiler 3x, outputs must be identical."""
    suite = "self-compile"
    compiler_main = REPO / "compiler" / "main.ring"
    if not compiler_main.is_file():
        collector.add(TestResult(TestResult.SKIP, suite, "all", "compiler/main.ring not found"))
        return

    outputs: List[str] = []  # paths to main.o from each run

    with tempfile.TemporaryDirectory(prefix="ring_selfcompile_") as tmpdir:
        for i in range(1, 4):
            run_dir = os.path.join(tmpdir, f"run{i}")
            os.makedirs(run_dir)

            try:
                r = ring_build(ring_exe, str(compiler_main),
                               out_dir=run_dir, timeout=TIMEOUT_SELFCOMPILE)
            except subprocess.TimeoutExpired:
                collector.add(TestResult(
                    TestResult.FAIL, suite, f"run {i}/3", "timed out (600s)"))
                return

            if r.returncode != 0:
                combined = (r.stdout or "") + (r.stderr or "")
                collector.add(TestResult(
                    TestResult.FAIL, suite, f"run {i}/3",
                    f"exit {r.returncode}: {combined[:500]}"))
                return

            o_file = os.path.join(run_dir, "main.o")
            if not os.path.isfile(o_file):
                collector.add(TestResult(
                    TestResult.FAIL, suite, f"run {i}/3", "main.o not produced"))
                return

            outputs.append(o_file)
            collector.add(TestResult(TestResult.PASS, suite, f"run {i}/3"))

        # Compare outputs: runs 2 and 3 must match run 1 byte-for-byte
        consistent = True
        for i in [1, 2]:
            if not filecmp.cmp(outputs[0], outputs[i], shallow=False):
                collector.add(TestResult(
                    TestResult.FAIL, suite, f"consistency {i+1} vs 1",
                    f"output differs (run {i+1} vs run 1)"))
                consistent = False

        if consistent:
            collector.add(TestResult(TestResult.PASS, suite, "consistency (3/3 identical)"))


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

def print_summary(collector: ResultCollector) -> None:
    """Print the final summary block."""
    print()
    print("=== Summary ===")
    summary = collector.summary()

    for suite_name in ["e2e", "llvm", "rc", "self-compile"]:
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
        "--suite", choices=["e2e", "llvm", "rc", "self-compile"],
        action="append", dest="suites",
        help="Test suite(s) to run. Omit for all.")
    parser.add_argument(
        "--update-golden", action="store_true",
        help="Regenerate .expected golden snapshots instead of comparing.")
    args = parser.parse_args()

    suites = args.suites or ["e2e", "llvm", "rc", "self-compile"]

    # --- Tool discovery ---
    clang_path = find_clang()
    ring_exe = find_ring_exe()

    needs_clang = any(s in suites for s in ["e2e", "llvm"])

    if ring_exe is None:
        print("ERROR: ring.exe not found.", file=sys.stderr)
        print("  Looked in: PATH, project root, compiler/dist-llvm/ (tried to build).",
              file=sys.stderr)
        return 1

    if needs_clang and clang_path is None:
        print("ERROR: clang not found (required for e2e / llvm suites).", file=sys.stderr)
        return 1

    # Ensure runtime .o is built
    if needs_clang and clang_path:
        if not ensure_runtime(clang_path):
            print("ERROR: failed to build ring_runtime.o from ring_runtime.cpp.", file=sys.stderr)
            return 1

    print(f"ring.exe: {ring_exe}")
    if clang_path:
        print(f"clang:    {clang_path}")
    print(f"suites:   {', '.join(suites)}")
    print()

    collector = ResultCollector()

    if "e2e" in suites:
        run_e2e(ring_exe, clang_path or "", collector)

    if "llvm" in suites:
        run_llvm(ring_exe, clang_path or "", collector,
                 update_golden=args.update_golden)

    if "rc" in suites:
        run_rc(ring_exe, collector)

    if "self-compile" in suites:
        run_self_compile(ring_exe, collector)

    print_summary(collector)
    return 1 if collector.failures > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
