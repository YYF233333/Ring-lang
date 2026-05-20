// Expression, type, and pattern parsers extracted from Parser.
// All functions take `ctx: ParserCtx` as first parameter.

import type {
  Expr, IntLitExpr, FloatLitExpr, StrLitExpr, BoolLitExpr, IdentExpr,
  BinOpExpr, UnaryOpExpr, CallExpr, MethodCallExpr, FieldAccessExpr,
  StructLitExpr, MatchExpr, BlockExpr, IfExpr, StringInterpExpr,
  OrExpr, CatchExpr, HandleExpr, LambdaExpr, OptionUnwrapExpr, TryBlockExpr,
  RangeExpr, ListLitExpr, TupleLitExpr,
  BinOp, UnaryOp,
  TypeExpr, NamedTypeExpr, FnTypeExpr, OptionTypeExpr, RecordTypeExpr, RecordTypeField, TupleTypeExpr,
  Pattern, WildcardPattern, BindingPattern, ConstructorPattern, LiteralPattern, TuplePattern,
  MatchArm, EffectHandler, StructFieldInit,
  Span, Position,
} from "../ast/index.js";
import type { NamedConstructorPattern } from "../ast/index.js";
import { TokenKind } from "./lexer.js";
import type { ParserCtx } from "./parser-ctx.js";
import { Prec, infix_precedence } from "./parser-ctx.js";

// ============================================================
// Expressions — Pratt Parsing
// ============================================================

export function parse_expr(ctx: ParserCtx): Expr {
  return parse_expr_bp(ctx, Prec.None);
}

export function parse_expr_bp(ctx: ParserCtx, min_prec: Prec): Expr {
  let left = parse_prefix(ctx);
  let last_was_comparison = false;

  while (true) {
    const tok = ctx.peek();
    const prec = infix_precedence(tok.kind);
    if (prec <= min_prec) break;

    if (tok.kind === TokenKind.Or) {
      left = parse_or_expr(ctx, left);
      last_was_comparison = false;
    } else if (tok.kind === TokenKind.Catch) {
      left = parse_catch_expr(ctx, left);
      last_was_comparison = false;
    } else if (tok.kind === TokenKind.Dot) {
      left = parse_dot_expr(ctx, left);
      last_was_comparison = false;
    } else if (tok.kind === TokenKind.LParen) {
      // Only treat '(' as a function call if it's on the same line as the
      // preceding expression.  A '(' on a new line starts a parenthesised
      // expression, not an argument list.
      if (tok.span.start.line > left.span.end.line) break;
      left = parse_call_expr(ctx, left);
      last_was_comparison = false;
    } else if (tok.kind === TokenKind.Question) {
      const q_tok = ctx.advance();
      left = { kind: "option_unwrap", expr: left, span: ctx.make_span(left.span.start, q_tok.span.end) } as OptionUnwrapExpr;
      last_was_comparison = false;
    } else if (tok.kind === TokenKind.DotDot || tok.kind === TokenKind.DotDotEq) {
      const inclusive = tok.kind === TokenKind.DotDotEq;
      ctx.advance();
      const right = parse_expr_bp(ctx, prec);
      const span = ctx.make_span(left.span.start, right.span.end);
      left = { kind: "range", start: left, end: right, inclusive, span } as RangeExpr;
      last_was_comparison = false;
    } else {
      const is_comparison = prec === Prec.Equality || prec === Prec.Compare;
      if (is_comparison && last_was_comparison) {
        throw ctx.error(`Comparison operators are non-associative: cannot chain '${tok.value}' after another comparison`);
      }
      // Binary operators
      ctx.advance();
      const right = parse_expr_bp(ctx, prec);
      const span = ctx.make_span(left.span.start, right.span.end);
      left = {
        kind: "bin_op", op: tok.value as BinOp, left, right, span,
      } as BinOpExpr;
      last_was_comparison = is_comparison;
    }
  }

  return left;
}

export function parse_prefix(ctx: ParserCtx): Expr {
  const tok = ctx.peek();
  const start = ctx.current_span_start();

  // Unary operators
  if (tok.kind === TokenKind.Minus || tok.kind === TokenKind.Bang) {
    ctx.advance();
    const operand = parse_expr_bp(ctx, Prec.Unary);
    const end = ctx.current_span_start();
    return {
      kind: "unary_op", op: tok.value as UnaryOp, operand,
      span: ctx.make_span(start, end),
    } as UnaryOpExpr;
  }

  // Literals
  if (tok.kind === TokenKind.IntLit) {
    ctx.advance();
    return { kind: "int_lit", value: parseInt(tok.value, 10), span: tok.span } as IntLitExpr;
  }
  if (tok.kind === TokenKind.FloatLit) {
    ctx.advance();
    return { kind: "float_lit", value: parseFloat(tok.value), span: tok.span } as FloatLitExpr;
  }
  if (tok.kind === TokenKind.StringLit) {
    ctx.advance();
    return { kind: "str_lit", value: tok.value, span: tok.span } as StrLitExpr;
  }
  if (tok.kind === TokenKind.RawStringLit) {
    ctx.advance();
    return { kind: "str_lit", value: tok.value, span: tok.span } as StrLitExpr;
  }
  if (tok.kind === TokenKind.True) {
    ctx.advance();
    return { kind: "bool_lit", value: true, span: tok.span } as BoolLitExpr;
  }
  if (tok.kind === TokenKind.False) {
    ctx.advance();
    return { kind: "bool_lit", value: false, span: tok.span } as BoolLitExpr;
  }

  // String interpolation
  if (tok.kind === TokenKind.StringInterpStart) {
    return parse_string_interp(ctx);
  }

  // Block expression
  if (tok.kind === TokenKind.LBrace) {
    return ctx.parse_block_expr();
  }

  // If expression
  if (tok.kind === TokenKind.If) {
    return parse_if_expr(ctx);
  }

  // Match expression
  if (tok.kind === TokenKind.Match) {
    return parse_match_expr(ctx);
  }

  // Handle expression
  if (tok.kind === TokenKind.Handle) {
    return parse_handle_expr(ctx);
  }

  // Try block: try { body }
  if (tok.kind === TokenKind.Try) {
    ctx.advance();
    const body = ctx.parse_block_expr();
    return { kind: "try_block", body, span: ctx.make_span(start, body.span.end) } as TryBlockExpr;
  }

  // Lambda: fn(params) -> Type { body }
  if (tok.kind === TokenKind.Fn) {
    return parse_lambda_expr(ctx);
  }

  // List literal: [expr, expr, ...]
  if (tok.kind === TokenKind.LBracket) {
    ctx.advance();
    const elements: Expr[] = [];
    if (!ctx.check(TokenKind.RBracket)) {
      elements.push(ctx.parse_expr());
      while (ctx.check(TokenKind.Comma)) {
        ctx.advance();
        if (ctx.check(TokenKind.RBracket)) break; // trailing comma
        elements.push(ctx.parse_expr());
      }
    }
    const end_tok = ctx.expect(TokenKind.RBracket);
    return {
      kind: "list_lit",
      elements,
      span: ctx.make_span(start, end_tok.span.end),
    } as ListLitExpr;
  }

  // Parenthesized expression or tuple literal
  if (tok.kind === TokenKind.LParen) {
    ctx.advance();
    const first = ctx.parse_expr();
    if (ctx.check(TokenKind.Comma)) {
      ctx.advance();
      const elements: Expr[] = [first];
      if (!ctx.check(TokenKind.RParen)) {
        elements.push(ctx.parse_expr());
        while (ctx.check(TokenKind.Comma)) {
          ctx.advance();
          if (ctx.check(TokenKind.RParen)) break;
          elements.push(ctx.parse_expr());
        }
      }
      const end_tok = ctx.expect(TokenKind.RParen);
      return {
        kind: "tuple_lit",
        elements,
        span: ctx.make_span(start, end_tok.span.end),
      } as TupleLitExpr;
    }
    ctx.expect(TokenKind.RParen);
    return first;
  }

  // Identifier (may lead to struct literal or qualified variant)
  if (tok.kind === TokenKind.Ident) {
    ctx.advance();
    const name = tok.value;

    // Qualified variant: EnumName::variant
    if (ctx.is_uppercase(name[0]) && ctx.check(TokenKind.ColonColon)) {
      ctx.advance(); // consume '::'
      const variant_tok = ctx.expect(TokenKind.Ident);
      const variant_name = variant_tok.value;

      // EnumName::Variant { field: value } — named variant construction
      if (ctx.is_uppercase(variant_name[0]) && ctx.check(TokenKind.LBrace)) {
        return parse_struct_literal(ctx, variant_name, start, name);
      }

      // EnumName::variant or EnumName::variant(args)
      return {
        kind: "ident", name: variant_name, qualifier: name,
        span: ctx.make_span(start, variant_tok.span.end),
      } as IdentExpr;
    }

    // Check for struct literal: Name { field: value }
    // Heuristic: starts with uppercase letter and followed by {
    if (ctx.is_uppercase(name[0]) && ctx.check(TokenKind.LBrace)) {
      return parse_struct_literal(ctx, name, start);
    }

    return { kind: "ident", name, span: tok.span } as IdentExpr;
  }

  throw ctx.error(`Unexpected token '${tok.value}' (${tok.kind}) in expression`);
}

// ============================================================
// Postfix: dot (field access / method call)
// ============================================================

function parse_dot_expr(ctx: ParserCtx, left: Expr): Expr {
  ctx.advance(); // consume '.'
  const name_tok = ctx.expect(TokenKind.Ident);
  const name = name_tok.value;

  // Check if it's a method call: expr.method(args)
  if (ctx.check(TokenKind.LParen)) {
    ctx.advance(); // consume '('
    const args = parse_arg_list(ctx);
    ctx.expect(TokenKind.RParen);
    const end = ctx.current_span_start();
    return {
      kind: "method_call", receiver: left, method: name, args, type_args: [],
      span: ctx.make_span(left.span.start, end),
    } as MethodCallExpr;
  }

  // Field access
  const end = ctx.current_span_start();
  return {
    kind: "field_access", receiver: left, field: name,
    span: ctx.make_span(left.span.start, end),
  } as FieldAccessExpr;
}

// ============================================================
// Call expression: expr(args)
// ============================================================

function parse_call_expr(ctx: ParserCtx, left: Expr): Expr {
  ctx.advance(); // consume '('
  const args = parse_arg_list(ctx);
  ctx.expect(TokenKind.RParen);
  const end = ctx.current_span_start();
  return {
    kind: "call", callee: left, args, type_args: [],
    span: ctx.make_span(left.span.start, end),
  } as CallExpr;
}

function parse_arg_list(ctx: ParserCtx): Expr[] {
  const args: Expr[] = [];
  if (ctx.check(TokenKind.RParen)) return args;
  args.push(ctx.parse_expr());
  while (ctx.try_consume(TokenKind.Comma)) {
    if (ctx.check(TokenKind.RParen)) break;
    args.push(ctx.parse_expr());
  }
  return args;
}

// ============================================================
// Or expression: expr or default
// ============================================================

function parse_or_expr(ctx: ParserCtx, left: Expr): OrExpr {
  ctx.advance(); // consume 'or'
  const default_value = parse_expr_bp(ctx, Prec.Or);
  const span = ctx.make_span(left.span.start, default_value.span.end);
  return { kind: "or_expr", expr: left, default_value, span };
}

// ============================================================
// Catch expression: expr catch fn(e) { handler }
// ============================================================

function parse_catch_expr(ctx: ParserCtx, left: Expr): CatchExpr {
  ctx.advance(); // consume 'catch'
  let error_type: string | undefined;
  if (ctx.peek().kind === TokenKind.Ident &&
      ctx.pos + 1 < ctx.tokens.length &&
      ctx.tokens[ctx.pos + 1].kind === TokenKind.Fn) {
    error_type = ctx.advance().value;
  }
  ctx.expect(TokenKind.Fn);
  ctx.expect(TokenKind.LParen);
  const error_binding = ctx.expect(TokenKind.Ident).value;
  ctx.expect(TokenKind.RParen);
  const handler = ctx.parse_block_expr();
  const span = ctx.make_span(left.span.start, handler.span.end);
  return { kind: "catch_expr", expr: left, error_type, error_binding, handler, span };
}

// ============================================================
// String interpolation
// ============================================================

function parse_string_interp(ctx: ParserCtx): StringInterpExpr {
  const start_tok = ctx.advance(); // consume StringInterpStart
  const parts: (string | Expr)[] = [];

  if (start_tok.value.length > 0) {
    parts.push(start_tok.value);
  }

  // Parse expression inside ${}
  parts.push(ctx.parse_expr());

  // Continue with middle/end tokens
  while (true) {
    const tok = ctx.peek();
    if (tok.kind === TokenKind.StringInterpMiddle) {
      ctx.advance();
      if (tok.value.length > 0) {
        parts.push(tok.value);
      }
      parts.push(ctx.parse_expr());
    } else if (tok.kind === TokenKind.StringInterpEnd) {
      ctx.advance();
      if (tok.value.length > 0) {
        parts.push(tok.value);
      }
      break;
    } else {
      // Unexpected - treat as end
      break;
    }
  }

  const end = ctx.current_span_start();
  return {
    kind: "string_interp", parts,
    span: ctx.make_span(start_tok.span.start, end),
  };
}

// ============================================================
// If expression
// ============================================================

export function parse_if_expr(ctx: ParserCtx): IfExpr {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.If);
  const condition = ctx.parse_expr();
  const then_branch = ctx.parse_block_expr();
  let else_branch: BlockExpr | IfExpr | undefined;
  if (ctx.try_consume(TokenKind.Else)) {
    if (ctx.check(TokenKind.If)) {
      else_branch = parse_if_expr(ctx);
    } else {
      else_branch = ctx.parse_block_expr();
    }
  }
  const end = ctx.current_span_start();
  return {
    kind: "if_expr", condition, then_branch, else_branch,
    span: ctx.make_span(start, end),
  };
}

// ============================================================
// Match expression
// ============================================================

function parse_match_expr(ctx: ParserCtx): MatchExpr {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Match);
  const scrutinee = ctx.parse_expr();
  ctx.expect(TokenKind.LBrace);
  const arms: MatchArm[] = [];
  while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
    arms.push(parse_match_arm(ctx));
    ctx.try_consume(TokenKind.Comma);
  }
  ctx.expect(TokenKind.RBrace);
  const end = ctx.current_span_start();
  return {
    kind: "match_expr", scrutinee, arms,
    span: ctx.make_span(start, end),
  };
}

function parse_match_arm(ctx: ParserCtx): MatchArm {
  const start = ctx.current_span_start();
  const pattern = ctx.parse_pattern();
  let guard: Expr | undefined;
  if (ctx.check(TokenKind.If)) {
    ctx.advance();
    guard = ctx.parse_expr();
  }
  ctx.expect(TokenKind.FatArrow);
  const body = ctx.parse_expr();
  const end = ctx.current_span_start();
  return { pattern, guard, body, span: ctx.make_span(start, end) };
}

// ============================================================
// Patterns
// ============================================================

export function parse_pattern(ctx: ParserCtx): Pattern {
  const tok = ctx.peek();
  const start = ctx.current_span_start();

  // Wildcard
  if (tok.kind === TokenKind.Ident && tok.value === "_") {
    ctx.advance();
    return { kind: "wildcard", span: tok.span } as WildcardPattern;
  }

  // Literal patterns
  if (tok.kind === TokenKind.IntLit) {
    ctx.advance();
    return { kind: "literal", value: parseInt(tok.value, 10), span: tok.span } as LiteralPattern;
  }
  if (tok.kind === TokenKind.FloatLit) {
    ctx.advance();
    return { kind: "literal", value: parseFloat(tok.value), span: tok.span } as LiteralPattern;
  }
  if (tok.kind === TokenKind.StringLit) {
    ctx.advance();
    return { kind: "literal", value: tok.value, span: tok.span } as LiteralPattern;
  }
  if (tok.kind === TokenKind.True) {
    ctx.advance();
    return { kind: "literal", value: true, span: tok.span } as LiteralPattern;
  }
  if (tok.kind === TokenKind.False) {
    ctx.advance();
    return { kind: "literal", value: false, span: tok.span } as LiteralPattern;
  }

  // Constructor pattern or binding pattern
  if (tok.kind === TokenKind.Ident) {
    ctx.advance();
    let name = tok.value;
    let qualifier: string | undefined;

    // Qualified pattern: EnumName::variant
    if (ctx.is_uppercase(name[0]) && ctx.check(TokenKind.ColonColon)) {
      ctx.advance(); // consume '::'
      const variant_tok = ctx.expect(TokenKind.Ident);
      qualifier = name;
      name = variant_tok.value;
    }

    // Positional constructor pattern: Name(pat, pat, ...)
    if (ctx.check(TokenKind.LParen)) {
      ctx.advance(); // consume '('
      const fields: Pattern[] = [];
      if (!ctx.check(TokenKind.RParen)) {
        fields.push(ctx.parse_pattern());
        while (ctx.try_consume(TokenKind.Comma)) {
          if (ctx.check(TokenKind.RParen)) break;
          fields.push(ctx.parse_pattern());
        }
      }
      ctx.expect(TokenKind.RParen);
      const end = ctx.current_span_start();
      return {
        kind: "constructor", name, qualifier, fields,
        span: ctx.make_span(start, end),
      } as ConstructorPattern;
    }

    // Named constructor pattern: Name { field, field: pat, .. }
    if (ctx.check(TokenKind.LBrace) && ctx.is_uppercase(name[0])) {
      ctx.advance(); // consume '{'
      const named_fields: { name: string; pattern: Pattern; span: Span }[] = [];
      let rest = false;
      while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
        if (ctx.check(TokenKind.DotDot)) {
          ctx.advance();
          rest = true;
          ctx.try_consume(TokenKind.Comma);
          break;
        }
        const f_start = ctx.current_span_start();
        const f_name = ctx.expect(TokenKind.Ident).value;
        let pat: Pattern;
        if (ctx.try_consume(TokenKind.Colon)) {
          pat = ctx.parse_pattern();
        } else {
          pat = { kind: "binding", name: f_name, span: ctx.make_span(f_start, ctx.current_span_start()) } as BindingPattern;
        }
        const f_end = ctx.current_span_start();
        named_fields.push({ name: f_name, pattern: pat, span: ctx.make_span(f_start, f_end) });
        ctx.try_consume(TokenKind.Comma);
      }
      ctx.expect(TokenKind.RBrace);
      const end = ctx.current_span_start();
      return {
        kind: "named_constructor", name, qualifier, fields: named_fields, rest,
        span: ctx.make_span(start, end),
      } as NamedConstructorPattern;
    }

    // If qualifier is present, bare name is a zero-field variant, NOT a binding
    if (qualifier) {
      return {
        kind: "constructor", name, qualifier, fields: [],
        span: ctx.make_span(start, ctx.current_span_start()),
      } as ConstructorPattern;
    }

    // Binding pattern (no qualifier)
    return { kind: "binding", name, span: tok.span } as BindingPattern;
  }

  // Tuple pattern: (pat, pat, ...)
  if (tok.kind === TokenKind.LParen) {
    ctx.advance();
    const first = ctx.parse_pattern();
    if (!ctx.check(TokenKind.Comma)) {
      throw ctx.error("Expected ',' in tuple pattern — single-element tuple patterns not supported");
    }
    ctx.advance();
    const elements: Pattern[] = [first];
    if (!ctx.check(TokenKind.RParen)) {
      elements.push(ctx.parse_pattern());
      while (ctx.try_consume(TokenKind.Comma)) {
        if (ctx.check(TokenKind.RParen)) break;
        elements.push(ctx.parse_pattern());
      }
    }
    const end_tok = ctx.expect(TokenKind.RParen);
    return {
      kind: "tuple",
      elements,
      span: ctx.make_span(start, end_tok.span.end),
    } as TuplePattern;
  }

  throw ctx.error(`Unexpected token '${tok.value}' in pattern`);
}

// ============================================================
// Handle expression
// ============================================================

function parse_handle_expr(ctx: ParserCtx): HandleExpr {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Handle);
  const body = ctx.parse_block_expr();
  ctx.expect(TokenKind.With);
  ctx.expect(TokenKind.LBrace);
  const handlers: EffectHandler[] = [];
  while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
    handlers.push(parse_effect_handler(ctx));
    ctx.try_consume(TokenKind.Comma);
  }
  ctx.expect(TokenKind.RBrace);
  const end = ctx.current_span_start();
  return {
    kind: "handle_expr", body, handlers,
    span: ctx.make_span(start, end),
  };
}

function parse_effect_handler(ctx: ParserCtx): EffectHandler {
  const start = ctx.current_span_start();
  // effect.op(params) => body
  const effect_name = ctx.expect(TokenKind.Ident).value;
  ctx.expect(TokenKind.Dot);
  const op_name = ctx.expect(TokenKind.Ident).value;
  ctx.expect(TokenKind.LParen);
  const params = ctx.parse_params();
  ctx.expect(TokenKind.RParen);
  // Optional resume name: not yet in syntax, could be added later
  ctx.expect(TokenKind.FatArrow);
  const body = ctx.parse_expr();
  const end = ctx.current_span_start();
  return {
    effect_name, op_name, params, body,
    span: ctx.make_span(start, end),
  };
}

// ============================================================
// Lambda expression
// ============================================================

function parse_lambda_expr(ctx: ParserCtx): LambdaExpr {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Fn);
  ctx.expect(TokenKind.LParen);
  const params = ctx.parse_params();
  ctx.expect(TokenKind.RParen);
  const return_type = ctx.try_consume(TokenKind.Arrow) ? ctx.parse_type_expr() : undefined;
  const body = ctx.parse_block_expr() as Expr;
  const end = ctx.current_span_start();
  return {
    kind: "lambda", params, return_type, body,
    span: ctx.make_span(start, end),
  };
}

// ============================================================
// Struct literal
// ============================================================

function parse_struct_literal(ctx: ParserCtx, name: string, start: Position, qualifier?: string): StructLitExpr {
  ctx.expect(TokenKind.LBrace);
  const fields: StructFieldInit[] = [];
  let spread: Expr | undefined;
  // Check for ..expr spread at the beginning
  if (ctx.check(TokenKind.DotDot)) {
    ctx.advance();
    spread = ctx.parse_expr();
    ctx.try_consume(TokenKind.Comma);
  }
  while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
    const f_start = ctx.current_span_start();
    const f_name = ctx.expect(TokenKind.Ident).value;
    let f_value: Expr;
    if (ctx.try_consume(TokenKind.Colon)) {
      f_value = ctx.parse_expr();
    } else {
      f_value = { kind: "ident", name: f_name, span: ctx.make_span(f_start, ctx.current_span_start()) } as IdentExpr;
    }
    const f_end = ctx.current_span_start();
    fields.push({ name: f_name, value: f_value, span: ctx.make_span(f_start, f_end) });
    ctx.try_consume(TokenKind.Comma);
  }
  ctx.expect(TokenKind.RBrace);
  const end = ctx.current_span_start();
  return {
    kind: "struct_lit", name, qualifier, type_args: [], fields,
    spread,
    span: ctx.make_span(start, end),
  };
}

// ============================================================
// Type Expressions
// ============================================================

export function try_parse_type_args(ctx: ParserCtx): TypeExpr[] {
  if (!ctx.check(TokenKind.Lt)) return [];
  const save_pos = ctx.pos;
  const save_errors = ctx.error_count;
  const sink_checkpoint = ctx.sink.save?.();
  ctx.advance();
  try {
    const args: TypeExpr[] = [];
    args.push(parse_type_expr(ctx));
    while (ctx.try_consume(TokenKind.Comma)) {
      args.push(parse_type_expr(ctx));
    }
    if (!ctx.check(TokenKind.Gt)) {
      ctx.pos = save_pos;
      ctx.error_count = save_errors;
      if (sink_checkpoint !== undefined) ctx.sink.restore?.(sink_checkpoint);
      return [];
    }
    ctx.advance();
    return args;
  } catch {
    ctx.pos = save_pos;
    ctx.error_count = save_errors;
    if (sink_checkpoint !== undefined) ctx.sink.restore?.(sink_checkpoint);
    return [];
  }
}

export function parse_type_expr(ctx: ParserCtx): TypeExpr {
  const start = ctx.current_span_start();

  // Record type: {field: Type, ..rest}
  if (ctx.check(TokenKind.LBrace)) {
    return parse_record_type_expr(ctx);
  }

  // fn(...) -> ReturnType
  if (ctx.check(TokenKind.Fn)) {
    ctx.advance();
    ctx.expect(TokenKind.LParen);
    const params: TypeExpr[] = [];
    if (!ctx.check(TokenKind.RParen)) {
      params.push(parse_type_expr(ctx));
      while (ctx.try_consume(TokenKind.Comma)) {
        if (ctx.check(TokenKind.RParen)) break;
        params.push(parse_type_expr(ctx));
      }
    }
    ctx.expect(TokenKind.RParen);
    ctx.expect(TokenKind.Arrow);
    const return_type = parse_type_expr(ctx);
    const end = ctx.current_span_start();
    const result: FnTypeExpr = {
      kind: "fn_type", params, return_type,
      span: ctx.make_span(start, end),
    };
    return result;
  }

  // Tuple type: (Type, Type, ...)
  if (ctx.check(TokenKind.LParen)) {
    ctx.advance();
    const first = parse_type_expr(ctx);
    if (ctx.check(TokenKind.Comma)) {
      ctx.advance();
      const elements: TypeExpr[] = [first];
      if (!ctx.check(TokenKind.RParen)) {
        elements.push(parse_type_expr(ctx));
        while (ctx.check(TokenKind.Comma)) {
          ctx.advance();
          if (ctx.check(TokenKind.RParen)) break;
          elements.push(parse_type_expr(ctx));
        }
      }
      const end_tok = ctx.expect(TokenKind.RParen);
      return {
        kind: "tuple_type",
        elements,
        span: ctx.make_span(start, end_tok.span.end),
      } as TupleTypeExpr;
    }
    ctx.expect(TokenKind.RParen);
    return first;
  }

  // Named type
  const name = ctx.expect(TokenKind.Ident).value;
  const type_args = try_parse_type_args(ctx);

  const end = ctx.current_span_start();
  let result: TypeExpr = {
    kind: "named", name, type_args,
    span: ctx.make_span(start, end),
  } as NamedTypeExpr;

  // Check for ? (Option type)
  if (ctx.try_consume(TokenKind.Question)) {
    const opt_end = ctx.current_span_start();
    result = {
      kind: "option", inner: result,
      span: ctx.make_span(start, opt_end),
    } as OptionTypeExpr;
  }

  return result;
}

function parse_record_type_expr(ctx: ParserCtx): RecordTypeExpr {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.LBrace);
  const fields: RecordTypeField[] = [];
  let rest: string | undefined;

  while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
    if (ctx.check(TokenKind.DotDot)) {
      ctx.advance();
      rest = ctx.expect(TokenKind.Ident).value;
      ctx.try_consume(TokenKind.Comma);
      break;
    }

    const field_start = ctx.current_span_start();
    const field_name = ctx.expect(TokenKind.Ident).value;
    ctx.expect(TokenKind.Colon);
    const field_type = parse_type_expr(ctx);
    const field_end = ctx.current_span_start();
    fields.push({ name: field_name, type: field_type, span: ctx.make_span(field_start, field_end) });

    if (!ctx.try_consume(TokenKind.Comma)) break;
  }

  ctx.expect(TokenKind.RBrace);
  const end = ctx.current_span_start();
  return {
    kind: "record_type",
    fields,
    rest,
    span: ctx.make_span(start, end),
  };
}

// ============================================================
// Type Params: <T, U: Constraint>
// ============================================================

export function parse_type_params(ctx: ParserCtx): import("../ast/index.js").TypeParam[] {
  if (!ctx.check(TokenKind.Lt)) return [];
  ctx.advance(); // consume <
  const params: import("../ast/index.js").TypeParam[] = [];
  while (!ctx.check(TokenKind.Gt) && !ctx.at_end()) {
    const tp_start = ctx.current_span_start();
    const name = ctx.expect(TokenKind.Ident).value;
    const bounds: import("../ast/index.js").TypeBound[] = [];
    if (ctx.try_consume(TokenKind.Colon)) {
      bounds.push(parse_type_bound(ctx));
      while (ctx.check(TokenKind.Plus)) {
        ctx.advance();
        bounds.push(parse_type_bound(ctx));
      }
    }
    const tp_end = ctx.current_span_start();
    params.push({ name, bounds, span: ctx.make_span(tp_start, tp_end) });
    ctx.try_consume(TokenKind.Comma);
  }
  ctx.expect(TokenKind.Gt);
  return params;
}

export function parse_type_bound(ctx: ParserCtx): import("../ast/index.js").TypeBound {
  const start = ctx.current_span_start();
  const trait_name = ctx.expect(TokenKind.Ident).value;
  const type_args = try_parse_type_args(ctx);
  const end = ctx.current_span_start();
  return { trait_name, type_args, span: ctx.make_span(start, end) };
}

// ============================================================
// Parameters
// ============================================================

export function parse_params(ctx: ParserCtx): import("../ast/index.js").Param[] {
  const params: import("../ast/index.js").Param[] = [];
  if (ctx.check(TokenKind.RParen)) return params;
  params.push(parse_param(ctx));
  while (ctx.try_consume(TokenKind.Comma)) {
    if (ctx.check(TokenKind.RParen)) break;
    params.push(parse_param(ctx));
  }
  return params;
}

export function parse_param(ctx: ParserCtx): import("../ast/index.js").Param {
  const start = ctx.current_span_start();
  const is_mutable = ctx.try_consume(TokenKind.Var);
  const name = ctx.expect(TokenKind.Ident).value;
  let type_annotation: TypeExpr | undefined;
  if (ctx.try_consume(TokenKind.Colon)) {
    type_annotation = parse_type_expr(ctx);
  }
  const end = ctx.current_span_start();
  return { name, is_mutable: is_mutable || undefined, type_annotation, span: ctx.make_span(start, end) };
}
