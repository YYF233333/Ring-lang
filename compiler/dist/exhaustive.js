import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { new_union_find as union_find$new_union_find, uf_bind as union_find$uf_bind, uf_find as union_find$uf_find, uf_insert as union_find$uf_insert, uf_lookup as union_find$uf_lookup, uf_union as union_find$uf_union, UnionFind as union_find$UnionFind } from "./union_find.js";
import { add_impl as env$add_impl, apply_subst as env$apply_subst, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_map as env$apply_subst_map, apply_subst_row as env$apply_subst_row, apply_subst_row_map as env$apply_subst_row_map, find_impl as env$find_impl, has_impl as env$has_impl, lookup_variant as env$lookup_variant, mono as env$mono, new_type_env as env$new_type_env, AssocConstraintEntry as env$AssocConstraintEntry, AssocTypeDef as env$AssocTypeDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectAliasDef as env$EffectAliasDef, EffectDef as env$EffectDef, EffectOpDef as env$EffectOpDef, EnumDef as env$EnumDef, FnBound as env$FnBound, IdGen as env$IdGen, ImplEntry as env$ImplEntry, SchemeBound as env$SchemeBound, Scope as env$Scope, ScopeManager as env$ScopeManager, SigDef as env$SigDef, StructDef as env$StructDef, TraitDef as env$TraitDef, TraitMethodDef as env$TraitMethodDef, TraitRegistry as env$TraitRegistry, TypeAliasDef as env$TypeAliasDef, TypeEnv as env$TypeEnv, TypeRegistry as env$TypeRegistry, TypeScheme as env$TypeScheme, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __BuiltInKind_Debug as env$__BuiltInKind_Debug, __FnBound_Eq as env$__FnBound_Eq, __FnBound_Clone as env$__FnBound_Clone, __FnBound_Ord as env$__FnBound_Ord, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Eq as env$__IdGen_Eq, __IdGen_Clone as env$__IdGen_Clone, __IdGen_Ord as env$__IdGen_Ord, __IdGen_Debug as env$__IdGen_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_FloatIdentity as hir$FieldAction_FloatIdentity, FieldAction_BoolIdentity as hir$FieldAction_BoolIdentity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";



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

class Ctor {
  constructor(name, arity, field_types, field_names, is_tuple) {
    this.name = name;
    this.arity = arity;
    this.field_types = field_types;
    this.field_names = field_names;
    this.is_tuple = is_tuple;
  }
}

class ExhCache {
  constructor(ftc, tir) {
    this.ftc = ftc;
    this.tir = tir;
  }
}

function build_inst_map(type_param_vars, type_params) {
  let inst_map = map_new();
  let i = 0;
  while (((i < List_len(type_param_vars)) ? (i < List_len(type_params)) : false)) {
    __ring_match6: {
      const __ring_m6 = [List_get(type_param_vars, i), List_get(type_params, i)];
      if (Array.isArray(__ring_m6) && __ring_m6.length === 2 && __ring_m6[0]._tag === "some" && __ring_m6[1]._tag === "some") {
        const var_id = __ring_m6[0]._0; const tp = __ring_m6[1]._0;
        _Map_insert(inst_map, var_id, tp);
        break __ring_match6;
      }
      break __ring_match6;
    }
    i = (i + 1);
  }
  return inst_map;
}

function instantiate_enum_variants(env, name, type_params) {
  __ring_match7: {
    const __ring_m7 = _Map_get(env.types.enums, name);
    if (__ring_m7._tag === "some") {
      const enum_def = __ring_m7._0;
      const inst_map = build_inst_map(enum_def.type_param_vars, type_params);
      if ((_Map_len(inst_map) === 0)) {
        return enum_def.variants;
      }
      let result = [];
      const __ring_iter_2 = __List_Iterable.iter(enum_def.variants);
      while (true) {
        const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
        if (__ring_next_2._tag === "none") break;
        const v = __ring_next_2._0;
        const inst_fields = v.fields.map((function(f) { return env$apply_subst_map(inst_map, f); }));
        List_push(result, new types$EnumVariant(v.name, inst_fields, v.field_names));
      }
      return result;
      break __ring_match7;
    }
    if (__ring_m7._tag === "none") {
      return [];
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
}

function instantiate_struct_fields(env, name, type_params) {
  __ring_match8: {
    const __ring_m8 = _Map_get(env.types.structs, name);
    if (__ring_m8._tag === "some") {
      const struct_def = __ring_m8._0;
      const inst_map = build_inst_map(struct_def.type_param_vars, type_params);
      if ((_Map_len(inst_map) === 0)) {
        return struct_def.fields;
      }
      let result = [];
      const __ring_iter_3 = __List_Iterable.iter(struct_def.fields);
      while (true) {
        const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
        if (__ring_next_3._tag === "none") break;
        const f = __ring_next_3._0;
        List_push(result, new types$StructField(f.name, env$apply_subst_map(inst_map, f.ty), f.is_pub));
      }
      return result;
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      return [];
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
}

function finite_type_ctors(env, ty, cache) {
  const cache_key = types$type_to_string(ty);
  __ring_match9: {
    const __ring_m9 = _Map_get(cache.ftc, cache_key);
    if (__ring_m9._tag === "some") {
      const cached = __ring_m9._0;
      return cached;
      break __ring_match9;
    }
    if (__ring_m9._tag === "none") {
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
  let __ring_blk0;
  __ring_match10: {
    const __ring_m10 = ty;
    if (__ring_m10._tag === "BoolType") {
      let r = [];
      List_push(r, new Ctor("true", 0, [], Option_none, false));
      List_push(r, new Ctor("false", 0, [], Option_none, false));
      __ring_blk0 = Option_some(r);
      break __ring_match10;
    }
    if (__ring_m10._tag === "EnumType") {
      const name = __ring_m10.name; const type_params = __ring_m10.type_params;
      const inst_variants = instantiate_enum_variants(env, name, type_params);
      let r = [];
      const __ring_iter_4 = __List_Iterable.iter(inst_variants);
      while (true) {
        const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
        if (__ring_next_4._tag === "none") break;
        const v = __ring_next_4._0;
        List_push(r, new Ctor(v.name, List_len(v.fields), v.fields, v.field_names, false));
      }
      __ring_blk0 = Option_some(r);
      break __ring_match10;
    }
    if (__ring_m10._tag === "StructType") {
      const name = __ring_m10.name; const type_params = __ring_m10.type_params;
      const inst_fields = instantiate_struct_fields(env, name, type_params);
      let field_types = [];
      let field_names = [];
      const __ring_iter_5 = __List_Iterable.iter(inst_fields);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const f = __ring_next_5._0;
        List_push(field_types, f.ty);
        List_push(field_names, f.name);
      }
      let r = [];
      List_push(r, new Ctor(name, List_len(inst_fields), field_types, Option_some(field_names), false));
      __ring_blk0 = Option_some(r);
      break __ring_match10;
    }
    if (__ring_m10._tag === "UnitType") {
      let r = [];
      List_push(r, new Ctor("()", 0, [], Option_none, false));
      __ring_blk0 = Option_some(r);
      break __ring_match10;
    }
    if (__ring_m10._tag === "TupleType") {
      const elements = __ring_m10.elements;
      let r = [];
      List_push(r, new Ctor("", List_len(elements), elements, Option_none, true));
      __ring_blk0 = Option_some(r);
      break __ring_match10;
    }
    __ring_blk0 = Option_none;
    break __ring_match10;
  }
  const result = __ring_blk0;
  _Map_insert(cache.ftc, cache_key, result);
  return result;
}

function str_at(list, i) {
  __ring_match11: {
    const __ring_m11 = List_get(list, i);
    if (__ring_m11._tag === "some") {
      const v = __ring_m11._0;
      return v;
      break __ring_match11;
    }
    if (__ring_m11._tag === "none") {
      return panic("unreachable: str_at out of bounds");
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
}

function join_strs(parts, sep) {
  let result = "";
  const __ring_end6 = List_len(parts);
  for (let i = 0; i < __ring_end6; i++) {
    if ((i > 0)) {
      result = `${result}${sep}`;
    }
    const part = str_at(parts, i);
    result = `${result}${part}`;
  }
  return result;
}

function pat_at(list, i) {
  __ring_match12: {
    const __ring_m12 = List_get(list, i);
    if (__ring_m12._tag === "some") {
      const v = __ring_m12._0;
      return v;
      break __ring_match12;
    }
    if (__ring_m12._tag === "none") {
      return panic("unreachable: pat_at out of bounds");
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
}

function index_of(list, target) {
  const __ring_end7 = List_len(list);
  for (let i = 0; i < __ring_end7; i++) {
    if ((str_at(list, i) === target)) {
      return i;
    }
  }
  return (0 - 1);
}

function wild_pattern() {
  return ast$Pattern_Wildcard(ast$span_zero());
}

function named_pattern_to_positional(fields, field_names, arity) {
  const wild = wild_pattern();
  let result = [];
  const __ring_end8 = arity;
  for (let i = 0; i < __ring_end8; i++) {
    List_push(result, wild);
  }
  const __ring_iter_9 = __List_Iterable.iter(fields);
  while (true) {
    const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
    if (__ring_next_9._tag === "none") break;
    const f = __ring_next_9._0;
    const idx = index_of(field_names, f.name);
    if ((idx >= 0)) {
      if ((idx < arity)) {
        List_set(result, idx, f.pattern);
      }
    }
  }
  return result;
}

function names_match_struct(pattern_name, type_name) {
  if ((pattern_name === type_name)) {
    return true;
  }
  return Str_ends_with(type_name, `::${pattern_name}`);
}

function specialize_row(row, ctor) {
  const first = pat_at(row, 0);
  const rest = List_slice(row, 1, List_len(row));
  __ring_match13: {
    const __ring_m13 = first;
    if (__ring_m13._tag === "Wildcard") {
      let result = [];
      const wild = wild_pattern();
      const __ring_end10 = ctor.arity;
      for (let i = 0; i < __ring_end10; i++) {
        List_push(result, wild);
      }
      List_extend(result, rest);
      return Option_some(result);
      break __ring_match13;
    }
    if (__ring_m13._tag === "Binding") {
      let result = [];
      const wild = wild_pattern();
      const __ring_end11 = ctor.arity;
      for (let i = 0; i < __ring_end11; i++) {
        List_push(result, wild);
      }
      List_extend(result, rest);
      return Option_some(result);
      break __ring_match13;
    }
    if (__ring_m13._tag === "Literal") {
      const value = __ring_m13.value;
      __ring_match14: {
        const __ring_m14 = value;
        if (__ring_m14._tag === "BoolVal") {
          const b = __ring_m14._0;
          const match_name = (b ? "true" : "false");
          if ((match_name === ctor.name)) {
            return Option_some(rest);
          } else {
            return Option_none;
          }
          break __ring_match14;
        }
        return Option_none;
        break __ring_match14;
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "Constructor") {
      const name = __ring_m13.name; const fields = __ring_m13.fields;
      if (names_match_struct(name, ctor.name)) {
        let sub = list_clone(fields);
        const wild = wild_pattern();
        while ((List_len(sub) < ctor.arity)) {
          List_push(sub, wild);
        }
        List_extend(sub, rest);
        return Option_some(sub);
      } else {
        return Option_none;
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "NamedConstructor") {
      const name = __ring_m13.name; const nfields = __ring_m13.fields;
      if (names_match_struct(name, ctor.name)) {
        let __ring_blk1;
        __ring_match15: {
          const __ring_m15 = ctor.field_names;
          if (__ring_m15._tag === "some") {
            const fns = __ring_m15._0;
            __ring_blk1 = fns;
            break __ring_match15;
          }
          if (__ring_m15._tag === "none") {
            const empty = [];
            __ring_blk1 = empty;
            break __ring_match15;
          }
          __match_fail(__ring_m15);
        }
        const field_names = __ring_blk1;
        let positional = named_pattern_to_positional(nfields, field_names, ctor.arity);
        List_extend(positional, rest);
        return Option_some(positional);
      } else {
        return Option_none;
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "TuplePattern") {
      const elements = __ring_m13.elements;
      if ((ctor.is_tuple === true)) {
        if ((List_len(elements) === ctor.arity)) {
          let result = list_clone(elements);
          List_extend(result, rest);
          return Option_some(result);
        } else {
          return Option_none;
        }
      } else {
        return Option_none;
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "OrPattern") {
      const sub_pats = __ring_m13.patterns;
      const __ring_iter_12 = __List_Iterable.iter(sub_pats);
      while (true) {
        const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
        if (__ring_next_12._tag === "none") break;
        const sp = __ring_next_12._0;
        let trial_row = [sp];
        List_extend(trial_row, rest);
        const result = specialize_row(trial_row, ctor);
        __ring_match16: {
          const __ring_m16 = result;
          if (__ring_m16._tag === "some") {
            return result;
            break __ring_match16;
          }
          if (__ring_m16._tag === "none") {
            break __ring_match16;
          }
          __match_fail(__ring_m16);
        }
      }
      return Option_none;
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
}

function type_at(list, i) {
  __ring_match17: {
    const __ring_m17 = List_get(list, i);
    if (__ring_m17._tag === "some") {
      const v = __ring_m17._0;
      return v;
      break __ring_match17;
    }
    if (__ring_m17._tag === "none") {
      return panic("unreachable: type_at out of bounds");
      break __ring_match17;
    }
    __match_fail(__ring_m17);
  }
}

function type_contains_key(env, ty, key, visited) {
  const ty_str = types$type_to_string(ty);
  if ((ty_str === key)) {
    return true;
  }
  if (_Map_contains_key(visited, ty_str)) {
    return false;
  }
  _Map_insert(visited, ty_str, true);
  __ring_match18: {
    const __ring_m18 = ty;
    if (__ring_m18._tag === "EnumType") {
      const name = __ring_m18.name; const type_params = __ring_m18.type_params;
      const inst_variants = instantiate_enum_variants(env, name, type_params);
      const __ring_iter_13 = __List_Iterable.iter(inst_variants);
      while (true) {
        const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
        if (__ring_next_13._tag === "none") break;
        const v = __ring_next_13._0;
        const __ring_iter_14 = __List_Iterable.iter(v.fields);
        while (true) {
          const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
          if (__ring_next_14._tag === "none") break;
          const ft = __ring_next_14._0;
          if (type_contains_key(env, ft, key, visited)) {
            return true;
          }
        }
      }
      return false;
      break __ring_match18;
    }
    if (__ring_m18._tag === "StructType") {
      const name = __ring_m18.name; const type_params = __ring_m18.type_params;
      const inst_fields = instantiate_struct_fields(env, name, type_params);
      const __ring_iter_15 = __List_Iterable.iter(inst_fields);
      while (true) {
        const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
        if (__ring_next_15._tag === "none") break;
        const f = __ring_next_15._0;
        if (type_contains_key(env, f.ty, key, visited)) {
          return true;
        }
      }
      return false;
      break __ring_match18;
    }
    if (__ring_m18._tag === "TupleType") {
      const elements = __ring_m18.elements;
      const __ring_iter_16 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
        if (__ring_next_16._tag === "none") break;
        const e = __ring_next_16._0;
        if (type_contains_key(env, e, key, visited)) {
          return true;
        }
      }
      return false;
      break __ring_match18;
    }
    if (__ring_m18._tag === "FnType") {
      const params = __ring_m18.params; const return_type = __ring_m18.return_type;
      const __ring_iter_17 = __List_Iterable.iter(params);
      while (true) {
        const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
        if (__ring_next_17._tag === "none") break;
        const p = __ring_next_17._0;
        if (type_contains_key(env, p, key, visited)) {
          return true;
        }
      }
      return type_contains_key(env, return_type, key, visited);
      break __ring_match18;
    }
    return false;
    break __ring_match18;
  }
}

function type_is_recursive(env, ty, key, cache) {
  __ring_match19: {
    const __ring_m19 = _Map_get(cache.tir, key);
    if (__ring_m19._tag === "some") {
      const cached = __ring_m19._0;
      return cached;
      break __ring_match19;
    }
    if (__ring_m19._tag === "none") {
      break __ring_match19;
    }
    __match_fail(__ring_m19);
  }
  let __ring_blk2;
  __ring_match20: {
    const __ring_m20 = ty;
    if (__ring_m20._tag === "EnumType") {
      const name = __ring_m20.name; const type_params = __ring_m20.type_params;
      const inst_variants = instantiate_enum_variants(env, name, type_params);
      let visited = map_new();
      _Map_insert(visited, key, true);
      let found = false;
      const __ring_iter_18 = __List_Iterable.iter(inst_variants);
      while (true) {
        const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
        if (__ring_next_18._tag === "none") break;
        const v = __ring_next_18._0;
        const __ring_iter_19 = __List_Iterable.iter(v.fields);
        while (true) {
          const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
          if (__ring_next_19._tag === "none") break;
          const ft = __ring_next_19._0;
          if (type_contains_key(env, ft, key, visited)) {
            found = true;
          }
        }
      }
      __ring_blk2 = found;
      break __ring_match20;
    }
    __ring_blk2 = false;
    break __ring_match20;
  }
  const result = __ring_blk2;
  _Map_insert(cache.tir, key, result);
  return result;
}

function check_matrix(env, rows, col_types, subst, expanding, cache) {
  if ((List_len(col_types) === 0)) {
    if ((List_len(rows) > 0)) {
      return Option_none;
    } else {
      const empty = [];
      return Option_some(empty);
    }
  }
  const first_type = env$apply_subst(subst, type_at(col_types, 0));
  const rest_types = List_slice(col_types, 1, List_len(col_types));
  let __ring_blk3;
  __ring_match21: {
    const __ring_m21 = first_type;
    if (__ring_m21._tag === "EnumType") {
      __ring_blk3 = types$type_to_string(first_type);
      break __ring_match21;
    }
    __ring_blk3 = "";
    break __ring_match21;
  }
  const type_key = __ring_blk3;
  const is_reentrant = ((type_key !== "") ? _Map_contains_key(expanding, type_key) : false);
  const ctors = (is_reentrant ? Option_none : finite_type_ctors(env, first_type, cache));
  __ring_match22: {
    const __ring_m22 = ctors;
    if (__ring_m22._tag === "some") {
      const ctor_list = __ring_m22._0;
      let new_expanding = map_clone(expanding);
      if ((type_key !== "")) {
        if (type_is_recursive(env, first_type, type_key, cache)) {
          _Map_insert(new_expanding, type_key, true);
        }
      }
      const __ring_iter_20 = __List_Iterable.iter(ctor_list);
      while (true) {
        const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
        if (__ring_next_20._tag === "none") break;
        const ctor = __ring_next_20._0;
        let specialized = [];
        const __ring_iter_21 = __List_Iterable.iter(rows);
        while (true) {
          const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
          if (__ring_next_21._tag === "none") break;
          const row = __ring_next_21._0;
          __ring_match23: {
            const __ring_m23 = specialize_row(row, ctor);
            if (__ring_m23._tag === "some") {
              const s = __ring_m23._0;
              List_push(specialized, s);
              break __ring_match23;
            }
            if (__ring_m23._tag === "none") {
              break __ring_match23;
            }
            __match_fail(__ring_m23);
          }
        }
        let new_types = [];
        List_extend(new_types, ctor.field_types);
        List_extend(new_types, rest_types);
        const sub = check_matrix(env, specialized, new_types, subst, new_expanding, cache);
        __ring_match24: {
          const __ring_m24 = sub;
          if (__ring_m24._tag === "some") {
            const sub_result = __ring_m24._0;
            const ctor_sub = List_slice(sub_result, 0, ctor.arity);
            const rest_sub = List_slice(sub_result, ctor.arity, List_len(sub_result));
            let ctor_str = "";
            if (ctor.is_tuple) {
              const joined_sub = join_strs(ctor_sub, ", ");
              ctor_str = `(${joined_sub})`;
            } else {
              if ((ctor.arity === 0)) {
                ctor_str = ctor.name;
              } else {
                const joined_sub2 = join_strs(ctor_sub, ", ");
                ctor_str = `${ctor.name}(${joined_sub2})`;
              }
            }
            let result = [];
            List_push(result, ctor_str);
            List_extend(result, rest_sub);
            return Option_some(result);
            break __ring_match24;
          }
          if (__ring_m24._tag === "none") {
            break __ring_match24;
          }
          __match_fail(__ring_m24);
        }
      }
      return Option_none;
      break __ring_match22;
    }
    if (__ring_m22._tag === "none") {
      let defaults = [];
      const __ring_iter_22 = __List_Iterable.iter(rows);
      while (true) {
        const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
        if (__ring_next_22._tag === "none") break;
        const row = __ring_next_22._0;
        const first = pat_at(row, 0);
        let is_default = false;
        __ring_match25: {
          const __ring_m25 = first;
          if (__ring_m25._tag === "Wildcard") {
            is_default = true;
            break __ring_match25;
          }
          if (__ring_m25._tag === "Binding") {
            is_default = true;
            break __ring_match25;
          }
          if (__ring_m25._tag === "OrPattern") {
            const sub_pats = __ring_m25.patterns;
            const __ring_iter_23 = __List_Iterable.iter(sub_pats);
            while (true) {
              const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
              if (__ring_next_23._tag === "none") break;
              const sp = __ring_next_23._0;
              __ring_match26: {
                const __ring_m26 = sp;
                if (__ring_m26._tag === "Wildcard") {
                  is_default = true;
                  break __ring_match26;
                }
                if (__ring_m26._tag === "Binding") {
                  is_default = true;
                  break __ring_match26;
                }
                break __ring_match26;
              }
            }
            break __ring_match25;
          }
          break __ring_match25;
        }
        if (is_default) {
          const tail = List_slice(row, 1, List_len(row));
          List_push(defaults, tail);
        }
      }
      const sub = check_matrix(env, defaults, rest_types, subst, expanding, cache);
      __ring_match27: {
        const __ring_m27 = sub;
        if (__ring_m27._tag === "some") {
          const s = __ring_m27._0;
          let result = [];
          List_push(result, "_");
          List_extend(result, s);
          return Option_some(result);
          break __ring_match27;
        }
        if (__ring_m27._tag === "none") {
          return Option_none;
          break __ring_match27;
        }
        __match_fail(__ring_m27);
      }
      break __ring_match22;
    }
    __match_fail(__ring_m22);
  }
}

function expand_or_patterns(patterns) {
  let result = [];
  const __ring_iter_24 = __List_Iterable.iter(patterns);
  while (true) {
    const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
    if (__ring_next_24._tag === "none") break;
    const p = __ring_next_24._0;
    __ring_match28: {
      const __ring_m28 = p;
      if (__ring_m28._tag === "OrPattern") {
        const sub_pats = __ring_m28.patterns;
        const __ring_iter_25 = __List_Iterable.iter(sub_pats);
        while (true) {
          const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
          if (__ring_next_25._tag === "none") break;
          const sp = __ring_next_25._0;
          List_push(result, sp);
        }
        break __ring_match28;
      }
      List_push(result, p);
      break __ring_match28;
    }
  }
  return result;
}

function check_patterns(env, patterns, ty, subst) {
  const resolved = env$apply_subst(subst, ty);
  const expanded = expand_or_patterns(patterns);
  const __ring_iter_26 = __List_Iterable.iter(expanded);
  while (true) {
    const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
    if (__ring_next_26._tag === "none") break;
    const p = __ring_next_26._0;
    __ring_match29: {
      const __ring_m29 = p;
      if (__ring_m29._tag === "Wildcard") {
        return Option_none;
        break __ring_match29;
      }
      if (__ring_m29._tag === "Binding") {
        return Option_none;
        break __ring_match29;
      }
      break __ring_match29;
    }
  }
  let cache = new ExhCache(map_new(), map_new());
  __ring_match30: {
    const __ring_m30 = resolved;
    if (__ring_m30._tag === "EnumType") {
      const name = __ring_m30.name; const type_params = __ring_m30.type_params;
      const inst_variants = instantiate_enum_variants(env, name, type_params);
      const variant_names = inst_variants.map((function(v) { return v.name; }));
      let covered = map_new();
      const __ring_iter_27 = __List_Iterable.iter(inst_variants);
      while (true) {
        const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
        if (__ring_next_27._tag === "none") break;
        const v = __ring_next_27._0;
        let sub_patterns_for_variant = [];
        const __ring_iter_28 = __List_Iterable.iter(expanded);
        while (true) {
          const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
          if (__ring_next_28._tag === "none") break;
          const p = __ring_next_28._0;
          __ring_match31: {
            const __ring_m31 = p;
            if (__ring_m31._tag === "Constructor") {
              const pname = __ring_m31.name; const fields = __ring_m31.fields;
              if ((pname === v.name)) {
                _Map_insert(covered, v.name, true);
                List_push(sub_patterns_for_variant, fields);
              }
              break __ring_match31;
            }
            if (__ring_m31._tag === "NamedConstructor") {
              const pname = __ring_m31.name; const nfields = __ring_m31.fields;
              __ring_match32: {
                const __ring_m32 = v.field_names;
                if (__ring_m32._tag === "some") {
                  const fnames = __ring_m32._0;
                  if ((pname === v.name)) {
                    _Map_insert(covered, v.name, true);
                    const positional = named_pattern_to_positional(nfields, fnames, List_len(v.fields));
                    List_push(sub_patterns_for_variant, positional);
                  }
                  break __ring_match32;
                }
                if (__ring_m32._tag === "none") {
                  break __ring_match32;
                }
                __match_fail(__ring_m32);
              }
              break __ring_match31;
            }
            break __ring_match31;
          }
        }
        if ((_Map_contains_key(covered, v.name) === false)) {
        } else {
          if ((List_len(v.fields) > 0)) {
            const wild = ast$Pattern_Wildcard(ast$span_zero());
            let normalized = [];
            const __ring_iter_29 = __List_Iterable.iter(sub_patterns_for_variant);
            while (true) {
              const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
              if (__ring_next_29._tag === "none") break;
              const row = __ring_next_29._0;
              let padded = list_clone(row);
              while ((List_len(padded) < List_len(v.fields))) {
                List_push(padded, wild);
              }
              List_push(normalized, padded);
            }
            let expanding = map_new();
            _Map_insert(expanding, types$type_to_string(resolved), true);
            const missing_fields = check_matrix(env, normalized, v.fields, subst, expanding, cache);
            __ring_match33: {
              const __ring_m33 = missing_fields;
              if (__ring_m33._tag === "some") {
                const mf = __ring_m33._0;
                const joined = join_strs(mf, ", ");
                return Option_some(`${v.name}(${joined})`);
                break __ring_match33;
              }
              if (__ring_m33._tag === "none") {
                break __ring_match33;
              }
              __match_fail(__ring_m33);
            }
          }
        }
      }
      const __ring_iter_30 = __List_Iterable.iter(variant_names);
      while (true) {
        const __ring_next_30 = __ListIterator_Iterator.next(__ring_iter_30);
        if (__ring_next_30._tag === "none") break;
        const vn = __ring_next_30._0;
        if ((_Map_contains_key(covered, vn) === false)) {
          return Option_some(vn);
        }
      }
      return Option_none;
      break __ring_match30;
    }
    if (__ring_m30._tag === "BoolType") {
      let has_true = false;
      let has_false = false;
      const __ring_iter_31 = __List_Iterable.iter(expanded);
      while (true) {
        const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
        if (__ring_next_31._tag === "none") break;
        const p = __ring_next_31._0;
        __ring_match34: {
          const __ring_m34 = p;
          if (__ring_m34._tag === "Literal") {
            const value = __ring_m34.value;
            __ring_match35: {
              const __ring_m35 = value;
              if (__ring_m35._tag === "BoolVal") {
                const b = __ring_m35._0;
                if (b) {
                  has_true = true;
                } else {
                  has_false = true;
                }
                break __ring_match35;
              }
              break __ring_match35;
            }
            break __ring_match34;
          }
          break __ring_match34;
        }
      }
      if ((has_true === true)) {
        if ((has_false === true)) {
          return Option_none;
        } else {
          return Option_some("false");
        }
      } else {
        return Option_some("true");
      }
      break __ring_match30;
    }
    if (__ring_m30._tag === "StructType") {
      const sname = __ring_m30.name; const stp = __ring_m30.type_params;
      const inst_fields = instantiate_struct_fields(env, sname, stp);
      let covered = false;
      let sub_patterns = [];
      let field_names = [];
      let field_types = [];
      const __ring_iter_32 = __List_Iterable.iter(inst_fields);
      while (true) {
        const __ring_next_32 = __ListIterator_Iterator.next(__ring_iter_32);
        if (__ring_next_32._tag === "none") break;
        const f = __ring_next_32._0;
        List_push(field_names, f.name);
        List_push(field_types, f.ty);
      }
      const __ring_iter_33 = __List_Iterable.iter(expanded);
      while (true) {
        const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
        if (__ring_next_33._tag === "none") break;
        const p = __ring_next_33._0;
        __ring_match36: {
          const __ring_m36 = p;
          if (__ring_m36._tag === "NamedConstructor") {
            const pname = __ring_m36.name; const nfields = __ring_m36.fields;
            if (names_match_struct(pname, sname)) {
              covered = true;
              const positional = named_pattern_to_positional(nfields, field_names, List_len(inst_fields));
              List_push(sub_patterns, positional);
            }
            break __ring_match36;
          }
          if (__ring_m36._tag === "Constructor") {
            const pname = __ring_m36.name; const cfields = __ring_m36.fields;
            if (names_match_struct(pname, sname)) {
              covered = true;
              List_push(sub_patterns, cfields);
            }
            break __ring_match36;
          }
          break __ring_match36;
        }
      }
      if ((covered === false)) {
        return Option_some(sname);
      }
      if ((List_len(inst_fields) > 0)) {
        const wild = ast$Pattern_Wildcard(ast$span_zero());
        let normalized = [];
        const __ring_iter_34 = __List_Iterable.iter(sub_patterns);
        while (true) {
          const __ring_next_34 = __ListIterator_Iterator.next(__ring_iter_34);
          if (__ring_next_34._tag === "none") break;
          const row = __ring_next_34._0;
          let padded = list_clone(row);
          while ((List_len(padded) < List_len(inst_fields))) {
            List_push(padded, wild);
          }
          List_push(normalized, padded);
        }
        let expanding = map_new();
        _Map_insert(expanding, types$type_to_string(resolved), true);
        const missing_fields = check_matrix(env, normalized, field_types, subst, expanding, cache);
        __ring_match37: {
          const __ring_m37 = missing_fields;
          if (__ring_m37._tag === "some") {
            const mf = __ring_m37._0;
            const joined = join_strs(mf, ", ");
            return Option_some(`${sname}(${joined})`);
            break __ring_match37;
          }
          if (__ring_m37._tag === "none") {
            break __ring_match37;
          }
          __match_fail(__ring_m37);
        }
      }
      return Option_none;
      break __ring_match30;
    }
    if (__ring_m30._tag === "UnitType") {
      return Option_none;
      break __ring_match30;
    }
    if (__ring_m30._tag === "TupleType") {
      const elements = __ring_m30.elements;
      let matrix = [];
      const __ring_iter_35 = __List_Iterable.iter(expanded);
      while (true) {
        const __ring_next_35 = __ListIterator_Iterator.next(__ring_iter_35);
        if (__ring_next_35._tag === "none") break;
        const p = __ring_next_35._0;
        __ring_match38: {
          const __ring_m38 = p;
          if (__ring_m38._tag === "TuplePattern") {
            const pelems = __ring_m38.elements;
            if ((List_len(pelems) === List_len(elements))) {
              List_push(matrix, pelems);
            }
            break __ring_match38;
          }
          break __ring_match38;
        }
      }
      if ((List_len(matrix) === 0)) {
        const underscores = elements.map((function(e) { return "_"; }));
        const joined = join_strs(underscores, ", ");
        return Option_some(`(${joined})`);
      }
      const missing = check_matrix(env, matrix, elements, subst, map_new(), cache);
      __ring_match39: {
        const __ring_m39 = missing;
        if (__ring_m39._tag === "some") {
          const m = __ring_m39._0;
          const joined = join_strs(m, ", ");
          return Option_some(`(${joined})`);
          break __ring_match39;
        }
        if (__ring_m39._tag === "none") {
          return Option_none;
          break __ring_match39;
        }
        __match_fail(__ring_m39);
      }
      break __ring_match30;
    }
    return Option_some("_");
    break __ring_match30;
  }
}

function check_exhaustive(env, arms, scrutinee_type, subst) {
  let patterns = [];
  const __ring_iter_36 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_36 = __ListIterator_Iterator.next(__ring_iter_36);
    if (__ring_next_36._tag === "none") break;
    const arm = __ring_next_36._0;
    __ring_match40: {
      const __ring_m40 = arm.guard;
      if (__ring_m40._tag === "some") {
        break __ring_match40;
      }
      if (__ring_m40._tag === "none") {
        List_push(patterns, arm.pattern);
        break __ring_match40;
      }
      __match_fail(__ring_m40);
    }
  }
  return check_patterns(env, patterns, scrutinee_type, subst);
}

function ctor_at(list, i) {
  __ring_match41: {
    const __ring_m41 = List_get(list, i);
    if (__ring_m41._tag === "some") {
      const v = __ring_m41._0;
      return v;
      break __ring_match41;
    }
    if (__ring_m41._tag === "none") {
      return panic("unreachable: ctor_at out of bounds");
      break __ring_match41;
    }
    __match_fail(__ring_m41);
  }
}

function row_at(list, i) {
  __ring_match42: {
    const __ring_m42 = List_get(list, i);
    if (__ring_m42._tag === "some") {
      const v = __ring_m42._0;
      return v;
      break __ring_match42;
    }
    if (__ring_m42._tag === "none") {
      return panic("unreachable: row_at out of bounds");
      break __ring_match42;
    }
    __match_fail(__ring_m42);
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

function __ExhCache_Clone_clone(self) {
  return new ExhCache(__Map_Clone.clone(self.ftc, __Str_Clone, __Option_Clone), __Map_Clone.clone(self.tir, __Str_Clone, __Bool_Clone));
}
const __ExhCache_Clone = { clone: __ExhCache_Clone_clone };

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

function __ExhCache_Debug_debug(self) {
  return "ExhCache { " + "ftc: " + __Map_Debug.debug(self.ftc, __Str_Debug, __Option_Debug) + ", " + "tir: " + __Map_Debug.debug(self.tir, __Str_Debug, __Bool_Debug) + " }";
}
const __ExhCache_Debug = { debug: __ExhCache_Debug_debug };

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


export { check_exhaustive };