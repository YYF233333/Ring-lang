import { test, describe } from "node:test";
import * as assert from "node:assert/strict";
import { span_to_range, position_to_lsp, offset_to_position } from "./utils.js";

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
