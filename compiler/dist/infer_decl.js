import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __DictRef_Clone as hir$__DictRef_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst_map as env$apply_subst_map, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, AssocTypeDef as env$AssocTypeDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, EffectAliasDef as env$EffectAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __IdGen_Eq as env$__IdGen_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __FnBound_Clone as env$__FnBound_Clone, __IdGen_Clone as env$__IdGen_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __IdGen_Ord as env$__IdGen_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { empty_subst as unify$empty_subst, occurs_in as unify$occurs_in, unify_effect_params as unify$unify_effect_params, unify_effect_rows as unify$unify_effect_rows, unify as unify$unify, UnificationError as unify$UnificationError, __UnificationError_Eq as unify$__UnificationError_Eq, __UnificationError_Clone as unify$__UnificationError_Clone, __UnificationError_Ord as unify$__UnificationError_Ord, __UnificationError_Debug as unify$__UnificationError_Debug } from "./unify.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0405 as codes$E0405, E0406 as codes$E0406, E0407 as codes$E0407, E0408 as codes$E0408, E0504 as codes$E0504, E0505 as codes$E0505, E0506 as codes$E0506, E0507 as codes$E0507, E0508 as codes$E0508, E0409 as codes$E0409, E0410 as codes$E0410, E0509 as codes$E0509, E0510 as codes$E0510, E0511 as codes$E0511, E0512 as codes$E0512, E0513 as codes$E0513, E0514 as codes$E0514, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, W0001 as codes$W0001, error_description as codes$error_description, error_category as codes$error_category } from "./codes.js";
import { new_infer_ctx as infer_ctx$new_infer_ctx, type_error as infer_ctx$type_error, merge_effects as infer_ctx$merge_effects, unify_at as infer_ctx$unify_at, free_type_vars as infer_ctx$free_type_vars, collect_free_vars as infer_ctx$collect_free_vars, free_type_vars_in_env as infer_ctx$free_type_vars_in_env, generalize as infer_ctx$generalize, update_fn_effects as infer_ctx$update_fn_effects, build_scheme_var_map as infer_ctx$build_scheme_var_map, resolve_dicts_from_scheme as infer_ctx$resolve_dicts_from_scheme, resolve_type_expr as infer_ctx$resolve_type_expr, resolve_self_type as infer_ctx$resolve_self_type, resolve_named_type as infer_ctx$resolve_named_type, bind_pattern as infer_ctx$bind_pattern, remove_fail_effect as infer_ctx$remove_fail_effect, resolve_relative_qualifier as infer_ctx$resolve_relative_qualifier, InferResult as infer_ctx$InferResult, FnBoundsEntry as infer_ctx$FnBoundsEntry, CompileError as infer_ctx$CompileError, InferCtx as infer_ctx$InferCtx, __FnBoundsEntry_Eq as infer_ctx$__FnBoundsEntry_Eq, __CompileError_Eq as infer_ctx$__CompileError_Eq, __FnBoundsEntry_Clone as infer_ctx$__FnBoundsEntry_Clone, __CompileError_Clone as infer_ctx$__CompileError_Clone, __FnBoundsEntry_Ord as infer_ctx$__FnBoundsEntry_Ord, __CompileError_Ord as infer_ctx$__CompileError_Ord, __FnBoundsEntry_Debug as infer_ctx$__FnBoundsEntry_Debug, __CompileError_Debug as infer_ctx$__CompileError_Debug } from "./infer_ctx.js";
import { register_decl_public as infer_register$register_decl_public, insert_mod_aliases as infer_register$insert_mod_aliases, prefix_decl_name as infer_register$prefix_decl_name, register_decls_two_phase as infer_register$register_decls_two_phase, collect_all_supertraits as infer_register$collect_all_supertraits, resolve_effect_expr as infer_register$resolve_effect_expr, resolve_declared_effects as infer_register$resolve_declared_effects } from "./infer_register.js";
import { infer_block as infer$infer_block, infer_stmt as infer$infer_stmt, infer_expr as infer$infer_expr } from "./infer.js";
import { zonk_type as zonk$zonk_type, zonk_row as zonk$zonk_row, zonk_param as zonk$zonk_param, zonk_block as zonk$zonk_block, zonk_expr as zonk$zonk_expr, ZonkCtx as zonk$ZonkCtx } from "./zonk.js";
import { run_derive_pass as derive$run_derive_pass } from "./derive.js";

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

function check_decl(ctx, decl, __ring_ev_fail) {
  __ring_match6: {
    const __ring_m6 = decl;
    if (__ring_m6._tag === "Struct") {
      const name = __ring_m6.name; const type_params = __ring_m6.type_params; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return check_struct_decl(ctx, name, type_params, is_pub, span, __ring_ev_fail);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Enum") {
      const name = __ring_m6.name; const type_params = __ring_m6.type_params; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return check_enum_decl(ctx, name, type_params, is_pub, span, __ring_ev_fail);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Effect") {
      const name = __ring_m6.name; const type_params = __ring_m6.type_params; const ops = __ring_m6.ops; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return check_effect_decl(ctx, name, type_params, ops, is_pub, span, __ring_ev_fail);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Impl") {
      const target_type = __ring_m6.target_type; const type_params = __ring_m6.type_params; const trait_name = __ring_m6.trait_name; const methods = __ring_m6.methods; const span = __ring_m6.span;
      return check_impl_decl(ctx, target_type, type_params, trait_name, methods, span, __ring_ev_fail);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Fn") {
      const name = __ring_m6.name; const type_params = __ring_m6.type_params; const params = __ring_m6.params; const return_type = __ring_m6.return_type; const declared_effects = __ring_m6.declared_effects; const body = __ring_m6.body; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return check_fn_decl(ctx, name, type_params, params, return_type, declared_effects, body, is_pub, span, Option_none, __ring_ev_fail);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Test") {
      const description = __ring_m6.description; const body = __ring_m6.body; const span = __ring_m6.span;
      return check_test_decl(ctx, description, body, span, __ring_ev_fail);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Trait") {
      const name = __ring_m6.name; const type_params = __ring_m6.type_params; const methods = __ring_m6.methods; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return check_trait_decl(ctx, name, type_params, methods, is_pub, span, __ring_ev_fail);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ExternFn") {
      const name = __ring_m6.name; const type_params = __ring_m6.type_params; const params = __ring_m6.params; const return_type = __ring_m6.return_type; const declared_effects = __ring_m6.declared_effects; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return check_extern_fn_decl(ctx, name, type_params, params, declared_effects, is_pub, span, __ring_ev_fail);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ExternType") {
      const name = __ring_m6.name; const type_params = __ring_m6.type_params; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return hir$HDecl_ExternType(name, type_params, is_pub, span);
      break __ring_match6;
    }
    if (__ring_m6._tag === "TypeAlias") {
      const name = __ring_m6.name; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      const alias_type = (function() {
  const __ring_m = _Map_get(ctx.env.types.type_aliases, name);
  if (__ring_m._tag === "some") { const alias = __ring_m._0; return alias.ty; }
  if (__ring_m._tag === "none") { return types$UNIT; }
  __match_fail(__ring_m);
})();
      return hir$HDecl_TypeAlias(name, alias_type, is_pub, span);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Const") {
      const name = __ring_m6.name; const type_annotation = __ring_m6.type_annotation; const init = __ring_m6.init; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return check_const_decl(ctx, name, type_annotation, init, is_pub, span, __ring_ev_fail);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ModBlock") {
      const name = __ring_m6.name; const uses = __ring_m6.uses; const decls = __ring_m6.decls; const required_effects = __ring_m6.required_effects; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return check_mod_decl(ctx, name, uses, decls, required_effects, is_pub, span, __ring_ev_fail);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Sig") {
      const name = __ring_m6.name; const members = __ring_m6.members; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return check_sig_decl(ctx, name, members, is_pub, span);
      break __ring_match6;
    }
    if (__ring_m6._tag === "EffectAlias") {
      const name = __ring_m6.name; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return hir$HDecl_TypeAlias(name, types$UNIT, is_pub, span);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Delegate") {
      const span = __ring_m6.span;
      return hir$HDecl_TypeAlias("<delegate>", types$UNIT, false, span);
      break __ring_match6;
    }
    if (__ring_m6._tag === "AssocType") {
      const span = __ring_m6.span;
      return hir$HDecl_TypeAlias("<assoc_type>", types$UNIT, false, span);
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function check_mod_decl(ctx, mod_name, uses, decls, required_effects, is_pub, span, __ring_ev_fail) {
  const segments = Str_split(mod_name, "::");
  const simple_name = Option_unwrap_or(List_get(segments, (List_len(segments) - 1)), mod_name);
  List_push(ctx.mod_path_stack, simple_name);
  infer_register$insert_mod_aliases(ctx, mod_name, decls, false);
  resolve_mod_uses(ctx, uses);
  let cap_row = Option_none;
  __ring_match7: {
    const __ring_m7 = required_effects;
    if (__ring_m7._tag === "some") {
      const req_effs = __ring_m7._0;
      cap_row = Option_some(infer_register$resolve_declared_effects(ctx, req_effs));
      break __ring_match7;
    }
    if (__ring_m7._tag === "none") {
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
  let hdecls = [];
  for (const decl of decls) {
    const prefixed = infer_register$prefix_decl_name(mod_name, decl);
    const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_decl(ctx, prefixed, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    __ring_match8: {
      const __ring_m8 = result;
      if (__ring_m8._tag === "some") {
        const hd = __ring_m8._0;
        __ring_match9: {
          const __ring_m9 = hd;
          if (__ring_m9._tag === "Fn") {
            const name = __ring_m9.name; const effects = __ring_m9.effects;
            if ((List_len(effects.effects) > 0)) {
              infer_ctx$update_fn_effects(ctx.env, name, effects);
            }
            break __ring_match9;
          }
          break __ring_match9;
        }
        __ring_match10: {
          const __ring_m10 = cap_row;
          if (__ring_m10._tag === "some") {
            const cap = __ring_m10._0;
            check_capability(ctx, hd, cap, span);
            break __ring_match10;
          }
          if (__ring_m10._tag === "none") {
            break __ring_match10;
          }
          __match_fail(__ring_m10);
        }
        List_push(hdecls, hd);
        break __ring_match8;
      }
      if (__ring_m8._tag === "none") {
        break __ring_match8;
      }
      __match_fail(__ring_m8);
    }
    __ring_match11: {
      const __ring_m11 = prefixed;
      if (__ring_m11._tag === "Impl") {
        const target_type = __ring_m11.target_type; const impl_tps = __ring_m11.type_params; const methods = __ring_m11.methods; const impl_span = __ring_m11.span;
        for (const m of methods) {
          __ring_match12: {
            const __ring_m12 = m;
            if (__ring_m12._tag === "Delegate") {
              const field = __ring_m12.field; const trait_names = __ring_m12.trait_names; const dspan = __ring_m12.span;
              const delegate_impls = expand_delegate_impls(ctx, target_type, impl_tps, field, trait_names, dspan);
              for (const di of delegate_impls) {
                __ring_match13: {
                  const __ring_m13 = cap_row;
                  if (__ring_m13._tag === "some") {
                    const cap = __ring_m13._0;
                    check_capability(ctx, di, cap, span);
                    break __ring_match13;
                  }
                  if (__ring_m13._tag === "none") {
                    break __ring_match13;
                  }
                  __match_fail(__ring_m13);
                }
                List_push(hdecls, di);
              }
              break __ring_match12;
            }
            break __ring_match12;
          }
        }
        break __ring_match11;
      }
      break __ring_match11;
    }
  }
  List_pop(ctx.mod_path_stack);
  return hir$HDecl_ModBlock(mod_name, hdecls, is_pub, span);
}

function check_capability(ctx, decl, cap, mod_span) {
  __ring_match14: {
    const __ring_m14 = decl;
    if (__ring_m14._tag === "Fn") {
      const name = __ring_m14.name; const effects = __ring_m14.effects; const span = __ring_m14.span;
      return check_effects_capability(ctx, name, effects, cap, span);
      break __ring_match14;
    }
    if (__ring_m14._tag === "Impl") {
      const methods = __ring_m14.methods;
      for (const method of methods) {
        __ring_match15: {
          const __ring_m15 = method;
          if (__ring_m15._tag === "Fn") {
            const name = __ring_m15.name; const effects = __ring_m15.effects; const span = __ring_m15.span;
            check_effects_capability(ctx, name, effects, cap, span);
            break __ring_match15;
          }
          break __ring_match15;
        }
      }
      break __ring_match14;
    }
    break __ring_match14;
  }
}

function check_effects_capability(ctx, name, effects, cap, span) {
  for (const eff of effects.effects) {
    const kind = types$effect_kind_name(eff);
    const in_cap = cap.effects.some((function(c) { return types$effects_match_kind(eff, c); }));
    if ((!in_cap)) {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0405, `'${name}' uses effect '${kind}' which is not in the module's requires set`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("capability violation")));
    }
  }
}

function check_sig_decl(ctx, name, members, is_pub, span) {
  let hmembers = [];
  __ring_match16: {
    const __ring_m16 = _Map_get(ctx.env.types.sigs, name);
    if (__ring_m16._tag === "some") {
      const sig_def = __ring_m16._0;
      for (const m of members) {
        __ring_match17: {
          const __ring_m17 = _Map_get(sig_def.members, m.name);
          if (__ring_m17._tag === "some") {
            const scheme = __ring_m17._0;
            List_push(hmembers, new hir$HSigMember(m.name, scheme.ty, m.span));
            break __ring_match17;
          }
          if (__ring_m17._tag === "none") {
            List_push(hmembers, new hir$HSigMember(m.name, types$UNIT, m.span));
            break __ring_match17;
          }
          __match_fail(__ring_m17);
        }
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "none") {
      break __ring_match16;
    }
    __match_fail(__ring_m16);
  }
  return hir$HDecl_Sig(name, hmembers, is_pub, span);
}

function resolve_mod_uses(ctx, uses) {
  for (const use_decl of uses) {
    const segments = use_decl.path.segments;
    if ((List_len(segments) === 0)) {
      continue;
    }
    const first = Option_unwrap_or(List_get(segments, 0), "");
    if (((first !== "self") && (first !== "super"))) {
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
    __ring_match18: {
      const __ring_m18 = resolved;
      if (__ring_m18._tag === "none") {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0705, `Cannot use '${qualifier}' — relative path exceeds module nesting depth`, use_decl.path.span, diagnostics$DiagnosticContext_OtherContext(Option_some("relative path out of scope")));
        continue;
        break __ring_match18;
      }
      if (__ring_m18._tag === "some") {
        const prefix = __ring_m18._0;
        __ring_match19: {
          const __ring_m19 = use_decl.imports;
          if (__ring_m19._tag === "NamedItems") {
            const names = __ring_m19.names;
            for (const item of names) {
              const local_name = (function() {
  const __ring_m = item.alias;
  if (__ring_m._tag === "some") { const a = __ring_m._0; return a; }
  if (__ring_m._tag === "none") { return item.name; }
  __match_fail(__ring_m);
})();
              const qualified_name = ((prefix === "") ? item.name : `${prefix}::${item.name}`);
              __ring_match20: {
                const __ring_m20 = env$TypeEnv_lookup(ctx.env, qualified_name);
                if (__ring_m20._tag === "some") {
                  const scheme = __ring_m20._0;
                  env$TypeEnv_bind(ctx.env, local_name, scheme);
                  if ((local_name !== qualified_name)) {
                    _Map_insert(ctx.use_aliases, local_name, qualified_name);
                  }
                  break __ring_match20;
                }
                if (__ring_m20._tag === "none") {
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `Undefined variable: ${qualified_name}`, item.span, diagnostics$DiagnosticContext_UndefinedVariable(qualified_name, Option_none));
                  break __ring_match20;
                }
                __match_fail(__ring_m20);
              }
            }
            break __ring_match19;
          }
          if (__ring_m19._tag === "Module") {
            if ((name_start_idx < List_len(segments))) {
              const name = Option_unwrap_or(List_get(segments, (List_len(segments) - 1)), "");
              const qualified_name = ((prefix === "") ? name : `${prefix}::${name}`);
              __ring_match21: {
                const __ring_m21 = env$TypeEnv_lookup(ctx.env, qualified_name);
                if (__ring_m21._tag === "some") {
                  const scheme = __ring_m21._0;
                  env$TypeEnv_bind(ctx.env, name, scheme);
                  if ((name !== qualified_name)) {
                    _Map_insert(ctx.use_aliases, name, qualified_name);
                  }
                  break __ring_match21;
                }
                if (__ring_m21._tag === "none") {
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `Undefined variable: ${qualified_name}`, use_decl.path.span, diagnostics$DiagnosticContext_UndefinedVariable(qualified_name, Option_none));
                  break __ring_match21;
                }
                __match_fail(__ring_m21);
              }
            }
            break __ring_match19;
          }
          __match_fail(__ring_m19);
        }
        break __ring_match18;
      }
      __match_fail(__ring_m18);
    }
  }
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
  __ring_match22: {
    const __ring_m22 = type_annotation;
    if (__ring_m22._tag === "some") {
      const texpr = __ring_m22._0;
      expected_ty = Option_some(infer_ctx$resolve_type_expr(ctx, texpr));
      break __ring_match22;
    }
    if (__ring_m22._tag === "none") {
      break __ring_match22;
    }
    __match_fail(__ring_m22);
  }
  const init_r = infer$infer_expr(ctx, init, ctx.subst, __ring_ev_fail);
  let s = init_r.subst;
  let init_ty = hir$hexpr_type(init_r.hexpr);
  __ring_match23: {
    const __ring_m23 = expected_ty;
    if (__ring_m23._tag === "some") {
      const ann_ty = __ring_m23._0;
      s = infer_ctx$unify_at(ctx.sink, ctx.env, init_ty, ann_ty, s, span);
      init_ty = env$apply_subst(s, ann_ty);
      break __ring_match23;
    }
    if (__ring_m23._tag === "none") {
      break __ring_match23;
    }
    __match_fail(__ring_m23);
  }
  const resolved = env$apply_subst(s, init_ty);
  const gen_scheme = infer_ctx$generalize(ctx.env, resolved, s);
  const scheme = new env$TypeScheme(gen_scheme.ty, gen_scheme.type_vars, gen_scheme.bounds, old_def_id);
  env$TypeEnv_rebind(ctx.env, name, scheme);
  ctx.subst = saved_subst;
  return hir$HDecl_Const(name, old_def_id, resolved, init_r.hexpr, is_pub, span);
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
  for (const f of def.fields) {
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
  for (const v of def.variants) {
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
  for (const op of def.ops) {
    let op_params = [];
    let pi = 0;
    for (const pt of op.params) {
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
    __ring_match24: {
      const __ring_m24 = ast_op_opt;
      if (__ring_m24._tag === "some") {
        const ast_op = __ring_m24._0;
        __ring_match25: {
          const __ring_m25 = ast_op.body;
          if (__ring_m25._tag === "some") {
            const body_expr = __ring_m25._0;
            env$TypeEnv_push_scope(ctx.env);
            for (const p of op_params) {
              env$TypeEnv_bind_mono(ctx.env, p.name, p.ty);
            }
            const body_result = infer$infer_block(ctx, body_expr, Option_none, __ring_ev_fail);
            ctx.subst = body_result.subst;
            const body_type = hir$hexpr_type(body_result.hexpr);
            ctx.subst = infer_ctx$unify_at(ctx.sink, ctx.env, body_type, op.return_type, ctx.subst, span);
            const zctx = new zonk$ZonkCtx(ctx.subst, map_new());
            default_body = Option_some(zonk$zonk_block(zctx, body_result.hexpr));
            env$TypeEnv_pop_scope(ctx.env);
            break __ring_match25;
          }
          if (__ring_m25._tag === "none") {
            break __ring_match25;
          }
          __match_fail(__ring_m25);
        }
        break __ring_match24;
      }
      if (__ring_m24._tag === "none") {
        break __ring_match24;
      }
      __match_fail(__ring_m24);
    }
    List_push(hops, new hir$HEffectOp(op.name, op_params, op.return_type, op.has_default, default_body));
    oi = (oi + 1);
  }
  let all_defaults = true;
  for (const op of def.ops) {
    if ((!op.has_default)) {
      all_defaults = false;
    }
  }
  if ((all_defaults && (List_len(def.ops) > 0))) {
    let deps = [];
    let dep_set = set_new();
    for (const hop of hops) {
      __ring_match26: {
        const __ring_m26 = hop.default_body;
        if (__ring_m26._tag === "some") {
          const body = __ring_m26._0;
          const body_effs = hir$hexpr_effects(body);
          for (const eff of body_effs.effects) {
            const eff_name = types$effect_kind_name(eff);
            if (((((eff_name === "io") || (eff_name === "fail")) || (eff_name === "mut")) || (eff_name === name))) {
              continue;
            }
            __ring_match27: {
              const __ring_m27 = _Map_get(ctx.env.types.effects, eff_name);
              if (__ring_m27._tag === "some") {
                const dep_def = __ring_m27._0;
                if ((!dep_def.all_have_defaults)) {
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0409, `Default handler body of effect '${name}' uses effect '${eff_name}' which has no default handler; all-default effects cannot depend on effects without defaults`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("default effect dependency violation")));
                } else {
                  if ((!_Set_contains(dep_set, eff_name, __Str_Eq))) {
                    _Set_insert(dep_set, eff_name);
                    List_push(deps, eff_name);
                  }
                }
                break __ring_match27;
              }
              if (__ring_m27._tag === "none") {
                break __ring_match27;
              }
              __match_fail(__ring_m27);
            }
          }
          break __ring_match26;
        }
        if (__ring_m26._tag === "none") {
          break __ring_match26;
        }
        __match_fail(__ring_m26);
      }
    }
    if ((List_len(deps) > 0)) {
      _Map_insert(ctx.effect_default_deps, name, deps);
    }
  }
  return hir$HDecl_Effect(name, type_params, hops, is_pub, span);
}

function update_impl_method_effects(ctx, target_type, method_name, effects) {
  __ring_match28: {
    const __ring_m28 = _Map_get(ctx.env.trait_reg.impl_methods, target_type);
    if (__ring_m28._tag === "some") {
      const methods_map = __ring_m28._0;
      __ring_match29: {
        const __ring_m29 = _Map_get(methods_map, method_name);
        if (__ring_m29._tag === "some") {
          const scheme = __ring_m29._0;
          __ring_match30: {
            const __ring_m30 = scheme.ty;
            if (__ring_m30._tag === "FnType") {
              const params = __ring_m30.params; const return_type = __ring_m30.return_type;
              const updated_ty = types$Type_FnType(params, return_type, effects);
              return _Map_insert(methods_map, method_name, new env$TypeScheme(updated_ty, scheme.type_vars, scheme.bounds, scheme.def_id));
              break __ring_match30;
            }
            break __ring_match30;
          }
          break __ring_match29;
        }
        if (__ring_m29._tag === "none") {
          break __ring_match29;
        }
        __match_fail(__ring_m29);
      }
      break __ring_match28;
    }
    if (__ring_m28._tag === "none") {
      break __ring_match28;
    }
    __match_fail(__ring_m28);
  }
}

function check_impl_decl(ctx, target_type, type_params, trait_name, methods, span, __ring_ev_fail) {
  const saved_tp_scope = map_clone(ctx.type_param_scope);
  for (const tp of type_params) {
    const tv = env$TypeEnv_fresh_var(ctx.env);
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  const impl_self_type = ((List_len(type_params) > 0) ? (function() {
  let impl_tp_types = [];
  for (const tp of type_params) {
    __ring_match31: {
      const __ring_m31 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m31._tag === "some") {
        const tv = __ring_m31._0;
        List_push(impl_tp_types, tv);
        break __ring_match31;
      }
      if (__ring_m31._tag === "none") {
        List_push(impl_tp_types, env$TypeEnv_fresh_var(ctx.env));
        break __ring_match31;
      }
      __match_fail(__ring_m31);
    }
  }
  __ring_match32: {
    const __ring_m32 = _Map_get(ctx.env.types.structs, target_type);
    if (__ring_m32._tag === "some") {
      const def = __ring_m32._0;
      return types$Type_StructType(def.name, impl_tp_types, def.fields);
      break __ring_match32;
    }
    if (__ring_m32._tag === "none") {
      __ring_match33: {
        const __ring_m33 = _Map_get(ctx.env.types.enums, target_type);
        if (__ring_m33._tag === "some") {
          const def = __ring_m33._0;
          return types$Type_EnumType(def.name, impl_tp_types, def.variants);
          break __ring_match33;
        }
        if (__ring_m33._tag === "none") {
          return infer_ctx$resolve_self_type(ctx, target_type);
          break __ring_match33;
        }
        __match_fail(__ring_m33);
      }
      break __ring_match32;
    }
    __match_fail(__ring_m32);
  }
})() : infer_ctx$resolve_self_type(ctx, target_type));
  const saved_impl_bounds = ctx.current_fn_bounds;
  let impl_bounds = [];
  for (const tp of type_params) {
    __ring_match34: {
      const __ring_m34 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m34._tag === "some") {
        const tv = __ring_m34._0;
        __ring_match35: {
          const __ring_m35 = tv;
          if (__ring_m35._tag === "TypeVar") {
            const id = __ring_m35.id;
            for (const bound of tp.bounds) {
              List_push(impl_bounds, new infer_ctx$FnBoundsEntry(id, bound.trait_name, tp.name));
              const supers = infer_register$collect_all_supertraits(ctx, bound.trait_name);
              for (const st_name of supers) {
                List_push(impl_bounds, new infer_ctx$FnBoundsEntry(id, st_name, tp.name));
              }
            }
            break __ring_match35;
          }
          break __ring_match35;
        }
        break __ring_match34;
      }
      if (__ring_m34._tag === "none") {
        break __ring_match34;
      }
      __match_fail(__ring_m34);
    }
  }
  ctx.current_fn_bounds = impl_bounds;
  let hassoc_types = [];
  for (const method of methods) {
    __ring_match36: {
      const __ring_m36 = method;
      if (__ring_m36._tag === "AssocType") {
        const aname = __ring_m36.name; const abounds = __ring_m36.bounds; const avalue = __ring_m36.value;
        let bound_names = [];
        for (const b of abounds) {
          List_push(bound_names, b.trait_name);
        }
        const concrete = (function() {
  const __ring_m = avalue;
  if (__ring_m._tag === "some") { const v = __ring_m._0; return Option_some(infer_ctx$resolve_type_expr(ctx, v)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
        List_push(hassoc_types, new hir$HAssocType(aname, bound_names, concrete));
        __ring_match37: {
          const __ring_m37 = concrete;
          if (__ring_m37._tag === "some") {
            const ct = __ring_m37._0;
            _Map_insert(ctx.type_param_scope, aname, ct);
            break __ring_match37;
          }
          if (__ring_m37._tag === "none") {
            break __ring_match37;
          }
          __match_fail(__ring_m37);
        }
        break __ring_match36;
      }
      break __ring_match36;
    }
  }
  let hmethods = [];
  for (const method of methods) {
    __ring_match38: {
      const __ring_m38 = method;
      if (__ring_m38._tag === "ExternFn") {
        const name = __ring_m38.name; const mtps = __ring_m38.type_params; const params = __ring_m38.params; const return_type = __ring_m38.return_type; const declared_effects = __ring_m38.declared_effects; const is_pub = __ring_m38.is_pub; const mspan = __ring_m38.span;
        List_push(hmethods, check_extern_fn_decl(ctx, name, mtps, params, declared_effects, is_pub, mspan, __ring_ev_fail));
        break __ring_match38;
      }
      if (__ring_m38._tag === "Fn") {
        const name = __ring_m38.name; const mtps = __ring_m38.type_params; const params = __ring_m38.params; const return_type = __ring_m38.return_type; const declared_effects = __ring_m38.declared_effects; const body = __ring_m38.body; const is_pub = __ring_m38.is_pub; const mspan = __ring_m38.span;
        const hdecl = check_fn_decl(ctx, name, mtps, params, return_type, declared_effects, body, is_pub, mspan, Option_some(impl_self_type), __ring_ev_fail);
        List_push(hmethods, hdecl);
        __ring_match39: {
          const __ring_m39 = hdecl;
          if (__ring_m39._tag === "Fn") {
            const mname = __ring_m39.name; const inferred_effects = __ring_m39.effects;
            if ((List_len(inferred_effects.effects) > 0)) {
              update_impl_method_effects(ctx, target_type, mname, inferred_effects);
            }
            break __ring_match39;
          }
          break __ring_match39;
        }
        break __ring_match38;
      }
      if (__ring_m38._tag === "Delegate") {
        break __ring_match38;
      }
      if (__ring_m38._tag === "AssocType") {
        break __ring_match38;
      }
      break __ring_match38;
    }
  }
  ctx.current_fn_bounds = saved_impl_bounds;
  ctx.type_param_scope = saved_tp_scope;
  return hir$HDecl_Impl(target_type, type_params, trait_name, hmethods, hassoc_types, span);
}

function expand_delegate_impls(ctx, target_type, type_params, field, trait_names, span) {
  let result = [];
  __ring_match40: {
    const __ring_m40 = _Map_get(ctx.env.types.structs, target_type);
    if (__ring_m40._tag === "none") {
      return result;
      break __ring_match40;
    }
    if (__ring_m40._tag === "some") {
      const struct_def = __ring_m40._0;
      let field_type = Option_none;
      for (const f of struct_def.fields) {
        if ((f.name === field)) {
          field_type = Option_some(f.ty);
        }
      }
      __ring_match41: {
        const __ring_m41 = field_type;
        if (__ring_m41._tag === "none") {
          return result;
          break __ring_match41;
        }
        if (__ring_m41._tag === "some") {
          const ft = __ring_m41._0;
          const self_type = ((List_len(type_params) > 0) ? (function() {
  let impl_tp_types = [];
  for (const tp of type_params) {
    __ring_match42: {
      const __ring_m42 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m42._tag === "some") {
        const tv = __ring_m42._0;
        List_push(impl_tp_types, tv);
        break __ring_match42;
      }
      if (__ring_m42._tag === "none") {
        List_push(impl_tp_types, env$TypeEnv_fresh_var(ctx.env));
        break __ring_match42;
      }
      __match_fail(__ring_m42);
    }
  }
  __ring_match43: {
    const __ring_m43 = _Map_get(ctx.env.types.structs, target_type);
    if (__ring_m43._tag === "some") {
      const def = __ring_m43._0;
      return types$Type_StructType(def.name, impl_tp_types, def.fields);
      break __ring_match43;
    }
    if (__ring_m43._tag === "none") {
      __ring_match44: {
        const __ring_m44 = _Map_get(ctx.env.types.enums, target_type);
        if (__ring_m44._tag === "some") {
          const def = __ring_m44._0;
          return types$Type_EnumType(def.name, impl_tp_types, def.variants);
          break __ring_match44;
        }
        if (__ring_m44._tag === "none") {
          return infer_ctx$resolve_self_type(ctx, target_type);
          break __ring_match44;
        }
        __match_fail(__ring_m44);
      }
      break __ring_match43;
    }
    __match_fail(__ring_m43);
  }
})() : infer_ctx$resolve_self_type(ctx, target_type));
          let all_traits = [];
          for (const tname of trait_names) {
            List_push(all_traits, tname);
            const supers = infer_register$collect_all_supertraits(ctx, tname);
            for (const st_name of supers) {
              if ((!List_contains(all_traits, st_name, __Str_Eq))) {
                List_push(all_traits, st_name);
              }
            }
          }
          for (const tname of all_traits) {
            __ring_match45: {
              const __ring_m45 = _Map_get(ctx.env.trait_reg.traits, tname);
              if (__ring_m45._tag === "none") {
                break __ring_match45;
              }
              if (__ring_m45._tag === "some") {
                const trait_def = __ring_m45._0;
                let trait_hmethods = [];
                for (const tm of trait_def.methods) {
                  __ring_match46: {
                    const __ring_m46 = tm.ty;
                    if (__ring_m46._tag === "FnType") {
                      const trait_params = __ring_m46.params; const ret_ty = __ring_m46.return_type; const eff = __ring_m46.effects;
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
                        const pid = env$TypeEnv_fresh_def_id(ctx.env);
                        const p_is_mut = (function() {
  const __ring_m = List_get(tm.param_mutabilities, pi);
  if (__ring_m._tag === "some") { const m = __ring_m._0; return m; }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
                        List_push(hparams, new hir$HParam(pname, pty, Option_some(pid), p_is_mut));
                        const is_self_typed = (function() {
  const __ring_m = [pty, trait_self_type];
  if (Array.isArray(__ring_m) && __ring_m.length === 2 && __ring_m[0]._tag === "TypeVar" && __ring_m[1]._tag === "TypeVar") { const a = __ring_m[0].id; const b = __ring_m[1].id; return (a === b); }
  return false;
})();
                        if (is_self_typed) {
                          const arg_ident = hir$HExpr_Ident(pname, Option_none, Option_some(pid), Option_none, self_type, types$EMPTY_ROW, span);
                          List_push(forward_args, hir$HExpr_FieldAccess(arg_ident, field, ft, types$EMPTY_ROW, span));
                        } else {
                          List_push(forward_args, hir$HExpr_Ident(pname, Option_none, Option_some(pid), Option_none, pty, types$EMPTY_ROW, span));
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
                        __ring_match47: {
                          const __ring_m47 = ftn;
                          if (__ring_m47._tag === "some") {
                            const field_tn = __ring_m47._0;
                            let has_explicit = false;
                            __ring_match48: {
                              const __ring_m48 = _Map_get(ctx.env.trait_reg.impl_methods, field_tn);
                              if (__ring_m48._tag === "some") {
                                const methods_map = __ring_m48._0;
                                has_explicit = _Map_contains_key(methods_map, tm.name);
                                break __ring_match48;
                              }
                              if (__ring_m48._tag === "none") {
                                break __ring_match48;
                              }
                              __match_fail(__ring_m48);
                            }
                            if ((!has_explicit)) {
                              use_dict_dispatch = true;
                            }
                            break __ring_match47;
                          }
                          if (__ring_m47._tag === "none") {
                            break __ring_match47;
                          }
                          __match_fail(__ring_m47);
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
                      break __ring_match46;
                    }
                    break __ring_match46;
                  }
                }
                List_push(result, hir$HDecl_Impl(target_type, type_params, Option_some(tname), trait_hmethods, [], span));
                break __ring_match45;
              }
              __match_fail(__ring_m45);
            }
          }
          return result;
          break __ring_match41;
        }
        __match_fail(__ring_m41);
      }
      break __ring_match40;
    }
    __match_fail(__ring_m40);
  }
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
    __ring_match49: {
      const __ring_m49 = List_first(trait_def.methods);
      if (__ring_m49._tag === "some") {
        const first_method = __ring_m49._0;
        __ring_match50: {
          const __ring_m50 = first_method.ty;
          if (__ring_m50._tag === "FnType") {
            const fps = __ring_m50.params;
            if ((List_len(fps) > 0)) {
              __ring_match51: {
                const __ring_m51 = List_first(fps);
                if (__ring_m51._tag === "some") {
                  const fp = __ring_m51._0;
                  self_var = fp;
                  break __ring_match51;
                }
                if (__ring_m51._tag === "none") {
                  break __ring_match51;
                }
                __match_fail(__ring_m51);
              }
            }
            break __ring_match50;
          }
          break __ring_match50;
        }
        break __ring_match49;
      }
      if (__ring_m49._tag === "none") {
        break __ring_match49;
      }
      __match_fail(__ring_m49);
    }
  }
  let hmethods = [];
  for (const m of trait_def.methods) {
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
    for (const param_type of fn_params) {
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
      __ring_match52: {
        const __ring_m52 = ast_method;
        if (__ring_m52._tag === "some") {
          const am = __ring_m52._0;
          __ring_match53: {
            const __ring_m53 = am;
            if (__ring_m53._tag === "Fn") {
              const abody = __ring_m53.body;
              const has_body = (function() {
  const __ring_m = abody;
  if (__ring_m._tag === "Block") { const stmts = __ring_m.stmts; const tail = __ring_m.tail; return ((List_len(stmts) > 0) || Option_is_some(tail)); }
  return true;
})();
              if (has_body) {
                method_body = check_trait_default_body(ctx, name, self_var, hparams, abody);
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
    List_push(hmethods, new hir$HTraitMethod(m.name, hparams, fn_ret, m.has_default, method_body));
  }
  let hassoc_types = [];
  for (const atdef of trait_def.assoc_types) {
    List_push(hassoc_types, new hir$HAssocType(atdef.name, atdef.bounds, atdef.default_type));
  }
  return hir$HDecl_Trait(name, type_params, hmethods, trait_def.supertraits, hassoc_types, is_pub, span);
}

function check_trait_default_body(ctx, trait_name, self_var, hparams, body) {
  const saved_subst = ctx.subst;
  ctx.subst = unify$empty_subst();
  env$TypeEnv_push_scope(ctx.env);
  List_push(ctx.fn_bounds_stack, ctx.current_fn_bounds);
  ctx.current_fn_bounds = [];
  __ring_match54: {
    const __ring_m54 = self_var;
    if (__ring_m54._tag === "TypeVar") {
      const id = __ring_m54.id;
      List_push(ctx.current_fn_bounds, new infer_ctx$FnBoundsEntry(id, trait_name, "self"));
      const supers = infer_register$collect_all_supertraits(ctx, trait_name);
      for (const st_name of supers) {
        List_push(ctx.current_fn_bounds, new infer_ctx$FnBoundsEntry(id, st_name, "self"));
      }
      break __ring_match54;
    }
    break __ring_match54;
  }
  for (const p of hparams) {
    env$TypeEnv_bind_mono(ctx.env, p.name, p.ty);
    if (p.is_mutable) {
      __ring_match55: {
        const __ring_m55 = env$TypeEnv_lookup(ctx.env, p.name);
        if (__ring_m55._tag === "some") {
          const ps = __ring_m55._0;
          __ring_match56: {
            const __ring_m56 = ps.def_id;
            if (__ring_m56._tag === "some") {
              const did = __ring_m56._0;
              _Set_insert(ctx.env.scope.mutable_vars, did);
              break __ring_match56;
            }
            if (__ring_m56._tag === "none") {
              break __ring_match56;
            }
            __match_fail(__ring_m56);
          }
          break __ring_match55;
        }
        if (__ring_m55._tag === "none") {
          break __ring_match55;
        }
        __match_fail(__ring_m55);
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

function find_ast_fn_by_name(methods, name) {
  return ((__a) => { const __i = __a.findIndex((function(d) { return (function() {
  const __ring_m = d;
  if (__ring_m._tag === "Fn") { const n = __ring_m.name; return (n === name); }
  return false;
})(); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(methods);
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
  for (const p of params) {
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

class FnBodyResult {
  constructor(params, ret, eff, body) {
    this.params = params;
    this.ret = ret;
    this.eff = eff;
    this.body = body;
  }
}

function check_fn_body(ctx, type_params, hparams, expected_ret, body, saved_tp_scope, span, __ring_ev_fail) {
  const body_result = infer$infer_block(ctx, body, Option_some(ctx.subst), __ring_ev_fail);
  ctx.subst = body_result.subst;
  ctx.subst = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(body_result.hexpr), expected_ret, ctx.subst, span);
  let local_names = map_new();
  for (const tp of type_params) {
    __ring_match57: {
      const __ring_m57 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m57._tag === "some") {
        const tv = __ring_m57._0;
        __ring_match58: {
          const __ring_m58 = tv;
          if (__ring_m58._tag === "TypeVar") {
            const resolved = env$apply_subst(ctx.subst, tv);
            __ring_match59: {
              const __ring_m59 = resolved;
              if (__ring_m59._tag === "TypeVar") {
                const rid = __ring_m59.id;
                _Map_insert(local_names, rid, tp.name);
                break __ring_match59;
              }
              break __ring_match59;
            }
            break __ring_match58;
          }
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
  let declared_names = set_new();
  for (const tp of type_params) {
    _Set_insert(declared_names, tp.name);
  }
  for (const entry of _Map_entries(ctx.type_param_scope)) {
    const __ring_dt0 = entry;
    const tpname = __ring_dt0[0];
    const tv = __ring_dt0[1];
    if (((!_Map_contains_key(saved_tp_scope, tpname)) && (!_Set_contains(declared_names, tpname, __Str_Eq)))) {
      __ring_match60: {
        const __ring_m60 = tv;
        if (__ring_m60._tag === "TypeVar") {
          const resolved = env$apply_subst(ctx.subst, tv);
          __ring_match61: {
            const __ring_m61 = resolved;
            if (__ring_m61._tag === "TypeVar") {
              const rid = __ring_m61.id;
              _Map_insert(local_names, rid, tpname);
              break __ring_match61;
            }
            break __ring_match61;
          }
          break __ring_match60;
        }
        break __ring_match60;
      }
    }
  }
  const zctx = new zonk$ZonkCtx(ctx.subst, local_names);
  let final_params = [];
  for (const hp of hparams) {
    List_push(final_params, zonk$zonk_param(zctx, hp));
  }
  const final_ret = zonk$zonk_type(zctx, expected_ret);
  const eff = zonk$zonk_row(zctx, body_result.effects);
  const final_body = zonk$zonk_block(zctx, body_result.hexpr);
  return new FnBodyResult(final_params, final_ret, eff, final_body);
}

function is_value_type(t) {
  __ring_match62: {
    const __ring_m62 = t;
    if (__ring_m62._tag === "IntType") {
      return true;
      break __ring_match62;
    }
    if (__ring_m62._tag === "FloatType") {
      return true;
      break __ring_match62;
    }
    if (__ring_m62._tag === "BoolType") {
      return true;
      break __ring_match62;
    }
    if (__ring_m62._tag === "StrType") {
      return true;
      break __ring_match62;
    }
    return false;
    break __ring_match62;
  }
}

function check_fn_decl(ctx, name, type_params, params, return_type, declared_effects, body, is_pub, span, self_type, __ring_ev_fail) {
  const saved_subst = ctx.subst;
  ctx.subst = unify$empty_subst();
  env$TypeEnv_push_scope(ctx.env);
  const saved_tp_scope = map_clone(ctx.type_param_scope);
  for (const tp of type_params) {
    const tv = env$TypeEnv_fresh_var(ctx.env);
    _Map_insert(ctx.type_param_scope, tp.name, tv);
    env$TypeEnv_bind_mono(ctx.env, tp.name, tv);
  }
  List_push(ctx.fn_bounds_stack, ctx.current_fn_bounds);
  let inherited_bounds = [];
  for (const ib of ctx.current_fn_bounds) {
    List_push(inherited_bounds, ib);
  }
  ctx.current_fn_bounds = inherited_bounds;
  for (const tp of type_params) {
    __ring_match63: {
      const __ring_m63 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m63._tag === "some") {
        const tv = __ring_m63._0;
        __ring_match64: {
          const __ring_m64 = tv;
          if (__ring_m64._tag === "TypeVar") {
            const id = __ring_m64.id;
            for (const bound of tp.bounds) {
              List_push(ctx.current_fn_bounds, new infer_ctx$FnBoundsEntry(id, bound.trait_name, tp.name));
              const supers = infer_register$collect_all_supertraits(ctx, bound.trait_name);
              for (const st_name of supers) {
                List_push(ctx.current_fn_bounds, new infer_ctx$FnBoundsEntry(id, st_name, tp.name));
              }
            }
            break __ring_match64;
          }
          break __ring_match64;
        }
        break __ring_match63;
      }
      if (__ring_m63._tag === "none") {
        break __ring_match63;
      }
      __match_fail(__ring_m63);
    }
  }
  let hparams = [];
  for (const p of params) {
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
    __ring_match65: {
      const __ring_m65 = param_scheme;
      if (__ring_m65._tag === "some") {
        const ps = __ring_m65._0;
        __ring_match66: {
          const __ring_m66 = ps.def_id;
          if (__ring_m66._tag === "some") {
            const did = __ring_m66._0;
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
            break __ring_match66;
          }
          if (__ring_m66._tag === "none") {
            break __ring_match66;
          }
          __match_fail(__ring_m66);
        }
        List_push(hparams, new hir$HParam(p.name, ptype, ps.def_id, p.is_mutable));
        break __ring_match65;
      }
      if (__ring_m65._tag === "none") {
        List_push(hparams, new hir$HParam(p.name, ptype, Option_none, p.is_mutable));
        break __ring_match65;
      }
      __match_fail(__ring_m65);
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
  for (const inferred_eff of inferred_effects.effects) {
    let found = false;
    for (const declared_eff of declared_row.effects) {
      if (types$effects_match_kind(inferred_eff, declared_eff)) {
        found = true;
        __ring_match67: {
          const __ring_m67 = [inferred_eff, declared_eff];
          if (Array.isArray(__ring_m67) && __ring_m67.length === 2 && __ring_m67[0]._tag === "FailEffect" && __ring_m67[1]._tag === "FailEffect") {
            const ie = __ring_m67[0].error_type; const de = __ring_m67[1].error_type;
            ctx.subst = infer_ctx$unify_at(ctx.sink, ctx.env, ie, de, ctx.subst, span);
            break __ring_match67;
          }
          if (Array.isArray(__ring_m67) && __ring_m67.length === 2 && __ring_m67[0]._tag === "MutEffect" && __ring_m67[1]._tag === "MutEffect") {
            const is = __ring_m67[0].state_type; const ds = __ring_m67[1].state_type;
            ctx.subst = infer_ctx$unify_at(ctx.sink, ctx.env, is, ds, ctx.subst, span);
            break __ring_match67;
          }
          if (Array.isArray(__ring_m67) && __ring_m67.length === 2 && __ring_m67[0]._tag === "CustomEffect" && __ring_m67[1]._tag === "CustomEffect") {
            const ia = __ring_m67[0].type_args; const da = __ring_m67[1].type_args;
            let i = 0;
            while (((i < List_len(ia)) && (i < List_len(da)))) {
              ctx.subst = infer_ctx$unify_at(ctx.sink, ctx.env, Option_unwrap_or(List_get(ia, i), types$UNIT), Option_unwrap_or(List_get(da, i), types$UNIT), ctx.subst, span);
              i = (i + 1);
            }
            break __ring_match67;
          }
          break __ring_match67;
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
    for (const eff of final_effects.effects) {
      __ring_match68: {
        const __ring_m68 = eff;
        if (__ring_m68._tag === "CustomEffect") {
          const eff_name = __ring_m68.name;
          let skip = false;
          __ring_match69: {
            const __ring_m69 = _Map_get(ctx.env.types.effects, eff_name);
            if (__ring_m69._tag === "some") {
              const edef = __ring_m69._0;
              if (edef.all_have_defaults) {
                skip = true;
              }
              break __ring_match69;
            }
            if (__ring_m69._tag === "none") {
              break __ring_match69;
            }
            __match_fail(__ring_m69);
          }
          if ((!skip)) {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0403, `Unhandled effect '${eff_name}' in main function; custom effects must be handled before reaching main`, span, diagnostics$DiagnosticContext_EffectUnhandled(eff_name, Option_some("main")));
          }
          break __ring_match68;
        }
        break __ring_match68;
      }
    }
  }
  let trait_bounds = [];
  for (const fb of complete_fn_bounds) {
    List_push(trait_bounds, new hir$TraitBound(fb.type_param_name, fb.trait_name));
  }
  const fn_scheme = env$TypeEnv_lookup(ctx.env, name);
  const fn_def_id = (function() {
  const __ring_m = fn_scheme;
  if (__ring_m._tag === "some") { const s = __ring_m._0; return s.def_id; }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
  __ring_match70: {
    const __ring_m70 = fn_def_id;
    if (__ring_m70._tag === "some") {
      const did = __ring_m70._0;
      env$TypeEnv_record_def_span(ctx.env, did, span);
      break __ring_match70;
    }
    if (__ring_m70._tag === "none") {
      break __ring_match70;
    }
    __match_fail(__ring_m70);
  }
  let mut_flags = [];
  let fi = 0;
  for (const p of params) {
    if (((p.name === "self") || (!p.is_mutable))) {
      List_push(mut_flags, false);
    } else {
      __ring_match71: {
        const __ring_m71 = List_get(final_params, fi);
        if (__ring_m71._tag === "some") {
          const fp = __ring_m71._0;
          List_push(mut_flags, is_value_type(fp.ty));
          break __ring_match71;
        }
        if (__ring_m71._tag === "none") {
          List_push(mut_flags, false);
          break __ring_match71;
        }
        __match_fail(__ring_m71);
      }
    }
    fi = (fi + 1);
  }
  _Map_insert(ctx.fn_mut_params, name, mut_flags);
  return hir$HDecl_Fn(name, fn_def_id, type_params, final_params, final_ret, final_effects, final_body, is_pub, trait_bounds, span);
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

function check_one_decl(ctx, decl, hdecls, __ring_ev_fail) {
  const hd = check_decl(ctx, decl, __ring_ev_fail);
  __ring_match72: {
    const __ring_m72 = hd;
    if (__ring_m72._tag === "Fn") {
      const name = __ring_m72.name; const effects = __ring_m72.effects;
      if ((List_len(effects.effects) > 0)) {
        infer_ctx$update_fn_effects(ctx.env, name, effects);
      }
      break __ring_match72;
    }
    break __ring_match72;
  }
  let delegate_decls = [];
  __ring_match73: {
    const __ring_m73 = decl;
    if (__ring_m73._tag === "Impl") {
      const target_type = __ring_m73.target_type; const type_params = __ring_m73.type_params; const methods = __ring_m73.methods; const span = __ring_m73.span;
      for (const m of methods) {
        __ring_match74: {
          const __ring_m74 = m;
          if (__ring_m74._tag === "Delegate") {
            const field = __ring_m74.field; const trait_names = __ring_m74.trait_names; const dspan = __ring_m74.span;
            const delegate_impls = expand_delegate_impls(ctx, target_type, type_params, field, trait_names, dspan);
            for (const di of delegate_impls) {
              List_push(delegate_decls, di);
            }
            break __ring_match74;
          }
          break __ring_match74;
        }
      }
      break __ring_match73;
    }
    break __ring_match73;
  }
  List_push(hdecls, hd);
  for (const di of delegate_decls) {
    List_push(hdecls, di);
  }
}

function check_default_effect_cycles(ctx, decls) {
  let effect_spans = map_new();
  collect_effect_spans(decls, effect_spans);
  let state = map_new();
  let path = [];
  for (const entry of _Map_entries(ctx.effect_default_deps)) {
    const __ring_dt1 = entry;
    const eff_name = __ring_dt1[0];
    if ((!_Map_contains_key(state, eff_name))) {
      dfs_detect_cycle(ctx, eff_name, state, path, effect_spans);
    }
  }
}

function collect_effect_spans(decls, spans) {
  for (const decl of decls) {
    __ring_match75: {
      const __ring_m75 = decl;
      if (__ring_m75._tag === "Effect") {
        const name = __ring_m75.name; const span = __ring_m75.span;
        _Map_insert(spans, name, span);
        break __ring_match75;
      }
      if (__ring_m75._tag === "ModBlock") {
        const mod_decls = __ring_m75.decls;
        collect_effect_spans(mod_decls, spans);
        break __ring_match75;
      }
      break __ring_match75;
    }
  }
}

function dfs_detect_cycle(ctx, name, state, path, effect_spans) {
  _Map_insert(state, name, 1);
  List_push(path, name);
  __ring_match76: {
    const __ring_m76 = _Map_get(ctx.effect_default_deps, name);
    if (__ring_m76._tag === "some") {
      const deps = __ring_m76._0;
      for (const dep of deps) {
        __ring_match77: {
          const __ring_m77 = _Map_get(state, dep);
          if (__ring_m77._tag === "some") {
            const s = __ring_m77._0;
            if ((s === 1)) {
              let cycle_parts = [];
              let found_start = false;
              for (const p of path) {
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
            break __ring_match77;
          }
          if (__ring_m77._tag === "none") {
            dfs_detect_cycle(ctx, dep, state, path, effect_spans);
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
  List_pop(path);
  return _Map_insert(state, name, 2);
}

function check(ctx, program, __ring_ev_fail) {
  infer_register$register_decls_two_phase(ctx, program.decls);
  const derived_impls = derive$run_derive_pass(ctx.env);
  for (const decl of program.decls) {
    __ring_match78: {
      const __ring_m78 = decl;
      if (__ring_m78._tag === "Impl") {
        const target_type = __ring_m78.target_type; const type_params = __ring_m78.type_params; const trait_name = __ring_m78.trait_name; const methods = __ring_m78.methods; const span = __ring_m78.span;
        const _ = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_impl_decl(ctx, target_type, type_params, trait_name, methods, span, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
        break __ring_match78;
      }
      break __ring_match78;
    }
  }
  let hdecls = [];
  for (const decl of program.decls) {
    const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_one_decl(ctx, decl, hdecls)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  }
  check_default_effect_cycles(ctx, program.decls);
  return new hir$HProgram(hdecls, derived_impls, ctx.boxed_vars);
}

function resolve_type_expr_public(ctx, texpr) {
  return infer_ctx$resolve_type_expr(ctx, texpr);
}

function check_prelude_decl(ctx, decl, __ring_ev_fail) {
  const result = check_decl(ctx, decl, __ring_ev_fail);
  if (false) {
    __ring_ev_fail.raise(new infer_ctx$CompileError());
  }
  return result;
}

function __StringBuilder_Eq_eq(self, other) {
  return true;
}
const __StringBuilder_Eq = { eq: __StringBuilder_Eq_eq, ne: function(self, other) { return !__StringBuilder_Eq_eq(self, other); } };

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

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { check, resolve_type_expr_public, check_prelude_decl };