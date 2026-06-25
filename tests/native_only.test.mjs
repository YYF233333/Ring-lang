// Native-only semantic tests (oracle-blind).
//
// These test cases exercise native (LLVM) behaviour that CANNOT be validated by
// the JS backend (the JS oracle is wrong in these corners).  Each .ring file is
// compiled with --target=llvm, linked, and executed; the stdout is compared
// against a hand-written .expected file.
//
// Special mode:  If the first non-blank line of the .expected file is exactly
// "// EXPECT_PANIC", the harness asserts a non-zero exit code instead of
// comparing output.  These tests document desired panic semantics that may not
// yet be implemented (e.g. divzero); they are recorded as known failures when
// the program exits 0.
//
// Requires a native toolchain (clang) + ring_runtime.cpp.  If clang is
// unavailable, every test is skipped.
//
// Run from the compiler/ dir:  node --test ../tests/native_only.test.mjs

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const RING = path.join(REPO, "compiler", "dist", "main.js");
const CASES = path.join(REPO, "tests", "cases", "native_only");
const RUNTIME_CPP = path.join(REPO, "ring_runtime.cpp");
const RUNTIME_O = path.join(REPO, "ring_runtime.o");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function have(cmd) {
  try { execSync(cmd, { stdio: "pipe" }); return true; } catch { return false; }
}
const HAVE_CLANG = have("clang --version");

function sh(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: REPO,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 60000,
    ...opts,
  });
}

function buildRuntime() {
  if (fs.existsSync(RUNTIME_O) &&
      fs.statSync(RUNTIME_O).mtimeMs >= fs.statSync(RUNTIME_CPP).mtimeMs) return;
  sh(`clang++ -c "${RUNTIME_CPP}" -o "${RUNTIME_O}" -std=c++17 -O0 -D_CRT_SECURE_NO_WARNINGS`);
}

/** Compile + link + run a single .ring file via the LLVM backend. */
function runLlvm(ringFile) {
  const base = ringFile.replace(/\.ring$/, "");
  const oFile = base + ".o";
  const exeFile = base + ".exe";
  try {
    sh(`node "${RING}" build "${ringFile}" --target=llvm`);
    sh(`clang "${oFile}" "${RUNTIME_O}" -o "${exeFile}" -lmsvcrt -Wl,/STACK:536870912 -Wl,/MANIFEST:EMBED -Wl,/MANIFESTUAC:level='asInvoker'`);
    const stdout = sh(`"${exeFile}"`);
    return { stdout, exitCode: 0 };
  } catch (e) {
    // Non-zero exit: capture whatever stdout was produced.
    return { stdout: (e.stdout || ""), exitCode: e.status ?? 1 };
  } finally {
    fs.rmSync(oFile, { force: true });
    fs.rmSync(exeFile, { force: true });
    fs.rmSync(path.join(REPO, "ring_output.ll"), { force: true });
  }
}

function norm(s) { return s.replace(/\r\n/g, "\n").replace(/\n$/, ""); }

function isExpectPanic(expectedRaw) {
  const first = expectedRaw.trim().split("\n")[0].trim();
  return first === "// EXPECT_PANIC";
}

// ---------------------------------------------------------------------------
// Discover cases
// ---------------------------------------------------------------------------

const caseFiles = fs.existsSync(CASES)
  ? fs.readdirSync(CASES).filter(f => f.endsWith(".ring")).sort()
  : [];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("native-only semantic tests (oracle-blind)", () => {
  before(() => { if (HAVE_CLANG) buildRuntime(); });

  for (const f of caseFiles) {
    const ringFile = path.join(CASES, f);
    const expectedFile = ringFile.replace(/\.ring$/, ".expected");

    // Skip if no .expected companion.
    const hasExpected = fs.existsSync(expectedFile);
    const expectedRaw = hasExpected ? fs.readFileSync(expectedFile, "utf-8") : "";
    const panicTest = hasExpected && isExpectPanic(expectedRaw);

    const skip = !HAVE_CLANG ? "clang not available" : !hasExpected ? "no .expected file" : false;

    test(f, { skip }, () => {
      const { stdout, exitCode } = runLlvm(ringFile);

      if (panicTest) {
        // Panic test: the program SHOULD exit with non-zero.
        assert.notStrictEqual(exitCode, 0,
          `${f}: expected panic (non-zero exit) but process exited 0. stdout: ${norm(stdout)}`);
      } else {
        // Normal test: compare stdout against .expected.
        assert.strictEqual(
          norm(stdout),
          norm(expectedRaw),
          `Output mismatch for ${f}\n--- expected ---\n${norm(expectedRaw)}\n--- actual ---\n${norm(stdout)}`
        );
      }
    });
  }
});
