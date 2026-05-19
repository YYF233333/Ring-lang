// Ring-lang Pattern Match Exhaustiveness Checking
// Uses Maranget-style pattern matrix algorithm for cross-column checking.
import { Pattern, NamedConstructorPattern, Expr, span_zero } from "../ast/index.js";
import { Type } from "../types/index.js";
import { Substitution, apply } from "./unify.js";

/**
 * Check if match arms cover all possible cases for the given scrutinee type.
 * Returns null if exhaustive, or a description of the missing pattern if not.
 */
export function check_exhaustive(
  arms: { pattern: Pattern; guard?: Expr }[],
  scrutinee_type: Type,
  subst: Substitution,
): string | null {
  const patterns = arms
    .filter(a => !a.guard)
    .map(a => a.pattern);
  return check_patterns(patterns, scrutinee_type, subst);
}

function check_patterns(
  patterns: Pattern[],
  type: Type,
  subst: Substitution,
): string | null {
  const resolved = apply(subst, type);

  for (const p of patterns) {
    if (p.kind === "wildcard" || p.kind === "binding") {
      return null;
    }
  }

  if (resolved.kind === "enum") {
    const variant_names = resolved.variants.map(v => v.name);
    const covered = new Set<string>();

    for (const name of variant_names) {
      const sub_patterns_for_variant: Pattern[][] = [];
      const variant_def = resolved.variants.find(v => v.name === name)!;
      for (const p of patterns) {
        if (p.kind === "constructor" && p.name === name) {
          covered.add(name);
          sub_patterns_for_variant.push(p.fields);
        } else if (p.kind === "named_constructor" && p.name === name && variant_def.field_names) {
          covered.add(name);
          const positional = named_pattern_to_positional(p, variant_def.field_names, variant_def.fields.length);
          sub_patterns_for_variant.push(positional);
        }
      }

      if (!covered.has(name)) continue;

      if (variant_def.fields.length > 0) {
        const wild: Pattern = { kind: "wildcard", span: span_zero() };
        const normalized = sub_patterns_for_variant.map(row => {
          const padded = [...row];
          while (padded.length < variant_def.fields.length) padded.push(wild);
          return padded;
        });
        const missing_fields = check_matrix(normalized, variant_def.fields, subst);
        if (missing_fields !== null) {
          return `${name}(${missing_fields.join(", ")})`;
        }
      }
    }

    for (const name of variant_names) {
      if (!covered.has(name)) {
        return name;
      }
    }
    return null;
  }

  if (resolved.kind === "bool") {
    let has_true = false;
    let has_false = false;
    for (const p of patterns) {
      if (p.kind === "literal") {
        if (p.value === true) has_true = true;
        if (p.value === false) has_false = true;
      }
    }
    if (has_true && has_false) return null;
    if (!has_true) return "true";
    return "false";
  }

  if (resolved.kind === "unit") {
    return null;
  }

  if (resolved.kind === "tuple") {
    const matrix: Pattern[][] = [];
    for (const p of patterns) {
      if (p.kind === "tuple" && p.elements.length === resolved.elements.length) {
        matrix.push(p.elements);
      }
    }
    if (matrix.length === 0) {
      return `(${resolved.elements.map(() => "_").join(", ")})`;
    }
    const missing = check_matrix(matrix, resolved.elements, subst);
    return missing !== null ? `(${missing.join(", ")})` : null;
  }

  return "_";
}

// === Maranget-style pattern matrix exhaustiveness ===

interface Ctor {
  name: string;
  arity: number;
  field_types: Type[];
  field_names?: string[];
  is_tuple: boolean;
}

function finite_type_ctors(type: Type): Ctor[] | null {
  if (type.kind === "bool") {
    return [
      { name: "true", arity: 0, field_types: [], is_tuple: false },
      { name: "false", arity: 0, field_types: [], is_tuple: false },
    ];
  }
  if (type.kind === "enum") {
    return type.variants.map(v => ({
      name: v.name,
      arity: v.fields.length,
      field_types: v.fields,
      field_names: v.field_names,
      is_tuple: false,
    }));
  }
  if (type.kind === "unit") {
    return [{ name: "()", arity: 0, field_types: [], is_tuple: false }];
  }
  if (type.kind === "tuple") {
    return [{
      name: "",
      arity: type.elements.length,
      field_types: type.elements,
      is_tuple: true,
    }];
  }
  return null;
}

const WILD: Pattern = { kind: "wildcard", span: span_zero() };

function named_pattern_to_positional(
  pat: NamedConstructorPattern,
  field_names: string[],
  arity: number,
): Pattern[] {
  const result: Pattern[] = Array.from({ length: arity }, () => WILD);
  for (const f of pat.fields) {
    const idx = field_names.indexOf(f.name);
    if (idx >= 0 && idx < arity) {
      result[idx] = f.pattern;
    }
  }
  return result;
}

function specialize_row(row: Pattern[], ctor: Ctor): Pattern[] | null {
  const first = row[0];
  const rest = row.slice(1);

  if (first.kind === "wildcard" || first.kind === "binding") {
    return [...Array.from({ length: ctor.arity }, () => WILD), ...rest];
  }
  if (first.kind === "literal") {
    if ((first.value === true && ctor.name === "true") ||
        (first.value === false && ctor.name === "false")) {
      return rest;
    }
    return null;
  }
  if (first.kind === "constructor" && first.name === ctor.name) {
    const sub = [...first.fields];
    while (sub.length < ctor.arity) sub.push(WILD);
    return [...sub, ...rest];
  }
  if (first.kind === "named_constructor" && first.name === ctor.name) {
    const positional = named_pattern_to_positional(first, ctor.field_names ?? [], ctor.arity);
    return [...positional, ...rest];
  }
  if (first.kind === "tuple" && ctor.is_tuple && first.elements.length === ctor.arity) {
    return [...first.elements, ...rest];
  }
  return null;
}

/**
 * Matrix-based exhaustiveness check for multi-column patterns.
 * Returns null if exhaustive, or an array of missing pattern strings (one per column).
 */
function check_matrix(
  rows: Pattern[][],
  col_types: Type[],
  subst: Substitution,
): string[] | null {
  if (col_types.length === 0) {
    return rows.length > 0 ? null : [];
  }

  const first_type = apply(subst, col_types[0]);
  const rest_types = col_types.slice(1);
  const ctors = finite_type_ctors(first_type);

  if (ctors !== null) {
    for (const ctor of ctors) {
      const specialized: Pattern[][] = [];
      for (const row of rows) {
        const s = specialize_row(row, ctor);
        if (s !== null) specialized.push(s);
      }
      const new_types = [...ctor.field_types, ...rest_types];
      const sub = check_matrix(specialized, new_types, subst);
      if (sub !== null) {
        const ctor_sub = sub.slice(0, ctor.arity);
        const rest_sub = sub.slice(ctor.arity);
        let ctor_str: string;
        if (ctor.is_tuple) {
          ctor_str = `(${ctor_sub.join(", ")})`;
        } else if (ctor.arity === 0) {
          ctor_str = ctor.name;
        } else {
          ctor_str = `${ctor.name}(${ctor_sub.join(", ")})`;
        }
        return [ctor_str, ...rest_sub];
      }
    }
    return null;
  } else {
    const defaults: Pattern[][] = [];
    for (const row of rows) {
      if (row[0].kind === "wildcard" || row[0].kind === "binding") {
        defaults.push(row.slice(1));
      }
    }
    const sub = check_matrix(defaults, rest_types, subst);
    return sub !== null ? ["_", ...sub] : null;
  }
}
