import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst_map as env$apply_subst_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, EffectAliasDef as env$EffectAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __IdGen_Eq as env$__IdGen_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __ImplEntry_Clone as env$__ImplEntry_Clone, __FnBound_Clone as env$__FnBound_Clone, __IdGen_Clone as env$__IdGen_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __IdGen_Ord as env$__IdGen_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __ImplEntry_Debug as env$__ImplEntry_Debug, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";

function List_first(self) {
  return List_get(self, 0);
}
function List_last(self) {
  return List_get(self, (List_len(self) - 1));
}
function List_is_empty(self) {
  return (List_len(self) === 0);
}

function List_contains(self, item, __ring_T_Eq) {
  for (const x of self) {
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

function _Map_is_empty(self) {
  return (_Map_len(self) === 0);
}

function _Set_is_empty(self) {
  return (_Set_len(self) === 0);
}

function _Set_contains(self, item, __ring_T_Eq) {
  const items = _Set_to_list(self);
  for (const x of items) {
    if (__ring_T_Eq.eq(x, item)) {
      return true;
    }
  }
  return false;
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

function str_at(list, i) {
  __ring_match6: {
    const __ring_m6 = List_get(list, i);
    if (__ring_m6._tag === "some") {
      const v = __ring_m6._0;
      return v;
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      return panic("str_at: out of bounds");
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function int_at(list, i) {
  __ring_match7: {
    const __ring_m7 = List_get(list, i);
    if (__ring_m7._tag === "some") {
      const v = __ring_m7._0;
      return v;
      break __ring_match7;
    }
    if (__ring_m7._tag === "none") {
      return panic("int_at: out of bounds");
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
}

function type_at(list, i) {
  __ring_match8: {
    const __ring_m8 = List_get(list, i);
    if (__ring_m8._tag === "some") {
      const v = __ring_m8._0;
      return v;
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      return panic("type_at: out of bounds");
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
}

function df_at(list, i) {
  __ring_match9: {
    const __ring_m9 = List_get(list, i);
    if (__ring_m9._tag === "some") {
      const v = __ring_m9._0;
      return v;
      break __ring_match9;
    }
    if (__ring_m9._tag === "none") {
      return panic("df_at: out of bounds");
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
}

const BUILTIN_TYPES = set_from(["Option", "Cell", "List", "Map", "Set", "Range"]);

function run_derive_pass(env) {
  let derived_impls = [];
  const all_types = collect_user_types(env);
  derive_trait(env, all_types, "Eq", derived_impls);
  derive_trait(env, all_types, "Clone", derived_impls);
  derive_trait(env, all_types, "Ord", derived_impls);
  derive_trait(env, all_types, "Debug", derived_impls);
  return derived_impls;
}

class UserType {
  constructor(name, type_kind, struct_def, enum_def) {
    this.name = name;
    this.type_kind = type_kind;
    this.struct_def = struct_def;
    this.enum_def = enum_def;
  }
}

function collect_user_types(env) {
  const builtins = BUILTIN_TYPES;
  let result = [];
  for (const entry of _Map_entries(env.types.structs)) {
    const __ring_dt0 = entry;
    const name = __ring_dt0[0];
    const def = __ring_dt0[1];
    if ((_Set_contains(builtins, name, __Str_Eq) === false)) {
      List_push(result, new UserType(name, hir$TypeKind_StructKind, Option_some(def), Option_none));
    }
  }
  for (const entry of _Map_entries(env.types.enums)) {
    const __ring_dt1 = entry;
    const name = __ring_dt1[0];
    const def = __ring_dt1[1];
    if ((_Set_contains(builtins, name, __Str_Eq) === false)) {
      List_push(result, new UserType(name, hir$TypeKind_EnumKind, Option_none, Option_some(def)));
    }
  }
  return result;
}

function derive_trait(env, all_types, trait_name, derived_impls) {
  let known = set_new();
  for (const imp of env.trait_reg.trait_impls) {
    if ((imp.trait_name === trait_name)) {
      _Set_insert(known, imp.target_type_name);
    }
  }
  _Set_insert(known, "Int");
  _Set_insert(known, "Float");
  _Set_insert(known, "Str");
  _Set_insert(known, "Bool");
  let changed = true;
  while (changed) {
    changed = false;
    for (const ut of all_types) {
      if (_Set_contains(known, ut.name, __Str_Eq)) {
      } else {
        if (has_manual_impl(env, ut.name, trait_name)) {
        } else {
          const result = try_derive(env, ut, trait_name, known);
          __ring_match10: {
            const __ring_m10 = result;
            if (__ring_m10._tag === "some") {
              const di = __ring_m10._0;
              _Set_insert(known, ut.name);
              register_derived_impl(env, di, trait_name);
              List_push(derived_impls, di);
              changed = true;
              break __ring_match10;
            }
            if (__ring_m10._tag === "none") {
              break __ring_match10;
            }
            __match_fail(__ring_m10);
          }
        }
      }
    }
  }
}

function has_manual_impl(env, type_name, trait_name) {
  for (const imp of env.trait_reg.trait_impls) {
    if ((imp.trait_name === trait_name)) {
      if ((imp.target_type_name === type_name)) {
        return true;
      }
    }
  }
  return false;
}

function try_derive(env, ut, trait_name, known) {
  let bounds = [];
  __ring_match11: {
    const __ring_m11 = ut.type_kind;
    if (__ring_m11._tag === "StructKind") {
      __ring_match12: {
        const __ring_m12 = ut.struct_def;
        if (__ring_m12._tag === "some") {
          const def = __ring_m12._0;
          const field_entries = def.fields.map((function(f) { return new FieldEntry(f.name, f.ty); }));
          const fields = try_derive_fields(env, field_entries, def.type_param_vars, def.type_params, trait_name, known, ut.name, bounds);
          __ring_match13: {
            const __ring_m13 = fields;
            if (__ring_m13._tag === "some") {
              const fs = __ring_m13._0;
              return Option_some(new hir$DerivedImpl(ut.name, trait_name, def.type_params, bounds, hir$TypeKind_StructKind, Option_some(fs), Option_none));
              break __ring_match13;
            }
            if (__ring_m13._tag === "none") {
              return Option_none;
              break __ring_match13;
            }
            __match_fail(__ring_m13);
          }
          break __ring_match12;
        }
        if (__ring_m12._tag === "none") {
          return Option_none;
          break __ring_match12;
        }
        __match_fail(__ring_m12);
      }
      break __ring_match11;
    }
    if (__ring_m11._tag === "EnumKind") {
      __ring_match14: {
        const __ring_m14 = ut.enum_def;
        if (__ring_m14._tag === "some") {
          const def = __ring_m14._0;
          let variants = [];
          let ok = true;
          for (const v of def.variants) {
            if (ok) {
              const has_named_fields = (function() {
  const __ring_m = v.field_names;
  if (__ring_m._tag === "some") { const fns = __ring_m._0; return (List_len(fns) > 0); }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
              let field_entries = [];
              const __ring_end0 = List_len(v.fields);
              for (let i = 0; i < __ring_end0; i++) {
                const fname = (has_named_fields ? (function() {
  const __ring_m = v.field_names;
  if (__ring_m._tag === "some") { const fns = __ring_m._0; return str_at(fns, i); }
  if (__ring_m._tag === "none") { return `_${i}`; }
  __match_fail(__ring_m);
})() : `_${i}`);
                List_push(field_entries, new FieldEntry(fname, type_at(v.fields, i)));
              }
              const fields = try_derive_fields(env, field_entries, def.type_param_vars, def.type_params, trait_name, known, ut.name, bounds);
              __ring_match15: {
                const __ring_m15 = fields;
                if (__ring_m15._tag === "some") {
                  const fs = __ring_m15._0;
                  let final_fields = fs;
                  if ((has_named_fields === false)) {
                    let updated = [];
                    const __ring_end1 = List_len(fs);
                    for (let j = 0; j < __ring_end1; j++) {
                      const f = df_at(fs, j);
                      List_push(updated, new hir$DerivedField(f.name, Option_some(j), f.action));
                    }
                    final_fields = updated;
                  }
                  List_push(variants, new hir$DerivedVariant(v.name, final_fields, has_named_fields));
                  break __ring_match15;
                }
                if (__ring_m15._tag === "none") {
                  ok = false;
                  break __ring_match15;
                }
                __match_fail(__ring_m15);
              }
            }
          }
          if (ok) {
            return Option_some(new hir$DerivedImpl(ut.name, trait_name, def.type_params, bounds, hir$TypeKind_EnumKind, Option_none, Option_some(variants)));
          } else {
            return Option_none;
          }
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          return Option_none;
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
}

class FieldEntry {
  constructor(name, ty) {
    this.name = name;
    this.ty = ty;
  }
}

function try_derive_fields(env, fields, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds) {
  let result = [];
  for (const field of fields) {
    const action = resolve_field_action(env, field.ty, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds);
    __ring_match16: {
      const __ring_m16 = action;
      if (__ring_m16._tag === "some") {
        const a = __ring_m16._0;
        List_push(result, new hir$DerivedField(field.name, Option_none, a));
        break __ring_match16;
      }
      if (__ring_m16._tag === "none") {
        return Option_none;
        break __ring_match16;
      }
      __match_fail(__ring_m16);
    }
  }
  return Option_some(result);
}

function resolve_field_action(env, field_type, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds) {
  __ring_match17: {
    const __ring_m17 = field_type;
    if (__ring_m17._tag === "IntType") {
      return Option_some(hir$FieldAction_Identity);
      break __ring_match17;
    }
    if (__ring_m17._tag === "FloatType") {
      return Option_some(hir$FieldAction_Identity);
      break __ring_match17;
    }
    if (__ring_m17._tag === "StrType") {
      return Option_some(hir$FieldAction_Identity);
      break __ring_match17;
    }
    if (__ring_m17._tag === "BoolType") {
      return Option_some(hir$FieldAction_Identity);
      break __ring_match17;
    }
    if (__ring_m17._tag === "UnitType") {
      return Option_some(hir$FieldAction_Identity);
      break __ring_match17;
    }
    if (__ring_m17._tag === "TypeVar") {
      const id = __ring_m17.id;
      const param_idx = index_of_int(type_param_vars, id);
      if ((param_idx < 0)) {
        return Option_none;
      }
      const param_name = str_at(type_param_names, param_idx);
      if ((has_bound(bounds, param_name, trait_name) === false)) {
        List_push(bounds, new hir$TraitBound(param_name, trait_name));
      }
      return Option_some(hir$FieldAction_Call(hir$trait_bound_param_name(param_name, trait_name), []));
      break __ring_match17;
    }
    if (__ring_m17._tag === "StructType") {
      const name = __ring_m17.name; const type_params = __ring_m17.type_params;
      if ((name === self_type_name)) {
        const extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds);
        __ring_match18: {
          const __ring_m18 = extra;
          if (__ring_m18._tag === "some") {
            const e = __ring_m18._0;
            return Option_some(hir$FieldAction_Call(hir$trait_dict_name(name, trait_name), e));
            break __ring_match18;
          }
          if (__ring_m18._tag === "none") {
            return Option_none;
            break __ring_match18;
          }
          __match_fail(__ring_m18);
        }
      } else {
        if (_Set_contains(known, name, __Str_Eq)) {
          const extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds);
          __ring_match19: {
            const __ring_m19 = extra;
            if (__ring_m19._tag === "some") {
              const e = __ring_m19._0;
              return Option_some(hir$FieldAction_Call(hir$trait_dict_name(name, trait_name), e));
              break __ring_match19;
            }
            if (__ring_m19._tag === "none") {
              return Option_none;
              break __ring_match19;
            }
            __match_fail(__ring_m19);
          }
        } else {
          return Option_none;
        }
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "EnumType") {
      const name = __ring_m17.name; const type_params = __ring_m17.type_params;
      if ((name === self_type_name)) {
        const extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds);
        __ring_match20: {
          const __ring_m20 = extra;
          if (__ring_m20._tag === "some") {
            const e = __ring_m20._0;
            return Option_some(hir$FieldAction_Call(hir$trait_dict_name(name, trait_name), e));
            break __ring_match20;
          }
          if (__ring_m20._tag === "none") {
            return Option_none;
            break __ring_match20;
          }
          __match_fail(__ring_m20);
        }
      } else {
        if (_Set_contains(known, name, __Str_Eq)) {
          const extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds);
          __ring_match21: {
            const __ring_m21 = extra;
            if (__ring_m21._tag === "some") {
              const e = __ring_m21._0;
              return Option_some(hir$FieldAction_Call(hir$trait_dict_name(name, trait_name), e));
              break __ring_match21;
            }
            if (__ring_m21._tag === "none") {
              return Option_none;
              break __ring_match21;
            }
            __match_fail(__ring_m21);
          }
        } else {
          return Option_none;
        }
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "TupleType") {
      const elements = __ring_m17.elements;
      let elem_actions = [];
      let ok = true;
      for (const elem_ty of elements) {
        if (ok) {
          const elem_action = resolve_field_action(env, elem_ty, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds);
          __ring_match22: {
            const __ring_m22 = elem_action;
            if (__ring_m22._tag === "some") {
              const a = __ring_m22._0;
              List_push(elem_actions, a);
              break __ring_match22;
            }
            if (__ring_m22._tag === "none") {
              ok = false;
              break __ring_match22;
            }
            __match_fail(__ring_m22);
          }
        }
      }
      if (ok) {
        return Option_some(hir$FieldAction_Tuple(elem_actions));
      } else {
        return Option_none;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "FnType") {
      if ((trait_name === "Debug")) {
        return Option_some(hir$FieldAction_Identity);
      } else {
        return Option_none;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "ErrorType") {
      return Option_some(hir$FieldAction_Identity);
      break __ring_match17;
    }
    if (__ring_m17._tag === "AnyType") {
      return Option_some(hir$FieldAction_Identity);
      break __ring_match17;
    }
    if (__ring_m17._tag === "NeverType") {
      return Option_some(hir$FieldAction_Identity);
      break __ring_match17;
    }
    return Option_none;
    break __ring_match17;
  }
}

function resolve_extra_dicts(type_args, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds) {
  let dicts = [];
  for (const arg of type_args) {
    const dict = resolve_type_arg_dict(arg, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds);
    __ring_match23: {
      const __ring_m23 = dict;
      if (__ring_m23._tag === "some") {
        const d = __ring_m23._0;
        List_push(dicts, d);
        break __ring_match23;
      }
      if (__ring_m23._tag === "none") {
        return Option_none;
        break __ring_match23;
      }
      __match_fail(__ring_m23);
    }
  }
  return Option_some(dicts);
}

function resolve_type_arg_dict(arg, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds) {
  __ring_match24: {
    const __ring_m24 = arg;
    if (__ring_m24._tag === "IntType") {
      return Option_some(hir$trait_dict_name("Int", trait_name));
      break __ring_match24;
    }
    if (__ring_m24._tag === "FloatType") {
      return Option_some(hir$trait_dict_name("Float", trait_name));
      break __ring_match24;
    }
    if (__ring_m24._tag === "StrType") {
      return Option_some(hir$trait_dict_name("Str", trait_name));
      break __ring_match24;
    }
    if (__ring_m24._tag === "BoolType") {
      return Option_some(hir$trait_dict_name("Bool", trait_name));
      break __ring_match24;
    }
    if (__ring_m24._tag === "UnitType") {
      return Option_some(hir$trait_dict_name("Unit", trait_name));
      break __ring_match24;
    }
    if (__ring_m24._tag === "TypeVar") {
      const id = __ring_m24.id;
      const param_idx = index_of_int(type_param_vars, id);
      if ((param_idx < 0)) {
        return Option_none;
      }
      const param_name = str_at(type_param_names, param_idx);
      if ((has_bound(bounds, param_name, trait_name) === false)) {
        List_push(bounds, new hir$TraitBound(param_name, trait_name));
      }
      return Option_some(hir$trait_bound_param_name(param_name, trait_name));
      break __ring_match24;
    }
    if (__ring_m24._tag === "StructType") {
      const name = __ring_m24.name;
      if ((name === self_type_name)) {
        return Option_some(hir$trait_dict_name(name, trait_name));
      } else {
        if (_Set_contains(known, name, __Str_Eq)) {
          return Option_some(hir$trait_dict_name(name, trait_name));
        } else {
          return Option_none;
        }
      }
      break __ring_match24;
    }
    if (__ring_m24._tag === "EnumType") {
      const name = __ring_m24.name;
      if ((name === self_type_name)) {
        return Option_some(hir$trait_dict_name(name, trait_name));
      } else {
        if (_Set_contains(known, name, __Str_Eq)) {
          return Option_some(hir$trait_dict_name(name, trait_name));
        } else {
          return Option_none;
        }
      }
      break __ring_match24;
    }
    return Option_none;
    break __ring_match24;
  }
}

function register_derived_impl(env, di, trait_name) {
  List_push(env.trait_reg.trait_impls, new env$ImplEntry(trait_name, di.type_name, di.type_params, get_method_names(trait_name)));
  let methods = (function() {
  const __ring_m = _Map_get(env.trait_reg.impl_methods, di.type_name);
  if (__ring_m._tag === "some") { const m = __ring_m._0; return m; }
  if (__ring_m._tag === "none") { return map_new(); }
  __match_fail(__ring_m);
})();
  let type_var_ids = [];
  let self_type_params = [];
  const __ring_end2 = List_len(di.type_params);
  for (let i = 0; i < __ring_end2; i++) {
    const var_id = env$TypeEnv_fresh_var_id(env);
    List_push(type_var_ids, var_id);
    List_push(self_type_params, types$Type_TypeVar(var_id, Option_none));
  }
  const self_type = build_self_type(env, di.type_name, di.type_kind, self_type_params);
  let scheme_bounds = [];
  for (const b of di.bounds) {
    const param_idx = index_of_str(di.type_params, b.type_param);
    if ((param_idx >= 0)) {
      List_push(scheme_bounds, new env$SchemeBound(int_at(type_var_ids, param_idx), b.trait_name));
    }
  }
  register_trait_methods(methods, trait_name, self_type, type_var_ids, scheme_bounds);
  return _Map_insert(env.trait_reg.impl_methods, di.type_name, methods);
}

function get_method_names(trait_name) {
  __ring_match25: {
    const __ring_m25 = trait_name;
    if (__ring_m25 === "Eq") {
      let r = ["eq"];
      List_push(r, "ne");
      return r;
      break __ring_match25;
    }
    if (__ring_m25 === "Clone") {
      return ["clone"];
      break __ring_match25;
    }
    if (__ring_m25 === "Debug") {
      return ["debug"];
      break __ring_match25;
    }
    if (__ring_m25 === "Ord") {
      return ["cmp"];
      break __ring_match25;
    }
    return [];
    break __ring_match25;
  }
}

function build_self_type(env, type_name, type_kind, type_params) {
  __ring_match26: {
    const __ring_m26 = type_kind;
    if (__ring_m26._tag === "StructKind") {
      const def = _Map_get(env.types.structs, type_name);
      const fields = (function() {
  const __ring_m = def;
  if (__ring_m._tag === "some") { const d = __ring_m._0; return d.fields.map((function(f) { return new types$StructField(f.name, f.ty, f.is_pub); })); }
  if (__ring_m._tag === "none") { return (function() {
  const e = [];
  return e;
})(); }
  __match_fail(__ring_m);
})();
      return types$Type_StructType(type_name, type_params, fields);
      break __ring_match26;
    }
    if (__ring_m26._tag === "EnumKind") {
      const def = _Map_get(env.types.enums, type_name);
      const variants = (function() {
  const __ring_m = def;
  if (__ring_m._tag === "some") { const d = __ring_m._0; return d.variants.map((function(v) { return new types$EnumVariant(v.name, v.fields, v.field_names); })); }
  if (__ring_m._tag === "none") { return (function() {
  const e = [];
  return e;
})(); }
  __match_fail(__ring_m);
})();
      return types$Type_EnumType(type_name, type_params, variants);
      break __ring_match26;
    }
    __match_fail(__ring_m26);
  }
}

function register_trait_methods(methods, trait_name, self_type, type_var_ids, bounds) {
  __ring_match27: {
    const __ring_m27 = trait_name;
    if (__ring_m27 === "Eq") {
      const eq_fn = types$Type_FnType([self_type, self_type], types$BOOL, types$EMPTY_ROW);
      _Map_insert(methods, "eq", new env$TypeScheme(eq_fn, type_var_ids, bounds, Option_none));
      const ne_fn = types$Type_FnType([self_type, self_type], types$BOOL, types$EMPTY_ROW);
      return _Map_insert(methods, "ne", new env$TypeScheme(ne_fn, type_var_ids, bounds, Option_none));
      break __ring_match27;
    }
    if (__ring_m27 === "Clone") {
      const clone_fn = types$Type_FnType([self_type], self_type, types$EMPTY_ROW);
      return _Map_insert(methods, "clone", new env$TypeScheme(clone_fn, type_var_ids, bounds, Option_none));
      break __ring_match27;
    }
    if (__ring_m27 === "Ord") {
      const cmp_fn = types$Type_FnType([self_type, self_type], types$INT, types$EMPTY_ROW);
      return _Map_insert(methods, "cmp", new env$TypeScheme(cmp_fn, type_var_ids, bounds, Option_none));
      break __ring_match27;
    }
    if (__ring_m27 === "Debug") {
      const debug_fn = types$Type_FnType([self_type], types$STR, types$EMPTY_ROW);
      return _Map_insert(methods, "debug", new env$TypeScheme(debug_fn, type_var_ids, bounds, Option_none));
      break __ring_match27;
    }
    break __ring_match27;
  }
}

function index_of_int(list, target) {
  const __ring_end3 = List_len(list);
  for (let i = 0; i < __ring_end3; i++) {
    if ((int_at(list, i) === target)) {
      return i;
    }
  }
  return (0 - 1);
}

function index_of_str(list, target) {
  const __ring_end4 = List_len(list);
  for (let i = 0; i < __ring_end4; i++) {
    if ((str_at(list, i) === target)) {
      return i;
    }
  }
  return (0 - 1);
}

function has_bound(bounds, type_param, trait_name) {
  for (const b of bounds) {
    if ((b.type_param === type_param)) {
      if ((b.trait_name === trait_name)) {
        return true;
      }
    }
  }
  return false;
}

function __StringBuilder_Eq_eq(self, other) {
  return true;
}
const __StringBuilder_Eq = { eq: __StringBuilder_Eq_eq, ne: function(self, other) { return !__StringBuilder_Eq_eq(self, other); } };

function __Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return __ring_T_Eq.eq(self._0, other._0);
    case "Err": return __ring_E_Eq.eq(self._0, other._0);
    default: return true;
  }
}
const __Result_Eq = { eq: __Result_Eq_eq, ne: function(self, other, __ring_T_Eq, __ring_E_Eq) { return !__Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq); } };

function __StringBuilder_Clone_clone(self) {
  return new StringBuilder();
}
const __StringBuilder_Clone = { clone: __StringBuilder_Clone_clone };

function __Result_Clone_clone(self, __ring_T_Clone, __ring_E_Clone) {
  switch (self._tag) {
    case "Ok": return Result_Ok(__ring_T_Clone.clone(self._0));
    case "Err": return Result_Err(__ring_E_Clone.clone(self._0));
    default: return self;
  }
}
const __Result_Clone = { clone: __Result_Clone_clone };

function __StringBuilder_Ord_cmp(self, other) {
  return 0;
}
const __StringBuilder_Ord = { cmp: __StringBuilder_Ord_cmp };

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

function __StringBuilder_Debug_debug(self) {
  return "StringBuilder";
}
const __StringBuilder_Debug = { debug: __StringBuilder_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { run_derive_pass };