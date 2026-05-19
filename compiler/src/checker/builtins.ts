// Built-in type and method registrations for Ring-lang.
// Extracted from TypeEnv.register_builtins() to reduce file size and improve readability.
import {
  Type, TypeVar, FnType, StructType, TupleType, EffectRow,
  EMPTY_ROW, INT, STR, BOOL, UNIT, NEVER,
  make_option_type, make_list_type, make_map_type, make_set_type,
} from "../types/index.js";
import {
  BUILTIN_STR, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION, BUILTIN_CELL,
} from "../hir/index.js";
import { TypeEnv, TypeScheme, mono } from "./env.js";

type Methods = Map<string, TypeScheme>;

function pure(methods: Methods, name: string, params: Type[], return_type: Type): void {
  methods.set(name, {
    type: { kind: "fn", params, return_type, effects: EMPTY_ROW } as FnType,
    type_vars: [], bounds: [],
  });
}

function poly1(
  env: TypeEnv, methods: Methods, name: string,
  build: (t: TypeVar) => { params: Type[]; ret: Type },
): void {
  const t = env.fresh_var();
  const { params, ret } = build(t);
  methods.set(name, {
    type: { kind: "fn", params, return_type: ret, effects: EMPTY_ROW } as FnType,
    type_vars: [t.id], bounds: [],
  });
}

function poly2(
  env: TypeEnv, methods: Methods, name: string,
  build: (a: TypeVar, b: TypeVar) => { params: Type[]; ret: Type },
): void {
  const a = env.fresh_var();
  const b = env.fresh_var();
  const { params, ret } = build(a, b);
  methods.set(name, {
    type: { kind: "fn", params, return_type: ret, effects: EMPTY_ROW } as FnType,
    type_vars: [a.id, b.id], bounds: [],
  });
}

function open_row(env: TypeEnv): { eff: EffectRow; tail_id: number } {
  const tail_id = env.fresh_var_id();
  return { eff: { effects: [], tail: tail_id }, tail_id };
}

export function register_builtins(env: TypeEnv): void {
  register_global_fns(env);
  register_effects(env);
  register_cell(env);
  register_option(env);
  register_list(env);
  register_str(env);
  register_map(env);
  register_set(env);
}

// ================================================================
// Global functions
// ================================================================

function register_global_fns(env: TypeEnv): void {
  const print_var = env.fresh_var();
  env.bind("print", {
    type: { kind: "fn", params: [print_var], return_type: UNIT, effects: EMPTY_ROW } as FnType,
    type_vars: [print_var.id], bounds: [],
  });
  env.bind("assert", mono({ kind: "fn", params: [BOOL], return_type: UNIT, effects: EMPTY_ROW } as FnType));
  env.bind("exit", mono({ kind: "fn", params: [INT], return_type: NEVER, effects: EMPTY_ROW } as FnType));
  env.bind("panic", mono({ kind: "fn", params: [STR], return_type: NEVER, effects: EMPTY_ROW } as FnType));
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
// List<T>
// ================================================================

function register_list(env: TypeEnv): void {
  const list_t = env.fresh_var();
  env.structs.set(BUILTIN_LIST, {
    name: BUILTIN_LIST, type_params: ["T"], type_param_vars: [list_t.id], fields: [],
  });

  const methods: Methods = new Map();
  const mk = (tv: TypeVar): StructType => ({ kind: "struct", name: BUILTIN_LIST, type_params: [tv], fields: [] });

  // Read methods
  poly1(env, methods, "len", t => ({ params: [mk(t)], ret: INT }));
  poly1(env, methods, "get", t => ({ params: [mk(t), INT], ret: make_option_type(t) }));
  poly1(env, methods, "first", t => ({ params: [mk(t)], ret: make_option_type(t) }));
  poly1(env, methods, "last", t => ({ params: [mk(t)], ret: make_option_type(t) }));
  poly1(env, methods, "contains", t => ({ params: [mk(t), t], ret: BOOL }));
  poly1(env, methods, "is_empty", t => ({ params: [mk(t)], ret: BOOL }));

  // Transform methods
  poly1(env, methods, "push", t => ({ params: [mk(t), t], ret: UNIT }));
  poly1(env, methods, "concat", t => ({ params: [mk(t), mk(t)], ret: UNIT }));
  poly1(env, methods, "slice", t => ({ params: [mk(t), INT, INT], ret: mk(t) }));
  poly1(env, methods, "reverse", t => ({ params: [mk(t)], ret: UNIT }));

  // HOF methods (effect-polymorphic)
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

  env.impl_methods.set(BUILTIN_LIST, methods);
}

// ================================================================
// Str methods
// ================================================================

function register_str(env: TypeEnv): void {
  const methods: Methods = new Map();
  pure(methods, "len", [STR], INT);
  pure(methods, "contains", [STR, STR], BOOL);
  pure(methods, "starts_with", [STR, STR], BOOL);
  pure(methods, "ends_with", [STR, STR], BOOL);
  pure(methods, "slice", [STR, INT, INT], STR);
  pure(methods, "trim", [STR], STR);
  pure(methods, "to_upper", [STR], STR);
  pure(methods, "to_lower", [STR], STR);
  pure(methods, "split", [STR, STR], make_list_type(STR));
  pure(methods, "replace", [STR, STR, STR], STR);
  pure(methods, "char_at", [STR, INT], make_option_type(STR));
  pure(methods, "index_of", [STR, STR], make_option_type(INT));
  env.impl_methods.set(BUILTIN_STR, methods);
}

// ================================================================
// Map<K,V>
// ================================================================

function register_map(env: TypeEnv): void {
  const map_k = env.fresh_var(), map_v = env.fresh_var();
  env.structs.set(BUILTIN_MAP, {
    name: BUILTIN_MAP, type_params: ["K", "V"], type_param_vars: [map_k.id, map_v.id], fields: [],
  });

  const methods: Methods = new Map();
  const mk = (k: TypeVar, v: TypeVar): StructType => make_map_type(k, v);

  // Read methods
  poly2(env, methods, "len", (k, v) => ({ params: [mk(k, v)], ret: INT }));
  poly2(env, methods, "get", (k, v) => ({ params: [mk(k, v), k], ret: make_option_type(v) }));
  poly2(env, methods, "contains_key", (k, v) => ({ params: [mk(k, v), k], ret: BOOL }));
  poly2(env, methods, "is_empty", (k, v) => ({ params: [mk(k, v)], ret: BOOL }));
  poly2(env, methods, "keys", (k, v) => ({ params: [mk(k, v)], ret: make_list_type(k) }));
  poly2(env, methods, "values", (k, v) => ({ params: [mk(k, v)], ret: make_list_type(v) }));
  {
    const k = env.fresh_var(), v = env.fresh_var();
    const tuple_type: TupleType = { kind: "tuple", elements: [k, v] };
    methods.set("entries", {
      type: { kind: "fn", params: [mk(k, v)], return_type: make_list_type(tuple_type), effects: EMPTY_ROW } as FnType,
      type_vars: [k.id, v.id], bounds: [],
    });
  }

  // Transform methods
  poly2(env, methods, "insert", (k, v) => ({ params: [mk(k, v), k, v], ret: UNIT }));
  poly2(env, methods, "remove", (k, v) => ({ params: [mk(k, v), k], ret: UNIT }));

  // HOF methods
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

  env.impl_methods.set(BUILTIN_MAP, methods);

  // Free functions: map_new, map_from
  {
    const k = env.fresh_var(), v = env.fresh_var();
    env.bind("map_new", {
      type: { kind: "fn", params: [], return_type: make_map_type(k, v), effects: EMPTY_ROW } as FnType,
      type_vars: [k.id, v.id], bounds: [],
    });
  }
  {
    const k = env.fresh_var(), v = env.fresh_var();
    const tuple_type: TupleType = { kind: "tuple", elements: [k, v] };
    env.bind("map_from", {
      type: { kind: "fn", params: [make_list_type(tuple_type)], return_type: make_map_type(k, v), effects: EMPTY_ROW } as FnType,
      type_vars: [k.id, v.id], bounds: [],
    });
  }
}

// ================================================================
// Set<T>
// ================================================================

function register_set(env: TypeEnv): void {
  const set_t = env.fresh_var();
  env.structs.set(BUILTIN_SET, {
    name: BUILTIN_SET, type_params: ["T"], type_param_vars: [set_t.id], fields: [],
  });

  const methods: Methods = new Map();
  const mk = (tv: TypeVar): StructType => ({ kind: "struct", name: BUILTIN_SET, type_params: [tv], fields: [] });

  // Read methods
  poly1(env, methods, "len", t => ({ params: [mk(t)], ret: INT }));
  poly1(env, methods, "contains", t => ({ params: [mk(t), t], ret: BOOL }));
  poly1(env, methods, "is_empty", t => ({ params: [mk(t)], ret: BOOL }));
  poly1(env, methods, "to_list", t => ({ params: [mk(t)], ret: make_list_type(t) }));

  // Transform methods
  poly1(env, methods, "insert", t => ({ params: [mk(t), t], ret: UNIT }));
  poly1(env, methods, "remove", t => ({ params: [mk(t), t], ret: UNIT }));
  poly1(env, methods, "union", t => ({ params: [mk(t), mk(t)], ret: mk(t) }));
  poly1(env, methods, "intersect", t => ({ params: [mk(t), mk(t)], ret: mk(t) }));
  poly1(env, methods, "difference", t => ({ params: [mk(t), mk(t)], ret: mk(t) }));

  // HOF methods
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

  env.impl_methods.set(BUILTIN_SET, methods);

  // Free functions: set_new, set_from
  {
    const t = env.fresh_var();
    env.bind("set_new", {
      type: { kind: "fn", params: [], return_type: make_set_type(t), effects: EMPTY_ROW } as FnType,
      type_vars: [t.id], bounds: [],
    });
  }
  {
    const t = env.fresh_var();
    env.bind("set_from", {
      type: { kind: "fn", params: [make_list_type(t)], return_type: make_set_type(t), effects: EMPTY_ROW } as FnType,
      type_vars: [t.id], bounds: [],
    });
  }
}
