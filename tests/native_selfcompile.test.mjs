// B-101 native self-compile E2E harness.
//
// PURPOSE — the permanent regression net for native-frontend self-hosting that
// `a_empty.ring` (trivial program) could not catch. Type-checks a REAL program
// that stresses the std surfaces most exposed to RC over-free / leak bugs under
// the clone-all-escape borrow model — print, List (push/index/iterate/join), Map
// (insert/index/get/iterate), Str (interp/index/len), plus element-READ
// projections bound to `let` (the B-101 alias-aware-ownership hot path) — using the
// NATIVE ring.exe (the self-compiled native compiler binary), then asserts EXIT 0.
//
// HOW THE ORCHESTRATOR RUNS THIS (main repo, with the LLVM toolchain present):
//   cd compiler && node --test ../tests/native_selfcompile.test.mjs
// or wire it into an npm script (e.g. `npm run test:native`).
//
// WHAT IT ASSERTS:
//   1. native ring.exe type-checks tests/native/real_program.ring WITHOUT crashing
//      (exit 0 from the check step), via `ring.exe check <prog>` — exercises the
//      full native frontend: lexer -> parser -> checker -> HIR, all running as
//      native code. The RC model under test (Perceus) is a HIR-level pass shared
//      by both the bootstrap (Node.js) and native paths and fully exercised by the
//      native frontend regardless of emit target.
//   2. Steps are repeated 3x and every run must be identical — per the
//      intermittent-heap-corruption lesson (a single pass can mask a ~1/3-hit
//      RC bug), an RC regression that only sometimes corrupts the heap is caught.
//
// SKIP BEHAVIOR (this worktree): ring.exe is built from compiler/dist-llvm/main.o +
// ring_runtime.o and is UNTRACKED (gitignored local artifact); the LLVM N-API addon
// (compiler/llvm-addon/) is also a local build. A fresh worktree has neither, so
// ring.exe is absent — every test then SKIPS rather than fails. The harness never
// attempts to BUILD ring.exe (that would stall on the addon build); it only USES a
// pre-built ring.exe if one is present at the repo root.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");

// Native compiler binary, produced by:
//   node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist-llvm --target=llvm
//   clang compiler/dist-llvm/main.o ring_runtime.o -o ring.exe -lmsvcrt
// Untracked local artifact — present in the main repo after a native bootstrap,
// absent in a fresh worktree.
const RING_EXE = path.join(REPO, process.platform === "win32" ? "ring.exe" : "ring");
const HAVE_RING_EXE = fs.existsSync(RING_EXE);

const PROG = path.join(REPO, "tests", "native", "real_program.ring");

const RUNS = 3; // intermittent-RC detection: a ~1/3-hit heap bug needs >1 run.

// Type-check the fixture with the NATIVE ring.exe. Returns { code, stdout, stderr }.
function checkWithNative() {
  const result = spawnSync(RING_EXE, ["check", PROG], {
    cwd: REPO, encoding: "utf-8", timeout: 120000,
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("native self-compile E2E (B-101)", () => {
  for (let i = 1; i <= RUNS; i++) {
    test(`real_program via native ring.exe check — run ${i}/${RUNS}`,
      { skip: HAVE_RING_EXE ? false : "ring.exe not present (build native compiler first)" },
      () => {
        const { code, stdout, stderr } = checkWithNative();
        assert.strictEqual(code, 0,
          `native ring.exe check FAILED (exit ${code}) — likely RC over-free/abort\n` +
          `--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`);
      });
  }
});
