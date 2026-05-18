import { test, describe } from "node:test";
import * as assert from "node:assert/strict";
import { spawn } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { span_to_range, position_to_lsp, offset_to_position } from "./utils.js";
import { DocumentManager } from "./document-manager.js";
import { convert_diagnostics } from "./features/diagnostics.js";
import { get_hover } from "./features/hover.js";
import { get_completions } from "./features/completion.js";
import { get_definition } from "./features/definition.js";
import { get_references } from "./features/references.js";
import { get_rename_edits } from "./features/rename.js";
import { get_document_symbols } from "./features/symbols.js";
import { get_code_actions } from "./features/code-actions.js";
import { make_diagnostic } from "../diagnostics/index.js";
import { DiagnosticSeverity, CompletionItem, SymbolKind } from "vscode-languageserver";

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

describe("Completion feature", () => {
  test("completes variables in scope", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int {\n  let count = 42\n  c\n}`);
    const state = dm.get("file:///test.ring")!;
    const items = get_completions(state, { line: 2, character: 3 });
    const labels = items.map((i: CompletionItem) => i.label);
    assert.ok(labels.includes("count"));
  });

  test("completes keywords", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int {\n  l\n}`);
    const state = dm.get("file:///test.ring")!;
    const items = get_completions(state, { line: 1, character: 3 });
    const labels = items.map((i: CompletionItem) => i.label);
    assert.ok(labels.includes("let"));
  });

  test("completes struct fields after dot", () => {
    const dm = new DocumentManager();
    // Source must be valid (parses + type-checks) so checkResult is available.
    // Cursor is placed right after the dot in `p.x` — the prefix on that line
    // is "  p." which triggers dot completion.
    const src = `struct Point { x: Int, y: Int }\nfn main() -> Int {\n  let p = Point { x: 1, y: 2 }\n  p.x\n}`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    // Line 3 (0-based), character 4 = position right after "  p." (before "x")
    const items = get_completions(state, { line: 3, character: 4 });
    const labels = items.map((i: CompletionItem) => i.label);
    assert.ok(labels.includes("x"));
    assert.ok(labels.includes("y"));
  });

  test("completes builtin functions", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int {\n  pri\n}`);
    const state = dm.get("file:///test.ring")!;
    const items = get_completions(state, { line: 1, character: 5 });
    const labels = items.map((i: CompletionItem) => i.label);
    assert.ok(labels.includes("print"));
  });

  test("completes local variables inside function body (I18)", () => {
    const dm = new DocumentManager();
    const src = `fn compute(a: Int, b: Int) -> Int {\n  let sum = a + b\n  s\n}`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    const items = get_completions(state, { line: 2, character: 3 });
    const labels = items.map((i: CompletionItem) => i.label);
    assert.ok(labels.includes("sum"), `expected 'sum' in completions, got: ${labels.join(", ")}`);
    assert.ok(labels.includes("a"), `expected param 'a' in completions`);
    assert.ok(labels.includes("b"), `expected param 'b' in completions`);
  });

  test("completes enum variant constructors in scope (I19)", () => {
    const dm = new DocumentManager();
    const src = `enum Color { red(), green(), blue() }\nfn main() -> Int {\n  r\n  0\n}`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    const items = get_completions(state, { line: 2, character: 3 });
    const labels = items.map((i: CompletionItem) => i.label);
    assert.ok(labels.includes("red"), `expected 'red' variant, got: ${labels.join(", ")}`);
    assert.ok(labels.includes("green"), `expected 'green' variant`);
    assert.ok(labels.includes("Color"), `expected 'Color' enum type`);
  });
});

describe("Definition feature", () => {
  test("jump to function definition", () => {
    const dm = new DocumentManager();
    const src = `fn helper() -> Int { 1 }\nfn main() -> Int { helper() }`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    // "helper" in "helper()" on line 2 (0-based: 1)
    const result = get_definition(state, { line: 1, character: 20 });
    assert.ok(result);
    assert.equal(result.range.start.line, 0);
  });

  test("jump to variable definition", () => {
    const dm = new DocumentManager();
    const src = `fn main() -> Int {\n  let x = 10\n  x + 1\n}`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    // "x" in "x + 1" on line 3 (0-based: 2)
    const result = get_definition(state, { line: 2, character: 2 });
    assert.ok(result);
    assert.equal(result.range.start.line, 1);
  });

  test("returns null for unknown position", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int { 42 }`);
    const state = dm.get("file:///test.ring")!;
    const result = get_definition(state, { line: 0, character: 20 });
    assert.equal(result, null);
  });
});

describe("References feature", () => {
  test("finds all references of a variable", () => {
    const dm = new DocumentManager();
    const src = `fn main() -> Int {\n  let x = 10\n  let y = x + 1\n  x + y\n}`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    // Click on "x" at line 3 (0-based: 2), col 10 — this is the "x" in "x + 1"
    const refs = get_references(state, { line: 2, character: 10 });
    // "x" appears as HIdent in: x + 1, x + y → at least 2 usage refs
    assert.ok(refs.length >= 2);
  });

  test("returns empty for literals", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int { 42 }`);
    const state = dm.get("file:///test.ring")!;
    const refs = get_references(state, { line: 0, character: 20 });
    assert.deepStrictEqual(refs, []);
  });
});

describe("Rename feature", () => {
  test("renames variable across usages", () => {
    const dm = new DocumentManager();
    const src = `fn main() -> Int {\n  let x = 10\n  x + 1\n}`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    const edit = get_rename_edits(state, { line: 2, character: 2 }, "y");
    assert.ok(edit);
    const changes = edit.changes!["file:///test.ring"];
    assert.ok(changes.length >= 2);
    assert.ok(changes.every(c => c.newText === "y"));
  });

  test("rejects rename of builtins", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int { print(1)\n  0\n}`);
    const state = dm.get("file:///test.ring")!;
    const edit = get_rename_edits(state, { line: 0, character: 20 }, "my_print");
    assert.equal(edit, null);
  });

  test("rejects rename to invalid identifier (I20)", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int { let x = 1; x }`);
    const state = dm.get("file:///test.ring")!;
    const edit1 = get_rename_edits(state, { line: 0, character: 24 }, "123bad");
    assert.equal(edit1, null);
    const edit2 = get_rename_edits(state, { line: 0, character: 24 }, "has space");
    assert.equal(edit2, null);
    const edit3 = get_rename_edits(state, { line: 0, character: 24 }, "valid_name");
    assert.notEqual(edit3, null);
  });
});

describe("Document Symbols", () => {
  test("lists top-level declarations", () => {
    const dm = new DocumentManager();
    const src = `struct Point { x: Int, y: Int }\nfn main() -> Int { 0 }`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    const symbols = get_document_symbols(state);
    assert.equal(symbols.length, 2);
    const names = symbols.map(s => s.name);
    assert.ok(names.includes("Point"));
    assert.ok(names.includes("main"));
  });

  test("maps declaration kinds correctly", () => {
    const dm = new DocumentManager();
    const src = `enum Color { red, green, blue }\ntrait Show {\n  fn show(self: Self) -> Str\n}`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    const symbols = get_document_symbols(state);
    const color = symbols.find(s => s.name === "Color");
    const show = symbols.find(s => s.name === "Show");
    assert.ok(color);
    assert.ok(show);
    assert.equal(color!.kind, SymbolKind.Enum);
    assert.equal(show!.kind, SymbolKind.Interface);
  });
});

describe("Code Actions", () => {
  test("returns empty for file with no diagnostics", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int { 42 }`);
    const state = dm.get("file:///test.ring")!;
    const actions = get_code_actions(state, {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 30 },
    });
    assert.deepStrictEqual(actions, []);
  });
});

describe("Regression: references on let/var binding name", () => {
  test("finds references when cursor is on let binding name", () => {
    const dm = new DocumentManager();
    const src = `fn main() -> Int {\n  let pt = 10\n  pt + 1\n}`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    // Cursor on "pt" in "let pt = 10" — line 1 (0-based), char 6
    const refs = get_references(state, { line: 1, character: 6 });
    assert.ok(refs.length >= 2, `expected >=2 refs for pt, got ${refs.length}`);
  });

  test("definition works when cursor is on let binding name", () => {
    const dm = new DocumentManager();
    const src = `fn main() -> Int {\n  let pt = 10\n  pt + 1\n}`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    const result = get_definition(state, { line: 1, character: 6 });
    assert.ok(result, "expected definition result for let binding");
  });
});

describe("Regression C7: cross-scope references use def_id", () => {
  test("references for x in foo() do not include x in bar()", () => {
    const dm = new DocumentManager();
    const src = [
      "fn foo() -> Int {",
      "  let x = 1",
      "  x + 1",
      "}",
      "fn bar() -> Int {",
      "  let x = 2",
      "  x + 2",
      "}",
    ].join("\n");
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    // Cursor on "x" in foo's body — line 2 (0-based), char 2
    const refs = get_references(state, { line: 2, character: 2 });
    assert.equal(refs.length, 2, `expected 2 refs for foo's x, got ${refs.length}`);
    for (const ref of refs) {
      assert.ok(ref.range.start.line < 4, `ref at line ${ref.range.start.line} leaked into bar()`);
    }
  });

  test("definition of x in bar() points to bar's let, not foo's", () => {
    const dm = new DocumentManager();
    const src = [
      "fn foo() -> Int {",
      "  let x = 1",
      "  x + 1",
      "}",
      "fn bar() -> Int {",
      "  let x = 2",
      "  x + 2",
      "}",
    ].join("\n");
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    // Cursor on "x" in bar's body — line 6 (0-based), char 2
    const def = get_definition(state, { line: 6, character: 2 });
    assert.ok(def, "expected definition result");
    assert.equal(def.range.start.line, 5, `expected def at line 5 (bar's let x), got ${def.range.start.line}`);
  });

  test("rename x in foo() does not affect bar()", () => {
    const dm = new DocumentManager();
    const src = [
      "fn foo() -> Int {",
      "  let x = 1",
      "  x + 1",
      "}",
      "fn bar() -> Int {",
      "  let x = 2",
      "  x + 2",
      "}",
    ].join("\n");
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    // Cursor on "x" in foo — line 2, char 2
    const edits = get_rename_edits(state, { line: 2, character: 2 }, "y");
    assert.ok(edits, "expected rename edits");
    const changes = edits.changes!["file:///test.ring"];
    assert.equal(changes.length, 2, `expected 2 edits for foo's x, got ${changes.length}`);
    for (const change of changes) {
      assert.ok(change.range.start.line < 4, `edit at line ${change.range.start.line} leaked into bar()`);
    }
  });
});

describe("Regression C8: references use name_span not stmt span", () => {
  test("reference for let binding covers only identifier, not whole statement", () => {
    const dm = new DocumentManager();
    // "  let longName = some_complex_expression"
    //       ^^^^^^^^^  — name_span should be just this
    const src = [
      "fn main() -> Int {",
      "  let longName = 42",
      "  longName + 1",
      "}",
    ].join("\n");
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    // Cursor on "longName" use — line 2, char 2
    const refs = get_references(state, { line: 2, character: 2 });
    assert.equal(refs.length, 2, `expected 2 refs, got ${refs.length}`);
    // The binding-site ref should only span the identifier, not the whole "let longName = 42"
    const binding_ref = refs.find(r => r.range.start.line === 1);
    assert.ok(binding_ref, "expected a ref on line 1 (binding site)");
    const width = binding_ref.range.end.character - binding_ref.range.start.character;
    assert.equal(width, "longName".length, `expected binding ref width ${("longName").length}, got ${width}`);
  });
});

describe("Regression: hover type display quality", () => {
  test("hover shows effect in function signature", () => {
    const dm = new DocumentManager();
    const src = `fn read_it() -> Str { io.read("f") }`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    const result = get_hover(state, { line: 0, character: 4 });
    assert.ok(result);
    const text = typeof result.contents === "string" ? result.contents : result.contents.toString();
    assert.ok(text.includes("io"), `expected io in hover, got: ${text}`);
  });

  test("hover on generic function param shows T, not ?N", () => {
    const dm = new DocumentManager();
    const src = `trait Show { fn show(self) -> Str }\nfn display<T: Show>(x: T) -> Str { x.show() }`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    // Hover on "x" in body — line 1, char 36 ("x" in "x.show()")
    const result = get_hover(state, { line: 1, character: 36 });
    assert.ok(result);
    const text = typeof result.contents === "string" ? result.contents : result.contents.toString();
    assert.ok(text.includes("T"), `expected T in hover, got: ${text}`);
    assert.ok(!text.includes("?"), `unexpected ?N in hover: ${text}`);
  });

  test("hover on struct declaration shows fields (I17)", () => {
    const dm = new DocumentManager();
    const src = `struct Point { x: Int, y: Int }\nfn main() -> Int { 0 }`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    const result = get_hover(state, { line: 0, character: 8 });
    assert.ok(result, "hover should not be null on struct decl");
    const text = typeof result.contents === "string" ? result.contents : result.contents.toString();
    assert.ok(text.includes("struct Point"), `expected 'struct Point' in hover, got: ${text}`);
    assert.ok(text.includes("x: Int"), `expected field info, got: ${text}`);
  });

  test("hover on enum declaration shows variants (I17)", () => {
    const dm = new DocumentManager();
    const src = `enum Color { red(), green(), blue() }\nfn main() -> Int { 0 }`;
    dm.open("file:///test.ring", 1, src);
    const state = dm.get("file:///test.ring")!;
    const result = get_hover(state, { line: 0, character: 6 });
    assert.ok(result, "hover should not be null on enum decl");
    const text = typeof result.contents === "string" ? result.contents : result.contents.toString();
    assert.ok(text.includes("enum Color"), `expected 'enum Color' in hover, got: ${text}`);
  });

  test("hover does not include range (avoids over-highlight)", () => {
    const dm = new DocumentManager();
    dm.open("file:///test.ring", 1, `fn main() -> Int { 42 }`);
    const state = dm.get("file:///test.ring")!;
    const result = get_hover(state, { line: 0, character: 4 });
    assert.ok(result);
    assert.equal(result.range, undefined);
  });
});

const __lsp_test_filename = fileURLToPath(import.meta.url);
const __lsp_test_dirname = path.dirname(__lsp_test_filename);
const LSP_CLI_PATH = __lsp_test_dirname.includes("dist")
  ? path.resolve(__lsp_test_dirname, "../cli.js")
  : path.resolve(__lsp_test_dirname, "../cli.js");

describe("LSP E2E", () => {
  test("server responds to initialize request", async () => {
    const child = spawn("node", [LSP_CLI_PATH, "lsp", "--stdio"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const request = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        processId: process.pid,
        capabilities: {},
        rootUri: null,
      },
    });
    const message = `Content-Length: ${Buffer.byteLength(request)}\r\n\r\n${request}`;

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error("LSP server did not respond within 5s"));
      }, 5000);

      let data = "";
      child.stdout!.on("data", (chunk: Buffer) => {
        data += chunk.toString();
        if (data.includes('"id":1')) {
          clearTimeout(timeout);
          child.kill();
          assert.ok(data.includes('"result"'));
          assert.ok(data.includes('"capabilities"'));
          resolve();
        }
      });

      child.stderr!.on("data", () => {});
      child.on("error", (err: Error) => { clearTimeout(timeout); reject(err); });

      child.stdin!.write(message);
    });
  });
});
