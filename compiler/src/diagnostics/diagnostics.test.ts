import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { format_human, format_llm } from "./formatter.js";
import { Diagnostic } from "./index.js";

const sample_source = `fn main() {
  let x: Int = "hello"
  print(x)
}`;

const sample_diagnostic: Diagnostic = {
  severity: "error",
  code: "E0301",
  message: "Type mismatch: cannot unify Int with Str",
  span: {
    file: "test.ring",
    start: { line: 2, column: 15, offset: 27 },
    end: { line: 2, column: 22, offset: 34 },
  },
  notes: [],
  context: { kind: "type_mismatch", expected: "Int", actual: "Str", expression: '"hello"' },
  suggestions: [],
};

describe("Formatter", () => {
  describe("format_human", () => {
    it("renders rustc-style error with source context", () => {
      const output = format_human([sample_diagnostic], sample_source);
      assert.ok(output.includes("error[E0301]"));
      assert.ok(output.includes("--> test.ring:2:15"));
      assert.ok(output.includes('let x: Int = "hello"'));
      assert.ok(output.includes("^^^^^^^"));
    });

    it("includes type mismatch hint", () => {
      const output = format_human([sample_diagnostic], sample_source);
      assert.ok(output.includes("expected Int, got Str"));
    });

    it("handles multiple diagnostics", () => {
      const d2: Diagnostic = {
        ...sample_diagnostic,
        code: "E0201",
        message: "Undefined variable: y",
        span: { file: "test.ring", start: { line: 3, column: 8, offset: 45 }, end: { line: 3, column: 9, offset: 46 } },
        context: { kind: "undefined_variable", name: "y" },
      };
      const output = format_human([sample_diagnostic, d2], sample_source);
      assert.ok(output.includes("error[E0301]"));
      assert.ok(output.includes("error[E0201]"));
      assert.ok(output.includes("not found in this scope"));
    });

    it("renders warning severity", () => {
      const warn: Diagnostic = { ...sample_diagnostic, severity: "warning" };
      const output = format_human([warn], sample_source);
      assert.ok(output.includes("warning[E0301]"));
    });
  });

  describe("format_llm", () => {
    it("outputs valid JSON with version field", () => {
      const output = format_llm([sample_diagnostic], "test.ring");
      const parsed = JSON.parse(output);
      assert.equal(parsed.version, 1);
      assert.equal(parsed.file, "test.ring");
      assert.equal(parsed.diagnostics.length, 1);
    });

    it("includes structured context", () => {
      const output = format_llm([sample_diagnostic], "test.ring");
      const parsed = JSON.parse(output);
      const d = parsed.diagnostics[0];
      assert.equal(d.code, "E0301");
      assert.equal(d.context.kind, "type_mismatch");
      assert.equal(d.context.expected, "Int");
      assert.equal(d.context.actual, "Str");
    });

    it("includes span info", () => {
      const output = format_llm([sample_diagnostic], "test.ring");
      const parsed = JSON.parse(output);
      const d = parsed.diagnostics[0];
      assert.equal(d.span.line, 2);
      assert.equal(d.span.col, 15);
      assert.equal(d.span.end_line, 2);
      assert.equal(d.span.end_col, 22);
    });

    it("includes empty suggestions array", () => {
      const output = format_llm([sample_diagnostic], "test.ring");
      const parsed = JSON.parse(output);
      assert.deepEqual(parsed.diagnostics[0].suggestions, []);
    });
  });
});
