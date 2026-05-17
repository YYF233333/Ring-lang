// Ring-lang Pattern Match Exhaustiveness Checking
import { Pattern } from "../ast/index.js";
import { Type } from "../types/index.js";
import { Substitution, apply } from "./unify.js";

/**
 * Check if match arms cover all possible cases for the given scrutinee type.
 * Returns null if exhaustive, or the name of a missing variant/case if not.
 */
export function check_exhaustive(
  arms: { pattern: Pattern; guard?: any }[],
  scrutinee_type: Type,
  subst: Substitution,
): string | null {
  const resolved = apply(subst, scrutinee_type);

  // Unguarded wildcard or binding makes the match exhaustive
  for (const arm of arms) {
    if (!arm.guard && (arm.pattern.kind === "wildcard" || arm.pattern.kind === "binding")) {
      return null; // exhaustive
    }
  }

  // For enum types: check that all variants are covered (by unguarded patterns)
  if (resolved.kind === "enum") {
    const variant_names = new Set(resolved.variants.map(v => v.name));
    const covered = new Set<string>();

    for (const arm of arms) {
      if (arm.pattern.kind === "constructor") {
        // Only count as covered if the variant actually belongs to this enum
        if (variant_names.has(arm.pattern.name) && !arm.guard) {
          covered.add(arm.pattern.name);
        }
      }
    }

    for (const name of variant_names) {
      if (!covered.has(name)) {
        return name; // missing variant
      }
    }
    return null; // all variants covered
  }

  // For Option types: check some and none
  if (resolved.kind === "option") {
    const covered = new Set<string>();
    for (const arm of arms) {
      if (arm.pattern.kind === "constructor" && !arm.guard) {
        covered.add(arm.pattern.name);
      }
    }
    if (!covered.has("some")) return "some";
    if (!covered.has("none")) return "none";
    return null;
  }

  // For Bool: check true and false
  if (resolved.kind === "bool") {
    let has_true = false;
    let has_false = false;
    for (const arm of arms) {
      if (!arm.guard && arm.pattern.kind === "literal") {
        if (arm.pattern.value === true) has_true = true;
        if (arm.pattern.value === false) has_false = true;
      }
    }
    if (has_true && has_false) return null;
    if (!has_true) return "true";
    return "false";
  }

  // For other types (Int, Str, etc.), we cannot check exhaustiveness
  // without a wildcard/binding, so report non-exhaustive
  if (resolved.kind === "unit") {
    return null;
  }

  return "_";
}
