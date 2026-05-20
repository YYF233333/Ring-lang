// Built-in type and method registrations for Ring-lang.
// Core builtins (Option, Cell, effects) are registered by register_builtins().
// HOF methods (needing effect polymorphism) are registered by register_hof_intrinsics()
// AFTER stdlib prelude loading provides the type declarations.
import {
  Type, TypeVar, FnType, StructType, EffectRow,
  EMPTY_ROW, INT, STR, BOOL, UNIT, NEVER,
  make_option_type, make_map_type,
} from "../types/index.js";
import {
  BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION, BUILTIN_CELL,
} from "../hir/index.js";
import { TypeEnv, TypeScheme } from "./env.js";

type Methods = Map<string, TypeScheme>;

function open_row(env: TypeEnv): { eff: EffectRow; tail_id: number } {
  const tail_id = env.fresh_var_id();
  return { eff: { effects: [], tail: tail_id }, tail_id };
}

// ================================================================
// register_builtins — core types that can't be expressed in Ring
// ================================================================

export function register_builtins(env: TypeEnv): void {
  register_effects(env);
  register_cell(env);
  register_option(env);
  register_eq_trait(env);
  register_option_eq(env);
  register_clone_trait(env);
  register_option_clone(env);
  register_ord_trait(env);
  register_debug_trait(env);
  register_option_debug(env);
}

// ================================================================
// register_hof_intrinsics — HOF methods needing effect polymorphism
// Called AFTER prelude loading so type declarations exist.
// ================================================================

export function register_hof_intrinsics(env: TypeEnv): void {
  register_list_hof(env);
  register_map_hof(env);
  register_set_hof(env);
  register_option_hof(env);
}

// ================================================================
// Effects: io, fail
// ================================================================

function register_effects(env: TypeEnv): void {
  env.effects.set("io", {
    name: "io", type_params: [],
    ops: [
      { name: "read", params: [STR], return_type: STR },
      { name: "write", params: [STR, STR], return_type: UNIT },
    ],
    built_in_kind: "io",
  });

  const fail_t = env.fresh_var();
  env.effects.set("fail", {
    name: "fail", type_params: ["E"],
    ops: [{ name: "raise", params: [fail_t], return_type: NEVER }],
    built_in_kind: "fail",
  });
}

// ================================================================
// Cell<T>
// ================================================================

function register_cell(env: TypeEnv): void {
  const cell_t = env.fresh_var();
  env.structs.set(BUILTIN_CELL, {
    name: BUILTIN_CELL, type_params: ["T"], type_param_vars: [cell_t.id],
    fields: [{ name: "value", type: cell_t, is_pub: true }],
  });

  const ctor_t = env.fresh_var();
  const ctor_ret: Type = {
    kind: "struct", name: BUILTIN_CELL, type_params: [ctor_t],
    fields: [{ name: "value", type: ctor_t, is_pub: true }],
  };
  env.bind(BUILTIN_CELL, {
    type: { kind: "fn", params: [ctor_t], return_type: ctor_ret, effects: EMPTY_ROW } as FnType,
    type_vars: [ctor_t.id], bounds: [],
  });

  const mut_row: EffectRow = { effects: [{ kind: "mut" }] };
  const m_t = env.fresh_var();
  const self: Type = {
    kind: "struct", name: BUILTIN_CELL, type_params: [m_t],
    fields: [{ name: "value", type: m_t, is_pub: true }],
  };
  const methods: Methods = new Map();
  methods.set("get", {
    type: { kind: "fn", params: [self], return_type: m_t, effects: mut_row } as FnType,
    type_vars: [m_t.id], bounds: [],
  });
  methods.set("set", {
    type: { kind: "fn", params: [self, m_t], return_type: UNIT, effects: mut_row } as FnType,
    type_vars: [m_t.id], bounds: [],
  });
  const update_cb: FnType = { kind: "fn", params: [m_t], return_type: m_t, effects: EMPTY_ROW };
  methods.set("update", {
    type: { kind: "fn", params: [self, update_cb], return_type: UNIT, effects: mut_row } as FnType,
    type_vars: [m_t.id], bounds: [],
  });
  env.impl_methods.set(BUILTIN_CELL, methods);
}

// ================================================================
// Option<T>
// ================================================================

function register_option(env: TypeEnv): void {
  const option_t = env.fresh_var();
  env.enums.set(BUILTIN_OPTION, {
    name: BUILTIN_OPTION, type_params: ["T"], type_param_vars: [option_t.id],
    variants: [{ name: "some", fields: [option_t] }, { name: "none", fields: [] }],
  });
  env.variant_to_enum.set("some", BUILTIN_OPTION);
  env.variant_to_enum.set("none", BUILTIN_OPTION);

  const some_t = env.fresh_var();
  env.bind("some", {
    type: { kind: "fn", params: [some_t], return_type: make_option_type(some_t), effects: EMPTY_ROW } as FnType,
    type_vars: [some_t.id], bounds: [],
  });

  const none_t = env.fresh_var();
  env.bind("none", { type: make_option_type(none_t), type_vars: [none_t.id], bounds: [] });

  // Non-HOF methods
  const methods = get_or_create_methods(env, BUILTIN_OPTION);
  const t = env.fresh_var();
  const self = make_option_type(t);
  methods.set("is_some", {
    type: { kind: "fn", params: [self], return_type: BOOL, effects: EMPTY_ROW } as FnType,
    type_vars: [t.id], bounds: [],
  });
  methods.set("is_none", {
    type: { kind: "fn", params: [self], return_type: BOOL, effects: EMPTY_ROW } as FnType,
    type_vars: [t.id], bounds: [],
  });
  methods.set("unwrap_or", {
    type: { kind: "fn", params: [self, t], return_type: t, effects: EMPTY_ROW } as FnType,
    type_vars: [t.id], bounds: [],
  });
}

// ================================================================
// Eq trait (builtin)
// ================================================================

function register_eq_trait(env: TypeEnv): void {
  const self_var = env.fresh_var();

  // eq method: (Self, Self) -> Bool
  const eq_fn: FnType = {
    kind: "fn", params: [self_var, self_var], return_type: BOOL, effects: EMPTY_ROW,
  };
  // ne method: (Self, Self) -> Bool (has default impl)
  const ne_fn: FnType = {
    kind: "fn", params: [self_var, self_var], return_type: BOOL, effects: EMPTY_ROW,
  };

  env.traits.set("Eq", {
    name: "Eq",
    type_params: [],
    type_param_vars: [self_var.id],
    methods: [
      { name: "eq", type: eq_fn, has_default: false },
      { name: "ne", type: ne_fn, has_default: true },
    ],
  });

  // Register builtin Eq impls for primitive types
  for (const prim of ["Int", "Float", "Str", "Bool"]) {
    env.trait_impls.push({
      trait_name: "Eq",
      target_type_name: prim,
      type_params: [],
      method_names: ["eq", "ne"],
    });
  }
}

function register_option_eq(env: TypeEnv): void {
  const t = env.fresh_var();
  const opt = make_option_type(t);
  const eq_fn: FnType = {
    kind: "fn", params: [opt, opt], return_type: BOOL, effects: EMPTY_ROW,
  };
  const methods = get_or_create_methods(env, BUILTIN_OPTION);
  methods.set("eq", {
    type: eq_fn,
    type_vars: [t.id],
    bounds: [{ type_var: t.id, trait_name: "Eq" }],
  });
  methods.set("ne", {
    type: { kind: "fn", params: [opt, opt], return_type: BOOL, effects: EMPTY_ROW } as FnType,
    type_vars: [t.id],
    bounds: [{ type_var: t.id, trait_name: "Eq" }],
  });
  env.trait_impls.push({
    trait_name: "Eq",
    target_type_name: BUILTIN_OPTION,
    type_params: ["T"],
    method_names: ["eq", "ne"],
  });
}

// ================================================================
// Clone trait (builtin)
// ================================================================

function register_clone_trait(env: TypeEnv): void {
  const self_var = env.fresh_var();
  const clone_fn: FnType = {
    kind: "fn", params: [self_var], return_type: self_var, effects: EMPTY_ROW,
  };

  env.traits.set("Clone", {
    name: "Clone",
    type_params: [],
    type_param_vars: [self_var.id],
    methods: [
      { name: "clone", type: clone_fn, has_default: false },
    ],
  });

  // Primitives: clone is identity (JS value semantics)
  for (const prim of ["Int", "Float", "Str", "Bool"]) {
    env.trait_impls.push({
      trait_name: "Clone",
      target_type_name: prim,
      type_params: [],
      method_names: ["clone"],
    });
  }
  // Collections: shallow clone
  for (const coll of ["List", "Map", "Set"]) {
    env.trait_impls.push({
      trait_name: "Clone",
      target_type_name: coll,
      type_params: [],
      method_names: ["clone"],
    });
  }
}

function register_option_clone(env: TypeEnv): void {
  const t = env.fresh_var();
  const opt = make_option_type(t);
  const clone_fn: FnType = {
    kind: "fn", params: [opt], return_type: opt, effects: EMPTY_ROW,
  };
  const methods = get_or_create_methods(env, BUILTIN_OPTION);
  methods.set("clone", {
    type: clone_fn,
    type_vars: [t.id],
    bounds: [{ type_var: t.id, trait_name: "Clone" }],
  });
  env.trait_impls.push({
    trait_name: "Clone",
    target_type_name: BUILTIN_OPTION,
    type_params: ["T"],
    method_names: ["clone"],
  });
}

// ================================================================
// Ord trait (builtin)
// ================================================================

function register_ord_trait(env: TypeEnv): void {
  const self_var = env.fresh_var();
  const cmp_fn: FnType = {
    kind: "fn", params: [self_var, self_var], return_type: INT, effects: EMPTY_ROW,
  };

  env.traits.set("Ord", {
    name: "Ord",
    type_params: [],
    type_param_vars: [self_var.id],
    methods: [
      { name: "cmp", type: cmp_fn, has_default: false },
    ],
  });

  // Register builtin Ord impls for primitive types
  for (const prim of ["Int", "Float", "Str", "Bool"]) {
    env.trait_impls.push({
      trait_name: "Ord",
      target_type_name: prim,
      type_params: [],
      method_names: ["cmp"],
    });
  }
}

// ================================================================
// Debug trait (builtin)
// ================================================================

function register_debug_trait(env: TypeEnv): void {
  const self_var = env.fresh_var();
  const debug_fn: FnType = {
    kind: "fn", params: [self_var], return_type: STR, effects: EMPTY_ROW,
  };

  env.traits.set("Debug", {
    name: "Debug",
    type_params: [],
    type_param_vars: [self_var.id],
    methods: [
      { name: "debug", type: debug_fn, has_default: false },
    ],
  });

  // Primitives
  for (const prim of ["Int", "Float", "Str", "Bool"]) {
    env.trait_impls.push({
      trait_name: "Debug",
      target_type_name: prim,
      type_params: [],
      method_names: ["debug"],
    });
  }
  // List<T>: debug requires T: Debug
  {
    const t = env.fresh_var();
    const list_self: StructType = { kind: "struct", name: BUILTIN_LIST, type_params: [t], fields: [] };
    const debug_fn: FnType = { kind: "fn", params: [list_self], return_type: STR, effects: EMPTY_ROW };
    const methods = get_or_create_methods(env, BUILTIN_LIST);
    methods.set("debug", {
      type: debug_fn,
      type_vars: [t.id],
      bounds: [{ type_var: t.id, trait_name: "Debug" }],
    });
    env.trait_impls.push({ trait_name: "Debug", target_type_name: BUILTIN_LIST, type_params: ["T"], method_names: ["debug"] });
  }
  // Map<K,V>: debug (no bounds required — uses generic representation)
  {
    const k = env.fresh_var();
    const v = env.fresh_var();
    const map_self = make_map_type(k, v);
    const debug_fn: FnType = { kind: "fn", params: [map_self], return_type: STR, effects: EMPTY_ROW };
    const methods = get_or_create_methods(env, BUILTIN_MAP);
    methods.set("debug", {
      type: debug_fn,
      type_vars: [k.id, v.id],
      bounds: [],
    });
    env.trait_impls.push({ trait_name: "Debug", target_type_name: BUILTIN_MAP, type_params: ["K", "V"], method_names: ["debug"] });
  }
  // Set<T>: debug (no bounds required — uses generic representation)
  {
    const t = env.fresh_var();
    const set_self: StructType = { kind: "struct", name: BUILTIN_SET, type_params: [t], fields: [] };
    const debug_fn: FnType = { kind: "fn", params: [set_self], return_type: STR, effects: EMPTY_ROW };
    const methods = get_or_create_methods(env, BUILTIN_SET);
    methods.set("debug", {
      type: debug_fn,
      type_vars: [t.id],
      bounds: [],
    });
    env.trait_impls.push({ trait_name: "Debug", target_type_name: BUILTIN_SET, type_params: ["T"], method_names: ["debug"] });
  }
}

function register_option_debug(env: TypeEnv): void {
  const t = env.fresh_var();
  const opt = make_option_type(t);
  const debug_fn: FnType = {
    kind: "fn", params: [opt], return_type: STR, effects: EMPTY_ROW,
  };
  const methods = get_or_create_methods(env, BUILTIN_OPTION);
  methods.set("debug", {
    type: debug_fn,
    type_vars: [t.id],
    bounds: [{ type_var: t.id, trait_name: "Debug" }],
  });
  env.trait_impls.push({
    trait_name: "Debug",
    target_type_name: BUILTIN_OPTION,
    type_params: ["T"],
    method_names: ["debug"],
  });
}

// ================================================================
// List<T> HOF methods (effect-polymorphic)
// ================================================================

function get_or_create_methods(env: TypeEnv, type_name: string): Methods {
  let m = env.impl_methods.get(type_name);
  if (!m) { m = new Map(); env.impl_methods.set(type_name, m); }
  return m;
}

function register_list_hof(env: TypeEnv): void {
  const methods = get_or_create_methods(env, BUILTIN_LIST);
  const mk = (tv: TypeVar): StructType => ({ kind: "struct", name: BUILTIN_LIST, type_params: [tv], fields: [] });

  {
    const t = env.fresh_var(), u = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: u, effects: eff };
    methods.set("map", {
      type: { kind: "fn", params: [mk(t), cb], return_type: mk(u), effects: eff } as FnType,
      type_vars: [t.id, u.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: BOOL, effects: eff };
    methods.set("filter", {
      type: { kind: "fn", params: [mk(t), cb], return_type: mk(t), effects: eff } as FnType,
      type_vars: [t.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var(), u = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: mk(u), effects: eff };
    methods.set("flat_map", {
      type: { kind: "fn", params: [mk(t), cb], return_type: mk(u), effects: eff } as FnType,
      type_vars: [t.id, u.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var(), u = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [u, t], return_type: u, effects: eff };
    methods.set("fold", {
      type: { kind: "fn", params: [mk(t), u, cb], return_type: u, effects: eff } as FnType,
      type_vars: [t.id, u.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: BOOL, effects: eff };
    methods.set("any", {
      type: { kind: "fn", params: [mk(t), cb], return_type: BOOL, effects: eff } as FnType,
      type_vars: [t.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: BOOL, effects: eff };
    methods.set("all", {
      type: { kind: "fn", params: [mk(t), cb], return_type: BOOL, effects: eff } as FnType,
      type_vars: [t.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: BOOL, effects: eff };
    methods.set("find", {
      type: { kind: "fn", params: [mk(t), cb], return_type: make_option_type(t), effects: eff } as FnType,
      type_vars: [t.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: BOOL, effects: eff };
    methods.set("find_index", {
      type: { kind: "fn", params: [mk(t), cb], return_type: make_option_type(INT), effects: eff } as FnType,
      type_vars: [t.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t, t], return_type: INT, effects: eff };
    methods.set("sort_by", {
      type: { kind: "fn", params: [mk(t), cb], return_type: UNIT, effects: eff } as FnType,
      type_vars: [t.id, tail_id], bounds: [],
    });
  }
}

// ================================================================
// Map<K,V> HOF methods (effect-polymorphic)
// ================================================================

function register_map_hof(env: TypeEnv): void {
  const methods = get_or_create_methods(env, BUILTIN_MAP);
  const mk = (k: TypeVar, v: TypeVar): StructType => make_map_type(k, v);

  {
    const k = env.fresh_var(), v = env.fresh_var(), u = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [v], return_type: u, effects: eff };
    methods.set("map_values", {
      type: { kind: "fn", params: [mk(k, v), cb], return_type: mk(k, u), effects: eff } as FnType,
      type_vars: [k.id, v.id, u.id, tail_id], bounds: [],
    });
  }
  {
    const k = env.fresh_var(), v = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [k, v], return_type: BOOL, effects: eff };
    methods.set("filter", {
      type: { kind: "fn", params: [mk(k, v), cb], return_type: mk(k, v), effects: eff } as FnType,
      type_vars: [k.id, v.id, tail_id], bounds: [],
    });
  }
  {
    const k = env.fresh_var(), v = env.fresh_var(), u = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [u, k, v], return_type: u, effects: eff };
    methods.set("fold", {
      type: { kind: "fn", params: [mk(k, v), u, cb], return_type: u, effects: eff } as FnType,
      type_vars: [k.id, v.id, u.id, tail_id], bounds: [],
    });
  }
  {
    const k = env.fresh_var(), v = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [k, v], return_type: BOOL, effects: eff };
    methods.set("any", {
      type: { kind: "fn", params: [mk(k, v), cb], return_type: BOOL, effects: eff } as FnType,
      type_vars: [k.id, v.id, tail_id], bounds: [],
    });
  }
}

// ================================================================
// Set<T> HOF methods (effect-polymorphic)
// ================================================================

function register_set_hof(env: TypeEnv): void {
  const methods = get_or_create_methods(env, BUILTIN_SET);
  const mk = (tv: TypeVar): StructType => ({ kind: "struct", name: BUILTIN_SET, type_params: [tv], fields: [] });

  {
    const t = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: BOOL, effects: eff };
    methods.set("filter", {
      type: { kind: "fn", params: [mk(t), cb], return_type: mk(t), effects: eff } as FnType,
      type_vars: [t.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var(), u = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [u, t], return_type: u, effects: eff };
    methods.set("fold", {
      type: { kind: "fn", params: [mk(t), u, cb], return_type: u, effects: eff } as FnType,
      type_vars: [t.id, u.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: BOOL, effects: eff };
    methods.set("any", {
      type: { kind: "fn", params: [mk(t), cb], return_type: BOOL, effects: eff } as FnType,
      type_vars: [t.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: BOOL, effects: eff };
    methods.set("all", {
      type: { kind: "fn", params: [mk(t), cb], return_type: BOOL, effects: eff } as FnType,
      type_vars: [t.id, tail_id], bounds: [],
    });
  }
}

// ================================================================
// Option<T> HOF methods (effect-polymorphic)
// ================================================================

function register_option_hof(env: TypeEnv): void {
  const methods = get_or_create_methods(env, BUILTIN_OPTION);

  {
    const t = env.fresh_var(), u = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: u, effects: eff };
    methods.set("map", {
      type: { kind: "fn", params: [make_option_type(t), cb], return_type: make_option_type(u), effects: eff } as FnType,
      type_vars: [t.id, u.id, tail_id], bounds: [],
    });
  }
  {
    const t = env.fresh_var(), u = env.fresh_var();
    const { eff, tail_id } = open_row(env);
    const cb: FnType = { kind: "fn", params: [t], return_type: make_option_type(u), effects: eff };
    methods.set("and_then", {
      type: { kind: "fn", params: [make_option_type(t), cb], return_type: make_option_type(u), effects: eff } as FnType,
      type_vars: [t.id, u.id, tail_id], bounds: [],
    });
  }
}
