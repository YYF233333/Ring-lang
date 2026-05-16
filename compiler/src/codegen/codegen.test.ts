// Ring-lang codegen unit tests

import { describe, it } from "node:test";
import * as assert from "node:assert";
import { generate } from "./codegen.js";
import { INT, STR, BOOL, UNIT, EMPTY_ROW } from "../types/index.js";
import { HProgram, HFnDecl, HStructDecl, HEnumDecl, HBlock, HExpr, HStmt, HParam } from "../hir/index.js";
import { span_zero } from "../ast/index.js";

// Helper: zero span
const S = span_zero();

// Helper: make a simple block with tail
function block(stmts: HStmt[], tail?: HExpr): HBlock {
  return {
    kind: "block",
    stmts,
    tail,
    type: tail?.type ?? UNIT,
    effects: EMPTY_ROW,
    span: S,
  };
}

// Helper: int literal
function int_lit(value: number): HExpr {
  return { kind: "int_lit", value, type: INT, effects: EMPTY_ROW, span: S };
}

// Helper: str literal
function str_lit(value: string): HExpr {
  return { kind: "str_lit", value, type: STR, effects: EMPTY_ROW, span: S };
}

// Helper: bool literal
function bool_lit(value: boolean): HExpr {
  return { kind: "bool_lit", value, type: BOOL, effects: EMPTY_ROW, span: S };
}

// Helper: ident
function ident(name: string): HExpr {
  return { kind: "ident", name, type: INT, effects: EMPTY_ROW, span: S };
}

// Helper: program from decls
function program(decls: HProgram["decls"]): HProgram {
  return { decls };
}

describe("codegen", () => {
  describe("struct declarations", () => {
    it("generates class with constructor", () => {
      const decl: HStructDecl = {
        kind: "struct_decl",
        name: "Point",
        type_params: [],
        fields: [
          { name: "x", type: INT, is_pub: true },
          { name: "y", type: INT, is_pub: true },
        ],
        is_pub: true,
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("class Point {"));
      assert.ok(js.includes("constructor(x, y)"));
      assert.ok(js.includes("this.x = x;"));
      assert.ok(js.includes("this.y = y;"));
    });
  });

  describe("enum declarations", () => {
    it("generates factory functions for variants", () => {
      const decl: HEnumDecl = {
        kind: "enum_decl",
        name: "Shape",
        type_params: [],
        variants: [
          { name: "Circle", fields: [INT] },
          { name: "Rect", fields: [INT, INT] },
          { name: "None", fields: [] },
        ],
        is_pub: true,
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes('function Shape_Circle(_0)'));
      assert.ok(js.includes('_tag: "Circle"'));
      assert.ok(js.includes('function Shape_Rect(_0, _1)'));
      assert.ok(js.includes('_tag: "Rect"'));
      // Unit variant
      assert.ok(js.includes('const Shape_None = Object.freeze({ _tag: "None" })'));
    });
  });

  describe("function declarations", () => {
    it("generates function with return", () => {
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "add",
        type_params: [],
        params: [
          { name: "a", type: INT },
          { name: "b", type: INT },
        ],
        return_type: INT,
        effects: EMPTY_ROW,
        body: block([], {
          kind: "bin_op",
          op: "+",
          left: ident("a"),
          right: ident("b"),
          type: INT,
          effects: EMPTY_ROW,
          span: S,
        }),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("function add(a, b)"));
      assert.ok(js.includes("return (a + b);"));
    });

    it("auto-calls main()", () => {
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "main",
        type_params: [],
        params: [],
        return_type: UNIT,
        effects: EMPTY_ROW,
        body: block([]),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("main();"));
    });
  });

  describe("let and var statements", () => {
    it("generates const for let", () => {
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "f",
        type_params: [],
        params: [],
        return_type: INT,
        effects: EMPTY_ROW,
        body: block([
          { kind: "let_stmt", name: "x", type: INT, init: int_lit(42), span: S },
        ], ident("x")),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("const x = 42;"));
    });

    it("generates let for var", () => {
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "f",
        type_params: [],
        params: [],
        return_type: INT,
        effects: EMPTY_ROW,
        body: block([
          { kind: "var_stmt", name: "x", type: INT, init: int_lit(0), span: S },
          {
            kind: "assign_stmt",
            target: ident("x"),
            value: int_lit(1),
            span: S,
          },
        ], ident("x")),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("let x = 0;"));
      assert.ok(js.includes("x = 1;"));
    });
  });

  describe("match expressions", () => {
    it("generates switch for enum match", () => {
      const match_expr: HExpr = {
        kind: "match_expr",
        scrutinee: ident("shape"),
        arms: [
          {
            pattern: { kind: "constructor", name: "Circle", fields: [{ kind: "binding", name: "r", span: S }], span: S },
            body: ident("r"),
            span: S,
          },
          {
            pattern: { kind: "wildcard", span: S },
            body: int_lit(0),
            span: S,
          },
        ],
        type: INT,
        effects: EMPTY_ROW,
        span: S,
      };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "area",
        type_params: [],
        params: [{ name: "shape", type: INT }],
        return_type: INT,
        effects: EMPTY_ROW,
        body: block([], match_expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("switch (__m._tag)"));
      assert.ok(js.includes('"Circle"'));
      assert.ok(js.includes("const r = __m._0;"));
    });

    it("generates if-chain for literal patterns", () => {
      const match_expr: HExpr = {
        kind: "match_expr",
        scrutinee: ident("x"),
        arms: [
          {
            pattern: { kind: "literal", value: 1, span: S },
            body: str_lit("one"),
            span: S,
          },
          {
            pattern: { kind: "wildcard", span: S },
            body: str_lit("other"),
            span: S,
          },
        ],
        type: STR,
        effects: EMPTY_ROW,
        span: S,
      };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "check",
        type_params: [],
        params: [{ name: "x", type: INT }],
        return_type: STR,
        effects: EMPTY_ROW,
        body: block([], match_expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("__m === 1"));
      assert.ok(js.includes('"one"'));
      assert.ok(js.includes('"other"'));
    });
  });

  describe("try_catch expressions", () => {
    it("generates try/catch IIFE", () => {
      const expr: HExpr = {
        kind: "try_catch",
        body: ident("x"),
        error_binding: "e",
        handler: int_lit(0),
        type: INT,
        effects: EMPTY_ROW,
        span: S,
      };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "safe",
        type_params: [],
        params: [{ name: "x", type: INT }],
        return_type: INT,
        effects: EMPTY_ROW,
        body: block([], expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("try { return x; }"));
      assert.ok(js.includes("catch (e)"));
      assert.ok(js.includes("return 0;"));
    });
  });

  describe("handle expressions with generators", () => {
    it("generates __run_handler for custom effects", () => {
      const expr: HExpr = {
        kind: "handle_expr",
        body: {
          kind: "effect_op",
          effect_name: "Console",
          op_name: "log",
          args: [str_lit("hello")],
          type: UNIT,
          effects: EMPTY_ROW,
          span: S,
        },
        handlers: [
          {
            effect_name: "Console",
            op_name: "log",
            params: [{ name: "msg", type: STR }],
            resume_name: "k",
            body: ident("k"),
          },
        ],
        type: UNIT,
        effects: EMPTY_ROW,
        span: S,
      };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "run",
        type_params: [],
        params: [],
        return_type: UNIT,
        effects: EMPTY_ROW,
        body: block([], expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("__run_handler"));
      assert.ok(js.includes("function*()"));
      assert.ok(js.includes('"Console.log"'));
      assert.ok(js.includes("yield"));
    });

    it("generates try/catch for fail-only handler", () => {
      const expr: HExpr = {
        kind: "handle_expr",
        body: ident("risky"),
        handlers: [
          {
            effect_name: "fail",
            op_name: "raise",
            params: [{ name: "err", type: STR }],
            body: str_lit("recovered"),
          },
        ],
        type: STR,
        effects: EMPTY_ROW,
        span: S,
      };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "safe",
        type_params: [],
        params: [],
        return_type: STR,
        effects: EMPTY_ROW,
        body: block([], expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("try {"));
      assert.ok(js.includes("catch (err)"));
      assert.ok(js.includes('"recovered"'));
      // Should NOT use generators for fail-only (check the function body, not the runtime preamble)
      const fn_body = js.split("function safe()")[1] ?? "";
      assert.ok(!fn_body.includes("__run_handler"));
    });
  });

  describe("string interpolation", () => {
    it("generates template literal", () => {
      const expr: HExpr = {
        kind: "string_interp",
        parts: ["Hello, ", ident("name"), "!"],
        type: STR,
        effects: EMPTY_ROW,
        span: S,
      };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "greet",
        type_params: [],
        params: [{ name: "name", type: STR }],
        return_type: STR,
        effects: EMPTY_ROW,
        body: block([], expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("`Hello, ${name}!`"));
    });
  });

  describe("if expressions", () => {
    it("generates ternary", () => {
      const expr: HExpr = {
        kind: "if_expr",
        condition: bool_lit(true),
        then_branch: block([], int_lit(1)),
        else_branch: block([], int_lit(2)),
        type: INT,
        effects: EMPTY_ROW,
        span: S,
      };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "f",
        type_params: [],
        params: [],
        return_type: INT,
        effects: EMPTY_ROW,
        body: block([], expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("(true ? 1 : 2)"));
    });
  });

  describe("impl declarations", () => {
    it("generates prefixed method functions", () => {
      const decl = {
        kind: "impl_decl" as const,
        target_type: "Point",
        type_params: [],
        methods: [
          {
            kind: "fn_decl" as const,
            name: "distance",
            type_params: [],
            params: [{ name: "self", type: INT }] as HParam[],
            return_type: INT,
            effects: EMPTY_ROW,
            body: block([], int_lit(0)),
            is_pub: false,
            trait_bounds: [],
            span: S,
          },
        ],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("function Point_distance(self)"));
    });
  });

  describe("lambda expressions", () => {
    it("generates anonymous function", () => {
      const expr: HExpr = {
        kind: "lambda",
        params: [{ name: "x", type: INT }],
        return_type: INT,
        body: ident("x"),
        type: { kind: "fn", params: [INT], return_type: INT, effects: EMPTY_ROW },
        effects: EMPTY_ROW,
        span: S,
      };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "id",
        type_params: [],
        params: [],
        return_type: { kind: "fn", params: [INT], return_type: INT, effects: EMPTY_ROW },
        effects: EMPTY_ROW,
        body: block([], expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("(function(x) { return x; })"));
    });
  });

  describe("test declarations", () => {
    it("generates IIFE with comment", () => {
      const decl = {
        kind: "test_decl" as const,
        description: "addition works",
        body: block([
          {
            kind: "expr_stmt" as const,
            expr: {
              kind: "call" as const,
              callee: ident("assert"),
              args: [bool_lit(true)],
              type_args: [],
              resolved_dicts: [],
              type: UNIT,
              effects: EMPTY_ROW,
              span: S,
            },
            span: S,
          },
        ]),
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("// test: addition works"));
      assert.ok(js.includes("(function() {"));
      assert.ok(js.includes("assert(true)"));
      assert.ok(js.includes("})();"));
    });
  });

  describe("runtime helpers", () => {
    it("includes runtime preamble", () => {
      const js = generate(program([]));
      assert.ok(js.includes("function __run_handler"));
      assert.ok(js.includes("function __match_fail"));
      assert.ok(js.includes("function print"));
      assert.ok(js.includes("function assert"));
    });
  });
});
