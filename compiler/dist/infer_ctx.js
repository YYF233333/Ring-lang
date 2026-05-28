import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Eq as diagnostics$__Severity_Eq, __Severity_Clone as diagnostics$__Severity_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0405 as codes$E0405, E0406 as codes$E0406, E0407 as codes$E0407, E0408 as codes$E0408, E0504 as codes$E0504, E0505 as codes$E0505, E0506 as codes$E0506, E0507 as codes$E0507, E0508 as codes$E0508, E0409 as codes$E0409, E0410 as codes$E0410, E0509 as codes$E0509, E0510 as codes$E0510, E0511 as codes$E0511, E0512 as codes$E0512, E0513 as codes$E0513, E0514 as codes$E0514, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, W0001 as codes$W0001, error_description as codes$error_description, error_category as codes$error_category } from "./codes.js";
import { new_union_find as union_find$new_union_find, uf_find as union_find$uf_find, uf_bind as union_find$uf_bind, uf_lookup as union_find$uf_lookup, uf_union as union_find$uf_union, uf_insert as union_find$uf_insert, UnionFind as union_find$UnionFind } from "./union_find.js";
import { lookup_variant as env$lookup_variant, mono as env$mono, new_type_env as env$new_type_env, add_impl as env$add_impl, has_impl as env$has_impl, find_impl as env$find_impl, apply_subst_map as env$apply_subst_map, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, AssocConstraintEntry as env$AssocConstraintEntry, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, AssocTypeDef as env$AssocTypeDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, EffectAliasDef as env$EffectAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __FnBound_Eq as env$__FnBound_Eq, __FnBound_Clone as env$__FnBound_Clone, __FnBound_Ord as env$__FnBound_Ord, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Eq as env$__IdGen_Eq, __IdGen_Clone as env$__IdGen_Clone, __IdGen_Ord as env$__IdGen_Ord, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { empty_subst as unify$empty_subst, occurs_in as unify$occurs_in, unify_effect_params as unify$unify_effect_params, unify_effect_rows as unify$unify_effect_rows, unify as unify$unify, UnificationError as unify$UnificationError, __UnificationError_Eq as unify$__UnificationError_Eq, __UnificationError_Clone as unify$__UnificationError_Clone, __UnificationError_Ord as unify$__UnificationError_Ord, __UnificationError_Debug as unify$__UnificationError_Debug } from "./unify.js";



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

class InferResult {
  constructor(hexpr, subst, effects) {
    this.hexpr = hexpr;
    this.subst = subst;
    this.effects = effects;
  }
}

class FnBoundsEntry {
  constructor(type_param_var_id, trait_name, type_param_name) {
    this.type_param_var_id = type_param_var_id;
    this.trait_name = trait_name;
    this.type_param_name = type_param_name;
  }
}

class CompileError {
  constructor() {
  }
}

class InferCtx {
  constructor(env, subst, sink, type_param_scope, current_fn_return_type, current_fn_bounds, fn_bounds_stack, loop_depth, mod_path_stack, use_aliases, boxed_vars, lambda_depth, var_lambda_depth, fn_mut_params, effect_default_deps, qualified_assoc_scope) {
    this.env = env;
    this.subst = subst;
    this.sink = sink;
    this.type_param_scope = type_param_scope;
    this.current_fn_return_type = current_fn_return_type;
    this.current_fn_bounds = current_fn_bounds;
    this.fn_bounds_stack = fn_bounds_stack;
    this.loop_depth = loop_depth;
    this.mod_path_stack = mod_path_stack;
    this.use_aliases = use_aliases;
    this.boxed_vars = boxed_vars;
    this.lambda_depth = lambda_depth;
    this.var_lambda_depth = var_lambda_depth;
    this.fn_mut_params = fn_mut_params;
    this.effect_default_deps = effect_default_deps;
    this.qualified_assoc_scope = qualified_assoc_scope;
  }
}

function new_infer_ctx(sink) {
  return new InferCtx(env$new_type_env(), unify$empty_subst(), sink, map_new(), Option_none, [], [], 0, [], map_new(), set_new(), 0, map_new(), map_new(), map_new(), map_new());
}

function infer_suggestion(code, message, context) {
  let suggestions = [];
  if ((code === "E0301")) {
    if ((Str_contains(message, "Str") && Str_contains(message, "Int"))) {
      List_push(suggestions, new diagnostics$Suggestion("Use parse_int() to convert Str to Int, or .to_str() for Int to Str", Option_none, Option_none));
    }
    if ((Str_contains(message, "Str") && Str_contains(message, "Float"))) {
      List_push(suggestions, new diagnostics$Suggestion("Use parse_float() to convert Str to Float, or .to_str() for Float to Str", Option_none, Option_none));
    }
    if (Str_contains(message, "Option")) {
      List_push(suggestions, new diagnostics$Suggestion("Use match, .unwrap_or(), or .unwrap_or_else() to handle Option values", Option_none, Option_none));
    }
    if ((Str_contains(message, "Bool") && (Str_contains(message, "Int") || Str_contains(message, "Str")))) {
      List_push(suggestions, new diagnostics$Suggestion("Bool cannot be implicitly converted; use an if expression instead", Option_none, Option_none));
    }
  }
  if ((code === "E0303")) {
    if (Str_contains(message, "Str")) {
      List_push(suggestions, new diagnostics$Suggestion("Strings cannot use + for concatenation; use string interpolation or List<Str>.join()", Option_none, Option_none));
    }
  }
  if ((code === "E0201")) {
    __ring_match6: {
      const __ring_m6 = context;
      if (__ring_m6._tag === "UndefinedVariable") {
        const name = __ring_m6.name; const scope_locals = __ring_m6.scope_locals;
        __ring_match7: {
          const __ring_m7 = scope_locals;
          if (__ring_m7._tag === "some") {
            const locals = __ring_m7._0;
            const similar = find_similar_name(name, locals);
            __ring_match8: {
              const __ring_m8 = similar;
              if (__ring_m8._tag === "some") {
                const suggestion = __ring_m8._0;
                List_push(suggestions, new diagnostics$Suggestion(`Did you mean '${suggestion}'?`, Option_some(suggestion), Option_none));
                break __ring_match8;
              }
              if (__ring_m8._tag === "none") {
                break __ring_match8;
              }
              __match_fail(__ring_m8);
            }
            break __ring_match7;
          }
          if (__ring_m7._tag === "none") {
            break __ring_match7;
          }
          __match_fail(__ring_m7);
        }
        break __ring_match6;
      }
      break __ring_match6;
    }
  }
  if ((code === "E0203")) {
    __ring_match9: {
      const __ring_m9 = context;
      if (__ring_m9._tag === "MissingField") {
        const field = __ring_m9.field; const available = __ring_m9.available;
        __ring_match10: {
          const __ring_m10 = available;
          if (__ring_m10._tag === "some") {
            const avail = __ring_m10._0;
            const similar = find_similar_name(field, avail);
            __ring_match11: {
              const __ring_m11 = similar;
              if (__ring_m11._tag === "some") {
                const suggestion = __ring_m11._0;
                List_push(suggestions, new diagnostics$Suggestion(`Did you mean '${suggestion}'?`, Option_some(suggestion), Option_none));
                break __ring_match11;
              }
              if (__ring_m11._tag === "none") {
                break __ring_match11;
              }
              __match_fail(__ring_m11);
            }
            break __ring_match10;
          }
          if (__ring_m10._tag === "none") {
            break __ring_match10;
          }
          __match_fail(__ring_m10);
        }
        break __ring_match9;
      }
      break __ring_match9;
    }
  }
  if ((code === "E0305")) {
    List_push(suggestions, new diagnostics$Suggestion("Check available methods using the type's impl block or trait implementations", Option_none, Option_none));
  }
  if ((code === "E0205")) {
    List_push(suggestions, new diagnostics$Suggestion("Declare the variable with 'let mut' instead of 'let' to allow reassignment", Option_none, Option_none));
  }
  if ((code === "E0601")) {
    List_push(suggestions, new diagnostics$Suggestion("Add a wildcard pattern '_ => ...' or cover all missing variants", Option_none, Option_none));
  }
  return suggestions;
}

function find_similar_name(target, candidates) {
  let best = Option_none;
  let best_score = 0;
  const __ring_iter_2 = __List_Iterable.iter(candidates);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const candidate = __ring_next_2._0;
    let score = 0;
    if ((Str_starts_with(candidate, target) || Str_starts_with(target, candidate))) {
      score = 3;
    }
    if (((Str_len(target) >= 2) && (Str_len(candidate) >= 2))) {
      if ((Str_slice(target, 0, 2) === Str_slice(candidate, 0, 2))) {
        const len_diff = ((Str_len(target) > Str_len(candidate)) ? (Str_len(target) - Str_len(candidate)) : (Str_len(candidate) - Str_len(target)));
        if ((len_diff <= 2)) {
          score = 2;
        }
      }
    }
    if (((Str_len(target) === Str_len(candidate)) && (Str_len(target) >= 1))) {
      if ((Str_slice(target, 0, 1) === Str_slice(candidate, 0, 1))) {
        score = 1;
      }
    }
    if ((score > best_score)) {
      best_score = score;
      best = Option_some(candidate);
    }
  }
  return best;
}

function type_error(sink, code, message, span, context) {
  let diag = diagnostics$make_diag(code, diagnostics$Severity_SevError, message, span, context);
  const suggestions = infer_suggestion(code, message, context);
  if ((List_len(suggestions) > 0)) {
    diag = new diagnostics$Diagnostic(diag.severity, diag.code, diag.message, diag.span, diag.notes, diag.context, suggestions, diag.category);
  }
  diagnostics$CollectingSink_report(sink, diag);
  return types$Type_ErrorType;
}

function type_error_with_notes(sink, code, message, span, context, notes) {
  let diag = diagnostics$make_diagnostic(code, diagnostics$Severity_SevError, message, span, context, notes);
  const suggestions = infer_suggestion(code, message, context);
  if ((List_len(suggestions) > 0)) {
    diag = new diagnostics$Diagnostic(diag.severity, diag.code, diag.message, diag.span, diag.notes, diag.context, suggestions, diag.category);
  }
  diagnostics$CollectingSink_report(sink, diag);
  return types$Type_ErrorType;
}

function merge_effects(env, a, b, s, __ring_ev_fail) {
  const resolved_a = env$apply_subst_row(s, a);
  const resolved_b = env$apply_subst_row(s, b);
  const m = types$row_merge(resolved_a, resolved_b);
  let result_s = s;
  const __ring_iter_3 = __List_Iterable.iter(resolved_b.effects);
  while (true) {
    const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
    if (__ring_next_3._tag === "none") break;
    const eff_b = __ring_next_3._0;
    const __ring_iter_4 = __List_Iterable.iter(resolved_a.effects);
    while (true) {
      const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
      if (__ring_next_4._tag === "none") break;
      const eff_a = __ring_next_4._0;
      if (types$effects_match_kind(eff_a, eff_b)) {
        result_s = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return unify$unify_effect_params(eff_a, eff_b, result_s, env, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return result_s; } else { throw __ring_e; } } throw __ring_e; } })();
        break;
      }
    }
  }
  __ring_match12: {
    const __ring_m12 = m.tails_to_unify;
    if (__ring_m12._tag === "some") {
      const pair = __ring_m12._0;
      const __ring_dt0 = pair;
      const ta = __ring_dt0[0];
      const tb = __ring_dt0[1];
      result_s = unify$unify(types$Type_TypeVar(ta, Option_none), types$Type_TypeVar(tb, Option_none), result_s, env, __ring_ev_fail);
      break __ring_match12;
    }
    if (__ring_m12._tag === "none") {
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
  const out = [m.row, result_s];
  return out;
}

function unify_at(sink, env, t1, t2, s, span) {
  return (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return unify$unify(t1, t2, s, env, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { const e = __ring_err; return (function() {
  const code = (e.is_occurs_check ? codes$E0302 : codes$E0301);
  const _ = type_error(sink, code, e.message, span, diagnostics$DiagnosticContext_TypeMismatch(types$type_to_string(env$apply_subst(s, t1)), types$type_to_string(env$apply_subst(s, t2)), Option_none));
  return s;
})(); } else { throw __ring_e; } } throw __ring_e; } })();
}

function unify_at_noted(sink, env, t1, t2, s, span, notes) {
  return (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return unify$unify(t1, t2, s, env, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { const e = __ring_err; return (function() {
  const code = (e.is_occurs_check ? codes$E0302 : codes$E0301);
  const _ = type_error_with_notes(sink, code, e.message, span, diagnostics$DiagnosticContext_TypeMismatch(types$type_to_string(env$apply_subst(s, t1)), types$type_to_string(env$apply_subst(s, t2)), Option_none), notes);
  return s;
})(); } else { throw __ring_e; } } throw __ring_e; } })();
}

function free_type_vars(t, subst) {
  const resolved = env$apply_subst(subst, t);
  let result = set_new();
  collect_free_vars(resolved, result);
  return result;
}

function collect_free_vars(t, result) {
  __ring_match13: {
    const __ring_m13 = t;
    if (__ring_m13._tag === "IntType") {
      break __ring_match13;
    }
    if (__ring_m13._tag === "FloatType") {
      break __ring_match13;
    }
    if (__ring_m13._tag === "StrType") {
      break __ring_match13;
    }
    if (__ring_m13._tag === "BoolType") {
      break __ring_match13;
    }
    if (__ring_m13._tag === "UnitType") {
      break __ring_match13;
    }
    if (__ring_m13._tag === "NeverType") {
      break __ring_match13;
    }
    if (__ring_m13._tag === "AnyType") {
      break __ring_match13;
    }
    if (__ring_m13._tag === "ErrorType") {
      break __ring_match13;
    }
    if (__ring_m13._tag === "TypeVar") {
      const id = __ring_m13.id;
      return _Set_insert(result, id);
      break __ring_match13;
    }
    if (__ring_m13._tag === "FnType") {
      const params = __ring_m13.params; const return_type = __ring_m13.return_type; const effects = __ring_m13.effects;
      const __ring_iter_5 = __List_Iterable.iter(params);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const p = __ring_next_5._0;
        collect_free_vars(p, result);
      }
      collect_free_vars(return_type, result);
      __ring_match14: {
        const __ring_m14 = effects.tail;
        if (__ring_m14._tag === "some") {
          const tail_id = __ring_m14._0;
          _Set_insert(result, tail_id);
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      const __ring_iter_6 = __List_Iterable.iter(effects.effects);
      while (true) {
        const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
        if (__ring_next_6._tag === "none") break;
        const e = __ring_next_6._0;
        __ring_match15: {
          const __ring_m15 = e;
          if (__ring_m15._tag === "FailEffect") {
            const error_type = __ring_m15.error_type;
            collect_free_vars(error_type, result);
            break __ring_match15;
          }
          if (__ring_m15._tag === "MutEffect") {
            const state_type = __ring_m15.state_type;
            collect_free_vars(state_type, result);
            break __ring_match15;
          }
          if (__ring_m15._tag === "CustomEffect") {
            const type_args = __ring_m15.type_args;
            const __ring_iter_7 = __List_Iterable.iter(type_args);
            while (true) {
              const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
              if (__ring_next_7._tag === "none") break;
              const a = __ring_next_7._0;
              collect_free_vars(a, result);
            }
            break __ring_match15;
          }
          break __ring_match15;
        }
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "StructType") {
      const type_params = __ring_m13.type_params;
      const __ring_iter_8 = __List_Iterable.iter(type_params);
      while (true) {
        const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
        if (__ring_next_8._tag === "none") break;
        const tp = __ring_next_8._0;
        collect_free_vars(tp, result);
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "EnumType") {
      const type_params = __ring_m13.type_params;
      const __ring_iter_9 = __List_Iterable.iter(type_params);
      while (true) {
        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
        if (__ring_next_9._tag === "none") break;
        const tp = __ring_next_9._0;
        collect_free_vars(tp, result);
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "GenericType") {
      const base = __ring_m13.base; const args = __ring_m13.args;
      collect_free_vars(base, result);
      const __ring_iter_10 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
        if (__ring_next_10._tag === "none") break;
        const a = __ring_next_10._0;
        collect_free_vars(a, result);
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "RecordType") {
      const fields = __ring_m13.fields; const tail = __ring_m13.tail;
      const __ring_iter_11 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
        if (__ring_next_11._tag === "none") break;
        const f = __ring_next_11._0;
        collect_free_vars(f.ty, result);
      }
      __ring_match16: {
        const __ring_m16 = tail;
        if (__ring_m16._tag === "some") {
          const t_id = __ring_m16._0;
          return _Set_insert(result, t_id);
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "TupleType") {
      const elements = __ring_m13.elements;
      const __ring_iter_12 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
        if (__ring_next_12._tag === "none") break;
        const e = __ring_next_12._0;
        collect_free_vars(e, result);
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "EffectRowType") {
      const effects = __ring_m13.effects; const tail = __ring_m13.tail;
      __ring_match17: {
        const __ring_m17 = tail;
        if (__ring_m17._tag === "some") {
          const t_id = __ring_m17._0;
          _Set_insert(result, t_id);
          break __ring_match17;
        }
        if (__ring_m17._tag === "none") {
          break __ring_match17;
        }
        __match_fail(__ring_m17);
      }
      const __ring_iter_13 = __List_Iterable.iter(effects);
      while (true) {
        const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
        if (__ring_next_13._tag === "none") break;
        const e = __ring_next_13._0;
        __ring_match18: {
          const __ring_m18 = e;
          if (__ring_m18._tag === "FailEffect") {
            const error_type = __ring_m18.error_type;
            collect_free_vars(error_type, result);
            break __ring_match18;
          }
          if (__ring_m18._tag === "MutEffect") {
            const state_type = __ring_m18.state_type;
            collect_free_vars(state_type, result);
            break __ring_match18;
          }
          if (__ring_m18._tag === "CustomEffect") {
            const type_args = __ring_m18.type_args;
            const __ring_iter_14 = __List_Iterable.iter(type_args);
            while (true) {
              const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
              if (__ring_next_14._tag === "none") break;
              const a = __ring_next_14._0;
              collect_free_vars(a, result);
            }
            break __ring_match18;
          }
          break __ring_match18;
        }
      }
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
}

function free_type_vars_in_env(env, subst) {
  let result = set_new();
  const __ring_iter_15 = __List_Iterable.iter(env.scope.scopes);
  while (true) {
    const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
    if (__ring_next_15._tag === "none") break;
    const scope = __ring_next_15._0;
    const __ring_iter_16 = __List_Iterable.iter(_Map_entries(scope.variables));
    while (true) {
      const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
      if (__ring_next_16._tag === "none") break;
      const entry = __ring_next_16._0;
      const __ring_dt1 = entry;
      const scheme = __ring_dt1[1];
      const ftv = free_type_vars(scheme.ty, subst);
      let quantified = set_new();
      const __ring_iter_17 = __List_Iterable.iter(scheme.type_vars);
      while (true) {
        const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
        if (__ring_next_17._tag === "none") break;
        const v = __ring_next_17._0;
        const resolved = env$apply_subst(subst, types$Type_TypeVar(v, Option_none));
        __ring_match19: {
          const __ring_m19 = resolved;
          if (__ring_m19._tag === "TypeVar") {
            const id = __ring_m19.id;
            _Set_insert(quantified, id);
            break __ring_match19;
          }
          _Set_insert(quantified, v);
          break __ring_match19;
        }
      }
      const __ring_iter_18 = ___Set_Iterable.iter(ftv);
      while (true) {
        const __ring_next_18 = __SetIterator_Iterator.next(__ring_iter_18);
        if (__ring_next_18._tag === "none") break;
        const v = __ring_next_18._0;
        if ((!_Set_contains(quantified, v, __Int_Eq))) {
          _Set_insert(result, v);
        }
      }
    }
  }
  return result;
}

function generalize(env, t, subst) {
  const resolved = env$apply_subst(subst, t);
  const ftv_type = free_type_vars(resolved, unify$empty_subst());
  const ftv_env = free_type_vars_in_env(env, subst);
  let type_vars = [];
  const __ring_iter_19 = ___Set_Iterable.iter(ftv_type);
  while (true) {
    const __ring_next_19 = __SetIterator_Iterator.next(__ring_iter_19);
    if (__ring_next_19._tag === "none") break;
    const v = __ring_next_19._0;
    if ((!_Set_contains(ftv_env, v, __Int_Eq))) {
      List_push(type_vars, v);
    }
  }
  let bounds = [];
  const __ring_iter_20 = __List_Iterable.iter(type_vars);
  while (true) {
    const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
    if (__ring_next_20._tag === "none") break;
    const tv = __ring_next_20._0;
    __ring_match20: {
      const __ring_m20 = _Map_get(env.scope.var_bounds, tv);
      if (__ring_m20._tag === "some") {
        const traits = __ring_m20._0;
        const __ring_iter_21 = ___Set_Iterable.iter(traits);
        while (true) {
          const __ring_next_21 = __SetIterator_Iterator.next(__ring_iter_21);
          if (__ring_next_21._tag === "none") break;
          const trait_name = __ring_next_21._0;
          List_push(bounds, new env$SchemeBound(tv, trait_name, []));
        }
        break __ring_match20;
      }
      if (__ring_m20._tag === "none") {
        break __ring_match20;
      }
      __match_fail(__ring_m20);
    }
  }
  return new env$TypeScheme(resolved, type_vars, bounds, Option_none);
}

function update_fn_effects(env, name, effects) {
  __ring_match21: {
    const __ring_m21 = env$TypeEnv_lookup(env, name);
    if (__ring_m21._tag === "some") {
      const scheme = __ring_m21._0;
      __ring_match22: {
        const __ring_m22 = scheme.ty;
        if (__ring_m22._tag === "FnType") {
          const params = __ring_m22.params; const return_type = __ring_m22.return_type;
          const new_type = types$Type_FnType(params, return_type, effects);
          return env$TypeEnv_rebind(env, name, new env$TypeScheme(new_type, scheme.type_vars, scheme.bounds, scheme.def_id));
          break __ring_match22;
        }
        break __ring_match22;
      }
      break __ring_match21;
    }
    if (__ring_m21._tag === "none") {
      break __ring_match21;
    }
    __match_fail(__ring_m21);
  }
}

function build_scheme_var_map(scheme, instantiated_type) {
  let result = map_new();
  const type_var_set = set_from(scheme.type_vars);
  __ring_match23: {
    const __ring_m23 = [scheme.ty, instantiated_type];
    if (Array.isArray(__ring_m23) && __ring_m23.length === 2 && __ring_m23[0]._tag === "FnType" && __ring_m23[1]._tag === "FnType") {
      const sp = __ring_m23[0].params; const sr = __ring_m23[0].return_type; const ip = __ring_m23[1].params; const ir = __ring_m23[1].return_type;
      let i = 0;
      const limit = ((List_len(sp) < List_len(ip)) ? List_len(sp) : List_len(ip));
      while ((i < limit)) {
        __ring_match24: {
          const __ring_m24 = [List_get(sp, i), List_get(ip, i)];
          if (Array.isArray(__ring_m24) && __ring_m24.length === 2 && __ring_m24[0]._tag === "some" && __ring_m24[1]._tag === "some") {
            const s_param = __ring_m24[0]._0; const i_param = __ring_m24[1]._0;
            collect_var_mappings(s_param, i_param, type_var_set, result);
            break __ring_match24;
          }
          break __ring_match24;
        }
        i = (i + 1);
      }
      collect_var_mappings(sr, ir, type_var_set, result);
      break __ring_match23;
    }
    break __ring_match23;
  }
  return result;
}

function collect_var_mappings(scheme_type, inst_type, type_vars, result) {
  __ring_match25: {
    const __ring_m25 = scheme_type;
    if (__ring_m25._tag === "TypeVar") {
      const id = __ring_m25.id;
      if (_Set_contains(type_vars, id, __Int_Eq)) {
        return _Map_insert(result, id, inst_type);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "StructType") {
      const sn = __ring_m25.name; const stp = __ring_m25.type_params;
      __ring_match26: {
        const __ring_m26 = inst_type;
        if (__ring_m26._tag === "StructType") {
          const in_ = __ring_m26.name; const itp = __ring_m26.type_params;
          if ((sn === in_)) {
            let i = 0;
            const limit = ((List_len(stp) < List_len(itp)) ? List_len(stp) : List_len(itp));
            while ((i < limit)) {
              __ring_match27: {
                const __ring_m27 = [List_get(stp, i), List_get(itp, i)];
                if (Array.isArray(__ring_m27) && __ring_m27.length === 2 && __ring_m27[0]._tag === "some" && __ring_m27[1]._tag === "some") {
                  const s = __ring_m27[0]._0; const inst = __ring_m27[1]._0;
                  collect_var_mappings(s, inst, type_vars, result);
                  break __ring_match27;
                }
                break __ring_match27;
              }
              i = (i + 1);
            }
          }
          break __ring_match26;
        }
        break __ring_match26;
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "EnumType") {
      const sn = __ring_m25.name; const stp = __ring_m25.type_params;
      __ring_match28: {
        const __ring_m28 = inst_type;
        if (__ring_m28._tag === "EnumType") {
          const in_ = __ring_m28.name; const itp = __ring_m28.type_params;
          if ((sn === in_)) {
            let i = 0;
            const limit = ((List_len(stp) < List_len(itp)) ? List_len(stp) : List_len(itp));
            while ((i < limit)) {
              __ring_match29: {
                const __ring_m29 = [List_get(stp, i), List_get(itp, i)];
                if (Array.isArray(__ring_m29) && __ring_m29.length === 2 && __ring_m29[0]._tag === "some" && __ring_m29[1]._tag === "some") {
                  const s = __ring_m29[0]._0; const inst = __ring_m29[1]._0;
                  collect_var_mappings(s, inst, type_vars, result);
                  break __ring_match29;
                }
                break __ring_match29;
              }
              i = (i + 1);
            }
          }
          break __ring_match28;
        }
        break __ring_match28;
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "FnType") {
      const sp = __ring_m25.params; const sr = __ring_m25.return_type;
      __ring_match30: {
        const __ring_m30 = inst_type;
        if (__ring_m30._tag === "FnType") {
          const ip = __ring_m30.params; const ir = __ring_m30.return_type;
          let i = 0;
          const limit = ((List_len(sp) < List_len(ip)) ? List_len(sp) : List_len(ip));
          while ((i < limit)) {
            __ring_match31: {
              const __ring_m31 = [List_get(sp, i), List_get(ip, i)];
              if (Array.isArray(__ring_m31) && __ring_m31.length === 2 && __ring_m31[0]._tag === "some" && __ring_m31[1]._tag === "some") {
                const s = __ring_m31[0]._0; const inst = __ring_m31[1]._0;
                collect_var_mappings(s, inst, type_vars, result);
                break __ring_match31;
              }
              break __ring_match31;
            }
            i = (i + 1);
          }
          return collect_var_mappings(sr, ir, type_vars, result);
          break __ring_match30;
        }
        break __ring_match30;
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "TupleType") {
      const se = __ring_m25.elements;
      __ring_match32: {
        const __ring_m32 = inst_type;
        if (__ring_m32._tag === "TupleType") {
          const ie = __ring_m32.elements;
          let i = 0;
          const limit = ((List_len(se) < List_len(ie)) ? List_len(se) : List_len(ie));
          while ((i < limit)) {
            __ring_match33: {
              const __ring_m33 = [List_get(se, i), List_get(ie, i)];
              if (Array.isArray(__ring_m33) && __ring_m33.length === 2 && __ring_m33[0]._tag === "some" && __ring_m33[1]._tag === "some") {
                const s = __ring_m33[0]._0; const inst = __ring_m33[1]._0;
                collect_var_mappings(s, inst, type_vars, result);
                break __ring_match33;
              }
              break __ring_match33;
            }
            i = (i + 1);
          }
          break __ring_match32;
        }
        break __ring_match32;
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "GenericType") {
      const sb = __ring_m25.base; const sa = __ring_m25.args;
      __ring_match34: {
        const __ring_m34 = inst_type;
        if (__ring_m34._tag === "GenericType") {
          const ib = __ring_m34.base; const ia = __ring_m34.args;
          collect_var_mappings(sb, ib, type_vars, result);
          let i = 0;
          const limit = ((List_len(sa) < List_len(ia)) ? List_len(sa) : List_len(ia));
          while ((i < limit)) {
            __ring_match35: {
              const __ring_m35 = [List_get(sa, i), List_get(ia, i)];
              if (Array.isArray(__ring_m35) && __ring_m35.length === 2 && __ring_m35[0]._tag === "some" && __ring_m35[1]._tag === "some") {
                const s = __ring_m35[0]._0; const inst = __ring_m35[1]._0;
                collect_var_mappings(s, inst, type_vars, result);
                break __ring_match35;
              }
              break __ring_match35;
            }
            i = (i + 1);
          }
          break __ring_match34;
        }
        break __ring_match34;
      }
      break __ring_match25;
    }
    break __ring_match25;
  }
}

function resolve_dicts_from_scheme(sink, env, current_fn_bounds, scheme, callee_type, s, span) {
  if ((List_len(scheme.bounds) === 0)) {
    return [];
  }
  const var_map = build_scheme_var_map(scheme, callee_type);
  let resolved_dicts = [];
  const __ring_iter_22 = __List_Iterable.iter(scheme.bounds);
  while (true) {
    const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
    if (__ring_next_22._tag === "none") break;
    const bound = __ring_next_22._0;
    let found = false;
    __ring_match36: {
      const __ring_m36 = _Map_get(var_map, bound.type_var);
      if (__ring_m36._tag === "some") {
        const fresh_var = __ring_m36._0;
        const concrete = env$apply_subst(s, fresh_var);
        __ring_match37: {
          const __ring_m37 = concrete;
          if (__ring_m37._tag === "StructType") {
            const name = __ring_m37.name; const type_params = __ring_m37.type_params;
            if (env$has_impl(env.trait_reg, name, bound.trait_name)) {
              if ((List_len(type_params) > 0)) {
                const inner = resolve_inner_dicts_from_type_params(env, current_fn_bounds, type_params, s, bound.trait_name);
                List_push(resolved_dicts, hir$DictRef_Wrapped(hir$trait_dict_name(name, bound.trait_name), bound.trait_name, inner));
              } else {
                List_push(resolved_dicts, hir$DictRef_Simple(hir$trait_dict_name(name, bound.trait_name)));
              }
              found = true;
              check_assoc_constraints(sink, env, bound, name, s, span);
            }
            break __ring_match37;
          }
          if (__ring_m37._tag === "EnumType") {
            const name = __ring_m37.name; const type_params = __ring_m37.type_params;
            if (env$has_impl(env.trait_reg, name, bound.trait_name)) {
              if ((List_len(type_params) > 0)) {
                const inner = resolve_inner_dicts_from_type_params(env, current_fn_bounds, type_params, s, bound.trait_name);
                List_push(resolved_dicts, hir$DictRef_Wrapped(hir$trait_dict_name(name, bound.trait_name), bound.trait_name, inner));
              } else {
                List_push(resolved_dicts, hir$DictRef_Simple(hir$trait_dict_name(name, bound.trait_name)));
              }
              found = true;
              check_assoc_constraints(sink, env, bound, name, s, span);
            }
            break __ring_match37;
          }
          if (__ring_m37._tag === "TypeVar") {
            const id = __ring_m37.id;
            const matching = ((__a) => { const __i = __a.findIndex((function(fb) { return (function() {
  const resolved_fb = env$apply_subst(s, types$Type_TypeVar(fb.type_param_var_id, Option_none));
  const resolved_match = (function() {
  const __ring_m = resolved_fb;
  if (__ring_m._tag === "TypeVar") { const rid = __ring_m.id; return (rid === id); }
  return false;
})();
  return ((((fb.type_param_var_id === id) || (union_find$uf_find(s, fb.type_param_var_id) === id)) || resolved_match) && (fb.trait_name === bound.trait_name));
})(); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(current_fn_bounds);
            __ring_match38: {
              const __ring_m38 = matching;
              if (__ring_m38._tag === "some") {
                const fb = __ring_m38._0;
                List_push(resolved_dicts, hir$DictRef_Simple(hir$trait_bound_param_name(fb.type_param_name, fb.trait_name)));
                found = true;
                break __ring_match38;
              }
              if (__ring_m38._tag === "none") {
                break __ring_match38;
              }
              __match_fail(__ring_m38);
            }
            break __ring_match37;
          }
          break __ring_match37;
        }
        if ((!found)) {
          __ring_match39: {
            const __ring_m39 = types$type_to_builtin_name(concrete);
            if (__ring_m39._tag === "some") {
              const prim_name = __ring_m39._0;
              if (env$has_impl(env.trait_reg, prim_name, bound.trait_name)) {
                List_push(resolved_dicts, hir$DictRef_Simple(hir$trait_dict_name(prim_name, bound.trait_name)));
                found = true;
                check_assoc_constraints(sink, env, bound, prim_name, s, span);
              }
              break __ring_match39;
            }
            if (__ring_m39._tag === "none") {
              break __ring_match39;
            }
            __match_fail(__ring_m39);
          }
        }
        break __ring_match36;
      }
      if (__ring_m36._tag === "none") {
        break __ring_match36;
      }
      __match_fail(__ring_m36);
    }
    if ((!found)) {
      const _ = type_error(sink, codes$E0503, `Type does not satisfy trait bound '${bound.trait_name}'`, span, diagnostics$DiagnosticContext_TraitError(`type does not satisfy '${bound.trait_name}'`));
    }
  }
  return resolved_dicts;
}

function check_assoc_constraints(sink, env, bound, target_type_name, s, span) {
  if ((List_len(bound.assoc_constraints) === 0)) {
    return;
  }
  const impl_entry = env$find_impl(env.trait_reg, target_type_name, bound.trait_name);
  __ring_match40: {
    const __ring_m40 = impl_entry;
    if (__ring_m40._tag === "some") {
      const entry = __ring_m40._0;
      const __ring_iter_23 = __List_Iterable.iter(bound.assoc_constraints);
      while (true) {
        const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
        if (__ring_next_23._tag === "none") break;
        const ac = __ring_next_23._0;
        __ring_match41: {
          const __ring_m41 = _Map_get(entry.assoc_types, ac.name);
          if (__ring_m41._tag === "some") {
            const actual_ty = __ring_m41._0;
            const expected_ty = env$apply_subst(s, ac.ty);
            const actual_resolved = env$apply_subst(s, actual_ty);
            if ((!types$types_equal(expected_ty, actual_resolved))) {
              const _ = type_error(sink, codes$E0513, `Associated type '${ac.name}' mismatch: expected '${types$type_to_string(expected_ty)}' but impl provides '${types$type_to_string(actual_resolved)}'`, span, diagnostics$DiagnosticContext_TraitError("associated type constraint mismatch"));
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
}

function resolve_inner_dicts_from_type_params(env, current_fn_bounds, type_params, s, trait_name) {
  let result = [];
  const __ring_iter_24 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
    if (__ring_next_24._tag === "none") break;
    const param = __ring_next_24._0;
    const concrete = env$apply_subst(s, param);
    List_push(result, resolve_concrete_type_to_dict_ref(env, current_fn_bounds, concrete, s, trait_name));
  }
  return result;
}

function resolve_concrete_type_to_dict_ref(env, current_fn_bounds, t, s, trait_name) {
  __ring_match42: {
    const __ring_m42 = types$type_to_builtin_name(t);
    if (__ring_m42._tag === "some") {
      const builtin_name = __ring_m42._0;
      __ring_match43: {
        const __ring_m43 = t;
        if (__ring_m43._tag === "StructType") {
          break __ring_match43;
        }
        if (__ring_m43._tag === "EnumType") {
          break __ring_match43;
        }
        return hir$DictRef_Simple(hir$trait_dict_name(builtin_name, trait_name));
        break __ring_match43;
      }
      break __ring_match42;
    }
    if (__ring_m42._tag === "none") {
      break __ring_match42;
    }
    __match_fail(__ring_m42);
  }
  __ring_match44: {
    const __ring_m44 = t;
    if (__ring_m44._tag === "TypeVar") {
      const id = __ring_m44.id;
      const bound = ((__a) => { const __i = __a.findIndex((function(fb) { return ((fb.type_param_var_id === id) && (fb.trait_name === trait_name)); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(current_fn_bounds);
      __ring_match45: {
        const __ring_m45 = bound;
        if (__ring_m45._tag === "some") {
          const b = __ring_m45._0;
          return hir$DictRef_Simple(hir$trait_bound_param_name(b.type_param_name, trait_name));
          break __ring_match45;
        }
        if (__ring_m45._tag === "none") {
          return hir$DictRef_Simple(hir$trait_dict_name("__unknown", trait_name));
          break __ring_match45;
        }
        __match_fail(__ring_m45);
      }
      break __ring_match44;
    }
    if (__ring_m44._tag === "StructType") {
      const name = __ring_m44.name; const type_params = __ring_m44.type_params;
      if (env$has_impl(env.trait_reg, name, trait_name)) {
        if ((List_len(type_params) > 0)) {
          const inner = resolve_inner_dicts_from_type_params(env, current_fn_bounds, type_params, s, trait_name);
          return hir$DictRef_Wrapped(hir$trait_dict_name(name, trait_name), trait_name, inner);
        } else {
          return hir$DictRef_Simple(hir$trait_dict_name(name, trait_name));
        }
      } else {
        return hir$DictRef_Simple(hir$trait_dict_name(name, trait_name));
      }
      break __ring_match44;
    }
    if (__ring_m44._tag === "EnumType") {
      const name = __ring_m44.name; const type_params = __ring_m44.type_params;
      if (env$has_impl(env.trait_reg, name, trait_name)) {
        if ((List_len(type_params) > 0)) {
          const inner = resolve_inner_dicts_from_type_params(env, current_fn_bounds, type_params, s, trait_name);
          return hir$DictRef_Wrapped(hir$trait_dict_name(name, trait_name), trait_name, inner);
        } else {
          return hir$DictRef_Simple(hir$trait_dict_name(name, trait_name));
        }
      } else {
        return hir$DictRef_Simple(hir$trait_dict_name(name, trait_name));
      }
      break __ring_match44;
    }
    return hir$DictRef_Simple(hir$trait_dict_name("__unknown", trait_name));
    break __ring_match44;
  }
}

function resolve_type_expr(ctx, texpr) {
  __ring_match46: {
    const __ring_m46 = texpr;
    if (__ring_m46._tag === "Named") {
      const name = __ring_m46.name; const qualifier = __ring_m46.qualifier; const type_args = __ring_m46.type_args; const span = __ring_m46.span;
      __ring_match47: {
        const __ring_m47 = qualifier;
        if (__ring_m47._tag === "some") {
          const q = __ring_m47._0;
          __ring_match48: {
            const __ring_m48 = _Map_get(ctx.type_param_scope, q);
            if (__ring_m48._tag === "some") {
              const tp_type = __ring_m48._0;
              return resolve_assoc_type(ctx, q, name, span);
              break __ring_match48;
            }
            if (__ring_m48._tag === "none") {
              let resolved_q = q;
              if (((q === "self") || Str_starts_with(q, "super"))) {
                __ring_match49: {
                  const __ring_m49 = resolve_relative_qualifier(q, ctx.mod_path_stack);
                  if (__ring_m49._tag === "some") {
                    const prefix = __ring_m49._0;
                    resolved_q = prefix;
                    break __ring_match49;
                  }
                  if (__ring_m49._tag === "none") {
                    resolved_q = q;
                    break __ring_match49;
                  }
                  __match_fail(__ring_m49);
                }
              }
              if ((resolved_q === "")) {
                return resolve_named_type(ctx, name, type_args, span);
              } else {
                const qualified_type_name = `${resolved_q}::${name}`;
                if (((_Map_contains_key(ctx.env.types.structs, qualified_type_name) || _Map_contains_key(ctx.env.types.enums, qualified_type_name)) || _Map_contains_key(ctx.env.types.type_aliases, qualified_type_name))) {
                  return resolve_named_type(ctx, qualified_type_name, type_args, span);
                } else {
                  if ((List_len(ctx.mod_path_stack) > 0)) {
                    const mod_prefix = List_join(ctx.mod_path_stack, "::");
                    const full_type_name = `${mod_prefix}::${qualified_type_name}`;
                    if (((_Map_contains_key(ctx.env.types.structs, full_type_name) || _Map_contains_key(ctx.env.types.enums, full_type_name)) || _Map_contains_key(ctx.env.types.type_aliases, full_type_name))) {
                      return resolve_named_type(ctx, full_type_name, type_args, span);
                    } else {
                      return resolve_named_type(ctx, qualified_type_name, type_args, span);
                    }
                  } else {
                    return resolve_named_type(ctx, qualified_type_name, type_args, span);
                  }
                }
              }
              break __ring_match48;
            }
            __match_fail(__ring_m48);
          }
          break __ring_match47;
        }
        if (__ring_m47._tag === "none") {
          return resolve_named_type(ctx, name, type_args, span);
          break __ring_match47;
        }
        __match_fail(__ring_m47);
      }
      break __ring_match46;
    }
    if (__ring_m46._tag === "FnType") {
      const params = __ring_m46.params; const return_type = __ring_m46.return_type; const effects = __ring_m46.effects;
      let resolved_params = [];
      const __ring_iter_25 = __List_Iterable.iter(params);
      while (true) {
        const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
        if (__ring_next_25._tag === "none") break;
        const p = __ring_next_25._0;
        List_push(resolved_params, resolve_type_expr(ctx, p));
      }
      const ret = resolve_type_expr(ctx, return_type);
      const eff_row = ((List_len(effects) > 0) ? (function() {
  let resolved_effects = [];
  const __ring_iter_26 = __List_Iterable.iter(effects);
  while (true) {
    const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
    if (__ring_next_26._tag === "none") break;
    const e = __ring_next_26._0;
    List_push(resolved_effects, resolve_fn_type_effect(ctx, e));
  }
  return new types$EffectRow(resolved_effects, Option_none);
})() : (function() {
  const tail_id = env$TypeEnv_fresh_var_id(ctx.env);
  return new types$EffectRow([], Option_some(tail_id));
})());
      return types$Type_FnType(resolved_params, ret, eff_row);
      break __ring_match46;
    }
    if (__ring_m46._tag === "OptionType") {
      const inner = __ring_m46.inner;
      return types$make_option_type(resolve_type_expr(ctx, inner));
      break __ring_match46;
    }
    if (__ring_m46._tag === "RecordType") {
      const fields = __ring_m46.fields; const rest = __ring_m46.rest;
      let resolved_fields = [];
      const __ring_iter_27 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
        if (__ring_next_27._tag === "none") break;
        const f = __ring_next_27._0;
        List_push(resolved_fields, new types$RecordField(f.name, resolve_type_expr(ctx, f.ty)));
      }
      __ring_match50: {
        const __ring_m50 = rest;
        if (__ring_m50._tag === "some") {
          const rest_name = __ring_m50._0;
          const tail_var = env$TypeEnv_fresh_var(ctx.env);
          __ring_match51: {
            const __ring_m51 = tail_var;
            if (__ring_m51._tag === "TypeVar") {
              const id = __ring_m51.id;
              _Map_insert(ctx.type_param_scope, rest_name, tail_var);
              return types$Type_RecordType(resolved_fields, Option_some(id), Option_some(rest_name));
              break __ring_match51;
            }
            return types$Type_RecordType(resolved_fields, Option_none, Option_none);
            break __ring_match51;
          }
          break __ring_match50;
        }
        if (__ring_m50._tag === "none") {
          return types$Type_RecordType(resolved_fields, Option_none, Option_none);
          break __ring_match50;
        }
        __match_fail(__ring_m50);
      }
      break __ring_match46;
    }
    if (__ring_m46._tag === "TupleType") {
      const elements = __ring_m46.elements;
      let resolved_elems = [];
      const __ring_iter_28 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
        if (__ring_next_28._tag === "none") break;
        const e = __ring_next_28._0;
        List_push(resolved_elems, resolve_type_expr(ctx, e));
      }
      return types$Type_TupleType(resolved_elems);
      break __ring_match46;
    }
    __match_fail(__ring_m46);
  }
}

function resolve_assoc_type(ctx, type_param_name, assoc_name, span) {
  if ((type_param_name !== "")) {
    const qualified_key = `${type_param_name}::${assoc_name}`;
    __ring_match52: {
      const __ring_m52 = _Map_get(ctx.qualified_assoc_scope, qualified_key);
      if (__ring_m52._tag === "some") {
        const ty = __ring_m52._0;
        return ty;
        break __ring_match52;
      }
      if (__ring_m52._tag === "none") {
        break __ring_match52;
      }
      __match_fail(__ring_m52);
    }
  }
  __ring_match53: {
    const __ring_m53 = _Map_get(ctx.type_param_scope, assoc_name);
    if (__ring_m53._tag === "some") {
      const ty = __ring_m53._0;
      return ty;
      break __ring_match53;
    }
    if (__ring_m53._tag === "none") {
      break __ring_match53;
    }
    __match_fail(__ring_m53);
  }
  let found_types = [];
  let found_trait_names = [];
  const __ring_iter_29 = __List_Iterable.iter(ctx.current_fn_bounds);
  while (true) {
    const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
    if (__ring_next_29._tag === "none") break;
    const fb = __ring_next_29._0;
    if ((fb.type_param_name === type_param_name)) {
      __ring_match54: {
        const __ring_m54 = _Map_get(ctx.env.trait_reg.traits, fb.trait_name);
        if (__ring_m54._tag === "some") {
          const tdef = __ring_m54._0;
          const __ring_iter_30 = __List_Iterable.iter(tdef.assoc_types);
          while (true) {
            const __ring_next_30 = __ListIterator_Iterator.next(__ring_iter_30);
            if (__ring_next_30._tag === "none") break;
            const atdef = __ring_next_30._0;
            if ((atdef.name === assoc_name)) {
              const at_var = env$TypeEnv_fresh_var(ctx.env);
              List_push(found_types, at_var);
              List_push(found_trait_names, fb.trait_name);
            }
          }
          break __ring_match54;
        }
        if (__ring_m54._tag === "none") {
          break __ring_match54;
        }
        __match_fail(__ring_m54);
      }
    }
  }
  if ((List_len(found_types) === 0)) {
    __ring_match55: {
      const __ring_m55 = _Map_get(ctx.type_param_scope, type_param_name);
      if (__ring_m55._tag === "some") {
        const tp_type = __ring_m55._0;
        __ring_match56: {
          const __ring_m56 = tp_type;
          if (__ring_m56._tag === "TypeVar") {
            const id = __ring_m56.id;
            __ring_match57: {
              const __ring_m57 = _Map_get(ctx.env.scope.var_bounds, id);
              if (__ring_m57._tag === "some") {
                const bound_set = __ring_m57._0;
                const __ring_iter_31 = __List_Iterable.iter(_Set_to_list(bound_set));
                while (true) {
                  const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
                  if (__ring_next_31._tag === "none") break;
                  const bound_name = __ring_next_31._0;
                  __ring_match58: {
                    const __ring_m58 = _Map_get(ctx.env.trait_reg.traits, bound_name);
                    if (__ring_m58._tag === "some") {
                      const tdef = __ring_m58._0;
                      const __ring_iter_32 = __List_Iterable.iter(tdef.assoc_types);
                      while (true) {
                        const __ring_next_32 = __ListIterator_Iterator.next(__ring_iter_32);
                        if (__ring_next_32._tag === "none") break;
                        const atdef = __ring_next_32._0;
                        if ((atdef.name === assoc_name)) {
                          const at_var = env$TypeEnv_fresh_var(ctx.env);
                          List_push(found_types, at_var);
                          List_push(found_trait_names, bound_name);
                        }
                      }
                      break __ring_match58;
                    }
                    if (__ring_m58._tag === "none") {
                      break __ring_match58;
                    }
                    __match_fail(__ring_m58);
                  }
                }
                break __ring_match57;
              }
              if (__ring_m57._tag === "none") {
                break __ring_match57;
              }
              __match_fail(__ring_m57);
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
  if ((List_len(found_types) === 0)) {
    const _ = type_error(ctx.sink, codes$E0511, `Type '${type_param_name}' has no associated type '${assoc_name}'`, span, diagnostics$DiagnosticContext_TraitError(`unknown associated type '${assoc_name}'`));
    return env$TypeEnv_fresh_var(ctx.env);
  }
  if ((List_len(found_types) > 1)) {
    const traits_str = List_join(found_trait_names, ", ");
    const _ = type_error(ctx.sink, codes$E0512, `Ambiguous associated type '${assoc_name}' for '${type_param_name}': found in traits ${traits_str}`, span, diagnostics$DiagnosticContext_TraitError("ambiguous associated type"));
  }
  return Option_unwrap_or(List_get(found_types, 0), env$TypeEnv_fresh_var(ctx.env));
}

function resolve_fn_type_effect(ctx, eff) {
  if ((eff.name === "io")) {
    return types$Effect_IoEffect;
  }
  if ((eff.name === "mut")) {
    const mut_state = ((List_len(eff.type_args) > 0) ? (function() {
  const __ring_m = List_first(eff.type_args);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return resolve_type_expr(ctx, t); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})() : env$TypeEnv_fresh_var(ctx.env));
    return types$Effect_MutEffect(mut_state);
  }
  if ((eff.name === "fail")) {
    const err_type = ((List_len(eff.type_args) > 0) ? (function() {
  const __ring_m = List_first(eff.type_args);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return resolve_type_expr(ctx, t); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})() : env$TypeEnv_fresh_var(ctx.env));
    return types$Effect_FailEffect(err_type);
  }
  let resolved_args = [];
  const __ring_iter_33 = __List_Iterable.iter(eff.type_args);
  while (true) {
    const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
    if (__ring_next_33._tag === "none") break;
    const ta = __ring_next_33._0;
    List_push(resolved_args, resolve_type_expr(ctx, ta));
  }
  return types$Effect_CustomEffect(eff.name, resolved_args);
}

function resolve_self_type(ctx, name) {
  return resolve_named_type(ctx, name, [], ast$span_zero());
}

function resolve_named_type(ctx, name, type_args, span) {
  if ((name === hir$BUILTIN_INT)) {
    return types$INT;
  }
  if ((name === hir$BUILTIN_FLOAT)) {
    return types$FLOAT;
  }
  if ((name === hir$BUILTIN_STR)) {
    return types$STR;
  }
  if ((name === hir$BUILTIN_BOOL)) {
    return types$BOOL;
  }
  if ((name === "Never")) {
    return types$NEVER;
  }
  if ((name === "Unit")) {
    return types$UNIT;
  }
  __ring_match59: {
    const __ring_m59 = _Map_get(ctx.type_param_scope, name);
    if (__ring_m59._tag === "some") {
      const tp = __ring_m59._0;
      return tp;
      break __ring_match59;
    }
    if (__ring_m59._tag === "none") {
      break __ring_match59;
    }
    __match_fail(__ring_m59);
  }
  if (((name === hir$BUILTIN_OPTION) && (List_len(type_args) === 1))) {
    __ring_match60: {
      const __ring_m60 = List_get(type_args, 0);
      if (__ring_m60._tag === "some") {
        const arg = __ring_m60._0;
        return types$make_option_type(resolve_type_expr(ctx, arg));
        break __ring_match60;
      }
      if (__ring_m60._tag === "none") {
        break __ring_match60;
      }
      __match_fail(__ring_m60);
    }
  }
  if (_Map_contains_key(ctx.env.types.structs, name)) {
    __ring_match61: {
      const __ring_m61 = _Map_get(ctx.env.types.structs, name);
      if (__ring_m61._tag === "some") {
        const def = __ring_m61._0;
        if (((List_len(type_args) > 0) && (List_len(type_args) !== List_len(def.type_params)))) {
          const _ = type_error(ctx.sink, codes$E0301, `Type '${name}' expects ${Int_to_str(List_len(def.type_params))} type argument(s), got ${Int_to_str(List_len(type_args))}`, span, diagnostics$DiagnosticContext_TypeMismatch(`${Int_to_str(List_len(def.type_params))} type args`, `${Int_to_str(List_len(type_args))} type args`, Option_none));
        }
        let resolved_params = [];
        if ((List_len(type_args) > 0)) {
          const __ring_iter_34 = __List_Iterable.iter(type_args);
          while (true) {
            const __ring_next_34 = __ListIterator_Iterator.next(__ring_iter_34);
            if (__ring_next_34._tag === "none") break;
            const a = __ring_next_34._0;
            List_push(resolved_params, resolve_type_expr(ctx, a));
          }
        } else {
          const __ring_iter_35 = __List_Iterable.iter(def.type_params);
          while (true) {
            const __ring_next_35 = __ListIterator_Iterator.next(__ring_iter_35);
            if (__ring_next_35._tag === "none") break;
            const _ = __ring_next_35._0;
            List_push(resolved_params, env$TypeEnv_fresh_var(ctx.env));
          }
        }
        return types$Type_StructType(def.name, resolved_params, def.fields);
        break __ring_match61;
      }
      if (__ring_m61._tag === "none") {
        break __ring_match61;
      }
      __match_fail(__ring_m61);
    }
  }
  if (_Map_contains_key(ctx.env.types.enums, name)) {
    __ring_match62: {
      const __ring_m62 = _Map_get(ctx.env.types.enums, name);
      if (__ring_m62._tag === "some") {
        const def = __ring_m62._0;
        if (((List_len(type_args) > 0) && (List_len(type_args) !== List_len(def.type_params)))) {
          const _ = type_error(ctx.sink, codes$E0301, `Type '${name}' expects ${Int_to_str(List_len(def.type_params))} type argument(s), got ${Int_to_str(List_len(type_args))}`, span, diagnostics$DiagnosticContext_TypeMismatch(`${Int_to_str(List_len(def.type_params))} type args`, `${Int_to_str(List_len(type_args))} type args`, Option_none));
        }
        let resolved_params = [];
        if ((List_len(type_args) > 0)) {
          const __ring_iter_36 = __List_Iterable.iter(type_args);
          while (true) {
            const __ring_next_36 = __ListIterator_Iterator.next(__ring_iter_36);
            if (__ring_next_36._tag === "none") break;
            const a = __ring_next_36._0;
            List_push(resolved_params, resolve_type_expr(ctx, a));
          }
        } else {
          const __ring_iter_37 = __List_Iterable.iter(def.type_params);
          while (true) {
            const __ring_next_37 = __ListIterator_Iterator.next(__ring_iter_37);
            if (__ring_next_37._tag === "none") break;
            const _ = __ring_next_37._0;
            List_push(resolved_params, env$TypeEnv_fresh_var(ctx.env));
          }
        }
        return types$Type_EnumType(def.name, resolved_params, def.variants);
        break __ring_match62;
      }
      if (__ring_m62._tag === "none") {
        break __ring_match62;
      }
      __match_fail(__ring_m62);
    }
  }
  __ring_match63: {
    const __ring_m63 = _Map_get(ctx.env.types.type_aliases, name);
    if (__ring_m63._tag === "some") {
      const alias = __ring_m63._0;
      if (((List_len(type_args) > 0) && (List_len(type_args) !== List_len(alias.type_params)))) {
        const _ = type_error(ctx.sink, codes$E0301, `Type '${name}' expects ${Int_to_str(List_len(alias.type_params))} type argument(s), got ${Int_to_str(List_len(type_args))}`, span, diagnostics$DiagnosticContext_TypeMismatch(`${Int_to_str(List_len(alias.type_params))} type args`, `${Int_to_str(List_len(type_args))} type args`, Option_none));
      }
      if ((List_len(alias.type_param_vars) === 0)) {
        return alias.ty;
      }
      let resolved_args = [];
      const __ring_iter_38 = __List_Iterable.iter(type_args);
      while (true) {
        const __ring_next_38 = __ListIterator_Iterator.next(__ring_iter_38);
        if (__ring_next_38._tag === "none") break;
        const a = __ring_next_38._0;
        List_push(resolved_args, resolve_type_expr(ctx, a));
      }
      let mapping = map_new();
      let i = 0;
      const limit = ((List_len(alias.type_param_vars) < List_len(resolved_args)) ? List_len(alias.type_param_vars) : List_len(resolved_args));
      while ((i < limit)) {
        __ring_match64: {
          const __ring_m64 = [List_get(alias.type_param_vars, i), List_get(resolved_args, i)];
          if (Array.isArray(__ring_m64) && __ring_m64.length === 2 && __ring_m64[0]._tag === "some" && __ring_m64[1]._tag === "some") {
            const var_id = __ring_m64[0]._0; const arg = __ring_m64[1]._0;
            _Map_insert(mapping, var_id, arg);
            break __ring_match64;
          }
          break __ring_match64;
        }
        i = (i + 1);
      }
      return env$apply_subst_map(mapping, alias.ty);
      break __ring_match63;
    }
    if (__ring_m63._tag === "none") {
      break __ring_match63;
    }
    __match_fail(__ring_m63);
  }
  return type_error(ctx.sink, codes$E0204, `Unknown type: ${name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`unknown type '${name}'`)));
}

function bind_pattern(ctx, pattern, expected_type, subst) {
  __ring_match65: {
    const __ring_m65 = pattern;
    if (__ring_m65._tag === "Wildcard") {
      break __ring_match65;
    }
    if (__ring_m65._tag === "Binding") {
      const name = __ring_m65.name; const span = __ring_m65.span;
      env$TypeEnv_bind_mono(ctx.env, name, env$apply_subst(subst, expected_type));
      __ring_match66: {
        const __ring_m66 = env$TypeEnv_lookup(ctx.env, name);
        if (__ring_m66._tag === "some") {
          const scheme = __ring_m66._0;
          __ring_match67: {
            const __ring_m67 = scheme.def_id;
            if (__ring_m67._tag === "some") {
              const did = __ring_m67._0;
              return env$TypeEnv_record_def_span(ctx.env, did, span);
              break __ring_match67;
            }
            if (__ring_m67._tag === "none") {
              break __ring_match67;
            }
            __match_fail(__ring_m67);
          }
          break __ring_match66;
        }
        if (__ring_m66._tag === "none") {
          break __ring_match66;
        }
        __match_fail(__ring_m66);
      }
      break __ring_match65;
    }
    if (__ring_m65._tag === "Constructor") {
      const name = __ring_m65.name; const qualifier = __ring_m65.qualifier; const fields = __ring_m65.fields; const span = __ring_m65.span;
      return bind_constructor_pattern(ctx, name, qualifier, fields, expected_type, subst, span);
      break __ring_match65;
    }
    if (__ring_m65._tag === "Literal") {
      break __ring_match65;
    }
    if (__ring_m65._tag === "NamedConstructor") {
      const name = __ring_m65.name; const qualifier = __ring_m65.qualifier; const fields = __ring_m65.fields; const span = __ring_m65.span;
      return bind_named_constructor_pattern(ctx, name, qualifier, fields, expected_type, subst, span);
      break __ring_match65;
    }
    if (__ring_m65._tag === "TuplePattern") {
      const elements = __ring_m65.elements; const span = __ring_m65.span;
      const resolved = env$apply_subst(subst, expected_type);
      __ring_match68: {
        const __ring_m68 = resolved;
        if (__ring_m68._tag === "TupleType") {
          const type_elems = __ring_m68.elements;
          if ((List_len(elements) !== List_len(type_elems))) {
            const _ = type_error(ctx.sink, codes$E0301, `Tuple pattern has ${Int_to_str(List_len(elements))} elements but type has ${Int_to_str(List_len(type_elems))}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("tuple arity mismatch")));
          }
          let i = 0;
          while ((i < List_len(elements))) {
            __ring_match69: {
              const __ring_m69 = [List_get(elements, i), List_get(type_elems, i)];
              if (Array.isArray(__ring_m69) && __ring_m69.length === 2 && __ring_m69[0]._tag === "some" && __ring_m69[1]._tag === "some") {
                const pat = __ring_m69[0]._0; const ty = __ring_m69[1]._0;
                bind_pattern(ctx, pat, ty, subst);
                break __ring_match69;
              }
              break __ring_match69;
            }
            i = (i + 1);
          }
          break __ring_match68;
        }
        const _ = type_error(ctx.sink, codes$E0301, `Tuple pattern requires tuple type, got ${types$type_to_string(resolved)}`, span, diagnostics$DiagnosticContext_TypeMismatch("tuple", types$type_to_string(resolved), Option_none));
        break __ring_match68;
      }
      break __ring_match65;
    }
    if (__ring_m65._tag === "OrPattern") {
      const patterns = __ring_m65.patterns; const span = __ring_m65.span;
      const __ring_iter_39 = __List_Iterable.iter(patterns);
      while (true) {
        const __ring_next_39 = __ListIterator_Iterator.next(__ring_iter_39);
        if (__ring_next_39._tag === "none") break;
        const pat = __ring_next_39._0;
        bind_pattern(ctx, pat, expected_type, subst);
      }
      break __ring_match65;
    }
    __match_fail(__ring_m65);
  }
}

function bind_constructor_pattern(ctx, name, qualifier, fields, expected_type, subst, span) {
  const enum_name = resolve_pattern_enum(ctx, name, qualifier, span);
  __ring_match70: {
    const __ring_m70 = enum_name;
    if (__ring_m70._tag === "some") {
      const ename = __ring_m70._0;
      __ring_match71: {
        const __ring_m71 = _Map_get(ctx.env.types.enums, ename);
        if (__ring_m71._tag === "some") {
          const enum_def = __ring_m71._0;
          const variant = env$lookup_variant(enum_def, name);
          __ring_match72: {
            const __ring_m72 = variant;
            if (__ring_m72._tag === "some") {
              const v = __ring_m72._0;
              const resolved_expected = env$apply_subst(subst, expected_type);
              __ring_match73: {
                const __ring_m73 = resolved_expected;
                if (__ring_m73._tag === "EnumType") {
                  const rname = __ring_m73.name;
                  if ((rname !== ename)) {
                    const _ = type_error(ctx.sink, codes$E0301, `variant '${name}' belongs to enum '${ename}', not '${rname}'`, span, diagnostics$DiagnosticContext_TypeMismatch(rname, ename, Option_none));
                  }
                  break __ring_match73;
                }
                if (__ring_m73._tag === "TypeVar") {
                  break __ring_match73;
                }
                const _ = type_error(ctx.sink, codes$E0301, `cannot destructure type '${types$type_to_string(resolved_expected)}' with constructor pattern '${name}'`, span, diagnostics$DiagnosticContext_PatternError("constructor pattern on non-enum type"));
                break __ring_match73;
              }
              const inst_map = build_instantiation_map(enum_def.type_param_vars, resolved_expected);
              if ((List_len(fields) !== List_len(v.fields))) {
                const _ = type_error(ctx.sink, codes$E0301, `constructor '${name}' has ${Int_to_str(List_len(v.fields))} field(s) but pattern has ${Int_to_str(List_len(fields))}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("constructor arity mismatch")));
              }
              let i = 0;
              while (((i < List_len(fields)) && (i < List_len(v.fields)))) {
                __ring_match74: {
                  const __ring_m74 = [List_get(fields, i), List_get(v.fields, i)];
                  if (Array.isArray(__ring_m74) && __ring_m74.length === 2 && __ring_m74[0]._tag === "some" && __ring_m74[1]._tag === "some") {
                    const fpat = __ring_m74[0]._0; const ftype = __ring_m74[1]._0;
                    const field_type = ((_Map_len(inst_map) > 0) ? env$apply_subst_map(inst_map, ftype) : ftype);
                    bind_pattern(ctx, fpat, field_type, subst);
                    break __ring_match74;
                  }
                  break __ring_match74;
                }
                i = (i + 1);
              }
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
      break __ring_match70;
    }
    if (__ring_m70._tag === "none") {
      break __ring_match70;
    }
    __match_fail(__ring_m70);
  }
}

function bind_named_constructor_pattern(ctx, name, qualifier, fields, expected_type, subst, span) {
  let resolved_qualifier = qualifier;
  __ring_match75: {
    const __ring_m75 = qualifier;
    if (__ring_m75._tag === "some") {
      const q = __ring_m75._0;
      if (((q === "self") || Str_starts_with(q, "super"))) {
        __ring_match76: {
          const __ring_m76 = resolve_relative_qualifier(q, ctx.mod_path_stack);
          if (__ring_m76._tag === "some") {
            const prefix = __ring_m76._0;
            if ((prefix === "")) {
              resolved_qualifier = Option_none;
            } else {
              resolved_qualifier = Option_some(prefix);
            }
            break __ring_match76;
          }
          if (__ring_m76._tag === "none") {
            const _ = type_error(ctx.sink, codes$E0705, `Cannot use '${q}' — relative path exceeds module nesting depth`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("relative path out of scope")));
            return;
            break __ring_match76;
          }
          __match_fail(__ring_m76);
        }
      }
      break __ring_match75;
    }
    if (__ring_m75._tag === "none") {
      break __ring_match75;
    }
    __match_fail(__ring_m75);
  }
  const enum_name = try_resolve_pattern_enum(ctx, name, resolved_qualifier);
  __ring_match77: {
    const __ring_m77 = enum_name;
    if (__ring_m77._tag === "some") {
      const ename = __ring_m77._0;
      __ring_match78: {
        const __ring_m78 = _Map_get(ctx.env.types.enums, ename);
        if (__ring_m78._tag === "some") {
          const enum_def = __ring_m78._0;
          const variant = env$lookup_variant(enum_def, name);
          __ring_match79: {
            const __ring_m79 = variant;
            if (__ring_m79._tag === "some") {
              const v = __ring_m79._0;
              __ring_match80: {
                const __ring_m80 = v.field_names;
                if (__ring_m80._tag === "some") {
                  const vfield_names = __ring_m80._0;
                  const resolved_expected = env$apply_subst(subst, expected_type);
                  __ring_match81: {
                    const __ring_m81 = resolved_expected;
                    if (__ring_m81._tag === "EnumType") {
                      const rname = __ring_m81.name;
                      if ((rname !== ename)) {
                        const _ = type_error(ctx.sink, codes$E0301, `variant '${name}' belongs to enum '${ename}', not '${rname}'`, span, diagnostics$DiagnosticContext_TypeMismatch(rname, ename, Option_none));
                      }
                      break __ring_match81;
                    }
                    break __ring_match81;
                  }
                  const inst_map = build_instantiation_map(enum_def.type_param_vars, resolved_expected);
                  const __ring_iter_40 = __List_Iterable.iter(fields);
                  while (true) {
                    const __ring_next_40 = __ListIterator_Iterator.next(__ring_iter_40);
                    if (__ring_next_40._tag === "none") break;
                    const field = __ring_next_40._0;
                    const field_idx = List_index_of(vfield_names, field.name, __Str_Eq);
                    __ring_match82: {
                      const __ring_m82 = field_idx;
                      if (__ring_m82._tag === "some") {
                        const idx = __ring_m82._0;
                        __ring_match83: {
                          const __ring_m83 = List_get(v.fields, idx);
                          if (__ring_m83._tag === "some") {
                            const ftype = __ring_m83._0;
                            const field_type = ((_Map_len(inst_map) > 0) ? env$apply_subst_map(inst_map, ftype) : ftype);
                            bind_pattern(ctx, field.pattern, field_type, subst);
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
                        const _ = type_error(ctx.sink, codes$E0301, `variant '${name}' has no field '${field.name}'`, field.span, diagnostics$DiagnosticContext_OtherContext(Option_some(`unknown field '${field.name}'`)));
                        break __ring_match82;
                      }
                      __match_fail(__ring_m82);
                    }
                  }
                  break __ring_match80;
                }
                if (__ring_m80._tag === "none") {
                  break __ring_match80;
                }
                __match_fail(__ring_m80);
              }
              break __ring_match79;
            }
            if (__ring_m79._tag === "none") {
              break __ring_match79;
            }
            __match_fail(__ring_m79);
          }
          break __ring_match78;
        }
        if (__ring_m78._tag === "none") {
          break __ring_match78;
        }
        __match_fail(__ring_m78);
      }
      break __ring_match77;
    }
    if (__ring_m77._tag === "none") {
      const struct_name = (function() {
  const __ring_m = resolved_qualifier;
  if (__ring_m._tag === "some") { const q = __ring_m._0; return `${q}::${name}`; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
      return bind_struct_pattern_fields(ctx, struct_name, name, fields, expected_type, subst, span);
      break __ring_match77;
    }
    __match_fail(__ring_m77);
  }
}

function bind_struct_pattern_fields(ctx, struct_name, display_name, fields, expected_type, subst, span) {
  __ring_match84: {
    const __ring_m84 = _Map_get(ctx.env.types.structs, struct_name);
    if (__ring_m84._tag === "some") {
      const struct_def = __ring_m84._0;
      const resolved_expected = env$apply_subst(subst, expected_type);
      const inst_map = build_instantiation_map(struct_def.type_param_vars, resolved_expected);
      const __ring_iter_41 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_41 = __ListIterator_Iterator.next(__ring_iter_41);
        if (__ring_next_41._tag === "none") break;
        const field = __ring_next_41._0;
        const found = ((__a) => { const __i = __a.findIndex((function(sf) { return (sf.name === field.name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(struct_def.fields);
        __ring_match85: {
          const __ring_m85 = found;
          if (__ring_m85._tag === "some") {
            const sf = __ring_m85._0;
            const field_type = ((_Map_len(inst_map) > 0) ? env$apply_subst_map(inst_map, sf.ty) : sf.ty);
            bind_pattern(ctx, field.pattern, field_type, subst);
            break __ring_match85;
          }
          if (__ring_m85._tag === "none") {
            const _ = type_error(ctx.sink, codes$E0301, `struct '${display_name}' has no field '${field.name}'`, field.span, diagnostics$DiagnosticContext_OtherContext(Option_some(`unknown field '${field.name}'`)));
            break __ring_match85;
          }
          __match_fail(__ring_m85);
        }
      }
      break __ring_match84;
    }
    if (__ring_m84._tag === "none") {
      if ((List_len(ctx.mod_path_stack) > 0)) {
        const mod_prefix = List_join(ctx.mod_path_stack, "::");
        const full_name = `${mod_prefix}::${struct_name}`;
        __ring_match86: {
          const __ring_m86 = _Map_get(ctx.env.types.structs, full_name);
          if (__ring_m86._tag === "some") {
            const sdef = __ring_m86._0;
            const resolved_expected = env$apply_subst(subst, expected_type);
            const inst_map = build_instantiation_map(sdef.type_param_vars, resolved_expected);
            const __ring_iter_42 = __List_Iterable.iter(fields);
            while (true) {
              const __ring_next_42 = __ListIterator_Iterator.next(__ring_iter_42);
              if (__ring_next_42._tag === "none") break;
              const field = __ring_next_42._0;
              const found = ((__a) => { const __i = __a.findIndex((function(sf) { return (sf.name === field.name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(sdef.fields);
              __ring_match87: {
                const __ring_m87 = found;
                if (__ring_m87._tag === "some") {
                  const sf = __ring_m87._0;
                  const field_type = ((_Map_len(inst_map) > 0) ? env$apply_subst_map(inst_map, sf.ty) : sf.ty);
                  bind_pattern(ctx, field.pattern, field_type, subst);
                  break __ring_match87;
                }
                if (__ring_m87._tag === "none") {
                  break __ring_match87;
                }
                __match_fail(__ring_m87);
              }
            }
            break __ring_match86;
          }
          if (__ring_m86._tag === "none") {
            break __ring_match86;
          }
          __match_fail(__ring_m86);
        }
      }
      break __ring_match84;
    }
    __match_fail(__ring_m84);
  }
}

function try_resolve_pattern_enum(ctx, variant_name, qualifier) {
  __ring_match88: {
    const __ring_m88 = qualifier;
    if (__ring_m88._tag === "some") {
      const q = __ring_m88._0;
      const direct = _Map_get(ctx.env.types.enums, q);
      __ring_match89: {
        const __ring_m89 = direct;
        if (__ring_m89._tag === "some") {
          const enum_def = __ring_m89._0;
          if (_Map_contains_key(enum_def.variant_index, variant_name)) {
            return Option_some(enum_def.name);
          }
          return Option_none;
          break __ring_match89;
        }
        if (__ring_m89._tag === "none") {
          break __ring_match89;
        }
        __match_fail(__ring_m89);
      }
      if ((List_len(ctx.mod_path_stack) > 0)) {
        const mod_prefix = List_join(ctx.mod_path_stack, "::");
        const full_q = `${mod_prefix}::${q}`;
        const fallback = _Map_get(ctx.env.types.enums, full_q);
        __ring_match90: {
          const __ring_m90 = fallback;
          if (__ring_m90._tag === "some") {
            const enum_def2 = __ring_m90._0;
            if (_Map_contains_key(enum_def2.variant_index, variant_name)) {
              return Option_some(enum_def2.name);
            }
            break __ring_match90;
          }
          if (__ring_m90._tag === "none") {
            break __ring_match90;
          }
          __match_fail(__ring_m90);
        }
      }
      return Option_none;
      break __ring_match88;
    }
    if (__ring_m88._tag === "none") {
      return _Map_get(ctx.env.types.variant_to_enum, variant_name);
      break __ring_match88;
    }
    __match_fail(__ring_m88);
  }
}

function resolve_pattern_enum(ctx, variant_name, qualifier, span) {
  __ring_match91: {
    const __ring_m91 = qualifier;
    if (__ring_m91._tag === "some") {
      const q = __ring_m91._0;
      const direct = _Map_get(ctx.env.types.enums, q);
      __ring_match92: {
        const __ring_m92 = direct;
        if (__ring_m92._tag === "some") {
          const enum_def = __ring_m92._0;
          if (_Map_contains_key(enum_def.variant_index, variant_name)) {
            return Option_some(enum_def.name);
          }
          const _ = type_error(ctx.sink, codes$E0201, `'${q}' has no variant '${variant_name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(variant_name, Option_none));
          return Option_none;
          break __ring_match92;
        }
        if (__ring_m92._tag === "none") {
          break __ring_match92;
        }
        __match_fail(__ring_m92);
      }
      if ((List_len(ctx.mod_path_stack) > 0)) {
        const mod_prefix = List_join(ctx.mod_path_stack, "::");
        const full_q = `${mod_prefix}::${q}`;
        const fallback = _Map_get(ctx.env.types.enums, full_q);
        __ring_match93: {
          const __ring_m93 = fallback;
          if (__ring_m93._tag === "some") {
            const enum_def2 = __ring_m93._0;
            if (_Map_contains_key(enum_def2.variant_index, variant_name)) {
              return Option_some(enum_def2.name);
            }
            break __ring_match93;
          }
          if (__ring_m93._tag === "none") {
            break __ring_match93;
          }
          __match_fail(__ring_m93);
        }
      }
      const _ = type_error(ctx.sink, codes$E0201, `'${q}' has no variant '${variant_name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(variant_name, Option_none));
      return Option_none;
      break __ring_match91;
    }
    if (__ring_m91._tag === "none") {
      return _Map_get(ctx.env.types.variant_to_enum, variant_name);
      break __ring_match91;
    }
    __match_fail(__ring_m91);
  }
}

function build_instantiation_map(type_param_vars, resolved_expected) {
  let inst_map = map_new();
  __ring_match94: {
    const __ring_m94 = resolved_expected;
    if (__ring_m94._tag === "EnumType") {
      const type_params = __ring_m94.type_params;
      let i = 0;
      while (((i < List_len(type_param_vars)) && (i < List_len(type_params)))) {
        __ring_match95: {
          const __ring_m95 = [List_get(type_param_vars, i), List_get(type_params, i)];
          if (Array.isArray(__ring_m95) && __ring_m95.length === 2 && __ring_m95[0]._tag === "some" && __ring_m95[1]._tag === "some") {
            const var_id = __ring_m95[0]._0; const tp = __ring_m95[1]._0;
            _Map_insert(inst_map, var_id, tp);
            break __ring_match95;
          }
          break __ring_match95;
        }
        i = (i + 1);
      }
      break __ring_match94;
    }
    if (__ring_m94._tag === "StructType") {
      const type_params = __ring_m94.type_params;
      let i = 0;
      while (((i < List_len(type_param_vars)) && (i < List_len(type_params)))) {
        __ring_match96: {
          const __ring_m96 = [List_get(type_param_vars, i), List_get(type_params, i)];
          if (Array.isArray(__ring_m96) && __ring_m96.length === 2 && __ring_m96[0]._tag === "some" && __ring_m96[1]._tag === "some") {
            const var_id = __ring_m96[0]._0; const tp = __ring_m96[1]._0;
            _Map_insert(inst_map, var_id, tp);
            break __ring_match96;
          }
          break __ring_match96;
        }
        i = (i + 1);
      }
      break __ring_match94;
    }
    break __ring_match94;
  }
  return inst_map;
}

function remove_fail_effect(row) {
  const filtered = row.effects.filter((function(e) { return (function() {
  const __ring_m = e;
  if (__ring_m._tag === "FailEffect") { return false; }
  return true;
})(); }));
  return new types$EffectRow(filtered, row.tail);
}

function resolve_relative_qualifier(qualifier, mod_path_stack) {
  if ((qualifier === "self")) {
    if ((List_len(mod_path_stack) === 0)) {
      return Option_none;
    }
    return Option_some(List_join(mod_path_stack, "::"));
  }
  const parts = Str_split(qualifier, "::");
  let super_count = 0;
  const __ring_iter_43 = __List_Iterable.iter(parts);
  while (true) {
    const __ring_next_43 = __ListIterator_Iterator.next(__ring_iter_43);
    if (__ring_next_43._tag === "none") break;
    const part = __ring_next_43._0;
    if ((part === "super")) {
      super_count = (super_count + 1);
    } else {
      break;
    }
  }
  if ((super_count === 0)) {
    return Option_none;
  }
  if ((super_count > List_len(mod_path_stack))) {
    return Option_none;
  }
  const remaining = (List_len(mod_path_stack) - super_count);
  let resolved_parts = [];
  let i = 0;
  while ((i < remaining)) {
    List_push(resolved_parts, Option_unwrap_or(List_get(mod_path_stack, i), ""));
    i = (i + 1);
  }
  let j = super_count;
  while ((j < List_len(parts))) {
    List_push(resolved_parts, Option_unwrap_or(List_get(parts, j), ""));
    j = (j + 1);
  }
  if ((List_len(resolved_parts) === 0)) {
    return Option_some("");
  }
  return Option_some(List_join(resolved_parts, "::"));
}

function __StringBuilder_Eq_eq(self, other) {
  return true;
}
const __StringBuilder_Eq = { eq: __StringBuilder_Eq_eq, ne: function(self, other) { return !__StringBuilder_Eq_eq(self, other); } };

function __FnBoundsEntry_Eq_eq(self, other) {
  return (self.type_param_var_id === other.type_param_var_id) && (self.trait_name === other.trait_name) && (self.type_param_name === other.type_param_name);
}
const __FnBoundsEntry_Eq = { eq: __FnBoundsEntry_Eq_eq, ne: function(self, other) { return !__FnBoundsEntry_Eq_eq(self, other); } };

function __CompileError_Eq_eq(self, other) {
  return true;
}
const __CompileError_Eq = { eq: __CompileError_Eq_eq, ne: function(self, other) { return !__CompileError_Eq_eq(self, other); } };

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

function __StringBuilder_Clone_clone(self) {
  return new StringBuilder();
}
const __StringBuilder_Clone = { clone: __StringBuilder_Clone_clone };

function __FnBoundsEntry_Clone_clone(self) {
  return new FnBoundsEntry(self.type_param_var_id, self.trait_name, self.type_param_name);
}
const __FnBoundsEntry_Clone = { clone: __FnBoundsEntry_Clone_clone };

function __CompileError_Clone_clone(self) {
  return new CompileError();
}
const __CompileError_Clone = { clone: __CompileError_Clone_clone };

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

function __FnBoundsEntry_Ord_cmp(self, other) {
  var c;
  c = (self.type_param_var_id < other.type_param_var_id ? -1 : self.type_param_var_id > other.type_param_var_id ? 1 : 0);
  if (c !== 0) return c;
  c = (self.trait_name < other.trait_name ? -1 : self.trait_name > other.trait_name ? 1 : 0);
  if (c !== 0) return c;
  return (self.type_param_name < other.type_param_name ? -1 : self.type_param_name > other.type_param_name ? 1 : 0);
}
const __FnBoundsEntry_Ord = { cmp: __FnBoundsEntry_Ord_cmp };

function __CompileError_Ord_cmp(self, other) {
  return 0;
}
const __CompileError_Ord = { cmp: __CompileError_Ord_cmp };

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

function __StringBuilder_Debug_debug(self) {
  return "StringBuilder";
}
const __StringBuilder_Debug = { debug: __StringBuilder_Debug_debug };

function __FnBoundsEntry_Debug_debug(self) {
  return "FnBoundsEntry { " + "type_param_var_id: " + String(self.type_param_var_id) + ", " + "trait_name: " + String(self.trait_name) + ", " + "type_param_name: " + String(self.type_param_name) + " }";
}
const __FnBoundsEntry_Debug = { debug: __FnBoundsEntry_Debug_debug };

function __CompileError_Debug_debug(self) {
  return "CompileError";
}
const __CompileError_Debug = { debug: __CompileError_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { InferResult, FnBoundsEntry, CompileError, InferCtx, new_infer_ctx, type_error, type_error_with_notes, merge_effects, unify_at, unify_at_noted, free_type_vars, collect_free_vars, free_type_vars_in_env, generalize, update_fn_effects, build_scheme_var_map, resolve_dicts_from_scheme, resolve_type_expr, resolve_self_type, resolve_named_type, bind_pattern, remove_fail_effect, resolve_relative_qualifier, __FnBoundsEntry_Eq, __CompileError_Eq, __FnBoundsEntry_Clone, __CompileError_Clone, __FnBoundsEntry_Ord, __CompileError_Ord, __FnBoundsEntry_Debug, __CompileError_Debug };