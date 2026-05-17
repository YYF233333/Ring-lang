// Ring-lang end-to-end compiler tests
// Runs the full pipeline: parse → check → codegen → execute

import { test, describe } from "node:test";
import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Support both compiled (tests/dist/) and direct (tests/) execution
const REPO_ROOT = __dirname.includes("dist")
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "..");
const CLI_PATH = path.resolve(REPO_ROOT, "compiler/dist/cli.js");
const CASES_DIR = path.resolve(REPO_ROOT, "tests/cases");

interface TestCase {
  file: string;
  expected: string;
}

const cases: TestCase[] = [
  { file: "hello.ring", expected: "3\n" },
  { file: "enum_match.ring", expected: "red\n" },
  { file: "string_interp.ring", expected: "Hello, World!\n" },
  { file: "effect_or.ring", expected: "42\n" },
  { file: "effect_catch.ring", expected: "42\n" },
  { file: "effect_handle_fail.ring", expected: "42\n" },
  { file: "effect_handle_io.ring", expected: "got: mock-data\n" },
  { file: "effect_resume.ring", expected: "processed: mock-data\n" },
  { file: "trait_basic.ring", expected: "hello-trait\n" },
  { file: "trait_chain.ring", expected: "num\n" },
  { file: "trait_multi_call.ring", expected: "24\n" },
  { file: "effect_evidence.ring", expected: "mock-data\n" },
  { file: "effect_multi_handler.ring", expected: "file-content\n" },
  { file: "effect_propagate.ring", expected: "propagated\n" },
  { file: "effect_cell.ring", expected: "2\n" },
  { file: "effect_cell_closure.ring", expected: "3\n" },
  { file: "effect_resume_side.ring", expected: "reading: input.txt\nmock-result\n" },
  { file: "row_basic.ring", expected: "alice\n" },
  { file: "row_multi_field.ring", expected: "30\n" },
  { file: "row_generic.ring", expected: "whiskers-rex\n" },
  { file: "effect_row_strict.ring", expected: "3-mock-data\n" },
  { file: "effect_row_handle.ring", expected: "42\n" },
  { file: "option_basic.ring", expected: "42\n" },
  { file: "option_unwrap.ring", expected: "43\n" },
  { file: "option_try.ring", expected: "42\n" },
  { file: "option_or.ring", expected: "141\n" },
  { file: "catch_typed.ring", expected: "99\n" },
  { file: "match_wildcard.ring", expected: "yes\nno\nother\n" },
];

describe("e2e: ring run", () => {
  for (const tc of cases) {
    test(`ring run ${tc.file}`, () => {
      const filePath = path.join(CASES_DIR, tc.file);
      assert.ok(fs.existsSync(filePath), `Test file not found: ${filePath}`);

      const output = execSync(`node "${CLI_PATH}" run "${filePath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 10000,
      });

      assert.strictEqual(output, tc.expected);
    });
  }
});

describe("e2e: ring check", () => {
  for (const tc of cases) {
    test(`ring check ${tc.file}`, () => {
      const filePath = path.join(CASES_DIR, tc.file);
      const output = execSync(`node "${CLI_PATH}" check "${filePath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 10000,
      });

      assert.strictEqual(output.trim(), "OK");
    });
  }
});

describe("e2e: ring build", () => {
  for (const tc of cases) {
    test(`ring build ${tc.file}`, () => {
      const filePath = path.join(CASES_DIR, tc.file);
      const outPath = filePath.replace(/\.ring$/, ".js");

      // Clean up any existing output
      try { fs.unlinkSync(outPath); } catch {}

      execSync(`node "${CLI_PATH}" build "${filePath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 10000,
      });

      assert.ok(fs.existsSync(outPath), `Output file not created: ${outPath}`);

      // Execute the built file directly
      const output = execSync(`node "${outPath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 10000,
      });
      assert.strictEqual(output, tc.expected);

      // Clean up
      fs.unlinkSync(outPath);
    });
  }
});

describe("e2e: ring check (negative — should reject)", () => {
  const negative_cases = [
    { file: "row_reject.ring", error_pattern: "missing field" },
    { file: "error_multi_parse.ring", error_pattern: "expected" },
    { file: "error_type_context.ring", error_pattern: "unify" },
  ];

  for (const tc of negative_cases) {
    test(`ring check ${tc.file} should fail with "${tc.error_pattern}"`, () => {
      const filePath = path.join(CASES_DIR, tc.file);
      assert.ok(fs.existsSync(filePath), `Test file not found: ${filePath}`);

      try {
        execSync(`node "${CLI_PATH}" check "${filePath}"`, {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        assert.fail(`Expected ${tc.file} to fail type checking`);
      } catch (err: any) {
        const stderr = err.stderr?.toString() ?? "";
        const stdout = err.stdout?.toString() ?? "";
        const output = stderr + stdout + (err.message ?? "");
        assert.ok(
          output.toLowerCase().includes(tc.error_pattern.toLowerCase()),
          `Expected error containing "${tc.error_pattern}", got: ${output.slice(0, 200)}`
        );
      }
    });
  }
});

describe("e2e: --error-format=llm", () => {
  test("outputs valid JSON for parse errors", () => {
    const filePath = path.join(CASES_DIR, "error_multi_parse.ring");
    try {
      execSync(`node "${CLI_PATH}" check --error-format=llm "${filePath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 10000,
      });
      assert.fail("Expected failure");
    } catch (err: any) {
      const stdout = err.stdout?.toString() ?? "";
      const parsed = JSON.parse(stdout);
      assert.equal(parsed.version, 1);
      assert.ok(parsed.diagnostics.length >= 1);
      assert.ok(parsed.diagnostics[0].code.startsWith("E01"));
    }
  });

  test("outputs valid JSON for type errors", () => {
    const filePath = path.join(CASES_DIR, "error_type_context.ring");
    try {
      execSync(`node "${CLI_PATH}" check --error-format=llm "${filePath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 10000,
      });
      assert.fail("Expected failure");
    } catch (err: any) {
      const stdout = err.stdout?.toString() ?? "";
      const parsed = JSON.parse(stdout);
      assert.equal(parsed.version, 1);
      assert.ok(parsed.diagnostics.length >= 1);
      assert.ok(parsed.diagnostics[0].message.toLowerCase().includes("unify"));
    }
  });

  test("outputs nothing special for valid files", () => {
    const filePath = path.join(CASES_DIR, "hello.ring");
    const output = execSync(`node "${CLI_PATH}" check --error-format=llm "${filePath}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    assert.equal(output.trim(), "OK");
  });
});
