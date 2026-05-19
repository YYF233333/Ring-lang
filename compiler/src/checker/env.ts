// Ring-lang Type Environment — scope management + builtin definitions
import { Type, TypeVar, FnType, EffectRow } from "../types/index.js";
import { Span } from "../ast/index.js";
import { register_builtins as register_builtins_impl } from "./builtins.js";

// ============================================================
// Type Scheme (for let-polymorphism)
// ============================================================

export interface TypeScheme {
  type: Type;
  type_vars: number[];
  bounds: { type_var: number; trait_name: string }[];
  def_id?: number;
}

export function mono(type: Type): TypeScheme {
  return { type, type_vars: [], bounds: [] };
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
  variants: { name: string; fields: Type[]; field_names?: string[] }[];
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
  private next_def_id = 0;
  public scopes: Scope[] = [];
  public structs: Map<string, StructDef> = new Map();
  public enums: Map<string, EnumDef> = new Map();
  public effects: Map<string, EffectDef> = new Map();
  public impl_methods: Map<string, Map<string, TypeScheme>> = new Map();
  public variant_to_enum: Map<string, string> = new Map();
  public traits: Map<string, TraitDef> = new Map();
  public trait_impls: ImplEntry[] = [];
  public fn_bounds: Map<string, { type_param: string; trait_name: string }[]> = new Map();
  public var_bounds: Map<number, Set<string>> = new Map();
  public def_spans: Map<number, Span> = new Map();
  public mutable_vars: Set<number> = new Set();
  public type_aliases: Map<string, { type_params: string[]; type_param_vars: number[]; type: Type }> = new Map();

  constructor() {
    this.scopes.push({ variables: new Map() });
    this.register_builtins();
  }

  get current_var_id(): number { return this.next_type_var_id; }

  fresh_var(): TypeVar {
    return { kind: "var", id: this.next_type_var_id++ };
  }

  fresh_var_id(): number {
    return this.next_type_var_id++;
  }

  fresh_def_id(): number {
    return this.next_def_id++;
  }

  private register_builtins(): void {
    register_builtins_impl(this);
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
    if (scheme.def_id === undefined) {
      scheme.def_id = this.fresh_def_id();
    }
    const current = this.scopes[this.scopes.length - 1];
    current.variables.set(name, scheme);
  }

  bind_mono(name: string, type: Type): void {
    this.bind(name, mono(type));
  }

  record_def_span(def_id: number, span: Span): void {
    this.def_spans.set(def_id, span);
  }

  rebind(name: string, scheme: TypeScheme): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].variables.has(name)) {
        this.scopes[i].variables.set(name, scheme);
        return;
      }
    }
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
    for (const bound of scheme.bounds) {
      const fresh = mapping.get(bound.type_var);
      if (fresh && fresh.kind === "var") {
        const existing = this.var_bounds.get(fresh.id) ?? new Set();
        existing.add(bound.trait_name);
        this.var_bounds.set(fresh.id, existing);
      }
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
        variants: t.variants.map(v => ({ ...v, fields: v.fields.map(f => substitute_type(f, mapping)), field_names: v.field_names })),
      };
    case "generic":
      return {
        kind: "generic",
        base: substitute_type(t.base, mapping),
        args: t.args.map(a => substitute_type(a, mapping)),
      };
    case "record": {
      const fields = t.fields.map(f => ({ name: f.name, type: substitute_type(f.type, mapping) }));
      let tail = t.tail;
      let tail_name = t.tail_name;
      if (tail !== undefined && mapping.has(tail)) {
        const replacement = mapping.get(tail)!;
        if (replacement.kind === "var") {
          tail = replacement.id;
          if (replacement.name) tail_name = replacement.name;
        } else if (replacement.kind === "record") {
          return {
            kind: "record",
            fields: [...fields, ...replacement.fields.map(f => ({ name: f.name, type: substitute_type(f.type, mapping) }))],
            tail: replacement.tail,
            tail_name: replacement.tail_name,
          };
        } else {
          tail = undefined;
          tail_name = undefined;
        }
      }
      return tail !== undefined
        ? { kind: "record", fields, tail, tail_name }
        : { kind: "record", fields };
    }
    case "effect_row": {
      const row = substitute_effect_row({ effects: t.effects, tail: t.tail }, mapping);
      return { kind: "effect_row", effects: row.effects, tail: row.tail };
    }
    case "tuple":
      return { kind: "tuple", elements: t.elements.map(e => substitute_type(e, mapping)) };
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
