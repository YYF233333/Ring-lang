// Ring-lang codegen unit tests

import { describe, it } from "node:test";
import * as assert from "node:assert";
import { generate } from "./codegen.js";
import { RUNTIME_CODE } from "./runtime.js";
import { INT, STR, BOOL, UNIT, EMPTY_ROW, effect_row, Effect } from "../types/index.js";
import { HProgram, HFnDecl, HStructDecl, HEnumDecl, HBlock, HExpr, HStmt, HParam, evidence_param_name } from "../hir/index.js";
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
      assert.ok(js.includes("switch (__ring_m._tag)"));
      assert.ok(js.includes('"Circle"'));
      assert.ok(js.includes("const r = __ring_m._0;"));
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
      assert.ok(js.includes("__ring_m === 1"));
      assert.ok(js.includes('"one"'));
      assert.ok(js.includes('"other"'));
    });
  });

  describe("try_catch expressions", () => {
    it("generates evidence-based try/catch IIFE for catch expr", () => {
      const fail_effect: Effect = { kind: "fail", error_type: STR };
      const expr: HExpr = {
        kind: "try_catch",
        body: { kind: "ident", name: "x", type: INT, effects: effect_row(fail_effect), span: S },
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
      assert.ok(js.includes("__ring_ev_fail"), "Should create __ring_ev_fail evidence, got: " + js);
      assert.ok(js.includes("try { return x; }"), "Should have try with body, got: " + js);
      assert.ok(js.includes("__EffectAbort"), "Should use __EffectAbort, got: " + js);
      assert.ok(js.includes("const e = __ring_e.value"), "Should extract error value for catch binding, got: " + js);
      assert.ok(js.includes("return 0;"), "Should return handler value, got: " + js);
    });
  });

  describe("handle_expr codegen", () => {
    it("generates evidence + try/catch for fail handler", () => {
      const fail_effect: Effect = { kind: "fail", error_type: STR };
      const handle_expr: HExpr = {
        kind: "handle_expr",
        body: {
          kind: "effect_op",
          effect_name: "fail",
          op_name: "raise",
          args: [str_lit("err")],
          type: INT,
          effects: effect_row(fail_effect),
          span: S,
        },
        handlers: [{
          effect_name: "fail",
          op_name: "raise",
          params: [{ name: "e", type: STR }],
          body: int_lit(42),
        }],
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
        body: block([], handle_expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("__ring_ev_fail"), "Should have __ring_ev_fail evidence, got: " + js);
      assert.ok(js.includes("__EffectAbort"), "Should throw __EffectAbort, got: " + js);
      assert.ok(js.includes("try"), "Should have try/catch");
      assert.ok(js.includes("catch"), "Should have catch");
      assert.ok(!js.includes("__run_handler"), "No __run_handler");
      assert.ok(!js.includes("yield"), "No yield");
    });

    it("generates evidence without try/catch for io handler", () => {
      const io_effect: Effect = { kind: "io" };
      const handle_expr: HExpr = {
        kind: "handle_expr",
        body: {
          kind: "effect_op",
          effect_name: "io",
          op_name: "read",
          args: [str_lit("file.txt")],
          type: STR,
          effects: effect_row(io_effect),
          span: S,
        },
        handlers: [{
          effect_name: "io",
          op_name: "read",
          params: [{ name: "path", type: STR }],
          body: str_lit("mock-data"),
        }],
        type: STR,
        effects: EMPTY_ROW,
        span: S,
      };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "f",
        type_params: [],
        params: [],
        return_type: STR,
        effects: EMPTY_ROW,
        body: block([], handle_expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("__ring_ev_io"), "Should have __ring_ev_io");
      assert.ok(js.includes("read"), "Should have read operation");
      assert.ok(js.includes('"mock-data"'), "Should have mock value");
      assert.ok(!js.includes("try"), "No try/catch for non-abort handler");
      assert.ok(!js.includes("__run_handler"), "No __run_handler");
      assert.ok(!js.includes("function*"), "No generator");
    });

    it("generates evidence for custom effect handler (non-abort)", () => {
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
      assert.ok(js.includes("__ring_ev_Console"), "Should have __ring_ev_Console evidence, got: " + js);
      assert.ok(js.includes("log:"), "Should have log operation entry");
      assert.ok(!js.includes("__run_handler"), "No __run_handler");
      assert.ok(!js.includes("function*"), "No generator");
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
      assert.ok(js.includes("class __EffectAbort"));
      assert.ok(js.includes("function __match_fail"));
      assert.ok(js.includes("function print"));
      assert.ok(js.includes("function assert"));
    });
  });

  describe("runtime", () => {
    it("includes __EffectAbort class", () => {
      assert.ok(RUNTIME_CODE.includes("class __EffectAbort"));
      assert.ok(RUNTIME_CODE.includes("this.effect = effect"));
      assert.ok(RUNTIME_CODE.includes("this.value = value"));
    });

    it("does not include __run_handler", () => {
      assert.ok(!RUNTIME_CODE.includes("__run_handler"));
    });
  });

  describe("evidence_param_name", () => {
    it("generates __ring_ev_ prefixed name", () => {
      assert.strictEqual(evidence_param_name("io"), "__ring_ev_io");
      assert.strictEqual(evidence_param_name("fail"), "__ring_ev_fail");
      assert.strictEqual(evidence_param_name("custom_eff"), "__ring_ev_custom_eff");
    });
  });

  describe("evidence params in function signatures", () => {
    it("adds __ring_ev_ params for functions with effects", () => {
      const io_effect: Effect = { kind: "io" };
      const fail_effect: Effect = { kind: "fail", error_type: STR };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "load",
        type_params: [],
        params: [{ name: "path", type: STR }],
        return_type: STR,
        effects: effect_row(io_effect, fail_effect),
        body: block([], str_lit("data")),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("function load(path, __ring_ev_fail, __ring_ev_io)"), "Expected evidence params sorted alphabetically, got: " + js);
      assert.ok(!js.includes("function*"), "Should not be a generator");
    });

    it("does not add evidence params for pure functions", () => {
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "pure",
        type_params: [],
        params: [{ name: "x", type: INT }],
        return_type: INT,
        effects: EMPTY_ROW,
        body: block([], ident("x")),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("function pure(x)"), "Got: " + js);
      assert.ok(!js.includes("function pure(x, __ring_ev_"), "Pure function should have no evidence params");
    });
  });

  describe("effect_op codegen", () => {
    it("generates evidence method call for io.read", () => {
      const io_effect: Effect = { kind: "io" };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "f",
        type_params: [],
        params: [],
        return_type: STR,
        effects: effect_row(io_effect),
        body: block([], {
          kind: "effect_op",
          effect_name: "io",
          op_name: "read",
          args: [str_lit("file.txt")],
          type: STR,
          effects: effect_row(io_effect),
          span: S,
        }),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("__ring_ev_io.read("), "should call __ring_ev_io.read(), got: " + js);
      assert.ok(js.includes('"file.txt"'), "should pass file.txt arg");
      assert.ok(!js.includes("yield"), "should not contain yield");
    });
  });

  describe("evidence forwarding at call sites", () => {
    it("forwards evidence when calling a function with effects", () => {
      const io_effect: Effect = { kind: "io" };
      const callee_type: import("../types/index.js").FnType = {
        kind: "fn",
        params: [STR],
        return_type: STR,
        effects: effect_row(io_effect),
      };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "main_test",
        type_params: [],
        params: [],
        return_type: STR,
        effects: effect_row(io_effect),
        body: block([], {
          kind: "call",
          callee: { kind: "ident", name: "helper", type: callee_type, effects: EMPTY_ROW, span: S },
          args: [str_lit("x")],
          type_args: [],
          resolved_dicts: [],
          type: STR,
          effects: effect_row(io_effect),
          span: S,
        }),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes('helper("x", __ring_ev_io)'), "Should forward __ring_ev_io to helper, got: " + js);
    });

    it("does not forward evidence for pure callees", () => {
      const io_effect: Effect = { kind: "io" };
      const callee_type: import("../types/index.js").FnType = {
        kind: "fn",
        params: [STR],
        return_type: STR,
        effects: EMPTY_ROW,
      };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "main_test",
        type_params: [],
        params: [],
        return_type: STR,
        effects: effect_row(io_effect),
        body: block([], {
          kind: "call",
          callee: { kind: "ident", name: "pure_fn", type: callee_type, effects: EMPTY_ROW, span: S },
          args: [str_lit("x")],
          type_args: [],
          resolved_dicts: [],
          type: STR,
          effects: EMPTY_ROW,
          span: S,
        }),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes('pure_fn("x")'), "Should not forward evidence to pure function, got: " + js);
      assert.ok(!js.includes('pure_fn("x", __ring_ev_'), "Should not have evidence args");
    });
  });

  describe("try_catch (or/catch) with evidence", () => {
    it("returns body directly when body is pure", () => {
      const try_catch_expr: HExpr = {
        kind: "try_catch",
        body: int_lit(42),
        handler: int_lit(0),
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
        body: block([], try_catch_expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      // Pure body — or/catch is optimized away
      assert.ok(!js.includes("try"), "Pure body should not have try/catch, got: " + js);
      assert.ok(js.includes("42"), "Should just return body value");
    });

    it("generates __ring_ev_fail + __EffectAbort when body has fail effect", () => {
      const fail_effect: Effect = { kind: "fail", error_type: STR };
      const callee_type: import("../types/index.js").FnType = {
        kind: "fn",
        params: [],
        return_type: INT,
        effects: effect_row(fail_effect),
      };
      const try_catch_expr: HExpr = {
        kind: "try_catch",
        body: {
          kind: "call",
          callee: { kind: "ident", name: "risky", type: callee_type, effects: EMPTY_ROW, span: S },
          args: [],
          type_args: [],
          resolved_dicts: [],
          type: INT,
          effects: effect_row(fail_effect),
          span: S,
        },
        handler: int_lit(0),
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
        body: block([], try_catch_expr),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("__ring_ev_fail"), "Should create __ring_ev_fail evidence, got: " + js);
      assert.ok(js.includes("__EffectAbort"), "Should use __EffectAbort, got: " + js);
      assert.ok(js.includes("try"), "Should have try/catch");
    });
  });

  describe("top-level evidence injection", () => {
    it("provides __ring_ev_io and __ring_ev_fail when main has effects", () => {
      const io_effect: Effect = { kind: "io" };
      const fail_effect: Effect = { kind: "fail", error_type: STR };
      const decl: HFnDecl = {
        kind: "fn_decl",
        name: "main",
        type_params: [],
        params: [],
        return_type: UNIT,
        effects: effect_row(io_effect, fail_effect),
        body: block([]),
        is_pub: false,
        trait_bounds: [],
        span: S,
      };
      const js = generate(program([decl]));
      assert.ok(js.includes("main(__ring_ev_fail, __ring_ev_io)"), "Should call main with evidence, got: " + js);
      assert.ok(js.includes("const __ring_ev_io = {"), "Should define top-level __ring_ev_io");
      assert.ok(js.includes("const __ring_ev_fail = {"), "Should define top-level __ring_ev_fail");
    });

    it("calls main() without evidence when pure", () => {
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
      assert.ok(js.includes("main();"), "Should call main() with no args, got: " + js);
      assert.ok(!js.includes("const __ring_ev_"), "Should not define evidence for pure main");
    });
  });
});
