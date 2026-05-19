// Expression-specific inference functions extracted from InferEngine.
// All functions take `ctx: InferCtx` as first parameter.

import type {
  Expr, MatchArm, Param,
  Span,
  BinOp, UnaryOp,
  BlockExpr, IfExpr,
} from "../ast/index.js";
import type {
  Type, FnType, TypeVar, EffectRow, Effect,
} from "../types/index.js";
import {
  INT, STR, BOOL, UNIT,
  EMPTY_ROW, effect_row, type_to_string,
  make_option_type, is_option_type, option_inner,
} from "../types/index.js";
import type {
  HExpr, HParam, HMatchArm, HEffectHandler, HStructFieldInit, HIdent, HBlock,
} from "../hir/index.js";
import {
  variant_js_name, trait_dict_name, trait_bound_param_name,
  BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR,
  BUILTIN_LIST,
} from "../hir/index.js";
import { substitute_type } from "./env.js";
import type { Substitution } from "./unify.js";
import { apply, apply_to_effect_row } from "./unify.js";
import { check_exhaustive } from "./exhaustive.js";
import { E } from "../diagnostics/codes.js";
import type { InferCtx, InferResult } from "./infer-ctx.js";
import {
  type_error, merge_effects, unify_at,
  resolve_type_expr, resolve_named_type,
  bind_pattern,
  build_scheme_var_map, resolve_dicts_from_scheme,
  remove_fail_effect, remove_specific_fail_effect,
} from "./infer-ctx.js";

// ============================================================
// infer_ident
// ============================================================

export function infer_ident(ctx: InferCtx, name: string, span: Span, subst: Substitution): InferResult {
  const scheme = ctx.env.lookup(name);
  if (!scheme) {
    type_error(ctx, E.E0201, `Undefined variable: ${name}`, span, { kind: "undefined_variable", name });
  }
  const t = ctx.env.instantiate(scheme);

  let resolved_name: string | undefined;
  const enum_name = ctx.env.variant_to_enum.get(name);
  if (enum_name) {
    resolved_name = variant_js_name(enum_name, name);
  }

  return {
    hexpr: { kind: "ident", name, resolved_name, def_id: scheme.def_id, type: t, effects: EMPTY_ROW, span },
    subst,
    effects: EMPTY_ROW,
  };
}

// ============================================================
// infer_bin_op
// ============================================================

export function infer_bin_op(ctx: InferCtx, op: BinOp, left: Expr, right: Expr, span: Span, subst: Substitution): InferResult {
  const lr = ctx.infer_expr(left, subst);
  const rr = ctx.infer_expr(right, lr.subst);
  let s = rr.subst;
  let result_type: Type;

  switch (op) {
    case "+": case "-": case "*": case "/": case "%": {
      s = unify_at(ctx, lr.hexpr.type, rr.hexpr.type, s, span);
      const resolved = apply(s, lr.hexpr.type);
      if (resolved.kind === "var") {
        s = unify_at(ctx, resolved, INT, s, span);
        result_type = INT;
      } else if (resolved.kind === "int" || resolved.kind === "float") {
        result_type = resolved;
      } else {
        type_error(ctx, E.E0303, `Operator ${op} requires numeric types, got ${type_to_string(resolved)}`, span, { kind: "type_mismatch", expected: "Int or Float", actual: type_to_string(resolved) });
      }
      break;
    }
    case "==": case "!=": case "<": case "<=": case ">": case ">=": {
      s = unify_at(ctx, lr.hexpr.type, rr.hexpr.type, s, span);
      result_type = BOOL;
      break;
    }
    case "&&": case "||": {
      s = unify_at(ctx, lr.hexpr.type, BOOL, s, span);
      s = unify_at(ctx, rr.hexpr.type, BOOL, s, span);
      result_type = BOOL;
      break;
    }
  }

  let effects: EffectRow;
  [effects, s] = merge_effects(ctx, lr.effects, rr.effects, s);
  return {
    hexpr: { kind: "bin_op", op, left: lr.hexpr, right: rr.hexpr, type: result_type!, effects, span },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_unary_op
// ============================================================

export function infer_unary_op(ctx: InferCtx, op: UnaryOp, operand: Expr, span: Span, subst: Substitution): InferResult {
  const r = ctx.infer_expr(operand, subst);
  let s = r.subst;
  let result_type: Type;

  if (op === "-") {
    const resolved = apply(s, r.hexpr.type);
    if (resolved.kind === "var") {
      s = unify_at(ctx, resolved, INT, s, span);
      result_type = INT;
    } else if (resolved.kind === "int" || resolved.kind === "float") {
      result_type = resolved;
    } else {
      type_error(ctx, E.E0303, `Unary - requires numeric type, got ${type_to_string(resolved)}`, span, { kind: "type_mismatch", expected: "Int or Float", actual: type_to_string(resolved) });
    }
  } else {
    s = unify_at(ctx, r.hexpr.type, BOOL, s, span);
    result_type = BOOL;
  }

  return {
    hexpr: { kind: "unary_op", op, operand: r.hexpr, type: result_type, effects: r.effects, span },
    subst: s,
    effects: r.effects,
  };
}

// ============================================================
// infer_call
// ============================================================

export function infer_call(ctx: InferCtx, callee: Expr, args: Expr[], span: Span, subst: Substitution): InferResult {
  const callee_r = ctx.infer_expr(callee, subst);
  let s = callee_r.subst;
  let effects = callee_r.effects;

  const hargs: HExpr[] = [];
  const arg_types: Type[] = [];
  for (const arg of args) {
    const ar = ctx.infer_expr(arg, s);
    s = ar.subst;
    [effects, s] = merge_effects(ctx, effects, ar.effects, s);
    hargs.push(ar.hexpr);
    arg_types.push(ar.hexpr.type);
  }

  const ret_var = ctx.env.fresh_var();
  const effect_tail = ctx.env.fresh_var() as TypeVar;
  const expected_fn: FnType = {
    kind: "fn",
    params: arg_types,
    return_type: ret_var,
    effects: { effects: [], tail: effect_tail.id },
  };

  s = unify_at(ctx, callee_r.hexpr.type, expected_fn, s, span);
  const resolved_callee_type = apply(s, callee_r.hexpr.type);

  if (resolved_callee_type.kind === "fn") {
    [effects, s] = merge_effects(ctx, effects, resolved_callee_type.effects, s);
  }

  const result_type = apply(s, ret_var);

  let resolved_dicts: string[] = [];
  if (callee.kind === "ident") {
    const scheme = ctx.env.lookup(callee.name);
    if (scheme && scheme.bounds.length > 0) {
      resolved_dicts = resolve_dicts_from_scheme(ctx, scheme, callee_r.hexpr.type, s, span);
    }
  }

  for (const harg of hargs) {
    if (harg.kind !== "ident") continue;
    const arg_scheme = ctx.env.lookup(harg.name);
    if (!arg_scheme || arg_scheme.bounds.length === 0) continue;
    const var_map = build_scheme_var_map(arg_scheme, harg.type);
    const dicts: string[] = [];
    for (const bound of arg_scheme.bounds) {
      const fresh_var = var_map.get(bound.type_var);
      if (fresh_var) {
        const concrete = apply(s, fresh_var);
        if ((concrete.kind === "struct" || concrete.kind === "enum") &&
            ctx.env.trait_impls.some(
              impl => impl.target_type_name === concrete.name && impl.trait_name === bound.trait_name
            )) {
          dicts.push(trait_dict_name(concrete.name, bound.trait_name));
        } else if (concrete.kind === "var") {
          const matching_bound = ctx.current_fn_bounds.find(
            fb => fb.type_param_var_id === concrete.id && fb.trait_name === bound.trait_name
          );
          if (matching_bound) {
            dicts.push(trait_bound_param_name(matching_bound.type_param_name, matching_bound.trait_name));
          }
        }
      }
    }
    if (dicts.length > 0) {
      (harg as HIdent).dict_closure_dicts = dicts;
    }
  }

  return {
    hexpr: { kind: "call", callee: callee_r.hexpr, args: hargs, type_args: [], resolved_dicts, type: result_type, effects, span },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_method_call
// ============================================================

export function infer_method_call(ctx: InferCtx, receiver: Expr, method: string, args: Expr[], span: Span, subst: Substitution): InferResult {
  // Check if receiver is an effect module (e.g., io.read, io.write)
  if (receiver.kind === "ident") {
    const effect_def = ctx.env.effects.get(receiver.name);
    if (effect_def) {
      return infer_effect_op(ctx, receiver.name, method, args, span, subst);
    }
  }

  // Infer receiver
  const recv_r = ctx.infer_expr(receiver, subst);
  let s = recv_r.subst;
  let effects = recv_r.effects;

  // Look up method in impl
  const recv_type = apply(s, recv_r.hexpr.type);
  let method_type: Type | undefined;

  if (recv_type.kind === "struct") {
    const impl_methods = ctx.env.impl_methods.get(recv_type.name);
    if (impl_methods) {
      const scheme = impl_methods.get(method);
      if (scheme) {
        method_type = ctx.env.instantiate(scheme);
      }
    }
  } else if (recv_type.kind === "enum") {
    const impl_methods = ctx.env.impl_methods.get(recv_type.name);
    if (impl_methods) {
      const scheme = impl_methods.get(method);
      if (scheme) {
        method_type = ctx.env.instantiate(scheme);
      }
    }
  }

  // Method lookup for primitive types (Str, Int, Float)
  if (!method_type) {
    const prim_name = recv_type.kind === "str" ? BUILTIN_STR
      : recv_type.kind === "int" ? BUILTIN_INT
      : recv_type.kind === "float" ? BUILTIN_FLOAT
      : null;
    if (prim_name) {
      const prim_methods = ctx.env.impl_methods.get(prim_name);
      if (prim_methods) {
        const scheme = prim_methods.get(method);
        if (scheme) {
          method_type = ctx.env.instantiate(scheme);
        }
      }
    }
  }

  // Check trait impls for the receiver type
  if (!method_type && (recv_type.kind === "struct" || recv_type.kind === "enum")) {
    const type_name = recv_type.name;
    for (const impl_entry of ctx.env.trait_impls) {
      if (impl_entry.target_type_name === type_name) {
        const trait_def = ctx.env.traits.get(impl_entry.trait_name);
        if (trait_def) {
          const tm = trait_def.methods.find(m => m.name === method);
          if (tm) {
            method_type = ctx.env.instantiate({ type: tm.type, type_vars: trait_def.type_param_vars, bounds: [] });
            break;
          }
        }
      }
    }
  }

  let dict_dispatch: { dict_param: string; method: string } | undefined;
  // Resolve a var id to its terminal var id through the substitution chain.
  const resolve_var_id = (id: number, sub: Substitution): number => {
    const resolved = sub.get(id);
    if (resolved && resolved.kind === "var") return resolve_var_id(resolved.id, sub);
    return id;
  };
  const recv_raw_type = recv_r.hexpr.type;
  const recv_var_id = recv_raw_type.kind === "var" ? resolve_var_id(recv_raw_type.id, s) : null;
  if (!method_type && recv_var_id !== null) {
    for (const fb of ctx.current_fn_bounds) {
      if (resolve_var_id(fb.type_param_var_id, s) === recv_var_id) {
        const trait_def = ctx.env.traits.get(fb.trait_name);
        if (trait_def) {
          const tm = trait_def.methods.find(m => m.name === method);
          if (tm) {
            method_type = ctx.env.instantiate({ type: tm.type, type_vars: trait_def.type_param_vars, bounds: [] });
            dict_dispatch = { dict_param: trait_bound_param_name(fb.type_param_name, fb.trait_name), method };
            break;
          }
        }
      }
    }
  }

  // Infer arguments
  const hargs: HExpr[] = [];
  for (const arg of args) {
    const ar = ctx.infer_expr(arg, s);
    s = ar.subst;
    [effects, s] = merge_effects(ctx, effects, ar.effects, s);
    hargs.push(ar.hexpr);
  }

  let result_type: Type;
  if (method_type && method_type.kind === "fn") {
    if (method_type.params.length > 0) {
      s = unify_at(ctx, recv_r.hexpr.type, method_type.params[0], s, span);
    }
    for (let i = 0; i < hargs.length && i + 1 < method_type.params.length; i++) {
      s = unify_at(ctx, hargs[i].type, method_type.params[i + 1], s, span);
    }
    result_type = apply(s, method_type.return_type);
    [effects, s] = merge_effects(ctx, effects, method_type.effects, s);
  } else {
    if (recv_type.kind !== "var") {
      type_error(ctx, E.E0305, `Type '${type_to_string(recv_type)}' has no method '${method}'`, span, { kind: "other", detail: `no method '${method}' on type '${type_to_string(recv_type)}'` });
    }
    result_type = ctx.env.fresh_var();
  }

  return {
    hexpr: {
      kind: "call",
      callee: { kind: "field_access", receiver: recv_r.hexpr, field: method, type: method_type ?? ctx.env.fresh_var(), effects: EMPTY_ROW, span },
      args: hargs,
      type_args: [],
      resolved_dicts: [],
      dict_dispatch,
      type: result_type,
      effects,
      span,
    },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_effect_op
// ============================================================

export function infer_effect_op(ctx: InferCtx, effect_name: string, op_name: string, args: Expr[], span: Span, subst: Substitution): InferResult {
  const effect_def = ctx.env.effects.get(effect_name)!;
  const op = effect_def.ops.find(o => o.name === op_name);
  if (!op) {
    type_error(ctx, E.E0402, `Effect ${effect_name} has no operation ${op_name}`, span, { kind: "other", detail: `no operation '${op_name}' on effect '${effect_name}'` });
  }

  let s = subst;
  let effects: EffectRow = EMPTY_ROW;
  const hargs: HExpr[] = [];

  if (args.length !== op.params.length) {
    type_error(ctx, E.E0301, `Effect operation '${effect_name}.${op_name}' expects ${op.params.length} argument(s), got ${args.length}`, span, { kind: "type_mismatch", expected: `${op.params.length} args`, actual: `${args.length} args` });
  }

  for (let i = 0; i < args.length; i++) {
    const ar = ctx.infer_expr(args[i], s);
    s = ar.subst;
    [effects, s] = merge_effects(ctx, effects, ar.effects, s);
    hargs.push(ar.hexpr);
    if (i < op.params.length) {
      s = unify_at(ctx, ar.hexpr.type, op.params[i], s, span);
    }
  }

  // Add the effect to the effect row
  let effect: Effect;
  switch (effect_def.built_in_kind) {
    case "io":
      effect = { kind: "io" };
      break;
    case "fail": {
      const error_type = hargs.length > 0 ? apply(s, hargs[0].type) : UNIT;
      effect = { kind: "fail", error_type };
      break;
    }
    case "mut":
      effect = { kind: "mut" };
      break;
    default:
      effect = { kind: "custom", name: effect_name, type_args: [] };
  }
  [effects, s] = merge_effects(ctx, effects, effect_row(effect), s);

  return {
    hexpr: {
      kind: "effect_op",
      effect_name,
      op_name,
      args: hargs,
      type: op.return_type,
      effects,
      span,
    },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_field_access
// ============================================================

export function infer_field_access(ctx: InferCtx, receiver: Expr, field: string, span: Span, subst: Substitution): InferResult {
  const recv_r = ctx.infer_expr(receiver, subst);
  const s = recv_r.subst;
  const recv_type = apply(s, recv_r.hexpr.type);

  let field_type: Type;
  if (recv_type.kind === "struct") {
    const struct_def = ctx.env.structs.get(recv_type.name);
    if (struct_def) {
      const f = struct_def.fields.find(f => f.name === field);
      if (f) {
        const instantiation_map = new Map<number, Type>();
        for (let i = 0; i < struct_def.type_param_vars.length; i++) {
          if (i < recv_type.type_params.length) {
            instantiation_map.set(struct_def.type_param_vars[i], recv_type.type_params[i]);
          }
        }
        field_type = substitute_type(f.type, instantiation_map);
      } else {
        type_error(ctx, E.E0304, `Struct ${recv_type.name} has no field ${field}`, span, { kind: "missing_field", field, type: recv_type.name });
      }
    } else {
      type_error(ctx, E.E0203, `Unknown struct: ${recv_type.name}`, span, { kind: "other", detail: `unknown struct '${recv_type.name}'` });
    }
  } else if (recv_type.kind === "record") {
    const f = recv_type.fields.find(f => f.name === field);
    if (f) {
      field_type = f.type;
    } else if (recv_type.tail !== undefined) {
      field_type = ctx.env.fresh_var();
    } else {
      type_error(ctx, E.E0304, `Record type has no field '${field}'`, span, { kind: "missing_field", field, type: "record" });
    }
  } else if (recv_type.kind === "var") {
    field_type = ctx.env.fresh_var();
  } else {
    type_error(ctx, E.E0304, `Cannot access field '${field}' on type ${type_to_string(recv_type)}`, span, { kind: "missing_field", field, type: type_to_string(recv_type) });
  }

  return {
    hexpr: { kind: "field_access", receiver: recv_r.hexpr, field, type: field_type, effects: recv_r.effects, span },
    subst: s,
    effects: recv_r.effects,
  };
}

// ============================================================
// infer_struct_lit
// ============================================================

export function infer_struct_lit(ctx: InferCtx, name: string, fields: { name: string; value: Expr; span: Span }[], spread: Expr | undefined, span: Span, subst: Substitution): InferResult {
  // Check if this is a named enum variant construction
  const variant_enum = ctx.env.variant_to_enum.get(name);
  if (variant_enum) {
    const enum_def = ctx.env.enums.get(variant_enum);
    if (enum_def) {
      const variant = enum_def.variants.find(v => v.name === name);
      if (variant && variant.field_names) {
        return infer_named_variant_construct(ctx, variant_enum, name, variant, enum_def, fields, spread, span, subst);
      }
    }
  }

  const struct_def = ctx.env.structs.get(name);
  if (!struct_def) {
    type_error(ctx, E.E0203, `Unknown struct: ${name}`, span, { kind: "other", detail: `unknown struct '${name}'` });
  }

  const instantiation_map = new Map<number, Type>();
  const type_param_types: Type[] = [];
  for (let i = 0; i < struct_def.type_params.length; i++) {
    const tv = ctx.env.fresh_var();
    instantiation_map.set(struct_def.type_param_vars[i], tv);
    type_param_types.push(tv);
  }

  let s = subst;
  let effects: EffectRow = EMPTY_ROW;
  const hfields: HStructFieldInit[] = [];

  let hspread: import("../hir/index.js").HExpr | undefined;
  if (spread) {
    const sr = ctx.infer_expr(spread, s);
    s = sr.subst;
    [effects, s] = merge_effects(ctx, effects, sr.effects, s);
    const spread_struct_type: Type = {
      kind: "struct", name,
      type_params: type_param_types,
      fields: struct_def.fields.map(f => ({ name: f.name, type: substitute_type(f.type, instantiation_map), is_pub: f.is_pub })),
    };
    s = unify_at(ctx, sr.hexpr.type, spread_struct_type, s, span);
    hspread = sr.hexpr;
  }

  for (const field of fields) {
    const fr = ctx.infer_expr(field.value, s);
    s = fr.subst;
    [effects, s] = merge_effects(ctx, effects, fr.effects, s);

    const def_field = struct_def.fields.find(f => f.name === field.name);
    if (def_field) {
      const field_type = substitute_type(def_field.type, instantiation_map);
      s = unify_at(ctx, fr.hexpr.type, field_type, s, span);
    } else {
      type_error(ctx, E.E0203, `Struct '${name}' has no field '${field.name}'`, field.span, { kind: "missing_field", field: field.name, type: name, available: struct_def.fields.map(f => f.name) });
    }
    hfields.push({ name: field.name, value: fr.hexpr });
  }

  if (!spread) {
    const provided = new Set(fields.map(f => f.name));
    for (const def_field of struct_def.fields) {
      if (!provided.has(def_field.name)) {
        type_error(ctx, E.E0203, `Missing field '${def_field.name}' in struct literal '${name}'`, span, { kind: "missing_field", field: def_field.name, type: name, available: struct_def.fields.map(f => f.name) });
      }
    }
  }

  const struct_type: Type = {
    kind: "struct",
    name,
    type_params: type_param_types,
    fields: struct_def.fields.map(f => ({ name: f.name, type: f.type, is_pub: f.is_pub })),
  };

  return {
    hexpr: { kind: "struct_lit", name, type_args: [], fields: hfields, spread: hspread, type: struct_type, effects, span },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_named_variant_construct
// ============================================================

export function infer_named_variant_construct(
  ctx: InferCtx, enum_name: string, variant_name: string,
  variant: { name: string; fields: Type[]; field_names?: string[] },
  enum_def: import("./env.js").EnumDef,
  fields: { name: string; value: Expr; span: Span }[],
  spread: Expr | undefined,
  span: Span, subst: Substitution,
): InferResult {
  const field_names = variant.field_names!;

  const instantiation_map = new Map<number, Type>();
  const type_param_types: Type[] = [];
  for (let i = 0; i < enum_def.type_params.length; i++) {
    const tv = ctx.env.fresh_var();
    instantiation_map.set(enum_def.type_param_vars[i], tv);
    type_param_types.push(tv);
  }

  let s = subst;
  let effects: EffectRow = EMPTY_ROW;
  const hfields: HStructFieldInit[] = [];

  let hspread: import("../hir/index.js").HExpr | undefined;
  if (spread) {
    const sr = ctx.infer_expr(spread, s);
    s = sr.subst;
    [effects, s] = merge_effects(ctx, effects, sr.effects, s);
    const all_variants = enum_def.variants.map(v => ({
      name: v.name, fields: v.fields, field_names: v.field_names,
    }));
    const spread_enum_type: Type = {
      kind: "enum", name: enum_name, type_params: type_param_types, variants: all_variants,
    };
    s = unify_at(ctx, sr.hexpr.type, spread_enum_type, s, span);
    hspread = sr.hexpr;
  }

  for (const field of fields) {
    const fr = ctx.infer_expr(field.value, s);
    s = fr.subst;
    [effects, s] = merge_effects(ctx, effects, fr.effects, s);

    const field_idx = field_names.indexOf(field.name);
    if (field_idx >= 0 && field_idx < variant.fields.length) {
      const field_type = substitute_type(variant.fields[field_idx], instantiation_map);
      s = unify_at(ctx, fr.hexpr.type, field_type, s, span);
    } else {
      type_error(ctx, E.E0203, `Variant '${variant_name}' has no field '${field.name}'`, field.span,
        { kind: "missing_field", field: field.name, type: variant_name, available: field_names });
    }
    hfields.push({ name: field.name, value: fr.hexpr });
  }

  if (!spread) {
    const provided = new Set(fields.map(f => f.name));
    for (const fn_name of field_names) {
      if (!provided.has(fn_name)) {
        type_error(ctx, E.E0203, `Missing field '${fn_name}' in variant '${variant_name}'`, span,
          { kind: "missing_field", field: fn_name, type: variant_name, available: field_names });
      }
    }
  }

  const all_variants = enum_def.variants.map(v => ({
    name: v.name,
    fields: v.fields,
    field_names: v.field_names,
  }));
  const enum_type: Type = {
    kind: "enum", name: enum_name, type_params: type_param_types, variants: all_variants,
  };

  return {
    hexpr: {
      kind: "named_variant_construct", enum_name, variant_name,
      fields: hfields, spread: hspread, type: enum_type, effects, span,
    },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_match
// ============================================================

export function infer_match(ctx: InferCtx, scrutinee: Expr, arms: MatchArm[], span: Span, subst: Substitution): InferResult {
  const scrut_r = ctx.infer_expr(scrutinee, subst);
  let s = scrut_r.subst;
  let effects = scrut_r.effects;

  const result_type = ctx.env.fresh_var();
  const harms: HMatchArm[] = [];

  for (const arm of arms) {
    ctx.env.push_scope();
    try {
      // Reclassify binding patterns that match zero-field enum variants
      if (arm.pattern.kind === "binding") {
        const pat_name = arm.pattern.name;
        const variant_enum = ctx.env.variant_to_enum.get(pat_name);
        if (variant_enum) {
          const enum_def = ctx.env.enums.get(variant_enum);
          const variant = enum_def?.variants.find(v => v.name === pat_name);
          if (variant && variant.fields.length === 0) {
            arm.pattern = { kind: "constructor", name: pat_name, fields: [], span: arm.pattern.span };
          }
        }
      }

      bind_pattern(ctx, arm.pattern, scrut_r.hexpr.type, s);

      let guard_hexpr: HExpr | undefined;
      if (arm.guard) {
        const gr = ctx.infer_expr(arm.guard, s);
        s = gr.subst;
        s = unify_at(ctx, gr.hexpr.type, BOOL, s, arm.span);
        [effects, s] = merge_effects(ctx, effects, gr.effects, s);
        guard_hexpr = gr.hexpr;
      }

      const body_r = ctx.infer_expr(arm.body, s);
      s = body_r.subst;
      [effects, s] = merge_effects(ctx, effects, body_r.effects, s);
      s = unify_at(ctx, body_r.hexpr.type, result_type, s, arm.span);

      harms.push({
        pattern: arm.pattern,
        guard: guard_hexpr,
        body: body_r.hexpr,
        span: arm.span,
      });
    } finally {
      ctx.env.pop_scope();
    }
  }

  const scrut_type_resolved = apply(s, scrut_r.hexpr.type);
  const missing = check_exhaustive(arms, scrut_type_resolved, s);
  if (missing !== null) {
    const type_str = type_to_string(scrut_type_resolved);
    type_error(ctx, E.E0601, `Non-exhaustive match on type ${type_str}: missing pattern for ${missing}`, span, { kind: "pattern_error", detail: `missing: ${missing}` });
  }

  const final_type = apply(s, result_type);
  return {
    hexpr: { kind: "match_expr", scrutinee: scrut_r.hexpr, arms: harms, type: final_type, effects, span },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_if
// ============================================================

export function infer_if(ctx: InferCtx, condition: Expr, then_branch: BlockExpr, else_branch: BlockExpr | IfExpr | undefined, span: Span, subst: Substitution): InferResult {
  const cond_r = ctx.infer_expr(condition, subst);
  let s = cond_r.subst;
  s = unify_at(ctx, cond_r.hexpr.type, BOOL, s, span);
  let effects = cond_r.effects;

  const then_r = ctx.infer_block(then_branch, s);
  s = then_r.subst;
  [effects, s] = merge_effects(ctx, effects, then_r.effects, s);

  let else_hexpr: HBlock | undefined;
  let result_type: Type;

  if (else_branch) {
    if (else_branch.kind === "block") {
      const else_r = ctx.infer_block(else_branch, s);
      s = else_r.subst;
      [effects, s] = merge_effects(ctx, effects, else_r.effects, s);
      s = unify_at(ctx, then_r.hexpr.type, else_r.hexpr.type, s, span);
      result_type = apply(s, then_r.hexpr.type);
      else_hexpr = else_r.hexpr as HBlock;
    } else {
      const else_if_r = infer_if(ctx, else_branch.condition, else_branch.then_branch, else_branch.else_branch, else_branch.span, s);
      s = else_if_r.subst;
      [effects, s] = merge_effects(ctx, effects, else_if_r.effects, s);
      s = unify_at(ctx, then_r.hexpr.type, else_if_r.hexpr.type, s, span);
      result_type = apply(s, then_r.hexpr.type);
      else_hexpr = {
        kind: "block",
        stmts: [],
        tail: else_if_r.hexpr,
        type: else_if_r.hexpr.type,
        effects: else_if_r.effects,
        span: else_branch.span,
      };
    }
  } else {
    result_type = UNIT;
  }

  return {
    hexpr: {
      kind: "if_expr",
      condition: cond_r.hexpr,
      then_branch: then_r.hexpr as HBlock,
      else_branch: else_hexpr,
      type: result_type,
      effects,
      span,
    },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_string_interp
// ============================================================

export function infer_string_interp(ctx: InferCtx, parts: (string | Expr)[], span: Span, subst: Substitution): InferResult {
  let s = subst;
  let effects: EffectRow = EMPTY_ROW;
  const hparts: (string | HExpr)[] = [];

  for (const part of parts) {
    if (typeof part === "string") {
      hparts.push(part);
    } else {
      const r = ctx.infer_expr(part, s);
      s = r.subst;
      [effects, s] = merge_effects(ctx, effects, r.effects, s);
      hparts.push(r.hexpr);
    }
  }

  return {
    hexpr: { kind: "string_interp", parts: hparts, type: STR, effects, span },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_or
// ============================================================

export function infer_or(ctx: InferCtx, expr: Expr, default_value: Expr, span: Span, subst: Substitution): InferResult {
  const expr_r = ctx.infer_expr(expr, subst);
  let s = expr_r.subst;
  const expr_type = apply(s, expr_r.hexpr.type);

  if (expr_type.kind === "var") {
    type_error(ctx, E.E0301, `Cannot determine whether 'or' should unwrap Option or catch fail — the expression type is ambiguous. Add a type annotation to clarify.`, span, { kind: "other", detail: "ambiguous 'or' dispatch: expression type is unresolved" });
  }

  // Option path: expr is Option<T>, default is T
  if (is_option_type(expr_type)) {
    const inner = option_inner(expr_type);
    const default_r = ctx.infer_expr(default_value, s);
    s = default_r.subst;
    s = unify_at(ctx, inner, default_r.hexpr.type, s, span);
    const result_type = apply(s, inner);
    let effects: EffectRow;
    [effects, s] = merge_effects(ctx, expr_r.effects, default_r.effects, s);
    return {
      hexpr: { kind: "option_or", expr: expr_r.hexpr, default_value: default_r.hexpr, type: result_type, effects, span },
      subst: s,
      effects,
    };
  }

  // Fail path: existing behavior
  const default_r = ctx.infer_expr(default_value, s);
  s = default_r.subst;
  s = unify_at(ctx, expr_r.hexpr.type, default_r.hexpr.type, s, span);
  let effects: EffectRow;
  [effects, s] = merge_effects(ctx, expr_r.effects, default_r.effects, s);
  effects = remove_fail_effect(effects);
  const result_type = apply(s, expr_r.hexpr.type);
  return {
    hexpr: { kind: "try_catch", body: expr_r.hexpr, handler: default_r.hexpr, type: result_type, effects, span },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_catch
// ============================================================

export function infer_catch(ctx: InferCtx, expr: Expr, error_type_name: string | undefined, error_binding: string, handler: Expr, span: Span, subst: Substitution): InferResult {
  const expr_r = ctx.infer_expr(expr, subst);
  let s = expr_r.subst;

  ctx.env.push_scope();
  let error_var_type: Type;
  if (error_type_name) {
    error_var_type = resolve_named_type(ctx, error_type_name, [], span);
  } else {
    error_var_type = ctx.env.fresh_var();
  }
  ctx.env.bind_mono(error_binding, error_var_type);
  let handler_r!: InferResult;
  try {
    handler_r = ctx.infer_expr(handler, s);
    s = handler_r.subst;
  } finally {
    ctx.env.pop_scope();
  }

  s = unify_at(ctx, expr_r.hexpr.type, handler_r.hexpr.type, s, span);

  let effects: EffectRow;
  [effects, s] = merge_effects(ctx, expr_r.effects, handler_r.effects, s);
  if (error_type_name) {
    effects = remove_specific_fail_effect(effects, error_var_type, s);
  } else {
    effects = remove_fail_effect(effects);
  }

  const result_type = apply(s, expr_r.hexpr.type);

  return {
    hexpr: {
      kind: "try_catch",
      body: expr_r.hexpr,
      error_binding,
      error_type: error_type_name,
      handler: handler_r.hexpr,
      type: result_type,
      effects,
      span,
    },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_handle
// ============================================================

export function infer_handle(ctx: InferCtx, body: Expr, handlers: { effect_name: string; op_name: string; params: Param[]; resume_name?: string; body: Expr; span: Span }[], span: Span, subst: Substitution): InferResult {
  const body_r = ctx.infer_expr(body, subst);
  let s = body_r.subst;
  let effects = body_r.effects;

  const hhandlers: HEffectHandler[] = [];
  const handled_effects = new Set<string>();

  for (const handler of handlers) {
    ctx.env.push_scope();

    const effect_def = ctx.env.effects.get(handler.effect_name);
    const op_def = effect_def?.ops.find(o => o.name === handler.op_name);

    const hparams: HParam[] = [];
    for (let i = 0; i < handler.params.length; i++) {
      const p = handler.params[i];
      const pt = p.type_annotation
        ? resolve_type_expr(ctx, p.type_annotation)
        : (op_def && i < op_def.params.length ? op_def.params[i] : ctx.env.fresh_var());
      ctx.env.bind_mono(p.name, pt);
      hparams.push({ name: p.name, type: pt });
    }

    if (handler.resume_name) {
      const resume_param = op_def ? op_def.return_type : ctx.env.fresh_var();
      const resume_ret = ctx.env.fresh_var();
      ctx.env.bind_mono(handler.resume_name, {
        kind: "fn", params: [resume_param], return_type: resume_ret, effects: EMPTY_ROW,
      } as FnType);
    }

    let handler_body_r!: InferResult;
    try {
      handler_body_r = ctx.infer_expr(handler.body, s);
      s = handler_body_r.subst;
    } finally {
      ctx.env.pop_scope();
    }

    hhandlers.push({
      effect_name: handler.effect_name,
      op_name: handler.op_name,
      params: hparams,
      resume_name: handler.resume_name,
      body: handler_body_r.hexpr,
    });

    handled_effects.add(handler.effect_name);
  }

  const resolved_effects = apply_to_effect_row(s, effects);
  effects = {
    effects: resolved_effects.effects.filter(e => {
      if (e.kind === "io" && handled_effects.has("io")) return false;
      if (e.kind === "custom" && handled_effects.has(e.name)) return false;
      if (e.kind === "fail" && handled_effects.has("fail")) return false;
      if (e.kind === "mut" && handled_effects.has("mut")) return false;
      return true;
    }),
    tail: resolved_effects.tail,
  };

  return {
    hexpr: {
      kind: "handle_expr",
      body: body_r.hexpr,
      handlers: hhandlers,
      type: body_r.hexpr.type,
      effects,
      span,
    },
    subst: s,
    effects,
  };
}

// ============================================================
// infer_lambda
// ============================================================

export function infer_lambda(ctx: InferCtx, params: Param[], body: Expr, span: Span, subst: Substitution): InferResult {
  ctx.env.push_scope();

  const hparams: HParam[] = [];
  const param_types: Type[] = [];
  for (const p of params) {
    const pt = p.type_annotation ? resolve_type_expr(ctx, p.type_annotation) : ctx.env.fresh_var();
    ctx.env.bind_mono(p.name, pt);
    const lam_scheme = ctx.env.lookup(p.name)!;
    ctx.env.record_def_span(lam_scheme.def_id!, p.span);
    if (p.is_mutable) {
      ctx.env.mutable_vars.add(lam_scheme.def_id!);
    }
    hparams.push({ name: p.name, type: pt, def_id: lam_scheme.def_id, is_mutable: p.is_mutable });
    param_types.push(pt);
  }

  let body_r!: InferResult;
  try {
    body_r = ctx.infer_expr(body, subst);
  } finally {
    ctx.env.pop_scope();
  }
  const s = body_r.subst;

  const fn_type: FnType = {
    kind: "fn",
    params: param_types.map(t => apply(s, t)),
    return_type: apply(s, body_r.hexpr.type),
    effects: body_r.effects,
  };

  return {
    hexpr: {
      kind: "lambda",
      params: hparams.map(p => ({ name: p.name, type: apply(s, p.type) })),
      return_type: apply(s, body_r.hexpr.type),
      body: body_r.hexpr,
      type: fn_type,
      effects: EMPTY_ROW,
      span,
    },
    subst: s,
    effects: EMPTY_ROW,
  };
}

// ============================================================
// infer_list_literal
// ============================================================

export function infer_list_literal(ctx: InferCtx, elements: Expr[], span: Span, subst: Substitution): InferResult {
  if (elements.length === 0) {
    type_error(ctx,
      E.E0301,
      "Cannot infer element type of empty list literal; provide a type annotation",
      span,
      { kind: "other", detail: "Empty list literal requires context to determine element type" }
    );
  }
  let s = subst;
  const helements: HExpr[] = [];
  let elem_type: Type = ctx.env.fresh_var();
  let combined_effects: EffectRow = EMPTY_ROW;
  for (const el of elements) {
    const r = ctx.infer_expr(el, s);
    s = r.subst;
    s = unify_at(ctx, apply(s, r.hexpr.type), apply(s, elem_type), s, el.span);
    elem_type = apply(s, elem_type);
    helements.push(r.hexpr);
    [combined_effects, s] = merge_effects(ctx, combined_effects, r.effects, s);
  }
  const list_type: Type = { kind: "struct", name: BUILTIN_LIST, type_params: [apply(s, elem_type)], fields: [] };
  return {
    hexpr: {
      kind: "list_lit",
      elements: helements,
      type: list_type,
      effects: combined_effects,
      span,
    },
    subst: s,
    effects: combined_effects,
  };
}

// ============================================================
// infer_try_block
// ============================================================

export function infer_try_block(ctx: InferCtx, body: Expr, span: Span, subst: Substitution): InferResult {
  const body_r = ctx.infer_expr(body, subst);
  const result_type = make_option_type(body_r.hexpr.type);
  const effects = remove_fail_effect(body_r.effects);
  return {
    hexpr: { kind: "try_block", body: body_r.hexpr, type: result_type, effects, span },
    subst: body_r.subst,
    effects,
  };
}

// ============================================================
// infer_option_unwrap
// ============================================================

export function infer_option_unwrap(ctx: InferCtx, inner_expr: Expr, span: Span, subst: Substitution): InferResult {
  const inner_r = ctx.infer_expr(inner_expr, subst);
  let s = inner_r.subst;
  const inner_type = ctx.env.fresh_var();
  s = unify_at(ctx, inner_r.hexpr.type, make_option_type(inner_type), s, span);
  const unwrapped = apply(s, inner_type);
  const fail_eff: Effect = { kind: "fail", error_type: ctx.env.fresh_var() };
  let effects: EffectRow;
  [effects, s] = merge_effects(ctx, inner_r.effects, { effects: [fail_eff] }, s);
  return {
    hexpr: { kind: "option_unwrap", expr: inner_r.hexpr, type: unwrapped, effects, span },
    subst: s,
    effects,
  };
}
