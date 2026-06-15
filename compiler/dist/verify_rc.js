import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { expr_diverges as perceus$expr_diverges, is_scalar_type as perceus$is_scalar_type, is_str_index as perceus$is_str_index, is_unresolved_var_type as perceus$is_unresolved_var_type, is_variant_constructor_call as perceus$is_variant_constructor_call, perceus_transform as perceus$perceus_transform, perceus_transform_mutated as perceus$perceus_transform_mutated, rc_name_skippable as perceus$rc_name_skippable, sink_arg_indices as perceus$sink_arg_indices, stmt_diverges as perceus$stmt_diverges } from "./perceus.js";



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

const CLS_OWNED = 0;

const CLS_BORROW = 1;

const CLS_EXCLUDED = 2;

const CLS_OPAQUE = 3;

const M_CONSUMED = 0;

const M_BORROWED = 1;

const K_OWNED = 0;

const K_BORROW = 1;

const K_NONOWNED = 2;

const S_LIVE = 0;

const S_DROPPED = 1;

const S_MOVED = 2;

class RcFinding {
  constructor(_class, fatal, message, fn_name, span) {
    this.class = _class;
    this.fatal = fatal;
    this.message = message;
    this.fn_name = fn_name;
    this.span = span;
  }
}

class VCtx {
  constructor(names, kinds, states, spans, frames, loop_bases, boxed, externs, findings, fn_name) {
    this.names = names;
    this.kinds = kinds;
    this.states = states;
    this.spans = spans;
    this.frames = frames;
    this.loop_bases = loop_bases;
    this.boxed = boxed;
    this.externs = externs;
    this.findings = findings;
    this.fn_name = fn_name;
  }
}

function rc_fatal_count(findings) {
  let n = 0;
  const __ring_iter_2 = __List_Iterable.iter(findings);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const f = __ring_next_2._0;
    if (f.fatal) {
      n = (n + 1);
    }
  }
  return n;
}

function rc_verify_boundary_note() {
  return "note: HIR-level proof. Codegen-level drops are outside this check (documented boundary): while-cond/guard box (codegen post-unbox drop), Set-iteration list + range-loop bounds (codegen drops), string interpolation SB + intermediate strings (gen_string_interp drops), handler evidence/catch closures (B-096), abort paths (longjmp skips scope drops — B-002).";
}

function format_rc_findings(findings, strict) {
  let lines = [];
  let class_names = [];
  let class_counts = [];
  const __ring_iter_3 = __List_Iterable.iter(findings);
  while (true) {
    const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
    if (__ring_next_3._tag === "none") break;
    const f = __ring_next_3._0;
    if ((f.fatal ? true : strict)) {
      List_push(lines, `${f.span.file}:${f.span.start.line}:${f.span.start.column} rc-verify[${f.class}] ${f.message}`);
    }
    if ((f.fatal === false)) {
      let idx = (0 - 1);
      let i = 0;
      while ((i < List_len(class_names))) {
        if ((__ring_index(class_names, i) === f.class)) {
          idx = i;
        }
        i = (i + 1);
      }
      if ((idx >= 0)) {
        List_set(class_counts, idx, (__ring_index(class_counts, idx) + 1));
      } else {
        List_push(class_names, f.class);
        List_push(class_counts, 1);
      }
    }
  }
  const fatal = rc_fatal_count(findings);
  const exempt = (List_len(findings) - fatal);
  if ((exempt > 0)) {
    let parts = [];
    let i = 0;
    while ((i < List_len(class_names))) {
      List_push(parts, `${__ring_index(class_names, i)}=${__ring_index(class_counts, i)}`);
      i = (i + 1);
    }
    const joined = List_join(parts, " ");
    List_push(lines, `rc-verify exempt classes: ${joined}`);
  }
  List_push(lines, `RC verify: ${fatal} errors, ${exempt} exempt (documented) findings`);
  List_push(lines, rc_verify_boundary_note());
  return List_join(lines, "\n");
}

function synthetic_vspan() {
  const pos = new ast$Position(0, 0, 0);
  return new ast$Span("<verify-rc>", pos, pos);
}

function v_type_excluded(ty, externs) {
  if (hir$is_rc_excluded_type(ty, externs)) {
    return true;
  } else {
    if (perceus$is_unresolved_var_type(ty)) {
      return true;
    } else {
      __ring_match6: {
        const __ring_m6 = ty;
        if (__ring_m6._tag === "NeverType") {
          return true;
          break __ring_match6;
        }
        return false;
        break __ring_match6;
      }
    }
  }
}

function v_cls_of_fresh(ty, externs) {
  if (v_type_excluded(ty, externs)) {
    return CLS_EXCLUDED;
  } else {
    if (hir$type_contains_extern_handle(ty, externs)) {
      return CLS_EXCLUDED;
    } else {
      return CLS_OWNED;
    }
  }
}

function v_lookup(ctx, name) {
  let i = (List_len(ctx.names) - 1);
  let found = (0 - 1);
  while (((i >= 0) ? (found < 0) : false)) {
    if ((__ring_index(ctx.names, i) === name)) {
      found = i;
    }
    i = (i - 1);
  }
  return found;
}

function v_report(ctx, _class, fatal, msg, span) {
  return List_push(ctx.findings, new RcFinding(_class, fatal, `in ${ctx.fn_name}: ${msg}`, ctx.fn_name, span));
}

function v_ident(name, ty, span, mode, ctx) {
  if (v_type_excluded(ty, ctx.externs)) {
    return CLS_EXCLUDED;
  }
  const idx = v_lookup(ctx, name);
  if ((idx < 0)) {
    return CLS_BORROW;
  }
  if ((__ring_index(ctx.kinds, idx) === K_OWNED)) {
    if ((__ring_index(ctx.states, idx) === S_DROPPED)) {
      v_report(ctx, "uaf-use-after-drop", true, `read of '${name}' after its Drop`, span);
      return CLS_BORROW;
    } else {
      if ((__ring_index(ctx.states, idx) === S_MOVED)) {
        v_report(ctx, "uaf-use-after-drop", true, `read of '${name}' after its value was moved out`, span);
        return CLS_BORROW;
      } else {
        if ((mode === M_CONSUMED)) {
          List_set(ctx.states, idx, S_MOVED);
          return CLS_OWNED;
        } else {
          return CLS_BORROW;
        }
      }
    }
  } else {
    if (((__ring_index(ctx.kinds, idx) === K_NONOWNED) ? (mode === M_CONSUMED) : false)) {
      List_set(ctx.states, idx, S_MOVED);
      return CLS_OPAQUE;
    } else {
      return CLS_BORROW;
    }
  }
}

function v_list_has_int(xs, x) {
  let found = false;
  const __ring_iter_4 = __List_Iterable.iter(xs);
  while (true) {
    const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
    if (__ring_next_4._tag === "none") break;
    const v = __ring_next_4._0;
    if ((v === x)) {
      found = true;
    }
  }
  return found;
}

function v_new_ctx(boxed, externs, findings, label) {
  const names = [];
  const kinds = [];
  const states = [];
  const spans = [];
  const frames = [];
  const loop_bases = [];
  return new VCtx(names, kinds, states, spans, frames, loop_bases, boxed, externs, findings, label);
}

function v_push_frame(ctx) {
  return List_push(ctx.frames, List_len(ctx.names));
}

function v_bind(ctx, name, kind, span) {
  if (perceus$rc_name_skippable(name)) {
    return;
  }
  const idx = v_lookup(ctx, name);
  if ((idx >= 0)) {
    if (((__ring_index(ctx.kinds, idx) === K_OWNED) ? (__ring_index(ctx.states, idx) === S_LIVE) : false)) {
      v_report(ctx, "x-shadow-overwrite", false, `re-binding '${name}' overwrites a live owned value (shared alloca; previous value leaks)`, span);
    }
    if (((__ring_index(ctx.kinds, idx) !== kind) ? ((__ring_index(ctx.kinds, idx) === K_OWNED) ? true : (kind === K_OWNED)) : false)) {
      v_report(ctx, "uaf-shadow-mismatch", true, `re-binding '${name}' flips droppability on the shared alloca (scope-end drop may free a non-owned value)`, span);
    }
    List_set(ctx.kinds, idx, kind);
    return List_set(ctx.states, idx, S_LIVE);
  } else {
    List_push(ctx.names, name);
    List_push(ctx.kinds, kind);
    List_push(ctx.states, S_LIVE);
    return List_push(ctx.spans, span);
  }
}

function v_block_local_init(stmts, name) {
  let found = Option_none;
  const __ring_iter_5 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
    if (__ring_next_5._tag === "none") break;
    const s = __ring_next_5._0;
    __ring_match7: {
      const __ring_m7 = s;
      if (__ring_m7._tag === "Let") {
        const n = __ring_m7.name; const init = __ring_m7.init;
        if ((n === name)) {
          found = Option_some(init);
        }
        break __ring_match7;
      }
      if (__ring_m7._tag === "Var") {
        const n = __ring_m7.name; const init = __ring_m7.init;
        if ((n === name)) {
          found = Option_some(init);
        }
        break __ring_match7;
      }
      break __ring_match7;
    }
  }
  return found;
}

function v_droppable_branch(body, externs) {
  if (perceus$expr_diverges(body)) {
    return true;
  } else {
    __ring_match8: {
      const __ring_m8 = body;
      if (__ring_m8._tag === "Block") {
        return v_droppable_init(body, externs);
        break __ring_match8;
      }
      return v_droppable_init(body, externs);
      break __ring_match8;
    }
  }
}

function v_droppable_init(init, externs) {
  const ty = hir$hexpr_type(init);
  if (hir$is_rc_excluded_type(ty, externs)) {
    return false;
  }
  if (hir$type_contains_extern_handle(ty, externs)) {
    return false;
  }
  if (perceus$is_unresolved_var_type(ty)) {
    return false;
  }
  __ring_match9: {
    const __ring_m9 = init;
    if (__ring_m9._tag === "Ident") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "FieldAccess") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "IndexExpr") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "StructLit") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "NamedVariantConstruct") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "ListLit") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "TupleLit") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "RangeExpr") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Lambda") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "StringInterp") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "IntLit") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "FloatLit") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "StrLit") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "BoolLit") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Clone") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Call") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "DictConstruct") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "BinOp") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "UnaryOp") {
      return true;
      break __ring_match9;
    }
    if (__ring_m9._tag === "IfExpr") {
      const then_branch = __ring_m9.then_branch; const else_branch = __ring_m9.else_branch;
      __ring_match10: {
        const __ring_m10 = else_branch;
        if (__ring_m10._tag === "none") {
          return false;
          break __ring_match10;
        }
        if (__ring_m10._tag === "some") {
          const eb = __ring_m10._0;
          if (v_droppable_branch(then_branch, externs)) {
            return v_droppable_branch(eb, externs);
          } else {
            return false;
          }
          break __ring_match10;
        }
        __match_fail(__ring_m10);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "MatchExpr") {
      const arms = __ring_m9.arms;
      let all = (List_len(arms) > 0);
      const __ring_iter_6 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
        if (__ring_next_6._tag === "none") break;
        const arm = __ring_next_6._0;
        if ((v_droppable_branch(arm.body, externs) === false)) {
          all = false;
        }
      }
      return all;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Block") {
      const stmts = __ring_m9.stmts; const tail = __ring_m9.tail;
      __ring_match11: {
        const __ring_m11 = tail;
        if (__ring_m11._tag === "some") {
          const t = __ring_m11._0;
          __ring_match12: {
            const __ring_m12 = t;
            if (__ring_m12._tag === "Ident") {
              const name = __ring_m12.name;
              __ring_match13: {
                const __ring_m13 = v_block_local_init(stmts, name);
                if (__ring_m13._tag === "some") {
                  const hi = __ring_m13._0;
                  return v_droppable_init(hi, externs);
                  break __ring_match13;
                }
                if (__ring_m13._tag === "none") {
                  return true;
                  break __ring_match13;
                }
                __match_fail(__ring_m13);
              }
              break __ring_match12;
            }
            return v_droppable_init(t, externs);
            break __ring_match12;
          }
          break __ring_match11;
        }
        if (__ring_m11._tag === "none") {
          return false;
          break __ring_match11;
        }
        __match_fail(__ring_m11);
      }
      break __ring_match9;
    }
    return false;
    break __ring_match9;
  }
}

function v_opaque_exempt_class(init) {
  __ring_match14: {
    const __ring_m14 = init;
    if (__ring_m14._tag === "EffectOp") {
      return "x-effect-value";
      break __ring_match14;
    }
    if (__ring_m14._tag === "TryCatch") {
      return "x-effect-value";
      break __ring_match14;
    }
    if (__ring_m14._tag === "HandleExpr") {
      return "x-effect-value";
      break __ring_match14;
    }
    if (__ring_m14._tag === "IfExpr") {
      return "x-cf-value";
      break __ring_match14;
    }
    if (__ring_m14._tag === "MatchExpr") {
      return "x-cf-value";
      break __ring_match14;
    }
    if (__ring_m14._tag === "Block") {
      return "x-cf-value";
      break __ring_match14;
    }
    if (__ring_m14._tag === "Ident") {
      return "x-cf-value";
      break __ring_match14;
    }
    return "x-cf-value";
    break __ring_match14;
  }
}

function v_snapshot(ctx) {
  return List_concat(ctx.states, []);
}

function v_states_equal(a, b, upto) {
  let i = 0;
  let eq = true;
  while ((((i < upto) ? (i < List_len(a)) : false) ? (i < List_len(b)) : false)) {
    if ((__ring_index(a, i) !== __ring_index(b, i))) {
      eq = false;
    }
    i = (i + 1);
  }
  return eq;
}

function v_restore(ctx, snap) {
  let i = 0;
  while (((i < List_len(ctx.states)) ? (i < List_len(snap)) : false)) {
    List_set(ctx.states, i, __ring_index(snap, i));
    i = (i + 1);
  }
}

function v_pop_frame(ctx) {
  const base = (function() {
  const __ring_m = List_pop(ctx.frames);
  if (__ring_m._tag === "some") { const b = __ring_m._0; return b; }
  if (__ring_m._tag === "none") { return 0; }
  __match_fail(__ring_m);
})();
  while ((List_len(ctx.names) > base)) {
    List_pop(ctx.names);
    List_pop(ctx.kinds);
    List_pop(ctx.states);
    List_pop(ctx.spans);
  }
}

function v_check_loop_exit(ctx, span, what) {
  const n = List_len(ctx.loop_bases);
  if ((n === 0)) {
    return;
  }
  const base = __ring_index(ctx.loop_bases, (n - 1));
  let i = base;
  while ((i < List_len(ctx.names))) {
    if (((__ring_index(ctx.kinds, i) === K_OWNED) ? (__ring_index(ctx.states, i) === S_LIVE) : false)) {
      v_report(ctx, "leak-loop-exit", true, `owned binding '${__ring_index(ctx.names, i)}' is live (not dropped) at this ${what}`, span);
    }
    i = (i + 1);
  }
}

function v_pattern_bindings(pat, out) {
  __ring_match15: {
    const __ring_m15 = pat;
    if (__ring_m15._tag === "Wildcard") {
      break __ring_match15;
    }
    if (__ring_m15._tag === "Binding") {
      const name = __ring_m15.name;
      return List_push(out, name);
      break __ring_match15;
    }
    if (__ring_m15._tag === "Constructor") {
      const fields = __ring_m15.fields;
      const __ring_iter_7 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
        if (__ring_next_7._tag === "none") break;
        const f = __ring_next_7._0;
        v_pattern_bindings(f, out);
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "NamedConstructor") {
      const fields = __ring_m15.fields;
      const __ring_iter_8 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
        if (__ring_next_8._tag === "none") break;
        const f = __ring_next_8._0;
        v_pattern_bindings(f.pattern, out);
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "Literal") {
      break __ring_match15;
    }
    if (__ring_m15._tag === "TuplePattern") {
      const elements = __ring_m15.elements;
      const __ring_iter_9 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
        if (__ring_next_9._tag === "none") break;
        const e = __ring_next_9._0;
        v_pattern_bindings(e, out);
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "OrPattern") {
      const patterns = __ring_m15.patterns;
      __ring_match16: {
        const __ring_m16 = List_get(patterns, 0);
        if (__ring_m16._tag === "some") {
          const p0 = __ring_m16._0;
          return v_pattern_bindings(p0, out);
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      break __ring_match15;
    }
    __match_fail(__ring_m15);
  }
}

function v_merge_two(ctx, t_div, snap_t, e_div, snap_e, snap0, span) {
  if ((t_div ? e_div : false)) {
    return v_restore(ctx, snap0);
  } else {
    if (t_div) {
      return v_restore(ctx, snap_e);
    } else {
      if (e_div) {
        return v_restore(ctx, snap_t);
      } else {
        if ((v_states_equal(snap_t, snap_e, List_len(snap0)) === false)) {
          v_report(ctx, "rc-imbalance", true, "branches leave enclosing RC binding states imbalanced (#134 class)", span);
        }
        return v_restore(ctx, snap_t);
      }
    }
  }
}

function v_drop(name, span, ctx) {
  const idx = v_lookup(ctx, name);
  if ((idx < 0)) {
    v_report(ctx, "uaf-drop-unknown", true, `Drop of '${name}' which is not in scope`, span);
    return;
  }
  if ((__ring_index(ctx.kinds, idx) === K_BORROW)) {
    v_report(ctx, "uaf-drop-borrow", true, `Drop of borrowed binding '${name}' (param/pattern/for-in projection) — frees a reference owned elsewhere`, span);
    return;
  }
  if ((__ring_index(ctx.kinds, idx) === K_NONOWNED)) {
    v_report(ctx, "uaf-drop-borrow", true, `Drop of non-droppable binding '${name}' (And-Or/effect/excluded init — possibly a borrow)`, span);
    return;
  }
  if ((__ring_index(ctx.states, idx) === S_DROPPED)) {
    v_report(ctx, "uaf-double-drop", true, `second Drop of '${name}' on the same path`, span);
    return;
  }
  if ((__ring_index(ctx.states, idx) === S_MOVED)) {
    v_report(ctx, "uaf-double-drop", true, `Drop of '${name}' after its value was moved out`, span);
    return;
  }
  return List_set(ctx.states, idx, S_DROPPED);
}

function v_frame_base(ctx) {
  const n = List_len(ctx.frames);
  if ((n === 0)) {
    return 0;
  } else {
    return __ring_index(ctx.frames, (n - 1));
  }
}

function v_check_frame_leaks(ctx) {
  const base = v_frame_base(ctx);
  let i = base;
  while ((i < List_len(ctx.names))) {
    if (((__ring_index(ctx.kinds, i) === K_OWNED) ? (__ring_index(ctx.states, i) === S_LIVE) : false)) {
      v_report(ctx, "leak-binding", true, `owned binding '${__ring_index(ctx.names, i)}' is never consumed (no drop/move) on the fall-through path`, __ring_index(ctx.spans, i));
    }
    i = (i + 1);
  }
}

function v_cf_class(ty, results, mode, ctx) {
  if (v_type_excluded(ty, ctx.externs)) {
    return CLS_EXCLUDED;
  }
  if ((mode === M_BORROWED)) {
    return CLS_OPAQUE;
  }
  let all_owned = true;
  let any = false;
  const __ring_iter_10 = __List_Iterable.iter(results);
  while (true) {
    const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
    if (__ring_next_10._tag === "none") break;
    const r = __ring_next_10._0;
    if ((r[1] === false)) {
      any = true;
      if (((r[0] !== CLS_OWNED) ? (r[0] !== CLS_EXCLUDED) : false)) {
        all_owned = false;
      }
    }
  }
  if ((any ? all_owned : false)) {
    return CLS_OWNED;
  } else {
    return CLS_OPAQUE;
  }
}

function v_handler_scope(h, ctx) {
  let hctx = v_new_ctx(ctx.boxed, ctx.externs, ctx.findings, `${ctx.fn_name}/handler ${h.effect_name}.${h.op_name}`);
  v_push_frame(hctx);
  const __ring_iter_11 = __List_Iterable.iter(h.params);
  while (true) {
    const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
    if (__ring_next_11._tag === "none") break;
    const p = __ring_next_11._0;
    v_bind(hctx, p.name, K_BORROW, synthetic_vspan());
  }
  __ring_match17: {
    const __ring_m17 = h.resume_name;
    if (__ring_m17._tag === "some") {
      const rn = __ring_m17._0;
      v_bind(hctx, rn, K_BORROW, synthetic_vspan());
      break __ring_match17;
    }
    if (__ring_m17._tag === "none") {
      break __ring_match17;
    }
    __match_fail(__ring_m17);
  }
  __ring_match18: {
    const __ring_m18 = h.body;
    if (__ring_m18._tag === "Block") {
      v_block(h.body, M_CONSUMED, hctx);
      break __ring_match18;
    }
    v_consume(h.body, hctx);
    [0, false];
    break __ring_match18;
  }
  return v_pop_frame(hctx);
}

function v_branch(body, mode, ctx) {
  __ring_match19: {
    const __ring_m19 = body;
    if (__ring_m19._tag === "Block") {
      return v_block(body, mode, ctx);
      break __ring_match19;
    }
    const cls = ((mode === M_CONSUMED) ? v_consume(body, ctx) : v_expr(body, M_BORROWED, ctx));
    return [cls, perceus$expr_diverges(body)];
    break __ring_match19;
  }
}

function v_cf_branch(body, mode, ctx) {
  const r = v_branch(body, mode, ctx);
  if ((((mode === M_BORROWED) ? (r[0] === CLS_OWNED) : false) ? (r[1] === false) : false)) {
    v_report(ctx, "x-cf-value", false, "control-flow branch yields an owned value in a non-consuming position (documented leak)", hir$hexpr_span(body));
  }
  return r;
}

function v_block_tail(t, mode, ctx) {
  const base = v_frame_base(ctx);
  __ring_match20: {
    const __ring_m20 = t;
    if (__ring_m20._tag === "Ident") {
      const name = __ring_m20.name;
      const idx = v_lookup(ctx, name);
      if (((idx >= base) ? (idx >= 0) : false)) {
        if (((__ring_index(ctx.kinds, idx) === K_OWNED) ? (__ring_index(ctx.states, idx) === S_LIVE) : false)) {
          List_set(ctx.states, idx, S_MOVED);
          return CLS_OWNED;
        } else {
          if (((__ring_index(ctx.kinds, idx) === K_NONOWNED) ? (__ring_index(ctx.states, idx) === S_LIVE) : false)) {
            List_set(ctx.states, idx, S_MOVED);
            return CLS_OPAQUE;
          } else {
            return v_expr(t, M_BORROWED, ctx);
          }
        }
      } else {
        if ((mode === M_CONSUMED)) {
          return v_consume(t, ctx);
        } else {
          return v_expr(t, M_BORROWED, ctx);
        }
      }
      break __ring_match20;
    }
    if ((mode === M_CONSUMED)) {
      return v_consume(t, ctx);
    } else {
      return v_expr(t, mode, ctx);
    }
    break __ring_match20;
  }
}

function v_cond(expr, ctx) {
  const cls = v_expr(expr, M_BORROWED, ctx);
  if ((cls === CLS_OWNED)) {
    if ((hir$is_fresh_owned_bool_value(expr) === false)) {
      return v_report(ctx, "leak-temp", true, "owned condition value not covered by the codegen post-unbox drop", hir$hexpr_span(expr));
    }
  }
}

function v_let_like(name, init, span, ctx) {
  const cls = v_consume(init, ctx);
  if (perceus$rc_name_skippable(name)) {
    if ((cls === CLS_OWNED)) {
      v_report(ctx, "x-discard", false, "`_` discards an owned value without a drop (documented leak)", span);
    }
    return;
  }
  const bind_span = ((span.file === "<perceus>") ? hir$hexpr_span(init) : span);
  if (v_droppable_init(init, ctx.externs)) {
    return v_bind(ctx, name, K_OWNED, bind_span);
  } else {
    v_bind(ctx, name, K_NONOWNED, bind_span);
    if (hir$type_contains_extern_handle(hir$hexpr_type(init), ctx.externs)) {
      return;
    }
    if ((cls === CLS_OWNED)) {
      return v_report(ctx, "x-cf-value", false, `owned value bound by a non-droppable binding '${name}' (documented leak)`, bind_span);
    } else {
      if ((cls === CLS_OPAQUE)) {
        return v_report(ctx, v_opaque_exempt_class(init), false, `possibly-owned value bound by non-droppable binding '${name}' (documented leak class)`, bind_span);
      }
    }
  }
}

function v_stmt(stmt, ctx) {
  __ring_match21: {
    const __ring_m21 = stmt;
    if (__ring_m21._tag === "Let") {
      const name = __ring_m21.name; const init = __ring_m21.init; const span = __ring_m21.span;
      v_let_like(name, init, span, ctx);
      return false;
      break __ring_match21;
    }
    if (__ring_m21._tag === "Var") {
      const name = __ring_m21.name; const init = __ring_m21.init; const span = __ring_m21.span;
      v_let_like(name, init, span, ctx);
      return false;
      break __ring_match21;
    }
    if (__ring_m21._tag === "Assign") {
      const target = __ring_m21.target; const value = __ring_m21.value; const span = __ring_m21.span;
      v_assign(target, value, span, ctx);
      return false;
      break __ring_match21;
    }
    if (__ring_m21._tag === "ExprStmt") {
      const expr = __ring_m21.expr;
      v_borrow(expr, "", ctx);
      return perceus$stmt_diverges(stmt);
      break __ring_match21;
    }
    if (__ring_m21._tag === "Return") {
      const value = __ring_m21.value; const span = __ring_m21.span;
      __ring_match22: {
        const __ring_m22 = value;
        if (__ring_m22._tag === "some") {
          const v = __ring_m22._0;
          v_consume(v, ctx);
          break __ring_match22;
        }
        if (__ring_m22._tag === "none") {
          CLS_EXCLUDED;
          break __ring_match22;
        }
        __match_fail(__ring_m22);
      }
      let i = 0;
      while ((i < List_len(ctx.names))) {
        if (((__ring_index(ctx.kinds, i) === K_OWNED) ? (__ring_index(ctx.states, i) === S_LIVE) : false)) {
          v_report(ctx, "leak-return", true, `owned binding '${__ring_index(ctx.names, i)}' is live (not dropped) at this return`, span);
        }
        i = (i + 1);
      }
      return true;
      break __ring_match21;
    }
    if (__ring_m21._tag === "While") {
      const condition = __ring_m21.condition; const body = __ring_m21.body; const span = __ring_m21.span;
      v_cond(condition, ctx);
      List_push(ctx.loop_bases, List_len(ctx.names));
      const snap0 = v_snapshot(ctx);
      v_block(body, M_BORROWED, ctx);
      const cur = v_snapshot(ctx);
      if ((v_states_equal(snap0, cur, List_len(snap0)) === false)) {
        v_report(ctx, "rc-imbalance", true, "loop body leaves enclosing RC binding states changed", span);
      }
      v_restore(ctx, snap0);
      List_pop(ctx.loop_bases);
      return false;
      break __ring_match21;
    }
    if (__ring_m21._tag === "ForIn") {
      const binding = __ring_m21.binding; const destructure = __ring_m21.destructure; const iterable = __ring_m21.iterable; const body = __ring_m21.body; const span = __ring_m21.span;
      __ring_match23: {
        const __ring_m23 = iterable;
        if (__ring_m23._tag === "RangeExpr") {
          v_expr(iterable, M_BORROWED, ctx);
          break __ring_match23;
        }
        v_borrow(iterable, "", ctx);
        break __ring_match23;
      }
      List_push(ctx.loop_bases, List_len(ctx.names));
      const snap0 = v_snapshot(ctx);
      v_push_frame(ctx);
      v_bind(ctx, binding, K_BORROW, span);
      __ring_match24: {
        const __ring_m24 = destructure;
        if (__ring_m24._tag === "some") {
          const ds = __ring_m24._0;
          const __ring_iter_12 = __List_Iterable.iter(ds);
          while (true) {
            const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
            if (__ring_next_12._tag === "none") break;
            const d = __ring_next_12._0;
            v_bind(ctx, d.name, K_BORROW, span);
          }
          break __ring_match24;
        }
        if (__ring_m24._tag === "none") {
          break __ring_match24;
        }
        __match_fail(__ring_m24);
      }
      v_block(body, M_BORROWED, ctx);
      v_pop_frame(ctx);
      const cur = v_snapshot(ctx);
      if ((v_states_equal(snap0, cur, List_len(snap0)) === false)) {
        v_report(ctx, "rc-imbalance", true, "loop body leaves enclosing RC binding states changed", span);
      }
      v_restore(ctx, snap0);
      List_pop(ctx.loop_bases);
      return false;
      break __ring_match21;
    }
    if (__ring_m21._tag === "Break") {
      const span = __ring_m21.span;
      v_check_loop_exit(ctx, span, "break");
      return true;
      break __ring_match21;
    }
    if (__ring_m21._tag === "Continue") {
      const span = __ring_m21.span;
      v_check_loop_exit(ctx, span, "continue");
      return true;
      break __ring_match21;
    }
    if (__ring_m21._tag === "LetDestructure") {
      const bindings = __ring_m21.bindings; const init = __ring_m21.init; const span = __ring_m21.span;
      v_borrow(init, "", ctx);
      const __ring_iter_13 = __List_Iterable.iter(bindings);
      while (true) {
        const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
        if (__ring_next_13._tag === "none") break;
        const b = __ring_next_13._0;
        v_bind(ctx, b.name, K_BORROW, span);
      }
      return false;
      break __ring_match21;
    }
    if (__ring_m21._tag === "IfLet") {
      const pattern = __ring_m21.pattern; const expr = __ring_m21.expr; const then_block = __ring_m21.then_block; const else_block = __ring_m21.else_block; const span = __ring_m21.span;
      v_borrow(expr, "", ctx);
      const snap0 = v_snapshot(ctx);
      v_push_frame(ctx);
      let bnames = [];
      v_pattern_bindings(pattern, bnames);
      const __ring_iter_14 = __List_Iterable.iter(bnames);
      while (true) {
        const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
        if (__ring_next_14._tag === "none") break;
        const bn = __ring_next_14._0;
        v_bind(ctx, bn, K_BORROW, span);
      }
      const rt = v_block(then_block, M_BORROWED, ctx);
      v_pop_frame(ctx);
      const snap_t = v_snapshot(ctx);
      v_restore(ctx, snap0);
      const re = (function() {
  const __ring_m = else_block;
  if (__ring_m._tag === "some") { const eb = __ring_m._0; return v_block(eb, M_BORROWED, ctx); }
  if (__ring_m._tag === "none") { return [CLS_EXCLUDED, false]; }
  __match_fail(__ring_m);
})();
      const snap_e = v_snapshot(ctx);
      v_merge_two(ctx, rt[1], snap_t, re[1], snap_e, snap0, span);
      if (rt[1]) {
        return re[1];
      } else {
        return false;
      }
      break __ring_match21;
    }
    if (__ring_m21._tag === "Drop") {
      const name = __ring_m21.name; const span = __ring_m21.span;
      v_drop(name, span, ctx);
      return false;
      break __ring_match21;
    }
    if (__ring_m21._tag === "Dup") {
      const name = __ring_m21.name; const span = __ring_m21.span;
      const idx = v_lookup(ctx, name);
      if ((idx >= 0)) {
        if (((__ring_index(ctx.kinds, idx) === K_OWNED) ? (__ring_index(ctx.states, idx) !== S_LIVE) : false)) {
          v_report(ctx, "uaf-use-after-drop", true, `Dup of '${name}' after drop/move`, span);
        }
      }
      return false;
      break __ring_match21;
    }
    __match_fail(__ring_m21);
  }
}

function v_block(block, mode, ctx) {
  __ring_match25: {
    const __ring_m25 = block;
    if (__ring_m25._tag === "Block") {
      const stmts = __ring_m25.stmts; const tail = __ring_m25.tail;
      v_push_frame(ctx);
      let diverged = false;
      const __ring_iter_15 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
        if (__ring_next_15._tag === "none") break;
        const s = __ring_next_15._0;
        if ((diverged === false)) {
          if (v_stmt(s, ctx)) {
            diverged = true;
          }
        }
      }
      let cls = CLS_EXCLUDED;
      if ((diverged === false)) {
        __ring_match26: {
          const __ring_m26 = tail;
          if (__ring_m26._tag === "some") {
            const t = __ring_m26._0;
            cls = v_block_tail(t, mode, ctx);
            if (perceus$expr_diverges(t)) {
              diverged = true;
            }
            break __ring_match26;
          }
          if (__ring_m26._tag === "none") {
            break __ring_match26;
          }
          __match_fail(__ring_m26);
        }
      }
      if ((diverged === false)) {
        v_check_frame_leaks(ctx);
      }
      v_pop_frame(ctx);
      return [cls, diverged];
      break __ring_match25;
    }
    const cls = ((mode === M_CONSUMED) ? v_consume(block, ctx) : v_expr(block, M_BORROWED, ctx));
    return [cls, perceus$expr_diverges(block)];
    break __ring_match25;
  }
}

function v_fn_scope(params, body, label, boxed, externs, findings) {
  let ctx = v_new_ctx(boxed, externs, findings, label);
  v_push_frame(ctx);
  const __ring_iter_16 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
    if (__ring_next_16._tag === "none") break;
    const p = __ring_next_16._0;
    v_bind(ctx, p.name, K_BORROW, synthetic_vspan());
  }
  __ring_match27: {
    const __ring_m27 = body;
    if (__ring_m27._tag === "Block") {
      v_block(body, M_CONSUMED, ctx);
      break __ring_match27;
    }
    v_consume(body, ctx);
    [0, false];
    break __ring_match27;
  }
  return v_pop_frame(ctx);
}

function v_borrow(expr, exempt, ctx) {
  const cls = v_expr(expr, M_BORROWED, ctx);
  if ((cls === CLS_OWNED)) {
    if ((exempt === "")) {
      v_report(ctx, "leak-temp", true, "owned temporary is never consumed (no binding, no drop) in a read position", hir$hexpr_span(expr));
    } else {
      v_report(ctx, exempt, false, "owned value in a non-consuming position (documented leak class)", hir$hexpr_span(expr));
    }
  }
  return cls;
}

function v_expr(expr, mode, ctx) {
  __ring_match28: {
    const __ring_m28 = expr;
    if (__ring_m28._tag === "IntLit") {
      const ty = __ring_m28.ty;
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "FloatLit") {
      const ty = __ring_m28.ty;
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "StrLit") {
      const ty = __ring_m28.ty;
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "BoolLit") {
      const ty = __ring_m28.ty;
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "Ident") {
      const name = __ring_m28.name; const ty = __ring_m28.ty; const span = __ring_m28.span;
      return v_ident(name, ty, span, mode, ctx);
      break __ring_match28;
    }
    if (__ring_m28._tag === "BinOp") {
      const left = __ring_m28.left; const right = __ring_m28.right; const ty = __ring_m28.ty;
      v_borrow(left, "", ctx);
      v_borrow(right, "", ctx);
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "UnaryOp") {
      const operand = __ring_m28.operand; const ty = __ring_m28.ty;
      v_borrow(operand, "", ctx);
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "Call") {
      const callee = __ring_m28.callee; const args = __ring_m28.args; const ty = __ring_m28.ty;
      __ring_match29: {
        const __ring_m29 = callee;
        if (__ring_m29._tag === "Call") {
          v_borrow(callee, "x-callee-call", ctx);
          break __ring_match29;
        }
        v_borrow(callee, "", ctx);
        break __ring_match29;
      }
      const ctor = perceus$is_variant_constructor_call(callee, ty);
      const sinks = perceus$sink_arg_indices(callee, List_len(args));
      let i = 0;
      const __ring_iter_17 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
        if (__ring_next_17._tag === "none") break;
        const a = __ring_next_17._0;
        if ((ctor ? true : v_list_has_int(sinks, i))) {
          v_consume(a, ctx);
        } else {
          v_borrow(a, "", ctx);
        }
        i = (i + 1);
      }
      if (hir$is_borrow_returning_call(callee)) {
        return CLS_BORROW;
      } else {
        return v_cls_of_fresh(ty, ctx.externs);
      }
      break __ring_match28;
    }
    if (__ring_m28._tag === "FieldAccess") {
      const receiver = __ring_m28.receiver; const ty = __ring_m28.ty;
      v_borrow(receiver, "", ctx);
      if (v_type_excluded(ty, ctx.externs)) {
        return CLS_EXCLUDED;
      } else {
        return CLS_BORROW;
      }
      break __ring_match28;
    }
    if (__ring_m28._tag === "DictConstruct") {
      const ty = __ring_m28.ty;
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "IndexExpr") {
      const receiver = __ring_m28.receiver; const index = __ring_m28.index; const ty = __ring_m28.ty;
      v_borrow(receiver, "", ctx);
      v_borrow(index, "", ctx);
      if (v_type_excluded(ty, ctx.externs)) {
        return CLS_EXCLUDED;
      } else {
        if (perceus$is_str_index(receiver)) {
          return v_cls_of_fresh(ty, ctx.externs);
        } else {
          return CLS_BORROW;
        }
      }
      break __ring_match28;
    }
    if (__ring_m28._tag === "StructLit") {
      const fields = __ring_m28.fields; const spread = __ring_m28.spread; const ty = __ring_m28.ty;
      const __ring_iter_18 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
        if (__ring_next_18._tag === "none") break;
        const f = __ring_next_18._0;
        v_consume(f.value, ctx);
      }
      __ring_match30: {
        const __ring_m30 = spread;
        if (__ring_m30._tag === "some") {
          const s = __ring_m30._0;
          v_borrow(s, "x-spread", ctx);
          break __ring_match30;
        }
        if (__ring_m30._tag === "none") {
          CLS_EXCLUDED;
          break __ring_match30;
        }
        __match_fail(__ring_m30);
      }
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "NamedVariantConstruct") {
      const fields = __ring_m28.fields; const spread = __ring_m28.spread; const ty = __ring_m28.ty;
      const __ring_iter_19 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
        if (__ring_next_19._tag === "none") break;
        const f = __ring_next_19._0;
        v_consume(f.value, ctx);
      }
      __ring_match31: {
        const __ring_m31 = spread;
        if (__ring_m31._tag === "some") {
          const s = __ring_m31._0;
          v_borrow(s, "x-spread", ctx);
          break __ring_match31;
        }
        if (__ring_m31._tag === "none") {
          CLS_EXCLUDED;
          break __ring_match31;
        }
        __match_fail(__ring_m31);
      }
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "ListLit") {
      const elements = __ring_m28.elements; const ty = __ring_m28.ty;
      const __ring_iter_20 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
        if (__ring_next_20._tag === "none") break;
        const e = __ring_next_20._0;
        v_consume(e, ctx);
      }
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "TupleLit") {
      const elements = __ring_m28.elements; const ty = __ring_m28.ty;
      const __ring_iter_21 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
        if (__ring_next_21._tag === "none") break;
        const e = __ring_next_21._0;
        v_consume(e, ctx);
      }
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "RangeExpr") {
      const start = __ring_m28.start; const end = __ring_m28.end; const ty = __ring_m28.ty;
      v_consume(start, ctx);
      v_consume(end, ctx);
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "StringInterp") {
      const parts = __ring_m28.parts; const ty = __ring_m28.ty;
      const __ring_iter_22 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
        if (__ring_next_22._tag === "none") break;
        const p = __ring_next_22._0;
        __ring_match32: {
          const __ring_m32 = p;
          if (__ring_m32._tag === "Expression") {
            const e = __ring_m32._0;
            v_borrow(e, "", ctx);
            break __ring_match32;
          }
          if (__ring_m32._tag === "Literal") {
            const s = __ring_m32._0;
            0;
            break __ring_match32;
          }
          __match_fail(__ring_m32);
        }
      }
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "Lambda") {
      const params = __ring_m28.params; const body = __ring_m28.body; const ty = __ring_m28.ty;
      v_fn_scope(params, body, `${ctx.fn_name}/<lambda>`, ctx.boxed, ctx.externs, ctx.findings);
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "Clone") {
      const inner = __ring_m28.inner; const ty = __ring_m28.ty;
      v_expr(inner, M_BORROWED, ctx);
      return v_cls_of_fresh(ty, ctx.externs);
      break __ring_match28;
    }
    if (__ring_m28._tag === "Block") {
      const r = v_block(expr, mode, ctx);
      return r[0];
      break __ring_match28;
    }
    if (__ring_m28._tag === "IfExpr") {
      const condition = __ring_m28.condition; const then_branch = __ring_m28.then_branch; const else_branch = __ring_m28.else_branch; const ty = __ring_m28.ty; const span = __ring_m28.span;
      v_borrow(condition, "", ctx);
      const snap0 = v_snapshot(ctx);
      const rt = v_cf_branch(then_branch, mode, ctx);
      const snap_t = v_snapshot(ctx);
      v_restore(ctx, snap0);
      const re = (function() {
  const __ring_m = else_branch;
  if (__ring_m._tag === "some") { const eb = __ring_m._0; return v_cf_branch(eb, mode, ctx); }
  if (__ring_m._tag === "none") { return [CLS_EXCLUDED, false]; }
  __match_fail(__ring_m);
})();
      const snap_e = v_snapshot(ctx);
      v_merge_two(ctx, rt[1], snap_t, re[1], snap_e, snap0, span);
      return v_cf_class(ty, [rt, re], mode, ctx);
      break __ring_match28;
    }
    if (__ring_m28._tag === "MatchExpr") {
      const scrutinee = __ring_m28.scrutinee; const arms = __ring_m28.arms; const ty = __ring_m28.ty; const span = __ring_m28.span;
      v_borrow(scrutinee, "", ctx);
      const snap0 = v_snapshot(ctx);
      let results = [];
      let ref_snap = [];
      let have_ref = false;
      const __ring_iter_23 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
        if (__ring_next_23._tag === "none") break;
        const arm = __ring_next_23._0;
        v_restore(ctx, snap0);
        v_push_frame(ctx);
        let bnames = [];
        v_pattern_bindings(arm.pattern, bnames);
        const __ring_iter_24 = __List_Iterable.iter(bnames);
        while (true) {
          const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
          if (__ring_next_24._tag === "none") break;
          const bn = __ring_next_24._0;
          v_bind(ctx, bn, K_BORROW, arm.span);
        }
        __ring_match33: {
          const __ring_m33 = arm.guard;
          if (__ring_m33._tag === "some") {
            const g = __ring_m33._0;
            v_cond(g, ctx);
            break __ring_match33;
          }
          if (__ring_m33._tag === "none") {
            break __ring_match33;
          }
          __match_fail(__ring_m33);
        }
        const r = v_cf_branch(arm.body, mode, ctx);
        v_pop_frame(ctx);
        List_push(results, r);
        if ((r[1] === false)) {
          if (have_ref) {
            const cur = v_snapshot(ctx);
            if ((v_states_equal(ref_snap, cur, List_len(snap0)) === false)) {
              v_report(ctx, "rc-imbalance", true, "match arms leave enclosing RC binding states imbalanced (#134 class)", span);
            }
          } else {
            ref_snap = v_snapshot(ctx);
            have_ref = true;
          }
        }
      }
      if (have_ref) {
        v_restore(ctx, ref_snap);
      } else {
        v_restore(ctx, snap0);
      }
      return v_cf_class(ty, results, mode, ctx);
      break __ring_match28;
    }
    if (__ring_m28._tag === "TryCatch") {
      const body = __ring_m28.body; const arms = __ring_m28.arms; const ty = __ring_m28.ty;
      const snap0 = v_snapshot(ctx);
      v_cf_branch(body, mode, ctx);
      const snap_body = v_snapshot(ctx);
      const __ring_iter_25 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
        if (__ring_next_25._tag === "none") break;
        const arm = __ring_next_25._0;
        v_restore(ctx, snap0);
        v_push_frame(ctx);
        let bnames = [];
        v_pattern_bindings(arm.pattern, bnames);
        const __ring_iter_26 = __List_Iterable.iter(bnames);
        while (true) {
          const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
          if (__ring_next_26._tag === "none") break;
          const bn = __ring_next_26._0;
          v_bind(ctx, bn, K_BORROW, arm.span);
        }
        v_cf_branch(arm.body, mode, ctx);
        v_pop_frame(ctx);
      }
      v_restore(ctx, snap_body);
      if (v_type_excluded(ty, ctx.externs)) {
        return CLS_EXCLUDED;
      } else {
        return CLS_OPAQUE;
      }
      break __ring_match28;
    }
    if (__ring_m28._tag === "HandleExpr") {
      const body = __ring_m28.body; const handlers = __ring_m28.handlers; const ty = __ring_m28.ty;
      const snap0 = v_snapshot(ctx);
      v_cf_branch(body, mode, ctx);
      const snap_body = v_snapshot(ctx);
      const __ring_iter_27 = __List_Iterable.iter(handlers);
      while (true) {
        const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
        if (__ring_next_27._tag === "none") break;
        const h = __ring_next_27._0;
        v_restore(ctx, snap0);
        v_handler_scope(h, ctx);
      }
      v_restore(ctx, snap_body);
      if (v_type_excluded(ty, ctx.externs)) {
        return CLS_EXCLUDED;
      } else {
        return CLS_OPAQUE;
      }
      break __ring_match28;
    }
    if (__ring_m28._tag === "EffectOp") {
      const args = __ring_m28.args; const ty = __ring_m28.ty;
      const __ring_iter_28 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
        if (__ring_next_28._tag === "none") break;
        const a = __ring_next_28._0;
        v_borrow(a, "", ctx);
      }
      if (v_type_excluded(ty, ctx.externs)) {
        return CLS_EXCLUDED;
      } else {
        return CLS_OPAQUE;
      }
      break __ring_match28;
    }
    if (__ring_m28._tag === "ReturnExpr") {
      const value = __ring_m28.value;
      __ring_match34: {
        const __ring_m34 = value;
        if (__ring_m34._tag === "some") {
          const v = __ring_m34._0;
          const _ = v_consume(v, ctx);
          break __ring_match34;
        }
        if (__ring_m34._tag === "none") {
          break __ring_match34;
        }
        __match_fail(__ring_m34);
      }
      return CLS_EXCLUDED;
      break __ring_match28;
    }
    __match_fail(__ring_m28);
  }
}

function v_consume(expr, ctx) {
  const cls = v_expr(expr, M_CONSUMED, ctx);
  if ((cls === CLS_BORROW)) {
    v_report(ctx, "uaf-escaped-borrow", true, "a borrowed value escapes into an owning position without a Clone", hir$hexpr_span(expr));
  }
  return cls;
}

function v_assign(target, value, span, ctx) {
  __ring_match35: {
    const __ring_m35 = target;
    if (__ring_m35._tag === "Ident") {
      const name = __ring_m35.name; const def_id = __ring_m35.def_id; const ty = __ring_m35.ty;
      v_consume(value, ctx);
      const idx = v_lookup(ctx, name);
      if ((idx < 0)) {
        return;
      }
      if ((__ring_index(ctx.kinds, idx) === K_BORROW)) {
        v_report(ctx, "x-overwrite-param", false, `assignment to borrowed binding '${name}' overwrites a value owned elsewhere (documented)`, span);
        return;
      }
      if (((__ring_index(ctx.states, idx) === S_LIVE) ? (__ring_index(ctx.kinds, idx) === K_OWNED) : false)) {
        const boxed_var = (function() {
  const __ring_m = def_id;
  if (__ring_m._tag === "some") { const d = __ring_m._0; return _Set_contains(ctx.boxed, d, __Int_Eq); }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
        if ((v_type_excluded(ty, ctx.externs) ? true : hir$type_contains_extern_handle(ty, ctx.externs))) {
        } else {
          if (boxed_var) {
            v_report(ctx, "x-overwrite-boxed", false, `write to auto-boxed mut cell '${name}' leaks the old cell value (B-091, documented)`, span);
          } else {
            if (perceus$is_scalar_type(ty)) {
              v_report(ctx, "leak-scalar-reassign", true, `scalar mut-var '${name}' reassigned without the W4 old-value drop`, span);
            } else {
              v_report(ctx, "x-overwrite-var", false, `non-scalar mut-var '${name}' reassignment leaks the old value (W4 scalar-only, documented)`, span);
            }
          }
        }
      }
      return List_set(ctx.states, idx, S_LIVE);
      break __ring_match35;
    }
    if (__ring_m35._tag === "FieldAccess") {
      const receiver = __ring_m35.receiver; const field = __ring_m35.field; const ty = __ring_m35.ty;
      v_borrow(receiver, "", ctx);
      v_consume(value, ctx);
      if (((v_type_excluded(ty, ctx.externs) === false) ? (hir$type_contains_extern_handle(ty, ctx.externs) === false) : false)) {
        return v_report(ctx, "x-overwrite-field", false, `field '${field}' overwrite does not drop the old value (codegen field-store convention; B-109 ① class)`, span);
      }
      break __ring_match35;
    }
    if (__ring_m35._tag === "IndexExpr") {
      const receiver = __ring_m35.receiver; const index = __ring_m35.index;
      v_borrow(receiver, "", ctx);
      v_borrow(index, "", ctx);
      const _ = v_consume(value, ctx);
      break __ring_match35;
    }
    const _ = v_consume(value, ctx);
    break __ring_match35;
  }
}

function verify_decls(decls, boxed, externs, findings) {
  const __ring_iter_29 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
    if (__ring_next_29._tag === "none") break;
    const d = __ring_next_29._0;
    __ring_match36: {
      const __ring_m36 = d;
      if (__ring_m36._tag === "Fn") {
        const name = __ring_m36.name; const params = __ring_m36.params; const body = __ring_m36.body;
        v_fn_scope(params, body, name, boxed, externs, findings);
        break __ring_match36;
      }
      if (__ring_m36._tag === "Impl") {
        const methods = __ring_m36.methods;
        verify_decls(methods, boxed, externs, findings);
        break __ring_match36;
      }
      if (__ring_m36._tag === "Test") {
        const description = __ring_m36.description; const body = __ring_m36.body;
        const no_params = [];
        v_fn_scope(no_params, body, `test ${description}`, boxed, externs, findings);
        break __ring_match36;
      }
      if (__ring_m36._tag === "Const") {
        const name = __ring_m36.name; const init = __ring_m36.init;
        let ctx = v_new_ctx(boxed, externs, findings, `const ${name}`);
        const _ = v_consume(init, ctx);
        break __ring_match36;
      }
      if (__ring_m36._tag === "ModBlock") {
        const mod_decls = __ring_m36.decls;
        verify_decls(mod_decls, boxed, externs, findings);
        break __ring_match36;
      }
      if (__ring_m36._tag === "Struct") {
        break __ring_match36;
      }
      if (__ring_m36._tag === "Enum") {
        break __ring_match36;
      }
      if (__ring_m36._tag === "Effect") {
        break __ring_match36;
      }
      if (__ring_m36._tag === "Trait") {
        break __ring_match36;
      }
      if (__ring_m36._tag === "ExternFn") {
        break __ring_match36;
      }
      if (__ring_m36._tag === "ExternType") {
        break __ring_match36;
      }
      if (__ring_m36._tag === "TypeAlias") {
        break __ring_match36;
      }
      if (__ring_m36._tag === "Sig") {
        break __ring_match36;
      }
      __match_fail(__ring_m36);
    }
  }
}

function verify_rc_program(program) {
  const externs = hir$collect_extern_type_names(program.decls);
  let findings = [];
  verify_decls(program.decls, program.boxed_vars, externs, findings);
  return findings;
}

function __RcFinding_Eq_eq(self, other) {
  return (self._class === other._class) && (self.fatal === other.fatal) && (self.message === other.message) && (self.fn_name === other.fn_name) && __Span_Eq.eq(self.span, other.span);
}
const __RcFinding_Eq = { eq: __RcFinding_Eq_eq, ne: function(self, other) { return !__RcFinding_Eq_eq(self, other); } };

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

function __RcFinding_Clone_clone(self) {
  return new RcFinding(self._class, self.fatal, self.message, self.fn_name, __Span_Clone.clone(self.span));
}
const __RcFinding_Clone = { clone: __RcFinding_Clone_clone };

function __SetIterator_Clone_clone(self, __ring_T_Clone) {
  return new SetIterator(__List_Clone.clone(self.items, __ring_T_Clone), self.index);
}
const __SetIterator_Clone = { clone: __SetIterator_Clone_clone };

function __VCtx_Clone_clone(self) {
  return new VCtx(__List_Clone.clone(self.names, __Str_Clone), __List_Clone.clone(self.kinds, __Int_Clone), __List_Clone.clone(self.states, __Int_Clone), __List_Clone.clone(self.spans, __Span_Clone), __List_Clone.clone(self.frames, __Int_Clone), __List_Clone.clone(self.loop_bases, __Int_Clone), __Set_Clone.clone(self.boxed, __Int_Clone), __Set_Clone.clone(self.externs, __Str_Clone), __List_Clone.clone(self.findings, __RcFinding_Clone), self.fn_name);
}
const __VCtx_Clone = { clone: __VCtx_Clone_clone };

function __Result_Clone_clone(self, __ring_T_Clone, __ring_E_Clone) {
  switch (self._tag) {
    case "Ok": return Result_Ok(__ring_T_Clone.clone(self._0));
    case "Err": return Result_Err(__ring_E_Clone.clone(self._0));
    default: return self;
  }
}
const __Result_Clone = { clone: __Result_Clone_clone };

function __RcFinding_Ord_cmp(self, other) {
  var c;
  c = (self._class < other._class ? -1 : self._class > other._class ? 1 : 0);
  if (c !== 0) return c;
  c = (self.fatal < other.fatal ? -1 : self.fatal > other.fatal ? 1 : 0);
  if (c !== 0) return c;
  c = (self.message < other.message ? -1 : self.message > other.message ? 1 : 0);
  if (c !== 0) return c;
  c = (self.fn_name < other.fn_name ? -1 : self.fn_name > other.fn_name ? 1 : 0);
  if (c !== 0) return c;
  return __Span_Ord.cmp(self.span, other.span);
}
const __RcFinding_Ord = { cmp: __RcFinding_Ord_cmp };

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

function __RcFinding_Debug_debug(self) {
  return "RcFinding { " + "class: " + String(self._class) + ", " + "fatal: " + String(self.fatal) + ", " + "message: " + String(self.message) + ", " + "fn_name: " + String(self.fn_name) + ", " + "span: " + __Span_Debug.debug(self.span) + " }";
}
const __RcFinding_Debug = { debug: __RcFinding_Debug_debug };

function __SetIterator_Debug_debug(self, __ring_T_Debug) {
  return "SetIterator { " + "items: " + __List_Debug.debug(self.items, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __SetIterator_Debug = { debug: __SetIterator_Debug_debug };

function __VCtx_Debug_debug(self) {
  return "VCtx { " + "names: " + __List_Debug.debug(self.names, __Str_Debug) + ", " + "kinds: " + __List_Debug.debug(self.kinds, __Int_Debug) + ", " + "states: " + __List_Debug.debug(self.states, __Int_Debug) + ", " + "spans: " + __List_Debug.debug(self.spans, __Span_Debug) + ", " + "frames: " + __List_Debug.debug(self.frames, __Int_Debug) + ", " + "loop_bases: " + __List_Debug.debug(self.loop_bases, __Int_Debug) + ", " + "boxed: " + __Set_Debug.debug(self.boxed, __Int_Debug) + ", " + "externs: " + __Set_Debug.debug(self.externs, __Str_Debug) + ", " + "findings: " + __List_Debug.debug(self.findings, __RcFinding_Debug) + ", " + "fn_name: " + String(self.fn_name) + " }";
}
const __VCtx_Debug = { debug: __VCtx_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { RcFinding, verify_rc_program, rc_fatal_count, rc_verify_boundary_note, format_rc_findings, __RcFinding_Eq, __RcFinding_Clone, __RcFinding_Ord, __RcFinding_Debug };