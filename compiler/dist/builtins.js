import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { lookup_variant as env$lookup_variant, mono as env$mono, new_type_env as env$new_type_env, add_impl as env$add_impl, has_impl as env$has_impl, find_impl as env$find_impl, apply_subst_map as env$apply_subst_map, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, AssocConstraintEntry as env$AssocConstraintEntry, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, AssocTypeDef as env$AssocTypeDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, EffectAliasDef as env$EffectAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __FnBound_Eq as env$__FnBound_Eq, __FnBound_Clone as env$__FnBound_Clone, __FnBound_Ord as env$__FnBound_Ord, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Eq as env$__IdGen_Eq, __IdGen_Clone as env$__IdGen_Clone, __IdGen_Ord as env$__IdGen_Ord, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";



function List_first(self) {
  if (List_is_empty(self)) {
    return Option_none;
  }
  return List_get(self, 0);
}
function List_last(self) {
  if (List_is_empty(self)) {
    return Option_none;
  }
  return List_get(self, (List_len(self) - 1));
}
function List_is_empty(self) {
  return (List_len(self) === 0);
}

class ListIterator {
  constructor(list, index) {
    this.list = list;
    this.index = index;
  }
}

function __ListIterator_Iterator_next(self) {
  if ((self.index < List_len(self.list))) {
    const v = List_get(self.list, self.index);
    self.index = (self.index + 1);
    return v;
  } else {
    return Option_none;
  }
}
const __ListIterator_Iterator = { next: __ListIterator_Iterator_next };

function __List_Iterable_iter(self) {
  return new ListIterator(self, 0);
}
const __List_Iterable = { iter: __List_Iterable_iter };

function List_contains(self, item, __ring_T_Eq) {
  const __ring_iter_0 = __List_Iterable.iter(self);
  while (true) {
    const __ring_next_0 = __ListIterator_Iterator.next(__ring_iter_0);
    if (__ring_next_0._tag === "none") break;
    const x = __ring_next_0._0;
    if (__ring_T_Eq.eq(x, item)) {
      return true;
    }
  }
  return false;
}
function List_index_of(self, item, __ring_T_Eq) {
  let i = 0;
  while ((i < List_len(self))) {
    __ring_match0: {
      const __ring_m0 = List_get(self, i);
      if (__ring_m0._tag === "some") {
        const v = __ring_m0._0;
        if (__ring_T_Eq.eq(v, item)) {
          return Option_some(i);
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "none") {
        break __ring_match0;
      }
      __match_fail(__ring_m0);
    }
    i = (i + 1);
  }
  return Option_none;
}

class MapIterator {
  constructor(entries, index) {
    this.entries = entries;
    this.index = index;
  }
}

function __MapIterator_Iterator_next(self) {
  if ((self.index < List_len(self.entries))) {
    const v = List_get(self.entries, self.index);
    self.index = (self.index + 1);
    return v;
  } else {
    return Option_none;
  }
}
const __MapIterator_Iterator = { next: __MapIterator_Iterator_next };

function ___Map_Iterable_iter(self) {
  return new MapIterator(_Map_entries(self), 0);
}
const ___Map_Iterable = { iter: ___Map_Iterable_iter };

function _Map_is_empty(self) {
  return (_Map_len(self) === 0);
}

class SetIterator {
  constructor(items, index) {
    this.items = items;
    this.index = index;
  }
}

function __SetIterator_Iterator_next(self) {
  if ((self.index < List_len(self.items))) {
    const v = List_get(self.items, self.index);
    self.index = (self.index + 1);
    return v;
  } else {
    return Option_none;
  }
}
const __SetIterator_Iterator = { next: __SetIterator_Iterator_next };

function ___Set_Iterable_iter(self) {
  return new SetIterator(_Set_to_list(self), 0);
}
const ___Set_Iterable = { iter: ___Set_Iterable_iter };

function _Set_is_empty(self) {
  return (_Set_len(self) === 0);
}

function _Set_contains(self, item, __ring_T_Eq) {
  const items = _Set_to_list(self);
  const __ring_iter_1 = __List_Iterable.iter(items);
  while (true) {
    const __ring_next_1 = __ListIterator_Iterator.next(__ring_iter_1);
    if (__ring_next_1._tag === "none") break;
    const x = __ring_next_1._0;
    if (__ring_T_Eq.eq(x, item)) {
      return true;
    }
  }
  return false;
}
function _Set_has(self, item, __ring_T_Eq) {
  return _Set_contains(self, item, __ring_T_Eq);
}

function Result_Ok(_0) {
  return { _tag: "Ok", _0 };
}
function Result_Err(_0) {
  return { _tag: "Err", _0 };
}

function Result_map(self, f) {
  __ring_match1: {
    const __ring_m1 = self;
    if (__ring_m1._tag === "Ok") {
      const v = __ring_m1._0;
      return Result_Ok(f(v));
      break __ring_match1;
    }
    if (__ring_m1._tag === "Err") {
      const e = __ring_m1._0;
      return Result_Err(e);
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
}
function Result_and_then(self, f) {
  __ring_match2: {
    const __ring_m2 = self;
    if (__ring_m2._tag === "Ok") {
      const v = __ring_m2._0;
      return f(v);
      break __ring_match2;
    }
    if (__ring_m2._tag === "Err") {
      const e = __ring_m2._0;
      return Result_Err(e);
      break __ring_match2;
    }
    __match_fail(__ring_m2);
  }
}
function Result_unwrap_or(self, _default) {
  __ring_match3: {
    const __ring_m3 = self;
    if (__ring_m3._tag === "Ok") {
      const v = __ring_m3._0;
      return v;
      break __ring_match3;
    }
    if (__ring_m3._tag === "Err") {
      return _default;
      break __ring_match3;
    }
    __match_fail(__ring_m3);
  }
}
function Result_is_ok(self) {
  __ring_match4: {
    const __ring_m4 = self;
    if (__ring_m4._tag === "Ok") {
      return true;
      break __ring_match4;
    }
    if (__ring_m4._tag === "Err") {
      return false;
      break __ring_match4;
    }
    __match_fail(__ring_m4);
  }
}
function Result_is_err(self) {
  __ring_match5: {
    const __ring_m5 = self;
    if (__ring_m5._tag === "Ok") {
      return false;
      break __ring_match5;
    }
    if (__ring_m5._tag === "Err") {
      return true;
      break __ring_match5;
    }
    __match_fail(__ring_m5);
  }
}

function to_result(f) {
  return (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Result_Ok(f()); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { const e = __ring_err; return Result_Err(e); } else { throw __ring_e; } } throw __ring_e; } })();
}

class OpenRow {
  constructor(eff, tail_id) {
    this.eff = eff;
    this.tail_id = tail_id;
  }
}

function get_or_create_methods(env, type_name) {
  __ring_match6: {
    const __ring_m6 = _Map_get(env.trait_reg.impl_methods, type_name);
    if (__ring_m6._tag === "some") {
      const m = __ring_m6._0;
      return m;
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      const m = map_new();
      _Map_insert(env.trait_reg.impl_methods, type_name, m);
      return m;
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function open_row(env) {
  const tail_id = env$TypeEnv_fresh_var_id(env);
  return new OpenRow(new types$EffectRow([], Option_some(tail_id)), tail_id);
}

function make_list_struct(t) {
  return types$Type_StructType(types$BUILTIN_LIST, [t], []);
}

function make_set_struct(t) {
  return types$Type_StructType(types$BUILTIN_SET, [t], []);
}

function register_effects(env) {
  _Map_insert(env.types.effects, "io", new env$EffectDef("io", [], [], [new env$EffectOpDef("read", [types$STR], types$STR, false), new env$EffectOpDef("write", [types$STR, types$STR], types$UNIT, false)], Option_some(env$BuiltInKind_BkIo), false));
  const fail_t_id = env$TypeEnv_fresh_var_id(env);
  const fail_t = types$Type_TypeVar(fail_t_id, Option_none);
  return _Map_insert(env.types.effects, "fail", new env$EffectDef("fail", ["E"], [fail_t_id], [new env$EffectOpDef("raise", [fail_t], types$NEVER, false)], Option_some(env$BuiltInKind_BkFail), false));
}

function register_cell(env) {
  const cell_t_id = env$TypeEnv_fresh_var_id(env);
  const cell_t = types$Type_TypeVar(cell_t_id, Option_none);
  _Map_insert(env.types.structs, types$BUILTIN_CELL, new env$StructDef(types$BUILTIN_CELL, ["T"], [cell_t_id], [new types$StructField("value", cell_t, true)], false));
  const ctor_t_id = env$TypeEnv_fresh_var_id(env);
  const ctor_t = types$Type_TypeVar(ctor_t_id, Option_none);
  const ctor_ret = types$Type_StructType(types$BUILTIN_CELL, [ctor_t], [new types$StructField("value", ctor_t, true)]);
  env$TypeEnv_bind(env, types$BUILTIN_CELL, new env$TypeScheme(types$Type_FnType([ctor_t], ctor_ret, types$EMPTY_ROW), [ctor_t_id], [], Option_none));
  const m_t_id = env$TypeEnv_fresh_var_id(env);
  const m_t = types$Type_TypeVar(m_t_id, Option_none);
  const mut_row = new types$EffectRow([types$Effect_MutEffect(m_t)], Option_none);
  const self_type = types$Type_StructType(types$BUILTIN_CELL, [m_t], [new types$StructField("value", m_t, true)]);
  let methods = map_new();
  _Map_insert(methods, "get", new env$TypeScheme(types$Type_FnType([self_type], m_t, mut_row), [m_t_id], [], Option_none));
  _Map_insert(methods, "set", new env$TypeScheme(types$Type_FnType([self_type, m_t], types$UNIT, mut_row), [m_t_id], [], Option_none));
  const update_cb = types$Type_FnType([m_t], m_t, types$EMPTY_ROW);
  _Map_insert(methods, "update", new env$TypeScheme(types$Type_FnType([self_type, update_cb], types$UNIT, mut_row), [m_t_id], [], Option_none));
  return _Map_insert(env.trait_reg.impl_methods, types$BUILTIN_CELL, methods);
}

function register_option(env) {
  const option_t_id = env$TypeEnv_fresh_var_id(env);
  const option_t = types$Type_TypeVar(option_t_id, Option_none);
  let option_vi = map_new();
  _Map_insert(option_vi, "some", 0);
  _Map_insert(option_vi, "none", 1);
  _Map_insert(env.types.enums, types$BUILTIN_OPTION, new env$EnumDef(types$BUILTIN_OPTION, ["T"], [option_t_id], [new types$EnumVariant("some", [option_t], Option_none), new types$EnumVariant("none", [], Option_none)], option_vi));
  _Map_insert(env.types.variant_to_enum, "some", types$BUILTIN_OPTION);
  _Map_insert(env.types.variant_to_enum, "none", types$BUILTIN_OPTION);
  const some_t_id = env$TypeEnv_fresh_var_id(env);
  const some_t = types$Type_TypeVar(some_t_id, Option_none);
  env$TypeEnv_bind(env, "some", new env$TypeScheme(types$Type_FnType([some_t], types$make_option_type(some_t), types$EMPTY_ROW), [some_t_id], [], Option_none));
  const none_t_id = env$TypeEnv_fresh_var_id(env);
  const none_t = types$Type_TypeVar(none_t_id, Option_none);
  env$TypeEnv_bind(env, "none", new env$TypeScheme(types$make_option_type(none_t), [none_t_id], [], Option_none));
  let methods = get_or_create_methods(env, types$BUILTIN_OPTION);
  const t_id = env$TypeEnv_fresh_var_id(env);
  const t = types$Type_TypeVar(t_id, Option_none);
  const self_type = types$make_option_type(t);
  _Map_insert(methods, "is_some", new env$TypeScheme(types$Type_FnType([self_type], types$BOOL, types$EMPTY_ROW), [t_id], [], Option_none));
  _Map_insert(methods, "is_none", new env$TypeScheme(types$Type_FnType([self_type], types$BOOL, types$EMPTY_ROW), [t_id], [], Option_none));
  _Map_insert(methods, "unwrap_or", new env$TypeScheme(types$Type_FnType([self_type, t], t, types$EMPTY_ROW), [t_id], [], Option_none));
  _Map_insert(methods, "unwrap", new env$TypeScheme(types$Type_FnType([self_type], t, types$EMPTY_ROW), [t_id], [], Option_none));
  const e_id = env$TypeEnv_fresh_var_id(env);
  const e = types$Type_TypeVar(e_id, Option_none);
  const self_type2 = types$make_option_type(types$Type_TypeVar(t_id, Option_none));
  const fail_eff = types$Effect_FailEffect(e);
  return _Map_insert(methods, "to_fail", new env$TypeScheme(types$Type_FnType([self_type2, e], types$Type_TypeVar(t_id, Option_none), new types$EffectRow([fail_eff], Option_none)), [t_id, e_id], [], Option_none));
}

function register_eq_trait(env) {
  const self_var_id = env$TypeEnv_fresh_var_id(env);
  const self_var = types$Type_TypeVar(self_var_id, Option_none);
  const eq_fn = types$Type_FnType([self_var, self_var], types$BOOL, types$EMPTY_ROW);
  const ne_fn = types$Type_FnType([self_var, self_var], types$BOOL, types$EMPTY_ROW);
  _Map_insert(env.trait_reg.traits, "Eq", new env$TraitDef("Eq", [], [self_var_id], [new env$TraitMethodDef("eq", eq_fn, false, [false, false], []), new env$TraitMethodDef("ne", ne_fn, true, [false, false], [])], [], []));
  const __ring_iter_2 = __List_Iterable.iter(["Int", "Float", "Str", "Bool"]);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const prim = __ring_next_2._0;
    env$add_impl(env.trait_reg, new env$ImplEntry("Eq", prim, [], ["eq", "ne"], map_new()));
  }
}

function register_option_eq(env) {
  const t_id = env$TypeEnv_fresh_var_id(env);
  const t = types$Type_TypeVar(t_id, Option_none);
  const opt = types$make_option_type(t);
  let methods = get_or_create_methods(env, types$BUILTIN_OPTION);
  const eq_bounds = [new env$SchemeBound(t_id, "Eq", [])];
  _Map_insert(methods, "eq", new env$TypeScheme(types$Type_FnType([opt, opt], types$BOOL, types$EMPTY_ROW), [t_id], eq_bounds, Option_none));
  _Map_insert(methods, "ne", new env$TypeScheme(types$Type_FnType([opt, opt], types$BOOL, types$EMPTY_ROW), [t_id], [new env$SchemeBound(t_id, "Eq", [])], Option_none));
  return env$add_impl(env.trait_reg, new env$ImplEntry("Eq", types$BUILTIN_OPTION, ["T"], ["eq", "ne"], map_new()));
}

function register_clone_trait(env) {
  const self_var_id = env$TypeEnv_fresh_var_id(env);
  const self_var = types$Type_TypeVar(self_var_id, Option_none);
  const clone_fn = types$Type_FnType([self_var], self_var, types$EMPTY_ROW);
  _Map_insert(env.trait_reg.traits, "Clone", new env$TraitDef("Clone", [], [self_var_id], [new env$TraitMethodDef("clone", clone_fn, false, [false], [])], [], []));
  const __ring_iter_3 = __List_Iterable.iter(["Int", "Float", "Str", "Bool"]);
  while (true) {
    const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
    if (__ring_next_3._tag === "none") break;
    const prim = __ring_next_3._0;
    env$add_impl(env.trait_reg, new env$ImplEntry("Clone", prim, [], ["clone"], map_new()));
  }
  const __ring_iter_4 = __List_Iterable.iter(["List", "Map", "Set"]);
  while (true) {
    const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
    if (__ring_next_4._tag === "none") break;
    const coll = __ring_next_4._0;
    env$add_impl(env.trait_reg, new env$ImplEntry("Clone", coll, [], ["clone"], map_new()));
  }
}

function register_option_clone(env) {
  const t_id = env$TypeEnv_fresh_var_id(env);
  const t = types$Type_TypeVar(t_id, Option_none);
  const opt = types$make_option_type(t);
  let methods = get_or_create_methods(env, types$BUILTIN_OPTION);
  _Map_insert(methods, "clone", new env$TypeScheme(types$Type_FnType([opt], opt, types$EMPTY_ROW), [t_id], [new env$SchemeBound(t_id, "Clone", [])], Option_none));
  return env$add_impl(env.trait_reg, new env$ImplEntry("Clone", types$BUILTIN_OPTION, ["T"], ["clone"], map_new()));
}

function register_ord_trait(env) {
  const self_var_id = env$TypeEnv_fresh_var_id(env);
  const self_var = types$Type_TypeVar(self_var_id, Option_none);
  const cmp_fn = types$Type_FnType([self_var, self_var], types$INT, types$EMPTY_ROW);
  _Map_insert(env.trait_reg.traits, "Ord", new env$TraitDef("Ord", [], [self_var_id], [new env$TraitMethodDef("cmp", cmp_fn, false, [false, false], [])], [], []));
  const __ring_iter_5 = __List_Iterable.iter(["Int", "Float", "Str", "Bool"]);
  while (true) {
    const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
    if (__ring_next_5._tag === "none") break;
    const prim = __ring_next_5._0;
    env$add_impl(env.trait_reg, new env$ImplEntry("Ord", prim, [], ["cmp"], map_new()));
  }
}

function register_debug_trait(env) {
  const self_var_id = env$TypeEnv_fresh_var_id(env);
  const self_var = types$Type_TypeVar(self_var_id, Option_none);
  const debug_fn = types$Type_FnType([self_var], types$STR, types$EMPTY_ROW);
  _Map_insert(env.trait_reg.traits, "Debug", new env$TraitDef("Debug", [], [self_var_id], [new env$TraitMethodDef("debug", debug_fn, false, [false], [])], [], []));
  const __ring_iter_6 = __List_Iterable.iter(["Int", "Float", "Str", "Bool"]);
  while (true) {
    const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
    if (__ring_next_6._tag === "none") break;
    const prim = __ring_next_6._0;
    env$add_impl(env.trait_reg, new env$ImplEntry("Debug", prim, [], ["debug"], map_new()));
  }
  let t_id = env$TypeEnv_fresh_var_id(env);
  let t = types$Type_TypeVar(t_id, Option_none);
  const list_self = types$Type_StructType(types$BUILTIN_LIST, [t], []);
  const list_debug_fn = types$Type_FnType([list_self], types$STR, types$EMPTY_ROW);
  let list_methods = get_or_create_methods(env, types$BUILTIN_LIST);
  _Map_insert(list_methods, "debug", new env$TypeScheme(list_debug_fn, [t_id], [new env$SchemeBound(t_id, "Debug", [])], Option_none));
  env$add_impl(env.trait_reg, new env$ImplEntry("Debug", types$BUILTIN_LIST, ["T"], ["debug"], map_new()));
  const k_id = env$TypeEnv_fresh_var_id(env);
  const k = types$Type_TypeVar(k_id, Option_none);
  const v_id = env$TypeEnv_fresh_var_id(env);
  const v = types$Type_TypeVar(v_id, Option_none);
  const map_self = types$make_map_type(k, v);
  const map_debug_fn = types$Type_FnType([map_self], types$STR, types$EMPTY_ROW);
  let map_methods = get_or_create_methods(env, types$BUILTIN_MAP);
  _Map_insert(map_methods, "debug", new env$TypeScheme(map_debug_fn, [k_id, v_id], [], Option_none));
  env$add_impl(env.trait_reg, new env$ImplEntry("Debug", types$BUILTIN_MAP, ["K", "V"], ["debug"], map_new()));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  const set_self = types$Type_StructType(types$BUILTIN_SET, [t], []);
  const set_debug_fn = types$Type_FnType([set_self], types$STR, types$EMPTY_ROW);
  let set_methods = get_or_create_methods(env, types$BUILTIN_SET);
  _Map_insert(set_methods, "debug", new env$TypeScheme(set_debug_fn, [t_id], [], Option_none));
  return env$add_impl(env.trait_reg, new env$ImplEntry("Debug", types$BUILTIN_SET, ["T"], ["debug"], map_new()));
}

function register_option_debug(env) {
  const t_id = env$TypeEnv_fresh_var_id(env);
  const t = types$Type_TypeVar(t_id, Option_none);
  const opt = types$make_option_type(t);
  let methods = get_or_create_methods(env, types$BUILTIN_OPTION);
  _Map_insert(methods, "debug", new env$TypeScheme(types$Type_FnType([opt], types$STR, types$EMPTY_ROW), [t_id], [new env$SchemeBound(t_id, "Debug", [])], Option_none));
  return env$add_impl(env.trait_reg, new env$ImplEntry("Debug", types$BUILTIN_OPTION, ["T"], ["debug"], map_new()));
}

function register_mut_methods(env) {
  let list_mut = set_new();
  const __ring_iter_7 = __List_Iterable.iter(["push", "pop", "set", "extend", "reverse", "sort", "shift", "clear", "sort_by"]);
  while (true) {
    const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
    if (__ring_next_7._tag === "none") break;
    const m = __ring_next_7._0;
    _Set_insert(list_mut, m);
  }
  _Map_insert(env.trait_reg.mut_methods, "List", list_mut);
  let map_mut = set_new();
  const __ring_iter_8 = __List_Iterable.iter(["insert", "remove", "clear"]);
  while (true) {
    const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
    if (__ring_next_8._tag === "none") break;
    const m = __ring_next_8._0;
    _Set_insert(map_mut, m);
  }
  _Map_insert(env.trait_reg.mut_methods, "Map", map_mut);
  let set_mut = set_new();
  const __ring_iter_9 = __List_Iterable.iter(["insert", "remove", "clear"]);
  while (true) {
    const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
    if (__ring_next_9._tag === "none") break;
    const m = __ring_next_9._0;
    _Set_insert(set_mut, m);
  }
  return _Map_insert(env.trait_reg.mut_methods, "Set", set_mut);
}

function register_builtins(env) {
  register_effects(env);
  register_cell(env);
  register_option(env);
  register_eq_trait(env);
  register_option_eq(env);
  register_clone_trait(env);
  register_option_clone(env);
  register_ord_trait(env);
  register_debug_trait(env);
  register_option_debug(env);
  return register_mut_methods(env);
}

function register_list_hof(env) {
  let methods = get_or_create_methods(env, types$BUILTIN_LIST);
  let t_id = env$TypeEnv_fresh_var_id(env);
  let t = types$Type_TypeVar(t_id, Option_none);
  let u_id = env$TypeEnv_fresh_var_id(env);
  let u = types$Type_TypeVar(u_id, Option_none);
  let orow = open_row(env);
  let cb = types$Type_FnType([t], u, orow.eff);
  _Map_insert(methods, "map", new env$TypeScheme(types$Type_FnType([make_list_struct(t), cb], make_list_struct(u), orow.eff), [t_id, u_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([t], types$BOOL, orow.eff);
  _Map_insert(methods, "filter", new env$TypeScheme(types$Type_FnType([make_list_struct(t), cb], make_list_struct(t), orow.eff), [t_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  u_id = env$TypeEnv_fresh_var_id(env);
  u = types$Type_TypeVar(u_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([t], make_list_struct(u), orow.eff);
  _Map_insert(methods, "flat_map", new env$TypeScheme(types$Type_FnType([make_list_struct(t), cb], make_list_struct(u), orow.eff), [t_id, u_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  u_id = env$TypeEnv_fresh_var_id(env);
  u = types$Type_TypeVar(u_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([u, t], u, orow.eff);
  _Map_insert(methods, "fold", new env$TypeScheme(types$Type_FnType([make_list_struct(t), u, cb], u, orow.eff), [t_id, u_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([t], types$BOOL, orow.eff);
  _Map_insert(methods, "any", new env$TypeScheme(types$Type_FnType([make_list_struct(t), cb], types$BOOL, orow.eff), [t_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([t], types$BOOL, orow.eff);
  _Map_insert(methods, "all", new env$TypeScheme(types$Type_FnType([make_list_struct(t), cb], types$BOOL, orow.eff), [t_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([t], types$BOOL, orow.eff);
  _Map_insert(methods, "find", new env$TypeScheme(types$Type_FnType([make_list_struct(t), cb], types$make_option_type(t), orow.eff), [t_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([t], types$BOOL, orow.eff);
  _Map_insert(methods, "find_index", new env$TypeScheme(types$Type_FnType([make_list_struct(t), cb], types$make_option_type(types$INT), orow.eff), [t_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([t, t], types$INT, orow.eff);
  return _Map_insert(methods, "sort_by", new env$TypeScheme(types$Type_FnType([make_list_struct(t), cb], types$UNIT, orow.eff), [t_id, orow.tail_id], [], Option_none));
}

function register_map_hof(env) {
  let methods = get_or_create_methods(env, types$BUILTIN_MAP);
  let k_id = env$TypeEnv_fresh_var_id(env);
  let k = types$Type_TypeVar(k_id, Option_none);
  let v_id = env$TypeEnv_fresh_var_id(env);
  let v = types$Type_TypeVar(v_id, Option_none);
  let u_id = env$TypeEnv_fresh_var_id(env);
  let u = types$Type_TypeVar(u_id, Option_none);
  let orow = open_row(env);
  let cb = types$Type_FnType([v], u, orow.eff);
  _Map_insert(methods, "map_values", new env$TypeScheme(types$Type_FnType([types$make_map_type(k, v), cb], types$make_map_type(k, u), orow.eff), [k_id, v_id, u_id, orow.tail_id], [], Option_none));
  k_id = env$TypeEnv_fresh_var_id(env);
  k = types$Type_TypeVar(k_id, Option_none);
  v_id = env$TypeEnv_fresh_var_id(env);
  v = types$Type_TypeVar(v_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([k, v], types$BOOL, orow.eff);
  _Map_insert(methods, "filter", new env$TypeScheme(types$Type_FnType([types$make_map_type(k, v), cb], types$make_map_type(k, v), orow.eff), [k_id, v_id, orow.tail_id], [], Option_none));
  k_id = env$TypeEnv_fresh_var_id(env);
  k = types$Type_TypeVar(k_id, Option_none);
  v_id = env$TypeEnv_fresh_var_id(env);
  v = types$Type_TypeVar(v_id, Option_none);
  u_id = env$TypeEnv_fresh_var_id(env);
  u = types$Type_TypeVar(u_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([u, k, v], u, orow.eff);
  _Map_insert(methods, "fold", new env$TypeScheme(types$Type_FnType([types$make_map_type(k, v), u, cb], u, orow.eff), [k_id, v_id, u_id, orow.tail_id], [], Option_none));
  k_id = env$TypeEnv_fresh_var_id(env);
  k = types$Type_TypeVar(k_id, Option_none);
  v_id = env$TypeEnv_fresh_var_id(env);
  v = types$Type_TypeVar(v_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([k, v], types$BOOL, orow.eff);
  return _Map_insert(methods, "any", new env$TypeScheme(types$Type_FnType([types$make_map_type(k, v), cb], types$BOOL, orow.eff), [k_id, v_id, orow.tail_id], [], Option_none));
}

function register_set_hof(env) {
  let methods = get_or_create_methods(env, types$BUILTIN_SET);
  let t_id = env$TypeEnv_fresh_var_id(env);
  let t = types$Type_TypeVar(t_id, Option_none);
  let orow = open_row(env);
  let cb = types$Type_FnType([t], types$BOOL, orow.eff);
  _Map_insert(methods, "filter", new env$TypeScheme(types$Type_FnType([make_set_struct(t), cb], make_set_struct(t), orow.eff), [t_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  const u_id = env$TypeEnv_fresh_var_id(env);
  const u = types$Type_TypeVar(u_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([u, t], u, orow.eff);
  _Map_insert(methods, "fold", new env$TypeScheme(types$Type_FnType([make_set_struct(t), u, cb], u, orow.eff), [t_id, u_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([t], types$BOOL, orow.eff);
  _Map_insert(methods, "any", new env$TypeScheme(types$Type_FnType([make_set_struct(t), cb], types$BOOL, orow.eff), [t_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([t], types$BOOL, orow.eff);
  return _Map_insert(methods, "all", new env$TypeScheme(types$Type_FnType([make_set_struct(t), cb], types$BOOL, orow.eff), [t_id, orow.tail_id], [], Option_none));
}

function register_option_hof(env) {
  let methods = get_or_create_methods(env, types$BUILTIN_OPTION);
  let t_id = env$TypeEnv_fresh_var_id(env);
  let t = types$Type_TypeVar(t_id, Option_none);
  let u_id = env$TypeEnv_fresh_var_id(env);
  let u = types$Type_TypeVar(u_id, Option_none);
  let orow = open_row(env);
  let cb = types$Type_FnType([t], u, orow.eff);
  _Map_insert(methods, "map", new env$TypeScheme(types$Type_FnType([types$make_option_type(t), cb], types$make_option_type(u), orow.eff), [t_id, u_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  u_id = env$TypeEnv_fresh_var_id(env);
  u = types$Type_TypeVar(u_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([t], types$make_option_type(u), orow.eff);
  _Map_insert(methods, "and_then", new env$TypeScheme(types$Type_FnType([types$make_option_type(t), cb], types$make_option_type(u), orow.eff), [t_id, u_id, orow.tail_id], [], Option_none));
  t_id = env$TypeEnv_fresh_var_id(env);
  t = types$Type_TypeVar(t_id, Option_none);
  orow = open_row(env);
  cb = types$Type_FnType([], t, orow.eff);
  return _Map_insert(methods, "unwrap_or_else", new env$TypeScheme(types$Type_FnType([types$make_option_type(t), cb], t, orow.eff), [t_id, orow.tail_id], [], Option_none));
}

function register_hof_intrinsics(env) {
  register_list_hof(env);
  register_map_hof(env);
  register_set_hof(env);
  return register_option_hof(env);
}

function __Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return __ring_T_Eq.eq(self._0, other._0);
    case "Err": return __ring_E_Eq.eq(self._0, other._0);
    default: return true;
  }
}
const __Result_Eq = { eq: __Result_Eq_eq, ne: function(self, other, __ring_T_Eq, __ring_E_Eq) { return !__Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq); } };

function __ListIterator_Clone_clone(self, __ring_T_Clone) {
  return new ListIterator(__List_Clone.clone(self.list, __ring_T_Clone), self.index);
}
const __ListIterator_Clone = { clone: __ListIterator_Clone_clone };

function __SetIterator_Clone_clone(self, __ring_T_Clone) {
  return new SetIterator(__List_Clone.clone(self.items, __ring_T_Clone), self.index);
}
const __SetIterator_Clone = { clone: __SetIterator_Clone_clone };

function __Result_Clone_clone(self, __ring_T_Clone, __ring_E_Clone) {
  switch (self._tag) {
    case "Ok": return Result_Ok(__ring_T_Clone.clone(self._0));
    case "Err": return Result_Err(__ring_E_Clone.clone(self._0));
    default: return self;
  }
}
const __Result_Clone = { clone: __Result_Clone_clone };

const __Result_tag_order = { "Ok": 0, "Err": 1 };
function __Result_Ord_cmp(self, other, __ring_T_Ord, __ring_E_Ord) {
  var t1 = __Result_tag_order[self._tag];
  var t2 = __Result_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  switch (self._tag) {
    case "Ok": return __ring_T_Ord.cmp(self._0, other._0);
    case "Err": return __ring_E_Ord.cmp(self._0, other._0);
    default: return 0;
  }
}
const __Result_Ord = { cmp: __Result_Ord_cmp };

function __ListIterator_Debug_debug(self, __ring_T_Debug) {
  return "ListIterator { " + "list: " + __List_Debug.debug(self.list, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __ListIterator_Debug = { debug: __ListIterator_Debug_debug };

function __SetIterator_Debug_debug(self, __ring_T_Debug) {
  return "SetIterator { " + "items: " + __List_Debug.debug(self.items, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __SetIterator_Debug = { debug: __SetIterator_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { get_or_create_methods, register_builtins, register_hof_intrinsics };