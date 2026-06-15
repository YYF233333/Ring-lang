import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { add_impl as env$add_impl, apply_subst as env$apply_subst, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_map as env$apply_subst_map, apply_subst_row as env$apply_subst_row, apply_subst_row_map as env$apply_subst_row_map, find_impl as env$find_impl, has_impl as env$has_impl, lookup_variant as env$lookup_variant, mono as env$mono, new_type_env as env$new_type_env, AssocConstraintEntry as env$AssocConstraintEntry, AssocTypeDef as env$AssocTypeDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectAliasDef as env$EffectAliasDef, EffectDef as env$EffectDef, EffectOpDef as env$EffectOpDef, EnumDef as env$EnumDef, FnBound as env$FnBound, IdGen as env$IdGen, ImplEntry as env$ImplEntry, SchemeBound as env$SchemeBound, Scope as env$Scope, ScopeManager as env$ScopeManager, SigDef as env$SigDef, StructDef as env$StructDef, TraitDef as env$TraitDef, TraitMethodDef as env$TraitMethodDef, TraitRegistry as env$TraitRegistry, TypeAliasDef as env$TypeAliasDef, TypeEnv as env$TypeEnv, TypeRegistry as env$TypeRegistry, TypeScheme as env$TypeScheme, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __BuiltInKind_Debug as env$__BuiltInKind_Debug, __FnBound_Eq as env$__FnBound_Eq, __FnBound_Clone as env$__FnBound_Clone, __FnBound_Ord as env$__FnBound_Ord, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Eq as env$__IdGen_Eq, __IdGen_Clone as env$__IdGen_Clone, __IdGen_Ord as env$__IdGen_Ord, __IdGen_Debug as env$__IdGen_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { collect_all_supertraits as infer_register$collect_all_supertraits, inject_assoc_types_from_bounds as infer_register$inject_assoc_types_from_bounds, insert_mod_aliases as infer_register$insert_mod_aliases, prefix_decl_name as infer_register$prefix_decl_name, register_decl_public as infer_register$register_decl_public, register_decls_two_phase as infer_register$register_decls_two_phase, resolve_declared_effects as infer_register$resolve_declared_effects, resolve_effect_expr as infer_register$resolve_effect_expr } from "./infer_register.js";



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

class ModuleExports {
  constructor(module_key, module_prefix, values, types, effects, effect_aliases, traits, trait_impls, impl_methods, inherent_methods, struct_field_orders, extern_values, mut_methods, fn_mut_params) {
    this.module_key = module_key;
    this.module_prefix = module_prefix;
    this.values = values;
    this.types = types;
    this.effects = effects;
    this.effect_aliases = effect_aliases;
    this.traits = traits;
    this.trait_impls = trait_impls;
    this.impl_methods = impl_methods;
    this.inherent_methods = inherent_methods;
    this.struct_field_orders = struct_field_orders;
    this.extern_values = extern_values;
    this.mut_methods = mut_methods;
    this.fn_mut_params = fn_mut_params;
  }
}

function TypeDef_StructDef_(_0) {
  return { _tag: "StructDef_", _0 };
}
function TypeDef_EnumDef_(_0) {
  return { _tag: "EnumDef_", _0 };
}

function extract_exports(module_key, module_prefix, program, hprogram, env, fn_mut_params_map) {
  let values = map_new();
  let types = map_new();
  let effects = map_new();
  let effect_aliases = map_new();
  let traits = map_new();
  let impl_methods = map_new();
  let inherent_methods = map_new();
  let struct_field_orders = map_new();
  let extern_values = set_new();
  let mut_methods = map_new();
  let fn_mut_params = map_new();
  const __ring_iter_2 = __List_Iterable.iter(program.decls);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const decl = __ring_next_2._0;
    __ring_match6: {
      const __ring_m6 = decl;
      if (__ring_m6._tag === "Fn") {
        const name = __ring_m6.name; const is_pub = __ring_m6.is_pub;
        if (is_pub) {
          __ring_match7: {
            const __ring_m7 = env$TypeEnv_lookup(env, name);
            if (__ring_m7._tag === "some") {
              const scheme = __ring_m7._0;
              _Map_insert(values, name, scheme);
              break __ring_match7;
            }
            if (__ring_m7._tag === "none") {
              break __ring_match7;
            }
            __match_fail(__ring_m7);
          }
          __ring_match8: {
            const __ring_m8 = _Map_get(fn_mut_params_map, name);
            if (__ring_m8._tag === "some") {
              const flags = __ring_m8._0;
              _Map_insert(fn_mut_params, name, flags);
              break __ring_match8;
            }
            if (__ring_m8._tag === "none") {
              break __ring_match8;
            }
            __match_fail(__ring_m8);
          }
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "Struct") {
        const name = __ring_m6.name; const is_pub = __ring_m6.is_pub;
        if (is_pub) {
          __ring_match9: {
            const __ring_m9 = _Map_get(env.types.structs, name);
            if (__ring_m9._tag === "some") {
              const sdef = __ring_m9._0;
              _Map_insert(types, name, TypeDef_StructDef_(sdef));
              let field_names = [];
              const __ring_iter_3 = __List_Iterable.iter(sdef.fields);
              while (true) {
                const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
                if (__ring_next_3._tag === "none") break;
                const f = __ring_next_3._0;
                List_push(field_names, f.name);
              }
              _Map_insert(struct_field_orders, name, field_names);
              break __ring_match9;
            }
            if (__ring_m9._tag === "none") {
              break __ring_match9;
            }
            __match_fail(__ring_m9);
          }
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "Enum") {
        const name = __ring_m6.name; const is_pub = __ring_m6.is_pub;
        if (is_pub) {
          __ring_match10: {
            const __ring_m10 = _Map_get(env.types.enums, name);
            if (__ring_m10._tag === "some") {
              const edef = __ring_m10._0;
              _Map_insert(types, name, TypeDef_EnumDef_(edef));
              const __ring_iter_4 = __List_Iterable.iter(edef.variants);
              while (true) {
                const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
                if (__ring_next_4._tag === "none") break;
                const v = __ring_next_4._0;
                __ring_match11: {
                  const __ring_m11 = env$TypeEnv_lookup(env, v.name);
                  if (__ring_m11._tag === "some") {
                    const vscheme = __ring_m11._0;
                    _Map_insert(values, v.name, vscheme);
                    break __ring_match11;
                  }
                  if (__ring_m11._tag === "none") {
                    break __ring_match11;
                  }
                  __match_fail(__ring_m11);
                }
              }
              break __ring_match10;
            }
            if (__ring_m10._tag === "none") {
              break __ring_match10;
            }
            __match_fail(__ring_m10);
          }
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "Effect") {
        const name = __ring_m6.name; const is_pub = __ring_m6.is_pub;
        if (is_pub) {
          __ring_match12: {
            const __ring_m12 = _Map_get(env.types.effects, name);
            if (__ring_m12._tag === "some") {
              const effdef = __ring_m12._0;
              _Map_insert(effects, name, effdef);
              break __ring_match12;
            }
            if (__ring_m12._tag === "none") {
              break __ring_match12;
            }
            __match_fail(__ring_m12);
          }
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "EffectAlias") {
        const name = __ring_m6.name; const is_pub = __ring_m6.is_pub;
        if (is_pub) {
          __ring_match13: {
            const __ring_m13 = _Map_get(env.types.effect_aliases, name);
            if (__ring_m13._tag === "some") {
              const adef = __ring_m13._0;
              _Map_insert(effect_aliases, name, adef);
              break __ring_match13;
            }
            if (__ring_m13._tag === "none") {
              break __ring_match13;
            }
            __match_fail(__ring_m13);
          }
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "Trait") {
        const name = __ring_m6.name; const is_pub = __ring_m6.is_pub;
        if (is_pub) {
          __ring_match14: {
            const __ring_m14 = _Map_get(env.trait_reg.traits, name);
            if (__ring_m14._tag === "some") {
              const tdef = __ring_m14._0;
              _Map_insert(traits, name, tdef);
              break __ring_match14;
            }
            if (__ring_m14._tag === "none") {
              break __ring_match14;
            }
            __match_fail(__ring_m14);
          }
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "Impl") {
        const target_type = __ring_m6.target_type; const trait_name = __ring_m6.trait_name; const methods = __ring_m6.methods;
        __ring_match15: {
          const __ring_m15 = _Map_get(env.trait_reg.impl_methods, target_type);
          if (__ring_m15._tag === "some") {
            const methods_map = __ring_m15._0;
            _Map_insert(impl_methods, target_type, map_clone(methods_map));
            break __ring_match15;
          }
          if (__ring_m15._tag === "none") {
            break __ring_match15;
          }
          __match_fail(__ring_m15);
        }
        __ring_match16: {
          const __ring_m16 = _Map_get(env.trait_reg.mut_methods, target_type);
          if (__ring_m16._tag === "some") {
            const ms = __ring_m16._0;
            _Map_insert(mut_methods, target_type, ms);
            break __ring_match16;
          }
          if (__ring_m16._tag === "none") {
            break __ring_match16;
          }
          __match_fail(__ring_m16);
        }
        const __ring_iter_5 = __List_Iterable.iter(methods);
        while (true) {
          const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
          if (__ring_next_5._tag === "none") break;
          const m = __ring_next_5._0;
          __ring_match17: {
            const __ring_m17 = m;
            if (__ring_m17._tag === "Fn") {
              const mname = __ring_m17.name;
              const full_name = `${target_type}_${mname}`;
              __ring_match18: {
                const __ring_m18 = _Map_get(fn_mut_params_map, full_name);
                if (__ring_m18._tag === "some") {
                  const flags = __ring_m18._0;
                  _Map_insert(fn_mut_params, full_name, flags);
                  break __ring_match18;
                }
                if (__ring_m18._tag === "none") {
                  break __ring_match18;
                }
                __match_fail(__ring_m18);
              }
              break __ring_match17;
            }
            break __ring_match17;
          }
        }
        __ring_match19: {
          const __ring_m19 = trait_name;
          if (__ring_m19._tag === "none") {
            let is_pub_type = false;
            const __ring_iter_6 = __List_Iterable.iter(program.decls);
            while (true) {
              const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
              if (__ring_next_6._tag === "none") break;
              const d = __ring_next_6._0;
              __ring_match20: {
                const __ring_m20 = d;
                if (__ring_m20._tag === "Struct") {
                  const name = __ring_m20.name; const is_pub = __ring_m20.is_pub;
                  if (((name === target_type) ? is_pub : false)) {
                    is_pub_type = true;
                  }
                  break __ring_match20;
                }
                if (__ring_m20._tag === "Enum") {
                  const name = __ring_m20.name; const is_pub = __ring_m20.is_pub;
                  if (((name === target_type) ? is_pub : false)) {
                    is_pub_type = true;
                  }
                  break __ring_match20;
                }
                break __ring_match20;
              }
            }
            if (is_pub_type) {
              let method_names = [];
              const __ring_iter_7 = __List_Iterable.iter(methods);
              while (true) {
                const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
                if (__ring_next_7._tag === "none") break;
                const m = __ring_next_7._0;
                __ring_match21: {
                  const __ring_m21 = m;
                  if (__ring_m21._tag === "Fn") {
                    const name = __ring_m21.name;
                    List_push(method_names, name);
                    break __ring_match21;
                  }
                  break __ring_match21;
                }
              }
              __ring_match22: {
                const __ring_m22 = _Map_get(inherent_methods, target_type);
                if (__ring_m22._tag === "some") {
                  const existing = __ring_m22._0;
                  List_extend(existing, method_names);
                  break __ring_match22;
                }
                if (__ring_m22._tag === "none") {
                  _Map_insert(inherent_methods, target_type, method_names);
                  break __ring_match22;
                }
                __match_fail(__ring_m22);
              }
            }
            break __ring_match19;
          }
          if (__ring_m19._tag === "some") {
            break __ring_match19;
          }
          __match_fail(__ring_m19);
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "ExternFn") {
        const name = __ring_m6.name; const is_pub = __ring_m6.is_pub;
        if (is_pub) {
          _Set_insert(extern_values, name);
          __ring_match23: {
            const __ring_m23 = env$TypeEnv_lookup(env, name);
            if (__ring_m23._tag === "some") {
              const scheme = __ring_m23._0;
              _Map_insert(values, name, scheme);
              break __ring_match23;
            }
            if (__ring_m23._tag === "none") {
              break __ring_match23;
            }
            __match_fail(__ring_m23);
          }
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "ExternType") {
        const name = __ring_m6.name; const is_pub = __ring_m6.is_pub;
        if (is_pub) {
          __ring_match24: {
            const __ring_m24 = _Map_get(env.types.structs, name);
            if (__ring_m24._tag === "some") {
              const sdef = __ring_m24._0;
              _Map_insert(types, name, TypeDef_StructDef_(sdef));
              break __ring_match24;
            }
            if (__ring_m24._tag === "none") {
              break __ring_match24;
            }
            __match_fail(__ring_m24);
          }
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "Const") {
        const name = __ring_m6.name; const is_pub = __ring_m6.is_pub;
        if (is_pub) {
          __ring_match25: {
            const __ring_m25 = env$TypeEnv_lookup(env, name);
            if (__ring_m25._tag === "some") {
              const scheme = __ring_m25._0;
              _Map_insert(values, name, scheme);
              break __ring_match25;
            }
            if (__ring_m25._tag === "none") {
              break __ring_match25;
            }
            __match_fail(__ring_m25);
          }
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "ModBlock") {
        const mod_name = __ring_m6.name; const mod_decls = __ring_m6.decls; const mpub = __ring_m6.is_pub;
        if (mpub) {
          const __ring_iter_8 = __List_Iterable.iter(mod_decls);
          while (true) {
            const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
            if (__ring_next_8._tag === "none") break;
            const subdecl = __ring_next_8._0;
            const prefixed = infer_register$prefix_decl_name(mod_name, subdecl);
            __ring_match26: {
              const __ring_m26 = prefixed;
              if (__ring_m26._tag === "Fn") {
                const fname = __ring_m26.name; const fpub = __ring_m26.is_pub;
                if (fpub) {
                  __ring_match27: {
                    const __ring_m27 = env$TypeEnv_lookup(env, fname);
                    if (__ring_m27._tag === "some") {
                      const scheme = __ring_m27._0;
                      _Map_insert(values, fname, scheme);
                      break __ring_match27;
                    }
                    if (__ring_m27._tag === "none") {
                      break __ring_match27;
                    }
                    __match_fail(__ring_m27);
                  }
                  __ring_match28: {
                    const __ring_m28 = _Map_get(fn_mut_params_map, fname);
                    if (__ring_m28._tag === "some") {
                      const flags = __ring_m28._0;
                      _Map_insert(fn_mut_params, fname, flags);
                      break __ring_match28;
                    }
                    if (__ring_m28._tag === "none") {
                      break __ring_match28;
                    }
                    __match_fail(__ring_m28);
                  }
                }
                break __ring_match26;
              }
              if (__ring_m26._tag === "Struct") {
                const sname = __ring_m26.name; const spub = __ring_m26.is_pub;
                if (spub) {
                  __ring_match29: {
                    const __ring_m29 = _Map_get(env.types.structs, sname);
                    if (__ring_m29._tag === "some") {
                      const sdef = __ring_m29._0;
                      _Map_insert(types, sname, TypeDef_StructDef_(sdef));
                      let field_names = [];
                      const __ring_iter_9 = __List_Iterable.iter(sdef.fields);
                      while (true) {
                        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
                        if (__ring_next_9._tag === "none") break;
                        const f = __ring_next_9._0;
                        List_push(field_names, f.name);
                      }
                      _Map_insert(struct_field_orders, sname, field_names);
                      break __ring_match29;
                    }
                    if (__ring_m29._tag === "none") {
                      break __ring_match29;
                    }
                    __match_fail(__ring_m29);
                  }
                }
                break __ring_match26;
              }
              if (__ring_m26._tag === "Enum") {
                const ename = __ring_m26.name; const epub = __ring_m26.is_pub;
                if (epub) {
                  __ring_match30: {
                    const __ring_m30 = _Map_get(env.types.enums, ename);
                    if (__ring_m30._tag === "some") {
                      const edef = __ring_m30._0;
                      _Map_insert(types, ename, TypeDef_EnumDef_(edef));
                      const __ring_iter_10 = __List_Iterable.iter(edef.variants);
                      while (true) {
                        const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
                        if (__ring_next_10._tag === "none") break;
                        const v = __ring_next_10._0;
                        __ring_match31: {
                          const __ring_m31 = env$TypeEnv_lookup(env, v.name);
                          if (__ring_m31._tag === "some") {
                            const vscheme = __ring_m31._0;
                            _Map_insert(values, v.name, vscheme);
                            break __ring_match31;
                          }
                          if (__ring_m31._tag === "none") {
                            break __ring_match31;
                          }
                          __match_fail(__ring_m31);
                        }
                      }
                      break __ring_match30;
                    }
                    if (__ring_m30._tag === "none") {
                      break __ring_match30;
                    }
                    __match_fail(__ring_m30);
                  }
                }
                break __ring_match26;
              }
              if (__ring_m26._tag === "Const") {
                const cname = __ring_m26.name; const cpub = __ring_m26.is_pub;
                if (cpub) {
                  __ring_match32: {
                    const __ring_m32 = env$TypeEnv_lookup(env, cname);
                    if (__ring_m32._tag === "some") {
                      const scheme = __ring_m32._0;
                      _Map_insert(values, cname, scheme);
                      break __ring_match32;
                    }
                    if (__ring_m32._tag === "none") {
                      break __ring_match32;
                    }
                    __match_fail(__ring_m32);
                  }
                }
                break __ring_match26;
              }
              if (__ring_m26._tag === "Effect") {
                const eff_name = __ring_m26.name; const eff_pub = __ring_m26.is_pub;
                if (eff_pub) {
                  __ring_match33: {
                    const __ring_m33 = _Map_get(env.types.effects, eff_name);
                    if (__ring_m33._tag === "some") {
                      const effdef = __ring_m33._0;
                      _Map_insert(effects, eff_name, effdef);
                      break __ring_match33;
                    }
                    if (__ring_m33._tag === "none") {
                      break __ring_match33;
                    }
                    __match_fail(__ring_m33);
                  }
                }
                break __ring_match26;
              }
              if (__ring_m26._tag === "EffectAlias") {
                const ea_name = __ring_m26.name; const ea_pub = __ring_m26.is_pub;
                if (ea_pub) {
                  __ring_match34: {
                    const __ring_m34 = _Map_get(env.types.effect_aliases, ea_name);
                    if (__ring_m34._tag === "some") {
                      const adef = __ring_m34._0;
                      _Map_insert(effect_aliases, ea_name, adef);
                      break __ring_match34;
                    }
                    if (__ring_m34._tag === "none") {
                      break __ring_match34;
                    }
                    __match_fail(__ring_m34);
                  }
                }
                break __ring_match26;
              }
              if (__ring_m26._tag === "Trait") {
                const t_name = __ring_m26.name; const t_pub = __ring_m26.is_pub;
                if (t_pub) {
                  __ring_match35: {
                    const __ring_m35 = _Map_get(env.trait_reg.traits, t_name);
                    if (__ring_m35._tag === "some") {
                      const tdef = __ring_m35._0;
                      _Map_insert(traits, t_name, tdef);
                      break __ring_match35;
                    }
                    if (__ring_m35._tag === "none") {
                      break __ring_match35;
                    }
                    __match_fail(__ring_m35);
                  }
                }
                break __ring_match26;
              }
              if (__ring_m26._tag === "Impl") {
                const tt = __ring_m26.target_type; const tn = __ring_m26.trait_name; const ms = __ring_m26.methods;
                __ring_match36: {
                  const __ring_m36 = _Map_get(env.trait_reg.impl_methods, tt);
                  if (__ring_m36._tag === "some") {
                    const methods_map = __ring_m36._0;
                    _Map_insert(impl_methods, tt, map_clone(methods_map));
                    break __ring_match36;
                  }
                  if (__ring_m36._tag === "none") {
                    break __ring_match36;
                  }
                  __match_fail(__ring_m36);
                }
                __ring_match37: {
                  const __ring_m37 = _Map_get(env.trait_reg.mut_methods, tt);
                  if (__ring_m37._tag === "some") {
                    const ms2 = __ring_m37._0;
                    _Map_insert(mut_methods, tt, ms2);
                    break __ring_match37;
                  }
                  if (__ring_m37._tag === "none") {
                    break __ring_match37;
                  }
                  __match_fail(__ring_m37);
                }
                const __ring_iter_11 = __List_Iterable.iter(ms);
                while (true) {
                  const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
                  if (__ring_next_11._tag === "none") break;
                  const m = __ring_next_11._0;
                  __ring_match38: {
                    const __ring_m38 = m;
                    if (__ring_m38._tag === "Fn") {
                      const mn = __ring_m38.name;
                      const full = `${tt}_${mn}`;
                      __ring_match39: {
                        const __ring_m39 = _Map_get(fn_mut_params_map, full);
                        if (__ring_m39._tag === "some") {
                          const flags = __ring_m39._0;
                          _Map_insert(fn_mut_params, full, flags);
                          break __ring_match39;
                        }
                        if (__ring_m39._tag === "none") {
                          break __ring_match39;
                        }
                        __match_fail(__ring_m39);
                      }
                      break __ring_match38;
                    }
                    break __ring_match38;
                  }
                }
                break __ring_match26;
              }
              if (__ring_m26._tag === "ModBlock") {
                const sub_mod_name = __ring_m26.name; const sub_mod_decls = __ring_m26.decls; const sub_mpub = __ring_m26.is_pub;
                if (sub_mpub) {
                  const __ring_iter_12 = __List_Iterable.iter(sub_mod_decls);
                  while (true) {
                    const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
                    if (__ring_next_12._tag === "none") break;
                    const sub_subdecl = __ring_next_12._0;
                    const sub_prefixed = infer_register$prefix_decl_name(sub_mod_name, sub_subdecl);
                    __ring_match40: {
                      const __ring_m40 = sub_prefixed;
                      if (__ring_m40._tag === "Fn") {
                        const fname2 = __ring_m40.name; const fpub2 = __ring_m40.is_pub;
                        if (fpub2) {
                          __ring_match41: {
                            const __ring_m41 = env$TypeEnv_lookup(env, fname2);
                            if (__ring_m41._tag === "some") {
                              const scheme = __ring_m41._0;
                              _Map_insert(values, fname2, scheme);
                              break __ring_match41;
                            }
                            if (__ring_m41._tag === "none") {
                              break __ring_match41;
                            }
                            __match_fail(__ring_m41);
                          }
                          __ring_match42: {
                            const __ring_m42 = _Map_get(fn_mut_params_map, fname2);
                            if (__ring_m42._tag === "some") {
                              const flags = __ring_m42._0;
                              _Map_insert(fn_mut_params, fname2, flags);
                              break __ring_match42;
                            }
                            if (__ring_m42._tag === "none") {
                              break __ring_match42;
                            }
                            __match_fail(__ring_m42);
                          }
                        }
                        break __ring_match40;
                      }
                      if (__ring_m40._tag === "Struct") {
                        const sname2 = __ring_m40.name; const spub2 = __ring_m40.is_pub;
                        if (spub2) {
                          __ring_match43: {
                            const __ring_m43 = _Map_get(env.types.structs, sname2);
                            if (__ring_m43._tag === "some") {
                              const sdef = __ring_m43._0;
                              _Map_insert(types, sname2, TypeDef_StructDef_(sdef));
                              let fns2 = [];
                              const __ring_iter_13 = __List_Iterable.iter(sdef.fields);
                              while (true) {
                                const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
                                if (__ring_next_13._tag === "none") break;
                                const f = __ring_next_13._0;
                                List_push(fns2, f.name);
                              }
                              _Map_insert(struct_field_orders, sname2, fns2);
                              break __ring_match43;
                            }
                            if (__ring_m43._tag === "none") {
                              break __ring_match43;
                            }
                            __match_fail(__ring_m43);
                          }
                        }
                        break __ring_match40;
                      }
                      if (__ring_m40._tag === "Enum") {
                        const ename2 = __ring_m40.name; const epub2 = __ring_m40.is_pub;
                        if (epub2) {
                          __ring_match44: {
                            const __ring_m44 = _Map_get(env.types.enums, ename2);
                            if (__ring_m44._tag === "some") {
                              const edef = __ring_m44._0;
                              _Map_insert(types, ename2, TypeDef_EnumDef_(edef));
                              const __ring_iter_14 = __List_Iterable.iter(edef.variants);
                              while (true) {
                                const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
                                if (__ring_next_14._tag === "none") break;
                                const v = __ring_next_14._0;
                                __ring_match45: {
                                  const __ring_m45 = env$TypeEnv_lookup(env, v.name);
                                  if (__ring_m45._tag === "some") {
                                    const vscheme = __ring_m45._0;
                                    _Map_insert(values, v.name, vscheme);
                                    break __ring_match45;
                                  }
                                  if (__ring_m45._tag === "none") {
                                    break __ring_match45;
                                  }
                                  __match_fail(__ring_m45);
                                }
                              }
                              break __ring_match44;
                            }
                            if (__ring_m44._tag === "none") {
                              break __ring_match44;
                            }
                            __match_fail(__ring_m44);
                          }
                        }
                        break __ring_match40;
                      }
                      if (__ring_m40._tag === "Const") {
                        const cname2 = __ring_m40.name; const cpub2 = __ring_m40.is_pub;
                        if (cpub2) {
                          __ring_match46: {
                            const __ring_m46 = env$TypeEnv_lookup(env, cname2);
                            if (__ring_m46._tag === "some") {
                              const scheme = __ring_m46._0;
                              _Map_insert(values, cname2, scheme);
                              break __ring_match46;
                            }
                            if (__ring_m46._tag === "none") {
                              break __ring_match46;
                            }
                            __match_fail(__ring_m46);
                          }
                        }
                        break __ring_match40;
                      }
                      if (__ring_m40._tag === "Effect") {
                        const eff_name2 = __ring_m40.name; const eff_pub2 = __ring_m40.is_pub;
                        if (eff_pub2) {
                          __ring_match47: {
                            const __ring_m47 = _Map_get(env.types.effects, eff_name2);
                            if (__ring_m47._tag === "some") {
                              const effdef = __ring_m47._0;
                              _Map_insert(effects, eff_name2, effdef);
                              break __ring_match47;
                            }
                            if (__ring_m47._tag === "none") {
                              break __ring_match47;
                            }
                            __match_fail(__ring_m47);
                          }
                        }
                        break __ring_match40;
                      }
                      if (__ring_m40._tag === "EffectAlias") {
                        const ea_name2 = __ring_m40.name; const ea_pub2 = __ring_m40.is_pub;
                        if (ea_pub2) {
                          __ring_match48: {
                            const __ring_m48 = _Map_get(env.types.effect_aliases, ea_name2);
                            if (__ring_m48._tag === "some") {
                              const adef = __ring_m48._0;
                              _Map_insert(effect_aliases, ea_name2, adef);
                              break __ring_match48;
                            }
                            if (__ring_m48._tag === "none") {
                              break __ring_match48;
                            }
                            __match_fail(__ring_m48);
                          }
                        }
                        break __ring_match40;
                      }
                      if (__ring_m40._tag === "Trait") {
                        const t_name2 = __ring_m40.name; const t_pub2 = __ring_m40.is_pub;
                        if (t_pub2) {
                          __ring_match49: {
                            const __ring_m49 = _Map_get(env.trait_reg.traits, t_name2);
                            if (__ring_m49._tag === "some") {
                              const tdef = __ring_m49._0;
                              _Map_insert(traits, t_name2, tdef);
                              break __ring_match49;
                            }
                            if (__ring_m49._tag === "none") {
                              break __ring_match49;
                            }
                            __match_fail(__ring_m49);
                          }
                        }
                        break __ring_match40;
                      }
                      if (__ring_m40._tag === "Impl") {
                        const tt2 = __ring_m40.target_type; const tn2 = __ring_m40.trait_name; const ms2 = __ring_m40.methods;
                        __ring_match50: {
                          const __ring_m50 = _Map_get(env.trait_reg.impl_methods, tt2);
                          if (__ring_m50._tag === "some") {
                            const methods_map = __ring_m50._0;
                            _Map_insert(impl_methods, tt2, map_clone(methods_map));
                            break __ring_match50;
                          }
                          if (__ring_m50._tag === "none") {
                            break __ring_match50;
                          }
                          __match_fail(__ring_m50);
                        }
                        __ring_match51: {
                          const __ring_m51 = _Map_get(env.trait_reg.mut_methods, tt2);
                          if (__ring_m51._tag === "some") {
                            const ms3 = __ring_m51._0;
                            _Map_insert(mut_methods, tt2, ms3);
                            break __ring_match51;
                          }
                          if (__ring_m51._tag === "none") {
                            break __ring_match51;
                          }
                          __match_fail(__ring_m51);
                        }
                        const __ring_iter_15 = __List_Iterable.iter(ms2);
                        while (true) {
                          const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
                          if (__ring_next_15._tag === "none") break;
                          const m = __ring_next_15._0;
                          __ring_match52: {
                            const __ring_m52 = m;
                            if (__ring_m52._tag === "Fn") {
                              const mn2 = __ring_m52.name;
                              const full2 = `${tt2}_${mn2}`;
                              __ring_match53: {
                                const __ring_m53 = _Map_get(fn_mut_params_map, full2);
                                if (__ring_m53._tag === "some") {
                                  const flags = __ring_m53._0;
                                  _Map_insert(fn_mut_params, full2, flags);
                                  break __ring_match53;
                                }
                                if (__ring_m53._tag === "none") {
                                  break __ring_match53;
                                }
                                __match_fail(__ring_m53);
                              }
                              break __ring_match52;
                            }
                            break __ring_match52;
                          }
                        }
                        break __ring_match40;
                      }
                      break __ring_match40;
                    }
                  }
                }
                break __ring_match26;
              }
              break __ring_match26;
            }
          }
        }
        break __ring_match6;
      }
      break __ring_match6;
    }
  }
  let trait_impls = [];
  let sorted_trait_impls = _Map_entries(env.trait_reg.trait_impls);
  sorted_trait_impls.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_16 = __List_Iterable.iter(sorted_trait_impls);
  while (true) {
    const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
    if (__ring_next_16._tag === "none") break;
    const map_entry = __ring_next_16._0;
    const __ring_dt0 = map_entry;
    const impl_list = __ring_dt0[1];
    const __ring_iter_17 = __List_Iterable.iter(impl_list);
    while (true) {
      const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
      if (__ring_next_17._tag === "none") break;
      const impl_ = __ring_next_17._0;
      if ((_Map_contains_key(types, impl_.target_type_name) ? true : _Map_contains_key(traits, impl_.trait_name))) {
        List_push(trait_impls, impl_);
      }
    }
  }
  const __ring_iter_18 = __List_Iterable.iter(program.uses);
  while (true) {
    const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
    if (__ring_next_18._tag === "none") break;
    const use_decl = __ring_next_18._0;
    if (use_decl.is_pub) {
      __ring_match54: {
        const __ring_m54 = use_decl.imports;
        if (__ring_m54._tag === "NamedItems") {
          const names = __ring_m54.names;
          const __ring_iter_19 = __List_Iterable.iter(names);
          while (true) {
            const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
            if (__ring_next_19._tag === "none") break;
            const item = __ring_next_19._0;
            let __ring_blk0;
            __ring_match55: {
              const __ring_m55 = item.alias;
              if (__ring_m55._tag === "some") {
                const a = __ring_m55._0;
                __ring_blk0 = a;
                break __ring_match55;
              }
              if (__ring_m55._tag === "none") {
                __ring_blk0 = item.name;
                break __ring_match55;
              }
              __match_fail(__ring_m55);
            }
            const local_name = __ring_blk0;
            __ring_match56: {
              const __ring_m56 = env$TypeEnv_lookup(env, local_name);
              if (__ring_m56._tag === "some") {
                const scheme = __ring_m56._0;
                _Map_insert(values, local_name, scheme);
                break __ring_match56;
              }
              if (__ring_m56._tag === "none") {
                break __ring_match56;
              }
              __match_fail(__ring_m56);
            }
            __ring_match57: {
              const __ring_m57 = _Map_get(env.types.structs, local_name);
              if (__ring_m57._tag === "some") {
                const sdef = __ring_m57._0;
                _Map_insert(types, local_name, TypeDef_StructDef_(sdef));
                let fnames = [];
                const __ring_iter_20 = __List_Iterable.iter(sdef.fields);
                while (true) {
                  const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
                  if (__ring_next_20._tag === "none") break;
                  const f = __ring_next_20._0;
                  List_push(fnames, f.name);
                }
                _Map_insert(struct_field_orders, local_name, fnames);
                break __ring_match57;
              }
              if (__ring_m57._tag === "none") {
                break __ring_match57;
              }
              __match_fail(__ring_m57);
            }
            __ring_match58: {
              const __ring_m58 = _Map_get(env.types.enums, local_name);
              if (__ring_m58._tag === "some") {
                const edef = __ring_m58._0;
                _Map_insert(types, local_name, TypeDef_EnumDef_(edef));
                break __ring_match58;
              }
              if (__ring_m58._tag === "none") {
                break __ring_match58;
              }
              __match_fail(__ring_m58);
            }
            __ring_match59: {
              const __ring_m59 = _Map_get(env.types.effects, local_name);
              if (__ring_m59._tag === "some") {
                const effdef = __ring_m59._0;
                _Map_insert(effects, local_name, effdef);
                break __ring_match59;
              }
              if (__ring_m59._tag === "none") {
                break __ring_match59;
              }
              __match_fail(__ring_m59);
            }
            __ring_match60: {
              const __ring_m60 = _Map_get(env.trait_reg.traits, local_name);
              if (__ring_m60._tag === "some") {
                const tdef = __ring_m60._0;
                _Map_insert(traits, local_name, tdef);
                break __ring_match60;
              }
              if (__ring_m60._tag === "none") {
                break __ring_match60;
              }
              __match_fail(__ring_m60);
            }
          }
          break __ring_match54;
        }
        break __ring_match54;
      }
    }
  }
  return new ModuleExports(module_key, module_prefix, values, types, effects, effect_aliases, traits, trait_impls, impl_methods, inherent_methods, struct_field_orders, extern_values, mut_methods, fn_mut_params);
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


export { ModuleExports, TypeDef_StructDef_, TypeDef_EnumDef_, extract_exports };