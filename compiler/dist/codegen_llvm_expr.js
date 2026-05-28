import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { llvm_mangle_fn as codegen_llvm_ctx$llvm_mangle_fn, llvm_mangle_method as codegen_llvm_ctx$llvm_mangle_method, fresh_name as codegen_llvm_ctx$fresh_name, get_or_declare_runtime_fn as codegen_llvm_ctx$get_or_declare_runtime_fn, get_rt_fn_type as codegen_llvm_ctx$get_rt_fn_type, StructFieldInfo as codegen_llvm_ctx$StructFieldInfo, EnumVariantInfo as codegen_llvm_ctx$EnumVariantInfo, EnumTypeInfo as codegen_llvm_ctx$EnumTypeInfo, LlvmCtx as codegen_llvm_ctx$LlvmCtx, __EnumVariantInfo_Eq as codegen_llvm_ctx$__EnumVariantInfo_Eq, __EnumVariantInfo_Clone as codegen_llvm_ctx$__EnumVariantInfo_Clone, __EnumVariantInfo_Ord as codegen_llvm_ctx$__EnumVariantInfo_Ord, __EnumVariantInfo_Debug as codegen_llvm_ctx$__EnumVariantInfo_Debug, __StructFieldInfo_Clone as codegen_llvm_ctx$__StructFieldInfo_Clone, __StructFieldInfo_Debug as codegen_llvm_ctx$__StructFieldInfo_Debug, __EnumTypeInfo_Clone as codegen_llvm_ctx$__EnumTypeInfo_Clone, __EnumTypeInfo_Debug as codegen_llvm_ctx$__EnumTypeInfo_Debug } from "./codegen_llvm_ctx.js";
import { emit_llvm_stmt as codegen_llvm_stmt$emit_llvm_stmt } from "./codegen_llvm_stmt.js";
import { safe_ident as codegen_ctx$safe_ident, new_codegen_ctx as codegen_ctx$new_codegen_ctx, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, push_indent as codegen_ctx$push_indent, pop_indent as codegen_ctx$pop_indent, qualify as codegen_ctx$qualify, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";



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















































function gen_llvm_expr(ctx, expr) {
  __ring_match6: {
    const __ring_m6 = expr;
    if (__ring_m6._tag === "IntLit") {
      const value = __ring_m6.value;
      return gen_int_lit(ctx, value);
      break __ring_match6;
    }
    if (__ring_m6._tag === "FloatLit") {
      const value = __ring_m6.value;
      return gen_float_lit(ctx, value);
      break __ring_match6;
    }
    if (__ring_m6._tag === "StrLit") {
      const value = __ring_m6.value;
      return gen_str_lit(ctx, value);
      break __ring_match6;
    }
    if (__ring_m6._tag === "BoolLit") {
      const value = __ring_m6.value;
      return gen_bool_lit(ctx, value);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Ident") {
      const name = __ring_m6.name; const resolved_name = __ring_m6.resolved_name;
      return gen_ident(ctx, name, resolved_name);
      break __ring_match6;
    }
    if (__ring_m6._tag === "BinOp") {
      const op = __ring_m6.op; const left = __ring_m6.left; const right = __ring_m6.right; const ty = __ring_m6.ty;
      return gen_binop(ctx, op, left, right, ty);
      break __ring_match6;
    }
    if (__ring_m6._tag === "UnaryOp") {
      const op = __ring_m6.op; const operand = __ring_m6.operand; const ty = __ring_m6.ty;
      return gen_unaryop(ctx, op, operand, ty);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Call") {
      const callee = __ring_m6.callee; const args = __ring_m6.args; const dict_dispatch = __ring_m6.dict_dispatch; const ty = __ring_m6.ty; const effects = __ring_m6.effects;
      return gen_call(ctx, callee, args, ty, effects);
      break __ring_match6;
    }
    if (__ring_m6._tag === "FieldAccess") {
      const receiver = __ring_m6.receiver; const field = __ring_m6.field; const ty = __ring_m6.ty;
      return gen_field_access(ctx, receiver, field, ty);
      break __ring_match6;
    }
    if (__ring_m6._tag === "StructLit") {
      const name = __ring_m6.name; const fields = __ring_m6.fields;
      return gen_struct_lit(ctx, name, fields);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Block") {
      const stmts = __ring_m6.stmts; const tail = __ring_m6.tail;
      return gen_block(ctx, stmts, tail);
      break __ring_match6;
    }
    if (__ring_m6._tag === "IfExpr") {
      const condition = __ring_m6.condition; const then_branch = __ring_m6.then_branch; const else_branch = __ring_m6.else_branch;
      return gen_if_expr(ctx, condition, then_branch, else_branch);
      break __ring_match6;
    }
    if (__ring_m6._tag === "StringInterp") {
      const parts = __ring_m6.parts;
      return gen_string_interp(ctx, parts);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Lambda") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match6;
    }
    if (__ring_m6._tag === "MatchExpr") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match6;
    }
    if (__ring_m6._tag === "NamedVariantConstruct") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match6;
    }
    if (__ring_m6._tag === "TryCatch") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match6;
    }
    if (__ring_m6._tag === "HandleExpr") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match6;
    }
    if (__ring_m6._tag === "EffectOp") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match6;
    }
    if (__ring_m6._tag === "RangeExpr") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ListLit") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match6;
    }
    if (__ring_m6._tag === "TupleLit") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match6;
    }
    if (__ring_m6._tag === "IndexExpr") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function gen_int_lit(ctx, value) {
  const raw = LLVMConstInt(ctx.i64_type, value, 1);
  const box_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_int", [ctx.i64_type], ctx.ptr_type);
  const box_fn_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_box_int");
  return LLVMBuildCall2(ctx.builder, box_fn_ty, box_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "int"));
}

function gen_float_lit(ctx, value) {
  const raw = LLVMConstReal(ctx.double_type, value);
  const box_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_float", [ctx.double_type], ctx.ptr_type);
  const box_fn_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_box_float");
  return LLVMBuildCall2(ctx.builder, box_fn_ty, box_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "flt"));
}

function gen_str_lit(ctx, value) {
  const global_str = LLVMBuildGlobalStringPtr(ctx.builder, value, codegen_llvm_ctx$fresh_name(ctx, "str"));
  const from_cstr_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type);
  const from_cstr_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_from_cstr");
  return LLVMBuildCall2(ctx.builder, from_cstr_ty, from_cstr_fn, [global_str], codegen_llvm_ctx$fresh_name(ctx, "s"));
}

function gen_bool_lit(ctx, value) {
  const raw = (value ? LLVMConstInt(ctx.i64_type, 1, 0) : LLVMConstInt(ctx.i64_type, 0, 0));
  const box_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_bool", [ctx.i64_type], ctx.ptr_type);
  const box_fn_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_box_bool");
  return LLVMBuildCall2(ctx.builder, box_fn_ty, box_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "bool"));
}

function gen_ident(ctx, name, resolved_name) {
  const lookup_name = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return rn; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
  __ring_match7: {
    const __ring_m7 = _Map_get(ctx.named_values, lookup_name);
    if (__ring_m7._tag === "some") {
      const alloca = __ring_m7._0;
      return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, lookup_name));
      break __ring_match7;
    }
    if (__ring_m7._tag === "none") {
      __ring_match8: {
        const __ring_m8 = _Map_get(ctx.named_values, name);
        if (__ring_m8._tag === "some") {
          const alloca = __ring_m8._0;
          return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, name));
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          const mangled_resolved = codegen_llvm_ctx$llvm_mangle_fn(lookup_name);
          __ring_match9: {
            const __ring_m9 = _Map_get(ctx.functions, mangled_resolved);
            if (__ring_m9._tag === "some") {
              const fn_val = __ring_m9._0;
              return call_zero_arg_or_return(ctx, fn_val, mangled_resolved);
              break __ring_match9;
            }
            if (__ring_m9._tag === "none") {
              const mangled_bare = codegen_llvm_ctx$llvm_mangle_fn(name);
              __ring_match10: {
                const __ring_m10 = _Map_get(ctx.functions, mangled_bare);
                if (__ring_m10._tag === "some") {
                  const fn_val = __ring_m10._0;
                  return call_zero_arg_or_return(ctx, fn_val, mangled_bare);
                  break __ring_match10;
                }
                if (__ring_m10._tag === "none") {
                  return panic(`LLVM codegen: undefined variable '${name}' (resolved: '${lookup_name}')`);
                  break __ring_match10;
                }
                __match_fail(__ring_m10);
              }
              break __ring_match9;
            }
            __match_fail(__ring_m9);
          }
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
}

function call_zero_arg_or_return(ctx, fn_val, mangled) {
  __ring_match11: {
    const __ring_m11 = _Map_get(ctx.fn_types, mangled);
    if (__ring_m11._tag === "some") {
      const fn_ty = __ring_m11._0;
      const param_count = LLVMCountParams(fn_val);
      if ((param_count === 0)) {
        return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, [], codegen_llvm_ctx$fresh_name(ctx, "ctor"));
      } else {
        return fn_val;
      }
      break __ring_match11;
    }
    if (__ring_m11._tag === "none") {
      return fn_val;
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
}

function is_int_type(ty) {
  __ring_match12: {
    const __ring_m12 = ty;
    if (__ring_m12._tag === "IntType") {
      return true;
      break __ring_match12;
    }
    return false;
    break __ring_match12;
  }
}

function is_float_type(ty) {
  __ring_match13: {
    const __ring_m13 = ty;
    if (__ring_m13._tag === "FloatType") {
      return true;
      break __ring_match13;
    }
    return false;
    break __ring_match13;
  }
}

function is_str_type(ty) {
  __ring_match14: {
    const __ring_m14 = ty;
    if (__ring_m14._tag === "StrType") {
      return true;
      break __ring_match14;
    }
    return false;
    break __ring_match14;
  }
}

function is_bool_type(ty) {
  __ring_match15: {
    const __ring_m15 = ty;
    if (__ring_m15._tag === "BoolType") {
      return true;
      break __ring_match15;
    }
    return false;
    break __ring_match15;
  }
}

function operand_type_from_binop(left) {
  return hir$hexpr_type(left);
}

function gen_binop(ctx, op, left, right, result_ty) {
  const op_type = operand_type_from_binop(left);
  __ring_match16: {
    const __ring_m16 = op;
    if (__ring_m16._tag === "And") {
      return gen_and(ctx, left, right);
      break __ring_match16;
    }
    if (__ring_m16._tag === "Or") {
      return gen_or(ctx, left, right);
      break __ring_match16;
    }
    break __ring_match16;
  }
  const lhs = gen_llvm_expr(ctx, left);
  const rhs = gen_llvm_expr(ctx, right);
  if (is_int_type(op_type)) {
    return gen_int_binop(ctx, op, lhs, rhs);
  } else {
    if (is_float_type(op_type)) {
      return gen_float_binop(ctx, op, lhs, rhs);
    } else {
      if (is_str_type(op_type)) {
        return gen_str_binop(ctx, op, lhs, rhs);
      } else {
        if (is_bool_type(op_type)) {
          return gen_bool_binop(ctx, op, lhs, rhs);
        } else {
          return gen_int_binop(ctx, op, lhs, rhs);
        }
      }
    }
  }
}

function gen_int_binop(ctx, op, lhs, rhs) {
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_int");
  const lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], codegen_llvm_ctx$fresh_name(ctx, "l"));
  const rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], codegen_llvm_ctx$fresh_name(ctx, "r"));
  __ring_match17: {
    const __ring_m17 = op;
    if (__ring_m17._tag === "Add") {
      const result = LLVMBuildAdd(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "add"));
      return box_int(ctx, result);
      break __ring_match17;
    }
    if (__ring_m17._tag === "Sub") {
      const result = LLVMBuildSub(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "sub"));
      return box_int(ctx, result);
      break __ring_match17;
    }
    if (__ring_m17._tag === "Mul") {
      const result = LLVMBuildMul(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "mul"));
      return box_int(ctx, result);
      break __ring_match17;
    }
    if (__ring_m17._tag === "Div") {
      const result = LLVMBuildSDiv(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "div"));
      return box_int(ctx, result);
      break __ring_match17;
    }
    if (__ring_m17._tag === "Mod") {
      const result = LLVMBuildSRem(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "mod"));
      return box_int(ctx, result);
      break __ring_match17;
    }
    if (__ring_m17._tag === "Eq") {
      const cmp = LLVMBuildICmp(ctx.builder, 32, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "eq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match17;
    }
    if (__ring_m17._tag === "Neq") {
      const cmp = LLVMBuildICmp(ctx.builder, 33, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "ne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match17;
    }
    if (__ring_m17._tag === "Lt") {
      const cmp = LLVMBuildICmp(ctx.builder, 40, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "lt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match17;
    }
    if (__ring_m17._tag === "Lte") {
      const cmp = LLVMBuildICmp(ctx.builder, 41, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "le"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match17;
    }
    if (__ring_m17._tag === "Gt") {
      const cmp = LLVMBuildICmp(ctx.builder, 38, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "gt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match17;
    }
    if (__ring_m17._tag === "Gte") {
      const cmp = LLVMBuildICmp(ctx.builder, 39, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "ge"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match17;
    }
    if (__ring_m17._tag === "And") {
      return panic("LLVM codegen: And should be handled by short-circuit");
      break __ring_match17;
    }
    if (__ring_m17._tag === "Or") {
      return panic("LLVM codegen: Or should be handled by short-circuit");
      break __ring_match17;
    }
    __match_fail(__ring_m17);
  }
}

function gen_float_binop(ctx, op, lhs, rhs) {
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
  const lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], codegen_llvm_ctx$fresh_name(ctx, "l"));
  const rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], codegen_llvm_ctx$fresh_name(ctx, "r"));
  __ring_match18: {
    const __ring_m18 = op;
    if (__ring_m18._tag === "Add") {
      const result = LLVMBuildFAdd(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fadd"));
      return box_float(ctx, result);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Sub") {
      const result = LLVMBuildFSub(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fsub"));
      return box_float(ctx, result);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Mul") {
      const result = LLVMBuildFMul(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fmul"));
      return box_float(ctx, result);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Div") {
      const result = LLVMBuildFDiv(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fdiv"));
      return box_float(ctx, result);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Eq") {
      const cmp = LLVMBuildFCmp(ctx.builder, 1, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "feq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Neq") {
      const cmp = LLVMBuildFCmp(ctx.builder, 6, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Lt") {
      const cmp = LLVMBuildFCmp(ctx.builder, 4, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "flt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Lte") {
      const cmp = LLVMBuildFCmp(ctx.builder, 5, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fle"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Gt") {
      const cmp = LLVMBuildFCmp(ctx.builder, 2, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fgt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Gte") {
      const cmp = LLVMBuildFCmp(ctx.builder, 3, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fge"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match18;
    }
    return panic("LLVM codegen: unsupported float binop");
    break __ring_match18;
  }
}

function gen_str_binop(ctx, op, lhs, rhs) {
  __ring_match19: {
    const __ring_m19 = op;
    if (__ring_m19._tag === "Eq") {
      const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
      const result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "seq"));
      return box_bool(ctx, result);
      break __ring_match19;
    }
    if (__ring_m19._tag === "Neq") {
      const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
      const result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "seq"));
      const one = LLVMConstInt(ctx.i64_type, 1, 0);
      const neg = LLVMBuildSub(ctx.builder, one, result, codegen_llvm_ctx$fresh_name(ctx, "neg"));
      return box_bool(ctx, neg);
      break __ring_match19;
    }
    if (__ring_m19._tag === "Lt") {
      const lt_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_lt", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const lt_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_lt");
      const result = LLVMBuildCall2(ctx.builder, lt_ty, lt_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "slt"));
      return box_bool(ctx, result);
      break __ring_match19;
    }
    return panic("LLVM codegen: unsupported str binop");
    break __ring_match19;
  }
}

function gen_bool_binop(ctx, op, lhs, rhs) {
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_bool");
  const lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], codegen_llvm_ctx$fresh_name(ctx, "lb"));
  const rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], codegen_llvm_ctx$fresh_name(ctx, "rb"));
  __ring_match20: {
    const __ring_m20 = op;
    if (__ring_m20._tag === "Eq") {
      const cmp = LLVMBuildICmp(ctx.builder, 32, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "beq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match20;
    }
    if (__ring_m20._tag === "Neq") {
      const cmp = LLVMBuildICmp(ctx.builder, 33, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "bne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match20;
    }
    return panic("LLVM codegen: unsupported bool binop");
    break __ring_match20;
  }
}

function gen_and(ctx, left, right) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: gen_and outside function"); }
  __match_fail(__ring_m);
})();
  const lhs = gen_llvm_expr(ctx, left);
  const lhs_bool = unbox_to_i1(ctx, lhs);
  const rhs_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "and.rhs");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "and.merge");
  const lhs_end_bb = LLVMGetInsertBlock(ctx.builder);
  LLVMBuildCondBr(ctx.builder, lhs_bool, rhs_bb, merge_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, rhs_bb);
  const rhs = gen_llvm_expr(ctx, right);
  const rhs_end_bb = LLVMGetInsertBlock(ctx.builder);
  LLVMBuildBr(ctx.builder, merge_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const false_val = gen_bool_lit(ctx, false);
  const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "and"));
  LLVMAddIncoming(phi, [false_val, rhs], [lhs_end_bb, rhs_end_bb]);
  return phi;
}

function gen_or(ctx, left, right) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: gen_or outside function"); }
  __match_fail(__ring_m);
})();
  const lhs = gen_llvm_expr(ctx, left);
  const lhs_bool = unbox_to_i1(ctx, lhs);
  const rhs_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "or.rhs");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "or.merge");
  const lhs_end_bb = LLVMGetInsertBlock(ctx.builder);
  LLVMBuildCondBr(ctx.builder, lhs_bool, merge_bb, rhs_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, rhs_bb);
  const rhs = gen_llvm_expr(ctx, right);
  const rhs_end_bb = LLVMGetInsertBlock(ctx.builder);
  LLVMBuildBr(ctx.builder, merge_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const true_val = gen_bool_lit(ctx, true);
  const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "or"));
  LLVMAddIncoming(phi, [true_val, rhs], [lhs_end_bb, rhs_end_bb]);
  return phi;
}

function gen_unaryop(ctx, op, operand, ty) {
  const val = gen_llvm_expr(ctx, operand);
  __ring_match21: {
    const __ring_m21 = op;
    if (__ring_m21._tag === "Neg") {
      if (is_int_type(ty)) {
        const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type);
        const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_int");
        const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "un"));
        const zero = LLVMConstInt(ctx.i64_type, 0, 0);
        const neg = LLVMBuildSub(ctx.builder, zero, raw, codegen_llvm_ctx$fresh_name(ctx, "neg"));
        return box_int(ctx, neg);
      } else {
        const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
        const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
        const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "un"));
        const zero = LLVMConstReal(ctx.double_type, 0);
        const neg = LLVMBuildFSub(ctx.builder, zero, raw, codegen_llvm_ctx$fresh_name(ctx, "fneg"));
        return box_float(ctx, neg);
      }
      break __ring_match21;
    }
    if (__ring_m21._tag === "Not") {
      const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type);
      const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_bool");
      const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "un"));
      const one = LLVMConstInt(ctx.i64_type, 1, 0);
      const neg = LLVMBuildSub(ctx.builder, one, raw, codegen_llvm_ctx$fresh_name(ctx, "not"));
      return box_bool(ctx, neg);
      break __ring_match21;
    }
    __match_fail(__ring_m21);
  }
}

function gen_call(ctx, callee, args, result_ty, effects) {
  let arg_vals = [];
  const __ring_iter_2 = __List_Iterable.iter(args);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const a = __ring_next_2._0;
    List_push(arg_vals, gen_llvm_expr(ctx, a));
  }
  __ring_match22: {
    const __ring_m22 = callee;
    if (__ring_m22._tag === "Ident") {
      const name = __ring_m22.name; const resolved_name = __ring_m22.resolved_name;
      const call_name = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return rn; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
      return gen_direct_call(ctx, call_name, arg_vals);
      break __ring_match22;
    }
    if (__ring_m22._tag === "FieldAccess") {
      const receiver = __ring_m22.receiver; const field = __ring_m22.field;
      const recv_val = gen_llvm_expr(ctx, receiver);
      const recv_type = hir$hexpr_type(receiver);
      return gen_method_call(ctx, recv_val, recv_type, field, arg_vals);
      break __ring_match22;
    }
    return LLVMConstPointerNull(ctx.ptr_type);
    break __ring_match22;
  }
}

function gen_direct_call(ctx, name, arg_vals) {
  const rt_name = extern_fn_to_runtime(name);
  __ring_match23: {
    const __ring_m23 = rt_name;
    if (__ring_m23._tag === "some") {
      const rtn = __ring_m23._0;
      return gen_runtime_call(ctx, rtn, arg_vals);
      break __ring_match23;
    }
    if (__ring_m23._tag === "none") {
      break __ring_match23;
    }
    __match_fail(__ring_m23);
  }
  const mangled = codegen_llvm_ctx$llvm_mangle_fn(name);
  __ring_match24: {
    const __ring_m24 = _Map_get(ctx.functions, mangled);
    if (__ring_m24._tag === "some") {
      const fn_val = __ring_m24._0;
      __ring_match25: {
        const __ring_m25 = _Map_get(ctx.fn_evidence_params, mangled);
        if (__ring_m25._tag === "some") {
          const ev_params = __ring_m25._0;
          const __ring_iter_3 = __List_Iterable.iter(ev_params);
          while (true) {
            const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
            if (__ring_next_3._tag === "none") break;
            const ep = __ring_next_3._0;
            List_push(arg_vals, LLVMConstPointerNull(ctx.ptr_type));
          }
          break __ring_match25;
        }
        if (__ring_m25._tag === "none") {
          break __ring_match25;
        }
        __match_fail(__ring_m25);
      }
      const fn_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, mangled);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return panic(`LLVM codegen: fn type not found for ${mangled}`); }
  __match_fail(__ring_m);
})();
      return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, arg_vals, codegen_llvm_ctx$fresh_name(ctx, "call"));
      break __ring_match24;
    }
    if (__ring_m24._tag === "none") {
      return panic(`LLVM codegen: undefined function '${name}' (mangled: ${mangled})`);
      break __ring_match24;
    }
    __match_fail(__ring_m24);
  }
}

function gen_runtime_call(ctx, name, args) {
  __ring_match26: {
    const __ring_m26 = _Map_get(ctx.rt_fns, name);
    if (__ring_m26._tag === "some") {
      const fn_val = __ring_m26._0;
      const fn_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, name);
      if (is_void_runtime_fn(name)) {
        LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, "");
        return LLVMConstPointerNull(ctx.ptr_type);
      } else {
        return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, codegen_llvm_ctx$fresh_name(ctx, "rt"));
      }
      break __ring_match26;
    }
    if (__ring_m26._tag === "none") {
      return panic(`LLVM codegen: unknown runtime function '${name}'`);
      break __ring_match26;
    }
    __match_fail(__ring_m26);
  }
}

function is_void_runtime_fn(name) {
  if ((name === "ring_print")) {
    return true;
  } else {
    if ((name === "ring_eprintln")) {
      return true;
    } else {
      if ((name === "ring_panic")) {
        return true;
      } else {
        if ((name === "ring_exit")) {
          return true;
        } else {
          if ((name === "ring_sb_add")) {
            return true;
          } else {
            if ((name === "ring_list_push")) {
              return true;
            } else {
              return false;
            }
          }
        }
      }
    }
  }
}

function extern_fn_to_runtime(name) {
  if ((name === "print")) {
    return Option_some("ring_print");
  } else {
    if ((name === "panic")) {
      return Option_some("ring_panic");
    } else {
      if ((name === "eprintln")) {
        return Option_some("ring_eprintln");
      } else {
        if (((name === "exit") || (name === "exit_process"))) {
          return Option_some("ring_exit");
        } else {
          if ((name === "argv")) {
            return Option_some("ring_args");
          } else {
            if ((name === "string_builder")) {
              return Option_some("ring_sb_new");
            } else {
              if ((name === "map_new")) {
                return Option_some("ring_map_new");
              } else {
                if ((name === "set_new")) {
                  return Option_some("ring_set_new");
                } else {
                  return Option_none;
                }
              }
            }
          }
        }
      }
    }
  }
}

function gen_method_call(ctx, recv, recv_type, method, args) {
  const type_name = (function() {
  const __ring_m = types$type_to_builtin_name(recv_type);
  if (__ring_m._tag === "some") { const n = __ring_m._0; return n; }
  if (__ring_m._tag === "none") { return (function() {
  const __ring_m = recv_type;
  if (__ring_m._tag === "StructType") { const name = __ring_m.name; return name; }
  if (__ring_m._tag === "EnumType") { const name = __ring_m.name; return name; }
  return "Unknown";
})(); }
  __match_fail(__ring_m);
})();
  let call_args = [recv];
  const __ring_iter_4 = __List_Iterable.iter(args);
  while (true) {
    const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
    if (__ring_next_4._tag === "none") break;
    const a = __ring_next_4._0;
    List_push(call_args, a);
  }
  if (((type_name === "Str") && (method === "len"))) {
    const len_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_len", [ctx.ptr_type], ctx.i64_type);
    const len_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_len");
    const raw_len = LLVMBuildCall2(ctx.builder, len_ty, len_fn, [recv], codegen_llvm_ctx$fresh_name(ctx, "len"));
    return box_int(ctx, raw_len);
  }
  const rt_method = method_to_runtime(type_name, method);
  __ring_match27: {
    const __ring_m27 = rt_method;
    if (__ring_m27._tag === "some") {
      const rt_name = __ring_m27._0;
      const fn_val = ensure_runtime_method(ctx, rt_name, List_len(call_args));
      const fn_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, rt_name);
      if (is_void_runtime_fn(rt_name)) {
        LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, "");
        return LLVMConstPointerNull(ctx.ptr_type);
      } else {
        return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, codegen_llvm_ctx$fresh_name(ctx, "mc"));
      }
      break __ring_match27;
    }
    if (__ring_m27._tag === "none") {
      const mangled = codegen_llvm_ctx$llvm_mangle_method(type_name, method);
      __ring_match28: {
        const __ring_m28 = _Map_get(ctx.functions, mangled);
        if (__ring_m28._tag === "some") {
          const fn_val = __ring_m28._0;
          __ring_match29: {
            const __ring_m29 = _Map_get(ctx.fn_evidence_params, mangled);
            if (__ring_m29._tag === "some") {
              const ev_params = __ring_m29._0;
              const __ring_iter_5 = __List_Iterable.iter(ev_params);
              while (true) {
                const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
                if (__ring_next_5._tag === "none") break;
                const ep = __ring_next_5._0;
                List_push(call_args, LLVMConstPointerNull(ctx.ptr_type));
              }
              break __ring_match29;
            }
            if (__ring_m29._tag === "none") {
              break __ring_match29;
            }
            __match_fail(__ring_m29);
          }
          const fn_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, mangled);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return panic(`LLVM codegen: fn type not found for method ${mangled}`); }
  __match_fail(__ring_m);
})();
          return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, codegen_llvm_ctx$fresh_name(ctx, "mc"));
          break __ring_match28;
        }
        if (__ring_m28._tag === "none") {
          return LLVMConstPointerNull(ctx.ptr_type);
          break __ring_match28;
        }
        __match_fail(__ring_m28);
      }
      break __ring_match27;
    }
    __match_fail(__ring_m27);
  }
}

function method_to_runtime(type_name, method) {
  if (((type_name === "Str") && (method === "contains"))) {
    return Option_some("ring_str_contains");
  } else {
    if (((type_name === "Str") && (method === "starts_with"))) {
      return Option_some("ring_str_starts_with");
    } else {
      if (((type_name === "Str") && (method === "ends_with"))) {
        return Option_some("ring_str_ends_with");
      } else {
        if (((type_name === "Str") && (method === "slice"))) {
          return Option_some("ring_str_slice");
        } else {
          if (((type_name === "Str") && (method === "split"))) {
            return Option_some("ring_str_split");
          } else {
            if (((type_name === "Str") && (method === "replace"))) {
              return Option_some("ring_str_replace");
            } else {
              if (((type_name === "Int") && (method === "to_str"))) {
                return Option_some("ring_int_to_str");
              } else {
                if (((type_name === "Float") && (method === "to_str"))) {
                  return Option_some("ring_float_to_str");
                } else {
                  if (((type_name === "StringBuilder") && (method === "add"))) {
                    return Option_some("ring_sb_add");
                  } else {
                    if (((type_name === "StringBuilder") && (method === "to_str"))) {
                      return Option_some("ring_sb_to_str");
                    } else {
                      if (((type_name === "List") && (method === "push"))) {
                        return Option_some("ring_list_push");
                      } else {
                        if (((type_name === "List") && (method === "len"))) {
                          return Option_some("ring_list_len");
                        } else {
                          if (((type_name === "List") && (method === "get"))) {
                            return Option_some("ring_list_get");
                          } else {
                            if (((type_name === "List") && (method === "join"))) {
                              return Option_some("ring_list_join");
                            } else {
                              return Option_none;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function ensure_runtime_method(ctx, name, arg_count) {
  __ring_match30: {
    const __ring_m30 = _Map_get(ctx.rt_fns, name);
    if (__ring_m30._tag === "some") {
      const f = __ring_m30._0;
      return f;
      break __ring_match30;
    }
    if (__ring_m30._tag === "none") {
      const ptr = ctx.ptr_type;
      let param_types = [];
      const __ring_end6 = arg_count;
      for (let i = 0; i < __ring_end6; i++) {
        List_push(param_types, ptr);
      }
      if (is_void_runtime_fn(name)) {
        return codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, name, param_types, ctx.void_type);
      } else {
        return codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, name, param_types, ptr);
      }
      break __ring_match30;
    }
    __match_fail(__ring_m30);
  }
}

function gen_field_access(ctx, receiver, field, ty) {
  const recv_val = gen_llvm_expr(ctx, receiver);
  const recv_type = hir$hexpr_type(receiver);
  const type_name = (function() {
  const __ring_m = recv_type;
  if (__ring_m._tag === "StructType") { const name = __ring_m.name; return name; }
  return panic("LLVM codegen: field access on non-struct type");
})();
  __ring_match31: {
    const __ring_m31 = _Map_get(ctx.struct_types, type_name);
    if (__ring_m31._tag === "some") {
      const info = __ring_m31._0;
      let field_idx = (-1);
      const __ring_end7 = List_len(info.field_names);
      for (let i = 0; i < __ring_end7; i++) {
        if ((__ring_index(info.field_names, i) === field)) {
          field_idx = i;
        }
      }
      if ((field_idx < 0)) {
        panic(`LLVM codegen: field '${field}' not found in struct '${type_name}'`);
      }
      const field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, recv_val, field_idx, codegen_llvm_ctx$fresh_name(ctx, "fp"));
      return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, field));
      break __ring_match31;
    }
    if (__ring_m31._tag === "none") {
      return panic(`LLVM codegen: struct type '${type_name}' not registered`);
      break __ring_match31;
    }
    __match_fail(__ring_m31);
  }
}

function gen_struct_lit(ctx, name, fields) {
  __ring_match32: {
    const __ring_m32 = _Map_get(ctx.struct_types, name);
    if (__ring_m32._tag === "some") {
      const info = __ring_m32._0;
      const size = LLVMSizeOf(info.llvm_type);
      const malloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "malloc", [ctx.i64_type], ctx.ptr_type);
      const malloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "malloc");
      const struct_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [size], codegen_llvm_ctx$fresh_name(ctx, "s"));
      const __ring_iter_8 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
        if (__ring_next_8._tag === "none") break;
        const f = __ring_next_8._0;
        const val = gen_llvm_expr(ctx, f.value);
        let field_idx = (-1);
        const __ring_end9 = List_len(info.field_names);
        for (let i = 0; i < __ring_end9; i++) {
          if ((__ring_index(info.field_names, i) === f.name)) {
            field_idx = i;
          }
        }
        if ((field_idx < 0)) {
          panic(`LLVM codegen: field '${f.name}' not found in struct '${name}'`);
        }
        const field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, struct_ptr, field_idx, codegen_llvm_ctx$fresh_name(ctx, "fp"));
        LLVMBuildStore(ctx.builder, val, field_ptr);
      }
      return struct_ptr;
      break __ring_match32;
    }
    if (__ring_m32._tag === "none") {
      return panic(`LLVM codegen: struct type '${name}' not registered for literal`);
      break __ring_match32;
    }
    __match_fail(__ring_m32);
  }
}

function gen_block(ctx, stmts, tail) {
  const __ring_iter_10 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
    if (__ring_next_10._tag === "none") break;
    const stmt = __ring_next_10._0;
    codegen_llvm_stmt$emit_llvm_stmt(ctx, stmt);
  }
  __ring_match33: {
    const __ring_m33 = tail;
    if (__ring_m33._tag === "some") {
      const t = __ring_m33._0;
      return gen_llvm_expr(ctx, t);
      break __ring_match33;
    }
    if (__ring_m33._tag === "none") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match33;
    }
    __match_fail(__ring_m33);
  }
}

function gen_if_expr(ctx, condition, then_branch, else_branch) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: if expr outside function"); }
  __match_fail(__ring_m);
})();
  const cond_val = gen_llvm_expr(ctx, condition);
  const cond_i1 = unbox_to_i1(ctx, cond_val);
  const then_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "if.then");
  const else_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "if.else");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "if.merge");
  LLVMBuildCondBr(ctx.builder, cond_i1, then_bb, else_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, then_bb);
  const then_val = gen_llvm_expr(ctx, then_branch);
  const then_end_bb = LLVMGetInsertBlock(ctx.builder);
  LLVMBuildBr(ctx.builder, merge_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, else_bb);
  const else_val = (function() {
  const __ring_m = else_branch;
  if (__ring_m._tag === "some") { const eb = __ring_m._0; return gen_llvm_expr(ctx, eb); }
  if (__ring_m._tag === "none") { return LLVMConstPointerNull(ctx.ptr_type); }
  __match_fail(__ring_m);
})();
  const else_end_bb = LLVMGetInsertBlock(ctx.builder);
  LLVMBuildBr(ctx.builder, merge_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "if"));
  LLVMAddIncoming(phi, [then_val, else_val], [then_end_bb, else_end_bb]);
  return phi;
}

function gen_string_interp(ctx, parts) {
  const sb_new_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ctx.ptr_type);
  const sb_new_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_new");
  const sb = LLVMBuildCall2(ctx.builder, sb_new_ty, sb_new_fn, [], codegen_llvm_ctx$fresh_name(ctx, "sb"));
  const sb_add_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_add", [ctx.ptr_type, ctx.ptr_type], ctx.void_type);
  const sb_add_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_add");
  const __ring_iter_11 = __List_Iterable.iter(parts);
  while (true) {
    const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
    if (__ring_next_11._tag === "none") break;
    const part = __ring_next_11._0;
    __ring_match34: {
      const __ring_m34 = part;
      if (__ring_m34._tag === "Literal") {
        const s = __ring_m34._0;
        const str_val = gen_str_lit(ctx, s);
        LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], "");
        break __ring_match34;
      }
      if (__ring_m34._tag === "Expression") {
        const e = __ring_m34._0;
        const val = gen_llvm_expr(ctx, e);
        const expr_type = hir$hexpr_type(e);
        const str_val = convert_to_str(ctx, val, expr_type);
        LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], "");
        break __ring_match34;
      }
      __match_fail(__ring_m34);
    }
  }
  const sb_to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type);
  const sb_to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_to_str");
  return LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], codegen_llvm_ctx$fresh_name(ctx, "interp"));
}

function convert_to_str(ctx, val, ty) {
  if (is_str_type(ty)) {
    return val;
  } else {
    if (is_int_type(ty)) {
      const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.ptr_type], ctx.ptr_type);
      const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_int_to_str");
      return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "its"));
    } else {
      if (is_float_type(ty)) {
        const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_float_to_str", [ctx.ptr_type], ctx.ptr_type);
        const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_float_to_str");
        return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "fts"));
      } else {
        if (is_bool_type(ty)) {
          const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_bool_to_str", [ctx.ptr_type], ctx.ptr_type);
          const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_bool_to_str");
          return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "bts"));
        } else {
          const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.ptr_type], ctx.ptr_type);
          const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_int_to_str");
          return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "ts"));
        }
      }
    }
  }
}

function box_int(ctx, raw) {
  const box_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_int", [ctx.i64_type], ctx.ptr_type);
  const box_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_box_int");
  return LLVMBuildCall2(ctx.builder, box_ty, box_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "bi"));
}

function box_float(ctx, raw) {
  const box_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_float", [ctx.double_type], ctx.ptr_type);
  const box_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_box_float");
  return LLVMBuildCall2(ctx.builder, box_ty, box_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "bf"));
}

function box_bool(ctx, raw) {
  const box_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_bool", [ctx.i64_type], ctx.ptr_type);
  const box_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_box_bool");
  return LLVMBuildCall2(ctx.builder, box_ty, box_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "bb"));
}

function unbox_to_i1(ctx, val) {
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_bool");
  const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "ub"));
  return LLVMBuildTrunc(ctx.builder, raw, ctx.i1_type, codegen_llvm_ctx$fresh_name(ctx, "i1"));
}

function __StringBuilder_Eq_eq(self, other) {
  return true;
}
const __StringBuilder_Eq = { eq: __StringBuilder_Eq_eq, ne: function(self, other) { return !__StringBuilder_Eq_eq(self, other); } };

function __LLVMContextRef_Eq_eq(self, other) {
  return true;
}
const __LLVMContextRef_Eq = { eq: __LLVMContextRef_Eq_eq, ne: function(self, other) { return !__LLVMContextRef_Eq_eq(self, other); } };

function __LLVMModuleRef_Eq_eq(self, other) {
  return true;
}
const __LLVMModuleRef_Eq = { eq: __LLVMModuleRef_Eq_eq, ne: function(self, other) { return !__LLVMModuleRef_Eq_eq(self, other); } };

function __LLVMBuilderRef_Eq_eq(self, other) {
  return true;
}
const __LLVMBuilderRef_Eq = { eq: __LLVMBuilderRef_Eq_eq, ne: function(self, other) { return !__LLVMBuilderRef_Eq_eq(self, other); } };

function __LLVMTypeRef_Eq_eq(self, other) {
  return true;
}
const __LLVMTypeRef_Eq = { eq: __LLVMTypeRef_Eq_eq, ne: function(self, other) { return !__LLVMTypeRef_Eq_eq(self, other); } };

function __LLVMValueRef_Eq_eq(self, other) {
  return true;
}
const __LLVMValueRef_Eq = { eq: __LLVMValueRef_Eq_eq, ne: function(self, other) { return !__LLVMValueRef_Eq_eq(self, other); } };

function __LLVMBasicBlockRef_Eq_eq(self, other) {
  return true;
}
const __LLVMBasicBlockRef_Eq = { eq: __LLVMBasicBlockRef_Eq_eq, ne: function(self, other) { return !__LLVMBasicBlockRef_Eq_eq(self, other); } };

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

function __StringBuilder_Clone_clone(self) {
  return new StringBuilder();
}
const __StringBuilder_Clone = { clone: __StringBuilder_Clone_clone };

function __LLVMContextRef_Clone_clone(self) {
  return new LLVMContextRef();
}
const __LLVMContextRef_Clone = { clone: __LLVMContextRef_Clone_clone };

function __LLVMModuleRef_Clone_clone(self) {
  return new LLVMModuleRef();
}
const __LLVMModuleRef_Clone = { clone: __LLVMModuleRef_Clone_clone };

function __LLVMBuilderRef_Clone_clone(self) {
  return new LLVMBuilderRef();
}
const __LLVMBuilderRef_Clone = { clone: __LLVMBuilderRef_Clone_clone };

function __LLVMTypeRef_Clone_clone(self) {
  return new LLVMTypeRef();
}
const __LLVMTypeRef_Clone = { clone: __LLVMTypeRef_Clone_clone };

function __LLVMValueRef_Clone_clone(self) {
  return new LLVMValueRef();
}
const __LLVMValueRef_Clone = { clone: __LLVMValueRef_Clone_clone };

function __LLVMBasicBlockRef_Clone_clone(self) {
  return new LLVMBasicBlockRef();
}
const __LLVMBasicBlockRef_Clone = { clone: __LLVMBasicBlockRef_Clone_clone };

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

function __LLVMContextRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMContextRef_Ord = { cmp: __LLVMContextRef_Ord_cmp };

function __LLVMModuleRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMModuleRef_Ord = { cmp: __LLVMModuleRef_Ord_cmp };

function __LLVMBuilderRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMBuilderRef_Ord = { cmp: __LLVMBuilderRef_Ord_cmp };

function __LLVMTypeRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMTypeRef_Ord = { cmp: __LLVMTypeRef_Ord_cmp };

function __LLVMValueRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMValueRef_Ord = { cmp: __LLVMValueRef_Ord_cmp };

function __LLVMBasicBlockRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMBasicBlockRef_Ord = { cmp: __LLVMBasicBlockRef_Ord_cmp };

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

function __StringBuilder_Debug_debug(self) {
  return "StringBuilder";
}
const __StringBuilder_Debug = { debug: __StringBuilder_Debug_debug };

function __LLVMContextRef_Debug_debug(self) {
  return "LLVMContextRef";
}
const __LLVMContextRef_Debug = { debug: __LLVMContextRef_Debug_debug };

function __LLVMModuleRef_Debug_debug(self) {
  return "LLVMModuleRef";
}
const __LLVMModuleRef_Debug = { debug: __LLVMModuleRef_Debug_debug };

function __LLVMBuilderRef_Debug_debug(self) {
  return "LLVMBuilderRef";
}
const __LLVMBuilderRef_Debug = { debug: __LLVMBuilderRef_Debug_debug };

function __LLVMTypeRef_Debug_debug(self) {
  return "LLVMTypeRef";
}
const __LLVMTypeRef_Debug = { debug: __LLVMTypeRef_Debug_debug };

function __LLVMValueRef_Debug_debug(self) {
  return "LLVMValueRef";
}
const __LLVMValueRef_Debug = { debug: __LLVMValueRef_Debug_debug };

function __LLVMBasicBlockRef_Debug_debug(self) {
  return "LLVMBasicBlockRef";
}
const __LLVMBasicBlockRef_Debug = { debug: __LLVMBasicBlockRef_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { gen_llvm_expr, box_int, box_float, box_bool, unbox_to_i1 };