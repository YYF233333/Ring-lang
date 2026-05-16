// Ring-lang Pattern Match Exhaustiveness Checking
import { Pattern } from "../ast/index.js";
import { Type, EnumType } from "../types/index.js";
import { Substitution, apply } from "./unify.js";

/**
 * Check if match arms cover all possible cases for the given scrutinee type.
 * Returns null if exhaustive, or the name of a missing variant/case if not.
 */
export function check_exhaustive(
  patterns: Pattern[],
  scrutinee_type: Type,
  subst: Substitution,
): string | null {
  const resolved = apply(subst, scrutinee_type);

  // If any pattern is a wildcard or binding, it's automatically exhaustive
  for (const pat of patterns) {
    if (pat.kind === "wildcard" || pat.kind === "binding") {
      return null; // exhaustive
    }
  }

  // For enum types: check that all variants are covered
  if (resolved.kind === "enum") {
    const variant_names = new Set(resolved.variants.map(v => v.name));
    const covered = new Set<string>();

    for (const pat of patterns) {
      if (pat.kind === "constructor") {
        covered.add(pat.name);
      }
    }

    for (const name of variant_names) {
      if (!covered.has(name)) {
        return name; // missing variant
      }
    }
    return null; // all variants covered
  }

  // For Bool: check true and false
  if (resolved.kind === "bool") {
    let has_true = false;
    let has_false = false;
    for (const pat of patterns) {
      if (pat.kind === "literal") {
        if (pat.value === true) has_true = true;
        if (pat.value === false) has_false = true;
      }
    }
    if (has_true && has_false) return null;
    if (!has_true) return "true";
    return "false";
  }

  // For other types (Int, Str, etc.), we cannot check exhaustiveness
  // without a wildcard/binding, so report non-exhaustive
  // unless it's a unit type (single value)
  if (resolved.kind === "unit") {
    return null;
  }

  return "_"; // non-exhaustive: need a wildcard
}
