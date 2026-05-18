import { test, describe } from "node:test";
import * as assert from "node:assert/strict";
import { span_to_range, position_to_lsp, offset_to_position } from "./utils.js";
import { DocumentManager } from "./document-manager.js";
import { convert_diagnostics } from "./features/diagnostics.js";
import { get_hover } from "./features/hover.js";
import { make_diagnostic } from "../diagnostics/index.js";
import { DiagnosticSeverity } from "vscode-languageserver";

describe("LSP utils", () => {
  describe("position_to_lsp", () => {
    test("converts 1-based line to 0-based", () => {
      const lsp = position_to_lsp({ line: 1, column: 0, offset: 0 });
      assert.deepStrictEqual(lsp, { line: 0, character: 0 });
    });

    test("preserves column as character", () => {
      const lsp = position_to_lsp({ line: 5, column: 10, offset: 50 });
      assert.deepStrictEqual(lsp, { line: 4, character: 10 });
    });
  });

  describe("span_to_range", () => {
    test("converts span to LSP range", () => {
      const range = span_to_range({
        file: "test.ring",
        start: { line: 1, column: 0, offset: 0 },
        end: { line: 1, column: 5, offset: 5 },
      });
      assert.deepStrictEqual(range, {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 5 },
      });
    });
  });

  describe("offset_to_position", () => {
    test("finds position at start of source", () => {
      const pos = offset_to_position("hello\nworld", 0);
      assert.deepStrictEqual(pos, { line: 0, character: 0 });
    });

    test("finds position on second line", () => {
      const pos = offset_to_position("hello\nworld", 8);
      assert.deepStrictEqual(pos, { line: 1, character: 2 });
    });

    test("finds position at end of line", () => {
      const pos = offset_to_position("hello\nworld", 5);
      assert.deepStrictEqual(pos, { line: 0, character: 5 });
    });
  });
});

describe("DocumentManager", () => {
  test("open document triggers compilation", () => {
    const dm = new DocumentManager();
    const source = `fn main() -> Int { 42 }`;
    dm.open("file:///test.ring", 1, source);
    const state = dm.get("file:///test.ring");
    assert.ok(state);
    assert.equal(state.source, source);
    assert.ok(state.diagnostics.length === 0);
    assert.ok(state.checkResult !== null);
  });

  test("open document with error produces diagnostics", () => {
    const dm = new DocumentManager();
    const source = `fn main() -> Int { x }`;
    dm.open("file:///test.ring", 1, source);
    const state = dm.get("file:///test.ring");
    assert.ok(state);
    assert.ok(state.diagnostics.length > 0);
  });

  test("update document recompiles", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int { 1 }`);
    dm.update("file:///test.ring", 2, `fn main() -> Int { 2 }`);
    const state = dm.get("file:///test.ring");
    assert.ok(state);
    assert.equal(state.source, `fn main() -> Int { 2 }`);
    assert.equal(state.version, 2);
  });

  test("close document removes state", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int { 1 }`);
    dm.close("file:///test.ring");
    const state = dm.get("file:///test.ring");
    assert.equal(state, undefined);
  });
});

describe("Diagnostics feature", () => {
  test("converts compiler diagnostic to LSP diagnostic", () => {
    const ring_diag = make_diagnostic(
      "E0201", "error", "Undefined variable 'x'",
      {
        file: "test.ring",
        start: { line: 1, column: 4, offset: 4 },
        end: { line: 1, column: 5, offset: 5 },
      },
      { kind: "undefined_variable", name: "x" },
    );
    const result = convert_diagnostics([ring_diag]);
    assert.equal(result.length, 1);
    assert.equal(result[0].severity, DiagnosticSeverity.Error);
    assert.equal(result[0].code, "E0201");
    assert.equal(result[0].message, "Undefined variable 'x'");
    assert.equal(result[0].source, "ring");
    assert.deepStrictEqual(result[0].range, {
      start: { line: 0, character: 4 },
      end: { line: 0, character: 5 },
    });
  });

  test("maps severity correctly", () => {
    const warn = make_diagnostic(
      "W0001", "warning", "unused variable",
      { file: "t.ring", start: { line: 1, column: 0, offset: 0 }, end: { line: 1, column: 1, offset: 1 } },
      { kind: "other" },
    );
    const hint = make_diagnostic(
      "H0001", "hint", "consider renaming",
      { file: "t.ring", start: { line: 1, column: 0, offset: 0 }, end: { line: 1, column: 1, offset: 1 } },
      { kind: "other" },
    );
    const results = convert_diagnostics([warn, hint]);
    assert.equal(results[0].severity, DiagnosticSeverity.Warning);
    assert.equal(results[1].severity, DiagnosticSeverity.Hint);
  });

  test("converts notes to relatedInformation", () => {
    const diag = make_diagnostic(
      "E0301", "error", "Type mismatch",
      { file: "test.ring", start: { line: 2, column: 0, offset: 10 }, end: { line: 2, column: 5, offset: 15 } },
      { kind: "type_mismatch", expected: "Int", actual: "Str" },
      [{ message: "expected type here", span: {
        file: "test.ring",
        start: { line: 1, column: 0, offset: 0 },
        end: { line: 1, column: 3, offset: 3 },
      }}],
    );
    const result = convert_diagnostics([diag]);
    assert.ok(result[0].relatedInformation);
    assert.equal(result[0].relatedInformation!.length, 1);
    assert.equal(result[0].relatedInformation![0].message, "expected type here");
  });
});

describe("Hover feature", () => {
  test("hover on function name shows return type", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn add(a: Int, b: Int) -> Int { a + b }`);
    const state = dm.get("file:///test.ring")!;
    const result = get_hover(state, { line: 0, character: 3 });
    assert.ok(result);
    assert.ok(result.contents.toString().includes("Int"));
  });

  test("hover on variable shows its type", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int {\n  let x = 42\n  x\n}`);
    const state = dm.get("file:///test.ring")!;
    const result = get_hover(state, { line: 2, character: 2 });
    assert.ok(result);
    assert.ok(result.contents.toString().includes("Int"));
  });

  test("hover returns null when no HIR available", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn broken( {`);
    const state = dm.get("file:///test.ring")!;
    const result = get_hover(state, { line: 0, character: 3 });
    assert.equal(result, null);
  });
});
