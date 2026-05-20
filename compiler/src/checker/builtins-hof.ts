// HOF method registrations for List, Map, Set, Option.
// These need effect polymorphism and are registered AFTER stdlib prelude loading.
import {
  TypeVar, FnType, StructType, EffectRow,
  INT, BOOL, UNIT,
  make_option_type, make_map_type,
} from "../types/index.js";
import {
  BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION,
} from "../hir/index.js";
import { TypeEnv } from "./env.js";
import { get_or_create_methods } from "./builtins-core.js";

function open_row(env: TypeEnv): { eff: EffectRow; tail_id: number } {
  const tail_id = env.fresh_var_id();
  return { eff: { effects: [], tail: tail_id }, tail_id };
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
// List<T> HOF methods (effect-polymorphic)
// ================================================================

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
