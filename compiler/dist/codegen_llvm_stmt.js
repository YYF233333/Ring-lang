import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, effect_op_slot as hir$effect_op_slot, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_Clone as hir$HExpr_Clone, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { RING_TYPEID_CELL as codegen_llvm_ctx$RING_TYPEID_CELL, RING_TYPEID_CLOSURE_ENV as codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, llvm_mangle_fn as codegen_llvm_ctx$llvm_mangle_fn, llvm_mangle_fn_with_prefix as codegen_llvm_ctx$llvm_mangle_fn_with_prefix, llvm_mangle_method as codegen_llvm_ctx$llvm_mangle_method, llvm_resolve_fn as codegen_llvm_ctx$llvm_resolve_fn, llvm_resolve_method as codegen_llvm_ctx$llvm_resolve_method, fresh_name as codegen_llvm_ctx$fresh_name, get_or_declare_runtime_fn as codegen_llvm_ctx$get_or_declare_runtime_fn, get_rt_fn_type as codegen_llvm_ctx$get_rt_fn_type, get_or_assign_typeid as codegen_llvm_ctx$get_or_assign_typeid, get_builtin_typeid as codegen_llvm_ctx$get_builtin_typeid, build_entry_alloca as codegen_llvm_ctx$build_entry_alloca, StructFieldInfo as codegen_llvm_ctx$StructFieldInfo, EnumVariantInfo as codegen_llvm_ctx$EnumVariantInfo, EnumTypeInfo as codegen_llvm_ctx$EnumTypeInfo, LlvmCtx as codegen_llvm_ctx$LlvmCtx, __EnumVariantInfo_Clone as codegen_llvm_ctx$__EnumVariantInfo_Clone, __EnumVariantInfo_Debug as codegen_llvm_ctx$__EnumVariantInfo_Debug } from "./codegen_llvm_ctx.js";
import { gen_llvm_expr as codegen_llvm_expr$gen_llvm_expr } from "./codegen_llvm_expr.js";
import { unbox_to_i1 as codegen_llvm_expr$unbox_to_i1 } from "./codegen_llvm_expr.js";
import { box_int as codegen_llvm_expr$box_int } from "./codegen_llvm_expr.js";
import { box_bool as codegen_llvm_expr$box_bool } from "./codegen_llvm_expr.js";
import { is_boxed_def as codegen_llvm_expr$is_boxed_def } from "./codegen_llvm_expr.js";
import { build_cell_alloc as codegen_llvm_expr$build_cell_alloc } from "./codegen_llvm_expr.js";
import { build_cell_store as codegen_llvm_expr$build_cell_store } from "./codegen_llvm_expr.js";



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

































function discard(v) {
}

function emit_llvm_stmt(ctx, stmt) {
  __ring_match6: {
    const __ring_m6 = stmt;
    if (__ring_m6._tag === "Let") {
      const name = __ring_m6.name; const init = __ring_m6.init;
      const val = codegen_llvm_expr$gen_llvm_expr(ctx, init);
      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, name);
      discard(LLVMBuildStore(ctx.builder, val, alloca));
      return _Map_insert(ctx.named_values, name, alloca);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Var") {
      const name = __ring_m6.name; const def_id = __ring_m6.def_id; const init = __ring_m6.init;
      const val = codegen_llvm_expr$gen_llvm_expr(ctx, init);
      const stored = (codegen_llvm_expr$is_boxed_def(ctx, def_id) ? codegen_llvm_expr$build_cell_alloc(ctx, val) : val);
      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, name);
      discard(LLVMBuildStore(ctx.builder, stored, alloca));
      return _Map_insert(ctx.named_values, name, alloca);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Assign") {
      const target = __ring_m6.target; const value = __ring_m6.value;
      return emit_assign(ctx, target, value);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ExprStmt") {
      const expr = __ring_m6.expr;
      return discard(codegen_llvm_expr$gen_llvm_expr(ctx, expr));
      break __ring_match6;
    }
    if (__ring_m6._tag === "Return") {
      const value = __ring_m6.value;
      return emit_return(ctx, value);
      break __ring_match6;
    }
    if (__ring_m6._tag === "While") {
      const condition = __ring_m6.condition; const body = __ring_m6.body;
      return emit_while(ctx, condition, body);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ForIn") {
      const binding = __ring_m6.binding; const destructure = __ring_m6.destructure; const iterable = __ring_m6.iterable; const body = __ring_m6.body; const iterable_type_name = __ring_m6.iterable_type_name; const iter_type_name = __ring_m6.iter_type_name;
      return emit_for_in(ctx, binding, destructure, iterable, body, iterable_type_name, iter_type_name);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Break") {
      return emit_break(ctx);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Continue") {
      return emit_continue(ctx);
      break __ring_match6;
    }
    if (__ring_m6._tag === "LetDestructure") {
      const pattern = __ring_m6.pattern; const bindings = __ring_m6.bindings; const init = __ring_m6.init;
      return emit_let_destructure(ctx, bindings, init);
      break __ring_match6;
    }
    if (__ring_m6._tag === "IfLet") {
      const pattern = __ring_m6.pattern; const expr = __ring_m6.expr; const then_block = __ring_m6.then_block; const else_block = __ring_m6.else_block;
      return emit_if_let(ctx, pattern, expr, then_block, else_block);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Drop") {
      const name = __ring_m6.name;
      __ring_match7: {
        const __ring_m7 = _Map_get(ctx.named_values, name);
        if (__ring_m7._tag === "some") {
          const var_ptr = __ring_m7._0;
          const val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, var_ptr, codegen_llvm_ctx$fresh_name(ctx, "drop_val"));
          const drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
          const drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
          return discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [val], ""));
          break __ring_match7;
        }
        if (__ring_m7._tag === "none") {
          return eprintln(`[rc-warn] Drop: variable '${name}' not found in named_values`);
          break __ring_match7;
        }
        __match_fail(__ring_m7);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "Dup") {
      const name = __ring_m6.name;
      __ring_match8: {
        const __ring_m8 = _Map_get(ctx.named_values, name);
        if (__ring_m8._tag === "some") {
          const var_ptr = __ring_m8._0;
          const val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, var_ptr, codegen_llvm_ctx$fresh_name(ctx, "dup_val"));
          const dup_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_dup", [ctx.ptr_type], ctx.void_type);
          const dup_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_dup");
          return discard(LLVMBuildCall2(ctx.builder, dup_ty, dup_fn, [val], ""));
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          return eprintln(`[rc-warn] Dup: variable '${name}' not found in named_values`);
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function emit_assign(ctx, target, value) {
  const val = codegen_llvm_expr$gen_llvm_expr(ctx, value);
  __ring_match9: {
    const __ring_m9 = target;
    if (__ring_m9._tag === "Ident") {
      const name = __ring_m9.name; const resolved_name = __ring_m9.resolved_name; const def_id = __ring_m9.def_id;
      const lookup = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return rn; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
      const boxed = codegen_llvm_expr$is_boxed_def(ctx, def_id);
      __ring_match10: {
        const __ring_m10 = _Map_get(ctx.named_values, lookup);
        if (__ring_m10._tag === "some") {
          const alloca = __ring_m10._0;
          if (boxed) {
            const cell_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "cellp"));
            return codegen_llvm_expr$build_cell_store(ctx, cell_ptr, val);
          } else {
            return discard(LLVMBuildStore(ctx.builder, val, alloca));
          }
          break __ring_match10;
        }
        if (__ring_m10._tag === "none") {
          __ring_match11: {
            const __ring_m11 = _Map_get(ctx.named_values, name);
            if (__ring_m11._tag === "some") {
              const alloca = __ring_m11._0;
              if (boxed) {
                const cell_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "cellp"));
                return codegen_llvm_expr$build_cell_store(ctx, cell_ptr, val);
              } else {
                return discard(LLVMBuildStore(ctx.builder, val, alloca));
              }
              break __ring_match11;
            }
            if (__ring_m11._tag === "none") {
              return panic(`LLVM codegen: assign to undefined variable '${name}'`);
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
    if (__ring_m9._tag === "FieldAccess") {
      const receiver = __ring_m9.receiver; const field = __ring_m9.field;
      const recv_val = codegen_llvm_expr$gen_llvm_expr(ctx, receiver);
      const recv_type = hir$hexpr_type(receiver);
      const type_name = (function() {
  const __ring_m = recv_type;
  if (__ring_m._tag === "StructType") { const name = __ring_m.name; return name; }
  return panic("LLVM codegen: field assign on non-struct type");
})();
      __ring_match12: {
        const __ring_m12 = _Map_get(ctx.struct_types, type_name);
        if (__ring_m12._tag === "some") {
          const info = __ring_m12._0;
          let field_idx = (-1);
          const __ring_end2 = List_len(info.field_names);
          for (let i = 0; i < __ring_end2; i++) {
            if ((__ring_index(info.field_names, i) === field)) {
              field_idx = i;
            }
          }
          if ((field_idx < 0)) {
            panic(`LLVM codegen: field '${field}' not found in struct '${type_name}'`);
          }
          const field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, recv_val, field_idx, codegen_llvm_ctx$fresh_name(ctx, "fp"));
          return discard(LLVMBuildStore(ctx.builder, val, field_ptr));
          break __ring_match12;
        }
        if (__ring_m12._tag === "none") {
          return panic(`LLVM codegen: struct type '${type_name}' not registered`);
          break __ring_match12;
        }
        __match_fail(__ring_m12);
      }
      break __ring_match9;
    }
    return panic("LLVM codegen: unsupported assignment target");
    break __ring_match9;
  }
}

function emit_return(ctx, value) {
  __ring_match13: {
    const __ring_m13 = value;
    if (__ring_m13._tag === "some") {
      const v = __ring_m13._0;
      const val = codegen_llvm_expr$gen_llvm_expr(ctx, v);
      discard(LLVMBuildRet(ctx.builder, val));
      break __ring_match13;
    }
    if (__ring_m13._tag === "none") {
      const _null = LLVMConstPointerNull(ctx.ptr_type);
      discard(LLVMBuildRet(ctx.builder, _null));
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
  __ring_match14: {
    const __ring_m14 = ctx.current_fn;
    if (__ring_m14._tag === "some") {
      const f = __ring_m14._0;
      const dead_bb = LLVMAppendBasicBlockInContext(ctx.context, f, "after.ret");
      return LLVMPositionBuilderAtEnd(ctx.builder, dead_bb);
      break __ring_match14;
    }
    if (__ring_m14._tag === "none") {
      break __ring_match14;
    }
    __match_fail(__ring_m14);
  }
}

function emit_while(ctx, condition, body) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: while outside function"); }
  __match_fail(__ring_m);
})();
  const cond_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "while.cond");
  const body_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "while.body");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "while.merge");
  discard(LLVMBuildBr(ctx.builder, cond_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, cond_bb);
  const cond_val = codegen_llvm_expr$gen_llvm_expr(ctx, condition);
  const cond_i1 = codegen_llvm_expr$unbox_to_i1(ctx, cond_val);
  discard(LLVMBuildCondBr(ctx.builder, cond_i1, body_bb, merge_bb));
  const saved_break = ctx.loop_break_bb;
  const saved_continue = ctx.loop_continue_bb;
  ctx.loop_break_bb = Option_some(merge_bb);
  ctx.loop_continue_bb = Option_some(cond_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, body_bb);
  discard(codegen_llvm_expr$gen_llvm_expr(ctx, body));
  discard(LLVMBuildBr(ctx.builder, cond_bb));
  ctx.loop_break_bb = saved_break;
  ctx.loop_continue_bb = saved_continue;
  return LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
}

function emit_for_in(ctx, binding, destructure, iterable, body, iterable_type_name, iter_type_name) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: for-in outside function"); }
  __match_fail(__ring_m);
})();
  __ring_match15: {
    const __ring_m15 = iterable;
    if (__ring_m15._tag === "RangeExpr") {
      const start = __ring_m15.start; const end = __ring_m15.end; const inclusive = __ring_m15.inclusive;
      emit_for_in_range_direct(ctx, binding, start, end, inclusive, body);
      return;
      break __ring_match15;
    }
    break __ring_match15;
  }
  const iter_htype = hir$hexpr_type(iterable);
  const is_range = (function() {
  const __ring_m = iter_htype;
  if (__ring_m._tag === "EnumType") { const name = __ring_m.name; return (name === hir$BUILTIN_RANGE); }
  return false;
})();
  if (is_range) {
    return emit_for_in_range_var(ctx, binding, iterable, body);
  } else {
    return emit_for_in_list(ctx, binding, destructure, iterable, body);
  }
}

function emit_drop_value(ctx, val) {
  const drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
  const drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
  return discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [val], ""));
}

function emit_range_counter_drop(ctx, binding_alloca) {
  const iter_box = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, binding_alloca, codegen_llvm_ctx$fresh_name(ctx, "ibx"));
  return emit_drop_value(ctx, iter_box);
}

function emit_for_in_range_direct(ctx, binding, start, end, inclusive, body) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: for-in range outside function"); }
  __match_fail(__ring_m);
})();
  const start_val = codegen_llvm_expr$gen_llvm_expr(ctx, start);
  const end_val = codegen_llvm_expr$gen_llvm_expr(ctx, end);
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_int");
  const start_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [start_val], codegen_llvm_ctx$fresh_name(ctx, "si"));
  const end_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [end_val], codegen_llvm_ctx$fresh_name(ctx, "ei"));
  emit_drop_value(ctx, start_val);
  emit_drop_value(ctx, end_val);
  const counter_alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "i"));
  discard(LLVMBuildStore(ctx.builder, start_raw, counter_alloca));
  const cond_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "for.cond");
  const body_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "for.body");
  const incr_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "for.incr");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "for.merge");
  discard(LLVMBuildBr(ctx.builder, cond_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, cond_bb);
  const current_i = LLVMBuildLoad2(ctx.builder, ctx.i64_type, counter_alloca, codegen_llvm_ctx$fresh_name(ctx, "ci"));
  const predicate = (inclusive ? 41 : 40);
  const cond = LLVMBuildICmp(ctx.builder, predicate, current_i, end_raw, codegen_llvm_ctx$fresh_name(ctx, "cmp"));
  discard(LLVMBuildCondBr(ctx.builder, cond, body_bb, merge_bb));
  const saved_break = ctx.loop_break_bb;
  const saved_continue = ctx.loop_continue_bb;
  ctx.loop_break_bb = Option_some(merge_bb);
  ctx.loop_continue_bb = Option_some(incr_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, body_bb);
  const boxed_i = codegen_llvm_expr$box_int(ctx, current_i);
  const binding_alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, binding);
  discard(LLVMBuildStore(ctx.builder, boxed_i, binding_alloca));
  _Map_insert(ctx.named_values, binding, binding_alloca);
  discard(codegen_llvm_expr$gen_llvm_expr(ctx, body));
  discard(LLVMBuildBr(ctx.builder, incr_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, incr_bb);
  emit_range_counter_drop(ctx, binding_alloca);
  const current_i2 = LLVMBuildLoad2(ctx.builder, ctx.i64_type, counter_alloca, codegen_llvm_ctx$fresh_name(ctx, "ci"));
  const one = LLVMConstInt(ctx.i64_type, 1, 0);
  const next_i = LLVMBuildAdd(ctx.builder, current_i2, one, codegen_llvm_ctx$fresh_name(ctx, "ni"));
  discard(LLVMBuildStore(ctx.builder, next_i, counter_alloca));
  discard(LLVMBuildBr(ctx.builder, cond_bb));
  ctx.loop_break_bb = saved_break;
  ctx.loop_continue_bb = saved_continue;
  return LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
}

function emit_for_in_range_var(ctx, binding, iterable, body) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: for-in range var outside function"); }
  __match_fail(__ring_m);
})();
  const range_val = codegen_llvm_expr$gen_llvm_expr(ctx, iterable);
  const range_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0);
  const start_slot = LLVMBuildStructGEP2(ctx.builder, range_struct_ty, range_val, 0, codegen_llvm_ctx$fresh_name(ctx, "rs"));
  const start_box = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, start_slot, codegen_llvm_ctx$fresh_name(ctx, "sb"));
  const end_slot = LLVMBuildStructGEP2(ctx.builder, range_struct_ty, range_val, 1, codegen_llvm_ctx$fresh_name(ctx, "re"));
  const end_box = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, end_slot, codegen_llvm_ctx$fresh_name(ctx, "eb"));
  const incl_slot = LLVMBuildStructGEP2(ctx.builder, range_struct_ty, range_val, 2, codegen_llvm_ctx$fresh_name(ctx, "ri"));
  const incl_box = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, incl_slot, codegen_llvm_ctx$fresh_name(ctx, "ib"));
  const unbox_int_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type);
  const unbox_int_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_int");
  const start_raw = LLVMBuildCall2(ctx.builder, unbox_int_ty, unbox_int_fn, [start_box], codegen_llvm_ctx$fresh_name(ctx, "si"));
  const end_raw = LLVMBuildCall2(ctx.builder, unbox_int_ty, unbox_int_fn, [end_box], codegen_llvm_ctx$fresh_name(ctx, "ei"));
  const unbox_bool_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type);
  const unbox_bool_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_bool");
  const incl_raw = LLVMBuildCall2(ctx.builder, unbox_bool_ty, unbox_bool_fn, [incl_box], codegen_llvm_ctx$fresh_name(ctx, "ic"));
  const one = LLVMConstInt(ctx.i64_type, 1, 0);
  const one_minus_incl = LLVMBuildSub(ctx.builder, one, incl_raw, codegen_llvm_ctx$fresh_name(ctx, "omi"));
  const end_bound = LLVMBuildSub(ctx.builder, end_raw, one_minus_incl, codegen_llvm_ctx$fresh_name(ctx, "eb2"));
  const counter_alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "i"));
  discard(LLVMBuildStore(ctx.builder, start_raw, counter_alloca));
  const cond_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "forv.cond");
  const body_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "forv.body");
  const incr_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "forv.incr");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "forv.merge");
  discard(LLVMBuildBr(ctx.builder, cond_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, cond_bb);
  const current_i = LLVMBuildLoad2(ctx.builder, ctx.i64_type, counter_alloca, codegen_llvm_ctx$fresh_name(ctx, "ci"));
  const cond = LLVMBuildICmp(ctx.builder, 41, current_i, end_bound, codegen_llvm_ctx$fresh_name(ctx, "cmp"));
  discard(LLVMBuildCondBr(ctx.builder, cond, body_bb, merge_bb));
  const saved_break = ctx.loop_break_bb;
  const saved_continue = ctx.loop_continue_bb;
  ctx.loop_break_bb = Option_some(merge_bb);
  ctx.loop_continue_bb = Option_some(incr_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, body_bb);
  const boxed_i = codegen_llvm_expr$box_int(ctx, current_i);
  const binding_alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, binding);
  discard(LLVMBuildStore(ctx.builder, boxed_i, binding_alloca));
  _Map_insert(ctx.named_values, binding, binding_alloca);
  discard(codegen_llvm_expr$gen_llvm_expr(ctx, body));
  discard(LLVMBuildBr(ctx.builder, incr_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, incr_bb);
  emit_range_counter_drop(ctx, binding_alloca);
  const current_i2 = LLVMBuildLoad2(ctx.builder, ctx.i64_type, counter_alloca, codegen_llvm_ctx$fresh_name(ctx, "ci"));
  const next_i = LLVMBuildAdd(ctx.builder, current_i2, one, codegen_llvm_ctx$fresh_name(ctx, "ni"));
  discard(LLVMBuildStore(ctx.builder, next_i, counter_alloca));
  discard(LLVMBuildBr(ctx.builder, cond_bb));
  ctx.loop_break_bb = saved_break;
  ctx.loop_continue_bb = saved_continue;
  return LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
}

function emit_for_in_list(ctx, binding, destructure, iterable, body) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: for-in list outside function"); }
  __match_fail(__ring_m);
})();
  const list_val_raw = codegen_llvm_expr$gen_llvm_expr(ctx, iterable);
  const list_val = (function() {
  const __ring_m = hir$hexpr_type(iterable);
  if (__ring_m._tag === "StructType") { const name = __ring_m.name; const type_params = __ring_m.type_params; return ((name === "Set") ? (function() {
  const is_int_elem = ((List_len(type_params) > 0) ? (function() {
  const __ring_m = __ring_index(type_params, 0);
  if (__ring_m._tag === "IntType") { return true; }
  return false;
})() : false);
  const conv_name = (is_int_elem ? "ring_set_int_to_list" : "ring_set_to_list");
  const conv_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, conv_name, [ctx.ptr_type], ctx.ptr_type);
  const conv_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, conv_name);
  return LLVMBuildCall2(ctx.builder, conv_ty, conv_fn, [list_val_raw], codegen_llvm_ctx$fresh_name(ctx, "s2l"));
})() : list_val_raw); }
  return list_val_raw;
})();
  const len_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_len", [ctx.ptr_type], ctx.i64_type);
  const len_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_len");
  const list_len = LLVMBuildCall2(ctx.builder, len_ty, len_fn, [list_val], codegen_llvm_ctx$fresh_name(ctx, "len"));
  const counter_alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "idx"));
  const zero = LLVMConstInt(ctx.i64_type, 0, 0);
  discard(LLVMBuildStore(ctx.builder, zero, counter_alloca));
  const cond_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "forl.cond");
  const body_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "forl.body");
  const incr_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "forl.incr");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "forl.merge");
  discard(LLVMBuildBr(ctx.builder, cond_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, cond_bb);
  const current_idx = LLVMBuildLoad2(ctx.builder, ctx.i64_type, counter_alloca, codegen_llvm_ctx$fresh_name(ctx, "ci"));
  const cond = LLVMBuildICmp(ctx.builder, 40, current_idx, list_len, codegen_llvm_ctx$fresh_name(ctx, "cmp"));
  discard(LLVMBuildCondBr(ctx.builder, cond, body_bb, merge_bb));
  const saved_break = ctx.loop_break_bb;
  const saved_continue = ctx.loop_continue_bb;
  ctx.loop_break_bb = Option_some(merge_bb);
  ctx.loop_continue_bb = Option_some(incr_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, body_bb);
  const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
  const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
  const elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [list_val, current_idx], codegen_llvm_ctx$fresh_name(ctx, "el"));
  __ring_match16: {
    const __ring_m16 = destructure;
    if (__ring_m16._tag === "some") {
      const ds = __ring_m16._0;
      if ((List_len(ds) > 0)) {
        const __ring_end3 = List_len(ds);
        for (let i = 0; i < __ring_end3; i++) {
          __ring_match17: {
            const __ring_m17 = List_get(ds, i);
            if (__ring_m17._tag === "some") {
              const d = __ring_m17._0;
              const idx_val = LLVMConstInt(ctx.i64_type, i, 0);
              const sub_elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [elem, idx_val], codegen_llvm_ctx$fresh_name(ctx, "de"));
              const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, d.name);
              discard(LLVMBuildStore(ctx.builder, sub_elem, alloca));
              _Map_insert(ctx.named_values, d.name, alloca);
              break __ring_match17;
            }
            if (__ring_m17._tag === "none") {
              break __ring_match17;
            }
            __match_fail(__ring_m17);
          }
        }
      } else {
        const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, binding);
        discard(LLVMBuildStore(ctx.builder, elem, alloca));
        _Map_insert(ctx.named_values, binding, alloca);
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "none") {
      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, binding);
      discard(LLVMBuildStore(ctx.builder, elem, alloca));
      _Map_insert(ctx.named_values, binding, alloca);
      break __ring_match16;
    }
    __match_fail(__ring_m16);
  }
  discard(codegen_llvm_expr$gen_llvm_expr(ctx, body));
  discard(LLVMBuildBr(ctx.builder, incr_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, incr_bb);
  const current_idx2 = LLVMBuildLoad2(ctx.builder, ctx.i64_type, counter_alloca, codegen_llvm_ctx$fresh_name(ctx, "ci"));
  const one = LLVMConstInt(ctx.i64_type, 1, 0);
  const next_idx = LLVMBuildAdd(ctx.builder, current_idx2, one, codegen_llvm_ctx$fresh_name(ctx, "ni"));
  discard(LLVMBuildStore(ctx.builder, next_idx, counter_alloca));
  discard(LLVMBuildBr(ctx.builder, cond_bb));
  ctx.loop_break_bb = saved_break;
  ctx.loop_continue_bb = saved_continue;
  return LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
}

function emit_break(ctx) {
  __ring_match18: {
    const __ring_m18 = ctx.loop_break_bb;
    if (__ring_m18._tag === "some") {
      const bb = __ring_m18._0;
      discard(LLVMBuildBr(ctx.builder, bb));
      const current_fn_val = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: break outside function"); }
  __match_fail(__ring_m);
})();
      const dummy_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn_val, "post.break");
      return LLVMPositionBuilderAtEnd(ctx.builder, dummy_bb);
      break __ring_match18;
    }
    if (__ring_m18._tag === "none") {
      break __ring_match18;
    }
    __match_fail(__ring_m18);
  }
}

function emit_continue(ctx) {
  __ring_match19: {
    const __ring_m19 = ctx.loop_continue_bb;
    if (__ring_m19._tag === "some") {
      const bb = __ring_m19._0;
      discard(LLVMBuildBr(ctx.builder, bb));
      const current_fn_val = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: continue outside function"); }
  __match_fail(__ring_m);
})();
      const dummy_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn_val, "post.continue");
      return LLVMPositionBuilderAtEnd(ctx.builder, dummy_bb);
      break __ring_match19;
    }
    if (__ring_m19._tag === "none") {
      break __ring_match19;
    }
    __match_fail(__ring_m19);
  }
}

function emit_let_destructure(ctx, bindings, init) {
  const val = codegen_llvm_expr$gen_llvm_expr(ctx, init);
  const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
  const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
  const __ring_end4 = List_len(bindings);
  for (let i = 0; i < __ring_end4; i++) {
    __ring_match20: {
      const __ring_m20 = List_get(bindings, i);
      if (__ring_m20._tag === "some") {
        const b = __ring_m20._0;
        if ((b.name !== "_")) {
          const idx = LLVMConstInt(ctx.i64_type, i, 0);
          const elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [val, idx], codegen_llvm_ctx$fresh_name(ctx, "dt"));
          const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, b.name);
          discard(LLVMBuildStore(ctx.builder, elem, alloca));
          _Map_insert(ctx.named_values, b.name, alloca);
        }
        break __ring_match20;
      }
      if (__ring_m20._tag === "none") {
        break __ring_match20;
      }
      __match_fail(__ring_m20);
    }
  }
}

function emit_if_let(ctx, pattern, expr, then_block, else_block) {
  const current_fn = (function() {
  const __ring_m = ctx.current_fn;
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: if-let outside function"); }
  __match_fail(__ring_m);
})();
  const scrut_val = codegen_llvm_expr$gen_llvm_expr(ctx, expr);
  const scrut_ty = hir$hexpr_type(expr);
  const then_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "iflet.then");
  const else_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "iflet.else");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "iflet.merge");
  __ring_match21: {
    const __ring_m21 = pattern;
    if (__ring_m21._tag === "Constructor") {
      const name = __ring_m21.name; const fields = __ring_m21.fields;
      const enum_name = (function() {
  const __ring_m = scrut_ty;
  if (__ring_m._tag === "EnumType") { const ename = __ring_m.name; return ename; }
  return "Option";
})();
      __ring_match22: {
        const __ring_m22 = _Map_get(ctx.enum_types, enum_name);
        if (__ring_m22._tag === "some") {
          const enum_info = __ring_m22._0;
          __ring_match23: {
            const __ring_m23 = _Map_get(enum_info.variants, name);
            if (__ring_m23._tag === "some") {
              const vi = __ring_m23._0;
              const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, 0, codegen_llvm_ctx$fresh_name(ctx, "tp"));
              const tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "tag"));
              const expected_tag = LLVMConstInt(ctx.i64_type, vi.tag, 0);
              const cond = LLVMBuildICmp(ctx.builder, 32, tag_val, expected_tag, codegen_llvm_ctx$fresh_name(ctx, "eq"));
              discard(LLVMBuildCondBr(ctx.builder, cond, then_bb, else_bb));
              LLVMPositionBuilderAtEnd(ctx.builder, then_bb);
              const __ring_end5 = List_len(fields);
              for (let i = 0; i < __ring_end5; i++) {
                __ring_match24: {
                  const __ring_m24 = List_get(fields, i);
                  if (__ring_m24._tag === "some") {
                    const fp = __ring_m24._0;
                    __ring_match25: {
                      const __ring_m25 = fp;
                      if (__ring_m25._tag === "Binding") {
                        const bname = __ring_m25.name;
                        const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                        const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                        const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                        discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                        _Map_insert(ctx.named_values, bname, alloca);
                        break __ring_match25;
                      }
                      break __ring_match25;
                    }
                    break __ring_match24;
                  }
                  if (__ring_m24._tag === "none") {
                    break __ring_match24;
                  }
                  __match_fail(__ring_m24);
                }
              }
              discard(codegen_llvm_expr$gen_llvm_expr(ctx, then_block));
              discard(LLVMBuildBr(ctx.builder, merge_bb));
              LLVMPositionBuilderAtEnd(ctx.builder, else_bb);
              __ring_match26: {
                const __ring_m26 = else_block;
                if (__ring_m26._tag === "some") {
                  const eb = __ring_m26._0;
                  discard(codegen_llvm_expr$gen_llvm_expr(ctx, eb));
                  break __ring_match26;
                }
                if (__ring_m26._tag === "none") {
                  break __ring_match26;
                }
                __match_fail(__ring_m26);
              }
              discard(LLVMBuildBr(ctx.builder, merge_bb));
              return LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
              break __ring_match23;
            }
            if (__ring_m23._tag === "none") {
              discard(LLVMBuildBr(ctx.builder, then_bb));
              LLVMPositionBuilderAtEnd(ctx.builder, then_bb);
              discard(codegen_llvm_expr$gen_llvm_expr(ctx, then_block));
              discard(LLVMBuildBr(ctx.builder, merge_bb));
              LLVMPositionBuilderAtEnd(ctx.builder, else_bb);
              discard(LLVMBuildBr(ctx.builder, merge_bb));
              return LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
              break __ring_match23;
            }
            __match_fail(__ring_m23);
          }
          break __ring_match22;
        }
        if (__ring_m22._tag === "none") {
          discard(LLVMBuildBr(ctx.builder, then_bb));
          LLVMPositionBuilderAtEnd(ctx.builder, then_bb);
          discard(codegen_llvm_expr$gen_llvm_expr(ctx, then_block));
          discard(LLVMBuildBr(ctx.builder, merge_bb));
          LLVMPositionBuilderAtEnd(ctx.builder, else_bb);
          discard(LLVMBuildBr(ctx.builder, merge_bb));
          return LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
          break __ring_match22;
        }
        __match_fail(__ring_m22);
      }
      break __ring_match21;
    }
    discard(LLVMBuildBr(ctx.builder, then_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, then_bb);
    discard(codegen_llvm_expr$gen_llvm_expr(ctx, then_block));
    discard(LLVMBuildBr(ctx.builder, merge_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, else_bb);
    __ring_match27: {
      const __ring_m27 = else_block;
      if (__ring_m27._tag === "some") {
        const eb = __ring_m27._0;
        discard(codegen_llvm_expr$gen_llvm_expr(ctx, eb));
        break __ring_match27;
      }
      if (__ring_m27._tag === "none") {
        break __ring_match27;
      }
      __match_fail(__ring_m27);
    }
    discard(LLVMBuildBr(ctx.builder, merge_bb));
    return LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
    break __ring_match21;
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


export { emit_llvm_stmt };