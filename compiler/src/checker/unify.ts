// Ring-lang Unification Algorithm + Substitution management
import {
  Type, EffectRow, Effect, FailEffect, CustomEffect,
  RecordType, StructType,
  type_to_string,
} from "../types/index.js";

// ============================================================
// Fresh variable generation for row unification
// ============================================================

// Offset from checker's type var IDs to avoid collision with unifier's fresh row vars
const UNIFY_ID_OFFSET = 100000;

let _unify_next_id = UNIFY_ID_OFFSET;
export function init_unify_fresh_counter(base: number): void {
  _unify_next_id = base + UNIFY_ID_OFFSET;
}
function fresh_row_var_id(): number { return _unify_next_id++; }

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
    case "record": {
      const fields = t.fields.map(f => ({ name: f.name, type: apply(subst, f.type) }));
      let tail = t.tail;
      let tail_name = t.tail_name;
      if (tail !== undefined) {
        const resolved = subst.get(tail);
        if (resolved) {
          const chased = apply(subst, resolved);
          if (chased.kind === "var") {
            tail = chased.id;
            if (chased.name) tail_name = chased.name;
          } else if (chased.kind === "record") {
            return {
              kind: "record",
              fields: [...fields, ...chased.fields.map(f => ({ name: f.name, type: apply(subst, f.type) }))],
              tail: chased.tail,
              tail_name: chased.tail_name,
            };
          } else {
            tail = undefined;
            tail_name = undefined;
          }
        }
      }
      return tail !== undefined ? { kind: "record", fields, tail, tail_name } : { kind: "record", fields };
    }
  }
}

export function apply_to_effect_row(subst: Substitution, row: EffectRow): EffectRow {
  const effects = row.effects.map(e => {
    if (e.kind === "fail") {
      return { kind: "fail" as const, error_type: apply(subst, e.error_type) };
    }
    if (e.kind === "custom") {
      return { kind: "custom" as const, name: e.name, type_args: e.type_args.map(a => apply(subst, a)) };
    }
    return e;
  });

  let tail = row.tail;
  if (tail !== undefined) {
    const resolved = subst.get(tail);
    if (resolved) {
      const chased = apply(subst, resolved);
      if (chased.kind === "var") {
        tail = chased.id;
      } else {
        throw new Error(`apply_to_effect_row: tail var ?${row.tail} resolved to non-var type '${chased.kind}', expected var — possible unification bug`);
      }
    }
  }

  return tail !== undefined ? { effects, tail } : { effects };
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
  // Add s2 mappings (s2 takes precedence — overwrites s1 for same key)
  for (const [id, t] of s2) {
    result.set(id, t);
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
             occurs_in(var_id, resolved.return_type, subst) ||
             (resolved.effects.tail !== undefined &&
               occurs_in(var_id, { kind: "var", id: resolved.effects.tail } as Type, subst)) ||
             resolved.effects.effects.some(e =>
               (e.kind === "fail" && occurs_in(var_id, e.error_type, subst)) ||
               (e.kind === "custom" && e.type_args.some(a => occurs_in(var_id, a, subst)))
             );
    case "struct":
      return resolved.type_params.some(p => occurs_in(var_id, p, subst)) ||
             resolved.fields.some(f => occurs_in(var_id, f.type, subst));
    case "enum":
      return resolved.type_params.some(p => occurs_in(var_id, p, subst)) ||
             resolved.variants.some(v => v.fields.some(f => occurs_in(var_id, f, subst)));
    case "generic":
      return occurs_in(var_id, resolved.base, subst) ||
             resolved.args.some(a => occurs_in(var_id, a, subst));
    case "record":
      if (resolved.tail !== undefined &&
          occurs_in(var_id, { kind: "var", id: resolved.tail } as Type, subst)) return true;
      return resolved.fields.some(f => occurs_in(var_id, f.type, subst));
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
 * Unify two effect rows using Koka-style row variable solving.
 * Match effects by kind, unify type params of matching pairs.
 * Unmatched effects are tolerated (keeps backward compat; full strictness
 * would require callers to check for unhandled effects separately).
 */
export function unify_effect_rows(a: EffectRow, b: EffectRow, subst: Substitution): Substitution {
  let s = subst;

  const ra = apply_to_effect_row(s, a);
  const rb = apply_to_effect_row(s, b);

  const a_matched = new Set<number>();
  const b_matched = new Set<number>();
  for (let ai = 0; ai < ra.effects.length; ai++) {
    for (let bi = 0; bi < rb.effects.length; bi++) {
      if (b_matched.has(bi)) continue;
      if (effects_match_kind(ra.effects[ai], rb.effects[bi])) {
        s = unify_effect_params(ra.effects[ai], rb.effects[bi], s);
        a_matched.add(ai);
        b_matched.add(bi);
        break;
      }
    }
  }

  // Unmatched effects in a closed row → error
  const a_unmatched = ra.effects.filter((_, i) => !a_matched.has(i));
  const b_unmatched = rb.effects.filter((_, i) => !b_matched.has(i));

  if (a_unmatched.length > 0 && rb.tail === undefined) {
    const names = a_unmatched.map(e => e.kind === "custom" ? e.name : e.kind).join(", ");
    throw new UnificationError(
      { kind: "unit" }, { kind: "unit" },
      `effect mismatch: effects [${names}] not allowed in pure context`
    );
  }
  if (b_unmatched.length > 0 && ra.tail === undefined) {
    const names = b_unmatched.map(e => e.kind === "custom" ? e.name : e.kind).join(", ");
    throw new UnificationError(
      { kind: "unit" }, { kind: "unit" },
      `effect mismatch: effects [${names}] not allowed in pure context`
    );
  }

  if (ra.tail !== undefined && rb.tail !== undefined && ra.tail !== rb.tail) {
    s = unify({ kind: "var", id: ra.tail }, { kind: "var", id: rb.tail }, s);
  }

  return s;
}

function effects_match_kind(a: Effect, b: Effect): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "custom" && (b as CustomEffect).name !== a.name) return false;
  return true;
}

function unify_effect_params(a: Effect, b: Effect, subst: Substitution): Substitution {
  if (a.kind === "fail" && b.kind === "fail") {
    return unify(a.error_type, (b as FailEffect).error_type, subst);
  }
  if (a.kind === "custom" && b.kind === "custom") {
    let s = subst;
    const bc = b as CustomEffect;
    const len = Math.min(a.type_args.length, bc.type_args.length);
    for (let i = 0; i < len; i++) {
      s = unify(a.type_args[i], bc.type_args[i], s);
    }
    return s;
  }
  return subst;
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
    s = unify_effect_rows(a.effects, b.effects, s);
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

  // Record types (row unification)
  if (a.kind === "record" && b.kind === "record") {
    return unify_record_rows(a, b, subst);
  }

  // Struct satisfies record constraint (one-direction coercion)
  if (a.kind === "struct" && b.kind === "record") {
    return unify_struct_with_record(a, b, subst);
  }
  if (a.kind === "record" && b.kind === "struct") {
    return unify_struct_with_record(b, a, subst);
  }

  throw new UnificationError(t1, t2);
}

// ============================================================
// Record Row Unification
// ============================================================

function unify_record_rows(a: RecordType, b: RecordType, subst: Substitution): Substitution {
  let s = subst;

  const b_names = new Set(b.fields.map(f => f.name));
  const a_names = new Set(a.fields.map(f => f.name));

  // Unify common fields
  for (const af of a.fields) {
    const bf = b.fields.find(f => f.name === af.name);
    if (bf) {
      s = unify(af.type, bf.type, s);
    }
  }

  const a_only = a.fields.filter(f => !b_names.has(f.name));
  const b_only = b.fields.filter(f => !a_names.has(f.name));

  if (a_only.length > 0 && b.tail === undefined) {
    const missing = a_only.map(f => f.name).join(", ");
    throw new UnificationError(a, b, `record missing fields: ${missing}`);
  }
  if (b_only.length > 0 && a.tail === undefined) {
    const missing = b_only.map(f => f.name).join(", ");
    throw new UnificationError(a, b, `record missing fields: ${missing}`);
  }

  if (a_only.length > 0 && b_only.length > 0 && a.tail !== undefined && b.tail !== undefined) {
    // Both sides have surplus fields and open tails — need fresh shared tail
    const fresh_tail = fresh_row_var_id();
    const a_tail_record: Type = { kind: "record", fields: b_only, tail: fresh_tail };
    const b_tail_record: Type = { kind: "record", fields: a_only, tail: fresh_tail };
    if (occurs_in(a.tail, a_tail_record, s)) {
      throw new UnificationError(a, b, "infinite type in row variable");
    }
    if (occurs_in(b.tail, b_tail_record, s)) {
      throw new UnificationError(a, b, "infinite type in row variable");
    }
    s = new Map(s);
    s.set(a.tail, a_tail_record);
    s.set(b.tail, b_tail_record);
  } else {
    if (a.tail !== undefined && b_only.length > 0) {
      const record_for_tail: Type = { kind: "record", fields: b_only };
      if (occurs_in(a.tail, record_for_tail, s)) {
        throw new UnificationError(a, b, "infinite type in row variable");
      }
      s = new Map(s);
      s.set(a.tail, record_for_tail);
    }
    if (b.tail !== undefined && a_only.length > 0) {
      const record_for_tail: Type = { kind: "record", fields: a_only };
      if (occurs_in(b.tail, record_for_tail, s)) {
        throw new UnificationError(a, b, "infinite type in row variable");
      }
      s = new Map(s);
      s.set(b.tail, record_for_tail);
    }
    if (a.tail !== undefined && b.tail !== undefined && a_only.length === 0 && b_only.length === 0) {
      if (a.tail !== b.tail) {
        s = unify({ kind: "var", id: a.tail }, { kind: "var", id: b.tail }, s);
      }
    }
  }

  return s;
}

// ============================================================
// Struct → Record Coercion
// ============================================================

function unify_struct_with_record(struct_t: StructType, record_t: RecordType, subst: Substitution): Substitution {
  let s = subst;

  for (const rf of record_t.fields) {
    const sf = struct_t.fields.find(f => f.name === rf.name);
    if (!sf) {
      throw new UnificationError(struct_t, record_t,
        `type '${struct_t.name}' does not satisfy {${record_t.fields.map(f => f.name).join(", ")}, ..} — missing field '${rf.name}'`);
    }
    s = unify(sf.type, rf.type, s);
  }

  if (record_t.tail !== undefined) {
    const remaining = struct_t.fields.filter(sf => !record_t.fields.some(rf => rf.name === sf.name));
    const tail_record: Type = {
      kind: "record",
      fields: remaining.map(f => ({ name: f.name, type: apply(s, f.type) })),
    };
    if (occurs_in(record_t.tail, tail_record, s)) {
      throw new UnificationError(struct_t, record_t, "infinite type in row variable");
    }
    s = new Map(s);
    s.set(record_t.tail, tail_record);
  }

  return s;
}
