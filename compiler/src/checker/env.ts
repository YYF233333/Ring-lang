// Ring-lang Type Environment — scope management + builtin definitions
import {
  Type, FnType, EffectRow, EMPTY_ROW, INT, FLOAT, STR, BOOL, UNIT, NEVER, ANY,
  fresh_type_var, effect_row,
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
  fields: { name: string; type: Type; is_pub: boolean }[];
}

export interface EnumDef {
  name: string;
  type_params: string[];
  variants: { name: string; fields: Type[] }[];
}

export interface EffectDef {
  name: string;
  type_params: string[];
  ops: { name: string; params: Type[]; return_type: Type }[];
}

// ============================================================
// Scope
// ============================================================

interface Scope {
  variables: Map<string, TypeScheme>;
}

// ============================================================
// TypeEnv
// ============================================================

export class TypeEnv {
  private scopes: Scope[] = [];
  public structs: Map<string, StructDef> = new Map();
  public enums: Map<string, EnumDef> = new Map();
  public effects: Map<string, EffectDef> = new Map();
  // impl methods: target_type -> method_name -> FnType
  public impl_methods: Map<string, Map<string, TypeScheme>> = new Map();
  // Map variant name -> enum name (for constructor resolution)
  public variant_to_enum: Map<string, string> = new Map();

  constructor() {
    // Global scope
    this.scopes.push({ variables: new Map() });
    this.register_builtins();
  }

  private register_builtins(): void {
    // print: fn(Any) -> ()
    this.bind("print", mono({
      kind: "fn", params: [ANY], return_type: UNIT, effects: EMPTY_ROW,
    } as FnType));

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
    });

    // Module stub: toml with parse(Str) -> Any (with fail effect)
    // We register toml.parse as a special binding
    this.bind("toml", mono(ANY)); // toml module itself
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
      mapping.set(tv, fresh_type_var());
    }
    return substitute_type(scheme.type, mapping);
  }
}

/** Apply a type variable mapping to a type (used during instantiation) */
function substitute_type(t: Type, mapping: Map<number, Type>): Type {
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
    case "option":
      return { kind: "option", inner: substitute_type(t.inner, mapping) };
  }
}

function substitute_effect_row(row: EffectRow, mapping: Map<number, Type>): EffectRow {
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
    tail: row.tail,
  };
}
