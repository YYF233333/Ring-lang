// LLVM backend golden-snapshot regression tests.
//
// For each case in tests/cases/llvm/, compile and run it with the LLVM backend,
// then assert the output matches the golden snapshot in the corresponding
// .expected file. These guard the fixes from the LLVM self-hosting work
// (tuple-match tag checks, OR-patterns, Set iteration, generic Eq/Ord dispatch,
// List.contains, fail/catch via ring_try, nested named patterns, field ordering).
//
// Golden snapshots are checked in as tests/cases/llvm/<name>.expected.
// To regenerate all snapshots:
//   node --test ../tests/llvm_diff.test.mjs --update-golden
// or for a single case:
//   node --test ../tests/llvm_diff.test.mjs --update-golden=<name>.ring
//
// Requires a native toolchain (clang) + ring_runtime.cpp. If clang is unavailable
// (e.g. CI without LLVM), every test is skipped rather than failing.
//
// Run from the compiler/ dir:  node --test ../tests/llvm_diff.test.mjs
// or via:                      npm run test:llvm

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const RING = path.join(REPO, "compiler", "dist", "main.js");
const CASES = path.join(REPO, "tests", "cases", "llvm");
const RUNTIME_CPP = path.join(REPO, "ring_runtime.cpp");
const RUNTIME_O = path.join(REPO, "ring_runtime.o");

// --update-golden or --update-golden=<file> flag: regenerate golden snapshots
// instead of comparing against them.
const UPDATE_GOLDEN_ARG = process.argv.find(a => a.startsWith("--update-golden"));
const UPDATE_GOLDEN = !!UPDATE_GOLDEN_ARG;
const UPDATE_GOLDEN_FILTER = UPDATE_GOLDEN_ARG && UPDATE_GOLDEN_ARG.includes("=")
  ? UPDATE_GOLDEN_ARG.split("=")[1]
  : null;

function have(cmd) {
  try { execSync(cmd, { stdio: "pipe" }); return true; } catch { return false; }
}
const HAVE_CLANG = have("clang --version");

function sh(cmd) {
  return execSync(cmd, { cwd: REPO, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 60000 });
}

function buildRuntime() {
  // Rebuild if missing or older than the source.
  if (fs.existsSync(RUNTIME_O) &&
      fs.statSync(RUNTIME_O).mtimeMs >= fs.statSync(RUNTIME_CPP).mtimeMs) return;
  sh(`clang++ -c "${RUNTIME_CPP}" -o "${RUNTIME_O}" -std=c++17 -O0 -D_CRT_SECURE_NO_WARNINGS`);
}

function runLlvm(ringFile) {
  const base = ringFile.replace(/\.ring$/, "");
  const oFile = base + ".o";
  const exeFile = base + ".exe";
  try {
    sh(`node "${RING}" build "${ringFile}" --target=llvm`);
    // Big stack: a few cases recurse; LLVM native default stack is 1MB.
    // Embedded asInvoker manifest (audit #155): without a manifest, Windows
    // installer-detection heuristics demand elevation for exe names containing
    // update/setup/install/patch (e.g. struct_update_enum.exe) -> launch fails
    // with ERROR_ELEVATION_REQUIRED or hangs on the consent path. The manifest
    // makes any case name immune.
    sh(`clang "${oFile}" "${RUNTIME_O}" -o "${exeFile}" -lmsvcrt -Wl,/STACK:536870912 -Wl,/MANIFEST:EMBED -Wl,/MANIFESTUAC:level='asInvoker'`);
    return sh(`"${exeFile}"`);
  } finally {
    fs.rmSync(oFile, { force: true });
    fs.rmSync(exeFile, { force: true });
    fs.rmSync(path.join(REPO, "ring_output.ll"), { force: true });
  }
}

function readGolden(ringFile) {
  const expectedFile = ringFile.replace(/\.ring$/, ".expected");
  if (!fs.existsSync(expectedFile)) {
    throw new Error(
      `Golden snapshot not found: ${expectedFile}\n` +
      `Run with --update-golden to generate it.`
    );
  }
  return fs.readFileSync(expectedFile, "utf-8");
}

function writeGolden(ringFile, output) {
  const expectedFile = ringFile.replace(/\.ring$/, ".expected");
  fs.writeFileSync(expectedFile, output, "utf-8");
}

// Normalize line endings: the native exe writes CRLF via Windows text-mode
// stdout, node writes LF. We compare logical output, not byte encoding.
const norm = (s) => s.replace(/\r\n/g, "\n");

const caseFiles = fs.existsSync(CASES)
  ? fs.readdirSync(CASES).filter(f => f.endsWith(".ring")).sort()
  : [];

describe("llvm backend golden-snapshot regression", () => {
  before(() => { if (HAVE_CLANG) buildRuntime(); });

  for (const f of caseFiles) {
    const skip = !HAVE_CLANG ? "clang not available" : false;
    test(`${f}`, { skip }, () => {
      const ringFile = path.join(CASES, f);
      const llvmOut = norm(runLlvm(ringFile));

      if (UPDATE_GOLDEN && (!UPDATE_GOLDEN_FILTER || UPDATE_GOLDEN_FILTER === f)) {
        writeGolden(ringFile, llvmOut);
        return; // snapshot updated, no comparison
      }

      const golden = readGolden(ringFile);
      assert.strictEqual(llvmOut, golden,
        `LLVM output diverged from golden snapshot for ${f}\n` +
        `--- golden ---\n${golden}\n--- actual ---\n${llvmOut}\n` +
        `Run with --update-golden=${f} to update the snapshot.`);
    });
  }
});
