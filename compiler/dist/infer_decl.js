import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_tuple_eq, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst_map as env$apply_subst_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __IdGen_Eq as env$__IdGen_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __ImplEntry_Clone as env$__ImplEntry_Clone, __FnBound_Clone as env$__FnBound_Clone, __IdGen_Clone as env$__IdGen_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __IdGen_Ord as env$__IdGen_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __ImplEntry_Debug as env$__ImplEntry_Debug, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { empty_subst as unify$empty_subst, occurs_in as unify$occurs_in, unify_effect_rows as unify$unify_effect_rows, unify as unify$unify, UnificationError as unify$UnificationError, __UnificationError_Eq as unify$__UnificationError_Eq, __UnificationError_Clone as unify$__UnificationError_Clone, __UnificationError_Ord as unify$__UnificationError_Ord, __UnificationError_Debug as unify$__UnificationError_Debug } from "./unify.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0405 as codes$E0405, E0504 as codes$E0504, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, error_description as codes$error_description, error_category as codes$error_category } from "./codes.js";
import { new_infer_ctx as infer_ctx$new_infer_ctx, type_error as infer_ctx$type_error, merge_effects as infer_ctx$merge_effects, unify_at as infer_ctx$unify_at, free_type_vars as infer_ctx$free_type_vars, collect_free_vars as infer_ctx$collect_free_vars, free_type_vars_in_env as infer_ctx$free_type_vars_in_env, generalize as infer_ctx$generalize, update_fn_effects as infer_ctx$update_fn_effects, build_scheme_var_map as infer_ctx$build_scheme_var_map, resolve_dicts_from_scheme as infer_ctx$resolve_dicts_from_scheme, resolve_type_expr as infer_ctx$resolve_type_expr, resolve_self_type as infer_ctx$resolve_self_type, resolve_named_type as infer_ctx$resolve_named_type, bind_pattern as infer_ctx$bind_pattern, remove_fail_effect as infer_ctx$remove_fail_effect, remove_specific_fail_effect as infer_ctx$remove_specific_fail_effect, resolve_relative_qualifier as infer_ctx$resolve_relative_qualifier, InferResult as infer_ctx$InferResult, FnBoundsEntry as infer_ctx$FnBoundsEntry, CompileError as infer_ctx$CompileError, InferCtx as infer_ctx$InferCtx, __FnBoundsEntry_Eq as infer_ctx$__FnBoundsEntry_Eq, __CompileError_Eq as infer_ctx$__CompileError_Eq, __FnBoundsEntry_Clone as infer_ctx$__FnBoundsEntry_Clone, __CompileError_Clone as infer_ctx$__CompileError_Clone, __FnBoundsEntry_Ord as infer_ctx$__FnBoundsEntry_Ord, __CompileError_Ord as infer_ctx$__CompileError_Ord, __FnBoundsEntry_Debug as infer_ctx$__FnBoundsEntry_Debug, __CompileError_Debug as infer_ctx$__CompileError_Debug } from "./infer_ctx.js";
import { register_decl_public as infer_register$register_decl_public, insert_mod_aliases as infer_register$insert_mod_aliases, prefix_decl_name as infer_register$prefix_decl_name, register_decls_two_phase as infer_register$register_decls_two_phase, resolve_effect_expr as infer_register$resolve_effect_expr, resolve_declared_effects as infer_register$resolve_declared_effects } from "./infer_register.js";
import { infer_block as infer$infer_block, infer_stmt as infer$infer_stmt, infer_expr as infer$infer_expr } from "./infer.js";
import { zonk_type as zonk$zonk_type, zonk_row as zonk$zonk_row, zonk_param as zonk$zonk_param, zonk_block as zonk$zonk_block, zonk_expr as zonk$zonk_expr, ZonkCtx as zonk$ZonkCtx } from "./zonk.js";
import { run_derive_pass as derive$run_derive_pass } from "./derive.js";

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

function check_decl(ctx, decl, __ring_ev_fail) {
  __ring_match1: {
    const __ring_m1 = decl;
    if (__ring_m1._tag === "Struct") {
      const name = __ring_m1.name; const type_params = __ring_m1.type_params; const is_pub = __ring_m1.is_pub; const span = __ring_m1.span;
      return check_struct_decl(ctx, name, type_params, is_pub, span, __ring_ev_fail);
      break __ring_match1;
    }
    if (__ring_m1._tag === "Enum") {
      const name = __ring_m1.name; const type_params = __ring_m1.type_params; const is_pub = __ring_m1.is_pub; const span = __ring_m1.span;
      return check_enum_decl(ctx, name, type_params, is_pub, span, __ring_ev_fail);
      break __ring_match1;
    }
    if (__ring_m1._tag === "Effect") {
      const name = __ring_m1.name; const type_params = __ring_m1.type_params; const ops = __ring_m1.ops; const is_pub = __ring_m1.is_pub; const span = __ring_m1.span;
      return check_effect_decl(ctx, name, type_params, ops, is_pub, span, __ring_ev_fail);
      break __ring_match1;
    }
    if (__ring_m1._tag === "Impl") {
      const target_type = __ring_m1.target_type; const type_params = __ring_m1.type_params; const trait_name = __ring_m1.trait_name; const methods = __ring_m1.methods; const span = __ring_m1.span;
      return check_impl_decl(ctx, target_type, type_params, trait_name, methods, span, __ring_ev_fail);
      break __ring_match1;
    }
    if (__ring_m1._tag === "Fn") {
      const name = __ring_m1.name; const type_params = __ring_m1.type_params; const params = __ring_m1.params; const return_type = __ring_m1.return_type; const declared_effects = __ring_m1.declared_effects; const body = __ring_m1.body; const is_pub = __ring_m1.is_pub; const span = __ring_m1.span;
      return check_fn_decl(ctx, name, type_params, params, return_type, declared_effects, body, is_pub, span, Option_none, __ring_ev_fail);
      break __ring_match1;
    }
    if (__ring_m1._tag === "Test") {
      const description = __ring_m1.description; const body = __ring_m1.body; const span = __ring_m1.span;
      return check_test_decl(ctx, description, body, span, __ring_ev_fail);
      break __ring_match1;
    }
    if (__ring_m1._tag === "Trait") {
      const name = __ring_m1.name; const type_params = __ring_m1.type_params; const methods = __ring_m1.methods; const is_pub = __ring_m1.is_pub; const span = __ring_m1.span;
      return check_trait_decl(ctx, name, type_params, methods, is_pub, span, __ring_ev_fail);
      break __ring_match1;
    }
    if (__ring_m1._tag === "ExternFn") {
      const name = __ring_m1.name; const type_params = __ring_m1.type_params; const params = __ring_m1.params; const return_type = __ring_m1.return_type; const declared_effects = __ring_m1.declared_effects; const is_pub = __ring_m1.is_pub; const span = __ring_m1.span;
      return check_extern_fn_decl(ctx, name, type_params, params, declared_effects, is_pub, span, __ring_ev_fail);
      break __ring_match1;
    }
    if (__ring_m1._tag === "ExternType") {
      const name = __ring_m1.name; const type_params = __ring_m1.type_params; const is_pub = __ring_m1.is_pub; const span = __ring_m1.span;
      return hir$HDecl_ExternType(name, type_params, is_pub, span);
      break __ring_match1;
    }
    if (__ring_m1._tag === "TypeAlias") {
      const name = __ring_m1.name; const is_pub = __ring_m1.is_pub; const span = __ring_m1.span;
      const alias_type = (function() {
  const __ring_m = _Map_get(ctx.env.types.type_aliases, name);
  if (__ring_m._tag === "some") { const alias = __ring_m._0; return alias.ty; }
  if (__ring_m._tag === "none") { return types$UNIT; }
  __match_fail(__ring_m);
})();
      return hir$HDecl_TypeAlias(name, alias_type, is_pub, span);
      break __ring_match1;
    }
    if (__ring_m1._tag === "Const") {
      const name = __ring_m1.name; const type_annotation = __ring_m1.type_annotation; const init = __ring_m1.init; const is_pub = __ring_m1.is_pub; const span = __ring_m1.span;
      return check_const_decl(ctx, name, type_annotation, init, is_pub, span, __ring_ev_fail);
      break __ring_match1;
    }
    if (__ring_m1._tag === "ModBlock") {
      const name = __ring_m1.name; const uses = __ring_m1.uses; const decls = __ring_m1.decls; const required_effects = __ring_m1.required_effects; const is_pub = __ring_m1.is_pub; const span = __ring_m1.span;
      return check_mod_decl(ctx, name, uses, decls, required_effects, is_pub, span, __ring_ev_fail);
      break __ring_match1;
    }
    if (__ring_m1._tag === "Sig") {
      const name = __ring_m1.name; const members = __ring_m1.members; const is_pub = __ring_m1.is_pub; const span = __ring_m1.span;
      return check_sig_decl(ctx, name, members, is_pub, span);
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
}

function check_mod_decl(ctx, mod_name, uses, decls, required_effects, is_pub, span, __ring_ev_fail) {
  const segments = Str_split(mod_name, "::");
  const simple_name = Option_unwrap_or(List_get(segments, (List_len(segments) - 1)), mod_name);
  List_push(ctx.mod_path_stack, simple_name);
  infer_register$insert_mod_aliases(ctx, mod_name, decls, false);
  resolve_mod_uses(ctx, uses);
  let cap_row = Option_none;
  __ring_match2: {
    const __ring_m2 = required_effects;
    if (__ring_m2._tag === "some") {
      const req_effs = __ring_m2._0;
      cap_row = Option_some(infer_register$resolve_declared_effects(ctx, req_effs));
      break __ring_match2;
    }
    if (__ring_m2._tag === "none") {
      break __ring_match2;
    }
    __match_fail(__ring_m2);
  }
  let hdecls = [];
  for (const decl of decls) {
    const prefixed = infer_register$prefix_decl_name(mod_name, decl);
    const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_decl(ctx, prefixed, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    __ring_match3: {
      const __ring_m3 = result;
      if (__ring_m3._tag === "some") {
        const hd = __ring_m3._0;
        __ring_match4: {
          const __ring_m4 = cap_row;
          if (__ring_m4._tag === "some") {
            const cap = __ring_m4._0;
            check_capability(ctx, hd, cap, span);
            break __ring_match4;
          }
          if (__ring_m4._tag === "none") {
            break __ring_match4;
          }
          __match_fail(__ring_m4);
        }
        List_push(hdecls, hd);
        break __ring_match3;
      }
      if (__ring_m3._tag === "none") {
        break __ring_match3;
      }
      __match_fail(__ring_m3);
    }
  }
  List_pop(ctx.mod_path_stack);
  return hir$HDecl_ModBlock(mod_name, hdecls, is_pub, span);
}

function check_capability(ctx, decl, cap, mod_span) {
  __ring_match5: {
    const __ring_m5 = decl;
    if (__ring_m5._tag === "Fn") {
      const name = __ring_m5.name; const effects = __ring_m5.effects; const span = __ring_m5.span;
      for (const eff of effects.effects) {
        const kind = types$effect_kind_name(eff);
        const in_cap = cap.effects.some((function(c) { return types$effects_match_kind(eff, c); }));
        if ((!in_cap)) {
          const _ = infer_ctx$type_error(ctx.sink, codes$E0405, `Function '${name}' uses effect '${kind}' which is not in the module's requires set`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("capability violation")));
        }
      }
      break __ring_match5;
    }
    break __ring_match5;
  }
}

function check_sig_decl(ctx, name, members, is_pub, span) {
  let hmembers = [];
  __ring_match6: {
    const __ring_m6 = _Map_get(ctx.env.types.sigs, name);
    if (__ring_m6._tag === "some") {
      const sig_def = __ring_m6._0;
      for (const m of members) {
        __ring_match7: {
          const __ring_m7 = _Map_get(sig_def.members, m.name);
          if (__ring_m7._tag === "some") {
            const scheme = __ring_m7._0;
            List_push(hmembers, new hir$HSigMember(m.name, scheme.ty, m.span));
            break __ring_match7;
          }
          if (__ring_m7._tag === "none") {
            List_push(hmembers, new hir$HSigMember(m.name, types$UNIT, m.span));
            break __ring_match7;
          }
          __match_fail(__ring_m7);
        }
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      break __ring_match6;
    }
    __match_fail(__ring_m6);
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
    __ring_match8: {
      const __ring_m8 = resolved;
      if (__ring_m8._tag === "none") {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0705, `Cannot use '${qualifier}' — relative path exceeds module nesting depth`, use_decl.path.span, diagnostics$DiagnosticContext_OtherContext(Option_some("relative path out of scope")));
        continue;
        break __ring_match8;
      }
      if (__ring_m8._tag === "some") {
        const prefix = __ring_m8._0;
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
              const qualified_name = ((prefix === "") ? item.name : `${prefix}::${item.name}`);
              __ring_match10: {
                const __ring_m10 = env$TypeEnv_lookup(ctx.env, qualified_name);
                if (__ring_m10._tag === "some") {
                  const scheme = __ring_m10._0;
                  env$TypeEnv_bind(ctx.env, local_name, scheme);
                  if ((local_name !== qualified_name)) {
                    _Map_insert(ctx.use_aliases, local_name, qualified_name);
                  }
                  break __ring_match10;
                }
                if (__ring_m10._tag === "none") {
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `Undefined variable: ${qualified_name}`, item.span, diagnostics$DiagnosticContext_UndefinedVariable(qualified_name, Option_none));
                  break __ring_match10;
                }
                __match_fail(__ring_m10);
              }
            }
            break __ring_match9;
          }
          if (__ring_m9._tag === "Module") {
            if ((name_start_idx < List_len(segments))) {
              const name = Option_unwrap_or(List_get(segments, (List_len(segments) - 1)), "");
              const qualified_name = ((prefix === "") ? name : `${prefix}::${name}`);
              __ring_match11: {
                const __ring_m11 = env$TypeEnv_lookup(ctx.env, qualified_name);
                if (__ring_m11._tag === "some") {
                  const scheme = __ring_m11._0;
                  env$TypeEnv_bind(ctx.env, name, scheme);
                  if ((name !== qualified_name)) {
                    _Map_insert(ctx.use_aliases, name, qualified_name);
                  }
                  break __ring_match11;
                }
                if (__ring_m11._tag === "none") {
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `Undefined variable: ${qualified_name}`, use_decl.path.span, diagnostics$DiagnosticContext_UndefinedVariable(qualified_name, Option_none));
                  break __ring_match11;
                }
                __match_fail(__ring_m11);
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
  __ring_match12: {
    const __ring_m12 = type_annotation;
    if (__ring_m12._tag === "some") {
      const texpr = __ring_m12._0;
      expected_ty = Option_some(infer_ctx$resolve_type_expr(ctx, texpr));
      break __ring_match12;
    }
    if (__ring_m12._tag === "none") {
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
  const init_r = infer$infer_expr(ctx, init, ctx.subst, __ring_ev_fail);
  let s = init_r.subst;
  let init_ty = hir$hexpr_type(init_r.hexpr);
  __ring_match13: {
    const __ring_m13 = expected_ty;
    if (__ring_m13._tag === "some") {
      const ann_ty = __ring_m13._0;
      s = infer_ctx$unify_at(ctx.sink, ctx.env, init_ty, ann_ty, s, span);
      init_ty = env$apply_subst(s, ann_ty);
      break __ring_match13;
    }
    if (__ring_m13._tag === "none") {
      break __ring_match13;
    }
    __match_fail(__ring_m13);
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
    List_push(hops, new hir$HEffectOp(op.name, op_params, op.return_type));
    oi = (oi + 1);
  }
  return hir$HDecl_Effect(name, type_params, hops, is_pub, span);
}

function update_impl_method_effects(ctx, target_type, method_name, effects) {
  __ring_match14: {
    const __ring_m14 = _Map_get(ctx.env.trait_reg.impl_methods, target_type);
    if (__ring_m14._tag === "some") {
      const methods_map = __ring_m14._0;
      __ring_match15: {
        const __ring_m15 = _Map_get(methods_map, method_name);
        if (__ring_m15._tag === "some") {
          const scheme = __ring_m15._0;
          __ring_match16: {
            const __ring_m16 = scheme.ty;
            if (__ring_m16._tag === "FnType") {
              const params = __ring_m16.params; const return_type = __ring_m16.return_type;
              const updated_ty = types$Type_FnType(params, return_type, effects);
              return _Map_insert(methods_map, method_name, new env$TypeScheme(updated_ty, scheme.type_vars, scheme.bounds, scheme.def_id));
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
      break __ring_match14;
    }
    if (__ring_m14._tag === "none") {
      break __ring_match14;
    }
    __match_fail(__ring_m14);
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
    __ring_match17: {
      const __ring_m17 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m17._tag === "some") {
        const tv = __ring_m17._0;
        List_push(impl_tp_types, tv);
        break __ring_match17;
      }
      if (__ring_m17._tag === "none") {
        List_push(impl_tp_types, env$TypeEnv_fresh_var(ctx.env));
        break __ring_match17;
      }
      __match_fail(__ring_m17);
    }
  }
  __ring_match18: {
    const __ring_m18 = _Map_get(ctx.env.types.structs, target_type);
    if (__ring_m18._tag === "some") {
      const def = __ring_m18._0;
      return types$Type_StructType(def.name, impl_tp_types, def.fields);
      break __ring_match18;
    }
    if (__ring_m18._tag === "none") {
      __ring_match19: {
        const __ring_m19 = _Map_get(ctx.env.types.enums, target_type);
        if (__ring_m19._tag === "some") {
          const def = __ring_m19._0;
          return types$Type_EnumType(def.name, impl_tp_types, def.variants);
          break __ring_match19;
        }
        if (__ring_m19._tag === "none") {
          return infer_ctx$resolve_self_type(ctx, target_type);
          break __ring_match19;
        }
        __match_fail(__ring_m19);
      }
      break __ring_match18;
    }
    __match_fail(__ring_m18);
  }
})() : infer_ctx$resolve_self_type(ctx, target_type));
  const saved_impl_bounds = ctx.current_fn_bounds;
  let impl_bounds = [];
  for (const tp of type_params) {
    __ring_match20: {
      const __ring_m20 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m20._tag === "some") {
        const tv = __ring_m20._0;
        __ring_match21: {
          const __ring_m21 = tv;
          if (__ring_m21._tag === "TypeVar") {
            const id = __ring_m21.id;
            for (const bound of tp.bounds) {
              List_push(impl_bounds, new infer_ctx$FnBoundsEntry(id, bound.trait_name, tp.name));
            }
            break __ring_match21;
          }
          break __ring_match21;
        }
        break __ring_match20;
      }
      if (__ring_m20._tag === "none") {
        break __ring_match20;
      }
      __match_fail(__ring_m20);
    }
  }
  ctx.current_fn_bounds = impl_bounds;
  let hmethods = [];
  for (const method of methods) {
    __ring_match22: {
      const __ring_m22 = method;
      if (__ring_m22._tag === "ExternFn") {
        const name = __ring_m22.name; const mtps = __ring_m22.type_params; const params = __ring_m22.params; const return_type = __ring_m22.return_type; const declared_effects = __ring_m22.declared_effects; const is_pub = __ring_m22.is_pub; const mspan = __ring_m22.span;
        List_push(hmethods, check_extern_fn_decl(ctx, name, mtps, params, declared_effects, is_pub, mspan, __ring_ev_fail));
        break __ring_match22;
      }
      if (__ring_m22._tag === "Fn") {
        const name = __ring_m22.name; const mtps = __ring_m22.type_params; const params = __ring_m22.params; const return_type = __ring_m22.return_type; const declared_effects = __ring_m22.declared_effects; const body = __ring_m22.body; const is_pub = __ring_m22.is_pub; const mspan = __ring_m22.span;
        const hdecl = check_fn_decl(ctx, name, mtps, params, return_type, declared_effects, body, is_pub, mspan, Option_some(impl_self_type), __ring_ev_fail);
        List_push(hmethods, hdecl);
        __ring_match23: {
          const __ring_m23 = hdecl;
          if (__ring_m23._tag === "Fn") {
            const mname = __ring_m23.name; const inferred_effects = __ring_m23.effects;
            if ((List_len(inferred_effects.effects) > 0)) {
              update_impl_method_effects(ctx, target_type, mname, inferred_effects);
            }
            break __ring_match23;
          }
          break __ring_match23;
        }
        break __ring_match22;
      }
      break __ring_match22;
    }
  }
  ctx.current_fn_bounds = saved_impl_bounds;
  ctx.type_param_scope = saved_tp_scope;
  return hir$HDecl_Impl(target_type, type_params, trait_name, hmethods, span);
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
    __ring_match24: {
      const __ring_m24 = List_first(trait_def.methods);
      if (__ring_m24._tag === "some") {
        const first_method = __ring_m24._0;
        __ring_match25: {
          const __ring_m25 = first_method.ty;
          if (__ring_m25._tag === "FnType") {
            const fps = __ring_m25.params;
            if ((List_len(fps) > 0)) {
              __ring_match26: {
                const __ring_m26 = List_first(fps);
                if (__ring_m26._tag === "some") {
                  const fp = __ring_m26._0;
                  self_var = fp;
                  break __ring_match26;
                }
                if (__ring_m26._tag === "none") {
                  break __ring_match26;
                }
                __match_fail(__ring_m26);
              }
            }
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
      __ring_match27: {
        const __ring_m27 = ast_method;
        if (__ring_m27._tag === "some") {
          const am = __ring_m27._0;
          __ring_match28: {
            const __ring_m28 = am;
            if (__ring_m28._tag === "Fn") {
              const abody = __ring_m28.body;
              const has_body = (function() {
  const __ring_m = abody;
  if (__ring_m._tag === "Block") { const stmts = __ring_m.stmts; const tail = __ring_m.tail; return ((List_len(stmts) > 0) || Option_is_some(tail)); }
  return true;
})();
              if (has_body) {
                method_body = check_trait_default_body(ctx, name, self_var, hparams, abody);
              }
              break __ring_match28;
            }
            break __ring_match28;
          }
          break __ring_match27;
        }
        if (__ring_m27._tag === "none") {
          break __ring_match27;
        }
        __match_fail(__ring_m27);
      }
    }
    List_push(hmethods, new hir$HTraitMethod(m.name, hparams, fn_ret, m.has_default, method_body));
  }
  return hir$HDecl_Trait(name, type_params, hmethods, is_pub, span);
}

function check_trait_default_body(ctx, trait_name, self_var, hparams, body) {
  const saved_subst = ctx.subst;
  ctx.subst = unify$empty_subst();
  env$TypeEnv_push_scope(ctx.env);
  List_push(ctx.fn_bounds_stack, ctx.current_fn_bounds);
  ctx.current_fn_bounds = [];
  __ring_match29: {
    const __ring_m29 = self_var;
    if (__ring_m29._tag === "TypeVar") {
      const id = __ring_m29.id;
      List_push(ctx.current_fn_bounds, new infer_ctx$FnBoundsEntry(id, trait_name, "self"));
      break __ring_match29;
    }
    break __ring_match29;
  }
  for (const p of hparams) {
    env$TypeEnv_bind_mono(ctx.env, p.name, p.ty);
    if (p.is_mutable) {
      __ring_match30: {
        const __ring_m30 = env$TypeEnv_lookup(ctx.env, p.name);
        if (__ring_m30._tag === "some") {
          const ps = __ring_m30._0;
          __ring_match31: {
            const __ring_m31 = ps.def_id;
            if (__ring_m31._tag === "some") {
              const did = __ring_m31._0;
              _Set_insert(ctx.env.scope.mutable_vars, did);
              break __ring_match31;
            }
            if (__ring_m31._tag === "none") {
              break __ring_match31;
            }
            __match_fail(__ring_m31);
          }
          break __ring_match30;
        }
        if (__ring_m30._tag === "none") {
          break __ring_match30;
        }
        __match_fail(__ring_m30);
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
    __ring_match32: {
      const __ring_m32 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m32._tag === "some") {
        const tv = __ring_m32._0;
        __ring_match33: {
          const __ring_m33 = tv;
          if (__ring_m33._tag === "TypeVar") {
            const resolved = env$apply_subst(ctx.subst, tv);
            __ring_match34: {
              const __ring_m34 = resolved;
              if (__ring_m34._tag === "TypeVar") {
                const rid = __ring_m34.id;
                _Map_insert(local_names, rid, tp.name);
                break __ring_match34;
              }
              break __ring_match34;
            }
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
      __ring_match35: {
        const __ring_m35 = tv;
        if (__ring_m35._tag === "TypeVar") {
          const resolved = env$apply_subst(ctx.subst, tv);
          __ring_match36: {
            const __ring_m36 = resolved;
            if (__ring_m36._tag === "TypeVar") {
              const rid = __ring_m36.id;
              _Map_insert(local_names, rid, tpname);
              break __ring_match36;
            }
            break __ring_match36;
          }
          break __ring_match35;
        }
        break __ring_match35;
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
    __ring_match37: {
      const __ring_m37 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m37._tag === "some") {
        const tv = __ring_m37._0;
        __ring_match38: {
          const __ring_m38 = tv;
          if (__ring_m38._tag === "TypeVar") {
            const id = __ring_m38.id;
            for (const bound of tp.bounds) {
              List_push(ctx.current_fn_bounds, new infer_ctx$FnBoundsEntry(id, bound.trait_name, tp.name));
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
    __ring_match39: {
      const __ring_m39 = param_scheme;
      if (__ring_m39._tag === "some") {
        const ps = __ring_m39._0;
        __ring_match40: {
          const __ring_m40 = ps.def_id;
          if (__ring_m40._tag === "some") {
            const did = __ring_m40._0;
            env$TypeEnv_record_def_span(ctx.env, did, p.span);
            if (p.is_mutable) {
              _Set_insert(ctx.env.scope.mutable_vars, did);
            } else {
              _Set_insert(ctx.env.scope.let_defs, did);
            }
            break __ring_match40;
          }
          if (__ring_m40._tag === "none") {
            break __ring_match40;
          }
          __match_fail(__ring_m40);
        }
        List_push(hparams, new hir$HParam(p.name, ptype, ps.def_id, p.is_mutable));
        break __ring_match39;
      }
      if (__ring_m39._tag === "none") {
        List_push(hparams, new hir$HParam(p.name, ptype, Option_none, p.is_mutable));
        break __ring_match39;
      }
      __match_fail(__ring_m39);
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
      __ring_match41: {
        const __ring_m41 = eff;
        if (__ring_m41._tag === "CustomEffect") {
          const eff_name = __ring_m41.name;
          const _ = infer_ctx$type_error(ctx.sink, codes$E0403, `Unhandled effect '${eff_name}' in main function; custom effects must be handled before reaching main`, span, diagnostics$DiagnosticContext_EffectUnhandled(eff_name, Option_some("main")));
          break __ring_match41;
        }
        break __ring_match41;
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
  __ring_match42: {
    const __ring_m42 = fn_def_id;
    if (__ring_m42._tag === "some") {
      const did = __ring_m42._0;
      env$TypeEnv_record_def_span(ctx.env, did, span);
      break __ring_match42;
    }
    if (__ring_m42._tag === "none") {
      break __ring_match42;
    }
    __match_fail(__ring_m42);
  }
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
  List_push(hdecls, hd);
  __ring_match43: {
    const __ring_m43 = hd;
    if (__ring_m43._tag === "Fn") {
      const name = __ring_m43.name; const effects = __ring_m43.effects;
      if ((List_len(effects.effects) > 0)) {
        return infer_ctx$update_fn_effects(ctx.env, name, effects);
      }
      break __ring_match43;
    }
    break __ring_match43;
  }
}

function check(ctx, program, __ring_ev_fail) {
  infer_register$register_decls_two_phase(ctx, program.decls);
  const derived_impls = derive$run_derive_pass(ctx.env);
  let hdecls = [];
  for (const decl of program.decls) {
    const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(check_one_decl(ctx, decl, hdecls, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  }
  return new hir$HProgram(hdecls, derived_impls);
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


export { check, resolve_type_expr_public, check_prelude_decl };