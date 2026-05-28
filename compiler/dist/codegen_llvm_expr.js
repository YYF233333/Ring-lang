import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { llvm_mangle_fn as codegen_llvm_ctx$llvm_mangle_fn, llvm_mangle_fn_with_prefix as codegen_llvm_ctx$llvm_mangle_fn_with_prefix, llvm_mangle_method as codegen_llvm_ctx$llvm_mangle_method, llvm_resolve_fn as codegen_llvm_ctx$llvm_resolve_fn, llvm_resolve_method as codegen_llvm_ctx$llvm_resolve_method, fresh_name as codegen_llvm_ctx$fresh_name, get_or_declare_runtime_fn as codegen_llvm_ctx$get_or_declare_runtime_fn, get_rt_fn_type as codegen_llvm_ctx$get_rt_fn_type, StructFieldInfo as codegen_llvm_ctx$StructFieldInfo, EnumVariantInfo as codegen_llvm_ctx$EnumVariantInfo, EnumTypeInfo as codegen_llvm_ctx$EnumTypeInfo, LlvmCtx as codegen_llvm_ctx$LlvmCtx, __EnumVariantInfo_Eq as codegen_llvm_ctx$__EnumVariantInfo_Eq, __EnumVariantInfo_Clone as codegen_llvm_ctx$__EnumVariantInfo_Clone, __EnumVariantInfo_Ord as codegen_llvm_ctx$__EnumVariantInfo_Ord, __EnumVariantInfo_Debug as codegen_llvm_ctx$__EnumVariantInfo_Debug, __StructFieldInfo_Clone as codegen_llvm_ctx$__StructFieldInfo_Clone, __StructFieldInfo_Debug as codegen_llvm_ctx$__StructFieldInfo_Debug, __EnumTypeInfo_Clone as codegen_llvm_ctx$__EnumTypeInfo_Clone, __EnumTypeInfo_Debug as codegen_llvm_ctx$__EnumTypeInfo_Debug } from "./codegen_llvm_ctx.js";
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
      const callee = __ring_m6.callee; const args = __ring_m6.args; const resolved_dicts = __ring_m6.resolved_dicts; const dict_dispatch = __ring_m6.dict_dispatch; const ty = __ring_m6.ty; const effects = __ring_m6.effects;
      return gen_call(ctx, callee, args, resolved_dicts, dict_dispatch, ty, effects);
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
      const params = __ring_m6.params; const return_type = __ring_m6.return_type; const body = __ring_m6.body; const ty = __ring_m6.ty;
      return gen_lambda(ctx, params, return_type, body, ty);
      break __ring_match6;
    }
    if (__ring_m6._tag === "MatchExpr") {
      const scrutinee = __ring_m6.scrutinee; const arms = __ring_m6.arms; const ty = __ring_m6.ty;
      return gen_match_expr(ctx, scrutinee, arms, ty);
      break __ring_match6;
    }
    if (__ring_m6._tag === "NamedVariantConstruct") {
      const enum_name = __ring_m6.enum_name; const variant_name = __ring_m6.variant_name; const fields = __ring_m6.fields;
      return gen_named_variant_construct(ctx, enum_name, variant_name, fields);
      break __ring_match6;
    }
    if (__ring_m6._tag === "TryCatch") {
      const body = __ring_m6.body; const arms = __ring_m6.arms;
      return gen_try_catch(ctx, body, arms);
      break __ring_match6;
    }
    if (__ring_m6._tag === "HandleExpr") {
      const body = __ring_m6.body; const handlers = __ring_m6.handlers;
      return gen_handle_expr(ctx, body, handlers);
      break __ring_match6;
    }
    if (__ring_m6._tag === "EffectOp") {
      const effect_name = __ring_m6.effect_name; const op_name = __ring_m6.op_name; const args = __ring_m6.args;
      return gen_effect_op(ctx, effect_name, op_name, args);
      break __ring_match6;
    }
    if (__ring_m6._tag === "RangeExpr") {
      const start = __ring_m6.start; const end = __ring_m6.end; const inclusive = __ring_m6.inclusive;
      return gen_range_expr(ctx, start, end, inclusive);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ListLit") {
      const elements = __ring_m6.elements;
      return gen_list_lit(ctx, elements);
      break __ring_match6;
    }
    if (__ring_m6._tag === "TupleLit") {
      const elements = __ring_m6.elements;
      return gen_tuple_lit(ctx, elements);
      break __ring_match6;
    }
    if (__ring_m6._tag === "IndexExpr") {
      const receiver = __ring_m6.receiver; const index = __ring_m6.index; const ty = __ring_m6.ty;
      return gen_index_expr(ctx, receiver, index, ty);
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
          const mangled_resolved = codegen_llvm_ctx$llvm_resolve_fn(ctx, lookup_name);
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
                  const mangled_name_resolved = codegen_llvm_ctx$llvm_resolve_fn(ctx, name);
                  __ring_match11: {
                    const __ring_m11 = _Map_get(ctx.functions, mangled_name_resolved);
                    if (__ring_m11._tag === "some") {
                      const fn_val = __ring_m11._0;
                      return call_zero_arg_or_return(ctx, fn_val, mangled_name_resolved);
                      break __ring_match11;
                    }
                    if (__ring_m11._tag === "none") {
                      const mangled_lu = codegen_llvm_ctx$llvm_mangle_fn(lookup_name);
                      __ring_match12: {
                        const __ring_m12 = _Map_get(ctx.functions, mangled_lu);
                        if (__ring_m12._tag === "some") {
                          const fn_val = __ring_m12._0;
                          return call_zero_arg_or_return(ctx, fn_val, mangled_lu);
                          break __ring_match12;
                        }
                        if (__ring_m12._tag === "none") {
                          const suffix = `$$_${name}`;
                          const found = find_fn_by_suffix(ctx, suffix);
                          __ring_match13: {
                            const __ring_m13 = found;
                            if (__ring_m13._tag === "some") {
                              const fi = __ring_m13._0;
                              return call_zero_arg_or_return(ctx, fi.fn_val, fi.fn_mangled);
                              break __ring_match13;
                            }
                            if (__ring_m13._tag === "none") {
                              const suffix2 = `$$_${lookup_name}`;
                              const found2 = find_fn_by_suffix(ctx, suffix2);
                              __ring_match14: {
                                const __ring_m14 = found2;
                                if (__ring_m14._tag === "some") {
                                  const fi2 = __ring_m14._0;
                                  return call_zero_arg_or_return(ctx, fi2.fn_val, fi2.fn_mangled);
                                  break __ring_match14;
                                }
                                if (__ring_m14._tag === "none") {
                                  return panic(`LLVM codegen: undefined variable '${name}' (resolved: '${lookup_name}')`);
                                  break __ring_match14;
                                }
                                __match_fail(__ring_m14);
                              }
                              break __ring_match13;
                            }
                            __match_fail(__ring_m13);
                          }
                          break __ring_match12;
                        }
                        __match_fail(__ring_m12);
                      }
                      break __ring_match11;
                    }
                    __match_fail(__ring_m11);
                  }
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
  __ring_match15: {
    const __ring_m15 = _Map_get(ctx.fn_types, mangled);
    if (__ring_m15._tag === "some") {
      const fn_ty = __ring_m15._0;
      const param_count = LLVMCountParams(fn_val);
      if ((param_count === 0)) {
        return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, [], codegen_llvm_ctx$fresh_name(ctx, "ctor"));
      } else {
        return fn_val;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "none") {
      return fn_val;
      break __ring_match15;
    }
    __match_fail(__ring_m15);
  }
}

function is_int_type(ty) {
  __ring_match16: {
    const __ring_m16 = ty;
    if (__ring_m16._tag === "IntType") {
      return true;
      break __ring_match16;
    }
    return false;
    break __ring_match16;
  }
}

function is_float_type(ty) {
  __ring_match17: {
    const __ring_m17 = ty;
    if (__ring_m17._tag === "FloatType") {
      return true;
      break __ring_match17;
    }
    return false;
    break __ring_match17;
  }
}

function is_str_type(ty) {
  __ring_match18: {
    const __ring_m18 = ty;
    if (__ring_m18._tag === "StrType") {
      return true;
      break __ring_match18;
    }
    return false;
    break __ring_match18;
  }
}

function is_bool_type(ty) {
  __ring_match19: {
    const __ring_m19 = ty;
    if (__ring_m19._tag === "BoolType") {
      return true;
      break __ring_match19;
    }
    return false;
    break __ring_match19;
  }
}

function operand_type_from_binop(left) {
  return hir$hexpr_type(left);
}

function gen_binop(ctx, op, left, right, result_ty) {
  const op_type = operand_type_from_binop(left);
  __ring_match20: {
    const __ring_m20 = op;
    if (__ring_m20._tag === "And") {
      return gen_and(ctx, left, right);
      break __ring_match20;
    }
    if (__ring_m20._tag === "Or") {
      return gen_or(ctx, left, right);
      break __ring_match20;
    }
    break __ring_match20;
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
  __ring_match21: {
    const __ring_m21 = op;
    if (__ring_m21._tag === "Add") {
      const result = LLVMBuildAdd(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "add"));
      return box_int(ctx, result);
      break __ring_match21;
    }
    if (__ring_m21._tag === "Sub") {
      const result = LLVMBuildSub(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "sub"));
      return box_int(ctx, result);
      break __ring_match21;
    }
    if (__ring_m21._tag === "Mul") {
      const result = LLVMBuildMul(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "mul"));
      return box_int(ctx, result);
      break __ring_match21;
    }
    if (__ring_m21._tag === "Div") {
      const result = LLVMBuildSDiv(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "div"));
      return box_int(ctx, result);
      break __ring_match21;
    }
    if (__ring_m21._tag === "Mod") {
      const result = LLVMBuildSRem(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "mod"));
      return box_int(ctx, result);
      break __ring_match21;
    }
    if (__ring_m21._tag === "Eq") {
      const cmp = LLVMBuildICmp(ctx.builder, 32, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "eq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match21;
    }
    if (__ring_m21._tag === "Neq") {
      const cmp = LLVMBuildICmp(ctx.builder, 33, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "ne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match21;
    }
    if (__ring_m21._tag === "Lt") {
      const cmp = LLVMBuildICmp(ctx.builder, 40, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "lt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match21;
    }
    if (__ring_m21._tag === "Lte") {
      const cmp = LLVMBuildICmp(ctx.builder, 41, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "le"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match21;
    }
    if (__ring_m21._tag === "Gt") {
      const cmp = LLVMBuildICmp(ctx.builder, 38, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "gt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match21;
    }
    if (__ring_m21._tag === "Gte") {
      const cmp = LLVMBuildICmp(ctx.builder, 39, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "ge"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match21;
    }
    if (__ring_m21._tag === "And") {
      return panic("LLVM codegen: And should be handled by short-circuit");
      break __ring_match21;
    }
    if (__ring_m21._tag === "Or") {
      return panic("LLVM codegen: Or should be handled by short-circuit");
      break __ring_match21;
    }
    __match_fail(__ring_m21);
  }
}

function gen_float_binop(ctx, op, lhs, rhs) {
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
  const lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], codegen_llvm_ctx$fresh_name(ctx, "l"));
  const rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], codegen_llvm_ctx$fresh_name(ctx, "r"));
  __ring_match22: {
    const __ring_m22 = op;
    if (__ring_m22._tag === "Add") {
      const result = LLVMBuildFAdd(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fadd"));
      return box_float(ctx, result);
      break __ring_match22;
    }
    if (__ring_m22._tag === "Sub") {
      const result = LLVMBuildFSub(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fsub"));
      return box_float(ctx, result);
      break __ring_match22;
    }
    if (__ring_m22._tag === "Mul") {
      const result = LLVMBuildFMul(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fmul"));
      return box_float(ctx, result);
      break __ring_match22;
    }
    if (__ring_m22._tag === "Div") {
      const result = LLVMBuildFDiv(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fdiv"));
      return box_float(ctx, result);
      break __ring_match22;
    }
    if (__ring_m22._tag === "Eq") {
      const cmp = LLVMBuildFCmp(ctx.builder, 1, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "feq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match22;
    }
    if (__ring_m22._tag === "Neq") {
      const cmp = LLVMBuildFCmp(ctx.builder, 6, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match22;
    }
    if (__ring_m22._tag === "Lt") {
      const cmp = LLVMBuildFCmp(ctx.builder, 4, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "flt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match22;
    }
    if (__ring_m22._tag === "Lte") {
      const cmp = LLVMBuildFCmp(ctx.builder, 5, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fle"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match22;
    }
    if (__ring_m22._tag === "Gt") {
      const cmp = LLVMBuildFCmp(ctx.builder, 2, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fgt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match22;
    }
    if (__ring_m22._tag === "Gte") {
      const cmp = LLVMBuildFCmp(ctx.builder, 3, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fge"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match22;
    }
    return panic("LLVM codegen: unsupported float binop");
    break __ring_match22;
  }
}

function gen_str_binop(ctx, op, lhs, rhs) {
  __ring_match23: {
    const __ring_m23 = op;
    if (__ring_m23._tag === "Eq") {
      const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
      const result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "seq"));
      return box_bool(ctx, result);
      break __ring_match23;
    }
    if (__ring_m23._tag === "Neq") {
      const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
      const result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "seq"));
      const one = LLVMConstInt(ctx.i64_type, 1, 0);
      const neg = LLVMBuildSub(ctx.builder, one, result, codegen_llvm_ctx$fresh_name(ctx, "neg"));
      return box_bool(ctx, neg);
      break __ring_match23;
    }
    if (__ring_m23._tag === "Lt") {
      const lt_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_lt", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const lt_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_lt");
      const result = LLVMBuildCall2(ctx.builder, lt_ty, lt_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "slt"));
      return box_bool(ctx, result);
      break __ring_match23;
    }
    return panic("LLVM codegen: unsupported str binop");
    break __ring_match23;
  }
}

function gen_bool_binop(ctx, op, lhs, rhs) {
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_bool");
  const lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], codegen_llvm_ctx$fresh_name(ctx, "lb"));
  const rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], codegen_llvm_ctx$fresh_name(ctx, "rb"));
  __ring_match24: {
    const __ring_m24 = op;
    if (__ring_m24._tag === "Eq") {
      const cmp = LLVMBuildICmp(ctx.builder, 32, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "beq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match24;
    }
    if (__ring_m24._tag === "Neq") {
      const cmp = LLVMBuildICmp(ctx.builder, 33, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "bne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match24;
    }
    return panic("LLVM codegen: unsupported bool binop");
    break __ring_match24;
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
  __ring_match25: {
    const __ring_m25 = op;
    if (__ring_m25._tag === "Neg") {
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
      break __ring_match25;
    }
    if (__ring_m25._tag === "Not") {
      const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type);
      const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_bool");
      const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "un"));
      const one = LLVMConstInt(ctx.i64_type, 1, 0);
      const neg = LLVMBuildSub(ctx.builder, one, raw, codegen_llvm_ctx$fresh_name(ctx, "not"));
      return box_bool(ctx, neg);
      break __ring_match25;
    }
    __match_fail(__ring_m25);
  }
}

function gen_call(ctx, callee, args, resolved_dicts, dict_dispatch, result_ty, effects) {
  __ring_match26: {
    const __ring_m26 = dict_dispatch;
    if (__ring_m26._tag === "some") {
      const dd = __ring_m26._0;
      return gen_dict_dispatch_call(ctx, callee, args, dd);
      break __ring_match26;
    }
    if (__ring_m26._tag === "none") {
      break __ring_match26;
    }
    __match_fail(__ring_m26);
  }
  let arg_vals = [];
  const __ring_iter_2 = __List_Iterable.iter(args);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const a = __ring_next_2._0;
    List_push(arg_vals, gen_llvm_expr(ctx, a));
  }
  const dict_vals = resolve_dict_refs(ctx, resolved_dicts);
  __ring_match27: {
    const __ring_m27 = callee;
    if (__ring_m27._tag === "Ident") {
      const name = __ring_m27.name; const resolved_name = __ring_m27.resolved_name;
      const call_name = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return rn; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
      return gen_direct_call(ctx, call_name, arg_vals, dict_vals);
      break __ring_match27;
    }
    if (__ring_m27._tag === "FieldAccess") {
      const receiver = __ring_m27.receiver; const field = __ring_m27.field;
      const recv_val = gen_llvm_expr(ctx, receiver);
      const recv_type = hir$hexpr_type(receiver);
      return gen_method_call(ctx, recv_val, recv_type, field, arg_vals, dict_vals);
      break __ring_match27;
    }
    const closure_val = gen_llvm_expr(ctx, callee);
    return gen_closure_call(ctx, closure_val, arg_vals);
    break __ring_match27;
  }
}

function resolve_dict_refs(ctx, dicts) {
  let result = [];
  const __ring_iter_3 = __List_Iterable.iter(dicts);
  while (true) {
    const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
    if (__ring_next_3._tag === "none") break;
    const d = __ring_next_3._0;
    List_push(result, resolve_dict_ref(ctx, d));
  }
  return result;
}

function resolve_dict_ref(ctx, dr) {
  __ring_match28: {
    const __ring_m28 = dr;
    if (__ring_m28._tag === "Simple") {
      const name = __ring_m28._0;
      __ring_match29: {
        const __ring_m29 = _Map_get(ctx.named_values, name);
        if (__ring_m29._tag === "some") {
          const alloca = __ring_m29._0;
          return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "dict"));
          break __ring_match29;
        }
        if (__ring_m29._tag === "none") {
          const init_fn_name = `ring_dict_init_${name}`;
          __ring_match30: {
            const __ring_m30 = _Map_get(ctx.functions, init_fn_name);
            if (__ring_m30._tag === "some") {
              const init_fn = __ring_m30._0;
              const init_fn_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, init_fn_name);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return LLVMFunctionType(ctx.ptr_type, [], 0); }
  __match_fail(__ring_m);
})();
              return LLVMBuildCall2(ctx.builder, init_fn_ty, init_fn, [], codegen_llvm_ctx$fresh_name(ctx, "dict"));
              break __ring_match30;
            }
            if (__ring_m30._tag === "none") {
              __ring_match31: {
                const __ring_m31 = _Map_get(ctx.dict_globals, name);
                if (__ring_m31._tag === "some") {
                  const init_fn = __ring_m31._0;
                  const ft = LLVMFunctionType(ctx.ptr_type, [], 0);
                  return LLVMBuildCall2(ctx.builder, ft, init_fn, [], codegen_llvm_ctx$fresh_name(ctx, "dict"));
                  break __ring_match31;
                }
                if (__ring_m31._tag === "none") {
                  return LLVMConstPointerNull(ctx.ptr_type);
                  break __ring_match31;
                }
                __match_fail(__ring_m31);
              }
              break __ring_match30;
            }
            __match_fail(__ring_m30);
          }
          break __ring_match29;
        }
        __match_fail(__ring_m29);
      }
      break __ring_match28;
    }
    if (__ring_m28._tag === "Wrapped") {
      const dict = __ring_m28.dict; const trait_name = __ring_m28.trait_name; const inner_dicts = __ring_m28.inner_dicts;
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match28;
    }
    __match_fail(__ring_m28);
  }
}

function gen_dict_dispatch_call(ctx, callee, args, dd) {
  let recv_val = Option_none;
  let other_arg_start = 0;
  __ring_match32: {
    const __ring_m32 = callee;
    if (__ring_m32._tag === "FieldAccess") {
      const receiver = __ring_m32.receiver;
      recv_val = Option_some(gen_llvm_expr(ctx, receiver));
      break __ring_match32;
    }
    __ring_match33: {
      const __ring_m33 = List_get(args, 0);
      if (__ring_m33._tag === "some") {
        const a = __ring_m33._0;
        recv_val = Option_some(gen_llvm_expr(ctx, a));
        other_arg_start = 1;
        break __ring_match33;
      }
      if (__ring_m33._tag === "none") {
        break __ring_match33;
      }
      __match_fail(__ring_m33);
    }
    break __ring_match32;
  }
  let call_args = [];
  __ring_match34: {
    const __ring_m34 = recv_val;
    if (__ring_m34._tag === "some") {
      const rv = __ring_m34._0;
      List_push(call_args, rv);
      break __ring_match34;
    }
    if (__ring_m34._tag === "none") {
      break __ring_match34;
    }
    __match_fail(__ring_m34);
  }
  const __ring_end4 = List_len(args);
  for (let i = other_arg_start; i < __ring_end4; i++) {
    __ring_match35: {
      const __ring_m35 = List_get(args, i);
      if (__ring_m35._tag === "some") {
        const a = __ring_m35._0;
        List_push(call_args, gen_llvm_expr(ctx, a));
        break __ring_match35;
      }
      if (__ring_m35._tag === "none") {
        break __ring_match35;
      }
      __match_fail(__ring_m35);
    }
  }
  __ring_match36: {
    const __ring_m36 = _Map_get(ctx.named_values, dd.dict_param);
    if (__ring_m36._tag === "some") {
      const dict_alloca = __ring_m36._0;
      const dict_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, dict_alloca, codegen_llvm_ctx$fresh_name(ctx, "dp"));
      const method_idx = get_trait_method_index(dd.dict_param, dd.method);
      const dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0);
      const method_slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, method_idx, codegen_llvm_ctx$fresh_name(ctx, "ms"));
      const closure_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, method_slot_ptr, codegen_llvm_ctx$fresh_name(ctx, "cp"));
      return gen_closure_call(ctx, closure_ptr, call_args);
      break __ring_match36;
    }
    if (__ring_m36._tag === "none") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match36;
    }
    __match_fail(__ring_m36);
  }
}

function get_trait_method_index(dict_param, method) {
  if ((method === "eq")) {
    return 0;
  } else {
    if ((method === "ne")) {
      return 1;
    } else {
      if ((method === "clone")) {
        return 0;
      } else {
        if ((method === "compare")) {
          return 0;
        } else {
          if ((method === "debug")) {
            return 0;
          } else {
            return 0;
          }
        }
      }
    }
  }
}

function gen_closure_call(ctx, closure_ptr, arg_vals) {
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
  const fn_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, fn_ptr_slot, codegen_llvm_ctx$fresh_name(ctx, "fp"));
  const env_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
  const env_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, env_ptr_slot, codegen_llvm_ctx$fresh_name(ctx, "ep"));
  let call_args = [env_ptr];
  const __ring_iter_5 = __List_Iterable.iter(arg_vals);
  while (true) {
    const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
    if (__ring_next_5._tag === "none") break;
    const a = __ring_next_5._0;
    List_push(call_args, a);
  }
  let fn_param_types = [ctx.ptr_type];
  const __ring_iter_6 = __List_Iterable.iter(arg_vals);
  while (true) {
    const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
    if (__ring_next_6._tag === "none") break;
    const a = __ring_next_6._0;
    List_push(fn_param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, fn_param_types, 0);
  return LLVMBuildCall2(ctx.builder, fn_ty, fn_ptr, call_args, codegen_llvm_ctx$fresh_name(ctx, "cc"));
}

function gen_direct_call(ctx, name, arg_vals, dict_vals) {
  const rt_name = extern_fn_to_runtime(name);
  __ring_match37: {
    const __ring_m37 = rt_name;
    if (__ring_m37._tag === "some") {
      const rtn = __ring_m37._0;
      return gen_runtime_call(ctx, rtn, arg_vals);
      break __ring_match37;
    }
    if (__ring_m37._tag === "none") {
      break __ring_match37;
    }
    __match_fail(__ring_m37);
  }
  const mangled = codegen_llvm_ctx$llvm_resolve_fn(ctx, name);
  const found_fn = find_function_in_ctx(ctx, mangled, name);
  __ring_match38: {
    const __ring_m38 = found_fn;
    if (__ring_m38._tag === "some") {
      const fn_info = __ring_m38._0;
      const __ring_iter_7 = __List_Iterable.iter(dict_vals);
      while (true) {
        const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
        if (__ring_next_7._tag === "none") break;
        const dv = __ring_next_7._0;
        List_push(arg_vals, dv);
      }
      __ring_match39: {
        const __ring_m39 = _Map_get(ctx.fn_evidence_params, fn_info.fn_mangled);
        if (__ring_m39._tag === "some") {
          const ev_params = __ring_m39._0;
          const __ring_iter_8 = __List_Iterable.iter(ev_params);
          while (true) {
            const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
            if (__ring_next_8._tag === "none") break;
            const ep = __ring_next_8._0;
            List_push(arg_vals, lookup_evidence(ctx, ep));
          }
          break __ring_match39;
        }
        if (__ring_m39._tag === "none") {
          break __ring_match39;
        }
        __match_fail(__ring_m39);
      }
      const fn_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, fn_info.fn_mangled);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return panic(`LLVM codegen: fn type not found for ${fn_info.fn_mangled}`); }
  __match_fail(__ring_m);
})();
      return LLVMBuildCall2(ctx.builder, fn_ty, fn_info.fn_val, arg_vals, codegen_llvm_ctx$fresh_name(ctx, "call"));
      break __ring_match38;
    }
    if (__ring_m38._tag === "none") {
      __ring_match40: {
        const __ring_m40 = _Map_get(ctx.named_values, name);
        if (__ring_m40._tag === "some") {
          const alloca = __ring_m40._0;
          const closure_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "clos"));
          return gen_closure_call(ctx, closure_ptr, arg_vals);
          break __ring_match40;
        }
        if (__ring_m40._tag === "none") {
          return LLVMConstPointerNull(ctx.ptr_type);
          break __ring_match40;
        }
        __match_fail(__ring_m40);
      }
      break __ring_match38;
    }
    __match_fail(__ring_m38);
  }
}

class FnLookupResult {
  constructor(fn_val, fn_mangled) {
    this.fn_val = fn_val;
    this.fn_mangled = fn_mangled;
  }
}

function find_fn_by_suffix(ctx, suffix) {
  const __ring_iter_9 = __List_Iterable.iter(_Map_entries(ctx.functions));
  while (true) {
    const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
    if (__ring_next_9._tag === "none") break;
    const entry = __ring_next_9._0;
    const __ring_dt0 = entry;
    const fn_name = __ring_dt0[0];
    const fn_val = __ring_dt0[1];
    if (Str_ends_with(fn_name, suffix)) {
      return Option_some(new FnLookupResult(fn_val, fn_name));
    }
  }
  return Option_none;
}

function find_function_in_ctx(ctx, mangled, name) {
  __ring_match41: {
    const __ring_m41 = _Map_get(ctx.functions, mangled);
    if (__ring_m41._tag === "some") {
      const fn_val = __ring_m41._0;
      return Option_some(new FnLookupResult(fn_val, mangled));
      break __ring_match41;
    }
    if (__ring_m41._tag === "none") {
      const bare = codegen_llvm_ctx$llvm_mangle_fn(name);
      __ring_match42: {
        const __ring_m42 = _Map_get(ctx.functions, bare);
        if (__ring_m42._tag === "some") {
          const fn_val = __ring_m42._0;
          return Option_some(new FnLookupResult(fn_val, bare));
          break __ring_match42;
        }
        if (__ring_m42._tag === "none") {
          const suffix = `$$_${name}`;
          return find_fn_by_suffix(ctx, suffix);
          break __ring_match42;
        }
        __match_fail(__ring_m42);
      }
      break __ring_match41;
    }
    __match_fail(__ring_m41);
  }
}

function lookup_evidence(ctx, ev_param_name) {
  __ring_match43: {
    const __ring_m43 = _Map_get(ctx.named_values, ev_param_name);
    if (__ring_m43._tag === "some") {
      const alloca = __ring_m43._0;
      return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "ev"));
      break __ring_match43;
    }
    if (__ring_m43._tag === "none") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match43;
    }
    __match_fail(__ring_m43);
  }
}

function gen_runtime_call(ctx, name, args) {
  __ring_match44: {
    const __ring_m44 = _Map_get(ctx.rt_fns, name);
    if (__ring_m44._tag === "some") {
      const fn_val = __ring_m44._0;
      const fn_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, name);
      if (is_void_runtime_fn(name)) {
        LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, "");
        return LLVMConstPointerNull(ctx.ptr_type);
      } else {
        return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, codegen_llvm_ctx$fresh_name(ctx, "rt"));
      }
      break __ring_match44;
    }
    if (__ring_m44._tag === "none") {
      return panic(`LLVM codegen: unknown runtime function '${name}'`);
      break __ring_match44;
    }
    __match_fail(__ring_m44);
  }
}

function is_void_runtime_fn(name) {
  if ((name === "ring_catch_pop")) {
    return true;
  } else {
    if ((name === "ring_raise")) {
      return true;
    } else {
      return false;
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
                  if ((name === "read_file")) {
                    return Option_some("ring_read_file");
                  } else {
                    if ((name === "write_file")) {
                      return Option_some("ring_write_file");
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

function rt_method_returns_i64(name) {
  if ((name === "ring_str_len")) {
    return true;
  } else {
    if ((name === "ring_str_contains")) {
      return true;
    } else {
      if ((name === "ring_str_starts_with")) {
        return true;
      } else {
        if ((name === "ring_str_ends_with")) {
          return true;
        } else {
          if ((name === "ring_str_eq")) {
            return true;
          } else {
            if ((name === "ring_str_lt")) {
              return true;
            } else {
              if ((name === "ring_list_len")) {
                return true;
              } else {
                if ((name === "ring_list_contains")) {
                  return true;
                } else {
                  if ((name === "ring_list_index_of")) {
                    return true;
                  } else {
                    if ((name === "ring_list_is_empty")) {
                      return true;
                    } else {
                      if ((name === "ring_map_has")) {
                        return true;
                      } else {
                        if ((name === "ring_map_len")) {
                          return true;
                        } else {
                          if ((name === "ring_set_has")) {
                            return true;
                          } else {
                            if ((name === "ring_set_len")) {
                              return true;
                            } else {
                              if ((name === "ring_sb_len")) {
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
                }
              }
            }
          }
        }
      }
    }
  }
}

function rt_method_returns_bool(name) {
  if ((name === "ring_str_contains")) {
    return true;
  } else {
    if ((name === "ring_str_starts_with")) {
      return true;
    } else {
      if ((name === "ring_str_ends_with")) {
        return true;
      } else {
        if ((name === "ring_list_contains")) {
          return true;
        } else {
          if ((name === "ring_list_is_empty")) {
            return true;
          } else {
            if ((name === "ring_map_has")) {
              return true;
            } else {
              if ((name === "ring_set_has")) {
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
}

function rt_method_needs_int_args(name) {
  if ((name === "ring_list_get")) {
    return true;
  } else {
    if ((name === "ring_str_get")) {
      return true;
    } else {
      if ((name === "ring_str_slice")) {
        return true;
      } else {
        if ((name === "ring_list_slice")) {
          return true;
        } else {
          if ((name === "ring_list_set")) {
            return true;
          } else {
            return false;
          }
        }
      }
    }
  }
}

function rt_method_needs_recv_unbox_int(name) {
  if ((name === "ring_int_to_str")) {
    return true;
  } else {
    return false;
  }
}

function rt_method_needs_recv_unbox_float(name) {
  if ((name === "ring_float_to_str")) {
    return true;
  } else {
    return false;
  }
}

function rt_method_needs_recv_unbox_bool(name) {
  if ((name === "ring_bool_to_str")) {
    return true;
  } else {
    return false;
  }
}

function gen_method_call(ctx, recv, recv_type, method, args, dict_vals) {
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
  const rt_method = method_to_runtime(type_name, method);
  __ring_match45: {
    const __ring_m45 = rt_method;
    if (__ring_m45._tag === "some") {
      const rt_name = __ring_m45._0;
      let call_args = [];
      if (rt_method_needs_recv_unbox_int(rt_name)) {
        const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type);
        const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_int");
        const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [recv], codegen_llvm_ctx$fresh_name(ctx, "ui"));
        List_push(call_args, raw);
      } else {
        if (rt_method_needs_recv_unbox_float(rt_name)) {
          const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
          const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
          const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [recv], codegen_llvm_ctx$fresh_name(ctx, "uf"));
          List_push(call_args, raw);
        } else {
          if (rt_method_needs_recv_unbox_bool(rt_name)) {
            const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type);
            const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_bool");
            const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [recv], codegen_llvm_ctx$fresh_name(ctx, "ub"));
            List_push(call_args, raw);
          } else {
            List_push(call_args, recv);
          }
        }
      }
      if (rt_method_needs_int_args(rt_name)) {
        const __ring_iter_10 = __List_Iterable.iter(args);
        while (true) {
          const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
          if (__ring_next_10._tag === "none") break;
          const a = __ring_next_10._0;
          const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type);
          const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_int");
          const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [a], codegen_llvm_ctx$fresh_name(ctx, "ai"));
          List_push(call_args, raw);
        }
      } else {
        const __ring_iter_11 = __List_Iterable.iter(args);
        while (true) {
          const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
          if (__ring_next_11._tag === "none") break;
          const a = __ring_next_11._0;
          List_push(call_args, a);
        }
      }
      const fn_val = ensure_runtime_method(ctx, rt_name, List_len(call_args));
      const fn_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, rt_name);
      if (is_void_runtime_fn(rt_name)) {
        LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, "");
        return LLVMConstPointerNull(ctx.ptr_type);
      } else {
        if (rt_method_returns_bool(rt_name)) {
          const raw = LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, codegen_llvm_ctx$fresh_name(ctx, "rb"));
          return box_bool(ctx, raw);
        } else {
          if (rt_method_returns_i64(rt_name)) {
            const raw = LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, codegen_llvm_ctx$fresh_name(ctx, "ri"));
            return box_int(ctx, raw);
          } else {
            return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, codegen_llvm_ctx$fresh_name(ctx, "mc"));
          }
        }
      }
      break __ring_match45;
    }
    if (__ring_m45._tag === "none") {
      let call_args = [recv];
      const __ring_iter_12 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
        if (__ring_next_12._tag === "none") break;
        const a = __ring_next_12._0;
        List_push(call_args, a);
      }
      const mangled = codegen_llvm_ctx$llvm_mangle_method(type_name, method);
      __ring_match46: {
        const __ring_m46 = _Map_get(ctx.functions, mangled);
        if (__ring_m46._tag === "some") {
          const fn_val = __ring_m46._0;
          const __ring_iter_13 = __List_Iterable.iter(dict_vals);
          while (true) {
            const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
            if (__ring_next_13._tag === "none") break;
            const dv = __ring_next_13._0;
            List_push(call_args, dv);
          }
          __ring_match47: {
            const __ring_m47 = _Map_get(ctx.fn_evidence_params, mangled);
            if (__ring_m47._tag === "some") {
              const ev_params = __ring_m47._0;
              const __ring_iter_14 = __List_Iterable.iter(ev_params);
              while (true) {
                const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
                if (__ring_next_14._tag === "none") break;
                const ep = __ring_next_14._0;
                List_push(call_args, lookup_evidence(ctx, ep));
              }
              break __ring_match47;
            }
            if (__ring_m47._tag === "none") {
              break __ring_match47;
            }
            __match_fail(__ring_m47);
          }
          const fn_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, mangled);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return panic(`LLVM codegen: fn type not found for method ${mangled}`); }
  __match_fail(__ring_m);
})();
          return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, codegen_llvm_ctx$fresh_name(ctx, "mc"));
          break __ring_match46;
        }
        if (__ring_m46._tag === "none") {
          return LLVMConstPointerNull(ctx.ptr_type);
          break __ring_match46;
        }
        __match_fail(__ring_m46);
      }
      break __ring_match45;
    }
    __match_fail(__ring_m45);
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
              if (((type_name === "Str") && (method === "get"))) {
                return Option_some("ring_str_get");
              } else {
                if (((type_name === "Int") && (method === "to_str"))) {
                  return Option_some("ring_int_to_str");
                } else {
                  if (((type_name === "Float") && (method === "to_str"))) {
                    return Option_some("ring_float_to_str");
                  } else {
                    if (((type_name === "Bool") && (method === "to_str"))) {
                      return Option_some("ring_bool_to_str");
                    } else {
                      if (((type_name === "StringBuilder") && (method === "add"))) {
                        return Option_some("ring_sb_add");
                      } else {
                        if (((type_name === "StringBuilder") && (method === "to_str"))) {
                          return Option_some("ring_sb_to_str");
                        } else {
                          if (((type_name === "StringBuilder") && (method === "len"))) {
                            return Option_some("ring_sb_len");
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
                                    if (((type_name === "List") && (method === "concat"))) {
                                      return Option_some("ring_list_concat");
                                    } else {
                                      if (((type_name === "List") && (method === "slice"))) {
                                        return Option_some("ring_list_slice");
                                      } else {
                                        if (((type_name === "List") && (method === "reverse"))) {
                                          return Option_some("ring_list_reverse");
                                        } else {
                                          if (((type_name === "List") && (method === "sort"))) {
                                            return Option_some("ring_list_sort");
                                          } else {
                                            if (((type_name === "List") && (method === "is_empty"))) {
                                              return Option_some("ring_list_is_empty");
                                            } else {
                                              if (((type_name === "List") && (method === "first"))) {
                                                return Option_some("ring_list_first");
                                              } else {
                                                if (((type_name === "List") && (method === "last"))) {
                                                  return Option_some("ring_list_last");
                                                } else {
                                                  if (((type_name === "List") && (method === "pop"))) {
                                                    return Option_some("ring_list_pop");
                                                  } else {
                                                    if (((type_name === "List") && (method === "set"))) {
                                                      return Option_some("ring_list_set");
                                                    } else {
                                                      if (((type_name === "List") && (method === "index_of"))) {
                                                        return Option_some("ring_list_index_of");
                                                      } else {
                                                        if (((type_name === "List") && (method === "contains"))) {
                                                          return Option_some("ring_list_contains");
                                                        } else {
                                                          if (((type_name === "List") && (method === "map"))) {
                                                            return Option_some("ring_list_map");
                                                          } else {
                                                            if (((type_name === "List") && (method === "filter"))) {
                                                              return Option_some("ring_list_filter");
                                                            } else {
                                                              if (((type_name === "List") && (method === "for_each"))) {
                                                                return Option_some("ring_list_for_each");
                                                              } else {
                                                                if (((type_name === "Map") && (method === "get"))) {
                                                                  return Option_some("ring_map_get");
                                                                } else {
                                                                  if (((type_name === "Map") && (method === "insert"))) {
                                                                    return Option_some("ring_map_set");
                                                                  } else {
                                                                    if (((type_name === "Map") && (method === "contains_key"))) {
                                                                      return Option_some("ring_map_has");
                                                                    } else {
                                                                      if (((type_name === "Map") && (method === "keys"))) {
                                                                        return Option_some("ring_map_keys");
                                                                      } else {
                                                                        if (((type_name === "Map") && (method === "values"))) {
                                                                          return Option_some("ring_map_values");
                                                                        } else {
                                                                          if (((type_name === "Map") && (method === "entries"))) {
                                                                            return Option_some("ring_map_entries");
                                                                          } else {
                                                                            if (((type_name === "Map") && (method === "len"))) {
                                                                              return Option_some("ring_map_len");
                                                                            } else {
                                                                              if (((type_name === "Map") && (method === "remove"))) {
                                                                                return Option_some("ring_map_delete");
                                                                              } else {
                                                                                if (((type_name === "Map") && (method === "is_empty"))) {
                                                                                  return Option_some("ring_map_is_empty");
                                                                                } else {
                                                                                  if (((type_name === "Map") && (method === "for_each"))) {
                                                                                    return Option_some("ring_map_for_each");
                                                                                  } else {
                                                                                    if (((type_name === "Set") && (method === "add"))) {
                                                                                      return Option_some("ring_set_add");
                                                                                    } else {
                                                                                      if (((type_name === "Set") && (method === "insert"))) {
                                                                                        return Option_some("ring_set_add");
                                                                                      } else {
                                                                                        if (((type_name === "Set") && (method === "has"))) {
                                                                                          return Option_some("ring_set_has");
                                                                                        } else {
                                                                                          if (((type_name === "Set") && (method === "contains"))) {
                                                                                            return Option_some("ring_set_has");
                                                                                          } else {
                                                                                            if (((type_name === "Set") && (method === "to_list"))) {
                                                                                              return Option_some("ring_set_to_list");
                                                                                            } else {
                                                                                              if (((type_name === "Set") && (method === "len"))) {
                                                                                                return Option_some("ring_set_len");
                                                                                              } else {
                                                                                                if (((type_name === "Set") && (method === "is_empty"))) {
                                                                                                  return Option_some("ring_set_is_empty");
                                                                                                } else {
                                                                                                  if (((type_name === "Set") && (method === "from_list"))) {
                                                                                                    return Option_some("ring_set_from_list");
                                                                                                  } else {
                                                                                                    if (((type_name === "Set") && (method === "for_each"))) {
                                                                                                      return Option_some("ring_set_for_each");
                                                                                                    } else {
                                                                                                      if (((type_name === "Set") && (method === "remove"))) {
                                                                                                        return Option_some("ring_set_delete");
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
            }
          }
        }
      }
    }
  }
}

function ensure_runtime_method(ctx, name, arg_count) {
  __ring_match48: {
    const __ring_m48 = _Map_get(ctx.rt_fns, name);
    if (__ring_m48._tag === "some") {
      const f = __ring_m48._0;
      return f;
      break __ring_match48;
    }
    if (__ring_m48._tag === "none") {
      const ptr = ctx.ptr_type;
      let param_types = [];
      const __ring_end15 = arg_count;
      for (let i = 0; i < __ring_end15; i++) {
        List_push(param_types, ptr);
      }
      if (is_void_runtime_fn(name)) {
        return codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, name, param_types, ctx.void_type);
      } else {
        return codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, name, param_types, ptr);
      }
      break __ring_match48;
    }
    __match_fail(__ring_m48);
  }
}

function gen_field_access(ctx, receiver, field, ty) {
  const recv_val = gen_llvm_expr(ctx, receiver);
  const recv_type = hir$hexpr_type(receiver);
  const type_name = (function() {
  const __ring_m = recv_type;
  if (__ring_m._tag === "StructType") { const name = __ring_m.name; return name; }
  if (__ring_m._tag === "EnumType") { const name = __ring_m.name; return name; }
  return panic(`LLVM codegen: field access on non-struct type: ${types$type_to_string(recv_type)}, field: ${field}`);
})();
  __ring_match49: {
    const __ring_m49 = _Map_get(ctx.struct_types, type_name);
    if (__ring_m49._tag === "some") {
      const info = __ring_m49._0;
      let field_idx = (-1);
      const __ring_end16 = List_len(info.field_names);
      for (let i = 0; i < __ring_end16; i++) {
        if ((__ring_index(info.field_names, i) === field)) {
          field_idx = i;
        }
      }
      if ((field_idx < 0)) {
        panic(`LLVM codegen: field '${field}' not found in struct '${type_name}'`);
      }
      const field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, recv_val, field_idx, codegen_llvm_ctx$fresh_name(ctx, "fp"));
      return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, field));
      break __ring_match49;
    }
    if (__ring_m49._tag === "none") {
      return panic(`LLVM codegen: struct type '${type_name}' not registered`);
      break __ring_match49;
    }
    __match_fail(__ring_m49);
  }
}

function gen_struct_lit(ctx, name, fields) {
  __ring_match50: {
    const __ring_m50 = _Map_get(ctx.struct_types, name);
    if (__ring_m50._tag === "some") {
      const info = __ring_m50._0;
      const size = LLVMSizeOf(info.llvm_type);
      const malloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "malloc", [ctx.i64_type], ctx.ptr_type);
      const malloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "malloc");
      const struct_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [size], codegen_llvm_ctx$fresh_name(ctx, "s"));
      const __ring_iter_17 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
        if (__ring_next_17._tag === "none") break;
        const f = __ring_next_17._0;
        const val = gen_llvm_expr(ctx, f.value);
        let field_idx = (-1);
        const __ring_end18 = List_len(info.field_names);
        for (let i = 0; i < __ring_end18; i++) {
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
      break __ring_match50;
    }
    if (__ring_m50._tag === "none") {
      return panic(`LLVM codegen: struct type '${name}' not registered for literal`);
      break __ring_match50;
    }
    __match_fail(__ring_m50);
  }
}

function gen_block(ctx, stmts, tail) {
  const __ring_iter_19 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
    if (__ring_next_19._tag === "none") break;
    const stmt = __ring_next_19._0;
    codegen_llvm_stmt$emit_llvm_stmt(ctx, stmt);
  }
  __ring_match51: {
    const __ring_m51 = tail;
    if (__ring_m51._tag === "some") {
      const t = __ring_m51._0;
      return gen_llvm_expr(ctx, t);
      break __ring_match51;
    }
    if (__ring_m51._tag === "none") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match51;
    }
    __match_fail(__ring_m51);
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
  const sb_add_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_add", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
  const sb_add_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_add");
  const __ring_iter_20 = __List_Iterable.iter(parts);
  while (true) {
    const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
    if (__ring_next_20._tag === "none") break;
    const part = __ring_next_20._0;
    __ring_match52: {
      const __ring_m52 = part;
      if (__ring_m52._tag === "Literal") {
        const s = __ring_m52._0;
        const str_val = gen_str_lit(ctx, s);
        LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], codegen_llvm_ctx$fresh_name(ctx, "sba"));
        break __ring_match52;
      }
      if (__ring_m52._tag === "Expression") {
        const e = __ring_m52._0;
        const val = gen_llvm_expr(ctx, e);
        const expr_type = hir$hexpr_type(e);
        const str_val = convert_to_str(ctx, val, expr_type);
        LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], codegen_llvm_ctx$fresh_name(ctx, "sba"));
        break __ring_match52;
      }
      __match_fail(__ring_m52);
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
      const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type);
      const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_int");
      const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "ui"));
      const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.i64_type], ctx.ptr_type);
      const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_int_to_str");
      return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "its"));
    } else {
      if (is_float_type(ty)) {
        const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
        const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
        const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "uf"));
        const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_float_to_str", [ctx.double_type], ctx.ptr_type);
        const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_float_to_str");
        return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "fts"));
      } else {
        if (is_bool_type(ty)) {
          const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type);
          const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_bool");
          const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "ub"));
          const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_bool_to_str", [ctx.i64_type], ctx.ptr_type);
          const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_bool_to_str");
          return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "bts"));
        } else {
          const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type);
          const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_int");
          const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "ui"));
          const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.i64_type], ctx.ptr_type);
          const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_int_to_str");
          return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "ts"));
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

function discard(v) {
}

function gen_match_expr(ctx, scrutinee, arms, result_ty) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: match expr outside function"); }
  __match_fail(__ring_m);
})();
  const scrut_val = gen_llvm_expr(ctx, scrutinee);
  const scrut_ty = hir$hexpr_type(scrutinee);
  const enum_name = (function() {
  const __ring_m = scrut_ty;
  if (__ring_m._tag === "EnumType") { const name = __ring_m.name; return Option_some(name); }
  return Option_none;
})();
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.merge");
  const default_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.default");
  __ring_match53: {
    const __ring_m53 = enum_name;
    if (__ring_m53._tag === "some") {
      const ename = __ring_m53._0;
      __ring_match54: {
        const __ring_m54 = _Map_get(ctx.enum_types, ename);
        if (__ring_m54._tag === "some") {
          const enum_info = __ring_m54._0;
          const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, 0, codegen_llvm_ctx$fresh_name(ctx, "tp"));
          const tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "tag"));
          const switch_val = LLVMBuildSwitch(ctx.builder, tag_val, default_bb, List_len(arms));
          let phi_vals = [];
          let phi_bbs = [];
          const __ring_iter_21 = __List_Iterable.iter(arms);
          while (true) {
            const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
            if (__ring_next_21._tag === "none") break;
            const arm = __ring_next_21._0;
            gen_match_arm_enum(ctx, arm, scrut_val, ename, enum_info, switch_val, merge_bb, current_fn, phi_vals, phi_bbs);
          }
          LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
          const panic_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_panic", [ctx.ptr_type], ctx.ptr_type);
          const panic_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_panic");
          const msg = gen_str_lit(ctx, "match exhaustion failure");
          LLVMBuildCall2(ctx.builder, panic_ty, panic_fn, [msg], codegen_llvm_ctx$fresh_name(ctx, "mp"));
          discard(LLVMBuildUnreachable(ctx.builder));
          LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
          if ((List_len(phi_vals) > 0)) {
            const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "mr"));
            LLVMAddIncoming(phi, phi_vals, phi_bbs);
            return phi;
          } else {
            return LLVMConstPointerNull(ctx.ptr_type);
          }
          break __ring_match54;
        }
        if (__ring_m54._tag === "none") {
          return gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn);
          break __ring_match54;
        }
        __match_fail(__ring_m54);
      }
      break __ring_match53;
    }
    if (__ring_m53._tag === "none") {
      return gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn);
      break __ring_match53;
    }
    __match_fail(__ring_m53);
  }
}

function gen_match_arm_enum(ctx, arm, scrut_val, enum_name, enum_info, switch_val, merge_bb, current_fn, phi_vals, phi_bbs) {
  __ring_match55: {
    const __ring_m55 = arm.pattern;
    if (__ring_m55._tag === "Constructor") {
      const name = __ring_m55.name; const fields = __ring_m55.fields;
      __ring_match56: {
        const __ring_m56 = _Map_get(enum_info.variants, name);
        if (__ring_m56._tag === "some") {
          const vi = __ring_m56._0;
          const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `match.arm.${name}`);
          LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
          LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
          const __ring_end22 = List_len(fields);
          for (let i = 0; i < __ring_end22; i++) {
            __ring_match57: {
              const __ring_m57 = List_get(fields, i);
              if (__ring_m57._tag === "some") {
                const field_pat = __ring_m57._0;
                __ring_match58: {
                  const __ring_m58 = field_pat;
                  if (__ring_m58._tag === "Binding") {
                    const bname = __ring_m58.name;
                    const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                    const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, bname);
                    discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                    _Map_insert(ctx.named_values, bname, alloca);
                    break __ring_match58;
                  }
                  if (__ring_m58._tag === "Wildcard") {
                    break __ring_match58;
                  }
                  const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                  const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
                  bind_nested_pattern(ctx, field_val, field_pat);
                  break __ring_match58;
                }
                break __ring_match57;
              }
              if (__ring_m57._tag === "none") {
                break __ring_match57;
              }
              __match_fail(__ring_m57);
            }
          }
          const body_val = gen_llvm_expr(ctx, arm.body);
          const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
          discard(LLVMBuildBr(ctx.builder, merge_bb));
          List_push(phi_vals, body_val);
          return List_push(phi_bbs, arm_end_bb);
          break __ring_match56;
        }
        if (__ring_m56._tag === "none") {
          break __ring_match56;
        }
        __match_fail(__ring_m56);
      }
      break __ring_match55;
    }
    if (__ring_m55._tag === "NamedConstructor") {
      const name = __ring_m55.name; const named_fields = __ring_m55.fields;
      __ring_match59: {
        const __ring_m59 = _Map_get(enum_info.variants, name);
        if (__ring_m59._tag === "some") {
          const vi = __ring_m59._0;
          const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `match.arm.${name}`);
          LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
          LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
          const __ring_end23 = List_len(named_fields);
          for (let i = 0; i < __ring_end23; i++) {
            __ring_match60: {
              const __ring_m60 = List_get(named_fields, i);
              if (__ring_m60._tag === "some") {
                const nf = __ring_m60._0;
                __ring_match61: {
                  const __ring_m61 = nf.pattern;
                  if (__ring_m61._tag === "Binding") {
                    const bname = __ring_m61.name;
                    const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                    const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, bname);
                    discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                    _Map_insert(ctx.named_values, bname, alloca);
                    break __ring_match61;
                  }
                  if (__ring_m61._tag === "Wildcard") {
                    break __ring_match61;
                  }
                  const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                  const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
                  bind_nested_pattern(ctx, field_val, nf.pattern);
                  break __ring_match61;
                }
                break __ring_match60;
              }
              if (__ring_m60._tag === "none") {
                break __ring_match60;
              }
              __match_fail(__ring_m60);
            }
          }
          const body_val = gen_llvm_expr(ctx, arm.body);
          const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
          discard(LLVMBuildBr(ctx.builder, merge_bb));
          List_push(phi_vals, body_val);
          return List_push(phi_bbs, arm_end_bb);
          break __ring_match59;
        }
        if (__ring_m59._tag === "none") {
          break __ring_match59;
        }
        __match_fail(__ring_m59);
      }
      break __ring_match55;
    }
    if (__ring_m55._tag === "Wildcard") {
      const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.arm.wild");
      const __ring_iter_24 = __List_Iterable.iter(_Map_entries(enum_info.variants));
      while (true) {
        const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
        if (__ring_next_24._tag === "none") break;
        const entry = __ring_next_24._0;
        const __ring_dt1 = entry;
        const vname = __ring_dt1[0];
        const vi = __ring_dt1[1];
      }
      LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
      const body_val = gen_llvm_expr(ctx, arm.body);
      const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
      discard(LLVMBuildBr(ctx.builder, merge_bb));
      List_push(phi_vals, body_val);
      List_push(phi_bbs, arm_end_bb);
      const __ring_iter_25 = __List_Iterable.iter(_Map_entries(enum_info.variants));
      while (true) {
        const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
        if (__ring_next_25._tag === "none") break;
        const entry = __ring_next_25._0;
        const __ring_dt2 = entry;
        const vn = __ring_dt2[0];
        const vi = __ring_dt2[1];
        LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
      }
      break __ring_match55;
    }
    if (__ring_m55._tag === "Binding") {
      const bname = __ring_m55.name;
      const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.arm.bind");
      LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
      const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, bname);
      discard(LLVMBuildStore(ctx.builder, scrut_val, alloca));
      _Map_insert(ctx.named_values, bname, alloca);
      const body_val = gen_llvm_expr(ctx, arm.body);
      const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
      discard(LLVMBuildBr(ctx.builder, merge_bb));
      List_push(phi_vals, body_val);
      List_push(phi_bbs, arm_end_bb);
      const __ring_iter_26 = __List_Iterable.iter(_Map_entries(enum_info.variants));
      while (true) {
        const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
        if (__ring_next_26._tag === "none") break;
        const entry = __ring_next_26._0;
        const __ring_dt3 = entry;
        const vn = __ring_dt3[0];
        const vi = __ring_dt3[1];
        LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
      }
      break __ring_match55;
    }
    const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.arm.other");
    LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
    const body_val = gen_llvm_expr(ctx, arm.body);
    const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
    discard(LLVMBuildBr(ctx.builder, merge_bb));
    List_push(phi_vals, body_val);
    List_push(phi_bbs, arm_end_bb);
    const __ring_iter_27 = __List_Iterable.iter(_Map_entries(enum_info.variants));
    while (true) {
      const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
      if (__ring_next_27._tag === "none") break;
      const entry = __ring_next_27._0;
      const __ring_dt4 = entry;
      const vn = __ring_dt4[0];
      const vi = __ring_dt4[1];
      LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
    }
    break __ring_match55;
  }
}

function bind_nested_pattern(ctx, val, pat) {
  __ring_match62: {
    const __ring_m62 = pat;
    if (__ring_m62._tag === "Binding") {
      const name = __ring_m62.name;
      const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, name);
      discard(LLVMBuildStore(ctx.builder, val, alloca));
      return _Map_insert(ctx.named_values, name, alloca);
      break __ring_match62;
    }
    if (__ring_m62._tag === "Wildcard") {
      break __ring_match62;
    }
    if (__ring_m62._tag === "Constructor") {
      const name = __ring_m62.name; const qualifier = __ring_m62.qualifier; const fields = __ring_m62.fields;
      const enum_info = find_enum_by_variant(ctx, name, qualifier);
      __ring_match63: {
        const __ring_m63 = enum_info;
        if (__ring_m63._tag === "some") {
          const ei = __ring_m63._0;
          const __ring_end28 = List_len(fields);
          for (let i = 0; i < __ring_end28; i++) {
            __ring_match64: {
              const __ring_m64 = List_get(fields, i);
              if (__ring_m64._tag === "some") {
                const fp = __ring_m64._0;
                const field_ptr = LLVMBuildStructGEP2(ctx.builder, ei.llvm_type, val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "nf"));
                const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "nv"));
                bind_nested_pattern(ctx, field_val, fp);
                break __ring_match64;
              }
              if (__ring_m64._tag === "none") {
                break __ring_match64;
              }
              __match_fail(__ring_m64);
            }
          }
          break __ring_match63;
        }
        if (__ring_m63._tag === "none") {
          break __ring_match63;
        }
        __match_fail(__ring_m63);
      }
      break __ring_match62;
    }
    if (__ring_m62._tag === "TuplePattern") {
      const elements = __ring_m62.elements;
      const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
      const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
      const __ring_end29 = List_len(elements);
      for (let i = 0; i < __ring_end29; i++) {
        __ring_match65: {
          const __ring_m65 = List_get(elements, i);
          if (__ring_m65._tag === "some") {
            const ep = __ring_m65._0;
            const idx = LLVMConstInt(ctx.i64_type, i, 0);
            const elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [val, idx], codegen_llvm_ctx$fresh_name(ctx, "te"));
            bind_nested_pattern(ctx, elem, ep);
            break __ring_match65;
          }
          if (__ring_m65._tag === "none") {
            break __ring_match65;
          }
          __match_fail(__ring_m65);
        }
      }
      break __ring_match62;
    }
    if (__ring_m62._tag === "NamedConstructor") {
      const name = __ring_m62.name; const qualifier = __ring_m62.qualifier; const fields = __ring_m62.fields;
      const enum_info = find_enum_by_variant(ctx, name, qualifier);
      __ring_match66: {
        const __ring_m66 = enum_info;
        if (__ring_m66._tag === "some") {
          const ei = __ring_m66._0;
          const __ring_end30 = List_len(fields);
          for (let i = 0; i < __ring_end30; i++) {
            __ring_match67: {
              const __ring_m67 = List_get(fields, i);
              if (__ring_m67._tag === "some") {
                const nf = __ring_m67._0;
                const field_ptr = LLVMBuildStructGEP2(ctx.builder, ei.llvm_type, val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "nf"));
                const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "nv"));
                bind_nested_pattern(ctx, field_val, nf.pattern);
                break __ring_match67;
              }
              if (__ring_m67._tag === "none") {
                break __ring_match67;
              }
              __match_fail(__ring_m67);
            }
          }
          break __ring_match66;
        }
        if (__ring_m66._tag === "none") {
          break __ring_match66;
        }
        __match_fail(__ring_m66);
      }
      break __ring_match62;
    }
    break __ring_match62;
  }
}

function gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn) {
  let phi_vals = [];
  let phi_bbs = [];
  let remaining_arms = arms;
  const total = List_len(arms);
  const __ring_end31 = total;
  for (let i = 0; i < __ring_end31; i++) {
    __ring_match68: {
      const __ring_m68 = List_get(arms, i);
      if (__ring_m68._tag === "some") {
        const arm = __ring_m68._0;
        const is_last = (i === (total - 1));
        __ring_match69: {
          const __ring_m69 = arm.pattern;
          if (__ring_m69._tag === "Wildcard") {
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.wild");
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            const body_val = gen_llvm_expr(ctx, arm.body);
            const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
            discard(LLVMBuildBr(ctx.builder, merge_bb));
            List_push(phi_vals, body_val);
            List_push(phi_bbs, arm_end_bb);
            LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
            discard(LLVMBuildBr(ctx.builder, arm_bb));
            break __ring_match69;
          }
          if (__ring_m69._tag === "Binding") {
            const bname = __ring_m69.name;
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.bind");
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, bname);
            discard(LLVMBuildStore(ctx.builder, scrut_val, alloca));
            _Map_insert(ctx.named_values, bname, alloca);
            const body_val = gen_llvm_expr(ctx, arm.body);
            const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
            discard(LLVMBuildBr(ctx.builder, merge_bb));
            List_push(phi_vals, body_val);
            List_push(phi_bbs, arm_end_bb);
            LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
            discard(LLVMBuildBr(ctx.builder, arm_bb));
            break __ring_match69;
          }
          if (__ring_m69._tag === "Literal") {
            const value = __ring_m69.value;
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.lit");
            const next_bb = (is_last ? default_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next"));
            const cond_i1 = gen_literal_pattern_cond(ctx, scrut_val, scrut_ty, value);
            discard(LLVMBuildCondBr(ctx.builder, cond_i1, arm_bb, next_bb));
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            const body_val = gen_llvm_expr(ctx, arm.body);
            const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
            discard(LLVMBuildBr(ctx.builder, merge_bb));
            List_push(phi_vals, body_val);
            List_push(phi_bbs, arm_end_bb);
            if ((is_last === false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
            }
            break __ring_match69;
          }
          if (__ring_m69._tag === "TuplePattern") {
            const elements = __ring_m69.elements;
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.tuple");
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
            const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
            const __ring_end32 = List_len(elements);
            for (let j = 0; j < __ring_end32; j++) {
              __ring_match70: {
                const __ring_m70 = List_get(elements, j);
                if (__ring_m70._tag === "some") {
                  const elem_pat = __ring_m70._0;
                  __ring_match71: {
                    const __ring_m71 = elem_pat;
                    if (__ring_m71._tag === "Binding") {
                      const bname = __ring_m71.name;
                      const idx = LLVMConstInt(ctx.i64_type, j, 0);
                      const field_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], codegen_llvm_ctx$fresh_name(ctx, bname));
                      const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, bname);
                      discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                      _Map_insert(ctx.named_values, bname, alloca);
                      break __ring_match71;
                    }
                    if (__ring_m71._tag === "Wildcard") {
                      break __ring_match71;
                    }
                    const idx = LLVMConstInt(ctx.i64_type, j, 0);
                    const field_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], codegen_llvm_ctx$fresh_name(ctx, "tv"));
                    bind_nested_pattern(ctx, field_val, elem_pat);
                    break __ring_match71;
                  }
                  break __ring_match70;
                }
                if (__ring_m70._tag === "none") {
                  break __ring_match70;
                }
                __match_fail(__ring_m70);
              }
            }
            const body_val = gen_llvm_expr(ctx, arm.body);
            const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
            discard(LLVMBuildBr(ctx.builder, merge_bb));
            List_push(phi_vals, body_val);
            List_push(phi_bbs, arm_end_bb);
            LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
            discard(LLVMBuildBr(ctx.builder, arm_bb));
            break __ring_match69;
          }
          const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.other");
          LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
          bind_nested_pattern(ctx, scrut_val, arm.pattern);
          const body_val = gen_llvm_expr(ctx, arm.body);
          const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
          discard(LLVMBuildBr(ctx.builder, merge_bb));
          List_push(phi_vals, body_val);
          List_push(phi_bbs, arm_end_bb);
          LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
          discard(LLVMBuildBr(ctx.builder, arm_bb));
          break __ring_match69;
        }
        break __ring_match68;
      }
      if (__ring_m68._tag === "none") {
        break __ring_match68;
      }
      __match_fail(__ring_m68);
    }
  }
  LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  if ((List_len(phi_vals) > 0)) {
    const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "mr"));
    LLVMAddIncoming(phi, phi_vals, phi_bbs);
    return phi;
  } else {
    return LLVMConstPointerNull(ctx.ptr_type);
  }
}

function find_enum_by_variant(ctx, variant_name, qualifier) {
  __ring_match72: {
    const __ring_m72 = qualifier;
    if (__ring_m72._tag === "some") {
      const q = __ring_m72._0;
      __ring_match73: {
        const __ring_m73 = _Map_get(ctx.enum_types, q);
        if (__ring_m73._tag === "some") {
          const ei = __ring_m73._0;
          return Option_some(ei);
          break __ring_match73;
        }
        if (__ring_m73._tag === "none") {
          break __ring_match73;
        }
        __match_fail(__ring_m73);
      }
      break __ring_match72;
    }
    if (__ring_m72._tag === "none") {
      break __ring_match72;
    }
    __match_fail(__ring_m72);
  }
  __ring_match74: {
    const __ring_m74 = _Map_get(ctx.enum_types, variant_name);
    if (__ring_m74._tag === "some") {
      const ei = __ring_m74._0;
      return Option_some(ei);
      break __ring_match74;
    }
    if (__ring_m74._tag === "none") {
      break __ring_match74;
    }
    __match_fail(__ring_m74);
  }
  const __ring_iter_33 = __List_Iterable.iter(_Map_entries(ctx.enum_types));
  while (true) {
    const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
    if (__ring_next_33._tag === "none") break;
    const entry = __ring_next_33._0;
    const __ring_dt5 = entry;
    const ename = __ring_dt5[0];
    const einfo = __ring_dt5[1];
    __ring_match75: {
      const __ring_m75 = _Map_get(einfo.variants, variant_name);
      if (__ring_m75._tag === "some") {
        return Option_some(einfo);
        break __ring_match75;
      }
      if (__ring_m75._tag === "none") {
        break __ring_match75;
      }
      __match_fail(__ring_m75);
    }
  }
  return Option_none;
}

function get_tuple_llvm_type(ctx, count) {
  let elem_types = [];
  const __ring_end34 = count;
  for (let i = 0; i < __ring_end34; i++) {
    List_push(elem_types, ctx.ptr_type);
  }
  return LLVMStructTypeInContext(ctx.context, elem_types, 0);
}

function gen_literal_pattern_cond(ctx, scrut_val, scrut_ty, value) {
  __ring_match76: {
    const __ring_m76 = value;
    if (__ring_m76._tag === "IntVal") {
      const n = __ring_m76._0;
      const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type);
      const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_int");
      const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [scrut_val], codegen_llvm_ctx$fresh_name(ctx, "ui"));
      const lit = LLVMConstInt(ctx.i64_type, n, 1);
      return LLVMBuildICmp(ctx.builder, 32, raw, lit, codegen_llvm_ctx$fresh_name(ctx, "eq"));
      break __ring_match76;
    }
    if (__ring_m76._tag === "BoolVal") {
      const b = __ring_m76._0;
      const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type);
      const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_bool");
      const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [scrut_val], codegen_llvm_ctx$fresh_name(ctx, "ub"));
      const lit = (b ? LLVMConstInt(ctx.i64_type, 1, 0) : LLVMConstInt(ctx.i64_type, 0, 0));
      return LLVMBuildICmp(ctx.builder, 32, raw, lit, codegen_llvm_ctx$fresh_name(ctx, "eq"));
      break __ring_match76;
    }
    if (__ring_m76._tag === "StrVal") {
      const s = __ring_m76._0;
      const lit_str = gen_str_lit(ctx, s);
      const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
      const result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [scrut_val, lit_str], codegen_llvm_ctx$fresh_name(ctx, "seq"));
      return LLVMBuildTrunc(ctx.builder, result, ctx.i1_type, codegen_llvm_ctx$fresh_name(ctx, "i1"));
      break __ring_match76;
    }
    if (__ring_m76._tag === "FloatVal") {
      const f = __ring_m76._0;
      const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
      const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
      const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [scrut_val], codegen_llvm_ctx$fresh_name(ctx, "uf"));
      const lit = LLVMConstReal(ctx.double_type, f);
      return LLVMBuildFCmp(ctx.builder, 1, raw, lit, codegen_llvm_ctx$fresh_name(ctx, "feq"));
      break __ring_match76;
    }
    __match_fail(__ring_m76);
  }
}

function gen_named_variant_construct(ctx, enum_name, variant_name, fields) {
  __ring_match77: {
    const __ring_m77 = _Map_get(ctx.enum_types, enum_name);
    if (__ring_m77._tag === "some") {
      const enum_info = __ring_m77._0;
      __ring_match78: {
        const __ring_m78 = _Map_get(enum_info.variants, variant_name);
        if (__ring_m78._tag === "some") {
          const vi = __ring_m78._0;
          const size = LLVMSizeOf(enum_info.llvm_type);
          const malloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "malloc", [ctx.i64_type], ctx.ptr_type);
          const malloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "malloc");
          const enum_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [size], codegen_llvm_ctx$fresh_name(ctx, "ev"));
          const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "tag"));
          discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, vi.tag, 0), tag_ptr));
          const __ring_end35 = List_len(fields);
          for (let i = 0; i < __ring_end35; i++) {
            __ring_match79: {
              const __ring_m79 = List_get(fields, i);
              if (__ring_m79._tag === "some") {
                const f = __ring_m79._0;
                const val = gen_llvm_expr(ctx, f.value);
                const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                discard(LLVMBuildStore(ctx.builder, val, field_ptr));
                break __ring_match79;
              }
              if (__ring_m79._tag === "none") {
                break __ring_match79;
              }
              __match_fail(__ring_m79);
            }
          }
          return enum_ptr;
          break __ring_match78;
        }
        if (__ring_m78._tag === "none") {
          return panic(`LLVM codegen: variant '${variant_name}' not found in enum '${enum_name}'`);
          break __ring_match78;
        }
        __match_fail(__ring_m78);
      }
      break __ring_match77;
    }
    if (__ring_m77._tag === "none") {
      const ctor_name = `ring_${enum_name}_${variant_name}`;
      __ring_match80: {
        const __ring_m80 = _Map_get(ctx.functions, ctor_name);
        if (__ring_m80._tag === "some") {
          const fn_val = __ring_m80._0;
          let args = [];
          const __ring_iter_36 = __List_Iterable.iter(fields);
          while (true) {
            const __ring_next_36 = __ListIterator_Iterator.next(__ring_iter_36);
            if (__ring_next_36._tag === "none") break;
            const f = __ring_next_36._0;
            List_push(args, gen_llvm_expr(ctx, f.value));
          }
          const fn_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, ctor_name);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return panic(`LLVM codegen: fn type not found for ${ctor_name}`); }
  __match_fail(__ring_m);
})();
          return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, codegen_llvm_ctx$fresh_name(ctx, "vc"));
          break __ring_match80;
        }
        if (__ring_m80._tag === "none") {
          return panic(`LLVM codegen: enum '${enum_name}' not registered for variant construct`);
          break __ring_match80;
        }
        __match_fail(__ring_m80);
      }
      break __ring_match77;
    }
    __match_fail(__ring_m77);
  }
}

function gen_list_lit(ctx, elements) {
  const new_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_new", [], ctx.ptr_type);
  const new_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_new");
  const list = LLVMBuildCall2(ctx.builder, new_ty, new_fn, [], codegen_llvm_ctx$fresh_name(ctx, "ls"));
  const push_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_push", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
  const push_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_push");
  const __ring_iter_37 = __List_Iterable.iter(elements);
  while (true) {
    const __ring_next_37 = __ListIterator_Iterator.next(__ring_iter_37);
    if (__ring_next_37._tag === "none") break;
    const elem = __ring_next_37._0;
    const val = gen_llvm_expr(ctx, elem);
    LLVMBuildCall2(ctx.builder, push_ty, push_fn, [list, val], codegen_llvm_ctx$fresh_name(ctx, "lp"));
  }
  return list;
}

function gen_tuple_lit(ctx, elements) {
  return gen_list_lit(ctx, elements);
}

function gen_index_expr(ctx, receiver, index, ty) {
  const recv_val = gen_llvm_expr(ctx, receiver);
  const idx_val = gen_llvm_expr(ctx, index);
  const recv_type = hir$hexpr_type(receiver);
  const type_name = (function() {
  const __ring_m = types$type_to_builtin_name(recv_type);
  if (__ring_m._tag === "some") { const n = __ring_m._0; return n; }
  if (__ring_m._tag === "none") { return "Unknown"; }
  __match_fail(__ring_m);
})();
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_int");
  if ((type_name === "List")) {
    const raw_idx = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [idx_val], codegen_llvm_ctx$fresh_name(ctx, "ix"));
    const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
    const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
    return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, raw_idx], codegen_llvm_ctx$fresh_name(ctx, "lg"));
  } else {
    if ((type_name === "Str")) {
      const raw_idx = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [idx_val], codegen_llvm_ctx$fresh_name(ctx, "ix"));
      const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
      const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_get");
      return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, raw_idx], codegen_llvm_ctx$fresh_name(ctx, "sg"));
    } else {
      if ((type_name === "Map")) {
        const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_get", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
        const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_map_get");
        return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, idx_val], codegen_llvm_ctx$fresh_name(ctx, "mg"));
      } else {
        const raw_idx = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [idx_val], codegen_llvm_ctx$fresh_name(ctx, "ix"));
        const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
        const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
        return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, raw_idx], codegen_llvm_ctx$fresh_name(ctx, "ig"));
      }
    }
  }
}

function gen_range_expr(ctx, start, end, inclusive) {
  const range_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0);
  const size = LLVMSizeOf(range_ty);
  const malloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "malloc", [ctx.i64_type], ctx.ptr_type);
  const malloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "malloc");
  const range_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [size], codegen_llvm_ctx$fresh_name(ctx, "rng"));
  const start_val = gen_llvm_expr(ctx, start);
  const end_val = gen_llvm_expr(ctx, end);
  const incl_val = gen_bool_lit(ctx, inclusive);
  const start_ptr = LLVMBuildStructGEP2(ctx.builder, range_ty, range_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "rs"));
  discard(LLVMBuildStore(ctx.builder, start_val, start_ptr));
  const end_ptr = LLVMBuildStructGEP2(ctx.builder, range_ty, range_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "re"));
  discard(LLVMBuildStore(ctx.builder, end_val, end_ptr));
  const incl_ptr = LLVMBuildStructGEP2(ctx.builder, range_ty, range_ptr, 2, codegen_llvm_ctx$fresh_name(ctx, "ri"));
  discard(LLVMBuildStore(ctx.builder, incl_val, incl_ptr));
  return range_ptr;
}

function gen_lambda(ctx, params, return_type, body, ty) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: lambda outside function"); }
  __match_fail(__ring_m);
})();
  const lambda_name = codegen_llvm_ctx$fresh_name(ctx, "ring_lambda_");
  ctx.lambda_counter = (ctx.lambda_counter + 1);
  let captures = [];
  collect_captures(ctx, body, params, captures);
  let env_elem_types = [];
  const __ring_iter_38 = __List_Iterable.iter(captures);
  while (true) {
    const __ring_next_38 = __ListIterator_Iterator.next(__ring_iter_38);
    if (__ring_next_38._tag === "none") break;
    const c = __ring_next_38._0;
    List_push(env_elem_types, ctx.ptr_type);
  }
  const env_ty = ((List_len(captures) > 0) ? LLVMStructTypeInContext(ctx.context, env_elem_types, 0) : LLVMStructTypeInContext(ctx.context, [ctx.ptr_type], 0));
  let fn_param_types = [ctx.ptr_type];
  const __ring_iter_39 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_39 = __ListIterator_Iterator.next(__ring_iter_39);
    if (__ring_next_39._tag === "none") break;
    const p = __ring_next_39._0;
    List_push(fn_param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, fn_param_types, 0);
  const lambda_fn = LLVMAddFunction(ctx.module, lambda_name, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_named = ctx.named_values;
  ctx.current_fn = Option_some(lambda_fn);
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, lambda_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const env_ptr = LLVMGetParam(lambda_fn, 0);
  const __ring_end40 = List_len(captures);
  for (let i = 0; i < __ring_end40; i++) {
    __ring_match81: {
      const __ring_m81 = List_get(captures, i);
      if (__ring_m81._tag === "some") {
        const cap_name = __ring_m81._0;
        const cap_ptr = LLVMBuildStructGEP2(ctx.builder, env_ty, env_ptr, i, codegen_llvm_ctx$fresh_name(ctx, "ce"));
        const cap_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, cap_ptr, codegen_llvm_ctx$fresh_name(ctx, cap_name));
        const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, cap_name);
        discard(LLVMBuildStore(ctx.builder, cap_val, alloca));
        _Map_insert(ctx.named_values, cap_name, alloca);
        break __ring_match81;
      }
      if (__ring_m81._tag === "none") {
        break __ring_match81;
      }
      __match_fail(__ring_m81);
    }
  }
  const __ring_end41 = List_len(params);
  for (let i = 0; i < __ring_end41; i++) {
    __ring_match82: {
      const __ring_m82 = List_get(params, i);
      if (__ring_m82._tag === "some") {
        const p = __ring_m82._0;
        const param_val = LLVMGetParam(lambda_fn, (i + 1));
        const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, p.name);
        discard(LLVMBuildStore(ctx.builder, param_val, alloca));
        _Map_insert(ctx.named_values, p.name, alloca);
        break __ring_match82;
      }
      if (__ring_m82._tag === "none") {
        break __ring_match82;
      }
      __match_fail(__ring_m82);
    }
  }
  const body_val = gen_llvm_expr(ctx, body);
  discard(LLVMBuildRet(ctx.builder, body_val));
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
  LLVMPositionBuilderAtEnd(ctx.builder, LLVMGetInsertBlock(ctx.builder));
  const env_size = LLVMSizeOf(env_ty);
  const malloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "malloc", [ctx.i64_type], ctx.ptr_type);
  const malloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "malloc");
  const env_alloc = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [env_size], codegen_llvm_ctx$fresh_name(ctx, "env"));
  const __ring_end42 = List_len(captures);
  for (let i = 0; i < __ring_end42; i++) {
    __ring_match83: {
      const __ring_m83 = List_get(captures, i);
      if (__ring_m83._tag === "some") {
        const cap_name = __ring_m83._0;
        const cap_val = (function() {
  const __ring_m = _Map_get(ctx.named_values, cap_name);
  if (__ring_m._tag === "some") { const alloca = __ring_m._0; return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "cv")); }
  if (__ring_m._tag === "none") { return LLVMConstPointerNull(ctx.ptr_type); }
  __match_fail(__ring_m);
})();
        const cap_ptr = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, i, codegen_llvm_ctx$fresh_name(ctx, "ep"));
        discard(LLVMBuildStore(ctx.builder, cap_val, cap_ptr));
        break __ring_match83;
      }
      if (__ring_m83._tag === "none") {
        break __ring_match83;
      }
      __match_fail(__ring_m83);
    }
  }
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const closure_size = LLVMSizeOf(closure_ty);
  const closure_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [closure_size], codegen_llvm_ctx$fresh_name(ctx, "cls"));
  const fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
  discard(LLVMBuildStore(ctx.builder, lambda_fn, fn_ptr_slot));
  const env_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
  discard(LLVMBuildStore(ctx.builder, env_alloc, env_ptr_slot));
  return closure_ptr;
}

function collect_captures(ctx, expr, params, captures) {
  __ring_match84: {
    const __ring_m84 = expr;
    if (__ring_m84._tag === "Ident") {
      const name = __ring_m84.name; const resolved_name = __ring_m84.resolved_name;
      const lookup_name = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return rn; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
      let is_param = false;
      const __ring_iter_43 = __List_Iterable.iter(params);
      while (true) {
        const __ring_next_43 = __ListIterator_Iterator.next(__ring_iter_43);
        if (__ring_next_43._tag === "none") break;
        const p = __ring_next_43._0;
        if (((p.name === lookup_name) || (p.name === name))) {
          is_param = true;
        }
      }
      if ((is_param === false)) {
        const mangled = codegen_llvm_ctx$llvm_resolve_fn(ctx, lookup_name);
        const is_fn = (function() {
  const __ring_m = _Map_get(ctx.functions, mangled);
  if (__ring_m._tag === "some") { return true; }
  if (__ring_m._tag === "none") { return (function() {
  const mangled2 = codegen_llvm_ctx$llvm_mangle_fn(name);
  __ring_match85: {
    const __ring_m85 = _Map_get(ctx.functions, mangled2);
    if (__ring_m85._tag === "some") {
      return true;
      break __ring_match85;
    }
    if (__ring_m85._tag === "none") {
      const mangled3 = codegen_llvm_ctx$llvm_resolve_fn(ctx, name);
      __ring_match86: {
        const __ring_m86 = _Map_get(ctx.functions, mangled3);
        if (__ring_m86._tag === "some") {
          return true;
          break __ring_match86;
        }
        if (__ring_m86._tag === "none") {
          return false;
          break __ring_match86;
        }
        __match_fail(__ring_m86);
      }
      break __ring_match85;
    }
    __match_fail(__ring_m85);
  }
})(); }
  __match_fail(__ring_m);
})();
        if ((is_fn === false)) {
          const is_local = (function() {
  const __ring_m = _Map_get(ctx.named_values, lookup_name);
  if (__ring_m._tag === "some") { return true; }
  if (__ring_m._tag === "none") { return (function() {
  const __ring_m = _Map_get(ctx.named_values, name);
  if (__ring_m._tag === "some") { return true; }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})(); }
  __match_fail(__ring_m);
})();
          if (is_local) {
            let already = false;
            const __ring_iter_44 = __List_Iterable.iter(captures);
            while (true) {
              const __ring_next_44 = __ListIterator_Iterator.next(__ring_iter_44);
              if (__ring_next_44._tag === "none") break;
              const c = __ring_next_44._0;
              if (((c === lookup_name) || (c === name))) {
                already = true;
              }
            }
            if ((already === false)) {
              return List_push(captures, lookup_name);
            }
          }
        }
      }
      break __ring_match84;
    }
    if (__ring_m84._tag === "BinOp") {
      const left = __ring_m84.left; const right = __ring_m84.right;
      collect_captures(ctx, left, params, captures);
      return collect_captures(ctx, right, params, captures);
      break __ring_match84;
    }
    if (__ring_m84._tag === "UnaryOp") {
      const operand = __ring_m84.operand;
      return collect_captures(ctx, operand, params, captures);
      break __ring_match84;
    }
    if (__ring_m84._tag === "Call") {
      const callee = __ring_m84.callee; const args = __ring_m84.args;
      collect_captures(ctx, callee, params, captures);
      const __ring_iter_45 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_45 = __ListIterator_Iterator.next(__ring_iter_45);
        if (__ring_next_45._tag === "none") break;
        const a = __ring_next_45._0;
        collect_captures(ctx, a, params, captures);
      }
      break __ring_match84;
    }
    if (__ring_m84._tag === "FieldAccess") {
      const receiver = __ring_m84.receiver;
      return collect_captures(ctx, receiver, params, captures);
      break __ring_match84;
    }
    if (__ring_m84._tag === "Block") {
      const stmts = __ring_m84.stmts; const tail = __ring_m84.tail;
      const __ring_iter_46 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_46 = __ListIterator_Iterator.next(__ring_iter_46);
        if (__ring_next_46._tag === "none") break;
        const s = __ring_next_46._0;
        collect_captures_stmt(ctx, s, params, captures);
      }
      __ring_match87: {
        const __ring_m87 = tail;
        if (__ring_m87._tag === "some") {
          const t = __ring_m87._0;
          return collect_captures(ctx, t, params, captures);
          break __ring_match87;
        }
        if (__ring_m87._tag === "none") {
          break __ring_match87;
        }
        __match_fail(__ring_m87);
      }
      break __ring_match84;
    }
    if (__ring_m84._tag === "IfExpr") {
      const condition = __ring_m84.condition; const then_branch = __ring_m84.then_branch; const else_branch = __ring_m84.else_branch;
      collect_captures(ctx, condition, params, captures);
      collect_captures(ctx, then_branch, params, captures);
      __ring_match88: {
        const __ring_m88 = else_branch;
        if (__ring_m88._tag === "some") {
          const eb = __ring_m88._0;
          return collect_captures(ctx, eb, params, captures);
          break __ring_match88;
        }
        if (__ring_m88._tag === "none") {
          break __ring_match88;
        }
        __match_fail(__ring_m88);
      }
      break __ring_match84;
    }
    if (__ring_m84._tag === "MatchExpr") {
      const scrutinee = __ring_m84.scrutinee; const arms = __ring_m84.arms;
      collect_captures(ctx, scrutinee, params, captures);
      const __ring_iter_47 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_47 = __ListIterator_Iterator.next(__ring_iter_47);
        if (__ring_next_47._tag === "none") break;
        const arm = __ring_next_47._0;
        collect_captures(ctx, arm.body, params, captures);
      }
      break __ring_match84;
    }
    if (__ring_m84._tag === "StringInterp") {
      const parts = __ring_m84.parts;
      const __ring_iter_48 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_48 = __ListIterator_Iterator.next(__ring_iter_48);
        if (__ring_next_48._tag === "none") break;
        const part = __ring_next_48._0;
        __ring_match89: {
          const __ring_m89 = part;
          if (__ring_m89._tag === "Expression") {
            const e = __ring_m89._0;
            collect_captures(ctx, e, params, captures);
            break __ring_match89;
          }
          break __ring_match89;
        }
      }
      break __ring_match84;
    }
    if (__ring_m84._tag === "StructLit") {
      const fields = __ring_m84.fields;
      const __ring_iter_49 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_49 = __ListIterator_Iterator.next(__ring_iter_49);
        if (__ring_next_49._tag === "none") break;
        const f = __ring_next_49._0;
        collect_captures(ctx, f.value, params, captures);
      }
      break __ring_match84;
    }
    if (__ring_m84._tag === "ListLit") {
      const elements = __ring_m84.elements;
      const __ring_iter_50 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_50 = __ListIterator_Iterator.next(__ring_iter_50);
        if (__ring_next_50._tag === "none") break;
        const e = __ring_next_50._0;
        collect_captures(ctx, e, params, captures);
      }
      break __ring_match84;
    }
    if (__ring_m84._tag === "TupleLit") {
      const elements = __ring_m84.elements;
      const __ring_iter_51 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_51 = __ListIterator_Iterator.next(__ring_iter_51);
        if (__ring_next_51._tag === "none") break;
        const e = __ring_next_51._0;
        collect_captures(ctx, e, params, captures);
      }
      break __ring_match84;
    }
    if (__ring_m84._tag === "IndexExpr") {
      const receiver = __ring_m84.receiver; const index = __ring_m84.index;
      collect_captures(ctx, receiver, params, captures);
      return collect_captures(ctx, index, params, captures);
      break __ring_match84;
    }
    if (__ring_m84._tag === "Lambda") {
      const lb = __ring_m84.body;
      return collect_captures(ctx, lb, params, captures);
      break __ring_match84;
    }
    break __ring_match84;
  }
}

function collect_captures_stmt(ctx, stmt, params, captures) {
  __ring_match90: {
    const __ring_m90 = stmt;
    if (__ring_m90._tag === "Let") {
      const init = __ring_m90.init;
      return collect_captures(ctx, init, params, captures);
      break __ring_match90;
    }
    if (__ring_m90._tag === "Var") {
      const init = __ring_m90.init;
      return collect_captures(ctx, init, params, captures);
      break __ring_match90;
    }
    if (__ring_m90._tag === "Assign") {
      const target = __ring_m90.target; const value = __ring_m90.value;
      collect_captures(ctx, target, params, captures);
      return collect_captures(ctx, value, params, captures);
      break __ring_match90;
    }
    if (__ring_m90._tag === "ExprStmt") {
      const expr = __ring_m90.expr;
      return collect_captures(ctx, expr, params, captures);
      break __ring_match90;
    }
    if (__ring_m90._tag === "Return") {
      const value = __ring_m90.value;
      __ring_match91: {
        const __ring_m91 = value;
        if (__ring_m91._tag === "some") {
          const v = __ring_m91._0;
          return collect_captures(ctx, v, params, captures);
          break __ring_match91;
        }
        if (__ring_m91._tag === "none") {
          break __ring_match91;
        }
        __match_fail(__ring_m91);
      }
      break __ring_match90;
    }
    if (__ring_m90._tag === "While") {
      const condition = __ring_m90.condition; const body = __ring_m90.body;
      collect_captures(ctx, condition, params, captures);
      return collect_captures(ctx, body, params, captures);
      break __ring_match90;
    }
    if (__ring_m90._tag === "ForIn") {
      const iterable = __ring_m90.iterable; const body = __ring_m90.body;
      collect_captures(ctx, iterable, params, captures);
      return collect_captures(ctx, body, params, captures);
      break __ring_match90;
    }
    break __ring_match90;
  }
}

function gen_try_catch(ctx, body, arms) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: try-catch outside function"); }
  __match_fail(__ring_m);
})();
  const push_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_push", [], ctx.ptr_type);
  const push_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_push");
  const frame = LLVMBuildCall2(ctx.builder, push_ty, push_fn, [], codegen_llvm_ctx$fresh_name(ctx, "frame"));
  const setjmp_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_setjmp", [ctx.ptr_type], ctx.i64_type);
  const setjmp_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_setjmp");
  const setjmp_result = LLVMBuildCall2(ctx.builder, setjmp_ty, setjmp_fn, [frame], codegen_llvm_ctx$fresh_name(ctx, "sj"));
  const zero = LLVMConstInt(ctx.i64_type, 0, 0);
  const is_normal = LLVMBuildICmp(ctx.builder, 32, setjmp_result, zero, codegen_llvm_ctx$fresh_name(ctx, "norm"));
  const normal_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "try.normal");
  const catch_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "try.catch");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "try.merge");
  discard(LLVMBuildCondBr(ctx.builder, is_normal, normal_bb, catch_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, normal_bb);
  const raise_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_raise", [ctx.ptr_type], ctx.void_type);
  const body_val = gen_llvm_expr(ctx, body);
  const pop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_pop", [], ctx.void_type);
  const pop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_pop");
  LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], "");
  const normal_end_bb = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, catch_bb);
  const get_error_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_get_error", [ctx.ptr_type], ctx.ptr_type);
  const get_error_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_get_error");
  const error_val = LLVMBuildCall2(ctx.builder, get_error_ty, get_error_fn, [frame], codegen_llvm_ctx$fresh_name(ctx, "err"));
  LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], "");
  const catch_val = gen_catch_arms(ctx, error_val, arms);
  const catch_end_bb = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "tc"));
  LLVMAddIncoming(phi, [body_val, catch_val], [normal_end_bb, catch_end_bb]);
  return phi;
}

function gen_catch_arms(ctx, error_val, arms) {
  if ((List_len(arms) === 0)) {
    return LLVMConstPointerNull(ctx.ptr_type);
  }
  const __ring_iter_52 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_52 = __ListIterator_Iterator.next(__ring_iter_52);
    if (__ring_next_52._tag === "none") break;
    const arm = __ring_next_52._0;
    __ring_match92: {
      const __ring_m92 = arm.pattern;
      if (__ring_m92._tag === "Binding") {
        const name = __ring_m92.name;
        const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, name);
        discard(LLVMBuildStore(ctx.builder, error_val, alloca));
        _Map_insert(ctx.named_values, name, alloca);
        return gen_llvm_expr(ctx, arm.body);
        break __ring_match92;
      }
      if (__ring_m92._tag === "Wildcard") {
        return gen_llvm_expr(ctx, arm.body);
        break __ring_match92;
      }
      if (__ring_m92._tag === "Constructor") {
        const name = __ring_m92.name; const fields = __ring_m92.fields;
        bind_nested_pattern(ctx, error_val, arm.pattern);
        return gen_llvm_expr(ctx, arm.body);
        break __ring_match92;
      }
      return gen_llvm_expr(ctx, arm.body);
      break __ring_match92;
    }
  }
  return LLVMConstPointerNull(ctx.ptr_type);
}

function gen_handle_expr(ctx, body, handlers) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: handle expr outside function"); }
  __match_fail(__ring_m);
})();
  let by_effect = map_new();
  const __ring_iter_53 = __List_Iterable.iter(handlers);
  while (true) {
    const __ring_next_53 = __ListIterator_Iterator.next(__ring_iter_53);
    if (__ring_next_53._tag === "none") break;
    const h = __ring_next_53._0;
    __ring_match93: {
      const __ring_m93 = _Map_get(by_effect, h.effect_name);
      if (__ring_m93._tag === "some") {
        const existing = __ring_m93._0;
        List_push(existing, h);
        break __ring_match93;
      }
      if (__ring_m93._tag === "none") {
        _Map_insert(by_effect, h.effect_name, [h]);
        break __ring_match93;
      }
      __match_fail(__ring_m93);
    }
  }
  let has_fail_abort = false;
  const __ring_iter_54 = __List_Iterable.iter(_Map_entries(by_effect));
  while (true) {
    const __ring_next_54 = __ListIterator_Iterator.next(__ring_iter_54);
    if (__ring_next_54._tag === "none") break;
    const entry = __ring_next_54._0;
    const __ring_dt6 = entry;
    const effect_name = __ring_dt6[0];
    const hs = __ring_dt6[1];
    const ev_name = hir$evidence_param_name(effect_name);
    const __ring_iter_55 = __List_Iterable.iter(hs);
    while (true) {
      const __ring_next_55 = __ListIterator_Iterator.next(__ring_iter_55);
      if (__ring_next_55._tag === "none") break;
      const h = __ring_next_55._0;
      if (((effect_name === "fail") && (h.op_name === "raise"))) {
        has_fail_abort = true;
      }
    }
    const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, ev_name);
    discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), alloca));
    _Map_insert(ctx.named_values, ev_name, alloca);
  }
  if (has_fail_abort) {
    const push_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_push", [], ctx.ptr_type);
    const push_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_push");
    const frame = LLVMBuildCall2(ctx.builder, push_ty, push_fn, [], codegen_llvm_ctx$fresh_name(ctx, "frame"));
    const setjmp_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_setjmp", [ctx.ptr_type], ctx.i64_type);
    const setjmp_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_setjmp");
    const setjmp_result = LLVMBuildCall2(ctx.builder, setjmp_ty, setjmp_fn, [frame], codegen_llvm_ctx$fresh_name(ctx, "sj"));
    const zero = LLVMConstInt(ctx.i64_type, 0, 0);
    const is_normal = LLVMBuildICmp(ctx.builder, 32, setjmp_result, zero, codegen_llvm_ctx$fresh_name(ctx, "norm"));
    const normal_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "handle.normal");
    const catch_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "handle.catch");
    const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "handle.merge");
    discard(LLVMBuildCondBr(ctx.builder, is_normal, normal_bb, catch_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, normal_bb);
    const body_val = gen_llvm_expr(ctx, body);
    const pop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_pop", [], ctx.void_type);
    const pop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_pop");
    LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], "");
    const normal_end_bb = LLVMGetInsertBlock(ctx.builder);
    discard(LLVMBuildBr(ctx.builder, merge_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, catch_bb);
    const get_error_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_get_error", [ctx.ptr_type], ctx.ptr_type);
    const get_error_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_get_error");
    const error_val = LLVMBuildCall2(ctx.builder, get_error_ty, get_error_fn, [frame], codegen_llvm_ctx$fresh_name(ctx, "err"));
    LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], "");
    const catch_end_bb = LLVMGetInsertBlock(ctx.builder);
    discard(LLVMBuildBr(ctx.builder, merge_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
    const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "hd"));
    LLVMAddIncoming(phi, [body_val, error_val], [normal_end_bb, catch_end_bb]);
    return phi;
  } else {
    return gen_llvm_expr(ctx, body);
  }
}

function gen_effect_op(ctx, effect_name, op_name, args) {
  if (((effect_name === "fail") && (op_name === "raise"))) {
    let arg_vals = [];
    const __ring_iter_56 = __List_Iterable.iter(args);
    while (true) {
      const __ring_next_56 = __ListIterator_Iterator.next(__ring_iter_56);
      if (__ring_next_56._tag === "none") break;
      const a = __ring_next_56._0;
      List_push(arg_vals, gen_llvm_expr(ctx, a));
    }
    const raise_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_raise", [ctx.ptr_type], ctx.void_type);
    const raise_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_raise");
    const error_val = ((List_len(arg_vals) > 0) ? __ring_index(arg_vals, 0) : LLVMConstPointerNull(ctx.ptr_type));
    LLVMBuildCall2(ctx.builder, raise_ty, raise_fn, [error_val], "");
    discard(LLVMBuildUnreachable(ctx.builder));
    const current_fn_val = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: effect op outside function"); }
  __match_fail(__ring_m);
})();
    const dummy_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn_val, "post.raise");
    LLVMPositionBuilderAtEnd(ctx.builder, dummy_bb);
    return LLVMConstPointerNull(ctx.ptr_type);
  } else {
    const ev_name = hir$evidence_param_name(effect_name);
    let arg_vals = [];
    const __ring_iter_57 = __List_Iterable.iter(args);
    while (true) {
      const __ring_next_57 = __ListIterator_Iterator.next(__ring_iter_57);
      if (__ring_next_57._tag === "none") break;
      const a = __ring_next_57._0;
      List_push(arg_vals, gen_llvm_expr(ctx, a));
    }
    __ring_match94: {
      const __ring_m94 = _Map_get(ctx.named_values, ev_name);
      if (__ring_m94._tag === "some") {
        const ev_alloca = __ring_m94._0;
        const ev_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, ev_alloca, codegen_llvm_ctx$fresh_name(ctx, "ev"));
        return LLVMConstPointerNull(ctx.ptr_type);
        break __ring_match94;
      }
      if (__ring_m94._tag === "none") {
        return LLVMConstPointerNull(ctx.ptr_type);
        break __ring_match94;
      }
      __match_fail(__ring_m94);
    }
  }
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

function __FnLookupResult_Eq_eq(self, other) {
  return __LLVMValueRef_Eq.eq(self.fn_val, other.fn_val) && (self.fn_mangled === other.fn_mangled);
}
const __FnLookupResult_Eq = { eq: __FnLookupResult_Eq_eq, ne: function(self, other) { return !__FnLookupResult_Eq_eq(self, other); } };

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

function __FnLookupResult_Clone_clone(self) {
  return new FnLookupResult(__LLVMValueRef_Clone.clone(self.fn_val), self.fn_mangled);
}
const __FnLookupResult_Clone = { clone: __FnLookupResult_Clone_clone };

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

function __FnLookupResult_Ord_cmp(self, other) {
  var c;
  c = __LLVMValueRef_Ord.cmp(self.fn_val, other.fn_val);
  if (c !== 0) return c;
  return (self.fn_mangled < other.fn_mangled ? -1 : self.fn_mangled > other.fn_mangled ? 1 : 0);
}
const __FnLookupResult_Ord = { cmp: __FnLookupResult_Ord_cmp };

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

function __FnLookupResult_Debug_debug(self) {
  return "FnLookupResult { " + "fn_val: " + __LLVMValueRef_Debug.debug(self.fn_val) + ", " + "fn_mangled: " + String(self.fn_mangled) + " }";
}
const __FnLookupResult_Debug = { debug: __FnLookupResult_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { gen_llvm_expr, box_int, box_float, box_bool, unbox_to_i1 };