// Ring-lang internal type representations
// Used during type checking and inference.
import {
  BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL,
  BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION,
} from "../hir/index.js";

// ============================================================
// Type
// ============================================================

export type Type =
  | IntType
  | FloatType
  | StrType
  | BoolType
  | UnitType
  | NeverType
  | AnyType
  | TypeVar
  | FnType
  | StructType
  | EnumType
  | GenericType
  | RecordType
  | EffectRowType
  | TupleType;

export interface IntType {
  kind: "int";
}

export interface FloatType {
  kind: "float";
}

export interface StrType {
  kind: "str";
}

export interface BoolType {
  kind: "bool";
}

export interface UnitType {
  kind: "unit";
}

export interface NeverType {
  kind: "never";
}

export interface AnyType {
  kind: "any";
}

export interface TypeVar {
  kind: "var";
  id: number;
  name?: string;
}

export interface FnType {
  kind: "fn";
  params: Type[];
  return_type: Type;
  effects: EffectRow;
}

export interface StructField {
  name: string;
  type: Type;
  is_pub: boolean;
}

export interface StructType {
  kind: "struct";
  name: string;
  type_params: Type[];
  fields: StructField[];
}

export interface EnumVariant {
  name: string;
  fields: Type[];
  field_names?: string[];
}

export interface EnumType {
  kind: "enum";
  name: string;
  type_params: Type[];
  variants: EnumVariant[];
}

export interface GenericType {
  kind: "generic";
  base: Type;
  args: Type[];
}

export interface RecordField {
  name: string;
  type: Type;
}

export interface RecordType {
  kind: "record";
  fields: RecordField[];
  tail?: number;
  tail_name?: string;
}

export interface EffectRowType {
  kind: "effect_row";
  effects: Effect[];
  tail?: number;
}

export interface TupleType {
  kind: "tuple";
  elements: Type[];
}

// ============================================================
// Effects
// ============================================================

export type Effect =
  | IoEffect
  | FailEffect
  | MutEffect
  | CustomEffect;

export interface IoEffect {
  kind: "io";
}

export interface FailEffect {
  kind: "fail";
  error_type: Type;
}

export interface MutEffect {
  kind: "mut";
}

export interface CustomEffect {
  kind: "custom";
  name: string;
  type_args: Type[];
}

// ============================================================
// Effect Row
// ============================================================

export interface EffectRow {
  effects: Effect[];
  tail?: number; // type variable id for open rows
}

// ============================================================
// Constant type instances (singletons for convenience)
// ============================================================

export const INT: IntType = { kind: "int" };
export const FLOAT: FloatType = { kind: "float" };
export const STR: StrType = { kind: "str" };
export const BOOL: BoolType = { kind: "bool" };
export const UNIT: UnitType = { kind: "unit" };
export const NEVER: NeverType = { kind: "never" };
export const ANY: AnyType = { kind: "any" };

// ============================================================
// Option<T> helper — constructs EnumType "Option"
// ============================================================

export function make_option_type(inner: Type): EnumType {
  return {
    kind: "enum",
    name: BUILTIN_OPTION,
    type_params: [inner],
    variants: [
      { name: "some", fields: [inner] },
      { name: "none", fields: [] },
    ],
  };
}

/** Check if a type is Option<T> (EnumType named "Option") */
export function is_option_type(t: Type): t is EnumType {
  return t.kind === "enum" && t.name === BUILTIN_OPTION && t.type_params.length === 1;
}

/** Extract the inner type from an Option<T>. Assumes is_option_type(t) is true. */
export function option_inner(t: EnumType): Type {
  return t.type_params[0];
}

// ============================================================
// List<T> helper — constructs StructType "List"
// ============================================================

export function make_list_type(element: Type): StructType {
  return { kind: "struct", name: BUILTIN_LIST, type_params: [element], fields: [] };
}

export function is_list_type(t: Type): t is StructType {
  return t.kind === "struct" && t.name === BUILTIN_LIST;
}

export function list_element(t: StructType): Type {
  return t.type_params[0];
}

// ============================================================
// Map<K,V> helper — constructs StructType "Map"
// ============================================================

export function make_map_type(key: Type, value: Type): StructType {
  return { kind: "struct", name: BUILTIN_MAP, type_params: [key, value], fields: [] };
}

export function is_map_type(t: Type): t is StructType {
  return t.kind === "struct" && t.name === BUILTIN_MAP;
}

// ============================================================
// Set<T> helper — constructs StructType "Set"
// ============================================================

export function make_set_type(element: Type): StructType {
  return { kind: "struct", name: BUILTIN_SET, type_params: [element], fields: [] };
}

export function is_set_type(t: Type): t is StructType {
  return t.kind === "struct" && t.name === BUILTIN_SET;
}

// ============================================================
// Effect Row helpers
// ============================================================

export const EMPTY_ROW: EffectRow = { effects: [] };

export function effect_row(...effects: Effect[]): EffectRow {
  return { effects };
}

export function open_effect_row(effects: Effect[], tail: number): EffectRow {
  return { effects, tail };
}

export function row_contains(row: EffectRow, effect: Effect): boolean {
  return row.effects.some(e => effects_equal(e, effect));
}

export interface RowMergeResult {
  row: EffectRow;
  tails_to_unify?: [number, number];
}

export function row_merge(a: EffectRow, b: EffectRow): RowMergeResult {
  const merged: Effect[] = [...a.effects];
  for (const eff of b.effects) {
    if (!merged.some(e => effects_equal(e, eff))) {
      merged.push(eff);
    }
  }
  let tail: number | undefined;
  let tails_to_unify: [number, number] | undefined;
  if (a.tail !== undefined && b.tail !== undefined && a.tail !== b.tail) {
    tail = a.tail;
    tails_to_unify = [a.tail, b.tail];
  } else {
    // When only one side has a tail, the merged row keeps it open.
    // The open tail represents unknown additional effects; the closed side
    // simply contributes its fixed effects to the union. Constraining the
    // tail variable (if needed) happens later during function-type unification.
    tail = a.tail ?? b.tail;
  }
  const row: EffectRow = tail !== undefined ? { effects: merged, tail } : { effects: merged };
  return tails_to_unify ? { row, tails_to_unify } : { row };
}

export function effects_equal(a: Effect, b: Effect): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "io": return true;
    case "mut": return true;
    case "fail": return types_equal(a.error_type, (b as FailEffect).error_type);
    case "custom": {
      const bc = b as CustomEffect;
      return a.name === bc.name &&
        a.type_args.length === bc.type_args.length &&
        a.type_args.every((arg, i) => types_equal(arg, bc.type_args[i]));
    }
  }
}

// ============================================================
// Type equality (structural)
// ============================================================

export function types_equal(a: Type, b: Type): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "int":
    case "float":
    case "str":
    case "bool":
    case "unit":
    case "never":
    case "any":
      return true;
    case "var":
      return a.id === (b as TypeVar).id;
    case "fn": {
      const bf = b as FnType;
      if (a.params.length !== bf.params.length) return false;
      if (a.effects.effects.length !== bf.effects.effects.length) return false;
      if (a.effects.tail !== bf.effects.tail) return false;
      return a.params.every((p, i) => types_equal(p, bf.params[i])) &&
        types_equal(a.return_type, bf.return_type) &&
        a.effects.effects.every((e, i) => effects_equal(e, bf.effects.effects[i]));
    }
    case "struct": {
      const bs = b as StructType;
      return a.name === bs.name &&
        a.type_params.length === bs.type_params.length &&
        a.type_params.every((p, i) => types_equal(p, bs.type_params[i]));
    }
    case "enum": {
      const be = b as EnumType;
      return a.name === be.name &&
        a.type_params.length === be.type_params.length &&
        a.type_params.every((p, i) => types_equal(p, be.type_params[i]));
    }
    case "generic": {
      const bg = b as GenericType;
      return types_equal(a.base, bg.base) &&
        a.args.length === bg.args.length &&
        a.args.every((arg, i) => types_equal(arg, bg.args[i]));
    }
    case "record": {
      const br = b as RecordType;
      if (a.fields.length !== br.fields.length) return false;
      if (a.tail !== br.tail) return false;
      return a.fields.every(f => {
        const match = br.fields.find(bf => bf.name === f.name);
        return match !== undefined && types_equal(f.type, match.type);
      });
    }
    case "effect_row": {
      const ber = b as EffectRowType;
      if (a.effects.length !== ber.effects.length) return false;
      if (a.tail !== ber.tail) return false;
      return a.effects.every((e, i) => effects_equal(e, ber.effects[i]));
    }
    case "tuple": {
      const bt = b as TupleType;
      return a.elements.length === bt.elements.length &&
        a.elements.every((e, i) => types_equal(e, bt.elements[i]));
    }
  }
}

// ============================================================
// Type display
// ============================================================

export function type_to_string(t: Type): string {
  switch (t.kind) {
    case "int": return BUILTIN_INT;
    case "float": return BUILTIN_FLOAT;
    case "str": return BUILTIN_STR;
    case "bool": return BUILTIN_BOOL;
    case "unit": return "()";
    case "never": return "Never";
    case "any": return "Any";
    case "var": return t.name ?? `?${t.id}`;
    case "fn": {
      const params = t.params.map(type_to_string).join(", ");
      const ret = type_to_string(t.return_type);
      const eff = effect_row_to_string(t.effects);
      return eff ? `(${params}) -> ${ret} / ${eff}` : `(${params}) -> ${ret}`;
    }
    case "struct": {
      if (t.type_params.length === 0) return t.name;
      return `${t.name}<${t.type_params.map(type_to_string).join(", ")}>`;
    }
    case "enum": {
      // Display Option<T> as T?
      if (t.name === BUILTIN_OPTION && t.type_params.length === 1) {
        return `${type_to_string(t.type_params[0])}?`;
      }
      if (t.type_params.length === 0) return t.name;
      return `${t.name}<${t.type_params.map(type_to_string).join(", ")}>`;
    }
    case "generic": {
      const base = type_to_string(t.base);
      const args = t.args.map(type_to_string).join(", ");
      return `${base}<${args}>`;
    }
    case "record": {
      const fields = t.fields.map(f => `${f.name}: ${type_to_string(f.type)}`).join(", ");
      if (t.tail !== undefined) {
        const tail_str = t.tail_name ?? `?${t.tail}`;
        return fields ? `{${fields}, ..${tail_str}}` : `{..${tail_str}}`;
      }
      return `{${fields}}`;
    }
    case "effect_row": {
      const effs = t.effects.map(effect_to_string).join(", ");
      if (t.tail !== undefined) return `<${effs}, ?${t.tail}>`;
      return `<${effs}>`;
    }
    case "tuple":
      return `(${t.elements.map(type_to_string).join(", ")})`;
  }
}

export function effect_to_string(e: Effect): string {
  switch (e.kind) {
    case "io": return "io";
    case "mut": return "mut";
    case "fail": return `fail<${type_to_string(e.error_type)}>`;
    case "custom": {
      if (e.type_args.length === 0) return e.name;
      return `${e.name}<${e.type_args.map(type_to_string).join(", ")}>`;
    }
  }
}

export function effect_row_to_string(row: EffectRow): string {
  if (row.effects.length === 0 && row.tail === undefined) return "";
  const parts = row.effects.map(effect_to_string);
  if (row.tail !== undefined) {
    parts.push(`?${row.tail}`);
  }
  return parts.join(", ");
}
