import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_FloatIdentity as hir$FieldAction_FloatIdentity, FieldAction_BoolIdentity as hir$FieldAction_BoolIdentity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { make_diag as diagnostics$make_diag, make_diagnostic as diagnostics$make_diagnostic, new_collecting_sink as diagnostics$new_collecting_sink, severity_to_str as diagnostics$severity_to_str, CollectingSink as diagnostics$CollectingSink, Diagnostic as diagnostics$Diagnostic, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, DiagnosticNote as diagnostics$DiagnosticNote, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, Suggestion as diagnostics$Suggestion, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Severity_Eq as diagnostics$__Severity_Eq, __Severity_Clone as diagnostics$__Severity_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __Severity_Debug as diagnostics$__Severity_Debug, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Suggestion_Debug as diagnostics$__Suggestion_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0105 as codes$E0105, E0106 as codes$E0106, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0405 as codes$E0405, E0406 as codes$E0406, E0407 as codes$E0407, E0408 as codes$E0408, E0409 as codes$E0409, E0410 as codes$E0410, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0504 as codes$E0504, E0505 as codes$E0505, E0506 as codes$E0506, E0507 as codes$E0507, E0508 as codes$E0508, E0509 as codes$E0509, E0510 as codes$E0510, E0511 as codes$E0511, E0512 as codes$E0512, E0513 as codes$E0513, E0514 as codes$E0514, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, E0707 as codes$E0707, W0001 as codes$W0001, W0002 as codes$W0002, error_category as codes$error_category, error_description as codes$error_description } from "./codes.js";
import { new_union_find as union_find$new_union_find, uf_bind as union_find$uf_bind, uf_find as union_find$uf_find, uf_insert as union_find$uf_insert, uf_lookup as union_find$uf_lookup, uf_union as union_find$uf_union, UnionFind as union_find$UnionFind } from "./union_find.js";
import { add_impl as env$add_impl, apply_subst as env$apply_subst, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_map as env$apply_subst_map, apply_subst_row as env$apply_subst_row, apply_subst_row_map as env$apply_subst_row_map, find_impl as env$find_impl, has_impl as env$has_impl, lookup_variant as env$lookup_variant, mono as env$mono, new_type_env as env$new_type_env, AssocConstraintEntry as env$AssocConstraintEntry, AssocTypeDef as env$AssocTypeDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectAliasDef as env$EffectAliasDef, EffectDef as env$EffectDef, EffectOpDef as env$EffectOpDef, EnumDef as env$EnumDef, FnBound as env$FnBound, IdGen as env$IdGen, ImplEntry as env$ImplEntry, SchemeBound as env$SchemeBound, Scope as env$Scope, ScopeManager as env$ScopeManager, SigDef as env$SigDef, StructDef as env$StructDef, TraitDef as env$TraitDef, TraitMethodDef as env$TraitMethodDef, TraitRegistry as env$TraitRegistry, TypeAliasDef as env$TypeAliasDef, TypeEnv as env$TypeEnv, TypeRegistry as env$TypeRegistry, TypeScheme as env$TypeScheme, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __BuiltInKind_Debug as env$__BuiltInKind_Debug, __FnBound_Eq as env$__FnBound_Eq, __FnBound_Clone as env$__FnBound_Clone, __FnBound_Ord as env$__FnBound_Ord, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Eq as env$__IdGen_Eq, __IdGen_Clone as env$__IdGen_Clone, __IdGen_Ord as env$__IdGen_Ord, __IdGen_Debug as env$__IdGen_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { empty_subst as unify$empty_subst, occurs_in as unify$occurs_in, unify as unify$unify, unify_effect_params as unify$unify_effect_params, unify_effect_rows as unify$unify_effect_rows, UnificationError as unify$UnificationError, __UnificationError_Eq as unify$__UnificationError_Eq, __UnificationError_Clone as unify$__UnificationError_Clone, __UnificationError_Ord as unify$__UnificationError_Ord, __UnificationError_Debug as unify$__UnificationError_Debug } from "./unify.js";
import { bind_pattern as infer_ctx$bind_pattern, build_scheme_var_map as infer_ctx$build_scheme_var_map, collect_free_vars as infer_ctx$collect_free_vars, free_type_vars as infer_ctx$free_type_vars, free_type_vars_in_env as infer_ctx$free_type_vars_in_env, generalize as infer_ctx$generalize, merge_effects as infer_ctx$merge_effects, new_infer_ctx as infer_ctx$new_infer_ctx, remove_fail_effect as infer_ctx$remove_fail_effect, resolve_dicts_from_scheme as infer_ctx$resolve_dicts_from_scheme, resolve_effect_expr as infer_ctx$resolve_effect_expr, resolve_named_type as infer_ctx$resolve_named_type, resolve_relative_qualifier as infer_ctx$resolve_relative_qualifier, resolve_self_type as infer_ctx$resolve_self_type, resolve_type_expr as infer_ctx$resolve_type_expr, type_error as infer_ctx$type_error, type_error_with_notes as infer_ctx$type_error_with_notes, unify_at as infer_ctx$unify_at, unify_at_noted as infer_ctx$unify_at_noted, update_fn_effects as infer_ctx$update_fn_effects, CompileError as infer_ctx$CompileError, FnBoundsEntry as infer_ctx$FnBoundsEntry, InferCtx as infer_ctx$InferCtx, InferResult as infer_ctx$InferResult, __CompileError_Eq as infer_ctx$__CompileError_Eq, __CompileError_Clone as infer_ctx$__CompileError_Clone, __CompileError_Ord as infer_ctx$__CompileError_Ord, __CompileError_Debug as infer_ctx$__CompileError_Debug, __FnBoundsEntry_Eq as infer_ctx$__FnBoundsEntry_Eq, __FnBoundsEntry_Clone as infer_ctx$__FnBoundsEntry_Clone, __FnBoundsEntry_Ord as infer_ctx$__FnBoundsEntry_Ord, __FnBoundsEntry_Debug as infer_ctx$__FnBoundsEntry_Debug } from "./infer_ctx.js";
import { check_exhaustive as exhaustive$check_exhaustive } from "./exhaustive.js";
import { cancel_local_mut_effects as infer_helpers$cancel_local_mut_effects, check_assign_target_mutable as infer_helpers$check_assign_target_mutable, check_expr_is_let_def as infer_helpers$check_expr_is_let_def, check_receiver_mutability as infer_helpers$check_receiver_mutability, find_root_expr as infer_helpers$find_root_expr, get_assign_target_root_def_id as infer_helpers$get_assign_target_root_def_id, get_expr_def_id as infer_helpers$get_expr_def_id, get_hexpr_root_type as infer_helpers$get_hexpr_root_type, infer_ident as infer_helpers$infer_ident, infer_numeric_op as infer_helpers$infer_numeric_op, is_mut_method_call as infer_helpers$is_mut_method_call, is_primitive_eq as infer_helpers$is_primitive_eq, is_primitive_ord as infer_helpers$is_primitive_ord, is_tuple_type as infer_helpers$is_tuple_type, is_value_type as infer_helpers$is_value_type, lookup_impl_method as infer_helpers$lookup_impl_method, lookup_trait_method as infer_helpers$lookup_trait_method, resolve_arg_bound_dict as infer_helpers$resolve_arg_bound_dict, resolve_arg_dict_closure as infer_helpers$resolve_arg_dict_closure, resolve_trait_dispatch as infer_helpers$resolve_trait_dispatch, resolve_trait_extra_dicts as infer_helpers$resolve_trait_extra_dicts, resolve_type_to_dict_ref as infer_helpers$resolve_type_to_dict_ref, resolve_var_id as infer_helpers$resolve_var_id, rewrite_bare_enum_bindings as infer_helpers$rewrite_bare_enum_bindings, MethodLookupResult as infer_helpers$MethodLookupResult, StmtResult as infer_helpers$StmtResult } from "./infer_helpers.js";



function List_is_empty(self) {
  return (List_len(self) === 0);
}
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

function Result_and_then(self, f) {
  __ring_match1: {
    const __ring_m1 = self;
    if (__ring_m1._tag === "Ok") {
      const v = __ring_m1._0;
      return f(v);
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
function Result_is_err(self) {
  __ring_match2: {
    const __ring_m2 = self;
    if (__ring_m2._tag === "Ok") {
      return false;
      break __ring_match2;
    }
    if (__ring_m2._tag === "Err") {
      return true;
      break __ring_match2;
    }
    __match_fail(__ring_m2);
  }
}
function Result_is_ok(self) {
  __ring_match3: {
    const __ring_m3 = self;
    if (__ring_m3._tag === "Ok") {
      return true;
      break __ring_match3;
    }
    if (__ring_m3._tag === "Err") {
      return false;
      break __ring_match3;
    }
    __match_fail(__ring_m3);
  }
}
function Result_map(self, f) {
  __ring_match4: {
    const __ring_m4 = self;
    if (__ring_m4._tag === "Ok") {
      const v = __ring_m4._0;
      return Result_Ok(f(v));
      break __ring_match4;
    }
    if (__ring_m4._tag === "Err") {
      const e = __ring_m4._0;
      return Result_Err(e);
      break __ring_match4;
    }
    __match_fail(__ring_m4);
  }
}
function Result_unwrap_or(self, _default) {
  __ring_match5: {
    const __ring_m5 = self;
    if (__ring_m5._tag === "Ok") {
      const v = __ring_m5._0;
      return v;
      break __ring_match5;
    }
    if (__ring_m5._tag === "Err") {
      return _default;
      break __ring_match5;
    }
    __match_fail(__ring_m5);
  }
}

function to_result(f) {
  return (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Result_Ok(f()); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { const e = __ring_err; return Result_Err(e); } else { throw __ring_e; } } throw __ring_e; } })();
}

function infer_unary_op(ctx, op, operand, span, subst, __ring_ev_fail) {
  const r = infer_expr(ctx, operand, subst, __ring_ev_fail);
  let s = r.subst;
  let result_type = types$UNIT;
  __ring_match6: {
    const __ring_m6 = op;
    if (__ring_m6._tag === "Neg") {
      const resolved = env$apply_subst(s, hir$hexpr_type(r.hexpr));
      __ring_match7: {
        const __ring_m7 = resolved;
        if (__ring_m7._tag === "TypeVar") {
          s = infer_ctx$unify_at(ctx.sink, ctx.env, resolved, types$INT, s, span);
          result_type = types$INT;
          break __ring_match7;
        }
        if (__ring_m7._tag === "IntType") {
          result_type = types$INT;
          break __ring_match7;
        }
        if (__ring_m7._tag === "FloatType") {
          result_type = types$FLOAT;
          break __ring_match7;
        }
        const _ = infer_ctx$type_error(ctx.sink, codes$E0303, `Unary - requires numeric type, got ${types$type_to_string(resolved)}`, span, diagnostics$DiagnosticContext_TypeMismatch("Int or Float", types$type_to_string(resolved), Option_none));
        break __ring_match7;
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "Not") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(r.hexpr), types$BOOL, s, span);
      result_type = types$BOOL;
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
  return new infer_ctx$InferResult(hir$HExpr_UnaryOp(op, r.hexpr, result_type, r.effects, span), s, r.effects);
}

function infer_named_variant_construct(ctx, enum_name, variant_name, variant, enum_def, fields, spread, span, subst, __ring_ev_fail) {
  let __ring_blk0;
  __ring_match8: {
    const __ring_m8 = variant.field_names;
    if (__ring_m8._tag === "some") {
      const fn_ = __ring_m8._0;
      __ring_blk0 = fn_;
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      __ring_blk0 = [];
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
  const field_names = __ring_blk0;
  let inst_map = map_new();
  let type_param_types = [];
  let tpi = 0;
  while ((tpi < List_len(enum_def.type_param_vars))) {
    __ring_match9: {
      const __ring_m9 = List_get(enum_def.type_param_vars, tpi);
      if (__ring_m9._tag === "some") {
        const var_id = __ring_m9._0;
        const tv = env$TypeEnv_fresh_var(ctx.env);
        _Map_insert(inst_map, var_id, tv);
        List_push(type_param_types, tv);
        break __ring_match9;
      }
      if (__ring_m9._tag === "none") {
        break __ring_match9;
      }
      __match_fail(__ring_m9);
    }
    tpi = (tpi + 1);
  }
  let s = subst;
  let effects = types$EMPTY_ROW;
  let hfields = [];
  let hspread = Option_none;
  __ring_match10: {
    const __ring_m10 = spread;
    if (__ring_m10._tag === "some") {
      const sp = __ring_m10._0;
      const sr = infer_expr(ctx, sp, s, __ring_ev_fail);
      s = sr.subst;
      const me = infer_ctx$merge_effects(ctx.env, effects, sr.effects, s, __ring_ev_fail);
      effects = me[0];
      s = me[1];
      const spread_enum_type = types$Type_EnumType(enum_name, type_param_types);
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(sr.hexpr), spread_enum_type, s, span);
      hspread = Option_some(sr.hexpr);
      break __ring_match10;
    }
    if (__ring_m10._tag === "none") {
      break __ring_match10;
    }
    __match_fail(__ring_m10);
  }
  const __ring_iter_2 = __List_Iterable.iter(fields);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const field = __ring_next_2._0;
    const fr = infer_expr(ctx, field.value, s, __ring_ev_fail);
    s = fr.subst;
    const me = infer_ctx$merge_effects(ctx.env, effects, fr.effects, s, __ring_ev_fail);
    effects = me[0];
    s = me[1];
    const field_idx = List_index_of(field_names, field.name, __Str_Eq);
    __ring_match11: {
      const __ring_m11 = field_idx;
      if (__ring_m11._tag === "some") {
        const idx = __ring_m11._0;
        __ring_match12: {
          const __ring_m12 = List_get(variant.fields, idx);
          if (__ring_m12._tag === "some") {
            const ftype = __ring_m12._0;
            const ft = env$apply_subst_map(inst_map, ftype);
            s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(fr.hexpr), ft, s, span);
            break __ring_match12;
          }
          if (__ring_m12._tag === "none") {
            break __ring_match12;
          }
          __match_fail(__ring_m12);
        }
        break __ring_match11;
      }
      if (__ring_m11._tag === "none") {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Variant '${variant_name}' has no field '${field.name}'`, field.span, diagnostics$DiagnosticContext_MissingField(field.name, variant_name, Option_none));
        break __ring_match11;
      }
      __match_fail(__ring_m11);
    }
    List_push(hfields, new hir$HStructFieldInit(field.name, fr.hexpr));
  }
  if (Option_is_none(spread)) {
    let provided = set_new();
    const __ring_iter_3 = __List_Iterable.iter(fields);
    while (true) {
      const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
      if (__ring_next_3._tag === "none") break;
      const f = __ring_next_3._0;
      _Set_insert(provided, f.name);
    }
    const __ring_iter_4 = __List_Iterable.iter(field_names);
    while (true) {
      const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
      if (__ring_next_4._tag === "none") break;
      const fn_name = __ring_next_4._0;
      if ((!_Set_contains(provided, fn_name, __Str_Eq))) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Missing field '${fn_name}' in variant '${variant_name}'`, span, diagnostics$DiagnosticContext_MissingField(fn_name, variant_name, Option_none));
      }
    }
  }
  const enum_type = types$Type_EnumType(enum_name, type_param_types);
  return new infer_ctx$InferResult(hir$HExpr_NamedVariantConstruct(enum_name, variant_name, hfields, hspread, enum_type, effects, span), s, effects);
}

function infer_struct_lit(ctx, name, fields, spread, span, subst, qualifier, __ring_ev_fail) {
  let resolved_qualifier = qualifier;
  __ring_match13: {
    const __ring_m13 = qualifier;
    if (__ring_m13._tag === "some") {
      const q = __ring_m13._0;
      if (((q === "self") ? true : Str_starts_with(q, "super"))) {
        __ring_match14: {
          const __ring_m14 = infer_ctx$resolve_relative_qualifier(q, ctx.mod_path_stack);
          if (__ring_m14._tag === "some") {
            const prefix = __ring_m14._0;
            if ((prefix === "")) {
              resolved_qualifier = Option_none;
            } else {
              resolved_qualifier = Option_some(prefix);
            }
            break __ring_match14;
          }
          if (__ring_m14._tag === "none") {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0705, `Cannot use '${q}' — relative path exceeds module nesting depth`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("relative path out of scope")));
            return new infer_ctx$InferResult(hir$HExpr_StructLit(name, [], [], Option_none, types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
            break __ring_match14;
          }
          __match_fail(__ring_m14);
        }
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "none") {
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
  __ring_match15: {
    const __ring_m15 = resolved_qualifier;
    if (__ring_m15._tag === "some") {
      const q = __ring_m15._0;
      const qualified_name = `${q}::${name}`;
      const mod_struct = _Map_get(ctx.env.types.structs, qualified_name);
      __ring_match16: {
        const __ring_m16 = mod_struct;
        if (__ring_m16._tag === "some") {
          return infer_struct_lit(ctx, qualified_name, fields, spread, span, subst, Option_none, __ring_ev_fail);
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          if ((List_len(ctx.mod_path_stack) > 0)) {
            const mod_prefix = List_join(ctx.mod_path_stack, "::");
            const full_qualified = `${mod_prefix}::${qualified_name}`;
            const full_struct = _Map_get(ctx.env.types.structs, full_qualified);
            __ring_match17: {
              const __ring_m17 = full_struct;
              if (__ring_m17._tag === "some") {
                return infer_struct_lit(ctx, full_qualified, fields, spread, span, subst, Option_none, __ring_ev_fail);
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
        __match_fail(__ring_m16);
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "none") {
      break __ring_match15;
    }
    __match_fail(__ring_m15);
  }
  let variant_enum = Option_none;
  __ring_match18: {
    const __ring_m18 = resolved_qualifier;
    if (__ring_m18._tag === "some") {
      const q = __ring_m18._0;
      __ring_match19: {
        const __ring_m19 = _Map_get(ctx.env.types.enums, q);
        if (__ring_m19._tag === "some") {
          const enum_def = __ring_m19._0;
          if (_Map_contains_key(enum_def.variant_index, name)) {
            variant_enum = Option_some(enum_def.name);
          }
          break __ring_match19;
        }
        if (__ring_m19._tag === "none") {
          if ((List_len(ctx.mod_path_stack) > 0)) {
            const mod_prefix = List_join(ctx.mod_path_stack, "::");
            const full_q = `${mod_prefix}::${q}`;
            __ring_match20: {
              const __ring_m20 = _Map_get(ctx.env.types.enums, full_q);
              if (__ring_m20._tag === "some") {
                const enum_def = __ring_m20._0;
                if (_Map_contains_key(enum_def.variant_index, name)) {
                  variant_enum = Option_some(enum_def.name);
                }
                break __ring_match20;
              }
              if (__ring_m20._tag === "none") {
                break __ring_match20;
              }
              __match_fail(__ring_m20);
            }
          }
          break __ring_match19;
        }
        __match_fail(__ring_m19);
      }
      break __ring_match18;
    }
    if (__ring_m18._tag === "none") {
      variant_enum = _Map_get(ctx.env.types.variant_to_enum, name);
      break __ring_match18;
    }
    __match_fail(__ring_m18);
  }
  if ((Option_is_none(variant_enum) ? Option_is_some(resolved_qualifier) : false)) {
    __ring_match21: {
      const __ring_m21 = resolved_qualifier;
      if (__ring_m21._tag === "some") {
        const q = __ring_m21._0;
        const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `'${q}' has no variant '${name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(name, Option_none));
        break __ring_match21;
      }
      if (__ring_m21._tag === "none") {
        break __ring_match21;
      }
      __match_fail(__ring_m21);
    }
  }
  __ring_match22: {
    const __ring_m22 = variant_enum;
    if (__ring_m22._tag === "some") {
      const ve = __ring_m22._0;
      __ring_match23: {
        const __ring_m23 = _Map_get(ctx.env.types.enums, ve);
        if (__ring_m23._tag === "some") {
          const enum_def = __ring_m23._0;
          const variant = env$lookup_variant(enum_def, name);
          __ring_match24: {
            const __ring_m24 = variant;
            if (__ring_m24._tag === "some") {
              const v = __ring_m24._0;
              __ring_match25: {
                const __ring_m25 = v.field_names;
                if (__ring_m25._tag === "some") {
                  return infer_named_variant_construct(ctx, ve, name, v, enum_def, fields, spread, span, subst, __ring_ev_fail);
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
          break __ring_match23;
        }
        if (__ring_m23._tag === "none") {
          break __ring_match23;
        }
        __match_fail(__ring_m23);
      }
      break __ring_match22;
    }
    if (__ring_m22._tag === "none") {
      break __ring_match22;
    }
    __match_fail(__ring_m22);
  }
  const struct_def_opt = _Map_get(ctx.env.types.structs, name);
  __ring_match26: {
    const __ring_m26 = struct_def_opt;
    if (__ring_m26._tag === "none") {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Unknown struct: ${name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`unknown struct '${name}'`)));
      return new infer_ctx$InferResult(hir$HExpr_StructLit(name, [], [], Option_none, types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match26;
    }
    break __ring_match26;
  }
  let __ring_blk1;
  __ring_match27: {
    const __ring_m27 = struct_def_opt;
    if (__ring_m27._tag === "some") {
      const sd = __ring_m27._0;
      __ring_blk1 = sd;
      break __ring_match27;
    }
    if (__ring_m27._tag === "none") {
      __ring_blk1 = panic("unreachable: struct_def_opt after none early return");
      break __ring_match27;
    }
    __match_fail(__ring_m27);
  }
  const struct_def = __ring_blk1;
  let inst_map = map_new();
  let type_param_types = [];
  let tpi = 0;
  while ((tpi < List_len(struct_def.type_param_vars))) {
    __ring_match28: {
      const __ring_m28 = List_get(struct_def.type_param_vars, tpi);
      if (__ring_m28._tag === "some") {
        const var_id = __ring_m28._0;
        const tv = env$TypeEnv_fresh_var(ctx.env);
        _Map_insert(inst_map, var_id, tv);
        List_push(type_param_types, tv);
        break __ring_match28;
      }
      if (__ring_m28._tag === "none") {
        break __ring_match28;
      }
      __match_fail(__ring_m28);
    }
    tpi = (tpi + 1);
  }
  let s = subst;
  let effects = types$EMPTY_ROW;
  let hfields = [];
  let hspread = Option_none;
  __ring_match29: {
    const __ring_m29 = spread;
    if (__ring_m29._tag === "some") {
      const sp = __ring_m29._0;
      const sr = infer_expr(ctx, sp, s, __ring_ev_fail);
      s = sr.subst;
      const me = infer_ctx$merge_effects(ctx.env, effects, sr.effects, s, __ring_ev_fail);
      effects = me[0];
      s = me[1];
      const spread_type = types$Type_StructType(struct_def.name, type_param_types);
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(sr.hexpr), spread_type, s, span);
      hspread = Option_some(sr.hexpr);
      break __ring_match29;
    }
    if (__ring_m29._tag === "none") {
      break __ring_match29;
    }
    __match_fail(__ring_m29);
  }
  const __ring_iter_5 = __List_Iterable.iter(fields);
  while (true) {
    const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
    if (__ring_next_5._tag === "none") break;
    const field = __ring_next_5._0;
    const fr = infer_expr(ctx, field.value, s, __ring_ev_fail);
    s = fr.subst;
    const me = infer_ctx$merge_effects(ctx.env, effects, fr.effects, s, __ring_ev_fail);
    effects = me[0];
    s = me[1];
    const def_field = ((__a) => { const __i = __a.findIndex((function(f) { return (f.name === field.name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(struct_def.fields);
    __ring_match30: {
      const __ring_m30 = def_field;
      if (__ring_m30._tag === "some") {
        const df = __ring_m30._0;
        const ft = env$apply_subst_map(inst_map, df.ty);
        const field_notes = [new diagnostics$DiagnosticNote(`field '${field.name}' of struct '${name}' expects type '${types$type_to_string(ft)}'`, Option_some(field.span)), new diagnostics$DiagnosticNote(`provided value has type '${types$type_to_string(env$apply_subst(s, hir$hexpr_type(fr.hexpr)))}'`, Option_some(hir$hexpr_span(fr.hexpr)))];
        s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, hir$hexpr_type(fr.hexpr), ft, s, span, field_notes);
        break __ring_match30;
      }
      if (__ring_m30._tag === "none") {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Struct '${name}' has no field '${field.name}'`, field.span, diagnostics$DiagnosticContext_MissingField(field.name, name, Option_none));
        break __ring_match30;
      }
      __match_fail(__ring_m30);
    }
    List_push(hfields, new hir$HStructFieldInit(field.name, fr.hexpr));
  }
  if (Option_is_none(spread)) {
    let provided = set_new();
    const __ring_iter_6 = __List_Iterable.iter(fields);
    while (true) {
      const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
      if (__ring_next_6._tag === "none") break;
      const f = __ring_next_6._0;
      _Set_insert(provided, f.name);
    }
    const __ring_iter_7 = __List_Iterable.iter(struct_def.fields);
    while (true) {
      const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
      if (__ring_next_7._tag === "none") break;
      const df = __ring_next_7._0;
      if ((!_Set_contains(provided, df.name, __Str_Eq))) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Missing field '${df.name}' in struct literal '${name}'`, span, diagnostics$DiagnosticContext_MissingField(df.name, name, Option_none));
      }
    }
  }
  const struct_type = types$Type_StructType(struct_def.name, type_param_types);
  return new infer_ctx$InferResult(hir$HExpr_StructLit(struct_def.name, [], hfields, hspread, struct_type, effects, span), s, effects);
}

function infer_string_interp(ctx, parts, span, subst, __ring_ev_fail) {
  let s = subst;
  let effects = types$EMPTY_ROW;
  let hparts = [];
  const __ring_iter_8 = __List_Iterable.iter(parts);
  while (true) {
    const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
    if (__ring_next_8._tag === "none") break;
    const part = __ring_next_8._0;
    __ring_match31: {
      const __ring_m31 = part;
      if (__ring_m31._tag === "LitPart") {
        const str_val = __ring_m31._0;
        List_push(hparts, hir$HStringInterpPart_Literal(str_val));
        break __ring_match31;
      }
      if (__ring_m31._tag === "ExprPart") {
        const expr = __ring_m31._0;
        const r = infer_expr(ctx, expr, s, __ring_ev_fail);
        s = r.subst;
        const me = infer_ctx$merge_effects(ctx.env, effects, r.effects, s, __ring_ev_fail);
        effects = me[0];
        s = me[1];
        List_push(hparts, hir$HStringInterpPart_Expression(r.hexpr));
        break __ring_match31;
      }
      __match_fail(__ring_m31);
    }
  }
  return new infer_ctx$InferResult(hir$HExpr_StringInterp(hparts, types$STR, effects, span), s, effects);
}

function infer_effect_op(ctx, effect_name, op_name, args, span, subst, __ring_ev_fail) {
  const effect_def_opt = _Map_get(ctx.env.types.effects, effect_name);
  __ring_match32: {
    const __ring_m32 = effect_def_opt;
    if (__ring_m32._tag === "none") {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0402, `Unknown effect: ${effect_name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`effect '${effect_name}' not found`)));
      return new infer_ctx$InferResult(hir$HExpr_EffectOp(effect_name, op_name, [], types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match32;
    }
    break __ring_match32;
  }
  let __ring_blk2;
  __ring_match33: {
    const __ring_m33 = effect_def_opt;
    if (__ring_m33._tag === "some") {
      const ed = __ring_m33._0;
      __ring_blk2 = ed;
      break __ring_match33;
    }
    if (__ring_m33._tag === "none") {
      __ring_blk2 = panic("unreachable: effect_def_opt after none early return");
      break __ring_match33;
    }
    __match_fail(__ring_m33);
  }
  const effect_def = __ring_blk2;
  const canonical_effect_name = effect_def.name;
  const op_opt = ((__a) => { const __i = __a.findIndex((function(o) { return (o.name === op_name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(effect_def.ops);
  __ring_match34: {
    const __ring_m34 = op_opt;
    if (__ring_m34._tag === "none") {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0402, `Effect ${canonical_effect_name} has no operation ${op_name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`no operation '${op_name}' on effect '${canonical_effect_name}'`)));
      return new infer_ctx$InferResult(hir$HExpr_EffectOp(canonical_effect_name, op_name, [], types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match34;
    }
    break __ring_match34;
  }
  let __ring_blk3;
  __ring_match35: {
    const __ring_m35 = op_opt;
    if (__ring_m35._tag === "some") {
      const o = __ring_m35._0;
      __ring_blk3 = o;
      break __ring_match35;
    }
    if (__ring_m35._tag === "none") {
      __ring_blk3 = panic("unreachable: op_opt after none early return");
      break __ring_match35;
    }
    __match_fail(__ring_m35);
  }
  const op = __ring_blk3;
  let inst_map = map_new();
  let inst_type_args = [];
  let tpi = 0;
  const __ring_iter_9 = __List_Iterable.iter(effect_def.type_param_vars);
  while (true) {
    const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
    if (__ring_next_9._tag === "none") break;
    const tpv = __ring_next_9._0;
    const fresh = env$TypeEnv_fresh_var(ctx.env);
    _Map_insert(inst_map, tpv, fresh);
    List_push(inst_type_args, fresh);
    tpi = (tpi + 1);
  }
  let inst_params = [];
  const __ring_iter_10 = __List_Iterable.iter(op.params);
  while (true) {
    const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
    if (__ring_next_10._tag === "none") break;
    const pt = __ring_next_10._0;
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
  const __ring_iter_11 = __List_Iterable.iter(args);
  while (true) {
    const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
    if (__ring_next_11._tag === "none") break;
    const arg = __ring_next_11._0;
    const ar = infer_expr(ctx, arg, s, __ring_ev_fail);
    s = ar.subst;
    const me = infer_ctx$merge_effects(ctx.env, effects, ar.effects, s, __ring_ev_fail);
    effects = me[0];
    s = me[1];
    List_push(hargs, ar.hexpr);
    __ring_match36: {
      const __ring_m36 = List_get(inst_params, i);
      if (__ring_m36._tag === "some") {
        const param_type = __ring_m36._0;
        s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(ar.hexpr), param_type, s, span);
        break __ring_match36;
      }
      if (__ring_m36._tag === "none") {
        break __ring_match36;
      }
      __match_fail(__ring_m36);
    }
    i = (i + 1);
  }
  let eff = types$Effect_CustomEffect(canonical_effect_name, inst_type_args);
  __ring_match37: {
    const __ring_m37 = effect_def.built_in_kind;
    if (__ring_m37._tag === "some") {
      const bik = __ring_m37._0;
      __ring_match38: {
        const __ring_m38 = bik;
        if (__ring_m38._tag === "BkIo") {
          eff = types$Effect_IoEffect;
          break __ring_match38;
        }
        if (__ring_m38._tag === "BkFail") {
          let __ring_blk4;
          __ring_match39: {
            const __ring_m39 = List_first(hargs);
            if (__ring_m39._tag === "some") {
              const h = __ring_m39._0;
              __ring_blk4 = h;
              break __ring_match39;
            }
            if (__ring_m39._tag === "none") {
              __ring_blk4 = panic("unreachable: hargs.first() after len > 0 check");
              break __ring_match39;
            }
            __match_fail(__ring_m39);
          }
          const error_type = ((List_len(hargs) > 0) ? env$apply_subst(s, hir$hexpr_type(__ring_blk4)) : types$UNIT);
          eff = types$Effect_FailEffect(error_type);
          break __ring_match38;
        }
        if (__ring_m38._tag === "BkMut") {
          eff = types$Effect_MutEffect(env$TypeEnv_fresh_var(ctx.env));
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
  const me = infer_ctx$merge_effects(ctx.env, effects, types$effect_row([eff]), s, __ring_ev_fail);
  effects = me[0];
  s = me[1];
  return new infer_ctx$InferResult(hir$HExpr_EffectOp(canonical_effect_name, op_name, hargs, inst_ret, effects, span), s, effects);
}

function infer_method_call(ctx, receiver, method, args, span, subst, __ring_ev_fail) {
  __ring_match40: {
    const __ring_m40 = receiver;
    if (__ring_m40._tag === "Ident") {
      const recv_name = __ring_m40.name; const qualifier = __ring_m40.qualifier;
      let __ring_blk5;
      __ring_match41: {
        const __ring_m41 = qualifier;
        if (__ring_m41._tag === "some") {
          const q = __ring_m41._0;
          __ring_blk5 = `${q}::${recv_name}`;
          break __ring_match41;
        }
        if (__ring_m41._tag === "none") {
          __ring_blk5 = recv_name;
          break __ring_match41;
        }
        __match_fail(__ring_m41);
      }
      const full_effect_name = __ring_blk5;
      __ring_match42: {
        const __ring_m42 = _Map_get(ctx.env.types.effects, full_effect_name);
        if (__ring_m42._tag === "some") {
          return infer_effect_op(ctx, full_effect_name, method, args, span, subst, __ring_ev_fail);
          break __ring_match42;
        }
        if (__ring_m42._tag === "none") {
          break __ring_match42;
        }
        __match_fail(__ring_m42);
      }
      break __ring_match40;
    }
    break __ring_match40;
  }
  const recv_r = infer_expr(ctx, receiver, subst, __ring_ev_fail);
  let s = recv_r.subst;
  let effects = recv_r.effects;
  const recv_type = env$apply_subst(s, hir$hexpr_type(recv_r.hexpr));
  infer_helpers$check_receiver_mutability(ctx, receiver, recv_type, method, span);
  if (infer_helpers$is_mut_method_call(ctx, recv_type, method)) {
    __ring_match43: {
      const __ring_m43 = infer_helpers$get_expr_def_id(ctx, receiver);
      if (__ring_m43._tag === "some") {
        const did = __ring_m43._0;
        if (_Set_contains(ctx.env.scope.mut_param_defs, did, __Int_Eq)) {
          const mut_eff = types$Effect_MutEffect(recv_type);
          const me = infer_ctx$merge_effects(ctx.env, effects, types$effect_row([mut_eff]), s, __ring_ev_fail);
          effects = me[0];
          s = me[1];
        }
        break __ring_match43;
      }
      if (__ring_m43._tag === "none") {
        break __ring_match43;
      }
      __match_fail(__ring_m43);
    }
  }
  let method_type = Option_none;
  let method_scheme = Option_none;
  __ring_match44: {
    const __ring_m44 = recv_type;
    if (__ring_m44._tag === "StructType") {
      const name = __ring_m44.name;
      const r = infer_helpers$lookup_impl_method(ctx, name, method);
      method_type = r.method_type;
      method_scheme = r.method_scheme;
      break __ring_match44;
    }
    if (__ring_m44._tag === "EnumType") {
      const name = __ring_m44.name;
      const r = infer_helpers$lookup_impl_method(ctx, name, method);
      method_type = r.method_type;
      method_scheme = r.method_scheme;
      break __ring_match44;
    }
    break __ring_match44;
  }
  if (Option_is_none(method_type)) {
    __ring_match45: {
      const __ring_m45 = types$type_to_builtin_name(recv_type);
      if (__ring_m45._tag === "some") {
        const prim_name = __ring_m45._0;
        const r = infer_helpers$lookup_impl_method(ctx, prim_name, method);
        method_type = r.method_type;
        method_scheme = r.method_scheme;
        break __ring_match45;
      }
      if (__ring_m45._tag === "none") {
        break __ring_match45;
      }
      __match_fail(__ring_m45);
    }
  }
  if (Option_is_none(method_type)) {
    __ring_match46: {
      const __ring_m46 = types$type_to_builtin_name(recv_type);
      if (__ring_m46._tag === "some") {
        const type_name = __ring_m46._0;
        method_type = infer_helpers$lookup_trait_method(ctx, type_name, method, span);
        break __ring_match46;
      }
      if (__ring_m46._tag === "none") {
        break __ring_match46;
      }
      __match_fail(__ring_m46);
    }
  }
  let dict_dispatch = Option_none;
  const recv_raw_type = hir$hexpr_type(recv_r.hexpr);
  let __ring_blk6;
  __ring_match47: {
    const __ring_m47 = recv_raw_type;
    if (__ring_m47._tag === "TypeVar") {
      const id = __ring_m47.id;
      __ring_blk6 = Option_some(infer_helpers$resolve_var_id(id, s));
      break __ring_match47;
    }
    __ring_blk6 = Option_none;
    break __ring_match47;
  }
  const recv_var_id = __ring_blk6;
  if (Option_is_none(method_type)) {
    __ring_match48: {
      const __ring_m48 = recv_var_id;
      if (__ring_m48._tag === "some") {
        const rvid = __ring_m48._0;
        const __ring_iter_12 = __List_Iterable.iter(ctx.current_fn_bounds);
        while (true) {
          const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
          if (__ring_next_12._tag === "none") break;
          const fb = __ring_next_12._0;
          if ((infer_helpers$resolve_var_id(fb.type_param_var_id, s) === rvid)) {
            __ring_match49: {
              const __ring_m49 = _Map_get(ctx.env.trait_reg.traits, fb.trait_name);
              if (__ring_m49._tag === "some") {
                const trait_def = __ring_m49._0;
                const tm = ((__a) => { const __i = __a.findIndex((function(m) { return (m.name === method); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(trait_def.methods);
                __ring_match50: {
                  const __ring_m50 = tm;
                  if (__ring_m50._tag === "some") {
                    const found_method = __ring_m50._0;
                    method_type = Option_some(env$TypeEnv_instantiate(ctx.env, new env$TypeScheme(found_method.ty, trait_def.type_param_vars, [], Option_none)));
                    dict_dispatch = Option_some(new hir$DictDispatchInfo(hir$trait_bound_param_name(fb.type_param_name, fb.trait_name), method));
                    break __ring_match50;
                  }
                  if (__ring_m50._tag === "none") {
                    break __ring_match50;
                  }
                  __match_fail(__ring_m50);
                }
                break __ring_match49;
              }
              if (__ring_m49._tag === "none") {
                break __ring_match49;
              }
              __match_fail(__ring_m49);
            }
          }
        }
        break __ring_match48;
      }
      if (__ring_m48._tag === "none") {
        break __ring_match48;
      }
      __match_fail(__ring_m48);
    }
  }
  __ring_match51: {
    const __ring_m51 = method_type;
    if (__ring_m51._tag === "some") {
      const mt = __ring_m51._0;
      __ring_match52: {
        const __ring_m52 = mt;
        if (__ring_m52._tag === "FnType") {
          const mt_params = __ring_m52.params;
          if ((List_len(mt_params) > 0)) {
            __ring_match53: {
              const __ring_m53 = List_first(mt_params);
              if (__ring_m53._tag === "some") {
                const first_param = __ring_m53._0;
                const recv_notes = [new diagnostics$DiagnosticNote(`method '${method}' expects receiver of type '${types$type_to_string(env$apply_subst(s, first_param))}'`, Option_some(span)), new diagnostics$DiagnosticNote(`receiver has type '${types$type_to_string(env$apply_subst(s, hir$hexpr_type(recv_r.hexpr)))}'`, Option_some(hir$hexpr_span(recv_r.hexpr)))];
                s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, hir$hexpr_type(recv_r.hexpr), first_param, s, span, recv_notes);
                break __ring_match53;
              }
              if (__ring_m53._tag === "none") {
                break __ring_match53;
              }
              __match_fail(__ring_m53);
            }
          }
          break __ring_match52;
        }
        break __ring_match52;
      }
      break __ring_match51;
    }
    if (__ring_m51._tag === "none") {
      break __ring_match51;
    }
    __match_fail(__ring_m51);
  }
  let hargs = [];
  let ai = 0;
  const __ring_iter_13 = __List_Iterable.iter(args);
  while (true) {
    const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
    if (__ring_next_13._tag === "none") break;
    const arg = __ring_next_13._0;
    let __ring_blk7;
    __ring_match54: {
      const __ring_m54 = arg;
      if (__ring_m54._tag === "Lambda") {
        const lparams = __ring_m54.params; const lbody = __ring_m54.body; const lspan = __ring_m54.span;
        let __ring_blk8;
        __ring_match55: {
          const __ring_m55 = method_type;
          if (__ring_m55._tag === "some") {
            const mt = __ring_m55._0;
            let __ring_blk9;
            __ring_match56: {
              const __ring_m56 = mt;
              if (__ring_m56._tag === "FnType") {
                const mt_params = __ring_m56.params;
                let __ring_blk10;
                __ring_match57: {
                  const __ring_m57 = List_get(mt_params, (ai + 1));
                  if (__ring_m57._tag === "some") {
                    const expected_raw = __ring_m57._0;
                    const expected = env$apply_subst(s, expected_raw);
                    let __ring_blk11;
                    __ring_match58: {
                      const __ring_m58 = expected;
                      if (__ring_m58._tag === "FnType") {
                        const exp_params = __ring_m58.params;
                        __ring_blk11 = infer_lambda(ctx, lparams, lbody, lspan, s, Option_some(exp_params), __ring_ev_fail);
                        break __ring_match58;
                      }
                      __ring_blk11 = infer_expr(ctx, arg, s, __ring_ev_fail);
                      break __ring_match58;
                    }
                    __ring_blk10 = __ring_blk11;
                    break __ring_match57;
                  }
                  if (__ring_m57._tag === "none") {
                    __ring_blk10 = infer_expr(ctx, arg, s, __ring_ev_fail);
                    break __ring_match57;
                  }
                  __match_fail(__ring_m57);
                }
                __ring_blk9 = (((ai + 1) < List_len(mt_params)) ? __ring_blk10 : infer_expr(ctx, arg, s, __ring_ev_fail));
                break __ring_match56;
              }
              __ring_blk9 = infer_expr(ctx, arg, s, __ring_ev_fail);
              break __ring_match56;
            }
            __ring_blk8 = __ring_blk9;
            break __ring_match55;
          }
          if (__ring_m55._tag === "none") {
            __ring_blk8 = infer_expr(ctx, arg, s, __ring_ev_fail);
            break __ring_match55;
          }
          __match_fail(__ring_m55);
        }
        __ring_blk7 = __ring_blk8;
        break __ring_match54;
      }
      __ring_blk7 = infer_expr(ctx, arg, s, __ring_ev_fail);
      break __ring_match54;
    }
    let ar = __ring_blk7;
    s = ar.subst;
    const me = infer_ctx$merge_effects(ctx.env, effects, ar.effects, s, __ring_ev_fail);
    effects = me[0];
    s = me[1];
    List_push(hargs, ar.hexpr);
    ai = (ai + 1);
  }
  let result_type = env$TypeEnv_fresh_var(ctx.env);
  __ring_match59: {
    const __ring_m59 = method_type;
    if (__ring_m59._tag === "some") {
      const mt = __ring_m59._0;
      __ring_match60: {
        const __ring_m60 = mt;
        if (__ring_m60._tag === "FnType") {
          const mt_params = __ring_m60.params; const mt_ret = __ring_m60.return_type; const mt_effects = __ring_m60.effects;
          let i = 0;
          const __ring_iter_14 = __List_Iterable.iter(hargs);
          while (true) {
            const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
            if (__ring_next_14._tag === "none") break;
            const harg = __ring_next_14._0;
            if (((i + 1) < List_len(mt_params))) {
              __ring_match61: {
                const __ring_m61 = List_get(mt_params, (i + 1));
                if (__ring_m61._tag === "some") {
                  const expected_param = __ring_m61._0;
                  const arg_num = Int_to_str((i + 1));
                  const marg_notes = [new diagnostics$DiagnosticNote(`argument ${arg_num} of method '${method}' expects type '${types$type_to_string(env$apply_subst(s, expected_param))}'`, Option_some(span)), new diagnostics$DiagnosticNote(`argument has type '${types$type_to_string(env$apply_subst(s, hir$hexpr_type(harg)))}'`, Option_some(hir$hexpr_span(harg)))];
                  s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, hir$hexpr_type(harg), expected_param, s, span, marg_notes);
                  break __ring_match61;
                }
                if (__ring_m61._tag === "none") {
                  break __ring_match61;
                }
                __match_fail(__ring_m61);
              }
            }
            i = (i + 1);
          }
          const expected_args = (List_len(mt_params) - 1);
          if ((List_len(hargs) > expected_args)) {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Method '${method}' expects ${Int_to_str(expected_args)} argument(s), got ${Int_to_str(List_len(hargs))}`, span, diagnostics$DiagnosticContext_TypeMismatch(`${Int_to_str(expected_args)} args`, `${Int_to_str(List_len(hargs))} args`, Option_none));
          }
          if ((List_len(hargs) < expected_args)) {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Method '${method}' expects ${Int_to_str(expected_args)} argument(s), got ${Int_to_str(List_len(hargs))}`, span, diagnostics$DiagnosticContext_TypeMismatch(`${Int_to_str(expected_args)} args`, `${Int_to_str(List_len(hargs))} args`, Option_none));
          }
          result_type = env$apply_subst(s, mt_ret);
          const me = infer_ctx$merge_effects(ctx.env, effects, mt_effects, s, __ring_ev_fail);
          effects = me[0];
          s = me[1];
          effects = infer_helpers$cancel_local_mut_effects(ctx, effects, mt_params, mt_effects, hargs, 1, s);
          break __ring_match60;
        }
        __ring_match62: {
          const __ring_m62 = recv_type;
          if (__ring_m62._tag === "TypeVar") {
            break __ring_match62;
          }
          const _ = infer_ctx$type_error(ctx.sink, codes$E0305, `Type '${types$type_to_string(recv_type)}' has no method '${method}'`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`no method '${method}' on type '${types$type_to_string(recv_type)}'`)));
          break __ring_match62;
        }
        break __ring_match60;
      }
      break __ring_match59;
    }
    if (__ring_m59._tag === "none") {
      __ring_match63: {
        const __ring_m63 = recv_type;
        if (__ring_m63._tag === "TypeVar") {
          break __ring_match63;
        }
        const _ = infer_ctx$type_error(ctx.sink, codes$E0305, `Type '${types$type_to_string(recv_type)}' has no method '${method}'`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`no method '${method}' on type '${types$type_to_string(recv_type)}'`)));
        break __ring_match63;
      }
      break __ring_match59;
    }
    __match_fail(__ring_m59);
  }
  let resolved_dicts = [];
  __ring_match64: {
    const __ring_m64 = method_scheme;
    if (__ring_m64._tag === "some") {
      const ms = __ring_m64._0;
      if ((List_len(ms.bounds) > 0)) {
        __ring_match65: {
          const __ring_m65 = method_type;
          if (__ring_m65._tag === "some") {
            const mt = __ring_m65._0;
            resolved_dicts = infer_ctx$resolve_dicts_from_scheme(ctx.sink, ctx.env, ctx.current_fn_bounds, ms, mt, s, span);
            break __ring_match65;
          }
          if (__ring_m65._tag === "none") {
            break __ring_match65;
          }
          __match_fail(__ring_m65);
        }
      }
      break __ring_match64;
    }
    if (__ring_m64._tag === "none") {
      break __ring_match64;
    }
    __match_fail(__ring_m64);
  }
  result_type = env$apply_subst(s, result_type);
  let __ring_blk12;
  __ring_match66: {
    const __ring_m66 = method_type;
    if (__ring_m66._tag === "some") {
      const mt = __ring_m66._0;
      __ring_blk12 = mt;
      break __ring_match66;
    }
    if (__ring_m66._tag === "none") {
      __ring_blk12 = env$TypeEnv_fresh_var(ctx.env);
      break __ring_match66;
    }
    __match_fail(__ring_m66);
  }
  const callee_type = __ring_blk12;
  return new infer_ctx$InferResult(hir$HExpr_Call(hir$HExpr_FieldAccess(recv_r.hexpr, method, callee_type, types$EMPTY_ROW, span), hargs, [], resolved_dicts, dict_dispatch, result_type, effects, span), s, effects);
}

function infer_match(ctx, scrutinee, arms, span, subst, __ring_ev_fail) {
  const scrut_r = infer_expr(ctx, scrutinee, subst, __ring_ev_fail);
  let s = scrut_r.subst;
  let effects = scrut_r.effects;
  const result_type = env$TypeEnv_fresh_var(ctx.env);
  let harms = [];
  const __ring_iter_15 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
    if (__ring_next_15._tag === "none") break;
    const arm = __ring_next_15._0;
    env$TypeEnv_push_scope(ctx.env);
    const arm_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some((function() {
  const match_pattern = infer_helpers$rewrite_bare_enum_bindings(ctx.env, arm.pattern);
  infer_ctx$bind_pattern(ctx, match_pattern, hir$hexpr_type(scrut_r.hexpr), s, __ring_ev_fail);
  let guard_hexpr = Option_none;
  __ring_match67: {
    const __ring_m67 = arm.guard;
    if (__ring_m67._tag === "some") {
      const g = __ring_m67._0;
      const gr = infer_expr(ctx, g, s, __ring_ev_fail);
      s = gr.subst;
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(gr.hexpr), types$BOOL, s, arm.span, __ring_ev_fail);
      const me = infer_ctx$merge_effects(ctx.env, effects, gr.effects, s, __ring_ev_fail);
      effects = me[0];
      s = me[1];
      guard_hexpr = Option_some(gr.hexpr);
      break __ring_match67;
    }
    if (__ring_m67._tag === "none") {
      break __ring_match67;
    }
    __match_fail(__ring_m67);
  }
  const body_r = infer_expr(ctx, arm.body, s, __ring_ev_fail);
  s = body_r.subst;
  const me = infer_ctx$merge_effects(ctx.env, effects, body_r.effects, s, __ring_ev_fail);
  effects = me[0];
  s = me[1];
  const match_notes = [new diagnostics$DiagnosticNote("match arms must all have the same type", Option_some(arm.span)), new diagnostics$DiagnosticNote(`this arm has type '${types$type_to_string(env$apply_subst(s, hir$hexpr_type(body_r.hexpr)))}'`, Option_some(hir$hexpr_span(body_r.hexpr)))];
  s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, hir$hexpr_type(body_r.hexpr), result_type, s, arm.span, match_notes);
  List_push(harms, new hir$HMatchArm(match_pattern, guard_hexpr, body_r.hexpr, arm.span));
  return true;
})()); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    env$TypeEnv_pop_scope(ctx.env);
    __ring_match68: {
      const __ring_m68 = arm_result;
      if (__ring_m68._tag === "none") {
        __ring_ev_fail.raise(new infer_ctx$CompileError());
        break __ring_match68;
      }
      break __ring_match68;
    }
  }
  const scrut_type_resolved = env$apply_subst(s, hir$hexpr_type(scrut_r.hexpr));
  const missing = exhaustive$check_exhaustive(ctx.env, harms, scrut_type_resolved, s);
  __ring_match69: {
    const __ring_m69 = missing;
    if (__ring_m69._tag === "some") {
      const m = __ring_m69._0;
      const msg = ((m === "_") ? `Non-exhaustive match: non-finite type '${types$type_to_string(scrut_type_resolved)}' requires a wildcard '_' or binding pattern` : `Non-exhaustive match on type ${types$type_to_string(scrut_type_resolved)}: missing pattern for ${m}`);
      const _ = infer_ctx$type_error(ctx.sink, codes$E0601, msg, span, diagnostics$DiagnosticContext_PatternError(`missing: ${m}`));
      break __ring_match69;
    }
    if (__ring_m69._tag === "none") {
      break __ring_match69;
    }
    __match_fail(__ring_m69);
  }
  const final_type = env$apply_subst(s, result_type);
  return new infer_ctx$InferResult(hir$HExpr_MatchExpr(scrut_r.hexpr, harms, final_type, effects, span), s, effects);
}

function infer_list_literal(ctx, elements, span, subst, __ring_ev_fail) {
  if ((List_len(elements) === 0)) {
    const elem_type = env$TypeEnv_fresh_var(ctx.env);
    const list_type = types$Type_StructType(hir$BUILTIN_LIST, [elem_type]);
    return new infer_ctx$InferResult(hir$HExpr_ListLit([], list_type, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
  }
  let s = subst;
  let helements = [];
  let elem_type = env$TypeEnv_fresh_var(ctx.env);
  let combined_effects = types$EMPTY_ROW;
  const __ring_iter_16 = __List_Iterable.iter(elements);
  while (true) {
    const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
    if (__ring_next_16._tag === "none") break;
    const el = __ring_next_16._0;
    const r = infer_expr(ctx, el, s, __ring_ev_fail);
    s = r.subst;
    s = infer_ctx$unify_at(ctx.sink, ctx.env, env$apply_subst(s, hir$hexpr_type(r.hexpr)), env$apply_subst(s, elem_type), s, span);
    elem_type = env$apply_subst(s, elem_type);
    List_push(helements, r.hexpr);
    const me = infer_ctx$merge_effects(ctx.env, combined_effects, r.effects, s, __ring_ev_fail);
    combined_effects = me[0];
    s = me[1];
  }
  const list_type = types$Type_StructType(hir$BUILTIN_LIST, [env$apply_subst(s, elem_type)]);
  return new infer_ctx$InferResult(hir$HExpr_ListLit(helements, list_type, combined_effects, span), s, combined_effects);
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
  __ring_match70: {
    const __ring_m70 = recv_type;
    if (__ring_m70._tag === "StructType") {
      const name = __ring_m70.name; const type_params = __ring_m70.type_params;
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
      break __ring_match70;
    }
    if (__ring_m70._tag === "StrType") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, idx_type, types$INT, s, span);
      result_ty = types$STR;
      break __ring_match70;
    }
    if (__ring_m70._tag === "ErrorType") {
      result_ty = types$Type_ErrorType;
      break __ring_match70;
    }
    const _ = infer_ctx$type_error(ctx.sink, codes$E0306, `Type '${types$type_to_string(recv_type)}' does not support indexing`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("only List, Map, and Str support subscript operator []")));
    result_ty = types$Type_ErrorType;
    break __ring_match70;
  }
  return new infer_ctx$InferResult(hir$HExpr_IndexExpr(recv_r.hexpr, idx_r.hexpr, result_ty, combined_effects, span), s, combined_effects);
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
  __ring_match71: {
    const __ring_m71 = else_branch;
    if (__ring_m71._tag === "some") {
      const eb = __ring_m71._0;
      __ring_match72: {
        const __ring_m72 = eb;
        if (__ring_m72._tag === "Block") {
          const else_r = infer_block(ctx, eb, Option_some(s), __ring_ev_fail);
          s = else_r.subst;
          const me2 = infer_ctx$merge_effects(ctx.env, effects, else_r.effects, s, __ring_ev_fail);
          effects = me2[0];
          s = me2[1];
          const if_notes = [new diagnostics$DiagnosticNote(`then branch has type '${types$type_to_string(env$apply_subst(s, hir$hexpr_type(then_r.hexpr)))}'`, Option_some(hir$hexpr_span(then_r.hexpr))), new diagnostics$DiagnosticNote(`else branch has type '${types$type_to_string(env$apply_subst(s, hir$hexpr_type(else_r.hexpr)))}'`, Option_some(hir$hexpr_span(else_r.hexpr)))];
          s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, hir$hexpr_type(then_r.hexpr), hir$hexpr_type(else_r.hexpr), s, span, if_notes);
          result_type = env$apply_subst(s, hir$hexpr_type(then_r.hexpr));
          else_hexpr = Option_some(else_r.hexpr);
          break __ring_match72;
        }
        if (__ring_m72._tag === "IfExpr") {
          const ec = __ring_m72.condition; const etb = __ring_m72.then_branch; const eeb = __ring_m72.else_branch; const espan = __ring_m72.span;
          const else_if_r = infer_if(ctx, ec, etb, eeb, espan, s, __ring_ev_fail);
          s = else_if_r.subst;
          const me2 = infer_ctx$merge_effects(ctx.env, effects, else_if_r.effects, s, __ring_ev_fail);
          effects = me2[0];
          s = me2[1];
          const elif_notes = [new diagnostics$DiagnosticNote(`then branch has type '${types$type_to_string(env$apply_subst(s, hir$hexpr_type(then_r.hexpr)))}'`, Option_some(hir$hexpr_span(then_r.hexpr))), new diagnostics$DiagnosticNote(`else branch has type '${types$type_to_string(env$apply_subst(s, hir$hexpr_type(else_if_r.hexpr)))}'`, Option_some(hir$hexpr_span(else_if_r.hexpr)))];
          s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, hir$hexpr_type(then_r.hexpr), hir$hexpr_type(else_if_r.hexpr), s, span, elif_notes);
          result_type = env$apply_subst(s, hir$hexpr_type(then_r.hexpr));
          else_hexpr = Option_some(hir$HExpr_Block([], Option_some(else_if_r.hexpr), hir$hexpr_type(else_if_r.hexpr), else_if_r.effects, espan));
          break __ring_match72;
        }
        panic("unreachable: unexpected else branch form in infer_if");
        break __ring_match72;
      }
      break __ring_match71;
    }
    if (__ring_m71._tag === "none") {
      break __ring_match71;
    }
    __match_fail(__ring_m71);
  }
  return new infer_ctx$InferResult(hir$HExpr_IfExpr(cond_r.hexpr, then_r.hexpr, else_hexpr, result_type, effects, span), s, effects);
}

function infer_handle(ctx, body, handlers, span, subst, __ring_ev_fail) {
  const body_r = infer_expr(ctx, body, subst, __ring_ev_fail);
  let s = body_r.subst;
  let effects = body_r.effects;
  let hhandlers = [];
  let handled_effects = set_new();
  const __ring_iter_17 = __List_Iterable.iter(handlers);
  while (true) {
    const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
    if (__ring_next_17._tag === "none") break;
    const handler = __ring_next_17._0;
    env$TypeEnv_push_scope(ctx.env);
    const effect_def = _Map_get(ctx.env.types.effects, handler.effect_name);
    let handler_inst_map = map_new();
    __ring_match73: {
      const __ring_m73 = effect_def;
      if (__ring_m73._tag === "some") {
        const ed = __ring_m73._0;
        const __ring_iter_18 = __List_Iterable.iter(ed.type_param_vars);
        while (true) {
          const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
          if (__ring_next_18._tag === "none") break;
          const tpv = __ring_next_18._0;
          const fresh = env$TypeEnv_fresh_var(ctx.env);
          _Map_insert(handler_inst_map, tpv, fresh);
        }
        break __ring_match73;
      }
      if (__ring_m73._tag === "none") {
        break __ring_match73;
      }
      __match_fail(__ring_m73);
    }
    let op_def = Option_none;
    __ring_match74: {
      const __ring_m74 = effect_def;
      if (__ring_m74._tag === "some") {
        const ed = __ring_m74._0;
        op_def = ((__a) => { const __i = __a.findIndex((function(o) { return (o.name === handler.op_name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(ed.ops);
        break __ring_match74;
      }
      if (__ring_m74._tag === "none") {
        break __ring_match74;
      }
      __match_fail(__ring_m74);
    }
    let hparams = [];
    let hi = 0;
    const __ring_iter_19 = __List_Iterable.iter(handler.params);
    while (true) {
      const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
      if (__ring_next_19._tag === "none") break;
      const p = __ring_next_19._0;
      let __ring_blk13;
      __ring_match75: {
        const __ring_m75 = p.type_annotation;
        if (__ring_m75._tag === "some") {
          const ta = __ring_m75._0;
          __ring_blk13 = infer_ctx$resolve_type_expr(ctx, ta);
          break __ring_match75;
        }
        if (__ring_m75._tag === "none") {
          let __ring_blk14;
          __ring_match76: {
            const __ring_m76 = op_def;
            if (__ring_m76._tag === "some") {
              const od = __ring_m76._0;
              let __ring_blk15;
              __ring_match77: {
                const __ring_m77 = List_get(od.params, hi);
                if (__ring_m77._tag === "some") {
                  const odt = __ring_m77._0;
                  __ring_blk15 = env$apply_subst_map(handler_inst_map, odt);
                  break __ring_match77;
                }
                if (__ring_m77._tag === "none") {
                  __ring_blk15 = env$TypeEnv_fresh_var(ctx.env);
                  break __ring_match77;
                }
                __match_fail(__ring_m77);
              }
              __ring_blk14 = __ring_blk15;
              break __ring_match76;
            }
            if (__ring_m76._tag === "none") {
              __ring_blk14 = env$TypeEnv_fresh_var(ctx.env);
              break __ring_match76;
            }
            __match_fail(__ring_m76);
          }
          __ring_blk13 = __ring_blk14;
          break __ring_match75;
        }
        __match_fail(__ring_m75);
      }
      const pt = __ring_blk13;
      env$TypeEnv_bind_mono(ctx.env, p.name, pt);
      List_push(hparams, new hir$HParam(p.name, pt, Option_none, false));
      hi = (hi + 1);
    }
    __ring_match78: {
      const __ring_m78 = handler.resume_name;
      if (__ring_m78._tag === "some") {
        const rn = __ring_m78._0;
        let __ring_blk16;
        __ring_match79: {
          const __ring_m79 = op_def;
          if (__ring_m79._tag === "some") {
            const od = __ring_m79._0;
            __ring_blk16 = env$apply_subst_map(handler_inst_map, od.return_type);
            break __ring_match79;
          }
          if (__ring_m79._tag === "none") {
            __ring_blk16 = env$TypeEnv_fresh_var(ctx.env);
            break __ring_match79;
          }
          __match_fail(__ring_m79);
        }
        const resume_param = __ring_blk16;
        const resume_ret = env$TypeEnv_fresh_var(ctx.env);
        env$TypeEnv_bind_mono(ctx.env, rn, types$Type_FnType([resume_param], resume_ret, types$EMPTY_ROW));
        break __ring_match78;
      }
      if (__ring_m78._tag === "none") {
        break __ring_match78;
      }
      __match_fail(__ring_m78);
    }
    const handler_body_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_expr(ctx, handler.body, s, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    env$TypeEnv_pop_scope(ctx.env);
    __ring_match80: {
      const __ring_m80 = handler_body_result;
      if (__ring_m80._tag === "some") {
        const hbr = __ring_m80._0;
        s = hbr.subst;
        List_push(hhandlers, new hir$HEffectHandler(handler.effect_name, handler.op_name, hparams, handler.resume_name, hbr.hexpr));
        break __ring_match80;
      }
      if (__ring_m80._tag === "none") {
        __ring_ev_fail.raise(new infer_ctx$CompileError());
        break __ring_match80;
      }
      __match_fail(__ring_m80);
    }
    _Set_insert(handled_effects, handler.effect_name);
  }
  const resolved_effects = env$apply_subst_row(s, effects);
  let filtered_effects = [];
  const __ring_iter_20 = __List_Iterable.iter(resolved_effects.effects);
  while (true) {
    const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
    if (__ring_next_20._tag === "none") break;
    const e = __ring_next_20._0;
    let __ring_blk17;
    __ring_match81: {
      const __ring_m81 = e;
      if (__ring_m81._tag === "IoEffect") {
        __ring_blk17 = (!_Set_contains(handled_effects, "io", __Str_Eq));
        break __ring_match81;
      }
      if (__ring_m81._tag === "CustomEffect") {
        const name = __ring_m81.name;
        __ring_blk17 = (!_Set_contains(handled_effects, name, __Str_Eq));
        break __ring_match81;
      }
      if (__ring_m81._tag === "FailEffect") {
        __ring_blk17 = (!_Set_contains(handled_effects, "fail", __Str_Eq));
        break __ring_match81;
      }
      if (__ring_m81._tag === "MutEffect") {
        __ring_blk17 = (!_Set_contains(handled_effects, "mut", __Str_Eq));
        break __ring_match81;
      }
      __match_fail(__ring_m81);
    }
    const should_keep = __ring_blk17;
    if (should_keep) {
      List_push(filtered_effects, e);
    }
  }
  effects = new types$EffectRow(filtered_effects, resolved_effects.tail);
  return new infer_ctx$InferResult(hir$HExpr_HandleExpr(body_r.hexpr, hhandlers, hir$hexpr_type(body_r.hexpr), effects, span), s, effects);
}

function infer_field_access(ctx, receiver, field, span, subst, __ring_ev_fail) {
  const recv_r = infer_expr(ctx, receiver, subst, __ring_ev_fail);
  const s = recv_r.subst;
  const recv_type = env$apply_subst(s, hir$hexpr_type(recv_r.hexpr));
  let field_type = env$TypeEnv_fresh_var(ctx.env);
  __ring_match82: {
    const __ring_m82 = recv_type;
    if (__ring_m82._tag === "StructType") {
      const name = __ring_m82.name; const type_params = __ring_m82.type_params;
      __ring_match83: {
        const __ring_m83 = _Map_get(ctx.env.types.structs, name);
        if (__ring_m83._tag === "some") {
          const struct_def = __ring_m83._0;
          const f = ((__a) => { const __i = __a.findIndex((function(f_) { return (f_.name === field); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(struct_def.fields);
          __ring_match84: {
            const __ring_m84 = f;
            if (__ring_m84._tag === "some") {
              const found_field = __ring_m84._0;
              let inst_map = map_new();
              let fi = 0;
              while (((fi < List_len(struct_def.type_param_vars)) ? (fi < List_len(type_params)) : false)) {
                __ring_match85: {
                  const __ring_m85 = [List_get(struct_def.type_param_vars, fi), List_get(type_params, fi)];
                  if (Array.isArray(__ring_m85) && __ring_m85.length === 2 && __ring_m85[0]._tag === "some" && __ring_m85[1]._tag === "some") {
                    const var_id = __ring_m85[0]._0; const tp = __ring_m85[1]._0;
                    _Map_insert(inst_map, var_id, tp);
                    break __ring_match85;
                  }
                  break __ring_match85;
                }
                fi = (fi + 1);
              }
              field_type = env$apply_subst_map(inst_map, found_field.ty);
              break __ring_match84;
            }
            if (__ring_m84._tag === "none") {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0304, `Struct ${name} has no field ${field}`, span, diagnostics$DiagnosticContext_MissingField(field, name, Option_none));
              break __ring_match84;
            }
            __match_fail(__ring_m84);
          }
          break __ring_match83;
        }
        if (__ring_m83._tag === "none") {
          const _ = infer_ctx$type_error(ctx.sink, codes$E0203, `Unknown struct: ${name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`unknown struct '${name}'`)));
          break __ring_match83;
        }
        __match_fail(__ring_m83);
      }
      break __ring_match82;
    }
    if (__ring_m82._tag === "RecordType") {
      const rec_fields = __ring_m82.fields; const tail = __ring_m82.tail;
      const f = ((__a) => { const __i = __a.findIndex((function(f_) { return (f_.name === field); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(rec_fields);
      __ring_match86: {
        const __ring_m86 = f;
        if (__ring_m86._tag === "some") {
          const found_field = __ring_m86._0;
          field_type = found_field.ty;
          break __ring_match86;
        }
        if (__ring_m86._tag === "none") {
          __ring_match87: {
            const __ring_m87 = tail;
            if (__ring_m87._tag === "some") {
              break __ring_match87;
            }
            if (__ring_m87._tag === "none") {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0304, `Record type has no field '${field}'`, span, diagnostics$DiagnosticContext_MissingField(field, "record", Option_none));
              break __ring_match87;
            }
            __match_fail(__ring_m87);
          }
          break __ring_match86;
        }
        __match_fail(__ring_m86);
      }
      break __ring_match82;
    }
    if (__ring_m82._tag === "TupleType") {
      const elements = __ring_m82.elements;
      __ring_match88: {
        const __ring_m88 = parse_int(field);
        if (__ring_m88._tag === "none") {
          const _ = infer_ctx$type_error(ctx.sink, codes$E0304, `Cannot access named field '${field}' on tuple type; use .0, .1, etc.`, span, diagnostics$DiagnosticContext_MissingField(field, "tuple", Option_none));
          break __ring_match88;
        }
        if (__ring_m88._tag === "some") {
          const i = __ring_m88._0;
          if (((i < 0) ? true : (i >= List_len(elements)))) {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0304, `Tuple index ${field} out of bounds; tuple has ${Int_to_str(List_len(elements))} elements`, span, diagnostics$DiagnosticContext_MissingField(field, "tuple", Option_none));
          }
          __ring_match89: {
            const __ring_m89 = List_get(elements, i);
            if (__ring_m89._tag === "some") {
              const t = __ring_m89._0;
              field_type = t;
              break __ring_match89;
            }
            if (__ring_m89._tag === "none") {
              panic("unreachable: tuple index bounds already checked");
              break __ring_match89;
            }
            __match_fail(__ring_m89);
          }
          break __ring_match88;
        }
        __match_fail(__ring_m88);
      }
      break __ring_match82;
    }
    if (__ring_m82._tag === "TypeVar") {
      break __ring_match82;
    }
    const _ = infer_ctx$type_error(ctx.sink, codes$E0304, `Cannot access field '${field}' on type ${types$type_to_string(recv_type)}`, span, diagnostics$DiagnosticContext_MissingField(field, types$type_to_string(recv_type), Option_none));
    break __ring_match82;
  }
  return new infer_ctx$InferResult(hir$HExpr_FieldAccess(recv_r.hexpr, field, field_type, recv_r.effects, span), s, recv_r.effects);
}

function infer_catch(ctx, expr, arms, span, subst, __ring_ev_fail) {
  const expr_r = infer_expr(ctx, expr, subst, __ring_ev_fail);
  let s = expr_r.subst;
  let effects = expr_r.effects;
  let error_type = env$TypeEnv_fresh_var(ctx.env);
  let found_fail = false;
  const __ring_iter_21 = __List_Iterable.iter(effects.effects);
  while (true) {
    const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
    if (__ring_next_21._tag === "none") break;
    const eff = __ring_next_21._0;
    __ring_match90: {
      const __ring_m90 = eff;
      if (__ring_m90._tag === "FailEffect") {
        const et = __ring_m90.error_type;
        if (found_fail) {
          s = infer_ctx$unify_at(ctx.sink, ctx.env, error_type, et, s, span);
        } else {
          error_type = et;
          found_fail = true;
        }
        break __ring_match90;
      }
      break __ring_match90;
    }
  }
  const resolved_row = env$apply_subst_row(s, effects);
  let __ring_blk18;
  __ring_match91: {
    const __ring_m91 = resolved_row.tail;
    if (__ring_m91._tag === "some") {
      __ring_blk18 = true;
      break __ring_match91;
    }
    if (__ring_m91._tag === "none") {
      __ring_blk18 = false;
      break __ring_match91;
    }
    __match_fail(__ring_m91);
  }
  const has_open_tail = __ring_blk18;
  if (((found_fail === false) ? (has_open_tail === false) : false)) {
    const warn = diagnostics$make_diag(codes$W0001, diagnostics$Severity_SevWarning, "catch on expression with no fail effect; handler will never execute", span, diagnostics$DiagnosticContext_OtherContext(Option_some("body has no fail effect")));
    diagnostics$CollectingSink_report(ctx.sink, warn);
  }
  const result_type = env$TypeEnv_fresh_var(ctx.env);
  s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(expr_r.hexpr), result_type, s, span);
  let harms = [];
  const __ring_iter_22 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
    if (__ring_next_22._tag === "none") break;
    const arm = __ring_next_22._0;
    env$TypeEnv_push_scope(ctx.env);
    const arm_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some((function() {
  infer_ctx$bind_pattern(ctx, arm.pattern, error_type, s);
  let guard_hexpr = Option_none;
  __ring_match92: {
    const __ring_m92 = arm.guard;
    if (__ring_m92._tag === "some") {
      const g = __ring_m92._0;
      const gr = infer_expr(ctx, g, s, __ring_ev_fail);
      s = gr.subst;
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(gr.hexpr), types$BOOL, s, arm.span);
      const me = infer_ctx$merge_effects(ctx.env, effects, gr.effects, s, __ring_ev_fail);
      effects = me[0];
      s = me[1];
      guard_hexpr = Option_some(gr.hexpr);
      break __ring_match92;
    }
    if (__ring_m92._tag === "none") {
      break __ring_match92;
    }
    __match_fail(__ring_m92);
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
    __ring_match93: {
      const __ring_m93 = arm_result;
      if (__ring_m93._tag === "none") {
        __ring_ev_fail.raise(new infer_ctx$CompileError());
        break __ring_match93;
      }
      break __ring_match93;
    }
  }
  const error_type_resolved = env$apply_subst(s, error_type);
  const missing = exhaustive$check_exhaustive(ctx.env, harms, error_type_resolved, s);
  __ring_match94: {
    const __ring_m94 = missing;
    if (__ring_m94._tag === "some") {
      const m = __ring_m94._0;
      const msg = ((m === "_") ? `Non-exhaustive catch: non-finite error type '${types$type_to_string(error_type_resolved)}' requires a wildcard '_' or binding pattern` : `Non-exhaustive catch on error type ${types$type_to_string(error_type_resolved)}: missing pattern for ${m}`);
      const _ = infer_ctx$type_error(ctx.sink, codes$E0601, msg, span, diagnostics$DiagnosticContext_PatternError(`missing: ${m}`));
      break __ring_match94;
    }
    if (__ring_m94._tag === "none") {
      break __ring_match94;
    }
    __match_fail(__ring_m94);
  }
  effects = infer_ctx$remove_fail_effect(effects);
  const final_type = env$apply_subst(s, result_type);
  return new infer_ctx$InferResult(hir$HExpr_TryCatch(expr_r.hexpr, harms, final_type, effects, span), s, effects);
}

function infer_lambda(ctx, params, body, span, subst, expected_param_types, __ring_ev_fail) {
  env$TypeEnv_push_scope(ctx.env);
  ctx.lambda_depth = (ctx.lambda_depth + 1);
  let s = subst;
  let hparams = [];
  let param_types = [];
  let pi = 0;
  const __ring_iter_23 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
    if (__ring_next_23._tag === "none") break;
    const p = __ring_next_23._0;
    let __ring_blk19;
    __ring_match95: {
      const __ring_m95 = p.type_annotation;
      if (__ring_m95._tag === "some") {
        const ta = __ring_m95._0;
        __ring_blk19 = infer_ctx$resolve_type_expr(ctx, ta);
        break __ring_match95;
      }
      if (__ring_m95._tag === "none") {
        __ring_blk19 = env$TypeEnv_fresh_var(ctx.env);
        break __ring_match95;
      }
      __match_fail(__ring_m95);
    }
    const pt = __ring_blk19;
    __ring_match96: {
      const __ring_m96 = expected_param_types;
      if (__ring_m96._tag === "some") {
        const epts = __ring_m96._0;
        if (Option_is_none(p.type_annotation)) {
          __ring_match97: {
            const __ring_m97 = List_get(epts, pi);
            if (__ring_m97._tag === "some") {
              const expected_t = __ring_m97._0;
              s = infer_ctx$unify_at(ctx.sink, ctx.env, pt, expected_t, s, span);
              break __ring_match97;
            }
            if (__ring_m97._tag === "none") {
              break __ring_match97;
            }
            __match_fail(__ring_m97);
          }
        }
        break __ring_match96;
      }
      if (__ring_m96._tag === "none") {
        break __ring_match96;
      }
      __match_fail(__ring_m96);
    }
    env$TypeEnv_bind_mono(ctx.env, p.name, pt);
    const lam_scheme = env$TypeEnv_lookup(ctx.env, p.name);
    __ring_match98: {
      const __ring_m98 = lam_scheme;
      if (__ring_m98._tag === "some") {
        const ls = __ring_m98._0;
        __ring_match99: {
          const __ring_m99 = ls.def_id;
          if (__ring_m99._tag === "some") {
            const did = __ring_m99._0;
            env$TypeEnv_record_def_span(ctx.env, did, p.span);
            _Map_insert(ctx.var_lambda_depth, did, ctx.lambda_depth);
            if (p.is_mutable) {
              _Set_insert(ctx.env.scope.mutable_vars, did);
              _Set_insert(ctx.env.scope.mut_param_defs, did);
            } else {
              _Set_insert(ctx.env.scope.let_defs, did);
            }
            break __ring_match99;
          }
          if (__ring_m99._tag === "none") {
            break __ring_match99;
          }
          __match_fail(__ring_m99);
        }
        List_push(hparams, new hir$HParam(p.name, pt, ls.def_id, p.is_mutable));
        break __ring_match98;
      }
      if (__ring_m98._tag === "none") {
        List_push(hparams, new hir$HParam(p.name, pt, Option_none, p.is_mutable));
        break __ring_match98;
      }
      __match_fail(__ring_m98);
    }
    List_push(param_types, pt);
    pi = (pi + 1);
  }
  const body_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_expr(ctx, body, s, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  ctx.lambda_depth = (ctx.lambda_depth - 1);
  env$TypeEnv_pop_scope(ctx.env);
  __ring_match100: {
    const __ring_m100 = body_result;
    if (__ring_m100._tag === "some") {
      const body_r = __ring_m100._0;
      s = body_r.subst;
      let applied_params = [];
      const __ring_iter_24 = __List_Iterable.iter(param_types);
      while (true) {
        const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
        if (__ring_next_24._tag === "none") break;
        const pt = __ring_next_24._0;
        List_push(applied_params, env$apply_subst(s, pt));
      }
      const applied_ret = env$apply_subst(s, hir$hexpr_type(body_r.hexpr));
      const fn_type = types$Type_FnType(applied_params, applied_ret, body_r.effects);
      let final_hparams = [];
      const __ring_iter_25 = __List_Iterable.iter(hparams);
      while (true) {
        const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
        if (__ring_next_25._tag === "none") break;
        const hp = __ring_next_25._0;
        List_push(final_hparams, new hir$HParam(hp.name, env$apply_subst(s, hp.ty), hp.def_id, hp.is_mutable));
      }
      return new infer_ctx$InferResult(hir$HExpr_Lambda(final_hparams, applied_ret, body_r.hexpr, fn_type, types$EMPTY_ROW, span), s, types$EMPTY_ROW);
      break __ring_match100;
    }
    if (__ring_m100._tag === "none") {
      return __ring_ev_fail.raise(new infer_ctx$CompileError());
      break __ring_match100;
    }
    __match_fail(__ring_m100);
  }
}

function infer_call(ctx, callee, args, span, subst, __ring_ev_fail) {
  const callee_r = infer_expr(ctx, callee, subst, __ring_ev_fail);
  let s = callee_r.subst;
  let effects = callee_r.effects;
  const resolved_callee = env$apply_subst(s, hir$hexpr_type(callee_r.hexpr));
  let __ring_blk20;
  __ring_match101: {
    const __ring_m101 = resolved_callee;
    if (__ring_m101._tag === "FnType") {
      __ring_blk20 = Option_some(resolved_callee);
      break __ring_match101;
    }
    __ring_blk20 = Option_none;
    break __ring_match101;
  }
  const callee_fn_type = __ring_blk20;
  let hargs = [];
  let arg_types = [];
  let ai = 0;
  const __ring_iter_26 = __List_Iterable.iter(args);
  while (true) {
    const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
    if (__ring_next_26._tag === "none") break;
    const arg = __ring_next_26._0;
    let __ring_blk21;
    __ring_match102: {
      const __ring_m102 = arg;
      if (__ring_m102._tag === "Lambda") {
        const lparams = __ring_m102.params; const lbody = __ring_m102.body; const lspan = __ring_m102.span;
        let __ring_blk22;
        __ring_match103: {
          const __ring_m103 = callee_fn_type;
          if (__ring_m103._tag === "some") {
            const cft = __ring_m103._0;
            let __ring_blk23;
            __ring_match104: {
              const __ring_m104 = cft;
              if (__ring_m104._tag === "FnType") {
                const cft_params = __ring_m104.params;
                let __ring_blk24;
                __ring_match105: {
                  const __ring_m105 = List_get(cft_params, ai);
                  if (__ring_m105._tag === "some") {
                    const expected_raw = __ring_m105._0;
                    const expected = env$apply_subst(s, expected_raw);
                    let __ring_blk25;
                    __ring_match106: {
                      const __ring_m106 = expected;
                      if (__ring_m106._tag === "FnType") {
                        const exp_params = __ring_m106.params;
                        __ring_blk25 = infer_lambda(ctx, lparams, lbody, lspan, s, Option_some(exp_params), __ring_ev_fail);
                        break __ring_match106;
                      }
                      __ring_blk25 = infer_expr(ctx, arg, s, __ring_ev_fail);
                      break __ring_match106;
                    }
                    __ring_blk24 = __ring_blk25;
                    break __ring_match105;
                  }
                  if (__ring_m105._tag === "none") {
                    __ring_blk24 = infer_expr(ctx, arg, s, __ring_ev_fail);
                    break __ring_match105;
                  }
                  __match_fail(__ring_m105);
                }
                __ring_blk23 = ((ai < List_len(cft_params)) ? __ring_blk24 : infer_expr(ctx, arg, s, __ring_ev_fail));
                break __ring_match104;
              }
              __ring_blk23 = infer_expr(ctx, arg, s, __ring_ev_fail);
              break __ring_match104;
            }
            __ring_blk22 = __ring_blk23;
            break __ring_match103;
          }
          if (__ring_m103._tag === "none") {
            __ring_blk22 = infer_expr(ctx, arg, s, __ring_ev_fail);
            break __ring_match103;
          }
          __match_fail(__ring_m103);
        }
        __ring_blk21 = __ring_blk22;
        break __ring_match102;
      }
      __ring_blk21 = infer_expr(ctx, arg, s, __ring_ev_fail);
      break __ring_match102;
    }
    let ar = __ring_blk21;
    s = ar.subst;
    const me = infer_ctx$merge_effects(ctx.env, effects, ar.effects, s, __ring_ev_fail);
    effects = me[0];
    s = me[1];
    List_push(hargs, ar.hexpr);
    List_push(arg_types, hir$hexpr_type(ar.hexpr));
    ai = (ai + 1);
  }
  let __ring_blk26;
  __ring_match107: {
    const __ring_m107 = callee;
    if (__ring_m107._tag === "Ident") {
      const cn = __ring_m107.name;
      __ring_blk26 = Option_some(cn);
      break __ring_match107;
    }
    __ring_blk26 = Option_none;
    break __ring_match107;
  }
  const callee_name_for_defaults = __ring_blk26;
  __ring_match108: {
    const __ring_m108 = callee_name_for_defaults;
    if (__ring_m108._tag === "some") {
      const cn = __ring_m108._0;
      __ring_match109: {
        const __ring_m109 = _Map_get(ctx.fn_defaults, cn);
        if (__ring_m109._tag === "some") {
          const defaults = __ring_m109._0;
          __ring_match110: {
            const __ring_m110 = _Map_get(ctx.fn_min_arity, cn);
            if (__ring_m110._tag === "some") {
              const min_ar = __ring_m110._0;
              const total_arity = (min_ar + List_len(defaults));
              if (((List_len(args) < total_arity) ? (List_len(args) >= min_ar) : false)) {
                const defaults_start = (List_len(args) - min_ar);
                let di = defaults_start;
                while ((di < List_len(defaults))) {
                  __ring_match111: {
                    const __ring_m111 = List_get(defaults, di);
                    if (__ring_m111._tag === "some") {
                      const dh = __ring_m111._0;
                      List_push(hargs, dh);
                      List_push(arg_types, hir$hexpr_type(dh));
                      break __ring_match111;
                    }
                    if (__ring_m111._tag === "none") {
                      break __ring_match111;
                    }
                    __match_fail(__ring_m111);
                  }
                  di = (di + 1);
                }
              }
              break __ring_match110;
            }
            if (__ring_m110._tag === "none") {
              break __ring_match110;
            }
            __match_fail(__ring_m110);
          }
          break __ring_match109;
        }
        if (__ring_m109._tag === "none") {
          break __ring_match109;
        }
        __match_fail(__ring_m109);
      }
      break __ring_match108;
    }
    if (__ring_m108._tag === "none") {
      break __ring_match108;
    }
    __match_fail(__ring_m108);
  }
  const ret_var = env$TypeEnv_fresh_var(ctx.env);
  const effect_tail = env$TypeEnv_fresh_var_id(ctx.env);
  const expected_fn = types$Type_FnType(arg_types, ret_var, new types$EffectRow([], Option_some(effect_tail)));
  let __ring_blk27;
  __ring_match112: {
    const __ring_m112 = callee;
    if (__ring_m112._tag === "Ident") {
      const cn = __ring_m112.name;
      __ring_blk27 = cn;
      break __ring_match112;
    }
    __ring_blk27 = "<expression>";
    break __ring_match112;
  }
  const callee_name_for_note = __ring_blk27;
  const call_notes = [new diagnostics$DiagnosticNote(`calling '${callee_name_for_note}' with ${Int_to_str(List_len(arg_types))} argument(s)`, Option_some(span))];
  s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, hir$hexpr_type(callee_r.hexpr), expected_fn, s, span, call_notes);
  const resolved_callee_type = env$apply_subst(s, hir$hexpr_type(callee_r.hexpr));
  __ring_match113: {
    const __ring_m113 = resolved_callee_type;
    if (__ring_m113._tag === "FnType") {
      const callee_params = __ring_m113.params; const fn_effects = __ring_m113.effects;
      const me = infer_ctx$merge_effects(ctx.env, effects, fn_effects, s, __ring_ev_fail);
      effects = me[0];
      s = me[1];
      effects = infer_helpers$cancel_local_mut_effects(ctx, effects, callee_params, fn_effects, hargs, 0, s);
      break __ring_match113;
    }
    break __ring_match113;
  }
  let resolved_dicts = [];
  __ring_match114: {
    const __ring_m114 = callee;
    if (__ring_m114._tag === "Ident") {
      const callee_name = __ring_m114.name;
      __ring_match115: {
        const __ring_m115 = env$TypeEnv_lookup(ctx.env, callee_name);
        if (__ring_m115._tag === "some") {
          const callee_scheme = __ring_m115._0;
          if ((List_len(callee_scheme.bounds) > 0)) {
            resolved_dicts = infer_ctx$resolve_dicts_from_scheme(ctx.sink, ctx.env, ctx.current_fn_bounds, callee_scheme, hir$hexpr_type(callee_r.hexpr), s, span);
          }
          break __ring_match115;
        }
        if (__ring_m115._tag === "none") {
          break __ring_match115;
        }
        __match_fail(__ring_m115);
      }
      break __ring_match114;
    }
    break __ring_match114;
  }
  const result_type = env$apply_subst(s, ret_var);
  __ring_match116: {
    const __ring_m116 = callee;
    if (__ring_m116._tag === "Ident") {
      const callee_name = __ring_m116.name;
      __ring_match117: {
        const __ring_m117 = _Map_get(ctx.fn_mut_params, callee_name);
        if (__ring_m117._tag === "some") {
          const mut_flags = __ring_m117._0;
          let mi = 0;
          while (((mi < List_len(mut_flags)) ? (mi < List_len(args)) : false)) {
            __ring_match118: {
              const __ring_m118 = [List_get(mut_flags, mi), List_get(hargs, mi)];
              if (Array.isArray(__ring_m118) && __ring_m118.length === 2 && __ring_m118[0]._tag === "some" && __ring_m118[1]._tag === "some") {
                const is_mut = __ring_m118[0]._0; const harg = __ring_m118[1]._0;
                if (is_mut) {
                  __ring_match119: {
                    const __ring_m119 = harg;
                    if (__ring_m119._tag === "Ident" && __ring_m119.def_id._tag === "some") {
                      const arg_did = __ring_m119.def_id._0;
                      if (_Set_contains(ctx.env.scope.mutable_vars, arg_did, __Int_Eq)) {
                        __ring_match120: {
                          const __ring_m120 = resolved_callee_type;
                          if (__ring_m120._tag === "FnType") {
                            const fn_params = __ring_m120.params;
                            __ring_match121: {
                              const __ring_m121 = List_get(fn_params, mi);
                              if (__ring_m121._tag === "some") {
                                const pt = __ring_m121._0;
                                const resolved_pt = env$apply_subst(s, pt);
                                if (infer_helpers$is_value_type(resolved_pt)) {
                                  _Set_insert(ctx.boxed_vars, arg_did);
                                }
                                break __ring_match121;
                              }
                              if (__ring_m121._tag === "none") {
                                break __ring_match121;
                              }
                              __match_fail(__ring_m121);
                            }
                            break __ring_match120;
                          }
                          break __ring_match120;
                        }
                      }
                      break __ring_match119;
                    }
                    break __ring_match119;
                  }
                }
                break __ring_match118;
              }
              break __ring_match118;
            }
            mi = (mi + 1);
          }
          break __ring_match117;
        }
        if (__ring_m117._tag === "none") {
          break __ring_match117;
        }
        __match_fail(__ring_m117);
      }
      break __ring_match116;
    }
    break __ring_match116;
  }
  let final_hargs = [];
  const __ring_iter_27 = __List_Iterable.iter(hargs);
  while (true) {
    const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
    if (__ring_next_27._tag === "none") break;
    const harg = __ring_next_27._0;
    List_push(final_hargs, infer_helpers$resolve_arg_dict_closure(ctx, harg, s));
  }
  return new infer_ctx$InferResult(hir$HExpr_Call(callee_r.hexpr, final_hargs, [], resolved_dicts, Option_none, result_type, effects, span), s, effects);
}

function infer_stmt(ctx, stmt, subst, __ring_ev_fail) {
  __ring_match122: {
    const __ring_m122 = stmt;
    if (__ring_m122._tag === "Let") {
      const name = __ring_m122.name; const name_span = __ring_m122.name_span; const type_annotation = __ring_m122.type_annotation; const init = __ring_m122.init; const span = __ring_m122.span;
      const init_r = infer_expr(ctx, init, subst, __ring_ev_fail);
      let s = init_r.subst;
      let var_type = hir$hexpr_type(init_r.hexpr);
      __ring_match123: {
        const __ring_m123 = type_annotation;
        if (__ring_m123._tag === "some") {
          const ta = __ring_m123._0;
          const annotated = infer_ctx$resolve_type_expr(ctx, ta);
          const notes = [new diagnostics$DiagnosticNote(`expected '${types$type_to_string(annotated)}' because variable '${name}' is declared with this type`, Option_some(name_span)), new diagnostics$DiagnosticNote(`initializer has type '${types$type_to_string(env$apply_subst(s, var_type))}'`, Option_some(hir$hexpr_span(init_r.hexpr)))];
          s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, var_type, annotated, s, span, notes);
          var_type = env$apply_subst(s, annotated);
          break __ring_match123;
        }
        if (__ring_m123._tag === "none") {
          break __ring_match123;
        }
        __match_fail(__ring_m123);
      }
      const resolved = env$apply_subst(s, var_type);
      const ftv = infer_ctx$free_type_vars(resolved, unify$empty_subst());
      const scheme = ((_Set_len(ftv) === 0) ? env$mono(resolved) : infer_ctx$generalize(ctx.env, resolved, s));
      env$TypeEnv_bind(ctx.env, name, scheme);
      const bound_scheme = env$TypeEnv_lookup(ctx.env, name);
      let __ring_blk28;
      __ring_match124: {
        const __ring_m124 = bound_scheme;
        if (__ring_m124._tag === "some") {
          const bs = __ring_m124._0;
          let __ring_blk29;
          __ring_match125: {
            const __ring_m125 = bs.def_id;
            if (__ring_m125._tag === "some") {
              const did = __ring_m125._0;
              env$TypeEnv_record_def_span(ctx.env, did, name_span);
              _Set_insert(ctx.env.scope.let_defs, did);
              _Map_insert(ctx.var_lambda_depth, did, ctx.lambda_depth);
              __ring_blk29 = Option_some(did);
              break __ring_match125;
            }
            if (__ring_m125._tag === "none") {
              __ring_blk29 = Option_none;
              break __ring_match125;
            }
            __match_fail(__ring_m125);
          }
          __ring_blk28 = __ring_blk29;
          break __ring_match124;
        }
        if (__ring_m124._tag === "none") {
          __ring_blk28 = Option_none;
          break __ring_match124;
        }
        __match_fail(__ring_m124);
      }
      const bound_def_id = __ring_blk28;
      return new infer_helpers$StmtResult(hir$HStmt_Let(name, name_span, bound_def_id, resolved, init_r.hexpr, span), s, init_r.effects);
      break __ring_match122;
    }
    if (__ring_m122._tag === "Var") {
      const name = __ring_m122.name; const name_span = __ring_m122.name_span; const type_annotation = __ring_m122.type_annotation; const init = __ring_m122.init; const span = __ring_m122.span;
      const init_r = infer_expr(ctx, init, subst, __ring_ev_fail);
      let s = init_r.subst;
      let var_type = hir$hexpr_type(init_r.hexpr);
      __ring_match126: {
        const __ring_m126 = type_annotation;
        if (__ring_m126._tag === "some") {
          const ta = __ring_m126._0;
          const annotated = infer_ctx$resolve_type_expr(ctx, ta);
          const notes = [new diagnostics$DiagnosticNote(`expected '${types$type_to_string(annotated)}' because variable '${name}' is declared with this type`, Option_some(name_span)), new diagnostics$DiagnosticNote(`initializer has type '${types$type_to_string(env$apply_subst(s, var_type))}'`, Option_some(hir$hexpr_span(init_r.hexpr)))];
          s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, var_type, annotated, s, span, notes);
          var_type = env$apply_subst(s, annotated);
          break __ring_match126;
        }
        if (__ring_m126._tag === "none") {
          break __ring_match126;
        }
        __match_fail(__ring_m126);
      }
      env$TypeEnv_bind_mono(ctx.env, name, env$apply_subst(s, var_type));
      const var_scheme = env$TypeEnv_lookup(ctx.env, name);
      __ring_match127: {
        const __ring_m127 = var_scheme;
        if (__ring_m127._tag === "some") {
          const vs = __ring_m127._0;
          __ring_match128: {
            const __ring_m128 = vs.def_id;
            if (__ring_m128._tag === "some") {
              const did = __ring_m128._0;
              env$TypeEnv_record_def_span(ctx.env, did, name_span);
              _Set_insert(ctx.env.scope.mutable_vars, did);
              _Map_insert(ctx.var_lambda_depth, did, ctx.lambda_depth);
              break __ring_match128;
            }
            if (__ring_m128._tag === "none") {
              break __ring_match128;
            }
            __match_fail(__ring_m128);
          }
          return new infer_helpers$StmtResult(hir$HStmt_Var(name, name_span, vs.def_id, env$apply_subst(s, var_type), init_r.hexpr, span), s, init_r.effects);
          break __ring_match127;
        }
        if (__ring_m127._tag === "none") {
          return panic("unreachable: var_stmt lookup failed after bind");
          break __ring_match127;
        }
        __match_fail(__ring_m127);
      }
      break __ring_match122;
    }
    if (__ring_m122._tag === "Assign") {
      const target = __ring_m122.target; const value = __ring_m122.value; const span = __ring_m122.span;
      infer_helpers$check_assign_target_mutable(ctx, target);
      const target_r = infer_expr(ctx, target, subst, __ring_ev_fail);
      const value_r = infer_expr(ctx, value, target_r.subst, __ring_ev_fail);
      const assign_notes = [new diagnostics$DiagnosticNote(`target has type '${types$type_to_string(env$apply_subst(value_r.subst, hir$hexpr_type(target_r.hexpr)))}'`, Option_some(hir$hexpr_span(target_r.hexpr))), new diagnostics$DiagnosticNote(`assigned value has type '${types$type_to_string(env$apply_subst(value_r.subst, hir$hexpr_type(value_r.hexpr)))}'`, Option_some(hir$hexpr_span(value_r.hexpr)))];
      let s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, hir$hexpr_type(target_r.hexpr), hir$hexpr_type(value_r.hexpr), value_r.subst, span, assign_notes);
      const me = infer_ctx$merge_effects(ctx.env, target_r.effects, value_r.effects, s, __ring_ev_fail);
      s = me[1];
      let effects = me[0];
      __ring_match129: {
        const __ring_m129 = infer_helpers$get_assign_target_root_def_id(ctx, target);
        if (__ring_m129._tag === "some") {
          const did = __ring_m129._0;
          if (_Set_contains(ctx.env.scope.mutable_vars, did, __Int_Eq)) {
            __ring_match130: {
              const __ring_m130 = _Map_get(ctx.var_lambda_depth, did);
              if (__ring_m130._tag === "some") {
                const def_depth = __ring_m130._0;
                if ((ctx.lambda_depth > def_depth)) {
                  const var_type = env$apply_subst(s, infer_helpers$get_hexpr_root_type(target_r.hexpr));
                  const mut_eff = types$Effect_MutEffect(var_type);
                  const me2 = infer_ctx$merge_effects(ctx.env, effects, types$effect_row([mut_eff]), s, __ring_ev_fail);
                  effects = me2[0];
                  s = me2[1];
                }
                break __ring_match130;
              }
              if (__ring_m130._tag === "none") {
                break __ring_match130;
              }
              __match_fail(__ring_m130);
            }
          }
          break __ring_match129;
        }
        if (__ring_m129._tag === "none") {
          break __ring_match129;
        }
        __match_fail(__ring_m129);
      }
      return new infer_helpers$StmtResult(hir$HStmt_Assign(target_r.hexpr, value_r.hexpr, span), s, effects);
      break __ring_match122;
    }
    if (__ring_m122._tag === "ExprStmt") {
      const expr = __ring_m122.expr; const span = __ring_m122.span;
      const r = infer_expr(ctx, expr, subst, __ring_ev_fail);
      return new infer_helpers$StmtResult(hir$HStmt_ExprStmt(r.hexpr, span), r.subst, r.effects);
      break __ring_match122;
    }
    if (__ring_m122._tag === "Return") {
      const value = __ring_m122.value; const span = __ring_m122.span;
      __ring_match131: {
        const __ring_m131 = value;
        if (__ring_m131._tag === "some") {
          const v = __ring_m131._0;
          const r = infer_expr(ctx, v, subst, __ring_ev_fail);
          let s = r.subst;
          __ring_match132: {
            const __ring_m132 = ctx.current_fn_return_type;
            if (__ring_m132._tag === "some") {
              const ret_type = __ring_m132._0;
              const return_notes = [new diagnostics$DiagnosticNote(`function return type is '${types$type_to_string(env$apply_subst(s, ret_type))}'`, Option_none), new diagnostics$DiagnosticNote(`return value has type '${types$type_to_string(env$apply_subst(s, hir$hexpr_type(r.hexpr)))}'`, Option_some(hir$hexpr_span(r.hexpr)))];
              s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, hir$hexpr_type(r.hexpr), ret_type, s, span, return_notes);
              break __ring_match132;
            }
            if (__ring_m132._tag === "none") {
              break __ring_match132;
            }
            __match_fail(__ring_m132);
          }
          return new infer_helpers$StmtResult(hir$HStmt_Return(Option_some(r.hexpr), span), s, r.effects);
          break __ring_match131;
        }
        if (__ring_m131._tag === "none") {
          let s = subst;
          __ring_match133: {
            const __ring_m133 = ctx.current_fn_return_type;
            if (__ring_m133._tag === "some") {
              const ret_type = __ring_m133._0;
              s = infer_ctx$unify_at(ctx.sink, ctx.env, types$UNIT, ret_type, s, span);
              break __ring_match133;
            }
            if (__ring_m133._tag === "none") {
              break __ring_match133;
            }
            __match_fail(__ring_m133);
          }
          return new infer_helpers$StmtResult(hir$HStmt_Return(Option_none, span), s, types$EMPTY_ROW);
          break __ring_match131;
        }
        __match_fail(__ring_m131);
      }
      break __ring_match122;
    }
    if (__ring_m122._tag === "While") {
      const condition = __ring_m122.condition; const body = __ring_m122.body; const span = __ring_m122.span;
      const cond_r = infer_expr(ctx, condition, subst, __ring_ev_fail);
      let s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(cond_r.hexpr), types$BOOL, cond_r.subst, span);
      env$TypeEnv_push_scope(ctx.env);
      ctx.loop_depth = (ctx.loop_depth + 1);
      const body_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_block(ctx, body, Option_some(s), __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      ctx.loop_depth = (ctx.loop_depth - 1);
      env$TypeEnv_pop_scope(ctx.env);
      __ring_match134: {
        const __ring_m134 = body_result;
        if (__ring_m134._tag === "some") {
          const body_r = __ring_m134._0;
          s = body_r.subst;
          const me = infer_ctx$merge_effects(ctx.env, cond_r.effects, body_r.effects, s, __ring_ev_fail);
          return new infer_helpers$StmtResult(hir$HStmt_While(cond_r.hexpr, body_r.hexpr, span), me[1], me[0]);
          break __ring_match134;
        }
        if (__ring_m134._tag === "none") {
          return __ring_ev_fail.raise(new infer_ctx$CompileError());
          break __ring_match134;
        }
        __match_fail(__ring_m134);
      }
      break __ring_match122;
    }
    if (__ring_m122._tag === "ForIn") {
      const binding = __ring_m122.binding; const binding_span = __ring_m122.binding_span; const destructure = __ring_m122.destructure; const iterable = __ring_m122.iterable; const body = __ring_m122.body; const span = __ring_m122.span;
      const iter_r = infer_expr(ctx, iterable, subst, __ring_ev_fail);
      let s = iter_r.subst;
      const iter_type = env$apply_subst(s, hir$hexpr_type(iter_r.hexpr));
      const is_destructure = Option_is_some(destructure);
      let element_type = env$TypeEnv_fresh_var(ctx.env);
      let iterable_type_name = Option_none;
      let iter_type_name = Option_none;
      let __ring_blk30;
      __ring_match135: {
        const __ring_m135 = iter_type;
        if (__ring_m135._tag === "EnumType") {
          const name = __ring_m135.name;
          __ring_blk30 = (name === hir$BUILTIN_RANGE);
          break __ring_match135;
        }
        __ring_blk30 = false;
        break __ring_match135;
      }
      const is_range = __ring_blk30;
      if (is_range) {
        __ring_match136: {
          const __ring_m136 = iter_type;
          if (__ring_m136._tag === "EnumType") {
            const type_params = __ring_m136.type_params;
            let __ring_blk31;
            __ring_match137: {
              const __ring_m137 = List_first(type_params);
              if (__ring_m137._tag === "some") {
                const t = __ring_m137._0;
                __ring_blk31 = t;
                break __ring_match137;
              }
              if (__ring_m137._tag === "none") {
                __ring_blk31 = types$INT;
                break __ring_match137;
              }
              __match_fail(__ring_m137);
            }
            element_type = __ring_blk31;
            break __ring_match136;
          }
          break __ring_match136;
        }
      } else {
        const type_name = types$type_to_builtin_name(iter_type);
        __ring_match138: {
          const __ring_m138 = type_name;
          if (__ring_m138._tag === "some") {
            const tn = __ring_m138._0;
            const iterable_impl = env$find_impl(ctx.env.trait_reg, tn, "Iterable");
            __ring_match139: {
              const __ring_m139 = iterable_impl;
              if (__ring_m139._tag === "some") {
                const impl_entry = __ring_m139._0;
                iterable_type_name = Option_some(tn);
                __ring_match140: {
                  const __ring_m140 = _Map_get(impl_entry.assoc_types, "Iter");
                  if (__ring_m140._tag === "some") {
                    const iter_assoc_ty = __ring_m140._0;
                    let __ring_blk32;
                    __ring_match141: {
                      const __ring_m141 = iter_type;
                      if (__ring_m141._tag === "StructType") {
                        const tps = __ring_m141.type_params;
                        __ring_blk32 = tps;
                        break __ring_match141;
                      }
                      if (__ring_m141._tag === "EnumType") {
                        const tps = __ring_m141.type_params;
                        __ring_blk32 = tps;
                        break __ring_match141;
                      }
                      __ring_blk32 = [];
                      break __ring_match141;
                    }
                    const concrete_type_params = __ring_blk32;
                    const concrete_iter_name = types$type_to_builtin_name(iter_assoc_ty);
                    __ring_match142: {
                      const __ring_m142 = concrete_iter_name;
                      if (__ring_m142._tag === "some") {
                        const itn = __ring_m142._0;
                        iter_type_name = Option_some(itn);
                        const concrete_iter_type = types$Type_StructType(itn, concrete_type_params);
                        const iterator_impl = env$find_impl(ctx.env.trait_reg, itn, "Iterator");
                        __ring_match143: {
                          const __ring_m143 = iterator_impl;
                          if (__ring_m143._tag === "some") {
                            const iter_impl_entry = __ring_m143._0;
                            __ring_match144: {
                              const __ring_m144 = _Map_get(iter_impl_entry.assoc_types, "Item");
                              if (__ring_m144._tag === "some") {
                                const item_assoc_ty = __ring_m144._0;
                                const item_name = types$type_to_builtin_name(item_assoc_ty);
                                __ring_match145: {
                                  const __ring_m145 = item_assoc_ty;
                                  if (__ring_m145._tag === "TypeVar") {
                                    let __ring_blk33;
                                    __ring_match146: {
                                      const __ring_m146 = List_first(concrete_type_params);
                                      if (__ring_m146._tag === "some") {
                                        const ct = __ring_m146._0;
                                        __ring_blk33 = ct;
                                        break __ring_match146;
                                      }
                                      if (__ring_m146._tag === "none") {
                                        __ring_blk33 = element_type;
                                        break __ring_match146;
                                      }
                                      __match_fail(__ring_m146);
                                    }
                                    element_type = __ring_blk33;
                                    break __ring_match145;
                                  }
                                  if (__ring_m145._tag === "TupleType") {
                                    const elements = __ring_m145.elements;
                                    let concrete_elems = [];
                                    let ei = 0;
                                    const __ring_iter_28 = __List_Iterable.iter(elements);
                                    while (true) {
                                      const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
                                      if (__ring_next_28._tag === "none") break;
                                      const elem = __ring_next_28._0;
                                      __ring_match147: {
                                        const __ring_m147 = elem;
                                        if (__ring_m147._tag === "TypeVar") {
                                          __ring_match148: {
                                            const __ring_m148 = List_get(concrete_type_params, ei);
                                            if (__ring_m148._tag === "some") {
                                              const ct = __ring_m148._0;
                                              List_push(concrete_elems, ct);
                                              break __ring_match148;
                                            }
                                            if (__ring_m148._tag === "none") {
                                              List_push(concrete_elems, elem);
                                              break __ring_match148;
                                            }
                                            __match_fail(__ring_m148);
                                          }
                                          ei = (ei + 1);
                                          break __ring_match147;
                                        }
                                        List_push(concrete_elems, elem);
                                        break __ring_match147;
                                      }
                                    }
                                    element_type = types$Type_TupleType(concrete_elems);
                                    break __ring_match145;
                                  }
                                  element_type = item_assoc_ty;
                                  break __ring_match145;
                                }
                                break __ring_match144;
                              }
                              if (__ring_m144._tag === "none") {
                                const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Iterator impl for '${itn}' missing associated type 'Item'`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("Iterator impl must define type Item")));
                                break __ring_match144;
                              }
                              __match_fail(__ring_m144);
                            }
                            break __ring_match143;
                          }
                          if (__ring_m143._tag === "none") {
                            const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Type '${itn}' (Iter of '${tn}') does not implement Iterator`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("Iter associated type must implement Iterator")));
                            break __ring_match143;
                          }
                          __match_fail(__ring_m143);
                        }
                        break __ring_match142;
                      }
                      if (__ring_m142._tag === "none") {
                        const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Cannot resolve iterator type for '${tn}'`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("Iter associated type could not be resolved")));
                        break __ring_match142;
                      }
                      __match_fail(__ring_m142);
                    }
                    break __ring_match140;
                  }
                  if (__ring_m140._tag === "none") {
                    const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Iterable impl for '${tn}' missing associated type 'Iter'`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("Iterable impl must define type Iter")));
                    break __ring_match140;
                  }
                  __match_fail(__ring_m140);
                }
                break __ring_match139;
              }
              if (__ring_m139._tag === "none") {
                const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `for..in requires an iterable type (one that implements Iterable), got ${types$type_to_string(iter_type)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("Type does not implement the Iterable trait. Implement 'Iterable' for custom iteration.")));
                break __ring_match139;
              }
              __match_fail(__ring_m139);
            }
            break __ring_match138;
          }
          if (__ring_m138._tag === "none") {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `for..in requires an iterable type, got ${types$type_to_string(iter_type)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("Primitive types are not iterable")));
            break __ring_match138;
          }
          __match_fail(__ring_m138);
        }
      }
      env$TypeEnv_push_scope(ctx.env);
      let hdestructure = Option_none;
      __ring_match149: {
        const __ring_m149 = destructure;
        if (__ring_m149._tag === "some") {
          const destr = __ring_m149._0;
          __ring_match150: {
            const __ring_m150 = element_type;
            if (__ring_m150._tag === "TupleType") {
              const type_elems = __ring_m150.elements;
              if ((List_len(destr.names) !== List_len(type_elems))) {
                const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Destructure binding expects ${Int_to_str(List_len(destr.names))} elements, but iterable element type is ${types$type_to_string(element_type)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("tuple arity mismatch")));
              }
              break __ring_match150;
            }
            const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Destructure binding expects tuple elements, but iterable element type is ${types$type_to_string(element_type)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("tuple arity mismatch")));
            break __ring_match150;
          }
          let hd = [];
          let di = 0;
          while ((di < List_len(destr.names))) {
            __ring_match151: {
              const __ring_m151 = List_get(destr.names, di);
              if (__ring_m151._tag === "some") {
                const dname = __ring_m151._0;
                let __ring_blk34;
                __ring_match152: {
                  const __ring_m152 = element_type;
                  if (__ring_m152._tag === "TupleType") {
                    const type_elems = __ring_m152.elements;
                    let __ring_blk35;
                    __ring_match153: {
                      const __ring_m153 = List_get(type_elems, di);
                      if (__ring_m153._tag === "some") {
                        const et = __ring_m153._0;
                        __ring_blk35 = et;
                        break __ring_match153;
                      }
                      if (__ring_m153._tag === "none") {
                        __ring_blk35 = env$TypeEnv_fresh_var(ctx.env);
                        break __ring_match153;
                      }
                      __match_fail(__ring_m153);
                    }
                    __ring_blk34 = __ring_blk35;
                    break __ring_match152;
                  }
                  __ring_blk34 = env$TypeEnv_fresh_var(ctx.env);
                  break __ring_match152;
                }
                const elem_t = __ring_blk34;
                env$TypeEnv_bind_mono(ctx.env, dname, elem_t);
                const dscheme = env$TypeEnv_lookup(ctx.env, dname);
                __ring_match154: {
                  const __ring_m154 = dscheme;
                  if (__ring_m154._tag === "some") {
                    const ds = __ring_m154._0;
                    __ring_match155: {
                      const __ring_m155 = [ds.def_id, List_get(destr.spans, di)];
                      if (Array.isArray(__ring_m155) && __ring_m155.length === 2 && __ring_m155[0]._tag === "some" && __ring_m155[1]._tag === "some") {
                        const did = __ring_m155[0]._0; const dspan = __ring_m155[1]._0;
                        env$TypeEnv_record_def_span(ctx.env, did, dspan);
                        _Map_insert(ctx.var_lambda_depth, did, ctx.lambda_depth);
                        break __ring_match155;
                      }
                      break __ring_match155;
                    }
                    List_push(hd, new hir$HForInDestructure(dname, ds.def_id));
                    break __ring_match154;
                  }
                  if (__ring_m154._tag === "none") {
                    List_push(hd, new hir$HForInDestructure(dname, Option_none));
                    break __ring_match154;
                  }
                  __match_fail(__ring_m154);
                }
                break __ring_match151;
              }
              if (__ring_m151._tag === "none") {
                break __ring_match151;
              }
              __match_fail(__ring_m151);
            }
            di = (di + 1);
          }
          hdestructure = Option_some(hd);
          break __ring_match149;
        }
        if (__ring_m149._tag === "none") {
          env$TypeEnv_bind_mono(ctx.env, binding, element_type);
          break __ring_match149;
        }
        __match_fail(__ring_m149);
      }
      const binding_scheme = env$TypeEnv_lookup(ctx.env, binding);
      __ring_match156: {
        const __ring_m156 = binding_scheme;
        if (__ring_m156._tag === "some") {
          const bs = __ring_m156._0;
          __ring_match157: {
            const __ring_m157 = bs.def_id;
            if (__ring_m157._tag === "some") {
              const did = __ring_m157._0;
              env$TypeEnv_record_def_span(ctx.env, did, binding_span);
              _Map_insert(ctx.var_lambda_depth, did, ctx.lambda_depth);
              break __ring_match157;
            }
            if (__ring_m157._tag === "none") {
              break __ring_match157;
            }
            __match_fail(__ring_m157);
          }
          break __ring_match156;
        }
        if (__ring_m156._tag === "none") {
          break __ring_match156;
        }
        __match_fail(__ring_m156);
      }
      ctx.loop_depth = (ctx.loop_depth + 1);
      const body_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_block(ctx, body, Option_some(s), __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      ctx.loop_depth = (ctx.loop_depth - 1);
      env$TypeEnv_pop_scope(ctx.env);
      __ring_match158: {
        const __ring_m158 = body_result;
        if (__ring_m158._tag === "some") {
          const body_r = __ring_m158._0;
          s = body_r.subst;
          const me = infer_ctx$merge_effects(ctx.env, iter_r.effects, body_r.effects, s, __ring_ev_fail);
          let __ring_blk36;
          __ring_match159: {
            const __ring_m159 = binding_scheme;
            if (__ring_m159._tag === "some") {
              const bs = __ring_m159._0;
              __ring_blk36 = bs.def_id;
              break __ring_match159;
            }
            if (__ring_m159._tag === "none") {
              __ring_blk36 = Option_none;
              break __ring_match159;
            }
            __match_fail(__ring_m159);
          }
          return new infer_helpers$StmtResult(hir$HStmt_ForIn(binding, binding_span, __ring_blk36, hdestructure, iter_r.hexpr, body_r.hexpr, iterable_type_name, iter_type_name, span), me[1], me[0]);
          break __ring_match158;
        }
        if (__ring_m158._tag === "none") {
          return __ring_ev_fail.raise(new infer_ctx$CompileError());
          break __ring_match158;
        }
        __match_fail(__ring_m158);
      }
      break __ring_match122;
    }
    if (__ring_m122._tag === "Break") {
      const span = __ring_m122.span;
      if ((ctx.loop_depth === 0)) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0206, "'break' can only be used inside a loop", span, diagnostics$DiagnosticContext_OtherContext(Option_some("break outside loop")));
      }
      return new infer_helpers$StmtResult(hir$HStmt_Break(span), subst, types$EMPTY_ROW);
      break __ring_match122;
    }
    if (__ring_m122._tag === "Continue") {
      const span = __ring_m122.span;
      if ((ctx.loop_depth === 0)) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0206, "'continue' can only be used inside a loop", span, diagnostics$DiagnosticContext_OtherContext(Option_some("continue outside loop")));
      }
      return new infer_helpers$StmtResult(hir$HStmt_Continue(span), subst, types$EMPTY_ROW);
      break __ring_match122;
    }
    if (__ring_m122._tag === "LetDestructure") {
      const pattern = __ring_m122.pattern; const init = __ring_m122.init; const span = __ring_m122.span;
      const init_r = infer_expr(ctx, init, subst, __ring_ev_fail);
      let s = init_r.subst;
      const init_type = env$apply_subst(s, hir$hexpr_type(init_r.hexpr));
      __ring_match160: {
        const __ring_m160 = init_type;
        if (__ring_m160._tag === "TupleType") {
          break __ring_match160;
        }
        const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `let destructuring requires tuple type, got ${types$type_to_string(init_type)}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("not a tuple")));
        break __ring_match160;
      }
      let __ring_blk37;
      __ring_match161: {
        const __ring_m161 = init_type;
        if (__ring_m161._tag === "TupleType") {
          const elements = __ring_m161.elements;
          __ring_blk37 = elements;
          break __ring_match161;
        }
        __ring_blk37 = [];
        break __ring_match161;
      }
      const tuple_elements = __ring_blk37;
      __ring_match162: {
        const __ring_m162 = pattern;
        if (__ring_m162._tag === "TuplePattern") {
          const pat_elements = __ring_m162.elements;
          if ((List_len(pat_elements) !== List_len(tuple_elements))) {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0301, `Tuple has ${Int_to_str(List_len(tuple_elements))} elements but pattern has ${Int_to_str(List_len(pat_elements))}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("tuple arity mismatch")));
          }
          let bindings = [];
          let bi = 0;
          while ((bi < List_len(pat_elements))) {
            __ring_match163: {
              const __ring_m163 = List_get(pat_elements, bi);
              if (__ring_m163._tag === "some") {
                const p = __ring_m163._0;
                let __ring_blk38;
                __ring_match164: {
                  const __ring_m164 = List_get(tuple_elements, bi);
                  if (__ring_m164._tag === "some") {
                    const et = __ring_m164._0;
                    __ring_blk38 = et;
                    break __ring_match164;
                  }
                  if (__ring_m164._tag === "none") {
                    __ring_blk38 = types$UNIT;
                    break __ring_match164;
                  }
                  __match_fail(__ring_m164);
                }
                const elem_type = __ring_blk38;
                __ring_match165: {
                  const __ring_m165 = p;
                  if (__ring_m165._tag === "Binding") {
                    const name = __ring_m165.name; const pspan = __ring_m165.span;
                    env$TypeEnv_bind_mono(ctx.env, name, elem_type);
                    const bscheme = env$TypeEnv_lookup(ctx.env, name);
                    __ring_match166: {
                      const __ring_m166 = bscheme;
                      if (__ring_m166._tag === "some") {
                        const bs = __ring_m166._0;
                        __ring_match167: {
                          const __ring_m167 = bs.def_id;
                          if (__ring_m167._tag === "some") {
                            const did = __ring_m167._0;
                            env$TypeEnv_record_def_span(ctx.env, did, pspan);
                            _Set_insert(ctx.env.scope.let_defs, did);
                            break __ring_match167;
                          }
                          if (__ring_m167._tag === "none") {
                            break __ring_match167;
                          }
                          __match_fail(__ring_m167);
                        }
                        List_push(bindings, new hir$HLetDestructureBinding(name, bs.def_id, elem_type));
                        break __ring_match166;
                      }
                      if (__ring_m166._tag === "none") {
                        List_push(bindings, new hir$HLetDestructureBinding(name, Option_none, elem_type));
                        break __ring_match166;
                      }
                      __match_fail(__ring_m166);
                    }
                    break __ring_match165;
                  }
                  if (__ring_m165._tag === "Wildcard") {
                    List_push(bindings, new hir$HLetDestructureBinding("_", Option_none, elem_type));
                    break __ring_match165;
                  }
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0301, "Only binding and wildcard patterns are supported in let destructuring", span, diagnostics$DiagnosticContext_OtherContext(Option_some("unsupported pattern kind")));
                  break __ring_match165;
                }
                break __ring_match163;
              }
              if (__ring_m163._tag === "none") {
                break __ring_match163;
              }
              __match_fail(__ring_m163);
            }
            bi = (bi + 1);
          }
          return new infer_helpers$StmtResult(hir$HStmt_LetDestructure(pattern, bindings, init_r.hexpr, span), s, init_r.effects);
          break __ring_match162;
        }
        const _ = infer_ctx$type_error(ctx.sink, codes$E0301, "let destructuring requires tuple pattern", span, diagnostics$DiagnosticContext_OtherContext(Option_some("not a tuple pattern")));
        return new infer_helpers$StmtResult(hir$HStmt_ExprStmt(hir$HExpr_IntLit(0, types$UNIT, types$EMPTY_ROW, span), span), s, init_r.effects);
        break __ring_match162;
      }
      break __ring_match122;
    }
    if (__ring_m122._tag === "IfLet") {
      const pattern = __ring_m122.pattern; const expr = __ring_m122.expr; const then_block = __ring_m122.then_block; const else_block = __ring_m122.else_block; const span = __ring_m122.span;
      const expr_r = infer_expr(ctx, expr, subst, __ring_ev_fail);
      let s = expr_r.subst;
      const expr_type = env$apply_subst(s, hir$hexpr_type(expr_r.hexpr));
      env$TypeEnv_push_scope(ctx.env);
      const then_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some((function() {
  infer_ctx$bind_pattern(ctx, pattern, expr_type, s);
  return infer_block(ctx, then_block, Option_some(s), __ring_ev_fail);
})()); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      env$TypeEnv_pop_scope(ctx.env);
      __ring_match168: {
        const __ring_m168 = then_result;
        if (__ring_m168._tag === "some") {
          const then_r = __ring_m168._0;
          s = then_r.subst;
          let combined = infer_ctx$merge_effects(ctx.env, expr_r.effects, then_r.effects, s, __ring_ev_fail);
          let combined_effects = combined[0];
          s = combined[1];
          let else_hblock = Option_none;
          __ring_match169: {
            const __ring_m169 = else_block;
            if (__ring_m169._tag === "some") {
              const eb = __ring_m169._0;
              env$TypeEnv_push_scope(ctx.env);
              const else_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(infer_block(ctx, eb, Option_some(s), __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
              env$TypeEnv_pop_scope(ctx.env);
              __ring_match170: {
                const __ring_m170 = else_result;
                if (__ring_m170._tag === "some") {
                  const else_r = __ring_m170._0;
                  s = else_r.subst;
                  else_hblock = Option_some(else_r.hexpr);
                  const me2 = infer_ctx$merge_effects(ctx.env, combined_effects, else_r.effects, s, __ring_ev_fail);
                  combined_effects = me2[0];
                  s = me2[1];
                  break __ring_match170;
                }
                if (__ring_m170._tag === "none") {
                  __ring_ev_fail.raise(new infer_ctx$CompileError());
                  break __ring_match170;
                }
                __match_fail(__ring_m170);
              }
              break __ring_match169;
            }
            if (__ring_m169._tag === "none") {
              break __ring_match169;
            }
            __match_fail(__ring_m169);
          }
          return new infer_helpers$StmtResult(hir$HStmt_IfLet(pattern, expr_r.hexpr, then_r.hexpr, else_hblock, span), s, combined_effects);
          break __ring_match168;
        }
        if (__ring_m168._tag === "none") {
          return __ring_ev_fail.raise(new infer_ctx$CompileError());
          break __ring_match168;
        }
        __match_fail(__ring_m168);
      }
      break __ring_match122;
    }
    __match_fail(__ring_m122);
  }
}

function infer_block(ctx, body, initial_subst, __ring_ev_fail) {
  __ring_match171: {
    const __ring_m171 = body;
    if (__ring_m171._tag === "Block") {
      const stmts = __ring_m171.stmts; const tail = __ring_m171.tail; const span = __ring_m171.span;
      let __ring_blk39;
      __ring_match172: {
        const __ring_m172 = initial_subst;
        if (__ring_m172._tag === "some") {
          const s = __ring_m172._0;
          __ring_blk39 = s;
          break __ring_match172;
        }
        if (__ring_m172._tag === "none") {
          __ring_blk39 = ctx.subst;
          break __ring_match172;
        }
        __match_fail(__ring_m172);
      }
      let subst = __ring_blk39;
      let effects = types$EMPTY_ROW;
      let hstmts = [];
      const __ring_iter_29 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
        if (__ring_next_29._tag === "none") break;
        const stmt = __ring_next_29._0;
        const sr = infer_stmt(ctx, stmt, subst, __ring_ev_fail);
        subst = sr.subst;
        const me = infer_ctx$merge_effects(ctx.env, effects, sr.effects, subst, __ring_ev_fail);
        effects = me[0];
        subst = me[1];
        List_push(hstmts, sr.hstmt);
      }
      let tail_hexpr = Option_none;
      let block_type = types$UNIT;
      __ring_match173: {
        const __ring_m173 = tail;
        if (__ring_m173._tag === "some") {
          const t = __ring_m173._0;
          const tr = infer_expr(ctx, t, subst, __ring_ev_fail);
          subst = tr.subst;
          const me = infer_ctx$merge_effects(ctx.env, effects, tr.effects, subst, __ring_ev_fail);
          effects = me[0];
          subst = me[1];
          tail_hexpr = Option_some(tr.hexpr);
          block_type = hir$hexpr_type(tr.hexpr);
          break __ring_match173;
        }
        if (__ring_m173._tag === "none") {
          break __ring_match173;
        }
        __match_fail(__ring_m173);
      }
      const hblock = hir$HExpr_Block(hstmts, tail_hexpr, block_type, effects, span);
      return new infer_ctx$InferResult(hblock, subst, effects);
      break __ring_match171;
    }
    return panic("unreachable: infer_block called with non-block expression");
    break __ring_match171;
  }
}

function infer_expr(ctx, expr, subst, __ring_ev_fail) {
  __ring_match174: {
    const __ring_m174 = expr;
    if (__ring_m174._tag === "IntLit") {
      const value = __ring_m174.value; const span = __ring_m174.span;
      return new infer_ctx$InferResult(hir$HExpr_IntLit(value, types$INT, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match174;
    }
    if (__ring_m174._tag === "FloatLit") {
      const value = __ring_m174.value; const span = __ring_m174.span;
      return new infer_ctx$InferResult(hir$HExpr_FloatLit(value, types$FLOAT, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match174;
    }
    if (__ring_m174._tag === "StrLit") {
      const value = __ring_m174.value; const span = __ring_m174.span;
      return new infer_ctx$InferResult(hir$HExpr_StrLit(value, types$STR, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match174;
    }
    if (__ring_m174._tag === "BoolLit") {
      const value = __ring_m174.value; const span = __ring_m174.span;
      return new infer_ctx$InferResult(hir$HExpr_BoolLit(value, types$BOOL, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match174;
    }
    if (__ring_m174._tag === "Ident") {
      const name = __ring_m174.name; const qualifier = __ring_m174.qualifier; const span = __ring_m174.span;
      return infer_helpers$infer_ident(ctx, name, span, subst, qualifier);
      break __ring_match174;
    }
    if (__ring_m174._tag === "BinOp") {
      const op = __ring_m174.op; const left = __ring_m174.left; const right = __ring_m174.right; const span = __ring_m174.span;
      return infer_bin_op(ctx, op, left, right, span, subst, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "UnaryOp") {
      const op = __ring_m174.op; const operand = __ring_m174.operand; const span = __ring_m174.span;
      return infer_unary_op(ctx, op, operand, span, subst);
      break __ring_match174;
    }
    if (__ring_m174._tag === "Call") {
      const callee = __ring_m174.callee; const args = __ring_m174.args; const span = __ring_m174.span;
      return infer_call(ctx, callee, args, span, subst, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "MethodCall") {
      const receiver = __ring_m174.receiver; const method = __ring_m174.method; const args = __ring_m174.args; const span = __ring_m174.span;
      return infer_method_call(ctx, receiver, method, args, span, subst, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "FieldAccess") {
      const receiver = __ring_m174.receiver; const field = __ring_m174.field; const span = __ring_m174.span;
      return infer_field_access(ctx, receiver, field, span, subst);
      break __ring_match174;
    }
    if (__ring_m174._tag === "StructLit") {
      const name = __ring_m174.name; const qualifier = __ring_m174.qualifier; const fields = __ring_m174.fields; const spread = __ring_m174.spread; const span = __ring_m174.span;
      return infer_struct_lit(ctx, name, fields, spread, span, subst, qualifier, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "MatchExpr") {
      const scrutinee = __ring_m174.scrutinee; const arms = __ring_m174.arms; const span = __ring_m174.span;
      return infer_match(ctx, scrutinee, arms, span, subst, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "Block") {
      return infer_block(ctx, expr, Option_some(subst), __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "IfExpr") {
      const condition = __ring_m174.condition; const then_branch = __ring_m174.then_branch; const else_branch = __ring_m174.else_branch; const span = __ring_m174.span;
      return infer_if(ctx, condition, then_branch, else_branch, span, subst, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "StringInterp") {
      const parts = __ring_m174.parts; const span = __ring_m174.span;
      return infer_string_interp(ctx, parts, span, subst, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "CatchExpr") {
      const catch_expr = __ring_m174.expr; const arms = __ring_m174.arms; const span = __ring_m174.span;
      return infer_catch(ctx, catch_expr, arms, span, subst, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "HandleExpr") {
      const body = __ring_m174.body; const handlers = __ring_m174.handlers; const span = __ring_m174.span;
      return infer_handle(ctx, body, handlers, span, subst, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "Lambda") {
      const params = __ring_m174.params; const body = __ring_m174.body; const span = __ring_m174.span;
      return infer_lambda(ctx, params, body, span, subst, Option_none, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "ListLit") {
      const elements = __ring_m174.elements; const span = __ring_m174.span;
      return infer_list_literal(ctx, elements, span, subst, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "TupleLit") {
      const elements = __ring_m174.elements; const span = __ring_m174.span;
      let s = subst;
      let helements = [];
      let combined_effects = types$EMPTY_ROW;
      const __ring_iter_30 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_30 = __ListIterator_Iterator.next(__ring_iter_30);
        if (__ring_next_30._tag === "none") break;
        const el = __ring_next_30._0;
        const r = infer_expr(ctx, el, s, __ring_ev_fail);
        s = r.subst;
        List_push(helements, r.hexpr);
        const me = infer_ctx$merge_effects(ctx.env, combined_effects, r.effects, s, __ring_ev_fail);
        combined_effects = me[0];
        s = me[1];
      }
      let elem_types = [];
      const __ring_iter_31 = __List_Iterable.iter(helements);
      while (true) {
        const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
        if (__ring_next_31._tag === "none") break;
        const he = __ring_next_31._0;
        List_push(elem_types, env$apply_subst(s, hir$hexpr_type(he)));
      }
      const tuple_type = types$Type_TupleType(elem_types);
      return new infer_ctx$InferResult(hir$HExpr_TupleLit(helements, tuple_type, combined_effects, span), s, combined_effects);
      break __ring_match174;
    }
    if (__ring_m174._tag === "Range") {
      const start = __ring_m174.start; const end = __ring_m174.end; const inclusive = __ring_m174.inclusive; const span = __ring_m174.span;
      const start_r = infer_expr(ctx, start, subst, __ring_ev_fail);
      let s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(start_r.hexpr), types$INT, start_r.subst, span);
      const end_r = infer_expr(ctx, end, s, __ring_ev_fail);
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(end_r.hexpr), types$INT, end_r.subst, span);
      const me = infer_ctx$merge_effects(ctx.env, start_r.effects, end_r.effects, s, __ring_ev_fail);
      let range_effects = me[0];
      s = me[1];
      const range_type = types$Type_EnumType(hir$BUILTIN_RANGE, [types$INT]);
      return new infer_ctx$InferResult(hir$HExpr_RangeExpr(start_r.hexpr, end_r.hexpr, inclusive, range_type, range_effects, span), s, range_effects);
      break __ring_match174;
    }
    if (__ring_m174._tag === "IndexExpr") {
      const receiver = __ring_m174.receiver; const index = __ring_m174.index; const span = __ring_m174.span;
      return infer_index_expr(ctx, receiver, index, span, subst, __ring_ev_fail);
      break __ring_match174;
    }
    if (__ring_m174._tag === "ReturnExpr") {
      const value = __ring_m174.value; const span = __ring_m174.span;
      __ring_match175: {
        const __ring_m175 = value;
        if (__ring_m175._tag === "some") {
          const v = __ring_m175._0;
          const r = infer_expr(ctx, v, subst, __ring_ev_fail);
          let s = r.subst;
          __ring_match176: {
            const __ring_m176 = ctx.current_fn_return_type;
            if (__ring_m176._tag === "some") {
              const ret_type = __ring_m176._0;
              const return_notes = [new diagnostics$DiagnosticNote(`function return type is '${types$type_to_string(env$apply_subst(s, ret_type))}'`, Option_none), new diagnostics$DiagnosticNote(`return value has type '${types$type_to_string(env$apply_subst(s, hir$hexpr_type(r.hexpr)))}'`, Option_some(hir$hexpr_span(r.hexpr)))];
              s = infer_ctx$unify_at_noted(ctx.sink, ctx.env, hir$hexpr_type(r.hexpr), ret_type, s, span, return_notes);
              break __ring_match176;
            }
            if (__ring_m176._tag === "none") {
              break __ring_match176;
            }
            __match_fail(__ring_m176);
          }
          return new infer_ctx$InferResult(hir$HExpr_ReturnExpr(Option_some(r.hexpr), types$NEVER, r.effects, span), s, r.effects);
          break __ring_match175;
        }
        if (__ring_m175._tag === "none") {
          let s = subst;
          __ring_match177: {
            const __ring_m177 = ctx.current_fn_return_type;
            if (__ring_m177._tag === "some") {
              const ret_type = __ring_m177._0;
              s = infer_ctx$unify_at(ctx.sink, ctx.env, types$UNIT, ret_type, s, span);
              break __ring_match177;
            }
            if (__ring_m177._tag === "none") {
              break __ring_match177;
            }
            __match_fail(__ring_m177);
          }
          return new infer_ctx$InferResult(hir$HExpr_ReturnExpr(Option_none, types$NEVER, types$EMPTY_ROW, span), s, types$EMPTY_ROW);
          break __ring_match175;
        }
        __match_fail(__ring_m175);
      }
      break __ring_match174;
    }
    __match_fail(__ring_m174);
  }
}

function infer_bin_op(ctx, op, left, right, span, subst, __ring_ev_fail) {
  const lr = infer_expr(ctx, left, subst, __ring_ev_fail);
  const rr = infer_expr(ctx, right, lr.subst, __ring_ev_fail);
  let s = rr.subst;
  let result_type = types$UNIT;
  let eq_dispatch = Option_none;
  let ord_dispatch = Option_none;
  __ring_match178: {
    const __ring_m178 = op;
    if (__ring_m178._tag === "Add") {
      result_type = infer_helpers$infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "+");
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      break __ring_match178;
    }
    if (__ring_m178._tag === "Sub") {
      result_type = infer_helpers$infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "-");
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      break __ring_match178;
    }
    if (__ring_m178._tag === "Mul") {
      result_type = infer_helpers$infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "*");
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      break __ring_match178;
    }
    if (__ring_m178._tag === "Div") {
      result_type = infer_helpers$infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "/");
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      break __ring_match178;
    }
    if (__ring_m178._tag === "Mod") {
      result_type = infer_helpers$infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "%");
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      break __ring_match178;
    }
    if ((__ring_m178._tag === "Eq") || (__ring_m178._tag === "Neq")) {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      result_type = types$BOOL;
      const resolved = env$apply_subst(s, hir$hexpr_type(lr.hexpr));
      const is_builtin = (infer_helpers$is_primitive_eq(resolved) ? true : infer_helpers$is_tuple_type(resolved));
      let __ring_blk40;
      __ring_match179: {
        const __ring_m179 = op;
        if (__ring_m179._tag === "Eq") {
          __ring_blk40 = "==";
          break __ring_match179;
        }
        __ring_blk40 = "!=";
        break __ring_match179;
      }
      const op_sym = __ring_blk40;
      eq_dispatch = Option_some(infer_helpers$resolve_trait_dispatch(ctx, resolved, "Eq", codes$E0307, s, span, op_sym, is_builtin));
      break __ring_match178;
    }
    if ((__ring_m178._tag === "Lt") || (__ring_m178._tag === "Lte") || (__ring_m178._tag === "Gt") || (__ring_m178._tag === "Gte")) {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), hir$hexpr_type(rr.hexpr), s, span);
      result_type = types$BOOL;
      const resolved = env$apply_subst(s, hir$hexpr_type(lr.hexpr));
      let __ring_blk41;
      __ring_match180: {
        const __ring_m180 = op;
        if (__ring_m180._tag === "Lt") {
          __ring_blk41 = "<";
          break __ring_match180;
        }
        if (__ring_m180._tag === "Lte") {
          __ring_blk41 = "<=";
          break __ring_match180;
        }
        if (__ring_m180._tag === "Gt") {
          __ring_blk41 = ">";
          break __ring_match180;
        }
        __ring_blk41 = ">=";
        break __ring_match180;
      }
      const op_sym = __ring_blk41;
      ord_dispatch = Option_some(infer_helpers$resolve_trait_dispatch(ctx, resolved, "Ord", codes$E0308, s, span, op_sym, infer_helpers$is_primitive_ord(resolved)));
      break __ring_match178;
    }
    if (__ring_m178._tag === "And") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), types$BOOL, s, span);
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(rr.hexpr), types$BOOL, s, span);
      result_type = types$BOOL;
      break __ring_match178;
    }
    if (__ring_m178._tag === "Or") {
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(lr.hexpr), types$BOOL, s, span);
      s = infer_ctx$unify_at(ctx.sink, ctx.env, hir$hexpr_type(rr.hexpr), types$BOOL, s, span);
      result_type = types$BOOL;
      break __ring_match178;
    }
    __match_fail(__ring_m178);
  }
  const me = infer_ctx$merge_effects(ctx.env, lr.effects, rr.effects, s, __ring_ev_fail);
  let effects = me[0];
  s = me[1];
  return new infer_ctx$InferResult(hir$HExpr_BinOp(op, lr.hexpr, rr.hexpr, eq_dispatch, ord_dispatch, result_type, effects, span), s, effects);
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


export { infer_block, infer_stmt, infer_expr };