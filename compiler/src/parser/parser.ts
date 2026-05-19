// Ring-lang Parser — thin shell class.
// Delegates to parser-decl.ts (declarations), parser-expr.ts (expressions,
// types, patterns) via the ParserCtx interface defined in parser-ctx.ts.

import {
  Program, Decl, UseDecl,
  Stmt, LetStmt, VarStmt, AssignStmt, ExprStmt, ReturnStmt, WhileStmt, BreakStmt, ContinueStmt,
  ForInStmt, LetDestructureStmt, IfLetStmt,
  Expr, BinOpExpr,
  BlockExpr, TypeExpr,
  Pattern, Param, TypeParam, TypeBound,
  Span, Position,
} from "../ast/index.js";
import type { TuplePattern } from "../ast/index.js";
import { Token, TokenKind, Lexer } from "./lexer.js";
import { DiagnosticSink, CollectingSink, make_diagnostic } from "../diagnostics/index.js";
import { E } from "../diagnostics/codes.js";
import { CompileError } from "../errors.js";
import type { ParserCtx } from "./parser-ctx.js";
import { Prec } from "./parser-ctx.js";

// Import from sub-parser modules
import { parse_decl, parse_use_decl } from "./parser-decl.js";
import {
  parse_expr, parse_expr_bp, parse_prefix,
  parse_type_expr, try_parse_type_args, parse_pattern,
  parse_type_params, parse_type_bound,
  parse_params, parse_param,
} from "./parser-expr.js";

// ============================================================
// Parser — implements ParserCtx, delegates to standalone functions
// ============================================================

export class Parser implements ParserCtx {
  tokens: Token[];
  pos: number = 0;
  file: string;
  sink: DiagnosticSink;
  error_count: number = 0;
  private static MAX_ERRORS = 20;

  constructor(tokens: Token[], file: string = "<stdin>", sink?: DiagnosticSink) {
    this.tokens = tokens;
    this.file = file;
    this.sink = sink ?? new CollectingSink();
  }

  static parse(source: string, file: string = "<stdin>", sink?: DiagnosticSink): Program {
    const shared_sink = sink ?? new CollectingSink();
    const lexer = new Lexer(source, file, shared_sink);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, file, shared_sink);
    return parser.parse_program();
  }

  // ============================================================
  // Program
  // ============================================================

  parse_program(): Program {
    const start = this.current_span_start();
    const uses: UseDecl[] = [];
    const decls: Decl[] = [];
    let decls_started = false;

    while (!this.at_end()) {
      if (this.peek().kind === TokenKind.Error) { this.advance(); continue; }

      // Check for `use` or `pub use` before regular declarations
      if (this.check(TokenKind.Use)) {
        if (decls_started) {
          this.report_error(E.E0706, "Use declaration must appear before other declarations", this.peek().span);
        }
        try {
          uses.push(parse_use_decl(this, false));
        } catch (e) {
          if (e instanceof CompileError) throw e;
          this.synchronize();
        }
        continue;
      }

      if (this.check(TokenKind.Pub)) {
        // Speculatively check if this is `pub use`
        const save_pos = this.pos;
        const save_errors = this.error_count;
        const sink_checkpoint = this.sink.save?.();
        this.advance(); // consume `pub`
        if (this.check(TokenKind.Use)) {
          if (decls_started) {
            this.report_error(E.E0706, "Use declaration must appear before other declarations", this.tokens[save_pos].span);
          }
          try {
            uses.push(parse_use_decl(this, true));
          } catch (e) {
            if (e instanceof CompileError) throw e;
            this.synchronize();
          }
          continue;
        }
        // Not `pub use` — restore and fall through to regular decl parsing
        this.pos = save_pos;
        this.error_count = save_errors;
        if (sink_checkpoint !== undefined) this.sink.restore?.(sink_checkpoint);
      }

      // Regular declaration
      decls_started = true;
      try {
        decls.push(parse_decl(this));
      } catch (e) {
        if (e instanceof CompileError) throw e;
        // Recover: synchronize to next declaration boundary
        this.synchronize();
      }
    }
    if (this.sink.has_errors()) {
      throw new CompileError([...this.sink.diagnostics()]);
    }
    const end = this.current_span_start();
    return { uses, decls, span: this.make_span(start, end) };
  }

  // ============================================================
  // Statements (kept here — they cross-call decl + expr parsers)
  // ============================================================

  parse_stmt(): Stmt {
    const start = this.current_span_start();

    if (this.check(TokenKind.Let)) {
      // Look ahead: if next token after `let` is `(`, it's a destructuring statement
      const saved_pos = this.pos;
      this.advance(); // consume `let`
      if (this.check(TokenKind.LParen)) {
        const pattern = this.parse_pattern() as TuplePattern;
        this.expect(TokenKind.Eq);
        const init = this.parse_expr();
        this.try_consume(TokenKind.Semi);
        const end = this.current_span_start();
        return {
          kind: "let_destructure",
          pattern,
          init,
          span: this.make_span(start, end),
        } as LetDestructureStmt;
      }
      // Not a destructuring — backtrack and parse normally
      this.pos = saved_pos;
      return this.parse_binding_stmt(false);
    }
    if (this.check(TokenKind.Var)) {
      return this.parse_binding_stmt(true);
    }
    if (this.check(TokenKind.Return)) {
      return this.parse_return_stmt();
    }
    if (this.check(TokenKind.If)) {
      // Look ahead: if next token after `if` is `let`, parse as IfLetStmt
      const saved_pos = this.pos;
      this.advance(); // consume `if`
      if (this.check(TokenKind.Let)) {
        return this.parse_if_let_stmt(start);
      }
      // Not if-let — backtrack and fall through to expression statement
      this.pos = saved_pos;
    }
    if (this.check(TokenKind.While)) {
      return this.parse_while_stmt();
    }
    if (this.check(TokenKind.For)) {
      return this.parse_for_in_stmt();
    }
    if (this.check(TokenKind.Break)) {
      return this.parse_break_stmt();
    }
    if (this.check(TokenKind.Continue)) {
      return this.parse_continue_stmt();
    }

    // Expression statement (may turn into assignment)
    const expr = this.parse_expr();

    // Check for assignment: target = value or target += value or target -= value
    if (this.check(TokenKind.Eq) || this.check(TokenKind.PlusEq) || this.check(TokenKind.MinusEq)) {
      const op_tok = this.advance();
      const value_expr = this.parse_expr();
      this.try_consume(TokenKind.Semi);
      const end = this.current_span_start();

      let value: Expr = value_expr;
      // Desugar += and -=
      if (op_tok.kind === TokenKind.PlusEq) {
        value = { kind: "bin_op", op: "+", left: expr, right: value_expr, span: value_expr.span } as BinOpExpr;
      } else if (op_tok.kind === TokenKind.MinusEq) {
        value = { kind: "bin_op", op: "-", left: expr, right: value_expr, span: value_expr.span } as BinOpExpr;
      }

      return {
        kind: "assign_stmt", target: expr, value,
        span: this.make_span(start, end),
      } as AssignStmt;
    }

    const has_semi = this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    return {
      kind: "expr_stmt", expr, has_semi,
      span: this.make_span(start, end),
    } as ExprStmt;
  }

  private parse_while_stmt(): WhileStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.While);
    const condition = this.parse_expr();
    const body = this.parse_block_expr();
    const end = this.current_span_start();
    return {
      kind: "while_stmt",
      condition,
      body,
      span: this.make_span(start, end),
    };
  }

  private parse_for_in_stmt(): ForInStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.For);

    let binding: string;
    let binding_span: Span;
    let destructure: { names: string[]; spans: Span[] } | undefined;

    if (this.check(TokenKind.LParen)) {
      this.advance();
      const names: string[] = [];
      const spans: Span[] = [];
      const first = this.expect(TokenKind.Ident);
      names.push(first.value);
      spans.push(first.span);
      while (this.try_consume(TokenKind.Comma)) {
        if (this.check(TokenKind.RParen)) break;
        const tok = this.expect(TokenKind.Ident);
        names.push(tok.value);
        spans.push(tok.span);
      }
      this.expect(TokenKind.RParen);
      binding = names[0];
      binding_span = spans[0];
      if (names.length > 1) {
        destructure = { names, spans };
      }
    } else {
      const name_tok = this.expect(TokenKind.Ident);
      binding = name_tok.value;
      binding_span = name_tok.span;
    }

    this.expect(TokenKind.In);
    const iterable = this.parse_expr();
    const body = this.parse_block_expr();
    const end = this.current_span_start();
    return {
      kind: "for_in_stmt",
      binding,
      binding_span,
      destructure,
      iterable,
      body,
      span: this.make_span(start, end),
    };
  }

  private parse_break_stmt(): BreakStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.Break);
    this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    return { kind: "break_stmt", span: this.make_span(start, end) };
  }

  private parse_continue_stmt(): ContinueStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.Continue);
    this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    return { kind: "continue_stmt", span: this.make_span(start, end) };
  }

  // parse_if_let_stmt is called AFTER `if` has already been consumed.
  // start is the span start of the `if` token.
  private parse_if_let_stmt(start: Position): IfLetStmt {
    this.expect(TokenKind.Let); // consume `let`
    const pattern = this.parse_pattern();
    this.expect(TokenKind.Eq);
    const expr = this.parse_expr();
    const then_block = this.parse_block_expr();
    let else_block: BlockExpr | null = null;
    if (this.try_consume(TokenKind.Else)) {
      else_block = this.parse_block_expr();
    }
    const end = (else_block ?? then_block).span.end;
    return {
      kind: "if_let",
      pattern,
      expr,
      then_block,
      else_block,
      span: this.make_span(start, end),
    } as IfLetStmt;
  }

  private parse_binding_stmt(mutable: boolean): LetStmt | VarStmt {
    const start = this.current_span_start();
    this.expect(mutable ? TokenKind.Var : TokenKind.Let);
    const name_tok = this.expect(TokenKind.Ident);
    const name = name_tok.value;
    const name_span = name_tok.span;
    let type_annotation: TypeExpr | undefined;
    if (this.try_consume(TokenKind.Colon)) {
      type_annotation = this.parse_type_expr();
    }
    this.expect(TokenKind.Eq);
    const init = this.parse_expr();
    this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    const span = this.make_span(start, end);
    return mutable
      ? { kind: "var_stmt", name, name_span, type_annotation, init, span } as VarStmt
      : { kind: "let_stmt", name, name_span, type_annotation, init, span } as LetStmt;
  }

  private parse_return_stmt(): ReturnStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.Return);
    let value: Expr | undefined;
    if (!this.check(TokenKind.Semi) && !this.check(TokenKind.RBrace) && !this.at_end()) {
      value = this.parse_expr();
    }
    this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    return {
      kind: "return_stmt", value,
      span: this.make_span(start, end),
    };
  }

  // ============================================================
  // Block expression (kept here — statements need it, expressions need it)
  // ============================================================

  parse_block_expr(): BlockExpr {
    const start = this.current_span_start();
    this.expect(TokenKind.LBrace);
    const stmts: Stmt[] = [];
    let tail: Expr | undefined;

    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      const stmt = this.parse_stmt();

      if (this.check(TokenKind.RBrace)) {
        if (stmt.kind === "expr_stmt" && !(stmt as ExprStmt).has_semi) {
          tail = (stmt as ExprStmt).expr;
        } else {
          stmts.push(stmt);
        }
      } else {
        stmts.push(stmt);
      }
    }

    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "block", stmts, tail,
      span: this.make_span(start, end),
    };
  }

  // ============================================================
  // Delegation methods (ParserCtx interface → standalone functions)
  // ============================================================

  parse_expr(): Expr { return parse_expr(this); }
  parse_expr_bp(min_prec: Prec): Expr { return parse_expr_bp(this, min_prec); }
  parse_prefix(): Expr { return parse_prefix(this); }
  parse_type_expr(): TypeExpr { return parse_type_expr(this); }
  try_parse_type_args(): TypeExpr[] { return try_parse_type_args(this); }
  parse_pattern(): Pattern { return parse_pattern(this); }
  parse_params(): Param[] { return parse_params(this); }
  parse_param(): Param { return parse_param(this); }
  parse_type_params(): TypeParam[] { return parse_type_params(this); }
  parse_type_bound(): TypeBound { return parse_type_bound(this); }

  // ============================================================
  // Token helpers
  // ============================================================

  peek(): Token {
    if (this.pos >= this.tokens.length) {
      const last = this.tokens[this.tokens.length - 1];
      return last; // should be EOF
    }
    return this.tokens[this.pos];
  }

  advance(): Token {
    const tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  check(kind: TokenKind): boolean {
    return this.peek().kind === kind;
  }

  try_consume(kind: TokenKind): boolean {
    if (this.check(kind)) {
      this.advance();
      return true;
    }
    return false;
  }

  expect(kind: TokenKind): Token {
    const tok = this.peek();
    if (tok.kind !== kind) {
      throw this.error(`Expected '${kind}', got '${tok.value}' (${tok.kind})`);
    }
    return this.advance();
  }

  at_end(): boolean {
    return this.peek().kind === TokenKind.Eof;
  }

  current_span_start(): Position {
    const tok = this.peek();
    return tok.span.start;
  }

  make_span(start: Position, end: Position): Span {
    return { file: this.file, start, end };
  }

  is_uppercase(ch: string): boolean {
    return ch >= "A" && ch <= "Z";
  }

  report_error(code: string, msg: string, span?: Span): void {
    const tok = this.peek();
    const error_span = span ?? tok.span;
    this.sink.report(make_diagnostic(
      code,
      "error",
      msg,
      error_span,
      { kind: "parse_error", token: tok.value },
    ));
    this.error_count++;
    if (this.error_count >= Parser.MAX_ERRORS) {
      throw new CompileError([...this.sink.diagnostics()]);
    }
  }

  private synchronize(): void {
    while (!this.at_end()) {
      const tok = this.peek();
      if (
        tok.kind === TokenKind.Fn ||
        tok.kind === TokenKind.Struct ||
        tok.kind === TokenKind.Enum ||
        tok.kind === TokenKind.Trait ||
        tok.kind === TokenKind.Impl ||
        tok.kind === TokenKind.Effect ||
        tok.kind === TokenKind.Pub ||
        tok.kind === TokenKind.Test ||
        tok.kind === TokenKind.Use
      ) {
        return;
      }
      this.advance();
    }
  }

  error(msg: string): Error {
    const tok = this.peek();
    this.report_error(E.E0103, msg, tok.span);
    return new Error(`Parse error: ${msg}`);
  }
}
