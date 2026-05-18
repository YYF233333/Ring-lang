// Ring-lang Pattern Match Exhaustiveness Checking
import { Pattern } from "../ast/index.js";
import { Type } from "../types/index.js";
import { Substitution, apply } from "./unify.js";

/**
 * Check if match arms cover all possible cases for the given scrutinee type.
 * Returns null if exhaustive, or a description of the missing pattern if not.
 */
export function check_exhaustive(
  arms: { pattern: Pattern; guard?: any }[],
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
      for (const p of patterns) {
        if (p.kind === "constructor" && p.name === name) {
          covered.add(name);
          sub_patterns_for_variant.push(p.fields);
        }
      }

      if (!covered.has(name)) continue;

      const variant_def = resolved.variants.find(v => v.name === name)!;
      if (variant_def.fields.length > 0) {
        for (let i = 0; i < variant_def.fields.length; i++) {
          const field_type = variant_def.fields[i];
          const column: Pattern[] = sub_patterns_for_variant.map(
            row => row[i] ?? { kind: "wildcard" as const, span: { start: 0, end: 0 } }
          );
          const missing = check_patterns(column, field_type, subst);
          if (missing !== null) {
            return `${name}(${missing})`;
          }
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

  return "_";
}
