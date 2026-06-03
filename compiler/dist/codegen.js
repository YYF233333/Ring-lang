import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, effect_op_slot as hir$effect_op_slot, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { CELL_METHODS as builtin_methods$CELL_METHODS, STR_METHODS as builtin_methods$STR_METHODS, INT_METHODS as builtin_methods$INT_METHODS, FLOAT_METHODS as builtin_methods$FLOAT_METHODS, LIST_NON_HOF_METHODS as builtin_methods$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as builtin_methods$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as builtin_methods$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as builtin_methods$MAP_HOF_METHODS, SET_NON_HOF_METHODS as builtin_methods$SET_NON_HOF_METHODS, SET_HOF_METHODS as builtin_methods$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as builtin_methods$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as builtin_methods$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as builtin_methods$STRINGBUILDER_METHODS } from "./builtin_methods.js";
import { RUNTIME_CODE as runtime$RUNTIME_CODE, RUNTIME_EXPORT_NAMES as runtime$RUNTIME_EXPORT_NAMES, runtime_esm_code as runtime$runtime_esm_code } from "./runtime.js";
import { safe_ident as codegen_ctx$safe_ident, new_codegen_ctx as codegen_ctx$new_codegen_ctx, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, push_indent as codegen_ctx$push_indent, pop_indent as codegen_ctx$pop_indent, is_imported_name as codegen_ctx$is_imported_name, qualify as codegen_ctx$qualify, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";
import { emit_decl as codegen_decl$emit_decl, emit_fn_decl as codegen_decl$emit_fn_decl, emit_toplevel_evidence as codegen_decl$emit_toplevel_evidence } from "./codegen_decl.js";
import { gen_expr as codegen_expr$gen_expr } from "./codegen_expr.js";
import { get_derived_method_names as codegen_derive$get_derived_method_names, emit_derived_impl as codegen_derive$emit_derived_impl } from "./codegen_derive.js";



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

function generate(program, skip_preamble, skip_main_call, module_prefix, imports_map, external_struct_fields, external_impl_methods, module_imports, module_exports, external_fn_mut_params) {
  let ctx = codegen_ctx$new_codegen_ctx(skip_preamble, skip_main_call);
  ctx.module_prefix = module_prefix;
  ctx.imports_map = imports_map;
  ctx.module_imports = module_imports;
  ctx.module_exports = module_exports;
  ctx.boxed_vars = program.boxed_vars;
  scan_fn_mut_params(program.decls, ctx);
  __ring_match6: {
    const __ring_m6 = external_fn_mut_params;
    if (__ring_m6._tag === "some") {
      const efmp = __ring_m6._0;
      const __ring_iter_2 = __List_Iterable.iter(_Map_entries(efmp));
      while (true) {
        const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
        if (__ring_next_2._tag === "none") break;
        const entry = __ring_next_2._0;
        const __ring_dt0 = entry;
        const k = __ring_dt0[0];
        const v = __ring_dt0[1];
        _Map_insert(ctx.fn_mut_params, k, v);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
  __ring_match7: {
    const __ring_m7 = external_struct_fields;
    if (__ring_m7._tag === "some") {
      const esf = __ring_m7._0;
      const __ring_iter_3 = __List_Iterable.iter(_Map_entries(esf));
      while (true) {
        const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
        if (__ring_next_3._tag === "none") break;
        const entry = __ring_next_3._0;
        const __ring_dt1 = entry;
        const k = __ring_dt1[0];
        const v = __ring_dt1[1];
        _Map_insert(ctx.struct_field_order, k, v);
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "none") {
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
  __ring_match8: {
    const __ring_m8 = external_impl_methods;
    if (__ring_m8._tag === "some") {
      const eim = __ring_m8._0;
      const __ring_iter_4 = __List_Iterable.iter(_Map_entries(eim));
      while (true) {
        const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
        if (__ring_next_4._tag === "none") break;
        const entry = __ring_next_4._0;
        const __ring_dt2 = entry;
        const k = __ring_dt2[0];
        const v = __ring_dt2[1];
        _Map_insert(ctx.impl_methods, k, v);
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
  const has_imports = (function() {
  const __ring_m = ctx.module_imports;
  if (__ring_m._tag === "some") { const imports = __ring_m._0; return (List_len(imports) > 0); }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
  if (has_imports) {
    __ring_match9: {
      const __ring_m9 = ctx.module_imports;
      if (__ring_m9._tag === "some") {
        const imports = __ring_m9._0;
        const __ring_iter_5 = __List_Iterable.iter(imports);
        while (true) {
          const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
          if (__ring_next_5._tag === "none") break;
          const imp = __ring_next_5._0;
          codegen_ctx$emit_raw(ctx, imp);
        }
        break __ring_match9;
      }
      if (__ring_m9._tag === "none") {
        break __ring_match9;
      }
      __match_fail(__ring_m9);
    }
    const empty = "";
    codegen_ctx$emit_raw(ctx, empty);
  }
  register_decl_info(program.decls, ctx);
  if ((_Map_len(ctx.local_fn_effects) > 0)) {
    let fn_callees = map_new();
    collect_fn_callees(program.decls, ctx.local_names, fn_callees);
    let changed = true;
    while (changed) {
      changed = false;
      const __ring_iter_6 = __List_Iterable.iter(_Map_entries(fn_callees));
      while (true) {
        const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
        if (__ring_next_6._tag === "none") break;
        const entry = __ring_next_6._0;
        const __ring_dt3 = entry;
        const name = __ring_dt3[0];
        const callees = __ring_dt3[1];
        const __ring_iter_7 = __List_Iterable.iter(_Set_to_list(callees));
        while (true) {
          const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
          if (__ring_next_7._tag === "none") break;
          const callee = __ring_next_7._0;
          __ring_match10: {
            const __ring_m10 = _Map_get(ctx.local_fn_effects, callee);
            if (__ring_m10._tag === "some") {
              const callee_effects = __ring_m10._0;
              __ring_match11: {
                const __ring_m11 = _Map_get(ctx.local_fn_effects, name);
                if (__ring_m11._tag === "none") {
                  let effs = [];
                  const __ring_iter_8 = __List_Iterable.iter(callee_effects.effects);
                  while (true) {
                    const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
                    if (__ring_next_8._tag === "none") break;
                    const e = __ring_next_8._0;
                    List_push(effs, e);
                  }
                  _Map_insert(ctx.local_fn_effects, name, new types$EffectRow(effs, Option_none));
                  changed = true;
                  break __ring_match11;
                }
                if (__ring_m11._tag === "some") {
                  const current = __ring_m11._0;
                  const __ring_iter_9 = __List_Iterable.iter(callee_effects.effects);
                  while (true) {
                    const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
                    if (__ring_next_9._tag === "none") break;
                    const e = __ring_next_9._0;
                    const ename = types$effect_kind_name(e);
                    let found = false;
                    const __ring_iter_10 = __List_Iterable.iter(current.effects);
                    while (true) {
                      const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
                      if (__ring_next_10._tag === "none") break;
                      const ce = __ring_next_10._0;
                      if ((types$effect_kind_name(ce) === ename)) {
                        found = true;
                      }
                    }
                    if ((found === false)) {
                      List_push(current.effects, e);
                      changed = true;
                    }
                  }
                  break __ring_match11;
                }
                __match_fail(__ring_m11);
              }
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
  register_builtin_methods(ctx, hir$BUILTIN_CELL, builtin_methods$CELL_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_STR, builtin_methods$STR_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_LIST, builtin_methods$LIST_NON_HOF_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_MAP, builtin_methods$MAP_NON_HOF_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_SET, builtin_methods$SET_NON_HOF_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_INT, builtin_methods$INT_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_FLOAT, builtin_methods$FLOAT_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_OPTION, builtin_methods$OPTION_NON_HOF_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_STRING_BUILDER, builtin_methods$STRINGBUILDER_METHODS);
  const __ring_iter_11 = __List_Iterable.iter([hir$BUILTIN_INT, hir$BUILTIN_FLOAT, hir$BUILTIN_STR, hir$BUILTIN_BOOL]);
  while (true) {
    const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
    if (__ring_next_11._tag === "none") break;
    const prim = __ring_next_11._0;
    const key = `${codegen_ctx$safe_ident(prim)}.debug`;
    _Map_insert(ctx.impl_methods, key, Option_some("Debug"));
  }
  const __ring_iter_12 = __List_Iterable.iter([hir$BUILTIN_LIST, hir$BUILTIN_MAP, hir$BUILTIN_SET, hir$BUILTIN_OPTION]);
  while (true) {
    const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
    if (__ring_next_12._tag === "none") break;
    const coll = __ring_next_12._0;
    const key = `${codegen_ctx$safe_ident(coll)}.debug`;
    _Map_insert(ctx.impl_methods, key, Option_some("Debug"));
  }
  if ((ctx.skip_preamble === false)) {
    codegen_ctx$emit_raw(ctx, runtime$RUNTIME_CODE());
    codegen_ctx$emit_raw(ctx, "");
  }
  const __ring_iter_13 = __List_Iterable.iter(program.derived_impls);
  while (true) {
    const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
    if (__ring_next_13._tag === "none") break;
    const impl_ = __ring_next_13._0;
    const __ring_iter_14 = __List_Iterable.iter(codegen_derive$get_derived_method_names(impl_.trait_name));
    while (true) {
      const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
      if (__ring_next_14._tag === "none") break;
      const method_name = __ring_next_14._0;
      const key = `${codegen_ctx$qualify(ctx, impl_.type_name)}.${method_name}`;
      __ring_match12: {
        const __ring_m12 = _Map_get(ctx.impl_methods, key);
        if (__ring_m12._tag === "none") {
          _Map_insert(ctx.impl_methods, key, Option_some(impl_.trait_name));
          break __ring_match12;
        }
        if (__ring_m12._tag === "some") {
          break __ring_match12;
        }
        __match_fail(__ring_m12);
      }
    }
  }
  const __ring_iter_15 = __List_Iterable.iter(program.decls);
  while (true) {
    const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
    if (__ring_next_15._tag === "none") break;
    const decl = __ring_next_15._0;
    codegen_decl$emit_decl(ctx, decl);
    codegen_ctx$emit_raw(ctx, "");
  }
  const __ring_iter_16 = __List_Iterable.iter(program.derived_impls);
  while (true) {
    const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
    if (__ring_next_16._tag === "none") break;
    const impl_ = __ring_next_16._0;
    codegen_derive$emit_derived_impl(ctx, impl_);
    codegen_ctx$emit_raw(ctx, "");
  }
  if ((ctx.skip_main_call === false)) {
    const __ring_iter_17 = __List_Iterable.iter(program.decls);
    while (true) {
      const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
      if (__ring_next_17._tag === "none") break;
      const decl = __ring_next_17._0;
      __ring_match13: {
        const __ring_m13 = decl;
        if (__ring_m13._tag === "Fn") {
          const name = __ring_m13.name; const effects = __ring_m13.effects;
          if ((name === "main")) {
            const fn_name = codegen_ctx$qualify(ctx, "main");
            const ev_params = codegen_ctx$get_evidence_params(effects);
            if ((List_len(ev_params) > 0)) {
              codegen_decl$emit_toplevel_evidence(ctx, effects);
              const ev_str = List_join(ev_params, ", ");
              codegen_ctx$emit(ctx, `${fn_name}(${ev_str});`);
            } else {
              codegen_ctx$emit(ctx, `${fn_name}();`);
            }
          }
          break __ring_match13;
        }
        break __ring_match13;
      }
    }
  }
  __ring_match14: {
    const __ring_m14 = ctx.module_exports;
    if (__ring_m14._tag === "some") {
      const exports = __ring_m14._0;
      if ((List_len(exports) > 0)) {
        codegen_ctx$emit_raw(ctx, "");
        const joined = List_join(exports, ", ");
        codegen_ctx$emit_raw(ctx, `export { ${joined} };`);
      }
      break __ring_match14;
    }
    if (__ring_m14._tag === "none") {
      break __ring_match14;
    }
    __match_fail(__ring_m14);
  }
  return List_join(ctx.lines, "\n");
}

function register_builtin_methods(ctx, type_name, methods) {
  const sn = codegen_ctx$safe_ident(type_name);
  const __ring_iter_18 = __List_Iterable.iter(methods);
  while (true) {
    const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
    if (__ring_next_18._tag === "none") break;
    const m = __ring_next_18._0;
    const key = `${sn}.${m}`;
    _Map_insert(ctx.impl_methods, key, Option_none);
  }
}

function register_decl_info(decls, ctx) {
  const __ring_iter_19 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
    if (__ring_next_19._tag === "none") break;
    const decl = __ring_next_19._0;
    __ring_match15: {
      const __ring_m15 = decl;
      if (__ring_m15._tag === "Fn") {
        const name = __ring_m15.name; const effects = __ring_m15.effects;
        _Set_insert(ctx.local_names, name);
        if ((List_len(effects.effects) > 0)) {
          _Map_insert(ctx.local_fn_effects, name, effects);
        }
        break __ring_match15;
      }
      if (__ring_m15._tag === "Struct") {
        const name = __ring_m15.name; const fields = __ring_m15.fields;
        _Set_insert(ctx.local_names, name);
        const qname = codegen_ctx$qualify(ctx, name);
        let field_names = [];
        const __ring_iter_20 = __List_Iterable.iter(fields);
        while (true) {
          const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
          if (__ring_next_20._tag === "none") break;
          const f = __ring_next_20._0;
          List_push(field_names, f.name);
        }
        _Map_insert(ctx.struct_field_order, qname, field_names);
        break __ring_match15;
      }
      if (__ring_m15._tag === "Enum") {
        const name = __ring_m15.name; const variants = __ring_m15.variants;
        _Set_insert(ctx.local_names, name);
        const __ring_iter_21 = __List_Iterable.iter(variants);
        while (true) {
          const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
          if (__ring_next_21._tag === "none") break;
          const v = __ring_next_21._0;
          _Set_insert(ctx.local_names, v.name);
          _Set_insert(ctx.local_names, `${name}_${v.name}`);
        }
        break __ring_match15;
      }
      if (__ring_m15._tag === "Trait") {
        const name = __ring_m15.name; const methods = __ring_m15.methods; const supertraits = __ring_m15.supertraits;
        _Set_insert(ctx.local_names, name);
        _Map_insert(ctx.trait_decls, name, new codegen_ctx$HTraitDeclInfo(name, methods, supertraits));
        break __ring_match15;
      }
      if (__ring_m15._tag === "Impl") {
        const target_type = __ring_m15.target_type; const trait_name = __ring_m15.trait_name; const methods = __ring_m15.methods;
        _Set_insert(ctx.local_names, target_type);
        let explicit_methods = set_new();
        const __ring_iter_22 = __List_Iterable.iter(methods);
        while (true) {
          const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
          if (__ring_next_22._tag === "none") break;
          const method = __ring_next_22._0;
          __ring_match16: {
            const __ring_m16 = method;
            if (__ring_m16._tag === "Fn") {
              const name = __ring_m16.name;
              _Set_insert(explicit_methods, name);
              const key = `${codegen_ctx$qualify(ctx, target_type)}.${name}`;
              __ring_match17: {
                const __ring_m17 = trait_name;
                if (__ring_m17._tag === "none") {
                  __ring_match18: {
                    const __ring_m18 = _Map_get(ctx.impl_methods, key);
                    if (__ring_m18._tag === "none") {
                      _Map_insert(ctx.impl_methods, key, Option_none);
                      break __ring_match18;
                    }
                    if (__ring_m18._tag === "some") {
                      break __ring_match18;
                    }
                    __match_fail(__ring_m18);
                  }
                  break __ring_match17;
                }
                if (__ring_m17._tag === "some") {
                  const tn = __ring_m17._0;
                  __ring_match19: {
                    const __ring_m19 = _Map_get(ctx.impl_methods, key);
                    if (__ring_m19._tag === "none") {
                      _Map_insert(ctx.impl_methods, key, Option_some(tn));
                      break __ring_match19;
                    }
                    if (__ring_m19._tag === "some") {
                      break __ring_match19;
                    }
                    __match_fail(__ring_m19);
                  }
                  break __ring_match17;
                }
                __match_fail(__ring_m17);
              }
              break __ring_match16;
            }
            break __ring_match16;
          }
        }
        __ring_match20: {
          const __ring_m20 = trait_name;
          if (__ring_m20._tag === "some") {
            const tn = __ring_m20._0;
            __ring_match21: {
              const __ring_m21 = _Map_get(ctx.trait_decls, tn);
              if (__ring_m21._tag === "some") {
                const trait_info = __ring_m21._0;
                const __ring_iter_23 = __List_Iterable.iter(trait_info.methods);
                while (true) {
                  const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
                  if (__ring_next_23._tag === "none") break;
                  const tm = __ring_next_23._0;
                  if ((tm.has_default && (!_Set_contains(explicit_methods, tm.name, __Str_Eq)))) {
                    const key = `${codegen_ctx$qualify(ctx, target_type)}.${tm.name}`;
                    __ring_match22: {
                      const __ring_m22 = _Map_get(ctx.impl_methods, key);
                      if (__ring_m22._tag === "none") {
                        _Map_insert(ctx.impl_methods, key, Option_some(tn));
                        break __ring_match22;
                      }
                      if (__ring_m22._tag === "some") {
                        break __ring_match22;
                      }
                      __match_fail(__ring_m22);
                    }
                  }
                }
                break __ring_match21;
              }
              if (__ring_m21._tag === "none") {
                break __ring_match21;
              }
              __match_fail(__ring_m21);
            }
            break __ring_match20;
          }
          if (__ring_m20._tag === "none") {
            break __ring_match20;
          }
          __match_fail(__ring_m20);
        }
        break __ring_match15;
      }
      if (__ring_m15._tag === "Effect") {
        const name = __ring_m15.name;
        _Set_insert(ctx.local_names, name);
        break __ring_match15;
      }
      if (__ring_m15._tag === "Const") {
        const name = __ring_m15.name;
        _Set_insert(ctx.local_names, name);
        break __ring_match15;
      }
      if (__ring_m15._tag === "ModBlock") {
        const name = __ring_m15.name; const mod_decls = __ring_m15.decls;
        _Set_insert(ctx.local_names, name);
        register_decl_info(mod_decls, ctx);
        break __ring_match15;
      }
      if (__ring_m15._tag === "Test") {
        break __ring_match15;
      }
      if (__ring_m15._tag === "ExternFn") {
        break __ring_match15;
      }
      if (__ring_m15._tag === "ExternType") {
        break __ring_match15;
      }
      if (__ring_m15._tag === "TypeAlias") {
        break __ring_match15;
      }
      if (__ring_m15._tag === "Sig") {
        break __ring_match15;
      }
      __match_fail(__ring_m15);
    }
  }
}

function collect_fn_callees(decls, local_names, fn_callees) {
  const __ring_iter_24 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
    if (__ring_next_24._tag === "none") break;
    const decl = __ring_next_24._0;
    __ring_match23: {
      const __ring_m23 = decl;
      if (__ring_m23._tag === "Fn") {
        const name = __ring_m23.name; const body = __ring_m23.body;
        let callees = set_new();
        collect_local_calls(body, local_names, callees);
        _Map_insert(fn_callees, name, callees);
        break __ring_match23;
      }
      if (__ring_m23._tag === "Impl") {
        const methods = __ring_m23.methods;
        const __ring_iter_25 = __List_Iterable.iter(methods);
        while (true) {
          const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
          if (__ring_next_25._tag === "none") break;
          const m = __ring_next_25._0;
          __ring_match24: {
            const __ring_m24 = m;
            if (__ring_m24._tag === "Fn") {
              const mn = __ring_m24.name; const mb = __ring_m24.body;
              let callees = set_new();
              collect_local_calls(mb, local_names, callees);
              _Map_insert(fn_callees, mn, callees);
              break __ring_match24;
            }
            break __ring_match24;
          }
        }
        break __ring_match23;
      }
      if (__ring_m23._tag === "ModBlock") {
        const mod_decls = __ring_m23.decls;
        collect_fn_callees(mod_decls, local_names, fn_callees);
        break __ring_match23;
      }
      break __ring_match23;
    }
  }
}

function collect_local_calls(expr, local_names, out) {
  __ring_match25: {
    const __ring_m25 = expr;
    if (__ring_m25._tag === "Call") {
      const callee = __ring_m25.callee; const args = __ring_m25.args;
      __ring_match26: {
        const __ring_m26 = callee;
        if (__ring_m26._tag === "Ident") {
          const name = __ring_m26.name;
          if (_Set_contains(local_names, name, __Str_Eq)) {
            _Set_insert(out, name);
          }
          break __ring_match26;
        }
        if (__ring_m26._tag === "FieldAccess") {
          const field = __ring_m26.field;
          if (_Set_contains(local_names, field, __Str_Eq)) {
            _Set_insert(out, field);
          }
          break __ring_match26;
        }
        break __ring_match26;
      }
      collect_local_calls(callee, local_names, out);
      const __ring_iter_26 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
        if (__ring_next_26._tag === "none") break;
        const a = __ring_next_26._0;
        collect_local_calls(a, local_names, out);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "Block") {
      const stmts = __ring_m25.stmts; const tail = __ring_m25.tail;
      const __ring_iter_27 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
        if (__ring_next_27._tag === "none") break;
        const s = __ring_next_27._0;
        collect_local_calls_stmt(s, local_names, out);
      }
      __ring_match27: {
        const __ring_m27 = tail;
        if (__ring_m27._tag === "some") {
          const t = __ring_m27._0;
          return collect_local_calls(t, local_names, out);
          break __ring_match27;
        }
        if (__ring_m27._tag === "none") {
          break __ring_match27;
        }
        __match_fail(__ring_m27);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "IfExpr") {
      const condition = __ring_m25.condition; const then_branch = __ring_m25.then_branch; const else_branch = __ring_m25.else_branch;
      collect_local_calls(condition, local_names, out);
      collect_local_calls(then_branch, local_names, out);
      __ring_match28: {
        const __ring_m28 = else_branch;
        if (__ring_m28._tag === "some") {
          const eb = __ring_m28._0;
          return collect_local_calls(eb, local_names, out);
          break __ring_match28;
        }
        if (__ring_m28._tag === "none") {
          break __ring_match28;
        }
        __match_fail(__ring_m28);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "MatchExpr") {
      const scrutinee = __ring_m25.scrutinee; const arms = __ring_m25.arms;
      collect_local_calls(scrutinee, local_names, out);
      const __ring_iter_28 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
        if (__ring_next_28._tag === "none") break;
        const arm = __ring_next_28._0;
        collect_local_calls(arm.body, local_names, out);
        __ring_match29: {
          const __ring_m29 = arm.guard;
          if (__ring_m29._tag === "some") {
            const g = __ring_m29._0;
            collect_local_calls(g, local_names, out);
            break __ring_match29;
          }
          if (__ring_m29._tag === "none") {
            break __ring_match29;
          }
          __match_fail(__ring_m29);
        }
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "BinOp") {
      const left = __ring_m25.left; const right = __ring_m25.right;
      collect_local_calls(left, local_names, out);
      return collect_local_calls(right, local_names, out);
      break __ring_match25;
    }
    if (__ring_m25._tag === "UnaryOp") {
      const operand = __ring_m25.operand;
      return collect_local_calls(operand, local_names, out);
      break __ring_match25;
    }
    if (__ring_m25._tag === "FieldAccess") {
      const receiver = __ring_m25.receiver;
      return collect_local_calls(receiver, local_names, out);
      break __ring_match25;
    }
    if (__ring_m25._tag === "StructLit") {
      const fields = __ring_m25.fields; const spread = __ring_m25.spread;
      const __ring_iter_29 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
        if (__ring_next_29._tag === "none") break;
        const f = __ring_next_29._0;
        collect_local_calls(f.value, local_names, out);
      }
      __ring_match30: {
        const __ring_m30 = spread;
        if (__ring_m30._tag === "some") {
          const s = __ring_m30._0;
          return collect_local_calls(s, local_names, out);
          break __ring_match30;
        }
        if (__ring_m30._tag === "none") {
          break __ring_match30;
        }
        __match_fail(__ring_m30);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "NamedVariantConstruct") {
      const fields = __ring_m25.fields; const spread = __ring_m25.spread;
      const __ring_iter_30 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_30 = __ListIterator_Iterator.next(__ring_iter_30);
        if (__ring_next_30._tag === "none") break;
        const f = __ring_next_30._0;
        collect_local_calls(f.value, local_names, out);
      }
      __ring_match31: {
        const __ring_m31 = spread;
        if (__ring_m31._tag === "some") {
          const s = __ring_m31._0;
          return collect_local_calls(s, local_names, out);
          break __ring_match31;
        }
        if (__ring_m31._tag === "none") {
          break __ring_match31;
        }
        __match_fail(__ring_m31);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "StringInterp") {
      const parts = __ring_m25.parts;
      const __ring_iter_31 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
        if (__ring_next_31._tag === "none") break;
        const p = __ring_next_31._0;
        __ring_match32: {
          const __ring_m32 = p;
          if (__ring_m32._tag === "Expression") {
            const e = __ring_m32._0;
            collect_local_calls(e, local_names, out);
            break __ring_match32;
          }
          if (__ring_m32._tag === "Literal") {
            break __ring_match32;
          }
          __match_fail(__ring_m32);
        }
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "TryCatch") {
      const body = __ring_m25.body; const arms = __ring_m25.arms;
      collect_local_calls(body, local_names, out);
      const __ring_iter_32 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_32 = __ListIterator_Iterator.next(__ring_iter_32);
        if (__ring_next_32._tag === "none") break;
        const arm = __ring_next_32._0;
        collect_local_calls(arm.body, local_names, out);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "HandleExpr") {
      const body = __ring_m25.body; const handlers = __ring_m25.handlers;
      collect_local_calls(body, local_names, out);
      const __ring_iter_33 = __List_Iterable.iter(handlers);
      while (true) {
        const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
        if (__ring_next_33._tag === "none") break;
        const h = __ring_next_33._0;
        collect_local_calls(h.body, local_names, out);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "Lambda") {
      const body = __ring_m25.body;
      return collect_local_calls(body, local_names, out);
      break __ring_match25;
    }
    if (__ring_m25._tag === "RangeExpr") {
      const start = __ring_m25.start; const end = __ring_m25.end;
      collect_local_calls(start, local_names, out);
      return collect_local_calls(end, local_names, out);
      break __ring_match25;
    }
    if (__ring_m25._tag === "ListLit") {
      const elements = __ring_m25.elements;
      const __ring_iter_34 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_34 = __ListIterator_Iterator.next(__ring_iter_34);
        if (__ring_next_34._tag === "none") break;
        const e = __ring_next_34._0;
        collect_local_calls(e, local_names, out);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "TupleLit") {
      const elements = __ring_m25.elements;
      const __ring_iter_35 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_35 = __ListIterator_Iterator.next(__ring_iter_35);
        if (__ring_next_35._tag === "none") break;
        const e = __ring_next_35._0;
        collect_local_calls(e, local_names, out);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "EffectOp") {
      const args = __ring_m25.args;
      const __ring_iter_36 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_36 = __ListIterator_Iterator.next(__ring_iter_36);
        if (__ring_next_36._tag === "none") break;
        const a = __ring_next_36._0;
        collect_local_calls(a, local_names, out);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "IndexExpr") {
      const receiver = __ring_m25.receiver; const index = __ring_m25.index;
      collect_local_calls(receiver, local_names, out);
      return collect_local_calls(index, local_names, out);
      break __ring_match25;
    }
    break __ring_match25;
  }
}

function is_codegen_value_type(t) {
  __ring_match33: {
    const __ring_m33 = t;
    if (__ring_m33._tag === "IntType") {
      return true;
      break __ring_match33;
    }
    if (__ring_m33._tag === "FloatType") {
      return true;
      break __ring_match33;
    }
    if (__ring_m33._tag === "BoolType") {
      return true;
      break __ring_match33;
    }
    if (__ring_m33._tag === "StrType") {
      return true;
      break __ring_match33;
    }
    return false;
    break __ring_match33;
  }
}

function scan_fn_mut_params(decls, ctx) {
  const __ring_iter_37 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_37 = __ListIterator_Iterator.next(__ring_iter_37);
    if (__ring_next_37._tag === "none") break;
    const decl = __ring_next_37._0;
    __ring_match34: {
      const __ring_m34 = decl;
      if (__ring_m34._tag === "Fn") {
        const name = __ring_m34.name; const params = __ring_m34.params;
        let flags = [];
        const __ring_iter_38 = __List_Iterable.iter(params);
        while (true) {
          const __ring_next_38 = __ListIterator_Iterator.next(__ring_iter_38);
          if (__ring_next_38._tag === "none") break;
          const p = __ring_next_38._0;
          if (((p.name === "self") || (!p.is_mutable))) {
            List_push(flags, false);
          } else {
            List_push(flags, is_codegen_value_type(p.ty));
          }
        }
        _Map_insert(ctx.fn_mut_params, name, flags);
        const qname = codegen_ctx$qualify(ctx, name);
        if ((qname !== name)) {
          _Map_insert(ctx.fn_mut_params, qname, flags);
        }
        break __ring_match34;
      }
      if (__ring_m34._tag === "Impl") {
        const target_type = __ring_m34.target_type; const methods = __ring_m34.methods;
        const __ring_iter_39 = __List_Iterable.iter(methods);
        while (true) {
          const __ring_next_39 = __ListIterator_Iterator.next(__ring_iter_39);
          if (__ring_next_39._tag === "none") break;
          const m = __ring_next_39._0;
          __ring_match35: {
            const __ring_m35 = m;
            if (__ring_m35._tag === "Fn") {
              const mn = __ring_m35.name; const mp = __ring_m35.params;
              let flags = [];
              const __ring_iter_40 = __List_Iterable.iter(mp);
              while (true) {
                const __ring_next_40 = __ListIterator_Iterator.next(__ring_iter_40);
                if (__ring_next_40._tag === "none") break;
                const p = __ring_next_40._0;
                if (((p.name === "self") || (!p.is_mutable))) {
                  List_push(flags, false);
                } else {
                  List_push(flags, is_codegen_value_type(p.ty));
                }
              }
              const ufcs_name = `${codegen_ctx$qualify(ctx, target_type)}_${codegen_ctx$safe_ident(mn)}`;
              _Map_insert(ctx.fn_mut_params, ufcs_name, flags);
              break __ring_match35;
            }
            break __ring_match35;
          }
        }
        break __ring_match34;
      }
      if (__ring_m34._tag === "ModBlock") {
        const mod_decls = __ring_m34.decls;
        scan_fn_mut_params(mod_decls, ctx);
        break __ring_match34;
      }
      if (__ring_m34._tag === "Struct") {
        break __ring_match34;
      }
      if (__ring_m34._tag === "Enum") {
        break __ring_match34;
      }
      if (__ring_m34._tag === "Trait") {
        break __ring_match34;
      }
      if (__ring_m34._tag === "Effect") {
        break __ring_match34;
      }
      if (__ring_m34._tag === "Test") {
        break __ring_match34;
      }
      if (__ring_m34._tag === "ExternFn") {
        break __ring_match34;
      }
      if (__ring_m34._tag === "ExternType") {
        break __ring_match34;
      }
      if (__ring_m34._tag === "TypeAlias") {
        break __ring_match34;
      }
      if (__ring_m34._tag === "Const") {
        break __ring_match34;
      }
      if (__ring_m34._tag === "Sig") {
        break __ring_match34;
      }
      __match_fail(__ring_m34);
    }
  }
}

function collect_local_calls_stmt(stmt, local_names, out) {
  __ring_match36: {
    const __ring_m36 = stmt;
    if (__ring_m36._tag === "Let") {
      const init = __ring_m36.init;
      return collect_local_calls(init, local_names, out);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Var") {
      const init = __ring_m36.init;
      return collect_local_calls(init, local_names, out);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Assign") {
      const target = __ring_m36.target; const value = __ring_m36.value;
      collect_local_calls(target, local_names, out);
      return collect_local_calls(value, local_names, out);
      break __ring_match36;
    }
    if (__ring_m36._tag === "ExprStmt") {
      const expr = __ring_m36.expr;
      return collect_local_calls(expr, local_names, out);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Return") {
      const value = __ring_m36.value;
      __ring_match37: {
        const __ring_m37 = value;
        if (__ring_m37._tag === "some") {
          const v = __ring_m37._0;
          return collect_local_calls(v, local_names, out);
          break __ring_match37;
        }
        if (__ring_m37._tag === "none") {
          break __ring_match37;
        }
        __match_fail(__ring_m37);
      }
      break __ring_match36;
    }
    if (__ring_m36._tag === "While") {
      const condition = __ring_m36.condition; const body = __ring_m36.body;
      collect_local_calls(condition, local_names, out);
      return collect_local_calls(body, local_names, out);
      break __ring_match36;
    }
    if (__ring_m36._tag === "ForIn") {
      const iterable = __ring_m36.iterable; const body = __ring_m36.body;
      collect_local_calls(iterable, local_names, out);
      return collect_local_calls(body, local_names, out);
      break __ring_match36;
    }
    if (__ring_m36._tag === "LetDestructure") {
      const init = __ring_m36.init;
      return collect_local_calls(init, local_names, out);
      break __ring_match36;
    }
    if (__ring_m36._tag === "IfLet") {
      const expr = __ring_m36.expr; const then_block = __ring_m36.then_block; const else_block = __ring_m36.else_block;
      collect_local_calls(expr, local_names, out);
      collect_local_calls(then_block, local_names, out);
      __ring_match38: {
        const __ring_m38 = else_block;
        if (__ring_m38._tag === "some") {
          const eb = __ring_m38._0;
          return collect_local_calls(eb, local_names, out);
          break __ring_match38;
        }
        if (__ring_m38._tag === "none") {
          break __ring_match38;
        }
        __match_fail(__ring_m38);
      }
      break __ring_match36;
    }
    break __ring_match36;
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


export { generate };