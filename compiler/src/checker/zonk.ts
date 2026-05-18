import { Substitution, apply, apply_to_effect_row } from "./unify.js";
import {
  HBlock, HStmt, HExpr, HParam,
  HMatchArm, HEffectHandler, HStructFieldInit,
} from "../hir/index.js";
import { Type, Effect, EffectRow } from "../types/index.js";

export interface ZonkCtx {
  subst: Substitution;
  names: Map<number, string>;
}

export function zonk_type(ctx: ZonkCtx, t: Type): Type {
  const resolved = apply(ctx.subst, t);
  return label_vars(ctx.names, resolved);
}

function label_effect(names: Map<number, string>, e: Effect): Effect {
  switch (e.kind) {
    case "fail":
      return { ...e, error_type: label_vars(names, e.error_type) };
    case "custom":
      return { ...e, type_args: e.type_args.map(a => label_vars(names, a)) };
    default:
      return e;
  }
}

function label_effect_row(names: Map<number, string>, row: EffectRow): EffectRow {
  return {
    effects: row.effects.map(e => label_effect(names, e)),
    tail: row.tail,
  };
}

function label_vars(names: Map<number, string>, t: Type): Type {
  switch (t.kind) {
    case "var":
      return names.has(t.id) ? { ...t, name: names.get(t.id) } : t;
    case "fn":
      return { ...t, params: t.params.map(p => label_vars(names, p)), return_type: label_vars(names, t.return_type), effects: label_effect_row(names, t.effects) };
    case "struct":
      return { ...t, type_params: t.type_params.map(p => label_vars(names, p)), fields: t.fields.map(f => ({ ...f, type: label_vars(names, f.type) })) };
    case "enum":
      return { ...t, type_params: t.type_params.map(p => label_vars(names, p)), variants: t.variants.map(v => ({ ...v, fields: v.fields.map(f => label_vars(names, f)) })) };
    case "generic":
      return { ...t, base: label_vars(names, t.base), args: t.args.map(a => label_vars(names, a)) };
    case "record": {
      const tail_name = t.tail !== undefined && names.has(t.tail) ? names.get(t.tail) : t.tail_name;
      return { ...t, fields: t.fields.map(f => ({ ...f, type: label_vars(names, f.type) })), tail_name };
    }
    case "effect_row":
      return { ...t, effects: t.effects.map(e => label_effect(names, e)) };
    default:
      return t;
  }
}

export function zonk_row(ctx: ZonkCtx, r: EffectRow): EffectRow {
  return apply_to_effect_row(ctx.subst, r);
}

export function zonk_param(ctx: ZonkCtx, p: HParam): HParam {
  return { ...p, type: zonk_type(ctx, p.type) };
}

export function zonk_block(ctx: ZonkCtx, block: HBlock): HBlock {
  return {
    kind: "block",
    type: zonk_type(ctx, block.type),
    effects: zonk_row(ctx, block.effects),
    span: block.span,
    stmts: block.stmts.map(s => zonk_stmt(ctx, s)),
    tail: block.tail ? zonk_expr(ctx, block.tail) : undefined,
  };
}

function zonk_stmt(ctx: ZonkCtx, stmt: HStmt): HStmt {
  switch (stmt.kind) {
    case "let_stmt":    return { ...stmt, type: zonk_type(ctx, stmt.type), init: zonk_expr(ctx, stmt.init) };
    case "var_stmt":    return { ...stmt, type: zonk_type(ctx, stmt.type), init: zonk_expr(ctx, stmt.init) };
    case "assign_stmt": return { ...stmt, target: zonk_expr(ctx, stmt.target), value: zonk_expr(ctx, stmt.value) };
    case "expr_stmt":   return { ...stmt, expr: zonk_expr(ctx, stmt.expr) };
    case "return_stmt": return { ...stmt, value: stmt.value ? zonk_expr(ctx, stmt.value) : undefined };
    case "while_stmt":  return { ...stmt, condition: zonk_expr(ctx, stmt.condition), body: zonk_block(ctx, stmt.body) };
    case "for_in_stmt": return { ...stmt, iterable: zonk_expr(ctx, stmt.iterable), body: zonk_block(ctx, stmt.body) };
    case "break_stmt":  return stmt;
    case "continue_stmt": return stmt;
    case "let_destructure":
      return {
        ...stmt,
        bindings: stmt.bindings.map(b => ({ ...b, type: zonk_type(ctx, b.type) })),
        init: zonk_expr(ctx, stmt.init),
      };
  }
}

export function zonk_expr(ctx: ZonkCtx, expr: HExpr): HExpr {
  const type = zonk_type(ctx, expr.type);
  const effects = zonk_row(ctx, expr.effects);
  const base = { type, effects, span: expr.span };

  switch (expr.kind) {
    case "int_lit":    return { ...base, kind: "int_lit", value: expr.value };
    case "float_lit":  return { ...base, kind: "float_lit", value: expr.value };
    case "str_lit":    return { ...base, kind: "str_lit", value: expr.value };
    case "bool_lit":   return { ...base, kind: "bool_lit", value: expr.value };
    case "ident":      return { ...base, kind: "ident", name: expr.name, resolved_name: expr.resolved_name, def_id: expr.def_id, dict_closure_dicts: expr.dict_closure_dicts };
    case "bin_op":     return { ...base, kind: "bin_op", op: expr.op, left: zonk_expr(ctx, expr.left), right: zonk_expr(ctx, expr.right) };
    case "unary_op":   return { ...base, kind: "unary_op", op: expr.op, operand: zonk_expr(ctx, expr.operand) };
    case "call":
      return {
        ...base, kind: "call",
        callee: zonk_expr(ctx, expr.callee), args: expr.args.map(a => zonk_expr(ctx, a)),
        type_args: expr.type_args.map(t => zonk_type(ctx, t)),
        resolved_dicts: expr.resolved_dicts, dict_dispatch: expr.dict_dispatch,
      };
    case "field_access": return { ...base, kind: "field_access", receiver: zonk_expr(ctx, expr.receiver), field: expr.field };
    case "struct_lit":
      return {
        ...base, kind: "struct_lit", name: expr.name,
        type_args: expr.type_args.map(t => zonk_type(ctx, t)),
        fields: expr.fields.map((f): HStructFieldInit => ({ name: f.name, value: zonk_expr(ctx, f.value) })),
      };
    case "match_expr":
      return {
        ...base, kind: "match_expr", scrutinee: zonk_expr(ctx, expr.scrutinee),
        arms: expr.arms.map((a): HMatchArm => ({
          pattern: a.pattern, guard: a.guard ? zonk_expr(ctx, a.guard) : undefined,
          body: zonk_expr(ctx, a.body), span: a.span,
        })),
      };
    case "block":   return { ...base, kind: "block", stmts: block_stmts(ctx, expr), tail: block_tail(ctx, expr) };
    case "if_expr": {
      const eb = expr.else_branch
        ? (expr.else_branch.kind === "block" ? zonk_block(ctx, expr.else_branch) : zonk_expr(ctx, expr.else_branch))
        : undefined;
      return {
        ...base, kind: "if_expr", condition: zonk_expr(ctx, expr.condition),
        then_branch: zonk_block(ctx, expr.then_branch),
        else_branch: eb as HBlock | import("../hir/index.js").HIf | undefined,
      };
    }
    case "string_interp":
      return { ...base, kind: "string_interp", parts: expr.parts.map(p => typeof p === "string" ? p : zonk_expr(ctx, p)) };
    case "try_catch":
      return { ...base, kind: "try_catch", body: zonk_expr(ctx, expr.body), error_binding: expr.error_binding, error_type: expr.error_type, handler: zonk_expr(ctx, expr.handler) };
    case "handle_expr":
      return {
        ...base, kind: "handle_expr", body: zonk_expr(ctx, expr.body),
        handlers: expr.handlers.map((h): HEffectHandler => ({
          effect_name: h.effect_name, op_name: h.op_name,
          params: h.params.map(p => zonk_param(ctx, p)), resume_name: h.resume_name, body: zonk_expr(ctx, h.body),
        })),
      };
    case "lambda":
      return { ...base, kind: "lambda", params: expr.params.map(p => zonk_param(ctx, p)), return_type: zonk_type(ctx, expr.return_type), body: zonk_expr(ctx, expr.body) };
    case "effect_op":
      return { ...base, kind: "effect_op", effect_name: expr.effect_name, op_name: expr.op_name, args: expr.args.map(a => zonk_expr(ctx, a)) };
    case "option_unwrap": return { ...base, kind: "option_unwrap", expr: zonk_expr(ctx, expr.expr) };
    case "try_block":     return { ...base, kind: "try_block", body: zonk_expr(ctx, expr.body) };
    case "option_or":     return { ...base, kind: "option_or", expr: zonk_expr(ctx, expr.expr), default_value: zonk_expr(ctx, expr.default_value) };
    case "range":         return { ...base, kind: "range", start: zonk_expr(ctx, expr.start), end: zonk_expr(ctx, expr.end) };
    case "list_lit":      return { ...base, kind: "list_lit", elements: expr.elements.map(e => zonk_expr(ctx, e)) };
    case "tuple_lit":     return { ...base, kind: "tuple_lit", elements: expr.elements.map(e => zonk_expr(ctx, e)) };
  }
}

function block_stmts(ctx: ZonkCtx, block: HBlock): HStmt[] {
  return block.stmts.map(s => zonk_stmt(ctx, s));
}

function block_tail(ctx: ZonkCtx, block: HBlock): HExpr | undefined {
  return block.tail ? zonk_expr(ctx, block.tail) : undefined;
}
