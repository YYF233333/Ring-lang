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

// When compiled, __dirname is tests/dist/, so go up to repo root
const REPO_ROOT = path.resolve(__dirname, "../..");
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
];

describe("e2e: ring run", () => {
  for (const tc of cases) {
    test(`ring run ${tc.file}`, () => {
      const filePath = path.join(CASES_DIR, tc.file);
      assert.ok(fs.existsSync(filePath), `Test file not found: ${filePath}`);

      const output = execSync(`node "${CLI_PATH}" run "${filePath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
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
      });

      assert.ok(fs.existsSync(outPath), `Output file not created: ${outPath}`);

      // Execute the built file directly
      const output = execSync(`node "${outPath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      assert.strictEqual(output, tc.expected);

      // Clean up
      fs.unlinkSync(outPath);
    });
  }
});
