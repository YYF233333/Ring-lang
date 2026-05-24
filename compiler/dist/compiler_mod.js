import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { register_decl_public as infer_register$register_decl_public, insert_mod_aliases as infer_register$insert_mod_aliases, prefix_decl_name as infer_register$prefix_decl_name, register_decls_two_phase as infer_register$register_decls_two_phase, collect_all_supertraits as infer_register$collect_all_supertraits, resolve_effect_expr as infer_register$resolve_effect_expr, resolve_declared_effects as infer_register$resolve_declared_effects } from "./infer_register.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __DictRef_Clone as hir$__DictRef_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { format_human as formatter$format_human, format_llm as formatter$format_llm } from "./formatter.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst_map as env$apply_subst_map, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, AssocTypeDef as env$AssocTypeDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, EffectAliasDef as env$EffectAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __IdGen_Eq as env$__IdGen_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __FnBound_Clone as env$__FnBound_Clone, __IdGen_Clone as env$__IdGen_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __IdGen_Ord as env$__IdGen_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { check as checker$check, check_module as checker$check_module, CheckResult as checker$CheckResult } from "./checker.js";
import { generate as codegen$generate } from "./codegen.js";
import { safe_ident as codegen_ctx$safe_ident, new_codegen_ctx as codegen_ctx$new_codegen_ctx, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, push_indent as codegen_ctx$push_indent, pop_indent as codegen_ctx$pop_indent, qualify as codegen_ctx$qualify, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";
import { RUNTIME_CODE as runtime$RUNTIME_CODE, RUNTIME_EXPORT_NAMES as runtime$RUNTIME_EXPORT_NAMES, runtime_esm_code as runtime$runtime_esm_code } from "./runtime.js";
import { module_key as resolver$module_key, module_prefix as resolver$module_prefix, resolve_module_file as resolver$resolve_module_file, build_module_graph as resolver$build_module_graph, ModuleId as resolver$ModuleId, ModuleGraph as resolver$ModuleGraph, GraphError as resolver$GraphError, __ModuleId_Clone as resolver$__ModuleId_Clone, __GraphError_Clone as resolver$__GraphError_Clone, __ModuleId_Debug as resolver$__ModuleId_Debug, __GraphError_Debug as resolver$__GraphError_Debug } from "./resolver.js";
import { extract_exports as exports$extract_exports, ModuleExports as exports$ModuleExports, TypeDef_StructDef_ as exports$TypeDef_StructDef_, TypeDef_EnumDef_ as exports$TypeDef_EnumDef_ } from "./exports.js";

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

class CompileProjectResult {
  constructor(js, success) {
    this.js = js;
    this.success = success;
  }
}

class EsmCompileResult {
  constructor(success, entry_js_path) {
    this.success = success;
    this.entry_js_path = entry_js_path;
  }
}

class CompilePhaseResult {
  constructor(graph, module_asts, module_hirs, module_exports_map) {
    this.graph = graph;
    this.module_asts = module_asts;
    this.module_hirs = module_hirs;
    this.module_exports_map = module_exports_map;
  }
}

function compile_phases(entry_file) {
  __ring_match6: {
    const __ring_m6 = resolver$build_module_graph(entry_file);
    if (__ring_m6._tag === "none") {
      return Option_none;
      break __ring_match6;
    }
    if (__ring_m6._tag === "some") {
      const graph = __ring_m6._0;
      let module_asts = map_new();
      let module_hirs = map_new();
      let module_exports_map = map_new();
      for (const key of graph.topo_order) {
        __ring_match7: {
          const __ring_m7 = _Map_get(graph.asts, key);
          if (__ring_m7._tag === "some") {
            const ast = __ring_m7._0;
            _Map_insert(module_asts, key, ast);
            break __ring_match7;
          }
          if (__ring_m7._tag === "none") {
            break __ring_match7;
          }
          __match_fail(__ring_m7);
        }
      }
      let check_ok = true;
      for (const key of graph.topo_order) {
        if (check_ok) {
          __ring_match8: {
            const __ring_m8 = _Map_get(module_asts, key);
            if (__ring_m8._tag === "some") {
              const ast = __ring_m8._0;
              const sink = diagnostics$new_collecting_sink();
              const deps = (function() {
  const __ring_m = _Map_get(graph.dependencies, key);
  if (__ring_m._tag === "some") { const dk = __ring_m._0; return dk; }
  if (__ring_m._tag === "none") { return empty_str_list(); }
  __match_fail(__ring_m);
})();
              let dep_exports = empty_module_exports_list();
              for (const dk of deps) {
                __ring_match9: {
                  const __ring_m9 = _Map_get(module_exports_map, dk);
                  if (__ring_m9._tag === "some") {
                    const e = __ring_m9._0;
                    List_push(dep_exports, e);
                    break __ring_match9;
                  }
                  if (__ring_m9._tag === "none") {
                    break __ring_match9;
                  }
                  __match_fail(__ring_m9);
                }
              }
              const result = checker$check_module(ast, dep_exports, sink);
              if (diagnostics$CollectingSink_has_errors(sink)) {
                const src = read_file((function() {
  const __ring_m = _Map_get(graph.modules, key);
  if (__ring_m._tag === "some") { const m = __ring_m._0; return m.file_path; }
  if (__ring_m._tag === "none") { return ""; }
  __match_fail(__ring_m);
})());
                eprintln(formatter$format_human(diagnostics$CollectingSink_diagnostics(sink), src));
                check_ok = false;
              } else {
                _Map_insert(module_hirs, key, result.program);
                __ring_match10: {
                  const __ring_m10 = _Map_get(graph.modules, key);
                  if (__ring_m10._tag === "some") {
                    const mod_ = __ring_m10._0;
                    const prefix = resolver$module_prefix(mod_.path_segments);
                    const exp = exports$extract_exports(key, prefix, ast, result.program, result.env);
                    _Map_insert(module_exports_map, key, exp);
                    break __ring_match10;
                  }
                  if (__ring_m10._tag === "none") {
                    break __ring_match10;
                  }
                  __match_fail(__ring_m10);
                }
              }
              break __ring_match8;
            }
            if (__ring_m8._tag === "none") {
              check_ok = false;
              break __ring_match8;
            }
            __match_fail(__ring_m8);
          }
        }
      }
      if ((check_ok === false)) {
        return Option_none;
      }
      return Option_some(new CompilePhaseResult(graph, module_asts, module_hirs, module_exports_map));
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function compile_project(entry_file) {
  __ring_match11: {
    const __ring_m11 = compile_phases(entry_file);
    if (__ring_m11._tag === "none") {
      return new CompileProjectResult("", false);
      break __ring_match11;
    }
    if (__ring_m11._tag === "some") {
      const phases = __ring_m11._0;
      const entry_key = resolver$module_key(phases.graph.entry.path_segments);
      let js_parts = [];
      let is_first = true;
      for (const key of phases.graph.topo_order) {
        __ring_match12: {
          const __ring_m12 = [_Map_get(phases.graph.modules, key), _Map_get(phases.module_hirs, key)];
          if (Array.isArray(__ring_m12) && __ring_m12.length === 2 && __ring_m12[0]._tag === "some" && __ring_m12[1]._tag === "some") {
            const mod_ = __ring_m12[0]._0; const hir = __ring_m12[1]._0;
            const prefix = resolver$module_prefix(mod_.path_segments);
            let imports_map = build_imports_map(phases.graph, phases.module_exports_map, key);
            const esf = build_external_struct_fields(phases.graph, phases.module_exports_map, key);
            const eim = build_external_impl_methods(phases.graph, phases.module_exports_map, key);
            const skip_preamble = (is_first === false);
            const skip_main = (key !== entry_key);
            const module_js = codegen$generate(hir, skip_preamble, skip_main, Option_some(prefix), Option_some(imports_map), Option_some(esf), Option_some(eim), Option_none, Option_none);
            List_push(js_parts, `// === module: ${key} ===`);
            List_push(js_parts, module_js);
            List_push(js_parts, "");
            is_first = false;
            break __ring_match12;
          }
          break __ring_match12;
        }
      }
      return new CompileProjectResult(List_join(js_parts, "\n"), true);
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
}

function compile_project_esm(entry_file, out_dir) {
  __ring_match13: {
    const __ring_m13 = compile_phases(entry_file);
    if (__ring_m13._tag === "none") {
      return new EsmCompileResult(false, "");
      break __ring_match13;
    }
    if (__ring_m13._tag === "some") {
      const phases = __ring_m13._0;
      const entry_key = resolver$module_key(phases.graph.entry.path_segments);
      const runtime_path = path_join(out_dir, "__ring_runtime.js");
      write_file(runtime_path, runtime$runtime_esm_code());
      let entry_js_path = "";
      for (const key of phases.graph.topo_order) {
        __ring_match14: {
          const __ring_m14 = [_Map_get(phases.graph.modules, key), _Map_get(phases.module_hirs, key), _Map_get(phases.module_asts, key)];
          if (Array.isArray(__ring_m14) && __ring_m14.length === 3 && __ring_m14[0]._tag === "some" && __ring_m14[1]._tag === "some" && __ring_m14[2]._tag === "some") {
            const mod_ = __ring_m14[0]._0; const hir = __ring_m14[1]._0; const ast = __ring_m14[2]._0;
            const mod_relative = Str_replace(mod_.file_path, ".ring", ".js");
            const mod_out_path = path_join(out_dir, path_basename(mod_relative));
            let imports_map = build_imports_map(phases.graph, phases.module_exports_map, key);
            const esf = build_external_struct_fields(phases.graph, phases.module_exports_map, key);
            const eim = build_external_impl_methods(phases.graph, phases.module_exports_map, key);
            let import_lines = build_esm_import_lines(phases.graph, phases.module_exports_map, key);
            register_use_aliases(ast, imports_map);
            resolve_extern_fn_imports(ast, key, phases.graph, phases.module_exports_map, imports_map, import_lines);
            let export_names = build_esm_export_names(ast, hir);
            const reexport_aliases = build_pub_use_reexports(ast, phases.module_exports_map, export_names);
            for (const ra of reexport_aliases) {
              List_push(import_lines, ra);
            }
            const skip_main = (key !== entry_key);
            const module_js = codegen$generate(hir, true, skip_main, Option_none, Option_some(imports_map), Option_some(esf), Option_some(eim), Option_some(import_lines), Option_some(export_names));
            write_file(mod_out_path, module_js);
            if ((key === entry_key)) {
              entry_js_path = mod_out_path;
            }
            break __ring_match14;
          }
          break __ring_match14;
        }
      }
      return new EsmCompileResult(true, entry_js_path);
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
}

function build_esm_import_lines(graph, exports_map, key) {
  let import_lines = [];
  const runtime_names = runtime$RUNTIME_EXPORT_NAMES;
  const rnames_joined = List_join(runtime_names, ", ");
  List_push(import_lines, `import { ${rnames_joined} } from "./__ring_runtime.js";`);
  const deps = (function() {
  const __ring_m = _Map_get(graph.dependencies, key);
  if (__ring_m._tag === "some") { const d = __ring_m._0; return d; }
  if (__ring_m._tag === "none") { return empty_str_list(); }
  __match_fail(__ring_m);
})();
  for (const dk of deps) {
    __ring_match15: {
      const __ring_m15 = [_Map_get(exports_map, dk), _Map_get(graph.modules, dk)];
      if (Array.isArray(__ring_m15) && __ring_m15.length === 2 && __ring_m15[0]._tag === "some" && __ring_m15[1]._tag === "some") {
        const dep_exports = __ring_m15[0]._0; const dep_mod = __ring_m15[1]._0;
        const dep_prefix = dep_exports.module_prefix;
        const dep_js = path_basename(Str_replace(dep_mod.file_path, ".ring", ".js"));
        const import_pairs = build_dep_import_pairs(dep_exports, dep_prefix);
        if ((List_len(import_pairs) > 0)) {
          const joined = List_join(import_pairs, ", ");
          List_push(import_lines, `import { ${joined} } from "./${dep_js}";`);
        }
        break __ring_match15;
      }
      break __ring_match15;
    }
  }
  return import_lines;
}

function build_dep_import_pairs(dep_exports, dep_prefix) {
  let import_pairs = [];
  let bare_variants = set_new();
  for (const tentry of _Map_entries(dep_exports.types)) {
    const __ring_dt0 = tentry;
    const tdef = __ring_dt0[1];
    __ring_match16: {
      const __ring_m16 = tdef;
      if (__ring_m16._tag === "EnumDef_") {
        const edef = __ring_m16._0;
        for (const v of edef.variants) {
          _Set_insert(bare_variants, v.name);
        }
        break __ring_match16;
      }
      break __ring_match16;
    }
  }
  for (const ventry of _Map_entries(dep_exports.values)) {
    const __ring_dt1 = ventry;
    const name = __ring_dt1[0];
    if (((!_Set_contains(dep_exports.extern_values, name, __Str_Eq)) && (!_Set_contains(bare_variants, name, __Str_Eq)))) {
      const si = codegen_ctx$safe_ident(name);
      const alias = `${dep_prefix}$${si}`;
      List_push(import_pairs, `${si} as ${alias}`);
    }
  }
  for (const tentry of _Map_entries(dep_exports.types)) {
    const __ring_dt2 = tentry;
    const name = __ring_dt2[0];
    const tdef = __ring_dt2[1];
    const si = codegen_ctx$safe_ident(name);
    __ring_match17: {
      const __ring_m17 = tdef;
      if (__ring_m17._tag === "EnumDef_") {
        const edef = __ring_m17._0;
        for (const v of edef.variants) {
          const valias = `${dep_prefix}$${si}_${v.name}`;
          List_push(import_pairs, `${si}_${v.name} as ${valias}`);
        }
        break __ring_match17;
      }
      if (__ring_m17._tag === "StructDef_") {
        const alias = `${dep_prefix}$${si}`;
        List_push(import_pairs, `${si} as ${alias}`);
        break __ring_match17;
      }
      __match_fail(__ring_m17);
    }
  }
  for (const impl_ of dep_exports.trait_impls) {
    const dict_js = hir$trait_dict_name(codegen_ctx$safe_ident(impl_.target_type_name), codegen_ctx$safe_ident(impl_.trait_name));
    const alias = `${dep_prefix}$${dict_js}`;
    List_push(import_pairs, `${dict_js} as ${alias}`);
  }
  for (const ientry of _Map_entries(dep_exports.inherent_methods)) {
    const __ring_dt3 = ientry;
    const type_name = __ring_dt3[0];
    const method_names = __ring_dt3[1];
    for (const mname of method_names) {
      const method_js = `${codegen_ctx$safe_ident(type_name)}_${mname}`;
      const alias = `${dep_prefix}$${method_js}`;
      List_push(import_pairs, `${method_js} as ${alias}`);
    }
  }
  return import_pairs;
}

function register_use_aliases(ast, imports_map) {
  for (const use_decl of ast.uses) {
    __ring_match18: {
      const __ring_m18 = use_decl.imports;
      if (__ring_m18._tag === "NamedItems") {
        const names = __ring_m18.names;
        for (const item of names) {
          __ring_match19: {
            const __ring_m19 = item.alias;
            if (__ring_m19._tag === "some") {
              const alias = __ring_m19._0;
              __ring_match20: {
                const __ring_m20 = _Map_get(imports_map, item.name);
                if (__ring_m20._tag === "some") {
                  const existing = __ring_m20._0;
                  _Map_insert(imports_map, alias, existing);
                  break __ring_match20;
                }
                if (__ring_m20._tag === "none") {
                  break __ring_match20;
                }
                __match_fail(__ring_m20);
              }
              break __ring_match19;
            }
            if (__ring_m19._tag === "none") {
              break __ring_match19;
            }
            __match_fail(__ring_m19);
          }
        }
        break __ring_match18;
      }
      break __ring_match18;
    }
  }
}

function resolve_extern_fn_imports(ast, key, graph, exports_map, imports_map, import_lines) {
  for (const decl of ast.decls) {
    __ring_match21: {
      const __ring_m21 = decl;
      if (__ring_m21._tag === "ExternFn") {
        const name = __ring_m21.name;
        if ((!_Map_contains_key(imports_map, name))) {
          for (const eentry of _Map_entries(exports_map)) {
            const __ring_dt4 = eentry;
            const other_key = __ring_dt4[0];
            const other_exports = __ring_dt4[1];
            if ((((other_key !== key) && _Map_contains_key(other_exports.values, name)) && (!_Set_contains(other_exports.extern_values, name, __Str_Eq)))) {
              __ring_match22: {
                const __ring_m22 = _Map_get(graph.modules, other_key);
                if (__ring_m22._tag === "some") {
                  const other_mod = __ring_m22._0;
                  const other_js = path_basename(Str_replace(other_mod.file_path, ".ring", ".js"));
                  const other_prefix = other_exports.module_prefix;
                  const si = codegen_ctx$safe_ident(name);
                  const alias = `${other_prefix}$${si}`;
                  _Map_insert(imports_map, name, alias);
                  List_push(import_lines, `import { ${si} as ${alias} } from "./${other_js}";`);
                  break __ring_match22;
                }
                if (__ring_m22._tag === "none") {
                  break __ring_match22;
                }
                __match_fail(__ring_m22);
              }
            }
          }
        }
        break __ring_match21;
      }
      break __ring_match21;
    }
  }
}

function build_esm_export_names(ast, hir) {
  let export_names = [];
  for (const decl of ast.decls) {
    collect_pub_decl_exports(decl, export_names);
  }
  for (const decl of ast.decls) {
    collect_impl_exports(decl, ast.decls, export_names);
  }
  for (const di of hir.derived_impls) {
    if (is_pub_type_in_decls(di.type_name, ast.decls)) {
      List_push(export_names, hir$trait_dict_name(codegen_ctx$safe_ident(di.type_name), codegen_ctx$safe_ident(di.trait_name)));
    }
  }
  return export_names;
}

function is_pub_type_in_decls(type_name, decls) {
  let result = false;
  for (const d of decls) {
    __ring_match23: {
      const __ring_m23 = d;
      if (__ring_m23._tag === "Struct") {
        const dn = __ring_m23.name; const dp = __ring_m23.is_pub;
        if (((dn === type_name) && dp)) {
          result = true;
        }
        break __ring_match23;
      }
      if (__ring_m23._tag === "Enum") {
        const dn = __ring_m23.name; const dp = __ring_m23.is_pub;
        if (((dn === type_name) && dp)) {
          result = true;
        }
        break __ring_match23;
      }
      if (__ring_m23._tag === "ModBlock") {
        const mod_name = __ring_m23.name; const mod_decls = __ring_m23.decls; const mpub = __ring_m23.is_pub;
        if (mpub) {
          for (const sd of mod_decls) {
            const prefixed = infer_register$prefix_decl_name(mod_name, sd);
            __ring_match24: {
              const __ring_m24 = prefixed;
              if (__ring_m24._tag === "Struct") {
                const sn = __ring_m24.name; const sp = __ring_m24.is_pub;
                if (((sn === type_name) && sp)) {
                  result = true;
                }
                break __ring_match24;
              }
              if (__ring_m24._tag === "Enum") {
                const en = __ring_m24.name; const ep = __ring_m24.is_pub;
                if (((en === type_name) && ep)) {
                  result = true;
                }
                break __ring_match24;
              }
              break __ring_match24;
            }
          }
        }
        break __ring_match23;
      }
      break __ring_match23;
    }
  }
  return result;
}

function collect_pub_decl_exports(decl, export_names) {
  __ring_match25: {
    const __ring_m25 = decl;
    if (__ring_m25._tag === "Fn") {
      const name = __ring_m25.name; const is_pub = __ring_m25.is_pub;
      if (is_pub) {
        return List_push(export_names, codegen_ctx$safe_ident(name));
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "Struct") {
      const name = __ring_m25.name; const is_pub = __ring_m25.is_pub;
      if (is_pub) {
        return List_push(export_names, codegen_ctx$safe_ident(name));
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "Enum") {
      const name = __ring_m25.name; const is_pub = __ring_m25.is_pub; const variants = __ring_m25.variants;
      if (is_pub) {
        for (const v of variants) {
          const sn = codegen_ctx$safe_ident(name);
          List_push(export_names, `${sn}_${v.name}`);
        }
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "Const") {
      const name = __ring_m25.name; const is_pub = __ring_m25.is_pub;
      if (is_pub) {
        return List_push(export_names, codegen_ctx$safe_ident(name));
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "ModBlock") {
      const mod_name = __ring_m25.name; const mod_decls = __ring_m25.decls; const mpub = __ring_m25.is_pub;
      if (mpub) {
        for (const subdecl of mod_decls) {
          const prefixed = infer_register$prefix_decl_name(mod_name, subdecl);
          collect_pub_decl_exports(prefixed, export_names);
        }
      }
      break __ring_match25;
    }
    break __ring_match25;
  }
}

function collect_impl_exports(decl, all_decls, export_names) {
  __ring_match26: {
    const __ring_m26 = decl;
    if (__ring_m26._tag === "Impl") {
      const target_type = __ring_m26.target_type; const impl_trait = __ring_m26.trait_name; const methods = __ring_m26.methods;
      if (is_pub_type_in_decls(target_type, all_decls)) {
        __ring_match27: {
          const __ring_m27 = impl_trait;
          if (__ring_m27._tag === "some") {
            const tn = __ring_m27._0;
            return List_push(export_names, hir$trait_dict_name(codegen_ctx$safe_ident(target_type), codegen_ctx$safe_ident(tn)));
            break __ring_match27;
          }
          if (__ring_m27._tag === "none") {
            for (const m of methods) {
              __ring_match28: {
                const __ring_m28 = m;
                if (__ring_m28._tag === "Fn") {
                  const mn = __ring_m28.name;
                  List_push(export_names, `${codegen_ctx$safe_ident(target_type)}_${mn}`);
                  break __ring_match28;
                }
                break __ring_match28;
              }
            }
            break __ring_match27;
          }
          __match_fail(__ring_m27);
        }
      }
      break __ring_match26;
    }
    if (__ring_m26._tag === "ModBlock") {
      const mod_name = __ring_m26.name; const mod_decls = __ring_m26.decls; const mpub = __ring_m26.is_pub;
      if (mpub) {
        for (const subdecl of mod_decls) {
          const prefixed = infer_register$prefix_decl_name(mod_name, subdecl);
          collect_impl_exports(prefixed, all_decls, export_names);
        }
      }
      break __ring_match26;
    }
    break __ring_match26;
  }
}

function build_pub_use_reexports(ast, exports_map, export_names) {
  let reexport_aliases = [];
  for (const use_decl of ast.uses) {
    if (use_decl.is_pub) {
      const src_key = List_join(use_decl.path.segments, "::");
      __ring_match29: {
        const __ring_m29 = _Map_get(exports_map, src_key);
        if (__ring_m29._tag === "some") {
          const src_exports = __ring_m29._0;
          const src_prefix = src_exports.module_prefix;
          __ring_match30: {
            const __ring_m30 = use_decl.imports;
            if (__ring_m30._tag === "NamedItems") {
              const names = __ring_m30.names;
              collect_named_reexports(names, src_exports, src_prefix, export_names, reexport_aliases);
              break __ring_match30;
            }
            if (__ring_m30._tag === "Module") {
              collect_module_reexports(src_exports, src_prefix, export_names, reexport_aliases);
              break __ring_match30;
            }
            __match_fail(__ring_m30);
          }
          break __ring_match29;
        }
        if (__ring_m29._tag === "none") {
          break __ring_match29;
        }
        __match_fail(__ring_m29);
      }
    }
  }
  return reexport_aliases;
}

function collect_named_reexports(names, src_exports, src_prefix, export_names, reexport_aliases) {
  for (const item of names) {
    const local_name = (function() {
  const __ring_m = item.alias;
  if (__ring_m._tag === "some") { const a = __ring_m._0; return a; }
  if (__ring_m._tag === "none") { return item.name; }
  __match_fail(__ring_m);
})();
    const src_js = (_Set_contains(src_exports.extern_values, item.name, __Str_Eq) ? codegen_ctx$safe_ident(item.name) : `${src_prefix}$${codegen_ctx$safe_ident(item.name)}`);
    const local_js = codegen_ctx$safe_ident(local_name);
    if ((local_js !== src_js)) {
      List_push(reexport_aliases, `const ${local_js} = ${src_js};`);
    }
    List_push(export_names, local_js);
    __ring_match31: {
      const __ring_m31 = _Map_get(src_exports.types, item.name);
      if (__ring_m31._tag === "some") {
        const tdef = __ring_m31._0;
        __ring_match32: {
          const __ring_m32 = tdef;
          if (__ring_m32._tag === "EnumDef_") {
            const edef = __ring_m32._0;
            for (const v of edef.variants) {
              const src_v = `${src_prefix}$${codegen_ctx$safe_ident(item.name)}_${v.name}`;
              const local_v = `${codegen_ctx$safe_ident(local_name)}_${v.name}`;
              if ((local_v !== src_v)) {
                List_push(reexport_aliases, `const ${local_v} = ${src_v};`);
              }
              List_push(export_names, local_v);
            }
            break __ring_match32;
          }
          break __ring_match32;
        }
        break __ring_match31;
      }
      if (__ring_m31._tag === "none") {
        break __ring_match31;
      }
      __match_fail(__ring_m31);
    }
  }
}

function collect_module_reexports(src_exports, src_prefix, export_names, reexport_aliases) {
  for (const ventry of _Map_entries(src_exports.values)) {
    const __ring_dt5 = ventry;
    const vname = __ring_dt5[0];
    if ((!_Set_contains(src_exports.extern_values, vname, __Str_Eq))) {
      const src_js = `${src_prefix}$${codegen_ctx$safe_ident(vname)}`;
      const local_js = codegen_ctx$safe_ident(vname);
      if ((local_js !== src_js)) {
        List_push(reexport_aliases, `const ${local_js} = ${src_js};`);
      }
      List_push(export_names, local_js);
    }
  }
  for (const tentry of _Map_entries(src_exports.types)) {
    const __ring_dt6 = tentry;
    const tname = __ring_dt6[0];
    const tdef = __ring_dt6[1];
    const src_js = `${src_prefix}$${codegen_ctx$safe_ident(tname)}`;
    const local_js = codegen_ctx$safe_ident(tname);
    if ((local_js !== src_js)) {
      List_push(reexport_aliases, `const ${local_js} = ${src_js};`);
    }
    List_push(export_names, local_js);
    __ring_match33: {
      const __ring_m33 = tdef;
      if (__ring_m33._tag === "EnumDef_") {
        const edef = __ring_m33._0;
        for (const v of edef.variants) {
          const src_v = `${src_prefix}$${codegen_ctx$safe_ident(tname)}_${v.name}`;
          const local_v = `${codegen_ctx$safe_ident(tname)}_${v.name}`;
          if ((local_v !== src_v)) {
            List_push(reexport_aliases, `const ${local_v} = ${src_v};`);
          }
          List_push(export_names, local_v);
        }
        break __ring_match33;
      }
      break __ring_match33;
    }
  }
}

function build_imports_map(graph, exports_map, key) {
  let imports_map = map_new();
  __ring_match34: {
    const __ring_m34 = _Map_get(graph.dependencies, key);
    if (__ring_m34._tag === "some") {
      const deps = __ring_m34._0;
      for (const dk of deps) {
        __ring_match35: {
          const __ring_m35 = _Map_get(exports_map, dk);
          if (__ring_m35._tag === "some") {
            const dep_exports = __ring_m35._0;
            const dep_prefix = dep_exports.module_prefix;
            let bare_variants = set_new();
            for (const tentry of _Map_entries(dep_exports.types)) {
              const __ring_dt7 = tentry;
              const tdef = __ring_dt7[1];
              __ring_match36: {
                const __ring_m36 = tdef;
                if (__ring_m36._tag === "EnumDef_") {
                  const edef = __ring_m36._0;
                  for (const v of edef.variants) {
                    _Set_insert(bare_variants, v.name);
                  }
                  break __ring_match36;
                }
                break __ring_match36;
              }
            }
            for (const entry of _Map_entries(dep_exports.values)) {
              const __ring_dt8 = entry;
              const name = __ring_dt8[0];
              if (_Set_contains(dep_exports.extern_values, name, __Str_Eq)) {
                _Map_insert(imports_map, name, codegen_ctx$safe_ident(name));
              } else {
                if (_Set_contains(bare_variants, name, __Str_Eq)) {
                  if ((!_Map_contains_key(imports_map, name))) {
                    const si = codegen_ctx$safe_ident(name);
                    _Map_insert(imports_map, name, `${dep_prefix}$${si}`);
                  }
                } else {
                  const si = codegen_ctx$safe_ident(name);
                  _Map_insert(imports_map, name, `${dep_prefix}$${si}`);
                }
              }
            }
            for (const entry of _Map_entries(dep_exports.types)) {
              const __ring_dt9 = entry;
              const name = __ring_dt9[0];
              const type_def = __ring_dt9[1];
              const si = codegen_ctx$safe_ident(name);
              _Map_insert(imports_map, name, `${dep_prefix}$${si}`);
              __ring_match37: {
                const __ring_m37 = type_def;
                if (__ring_m37._tag === "EnumDef_") {
                  const edef = __ring_m37._0;
                  for (const v of edef.variants) {
                    const variant_js = `${dep_prefix}$${si}_${v.name}`;
                    _Map_insert(imports_map, `${name}_${v.name}`, variant_js);
                  }
                  break __ring_match37;
                }
                break __ring_match37;
              }
            }
            for (const impl_ of dep_exports.trait_impls) {
              const dict_js = hir$trait_dict_name(codegen_ctx$safe_ident(impl_.target_type_name), codegen_ctx$safe_ident(impl_.trait_name));
              _Map_insert(imports_map, dict_js, `${dep_prefix}$${dict_js}`);
            }
            break __ring_match35;
          }
          if (__ring_m35._tag === "none") {
            break __ring_match35;
          }
          __match_fail(__ring_m35);
        }
      }
      break __ring_match34;
    }
    if (__ring_m34._tag === "none") {
      break __ring_match34;
    }
    __match_fail(__ring_m34);
  }
  return imports_map;
}

function build_external_struct_fields(graph, exports_map, key) {
  let result = map_new();
  __ring_match38: {
    const __ring_m38 = _Map_get(graph.dependencies, key);
    if (__ring_m38._tag === "some") {
      const deps = __ring_m38._0;
      for (const dk of deps) {
        __ring_match39: {
          const __ring_m39 = _Map_get(exports_map, dk);
          if (__ring_m39._tag === "some") {
            const dep_exports = __ring_m39._0;
            const dep_prefix = dep_exports.module_prefix;
            for (const entry of _Map_entries(dep_exports.struct_field_orders)) {
              const __ring_dt10 = entry;
              const name = __ring_dt10[0];
              const fields = __ring_dt10[1];
              const si = codegen_ctx$safe_ident(name);
              _Map_insert(result, `${dep_prefix}$${si}`, fields);
            }
            break __ring_match39;
          }
          if (__ring_m39._tag === "none") {
            break __ring_match39;
          }
          __match_fail(__ring_m39);
        }
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "none") {
      break __ring_match38;
    }
    __match_fail(__ring_m38);
  }
  return result;
}

function empty_module_exports_list() {
  let x = [];
  return x;
}

function empty_str_list() {
  let x = [];
  return x;
}

function build_external_impl_methods(graph, exports_map, key) {
  let result = map_new();
  __ring_match40: {
    const __ring_m40 = _Map_get(graph.dependencies, key);
    if (__ring_m40._tag === "some") {
      const deps = __ring_m40._0;
      for (const dk of deps) {
        __ring_match41: {
          const __ring_m41 = _Map_get(exports_map, dk);
          if (__ring_m41._tag === "some") {
            const dep_exports = __ring_m41._0;
            const dep_prefix = dep_exports.module_prefix;
            for (const entry of _Map_entries(dep_exports.impl_methods)) {
              const __ring_dt11 = entry;
              const type_name = __ring_dt11[0];
              const methods = __ring_dt11[1];
              const si = codegen_ctx$safe_ident(type_name);
              for (const mentry of _Map_entries(methods)) {
                const __ring_dt12 = mentry;
                const mname = __ring_dt12[0];
                _Map_insert(result, `${dep_prefix}$${si}.${mname}`, Option_none);
              }
            }
            break __ring_match41;
          }
          if (__ring_m41._tag === "none") {
            break __ring_match41;
          }
          __match_fail(__ring_m41);
        }
      }
      break __ring_match40;
    }
    if (__ring_m40._tag === "none") {
      break __ring_match40;
    }
    __match_fail(__ring_m40);
  }
  return result;
}

function __StringBuilder_Eq_eq(self, other) {
  return true;
}
const __StringBuilder_Eq = { eq: __StringBuilder_Eq_eq, ne: function(self, other) { return !__StringBuilder_Eq_eq(self, other); } };

function __CompileProjectResult_Eq_eq(self, other) {
  return (self.js === other.js) && (self.success === other.success);
}
const __CompileProjectResult_Eq = { eq: __CompileProjectResult_Eq_eq, ne: function(self, other) { return !__CompileProjectResult_Eq_eq(self, other); } };

function __EsmCompileResult_Eq_eq(self, other) {
  return (self.success === other.success) && (self.entry_js_path === other.entry_js_path);
}
const __EsmCompileResult_Eq = { eq: __EsmCompileResult_Eq_eq, ne: function(self, other) { return !__EsmCompileResult_Eq_eq(self, other); } };

function __Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return __ring_T_Eq.eq(self._0, other._0);
    case "Err": return __ring_E_Eq.eq(self._0, other._0);
    default: return true;
  }
}
const __Result_Eq = { eq: __Result_Eq_eq, ne: function(self, other, __ring_T_Eq, __ring_E_Eq) { return !__Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq); } };

function __StringBuilder_Clone_clone(self) {
  return new StringBuilder();
}
const __StringBuilder_Clone = { clone: __StringBuilder_Clone_clone };

function __CompileProjectResult_Clone_clone(self) {
  return new CompileProjectResult(self.js, self.success);
}
const __CompileProjectResult_Clone = { clone: __CompileProjectResult_Clone_clone };

function __EsmCompileResult_Clone_clone(self) {
  return new EsmCompileResult(self.success, self.entry_js_path);
}
const __EsmCompileResult_Clone = { clone: __EsmCompileResult_Clone_clone };

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

function __CompileProjectResult_Ord_cmp(self, other) {
  var c;
  c = (self.js < other.js ? -1 : self.js > other.js ? 1 : 0);
  if (c !== 0) return c;
  return (self.success < other.success ? -1 : self.success > other.success ? 1 : 0);
}
const __CompileProjectResult_Ord = { cmp: __CompileProjectResult_Ord_cmp };

function __EsmCompileResult_Ord_cmp(self, other) {
  var c;
  c = (self.success < other.success ? -1 : self.success > other.success ? 1 : 0);
  if (c !== 0) return c;
  return (self.entry_js_path < other.entry_js_path ? -1 : self.entry_js_path > other.entry_js_path ? 1 : 0);
}
const __EsmCompileResult_Ord = { cmp: __EsmCompileResult_Ord_cmp };

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

function __StringBuilder_Debug_debug(self) {
  return "StringBuilder";
}
const __StringBuilder_Debug = { debug: __StringBuilder_Debug_debug };

function __CompileProjectResult_Debug_debug(self) {
  return "CompileProjectResult { " + "js: " + String(self.js) + ", " + "success: " + String(self.success) + " }";
}
const __CompileProjectResult_Debug = { debug: __CompileProjectResult_Debug_debug };

function __EsmCompileResult_Debug_debug(self) {
  return "EsmCompileResult { " + "success: " + String(self.success) + ", " + "entry_js_path: " + String(self.entry_js_path) + " }";
}
const __EsmCompileResult_Debug = { debug: __EsmCompileResult_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { CompileProjectResult, EsmCompileResult, compile_project, compile_project_esm, __CompileProjectResult_Eq, __EsmCompileResult_Eq, __CompileProjectResult_Clone, __EsmCompileResult_Clone, __CompileProjectResult_Ord, __EsmCompileResult_Ord, __CompileProjectResult_Debug, __EsmCompileResult_Debug };