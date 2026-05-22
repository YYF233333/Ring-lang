import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst_map as env$apply_subst_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __IdGen_Eq as env$__IdGen_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __ImplEntry_Clone as env$__ImplEntry_Clone, __FnBound_Clone as env$__FnBound_Clone, __IdGen_Clone as env$__IdGen_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __IdGen_Ord as env$__IdGen_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __ImplEntry_Debug as env$__ImplEntry_Debug, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { get_or_create_methods as builtins$get_or_create_methods, register_builtins as builtins$register_builtins, register_hof_intrinsics as builtins$register_hof_intrinsics } from "./builtins.js";
import { check as infer_decl$check, resolve_type_expr_public as infer_decl$resolve_type_expr_public, check_prelude_decl as infer_decl$check_prelude_decl } from "./infer_decl.js";
import { new_infer_ctx as infer_ctx$new_infer_ctx, type_error as infer_ctx$type_error, merge_effects as infer_ctx$merge_effects, unify_at as infer_ctx$unify_at, free_type_vars as infer_ctx$free_type_vars, collect_free_vars as infer_ctx$collect_free_vars, free_type_vars_in_env as infer_ctx$free_type_vars_in_env, generalize as infer_ctx$generalize, update_fn_effects as infer_ctx$update_fn_effects, build_scheme_var_map as infer_ctx$build_scheme_var_map, resolve_dicts_from_scheme as infer_ctx$resolve_dicts_from_scheme, resolve_type_expr as infer_ctx$resolve_type_expr, resolve_self_type as infer_ctx$resolve_self_type, resolve_named_type as infer_ctx$resolve_named_type, bind_pattern as infer_ctx$bind_pattern, remove_fail_effect as infer_ctx$remove_fail_effect, remove_specific_fail_effect as infer_ctx$remove_specific_fail_effect, resolve_relative_qualifier as infer_ctx$resolve_relative_qualifier, InferResult as infer_ctx$InferResult, FnBoundsEntry as infer_ctx$FnBoundsEntry, CompileError as infer_ctx$CompileError, InferCtx as infer_ctx$InferCtx, __FnBoundsEntry_Eq as infer_ctx$__FnBoundsEntry_Eq, __CompileError_Eq as infer_ctx$__CompileError_Eq, __FnBoundsEntry_Clone as infer_ctx$__FnBoundsEntry_Clone, __CompileError_Clone as infer_ctx$__CompileError_Clone, __FnBoundsEntry_Ord as infer_ctx$__FnBoundsEntry_Ord, __CompileError_Ord as infer_ctx$__CompileError_Ord, __FnBoundsEntry_Debug as infer_ctx$__FnBoundsEntry_Debug, __CompileError_Debug as infer_ctx$__CompileError_Debug } from "./infer_ctx.js";
import { register_decl_public as infer_register$register_decl_public, insert_mod_aliases as infer_register$insert_mod_aliases, prefix_decl_name as infer_register$prefix_decl_name, register_decls_two_phase as infer_register$register_decls_two_phase, resolve_effect_expr as infer_register$resolve_effect_expr, resolve_declared_effects as infer_register$resolve_declared_effects } from "./infer_register.js";
import { extract_exports as exports$extract_exports, ModuleExports as exports$ModuleExports, TypeDef_StructDef_ as exports$TypeDef_StructDef_, TypeDef_EnumDef_ as exports$TypeDef_EnumDef_ } from "./exports.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0405 as codes$E0405, E0504 as codes$E0504, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, error_description as codes$error_description, error_category as codes$error_category } from "./codes.js";
import { PREC_NONE as parser$PREC_NONE, PREC_CATCH as parser$PREC_CATCH, PREC_LOGIC_OR as parser$PREC_LOGIC_OR, PREC_LOGIC_AND as parser$PREC_LOGIC_AND, PREC_EQUALITY as parser$PREC_EQUALITY, PREC_COMPARE as parser$PREC_COMPARE, PREC_RANGE as parser$PREC_RANGE, PREC_ADD_SUB as parser$PREC_ADD_SUB, PREC_MUL_DIV as parser$PREC_MUL_DIV, PREC_UNARY as parser$PREC_UNARY, PREC_POSTFIX as parser$PREC_POSTFIX, infix_precedence as parser$infix_precedence, expr_span as parser$expr_span, new_parser as parser$new_parser, parse as parser$parse, Parser as parser$Parser, __Parser_Clone as parser$__Parser_Clone, __Parser_Debug as parser$__Parser_Debug, Parser_peek as parser$Parser_peek, Parser_peek_at as parser$Parser_peek_at, Parser_advance as parser$Parser_advance, Parser_check as parser$Parser_check, Parser_try_consume as parser$Parser_try_consume, Parser_expect as parser$Parser_expect, Parser_at_end as parser$Parser_at_end, Parser_current_span_start as parser$Parser_current_span_start, Parser_make_span as parser$Parser_make_span, Parser_report_error as parser$Parser_report_error, Parser_error as parser$Parser_error, Parser_parse_program as parser$Parser_parse_program, Parser_parse_stmt as parser$Parser_parse_stmt, Parser_parse_while_stmt as parser$Parser_parse_while_stmt, Parser_parse_loop_stmt as parser$Parser_parse_loop_stmt, Parser_parse_for_in_stmt as parser$Parser_parse_for_in_stmt, Parser_parse_break_stmt as parser$Parser_parse_break_stmt, Parser_parse_continue_stmt as parser$Parser_parse_continue_stmt, Parser_parse_if_let_stmt as parser$Parser_parse_if_let_stmt, Parser_parse_binding_stmt as parser$Parser_parse_binding_stmt, Parser_parse_binding_body as parser$Parser_parse_binding_body, Parser_parse_return_stmt as parser$Parser_parse_return_stmt, Parser_parse_block_expr as parser$Parser_parse_block_expr, Parser_parse_use_decl as parser$Parser_parse_use_decl, Parser_parse_mod_block as parser$Parser_parse_mod_block, Parser_parse_decl as parser$Parser_parse_decl, Parser_parse_effect_list as parser$Parser_parse_effect_list, Parser_parse_effect_annotation as parser$Parser_parse_effect_annotation, Parser_parse_fn_decl as parser$Parser_parse_fn_decl, Parser_parse_const_decl as parser$Parser_parse_const_decl, Parser_parse_sig_block as parser$Parser_parse_sig_block, Parser_parse_extern_decl as parser$Parser_parse_extern_decl, Parser_parse_extern_fn_decl_body as parser$Parser_parse_extern_fn_decl_body, Parser_parse_extern_type_decl_body as parser$Parser_parse_extern_type_decl_body, Parser_parse_type_alias_decl as parser$Parser_parse_type_alias_decl, Parser_parse_struct_decl as parser$Parser_parse_struct_decl, Parser_parse_enum_decl as parser$Parser_parse_enum_decl, Parser_parse_impl_decl as parser$Parser_parse_impl_decl, Parser_parse_effect_decl as parser$Parser_parse_effect_decl, Parser_parse_test_decl as parser$Parser_parse_test_decl, Parser_parse_trait_decl as parser$Parser_parse_trait_decl, Parser_parse_expr as parser$Parser_parse_expr, Parser_parse_expr_no_struct as parser$Parser_parse_expr_no_struct, Parser_parse_expr_bp as parser$Parser_parse_expr_bp, Parser_parse_prefix as parser$Parser_parse_prefix, Parser_parse_dot_expr as parser$Parser_parse_dot_expr, Parser_parse_index_expr as parser$Parser_parse_index_expr, Parser_parse_call_expr as parser$Parser_parse_call_expr, Parser_parse_arg_list as parser$Parser_parse_arg_list, Parser_parse_catch_expr as parser$Parser_parse_catch_expr, Parser_parse_string_interp as parser$Parser_parse_string_interp, Parser_parse_if_expr as parser$Parser_parse_if_expr, Parser_parse_match_expr as parser$Parser_parse_match_expr, Parser_parse_match_arm as parser$Parser_parse_match_arm, Parser_parse_pattern as parser$Parser_parse_pattern, Parser_parse_handle_expr as parser$Parser_parse_handle_expr, Parser_parse_effect_handler as parser$Parser_parse_effect_handler, Parser_parse_lambda_expr as parser$Parser_parse_lambda_expr, Parser_parse_struct_literal as parser$Parser_parse_struct_literal, Parser_try_parse_type_args as parser$Parser_try_parse_type_args, Parser_parse_type_expr as parser$Parser_parse_type_expr, Parser_parse_record_type_expr as parser$Parser_parse_record_type_expr, Parser_parse_type_params as parser$Parser_parse_type_params, Parser_parse_type_bound as parser$Parser_parse_type_bound, Parser_parse_params as parser$Parser_parse_params, Parser_parse_param as parser$Parser_parse_param } from "./parser.js";
import { new_union_find as union_find$new_union_find, uf_find as union_find$uf_find, uf_bind as union_find$uf_bind, uf_lookup as union_find$uf_lookup, uf_union as union_find$uf_union, uf_insert as union_find$uf_insert, UnionFind as union_find$UnionFind } from "./union_find.js";
import { empty_subst as unify$empty_subst, occurs_in as unify$occurs_in, unify_effect_rows as unify$unify_effect_rows, unify as unify$unify, UnificationError as unify$UnificationError, __UnificationError_Eq as unify$__UnificationError_Eq, __UnificationError_Clone as unify$__UnificationError_Clone, __UnificationError_Ord as unify$__UnificationError_Ord, __UnificationError_Debug as unify$__UnificationError_Debug } from "./unify.js";

function List_first(self) {
  return List_get(self, 0);
}
function List_last(self) {
  return List_get(self, (List_len(self) - 1));
}
function List_is_empty(self) {
  return (List_len(self) === 0);
}

function List_contains(self, item, __ring_T_Eq) {
  for (const x of self) {
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

function _Map_is_empty(self) {
  return (_Map_len(self) === 0);
}

function _Set_is_empty(self) {
  return (_Set_len(self) === 0);
}

function _Set_contains(self, item, __ring_T_Eq) {
  const items = _Set_to_list(self);
  for (const x of items) {
    if (__ring_T_Eq.eq(x, item)) {
      return true;
    }
  }
  return false;
}

class CheckResult {
  constructor(program, env) {
    this.program = program;
    this.env = env;
  }
}

const STD_FILES = ["io.ring", "list.ring", "map.ring", "set.ring", "str.ring", "num.ring", "fs.ring", "path.ring", "process.ring"];

function find_std_dir() {
  const candidates = [path_resolve(path_join(path_dirname(path_resolve(".")), "std")), path_resolve("std")];
  for (const dir of candidates) {
    if (file_exists(dir)) {
      return Option_some(dir);
    }
  }
  return Option_none;
}

function load_prelude(ctx) {
  let prelude_hdecls = [];
  __ring_match1: {
    const __ring_m1 = find_std_dir();
    if (__ring_m1._tag === "some") {
      const std_dir = __ring_m1._0;
      let all_prelude_decls = [];
      for (const file of STD_FILES) {
        const file_path = path_join(std_dir, file);
        if (file_exists(file_path)) {
          const source = read_file(file_path);
          const prelude_sink = diagnostics$new_collecting_sink();
          const ast = parser$parse(source, file_path, prelude_sink);
          for (const decl of ast.decls) {
            infer_register$register_decl_public(ctx, decl);
            List_push(all_prelude_decls, decl);
          }
        }
      }
      for (const decl of all_prelude_decls) {
        __ring_match2: {
          const __ring_m2 = decl;
          if (__ring_m2._tag === "Impl") {
            const target_type = __ring_m2.target_type; const type_params = __ring_m2.type_params; const trait_name = __ring_m2.trait_name; const methods = __ring_m2.methods; const span = __ring_m2.span;
            let fn_methods = [];
            for (const m of methods) {
              __ring_match3: {
                const __ring_m3 = m;
                if (__ring_m3._tag === "Fn") {
                  List_push(fn_methods, m);
                  break __ring_match3;
                }
                break __ring_match3;
              }
            }
            if ((List_len(fn_methods) > 0)) {
              const saved_tp_scope = map_clone(ctx.type_param_scope);
              for (const tp of type_params) {
                const tv = env$TypeEnv_fresh_var(ctx.env);
                _Map_insert(ctx.type_param_scope, tp.name, tv);
              }
              const filtered_decl = ast$Decl_Impl(target_type, type_params, trait_name, fn_methods, span);
              const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_decl$check_prelude_decl(ctx, filtered_decl, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
              __ring_match4: {
                const __ring_m4 = result;
                if (__ring_m4._tag === "some") {
                  const hd = __ring_m4._0;
                  List_push(prelude_hdecls, hd);
                  break __ring_match4;
                }
                if (__ring_m4._tag === "none") {
                  break __ring_match4;
                }
                __match_fail(__ring_m4);
              }
              ctx.type_param_scope = saved_tp_scope;
            }
            break __ring_match2;
          }
          if (__ring_m2._tag === "Fn") {
            const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_decl$check_prelude_decl(ctx, decl, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
            __ring_match5: {
              const __ring_m5 = result;
              if (__ring_m5._tag === "some") {
                const hd = __ring_m5._0;
                List_push(prelude_hdecls, hd);
                break __ring_match5;
              }
              if (__ring_m5._tag === "none") {
                break __ring_match5;
              }
              __match_fail(__ring_m5);
            }
            break __ring_match2;
          }
          break __ring_match2;
        }
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "none") {
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
  return prelude_hdecls;
}

function new_infer_ctx(sink) {
  let env = env$new_type_env();
  builtins$register_builtins(env);
  builtins$register_hof_intrinsics(env);
  return new infer_ctx$InferCtx(env, unify$empty_subst(), sink, map_new(), Option_none, [], [], 0, [], map_new());
}

function check(program, sink) {
  let ctx = new_infer_ctx(sink);
  const prelude_hdecls = load_prelude(ctx);
  const hprogram = infer_decl$check(ctx, program);
  let all_decls = list_clone(prelude_hdecls);
  for (const d of hprogram.decls) {
    List_push(all_decls, d);
  }
  return new CheckResult(new hir$HProgram(all_decls, hprogram.derived_impls), ctx.env);
}

function check_module(program, module_exports, sink) {
  let ctx = new_infer_ctx(sink);
  const prelude_hdecls = load_prelude(ctx);
  inject_module_exports(ctx, module_exports);
  resolve_uses(ctx, program.uses, module_exports);
  const hprogram = infer_decl$check(ctx, program);
  let all_decls = list_clone(prelude_hdecls);
  for (const d of hprogram.decls) {
    List_push(all_decls, d);
  }
  return new CheckResult(new hir$HProgram(all_decls, hprogram.derived_impls), ctx.env);
}

function inject_module_exports(ctx, exports) {
  for (const mod_ of exports) {
    for (const entry of _Map_entries(mod_.types)) {
      const __ring_dt0 = entry;
      const name = __ring_dt0[0];
      const def = __ring_dt0[1];
      __ring_match6: {
        const __ring_m6 = def;
        if (__ring_m6._tag === "StructDef_") {
          const sdef = __ring_m6._0;
          _Map_insert(ctx.env.types.structs, name, sdef);
          break __ring_match6;
        }
        if (__ring_m6._tag === "EnumDef_") {
          const edef = __ring_m6._0;
          _Map_insert(ctx.env.types.enums, name, edef);
          for (const v of edef.variants) {
            _Map_insert(ctx.env.types.variant_to_enum, v.name, name);
          }
          break __ring_match6;
        }
        __match_fail(__ring_m6);
      }
    }
    for (const entry of _Map_entries(mod_.effects)) {
      const __ring_dt1 = entry;
      const name = __ring_dt1[0];
      const effdef = __ring_dt1[1];
      _Map_insert(ctx.env.types.effects, name, effdef);
    }
    for (const entry of _Map_entries(mod_.traits)) {
      const __ring_dt2 = entry;
      const name = __ring_dt2[0];
      const tdef = __ring_dt2[1];
      _Map_insert(ctx.env.trait_reg.traits, name, tdef);
    }
    for (const impl_ of mod_.trait_impls) {
      List_push(ctx.env.trait_reg.trait_impls, impl_);
    }
    for (const entry of _Map_entries(mod_.impl_methods)) {
      const __ring_dt3 = entry;
      const type_name = __ring_dt3[0];
      const methods = __ring_dt3[1];
      __ring_match7: {
        const __ring_m7 = _Map_get(ctx.env.trait_reg.impl_methods, type_name);
        if (__ring_m7._tag === "some") {
          const existing = __ring_m7._0;
          for (const mentry of _Map_entries(methods)) {
            const __ring_dt4 = mentry;
            const method_name = __ring_dt4[0];
            const scheme = __ring_dt4[1];
            _Map_insert(existing, method_name, scheme);
          }
          break __ring_match7;
        }
        if (__ring_m7._tag === "none") {
          _Map_insert(ctx.env.trait_reg.impl_methods, type_name, map_clone(methods));
          break __ring_match7;
        }
        __match_fail(__ring_m7);
      }
    }
  }
}

function resolve_uses(ctx, uses, available_modules) {
  let module_map = map_new();
  for (const mod_ of available_modules) {
    _Map_insert(module_map, mod_.module_key, mod_);
  }
  for (const use_decl of uses) {
    const first_seg = Option_unwrap_or(List_get(use_decl.path.segments, 0), "");
    if (((first_seg === "self") || (first_seg === "super"))) {
      const d = diagnostics$make_diag(codes$E0705, diagnostics$Severity_SevError, `Cannot use '${first_seg}::' at file level — relative paths are only supported inside mod blocks`, use_decl.path.span, diagnostics$DiagnosticContext_OtherContext(Option_some("relative path out of scope")));
      diagnostics$CollectingSink_report(ctx.sink, d);
      continue;
    }
    const mod_key = List_join(use_decl.path.segments, "::");
    __ring_match8: {
      const __ring_m8 = _Map_get(module_map, mod_key);
      if (__ring_m8._tag === "none") {
        const d = diagnostics$make_diag(codes$E0702, diagnostics$Severity_SevError, `Module '${mod_key}' not found`, use_decl.path.span, diagnostics$DiagnosticContext_OtherContext(Option_some("module not found")));
        diagnostics$CollectingSink_report(ctx.sink, d);
        break __ring_match8;
      }
      if (__ring_m8._tag === "some") {
        const mod_ = __ring_m8._0;
        __ring_match9: {
          const __ring_m9 = use_decl.imports;
          if (__ring_m9._tag === "NamedItems") {
            const names = __ring_m9.names;
            for (const item of names) {
              const local_name = (function() {
  const __ring_m = item.alias;
  if (__ring_m._tag === "some") { const a = __ring_m._0; return a; }
  if (__ring_m._tag === "none") { return item.name; }
  __match_fail(__ring_m);
})();
              let found = false;
              __ring_match10: {
                const __ring_m10 = _Map_get(mod_.values, item.name);
                if (__ring_m10._tag === "some") {
                  const scheme = __ring_m10._0;
                  env$TypeEnv_bind(ctx.env, local_name, scheme);
                  found = true;
                  break __ring_match10;
                }
                if (__ring_m10._tag === "none") {
                  break __ring_match10;
                }
                __match_fail(__ring_m10);
              }
              __ring_match11: {
                const __ring_m11 = _Map_get(mod_.types, item.name);
                if (__ring_m11._tag === "some") {
                  const tdef = __ring_m11._0;
                  found = true;
                  __ring_match12: {
                    const __ring_m12 = tdef;
                    if (__ring_m12._tag === "EnumDef_") {
                      const edef = __ring_m12._0;
                      for (const v of edef.variants) {
                        __ring_match13: {
                          const __ring_m13 = _Map_get(mod_.values, v.name);
                          if (__ring_m13._tag === "some") {
                            const vscheme = __ring_m13._0;
                            env$TypeEnv_bind(ctx.env, v.name, vscheme);
                            break __ring_match13;
                          }
                          if (__ring_m13._tag === "none") {
                            break __ring_match13;
                          }
                          __match_fail(__ring_m13);
                        }
                      }
                      break __ring_match12;
                    }
                    break __ring_match12;
                  }
                  break __ring_match11;
                }
                if (__ring_m11._tag === "none") {
                  break __ring_match11;
                }
                __match_fail(__ring_m11);
              }
              if (_Map_contains_key(mod_.effects, item.name)) {
                found = true;
              }
              if (_Map_contains_key(mod_.traits, item.name)) {
                found = true;
              }
              if ((found === false)) {
                const d = diagnostics$make_diag(codes$E0703, diagnostics$Severity_SevError, `Symbol '${item.name}' not found in module '${mod_key}'`, item.span, diagnostics$DiagnosticContext_OtherContext(Option_some("symbol not found")));
                diagnostics$CollectingSink_report(ctx.sink, d);
              }
            }
            break __ring_match9;
          }
          if (__ring_m9._tag === "Module") {
            for (const entry of _Map_entries(mod_.values)) {
              const __ring_dt5 = entry;
              const name = __ring_dt5[0];
              const scheme = __ring_dt5[1];
              env$TypeEnv_bind(ctx.env, name, scheme);
            }
            for (const entry of _Map_entries(mod_.types)) {
              const __ring_dt6 = entry;
              const tdef = __ring_dt6[1];
              __ring_match14: {
                const __ring_m14 = tdef;
                if (__ring_m14._tag === "EnumDef_") {
                  const edef = __ring_m14._0;
                  for (const v of edef.variants) {
                    __ring_match15: {
                      const __ring_m15 = _Map_get(mod_.values, v.name);
                      if (__ring_m15._tag === "some") {
                        const vscheme = __ring_m15._0;
                        env$TypeEnv_bind(ctx.env, v.name, vscheme);
                        break __ring_match15;
                      }
                      if (__ring_m15._tag === "none") {
                        break __ring_match15;
                      }
                      __match_fail(__ring_m15);
                    }
                  }
                  break __ring_match14;
                }
                break __ring_match14;
              }
            }
            break __ring_match9;
          }
          __match_fail(__ring_m9);
        }
        break __ring_match8;
      }
      __match_fail(__ring_m8);
    }
  }
}

function __StringBuilder_Eq_eq(self, other) {
  return true;
}
const __StringBuilder_Eq = { eq: __StringBuilder_Eq_eq, ne: function(self, other) { return !__StringBuilder_Eq_eq(self, other); } };

function __StringBuilder_Clone_clone(self) {
  return new StringBuilder();
}
const __StringBuilder_Clone = { clone: __StringBuilder_Clone_clone };

function __StringBuilder_Ord_cmp(self, other) {
  return 0;
}
const __StringBuilder_Ord = { cmp: __StringBuilder_Ord_cmp };

function __StringBuilder_Debug_debug(self) {
  return "StringBuilder";
}
const __StringBuilder_Debug = { debug: __StringBuilder_Debug_debug };


export { CheckResult, check, check_module };