// Statement and block inference, extracted from InferEngine.
// All functions take `ctx: InferCtx` as first parameter.

import type { Expr, Stmt, BlockExpr } from "../ast/index.js";
import {
  Type,
  BOOL, UNIT,
  EMPTY_ROW, type_to_string,
} from "../types/index.js";
import type { EffectRow } from "../types/index.js";
import {
  HExpr, HStmt, HBlock, HWhileStmt, HForInStmt,
  HLetDestructureStmt, HIfLetStmt,
  BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_SET, BUILTIN_MAP,
} from "../hir/index.js";
import { Substitution, apply } from "./unify.js";
import { E } from "../diagnostics/codes.js";
import type { InferCtx, InferResult } from "./infer-ctx.js";
import {
  type_error, merge_effects, unify_at,
  generalize, resolve_type_expr, bind_pattern,
} from "./infer-ctx.js";

// ============================================================
// Infer Block
// ============================================================

export function infer_block(ctx: InferCtx, block: BlockExpr, initial_subst?: Substitution): InferResult {
  let subst = initial_subst ?? ctx.subst;
  let effects: EffectRow = EMPTY_ROW;
  const hstmts: HStmt[] = [];

  for (const stmt of block.stmts) {
    const sr = infer_stmt(ctx, stmt, subst);
    subst = sr.subst;
    [effects, subst] = merge_effects(ctx, effects, sr.effects, subst);
    hstmts.push(sr.hstmt);
  }

  let tail_hexpr: HExpr | undefined;
  let block_type: Type = UNIT;

  if (block.tail) {
    const tr = ctx.infer_expr(block.tail, subst);
    subst = tr.subst;
    [effects, subst] = merge_effects(ctx, effects, tr.effects, subst);
    tail_hexpr = tr.hexpr;
    block_type = tr.hexpr.type;
  }

  const hblock: HBlock = {
    kind: "block",
    stmts: hstmts,
    tail: tail_hexpr,
    type: block_type,
    effects,
    span: block.span,
  };

  return { hexpr: hblock, subst, effects };
}

// ============================================================
// Infer Statements
// ============================================================

export function infer_stmt(ctx: InferCtx, stmt: Stmt, subst: Substitution): { hstmt: HStmt; subst: Substitution; effects: EffectRow } {
  switch (stmt.kind) {
    case "let_stmt": {
      const init_r = ctx.infer_expr(stmt.init, subst);
      let s = init_r.subst;
      let var_type = init_r.hexpr.type;
      if (stmt.type_annotation) {
        const annotated = resolve_type_expr(ctx, stmt.type_annotation);
        s = unify_at(ctx, var_type, annotated, s, stmt.span);
        var_type = apply(s, annotated);
      }
      const resolved = apply(s, var_type);
      const scheme = generalize(ctx, resolved, s);
      ctx.env.bind(stmt.name, scheme);
      ctx.env.record_def_span(scheme.def_id!, stmt.name_span);
      return {
        hstmt: { kind: "let_stmt", name: stmt.name, name_span: stmt.name_span, def_id: scheme.def_id, type: resolved, init: init_r.hexpr, span: stmt.span },
        subst: s,
        effects: init_r.effects,
      };
    }
    case "var_stmt": {
      const init_r = ctx.infer_expr(stmt.init, subst);
      let s = init_r.subst;
      let var_type = init_r.hexpr.type;
      if (stmt.type_annotation) {
        const annotated = resolve_type_expr(ctx, stmt.type_annotation);
        s = unify_at(ctx, var_type, annotated, s, stmt.span);
        var_type = apply(s, annotated);
      }
      ctx.env.bind_mono(stmt.name, apply(s, var_type));
      const var_scheme = ctx.env.lookup(stmt.name)!;
      ctx.env.record_def_span(var_scheme.def_id!, stmt.name_span);
      ctx.env.mutable_vars.add(var_scheme.def_id!);
      return {
        hstmt: { kind: "var_stmt", name: stmt.name, name_span: stmt.name_span, def_id: var_scheme.def_id, type: apply(s, var_type), init: init_r.hexpr, span: stmt.span },
        subst: s,
        effects: init_r.effects,
      };
    }
    case "assign_stmt": {
      if (stmt.target.kind === "ident") {
        const scheme = ctx.env.lookup(stmt.target.name);
        if (scheme && scheme.def_id !== undefined && !ctx.env.mutable_vars.has(scheme.def_id)) {
          type_error(ctx,
            E.E0205,
            `Cannot assign to immutable variable '${stmt.target.name}' (declared with 'let'). Use 'var' for mutable bindings.`,
            stmt.target.span,
            { kind: "other", detail: `'${stmt.target.name}' is declared with 'let'` },
          );
        }
      } else if (stmt.target.kind === "field_access") {
        let root: Expr = stmt.target;
        while (root.kind === "field_access") root = root.receiver;
        if (root.kind === "ident") {
          const scheme = ctx.env.lookup(root.name);
          if (scheme && scheme.def_id !== undefined && !ctx.env.mutable_vars.has(scheme.def_id)) {
            type_error(ctx,
              E.E0205,
              `Cannot assign to field of immutable variable '${root.name}'. Use 'var' for mutable bindings.`,
              stmt.target.span,
              { kind: "other", detail: `'${root.name}' is not mutable` },
            );
          }
        }
      }
      const target_r = ctx.infer_expr(stmt.target, subst);
      const value_r = ctx.infer_expr(stmt.value, target_r.subst);
      let s = unify_at(ctx, target_r.hexpr.type, value_r.hexpr.type, value_r.subst, stmt.span);
      let effects: EffectRow;
      [effects, s] = merge_effects(ctx, target_r.effects, value_r.effects, s);
      return {
        hstmt: { kind: "assign_stmt", target: target_r.hexpr, value: value_r.hexpr, span: stmt.span },
        subst: s,
        effects,
      };
    }
    case "expr_stmt": {
      const r = ctx.infer_expr(stmt.expr, subst);
      return {
        hstmt: { kind: "expr_stmt", expr: r.hexpr, span: stmt.span },
        subst: r.subst,
        effects: r.effects,
      };
    }
    case "return_stmt": {
      if (stmt.value) {
        const r = ctx.infer_expr(stmt.value, subst);
        let s = r.subst;
        if (ctx.current_fn_return_type) {
          s = unify_at(ctx, r.hexpr.type, ctx.current_fn_return_type, s, stmt.span);
        }
        return {
          hstmt: { kind: "return_stmt", value: r.hexpr, span: stmt.span },
          subst: s,
          effects: r.effects,
        };
      }
      if (ctx.current_fn_return_type) {
        subst = unify_at(ctx, UNIT, ctx.current_fn_return_type, subst, stmt.span);
      }
      return {
        hstmt: { kind: "return_stmt", span: stmt.span },
        subst,
        effects: EMPTY_ROW,
      };
    }
    case "while_stmt": {
      const cond_r = ctx.infer_expr(stmt.condition, subst);
      let s = unify_at(ctx, cond_r.hexpr.type, BOOL, cond_r.subst, stmt.condition.span);
      ctx.env.push_scope();
      ctx.loop_depth++;
      let body_r!: InferResult;
      try {
        body_r = ctx.infer_block(stmt.body, s);
      } finally {
        ctx.loop_depth--;
        ctx.env.pop_scope();
      }
      s = body_r.subst;
      let while_effects: EffectRow;
      [while_effects, s] = merge_effects(ctx, cond_r.effects, body_r.effects, s);
      const hwhile: HWhileStmt = {
        kind: "while_stmt",
        condition: cond_r.hexpr,
        body: body_r.hexpr as HBlock,
        span: stmt.span,
      };
      return {
        hstmt: hwhile,
        subst: s,
        effects: while_effects,
      };
    }
    case "for_in_stmt": {
      const iter_r = ctx.infer_expr(stmt.iterable, subst);
      let s = iter_r.subst;
      const iter_type = apply(s, iter_r.hexpr.type);
      let element_type: Type;
      const is_destructure = !!stmt.destructure;
      if (iter_type.kind === "enum" && iter_type.name === BUILTIN_RANGE && iter_type.type_params.length > 0) {
        element_type = iter_type.type_params[0];
      } else if (iter_type.kind === "struct" && iter_type.name === BUILTIN_LIST && iter_type.type_params.length > 0) {
        element_type = iter_type.type_params[0];
      } else if (iter_type.kind === "struct" && iter_type.name === BUILTIN_SET && iter_type.type_params.length > 0) {
        element_type = iter_type.type_params[0];
      } else if (iter_type.kind === "struct" && iter_type.name === BUILTIN_MAP && iter_type.type_params.length >= 2) {
        if (!is_destructure) {
          type_error(ctx,
            E.E0301,
            `Map is not directly iterable with for..in. Use 'for (k, v) in map { ... }' instead.`,
            stmt.iterable.span,
            { kind: "other", detail: "Map requires destructuring: for (k, v) in map" }
          );
        }
        element_type = { kind: "tuple", elements: [iter_type.type_params[0], iter_type.type_params[1]] } as Type;
      } else {
        type_error(ctx,
          E.E0301,
          `for..in requires an iterable type (Range, List, Set, or Map), got ${type_to_string(iter_type)}`,
          stmt.iterable.span,
          { kind: "other", detail: "Supported iterables: range expressions (0..10), List<T>, Set<T>, Map<K,V>" }
        );
      }
      ctx.env.push_scope();
      let hdestructure: { name: string; def_id?: number }[] | undefined;
      if (is_destructure && stmt.destructure) {
        if (element_type.kind !== "tuple" || element_type.elements.length !== stmt.destructure.names.length) {
          type_error(ctx, E.E0301, `Destructure binding expects ${stmt.destructure.names.length} elements, but iterable element type is ${type_to_string(element_type)}`, stmt.span, { kind: "other", detail: "tuple arity mismatch" });
        }
        hdestructure = [];
        for (let i = 0; i < stmt.destructure.names.length; i++) {
          const name = stmt.destructure.names[i];
          const elem_t = element_type.kind === "tuple" && i < element_type.elements.length ? element_type.elements[i] : ctx.env.fresh_var();
          ctx.env.bind_mono(name, elem_t);
          const scheme = ctx.env.lookup(name)!;
          ctx.env.record_def_span(scheme.def_id!, stmt.destructure.spans[i]);
          hdestructure.push({ name, def_id: scheme.def_id });
        }
      } else {
        ctx.env.bind_mono(stmt.binding, element_type);
      }
      const binding_scheme = ctx.env.lookup(stmt.binding);
      if (binding_scheme) {
        ctx.env.record_def_span(binding_scheme.def_id!, stmt.binding_span);
      }
      ctx.loop_depth++;
      let body_r!: InferResult;
      try {
        body_r = ctx.infer_block(stmt.body, s);
      } finally {
        ctx.loop_depth--;
        ctx.env.pop_scope();
      }
      s = body_r.subst;
      let for_effects: EffectRow;
      [for_effects, s] = merge_effects(ctx, iter_r.effects, body_r.effects, s);
      const hfor: HForInStmt = {
        kind: "for_in_stmt",
        binding: stmt.binding,
        binding_span: stmt.binding_span,
        def_id: binding_scheme?.def_id,
        destructure: hdestructure,
        iterable: iter_r.hexpr,
        body: body_r.hexpr as HBlock,
        span: stmt.span,
      };
      return {
        hstmt: hfor,
        subst: s,
        effects: for_effects,
      };
    }
    case "break_stmt": {
      if (ctx.loop_depth === 0) {
        type_error(ctx, E.E0206, "'break' can only be used inside a loop", stmt.span, { kind: "other", detail: "break outside loop" });
      }
      return {
        hstmt: { kind: "break_stmt", span: stmt.span },
        subst,
        effects: EMPTY_ROW,
      };
    }
    case "continue_stmt": {
      if (ctx.loop_depth === 0) {
        type_error(ctx, E.E0206, "'continue' can only be used inside a loop", stmt.span, { kind: "other", detail: "continue outside loop" });
      }
      return {
        hstmt: { kind: "continue_stmt", span: stmt.span },
        subst,
        effects: EMPTY_ROW,
      };
    }
    case "let_destructure": {
      const init_r = ctx.infer_expr(stmt.init, subst);
      let s = init_r.subst;
      const init_type = apply(s, init_r.hexpr.type);
      if (init_type.kind !== "tuple") {
        type_error(ctx, E.E0301, `let destructuring requires tuple type, got ${type_to_string(init_type)}`, stmt.span, { kind: "other", detail: "not a tuple" });
      }
      const tuple_t = init_type.kind === "tuple" ? init_type : { kind: "tuple" as const, elements: [] };
      if (stmt.pattern.elements.length !== tuple_t.elements.length) {
        type_error(ctx, E.E0301,
          `Tuple has ${tuple_t.elements.length} elements but pattern has ${stmt.pattern.elements.length}`,
          stmt.span,
          { kind: "other", detail: "tuple arity mismatch" });
      }
      const bindings: { name: string; def_id?: number; type: Type }[] = [];
      for (let i = 0; i < stmt.pattern.elements.length; i++) {
        const p = stmt.pattern.elements[i];
        const elem_type = i < tuple_t.elements.length ? tuple_t.elements[i] : UNIT;
        if (p.kind === "binding") {
          ctx.env.bind_mono(p.name, elem_type);
          const scheme = ctx.env.lookup(p.name)!;
          ctx.env.record_def_span(scheme.def_id!, p.span);
          bindings.push({ name: p.name, def_id: scheme.def_id, type: elem_type });
        } else if (p.kind === "wildcard") {
          bindings.push({ name: "_", type: elem_type });
        } else {
          type_error(ctx, E.E0301, `Only binding and wildcard patterns are supported in let destructuring`, p.span, { kind: "other", detail: "unsupported pattern kind" });
          bindings.push({ name: "_", type: elem_type });
        }
      }
      const hstmt: HLetDestructureStmt = {
        kind: "let_destructure",
        pattern: stmt.pattern,
        bindings,
        init: init_r.hexpr,
        span: stmt.span,
      };
      return {
        hstmt,
        subst: s,
        effects: init_r.effects,
      };
    }
    case "if_let": {
      const expr_r = ctx.infer_expr(stmt.expr, subst);
      let s = expr_r.subst;
      const expr_type = apply(s, expr_r.hexpr.type);

      ctx.env.push_scope();
      let then_r!: { hexpr: HExpr; subst: Substitution; effects: EffectRow };
      let combined_effects: EffectRow = expr_r.effects;
      try {
        bind_pattern(ctx, stmt.pattern, expr_type, s);
        then_r = ctx.infer_block(stmt.then_block, s);
        s = then_r.subst;
        [combined_effects, s] = merge_effects(ctx, combined_effects, then_r.effects, s);
      } finally {
        ctx.env.pop_scope();
      }

      let else_hblock: HBlock | null = null;
      if (stmt.else_block) {
        ctx.env.push_scope();
        try {
          const else_r = ctx.infer_block(stmt.else_block, s);
          s = else_r.subst;
          else_hblock = else_r.hexpr as HBlock;
          [combined_effects, s] = merge_effects(ctx, combined_effects, else_r.effects, s);
        } finally {
          ctx.env.pop_scope();
        }
      }

      const hstmt: HIfLetStmt = {
        kind: "if_let",
        pattern: stmt.pattern,
        expr: expr_r.hexpr,
        then_block: then_r.hexpr as HBlock,
        else_block: else_hblock,
        span: stmt.span,
      };
      return { hstmt, subst: s, effects: combined_effects };
    }
  }
}
