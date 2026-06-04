import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, effect_op_slot as hir$effect_op_slot, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_Clone as hir$HExpr_Clone, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { RING_TYPEID_CELL as codegen_llvm_ctx$RING_TYPEID_CELL, RING_TYPEID_CLOSURE_ENV as codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, llvm_mangle_fn as codegen_llvm_ctx$llvm_mangle_fn, llvm_mangle_fn_with_prefix as codegen_llvm_ctx$llvm_mangle_fn_with_prefix, llvm_mangle_method as codegen_llvm_ctx$llvm_mangle_method, llvm_resolve_fn as codegen_llvm_ctx$llvm_resolve_fn, llvm_resolve_method as codegen_llvm_ctx$llvm_resolve_method, fresh_name as codegen_llvm_ctx$fresh_name, get_or_declare_runtime_fn as codegen_llvm_ctx$get_or_declare_runtime_fn, get_rt_fn_type as codegen_llvm_ctx$get_rt_fn_type, get_or_assign_typeid as codegen_llvm_ctx$get_or_assign_typeid, get_builtin_typeid as codegen_llvm_ctx$get_builtin_typeid, build_entry_alloca as codegen_llvm_ctx$build_entry_alloca, StructFieldInfo as codegen_llvm_ctx$StructFieldInfo, EnumVariantInfo as codegen_llvm_ctx$EnumVariantInfo, EnumTypeInfo as codegen_llvm_ctx$EnumTypeInfo, LlvmCtx as codegen_llvm_ctx$LlvmCtx, __EnumVariantInfo_Clone as codegen_llvm_ctx$__EnumVariantInfo_Clone, __EnumVariantInfo_Debug as codegen_llvm_ctx$__EnumVariantInfo_Debug } from "./codegen_llvm_ctx.js";
import { gen_llvm_expr as codegen_llvm_expr$gen_llvm_expr, is_boxed_def as codegen_llvm_expr$is_boxed_def, build_cell_alloc as codegen_llvm_expr$build_cell_alloc, build_cell_store as codegen_llvm_expr$build_cell_store, box_int as codegen_llvm_expr$box_int, box_float as codegen_llvm_expr$box_float, box_bool as codegen_llvm_expr$box_bool, unbox_to_i1 as codegen_llvm_expr$unbox_to_i1 } from "./codegen_llvm_expr.js";
import { emit_llvm_decl as codegen_llvm_decl$emit_llvm_decl, register_struct_info as codegen_llvm_decl$register_struct_info, register_enum_info as codegen_llvm_decl$register_enum_info } from "./codegen_llvm_decl.js";
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






















































function discard(v) {
}

function compute_evidence_params(effects) {
  const names = codegen_ctx$extract_effect_names(effects);
  let result = [];
  const __ring_iter_2 = __List_Iterable.iter(names);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const n = __ring_next_2._0;
    List_push(result, hir$evidence_param_name(n));
  }
  return result;
}

function declare_runtime_fns(ctx) {
  const ptr = ctx.ptr_type;
  const i64 = ctx.i64_type;
  const dbl = ctx.double_type;
  const _void = ctx.void_type;
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_int", [i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_float", [dbl], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ptr], dbl);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_bool", [i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_len", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_concat", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_lt", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_get", [ptr, i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_contains", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_starts_with", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_ends_with", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_slice", [ptr, i64, i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_split", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_replace", [ptr, ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_add", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_len", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_int_to_str", [i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_float_to_str", [dbl], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_bool_to_str", [i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_print", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_eprintln", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_panic", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_exit", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [i64, i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_dup", [ptr], _void);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ptr], _void);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_register_drop", [i64, ptr], _void);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_new", [], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_push", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ptr, i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_len", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_join", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_concat", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_slice", [ptr, i64, i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_reverse", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_sort", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_sort_default", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_pop", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_contains", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_index_of", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_is_empty", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_first", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_last", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_map", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_filter", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_for_each", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_set", [ptr, i64, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_any", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_all", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_find", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_flat_map", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_enumerate", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_new", [], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_get", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_set", [ptr, ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_has", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_delete", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_keys", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_values", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_entries", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_len", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_for_each", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_new", [], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_get", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_get_opt", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_set", [ptr, ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_has", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_delete", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_keys", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_values", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_entries", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_len", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_for_each", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_clone", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_from", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_int_clear", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_new", [], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_add", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_has", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_delete", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_to_list", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_len", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_from_list", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_for_each", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_new", [], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_add", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_has", [ptr, ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_delete", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_to_list", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_len", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_from_list", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_for_each", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_clone", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_union", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_intersect", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_difference", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_int_clear", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_push", [], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_setjmp", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_pop", [], _void);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_get_error", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_raise", [ptr], _void);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_args", [], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_read_file", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_write_file", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_file_exists", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_delete_file", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_path_join", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_path_resolve", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_path_dirname", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_path_basename", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_path_extname", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_clone", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_clone", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_clone", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_from", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_parse_int", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_parse_float", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_trim", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_trim_start", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_trim_end", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_to_upper", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_to_lower", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_char_at", [ptr, i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_index_of", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_last_index_of", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_is_empty", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_pad_start", [ptr, i64, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_pad_end", [ptr, i64, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_repeat", [ptr, i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_char_code_at", [ptr, i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_join", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_line", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_add_int", [ptr, i64], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_union", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_intersect", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_difference", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_set_clear", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_shift", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_clear", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_extend", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_map_clear", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_assert", [i64, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_json_stringify", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_cwd", [], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "__ring_raise_fail", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_Option_unwrap_or", [ptr, ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_Option_unwrap", [ptr], ptr);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_Option_is_some", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_Option_is_none", [ptr], i64);
  codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_Option_map", [ptr, ptr], ptr);
  return codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_Option_unwrap_or_else", [ptr, ptr], ptr);
}

function forward_declare_functions(ctx, decls) {
  return forward_declare_functions_with_prefix(ctx, decls, Option_none);
}

function forward_declare_functions_with_prefix(ctx, decls, prefix) {
  const __ring_iter_3 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
    if (__ring_next_3._tag === "none") break;
    const decl = __ring_next_3._0;
    __ring_match6: {
      const __ring_m6 = decl;
      if (__ring_m6._tag === "Fn") {
        const name = __ring_m6.name; const params = __ring_m6.params; const effects = __ring_m6.effects; const trait_bounds = __ring_m6.trait_bounds;
        forward_declare_fn(ctx, name, params, effects, trait_bounds, prefix);
        break __ring_match6;
      }
      if (__ring_m6._tag === "Impl") {
        const target_type = __ring_m6.target_type; const methods = __ring_m6.methods;
        const __ring_iter_4 = __List_Iterable.iter(methods);
        while (true) {
          const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
          if (__ring_next_4._tag === "none") break;
          const method = __ring_next_4._0;
          __ring_match7: {
            const __ring_m7 = method;
            if (__ring_m7._tag === "Fn") {
              const mn = __ring_m7.name; const mp = __ring_m7.params; const me = __ring_m7.effects; const mtb = __ring_m7.trait_bounds;
              const mangled = codegen_llvm_ctx$llvm_mangle_method(target_type, mn);
              forward_declare_fn_with_name(ctx, mangled, mn, mp, me, mtb);
              break __ring_match7;
            }
            break __ring_match7;
          }
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "Struct") {
        const name = __ring_m6.name; const fields = __ring_m6.fields;
        codegen_llvm_decl$register_struct_info(ctx, name, fields);
        break __ring_match6;
      }
      if (__ring_m6._tag === "Enum") {
        const name = __ring_m6.name; const variants = __ring_m6.variants;
        codegen_llvm_decl$register_enum_info(ctx, name, variants);
        forward_declare_enum_ctors(ctx, name, variants);
        break __ring_match6;
      }
      if (__ring_m6._tag === "Effect") {
        break __ring_match6;
      }
      if (__ring_m6._tag === "ExternFn") {
        break __ring_match6;
      }
      if (__ring_m6._tag === "ModBlock") {
        const mod_decls = __ring_m6.decls;
        forward_declare_functions_with_prefix(ctx, mod_decls, prefix);
        break __ring_match6;
      }
      if (__ring_m6._tag === "ExternType") {
        break __ring_match6;
      }
      if (__ring_m6._tag === "TypeAlias") {
        break __ring_match6;
      }
      if (__ring_m6._tag === "Const") {
        const name = __ring_m6.name;
        const const_fn_name = (function() {
  const __ring_m = prefix;
  if (__ring_m._tag === "some") { const p = __ring_m._0; return codegen_llvm_ctx$llvm_mangle_fn_with_prefix(p, name); }
  if (__ring_m._tag === "none") { return codegen_llvm_ctx$llvm_mangle_fn(name); }
  __match_fail(__ring_m);
})();
        const fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0);
        const fn_val = LLVMAddFunction(ctx.module, const_fn_name, fn_ty);
        _Map_insert(ctx.functions, const_fn_name, fn_val);
        _Map_insert(ctx.fn_types, const_fn_name, fn_ty);
        let empty_ev = [];
        _Map_insert(ctx.fn_evidence_params, const_fn_name, empty_ev);
        break __ring_match6;
      }
      if (__ring_m6._tag === "Trait") {
        break __ring_match6;
      }
      if (__ring_m6._tag === "Test") {
        break __ring_match6;
      }
      if (__ring_m6._tag === "Sig") {
        break __ring_match6;
      }
      __match_fail(__ring_m6);
    }
  }
}

function forward_declare_fn(ctx, name, params, effects, trait_bounds, prefix) {
  const mangled = (function() {
  const __ring_m = prefix;
  if (__ring_m._tag === "some") { const p = __ring_m._0; return codegen_llvm_ctx$llvm_mangle_fn_with_prefix(p, name); }
  if (__ring_m._tag === "none") { return codegen_llvm_ctx$llvm_mangle_fn(name); }
  __match_fail(__ring_m);
})();
  return forward_declare_fn_with_name(ctx, mangled, name, params, effects, trait_bounds);
}

function forward_declare_fn_with_name(ctx, mangled, name, params, effects, trait_bounds) {
  const ptr = ctx.ptr_type;
  let param_types = [];
  const __ring_iter_5 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
    if (__ring_next_5._tag === "none") break;
    const p = __ring_next_5._0;
    List_push(param_types, ptr);
  }
  const __ring_iter_6 = __List_Iterable.iter(trait_bounds);
  while (true) {
    const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
    if (__ring_next_6._tag === "none") break;
    const b = __ring_next_6._0;
    List_push(param_types, ptr);
  }
  const effective_effects = (function() {
  const __ring_m = _Map_get(ctx.local_fn_effects, name);
  if (__ring_m._tag === "some") { const eff = __ring_m._0; return eff; }
  if (__ring_m._tag === "none") { return effects; }
  __match_fail(__ring_m);
})();
  const ev_params = compute_evidence_params(effective_effects);
  const __ring_iter_7 = __List_Iterable.iter(ev_params);
  while (true) {
    const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
    if (__ring_next_7._tag === "none") break;
    const ep = __ring_next_7._0;
    List_push(param_types, ptr);
  }
  _Map_insert(ctx.fn_evidence_params, mangled, ev_params);
  const fn_ty = LLVMFunctionType(ptr, param_types, 0);
  const fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty);
  _Map_insert(ctx.functions, mangled, fn_val);
  return _Map_insert(ctx.fn_types, mangled, fn_ty);
}

function forward_declare_enum_ctors(ctx, name, variants) {
  const ptr = ctx.ptr_type;
  const __ring_iter_8 = __List_Iterable.iter(variants);
  while (true) {
    const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
    if (__ring_next_8._tag === "none") break;
    const v = __ring_next_8._0;
    const ctor_name = `ring_${name}_${v.name}`;
    let param_types = [];
    const __ring_iter_9 = __List_Iterable.iter(v.fields);
    while (true) {
      const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
      if (__ring_next_9._tag === "none") break;
      const f = __ring_next_9._0;
      List_push(param_types, ptr);
    }
    const fn_ty = LLVMFunctionType(ptr, param_types, 0);
    const fn_val = LLVMAddFunction(ctx.module, ctor_name, fn_ty);
    _Map_insert(ctx.functions, ctor_name, fn_val);
    _Map_insert(ctx.fn_types, ctor_name, fn_ty);
  }
}

function register_builtin_enums(ctx) {
  const ptr = ctx.ptr_type;
  const i64 = ctx.i64_type;
  const option_ty = LLVMStructTypeInContext(ctx.context, [i64, ptr], 0);
  let option_variants = map_new();
  _Map_insert(option_variants, "some", new codegen_llvm_ctx$EnumVariantInfo(0, 1, ["value"]));
  _Map_insert(option_variants, "none", new codegen_llvm_ctx$EnumVariantInfo(1, 0, []));
  _Map_insert(ctx.enum_types, "Option", new codegen_llvm_ctx$EnumTypeInfo(option_variants, 1, option_ty));
  const some_fn_ty = LLVMFunctionType(ptr, [ptr], 0);
  const some_fn = LLVMAddFunction(ctx.module, "ring_Option_some", some_fn_ty);
  _Map_insert(ctx.functions, "ring_Option_some", some_fn);
  _Map_insert(ctx.fn_types, "ring_Option_some", some_fn_ty);
  const none_fn_ty = LLVMFunctionType(ptr, [], 0);
  const none_fn = LLVMAddFunction(ctx.module, "ring_Option_none", none_fn_ty);
  _Map_insert(ctx.functions, "ring_Option_none", none_fn);
  _Map_insert(ctx.fn_types, "ring_Option_none", none_fn_ty);
  const some_entry = LLVMAppendBasicBlockInContext(ctx.context, some_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, some_entry);
  const some_size = LLVMSizeOf(option_ty);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ptr);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const option_typeid = LLVMConstInt(i64, 8, 0);
  const some_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [some_size, option_typeid], "opt");
  const some_tag_ptr = LLVMBuildStructGEP2(ctx.builder, option_ty, some_ptr, 0, "tag");
  discard(LLVMBuildStore(ctx.builder, LLVMConstInt(i64, 0, 0), some_tag_ptr));
  const some_val_ptr = LLVMBuildStructGEP2(ctx.builder, option_ty, some_ptr, 1, "val");
  discard(LLVMBuildStore(ctx.builder, LLVMGetParam(some_fn, 0), some_val_ptr));
  discard(LLVMBuildRet(ctx.builder, some_ptr));
  const none_entry = LLVMAppendBasicBlockInContext(ctx.context, none_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, none_entry);
  const none_size = LLVMSizeOf(option_ty);
  const none_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [none_size, option_typeid], "opt");
  const none_tag_ptr = LLVMBuildStructGEP2(ctx.builder, option_ty, none_ptr, 0, "tag");
  discard(LLVMBuildStore(ctx.builder, LLVMConstInt(i64, 1, 0), none_tag_ptr));
  discard(LLVMBuildRet(ctx.builder, none_ptr));
  const result_ty = LLVMStructTypeInContext(ctx.context, [i64, ptr], 0);
  let result_variants = map_new();
  _Map_insert(result_variants, "Ok", new codegen_llvm_ctx$EnumVariantInfo(0, 1, ["value"]));
  _Map_insert(result_variants, "Err", new codegen_llvm_ctx$EnumVariantInfo(1, 1, ["value"]));
  _Map_insert(ctx.enum_types, "Result", new codegen_llvm_ctx$EnumTypeInfo(result_variants, 1, result_ty));
  const result_tid = codegen_llvm_ctx$get_or_assign_typeid(ctx, "Result");
  const result_typeid = LLVMConstInt(i64, result_tid, 0);
  const ok_fn_ty = LLVMFunctionType(ptr, [ptr], 0);
  const ok_fn = LLVMAddFunction(ctx.module, "ring_Result_Ok", ok_fn_ty);
  _Map_insert(ctx.functions, "ring_Result_Ok", ok_fn);
  _Map_insert(ctx.fn_types, "ring_Result_Ok", ok_fn_ty);
  const ok_entry = LLVMAppendBasicBlockInContext(ctx.context, ok_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, ok_entry);
  const ok_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [LLVMSizeOf(result_ty), result_typeid], "res");
  const ok_tag_ptr = LLVMBuildStructGEP2(ctx.builder, result_ty, ok_ptr, 0, "tag");
  discard(LLVMBuildStore(ctx.builder, LLVMConstInt(i64, 0, 0), ok_tag_ptr));
  const ok_val_ptr = LLVMBuildStructGEP2(ctx.builder, result_ty, ok_ptr, 1, "val");
  discard(LLVMBuildStore(ctx.builder, LLVMGetParam(ok_fn, 0), ok_val_ptr));
  discard(LLVMBuildRet(ctx.builder, ok_ptr));
  const err_fn_ty = LLVMFunctionType(ptr, [ptr], 0);
  const err_fn = LLVMAddFunction(ctx.module, "ring_Result_Err", err_fn_ty);
  _Map_insert(ctx.functions, "ring_Result_Err", err_fn);
  _Map_insert(ctx.fn_types, "ring_Result_Err", err_fn_ty);
  const err_entry = LLVMAppendBasicBlockInContext(ctx.context, err_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, err_entry);
  const err_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [LLVMSizeOf(result_ty), result_typeid], "res");
  const err_tag_ptr = LLVMBuildStructGEP2(ctx.builder, result_ty, err_ptr, 0, "tag");
  discard(LLVMBuildStore(ctx.builder, LLVMConstInt(i64, 1, 0), err_tag_ptr));
  const err_val_ptr = LLVMBuildStructGEP2(ctx.builder, result_ty, err_ptr, 1, "val");
  discard(LLVMBuildStore(ctx.builder, LLVMGetParam(err_fn, 0), err_val_ptr));
  return discard(LLVMBuildRet(ctx.builder, err_ptr));
}

function scan_fn_effects(decls, local_fn_effects) {
  const __ring_iter_10 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
    if (__ring_next_10._tag === "none") break;
    const decl = __ring_next_10._0;
    __ring_match8: {
      const __ring_m8 = decl;
      if (__ring_m8._tag === "Fn") {
        const name = __ring_m8.name; const effects = __ring_m8.effects;
        if ((List_len(effects.effects) > 0)) {
          _Map_insert(local_fn_effects, name, effects);
        }
        break __ring_match8;
      }
      if (__ring_m8._tag === "Impl") {
        const methods = __ring_m8.methods;
        const __ring_iter_11 = __List_Iterable.iter(methods);
        while (true) {
          const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
          if (__ring_next_11._tag === "none") break;
          const m = __ring_next_11._0;
          __ring_match9: {
            const __ring_m9 = m;
            if (__ring_m9._tag === "Fn") {
              const mn = __ring_m9.name; const me = __ring_m9.effects;
              if ((List_len(me.effects) > 0)) {
                _Map_insert(local_fn_effects, mn, me);
              }
              break __ring_match9;
            }
            break __ring_match9;
          }
        }
        break __ring_match8;
      }
      if (__ring_m8._tag === "ModBlock") {
        const md = __ring_m8.decls;
        scan_fn_effects(md, local_fn_effects);
        break __ring_match8;
      }
      break __ring_match8;
    }
  }
}

function scan_trait_decls(decls, trait_method_order) {
  const __ring_iter_12 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
    if (__ring_next_12._tag === "none") break;
    const decl = __ring_next_12._0;
    __ring_match10: {
      const __ring_m10 = decl;
      if (__ring_m10._tag === "Trait") {
        const name = __ring_m10.name; const methods = __ring_m10.methods;
        let method_names = [];
        const __ring_iter_13 = __List_Iterable.iter(methods);
        while (true) {
          const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
          if (__ring_next_13._tag === "none") break;
          const m = __ring_next_13._0;
          List_push(method_names, m.name);
        }
        _Map_insert(trait_method_order, name, method_names);
        break __ring_match10;
      }
      if (__ring_m10._tag === "ModBlock") {
        const md = __ring_m10.decls;
        scan_trait_decls(md, trait_method_order);
        break __ring_match10;
      }
      break __ring_match10;
    }
  }
  if (Option_is_none(_Map_get(trait_method_order, "Eq"))) {
    _Map_insert(trait_method_order, "Eq", ["eq", "ne"]);
  }
  if (Option_is_none(_Map_get(trait_method_order, "Clone"))) {
    _Map_insert(trait_method_order, "Clone", ["clone"]);
  }
  if (Option_is_none(_Map_get(trait_method_order, "Ord"))) {
    _Map_insert(trait_method_order, "Ord", ["compare"]);
  }
  if (Option_is_none(_Map_get(trait_method_order, "Debug"))) {
    return _Map_insert(trait_method_order, "Debug", ["debug"]);
  }
}

function register_effect_ops_llvm(decls, effect_ops) {
  const __ring_iter_14 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
    if (__ring_next_14._tag === "none") break;
    const decl = __ring_next_14._0;
    __ring_match11: {
      const __ring_m11 = decl;
      if (__ring_m11._tag === "Effect") {
        const name = __ring_m11.name; const ops = __ring_m11.ops;
        _Map_insert(effect_ops, name, ops);
        break __ring_match11;
      }
      if (__ring_m11._tag === "ModBlock") {
        const md = __ring_m11.decls;
        register_effect_ops_llvm(md, effect_ops);
        break __ring_match11;
      }
      break __ring_match11;
    }
  }
}

function llvm_is_value_type(t) {
  __ring_match12: {
    const __ring_m12 = t;
    if (__ring_m12._tag === "IntType") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "FloatType") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "BoolType") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "StrType") {
      return true;
      break __ring_match12;
    }
    return false;
    break __ring_match12;
  }
}

function mut_param_flags(params) {
  let flags = [];
  const __ring_iter_15 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
    if (__ring_next_15._tag === "none") break;
    const p = __ring_next_15._0;
    if (((p.name === "self") || (!p.is_mutable))) {
      List_push(flags, false);
    } else {
      List_push(flags, llvm_is_value_type(p.ty));
    }
  }
  return flags;
}

function scan_fn_mut_params_llvm(decls, fn_mut_params) {
  const __ring_iter_16 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
    if (__ring_next_16._tag === "none") break;
    const decl = __ring_next_16._0;
    __ring_match13: {
      const __ring_m13 = decl;
      if (__ring_m13._tag === "Fn") {
        const name = __ring_m13.name; const params = __ring_m13.params;
        _Map_insert(fn_mut_params, name, mut_param_flags(params));
        break __ring_match13;
      }
      if (__ring_m13._tag === "Impl") {
        const target_type = __ring_m13.target_type; const methods = __ring_m13.methods;
        const __ring_iter_17 = __List_Iterable.iter(methods);
        while (true) {
          const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
          if (__ring_next_17._tag === "none") break;
          const m = __ring_next_17._0;
          __ring_match14: {
            const __ring_m14 = m;
            if (__ring_m14._tag === "Fn") {
              const mn = __ring_m14.name; const mp = __ring_m14.params;
              const ufcs_name = `${target_type}_${mn}`;
              _Map_insert(fn_mut_params, ufcs_name, mut_param_flags(mp));
              break __ring_match14;
            }
            break __ring_match14;
          }
        }
        break __ring_match13;
      }
      if (__ring_m13._tag === "ModBlock") {
        const md = __ring_m13.decls;
        scan_fn_mut_params_llvm(md, fn_mut_params);
        break __ring_match13;
      }
      break __ring_match13;
    }
  }
}

function emit_drop_functions(ctx) {
  const ptr = ctx.ptr_type;
  const i64 = ctx.i64_type;
  const _void = ctx.void_type;
  const drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ptr], _void);
  const drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
  const register_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_register_drop", [i64, ptr], _void);
  const register_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_register_drop");
  const struct_names = _Map_keys(ctx.struct_types);
  const __ring_iter_18 = __List_Iterable.iter(struct_names);
  while (true) {
    const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
    if (__ring_next_18._tag === "none") break;
    const sname = __ring_next_18._0;
    __ring_match15: {
      const __ring_m15 = _Map_get(ctx.struct_types, sname);
      if (__ring_m15._tag === "some") {
        const info = __ring_m15._0;
        const drop_name = `ring_drop_${sname}`;
        const fn_ty = LLVMFunctionType(_void, [ptr], 0);
        const fn_val = LLVMAddFunction(ctx.module, drop_name, fn_ty);
        const saved_fn = ctx.current_fn;
        ctx.current_fn = Option_some(fn_val);
        const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
        LLVMPositionBuilderAtEnd(ctx.builder, entry);
        const data_ptr = LLVMGetParam(fn_val, 0);
        const __ring_end19 = List_len(info.field_names);
        for (let i = 0; i < __ring_end19; i++) {
          const field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, data_ptr, i, codegen_llvm_ctx$fresh_name(ctx, "fp"));
          const field_val = LLVMBuildLoad2(ctx.builder, ptr, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
          discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [field_val], ""));
        }
        discard(LLVMBuildRetVoid(ctx.builder));
        ctx.current_fn = saved_fn;
        const tid = codegen_llvm_ctx$get_or_assign_typeid(ctx, sname);
        const tid_val = LLVMConstInt(i64, tid, 0);
        _Map_insert(ctx.dict_globals, drop_name, fn_val);
        break __ring_match15;
      }
      if (__ring_m15._tag === "none") {
        break __ring_match15;
      }
      __match_fail(__ring_m15);
    }
  }
  const enum_names = _Map_keys(ctx.enum_types);
  const __ring_iter_20 = __List_Iterable.iter(enum_names);
  while (true) {
    const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
    if (__ring_next_20._tag === "none") break;
    const ename = __ring_next_20._0;
    if ((ename === "Option")) {
      continue;
    }
    if ((ename === "Result")) {
      continue;
    }
    __ring_match16: {
      const __ring_m16 = _Map_get(ctx.enum_types, ename);
      if (__ring_m16._tag === "some") {
        const enum_info = __ring_m16._0;
        const drop_name = `ring_drop_${ename}`;
        const fn_ty = LLVMFunctionType(_void, [ptr], 0);
        const fn_val = LLVMAddFunction(ctx.module, drop_name, fn_ty);
        const saved_fn = ctx.current_fn;
        ctx.current_fn = Option_some(fn_val);
        const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
        LLVMPositionBuilderAtEnd(ctx.builder, entry);
        const data_ptr = LLVMGetParam(fn_val, 0);
        const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, data_ptr, 0, "tag_ptr");
        const tag_val = LLVMBuildLoad2(ctx.builder, i64, tag_ptr, "tag");
        const done_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "done");
        const default_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "default");
        const variant_keys = _Map_keys(enum_info.variants);
        const num_variants = List_len(variant_keys);
        if ((num_variants === 0)) {
          discard(LLVMBuildBr(ctx.builder, done_bb));
        } else {
          const switch_val = LLVMBuildSwitch(ctx.builder, tag_val, default_bb, num_variants);
          const __ring_iter_21 = __List_Iterable.iter(variant_keys);
          while (true) {
            const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
            if (__ring_next_21._tag === "none") break;
            const vname = __ring_next_21._0;
            __ring_match17: {
              const __ring_m17 = _Map_get(enum_info.variants, vname);
              if (__ring_m17._tag === "some") {
                const vi = __ring_m17._0;
                const variant_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, `v_${vname}`);
                LLVMAddCase(switch_val, LLVMConstInt(i64, vi.tag, 0), variant_bb);
                LLVMPositionBuilderAtEnd(ctx.builder, variant_bb);
                const __ring_end22 = vi.field_count;
                for (let fi = 0; fi < __ring_end22; fi++) {
                  const fp = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, data_ptr, (fi + 1), codegen_llvm_ctx$fresh_name(ctx, "efp"));
                  const fv = LLVMBuildLoad2(ctx.builder, ptr, fp, codegen_llvm_ctx$fresh_name(ctx, "efv"));
                  discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [fv], ""));
                }
                discard(LLVMBuildBr(ctx.builder, done_bb));
                break __ring_match17;
              }
              if (__ring_m17._tag === "none") {
                break __ring_match17;
              }
              __match_fail(__ring_m17);
            }
          }
        }
        LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
        discard(LLVMBuildBr(ctx.builder, done_bb));
        LLVMPositionBuilderAtEnd(ctx.builder, done_bb);
        discard(LLVMBuildRetVoid(ctx.builder));
        ctx.current_fn = saved_fn;
        _Map_insert(ctx.dict_globals, drop_name, fn_val);
        break __ring_match16;
      }
      if (__ring_m16._tag === "none") {
        break __ring_match16;
      }
      __match_fail(__ring_m16);
    }
  }
}

function emit_drop_registrations(ctx) {
  const ptr = ctx.ptr_type;
  const i64 = ctx.i64_type;
  const _void = ctx.void_type;
  const register_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_register_drop", [i64, ptr], _void);
  const register_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_register_drop");
  const struct_names = _Map_keys(ctx.struct_types);
  const __ring_iter_23 = __List_Iterable.iter(struct_names);
  while (true) {
    const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
    if (__ring_next_23._tag === "none") break;
    const sname = __ring_next_23._0;
    const drop_name = `ring_drop_${sname}`;
    __ring_match18: {
      const __ring_m18 = _Map_get(ctx.dict_globals, drop_name);
      if (__ring_m18._tag === "some") {
        const drop_fn_val = __ring_m18._0;
        const tid = codegen_llvm_ctx$get_or_assign_typeid(ctx, sname);
        const tid_val = LLVMConstInt(i64, tid, 0);
        discard(LLVMBuildCall2(ctx.builder, register_ty, register_fn, [tid_val, drop_fn_val], ""));
        break __ring_match18;
      }
      if (__ring_m18._tag === "none") {
        break __ring_match18;
      }
      __match_fail(__ring_m18);
    }
  }
  const enum_names = _Map_keys(ctx.enum_types);
  const __ring_iter_24 = __List_Iterable.iter(enum_names);
  while (true) {
    const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
    if (__ring_next_24._tag === "none") break;
    const ename = __ring_next_24._0;
    if ((ename === "Option")) {
      continue;
    }
    if ((ename === "Result")) {
      continue;
    }
    const drop_name = `ring_drop_${ename}`;
    __ring_match19: {
      const __ring_m19 = _Map_get(ctx.dict_globals, drop_name);
      if (__ring_m19._tag === "some") {
        const drop_fn_val = __ring_m19._0;
        const tid = codegen_llvm_ctx$get_or_assign_typeid(ctx, ename);
        const tid_val = LLVMConstInt(i64, tid, 0);
        discard(LLVMBuildCall2(ctx.builder, register_ty, register_fn, [tid_val, drop_fn_val], ""));
        break __ring_match19;
      }
      if (__ring_m19._tag === "none") {
        break __ring_match19;
      }
      __match_fail(__ring_m19);
    }
  }
}

function emit_c_main(ctx) {
  const i32_ty = ctx.i32_type;
  const ptr = ctx.ptr_type;
  const main_params = [i32_ty, ptr];
  const main_ty = LLVMFunctionType(i32_ty, main_params, 0);
  const main_fn = LLVMAddFunction(ctx.module, "main", main_ty);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, main_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const argc_val = LLVMGetParam(main_fn, 0);
  const argv_val = LLVMGetParam(main_fn, 1);
  const init_name = "ring_runtime_init";
  __ring_match20: {
    const __ring_m20 = _Map_get(ctx.functions, init_name);
    if (__ring_m20._tag === "some") {
      const init_fn = __ring_m20._0;
      const init_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, init_name);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return (function() {
  const init_params = [i32_ty, ptr];
  return LLVMFunctionType(ctx.void_type, init_params, 0);
})(); }
  __match_fail(__ring_m);
})();
      discard(LLVMBuildCall2(ctx.builder, init_ty, init_fn, [argc_val, argv_val], ""));
      break __ring_match20;
    }
    if (__ring_m20._tag === "none") {
      const init_params = [i32_ty, ptr];
      const init_ty = LLVMFunctionType(ctx.void_type, init_params, 0);
      const init_fn = LLVMAddFunction(ctx.module, init_name, init_ty);
      discard(LLVMBuildCall2(ctx.builder, init_ty, init_fn, [argc_val, argv_val], ""));
      break __ring_match20;
    }
    __match_fail(__ring_m20);
  }
  emit_drop_registrations(ctx);
  const ring_main_name = codegen_llvm_ctx$llvm_mangle_fn("main");
  __ring_match21: {
    const __ring_m21 = _Map_get(ctx.functions, ring_main_name);
    if (__ring_m21._tag === "some") {
      const ring_main_fn = __ring_m21._0;
      let call_args = [];
      __ring_match22: {
        const __ring_m22 = _Map_get(ctx.fn_evidence_params, ring_main_name);
        if (__ring_m22._tag === "some") {
          const ev_params = __ring_m22._0;
          const __ring_iter_25 = __List_Iterable.iter(ev_params);
          while (true) {
            const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
            if (__ring_next_25._tag === "none") break;
            const ep = __ring_next_25._0;
            List_push(call_args, LLVMConstPointerNull(ptr));
          }
          break __ring_match22;
        }
        if (__ring_m22._tag === "none") {
          break __ring_match22;
        }
        __match_fail(__ring_m22);
      }
      const ring_main_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, ring_main_name);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: ring_main fn type not found"); }
  __match_fail(__ring_m);
})();
      discard(LLVMBuildCall2(ctx.builder, ring_main_ty, ring_main_fn, call_args, ""));
      break __ring_match21;
    }
    if (__ring_m21._tag === "none") {
      break __ring_match21;
    }
    __match_fail(__ring_m21);
  }
  const zero = LLVMConstInt(i32_ty, 0, 0);
  return discard(LLVMBuildRet(ctx.builder, zero));
}

function generate_llvm(program, output_path, __ring_ev_io) {
  LLVMInitializeX86TargetInfo();
  LLVMInitializeX86Target();
  LLVMInitializeX86TargetMC();
  LLVMInitializeX86AsmPrinter();
  const context = LLVMContextCreate();
  const module = LLVMModuleCreateWithNameInContext("ring_module", context);
  const builder = LLVMCreateBuilderInContext(context);
  const triple = LLVMGetDefaultTargetTriple();
  LLVMSetTarget(module, triple);
  const target = LLVMGetTargetFromTriple(triple);
  const tm = LLVMCreateTargetMachine(target, triple, "generic", "", 2, 0, 0);
  const ptr_type = LLVMPointerTypeInContext(context, 0);
  const i64_type = LLVMInt64TypeInContext(context);
  const i32_type = LLVMInt32TypeInContext(context);
  const i8_type = LLVMInt8TypeInContext(context);
  const i1_type = LLVMInt1TypeInContext(context);
  const void_type = LLVMVoidTypeInContext(context);
  const double_type = LLVMDoubleTypeInContext(context);
  let ctx = new codegen_llvm_ctx$LlvmCtx(context, module, builder, tm, ptr_type, i64_type, i32_type, i8_type, i1_type, void_type, double_type, map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), Option_none, map_new(), set_new(), 0, 0, 0, Option_none, "", Option_none, Option_none, 64, map_new(), set_new(), map_new(), map_new());
  const __ring_iter_26 = ___Set_Iterable.iter(program.boxed_vars);
  while (true) {
    const __ring_next_26 = __SetIterator_Iterator.next(__ring_iter_26);
    if (__ring_next_26._tag === "none") break;
    const did = __ring_next_26._0;
    _Set_insert(ctx.boxed_vars, did);
  }
  register_builtin_enums(ctx);
  scan_fn_effects(program.decls, ctx.local_fn_effects);
  scan_trait_decls(program.decls, ctx.trait_method_order);
  scan_fn_mut_params_llvm(program.decls, ctx.fn_mut_params);
  register_effect_ops_llvm(program.decls, ctx.effect_ops);
  declare_runtime_fns(ctx);
  forward_declare_functions(ctx, program.decls);
  const __ring_iter_27 = __List_Iterable.iter(program.decls);
  while (true) {
    const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
    if (__ring_next_27._tag === "none") break;
    const decl = __ring_next_27._0;
    codegen_llvm_decl$emit_llvm_decl(ctx, decl);
  }
  emit_drop_functions(ctx);
  emit_c_main(ctx);
  const ir = LLVMPrintModuleToString(module);
  write_file("ring_output.ll", ir);
  const emit_result = LLVMTargetMachineEmitToFile(tm, module, output_path, 1);
  if ((emit_result !== 0)) {
    eprintln(`Failed to emit object file: ${output_path}`);
  } else {
    print(`Compiled: ${output_path}`, __ring_ev_io);
  }
  LLVMDisposeBuilder(builder);
  LLVMDisposeTargetMachine(tm);
  LLVMDisposeModule(module);
  return LLVMContextDispose(context);
}

function generate_llvm_project(modules, entry_prefix, output_path, __ring_ev_io) {
  LLVMInitializeX86TargetInfo();
  LLVMInitializeX86Target();
  LLVMInitializeX86TargetMC();
  LLVMInitializeX86AsmPrinter();
  const context = LLVMContextCreate();
  const module = LLVMModuleCreateWithNameInContext("ring_project", context);
  const builder = LLVMCreateBuilderInContext(context);
  const triple = LLVMGetDefaultTargetTriple();
  LLVMSetTarget(module, triple);
  const target = LLVMGetTargetFromTriple(triple);
  const tm = LLVMCreateTargetMachine(target, triple, "generic", "", 2, 0, 0);
  const ptr_type = LLVMPointerTypeInContext(context, 0);
  const i64_type = LLVMInt64TypeInContext(context);
  const i32_type = LLVMInt32TypeInContext(context);
  const i8_type = LLVMInt8TypeInContext(context);
  const i1_type = LLVMInt1TypeInContext(context);
  const void_type = LLVMVoidTypeInContext(context);
  const double_type = LLVMDoubleTypeInContext(context);
  let ctx = new codegen_llvm_ctx$LlvmCtx(context, module, builder, tm, ptr_type, i64_type, i32_type, i8_type, i1_type, void_type, double_type, map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), Option_none, map_new(), set_new(), 0, 0, 0, Option_none, "", Option_none, Option_none, 64, map_new(), set_new(), map_new(), map_new());
  register_builtin_enums(ctx);
  const __ring_iter_28 = __List_Iterable.iter(modules);
  while (true) {
    const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
    if (__ring_next_28._tag === "none") break;
    const m = __ring_next_28._0;
    const __ring_dt0 = m;
    const prefix = __ring_dt0[0];
    const program = __ring_dt0[1];
    const _uses = __ring_dt0[2];
    scan_fn_effects(program.decls, ctx.local_fn_effects);
    scan_trait_decls(program.decls, ctx.trait_method_order);
    scan_fn_mut_params_llvm(program.decls, ctx.fn_mut_params);
    register_effect_ops_llvm(program.decls, ctx.effect_ops);
  }
  declare_runtime_fns(ctx);
  const __ring_iter_29 = __List_Iterable.iter(modules);
  while (true) {
    const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
    if (__ring_next_29._tag === "none") break;
    const m = __ring_next_29._0;
    const __ring_dt1 = m;
    const prefix = __ring_dt1[0];
    const program = __ring_dt1[1];
    const _uses = __ring_dt1[2];
    forward_declare_functions_with_prefix(ctx, program.decls, Option_some(prefix));
  }
  const __ring_iter_30 = __List_Iterable.iter(modules);
  while (true) {
    const __ring_next_30 = __ListIterator_Iterator.next(__ring_iter_30);
    if (__ring_next_30._tag === "none") break;
    const m = __ring_next_30._0;
    const __ring_dt2 = m;
    const prefix = __ring_dt2[0];
    const program = __ring_dt2[1];
    const uses = __ring_dt2[2];
    ctx.module_prefix = Option_some(prefix);
    ctx.boxed_vars = program.boxed_vars;
    ctx.local_names = collect_local_names(program.decls);
    ctx.imports_map = build_imports_map(uses);
    const __ring_iter_31 = __List_Iterable.iter(program.decls);
    while (true) {
      const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
      if (__ring_next_31._tag === "none") break;
      const decl = __ring_next_31._0;
      codegen_llvm_decl$emit_llvm_decl(ctx, decl);
    }
  }
  ctx.module_prefix = Option_none;
  emit_drop_functions(ctx);
  emit_c_main_project(ctx, entry_prefix);
  const ir = LLVMPrintModuleToString(module);
  write_file("ring_output.ll", ir);
  const verify_result = LLVMVerifyModule(module, 2);
  if ((verify_result !== 0)) {
    eprintln(`LLVM module verification failed (${verify_result} errors) — attempting emit anyway`);
  }
  const emit_result = LLVMTargetMachineEmitToFile(tm, module, output_path, 1);
  if ((emit_result !== 0)) {
    eprintln(`Failed to emit object file: ${output_path}`);
  } else {
    print(`Compiled: ${output_path}`, __ring_ev_io);
  }
  LLVMDisposeBuilder(builder);
  LLVMDisposeTargetMachine(tm);
  LLVMDisposeModule(module);
  return LLVMContextDispose(context);
}

function emit_c_main_project(ctx, entry_prefix) {
  const i32_ty = ctx.i32_type;
  const ptr = ctx.ptr_type;
  const main_params = [i32_ty, ptr];
  const main_ty = LLVMFunctionType(i32_ty, main_params, 0);
  const main_fn = LLVMAddFunction(ctx.module, "main", main_ty);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, main_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const argc_val = LLVMGetParam(main_fn, 0);
  const argv_val = LLVMGetParam(main_fn, 1);
  const init_name = "ring_runtime_init";
  const init_params = [i32_ty, ptr];
  const init_ty = LLVMFunctionType(ctx.void_type, init_params, 0);
  const init_fn = LLVMAddFunction(ctx.module, init_name, init_ty);
  discard(LLVMBuildCall2(ctx.builder, init_ty, init_fn, [argc_val, argv_val], ""));
  emit_drop_registrations(ctx);
  const ring_main_name = codegen_llvm_ctx$llvm_mangle_fn_with_prefix(entry_prefix, "main");
  __ring_match23: {
    const __ring_m23 = _Map_get(ctx.functions, ring_main_name);
    if (__ring_m23._tag === "some") {
      const ring_main_fn = __ring_m23._0;
      let call_args = [];
      __ring_match24: {
        const __ring_m24 = _Map_get(ctx.fn_evidence_params, ring_main_name);
        if (__ring_m24._tag === "some") {
          const ev_params = __ring_m24._0;
          const __ring_iter_32 = __List_Iterable.iter(ev_params);
          while (true) {
            const __ring_next_32 = __ListIterator_Iterator.next(__ring_iter_32);
            if (__ring_next_32._tag === "none") break;
            const ep = __ring_next_32._0;
            List_push(call_args, LLVMConstPointerNull(ptr));
          }
          break __ring_match24;
        }
        if (__ring_m24._tag === "none") {
          break __ring_match24;
        }
        __match_fail(__ring_m24);
      }
      const ring_main_ty = (function() {
  const __ring_m = _Map_get(ctx.fn_types, ring_main_name);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return panic("LLVM codegen: ring_main fn type not found (project mode)"); }
  __match_fail(__ring_m);
})();
      discard(LLVMBuildCall2(ctx.builder, ring_main_ty, ring_main_fn, call_args, ""));
      break __ring_match23;
    }
    if (__ring_m23._tag === "none") {
      eprintln("Warning: no main function found in entry module");
      break __ring_match23;
    }
    __match_fail(__ring_m23);
  }
  const zero = LLVMConstInt(i32_ty, 0, 0);
  return discard(LLVMBuildRet(ctx.builder, zero));
}

function build_imports_map(uses) {
  let imap = map_new();
  const __ring_iter_33 = __List_Iterable.iter(uses);
  while (true) {
    const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
    if (__ring_next_33._tag === "none") break;
    const u = __ring_next_33._0;
    const module_name = List_join(u.path.segments, "_");
    __ring_match25: {
      const __ring_m25 = u.imports;
      if (__ring_m25._tag === "NamedItems") {
        const names = __ring_m25.names;
        const __ring_iter_34 = __List_Iterable.iter(names);
        while (true) {
          const __ring_next_34 = __ListIterator_Iterator.next(__ring_iter_34);
          if (__ring_next_34._tag === "none") break;
          const ni = __ring_next_34._0;
          const local_name = (function() {
  const __ring_m = ni.alias;
  if (__ring_m._tag === "some") { const a = __ring_m._0; return a; }
  if (__ring_m._tag === "none") { return ni.name; }
  __match_fail(__ring_m);
})();
          const qualified = codegen_llvm_ctx$llvm_mangle_fn_with_prefix(module_name, ni.name);
          _Map_insert(imap, local_name, qualified);
        }
        break __ring_match25;
      }
      if (__ring_m25._tag === "Module") {
        break __ring_match25;
      }
      __match_fail(__ring_m25);
    }
  }
  return imap;
}

function collect_local_names(decls) {
  let names = set_new();
  collect_local_names_rec(decls, names);
  return names;
}

function collect_local_names_rec(decls, names) {
  const __ring_iter_35 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_35 = __ListIterator_Iterator.next(__ring_iter_35);
    if (__ring_next_35._tag === "none") break;
    const decl = __ring_next_35._0;
    __ring_match26: {
      const __ring_m26 = decl;
      if (__ring_m26._tag === "Fn") {
        const name = __ring_m26.name;
        _Set_insert(names, name);
        break __ring_match26;
      }
      if (__ring_m26._tag === "Struct") {
        const name = __ring_m26.name;
        _Set_insert(names, name);
        break __ring_match26;
      }
      if (__ring_m26._tag === "Enum") {
        const name = __ring_m26.name;
        _Set_insert(names, name);
        break __ring_match26;
      }
      if (__ring_m26._tag === "Const") {
        const name = __ring_m26.name;
        _Set_insert(names, name);
        break __ring_match26;
      }
      if (__ring_m26._tag === "Trait") {
        const name = __ring_m26.name;
        _Set_insert(names, name);
        break __ring_match26;
      }
      if (__ring_m26._tag === "ExternFn") {
        const name = __ring_m26.name;
        _Set_insert(names, name);
        break __ring_match26;
      }
      if (__ring_m26._tag === "ExternType") {
        const name = __ring_m26.name;
        _Set_insert(names, name);
        break __ring_match26;
      }
      if (__ring_m26._tag === "TypeAlias") {
        const name = __ring_m26.name;
        _Set_insert(names, name);
        break __ring_match26;
      }
      if (__ring_m26._tag === "Impl") {
        break __ring_match26;
      }
      if (__ring_m26._tag === "Effect") {
        const name = __ring_m26.name;
        _Set_insert(names, name);
        break __ring_match26;
      }
      if (__ring_m26._tag === "ModBlock") {
        const md = __ring_m26.decls;
        collect_local_names_rec(md, names);
        break __ring_match26;
      }
      if (__ring_m26._tag === "Test") {
        break __ring_match26;
      }
      if (__ring_m26._tag === "Sig") {
        break __ring_match26;
      }
      __match_fail(__ring_m26);
    }
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


export { generate_llvm, generate_llvm_project };