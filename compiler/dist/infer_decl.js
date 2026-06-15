import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { add_impl as env$add_impl, apply_subst as env$apply_subst, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_map as env$apply_subst_map, apply_subst_row as env$apply_subst_row, apply_subst_row_map as env$apply_subst_row_map, find_impl as env$find_impl, has_impl as env$has_impl, lookup_variant as env$lookup_variant, mono as env$mono, new_type_env as env$new_type_env, AssocConstraintEntry as env$AssocConstraintEntry, AssocTypeDef as env$AssocTypeDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectAliasDef as env$EffectAliasDef, EffectDef as env$EffectDef, EffectOpDef as env$EffectOpDef, EnumDef as env$EnumDef, FnBound as env$FnBound, IdGen as env$IdGen, ImplEntry as env$ImplEntry, SchemeBound as env$SchemeBound, Scope as env$Scope, ScopeManager as env$ScopeManager, SigDef as env$SigDef, StructDef as env$StructDef, TraitDef as env$TraitDef, TraitMethodDef as env$TraitMethodDef, TraitRegistry as env$TraitRegistry, TypeAliasDef as env$TypeAliasDef, TypeEnv as env$TypeEnv, TypeRegistry as env$TypeRegistry, TypeScheme as env$TypeScheme, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __BuiltInKind_Debug as env$__BuiltInKind_Debug, __FnBound_Eq as env$__FnBound_Eq, __FnBound_Clone as env$__FnBound_Clone, __FnBound_Ord as env$__FnBound_Ord, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Eq as env$__IdGen_Eq, __IdGen_Clone as env$__IdGen_Clone, __IdGen_Ord as env$__IdGen_Ord, __IdGen_Debug as env$__IdGen_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { empty_subst as unify$empty_subst, occurs_in as unify$occurs_in, unify as unify$unify, unify_effect_params as unify$unify_effect_params, unify_effect_rows as unify$unify_effect_rows, UnificationError as unify$UnificationError, __UnificationError_Eq as unify$__UnificationError_Eq, __UnificationError_Clone as unify$__UnificationError_Clone, __UnificationError_Ord as unify$__UnificationError_Ord, __UnificationError_Debug as unify$__UnificationError_Debug } from "./unify.js";
import { make_diag as diagnostics$make_diag, make_diagnostic as diagnostics$make_diagnostic, new_collecting_sink as diagnostics$new_collecting_sink, severity_to_str as diagnostics$severity_to_str, CollectingSink as diagnostics$CollectingSink, Diagnostic as diagnostics$Diagnostic, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, DiagnosticNote as diagnostics$DiagnosticNote, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, Suggestion as diagnostics$Suggestion, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Severity_Eq as diagnostics$__Severity_Eq, __Severity_Clone as diagnostics$__Severity_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __Severity_Debug as diagnostics$__Severity_Debug, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Suggestion_Debug as diagnostics$__Suggestion_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0105 as codes$E0105, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0405 as codes$E0405, E0406 as codes$E0406, E0407 as codes$E0407, E0408 as codes$E0408, E0409 as codes$E0409, E0410 as codes$E0410, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0504 as codes$E0504, E0505 as codes$E0505, E0506 as codes$E0506, E0507 as codes$E0507, E0508 as codes$E0508, E0509 as codes$E0509, E0510 as codes$E0510, E0511 as codes$E0511, E0512 as codes$E0512, E0513 as codes$E0513, E0514 as codes$E0514, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, W0001 as codes$W0001, W0002 as codes$W0002, error_category as codes$error_category, error_description as codes$error_description } from "./codes.js";
import { bind_pattern as infer_ctx$bind_pattern, build_scheme_var_map as infer_ctx$build_scheme_var_map, collect_free_vars as infer_ctx$collect_free_vars, free_type_vars as infer_ctx$free_type_vars, free_type_vars_in_env as infer_ctx$free_type_vars_in_env, generalize as infer_ctx$generalize, merge_effects as infer_ctx$merge_effects, new_infer_ctx as infer_ctx$new_infer_ctx, remove_fail_effect as infer_ctx$remove_fail_effect, resolve_dicts_from_scheme as infer_ctx$resolve_dicts_from_scheme, resolve_named_type as infer_ctx$resolve_named_type, resolve_relative_qualifier as infer_ctx$resolve_relative_qualifier, resolve_self_type as infer_ctx$resolve_self_type, resolve_type_expr as infer_ctx$resolve_type_expr, type_error as infer_ctx$type_error, type_error_with_notes as infer_ctx$type_error_with_notes, unify_at as infer_ctx$unify_at, unify_at_noted as infer_ctx$unify_at_noted, update_fn_effects as infer_ctx$update_fn_effects, CompileError as infer_ctx$CompileError, FnBoundsEntry as infer_ctx$FnBoundsEntry, InferCtx as infer_ctx$InferCtx, InferResult as infer_ctx$InferResult, __CompileError_Eq as infer_ctx$__CompileError_Eq, __CompileError_Clone as infer_ctx$__CompileError_Clone, __CompileError_Ord as infer_ctx$__CompileError_Ord, __CompileError_Debug as infer_ctx$__CompileError_Debug, __FnBoundsEntry_Eq as infer_ctx$__FnBoundsEntry_Eq, __FnBoundsEntry_Clone as infer_ctx$__FnBoundsEntry_Clone, __FnBoundsEntry_Ord as infer_ctx$__FnBoundsEntry_Ord, __FnBoundsEntry_Debug as infer_ctx$__FnBoundsEntry_Debug } from "./infer_ctx.js";
import { collect_all_supertraits as infer_register$collect_all_supertraits, inject_assoc_types_from_bounds as infer_register$inject_assoc_types_from_bounds, insert_mod_aliases as infer_register$insert_mod_aliases, prefix_decl_name as infer_register$prefix_decl_name, register_decl_public as infer_register$register_decl_public, register_decls_two_phase as infer_register$register_decls_two_phase, resolve_declared_effects as infer_register$resolve_declared_effects, resolve_effect_expr as infer_register$resolve_effect_expr } from "./infer_register.js";
import { infer_block as infer$infer_block, infer_expr as infer$infer_expr, infer_stmt as infer$infer_stmt } from "./infer.js";
import { zonk_block as zonk$zonk_block, zonk_expr as zonk$zonk_expr, zonk_param as zonk$zonk_param, zonk_row as zonk$zonk_row, zonk_type as zonk$zonk_type, ZonkCtx as zonk$ZonkCtx } from "./zonk.js";
import { run_derive_pass as derive$run_derive_pass } from "./derive.js";
import { build_call_graph as scc$build_call_graph, collect_registered_fn_names as scc$collect_registered_fn_names, tarjan_scc as scc$tarjan_scc } from "./scc.js";



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

class FnBodyResult {
  constructor(params, ret, eff, body) {
    this.params = params;
    this.ret = ret;
    this.eff = eff;
    this.body = body;
  }
}

function map_effect_row(row, mapping) {
  if ((_Map_len(mapping) === 0)) {
    return row;
  }
  let mapped_effects = [];
  const __ring_iter_2 = __List_Iterable.iter(row.effects);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const eff = __ring_next_2._0;
    __ring_match6: {
      const __ring_m6 = eff;
      if (__ring_m6._tag === "FailEffect") {
        const error_type = __ring_m6.error_type;
        List_push(mapped_effects, types$Effect_FailEffect(apply_var_mapping(error_type, mapping)));
        break __ring_match6;
      }
      if (__ring_m6._tag === "MutEffect") {
        const state_type = __ring_m6.state_type;
        List_push(mapped_effects, types$Effect_MutEffect(apply_var_mapping(state_type, mapping)));
        break __ring_match6;
      }
      if (__ring_m6._tag === "CustomEffect") {
        const name = __ring_m6.name; const type_args = __ring_m6.type_args;
        let mapped_args = [];
        const __ring_iter_3 = __List_Iterable.iter(type_args);
        while (true) {
          const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
          if (__ring_next_3._tag === "none") break;
          const a = __ring_next_3._0;
          List_push(mapped_args, apply_var_mapping(a, mapping));
        }
        List_push(mapped_effects, types$Effect_CustomEffect(name, mapped_args));
        break __ring_match6;
      }
      if (__ring_m6._tag === "IoEffect") {
        List_push(mapped_effects, eff);
        break __ring_match6;
      }
      __match_fail(__ring_m6);
    }
  }
  return new types$EffectRow(mapped_effects, row.tail);
}

function apply_var_mapping(ty, mapping) {
  __ring_match7: {
    const __ring_m7 = ty;
    if (__ring_m7._tag === "TypeVar") {
      const id = __ring_m7.id;
      __ring_match8: {
        const __ring_m8 = _Map_get(mapping, id);
        if (__ring_m8._tag === "some") {
          const mapped = __ring_m8._0;
          return mapped;
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          return ty;
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "FnType") {
      const params = __ring_m7.params; const return_type = __ring_m7.return_type; const effects = __ring_m7.effects;
      let mapped_params = [];
      const __ring_iter_4 = __List_Iterable.iter(params);
      while (true) {
        const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
        if (__ring_next_4._tag === "none") break;
        const p = __ring_next_4._0;
        List_push(mapped_params, apply_var_mapping(p, mapping));
      }
      return types$Type_FnType(mapped_params, apply_var_mapping(return_type, mapping), map_effect_row(effects, mapping));
      break __ring_match7;
    }
    if (__ring_m7._tag === "StructType") {
      const name = __ring_m7.name; const type_params = __ring_m7.type_params; const fields = __ring_m7.fields;
      let mapped_tps = [];
      const __ring_iter_5 = __List_Iterable.iter(type_params);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const tp = __ring_next_5._0;
        List_push(mapped_tps, apply_var_mapping(tp, mapping));
      }
      return types$Type_StructType(name, mapped_tps, fields);
      break __ring_match7;
    }
    if (__ring_m7._tag === "EnumType") {
      const name = __ring_m7.name; const type_params = __ring_m7.type_params; const variants = __ring_m7.variants;
      let mapped_tps = [];
      const __ring_iter_6 = __List_Iterable.iter(type_params);
      while (true) {
        const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
        if (__ring_next_6._tag === "none") break;
        const tp = __ring_next_6._0;
        List_push(mapped_tps, apply_var_mapping(tp, mapping));
      }
      return types$Type_EnumType(name, mapped_tps, variants);
      break __ring_match7;
    }
    if (__ring_m7._tag === "TupleType") {
      const elements = __ring_m7.elements;
      let mapped_els = [];
      const __ring_iter_7 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
        if (__ring_next_7._tag === "none") break;
        const e = __ring_next_7._0;
        List_push(mapped_els, apply_var_mapping(e, mapping));
      }
      return types$Type_TupleType(mapped_els);
      break __ring_match7;
    }
    if (__ring_m7._tag === "GenericType") {
      const base = __ring_m7.base; const args = __ring_m7.args;
      let mapped_args = [];
      const __ring_iter_8 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
        if (__ring_next_8._tag === "none") break;
        const a = __ring_next_8._0;
        List_push(mapped_args, apply_var_mapping(a, mapping));
      }
      return types$Type_GenericType(apply_var_mapping(base, mapping), mapped_args);
      break __ring_match7;
    }
    return ty;
    break __ring_match7;
  }
}

function build_var_mapping(check_ty, reg_ty, mapping) {
  __ring_match9: {
    const __ring_m9 = [check_ty, reg_ty];
    if (Array.isArray(__ring_m9) && __ring_m9.length === 2 && __ring_m9[0]._tag === "TypeVar") {
      const check_id = __ring_m9[0].id;
      if ((!_Map_contains_key(mapping, check_id))) {
        return _Map_insert(mapping, check_id, reg_ty);
      }
      break __ring_match9;
    }
    if (Array.isArray(__ring_m9) && __ring_m9.length === 2 && __ring_m9[0]._tag === "FnType" && __ring_m9[1]._tag === "FnType") {
      const cp = __ring_m9[0].params; const cr = __ring_m9[0].return_type; const rp = __ring_m9[1].params; const rr = __ring_m9[1].return_type;
      let i = 0;
      const __ring_iter_9 = __List_Iterable.iter(cp);
      while (true) {
        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
        if (__ring_next_9._tag === "none") break;
        const c = __ring_next_9._0;
        __ring_match10: {
          const __ring_m10 = List_get(rp, i);
          if (__ring_m10._tag === "some") {
            const r = __ring_m10._0;
            build_var_mapping(c, r, mapping);
            break __ring_match10;
          }
          if (__ring_m10._tag === "none") {
            break __ring_match10;
          }
          __match_fail(__ring_m10);
        }
        i = (i + 1);
      }
      return build_var_mapping(cr, rr, mapping);
      break __ring_match9;
    }
    if (Array.isArray(__ring_m9) && __ring_m9.length === 2 && __ring_m9[0]._tag === "StructType" && __ring_m9[1]._tag === "StructType") {
      const ct = __ring_m9[0].type_params; const rt = __ring_m9[1].type_params;
      let i = 0;
      const __ring_iter_10 = __List_Iterable.iter(ct);
      while (true) {
        const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
        if (__ring_next_10._tag === "none") break;
        const c = __ring_next_10._0;
        __ring_match11: {
          const __ring_m11 = List_get(rt, i);
          if (__ring_m11._tag === "some") {
            const r = __ring_m11._0;
            build_var_mapping(c, r, mapping);
            break __ring_match11;
          }
          if (__ring_m11._tag === "none") {
            break __ring_match11;
          }
          __match_fail(__ring_m11);
        }
        i = (i + 1);
      }
      break __ring_match9;
    }
    if (Array.isArray(__ring_m9) && __ring_m9.length === 2 && __ring_m9[0]._tag === "EnumType" && __ring_m9[1]._tag === "EnumType") {
      const ct = __ring_m9[0].type_params; const rt = __ring_m9[1].type_params;
      let i = 0;
      const __ring_iter_11 = __List_Iterable.iter(ct);
      while (true) {
        const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
        if (__ring_next_11._tag === "none") break;
        const c = __ring_next_11._0;
        __ring_match12: {
          const __ring_m12 = List_get(rt, i);
          if (__ring_m12._tag === "some") {
            const r = __ring_m12._0;
            build_var_mapping(c, r, mapping);
            break __ring_match12;
          }
          if (__ring_m12._tag === "none") {
            break __ring_match12;
          }
          __match_fail(__ring_m12);
        }
        i = (i + 1);
      }
      break __ring_match9;
    }
    if (Array.isArray(__ring_m9) && __ring_m9.length === 2 && __ring_m9[0]._tag === "TupleType" && __ring_m9[1]._tag === "TupleType") {
      const ce = __ring_m9[0].elements; const re = __ring_m9[1].elements;
      let i = 0;
      const __ring_iter_12 = __List_Iterable.iter(ce);
      while (true) {
        const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
        if (__ring_next_12._tag === "none") break;
        const c = __ring_next_12._0;
        __ring_match13: {
          const __ring_m13 = List_get(re, i);
          if (__ring_m13._tag === "some") {
            const r = __ring_m13._0;
            build_var_mapping(c, r, mapping);
            break __ring_match13;
          }
          if (__ring_m13._tag === "none") {
            break __ring_match13;
          }
          __match_fail(__ring_m13);
        }
        i = (i + 1);
      }
      break __ring_match9;
    }
    break __ring_match9;
  }
}

function check_extern_fn_decl(ctx, name, type_params, params, declared_effects, is_pub, span, __ring_ev_fail) {
  const scheme = (function() {
  const __ring_m = env$TypeEnv_lookup(ctx.env, name);
  if (__ring_m._tag === "some") { const s = __ring_m._0; return s; }
  if (__ring_m._tag === "none") { return (function() {
  const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `extern fn not found: ${name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`extern fn '${name}' was not registered`)));
  return __ring_ev_fail.raise(new infer_ctx$CompileError());
})(); }
  __match_fail(__ring_m);
})();
  const fn_params = (function() {
  const __ring_m = scheme.ty;
  if (__ring_m._tag === "FnType") { const fps = __ring_m.params; return fps; }
  return [];
})();
  const fn_ret = (function() {
  const __ring_m = scheme.ty;
  if (__ring_m._tag === "FnType") { const return_type = __ring_m.return_type; return return_type; }
  return types$UNIT;
})();
  let hparams = [];
  let i = 0;
  const __ring_iter_13 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
    if (__ring_next_13._tag === "none") break;
    const p = __ring_next_13._0;
    const ptype = (function() {
  const __ring_m = List_get(fn_params, i);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return types$UNIT; }
  __match_fail(__ring_m);
})();
    List_push(hparams, new hir$HParam(p.name, ptype, Option_none, false));
    i = (i + 1);
  }
  const extern_effects = (function() {
  const __ring_m = declared_effects;
  if (__ring_m._tag === "some") { const de = __ring_m._0; return infer_register$resolve_declared_effects(ctx, de); }
  if (__ring_m._tag === "none") { return types$EMPTY_ROW; }
  __match_fail(__ring_m);
})();
  return hir$HDecl_ExternFn(name, scheme.def_id, type_params, hparams, fn_ret, extern_effects, is_pub, span);
}

function is_value_type(t) {
  __ring_match14: {
    const __ring_m14 = t;
    if (__ring_m14._tag === "IntType") {
      return true;
      break __ring_match14;
    }
    if (__ring_m14._tag === "FloatType") {
      return true;
      break __ring_match14;
    }
    if (__ring_m14._tag === "BoolType") {
      return true;
      break __ring_match14;
    }
    if (__ring_m14._tag === "StrType") {
      return true;
      break __ring_match14;
    }
    return false;
    break __ring_match14;
  }
}

function check_fn_body(ctx, type_params, hparams, expected_ret, body, saved_tp_scope, span, __ring_ev_fail) {
  const body_result = infer$infer_block(ctx, body, Option_some(ctx.subst), __ring_ev_fail);
  ctx.subst = body_result.subst;
  const fn_body_notes = [new diagnostics$DiagnosticNote(`function return type is declared as '${types$type_to_string(env$apply_subst(ctx.subst, expected_ret))}'`, Option_some(span)), new diagnostics$DiagnosticNote(`function body evaluates to '${types$type_to_string(env$apply_subst(ctx.subst, hir$hexpr_type(body_result.hexpr)))}'`, Option_some(hir$hexpr_span(body_result.hexpr)))];
  ctx.subst = infer_ctx$unify_at_noted(ctx.sink, ctx.env, hir$hexpr_type(body_result.hexpr), expected_ret, ctx.subst, span, fn_body_notes);
  let local_names = map_new();
  const __ring_iter_14 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
    if (__ring_next_14._tag === "none") break;
    const tp = __ring_next_14._0;
    __ring_match15: {
      const __ring_m15 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m15._tag === "some") {
        const tv = __ring_m15._0;
        __ring_match16: {
          const __ring_m16 = tv;
          if (__ring_m16._tag === "TypeVar") {
            const resolved = env$apply_subst(ctx.subst, tv);
            __ring_match17: {
              const __ring_m17 = resolved;
              if (__ring_m17._tag === "TypeVar") {
                const rid = __ring_m17.id;
                _Map_insert(local_names, rid, tp.name);
                break __ring_match17;
              }
              break __ring_match17;
            }
            break __ring_match16;
          }
          break __ring_match16;
        }
        break __ring_match15;
      }
      if (__ring_m15._tag === "none") {
        break __ring_match15;
      }
      __match_fail(__ring_m15);
    }
  }
  let declared_names = set_new();
  const __ring_iter_15 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
    if (__ring_next_15._tag === "none") break;
    const tp = __ring_next_15._0;
    _Set_insert(declared_names, tp.name);
  }
  let sorted_tp_scope2 = _Map_entries(ctx.type_param_scope);
  sorted_tp_scope2.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_16 = __List_Iterable.iter(sorted_tp_scope2);
  while (true) {
    const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
    if (__ring_next_16._tag === "none") break;
    const entry = __ring_next_16._0;
    const __ring_dt0 = entry;
    const tpname = __ring_dt0[0];
    const tv = __ring_dt0[1];
    if (((!_Map_contains_key(saved_tp_scope, tpname)) ? (!_Set_contains(declared_names, tpname, __Str_Eq)) : false)) {
      __ring_match18: {
        const __ring_m18 = tv;
        if (__ring_m18._tag === "TypeVar") {
          const resolved = env$apply_subst(ctx.subst, tv);
          __ring_match19: {
            const __ring_m19 = resolved;
            if (__ring_m19._tag === "TypeVar") {
              const rid = __ring_m19.id;
              _Map_insert(local_names, rid, tpname);
              break __ring_match19;
            }
            break __ring_match19;
          }
          break __ring_match18;
        }
        break __ring_match18;
      }
    }
  }
  let seen_traits = set_new();
  const __ring_iter_17 = __List_Iterable.iter(ctx.current_fn_bounds);
  while (true) {
    const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
    if (__ring_next_17._tag === "none") break;
    const fb = __ring_next_17._0;
    if (_Set_contains(seen_traits, fb.trait_name, __Str_Eq)) {
      continue;
    }
    _Set_insert(seen_traits, fb.trait_name);
    __ring_match20: {
      const __ring_m20 = _Map_get(ctx.env.trait_reg.traits, fb.trait_name);
      if (__ring_m20._tag === "some") {
        const tdef = __ring_m20._0;
        const __ring_iter_18 = __List_Iterable.iter(tdef.assoc_types);
        while (true) {
          const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
          if (__ring_next_18._tag === "none") break;
          const atdef = __ring_next_18._0;
          if ((!_Map_contains_key(local_names, atdef.var_id))) {
            const resolved = env$apply_subst(ctx.subst, types$Type_TypeVar(atdef.var_id, Option_none));
            __ring_match21: {
              const __ring_m21 = resolved;
              if (__ring_m21._tag === "TypeVar") {
                const rid = __ring_m21.id;
                _Map_insert(local_names, rid, atdef.name);
                break __ring_match21;
              }
              break __ring_match21;
            }
          }
        }
        break __ring_match20;
      }
      if (__ring_m20._tag === "none") {
        break __ring_match20;
      }
      __match_fail(__ring_m20);
    }
  }
  const zctx = new zonk$ZonkCtx(ctx.subst, local_names);
  let final_params = [];
  const __ring_iter_19 = __List_Iterable.iter(hparams);
  while (true) {
    const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
    if (__ring_next_19._tag === "none") break;
    const hp = __ring_next_19._0;
    List_push(final_params, zonk$zonk_param(zctx, hp));
  }
  const final_ret = zonk$zonk_type(zctx, expected_ret);
  const eff = zonk$zonk_row(zctx, body_result.effects);
  const final_body = zonk$zonk_block(zctx, body_result.hexpr);
  return new FnBodyResult(final_params, final_ret, eff, final_body);
}

function check_fn_decl(ctx, name, type_params, params, return_type, declared_effects, body, is_pub, span, self_type, __ring_ev_fail) {
  const saved_subst = ctx.subst;
  ctx.subst = unify$empty_subst();
  env$TypeEnv_push_scope(ctx.env);
  const saved_tp_scope = map_clone(ctx.type_param_scope);
  const saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope);
  const __ring_iter_20 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
    if (__ring_next_20._tag === "none") break;
    const tp = __ring_next_20._0;
    const tv = env$TypeEnv_fresh_var(ctx.env);
    _Map_insert(ctx.type_param_scope, tp.name, tv);
    env$TypeEnv_bind_mono(ctx.env, tp.name, tv);
  }
  List_push(ctx.fn_bounds_stack, ctx.current_fn_bounds);
  let inherited_bounds = [];
  const __ring_iter_21 = __List_Iterable.iter(ctx.current_fn_bounds);
  while (true) {
    const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
    if (__ring_next_21._tag === "none") break;
    const ib = __ring_next_21._0;
    List_push(inherited_bounds, ib);
  }
  ctx.current_fn_bounds = inherited_bounds;
  const __ring_iter_22 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
    if (__ring_next_22._tag === "none") break;
    const tp = __ring_next_22._0;
    __ring_match22: {
      const __ring_m22 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m22._tag === "some") {
        const tv = __ring_m22._0;
        __ring_match23: {
          const __ring_m23 = tv;
          if (__ring_m23._tag === "TypeVar") {
            const id = __ring_m23.id;
            const __ring_iter_23 = __List_Iterable.iter(tp.bounds);
            while (true) {
              const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
              if (__ring_next_23._tag === "none") break;
              const bound = __ring_next_23._0;
              List_push(ctx.current_fn_bounds, new infer_ctx$FnBoundsEntry(id, bound.trait_name, tp.name));
              const supers = infer_register$collect_all_supertraits(ctx, bound.trait_name);
              const __ring_iter_24 = __List_Iterable.iter(supers);
              while (true) {
                const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
                if (__ring_next_24._tag === "none") break;
                const st_name = __ring_next_24._0;
                List_push(ctx.current_fn_bounds, new infer_ctx$FnBoundsEntry(id, st_name, tp.name));
              }
            }
            break __ring_match23;
          }
          break __ring_match23;
        }
        break __ring_match22;
      }
      if (__ring_m22._tag === "none") {
        break __ring_match22;
      }
      __match_fail(__ring_m22);
    }
  }
  infer_register$inject_assoc_types_from_bounds(ctx, type_params);
  let hparams = [];
  const __ring_iter_25 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
    if (__ring_next_25._tag === "none") break;
    const p = __ring_next_25._0;
    const ptype = (function() {
  const __ring_m = p.type_annotation;
  if (__ring_m._tag === "some") { const ta = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, ta); }
  if (__ring_m._tag === "none") { return ((p.name === "self") ? (function() {
  const __ring_m = self_type;
  if (__ring_m._tag === "some") { const st = __ring_m._0; return st; }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})() : env$TypeEnv_fresh_var(ctx.env)); }
  __match_fail(__ring_m);
})();
    env$TypeEnv_bind_mono(ctx.env, p.name, ptype);
    const param_scheme = env$TypeEnv_lookup(ctx.env, p.name);
    __ring_match24: {
      const __ring_m24 = param_scheme;
      if (__ring_m24._tag === "some") {
        const ps = __ring_m24._0;
        __ring_match25: {
          const __ring_m25 = ps.def_id;
          if (__ring_m25._tag === "some") {
            const did = __ring_m25._0;
            env$TypeEnv_record_def_span(ctx.env, did, p.span);
            _Map_insert(ctx.var_lambda_depth, did, ctx.lambda_depth);
            if (p.is_mutable) {
              _Set_insert(ctx.env.scope.mutable_vars, did);
              _Set_insert(ctx.env.scope.mut_param_defs, did);
              if ((p.name !== "self")) {
                const resolved_pt = env$apply_subst(ctx.subst, ptype);
                if (is_value_type(resolved_pt)) {
                  _Set_insert(ctx.boxed_vars, did);
                }
              }
            } else {
              _Set_insert(ctx.env.scope.let_defs, did);
            }
            break __ring_match25;
          }
          if (__ring_m25._tag === "none") {
            break __ring_match25;
          }
          __match_fail(__ring_m25);
        }
        List_push(hparams, new hir$HParam(p.name, ptype, ps.def_id, p.is_mutable));
        break __ring_match24;
      }
      if (__ring_m24._tag === "none") {
        List_push(hparams, new hir$HParam(p.name, ptype, Option_none, p.is_mutable));
        break __ring_match24;
      }
      __match_fail(__ring_m24);
    }
  }
  const saved_fn_return = ctx.current_fn_return_type;
  const expected_ret = (function() {
  const __ring_m = return_type;
  if (__ring_m._tag === "some") { const rt = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, rt); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})();
  ctx.current_fn_return_type = Option_some(expected_ret);
  const try_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_fn_body(ctx, type_params, hparams, expected_ret, body, saved_tp_scope, span, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  const complete_fn_bounds = ctx.current_fn_bounds;
  ctx.current_fn_return_type = saved_fn_return;
  env$TypeEnv_pop_scope(ctx.env);
  ctx.type_param_scope = saved_tp_scope;
  ctx.qualified_assoc_scope = saved_qualified_assoc;
  ctx.current_fn_bounds = (function() {
  const __ring_m = List_pop(ctx.fn_bounds_stack);
  if (__ring_m._tag === "some") { const prev = __ring_m._0; return prev; }
  if (__ring_m._tag === "none") { return []; }
  __match_fail(__ring_m);
})();
  ctx.subst = saved_subst;
  const fn_result = (function() {
  const __ring_m = try_result;
  if (__ring_m._tag === "some") { const r = __ring_m._0; return r; }
  if (__ring_m._tag === "none") { return __ring_ev_fail.raise(new infer_ctx$CompileError()); }
  __match_fail(__ring_m);
})();
  const final_params = fn_result.params;
  const final_ret = fn_result.ret;
  const inferred_effects = fn_result.eff;
  const final_body = fn_result.body;
  const final_effects = (function() {
  const __ring_m = declared_effects;
  if (__ring_m._tag === "some") { const de = __ring_m._0; return (function() {
  const declared_row = infer_register$resolve_declared_effects(ctx, de);
  const __ring_iter_26 = __List_Iterable.iter(inferred_effects.effects);
  while (true) {
    const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
    if (__ring_next_26._tag === "none") break;
    const inferred_eff = __ring_next_26._0;
    let found = false;
    const __ring_iter_27 = __List_Iterable.iter(declared_row.effects);
    while (true) {
      const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
      if (__ring_next_27._tag === "none") break;
      const declared_eff = __ring_next_27._0;
      if (types$effects_match_kind(inferred_eff, declared_eff)) {
        found = true;
        __ring_match26: {
          const __ring_m26 = [inferred_eff, declared_eff];
          if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "FailEffect" && __ring_m26[1]._tag === "FailEffect") {
            const ie = __ring_m26[0].error_type; const de = __ring_m26[1].error_type;
            ctx.subst = infer_ctx$unify_at(ctx.sink, ctx.env, ie, de, ctx.subst, span);
            break __ring_match26;
          }
          if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "MutEffect" && __ring_m26[1]._tag === "MutEffect") {
            const is = __ring_m26[0].state_type; const ds = __ring_m26[1].state_type;
            ctx.subst = infer_ctx$unify_at(ctx.sink, ctx.env, is, ds, ctx.subst, span);
            break __ring_match26;
          }
          if (Array.isArray(__ring_m26) && __ring_m26.length === 2 && __ring_m26[0]._tag === "CustomEffect" && __ring_m26[1]._tag === "CustomEffect") {
            const ia = __ring_m26[0].type_args; const da = __ring_m26[1].type_args;
            let i = 0;
            while (((i < List_len(ia)) ? (i < List_len(da)) : false)) {
              ctx.subst = infer_ctx$unify_at(ctx.sink, ctx.env, Option_unwrap_or(List_get(ia, i), types$UNIT), Option_unwrap_or(List_get(da, i), types$UNIT), ctx.subst, span);
              i = (i + 1);
            }
            break __ring_match26;
          }
          break __ring_match26;
        }
      }
    }
    if ((!found)) {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0404, `Function '${name}' has undeclared effect: ${types$effect_to_string(inferred_eff)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("effect annotation violation")));
    }
  }
  return declared_row;
})(); }
  if (__ring_m._tag === "none") { return inferred_effects; }
  __match_fail(__ring_m);
})();
  if ((name === "main")) {
    const __ring_iter_28 = __List_Iterable.iter(final_effects.effects);
    while (true) {
      const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
      if (__ring_next_28._tag === "none") break;
      const eff = __ring_next_28._0;
      __ring_match27: {
        const __ring_m27 = eff;
        if (__ring_m27._tag === "CustomEffect") {
          const eff_name = __ring_m27.name;
          let skip = false;
          __ring_match28: {
            const __ring_m28 = _Map_get(ctx.env.types.effects, eff_name);
            if (__ring_m28._tag === "some") {
              const edef = __ring_m28._0;
              if (edef.all_have_defaults) {
                skip = true;
              }
              break __ring_match28;
            }
            if (__ring_m28._tag === "none") {
              break __ring_match28;
            }
            __match_fail(__ring_m28);
          }
          if ((!skip)) {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0403, `Unhandled effect '${eff_name}' in main function; custom effects must be handled before reaching main`, span, diagnostics$DiagnosticContext_EffectUnhandled(eff_name, Option_some("main")));
          }
          break __ring_match27;
        }
        break __ring_match27;
      }
    }
  }
  let trait_bounds = [];
  const __ring_iter_29 = __List_Iterable.iter(complete_fn_bounds);
  while (true) {
    const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
    if (__ring_next_29._tag === "none") break;
    const fb = __ring_next_29._0;
    List_push(trait_bounds, new hir$TraitBound(fb.type_param_name, fb.trait_name));
  }
  const fn_scheme = env$TypeEnv_lookup(ctx.env, name);
  const fn_def_id = (function() {
  const __ring_m = fn_scheme;
  if (__ring_m._tag === "some") { const s = __ring_m._0; return s.def_id; }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
  __ring_match29: {
    const __ring_m29 = fn_def_id;
    if (__ring_m29._tag === "some") {
      const did = __ring_m29._0;
      env$TypeEnv_record_def_span(ctx.env, did, span);
      break __ring_match29;
    }
    if (__ring_m29._tag === "none") {
      break __ring_match29;
    }
    __match_fail(__ring_m29);
  }
  let mut_flags = [];
  let fi = 0;
  const __ring_iter_30 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_30 = __ListIterator_Iterator.next(__ring_iter_30);
    if (__ring_next_30._tag === "none") break;
    const p = __ring_next_30._0;
    if (((p.name === "self") ? true : (!p.is_mutable))) {
      List_push(mut_flags, false);
    } else {
      __ring_match30: {
        const __ring_m30 = List_get(final_params, fi);
        if (__ring_m30._tag === "some") {
          const fp = __ring_m30._0;
          List_push(mut_flags, is_value_type(fp.ty));
          break __ring_match30;
        }
        if (__ring_m30._tag === "none") {
          List_push(mut_flags, false);
          break __ring_match30;
        }
        __match_fail(__ring_m30);
      }
    }
    fi = (fi + 1);
  }
  _Map_insert(ctx.fn_mut_params, name, mut_flags);
  return hir$HDecl_Fn(name, fn_def_id, type_params, final_params, final_ret, final_effects, final_body, is_pub, trait_bounds, span);
}

function update_impl_method_effects(ctx, target_type, method_name, effects) {
  __ring_match31: {
    const __ring_m31 = _Map_get(ctx.env.trait_reg.impl_methods, target_type);
    if (__ring_m31._tag === "some") {
      const methods_map = __ring_m31._0;
      __ring_match32: {
        const __ring_m32 = _Map_get(methods_map, method_name);
        if (__ring_m32._tag === "some") {
          const scheme = __ring_m32._0;
          __ring_match33: {
            const __ring_m33 = scheme.ty;
            if (__ring_m33._tag === "FnType") {
              const params = __ring_m33.params; const return_type = __ring_m33.return_type;
              const updated_ty = types$Type_FnType(params, return_type, effects);
              return _Map_insert(methods_map, method_name, new env$TypeScheme(updated_ty, scheme.type_vars, scheme.bounds, scheme.def_id));
              break __ring_match33;
            }
            break __ring_match33;
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
    if (__ring_m31._tag === "none") {
      break __ring_match31;
    }
    __match_fail(__ring_m31);
  }
}

function check_impl_decl(ctx, target_type, type_params, trait_name, methods, span, __ring_ev_fail) {
  const saved_tp_scope = map_clone(ctx.type_param_scope);
  const saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope);
  const __ring_iter_31 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
    if (__ring_next_31._tag === "none") break;
    const tp = __ring_next_31._0;
    const tv = env$TypeEnv_fresh_var(ctx.env);
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  const impl_self_type = ((List_len(type_params) > 0) ? (function() {
  let impl_tp_types = [];
  const __ring_iter_32 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_32 = __ListIterator_Iterator.next(__ring_iter_32);
    if (__ring_next_32._tag === "none") break;
    const tp = __ring_next_32._0;
    __ring_match34: {
      const __ring_m34 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m34._tag === "some") {
        const tv = __ring_m34._0;
        List_push(impl_tp_types, tv);
        break __ring_match34;
      }
      if (__ring_m34._tag === "none") {
        List_push(impl_tp_types, env$TypeEnv_fresh_var(ctx.env));
        break __ring_match34;
      }
      __match_fail(__ring_m34);
    }
  }
  __ring_match35: {
    const __ring_m35 = _Map_get(ctx.env.types.structs, target_type);
    if (__ring_m35._tag === "some") {
      const def = __ring_m35._0;
      return types$Type_StructType(def.name, impl_tp_types, def.fields);
      break __ring_match35;
    }
    if (__ring_m35._tag === "none") {
      __ring_match36: {
        const __ring_m36 = _Map_get(ctx.env.types.enums, target_type);
        if (__ring_m36._tag === "some") {
          const def = __ring_m36._0;
          return types$Type_EnumType(def.name, impl_tp_types, def.variants);
          break __ring_match36;
        }
        if (__ring_m36._tag === "none") {
          return infer_ctx$resolve_self_type(ctx, target_type);
          break __ring_match36;
        }
        __match_fail(__ring_m36);
      }
      break __ring_match35;
    }
    __match_fail(__ring_m35);
  }
})() : infer_ctx$resolve_self_type(ctx, target_type));
  _Map_insert(ctx.type_param_scope, "Self", impl_self_type);
  const saved_impl_bounds = ctx.current_fn_bounds;
  let impl_bounds = [];
  const __ring_iter_33 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
    if (__ring_next_33._tag === "none") break;
    const tp = __ring_next_33._0;
    __ring_match37: {
      const __ring_m37 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m37._tag === "some") {
        const tv = __ring_m37._0;
        __ring_match38: {
          const __ring_m38 = tv;
          if (__ring_m38._tag === "TypeVar") {
            const id = __ring_m38.id;
            const __ring_iter_34 = __List_Iterable.iter(tp.bounds);
            while (true) {
              const __ring_next_34 = __ListIterator_Iterator.next(__ring_iter_34);
              if (__ring_next_34._tag === "none") break;
              const bound = __ring_next_34._0;
              List_push(impl_bounds, new infer_ctx$FnBoundsEntry(id, bound.trait_name, tp.name));
              const supers = infer_register$collect_all_supertraits(ctx, bound.trait_name);
              const __ring_iter_35 = __List_Iterable.iter(supers);
              while (true) {
                const __ring_next_35 = __ListIterator_Iterator.next(__ring_iter_35);
                if (__ring_next_35._tag === "none") break;
                const st_name = __ring_next_35._0;
                List_push(impl_bounds, new infer_ctx$FnBoundsEntry(id, st_name, tp.name));
              }
            }
            break __ring_match38;
          }
          break __ring_match38;
        }
        break __ring_match37;
      }
      if (__ring_m37._tag === "none") {
        break __ring_match37;
      }
      __match_fail(__ring_m37);
    }
  }
  ctx.current_fn_bounds = impl_bounds;
  let hassoc_types = [];
  const __ring_iter_36 = __List_Iterable.iter(methods);
  while (true) {
    const __ring_next_36 = __ListIterator_Iterator.next(__ring_iter_36);
    if (__ring_next_36._tag === "none") break;
    const method = __ring_next_36._0;
    __ring_match39: {
      const __ring_m39 = method;
      if (__ring_m39._tag === "AssocType") {
        const aname = __ring_m39.name; const abounds = __ring_m39.bounds; const avalue = __ring_m39.value;
        let bound_names = [];
        const __ring_iter_37 = __List_Iterable.iter(abounds);
        while (true) {
          const __ring_next_37 = __ListIterator_Iterator.next(__ring_iter_37);
          if (__ring_next_37._tag === "none") break;
          const b = __ring_next_37._0;
          List_push(bound_names, b.trait_name);
        }
        const concrete = (function() {
  const __ring_m = avalue;
  if (__ring_m._tag === "some") { const v = __ring_m._0; return Option_some(infer_ctx$resolve_type_expr(ctx, v)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
        List_push(hassoc_types, new hir$HAssocType(aname, bound_names, concrete));
        __ring_match40: {
          const __ring_m40 = concrete;
          if (__ring_m40._tag === "some") {
            const ct = __ring_m40._0;
            _Map_insert(ctx.type_param_scope, aname, ct);
            _Map_insert(ctx.qualified_assoc_scope, `Self::${aname}`, ct);
            break __ring_match40;
          }
          if (__ring_m40._tag === "none") {
            break __ring_match40;
          }
          __match_fail(__ring_m40);
        }
        break __ring_match39;
      }
      break __ring_match39;
    }
  }
  let hmethods = [];
  const __ring_iter_38 = __List_Iterable.iter(methods);
  while (true) {
    const __ring_next_38 = __ListIterator_Iterator.next(__ring_iter_38);
    if (__ring_next_38._tag === "none") break;
    const method = __ring_next_38._0;
    __ring_match41: {
      const __ring_m41 = method;
      if (__ring_m41._tag === "ExternFn") {
        const name = __ring_m41.name; const mtps = __ring_m41.type_params; const params = __ring_m41.params; const return_type = __ring_m41.return_type; const declared_effects = __ring_m41.declared_effects; const is_pub = __ring_m41.is_pub; const mspan = __ring_m41.span;
        List_push(hmethods, check_extern_fn_decl(ctx, name, mtps, params, declared_effects, is_pub, mspan, __ring_ev_fail));
        break __ring_match41;
      }
      if (__ring_m41._tag === "Fn") {
        const name = __ring_m41.name; const mtps = __ring_m41.type_params; const params = __ring_m41.params; const return_type = __ring_m41.return_type; const declared_effects = __ring_m41.declared_effects; const body = __ring_m41.body; const is_pub = __ring_m41.is_pub; const mspan = __ring_m41.span;
        const hdecl = check_fn_decl(ctx, name, mtps, params, return_type, declared_effects, body, is_pub, mspan, Option_some(impl_self_type), __ring_ev_fail);
        List_push(hmethods, hdecl);
        __ring_match42: {
          const __ring_m42 = hdecl;
          if (__ring_m42._tag === "Fn") {
            const mname = __ring_m42.name; const inferred_effects = __ring_m42.effects;
            if ((List_len(inferred_effects.effects) > 0)) {
              update_impl_method_effects(ctx, target_type, mname, inferred_effects);
            }
            break __ring_match42;
          }
          break __ring_match42;
        }
        break __ring_match41;
      }
      if (__ring_m41._tag === "Delegate") {
        break __ring_match41;
      }
      if (__ring_m41._tag === "AssocType") {
        break __ring_match41;
      }
      break __ring_match41;
    }
  }
  ctx.current_fn_bounds = saved_impl_bounds;
  ctx.type_param_scope = saved_tp_scope;
  ctx.qualified_assoc_scope = saved_qualified_assoc;
  return hir$HDecl_Impl(target_type, type_params, trait_name, hmethods, hassoc_types, span);
}

function check_struct_decl(ctx, name, type_params, is_pub, span, __ring_ev_fail) {
  const def = (function() {
  const __ring_m = _Map_get(ctx.env.types.structs, name);
  if (__ring_m._tag === "some") { const d = __ring_m._0; return d; }
  if (__ring_m._tag === "none") { return (function() {
  const _ = infer_ctx$type_error(ctx.sink, codes$E0204, `struct not found: ${name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`struct '${name}' was not registered`)));
  return __ring_ev_fail.raise(new infer_ctx$CompileError());
})(); }
  __match_fail(__ring_m);
})();
  let hfields = [];
  const __ring_iter_39 = __List_Iterable.iter(def.fields);
  while (true) {
    const __ring_next_39 = __ListIterator_Iterator.next(__ring_iter_39);
    if (__ring_next_39._tag === "none") break;
    const f = __ring_next_39._0;
    List_push(hfields, new hir$HStructField(f.name, f.ty, f.is_pub));
  }
  return hir$HDecl_Struct(name, type_params, hfields, is_pub, span);
}

function check_enum_decl(ctx, name, type_params, is_pub, span, __ring_ev_fail) {
  const def = (function() {
  const __ring_m = _Map_get(ctx.env.types.enums, name);
  if (__ring_m._tag === "some") { const d = __ring_m._0; return d; }
  if (__ring_m._tag === "none") { return (function() {
  const _ = infer_ctx$type_error(ctx.sink, codes$E0204, `enum not found: ${name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`enum '${name}' was not registered`)));
  return __ring_ev_fail.raise(new infer_ctx$CompileError());
})(); }
  __match_fail(__ring_m);
})();
  let hvariants = [];
  const __ring_iter_40 = __List_Iterable.iter(def.variants);
  while (true) {
    const __ring_next_40 = __ListIterator_Iterator.next(__ring_iter_40);
    if (__ring_next_40._tag === "none") break;
    const v = __ring_next_40._0;
    List_push(hvariants, new hir$HEnumVariant(v.name, v.fields, v.field_names));
  }
  return hir$HDecl_Enum(name, type_params, hvariants, is_pub, span);
}

function check_effect_decl(ctx, name, type_params, ast_ops, is_pub, span, __ring_ev_fail) {
  const def = (function() {
  const __ring_m = _Map_get(ctx.env.types.effects, name);
  if (__ring_m._tag === "some") { const d = __ring_m._0; return d; }
  if (__ring_m._tag === "none") { return (function() {
  const _ = infer_ctx$type_error(ctx.sink, codes$E0402, `effect not found: ${name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`effect '${name}' was not registered`)));
  return __ring_ev_fail.raise(new infer_ctx$CompileError());
})(); }
  __match_fail(__ring_m);
})();
  let hops = [];
  let oi = 0;
  const __ring_iter_41 = __List_Iterable.iter(def.ops);
  while (true) {
    const __ring_next_41 = __ListIterator_Iterator.next(__ring_iter_41);
    if (__ring_next_41._tag === "none") break;
    const op = __ring_next_41._0;
    let op_params = [];
    let pi = 0;
    const __ring_iter_42 = __List_Iterable.iter(op.params);
    while (true) {
      const __ring_next_42 = __ListIterator_Iterator.next(__ring_iter_42);
      if (__ring_next_42._tag === "none") break;
      const pt = __ring_next_42._0;
      const p_name = (function() {
  const __ring_m = List_get(ast_ops, oi);
  if (__ring_m._tag === "some") { const ast_op = __ring_m._0; return (function() {
  const __ring_m = List_get(ast_op.params, pi);
  if (__ring_m._tag === "some") { const ap = __ring_m._0; return ap.name; }
  if (__ring_m._tag === "none") { return `p${Int_to_str(pi)}`; }
  __match_fail(__ring_m);
})(); }
  if (__ring_m._tag === "none") { return `p${Int_to_str(pi)}`; }
  __match_fail(__ring_m);
})();
      List_push(op_params, new hir$HParam(p_name, pt, Option_none, false));
      pi = (pi + 1);
    }
    const ast_op_opt = List_get(ast_ops, oi);
    let default_body = Option_none;
    __ring_match43: {
      const __ring_m43 = ast_op_opt;
      if (__ring_m43._tag === "some") {
        const ast_op = __ring_m43._0;
        __ring_match44: {
          const __ring_m44 = ast_op.body;
          if (__ring_m44._tag === "some") {
            const body_expr = __ring_m44._0;
            env$TypeEnv_push_scope(ctx.env);
            const __ring_iter_43 = __List_Iterable.iter(op_params);
            while (true) {
              const __ring_next_43 = __ListIterator_Iterator.next(__ring_iter_43);
              if (__ring_next_43._tag === "none") break;
              const p = __ring_next_43._0;
              env$TypeEnv_bind_mono(ctx.env, p.name, p.ty);
            }
            const body_result = infer$infer_block(ctx, body_expr, Option_none, __ring_ev_fail);
            ctx.subst = body_result.subst;
            const body_type = hir$hexpr_type(body_result.hexpr);
            ctx.subst = infer_ctx$unify_at(ctx.sink, ctx.env, body_type, op.return_type, ctx.subst, span);
            const zctx = new zonk$ZonkCtx(ctx.subst, map_new());
            default_body = Option_some(zonk$zonk_block(zctx, body_result.hexpr));
            env$TypeEnv_pop_scope(ctx.env);
            break __ring_match44;
          }
          if (__ring_m44._tag === "none") {
            break __ring_match44;
          }
          __match_fail(__ring_m44);
        }
        break __ring_match43;
      }
      if (__ring_m43._tag === "none") {
        break __ring_match43;
      }
      __match_fail(__ring_m43);
    }
    List_push(hops, new hir$HEffectOp(op.name, op_params, op.return_type, op.has_default, default_body));
    oi = (oi + 1);
  }
  let all_defaults = true;
  const __ring_iter_44 = __List_Iterable.iter(def.ops);
  while (true) {
    const __ring_next_44 = __ListIterator_Iterator.next(__ring_iter_44);
    if (__ring_next_44._tag === "none") break;
    const op = __ring_next_44._0;
    if ((!op.has_default)) {
      all_defaults = false;
    }
  }
  if ((all_defaults ? (List_len(def.ops) > 0) : false)) {
    let deps = [];
    let dep_set = set_new();
    const __ring_iter_45 = __List_Iterable.iter(hops);
    while (true) {
      const __ring_next_45 = __ListIterator_Iterator.next(__ring_iter_45);
      if (__ring_next_45._tag === "none") break;
      const hop = __ring_next_45._0;
      __ring_match45: {
        const __ring_m45 = hop.default_body;
        if (__ring_m45._tag === "some") {
          const body = __ring_m45._0;
          const body_effs = hir$hexpr_effects(body);
          const __ring_iter_46 = __List_Iterable.iter(body_effs.effects);
          while (true) {
            const __ring_next_46 = __ListIterator_Iterator.next(__ring_iter_46);
            if (__ring_next_46._tag === "none") break;
            const eff = __ring_next_46._0;
            const eff_name = types$effect_kind_name(eff);
            if (((((eff_name === "io") ? true : (eff_name === "fail")) ? true : (eff_name === "mut")) ? true : (eff_name === name))) {
              continue;
            }
            __ring_match46: {
              const __ring_m46 = _Map_get(ctx.env.types.effects, eff_name);
              if (__ring_m46._tag === "some") {
                const dep_def = __ring_m46._0;
                if ((!dep_def.all_have_defaults)) {
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0409, `Default handler body of effect '${name}' uses effect '${eff_name}' which has no default handler; all-default effects cannot depend on effects without defaults`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("default effect dependency violation")));
                } else {
                  if ((!_Set_contains(dep_set, eff_name, __Str_Eq))) {
                    _Set_insert(dep_set, eff_name);
                    List_push(deps, eff_name);
                  }
                }
                break __ring_match46;
              }
              if (__ring_m46._tag === "none") {
                break __ring_match46;
              }
              __match_fail(__ring_m46);
            }
          }
          break __ring_match45;
        }
        if (__ring_m45._tag === "none") {
          break __ring_match45;
        }
        __match_fail(__ring_m45);
      }
    }
    if ((List_len(deps) > 0)) {
      _Map_insert(ctx.effect_default_deps, name, deps);
    }
  }
  return hir$HDecl_Effect(name, type_params, hops, is_pub, span);
}

function check_test_decl(ctx, description, body, span, __ring_ev_fail) {
  const saved_subst = ctx.subst;
  ctx.subst = unify$empty_subst();
  env$TypeEnv_push_scope(ctx.env);
  const body_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer$infer_block(ctx, body, Option_none, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  env$TypeEnv_pop_scope(ctx.env);
  const final_body = (function() {
  const __ring_m = body_result;
  if (__ring_m._tag === "some") { const br = __ring_m._0; return (function() {
  ctx.subst = br.subst;
  const zctx = new zonk$ZonkCtx(ctx.subst, map_new());
  const result = zonk$zonk_block(zctx, br.hexpr);
  ctx.subst = saved_subst;
  return result;
})(); }
  if (__ring_m._tag === "none") { return (function() {
  ctx.subst = saved_subst;
  return __ring_ev_fail.raise(new infer_ctx$CompileError());
})(); }
  __match_fail(__ring_m);
})();
  return hir$HDecl_Test(description, final_body, span);
}

function find_ast_fn_by_name(methods, name) {
  return ((__a) => { const __i = __a.findIndex((function(d) { return (function() {
  const __ring_m = d;
  if (__ring_m._tag === "Fn") { const n = __ring_m.name; return (n === name); }
  return false;
})(); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(methods);
}

function check_trait_default_body(ctx, trait_name, self_var, hparams, body) {
  const saved_subst = ctx.subst;
  ctx.subst = unify$empty_subst();
  env$TypeEnv_push_scope(ctx.env);
  const saved_tp_scope = map_clone(ctx.type_param_scope);
  const saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope);
  List_push(ctx.fn_bounds_stack, ctx.current_fn_bounds);
  ctx.current_fn_bounds = [];
  __ring_match47: {
    const __ring_m47 = self_var;
    if (__ring_m47._tag === "TypeVar") {
      const id = __ring_m47.id;
      List_push(ctx.current_fn_bounds, new infer_ctx$FnBoundsEntry(id, trait_name, "self"));
      const supers = infer_register$collect_all_supertraits(ctx, trait_name);
      const __ring_iter_47 = __List_Iterable.iter(supers);
      while (true) {
        const __ring_next_47 = __ListIterator_Iterator.next(__ring_iter_47);
        if (__ring_next_47._tag === "none") break;
        const st_name = __ring_next_47._0;
        List_push(ctx.current_fn_bounds, new infer_ctx$FnBoundsEntry(id, st_name, "self"));
      }
      break __ring_match47;
    }
    break __ring_match47;
  }
  _Map_insert(ctx.type_param_scope, "Self", self_var);
  __ring_match48: {
    const __ring_m48 = _Map_get(ctx.env.trait_reg.traits, trait_name);
    if (__ring_m48._tag === "some") {
      const tdef = __ring_m48._0;
      const __ring_iter_48 = __List_Iterable.iter(tdef.assoc_types);
      while (true) {
        const __ring_next_48 = __ListIterator_Iterator.next(__ring_iter_48);
        if (__ring_next_48._tag === "none") break;
        const atdef = __ring_next_48._0;
        __ring_match49: {
          const __ring_m49 = _Map_get(ctx.type_param_scope, atdef.name);
          if (__ring_m49._tag === "some") {
            const at_ty = __ring_m49._0;
            _Map_insert(ctx.qualified_assoc_scope, `Self::${atdef.name}`, at_ty);
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
  const __ring_iter_49 = __List_Iterable.iter(hparams);
  while (true) {
    const __ring_next_49 = __ListIterator_Iterator.next(__ring_iter_49);
    if (__ring_next_49._tag === "none") break;
    const p = __ring_next_49._0;
    env$TypeEnv_bind_mono(ctx.env, p.name, p.ty);
    if (p.is_mutable) {
      __ring_match50: {
        const __ring_m50 = env$TypeEnv_lookup(ctx.env, p.name);
        if (__ring_m50._tag === "some") {
          const ps = __ring_m50._0;
          __ring_match51: {
            const __ring_m51 = ps.def_id;
            if (__ring_m51._tag === "some") {
              const did = __ring_m51._0;
              _Set_insert(ctx.env.scope.mutable_vars, did);
              break __ring_match51;
            }
            if (__ring_m51._tag === "none") {
              break __ring_match51;
            }
            __match_fail(__ring_m51);
          }
          break __ring_match50;
        }
        if (__ring_m50._tag === "none") {
          break __ring_match50;
        }
        __match_fail(__ring_m50);
      }
    }
  }
  const body_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer$infer_block(ctx, body, Option_none, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  env$TypeEnv_pop_scope(ctx.env);
  ctx.current_fn_bounds = (function() {
  const __ring_m = List_pop(ctx.fn_bounds_stack);
  if (__ring_m._tag === "some") { const prev = __ring_m._0; return prev; }
  if (__ring_m._tag === "none") { return []; }
  __match_fail(__ring_m);
})();
  ctx.type_param_scope = saved_tp_scope;
  ctx.qualified_assoc_scope = saved_qualified_assoc;
  const final_body = (function() {
  const __ring_m = body_result;
  if (__ring_m._tag === "some") { const br = __ring_m._0; return (function() {
  ctx.subst = br.subst;
  const zctx = new zonk$ZonkCtx(ctx.subst, map_new());
  const result = Option_some(zonk$zonk_block(zctx, br.hexpr));
  ctx.subst = saved_subst;
  return result;
})(); }
  if (__ring_m._tag === "none") { return (function() {
  ctx.subst = saved_subst;
  return Option_none;
})(); }
  __match_fail(__ring_m);
})();
  return final_body;
}

function check_trait_decl(ctx, name, type_params, ast_methods, is_pub, span, __ring_ev_fail) {
  const trait_def = (function() {
  const __ring_m = _Map_get(ctx.env.trait_reg.traits, name);
  if (__ring_m._tag === "some") { const d = __ring_m._0; return d; }
  if (__ring_m._tag === "none") { return (function() {
  const _ = infer_ctx$type_error(ctx.sink, codes$E0501, `trait not found: ${name}`, span, diagnostics$DiagnosticContext_TraitError(`trait '${name}' was not registered`));
  return __ring_ev_fail.raise(new infer_ctx$CompileError());
})(); }
  __match_fail(__ring_m);
})();
  let self_var = env$TypeEnv_fresh_var(ctx.env);
  if ((List_len(trait_def.methods) > 0)) {
    __ring_match52: {
      const __ring_m52 = List_first(trait_def.methods);
      if (__ring_m52._tag === "some") {
        const first_method = __ring_m52._0;
        __ring_match53: {
          const __ring_m53 = first_method.ty;
          if (__ring_m53._tag === "FnType") {
            const fps = __ring_m53.params;
            if ((List_len(fps) > 0)) {
              __ring_match54: {
                const __ring_m54 = List_first(fps);
                if (__ring_m54._tag === "some") {
                  const fp = __ring_m54._0;
                  self_var = fp;
                  break __ring_match54;
                }
                if (__ring_m54._tag === "none") {
                  break __ring_match54;
                }
                __match_fail(__ring_m54);
              }
            }
            break __ring_match53;
          }
          break __ring_match53;
        }
        break __ring_match52;
      }
      if (__ring_m52._tag === "none") {
        break __ring_match52;
      }
      __match_fail(__ring_m52);
    }
  }
  let hmethods = [];
  const __ring_iter_50 = __List_Iterable.iter(trait_def.methods);
  while (true) {
    const __ring_next_50 = __ListIterator_Iterator.next(__ring_iter_50);
    if (__ring_next_50._tag === "none") break;
    const m = __ring_next_50._0;
    const ast_method = find_ast_fn_by_name(ast_methods, m.name);
    const fn_params = (function() {
  const __ring_m = m.ty;
  if (__ring_m._tag === "FnType") { const params = __ring_m.params; return params; }
  return [];
})();
    const fn_ret = (function() {
  const __ring_m = m.ty;
  if (__ring_m._tag === "FnType") { const return_type = __ring_m.return_type; return return_type; }
  return types$UNIT;
})();
    const ast_params = (function() {
  const __ring_m = ast_method;
  if (__ring_m._tag === "some") { const am = __ring_m._0; return (function() {
  const __ring_m = am;
  if (__ring_m._tag === "Fn") { const params = __ring_m.params; return Option_some(params); }
  return Option_none;
})(); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
    let hparams = [];
    let pi = 0;
    const __ring_iter_51 = __List_Iterable.iter(fn_params);
    while (true) {
      const __ring_next_51 = __ListIterator_Iterator.next(__ring_iter_51);
      if (__ring_next_51._tag === "none") break;
      const param_type = __ring_next_51._0;
      const p_name = (function() {
  const __ring_m = ast_params;
  if (__ring_m._tag === "some") { const aps = __ring_m._0; return (function() {
  const __ring_m = List_get(aps, pi);
  if (__ring_m._tag === "some") { const ap = __ring_m._0; return ap.name; }
  if (__ring_m._tag === "none") { return `p${Int_to_str(pi)}`; }
  __match_fail(__ring_m);
})(); }
  if (__ring_m._tag === "none") { return `p${Int_to_str(pi)}`; }
  __match_fail(__ring_m);
})();
      const p_mutable = (function() {
  const __ring_m = ast_params;
  if (__ring_m._tag === "some") { const aps = __ring_m._0; return (function() {
  const __ring_m = List_get(aps, pi);
  if (__ring_m._tag === "some") { const ap = __ring_m._0; return ap.is_mutable; }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})(); }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
      List_push(hparams, new hir$HParam(p_name, param_type, Option_none, p_mutable));
      pi = (pi + 1);
    }
    let method_body = Option_none;
    if (m.has_default) {
      __ring_match55: {
        const __ring_m55 = ast_method;
        if (__ring_m55._tag === "some") {
          const am = __ring_m55._0;
          __ring_match56: {
            const __ring_m56 = am;
            if (__ring_m56._tag === "Fn") {
              const abody = __ring_m56.body;
              const has_body = (function() {
  const __ring_m = abody;
  if (__ring_m._tag === "Block") { const stmts = __ring_m.stmts; const tail = __ring_m.tail; return ((List_len(stmts) > 0) ? true : Option_is_some(tail)); }
  return true;
})();
              if (has_body) {
                method_body = check_trait_default_body(ctx, name, self_var, hparams, abody);
              }
              break __ring_match56;
            }
            break __ring_match56;
          }
          break __ring_match55;
        }
        if (__ring_m55._tag === "none") {
          break __ring_match55;
        }
        __match_fail(__ring_m55);
      }
    }
    List_push(hmethods, new hir$HTraitMethod(m.name, hparams, fn_ret, m.has_default, method_body));
  }
  let hassoc_types = [];
  const __ring_iter_52 = __List_Iterable.iter(trait_def.assoc_types);
  while (true) {
    const __ring_next_52 = __ListIterator_Iterator.next(__ring_iter_52);
    if (__ring_next_52._tag === "none") break;
    const atdef = __ring_next_52._0;
    List_push(hassoc_types, new hir$HAssocType(atdef.name, atdef.bounds, atdef.default_type));
  }
  return hir$HDecl_Trait(name, type_params, hmethods, trait_def.supertraits, hassoc_types, is_pub, span);
}

function check_const_decl(ctx, name, type_annotation, init, is_pub, span, __ring_ev_fail) {
  const saved_subst = ctx.subst;
  ctx.subst = unify$empty_subst();
  const old_def_id = (function() {
  const __ring_m = env$TypeEnv_lookup(ctx.env, name);
  if (__ring_m._tag === "some") { const sc = __ring_m._0; return sc.def_id; }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
  let expected_ty = Option_none;
  __ring_match57: {
    const __ring_m57 = type_annotation;
    if (__ring_m57._tag === "some") {
      const texpr = __ring_m57._0;
      expected_ty = Option_some(infer_ctx$resolve_type_expr(ctx, texpr));
      break __ring_match57;
    }
    if (__ring_m57._tag === "none") {
      break __ring_match57;
    }
    __match_fail(__ring_m57);
  }
  const init_r = infer$infer_expr(ctx, init, ctx.subst, __ring_ev_fail);
  let s = init_r.subst;
  let init_ty = hir$hexpr_type(init_r.hexpr);
  __ring_match58: {
    const __ring_m58 = expected_ty;
    if (__ring_m58._tag === "some") {
      const ann_ty = __ring_m58._0;
      s = infer_ctx$unify_at(ctx.sink, ctx.env, init_ty, ann_ty, s, span);
      init_ty = env$apply_subst(s, ann_ty);
      break __ring_match58;
    }
    if (__ring_m58._tag === "none") {
      break __ring_match58;
    }
    __match_fail(__ring_m58);
  }
  const resolved = env$apply_subst(s, init_ty);
  const gen_scheme = infer_ctx$generalize(ctx.env, resolved, s);
  const scheme = new env$TypeScheme(gen_scheme.ty, gen_scheme.type_vars, gen_scheme.bounds, old_def_id);
  env$TypeEnv_rebind(ctx.env, name, scheme);
  ctx.subst = saved_subst;
  return hir$HDecl_Const(name, old_def_id, resolved, init_r.hexpr, is_pub, span);
}

function resolve_mod_uses(ctx, uses) {
  const __ring_iter_53 = __List_Iterable.iter(uses);
  while (true) {
    const __ring_next_53 = __ListIterator_Iterator.next(__ring_iter_53);
    if (__ring_next_53._tag === "none") break;
    const use_decl = __ring_next_53._0;
    const segments = use_decl.path.segments;
    if ((List_len(segments) === 0)) {
      continue;
    }
    const first = Option_unwrap_or(List_get(segments, 0), "");
    if (((first !== "self") ? (first !== "super") : false)) {
      continue;
    }
    let qualifier = first;
    let name_start_idx = 1;
    let i = 1;
    while ((i < List_len(segments))) {
      const seg = Option_unwrap_or(List_get(segments, i), "");
      if ((seg === "super")) {
        qualifier = `${qualifier}::${seg}`;
        name_start_idx = (i + 1);
      } else {
        break;
      }
      i = (i + 1);
    }
    const resolved = infer_ctx$resolve_relative_qualifier(qualifier, ctx.mod_path_stack);
    __ring_match59: {
      const __ring_m59 = resolved;
      if (__ring_m59._tag === "none") {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0705, `Cannot use '${qualifier}' — relative path exceeds module nesting depth`, use_decl.path.span, diagnostics$DiagnosticContext_OtherContext(Option_some("relative path out of scope")));
        continue;
        break __ring_match59;
      }
      if (__ring_m59._tag === "some") {
        const prefix = __ring_m59._0;
        __ring_match60: {
          const __ring_m60 = use_decl.imports;
          if (__ring_m60._tag === "NamedItems") {
            const names = __ring_m60.names;
            const __ring_iter_54 = __List_Iterable.iter(names);
            while (true) {
              const __ring_next_54 = __ListIterator_Iterator.next(__ring_iter_54);
              if (__ring_next_54._tag === "none") break;
              const item = __ring_next_54._0;
              const local_name = (function() {
  const __ring_m = item.alias;
  if (__ring_m._tag === "some") { const a = __ring_m._0; return a; }
  if (__ring_m._tag === "none") { return item.name; }
  __match_fail(__ring_m);
})();
              const qualified_name = ((prefix === "") ? item.name : `${prefix}::${item.name}`);
              __ring_match61: {
                const __ring_m61 = env$TypeEnv_lookup(ctx.env, qualified_name);
                if (__ring_m61._tag === "some") {
                  const scheme = __ring_m61._0;
                  env$TypeEnv_bind(ctx.env, local_name, scheme);
                  if ((local_name !== qualified_name)) {
                    _Map_insert(ctx.use_aliases, local_name, qualified_name);
                  }
                  break __ring_match61;
                }
                if (__ring_m61._tag === "none") {
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `Undefined variable: ${qualified_name}`, item.span, diagnostics$DiagnosticContext_UndefinedVariable(qualified_name, Option_none));
                  break __ring_match61;
                }
                __match_fail(__ring_m61);
              }
            }
            break __ring_match60;
          }
          if (__ring_m60._tag === "Module") {
            if ((name_start_idx < List_len(segments))) {
              const name = Option_unwrap_or(List_get(segments, (List_len(segments) - 1)), "");
              const qualified_name = ((prefix === "") ? name : `${prefix}::${name}`);
              __ring_match62: {
                const __ring_m62 = env$TypeEnv_lookup(ctx.env, qualified_name);
                if (__ring_m62._tag === "some") {
                  const scheme = __ring_m62._0;
                  env$TypeEnv_bind(ctx.env, name, scheme);
                  if ((name !== qualified_name)) {
                    _Map_insert(ctx.use_aliases, name, qualified_name);
                  }
                  break __ring_match62;
                }
                if (__ring_m62._tag === "none") {
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `Undefined variable: ${qualified_name}`, use_decl.path.span, diagnostics$DiagnosticContext_UndefinedVariable(qualified_name, Option_none));
                  break __ring_match62;
                }
                __match_fail(__ring_m62);
              }
            }
            break __ring_match60;
          }
          __match_fail(__ring_m60);
        }
        break __ring_match59;
      }
      __match_fail(__ring_m59);
    }
  }
}

function check_effects_capability(ctx, name, effects, cap, span) {
  const __ring_iter_55 = __List_Iterable.iter(effects.effects);
  while (true) {
    const __ring_next_55 = __ListIterator_Iterator.next(__ring_iter_55);
    if (__ring_next_55._tag === "none") break;
    const eff = __ring_next_55._0;
    const kind = types$effect_kind_name(eff);
    const in_cap = cap.effects.some((function(c) { return types$effects_match_kind(eff, c); }));
    if ((!in_cap)) {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0405, `'${name}' uses effect '${kind}' which is not in the module's requires set`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("capability violation")));
    }
  }
}

function check_capability(ctx, decl, cap, mod_span) {
  __ring_match63: {
    const __ring_m63 = decl;
    if (__ring_m63._tag === "Fn") {
      const name = __ring_m63.name; const effects = __ring_m63.effects; const span = __ring_m63.span;
      return check_effects_capability(ctx, name, effects, cap, span);
      break __ring_match63;
    }
    if (__ring_m63._tag === "Impl") {
      const methods = __ring_m63.methods;
      const __ring_iter_56 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_56 = __ListIterator_Iterator.next(__ring_iter_56);
        if (__ring_next_56._tag === "none") break;
        const method = __ring_next_56._0;
        __ring_match64: {
          const __ring_m64 = method;
          if (__ring_m64._tag === "Fn") {
            const name = __ring_m64.name; const effects = __ring_m64.effects; const span = __ring_m64.span;
            check_effects_capability(ctx, name, effects, cap, span);
            break __ring_match64;
          }
          break __ring_match64;
        }
      }
      break __ring_match63;
    }
    break __ring_match63;
  }
}

function expand_delegate_impls(ctx, target_type, type_params, field, trait_names, span) {
  let result = [];
  __ring_match65: {
    const __ring_m65 = _Map_get(ctx.env.types.structs, target_type);
    if (__ring_m65._tag === "none") {
      return result;
      break __ring_match65;
    }
    if (__ring_m65._tag === "some") {
      const struct_def = __ring_m65._0;
      let field_type = Option_none;
      const __ring_iter_57 = __List_Iterable.iter(struct_def.fields);
      while (true) {
        const __ring_next_57 = __ListIterator_Iterator.next(__ring_iter_57);
        if (__ring_next_57._tag === "none") break;
        const f = __ring_next_57._0;
        if ((f.name === field)) {
          field_type = Option_some(f.ty);
        }
      }
      __ring_match66: {
        const __ring_m66 = field_type;
        if (__ring_m66._tag === "none") {
          return result;
          break __ring_match66;
        }
        if (__ring_m66._tag === "some") {
          const ft = __ring_m66._0;
          const self_type = ((List_len(type_params) > 0) ? (function() {
  let impl_tp_types = [];
  const __ring_iter_58 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_58 = __ListIterator_Iterator.next(__ring_iter_58);
    if (__ring_next_58._tag === "none") break;
    const tp = __ring_next_58._0;
    __ring_match67: {
      const __ring_m67 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m67._tag === "some") {
        const tv = __ring_m67._0;
        List_push(impl_tp_types, tv);
        break __ring_match67;
      }
      if (__ring_m67._tag === "none") {
        List_push(impl_tp_types, env$TypeEnv_fresh_var(ctx.env));
        break __ring_match67;
      }
      __match_fail(__ring_m67);
    }
  }
  __ring_match68: {
    const __ring_m68 = _Map_get(ctx.env.types.structs, target_type);
    if (__ring_m68._tag === "some") {
      const def = __ring_m68._0;
      return types$Type_StructType(def.name, impl_tp_types, def.fields);
      break __ring_match68;
    }
    if (__ring_m68._tag === "none") {
      __ring_match69: {
        const __ring_m69 = _Map_get(ctx.env.types.enums, target_type);
        if (__ring_m69._tag === "some") {
          const def = __ring_m69._0;
          return types$Type_EnumType(def.name, impl_tp_types, def.variants);
          break __ring_match69;
        }
        if (__ring_m69._tag === "none") {
          return infer_ctx$resolve_self_type(ctx, target_type);
          break __ring_match69;
        }
        __match_fail(__ring_m69);
      }
      break __ring_match68;
    }
    __match_fail(__ring_m68);
  }
})() : infer_ctx$resolve_self_type(ctx, target_type));
          let all_traits = [];
          const __ring_iter_59 = __List_Iterable.iter(trait_names);
          while (true) {
            const __ring_next_59 = __ListIterator_Iterator.next(__ring_iter_59);
            if (__ring_next_59._tag === "none") break;
            const tname = __ring_next_59._0;
            List_push(all_traits, tname);
            const supers = infer_register$collect_all_supertraits(ctx, tname);
            const __ring_iter_60 = __List_Iterable.iter(supers);
            while (true) {
              const __ring_next_60 = __ListIterator_Iterator.next(__ring_iter_60);
              if (__ring_next_60._tag === "none") break;
              const st_name = __ring_next_60._0;
              if ((!List_contains(all_traits, st_name, __Str_Eq))) {
                List_push(all_traits, st_name);
              }
            }
          }
          const field_type_name = (function() {
  const __ring_m = ft;
  if (__ring_m._tag === "StructType") { const n = __ring_m.name; return Option_some(n); }
  if (__ring_m._tag === "EnumType") { const n = __ring_m.name; return Option_some(n); }
  return Option_none;
})();
          const field_impl_methods = (function() {
  const __ring_m = field_type_name;
  if (__ring_m._tag === "some") { const ftn = __ring_m._0; return _Map_get(ctx.env.trait_reg.impl_methods, ftn); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
          const __ring_iter_61 = __List_Iterable.iter(all_traits);
          while (true) {
            const __ring_next_61 = __ListIterator_Iterator.next(__ring_iter_61);
            if (__ring_next_61._tag === "none") break;
            const tname = __ring_next_61._0;
            __ring_match70: {
              const __ring_m70 = _Map_get(ctx.env.trait_reg.traits, tname);
              if (__ring_m70._tag === "none") {
                break __ring_match70;
              }
              if (__ring_m70._tag === "some") {
                const trait_def = __ring_m70._0;
                let field_assoc_map = map_new();
                __ring_match71: {
                  const __ring_m71 = field_type_name;
                  if (__ring_m71._tag === "some") {
                    const ftn = __ring_m71._0;
                    __ring_match72: {
                      const __ring_m72 = env$find_impl(ctx.env.trait_reg, ftn, tname);
                      if (__ring_m72._tag === "some") {
                        const field_impl = __ring_m72._0;
                        field_assoc_map = map_clone(field_impl.assoc_types);
                        break __ring_match72;
                      }
                      if (__ring_m72._tag === "none") {
                        break __ring_match72;
                      }
                      __match_fail(__ring_m72);
                    }
                    break __ring_match71;
                  }
                  if (__ring_m71._tag === "none") {
                    break __ring_match71;
                  }
                  __match_fail(__ring_m71);
                }
                let trait_hmethods = [];
                const __ring_iter_62 = __List_Iterable.iter(trait_def.methods);
                while (true) {
                  const __ring_next_62 = __ListIterator_Iterator.next(__ring_iter_62);
                  if (__ring_next_62._tag === "none") break;
                  const tm = __ring_next_62._0;
                  const resolved_method_scheme = (function() {
  const __ring_m = field_impl_methods;
  if (__ring_m._tag === "some") { const fm_map = __ring_m._0; return _Map_get(fm_map, tm.name); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
                  __ring_match73: {
                    const __ring_m73 = tm.ty;
                    if (__ring_m73._tag === "FnType") {
                      const trait_params = __ring_m73.params; const trait_ret_ty = __ring_m73.return_type; const trait_eff = __ring_m73.effects;
                      const ret_ty = (function() {
  const __ring_m = resolved_method_scheme;
  if (__ring_m._tag === "some") { const rs = __ring_m._0; return (function() {
  const __ring_m = rs.ty;
  if (__ring_m._tag === "FnType") { const resolved_ret = __ring_m.return_type; return resolved_ret; }
  return trait_ret_ty;
})(); }
  if (__ring_m._tag === "none") { return trait_ret_ty; }
  __match_fail(__ring_m);
})();
                      const eff = (function() {
  const __ring_m = resolved_method_scheme;
  if (__ring_m._tag === "some") { const rs = __ring_m._0; return (function() {
  const __ring_m = rs.ty;
  if (__ring_m._tag === "FnType") { const resolved_eff = __ring_m.effects; return resolved_eff; }
  return trait_eff;
})(); }
  if (__ring_m._tag === "none") { return trait_eff; }
  __match_fail(__ring_m);
})();
                      const resolved_non_self_params = (function() {
  const __ring_m = resolved_method_scheme;
  if (__ring_m._tag === "some") { const rs = __ring_m._0; return (function() {
  const __ring_m = rs.ty;
  if (__ring_m._tag === "FnType") { const rp = __ring_m.params; return Option_some(rp); }
  return Option_none;
})(); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
                      let hparams = [];
                      const def_id_self = env$TypeEnv_fresh_def_id(ctx.env);
                      const self_is_mut = (function() {
  const __ring_m = List_get(tm.param_mutabilities, 0);
  if (__ring_m._tag === "some") { const m = __ring_m._0; return m; }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
                      List_push(hparams, new hir$HParam("self", self_type, Option_some(def_id_self), self_is_mut));
                      const trait_self_type = (function() {
  const __ring_m = List_first(trait_params);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return types$UNIT; }
  __match_fail(__ring_m);
})();
                      let forward_args = [];
                      let pi = 1;
                      while ((pi < List_len(trait_params))) {
                        const pname = `__p${(pi - 1)}`;
                        const pty = (function() {
  const __ring_m = List_get(trait_params, pi);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return types$UNIT; }
  __match_fail(__ring_m);
})();
                        const resolved_pty = (function() {
  const __ring_m = resolved_non_self_params;
  if (__ring_m._tag === "some") { const rp = __ring_m._0; return (function() {
  const __ring_m = List_get(rp, pi);
  if (__ring_m._tag === "some") { const rpt = __ring_m._0; return rpt; }
  if (__ring_m._tag === "none") { return pty; }
  __match_fail(__ring_m);
})(); }
  if (__ring_m._tag === "none") { return pty; }
  __match_fail(__ring_m);
})();
                        const pid = env$TypeEnv_fresh_def_id(ctx.env);
                        const p_is_mut = (function() {
  const __ring_m = List_get(tm.param_mutabilities, pi);
  if (__ring_m._tag === "some") { const m = __ring_m._0; return m; }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
                        const is_self_typed = (function() {
  const __ring_m = [pty, trait_self_type];
  if (Array.isArray(__ring_m) && __ring_m.length === 2 && __ring_m[0]._tag === "TypeVar" && __ring_m[1]._tag === "TypeVar") { const a = __ring_m[0].id; const b = __ring_m[1].id; return (a === b); }
  return false;
})();
                        const param_ty = (is_self_typed ? self_type : resolved_pty);
                        List_push(hparams, new hir$HParam(pname, param_ty, Option_some(pid), p_is_mut));
                        if (is_self_typed) {
                          const arg_ident = hir$HExpr_Ident(pname, Option_none, Option_some(pid), Option_none, self_type, types$EMPTY_ROW, span);
                          List_push(forward_args, hir$HExpr_FieldAccess(arg_ident, field, ft, types$EMPTY_ROW, span));
                        } else {
                          List_push(forward_args, hir$HExpr_Ident(pname, Option_none, Option_some(pid), Option_none, resolved_pty, types$EMPTY_ROW, span));
                        }
                        pi = (pi + 1);
                      }
                      const field_access = hir$HExpr_FieldAccess(hir$HExpr_Ident("self", Option_none, Option_some(def_id_self), Option_none, self_type, types$EMPTY_ROW, span), field, ft, types$EMPTY_ROW, span);
                      let use_dict_dispatch = false;
                      if (tm.has_default) {
                        const ftn = (function() {
  const __ring_m = ft;
  if (__ring_m._tag === "StructType") { const n = __ring_m.name; return Option_some(n); }
  if (__ring_m._tag === "EnumType") { const n = __ring_m.name; return Option_some(n); }
  return Option_none;
})();
                        __ring_match74: {
                          const __ring_m74 = ftn;
                          if (__ring_m74._tag === "some") {
                            const field_tn = __ring_m74._0;
                            let has_explicit = false;
                            __ring_match75: {
                              const __ring_m75 = _Map_get(ctx.env.trait_reg.impl_methods, field_tn);
                              if (__ring_m75._tag === "some") {
                                const methods_map = __ring_m75._0;
                                has_explicit = _Map_contains_key(methods_map, tm.name);
                                break __ring_match75;
                              }
                              if (__ring_m75._tag === "none") {
                                break __ring_match75;
                              }
                              __match_fail(__ring_m75);
                            }
                            if ((!has_explicit)) {
                              use_dict_dispatch = true;
                            }
                            break __ring_match74;
                          }
                          if (__ring_m74._tag === "none") {
                            break __ring_match74;
                          }
                          __match_fail(__ring_m74);
                        }
                      }
                      const call_expr = (use_dict_dispatch ? (function() {
  const ftn = (function() {
  const __ring_m = ft;
  if (__ring_m._tag === "StructType") { const n = __ring_m.name; return n; }
  if (__ring_m._tag === "EnumType") { const n = __ring_m.name; return n; }
  return "";
})();
  const dict_name = hir$trait_dict_name(ftn, tname);
  let dict_args = [];
  List_push(dict_args, field_access);
  List_extend(dict_args, forward_args);
  return hir$HExpr_Call(hir$HExpr_Ident(dict_name, Option_none, Option_none, Option_none, tm.ty, types$EMPTY_ROW, span), dict_args, [], [], Option_some(new hir$DictDispatchInfo(dict_name, tm.name)), ret_ty, eff, span);
})() : (function() {
  const method_access = hir$HExpr_FieldAccess(field_access, tm.name, tm.ty, types$EMPTY_ROW, span);
  return hir$HExpr_Call(method_access, forward_args, [], [], Option_none, ret_ty, eff, span);
})());
                      List_push(trait_hmethods, hir$HDecl_Fn(tm.name, Option_some(env$TypeEnv_fresh_def_id(ctx.env)), tm.method_type_params, hparams, ret_ty, eff, call_expr, false, [], span));
                      break __ring_match73;
                    }
                    break __ring_match73;
                  }
                }
                let h_assoc_types = [];
                let sorted_assoc = _Map_entries(field_assoc_map);
                sorted_assoc.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
                const __ring_iter_63 = __List_Iterable.iter(sorted_assoc);
                while (true) {
                  const __ring_next_63 = __ListIterator_Iterator.next(__ring_iter_63);
                  if (__ring_next_63._tag === "none") break;
                  const entry = __ring_next_63._0;
                  const __ring_dt1 = entry;
                  const aname = __ring_dt1[0];
                  const aty = __ring_dt1[1];
                  List_push(h_assoc_types, new hir$HAssocType(aname, [], Option_some(aty)));
                }
                List_push(result, hir$HDecl_Impl(target_type, type_params, Option_some(tname), trait_hmethods, h_assoc_types, span));
                break __ring_match70;
              }
              __match_fail(__ring_m70);
            }
          }
          return result;
          break __ring_match66;
        }
        __match_fail(__ring_m66);
      }
      break __ring_match65;
    }
    __match_fail(__ring_m65);
  }
}

function check_sig_decl(ctx, name, members, is_pub, span) {
  let hmembers = [];
  __ring_match76: {
    const __ring_m76 = _Map_get(ctx.env.types.sigs, name);
    if (__ring_m76._tag === "some") {
      const sig_def = __ring_m76._0;
      const __ring_iter_64 = __List_Iterable.iter(members);
      while (true) {
        const __ring_next_64 = __ListIterator_Iterator.next(__ring_iter_64);
        if (__ring_next_64._tag === "none") break;
        const m = __ring_next_64._0;
        __ring_match77: {
          const __ring_m77 = _Map_get(sig_def.members, m.name);
          if (__ring_m77._tag === "some") {
            const scheme = __ring_m77._0;
            List_push(hmembers, new hir$HSigMember(m.name, scheme.ty, m.span));
            break __ring_match77;
          }
          if (__ring_m77._tag === "none") {
            List_push(hmembers, new hir$HSigMember(m.name, types$UNIT, m.span));
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
  return hir$HDecl_Sig(name, hmembers, is_pub, span);
}

function check_mod_decl(ctx, mod_name, uses, decls, required_effects, is_pub, span, __ring_ev_fail) {
  const segments = Str_split(mod_name, "::");
  const simple_name = Option_unwrap_or(List_get(segments, (List_len(segments) - 1)), mod_name);
  List_push(ctx.mod_path_stack, simple_name);
  infer_register$insert_mod_aliases(ctx, mod_name, decls, false);
  resolve_mod_uses(ctx, uses);
  let cap_row = Option_none;
  __ring_match78: {
    const __ring_m78 = required_effects;
    if (__ring_m78._tag === "some") {
      const req_effs = __ring_m78._0;
      cap_row = Option_some(infer_register$resolve_declared_effects(ctx, req_effs));
      break __ring_match78;
    }
    if (__ring_m78._tag === "none") {
      break __ring_match78;
    }
    __match_fail(__ring_m78);
  }
  let hdecls = [];
  const __ring_iter_65 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_65 = __ListIterator_Iterator.next(__ring_iter_65);
    if (__ring_next_65._tag === "none") break;
    const decl = __ring_next_65._0;
    const prefixed = infer_register$prefix_decl_name(mod_name, decl);
    const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_decl(ctx, prefixed, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    __ring_match79: {
      const __ring_m79 = result;
      if (__ring_m79._tag === "some") {
        const hd = __ring_m79._0;
        __ring_match80: {
          const __ring_m80 = hd;
          if (__ring_m80._tag === "Fn") {
            const name = __ring_m80.name; const effects = __ring_m80.effects;
            if ((List_len(effects.effects) > 0)) {
              infer_ctx$update_fn_effects(ctx.env, name, effects);
            }
            break __ring_match80;
          }
          break __ring_match80;
        }
        __ring_match81: {
          const __ring_m81 = cap_row;
          if (__ring_m81._tag === "some") {
            const cap = __ring_m81._0;
            check_capability(ctx, hd, cap, span);
            break __ring_match81;
          }
          if (__ring_m81._tag === "none") {
            break __ring_match81;
          }
          __match_fail(__ring_m81);
        }
        List_push(hdecls, hd);
        break __ring_match79;
      }
      if (__ring_m79._tag === "none") {
        break __ring_match79;
      }
      __match_fail(__ring_m79);
    }
    __ring_match82: {
      const __ring_m82 = prefixed;
      if (__ring_m82._tag === "Impl") {
        const target_type = __ring_m82.target_type; const impl_tps = __ring_m82.type_params; const methods = __ring_m82.methods; const impl_span = __ring_m82.span;
        const __ring_iter_66 = __List_Iterable.iter(methods);
        while (true) {
          const __ring_next_66 = __ListIterator_Iterator.next(__ring_iter_66);
          if (__ring_next_66._tag === "none") break;
          const m = __ring_next_66._0;
          __ring_match83: {
            const __ring_m83 = m;
            if (__ring_m83._tag === "Delegate") {
              const field = __ring_m83.field; const trait_names = __ring_m83.trait_names; const dspan = __ring_m83.span;
              const delegate_impls = expand_delegate_impls(ctx, target_type, impl_tps, field, trait_names, dspan);
              const __ring_iter_67 = __List_Iterable.iter(delegate_impls);
              while (true) {
                const __ring_next_67 = __ListIterator_Iterator.next(__ring_iter_67);
                if (__ring_next_67._tag === "none") break;
                const di = __ring_next_67._0;
                __ring_match84: {
                  const __ring_m84 = cap_row;
                  if (__ring_m84._tag === "some") {
                    const cap = __ring_m84._0;
                    check_capability(ctx, di, cap, span);
                    break __ring_match84;
                  }
                  if (__ring_m84._tag === "none") {
                    break __ring_match84;
                  }
                  __match_fail(__ring_m84);
                }
                List_push(hdecls, di);
              }
              break __ring_match83;
            }
            break __ring_match83;
          }
        }
        break __ring_match82;
      }
      break __ring_match82;
    }
  }
  List_pop(ctx.mod_path_stack);
  return hir$HDecl_ModBlock(mod_name, hdecls, is_pub, span);
}

function check_decl(ctx, decl, __ring_ev_fail) {
  __ring_match85: {
    const __ring_m85 = decl;
    if (__ring_m85._tag === "Struct") {
      const name = __ring_m85.name; const type_params = __ring_m85.type_params; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      return check_struct_decl(ctx, name, type_params, is_pub, span, __ring_ev_fail);
      break __ring_match85;
    }
    if (__ring_m85._tag === "Enum") {
      const name = __ring_m85.name; const type_params = __ring_m85.type_params; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      return check_enum_decl(ctx, name, type_params, is_pub, span, __ring_ev_fail);
      break __ring_match85;
    }
    if (__ring_m85._tag === "Effect") {
      const name = __ring_m85.name; const type_params = __ring_m85.type_params; const ops = __ring_m85.ops; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      return check_effect_decl(ctx, name, type_params, ops, is_pub, span, __ring_ev_fail);
      break __ring_match85;
    }
    if (__ring_m85._tag === "Impl") {
      const target_type = __ring_m85.target_type; const type_params = __ring_m85.type_params; const trait_name = __ring_m85.trait_name; const methods = __ring_m85.methods; const span = __ring_m85.span;
      return check_impl_decl(ctx, target_type, type_params, trait_name, methods, span, __ring_ev_fail);
      break __ring_match85;
    }
    if (__ring_m85._tag === "Fn") {
      const name = __ring_m85.name; const type_params = __ring_m85.type_params; const params = __ring_m85.params; const return_type = __ring_m85.return_type; const declared_effects = __ring_m85.declared_effects; const body = __ring_m85.body; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      return check_fn_decl(ctx, name, type_params, params, return_type, declared_effects, body, is_pub, span, Option_none, __ring_ev_fail);
      break __ring_match85;
    }
    if (__ring_m85._tag === "Test") {
      const description = __ring_m85.description; const body = __ring_m85.body; const span = __ring_m85.span;
      return check_test_decl(ctx, description, body, span, __ring_ev_fail);
      break __ring_match85;
    }
    if (__ring_m85._tag === "Trait") {
      const name = __ring_m85.name; const type_params = __ring_m85.type_params; const methods = __ring_m85.methods; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      return check_trait_decl(ctx, name, type_params, methods, is_pub, span, __ring_ev_fail);
      break __ring_match85;
    }
    if (__ring_m85._tag === "ExternFn") {
      const name = __ring_m85.name; const type_params = __ring_m85.type_params; const params = __ring_m85.params; const return_type = __ring_m85.return_type; const declared_effects = __ring_m85.declared_effects; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      return check_extern_fn_decl(ctx, name, type_params, params, declared_effects, is_pub, span, __ring_ev_fail);
      break __ring_match85;
    }
    if (__ring_m85._tag === "ExternType") {
      const name = __ring_m85.name; const type_params = __ring_m85.type_params; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      return hir$HDecl_ExternType(name, type_params, is_pub, span);
      break __ring_match85;
    }
    if (__ring_m85._tag === "TypeAlias") {
      const name = __ring_m85.name; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      const alias_type = (function() {
  const __ring_m = _Map_get(ctx.env.types.type_aliases, name);
  if (__ring_m._tag === "some") { const alias = __ring_m._0; return alias.ty; }
  if (__ring_m._tag === "none") { return types$UNIT; }
  __match_fail(__ring_m);
})();
      return hir$HDecl_TypeAlias(name, alias_type, is_pub, span);
      break __ring_match85;
    }
    if (__ring_m85._tag === "Const") {
      const name = __ring_m85.name; const type_annotation = __ring_m85.type_annotation; const init = __ring_m85.init; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      return check_const_decl(ctx, name, type_annotation, init, is_pub, span, __ring_ev_fail);
      break __ring_match85;
    }
    if (__ring_m85._tag === "ModBlock") {
      const name = __ring_m85.name; const uses = __ring_m85.uses; const decls = __ring_m85.decls; const required_effects = __ring_m85.required_effects; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      return check_mod_decl(ctx, name, uses, decls, required_effects, is_pub, span);
      break __ring_match85;
    }
    if (__ring_m85._tag === "Sig") {
      const name = __ring_m85.name; const members = __ring_m85.members; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      return check_sig_decl(ctx, name, members, is_pub, span);
      break __ring_match85;
    }
    if (__ring_m85._tag === "EffectAlias") {
      const name = __ring_m85.name; const is_pub = __ring_m85.is_pub; const span = __ring_m85.span;
      return hir$HDecl_TypeAlias(name, types$UNIT, is_pub, span);
      break __ring_match85;
    }
    if (__ring_m85._tag === "Delegate") {
      const span = __ring_m85.span;
      return hir$HDecl_TypeAlias("<delegate>", types$UNIT, false, span);
      break __ring_match85;
    }
    if (__ring_m85._tag === "AssocType") {
      const span = __ring_m85.span;
      return hir$HDecl_TypeAlias("<assoc_type>", types$UNIT, false, span);
      break __ring_match85;
    }
    __match_fail(__ring_m85);
  }
}

function rebind_fn_type(ctx, name, params, return_type, effects) {
  __ring_match86: {
    const __ring_m86 = env$TypeEnv_lookup(ctx.env, name);
    if (__ring_m86._tag === "some") {
      const scheme = __ring_m86._0;
      __ring_match87: {
        const __ring_m87 = scheme.ty;
        if (__ring_m87._tag === "FnType") {
          const reg_params = __ring_m87.params; const reg_ret = __ring_m87.return_type;
          let var_mapping = map_new();
          let pi = 0;
          const __ring_iter_68 = __List_Iterable.iter(params);
          while (true) {
            const __ring_next_68 = __ListIterator_Iterator.next(__ring_iter_68);
            if (__ring_next_68._tag === "none") break;
            const p = __ring_next_68._0;
            __ring_match88: {
              const __ring_m88 = List_get(reg_params, pi);
              if (__ring_m88._tag === "some") {
                const reg_p = __ring_m88._0;
                build_var_mapping(p.ty, reg_p, var_mapping);
                break __ring_match88;
              }
              if (__ring_m88._tag === "none") {
                break __ring_match88;
              }
              __match_fail(__ring_m88);
            }
            pi = (pi + 1);
          }
          const mapped_ret = apply_var_mapping(return_type, var_mapping);
          const mapped_effects = map_effect_row(effects, var_mapping);
          const new_type = types$Type_FnType(reg_params, mapped_ret, mapped_effects);
          return env$TypeEnv_rebind(ctx.env, name, new env$TypeScheme(new_type, scheme.type_vars, scheme.bounds, scheme.def_id));
          break __ring_match87;
        }
        break __ring_match87;
      }
      break __ring_match86;
    }
    if (__ring_m86._tag === "none") {
      break __ring_match86;
    }
    __match_fail(__ring_m86);
  }
}

function check_one_decl_with_rebind(ctx, decl, hdecls, __ring_ev_fail) {
  const hd = check_decl(ctx, decl, __ring_ev_fail);
  __ring_match89: {
    const __ring_m89 = hd;
    if (__ring_m89._tag === "Fn") {
      const name = __ring_m89.name; const params = __ring_m89.params; const return_type = __ring_m89.return_type; const effects = __ring_m89.effects;
      if ((List_len(effects.effects) > 0)) {
        infer_ctx$update_fn_effects(ctx.env, name, effects);
      }
      rebind_fn_type(ctx, name, params, return_type, effects);
      break __ring_match89;
    }
    if (__ring_m89._tag === "Impl") {
      const methods = __ring_m89.methods;
      const __ring_iter_69 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_69 = __ListIterator_Iterator.next(__ring_iter_69);
        if (__ring_next_69._tag === "none") break;
        const method = __ring_next_69._0;
        __ring_match90: {
          const __ring_m90 = method;
          if (__ring_m90._tag === "Fn") {
            const mname = __ring_m90.name; const mparams = __ring_m90.params; const mret = __ring_m90.return_type; const meff = __ring_m90.effects;
            if ((List_len(meff.effects) > 0)) {
              infer_ctx$update_fn_effects(ctx.env, mname, meff);
            }
            rebind_fn_type(ctx, mname, mparams, mret, meff);
            break __ring_match90;
          }
          break __ring_match90;
        }
      }
      break __ring_match89;
    }
    break __ring_match89;
  }
  let delegate_decls = [];
  __ring_match91: {
    const __ring_m91 = decl;
    if (__ring_m91._tag === "Impl") {
      const target_type = __ring_m91.target_type; const type_params = __ring_m91.type_params; const methods = __ring_m91.methods; const span = __ring_m91.span;
      const __ring_iter_70 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_70 = __ListIterator_Iterator.next(__ring_iter_70);
        if (__ring_next_70._tag === "none") break;
        const m = __ring_next_70._0;
        __ring_match92: {
          const __ring_m92 = m;
          if (__ring_m92._tag === "Delegate") {
            const field = __ring_m92.field; const trait_names = __ring_m92.trait_names; const dspan = __ring_m92.span;
            const delegate_impls = expand_delegate_impls(ctx, target_type, type_params, field, trait_names, dspan);
            const __ring_iter_71 = __List_Iterable.iter(delegate_impls);
            while (true) {
              const __ring_next_71 = __ListIterator_Iterator.next(__ring_iter_71);
              if (__ring_next_71._tag === "none") break;
              const di = __ring_next_71._0;
              List_push(delegate_decls, di);
            }
            break __ring_match92;
          }
          break __ring_match92;
        }
      }
      break __ring_match91;
    }
    break __ring_match91;
  }
  List_push(hdecls, hd);
  const __ring_iter_72 = __List_Iterable.iter(delegate_decls);
  while (true) {
    const __ring_next_72 = __ListIterator_Iterator.next(__ring_iter_72);
    if (__ring_next_72._tag === "none") break;
    const di = __ring_next_72._0;
    List_push(hdecls, di);
  }
}

function collect_effect_spans(decls, spans) {
  const __ring_iter_73 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_73 = __ListIterator_Iterator.next(__ring_iter_73);
    if (__ring_next_73._tag === "none") break;
    const decl = __ring_next_73._0;
    __ring_match93: {
      const __ring_m93 = decl;
      if (__ring_m93._tag === "Effect") {
        const name = __ring_m93.name; const span = __ring_m93.span;
        _Map_insert(spans, name, span);
        break __ring_match93;
      }
      if (__ring_m93._tag === "ModBlock") {
        const mod_decls = __ring_m93.decls;
        collect_effect_spans(mod_decls, spans);
        break __ring_match93;
      }
      break __ring_match93;
    }
  }
}

function dfs_detect_cycle(ctx, name, state, path, effect_spans) {
  _Map_insert(state, name, 1);
  List_push(path, name);
  __ring_match94: {
    const __ring_m94 = _Map_get(ctx.effect_default_deps, name);
    if (__ring_m94._tag === "some") {
      const deps = __ring_m94._0;
      const __ring_iter_74 = __List_Iterable.iter(deps);
      while (true) {
        const __ring_next_74 = __ListIterator_Iterator.next(__ring_iter_74);
        if (__ring_next_74._tag === "none") break;
        const dep = __ring_next_74._0;
        __ring_match95: {
          const __ring_m95 = _Map_get(state, dep);
          if (__ring_m95._tag === "some") {
            const s = __ring_m95._0;
            if ((s === 1)) {
              let cycle_parts = [];
              let found_start = false;
              const __ring_iter_75 = __List_Iterable.iter(path);
              while (true) {
                const __ring_next_75 = __ListIterator_Iterator.next(__ring_iter_75);
                if (__ring_next_75._tag === "none") break;
                const p = __ring_next_75._0;
                if ((p === dep)) {
                  found_start = true;
                }
                if (found_start) {
                  List_push(cycle_parts, p);
                }
              }
              List_push(cycle_parts, dep);
              const cycle_str = List_join(cycle_parts, " -> ");
              const err_span = (function() {
  const __ring_m = _Map_get(effect_spans, name);
  if (__ring_m._tag === "some") { const sp = __ring_m._0; return sp; }
  if (__ring_m._tag === "none") { return new ast$Span("", new ast$Position(0, 0, 0), new ast$Position(0, 0, 0)); }
  __match_fail(__ring_m);
})();
              const _ = infer_ctx$type_error(ctx.sink, codes$E0410, `Cyclic dependency in default effect handlers: ${cycle_str}`, err_span, diagnostics$DiagnosticContext_OtherContext(Option_some("cyclic default effect dependency")));
            }
            break __ring_match95;
          }
          if (__ring_m95._tag === "none") {
            dfs_detect_cycle(ctx, dep, state, path, effect_spans);
            break __ring_match95;
          }
          __match_fail(__ring_m95);
        }
      }
      break __ring_match94;
    }
    if (__ring_m94._tag === "none") {
      break __ring_match94;
    }
    __match_fail(__ring_m94);
  }
  List_pop(path);
  return _Map_insert(state, name, 2);
}

function check_default_effect_cycles(ctx, decls) {
  let effect_spans = map_new();
  collect_effect_spans(decls, effect_spans);
  let state = map_new();
  let path = [];
  let sorted_edd = _Map_entries(ctx.effect_default_deps);
  sorted_edd.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_76 = __List_Iterable.iter(sorted_edd);
  while (true) {
    const __ring_next_76 = __ListIterator_Iterator.next(__ring_iter_76);
    if (__ring_next_76._tag === "none") break;
    const entry = __ring_next_76._0;
    const __ring_dt2 = entry;
    const eff_name = __ring_dt2[0];
    if ((!_Map_contains_key(state, eff_name))) {
      dfs_detect_cycle(ctx, eff_name, state, path, effect_spans);
    }
  }
}

function check(ctx, program, __ring_ev_fail) {
  infer_register$register_decls_two_phase(ctx, program.decls);
  const derived_impls = derive$run_derive_pass(ctx.env);
  const __ring_iter_77 = __List_Iterable.iter(program.decls);
  while (true) {
    const __ring_next_77 = __ListIterator_Iterator.next(__ring_iter_77);
    if (__ring_next_77._tag === "none") break;
    const decl = __ring_next_77._0;
    __ring_match96: {
      const __ring_m96 = decl;
      if (__ring_m96._tag === "Impl") {
        const target_type = __ring_m96.target_type; const type_params = __ring_m96.type_params; const trait_name = __ring_m96.trait_name; const methods = __ring_m96.methods; const span = __ring_m96.span;
        const _ = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_impl_decl(ctx, target_type, type_params, trait_name, methods, span, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
        break __ring_match96;
      }
      break __ring_match96;
    }
  }
  const registered_fns = scc$collect_registered_fn_names(program.decls);
  const call_graph = scc$build_call_graph(program.decls, registered_fns);
  const scc_groups = scc$tarjan_scc(call_graph);
  let fn_name_to_idx = map_new();
  let impl_node_to_idx = map_new();
  let idx = 0;
  const __ring_iter_78 = __List_Iterable.iter(program.decls);
  while (true) {
    const __ring_next_78 = __ListIterator_Iterator.next(__ring_iter_78);
    if (__ring_next_78._tag === "none") break;
    const decl = __ring_next_78._0;
    __ring_match97: {
      const __ring_m97 = decl;
      if (__ring_m97._tag === "Fn") {
        const name = __ring_m97.name;
        _Map_insert(fn_name_to_idx, name, idx);
        break __ring_match97;
      }
      if (__ring_m97._tag === "Impl") {
        const target_type = __ring_m97.target_type; const trait_name = __ring_m97.trait_name;
        const inode = (function() {
  const __ring_m = trait_name;
  if (__ring_m._tag === "some") { const tn = __ring_m._0; return `impl::${target_type}::${tn}`; }
  if (__ring_m._tag === "none") { return `impl::${target_type}`; }
  __match_fail(__ring_m);
})();
        _Map_insert(impl_node_to_idx, inode, idx);
        break __ring_match97;
      }
      break __ring_match97;
    }
    idx = (idx + 1);
  }
  let hdecls = [];
  let checked = set_new();
  let di = 0;
  const __ring_iter_79 = __List_Iterable.iter(program.decls);
  while (true) {
    const __ring_next_79 = __ListIterator_Iterator.next(__ring_iter_79);
    if (__ring_next_79._tag === "none") break;
    const decl = __ring_next_79._0;
    __ring_match98: {
      const __ring_m98 = decl;
      if (__ring_m98._tag === "Fn") {
        break __ring_match98;
      }
      if (__ring_m98._tag === "Impl") {
        break __ring_match98;
      }
      const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_one_decl_with_rebind(ctx, decl, hdecls, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      _Set_insert(checked, di);
      break __ring_match98;
    }
    di = (di + 1);
  }
  let ii = 0;
  const __ring_iter_80 = __List_Iterable.iter(program.decls);
  while (true) {
    const __ring_next_80 = __ListIterator_Iterator.next(__ring_iter_80);
    if (__ring_next_80._tag === "none") break;
    const decl = __ring_next_80._0;
    __ring_match99: {
      const __ring_m99 = decl;
      if (__ring_m99._tag === "Impl") {
        if ((!_Set_contains(checked, ii, __Int_Eq))) {
          const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_one_decl_with_rebind(ctx, decl, hdecls, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
          _Set_insert(checked, ii);
        }
        break __ring_match99;
      }
      break __ring_match99;
    }
    ii = (ii + 1);
  }
  const __ring_iter_81 = __List_Iterable.iter(scc_groups);
  while (true) {
    const __ring_next_81 = __ListIterator_Iterator.next(__ring_iter_81);
    if (__ring_next_81._tag === "none") break;
    const scc_group = __ring_next_81._0;
    const __ring_iter_82 = __List_Iterable.iter(scc_group);
    while (true) {
      const __ring_next_82 = __ListIterator_Iterator.next(__ring_iter_82);
      if (__ring_next_82._tag === "none") break;
      const name = __ring_next_82._0;
      __ring_match100: {
        const __ring_m100 = _Map_get(fn_name_to_idx, name);
        if (__ring_m100._tag === "some") {
          const i = __ring_m100._0;
          if ((!_Set_contains(checked, i, __Int_Eq))) {
            __ring_match101: {
              const __ring_m101 = List_get(program.decls, i);
              if (__ring_m101._tag === "some") {
                const decl = __ring_m101._0;
                const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_one_decl_with_rebind(ctx, decl, hdecls, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
                _Set_insert(checked, i);
                break __ring_match101;
              }
              if (__ring_m101._tag === "none") {
                break __ring_match101;
              }
              __match_fail(__ring_m101);
            }
          }
          break __ring_match100;
        }
        if (__ring_m100._tag === "none") {
          break __ring_match100;
        }
        __match_fail(__ring_m100);
      }
    }
  }
  let ri = 0;
  const __ring_iter_83 = __List_Iterable.iter(program.decls);
  while (true) {
    const __ring_next_83 = __ListIterator_Iterator.next(__ring_iter_83);
    if (__ring_next_83._tag === "none") break;
    const decl = __ring_next_83._0;
    if ((!_Set_contains(checked, ri, __Int_Eq))) {
      const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_one_decl_with_rebind(ctx, decl, hdecls, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    }
    ri = (ri + 1);
  }
  check_default_effect_cycles(ctx, program.decls);
  return new hir$HProgram(hdecls, derived_impls, ctx.boxed_vars, []);
}

function check_one_decl(ctx, decl, hdecls, __ring_ev_fail) {
  const hd = check_decl(ctx, decl, __ring_ev_fail);
  __ring_match102: {
    const __ring_m102 = hd;
    if (__ring_m102._tag === "Fn") {
      const name = __ring_m102.name; const effects = __ring_m102.effects;
      if ((List_len(effects.effects) > 0)) {
        infer_ctx$update_fn_effects(ctx.env, name, effects);
      }
      break __ring_match102;
    }
    break __ring_match102;
  }
  let delegate_decls = [];
  __ring_match103: {
    const __ring_m103 = decl;
    if (__ring_m103._tag === "Impl") {
      const target_type = __ring_m103.target_type; const type_params = __ring_m103.type_params; const methods = __ring_m103.methods; const span = __ring_m103.span;
      const __ring_iter_84 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_84 = __ListIterator_Iterator.next(__ring_iter_84);
        if (__ring_next_84._tag === "none") break;
        const m = __ring_next_84._0;
        __ring_match104: {
          const __ring_m104 = m;
          if (__ring_m104._tag === "Delegate") {
            const field = __ring_m104.field; const trait_names = __ring_m104.trait_names; const dspan = __ring_m104.span;
            const delegate_impls = expand_delegate_impls(ctx, target_type, type_params, field, trait_names, dspan);
            const __ring_iter_85 = __List_Iterable.iter(delegate_impls);
            while (true) {
              const __ring_next_85 = __ListIterator_Iterator.next(__ring_iter_85);
              if (__ring_next_85._tag === "none") break;
              const di = __ring_next_85._0;
              List_push(delegate_decls, di);
            }
            break __ring_match104;
          }
          break __ring_match104;
        }
      }
      break __ring_match103;
    }
    break __ring_match103;
  }
  List_push(hdecls, hd);
  const __ring_iter_86 = __List_Iterable.iter(delegate_decls);
  while (true) {
    const __ring_next_86 = __ListIterator_Iterator.next(__ring_iter_86);
    if (__ring_next_86._tag === "none") break;
    const di = __ring_next_86._0;
    List_push(hdecls, di);
  }
}

function check_prelude_decl(ctx, decl, __ring_ev_fail) {
  const result = check_decl(ctx, decl, __ring_ev_fail);
  if (false) {
    __ring_ev_fail.raise(new infer_ctx$CompileError());
  }
  return result;
}

function resolve_type_expr_public(ctx, texpr) {
  return infer_ctx$resolve_type_expr(ctx, texpr);
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


export { check, resolve_type_expr_public, check_prelude_decl };