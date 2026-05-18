// Ring-lang Type Environment — scope management + builtin definitions
import {
  Type, TypeVar, FnType, EffectRow, EMPTY_ROW, INT, STR, BOOL, UNIT, NEVER,
  make_option_type,
} from "../types/index.js";

// ============================================================
// Type Scheme (for let-polymorphism)
// ============================================================

export interface TypeScheme {
  type: Type;
  type_vars: number[]; // universally quantified type variable ids
}

function mono(type: Type): TypeScheme {
  return { type, type_vars: [] };
}

// ============================================================
// Struct / Enum / Effect definitions stored in environment
// ============================================================

export interface StructDef {
  name: string;
  type_params: string[];         // type parameter names
  type_param_vars: number[];     // type var ids used during registration (for instantiation)
  fields: { name: string; type: Type; is_pub: boolean }[];
}

export interface EnumDef {
  name: string;
  type_params: string[];
  type_param_vars: number[];     // type var ids used during registration (for instantiation)
  variants: { name: string; fields: Type[] }[];
}

export interface EffectDef {
  name: string;
  type_params: string[];
  ops: { name: string; params: Type[]; return_type: Type }[];
  built_in_kind?: "io" | "fail" | "mut";
}

// ============================================================
// Trait definitions
// ============================================================

export interface TraitMethodDef {
  name: string;
  type: FnType;
  has_default: boolean;
}

export interface TraitDef {
  name: string;
  type_params: string[];
  type_param_vars: number[];
  methods: TraitMethodDef[];
}

export interface ImplEntry {
  trait_name: string;
  target_type_name: string;
  type_params: string[];
  method_names: string[];
}

// ============================================================
// Scope
// ============================================================

export interface Scope {
  variables: Map<string, TypeScheme>;
}

// ============================================================
// TypeEnv
// ============================================================

export class TypeEnv {
  private next_type_var_id = 0;
  public scopes: Scope[] = [];
  public structs: Map<string, StructDef> = new Map();
  public enums: Map<string, EnumDef> = new Map();
  public effects: Map<string, EffectDef> = new Map();
  public impl_methods: Map<string, Map<string, TypeScheme>> = new Map();
  public variant_to_enum: Map<string, string> = new Map();
  public traits: Map<string, TraitDef> = new Map();
  public trait_impls: ImplEntry[] = [];
  public fn_bounds: Map<string, { type_param: string; trait_name: string }[]> = new Map();

  constructor() {
    this.scopes.push({ variables: new Map() });
    this.register_builtins();
  }

  get current_var_id(): number { return this.next_type_var_id; }

  fresh_var(name?: string): TypeVar {
    return { kind: "var", id: this.next_type_var_id++, name };
  }

  private register_builtins(): void {
    // print: fn<T>(T) -> ()
    const print_var = this.fresh_var();
    this.bind("print", {
      type: { kind: "fn", params: [print_var], return_type: UNIT, effects: EMPTY_ROW } as FnType,
      type_vars: [print_var.id],
    });

    // assert: fn(Bool) -> ()
    this.bind("assert", mono({
      kind: "fn", params: [BOOL], return_type: UNIT, effects: EMPTY_ROW,
    } as FnType));

    // exit: fn(Int) -> Never
    this.bind("exit", mono({
      kind: "fn", params: [INT], return_type: NEVER, effects: EMPTY_ROW,
    } as FnType));

    // panic: fn(Str) -> Never
    this.bind("panic", mono({
      kind: "fn", params: [STR], return_type: NEVER, effects: EMPTY_ROW,
    } as FnType));

    // Built-in effect: io with ops read(Str) -> Str, write(Str, Str) -> ()
    this.effects.set("io", {
      name: "io",
      type_params: [],
      ops: [
        { name: "read", params: [STR], return_type: STR },
        { name: "write", params: [STR, STR], return_type: UNIT },
      ],
      built_in_kind: "io",
    });

    // Built-in effect: fail with op raise(E) -> Never
    const fail_type_var = this.fresh_var();
    this.effects.set("fail", {
      name: "fail",
      type_params: ["E"],
      ops: [
        { name: "raise", params: [fail_type_var], return_type: NEVER },
      ],
      built_in_kind: "fail",
    });

    // Built-in: Cell<T> — shared mutable reference
    const cell_t = this.fresh_var();
    this.structs.set("Cell", {
      name: "Cell",
      type_params: ["T"],
      type_param_vars: [cell_t.id],
      fields: [{ name: "value", type: cell_t, is_pub: true }],
    });

    // Cell constructor: fn<T>(T) -> Cell<T>
    const cell_ctor_t = this.fresh_var();
    const cell_struct_type: Type = {
      kind: "struct", name: "Cell",
      type_params: [cell_ctor_t],
      fields: [{ name: "value", type: cell_ctor_t, is_pub: true }],
    };
    this.bind("Cell", {
      type: { kind: "fn", params: [cell_ctor_t], return_type: cell_struct_type, effects: EMPTY_ROW } as FnType,
      type_vars: [cell_ctor_t.id],
    });

    // Cell impl methods — all carry {mut} effect
    const mut_row: EffectRow = { effects: [{ kind: "mut" }] };
    const cell_m_t = this.fresh_var();
    const cell_self_type: Type = {
      kind: "struct", name: "Cell",
      type_params: [cell_m_t],
      fields: [{ name: "value", type: cell_m_t, is_pub: true }],
    };
    const cell_methods = new Map<string, TypeScheme>();
    cell_methods.set("get", {
      type: { kind: "fn", params: [cell_self_type], return_type: cell_m_t, effects: mut_row } as FnType,
      type_vars: [cell_m_t.id],
    });
    cell_methods.set("set", {
      type: { kind: "fn", params: [cell_self_type, cell_m_t], return_type: UNIT, effects: mut_row } as FnType,
      type_vars: [cell_m_t.id],
    });
    const update_fn_type: FnType = { kind: "fn", params: [cell_m_t], return_type: cell_m_t, effects: EMPTY_ROW };
    cell_methods.set("update", {
      type: { kind: "fn", params: [cell_self_type, update_fn_type], return_type: UNIT, effects: mut_row } as FnType,
      type_vars: [cell_m_t.id],
    });
    this.impl_methods.set("Cell", cell_methods);

    // Built-in: Option<T> — optional value
    const option_t = this.fresh_var();
    this.enums.set("Option", {
      name: "Option",
      type_params: ["T"],
      type_param_vars: [option_t.id],
      variants: [
        { name: "some", fields: [option_t] },
        { name: "none", fields: [] },
      ],
    });
    this.variant_to_enum.set("some", "Option");
    this.variant_to_enum.set("none", "Option");

    const some_t = this.fresh_var();
    const option_some_type: Type = make_option_type(some_t);
    this.bind("some", {
      type: { kind: "fn", params: [some_t], return_type: option_some_type, effects: EMPTY_ROW } as FnType,
      type_vars: [some_t.id],
    });

    const none_t = this.fresh_var();
    const option_none_type: Type = make_option_type(none_t);
    this.bind("none", {
      type: option_none_type,
      type_vars: [none_t.id],
    });

  }

  push_scope(): void {
    this.scopes.push({ variables: new Map() });
  }

  pop_scope(): void {
    if (this.scopes.length <= 1) {
      throw new Error("Cannot pop global scope");
    }
    this.scopes.pop();
  }

  bind(name: string, scheme: TypeScheme): void {
    const current = this.scopes[this.scopes.length - 1];
    current.variables.set(name, scheme);
  }

  bind_mono(name: string, type: Type): void {
    this.bind(name, mono(type));
  }

  lookup(name: string): TypeScheme | undefined {
    // Search from innermost scope outward
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const found = this.scopes[i].variables.get(name);
      if (found) return found;
    }
    return undefined;
  }

  /** Instantiate a type scheme: replace all bound type vars with fresh ones */
  instantiate(scheme: TypeScheme): Type {
    if (scheme.type_vars.length === 0) return scheme.type;
    const mapping = new Map<number, Type>();
    for (const tv of scheme.type_vars) {
      mapping.set(tv, this.fresh_var());
    }
    return substitute_type(scheme.type, mapping);
  }
}

/** Apply a type variable mapping to a type (used during instantiation) */
export function substitute_type(t: Type, mapping: Map<number, Type>): Type {
  switch (t.kind) {
    case "int":
    case "float":
    case "str":
    case "bool":
    case "unit":
    case "never":
    case "any":
      return t;
    case "var": {
      const replacement = mapping.get(t.id);
      return replacement ?? t;
    }
    case "fn":
      return {
        kind: "fn",
        params: t.params.map(p => substitute_type(p, mapping)),
        return_type: substitute_type(t.return_type, mapping),
        effects: substitute_effect_row(t.effects, mapping),
      };
    case "struct":
      return {
        kind: "struct",
        name: t.name,
        type_params: t.type_params.map(p => substitute_type(p, mapping)),
        fields: t.fields.map(f => ({ ...f, type: substitute_type(f.type, mapping) })),
      };
    case "enum":
      return {
        kind: "enum",
        name: t.name,
        type_params: t.type_params.map(p => substitute_type(p, mapping)),
        variants: t.variants.map(v => ({ ...v, fields: v.fields.map(f => substitute_type(f, mapping)) })),
      };
    case "generic":
      return {
        kind: "generic",
        base: substitute_type(t.base, mapping),
        args: t.args.map(a => substitute_type(a, mapping)),
      };
    case "record": {
      let tail = t.tail;
      let tail_name = t.tail_name;
      if (tail !== undefined && mapping.has(tail)) {
        const replacement = mapping.get(tail)!;
        if (replacement.kind === "var") {
          tail = replacement.id;
          if (replacement.name) tail_name = replacement.name;
        }
      }
      return {
        kind: "record",
        fields: t.fields.map(f => ({ name: f.name, type: substitute_type(f.type, mapping) })),
        tail,
        tail_name,
      };
    }
  }
}

function substitute_effect_row(row: EffectRow, mapping: Map<number, Type>): EffectRow {
  let tail = row.tail;
  if (tail !== undefined && mapping.has(tail)) {
    const replacement = mapping.get(tail)!;
    if (replacement.kind === "var") {
      tail = replacement.id;
    }
  }
  return {
    effects: row.effects.map(e => {
      if (e.kind === "fail") {
        return { kind: "fail", error_type: substitute_type(e.error_type, mapping) };
      }
      if (e.kind === "custom") {
        return { kind: "custom", name: e.name, type_args: e.type_args.map(a => substitute_type(a, mapping)) };
      }
      return e;
    }),
    tail,
  };
}
