import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, compare_by_first as hir$compare_by_first, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_FloatIdentity as hir$FieldAction_FloatIdentity, FieldAction_BoolIdentity as hir$FieldAction_BoolIdentity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";



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

function fresh_anf_tmp(counter) {
  let __ring_blk0;
  __ring_match6: {
    const __ring_m6 = List_get(counter, 0);
    if (__ring_m6._tag === "some") {
      const v = __ring_m6._0;
      __ring_blk0 = v;
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      __ring_blk0 = 0;
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
  const n = __ring_blk0;
  List_set(counter, 0, (n + 1));
  return `__anf_${(n + 1)}`;
}

function synthetic_span() {
  const pos = new ast$Position(0, 0, 0);
  return new ast$Span("<perceus>", pos, pos);
}

function anf_materialize(expr, hoists, counter) {
  const tmp = fresh_anf_tmp(counter);
  const t = hir$hexpr_type(expr);
  const e = hir$hexpr_effects(expr);
  const s = hir$hexpr_span(expr);
  List_push(hoists, hir$HStmt_Let(tmp, synthetic_span(), Option_none, t, expr, synthetic_span()));
  return hir$HExpr_Ident(tmp, Option_none, Option_none, Option_none, t, e, s);
}

function stmt_diverges(stmt) {
  __ring_match7: {
    const __ring_m7 = stmt;
    if (__ring_m7._tag === "Return") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "Break") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "Continue") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "ExprStmt") {
      const expr = __ring_m7.expr;
      return expr_diverges(expr);
      break __ring_match7;
    }
    return false;
    break __ring_match7;
  }
}

function expr_diverges(expr) {
  __ring_match8: {
    const __ring_m8 = expr;
    if (__ring_m8._tag === "Block") {
      const stmts = __ring_m8.stmts; const tail = __ring_m8.tail;
      let any = false;
      const __ring_iter_2 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
        if (__ring_next_2._tag === "none") break;
        const s = __ring_next_2._0;
        if (stmt_diverges(s)) {
          any = true;
        }
      }
      if (any) {
        return true;
      } else {
        __ring_match9: {
          const __ring_m9 = tail;
          if (__ring_m9._tag === "some") {
            const t = __ring_m9._0;
            return expr_diverges(t);
            break __ring_match9;
          }
          if (__ring_m9._tag === "none") {
            return false;
            break __ring_match9;
          }
          __match_fail(__ring_m9);
        }
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "IfExpr") {
      const then_branch = __ring_m8.then_branch; const else_branch = __ring_m8.else_branch;
      __ring_match10: {
        const __ring_m10 = else_branch;
        if (__ring_m10._tag === "some") {
          const eb = __ring_m10._0;
          if (expr_diverges(then_branch)) {
            return expr_diverges(eb);
          } else {
            return false;
          }
          break __ring_match10;
        }
        if (__ring_m10._tag === "none") {
          return false;
          break __ring_match10;
        }
        __match_fail(__ring_m10);
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "MatchExpr") {
      const arms = __ring_m8.arms;
      let all = (List_len(arms) > 0);
      const __ring_iter_3 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
        if (__ring_next_3._tag === "none") break;
        const arm = __ring_next_3._0;
        if ((expr_diverges(arm.body) === false)) {
          all = false;
        }
      }
      return all;
      break __ring_match8;
    }
    if (__ring_m8._tag === "ReturnExpr") {
      return true;
      break __ring_match8;
    }
    return false;
    break __ring_match8;
  }
}

function is_str_index(receiver) {
  __ring_match11: {
    const __ring_m11 = hir$hexpr_type(receiver);
    if (__ring_m11._tag === "StrType") {
      return true;
      break __ring_match11;
    }
    return false;
    break __ring_match11;
  }
}

function is_unresolved_var_type(ty) {
  __ring_match12: {
    const __ring_m12 = ty;
    if (__ring_m12._tag === "TypeVar") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "ErrorType") {
      return true;
      break __ring_match12;
    }
    return false;
    break __ring_match12;
  }
}

function anf_branch_materializable(body, externs) {
  if (expr_diverges(body)) {
    return true;
  } else {
    __ring_match13: {
      const __ring_m13 = body;
      if (__ring_m13._tag === "Block") {
        const tail = __ring_m13.tail;
        __ring_match14: {
          const __ring_m14 = tail;
          if (__ring_m14._tag === "some") {
            const t = __ring_m14._0;
            return anf_should_materialize(t, externs);
            break __ring_match14;
          }
          if (__ring_m14._tag === "none") {
            return false;
            break __ring_match14;
          }
          __match_fail(__ring_m14);
        }
        break __ring_match13;
      }
      return anf_should_materialize(body, externs);
      break __ring_match13;
    }
  }
}

function anf_should_materialize(expr, externs) {
  const ty = hir$hexpr_type(expr);
  if (hir$is_rc_excluded_type(ty, externs)) {
    return false;
  }
  if (hir$type_contains_extern_handle(ty, externs)) {
    return false;
  }
  if (is_unresolved_var_type(ty)) {
    return false;
  }
  __ring_match15: {
    const __ring_m15 = expr;
    if (__ring_m15._tag === "BinOp") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "UnaryOp") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "Call") {
      const callee = __ring_m15.callee;
      return (hir$is_borrow_returning_call(callee) === false);
      break __ring_match15;
    }
    if (__ring_m15._tag === "StructLit") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "NamedVariantConstruct") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "ListLit") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "TupleLit") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "RangeExpr") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "StringInterp") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "Lambda") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "IntLit") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "FloatLit") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "StrLit") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "BoolLit") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "IndexExpr") {
      const receiver = __ring_m15.receiver;
      return is_str_index(receiver);
      break __ring_match15;
    }
    if (__ring_m15._tag === "IfExpr") {
      const then_branch = __ring_m15.then_branch; const else_branch = __ring_m15.else_branch;
      __ring_match16: {
        const __ring_m16 = else_branch;
        if (__ring_m16._tag === "none") {
          return false;
          break __ring_match16;
        }
        if (__ring_m16._tag === "some") {
          const eb = __ring_m16._0;
          if (anf_branch_materializable(then_branch, externs)) {
            return anf_branch_materializable(eb, externs);
          } else {
            return false;
          }
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      break __ring_match15;
    }
    return false;
    break __ring_match15;
  }
}

function anf_value_in_own_scope(expr, externs, counter) {
  let hoists = [];
  const nv = anf_tail_value(expr, hoists, externs, counter);
  if ((List_len(hoists) === 0)) {
    return nv;
  } else {
    return hir$HExpr_Block(hoists, Option_some(nv), hir$hexpr_type(expr), hir$hexpr_effects(expr), hir$hexpr_span(expr));
  }
}

function anf_lvalue(expr, hoists, externs, counter) {
  __ring_match17: {
    const __ring_m17 = expr;
    if (__ring_m17._tag === "FieldAccess") {
      const receiver = __ring_m17.receiver; const field = __ring_m17.field; const ty = __ring_m17.ty; const effects = __ring_m17.effects; const span = __ring_m17.span;
      return hir$HExpr_FieldAccess(anf_lvalue(receiver, hoists, externs, counter), field, ty, effects, span);
      break __ring_match17;
    }
    if (__ring_m17._tag === "IndexExpr") {
      const receiver = __ring_m17.receiver; const index = __ring_m17.index; const ty = __ring_m17.ty; const effects = __ring_m17.effects; const span = __ring_m17.span;
      return hir$HExpr_IndexExpr(anf_lvalue(receiver, hoists, externs, counter), anf_operand(index, hoists, externs, counter), ty, effects, span);
      break __ring_match17;
    }
    if (__ring_m17._tag === "Ident") {
      const name = __ring_m17.name; const resolved_name = __ring_m17.resolved_name; const def_id = __ring_m17.def_id; const dict_closure_dicts = __ring_m17.dict_closure_dicts; const ty = __ring_m17.ty; const effects = __ring_m17.effects; const span = __ring_m17.span;
      return hir$HExpr_Ident(name, resolved_name, def_id, dict_closure_dicts, ty, effects, span);
      break __ring_match17;
    }
    return expr;
    break __ring_match17;
  }
}

function anf_tail_value(expr, hoists, externs, counter) {
  return anf_expr(expr, hoists, externs, counter);
}

function anf_operand(expr, hoists, externs, counter) {
  const normalized = anf_expr(expr, hoists, externs, counter);
  if (anf_should_materialize(normalized, externs)) {
    return anf_materialize(normalized, hoists, counter);
  } else {
    return normalized;
  }
}

function anf_callee(callee, hoists, externs, counter) {
  return anf_borrow(callee, hoists, externs, counter);
}

function anf_borrow(expr, hoists, externs, counter) {
  return anf_expr(expr, hoists, externs, counter);
}

function anf_expr(expr, hoists, externs, counter) {
  __ring_match18: {
    const __ring_m18 = expr;
    if (__ring_m18._tag === "IntLit") {
      const value = __ring_m18.value; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_IntLit(value, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "FloatLit") {
      const value = __ring_m18.value; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_FloatLit(value, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "StrLit") {
      const value = __ring_m18.value; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_StrLit(value, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "BoolLit") {
      const value = __ring_m18.value; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_BoolLit(value, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Ident") {
      const name = __ring_m18.name; const resolved_name = __ring_m18.resolved_name; const def_id = __ring_m18.def_id; const dict_closure_dicts = __ring_m18.dict_closure_dicts; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_Ident(name, resolved_name, def_id, dict_closure_dicts, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "DictConstruct") {
      const base_dict = __ring_m18.base_dict; const trait_name = __ring_m18.trait_name; const inner = __ring_m18.inner; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_DictConstruct(base_dict, trait_name, inner, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "BinOp") {
      const op = __ring_m18.op; const left = __ring_m18.left; const right = __ring_m18.right; const eq_dispatch = __ring_m18.eq_dispatch; const ord_dispatch = __ring_m18.ord_dispatch; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      __ring_match19: {
        const __ring_m19 = op;
        if (__ring_m19._tag === "And") {
          panic("perceus: BinOp::And must be lowered by andor_lower");
          break __ring_match19;
        }
        if (__ring_m19._tag === "Or") {
          panic("perceus: BinOp::Or must be lowered by andor_lower");
          break __ring_match19;
        }
        break __ring_match19;
      }
      const new_left = anf_operand(left, hoists, externs, counter);
      const new_right = anf_operand(right, hoists, externs, counter);
      return hir$HExpr_BinOp(op, new_left, new_right, eq_dispatch, ord_dispatch, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "UnaryOp") {
      const op = __ring_m18.op; const operand = __ring_m18.operand; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_UnaryOp(op, anf_operand(operand, hoists, externs, counter), ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Call") {
      const callee = __ring_m18.callee; const args = __ring_m18.args; const type_args = __ring_m18.type_args; const resolved_dicts = __ring_m18.resolved_dicts; const dict_dispatch = __ring_m18.dict_dispatch; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      const new_callee = anf_callee(callee, hoists, externs, counter);
      let new_args = [];
      const __ring_iter_4 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
        if (__ring_next_4._tag === "none") break;
        const a = __ring_next_4._0;
        List_push(new_args, anf_operand(a, hoists, externs, counter));
      }
      return hir$HExpr_Call(new_callee, new_args, type_args, resolved_dicts, dict_dispatch, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "FieldAccess") {
      const receiver = __ring_m18.receiver; const field = __ring_m18.field; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_FieldAccess(anf_operand(receiver, hoists, externs, counter), field, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "IndexExpr") {
      const receiver = __ring_m18.receiver; const index = __ring_m18.index; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_IndexExpr(anf_operand(receiver, hoists, externs, counter), anf_operand(index, hoists, externs, counter), ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "StructLit") {
      const name = __ring_m18.name; const type_args = __ring_m18.type_args; const fields = __ring_m18.fields; const spread = __ring_m18.spread; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      let new_fields = [];
      const __ring_iter_5 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const f = __ring_next_5._0;
        List_push(new_fields, new hir$HStructFieldInit(f.name, anf_tail_value(f.value, hoists, externs, counter)));
      }
      let __ring_blk1;
      __ring_match20: {
        const __ring_m20 = spread;
        if (__ring_m20._tag === "some") {
          const s = __ring_m20._0;
          __ring_blk1 = Option_some(anf_borrow(s, hoists, externs, counter));
          break __ring_match20;
        }
        if (__ring_m20._tag === "none") {
          __ring_blk1 = Option_none;
          break __ring_match20;
        }
        __match_fail(__ring_m20);
      }
      const new_spread = __ring_blk1;
      return hir$HExpr_StructLit(name, type_args, new_fields, new_spread, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "NamedVariantConstruct") {
      const enum_name = __ring_m18.enum_name; const variant_name = __ring_m18.variant_name; const fields = __ring_m18.fields; const spread = __ring_m18.spread; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      let new_fields = [];
      const __ring_iter_6 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
        if (__ring_next_6._tag === "none") break;
        const f = __ring_next_6._0;
        List_push(new_fields, new hir$HStructFieldInit(f.name, anf_tail_value(f.value, hoists, externs, counter)));
      }
      let __ring_blk2;
      __ring_match21: {
        const __ring_m21 = spread;
        if (__ring_m21._tag === "some") {
          const s = __ring_m21._0;
          __ring_blk2 = Option_some(anf_borrow(s, hoists, externs, counter));
          break __ring_match21;
        }
        if (__ring_m21._tag === "none") {
          __ring_blk2 = Option_none;
          break __ring_match21;
        }
        __match_fail(__ring_m21);
      }
      const new_spread = __ring_blk2;
      return hir$HExpr_NamedVariantConstruct(enum_name, variant_name, new_fields, new_spread, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "ListLit") {
      const elements = __ring_m18.elements; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      let new_elems = [];
      const __ring_iter_7 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
        if (__ring_next_7._tag === "none") break;
        const e = __ring_next_7._0;
        List_push(new_elems, anf_tail_value(e, hoists, externs, counter));
      }
      return hir$HExpr_ListLit(new_elems, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "TupleLit") {
      const elements = __ring_m18.elements; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      let new_elems = [];
      const __ring_iter_8 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
        if (__ring_next_8._tag === "none") break;
        const e = __ring_next_8._0;
        List_push(new_elems, anf_tail_value(e, hoists, externs, counter));
      }
      return hir$HExpr_TupleLit(new_elems, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "RangeExpr") {
      const start = __ring_m18.start; const end = __ring_m18.end; const inclusive = __ring_m18.inclusive; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_RangeExpr(anf_tail_value(start, hoists, externs, counter), anf_tail_value(end, hoists, externs, counter), inclusive, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "StringInterp") {
      const parts = __ring_m18.parts; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      let new_parts = [];
      const __ring_iter_9 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
        if (__ring_next_9._tag === "none") break;
        const p = __ring_next_9._0;
        __ring_match22: {
          const __ring_m22 = p;
          if (__ring_m22._tag === "Expression") {
            const e = __ring_m22._0;
            List_push(new_parts, hir$HStringInterpPart_Expression(anf_operand(e, hoists, externs, counter)));
            break __ring_match22;
          }
          if (__ring_m22._tag === "Literal") {
            const s = __ring_m22._0;
            List_push(new_parts, hir$HStringInterpPart_Literal(s));
            break __ring_match22;
          }
          __match_fail(__ring_m22);
        }
      }
      return hir$HExpr_StringInterp(new_parts, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Block") {
      const stmts = __ring_m18.stmts; const tail = __ring_m18.tail; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return anf_block_expr(expr, externs, counter);
      break __ring_match18;
    }
    if (__ring_m18._tag === "IfExpr") {
      const condition = __ring_m18.condition; const then_branch = __ring_m18.then_branch; const else_branch = __ring_m18.else_branch; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      const new_cond = anf_operand(condition, hoists, externs, counter);
      const new_then = anf_block_expr(then_branch, externs, counter);
      let __ring_blk3;
      __ring_match23: {
        const __ring_m23 = else_branch;
        if (__ring_m23._tag === "some") {
          const eb = __ring_m23._0;
          __ring_blk3 = Option_some(anf_block_expr(eb, externs, counter));
          break __ring_match23;
        }
        if (__ring_m23._tag === "none") {
          __ring_blk3 = Option_none;
          break __ring_match23;
        }
        __match_fail(__ring_m23);
      }
      const new_else = __ring_blk3;
      return hir$HExpr_IfExpr(new_cond, new_then, new_else, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "MatchExpr") {
      const scrutinee = __ring_m18.scrutinee; const arms = __ring_m18.arms; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      const new_scrutinee = anf_operand(scrutinee, hoists, externs, counter);
      let new_arms = [];
      const __ring_iter_10 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
        if (__ring_next_10._tag === "none") break;
        const arm = __ring_next_10._0;
        let __ring_blk4;
        __ring_match24: {
          const __ring_m24 = arm.guard;
          if (__ring_m24._tag === "some") {
            const g = __ring_m24._0;
            __ring_blk4 = Option_some(anf_cond_in_own_scope(g, externs, counter));
            break __ring_match24;
          }
          if (__ring_m24._tag === "none") {
            __ring_blk4 = Option_none;
            break __ring_match24;
          }
          __match_fail(__ring_m24);
        }
        const new_guard = __ring_blk4;
        const new_body = anf_block_expr(arm.body, externs, counter);
        List_push(new_arms, new hir$HMatchArm(arm.pattern, new_guard, new_body, arm.span));
      }
      return hir$HExpr_MatchExpr(new_scrutinee, new_arms, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "TryCatch") {
      const body = __ring_m18.body; const arms = __ring_m18.arms; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      const new_body = anf_block_expr(body, externs, counter);
      let new_arms = [];
      const __ring_iter_11 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
        if (__ring_next_11._tag === "none") break;
        const arm = __ring_next_11._0;
        const new_body_arm = anf_block_expr(arm.body, externs, counter);
        List_push(new_arms, new hir$HMatchArm(arm.pattern, arm.guard, new_body_arm, arm.span));
      }
      return hir$HExpr_TryCatch(new_body, new_arms, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "HandleExpr") {
      const body = __ring_m18.body; const handlers = __ring_m18.handlers; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      const new_body = anf_block_expr(body, externs, counter);
      let new_handlers = [];
      const __ring_iter_12 = __List_Iterable.iter(handlers);
      while (true) {
        const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
        if (__ring_next_12._tag === "none") break;
        const h = __ring_next_12._0;
        const h_body = anf_block_expr(h.body, externs, counter);
        List_push(new_handlers, new hir$HEffectHandler(h.effect_name, h.op_name, h.params, h.resume_name, h_body));
      }
      return hir$HExpr_HandleExpr(new_body, new_handlers, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Lambda") {
      const params = __ring_m18.params; const return_type = __ring_m18.return_type; const body = __ring_m18.body; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_Lambda(params, return_type, anf_block_expr(body, externs, counter), ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "EffectOp") {
      const effect_name = __ring_m18.effect_name; const op_name = __ring_m18.op_name; const args = __ring_m18.args; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      let new_args = [];
      const __ring_iter_13 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
        if (__ring_next_13._tag === "none") break;
        const a = __ring_next_13._0;
        List_push(new_args, anf_operand(a, hoists, externs, counter));
      }
      return hir$HExpr_EffectOp(effect_name, op_name, new_args, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Clone") {
      const inner = __ring_m18.inner; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      return hir$HExpr_Clone(inner, ty, effects, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "ReturnExpr") {
      const value = __ring_m18.value; const ty = __ring_m18.ty; const effects = __ring_m18.effects; const span = __ring_m18.span;
      __ring_match25: {
        const __ring_m25 = value;
        if (__ring_m25._tag === "some") {
          const v = __ring_m25._0;
          const new_v = anf_tail_value(v, hoists, externs, counter);
          return hir$HExpr_ReturnExpr(Option_some(new_v), ty, effects, span);
          break __ring_match25;
        }
        if (__ring_m25._tag === "none") {
          return hir$HExpr_ReturnExpr(Option_none, ty, effects, span);
          break __ring_match25;
        }
        __match_fail(__ring_m25);
      }
      break __ring_match18;
    }
    __match_fail(__ring_m18);
  }
}

function anf_cond_in_own_scope(cond, externs, counter) {
  let hoists = [];
  const nc = anf_expr(cond, hoists, externs, counter);
  if ((List_len(hoists) === 0)) {
    return nc;
  } else {
    return hir$HExpr_Block(hoists, Option_some(nc), hir$hexpr_type(cond), hir$hexpr_effects(cond), hir$hexpr_span(cond));
  }
}

function anf_stmt(stmt, externs, counter) {
  __ring_match26: {
    const __ring_m26 = stmt;
    if (__ring_m26._tag === "Let") {
      const name = __ring_m26.name; const name_span = __ring_m26.name_span; const def_id = __ring_m26.def_id; const ty = __ring_m26.ty; const init = __ring_m26.init; const span = __ring_m26.span;
      let hoists = [];
      const new_init = anf_tail_value(init, hoists, externs, counter);
      List_push(hoists, hir$HStmt_Let(name, name_span, def_id, ty, new_init, span));
      return hoists;
      break __ring_match26;
    }
    if (__ring_m26._tag === "Var") {
      const name = __ring_m26.name; const name_span = __ring_m26.name_span; const def_id = __ring_m26.def_id; const ty = __ring_m26.ty; const init = __ring_m26.init; const span = __ring_m26.span;
      let hoists = [];
      const new_init = anf_tail_value(init, hoists, externs, counter);
      List_push(hoists, hir$HStmt_Var(name, name_span, def_id, ty, new_init, span));
      return hoists;
      break __ring_match26;
    }
    if (__ring_m26._tag === "Assign") {
      const target = __ring_m26.target; const value = __ring_m26.value; const span = __ring_m26.span;
      let hoists = [];
      const new_target = anf_lvalue(target, hoists, externs, counter);
      const new_value = anf_tail_value(value, hoists, externs, counter);
      List_push(hoists, hir$HStmt_Assign(new_target, new_value, span));
      return hoists;
      break __ring_match26;
    }
    if (__ring_m26._tag === "ExprStmt") {
      const expr = __ring_m26.expr; const span = __ring_m26.span;
      let hoists = [];
      const new_expr = anf_operand(expr, hoists, externs, counter);
      List_push(hoists, hir$HStmt_ExprStmt(new_expr, span));
      return hoists;
      break __ring_match26;
    }
    if (__ring_m26._tag === "Return") {
      const value = __ring_m26.value; const span = __ring_m26.span;
      __ring_match27: {
        const __ring_m27 = value;
        if (__ring_m27._tag === "some") {
          const v = __ring_m27._0;
          let hoists = [];
          const new_v = anf_tail_value(v, hoists, externs, counter);
          List_push(hoists, hir$HStmt_Return(Option_some(new_v), span));
          return hoists;
          break __ring_match27;
        }
        if (__ring_m27._tag === "none") {
          return [hir$HStmt_Return(Option_none, span)];
          break __ring_match27;
        }
        __match_fail(__ring_m27);
      }
      break __ring_match26;
    }
    if (__ring_m26._tag === "While") {
      const condition = __ring_m26.condition; const body = __ring_m26.body; const span = __ring_m26.span;
      const new_cond = anf_cond_in_own_scope(condition, externs, counter);
      const new_body = anf_block_expr(body, externs, counter);
      return [hir$HStmt_While(new_cond, new_body, span)];
      break __ring_match26;
    }
    if (__ring_m26._tag === "ForIn") {
      const binding = __ring_m26.binding; const binding_span = __ring_m26.binding_span; const def_id = __ring_m26.def_id; const destructure = __ring_m26.destructure; const iterable = __ring_m26.iterable; const body = __ring_m26.body; const iterable_type_name = __ring_m26.iterable_type_name; const iter_type_name = __ring_m26.iter_type_name; const span = __ring_m26.span;
      let hoists = [];
      let __ring_blk5;
      __ring_match28: {
        const __ring_m28 = iterable;
        if (__ring_m28._tag === "RangeExpr") {
          __ring_blk5 = anf_expr(iterable, hoists, externs, counter);
          break __ring_match28;
        }
        __ring_blk5 = anf_operand(iterable, hoists, externs, counter);
        break __ring_match28;
      }
      const new_iter = __ring_blk5;
      const new_body = anf_block_expr(body, externs, counter);
      List_push(hoists, hir$HStmt_ForIn(binding, binding_span, def_id, destructure, new_iter, new_body, iterable_type_name, iter_type_name, span));
      return hoists;
      break __ring_match26;
    }
    if (__ring_m26._tag === "LetDestructure") {
      const pattern = __ring_m26.pattern; const bindings = __ring_m26.bindings; const init = __ring_m26.init; const span = __ring_m26.span;
      let hoists = [];
      const new_init = anf_operand(init, hoists, externs, counter);
      List_push(hoists, hir$HStmt_LetDestructure(pattern, bindings, new_init, span));
      return hoists;
      break __ring_match26;
    }
    if (__ring_m26._tag === "IfLet") {
      const pattern = __ring_m26.pattern; const expr = __ring_m26.expr; const then_block = __ring_m26.then_block; const else_block = __ring_m26.else_block; const span = __ring_m26.span;
      let hoists = [];
      const new_expr = anf_operand(expr, hoists, externs, counter);
      const new_then = anf_block_expr(then_block, externs, counter);
      let __ring_blk6;
      __ring_match29: {
        const __ring_m29 = else_block;
        if (__ring_m29._tag === "some") {
          const eb = __ring_m29._0;
          __ring_blk6 = Option_some(anf_block_expr(eb, externs, counter));
          break __ring_match29;
        }
        if (__ring_m29._tag === "none") {
          __ring_blk6 = Option_none;
          break __ring_match29;
        }
        __match_fail(__ring_m29);
      }
      const new_else = __ring_blk6;
      List_push(hoists, hir$HStmt_IfLet(pattern, new_expr, new_then, new_else, span));
      return hoists;
      break __ring_match26;
    }
    if (__ring_m26._tag === "Break") {
      const span = __ring_m26.span;
      return [hir$HStmt_Break(span)];
      break __ring_match26;
    }
    if (__ring_m26._tag === "Continue") {
      const span = __ring_m26.span;
      return [hir$HStmt_Continue(span)];
      break __ring_match26;
    }
    if (__ring_m26._tag === "Drop") {
      return [stmt];
      break __ring_match26;
    }
    if (__ring_m26._tag === "Dup") {
      return [stmt];
      break __ring_match26;
    }
    __match_fail(__ring_m26);
  }
}

function anf_stmt_list(stmts, externs, counter) {
  let out = [];
  const __ring_iter_14 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
    if (__ring_next_14._tag === "none") break;
    const s = __ring_next_14._0;
    const __ring_iter_15 = __List_Iterable.iter(anf_stmt(s, externs, counter));
    while (true) {
      const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
      if (__ring_next_15._tag === "none") break;
      const ns = __ring_next_15._0;
      List_push(out, ns);
    }
  }
  return out;
}

function anf_block_expr(body, externs, counter) {
  __ring_match30: {
    const __ring_m30 = body;
    if (__ring_m30._tag === "Block") {
      const stmts = __ring_m30.stmts; const tail = __ring_m30.tail; const ty = __ring_m30.ty; const effects = __ring_m30.effects; const span = __ring_m30.span;
      const new_stmts = anf_stmt_list(stmts, externs, counter);
      let __ring_blk7;
      __ring_match31: {
        const __ring_m31 = tail;
        if (__ring_m31._tag === "some") {
          const t = __ring_m31._0;
          let tail_hoists = [];
          const nt = anf_tail_value(t, tail_hoists, externs, counter);
          __ring_blk7 = ((List_len(tail_hoists) === 0) ? [new_stmts, Option_some(nt)] : (function() {
  let merged = List_concat(new_stmts, []);
  const __ring_iter_16 = __List_Iterable.iter(tail_hoists);
  while (true) {
    const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
    if (__ring_next_16._tag === "none") break;
    const h = __ring_next_16._0;
    List_push(merged, h);
  }
  return [merged, Option_some(nt)];
})());
          break __ring_match31;
        }
        if (__ring_m31._tag === "none") {
          __ring_blk7 = [new_stmts, Option_none];
          break __ring_match31;
        }
        __match_fail(__ring_m31);
      }
      const new_tail = __ring_blk7;
      return hir$HExpr_Block(new_tail[0], new_tail[1], ty, effects, span);
      break __ring_match30;
    }
    return anf_value_in_own_scope(body, externs, counter);
    break __ring_match30;
  }
}

function anf_fn_body(body, externs, counter) {
  return anf_block_expr(body, externs, counter);
}

function anf_decl(decl, externs, counter) {
  __ring_match32: {
    const __ring_m32 = decl;
    if (__ring_m32._tag === "Fn") {
      const name = __ring_m32.name; const def_id = __ring_m32.def_id; const type_params = __ring_m32.type_params; const params = __ring_m32.params; const return_type = __ring_m32.return_type; const effects = __ring_m32.effects; const body = __ring_m32.body; const is_pub = __ring_m32.is_pub; const trait_bounds = __ring_m32.trait_bounds; const span = __ring_m32.span;
      return hir$HDecl_Fn(name, def_id, type_params, params, return_type, effects, anf_fn_body(body, externs, counter), is_pub, trait_bounds, span);
      break __ring_match32;
    }
    if (__ring_m32._tag === "Impl") {
      const target_type = __ring_m32.target_type; const type_params = __ring_m32.type_params; const trait_name = __ring_m32.trait_name; const methods = __ring_m32.methods; const assoc_types = __ring_m32.assoc_types; const span = __ring_m32.span;
      let new_methods = [];
      const __ring_iter_17 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
        if (__ring_next_17._tag === "none") break;
        const m = __ring_next_17._0;
        List_push(new_methods, anf_decl(m, externs, counter));
      }
      return hir$HDecl_Impl(target_type, type_params, trait_name, new_methods, assoc_types, span);
      break __ring_match32;
    }
    if (__ring_m32._tag === "Test") {
      const description = __ring_m32.description; const body = __ring_m32.body; const span = __ring_m32.span;
      return hir$HDecl_Test(description, anf_fn_body(body, externs, counter), span);
      break __ring_match32;
    }
    if (__ring_m32._tag === "Const") {
      const name = __ring_m32.name; const def_id = __ring_m32.def_id; const ty = __ring_m32.ty; const init = __ring_m32.init; const is_pub = __ring_m32.is_pub; const span = __ring_m32.span;
      return hir$HDecl_Const(name, def_id, ty, anf_value_in_own_scope(init, externs, counter), is_pub, span);
      break __ring_match32;
    }
    if (__ring_m32._tag === "ModBlock") {
      const name = __ring_m32.name; const mod_decls = __ring_m32.decls; const is_pub = __ring_m32.is_pub; const span = __ring_m32.span;
      let new_mod = [];
      const __ring_iter_18 = __List_Iterable.iter(mod_decls);
      while (true) {
        const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
        if (__ring_next_18._tag === "none") break;
        const md = __ring_next_18._0;
        List_push(new_mod, anf_decl(md, externs, counter));
      }
      return hir$HDecl_ModBlock(name, new_mod, is_pub, span);
      break __ring_match32;
    }
    if (__ring_m32._tag === "Struct") {
      return decl;
      break __ring_match32;
    }
    if (__ring_m32._tag === "Enum") {
      return decl;
      break __ring_match32;
    }
    if (__ring_m32._tag === "Effect") {
      return decl;
      break __ring_match32;
    }
    if (__ring_m32._tag === "Trait") {
      return decl;
      break __ring_match32;
    }
    if (__ring_m32._tag === "ExternFn") {
      return decl;
      break __ring_match32;
    }
    if (__ring_m32._tag === "ExternType") {
      return decl;
      break __ring_match32;
    }
    if (__ring_m32._tag === "TypeAlias") {
      return decl;
      break __ring_match32;
    }
    if (__ring_m32._tag === "Sig") {
      return decl;
      break __ring_match32;
    }
    __match_fail(__ring_m32);
  }
}

function anf_normalize(program, externs) {
  let counter = [0];
  let new_decls = [];
  const __ring_iter_19 = __List_Iterable.iter(program.decls);
  while (true) {
    const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
    if (__ring_next_19._tag === "none") break;
    const d = __ring_next_19._0;
    List_push(new_decls, anf_decl(d, externs, counter));
  }
  return new hir$HProgram(new_decls, program.derived_impls, program.boxed_vars, program.static_dicts, program.extern_type_names);
}

function block_diverges(stmts, tail) {
  let any = false;
  const __ring_iter_20 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
    if (__ring_next_20._tag === "none") break;
    const s = __ring_next_20._0;
    if (stmt_diverges(s)) {
      any = true;
    }
  }
  if (any) {
    return true;
  }
  __ring_match33: {
    const __ring_m33 = tail;
    if (__ring_m33._tag === "some") {
      const t = __ring_m33._0;
      return expr_diverges(t);
      break __ring_match33;
    }
    if (__ring_m33._tag === "none") {
      return false;
      break __ring_match33;
    }
    __match_fail(__ring_m33);
  }
}

function is_droppable_branch_value(body, externs) {
  if (expr_diverges(body)) {
    return true;
  } else {
    __ring_match34: {
      const __ring_m34 = body;
      if (__ring_m34._tag === "Block") {
        const tail = __ring_m34.tail;
        __ring_match35: {
          const __ring_m35 = tail;
          if (__ring_m35._tag === "some") {
            const t = __ring_m35._0;
            return is_droppable_init(t, externs);
            break __ring_match35;
          }
          if (__ring_m35._tag === "none") {
            return false;
            break __ring_match35;
          }
          __match_fail(__ring_m35);
        }
        break __ring_match34;
      }
      return is_droppable_init(body, externs);
      break __ring_match34;
    }
  }
}

function is_droppable_init(init, externs) {
  const ty = hir$hexpr_type(init);
  if (hir$is_rc_excluded_type(ty, externs)) {
    return false;
  }
  if (hir$type_contains_extern_handle(ty, externs)) {
    return false;
  }
  if (is_unresolved_var_type(ty)) {
    return false;
  }
  __ring_match36: {
    const __ring_m36 = init;
    if (__ring_m36._tag === "Ident") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "FieldAccess") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "IndexExpr") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "StructLit") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "NamedVariantConstruct") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "ListLit") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "TupleLit") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "RangeExpr") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "Lambda") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "StringInterp") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "IntLit") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "FloatLit") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "StrLit") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "BoolLit") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "Clone") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "Call") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "BinOp") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "UnaryOp") {
      return true;
      break __ring_match36;
    }
    if (__ring_m36._tag === "IfExpr") {
      const then_branch = __ring_m36.then_branch; const else_branch = __ring_m36.else_branch;
      __ring_match37: {
        const __ring_m37 = else_branch;
        if (__ring_m37._tag === "none") {
          return false;
          break __ring_match37;
        }
        if (__ring_m37._tag === "some") {
          const eb = __ring_m37._0;
          if (is_droppable_branch_value(then_branch, externs)) {
            return is_droppable_branch_value(eb, externs);
          } else {
            return false;
          }
          break __ring_match37;
        }
        __match_fail(__ring_m37);
      }
      break __ring_match36;
    }
    if (__ring_m36._tag === "MatchExpr") {
      const arms = __ring_m36.arms;
      let all = (List_len(arms) > 0);
      const __ring_iter_21 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
        if (__ring_next_21._tag === "none") break;
        const arm = __ring_next_21._0;
        if ((is_droppable_branch_value(arm.body, externs) === false)) {
          all = false;
        }
      }
      return all;
      break __ring_match36;
    }
    if (__ring_m36._tag === "Block") {
      const tail = __ring_m36.tail;
      __ring_match38: {
        const __ring_m38 = tail;
        if (__ring_m38._tag === "some") {
          const t = __ring_m38._0;
          return is_droppable_init(t, externs);
          break __ring_match38;
        }
        if (__ring_m38._tag === "none") {
          return false;
          break __ring_match38;
        }
        __match_fail(__ring_m38);
      }
      break __ring_match36;
    }
    if (__ring_m36._tag === "DictConstruct") {
      return true;
      break __ring_match36;
    }
    return false;
    break __ring_match36;
  }
}

function rc_name_skippable(name) {
  return (name === "_");
}

function stmt_droppable_locals(s, externs) {
  __ring_match39: {
    const __ring_m39 = s;
    if (__ring_m39._tag === "Let") {
      const name = __ring_m39.name; const init = __ring_m39.init;
      if (((rc_name_skippable(name) === false) ? is_droppable_init(init, externs) : false)) {
        return [name];
      } else {
        return [];
      }
      break __ring_match39;
    }
    if (__ring_m39._tag === "Var") {
      const name = __ring_m39.name; const init = __ring_m39.init;
      if (((rc_name_skippable(name) === false) ? is_droppable_init(init, externs) : false)) {
        return [name];
      } else {
        return [];
      }
      break __ring_match39;
    }
    return [];
    break __ring_match39;
  }
}

function direct_block_locals(stmts, externs) {
  let out = [];
  const __ring_iter_22 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
    if (__ring_next_22._tag === "none") break;
    const s = __ring_next_22._0;
    const __ring_iter_23 = __List_Iterable.iter(stmt_droppable_locals(s, externs));
    while (true) {
      const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
      if (__ring_next_23._tag === "none") break;
      const n = __ring_next_23._0;
      if ((List_contains(out, n, __Str_Eq) === false)) {
        List_push(out, n);
      }
    }
  }
  return out;
}

function drops_for(names) {
  let out = [];
  const __ring_iter_24 = __List_Iterable.iter(names);
  while (true) {
    const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
    if (__ring_next_24._tag === "none") break;
    const n = __ring_next_24._0;
    if ((rc_name_skippable(n) === false)) {
      List_push(out, hir$HStmt_Drop(n, types$Type_UnitType, synthetic_span()));
    }
  }
  return out;
}

function fresh_scope_tmp(gensym) {
  let __ring_blk8;
  __ring_match40: {
    const __ring_m40 = List_get(gensym, 0);
    if (__ring_m40._tag === "some") {
      const v = __ring_m40._0;
      __ring_blk8 = v;
      break __ring_match40;
    }
    if (__ring_m40._tag === "none") {
      __ring_blk8 = 0;
      break __ring_match40;
    }
    __match_fail(__ring_m40);
  }
  const n = __ring_blk8;
  List_set(gensym, 0, (n + 1));
  return `__rc_scope_${(n + 1)}`;
}

function is_owner_bearing(expr) {
  __ring_match41: {
    const __ring_m41 = expr;
    if (__ring_m41._tag === "Ident") {
      return true;
      break __ring_match41;
    }
    if (__ring_m41._tag === "FieldAccess") {
      return true;
      break __ring_match41;
    }
    if (__ring_m41._tag === "IndexExpr") {
      const receiver = __ring_m41.receiver;
      return (is_str_index(receiver) === false);
      break __ring_match41;
    }
    if (__ring_m41._tag === "Call") {
      const callee = __ring_m41.callee;
      return hir$is_borrow_returning_call(callee);
      break __ring_match41;
    }
    return false;
    break __ring_match41;
  }
}

function is_scalar_type(ty) {
  __ring_match42: {
    const __ring_m42 = ty;
    if (__ring_m42._tag === "IntType") {
      return true;
      break __ring_match42;
    }
    if (__ring_m42._tag === "FloatType") {
      return true;
      break __ring_match42;
    }
    if (__ring_m42._tag === "BoolType") {
      return true;
      break __ring_match42;
    }
    return false;
    break __ring_match42;
  }
}

function is_variant_constructor_call(callee, result_ty) {
  __ring_match43: {
    const __ring_m43 = callee;
    if (__ring_m43._tag === "Ident") {
      const resolved_name = __ring_m43.resolved_name;
      __ring_match44: {
        const __ring_m44 = resolved_name;
        if (__ring_m44._tag === "some") {
          const rn = __ring_m44._0;
          __ring_match45: {
            const __ring_m45 = result_ty;
            if (__ring_m45._tag === "EnumType") {
              const name = __ring_m45.name;
              return Str_starts_with(rn, `${name}_`);
              break __ring_match45;
            }
            return false;
            break __ring_match45;
          }
          break __ring_match44;
        }
        if (__ring_m44._tag === "none") {
          return false;
          break __ring_match44;
        }
        __match_fail(__ring_m44);
      }
      break __ring_match43;
    }
    return false;
    break __ring_match43;
  }
}

function list_contains_int(xs, x) {
  const __ring_iter_25 = __List_Iterable.iter(xs);
  while (true) {
    const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
    if (__ring_next_25._tag === "none") break;
    const v = __ring_next_25._0;
    if ((v === x)) {
      return true;
    }
  }
  return false;
}

function loop_scoped_owned(owned, loop_base) {
  if ((loop_base < 0)) {
    return [];
  } else {
    return List_slice(owned, loop_base, List_len(owned));
  }
}

function mutate_append_param_drops(body, params) {
  __ring_match46: {
    const __ring_m46 = body;
    if (__ring_m46._tag === "Block") {
      const stmts = __ring_m46.stmts; const tail = __ring_m46.tail; const ty = __ring_m46.ty; const effects = __ring_m46.effects; const span = __ring_m46.span;
      let new_stmts = List_concat(stmts, []);
      const __ring_iter_26 = __List_Iterable.iter(params);
      while (true) {
        const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
        if (__ring_next_26._tag === "none") break;
        const p = __ring_next_26._0;
        List_push(new_stmts, hir$HStmt_Drop(p.name, types$Type_UnitType, synthetic_span()));
      }
      return hir$HExpr_Block(new_stmts, tail, ty, effects, span);
      break __ring_match46;
    }
    return body;
    break __ring_match46;
  }
}

function mutate_drop_params(decls) {
  let out = [];
  const __ring_iter_27 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
    if (__ring_next_27._tag === "none") break;
    const d = __ring_next_27._0;
    __ring_match47: {
      const __ring_m47 = d;
      if (__ring_m47._tag === "Fn") {
        const name = __ring_m47.name; const def_id = __ring_m47.def_id; const type_params = __ring_m47.type_params; const params = __ring_m47.params; const return_type = __ring_m47.return_type; const effects = __ring_m47.effects; const body = __ring_m47.body; const is_pub = __ring_m47.is_pub; const trait_bounds = __ring_m47.trait_bounds; const span = __ring_m47.span;
        List_push(out, hir$HDecl_Fn(name, def_id, type_params, params, return_type, effects, mutate_append_param_drops(body, params), is_pub, trait_bounds, span));
        break __ring_match47;
      }
      List_push(out, d);
      break __ring_match47;
    }
  }
  return out;
}

function scalar_reassign_drop_name(target, boxed) {
  __ring_match48: {
    const __ring_m48 = target;
    if (__ring_m48._tag === "Ident") {
      const name = __ring_m48.name; const def_id = __ring_m48.def_id; const ty = __ring_m48.ty;
      let __ring_blk9;
      __ring_match49: {
        const __ring_m49 = def_id;
        if (__ring_m49._tag === "some") {
          const did = __ring_m49._0;
          __ring_blk9 = (_Set_contains(boxed, did, __Int_Eq) === false);
          break __ring_match49;
        }
        if (__ring_m49._tag === "none") {
          __ring_blk9 = true;
          break __ring_match49;
        }
        __match_fail(__ring_m49);
      }
      const not_boxed = __ring_blk9;
      if ((not_boxed ? is_scalar_type(ty) : false)) {
        return Option_some(name);
      } else {
        return Option_none;
      }
      break __ring_match48;
    }
    return Option_none;
    break __ring_match48;
  }
}

function sink_arg_indices(callee, arg_count) {
  __ring_match50: {
    const __ring_m50 = callee;
    if (__ring_m50._tag === "FieldAccess") {
      const receiver = __ring_m50.receiver; const field = __ring_m50.field;
      const recv_ty = hir$hexpr_type(receiver);
      let __ring_blk10;
      __ring_match51: {
        const __ring_m51 = recv_ty;
        if (__ring_m51._tag === "StructType") {
          const name = __ring_m51.name;
          __ring_blk10 = ((name === "Set") ? true : (name === "StringBuilder"));
          break __ring_match51;
        }
        __ring_blk10 = false;
        break __ring_match51;
      }
      const is_copy_receiver = __ring_blk10;
      if (is_copy_receiver) {
        return [];
      } else {
        if (((((field === "push") ? true : (field === "add")) ? true : (field === "append")) ? true : (field === "push_back"))) {
          if ((arg_count >= 1)) {
            return [0];
          } else {
            return [];
          }
        } else {
          if ((field === "insert")) {
            if ((arg_count >= 1)) {
              return [(arg_count - 1)];
            } else {
              return [];
            }
          } else {
            if ((field === "set")) {
              if ((arg_count >= 1)) {
                return [(arg_count - 1)];
              } else {
                return [];
              }
            } else {
              return [];
            }
          }
        }
      }
      break __ring_match50;
    }
    return [];
    break __ring_match50;
  }
}

function rc_block_root(body, escape, owned, boxed, externs, gensym, loop_base) {
  __ring_match52: {
    const __ring_m52 = body;
    if (__ring_m52._tag === "Block") {
      const stmts = __ring_m52.stmts; const tail = __ring_m52.tail; const ty = __ring_m52.ty; const effects = __ring_m52.effects; const span = __ring_m52.span;
      const res = rc_block_inner(stmts, tail, escape, owned, boxed, externs, gensym, loop_base);
      return hir$HExpr_Block(res[0], res[1], ty, effects, span);
      break __ring_match52;
    }
    return rc_escape_or_value(body, escape, owned, boxed, externs, gensym, loop_base);
    break __ring_match52;
  }
}

function rc_stmt(stmt, owned, boxed, externs, gensym, loop_base) {
  __ring_match53: {
    const __ring_m53 = stmt;
    if (__ring_m53._tag === "Let") {
      const name = __ring_m53.name; const name_span = __ring_m53.name_span; const def_id = __ring_m53.def_id; const ty = __ring_m53.ty; const init = __ring_m53.init; const span = __ring_m53.span;
      const new_init = rc_escape(init, owned, boxed, externs, gensym, loop_base);
      return [hir$HStmt_Let(name, name_span, def_id, ty, new_init, span)];
      break __ring_match53;
    }
    if (__ring_m53._tag === "Var") {
      const name = __ring_m53.name; const name_span = __ring_m53.name_span; const def_id = __ring_m53.def_id; const ty = __ring_m53.ty; const init = __ring_m53.init; const span = __ring_m53.span;
      const new_init = rc_escape(init, owned, boxed, externs, gensym, loop_base);
      return [hir$HStmt_Var(name, name_span, def_id, ty, new_init, span)];
      break __ring_match53;
    }
    if (__ring_m53._tag === "Assign") {
      const target = __ring_m53.target; const value = __ring_m53.value; const span = __ring_m53.span;
      const new_value = rc_escape(value, owned, boxed, externs, gensym, loop_base);
      let __ring_blk11;
      __ring_match54: {
        const __ring_m54 = scalar_reassign_drop_name(target, boxed);
        if (__ring_m54._tag === "some") {
          const dn = __ring_m54._0;
          __ring_blk11 = (List_contains(owned, dn, __Str_Eq) ? Option_some(dn) : Option_none);
          break __ring_match54;
        }
        if (__ring_m54._tag === "none") {
          __ring_blk11 = Option_none;
          break __ring_match54;
        }
        __match_fail(__ring_m54);
      }
      const w4_target = __ring_blk11;
      __ring_match55: {
        const __ring_m55 = w4_target;
        if (__ring_m55._tag === "some") {
          const dname = __ring_m55._0;
          const tmp = fresh_scope_tmp(gensym);
          const vt = hir$hexpr_type(value);
          const tmp_id = hir$HExpr_Ident(tmp, Option_none, Option_none, Option_none, vt, hir$hexpr_effects(value), hir$hexpr_span(value));
          return [hir$HStmt_Let(tmp, synthetic_span(), Option_none, vt, new_value, synthetic_span()), hir$HStmt_Drop(dname, types$Type_UnitType, synthetic_span()), hir$HStmt_Assign(target, tmp_id, span)];
          break __ring_match55;
        }
        if (__ring_m55._tag === "none") {
          return [hir$HStmt_Assign(target, new_value, span)];
          break __ring_match55;
        }
        __match_fail(__ring_m55);
      }
      break __ring_match53;
    }
    if (__ring_m53._tag === "ExprStmt") {
      const expr = __ring_m53.expr; const span = __ring_m53.span;
      const new_expr = rc_expr(expr, false, owned, boxed, externs, gensym, loop_base);
      return [hir$HStmt_ExprStmt(new_expr, span)];
      break __ring_match53;
    }
    if (__ring_m53._tag === "Return") {
      const value = __ring_m53.value; const span = __ring_m53.span;
      __ring_match56: {
        const __ring_m56 = value;
        if (__ring_m56._tag === "some") {
          const v = __ring_m56._0;
          const new_v = rc_escape(v, owned, boxed, externs, gensym, loop_base);
          let out = [];
          const tmp = fresh_scope_tmp(gensym);
          const tt = hir$hexpr_type(v);
          const te = hir$hexpr_effects(v);
          const ts = hir$hexpr_span(v);
          List_push(out, hir$HStmt_Let(tmp, synthetic_span(), Option_none, tt, new_v, synthetic_span()));
          const __ring_iter_28 = __List_Iterable.iter(drops_for(owned));
          while (true) {
            const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
            if (__ring_next_28._tag === "none") break;
            const d = __ring_next_28._0;
            List_push(out, d);
          }
          const tmp_id = hir$HExpr_Ident(tmp, Option_none, Option_none, Option_none, tt, te, ts);
          List_push(out, hir$HStmt_Return(Option_some(tmp_id), span));
          return out;
          break __ring_match56;
        }
        if (__ring_m56._tag === "none") {
          let out = [];
          const __ring_iter_29 = __List_Iterable.iter(drops_for(owned));
          while (true) {
            const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
            if (__ring_next_29._tag === "none") break;
            const d = __ring_next_29._0;
            List_push(out, d);
          }
          List_push(out, hir$HStmt_Return(Option_none, span));
          return out;
          break __ring_match56;
        }
        __match_fail(__ring_m56);
      }
      break __ring_match53;
    }
    if (__ring_m53._tag === "While") {
      const condition = __ring_m53.condition; const body = __ring_m53.body; const span = __ring_m53.span;
      const new_cond = rc_expr(condition, false, owned, boxed, externs, gensym, loop_base);
      const new_body = rc_block_root(body, false, owned, boxed, externs, gensym, List_len(owned));
      return [hir$HStmt_While(new_cond, new_body, span)];
      break __ring_match53;
    }
    if (__ring_m53._tag === "ForIn") {
      const binding = __ring_m53.binding; const binding_span = __ring_m53.binding_span; const def_id = __ring_m53.def_id; const destructure = __ring_m53.destructure; const iterable = __ring_m53.iterable; const body = __ring_m53.body; const iterable_type_name = __ring_m53.iterable_type_name; const iter_type_name = __ring_m53.iter_type_name; const span = __ring_m53.span;
      const new_iter = rc_expr(iterable, false, owned, boxed, externs, gensym, loop_base);
      const new_body = rc_block_root(body, false, owned, boxed, externs, gensym, List_len(owned));
      return [hir$HStmt_ForIn(binding, binding_span, def_id, destructure, new_iter, new_body, iterable_type_name, iter_type_name, span)];
      break __ring_match53;
    }
    if (__ring_m53._tag === "Break") {
      const span = __ring_m53.span;
      let out = [];
      const __ring_iter_30 = __List_Iterable.iter(drops_for(loop_scoped_owned(owned, loop_base)));
      while (true) {
        const __ring_next_30 = __ListIterator_Iterator.next(__ring_iter_30);
        if (__ring_next_30._tag === "none") break;
        const d = __ring_next_30._0;
        List_push(out, d);
      }
      List_push(out, hir$HStmt_Break(span));
      return out;
      break __ring_match53;
    }
    if (__ring_m53._tag === "Continue") {
      const span = __ring_m53.span;
      let out = [];
      const __ring_iter_31 = __List_Iterable.iter(drops_for(loop_scoped_owned(owned, loop_base)));
      while (true) {
        const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
        if (__ring_next_31._tag === "none") break;
        const d = __ring_next_31._0;
        List_push(out, d);
      }
      List_push(out, hir$HStmt_Continue(span));
      return out;
      break __ring_match53;
    }
    if (__ring_m53._tag === "LetDestructure") {
      const pattern = __ring_m53.pattern; const bindings = __ring_m53.bindings; const init = __ring_m53.init; const span = __ring_m53.span;
      const new_init = rc_expr(init, false, owned, boxed, externs, gensym, loop_base);
      return [hir$HStmt_LetDestructure(pattern, bindings, new_init, span)];
      break __ring_match53;
    }
    if (__ring_m53._tag === "IfLet") {
      const pattern = __ring_m53.pattern; const expr = __ring_m53.expr; const then_block = __ring_m53.then_block; const else_block = __ring_m53.else_block; const span = __ring_m53.span;
      const new_expr = rc_expr(expr, false, owned, boxed, externs, gensym, loop_base);
      const new_then = rc_block_root(then_block, false, owned, boxed, externs, gensym, loop_base);
      let __ring_blk12;
      __ring_match57: {
        const __ring_m57 = else_block;
        if (__ring_m57._tag === "some") {
          const eb = __ring_m57._0;
          __ring_blk12 = Option_some(rc_block_root(eb, false, owned, boxed, externs, gensym, loop_base));
          break __ring_match57;
        }
        if (__ring_m57._tag === "none") {
          __ring_blk12 = Option_none;
          break __ring_match57;
        }
        __match_fail(__ring_m57);
      }
      const new_else = __ring_blk12;
      return [hir$HStmt_IfLet(pattern, new_expr, new_then, new_else, span)];
      break __ring_match53;
    }
    if (__ring_m53._tag === "Drop") {
      return [stmt];
      break __ring_match53;
    }
    if (__ring_m53._tag === "Dup") {
      return [stmt];
      break __ring_match53;
    }
    __match_fail(__ring_m53);
  }
}

function rc_escape_or_value(expr, escape, owned, boxed, externs, gensym, loop_base) {
  if (escape) {
    return rc_escape(expr, owned, boxed, externs, gensym, loop_base);
  } else {
    return rc_expr(expr, false, owned, boxed, externs, gensym, loop_base);
  }
}

function rc_block_inner(stmts, tail, escape, owned, boxed, externs, gensym, loop_base) {
  const block_locals = direct_block_locals(stmts, externs);
  let visible_owned = List_concat(owned, []);
  let new_stmts = [];
  const __ring_iter_32 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_32 = __ListIterator_Iterator.next(__ring_iter_32);
    if (__ring_next_32._tag === "none") break;
    const s = __ring_next_32._0;
    const __ring_iter_33 = __List_Iterable.iter(rc_stmt(s, visible_owned, boxed, externs, gensym, loop_base));
    while (true) {
      const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
      if (__ring_next_33._tag === "none") break;
      const ns = __ring_next_33._0;
      List_push(new_stmts, ns);
    }
    const __ring_iter_34 = __List_Iterable.iter(stmt_droppable_locals(s, externs));
    while (true) {
      const __ring_next_34 = __ListIterator_Iterator.next(__ring_iter_34);
      if (__ring_next_34._tag === "none") break;
      const n = __ring_next_34._0;
      if ((List_contains(visible_owned, n, __Str_Eq) === false)) {
        List_push(visible_owned, n);
      }
    }
  }
  let own_block_locals = [];
  const __ring_iter_35 = __List_Iterable.iter(block_locals);
  while (true) {
    const __ring_next_35 = __ListIterator_Iterator.next(__ring_iter_35);
    if (__ring_next_35._tag === "none") break;
    const n = __ring_next_35._0;
    if ((List_contains(owned, n, __Str_Eq) === false)) {
      List_push(own_block_locals, n);
    }
  }
  const tail_escape = ((List_len(own_block_locals) > 0) ? true : escape);
  let __ring_blk13;
  __ring_match58: {
    const __ring_m58 = tail;
    if (__ring_m58._tag === "some") {
      const t = __ring_m58._0;
      __ring_blk13 = Option_some(rc_escape_or_value(t, tail_escape, visible_owned, boxed, externs, gensym, loop_base));
      break __ring_match58;
    }
    if (__ring_m58._tag === "none") {
      __ring_blk13 = Option_none;
      break __ring_match58;
    }
    __match_fail(__ring_m58);
  }
  const new_tail = __ring_blk13;
  if ((List_len(own_block_locals) === 0)) {
    return [new_stmts, new_tail];
  } else {
    if (block_diverges(new_stmts, new_tail)) {
      return [new_stmts, new_tail];
    } else {
      const drops = drops_for(own_block_locals);
      __ring_match59: {
        const __ring_m59 = new_tail;
        if (__ring_m59._tag === "some") {
          const t = __ring_m59._0;
          const tmp = fresh_scope_tmp(gensym);
          const tt = hir$hexpr_type(t);
          const te = hir$hexpr_effects(t);
          const ts = hir$hexpr_span(t);
          List_push(new_stmts, hir$HStmt_Let(tmp, synthetic_span(), Option_none, tt, t, synthetic_span()));
          const __ring_iter_36 = __List_Iterable.iter(drops);
          while (true) {
            const __ring_next_36 = __ListIterator_Iterator.next(__ring_iter_36);
            if (__ring_next_36._tag === "none") break;
            const d = __ring_next_36._0;
            List_push(new_stmts, d);
          }
          const tmp_tail = hir$HExpr_Ident(tmp, Option_none, Option_none, Option_none, tt, te, ts);
          return [new_stmts, Option_some(tmp_tail)];
          break __ring_match59;
        }
        if (__ring_m59._tag === "none") {
          const __ring_iter_37 = __List_Iterable.iter(drops);
          while (true) {
            const __ring_next_37 = __ListIterator_Iterator.next(__ring_iter_37);
            if (__ring_next_37._tag === "none") break;
            const d = __ring_next_37._0;
            List_push(new_stmts, d);
          }
          return [new_stmts, Option_none];
          break __ring_match59;
        }
        __match_fail(__ring_m59);
      }
    }
  }
}

function rc_expr(expr, escape, owned, boxed, externs, gensym, loop_base) {
  __ring_match60: {
    const __ring_m60 = expr;
    if (__ring_m60._tag === "Ident") {
      const name = __ring_m60.name; const resolved_name = __ring_m60.resolved_name; const def_id = __ring_m60.def_id; const dict_closure_dicts = __ring_m60.dict_closure_dicts; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_Ident(name, resolved_name, def_id, dict_closure_dicts, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "IntLit") {
      const value = __ring_m60.value; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_IntLit(value, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "FloatLit") {
      const value = __ring_m60.value; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_FloatLit(value, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "StrLit") {
      const value = __ring_m60.value; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_StrLit(value, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "BoolLit") {
      const value = __ring_m60.value; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_BoolLit(value, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "DictConstruct") {
      const base_dict = __ring_m60.base_dict; const trait_name = __ring_m60.trait_name; const inner = __ring_m60.inner; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_DictConstruct(base_dict, trait_name, inner, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "BinOp") {
      const op = __ring_m60.op; const left = __ring_m60.left; const right = __ring_m60.right; const eq_dispatch = __ring_m60.eq_dispatch; const ord_dispatch = __ring_m60.ord_dispatch; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_BinOp(op, rc_expr(left, false, owned, boxed, externs, gensym, loop_base), rc_expr(right, false, owned, boxed, externs, gensym, loop_base), eq_dispatch, ord_dispatch, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "UnaryOp") {
      const op = __ring_m60.op; const operand = __ring_m60.operand; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_UnaryOp(op, rc_expr(operand, false, owned, boxed, externs, gensym, loop_base), ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "Call") {
      const callee = __ring_m60.callee; const args = __ring_m60.args; const type_args = __ring_m60.type_args; const resolved_dicts = __ring_m60.resolved_dicts; const dict_dispatch = __ring_m60.dict_dispatch; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      const new_callee = rc_expr(callee, false, owned, boxed, externs, gensym, loop_base);
      const ctor_sink = is_variant_constructor_call(callee, ty);
      const sink = sink_arg_indices(callee, List_len(args));
      let new_args = [];
      let i = 0;
      const __ring_iter_38 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_38 = __ListIterator_Iterator.next(__ring_iter_38);
        if (__ring_next_38._tag === "none") break;
        const a = __ring_next_38._0;
        const new_a = ((ctor_sink ? true : list_contains_int(sink, i)) ? rc_escape(a, owned, boxed, externs, gensym, loop_base) : rc_expr(a, false, owned, boxed, externs, gensym, loop_base));
        List_push(new_args, new_a);
        i = (i + 1);
      }
      return hir$HExpr_Call(new_callee, new_args, type_args, resolved_dicts, dict_dispatch, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "FieldAccess") {
      const receiver = __ring_m60.receiver; const field = __ring_m60.field; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_FieldAccess(rc_expr(receiver, false, owned, boxed, externs, gensym, loop_base), field, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "StructLit") {
      const name = __ring_m60.name; const type_args = __ring_m60.type_args; const fields = __ring_m60.fields; const spread = __ring_m60.spread; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      let new_fields = [];
      const __ring_iter_39 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_39 = __ListIterator_Iterator.next(__ring_iter_39);
        if (__ring_next_39._tag === "none") break;
        const f = __ring_next_39._0;
        List_push(new_fields, new hir$HStructFieldInit(f.name, rc_escape(f.value, owned, boxed, externs, gensym, loop_base)));
      }
      let __ring_blk14;
      __ring_match61: {
        const __ring_m61 = spread;
        if (__ring_m61._tag === "some") {
          const s = __ring_m61._0;
          __ring_blk14 = Option_some(rc_expr(s, false, owned, boxed, externs, gensym, loop_base));
          break __ring_match61;
        }
        if (__ring_m61._tag === "none") {
          __ring_blk14 = Option_none;
          break __ring_match61;
        }
        __match_fail(__ring_m61);
      }
      const new_spread = __ring_blk14;
      return hir$HExpr_StructLit(name, type_args, new_fields, new_spread, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "NamedVariantConstruct") {
      const enum_name = __ring_m60.enum_name; const variant_name = __ring_m60.variant_name; const fields = __ring_m60.fields; const spread = __ring_m60.spread; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      let new_fields = [];
      const __ring_iter_40 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_40 = __ListIterator_Iterator.next(__ring_iter_40);
        if (__ring_next_40._tag === "none") break;
        const f = __ring_next_40._0;
        List_push(new_fields, new hir$HStructFieldInit(f.name, rc_escape(f.value, owned, boxed, externs, gensym, loop_base)));
      }
      let __ring_blk15;
      __ring_match62: {
        const __ring_m62 = spread;
        if (__ring_m62._tag === "some") {
          const s = __ring_m62._0;
          __ring_blk15 = Option_some(rc_expr(s, false, owned, boxed, externs, gensym, loop_base));
          break __ring_match62;
        }
        if (__ring_m62._tag === "none") {
          __ring_blk15 = Option_none;
          break __ring_match62;
        }
        __match_fail(__ring_m62);
      }
      const new_spread = __ring_blk15;
      return hir$HExpr_NamedVariantConstruct(enum_name, variant_name, new_fields, new_spread, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "Block") {
      const stmts = __ring_m60.stmts; const tail = __ring_m60.tail; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      const res = rc_block_inner(stmts, tail, escape, owned, boxed, externs, gensym, loop_base);
      return hir$HExpr_Block(res[0], res[1], ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "IfExpr") {
      const condition = __ring_m60.condition; const then_branch = __ring_m60.then_branch; const else_branch = __ring_m60.else_branch; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      const new_cond = rc_expr(condition, false, owned, boxed, externs, gensym, loop_base);
      const new_then = rc_block_root(then_branch, escape, owned, boxed, externs, gensym, loop_base);
      let __ring_blk16;
      __ring_match63: {
        const __ring_m63 = else_branch;
        if (__ring_m63._tag === "some") {
          const eb = __ring_m63._0;
          __ring_blk16 = Option_some(rc_block_root(eb, escape, owned, boxed, externs, gensym, loop_base));
          break __ring_match63;
        }
        if (__ring_m63._tag === "none") {
          __ring_blk16 = Option_none;
          break __ring_match63;
        }
        __match_fail(__ring_m63);
      }
      const new_else = __ring_blk16;
      return hir$HExpr_IfExpr(new_cond, new_then, new_else, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "MatchExpr") {
      const scrutinee = __ring_m60.scrutinee; const arms = __ring_m60.arms; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      const new_scrutinee = rc_expr(scrutinee, false, owned, boxed, externs, gensym, loop_base);
      let new_arms = [];
      const __ring_iter_41 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_41 = __ListIterator_Iterator.next(__ring_iter_41);
        if (__ring_next_41._tag === "none") break;
        const arm = __ring_next_41._0;
        let __ring_blk17;
        __ring_match64: {
          const __ring_m64 = arm.guard;
          if (__ring_m64._tag === "some") {
            const g = __ring_m64._0;
            __ring_blk17 = Option_some(rc_expr(g, false, owned, boxed, externs, gensym, loop_base));
            break __ring_match64;
          }
          if (__ring_m64._tag === "none") {
            __ring_blk17 = Option_none;
            break __ring_match64;
          }
          __match_fail(__ring_m64);
        }
        const new_guard = __ring_blk17;
        const new_body = rc_block_root(arm.body, escape, owned, boxed, externs, gensym, loop_base);
        List_push(new_arms, new hir$HMatchArm(arm.pattern, new_guard, new_body, arm.span));
      }
      return hir$HExpr_MatchExpr(new_scrutinee, new_arms, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "StringInterp") {
      const parts = __ring_m60.parts; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      let new_parts = [];
      const __ring_iter_42 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_42 = __ListIterator_Iterator.next(__ring_iter_42);
        if (__ring_next_42._tag === "none") break;
        const p = __ring_next_42._0;
        __ring_match65: {
          const __ring_m65 = p;
          if (__ring_m65._tag === "Expression") {
            const e = __ring_m65._0;
            List_push(new_parts, hir$HStringInterpPart_Expression(rc_expr(e, false, owned, boxed, externs, gensym, loop_base)));
            break __ring_match65;
          }
          if (__ring_m65._tag === "Literal") {
            const s = __ring_m65._0;
            List_push(new_parts, hir$HStringInterpPart_Literal(s));
            break __ring_match65;
          }
          __match_fail(__ring_m65);
        }
      }
      return hir$HExpr_StringInterp(new_parts, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "TryCatch") {
      const body = __ring_m60.body; const arms = __ring_m60.arms; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      const new_body = rc_block_root(body, escape, owned, boxed, externs, gensym, loop_base);
      let new_arms = [];
      const __ring_iter_43 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_43 = __ListIterator_Iterator.next(__ring_iter_43);
        if (__ring_next_43._tag === "none") break;
        const arm = __ring_next_43._0;
        const new_body_arm = rc_block_root(arm.body, escape, owned, boxed, externs, gensym, loop_base);
        List_push(new_arms, new hir$HMatchArm(arm.pattern, arm.guard, new_body_arm, arm.span));
      }
      return hir$HExpr_TryCatch(new_body, new_arms, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "HandleExpr") {
      const body = __ring_m60.body; const handlers = __ring_m60.handlers; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      const new_body = rc_block_root(body, escape, owned, boxed, externs, gensym, loop_base);
      let new_handlers = [];
      const __ring_iter_44 = __List_Iterable.iter(handlers);
      while (true) {
        const __ring_next_44 = __ListIterator_Iterator.next(__ring_iter_44);
        if (__ring_next_44._tag === "none") break;
        const h = __ring_next_44._0;
        const h_body = rc_block_root(h.body, true, [], boxed, externs, gensym, (0 - 1));
        List_push(new_handlers, new hir$HEffectHandler(h.effect_name, h.op_name, h.params, h.resume_name, h_body));
      }
      return hir$HExpr_HandleExpr(new_body, new_handlers, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "Lambda") {
      const params = __ring_m60.params; const return_type = __ring_m60.return_type; const body = __ring_m60.body; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      const new_body = rc_block_root(body, true, [], boxed, externs, gensym, (0 - 1));
      return hir$HExpr_Lambda(params, return_type, new_body, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "EffectOp") {
      const effect_name = __ring_m60.effect_name; const op_name = __ring_m60.op_name; const args = __ring_m60.args; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      let new_args = [];
      const __ring_iter_45 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_45 = __ListIterator_Iterator.next(__ring_iter_45);
        if (__ring_next_45._tag === "none") break;
        const a = __ring_next_45._0;
        List_push(new_args, rc_expr(a, false, owned, boxed, externs, gensym, loop_base));
      }
      return hir$HExpr_EffectOp(effect_name, op_name, new_args, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "RangeExpr") {
      const start = __ring_m60.start; const end = __ring_m60.end; const inclusive = __ring_m60.inclusive; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_RangeExpr(rc_escape(start, owned, boxed, externs, gensym, loop_base), rc_escape(end, owned, boxed, externs, gensym, loop_base), inclusive, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "ListLit") {
      const elements = __ring_m60.elements; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      let new_elems = [];
      const __ring_iter_46 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_46 = __ListIterator_Iterator.next(__ring_iter_46);
        if (__ring_next_46._tag === "none") break;
        const e = __ring_next_46._0;
        List_push(new_elems, rc_escape(e, owned, boxed, externs, gensym, loop_base));
      }
      return hir$HExpr_ListLit(new_elems, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "TupleLit") {
      const elements = __ring_m60.elements; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      let new_elems = [];
      const __ring_iter_47 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_47 = __ListIterator_Iterator.next(__ring_iter_47);
        if (__ring_next_47._tag === "none") break;
        const e = __ring_next_47._0;
        List_push(new_elems, rc_escape(e, owned, boxed, externs, gensym, loop_base));
      }
      return hir$HExpr_TupleLit(new_elems, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "IndexExpr") {
      const receiver = __ring_m60.receiver; const index = __ring_m60.index; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_IndexExpr(rc_expr(receiver, false, owned, boxed, externs, gensym, loop_base), rc_expr(index, false, owned, boxed, externs, gensym, loop_base), ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "Clone") {
      const inner = __ring_m60.inner; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      return hir$HExpr_Clone(inner, ty, effects, span);
      break __ring_match60;
    }
    if (__ring_m60._tag === "ReturnExpr") {
      const value = __ring_m60.value; const ty = __ring_m60.ty; const effects = __ring_m60.effects; const span = __ring_m60.span;
      __ring_match66: {
        const __ring_m66 = value;
        if (__ring_m66._tag === "some") {
          const v = __ring_m66._0;
          const new_v = rc_escape(v, owned, boxed, externs, gensym, loop_base);
          let out = [];
          const tmp = fresh_scope_tmp(gensym);
          const tt = hir$hexpr_type(v);
          const te = hir$hexpr_effects(v);
          const ts = hir$hexpr_span(v);
          List_push(out, hir$HStmt_Let(tmp, synthetic_span(), Option_none, tt, new_v, synthetic_span()));
          const __ring_iter_48 = __List_Iterable.iter(drops_for(owned));
          while (true) {
            const __ring_next_48 = __ListIterator_Iterator.next(__ring_iter_48);
            if (__ring_next_48._tag === "none") break;
            const d = __ring_next_48._0;
            List_push(out, d);
          }
          const tmp_id = hir$HExpr_Ident(tmp, Option_none, Option_none, Option_none, tt, te, ts);
          const ret_expr = hir$HExpr_ReturnExpr(Option_some(tmp_id), ty, effects, span);
          return hir$HExpr_Block(out, Option_some(ret_expr), ty, effects, span);
          break __ring_match66;
        }
        if (__ring_m66._tag === "none") {
          let out = [];
          const __ring_iter_49 = __List_Iterable.iter(drops_for(owned));
          while (true) {
            const __ring_next_49 = __ListIterator_Iterator.next(__ring_iter_49);
            if (__ring_next_49._tag === "none") break;
            const d = __ring_next_49._0;
            List_push(out, d);
          }
          const ret_expr = hir$HExpr_ReturnExpr(Option_none, ty, effects, span);
          return hir$HExpr_Block(out, Option_some(ret_expr), ty, effects, span);
          break __ring_match66;
        }
        __match_fail(__ring_m66);
      }
      break __ring_match60;
    }
    __match_fail(__ring_m60);
  }
}

function rc_escape(expr, owned, boxed, externs, gensym, loop_base) {
  if ((is_owner_bearing(expr) ? (hir$is_rc_excluded_type(hir$hexpr_type(expr), externs) === false) : false)) {
    const inner = rc_expr(expr, false, owned, boxed, externs, gensym, loop_base);
    return hir$HExpr_Clone(inner, hir$hexpr_type(expr), hir$hexpr_effects(expr), hir$hexpr_span(expr));
  } else {
    return rc_expr(expr, true, owned, boxed, externs, gensym, loop_base);
  }
}

function transform_fn_body(params, body, boxed, externs) {
  const owned = [];
  let gensym = [0];
  return rc_block_root(body, true, owned, boxed, externs, gensym, (0 - 1));
}

function transform_decl(decl, boxed, externs) {
  __ring_match67: {
    const __ring_m67 = decl;
    if (__ring_m67._tag === "Fn") {
      const name = __ring_m67.name; const def_id = __ring_m67.def_id; const type_params = __ring_m67.type_params; const params = __ring_m67.params; const return_type = __ring_m67.return_type; const effects = __ring_m67.effects; const body = __ring_m67.body; const is_pub = __ring_m67.is_pub; const trait_bounds = __ring_m67.trait_bounds; const span = __ring_m67.span;
      const new_body = transform_fn_body(params, body, boxed, externs);
      return hir$HDecl_Fn(name, def_id, type_params, params, return_type, effects, new_body, is_pub, trait_bounds, span);
      break __ring_match67;
    }
    if (__ring_m67._tag === "Impl") {
      const target_type = __ring_m67.target_type; const type_params = __ring_m67.type_params; const trait_name = __ring_m67.trait_name; const methods = __ring_m67.methods; const assoc_types = __ring_m67.assoc_types; const span = __ring_m67.span;
      const new_methods = transform_decls(methods, boxed, externs);
      return hir$HDecl_Impl(target_type, type_params, trait_name, new_methods, assoc_types, span);
      break __ring_match67;
    }
    if (__ring_m67._tag === "Test") {
      const description = __ring_m67.description; const body = __ring_m67.body; const span = __ring_m67.span;
      const new_body = transform_fn_body([], body, boxed, externs);
      return hir$HDecl_Test(description, new_body, span);
      break __ring_match67;
    }
    if (__ring_m67._tag === "Const") {
      const name = __ring_m67.name; const def_id = __ring_m67.def_id; const ty = __ring_m67.ty; const init = __ring_m67.init; const is_pub = __ring_m67.is_pub; const span = __ring_m67.span;
      const owned = [];
      let gensym = [0];
      const new_init = rc_escape(init, owned, boxed, externs, gensym, (0 - 1));
      return hir$HDecl_Const(name, def_id, ty, new_init, is_pub, span);
      break __ring_match67;
    }
    if (__ring_m67._tag === "ModBlock") {
      const name = __ring_m67.name; const mod_decls = __ring_m67.decls; const is_pub = __ring_m67.is_pub; const span = __ring_m67.span;
      return hir$HDecl_ModBlock(name, transform_decls(mod_decls, boxed, externs), is_pub, span);
      break __ring_match67;
    }
    if (__ring_m67._tag === "Struct") {
      return decl;
      break __ring_match67;
    }
    if (__ring_m67._tag === "Enum") {
      return decl;
      break __ring_match67;
    }
    if (__ring_m67._tag === "Effect") {
      return decl;
      break __ring_match67;
    }
    if (__ring_m67._tag === "Trait") {
      return decl;
      break __ring_match67;
    }
    if (__ring_m67._tag === "ExternFn") {
      return decl;
      break __ring_match67;
    }
    if (__ring_m67._tag === "ExternType") {
      return decl;
      break __ring_match67;
    }
    if (__ring_m67._tag === "TypeAlias") {
      return decl;
      break __ring_match67;
    }
    if (__ring_m67._tag === "Sig") {
      return decl;
      break __ring_match67;
    }
    __match_fail(__ring_m67);
  }
}

function transform_decls(decls, boxed, externs) {
  let result = [];
  const __ring_iter_50 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_50 = __ListIterator_Iterator.next(__ring_iter_50);
    if (__ring_next_50._tag === "none") break;
    const d = __ring_next_50._0;
    List_push(result, transform_decl(d, boxed, externs));
  }
  return result;
}

function perceus_transform_mutated(program, mutate) {
  const externs = program.extern_type_names;
  const anf_program = ((mutate === "skip-anf") ? program : anf_normalize(program, externs));
  const new_decls = transform_decls(anf_program.decls, anf_program.boxed_vars, externs);
  const mutated_decls = ((mutate === "drop-params") ? mutate_drop_params(new_decls) : new_decls);
  return new hir$HProgram(mutated_decls, anf_program.derived_impls, anf_program.boxed_vars, anf_program.static_dicts, anf_program.extern_type_names);
}

function perceus_transform(program) {
  return perceus_transform_mutated(program, "");
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


export { rc_name_skippable, perceus_transform, perceus_transform_mutated, is_str_index, is_unresolved_var_type, is_scalar_type, sink_arg_indices, is_variant_constructor_call, stmt_diverges, expr_diverges };