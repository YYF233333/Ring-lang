import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { make_diag as diagnostics$make_diag, make_diagnostic as diagnostics$make_diagnostic, new_collecting_sink as diagnostics$new_collecting_sink, severity_to_str as diagnostics$severity_to_str, CollectingSink as diagnostics$CollectingSink, Diagnostic as diagnostics$Diagnostic, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, DiagnosticNote as diagnostics$DiagnosticNote, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, Suggestion as diagnostics$Suggestion, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Severity_Eq as diagnostics$__Severity_Eq, __Severity_Clone as diagnostics$__Severity_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __Severity_Debug as diagnostics$__Severity_Debug, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Suggestion_Debug as diagnostics$__Suggestion_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { add_impl as env$add_impl, apply_subst as env$apply_subst, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_map as env$apply_subst_map, apply_subst_row as env$apply_subst_row, apply_subst_row_map as env$apply_subst_row_map, find_impl as env$find_impl, has_impl as env$has_impl, lookup_variant as env$lookup_variant, mono as env$mono, new_type_env as env$new_type_env, AssocConstraintEntry as env$AssocConstraintEntry, AssocTypeDef as env$AssocTypeDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectAliasDef as env$EffectAliasDef, EffectDef as env$EffectDef, EffectOpDef as env$EffectOpDef, EnumDef as env$EnumDef, FnBound as env$FnBound, IdGen as env$IdGen, ImplEntry as env$ImplEntry, SchemeBound as env$SchemeBound, Scope as env$Scope, ScopeManager as env$ScopeManager, SigDef as env$SigDef, StructDef as env$StructDef, TraitDef as env$TraitDef, TraitMethodDef as env$TraitMethodDef, TraitRegistry as env$TraitRegistry, TypeAliasDef as env$TypeAliasDef, TypeEnv as env$TypeEnv, TypeRegistry as env$TypeRegistry, TypeScheme as env$TypeScheme, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __BuiltInKind_Debug as env$__BuiltInKind_Debug, __FnBound_Eq as env$__FnBound_Eq, __FnBound_Clone as env$__FnBound_Clone, __FnBound_Ord as env$__FnBound_Ord, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Eq as env$__IdGen_Eq, __IdGen_Clone as env$__IdGen_Clone, __IdGen_Ord as env$__IdGen_Ord, __IdGen_Debug as env$__IdGen_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { get_or_create_methods as builtins$get_or_create_methods, register_builtins as builtins$register_builtins, register_hof_intrinsics as builtins$register_hof_intrinsics } from "./builtins.js";
import { check as infer_decl$check, check_prelude_decl as infer_decl$check_prelude_decl, resolve_type_expr_public as infer_decl$resolve_type_expr_public } from "./infer_decl.js";
import { lower_dicts as dict_lower$lower_dicts } from "./dict_lower.js";
import { lower_andor as andor_lower$lower_andor } from "./andor_lower.js";
import { bind_pattern as infer_ctx$bind_pattern, build_scheme_var_map as infer_ctx$build_scheme_var_map, collect_free_vars as infer_ctx$collect_free_vars, free_type_vars as infer_ctx$free_type_vars, free_type_vars_in_env as infer_ctx$free_type_vars_in_env, generalize as infer_ctx$generalize, merge_effects as infer_ctx$merge_effects, new_infer_ctx as infer_ctx$new_infer_ctx, remove_fail_effect as infer_ctx$remove_fail_effect, resolve_dicts_from_scheme as infer_ctx$resolve_dicts_from_scheme, resolve_named_type as infer_ctx$resolve_named_type, resolve_relative_qualifier as infer_ctx$resolve_relative_qualifier, resolve_self_type as infer_ctx$resolve_self_type, resolve_type_expr as infer_ctx$resolve_type_expr, type_error as infer_ctx$type_error, type_error_with_notes as infer_ctx$type_error_with_notes, unify_at as infer_ctx$unify_at, unify_at_noted as infer_ctx$unify_at_noted, update_fn_effects as infer_ctx$update_fn_effects, CompileError as infer_ctx$CompileError, FnBoundsEntry as infer_ctx$FnBoundsEntry, InferCtx as infer_ctx$InferCtx, InferResult as infer_ctx$InferResult, __CompileError_Eq as infer_ctx$__CompileError_Eq, __CompileError_Clone as infer_ctx$__CompileError_Clone, __CompileError_Ord as infer_ctx$__CompileError_Ord, __CompileError_Debug as infer_ctx$__CompileError_Debug, __FnBoundsEntry_Eq as infer_ctx$__FnBoundsEntry_Eq, __FnBoundsEntry_Clone as infer_ctx$__FnBoundsEntry_Clone, __FnBoundsEntry_Ord as infer_ctx$__FnBoundsEntry_Ord, __FnBoundsEntry_Debug as infer_ctx$__FnBoundsEntry_Debug } from "./infer_ctx.js";
import { collect_all_supertraits as infer_register$collect_all_supertraits, inject_assoc_types_from_bounds as infer_register$inject_assoc_types_from_bounds, insert_mod_aliases as infer_register$insert_mod_aliases, prefix_decl_name as infer_register$prefix_decl_name, register_decl_public as infer_register$register_decl_public, register_decls_two_phase as infer_register$register_decls_two_phase, resolve_declared_effects as infer_register$resolve_declared_effects, resolve_effect_expr as infer_register$resolve_effect_expr } from "./infer_register.js";
import { extract_exports as exports$extract_exports, ModuleExports as exports$ModuleExports, TypeDef_StructDef_ as exports$TypeDef_StructDef_, TypeDef_EnumDef_ as exports$TypeDef_EnumDef_ } from "./exports.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0105 as codes$E0105, E0106 as codes$E0106, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0405 as codes$E0405, E0406 as codes$E0406, E0407 as codes$E0407, E0408 as codes$E0408, E0409 as codes$E0409, E0410 as codes$E0410, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0504 as codes$E0504, E0505 as codes$E0505, E0506 as codes$E0506, E0507 as codes$E0507, E0508 as codes$E0508, E0509 as codes$E0509, E0510 as codes$E0510, E0511 as codes$E0511, E0512 as codes$E0512, E0513 as codes$E0513, E0514 as codes$E0514, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, W0001 as codes$W0001, W0002 as codes$W0002, error_category as codes$error_category, error_description as codes$error_description } from "./codes.js";
import { PREC_ADD_SUB as parser$PREC_ADD_SUB, PREC_CATCH as parser$PREC_CATCH, PREC_COMPARE as parser$PREC_COMPARE, PREC_EQUALITY as parser$PREC_EQUALITY, PREC_LOGIC_AND as parser$PREC_LOGIC_AND, PREC_LOGIC_OR as parser$PREC_LOGIC_OR, PREC_MUL_DIV as parser$PREC_MUL_DIV, PREC_NONE as parser$PREC_NONE, PREC_POSTFIX as parser$PREC_POSTFIX, PREC_RANGE as parser$PREC_RANGE, PREC_UNARY as parser$PREC_UNARY, expr_span as parser$expr_span, infix_precedence as parser$infix_precedence, new_parser as parser$new_parser, parse as parser$parse, pattern_span as parser$pattern_span, type_expr_span as parser$type_expr_span, Parser as parser$Parser, __Parser_Clone as parser$__Parser_Clone, __Parser_Debug as parser$__Parser_Debug, Parser_peek as parser$Parser_peek, Parser_peek_at as parser$Parser_peek_at, Parser_advance as parser$Parser_advance, Parser_check as parser$Parser_check, Parser_try_consume as parser$Parser_try_consume, Parser_expect as parser$Parser_expect, Parser_at_end as parser$Parser_at_end, Parser_current_span_start as parser$Parser_current_span_start, Parser_make_span as parser$Parser_make_span, Parser_report_error as parser$Parser_report_error, Parser_error as parser$Parser_error, Parser_parse_program as parser$Parser_parse_program, Parser_parse_stmt as parser$Parser_parse_stmt, Parser_parse_while_stmt as parser$Parser_parse_while_stmt, Parser_parse_loop_stmt as parser$Parser_parse_loop_stmt, Parser_parse_for_in_stmt as parser$Parser_parse_for_in_stmt, Parser_parse_break_stmt as parser$Parser_parse_break_stmt, Parser_parse_continue_stmt as parser$Parser_parse_continue_stmt, Parser_parse_if_let_stmt as parser$Parser_parse_if_let_stmt, Parser_parse_binding_stmt as parser$Parser_parse_binding_stmt, Parser_parse_binding_body as parser$Parser_parse_binding_body, Parser_parse_return_stmt as parser$Parser_parse_return_stmt, Parser_parse_return_expr as parser$Parser_parse_return_expr, Parser_parse_block_expr as parser$Parser_parse_block_expr, Parser_parse_use_decl as parser$Parser_parse_use_decl, Parser_parse_mod_block as parser$Parser_parse_mod_block, Parser_parse_decl as parser$Parser_parse_decl, Parser_parse_effect_list as parser$Parser_parse_effect_list, Parser_parse_effect_annotation as parser$Parser_parse_effect_annotation, Parser_parse_fn_decl as parser$Parser_parse_fn_decl, Parser_parse_const_decl as parser$Parser_parse_const_decl, Parser_parse_sig_block as parser$Parser_parse_sig_block, Parser_parse_extern_decl as parser$Parser_parse_extern_decl, Parser_parse_extern_fn_decl_body as parser$Parser_parse_extern_fn_decl_body, Parser_parse_extern_type_decl_body as parser$Parser_parse_extern_type_decl_body, Parser_parse_type_alias_decl as parser$Parser_parse_type_alias_decl, Parser_parse_struct_decl as parser$Parser_parse_struct_decl, Parser_parse_enum_decl as parser$Parser_parse_enum_decl, Parser_parse_impl_decl as parser$Parser_parse_impl_decl, Parser_parse_effect_alias_decl as parser$Parser_parse_effect_alias_decl, Parser_parse_effect_decl as parser$Parser_parse_effect_decl, Parser_parse_test_decl as parser$Parser_parse_test_decl, Parser_parse_assoc_type_decl as parser$Parser_parse_assoc_type_decl, Parser_parse_trait_decl as parser$Parser_parse_trait_decl, Parser_parse_expr as parser$Parser_parse_expr, Parser_parse_expr_no_struct as parser$Parser_parse_expr_no_struct, Parser_parse_expr_bp as parser$Parser_parse_expr_bp, Parser_parse_prefix as parser$Parser_parse_prefix, Parser_parse_dot_expr as parser$Parser_parse_dot_expr, Parser_parse_index_expr as parser$Parser_parse_index_expr, Parser_parse_call_expr as parser$Parser_parse_call_expr, Parser_parse_arg_list as parser$Parser_parse_arg_list, Parser_parse_catch_expr as parser$Parser_parse_catch_expr, Parser_parse_string_interp as parser$Parser_parse_string_interp, Parser_parse_if_expr as parser$Parser_parse_if_expr, Parser_parse_match_expr as parser$Parser_parse_match_expr, Parser_parse_match_arm as parser$Parser_parse_match_arm, Parser_parse_pattern as parser$Parser_parse_pattern, Parser_parse_handle_expr as parser$Parser_parse_handle_expr, Parser_parse_effect_handler as parser$Parser_parse_effect_handler, Parser_parse_lambda_expr as parser$Parser_parse_lambda_expr, Parser_parse_struct_literal as parser$Parser_parse_struct_literal, Parser_try_parse_type_args as parser$Parser_try_parse_type_args, Parser_parse_type_expr as parser$Parser_parse_type_expr, Parser_parse_record_type_expr as parser$Parser_parse_record_type_expr, Parser_parse_qualified_ident as parser$Parser_parse_qualified_ident, Parser_validate_target_type_args as parser$Parser_validate_target_type_args, Parser_parse_type_params as parser$Parser_parse_type_params, Parser_parse_type_bound as parser$Parser_parse_type_bound, Parser_parse_params as parser$Parser_parse_params, Parser_parse_param as parser$Parser_parse_param } from "./parser.js";
import { new_union_find as union_find$new_union_find, uf_bind as union_find$uf_bind, uf_find as union_find$uf_find, uf_insert as union_find$uf_insert, uf_lookup as union_find$uf_lookup, uf_union as union_find$uf_union, UnionFind as union_find$UnionFind } from "./union_find.js";
import { empty_subst as unify$empty_subst, occurs_in as unify$occurs_in, unify as unify$unify, unify_effect_params as unify$unify_effect_params, unify_effect_rows as unify$unify_effect_rows, UnificationError as unify$UnificationError, __UnificationError_Eq as unify$__UnificationError_Eq, __UnificationError_Clone as unify$__UnificationError_Clone, __UnificationError_Ord as unify$__UnificationError_Ord, __UnificationError_Debug as unify$__UnificationError_Debug } from "./unify.js";



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

class CheckResult {
  constructor(program, env, fn_mut_params) {
    this.program = program;
    this.env = env;
    this.fn_mut_params = fn_mut_params;
  }
}

const STD_FILES = ["io.ring", "iterator.ring", "list.ring", "map.ring", "set.ring", "str.ring", "num.ring", "result.ring", "fs.ring", "path.ring", "process.ring"];

function new_infer_ctx(sink) {
  let env = env$new_type_env();
  builtins$register_builtins(env);
  builtins$register_hof_intrinsics(env);
  return new infer_ctx$InferCtx(env, unify$empty_subst(), sink, map_new(), Option_none, [], [], 0, [], map_new(), set_new(), 0, map_new(), map_new(), map_new(), map_new(), map_new(), map_new());
}

function find_std_dir() {
  const candidates = [path_resolve(path_join(path_dirname(path_resolve(".")), "std")), path_resolve("std")];
  const __ring_iter_2 = __List_Iterable.iter(candidates);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const dir = __ring_next_2._0;
    if (file_exists(dir)) {
      return Option_some(dir);
    }
  }
  return Option_none;
}

function load_prelude(ctx) {
  let prelude_hdecls = [];
  __ring_match6: {
    const __ring_m6 = find_std_dir();
    if (__ring_m6._tag === "some") {
      const std_dir = __ring_m6._0;
      let all_prelude_decls = [];
      const __ring_iter_3 = __List_Iterable.iter(STD_FILES);
      while (true) {
        const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
        if (__ring_next_3._tag === "none") break;
        const file = __ring_next_3._0;
        const file_path = path_join(std_dir, file);
        if (file_exists(file_path)) {
          const source = read_file(file_path);
          const prelude_sink = diagnostics$new_collecting_sink();
          const ast = parser$parse(source, file_path, prelude_sink);
          const __ring_iter_4 = __List_Iterable.iter(ast.decls);
          while (true) {
            const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
            if (__ring_next_4._tag === "none") break;
            const decl = __ring_next_4._0;
            infer_register$register_decl_public(ctx, decl);
            List_push(all_prelude_decls, decl);
          }
        }
      }
      const __ring_iter_5 = __List_Iterable.iter(all_prelude_decls);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const decl = __ring_next_5._0;
        __ring_match7: {
          const __ring_m7 = decl;
          if (__ring_m7._tag === "Struct") {
            const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_decl$check_prelude_decl(ctx, decl, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
            __ring_match8: {
              const __ring_m8 = result;
              if (__ring_m8._tag === "some") {
                const hd = __ring_m8._0;
                List_push(prelude_hdecls, hd);
                break __ring_match8;
              }
              if (__ring_m8._tag === "none") {
                break __ring_match8;
              }
              __match_fail(__ring_m8);
            }
            break __ring_match7;
          }
          if (__ring_m7._tag === "Enum") {
            const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_decl$check_prelude_decl(ctx, decl, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
            __ring_match9: {
              const __ring_m9 = result;
              if (__ring_m9._tag === "some") {
                const hd = __ring_m9._0;
                List_push(prelude_hdecls, hd);
                break __ring_match9;
              }
              if (__ring_m9._tag === "none") {
                break __ring_match9;
              }
              __match_fail(__ring_m9);
            }
            break __ring_match7;
          }
          if (__ring_m7._tag === "Trait") {
            const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_decl$check_prelude_decl(ctx, decl, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
            __ring_match10: {
              const __ring_m10 = result;
              if (__ring_m10._tag === "some") {
                const hd = __ring_m10._0;
                List_push(prelude_hdecls, hd);
                break __ring_match10;
              }
              if (__ring_m10._tag === "none") {
                break __ring_match10;
              }
              __match_fail(__ring_m10);
            }
            break __ring_match7;
          }
          if (__ring_m7._tag === "Impl") {
            const target_type = __ring_m7.target_type; const type_params = __ring_m7.type_params; const trait_name = __ring_m7.trait_name; const methods = __ring_m7.methods; const span = __ring_m7.span;
            let fn_methods = [];
            const __ring_iter_6 = __List_Iterable.iter(methods);
            while (true) {
              const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
              if (__ring_next_6._tag === "none") break;
              const m = __ring_next_6._0;
              __ring_match11: {
                const __ring_m11 = m;
                if (__ring_m11._tag === "Fn") {
                  List_push(fn_methods, m);
                  break __ring_match11;
                }
                break __ring_match11;
              }
            }
            if ((List_len(fn_methods) > 0)) {
              const filtered_decl = ast$Decl_Impl(target_type, type_params, trait_name, fn_methods, span);
              const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_decl$check_prelude_decl(ctx, filtered_decl, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
              __ring_match12: {
                const __ring_m12 = result;
                if (__ring_m12._tag === "some") {
                  const hd = __ring_m12._0;
                  List_push(prelude_hdecls, hd);
                  break __ring_match12;
                }
                if (__ring_m12._tag === "none") {
                  break __ring_match12;
                }
                __match_fail(__ring_m12);
              }
            }
            break __ring_match7;
          }
          if (__ring_m7._tag === "Fn") {
            const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_decl$check_prelude_decl(ctx, decl, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
            __ring_match13: {
              const __ring_m13 = result;
              if (__ring_m13._tag === "some") {
                const hd = __ring_m13._0;
                List_push(prelude_hdecls, hd);
                break __ring_match13;
              }
              if (__ring_m13._tag === "none") {
                break __ring_match13;
              }
              __match_fail(__ring_m13);
            }
            break __ring_match7;
          }
          break __ring_match7;
        }
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
  return prelude_hdecls;
}

function check(program, sink) {
  let ctx = new_infer_ctx(sink);
  const prelude_hdecls = load_prelude(ctx);
  const hprogram = infer_decl$check(ctx, program);
  let all_decls = list_clone(prelude_hdecls);
  const __ring_iter_7 = __List_Iterable.iter(hprogram.decls);
  while (true) {
    const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
    if (__ring_next_7._tag === "none") break;
    const d = __ring_next_7._0;
    List_push(all_decls, d);
  }
  const assembled = new hir$HProgram(all_decls, hprogram.derived_impls, hprogram.boxed_vars, []);
  return new CheckResult(dict_lower$lower_dicts(andor_lower$lower_andor(assembled)), ctx.env, ctx.fn_mut_params);
}

function inject_module_exports(ctx, exports) {
  const __ring_iter_8 = __List_Iterable.iter(exports);
  while (true) {
    const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
    if (__ring_next_8._tag === "none") break;
    const mod_ = __ring_next_8._0;
    let sorted_types = _Map_entries(mod_.types);
    sorted_types.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
    const __ring_iter_9 = __List_Iterable.iter(sorted_types);
    while (true) {
      const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
      if (__ring_next_9._tag === "none") break;
      const entry = __ring_next_9._0;
      const __ring_dt0 = entry;
      const name = __ring_dt0[0];
      const def = __ring_dt0[1];
      __ring_match14: {
        const __ring_m14 = def;
        if (__ring_m14._tag === "StructDef_") {
          const sdef = __ring_m14._0;
          _Map_insert(ctx.env.types.structs, name, sdef);
          break __ring_match14;
        }
        if (__ring_m14._tag === "EnumDef_") {
          const edef = __ring_m14._0;
          _Map_insert(ctx.env.types.enums, name, edef);
          const __ring_iter_10 = __List_Iterable.iter(edef.variants);
          while (true) {
            const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
            if (__ring_next_10._tag === "none") break;
            const v = __ring_next_10._0;
            _Map_insert(ctx.env.types.variant_to_enum, v.name, name);
          }
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
    }
    let sorted_effects = _Map_entries(mod_.effects);
    sorted_effects.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
    const __ring_iter_11 = __List_Iterable.iter(sorted_effects);
    while (true) {
      const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
      if (__ring_next_11._tag === "none") break;
      const entry = __ring_next_11._0;
      const __ring_dt1 = entry;
      const name = __ring_dt1[0];
      const effdef = __ring_dt1[1];
      _Map_insert(ctx.env.types.effects, name, effdef);
    }
    let sorted_aliases = _Map_entries(mod_.effect_aliases);
    sorted_aliases.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
    const __ring_iter_12 = __List_Iterable.iter(sorted_aliases);
    while (true) {
      const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
      if (__ring_next_12._tag === "none") break;
      const entry = __ring_next_12._0;
      const __ring_dt2 = entry;
      const name = __ring_dt2[0];
      const adef = __ring_dt2[1];
      _Map_insert(ctx.env.types.effect_aliases, name, adef);
    }
    let sorted_traits = _Map_entries(mod_.traits);
    sorted_traits.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
    const __ring_iter_13 = __List_Iterable.iter(sorted_traits);
    while (true) {
      const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
      if (__ring_next_13._tag === "none") break;
      const entry = __ring_next_13._0;
      const __ring_dt3 = entry;
      const name = __ring_dt3[0];
      const tdef = __ring_dt3[1];
      _Map_insert(ctx.env.trait_reg.traits, name, tdef);
    }
    const __ring_iter_14 = __List_Iterable.iter(mod_.trait_impls);
    while (true) {
      const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
      if (__ring_next_14._tag === "none") break;
      const impl_ = __ring_next_14._0;
      env$add_impl(ctx.env.trait_reg, impl_);
    }
    let sorted_impl_methods = _Map_entries(mod_.impl_methods);
    sorted_impl_methods.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
    const __ring_iter_15 = __List_Iterable.iter(sorted_impl_methods);
    while (true) {
      const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
      if (__ring_next_15._tag === "none") break;
      const entry = __ring_next_15._0;
      const __ring_dt4 = entry;
      const type_name = __ring_dt4[0];
      const methods = __ring_dt4[1];
      __ring_match15: {
        const __ring_m15 = _Map_get(ctx.env.trait_reg.impl_methods, type_name);
        if (__ring_m15._tag === "some") {
          const existing = __ring_m15._0;
          let sorted_meths = _Map_entries(methods);
          sorted_meths.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
          const __ring_iter_16 = __List_Iterable.iter(sorted_meths);
          while (true) {
            const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
            if (__ring_next_16._tag === "none") break;
            const mentry = __ring_next_16._0;
            const __ring_dt5 = mentry;
            const method_name = __ring_dt5[0];
            const scheme = __ring_dt5[1];
            _Map_insert(existing, method_name, scheme);
          }
          break __ring_match15;
        }
        if (__ring_m15._tag === "none") {
          _Map_insert(ctx.env.trait_reg.impl_methods, type_name, map_clone(methods));
          break __ring_match15;
        }
        __match_fail(__ring_m15);
      }
    }
    let sorted_mut = _Map_entries(mod_.mut_methods);
    sorted_mut.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
    const __ring_iter_17 = __List_Iterable.iter(sorted_mut);
    while (true) {
      const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
      if (__ring_next_17._tag === "none") break;
      const entry = __ring_next_17._0;
      const __ring_dt6 = entry;
      const type_name = __ring_dt6[0];
      const method_set = __ring_dt6[1];
      __ring_match16: {
        const __ring_m16 = _Map_get(ctx.env.trait_reg.mut_methods, type_name);
        if (__ring_m16._tag === "some") {
          const existing = __ring_m16._0;
          const __ring_iter_18 = __List_Iterable.iter(_Set_to_list(method_set));
          while (true) {
            const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
            if (__ring_next_18._tag === "none") break;
            const m = __ring_next_18._0;
            _Set_insert(existing, m);
          }
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          let new_set = set_new();
          const __ring_iter_19 = __List_Iterable.iter(_Set_to_list(method_set));
          while (true) {
            const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
            if (__ring_next_19._tag === "none") break;
            const m = __ring_next_19._0;
            _Set_insert(new_set, m);
          }
          _Map_insert(ctx.env.trait_reg.mut_methods, type_name, new_set);
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
    }
    let sorted_fmp = _Map_entries(mod_.fn_mut_params);
    sorted_fmp.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
    const __ring_iter_20 = __List_Iterable.iter(sorted_fmp);
    while (true) {
      const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
      if (__ring_next_20._tag === "none") break;
      const entry = __ring_next_20._0;
      const __ring_dt7 = entry;
      const fn_name = __ring_dt7[0];
      const flags = __ring_dt7[1];
      _Map_insert(ctx.fn_mut_params, fn_name, flags);
    }
  }
}

function resolve_uses(ctx, uses, available_modules) {
  let module_map = map_new();
  const __ring_iter_21 = __List_Iterable.iter(available_modules);
  while (true) {
    const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
    if (__ring_next_21._tag === "none") break;
    const mod_ = __ring_next_21._0;
    _Map_insert(module_map, mod_.module_key, mod_);
  }
  const __ring_iter_22 = __List_Iterable.iter(uses);
  while (true) {
    const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
    if (__ring_next_22._tag === "none") break;
    const use_decl = __ring_next_22._0;
    const first_seg = Option_unwrap_or(List_get(use_decl.path.segments, 0), "");
    if (((first_seg === "self") ? true : (first_seg === "super"))) {
      const d = diagnostics$make_diag(codes$E0705, diagnostics$Severity_SevError, `Cannot use '${first_seg}::' at file level — relative paths are only supported inside mod blocks`, use_decl.path.span, diagnostics$DiagnosticContext_OtherContext(Option_some("relative path out of scope")));
      diagnostics$CollectingSink_report(ctx.sink, d);
      continue;
    }
    const mod_key = List_join(use_decl.path.segments, "::");
    __ring_match17: {
      const __ring_m17 = _Map_get(module_map, mod_key);
      if (__ring_m17._tag === "none") {
        const d = diagnostics$make_diag(codes$E0702, diagnostics$Severity_SevError, `Module '${mod_key}' not found`, use_decl.path.span, diagnostics$DiagnosticContext_OtherContext(Option_some("module not found")));
        diagnostics$CollectingSink_report(ctx.sink, d);
        break __ring_match17;
      }
      if (__ring_m17._tag === "some") {
        const mod_ = __ring_m17._0;
        __ring_match18: {
          const __ring_m18 = use_decl.imports;
          if (__ring_m18._tag === "NamedItems") {
            const names = __ring_m18.names;
            const __ring_iter_23 = __List_Iterable.iter(names);
            while (true) {
              const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
              if (__ring_next_23._tag === "none") break;
              const item = __ring_next_23._0;
              const local_name = (function() {
  const __ring_m = item.alias;
  if (__ring_m._tag === "some") { const a = __ring_m._0; return a; }
  if (__ring_m._tag === "none") { return item.name; }
  __match_fail(__ring_m);
})();
              let found = false;
              __ring_match19: {
                const __ring_m19 = _Map_get(mod_.values, item.name);
                if (__ring_m19._tag === "some") {
                  const scheme = __ring_m19._0;
                  env$TypeEnv_bind(ctx.env, local_name, scheme);
                  found = true;
                  break __ring_match19;
                }
                if (__ring_m19._tag === "none") {
                  break __ring_match19;
                }
                __match_fail(__ring_m19);
              }
              __ring_match20: {
                const __ring_m20 = _Map_get(mod_.types, item.name);
                if (__ring_m20._tag === "some") {
                  const tdef = __ring_m20._0;
                  found = true;
                  __ring_match21: {
                    const __ring_m21 = tdef;
                    if (__ring_m21._tag === "EnumDef_") {
                      const edef = __ring_m21._0;
                      const __ring_iter_24 = __List_Iterable.iter(edef.variants);
                      while (true) {
                        const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
                        if (__ring_next_24._tag === "none") break;
                        const v = __ring_next_24._0;
                        __ring_match22: {
                          const __ring_m22 = _Map_get(mod_.values, v.name);
                          if (__ring_m22._tag === "some") {
                            const vscheme = __ring_m22._0;
                            env$TypeEnv_bind(ctx.env, v.name, vscheme);
                            break __ring_match22;
                          }
                          if (__ring_m22._tag === "none") {
                            break __ring_match22;
                          }
                          __match_fail(__ring_m22);
                        }
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
              if (_Map_contains_key(mod_.effects, item.name)) {
                found = true;
              }
              if (_Map_contains_key(mod_.effect_aliases, item.name)) {
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
            break __ring_match18;
          }
          if (__ring_m18._tag === "Module") {
            let sorted_mod_values = _Map_entries(mod_.values);
            sorted_mod_values.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
            const __ring_iter_25 = __List_Iterable.iter(sorted_mod_values);
            while (true) {
              const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
              if (__ring_next_25._tag === "none") break;
              const entry = __ring_next_25._0;
              const __ring_dt8 = entry;
              const name = __ring_dt8[0];
              const scheme = __ring_dt8[1];
              env$TypeEnv_bind(ctx.env, name, scheme);
            }
            let sorted_mod_types = _Map_entries(mod_.types);
            sorted_mod_types.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
            const __ring_iter_26 = __List_Iterable.iter(sorted_mod_types);
            while (true) {
              const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
              if (__ring_next_26._tag === "none") break;
              const entry = __ring_next_26._0;
              const __ring_dt9 = entry;
              const tdef = __ring_dt9[1];
              __ring_match23: {
                const __ring_m23 = tdef;
                if (__ring_m23._tag === "EnumDef_") {
                  const edef = __ring_m23._0;
                  const __ring_iter_27 = __List_Iterable.iter(edef.variants);
                  while (true) {
                    const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
                    if (__ring_next_27._tag === "none") break;
                    const v = __ring_next_27._0;
                    __ring_match24: {
                      const __ring_m24 = _Map_get(mod_.values, v.name);
                      if (__ring_m24._tag === "some") {
                        const vscheme = __ring_m24._0;
                        env$TypeEnv_bind(ctx.env, v.name, vscheme);
                        break __ring_match24;
                      }
                      if (__ring_m24._tag === "none") {
                        break __ring_match24;
                      }
                      __match_fail(__ring_m24);
                    }
                  }
                  break __ring_match23;
                }
                break __ring_match23;
              }
            }
            break __ring_match18;
          }
          __match_fail(__ring_m18);
        }
        break __ring_match17;
      }
      __match_fail(__ring_m17);
    }
  }
}

function check_module(program, module_exports, sink) {
  let ctx = new_infer_ctx(sink);
  const prelude_hdecls = load_prelude(ctx);
  inject_module_exports(ctx, module_exports);
  resolve_uses(ctx, program.uses, module_exports);
  const hprogram = infer_decl$check(ctx, program);
  let all_decls = list_clone(prelude_hdecls);
  const __ring_iter_28 = __List_Iterable.iter(hprogram.decls);
  while (true) {
    const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
    if (__ring_next_28._tag === "none") break;
    const d = __ring_next_28._0;
    List_push(all_decls, d);
  }
  const assembled = new hir$HProgram(all_decls, hprogram.derived_impls, hprogram.boxed_vars, []);
  return new CheckResult(dict_lower$lower_dicts(andor_lower$lower_andor(assembled)), ctx.env, ctx.fn_mut_params);
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


export { CheckResult, check, check_module };