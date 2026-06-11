// B-104 D2: static RC leak/UAF verifier — npm-test integration.
//
// Three layers:
//   1. SELF-VERIFY: the compiler itself must verify clean (0 fatal findings)
//      through the CLI (`ring check compiler/main.ring --verify-rc`) — the
//      "compile-time proof of 0 leaks / 0 UAF at the HIR level, modulo the
//      documented exemption classes" acceptance gate, and the regression net
//      against RC-pass coverage decay (a new un-dropped position class or a
//      drop-of-borrow shows up here as a fatal finding).
//   2. CASE SWEEP: every LLVM differential case (tests/cases/llvm/*.ring, the
//      RC-locked suite) verifies clean in-process.
//   3. NEGATIVE SUITE: constructed leak/UAF inputs must make the verifier
//      report — including the two B-109 regression instances (① struct-field
//      reassignment drop-old, ② call-result Option/Str temporaries) and the
//      drop-borrow UAF direction.  ② and the UAF case use the TEST-ONLY
//      --rc-mutate degradations (skip-anf / drop-params): a correct pass
//      produces verifiable output, so regressions are SIMULATED to prove the
//      verifier catches them.
//
// In-process verification mirrors cli.ring's single-file path:
//   parse → check → perceus_transform_mutated → verify_rc_program.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { parse } from "../compiler/dist/parser.js";
import { check } from "../compiler/dist/checker.js";
import { new_collecting_sink } from "../compiler/dist/diagnostics.js";
import { perceus_transform_mutated } from "../compiler/dist/perceus.js";
import { verify_rc_program } from "../compiler/dist/verify_rc.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const RING = path.join(REPO, "compiler", "dist", "main.js");
const LLVM_CASES = path.join(REPO, "tests", "cases", "llvm");
const NEG_CASES = path.join(REPO, "tests", "cases", "verify_rc");

function has_errors(sink) {
  return sink.items.some((d) => d.severity._tag === "SevError");
}

// In-process single-file verify; returns the findings list (Ring RcFinding
// objects: { class, fatal, message, fn_name, span }).
function verifyFile(filePath, mutate = "") {
  const source = fs.readFileSync(filePath, "utf-8");
  const sink = new_collecting_sink();
  const ast = parse(source, filePath, sink);
  if (has_errors(sink)) throw new Error(`Parse error in ${filePath}`);
  const fail_ev = { raise: (err) => { throw { _effect: "fail", _value: err }; } };
  const csink = new_collecting_sink();
  const result = check(ast, csink, fail_ev);
  if (has_errors(csink)) {
    throw new Error(`Type error in ${filePath}: ${csink.items.map((d) => d.message).join("; ")}`);
  }
  const rc = perceus_transform_mutated(result.program, mutate);
  return verify_rc_program(rc);
}

const fatals = (findings) => findings.filter((f) => f.fatal);
const ofClass = (findings, cls) => findings.filter((f) => f.class === cls);
// check() folds the std prelude into the program; scope assertions to the
// case file itself.
const inFile = (findings, filePath) => findings.filter((f) => f.span.file === filePath);

function runCli(args) {
  try {
    const stdout = execFileSync("node", [RING, ...args], {
      cwd: REPO, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 300000,
    });
    return { code: 0, stdout };
  } catch (e) {
    return { code: e.status ?? -1, stdout: (e.stdout ?? "") + (e.stderr ?? "") };
  }
}

// ------------------------------------------------------------
// 1. Self-verify (CLI, multi-file): the acceptance gate.
// ------------------------------------------------------------

describe("verify-rc: compiler self-verify", () => {
  test("compiler/main.ring verifies clean (0 fatal findings) via --verify-rc", () => {
    const r = runCli(["check", path.join(REPO, "compiler", "main.ring"), "--verify-rc"]);
    assert.equal(r.code, 0, `--verify-rc exit ${r.code}:\n${r.stdout.slice(0, 4000)}`);
    assert.match(r.stdout, /RC verify: 0 errors/);
    assert.match(r.stdout, /HIR-level proof/); // boundary note present
  });
});

// ------------------------------------------------------------
// 2. Case sweep: the RC-locked LLVM differential suite verifies clean.
// ------------------------------------------------------------

describe("verify-rc: llvm differential cases verify clean", () => {
  const cases = fs.readdirSync(LLVM_CASES).filter((f) => f.endsWith(".ring")).sort();
  for (const f of cases) {
    test(f, () => {
      const findings = verifyFile(path.join(LLVM_CASES, f));
      const bad = fatals(findings);
      assert.equal(bad.length, 0,
        bad.map((x) => `${x.span.file}:${x.span.start.line} [${x.class}] ${x.message}`).join("\n"));
    });
  }
});

// ------------------------------------------------------------
// 3. Negative suite.
// ------------------------------------------------------------

describe("verify-rc: negative cases (the verifier must report)", () => {
  test("B-109 ① struct-field reassignment drop-old -> x-overwrite-field (both fields, exact lines)", () => {
    const file = path.join(NEG_CASES, "field_overwrite_leak.ring");
    const findings = verifyFile(file);
    assert.equal(fatals(findings).length, 0); // documented class, not a fatal
    const hits = inFile(ofClass(findings, "x-overwrite-field"), file);
    assert.ok(hits.length >= 2, `expected >=2 x-overwrite-field, got ${hits.length}`);
    const lines = hits.map((h) => h.span.start.line);
    assert.ok(lines.includes(14), `scalar field assign (line 14) reported; got lines ${lines}`);
    assert.ok(lines.includes(15), `Str field assign (line 15) reported; got lines ${lines}`);
  });

  test("B-109 ① strict gate: --verify-rc-strict exits 1 and prints the finding", () => {
    const file = path.join(NEG_CASES, "field_overwrite_leak.ring");
    const strict = runCli(["check", file, "--verify-rc-strict"]);
    assert.equal(strict.code, 1, strict.stdout.slice(0, 2000));
    assert.match(strict.stdout, /rc-verify\[x-overwrite-field\]/);
    // non-strict: documented class reports but does not fail the gate
    const lax = runCli(["check", file, "--verify-rc"]);
    assert.equal(lax.code, 0, lax.stdout.slice(0, 2000));
    assert.match(lax.stdout, /x-overwrite-field=/);
  });

  test("B-109 ② call-result Option/Str temps: live pass clean; skip-anf regression -> fatal leak-temp", () => {
    const file = path.join(NEG_CASES, "option_temp_leak.ring");
    // live pass: every temp is materialised + dropped — verifies clean
    assert.equal(fatals(verifyFile(file)).length, 0);
    // simulated ANF-coverage regression: the verifier must catch it
    const degraded = verifyFile(file, "skip-anf");
    const leaks = inFile(fatals(degraded).filter((f) => f.class === "leak-temp"), file);
    assert.ok(leaks.length > 0, "skip-anf must produce fatal leak-temp findings");
    const lines = leaks.map((f) => f.span.start.line);
    assert.ok(lines.includes(11), `Option scrutinee temp (line 11) reported; got ${lines}`);
    assert.ok(lines.includes(27), `Str receiver temp (line 27) reported; got ${lines}`);
    // CLI: degraded run fails the non-strict gate (fatal findings)
    const cli = runCli(["check", file, "--verify-rc", "--rc-mutate=skip-anf"]);
    assert.equal(cli.code, 1, cli.stdout.slice(0, 2000));
    assert.match(cli.stdout, /rc-verify\[leak-temp\]/);
  });

  test("drop-borrow UAF direction: live pass clean; drop-params regression -> fatal uaf-drop-borrow", () => {
    const file = path.join(NEG_CASES, "drop_borrow_uaf.ring");
    assert.equal(fatals(verifyFile(file)).length, 0);
    const degraded = verifyFile(file, "drop-params");
    const uafs = fatals(degraded).filter((f) => f.class === "uaf-drop-borrow");
    assert.ok(uafs.length >= 2, `expected >=2 uaf-drop-borrow (name, age), got ${uafs.length}`);
    const cli = runCli(["check", file, "--verify-rc", "--rc-mutate=drop-params"]);
    assert.equal(cli.code, 1, cli.stdout.slice(0, 2000));
    assert.match(cli.stdout, /rc-verify\[uaf-drop-borrow\]/);
  });
});
