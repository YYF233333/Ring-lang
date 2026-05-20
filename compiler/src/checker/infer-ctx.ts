// InferCtx interface + shared helper functions extracted from InferEngine.
// All helpers take `ctx: InferCtx` as first parameter instead of using `this`.

import type {
  Expr, Pattern, TypeExpr, Span,
} from "../ast/index.js";
import { assertNever, CompileError } from "../errors.js";
import type { DiagnosticSink, DiagnosticContext } from "../diagnostics/index.js";
import { make_diagnostic } from "../diagnostics/index.js";
import { E } from "../diagnostics/codes.js";
import {
  Type, FnType, TypeVar, EffectRow,
  INT, FLOAT, STR, BOOL, UNIT, NEVER,
  EMPTY_ROW, row_merge, type_to_string, types_equal,
  make_option_type,
} from "../types/index.js";
import type {
  HExpr, HStmt,
} from "../hir/index.js";
import {
  BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL,
  BUILTIN_OPTION,
} from "../hir/index.js";
import { TypeEnv, TypeScheme, substitute_type } from "./env.js";
import { Substitution, empty_subst, unify, UnificationError, apply, FreshIdGen } from "./unify.js";
import type { TuplePattern, TupleTypeExpr } from "../ast/index.js";
import { span_zero } from "../ast/index.js";
import { trait_dict_name, trait_bound_param_name } from "../hir/index.js";

// ============================================================
// InferResult — return type for expression inference
// ============================================================

export interface InferResult {
  hexpr: HExpr;
  subst: Substitution;
  effects: EffectRow;
}

// ============================================================
// Fn bounds entry type
// ============================================================

export type FnBoundsEntry = { type_param_var_id: number; trait_name: string; type_param_name: string };

// ============================================================
// InferCtx — the interface that InferEngine implements
// ============================================================

export interface InferCtx {
  env: TypeEnv;
  subst: Substitution;
  sink: DiagnosticSink;
  type_param_scope: Map<string, Type>;
  current_fn_return_type: Type | null;
  current_fn_bounds: FnBoundsEntry[];
  fn_bounds_stack: FnBoundsEntry[][];
  loop_depth: number;
  readonly fresh_id: FreshIdGen;

  // Recursive entry points (for expression sub-methods to call back)
  infer_expr(expr: Expr, subst: Substitution): InferResult;
  infer_block(block: import("../ast/index.js").BlockExpr, initial_subst?: Substitution): InferResult;
  infer_stmt(stmt: import("../ast/index.js").Stmt, subst: Substitution): { hstmt: HStmt; subst: Substitution; effects: EffectRow };
}

// ============================================================
// Error helpers
// ============================================================

export function type_error(ctx: InferCtx, code: string, message: string, span: Span, context: DiagnosticContext): never {
  const diag = make_diagnostic(code, "error", message, span, context);
  ctx.sink.report(diag);
  throw new CompileError([]);
}

// ============================================================
// Unification / effect helpers
// ============================================================

export function merge_effects(ctx: InferCtx, a: EffectRow, b: EffectRow, s: Substitution): [EffectRow, Substitution] {
  const m = row_merge(a, b);
  if (m.tails_to_unify) {
    s = unify({ kind: "var", id: m.tails_to_unify[0] } as TypeVar, { kind: "var", id: m.tails_to_unify[1] } as TypeVar, s, ctx.fresh_id);
  }
  return [m.row, s];
}

export function unify_at(ctx: InferCtx, t1: Type, t2: Type, s: Substitution, span: Span): Substitution {
  try {
    return unify(t1, t2, s, ctx.fresh_id);
  } catch (e) {
    if (e instanceof UnificationError) {
      const code = e.is_occurs_check ? E.E0302 : E.E0301;
      type_error(ctx, code, e.message, span, {
        kind: "type_mismatch",
        expected: type_to_string(apply(s, t1)),
        actual: type_to_string(apply(s, t2)),
      });
    }
    throw e;
  }
}

// ============================================================
// Free type variable collection
// ============================================================

export function free_type_vars(t: Type, subst: Substitution): Set<number> {
  const resolved = apply(subst, t);
  const result = new Set<number>();
  collect_free_vars(resolved, result);
  return result;
}

export function collect_free_vars(t: Type, result: Set<number>): void {
  switch (t.kind) {
    case "var": result.add(t.id); break;
    case "fn":
      for (const p of t.params) collect_free_vars(p, result);
      collect_free_vars(t.return_type, result);
      if (t.effects.tail !== undefined) result.add(t.effects.tail);
      for (const e of t.effects.effects) {
        if (e.kind === "fail") collect_free_vars(e.error_type, result);
        if (e.kind === "custom") for (const a of e.type_args) collect_free_vars(a, result);
      }
      break;
    case "struct":
      for (const tp of t.type_params) collect_free_vars(tp, result);
      break;
    case "enum":
      for (const tp of t.type_params) collect_free_vars(tp, result);
      break;
    case "generic":
      collect_free_vars(t.base, result);
      for (const a of t.args) collect_free_vars(a, result);
      break;
    case "record":
      for (const f of t.fields) collect_free_vars(f.type, result);
      if (t.tail !== undefined) result.add(t.tail);
      break;
    case "tuple":
      for (const e of t.elements) collect_free_vars(e, result);
      break;
    case "effect_row":
      if (t.tail !== undefined) result.add(t.tail);
      for (const e of t.effects) {
        if (e.kind === "fail") collect_free_vars(e.error_type, result);
        if (e.kind === "custom") for (const a of e.type_args) collect_free_vars(a, result);
      }
      break;
  }
}

export function free_type_vars_in_env(ctx: InferCtx, subst: Substitution): Set<number> {
  const result = new Set<number>();
  for (const scope of ctx.env.scopes) {
    for (const [, scheme] of scope.variables) {
      const ftv = free_type_vars(scheme.type, subst);
      const quantified = new Set<number>();
      for (const v of scheme.type_vars) {
        const resolved = apply(subst, { kind: "var", id: v } as Type);
        quantified.add(resolved.kind === "var" ? resolved.id : v);
      }
      for (const v of ftv) {
        if (!quantified.has(v)) result.add(v);
      }
    }
  }
  return result;
}

// ============================================================
// Generalization
// ============================================================

export function generalize(ctx: InferCtx, t: Type, subst: Substitution): TypeScheme {
  const resolved = apply(subst, t);
  const ftv_type = free_type_vars(resolved, empty_subst());
  const ftv_env = free_type_vars_in_env(ctx, subst);
  const type_vars: number[] = [];
  for (const v of ftv_type) {
    if (!ftv_env.has(v)) type_vars.push(v);
  }
  const bounds: { type_var: number; trait_name: string }[] = [];
  for (const tv of type_vars) {
    const traits = ctx.env.var_bounds.get(tv);
    if (traits) {
      for (const trait_name of traits) {
        bounds.push({ type_var: tv, trait_name });
      }
    }
  }
  return { type: resolved, type_vars, bounds };
}

// ============================================================
// Fn effects update
// ============================================================

export function update_fn_effects(ctx: InferCtx, name: string, effects: EffectRow): void {
  const scheme = ctx.env.lookup(name);
  if (scheme && scheme.type.kind === "fn") {
    const new_type = { ...scheme.type, effects } as FnType;
    ctx.env.rebind(name, { ...scheme, type: new_type });
  }
}

// ============================================================
// Scheme var map + dict resolution
// ============================================================

export function build_scheme_var_map(scheme: TypeScheme, instantiated_type: Type): Map<number, Type> {
  const result = new Map<number, Type>();
  if (scheme.type.kind !== "fn" || instantiated_type.kind !== "fn") return result;
  const scheme_fn = scheme.type as FnType;
  const inst_fn = instantiated_type as FnType;
  for (let i = 0; i < scheme_fn.params.length && i < inst_fn.params.length; i++) {
    const orig = scheme_fn.params[i];
    if (orig.kind === "var" && scheme.type_vars.includes(orig.id)) {
      result.set(orig.id, inst_fn.params[i]);
    }
  }
  if (scheme_fn.return_type.kind === "var" && scheme.type_vars.includes(scheme_fn.return_type.id)) {
    result.set(scheme_fn.return_type.id, inst_fn.return_type);
  }
  return result;
}

export function resolve_dicts_from_scheme(
  ctx: InferCtx, scheme: TypeScheme, callee_type: Type, s: Substitution, span: Span
): string[] {
  if (scheme.bounds.length === 0) return [];
  const var_map = build_scheme_var_map(scheme, callee_type);
  const resolved_dicts: string[] = [];
  for (const bound of scheme.bounds) {
    let found = false;
    const fresh_var = var_map.get(bound.type_var);
    if (fresh_var) {
      const concrete = apply(s, fresh_var);
      if ((concrete.kind === "struct" || concrete.kind === "enum") &&
          ctx.env.trait_impls.some(
            impl => impl.target_type_name === concrete.name && impl.trait_name === bound.trait_name
          )) {
        resolved_dicts.push(trait_dict_name(concrete.name, bound.trait_name));
        found = true;
      } else if (concrete.kind === "var") {
        const matching_bound = ctx.current_fn_bounds.find(
          fb => fb.type_param_var_id === concrete.id && fb.trait_name === bound.trait_name
        );
        if (matching_bound) {
          resolved_dicts.push(trait_bound_param_name(matching_bound.type_param_name, matching_bound.trait_name));
          found = true;
        }
      }
    }
    if (!found) {
      type_error(ctx, E.E0503, `Type does not satisfy trait bound '${bound.trait_name}'`, span, { kind: "trait_error", detail: `type does not satisfy '${bound.trait_name}'` });
    }
  }
  return resolved_dicts;
}

// ============================================================
// Type expression resolution
// ============================================================

export function resolve_type_expr(ctx: InferCtx, texpr: TypeExpr): Type {
  switch (texpr.kind) {
    case "named":
      return resolve_named_type(ctx, texpr.name, texpr.type_args, texpr.span);
    case "fn_type": {
      const params = texpr.params.map(p => resolve_type_expr(ctx, p));
      const ret = resolve_type_expr(ctx, texpr.return_type);
      return { kind: "fn", params, return_type: ret, effects: EMPTY_ROW };
    }
    case "option": {
      const inner = resolve_type_expr(ctx, texpr.inner);
      return make_option_type(inner);
    }
    case "record_type": {
      const fields = texpr.fields.map(f => ({
        name: f.name,
        type: resolve_type_expr(ctx, f.type),
      }));
      const tail_var = texpr.rest ? ctx.env.fresh_var() : undefined;
      const tail = tail_var?.id;
      if (texpr.rest && tail_var) {
        ctx.type_param_scope.set(texpr.rest, tail_var);
      }
      return { kind: "record", fields, tail, tail_name: texpr.rest } as Type;
    }
    case "tuple_type":
      return { kind: "tuple", elements: (texpr as TupleTypeExpr).elements.map(e => resolve_type_expr(ctx, e)) };
    default:
      return assertNever(texpr, "resolve_type_expr");
  }
}

export function resolve_self_type(ctx: InferCtx, name: string): Type {
  return resolve_named_type(ctx, name, [], span_zero());
}

export function resolve_named_type(ctx: InferCtx, name: string, type_args: TypeExpr[], span: Span): Type {
  switch (name) {
    case BUILTIN_INT: return INT;
    case BUILTIN_FLOAT: return FLOAT;
    case BUILTIN_STR: return STR;
    case BUILTIN_BOOL: return BOOL;
    case "Never": return NEVER;
    case "Unit": return UNIT;
    default: {
      // Check if it's a type parameter in scope
      const tp = ctx.type_param_scope.get(name);
      if (tp) return tp;

      // Option<T> resolves to EnumType "Option"
      if (name === BUILTIN_OPTION && type_args.length === 1) {
        return make_option_type(resolve_type_expr(ctx, type_args[0]));
      }

      // Check if it's a known struct
      if (ctx.env.structs.has(name)) {
        const def = ctx.env.structs.get(name)!;
        if (type_args.length > 0 && type_args.length !== def.type_params.length) {
          type_error(ctx, E.E0301, `Type '${name}' expects ${def.type_params.length} type argument(s), got ${type_args.length}`, span, { kind: "type_mismatch", expected: `${def.type_params.length} type args`, actual: `${type_args.length} type args` });
        }
        const resolved_params = type_args.length > 0
          ? type_args.map(a => resolve_type_expr(ctx, a))
          : def.type_params.map(() => ctx.env.fresh_var());
        return {
          kind: "struct",
          name,
          type_params: resolved_params,
          fields: def.fields.map(f => ({ name: f.name, type: f.type, is_pub: f.is_pub })),
        };
      }
      // Check if it's a known enum
      if (ctx.env.enums.has(name)) {
        const def = ctx.env.enums.get(name)!;
        if (type_args.length > 0 && type_args.length !== def.type_params.length) {
          type_error(ctx, E.E0301, `Type '${name}' expects ${def.type_params.length} type argument(s), got ${type_args.length}`, span, { kind: "type_mismatch", expected: `${def.type_params.length} type args`, actual: `${type_args.length} type args` });
        }
        const resolved_params = type_args.length > 0
          ? type_args.map(a => resolve_type_expr(ctx, a))
          : def.type_params.map(() => ctx.env.fresh_var());
        return {
          kind: "enum",
          name,
          type_params: resolved_params,
          variants: def.variants,
        };
      }
      // Check if it's a type alias
      const alias = ctx.env.type_aliases.get(name);
      if (alias) {
        if (type_args.length > 0 && type_args.length !== alias.type_params.length) {
          type_error(ctx, E.E0301, `Type '${name}' expects ${alias.type_params.length} type argument(s), got ${type_args.length}`, span, { kind: "type_mismatch", expected: `${alias.type_params.length} type args`, actual: `${type_args.length} type args` });
        }
        if (alias.type_param_vars.length === 0) return alias.type;
        const resolved_args = type_args.map(a => resolve_type_expr(ctx, a));
        const mapping = new Map<number, Type>();
        for (let i = 0; i < alias.type_param_vars.length && i < resolved_args.length; i++) {
          mapping.set(alias.type_param_vars[i], resolved_args[i]);
        }
        return substitute_type(alias.type, mapping);
      }
      type_error(ctx, E.E0204, `Unknown type: ${name}`, span, { kind: "other", detail: `unknown type '${name}'` });
    }
  }
}

// ============================================================
// Pattern binding
// ============================================================

export function bind_pattern(ctx: InferCtx, pattern: Pattern, expected_type: Type, subst: Substitution): void {
  switch (pattern.kind) {
    case "wildcard":
      break;
    case "binding":
      ctx.env.bind_mono(pattern.name, apply(subst, expected_type));
      ctx.env.record_def_span(ctx.env.lookup(pattern.name)!.def_id!, pattern.span);
      break;
    case "constructor": {
      // Validate qualifier if present
      if (pattern.qualifier) {
        const actual_enum = ctx.env.variant_to_enum.get(pattern.name);
        if (actual_enum && actual_enum !== pattern.qualifier) {
          type_error(ctx, E.E0301, `Variant '${pattern.name}' belongs to enum '${actual_enum}', not '${pattern.qualifier}'`, pattern.span, { kind: "type_mismatch", expected: actual_enum, actual: pattern.qualifier });
        } else if (!actual_enum) {
          type_error(ctx, E.E0201, `'${pattern.qualifier}' has no variant '${pattern.name}'`, pattern.span, { kind: "undefined_variable", name: pattern.name });
        }
      }
      const enum_name = ctx.env.variant_to_enum.get(pattern.name);
      if (enum_name) {
        const enum_def = ctx.env.enums.get(enum_name);
        if (enum_def) {
          const variant = enum_def.variants.find(v => v.name === pattern.name);
          if (variant) {
            const resolved_expected = apply(subst, expected_type);
            // Verify pattern's enum matches scrutinee type
            if (resolved_expected.kind === "enum" && resolved_expected.name !== enum_name) {
              type_error(ctx, "E0301",
                `variant '${pattern.name}' belongs to enum '${enum_name}', not '${resolved_expected.name}'`,
                pattern.span, { kind: "type_mismatch", expected: resolved_expected.name, actual: enum_name });
            }
            // Defensive: if scrutinee is a concrete non-enum type, report error
            if (resolved_expected.kind !== "enum" && resolved_expected.kind !== "var") {
              type_error(ctx, "E0301",
                `cannot destructure type '${type_to_string(resolved_expected)}' with constructor pattern '${pattern.name}'`,
                pattern.span, { kind: "pattern_error", detail: "constructor pattern on non-enum type" });
            }
            const instantiation_map = new Map<number, Type>();
            if (resolved_expected.kind === "enum") {
              for (let i = 0; i < enum_def.type_param_vars.length; i++) {
                if (i < resolved_expected.type_params.length) {
                  instantiation_map.set(enum_def.type_param_vars[i], resolved_expected.type_params[i]);
                }
              }
            }
            for (let i = 0; i < pattern.fields.length && i < variant.fields.length; i++) {
              const field_type = instantiation_map.size > 0
                ? substitute_type(variant.fields[i], instantiation_map)
                : variant.fields[i];
              bind_pattern(ctx, pattern.fields[i], field_type, subst);
            }
          }
        }
      }
      break;
    }
    case "literal":
      break;
    case "named_constructor": {
      // Validate qualifier if present
      if (pattern.qualifier) {
        const actual_enum = ctx.env.variant_to_enum.get(pattern.name);
        if (actual_enum && actual_enum !== pattern.qualifier) {
          type_error(ctx, E.E0301, `Variant '${pattern.name}' belongs to enum '${actual_enum}', not '${pattern.qualifier}'`, pattern.span, { kind: "type_mismatch", expected: actual_enum, actual: pattern.qualifier });
        } else if (!actual_enum) {
          type_error(ctx, E.E0201, `'${pattern.qualifier}' has no variant '${pattern.name}'`, pattern.span, { kind: "undefined_variable", name: pattern.name });
        }
      }
      const enum_name = ctx.env.variant_to_enum.get(pattern.name);
      if (enum_name) {
        const enum_def = ctx.env.enums.get(enum_name);
        if (enum_def) {
          const variant = enum_def.variants.find(v => v.name === pattern.name);
          if (variant && variant.field_names) {
            const resolved_expected = apply(subst, expected_type);
            if (resolved_expected.kind === "enum" && resolved_expected.name !== enum_name) {
              type_error(ctx, "E0301",
                `variant '${pattern.name}' belongs to enum '${enum_name}', not '${resolved_expected.name}'`,
                pattern.span, { kind: "type_mismatch", expected: resolved_expected.name, actual: enum_name });
            }
            const instantiation_map = new Map<number, Type>();
            if (resolved_expected.kind === "enum") {
              for (let i = 0; i < enum_def.type_param_vars.length; i++) {
                if (i < resolved_expected.type_params.length) {
                  instantiation_map.set(enum_def.type_param_vars[i], resolved_expected.type_params[i]);
                }
              }
            }
            for (const field of pattern.fields) {
              const field_idx = variant.field_names.indexOf(field.name);
              if (field_idx >= 0 && field_idx < variant.fields.length) {
                const field_type = instantiation_map.size > 0
                  ? substitute_type(variant.fields[field_idx], instantiation_map)
                  : variant.fields[field_idx];
                bind_pattern(ctx, field.pattern, field_type, subst);
              } else {
                type_error(ctx, "E0301",
                  `variant '${pattern.name}' has no field '${field.name}'`,
                  field.span, { kind: "other", detail: `unknown field '${field.name}'` });
              }
            }
          }
        }
      }
      break;
    }
    case "tuple": {
      const tp = pattern as TuplePattern;
      const resolved = apply(subst, expected_type);
      if (resolved.kind !== "tuple") {
        type_error(ctx, E.E0301, `Tuple pattern requires tuple type, got ${type_to_string(resolved)}`, pattern.span, { kind: "type_mismatch", expected: "tuple", actual: type_to_string(resolved) });
        break;
      }
      if (tp.elements.length !== resolved.elements.length) {
        type_error(ctx, E.E0301,
          `Tuple pattern has ${tp.elements.length} elements but type has ${resolved.elements.length}`,
          pattern.span,
          { kind: "other", detail: "tuple arity mismatch" });
        break;
      }
      for (let i = 0; i < tp.elements.length; i++) {
        bind_pattern(ctx, tp.elements[i], resolved.elements[i], subst);
      }
      break;
    }
  }
}

// ============================================================
// Effect removal helpers
// ============================================================

export function remove_fail_effect(row: EffectRow): EffectRow {
  return {
    effects: row.effects.filter(e => e.kind !== "fail"),
    tail: row.tail,
  };
}

export function remove_specific_fail_effect(row: EffectRow, target: Type, subst: Substitution): EffectRow {
  const resolved_target = apply(subst, target);
  return {
    effects: row.effects.filter(e =>
      !(e.kind === "fail" && types_equal(apply(subst, e.error_type), resolved_target))
    ),
    tail: row.tail,
  };
}
