// ParserCtx interface — the contract that sub-parser modules depend on.
// This breaks the circular dependency: parser.ts imports functions from
// parser-decl.ts / parser-expr.ts, which import ParserCtx (interface only).

import type {
  Expr, BlockExpr, TypeExpr, Pattern, Param, TypeParam, TypeBound,
  Span, Position, Stmt,
} from "../ast/index.js";
import { Token, TokenKind } from "./lexer.js";
import type { DiagnosticSink } from "../diagnostics/index.js";

// ============================================================
// Operator Precedence (lower number = lower precedence = binds less tightly)
// ============================================================

export const enum Prec {
  None = 0,
  Or = 1,         // or
  Catch = 2,      // catch
  LogicOr = 3,    // ||
  LogicAnd = 4,   // &&
  Equality = 5,   // == !=
  Compare = 6,    // < > <= >=
  Range = 7,      // ..
  AddSub = 8,     // + -
  MulDiv = 9,     // * / %
  Unary = 10,     // - !
  Postfix = 11,   // . () []
}

export function infix_precedence(kind: TokenKind): Prec {
  switch (kind) {
    case TokenKind.Or: return Prec.Or;
    case TokenKind.Catch: return Prec.Catch;
    case TokenKind.PipePipe: return Prec.LogicOr;
    case TokenKind.AmpAmp: return Prec.LogicAnd;
    case TokenKind.EqEq:
    case TokenKind.BangEq: return Prec.Equality;
    case TokenKind.Lt:
    case TokenKind.Gt:
    case TokenKind.LtEq:
    case TokenKind.GtEq: return Prec.Compare;
    case TokenKind.DotDot:
    case TokenKind.DotDotEq: return Prec.Range;
    case TokenKind.Plus:
    case TokenKind.Minus: return Prec.AddSub;
    case TokenKind.Star:
    case TokenKind.Slash:
    case TokenKind.Percent: return Prec.MulDiv;
    case TokenKind.Dot:
    case TokenKind.LParen:
    case TokenKind.Question: return Prec.Postfix;
    default: return Prec.None;
  }
}

// ============================================================
// ParserCtx — the interface that standalone parser functions use
// ============================================================

export interface ParserCtx {
  // State (directly accessible)
  tokens: Token[];
  pos: number;
  sink: DiagnosticSink;
  file: string;
  error_count: number;

  // Token utility methods
  peek(): Token;
  advance(): Token;
  check(kind: TokenKind): boolean;
  try_consume(kind: TokenKind): boolean;
  expect(kind: TokenKind): Token;
  at_end(): boolean;

  // Span helpers
  current_span_start(): Position;
  make_span(start: Position, end: Position): Span;

  // Character helpers
  is_uppercase(ch: string): boolean;

  // Error reporting
  report_error(code: string, msg: string, span?: Span): void;
  error(msg: string): Error;

  // Cross-module callbacks — these let sub-parsers call into each other
  // without circular imports
  parse_expr(): Expr;
  parse_expr_bp(min_prec: Prec): Expr;
  parse_prefix(): Expr;
  parse_type_expr(): TypeExpr;
  parse_pattern(): Pattern;
  parse_block_expr(): BlockExpr;
  parse_stmt(): Stmt;
  parse_params(): Param[];
  parse_param(): Param;
  parse_type_params(): TypeParam[];
  parse_type_bound(): TypeBound;
  try_parse_type_args(): TypeExpr[];
}
