import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { dict_instance_name as hir$dict_instance_name, variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, effect_op_slot as hir$effect_op_slot, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, collect_extern_type_names as hir$collect_extern_type_names, is_extern_handle_type as hir$is_extern_handle_type, is_rc_excluded_type as hir$is_rc_excluded_type, type_contains_extern_handle as hir$type_contains_extern_handle, is_borrow_returning_call as hir$is_borrow_returning_call, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, HDictDef as hir$HDictDef, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { RING_TYPEID_CELL as codegen_llvm_ctx$RING_TYPEID_CELL, RING_TYPEID_CLOSURE_ENV as codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, RING_TYPEID_DICT_STATIC as codegen_llvm_ctx$RING_TYPEID_DICT_STATIC, RING_TYPEID_DICT_DYN as codegen_llvm_ctx$RING_TYPEID_DICT_DYN, llvm_mangle_fn as codegen_llvm_ctx$llvm_mangle_fn, llvm_mangle_fn_with_prefix as codegen_llvm_ctx$llvm_mangle_fn_with_prefix, llvm_mangle_method as codegen_llvm_ctx$llvm_mangle_method, llvm_resolve_fn as codegen_llvm_ctx$llvm_resolve_fn, llvm_resolve_method as codegen_llvm_ctx$llvm_resolve_method, fresh_name as codegen_llvm_ctx$fresh_name, get_or_declare_runtime_fn as codegen_llvm_ctx$get_or_declare_runtime_fn, get_rt_fn_type as codegen_llvm_ctx$get_rt_fn_type, get_or_assign_typeid as codegen_llvm_ctx$get_or_assign_typeid, get_builtin_typeid as codegen_llvm_ctx$get_builtin_typeid, build_entry_alloca as codegen_llvm_ctx$build_entry_alloca, StructFieldInfo as codegen_llvm_ctx$StructFieldInfo, EnumVariantInfo as codegen_llvm_ctx$EnumVariantInfo, EnumTypeInfo as codegen_llvm_ctx$EnumTypeInfo, LlvmCtx as codegen_llvm_ctx$LlvmCtx, __EnumVariantInfo_Clone as codegen_llvm_ctx$__EnumVariantInfo_Clone, __EnumVariantInfo_Debug as codegen_llvm_ctx$__EnumVariantInfo_Debug } from "./codegen_llvm_ctx.js";
import { emit_llvm_stmt as codegen_llvm_stmt$emit_llvm_stmt } from "./codegen_llvm_stmt.js";
import { safe_ident as codegen_ctx$safe_ident, new_codegen_ctx as codegen_ctx$new_codegen_ctx, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, push_indent as codegen_ctx$push_indent, pop_indent as codegen_ctx$pop_indent, is_imported_name as codegen_ctx$is_imported_name, qualify as codegen_ctx$qualify, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";



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
























































function is_int_keyed_map(ty) {
  __ring_match6: {
    const __ring_m6 = ty;
    if (__ring_m6._tag === "StructType") {
      const name = __ring_m6.name; const type_params = __ring_m6.type_params;
      if (((name === "Map") ? (List_len(type_params) > 0) : false)) {
        __ring_match7: {
          const __ring_m7 = __ring_index(type_params, 0);
          if (__ring_m7._tag === "IntType") {
            return true;
            break __ring_match7;
          }
          return false;
          break __ring_match7;
        }
      } else {
        return false;
      }
      break __ring_match6;
    }
    return false;
    break __ring_match6;
  }
}

function is_int_set(ty) {
  __ring_match8: {
    const __ring_m8 = ty;
    if (__ring_m8._tag === "StructType") {
      const name = __ring_m8.name; const type_params = __ring_m8.type_params;
      if (((name === "Set") ? (List_len(type_params) > 0) : false)) {
        __ring_match9: {
          const __ring_m9 = __ring_index(type_params, 0);
          if (__ring_m9._tag === "IntType") {
            return true;
            break __ring_match9;
          }
          return false;
          break __ring_match9;
        }
      } else {
        return false;
      }
      break __ring_match8;
    }
    return false;
    break __ring_match8;
  }
}

function gen_llvm_expr(ctx, expr) {
  __ring_match10: {
    const __ring_m10 = expr;
    if (__ring_m10._tag === "IntLit") {
      const value = __ring_m10.value;
      return gen_int_lit(ctx, value);
      break __ring_match10;
    }
    if (__ring_m10._tag === "FloatLit") {
      const value = __ring_m10.value;
      return gen_float_lit(ctx, value);
      break __ring_match10;
    }
    if (__ring_m10._tag === "StrLit") {
      const value = __ring_m10.value;
      return gen_str_lit(ctx, value);
      break __ring_match10;
    }
    if (__ring_m10._tag === "BoolLit") {
      const value = __ring_m10.value;
      return gen_bool_lit(ctx, value);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Ident") {
      const name = __ring_m10.name; const resolved_name = __ring_m10.resolved_name; const def_id = __ring_m10.def_id; const dict_closure_dicts = __ring_m10.dict_closure_dicts; const ty = __ring_m10.ty;
      return gen_ident(ctx, name, resolved_name, def_id, dict_closure_dicts, ty);
      break __ring_match10;
    }
    if (__ring_m10._tag === "BinOp") {
      const op = __ring_m10.op; const left = __ring_m10.left; const right = __ring_m10.right; const eq_dispatch = __ring_m10.eq_dispatch; const ord_dispatch = __ring_m10.ord_dispatch; const ty = __ring_m10.ty;
      return gen_binop(ctx, op, left, right, eq_dispatch, ord_dispatch, ty);
      break __ring_match10;
    }
    if (__ring_m10._tag === "UnaryOp") {
      const op = __ring_m10.op; const operand = __ring_m10.operand; const ty = __ring_m10.ty;
      return gen_unaryop(ctx, op, operand, ty);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Call") {
      const callee = __ring_m10.callee; const args = __ring_m10.args; const resolved_dicts = __ring_m10.resolved_dicts; const dict_dispatch = __ring_m10.dict_dispatch; const ty = __ring_m10.ty; const effects = __ring_m10.effects;
      return gen_call(ctx, callee, args, resolved_dicts, dict_dispatch, ty, effects);
      break __ring_match10;
    }
    if (__ring_m10._tag === "DictConstruct") {
      const base_dict = __ring_m10.base_dict; const trait_name = __ring_m10.trait_name; const inner = __ring_m10.inner;
      return build_wrapped_dict(ctx, base_dict, trait_name, inner);
      break __ring_match10;
    }
    if (__ring_m10._tag === "FieldAccess") {
      const receiver = __ring_m10.receiver; const field = __ring_m10.field; const ty = __ring_m10.ty;
      return gen_field_access(ctx, receiver, field, ty);
      break __ring_match10;
    }
    if (__ring_m10._tag === "StructLit") {
      const name = __ring_m10.name; const fields = __ring_m10.fields; const spread = __ring_m10.spread;
      return gen_struct_lit(ctx, name, fields, spread);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Block") {
      const stmts = __ring_m10.stmts; const tail = __ring_m10.tail;
      return gen_block(ctx, stmts, tail);
      break __ring_match10;
    }
    if (__ring_m10._tag === "IfExpr") {
      const condition = __ring_m10.condition; const then_branch = __ring_m10.then_branch; const else_branch = __ring_m10.else_branch;
      return gen_if_expr(ctx, condition, then_branch, else_branch);
      break __ring_match10;
    }
    if (__ring_m10._tag === "StringInterp") {
      const parts = __ring_m10.parts;
      return gen_string_interp(ctx, parts);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Lambda") {
      const params = __ring_m10.params; const return_type = __ring_m10.return_type; const body = __ring_m10.body; const ty = __ring_m10.ty;
      return gen_lambda(ctx, params, return_type, body, ty);
      break __ring_match10;
    }
    if (__ring_m10._tag === "MatchExpr") {
      const scrutinee = __ring_m10.scrutinee; const arms = __ring_m10.arms; const ty = __ring_m10.ty;
      return gen_match_expr(ctx, scrutinee, arms, ty);
      break __ring_match10;
    }
    if (__ring_m10._tag === "NamedVariantConstruct") {
      const enum_name = __ring_m10.enum_name; const variant_name = __ring_m10.variant_name; const fields = __ring_m10.fields;
      return gen_named_variant_construct(ctx, enum_name, variant_name, fields);
      break __ring_match10;
    }
    if (__ring_m10._tag === "TryCatch") {
      const body = __ring_m10.body; const arms = __ring_m10.arms;
      return gen_try_catch(ctx, body, arms);
      break __ring_match10;
    }
    if (__ring_m10._tag === "HandleExpr") {
      const body = __ring_m10.body; const handlers = __ring_m10.handlers;
      return gen_handle_expr(ctx, body, handlers);
      break __ring_match10;
    }
    if (__ring_m10._tag === "EffectOp") {
      const effect_name = __ring_m10.effect_name; const op_name = __ring_m10.op_name; const args = __ring_m10.args;
      return gen_effect_op(ctx, effect_name, op_name, args);
      break __ring_match10;
    }
    if (__ring_m10._tag === "RangeExpr") {
      const start = __ring_m10.start; const end = __ring_m10.end; const inclusive = __ring_m10.inclusive;
      return gen_range_expr(ctx, start, end, inclusive);
      break __ring_match10;
    }
    if (__ring_m10._tag === "ListLit") {
      const elements = __ring_m10.elements;
      return gen_list_lit(ctx, elements);
      break __ring_match10;
    }
    if (__ring_m10._tag === "TupleLit") {
      const elements = __ring_m10.elements;
      return gen_tuple_lit(ctx, elements);
      break __ring_match10;
    }
    if (__ring_m10._tag === "IndexExpr") {
      const receiver = __ring_m10.receiver; const index = __ring_m10.index; const ty = __ring_m10.ty;
      return gen_index_expr(ctx, receiver, index, ty);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Clone") {
      const inner = __ring_m10.inner;
      return gen_clone(ctx, inner);
      break __ring_match10;
    }
    __match_fail(__ring_m10);
  }
}

function gen_clone(ctx, inner) {
  const val = gen_llvm_expr(ctx, inner);
  return gen_dup_value(ctx, val);
}

function gen_int_lit(ctx, value) {
  const raw = LLVMConstInt(ctx.i64_type, value, 1);
  const shifted = LLVMBuildShl(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "sh"));
  const tagged = LLVMBuildOr(ctx.builder, shifted, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "tg"));
  return LLVMBuildIntToPtr(ctx.builder, tagged, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "int"));
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
  const val = (value ? LLVMConstInt(ctx.i64_type, 3, 0) : LLVMConstInt(ctx.i64_type, 1, 0));
  return LLVMBuildIntToPtr(ctx.builder, val, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "bool"));
}

function is_boxed_def(ctx, def_id) {
  __ring_match11: {
    const __ring_m11 = def_id;
    if (__ring_m11._tag === "some") {
      const did = __ring_m11._0;
      return _Set_contains(ctx.boxed_vars, did, __Int_Eq);
      break __ring_match11;
    }
    if (__ring_m11._tag === "none") {
      return false;
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
}

function cell_struct_ty(ctx) {
  return LLVMStructTypeInContext(ctx.context, [ctx.ptr_type], 0);
}

function build_cell_alloc(ctx, init_val) {
  const cell_ty = cell_struct_ty(ctx);
  const size = LLVMSizeOf(cell_ty);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const typeid_val = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$RING_TYPEID_CELL, 0);
  const cell_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, typeid_val], codegen_llvm_ctx$fresh_name(ctx, "cell"));
  const value_slot = LLVMBuildStructGEP2(ctx.builder, cell_ty, cell_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "cellv"));
  discard(LLVMBuildStore(ctx.builder, init_val, value_slot));
  return cell_ptr;
}

function build_cell_load(ctx, cell_ptr, name) {
  const cell_ty = cell_struct_ty(ctx);
  const value_slot = LLVMBuildStructGEP2(ctx.builder, cell_ty, cell_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "cellr"));
  return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, value_slot, codegen_llvm_ctx$fresh_name(ctx, name));
}

function build_cell_store(ctx, cell_ptr, new_val) {
  const cell_ty = cell_struct_ty(ctx);
  const value_slot = LLVMBuildStructGEP2(ctx.builder, cell_ty, cell_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "cellw"));
  return discard(LLVMBuildStore(ctx.builder, new_val, value_slot));
}

function gen_ident(ctx, name, resolved_name, def_id, dict_closure_dicts, ty) {
  __ring_match12: {
    const __ring_m12 = dict_closure_dicts;
    if (__ring_m12._tag === "some") {
      const dicts = __ring_m12._0;
      if ((List_len(dicts) > 0)) {
        const lk = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return rn; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
        return gen_dict_closure_wrapper(ctx, lk, name, dicts, ty);
      }
      break __ring_match12;
    }
    if (__ring_m12._tag === "none") {
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
  const lookup_name = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return rn; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
  const boxed = is_boxed_def(ctx, def_id);
  __ring_match13: {
    const __ring_m13 = _Map_get(ctx.named_values, lookup_name);
    if (__ring_m13._tag === "some") {
      const alloca = __ring_m13._0;
      const cur = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, lookup_name));
      if (boxed) {
        return build_cell_load(ctx, cur, lookup_name);
      } else {
        return cur;
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "none") {
      __ring_match14: {
        const __ring_m14 = _Map_get(ctx.named_values, name);
        if (__ring_m14._tag === "some") {
          const alloca = __ring_m14._0;
          const cur = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, name));
          if (boxed) {
            return build_cell_load(ctx, cur, name);
          } else {
            return cur;
          }
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          const mangled_resolved = codegen_llvm_ctx$llvm_resolve_fn(ctx, lookup_name);
          __ring_match15: {
            const __ring_m15 = _Map_get(ctx.functions, mangled_resolved);
            if (__ring_m15._tag === "some") {
              const fn_val = __ring_m15._0;
              return call_zero_arg_or_return(ctx, fn_val, mangled_resolved);
              break __ring_match15;
            }
            if (__ring_m15._tag === "none") {
              const mangled_bare = codegen_llvm_ctx$llvm_mangle_fn(name);
              __ring_match16: {
                const __ring_m16 = _Map_get(ctx.functions, mangled_bare);
                if (__ring_m16._tag === "some") {
                  const fn_val = __ring_m16._0;
                  return call_zero_arg_or_return(ctx, fn_val, mangled_bare);
                  break __ring_match16;
                }
                if (__ring_m16._tag === "none") {
                  const mangled_name_resolved = codegen_llvm_ctx$llvm_resolve_fn(ctx, name);
                  __ring_match17: {
                    const __ring_m17 = _Map_get(ctx.functions, mangled_name_resolved);
                    if (__ring_m17._tag === "some") {
                      const fn_val = __ring_m17._0;
                      return call_zero_arg_or_return(ctx, fn_val, mangled_name_resolved);
                      break __ring_match17;
                    }
                    if (__ring_m17._tag === "none") {
                      const mangled_lu = codegen_llvm_ctx$llvm_mangle_fn(lookup_name);
                      __ring_match18: {
                        const __ring_m18 = _Map_get(ctx.functions, mangled_lu);
                        if (__ring_m18._tag === "some") {
                          const fn_val = __ring_m18._0;
                          return call_zero_arg_or_return(ctx, fn_val, mangled_lu);
                          break __ring_match18;
                        }
                        if (__ring_m18._tag === "none") {
                          const found = find_fn_precise(ctx, name);
                          __ring_match19: {
                            const __ring_m19 = found;
                            if (__ring_m19._tag === "some") {
                              const fi = __ring_m19._0;
                              return call_zero_arg_or_return(ctx, fi.fn_val, fi.fn_mangled);
                              break __ring_match19;
                            }
                            if (__ring_m19._tag === "none") {
                              const found2 = find_fn_precise(ctx, lookup_name);
                              __ring_match20: {
                                const __ring_m20 = found2;
                                if (__ring_m20._tag === "some") {
                                  const fi2 = __ring_m20._0;
                                  return call_zero_arg_or_return(ctx, fi2.fn_val, fi2.fn_mangled);
                                  break __ring_match20;
                                }
                                if (__ring_m20._tag === "none") {
                                  return panic(`LLVM codegen: undefined variable '${name}' (resolved: '${lookup_name}')`);
                                  break __ring_match20;
                                }
                                __match_fail(__ring_m20);
                              }
                              break __ring_match19;
                            }
                            __match_fail(__ring_m19);
                          }
                          break __ring_match18;
                        }
                        __match_fail(__ring_m18);
                      }
                      break __ring_match17;
                    }
                    __match_fail(__ring_m17);
                  }
                  break __ring_match16;
                }
                __match_fail(__ring_m16);
              }
              break __ring_match15;
            }
            __match_fail(__ring_m15);
          }
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
}

function call_zero_arg_or_return(ctx, fn_val, mangled) {
  __ring_match21: {
    const __ring_m21 = _Map_get(ctx.fn_types, mangled);
    if (__ring_m21._tag === "some") {
      const fn_ty = __ring_m21._0;
      const param_count = LLVMCountParams(fn_val);
      if ((param_count === 0)) {
        return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, [], codegen_llvm_ctx$fresh_name(ctx, "ctor"));
      } else {
        return fn_val;
      }
      break __ring_match21;
    }
    if (__ring_m21._tag === "none") {
      return fn_val;
      break __ring_match21;
    }
    __match_fail(__ring_m21);
  }
}

function gen_dict_closure_wrapper(ctx, lookup_name, name, dict_names, ty) {
  const mangled = codegen_llvm_ctx$llvm_resolve_fn(ctx, lookup_name);
  const found = find_function_in_ctx(ctx, mangled, name);
  const fn_info = (function() {
  const __ring_m = found;
  if (__ring_m._tag === "some") { const fi = __ring_m._0; return fi; }
  if (__ring_m._tag === "none") { return panic(`LLVM codegen: dict-closure wrapper: function '${name}' not found`); }
  __match_fail(__ring_m);
})();
  const real_fn = fn_info.fn_val;
  const real_fn_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, fn_info.fn_mangled);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return panic(`LLVM codegen: dict-closure wrapper: fn type not found for ${fn_info.fn_mangled}`); }
  __match_fail(__ring_m);
})();
  const param_count = (function() {
  const __ring_m = ty;
  if (__ring_m._tag === "FnType") { const params = __ring_m.params; return List_len(params); }
  return 0;
})();
  let dict_vals = [];
  const __ring_iter_2 = __List_Iterable.iter(dict_names);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const dn = __ring_next_2._0;
    List_push(dict_vals, resolve_dict_ref(ctx, hir$DictRef_Simple(dn)));
  }
  let ev_vals = [];
  __ring_match22: {
    const __ring_m22 = _Map_get(ctx.fn_evidence_params, fn_info.fn_mangled);
    if (__ring_m22._tag === "some") {
      const ev_params = __ring_m22._0;
      const __ring_iter_3 = __List_Iterable.iter(ev_params);
      while (true) {
        const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
        if (__ring_next_3._tag === "none") break;
        const ep = __ring_next_3._0;
        List_push(ev_vals, lookup_evidence(ctx, ep));
      }
      break __ring_match22;
    }
    if (__ring_m22._tag === "none") {
      break __ring_match22;
    }
    __match_fail(__ring_m22);
  }
  const captured_count = (List_len(dict_vals) + List_len(ev_vals));
  let env_elem_types = [ctx.i64_type];
  const __ring_end4 = captured_count;
  for (let i = 0; i < __ring_end4; i++) {
    List_push(env_elem_types, ctx.ptr_type);
  }
  const env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0);
  const thunk_name = codegen_llvm_ctx$fresh_name(ctx, "ring_dictwrap_");
  let thunk_param_types = [ctx.ptr_type];
  const __ring_end5 = param_count;
  for (let i = 0; i < __ring_end5; i++) {
    List_push(thunk_param_types, ctx.ptr_type);
  }
  const thunk_ty = LLVMFunctionType(ctx.ptr_type, thunk_param_types, 0);
  const thunk_fn = LLVMAddFunction(ctx.module, thunk_name, thunk_ty);
  const saved_fn = ctx.current_fn;
  const saved_named = ctx.named_values;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(thunk_fn);
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, thunk_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const env_param = LLVMGetParam(thunk_fn, 0);
  let call_args = [];
  const __ring_end6 = param_count;
  for (let i = 0; i < __ring_end6; i++) {
    List_push(call_args, LLVMGetParam(thunk_fn, (i + 1)));
  }
  const __ring_end7 = captured_count;
  for (let i = 0; i < __ring_end7; i++) {
    const slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_param, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ws"));
    List_push(call_args, LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot, codegen_llvm_ctx$fresh_name(ctx, "wd")));
  }
  const ret = LLVMBuildCall2(ctx.builder, real_fn_ty, real_fn, call_args, codegen_llvm_ctx$fresh_name(ctx, "wcall"));
  discard(LLVMBuildRet(ctx.builder, ret));
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
  LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const env_size = LLVMSizeOf(env_ty);
  const env_typeid = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, 0);
  const env_alloc = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [env_size, env_typeid], codegen_llvm_ctx$fresh_name(ctx, "wenv"));
  const count_slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, 0, codegen_llvm_ctx$fresh_name(ctx, "wcnt"));
  discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, List_len(dict_vals), 0), count_slot));
  let slot_idx = 0;
  const __ring_iter_8 = __List_Iterable.iter(dict_vals);
  while (true) {
    const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
    if (__ring_next_8._tag === "none") break;
    const dv = __ring_next_8._0;
    discard(gen_dup_value(ctx, dv));
    const slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, (slot_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "wstore"));
    discard(LLVMBuildStore(ctx.builder, dv, slot));
    slot_idx = (slot_idx + 1);
  }
  const __ring_iter_9 = __List_Iterable.iter(ev_vals);
  while (true) {
    const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
    if (__ring_next_9._tag === "none") break;
    const ev = __ring_next_9._0;
    const slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, (slot_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "wstore"));
    discard(LLVMBuildStore(ctx.builder, ev, slot));
    slot_idx = (slot_idx + 1);
  }
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const closure_size = LLVMSizeOf(closure_ty);
  const closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0);
  const closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], codegen_llvm_ctx$fresh_name(ctx, "wcls"));
  const fp_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "wfp"));
  discard(LLVMBuildStore(ctx.builder, thunk_fn, fp_slot));
  const ep_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "wep"));
  discard(LLVMBuildStore(ctx.builder, env_alloc, ep_slot));
  return closure_ptr;
}

function is_int_type(ty) {
  __ring_match23: {
    const __ring_m23 = ty;
    if (__ring_m23._tag === "IntType") {
      return true;
      break __ring_match23;
    }
    return false;
    break __ring_match23;
  }
}

function is_float_type(ty) {
  __ring_match24: {
    const __ring_m24 = ty;
    if (__ring_m24._tag === "FloatType") {
      return true;
      break __ring_match24;
    }
    return false;
    break __ring_match24;
  }
}

function is_str_type(ty) {
  __ring_match25: {
    const __ring_m25 = ty;
    if (__ring_m25._tag === "StrType") {
      return true;
      break __ring_match25;
    }
    return false;
    break __ring_match25;
  }
}

function is_bool_type(ty) {
  __ring_match26: {
    const __ring_m26 = ty;
    if (__ring_m26._tag === "BoolType") {
      return true;
      break __ring_match26;
    }
    return false;
    break __ring_match26;
  }
}

function operand_type_from_binop(left) {
  return hir$hexpr_type(left);
}

function gen_binop(ctx, op, left, right, eq_dispatch, ord_dispatch, result_ty) {
  const op_type = operand_type_from_binop(left);
  __ring_match27: {
    const __ring_m27 = op;
    if (__ring_m27._tag === "And") {
      panic("LLVM codegen: BinOp::And must be lowered by andor_lower");
      break __ring_match27;
    }
    if (__ring_m27._tag === "Or") {
      panic("LLVM codegen: BinOp::Or must be lowered by andor_lower");
      break __ring_match27;
    }
    break __ring_match27;
  }
  const is_eq_op = (function() {
  const __ring_m = op;
  if (__ring_m._tag === "Eq") { return true; }
  if (__ring_m._tag === "Neq") { return true; }
  return false;
})();
  const is_ord_op = (function() {
  const __ring_m = op;
  if (__ring_m._tag === "Lt") { return true; }
  if (__ring_m._tag === "Lte") { return true; }
  if (__ring_m._tag === "Gt") { return true; }
  if (__ring_m._tag === "Gte") { return true; }
  return false;
})();
  if (is_eq_op) {
    __ring_match28: {
      const __ring_m28 = eq_dispatch;
      if (__ring_m28._tag === "some") {
        const d = __ring_m28._0;
        __ring_match29: {
          const __ring_m29 = d;
          if (__ring_m29._tag === "Builtin") {
            break __ring_match29;
          }
          return gen_eq_dispatch_llvm(ctx, op, left, right, d);
          break __ring_match29;
        }
        break __ring_match28;
      }
      if (__ring_m28._tag === "none") {
        break __ring_match28;
      }
      __match_fail(__ring_m28);
    }
  }
  if (is_ord_op) {
    __ring_match30: {
      const __ring_m30 = ord_dispatch;
      if (__ring_m30._tag === "some") {
        const d = __ring_m30._0;
        __ring_match31: {
          const __ring_m31 = d;
          if (__ring_m31._tag === "Builtin") {
            break __ring_match31;
          }
          return gen_ord_dispatch_llvm(ctx, op, left, right, d);
          break __ring_match31;
        }
        break __ring_match30;
      }
      if (__ring_m30._tag === "none") {
        break __ring_match30;
      }
      __match_fail(__ring_m30);
    }
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

function resolve_dispatch_dict(ctx, dispatch) {
  __ring_match32: {
    const __ring_m32 = dispatch;
    if (__ring_m32._tag === "Dict") {
      const param = __ring_m32.param;
      __ring_match33: {
        const __ring_m33 = _Map_get(ctx.named_values, param);
        if (__ring_m33._tag === "some") {
          const alloca = __ring_m33._0;
          return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "dp"));
          break __ring_match33;
        }
        if (__ring_m33._tag === "none") {
          return LLVMConstPointerNull(ctx.ptr_type);
          break __ring_match33;
        }
        __match_fail(__ring_m33);
      }
      break __ring_match32;
    }
    if (__ring_m32._tag === "Direct") {
      const dict = __ring_m32.dict;
      return resolve_dict_ref(ctx, hir$DictRef_Simple(dict));
      break __ring_match32;
    }
    if (__ring_m32._tag === "Builtin") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match32;
    }
    __match_fail(__ring_m32);
  }
}

function load_dict_method(ctx, dict_ptr, slot) {
  const dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0);
  const slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (slot + 1), codegen_llvm_ctx$fresh_name(ctx, "ms"));
  return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, codegen_llvm_ctx$fresh_name(ctx, "mc"));
}

function gen_eq_dispatch_llvm(ctx, op, left, right, dispatch) {
  const lhs = gen_llvm_expr(ctx, left);
  const rhs = gen_llvm_expr(ctx, right);
  const dict_ptr = resolve_dispatch_dict(ctx, dispatch);
  const eq_closure = load_dict_method(ctx, dict_ptr, 0);
  const result = gen_closure_call(ctx, eq_closure, [lhs, rhs]);
  __ring_match34: {
    const __ring_m34 = op;
    if (__ring_m34._tag === "Neq") {
      const raw = unbox_int(ctx, result);
      const drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
      const drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
      discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [result], ""));
      const one = LLVMConstInt(ctx.i64_type, 1, 0);
      const neg = LLVMBuildSub(ctx.builder, one, raw, codegen_llvm_ctx$fresh_name(ctx, "neg"));
      return box_bool(ctx, neg);
      break __ring_match34;
    }
    return result;
    break __ring_match34;
  }
}

function gen_ord_dispatch_llvm(ctx, op, left, right, dispatch) {
  const lhs = gen_llvm_expr(ctx, left);
  const rhs = gen_llvm_expr(ctx, right);
  const dict_ptr = resolve_dispatch_dict(ctx, dispatch);
  const cmp_closure = load_dict_method(ctx, dict_ptr, 0);
  const cmp_result = gen_closure_call(ctx, cmp_closure, [lhs, rhs]);
  const raw = unbox_int(ctx, cmp_result);
  const cmp_drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
  const cmp_drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
  discard(LLVMBuildCall2(ctx.builder, cmp_drop_ty, cmp_drop_fn, [cmp_result], ""));
  const zero = LLVMConstInt(ctx.i64_type, 0, 0);
  const pred = (function() {
  const __ring_m = op;
  if (__ring_m._tag === "Lt") { return 40; }
  if (__ring_m._tag === "Lte") { return 41; }
  if (__ring_m._tag === "Gt") { return 38; }
  if (__ring_m._tag === "Gte") { return 39; }
  return 32;
})();
  const cmp = LLVMBuildICmp(ctx.builder, pred, raw, zero, codegen_llvm_ctx$fresh_name(ctx, "ocmp"));
  const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
  return box_bool(ctx, ext);
}

function gen_int_binop(ctx, op, lhs, rhs) {
  const lhs_raw = unbox_int(ctx, lhs);
  const rhs_raw = unbox_int(ctx, rhs);
  __ring_match35: {
    const __ring_m35 = op;
    if (__ring_m35._tag === "Add") {
      const result = LLVMBuildAdd(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "add"));
      return box_int(ctx, result);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Sub") {
      const result = LLVMBuildSub(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "sub"));
      return box_int(ctx, result);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Mul") {
      const result = LLVMBuildMul(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "mul"));
      return box_int(ctx, result);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Div") {
      const result = LLVMBuildSDiv(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "div"));
      return box_int(ctx, result);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Mod") {
      const result = LLVMBuildSRem(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "mod"));
      return box_int(ctx, result);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Eq") {
      const cmp = LLVMBuildICmp(ctx.builder, 32, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "eq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Neq") {
      const cmp = LLVMBuildICmp(ctx.builder, 33, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "ne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Lt") {
      const cmp = LLVMBuildICmp(ctx.builder, 40, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "lt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Lte") {
      const cmp = LLVMBuildICmp(ctx.builder, 41, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "le"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Gt") {
      const cmp = LLVMBuildICmp(ctx.builder, 38, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "gt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Gte") {
      const cmp = LLVMBuildICmp(ctx.builder, 39, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "ge"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match35;
    }
    if (__ring_m35._tag === "And") {
      return panic("LLVM codegen: BinOp::And lowered by andor_lower — unreachable");
      break __ring_match35;
    }
    if (__ring_m35._tag === "Or") {
      return panic("LLVM codegen: BinOp::Or lowered by andor_lower — unreachable");
      break __ring_match35;
    }
    __match_fail(__ring_m35);
  }
}

function gen_float_binop(ctx, op, lhs, rhs) {
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
  const lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], codegen_llvm_ctx$fresh_name(ctx, "l"));
  const rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], codegen_llvm_ctx$fresh_name(ctx, "r"));
  __ring_match36: {
    const __ring_m36 = op;
    if (__ring_m36._tag === "Add") {
      const result = LLVMBuildFAdd(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fadd"));
      return box_float(ctx, result);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Sub") {
      const result = LLVMBuildFSub(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fsub"));
      return box_float(ctx, result);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Mul") {
      const result = LLVMBuildFMul(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fmul"));
      return box_float(ctx, result);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Div") {
      const result = LLVMBuildFDiv(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fdiv"));
      return box_float(ctx, result);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Eq") {
      const cmp = LLVMBuildFCmp(ctx.builder, 1, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "feq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Neq") {
      const cmp = LLVMBuildFCmp(ctx.builder, 6, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Lt") {
      const cmp = LLVMBuildFCmp(ctx.builder, 4, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "flt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Lte") {
      const cmp = LLVMBuildFCmp(ctx.builder, 5, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fle"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Gt") {
      const cmp = LLVMBuildFCmp(ctx.builder, 2, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fgt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match36;
    }
    if (__ring_m36._tag === "Gte") {
      const cmp = LLVMBuildFCmp(ctx.builder, 3, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fge"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match36;
    }
    return panic("LLVM codegen: unsupported float binop");
    break __ring_match36;
  }
}

function gen_str_binop(ctx, op, lhs, rhs) {
  __ring_match37: {
    const __ring_m37 = op;
    if (__ring_m37._tag === "Eq") {
      const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
      const result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "seq"));
      return box_bool(ctx, result);
      break __ring_match37;
    }
    if (__ring_m37._tag === "Neq") {
      const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
      const result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "seq"));
      const one = LLVMConstInt(ctx.i64_type, 1, 0);
      const neg = LLVMBuildSub(ctx.builder, one, result, codegen_llvm_ctx$fresh_name(ctx, "neg"));
      return box_bool(ctx, neg);
      break __ring_match37;
    }
    if (__ring_m37._tag === "Lt") {
      const lt_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_lt", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const lt_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_lt");
      const result = LLVMBuildCall2(ctx.builder, lt_ty, lt_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "slt"));
      return box_bool(ctx, result);
      break __ring_match37;
    }
    return panic("LLVM codegen: unsupported str binop");
    break __ring_match37;
  }
}

function gen_bool_binop(ctx, op, lhs, rhs) {
  const lhs_raw = unbox_int(ctx, lhs);
  const rhs_raw = unbox_int(ctx, rhs);
  __ring_match38: {
    const __ring_m38 = op;
    if (__ring_m38._tag === "Eq") {
      const cmp = LLVMBuildICmp(ctx.builder, 32, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "beq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Neq") {
      const cmp = LLVMBuildICmp(ctx.builder, 33, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "bne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match38;
    }
    return panic("LLVM codegen: unsupported bool binop");
    break __ring_match38;
  }
}

function gen_unaryop(ctx, op, operand, ty) {
  const val = gen_llvm_expr(ctx, operand);
  __ring_match39: {
    const __ring_m39 = op;
    if (__ring_m39._tag === "Neg") {
      if (is_int_type(ty)) {
        const raw = unbox_int(ctx, val);
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
      break __ring_match39;
    }
    if (__ring_m39._tag === "Not") {
      const raw = unbox_int(ctx, val);
      const one = LLVMConstInt(ctx.i64_type, 1, 0);
      const neg = LLVMBuildSub(ctx.builder, one, raw, codegen_llvm_ctx$fresh_name(ctx, "not"));
      return box_bool(ctx, neg);
      break __ring_match39;
    }
    __match_fail(__ring_m39);
  }
}

function lookup_call_mut_flags(ctx, callee) {
  __ring_match40: {
    const __ring_m40 = callee;
    if (__ring_m40._tag === "Ident") {
      const name = __ring_m40.name; const resolved_name = __ring_m40.resolved_name;
      const call_name = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return rn; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
      return _Map_get(ctx.fn_mut_params, call_name);
      break __ring_match40;
    }
    if (__ring_m40._tag === "FieldAccess") {
      const receiver = __ring_m40.receiver; const field = __ring_m40.field;
      const recv_type = hir$hexpr_type(receiver);
      const type_name = (function() {
  const __ring_m = types$type_to_builtin_name(recv_type);
  if (__ring_m._tag === "some") { const n = __ring_m._0; return n; }
  if (__ring_m._tag === "none") { return (function() {
  const __ring_m = recv_type;
  if (__ring_m._tag === "StructType") { const name = __ring_m.name; return name; }
  if (__ring_m._tag === "EnumType") { const name = __ring_m.name; return name; }
  return "";
})(); }
  __match_fail(__ring_m);
})();
      if ((type_name === "")) {
        return Option_none;
      } else {
        const ufcs_name = `${type_name}_${field}`;
        __ring_match41: {
          const __ring_m41 = _Map_get(ctx.fn_mut_params, ufcs_name);
          if (__ring_m41._tag === "some") {
            const flags = __ring_m41._0;
            let shifted = [];
            let i = 1;
            while ((i < List_len(flags))) {
              __ring_match42: {
                const __ring_m42 = List_get(flags, i);
                if (__ring_m42._tag === "some") {
                  const f = __ring_m42._0;
                  List_push(shifted, f);
                  break __ring_match42;
                }
                if (__ring_m42._tag === "none") {
                  break __ring_match42;
                }
                __match_fail(__ring_m42);
              }
              i = (i + 1);
            }
            return Option_some(shifted);
            break __ring_match41;
          }
          if (__ring_m41._tag === "none") {
            return Option_none;
            break __ring_match41;
          }
          __match_fail(__ring_m41);
        }
      }
      break __ring_match40;
    }
    return Option_none;
    break __ring_match40;
  }
}

function gen_mut_arg_llvm(ctx, arg) {
  __ring_match43: {
    const __ring_m43 = arg;
    if (__ring_m43._tag === "Ident") {
      const name = __ring_m43.name; const resolved_name = __ring_m43.resolved_name; const def_id = __ring_m43.def_id;
      if (is_boxed_def(ctx, def_id)) {
        const lookup_name = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return rn; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
        __ring_match44: {
          const __ring_m44 = _Map_get(ctx.named_values, lookup_name);
          if (__ring_m44._tag === "some") {
            const alloca = __ring_m44._0;
            return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "mcell"));
            break __ring_match44;
          }
          if (__ring_m44._tag === "none") {
            __ring_match45: {
              const __ring_m45 = _Map_get(ctx.named_values, name);
              if (__ring_m45._tag === "some") {
                const alloca = __ring_m45._0;
                return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "mcell"));
                break __ring_match45;
              }
              if (__ring_m45._tag === "none") {
                const v = gen_llvm_expr(ctx, arg);
                return build_cell_alloc(ctx, v);
                break __ring_match45;
              }
              __match_fail(__ring_m45);
            }
            break __ring_match44;
          }
          __match_fail(__ring_m44);
        }
      } else {
        const v = gen_llvm_expr(ctx, arg);
        return build_cell_alloc(ctx, v);
      }
      break __ring_match43;
    }
    const v = gen_llvm_expr(ctx, arg);
    return build_cell_alloc(ctx, v);
    break __ring_match43;
  }
}

function gen_call(ctx, callee, args, resolved_dicts, dict_dispatch, result_ty, effects) {
  __ring_match46: {
    const __ring_m46 = dict_dispatch;
    if (__ring_m46._tag === "some") {
      const dd = __ring_m46._0;
      return gen_dict_dispatch_call(ctx, callee, args, dd);
      break __ring_match46;
    }
    if (__ring_m46._tag === "none") {
      break __ring_match46;
    }
    __match_fail(__ring_m46);
  }
  const mut_flags = lookup_call_mut_flags(ctx, callee);
  let arg_vals = [];
  let argi = 0;
  const __ring_iter_10 = __List_Iterable.iter(args);
  while (true) {
    const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
    if (__ring_next_10._tag === "none") break;
    const a = __ring_next_10._0;
    const is_mut = (function() {
  const __ring_m = mut_flags;
  if (__ring_m._tag === "some") { const flags = __ring_m._0; return (function() {
  const __ring_m = List_get(flags, argi);
  if (__ring_m._tag === "some") { const f = __ring_m._0; return f; }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})(); }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
    if (is_mut) {
      List_push(arg_vals, gen_mut_arg_llvm(ctx, a));
    } else {
      List_push(arg_vals, gen_llvm_expr(ctx, a));
    }
    argi = (argi + 1);
  }
  const dict_vals = resolve_dict_refs(ctx, resolved_dicts);
  __ring_match47: {
    const __ring_m47 = callee;
    if (__ring_m47._tag === "Ident") {
      const name = __ring_m47.name; const resolved_name = __ring_m47.resolved_name;
      const call_name = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return rn; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
      if (((call_name === "print") ? (List_len(args) === 1) : false)) {
        __ring_match48: {
          const __ring_m48 = List_get(args, 0);
          if (__ring_m48._tag === "some") {
            const arg0 = __ring_m48._0;
            const arg_ty = hir$hexpr_type(arg0);
            if (((is_int_type(arg_ty) ? true : is_float_type(arg_ty)) ? true : is_bool_type(arg_ty))) {
              __ring_match49: {
                const __ring_m49 = List_get(arg_vals, 0);
                if (__ring_m49._tag === "some") {
                  const av = __ring_m49._0;
                  const coerced = convert_to_str(ctx, av, arg_ty);
                  return gen_runtime_call(ctx, "ring_print", [coerced]);
                  break __ring_match49;
                }
                if (__ring_m49._tag === "none") {
                  break __ring_match49;
                }
                __match_fail(__ring_m49);
              }
            }
            break __ring_match48;
          }
          if (__ring_m48._tag === "none") {
            break __ring_match48;
          }
          __match_fail(__ring_m48);
        }
      }
      const final_name = (((call_name === "map_new") ? is_int_keyed_map(result_ty) : false) ? "map_int_new" : (((call_name === "set_new") ? is_int_set(result_ty) : false) ? "set_int_new" : (((call_name === "map_from") ? is_int_keyed_map(result_ty) : false) ? "map_int_from" : (((call_name === "set_from") ? is_int_set(result_ty) : false) ? "set_int_from" : call_name))));
      return gen_direct_call(ctx, final_name, arg_vals, dict_vals);
      break __ring_match47;
    }
    if (__ring_m47._tag === "FieldAccess") {
      const receiver = __ring_m47.receiver; const field = __ring_m47.field;
      const recv_val = gen_llvm_expr(ctx, receiver);
      const recv_type = hir$hexpr_type(receiver);
      return gen_method_call(ctx, recv_val, recv_type, field, arg_vals, dict_vals);
      break __ring_match47;
    }
    const closure_val = gen_llvm_expr(ctx, callee);
    return gen_closure_call(ctx, closure_val, arg_vals);
    break __ring_match47;
  }
}

function resolve_dict_refs(ctx, dicts) {
  let result = [];
  const __ring_iter_11 = __List_Iterable.iter(dicts);
  while (true) {
    const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
    if (__ring_next_11._tag === "none") break;
    const d = __ring_next_11._0;
    List_push(result, resolve_dict_ref(ctx, d));
  }
  return result;
}

function resolve_dict_ref(ctx, dr) {
  __ring_match50: {
    const __ring_m50 = dr;
    if (__ring_m50._tag === "Simple") {
      const name = __ring_m50._0;
      __ring_match51: {
        const __ring_m51 = _Map_get(ctx.named_values, name);
        if (__ring_m51._tag === "some") {
          const alloca = __ring_m51._0;
          return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "dict"));
          break __ring_match51;
        }
        if (__ring_m51._tag === "none") {
          return resolve_static_dict_by_name(ctx, name);
          break __ring_match51;
        }
        __match_fail(__ring_m51);
      }
      break __ring_match50;
    }
    if (__ring_m50._tag === "Static") {
      const name = __ring_m50._0;
      return resolve_static_dict_by_name(ctx, name);
      break __ring_match50;
    }
    if (__ring_m50._tag === "Wrapped") {
      const dict = __ring_m50.dict; const trait_name = __ring_m50.trait_name; const inner_dicts = __ring_m50.inner_dicts;
      return build_wrapped_dict(ctx, dict, trait_name, inner_dicts);
      break __ring_match50;
    }
    __match_fail(__ring_m50);
  }
}

function resolve_static_dict_by_name(ctx, name) {
  const init_fn_name = `ring_dict_init_${name}`;
  __ring_match52: {
    const __ring_m52 = _Map_get(ctx.functions, init_fn_name);
    if (__ring_m52._tag === "some") {
      const init_fn = __ring_m52._0;
      const init_fn_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, init_fn_name);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return LLVMFunctionType(ctx.ptr_type, [], 0); }
  __match_fail(__ring_m);
})();
      return LLVMBuildCall2(ctx.builder, init_fn_ty, init_fn, [], codegen_llvm_ctx$fresh_name(ctx, "dict"));
      break __ring_match52;
    }
    if (__ring_m52._tag === "none") {
      __ring_match53: {
        const __ring_m53 = _Map_get(ctx.dict_globals, name);
        if (__ring_m53._tag === "some") {
          const init_fn = __ring_m53._0;
          const ft = LLVMFunctionType(ctx.ptr_type, [], 0);
          return LLVMBuildCall2(ctx.builder, ft, init_fn, [], codegen_llvm_ctx$fresh_name(ctx, "dict"));
          break __ring_match53;
        }
        if (__ring_m53._tag === "none") {
          const getter = get_or_create_static_dict_getter(ctx, name);
          const ft = LLVMFunctionType(ctx.ptr_type, [], 0);
          return LLVMBuildCall2(ctx.builder, ft, getter, [], codegen_llvm_ctx$fresh_name(ctx, "dict"));
          break __ring_match53;
        }
        __match_fail(__ring_m53);
      }
      break __ring_match52;
    }
    __match_fail(__ring_m52);
  }
}

function get_or_create_dict_global(ctx, name) {
  __ring_match54: {
    const __ring_m54 = _Map_get(ctx.dict_singletons, name);
    if (__ring_m54._tag === "some") {
      const g = __ring_m54._0;
      return g;
      break __ring_match54;
    }
    if (__ring_m54._tag === "none") {
      const g = LLVMAddGlobal(ctx.module, ctx.ptr_type, `__ring_dictg_${name}`);
      LLVMSetInitializer(g, LLVMConstPointerNull(ctx.ptr_type));
      _Map_insert(ctx.dict_singletons, name, g);
      return g;
      break __ring_match54;
    }
    __match_fail(__ring_m54);
  }
}

function emit_memoised_dict_getter(ctx, name, build_fn, build_fn_ty) {
  const fname = `ring_dict_init_${name}`;
  __ring_match55: {
    const __ring_m55 = _Map_get(ctx.functions, fname);
    if (__ring_m55._tag === "some") {
      const existing = __ring_m55._0;
      return existing;
      break __ring_match55;
    }
    if (__ring_m55._tag === "none") {
      break __ring_match55;
    }
    __match_fail(__ring_m55);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0);
  const fn_val = LLVMAddFunction(ctx.module, fname, fn_ty);
  _Map_insert(ctx.functions, fname, fn_val);
  _Map_insert(ctx.fn_types, fname, fn_ty);
  const g = get_or_create_dict_global(ctx, name);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  const build_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "build");
  const done_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "done");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const cached = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "dc"));
  const isnull = LLVMBuildICmp(ctx.builder, 32, cached, LLVMConstPointerNull(ctx.ptr_type), codegen_llvm_ctx$fresh_name(ctx, "dn"));
  discard(LLVMBuildCondBr(ctx.builder, isnull, build_bb, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, build_bb);
  const built = LLVMBuildCall2(ctx.builder, build_fn_ty, build_fn, [], codegen_llvm_ctx$fresh_name(ctx, "db"));
  discard(LLVMBuildStore(ctx.builder, built, g));
  discard(LLVMBuildBr(ctx.builder, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, done_bb);
  const result = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "dv"));
  discard(LLVMBuildRet(ctx.builder, result));
  ctx.current_fn = saved_fn;
  LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
  return fn_val;
}

function emit_memoised_const_body(ctx, fn_val, mangled, init, intern_fn_name) {
  const g = LLVMAddGlobal(ctx.module, ctx.ptr_type, `__ring_constg_${mangled}`);
  LLVMSetInitializer(g, LLVMConstPointerNull(ctx.ptr_type));
  const saved_fn = ctx.current_fn;
  const saved_named = ctx.named_values;
  ctx.current_fn = Option_some(fn_val);
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  const build_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "build");
  const done_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "done");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const cached = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "cc"));
  const isnull = LLVMBuildICmp(ctx.builder, 32, cached, LLVMConstPointerNull(ctx.ptr_type), codegen_llvm_ctx$fresh_name(ctx, "cn"));
  discard(LLVMBuildCondBr(ctx.builder, isnull, build_bb, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, build_bb);
  const built = gen_llvm_expr(ctx, init);
  const intern_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, intern_fn_name, [ctx.ptr_type], ctx.ptr_type);
  const intern_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, intern_fn_name);
  const interned = LLVMBuildCall2(ctx.builder, intern_ty, intern_fn, [built], codegen_llvm_ctx$fresh_name(ctx, "ci"));
  discard(LLVMBuildStore(ctx.builder, interned, g));
  discard(LLVMBuildBr(ctx.builder, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, done_bb);
  const result = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "cv"));
  discard(LLVMBuildRet(ctx.builder, result));
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
}

function get_or_create_static_dict_getter(ctx, name) {
  const fname = `ring_dict_init_${name}`;
  __ring_match56: {
    const __ring_m56 = _Map_get(ctx.functions, fname);
    if (__ring_m56._tag === "some") {
      const existing = __ring_m56._0;
      return existing;
      break __ring_match56;
    }
    if (__ring_m56._tag === "none") {
      break __ring_match56;
    }
    __match_fail(__ring_m56);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0);
  const fn_val = LLVMAddFunction(ctx.module, fname, fn_ty);
  _Map_insert(ctx.functions, fname, fn_val);
  _Map_insert(ctx.fn_types, fname, fn_ty);
  const g = get_or_create_dict_global(ctx, name);
  const saved_fn = ctx.current_fn;
  const saved_named = ctx.named_values;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  const build_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "build");
  const done_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "done");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const cached = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "dc"));
  const isnull = LLVMBuildICmp(ctx.builder, 32, cached, LLVMConstPointerNull(ctx.ptr_type), codegen_llvm_ctx$fresh_name(ctx, "dn"));
  discard(LLVMBuildCondBr(ctx.builder, isnull, build_bb, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, build_bb);
  const inst_def = (function() {
  const __ring_m = _Map_get(ctx.static_dict_defs, name);
  if (__ring_m._tag === "some") { const def = __ring_m._0; return ((List_len(def.inner) > 0) ? Option_some(def) : Option_none); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
  const value = (function() {
  const __ring_m = inst_def;
  if (__ring_m._tag === "some") { const def = __ring_m._0; return (function() {
  let inner_refs = [];
  const __ring_iter_12 = __List_Iterable.iter(def.inner);
  while (true) {
    const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
    if (__ring_next_12._tag === "none") break;
    const inn = __ring_next_12._0;
    List_push(inner_refs, hir$DictRef_Static(inn));
  }
  return build_wrapped_dict_typed(ctx, def.base_dict, def.trait_name, inner_refs, codegen_llvm_ctx$RING_TYPEID_DICT_STATIC);
})(); }
  if (__ring_m._tag === "none") { return (function() {
  const name_str = gen_str_lit(ctx, name);
  const bd_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_get_builtin_dict", [ctx.ptr_type], ctx.ptr_type);
  const bd_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_get_builtin_dict");
  return LLVMBuildCall2(ctx.builder, bd_ty, bd_fn, [name_str], codegen_llvm_ctx$fresh_name(ctx, "bd"));
})(); }
  __match_fail(__ring_m);
})();
  discard(LLVMBuildStore(ctx.builder, value, g));
  discard(LLVMBuildBr(ctx.builder, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, done_bb);
  const result = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "dv"));
  discard(LLVMBuildRet(ctx.builder, result));
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
  LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
  return fn_val;
}

function build_wrapped_dict(ctx, dict_name, trait_name, inner_dicts) {
  return build_wrapped_dict_typed(ctx, dict_name, trait_name, inner_dicts, codegen_llvm_ctx$RING_TYPEID_DICT_DYN);
}

function build_wrapped_dict_typed(ctx, dict_name, trait_name, inner_dicts, dict_tid) {
  let inner_vals = [];
  const __ring_iter_13 = __List_Iterable.iter(inner_dicts);
  while (true) {
    const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
    if (__ring_next_13._tag === "none") break;
    const d = __ring_next_13._0;
    List_push(inner_vals, resolve_dict_ref(ctx, d));
  }
  const target_type = wrapped_dict_target_type(dict_name, trait_name);
  const method_order = (function() {
  const __ring_m = _Map_get(ctx.trait_method_order, trait_name);
  if (__ring_m._tag === "some") { const order = __ring_m._0; return order; }
  if (__ring_m._tag === "none") { return []; }
  __match_fail(__ring_m);
})();
  const method_count = List_len(method_order);
  let dict_elem_types = [ctx.i64_type];
  const __ring_end14 = method_count;
  for (let i = 0; i < __ring_end14; i++) {
    List_push(dict_elem_types, ctx.ptr_type);
  }
  const dict_struct_ty = LLVMStructTypeInContext(ctx.context, dict_elem_types, 0);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const dict_size = LLVMSizeOf(dict_struct_ty);
  const dict_typeid = LLVMConstInt(ctx.i64_type, dict_tid, 0);
  const dict_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [dict_size, dict_typeid], codegen_llvm_ctx$fresh_name(ctx, "wdict"));
  const dict_cnt_slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "wdc"));
  discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, method_count, 0), dict_cnt_slot));
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const closure_size = LLVMSizeOf(closure_ty);
  const closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0);
  const inner_count = List_len(inner_vals);
  const __ring_end15 = method_count;
  for (let i = 0; i < __ring_end15; i++) {
    __ring_match57: {
      const __ring_m57 = List_get(method_order, i);
      if (__ring_m57._tag === "some") {
        const method_name = __ring_m57._0;
        const mangled = codegen_llvm_ctx$llvm_mangle_method(target_type, method_name);
        __ring_match58: {
          const __ring_m58 = _Map_get(ctx.functions, mangled);
          if (__ring_m58._tag === "some") {
            const method_fn = __ring_m58._0;
            const base_arity = LLVMCountParams(method_fn);
            const dispatch_arity = (base_arity - inner_count);
            const thunk_fn = emit_wrapped_method_thunk(ctx, mangled, method_fn, method_name, dispatch_arity, inner_count);
            let env_elem_types = [ctx.i64_type];
            const __ring_end16 = inner_count;
            for (let j = 0; j < __ring_end16; j++) {
              List_push(env_elem_types, ctx.ptr_type);
            }
            const env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0);
            const env_size = LLVMSizeOf(env_ty);
            const env_typeid = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, 0);
            const env_alloc = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [env_size, env_typeid], codegen_llvm_ctx$fresh_name(ctx, "wmenv"));
            const cnt_slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, 0, codegen_llvm_ctx$fresh_name(ctx, "wmc"));
            discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, inner_count, 0), cnt_slot));
            let sj = 0;
            const __ring_iter_17 = __List_Iterable.iter(inner_vals);
            while (true) {
              const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
              if (__ring_next_17._tag === "none") break;
              const iv = __ring_next_17._0;
              discard(gen_dup_value(ctx, iv));
              const s = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, (sj + 1), codegen_llvm_ctx$fresh_name(ctx, "wmi"));
              discard(LLVMBuildStore(ctx.builder, iv, s));
              sj = (sj + 1);
            }
            const closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], codegen_llvm_ctx$fresh_name(ctx, "wmcls"));
            const fp = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "wmfp"));
            discard(LLVMBuildStore(ctx.builder, thunk_fn, fp));
            const ep = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "wmep"));
            discard(LLVMBuildStore(ctx.builder, env_alloc, ep));
            const slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "wmds"));
            discard(LLVMBuildStore(ctx.builder, closure_ptr, slot));
            break __ring_match58;
          }
          if (__ring_m58._tag === "none") {
            const slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "wmds"));
            discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), slot));
            break __ring_match58;
          }
          __match_fail(__ring_m58);
        }
        break __ring_match57;
      }
      if (__ring_m57._tag === "none") {
        break __ring_match57;
      }
      __match_fail(__ring_m57);
    }
  }
  return dict_ptr;
}

function wrapped_dict_target_type(dict_name, trait_name) {
  let s = dict_name;
  if (Str_starts_with(s, "__")) {
    s = Str_slice(s, 2, Str_len(s));
  }
  const suffix = `_${trait_name}`;
  if (Str_ends_with(s, suffix)) {
    return Str_slice(s, 0, (Str_len(s) - Str_len(suffix)));
  } else {
    return s;
  }
}

function emit_wrapped_method_thunk(ctx, mangled, method_fn, method_name, dispatch_arity, inner_count) {
  const thunk_name = `${mangled}__wrapthunk`;
  __ring_match59: {
    const __ring_m59 = _Map_get(ctx.functions, thunk_name);
    if (__ring_m59._tag === "some") {
      const existing = __ring_m59._0;
      return existing;
      break __ring_match59;
    }
    if (__ring_m59._tag === "none") {
      break __ring_match59;
    }
    __match_fail(__ring_m59);
  }
  let thunk_param_types = [ctx.ptr_type];
  const __ring_end18 = dispatch_arity;
  for (let i = 0; i < __ring_end18; i++) {
    List_push(thunk_param_types, ctx.ptr_type);
  }
  const thunk_ty = LLVMFunctionType(ctx.ptr_type, thunk_param_types, 0);
  const thunk_fn = LLVMAddFunction(ctx.module, thunk_name, thunk_ty);
  _Map_insert(ctx.functions, thunk_name, thunk_fn);
  _Map_insert(ctx.fn_types, thunk_name, thunk_ty);
  let env_elem_types = [ctx.i64_type];
  const __ring_end19 = inner_count;
  for (let j = 0; j < __ring_end19; j++) {
    List_push(env_elem_types, ctx.ptr_type);
  }
  const env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0);
  const method_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, mangled);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return (function() {
  let mp = [];
  const __ring_end20 = (dispatch_arity + inner_count);
  for (let i = 0; i < __ring_end20; i++) {
    List_push(mp, ctx.ptr_type);
  }
  return LLVMFunctionType(ctx.ptr_type, mp, 0);
})(); }
  __match_fail(__ring_m);
})();
  const saved_block = LLVMGetInsertBlock(ctx.builder);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, thunk_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const env_param = LLVMGetParam(thunk_fn, 0);
  let fwd_args = [];
  const __ring_end21 = dispatch_arity;
  for (let i = 0; i < __ring_end21; i++) {
    List_push(fwd_args, LLVMGetParam(thunk_fn, (i + 1)));
  }
  const __ring_end22 = inner_count;
  for (let j = 0; j < __ring_end22; j++) {
    const s = LLVMBuildStructGEP2(ctx.builder, env_ty, env_param, (j + 1), codegen_llvm_ctx$fresh_name(ctx, "wti"));
    List_push(fwd_args, LLVMBuildLoad2(ctx.builder, ctx.ptr_type, s, codegen_llvm_ctx$fresh_name(ctx, "wtd")));
  }
  const res = LLVMBuildCall2(ctx.builder, method_ty, method_fn, fwd_args, codegen_llvm_ctx$fresh_name(ctx, "wtcall"));
  discard(LLVMBuildRet(ctx.builder, res));
  LLVMPositionBuilderAtEnd(ctx.builder, saved_block);
  return thunk_fn;
}

function gen_dict_dispatch_call(ctx, callee, args, dd) {
  let recv_val = Option_none;
  let other_arg_start = 0;
  __ring_match60: {
    const __ring_m60 = callee;
    if (__ring_m60._tag === "FieldAccess") {
      const receiver = __ring_m60.receiver;
      recv_val = Option_some(gen_llvm_expr(ctx, receiver));
      break __ring_match60;
    }
    __ring_match61: {
      const __ring_m61 = List_get(args, 0);
      if (__ring_m61._tag === "some") {
        const a = __ring_m61._0;
        recv_val = Option_some(gen_llvm_expr(ctx, a));
        other_arg_start = 1;
        break __ring_match61;
      }
      if (__ring_m61._tag === "none") {
        break __ring_match61;
      }
      __match_fail(__ring_m61);
    }
    break __ring_match60;
  }
  let call_args = [];
  __ring_match62: {
    const __ring_m62 = recv_val;
    if (__ring_m62._tag === "some") {
      const rv = __ring_m62._0;
      List_push(call_args, rv);
      break __ring_match62;
    }
    if (__ring_m62._tag === "none") {
      break __ring_match62;
    }
    __match_fail(__ring_m62);
  }
  const __ring_end23 = List_len(args);
  for (let i = other_arg_start; i < __ring_end23; i++) {
    __ring_match63: {
      const __ring_m63 = List_get(args, i);
      if (__ring_m63._tag === "some") {
        const a = __ring_m63._0;
        List_push(call_args, gen_llvm_expr(ctx, a));
        break __ring_match63;
      }
      if (__ring_m63._tag === "none") {
        break __ring_match63;
      }
      __match_fail(__ring_m63);
    }
  }
  __ring_match64: {
    const __ring_m64 = _Map_get(ctx.named_values, dd.dict_param);
    if (__ring_m64._tag === "some") {
      const dict_alloca = __ring_m64._0;
      const dict_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, dict_alloca, codegen_llvm_ctx$fresh_name(ctx, "dp"));
      const method_idx = get_trait_method_index(ctx, dd.dict_param, dd.method);
      const dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0);
      const method_slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (method_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ms"));
      const closure_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, method_slot_ptr, codegen_llvm_ctx$fresh_name(ctx, "cp"));
      return gen_closure_call(ctx, closure_ptr, call_args);
      break __ring_match64;
    }
    if (__ring_m64._tag === "none") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match64;
    }
    __match_fail(__ring_m64);
  }
}

function get_trait_method_index(ctx, dict_param, method) {
  __ring_match65: {
    const __ring_m65 = trait_name_from_dict_param(dict_param);
    if (__ring_m65._tag === "some") {
      const trait_name = __ring_m65._0;
      __ring_match66: {
        const __ring_m66 = _Map_get(ctx.trait_method_order, trait_name);
        if (__ring_m66._tag === "some") {
          const order = __ring_m66._0;
          let idx = 0;
          const __ring_iter_24 = __List_Iterable.iter(order);
          while (true) {
            const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
            if (__ring_next_24._tag === "none") break;
            const m = __ring_next_24._0;
            if ((m === method)) {
              return idx;
            }
            idx = (idx + 1);
          }
          return get_builtin_method_index(method);
          break __ring_match66;
        }
        if (__ring_m66._tag === "none") {
          return get_builtin_method_index(method);
          break __ring_match66;
        }
        __match_fail(__ring_m66);
      }
      break __ring_match65;
    }
    if (__ring_m65._tag === "none") {
      return get_builtin_method_index(method);
      break __ring_match65;
    }
    __match_fail(__ring_m65);
  }
}

function trait_name_from_dict_param(dict_param) {
  const prefix = "__ring_";
  if ((!Str_starts_with(dict_param, prefix))) {
    return Option_none;
  }
  const rest = Str_slice(dict_param, Str_len(prefix), Str_len(dict_param));
  __ring_match67: {
    const __ring_m67 = Str_index_of(rest, "_");
    if (__ring_m67._tag === "some") {
      const us = __ring_m67._0;
      return Option_some(Str_slice(rest, (us + 1), Str_len(rest)));
      break __ring_match67;
    }
    if (__ring_m67._tag === "none") {
      return Option_none;
      break __ring_match67;
    }
    __match_fail(__ring_m67);
  }
}

function get_builtin_method_index(method) {
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
  const __ring_iter_25 = __List_Iterable.iter(arg_vals);
  while (true) {
    const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
    if (__ring_next_25._tag === "none") break;
    const a = __ring_next_25._0;
    List_push(call_args, a);
  }
  let fn_param_types = [ctx.ptr_type];
  const __ring_iter_26 = __List_Iterable.iter(arg_vals);
  while (true) {
    const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
    if (__ring_next_26._tag === "none") break;
    const a = __ring_next_26._0;
    List_push(fn_param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, fn_param_types, 0);
  return LLVMBuildCall2(ctx.builder, fn_ty, fn_ptr, call_args, codegen_llvm_ctx$fresh_name(ctx, "cc"));
}

function gen_direct_call(ctx, name, arg_vals, dict_vals) {
  const rt_name = extern_fn_to_runtime(name);
  __ring_match68: {
    const __ring_m68 = rt_name;
    if (__ring_m68._tag === "some") {
      const rtn = __ring_m68._0;
      return gen_runtime_call(ctx, rtn, arg_vals);
      break __ring_match68;
    }
    if (__ring_m68._tag === "none") {
      break __ring_match68;
    }
    __match_fail(__ring_m68);
  }
  const mangled = codegen_llvm_ctx$llvm_resolve_fn(ctx, name);
  const found_fn = find_function_in_ctx(ctx, mangled, name);
  __ring_match69: {
    const __ring_m69 = found_fn;
    if (__ring_m69._tag === "some") {
      const fn_info = __ring_m69._0;
      const __ring_iter_27 = __List_Iterable.iter(dict_vals);
      while (true) {
        const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
        if (__ring_next_27._tag === "none") break;
        const dv = __ring_next_27._0;
        List_push(arg_vals, dv);
      }
      __ring_match70: {
        const __ring_m70 = _Map_get(ctx.fn_evidence_params, fn_info.fn_mangled);
        if (__ring_m70._tag === "some") {
          const ev_params = __ring_m70._0;
          const __ring_iter_28 = __List_Iterable.iter(ev_params);
          while (true) {
            const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
            if (__ring_next_28._tag === "none") break;
            const ep = __ring_next_28._0;
            List_push(arg_vals, lookup_evidence(ctx, ep));
          }
          break __ring_match70;
        }
        if (__ring_m70._tag === "none") {
          break __ring_match70;
        }
        __match_fail(__ring_m70);
      }
      const fn_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, fn_info.fn_mangled);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return panic(`LLVM codegen: fn type not found for ${fn_info.fn_mangled}`); }
  __match_fail(__ring_m);
})();
      return LLVMBuildCall2(ctx.builder, fn_ty, fn_info.fn_val, arg_vals, codegen_llvm_ctx$fresh_name(ctx, "call"));
      break __ring_match69;
    }
    if (__ring_m69._tag === "none") {
      __ring_match71: {
        const __ring_m71 = _Map_get(ctx.named_values, name);
        if (__ring_m71._tag === "some") {
          const alloca = __ring_m71._0;
          const closure_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "clos"));
          return gen_closure_call(ctx, closure_ptr, arg_vals);
          break __ring_match71;
        }
        if (__ring_m71._tag === "none") {
          const rt_fallback = `ring_${name}`;
          __ring_match72: {
            const __ring_m72 = _Map_get(ctx.rt_fns, rt_fallback);
            if (__ring_m72._tag === "some") {
              return gen_runtime_call(ctx, rt_fallback, arg_vals);
              break __ring_match72;
            }
            if (__ring_m72._tag === "none") {
              break __ring_match72;
            }
            __match_fail(__ring_m72);
          }
          eprintln(`LLVM codegen warning: unknown function '${name}', generating panic`);
          const panic_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_panic", [ctx.ptr_type], ctx.ptr_type);
          const panic_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_panic");
          const msg = LLVMBuildGlobalStringPtr(ctx.builder, `LLVM: missing function '${name}'`, codegen_llvm_ctx$fresh_name(ctx, "panicmsg"));
          const str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type);
          const str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_from_cstr");
          const str_val = LLVMBuildCall2(ctx.builder, str_ty, str_fn, [msg], codegen_llvm_ctx$fresh_name(ctx, "ps"));
          discard(LLVMBuildCall2(ctx.builder, panic_ty, panic_fn, [str_val], ""));
          return LLVMConstPointerNull(ctx.ptr_type);
          break __ring_match71;
        }
        __match_fail(__ring_m71);
      }
      break __ring_match69;
    }
    __match_fail(__ring_m69);
  }
}

class FnLookupResult {
  constructor(fn_val, fn_mangled) {
    this.fn_val = fn_val;
    this.fn_mangled = fn_mangled;
  }
}

function find_fn_precise(ctx, name) {
  const resolved = codegen_llvm_ctx$llvm_resolve_fn(ctx, name);
  const step1 = _Map_get(ctx.functions, resolved);
  __ring_match73: {
    const __ring_m73 = step1;
    if (__ring_m73._tag === "some") {
      const fn_val = __ring_m73._0;
      return Option_some(new FnLookupResult(fn_val, resolved));
      break __ring_match73;
    }
    if (__ring_m73._tag === "none") {
      break __ring_match73;
    }
    __match_fail(__ring_m73);
  }
  const plain = codegen_llvm_ctx$llvm_mangle_fn(name);
  const step2 = _Map_get(ctx.functions, plain);
  __ring_match74: {
    const __ring_m74 = step2;
    if (__ring_m74._tag === "some") {
      const fn_val = __ring_m74._0;
      return Option_some(new FnLookupResult(fn_val, plain));
      break __ring_match74;
    }
    if (__ring_m74._tag === "none") {
      break __ring_match74;
    }
    __match_fail(__ring_m74);
  }
  const step3 = find_fn_by_prefix_enumeration(ctx, name);
  __ring_match75: {
    const __ring_m75 = step3;
    if (__ring_m75._tag === "some") {
      const result = __ring_m75._0;
      return Option_some(result);
      break __ring_match75;
    }
    if (__ring_m75._tag === "none") {
      break __ring_match75;
    }
    __match_fail(__ring_m75);
  }
  return find_fn_by_suffix(ctx, name);
}

function find_fn_by_prefix_enumeration(ctx, name) {
  let seen_prefixes = set_new();
  const __ring_iter_29 = __List_Iterable.iter(_Map_entries(ctx.imports_map));
  while (true) {
    const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
    if (__ring_next_29._tag === "none") break;
    const entry = __ring_next_29._0;
    const __ring_dt0 = entry;
    const qualified = __ring_dt0[1];
    const maybe_idx = Str_index_of(qualified, "$$_");
    __ring_match76: {
      const __ring_m76 = maybe_idx;
      if (__ring_m76._tag === "some") {
        const sep_idx = __ring_m76._0;
        const prefix_part = Str_slice(qualified, 0, sep_idx);
        if ((!_Set_contains(seen_prefixes, prefix_part, __Str_Eq))) {
          _Set_insert(seen_prefixes, prefix_part);
          const candidate = `${prefix_part}$$_${name}`;
          const found = _Map_get(ctx.functions, candidate);
          __ring_match77: {
            const __ring_m77 = found;
            if (__ring_m77._tag === "some") {
              const fn_val = __ring_m77._0;
              return Option_some(new FnLookupResult(fn_val, candidate));
              break __ring_match77;
            }
            if (__ring_m77._tag === "none") {
              break __ring_match77;
            }
            __match_fail(__ring_m77);
          }
        }
        break __ring_match76;
      }
      if (__ring_m76._tag === "none") {
        break __ring_match76;
      }
      __match_fail(__ring_m76);
    }
  }
  return Option_none;
}

function find_fn_by_suffix(ctx, name) {
  const suffix = `$$_${name}`;
  const __ring_iter_30 = __List_Iterable.iter(_Map_entries(ctx.functions));
  while (true) {
    const __ring_next_30 = __ListIterator_Iterator.next(__ring_iter_30);
    if (__ring_next_30._tag === "none") break;
    const entry = __ring_next_30._0;
    const __ring_dt1 = entry;
    const fn_name = __ring_dt1[0];
    const fn_val = __ring_dt1[1];
    if (Str_ends_with(fn_name, suffix)) {
      return Option_some(new FnLookupResult(fn_val, fn_name));
    }
  }
  return Option_none;
}

function find_function_in_ctx(ctx, mangled, name) {
  __ring_match78: {
    const __ring_m78 = _Map_get(ctx.functions, mangled);
    if (__ring_m78._tag === "some") {
      const fn_val = __ring_m78._0;
      return Option_some(new FnLookupResult(fn_val, mangled));
      break __ring_match78;
    }
    if (__ring_m78._tag === "none") {
      const bare = codegen_llvm_ctx$llvm_mangle_fn(name);
      __ring_match79: {
        const __ring_m79 = _Map_get(ctx.functions, bare);
        if (__ring_m79._tag === "some") {
          const fn_val = __ring_m79._0;
          return Option_some(new FnLookupResult(fn_val, bare));
          break __ring_match79;
        }
        if (__ring_m79._tag === "none") {
          return find_fn_precise(ctx, name);
          break __ring_match79;
        }
        __match_fail(__ring_m79);
      }
      break __ring_match78;
    }
    __match_fail(__ring_m78);
  }
}

function lookup_evidence(ctx, ev_param_name) {
  __ring_match80: {
    const __ring_m80 = _Map_get(ctx.named_values, ev_param_name);
    if (__ring_m80._tag === "some") {
      const alloca = __ring_m80._0;
      return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "ev"));
      break __ring_match80;
    }
    if (__ring_m80._tag === "none") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match80;
    }
    __match_fail(__ring_m80);
  }
}

function gen_runtime_call(ctx, name, args) {
  __ring_match81: {
    const __ring_m81 = _Map_get(ctx.rt_fns, name);
    if (__ring_m81._tag === "some") {
      const fn_val = __ring_m81._0;
      const fn_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, name);
      if (is_void_runtime_fn(name)) {
        LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, "");
        return LLVMConstPointerNull(ctx.ptr_type);
      } else {
        return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, codegen_llvm_ctx$fresh_name(ctx, "rt"));
      }
      break __ring_match81;
    }
    if (__ring_m81._tag === "none") {
      return panic(`LLVM codegen: unknown runtime function '${name}'`);
      break __ring_match81;
    }
    __match_fail(__ring_m81);
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
        if (((name === "exit") ? true : (name === "exit_process"))) {
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
                      if ((name === "file_exists")) {
                        return Option_some("ring_file_exists");
                      } else {
                        if ((name === "delete_file")) {
                          return Option_some("ring_delete_file");
                        } else {
                          if ((name === "path_join")) {
                            return Option_some("ring_path_join");
                          } else {
                            if ((name === "path_resolve")) {
                              return Option_some("ring_path_resolve");
                            } else {
                              if ((name === "path_dirname")) {
                                return Option_some("ring_path_dirname");
                              } else {
                                if ((name === "path_basename")) {
                                  return Option_some("ring_path_basename");
                                } else {
                                  if ((name === "path_extname")) {
                                    return Option_some("ring_path_extname");
                                  } else {
                                    if ((name === "cwd")) {
                                      return Option_some("ring_cwd");
                                    } else {
                                      if ((name === "parse_int")) {
                                        return Option_some("ring_parse_int");
                                      } else {
                                        if ((name === "parse_float")) {
                                          return Option_some("ring_parse_float");
                                        } else {
                                          if ((name === "set_from")) {
                                            return Option_some("ring_set_from_list");
                                          } else {
                                            if ((name === "list_new")) {
                                              return Option_some("ring_list_new");
                                            } else {
                                              if ((name === "map_from")) {
                                                return Option_some("ring_map_from");
                                              } else {
                                                if ((name === "__ring_raise_fail")) {
                                                  return Option_some("__ring_raise_fail");
                                                } else {
                                                  if ((name === "map_int_new")) {
                                                    return Option_some("ring_map_int_new");
                                                  } else {
                                                    if ((name === "set_int_new")) {
                                                      return Option_some("ring_set_int_new");
                                                    } else {
                                                      if ((name === "map_int_from")) {
                                                        return Option_some("ring_map_int_from");
                                                      } else {
                                                        if ((name === "set_int_from")) {
                                                          return Option_some("ring_set_int_from_list");
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
                                if ((name === "ring_map_int_has")) {
                                  return true;
                                } else {
                                  if ((name === "ring_map_int_len")) {
                                    return true;
                                  } else {
                                    if ((name === "ring_set_int_has")) {
                                      return true;
                                    } else {
                                      if ((name === "ring_set_int_len")) {
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
                if ((name === "ring_list_any")) {
                  return true;
                } else {
                  if ((name === "ring_list_all")) {
                    return true;
                  } else {
                    if ((name === "ring_Option_is_some")) {
                      return true;
                    } else {
                      if ((name === "ring_Option_is_none")) {
                        return true;
                      } else {
                        if ((name === "ring_map_int_has")) {
                          return true;
                        } else {
                          if ((name === "ring_set_int_has")) {
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

function rt_method_int_arg_count(name) {
  if ((name === "ring_list_get")) {
    return 1;
  } else {
    if ((name === "ring_list_get_opt")) {
      return 1;
    } else {
      if ((name === "ring_str_get")) {
        return 1;
      } else {
        if ((name === "ring_str_slice")) {
          return 2;
        } else {
          if ((name === "ring_list_slice")) {
            return 2;
          } else {
            if ((name === "ring_list_set")) {
              return 1;
            } else {
              if ((name === "ring_str_char_at")) {
                return 1;
              } else {
                if ((name === "ring_str_char_code_at")) {
                  return 1;
                } else {
                  if ((name === "ring_str_pad_start")) {
                    return 1;
                  } else {
                    if ((name === "ring_str_pad_end")) {
                      return 1;
                    } else {
                      if ((name === "ring_str_repeat")) {
                        return 1;
                      } else {
                        return 0;
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
  __ring_match82: {
    const __ring_m82 = rt_method;
    if (__ring_m82._tag === "some") {
      const base_rt_name = __ring_m82._0;
      const rt_name = (is_int_keyed_map(recv_type) ? (function() {
  const __ring_m = method;
  if (__ring_m === "get") { return "ring_map_int_get_opt"; }
  if (__ring_m === "insert") { return "ring_map_int_set"; }
  if (__ring_m === "contains_key") { return "ring_map_int_has"; }
  if (__ring_m === "keys") { return "ring_map_int_keys"; }
  if (__ring_m === "values") { return "ring_map_int_values"; }
  if (__ring_m === "entries") { return "ring_map_int_entries"; }
  if (__ring_m === "len") { return "ring_map_int_len"; }
  if (__ring_m === "remove") { return "ring_map_int_delete"; }
  if (__ring_m === "for_each") { return "ring_map_int_for_each"; }
  if (__ring_m === "clear") { return "ring_map_int_clear"; }
  if (__ring_m === "clone") { return "ring_map_int_clone"; }
  return base_rt_name;
})() : (is_int_set(recv_type) ? (function() {
  const __ring_m = method;
  if (__ring_m === "add") { return "ring_set_int_add"; }
  if (__ring_m === "insert") { return "ring_set_int_add"; }
  if (__ring_m === "has") { return "ring_set_int_has"; }
  if (__ring_m === "contains") { return "ring_set_int_has"; }
  if (__ring_m === "to_list") { return "ring_set_int_to_list"; }
  if (__ring_m === "len") { return "ring_set_int_len"; }
  if (__ring_m === "from_list") { return "ring_set_int_from_list"; }
  if (__ring_m === "for_each") { return "ring_set_int_for_each"; }
  if (__ring_m === "remove") { return "ring_set_int_delete"; }
  if (__ring_m === "clear") { return "ring_set_int_clear"; }
  if (__ring_m === "clone") { return "ring_set_int_clone"; }
  return base_rt_name;
})() : base_rt_name));
      let call_args = [];
      if (rt_method_needs_recv_unbox_int(rt_name)) {
        const raw = unbox_int(ctx, recv);
        List_push(call_args, raw);
      } else {
        if (rt_method_needs_recv_unbox_float(rt_name)) {
          const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
          const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
          const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [recv], codegen_llvm_ctx$fresh_name(ctx, "uf"));
          List_push(call_args, raw);
        } else {
          if (rt_method_needs_recv_unbox_bool(rt_name)) {
            const raw = unbox_int(ctx, recv);
            List_push(call_args, raw);
          } else {
            List_push(call_args, recv);
          }
        }
      }
      const int_arg_count = rt_method_int_arg_count(rt_name);
      let ai_idx = 0;
      const __ring_iter_31 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
        if (__ring_next_31._tag === "none") break;
        const a = __ring_next_31._0;
        if ((ai_idx < int_arg_count)) {
          const raw = unbox_int(ctx, a);
          List_push(call_args, raw);
        } else {
          List_push(call_args, a);
        }
        ai_idx = (ai_idx + 1);
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
      break __ring_match82;
    }
    if (__ring_m82._tag === "none") {
      let call_args = [recv];
      const __ring_iter_32 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_32 = __ListIterator_Iterator.next(__ring_iter_32);
        if (__ring_next_32._tag === "none") break;
        const a = __ring_next_32._0;
        List_push(call_args, a);
      }
      const mangled = codegen_llvm_ctx$llvm_mangle_method(type_name, method);
      __ring_match83: {
        const __ring_m83 = _Map_get(ctx.functions, mangled);
        if (__ring_m83._tag === "some") {
          const fn_val = __ring_m83._0;
          const __ring_iter_33 = __List_Iterable.iter(dict_vals);
          while (true) {
            const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
            if (__ring_next_33._tag === "none") break;
            const dv = __ring_next_33._0;
            List_push(call_args, dv);
          }
          __ring_match84: {
            const __ring_m84 = _Map_get(ctx.fn_evidence_params, mangled);
            if (__ring_m84._tag === "some") {
              const ev_params = __ring_m84._0;
              const __ring_iter_34 = __List_Iterable.iter(ev_params);
              while (true) {
                const __ring_next_34 = __ListIterator_Iterator.next(__ring_iter_34);
                if (__ring_next_34._tag === "none") break;
                const ep = __ring_next_34._0;
                List_push(call_args, lookup_evidence(ctx, ep));
              }
              break __ring_match84;
            }
            if (__ring_m84._tag === "none") {
              break __ring_match84;
            }
            __match_fail(__ring_m84);
          }
          const fn_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, mangled);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return panic(`LLVM codegen: fn type not found for method ${mangled}`); }
  __match_fail(__ring_m);
})();
          return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, codegen_llvm_ctx$fresh_name(ctx, "mc"));
          break __ring_match83;
        }
        if (__ring_m83._tag === "none") {
          eprintln(`LLVM codegen warning: unknown method '${type_name}.${method}' (mangled: ${mangled}), generating panic`);
          const panic_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_panic", [ctx.ptr_type], ctx.ptr_type);
          const panic_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_panic");
          const msg = LLVMBuildGlobalStringPtr(ctx.builder, `LLVM: missing method '${type_name}.${method}'`, codegen_llvm_ctx$fresh_name(ctx, "panicmsg"));
          const str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type);
          const str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_from_cstr");
          const str_val = LLVMBuildCall2(ctx.builder, str_ty, str_fn, [msg], codegen_llvm_ctx$fresh_name(ctx, "ps"));
          discard(LLVMBuildCall2(ctx.builder, panic_ty, panic_fn, [str_val], ""));
          return LLVMConstPointerNull(ctx.ptr_type);
          break __ring_match83;
        }
        __match_fail(__ring_m83);
      }
      break __ring_match82;
    }
    __match_fail(__ring_m82);
  }
}

function method_to_runtime(type_name, method) {
  if (((type_name === "Str") ? (method === "len") : false)) {
    return Option_some("ring_str_len");
  } else {
    if (((type_name === "Str") ? (method === "contains") : false)) {
      return Option_some("ring_str_contains");
    } else {
      if (((type_name === "Str") ? (method === "starts_with") : false)) {
        return Option_some("ring_str_starts_with");
      } else {
        if (((type_name === "Str") ? (method === "ends_with") : false)) {
          return Option_some("ring_str_ends_with");
        } else {
          if (((type_name === "Str") ? (method === "slice") : false)) {
            return Option_some("ring_str_slice");
          } else {
            if (((type_name === "Str") ? (method === "split") : false)) {
              return Option_some("ring_str_split");
            } else {
              if (((type_name === "Str") ? (method === "replace") : false)) {
                return Option_some("ring_str_replace");
              } else {
                if (((type_name === "Str") ? (method === "get") : false)) {
                  return Option_some("ring_str_get");
                } else {
                  if (((type_name === "Str") ? (method === "trim") : false)) {
                    return Option_some("ring_str_trim");
                  } else {
                    if (((type_name === "Str") ? (method === "trim_start") : false)) {
                      return Option_some("ring_str_trim_start");
                    } else {
                      if (((type_name === "Str") ? (method === "trim_end") : false)) {
                        return Option_some("ring_str_trim_end");
                      } else {
                        if (((type_name === "Str") ? (method === "to_upper") : false)) {
                          return Option_some("ring_str_to_upper");
                        } else {
                          if (((type_name === "Str") ? (method === "to_lower") : false)) {
                            return Option_some("ring_str_to_lower");
                          } else {
                            if (((type_name === "Str") ? (method === "char_at") : false)) {
                              return Option_some("ring_str_char_at");
                            } else {
                              if (((type_name === "Str") ? (method === "char_code_at") : false)) {
                                return Option_some("ring_str_char_code_at");
                              } else {
                                if (((type_name === "Str") ? (method === "index_of") : false)) {
                                  return Option_some("ring_str_index_of");
                                } else {
                                  if (((type_name === "Str") ? (method === "pad_start") : false)) {
                                    return Option_some("ring_str_pad_start");
                                  } else {
                                    if (((type_name === "Str") ? (method === "pad_end") : false)) {
                                      return Option_some("ring_str_pad_end");
                                    } else {
                                      if (((type_name === "Str") ? (method === "repeat") : false)) {
                                        return Option_some("ring_str_repeat");
                                      } else {
                                        if (((type_name === "Str") ? (method === "is_empty") : false)) {
                                          return Option_some("ring_str_is_empty");
                                        } else {
                                          if (((type_name === "Str") ? (method === "last_index_of") : false)) {
                                            return Option_some("ring_str_last_index_of");
                                          } else {
                                            if (((type_name === "Int") ? (method === "to_str") : false)) {
                                              return Option_some("ring_int_to_str");
                                            } else {
                                              if (((type_name === "Float") ? (method === "to_str") : false)) {
                                                return Option_some("ring_float_to_str");
                                              } else {
                                                if (((type_name === "Bool") ? (method === "to_str") : false)) {
                                                  return Option_some("ring_bool_to_str");
                                                } else {
                                                  if (((type_name === "StringBuilder") ? (method === "add") : false)) {
                                                    return Option_some("ring_sb_add");
                                                  } else {
                                                    if (((type_name === "StringBuilder") ? (method === "to_str") : false)) {
                                                      return Option_some("ring_sb_to_str");
                                                    } else {
                                                      if (((type_name === "StringBuilder") ? (method === "len") : false)) {
                                                        return Option_some("ring_sb_len");
                                                      } else {
                                                        if (((type_name === "List") ? (method === "push") : false)) {
                                                          return Option_some("ring_list_push");
                                                        } else {
                                                          if (((type_name === "List") ? (method === "len") : false)) {
                                                            return Option_some("ring_list_len");
                                                          } else {
                                                            if (((type_name === "List") ? (method === "get") : false)) {
                                                              return Option_some("ring_list_get_opt");
                                                            } else {
                                                              if (((type_name === "List") ? (method === "join") : false)) {
                                                                return Option_some("ring_list_join");
                                                              } else {
                                                                if (((type_name === "List") ? (method === "concat") : false)) {
                                                                  return Option_some("ring_list_concat");
                                                                } else {
                                                                  if (((type_name === "List") ? (method === "slice") : false)) {
                                                                    return Option_some("ring_list_slice");
                                                                  } else {
                                                                    if (((type_name === "List") ? (method === "reverse") : false)) {
                                                                      return Option_some("ring_list_reverse");
                                                                    } else {
                                                                      if (((type_name === "List") ? (method === "sort") : false)) {
                                                                        return Option_some("ring_list_sort_default");
                                                                      } else {
                                                                        if (((type_name === "List") ? (method === "is_empty") : false)) {
                                                                          return Option_some("ring_list_is_empty");
                                                                        } else {
                                                                          if (((type_name === "List") ? (method === "first") : false)) {
                                                                            return Option_some("ring_list_first");
                                                                          } else {
                                                                            if (((type_name === "List") ? (method === "last") : false)) {
                                                                              return Option_some("ring_list_last");
                                                                            } else {
                                                                              if (((type_name === "List") ? (method === "pop") : false)) {
                                                                                return Option_some("ring_list_pop");
                                                                              } else {
                                                                                if (((type_name === "List") ? (method === "set") : false)) {
                                                                                  return Option_some("ring_list_set");
                                                                                } else {
                                                                                  if (((type_name === "List") ? (method === "map") : false)) {
                                                                                    return Option_some("ring_list_map");
                                                                                  } else {
                                                                                    if (((type_name === "List") ? (method === "filter") : false)) {
                                                                                      return Option_some("ring_list_filter");
                                                                                    } else {
                                                                                      if (((type_name === "List") ? (method === "for_each") : false)) {
                                                                                        return Option_some("ring_list_for_each");
                                                                                      } else {
                                                                                        if (((type_name === "List") ? (method === "any") : false)) {
                                                                                          return Option_some("ring_list_any");
                                                                                        } else {
                                                                                          if (((type_name === "List") ? (method === "all") : false)) {
                                                                                            return Option_some("ring_list_all");
                                                                                          } else {
                                                                                            if (((type_name === "List") ? (method === "find") : false)) {
                                                                                              return Option_some("ring_list_find");
                                                                                            } else {
                                                                                              if (((type_name === "List") ? (method === "find_index") : false)) {
                                                                                                return Option_some("ring_list_find_index");
                                                                                              } else {
                                                                                                if (((type_name === "List") ? (method === "fold") : false)) {
                                                                                                  return Option_some("ring_list_fold");
                                                                                                } else {
                                                                                                  if (((type_name === "List") ? (method === "flat_map") : false)) {
                                                                                                    return Option_some("ring_list_flat_map");
                                                                                                  } else {
                                                                                                    if (((type_name === "List") ? (method === "clear") : false)) {
                                                                                                      return Option_some("ring_list_clear");
                                                                                                    } else {
                                                                                                      if (((type_name === "List") ? (method === "shift") : false)) {
                                                                                                        return Option_some("ring_list_shift");
                                                                                                      } else {
                                                                                                        if (((type_name === "List") ? (method === "extend") : false)) {
                                                                                                          return Option_some("ring_list_extend");
                                                                                                        } else {
                                                                                                          if (((type_name === "Map") ? (method === "get") : false)) {
                                                                                                            return Option_some("ring_map_get_opt");
                                                                                                          } else {
                                                                                                            if (((type_name === "Map") ? (method === "insert") : false)) {
                                                                                                              return Option_some("ring_map_set");
                                                                                                            } else {
                                                                                                              if (((type_name === "Map") ? (method === "contains_key") : false)) {
                                                                                                                return Option_some("ring_map_has");
                                                                                                              } else {
                                                                                                                if (((type_name === "Map") ? (method === "keys") : false)) {
                                                                                                                  return Option_some("ring_map_keys");
                                                                                                                } else {
                                                                                                                  if (((type_name === "Map") ? (method === "values") : false)) {
                                                                                                                    return Option_some("ring_map_values");
                                                                                                                  } else {
                                                                                                                    if (((type_name === "Map") ? (method === "entries") : false)) {
                                                                                                                      return Option_some("ring_map_entries");
                                                                                                                    } else {
                                                                                                                      if (((type_name === "Map") ? (method === "len") : false)) {
                                                                                                                        return Option_some("ring_map_len");
                                                                                                                      } else {
                                                                                                                        if (((type_name === "Map") ? (method === "remove") : false)) {
                                                                                                                          return Option_some("ring_map_delete");
                                                                                                                        } else {
                                                                                                                          if (((type_name === "Map") ? (method === "is_empty") : false)) {
                                                                                                                            return Option_some("ring_map_is_empty");
                                                                                                                          } else {
                                                                                                                            if (((type_name === "Map") ? (method === "for_each") : false)) {
                                                                                                                              return Option_some("ring_map_for_each");
                                                                                                                            } else {
                                                                                                                              if (((type_name === "Map") ? (method === "clear") : false)) {
                                                                                                                                return Option_some("ring_map_clear");
                                                                                                                              } else {
                                                                                                                                if (((type_name === "Set") ? (method === "add") : false)) {
                                                                                                                                  return Option_some("ring_set_add");
                                                                                                                                } else {
                                                                                                                                  if (((type_name === "Set") ? (method === "insert") : false)) {
                                                                                                                                    return Option_some("ring_set_add");
                                                                                                                                  } else {
                                                                                                                                    if (((type_name === "Set") ? (method === "has") : false)) {
                                                                                                                                      return Option_some("ring_set_has");
                                                                                                                                    } else {
                                                                                                                                      if (((type_name === "Set") ? (method === "contains") : false)) {
                                                                                                                                        return Option_some("ring_set_has");
                                                                                                                                      } else {
                                                                                                                                        if (((type_name === "Set") ? (method === "to_list") : false)) {
                                                                                                                                          return Option_some("ring_set_to_list");
                                                                                                                                        } else {
                                                                                                                                          if (((type_name === "Set") ? (method === "len") : false)) {
                                                                                                                                            return Option_some("ring_set_len");
                                                                                                                                          } else {
                                                                                                                                            if (((type_name === "Set") ? (method === "is_empty") : false)) {
                                                                                                                                              return Option_some("ring_set_is_empty");
                                                                                                                                            } else {
                                                                                                                                              if (((type_name === "Set") ? (method === "from_list") : false)) {
                                                                                                                                                return Option_some("ring_set_from_list");
                                                                                                                                              } else {
                                                                                                                                                if (((type_name === "Set") ? (method === "for_each") : false)) {
                                                                                                                                                  return Option_some("ring_set_for_each");
                                                                                                                                                } else {
                                                                                                                                                  if (((type_name === "Set") ? (method === "remove") : false)) {
                                                                                                                                                    return Option_some("ring_set_delete");
                                                                                                                                                  } else {
                                                                                                                                                    if (((type_name === "Option") ? (method === "unwrap_or") : false)) {
                                                                                                                                                      return Option_some("ring_Option_unwrap_or");
                                                                                                                                                    } else {
                                                                                                                                                      if (((type_name === "Option") ? (method === "unwrap") : false)) {
                                                                                                                                                        return Option_some("ring_Option_unwrap");
                                                                                                                                                      } else {
                                                                                                                                                        if (((type_name === "Option") ? (method === "is_some") : false)) {
                                                                                                                                                          return Option_some("ring_Option_is_some");
                                                                                                                                                        } else {
                                                                                                                                                          if (((type_name === "Option") ? (method === "is_none") : false)) {
                                                                                                                                                            return Option_some("ring_Option_is_none");
                                                                                                                                                          } else {
                                                                                                                                                            if (((type_name === "Option") ? (method === "map") : false)) {
                                                                                                                                                              return Option_some("ring_Option_map");
                                                                                                                                                            } else {
                                                                                                                                                              if (((type_name === "Option") ? (method === "unwrap_or_else") : false)) {
                                                                                                                                                                return Option_some("ring_Option_unwrap_or_else");
                                                                                                                                                              } else {
                                                                                                                                                                if (((type_name === "Option") ? (method === "to_fail") : false)) {
                                                                                                                                                                  return Option_some("ring_Option_to_fail");
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
  __ring_match85: {
    const __ring_m85 = _Map_get(ctx.rt_fns, name);
    if (__ring_m85._tag === "some") {
      const f = __ring_m85._0;
      return f;
      break __ring_match85;
    }
    if (__ring_m85._tag === "none") {
      const ptr = ctx.ptr_type;
      const int_count = rt_method_int_arg_count(name);
      let param_types = [];
      const __ring_end35 = arg_count;
      for (let i = 0; i < __ring_end35; i++) {
        if (((i > 0) ? ((i - 1) < int_count) : false)) {
          List_push(param_types, ctx.i64_type);
        } else {
          List_push(param_types, ptr);
        }
      }
      if (is_void_runtime_fn(name)) {
        return codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, name, param_types, ctx.void_type);
      } else {
        return codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, name, param_types, ptr);
      }
      break __ring_match85;
    }
    __match_fail(__ring_m85);
  }
}

function gen_dup_value(ctx, val) {
  const dup_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_dup", [ctx.ptr_type], ctx.void_type);
  const dup_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_dup");
  discard(LLVMBuildCall2(ctx.builder, dup_ty, dup_fn, [val], ""));
  return val;
}

function gen_field_access(ctx, receiver, field, ty) {
  const recv_val = gen_llvm_expr(ctx, receiver);
  const recv_type = hir$hexpr_type(receiver);
  __ring_match86: {
    const __ring_m86 = recv_type;
    if (__ring_m86._tag === "TupleType") {
      const field_idx = (function() {
  const __ring_m = parse_int(field);
  if (__ring_m._tag === "some") { const n = __ring_m._0; return n; }
  if (__ring_m._tag === "none") { return panic(`LLVM codegen: non-numeric tuple field: ${field}`); }
  __match_fail(__ring_m);
})();
      const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
      const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
      const idx_val = LLVMConstInt(ctx.i64_type, field_idx, 0);
      return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, idx_val], codegen_llvm_ctx$fresh_name(ctx, "t"));
      break __ring_match86;
    }
    break __ring_match86;
  }
  const type_name = (function() {
  const __ring_m = recv_type;
  if (__ring_m._tag === "StructType") { const name = __ring_m.name; return name; }
  if (__ring_m._tag === "EnumType") { const name = __ring_m.name; return name; }
  return panic(`LLVM codegen: field access on non-struct type: ${types$type_to_string(recv_type)}, field: ${field}`);
})();
  __ring_match87: {
    const __ring_m87 = _Map_get(ctx.struct_types, type_name);
    if (__ring_m87._tag === "some") {
      const info = __ring_m87._0;
      let field_idx = (-1);
      const __ring_end36 = List_len(info.field_names);
      for (let i = 0; i < __ring_end36; i++) {
        if ((__ring_index(info.field_names, i) === field)) {
          field_idx = i;
        }
      }
      if ((field_idx < 0)) {
        panic(`LLVM codegen: field '${field}' not found in struct '${type_name}'`);
      }
      const field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, recv_val, field_idx, codegen_llvm_ctx$fresh_name(ctx, "fp"));
      return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, field));
      break __ring_match87;
    }
    if (__ring_m87._tag === "none") {
      return panic(`LLVM codegen: struct type '${type_name}' not registered`);
      break __ring_match87;
    }
    __match_fail(__ring_m87);
  }
}

function gen_struct_lit(ctx, name, fields, spread) {
  __ring_match88: {
    const __ring_m88 = _Map_get(ctx.struct_types, name);
    if (__ring_m88._tag === "some") {
      const info = __ring_m88._0;
      const size = LLVMSizeOf(info.llvm_type);
      const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
      const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
      const typeid_val = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$get_or_assign_typeid(ctx, name), 0);
      const struct_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, typeid_val], codegen_llvm_ctx$fresh_name(ctx, "s"));
      __ring_match89: {
        const __ring_m89 = spread;
        if (__ring_m89._tag === "some") {
          const spread_expr = __ring_m89._0;
          let overridden = set_new();
          const __ring_iter_37 = __List_Iterable.iter(fields);
          while (true) {
            const __ring_next_37 = __ListIterator_Iterator.next(__ring_iter_37);
            if (__ring_next_37._tag === "none") break;
            const f = __ring_next_37._0;
            _Set_insert(overridden, f.name);
          }
          const spread_val = gen_llvm_expr(ctx, spread_expr);
          const __ring_end38 = List_len(info.field_names);
          for (let i = 0; i < __ring_end38; i++) {
            const src_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, spread_val, i, codegen_llvm_ctx$fresh_name(ctx, "sfp"));
            const src_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, src_ptr, codegen_llvm_ctx$fresh_name(ctx, "sfv"));
            if ((_Set_contains(overridden, __ring_index(info.field_names, i), __Str_Eq) === false)) {
              discard(gen_dup_value(ctx, src_val));
            }
            const dst_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, struct_ptr, i, codegen_llvm_ctx$fresh_name(ctx, "dfp"));
            discard(LLVMBuildStore(ctx.builder, src_val, dst_ptr));
          }
          break __ring_match89;
        }
        if (__ring_m89._tag === "none") {
          break __ring_match89;
        }
        __match_fail(__ring_m89);
      }
      const __ring_iter_39 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_39 = __ListIterator_Iterator.next(__ring_iter_39);
        if (__ring_next_39._tag === "none") break;
        const f = __ring_next_39._0;
        const val = gen_llvm_expr(ctx, f.value);
        let field_idx = (-1);
        const __ring_end40 = List_len(info.field_names);
        for (let i = 0; i < __ring_end40; i++) {
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
      break __ring_match88;
    }
    if (__ring_m88._tag === "none") {
      return panic(`LLVM codegen: struct type '${name}' not registered for literal`);
      break __ring_match88;
    }
    __match_fail(__ring_m88);
  }
}

function gen_block(ctx, stmts, tail) {
  const __ring_iter_41 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_41 = __ListIterator_Iterator.next(__ring_iter_41);
    if (__ring_next_41._tag === "none") break;
    const stmt = __ring_next_41._0;
    codegen_llvm_stmt$emit_llvm_stmt(ctx, stmt);
  }
  __ring_match90: {
    const __ring_m90 = tail;
    if (__ring_m90._tag === "some") {
      const t = __ring_m90._0;
      return gen_llvm_expr(ctx, t);
      break __ring_match90;
    }
    if (__ring_m90._tag === "none") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match90;
    }
    __match_fail(__ring_m90);
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
  const __ring_iter_42 = __List_Iterable.iter(parts);
  while (true) {
    const __ring_next_42 = __ListIterator_Iterator.next(__ring_iter_42);
    if (__ring_next_42._tag === "none") break;
    const part = __ring_next_42._0;
    __ring_match91: {
      const __ring_m91 = part;
      if (__ring_m91._tag === "Literal") {
        const s = __ring_m91._0;
        const str_val = gen_str_lit(ctx, s);
        LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], codegen_llvm_ctx$fresh_name(ctx, "sba"));
        break __ring_match91;
      }
      if (__ring_m91._tag === "Expression") {
        const e = __ring_m91._0;
        const val = gen_llvm_expr(ctx, e);
        const expr_type = hir$hexpr_type(e);
        const str_val = convert_to_str(ctx, val, expr_type);
        LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], codegen_llvm_ctx$fresh_name(ctx, "sba"));
        break __ring_match91;
      }
      __match_fail(__ring_m91);
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
      const raw = unbox_int(ctx, val);
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
          const raw = unbox_int(ctx, val);
          const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_bool_to_str", [ctx.i64_type], ctx.ptr_type);
          const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_bool_to_str");
          return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "bts"));
        } else {
          const raw = unbox_int(ctx, val);
          const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.i64_type], ctx.ptr_type);
          const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_int_to_str");
          return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "ts"));
        }
      }
    }
  }
}

function box_int(ctx, raw) {
  const shifted = LLVMBuildShl(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "sh"));
  const tagged = LLVMBuildOr(ctx.builder, shifted, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "tg"));
  return LLVMBuildIntToPtr(ctx.builder, tagged, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "bi"));
}

function box_float(ctx, raw) {
  const box_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_float", [ctx.double_type], ctx.ptr_type);
  const box_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_box_float");
  return LLVMBuildCall2(ctx.builder, box_ty, box_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "bf"));
}

function box_bool(ctx, raw) {
  const shifted = LLVMBuildShl(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "sh"));
  const tagged = LLVMBuildOr(ctx.builder, shifted, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "tg"));
  return LLVMBuildIntToPtr(ctx.builder, tagged, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "bb"));
}

function unbox_to_i1(ctx, val) {
  const raw = LLVMBuildPtrToInt(ctx.builder, val, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ub"));
  const shifted = LLVMBuildAShr(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "sh"));
  return LLVMBuildTrunc(ctx.builder, shifted, ctx.i1_type, codegen_llvm_ctx$fresh_name(ctx, "i1"));
}

function unbox_int(ctx, val) {
  const raw = LLVMBuildPtrToInt(ctx.builder, val, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ui"));
  return LLVMBuildAShr(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "uv"));
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
  ctx.match_counter = (ctx.match_counter + 1);
  const enum_name = (function() {
  const __ring_m = scrut_ty;
  if (__ring_m._tag === "EnumType") { const name = __ring_m.name; return Option_some(name); }
  return Option_none;
})();
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.merge");
  const default_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.default");
  let any_guard = false;
  const __ring_iter_43 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_43 = __ListIterator_Iterator.next(__ring_iter_43);
    if (__ring_next_43._tag === "none") break;
    const arm = __ring_next_43._0;
    __ring_match92: {
      const __ring_m92 = arm.guard;
      if (__ring_m92._tag === "some") {
        any_guard = true;
        break __ring_match92;
      }
      if (__ring_m92._tag === "none") {
        break __ring_match92;
      }
      __match_fail(__ring_m92);
    }
  }
  if (any_guard) {
    return gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn);
  }
  __ring_match93: {
    const __ring_m93 = enum_name;
    if (__ring_m93._tag === "some") {
      const ename = __ring_m93._0;
      __ring_match94: {
        const __ring_m94 = _Map_get(ctx.enum_types, ename);
        if (__ring_m94._tag === "some") {
          const enum_info = __ring_m94._0;
          const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, 0, codegen_llvm_ctx$fresh_name(ctx, "tp"));
          const tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "tag"));
          const switch_val = LLVMBuildSwitch(ctx.builder, tag_val, default_bb, List_len(arms));
          let phi_vals = [];
          let phi_bbs = [];
          let has_wildcard = false;
          const __ring_iter_44 = __List_Iterable.iter(arms);
          while (true) {
            const __ring_next_44 = __ListIterator_Iterator.next(__ring_iter_44);
            if (__ring_next_44._tag === "none") break;
            const arm = __ring_next_44._0;
            const is_wild = (function() {
  const __ring_m = arm.pattern;
  if (__ring_m._tag === "Wildcard") { return true; }
  if (__ring_m._tag === "Binding") { return true; }
  return false;
})();
            if (is_wild) {
              has_wildcard = true;
              gen_match_arm_wildcard(ctx, arm, scrut_val, default_bb, merge_bb, phi_vals, phi_bbs);
            } else {
              gen_match_arm_enum(ctx, arm, scrut_val, ename, enum_info, switch_val, merge_bb, current_fn, phi_vals, phi_bbs);
            }
          }
          if ((!has_wildcard)) {
            LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
            const mf_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_match_fail", [ctx.ptr_type, ctx.i64_type, ctx.i64_type, ctx.ptr_type], ctx.ptr_type);
            const mf_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_match_fail");
            const ename_str = gen_str_lit(ctx, `${ename} in ${ctx.current_fn_name}`);
            const site_val = LLVMConstInt(ctx.i64_type, ctx.match_counter, 0);
            discard(LLVMBuildCall2(ctx.builder, mf_ty, mf_fn, [ename_str, tag_val, site_val, scrut_val], codegen_llvm_ctx$fresh_name(ctx, "mf")));
            discard(LLVMBuildUnreachable(ctx.builder));
          }
          LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
          if ((List_len(phi_vals) > 0)) {
            const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "mr"));
            LLVMAddIncoming(phi, phi_vals, phi_bbs);
            return phi;
          } else {
            return LLVMConstPointerNull(ctx.ptr_type);
          }
          break __ring_match94;
        }
        if (__ring_m94._tag === "none") {
          return gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn);
          break __ring_match94;
        }
        __match_fail(__ring_m94);
      }
      break __ring_match93;
    }
    if (__ring_m93._tag === "none") {
      return gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn);
      break __ring_match93;
    }
    __match_fail(__ring_m93);
  }
}

function gen_match_arm_enum(ctx, arm, scrut_val, enum_name, enum_info, switch_val, merge_bb, current_fn, phi_vals, phi_bbs) {
  __ring_match95: {
    const __ring_m95 = arm.pattern;
    if (__ring_m95._tag === "Constructor") {
      const name = __ring_m95.name; const fields = __ring_m95.fields;
      __ring_match96: {
        const __ring_m96 = _Map_get(enum_info.variants, name);
        if (__ring_m96._tag === "some") {
          const vi = __ring_m96._0;
          const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `match.arm.${name}`);
          LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
          LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
          const __ring_end45 = List_len(fields);
          for (let i = 0; i < __ring_end45; i++) {
            __ring_match97: {
              const __ring_m97 = List_get(fields, i);
              if (__ring_m97._tag === "some") {
                const field_pat = __ring_m97._0;
                __ring_match98: {
                  const __ring_m98 = field_pat;
                  if (__ring_m98._tag === "Binding") {
                    const bname = __ring_m98.name;
                    const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                    const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                    discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                    _Map_insert(ctx.named_values, bname, alloca);
                    break __ring_match98;
                  }
                  if (__ring_m98._tag === "Wildcard") {
                    break __ring_match98;
                  }
                  const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                  const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
                  bind_nested_pattern(ctx, field_val, field_pat);
                  break __ring_match98;
                }
                break __ring_match97;
              }
              if (__ring_m97._tag === "none") {
                break __ring_match97;
              }
              __match_fail(__ring_m97);
            }
          }
          const body_val = gen_llvm_expr(ctx, arm.body);
          const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
          discard(LLVMBuildBr(ctx.builder, merge_bb));
          List_push(phi_vals, body_val);
          return List_push(phi_bbs, arm_end_bb);
          break __ring_match96;
        }
        if (__ring_m96._tag === "none") {
          break __ring_match96;
        }
        __match_fail(__ring_m96);
      }
      break __ring_match95;
    }
    if (__ring_m95._tag === "NamedConstructor") {
      const name = __ring_m95.name; const named_fields = __ring_m95.fields;
      __ring_match99: {
        const __ring_m99 = _Map_get(enum_info.variants, name);
        if (__ring_m99._tag === "some") {
          const vi = __ring_m99._0;
          const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `match.arm.${name}`);
          LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
          LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
          const __ring_end46 = List_len(named_fields);
          for (let i = 0; i < __ring_end46; i++) {
            __ring_match100: {
              const __ring_m100 = List_get(named_fields, i);
              if (__ring_m100._tag === "some") {
                const nf = __ring_m100._0;
                let field_idx = i;
                const __ring_end47 = List_len(vi.field_names);
                for (let fi = 0; fi < __ring_end47; fi++) {
                  if ((__ring_index(vi.field_names, fi) === nf.name)) {
                    field_idx = fi;
                  }
                }
                __ring_match101: {
                  const __ring_m101 = nf.pattern;
                  if (__ring_m101._tag === "Binding") {
                    const bname = __ring_m101.name;
                    const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                    const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                    discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                    _Map_insert(ctx.named_values, bname, alloca);
                    break __ring_match101;
                  }
                  if (__ring_m101._tag === "Wildcard") {
                    break __ring_match101;
                  }
                  const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                  const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
                  bind_nested_pattern(ctx, field_val, nf.pattern);
                  break __ring_match101;
                }
                break __ring_match100;
              }
              if (__ring_m100._tag === "none") {
                break __ring_match100;
              }
              __match_fail(__ring_m100);
            }
          }
          const body_val = gen_llvm_expr(ctx, arm.body);
          const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
          discard(LLVMBuildBr(ctx.builder, merge_bb));
          List_push(phi_vals, body_val);
          return List_push(phi_bbs, arm_end_bb);
          break __ring_match99;
        }
        if (__ring_m99._tag === "none") {
          break __ring_match99;
        }
        __match_fail(__ring_m99);
      }
      break __ring_match95;
    }
    if (__ring_m95._tag === "Wildcard") {
      break __ring_match95;
    }
    if (__ring_m95._tag === "Binding") {
      const bname = __ring_m95.name;
      break __ring_match95;
    }
    if (__ring_m95._tag === "OrPattern") {
      const patterns = __ring_m95.patterns;
      const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.arm.or");
      const __ring_iter_48 = __List_Iterable.iter(patterns);
      while (true) {
        const __ring_next_48 = __ListIterator_Iterator.next(__ring_iter_48);
        if (__ring_next_48._tag === "none") break;
        const alt = __ring_next_48._0;
        const alt_name = (function() {
  const __ring_m = alt;
  if (__ring_m._tag === "Constructor") { const name = __ring_m.name; return Option_some(name); }
  if (__ring_m._tag === "NamedConstructor") { const name = __ring_m.name; return Option_some(name); }
  return Option_none;
})();
        __ring_match102: {
          const __ring_m102 = alt_name;
          if (__ring_m102._tag === "some") {
            const an = __ring_m102._0;
            __ring_match103: {
              const __ring_m103 = _Map_get(enum_info.variants, an);
              if (__ring_m103._tag === "some") {
                const vi = __ring_m103._0;
                LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
                break __ring_match103;
              }
              if (__ring_m103._tag === "none") {
                break __ring_match103;
              }
              __match_fail(__ring_m103);
            }
            break __ring_match102;
          }
          if (__ring_m102._tag === "none") {
            break __ring_match102;
          }
          __match_fail(__ring_m102);
        }
      }
      LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
      const body_val = gen_llvm_expr(ctx, arm.body);
      const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
      discard(LLVMBuildBr(ctx.builder, merge_bb));
      List_push(phi_vals, body_val);
      return List_push(phi_bbs, arm_end_bb);
      break __ring_match95;
    }
    break __ring_match95;
  }
}

function gen_match_arm_wildcard(ctx, arm, scrut_val, default_bb, merge_bb, phi_vals, phi_bbs) {
  LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
  __ring_match104: {
    const __ring_m104 = arm.pattern;
    if (__ring_m104._tag === "Binding") {
      const bname = __ring_m104.name;
      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
      discard(LLVMBuildStore(ctx.builder, scrut_val, alloca));
      _Map_insert(ctx.named_values, bname, alloca);
      break __ring_match104;
    }
    break __ring_match104;
  }
  const body_val = gen_llvm_expr(ctx, arm.body);
  const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  List_push(phi_vals, body_val);
  return List_push(phi_bbs, arm_end_bb);
}

function bind_nested_pattern(ctx, val, pat) {
  __ring_match105: {
    const __ring_m105 = pat;
    if (__ring_m105._tag === "Binding") {
      const name = __ring_m105.name;
      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, name);
      discard(LLVMBuildStore(ctx.builder, val, alloca));
      return _Map_insert(ctx.named_values, name, alloca);
      break __ring_match105;
    }
    if (__ring_m105._tag === "Wildcard") {
      break __ring_match105;
    }
    if (__ring_m105._tag === "Constructor") {
      const name = __ring_m105.name; const qualifier = __ring_m105.qualifier; const fields = __ring_m105.fields;
      const enum_info = find_enum_by_variant(ctx, name, qualifier);
      __ring_match106: {
        const __ring_m106 = enum_info;
        if (__ring_m106._tag === "some") {
          const ei = __ring_m106._0;
          const __ring_end49 = List_len(fields);
          for (let i = 0; i < __ring_end49; i++) {
            __ring_match107: {
              const __ring_m107 = List_get(fields, i);
              if (__ring_m107._tag === "some") {
                const fp = __ring_m107._0;
                const field_ptr = LLVMBuildStructGEP2(ctx.builder, ei.llvm_type, val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "nf"));
                const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "nv"));
                bind_nested_pattern(ctx, field_val, fp);
                break __ring_match107;
              }
              if (__ring_m107._tag === "none") {
                break __ring_match107;
              }
              __match_fail(__ring_m107);
            }
          }
          break __ring_match106;
        }
        if (__ring_m106._tag === "none") {
          break __ring_match106;
        }
        __match_fail(__ring_m106);
      }
      break __ring_match105;
    }
    if (__ring_m105._tag === "TuplePattern") {
      const elements = __ring_m105.elements;
      const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
      const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
      const __ring_end50 = List_len(elements);
      for (let i = 0; i < __ring_end50; i++) {
        __ring_match108: {
          const __ring_m108 = List_get(elements, i);
          if (__ring_m108._tag === "some") {
            const ep = __ring_m108._0;
            const idx = LLVMConstInt(ctx.i64_type, i, 0);
            const elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [val, idx], codegen_llvm_ctx$fresh_name(ctx, "te"));
            bind_nested_pattern(ctx, elem, ep);
            break __ring_match108;
          }
          if (__ring_m108._tag === "none") {
            break __ring_match108;
          }
          __match_fail(__ring_m108);
        }
      }
      break __ring_match105;
    }
    if (__ring_m105._tag === "NamedConstructor") {
      const name = __ring_m105.name; const qualifier = __ring_m105.qualifier; const fields = __ring_m105.fields;
      const enum_info = find_enum_by_variant(ctx, name, qualifier);
      __ring_match109: {
        const __ring_m109 = enum_info;
        if (__ring_m109._tag === "some") {
          const ei = __ring_m109._0;
          const fnames = (function() {
  const __ring_m = _Map_get(ei.variants, name);
  if (__ring_m._tag === "some") { const vi = __ring_m._0; return vi.field_names; }
  if (__ring_m._tag === "none") { return []; }
  __match_fail(__ring_m);
})();
          const __ring_end51 = List_len(fields);
          for (let i = 0; i < __ring_end51; i++) {
            __ring_match110: {
              const __ring_m110 = List_get(fields, i);
              if (__ring_m110._tag === "some") {
                const nf = __ring_m110._0;
                let field_idx = i;
                const __ring_end52 = List_len(fnames);
                for (let fi = 0; fi < __ring_end52; fi++) {
                  if ((__ring_index(fnames, fi) === nf.name)) {
                    field_idx = fi;
                  }
                }
                const field_ptr = LLVMBuildStructGEP2(ctx.builder, ei.llvm_type, val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "nf"));
                const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "nv"));
                bind_nested_pattern(ctx, field_val, nf.pattern);
                break __ring_match110;
              }
              if (__ring_m110._tag === "none") {
                break __ring_match110;
              }
              __match_fail(__ring_m110);
            }
          }
          break __ring_match109;
        }
        if (__ring_m109._tag === "none") {
          break __ring_match109;
        }
        __match_fail(__ring_m109);
      }
      break __ring_match105;
    }
    break __ring_match105;
  }
}

function emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs) {
  __ring_match111: {
    const __ring_m111 = arm.guard;
    if (__ring_m111._tag === "some") {
      const g = __ring_m111._0;
      const body_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.body");
      const guard_val = gen_llvm_expr(ctx, g);
      const guard_i1 = unbox_to_i1(ctx, guard_val);
      if (hir$is_fresh_owned_bool_value(g)) {
        const gdrop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
        const gdrop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
        discard(LLVMBuildCall2(ctx.builder, gdrop_ty, gdrop_fn, [guard_val], ""));
      }
      discard(LLVMBuildCondBr(ctx.builder, guard_i1, body_bb, next_bb));
      LLVMPositionBuilderAtEnd(ctx.builder, body_bb);
      break __ring_match111;
    }
    if (__ring_m111._tag === "none") {
      break __ring_match111;
    }
    __match_fail(__ring_m111);
  }
  const body_val = gen_llvm_expr(ctx, arm.body);
  const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  List_push(phi_vals, body_val);
  return List_push(phi_bbs, arm_end_bb);
}

function gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn) {
  let phi_vals = [];
  let phi_bbs = [];
  let open_block = false;
  let remaining_arms = arms;
  const total = List_len(arms);
  const __ring_end53 = total;
  for (let i = 0; i < __ring_end53; i++) {
    __ring_match112: {
      const __ring_m112 = List_get(arms, i);
      if (__ring_m112._tag === "some") {
        const arm = __ring_m112._0;
        const is_last = (i === (total - 1));
        const has_guard = (function() {
  const __ring_m = arm.guard;
  if (__ring_m._tag === "some") { return true; }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
        __ring_match113: {
          const __ring_m113 = arm.pattern;
          if (__ring_m113._tag === "Wildcard") {
            open_block = false;
            const next_bb = ((has_guard ? (is_last === false) : false) ? LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") : default_bb);
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.wild");
            discard(LLVMBuildBr(ctx.builder, arm_bb));
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((has_guard ? (is_last === false) : false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            }
            break __ring_match113;
          }
          if (__ring_m113._tag === "Binding") {
            const bname = __ring_m113.name;
            open_block = false;
            const next_bb = ((has_guard ? (is_last === false) : false) ? LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") : default_bb);
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.bind");
            discard(LLVMBuildBr(ctx.builder, arm_bb));
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
            discard(LLVMBuildStore(ctx.builder, scrut_val, alloca));
            _Map_insert(ctx.named_values, bname, alloca);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((has_guard ? (is_last === false) : false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            }
            break __ring_match113;
          }
          if (__ring_m113._tag === "Literal") {
            const value = __ring_m113.value;
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.lit");
            const next_bb = (is_last ? default_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next"));
            const cond_i1 = gen_literal_pattern_cond(ctx, scrut_val, scrut_ty, value);
            discard(LLVMBuildCondBr(ctx.builder, cond_i1, arm_bb, next_bb));
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((is_last === false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            } else {
              open_block = false;
            }
            break __ring_match113;
          }
          if (__ring_m113._tag === "Constructor") {
            const cname = __ring_m113.name; const qualifier = __ring_m113.qualifier; const fields = __ring_m113.fields;
            const next_bb = (is_last ? default_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next"));
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `match.ctor.${cname}`);
            gen_ctor_tag_test(ctx, scrut_val, cname, qualifier, arm_bb, next_bb, current_fn);
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            bind_constructor_fields(ctx, scrut_val, cname, qualifier, fields);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((is_last === false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            } else {
              open_block = false;
            }
            break __ring_match113;
          }
          if (__ring_m113._tag === "NamedConstructor") {
            const cname = __ring_m113.name; const qualifier = __ring_m113.qualifier; const nfields = __ring_m113.fields;
            const next_bb = (is_last ? default_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next"));
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `match.ctor.${cname}`);
            gen_ctor_tag_test(ctx, scrut_val, cname, qualifier, arm_bb, next_bb, current_fn);
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            bind_named_constructor_fields(ctx, scrut_val, cname, qualifier, nfields);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((is_last === false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            } else {
              open_block = false;
            }
            break __ring_match113;
          }
          if (__ring_m113._tag === "OrPattern") {
            const patterns = __ring_m113.patterns;
            const next_bb = (is_last ? default_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next"));
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.or");
            const palts = patterns;
            const nalts = List_len(palts);
            const __ring_end54 = nalts;
            for (let k = 0; k < __ring_end54; k++) {
              __ring_match114: {
                const __ring_m114 = List_get(palts, k);
                if (__ring_m114._tag === "some") {
                  const alt = __ring_m114._0;
                  const alt_ref = (function() {
  const __ring_m = alt;
  if (__ring_m._tag === "Constructor") { const an = __ring_m.name; const aq = __ring_m.qualifier; return Option_some([an, aq]); }
  if (__ring_m._tag === "NamedConstructor") { const an = __ring_m.name; const aq = __ring_m.qualifier; return Option_some([an, aq]); }
  return Option_none;
})();
                  __ring_match115: {
                    const __ring_m115 = alt_ref;
                    if (__ring_m115._tag === "some") {
                      const ar = __ring_m115._0;
                      const __ring_dt2 = ar;
                      const an = __ring_dt2[0];
                      const aq = __ring_dt2[1];
                      const miss_bb = ((k === (nalts - 1)) ? next_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.or.alt"));
                      gen_ctor_tag_test(ctx, scrut_val, an, aq, arm_bb, miss_bb, current_fn);
                      LLVMPositionBuilderAtEnd(ctx.builder, miss_bb);
                      break __ring_match115;
                    }
                    if (__ring_m115._tag === "none") {
                      break __ring_match115;
                    }
                    __match_fail(__ring_m115);
                  }
                  break __ring_match114;
                }
                if (__ring_m114._tag === "none") {
                  break __ring_match114;
                }
                __match_fail(__ring_m114);
              }
            }
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((is_last === false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            } else {
              open_block = false;
            }
            break __ring_match113;
          }
          if (__ring_m113._tag === "TuplePattern") {
            const elements = __ring_m113.elements;
            const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
            const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
            const next_bb = (is_last ? default_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next"));
            const __ring_end55 = List_len(elements);
            for (let j = 0; j < __ring_end55; j++) {
              __ring_match116: {
                const __ring_m116 = List_get(elements, j);
                if (__ring_m116._tag === "some") {
                  const elem_pat = __ring_m116._0;
                  const ctor_ref = (function() {
  const __ring_m = elem_pat;
  if (__ring_m._tag === "Constructor") { const cname = __ring_m.name; const qualifier = __ring_m.qualifier; return Option_some([cname, qualifier]); }
  if (__ring_m._tag === "NamedConstructor") { const cname = __ring_m.name; const qualifier = __ring_m.qualifier; return Option_some([cname, qualifier]); }
  return Option_none;
})();
                  __ring_match117: {
                    const __ring_m117 = ctor_ref;
                    if (__ring_m117._tag === "some") {
                      const cref = __ring_m117._0;
                      const __ring_dt3 = cref;
                      const cname = __ring_dt3[0];
                      const qualifier = __ring_dt3[1];
                      const idx = LLVMConstInt(ctx.i64_type, j, 0);
                      const elem_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], codegen_llvm_ctx$fresh_name(ctx, "tc"));
                      const ei = find_enum_by_variant(ctx, cname, qualifier);
                      __ring_match118: {
                        const __ring_m118 = ei;
                        if (__ring_m118._tag === "some") {
                          const enum_info = __ring_m118._0;
                          __ring_match119: {
                            const __ring_m119 = _Map_get(enum_info.variants, cname);
                            if (__ring_m119._tag === "some") {
                              const vi = __ring_m119._0;
                              const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, elem_val, 0, codegen_llvm_ctx$fresh_name(ctx, "tp"));
                              const tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "tv"));
                              const expected = LLVMConstInt(ctx.i64_type, vi.tag, 0);
                              const cmp = LLVMBuildICmp(ctx.builder, 32, tag_val, expected, codegen_llvm_ctx$fresh_name(ctx, "tc"));
                              const pass_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tuple.check");
                              discard(LLVMBuildCondBr(ctx.builder, cmp, pass_bb, next_bb));
                              LLVMPositionBuilderAtEnd(ctx.builder, pass_bb);
                              break __ring_match119;
                            }
                            if (__ring_m119._tag === "none") {
                              break __ring_match119;
                            }
                            __match_fail(__ring_m119);
                          }
                          break __ring_match118;
                        }
                        if (__ring_m118._tag === "none") {
                          break __ring_match118;
                        }
                        __match_fail(__ring_m118);
                      }
                      break __ring_match117;
                    }
                    if (__ring_m117._tag === "none") {
                      __ring_match120: {
                        const __ring_m120 = elem_pat;
                        if (__ring_m120._tag === "Literal") {
                          const value = __ring_m120.value;
                          const idx = LLVMConstInt(ctx.i64_type, j, 0);
                          const elem_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], codegen_llvm_ctx$fresh_name(ctx, "tl"));
                          const elem_ty = tuple_element_type(scrut_ty, j);
                          const cmp = gen_literal_pattern_cond(ctx, elem_val, elem_ty, value);
                          const pass_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tuple.litcheck");
                          discard(LLVMBuildCondBr(ctx.builder, cmp, pass_bb, next_bb));
                          LLVMPositionBuilderAtEnd(ctx.builder, pass_bb);
                          break __ring_match120;
                        }
                        break __ring_match120;
                      }
                      break __ring_match117;
                    }
                    __match_fail(__ring_m117);
                  }
                  break __ring_match116;
                }
                if (__ring_m116._tag === "none") {
                  break __ring_match116;
                }
                __match_fail(__ring_m116);
              }
            }
            const __ring_end56 = List_len(elements);
            for (let j = 0; j < __ring_end56; j++) {
              __ring_match121: {
                const __ring_m121 = List_get(elements, j);
                if (__ring_m121._tag === "some") {
                  const elem_pat = __ring_m121._0;
                  __ring_match122: {
                    const __ring_m122 = elem_pat;
                    if (__ring_m122._tag === "Binding") {
                      const bname = __ring_m122.name;
                      const idx = LLVMConstInt(ctx.i64_type, j, 0);
                      const field_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], codegen_llvm_ctx$fresh_name(ctx, bname));
                      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                      discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                      _Map_insert(ctx.named_values, bname, alloca);
                      break __ring_match122;
                    }
                    if (__ring_m122._tag === "Wildcard") {
                      break __ring_match122;
                    }
                    const idx = LLVMConstInt(ctx.i64_type, j, 0);
                    const field_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], codegen_llvm_ctx$fresh_name(ctx, "tv"));
                    bind_nested_pattern(ctx, field_val, elem_pat);
                    break __ring_match122;
                  }
                  break __ring_match121;
                }
                if (__ring_m121._tag === "none") {
                  break __ring_match121;
                }
                __match_fail(__ring_m121);
              }
            }
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((is_last === false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            } else {
              open_block = false;
            }
            break __ring_match113;
          }
          open_block = false;
          const next_bb = ((has_guard ? (is_last === false) : false) ? LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") : default_bb);
          const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.other");
          discard(LLVMBuildBr(ctx.builder, arm_bb));
          LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
          bind_nested_pattern(ctx, scrut_val, arm.pattern);
          emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
          if ((has_guard ? (is_last === false) : false)) {
            LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
            open_block = true;
          }
          break __ring_match113;
        }
        break __ring_match112;
      }
      if (__ring_m112._tag === "none") {
        break __ring_match112;
      }
      __match_fail(__ring_m112);
    }
  }
  if (open_block) {
    discard(LLVMBuildBr(ctx.builder, default_bb));
  }
  LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
  const panic_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_panic", [ctx.ptr_type], ctx.ptr_type);
  const panic_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_panic");
  const msg = gen_str_lit(ctx, `match exhaustion failure #${ctx.match_counter}`);
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
}

function gen_ctor_tag_test(ctx, scrut_val, cname, qualifier, match_bb, miss_bb, current_fn) {
  const ei = find_enum_by_variant(ctx, cname, qualifier);
  __ring_match123: {
    const __ring_m123 = ei;
    if (__ring_m123._tag === "some") {
      const enum_info = __ring_m123._0;
      __ring_match124: {
        const __ring_m124 = _Map_get(enum_info.variants, cname);
        if (__ring_m124._tag === "some") {
          const vi = __ring_m124._0;
          const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, 0, codegen_llvm_ctx$fresh_name(ctx, "tp"));
          const tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "tag"));
          const expected = LLVMConstInt(ctx.i64_type, vi.tag, 0);
          const cmp = LLVMBuildICmp(ctx.builder, 32, tag_val, expected, codegen_llvm_ctx$fresh_name(ctx, "tc"));
          return discard(LLVMBuildCondBr(ctx.builder, cmp, match_bb, miss_bb));
          break __ring_match124;
        }
        if (__ring_m124._tag === "none") {
          return discard(LLVMBuildBr(ctx.builder, match_bb));
          break __ring_match124;
        }
        __match_fail(__ring_m124);
      }
      break __ring_match123;
    }
    if (__ring_m123._tag === "none") {
      return discard(LLVMBuildBr(ctx.builder, match_bb));
      break __ring_match123;
    }
    __match_fail(__ring_m123);
  }
}

function bind_constructor_fields(ctx, scrut_val, cname, qualifier, fields) {
  const ei = find_enum_by_variant(ctx, cname, qualifier);
  __ring_match125: {
    const __ring_m125 = ei;
    if (__ring_m125._tag === "some") {
      const enum_info = __ring_m125._0;
      const __ring_end57 = List_len(fields);
      for (let i = 0; i < __ring_end57; i++) {
        __ring_match126: {
          const __ring_m126 = List_get(fields, i);
          if (__ring_m126._tag === "some") {
            const field_pat = __ring_m126._0;
            __ring_match127: {
              const __ring_m127 = field_pat;
              if (__ring_m127._tag === "Binding") {
                const bname = __ring_m127.name;
                const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                _Map_insert(ctx.named_values, bname, alloca);
                break __ring_match127;
              }
              if (__ring_m127._tag === "Wildcard") {
                break __ring_match127;
              }
              const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
              const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
              bind_nested_pattern(ctx, field_val, field_pat);
              break __ring_match127;
            }
            break __ring_match126;
          }
          if (__ring_m126._tag === "none") {
            break __ring_match126;
          }
          __match_fail(__ring_m126);
        }
      }
      break __ring_match125;
    }
    if (__ring_m125._tag === "none") {
      break __ring_match125;
    }
    __match_fail(__ring_m125);
  }
}

function bind_named_constructor_fields(ctx, scrut_val, cname, qualifier, named_fields) {
  const ei = find_enum_by_variant(ctx, cname, qualifier);
  __ring_match128: {
    const __ring_m128 = ei;
    if (__ring_m128._tag === "some") {
      const enum_info = __ring_m128._0;
      __ring_match129: {
        const __ring_m129 = _Map_get(enum_info.variants, cname);
        if (__ring_m129._tag === "some") {
          const vi = __ring_m129._0;
          const __ring_end58 = List_len(named_fields);
          for (let i = 0; i < __ring_end58; i++) {
            __ring_match130: {
              const __ring_m130 = List_get(named_fields, i);
              if (__ring_m130._tag === "some") {
                const nf = __ring_m130._0;
                let field_idx = i;
                const __ring_end59 = List_len(vi.field_names);
                for (let fi = 0; fi < __ring_end59; fi++) {
                  if ((__ring_index(vi.field_names, fi) === nf.name)) {
                    field_idx = fi;
                  }
                }
                __ring_match131: {
                  const __ring_m131 = nf.pattern;
                  if (__ring_m131._tag === "Binding") {
                    const bname = __ring_m131.name;
                    const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                    const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                    discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                    _Map_insert(ctx.named_values, bname, alloca);
                    break __ring_match131;
                  }
                  if (__ring_m131._tag === "Wildcard") {
                    break __ring_match131;
                  }
                  const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                  const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
                  bind_nested_pattern(ctx, field_val, nf.pattern);
                  break __ring_match131;
                }
                break __ring_match130;
              }
              if (__ring_m130._tag === "none") {
                break __ring_match130;
              }
              __match_fail(__ring_m130);
            }
          }
          break __ring_match129;
        }
        if (__ring_m129._tag === "none") {
          break __ring_match129;
        }
        __match_fail(__ring_m129);
      }
      break __ring_match128;
    }
    if (__ring_m128._tag === "none") {
      break __ring_match128;
    }
    __match_fail(__ring_m128);
  }
}

function find_enum_by_variant(ctx, variant_name, qualifier) {
  __ring_match132: {
    const __ring_m132 = qualifier;
    if (__ring_m132._tag === "some") {
      const q = __ring_m132._0;
      __ring_match133: {
        const __ring_m133 = _Map_get(ctx.enum_types, q);
        if (__ring_m133._tag === "some") {
          const ei = __ring_m133._0;
          return Option_some(ei);
          break __ring_match133;
        }
        if (__ring_m133._tag === "none") {
          break __ring_match133;
        }
        __match_fail(__ring_m133);
      }
      break __ring_match132;
    }
    if (__ring_m132._tag === "none") {
      break __ring_match132;
    }
    __match_fail(__ring_m132);
  }
  __ring_match134: {
    const __ring_m134 = _Map_get(ctx.enum_types, variant_name);
    if (__ring_m134._tag === "some") {
      const ei = __ring_m134._0;
      return Option_some(ei);
      break __ring_match134;
    }
    if (__ring_m134._tag === "none") {
      break __ring_match134;
    }
    __match_fail(__ring_m134);
  }
  const __ring_iter_60 = __List_Iterable.iter(_Map_entries(ctx.enum_types));
  while (true) {
    const __ring_next_60 = __ListIterator_Iterator.next(__ring_iter_60);
    if (__ring_next_60._tag === "none") break;
    const entry = __ring_next_60._0;
    const __ring_dt4 = entry;
    const ename = __ring_dt4[0];
    const einfo = __ring_dt4[1];
    __ring_match135: {
      const __ring_m135 = _Map_get(einfo.variants, variant_name);
      if (__ring_m135._tag === "some") {
        return Option_some(einfo);
        break __ring_match135;
      }
      if (__ring_m135._tag === "none") {
        break __ring_match135;
      }
      __match_fail(__ring_m135);
    }
  }
  return Option_none;
}

function get_tuple_llvm_type(ctx, count) {
  let elem_types = [];
  const __ring_end61 = count;
  for (let i = 0; i < __ring_end61; i++) {
    List_push(elem_types, ctx.ptr_type);
  }
  return LLVMStructTypeInContext(ctx.context, elem_types, 0);
}

function tuple_element_type(ty, idx) {
  __ring_match136: {
    const __ring_m136 = ty;
    if (__ring_m136._tag === "TupleType") {
      const elements = __ring_m136.elements;
      __ring_match137: {
        const __ring_m137 = List_get(elements, idx);
        if (__ring_m137._tag === "some") {
          const t = __ring_m137._0;
          return t;
          break __ring_match137;
        }
        if (__ring_m137._tag === "none") {
          return types$Type_ErrorType;
          break __ring_match137;
        }
        __match_fail(__ring_m137);
      }
      break __ring_match136;
    }
    return types$Type_ErrorType;
    break __ring_match136;
  }
}

function gen_literal_pattern_cond(ctx, scrut_val, scrut_ty, value) {
  __ring_match138: {
    const __ring_m138 = value;
    if (__ring_m138._tag === "IntVal") {
      const n = __ring_m138._0;
      const raw = unbox_int(ctx, scrut_val);
      const lit = LLVMConstInt(ctx.i64_type, n, 1);
      return LLVMBuildICmp(ctx.builder, 32, raw, lit, codegen_llvm_ctx$fresh_name(ctx, "eq"));
      break __ring_match138;
    }
    if (__ring_m138._tag === "BoolVal") {
      const b = __ring_m138._0;
      const raw = unbox_int(ctx, scrut_val);
      const lit = (b ? LLVMConstInt(ctx.i64_type, 1, 0) : LLVMConstInt(ctx.i64_type, 0, 0));
      return LLVMBuildICmp(ctx.builder, 32, raw, lit, codegen_llvm_ctx$fresh_name(ctx, "eq"));
      break __ring_match138;
    }
    if (__ring_m138._tag === "StrVal") {
      const s = __ring_m138._0;
      const lit_str = gen_str_lit(ctx, s);
      const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
      const result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [scrut_val, lit_str], codegen_llvm_ctx$fresh_name(ctx, "seq"));
      return LLVMBuildTrunc(ctx.builder, result, ctx.i1_type, codegen_llvm_ctx$fresh_name(ctx, "i1"));
      break __ring_match138;
    }
    if (__ring_m138._tag === "FloatVal") {
      const f = __ring_m138._0;
      const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
      const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
      const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [scrut_val], codegen_llvm_ctx$fresh_name(ctx, "uf"));
      const lit = LLVMConstReal(ctx.double_type, f);
      return LLVMBuildFCmp(ctx.builder, 1, raw, lit, codegen_llvm_ctx$fresh_name(ctx, "feq"));
      break __ring_match138;
    }
    __match_fail(__ring_m138);
  }
}

function gen_named_variant_construct(ctx, enum_name, variant_name, fields) {
  __ring_match139: {
    const __ring_m139 = _Map_get(ctx.enum_types, enum_name);
    if (__ring_m139._tag === "some") {
      const enum_info = __ring_m139._0;
      __ring_match140: {
        const __ring_m140 = _Map_get(enum_info.variants, variant_name);
        if (__ring_m140._tag === "some") {
          const vi = __ring_m140._0;
          const size = LLVMSizeOf(enum_info.llvm_type);
          const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
          const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
          const enum_tid_val = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$get_or_assign_typeid(ctx, enum_name), 0);
          const enum_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, enum_tid_val], codegen_llvm_ctx$fresh_name(ctx, "ev"));
          const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "tag"));
          discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, vi.tag, 0), tag_ptr));
          const __ring_end62 = List_len(fields);
          for (let i = 0; i < __ring_end62; i++) {
            __ring_match141: {
              const __ring_m141 = List_get(fields, i);
              if (__ring_m141._tag === "some") {
                const f = __ring_m141._0;
                const val = gen_llvm_expr(ctx, f.value);
                let field_idx = i;
                const __ring_end63 = List_len(vi.field_names);
                for (let fi = 0; fi < __ring_end63; fi++) {
                  if ((__ring_index(vi.field_names, fi) === f.name)) {
                    field_idx = fi;
                  }
                }
                const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                discard(LLVMBuildStore(ctx.builder, val, field_ptr));
                break __ring_match141;
              }
              if (__ring_m141._tag === "none") {
                break __ring_match141;
              }
              __match_fail(__ring_m141);
            }
          }
          return enum_ptr;
          break __ring_match140;
        }
        if (__ring_m140._tag === "none") {
          return panic(`LLVM codegen: variant '${variant_name}' not found in enum '${enum_name}'`);
          break __ring_match140;
        }
        __match_fail(__ring_m140);
      }
      break __ring_match139;
    }
    if (__ring_m139._tag === "none") {
      const ctor_name = `ring_${enum_name}_${variant_name}`;
      __ring_match142: {
        const __ring_m142 = _Map_get(ctx.functions, ctor_name);
        if (__ring_m142._tag === "some") {
          const fn_val = __ring_m142._0;
          let args = [];
          const __ring_iter_64 = __List_Iterable.iter(fields);
          while (true) {
            const __ring_next_64 = __ListIterator_Iterator.next(__ring_iter_64);
            if (__ring_next_64._tag === "none") break;
            const f = __ring_next_64._0;
            List_push(args, gen_llvm_expr(ctx, f.value));
          }
          const fn_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, ctor_name);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return panic(`LLVM codegen: fn type not found for ${ctor_name}`); }
  __match_fail(__ring_m);
})();
          return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, codegen_llvm_ctx$fresh_name(ctx, "vc"));
          break __ring_match142;
        }
        if (__ring_m142._tag === "none") {
          return panic(`LLVM codegen: enum '${enum_name}' not registered for variant construct`);
          break __ring_match142;
        }
        __match_fail(__ring_m142);
      }
      break __ring_match139;
    }
    __match_fail(__ring_m139);
  }
}

function gen_list_lit(ctx, elements) {
  const new_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_new", [], ctx.ptr_type);
  const new_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_new");
  const list = LLVMBuildCall2(ctx.builder, new_ty, new_fn, [], codegen_llvm_ctx$fresh_name(ctx, "ls"));
  const push_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_push", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
  const push_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_push");
  const __ring_iter_65 = __List_Iterable.iter(elements);
  while (true) {
    const __ring_next_65 = __ListIterator_Iterator.next(__ring_iter_65);
    if (__ring_next_65._tag === "none") break;
    const elem = __ring_next_65._0;
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
  if ((type_name === "List")) {
    const raw_idx = unbox_int(ctx, idx_val);
    const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
    const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
    return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, raw_idx], codegen_llvm_ctx$fresh_name(ctx, "lg"));
  } else {
    if ((type_name === "Str")) {
      const raw_idx = unbox_int(ctx, idx_val);
      const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
      const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_get");
      return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, raw_idx], codegen_llvm_ctx$fresh_name(ctx, "sg"));
    } else {
      if ((type_name === "Map")) {
        const map_get_name = (is_int_keyed_map(recv_type) ? "ring_map_int_get" : "ring_map_get");
        const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, map_get_name, [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
        const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, map_get_name);
        return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, idx_val], codegen_llvm_ctx$fresh_name(ctx, "mg"));
      } else {
        const raw_idx = unbox_int(ctx, idx_val);
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
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const range_typeid = LLVMConstInt(ctx.i64_type, 10, 0);
  const range_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, range_typeid], codegen_llvm_ctx$fresh_name(ctx, "rng"));
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
  let env_elem_types = [ctx.i64_type];
  const __ring_iter_66 = __List_Iterable.iter(captures);
  while (true) {
    const __ring_next_66 = __ListIterator_Iterator.next(__ring_iter_66);
    if (__ring_next_66._tag === "none") break;
    const c = __ring_next_66._0;
    List_push(env_elem_types, ctx.ptr_type);
  }
  const env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0);
  let fn_param_types = [ctx.ptr_type];
  const __ring_iter_67 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_67 = __ListIterator_Iterator.next(__ring_iter_67);
    if (__ring_next_67._tag === "none") break;
    const p = __ring_next_67._0;
    List_push(fn_param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, fn_param_types, 0);
  const lambda_fn = LLVMAddFunction(ctx.module, lambda_name, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_named = ctx.named_values;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(lambda_fn);
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, lambda_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const env_ptr = LLVMGetParam(lambda_fn, 0);
  const __ring_end68 = List_len(captures);
  for (let i = 0; i < __ring_end68; i++) {
    __ring_match143: {
      const __ring_m143 = List_get(captures, i);
      if (__ring_m143._tag === "some") {
        const cap_name = __ring_m143._0;
        const cap_ptr = LLVMBuildStructGEP2(ctx.builder, env_ty, env_ptr, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ce"));
        const cap_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, cap_ptr, codegen_llvm_ctx$fresh_name(ctx, cap_name));
        const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, cap_name);
        discard(LLVMBuildStore(ctx.builder, cap_val, alloca));
        _Map_insert(ctx.named_values, cap_name, alloca);
        break __ring_match143;
      }
      if (__ring_m143._tag === "none") {
        break __ring_match143;
      }
      __match_fail(__ring_m143);
    }
  }
  const __ring_end69 = List_len(params);
  for (let i = 0; i < __ring_end69; i++) {
    __ring_match144: {
      const __ring_m144 = List_get(params, i);
      if (__ring_m144._tag === "some") {
        const p = __ring_m144._0;
        const param_val = LLVMGetParam(lambda_fn, (i + 1));
        const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, p.name);
        discard(LLVMBuildStore(ctx.builder, param_val, alloca));
        _Map_insert(ctx.named_values, p.name, alloca);
        break __ring_match144;
      }
      if (__ring_m144._tag === "none") {
        break __ring_match144;
      }
      __match_fail(__ring_m144);
    }
  }
  const body_val = gen_llvm_expr(ctx, body);
  discard(LLVMBuildRet(ctx.builder, body_val));
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
  LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
  const env_size = LLVMSizeOf(env_ty);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const env_typeid = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, 0);
  const closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0);
  const env_alloc = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [env_size, env_typeid], codegen_llvm_ctx$fresh_name(ctx, "env"));
  const count_slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, 0, codegen_llvm_ctx$fresh_name(ctx, "cnt"));
  discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, List_len(captures), 0), count_slot));
  const __ring_end70 = List_len(captures);
  for (let i = 0; i < __ring_end70; i++) {
    __ring_match145: {
      const __ring_m145 = List_get(captures, i);
      if (__ring_m145._tag === "some") {
        const cap_name = __ring_m145._0;
        const cap_val = (function() {
  const __ring_m = _Map_get(ctx.named_values, cap_name);
  if (__ring_m._tag === "some") { const alloca = __ring_m._0; return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "cv")); }
  if (__ring_m._tag === "none") { return LLVMConstPointerNull(ctx.ptr_type); }
  __match_fail(__ring_m);
})();
        discard(gen_dup_value(ctx, cap_val));
        const cap_ptr = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ep"));
        discard(LLVMBuildStore(ctx.builder, cap_val, cap_ptr));
        break __ring_match145;
      }
      if (__ring_m145._tag === "none") {
        break __ring_match145;
      }
      __match_fail(__ring_m145);
    }
  }
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const closure_size = LLVMSizeOf(closure_ty);
  const closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], codegen_llvm_ctx$fresh_name(ctx, "cls"));
  const fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
  discard(LLVMBuildStore(ctx.builder, lambda_fn, fn_ptr_slot));
  const env_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
  discard(LLVMBuildStore(ctx.builder, env_alloc, env_ptr_slot));
  return closure_ptr;
}

function consider_capture_name(ctx, name, resolved_name, params, captures) {
  const lookup_name = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return rn; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
  let is_param = false;
  const __ring_iter_71 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_71 = __ListIterator_Iterator.next(__ring_iter_71);
    if (__ring_next_71._tag === "none") break;
    const p = __ring_next_71._0;
    if (((p.name === lookup_name) ? true : (p.name === name))) {
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
  __ring_match146: {
    const __ring_m146 = _Map_get(ctx.functions, mangled2);
    if (__ring_m146._tag === "some") {
      return true;
      break __ring_match146;
    }
    if (__ring_m146._tag === "none") {
      const mangled3 = codegen_llvm_ctx$llvm_resolve_fn(ctx, name);
      __ring_match147: {
        const __ring_m147 = _Map_get(ctx.functions, mangled3);
        if (__ring_m147._tag === "some") {
          return true;
          break __ring_match147;
        }
        if (__ring_m147._tag === "none") {
          return false;
          break __ring_match147;
        }
        __match_fail(__ring_m147);
      }
      break __ring_match146;
    }
    __match_fail(__ring_m146);
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
        const __ring_iter_72 = __List_Iterable.iter(captures);
        while (true) {
          const __ring_next_72 = __ListIterator_Iterator.next(__ring_iter_72);
          if (__ring_next_72._tag === "none") break;
          const c = __ring_next_72._0;
          if (((c === lookup_name) ? true : (c === name))) {
            already = true;
          }
        }
        if ((already === false)) {
          return List_push(captures, lookup_name);
        }
      }
    }
  }
}

function collect_dispatch_dict(ctx, dispatch, params, captures) {
  __ring_match148: {
    const __ring_m148 = dispatch;
    if (__ring_m148._tag === "some") {
      const d = __ring_m148._0;
      __ring_match149: {
        const __ring_m149 = d;
        if (__ring_m149._tag === "Dict") {
          const param = __ring_m149.param;
          return consider_capture_name(ctx, param, Option_none, params, captures);
          break __ring_match149;
        }
        if (__ring_m149._tag === "Direct") {
          const dict = __ring_m149.dict; const extra_dicts = __ring_m149.extra_dicts;
          consider_capture_name(ctx, dict, Option_none, params, captures);
          const __ring_iter_73 = __List_Iterable.iter(extra_dicts);
          while (true) {
            const __ring_next_73 = __ListIterator_Iterator.next(__ring_iter_73);
            if (__ring_next_73._tag === "none") break;
            const ed = __ring_next_73._0;
            collect_dictref_names(ctx, ed, params, captures);
          }
          break __ring_match149;
        }
        if (__ring_m149._tag === "Builtin") {
          break __ring_match149;
        }
        __match_fail(__ring_m149);
      }
      break __ring_match148;
    }
    if (__ring_m148._tag === "none") {
      break __ring_match148;
    }
    __match_fail(__ring_m148);
  }
}

function collect_dictref_names(ctx, dr, params, captures) {
  __ring_match150: {
    const __ring_m150 = dr;
    if (__ring_m150._tag === "Simple") {
      const name = __ring_m150._0;
      return consider_capture_name(ctx, name, Option_none, params, captures);
      break __ring_match150;
    }
    if (__ring_m150._tag === "Static") {
      break __ring_match150;
    }
    if (__ring_m150._tag === "Wrapped") {
      const dict = __ring_m150.dict; const inner_dicts = __ring_m150.inner_dicts;
      consider_capture_name(ctx, dict, Option_none, params, captures);
      const __ring_iter_74 = __List_Iterable.iter(inner_dicts);
      while (true) {
        const __ring_next_74 = __ListIterator_Iterator.next(__ring_iter_74);
        if (__ring_next_74._tag === "none") break;
        const inner = __ring_next_74._0;
        collect_dictref_names(ctx, inner, params, captures);
      }
      break __ring_match150;
    }
    __match_fail(__ring_m150);
  }
}

function collect_captures(ctx, expr, params, captures) {
  __ring_match151: {
    const __ring_m151 = expr;
    if (__ring_m151._tag === "Ident") {
      const name = __ring_m151.name; const resolved_name = __ring_m151.resolved_name;
      return consider_capture_name(ctx, name, resolved_name, params, captures);
      break __ring_match151;
    }
    if (__ring_m151._tag === "BinOp") {
      const left = __ring_m151.left; const right = __ring_m151.right; const eq_dispatch = __ring_m151.eq_dispatch; const ord_dispatch = __ring_m151.ord_dispatch;
      collect_captures(ctx, left, params, captures);
      collect_captures(ctx, right, params, captures);
      collect_dispatch_dict(ctx, eq_dispatch, params, captures);
      return collect_dispatch_dict(ctx, ord_dispatch, params, captures);
      break __ring_match151;
    }
    if (__ring_m151._tag === "UnaryOp") {
      const operand = __ring_m151.operand;
      return collect_captures(ctx, operand, params, captures);
      break __ring_match151;
    }
    if (__ring_m151._tag === "Call") {
      const callee = __ring_m151.callee; const args = __ring_m151.args; const resolved_dicts = __ring_m151.resolved_dicts; const dict_dispatch = __ring_m151.dict_dispatch;
      collect_captures(ctx, callee, params, captures);
      const __ring_iter_75 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_75 = __ListIterator_Iterator.next(__ring_iter_75);
        if (__ring_next_75._tag === "none") break;
        const a = __ring_next_75._0;
        collect_captures(ctx, a, params, captures);
      }
      const __ring_iter_76 = __List_Iterable.iter(resolved_dicts);
      while (true) {
        const __ring_next_76 = __ListIterator_Iterator.next(__ring_iter_76);
        if (__ring_next_76._tag === "none") break;
        const d = __ring_next_76._0;
        collect_dictref_names(ctx, d, params, captures);
      }
      __ring_match152: {
        const __ring_m152 = dict_dispatch;
        if (__ring_m152._tag === "some") {
          const dd = __ring_m152._0;
          return consider_capture_name(ctx, dd.dict_param, Option_none, params, captures);
          break __ring_match152;
        }
        if (__ring_m152._tag === "none") {
          break __ring_match152;
        }
        __match_fail(__ring_m152);
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "DictConstruct") {
      const inner = __ring_m151.inner;
      const __ring_iter_77 = __List_Iterable.iter(inner);
      while (true) {
        const __ring_next_77 = __ListIterator_Iterator.next(__ring_iter_77);
        if (__ring_next_77._tag === "none") break;
        const d = __ring_next_77._0;
        collect_dictref_names(ctx, d, params, captures);
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "FieldAccess") {
      const receiver = __ring_m151.receiver;
      return collect_captures(ctx, receiver, params, captures);
      break __ring_match151;
    }
    if (__ring_m151._tag === "Block") {
      const stmts = __ring_m151.stmts; const tail = __ring_m151.tail;
      const __ring_iter_78 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_78 = __ListIterator_Iterator.next(__ring_iter_78);
        if (__ring_next_78._tag === "none") break;
        const s = __ring_next_78._0;
        collect_captures_stmt(ctx, s, params, captures);
      }
      __ring_match153: {
        const __ring_m153 = tail;
        if (__ring_m153._tag === "some") {
          const t = __ring_m153._0;
          return collect_captures(ctx, t, params, captures);
          break __ring_match153;
        }
        if (__ring_m153._tag === "none") {
          break __ring_match153;
        }
        __match_fail(__ring_m153);
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "IfExpr") {
      const condition = __ring_m151.condition; const then_branch = __ring_m151.then_branch; const else_branch = __ring_m151.else_branch;
      collect_captures(ctx, condition, params, captures);
      collect_captures(ctx, then_branch, params, captures);
      __ring_match154: {
        const __ring_m154 = else_branch;
        if (__ring_m154._tag === "some") {
          const eb = __ring_m154._0;
          return collect_captures(ctx, eb, params, captures);
          break __ring_match154;
        }
        if (__ring_m154._tag === "none") {
          break __ring_match154;
        }
        __match_fail(__ring_m154);
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "MatchExpr") {
      const scrutinee = __ring_m151.scrutinee; const arms = __ring_m151.arms;
      collect_captures(ctx, scrutinee, params, captures);
      const __ring_iter_79 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_79 = __ListIterator_Iterator.next(__ring_iter_79);
        if (__ring_next_79._tag === "none") break;
        const arm = __ring_next_79._0;
        collect_captures(ctx, arm.body, params, captures);
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "StringInterp") {
      const parts = __ring_m151.parts;
      const __ring_iter_80 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_80 = __ListIterator_Iterator.next(__ring_iter_80);
        if (__ring_next_80._tag === "none") break;
        const part = __ring_next_80._0;
        __ring_match155: {
          const __ring_m155 = part;
          if (__ring_m155._tag === "Expression") {
            const e = __ring_m155._0;
            collect_captures(ctx, e, params, captures);
            break __ring_match155;
          }
          break __ring_match155;
        }
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "StructLit") {
      const fields = __ring_m151.fields; const spread = __ring_m151.spread;
      const __ring_iter_81 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_81 = __ListIterator_Iterator.next(__ring_iter_81);
        if (__ring_next_81._tag === "none") break;
        const f = __ring_next_81._0;
        collect_captures(ctx, f.value, params, captures);
      }
      __ring_match156: {
        const __ring_m156 = spread;
        if (__ring_m156._tag === "some") {
          const sp = __ring_m156._0;
          return collect_captures(ctx, sp, params, captures);
          break __ring_match156;
        }
        if (__ring_m156._tag === "none") {
          break __ring_match156;
        }
        __match_fail(__ring_m156);
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "ListLit") {
      const elements = __ring_m151.elements;
      const __ring_iter_82 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_82 = __ListIterator_Iterator.next(__ring_iter_82);
        if (__ring_next_82._tag === "none") break;
        const e = __ring_next_82._0;
        collect_captures(ctx, e, params, captures);
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "TupleLit") {
      const elements = __ring_m151.elements;
      const __ring_iter_83 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_83 = __ListIterator_Iterator.next(__ring_iter_83);
        if (__ring_next_83._tag === "none") break;
        const e = __ring_next_83._0;
        collect_captures(ctx, e, params, captures);
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "IndexExpr") {
      const receiver = __ring_m151.receiver; const index = __ring_m151.index;
      collect_captures(ctx, receiver, params, captures);
      return collect_captures(ctx, index, params, captures);
      break __ring_match151;
    }
    if (__ring_m151._tag === "Lambda") {
      const lb = __ring_m151.body;
      return collect_captures(ctx, lb, params, captures);
      break __ring_match151;
    }
    if (__ring_m151._tag === "NamedVariantConstruct") {
      const nvc_fields = __ring_m151.fields; const nvc_spread = __ring_m151.spread;
      const __ring_iter_84 = __List_Iterable.iter(nvc_fields);
      while (true) {
        const __ring_next_84 = __ListIterator_Iterator.next(__ring_iter_84);
        if (__ring_next_84._tag === "none") break;
        const f = __ring_next_84._0;
        collect_captures(ctx, f.value, params, captures);
      }
      __ring_match157: {
        const __ring_m157 = nvc_spread;
        if (__ring_m157._tag === "some") {
          const sp = __ring_m157._0;
          return collect_captures(ctx, sp, params, captures);
          break __ring_match157;
        }
        if (__ring_m157._tag === "none") {
          break __ring_match157;
        }
        __match_fail(__ring_m157);
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "TryCatch") {
      const tc_body = __ring_m151.body; const tc_arms = __ring_m151.arms;
      collect_captures(ctx, tc_body, params, captures);
      const __ring_iter_85 = __List_Iterable.iter(tc_arms);
      while (true) {
        const __ring_next_85 = __ListIterator_Iterator.next(__ring_iter_85);
        if (__ring_next_85._tag === "none") break;
        const arm = __ring_next_85._0;
        collect_captures(ctx, arm.body, params, captures);
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "HandleExpr") {
      const he_body = __ring_m151.body;
      return collect_captures(ctx, he_body, params, captures);
      break __ring_match151;
    }
    if (__ring_m151._tag === "EffectOp") {
      const eo_eff = __ring_m151.effect_name; const eo_args = __ring_m151.args;
      const __ring_iter_86 = __List_Iterable.iter(eo_args);
      while (true) {
        const __ring_next_86 = __ListIterator_Iterator.next(__ring_iter_86);
        if (__ring_next_86._tag === "none") break;
        const a = __ring_next_86._0;
        collect_captures(ctx, a, params, captures);
      }
      if ((eo_eff !== "fail")) {
        return consider_capture_name(ctx, hir$evidence_param_name(eo_eff), Option_none, params, captures);
      }
      break __ring_match151;
    }
    if (__ring_m151._tag === "RangeExpr") {
      const rs = __ring_m151.start; const re = __ring_m151.end;
      collect_captures(ctx, rs, params, captures);
      return collect_captures(ctx, re, params, captures);
      break __ring_match151;
    }
    if (__ring_m151._tag === "Clone") {
      const inner = __ring_m151.inner;
      return collect_captures(ctx, inner, params, captures);
      break __ring_match151;
    }
    break __ring_match151;
  }
}

function collect_captures_stmt(ctx, stmt, params, captures) {
  __ring_match158: {
    const __ring_m158 = stmt;
    if (__ring_m158._tag === "Let") {
      const init = __ring_m158.init;
      return collect_captures(ctx, init, params, captures);
      break __ring_match158;
    }
    if (__ring_m158._tag === "Var") {
      const init = __ring_m158.init;
      return collect_captures(ctx, init, params, captures);
      break __ring_match158;
    }
    if (__ring_m158._tag === "Assign") {
      const target = __ring_m158.target; const value = __ring_m158.value;
      collect_captures(ctx, target, params, captures);
      return collect_captures(ctx, value, params, captures);
      break __ring_match158;
    }
    if (__ring_m158._tag === "ExprStmt") {
      const expr = __ring_m158.expr;
      return collect_captures(ctx, expr, params, captures);
      break __ring_match158;
    }
    if (__ring_m158._tag === "Return") {
      const value = __ring_m158.value;
      __ring_match159: {
        const __ring_m159 = value;
        if (__ring_m159._tag === "some") {
          const v = __ring_m159._0;
          return collect_captures(ctx, v, params, captures);
          break __ring_match159;
        }
        if (__ring_m159._tag === "none") {
          break __ring_match159;
        }
        __match_fail(__ring_m159);
      }
      break __ring_match158;
    }
    if (__ring_m158._tag === "While") {
      const condition = __ring_m158.condition; const body = __ring_m158.body;
      collect_captures(ctx, condition, params, captures);
      return collect_captures(ctx, body, params, captures);
      break __ring_match158;
    }
    if (__ring_m158._tag === "ForIn") {
      const iterable = __ring_m158.iterable; const body = __ring_m158.body;
      collect_captures(ctx, iterable, params, captures);
      return collect_captures(ctx, body, params, captures);
      break __ring_match158;
    }
    if (__ring_m158._tag === "LetDestructure") {
      const init = __ring_m158.init;
      return collect_captures(ctx, init, params, captures);
      break __ring_match158;
    }
    if (__ring_m158._tag === "IfLet") {
      const expr = __ring_m158.expr; const then_block = __ring_m158.then_block; const else_block = __ring_m158.else_block;
      collect_captures(ctx, expr, params, captures);
      collect_captures(ctx, then_block, params, captures);
      __ring_match160: {
        const __ring_m160 = else_block;
        if (__ring_m160._tag === "some") {
          const eb = __ring_m160._0;
          return collect_captures(ctx, eb, params, captures);
          break __ring_match160;
        }
        if (__ring_m160._tag === "none") {
          break __ring_match160;
        }
        __match_fail(__ring_m160);
      }
      break __ring_match158;
    }
    if (__ring_m158._tag === "Drop") {
      const name = __ring_m158.name;
      return consider_capture_name(ctx, name, Option_none, params, captures);
      break __ring_match158;
    }
    if (__ring_m158._tag === "Dup") {
      const name = __ring_m158.name;
      return consider_capture_name(ctx, name, Option_none, params, captures);
      break __ring_match158;
    }
    break __ring_match158;
  }
}

function gen_try_catch(ctx, body, arms) {
  const body_ty = hir$hexpr_type(body);
  const body_closure = gen_lambda(ctx, [], body_ty, body, body_ty);
  const catch_closure = gen_catch_closure(ctx, arms);
  const try_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_try", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
  const try_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_try");
  return LLVMBuildCall2(ctx.builder, try_ty, try_fn, [body_closure, catch_closure], codegen_llvm_ctx$fresh_name(ctx, "try"));
}

function gen_catch_closure(ctx, arms) {
  const fn_name = codegen_llvm_ctx$fresh_name(ctx, "ring_catch_");
  ctx.lambda_counter = (ctx.lambda_counter + 1);
  const err_param = new hir$HParam("__catch_err", types$Type_AnyType, Option_none, false);
  const params = [err_param];
  let captures = [];
  const __ring_iter_87 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_87 = __ListIterator_Iterator.next(__ring_iter_87);
    if (__ring_next_87._tag === "none") break;
    const arm = __ring_next_87._0;
    collect_captures(ctx, arm.body, params, captures);
  }
  let env_elem_types = [];
  const __ring_iter_88 = __List_Iterable.iter(captures);
  while (true) {
    const __ring_next_88 = __ListIterator_Iterator.next(__ring_iter_88);
    if (__ring_next_88._tag === "none") break;
    const c = __ring_next_88._0;
    List_push(env_elem_types, ctx.ptr_type);
  }
  const env_ty = ((List_len(captures) > 0) ? LLVMStructTypeInContext(ctx.context, env_elem_types, 0) : LLVMStructTypeInContext(ctx.context, [ctx.ptr_type], 0));
  const fn_ty = LLVMFunctionType(ctx.ptr_type, [ctx.ptr_type, ctx.ptr_type], 0);
  const catch_fn = LLVMAddFunction(ctx.module, fn_name, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_named = ctx.named_values;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(catch_fn);
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, catch_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const env_ptr = LLVMGetParam(catch_fn, 0);
  const __ring_end89 = List_len(captures);
  for (let i = 0; i < __ring_end89; i++) {
    __ring_match161: {
      const __ring_m161 = List_get(captures, i);
      if (__ring_m161._tag === "some") {
        const cap_name = __ring_m161._0;
        const cap_ptr = LLVMBuildStructGEP2(ctx.builder, env_ty, env_ptr, i, codegen_llvm_ctx$fresh_name(ctx, "ce"));
        const cap_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, cap_ptr, codegen_llvm_ctx$fresh_name(ctx, cap_name));
        const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, cap_name);
        discard(LLVMBuildStore(ctx.builder, cap_val, alloca));
        _Map_insert(ctx.named_values, cap_name, alloca);
        break __ring_match161;
      }
      if (__ring_m161._tag === "none") {
        break __ring_match161;
      }
      __match_fail(__ring_m161);
    }
  }
  const error_val = LLVMGetParam(catch_fn, 1);
  const catch_val = gen_catch_arms(ctx, error_val, arms);
  discard(LLVMBuildRet(ctx.builder, catch_val));
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
  LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
  const env_size = LLVMSizeOf(env_ty);
  const alloc_fn2 = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty2 = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const catch_closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0);
  const env_alloc = LLVMBuildCall2(ctx.builder, alloc_ty2, alloc_fn2, [env_size, catch_closure_typeid], codegen_llvm_ctx$fresh_name(ctx, "env"));
  const __ring_end90 = List_len(captures);
  for (let i = 0; i < __ring_end90; i++) {
    __ring_match162: {
      const __ring_m162 = List_get(captures, i);
      if (__ring_m162._tag === "some") {
        const cap_name = __ring_m162._0;
        const cap_val = (function() {
  const __ring_m = _Map_get(ctx.named_values, cap_name);
  if (__ring_m._tag === "some") { const alloca = __ring_m._0; return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "cv")); }
  if (__ring_m._tag === "none") { return LLVMConstPointerNull(ctx.ptr_type); }
  __match_fail(__ring_m);
})();
        const cap_ptr = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, i, codegen_llvm_ctx$fresh_name(ctx, "ep"));
        discard(LLVMBuildStore(ctx.builder, cap_val, cap_ptr));
        break __ring_match162;
      }
      if (__ring_m162._tag === "none") {
        break __ring_match162;
      }
      __match_fail(__ring_m162);
    }
  }
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const closure_size = LLVMSizeOf(closure_ty);
  const closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty2, alloc_fn2, [closure_size, catch_closure_typeid], codegen_llvm_ctx$fresh_name(ctx, "cls"));
  const fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
  discard(LLVMBuildStore(ctx.builder, catch_fn, fn_ptr_slot));
  const env_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
  discard(LLVMBuildStore(ctx.builder, env_alloc, env_ptr_slot));
  return closure_ptr;
}

function gen_catch_arms(ctx, error_val, arms) {
  if ((List_len(arms) === 0)) {
    return LLVMConstPointerNull(ctx.ptr_type);
  }
  const __ring_iter_91 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_91 = __ListIterator_Iterator.next(__ring_iter_91);
    if (__ring_next_91._tag === "none") break;
    const arm = __ring_next_91._0;
    __ring_match163: {
      const __ring_m163 = arm.pattern;
      if (__ring_m163._tag === "Binding") {
        const name = __ring_m163.name;
        const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, name);
        discard(LLVMBuildStore(ctx.builder, error_val, alloca));
        _Map_insert(ctx.named_values, name, alloca);
        return gen_llvm_expr(ctx, arm.body);
        break __ring_match163;
      }
      if (__ring_m163._tag === "Wildcard") {
        return gen_llvm_expr(ctx, arm.body);
        break __ring_match163;
      }
      if (__ring_m163._tag === "Constructor") {
        const name = __ring_m163.name; const fields = __ring_m163.fields;
        bind_nested_pattern(ctx, error_val, arm.pattern);
        return gen_llvm_expr(ctx, arm.body);
        break __ring_match163;
      }
      return gen_llvm_expr(ctx, arm.body);
      break __ring_match163;
    }
  }
  return LLVMConstPointerNull(ctx.ptr_type);
}

function gen_handle_expr(ctx, body, handlers) {
  let by_effect = map_new();
  const __ring_iter_92 = __List_Iterable.iter(handlers);
  while (true) {
    const __ring_next_92 = __ListIterator_Iterator.next(__ring_iter_92);
    if (__ring_next_92._tag === "none") break;
    const h = __ring_next_92._0;
    __ring_match164: {
      const __ring_m164 = _Map_get(by_effect, h.effect_name);
      if (__ring_m164._tag === "some") {
        const existing = __ring_m164._0;
        List_push(existing, h);
        break __ring_match164;
      }
      if (__ring_m164._tag === "none") {
        _Map_insert(by_effect, h.effect_name, [h]);
        break __ring_match164;
      }
      __match_fail(__ring_m164);
    }
  }
  let has_fail_abort = false;
  const __ring_iter_93 = __List_Iterable.iter(_Map_entries(by_effect));
  while (true) {
    const __ring_next_93 = __ListIterator_Iterator.next(__ring_iter_93);
    if (__ring_next_93._tag === "none") break;
    const entry = __ring_next_93._0;
    const __ring_dt5 = entry;
    const effect_name = __ring_dt5[0];
    const hs = __ring_dt5[1];
    const ev_name = hir$evidence_param_name(effect_name);
    let is_fail_abort = false;
    const __ring_iter_94 = __List_Iterable.iter(hs);
    while (true) {
      const __ring_next_94 = __ListIterator_Iterator.next(__ring_iter_94);
      if (__ring_next_94._tag === "none") break;
      const h = __ring_next_94._0;
      if (((effect_name === "fail") ? (h.op_name === "raise") : false)) {
        has_fail_abort = true;
        is_fail_abort = true;
      }
    }
    if (is_fail_abort) {
      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, ev_name);
      discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), alloca));
      _Map_insert(ctx.named_values, ev_name, alloca);
    } else {
      const ev_struct = build_handler_evidence(ctx, effect_name, hs);
      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, ev_name);
      discard(LLVMBuildStore(ctx.builder, ev_struct, alloca));
      _Map_insert(ctx.named_values, ev_name, alloca);
    }
  }
  if (has_fail_abort) {
    const body_ty = hir$hexpr_type(body);
    const body_closure = gen_lambda(ctx, [], body_ty, body, body_ty);
    const catch_closure = gen_return_error_closure(ctx);
    const try_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_try", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
    const try_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_try");
    return LLVMBuildCall2(ctx.builder, try_ty, try_fn, [body_closure, catch_closure], codegen_llvm_ctx$fresh_name(ctx, "hdl"));
  } else {
    return gen_llvm_expr(ctx, body);
  }
}

function build_handler_evidence(ctx, effect_name, hs) {
  const n_slots = (function() {
  const __ring_m = _Map_get(ctx.effect_ops, effect_name);
  if (__ring_m._tag === "some") { const ops = __ring_m._0; return List_len(ops); }
  if (__ring_m._tag === "none") { return List_len(hs); }
  __match_fail(__ring_m);
})();
  let slot_types = [];
  const __ring_end95 = n_slots;
  for (let i = 0; i < __ring_end95; i++) {
    List_push(slot_types, ctx.ptr_type);
  }
  const ev_ty = LLVMStructTypeInContext(ctx.context, slot_types, 0);
  const ev_size = LLVMSizeOf(ev_ty);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const ev_typeid = LLVMConstInt(ctx.i64_type, 7, 0);
  const ev_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [ev_size, ev_typeid], codegen_llvm_ctx$fresh_name(ctx, "ev_st"));
  const __ring_end96 = n_slots;
  for (let i = 0; i < __ring_end96; i++) {
    const slot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, i, codegen_llvm_ctx$fresh_name(ctx, "evs"));
    discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), slot));
  }
  const __ring_iter_97 = __List_Iterable.iter(hs);
  while (true) {
    const __ring_next_97 = __ListIterator_Iterator.next(__ring_iter_97);
    if (__ring_next_97._tag === "none") break;
    const h = __ring_next_97._0;
    const slot_idx = hir$effect_op_slot(ctx.effect_ops, effect_name, h.op_name);
    const idx = ((slot_idx >= 0) ? slot_idx : 0);
    const arm_ret_ty = hir$hexpr_type(h.body);
    const arm_closure = gen_lambda(ctx, h.params, arm_ret_ty, h.body, arm_ret_ty);
    const slot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, idx, codegen_llvm_ctx$fresh_name(ctx, "evset"));
    discard(LLVMBuildStore(ctx.builder, arm_closure, slot));
  }
  return ev_ptr;
}

function gen_return_error_closure(ctx) {
  const fn_name = codegen_llvm_ctx$fresh_name(ctx, "ring_abort_");
  const fn_ty = LLVMFunctionType(ctx.ptr_type, [ctx.ptr_type, ctx.ptr_type], 0);
  const f = LLVMAddFunction(ctx.module, fn_name, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(f);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, f, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  discard(LLVMBuildRet(ctx.builder, LLVMGetParam(f, 1)));
  ctx.current_fn = saved_fn;
  LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const closure_size = LLVMSizeOf(closure_ty);
  const alloc_fn3 = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty3 = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const fn_ref_typeid = LLVMConstInt(ctx.i64_type, 7, 0);
  const cp = LLVMBuildCall2(ctx.builder, alloc_ty3, alloc_fn3, [closure_size, fn_ref_typeid], codegen_llvm_ctx$fresh_name(ctx, "cls"));
  const s0 = LLVMBuildStructGEP2(ctx.builder, closure_ty, cp, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
  discard(LLVMBuildStore(ctx.builder, f, s0));
  const s1 = LLVMBuildStructGEP2(ctx.builder, closure_ty, cp, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
  discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), s1));
  return cp;
}

function gen_effect_op(ctx, effect_name, op_name, args) {
  if (((effect_name === "fail") ? (op_name === "raise") : false)) {
    let arg_vals = [];
    const __ring_iter_98 = __List_Iterable.iter(args);
    while (true) {
      const __ring_next_98 = __ListIterator_Iterator.next(__ring_iter_98);
      if (__ring_next_98._tag === "none") break;
      const a = __ring_next_98._0;
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
    const __ring_iter_99 = __List_Iterable.iter(args);
    while (true) {
      const __ring_next_99 = __ListIterator_Iterator.next(__ring_iter_99);
      if (__ring_next_99._tag === "none") break;
      const a = __ring_next_99._0;
      List_push(arg_vals, gen_llvm_expr(ctx, a));
    }
    const ev_val = lookup_evidence(ctx, ev_name);
    const slot_idx = hir$effect_op_slot(ctx.effect_ops, effect_name, op_name);
    const n_slots = (function() {
  const __ring_m = _Map_get(ctx.effect_ops, effect_name);
  if (__ring_m._tag === "some") { const ops = __ring_m._0; return List_len(ops); }
  if (__ring_m._tag === "none") { return (slot_idx + 1); }
  __match_fail(__ring_m);
})();
    const idx = ((slot_idx >= 0) ? slot_idx : 0);
    let slot_types = [];
    const __ring_end100 = n_slots;
    for (let i = 0; i < __ring_end100; i++) {
      List_push(slot_types, ctx.ptr_type);
    }
    const ev_ty = LLVMStructTypeInContext(ctx.context, slot_types, 0);
    const slot_ptr = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_val, idx, codegen_llvm_ctx$fresh_name(ctx, "evslot"));
    const closure_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, codegen_llvm_ctx$fresh_name(ctx, "evcl"));
    return gen_closure_call(ctx, closure_ptr, arg_vals);
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


export { gen_llvm_expr, is_boxed_def, build_cell_alloc, build_cell_store, get_or_create_dict_global, emit_memoised_dict_getter, emit_memoised_const_body, box_int, box_float, box_bool, unbox_to_i1, unbox_int };