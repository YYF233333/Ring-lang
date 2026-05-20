// Auto-derive pass: generates trait implementations (Eq, Clone, Debug, Ord)
// for user-defined struct and enum types via fixpoint iteration.
//
// Algorithm:
//   1. Start with known derivable types (primitives + builtins with manual impls)
//   2. For each user struct/enum, check if ALL fields are derivable
//   3. If yes: derive the trait, register in env, add to DerivedImpl list
//   4. Repeat until no new types added (fixpoint)

import type { TypeEnv, StructDef, EnumDef } from "./env.js";
import type { Type, FnType } from "../types/index.js";
import { EMPTY_ROW, BOOL, INT, STR } from "../types/index.js";
import type { DerivedImpl, DerivedField, DerivedVariant, FieldAction } from "../hir/index.js";
import { trait_dict_name, trait_bound_param_name } from "../hir/index.js";

// Types with their own manually-registered impls — skip auto-derive
const BUILTIN_TYPES = new Set(["Option", "Cell", "List", "Map", "Set", "Range"]);

// ================================================================
// Public entry point
// ================================================================

export function run_derive_pass(env: TypeEnv): DerivedImpl[] {
  const derived_impls: DerivedImpl[] = [];
  const all_types = collect_user_types(env);
  derive_trait(env, all_types, "Eq", derived_impls);
  derive_trait(env, all_types, "Clone", derived_impls);
  derive_trait(env, all_types, "Ord", derived_impls);
  derive_trait(env, all_types, "Debug", derived_impls);
  return derived_impls;
}

// ================================================================
// Collect user-defined types (non-builtin structs and enums)
// ================================================================

interface UserType {
  name: string;
  type_kind: "struct" | "enum";
  struct_def?: StructDef;
  enum_def?: EnumDef;
}

function collect_user_types(env: TypeEnv): UserType[] {
  const result: UserType[] = [];
  for (const [name, def] of env.structs) {
    if (BUILTIN_TYPES.has(name)) continue;
    result.push({ name, type_kind: "struct", struct_def: def });
  }
  for (const [name, def] of env.enums) {
    if (BUILTIN_TYPES.has(name)) continue;
    result.push({ name, type_kind: "enum", enum_def: def });
  }
  return result;
}

// ================================================================
// Fixpoint derivation for a single trait
// ================================================================

function derive_trait(
  env: TypeEnv,
  all_types: UserType[],
  trait_name: string,
  derived_impls: DerivedImpl[],
): void {
  // Build the initial known set from trait_impls already in env
  const known = new Set<string>();
  for (const impl of env.trait_impls) {
    if (impl.trait_name === trait_name) {
      known.add(impl.target_type_name);
    }
  }
  // Primitives are always known for Eq
  for (const prim of ["Int", "Float", "Str", "Bool"]) {
    known.add(prim);
  }

  // Fixpoint loop
  let changed = true;
  while (changed) {
    changed = false;
    for (const ut of all_types) {
      if (known.has(ut.name)) continue;
      // Skip types that already have a manual impl
      if (has_manual_impl(env, ut.name, trait_name)) continue;

      const result = try_derive(env, ut, trait_name, known);
      if (result) {
        known.add(ut.name);
        register_derived_impl(env, result, trait_name);
        derived_impls.push(result);
        changed = true;
      }
    }
  }
}

/** Check if a type already has a manual (user-written) impl for the given trait */
function has_manual_impl(env: TypeEnv, type_name: string, trait_name: string): boolean {
  return env.trait_impls.some(
    impl => impl.trait_name === trait_name && impl.target_type_name === type_name,
  );
}

// ================================================================
// Try to derive a trait for a single type
// ================================================================

function try_derive(
  env: TypeEnv,
  ut: UserType,
  trait_name: string,
  known: Set<string>,
): DerivedImpl | null {
  const bounds: { type_param: string; trait_name: string }[] = [];

  if (ut.type_kind === "struct" && ut.struct_def) {
    const def = ut.struct_def;
    const fields = try_derive_fields(
      env, def.fields.map(f => ({ name: f.name, type: f.type })),
      def.type_param_vars, def.type_params,
      trait_name, known, ut.name, bounds,
    );
    if (!fields) return null;
    return {
      type_name: ut.name,
      trait_name,
      type_params: def.type_params,
      bounds,
      type_kind: "struct",
      struct_fields: fields,
    };
  }

  if (ut.type_kind === "enum" && ut.enum_def) {
    const def = ut.enum_def;
    const variants: DerivedVariant[] = [];
    for (const v of def.variants) {
      const has_named_fields = !!(v.field_names && v.field_names.length > 0);
      const field_entries = v.fields.map((ft, i) => ({
        name: has_named_fields && v.field_names ? v.field_names[i] : `_${i}`,
        type: ft,
      }));
      const fields = try_derive_fields(
        env, field_entries,
        def.type_param_vars, def.type_params,
        trait_name, known, ut.name, bounds,
      );
      if (!fields) return null;
      // Set positional_index for positional (non-named) fields
      if (!has_named_fields) {
        for (let i = 0; i < fields.length; i++) {
          fields[i].positional_index = i;
        }
      }
      variants.push({ name: v.name, fields, has_named_fields });
    }
    return {
      type_name: ut.name,
      trait_name,
      type_params: def.type_params,
      bounds,
      type_kind: "enum",
      enum_variants: variants,
    };
  }

  return null;
}

// ================================================================
// Try to derive fields — returns null if any field is not derivable
// ================================================================

interface FieldEntry {
  name: string;
  type: Type;
}

function try_derive_fields(
  env: TypeEnv,
  fields: FieldEntry[],
  type_param_vars: number[],
  type_param_names: string[],
  trait_name: string,
  known: Set<string>,
  self_type_name: string,
  bounds: { type_param: string; trait_name: string }[],
): DerivedField[] | null {
  const result: DerivedField[] = [];
  for (const field of fields) {
    const action = resolve_field_action(
      env, field.type, type_param_vars, type_param_names,
      trait_name, known, self_type_name, bounds,
    );
    if (!action) return null;
    result.push({ name: field.name, action });
  }
  return result;
}

// ================================================================
// Resolve field action — determines how to compare/clone/debug a field
// ================================================================

function resolve_field_action(
  env: TypeEnv,
  field_type: Type,
  type_param_vars: number[],
  type_param_names: string[],
  trait_name: string,
  known: Set<string>,
  self_type_name: string,
  bounds: { type_param: string; trait_name: string }[],
): FieldAction | null {
  switch (field_type.kind) {
    // Primitives: identity comparison
    case "int":
    case "float":
    case "str":
    case "bool":
    case "unit":
      return "identity";

    // Type variable: requires a trait bound, dispatched via dict param
    case "var": {
      const param_idx = type_param_vars.indexOf(field_type.id);
      if (param_idx === -1) return null; // unknown type var — can't derive
      const param_name = type_param_names[param_idx];
      // Add bound if not already present
      if (!bounds.some(b => b.type_param === param_name && b.trait_name === trait_name)) {
        bounds.push({ type_param: param_name, trait_name });
      }
      return {
        kind: "call",
        dict_name: trait_bound_param_name(param_name, trait_name),
        extra_dicts: [],
      };
    }

    // Struct type: check if in known set
    case "struct": {
      const name = field_type.name;
      // Self-referential: the generated code will call itself recursively
      if (name === self_type_name || known.has(name)) {
        const extra_dicts = resolve_extra_dicts(
          env, field_type.type_params, type_param_vars, type_param_names,
          trait_name, known, self_type_name, bounds,
        );
        if (!extra_dicts) return null;
        return {
          kind: "call",
          dict_name: trait_dict_name(name, trait_name),
          extra_dicts,
        };
      }
      return null; // not derivable yet
    }

    // Enum type: check if in known set
    case "enum": {
      const name = field_type.name;
      // Self-referential: the generated code will call itself recursively
      if (name === self_type_name || known.has(name)) {
        const extra_dicts = resolve_extra_dicts(
          env, field_type.type_params, type_param_vars, type_param_names,
          trait_name, known, self_type_name, bounds,
        );
        if (!extra_dicts) return null;
        return {
          kind: "call",
          dict_name: trait_dict_name(name, trait_name),
          extra_dicts,
        };
      }
      return null; // not derivable yet
    }

    // Tuple: identity (codegen handles inline element-wise comparison)
    case "tuple":
      return "identity";

    // Function types: not derivable for Eq/Ord/Clone
    case "fn":
      if (trait_name === "Debug") return "identity";
      return null;

    // Never/Any/record/effect_row/generic: not derivable
    default:
      return null;
  }
}

// ================================================================
// Resolve extra_dicts for generic type parameters
// ================================================================

/**
 * For a type like `Option<T>` or `Pair<Int, Str>`, resolve the dict
 * names needed for each type parameter of the referenced type.
 *
 * - If a type arg is a primitive → dict is "Int_Eq", "Str_Eq", etc.
 * - If a type arg is a type variable matching our type params → dict is "__ring_T_Eq"
 * - If a type arg is a struct/enum in known set → dict is "TypeName_Eq"
 *   (and recursively resolve its own extra_dicts — but for the dict name
 *    at this level we just need the top-level dict name)
 *
 * Returns null if any type arg is not derivable.
 */
function resolve_extra_dicts(
  _env: TypeEnv,
  type_args: Type[],
  type_param_vars: number[],
  type_param_names: string[],
  trait_name: string,
  known: Set<string>,
  self_type_name: string,
  bounds: { type_param: string; trait_name: string }[],
): string[] | null {
  const dicts: string[] = [];
  for (const arg of type_args) {
    const dict = resolve_type_arg_dict(
      arg, type_param_vars, type_param_names,
      trait_name, known, self_type_name, bounds,
    );
    if (dict === null) return null;
    dicts.push(dict);
  }
  return dicts;
}

/**
 * Resolve a single type argument to its dict name.
 */
function resolve_type_arg_dict(
  arg: Type,
  type_param_vars: number[],
  type_param_names: string[],
  trait_name: string,
  known: Set<string>,
  self_type_name: string,
  bounds: { type_param: string; trait_name: string }[],
): string | null {
  switch (arg.kind) {
    case "int": return trait_dict_name("Int", trait_name);
    case "float": return trait_dict_name("Float", trait_name);
    case "str": return trait_dict_name("Str", trait_name);
    case "bool": return trait_dict_name("Bool", trait_name);
    case "unit": return trait_dict_name("Unit", trait_name);

    case "var": {
      const param_idx = type_param_vars.indexOf(arg.id);
      if (param_idx === -1) return null;
      const param_name = type_param_names[param_idx];
      // Ensure the bound is registered
      if (!bounds.some(b => b.type_param === param_name && b.trait_name === trait_name)) {
        bounds.push({ type_param: param_name, trait_name });
      }
      return trait_bound_param_name(param_name, trait_name);
    }

    case "struct":
    case "enum": {
      const name = arg.name;
      if (name === self_type_name || known.has(name)) {
        return trait_dict_name(name, trait_name);
      }
      return null;
    }

    default:
      return null;
  }
}

// ================================================================
// Register derived impl in environment
// ================================================================

function register_derived_impl(
  env: TypeEnv,
  impl: DerivedImpl,
  trait_name: string,
): void {
  // Add ImplEntry to env.trait_impls
  env.trait_impls.push({
    trait_name,
    target_type_name: impl.type_name,
    type_params: impl.type_params,
    method_names: get_method_names(trait_name),
  });

  // Create method TypeSchemes and register in env.impl_methods
  let methods = env.impl_methods.get(impl.type_name);
  if (!methods) {
    methods = new Map();
    env.impl_methods.set(impl.type_name, methods);
  }

  // Build self type
  const type_var_ids: number[] = [];
  const self_type_params: Type[] = [];
  for (let i = 0; i < impl.type_params.length; i++) {
    const var_id = env.fresh_var_id();
    type_var_ids.push(var_id);
    self_type_params.push({ kind: "var", id: var_id });
  }

  const self_type = build_self_type(env, impl.type_name, impl.type_kind, self_type_params);

  // Build bounds from DerivedImpl bounds
  const scheme_bounds: { type_var: number; trait_name: string }[] = [];
  for (const b of impl.bounds) {
    const param_idx = impl.type_params.indexOf(b.type_param);
    if (param_idx !== -1) {
      scheme_bounds.push({ type_var: type_var_ids[param_idx], trait_name: b.trait_name });
    }
  }

  // Register trait-specific methods
  register_trait_methods(methods, trait_name, self_type, type_var_ids, scheme_bounds);
}

function get_method_names(trait_name: string): string[] {
  switch (trait_name) {
    case "Eq": return ["eq", "ne"];
    case "Clone": return ["clone"];
    case "Debug": return ["debug"];
    case "Ord": return ["cmp"];
    default: return [];
  }
}

function build_self_type(
  env: TypeEnv,
  type_name: string,
  type_kind: "struct" | "enum",
  type_params: Type[],
): Type {
  if (type_kind === "struct") {
    const def = env.structs.get(type_name);
    return {
      kind: "struct",
      name: type_name,
      type_params,
      fields: def ? def.fields.map(f => ({ name: f.name, type: f.type, is_pub: f.is_pub })) : [],
    };
  }
  // enum
  const def = env.enums.get(type_name);
  return {
    kind: "enum",
    name: type_name,
    type_params,
    variants: def ? def.variants.map(v => ({ name: v.name, fields: v.fields, field_names: v.field_names })) : [],
  };
}

function register_trait_methods(
  methods: Map<string, import("./env.js").TypeScheme>,
  trait_name: string,
  self_type: Type,
  type_var_ids: number[],
  bounds: { type_var: number; trait_name: string }[],
): void {
  switch (trait_name) {
    case "Eq": {
      const eq_fn: FnType = {
        kind: "fn", params: [self_type, self_type], return_type: BOOL, effects: EMPTY_ROW,
      };
      methods.set("eq", { type: eq_fn, type_vars: type_var_ids, bounds });
      const ne_fn: FnType = {
        kind: "fn", params: [self_type, self_type], return_type: BOOL, effects: EMPTY_ROW,
      };
      methods.set("ne", { type: ne_fn, type_vars: type_var_ids, bounds });
      break;
    }
    case "Clone": {
      const clone_fn: FnType = {
        kind: "fn", params: [self_type], return_type: self_type, effects: EMPTY_ROW,
      };
      methods.set("clone", { type: clone_fn, type_vars: type_var_ids, bounds });
      break;
    }
    case "Ord": {
      const cmp_fn: FnType = {
        kind: "fn", params: [self_type, self_type], return_type: INT, effects: EMPTY_ROW,
      };
      methods.set("cmp", { type: cmp_fn, type_vars: type_var_ids, bounds });
      break;
    }
    case "Debug": {
      const debug_fn: FnType = {
        kind: "fn", params: [self_type], return_type: STR, effects: EMPTY_ROW,
      };
      methods.set("debug", { type: debug_fn, type_vars: type_var_ids, bounds });
      break;
    }
  }
}
