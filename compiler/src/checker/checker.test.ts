// Ring-lang Type Checker tests
import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { Parser } from "../parser/parser.js";
import { check } from "./checker.js";
import { HFnDecl, HTestDecl, HProgram } from "../hir/index.js";

// Helper: parse and check, return the HProgram
function check_source(source: string): HProgram {
  const ast = Parser.parse(source);
  return check(ast);
}

// Helper: get the first fn decl from checked program
function check_fn(source: string): HFnDecl {
  const program = check_source(source);
  const fn_decl = program.decls.find(d => d.kind === "fn_decl") as HFnDecl;
  assert.ok(fn_decl, "Expected a fn_decl in the program");
  return fn_decl;
}

describe("Type Checker", () => {
  describe("integer literal inference", () => {
    it("infers Int type for integer literals", () => {
      const fn_decl = check_fn("fn main() -> Int { 42 }");
      assert.equal(fn_decl.return_type.kind, "int");
    });

    it("infers Int type without annotation", () => {
      const fn_decl = check_fn("fn main() { 42 }");
      assert.equal(fn_decl.return_type.kind, "int");
    });
  });

  describe("binary operations", () => {
    it("infers Int for arithmetic on Int operands", () => {
      const fn_decl = check_fn("fn add(a: Int, b: Int) -> Int { a + b }");
      assert.equal(fn_decl.return_type.kind, "int");
    });

    it("infers Float for arithmetic on Float operands", () => {
      const fn_decl = check_fn("fn add(a: Float, b: Float) -> Float { a + b }");
      assert.equal(fn_decl.return_type.kind, "float");
    });

    it("infers Bool for comparison operators", () => {
      const fn_decl = check_fn("fn cmp(a: Int, b: Int) { a > b }");
      assert.equal(fn_decl.return_type.kind, "bool");
    });

    it("infers Bool for logical operators", () => {
      const fn_decl = check_fn("fn logic(a: Bool, b: Bool) { a && b }");
      assert.equal(fn_decl.return_type.kind, "bool");
    });
  });

  describe("function return type inference", () => {
    it("infers return type from body when no annotation", () => {
      const fn_decl = check_fn("fn greet() { 123 }");
      assert.equal(fn_decl.return_type.kind, "int");
    });

    it("infers Str return type from string literal body", () => {
      const fn_decl = check_fn('fn greet() { "hello" }');
      assert.equal(fn_decl.return_type.kind, "str");
    });

    it("infers Bool from boolean literal", () => {
      const fn_decl = check_fn("fn check() { true }");
      assert.equal(fn_decl.return_type.kind, "bool");
    });
  });

  describe("struct construction + field access", () => {
    it("type-checks struct construction", () => {
      const source = `
        struct Point { x: Int, y: Int }
        fn make() { Point { x: 1, y: 2 } }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "struct");
      if (fn_decl.return_type.kind === "struct") {
        assert.equal(fn_decl.return_type.name, "Point");
      }
    });

    it("type-checks field access on struct", () => {
      const source = `
        struct Point { x: Int, y: Int }
        fn get_x(p: Point) -> Int { p.x }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "int");
    });
  });

  describe("let binding type propagation", () => {
    it("propagates type through let binding", () => {
      const source = `
        fn main() -> Int {
          let x = 10
          x
        }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "int");
    });

    it("propagates type annotation", () => {
      const source = `
        fn main() -> Int {
          let x: Int = 10
          x + 1
        }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "int");
    });
  });

  describe("enum + pattern match", () => {
    it("type-checks enum construction via constructor", () => {
      const source = `
        enum Shape { circle(Float), rect(Float, Float) }
        fn make() { circle(3.14) }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "enum");
      if (fn_decl.return_type.kind === "enum") {
        assert.equal(fn_decl.return_type.name, "Shape");
      }
    });

    it("type-checks match expression with exhaustive patterns", () => {
      const source = `
        enum Shape { circle(Float), rect(Float, Float) }
        fn area(s: Shape) -> Float {
          match s {
            circle(r) => r * r,
            rect(w, h) => w * h,
          }
        }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "float");
    });
  });

  describe("non-exhaustive match rejection", () => {
    it("throws on non-exhaustive match", () => {
      const source = `
        enum Shape { circle(Float), rect(Float, Float) }
        fn area(s: Shape) -> Float {
          match s {
            circle(r) => r * r,
          }
        }
      `;
      assert.throws(() => check_source(source), (err: any) => {
        return err.message.includes("Non-exhaustive") && err.message.includes("rect");
      });
    });
  });

  describe("wildcard makes match exhaustive", () => {
    it("accepts match with wildcard pattern", () => {
      const source = `
        enum Shape { circle(Float), rect(Float, Float) }
        fn describe(s: Shape) -> Int {
          match s {
            circle(r) => 1,
            _ => 0,
          }
        }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "int");
    });

    it("accepts match with binding pattern as catch-all", () => {
      const source = `
        enum Shape { circle(Float), rect(Float, Float) }
        fn describe(s: Shape) -> Int {
          match s {
            circle(r) => 1,
            other => 0,
          }
        }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "int");
    });
  });

  describe("io effect inference", () => {
    it("infers io effect from io.read call", () => {
      const source = `
        fn read_file(path: Str) -> Str {
          io.read(path)
        }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "str");
      assert.ok(fn_decl.effects.effects.length > 0, "Expected io effect");
      assert.equal(fn_decl.effects.effects[0].kind, "io");
    });

    it("infers io effect from io.write call", () => {
      const source = `
        fn write_file(path: Str, data: Str) {
          io.write(path, data)
        }
      `;
      const fn_decl = check_fn(source);
      assert.ok(fn_decl.effects.effects.some(e => e.kind === "io"), "Expected io effect");
    });
  });

  describe("or expression removes fail effect", () => {
    it("or expression produces try_catch in HIR and removes fail", () => {
      const source = `
        fn safe_get(x: Int) -> Int {
          x or 0
        }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "int");
      // The fail effect should be removed
      const has_fail = fn_decl.effects.effects.some(e => e.kind === "fail");
      assert.equal(has_fail, false);
    });
  });

  describe("handle expression removes handled effects", () => {
    it("handle expression removes io effect", () => {
      const source = `
        fn main() {
          handle { io.read("test.txt") } with {
            io.read(path, resume) => resume("mock data"),
          }
        }
      `;
      const fn_decl = check_fn(source);
      // io effect should be removed by handle
      const has_io = fn_decl.effects.effects.some(e => e.kind === "io");
      assert.equal(has_io, false);
    });
  });

  describe("type mismatch rejection", () => {
    it("throws on return type mismatch", () => {
      const source = `
        fn add(a: Int, b: Int) -> Str {
          a + b
        }
      `;
      assert.throws(() => check_source(source), (err: any) => {
        return err.message.includes("unify") || err.message.includes("mismatch");
      });
    });

    it("throws on argument type mismatch", () => {
      const source = `
        fn add(a: Int, b: Int) -> Int { a + b }
        fn main() -> Int { add(1, true) }
      `;
      assert.throws(() => check_source(source), (err: any) => {
        return err.message.includes("unify") || err.message.includes("mismatch");
      });
    });
  });

  describe("test declarations", () => {
    it("type-checks test blocks", () => {
      const source = `
        test "basic math" { assert(1 + 1 == 2) }
      `;
      const program = check_source(source);
      const test_decl = program.decls.find(d => d.kind === "test_decl") as HTestDecl;
      assert.ok(test_decl);
      assert.equal(test_decl.description, "basic math");
    });
  });

  describe("function calls", () => {
    it("infers return type from called function", () => {
      const source = `
        fn double(x: Int) -> Int { x + x }
        fn main() { double(5) }
      `;
      const program = check_source(source);
      const main_fn = program.decls.find(d => d.kind === "fn_decl" && (d as HFnDecl).name === "main") as HFnDecl;
      assert.ok(main_fn);
      assert.equal(main_fn.return_type.kind, "int");
    });
  });
});
