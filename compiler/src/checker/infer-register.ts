// Pass 1: Register all top-level declarations into the type environment.
// Extracted from InferEngine — all functions take `ctx: InferCtx` as first parameter.

import type {
  Decl, FnDecl, StructDecl, EnumDecl, ImplDecl, EffectDecl, TraitDecl, ExternFnDecl, ExternTypeDecl, TypeAliasDecl,
} from "../ast/index.js";
import { assertNever } from "../errors.js";
import { E } from "../diagnostics/codes.js";
import type {
  Type, FnType, TypeVar,
} from "../types/index.js";
import {
  EMPTY_ROW,
} from "../types/index.js";
import type { TraitMethodDef } from "./env.js";
import type { StructDef, EnumDef, EffectDef } from "./env.js";
import type { InferCtx } from "./infer-ctx.js";
import { type_error, resolve_type_expr, resolve_self_type } from "./infer-ctx.js";

// ============================================================
// register_decl + register_decl_public
// ============================================================

export function register_decl_public(ctx: InferCtx, decl: Decl): void {
  register_decl(ctx, decl);
}

export function register_decl(ctx: InferCtx, decl: Decl): void {
  switch (decl.kind) {
    case "struct_decl":
      register_struct(ctx, decl);
      break;
    case "enum_decl":
      register_enum(ctx, decl);
      break;
    case "effect_decl":
      register_effect(ctx, decl);
      break;
    case "impl_decl":
      register_impl(ctx, decl);
      break;
    case "fn_decl":
      register_fn(ctx, decl);
      break;
    case "test_decl":
      break;
    case "trait_decl":
      register_trait(ctx, decl);
      break;
    case "extern_fn_decl":
      register_extern_fn(ctx, decl);
      break;
    case "extern_type_decl":
      register_extern_type(ctx, decl);
      break;
    case "type_alias_decl":
      register_type_alias(ctx, decl);
      break;
    default:
      assertNever(decl, "register_decl");
  }
}

// ============================================================
// Individual registration functions
// ============================================================

function register_struct(ctx: InferCtx, decl: StructDecl): void {
  const type_param_names = decl.type_params.map(tp => tp.name);

  const saved_tp_scope = new Map(ctx.type_param_scope);
  const type_param_vars: number[] = [];
  for (const tp of decl.type_params) {
    const tv = ctx.env.fresh_var();
    type_param_vars.push(tv.id);
    ctx.type_param_scope.set(tp.name, tv);
  }

  // Pre-register with empty fields so recursive references (e.g. struct Node { children: List<Node> }) resolve.
  const fields: { name: string; type: Type; is_pub: boolean }[] = [];
  const def: StructDef = {
    name: decl.name,
    type_params: type_param_names,
    type_param_vars,
    fields,
  };
  ctx.env.structs.set(decl.name, def);

  for (const f of decl.fields) {
    fields.push({
      name: f.name,
      type: resolve_type_expr(ctx, f.type_annotation),
      is_pub: f.is_pub,
    });
  }

  ctx.type_param_scope = saved_tp_scope;
}

function register_enum(ctx: InferCtx, decl: EnumDecl): void {
  const type_param_names = decl.type_params.map(tp => tp.name);

  const saved_tp_scope = new Map(ctx.type_param_scope);
  const type_var_ids: number[] = [];
  const type_var_types: Type[] = [];
  for (const tp of decl.type_params) {
    const tv = ctx.env.fresh_var();
    type_var_ids.push(tv.id);
    type_var_types.push(tv);
    ctx.type_param_scope.set(tp.name, tv);
  }

  // Pre-register with empty variants so recursive references (e.g. enum Expr { BinOp { left: Expr } }) resolve.
  // The variants array is shared by reference — pushes below are visible to all EnumType objects.
  const variants: { name: string; fields: Type[]; field_names?: string[] }[] = [];
  const def: EnumDef = {
    name: decl.name,
    type_params: type_param_names,
    type_param_vars: type_var_ids,
    variants,
  };
  ctx.env.enums.set(decl.name, def);

  for (const v of decl.variants) {
    if (v.named_fields && v.named_fields.length > 0) {
      variants.push({
        name: v.name,
        fields: v.named_fields.map(f => resolve_type_expr(ctx, f.type_expr)),
        field_names: v.named_fields.map(f => f.name),
      });
    } else {
      variants.push({
        name: v.name,
        fields: v.fields.map(f => resolve_type_expr(ctx, f)),
      });
    }
  }

  // Register variant constructors as functions
  const enum_type: Type = {
    kind: "enum",
    name: decl.name,
    type_params: type_var_types,
    variants: variants,
  };

  for (const variant of variants) {
    ctx.env.variant_to_enum.set(variant.name, decl.name);
    if (variant.field_names) {
      // Named-field variants use struct-literal construction syntax, not function constructors
      if (type_var_ids.length > 0) {
        ctx.env.bind(variant.name, { type: enum_type, type_vars: type_var_ids, bounds: [] });
      } else {
        ctx.env.bind_mono(variant.name, enum_type);
      }
    } else if (variant.fields.length === 0) {
      if (type_var_ids.length > 0) {
        ctx.env.bind(variant.name, { type: enum_type, type_vars: type_var_ids, bounds: [] });
      } else {
        ctx.env.bind_mono(variant.name, enum_type);
      }
    } else {
      const fn_type: FnType = {
        kind: "fn",
        params: variant.fields,
        return_type: enum_type,
        effects: EMPTY_ROW,
      };
      if (type_var_ids.length > 0) {
        ctx.env.bind(variant.name, { type: fn_type, type_vars: type_var_ids, bounds: [] });
      } else {
        ctx.env.bind_mono(variant.name, fn_type);
      }
    }
  }

  ctx.type_param_scope = saved_tp_scope;
}

function register_effect(ctx: InferCtx, decl: EffectDecl): void {
  const type_param_names = decl.type_params.map(tp => tp.name);
  const ops = decl.ops.map(op => ({
    name: op.name,
    params: op.params.map(p => p.type_annotation ? resolve_type_expr(ctx, p.type_annotation) : ctx.env.fresh_var()),
    return_type: resolve_type_expr(ctx, op.return_type),
  }));
  const def: EffectDef = {
    name: decl.name,
    type_params: type_param_names,
    ops,
  };
  ctx.env.effects.set(decl.name, def);
}

function register_trait(ctx: InferCtx, decl: TraitDecl): void {
  const saved_tp_scope = new Map(ctx.type_param_scope);
  const type_param_names = decl.type_params.map(tp => tp.name);
  const type_param_vars: number[] = [];
  for (const tp of decl.type_params) {
    const tv = ctx.env.fresh_var();
    type_param_vars.push(tv.id);
    ctx.type_param_scope.set(tp.name, tv);
  }

  const self_var = ctx.env.fresh_var();
  const methods: TraitMethodDef[] = [];
  for (const method of decl.methods) {
    const param_types = method.params.map(p => {
      if (p.name === "self") return self_var;
      return p.type_annotation ? resolve_type_expr(ctx, p.type_annotation) : ctx.env.fresh_var();
    });
    const ret_type = method.return_type ? resolve_type_expr(ctx, method.return_type) : ctx.env.fresh_var();
    const fn_type: FnType = {
      kind: "fn", params: param_types, return_type: ret_type, effects: EMPTY_ROW,
    };
    methods.push({ name: method.name, type: fn_type, has_default: !method.is_abstract });
  }

  ctx.type_param_scope = saved_tp_scope;
  ctx.env.traits.set(decl.name, { name: decl.name, type_params: type_param_names, type_param_vars, methods });
}

function register_impl(ctx: InferCtx, decl: ImplDecl): void {
  let impl_methods_map = ctx.env.impl_methods.get(decl.target_type);
  if (!impl_methods_map) {
    impl_methods_map = new Map();
    ctx.env.impl_methods.set(decl.target_type, impl_methods_map);
  }

  const saved_tp_scope = new Map(ctx.type_param_scope);
  const impl_type_vars: number[] = [];
  for (const tp of decl.type_params) {
    const tv = ctx.env.fresh_var();
    impl_type_vars.push((tv as TypeVar).id);
    ctx.type_param_scope.set(tp.name, tv);
  }

  for (const method of decl.methods) {
    const saved_method_tp_scope = new Map(ctx.type_param_scope);
    const method_type_vars: number[] = [];

    for (const tp of method.type_params) {
      const tv = ctx.env.fresh_var();
      method_type_vars.push((tv as TypeVar).id);
      ctx.type_param_scope.set(tp.name, tv);
    }

    const self_type = resolve_self_type(ctx, decl.target_type);
    const param_types = method.params.map(p =>
      p.type_annotation ? resolve_type_expr(ctx, p.type_annotation)
        : p.name === "self" ? self_type
        : ctx.env.fresh_var()
    );
    const ret_type = method.return_type ? resolve_type_expr(ctx, method.return_type) : ctx.env.fresh_var();

    const all_type_vars = [...impl_type_vars, ...method_type_vars];
    const declared_tp_names = new Set([
      ...decl.type_params.map(tp => tp.name),
      ...method.type_params.map(tp => tp.name),
    ]);
    for (const [name, tv] of ctx.type_param_scope) {
      if (!saved_tp_scope.has(name) && !declared_tp_names.has(name) && tv.kind === "var") {
        if (!all_type_vars.includes(tv.id)) {
          all_type_vars.push(tv.id);
        }
      }
    }

    const fn_type: FnType = {
      kind: "fn",
      params: param_types,
      return_type: ret_type,
      effects: EMPTY_ROW,
    };
    impl_methods_map.set(method.name, { type: fn_type, type_vars: all_type_vars, bounds: [] });

    ctx.type_param_scope = saved_method_tp_scope;
  }

  if (decl.trait_name) {
    const trait_def = ctx.env.traits.get(decl.trait_name);
    if (!trait_def) {
      type_error(ctx, E.E0501, `Unknown trait: ${decl.trait_name}`, decl.span, { kind: "trait_error", detail: `unknown trait '${decl.trait_name}'` });
    }
    const impl_method_names = new Set(decl.methods.map(m => m.name));
    for (const tm of trait_def.methods) {
      if (!tm.has_default && !impl_method_names.has(tm.name)) {
        type_error(ctx, E.E0502, `Missing method '${tm.name}' in impl ${decl.trait_name} for ${decl.target_type}`, decl.span, { kind: "trait_error", detail: `missing method '${tm.name}'` });
      }
    }
    ctx.env.trait_impls.push({
      trait_name: decl.trait_name,
      target_type_name: decl.target_type,
      type_params: decl.type_params.map(tp => tp.name),
      method_names: decl.methods.map(m => m.name),
    });
  }

  ctx.type_param_scope = saved_tp_scope;
}

function register_fn(ctx: InferCtx, decl: FnDecl): void {
  const type_vars: number[] = [];
  const saved_tp_scope = new Map(ctx.type_param_scope);
  for (const tp of decl.type_params) {
    const tv = ctx.env.fresh_var();
    type_vars.push((tv as TypeVar).id);
    ctx.type_param_scope.set(tp.name, tv);
  }

  const param_types = decl.params.map(p =>
    p.type_annotation ? resolve_type_expr(ctx, p.type_annotation) : ctx.env.fresh_var()
  );
  const ret_type = decl.return_type ? resolve_type_expr(ctx, decl.return_type) : ctx.env.fresh_var();

  // Collect row variables introduced by record type annotations (..rest)
  const declared_tp_names = new Set(decl.type_params.map(tp => tp.name));
  for (const [name, tv] of ctx.type_param_scope) {
    if (!saved_tp_scope.has(name) && !declared_tp_names.has(name) && tv.kind === "var") {
      type_vars.push(tv.id);
    }
  }

  const fn_type: FnType = {
    kind: "fn",
    params: param_types,
    return_type: ret_type,
    effects: EMPTY_ROW,
  };

  const fn_bounds_list: { type_param: string; trait_name: string }[] = [];
  const scheme_bounds: { type_var: number; trait_name: string }[] = [];
  for (const tp of decl.type_params) {
    const tv = ctx.type_param_scope.get(tp.name);
    for (const b of tp.bounds) {
      if (!ctx.env.traits.has(b.trait_name)) {
        type_error(ctx, E.E0501, `Unknown trait: ${b.trait_name}`, tp.span, { kind: "trait_error", detail: `unknown trait '${b.trait_name}'` });
      }
      fn_bounds_list.push({ type_param: tp.name, trait_name: b.trait_name });
      if (tv && tv.kind === "var") {
        scheme_bounds.push({ type_var: tv.id, trait_name: b.trait_name });
      }
    }
  }
  if (fn_bounds_list.length > 0) {
    ctx.env.fn_bounds.set(decl.name, fn_bounds_list);
  }

  ctx.type_param_scope = saved_tp_scope;

  if (type_vars.length > 0) {
    ctx.env.bind(decl.name, { type: fn_type, type_vars, bounds: scheme_bounds });
  } else {
    ctx.env.bind_mono(decl.name, fn_type);
  }
  ctx.env.record_def_span(ctx.env.lookup(decl.name)!.def_id!, decl.span);
}

function register_extern_fn(ctx: InferCtx, decl: ExternFnDecl): void {
  const type_vars: number[] = [];
  const saved_tp_scope = new Map(ctx.type_param_scope);
  for (const tp of decl.type_params) {
    const tv = ctx.env.fresh_var();
    type_vars.push((tv as TypeVar).id);
    ctx.type_param_scope.set(tp.name, tv);
  }

  const param_types = decl.params.map(p =>
    p.type_annotation ? resolve_type_expr(ctx, p.type_annotation) : ctx.env.fresh_var()
  );
  const ret_type = decl.return_type ? resolve_type_expr(ctx, decl.return_type) : ctx.env.fresh_var();

  const declared_tp_names = new Set(decl.type_params.map(tp => tp.name));
  for (const [name, tv] of ctx.type_param_scope) {
    if (!saved_tp_scope.has(name) && !declared_tp_names.has(name) && tv.kind === "var") {
      type_vars.push(tv.id);
    }
  }

  const fn_type: FnType = {
    kind: "fn",
    params: param_types,
    return_type: ret_type,
    effects: EMPTY_ROW,
  };

  const scheme_bounds: { type_var: number; trait_name: string }[] = [];
  for (const tp of decl.type_params) {
    const tv = ctx.type_param_scope.get(tp.name);
    for (const b of tp.bounds) {
      if (!ctx.env.traits.has(b.trait_name)) {
        type_error(ctx, E.E0501, `Unknown trait: ${b.trait_name}`, tp.span, { kind: "trait_error", detail: `unknown trait '${b.trait_name}'` });
      }
      if (tv && tv.kind === "var") {
        scheme_bounds.push({ type_var: tv.id, trait_name: b.trait_name });
      }
    }
  }

  ctx.type_param_scope = saved_tp_scope;

  if (type_vars.length > 0) {
    ctx.env.bind(decl.name, { type: fn_type, type_vars, bounds: scheme_bounds });
  } else {
    ctx.env.bind_mono(decl.name, fn_type);
  }
  ctx.env.record_def_span(ctx.env.lookup(decl.name)!.def_id!, decl.span);
}

function register_extern_type(ctx: InferCtx, decl: ExternTypeDecl): void {
  const type_param_names = decl.type_params.map(tp => tp.name);
  const saved_tp_scope = new Map(ctx.type_param_scope);
  const type_param_vars: number[] = [];
  for (const tp of decl.type_params) {
    const tv = ctx.env.fresh_var();
    type_param_vars.push(tv.id);
    ctx.type_param_scope.set(tp.name, tv);
  }
  ctx.type_param_scope = saved_tp_scope;

  const def: StructDef = {
    name: decl.name,
    type_params: type_param_names,
    type_param_vars,
    fields: [],
  };
  ctx.env.structs.set(decl.name, def);
}

function register_type_alias(ctx: InferCtx, decl: TypeAliasDecl): void {
  const saved_tp_scope = new Map(ctx.type_param_scope);
  const type_param_vars: number[] = [];
  for (const tp of decl.type_params) {
    const tv = ctx.env.fresh_var();
    type_param_vars.push(tv.id);
    ctx.type_param_scope.set(tp.name, tv);
  }
  const resolved = resolve_type_expr(ctx, decl.type_expr);
  ctx.type_param_scope = saved_tp_scope;
  ctx.env.type_aliases.set(decl.name, {
    type_params: decl.type_params.map(tp => tp.name),
    type_param_vars,
    type: resolved,
  });
}
