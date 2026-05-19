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
}

// ================================================================
// register_hof_intrinsics — HOF methods needing effect polymorphism
// Called AFTER prelude loading so type declarations exist.
// ================================================================

export function register_hof_intrinsics(env: TypeEnv): void {
  register_list_hof(env);
  register_map_hof(env);
  register_set_hof(env);
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
