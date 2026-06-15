import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { collect_all_supertraits as infer_register$collect_all_supertraits, inject_assoc_types_from_bounds as infer_register$inject_assoc_types_from_bounds, insert_mod_aliases as infer_register$insert_mod_aliases, prefix_decl_name as infer_register$prefix_decl_name, register_decl_public as infer_register$register_decl_public, register_decls_two_phase as infer_register$register_decls_two_phase, resolve_declared_effects as infer_register$resolve_declared_effects, resolve_effect_expr as infer_register$resolve_effect_expr } from "./infer_register.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { make_diag as diagnostics$make_diag, make_diagnostic as diagnostics$make_diagnostic, new_collecting_sink as diagnostics$new_collecting_sink, severity_to_str as diagnostics$severity_to_str, CollectingSink as diagnostics$CollectingSink, Diagnostic as diagnostics$Diagnostic, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, DiagnosticNote as diagnostics$DiagnosticNote, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, Suggestion as diagnostics$Suggestion, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Severity_Eq as diagnostics$__Severity_Eq, __Severity_Clone as diagnostics$__Severity_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __Severity_Debug as diagnostics$__Severity_Debug, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Suggestion_Debug as diagnostics$__Suggestion_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { format_human as formatter$format_human, format_llm as formatter$format_llm } from "./formatter.js";
import { add_impl as env$add_impl, apply_subst as env$apply_subst, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_map as env$apply_subst_map, apply_subst_row as env$apply_subst_row, apply_subst_row_map as env$apply_subst_row_map, find_impl as env$find_impl, has_impl as env$has_impl, lookup_variant as env$lookup_variant, mono as env$mono, new_type_env as env$new_type_env, AssocConstraintEntry as env$AssocConstraintEntry, AssocTypeDef as env$AssocTypeDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectAliasDef as env$EffectAliasDef, EffectDef as env$EffectDef, EffectOpDef as env$EffectOpDef, EnumDef as env$EnumDef, FnBound as env$FnBound, IdGen as env$IdGen, ImplEntry as env$ImplEntry, SchemeBound as env$SchemeBound, Scope as env$Scope, ScopeManager as env$ScopeManager, SigDef as env$SigDef, StructDef as env$StructDef, TraitDef as env$TraitDef, TraitMethodDef as env$TraitMethodDef, TraitRegistry as env$TraitRegistry, TypeAliasDef as env$TypeAliasDef, TypeEnv as env$TypeEnv, TypeRegistry as env$TypeRegistry, TypeScheme as env$TypeScheme, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __BuiltInKind_Debug as env$__BuiltInKind_Debug, __FnBound_Eq as env$__FnBound_Eq, __FnBound_Clone as env$__FnBound_Clone, __FnBound_Ord as env$__FnBound_Ord, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Eq as env$__IdGen_Eq, __IdGen_Clone as env$__IdGen_Clone, __IdGen_Ord as env$__IdGen_Ord, __IdGen_Debug as env$__IdGen_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { check as checker$check, check_module as checker$check_module, CheckResult as checker$CheckResult } from "./checker.js";
import { generate as codegen$generate } from "./codegen.js";
import { generate_llvm as codegen_llvm$generate_llvm, generate_llvm_project as codegen_llvm$generate_llvm_project } from "./codegen_llvm.js";
import { LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, is_imported_name as codegen_ctx$is_imported_name, new_codegen_ctx as codegen_ctx$new_codegen_ctx, pop_indent as codegen_ctx$pop_indent, push_indent as codegen_ctx$push_indent, qualify as codegen_ctx$qualify, safe_ident as codegen_ctx$safe_ident, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";
import { RUNTIME_CODE as runtime$RUNTIME_CODE, RUNTIME_EXPORT_NAMES as runtime$RUNTIME_EXPORT_NAMES, runtime_esm_code as runtime$runtime_esm_code } from "./runtime.js";
import { build_module_graph as resolver$build_module_graph, module_key as resolver$module_key, module_prefix as resolver$module_prefix, resolve_module_file as resolver$resolve_module_file, GraphError as resolver$GraphError, ModuleGraph as resolver$ModuleGraph, ModuleId as resolver$ModuleId, __GraphError_Clone as resolver$__GraphError_Clone, __GraphError_Debug as resolver$__GraphError_Debug, __ModuleId_Clone as resolver$__ModuleId_Clone, __ModuleId_Debug as resolver$__ModuleId_Debug } from "./resolver.js";
import { extract_exports as exports$extract_exports, ModuleExports as exports$ModuleExports, TypeDef_StructDef_ as exports$TypeDef_StructDef_, TypeDef_EnumDef_ as exports$TypeDef_EnumDef_ } from "./exports.js";
import { expr_diverges as perceus$expr_diverges, is_scalar_type as perceus$is_scalar_type, is_str_index as perceus$is_str_index, is_unresolved_var_type as perceus$is_unresolved_var_type, is_variant_constructor_call as perceus$is_variant_constructor_call, perceus_transform as perceus$perceus_transform, perceus_transform_mutated as perceus$perceus_transform_mutated, rc_name_skippable as perceus$rc_name_skippable, sink_arg_indices as perceus$sink_arg_indices, stmt_diverges as perceus$stmt_diverges } from "./perceus.js";
import { format_rc_findings as verify_rc$format_rc_findings, rc_fatal_count as verify_rc$rc_fatal_count, rc_verify_boundary_note as verify_rc$rc_verify_boundary_note, verify_rc_program as verify_rc$verify_rc_program, RcFinding as verify_rc$RcFinding, __RcFinding_Eq as verify_rc$__RcFinding_Eq, __RcFinding_Clone as verify_rc$__RcFinding_Clone, __RcFinding_Ord as verify_rc$__RcFinding_Ord, __RcFinding_Debug as verify_rc$__RcFinding_Debug } from "./verify_rc.js";



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

class LlvmCompileResult {
  constructor(success) {
    this.success = success;
  }
}

class RcProjectVerifyResult {
  constructor(success, fatal, exempt, report) {
    this.success = success;
    this.fatal = fatal;
    this.exempt = exempt;
    this.report = report;
  }
}

function build_dep_import_pairs(dep_exports, dep_prefix) {
  let import_pairs = [];
  let bare_variants = set_new();
  let sorted_types = _Map_entries(dep_exports.types);
  sorted_types.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_2 = __List_Iterable.iter(sorted_types);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const tentry = __ring_next_2._0;
    const __ring_dt0 = tentry;
    const tdef = __ring_dt0[1];
    __ring_match6: {
      const __ring_m6 = tdef;
      if (__ring_m6._tag === "EnumDef_") {
        const edef = __ring_m6._0;
        const __ring_iter_3 = __List_Iterable.iter(edef.variants);
        while (true) {
          const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
          if (__ring_next_3._tag === "none") break;
          const v = __ring_next_3._0;
          _Set_insert(bare_variants, v.name);
        }
        break __ring_match6;
      }
      break __ring_match6;
    }
  }
  let sorted_values = _Map_entries(dep_exports.values);
  sorted_values.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_4 = __List_Iterable.iter(sorted_values);
  while (true) {
    const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
    if (__ring_next_4._tag === "none") break;
    const ventry = __ring_next_4._0;
    const __ring_dt1 = ventry;
    const name = __ring_dt1[0];
    if (((!_Set_contains(dep_exports.extern_values, name, __Str_Eq)) ? (!_Set_contains(bare_variants, name, __Str_Eq)) : false)) {
      const si = codegen_ctx$safe_ident(name);
      const alias = `${dep_prefix}$${si}`;
      List_push(import_pairs, `${si} as ${alias}`);
    }
  }
  const __ring_iter_5 = __List_Iterable.iter(sorted_types);
  while (true) {
    const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
    if (__ring_next_5._tag === "none") break;
    const tentry = __ring_next_5._0;
    const __ring_dt2 = tentry;
    const name = __ring_dt2[0];
    const tdef = __ring_dt2[1];
    const si = codegen_ctx$safe_ident(name);
    __ring_match7: {
      const __ring_m7 = tdef;
      if (__ring_m7._tag === "EnumDef_") {
        const edef = __ring_m7._0;
        const __ring_iter_6 = __List_Iterable.iter(edef.variants);
        while (true) {
          const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
          if (__ring_next_6._tag === "none") break;
          const v = __ring_next_6._0;
          const valias = `${dep_prefix}$${si}_${v.name}`;
          List_push(import_pairs, `${si}_${v.name} as ${valias}`);
        }
        break __ring_match7;
      }
      if (__ring_m7._tag === "StructDef_") {
        const alias = `${dep_prefix}$${si}`;
        List_push(import_pairs, `${si} as ${alias}`);
        break __ring_match7;
      }
      __match_fail(__ring_m7);
    }
  }
  const __ring_iter_7 = __List_Iterable.iter(dep_exports.trait_impls);
  while (true) {
    const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
    if (__ring_next_7._tag === "none") break;
    const impl_ = __ring_next_7._0;
    const dict_js = hir$trait_dict_name(codegen_ctx$safe_ident(impl_.target_type_name), codegen_ctx$safe_ident(impl_.trait_name));
    const alias = `${dep_prefix}$${dict_js}`;
    List_push(import_pairs, `${dict_js} as ${alias}`);
  }
  let sorted_inherent = _Map_entries(dep_exports.inherent_methods);
  sorted_inherent.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_8 = __List_Iterable.iter(sorted_inherent);
  while (true) {
    const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
    if (__ring_next_8._tag === "none") break;
    const ientry = __ring_next_8._0;
    const __ring_dt3 = ientry;
    const type_name = __ring_dt3[0];
    const method_names = __ring_dt3[1];
    const __ring_iter_9 = __List_Iterable.iter(method_names);
    while (true) {
      const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
      if (__ring_next_9._tag === "none") break;
      const mname = __ring_next_9._0;
      const method_js = `${codegen_ctx$safe_ident(type_name)}_${mname}`;
      const alias = `${dep_prefix}$${method_js}`;
      List_push(import_pairs, `${method_js} as ${alias}`);
    }
  }
  return import_pairs;
}

function collect_pub_decl_exports(decl, export_names) {
  __ring_match8: {
    const __ring_m8 = decl;
    if (__ring_m8._tag === "Fn") {
      const name = __ring_m8.name; const is_pub = __ring_m8.is_pub;
      if (is_pub) {
        return List_push(export_names, codegen_ctx$safe_ident(name));
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "Struct") {
      const name = __ring_m8.name; const is_pub = __ring_m8.is_pub;
      if (is_pub) {
        return List_push(export_names, codegen_ctx$safe_ident(name));
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "Enum") {
      const name = __ring_m8.name; const is_pub = __ring_m8.is_pub; const variants = __ring_m8.variants;
      if (is_pub) {
        const __ring_iter_10 = __List_Iterable.iter(variants);
        while (true) {
          const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
          if (__ring_next_10._tag === "none") break;
          const v = __ring_next_10._0;
          const sn = codegen_ctx$safe_ident(name);
          List_push(export_names, `${sn}_${v.name}`);
        }
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "Const") {
      const name = __ring_m8.name; const is_pub = __ring_m8.is_pub;
      if (is_pub) {
        return List_push(export_names, codegen_ctx$safe_ident(name));
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "ExternType") {
      const name = __ring_m8.name; const is_pub = __ring_m8.is_pub;
      if (is_pub) {
        return List_push(export_names, codegen_ctx$safe_ident(name));
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "ModBlock") {
      const mod_name = __ring_m8.name; const mod_decls = __ring_m8.decls; const mpub = __ring_m8.is_pub;
      if (mpub) {
        const __ring_iter_11 = __List_Iterable.iter(mod_decls);
        while (true) {
          const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
          if (__ring_next_11._tag === "none") break;
          const subdecl = __ring_next_11._0;
          const prefixed = infer_register$prefix_decl_name(mod_name, subdecl);
          collect_pub_decl_exports(prefixed, export_names);
        }
      }
      break __ring_match8;
    }
    break __ring_match8;
  }
}

function is_pub_type_in_decls(type_name, decls) {
  let result = false;
  const __ring_iter_12 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
    if (__ring_next_12._tag === "none") break;
    const d = __ring_next_12._0;
    __ring_match9: {
      const __ring_m9 = d;
      if (__ring_m9._tag === "Struct") {
        const dn = __ring_m9.name; const dp = __ring_m9.is_pub;
        if (((dn === type_name) ? dp : false)) {
          result = true;
        }
        break __ring_match9;
      }
      if (__ring_m9._tag === "Enum") {
        const dn = __ring_m9.name; const dp = __ring_m9.is_pub;
        if (((dn === type_name) ? dp : false)) {
          result = true;
        }
        break __ring_match9;
      }
      if (__ring_m9._tag === "ModBlock") {
        const mod_name = __ring_m9.name; const mod_decls = __ring_m9.decls; const mpub = __ring_m9.is_pub;
        if (mpub) {
          const __ring_iter_13 = __List_Iterable.iter(mod_decls);
          while (true) {
            const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
            if (__ring_next_13._tag === "none") break;
            const sd = __ring_next_13._0;
            const prefixed = infer_register$prefix_decl_name(mod_name, sd);
            __ring_match10: {
              const __ring_m10 = prefixed;
              if (__ring_m10._tag === "Struct") {
                const sn = __ring_m10.name; const sp = __ring_m10.is_pub;
                if (((sn === type_name) ? sp : false)) {
                  result = true;
                }
                break __ring_match10;
              }
              if (__ring_m10._tag === "Enum") {
                const en = __ring_m10.name; const ep = __ring_m10.is_pub;
                if (((en === type_name) ? ep : false)) {
                  result = true;
                }
                break __ring_match10;
              }
              break __ring_match10;
            }
          }
        }
        break __ring_match9;
      }
      break __ring_match9;
    }
  }
  return result;
}

function collect_impl_exports(decl, all_decls, export_names) {
  __ring_match11: {
    const __ring_m11 = decl;
    if (__ring_m11._tag === "Impl") {
      const target_type = __ring_m11.target_type; const impl_trait = __ring_m11.trait_name; const methods = __ring_m11.methods;
      if (is_pub_type_in_decls(target_type, all_decls)) {
        __ring_match12: {
          const __ring_m12 = impl_trait;
          if (__ring_m12._tag === "some") {
            const tn = __ring_m12._0;
            return List_push(export_names, hir$trait_dict_name(codegen_ctx$safe_ident(target_type), codegen_ctx$safe_ident(tn)));
            break __ring_match12;
          }
          if (__ring_m12._tag === "none") {
            const __ring_iter_14 = __List_Iterable.iter(methods);
            while (true) {
              const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
              if (__ring_next_14._tag === "none") break;
              const m = __ring_next_14._0;
              __ring_match13: {
                const __ring_m13 = m;
                if (__ring_m13._tag === "Fn") {
                  const mn = __ring_m13.name;
                  List_push(export_names, `${codegen_ctx$safe_ident(target_type)}_${mn}`);
                  break __ring_match13;
                }
                break __ring_match13;
              }
            }
            break __ring_match12;
          }
          __match_fail(__ring_m12);
        }
      }
      break __ring_match11;
    }
    if (__ring_m11._tag === "ModBlock") {
      const mod_name = __ring_m11.name; const mod_decls = __ring_m11.decls; const mpub = __ring_m11.is_pub;
      if (mpub) {
        const __ring_iter_15 = __List_Iterable.iter(mod_decls);
        while (true) {
          const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
          if (__ring_next_15._tag === "none") break;
          const subdecl = __ring_next_15._0;
          const prefixed = infer_register$prefix_decl_name(mod_name, subdecl);
          collect_impl_exports(prefixed, all_decls, export_names);
        }
      }
      break __ring_match11;
    }
    break __ring_match11;
  }
}

function build_esm_export_names(ast, hir) {
  let export_names = [];
  const __ring_iter_16 = __List_Iterable.iter(ast.decls);
  while (true) {
    const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
    if (__ring_next_16._tag === "none") break;
    const decl = __ring_next_16._0;
    collect_pub_decl_exports(decl, export_names);
  }
  const __ring_iter_17 = __List_Iterable.iter(ast.decls);
  while (true) {
    const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
    if (__ring_next_17._tag === "none") break;
    const decl = __ring_next_17._0;
    collect_impl_exports(decl, ast.decls, export_names);
  }
  const __ring_iter_18 = __List_Iterable.iter(hir.derived_impls);
  while (true) {
    const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
    if (__ring_next_18._tag === "none") break;
    const di = __ring_next_18._0;
    if (is_pub_type_in_decls(di.type_name, ast.decls)) {
      List_push(export_names, hir$trait_dict_name(codegen_ctx$safe_ident(di.type_name), codegen_ctx$safe_ident(di.trait_name)));
    }
  }
  return export_names;
}

function empty_str_list() {
  let x = [];
  return x;
}

function build_esm_import_lines(graph, exports_map, key) {
  let import_lines = [];
  const runtime_names = runtime$RUNTIME_EXPORT_NAMES;
  const rnames_joined = List_join(runtime_names, ", ");
  List_push(import_lines, `import { ${rnames_joined} } from "./__ring_runtime.js";`);
  let __ring_blk0;
  __ring_match14: {
    const __ring_m14 = _Map_get(graph.dependencies, key);
    if (__ring_m14._tag === "some") {
      const d = __ring_m14._0;
      __ring_blk0 = d;
      break __ring_match14;
    }
    if (__ring_m14._tag === "none") {
      __ring_blk0 = empty_str_list();
      break __ring_match14;
    }
    __match_fail(__ring_m14);
  }
  const deps = __ring_blk0;
  const __ring_iter_19 = __List_Iterable.iter(deps);
  while (true) {
    const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
    if (__ring_next_19._tag === "none") break;
    const dk = __ring_next_19._0;
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

function build_external_fn_mut_params(graph, exports_map, key) {
  let result = map_new();
  __ring_match16: {
    const __ring_m16 = _Map_get(graph.dependencies, key);
    if (__ring_m16._tag === "some") {
      const deps = __ring_m16._0;
      const __ring_iter_20 = __List_Iterable.iter(deps);
      while (true) {
        const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
        if (__ring_next_20._tag === "none") break;
        const dk = __ring_next_20._0;
        __ring_match17: {
          const __ring_m17 = _Map_get(exports_map, dk);
          if (__ring_m17._tag === "some") {
            const dep_exports = __ring_m17._0;
            const dep_prefix = dep_exports.module_prefix;
            let sorted_fmp = _Map_entries(dep_exports.fn_mut_params);
            sorted_fmp.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
            const __ring_iter_21 = __List_Iterable.iter(sorted_fmp);
            while (true) {
              const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
              if (__ring_next_21._tag === "none") break;
              const entry = __ring_next_21._0;
              const __ring_dt4 = entry;
              const fn_name = __ring_dt4[0];
              const flags = __ring_dt4[1];
              _Map_insert(result, fn_name, flags);
              const si = codegen_ctx$safe_ident(fn_name);
              const qualified = `${dep_prefix}$${si}`;
              _Map_insert(result, qualified, flags);
            }
            break __ring_match17;
          }
          if (__ring_m17._tag === "none") {
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
  return result;
}

function build_external_impl_methods(graph, exports_map, key) {
  let result = map_new();
  __ring_match18: {
    const __ring_m18 = _Map_get(graph.dependencies, key);
    if (__ring_m18._tag === "some") {
      const deps = __ring_m18._0;
      const __ring_iter_22 = __List_Iterable.iter(deps);
      while (true) {
        const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
        if (__ring_next_22._tag === "none") break;
        const dk = __ring_next_22._0;
        __ring_match19: {
          const __ring_m19 = _Map_get(exports_map, dk);
          if (__ring_m19._tag === "some") {
            const dep_exports = __ring_m19._0;
            const dep_prefix = dep_exports.module_prefix;
            let sorted_impl = _Map_entries(dep_exports.impl_methods);
            sorted_impl.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
            const __ring_iter_23 = __List_Iterable.iter(sorted_impl);
            while (true) {
              const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
              if (__ring_next_23._tag === "none") break;
              const entry = __ring_next_23._0;
              const __ring_dt5 = entry;
              const type_name = __ring_dt5[0];
              const methods = __ring_dt5[1];
              const si = codegen_ctx$safe_ident(type_name);
              let sorted_methods = _Map_entries(methods);
              sorted_methods.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
              const __ring_iter_24 = __List_Iterable.iter(sorted_methods);
              while (true) {
                const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
                if (__ring_next_24._tag === "none") break;
                const mentry = __ring_next_24._0;
                const __ring_dt6 = mentry;
                const mname = __ring_dt6[0];
                _Map_insert(result, `${dep_prefix}$${si}.${mname}`, Option_none);
              }
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
    if (__ring_m18._tag === "none") {
      break __ring_match18;
    }
    __match_fail(__ring_m18);
  }
  return result;
}

function build_external_struct_fields(graph, exports_map, key) {
  let result = map_new();
  __ring_match20: {
    const __ring_m20 = _Map_get(graph.dependencies, key);
    if (__ring_m20._tag === "some") {
      const deps = __ring_m20._0;
      const __ring_iter_25 = __List_Iterable.iter(deps);
      while (true) {
        const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
        if (__ring_next_25._tag === "none") break;
        const dk = __ring_next_25._0;
        __ring_match21: {
          const __ring_m21 = _Map_get(exports_map, dk);
          if (__ring_m21._tag === "some") {
            const dep_exports = __ring_m21._0;
            const dep_prefix = dep_exports.module_prefix;
            let sorted_sfo = _Map_entries(dep_exports.struct_field_orders);
            sorted_sfo.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
            const __ring_iter_26 = __List_Iterable.iter(sorted_sfo);
            while (true) {
              const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
              if (__ring_next_26._tag === "none") break;
              const entry = __ring_next_26._0;
              const __ring_dt7 = entry;
              const name = __ring_dt7[0];
              const fields = __ring_dt7[1];
              const si = codegen_ctx$safe_ident(name);
              _Map_insert(result, `${dep_prefix}$${si}`, fields);
            }
            break __ring_match21;
          }
          if (__ring_m21._tag === "none") {
            break __ring_match21;
          }
          __match_fail(__ring_m21);
        }
      }
      break __ring_match20;
    }
    if (__ring_m20._tag === "none") {
      break __ring_match20;
    }
    __match_fail(__ring_m20);
  }
  return result;
}

function build_imports_map(graph, exports_map, key) {
  let imports_map = map_new();
  __ring_match22: {
    const __ring_m22 = _Map_get(graph.dependencies, key);
    if (__ring_m22._tag === "some") {
      const deps = __ring_m22._0;
      const __ring_iter_27 = __List_Iterable.iter(deps);
      while (true) {
        const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
        if (__ring_next_27._tag === "none") break;
        const dk = __ring_next_27._0;
        __ring_match23: {
          const __ring_m23 = _Map_get(exports_map, dk);
          if (__ring_m23._tag === "some") {
            const dep_exports = __ring_m23._0;
            const dep_prefix = dep_exports.module_prefix;
            let bare_variants = set_new();
            let sorted_dep_types = _Map_entries(dep_exports.types);
            sorted_dep_types.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
            const __ring_iter_28 = __List_Iterable.iter(sorted_dep_types);
            while (true) {
              const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
              if (__ring_next_28._tag === "none") break;
              const tentry = __ring_next_28._0;
              const __ring_dt8 = tentry;
              const tdef = __ring_dt8[1];
              __ring_match24: {
                const __ring_m24 = tdef;
                if (__ring_m24._tag === "EnumDef_") {
                  const edef = __ring_m24._0;
                  const __ring_iter_29 = __List_Iterable.iter(edef.variants);
                  while (true) {
                    const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
                    if (__ring_next_29._tag === "none") break;
                    const v = __ring_next_29._0;
                    _Set_insert(bare_variants, v.name);
                  }
                  break __ring_match24;
                }
                break __ring_match24;
              }
            }
            let sorted_dep_values = _Map_entries(dep_exports.values);
            sorted_dep_values.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
            const __ring_iter_30 = __List_Iterable.iter(sorted_dep_values);
            while (true) {
              const __ring_next_30 = __ListIterator_Iterator.next(__ring_iter_30);
              if (__ring_next_30._tag === "none") break;
              const entry = __ring_next_30._0;
              const __ring_dt9 = entry;
              const name = __ring_dt9[0];
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
            const __ring_iter_31 = __List_Iterable.iter(sorted_dep_types);
            while (true) {
              const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
              if (__ring_next_31._tag === "none") break;
              const entry = __ring_next_31._0;
              const __ring_dt10 = entry;
              const name = __ring_dt10[0];
              const type_def = __ring_dt10[1];
              const si = codegen_ctx$safe_ident(name);
              _Map_insert(imports_map, name, `${dep_prefix}$${si}`);
              __ring_match25: {
                const __ring_m25 = type_def;
                if (__ring_m25._tag === "EnumDef_") {
                  const edef = __ring_m25._0;
                  const __ring_iter_32 = __List_Iterable.iter(edef.variants);
                  while (true) {
                    const __ring_next_32 = __ListIterator_Iterator.next(__ring_iter_32);
                    if (__ring_next_32._tag === "none") break;
                    const v = __ring_next_32._0;
                    const variant_js = `${dep_prefix}$${si}_${v.name}`;
                    _Map_insert(imports_map, `${name}_${v.name}`, variant_js);
                  }
                  break __ring_match25;
                }
                break __ring_match25;
              }
            }
            const __ring_iter_33 = __List_Iterable.iter(dep_exports.trait_impls);
            while (true) {
              const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
              if (__ring_next_33._tag === "none") break;
              const impl_ = __ring_next_33._0;
              const dict_js = hir$trait_dict_name(codegen_ctx$safe_ident(impl_.target_type_name), codegen_ctx$safe_ident(impl_.trait_name));
              _Map_insert(imports_map, dict_js, `${dep_prefix}$${dict_js}`);
            }
            break __ring_match23;
          }
          if (__ring_m23._tag === "none") {
            break __ring_match23;
          }
          __match_fail(__ring_m23);
        }
      }
      break __ring_match22;
    }
    if (__ring_m22._tag === "none") {
      break __ring_match22;
    }
    __match_fail(__ring_m22);
  }
  return imports_map;
}

function collect_named_reexports(names, src_exports, src_prefix, export_names, reexport_aliases) {
  const __ring_iter_34 = __List_Iterable.iter(names);
  while (true) {
    const __ring_next_34 = __ListIterator_Iterator.next(__ring_iter_34);
    if (__ring_next_34._tag === "none") break;
    const item = __ring_next_34._0;
    let __ring_blk1;
    __ring_match26: {
      const __ring_m26 = item.alias;
      if (__ring_m26._tag === "some") {
        const a = __ring_m26._0;
        __ring_blk1 = a;
        break __ring_match26;
      }
      if (__ring_m26._tag === "none") {
        __ring_blk1 = item.name;
        break __ring_match26;
      }
      __match_fail(__ring_m26);
    }
    const local_name = __ring_blk1;
    const src_js = (_Set_contains(src_exports.extern_values, item.name, __Str_Eq) ? codegen_ctx$safe_ident(item.name) : `${src_prefix}$${codegen_ctx$safe_ident(item.name)}`);
    const local_js = codegen_ctx$safe_ident(local_name);
    if ((local_js !== src_js)) {
      List_push(reexport_aliases, `const ${local_js} = ${src_js};`);
    }
    List_push(export_names, local_js);
    __ring_match27: {
      const __ring_m27 = _Map_get(src_exports.types, item.name);
      if (__ring_m27._tag === "some") {
        const tdef = __ring_m27._0;
        __ring_match28: {
          const __ring_m28 = tdef;
          if (__ring_m28._tag === "EnumDef_") {
            const edef = __ring_m28._0;
            const __ring_iter_35 = __List_Iterable.iter(edef.variants);
            while (true) {
              const __ring_next_35 = __ListIterator_Iterator.next(__ring_iter_35);
              if (__ring_next_35._tag === "none") break;
              const v = __ring_next_35._0;
              const src_v = `${src_prefix}$${codegen_ctx$safe_ident(item.name)}_${v.name}`;
              const local_v = `${codegen_ctx$safe_ident(local_name)}_${v.name}`;
              if ((local_v !== src_v)) {
                List_push(reexport_aliases, `const ${local_v} = ${src_v};`);
              }
              List_push(export_names, local_v);
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
}

function collect_module_reexports(src_exports, src_prefix, export_names, reexport_aliases) {
  let sorted_values = _Map_entries(src_exports.values);
  sorted_values.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_36 = __List_Iterable.iter(sorted_values);
  while (true) {
    const __ring_next_36 = __ListIterator_Iterator.next(__ring_iter_36);
    if (__ring_next_36._tag === "none") break;
    const ventry = __ring_next_36._0;
    const __ring_dt11 = ventry;
    const vname = __ring_dt11[0];
    if ((!_Set_contains(src_exports.extern_values, vname, __Str_Eq))) {
      const src_js = `${src_prefix}$${codegen_ctx$safe_ident(vname)}`;
      const local_js = codegen_ctx$safe_ident(vname);
      if ((local_js !== src_js)) {
        List_push(reexport_aliases, `const ${local_js} = ${src_js};`);
      }
      List_push(export_names, local_js);
    }
  }
  let sorted_types = _Map_entries(src_exports.types);
  sorted_types.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_37 = __List_Iterable.iter(sorted_types);
  while (true) {
    const __ring_next_37 = __ListIterator_Iterator.next(__ring_iter_37);
    if (__ring_next_37._tag === "none") break;
    const tentry = __ring_next_37._0;
    const __ring_dt12 = tentry;
    const tname = __ring_dt12[0];
    const tdef = __ring_dt12[1];
    const src_js = `${src_prefix}$${codegen_ctx$safe_ident(tname)}`;
    const local_js = codegen_ctx$safe_ident(tname);
    if ((local_js !== src_js)) {
      List_push(reexport_aliases, `const ${local_js} = ${src_js};`);
    }
    List_push(export_names, local_js);
    __ring_match29: {
      const __ring_m29 = tdef;
      if (__ring_m29._tag === "EnumDef_") {
        const edef = __ring_m29._0;
        const __ring_iter_38 = __List_Iterable.iter(edef.variants);
        while (true) {
          const __ring_next_38 = __ListIterator_Iterator.next(__ring_iter_38);
          if (__ring_next_38._tag === "none") break;
          const v = __ring_next_38._0;
          const src_v = `${src_prefix}$${codegen_ctx$safe_ident(tname)}_${v.name}`;
          const local_v = `${codegen_ctx$safe_ident(tname)}_${v.name}`;
          if ((local_v !== src_v)) {
            List_push(reexport_aliases, `const ${local_v} = ${src_v};`);
          }
          List_push(export_names, local_v);
        }
        break __ring_match29;
      }
      break __ring_match29;
    }
  }
}

function build_pub_use_reexports(ast, exports_map, export_names) {
  let reexport_aliases = [];
  const __ring_iter_39 = __List_Iterable.iter(ast.uses);
  while (true) {
    const __ring_next_39 = __ListIterator_Iterator.next(__ring_iter_39);
    if (__ring_next_39._tag === "none") break;
    const use_decl = __ring_next_39._0;
    if (use_decl.is_pub) {
      const src_key = List_join(use_decl.path.segments, "::");
      __ring_match30: {
        const __ring_m30 = _Map_get(exports_map, src_key);
        if (__ring_m30._tag === "some") {
          const src_exports = __ring_m30._0;
          const src_prefix = src_exports.module_prefix;
          __ring_match31: {
            const __ring_m31 = use_decl.imports;
            if (__ring_m31._tag === "NamedItems") {
              const names = __ring_m31.names;
              collect_named_reexports(names, src_exports, src_prefix, export_names, reexport_aliases);
              break __ring_match31;
            }
            if (__ring_m31._tag === "Module") {
              collect_module_reexports(src_exports, src_prefix, export_names, reexport_aliases);
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
  return reexport_aliases;
}

function empty_module_exports_list() {
  let x = [];
  return x;
}

function compile_phases(entry_file, error_format) {
  __ring_match32: {
    const __ring_m32 = resolver$build_module_graph(entry_file, error_format);
    if (__ring_m32._tag === "none") {
      return Option_none;
      break __ring_match32;
    }
    if (__ring_m32._tag === "some") {
      const graph = __ring_m32._0;
      let module_asts = map_new();
      let module_hirs = map_new();
      let module_exports_map = map_new();
      const __ring_iter_40 = __List_Iterable.iter(graph.topo_order);
      while (true) {
        const __ring_next_40 = __ListIterator_Iterator.next(__ring_iter_40);
        if (__ring_next_40._tag === "none") break;
        const key = __ring_next_40._0;
        __ring_match33: {
          const __ring_m33 = _Map_get(graph.asts, key);
          if (__ring_m33._tag === "some") {
            const ast = __ring_m33._0;
            _Map_insert(module_asts, key, ast);
            break __ring_match33;
          }
          if (__ring_m33._tag === "none") {
            break __ring_match33;
          }
          __match_fail(__ring_m33);
        }
      }
      let check_ok = true;
      const __ring_iter_41 = __List_Iterable.iter(graph.topo_order);
      while (true) {
        const __ring_next_41 = __ListIterator_Iterator.next(__ring_iter_41);
        if (__ring_next_41._tag === "none") break;
        const key = __ring_next_41._0;
        if (check_ok) {
          __ring_match34: {
            const __ring_m34 = _Map_get(module_asts, key);
            if (__ring_m34._tag === "some") {
              const ast = __ring_m34._0;
              const sink = diagnostics$new_collecting_sink();
              let __ring_blk2;
              __ring_match35: {
                const __ring_m35 = _Map_get(graph.dependencies, key);
                if (__ring_m35._tag === "some") {
                  const dk = __ring_m35._0;
                  __ring_blk2 = dk;
                  break __ring_match35;
                }
                if (__ring_m35._tag === "none") {
                  __ring_blk2 = empty_str_list();
                  break __ring_match35;
                }
                __match_fail(__ring_m35);
              }
              const deps = __ring_blk2;
              let dep_exports = empty_module_exports_list();
              const __ring_iter_42 = __List_Iterable.iter(deps);
              while (true) {
                const __ring_next_42 = __ListIterator_Iterator.next(__ring_iter_42);
                if (__ring_next_42._tag === "none") break;
                const dk = __ring_next_42._0;
                __ring_match36: {
                  const __ring_m36 = _Map_get(module_exports_map, dk);
                  if (__ring_m36._tag === "some") {
                    const e = __ring_m36._0;
                    List_push(dep_exports, e);
                    break __ring_match36;
                  }
                  if (__ring_m36._tag === "none") {
                    break __ring_match36;
                  }
                  __match_fail(__ring_m36);
                }
              }
              const result = checker$check_module(ast, dep_exports, sink);
              if (diagnostics$CollectingSink_has_errors(sink)) {
                let __ring_blk3;
                __ring_match37: {
                  const __ring_m37 = _Map_get(graph.modules, key);
                  if (__ring_m37._tag === "some") {
                    const m = __ring_m37._0;
                    __ring_blk3 = m.file_path;
                    break __ring_match37;
                  }
                  if (__ring_m37._tag === "none") {
                    __ring_blk3 = "";
                    break __ring_match37;
                  }
                  __match_fail(__ring_m37);
                }
                const mod_file = __ring_blk3;
                if ((error_format === "llm")) {
                  eprintln(formatter$format_llm(diagnostics$CollectingSink_diagnostics(sink), mod_file));
                } else {
                  const src = read_file(mod_file);
                  eprintln(formatter$format_human(diagnostics$CollectingSink_diagnostics(sink), src));
                }
                check_ok = false;
              } else {
                if ((List_len(sink.items) > 0)) {
                  let __ring_blk4;
                  __ring_match38: {
                    const __ring_m38 = _Map_get(graph.modules, key);
                    if (__ring_m38._tag === "some") {
                      const m = __ring_m38._0;
                      __ring_blk4 = m.file_path;
                      break __ring_match38;
                    }
                    if (__ring_m38._tag === "none") {
                      __ring_blk4 = "";
                      break __ring_match38;
                    }
                    __match_fail(__ring_m38);
                  }
                  const mod_file = __ring_blk4;
                  if ((error_format === "llm")) {
                    eprintln(formatter$format_llm(diagnostics$CollectingSink_diagnostics(sink), mod_file));
                  } else {
                    const src = read_file(mod_file);
                    eprintln(formatter$format_human(diagnostics$CollectingSink_diagnostics(sink), src));
                  }
                }
                _Map_insert(module_hirs, key, result.program);
                __ring_match39: {
                  const __ring_m39 = _Map_get(graph.modules, key);
                  if (__ring_m39._tag === "some") {
                    const mod_ = __ring_m39._0;
                    const prefix = resolver$module_prefix(mod_.path_segments);
                    const exp = exports$extract_exports(key, prefix, ast, result.program, result.env, result.fn_mut_params);
                    _Map_insert(module_exports_map, key, exp);
                    break __ring_match39;
                  }
                  if (__ring_m39._tag === "none") {
                    break __ring_match39;
                  }
                  __match_fail(__ring_m39);
                }
              }
              break __ring_match34;
            }
            if (__ring_m34._tag === "none") {
              check_ok = false;
              break __ring_match34;
            }
            __match_fail(__ring_m34);
          }
        }
      }
      if ((check_ok === false)) {
        return Option_none;
      }
      return Option_some(new CompilePhaseResult(graph, module_asts, module_hirs, module_exports_map));
      break __ring_match32;
    }
    __match_fail(__ring_m32);
  }
}

function compile_project(entry_file, error_format) {
  __ring_match40: {
    const __ring_m40 = compile_phases(entry_file, error_format);
    if (__ring_m40._tag === "none") {
      return new CompileProjectResult("", false);
      break __ring_match40;
    }
    if (__ring_m40._tag === "some") {
      const phases = __ring_m40._0;
      const entry_key = resolver$module_key(phases.graph.entry.path_segments);
      let js_parts = [];
      let is_first = true;
      const __ring_iter_43 = __List_Iterable.iter(phases.graph.topo_order);
      while (true) {
        const __ring_next_43 = __ListIterator_Iterator.next(__ring_iter_43);
        if (__ring_next_43._tag === "none") break;
        const key = __ring_next_43._0;
        __ring_match41: {
          const __ring_m41 = [_Map_get(phases.graph.modules, key), _Map_get(phases.module_hirs, key)];
          if (Array.isArray(__ring_m41) && __ring_m41.length === 2 && __ring_m41[0]._tag === "some" && __ring_m41[1]._tag === "some") {
            const mod_ = __ring_m41[0]._0; const hir = __ring_m41[1]._0;
            const prefix = resolver$module_prefix(mod_.path_segments);
            let imports_map = build_imports_map(phases.graph, phases.module_exports_map, key);
            const esf = build_external_struct_fields(phases.graph, phases.module_exports_map, key);
            const eim = build_external_impl_methods(phases.graph, phases.module_exports_map, key);
            const efmp = build_external_fn_mut_params(phases.graph, phases.module_exports_map, key);
            const skip_preamble = (is_first === false);
            const skip_main = (key !== entry_key);
            const module_js = codegen$generate(hir, skip_preamble, skip_main, Option_some(prefix), Option_some(imports_map), Option_some(esf), Option_some(eim), Option_none, Option_none, Option_some(efmp));
            List_push(js_parts, `// === module: ${key} ===`);
            List_push(js_parts, module_js);
            List_push(js_parts, "");
            is_first = false;
            break __ring_match41;
          }
          break __ring_match41;
        }
      }
      return new CompileProjectResult(List_join(js_parts, "\n"), true);
      break __ring_match40;
    }
    __match_fail(__ring_m40);
  }
}

function register_use_aliases(ast, imports_map) {
  const __ring_iter_44 = __List_Iterable.iter(ast.uses);
  while (true) {
    const __ring_next_44 = __ListIterator_Iterator.next(__ring_iter_44);
    if (__ring_next_44._tag === "none") break;
    const use_decl = __ring_next_44._0;
    __ring_match42: {
      const __ring_m42 = use_decl.imports;
      if (__ring_m42._tag === "NamedItems") {
        const names = __ring_m42.names;
        const __ring_iter_45 = __List_Iterable.iter(names);
        while (true) {
          const __ring_next_45 = __ListIterator_Iterator.next(__ring_iter_45);
          if (__ring_next_45._tag === "none") break;
          const item = __ring_next_45._0;
          __ring_match43: {
            const __ring_m43 = item.alias;
            if (__ring_m43._tag === "some") {
              const alias = __ring_m43._0;
              __ring_match44: {
                const __ring_m44 = _Map_get(imports_map, item.name);
                if (__ring_m44._tag === "some") {
                  const existing = __ring_m44._0;
                  _Map_insert(imports_map, alias, existing);
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
        }
        break __ring_match42;
      }
      break __ring_match42;
    }
  }
}

function resolve_extern_fn_imports(ast, key, graph, exports_map, imports_map, import_lines) {
  const __ring_iter_46 = __List_Iterable.iter(ast.decls);
  while (true) {
    const __ring_next_46 = __ListIterator_Iterator.next(__ring_iter_46);
    if (__ring_next_46._tag === "none") break;
    const decl = __ring_next_46._0;
    __ring_match45: {
      const __ring_m45 = decl;
      if (__ring_m45._tag === "ExternFn") {
        const name = __ring_m45.name;
        if ((!_Map_contains_key(imports_map, name))) {
          let sorted_exports = _Map_entries(exports_map);
          sorted_exports.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
          const __ring_iter_47 = __List_Iterable.iter(sorted_exports);
          while (true) {
            const __ring_next_47 = __ListIterator_Iterator.next(__ring_iter_47);
            if (__ring_next_47._tag === "none") break;
            const eentry = __ring_next_47._0;
            const __ring_dt13 = eentry;
            const other_key = __ring_dt13[0];
            const other_exports = __ring_dt13[1];
            if ((((other_key !== key) ? _Map_contains_key(other_exports.values, name) : false) ? (!_Set_contains(other_exports.extern_values, name, __Str_Eq)) : false)) {
              __ring_match46: {
                const __ring_m46 = _Map_get(graph.modules, other_key);
                if (__ring_m46._tag === "some") {
                  const other_mod = __ring_m46._0;
                  const other_js = path_basename(Str_replace(other_mod.file_path, ".ring", ".js"));
                  const other_prefix = other_exports.module_prefix;
                  const si = codegen_ctx$safe_ident(name);
                  const alias = `${other_prefix}$${si}`;
                  _Map_insert(imports_map, name, alias);
                  List_push(import_lines, `import { ${si} as ${alias} } from "./${other_js}";`);
                  break __ring_match46;
                }
                if (__ring_m46._tag === "none") {
                  break __ring_match46;
                }
                __match_fail(__ring_m46);
              }
            }
          }
        }
        break __ring_match45;
      }
      break __ring_match45;
    }
  }
}

function compile_project_esm(entry_file, out_dir, error_format) {
  __ring_match47: {
    const __ring_m47 = compile_phases(entry_file, error_format);
    if (__ring_m47._tag === "none") {
      return new EsmCompileResult(false, "");
      break __ring_match47;
    }
    if (__ring_m47._tag === "some") {
      const phases = __ring_m47._0;
      const entry_key = resolver$module_key(phases.graph.entry.path_segments);
      const runtime_path = path_join(out_dir, "__ring_runtime.js");
      write_file(runtime_path, runtime$runtime_esm_code());
      let entry_js_path = "";
      const __ring_iter_48 = __List_Iterable.iter(phases.graph.topo_order);
      while (true) {
        const __ring_next_48 = __ListIterator_Iterator.next(__ring_iter_48);
        if (__ring_next_48._tag === "none") break;
        const key = __ring_next_48._0;
        __ring_match48: {
          const __ring_m48 = [_Map_get(phases.graph.modules, key), _Map_get(phases.module_hirs, key), _Map_get(phases.module_asts, key)];
          if (Array.isArray(__ring_m48) && __ring_m48.length === 3 && __ring_m48[0]._tag === "some" && __ring_m48[1]._tag === "some" && __ring_m48[2]._tag === "some") {
            const mod_ = __ring_m48[0]._0; const hir = __ring_m48[1]._0; const ast = __ring_m48[2]._0;
            const mod_relative = Str_replace(mod_.file_path, ".ring", ".js");
            const mod_out_path = path_join(out_dir, path_basename(mod_relative));
            let imports_map = build_imports_map(phases.graph, phases.module_exports_map, key);
            const esf = build_external_struct_fields(phases.graph, phases.module_exports_map, key);
            const eim = build_external_impl_methods(phases.graph, phases.module_exports_map, key);
            const efmp = build_external_fn_mut_params(phases.graph, phases.module_exports_map, key);
            let import_lines = build_esm_import_lines(phases.graph, phases.module_exports_map, key);
            register_use_aliases(ast, imports_map);
            resolve_extern_fn_imports(ast, key, phases.graph, phases.module_exports_map, imports_map, import_lines);
            let export_names = build_esm_export_names(ast, hir);
            const reexport_aliases = build_pub_use_reexports(ast, phases.module_exports_map, export_names);
            const __ring_iter_49 = __List_Iterable.iter(reexport_aliases);
            while (true) {
              const __ring_next_49 = __ListIterator_Iterator.next(__ring_iter_49);
              if (__ring_next_49._tag === "none") break;
              const ra = __ring_next_49._0;
              List_push(import_lines, ra);
            }
            const skip_main = (key !== entry_key);
            const module_js = codegen$generate(hir, true, skip_main, Option_none, Option_some(imports_map), Option_some(esf), Option_some(eim), Option_some(import_lines), Option_some(export_names), Option_some(efmp));
            write_file(mod_out_path, module_js);
            if ((key === entry_key)) {
              entry_js_path = mod_out_path;
            }
            break __ring_match48;
          }
          break __ring_match48;
        }
      }
      return new EsmCompileResult(true, entry_js_path);
      break __ring_match47;
    }
    __match_fail(__ring_m47);
  }
}

function compile_project_llvm(entry_file, output_path, error_format, __ring_ev_io) {
  __ring_match49: {
    const __ring_m49 = compile_phases(entry_file, error_format);
    if (__ring_m49._tag === "none") {
      return new LlvmCompileResult(false);
      break __ring_match49;
    }
    if (__ring_m49._tag === "some") {
      const phases = __ring_m49._0;
      const entry_key = resolver$module_key(phases.graph.entry.path_segments);
      let modules = [];
      let entry_prefix = "";
      const __ring_iter_50 = __List_Iterable.iter(phases.graph.topo_order);
      while (true) {
        const __ring_next_50 = __ListIterator_Iterator.next(__ring_iter_50);
        if (__ring_next_50._tag === "none") break;
        const key = __ring_next_50._0;
        __ring_match50: {
          const __ring_m50 = [_Map_get(phases.graph.modules, key), _Map_get(phases.module_hirs, key), _Map_get(phases.module_asts, key)];
          if (Array.isArray(__ring_m50) && __ring_m50.length === 3 && __ring_m50[0]._tag === "some" && __ring_m50[1]._tag === "some" && __ring_m50[2]._tag === "some") {
            const mod_ = __ring_m50[0]._0; const hir = __ring_m50[1]._0; const ast = __ring_m50[2]._0;
            const prefix = resolver$module_prefix(mod_.path_segments);
            const rc_hir = perceus$perceus_transform(hir);
            List_push(modules, [prefix, rc_hir, ast.uses]);
            if ((key === entry_key)) {
              entry_prefix = prefix;
            }
            break __ring_match50;
          }
          if (Array.isArray(__ring_m50) && __ring_m50.length === 3 && __ring_m50[0]._tag === "some" && __ring_m50[1]._tag === "some" && __ring_m50[2]._tag === "none") {
            const mod_ = __ring_m50[0]._0; const hir = __ring_m50[1]._0;
            const prefix = resolver$module_prefix(mod_.path_segments);
            const rc_hir = perceus$perceus_transform(hir);
            List_push(modules, [prefix, rc_hir, []]);
            if ((key === entry_key)) {
              entry_prefix = prefix;
            }
            break __ring_match50;
          }
          break __ring_match50;
        }
      }
      codegen_llvm$generate_llvm_project(modules, entry_prefix, output_path, __ring_ev_io);
      return new LlvmCompileResult(true);
      break __ring_match49;
    }
    __match_fail(__ring_m49);
  }
}

function verify_project_rc(entry_file, mutate, strict, error_format) {
  __ring_match51: {
    const __ring_m51 = compile_phases(entry_file, error_format);
    if (__ring_m51._tag === "none") {
      return new RcProjectVerifyResult(false, 0, 0, "");
      break __ring_match51;
    }
    if (__ring_m51._tag === "some") {
      const phases = __ring_m51._0;
      let all = [];
      const __ring_iter_51 = __List_Iterable.iter(phases.graph.topo_order);
      while (true) {
        const __ring_next_51 = __ListIterator_Iterator.next(__ring_iter_51);
        if (__ring_next_51._tag === "none") break;
        const key = __ring_next_51._0;
        __ring_match52: {
          const __ring_m52 = _Map_get(phases.module_hirs, key);
          if (__ring_m52._tag === "some") {
            const hir = __ring_m52._0;
            const rc_hir = perceus$perceus_transform_mutated(hir, mutate);
            const __ring_iter_52 = __List_Iterable.iter(verify_rc$verify_rc_program(rc_hir));
            while (true) {
              const __ring_next_52 = __ListIterator_Iterator.next(__ring_iter_52);
              if (__ring_next_52._tag === "none") break;
              const f = __ring_next_52._0;
              List_push(all, f);
            }
            break __ring_match52;
          }
          if (__ring_m52._tag === "none") {
            break __ring_match52;
          }
          __match_fail(__ring_m52);
        }
      }
      const fatal = verify_rc$rc_fatal_count(all);
      return new RcProjectVerifyResult(true, fatal, (List_len(all) - fatal), verify_rc$format_rc_findings(all, strict));
      break __ring_match51;
    }
    __match_fail(__ring_m51);
  }
}

function __CompileProjectResult_Eq_eq(self, other) {
  return (self.js === other.js) && (self.success === other.success);
}
const __CompileProjectResult_Eq = { eq: __CompileProjectResult_Eq_eq, ne: function(self, other) { return !__CompileProjectResult_Eq_eq(self, other); } };

function __EsmCompileResult_Eq_eq(self, other) {
  return (self.success === other.success) && (self.entry_js_path === other.entry_js_path);
}
const __EsmCompileResult_Eq = { eq: __EsmCompileResult_Eq_eq, ne: function(self, other) { return !__EsmCompileResult_Eq_eq(self, other); } };

function __LlvmCompileResult_Eq_eq(self, other) {
  return (self.success === other.success);
}
const __LlvmCompileResult_Eq = { eq: __LlvmCompileResult_Eq_eq, ne: function(self, other) { return !__LlvmCompileResult_Eq_eq(self, other); } };

function __RcProjectVerifyResult_Eq_eq(self, other) {
  return (self.success === other.success) && (self.fatal === other.fatal) && (self.exempt === other.exempt) && (self.report === other.report);
}
const __RcProjectVerifyResult_Eq = { eq: __RcProjectVerifyResult_Eq_eq, ne: function(self, other) { return !__RcProjectVerifyResult_Eq_eq(self, other); } };

function __Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return __ring_T_Eq.eq(self._0, other._0);
    case "Err": return __ring_E_Eq.eq(self._0, other._0);
    default: return true;
  }
}
const __Result_Eq = { eq: __Result_Eq_eq, ne: function(self, other, __ring_T_Eq, __ring_E_Eq) { return !__Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq); } };

function __CompileProjectResult_Clone_clone(self) {
  return new CompileProjectResult(self.js, self.success);
}
const __CompileProjectResult_Clone = { clone: __CompileProjectResult_Clone_clone };

function __EsmCompileResult_Clone_clone(self) {
  return new EsmCompileResult(self.success, self.entry_js_path);
}
const __EsmCompileResult_Clone = { clone: __EsmCompileResult_Clone_clone };

function __ListIterator_Clone_clone(self, __ring_T_Clone) {
  return new ListIterator(__List_Clone.clone(self.list, __ring_T_Clone), self.index);
}
const __ListIterator_Clone = { clone: __ListIterator_Clone_clone };

function __LlvmCompileResult_Clone_clone(self) {
  return new LlvmCompileResult(self.success);
}
const __LlvmCompileResult_Clone = { clone: __LlvmCompileResult_Clone_clone };

function __RcProjectVerifyResult_Clone_clone(self) {
  return new RcProjectVerifyResult(self.success, self.fatal, self.exempt, self.report);
}
const __RcProjectVerifyResult_Clone = { clone: __RcProjectVerifyResult_Clone_clone };

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

function __LlvmCompileResult_Ord_cmp(self, other) {
  var c;
  return (self.success < other.success ? -1 : self.success > other.success ? 1 : 0);
}
const __LlvmCompileResult_Ord = { cmp: __LlvmCompileResult_Ord_cmp };

function __RcProjectVerifyResult_Ord_cmp(self, other) {
  var c;
  c = (self.success < other.success ? -1 : self.success > other.success ? 1 : 0);
  if (c !== 0) return c;
  c = (self.fatal < other.fatal ? -1 : self.fatal > other.fatal ? 1 : 0);
  if (c !== 0) return c;
  c = (self.exempt < other.exempt ? -1 : self.exempt > other.exempt ? 1 : 0);
  if (c !== 0) return c;
  return (self.report < other.report ? -1 : self.report > other.report ? 1 : 0);
}
const __RcProjectVerifyResult_Ord = { cmp: __RcProjectVerifyResult_Ord_cmp };

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

function __CompileProjectResult_Debug_debug(self) {
  return "CompileProjectResult { " + "js: " + String(self.js) + ", " + "success: " + String(self.success) + " }";
}
const __CompileProjectResult_Debug = { debug: __CompileProjectResult_Debug_debug };

function __EsmCompileResult_Debug_debug(self) {
  return "EsmCompileResult { " + "success: " + String(self.success) + ", " + "entry_js_path: " + String(self.entry_js_path) + " }";
}
const __EsmCompileResult_Debug = { debug: __EsmCompileResult_Debug_debug };

function __ListIterator_Debug_debug(self, __ring_T_Debug) {
  return "ListIterator { " + "list: " + __List_Debug.debug(self.list, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __ListIterator_Debug = { debug: __ListIterator_Debug_debug };

function __LlvmCompileResult_Debug_debug(self) {
  return "LlvmCompileResult { " + "success: " + String(self.success) + " }";
}
const __LlvmCompileResult_Debug = { debug: __LlvmCompileResult_Debug_debug };

function __RcProjectVerifyResult_Debug_debug(self) {
  return "RcProjectVerifyResult { " + "success: " + String(self.success) + ", " + "fatal: " + String(self.fatal) + ", " + "exempt: " + String(self.exempt) + ", " + "report: " + String(self.report) + " }";
}
const __RcProjectVerifyResult_Debug = { debug: __RcProjectVerifyResult_Debug_debug };

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


export { CompileProjectResult, EsmCompileResult, compile_project, LlvmCompileResult, compile_project_llvm, RcProjectVerifyResult, verify_project_rc, compile_project_esm, __CompileProjectResult_Eq, __EsmCompileResult_Eq, __LlvmCompileResult_Eq, __RcProjectVerifyResult_Eq, __CompileProjectResult_Clone, __EsmCompileResult_Clone, __LlvmCompileResult_Clone, __RcProjectVerifyResult_Clone, __CompileProjectResult_Ord, __EsmCompileResult_Ord, __LlvmCompileResult_Ord, __RcProjectVerifyResult_Ord, __CompileProjectResult_Debug, __EsmCompileResult_Debug, __LlvmCompileResult_Debug, __RcProjectVerifyResult_Debug };