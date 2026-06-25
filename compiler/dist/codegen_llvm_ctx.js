import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, compare_by_first as hir$compare_by_first, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_FloatIdentity as hir$FieldAction_FloatIdentity, FieldAction_BoolIdentity as hir$FieldAction_BoolIdentity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";



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


















class StructFieldInfo {
  constructor(field_names, field_rc_skip, llvm_type) {
    this.field_names = field_names;
    this.field_rc_skip = field_rc_skip;
    this.llvm_type = llvm_type;
  }
}

class EnumVariantInfo {
  constructor(tag, field_count, field_names, field_rc_skip) {
    this.tag = tag;
    this.field_count = field_count;
    this.field_names = field_names;
    this.field_rc_skip = field_rc_skip;
  }
}

class EnumTypeInfo {
  constructor(variants, max_fields, llvm_type) {
    this.variants = variants;
    this.max_fields = max_fields;
    this.llvm_type = llvm_type;
  }
}

const ExternParamMarshall_PassthroughPtr = Object.freeze({ _tag: "PassthroughPtr" });
const ExternParamMarshall_StrToCstr = Object.freeze({ _tag: "StrToCstr" });
const ExternParamMarshall_StrToCstrAndLen = Object.freeze({ _tag: "StrToCstrAndLen" });
const ExternParamMarshall_IntToI32 = Object.freeze({ _tag: "IntToI32" });
const ExternParamMarshall_IntToI64 = Object.freeze({ _tag: "IntToI64" });
const ExternParamMarshall_FloatToDouble = Object.freeze({ _tag: "FloatToDouble" });
const ExternParamMarshall_ListToDataAndCount = Object.freeze({ _tag: "ListToDataAndCount" });
const ExternParamMarshall_ListToDataAndCountI64 = Object.freeze({ _tag: "ListToDataAndCountI64" });

const ExternRetMarshall_RetPtr = Object.freeze({ _tag: "RetPtr" });
const ExternRetMarshall_RetVoid = Object.freeze({ _tag: "RetVoid" });
const ExternRetMarshall_RetIntToBoxed = Object.freeze({ _tag: "RetIntToBoxed" });
const ExternRetMarshall_RetStrFromCstr = Object.freeze({ _tag: "RetStrFromCstr" });

class ExternFnInfo {
  constructor(c_fn_val, c_fn_type, param_marshalls, ret_marshall, is_special) {
    this.c_fn_val = c_fn_val;
    this.c_fn_type = c_fn_type;
    this.param_marshalls = param_marshalls;
    this.ret_marshall = ret_marshall;
    this.is_special = is_special;
  }
}

class HandleCleanup {
  constructor(needs_catch_pop, ev_drop_allocas) {
    this.needs_catch_pop = needs_catch_pop;
    this.ev_drop_allocas = ev_drop_allocas;
  }
}

class LlvmCtx {
  constructor(context, module, builder, target_machine, ptr_type, i64_type, i32_type, i8_type, i1_type, void_type, double_type, named_values, functions, fn_types, struct_types, enum_types, rt_fns, rt_fn_types, local_fn_effects, fn_evidence_params, dict_globals, static_dict_defs, dict_singletons, trait_method_order, trait_supertraits, module_prefix, imports_map, local_names, tmp_counter, lambda_counter, match_counter, current_fn, current_fn_name, loop_break_bb, loop_continue_bb, next_user_typeid, type_to_typeid, boxed_vars, fn_mut_params, effect_ops, default_evidence, derived_dict_builds, extern_types, extern_fn_infos, handle_cleanup_stack) {
    this.context = context;
    this.module = module;
    this.builder = builder;
    this.target_machine = target_machine;
    this.ptr_type = ptr_type;
    this.i64_type = i64_type;
    this.i32_type = i32_type;
    this.i8_type = i8_type;
    this.i1_type = i1_type;
    this.void_type = void_type;
    this.double_type = double_type;
    this.named_values = named_values;
    this.functions = functions;
    this.fn_types = fn_types;
    this.struct_types = struct_types;
    this.enum_types = enum_types;
    this.rt_fns = rt_fns;
    this.rt_fn_types = rt_fn_types;
    this.local_fn_effects = local_fn_effects;
    this.fn_evidence_params = fn_evidence_params;
    this.dict_globals = dict_globals;
    this.static_dict_defs = static_dict_defs;
    this.dict_singletons = dict_singletons;
    this.trait_method_order = trait_method_order;
    this.trait_supertraits = trait_supertraits;
    this.module_prefix = module_prefix;
    this.imports_map = imports_map;
    this.local_names = local_names;
    this.tmp_counter = tmp_counter;
    this.lambda_counter = lambda_counter;
    this.match_counter = match_counter;
    this.current_fn = current_fn;
    this.current_fn_name = current_fn_name;
    this.loop_break_bb = loop_break_bb;
    this.loop_continue_bb = loop_continue_bb;
    this.next_user_typeid = next_user_typeid;
    this.type_to_typeid = type_to_typeid;
    this.boxed_vars = boxed_vars;
    this.fn_mut_params = fn_mut_params;
    this.effect_ops = effect_ops;
    this.default_evidence = default_evidence;
    this.derived_dict_builds = derived_dict_builds;
    this.extern_types = extern_types;
    this.extern_fn_infos = extern_fn_infos;
    this.handle_cleanup_stack = handle_cleanup_stack;
  }
}

const RING_TYPEID_CELL = 14;

const RING_TYPEID_CLOSURE = 7;

const RING_TYPEID_TUPLE = 10;

const RING_TYPEID_EVIDENCE = 21;

const RING_TYPEID_CLOSURE_ENV = 15;

const RING_TYPEID_DICT_STATIC = 16;

const RING_TYPEID_DICT_DYN = 17;

const LLVM_INT_EQ = 32;

const LLVM_INT_NE = 33;

const LLVM_INT_SGT = 38;

const LLVM_INT_SGE = 39;

const LLVM_INT_SLT = 40;

const LLVM_INT_SLE = 41;

const LLVM_REAL_OEQ = 1;

const LLVM_REAL_OGT = 2;

const LLVM_REAL_OGE = 3;

const LLVM_REAL_OLT = 4;

const LLVM_REAL_OLE = 5;

const LLVM_REAL_ONE = 6;

function build_entry_alloca(ctx, ty, name) {
  const current_bb = LLVMGetInsertBlock(ctx.builder);
  const fn_val = LLVMGetBasicBlockParent(current_bb);
  const entry_bb = LLVMGetEntryBasicBlock(fn_val);
  const first_instr = LLVMGetFirstInstruction(entry_bb);
  if ((LLVMIsNullPtr(first_instr) === 0)) {
    LLVMPositionBuilderBefore(ctx.builder, first_instr);
  } else {
    LLVMPositionBuilderAtEnd(ctx.builder, entry_bb);
  }
  const alloca = LLVMBuildAlloca(ctx.builder, ty, name);
  LLVMPositionBuilderAtEnd(ctx.builder, current_bb);
  return alloca;
}

function fresh_name(ctx, prefix) {
  const n = ctx.tmp_counter;
  ctx.tmp_counter = (ctx.tmp_counter + 1);
  return `${prefix}${n}`;
}

function get_or_assign_typeid(ctx, type_name) {
  __ring_match6: {
    const __ring_m6 = _Map_get(ctx.type_to_typeid, type_name);
    if (__ring_m6._tag === "some") {
      const id = __ring_m6._0;
      return id;
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      const id = ctx.next_user_typeid;
      ctx.next_user_typeid = (id + 1);
      _Map_insert(ctx.type_to_typeid, type_name, id);
      return id;
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function get_or_declare_runtime_fn(ctx, name, param_types, ret_type) {
  __ring_match7: {
    const __ring_m7 = _Map_get(ctx.rt_fns, name);
    if (__ring_m7._tag === "some") {
      const f = __ring_m7._0;
      return f;
      break __ring_match7;
    }
    if (__ring_m7._tag === "none") {
      const fn_ty = LLVMFunctionType(ret_type, param_types, 0);
      const fn_val = LLVMAddFunction(ctx.module, name, fn_ty);
      _Map_insert(ctx.rt_fns, name, fn_val);
      _Map_insert(ctx.rt_fn_types, name, fn_ty);
      return fn_val;
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
}

function get_rt_fn_type(ctx, name) {
  __ring_match8: {
    const __ring_m8 = _Map_get(ctx.rt_fn_types, name);
    if (__ring_m8._tag === "some") {
      const t = __ring_m8._0;
      return t;
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      return panic(`LLVM codegen: runtime function type not found: ${name}`);
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
}

function llvm_mangle_fn(name) {
  return `ring_${name}`;
}

function llvm_mangle_fn_with_prefix(prefix, name) {
  return `ring_${prefix}$$_${name}`;
}

function llvm_mangle_method(type_name, method_name) {
  return `ring_${type_name}_${method_name}`;
}

function llvm_resolve_fn(ctx, name) {
  __ring_match9: {
    const __ring_m9 = _Map_get(ctx.imports_map, name);
    if (__ring_m9._tag === "some") {
      const qualified = __ring_m9._0;
      return qualified;
      break __ring_match9;
    }
    if (__ring_m9._tag === "none") {
      __ring_match10: {
        const __ring_m10 = ctx.module_prefix;
        if (__ring_m10._tag === "some") {
          const prefix = __ring_m10._0;
          if (_Set_contains(ctx.local_names, name, __Str_Eq)) {
            return llvm_mangle_fn_with_prefix(prefix, name);
          } else {
            return llvm_mangle_fn(name);
          }
          break __ring_match10;
        }
        if (__ring_m10._tag === "none") {
          return llvm_mangle_fn(name);
          break __ring_match10;
        }
        __match_fail(__ring_m10);
      }
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
}

function llvm_resolve_method(ctx, type_name, method_name) {
  return llvm_mangle_method(type_name, method_name);
}

function __ExternParamMarshall_Eq_eq(self, other) {
  if (self._tag !== other._tag) return false;
  return true;
}
const __ExternParamMarshall_Eq = { eq: __ExternParamMarshall_Eq_eq, ne: function(self, other) { return !__ExternParamMarshall_Eq_eq(self, other); } };

function __ExternRetMarshall_Eq_eq(self, other) {
  if (self._tag !== other._tag) return false;
  return true;
}
const __ExternRetMarshall_Eq = { eq: __ExternRetMarshall_Eq_eq, ne: function(self, other) { return !__ExternRetMarshall_Eq_eq(self, other); } };

function __Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return __ring_T_Eq.eq(self._0, other._0);
    case "Err": return __ring_E_Eq.eq(self._0, other._0);
    default: return true;
  }
}
const __Result_Eq = { eq: __Result_Eq_eq, ne: function(self, other, __ring_T_Eq, __ring_E_Eq) { return !__Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq); } };

function __EnumVariantInfo_Clone_clone(self) {
  return new EnumVariantInfo(self.tag, self.field_count, __List_Clone.clone(self.field_names, __Str_Clone), __List_Clone.clone(self.field_rc_skip, __Bool_Clone));
}
const __EnumVariantInfo_Clone = { clone: __EnumVariantInfo_Clone_clone };

function __ListIterator_Clone_clone(self, __ring_T_Clone) {
  return new ListIterator(__List_Clone.clone(self.list, __ring_T_Clone), self.index);
}
const __ListIterator_Clone = { clone: __ListIterator_Clone_clone };

function __SetIterator_Clone_clone(self, __ring_T_Clone) {
  return new SetIterator(__List_Clone.clone(self.items, __ring_T_Clone), self.index);
}
const __SetIterator_Clone = { clone: __SetIterator_Clone_clone };

function __ExternParamMarshall_Clone_clone(self) {
  switch (self._tag) {
    case "PassthroughPtr": return ExternParamMarshall_PassthroughPtr;
    case "StrToCstr": return ExternParamMarshall_StrToCstr;
    case "StrToCstrAndLen": return ExternParamMarshall_StrToCstrAndLen;
    case "IntToI32": return ExternParamMarshall_IntToI32;
    case "IntToI64": return ExternParamMarshall_IntToI64;
    case "FloatToDouble": return ExternParamMarshall_FloatToDouble;
    case "ListToDataAndCount": return ExternParamMarshall_ListToDataAndCount;
    case "ListToDataAndCountI64": return ExternParamMarshall_ListToDataAndCountI64;
    default: return self;
  }
}
const __ExternParamMarshall_Clone = { clone: __ExternParamMarshall_Clone_clone };

function __ExternRetMarshall_Clone_clone(self) {
  switch (self._tag) {
    case "RetPtr": return ExternRetMarshall_RetPtr;
    case "RetVoid": return ExternRetMarshall_RetVoid;
    case "RetIntToBoxed": return ExternRetMarshall_RetIntToBoxed;
    case "RetStrFromCstr": return ExternRetMarshall_RetStrFromCstr;
    default: return self;
  }
}
const __ExternRetMarshall_Clone = { clone: __ExternRetMarshall_Clone_clone };

function __Result_Clone_clone(self, __ring_T_Clone, __ring_E_Clone) {
  switch (self._tag) {
    case "Ok": return Result_Ok(__ring_T_Clone.clone(self._0));
    case "Err": return Result_Err(__ring_E_Clone.clone(self._0));
    default: return self;
  }
}
const __Result_Clone = { clone: __Result_Clone_clone };

const __ExternParamMarshall_tag_order = { "PassthroughPtr": 0, "StrToCstr": 1, "StrToCstrAndLen": 2, "IntToI32": 3, "IntToI64": 4, "FloatToDouble": 5, "ListToDataAndCount": 6, "ListToDataAndCountI64": 7 };
function __ExternParamMarshall_Ord_cmp(self, other) {
  var t1 = __ExternParamMarshall_tag_order[self._tag];
  var t2 = __ExternParamMarshall_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  return 0;
}
const __ExternParamMarshall_Ord = { cmp: __ExternParamMarshall_Ord_cmp };

const __ExternRetMarshall_tag_order = { "RetPtr": 0, "RetVoid": 1, "RetIntToBoxed": 2, "RetStrFromCstr": 3 };
function __ExternRetMarshall_Ord_cmp(self, other) {
  var t1 = __ExternRetMarshall_tag_order[self._tag];
  var t2 = __ExternRetMarshall_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  return 0;
}
const __ExternRetMarshall_Ord = { cmp: __ExternRetMarshall_Ord_cmp };

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

function __EnumVariantInfo_Debug_debug(self) {
  return "EnumVariantInfo { " + "tag: " + String(self.tag) + ", " + "field_count: " + String(self.field_count) + ", " + "field_names: " + __List_Debug.debug(self.field_names, __Str_Debug) + ", " + "field_rc_skip: " + __List_Debug.debug(self.field_rc_skip, __Bool_Debug) + " }";
}
const __EnumVariantInfo_Debug = { debug: __EnumVariantInfo_Debug_debug };

function __ListIterator_Debug_debug(self, __ring_T_Debug) {
  return "ListIterator { " + "list: " + __List_Debug.debug(self.list, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __ListIterator_Debug = { debug: __ListIterator_Debug_debug };

function __SetIterator_Debug_debug(self, __ring_T_Debug) {
  return "SetIterator { " + "items: " + __List_Debug.debug(self.items, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __SetIterator_Debug = { debug: __SetIterator_Debug_debug };

function __ExternParamMarshall_Debug_debug(self) {
  switch (self._tag) {
    case "PassthroughPtr": return "PassthroughPtr";
    case "StrToCstr": return "StrToCstr";
    case "StrToCstrAndLen": return "StrToCstrAndLen";
    case "IntToI32": return "IntToI32";
    case "IntToI64": return "IntToI64";
    case "FloatToDouble": return "FloatToDouble";
    case "ListToDataAndCount": return "ListToDataAndCount";
    case "ListToDataAndCountI64": return "ListToDataAndCountI64";
    default: return self._tag;
  }
}
const __ExternParamMarshall_Debug = { debug: __ExternParamMarshall_Debug_debug };

function __ExternRetMarshall_Debug_debug(self) {
  switch (self._tag) {
    case "RetPtr": return "RetPtr";
    case "RetVoid": return "RetVoid";
    case "RetIntToBoxed": return "RetIntToBoxed";
    case "RetStrFromCstr": return "RetStrFromCstr";
    default: return self._tag;
  }
}
const __ExternRetMarshall_Debug = { debug: __ExternRetMarshall_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { StructFieldInfo, EnumVariantInfo, EnumTypeInfo, ExternParamMarshall_PassthroughPtr, ExternParamMarshall_StrToCstr, ExternParamMarshall_StrToCstrAndLen, ExternParamMarshall_IntToI32, ExternParamMarshall_IntToI64, ExternParamMarshall_FloatToDouble, ExternParamMarshall_ListToDataAndCount, ExternParamMarshall_ListToDataAndCountI64, ExternRetMarshall_RetPtr, ExternRetMarshall_RetVoid, ExternRetMarshall_RetIntToBoxed, ExternRetMarshall_RetStrFromCstr, ExternFnInfo, HandleCleanup, LlvmCtx, RING_TYPEID_CELL, RING_TYPEID_CLOSURE, RING_TYPEID_TUPLE, RING_TYPEID_EVIDENCE, RING_TYPEID_CLOSURE_ENV, RING_TYPEID_DICT_STATIC, RING_TYPEID_DICT_DYN, LLVM_INT_EQ, LLVM_INT_NE, LLVM_INT_SGT, LLVM_INT_SGE, LLVM_INT_SLT, LLVM_INT_SLE, LLVM_REAL_OEQ, LLVM_REAL_OGT, LLVM_REAL_OGE, LLVM_REAL_OLT, LLVM_REAL_OLE, LLVM_REAL_ONE, llvm_mangle_fn, llvm_mangle_fn_with_prefix, llvm_mangle_method, llvm_resolve_fn, llvm_resolve_method, fresh_name, get_or_declare_runtime_fn, get_rt_fn_type, get_or_assign_typeid, build_entry_alloca, __ExternParamMarshall_Eq, __ExternRetMarshall_Eq, __EnumVariantInfo_Clone, __ExternParamMarshall_Clone, __ExternRetMarshall_Clone, __ExternParamMarshall_Ord, __ExternRetMarshall_Ord, __EnumVariantInfo_Debug, __ExternParamMarshall_Debug, __ExternRetMarshall_Debug };