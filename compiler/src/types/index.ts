// Ring-lang internal type representations
// Used during type checking and inference.

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
  | OptionType
  | RecordType;

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

export interface OptionType {
  kind: "option";
  inner: Type;
}

export interface RecordField {
  name: string;
  type: Type;
}

export interface RecordType {
  kind: "record";
  fields: RecordField[];
  tail?: number;
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
    case "option":
      return types_equal(a.inner, (b as OptionType).inner);
    case "record": {
      const br = b as RecordType;
      if (a.fields.length !== br.fields.length) return false;
      if (a.tail !== br.tail) return false;
      return a.fields.every((f, i) =>
        f.name === br.fields[i].name && types_equal(f.type, br.fields[i].type)
      );
    }
  }
}

// ============================================================
// Type display
// ============================================================

export function type_to_string(t: Type): string {
  switch (t.kind) {
    case "int": return "Int";
    case "float": return "Float";
    case "str": return "Str";
    case "bool": return "Bool";
    case "unit": return "()";
    case "never": return "Never";
    case "any": return "Any";
    case "var": return `?${t.id}`;
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
      if (t.type_params.length === 0) return t.name;
      return `${t.name}<${t.type_params.map(type_to_string).join(", ")}>`;
    }
    case "generic": {
      const base = type_to_string(t.base);
      const args = t.args.map(type_to_string).join(", ");
      return `${base}<${args}>`;
    }
    case "option":
      return `${type_to_string(t.inner)}?`;
    case "record": {
      const fields = t.fields.map(f => `${f.name}: ${type_to_string(f.type)}`).join(", ");
      if (t.tail !== undefined) {
        return fields ? `{${fields}, ..?${t.tail}}` : `{..?${t.tail}}`;
      }
      return `{${fields}}`;
    }
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
