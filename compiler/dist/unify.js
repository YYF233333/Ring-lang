import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { new_union_find as union_find$new_union_find, uf_bind as union_find$uf_bind, uf_find as union_find$uf_find, uf_insert as union_find$uf_insert, uf_lookup as union_find$uf_lookup, uf_union as union_find$uf_union, UnionFind as union_find$UnionFind } from "./union_find.js";
import { add_impl as env$add_impl, apply_subst as env$apply_subst, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_map as env$apply_subst_map, apply_subst_row as env$apply_subst_row, apply_subst_row_map as env$apply_subst_row_map, find_impl as env$find_impl, has_impl as env$has_impl, lookup_variant as env$lookup_variant, mono as env$mono, new_type_env as env$new_type_env, AssocConstraintEntry as env$AssocConstraintEntry, AssocTypeDef as env$AssocTypeDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectAliasDef as env$EffectAliasDef, EffectDef as env$EffectDef, EffectOpDef as env$EffectOpDef, EnumDef as env$EnumDef, FnBound as env$FnBound, IdGen as env$IdGen, ImplEntry as env$ImplEntry, SchemeBound as env$SchemeBound, Scope as env$Scope, ScopeManager as env$ScopeManager, SigDef as env$SigDef, StructDef as env$StructDef, TraitDef as env$TraitDef, TraitMethodDef as env$TraitMethodDef, TraitRegistry as env$TraitRegistry, TypeAliasDef as env$TypeAliasDef, TypeEnv as env$TypeEnv, TypeRegistry as env$TypeRegistry, TypeScheme as env$TypeScheme, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __BuiltInKind_Debug as env$__BuiltInKind_Debug, __FnBound_Eq as env$__FnBound_Eq, __FnBound_Clone as env$__FnBound_Clone, __FnBound_Ord as env$__FnBound_Ord, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Eq as env$__IdGen_Eq, __IdGen_Clone as env$__IdGen_Clone, __IdGen_Ord as env$__IdGen_Ord, __IdGen_Debug as env$__IdGen_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";



function List_is_empty(self) {
  return (List_len(self) === 0);
}
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

function List_sort(self, __ring_T_Ord) {
  return self.sort((function(a, b) { return ((__ring_T_Ord.cmp(a, b) < 0) ? (-1) : ((__ring_T_Ord.cmp(a, b) > 0) ? 1 : 0)); }));
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

function Result_and_then(self, f) {
  __ring_match1: {
    const __ring_m1 = self;
    if (__ring_m1._tag === "Ok") {
      const v = __ring_m1._0;
      return f(v);
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
function Result_is_err(self) {
  __ring_match2: {
    const __ring_m2 = self;
    if (__ring_m2._tag === "Ok") {
      return false;
      break __ring_match2;
    }
    if (__ring_m2._tag === "Err") {
      return true;
      break __ring_match2;
    }
    __match_fail(__ring_m2);
  }
}
function Result_is_ok(self) {
  __ring_match3: {
    const __ring_m3 = self;
    if (__ring_m3._tag === "Ok") {
      return true;
      break __ring_match3;
    }
    if (__ring_m3._tag === "Err") {
      return false;
      break __ring_match3;
    }
    __match_fail(__ring_m3);
  }
}
function Result_map(self, f) {
  __ring_match4: {
    const __ring_m4 = self;
    if (__ring_m4._tag === "Ok") {
      const v = __ring_m4._0;
      return Result_Ok(f(v));
      break __ring_match4;
    }
    if (__ring_m4._tag === "Err") {
      const e = __ring_m4._0;
      return Result_Err(e);
      break __ring_match4;
    }
    __match_fail(__ring_m4);
  }
}
function Result_unwrap_or(self, _default) {
  __ring_match5: {
    const __ring_m5 = self;
    if (__ring_m5._tag === "Ok") {
      const v = __ring_m5._0;
      return v;
      break __ring_match5;
    }
    if (__ring_m5._tag === "Err") {
      return _default;
      break __ring_match5;
    }
    __match_fail(__ring_m5);
  }
}

function to_result(f) {
  return (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Result_Ok(f()); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { const e = __ring_err; return Result_Err(e); } else { throw __ring_e; } } throw __ring_e; } })();
}

class UnificationError {
  constructor(message, is_occurs_check) {
    this.message = message;
    this.is_occurs_check = is_occurs_check;
  }
}

function occurs_in_effect(var_id, e, subst) {
  __ring_match6: {
    const __ring_m6 = e;
    if (__ring_m6._tag === "FailEffect") {
      const error_type = __ring_m6.error_type;
      return occurs_in(var_id, error_type, subst);
      break __ring_match6;
    }
    if (__ring_m6._tag === "MutEffect") {
      const state_type = __ring_m6.state_type;
      return occurs_in(var_id, state_type, subst);
      break __ring_match6;
    }
    if (__ring_m6._tag === "CustomEffect") {
      const type_args = __ring_m6.type_args;
      return type_args.some((function(a) { return occurs_in(var_id, a, subst); }));
      break __ring_match6;
    }
    return false;
    break __ring_match6;
  }
}

function occurs_in_row(var_id, row, subst) {
  let __ring_blk0;
  __ring_match7: {
    const __ring_m7 = row.tail;
    if (__ring_m7._tag === "some") {
      const t_id = __ring_m7._0;
      __ring_blk0 = occurs_in(var_id, types$Type_TypeVar(t_id, Option_none), subst);
      break __ring_match7;
    }
    if (__ring_m7._tag === "none") {
      __ring_blk0 = false;
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
  const in_tail = __ring_blk0;
  if (in_tail) {
    return true;
  } else {
    return row.effects.some((function(e) { return occurs_in_effect(var_id, e, subst); }));
  }
}

function occurs_in(var_id, t, subst) {
  const resolved = env$apply_subst(subst, t);
  __ring_match8: {
    const __ring_m8 = resolved;
    if (__ring_m8._tag === "IntType") {
      return false;
      break __ring_match8;
    }
    if (__ring_m8._tag === "FloatType") {
      return false;
      break __ring_match8;
    }
    if (__ring_m8._tag === "StrType") {
      return false;
      break __ring_match8;
    }
    if (__ring_m8._tag === "BoolType") {
      return false;
      break __ring_match8;
    }
    if (__ring_m8._tag === "UnitType") {
      return false;
      break __ring_match8;
    }
    if (__ring_m8._tag === "NeverType") {
      return false;
      break __ring_match8;
    }
    if (__ring_m8._tag === "AnyType") {
      return false;
      break __ring_match8;
    }
    if (__ring_m8._tag === "ErrorType") {
      return false;
      break __ring_match8;
    }
    if (__ring_m8._tag === "TypeVar") {
      const id = __ring_m8.id;
      return (id === var_id);
      break __ring_match8;
    }
    if (__ring_m8._tag === "FnType") {
      const params = __ring_m8.params; const return_type = __ring_m8.return_type; const effects = __ring_m8.effects;
      if ((params.some((function(p) { return occurs_in(var_id, p, subst); })) ? true : occurs_in(var_id, return_type, subst))) {
        return true;
      } else {
        return occurs_in_row(var_id, effects, subst);
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "StructType") {
      const type_params = __ring_m8.type_params;
      return type_params.some((function(p) { return occurs_in(var_id, p, subst); }));
      break __ring_match8;
    }
    if (__ring_m8._tag === "EnumType") {
      const type_params = __ring_m8.type_params;
      return type_params.some((function(p) { return occurs_in(var_id, p, subst); }));
      break __ring_match8;
    }
    if (__ring_m8._tag === "GenericType") {
      const base = __ring_m8.base; const args = __ring_m8.args;
      if (occurs_in(var_id, base, subst)) {
        return true;
      } else {
        return args.some((function(a) { return occurs_in(var_id, a, subst); }));
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "RecordType") {
      const fields = __ring_m8.fields; const tail = __ring_m8.tail;
      let __ring_blk1;
      __ring_match9: {
        const __ring_m9 = tail;
        if (__ring_m9._tag === "some") {
          const t_id = __ring_m9._0;
          __ring_blk1 = occurs_in(var_id, types$Type_TypeVar(t_id, Option_none), subst);
          break __ring_match9;
        }
        if (__ring_m9._tag === "none") {
          __ring_blk1 = false;
          break __ring_match9;
        }
        __match_fail(__ring_m9);
      }
      const in_tail = __ring_blk1;
      if (in_tail) {
        return true;
      } else {
        return fields.some((function(f) { return occurs_in(var_id, f.ty, subst); }));
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "EffectRowType") {
      const effects = __ring_m8.effects; const tail = __ring_m8.tail;
      return occurs_in_row(var_id, new types$EffectRow(effects, tail), subst);
      break __ring_match8;
    }
    if (__ring_m8._tag === "TupleType") {
      const elements = __ring_m8.elements;
      return elements.some((function(e) { return occurs_in(var_id, e, subst); }));
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
}

function unify_error_occurs(t1, t2, __ring_ev_fail) {
  const msg = `Type mismatch: cannot unify ${types$type_to_string(t1)} with ${types$type_to_string(t2)} — infinite type (occurs check)`;
  return __ring_ev_fail.raise(new UnificationError(msg, true));
}

function bind_var(id, target, t1, t2, subst, __ring_ev_fail) {
  if (occurs_in(id, target, subst)) {
    unify_error_occurs(t1, t2, __ring_ev_fail);
  }
  union_find$uf_bind(subst, id, target);
  return subst;
}

function empty_subst() {
  return union_find$new_union_find();
}

function filter_by_index_not_in(effects, excluded) {
  let result = [];
  let idx = 0;
  const __ring_iter_2 = __List_Iterable.iter(effects);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const e = __ring_next_2._0;
    if ((!_Set_contains(excluded, idx, __Int_Eq))) {
      List_push(result, e);
    }
    idx = (idx + 1);
  }
  return result;
}

function is_any(t) {
  __ring_match10: {
    const __ring_m10 = t;
    if (__ring_m10._tag === "AnyType") {
      return true;
      break __ring_match10;
    }
    return false;
    break __ring_match10;
  }
}

function is_never(t) {
  __ring_match11: {
    const __ring_m11 = t;
    if (__ring_m11._tag === "NeverType") {
      return true;
      break __ring_match11;
    }
    return false;
    break __ring_match11;
  }
}

function unify_error_msg(detail, __ring_ev_fail) {
  return __ring_ev_fail.raise(new UnificationError(detail, false));
}

function unify_error(t1, t2, detail, __ring_ev_fail) {
  const base = `Type mismatch: cannot unify ${types$type_to_string(t1)} with ${types$type_to_string(t2)}`;
  let __ring_blk2;
  __ring_match12: {
    const __ring_m12 = detail;
    if (__ring_m12._tag === "some") {
      const d = __ring_m12._0;
      __ring_blk2 = `${base} — ${d}`;
      break __ring_match12;
    }
    if (__ring_m12._tag === "none") {
      __ring_blk2 = base;
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
  const msg = __ring_blk2;
  return __ring_ev_fail.raise(new UnificationError(msg, false));
}

function var_id(t) {
  __ring_match13: {
    const __ring_m13 = t;
    if (__ring_m13._tag === "TypeVar") {
      const id = __ring_m13.id;
      return Option_some(id);
      break __ring_match13;
    }
    return Option_none;
    break __ring_match13;
  }
}

function unify_struct_with_record(st, rt, subst, env, __ring_ev_fail) {
  __ring_match14: {
    const __ring_m14 = [st, rt];
    if (Array.isArray(__ring_m14) && __ring_m14.length === 2 && __ring_m14[0]._tag === "StructType" && __ring_m14[1]._tag === "RecordType") {
      const name = __ring_m14[0].name; const struct_fields = __ring_m14[0].fields; const record_fields = __ring_m14[1].fields; const record_tail = __ring_m14[1].tail;
      let s = {value: subst};
      const __ring_iter_3 = __List_Iterable.iter(record_fields);
      while (true) {
        const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
        if (__ring_next_3._tag === "none") break;
        const rf = __ring_next_3._0;
        const sf = ((__a) => { const __i = __a.findIndex((function(f) { return (f.name === rf.name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(struct_fields);
        __ring_match15: {
          const __ring_m15 = sf;
          if (__ring_m15._tag === "some") {
            const matched = __ring_m15._0;
            s.value = unify(matched.ty, rf.ty, s.value, env, __ring_ev_fail);
            break __ring_match15;
          }
          if (__ring_m15._tag === "none") {
            const field_names = List_join(record_fields.map((function(f) { return f.name; })), ", ");
            unify_error(st, rt, Option_some(`type '${name}' does not satisfy {${field_names}, ..} — missing field '${rf.name}'`), __ring_ev_fail);
            break __ring_match15;
          }
          __match_fail(__ring_m15);
        }
      }
      __ring_match16: {
        const __ring_m16 = record_tail;
        if (__ring_m16._tag === "some") {
          const tail_id = __ring_m16._0;
          const remaining = struct_fields.filter((function(sf) { return (!record_fields.some((function(rf) { return (rf.name === sf.name); }))); }));
          const remaining_mapped = remaining.map((function(f) { return new types$RecordField(f.name, env$apply_subst(s.value, f.ty)); }));
          const tail_record = types$Type_RecordType(remaining_mapped, Option_none, Option_none);
          if (occurs_in(tail_id, tail_record, s.value)) {
            unify_error(st, rt, Option_some("infinite type in row variable"), __ring_ev_fail);
          }
          union_find$uf_insert(s.value, tail_id, tail_record);
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      return s.value;
      break __ring_match14;
    }
    return panic("unreachable: unify_struct_with_record expected StructType and RecordType");
    break __ring_match14;
  }
}

function unify_record_rows(ra, rb, subst, env, __ring_ev_fail) {
  __ring_match17: {
    const __ring_m17 = [ra, rb];
    if (Array.isArray(__ring_m17) && __ring_m17.length === 2 && __ring_m17[0]._tag === "RecordType" && __ring_m17[1]._tag === "RecordType") {
      const a_fields = __ring_m17[0].fields; const a_tail = __ring_m17[0].tail; const b_fields = __ring_m17[1].fields; const b_tail = __ring_m17[1].tail;
      let s = subst;
      let b_name_set = {value: set_new()};
      const __ring_iter_4 = __List_Iterable.iter(b_fields);
      while (true) {
        const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
        if (__ring_next_4._tag === "none") break;
        const f = __ring_next_4._0;
        _Set_insert(b_name_set.value, f.name);
      }
      let a_name_set = {value: set_new()};
      const __ring_iter_5 = __List_Iterable.iter(a_fields);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const f = __ring_next_5._0;
        _Set_insert(a_name_set.value, f.name);
      }
      const __ring_iter_6 = __List_Iterable.iter(a_fields);
      while (true) {
        const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
        if (__ring_next_6._tag === "none") break;
        const af = __ring_next_6._0;
        const bf = ((__a) => { const __i = __a.findIndex((function(f) { return (f.name === af.name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(b_fields);
        __ring_match18: {
          const __ring_m18 = bf;
          if (__ring_m18._tag === "some") {
            const matched = __ring_m18._0;
            s = unify(af.ty, matched.ty, s, env, __ring_ev_fail);
            break __ring_match18;
          }
          if (__ring_m18._tag === "none") {
            break __ring_match18;
          }
          __match_fail(__ring_m18);
        }
      }
      const a_only = a_fields.filter((function(f) { return (!_Set_contains(b_name_set.value, f.name, __Str_Eq)); }));
      const b_only = b_fields.filter((function(f) { return (!_Set_contains(a_name_set.value, f.name, __Str_Eq)); }));
      if (((List_len(a_only) > 0) ? Option_is_none(b_tail) : false)) {
        const missing = List_join(a_only.map((function(f) { return f.name; })), ", ");
        unify_error(ra, rb, Option_some(`record missing fields: ${missing}`), __ring_ev_fail);
      }
      if (((List_len(b_only) > 0) ? Option_is_none(a_tail) : false)) {
        const missing = List_join(b_only.map((function(f) { return f.name; })), ", ");
        unify_error(ra, rb, Option_some(`record missing fields: ${missing}`), __ring_ev_fail);
      }
      if (((((List_len(a_only) > 0) ? (List_len(b_only) > 0) : false) ? Option_is_some(a_tail) : false) ? Option_is_some(b_tail) : false)) {
        __ring_match19: {
          const __ring_m19 = [a_tail, b_tail];
          if (Array.isArray(__ring_m19) && __ring_m19.length === 2 && __ring_m19[0]._tag === "some" && __ring_m19[1]._tag === "some") {
            const ta = __ring_m19[0]._0; const tb = __ring_m19[1]._0;
            const fresh_tail = env$TypeEnv_fresh_var_id(env);
            const a_tail_record = types$Type_RecordType(b_only, Option_some(fresh_tail), Option_none);
            const b_tail_record = types$Type_RecordType(a_only, Option_some(fresh_tail), Option_none);
            if (occurs_in(ta, a_tail_record, s)) {
              unify_error(ra, rb, Option_some("infinite type in row variable"), __ring_ev_fail);
            }
            if (occurs_in(tb, b_tail_record, s)) {
              unify_error(ra, rb, Option_some("infinite type in row variable"), __ring_ev_fail);
            }
            union_find$uf_insert(s, ta, a_tail_record);
            union_find$uf_insert(s, tb, b_tail_record);
            break __ring_match19;
          }
          break __ring_match19;
        }
      } else {
        __ring_match20: {
          const __ring_m20 = a_tail;
          if (__ring_m20._tag === "some") {
            const ta = __ring_m20._0;
            if ((List_len(b_only) > 0)) {
              const record_for_tail = types$Type_RecordType(b_only, Option_none, Option_none);
              if (occurs_in(ta, record_for_tail, s)) {
                unify_error(ra, rb, Option_some("infinite type in row variable"), __ring_ev_fail);
              }
              union_find$uf_insert(s, ta, record_for_tail);
            }
            break __ring_match20;
          }
          if (__ring_m20._tag === "none") {
            break __ring_match20;
          }
          __match_fail(__ring_m20);
        }
        __ring_match21: {
          const __ring_m21 = b_tail;
          if (__ring_m21._tag === "some") {
            const tb = __ring_m21._0;
            if ((List_len(a_only) > 0)) {
              const record_for_tail = types$Type_RecordType(a_only, Option_none, Option_none);
              if (occurs_in(tb, record_for_tail, s)) {
                unify_error(ra, rb, Option_some("infinite type in row variable"), __ring_ev_fail);
              }
              union_find$uf_insert(s, tb, record_for_tail);
            }
            break __ring_match21;
          }
          if (__ring_m21._tag === "none") {
            break __ring_match21;
          }
          __match_fail(__ring_m21);
        }
        __ring_match22: {
          const __ring_m22 = [a_tail, b_tail];
          if (Array.isArray(__ring_m22) && __ring_m22.length === 2 && __ring_m22[0]._tag === "some" && __ring_m22[1]._tag === "some") {
            const ta = __ring_m22[0]._0; const tb = __ring_m22[1]._0;
            if ((((List_len(a_only) === 0) ? (List_len(b_only) === 0) : false) ? (ta !== tb) : false)) {
              s = unify(types$Type_TypeVar(ta, Option_none), types$Type_TypeVar(tb, Option_none), s, env, __ring_ev_fail);
            }
            break __ring_match22;
          }
          break __ring_match22;
        }
      }
      return s;
      break __ring_match17;
    }
    return panic("unreachable: unify_record_rows expected RecordType");
    break __ring_match17;
  }
}

function unify_effect_params(a, b, subst, env, __ring_ev_fail) {
  __ring_match23: {
    const __ring_m23 = [a, b];
    if (Array.isArray(__ring_m23) && __ring_m23.length === 2 && __ring_m23[0]._tag === "FailEffect" && __ring_m23[1]._tag === "FailEffect") {
      const et_a = __ring_m23[0].error_type; const et_b = __ring_m23[1].error_type;
      return unify(et_a, et_b, subst, env, __ring_ev_fail);
      break __ring_match23;
    }
    if (Array.isArray(__ring_m23) && __ring_m23.length === 2 && __ring_m23[0]._tag === "MutEffect" && __ring_m23[1]._tag === "MutEffect") {
      const sa = __ring_m23[0].state_type; const sb = __ring_m23[1].state_type;
      return unify(sa, sb, subst, env, __ring_ev_fail);
      break __ring_match23;
    }
    if (Array.isArray(__ring_m23) && __ring_m23.length === 2 && __ring_m23[0]._tag === "CustomEffect" && __ring_m23[1]._tag === "CustomEffect") {
      const name = __ring_m23[0].name; const ta_a = __ring_m23[0].type_args; const ta_b = __ring_m23[1].type_args;
      if ((List_len(ta_a) !== List_len(ta_b))) {
        unify_error_msg(`effect '${name}' type argument count mismatch: ${List_len(ta_a)} vs ${List_len(ta_b)}`, __ring_ev_fail);
      }
      let s = subst;
      let i = 0;
      while ((i < List_len(ta_a))) {
        s = unify(Option_unwrap_or(List_get(ta_a, i), types$UNIT), Option_unwrap_or(List_get(ta_b, i), types$UNIT), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      return s;
      break __ring_match23;
    }
    return subst;
    break __ring_match23;
  }
}

function unify_effect_rows(a, b, subst, env, __ring_ev_fail) {
  let s = subst;
  const ra = env$apply_subst_row(s, a);
  const rb = env$apply_subst_row(s, b);
  let a_matched = set_new();
  let b_matched = set_new();
  let ai = 0;
  while ((ai < List_len(ra.effects))) {
    let bi = 0;
    while ((bi < List_len(rb.effects))) {
      if ((!_Set_contains(b_matched, bi, __Int_Eq))) {
        __ring_match24: {
          const __ring_m24 = [List_get(ra.effects, ai), List_get(rb.effects, bi)];
          if (Array.isArray(__ring_m24) && __ring_m24.length === 2 && __ring_m24[0]._tag === "some" && __ring_m24[1]._tag === "some") {
            const eff_a = __ring_m24[0]._0; const eff_b = __ring_m24[1]._0;
            if (types$effects_match_kind(eff_a, eff_b)) {
              s = unify_effect_params(eff_a, eff_b, s, env, __ring_ev_fail);
              _Set_insert(a_matched, ai);
              _Set_insert(b_matched, bi);
              break;
            }
            break __ring_match24;
          }
          break __ring_match24;
        }
      }
      bi = (bi + 1);
    }
    ai = (ai + 1);
  }
  const a_unmatched = filter_by_index_not_in(ra.effects, a_matched);
  const b_unmatched = filter_by_index_not_in(rb.effects, b_matched);
  if (((List_len(a_unmatched) > 0) ? Option_is_none(rb.tail) : false)) {
    const names = List_join(a_unmatched.map((function(e) { return types$effect_kind_name(e); })), ", ");
    unify_error_msg(`effect mismatch: effects [${names}] not allowed in pure context`, __ring_ev_fail);
  }
  if (((List_len(b_unmatched) > 0) ? Option_is_none(ra.tail) : false)) {
    const names = List_join(b_unmatched.map((function(e) { return types$effect_kind_name(e); })), ", ");
    unify_error_msg(`effect mismatch: effects [${names}] not allowed in pure context`, __ring_ev_fail);
  }
  __ring_match25: {
    const __ring_m25 = [ra.tail, rb.tail];
    if (Array.isArray(__ring_m25) && __ring_m25.length === 2 && __ring_m25[0]._tag === "some" && __ring_m25[1]._tag === "some") {
      const ta = __ring_m25[0]._0; const tb = __ring_m25[1]._0;
      if ((ta === tb)) {
        if (((List_len(a_unmatched) > 0) ? true : (List_len(b_unmatched) > 0))) {
          const fresh = env$TypeEnv_fresh_var_id(env);
          let all_unmatched = [];
          const __ring_iter_7 = __List_Iterable.iter(a_unmatched);
          while (true) {
            const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
            if (__ring_next_7._tag === "none") break;
            const e = __ring_next_7._0;
            List_push(all_unmatched, e);
          }
          const __ring_iter_8 = __List_Iterable.iter(b_unmatched);
          while (true) {
            const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
            if (__ring_next_8._tag === "none") break;
            const e = __ring_next_8._0;
            List_push(all_unmatched, e);
          }
          const extended_row = types$Type_EffectRowType(all_unmatched, Option_some(fresh));
          if (occurs_in(ta, extended_row, s)) {
            unify_error_msg("infinite type in effect row variable", __ring_ev_fail);
          }
          union_find$uf_insert(s, ta, extended_row);
        }
      } else {
        if (((List_len(a_unmatched) === 0) ? (List_len(b_unmatched) === 0) : false)) {
          s = unify(types$Type_TypeVar(ta, Option_none), types$Type_TypeVar(tb, Option_none), s, env, __ring_ev_fail);
        } else {
          const fresh = env$TypeEnv_fresh_var_id(env);
          if ((List_len(b_unmatched) > 0)) {
            const row_for_a_tail = types$Type_EffectRowType(b_unmatched, Option_some(fresh));
            if (occurs_in(ta, row_for_a_tail, s)) {
              unify_error_msg("infinite type in effect row variable", __ring_ev_fail);
            }
            union_find$uf_insert(s, ta, row_for_a_tail);
          } else {
            s = unify(types$Type_TypeVar(ta, Option_none), types$Type_TypeVar(fresh, Option_none), s, env, __ring_ev_fail);
          }
          if ((List_len(a_unmatched) > 0)) {
            const row_for_b_tail = types$Type_EffectRowType(a_unmatched, Option_some(fresh));
            if (occurs_in(tb, row_for_b_tail, s)) {
              unify_error_msg("infinite type in effect row variable", __ring_ev_fail);
            }
            union_find$uf_insert(s, tb, row_for_b_tail);
          } else {
            s = unify(types$Type_TypeVar(tb, Option_none), types$Type_TypeVar(fresh, Option_none), s, env, __ring_ev_fail);
          }
        }
      }
      break __ring_match25;
    }
    if (Array.isArray(__ring_m25) && __ring_m25.length === 2 && __ring_m25[0]._tag === "none" && __ring_m25[1]._tag === "some") {
      const tb = __ring_m25[1]._0;
      if ((List_len(a_unmatched) > 0)) {
        const row_for_b_tail = types$Type_EffectRowType(a_unmatched, Option_none);
        if (occurs_in(tb, row_for_b_tail, s)) {
          unify_error_msg("infinite type in effect row variable", __ring_ev_fail);
        }
        union_find$uf_insert(s, tb, row_for_b_tail);
      }
      break __ring_match25;
    }
    if (Array.isArray(__ring_m25) && __ring_m25.length === 2 && __ring_m25[0]._tag === "some" && __ring_m25[1]._tag === "none") {
      const ta = __ring_m25[0]._0;
      if ((List_len(b_unmatched) > 0)) {
        const row_for_a_tail = types$Type_EffectRowType(b_unmatched, Option_none);
        if (occurs_in(ta, row_for_a_tail, s)) {
          unify_error_msg("infinite type in effect row variable", __ring_ev_fail);
        }
        union_find$uf_insert(s, ta, row_for_a_tail);
      }
      break __ring_match25;
    }
    if (Array.isArray(__ring_m25) && __ring_m25.length === 2 && __ring_m25[0]._tag === "none" && __ring_m25[1]._tag === "none") {
      break __ring_match25;
    }
    __match_fail(__ring_m25);
  }
  return s;
}

function unify(t1, t2, subst, env, __ring_ev_fail) {
  const a = env$apply_subst(subst, t1);
  const b = env$apply_subst(subst, t2);
  __ring_match26: {
    const __ring_m26 = a;
    if (__ring_m26._tag === "ErrorType") {
      return subst;
      break __ring_match26;
    }
    break __ring_match26;
  }
  __ring_match27: {
    const __ring_m27 = b;
    if (__ring_m27._tag === "ErrorType") {
      return subst;
      break __ring_match27;
    }
    break __ring_match27;
  }
  if ((is_any(a) ? true : is_any(b))) {
    return subst;
  }
  const va = var_id(a);
  const vb = var_id(b);
  __ring_match28: {
    const __ring_m28 = [va, vb];
    if (Array.isArray(__ring_m28) && __ring_m28.length === 2 && __ring_m28[0]._tag === "some" && __ring_m28[1]._tag === "some") {
      const ia = __ring_m28[0]._0; const ib = __ring_m28[1]._0;
      if ((ia === ib)) {
        return subst;
      }
      break __ring_match28;
    }
    break __ring_match28;
  }
  __ring_match29: {
    const __ring_m29 = va;
    if (__ring_m29._tag === "some") {
      const id = __ring_m29._0;
      return bind_var(id, b, t1, t2, subst, __ring_ev_fail);
      break __ring_match29;
    }
    if (__ring_m29._tag === "none") {
      break __ring_match29;
    }
    __match_fail(__ring_m29);
  }
  __ring_match30: {
    const __ring_m30 = vb;
    if (__ring_m30._tag === "some") {
      const id = __ring_m30._0;
      return bind_var(id, a, t1, t2, subst, __ring_ev_fail);
      break __ring_match30;
    }
    if (__ring_m30._tag === "none") {
      break __ring_match30;
    }
    __match_fail(__ring_m30);
  }
  if ((is_never(a) ? true : is_never(b))) {
    return subst;
  }
  __ring_match31: {
    const __ring_m31 = [a, b];
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "IntType" && __ring_m31[1]._tag === "IntType") {
      return subst;
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "FloatType" && __ring_m31[1]._tag === "FloatType") {
      return subst;
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "StrType" && __ring_m31[1]._tag === "StrType") {
      return subst;
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "BoolType" && __ring_m31[1]._tag === "BoolType") {
      return subst;
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "UnitType" && __ring_m31[1]._tag === "UnitType") {
      return subst;
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "FnType" && __ring_m31[1]._tag === "FnType") {
      const pa = __ring_m31[0].params; const ra = __ring_m31[0].return_type; const ea = __ring_m31[0].effects; const pb = __ring_m31[1].params; const rb = __ring_m31[1].return_type; const eb = __ring_m31[1].effects;
      if ((List_len(pa) !== List_len(pb))) {
        unify_error(t1, t2, Option_some(`parameter count mismatch: ${List_len(pa)} vs ${List_len(pb)}`), __ring_ev_fail);
      }
      let s = subst;
      let i = 0;
      while ((i < List_len(pa))) {
        s = unify(Option_unwrap_or(List_get(pa, i), types$UNIT), Option_unwrap_or(List_get(pb, i), types$UNIT), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      s = unify(ra, rb, s, env, __ring_ev_fail);
      s = unify_effect_rows(ea, eb, s, env, __ring_ev_fail);
      return s;
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "StructType" && __ring_m31[1]._tag === "StructType") {
      const na = __ring_m31[0].name; const tpa = __ring_m31[0].type_params; const nb = __ring_m31[1].name; const tpb = __ring_m31[1].type_params;
      if ((na !== nb)) {
        unify_error(t1, t2, Option_some("different struct types"), __ring_ev_fail);
      }
      if ((List_len(tpa) !== List_len(tpb))) {
        unify_error(t1, t2, Option_some(`different type parameter counts for struct '${na}'`), __ring_ev_fail);
      }
      let s = subst;
      let i = 0;
      while ((i < List_len(tpa))) {
        s = unify(Option_unwrap_or(List_get(tpa, i), types$UNIT), Option_unwrap_or(List_get(tpb, i), types$UNIT), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      return s;
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "EnumType" && __ring_m31[1]._tag === "EnumType") {
      const na = __ring_m31[0].name; const tpa = __ring_m31[0].type_params; const nb = __ring_m31[1].name; const tpb = __ring_m31[1].type_params;
      if ((na !== nb)) {
        unify_error(t1, t2, Option_some("different enum types"), __ring_ev_fail);
      }
      if ((List_len(tpa) !== List_len(tpb))) {
        unify_error(t1, t2, Option_some(`different type parameter counts for enum '${na}'`), __ring_ev_fail);
      }
      let s = subst;
      let i = 0;
      while ((i < List_len(tpa))) {
        s = unify(Option_unwrap_or(List_get(tpa, i), types$UNIT), Option_unwrap_or(List_get(tpb, i), types$UNIT), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      return s;
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "GenericType" && __ring_m31[1]._tag === "GenericType") {
      const ba = __ring_m31[0].base; const aa = __ring_m31[0].args; const bb = __ring_m31[1].base; const ab = __ring_m31[1].args;
      let s = unify(ba, bb, subst, env, __ring_ev_fail);
      if ((List_len(aa) !== List_len(ab))) {
        unify_error(t1, t2, Option_some("different type argument counts"), __ring_ev_fail);
      }
      let i = 0;
      while ((i < List_len(aa))) {
        s = unify(Option_unwrap_or(List_get(aa, i), types$UNIT), Option_unwrap_or(List_get(ab, i), types$UNIT), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      return s;
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "RecordType" && __ring_m31[1]._tag === "RecordType") {
      return unify_record_rows(a, b, subst, env, __ring_ev_fail);
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "EffectRowType" && __ring_m31[1]._tag === "EffectRowType") {
      const ea = __ring_m31[0].effects; const ta = __ring_m31[0].tail; const eb = __ring_m31[1].effects; const tb = __ring_m31[1].tail;
      return unify_effect_rows(new types$EffectRow(ea, ta), new types$EffectRow(eb, tb), subst, env, __ring_ev_fail);
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "TupleType" && __ring_m31[1]._tag === "TupleType") {
      const ea = __ring_m31[0].elements; const eb = __ring_m31[1].elements;
      if ((List_len(ea) !== List_len(eb))) {
        unify_error(t1, t2, Option_some(`tuple arity mismatch: ${List_len(ea)} vs ${List_len(eb)}`), __ring_ev_fail);
      }
      let s = subst;
      let i = 0;
      while ((i < List_len(ea))) {
        s = unify(Option_unwrap_or(List_get(ea, i), types$UNIT), Option_unwrap_or(List_get(eb, i), types$UNIT), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      return s;
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "StructType" && __ring_m31[1]._tag === "RecordType") {
      return unify_struct_with_record(a, b, subst, env, __ring_ev_fail);
      break __ring_match31;
    }
    if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "RecordType" && __ring_m31[1]._tag === "StructType") {
      return unify_struct_with_record(b, a, subst, env, __ring_ev_fail);
      break __ring_match31;
    }
    return unify_error(t1, t2, Option_none, __ring_ev_fail);
    break __ring_match31;
  }
}

function __UnificationError_Eq_eq(self, other) {
  return (self.message === other.message) && (self.is_occurs_check === other.is_occurs_check);
}
const __UnificationError_Eq = { eq: __UnificationError_Eq_eq, ne: function(self, other) { return !__UnificationError_Eq_eq(self, other); } };

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

function __UnificationError_Clone_clone(self) {
  return new UnificationError(self.message, self.is_occurs_check);
}
const __UnificationError_Clone = { clone: __UnificationError_Clone_clone };

function __Result_Clone_clone(self, __ring_T_Clone, __ring_E_Clone) {
  switch (self._tag) {
    case "Ok": return Result_Ok(__ring_T_Clone.clone(self._0));
    case "Err": return Result_Err(__ring_E_Clone.clone(self._0));
    default: return self;
  }
}
const __Result_Clone = { clone: __Result_Clone_clone };

function __UnificationError_Ord_cmp(self, other) {
  var c;
  c = (self.message < other.message ? -1 : self.message > other.message ? 1 : 0);
  if (c !== 0) return c;
  return (self.is_occurs_check < other.is_occurs_check ? -1 : self.is_occurs_check > other.is_occurs_check ? 1 : 0);
}
const __UnificationError_Ord = { cmp: __UnificationError_Ord_cmp };

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

function __UnificationError_Debug_debug(self) {
  return "UnificationError { " + "message: " + String(self.message) + ", " + "is_occurs_check: " + String(self.is_occurs_check) + " }";
}
const __UnificationError_Debug = { debug: __UnificationError_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { UnificationError, empty_subst, occurs_in, unify_effect_params, unify_effect_rows, unify, __UnificationError_Eq, __UnificationError_Clone, __UnificationError_Ord, __UnificationError_Debug };