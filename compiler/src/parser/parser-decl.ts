// Declaration parsers extracted from Parser.
// All functions take `ctx: ParserCtx` as first parameter.

import type {
  Decl, FnDecl, StructDecl, EnumDecl, ImplDecl, EffectDecl, TestDecl, TraitDecl,
  ExternFnDecl, ExternTypeDecl, TypeAliasDecl,
  UseDecl, UsePath, UseImport,
  BlockExpr, TypeExpr, StructField, EnumVariant, EffectOp,
  Span, Position,
} from "../ast/index.js";
import type { NamedEnumField } from "../ast/index.js";
import { TokenKind } from "./lexer.js";
import { make_diagnostic } from "../diagnostics/index.js";
import { E } from "../diagnostics/codes.js";
import type { ParserCtx } from "./parser-ctx.js";

// ============================================================
// Use declarations
// ============================================================

export function parse_use_decl(ctx: ParserCtx, is_pub: boolean): UseDecl {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Use);

  // Parse path segments: Ident (:: Ident)*
  // Stop before :: if next is LBrace (grouped import)
  const segments: string[] = [];
  const path_start = ctx.current_span_start();
  segments.push(ctx.expect(TokenKind.Ident).value);

  while (ctx.check(TokenKind.ColonColon)) {
    // Peek past :: to see what follows
    ctx.advance(); // consume ::

    if (ctx.check(TokenKind.LBrace)) {
      // `use path::{...}` — stop, parse grouped imports
      break;
    }

    // Must be another Ident path segment
    segments.push(ctx.expect(TokenKind.Ident).value);
  }

  const path_end = ctx.current_span_start();
  let path: UsePath;
  let imports: UseImport;
  let alias: string | undefined;

  if (ctx.check(TokenKind.LBrace)) {
    // Grouped import: `use path::{name [as alias], ...}`
    path = { segments, span: ctx.make_span(path_start, path_end) };
    ctx.advance(); // consume {
    const names: { name: string; alias?: string; span: Span }[] = [];
    while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
      const name_start = ctx.current_span_start();
      const name = ctx.expect(TokenKind.Ident).value;
      let name_alias: string | undefined;
      if (ctx.try_consume(TokenKind.As)) {
        name_alias = ctx.expect(TokenKind.Ident).value;
      }
      const name_end = ctx.current_span_start();
      names.push({ name, alias: name_alias, span: ctx.make_span(name_start, name_end) });
      if (!ctx.try_consume(TokenKind.Comma)) break;
    }
    ctx.expect(TokenKind.RBrace);
    imports = { kind: "named", names };
  } else if (ctx.check(TokenKind.As)) {
    // Module alias: `use path as alias`
    path = { segments, span: ctx.make_span(path_start, path_end) };
    ctx.advance(); // consume `as`
    alias = ctx.expect(TokenKind.Ident).value;
    imports = { kind: "module" };
  } else if (segments.length > 1) {
    // Multi-segment path: last segment is the imported name, rest is module path
    // e.g. `use checker::env::TypeEnv` → path=["checker","env"], name="TypeEnv"
    const name = segments.pop()!;
    path = { segments, span: ctx.make_span(path_start, path_end) };
    const name_span = ctx.make_span(path_start, path_end); // approximate
    imports = { kind: "named", names: [{ name, span: name_span }] };
  } else {
    // Single segment, no :: — whole module import: `use parser`
    path = { segments, span: ctx.make_span(path_start, path_end) };
    imports = { kind: "module" };
  }

  const end = ctx.current_span_start();
  return {
    kind: "use_decl",
    path,
    imports,
    alias,
    is_pub,
    span: ctx.make_span(start, end),
  };
}

// ============================================================
// Declarations
// ============================================================

export function parse_decl(ctx: ParserCtx): Decl {
  const is_pub = ctx.try_consume(TokenKind.Pub);
  const tok = ctx.peek();

  switch (tok.kind) {
    case TokenKind.Fn: return parse_fn_decl(ctx, is_pub);
    case TokenKind.Struct: return parse_struct_decl(ctx, is_pub);
    case TokenKind.Enum: return parse_enum_decl(ctx, is_pub);
    case TokenKind.Impl: return parse_impl_decl(ctx);
    case TokenKind.Effect: return parse_effect_decl(ctx, is_pub);
    case TokenKind.Test: return parse_test_decl(ctx);
    case TokenKind.Trait: return parse_trait_decl(ctx, is_pub);
    case TokenKind.Extern: return parse_extern_decl(ctx, is_pub);
    case TokenKind.Ident:
      if (tok.value === "type") return parse_type_alias_decl(ctx, is_pub);
      ctx.report_error(E.E0101, `Expected declaration, got '${tok.value}' (${tok.kind})`, tok.span);
      throw new Error("parse_decl_failed");
    default:
      ctx.report_error(E.E0101, `Expected declaration, got '${tok.value}' (${tok.kind})`, tok.span);
      throw new Error("parse_decl_failed");
  }
}

export function parse_fn_decl(ctx: ParserCtx, is_pub: boolean, body_optional: boolean = false): FnDecl {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Fn);
  const name = ctx.expect(TokenKind.Ident).value;
  const type_params = ctx.parse_type_params();
  ctx.expect(TokenKind.LParen);
  const params = ctx.parse_params();
  ctx.expect(TokenKind.RParen);
  const return_type = ctx.try_consume(TokenKind.Arrow) ? ctx.parse_type_expr() : undefined;
  let body: BlockExpr;
  let is_abstract: boolean | undefined;
  if (body_optional && !ctx.check(TokenKind.LBrace)) {
    // Abstract method: no body
    const pos = ctx.current_span_start();
    body = { kind: "block", stmts: [], tail: undefined, span: ctx.make_span(pos, pos) };
    is_abstract = true;
  } else {
    body = ctx.parse_block_expr();
  }
  const end = ctx.current_span_start();
  return {
    kind: "fn_decl", name, type_params, params, return_type, body, is_pub, is_abstract,
    span: ctx.make_span(start, end),
  };
}

function parse_extern_decl(ctx: ParserCtx, is_pub: boolean): ExternFnDecl | ExternTypeDecl {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Extern);
  if (ctx.check(TokenKind.Ident) && ctx.peek().value === "type") {
    return parse_extern_type_decl_body(ctx, is_pub, start);
  }
  return parse_extern_fn_decl_body(ctx, is_pub, start);
}

export function parse_extern_fn_decl_body(ctx: ParserCtx, is_pub: boolean, start: Position): ExternFnDecl {
  ctx.expect(TokenKind.Fn);
  const name = ctx.expect(TokenKind.Ident).value;
  const type_params = ctx.parse_type_params();
  ctx.expect(TokenKind.LParen);
  const params = ctx.parse_params();
  ctx.expect(TokenKind.RParen);
  const return_type = ctx.try_consume(TokenKind.Arrow) ? ctx.parse_type_expr() : undefined;
  const end = ctx.current_span_start();
  return {
    kind: "extern_fn_decl", name, type_params, params, return_type, is_pub,
    span: ctx.make_span(start, end),
  };
}

function parse_extern_type_decl_body(ctx: ParserCtx, is_pub: boolean, start: Position): ExternTypeDecl {
  ctx.advance(); // consume "type" ident
  const name = ctx.expect(TokenKind.Ident).value;
  const type_params = ctx.parse_type_params();
  const end = ctx.current_span_start();
  return {
    kind: "extern_type_decl", name, type_params, is_pub,
    span: ctx.make_span(start, end),
  };
}

function parse_type_alias_decl(ctx: ParserCtx, is_pub: boolean): TypeAliasDecl {
  const start = ctx.current_span_start();
  ctx.advance(); // consume "type" ident
  const name = ctx.expect(TokenKind.Ident).value;
  const type_params = ctx.parse_type_params();
  ctx.expect(TokenKind.Eq);
  const type_expr = ctx.parse_type_expr();
  const end = ctx.current_span_start();
  return {
    kind: "type_alias_decl", name, type_params, type_expr, is_pub,
    span: ctx.make_span(start, end),
  };
}

function parse_struct_decl(ctx: ParserCtx, is_pub: boolean): StructDecl {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Struct);
  const name = ctx.expect(TokenKind.Ident).value;
  const type_params = ctx.parse_type_params();
  ctx.expect(TokenKind.LBrace);
  const fields: StructField[] = [];
  while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
    const field_start = ctx.current_span_start();
    const field_pub = ctx.try_consume(TokenKind.Pub);
    const field_name = ctx.expect(TokenKind.Ident).value;
    const field_optional = ctx.try_consume(TokenKind.Question);
    ctx.expect(TokenKind.Colon);
    const type_annotation = ctx.parse_type_expr();
    // Check for where clause on this field (refinement)
    if (ctx.check(TokenKind.Where)) {
      const where_span = ctx.peek().span;
      ctx.sink.report(make_diagnostic("W0001", "warning",
        "Refinement types are not yet implemented; 'where' clause is ignored",
        where_span, { kind: "other", detail: "where clause parsed but not enforced" }));
      ctx.advance(); // consume 'where'
      // Consume tokens until comma or closing brace (simplified: stop at , or })
      let depth = 0;
      while (!ctx.at_end()) {
        if (depth === 0 && (ctx.check(TokenKind.Comma) || ctx.check(TokenKind.RBrace))) break;
        if (ctx.check(TokenKind.LParen) || ctx.check(TokenKind.LBrace) || ctx.check(TokenKind.LBracket)) depth++;
        if (ctx.check(TokenKind.RParen) || ctx.check(TokenKind.RBrace) || ctx.check(TokenKind.RBracket)) depth--;
        if (depth < 0) break;
        ctx.advance();
      }
    }
    const field_end = ctx.current_span_start();
    fields.push({
      name: field_name, type_annotation, is_pub: field_pub,
      is_optional: field_optional || undefined,
      span: ctx.make_span(field_start, field_end),
    });
    ctx.try_consume(TokenKind.Comma);
  }
  ctx.expect(TokenKind.RBrace);
  const end = ctx.current_span_start();
  return {
    kind: "struct_decl", name, type_params, fields, is_pub,
    span: ctx.make_span(start, end),
  };
}

function parse_enum_decl(ctx: ParserCtx, is_pub: boolean): EnumDecl {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Enum);
  const name = ctx.expect(TokenKind.Ident).value;
  const type_params = ctx.parse_type_params();
  ctx.expect(TokenKind.LBrace);
  const variants: EnumVariant[] = [];
  while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
    const v_start = ctx.current_span_start();
    const v_name = ctx.expect(TokenKind.Ident).value;
    let fields: TypeExpr[] = [];
    let named_fields: NamedEnumField[] | undefined;
    if (ctx.try_consume(TokenKind.LParen)) {
      if (!ctx.check(TokenKind.RParen)) {
        fields.push(ctx.parse_type_expr());
        while (ctx.try_consume(TokenKind.Comma)) {
          if (ctx.check(TokenKind.RParen)) break;
          fields.push(ctx.parse_type_expr());
        }
      }
      ctx.expect(TokenKind.RParen);
    } else if (ctx.check(TokenKind.LBrace)) {
      ctx.advance();
      named_fields = [];
      while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
        const f_start = ctx.current_span_start();
        const f_name = ctx.expect(TokenKind.Ident).value;
        const f_optional = ctx.try_consume(TokenKind.Question);
        ctx.expect(TokenKind.Colon);
        const f_type = ctx.parse_type_expr();
        const f_end = ctx.current_span_start();
        named_fields.push({ name: f_name, type_expr: f_type, is_optional: f_optional || undefined, span: ctx.make_span(f_start, f_end) });
        ctx.try_consume(TokenKind.Comma);
      }
      ctx.expect(TokenKind.RBrace);
    }
    const v_end = ctx.current_span_start();
    variants.push({ name: v_name, fields, named_fields, span: ctx.make_span(v_start, v_end) });
    ctx.try_consume(TokenKind.Comma);
  }
  ctx.expect(TokenKind.RBrace);
  const end = ctx.current_span_start();
  return {
    kind: "enum_decl", name, type_params, variants, is_pub,
    span: ctx.make_span(start, end),
  };
}

function parse_impl_decl(ctx: ParserCtx): ImplDecl {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Impl);
  const type_params = ctx.parse_type_params();
  const first_name = ctx.expect(TokenKind.Ident).value;

  // Check for trait impl: impl Trait for Type
  let target_type: string;
  let trait_name: string | undefined;
  if (ctx.check(TokenKind.For)) {
    ctx.advance(); // consume 'for'
    trait_name = first_name;
    target_type = ctx.expect(TokenKind.Ident).value;
  } else {
    target_type = first_name;
  }

  ctx.expect(TokenKind.LBrace);
  const methods: (FnDecl | ExternFnDecl)[] = [];
  while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
    const m_pub = ctx.try_consume(TokenKind.Pub);
    if (ctx.check(TokenKind.Extern)) {
      const m_start = ctx.current_span_start();
      ctx.expect(TokenKind.Extern);
      methods.push(parse_extern_fn_decl_body(ctx, m_pub, m_start));
    } else {
      methods.push(parse_fn_decl(ctx, m_pub));
    }
  }
  ctx.expect(TokenKind.RBrace);
  const end = ctx.current_span_start();
  return {
    kind: "impl_decl", target_type, type_params, trait_name, methods,
    span: ctx.make_span(start, end),
  };
}

function parse_effect_decl(ctx: ParserCtx, is_pub: boolean): EffectDecl {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Effect);
  const name = ctx.expect(TokenKind.Ident).value;
  const type_params = ctx.parse_type_params();
  ctx.expect(TokenKind.LBrace);
  const ops: EffectOp[] = [];
  while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
    const op_start = ctx.current_span_start();
    ctx.expect(TokenKind.Fn);
    const op_name = ctx.expect(TokenKind.Ident).value;
    ctx.expect(TokenKind.LParen);
    const params = ctx.parse_params();
    ctx.expect(TokenKind.RParen);
    ctx.expect(TokenKind.Arrow);
    const return_type = ctx.parse_type_expr();
    const op_end = ctx.current_span_start();
    ops.push({ name: op_name, params, return_type, span: ctx.make_span(op_start, op_end) });
    ctx.try_consume(TokenKind.Comma);
    ctx.try_consume(TokenKind.Semi);
  }
  ctx.expect(TokenKind.RBrace);
  const end = ctx.current_span_start();
  return {
    kind: "effect_decl", name, type_params, ops, is_pub,
    span: ctx.make_span(start, end),
  };
}

function parse_test_decl(ctx: ParserCtx): TestDecl {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Test);
  const desc_tok = ctx.expect(TokenKind.StringLit);
  const description = desc_tok.value;
  const body = ctx.parse_block_expr();
  const end = ctx.current_span_start();
  return {
    kind: "test_decl", description, body,
    span: ctx.make_span(start, end),
  };
}

function parse_trait_decl(ctx: ParserCtx, is_pub: boolean): TraitDecl {
  const start = ctx.current_span_start();
  ctx.expect(TokenKind.Trait);
  const name = ctx.expect(TokenKind.Ident).value;
  const type_params = ctx.parse_type_params();
  const supertraits: import("../ast/index.js").TypeBound[] = [];
  ctx.expect(TokenKind.LBrace);
  const methods: FnDecl[] = [];
  while (!ctx.check(TokenKind.RBrace) && !ctx.at_end()) {
    const m_pub = ctx.try_consume(TokenKind.Pub);
    methods.push(parse_fn_decl(ctx, m_pub, true));
  }
  ctx.expect(TokenKind.RBrace);
  const end = ctx.current_span_start();
  return {
    kind: "trait_decl", name, type_params, supertraits, methods, is_pub,
    span: ctx.make_span(start, end),
  };
}
