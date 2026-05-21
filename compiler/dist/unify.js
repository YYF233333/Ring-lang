import { __EffectAbort, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_first, List_last, List_contains, List_is_empty, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_is_empty, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_is_empty, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, FnBound as env$FnBound, Scope as env$Scope, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __ImplEntry_Clone as env$__ImplEntry_Clone, __FnBound_Clone as env$__FnBound_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __ImplEntry_Debug as env$__ImplEntry_Debug, __FnBound_Debug as env$__FnBound_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";

class UnificationError {
  constructor(message, is_occurs_check) {
    this.message = message;
    this.is_occurs_check = is_occurs_check;
  }
}

function empty_subst() {
  return map_new();
}

function unify_error(t1, t2, detail, __ring_ev_fail) {
  const base = `Type mismatch: cannot unify ${types$type_to_string(t1)} with ${types$type_to_string(t2)}`;
  const msg = (function() {
  const __ring_m = detail;
  if (__ring_m._tag === "some") { const d = __ring_m._0; return `${base} — ${d}`; }
  if (__ring_m._tag === "none") { return base; }
  __match_fail(__ring_m);
})();
  return __ring_ev_fail.raise(new UnificationError(msg, false));
}

function unify_error_occurs(t1, t2, __ring_ev_fail) {
  const msg = `Type mismatch: cannot unify ${types$type_to_string(t1)} with ${types$type_to_string(t2)} — infinite type (occurs check)`;
  return __ring_ev_fail.raise(new UnificationError(msg, true));
}

function unify_error_msg(detail, __ring_ev_fail) {
  return __ring_ev_fail.raise(new UnificationError(detail, false));
}

function occurs_in(var_id, t, subst) {
  const resolved = env$apply_subst(subst, t);
  __ring_match0: {
    const __ring_m0 = resolved;
    if (__ring_m0._tag === "IntType") {
      return false;
      break __ring_match0;
    }
    if (__ring_m0._tag === "FloatType") {
      return false;
      break __ring_match0;
    }
    if (__ring_m0._tag === "StrType") {
      return false;
      break __ring_match0;
    }
    if (__ring_m0._tag === "BoolType") {
      return false;
      break __ring_match0;
    }
    if (__ring_m0._tag === "UnitType") {
      return false;
      break __ring_match0;
    }
    if (__ring_m0._tag === "NeverType") {
      return false;
      break __ring_match0;
    }
    if (__ring_m0._tag === "AnyType") {
      return false;
      break __ring_match0;
    }
    if (__ring_m0._tag === "TypeVar") {
      const id = __ring_m0.id;
      return (id === var_id);
      break __ring_match0;
    }
    if (__ring_m0._tag === "FnType") {
      const params = __ring_m0.params; const return_type = __ring_m0.return_type; const effects = __ring_m0.effects;
      return ((params.some((function(p) { return occurs_in(var_id, p, subst); })) || occurs_in(var_id, return_type, subst)) || occurs_in_row(var_id, effects, subst));
      break __ring_match0;
    }
    if (__ring_m0._tag === "StructType") {
      const type_params = __ring_m0.type_params;
      return type_params.some((function(p) { return occurs_in(var_id, p, subst); }));
      break __ring_match0;
    }
    if (__ring_m0._tag === "EnumType") {
      const type_params = __ring_m0.type_params;
      return type_params.some((function(p) { return occurs_in(var_id, p, subst); }));
      break __ring_match0;
    }
    if (__ring_m0._tag === "GenericType") {
      const base = __ring_m0.base; const args = __ring_m0.args;
      return (occurs_in(var_id, base, subst) || args.some((function(a) { return occurs_in(var_id, a, subst); })));
      break __ring_match0;
    }
    if (__ring_m0._tag === "RecordType") {
      const fields = __ring_m0.fields; const tail = __ring_m0.tail;
      const in_tail = (function() {
  const __ring_m = tail;
  if (__ring_m._tag === "some") { const t_id = __ring_m._0; return occurs_in(var_id, types$Type_TypeVar(t_id, Option_none), subst); }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
      return (in_tail || fields.some((function(f) { return occurs_in(var_id, f.ty, subst); })));
      break __ring_match0;
    }
    if (__ring_m0._tag === "EffectRowType") {
      const effects = __ring_m0.effects; const tail = __ring_m0.tail;
      return occurs_in_row(var_id, new types$EffectRow(effects, tail), subst);
      break __ring_match0;
    }
    if (__ring_m0._tag === "TupleType") {
      const elements = __ring_m0.elements;
      return elements.some((function(e) { return occurs_in(var_id, e, subst); }));
      break __ring_match0;
    }
    __match_fail(__ring_m0);
  }
}

function occurs_in_row(var_id, row, subst) {
  const in_tail = (function() {
  const __ring_m = row.tail;
  if (__ring_m._tag === "some") { const t_id = __ring_m._0; return occurs_in(var_id, types$Type_TypeVar(t_id, Option_none), subst); }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
  return (in_tail || row.effects.some((function(e) { return occurs_in_effect(var_id, e, subst); })));
}

function occurs_in_effect(var_id, e, subst) {
  __ring_match1: {
    const __ring_m1 = e;
    if (__ring_m1._tag === "FailEffect") {
      const error_type = __ring_m1.error_type;
      return occurs_in(var_id, error_type, subst);
      break __ring_match1;
    }
    if (__ring_m1._tag === "CustomEffect") {
      const type_args = __ring_m1.type_args;
      return type_args.some((function(a) { return occurs_in(var_id, a, subst); }));
      break __ring_match1;
    }
    return false;
    break __ring_match1;
  }
}

function effects_match_kind(a, b) {
  __ring_match2: {
    const __ring_m2 = a;
    if (__ring_m2._tag === "IoEffect") {
      __ring_match3: {
        const __ring_m3 = b;
        if (__ring_m3._tag === "IoEffect") {
          return true;
          break __ring_match3;
        }
        return false;
        break __ring_match3;
      }
      break __ring_match2;
    }
    if (__ring_m2._tag === "MutEffect") {
      __ring_match4: {
        const __ring_m4 = b;
        if (__ring_m4._tag === "MutEffect") {
          return true;
          break __ring_match4;
        }
        return false;
        break __ring_match4;
      }
      break __ring_match2;
    }
    if (__ring_m2._tag === "FailEffect") {
      __ring_match5: {
        const __ring_m5 = b;
        if (__ring_m5._tag === "FailEffect") {
          return true;
          break __ring_match5;
        }
        return false;
        break __ring_match5;
      }
      break __ring_match2;
    }
    if (__ring_m2._tag === "CustomEffect") {
      const na = __ring_m2.name;
      __ring_match6: {
        const __ring_m6 = b;
        if (__ring_m6._tag === "CustomEffect") {
          const nb = __ring_m6.name;
          return (na === nb);
          break __ring_match6;
        }
        return false;
        break __ring_match6;
      }
      break __ring_match2;
    }
    __match_fail(__ring_m2);
  }
}

function effect_kind_name(e) {
  __ring_match7: {
    const __ring_m7 = e;
    if (__ring_m7._tag === "IoEffect") {
      return "io";
      break __ring_match7;
    }
    if (__ring_m7._tag === "MutEffect") {
      return "mut";
      break __ring_match7;
    }
    if (__ring_m7._tag === "FailEffect") {
      return "fail";
      break __ring_match7;
    }
    if (__ring_m7._tag === "CustomEffect") {
      const name = __ring_m7.name;
      return name;
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
}

function unify_effect_params(a, b, subst, env, __ring_ev_fail) {
  __ring_match8: {
    const __ring_m8 = [a, b];
    if (Array.isArray(__ring_m8) && __ring_m8.length === 2 && __ring_m8[0]._tag === "FailEffect" && __ring_m8[1]._tag === "FailEffect") {
      const et_a = __ring_m8[0].error_type; const et_b = __ring_m8[1].error_type;
      return unify(et_a, et_b, subst, env, __ring_ev_fail);
      break __ring_match8;
    }
    if (Array.isArray(__ring_m8) && __ring_m8.length === 2 && __ring_m8[0]._tag === "CustomEffect" && __ring_m8[1]._tag === "CustomEffect") {
      const name = __ring_m8[0].name; const ta_a = __ring_m8[0].type_args; const ta_b = __ring_m8[1].type_args;
      if ((List_len(ta_a) !== List_len(ta_b))) {
        unify_error_msg(`effect '${name}' type argument count mismatch: ${List_len(ta_a)} vs ${List_len(ta_b)}`, __ring_ev_fail);
      }
      let s = subst;
      let i = 0;
      while ((i < List_len(ta_a))) {
        s = unify(Option_unwrap_or(List_get(ta_a, i), types$UNIT()), Option_unwrap_or(List_get(ta_b, i), types$UNIT()), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      return s;
      break __ring_match8;
    }
    return subst;
    break __ring_match8;
  }
}

function filter_by_index_not_in(effects, excluded) {
  let result = [];
  let idx = 0;
  for (const e of effects) {
    if ((!_Set_contains(excluded, idx))) {
      List_push(result, e);
    }
    idx = (idx + 1);
  }
  return result;
}

function unify_effect_rows(a, b, subst, env, __ring_ev_fail) {
  let s = subst;
  const ra = env$apply_subst_row(s, a);
  const rb = env$apply_subst_row(s, b);
  const a_matched = set_new();
  const b_matched = set_new();
  let ai = 0;
  while ((ai < List_len(ra.effects))) {
    let bi = 0;
    while ((bi < List_len(rb.effects))) {
      if ((!_Set_contains(b_matched, bi))) {
        __ring_match9: {
          const __ring_m9 = [List_get(ra.effects, ai), List_get(rb.effects, bi)];
          if (Array.isArray(__ring_m9) && __ring_m9.length === 2 && __ring_m9[0]._tag === "some" && __ring_m9[1]._tag === "some") {
            const eff_a = __ring_m9[0]._0; const eff_b = __ring_m9[1]._0;
            if (effects_match_kind(eff_a, eff_b)) {
              s = unify_effect_params(eff_a, eff_b, s, env, __ring_ev_fail);
              _Set_insert(a_matched, ai);
              _Set_insert(b_matched, bi);
              break;
            }
            break __ring_match9;
          }
          break __ring_match9;
        }
      }
      bi = (bi + 1);
    }
    ai = (ai + 1);
  }
  const a_unmatched = filter_by_index_not_in(ra.effects, a_matched);
  const b_unmatched = filter_by_index_not_in(rb.effects, b_matched);
  if (((List_len(a_unmatched) > 0) && Option_is_none(rb.tail))) {
    const names = List_join(a_unmatched.map((function(e) { return effect_kind_name(e); })), ", ");
    unify_error_msg(`effect mismatch: effects [${names}] not allowed in pure context`, __ring_ev_fail);
  }
  if (((List_len(b_unmatched) > 0) && Option_is_none(ra.tail))) {
    const names = List_join(b_unmatched.map((function(e) { return effect_kind_name(e); })), ", ");
    unify_error_msg(`effect mismatch: effects [${names}] not allowed in pure context`, __ring_ev_fail);
  }
  __ring_match10: {
    const __ring_m10 = [ra.tail, rb.tail];
    if (Array.isArray(__ring_m10) && __ring_m10.length === 2 && __ring_m10[0]._tag === "some" && __ring_m10[1]._tag === "some") {
      const ta = __ring_m10[0]._0; const tb = __ring_m10[1]._0;
      if ((ta === tb)) {
      } else {
        if (((List_len(a_unmatched) === 0) && (List_len(b_unmatched) === 0))) {
          s = unify(types$Type_TypeVar(ta, Option_none), types$Type_TypeVar(tb, Option_none), s, env, __ring_ev_fail);
        } else {
          const fresh = env$TypeEnv_fresh_var_id(env);
          if ((List_len(b_unmatched) > 0)) {
            const row_for_a_tail = types$Type_EffectRowType(b_unmatched, Option_some(fresh));
            if (occurs_in(ta, row_for_a_tail, s)) {
              unify_error_msg("infinite type in effect row variable", __ring_ev_fail);
            }
            const new_s = map_clone(s);
            _Map_insert(new_s, ta, row_for_a_tail);
            s = new_s;
          } else {
            s = unify(types$Type_TypeVar(ta, Option_none), types$Type_TypeVar(fresh, Option_none), s, env, __ring_ev_fail);
          }
          if ((List_len(a_unmatched) > 0)) {
            const row_for_b_tail = types$Type_EffectRowType(a_unmatched, Option_some(fresh));
            if (occurs_in(tb, row_for_b_tail, s)) {
              unify_error_msg("infinite type in effect row variable", __ring_ev_fail);
            }
            const new_s = map_clone(s);
            _Map_insert(new_s, tb, row_for_b_tail);
            s = new_s;
          } else {
            s = unify(types$Type_TypeVar(tb, Option_none), types$Type_TypeVar(fresh, Option_none), s, env, __ring_ev_fail);
          }
        }
      }
      break __ring_match10;
    }
    break __ring_match10;
  }
  return s;
}

function unify_record_rows(ra, rb, subst, env, __ring_ev_fail) {
  __ring_match11: {
    const __ring_m11 = [ra, rb];
    if (Array.isArray(__ring_m11) && __ring_m11.length === 2 && __ring_m11[0]._tag === "RecordType" && __ring_m11[1]._tag === "RecordType") {
      const a_fields = __ring_m11[0].fields; const a_tail = __ring_m11[0].tail; const b_fields = __ring_m11[1].fields; const b_tail = __ring_m11[1].tail;
      let s = subst;
      const b_name_set = set_new();
      for (const f of b_fields) {
        _Set_insert(b_name_set, f.name);
      }
      const a_name_set = set_new();
      for (const f of a_fields) {
        _Set_insert(a_name_set, f.name);
      }
      for (const af of a_fields) {
        const bf = ((__a) => { const __i = __a.findIndex((function(f) { return (f.name === af.name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(b_fields);
        __ring_match12: {
          const __ring_m12 = bf;
          if (__ring_m12._tag === "some") {
            const matched = __ring_m12._0;
            s = unify(af.ty, matched.ty, s, env, __ring_ev_fail);
            break __ring_match12;
          }
          if (__ring_m12._tag === "none") {
            break __ring_match12;
          }
          __match_fail(__ring_m12);
        }
      }
      const a_only = a_fields.filter((function(f) { return (!_Set_contains(b_name_set, f.name)); }));
      const b_only = b_fields.filter((function(f) { return (!_Set_contains(a_name_set, f.name)); }));
      if (((List_len(a_only) > 0) && Option_is_none(b_tail))) {
        const missing = List_join(a_only.map((function(f) { return f.name; })), ", ");
        unify_error(ra, rb, Option_some(`record missing fields: ${missing}`), __ring_ev_fail);
      }
      if (((List_len(b_only) > 0) && Option_is_none(a_tail))) {
        const missing = List_join(b_only.map((function(f) { return f.name; })), ", ");
        unify_error(ra, rb, Option_some(`record missing fields: ${missing}`), __ring_ev_fail);
      }
      if (((((List_len(a_only) > 0) && (List_len(b_only) > 0)) && Option_is_some(a_tail)) && Option_is_some(b_tail))) {
        __ring_match13: {
          const __ring_m13 = [a_tail, b_tail];
          if (Array.isArray(__ring_m13) && __ring_m13.length === 2 && __ring_m13[0]._tag === "some" && __ring_m13[1]._tag === "some") {
            const ta = __ring_m13[0]._0; const tb = __ring_m13[1]._0;
            const fresh_tail = env$TypeEnv_fresh_var_id(env);
            const a_tail_record = types$Type_RecordType(b_only, Option_some(fresh_tail), Option_none);
            const b_tail_record = types$Type_RecordType(a_only, Option_some(fresh_tail), Option_none);
            if (occurs_in(ta, a_tail_record, s)) {
              unify_error(ra, rb, Option_some("infinite type in row variable"), __ring_ev_fail);
            }
            if (occurs_in(tb, b_tail_record, s)) {
              unify_error(ra, rb, Option_some("infinite type in row variable"), __ring_ev_fail);
            }
            const new_s = map_clone(s);
            _Map_insert(new_s, ta, a_tail_record);
            _Map_insert(new_s, tb, b_tail_record);
            s = new_s;
            break __ring_match13;
          }
          break __ring_match13;
        }
      } else {
        __ring_match14: {
          const __ring_m14 = a_tail;
          if (__ring_m14._tag === "some") {
            const ta = __ring_m14._0;
            if ((List_len(b_only) > 0)) {
              const record_for_tail = types$Type_RecordType(b_only, Option_none, Option_none);
              if (occurs_in(ta, record_for_tail, s)) {
                unify_error(ra, rb, Option_some("infinite type in row variable"), __ring_ev_fail);
              }
              const new_s = map_clone(s);
              _Map_insert(new_s, ta, record_for_tail);
              s = new_s;
            }
            break __ring_match14;
          }
          if (__ring_m14._tag === "none") {
            break __ring_match14;
          }
          __match_fail(__ring_m14);
        }
        __ring_match15: {
          const __ring_m15 = b_tail;
          if (__ring_m15._tag === "some") {
            const tb = __ring_m15._0;
            if ((List_len(a_only) > 0)) {
              const record_for_tail = types$Type_RecordType(a_only, Option_none, Option_none);
              if (occurs_in(tb, record_for_tail, s)) {
                unify_error(ra, rb, Option_some("infinite type in row variable"), __ring_ev_fail);
              }
              const new_s = map_clone(s);
              _Map_insert(new_s, tb, record_for_tail);
              s = new_s;
            }
            break __ring_match15;
          }
          if (__ring_m15._tag === "none") {
            break __ring_match15;
          }
          __match_fail(__ring_m15);
        }
        __ring_match16: {
          const __ring_m16 = [a_tail, b_tail];
          if (Array.isArray(__ring_m16) && __ring_m16.length === 2 && __ring_m16[0]._tag === "some" && __ring_m16[1]._tag === "some") {
            const ta = __ring_m16[0]._0; const tb = __ring_m16[1]._0;
            if ((((List_len(a_only) === 0) && (List_len(b_only) === 0)) && (ta !== tb))) {
              s = unify(types$Type_TypeVar(ta, Option_none), types$Type_TypeVar(tb, Option_none), s, env, __ring_ev_fail);
            }
            break __ring_match16;
          }
          break __ring_match16;
        }
      }
      return s;
      break __ring_match11;
    }
    return panic("unify_record_rows: expected RecordType");
    break __ring_match11;
  }
}

function unify_struct_with_record(st, rt, subst, env, __ring_ev_fail) {
  __ring_match17: {
    const __ring_m17 = [st, rt];
    if (Array.isArray(__ring_m17) && __ring_m17.length === 2 && __ring_m17[0]._tag === "StructType" && __ring_m17[1]._tag === "RecordType") {
      const name = __ring_m17[0].name; const struct_fields = __ring_m17[0].fields; const record_fields = __ring_m17[1].fields; const record_tail = __ring_m17[1].tail;
      let s = subst;
      for (const rf of record_fields) {
        const sf = ((__a) => { const __i = __a.findIndex((function(f) { return (f.name === rf.name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(struct_fields);
        __ring_match18: {
          const __ring_m18 = sf;
          if (__ring_m18._tag === "some") {
            const matched = __ring_m18._0;
            s = unify(matched.ty, rf.ty, s, env, __ring_ev_fail);
            break __ring_match18;
          }
          if (__ring_m18._tag === "none") {
            const field_names = List_join(record_fields.map((function(f) { return f.name; })), ", ");
            unify_error(st, rt, Option_some(`type '${name}' does not satisfy {${field_names}, ..} — missing field '${rf.name}'`), __ring_ev_fail);
            break __ring_match18;
          }
          __match_fail(__ring_m18);
        }
      }
      __ring_match19: {
        const __ring_m19 = record_tail;
        if (__ring_m19._tag === "some") {
          const tail_id = __ring_m19._0;
          const remaining = struct_fields.filter((function(sf) { return (!record_fields.some((function(rf) { return (rf.name === sf.name); }))); }));
          const remaining_mapped = remaining.map((function(f) { return new types$RecordField(f.name, env$apply_subst(s, f.ty)); }));
          const tail_record = types$Type_RecordType(remaining_mapped, Option_none, Option_none);
          if (occurs_in(tail_id, tail_record, s)) {
            unify_error(st, rt, Option_some("infinite type in row variable"), __ring_ev_fail);
          }
          const new_s = map_clone(s);
          _Map_insert(new_s, tail_id, tail_record);
          s = new_s;
          break __ring_match19;
        }
        if (__ring_m19._tag === "none") {
          break __ring_match19;
        }
        __match_fail(__ring_m19);
      }
      return s;
      break __ring_match17;
    }
    return panic("unify_struct_with_record: expected StructType and RecordType");
    break __ring_match17;
  }
}

function is_any(t) {
  __ring_match20: {
    const __ring_m20 = t;
    if (__ring_m20._tag === "AnyType") {
      return true;
      break __ring_match20;
    }
    return false;
    break __ring_match20;
  }
}

function is_never(t) {
  __ring_match21: {
    const __ring_m21 = t;
    if (__ring_m21._tag === "NeverType") {
      return true;
      break __ring_match21;
    }
    return false;
    break __ring_match21;
  }
}

function var_id(t) {
  __ring_match22: {
    const __ring_m22 = t;
    if (__ring_m22._tag === "TypeVar") {
      const id = __ring_m22.id;
      return Option_some(id);
      break __ring_match22;
    }
    return Option_none;
    break __ring_match22;
  }
}

function bind_var(id, target, t1, t2, subst, __ring_ev_fail) {
  if (occurs_in(id, target, subst)) {
    unify_error_occurs(t1, t2, __ring_ev_fail);
  }
  const result = map_clone(subst);
  _Map_insert(result, id, target);
  return result;
}

function unify(t1, t2, subst, env, __ring_ev_fail) {
  const a = env$apply_subst(subst, t1);
  const b = env$apply_subst(subst, t2);
  if ((is_any(a) || is_any(b))) {
    return subst;
  }
  const va = var_id(a);
  const vb = var_id(b);
  __ring_match23: {
    const __ring_m23 = [va, vb];
    if (Array.isArray(__ring_m23) && __ring_m23.length === 2 && __ring_m23[0]._tag === "some" && __ring_m23[1]._tag === "some") {
      const ia = __ring_m23[0]._0; const ib = __ring_m23[1]._0;
      if ((ia === ib)) {
        return subst;
      }
      break __ring_match23;
    }
    break __ring_match23;
  }
  __ring_match24: {
    const __ring_m24 = va;
    if (__ring_m24._tag === "some") {
      const id = __ring_m24._0;
      return bind_var(id, b, t1, t2, subst, __ring_ev_fail);
      break __ring_match24;
    }
    if (__ring_m24._tag === "none") {
      break __ring_match24;
    }
    __match_fail(__ring_m24);
  }
  __ring_match25: {
    const __ring_m25 = vb;
    if (__ring_m25._tag === "some") {
      const id = __ring_m25._0;
      return bind_var(id, a, t1, t2, subst, __ring_ev_fail);
      break __ring_match25;
    }
    if (__ring_m25._tag === "none") {
      break __ring_match25;
    }
    __match_fail(__ring_m25);
  }
  if ((is_never(a) || is_never(b))) {
    return subst;
  }
  __ring_match26: {
    const __ring_m26 = [a, b];
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "IntType" && __ring_m26[1]._tag === "IntType") {
      return subst;
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "FloatType" && __ring_m26[1]._tag === "FloatType") {
      return subst;
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "StrType" && __ring_m26[1]._tag === "StrType") {
      return subst;
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "BoolType" && __ring_m26[1]._tag === "BoolType") {
      return subst;
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "UnitType" && __ring_m26[1]._tag === "UnitType") {
      return subst;
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "FnType" && __ring_m26[1]._tag === "FnType") {
      const pa = __ring_m26[0].params; const ra = __ring_m26[0].return_type; const ea = __ring_m26[0].effects; const pb = __ring_m26[1].params; const rb = __ring_m26[1].return_type; const eb = __ring_m26[1].effects;
      if ((List_len(pa) !== List_len(pb))) {
        unify_error(t1, t2, Option_some(`parameter count mismatch: ${List_len(pa)} vs ${List_len(pb)}`), __ring_ev_fail);
      }
      let s = subst;
      let i = 0;
      while ((i < List_len(pa))) {
        s = unify(Option_unwrap_or(List_get(pa, i), types$UNIT()), Option_unwrap_or(List_get(pb, i), types$UNIT()), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      s = unify(ra, rb, s, env, __ring_ev_fail);
      s = unify_effect_rows(ea, eb, s, env, __ring_ev_fail);
      return s;
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "StructType" && __ring_m26[1]._tag === "StructType") {
      const na = __ring_m26[0].name; const tpa = __ring_m26[0].type_params; const nb = __ring_m26[1].name; const tpb = __ring_m26[1].type_params;
      if ((na !== nb)) {
        unify_error(t1, t2, Option_some("different struct types"), __ring_ev_fail);
      }
      if ((List_len(tpa) !== List_len(tpb))) {
        unify_error(t1, t2, Option_some(`different type parameter counts for struct '${na}'`), __ring_ev_fail);
      }
      let s = subst;
      let i = 0;
      while ((i < List_len(tpa))) {
        s = unify(Option_unwrap_or(List_get(tpa, i), types$UNIT()), Option_unwrap_or(List_get(tpb, i), types$UNIT()), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      return s;
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "EnumType" && __ring_m26[1]._tag === "EnumType") {
      const na = __ring_m26[0].name; const tpa = __ring_m26[0].type_params; const nb = __ring_m26[1].name; const tpb = __ring_m26[1].type_params;
      if ((na !== nb)) {
        unify_error(t1, t2, Option_some("different enum types"), __ring_ev_fail);
      }
      if ((List_len(tpa) !== List_len(tpb))) {
        unify_error(t1, t2, Option_some(`different type parameter counts for enum '${na}'`), __ring_ev_fail);
      }
      let s = subst;
      let i = 0;
      while ((i < List_len(tpa))) {
        s = unify(Option_unwrap_or(List_get(tpa, i), types$UNIT()), Option_unwrap_or(List_get(tpb, i), types$UNIT()), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      return s;
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "GenericType" && __ring_m26[1]._tag === "GenericType") {
      const ba = __ring_m26[0].base; const aa = __ring_m26[0].args; const bb = __ring_m26[1].base; const ab = __ring_m26[1].args;
      let s = unify(ba, bb, subst, env, __ring_ev_fail);
      if ((List_len(aa) !== List_len(ab))) {
        unify_error(t1, t2, Option_some("different type argument counts"), __ring_ev_fail);
      }
      let i = 0;
      while ((i < List_len(aa))) {
        s = unify(Option_unwrap_or(List_get(aa, i), types$UNIT()), Option_unwrap_or(List_get(ab, i), types$UNIT()), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      return s;
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "RecordType" && __ring_m26[1]._tag === "RecordType") {
      return unify_record_rows(a, b, subst, env, __ring_ev_fail);
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "EffectRowType" && __ring_m26[1]._tag === "EffectRowType") {
      const ea = __ring_m26[0].effects; const ta = __ring_m26[0].tail; const eb = __ring_m26[1].effects; const tb = __ring_m26[1].tail;
      return unify_effect_rows(new types$EffectRow(ea, ta), new types$EffectRow(eb, tb), subst, env, __ring_ev_fail);
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "TupleType" && __ring_m26[1]._tag === "TupleType") {
      const ea = __ring_m26[0].elements; const eb = __ring_m26[1].elements;
      if ((List_len(ea) !== List_len(eb))) {
        unify_error(t1, t2, Option_some(`tuple arity mismatch: ${List_len(ea)} vs ${List_len(eb)}`), __ring_ev_fail);
      }
      let s = subst;
      let i = 0;
      while ((i < List_len(ea))) {
        s = unify(Option_unwrap_or(List_get(ea, i), types$UNIT()), Option_unwrap_or(List_get(eb, i), types$UNIT()), s, env, __ring_ev_fail);
        i = (i + 1);
      }
      return s;
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "StructType" && __ring_m26[1]._tag === "RecordType") {
      return unify_struct_with_record(a, b, subst, env, __ring_ev_fail);
      break __ring_match26;
    }
    if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "RecordType" && __ring_m26[1]._tag === "StructType") {
      return unify_struct_with_record(b, a, subst, env, __ring_ev_fail);
      break __ring_match26;
    }
    return unify_error(t1, t2, Option_none, __ring_ev_fail);
    break __ring_match26;
  }
}

function __UnificationError_Eq_eq(self, other) {
  return (self.message === other.message) && (self.is_occurs_check === other.is_occurs_check);
}
const __UnificationError_Eq = { eq: __UnificationError_Eq_eq, ne: function(self, other) { return !__UnificationError_Eq_eq(self, other); } };

function __UnificationError_Clone_clone(self) {
  return new UnificationError(self.message, self.is_occurs_check);
}
const __UnificationError_Clone = { clone: __UnificationError_Clone_clone };

function __UnificationError_Ord_cmp(self, other) {
  var c;
  c = (self.message < other.message ? -1 : self.message > other.message ? 1 : 0);
  if (c !== 0) return c;
  return (self.is_occurs_check < other.is_occurs_check ? -1 : self.is_occurs_check > other.is_occurs_check ? 1 : 0);
}
const __UnificationError_Ord = { cmp: __UnificationError_Ord_cmp };

function __UnificationError_Debug_debug(self) {
  return "UnificationError { " + "message: " + String(self.message) + ", " + "is_occurs_check: " + String(self.is_occurs_check) + " }";
}
const __UnificationError_Debug = { debug: __UnificationError_Debug_debug };


export { UnificationError, empty_subst, occurs_in, unify_effect_rows, unify, __UnificationError_Eq, __UnificationError_Clone, __UnificationError_Ord, __UnificationError_Debug };