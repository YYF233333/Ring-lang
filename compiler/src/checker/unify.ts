// Ring-lang Unification Algorithm + Substitution management
import {
  Type, FnType, StructType, EnumType, GenericType, OptionType, TypeVar,
  EffectRow, type_to_string,
} from "../types/index.js";

// ============================================================
// Substitution = Map<type_var_id, resolved_Type>
// ============================================================

export type Substitution = Map<number, Type>;

export function empty_subst(): Substitution {
  return new Map();
}

// ============================================================
// Apply substitution to a type (chase type var chains)
// ============================================================

export function apply(subst: Substitution, t: Type): Type {
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
      const resolved = subst.get(t.id);
      if (resolved) {
        // Chase the chain
        return apply(subst, resolved);
      }
      return t;
    }
    case "fn":
      return {
        kind: "fn",
        params: t.params.map(p => apply(subst, p)),
        return_type: apply(subst, t.return_type),
        effects: apply_to_effect_row(subst, t.effects),
      };
    case "struct":
      return {
        kind: "struct",
        name: t.name,
        type_params: t.type_params.map(p => apply(subst, p)),
        fields: t.fields.map(f => ({ ...f, type: apply(subst, f.type) })),
      };
    case "enum":
      return {
        kind: "enum",
        name: t.name,
        type_params: t.type_params.map(p => apply(subst, p)),
        variants: t.variants.map(v => ({ ...v, fields: v.fields.map(f => apply(subst, f)) })),
      };
    case "generic":
      return {
        kind: "generic",
        base: apply(subst, t.base),
        args: t.args.map(a => apply(subst, a)),
      };
    case "option":
      return { kind: "option", inner: apply(subst, t.inner) };
  }
}

export function apply_to_effect_row(subst: Substitution, row: EffectRow): EffectRow {
  return {
    effects: row.effects.map(e => {
      if (e.kind === "fail") {
        return { kind: "fail" as const, error_type: apply(subst, e.error_type) };
      }
      if (e.kind === "custom") {
        return { kind: "custom" as const, name: e.name, type_args: e.type_args.map(a => apply(subst, a)) };
      }
      return e;
    }),
    tail: row.tail,
  };
}

// ============================================================
// Compose substitutions: apply s1 first, then s2
// compose(s1, s2) means: first s1, then s2
// ============================================================

export function compose(s1: Substitution, s2: Substitution): Substitution {
  const result: Substitution = new Map();
  // Apply s2 to all mappings in s1
  for (const [id, t] of s1) {
    result.set(id, apply(s2, t));
  }
  // Add s2 mappings (s2 takes precedence for new bindings)
  for (const [id, t] of s2) {
    if (!result.has(id)) {
      result.set(id, t);
    }
  }
  return result;
}

// ============================================================
// Occurs check: does var_id appear anywhere in type?
// ============================================================

export function occurs_in(var_id: number, t: Type, subst: Substitution): boolean {
  const resolved = apply(subst, t);
  switch (resolved.kind) {
    case "int":
    case "float":
    case "str":
    case "bool":
    case "unit":
    case "never":
    case "any":
      return false;
    case "var":
      return resolved.id === var_id;
    case "fn":
      return resolved.params.some(p => occurs_in(var_id, p, subst)) ||
             occurs_in(var_id, resolved.return_type, subst);
    case "struct":
      return resolved.type_params.some(p => occurs_in(var_id, p, subst)) ||
             resolved.fields.some(f => occurs_in(var_id, f.type, subst));
    case "enum":
      return resolved.type_params.some(p => occurs_in(var_id, p, subst)) ||
             resolved.variants.some(v => v.fields.some(f => occurs_in(var_id, f, subst)));
    case "generic":
      return occurs_in(var_id, resolved.base, subst) ||
             resolved.args.some(a => occurs_in(var_id, a, subst));
    case "option":
      return occurs_in(var_id, resolved.inner, subst);
  }
}

// ============================================================
// Unification
// ============================================================

export class UnificationError extends Error {
  constructor(t1: Type, t2: Type, detail?: string) {
    const msg = detail
      ? `Type mismatch: cannot unify ${type_to_string(t1)} with ${type_to_string(t2)} — ${detail}`
      : `Type mismatch: cannot unify ${type_to_string(t1)} with ${type_to_string(t2)}`;
    super(msg);
    this.name = "UnificationError";
  }
}

/**
 * Unify two types, returning updated substitution.
 * Throws UnificationError on failure.
 */
export function unify(t1: Type, t2: Type, subst: Substitution): Substitution {
  const a = apply(subst, t1);
  const b = apply(subst, t2);

  // any unifies with anything
  if (a.kind === "any" || b.kind === "any") return subst;
  // never unifies with anything (it's the bottom type)
  if (a.kind === "never") return subst;
  if (b.kind === "never") return subst;

  // Same type variable
  if (a.kind === "var" && b.kind === "var" && a.id === b.id) return subst;

  // Bind a variable
  if (a.kind === "var") {
    if (occurs_in(a.id, b, subst)) {
      throw new UnificationError(t1, t2, "infinite type (occurs check)");
    }
    const result = new Map(subst);
    result.set(a.id, b);
    return result;
  }
  if (b.kind === "var") {
    if (occurs_in(b.id, a, subst)) {
      throw new UnificationError(t1, t2, "infinite type (occurs check)");
    }
    const result = new Map(subst);
    result.set(b.id, a);
    return result;
  }

  // Same primitive types
  if (a.kind === "int" && b.kind === "int") return subst;
  if (a.kind === "float" && b.kind === "float") return subst;
  if (a.kind === "str" && b.kind === "str") return subst;
  if (a.kind === "bool" && b.kind === "bool") return subst;
  if (a.kind === "unit" && b.kind === "unit") return subst;

  // Function types
  if (a.kind === "fn" && b.kind === "fn") {
    if (a.params.length !== b.params.length) {
      throw new UnificationError(t1, t2, `parameter count mismatch: ${a.params.length} vs ${b.params.length}`);
    }
    let s = subst;
    for (let i = 0; i < a.params.length; i++) {
      s = unify(a.params[i], b.params[i], s);
    }
    s = unify(a.return_type, b.return_type, s);
    return s;
  }

  // Struct types
  if (a.kind === "struct" && b.kind === "struct") {
    if (a.name !== b.name) {
      throw new UnificationError(t1, t2, `different struct types`);
    }
    let s = subst;
    for (let i = 0; i < a.type_params.length; i++) {
      s = unify(a.type_params[i], b.type_params[i], s);
    }
    return s;
  }

  // Enum types
  if (a.kind === "enum" && b.kind === "enum") {
    if (a.name !== b.name) {
      throw new UnificationError(t1, t2, `different enum types`);
    }
    let s = subst;
    for (let i = 0; i < a.type_params.length; i++) {
      s = unify(a.type_params[i], b.type_params[i], s);
    }
    return s;
  }

  // Option types
  if (a.kind === "option" && b.kind === "option") {
    return unify(a.inner, b.inner, subst);
  }

  // Generic types
  if (a.kind === "generic" && b.kind === "generic") {
    let s = unify(a.base, b.base, subst);
    if (a.args.length !== b.args.length) {
      throw new UnificationError(t1, t2, "different type argument counts");
    }
    for (let i = 0; i < a.args.length; i++) {
      s = unify(a.args[i], b.args[i], s);
    }
    return s;
  }

  throw new UnificationError(t1, t2);
}
