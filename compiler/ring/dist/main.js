import { __EffectAbort, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_first, List_last, List_contains, List_is_empty, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_is_empty, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_is_empty, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, empty_types as types$empty_types, empty_effects as types$empty_effects, empty_fields as types$empty_fields, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_OrExpr as ast$Expr_OrExpr, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_OptionUnwrap as ast$Expr_OptionUnwrap, Expr_TryBlock as ast$Expr_TryBlock, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_OptionUnwrap as hir$HExpr_OptionUnwrap, HExpr_TryBlock as hir$HExpr_TryBlock, HExpr_OptionOr as hir$HExpr_OptionOr, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0706 as codes$E0706, error_description as codes$error_description } from "./codes.js";
import { CELL_METHODS as builtin_methods$CELL_METHODS, STR_METHODS as builtin_methods$STR_METHODS, INT_METHODS as builtin_methods$INT_METHODS, FLOAT_METHODS as builtin_methods$FLOAT_METHODS, LIST_NON_HOF_METHODS as builtin_methods$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as builtin_methods$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as builtin_methods$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as builtin_methods$MAP_HOF_METHODS, SET_NON_HOF_METHODS as builtin_methods$SET_NON_HOF_METHODS, SET_HOF_METHODS as builtin_methods$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as builtin_methods$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as builtin_methods$OPTION_HOF_METHODS } from "./builtin_methods.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { format_human as formatter$format_human, format_llm as formatter$format_llm } from "./formatter.js";
import { token_kind_value as lexer$token_kind_value, new_lexer as lexer$new_lexer, TokenKind_TkFn as lexer$TokenKind_TkFn, TokenKind_TkLet as lexer$TokenKind_TkLet, TokenKind_TkVar as lexer$TokenKind_TkVar, TokenKind_TkStruct as lexer$TokenKind_TkStruct, TokenKind_TkEnum as lexer$TokenKind_TkEnum, TokenKind_TkMatch as lexer$TokenKind_TkMatch, TokenKind_TkImpl as lexer$TokenKind_TkImpl, TokenKind_TkEffect as lexer$TokenKind_TkEffect, TokenKind_TkHandle as lexer$TokenKind_TkHandle, TokenKind_TkWith as lexer$TokenKind_TkWith, TokenKind_TkIf as lexer$TokenKind_TkIf, TokenKind_TkElse as lexer$TokenKind_TkElse, TokenKind_TkOr as lexer$TokenKind_TkOr, TokenKind_TkCatch as lexer$TokenKind_TkCatch, TokenKind_TkTest as lexer$TokenKind_TkTest, TokenKind_TkReturn as lexer$TokenKind_TkReturn, TokenKind_TkFor as lexer$TokenKind_TkFor, TokenKind_TkIn as lexer$TokenKind_TkIn, TokenKind_TkPub as lexer$TokenKind_TkPub, TokenKind_TkWhere as lexer$TokenKind_TkWhere, TokenKind_TkTrue as lexer$TokenKind_TkTrue, TokenKind_TkFalse as lexer$TokenKind_TkFalse, TokenKind_TkTrait as lexer$TokenKind_TkTrait, TokenKind_TkTry as lexer$TokenKind_TkTry, TokenKind_TkWhile as lexer$TokenKind_TkWhile, TokenKind_TkBreak as lexer$TokenKind_TkBreak, TokenKind_TkContinue as lexer$TokenKind_TkContinue, TokenKind_TkUse as lexer$TokenKind_TkUse, TokenKind_TkAs as lexer$TokenKind_TkAs, TokenKind_TkExtern as lexer$TokenKind_TkExtern, TokenKind_TkIntLit as lexer$TokenKind_TkIntLit, TokenKind_TkFloatLit as lexer$TokenKind_TkFloatLit, TokenKind_TkStringLit as lexer$TokenKind_TkStringLit, TokenKind_TkStringInterpStart as lexer$TokenKind_TkStringInterpStart, TokenKind_TkStringInterpMiddle as lexer$TokenKind_TkStringInterpMiddle, TokenKind_TkStringInterpEnd as lexer$TokenKind_TkStringInterpEnd, TokenKind_TkRawStringLit as lexer$TokenKind_TkRawStringLit, TokenKind_TkIdent as lexer$TokenKind_TkIdent, TokenKind_TkPlus as lexer$TokenKind_TkPlus, TokenKind_TkMinus as lexer$TokenKind_TkMinus, TokenKind_TkStar as lexer$TokenKind_TkStar, TokenKind_TkSlash as lexer$TokenKind_TkSlash, TokenKind_TkPercent as lexer$TokenKind_TkPercent, TokenKind_TkEqEq as lexer$TokenKind_TkEqEq, TokenKind_TkBangEq as lexer$TokenKind_TkBangEq, TokenKind_TkLt as lexer$TokenKind_TkLt, TokenKind_TkGt as lexer$TokenKind_TkGt, TokenKind_TkLtEq as lexer$TokenKind_TkLtEq, TokenKind_TkGtEq as lexer$TokenKind_TkGtEq, TokenKind_TkAmpAmp as lexer$TokenKind_TkAmpAmp, TokenKind_TkPipePipe as lexer$TokenKind_TkPipePipe, TokenKind_TkBang as lexer$TokenKind_TkBang, TokenKind_TkEq as lexer$TokenKind_TkEq, TokenKind_TkPlusEq as lexer$TokenKind_TkPlusEq, TokenKind_TkMinusEq as lexer$TokenKind_TkMinusEq, TokenKind_TkLParen as lexer$TokenKind_TkLParen, TokenKind_TkRParen as lexer$TokenKind_TkRParen, TokenKind_TkLBrace as lexer$TokenKind_TkLBrace, TokenKind_TkRBrace as lexer$TokenKind_TkRBrace, TokenKind_TkLBracket as lexer$TokenKind_TkLBracket, TokenKind_TkRBracket as lexer$TokenKind_TkRBracket, TokenKind_TkComma as lexer$TokenKind_TkComma, TokenKind_TkColon as lexer$TokenKind_TkColon, TokenKind_TkColonColon as lexer$TokenKind_TkColonColon, TokenKind_TkDot as lexer$TokenKind_TkDot, TokenKind_TkDotDot as lexer$TokenKind_TkDotDot, TokenKind_TkDotDotEq as lexer$TokenKind_TkDotDotEq, TokenKind_TkFatArrow as lexer$TokenKind_TkFatArrow, TokenKind_TkArrow as lexer$TokenKind_TkArrow, TokenKind_TkQuestion as lexer$TokenKind_TkQuestion, TokenKind_TkSemi as lexer$TokenKind_TkSemi, TokenKind_TkEof as lexer$TokenKind_TkEof, TokenKind_TkError as lexer$TokenKind_TkError, Token as lexer$Token, Lexer as lexer$Lexer, __TokenKind_Eq as lexer$__TokenKind_Eq, __Token_Eq as lexer$__Token_Eq, __Lexer_Clone as lexer$__Lexer_Clone, __TokenKind_Clone as lexer$__TokenKind_Clone, __Token_Clone as lexer$__Token_Clone, __TokenKind_Ord as lexer$__TokenKind_Ord, __Token_Ord as lexer$__Token_Ord, __Lexer_Debug as lexer$__Lexer_Debug, __TokenKind_Debug as lexer$__TokenKind_Debug, __Token_Debug as lexer$__Token_Debug, Lexer_tokenize as lexer$Lexer_tokenize, Lexer_next_token as lexer$Lexer_next_token, Lexer_lex_string as lexer$Lexer_lex_string, Lexer_lex_string_continuation as lexer$Lexer_lex_string_continuation, Lexer_lex_string_body as lexer$Lexer_lex_string_body, Lexer_lex_raw_string as lexer$Lexer_lex_raw_string, Lexer_lex_number as lexer$Lexer_lex_number, Lexer_lex_ident as lexer$Lexer_lex_ident, Lexer_lex_punctuation as lexer$Lexer_lex_punctuation, Lexer_skip_whitespace_and_comments as lexer$Lexer_skip_whitespace_and_comments, Lexer_peek as lexer$Lexer_peek, Lexer_advance as lexer$Lexer_advance, Lexer_current_position as lexer$Lexer_current_position, Lexer_make_token as lexer$Lexer_make_token, Lexer_inc_last_depth as lexer$Lexer_inc_last_depth, Lexer_dec_last_depth as lexer$Lexer_dec_last_depth, Lexer_reset_last_depth as lexer$Lexer_reset_last_depth } from "./lexer.js";
import { PREC_NONE as parser$PREC_NONE, PREC_OR as parser$PREC_OR, PREC_CATCH as parser$PREC_CATCH, PREC_LOGIC_OR as parser$PREC_LOGIC_OR, PREC_LOGIC_AND as parser$PREC_LOGIC_AND, PREC_EQUALITY as parser$PREC_EQUALITY, PREC_COMPARE as parser$PREC_COMPARE, PREC_RANGE as parser$PREC_RANGE, PREC_ADD_SUB as parser$PREC_ADD_SUB, PREC_MUL_DIV as parser$PREC_MUL_DIV, PREC_UNARY as parser$PREC_UNARY, PREC_POSTFIX as parser$PREC_POSTFIX, infix_precedence as parser$infix_precedence, expr_span as parser$expr_span, new_parser as parser$new_parser, parse as parser$parse, Parser as parser$Parser, __Parser_Clone as parser$__Parser_Clone, __Parser_Debug as parser$__Parser_Debug, Parser_peek as parser$Parser_peek, Parser_advance as parser$Parser_advance, Parser_check as parser$Parser_check, Parser_try_consume as parser$Parser_try_consume, Parser_expect as parser$Parser_expect, Parser_at_end as parser$Parser_at_end, Parser_current_span_start as parser$Parser_current_span_start, Parser_make_span as parser$Parser_make_span, Parser_report_error as parser$Parser_report_error, Parser_error as parser$Parser_error, Parser_parse_program as parser$Parser_parse_program, Parser_parse_stmt as parser$Parser_parse_stmt, Parser_parse_while_stmt as parser$Parser_parse_while_stmt, Parser_parse_for_in_stmt as parser$Parser_parse_for_in_stmt, Parser_parse_break_stmt as parser$Parser_parse_break_stmt, Parser_parse_continue_stmt as parser$Parser_parse_continue_stmt, Parser_parse_if_let_stmt as parser$Parser_parse_if_let_stmt, Parser_parse_binding_stmt as parser$Parser_parse_binding_stmt, Parser_parse_return_stmt as parser$Parser_parse_return_stmt, Parser_parse_block_expr as parser$Parser_parse_block_expr, Parser_parse_use_decl as parser$Parser_parse_use_decl, Parser_parse_decl as parser$Parser_parse_decl, Parser_parse_fn_decl as parser$Parser_parse_fn_decl, Parser_parse_extern_decl as parser$Parser_parse_extern_decl, Parser_parse_extern_fn_decl_body as parser$Parser_parse_extern_fn_decl_body, Parser_parse_extern_type_decl_body as parser$Parser_parse_extern_type_decl_body, Parser_parse_type_alias_decl as parser$Parser_parse_type_alias_decl, Parser_parse_struct_decl as parser$Parser_parse_struct_decl, Parser_parse_enum_decl as parser$Parser_parse_enum_decl, Parser_parse_impl_decl as parser$Parser_parse_impl_decl, Parser_parse_effect_decl as parser$Parser_parse_effect_decl, Parser_parse_test_decl as parser$Parser_parse_test_decl, Parser_parse_trait_decl as parser$Parser_parse_trait_decl, Parser_parse_expr as parser$Parser_parse_expr, Parser_parse_expr_bp as parser$Parser_parse_expr_bp, Parser_parse_prefix as parser$Parser_parse_prefix, Parser_parse_dot_expr as parser$Parser_parse_dot_expr, Parser_parse_call_expr as parser$Parser_parse_call_expr, Parser_parse_arg_list as parser$Parser_parse_arg_list, Parser_parse_or_expr as parser$Parser_parse_or_expr, Parser_parse_catch_expr as parser$Parser_parse_catch_expr, Parser_parse_string_interp as parser$Parser_parse_string_interp, Parser_parse_if_expr as parser$Parser_parse_if_expr, Parser_parse_match_expr as parser$Parser_parse_match_expr, Parser_parse_match_arm as parser$Parser_parse_match_arm, Parser_parse_pattern as parser$Parser_parse_pattern, Parser_parse_handle_expr as parser$Parser_parse_handle_expr, Parser_parse_effect_handler as parser$Parser_parse_effect_handler, Parser_parse_lambda_expr as parser$Parser_parse_lambda_expr, Parser_parse_struct_literal as parser$Parser_parse_struct_literal, Parser_try_parse_type_args as parser$Parser_try_parse_type_args, Parser_parse_type_expr as parser$Parser_parse_type_expr, Parser_parse_record_type_expr as parser$Parser_parse_record_type_expr, Parser_parse_type_params as parser$Parser_parse_type_params, Parser_parse_type_bound as parser$Parser_parse_type_bound, Parser_parse_params as parser$Parser_parse_params, Parser_parse_param as parser$Parser_parse_param } from "./parser.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, FnBound as env$FnBound, Scope as env$Scope, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __ImplEntry_Clone as env$__ImplEntry_Clone, __FnBound_Clone as env$__FnBound_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __ImplEntry_Debug as env$__ImplEntry_Debug, __FnBound_Debug as env$__FnBound_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { get_or_create_methods as builtins$get_or_create_methods, register_builtins as builtins$register_builtins, register_hof_intrinsics as builtins$register_hof_intrinsics } from "./builtins.js";
import { empty_subst as unify$empty_subst, occurs_in as unify$occurs_in, unify_effect_rows as unify$unify_effect_rows, unify as unify$unify, UnificationError as unify$UnificationError, __UnificationError_Eq as unify$__UnificationError_Eq, __UnificationError_Clone as unify$__UnificationError_Clone, __UnificationError_Ord as unify$__UnificationError_Ord, __UnificationError_Debug as unify$__UnificationError_Debug } from "./unify.js";
import { empty_fn_bounds as infer_ctx$empty_fn_bounds, new_infer_ctx as infer_ctx$new_infer_ctx, type_error as infer_ctx$type_error, merge_effects as infer_ctx$merge_effects, unify_at as infer_ctx$unify_at, free_type_vars as infer_ctx$free_type_vars, collect_free_vars as infer_ctx$collect_free_vars, free_type_vars_in_env as infer_ctx$free_type_vars_in_env, generalize as infer_ctx$generalize, update_fn_effects as infer_ctx$update_fn_effects, build_scheme_var_map as infer_ctx$build_scheme_var_map, resolve_dicts_from_scheme as infer_ctx$resolve_dicts_from_scheme, resolve_type_expr as infer_ctx$resolve_type_expr, resolve_self_type as infer_ctx$resolve_self_type, resolve_named_type as infer_ctx$resolve_named_type, bind_pattern as infer_ctx$bind_pattern, remove_fail_effect as infer_ctx$remove_fail_effect, remove_specific_fail_effect as infer_ctx$remove_specific_fail_effect, InferResult as infer_ctx$InferResult, FnBoundsEntry as infer_ctx$FnBoundsEntry, CompileError as infer_ctx$CompileError, InferCtx as infer_ctx$InferCtx, __FnBoundsEntry_Eq as infer_ctx$__FnBoundsEntry_Eq, __CompileError_Eq as infer_ctx$__CompileError_Eq, __FnBoundsEntry_Clone as infer_ctx$__FnBoundsEntry_Clone, __CompileError_Clone as infer_ctx$__CompileError_Clone, __FnBoundsEntry_Ord as infer_ctx$__FnBoundsEntry_Ord, __CompileError_Ord as infer_ctx$__CompileError_Ord, __FnBoundsEntry_Debug as infer_ctx$__FnBoundsEntry_Debug, __CompileError_Debug as infer_ctx$__CompileError_Debug } from "./infer_ctx.js";
import { register_decl_public as infer_register$register_decl_public, register_decls_two_phase as infer_register$register_decls_two_phase } from "./infer_register.js";

function main(__ring_ev_fail) {
  const t = types$INT();
  print(types$type_to_string(t));
  print(types$type_to_string(types$FLOAT()));
  print(types$type_to_string(types$STR()));
  const opt = types$make_option_type(types$INT());
  print(types$type_to_string(opt));
  if (types$types_equal(types$INT(), types$INT())) {
    print("INT == INT: true");
  }
  if ((!types$types_equal(types$INT(), types$FLOAT()))) {
    print("INT == FLOAT: false");
  }
  const row = types$EMPTY_ROW();
  print(`empty row effects: ${Int_to_str(List_len(row.effects))}`);
  const s = ast$span_zero();
  print(`span file: ${s.file}`);
  print(hir$variant_js_name("Option", "some"));
  print(hir$trait_dict_name("Int", "Eq"));
  print(hir$evidence_param_name("io"));
  print(hir$ENUM_TAG_FIELD());
  print(codes$E0301());
  print(codes$error_description("E0301"));
  const methods = builtin_methods$STR_METHODS();
  print(`Str methods count: ${Int_to_str(List_len(methods))}`);
  const hof = builtin_methods$LIST_HOF_METHODS();
  print(`List HOF methods count: ${Int_to_str(List_len(hof))}`);
  const sink = diagnostics$new_collecting_sink();
  assert((!diagnostics$CollectingSink_has_errors(sink)), "empty sink has no errors");
  const test_span = ast$span_zero();
  const d = diagnostics$make_diag("E0301", diagnostics$Severity_SevError, "Type mismatch", test_span, diagnostics$DiagnosticContext_TypeMismatch("Int", "Str", Option_none));
  diagnostics$CollectingSink_report(sink, d);
  assert(diagnostics$CollectingSink_has_errors(sink), "sink has errors after report");
  assert((List_len(diagnostics$CollectingSink_diagnostics(sink)) === 1), "one diagnostic");
  print(`severity: ${diagnostics$severity_to_str(diagnostics$Severity_SevError)}`);
  const fmt_source = "let x: Int = \"hello\"";
  const fmt_out = formatter$format_human(diagnostics$CollectingSink_diagnostics(sink), fmt_source);
  print(`format_human output length: ${Int_to_str(Str_len(fmt_out))}`);
  const llm_out = formatter$format_llm(diagnostics$CollectingSink_diagnostics(sink), "test.ring");
  assert(Str_contains(llm_out, "\"version\": 1"), "llm format has version");
  assert(Str_contains(llm_out, "\"code\": \"E0301\""), "llm format has code");
  print("format_llm ok");
  const lex_source = "fn main() { let x = 42 }";
  let lexer = lexer$new_lexer(lex_source, "<test>", diagnostics$new_collecting_sink());
  const tokens = lexer$Lexer_tokenize(lexer);
  print(`token count: ${Int_to_str(List_len(tokens))}`);
  const first = List_get(tokens, 0);
  __ring_match0: {
    const __ring_m0 = first;
    if (__ring_m0._tag === "some") {
      const tok = __ring_m0._0;
      assert((lexer$token_kind_value(tok.kind) === "fn"), "first token is fn");
      print(`first token: ${lexer$token_kind_value(tok.kind)}`);
      break __ring_match0;
    }
    if (__ring_m0._tag === "none") {
      panic("no tokens");
      break __ring_match0;
    }
    __match_fail(__ring_m0);
  }
  let lex2 = lexer$new_lexer("\"hello ${x} world\"", "<test>", diagnostics$new_collecting_sink());
  const tokens2 = lexer$Lexer_tokenize(lex2);
  const first2 = List_get(tokens2, 0);
  __ring_match1: {
    const __ring_m1 = first2;
    if (__ring_m1._tag === "some") {
      const tok = __ring_m1._0;
      assert((lexer$token_kind_value(tok.kind) === "string_interp_start"), "interp start");
      assert((tok.value === "hello "), "interp start value");
      break __ring_match1;
    }
    if (__ring_m1._tag === "none") {
      panic("no tokens");
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
  print("string interpolation lexing ok");
  let lex3 = lexer$new_lexer("x >= 0 && y != 1", "<test>", diagnostics$new_collecting_sink());
  const tokens3 = lexer$Lexer_tokenize(lex3);
  print(`operator token count: ${Int_to_str(List_len(tokens3))}`);
  const prog = parser$parse("fn main() { let x = 42 }", "<test>");
  assert((List_len(prog.decls) === 1), "one decl");
  __ring_match2: {
    const __ring_m2 = List_get(prog.decls, 0);
    if (__ring_m2._tag === "some") {
      const decl = __ring_m2._0;
      __ring_match3: {
        const __ring_m3 = decl;
        if (__ring_m3._tag === "Fn") {
          const name = __ring_m3.name; const params = __ring_m3.params;
          assert((name === "main"), "fn name is main");
          assert((List_len(params) === 0), "main has no params");
          break __ring_match3;
        }
        panic("expected fn decl");
        break __ring_match3;
      }
      break __ring_match2;
    }
    if (__ring_m2._tag === "none") {
      panic("no decls");
      break __ring_match2;
    }
    __match_fail(__ring_m2);
  }
  print("parser: simple fn ok");
  const prog2 = parser$parse("struct Point { x: Int, y: Int }", "<test>");
  assert((List_len(prog2.decls) === 1), "one struct decl");
  __ring_match4: {
    const __ring_m4 = List_get(prog2.decls, 0);
    if (__ring_m4._tag === "some") {
      const decl = __ring_m4._0;
      __ring_match5: {
        const __ring_m5 = decl;
        if (__ring_m5._tag === "Struct") {
          const name = __ring_m5.name; const fields = __ring_m5.fields;
          assert((name === "Point"), "struct name is Point");
          assert((List_len(fields) === 2), "Point has 2 fields");
          break __ring_match5;
        }
        panic("expected struct decl");
        break __ring_match5;
      }
      break __ring_match4;
    }
    if (__ring_m4._tag === "none") {
      panic("no decls");
      break __ring_match4;
    }
    __match_fail(__ring_m4);
  }
  print("parser: struct ok");
  const prog3 = parser$parse("enum Color { Red, Green, Blue }", "<test>");
  assert((List_len(prog3.decls) === 1), "one enum decl");
  __ring_match6: {
    const __ring_m6 = List_get(prog3.decls, 0);
    if (__ring_m6._tag === "some") {
      const decl = __ring_m6._0;
      __ring_match7: {
        const __ring_m7 = decl;
        if (__ring_m7._tag === "Enum") {
          const name = __ring_m7.name; const variants = __ring_m7.variants;
          assert((name === "Color"), "enum name is Color");
          assert((List_len(variants) === 3), "Color has 3 variants");
          break __ring_match7;
        }
        panic("expected enum decl");
        break __ring_match7;
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      panic("no decls");
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
  print("parser: enum ok");
  const prog4 = parser$parse("fn f() { 1 + 2 * 3 }", "<test>");
  assert((List_len(prog4.decls) === 1), "one decl for expr");
  print("parser: operators ok");
  const prog5 = parser$parse("use foo::{bar, baz}\nfn main() {}", "<test>");
  assert((List_len(prog5.uses) === 1), "one use decl");
  assert((List_len(prog5.decls) === 1), "one fn decl after use");
  print("parser: use decl ok");
  const ts = env$mono(types$INT());
  assert((List_len(ts.type_vars) === 0), "mono has no type_vars");
  assert((List_len(ts.bounds) === 0), "mono has no bounds");
  assert(Option_is_none(ts.def_id), "mono has no def_id");
  print("env: mono ok");
  let env = env$new_type_env();
  assert((List_len(env.scopes) === 1), "initial scope count");
  assert((env$TypeEnv_current_var_id(env) === 0), "initial var id");
  print("env: new_type_env ok");
  const v1 = env$TypeEnv_fresh_var(env);
  const v2 = env$TypeEnv_fresh_var(env);
  assert((env$TypeEnv_current_var_id(env) === 2), "var id after 2 fresh");
  print("env: fresh_var ok");
  env$TypeEnv_push_scope(env);
  assert((List_len(env.scopes) === 2), "2 scopes after push");
  env$TypeEnv_bind_mono(env, "x", types$INT());
  __ring_match8: {
    const __ring_m8 = env$TypeEnv_lookup(env, "x");
    if (__ring_m8._tag === "some") {
      const ts_x = __ring_m8._0;
      print("env: lookup x ok");
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      panic("lookup x failed");
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
  env$TypeEnv_pop_scope(env);
  assert((List_len(env.scopes) === 1), "1 scope after pop");
  assert(Option_is_none(env$TypeEnv_lookup(env, "x")), "x not found after pop");
  print("env: scope management ok");
  const tv_id = env$TypeEnv_fresh_var_id(env);
  const scheme = new env$TypeScheme(types$Type_FnType([types$Type_TypeVar(tv_id, Option_none)], types$Type_TypeVar(tv_id, Option_none), types$EMPTY_ROW()), [tv_id], [new env$SchemeBound(tv_id, "Eq")], Option_none);
  const instantiated = env$TypeEnv_instantiate(env, scheme);
  __ring_match9: {
    const __ring_m9 = instantiated;
    if (__ring_m9._tag === "FnType") {
      const params = __ring_m9.params;
      print("env: instantiate ok");
      break __ring_match9;
    }
    panic("instantiate should return FnType");
    break __ring_match9;
  }
  const subst = map_new();
  _Map_insert(subst, 99, types$INT());
  const substituted = env$apply_subst(subst, types$Type_TypeVar(99, Option_none));
  __ring_match10: {
    const __ring_m10 = substituted;
    if (__ring_m10._tag === "IntType") {
      print("env: apply_subst ok");
      break __ring_match10;
    }
    panic("apply_subst failed");
    break __ring_match10;
  }
  let env2 = env$new_type_env();
  builtins$register_builtins(env2);
  assert(_Map_contains_key(env2.effects, "io"), "io effect registered");
  assert(_Map_contains_key(env2.effects, "fail"), "fail effect registered");
  print("builtins: effects ok");
  assert(_Map_contains_key(env2.structs, "Cell"), "Cell struct registered");
  print("builtins: Cell ok");
  assert(_Map_contains_key(env2.enums, "Option"), "Option enum registered");
  assert(_Map_contains_key(env2.variant_to_enum, "some"), "some variant registered");
  assert(_Map_contains_key(env2.variant_to_enum, "none"), "none variant registered");
  print("builtins: Option ok");
  assert(_Map_contains_key(env2.traits, "Eq"), "Eq trait registered");
  assert(_Map_contains_key(env2.traits, "Clone"), "Clone trait registered");
  assert(_Map_contains_key(env2.traits, "Ord"), "Ord trait registered");
  assert(_Map_contains_key(env2.traits, "Debug"), "Debug trait registered");
  print("builtins: traits ok");
  assert((List_len(env2.trait_impls) > 0), "trait impls registered");
  print(`builtins: trait_impls count: ${Int_to_str(List_len(env2.trait_impls))}`);
  builtins$register_hof_intrinsics(env2);
  const list_methods = builtins$get_or_create_methods(env2, "List");
  assert(_Map_contains_key(list_methods, "map"), "List.map registered");
  assert(_Map_contains_key(list_methods, "filter"), "List.filter registered");
  assert(_Map_contains_key(list_methods, "fold"), "List.fold registered");
  print("builtins: HOF ok");
  const s0 = unify$empty_subst();
  assert((_Map_len(s0) === 0), "empty subst has 0 entries");
  print("unify: empty_subst ok");
  let env3 = env$new_type_env();
  const s1 = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", undefined); } }; try { return unify$unify(types$INT(), types$INT(), unify$empty_subst(), env3, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") return unify$empty_subst(); throw __ring_e; } })();
  assert((_Map_len(s1) === 0), "unifying Int with Int adds no entries");
  print("unify: Int == Int ok");
  let env4 = env$new_type_env();
  const tv = env$TypeEnv_fresh_var(env4);
  const s2 = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", undefined); } }; try { return unify$unify(tv, types$STR(), unify$empty_subst(), env4, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") return unify$empty_subst(); throw __ring_e; } })();
  assert((_Map_len(s2) === 1), "unifying var with Str adds 1 entry");
  const resolved = env$apply_subst(s2, tv);
  __ring_match11: {
    const __ring_m11 = resolved;
    if (__ring_m11._tag === "StrType") {
      print("unify: var -> Str ok");
      break __ring_match11;
    }
    panic("expected Str after unification");
    break __ring_match11;
  }
  let env5 = env$new_type_env();
  const mismatch_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return { _tag: "some", _0: unify$unify(types$INT(), types$STR(), unify$empty_subst(), env5, __ring_ev_fail) }; } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") return { _tag: "none" }; throw __ring_e; } })();
  assert(Option_is_none(mismatch_result), "Int vs Str should fail");
  print("unify: mismatch detected ok");
  let env6 = env$new_type_env();
  const v_occ = env$TypeEnv_fresh_var(env6);
  const fn_with_v = types$Type_FnType([v_occ], types$INT(), types$EMPTY_ROW());
  const occurs_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return { _tag: "some", _0: unify$unify(v_occ, fn_with_v, unify$empty_subst(), env6, __ring_ev_fail) }; } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") return { _tag: "none" }; throw __ring_e; } })();
  assert(Option_is_none(occurs_result), "occurs check should fail");
  print("unify: occurs check ok");
  let env7 = env$new_type_env();
  const vid = env$TypeEnv_fresh_var_id(env7);
  assert(unify$occurs_in(vid, types$Type_TypeVar(vid, Option_none), unify$empty_subst()), "var occurs in itself");
  assert((!unify$occurs_in(vid, types$INT(), unify$empty_subst())), "var does not occur in Int");
  print("unify: occurs_in ok");
  let env8 = env$new_type_env();
  const fn_a = types$Type_FnType([types$INT()], types$STR(), types$EMPTY_ROW());
  const fn_b = types$Type_FnType([types$INT()], types$STR(), types$EMPTY_ROW());
  const s3 = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", undefined); } }; try { return unify$unify(fn_a, fn_b, unify$empty_subst(), env8, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") return unify$empty_subst(); throw __ring_e; } })();
  assert((_Map_len(s3) === 0), "unifying identical fn types adds no entries");
  print("unify: fn types ok");
  let env9 = env$new_type_env();
  const tv2 = env$TypeEnv_fresh_var(env9);
  const fn_c = types$Type_FnType([tv2], tv2, types$EMPTY_ROW());
  const fn_d = types$Type_FnType([types$INT()], types$INT(), types$EMPTY_ROW());
  const s4 = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", undefined); } }; try { return unify$unify(fn_c, fn_d, unify$empty_subst(), env9, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") return unify$empty_subst(); throw __ring_e; } })();
  assert((_Map_len(s4) > 0), "unifying fn with vars produces substitution");
  const resolved2 = env$apply_subst(s4, tv2);
  __ring_match12: {
    const __ring_m12 = resolved2;
    if (__ring_m12._tag === "IntType") {
      print("unify: fn type vars resolved ok");
      break __ring_match12;
    }
    panic("expected Int after fn unification");
    break __ring_match12;
  }
  let env10 = env$new_type_env();
  const row_a = new types$EffectRow([types$Effect_IoEffect], Option_none);
  const row_b = new types$EffectRow([types$Effect_IoEffect], Option_none);
  const s5 = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", undefined); } }; try { return unify$unify_effect_rows(row_a, row_b, unify$empty_subst(), env10, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") return unify$empty_subst(); throw __ring_e; } })();
  assert((_Map_len(s5) === 0), "unifying same effect rows adds no entries");
  print("unify: effect rows ok");
  let env11 = env$new_type_env();
  const s6 = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", undefined); } }; try { return unify$unify(types$Type_NeverType, types$INT(), unify$empty_subst(), env11, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") return unify$empty_subst(); throw __ring_e; } })();
  assert((_Map_len(s6) === 0), "never unifies with Int");
  const s7 = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", undefined); } }; try { return unify$unify(types$STR(), types$Type_NeverType, unify$empty_subst(), env11, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") return unify$empty_subst(); throw __ring_e; } })();
  assert((_Map_len(s7) === 0), "Str unifies with never");
  print("unify: never ok");
  const ictx = infer_ctx$new_infer_ctx(diagnostics$new_collecting_sink());
  assert((List_len(ictx.env.scopes) === 1), "infer ctx has initial scope");
  assert((ictx.loop_depth === 0), "initial loop depth is 0");
  assert(Option_is_none(ictx.current_fn_return_type), "no fn return type initially");
  print("infer_ctx: new_infer_ctx ok");
  let ictx2 = infer_ctx$new_infer_ctx(diagnostics$new_collecting_sink());
  const us1 = infer_ctx$unify_at(ictx2.sink, ictx2.env, types$INT(), types$INT(), unify$empty_subst(), ast$span_zero());
  assert((_Map_len(us1) === 0), "unify_at Int=Int no entries");
  print("infer_ctx: unify_at ok");
  let ictx3 = infer_ctx$new_infer_ctx(diagnostics$new_collecting_sink());
  const uat_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return { _tag: "some", _0: infer_ctx$unify_at(ictx3.sink, ictx3.env, types$INT(), types$STR(), unify$empty_subst(), ast$span_zero()) }; } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") return { _tag: "none" }; throw __ring_e; } })();
  assert(Option_is_none(uat_result), "unify_at Int vs Str should fail");
  assert(diagnostics$CollectingSink_has_errors(ictx3.sink), "sink has error after unify_at failure");
  print("infer_ctx: unify_at error ok");
  let ictx4 = infer_ctx$new_infer_ctx(diagnostics$new_collecting_sink());
  const __ring_dt0 = infer_ctx$merge_effects(ictx4.env, types$EMPTY_ROW(), types$EMPTY_ROW(), unify$empty_subst(), __ring_ev_fail);
  const merged_row = __ring_dt0[0];
  const merged_s = __ring_dt0[1];
  assert((List_len(merged_row.effects) === 0), "merge empty rows");
  print("infer_ctx: merge_effects ok");
  let ictx5 = infer_ctx$new_infer_ctx(diagnostics$new_collecting_sink());
  const tv_free = env$TypeEnv_fresh_var(ictx5.env);
  const ftv = infer_ctx$free_type_vars(tv_free, unify$empty_subst());
  assert((_Set_len(ftv) === 1), "one free var in fresh var");
  const ftv_int = infer_ctx$free_type_vars(types$INT(), unify$empty_subst());
  assert((_Set_len(ftv_int) === 0), "no free vars in Int");
  print("infer_ctx: free_type_vars ok");
  let ictx6 = infer_ctx$new_infer_ctx(diagnostics$new_collecting_sink());
  const tv_gen = env$TypeEnv_fresh_var(ictx6.env);
  const gen_scheme = infer_ctx$generalize(ictx6.env, tv_gen, unify$empty_subst());
  assert((List_len(gen_scheme.type_vars) === 1), "generalize captures free var");
  print("infer_ctx: generalize ok");
  let ictx7 = infer_ctx$new_infer_ctx(diagnostics$new_collecting_sink());
  builtins$register_builtins(ictx7.env);
  const resolved_int = infer_ctx$resolve_named_type(ictx7, "Int", empty_type_exprs_for_test(), ast$span_zero(), __ring_ev_fail);
  __ring_match13: {
    const __ring_m13 = resolved_int;
    if (__ring_m13._tag === "IntType") {
      print("infer_ctx: resolve_named_type Int ok");
      break __ring_match13;
    }
    panic("expected IntType");
    break __ring_match13;
  }
  const io_row = new types$EffectRow([types$Effect_IoEffect], Option_none);
  const cleaned = infer_ctx$remove_fail_effect(io_row);
  assert((List_len(cleaned.effects) === 1), "io not removed by remove_fail_effect");
  const empty_cleaned = infer_ctx$remove_fail_effect(types$EMPTY_ROW());
  assert((List_len(empty_cleaned.effects) === 0), "empty row stays empty");
  print("infer_ctx: remove_fail_effect ok");
  let ictx8 = infer_ctx$new_infer_ctx(diagnostics$new_collecting_sink());
  builtins$register_builtins(ictx8.env);
  const prog_reg = parser$parse("struct Point { x: Int, y: Int }\nfn add(a: Int, b: Int) -> Int { a }", "<test>");
  infer_register$register_decls_two_phase(ictx8, prog_reg.decls);
  assert(_Map_contains_key(ictx8.env.structs, "Point"), "Point struct registered");
  __ring_match14: {
    const __ring_m14 = env$TypeEnv_lookup(ictx8.env, "add");
    if (__ring_m14._tag === "some") {
      const s = __ring_m14._0;
      print("infer_register: fn 'add' registered ok");
      break __ring_match14;
    }
    if (__ring_m14._tag === "none") {
      panic("add not registered");
      break __ring_match14;
    }
    __match_fail(__ring_m14);
  }
  print("infer_register: two_phase ok");
  return print("All modules linked successfully!");
}

function empty_type_exprs_for_test() {
  const x = [0];
  List_clear(x);
  return x.map((function(i) { return panic("unreachable"); }));
}

const __ring_ev_fail = { raise: (error) => { throw error; } };
main(__ring_ev_fail);