import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0405 as codes$E0405, E0504 as codes$E0504, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, error_description as codes$error_description, error_category as codes$error_category } from "./codes.js";
import { new_union_find as union_find$new_union_find, uf_find as union_find$uf_find, uf_bind as union_find$uf_bind, uf_lookup as union_find$uf_lookup, uf_union as union_find$uf_union, uf_insert as union_find$uf_insert, UnionFind as union_find$UnionFind } from "./union_find.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst_map as env$apply_subst_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __IdGen_Eq as env$__IdGen_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __ImplEntry_Clone as env$__ImplEntry_Clone, __FnBound_Clone as env$__FnBound_Clone, __IdGen_Clone as env$__IdGen_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __IdGen_Ord as env$__IdGen_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __ImplEntry_Debug as env$__ImplEntry_Debug, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { empty_subst as unify$empty_subst, occurs_in as unify$occurs_in, unify_effect_rows as unify$unify_effect_rows, unify as unify$unify, UnificationError as unify$UnificationError, __UnificationError_Eq as unify$__UnificationError_Eq, __UnificationError_Clone as unify$__UnificationError_Clone, __UnificationError_Ord as unify$__UnificationError_Ord, __UnificationError_Debug as unify$__UnificationError_Debug } from "./unify.js";
import { new_infer_ctx as infer_ctx$new_infer_ctx, type_error as infer_ctx$type_error, merge_effects as infer_ctx$merge_effects, unify_at as infer_ctx$unify_at, free_type_vars as infer_ctx$free_type_vars, collect_free_vars as infer_ctx$collect_free_vars, free_type_vars_in_env as infer_ctx$free_type_vars_in_env, generalize as infer_ctx$generalize, update_fn_effects as infer_ctx$update_fn_effects, build_scheme_var_map as infer_ctx$build_scheme_var_map, resolve_dicts_from_scheme as infer_ctx$resolve_dicts_from_scheme, resolve_type_expr as infer_ctx$resolve_type_expr, resolve_self_type as infer_ctx$resolve_self_type, resolve_named_type as infer_ctx$resolve_named_type, bind_pattern as infer_ctx$bind_pattern, remove_fail_effect as infer_ctx$remove_fail_effect, remove_specific_fail_effect as infer_ctx$remove_specific_fail_effect, resolve_relative_qualifier as infer_ctx$resolve_relative_qualifier, InferResult as infer_ctx$InferResult, FnBoundsEntry as infer_ctx$FnBoundsEntry, CompileError as infer_ctx$CompileError, InferCtx as infer_ctx$InferCtx, __FnBoundsEntry_Eq as infer_ctx$__FnBoundsEntry_Eq, __CompileError_Eq as infer_ctx$__CompileError_Eq, __FnBoundsEntry_Clone as infer_ctx$__FnBoundsEntry_Clone, __CompileError_Clone as infer_ctx$__CompileError_Clone, __FnBoundsEntry_Ord as infer_ctx$__FnBoundsEntry_Ord, __CompileError_Ord as infer_ctx$__CompileError_Ord, __FnBoundsEntry_Debug as infer_ctx$__FnBoundsEntry_Debug, __CompileError_Debug as infer_ctx$__CompileError_Debug } from "./infer_ctx.js";
import { check_exhaustive as exhaustive$check_exhaustive } from "./exhaustive.js";

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

class MethodLookupResult {
  constructor(method_type, method_scheme) {
    this.method_type = method_type;
    this.method_scheme = method_scheme;
  }
}

function resolve_var_id(id, sub) {
  __ring_match1: {
    const __ring_m1 = union_find$uf_lookup(sub, id);
    if (__ring_m1._tag === "some") {
      const resolved = __ring_m1._0;
      __ring_match2: {
        const __ring_m2 = resolved;
        if (__ring_m2._tag === "TypeVar") {
          const new_id = __ring_m2.id;
          return resolve_var_id(new_id, sub);
          break __ring_match2;
        }
        return id;
        break __ring_match2;
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "none") {
      return union_find$uf_find(sub, id);
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
}

function infer_block(ctx, body, initial_subst, __ring_ev_fail) {
  __ring_match3: {
    const __ring_m3 = body;
    if (__ring_m3._tag === "Block") {
      const stmts = __ring_m3.stmts; const tail = __ring_m3.tail; const span = __ring_m3.span;
      let subst = (function() {
  const __ring_m = initial_subst;
  if (__ring_m._tag === "some") { const s = __ring_m._0; return s; }
  if (__ring_m._tag === "none") { return ctx.subst; }
  __match_fail(__ring_m);
})();
      let effects = types$EMPTY_ROW;
      let hstmts = [];
      for (const stmt of stmts) {
        const sr = infer_stmt(ctx, stmt, subst, __ring_ev_fail);
        subst = sr.subst;
        const me = infer_ctx$merge_effects(ctx.env, effects, sr.effects, subst, __ring_ev_fail);
        effects = me[0];
        subst = me[1];
        List_push(hstmts, sr.hstmt);
      }
      let tail_hexpr = Option_none;
      let block_type = types$UNIT;
      __ring_match4: {
        const __ring_m4 = tail;
        if (__ring_m4._tag === "some") {
          const t = __ring_m4._0;
          const tr = infer_expr(ctx, t, subst, __ring_ev_fail);
          subst = tr.subst;
          const me = infer_ctx$merge_effects(ctx.env, effects, tr.effects, subst, __ring_ev_fail);
          effects = me[0];
          subst = me[1];
          tail_hexpr = Option_some(tr.hexpr);
          block_type = hir$hexpr_type(tr.hexpr);
          break __ring_match4;
        }
        if (__ring_m4._tag === "none") {
          break __ring_match4;
        }
        __match_fail(__ring_m4);
      }
      const hblock = hir$HExpr_Block(hstmts, tail_hexpr, block_type, effects, span);
      return new infer_ctx$InferResult(hblock, subst, effects);
      break __ring_match3;
    }
    return panic("infer_block called with non-block expression");
    break __ring_match3;
  }
}

class StmtResult {
  constructor(hstmt, subst, effects) {
    this.hstmt = hstmt;
    this.subst = subst;
    this.effects = effects;
  }
}

function infer_stmt(ctx, stmt, subst, __ring_ev_fail) {
  __ring_match5: {
    const __ring_m5 = stmt;
    if (__ring_m5._tag === "Let") {
      const name = __ring_m5.name; const name_span = __ring_m5.name_span; const type_annotation = __ring_m5.type_annotation; const init = __ring_m5.init; const span = __ring_m5.span;
      const init_r = infer_expr(ctx, init, subst, __ring_ev_fail);
      let s = init_r.subst;
      let var_type = hir$hexpr_type(init_r.hexpr);
      __ring_match6: {
        const __ring_m6 = type_annotation;
        if (__ring_m6._tag === "some") {
          const ta = __ring_m6._0;
          const annotated = infer_ctx$resolve_type_expr(ctx, ta);
          s = infer_ctx$unify_at(ctx.sink, ctx.env, var_type, annotated, s, span);
          var_type = env$apply_subst(s, annotated);
          break __ring_match6;
        }
        if (__ring_m6._tag === "none") {
          break __ring_match6;
        }
        __match_fail(__ring_m6);
      }
      const resolved = env$apply_subst(s, var_type);
      const scheme = infer_ctx$generalize(ctx.env, resolved, s);
      env$TypeEnv_bind(ctx.env, name, scheme);
      const bound_scheme = env$TypeEnv_lookup(ctx.env, name);
      const bound_def_id = (function() {
  const __ring_m = bound_scheme;
  if (__ring_m._tag === "some") { const bs = __ring_m._0; return (function() {
  const __ring_m = bs.def_id;
  if (__ring_m._tag === "some") { const did = __ring_m._0; return (function() {
  env$TypeEnv_record_def_span(ctx.env, did, name_span);
  _Set_insert(ctx.env.scope.let_defs, did);
  return Option_some(did);
})(); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})(); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return new StmtResult(hir$HStmt_Let(name, name_span, bound_def_id, resolved, init_r.hexpr, span), s, init_r.effects);
      break __ring_match5;
    }
    if (__ring_m5._tag === "Var") {
      const name = __ring_m5.name; const name_span = __ring_m5.name_span; const type_annotation = __ring_m5.type_annotation; const init = __ring_m5.init; const span = __ring_m5.span;
      const init_r = infer_expr(ctx, init, subst, __ring_ev_fail);
      let s = init_r.subst;
      let var_type = hir$hexpr_type(init_r.hexpr);
      __ring_match7: {
        const __ring_m7 = type_annotation;
        if (__ring_m7._tag === "some") {
          const ta = __ring_m7._0;
          const annotated = infer_ctx$resolve_type_expr(ctx, ta);
          s = infer_ctx$unify_at(ctx.sink, ctx.env, var_type, annotated, s, span);
          var_type = env$apply_subst(s, annotated);
          break __ring_match7;
        }
        if (__ring_m7._tag === "none") {
          break __ring_match7;
        }
        __match_fail(__ring_m7);
      }
      env$TypeEnv_bind_mono(ctx.env, name, env$apply_subst(s, var_type));
      const var_scheme = env$TypeEnv_lookup(ctx.env, name);
      __ring_match8: {
        const __ring_m8 = var_scheme;
        if (__ring_m8._tag === "some") {
          const vs = __ring_m8._0;
          __ring_match9: {
            const __ring_m9 = vs.def_id;
            if (__ring_m9._tag === "some") {
              const did = __ring_m9._0;
              env$TypeEnv_record_def_span(ctx.env, did, name_span);
              _Set_insert(ctx.env.scope.mutable_vars, did);
              break __ring_match9;
            }
            if (__ring_m9._tag === "none") {
              break __ring_match9;
            }
            __match_fail(__ring_m9);
          }
          return new StmtResult(hir$HStmt_Var(name, name_span, vs.def_id, env$apply_subst(s, var_type), init_r.hexpr, span), s, init_r.effects);
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          return panic("var_stmt: lookup failed");
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      break __ring_match5;
    }
    if (__ring_m5._tag === "Assign") {
      const target = __ring_m5.target; const value = __ring_m5.value; const span = __ring_m5.span;
      check_assign_target_mutable(ctx, target);
      const target_r = infer_expr(ctx, target, subst, __ring_ev_fail);
      const value_r = infer_expr(ctx, value, target_r.subst, __ring_ev_fail);
      let s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(target_r.hexpr), hir$hexpr_type(value_r.hexpr), value_r.subst, span);
      const me = infer_ctx$merge_effects(ctx.env, target_r.effects, value_r.effects, s, __ring_ev_fail);
      s = me[1];
      return new StmtResult(hir$HStmt_Assign(target_r.hexpr, value_r.hexpr, span), s, me[0]);
      break __ring_match5;
    }
    if (__ring_m5._tag === "ExprStmt") {
      const expr = __ring_m5.expr; const span = __ring_m5.span;
      const r = infer_expr(ctx, expr, subst, __ring_ev_fail);
      return new StmtResult(hir$HStmt_ExprStmt(r.hexpr, span), r.subst, r.effects);
      break __ring_match5;
    }
    if (__ring_m5._tag === "Return") {
      const value = __ring_m5.value; const span = __ring_m5.span;
      __ring_match10: {
        const __ring_m10 = value;
        if (__ring_m10._tag === "some") {
          const v = __ring_m10._0;
          const r = infer_expr(ctx, v, subst, __ring_ev_fail);
          let s = r.subst;
          __ring_match11: {
            const __ring_m11 = ctx.current_fn_return_type;
            if (__ring_m11._tag === "some") {
              const ret_type = __ring_m11._0;
              s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(r.hexpr), ret_type, s, span);
              break __ring_match11;
            }
            if (__ring_m11._tag === "none") {
              break __ring_match11;
            }
            __match_fail(__ring_m11);
          }
          return new StmtResult(hir$HStmt_Return(Option_some(r.hexpr), span), s, r.effects);
          break __ring_match10;
        }
        if (__ring_m10._tag === "none") {
          let s = subst;
          __ring_match12: {
            const __ring_m12 = ctx.current_fn_return_type;
            if (__ring_m12._tag === "some") {
              const ret_type = __ring_m12._0;
              s = infer_ctx$unify_at(ctx.sink, ctx.env, types$UNIT, ret_type, s, span);
              break __ring_match12;
            }
            if (__ring_m12._tag === "none") {
              break __ring_match12;
            }
            __match_fail(__ring_m12);
          }
          return new StmtResult(hir$HStmt_Return(Option_none, span), s, types$EMPTY_ROW);
          break __ring_match10;
        }
        __match_fail(__ring_m10);
      }
      break __ring_match5;
    }
    if (__ring_m5._tag === "While") {
      const condition = __ring_m5.condition; const body = __ring_m5.body; const span = __ring_m5.span;
      const cond_r = infer_expr(ctx, condition, subst, __ring_ev_fail);
      let s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(cond_r.hexpr), types$BOOL, cond_r.subst, span);
      env$TypeEnv_push_scope(ctx.env);
      ctx.loop_depth = (ctx.loop_depth + 1);
      const body_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_block(ctx, body, Option_some(s), __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      ctx.loop_depth = (ctx.loop_depth - 1);
      env$TypeEnv_pop_scope(ctx.env);
      __ring_match13: {
        const __ring_m13 = body_result;
        if (__ring_m13._tag === "some") {
          const body_r = __ring_m13._0;
          s = body_r.subst;
          const me = infer_ctx$merge_effects(ctx.env, cond_r.effects, body_r.effects, s, __ring_ev_fail);
          return new StmtResult(hir$HStmt_While(cond_r.hexpr, body_r.hexpr, span), me[1], me[0]);
          break __ring_match13;
        }
        if (__ring_m13._tag === "none") {
          return __ring_ev_fail.raise(new infer_ctx$CompileError());
          break __ring_match13;
        }
        __match_fail(__ring_m13);
      }
      break __ring_match5;
    }
    if (__ring_m5._tag === "ForIn") {
      const binding = __ring_m5.binding; const binding_span = __ring_m5.binding_span; const destructure = __ring_m5.destructure; const iterable = __ring_m5.iterable; const body = __ring_m5.body; const span = __ring_m5.span;
      const iter_r = infer_expr(ctx, iterable, subst, __ring_ev_fail);
      let s = iter_r.subst;
      const iter_type = env$apply_subst(s, hir$hexpr_type(iter_r.hexpr));
      const is_destructure = Option_is_some(destructure);
      let element_type = env$TypeEnv_fresh_var(ctx.env);
      __ring_match14: {
        const __ring_m14 = iter_type;
        if (__ring_m14._tag === "EnumType") {
          const name = __ring_m14.name; const type_params = __ring_m14.type_params;
          if (((name === hir$BUILTIN_RANGE) && (List_len(type_params) > 0))) {
            element_type = (function() {
  const __ring_m = List_first(type_params);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return types$INT; }
  __match_fail(__ring_m);
})();
          } else {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `for..in requires an iterable type (Range, List, Set, or Map), got ${types$type_to_string(iter_type)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("Supported iterables: range expressions (0..10), List<T>, Set<T>, Map<K,V>")));
          }
          break __ring_match14;
        }
        if (__ring_m14._tag === "StructType") {
          const name = __ring_m14.name; const type_params = __ring_m14.type_params;
          if (((name === hir$BUILTIN_LIST) && (List_len(type_params) > 0))) {
            element_type = (function() {
  const __ring_m = List_first(type_params);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return element_type; }
  __match_fail(__ring_m);
})();
          } else {
            if (((name === hir$BUILTIN_SET) && (List_len(type_params) > 0))) {
              element_type = (function() {
  const __ring_m = List_first(type_params);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return t; }
  if (__ring_m._tag === "none") { return element_type; }
  __match_fail(__ring_m);
})();
            } else {
              if (((name === hir$BUILTIN_MAP) && (List_len(type_params) >= 2))) {
                if ((!is_destructure)) {
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0301, "Map is not directly iterable with for..in. Use 'for (k, v) in map { ... }' instead.", span, diagnostics$DiagnosticContext_OtherContext(Option_some("Map requires destructuring: for (k, v) in map")));
                }
                __ring_match15: {
                  const __ring_m15 = [List_get(type_params, 0), List_get(type_params, 1)];
                  if (Array.isArray(__ring_m15) && __ring_m15.length === 2 && __ring_m15[0]._tag === "some" && __ring_m15[1]._tag === "some") {
                    const kt = __ring_m15[0]._0; const vt = __ring_m15[1]._0;
                    element_type = types$Type_TupleType([kt, vt]);
                    break __ring_match15;
                  }
                  break __ring_match15;
                }
              } else {
                const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `for..in requires an iterable type (Range, List, Set, or Map), got ${types$type_to_string(iter_type)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("Supported iterables: range expressions (0..10), List<T>, Set<T>, Map<K,V>")));
              }
            }
          }
          break __ring_match14;
        }
        const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `for..in requires an iterable type (Range, List, Set, or Map), got ${types$type_to_string(iter_type)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("Supported iterables: range expressions (0..10), List<T>, Set<T>, Map<K,V>")));
        break __ring_match14;
      }
      env$TypeEnv_push_scope(ctx.env);
      let hdestructure = Option_none;
      __ring_match16: {
        const __ring_m16 = destructure;
        if (__ring_m16._tag === "some") {
          const destr = __ring_m16._0;
          __ring_match17: {
            const __ring_m17 = element_type;
            if (__ring_m17._tag === "TupleType") {
              const type_elems = __ring_m17.elements;
              if ((List_len(destr.names) !== List_len(type_elems))) {
                const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Destructure binding expects ${Int_to_str(List_len(destr.names))} elements, but iterable element type is ${types$type_to_string(element_type)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("tuple arity mismatch")));
              }
              break __ring_match17;
            }
            const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Destructure binding expects tuple elements, but iterable element type is ${types$type_to_string(element_type)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("tuple arity mismatch")));
            break __ring_match17;
          }
          let hd = [];
          let di = 0;
          while ((di < List_len(destr.names))) {
            __ring_match18: {
              const __ring_m18 = List_get(destr.names, di);
              if (__ring_m18._tag === "some") {
                const dname = __ring_m18._0;
                const elem_t = (function() {
  const __ring_m = element_type;
  if (__ring_m._tag === "TupleType") { const type_elems = __ring_m.elements; return (function() {
  const __ring_m = List_get(type_elems, di);
  if (__ring_m._tag === "some") { const et = __ring_m._0; return et; }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})(); }
  return env$TypeEnv_fresh_var(ctx.env);
})();
                env$TypeEnv_bind_mono(ctx.env, dname, elem_t);
                const dscheme = env$TypeEnv_lookup(ctx.env, dname);
                __ring_match19: {
                  const __ring_m19 = dscheme;
                  if (__ring_m19._tag === "some") {
                    const ds = __ring_m19._0;
                    __ring_match20: {
                      const __ring_m20 = [ds.def_id, List_get(destr.spans, di)];
                      if (Array.isArray(__ring_m20) && __ring_m20.length === 2 && __ring_m20[0]._tag === "some" && __ring_m20[1]._tag === "some") {
                        const did = __ring_m20[0]._0; const dspan = __ring_m20[1]._0;
                        env$TypeEnv_record_def_span(ctx.env, did, dspan);
                        break __ring_match20;
                      }
                      break __ring_match20;
                    }
                    List_push(hd, new hir$HForInDestructure(dname, ds.def_id));
                    break __ring_match19;
                  }
                  if (__ring_m19._tag === "none") {
                    List_push(hd, new hir$HForInDestructure(dname, Option_none));
                    break __ring_match19;
                  }
                  __match_fail(__ring_m19);
                }
                break __ring_match18;
              }
              if (__ring_m18._tag === "none") {
                break __ring_match18;
              }
              __match_fail(__ring_m18);
            }
            di = (di + 1);
          }
          hdestructure = Option_some(hd);
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          env$TypeEnv_bind_mono(ctx.env, binding, element_type);
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      const binding_scheme = env$TypeEnv_lookup(ctx.env, binding);
      __ring_match21: {
        const __ring_m21 = binding_scheme;
        if (__ring_m21._tag === "some") {
          const bs = __ring_m21._0;
          __ring_match22: {
            const __ring_m22 = bs.def_id;
            if (__ring_m22._tag === "some") {
              const did = __ring_m22._0;
              env$TypeEnv_record_def_span(ctx.env, did, binding_span);
              break __ring_match22;
            }
            if (__ring_m22._tag === "none") {
              break __ring_match22;
            }
            __match_fail(__ring_m22);
          }
          break __ring_match21;
        }
        if (__ring_m21._tag === "none") {
          break __ring_match21;
        }
        __match_fail(__ring_m21);
      }
      ctx.loop_depth = (ctx.loop_depth + 1);
      const body_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_block(ctx, body, Option_some(s), __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      ctx.loop_depth = (ctx.loop_depth - 1);
      env$TypeEnv_pop_scope(ctx.env);
      __ring_match23: {
        const __ring_m23 = body_result;
        if (__ring_m23._tag === "some") {
          const body_r = __ring_m23._0;
          s = body_r.subst;
          const me = infer_ctx$merge_effects(ctx.env, iter_r.effects, body_r.effects, s, __ring_ev_fail);
          return new StmtResult(hir$HStmt_ForIn(binding, binding_span, (function() {
  const __ring_m = binding_scheme;
  if (__ring_m._tag === "some") { const bs = __ring_m._0; return bs.def_id; }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})(), hdestructure, iter_r.hexpr, body_r.hexpr, span), me[1], me[0]);
          break __ring_match23;
        }
        if (__ring_m23._tag === "none") {
          return __ring_ev_fail.raise(new infer_ctx$CompileError());
          break __ring_match23;
        }
        __match_fail(__ring_m23);
      }
      break __ring_match5;
    }
    if (__ring_m5._tag === "Break") {
      const span = __ring_m5.span;
      if ((ctx.loop_depth === 0)) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0206, "'break' can only be used inside a loop", span, diagnostics$DiagnosticContext_OtherContext(Option_some("break outside loop")));
      }
      return new StmtResult(hir$HStmt_Break(span), subst, types$EMPTY_ROW);
      break __ring_match5;
    }
    if (__ring_m5._tag === "Continue") {
      const span = __ring_m5.span;
      if ((ctx.loop_depth === 0)) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0206, "'continue' can only be used inside a loop", span, diagnostics$DiagnosticContext_OtherContext(Option_some("continue outside loop")));
      }
      return new StmtResult(hir$HStmt_Continue(span), subst, types$EMPTY_ROW);
      break __ring_match5;
    }
    if (__ring_m5._tag === "LetDestructure") {
      const pattern = __ring_m5.pattern; const init = __ring_m5.init; const span = __ring_m5.span;
      const init_r = infer_expr(ctx, init, subst, __ring_ev_fail);
      let s = init_r.subst;
      const init_type = env$apply_subst(s, hir$hexpr_type(init_r.hexpr));
      __ring_match24: {
        const __ring_m24 = init_type;
        if (__ring_m24._tag === "TupleType") {
          break __ring_match24;
        }
        const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `let destructuring requires tuple type, got ${types$type_to_string(init_type)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("not a tuple")));
        break __ring_match24;
      }
      const tuple_elements = (function() {
  const __ring_m = init_type;
  if (__ring_m._tag === "TupleType") { const elements = __ring_m.elements; return elements; }
  return [];
})();
      __ring_match25: {
        const __ring_m25 = pattern;
        if (__ring_m25._tag === "TuplePattern") {
          const pat_elements = __ring_m25.elements;
          if ((List_len(pat_elements) !== List_len(tuple_elements))) {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Tuple has ${Int_to_str(List_len(tuple_elements))} elements but pattern has ${Int_to_str(List_len(pat_elements))}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("tuple arity mismatch")));
          }
          let bindings = [];
          let bi = 0;
          while ((bi < List_len(pat_elements))) {
            __ring_match26: {
              const __ring_m26 = List_get(pat_elements, bi);
              if (__ring_m26._tag === "some") {
                const p = __ring_m26._0;
                const elem_type = (function() {
  const __ring_m = List_get(tuple_elements, bi);
  if (__ring_m._tag === "some") { const et = __ring_m._0; return et; }
  if (__ring_m._tag === "none") { return types$UNIT; }
  __match_fail(__ring_m);
})();
                __ring_match27: {
                  const __ring_m27 = p;
                  if (__ring_m27._tag === "Binding") {
                    const name = __ring_m27.name; const pspan = __ring_m27.span;
                    env$TypeEnv_bind_mono(ctx.env, name, elem_type);
                    const bscheme = env$TypeEnv_lookup(ctx.env, name);
                    __ring_match28: {
                      const __ring_m28 = bscheme;
                      if (__ring_m28._tag === "some") {
                        const bs = __ring_m28._0;
                        __ring_match29: {
                          const __ring_m29 = bs.def_id;
                          if (__ring_m29._tag === "some") {
                            const did = __ring_m29._0;
                            env$TypeEnv_record_def_span(ctx.env, did, pspan);
                            _Set_insert(ctx.env.scope.let_defs, did);
                            break __ring_match29;
                          }
                          if (__ring_m29._tag === "none") {
                            break __ring_match29;
                          }
                          __match_fail(__ring_m29);
                        }
                        List_push(bindings, new hir$HLetDestructureBinding(name, bs.def_id, elem_type));
                        break __ring_match28;
                      }
                      if (__ring_m28._tag === "none") {
                        List_push(bindings, new hir$HLetDestructureBinding(name, Option_none, elem_type));
                        break __ring_match28;
                      }
                      __match_fail(__ring_m28);
                    }
                    break __ring_match27;
                  }
                  if (__ring_m27._tag === "Wildcard") {
                    List_push(bindings, new hir$HLetDestructureBinding("_", Option_none, elem_type));
                    break __ring_match27;
                  }
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0301, "Only binding and wildcard patterns are supported in let destructuring", span, diagnostics$DiagnosticContext_OtherContext(Option_some("unsupported pattern kind")));
                  break __ring_match27;
                }
                break __ring_match26;
              }
              if (__ring_m26._tag === "none") {
                break __ring_match26;
              }
              __match_fail(__ring_m26);
            }
            bi = (bi + 1);
          }
          return new StmtResult(hir$HStmt_LetDestructure(pattern, bindings, init_r.hexpr, span), s, init_r.effects);
          break __ring_match25;
        }
        const _ = infer_ctx$type_error(ctx.sink, codes$E0301, "let destructuring requires tuple pattern", span, diagnostics$DiagnosticContext_OtherContext(Option_some("not a tuple pattern")));
        return new StmtResult(hir$HStmt_ExprStmt(hir$HExpr_IntLit(0, types$UNIT, types$EMPTY_ROW, span), span), s, init_r.effects);
        break __ring_match25;
      }
      break __ring_match5;
    }
    if (__ring_m5._tag === "IfLet") {
      const pattern = __ring_m5.pattern; const expr = __ring_m5.expr; const then_block = __ring_m5.then_block; const else_block = __ring_m5.else_block; const span = __ring_m5.span;
      const expr_r = infer_expr(ctx, expr, subst, __ring_ev_fail);
      let s = expr_r.subst;
      const expr_type = env$apply_subst(s, hir$hexpr_type(expr_r.hexpr));
      env$TypeEnv_push_scope(ctx.env);
      const then_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some((function() {
  infer_ctx$bind_pattern(ctx, pattern, expr_type, s);
  return infer_block(ctx, then_block, Option_some(s), __ring_ev_fail);
})()); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      env$TypeEnv_pop_scope(ctx.env);
      __ring_match30: {
        const __ring_m30 = then_result;
        if (__ring_m30._tag === "some") {
          const then_r = __ring_m30._0;
          s = then_r.subst;
          let combined = infer_ctx$merge_effects(ctx.env, expr_r.effects, then_r.effects, s, __ring_ev_fail);
          let combined_effects = combined[0];
          s = combined[1];
          let else_hblock = Option_none;
          __ring_match31: {
            const __ring_m31 = else_block;
            if (__ring_m31._tag === "some") {
              const eb = __ring_m31._0;
              env$TypeEnv_push_scope(ctx.env);
              const else_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_block(ctx, eb, Option_some(s), __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
              env$TypeEnv_pop_scope(ctx.env);
              __ring_match32: {
                const __ring_m32 = else_result;
                if (__ring_m32._tag === "some") {
                  const else_r = __ring_m32._0;
                  s = else_r.subst;
                  else_hblock = Option_some(else_r.hexpr);
                  const me2 = infer_ctx$merge_effects(ctx.env, combined_effects, else_r.effects, s, __ring_ev_fail);
                  combined_effects = me2[0];
                  s = me2[1];
                  break __ring_match32;
                }
                if (__ring_m32._tag === "none") {
                  __ring_ev_fail.raise(new infer_ctx$CompileError());
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
          return new StmtResult(hir$HStmt_IfLet(pattern, expr_r.hexpr, then_r.hexpr, else_hblock, span), s, combined_effects);
          break __ring_match30;
        }
        if (__ring_m30._tag === "none") {
          return __ring_ev_fail.raise(new infer_ctx$CompileError());
          break __ring_match30;
        }
        __match_fail(__ring_m30);
      }
      break __ring_match5;
    }
    __match_fail(__ring_m5);
  }
}

function check_assign_target_mutable(ctx, target) {
  __ring_match33: {
    const __ring_m33 = target;
    if (__ring_m33._tag === "Ident") {
      const name = __ring_m33.name; const span = __ring_m33.span;
      const scheme = env$TypeEnv_lookup(ctx.env, name);
      __ring_match34: {
        const __ring_m34 = scheme;
        if (__ring_m34._tag === "some") {
          const s = __ring_m34._0;
          __ring_match35: {
            const __ring_m35 = s.def_id;
            if (__ring_m35._tag === "some") {
              const did = __ring_m35._0;
              if ((!_Set_contains(ctx.env.scope.mutable_vars, did, __Int_Eq))) {
                const _ = infer_ctx$type_error(ctx.sink, codes$E0205, `Cannot assign to immutable variable '${name}' (declared with 'let'). Use 'let mut' for mutable bindings.`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`'${name}' is declared with 'let'`)));
              }
              break __ring_match35;
            }
            if (__ring_m35._tag === "none") {
              break __ring_match35;
            }
            __match_fail(__ring_m35);
          }
          break __ring_match34;
        }
        if (__ring_m34._tag === "none") {
          break __ring_match34;
        }
        __match_fail(__ring_m34);
      }
      break __ring_match33;
    }
    if (__ring_m33._tag === "FieldAccess") {
      const receiver = __ring_m33.receiver; const span = __ring_m33.span;
      const root = find_root_expr(receiver);
      __ring_match36: {
        const __ring_m36 = root;
        if (__ring_m36._tag === "Ident") {
          const name = __ring_m36.name; const rspan = __ring_m36.span;
          const scheme = env$TypeEnv_lookup(ctx.env, name);
          __ring_match37: {
            const __ring_m37 = scheme;
            if (__ring_m37._tag === "some") {
              const s = __ring_m37._0;
              __ring_match38: {
                const __ring_m38 = s.def_id;
                if (__ring_m38._tag === "some") {
                  const did = __ring_m38._0;
                  if ((!_Set_contains(ctx.env.scope.mutable_vars, did, __Int_Eq))) {
                    const _ = infer_ctx$type_error(ctx.sink, codes$E0205, `Cannot assign to field of immutable variable '${name}'. Use 'let mut' for mutable bindings.`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`'${name}' is not mutable`)));
                  }
                  break __ring_match38;
                }
                if (__ring_m38._tag === "none") {
                  break __ring_match38;
                }
                __match_fail(__ring_m38);
              }
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
      break __ring_match33;
    }
    break __ring_match33;
  }
}

function find_root_expr(e) {
  __ring_match39: {
    const __ring_m39 = e;
    if (__ring_m39._tag === "FieldAccess") {
      const receiver = __ring_m39.receiver;
      return find_root_expr(receiver);
      break __ring_match39;
    }
    return e;
    break __ring_match39;
  }
}

function infer_expr(ctx, expr, subst, __ring_ev_fail) {
  __ring_match40: {
    const __ring_m40 = expr;
    if (__ring_m40._tag === "IntLit") {
      const value = __ring_m40.value; const span = __ring_m40.span;
      return new infer_ctx$InferResult(hir$HExpr_IntLit(value, types$INT, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match40;
    }
    if (__ring_m40._tag === "FloatLit") {
      const value = __ring_m40.value; const span = __ring_m40.span;
      return new infer_ctx$InferResult(hir$HExpr_FloatLit(value, types$FLOAT, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match40;
    }
    if (__ring_m40._tag === "StrLit") {
      const value = __ring_m40.value; const span = __ring_m40.span;
      return new infer_ctx$InferResult(hir$HExpr_StrLit(value, types$STR, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match40;
    }
    if (__ring_m40._tag === "BoolLit") {
      const value = __ring_m40.value; const span = __ring_m40.span;
      return new infer_ctx$InferResult(hir$HExpr_BoolLit(value, types$BOOL, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match40;
    }
    if (__ring_m40._tag === "Ident") {
      const name = __ring_m40.name; const qualifier = __ring_m40.qualifier; const span = __ring_m40.span;
      return infer_ident(ctx, name, span, subst, qualifier);
      break __ring_match40;
    }
    if (__ring_m40._tag === "BinOp") {
      const op = __ring_m40.op; const left = __ring_m40.left; const right = __ring_m40.right; const span = __ring_m40.span;
      return infer_bin_op(ctx, op, left, right, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "UnaryOp") {
      const op = __ring_m40.op; const operand = __ring_m40.operand; const span = __ring_m40.span;
      return infer_unary_op(ctx, op, operand, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "Call") {
      const callee = __ring_m40.callee; const args = __ring_m40.args; const span = __ring_m40.span;
      return infer_call(ctx, callee, args, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "MethodCall") {
      const receiver = __ring_m40.receiver; const method = __ring_m40.method; const args = __ring_m40.args; const span = __ring_m40.span;
      return infer_method_call(ctx, receiver, method, args, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "FieldAccess") {
      const receiver = __ring_m40.receiver; const field = __ring_m40.field; const span = __ring_m40.span;
      return infer_field_access(ctx, receiver, field, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "StructLit") {
      const name = __ring_m40.name; const qualifier = __ring_m40.qualifier; const fields = __ring_m40.fields; const spread = __ring_m40.spread; const span = __ring_m40.span;
      return infer_struct_lit(ctx, name, fields, spread, span, subst, qualifier, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "MatchExpr") {
      const scrutinee = __ring_m40.scrutinee; const arms = __ring_m40.arms; const span = __ring_m40.span;
      return infer_match(ctx, scrutinee, arms, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "Block") {
      return infer_block(ctx, expr, Option_some(subst), __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "IfExpr") {
      const condition = __ring_m40.condition; const then_branch = __ring_m40.then_branch; const else_branch = __ring_m40.else_branch; const span = __ring_m40.span;
      return infer_if(ctx, condition, then_branch, else_branch, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "StringInterp") {
      const parts = __ring_m40.parts; const span = __ring_m40.span;
      return infer_string_interp(ctx, parts, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "CatchExpr") {
      const catch_expr = __ring_m40.expr; const arms = __ring_m40.arms; const span = __ring_m40.span;
      return infer_catch(ctx, catch_expr, arms, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "HandleExpr") {
      const body = __ring_m40.body; const handlers = __ring_m40.handlers; const span = __ring_m40.span;
      return infer_handle(ctx, body, handlers, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "Lambda") {
      const params = __ring_m40.params; const body = __ring_m40.body; const span = __ring_m40.span;
      return infer_lambda(ctx, params, body, span, subst, Option_none, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "ListLit") {
      const elements = __ring_m40.elements; const span = __ring_m40.span;
      return infer_list_literal(ctx, elements, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    if (__ring_m40._tag === "TupleLit") {
      const elements = __ring_m40.elements; const span = __ring_m40.span;
      let s = subst;
      let helements = [];
      let combined_effects = types$EMPTY_ROW;
      for (const el of elements) {
        const r = infer_expr(ctx, el, s, __ring_ev_fail);
        s = r.subst;
        List_push(helements, r.hexpr);
        const me = infer_ctx$merge_effects(ctx.env, combined_effects, r.effects, s, __ring_ev_fail);
        combined_effects = me[0];
        s = me[1];
      }
      let elem_types = [];
      for (const he of helements) {
        List_push(elem_types, env$apply_subst(s, hir$hexpr_type(he)));
      }
      const tuple_type = types$Type_TupleType(elem_types);
      return new infer_ctx$InferResult(hir$HExpr_TupleLit(helements, tuple_type, combined_effects, span), s, combined_effects);
      break __ring_match40;
    }
    if (__ring_m40._tag === "Range") {
      const start = __ring_m40.start; const end = __ring_m40.end; const inclusive = __ring_m40.inclusive; const span = __ring_m40.span;
      const start_r = infer_expr(ctx, start, subst, __ring_ev_fail);
      let s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(start_r.hexpr), types$INT, start_r.subst, span);
      const end_r = infer_expr(ctx, end, s, __ring_ev_fail);
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(end_r.hexpr), types$INT, end_r.subst, span);
      const me = infer_ctx$merge_effects(ctx.env, start_r.effects, end_r.effects, s, __ring_ev_fail);
      let range_effects = me[0];
      s = me[1];
      const range_type = types$Type_EnumType(hir$BUILTIN_RANGE, [types$INT], []);
      return new infer_ctx$InferResult(hir$HExpr_RangeExpr(start_r.hexpr, end_r.hexpr, inclusive, range_type, range_effects, span), s, range_effects);
      break __ring_match40;
    }
    if (__ring_m40._tag === "IndexExpr") {
      const receiver = __ring_m40.receiver; const index = __ring_m40.index; const span = __ring_m40.span;
      return infer_index_expr(ctx, receiver, index, span, subst, __ring_ev_fail);
      break __ring_match40;
    }
    __match_fail(__ring_m40);
  }
}

function infer_index_expr(ctx, receiver, index, span, subst, __ring_ev_fail) {
  const recv_r = infer_expr(ctx, receiver, subst, __ring_ev_fail);
  let s = recv_r.subst;
  let combined_effects = recv_r.effects;
  const idx_r = infer_expr(ctx, index, s, __ring_ev_fail);
  s = idx_r.subst;
  const me = infer_ctx$merge_effects(ctx.env, combined_effects, idx_r.effects, s, __ring_ev_fail);
  combined_effects = me[0];
  s = me[1];
  const recv_type = env$apply_subst(s, hir$hexpr_type(recv_r.hexpr));
  const idx_type = env$apply_subst(s, hir$hexpr_type(idx_r.hexpr));
  let result_ty = types$Type_ErrorType;
  __ring_match41: {
    const __ring_m41 = recv_type;
    if (__ring_m41._tag === "StructType") {
      const name = __ring_m41.name; const type_params = __ring_m41.type_params;
      if ((name === hir$BUILTIN_LIST)) {
        s = infer_ctx$unify_at(ctx.sink, ctx.env, idx_type, types$INT, s, span);
        result_ty = ((List_len(type_params) > 0) ? Option_unwrap(List_get(type_params, 0)) : types$Type_ErrorType);
      } else {
        if ((name === hir$BUILTIN_MAP)) {
          if ((List_len(type_params) >= 2)) {
            s = infer_ctx$unify_at(ctx.sink, ctx.env, idx_type, Option_unwrap(List_get(type_params, 0)), s, span);
            result_ty = Option_unwrap(List_get(type_params, 1));
          } else {
            result_ty = types$Type_ErrorType;
          }
        } else {
          const _ = infer_ctx$type_error(ctx.sink, codes$E0306, `Type '${types$type_to_string(recv_type)}' does not support indexing`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("only List, Map, and Str support subscript operator []")));
          result_ty = types$Type_ErrorType;
        }
      }
      break __ring_match41;
    }
    if (__ring_m41._tag === "StrType") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, idx_type, types$INT, s, span);
      result_ty = types$STR;
      break __ring_match41;
    }
    if (__ring_m41._tag === "ErrorType") {
      result_ty = types$Type_ErrorType;
      break __ring_match41;
    }
    const _ = infer_ctx$type_error(ctx.sink, codes$E0306, `Type '${types$type_to_string(recv_type)}' does not support indexing`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("only List, Map, and Str support subscript operator []")));
    result_ty = types$Type_ErrorType;
    break __ring_match41;
  }
  return new infer_ctx$InferResult(hir$HExpr_IndexExpr(recv_r.hexpr, idx_r.hexpr, result_ty, combined_effects, span), s, combined_effects);
}

function infer_ident(ctx, name, span, subst, qualifier) {
  let resolved_qualifier = qualifier;
  __ring_match42: {
    const __ring_m42 = qualifier;
    if (__ring_m42._tag === "some") {
      const q = __ring_m42._0;
      if (((q === "self") || Str_starts_with(q, "super"))) {
        __ring_match43: {
          const __ring_m43 = infer_ctx$resolve_relative_qualifier(q, ctx.mod_path_stack);
          if (__ring_m43._tag === "some") {
            const prefix = __ring_m43._0;
            if ((prefix === "")) {
              resolved_qualifier = Option_none;
            } else {
              resolved_qualifier = Option_some(prefix);
            }
            break __ring_match43;
          }
          if (__ring_m43._tag === "none") {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0705, `Cannot use '${q}' — relative path exceeds module nesting depth`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("relative path out of scope")));
            return new infer_ctx$InferResult(hir$HExpr_Ident(name, Option_none, Option_none, Option_none, types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
            break __ring_match43;
          }
          __match_fail(__ring_m43);
        }
      }
      break __ring_match42;
    }
    if (__ring_m42._tag === "none") {
      break __ring_match42;
    }
    __match_fail(__ring_m42);
  }
  __ring_match44: {
    const __ring_m44 = resolved_qualifier;
    if (__ring_m44._tag === "some") {
      const q = __ring_m44._0;
      const qualified_name = `${q}::${name}`;
      const mod_scheme = env$TypeEnv_lookup(ctx.env, qualified_name);
      __ring_match45: {
        const __ring_m45 = mod_scheme;
        if (__ring_m45._tag === "some") {
          const ms = __ring_m45._0;
          const t = env$TypeEnv_instantiate(ctx.env, ms);
          return new infer_ctx$InferResult(hir$HExpr_Ident(qualified_name, Option_none, ms.def_id, Option_none, t, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
          break __ring_match45;
        }
        if (__ring_m45._tag === "none") {
          break __ring_match45;
        }
        __match_fail(__ring_m45);
      }
      break __ring_match44;
    }
    if (__ring_m44._tag === "none") {
      break __ring_match44;
    }
    __match_fail(__ring_m44);
  }
  const scheme = env$TypeEnv_lookup(ctx.env, name);
  __ring_match46: {
    const __ring_m46 = scheme;
    if (__ring_m46._tag === "none") {
      __ring_match47: {
        const __ring_m47 = resolved_qualifier;
        if (__ring_m47._tag === "some") {
          const q = __ring_m47._0;
          const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `'${q}' has no member '${name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(name, Option_none));
          return new infer_ctx$InferResult(hir$HExpr_Ident(name, Option_none, Option_none, Option_none, types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
          break __ring_match47;
        }
        if (__ring_m47._tag === "none") {
          break __ring_match47;
        }
        __match_fail(__ring_m47);
      }
      const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `Undefined variable: ${name}`, span, diagnostics$DiagnosticContext_UndefinedVariable(name, Option_none));
      return new infer_ctx$InferResult(hir$HExpr_Ident(name, Option_none, Option_none, Option_none, types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match46;
    }
    if (__ring_m46._tag === "some") {
      const s = __ring_m46._0;
      const t = env$TypeEnv_instantiate(ctx.env, s);
      let resolved_name = Option_none;
      let enum_name = Option_none;
      const actual_name = (function() {
  const __ring_m = _Map_get(ctx.use_aliases, name);
  if (__ring_m._tag === "some") { const qualified = __ring_m._0; return qualified; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
      __ring_match48: {
        const __ring_m48 = resolved_qualifier;
        if (__ring_m48._tag === "some") {
          const q = __ring_m48._0;
          __ring_match49: {
            const __ring_m49 = _Map_get(ctx.env.types.enums, q);
            if (__ring_m49._tag === "some") {
              const enum_def = __ring_m49._0;
              if (enum_def.variants.some((function(v) { return (v.name === name); }))) {
                enum_name = Option_some(enum_def.name);
              } else {
                const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `'${q}' has no variant '${name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(name, Option_none));
              }
              break __ring_match49;
            }
            if (__ring_m49._tag === "none") {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `'${q}' has no variant '${name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(name, Option_none));
              break __ring_match49;
            }
            __match_fail(__ring_m49);
          }
          break __ring_match48;
        }
        if (__ring_m48._tag === "none") {
          enum_name = _Map_get(ctx.env.types.variant_to_enum, name);
          break __ring_match48;
        }
        __match_fail(__ring_m48);
      }
      __ring_match50: {
        const __ring_m50 = enum_name;
        if (__ring_m50._tag === "some") {
          const en = __ring_m50._0;
          resolved_name = Option_some(hir$variant_js_name(en, name));
          break __ring_match50;
        }
        if (__ring_m50._tag === "none") {
          break __ring_match50;
        }
        __match_fail(__ring_m50);
      }
      return new infer_ctx$InferResult(hir$HExpr_Ident(actual_name, resolved_name, s.def_id, Option_none, t, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match46;
    }
    __match_fail(__ring_m46);
  }
}

function infer_bin_op(ctx, op, left, right, span, subst, __ring_ev_fail) {
  const lr = infer_expr(ctx, left, subst, __ring_ev_fail);
  const rr = infer_expr(ctx, right, lr.subst, __ring_ev_fail);
  let s = rr.subst;
  let result_type = types$UNIT;
  let eq_dispatch = Option_none;
  let ord_dispatch = Option_none;
  __ring_match51: {
    const __ring_m51 = op;
    if (__ring_m51._tag === "Add") {
      result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "+");
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      break __ring_match51;
    }
    if (__ring_m51._tag === "Sub") {
      result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "-");
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      break __ring_match51;
    }
    if (__ring_m51._tag === "Mul") {
      result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "*");
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      break __ring_match51;
    }
    if (__ring_m51._tag === "Div") {
      result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "/");
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      break __ring_match51;
    }
    if (__ring_m51._tag === "Mod") {
      result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "%");
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      break __ring_match51;
    }
    if (__ring_m51._tag === "Eq") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      result_type = types$BOOL;
      const resolved = env$apply_subst(s, hir$hexpr_type(lr.hexpr));
      const is_builtin = (is_primitive_eq(resolved) || is_tuple_type(resolved));
      eq_dispatch = Option_some(resolve_trait_dispatch(ctx, resolved, "Eq", codes$E0307, s, span, "==", is_builtin));
      break __ring_match51;
    }
    if (__ring_m51._tag === "Neq") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      result_type = types$BOOL;
      const resolved = env$apply_subst(s, hir$hexpr_type(lr.hexpr));
      const is_builtin = (is_primitive_eq(resolved) || is_tuple_type(resolved));
      eq_dispatch = Option_some(resolve_trait_dispatch(ctx, resolved, "Eq", codes$E0307, s, span, "!=", is_builtin));
      break __ring_match51;
    }
    if (__ring_m51._tag === "Lt") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      result_type = types$BOOL;
      const resolved = env$apply_subst(s, hir$hexpr_type(lr.hexpr));
      ord_dispatch = Option_some(resolve_trait_dispatch(ctx, resolved, "Ord", codes$E0308, s, span, "<", is_primitive_ord(resolved)));
      break __ring_match51;
    }
    if (__ring_m51._tag === "Lte") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      result_type = types$BOOL;
      const resolved = env$apply_subst(s, hir$hexpr_type(lr.hexpr));
      ord_dispatch = Option_some(resolve_trait_dispatch(ctx, resolved, "Ord", codes$E0308, s, span, "<=", is_primitive_ord(resolved)));
      break __ring_match51;
    }
    if (__ring_m51._tag === "Gt") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      result_type = types$BOOL;
      const resolved = env$apply_subst(s, hir$hexpr_type(lr.hexpr));
      ord_dispatch = Option_some(resolve_trait_dispatch(ctx, resolved, "Ord", codes$E0308, s, span, ">", is_primitive_ord(resolved)));
      break __ring_match51;
    }
    if (__ring_m51._tag === "Gte") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      result_type = types$BOOL;
      const resolved = env$apply_subst(s, hir$hexpr_type(lr.hexpr));
      ord_dispatch = Option_some(resolve_trait_dispatch(ctx, resolved, "Ord", codes$E0308, s, span, ">=", is_primitive_ord(resolved)));
      break __ring_match51;
    }
    if (__ring_m51._tag === "And") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), types$BOOL, s, span);
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(rr.hexpr), types$BOOL, s, span);
      result_type = types$BOOL;
      break __ring_match51;
    }
    if (__ring_m51._tag === "Or") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), types$BOOL, s, span);
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(rr.hexpr), types$BOOL, s, span);
      result_type = types$BOOL;
      break __ring_match51;
    }
    __match_fail(__ring_m51);
  }
  const me = infer_ctx$merge_effects(ctx.env, lr.effects, rr.effects, s, __ring_ev_fail);
  let effects = me[0];
  s = me[1];
  return new infer_ctx$InferResult(hir$HExpr_BinOp(op, lr.hexpr, rr.hexpr, eq_dispatch, ord_dispatch, result_type, effects, span), s, effects);
}

function infer_numeric_op(ctx, left, right, s, span, op_str) {
  const resolved = env$apply_subst(s, hir$hexpr_type(left));
  __ring_match52: {
    const __ring_m52 = resolved;
    if (__ring_m52._tag === "TypeVar") {
      const _ = infer_ctx$unify_at(ctx.sink, ctx.env, resolved, types$INT, s, span);
      return types$INT;
      break __ring_match52;
    }
    if (__ring_m52._tag === "IntType") {
      return types$INT;
      break __ring_match52;
    }
    if (__ring_m52._tag === "FloatType") {
      return types$FLOAT;
      break __ring_match52;
    }
    return infer_ctx$type_error(ctx.sink, codes$E0303, `Operator ${op_str} requires numeric types, got ${types$type_to_string(resolved)}`, span, diagnostics$DiagnosticContext_TypeMismatch("Int or Float", types$type_to_string(resolved), Option_none));
    break __ring_match52;
  }
}

function is_primitive_eq(t) {
  __ring_match53: {
    const __ring_m53 = t;
    if (__ring_m53._tag === "IntType") {
      return true;
      break __ring_match53;
    }
    if (__ring_m53._tag === "FloatType") {
      return true;
      break __ring_match53;
    }
    if (__ring_m53._tag === "StrType") {
      return true;
      break __ring_match53;
    }
    if (__ring_m53._tag === "BoolType") {
      return true;
      break __ring_match53;
    }
    if (__ring_m53._tag === "UnitType") {
      return true;
      break __ring_match53;
    }
    if (__ring_m53._tag === "NeverType") {
      return true;
      break __ring_match53;
    }
    if (__ring_m53._tag === "AnyType") {
      return true;
      break __ring_match53;
    }
    return false;
    break __ring_match53;
  }
}

function is_primitive_ord(t) {
  __ring_match54: {
    const __ring_m54 = t;
    if (__ring_m54._tag === "IntType") {
      return true;
      break __ring_match54;
    }
    if (__ring_m54._tag === "FloatType") {
      return true;
      break __ring_match54;
    }
    if (__ring_m54._tag === "StrType") {
      return true;
      break __ring_match54;
    }
    if (__ring_m54._tag === "BoolType") {
      return true;
      break __ring_match54;
    }
    return false;
    break __ring_match54;
  }
}

function is_tuple_type(t) {
  __ring_match55: {
    const __ring_m55 = t;
    if (__ring_m55._tag === "TupleType") {
      return true;
      break __ring_match55;
    }
    return false;
    break __ring_match55;
  }
}

function resolve_trait_dispatch(ctx, resolved, trait_name, error_code, subst, span, op, is_builtin) {
  if (is_builtin) {
    return hir$TraitDispatch_Builtin;
  }
  __ring_match56: {
    const __ring_m56 = resolved;
    if (__ring_m56._tag === "TypeVar") {
      const id = __ring_m56.id;
      const bound = ((__a) => { const __i = __a.findIndex((function(fb) { return ((fb.trait_name !== trait_name) ? false : ((fb.type_param_var_id === id) ? true : ((union_find$uf_find(subst, fb.type_param_var_id) === id) ? true : (function() {
  const bound_resolved = env$apply_subst(subst, types$Type_TypeVar(fb.type_param_var_id, Option_none));
  __ring_match57: {
    const __ring_m57 = bound_resolved;
    if (__ring_m57._tag === "TypeVar") {
      const bid = __ring_m57.id;
      return (bid === id);
      break __ring_match57;
    }
    return false;
    break __ring_match57;
  }
})()))); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(ctx.current_fn_bounds);
      __ring_match58: {
        const __ring_m58 = bound;
        if (__ring_m58._tag === "some") {
          const b = __ring_m58._0;
          return hir$TraitDispatch_Dict(hir$trait_bound_param_name(b.type_param_name, trait_name));
          break __ring_match58;
        }
        if (__ring_m58._tag === "none") {
          break __ring_match58;
        }
        __match_fail(__ring_m58);
      }
      __ring_match59: {
        const __ring_m59 = _Map_get(ctx.env.scope.var_bounds, id);
        if (__ring_m59._tag === "some") {
          const var_bounds = __ring_m59._0;
          if (_Set_contains(var_bounds, trait_name, __Str_Eq)) {
            return hir$TraitDispatch_Builtin;
          }
          break __ring_match59;
        }
        if (__ring_m59._tag === "none") {
          break __ring_match59;
        }
        __match_fail(__ring_m59);
      }
      const _ = infer_ctx$type_error(ctx.sink, error_code, `Type does not implement ${trait_name}, cannot use '${op}'`, span, diagnostics$DiagnosticContext_TraitError(`type does not implement ${trait_name}`));
      return hir$TraitDispatch_Builtin;
      break __ring_match56;
    }
    if (__ring_m56._tag === "StructType") {
      const name = __ring_m56.name; const type_params = __ring_m56.type_params;
      if (ctx.env.trait_reg.trait_impls.some((function(i) { return ((i.target_type_name === name) && (i.trait_name === trait_name)); }))) {
        const extra_dicts = resolve_trait_extra_dicts(ctx, type_params, subst, trait_name);
        return hir$TraitDispatch_Direct(hir$trait_dict_name(name, trait_name), (function() {
  const __ring_m = extra_dicts;
  if (__ring_m._tag === "some") { const d = __ring_m._0; return d; }
  if (__ring_m._tag === "none") { return []; }
  __match_fail(__ring_m);
})());
      }
      const _ = infer_ctx$type_error(ctx.sink, error_code, `Type '${types$type_to_string(resolved)}' does not implement ${trait_name}, cannot use '${op}'`, span, diagnostics$DiagnosticContext_TraitError(`type '${types$type_to_string(resolved)}' does not implement ${trait_name}`));
      return hir$TraitDispatch_Builtin;
      break __ring_match56;
    }
    if (__ring_m56._tag === "EnumType") {
      const name = __ring_m56.name; const type_params = __ring_m56.type_params;
      if (ctx.env.trait_reg.trait_impls.some((function(i) { return ((i.target_type_name === name) && (i.trait_name === trait_name)); }))) {
        const extra_dicts = resolve_trait_extra_dicts(ctx, type_params, subst, trait_name);
        return hir$TraitDispatch_Direct(hir$trait_dict_name(name, trait_name), (function() {
  const __ring_m = extra_dicts;
  if (__ring_m._tag === "some") { const d = __ring_m._0; return d; }
  if (__ring_m._tag === "none") { return []; }
  __match_fail(__ring_m);
})());
      }
      const _ = infer_ctx$type_error(ctx.sink, error_code, `Type '${types$type_to_string(resolved)}' does not implement ${trait_name}, cannot use '${op}'`, span, diagnostics$DiagnosticContext_TraitError(`type '${types$type_to_string(resolved)}' does not implement ${trait_name}`));
      return hir$TraitDispatch_Builtin;
      break __ring_match56;
    }
    const _ = infer_ctx$type_error(ctx.sink, error_code, `Type '${types$type_to_string(resolved)}' does not implement ${trait_name}, cannot use '${op}'`, span, diagnostics$DiagnosticContext_TraitError(`type '${types$type_to_string(resolved)}' does not implement ${trait_name}`));
    return hir$TraitDispatch_Builtin;
    break __ring_match56;
  }
}

function resolve_trait_extra_dicts(ctx, type_args, subst, trait_name) {
  if ((List_len(type_args) === 0)) {
    return Option_none;
  }
  let dicts = [];
  for (const arg of type_args) {
    const resolved = env$apply_subst(subst, arg);
    const dict = resolve_type_to_trait_dict(ctx, resolved, trait_name);
    __ring_match60: {
      const __ring_m60 = dict;
      if (__ring_m60._tag === "some") {
        const d = __ring_m60._0;
        List_push(dicts, d);
        break __ring_match60;
      }
      if (__ring_m60._tag === "none") {
        return Option_none;
        break __ring_match60;
      }
      __match_fail(__ring_m60);
    }
  }
  return Option_some(dicts);
}

function resolve_type_to_trait_dict(ctx, t, trait_name) {
  __ring_match61: {
    const __ring_m61 = types$type_to_builtin_name(t);
    if (__ring_m61._tag === "some") {
      const builtin_name = __ring_m61._0;
      __ring_match62: {
        const __ring_m62 = t;
        if (__ring_m62._tag === "StructType") {
          break __ring_match62;
        }
        if (__ring_m62._tag === "EnumType") {
          break __ring_match62;
        }
        return Option_some(hir$trait_dict_name(builtin_name, trait_name));
        break __ring_match62;
      }
      break __ring_match61;
    }
    if (__ring_m61._tag === "none") {
      break __ring_match61;
    }
    __match_fail(__ring_m61);
  }
  __ring_match63: {
    const __ring_m63 = t;
    if (__ring_m63._tag === "TypeVar") {
      const id = __ring_m63.id;
      const bound = ((__a) => { const __i = __a.findIndex((function(fb) { return ((fb.type_param_var_id === id) && (fb.trait_name === trait_name)); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(ctx.current_fn_bounds);
      __ring_match64: {
        const __ring_m64 = bound;
        if (__ring_m64._tag === "some") {
          const b = __ring_m64._0;
          return Option_some(hir$trait_bound_param_name(b.type_param_name, trait_name));
          break __ring_match64;
        }
        if (__ring_m64._tag === "none") {
          return Option_none;
          break __ring_match64;
        }
        __match_fail(__ring_m64);
      }
      break __ring_match63;
    }
    if (__ring_m63._tag === "StructType") {
      const name = __ring_m63.name;
      if (ctx.env.trait_reg.trait_impls.some((function(i) { return ((i.target_type_name === name) && (i.trait_name === trait_name)); }))) {
        return Option_some(hir$trait_dict_name(name, trait_name));
      } else {
        return Option_none;
      }
      break __ring_match63;
    }
    if (__ring_m63._tag === "EnumType") {
      const name = __ring_m63.name;
      if (ctx.env.trait_reg.trait_impls.some((function(i) { return ((i.target_type_name === name) && (i.trait_name === trait_name)); }))) {
        return Option_some(hir$trait_dict_name(name, trait_name));
      } else {
        return Option_none;
      }
      break __ring_match63;
    }
    return Option_none;
    break __ring_match63;
  }
}

function infer_unary_op(ctx, op, operand, span, subst, __ring_ev_fail) {
  const r = infer_expr(ctx, operand, subst, __ring_ev_fail);
  let s = r.subst;
  let result_type = types$UNIT;
  __ring_match65: {
    const __ring_m65 = op;
    if (__ring_m65._tag === "Neg") {
      const resolved = env$apply_subst(s, hir$hexpr_type(r.hexpr));
      __ring_match66: {
        const __ring_m66 = resolved;
        if (__ring_m66._tag === "TypeVar") {
          s = infer_ctx$unify_at(ctx.sink, ctx.env, resolved, types$INT, s, span);
          result_type = types$INT;
          break __ring_match66;
        }
        if (__ring_m66._tag === "IntType") {
          result_type = types$INT;
          break __ring_match66;
        }
        if (__ring_m66._tag === "FloatType") {
          result_type = types$FLOAT;
          break __ring_match66;
        }
        const _ = infer_ctx$type_error(ctx.sink, codes$E0303, `Unary - requires numeric type, got ${types$type_to_string(resolved)}`, span, diagnostics$DiagnosticContext_TypeMismatch("Int or Float", types$type_to_string(resolved), Option_none));
        break __ring_match66;
      }
      break __ring_match65;
    }
    if (__ring_m65._tag === "Not") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(r.hexpr), types$BOOL, s, span);
      result_type = types$BOOL;
      break __ring_match65;
    }
    __match_fail(__ring_m65);
  }
  return new infer_ctx$InferResult(hir$HExpr_UnaryOp(op, r.hexpr, result_type, r.effects, span), s, r.effects);
}

function infer_call(ctx, callee, args, span, subst, __ring_ev_fail) {
  const callee_r = infer_expr(ctx, callee, subst, __ring_ev_fail);
  let s = callee_r.subst;
  let effects = callee_r.effects;
  const callee_fn_type = (function() {
  const __ring_m = env$apply_subst(s, hir$hexpr_type(callee_r.hexpr));
  if (__ring_m._tag === "FnType") { return Option_some(env$apply_subst(s, hir$hexpr_type(callee_r.hexpr))); }
  return Option_none;
})();
  let hargs = [];
  let arg_types = [];
  let ai = 0;
  for (const arg of args) {
    let ar = (function() {
  const __ring_m = arg;
  if (__ring_m._tag === "Lambda") { const lparams = __ring_m.params; const lbody = __ring_m.body; const lspan = __ring_m.span; return (function() {
  const __ring_m = callee_fn_type;
  if (__ring_m._tag === "some") { const cft = __ring_m._0; return (function() {
  const __ring_m = cft;
  if (__ring_m._tag === "FnType") { const cft_params = __ring_m.params; return ((ai < List_len(cft_params)) ? (function() {
  const __ring_m = List_get(cft_params, ai);
  if (__ring_m._tag === "some") { const expected_raw = __ring_m._0; return (function() {
  const expected = env$apply_subst(s, expected_raw);
  __ring_match67: {
    const __ring_m67 = expected;
    if (__ring_m67._tag === "FnType") {
      const exp_params = __ring_m67.params;
      return infer_lambda(ctx, lparams, lbody, lspan, s, Option_some(exp_params), __ring_ev_fail);
      break __ring_match67;
    }
    return infer_expr(ctx, arg, s, __ring_ev_fail);
    break __ring_match67;
  }
})(); }
  if (__ring_m._tag === "none") { return infer_expr(ctx, arg, s, __ring_ev_fail); }
  __match_fail(__ring_m);
})() : infer_expr(ctx, arg, s, __ring_ev_fail)); }
  return infer_expr(ctx, arg, s, __ring_ev_fail);
})(); }
  if (__ring_m._tag === "none") { return infer_expr(ctx, arg, s, __ring_ev_fail); }
  __match_fail(__ring_m);
})(); }
  return infer_expr(ctx, arg, s, __ring_ev_fail);
})();
    s = ar.subst;
    const me = infer_ctx$merge_effects(ctx.env, effects, ar.effects, s, __ring_ev_fail);
    effects = me[0];
    s = me[1];
    List_push(hargs, ar.hexpr);
    List_push(arg_types, hir$hexpr_type(ar.hexpr));
    ai = (ai + 1);
  }
  const ret_var = env$TypeEnv_fresh_var(ctx.env);
  const effect_tail = env$TypeEnv_fresh_var_id(ctx.env);
  const expected_fn = types$Type_FnType(arg_types, ret_var, new types$EffectRow([], Option_some(effect_tail)));
  s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(callee_r.hexpr), expected_fn, s, span);
  const resolved_callee_type = env$apply_subst(s, hir$hexpr_type(callee_r.hexpr));
  __ring_match68: {
    const __ring_m68 = resolved_callee_type;
    if (__ring_m68._tag === "FnType") {
      const fn_effects = __ring_m68.effects;
      const me = infer_ctx$merge_effects(ctx.env, effects, fn_effects, s, __ring_ev_fail);
      effects = me[0];
      s = me[1];
      break __ring_match68;
    }
    break __ring_match68;
  }
  const result_type = env$apply_subst(s, ret_var);
  let resolved_dicts = [];
  __ring_match69: {
    const __ring_m69 = callee;
    if (__ring_m69._tag === "Ident") {
      const callee_name = __ring_m69.name;
      __ring_match70: {
        const __ring_m70 = env$TypeEnv_lookup(ctx.env, callee_name);
        if (__ring_m70._tag === "some") {
          const callee_scheme = __ring_m70._0;
          if ((List_len(callee_scheme.bounds) > 0)) {
            resolved_dicts = infer_ctx$resolve_dicts_from_scheme(ctx.sink, ctx.env, ctx.current_fn_bounds, callee_scheme, hir$hexpr_type(callee_r.hexpr), s, span);
          }
          break __ring_match70;
        }
        if (__ring_m70._tag === "none") {
          break __ring_match70;
        }
        __match_fail(__ring_m70);
      }
      break __ring_match69;
    }
    break __ring_match69;
  }
  let final_hargs = [];
  for (const harg of hargs) {
    List_push(final_hargs, resolve_arg_dict_closure(ctx, harg, s));
  }
  return new infer_ctx$InferResult(hir$HExpr_Call(callee_r.hexpr, final_hargs, [], resolved_dicts, Option_none, result_type, effects, span), s, effects);
}

function resolve_arg_dict_closure(ctx, harg, s) {
  __ring_match71: {
    const __ring_m71 = harg;
    if (__ring_m71._tag === "Ident") {
      const name = __ring_m71.name; const resolved_name = __ring_m71.resolved_name; const def_id = __ring_m71.def_id; const ty = __ring_m71.ty; const effects = __ring_m71.effects; const span = __ring_m71.span;
      const arg_scheme = env$TypeEnv_lookup(ctx.env, name);
      __ring_match72: {
        const __ring_m72 = arg_scheme;
        if (__ring_m72._tag === "some") {
          const as_ = __ring_m72._0;
          if ((List_len(as_.bounds) === 0)) {
            return harg;
          }
          const var_map = infer_ctx$build_scheme_var_map(as_, ty);
          let dicts = [];
          for (const bound of as_.bounds) {
            __ring_match73: {
              const __ring_m73 = _Map_get(var_map, bound.type_var);
              if (__ring_m73._tag === "some") {
                const fresh_var = __ring_m73._0;
                const concrete = env$apply_subst(s, fresh_var);
                resolve_arg_bound_dict(ctx, concrete, bound.trait_name, dicts);
                break __ring_match73;
              }
              if (__ring_m73._tag === "none") {
                break __ring_match73;
              }
              __match_fail(__ring_m73);
            }
          }
          if ((List_len(dicts) > 0)) {
            return hir$HExpr_Ident(name, resolved_name, def_id, Option_some(dicts), ty, effects, span);
          } else {
            return harg;
          }
          break __ring_match72;
        }
        if (__ring_m72._tag === "none") {
          return harg;
          break __ring_match72;
        }
        __match_fail(__ring_m72);
      }
      break __ring_match71;
    }
    return harg;
    break __ring_match71;
  }
}

function resolve_arg_bound_dict(ctx, concrete, trait_name, dicts) {
  __ring_match74: {
    const __ring_m74 = concrete;
    if (__ring_m74._tag === "StructType") {
      const name = __ring_m74.name;
      if (ctx.env.trait_reg.trait_impls.some((function(impl_) { return ((impl_.target_type_name === name) && (impl_.trait_name === trait_name)); }))) {
        return List_push(dicts, hir$trait_dict_name(name, trait_name));
      }
      break __ring_match74;
    }
    if (__ring_m74._tag === "EnumType") {
      const name = __ring_m74.name;
      if (ctx.env.trait_reg.trait_impls.some((function(impl_) { return ((impl_.target_type_name === name) && (impl_.trait_name === trait_name)); }))) {
        return List_push(dicts, hir$trait_dict_name(name, trait_name));
      }
      break __ring_match74;
    }
    if (__ring_m74._tag === "TypeVar") {
      const id = __ring_m74.id;
      const matching = ((__a) => { const __i = __a.findIndex((function(fb) { return ((fb.type_param_var_id === id) && (fb.trait_name === trait_name)); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(ctx.current_fn_bounds);
      __ring_match75: {
        const __ring_m75 = matching;
        if (__ring_m75._tag === "some") {
          const fb = __ring_m75._0;
          return List_push(dicts, hir$trait_bound_param_name(fb.type_param_name, fb.trait_name));
          break __ring_match75;
        }
        if (__ring_m75._tag === "none") {
          break __ring_match75;
        }
        __match_fail(__ring_m75);
      }
      break __ring_match74;
    }
    __ring_match76: {
      const __ring_m76 = types$type_to_builtin_name(concrete);
      if (__ring_m76._tag === "some") {
        const prim_name = __ring_m76._0;
        if (ctx.env.trait_reg.trait_impls.some((function(impl_) { return ((impl_.target_type_name === prim_name) && (impl_.trait_name === trait_name)); }))) {
          return List_push(dicts, hir$trait_dict_name(prim_name, trait_name));
        }
        break __ring_match76;
      }
      if (__ring_m76._tag === "none") {
        break __ring_match76;
      }
      __match_fail(__ring_m76);
    }
    break __ring_match74;
  }
}

function check_expr_is_let_def(ctx, expr) {
  __ring_match77: {
    const __ring_m77 = expr;
    if (__ring_m77._tag === "Ident") {
      const name = __ring_m77.name;
      __ring_match78: {
        const __ring_m78 = env$TypeEnv_lookup(ctx.env, name);
        if (__ring_m78._tag === "some") {
          const s = __ring_m78._0;
          __ring_match79: {
            const __ring_m79 = s.def_id;
            if (__ring_m79._tag === "some") {
              const did = __ring_m79._0;
              return _Set_contains(ctx.env.scope.let_defs, did, __Int_Eq);
              break __ring_match79;
            }
            if (__ring_m79._tag === "none") {
              return false;
              break __ring_match79;
            }
            __match_fail(__ring_m79);
          }
          break __ring_match78;
        }
        if (__ring_m78._tag === "none") {
          return false;
          break __ring_match78;
        }
        __match_fail(__ring_m78);
      }
      break __ring_match77;
    }
    if (__ring_m77._tag === "FieldAccess") {
      const inner = __ring_m77.receiver;
      return check_expr_is_let_def(ctx, inner);
      break __ring_match77;
    }
    return false;
    break __ring_match77;
  }
}

function check_receiver_mutability(ctx, receiver, recv_type, method, span) {
  let type_name = Option_none;
  __ring_match80: {
    const __ring_m80 = recv_type;
    if (__ring_m80._tag === "StructType") {
      const name = __ring_m80.name;
      type_name = Option_some(name);
      break __ring_match80;
    }
    if (__ring_m80._tag === "EnumType") {
      const name = __ring_m80.name;
      type_name = Option_some(name);
      break __ring_match80;
    }
    __ring_match81: {
      const __ring_m81 = types$type_to_builtin_name(recv_type);
      if (__ring_m81._tag === "some") {
        const n = __ring_m81._0;
        type_name = Option_some(n);
        break __ring_match81;
      }
      if (__ring_m81._tag === "none") {
        break __ring_match81;
      }
      __match_fail(__ring_m81);
    }
    break __ring_match80;
  }
  __ring_match82: {
    const __ring_m82 = type_name;
    if (__ring_m82._tag === "some") {
      const tname = __ring_m82._0;
      __ring_match83: {
        const __ring_m83 = _Map_get(ctx.env.trait_reg.mut_methods, tname);
        if (__ring_m83._tag === "some") {
          const mut_set = __ring_m83._0;
          if (_Set_contains(mut_set, method, __Str_Eq)) {
            const is_let_def = check_expr_is_let_def(ctx, receiver);
            if (is_let_def) {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0208, `Cannot call mutating method '${method}' on immutable binding. Use 'let mut' to make it mutable.`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`'${method}' requires a mutable receiver`)));
            }
          }
          break __ring_match83;
        }
        if (__ring_m83._tag === "none") {
          break __ring_match83;
        }
        __match_fail(__ring_m83);
      }
      break __ring_match82;
    }
    if (__ring_m82._tag === "none") {
      break __ring_match82;
    }
    __match_fail(__ring_m82);
  }
}

function infer_method_call(ctx, receiver, method, args, span, subst, __ring_ev_fail) {
  __ring_match84: {
    const __ring_m84 = receiver;
    if (__ring_m84._tag === "Ident") {
      const recv_name = __ring_m84.name;
      __ring_match85: {
        const __ring_m85 = _Map_get(ctx.env.types.effects, recv_name);
        if (__ring_m85._tag === "some") {
          return infer_effect_op(ctx, recv_name, method, args, span, subst, __ring_ev_fail);
          break __ring_match85;
        }
        if (__ring_m85._tag === "none") {
          break __ring_match85;
        }
        __match_fail(__ring_m85);
      }
      break __ring_match84;
    }
    break __ring_match84;
  }
  const recv_r = infer_expr(ctx, receiver, subst, __ring_ev_fail);
  let s = recv_r.subst;
  let effects = recv_r.effects;
  const recv_type = env$apply_subst(s, hir$hexpr_type(recv_r.hexpr));
  check_receiver_mutability(ctx, receiver, recv_type, method, span);
  let method_type = Option_none;
  let method_scheme = Option_none;
  __ring_match86: {
    const __ring_m86 = recv_type;
    if (__ring_m86._tag === "StructType") {
      const name = __ring_m86.name;
      const r = lookup_impl_method(ctx, name, method);
      method_type = r.method_type;
      method_scheme = r.method_scheme;
      break __ring_match86;
    }
    if (__ring_m86._tag === "EnumType") {
      const name = __ring_m86.name;
      const r = lookup_impl_method(ctx, name, method);
      method_type = r.method_type;
      method_scheme = r.method_scheme;
      break __ring_match86;
    }
    break __ring_match86;
  }
  if (Option_is_none(method_type)) {
    __ring_match87: {
      const __ring_m87 = types$type_to_builtin_name(recv_type);
      if (__ring_m87._tag === "some") {
        const prim_name = __ring_m87._0;
        const r = lookup_impl_method(ctx, prim_name, method);
        method_type = r.method_type;
        method_scheme = r.method_scheme;
        break __ring_match87;
      }
      if (__ring_m87._tag === "none") {
        break __ring_match87;
      }
      __match_fail(__ring_m87);
    }
  }
  if (Option_is_none(method_type)) {
    __ring_match88: {
      const __ring_m88 = types$type_to_builtin_name(recv_type);
      if (__ring_m88._tag === "some") {
        const type_name = __ring_m88._0;
        method_type = lookup_trait_method(ctx, type_name, method, span);
        break __ring_match88;
      }
      if (__ring_m88._tag === "none") {
        break __ring_match88;
      }
      __match_fail(__ring_m88);
    }
  }
  let dict_dispatch = Option_none;
  const recv_raw_type = hir$hexpr_type(recv_r.hexpr);
  const recv_var_id = (function() {
  const __ring_m = recv_raw_type;
  if (__ring_m._tag === "TypeVar") { const id = __ring_m.id; return Option_some(resolve_var_id(id, s)); }
  return Option_none;
})();
  if (Option_is_none(method_type)) {
    __ring_match89: {
      const __ring_m89 = recv_var_id;
      if (__ring_m89._tag === "some") {
        const rvid = __ring_m89._0;
        for (const fb of ctx.current_fn_bounds) {
          if ((resolve_var_id(fb.type_param_var_id, s) === rvid)) {
            __ring_match90: {
              const __ring_m90 = _Map_get(ctx.env.trait_reg.traits, fb.trait_name);
              if (__ring_m90._tag === "some") {
                const trait_def = __ring_m90._0;
                const tm = ((__a) => { const __i = __a.findIndex((function(m) { return (m.name === method); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(trait_def.methods);
                __ring_match91: {
                  const __ring_m91 = tm;
                  if (__ring_m91._tag === "some") {
                    const found_method = __ring_m91._0;
                    method_type = Option_some(env$TypeEnv_instantiate(ctx.env, new env$TypeScheme(found_method.ty, trait_def.type_param_vars, [], Option_none)));
                    dict_dispatch = Option_some(new hir$DictDispatchInfo(hir$trait_bound_param_name(fb.type_param_name, fb.trait_name), method));
                    break __ring_match91;
                  }
                  if (__ring_m91._tag === "none") {
                    break __ring_match91;
                  }
                  __match_fail(__ring_m91);
                }
                break __ring_match90;
              }
              if (__ring_m90._tag === "none") {
                break __ring_match90;
              }
              __match_fail(__ring_m90);
            }
          }
        }
        break __ring_match89;
      }
      if (__ring_m89._tag === "none") {
        break __ring_match89;
      }
      __match_fail(__ring_m89);
    }
  }
  __ring_match92: {
    const __ring_m92 = method_type;
    if (__ring_m92._tag === "some") {
      const mt = __ring_m92._0;
      __ring_match93: {
        const __ring_m93 = mt;
        if (__ring_m93._tag === "FnType") {
          const mt_params = __ring_m93.params;
          if ((List_len(mt_params) > 0)) {
            __ring_match94: {
              const __ring_m94 = List_first(mt_params);
              if (__ring_m94._tag === "some") {
                const first_param = __ring_m94._0;
                s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(recv_r.hexpr), first_param, s, span);
                break __ring_match94;
              }
              if (__ring_m94._tag === "none") {
                break __ring_match94;
              }
              __match_fail(__ring_m94);
            }
          }
          break __ring_match93;
        }
        break __ring_match93;
      }
      break __ring_match92;
    }
    if (__ring_m92._tag === "none") {
      break __ring_match92;
    }
    __match_fail(__ring_m92);
  }
  let hargs = [];
  let ai = 0;
  for (const arg of args) {
    let ar = (function() {
  const __ring_m = arg;
  if (__ring_m._tag === "Lambda") { const lparams = __ring_m.params; const lbody = __ring_m.body; const lspan = __ring_m.span; return (function() {
  const __ring_m = method_type;
  if (__ring_m._tag === "some") { const mt = __ring_m._0; return (function() {
  const __ring_m = mt;
  if (__ring_m._tag === "FnType") { const mt_params = __ring_m.params; return (((ai + 1) < List_len(mt_params)) ? (function() {
  const __ring_m = List_get(mt_params, (ai + 1));
  if (__ring_m._tag === "some") { const expected_raw = __ring_m._0; return (function() {
  const expected = env$apply_subst(s, expected_raw);
  __ring_match95: {
    const __ring_m95 = expected;
    if (__ring_m95._tag === "FnType") {
      const exp_params = __ring_m95.params;
      return infer_lambda(ctx, lparams, lbody, lspan, s, Option_some(exp_params), __ring_ev_fail);
      break __ring_match95;
    }
    return infer_expr(ctx, arg, s, __ring_ev_fail);
    break __ring_match95;
  }
})(); }
  if (__ring_m._tag === "none") { return infer_expr(ctx, arg, s, __ring_ev_fail); }
  __match_fail(__ring_m);
})() : infer_expr(ctx, arg, s, __ring_ev_fail)); }
  return infer_expr(ctx, arg, s, __ring_ev_fail);
})(); }
  if (__ring_m._tag === "none") { return infer_expr(ctx, arg, s, __ring_ev_fail); }
  __match_fail(__ring_m);
})(); }
  return infer_expr(ctx, arg, s, __ring_ev_fail);
})();
    s = ar.subst;
    const me = infer_ctx$merge_effects(ctx.env, effects, ar.effects, s, __ring_ev_fail);
    effects = me[0];
    s = me[1];
    List_push(hargs, ar.hexpr);
    ai = (ai + 1);
  }
  let result_type = env$TypeEnv_fresh_var(ctx.env);
  __ring_match96: {
    const __ring_m96 = method_type;
    if (__ring_m96._tag === "some") {
      const mt = __ring_m96._0;
      __ring_match97: {
        const __ring_m97 = mt;
        if (__ring_m97._tag === "FnType") {
          const mt_params = __ring_m97.params; const mt_ret = __ring_m97.return_type; const mt_effects = __ring_m97.effects;
          let i = 0;
          for (const harg of hargs) {
            if (((i + 1) < List_len(mt_params))) {
              __ring_match98: {
                const __ring_m98 = List_get(mt_params, (i + 1));
                if (__ring_m98._tag === "some") {
                  const expected_param = __ring_m98._0;
                  s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(harg), expected_param, s, span);
                  break __ring_match98;
                }
                if (__ring_m98._tag === "none") {
                  break __ring_match98;
                }
                __match_fail(__ring_m98);
              }
            }
            i = (i + 1);
          }
          result_type = env$apply_subst(s, mt_ret);
          const me = infer_ctx$merge_effects(ctx.env, effects, mt_effects, s, __ring_ev_fail);
          effects = me[0];
          s = me[1];
          break __ring_match97;
        }
        __ring_match99: {
          const __ring_m99 = recv_type;
          if (__ring_m99._tag === "TypeVar") {
            break __ring_match99;
          }
          const _ = infer_ctx$type_error(ctx.sink, codes$E0305, `Type '${types$type_to_string(recv_type)}' has no method '${method}'`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`no method '${method}' on type '${types$type_to_string(recv_type)}'`)));
          break __ring_match99;
        }
        break __ring_match97;
      }
      break __ring_match96;
    }
    if (__ring_m96._tag === "none") {
      __ring_match100: {
        const __ring_m100 = recv_type;
        if (__ring_m100._tag === "TypeVar") {
          break __ring_match100;
        }
        const _ = infer_ctx$type_error(ctx.sink, codes$E0305, `Type '${types$type_to_string(recv_type)}' has no method '${method}'`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`no method '${method}' on type '${types$type_to_string(recv_type)}'`)));
        break __ring_match100;
      }
      break __ring_match96;
    }
    __match_fail(__ring_m96);
  }
  let resolved_dicts = [];
  __ring_match101: {
    const __ring_m101 = method_scheme;
    if (__ring_m101._tag === "some") {
      const ms = __ring_m101._0;
      if ((List_len(ms.bounds) > 0)) {
        __ring_match102: {
          const __ring_m102 = method_type;
          if (__ring_m102._tag === "some") {
            const mt = __ring_m102._0;
            resolved_dicts = infer_ctx$resolve_dicts_from_scheme(ctx.sink, ctx.env, ctx.current_fn_bounds, ms, mt, s, span);
            break __ring_match102;
          }
          if (__ring_m102._tag === "none") {
            break __ring_match102;
          }
          __match_fail(__ring_m102);
        }
      }
      break __ring_match101;
    }
    if (__ring_m101._tag === "none") {
      break __ring_match101;
    }
    __match_fail(__ring_m101);
  }
  const callee_type = (function() {
  const __ring_m = method_type;
  if (__ring_m._tag === "some") { const mt = __ring_m._0; return mt; }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})();
  return new infer_ctx$InferResult(hir$HExpr_Call(hir$HExpr_FieldAccess(recv_r.hexpr, method, callee_type, types$EMPTY_ROW, span), hargs, [], resolved_dicts, dict_dispatch, result_type, effects, span), s, effects);
}

function lookup_impl_method(ctx, type_name, method) {
  __ring_match103: {
    const __ring_m103 = _Map_get(ctx.env.trait_reg.impl_methods, type_name);
    if (__ring_m103._tag === "some") {
      const impl_methods = __ring_m103._0;
      __ring_match104: {
        const __ring_m104 = _Map_get(impl_methods, method);
        if (__ring_m104._tag === "some") {
          const scheme = __ring_m104._0;
          return new MethodLookupResult(Option_some(env$TypeEnv_instantiate(ctx.env, scheme)), Option_some(scheme));
          break __ring_match104;
        }
        if (__ring_m104._tag === "none") {
          return new MethodLookupResult(Option_none, Option_none);
          break __ring_match104;
        }
        __match_fail(__ring_m104);
      }
      break __ring_match103;
    }
    if (__ring_m103._tag === "none") {
      return new MethodLookupResult(Option_none, Option_none);
      break __ring_match103;
    }
    __match_fail(__ring_m103);
  }
}

function lookup_trait_method(ctx, type_name, method, span) {
  let found_type = Option_none;
  let found_trait_name = Option_none;
  for (const impl_entry of ctx.env.trait_reg.trait_impls) {
    if ((impl_entry.target_type_name === type_name)) {
      __ring_match105: {
        const __ring_m105 = _Map_get(ctx.env.trait_reg.traits, impl_entry.trait_name);
        if (__ring_m105._tag === "some") {
          const trait_def = __ring_m105._0;
          const tm = ((__a) => { const __i = __a.findIndex((function(m) { return (m.name === method); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(trait_def.methods);
          __ring_match106: {
            const __ring_m106 = tm;
            if (__ring_m106._tag === "some") {
              const found_method = __ring_m106._0;
              __ring_match107: {
                const __ring_m107 = found_trait_name;
                if (__ring_m107._tag === "some") {
                  const prev_trait = __ring_m107._0;
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0504, `Ambiguous method '${method}' on '${type_name}': found in trait '${prev_trait}' and '${impl_entry.trait_name}'`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`disambiguate by calling TraitName::${method}`)));
                  return found_type;
                  break __ring_match107;
                }
                if (__ring_m107._tag === "none") {
                  found_type = Option_some(env$TypeEnv_instantiate(ctx.env, new env$TypeScheme(found_method.ty, trait_def.type_param_vars, [], Option_none)));
                  found_trait_name = Option_some(impl_entry.trait_name);
                  break __ring_match107;
                }
                __match_fail(__ring_m107);
              }
              break __ring_match106;
            }
            if (__ring_m106._tag === "none") {
              break __ring_match106;
            }
            __match_fail(__ring_m106);
          }
          break __ring_match105;
        }
        if (__ring_m105._tag === "none") {
          break __ring_match105;
        }
        __match_fail(__ring_m105);
      }
    }
  }
  return found_type;
}

function infer_effect_op(ctx, effect_name, op_name, args, span, subst, __ring_ev_fail) {
  const effect_def_opt = _Map_get(ctx.env.types.effects, effect_name);
  __ring_match108: {
    const __ring_m108 = effect_def_opt;
    if (__ring_m108._tag === "none") {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0402, `Unknown effect: ${effect_name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`effect '${effect_name}' not found`)));
      return new infer_ctx$InferResult(hir$HExpr_EffectOp(effect_name, op_name, [], types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match108;
    }
    break __ring_match108;
  }
  const effect_def = (function() {
  const __ring_m = effect_def_opt;
  if (__ring_m._tag === "some") { const ed = __ring_m._0; return ed; }
  if (__ring_m._tag === "none") { return panic("unreachable"); }
  __match_fail(__ring_m);
})();
  const op_opt = ((__a) => { const __i = __a.findIndex((function(o) { return (o.name === op_name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(effect_def.ops);
  __ring_match109: {
    const __ring_m109 = op_opt;
    if (__ring_m109._tag === "none") {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0402, `Effect ${effect_name} has no operation ${op_name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`no operation '${op_name}' on effect '${effect_name}'`)));
      return new infer_ctx$InferResult(hir$HExpr_EffectOp(effect_name, op_name, [], types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match109;
    }
    break __ring_match109;
  }
  const op = (function() {
  const __ring_m = op_opt;
  if (__ring_m._tag === "some") { const o = __ring_m._0; return o; }
  if (__ring_m._tag === "none") { return panic("unreachable"); }
  __match_fail(__ring_m);
})();
  let inst_map = map_new();
  let inst_type_args = [];
  let tpi = 0;
  for (const tpv of effect_def.type_param_vars) {
    const fresh = env$TypeEnv_fresh_var(ctx.env);
    _Map_insert(inst_map, tpv, fresh);
    List_push(inst_type_args, fresh);
    tpi = (tpi + 1);
  }
  let inst_params = [];
  for (const pt of op.params) {
    List_push(inst_params, env$apply_subst_map(inst_map, pt));
  }
  const inst_ret = env$apply_subst_map(inst_map, op.return_type);
  if ((List_len(args) !== List_len(inst_params))) {
    const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Effect operation '${effect_name}.${op_name}' expects ${Int_to_str(List_len(inst_params))} argument(s), got ${Int_to_str(List_len(args))}`, span, diagnostics$DiagnosticContext_TypeMismatch(`${Int_to_str(List_len(inst_params))} args`, `${Int_to_str(List_len(args))} args`, Option_none));
  }
  let s = subst;
  let effects = types$EMPTY_ROW;
  let hargs = [];
  let i = 0;
  for (const arg of args) {
    const ar = infer_expr(ctx, arg, s, __ring_ev_fail);
    s = ar.subst;
    const me = infer_ctx$merge_effects(ctx.env, effects, ar.effects, s, __ring_ev_fail);
    effects = me[0];
    s = me[1];
    List_push(hargs, ar.hexpr);
    __ring_match110: {
      const __ring_m110 = List_get(inst_params, i);
      if (__ring_m110._tag === "some") {
        const param_type = __ring_m110._0;
        s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(ar.hexpr), param_type, s, span);
        break __ring_match110;
      }
      if (__ring_m110._tag === "none") {
        break __ring_match110;
      }
      __match_fail(__ring_m110);
    }
    i = (i + 1);
  }
  let eff = types$Effect_CustomEffect(effect_name, inst_type_args);
  __ring_match111: {
    const __ring_m111 = effect_def.built_in_kind;
    if (__ring_m111._tag === "some") {
      const bik = __ring_m111._0;
      __ring_match112: {
        const __ring_m112 = bik;
        if (__ring_m112._tag === "BkIo") {
          eff = types$Effect_IoEffect;
          break __ring_match112;
        }
        if (__ring_m112._tag === "BkFail") {
          const error_type = ((List_len(hargs) > 0) ? env$apply_subst(s, hir$hexpr_type((function() {
  const __ring_m = List_first(hargs);
  if (__ring_m._tag === "some") { const h = __ring_m._0; return h; }
  if (__ring_m._tag === "none") { return panic("unreachable"); }
  __match_fail(__ring_m);
})())) : types$UNIT);
          eff = types$Effect_FailEffect(error_type);
          break __ring_match112;
        }
        if (__ring_m112._tag === "BkMut") {
          eff = types$Effect_MutEffect(env$TypeEnv_fresh_var(ctx.env));
          break __ring_match112;
        }
        __match_fail(__ring_m112);
      }
      break __ring_match111;
    }
    if (__ring_m111._tag === "none") {
      break __ring_match111;
    }
    __match_fail(__ring_m111);
  }
  const me = infer_ctx$merge_effects(ctx.env, effects, types$effect_row([eff]), s, __ring_ev_fail);
  effects = me[0];
  s = me[1];
  return new infer_ctx$InferResult(hir$HExpr_EffectOp(effect_name, op_name, hargs, inst_ret, effects, span), s, effects);
}

function infer_field_access(ctx, receiver, field, span, subst, __ring_ev_fail) {
  const recv_r = infer_expr(ctx, receiver, subst, __ring_ev_fail);
  const s = recv_r.subst;
  const recv_type = env$apply_subst(s, hir$hexpr_type(recv_r.hexpr));
  let field_type = env$TypeEnv_fresh_var(ctx.env);
  __ring_match113: {
    const __ring_m113 = recv_type;
    if (__ring_m113._tag === "StructType") {
      const name = __ring_m113.name; const type_params = __ring_m113.type_params;
      __ring_match114: {
        const __ring_m114 = _Map_get(ctx.env.types.structs, name);
        if (__ring_m114._tag === "some") {
          const struct_def = __ring_m114._0;
          const f = ((__a) => { const __i = __a.findIndex((function(f_) { return (f_.name === field); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(struct_def.fields);
          __ring_match115: {
            const __ring_m115 = f;
            if (__ring_m115._tag === "some") {
              const found_field = __ring_m115._0;
              let inst_map = map_new();
              let fi = 0;
              while (((fi < List_len(struct_def.type_param_vars)) && (fi < List_len(type_params)))) {
                __ring_match116: {
                  const __ring_m116 = [List_get(struct_def.type_param_vars, fi), List_get(type_params, fi)];
                  if (Array.isArray(__ring_m116) && __ring_m116.length === 2 && __ring_m116[0]._tag === "some" && __ring_m116[1]._tag === "some") {
                    const var_id = __ring_m116[0]._0; const tp = __ring_m116[1]._0;
                    _Map_insert(inst_map, var_id, tp);
                    break __ring_match116;
                  }
                  break __ring_match116;
                }
                fi = (fi + 1);
              }
              field_type = env$apply_subst_map(inst_map, found_field.ty);
              break __ring_match115;
            }
            if (__ring_m115._tag === "none") {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0304, `Struct ${name} has no field ${field}`, span, diagnostics$DiagnosticContext_MissingField(field, name, Option_none));
              break __ring_match115;
            }
            __match_fail(__ring_m115);
          }
          break __ring_match114;
        }
        if (__ring_m114._tag === "none") {
          const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Unknown struct: ${name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`unknown struct '${name}'`)));
          break __ring_match114;
        }
        __match_fail(__ring_m114);
      }
      break __ring_match113;
    }
    if (__ring_m113._tag === "RecordType") {
      const rec_fields = __ring_m113.fields; const tail = __ring_m113.tail;
      const f = ((__a) => { const __i = __a.findIndex((function(f_) { return (f_.name === field); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(rec_fields);
      __ring_match117: {
        const __ring_m117 = f;
        if (__ring_m117._tag === "some") {
          const found_field = __ring_m117._0;
          field_type = found_field.ty;
          break __ring_match117;
        }
        if (__ring_m117._tag === "none") {
          __ring_match118: {
            const __ring_m118 = tail;
            if (__ring_m118._tag === "some") {
              break __ring_match118;
            }
            if (__ring_m118._tag === "none") {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0304, `Record type has no field '${field}'`, span, diagnostics$DiagnosticContext_MissingField(field, "record", Option_none));
              break __ring_match118;
            }
            __match_fail(__ring_m118);
          }
          break __ring_match117;
        }
        __match_fail(__ring_m117);
      }
      break __ring_match113;
    }
    if (__ring_m113._tag === "TupleType") {
      const elements = __ring_m113.elements;
      __ring_match119: {
        const __ring_m119 = parse_int(field);
        if (__ring_m119._tag === "none") {
          const _ = infer_ctx$type_error(ctx.sink, codes$E0304, `Cannot access named field '${field}' on tuple type; use .0, .1, etc.`, span, diagnostics$DiagnosticContext_MissingField(field, "tuple", Option_none));
          break __ring_match119;
        }
        if (__ring_m119._tag === "some") {
          const i = __ring_m119._0;
          if ((i >= List_len(elements))) {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0304, `Tuple index ${field} out of bounds; tuple has ${Int_to_str(List_len(elements))} elements`, span, diagnostics$DiagnosticContext_MissingField(field, "tuple", Option_none));
          }
          __ring_match120: {
            const __ring_m120 = List_get(elements, i);
            if (__ring_m120._tag === "some") {
              const t = __ring_m120._0;
              field_type = t;
              break __ring_match120;
            }
            if (__ring_m120._tag === "none") {
              panic("unreachable: tuple index bounds already checked");
              break __ring_match120;
            }
            __match_fail(__ring_m120);
          }
          break __ring_match119;
        }
        __match_fail(__ring_m119);
      }
      break __ring_match113;
    }
    if (__ring_m113._tag === "TypeVar") {
      break __ring_match113;
    }
    const _ = infer_ctx$type_error(ctx.sink, codes$E0304, `Cannot access field '${field}' on type ${types$type_to_string(recv_type)}`, span, diagnostics$DiagnosticContext_MissingField(field, types$type_to_string(recv_type), Option_none));
    break __ring_match113;
  }
  return new infer_ctx$InferResult(hir$HExpr_FieldAccess(recv_r.hexpr, field, field_type, recv_r.effects, span), s, recv_r.effects);
}

function infer_struct_lit(ctx, name, fields, spread, span, subst, qualifier, __ring_ev_fail) {
  let resolved_qualifier = qualifier;
  __ring_match121: {
    const __ring_m121 = qualifier;
    if (__ring_m121._tag === "some") {
      const q = __ring_m121._0;
      if (((q === "self") || Str_starts_with(q, "super"))) {
        __ring_match122: {
          const __ring_m122 = infer_ctx$resolve_relative_qualifier(q, ctx.mod_path_stack);
          if (__ring_m122._tag === "some") {
            const prefix = __ring_m122._0;
            if ((prefix === "")) {
              resolved_qualifier = Option_none;
            } else {
              resolved_qualifier = Option_some(prefix);
            }
            break __ring_match122;
          }
          if (__ring_m122._tag === "none") {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0705, `Cannot use '${q}' — relative path exceeds module nesting depth`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("relative path out of scope")));
            return new infer_ctx$InferResult(hir$HExpr_StructLit(name, [], [], Option_none, types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
            break __ring_match122;
          }
          __match_fail(__ring_m122);
        }
      }
      break __ring_match121;
    }
    if (__ring_m121._tag === "none") {
      break __ring_match121;
    }
    __match_fail(__ring_m121);
  }
  __ring_match123: {
    const __ring_m123 = resolved_qualifier;
    if (__ring_m123._tag === "some") {
      const q = __ring_m123._0;
      const qualified_name = `${q}::${name}`;
      const mod_struct = _Map_get(ctx.env.types.structs, qualified_name);
      __ring_match124: {
        const __ring_m124 = mod_struct;
        if (__ring_m124._tag === "some") {
          return infer_struct_lit(ctx, qualified_name, fields, spread, span, subst, Option_none, __ring_ev_fail);
          break __ring_match124;
        }
        if (__ring_m124._tag === "none") {
          break __ring_match124;
        }
        __match_fail(__ring_m124);
      }
      break __ring_match123;
    }
    if (__ring_m123._tag === "none") {
      break __ring_match123;
    }
    __match_fail(__ring_m123);
  }
  let variant_enum = Option_none;
  __ring_match125: {
    const __ring_m125 = resolved_qualifier;
    if (__ring_m125._tag === "some") {
      const q = __ring_m125._0;
      __ring_match126: {
        const __ring_m126 = _Map_get(ctx.env.types.enums, q);
        if (__ring_m126._tag === "some") {
          const enum_def = __ring_m126._0;
          if (enum_def.variants.some((function(v) { return (v.name === name); }))) {
            variant_enum = Option_some(enum_def.name);
          }
          break __ring_match126;
        }
        if (__ring_m126._tag === "none") {
          break __ring_match126;
        }
        __match_fail(__ring_m126);
      }
      break __ring_match125;
    }
    if (__ring_m125._tag === "none") {
      variant_enum = _Map_get(ctx.env.types.variant_to_enum, name);
      break __ring_match125;
    }
    __match_fail(__ring_m125);
  }
  if ((Option_is_none(variant_enum) && Option_is_some(resolved_qualifier))) {
    __ring_match127: {
      const __ring_m127 = resolved_qualifier;
      if (__ring_m127._tag === "some") {
        const q = __ring_m127._0;
        const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `'${q}' has no variant '${name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(name, Option_none));
        break __ring_match127;
      }
      if (__ring_m127._tag === "none") {
        break __ring_match127;
      }
      __match_fail(__ring_m127);
    }
  }
  __ring_match128: {
    const __ring_m128 = variant_enum;
    if (__ring_m128._tag === "some") {
      const ve = __ring_m128._0;
      __ring_match129: {
        const __ring_m129 = _Map_get(ctx.env.types.enums, ve);
        if (__ring_m129._tag === "some") {
          const enum_def = __ring_m129._0;
          const variant = ((__a) => { const __i = __a.findIndex((function(v) { return (v.name === name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(enum_def.variants);
          __ring_match130: {
            const __ring_m130 = variant;
            if (__ring_m130._tag === "some") {
              const v = __ring_m130._0;
              __ring_match131: {
                const __ring_m131 = v.field_names;
                if (__ring_m131._tag === "some") {
                  return infer_named_variant_construct(ctx, ve, name, v, enum_def, fields, spread, span, subst, __ring_ev_fail);
                  break __ring_match131;
                }
                if (__ring_m131._tag === "none") {
                  break __ring_match131;
                }
                __match_fail(__ring_m131);
              }
              break __ring_match130;
            }
            if (__ring_m130._tag === "none") {
              break __ring_match130;
            }
            __match_fail(__ring_m130);
          }
          break __ring_match129;
        }
        if (__ring_m129._tag === "none") {
          break __ring_match129;
        }
        __match_fail(__ring_m129);
      }
      break __ring_match128;
    }
    if (__ring_m128._tag === "none") {
      break __ring_match128;
    }
    __match_fail(__ring_m128);
  }
  const struct_def_opt = _Map_get(ctx.env.types.structs, name);
  __ring_match132: {
    const __ring_m132 = struct_def_opt;
    if (__ring_m132._tag === "none") {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Unknown struct: ${name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`unknown struct '${name}'`)));
      return new infer_ctx$InferResult(hir$HExpr_StructLit(name, [], [], Option_none, types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match132;
    }
    break __ring_match132;
  }
  const struct_def = (function() {
  const __ring_m = struct_def_opt;
  if (__ring_m._tag === "some") { const sd = __ring_m._0; return sd; }
  if (__ring_m._tag === "none") { return panic("unreachable"); }
  __match_fail(__ring_m);
})();
  let inst_map = map_new();
  let type_param_types = [];
  let tpi = 0;
  while ((tpi < List_len(struct_def.type_param_vars))) {
    __ring_match133: {
      const __ring_m133 = List_get(struct_def.type_param_vars, tpi);
      if (__ring_m133._tag === "some") {
        const var_id = __ring_m133._0;
        const tv = env$TypeEnv_fresh_var(ctx.env);
        _Map_insert(inst_map, var_id, tv);
        List_push(type_param_types, tv);
        break __ring_match133;
      }
      if (__ring_m133._tag === "none") {
        break __ring_match133;
      }
      __match_fail(__ring_m133);
    }
    tpi = (tpi + 1);
  }
  let s = subst;
  let effects = types$EMPTY_ROW;
  let hfields = [];
  let hspread = Option_none;
  __ring_match134: {
    const __ring_m134 = spread;
    if (__ring_m134._tag === "some") {
      const sp = __ring_m134._0;
      const sr = infer_expr(ctx, sp, s, __ring_ev_fail);
      s = sr.subst;
      const me = infer_ctx$merge_effects(ctx.env, effects, sr.effects, s, __ring_ev_fail);
      effects = me[0];
      s = me[1];
      let spread_fields = [];
      for (const f of struct_def.fields) {
        List_push(spread_fields, new types$StructField(f.name, env$apply_subst_map(inst_map, f.ty), f.is_pub));
      }
      const spread_type = types$Type_StructType(name, type_param_types, spread_fields);
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(sr.hexpr), spread_type, s, span);
      hspread = Option_some(sr.hexpr);
      break __ring_match134;
    }
    if (__ring_m134._tag === "none") {
      break __ring_match134;
    }
    __match_fail(__ring_m134);
  }
  for (const field of fields) {
    const fr = infer_expr(ctx, field.value, s, __ring_ev_fail);
    s = fr.subst;
    const me = infer_ctx$merge_effects(ctx.env, effects, fr.effects, s, __ring_ev_fail);
    effects = me[0];
    s = me[1];
    const def_field = ((__a) => { const __i = __a.findIndex((function(f) { return (f.name === field.name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(struct_def.fields);
    __ring_match135: {
      const __ring_m135 = def_field;
      if (__ring_m135._tag === "some") {
        const df = __ring_m135._0;
        const ft = env$apply_subst_map(inst_map, df.ty);
        s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(fr.hexpr), ft, s, span);
        break __ring_match135;
      }
      if (__ring_m135._tag === "none") {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Struct '${name}' has no field '${field.name}'`, field.span, diagnostics$DiagnosticContext_MissingField(field.name, name, Option_none));
        break __ring_match135;
      }
      __match_fail(__ring_m135);
    }
    List_push(hfields, new hir$HStructFieldInit(field.name, fr.hexpr));
  }
  if (Option_is_none(spread)) {
    let provided = set_new();
    for (const f of fields) {
      _Set_insert(provided, f.name);
    }
    for (const df of struct_def.fields) {
      if ((!_Set_contains(provided, df.name, __Str_Eq))) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Missing field '${df.name}' in struct literal '${name}'`, span, diagnostics$DiagnosticContext_MissingField(df.name, name, Option_none));
      }
    }
  }
  const struct_type = types$Type_StructType(name, type_param_types, struct_def.fields);
  return new infer_ctx$InferResult(hir$HExpr_StructLit(name, [], hfields, hspread, struct_type, effects, span), s, effects);
}

function infer_named_variant_construct(ctx, enum_name, variant_name, variant, enum_def, fields, spread, span, subst, __ring_ev_fail) {
  const field_names = (function() {
  const __ring_m = variant.field_names;
  if (__ring_m._tag === "some") { const fn_ = __ring_m._0; return fn_; }
  if (__ring_m._tag === "none") { return []; }
  __match_fail(__ring_m);
})();
  let inst_map = map_new();
  let type_param_types = [];
  let tpi = 0;
  while ((tpi < List_len(enum_def.type_param_vars))) {
    __ring_match136: {
      const __ring_m136 = List_get(enum_def.type_param_vars, tpi);
      if (__ring_m136._tag === "some") {
        const var_id = __ring_m136._0;
        const tv = env$TypeEnv_fresh_var(ctx.env);
        _Map_insert(inst_map, var_id, tv);
        List_push(type_param_types, tv);
        break __ring_match136;
      }
      if (__ring_m136._tag === "none") {
        break __ring_match136;
      }
      __match_fail(__ring_m136);
    }
    tpi = (tpi + 1);
  }
  let s = subst;
  let effects = types$EMPTY_ROW;
  let hfields = [];
  let hspread = Option_none;
  __ring_match137: {
    const __ring_m137 = spread;
    if (__ring_m137._tag === "some") {
      const sp = __ring_m137._0;
      const sr = infer_expr(ctx, sp, s, __ring_ev_fail);
      s = sr.subst;
      const me = infer_ctx$merge_effects(ctx.env, effects, sr.effects, s, __ring_ev_fail);
      effects = me[0];
      s = me[1];
      const spread_enum_type = types$Type_EnumType(enum_name, type_param_types, enum_def.variants);
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(sr.hexpr), spread_enum_type, s, span);
      hspread = Option_some(sr.hexpr);
      break __ring_match137;
    }
    if (__ring_m137._tag === "none") {
      break __ring_match137;
    }
    __match_fail(__ring_m137);
  }
  for (const field of fields) {
    const fr = infer_expr(ctx, field.value, s, __ring_ev_fail);
    s = fr.subst;
    const me = infer_ctx$merge_effects(ctx.env, effects, fr.effects, s, __ring_ev_fail);
    effects = me[0];
    s = me[1];
    const field_idx = List_index_of(field_names, field.name, __Str_Eq);
    __ring_match138: {
      const __ring_m138 = field_idx;
      if (__ring_m138._tag === "some") {
        const idx = __ring_m138._0;
        __ring_match139: {
          const __ring_m139 = List_get(variant.fields, idx);
          if (__ring_m139._tag === "some") {
            const ftype = __ring_m139._0;
            const ft = env$apply_subst_map(inst_map, ftype);
            s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(fr.hexpr), ft, s, span);
            break __ring_match139;
          }
          if (__ring_m139._tag === "none") {
            break __ring_match139;
          }
          __match_fail(__ring_m139);
        }
        break __ring_match138;
      }
      if (__ring_m138._tag === "none") {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Variant '${variant_name}' has no field '${field.name}'`, field.span, diagnostics$DiagnosticContext_MissingField(field.name, variant_name, Option_none));
        break __ring_match138;
      }
      __match_fail(__ring_m138);
    }
    List_push(hfields, new hir$HStructFieldInit(field.name, fr.hexpr));
  }
  if (Option_is_none(spread)) {
    let provided = set_new();
    for (const f of fields) {
      _Set_insert(provided, f.name);
    }
    for (const fn_name of field_names) {
      if ((!_Set_contains(provided, fn_name, __Str_Eq))) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Missing field '${fn_name}' in variant '${variant_name}'`, span, diagnostics$DiagnosticContext_MissingField(fn_name, variant_name, Option_none));
      }
    }
  }
  const enum_type = types$Type_EnumType(enum_name, type_param_types, enum_def.variants);
  return new infer_ctx$InferResult(hir$HExpr_NamedVariantConstruct(enum_name, variant_name, hfields, hspread, enum_type, effects, span), s, effects);
}

function infer_match(ctx, scrutinee, arms, span, subst, __ring_ev_fail) {
  const scrut_r = infer_expr(ctx, scrutinee, subst, __ring_ev_fail);
  let s = scrut_r.subst;
  let effects = scrut_r.effects;
  const result_type = env$TypeEnv_fresh_var(ctx.env);
  let harms = [];
  for (const arm of arms) {
    env$TypeEnv_push_scope(ctx.env);
    const arm_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some((function() {
  let match_pattern = arm.pattern;
  __ring_match140: {
    const __ring_m140 = arm.pattern;
    if (__ring_m140._tag === "Binding") {
      const pat_name = __ring_m140.name; const pspan = __ring_m140.span;
      __ring_match141: {
        const __ring_m141 = _Map_get(ctx.env.types.variant_to_enum, pat_name);
        if (__ring_m141._tag === "some") {
          const ve = __ring_m141._0;
          __ring_match142: {
            const __ring_m142 = _Map_get(ctx.env.types.enums, ve);
            if (__ring_m142._tag === "some") {
              const edef = __ring_m142._0;
              const v = ((__a) => { const __i = __a.findIndex((function(v_) { return (v_.name === pat_name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(edef.variants);
              __ring_match143: {
                const __ring_m143 = v;
                if (__ring_m143._tag === "some") {
                  const found_v = __ring_m143._0;
                  if ((List_len(found_v.fields) === 0)) {
                    let _ep = [0];
                    List_clear(_ep);
                    const empty_pats = _ep.map((function(i) { return panic("unreachable"); }));
                    match_pattern = ast$Pattern_Constructor(pat_name, Option_none, empty_pats, pspan);
                  }
                  break __ring_match143;
                }
                if (__ring_m143._tag === "none") {
                  break __ring_match143;
                }
                __match_fail(__ring_m143);
              }
              break __ring_match142;
            }
            if (__ring_m142._tag === "none") {
              break __ring_match142;
            }
            __match_fail(__ring_m142);
          }
          break __ring_match141;
        }
        if (__ring_m141._tag === "none") {
          break __ring_match141;
        }
        __match_fail(__ring_m141);
      }
      break __ring_match140;
    }
    break __ring_match140;
  }
  infer_ctx$bind_pattern(ctx, match_pattern, hir$hexpr_type(scrut_r.hexpr), s);
  let guard_hexpr = Option_none;
  __ring_match144: {
    const __ring_m144 = arm.guard;
    if (__ring_m144._tag === "some") {
      const g = __ring_m144._0;
      const gr = infer_expr(ctx, g, s, __ring_ev_fail);
      s = gr.subst;
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(gr.hexpr), types$BOOL, s, arm.span);
      const me = infer_ctx$merge_effects(ctx.env, effects, gr.effects, s, __ring_ev_fail);
      effects = me[0];
      s = me[1];
      guard_hexpr = Option_some(gr.hexpr);
      break __ring_match144;
    }
    if (__ring_m144._tag === "none") {
      break __ring_match144;
    }
    __match_fail(__ring_m144);
  }
  const body_r = infer_expr(ctx, arm.body, s, __ring_ev_fail);
  s = body_r.subst;
  const me = infer_ctx$merge_effects(ctx.env, effects, body_r.effects, s, __ring_ev_fail);
  effects = me[0];
  s = me[1];
  s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(body_r.hexpr), result_type, s, arm.span);
  List_push(harms, new hir$HMatchArm(match_pattern, guard_hexpr, body_r.hexpr, arm.span));
  return true;
})()); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    env$TypeEnv_pop_scope(ctx.env);
    __ring_match145: {
      const __ring_m145 = arm_result;
      if (__ring_m145._tag === "none") {
        __ring_ev_fail.raise(new infer_ctx$CompileError());
        break __ring_match145;
      }
      break __ring_match145;
    }
  }
  const scrut_type_resolved = env$apply_subst(s, hir$hexpr_type(scrut_r.hexpr));
  const missing = exhaustive$check_exhaustive(harms, scrut_type_resolved, s);
  __ring_match146: {
    const __ring_m146 = missing;
    if (__ring_m146._tag === "some") {
      const m = __ring_m146._0;
      const _ = infer_ctx$type_error(ctx.sink, codes$E0601, `Non-exhaustive match on type ${types$type_to_string(scrut_type_resolved)}: missing pattern for ${m}`, span, diagnostics$DiagnosticContext_PatternError(`missing: ${m}`));
      break __ring_match146;
    }
    if (__ring_m146._tag === "none") {
      break __ring_match146;
    }
    __match_fail(__ring_m146);
  }
  const final_type = env$apply_subst(s, result_type);
  return new infer_ctx$InferResult(hir$HExpr_MatchExpr(scrut_r.hexpr, harms, final_type, effects, span), s, effects);
}

function infer_if(ctx, condition, then_branch, else_branch, span, subst, __ring_ev_fail) {
  const cond_r = infer_expr(ctx, condition, subst, __ring_ev_fail);
  let s = cond_r.subst;
  s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(cond_r.hexpr), types$BOOL, s, span);
  let effects = cond_r.effects;
  const then_r = infer_block(ctx, then_branch, Option_some(s), __ring_ev_fail);
  s = then_r.subst;
  const me = infer_ctx$merge_effects(ctx.env, effects, then_r.effects, s, __ring_ev_fail);
  effects = me[0];
  s = me[1];
  let else_hexpr = Option_none;
  let result_type = types$UNIT;
  __ring_match147: {
    const __ring_m147 = else_branch;
    if (__ring_m147._tag === "some") {
      const eb = __ring_m147._0;
      __ring_match148: {
        const __ring_m148 = eb;
        if (__ring_m148._tag === "Block") {
          const else_r = infer_block(ctx, eb, Option_some(s), __ring_ev_fail);
          s = else_r.subst;
          const me2 = infer_ctx$merge_effects(ctx.env, effects, else_r.effects, s, __ring_ev_fail);
          effects = me2[0];
          s = me2[1];
          s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(then_r.hexpr), hir$hexpr_type(else_r.hexpr), s, span);
          result_type = env$apply_subst(s, hir$hexpr_type(then_r.hexpr));
          else_hexpr = Option_some(else_r.hexpr);
          break __ring_match148;
        }
        if (__ring_m148._tag === "IfExpr") {
          const ec = __ring_m148.condition; const etb = __ring_m148.then_branch; const eeb = __ring_m148.else_branch; const espan = __ring_m148.span;
          const else_if_r = infer_if(ctx, ec, etb, eeb, espan, s, __ring_ev_fail);
          s = else_if_r.subst;
          const me2 = infer_ctx$merge_effects(ctx.env, effects, else_if_r.effects, s, __ring_ev_fail);
          effects = me2[0];
          s = me2[1];
          s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(then_r.hexpr), hir$hexpr_type(else_if_r.hexpr), s, span);
          result_type = env$apply_subst(s, hir$hexpr_type(then_r.hexpr));
          else_hexpr = Option_some(hir$HExpr_Block([], Option_some(else_if_r.hexpr), hir$hexpr_type(else_if_r.hexpr), else_if_r.effects, espan));
          break __ring_match148;
        }
        result_type = types$UNIT;
        break __ring_match148;
      }
      break __ring_match147;
    }
    if (__ring_m147._tag === "none") {
      break __ring_match147;
    }
    __match_fail(__ring_m147);
  }
  return new infer_ctx$InferResult(hir$HExpr_IfExpr(cond_r.hexpr, then_r.hexpr, else_hexpr, result_type, effects, span), s, effects);
}

function infer_string_interp(ctx, parts, span, subst, __ring_ev_fail) {
  let s = subst;
  let effects = types$EMPTY_ROW;
  let hparts = [];
  for (const part of parts) {
    __ring_match149: {
      const __ring_m149 = part;
      if (__ring_m149._tag === "LitPart") {
        const str_val = __ring_m149._0;
        List_push(hparts, hir$HStringInterpPart_Literal(str_val));
        break __ring_match149;
      }
      if (__ring_m149._tag === "ExprPart") {
        const expr = __ring_m149._0;
        const r = infer_expr(ctx, expr, s, __ring_ev_fail);
        s = r.subst;
        const me = infer_ctx$merge_effects(ctx.env, effects, r.effects, s, __ring_ev_fail);
        effects = me[0];
        s = me[1];
        List_push(hparts, hir$HStringInterpPart_Expression(r.hexpr));
        break __ring_match149;
      }
      __match_fail(__ring_m149);
    }
  }
  return new infer_ctx$InferResult(hir$HExpr_StringInterp(hparts, types$STR, effects, span), s, effects);
}

function infer_catch(ctx, expr, arms, span, subst, __ring_ev_fail) {
  const expr_r = infer_expr(ctx, expr, subst, __ring_ev_fail);
  let s = expr_r.subst;
  let effects = expr_r.effects;
  let error_type = env$TypeEnv_fresh_var(ctx.env);
  let found_fail = false;
  for (const eff of effects.effects) {
    __ring_match150: {
      const __ring_m150 = eff;
      if (__ring_m150._tag === "FailEffect") {
        const et = __ring_m150.error_type;
        if (found_fail) {
          s = infer_ctx$unify_at(ctx.sink, ctx.env, error_type, et, s, span);
        } else {
          error_type = et;
          found_fail = true;
        }
        break __ring_match150;
      }
      break __ring_match150;
    }
  }
  const result_type = env$TypeEnv_fresh_var(ctx.env);
  s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(expr_r.hexpr), result_type, s, span);
  let harms = [];
  for (const arm of arms) {
    env$TypeEnv_push_scope(ctx.env);
    const arm_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some((function() {
  infer_ctx$bind_pattern(ctx, arm.pattern, error_type, s);
  let guard_hexpr = Option_none;
  __ring_match151: {
    const __ring_m151 = arm.guard;
    if (__ring_m151._tag === "some") {
      const g = __ring_m151._0;
      const gr = infer_expr(ctx, g, s, __ring_ev_fail);
      s = gr.subst;
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(gr.hexpr), types$BOOL, s, arm.span);
      const me = infer_ctx$merge_effects(ctx.env, effects, gr.effects, s, __ring_ev_fail);
      effects = me[0];
      s = me[1];
      guard_hexpr = Option_some(gr.hexpr);
      break __ring_match151;
    }
    if (__ring_m151._tag === "none") {
      break __ring_match151;
    }
    __match_fail(__ring_m151);
  }
  const body_r = infer_expr(ctx, arm.body, s, __ring_ev_fail);
  s = body_r.subst;
  const me = infer_ctx$merge_effects(ctx.env, effects, body_r.effects, s, __ring_ev_fail);
  effects = me[0];
  s = me[1];
  s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(body_r.hexpr), result_type, s, arm.span);
  List_push(harms, new hir$HMatchArm(arm.pattern, guard_hexpr, body_r.hexpr, arm.span));
  return true;
})()); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    env$TypeEnv_pop_scope(ctx.env);
    __ring_match152: {
      const __ring_m152 = arm_result;
      if (__ring_m152._tag === "none") {
        __ring_ev_fail.raise(new infer_ctx$CompileError());
        break __ring_match152;
      }
      break __ring_match152;
    }
  }
  const error_type_resolved = env$apply_subst(s, error_type);
  const missing = exhaustive$check_exhaustive(harms, error_type_resolved, s);
  __ring_match153: {
    const __ring_m153 = missing;
    if (__ring_m153._tag === "some") {
      const m = __ring_m153._0;
      const _ = infer_ctx$type_error(ctx.sink, codes$E0601, `Non-exhaustive catch on error type ${types$type_to_string(error_type_resolved)}: missing pattern for ${m}`, span, diagnostics$DiagnosticContext_PatternError(`missing: ${m}`));
      break __ring_match153;
    }
    if (__ring_m153._tag === "none") {
      break __ring_match153;
    }
    __match_fail(__ring_m153);
  }
  effects = infer_ctx$remove_fail_effect(effects);
  const final_type = env$apply_subst(s, result_type);
  return new infer_ctx$InferResult(hir$HExpr_TryCatch(expr_r.hexpr, harms, final_type, effects, span), s, effects);
}

function infer_handle(ctx, body, handlers, span, subst, __ring_ev_fail) {
  const body_r = infer_expr(ctx, body, subst, __ring_ev_fail);
  let s = body_r.subst;
  let effects = body_r.effects;
  let hhandlers = [];
  let handled_effects = set_new();
  for (const handler of handlers) {
    env$TypeEnv_push_scope(ctx.env);
    const effect_def = _Map_get(ctx.env.types.effects, handler.effect_name);
    let handler_inst_map = map_new();
    __ring_match154: {
      const __ring_m154 = effect_def;
      if (__ring_m154._tag === "some") {
        const ed = __ring_m154._0;
        for (const tpv of ed.type_param_vars) {
          const fresh = env$TypeEnv_fresh_var(ctx.env);
          _Map_insert(handler_inst_map, tpv, fresh);
        }
        break __ring_match154;
      }
      if (__ring_m154._tag === "none") {
        break __ring_match154;
      }
      __match_fail(__ring_m154);
    }
    let op_def = Option_none;
    __ring_match155: {
      const __ring_m155 = effect_def;
      if (__ring_m155._tag === "some") {
        const ed = __ring_m155._0;
        op_def = ((__a) => { const __i = __a.findIndex((function(o) { return (o.name === handler.op_name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(ed.ops);
        break __ring_match155;
      }
      if (__ring_m155._tag === "none") {
        break __ring_match155;
      }
      __match_fail(__ring_m155);
    }
    let hparams = [];
    let hi = 0;
    for (const p of handler.params) {
      const pt = (function() {
  const __ring_m = p.type_annotation;
  if (__ring_m._tag === "some") { const ta = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, ta); }
  if (__ring_m._tag === "none") { return (function() {
  const __ring_m = op_def;
  if (__ring_m._tag === "some") { const od = __ring_m._0; return (function() {
  const __ring_m = List_get(od.params, hi);
  if (__ring_m._tag === "some") { const odt = __ring_m._0; return env$apply_subst_map(handler_inst_map, odt); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})(); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})(); }
  __match_fail(__ring_m);
})();
      env$TypeEnv_bind_mono(ctx.env, p.name, pt);
      List_push(hparams, new hir$HParam(p.name, pt, Option_none, false));
      hi = (hi + 1);
    }
    __ring_match156: {
      const __ring_m156 = handler.resume_name;
      if (__ring_m156._tag === "some") {
        const rn = __ring_m156._0;
        const resume_param = (function() {
  const __ring_m = op_def;
  if (__ring_m._tag === "some") { const od = __ring_m._0; return env$apply_subst_map(handler_inst_map, od.return_type); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})();
        const resume_ret = env$TypeEnv_fresh_var(ctx.env);
        env$TypeEnv_bind_mono(ctx.env, rn, types$Type_FnType([resume_param], resume_ret, types$EMPTY_ROW));
        break __ring_match156;
      }
      if (__ring_m156._tag === "none") {
        break __ring_match156;
      }
      __match_fail(__ring_m156);
    }
    const handler_body_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_expr(ctx, handler.body, s, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    env$TypeEnv_pop_scope(ctx.env);
    __ring_match157: {
      const __ring_m157 = handler_body_result;
      if (__ring_m157._tag === "some") {
        const hbr = __ring_m157._0;
        s = hbr.subst;
        List_push(hhandlers, new hir$HEffectHandler(handler.effect_name, handler.op_name, hparams, handler.resume_name, hbr.hexpr));
        break __ring_match157;
      }
      if (__ring_m157._tag === "none") {
        __ring_ev_fail.raise(new infer_ctx$CompileError());
        break __ring_match157;
      }
      __match_fail(__ring_m157);
    }
    _Set_insert(handled_effects, handler.effect_name);
  }
  const resolved_effects = env$apply_subst_row(s, effects);
  let filtered_effects = [];
  for (const e of resolved_effects.effects) {
    const should_keep = (function() {
  const __ring_m = e;
  if (__ring_m._tag === "IoEffect") { return (!_Set_contains(handled_effects, "io", __Str_Eq)); }
  if (__ring_m._tag === "CustomEffect") { const name = __ring_m.name; return (!_Set_contains(handled_effects, name, __Str_Eq)); }
  if (__ring_m._tag === "FailEffect") { return (!_Set_contains(handled_effects, "fail", __Str_Eq)); }
  if (__ring_m._tag === "MutEffect") { return (!_Set_contains(handled_effects, "mut", __Str_Eq)); }
  __match_fail(__ring_m);
})();
    if (should_keep) {
      List_push(filtered_effects, e);
    }
  }
  effects = new types$EffectRow(filtered_effects, resolved_effects.tail);
  return new infer_ctx$InferResult(hir$HExpr_HandleExpr(body_r.hexpr, hhandlers, hir$hexpr_type(body_r.hexpr), effects, span), s, effects);
}

function infer_lambda(ctx, params, body, span, subst, expected_param_types, __ring_ev_fail) {
  env$TypeEnv_push_scope(ctx.env);
  let s = subst;
  let hparams = [];
  let param_types = [];
  let pi = 0;
  for (const p of params) {
    const pt = (function() {
  const __ring_m = p.type_annotation;
  if (__ring_m._tag === "some") { const ta = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, ta); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})();
    __ring_match158: {
      const __ring_m158 = expected_param_types;
      if (__ring_m158._tag === "some") {
        const epts = __ring_m158._0;
        if (Option_is_none(p.type_annotation)) {
          __ring_match159: {
            const __ring_m159 = List_get(epts, pi);
            if (__ring_m159._tag === "some") {
              const expected_t = __ring_m159._0;
              s = infer_ctx$unify_at(ctx.sink, ctx.env, pt, expected_t, s, span);
              break __ring_match159;
            }
            if (__ring_m159._tag === "none") {
              break __ring_match159;
            }
            __match_fail(__ring_m159);
          }
        }
        break __ring_match158;
      }
      if (__ring_m158._tag === "none") {
        break __ring_match158;
      }
      __match_fail(__ring_m158);
    }
    env$TypeEnv_bind_mono(ctx.env, p.name, pt);
    const lam_scheme = env$TypeEnv_lookup(ctx.env, p.name);
    __ring_match160: {
      const __ring_m160 = lam_scheme;
      if (__ring_m160._tag === "some") {
        const ls = __ring_m160._0;
        __ring_match161: {
          const __ring_m161 = ls.def_id;
          if (__ring_m161._tag === "some") {
            const did = __ring_m161._0;
            env$TypeEnv_record_def_span(ctx.env, did, p.span);
            if (p.is_mutable) {
              _Set_insert(ctx.env.scope.mutable_vars, did);
            } else {
              _Set_insert(ctx.env.scope.let_defs, did);
            }
            break __ring_match161;
          }
          if (__ring_m161._tag === "none") {
            break __ring_match161;
          }
          __match_fail(__ring_m161);
        }
        List_push(hparams, new hir$HParam(p.name, pt, ls.def_id, p.is_mutable));
        break __ring_match160;
      }
      if (__ring_m160._tag === "none") {
        List_push(hparams, new hir$HParam(p.name, pt, Option_none, p.is_mutable));
        break __ring_match160;
      }
      __match_fail(__ring_m160);
    }
    List_push(param_types, pt);
    pi = (pi + 1);
  }
  const body_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_expr(ctx, body, s, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  env$TypeEnv_pop_scope(ctx.env);
  __ring_match162: {
    const __ring_m162 = body_result;
    if (__ring_m162._tag === "some") {
      const body_r = __ring_m162._0;
      s = body_r.subst;
      let applied_params = [];
      for (const pt of param_types) {
        List_push(applied_params, env$apply_subst(s, pt));
      }
      const applied_ret = env$apply_subst(s, hir$hexpr_type(body_r.hexpr));
      const fn_type = types$Type_FnType(applied_params, applied_ret, body_r.effects);
      let final_hparams = [];
      for (const hp of hparams) {
        List_push(final_hparams, new hir$HParam(hp.name, env$apply_subst(s, hp.ty), hp.def_id, hp.is_mutable));
      }
      return new infer_ctx$InferResult(hir$HExpr_Lambda(final_hparams, applied_ret, body_r.hexpr, fn_type, types$EMPTY_ROW, span), s, types$EMPTY_ROW);
      break __ring_match162;
    }
    if (__ring_m162._tag === "none") {
      return __ring_ev_fail.raise(new infer_ctx$CompileError());
      break __ring_match162;
    }
    __match_fail(__ring_m162);
  }
}

function infer_list_literal(ctx, elements, span, subst, __ring_ev_fail) {
  if ((List_len(elements) === 0)) {
    const elem_type = env$TypeEnv_fresh_var(ctx.env);
    const list_type = types$Type_StructType(hir$BUILTIN_LIST, [elem_type], []);
    return new infer_ctx$InferResult(hir$HExpr_ListLit([], list_type, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
  }
  let s = subst;
  let helements = [];
  let elem_type = env$TypeEnv_fresh_var(ctx.env);
  let combined_effects = types$EMPTY_ROW;
  for (const el of elements) {
    const r = infer_expr(ctx, el, s, __ring_ev_fail);
    s = r.subst;
    s = infer_ctx$unify_at(ctx.sink, ctx.env, env$apply_subst(s, hir$hexpr_type(r.hexpr)), env$apply_subst(s, elem_type), s, span);
    elem_type = env$apply_subst(s, elem_type);
    List_push(helements, r.hexpr);
    const me = infer_ctx$merge_effects(ctx.env, combined_effects, r.effects, s, __ring_ev_fail);
    combined_effects = me[0];
    s = me[1];
  }
  const list_type = types$Type_StructType(hir$BUILTIN_LIST, [env$apply_subst(s, elem_type)], []);
  return new infer_ctx$InferResult(hir$HExpr_ListLit(helements, list_type, combined_effects, span), s, combined_effects);
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


export { infer_block, infer_stmt, infer_expr };