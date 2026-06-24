import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";



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

function dl_register(defs, seen, def) {
  if ((_Set_contains(seen, def.name, __Str_Eq) === false)) {
    _Set_insert(seen, def.name);
    return List_push(defs, def);
  }
}

function dl_ref_static_only(dr, defs, seen) {
  __ring_match6: {
    const __ring_m6 = dr;
    if (__ring_m6._tag === "Simple") {
      const name = __ring_m6._0;
      return hir$DictRef_Simple(name);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Static") {
      const name = __ring_m6._0;
      dl_register(defs, seen, new hir$HDictDef(name, name, "", []));
      return hir$DictRef_Static(name);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Wrapped") {
      const dict = __ring_m6.dict; const trait_name = __ring_m6.trait_name; const inner_dicts = __ring_m6.inner_dicts;
      let inner_refs = [];
      const __ring_iter_2 = __List_Iterable.iter(inner_dicts);
      while (true) {
        const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
        if (__ring_next_2._tag === "none") break;
        const i = __ring_next_2._0;
        List_push(inner_refs, dl_ref_static_only(i, defs, seen));
      }
      let all_static = true;
      let inner_names = [];
      const __ring_iter_3 = __List_Iterable.iter(inner_refs);
      while (true) {
        const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
        if (__ring_next_3._tag === "none") break;
        const r = __ring_next_3._0;
        __ring_match7: {
          const __ring_m7 = r;
          if (__ring_m7._tag === "Static") {
            const n = __ring_m7._0;
            List_push(inner_names, n);
            break __ring_match7;
          }
          all_static = false;
          break __ring_match7;
        }
      }
      if (all_static) {
        const inst = hir$dict_instance_name(dict, inner_names);
        dl_register(defs, seen, new hir$HDictDef(inst, dict, trait_name, inner_names));
        return hir$DictRef_Static(inst);
      } else {
        return hir$DictRef_Wrapped(dict, trait_name, inner_refs);
      }
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function dl_dispatch(d, defs, seen) {
  __ring_match8: {
    const __ring_m8 = d;
    if (__ring_m8._tag === "some") {
      const td = __ring_m8._0;
      __ring_match9: {
        const __ring_m9 = td;
        if (__ring_m9._tag === "Direct") {
          const dict = __ring_m9.dict; const extra_dicts = __ring_m9.extra_dicts;
          dl_register(defs, seen, new hir$HDictDef(dict, dict, "", []));
          let new_extra = [];
          const __ring_iter_4 = __List_Iterable.iter(extra_dicts);
          while (true) {
            const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
            if (__ring_next_4._tag === "none") break;
            const ed = __ring_next_4._0;
            List_push(new_extra, dl_ref_static_only(ed, defs, seen));
          }
          return Option_some(hir$TraitDispatch_Direct(dict, new_extra));
          break __ring_match9;
        }
        return Option_some(td);
        break __ring_match9;
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      return Option_none;
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
}

function dl_ref_dyn(dr, defs, seen, counter, lets, span) {
  __ring_match10: {
    const __ring_m10 = dr;
    if (__ring_m10._tag === "Simple") {
      const name = __ring_m10._0;
      return hir$DictRef_Simple(name);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Static") {
      const name = __ring_m10._0;
      dl_register(defs, seen, new hir$HDictDef(name, name, "", []));
      return hir$DictRef_Static(name);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Wrapped") {
      const dict = __ring_m10.dict; const trait_name = __ring_m10.trait_name; const inner_dicts = __ring_m10.inner_dicts;
      let inner_refs = [];
      const __ring_iter_5 = __List_Iterable.iter(inner_dicts);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const i = __ring_next_5._0;
        List_push(inner_refs, dl_ref_dyn(i, defs, seen, counter, lets, span));
      }
      let all_static = true;
      let inner_names = [];
      const __ring_iter_6 = __List_Iterable.iter(inner_refs);
      while (true) {
        const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
        if (__ring_next_6._tag === "none") break;
        const r = __ring_next_6._0;
        __ring_match11: {
          const __ring_m11 = r;
          if (__ring_m11._tag === "Static") {
            const n = __ring_m11._0;
            List_push(inner_names, n);
            break __ring_match11;
          }
          all_static = false;
          break __ring_match11;
        }
      }
      if (all_static) {
        const inst = hir$dict_instance_name(dict, inner_names);
        dl_register(defs, seen, new hir$HDictDef(inst, dict, trait_name, inner_names));
        return hir$DictRef_Static(inst);
      } else {
        List_set(counter, 0, (__ring_index(counter, 0) + 1));
        const lname = `__ring_dictlocal_${__ring_index(counter, 0)}`;
        const construct = hir$HExpr_DictConstruct(dict, trait_name, inner_refs, types$Type_TupleType([]), types$EMPTY_ROW, span);
        List_push(lets, hir$HStmt_Let(lname, span, Option_none, types$Type_TupleType([]), construct, span));
        return hir$DictRef_Simple(lname);
      }
      break __ring_match10;
    }
    __match_fail(__ring_m10);
  }
}

function dl_stmt(s, defs, seen, counter) {
  __ring_match12: {
    const __ring_m12 = s;
    if (__ring_m12._tag === "Let") {
      const name = __ring_m12.name; const name_span = __ring_m12.name_span; const def_id = __ring_m12.def_id; const ty = __ring_m12.ty; const init = __ring_m12.init; const span = __ring_m12.span;
      return hir$HStmt_Let(name, name_span, def_id, ty, dl_expr(init, defs, seen, counter), span);
      break __ring_match12;
    }
    if (__ring_m12._tag === "Var") {
      const name = __ring_m12.name; const name_span = __ring_m12.name_span; const def_id = __ring_m12.def_id; const ty = __ring_m12.ty; const init = __ring_m12.init; const span = __ring_m12.span;
      return hir$HStmt_Var(name, name_span, def_id, ty, dl_expr(init, defs, seen, counter), span);
      break __ring_match12;
    }
    if (__ring_m12._tag === "Assign") {
      const target = __ring_m12.target; const value = __ring_m12.value; const span = __ring_m12.span;
      return hir$HStmt_Assign(dl_expr(target, defs, seen, counter), dl_expr(value, defs, seen, counter), span);
      break __ring_match12;
    }
    if (__ring_m12._tag === "ExprStmt") {
      const expr = __ring_m12.expr; const span = __ring_m12.span;
      return hir$HStmt_ExprStmt(dl_expr(expr, defs, seen, counter), span);
      break __ring_match12;
    }
    if (__ring_m12._tag === "Return") {
      const value = __ring_m12.value; const span = __ring_m12.span;
      let __ring_blk0;
      __ring_match13: {
        const __ring_m13 = value;
        if (__ring_m13._tag === "some") {
          const v = __ring_m13._0;
          __ring_blk0 = Option_some(dl_expr(v, defs, seen, counter));
          break __ring_match13;
        }
        if (__ring_m13._tag === "none") {
          __ring_blk0 = Option_none;
          break __ring_match13;
        }
        __match_fail(__ring_m13);
      }
      const new_value = __ring_blk0;
      return hir$HStmt_Return(new_value, span);
      break __ring_match12;
    }
    if (__ring_m12._tag === "While") {
      const condition = __ring_m12.condition; const body = __ring_m12.body; const span = __ring_m12.span;
      return hir$HStmt_While(dl_expr(condition, defs, seen, counter), dl_expr(body, defs, seen, counter), span);
      break __ring_match12;
    }
    if (__ring_m12._tag === "ForIn") {
      const binding = __ring_m12.binding; const binding_span = __ring_m12.binding_span; const def_id = __ring_m12.def_id; const destructure = __ring_m12.destructure; const iterable = __ring_m12.iterable; const body = __ring_m12.body; const iterable_type_name = __ring_m12.iterable_type_name; const iter_type_name = __ring_m12.iter_type_name; const span = __ring_m12.span;
      return hir$HStmt_ForIn(binding, binding_span, def_id, destructure, dl_expr(iterable, defs, seen, counter), dl_expr(body, defs, seen, counter), iterable_type_name, iter_type_name, span);
      break __ring_match12;
    }
    if (__ring_m12._tag === "Break") {
      return s;
      break __ring_match12;
    }
    if (__ring_m12._tag === "Continue") {
      return s;
      break __ring_match12;
    }
    if (__ring_m12._tag === "LetDestructure") {
      const pattern = __ring_m12.pattern; const bindings = __ring_m12.bindings; const init = __ring_m12.init; const span = __ring_m12.span;
      return hir$HStmt_LetDestructure(pattern, bindings, dl_expr(init, defs, seen, counter), span);
      break __ring_match12;
    }
    if (__ring_m12._tag === "IfLet") {
      const pattern = __ring_m12.pattern; const expr = __ring_m12.expr; const then_block = __ring_m12.then_block; const else_block = __ring_m12.else_block; const span = __ring_m12.span;
      let __ring_blk1;
      __ring_match14: {
        const __ring_m14 = else_block;
        if (__ring_m14._tag === "some") {
          const eb = __ring_m14._0;
          __ring_blk1 = Option_some(dl_expr(eb, defs, seen, counter));
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          __ring_blk1 = Option_none;
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      const new_else = __ring_blk1;
      return hir$HStmt_IfLet(pattern, dl_expr(expr, defs, seen, counter), dl_expr(then_block, defs, seen, counter), new_else, span);
      break __ring_match12;
    }
    if (__ring_m12._tag === "Drop") {
      return s;
      break __ring_match12;
    }
    if (__ring_m12._tag === "Dup") {
      return s;
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
}

function dl_expr(e, defs, seen, counter) {
  __ring_match15: {
    const __ring_m15 = e;
    if (__ring_m15._tag === "IntLit") {
      return e;
      break __ring_match15;
    }
    if (__ring_m15._tag === "FloatLit") {
      return e;
      break __ring_match15;
    }
    if (__ring_m15._tag === "StrLit") {
      return e;
      break __ring_match15;
    }
    if (__ring_m15._tag === "BoolLit") {
      return e;
      break __ring_match15;
    }
    if (__ring_m15._tag === "Ident") {
      return e;
      break __ring_match15;
    }
    if (__ring_m15._tag === "BinOp") {
      const op = __ring_m15.op; const left = __ring_m15.left; const right = __ring_m15.right; const eq_dispatch = __ring_m15.eq_dispatch; const ord_dispatch = __ring_m15.ord_dispatch; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      return hir$HExpr_BinOp(op, dl_expr(left, defs, seen, counter), dl_expr(right, defs, seen, counter), dl_dispatch(eq_dispatch, defs, seen), dl_dispatch(ord_dispatch, defs, seen), ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "UnaryOp") {
      const op = __ring_m15.op; const operand = __ring_m15.operand; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      return hir$HExpr_UnaryOp(op, dl_expr(operand, defs, seen, counter), ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "Call") {
      const callee = __ring_m15.callee; const args = __ring_m15.args; const type_args = __ring_m15.type_args; const resolved_dicts = __ring_m15.resolved_dicts; const dict_dispatch = __ring_m15.dict_dispatch; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      const new_callee = dl_expr(callee, defs, seen, counter);
      let new_args = [];
      const __ring_iter_7 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
        if (__ring_next_7._tag === "none") break;
        const a = __ring_next_7._0;
        List_push(new_args, dl_expr(a, defs, seen, counter));
      }
      let lets = [];
      let new_dicts = [];
      const __ring_iter_8 = __List_Iterable.iter(resolved_dicts);
      while (true) {
        const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
        if (__ring_next_8._tag === "none") break;
        const dr = __ring_next_8._0;
        List_push(new_dicts, dl_ref_dyn(dr, defs, seen, counter, lets, span));
      }
      const call = hir$HExpr_Call(new_callee, new_args, type_args, new_dicts, dict_dispatch, ty, effects, span);
      if ((List_len(lets) === 0)) {
        return call;
      } else {
        return hir$HExpr_Block(lets, Option_some(call), ty, effects, span);
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "FieldAccess") {
      const receiver = __ring_m15.receiver; const field = __ring_m15.field; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      return hir$HExpr_FieldAccess(dl_expr(receiver, defs, seen, counter), field, ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "StructLit") {
      const name = __ring_m15.name; const type_args = __ring_m15.type_args; const fields = __ring_m15.fields; const spread = __ring_m15.spread; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      let new_fields = [];
      const __ring_iter_9 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
        if (__ring_next_9._tag === "none") break;
        const f = __ring_next_9._0;
        List_push(new_fields, new hir$HStructFieldInit(f.name, dl_expr(f.value, defs, seen, counter)));
      }
      let __ring_blk2;
      __ring_match16: {
        const __ring_m16 = spread;
        if (__ring_m16._tag === "some") {
          const s = __ring_m16._0;
          __ring_blk2 = Option_some(dl_expr(s, defs, seen, counter));
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          __ring_blk2 = Option_none;
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      const new_spread = __ring_blk2;
      return hir$HExpr_StructLit(name, type_args, new_fields, new_spread, ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "NamedVariantConstruct") {
      const enum_name = __ring_m15.enum_name; const variant_name = __ring_m15.variant_name; const fields = __ring_m15.fields; const spread = __ring_m15.spread; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      let new_fields = [];
      const __ring_iter_10 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
        if (__ring_next_10._tag === "none") break;
        const f = __ring_next_10._0;
        List_push(new_fields, new hir$HStructFieldInit(f.name, dl_expr(f.value, defs, seen, counter)));
      }
      let __ring_blk3;
      __ring_match17: {
        const __ring_m17 = spread;
        if (__ring_m17._tag === "some") {
          const s = __ring_m17._0;
          __ring_blk3 = Option_some(dl_expr(s, defs, seen, counter));
          break __ring_match17;
        }
        if (__ring_m17._tag === "none") {
          __ring_blk3 = Option_none;
          break __ring_match17;
        }
        __match_fail(__ring_m17);
      }
      const new_spread = __ring_blk3;
      return hir$HExpr_NamedVariantConstruct(enum_name, variant_name, new_fields, new_spread, ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "MatchExpr") {
      const scrutinee = __ring_m15.scrutinee; const arms = __ring_m15.arms; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      return hir$HExpr_MatchExpr(dl_expr(scrutinee, defs, seen, counter), dl_arms(arms, defs, seen, counter), ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "Block") {
      const stmts = __ring_m15.stmts; const tail = __ring_m15.tail; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      let new_stmts = [];
      const __ring_iter_11 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
        if (__ring_next_11._tag === "none") break;
        const s = __ring_next_11._0;
        List_push(new_stmts, dl_stmt(s, defs, seen, counter));
      }
      let __ring_blk4;
      __ring_match18: {
        const __ring_m18 = tail;
        if (__ring_m18._tag === "some") {
          const t = __ring_m18._0;
          __ring_blk4 = Option_some(dl_expr(t, defs, seen, counter));
          break __ring_match18;
        }
        if (__ring_m18._tag === "none") {
          __ring_blk4 = Option_none;
          break __ring_match18;
        }
        __match_fail(__ring_m18);
      }
      const new_tail = __ring_blk4;
      return hir$HExpr_Block(new_stmts, new_tail, ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "IfExpr") {
      const condition = __ring_m15.condition; const then_branch = __ring_m15.then_branch; const else_branch = __ring_m15.else_branch; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      let __ring_blk5;
      __ring_match19: {
        const __ring_m19 = else_branch;
        if (__ring_m19._tag === "some") {
          const eb = __ring_m19._0;
          __ring_blk5 = Option_some(dl_expr(eb, defs, seen, counter));
          break __ring_match19;
        }
        if (__ring_m19._tag === "none") {
          __ring_blk5 = Option_none;
          break __ring_match19;
        }
        __match_fail(__ring_m19);
      }
      const new_else = __ring_blk5;
      return hir$HExpr_IfExpr(dl_expr(condition, defs, seen, counter), dl_expr(then_branch, defs, seen, counter), new_else, ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "StringInterp") {
      const parts = __ring_m15.parts; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      let new_parts = [];
      const __ring_iter_12 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
        if (__ring_next_12._tag === "none") break;
        const p = __ring_next_12._0;
        __ring_match20: {
          const __ring_m20 = p;
          if (__ring_m20._tag === "Literal") {
            const s = __ring_m20._0;
            List_push(new_parts, hir$HStringInterpPart_Literal(s));
            break __ring_match20;
          }
          if (__ring_m20._tag === "Expression") {
            const ex = __ring_m20._0;
            List_push(new_parts, hir$HStringInterpPart_Expression(dl_expr(ex, defs, seen, counter)));
            break __ring_match20;
          }
          __match_fail(__ring_m20);
        }
      }
      return hir$HExpr_StringInterp(new_parts, ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "TryCatch") {
      const body = __ring_m15.body; const arms = __ring_m15.arms; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      return hir$HExpr_TryCatch(dl_expr(body, defs, seen, counter), dl_arms(arms, defs, seen, counter), ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "HandleExpr") {
      const body = __ring_m15.body; const handlers = __ring_m15.handlers; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      let new_handlers = [];
      const __ring_iter_13 = __List_Iterable.iter(handlers);
      while (true) {
        const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
        if (__ring_next_13._tag === "none") break;
        const h = __ring_next_13._0;
        List_push(new_handlers, new hir$HEffectHandler(h.effect_name, h.op_name, h.params, h.resume_name, dl_expr(h.body, defs, seen, counter)));
      }
      return hir$HExpr_HandleExpr(dl_expr(body, defs, seen, counter), new_handlers, ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "Lambda") {
      const params = __ring_m15.params; const return_type = __ring_m15.return_type; const body = __ring_m15.body; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      return hir$HExpr_Lambda(params, return_type, dl_expr(body, defs, seen, counter), ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "EffectOp") {
      const effect_name = __ring_m15.effect_name; const op_name = __ring_m15.op_name; const args = __ring_m15.args; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      let new_args = [];
      const __ring_iter_14 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
        if (__ring_next_14._tag === "none") break;
        const a = __ring_next_14._0;
        List_push(new_args, dl_expr(a, defs, seen, counter));
      }
      return hir$HExpr_EffectOp(effect_name, op_name, new_args, ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "RangeExpr") {
      const start = __ring_m15.start; const end = __ring_m15.end; const inclusive = __ring_m15.inclusive; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      return hir$HExpr_RangeExpr(dl_expr(start, defs, seen, counter), dl_expr(end, defs, seen, counter), inclusive, ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "ListLit") {
      const elements = __ring_m15.elements; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      let new_elems = [];
      const __ring_iter_15 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
        if (__ring_next_15._tag === "none") break;
        const el = __ring_next_15._0;
        List_push(new_elems, dl_expr(el, defs, seen, counter));
      }
      return hir$HExpr_ListLit(new_elems, ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "TupleLit") {
      const elements = __ring_m15.elements; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      let new_elems = [];
      const __ring_iter_16 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
        if (__ring_next_16._tag === "none") break;
        const el = __ring_next_16._0;
        List_push(new_elems, dl_expr(el, defs, seen, counter));
      }
      return hir$HExpr_TupleLit(new_elems, ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "IndexExpr") {
      const receiver = __ring_m15.receiver; const index = __ring_m15.index; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      return hir$HExpr_IndexExpr(dl_expr(receiver, defs, seen, counter), dl_expr(index, defs, seen, counter), ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "DictConstruct") {
      return e;
      break __ring_match15;
    }
    if (__ring_m15._tag === "Clone") {
      const inner = __ring_m15.inner; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      return hir$HExpr_Clone(dl_expr(inner, defs, seen, counter), ty, effects, span);
      break __ring_match15;
    }
    if (__ring_m15._tag === "ReturnExpr") {
      const value = __ring_m15.value; const ty = __ring_m15.ty; const effects = __ring_m15.effects; const span = __ring_m15.span;
      __ring_match21: {
        const __ring_m21 = value;
        if (__ring_m21._tag === "some") {
          const v = __ring_m21._0;
          return hir$HExpr_ReturnExpr(Option_some(dl_expr(v, defs, seen, counter)), ty, effects, span);
          break __ring_match21;
        }
        if (__ring_m21._tag === "none") {
          return e;
          break __ring_match21;
        }
        __match_fail(__ring_m21);
      }
      break __ring_match15;
    }
    __match_fail(__ring_m15);
  }
}

function dl_arms(arms, defs, seen, counter) {
  let out = [];
  const __ring_iter_17 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
    if (__ring_next_17._tag === "none") break;
    const arm = __ring_next_17._0;
    let __ring_blk6;
    __ring_match22: {
      const __ring_m22 = arm.guard;
      if (__ring_m22._tag === "some") {
        const g = __ring_m22._0;
        __ring_blk6 = Option_some(dl_expr(g, defs, seen, counter));
        break __ring_match22;
      }
      if (__ring_m22._tag === "none") {
        __ring_blk6 = Option_none;
        break __ring_match22;
      }
      __match_fail(__ring_m22);
    }
    const new_guard = __ring_blk6;
    List_push(out, new hir$HMatchArm(arm.pattern, new_guard, dl_expr(arm.body, defs, seen, counter), arm.span));
  }
  return out;
}

function dl_decl(d, defs, seen, counter) {
  __ring_match23: {
    const __ring_m23 = d;
    if (__ring_m23._tag === "Fn") {
      const name = __ring_m23.name; const def_id = __ring_m23.def_id; const type_params = __ring_m23.type_params; const params = __ring_m23.params; const return_type = __ring_m23.return_type; const effects = __ring_m23.effects; const body = __ring_m23.body; const is_pub = __ring_m23.is_pub; const trait_bounds = __ring_m23.trait_bounds; const span = __ring_m23.span;
      return hir$HDecl_Fn(name, def_id, type_params, params, return_type, effects, dl_expr(body, defs, seen, counter), is_pub, trait_bounds, span);
      break __ring_match23;
    }
    if (__ring_m23._tag === "Impl") {
      const target_type = __ring_m23.target_type; const type_params = __ring_m23.type_params; const trait_name = __ring_m23.trait_name; const methods = __ring_m23.methods; const assoc_types = __ring_m23.assoc_types; const span = __ring_m23.span;
      let new_methods = [];
      const __ring_iter_18 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
        if (__ring_next_18._tag === "none") break;
        const m = __ring_next_18._0;
        List_push(new_methods, dl_decl(m, defs, seen, counter));
      }
      return hir$HDecl_Impl(target_type, type_params, trait_name, new_methods, assoc_types, span);
      break __ring_match23;
    }
    if (__ring_m23._tag === "Test") {
      const description = __ring_m23.description; const body = __ring_m23.body; const span = __ring_m23.span;
      return hir$HDecl_Test(description, dl_expr(body, defs, seen, counter), span);
      break __ring_match23;
    }
    if (__ring_m23._tag === "Const") {
      const name = __ring_m23.name; const def_id = __ring_m23.def_id; const ty = __ring_m23.ty; const init = __ring_m23.init; const is_pub = __ring_m23.is_pub; const span = __ring_m23.span;
      return hir$HDecl_Const(name, def_id, ty, dl_expr(init, defs, seen, counter), is_pub, span);
      break __ring_match23;
    }
    if (__ring_m23._tag === "ModBlock") {
      const name = __ring_m23.name; const decls = __ring_m23.decls; const is_pub = __ring_m23.is_pub; const span = __ring_m23.span;
      let new_inner = [];
      const __ring_iter_19 = __List_Iterable.iter(decls);
      while (true) {
        const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
        if (__ring_next_19._tag === "none") break;
        const md = __ring_next_19._0;
        List_push(new_inner, dl_decl(md, defs, seen, counter));
      }
      return hir$HDecl_ModBlock(name, new_inner, is_pub, span);
      break __ring_match23;
    }
    if (__ring_m23._tag === "Trait") {
      const name = __ring_m23.name; const type_params = __ring_m23.type_params; const methods = __ring_m23.methods; const supertraits = __ring_m23.supertraits; const assoc_types = __ring_m23.assoc_types; const is_pub = __ring_m23.is_pub; const span = __ring_m23.span;
      let new_methods = [];
      const __ring_iter_20 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
        if (__ring_next_20._tag === "none") break;
        const tm = __ring_next_20._0;
        let __ring_blk7;
        __ring_match24: {
          const __ring_m24 = tm.body;
          if (__ring_m24._tag === "some") {
            const b = __ring_m24._0;
            __ring_blk7 = Option_some(dl_expr(b, defs, seen, counter));
            break __ring_match24;
          }
          if (__ring_m24._tag === "none") {
            __ring_blk7 = Option_none;
            break __ring_match24;
          }
          __match_fail(__ring_m24);
        }
        const new_body = __ring_blk7;
        List_push(new_methods, new hir$HTraitMethod(tm.name, tm.params, tm.return_type, tm.effects, tm.has_default, new_body));
      }
      return hir$HDecl_Trait(name, type_params, new_methods, supertraits, assoc_types, is_pub, span);
      break __ring_match23;
    }
    return d;
    break __ring_match23;
  }
}

function lower_dicts(program) {
  let defs = [];
  let seen = set_new();
  let counter = [0];
  let new_decls = [];
  const __ring_iter_21 = __List_Iterable.iter(program.decls);
  while (true) {
    const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
    if (__ring_next_21._tag === "none") break;
    const d = __ring_next_21._0;
    List_push(new_decls, dl_decl(d, defs, seen, counter));
  }
  return new hir$HProgram(new_decls, program.derived_impls, program.boxed_vars, defs);
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


export { lower_dicts };