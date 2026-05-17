// Ring-lang Parser tests
import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { Lexer, TokenKind } from "./lexer.js";
import { Parser } from "./parser.js";
import { CollectingSink } from "../diagnostics/index.js";
import { CompileError } from "../errors.js";

// ============================================================
// Lexer tests
// ============================================================

describe("Lexer", () => {
  it("tokenizes keywords", () => {
    const lexer = new Lexer("fn let var struct enum match impl effect handle with if else or catch test return for in pub where true false trait");
    const tokens = lexer.tokenize();
    const kinds = tokens.map(t => t.kind).filter(k => k !== TokenKind.Eof);
    assert.deepEqual(kinds, [
      TokenKind.Fn, TokenKind.Let, TokenKind.Var, TokenKind.Struct, TokenKind.Enum,
      TokenKind.Match, TokenKind.Impl, TokenKind.Effect, TokenKind.Handle, TokenKind.With,
      TokenKind.If, TokenKind.Else, TokenKind.Or, TokenKind.Catch, TokenKind.Test,
      TokenKind.Return, TokenKind.For, TokenKind.In, TokenKind.Pub, TokenKind.Where,
      TokenKind.True, TokenKind.False, TokenKind.Trait,
    ]);
  });

  it("tokenizes numbers", () => {
    const lexer = new Lexer("42 3.14 0 100");
    const tokens = lexer.tokenize();
    const nums = tokens.filter(t => t.kind !== TokenKind.Eof);
    assert.equal(nums[0].kind, TokenKind.IntLit);
    assert.equal(nums[0].value, "42");
    assert.equal(nums[1].kind, TokenKind.FloatLit);
    assert.equal(nums[1].value, "3.14");
    assert.equal(nums[2].kind, TokenKind.IntLit);
    assert.equal(nums[2].value, "0");
    assert.equal(nums[3].kind, TokenKind.IntLit);
    assert.equal(nums[3].value, "100");
  });

  it("tokenizes strings", () => {
    const lexer = new Lexer('"hello world"');
    const tokens = lexer.tokenize();
    assert.equal(tokens[0].kind, TokenKind.StringLit);
    assert.equal(tokens[0].value, "hello world");
  });

  it("tokenizes string interpolation", () => {
    const lexer = new Lexer('"Hello ${name}, you have ${count} items"');
    const tokens = lexer.tokenize();
    const nonEof = tokens.filter(t => t.kind !== TokenKind.Eof);
    assert.equal(nonEof[0].kind, TokenKind.StringInterpStart);
    assert.equal(nonEof[0].value, "Hello ");
    assert.equal(nonEof[1].kind, TokenKind.Ident);
    assert.equal(nonEof[1].value, "name");
    assert.equal(nonEof[2].kind, TokenKind.StringInterpMiddle);
    assert.equal(nonEof[2].value, ", you have ");
    assert.equal(nonEof[3].kind, TokenKind.Ident);
    assert.equal(nonEof[3].value, "count");
    assert.equal(nonEof[4].kind, TokenKind.StringInterpEnd);
    assert.equal(nonEof[4].value, " items");
  });

  it("tokenizes operators", () => {
    const lexer = new Lexer("+ - * / % == != < > <= >= && || ! = += -= => ->");
    const tokens = lexer.tokenize();
    const kinds = tokens.map(t => t.kind).filter(k => k !== TokenKind.Eof);
    assert.deepEqual(kinds, [
      TokenKind.Plus, TokenKind.Minus, TokenKind.Star, TokenKind.Slash, TokenKind.Percent,
      TokenKind.EqEq, TokenKind.BangEq, TokenKind.Lt, TokenKind.Gt, TokenKind.LtEq,
      TokenKind.GtEq, TokenKind.AmpAmp, TokenKind.PipePipe, TokenKind.Bang, TokenKind.Eq,
      TokenKind.PlusEq, TokenKind.MinusEq, TokenKind.FatArrow, TokenKind.Arrow,
    ]);
  });

  it("skips line comments", () => {
    const lexer = new Lexer("let x = 1 // this is a comment\nlet y = 2");
    const tokens = lexer.tokenize();
    const idents = tokens.filter(t => t.kind === TokenKind.Ident);
    assert.equal(idents.length, 2);
    assert.equal(idents[0].value, "x");
    assert.equal(idents[1].value, "y");
  });

  it("tracks line and column positions", () => {
    const lexer = new Lexer("fn\nfoo");
    const tokens = lexer.tokenize();
    assert.equal(tokens[0].span.start.line, 1);
    assert.equal(tokens[0].span.start.column, 0);
    assert.equal(tokens[1].span.start.line, 2);
    assert.equal(tokens[1].span.start.column, 0);
  });

  it("tokenizes raw strings", () => {
    const lexer = new Lexer('r#"hello ${not interpolated}"#');
    const tokens = lexer.tokenize();
    assert.equal(tokens[0].kind, TokenKind.RawStringLit);
    assert.equal(tokens[0].value, "hello ${not interpolated}");
  });

  it("tokenizes delimiters", () => {
    const lexer = new Lexer("( ) { } [ ] , : . ;");
    const tokens = lexer.tokenize();
    const kinds = tokens.map(t => t.kind).filter(k => k !== TokenKind.Eof);
    assert.deepEqual(kinds, [
      TokenKind.LParen, TokenKind.RParen, TokenKind.LBrace, TokenKind.RBrace,
      TokenKind.LBracket, TokenKind.RBracket, TokenKind.Comma, TokenKind.Colon,
      TokenKind.Dot, TokenKind.Semi,
    ]);
  });
});

// ============================================================
// Lexer token edge cases (M8)
// ============================================================

describe("lexer token edge cases", () => {
  it("handles escape chars in strings: \\n, \\t, \\\", \\\\", () => {
    const lexer = new Lexer('"line1\\nline2\\ttab\\\\back\\"quote"');
    const tokens = lexer.tokenize();
    const str = tokens[0];
    assert.equal(str.kind, TokenKind.StringLit);
    assert.equal(str.value, 'line1\nline2\ttab\\back"quote');
  });

  it("tokenizes .. as DotDot", () => {
    const lexer = new Lexer("1..10");
    const tokens = lexer.tokenize();
    const kinds = tokens.map(t => t.kind).filter(k => k !== TokenKind.Eof);
    assert.deepEqual(kinds, [TokenKind.IntLit, TokenKind.DotDot, TokenKind.IntLit]);
    assert.equal(tokens[1].value, "..");
  });

  it("tokenizes ? as Question", () => {
    const lexer = new Lexer("x?");
    const tokens = lexer.tokenize();
    const kinds = tokens.map(t => t.kind).filter(k => k !== TokenKind.Eof);
    assert.deepEqual(kinds, [TokenKind.Ident, TokenKind.Question]);
    assert.equal(tokens[1].value, "?");
  });
});

// ============================================================
// Parser tests
// ============================================================

describe("Parser", () => {
  describe("function declarations", () => {
    it("parses a simple function", () => {
      const program = Parser.parse("fn add(a: Int, b: Int) -> Int { a + b }");
      assert.equal(program.decls.length, 1);
      const fn_decl = program.decls[0];
      assert.equal(fn_decl.kind, "fn_decl");
      if (fn_decl.kind !== "fn_decl") return;
      assert.equal(fn_decl.name, "add");
      assert.equal(fn_decl.params.length, 2);
      assert.equal(fn_decl.params[0].name, "a");
      assert.equal(fn_decl.params[1].name, "b");
      assert.equal(fn_decl.return_type?.kind, "named");
      assert.equal(fn_decl.body.kind, "block");
    });

    it("parses pub function", () => {
      const program = Parser.parse("pub fn greet() { }");
      assert.equal(program.decls.length, 1);
      const fn_decl = program.decls[0];
      assert.equal(fn_decl.kind, "fn_decl");
      if (fn_decl.kind !== "fn_decl") return;
      assert.equal(fn_decl.is_pub, true);
    });

    it("parses function with type params", () => {
      const program = Parser.parse("fn identity<T>(x: T) -> T { x }");
      const fn_decl = program.decls[0];
      assert.equal(fn_decl.kind, "fn_decl");
      if (fn_decl.kind !== "fn_decl") return;
      assert.equal(fn_decl.type_params.length, 1);
      assert.equal(fn_decl.type_params[0].name, "T");
    });
  });

  describe("struct declarations", () => {
    it("parses a struct", () => {
      const program = Parser.parse(`struct Config {
        host: Str,
        port: Int,
      }`);
      assert.equal(program.decls.length, 1);
      const decl = program.decls[0];
      assert.equal(decl.kind, "struct_decl");
      if (decl.kind !== "struct_decl") return;
      assert.equal(decl.name, "Config");
      assert.equal(decl.fields.length, 2);
      assert.equal(decl.fields[0].name, "host");
      assert.equal(decl.fields[1].name, "port");
    });

    it("parses struct with where clause", () => {
      const program = Parser.parse(`struct Config {
        port: Int where 1024 < it < 65536,
      }`);
      const decl = program.decls[0];
      assert.equal(decl.kind, "struct_decl");
      if (decl.kind !== "struct_decl") return;
      assert.equal(decl.fields.length, 1);
      assert.equal(decl.fields[0].name, "port");
    });
  });

  describe("enum declarations", () => {
    it("parses an enum", () => {
      const program = Parser.parse("enum Shape { circle(Float), rect(Float, Float) }");
      assert.equal(program.decls.length, 1);
      const decl = program.decls[0];
      assert.equal(decl.kind, "enum_decl");
      if (decl.kind !== "enum_decl") return;
      assert.equal(decl.name, "Shape");
      assert.equal(decl.variants.length, 2);
      assert.equal(decl.variants[0].name, "circle");
      assert.equal(decl.variants[0].fields.length, 1);
      assert.equal(decl.variants[1].name, "rect");
      assert.equal(decl.variants[1].fields.length, 2);
    });
  });

  describe("impl declarations", () => {
    it("parses impl block", () => {
      const program = Parser.parse(`impl Shape {
        fn area(self) -> Float { 0.0 }
      }`);
      const decl = program.decls[0];
      assert.equal(decl.kind, "impl_decl");
      if (decl.kind !== "impl_decl") return;
      assert.equal(decl.target_type, "Shape");
      assert.equal(decl.methods.length, 1);
      assert.equal(decl.methods[0].name, "area");
    });
  });

  describe("effect declarations", () => {
    it("parses effect declaration", () => {
      const program = Parser.parse(`effect io {
        fn read(path: Str) -> Str
        fn write(path: Str, data: Str) -> Unit
      }`);
      const decl = program.decls[0];
      assert.equal(decl.kind, "effect_decl");
      if (decl.kind !== "effect_decl") return;
      assert.equal(decl.name, "io");
      assert.equal(decl.ops.length, 2);
      assert.equal(decl.ops[0].name, "read");
      assert.equal(decl.ops[1].name, "write");
    });
  });

  describe("test declarations", () => {
    it("parses test block", () => {
      const program = Parser.parse(`test "basic math" { assert(1 + 1 == 2) }`);
      const decl = program.decls[0];
      assert.equal(decl.kind, "test_decl");
      if (decl.kind !== "test_decl") return;
      assert.equal(decl.description, "basic math");
      assert.equal(decl.body.kind, "block");
    });
  });

  describe("expressions", () => {
    it("parses operator precedence: 1 + 2 * 3", () => {
      const program = Parser.parse("fn main() { 1 + 2 * 3 }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "bin_op");
      if (tail.kind !== "bin_op") return;
      assert.equal(tail.op, "+");
      assert.equal(tail.left.kind, "int_lit");
      // Right should be 2 * 3
      assert.equal(tail.right.kind, "bin_op");
      if (tail.right.kind !== "bin_op") return;
      assert.equal(tail.right.op, "*");
    });

    it("parses function calls", () => {
      const program = Parser.parse("fn main() { foo(1, 2) }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "call");
      if (tail.kind !== "call") return;
      assert.equal(tail.args.length, 2);
    });

    it("parses method calls", () => {
      const program = Parser.parse("fn main() { x.foo(1) }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "method_call");
      if (tail.kind !== "method_call") return;
      assert.equal(tail.method, "foo");
      assert.equal(tail.args.length, 1);
    });

    it("parses field access", () => {
      const program = Parser.parse("fn main() { config.host }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "field_access");
      if (tail.kind !== "field_access") return;
      assert.equal(tail.field, "host");
    });

    it("parses if expressions", () => {
      const program = Parser.parse("fn main() { if x > 0 { x } else { 0 } }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "if_expr");
      if (tail.kind !== "if_expr") return;
      assert.ok(tail.else_branch);
    });

    it("parses match expressions", () => {
      const program = Parser.parse(`fn main() {
        match s {
          circle(r) => 3.14 * r * r,
          rect(w, h) => w * h,
        }
      }`);
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "match_expr");
      if (tail.kind !== "match_expr") return;
      assert.equal(tail.arms.length, 2);
      assert.equal(tail.arms[0].pattern.kind, "constructor");
      assert.equal(tail.arms[1].pattern.kind, "constructor");
    });

    it("parses struct literals", () => {
      const program = Parser.parse("fn main() { Config { host: url, port: 8080 } }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "struct_lit");
      if (tail.kind !== "struct_lit") return;
      assert.equal(tail.name, "Config");
      assert.equal(tail.fields.length, 2);
      assert.equal(tail.fields[0].name, "host");
      assert.equal(tail.fields[1].name, "port");
    });

    it("parses or expressions", () => {
      const program = Parser.parse("fn main() { get_value() or 42 }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "or_expr");
      if (tail.kind !== "or_expr") return;
      assert.equal(tail.default_value.kind, "int_lit");
    });

    it("parses catch expressions", () => {
      const program = Parser.parse("fn main() { parse(input) catch fn(e) { default_value() } }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "catch_expr");
      if (tail.kind !== "catch_expr") return;
      assert.equal(tail.error_binding, "e");
      assert.equal(tail.handler.kind, "block");
    });

    it("parses lambda expressions", () => {
      const program = Parser.parse("fn main() { fn(x: Int) -> Int { x + 1 } }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "lambda");
      if (tail.kind !== "lambda") return;
      assert.equal(tail.params.length, 1);
      assert.equal(tail.params[0].name, "x");
    });

    it("parses unary expressions", () => {
      const program = Parser.parse("fn main() { -x }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "unary_op");
      if (tail.kind !== "unary_op") return;
      assert.equal(tail.op, "-");
    });

    it("parses boolean literals", () => {
      const program = Parser.parse("fn main() { true }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "bool_lit");
      if (tail.kind !== "bool_lit") return;
      assert.equal(tail.value, true);
    });
  });

  describe("string interpolation", () => {
    it("parses string interpolation expressions", () => {
      const program = Parser.parse('fn main() { "Hello ${name}, you have ${count} items" }');
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "string_interp");
      if (tail.kind !== "string_interp") return;
      assert.equal(tail.parts.length, 5);
      assert.equal(tail.parts[0], "Hello ");
      const part1 = tail.parts[1];
      assert.ok(typeof part1 === "object" && part1.kind === "ident");
      assert.equal(tail.parts[2], ", you have ");
      const part3 = tail.parts[3];
      assert.ok(typeof part3 === "object" && part3.kind === "ident");
      assert.equal(tail.parts[4], " items");
    });
  });

  describe("handle/with expressions", () => {
    it("parses handle/with blocks", () => {
      const program = Parser.parse(`fn main() {
        handle {
          let data = io.read("file.txt")
          process(data)
        } with {
          io.read(path) => "mock data",
          fail.fail(e) => panic("error"),
        }
      }`);
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "handle_expr");
      if (tail.kind !== "handle_expr") return;
      assert.equal(tail.handlers.length, 2);
      assert.equal(tail.handlers[0].effect_name, "io");
      assert.equal(tail.handlers[0].op_name, "read");
      assert.equal(tail.handlers[0].params.length, 1);
      assert.equal(tail.handlers[1].effect_name, "fail");
      assert.equal(tail.handlers[1].op_name, "fail");
    });
  });

  describe("statements", () => {
    it("parses let statements", () => {
      const program = Parser.parse("fn main() { let x = 42; x }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      assert.equal(fn_decl.body.stmts.length, 1);
      assert.equal(fn_decl.body.stmts[0].kind, "let_stmt");
    });

    it("parses var statements", () => {
      const program = Parser.parse("fn main() { var x = 0; x }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      assert.equal(fn_decl.body.stmts.length, 1);
      assert.equal(fn_decl.body.stmts[0].kind, "var_stmt");
    });

    it("parses return statements", () => {
      const program = Parser.parse("fn main() { return 42 }");
      const fn_decl = program.decls[0];
      if (fn_decl.kind !== "fn_decl") return;
      // return is a statement, so it will be in stmts (not tail, since it has a keyword)
      // Actually: return 42 is followed by }, so it becomes the last item
      // It's a return_stmt, not an expr_stmt, so it goes to stmts
      assert.equal(fn_decl.body.stmts.length, 1);
      assert.equal(fn_decl.body.stmts[0].kind, "return_stmt");
    });
  });

  describe("trait declarations", () => {
    it("parses a simple trait", () => {
      const program = Parser.parse(`trait Printable {
        fn print(self) -> Unit
      }`);
      assert.equal(program.decls.length, 1);
      const decl = program.decls[0];
      assert.equal(decl.kind, "trait_decl");
      if (decl.kind !== "trait_decl") return;
      assert.equal(decl.name, "Printable");
      assert.equal(decl.methods.length, 1);
      assert.equal(decl.methods[0].name, "print");
      assert.equal(decl.methods[0].is_abstract, true);
    });

    it("parses trait with default method", () => {
      const program = Parser.parse(`trait Printable {
        fn print(self) -> Unit {
          println("default")
        }
      }`);
      assert.equal(program.decls.length, 1);
      const decl = program.decls[0];
      assert.equal(decl.kind, "trait_decl");
      if (decl.kind !== "trait_decl") return;
      assert.equal(decl.methods.length, 1);
      assert.equal(decl.methods[0].name, "print");
      assert.equal(decl.methods[0].is_abstract, undefined);
    });

    it("parses generic constraint with bounds", () => {
      const program = Parser.parse("fn sort<T: Ord>(xs: T) -> T { xs }");
      assert.equal(program.decls.length, 1);
      const decl = program.decls[0];
      assert.equal(decl.kind, "fn_decl");
      if (decl.kind !== "fn_decl") return;
      assert.equal(decl.type_params.length, 1);
      assert.equal(decl.type_params[0].name, "T");
      assert.equal(decl.type_params[0].bounds.length, 1);
      assert.equal(decl.type_params[0].bounds[0].trait_name, "Ord");
    });

    it("parses multi-bound constraints", () => {
      const program = Parser.parse("fn foo<T: A + B>(x: T) -> T { x }");
      assert.equal(program.decls.length, 1);
      const decl = program.decls[0];
      assert.equal(decl.kind, "fn_decl");
      if (decl.kind !== "fn_decl") return;
      assert.equal(decl.type_params.length, 1);
      assert.equal(decl.type_params[0].name, "T");
      assert.equal(decl.type_params[0].bounds.length, 2);
      assert.equal(decl.type_params[0].bounds[0].trait_name, "A");
      assert.equal(decl.type_params[0].bounds[1].trait_name, "B");
    });
  });

  describe("complex programs", () => {
    it("parses area function with match", () => {
      const source = `
fn area(s: Shape) -> Float {
    match s {
        circle(r) => 3.14 * r * r,
        rect(w, h) => w * h,
    }
}`;
      const program = Parser.parse(source);
      assert.equal(program.decls.length, 1);
      const fn_decl = program.decls[0];
      assert.equal(fn_decl.kind, "fn_decl");
      if (fn_decl.kind !== "fn_decl") return;
      assert.equal(fn_decl.name, "area");
      const tail = fn_decl.body.tail;
      assert.ok(tail);
      assert.equal(tail.kind, "match_expr");
    });

    it("parses multiple declarations", () => {
      const source = `
struct Point { x: Float, y: Float }
enum Color { red, green, blue }
fn main() { 0 }
`;
      const program = Parser.parse(source);
      assert.equal(program.decls.length, 3);
      assert.equal(program.decls[0].kind, "struct_decl");
      assert.equal(program.decls[1].kind, "enum_decl");
      assert.equal(program.decls[2].kind, "fn_decl");
    });
  });

  describe("error recovery", () => {
    it("reports error to sink on unexpected token", () => {
      const sink = new CollectingSink();
      assert.throws(() => Parser.parse("123 foo bar", "<test>", sink), CompileError);
      assert.ok(sink.has_errors());
      const diags = sink.diagnostics();
      assert.ok(diags.length >= 1);
      assert.ok(diags[0].code.startsWith("E01"));
    });

    it("collects multiple errors across declarations", () => {
      const source = `
fn valid() -> Int { 1 }
xyz invalid_stuff
fn also_valid() -> Int { 2 }
abc more_invalid
`;
      const sink = new CollectingSink();
      assert.throws(() => Parser.parse(source, "<test>", sink), CompileError);
      const diags = sink.diagnostics();
      assert.ok(diags.length >= 2, `Expected >= 2 diagnostics, got ${diags.length}`);
    });

    it("still parses valid declarations despite errors", () => {
      const source = `
fn good() -> Int { 1 }
!!! bad
fn also_good() -> Int { 2 }
`;
      const sink = new CollectingSink();
      try {
        const program = Parser.parse(source, "<test>", sink);
        assert.ok(program.decls.length >= 1);
      } catch (e) {
        assert.ok(e instanceof CompileError);
        assert.ok(sink.diagnostics().length >= 1);
      }
    });
  });
});
