import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, effect_op_slot as hir$effect_op_slot, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, collect_extern_type_names as hir$collect_extern_type_names, is_extern_handle_type as hir$is_extern_handle_type, is_rc_excluded_type as hir$is_rc_excluded_type, type_contains_extern_handle as hir$type_contains_extern_handle, is_borrow_returning_call as hir$is_borrow_returning_call, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_Clone as hir$HExpr_Clone, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { safe_ident as codegen_ctx$safe_ident, new_codegen_ctx as codegen_ctx$new_codegen_ctx, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, push_indent as codegen_ctx$push_indent, pop_indent as codegen_ctx$pop_indent, is_imported_name as codegen_ctx$is_imported_name, qualify as codegen_ctx$qualify, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";
import { gen_expr as codegen_expr$gen_expr } from "./codegen_expr.js";



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


function resolve_struct_name(ctx, raw_name) {
  const safe = codegen_ctx$safe_ident(raw_name);
  const qualified = codegen_ctx$qualify(ctx, safe);
  if (_Map_contains_key(ctx.struct_field_order, qualified)) {
    return Option_some(qualified);
  }
  const suffix = `$${safe}`;
  const __ring_iter_2 = __List_Iterable.iter(_Map_entries(ctx.struct_field_order));
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const entry = __ring_next_2._0;
    const __ring_dt0 = entry;
    const k = __ring_dt0[0];
    const _v = __ring_dt0[1];
    if (Str_ends_with(k, suffix)) {
      return Option_some(k);
    }
  }
  return Option_none;
}

function emit_in_stmt_context(ctx, expr, mode) {
  __ring_match6: {
    const __ring_m6 = expr;
    if (__ring_m6._tag === "IfExpr") {
      const condition = __ring_m6.condition; const then_branch = __ring_m6.then_branch; const else_branch = __ring_m6.else_branch;
      return emit_if_stmt(ctx, condition, then_branch, else_branch, mode);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Block") {
      const stmts = __ring_m6.stmts; const tail = __ring_m6.tail;
      return emit_block_in_stmt_context_inner(ctx, stmts, tail, mode);
      break __ring_match6;
    }
    if (__ring_m6._tag === "MatchExpr") {
      const scrutinee = __ring_m6.scrutinee; const arms = __ring_m6.arms;
      return emit_match_stmt(ctx, scrutinee, arms, mode);
      break __ring_match6;
    }
    const e = codegen_expr$gen_expr(ctx, expr);
    if ((mode === "return")) {
      return codegen_ctx$emit(ctx, `return ${e};`);
    } else {
      return codegen_ctx$emit(ctx, `${e};`);
    }
    break __ring_match6;
  }
}

function emit_if_stmt(ctx, condition, then_branch, else_branch, mode) {
  const cond = codegen_expr$gen_expr(ctx, condition);
  codegen_ctx$emit(ctx, `if (${cond}) {`);
  codegen_ctx$push_indent(ctx);
  emit_block_in_stmt_context(ctx, then_branch, mode);
  codegen_ctx$pop_indent(ctx);
  __ring_match7: {
    const __ring_m7 = else_branch;
    if (__ring_m7._tag === "none") {
      return codegen_ctx$emit(ctx, "}");
      break __ring_match7;
    }
    if (__ring_m7._tag === "some") {
      const eb = __ring_m7._0;
      __ring_match8: {
        const __ring_m8 = eb;
        if (__ring_m8._tag === "IfExpr") {
          const ec = __ring_m8.condition; const et = __ring_m8.then_branch; const ee = __ring_m8.else_branch;
          return emit_else_if(ctx, ec, et, ee, mode);
          break __ring_match8;
        }
        codegen_ctx$emit(ctx, "} else {");
        codegen_ctx$push_indent(ctx);
        emit_block_in_stmt_context(ctx, eb, mode);
        codegen_ctx$pop_indent(ctx);
        return codegen_ctx$emit(ctx, "}");
        break __ring_match8;
      }
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
}

function emit_else_if(ctx, condition, then_branch, else_branch, mode) {
  const cond = codegen_expr$gen_expr(ctx, condition);
  codegen_ctx$emit(ctx, `} else if (${cond}) {`);
  codegen_ctx$push_indent(ctx);
  emit_block_in_stmt_context(ctx, then_branch, mode);
  codegen_ctx$pop_indent(ctx);
  __ring_match9: {
    const __ring_m9 = else_branch;
    if (__ring_m9._tag === "none") {
      return codegen_ctx$emit(ctx, "}");
      break __ring_match9;
    }
    if (__ring_m9._tag === "some") {
      const eb = __ring_m9._0;
      __ring_match10: {
        const __ring_m10 = eb;
        if (__ring_m10._tag === "IfExpr") {
          const ec = __ring_m10.condition; const et = __ring_m10.then_branch; const ee = __ring_m10.else_branch;
          return emit_else_if(ctx, ec, et, ee, mode);
          break __ring_match10;
        }
        codegen_ctx$emit(ctx, "} else {");
        codegen_ctx$push_indent(ctx);
        emit_block_in_stmt_context(ctx, eb, mode);
        codegen_ctx$pop_indent(ctx);
        return codegen_ctx$emit(ctx, "}");
        break __ring_match10;
      }
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
}

function emit_block_in_stmt_context(ctx, block, mode) {
  __ring_match11: {
    const __ring_m11 = block;
    if (__ring_m11._tag === "Block") {
      const stmts = __ring_m11.stmts; const tail = __ring_m11.tail;
      return emit_block_in_stmt_context_inner(ctx, stmts, tail, mode);
      break __ring_match11;
    }
    return emit_in_stmt_context(ctx, block, mode);
    break __ring_match11;
  }
}

function emit_block_in_stmt_context_inner(ctx, stmts, tail, mode) {
  const __ring_iter_3 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
    if (__ring_next_3._tag === "none") break;
    const stmt = __ring_next_3._0;
    emit_stmt(ctx, stmt);
  }
  __ring_match12: {
    const __ring_m12 = tail;
    if (__ring_m12._tag === "some") {
      const t = __ring_m12._0;
      return emit_in_stmt_context(ctx, t, mode);
      break __ring_match12;
    }
    if (__ring_m12._tag === "none") {
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
}

function emit_block_body(ctx, block) {
  __ring_match13: {
    const __ring_m13 = block;
    if (__ring_m13._tag === "Block") {
      const stmts = __ring_m13.stmts; const tail = __ring_m13.tail;
      const __ring_iter_4 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
        if (__ring_next_4._tag === "none") break;
        const stmt = __ring_next_4._0;
        emit_stmt(ctx, stmt);
      }
      __ring_match14: {
        const __ring_m14 = tail;
        if (__ring_m14._tag === "some") {
          const t = __ring_m14._0;
          return emit_in_stmt_context(ctx, t, "return");
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      break __ring_match13;
    }
    return emit_in_stmt_context(ctx, block, "return");
    break __ring_match13;
  }
}

function emit_iterator_for_in(ctx, binding, destructure, iterable, body, iterable_type_name, iter_type_name) {
  const counter = ctx.loop_counter;
  ctx.loop_counter = (ctx.loop_counter + 1);
  const it_expr = codegen_expr$gen_expr(ctx, iterable);
  __ring_match15: {
    const __ring_m15 = [iterable_type_name, iter_type_name];
    if (Array.isArray(__ring_m15) && __ring_m15.length === 2 && __ring_m15[0]._tag === "some" && __ring_m15[1]._tag === "some") {
      const itn = __ring_m15[0]._0; const iter_tn = __ring_m15[1]._0;
      const iter_dict = hir$trait_dict_name(codegen_ctx$qualify(ctx, itn), "Iterable");
      const next_dict = hir$trait_dict_name(codegen_ctx$qualify(ctx, iter_tn), "Iterator");
      const iter_var = `__ring_iter_${counter}`;
      const next_var = `__ring_next_${counter}`;
      codegen_ctx$emit(ctx, `const ${iter_var} = ${iter_dict}.iter(${it_expr});`);
      codegen_ctx$emit(ctx, "while (true) {");
      codegen_ctx$push_indent(ctx);
      codegen_ctx$emit(ctx, `const ${next_var} = ${next_dict}.next(${iter_var});`);
      codegen_ctx$emit(ctx, `if (${next_var}._tag === "none") break;`);
      __ring_match16: {
        const __ring_m16 = destructure;
        if (__ring_m16._tag === "some") {
          const ds = __ring_m16._0;
          if ((List_len(ds) > 0)) {
            let names = [];
            const __ring_iter_5 = __List_Iterable.iter(ds);
            while (true) {
              const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
              if (__ring_next_5._tag === "none") break;
              const d = __ring_next_5._0;
              List_push(names, codegen_ctx$safe_ident(d.name));
            }
            const joined = List_join(names, ", ");
            codegen_ctx$emit(ctx, `const [${joined}] = ${next_var}._0;`);
          } else {
            const b = codegen_ctx$safe_ident(binding);
            codegen_ctx$emit(ctx, `const ${b} = ${next_var}._0;`);
          }
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          const b = codegen_ctx$safe_ident(binding);
          codegen_ctx$emit(ctx, `const ${b} = ${next_var}._0;`);
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      emit_block_in_stmt_context(ctx, body, "discard");
      codegen_ctx$pop_indent(ctx);
      return codegen_ctx$emit(ctx, "}");
      break __ring_match15;
    }
    const b = codegen_ctx$safe_ident(binding);
    codegen_ctx$emit(ctx, `for (const ${b} of ${it_expr}) {`);
    codegen_ctx$push_indent(ctx);
    emit_block_in_stmt_context(ctx, body, "discard");
    codegen_ctx$pop_indent(ctx);
    return codegen_ctx$emit(ctx, "}");
    break __ring_match15;
  }
}

function emit_match_stmt(ctx, scrutinee, arms, mode) {
  const label = `__ring_match${ctx.match_counter}`;
  ctx.match_counter = (ctx.match_counter + 1);
  const scrut_js = codegen_expr$gen_expr(ctx, scrutinee);
  codegen_ctx$emit(ctx, `${label}: {`);
  codegen_ctx$push_indent(ctx);
  const scrut_var = `__ring_m${(ctx.match_counter - 1)}`;
  codegen_ctx$emit(ctx, `const ${scrut_var} = ${scrut_js};`);
  const __ring_iter_6 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
    if (__ring_next_6._tag === "none") break;
    const arm = __ring_next_6._0;
    const cond = gen_pattern_condition(ctx, scrut_var, arm.pattern);
    const bindings_str = gen_pattern_bindings(ctx, scrut_var, arm.pattern);
    __ring_match17: {
      const __ring_m17 = arm.guard;
      if (__ring_m17._tag === "none") {
        if ((cond === "true")) {
          if ((Str_len(bindings_str) > 0)) {
            codegen_ctx$emit(ctx, Str_trim(bindings_str));
          }
          emit_in_stmt_context(ctx, arm.body, mode);
          codegen_ctx$emit(ctx, `break ${label};`);
        } else {
          codegen_ctx$emit(ctx, `if (${cond}) {`);
          codegen_ctx$push_indent(ctx);
          if ((Str_len(bindings_str) > 0)) {
            codegen_ctx$emit(ctx, Str_trim(bindings_str));
          }
          emit_in_stmt_context(ctx, arm.body, mode);
          codegen_ctx$emit(ctx, `break ${label};`);
          codegen_ctx$pop_indent(ctx);
          codegen_ctx$emit(ctx, "}");
        }
        break __ring_match17;
      }
      if (__ring_m17._tag === "some") {
        const guard = __ring_m17._0;
        codegen_ctx$emit(ctx, `if (${cond}) {`);
        codegen_ctx$push_indent(ctx);
        if ((Str_len(bindings_str) > 0)) {
          codegen_ctx$emit(ctx, Str_trim(bindings_str));
        }
        const guard_js = codegen_expr$gen_expr(ctx, guard);
        codegen_ctx$emit(ctx, `if (${guard_js}) {`);
        codegen_ctx$push_indent(ctx);
        emit_in_stmt_context(ctx, arm.body, mode);
        codegen_ctx$emit(ctx, `break ${label};`);
        codegen_ctx$pop_indent(ctx);
        codegen_ctx$emit(ctx, "}");
        codegen_ctx$pop_indent(ctx);
        codegen_ctx$emit(ctx, "}");
        break __ring_match17;
      }
      __match_fail(__ring_m17);
    }
  }
  let has_catchall = false;
  const __ring_iter_7 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
    if (__ring_next_7._tag === "none") break;
    const a = __ring_next_7._0;
    __ring_match18: {
      const __ring_m18 = a.guard;
      if (__ring_m18._tag === "some") {
        break __ring_match18;
      }
      if (__ring_m18._tag === "none") {
        if (pattern_is_catchall(a.pattern)) {
          has_catchall = true;
        }
        break __ring_match18;
      }
      __match_fail(__ring_m18);
    }
  }
  if ((has_catchall === false)) {
    codegen_ctx$emit(ctx, `${hir$RUNTIME_MATCH_FAIL}(${scrut_var});`);
  }
  codegen_ctx$pop_indent(ctx);
  return codegen_ctx$emit(ctx, "}");
}

function emit_stmt(ctx, stmt) {
  __ring_match19: {
    const __ring_m19 = stmt;
    if (__ring_m19._tag === "ExprStmt") {
      const expr = __ring_m19.expr;
      return emit_in_stmt_context(ctx, expr, "discard");
      break __ring_match19;
    }
    if (__ring_m19._tag === "Return") {
      const value = __ring_m19.value;
      __ring_match20: {
        const __ring_m20 = value;
        if (__ring_m20._tag === "some") {
          const v = __ring_m20._0;
          return emit_in_stmt_context(ctx, v, "return");
          break __ring_match20;
        }
        if (__ring_m20._tag === "none") {
          return codegen_ctx$emit(ctx, "return;");
          break __ring_match20;
        }
        __match_fail(__ring_m20);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "While") {
      const condition = __ring_m19.condition; const body = __ring_m19.body;
      const cond = codegen_expr$gen_expr(ctx, condition);
      codegen_ctx$emit(ctx, `while (${cond}) {`);
      codegen_ctx$push_indent(ctx);
      emit_block_in_stmt_context(ctx, body, "discard");
      codegen_ctx$pop_indent(ctx);
      return codegen_ctx$emit(ctx, "}");
      break __ring_match19;
    }
    if (__ring_m19._tag === "ForIn") {
      const binding = __ring_m19.binding; const destructure = __ring_m19.destructure; const iterable = __ring_m19.iterable; const body = __ring_m19.body; const iterable_type_name = __ring_m19.iterable_type_name; const iter_type_name = __ring_m19.iter_type_name;
      __ring_match21: {
        const __ring_m21 = iterable;
        if (__ring_m21._tag === "RangeExpr") {
          const start = __ring_m21.start; const end = __ring_m21.end; const inclusive = __ring_m21.inclusive;
          const start_js = codegen_expr$gen_expr(ctx, start);
          const end_js = codegen_expr$gen_expr(ctx, end);
          const b = codegen_ctx$safe_ident(binding);
          const end_var = `__ring_end${ctx.loop_counter}`;
          ctx.loop_counter = (ctx.loop_counter + 1);
          codegen_ctx$emit(ctx, `const ${end_var} = ${end_js};`);
          const cmp = (inclusive ? "<=" : "<");
          codegen_ctx$emit(ctx, `for (let ${b} = ${start_js}; ${b} ${cmp} ${end_var}; ${b}++) {`);
          codegen_ctx$push_indent(ctx);
          emit_block_in_stmt_context(ctx, body, "discard");
          codegen_ctx$pop_indent(ctx);
          return codegen_ctx$emit(ctx, "}");
          break __ring_match21;
        }
        const iter_htype = hir$hexpr_type(iterable);
        const is_range = (function() {
  const __ring_m = iter_htype;
  if (__ring_m._tag === "EnumType") { const name = __ring_m.name; return (name === types$BUILTIN_RANGE); }
  return false;
})();
        if (is_range) {
          const rng_var = `__ring_rng${ctx.loop_counter}`;
          ctx.loop_counter = (ctx.loop_counter + 1);
          const it = codegen_expr$gen_expr(ctx, iterable);
          const b = codegen_ctx$safe_ident(binding);
          codegen_ctx$emit(ctx, `const ${rng_var} = ${it};`);
          codegen_ctx$emit(ctx, `for (let ${b} = ${rng_var}.start; ${rng_var}.inclusive ? ${b} <= ${rng_var}.end : ${b} < ${rng_var}.end; ${b}++) {`);
          codegen_ctx$push_indent(ctx);
          emit_block_in_stmt_context(ctx, body, "discard");
          codegen_ctx$pop_indent(ctx);
          return codegen_ctx$emit(ctx, "}");
        } else {
          return emit_iterator_for_in(ctx, binding, destructure, iterable, body, iterable_type_name, iter_type_name);
        }
        break __ring_match21;
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "Break") {
      return codegen_ctx$emit(ctx, "break;");
      break __ring_match19;
    }
    if (__ring_m19._tag === "Continue") {
      return codegen_ctx$emit(ctx, "continue;");
      break __ring_match19;
    }
    if (__ring_m19._tag === "LetDestructure") {
      const bindings = __ring_m19.bindings; const init = __ring_m19.init;
      const init_js = codegen_expr$gen_expr(ctx, init);
      const tmp = `__ring_dt${ctx.dt_counter}`;
      ctx.dt_counter = (ctx.dt_counter + 1);
      codegen_ctx$emit(ctx, `const ${tmp} = ${init_js};`);
      const __ring_end8 = List_len(bindings);
      for (let i = 0; i < __ring_end8; i++) {
        __ring_match22: {
          const __ring_m22 = List_get(bindings, i);
          if (__ring_m22._tag === "some") {
            const b = __ring_m22._0;
            if ((b.name !== "_")) {
              const sname = codegen_ctx$safe_ident(b.name);
              codegen_ctx$emit(ctx, `const ${sname} = ${tmp}[${i}];`);
            }
            break __ring_match22;
          }
          if (__ring_m22._tag === "none") {
            break __ring_match22;
          }
          __match_fail(__ring_m22);
        }
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "IfLet") {
      const pattern = __ring_m19.pattern; const expr = __ring_m19.expr; const then_block = __ring_m19.then_block; const else_block = __ring_m19.else_block;
      codegen_ctx$emit(ctx, "{");
      codegen_ctx$push_indent(ctx);
      const scrutinee = codegen_expr$gen_expr(ctx, expr);
      codegen_ctx$emit(ctx, `const __ring_t = ${scrutinee};`);
      const cond = gen_pattern_condition(ctx, "__ring_t", pattern);
      codegen_ctx$emit(ctx, `if (${cond}) {`);
      codegen_ctx$push_indent(ctx);
      const bindings = gen_pattern_bindings(ctx, "__ring_t", pattern);
      if ((Str_len(Str_trim(bindings)) > 0)) {
        codegen_ctx$emit(ctx, Str_trim(bindings));
      }
      emit_block_in_stmt_context(ctx, then_block, "discard");
      codegen_ctx$pop_indent(ctx);
      __ring_match23: {
        const __ring_m23 = else_block;
        if (__ring_m23._tag === "some") {
          const eb = __ring_m23._0;
          codegen_ctx$emit(ctx, "} else {");
          codegen_ctx$push_indent(ctx);
          emit_block_in_stmt_context(ctx, eb, "discard");
          codegen_ctx$pop_indent(ctx);
          codegen_ctx$emit(ctx, "}");
          break __ring_match23;
        }
        if (__ring_m23._tag === "none") {
          codegen_ctx$emit(ctx, "}");
          break __ring_match23;
        }
        __match_fail(__ring_m23);
      }
      codegen_ctx$pop_indent(ctx);
      return codegen_ctx$emit(ctx, "}");
      break __ring_match19;
    }
    if (__ring_m19._tag === "Let") {
      const name = __ring_m19.name; const init = __ring_m19.init;
      const sname = codegen_ctx$safe_ident(name);
      const init_js = codegen_expr$gen_expr(ctx, init);
      return codegen_ctx$emit(ctx, `const ${sname} = ${init_js};`);
      break __ring_match19;
    }
    if (__ring_m19._tag === "Var") {
      const name = __ring_m19.name; const def_id = __ring_m19.def_id; const init = __ring_m19.init;
      const sname = codegen_ctx$safe_ident(name);
      const init_js = codegen_expr$gen_expr(ctx, init);
      const is_boxed = (function() {
  const __ring_m = def_id;
  if (__ring_m._tag === "some") { const did = __ring_m._0; return _Set_contains(ctx.boxed_vars, did, __Int_Eq); }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
      if (is_boxed) {
        return codegen_ctx$emit(ctx, `let ${sname} = {value: ${init_js}};`);
      } else {
        return codegen_ctx$emit(ctx, `let ${sname} = ${init_js};`);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "Assign") {
      const target = __ring_m19.target; const value = __ring_m19.value;
      const t = codegen_expr$gen_expr(ctx, target);
      const v = codegen_expr$gen_expr(ctx, value);
      return codegen_ctx$emit(ctx, `${t} = ${v};`);
      break __ring_match19;
    }
    if (__ring_m19._tag === "Drop") {
      break __ring_match19;
    }
    if (__ring_m19._tag === "Dup") {
      break __ring_match19;
    }
    __match_fail(__ring_m19);
  }
}

function gen_stmt_inline(ctx, stmt) {
  __ring_match24: {
    const __ring_m24 = stmt;
    if (__ring_m24._tag === "Let") {
      const name = __ring_m24.name; const init = __ring_m24.init;
      const sname = codegen_ctx$safe_ident(name);
      const init_js = codegen_expr$gen_expr(ctx, init);
      return `const ${sname} = ${init_js};`;
      break __ring_match24;
    }
    if (__ring_m24._tag === "Var") {
      const name = __ring_m24.name; const def_id = __ring_m24.def_id; const init = __ring_m24.init;
      const sname = codegen_ctx$safe_ident(name);
      const init_js = codegen_expr$gen_expr(ctx, init);
      const is_boxed = (function() {
  const __ring_m = def_id;
  if (__ring_m._tag === "some") { const did = __ring_m._0; return _Set_contains(ctx.boxed_vars, did, __Int_Eq); }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
      if (is_boxed) {
        return `let ${sname} = {value: ${init_js}};`;
      } else {
        return `let ${sname} = ${init_js};`;
      }
      break __ring_match24;
    }
    if (__ring_m24._tag === "Assign") {
      const target = __ring_m24.target; const value = __ring_m24.value;
      const t = codegen_expr$gen_expr(ctx, target);
      const v = codegen_expr$gen_expr(ctx, value);
      return `${t} = ${v};`;
      break __ring_match24;
    }
    if (__ring_m24._tag === "ExprStmt") {
      const expr = __ring_m24.expr;
      const e = codegen_expr$gen_expr(ctx, expr);
      return `${e};`;
      break __ring_match24;
    }
    if (__ring_m24._tag === "Return") {
      const value = __ring_m24.value;
      __ring_match25: {
        const __ring_m25 = value;
        if (__ring_m25._tag === "some") {
          const v = __ring_m25._0;
          const e = codegen_expr$gen_expr(ctx, v);
          return `return ${e};`;
          break __ring_match25;
        }
        if (__ring_m25._tag === "none") {
          return "return;";
          break __ring_match25;
        }
        __match_fail(__ring_m25);
      }
      break __ring_match24;
    }
    return "/* codegen: unhandled inline stmt */ undefined;";
    break __ring_match24;
  }
}

function pattern_is_catchall(pat) {
  __ring_match26: {
    const __ring_m26 = pat;
    if (__ring_m26._tag === "Wildcard") {
      return true;
      break __ring_match26;
    }
    if (__ring_m26._tag === "Binding") {
      return true;
      break __ring_match26;
    }
    if (__ring_m26._tag === "OrPattern") {
      const patterns = __ring_m26.patterns;
      const __ring_iter_9 = __List_Iterable.iter(patterns);
      while (true) {
        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
        if (__ring_next_9._tag === "none") break;
        const p = __ring_next_9._0;
        if (pattern_is_catchall(p)) {
          return true;
        }
      }
      return false;
      break __ring_match26;
    }
    return false;
    break __ring_match26;
  }
}

function gen_pattern_condition(ctx, target, pat) {
  __ring_match27: {
    const __ring_m27 = pat;
    if (__ring_m27._tag === "Wildcard") {
      return "true";
      break __ring_match27;
    }
    if (__ring_m27._tag === "Binding") {
      return "true";
      break __ring_match27;
    }
    if (__ring_m27._tag === "Literal") {
      const value = __ring_m27.value;
      const val_str = (function() {
  const __ring_m = value;
  if (__ring_m._tag === "IntVal") { const n = __ring_m._0; return Int_to_str(n); }
  if (__ring_m._tag === "FloatVal") { const f = __ring_m._0; return Float_to_str(f); }
  if (__ring_m._tag === "StrVal") { const s = __ring_m._0; return json_stringify(s); }
  if (__ring_m._tag === "BoolVal") { const b = __ring_m._0; return (b ? "true" : "false"); }
  __match_fail(__ring_m);
})();
      return `${target} === ${val_str}`;
      break __ring_match27;
    }
    if (__ring_m27._tag === "Constructor") {
      const name = __ring_m27.name; const fields = __ring_m27.fields;
      const tag_check = `${target}.${hir$ENUM_TAG_FIELD} === "${name}"`;
      let sub_conds = [];
      const __ring_end10 = List_len(fields);
      for (let i = 0; i < __ring_end10; i++) {
        __ring_match28: {
          const __ring_m28 = List_get(fields, i);
          if (__ring_m28._tag === "some") {
            const f = __ring_m28._0;
            const sub = gen_pattern_condition(ctx, `${target}._${i}`, f);
            if ((sub !== "true")) {
              List_push(sub_conds, sub);
            }
            break __ring_match28;
          }
          if (__ring_m28._tag === "none") {
            break __ring_match28;
          }
          __match_fail(__ring_m28);
        }
      }
      if ((List_len(sub_conds) === 0)) {
        return tag_check;
      } else {
        const joined = List_join(sub_conds, " && ");
        return `${tag_check} && ${joined}`;
      }
      break __ring_match27;
    }
    if (__ring_m27._tag === "NamedConstructor") {
      const name = __ring_m27.name; const fields = __ring_m27.fields;
      const resolved = resolve_struct_name(ctx, name);
      __ring_match29: {
        const __ring_m29 = resolved;
        if (__ring_m29._tag === "some") {
          const qualified_name = __ring_m29._0;
          const inst_check = `${target} instanceof ${qualified_name}`;
          let sub_conds = [];
          const __ring_iter_11 = __List_Iterable.iter(fields);
          while (true) {
            const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
            if (__ring_next_11._tag === "none") break;
            const f = __ring_next_11._0;
            const sname = codegen_ctx$safe_ident(f.name);
            const sub = gen_pattern_condition(ctx, `${target}.${sname}`, f.pattern);
            if ((sub !== "true")) {
              List_push(sub_conds, sub);
            }
          }
          if ((List_len(sub_conds) === 0)) {
            return inst_check;
          } else {
            const joined = List_join(sub_conds, " && ");
            return `${inst_check} && ${joined}`;
          }
          break __ring_match29;
        }
        if (__ring_m29._tag === "none") {
          const tag_check = `${target}.${hir$ENUM_TAG_FIELD} === "${name}"`;
          let sub_conds = [];
          const __ring_iter_12 = __List_Iterable.iter(fields);
          while (true) {
            const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
            if (__ring_next_12._tag === "none") break;
            const f = __ring_next_12._0;
            const sname = codegen_ctx$safe_ident(f.name);
            const sub = gen_pattern_condition(ctx, `${target}.${sname}`, f.pattern);
            if ((sub !== "true")) {
              List_push(sub_conds, sub);
            }
          }
          if ((List_len(sub_conds) === 0)) {
            return tag_check;
          } else {
            const joined = List_join(sub_conds, " && ");
            return `${tag_check} && ${joined}`;
          }
          break __ring_match29;
        }
        __match_fail(__ring_m29);
      }
      break __ring_match27;
    }
    if (__ring_m27._tag === "TuplePattern") {
      const elements = __ring_m27.elements;
      const len_check = `Array.isArray(${target}) && ${target}.length === ${List_len(elements)}`;
      let sub_conds = [];
      const __ring_end13 = List_len(elements);
      for (let i = 0; i < __ring_end13; i++) {
        __ring_match30: {
          const __ring_m30 = List_get(elements, i);
          if (__ring_m30._tag === "some") {
            const e = __ring_m30._0;
            const sub = gen_pattern_condition(ctx, `${target}[${i}]`, e);
            if ((sub !== "true")) {
              List_push(sub_conds, sub);
            }
            break __ring_match30;
          }
          if (__ring_m30._tag === "none") {
            break __ring_match30;
          }
          __match_fail(__ring_m30);
        }
      }
      if ((List_len(sub_conds) === 0)) {
        return len_check;
      } else {
        const joined = List_join(sub_conds, " && ");
        return `${len_check} && ${joined}`;
      }
      break __ring_match27;
    }
    if (__ring_m27._tag === "OrPattern") {
      const patterns = __ring_m27.patterns;
      let or_conds = [];
      const __ring_iter_14 = __List_Iterable.iter(patterns);
      while (true) {
        const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
        if (__ring_next_14._tag === "none") break;
        const p = __ring_next_14._0;
        const sub = gen_pattern_condition(ctx, target, p);
        List_push(or_conds, `(${sub})`);
      }
      return List_join(or_conds, " || ");
      break __ring_match27;
    }
    __match_fail(__ring_m27);
  }
}

function gen_pattern_bindings(ctx, target, pat) {
  __ring_match31: {
    const __ring_m31 = pat;
    if (__ring_m31._tag === "Wildcard") {
      return "";
      break __ring_match31;
    }
    if (__ring_m31._tag === "Literal") {
      return "";
      break __ring_match31;
    }
    if (__ring_m31._tag === "Binding") {
      const name = __ring_m31.name;
      const sname = codegen_ctx$safe_ident(name);
      return `const ${sname} = ${target}; `;
      break __ring_match31;
    }
    if (__ring_m31._tag === "Constructor") {
      const fields = __ring_m31.fields;
      let result = "";
      const __ring_end15 = List_len(fields);
      for (let i = 0; i < __ring_end15; i++) {
        __ring_match32: {
          const __ring_m32 = List_get(fields, i);
          if (__ring_m32._tag === "some") {
            const f = __ring_m32._0;
            const sub = gen_pattern_bindings(ctx, `${target}._${i}`, f);
            result = `${result}${sub}`;
            break __ring_match32;
          }
          if (__ring_m32._tag === "none") {
            break __ring_match32;
          }
          __match_fail(__ring_m32);
        }
      }
      return result;
      break __ring_match31;
    }
    if (__ring_m31._tag === "NamedConstructor") {
      const fields = __ring_m31.fields;
      let result = "";
      const __ring_iter_16 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
        if (__ring_next_16._tag === "none") break;
        const f = __ring_next_16._0;
        const sname = codegen_ctx$safe_ident(f.name);
        const sub = gen_pattern_bindings(ctx, `${target}.${sname}`, f.pattern);
        result = `${result}${sub}`;
      }
      return result;
      break __ring_match31;
    }
    if (__ring_m31._tag === "TuplePattern") {
      const elements = __ring_m31.elements;
      let result = "";
      const __ring_end17 = List_len(elements);
      for (let i = 0; i < __ring_end17; i++) {
        __ring_match33: {
          const __ring_m33 = List_get(elements, i);
          if (__ring_m33._tag === "some") {
            const e = __ring_m33._0;
            const sub = gen_pattern_bindings(ctx, `${target}[${i}]`, e);
            result = `${result}${sub}`;
            break __ring_match33;
          }
          if (__ring_m33._tag === "none") {
            break __ring_match33;
          }
          __match_fail(__ring_m33);
        }
      }
      return result;
      break __ring_match31;
    }
    if (__ring_m31._tag === "OrPattern") {
      const patterns = __ring_m31.patterns;
      let binding_names = [];
      collect_binding_names(pat_at_list(patterns, 0), binding_names);
      if ((List_len(binding_names) === 0)) {
        return "";
      } else {
        let result = "";
        const __ring_iter_18 = __List_Iterable.iter(binding_names);
        while (true) {
          const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
          if (__ring_next_18._tag === "none") break;
          const name = __ring_next_18._0;
          const sname = codegen_ctx$safe_ident(name);
          result = `${result}let ${sname}; `;
        }
        let i = 0;
        const __ring_iter_19 = __List_Iterable.iter(patterns);
        while (true) {
          const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
          if (__ring_next_19._tag === "none") break;
          const p = __ring_next_19._0;
          const cond = gen_pattern_condition(ctx, target, p);
          const assigns = gen_pattern_assignments(ctx, target, p);
          if ((i === 0)) {
            result = `${result}if (${cond}) { ${assigns}} `;
          } else {
            result = `${result}else if (${cond}) { ${assigns}} `;
          }
          i = (i + 1);
        }
        return result;
      }
      break __ring_match31;
    }
    __match_fail(__ring_m31);
  }
}

function pat_at_list(list, i) {
  __ring_match34: {
    const __ring_m34 = List_get(list, i);
    if (__ring_m34._tag === "some") {
      const v = __ring_m34._0;
      return v;
      break __ring_match34;
    }
    if (__ring_m34._tag === "none") {
      return panic("unreachable: pat_at_list out of bounds");
      break __ring_match34;
    }
    __match_fail(__ring_m34);
  }
}

function collect_binding_names(pat, names) {
  __ring_match35: {
    const __ring_m35 = pat;
    if (__ring_m35._tag === "Wildcard") {
      break __ring_match35;
    }
    if (__ring_m35._tag === "Literal") {
      break __ring_match35;
    }
    if (__ring_m35._tag === "Binding") {
      const name = __ring_m35.name;
      return List_push(names, name);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Constructor") {
      const fields = __ring_m35.fields;
      const __ring_iter_20 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
        if (__ring_next_20._tag === "none") break;
        const f = __ring_next_20._0;
        collect_binding_names(f, names);
      }
      break __ring_match35;
    }
    if (__ring_m35._tag === "NamedConstructor") {
      const fields = __ring_m35.fields;
      const __ring_iter_21 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
        if (__ring_next_21._tag === "none") break;
        const f = __ring_next_21._0;
        collect_binding_names(f.pattern, names);
      }
      break __ring_match35;
    }
    if (__ring_m35._tag === "TuplePattern") {
      const elements = __ring_m35.elements;
      const __ring_iter_22 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
        if (__ring_next_22._tag === "none") break;
        const e = __ring_next_22._0;
        collect_binding_names(e, names);
      }
      break __ring_match35;
    }
    if (__ring_m35._tag === "OrPattern") {
      const patterns = __ring_m35.patterns;
      return collect_binding_names(pat_at_list(patterns, 0), names);
      break __ring_match35;
    }
    __match_fail(__ring_m35);
  }
}

function gen_pattern_assignments(ctx, target, pat) {
  __ring_match36: {
    const __ring_m36 = pat;
    if (__ring_m36._tag === "Wildcard") {
      return "";
      break __ring_match36;
    }
    if (__ring_m36._tag === "Literal") {
      return "";
      break __ring_match36;
    }
    if (__ring_m36._tag === "Binding") {
      const name = __ring_m36.name;
      const sname = codegen_ctx$safe_ident(name);
      return `${sname} = ${target}; `;
      break __ring_match36;
    }
    if (__ring_m36._tag === "Constructor") {
      const fields = __ring_m36.fields;
      let result = "";
      const __ring_end23 = List_len(fields);
      for (let i = 0; i < __ring_end23; i++) {
        __ring_match37: {
          const __ring_m37 = List_get(fields, i);
          if (__ring_m37._tag === "some") {
            const f = __ring_m37._0;
            const sub = gen_pattern_assignments(ctx, `${target}._${i}`, f);
            result = `${result}${sub}`;
            break __ring_match37;
          }
          if (__ring_m37._tag === "none") {
            break __ring_match37;
          }
          __match_fail(__ring_m37);
        }
      }
      return result;
      break __ring_match36;
    }
    if (__ring_m36._tag === "NamedConstructor") {
      const fields = __ring_m36.fields;
      let result = "";
      const __ring_iter_24 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
        if (__ring_next_24._tag === "none") break;
        const f = __ring_next_24._0;
        const sname = codegen_ctx$safe_ident(f.name);
        const sub = gen_pattern_assignments(ctx, `${target}.${sname}`, f.pattern);
        result = `${result}${sub}`;
      }
      return result;
      break __ring_match36;
    }
    if (__ring_m36._tag === "TuplePattern") {
      const elements = __ring_m36.elements;
      let result = "";
      const __ring_end25 = List_len(elements);
      for (let i = 0; i < __ring_end25; i++) {
        __ring_match38: {
          const __ring_m38 = List_get(elements, i);
          if (__ring_m38._tag === "some") {
            const e = __ring_m38._0;
            const sub = gen_pattern_assignments(ctx, `${target}[${i}]`, e);
            result = `${result}${sub}`;
            break __ring_match38;
          }
          if (__ring_m38._tag === "none") {
            break __ring_match38;
          }
          __match_fail(__ring_m38);
        }
      }
      return result;
      break __ring_match36;
    }
    if (__ring_m36._tag === "OrPattern") {
      const patterns = __ring_m36.patterns;
      let result = "";
      let i = 0;
      const __ring_iter_26 = __List_Iterable.iter(patterns);
      while (true) {
        const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
        if (__ring_next_26._tag === "none") break;
        const p = __ring_next_26._0;
        const cond = gen_pattern_condition(ctx, target, p);
        const assigns = gen_pattern_assignments(ctx, target, p);
        if ((i === 0)) {
          result = `${result}if (${cond}) { ${assigns}} `;
        } else {
          result = `${result}else if (${cond}) { ${assigns}} `;
        }
        i = (i + 1);
      }
      return result;
      break __ring_match36;
    }
    __match_fail(__ring_m36);
  }
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


export { emit_in_stmt_context, emit_block_in_stmt_context, emit_block_body, emit_stmt, gen_stmt_inline, pattern_is_catchall, gen_pattern_condition, gen_pattern_bindings };