// Ring-lang Type Checker tests
import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { Parser } from "../parser/parser.js";
import { check } from "./checker.js";
import {
  HFnDecl, HImplDecl, HTestDecl, HProgram,
  BUILTIN_CELL, BUILTIN_STR, BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET,
  CELL_METHODS, STR_METHODS, INT_METHODS, FLOAT_METHODS,
  LIST_NON_HOF_METHODS, LIST_HOF_METHODS,
  MAP_NON_HOF_METHODS, MAP_HOF_METHODS, SET_NON_HOF_METHODS, SET_HOF_METHODS,
} from "../hir/index.js";
import { CollectingSink, Diagnostic } from "../diagnostics/index.js";
import { type_to_string, effect_row_to_string } from "../types/index.js";
// TypeEnv no longer needed — builtins+stdlib tested via check()

// Helper: parse and check, return the HProgram
function check_source(source: string): HProgram {
  const ast = Parser.parse(source);
  return check(ast).program;
}

// Helper: parse and check expecting errors, return diagnostics from sink
function check_expecting_errors(source: string): Diagnostic[] {
  const sink = new CollectingSink();
  const ast = Parser.parse(source, "<test>", sink);
  try {
    check(ast, sink);
  } catch {
    // expected
  }
  return [...sink.diagnostics()];
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
      const diags = check_expecting_errors(source);
      assert.ok(diags.some(d => d.message.includes("Non-exhaustive") && d.message.includes("rect")));
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
    it("reports error on return type mismatch", () => {
      const source = `
        fn add(a: Int, b: Int) -> Str {
          a + b
        }
      `;
      const diags = check_expecting_errors(source);
      assert.ok(diags.some(d => d.message.includes("unify") || d.message.includes("mismatch")));
    });

    it("reports error on argument type mismatch", () => {
      const source = `
        fn add(a: Int, b: Int) -> Int { a + b }
        fn main() -> Int { add(1, true) }
      `;
      const diags = check_expecting_errors(source);
      assert.ok(diags.some(d => d.message.includes("unify") || d.message.includes("mismatch")));
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

  describe("trait declarations", () => {
    it("type-checks a simple trait + impl", () => {
      const source = `
        trait Greetable {
          fn greet(self) -> Str
        }
        struct User { name: Str }
        impl Greetable for User {
          fn greet(self) -> Str { self.name }
        }
        fn main() -> Str {
          let u = User { name: "yufeng" }
          u.greet()
        }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "str");
    });

    it("type-checks generic function with trait bound", () => {
      const source = `
        trait ToStr {
          fn to_str(self) -> Str
        }
        struct Num { val: Int }
        impl ToStr for Num {
          fn to_str(self) -> Str { "num" }
        }
        fn show<T: ToStr>(x: T) -> Str {
          x.to_str()
        }
        fn main() -> Str {
          show(Num { val: 42 })
        }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "str");
    });

    it("rejects missing trait impl method", () => {
      const source = `
        trait Greetable {
          fn greet(self) -> Str
        }
        struct User { name: Str }
        impl Greetable for User {
        }
      `;
      const diags = check_expecting_errors(source);
      assert.ok(diags.some(d => /[Mm]issing.*method.*greet/.test(d.message)));
    });
  });

  describe("Unit type annotation", () => {
    it("accepts Unit as return type annotation", () => {
      const fn_decl = check_fn("fn noop() -> Unit { }");
      assert.equal(fn_decl.return_type.kind, "unit");
    });
  });

  describe("zonk: type variables resolved in HIR (regression)", () => {
    it("body expressions have concrete types, not ?N", () => {
      const program = check_source("fn main() -> Int {\n  let x = 42\n  x + 1\n}");
      const fn_decl = program.decls.find(d => d.kind === "fn_decl") as HFnDecl;
      const tail = fn_decl.body.tail!;
      assert.equal(type_to_string(tail.type), "Int");
      assert.ok(!type_to_string(tail.type).includes("?"));
    });

    it("generic type params display as names, not ?N", () => {
      const program = check_source(
        "trait Show { fn show(self) -> Str }\n" +
        "fn display<T: Show>(x: T) -> Str { x.show() }"
      );
      const fn_decl = program.decls.find(
        d => d.kind === "fn_decl" && d.name === "display"
      ) as HFnDecl;
      assert.equal(type_to_string(fn_decl.params[0].type), "T");
    });

    it("generic body uses function param name T, not trait Self", () => {
      const program = check_source(
        "trait Greetable { fn greet(self) -> Str }\n" +
        "struct User { name: Str }\n" +
        "impl Greetable for User { fn greet(self) -> Str { self.name } }\n" +
        "fn show<T: Greetable>(x: T) -> Str { x.greet() }"
      );
      const fn_decl = program.decls.find(
        d => d.kind === "fn_decl" && d.name === "show"
      ) as HFnDecl;
      const tail = fn_decl.body.tail!;
      assert.equal(tail.kind, "call");
      if (tail.kind === "call") {
        const callee_type = type_to_string(tail.callee.type);
        assert.ok(callee_type.includes("T"), `expected T in callee type, got: ${callee_type}`);
        assert.ok(!callee_type.includes("Self"), `unexpected Self in callee type: ${callee_type}`);
      }
    });

    it("impl method self param resolved to target type", () => {
      const program = check_source(
        "trait Greetable { fn greet(self) -> Str }\n" +
        "struct User { name: Str }\n" +
        "impl Greetable for User { fn greet(self) -> Str { self.name } }"
      );
      const impl_decl = program.decls.find(d => d.kind === "impl_decl") as HImplDecl;
      const greet = impl_decl.methods[0];
      assert.equal(type_to_string(greet.params[0].type), "User");
    });

    it("effect rows preserved on function declarations", () => {
      const program = check_source(
        "fn read_it() -> Str { io.read(\"f\") }"
      );
      const fn_decl = program.decls.find(d => d.kind === "fn_decl") as HFnDecl;
      const eff = effect_row_to_string(fn_decl.effects);
      assert.ok(eff.includes("io"), `expected io effect, got: ${eff}`);
    });

    it("row variable tails display as names, not ?N", () => {
      const program = check_source(
        "fn get_name(r: {name: Str, ..rest}) -> Str { r.name }"
      );
      const fn_decl = program.decls.find(d => d.kind === "fn_decl") as HFnDecl;
      const param_type = type_to_string(fn_decl.params[0].type);
      assert.ok(param_type.includes("rest"), `expected ..rest, got: ${param_type}`);
      assert.ok(!param_type.includes("?"), `unexpected ?N in: ${param_type}`);
    });

    it("Option return type displays as T?", () => {
      const program = check_source(
        "fn find(x: Int) -> Int? { if x > 0 { some(x) } else { none } }"
      );
      const fn_decl = program.decls.find(d => d.kind === "fn_decl") as HFnDecl;
      assert.equal(type_to_string(fn_decl.return_type), "Int?");
    });
  });

  describe("struct literal field validation (M2)", () => {
    it("reports missing field in struct literal", () => {
      const diags = check_expecting_errors(`
        struct Point { x: Int, y: Int }
        fn main() -> Int { let p = Point { x: 1 }; p.x }
      `);
      assert.ok(diags.some(d => d.code === "E0203" && /[Mm]issing.*field.*y/.test(d.message)));
    });

    it("reports unknown field in struct literal", () => {
      const diags = check_expecting_errors(`
        struct Point { x: Int, y: Int }
        fn main() -> Int { let p = Point { x: 1, y: 2, z: 3 }; p.x }
      `);
      assert.ok(diags.some(d => d.code === "E0203" && /no field.*z/.test(d.message)));
    });
  });

  describe("nested exhaustiveness (I1)", () => {
    it("detects missing nested pattern some(none)", () => {
      const diags = check_expecting_errors(`
        fn f(x: Option<Int?>) -> Int {
          match x {
            some(some(v)) => v,
            none => 0,
          }
        }
      `);
      assert.ok(diags.some(d => d.code === "E0601" && /some\(none\)/.test(d.message)));
    });

    it("accepts fully exhaustive nested match", () => {
      const program = check_source(`
        fn f(x: Option<Int?>) -> Int {
          match x {
            some(some(v)) => v,
            some(none) => 0,
            none => -1,
          }
        }
      `);
      assert.ok(program.decls.length > 0);
    });
  });

  describe("tuple cross-column exhaustiveness (I10)", () => {
    it("detects missing (true, false) when only diagonal covered", () => {
      const diags = check_expecting_errors(`
        fn f(x: (Bool, Bool)) -> Str {
          match x {
            (true, true) => "tt",
            (false, false) => "ff",
          }
        }
      `);
      assert.ok(diags.some(d => d.code === "E0601" && /true.*false/.test(d.message)));
    });

    it("accepts fully exhaustive tuple match", () => {
      const program = check_source(`
        fn f(x: (Bool, Bool)) -> Str {
          match x {
            (true, true) => "tt",
            (true, false) => "tf",
            (false, _) => "f*",
          }
        }
      `);
      assert.ok(program.decls.length > 0);
    });

    it("detects missing combination with Option tuple", () => {
      const diags = check_expecting_errors(`
        fn f(x: (Int?, Bool)) -> Int {
          match x {
            (some(v), true) => v,
            (none, false) => 0,
          }
        }
      `);
      assert.ok(diags.some(d => d.code === "E0601"));
    });
  });

  describe("let immutability enforcement (E0205)", () => {
    it("assign to let binding reports E0205", () => {
      const diags = check_expecting_errors(`fn main() { let x = 1; x = 2; }`);
      assert.ok(diags.some(d => d.code === "E0205"));
    });

    it("assign to var binding is allowed", () => {
      const program = check_source(`fn main() { var x = 1; x = 2; }`);
      assert.ok(program.decls.length > 0);
    });
  });

  describe("undefined method on concrete type (I4)", () => {
    it("reports E0305 for undefined method on struct", () => {
      const diags = check_expecting_errors(`
        struct Point { x: Int, y: Int }
        fn main() -> Int { let p = Point { x: 1, y: 2 }; p.foo() }
      `);
      assert.ok(diags.some(d => d.code === "E0305" && /no method.*foo/.test(d.message)));
    });

    it("reports E0305 for undefined method on enum", () => {
      const diags = check_expecting_errors(`
        enum Color { red(), blue() }
        fn main() -> Int { let c = red; c.bar() }
      `);
      assert.ok(diags.some(d => d.code === "E0305" && /no method.*bar/.test(d.message)));
    });
  });

  describe("while statement", () => {
    it("type-checks while loop with Bool condition", () => {
      const program = check_source(`fn main() { var i = 0; while i < 5 { i += 1; } }`);
      assert.ok(program.decls.length > 0);
    });

    it("rejects while loop with non-Bool condition", () => {
      const diags = check_expecting_errors(`fn main() { while 42 { print(1); } }`);
      assert.ok(diags.some(d => d.code === "E0301"), `expected E0301, got: ${diags.map(d => d.code).join(", ")}`);
    });
  });

  describe("for..in statement", () => {
    it("type-checks for..in range with Int bounds", () => {
      const program = check_source(`fn main() { for i in 0..10 { let x = i; } }`);
      assert.ok(program.decls.length > 0);
    });

    it("reports E0206 for break outside loop", () => {
      const diags = check_expecting_errors(`fn main() { break; }`);
      assert.ok(diags.some(d => d.code === "E0206"), `expected E0206, got: ${diags.map(d => d.code).join(", ")}`);
    });
  });

  describe("builtin + stdlib method registry consistency (I15)", () => {
    it("after prelude loading, impl_methods contain all shared method names", () => {
      const { env } = check({ uses: [], decls: [], span: { file: "<test>", start: { line: 1, column: 0, offset: 0 }, end: { line: 1, column: 0, offset: 0 } } });
      const expected: [string, readonly string[]][] = [
        [BUILTIN_CELL, [...CELL_METHODS]],
        [BUILTIN_STR, [...STR_METHODS]],
        [BUILTIN_INT, [...INT_METHODS]],
        [BUILTIN_FLOAT, [...FLOAT_METHODS]],
        [BUILTIN_LIST, [...LIST_NON_HOF_METHODS, ...LIST_HOF_METHODS]],
        [BUILTIN_MAP, [...MAP_NON_HOF_METHODS, ...MAP_HOF_METHODS]],
        [BUILTIN_SET, [...SET_NON_HOF_METHODS, ...SET_HOF_METHODS]],
      ];
      for (const [type_name, method_names] of expected) {
        const methods = env.impl_methods.get(type_name);
        assert.ok(methods, `missing impl_methods for "${type_name}"`);
        const registered = [...methods!.keys()].sort();
        const shared = [...method_names].sort();
        assert.deepStrictEqual(registered, shared,
          `impl_methods mismatch for ${type_name}: has [${registered}] but expected [${shared}]`);
      }
    });
  });
});
