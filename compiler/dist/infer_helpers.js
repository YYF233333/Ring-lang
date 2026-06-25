import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_FloatIdentity as hir$FieldAction_FloatIdentity, FieldAction_BoolIdentity as hir$FieldAction_BoolIdentity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { make_diag as diagnostics$make_diag, make_diagnostic as diagnostics$make_diagnostic, new_collecting_sink as diagnostics$new_collecting_sink, severity_to_str as diagnostics$severity_to_str, CollectingSink as diagnostics$CollectingSink, Diagnostic as diagnostics$Diagnostic, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, DiagnosticNote as diagnostics$DiagnosticNote, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, Suggestion as diagnostics$Suggestion, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Severity_Eq as diagnostics$__Severity_Eq, __Severity_Clone as diagnostics$__Severity_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __Severity_Debug as diagnostics$__Severity_Debug, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Suggestion_Debug as diagnostics$__Suggestion_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0105 as codes$E0105, E0106 as codes$E0106, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0405 as codes$E0405, E0406 as codes$E0406, E0407 as codes$E0407, E0408 as codes$E0408, E0409 as codes$E0409, E0410 as codes$E0410, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0504 as codes$E0504, E0505 as codes$E0505, E0506 as codes$E0506, E0507 as codes$E0507, E0508 as codes$E0508, E0509 as codes$E0509, E0510 as codes$E0510, E0511 as codes$E0511, E0512 as codes$E0512, E0513 as codes$E0513, E0514 as codes$E0514, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, E0707 as codes$E0707, W0001 as codes$W0001, W0002 as codes$W0002, error_category as codes$error_category, error_description as codes$error_description } from "./codes.js";
import { new_union_find as union_find$new_union_find, uf_bind as union_find$uf_bind, uf_find as union_find$uf_find, uf_insert as union_find$uf_insert, uf_lookup as union_find$uf_lookup, uf_union as union_find$uf_union, UnionFind as union_find$UnionFind } from "./union_find.js";
import { add_impl as env$add_impl, apply_subst as env$apply_subst, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_map as env$apply_subst_map, apply_subst_row as env$apply_subst_row, apply_subst_row_map as env$apply_subst_row_map, find_impl as env$find_impl, has_impl as env$has_impl, lookup_variant as env$lookup_variant, mono as env$mono, new_type_env as env$new_type_env, AssocConstraintEntry as env$AssocConstraintEntry, AssocTypeDef as env$AssocTypeDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectAliasDef as env$EffectAliasDef, EffectDef as env$EffectDef, EffectOpDef as env$EffectOpDef, EnumDef as env$EnumDef, FnBound as env$FnBound, IdGen as env$IdGen, ImplEntry as env$ImplEntry, SchemeBound as env$SchemeBound, Scope as env$Scope, ScopeManager as env$ScopeManager, SigDef as env$SigDef, StructDef as env$StructDef, TraitDef as env$TraitDef, TraitMethodDef as env$TraitMethodDef, TraitRegistry as env$TraitRegistry, TypeAliasDef as env$TypeAliasDef, TypeEnv as env$TypeEnv, TypeRegistry as env$TypeRegistry, TypeScheme as env$TypeScheme, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __BuiltInKind_Debug as env$__BuiltInKind_Debug, __FnBound_Eq as env$__FnBound_Eq, __FnBound_Clone as env$__FnBound_Clone, __FnBound_Ord as env$__FnBound_Ord, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Eq as env$__IdGen_Eq, __IdGen_Clone as env$__IdGen_Clone, __IdGen_Ord as env$__IdGen_Ord, __IdGen_Debug as env$__IdGen_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { bind_pattern as infer_ctx$bind_pattern, build_scheme_var_map as infer_ctx$build_scheme_var_map, collect_free_vars as infer_ctx$collect_free_vars, free_type_vars as infer_ctx$free_type_vars, free_type_vars_in_env as infer_ctx$free_type_vars_in_env, generalize as infer_ctx$generalize, merge_effects as infer_ctx$merge_effects, new_infer_ctx as infer_ctx$new_infer_ctx, remove_fail_effect as infer_ctx$remove_fail_effect, resolve_dicts_from_scheme as infer_ctx$resolve_dicts_from_scheme, resolve_effect_expr as infer_ctx$resolve_effect_expr, resolve_named_type as infer_ctx$resolve_named_type, resolve_relative_qualifier as infer_ctx$resolve_relative_qualifier, resolve_self_type as infer_ctx$resolve_self_type, resolve_type_expr as infer_ctx$resolve_type_expr, type_error as infer_ctx$type_error, type_error_with_notes as infer_ctx$type_error_with_notes, unify_at as infer_ctx$unify_at, unify_at_noted as infer_ctx$unify_at_noted, update_fn_effects as infer_ctx$update_fn_effects, CompileError as infer_ctx$CompileError, FnBoundsEntry as infer_ctx$FnBoundsEntry, InferCtx as infer_ctx$InferCtx, InferResult as infer_ctx$InferResult, __CompileError_Eq as infer_ctx$__CompileError_Eq, __CompileError_Clone as infer_ctx$__CompileError_Clone, __CompileError_Ord as infer_ctx$__CompileError_Ord, __CompileError_Debug as infer_ctx$__CompileError_Debug, __FnBoundsEntry_Eq as infer_ctx$__FnBoundsEntry_Eq, __FnBoundsEntry_Clone as infer_ctx$__FnBoundsEntry_Clone, __FnBoundsEntry_Ord as infer_ctx$__FnBoundsEntry_Ord, __FnBoundsEntry_Debug as infer_ctx$__FnBoundsEntry_Debug } from "./infer_ctx.js";



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

class MethodLookupResult {
  constructor(method_type, method_scheme) {
    this.method_type = method_type;
    this.method_scheme = method_scheme;
  }
}

class StmtResult {
  constructor(hstmt, subst, effects) {
    this.hstmt = hstmt;
    this.subst = subst;
    this.effects = effects;
  }
}

function cancel_local_mut_effects(ctx, effects, callee_params, callee_effects, hargs, param_offset, s) {
  let cancel_types = [];
  const __ring_iter_2 = __List_Iterable.iter(callee_effects.effects);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const eff = __ring_next_2._0;
    __ring_match6: {
      const __ring_m6 = eff;
      if (__ring_m6._tag === "MutEffect") {
        const state_type = __ring_m6.state_type;
        const resolved_st = env$apply_subst(s, state_type);
        let pi = param_offset;
        let ai = 0;
        while ((ai < List_len(hargs))) {
          __ring_match7: {
            const __ring_m7 = List_get(callee_params, pi);
            if (__ring_m7._tag === "some") {
              const pt = __ring_m7._0;
              const resolved_pt = env$apply_subst(s, pt);
              if (types$types_equal(resolved_pt, resolved_st)) {
                __ring_match8: {
                  const __ring_m8 = List_get(hargs, ai);
                  if (__ring_m8._tag === "some") {
                    const harg = __ring_m8._0;
                    __ring_match9: {
                      const __ring_m9 = harg;
                      if (__ring_m9._tag === "Ident" && __ring_m9.def_id._tag === "some") {
                        const did = __ring_m9.def_id._0;
                        if ((!_Set_contains(ctx.env.scope.mut_param_defs, did, __Int_Eq))) {
                          List_push(cancel_types, resolved_st);
                        }
                        break __ring_match9;
                      }
                      break __ring_match9;
                    }
                    break __ring_match8;
                  }
                  if (__ring_m8._tag === "none") {
                    break __ring_match8;
                  }
                  __match_fail(__ring_m8);
                }
              }
              break __ring_match7;
            }
            if (__ring_m7._tag === "none") {
              break __ring_match7;
            }
            __match_fail(__ring_m7);
          }
          pi = (pi + 1);
          ai = (ai + 1);
        }
        break __ring_match6;
      }
      break __ring_match6;
    }
  }
  if ((List_len(cancel_types) === 0)) {
    return effects;
  }
  let filtered = [];
  const __ring_iter_3 = __List_Iterable.iter(effects.effects);
  while (true) {
    const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
    if (__ring_next_3._tag === "none") break;
    const e = __ring_next_3._0;
    let keep = true;
    __ring_match10: {
      const __ring_m10 = e;
      if (__ring_m10._tag === "MutEffect") {
        const state_type = __ring_m10.state_type;
        const resolved_st = env$apply_subst(s, state_type);
        const __ring_iter_4 = __List_Iterable.iter(cancel_types);
        while (true) {
          const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
          if (__ring_next_4._tag === "none") break;
          const ct = __ring_next_4._0;
          if (types$types_equal(ct, resolved_st)) {
            keep = false;
          }
        }
        break __ring_match10;
      }
      break __ring_match10;
    }
    if (keep) {
      List_push(filtered, e);
    }
  }
  return new types$EffectRow(filtered, effects.tail);
}

function find_root_expr(e) {
  __ring_match11: {
    const __ring_m11 = e;
    if (__ring_m11._tag === "FieldAccess") {
      const receiver = __ring_m11.receiver;
      return find_root_expr(receiver);
      break __ring_match11;
    }
    if (__ring_m11._tag === "IndexExpr") {
      const receiver = __ring_m11.receiver;
      return find_root_expr(receiver);
      break __ring_match11;
    }
    return e;
    break __ring_match11;
  }
}

function check_assign_target_mutable(ctx, target) {
  __ring_match12: {
    const __ring_m12 = target;
    if (__ring_m12._tag === "Ident") {
      const name = __ring_m12.name; const span = __ring_m12.span;
      const scheme = env$TypeEnv_lookup(ctx.env, name);
      __ring_match13: {
        const __ring_m13 = scheme;
        if (__ring_m13._tag === "some") {
          const s = __ring_m13._0;
          __ring_match14: {
            const __ring_m14 = s.def_id;
            if (__ring_m14._tag === "some") {
              const did = __ring_m14._0;
              if ((!_Set_contains(ctx.env.scope.mutable_vars, did, __Int_Eq))) {
                const _ = infer_ctx$type_error(ctx.sink, codes$E0205, `Cannot assign to immutable variable '${name}' (declared with 'let'). Use 'let mut' for mutable bindings.`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`'${name}' is declared with 'let'`)));
              }
              break __ring_match14;
            }
            if (__ring_m14._tag === "none") {
              break __ring_match14;
            }
            __match_fail(__ring_m14);
          }
          break __ring_match13;
        }
        if (__ring_m13._tag === "none") {
          break __ring_match13;
        }
        __match_fail(__ring_m13);
      }
      break __ring_match12;
    }
    if (__ring_m12._tag === "FieldAccess") {
      const receiver = __ring_m12.receiver; const span = __ring_m12.span;
      const root = find_root_expr(receiver);
      __ring_match15: {
        const __ring_m15 = root;
        if (__ring_m15._tag === "Ident") {
          const name = __ring_m15.name; const rspan = __ring_m15.span;
          const scheme = env$TypeEnv_lookup(ctx.env, name);
          __ring_match16: {
            const __ring_m16 = scheme;
            if (__ring_m16._tag === "some") {
              const s = __ring_m16._0;
              __ring_match17: {
                const __ring_m17 = s.def_id;
                if (__ring_m17._tag === "some") {
                  const did = __ring_m17._0;
                  if ((!_Set_contains(ctx.env.scope.mutable_vars, did, __Int_Eq))) {
                    const _ = infer_ctx$type_error(ctx.sink, codes$E0205, `Cannot assign to field of immutable variable '${name}'. Use 'let mut' for mutable bindings.`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`'${name}' is not mutable`)));
                  }
                  break __ring_match17;
                }
                if (__ring_m17._tag === "none") {
                  break __ring_match17;
                }
                __match_fail(__ring_m17);
              }
              break __ring_match16;
            }
            if (__ring_m16._tag === "none") {
              break __ring_match16;
            }
            __match_fail(__ring_m16);
          }
          break __ring_match15;
        }
        const _ = infer_ctx$type_error(ctx.sink, codes$E0205, "Cannot assign to field of a temporary value. Store the value in a 'let mut' variable first.", span, diagnostics$DiagnosticContext_OtherContext(Option_some("assignment to temporary value")));
        break __ring_match15;
      }
      break __ring_match12;
    }
    if (__ring_m12._tag === "IndexExpr") {
      const receiver = __ring_m12.receiver; const span = __ring_m12.span;
      const root = find_root_expr(receiver);
      __ring_match18: {
        const __ring_m18 = root;
        if (__ring_m18._tag === "Ident") {
          const name = __ring_m18.name; const rspan = __ring_m18.span;
          const scheme = env$TypeEnv_lookup(ctx.env, name);
          __ring_match19: {
            const __ring_m19 = scheme;
            if (__ring_m19._tag === "some") {
              const s = __ring_m19._0;
              __ring_match20: {
                const __ring_m20 = s.def_id;
                if (__ring_m20._tag === "some") {
                  const did = __ring_m20._0;
                  if ((!_Set_contains(ctx.env.scope.mutable_vars, did, __Int_Eq))) {
                    const _ = infer_ctx$type_error(ctx.sink, codes$E0205, `Cannot assign to index of immutable variable '${name}'. Use 'let mut' for mutable bindings.`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`'${name}' is not mutable`)));
                  }
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
          break __ring_match18;
        }
        const _ = infer_ctx$type_error(ctx.sink, codes$E0205, "Cannot assign to index of a temporary value. Store the value in a 'let mut' variable first.", span, diagnostics$DiagnosticContext_OtherContext(Option_some("assignment to temporary value")));
        break __ring_match18;
      }
      break __ring_match12;
    }
    break __ring_match12;
  }
}

function check_expr_is_let_def(ctx, expr) {
  __ring_match21: {
    const __ring_m21 = expr;
    if (__ring_m21._tag === "Ident") {
      const name = __ring_m21.name;
      __ring_match22: {
        const __ring_m22 = env$TypeEnv_lookup(ctx.env, name);
        if (__ring_m22._tag === "some") {
          const s = __ring_m22._0;
          __ring_match23: {
            const __ring_m23 = s.def_id;
            if (__ring_m23._tag === "some") {
              const did = __ring_m23._0;
              return _Set_contains(ctx.env.scope.let_defs, did, __Int_Eq);
              break __ring_match23;
            }
            if (__ring_m23._tag === "none") {
              return false;
              break __ring_match23;
            }
            __match_fail(__ring_m23);
          }
          break __ring_match22;
        }
        if (__ring_m22._tag === "none") {
          return false;
          break __ring_match22;
        }
        __match_fail(__ring_m22);
      }
      break __ring_match21;
    }
    if (__ring_m21._tag === "FieldAccess") {
      const inner = __ring_m21.receiver;
      return check_expr_is_let_def(ctx, inner);
      break __ring_match21;
    }
    return false;
    break __ring_match21;
  }
}

function check_receiver_mutability(ctx, receiver, recv_type, method, span) {
  let type_name = Option_none;
  __ring_match24: {
    const __ring_m24 = recv_type;
    if (__ring_m24._tag === "StructType") {
      const name = __ring_m24.name;
      type_name = Option_some(name);
      break __ring_match24;
    }
    if (__ring_m24._tag === "EnumType") {
      const name = __ring_m24.name;
      type_name = Option_some(name);
      break __ring_match24;
    }
    __ring_match25: {
      const __ring_m25 = types$type_to_builtin_name(recv_type);
      if (__ring_m25._tag === "some") {
        const n = __ring_m25._0;
        type_name = Option_some(n);
        break __ring_match25;
      }
      if (__ring_m25._tag === "none") {
        break __ring_match25;
      }
      __match_fail(__ring_m25);
    }
    break __ring_match24;
  }
  __ring_match26: {
    const __ring_m26 = type_name;
    if (__ring_m26._tag === "some") {
      const tname = __ring_m26._0;
      __ring_match27: {
        const __ring_m27 = _Map_get(ctx.env.trait_reg.mut_methods, tname);
        if (__ring_m27._tag === "some") {
          const mut_set = __ring_m27._0;
          if (_Set_contains(mut_set, method, __Str_Eq)) {
            const is_let_def = check_expr_is_let_def(ctx, receiver);
            if (is_let_def) {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0208, `Cannot call mutating method '${method}' on immutable binding. Use 'let mut' to make it mutable.`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`'${method}' requires a mutable receiver`)));
            }
          }
          break __ring_match27;
        }
        if (__ring_m27._tag === "none") {
          break __ring_match27;
        }
        __match_fail(__ring_m27);
      }
      break __ring_match26;
    }
    if (__ring_m26._tag === "none") {
      break __ring_match26;
    }
    __match_fail(__ring_m26);
  }
}

function get_assign_target_root_def_id(ctx, target) {
  const root = find_root_expr(target);
  __ring_match28: {
    const __ring_m28 = root;
    if (__ring_m28._tag === "Ident") {
      const name = __ring_m28.name;
      __ring_match29: {
        const __ring_m29 = env$TypeEnv_lookup(ctx.env, name);
        if (__ring_m29._tag === "some") {
          const s = __ring_m29._0;
          return s.def_id;
          break __ring_match29;
        }
        if (__ring_m29._tag === "none") {
          return Option_none;
          break __ring_match29;
        }
        __match_fail(__ring_m29);
      }
      break __ring_match28;
    }
    return Option_none;
    break __ring_match28;
  }
}

function get_expr_def_id(ctx, expr) {
  __ring_match30: {
    const __ring_m30 = expr;
    if (__ring_m30._tag === "Ident") {
      const name = __ring_m30.name;
      __ring_match31: {
        const __ring_m31 = env$TypeEnv_lookup(ctx.env, name);
        if (__ring_m31._tag === "some") {
          const s = __ring_m31._0;
          return s.def_id;
          break __ring_match31;
        }
        if (__ring_m31._tag === "none") {
          return Option_none;
          break __ring_match31;
        }
        __match_fail(__ring_m31);
      }
      break __ring_match30;
    }
    return Option_none;
    break __ring_match30;
  }
}

function get_hexpr_root_type(target) {
  __ring_match32: {
    const __ring_m32 = target;
    if (__ring_m32._tag === "FieldAccess") {
      const receiver = __ring_m32.receiver;
      return get_hexpr_root_type(receiver);
      break __ring_match32;
    }
    if (__ring_m32._tag === "IndexExpr") {
      const receiver = __ring_m32.receiver;
      return get_hexpr_root_type(receiver);
      break __ring_match32;
    }
    return hir$hexpr_type(target);
    break __ring_match32;
  }
}

function infer_ident(ctx, name, span, subst, qualifier) {
  let resolved_qualifier = qualifier;
  __ring_match33: {
    const __ring_m33 = qualifier;
    if (__ring_m33._tag === "some") {
      const q = __ring_m33._0;
      if (((q === "self") ? true : Str_starts_with(q, "super"))) {
        __ring_match34: {
          const __ring_m34 = infer_ctx$resolve_relative_qualifier(q, ctx.mod_path_stack);
          if (__ring_m34._tag === "some") {
            const prefix = __ring_m34._0;
            if ((prefix === "")) {
              resolved_qualifier = Option_none;
            } else {
              resolved_qualifier = Option_some(prefix);
            }
            break __ring_match34;
          }
          if (__ring_m34._tag === "none") {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0705, `Cannot use '${q}' — relative path exceeds module nesting depth`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("relative path out of scope")));
            return new infer_ctx$InferResult(hir$HExpr_Ident(name, Option_none, Option_none, Option_none, types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
            break __ring_match34;
          }
          __match_fail(__ring_m34);
        }
      }
      break __ring_match33;
    }
    if (__ring_m33._tag === "none") {
      break __ring_match33;
    }
    __match_fail(__ring_m33);
  }
  __ring_match35: {
    const __ring_m35 = resolved_qualifier;
    if (__ring_m35._tag === "some") {
      const q = __ring_m35._0;
      const qualified_name = `${q}::${name}`;
      const mod_scheme = env$TypeEnv_lookup(ctx.env, qualified_name);
      __ring_match36: {
        const __ring_m36 = mod_scheme;
        if (__ring_m36._tag === "some") {
          const ms = __ring_m36._0;
          const t = env$TypeEnv_instantiate(ctx.env, ms);
          return new infer_ctx$InferResult(hir$HExpr_Ident(qualified_name, Option_none, ms.def_id, Option_none, t, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
          break __ring_match36;
        }
        if (__ring_m36._tag === "none") {
          if ((List_len(ctx.mod_path_stack) > 0)) {
            const mod_prefix = List_join(ctx.mod_path_stack, "::");
            const full_qualified = `${mod_prefix}::${qualified_name}`;
            const full_scheme = env$TypeEnv_lookup(ctx.env, full_qualified);
            __ring_match37: {
              const __ring_m37 = full_scheme;
              if (__ring_m37._tag === "some") {
                const fs = __ring_m37._0;
                const t = env$TypeEnv_instantiate(ctx.env, fs);
                return new infer_ctx$InferResult(hir$HExpr_Ident(full_qualified, Option_none, fs.def_id, Option_none, t, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
                break __ring_match37;
              }
              if (__ring_m37._tag === "none") {
                break __ring_match37;
              }
              __match_fail(__ring_m37);
            }
          }
          break __ring_match36;
        }
        __match_fail(__ring_m36);
      }
      break __ring_match35;
    }
    if (__ring_m35._tag === "none") {
      break __ring_match35;
    }
    __match_fail(__ring_m35);
  }
  const scheme = env$TypeEnv_lookup(ctx.env, name);
  __ring_match38: {
    const __ring_m38 = scheme;
    if (__ring_m38._tag === "none") {
      __ring_match39: {
        const __ring_m39 = resolved_qualifier;
        if (__ring_m39._tag === "some") {
          const q = __ring_m39._0;
          const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `'${q}' has no member '${name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(name, Option_none));
          return new infer_ctx$InferResult(hir$HExpr_Ident(name, Option_none, Option_none, Option_none, types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
          break __ring_match39;
        }
        if (__ring_m39._tag === "none") {
          break __ring_match39;
        }
        __match_fail(__ring_m39);
      }
      const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `Undefined variable: ${name}`, span, diagnostics$DiagnosticContext_UndefinedVariable(name, Option_none));
      return new infer_ctx$InferResult(hir$HExpr_Ident(name, Option_none, Option_none, Option_none, types$Type_ErrorType, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match38;
    }
    if (__ring_m38._tag === "some") {
      const s = __ring_m38._0;
      const t = env$TypeEnv_instantiate(ctx.env, s);
      __ring_match40: {
        const __ring_m40 = s.def_id;
        if (__ring_m40._tag === "some") {
          const did = __ring_m40._0;
          if (_Set_contains(ctx.env.scope.mutable_vars, did, __Int_Eq)) {
            __ring_match41: {
              const __ring_m41 = _Map_get(ctx.var_lambda_depth, did);
              if (__ring_m41._tag === "some") {
                const def_depth = __ring_m41._0;
                if ((ctx.lambda_depth > def_depth)) {
                  _Set_insert(ctx.boxed_vars, did);
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
      let resolved_name = Option_none;
      let enum_name = Option_none;
      let __ring_blk0;
      __ring_match42: {
        const __ring_m42 = _Map_get(ctx.use_aliases, name);
        if (__ring_m42._tag === "some") {
          const qualified = __ring_m42._0;
          __ring_blk0 = qualified;
          break __ring_match42;
        }
        if (__ring_m42._tag === "none") {
          __ring_blk0 = name;
          break __ring_match42;
        }
        __match_fail(__ring_m42);
      }
      const actual_name = __ring_blk0;
      __ring_match43: {
        const __ring_m43 = resolved_qualifier;
        if (__ring_m43._tag === "some") {
          const q = __ring_m43._0;
          __ring_match44: {
            const __ring_m44 = _Map_get(ctx.env.types.enums, q);
            if (__ring_m44._tag === "some") {
              const enum_def = __ring_m44._0;
              if (_Map_contains_key(enum_def.variant_index, name)) {
                enum_name = Option_some(enum_def.name);
              } else {
                const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `'${q}' has no variant '${name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(name, Option_none));
              }
              break __ring_match44;
            }
            if (__ring_m44._tag === "none") {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0201, `'${q}' has no variant '${name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(name, Option_none));
              break __ring_match44;
            }
            __match_fail(__ring_m44);
          }
          break __ring_match43;
        }
        if (__ring_m43._tag === "none") {
          enum_name = _Map_get(ctx.env.types.variant_to_enum, name);
          break __ring_match43;
        }
        __match_fail(__ring_m43);
      }
      __ring_match45: {
        const __ring_m45 = enum_name;
        if (__ring_m45._tag === "some") {
          const en = __ring_m45._0;
          resolved_name = Option_some(hir$variant_js_name(en, name));
          break __ring_match45;
        }
        if (__ring_m45._tag === "none") {
          break __ring_match45;
        }
        __match_fail(__ring_m45);
      }
      return new infer_ctx$InferResult(hir$HExpr_Ident(actual_name, resolved_name, s.def_id, Option_none, t, types$EMPTY_ROW, span), subst, types$EMPTY_ROW);
      break __ring_match38;
    }
    __match_fail(__ring_m38);
  }
}

function resolve_var_id(id, sub) {
  __ring_match46: {
    const __ring_m46 = union_find$uf_lookup(sub, id);
    if (__ring_m46._tag === "some") {
      const resolved = __ring_m46._0;
      __ring_match47: {
        const __ring_m47 = resolved;
        if (__ring_m47._tag === "TypeVar") {
          const new_id = __ring_m47.id;
          return resolve_var_id(new_id, sub);
          break __ring_match47;
        }
        return id;
        break __ring_match47;
      }
      break __ring_match46;
    }
    if (__ring_m46._tag === "none") {
      return union_find$uf_find(sub, id);
      break __ring_match46;
    }
    __match_fail(__ring_m46);
  }
}

function infer_numeric_op(ctx, left, right, s, span, op_str) {
  const resolved = env$apply_subst(s, hir$hexpr_type(left));
  __ring_match48: {
    const __ring_m48 = resolved;
    if (__ring_m48._tag === "TypeVar") {
      const tv_id = __ring_m48.id;
      let rigid_ids = set_new();
      let sorted_tp_scope = _Map_entries(ctx.type_param_scope);
      sorted_tp_scope.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
      const __ring_iter_5 = __List_Iterable.iter(sorted_tp_scope);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const entry = __ring_next_5._0;
        const tp_type = entry[1];
        __ring_match49: {
          const __ring_m49 = tp_type;
          if (__ring_m49._tag === "TypeVar") {
            const tp_id = __ring_m49.id;
            _Set_insert(rigid_ids, resolve_var_id(tp_id, s));
            break __ring_match49;
          }
          break __ring_match49;
        }
      }
      const is_rigid = _Set_contains(rigid_ids, resolve_var_id(tv_id, s), __Int_Eq);
      if (is_rigid) {
        return infer_ctx$type_error(ctx.sink, codes$E0303, `Operator ${op_str} requires numeric types (Int or Float), got unresolved type`, span, diagnostics$DiagnosticContext_TypeMismatch("Int or Float", "unresolved type", Option_none));
      } else {
        const _ = infer_ctx$unify_at(ctx.sink, ctx.env, resolved, types$INT, s, span);
        return types$INT;
      }
      break __ring_match48;
    }
    if (__ring_m48._tag === "IntType") {
      return types$INT;
      break __ring_match48;
    }
    if (__ring_m48._tag === "FloatType") {
      return types$FLOAT;
      break __ring_match48;
    }
    return infer_ctx$type_error(ctx.sink, codes$E0303, `Operator ${op_str} requires numeric types, got ${types$type_to_string(resolved)}`, span, diagnostics$DiagnosticContext_TypeMismatch("Int or Float", types$type_to_string(resolved), Option_none));
    break __ring_match48;
  }
}

function is_mut_method_call(ctx, recv_type, method) {
  let type_name = Option_none;
  __ring_match50: {
    const __ring_m50 = recv_type;
    if (__ring_m50._tag === "StructType") {
      const name = __ring_m50.name;
      type_name = Option_some(name);
      break __ring_match50;
    }
    if (__ring_m50._tag === "EnumType") {
      const name = __ring_m50.name;
      type_name = Option_some(name);
      break __ring_match50;
    }
    __ring_match51: {
      const __ring_m51 = types$type_to_builtin_name(recv_type);
      if (__ring_m51._tag === "some") {
        const n = __ring_m51._0;
        type_name = Option_some(n);
        break __ring_match51;
      }
      if (__ring_m51._tag === "none") {
        break __ring_match51;
      }
      __match_fail(__ring_m51);
    }
    break __ring_match50;
  }
  __ring_match52: {
    const __ring_m52 = type_name;
    if (__ring_m52._tag === "some") {
      const tname = __ring_m52._0;
      __ring_match53: {
        const __ring_m53 = _Map_get(ctx.env.trait_reg.mut_methods, tname);
        if (__ring_m53._tag === "some") {
          const mut_set = __ring_m53._0;
          return _Set_contains(mut_set, method, __Str_Eq);
          break __ring_match53;
        }
        if (__ring_m53._tag === "none") {
          return false;
          break __ring_match53;
        }
        __match_fail(__ring_m53);
      }
      break __ring_match52;
    }
    if (__ring_m52._tag === "none") {
      return false;
      break __ring_match52;
    }
    __match_fail(__ring_m52);
  }
}

function is_primitive_eq(t) {
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
    if (__ring_m54._tag === "UnitType") {
      return true;
      break __ring_match54;
    }
    if (__ring_m54._tag === "NeverType") {
      return true;
      break __ring_match54;
    }
    if (__ring_m54._tag === "AnyType") {
      return true;
      break __ring_match54;
    }
    return false;
    break __ring_match54;
  }
}

function is_primitive_ord(t) {
  __ring_match55: {
    const __ring_m55 = t;
    if (__ring_m55._tag === "IntType") {
      return true;
      break __ring_match55;
    }
    if (__ring_m55._tag === "FloatType") {
      return true;
      break __ring_match55;
    }
    if (__ring_m55._tag === "StrType") {
      return true;
      break __ring_match55;
    }
    if (__ring_m55._tag === "BoolType") {
      return true;
      break __ring_match55;
    }
    return false;
    break __ring_match55;
  }
}

function is_tuple_type(t) {
  __ring_match56: {
    const __ring_m56 = t;
    if (__ring_m56._tag === "TupleType") {
      return true;
      break __ring_match56;
    }
    return false;
    break __ring_match56;
  }
}

function is_value_type(t) {
  __ring_match57: {
    const __ring_m57 = t;
    if (__ring_m57._tag === "IntType") {
      return true;
      break __ring_match57;
    }
    if (__ring_m57._tag === "FloatType") {
      return true;
      break __ring_match57;
    }
    if (__ring_m57._tag === "BoolType") {
      return true;
      break __ring_match57;
    }
    if (__ring_m57._tag === "StrType") {
      return true;
      break __ring_match57;
    }
    return false;
    break __ring_match57;
  }
}

function lookup_impl_method(ctx, type_name, method) {
  __ring_match58: {
    const __ring_m58 = _Map_get(ctx.env.trait_reg.impl_methods, type_name);
    if (__ring_m58._tag === "some") {
      const impl_methods = __ring_m58._0;
      __ring_match59: {
        const __ring_m59 = _Map_get(impl_methods, method);
        if (__ring_m59._tag === "some") {
          const scheme = __ring_m59._0;
          return new MethodLookupResult(Option_some(env$TypeEnv_instantiate(ctx.env, scheme)), Option_some(scheme));
          break __ring_match59;
        }
        if (__ring_m59._tag === "none") {
          return new MethodLookupResult(Option_none, Option_none);
          break __ring_match59;
        }
        __match_fail(__ring_m59);
      }
      break __ring_match58;
    }
    if (__ring_m58._tag === "none") {
      return new MethodLookupResult(Option_none, Option_none);
      break __ring_match58;
    }
    __match_fail(__ring_m58);
  }
}

function lookup_trait_method(ctx, type_name, method, span) {
  let found_type = Option_none;
  let found_trait_name = Option_none;
  __ring_match60: {
    const __ring_m60 = _Map_get(ctx.env.trait_reg.trait_impls, type_name);
    if (__ring_m60._tag === "some") {
      const type_impls = __ring_m60._0;
      const __ring_iter_6 = __List_Iterable.iter(type_impls);
      while (true) {
        const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
        if (__ring_next_6._tag === "none") break;
        const impl_entry = __ring_next_6._0;
        __ring_match61: {
          const __ring_m61 = _Map_get(ctx.env.trait_reg.traits, impl_entry.trait_name);
          if (__ring_m61._tag === "some") {
            const trait_def = __ring_m61._0;
            const tm = ((__a) => { const __i = __a.findIndex((function(m) { return (m.name === method); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(trait_def.methods);
            __ring_match62: {
              const __ring_m62 = tm;
              if (__ring_m62._tag === "some") {
                const found_method = __ring_m62._0;
                __ring_match63: {
                  const __ring_m63 = found_trait_name;
                  if (__ring_m63._tag === "some") {
                    const prev_trait = __ring_m63._0;
                    const _ = infer_ctx$type_error(ctx.sink, codes$E0504, `Ambiguous method '${method}' on '${type_name}': found in trait '${prev_trait}' and '${impl_entry.trait_name}'`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`disambiguate by calling TraitName::${method}`)));
                    return found_type;
                    break __ring_match63;
                  }
                  if (__ring_m63._tag === "none") {
                    found_type = Option_some(env$TypeEnv_instantiate(ctx.env, new env$TypeScheme(found_method.ty, trait_def.type_param_vars, [], Option_none)));
                    found_trait_name = Option_some(impl_entry.trait_name);
                    break __ring_match63;
                  }
                  __match_fail(__ring_m63);
                }
                break __ring_match62;
              }
              if (__ring_m62._tag === "none") {
                break __ring_match62;
              }
              __match_fail(__ring_m62);
            }
            break __ring_match61;
          }
          if (__ring_m61._tag === "none") {
            break __ring_match61;
          }
          __match_fail(__ring_m61);
        }
      }
      break __ring_match60;
    }
    if (__ring_m60._tag === "none") {
      break __ring_match60;
    }
    __match_fail(__ring_m60);
  }
  return found_type;
}

function resolve_arg_bound_dict(ctx, concrete, trait_name, dicts) {
  __ring_match64: {
    const __ring_m64 = concrete;
    if (__ring_m64._tag === "StructType") {
      const name = __ring_m64.name;
      if (env$has_impl(ctx.env.trait_reg, name, trait_name)) {
        return List_push(dicts, hir$trait_dict_name(name, trait_name));
      }
      break __ring_match64;
    }
    if (__ring_m64._tag === "EnumType") {
      const name = __ring_m64.name;
      if (env$has_impl(ctx.env.trait_reg, name, trait_name)) {
        return List_push(dicts, hir$trait_dict_name(name, trait_name));
      }
      break __ring_match64;
    }
    if (__ring_m64._tag === "TypeVar") {
      const id = __ring_m64.id;
      const matching = ((__a) => { const __i = __a.findIndex((function(fb) { return ((fb.type_param_var_id === id) ? (fb.trait_name === trait_name) : false); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(ctx.current_fn_bounds);
      __ring_match65: {
        const __ring_m65 = matching;
        if (__ring_m65._tag === "some") {
          const fb = __ring_m65._0;
          return List_push(dicts, hir$trait_bound_param_name(fb.type_param_name, fb.trait_name));
          break __ring_match65;
        }
        if (__ring_m65._tag === "none") {
          break __ring_match65;
        }
        __match_fail(__ring_m65);
      }
      break __ring_match64;
    }
    __ring_match66: {
      const __ring_m66 = types$type_to_builtin_name(concrete);
      if (__ring_m66._tag === "some") {
        const prim_name = __ring_m66._0;
        if (env$has_impl(ctx.env.trait_reg, prim_name, trait_name)) {
          return List_push(dicts, hir$trait_dict_name(prim_name, trait_name));
        }
        break __ring_match66;
      }
      if (__ring_m66._tag === "none") {
        break __ring_match66;
      }
      __match_fail(__ring_m66);
    }
    break __ring_match64;
  }
}

function resolve_arg_dict_closure(ctx, harg, s) {
  __ring_match67: {
    const __ring_m67 = harg;
    if (__ring_m67._tag === "Ident") {
      const name = __ring_m67.name; const resolved_name = __ring_m67.resolved_name; const def_id = __ring_m67.def_id; const ty = __ring_m67.ty; const effects = __ring_m67.effects; const span = __ring_m67.span;
      const arg_scheme = env$TypeEnv_lookup(ctx.env, name);
      __ring_match68: {
        const __ring_m68 = arg_scheme;
        if (__ring_m68._tag === "some") {
          const as_ = __ring_m68._0;
          if ((List_len(as_.bounds) === 0)) {
            return harg;
          }
          const var_map = infer_ctx$build_scheme_var_map(as_, ty);
          let dicts = [];
          const __ring_iter_7 = __List_Iterable.iter(as_.bounds);
          while (true) {
            const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
            if (__ring_next_7._tag === "none") break;
            const bound = __ring_next_7._0;
            __ring_match69: {
              const __ring_m69 = _Map_get(var_map, bound.type_var);
              if (__ring_m69._tag === "some") {
                const fresh_var = __ring_m69._0;
                const concrete = env$apply_subst(s, fresh_var);
                resolve_arg_bound_dict(ctx, concrete, bound.trait_name, dicts);
                break __ring_match69;
              }
              if (__ring_m69._tag === "none") {
                break __ring_match69;
              }
              __match_fail(__ring_m69);
            }
          }
          if ((List_len(dicts) > 0)) {
            return hir$HExpr_Ident(name, resolved_name, def_id, Option_some(dicts), ty, effects, span);
          } else {
            return harg;
          }
          break __ring_match68;
        }
        if (__ring_m68._tag === "none") {
          return harg;
          break __ring_match68;
        }
        __match_fail(__ring_m68);
      }
      break __ring_match67;
    }
    return harg;
    break __ring_match67;
  }
}

function resolve_type_to_dict_ref(ctx, t, subst, trait_name) {
  __ring_match70: {
    const __ring_m70 = types$type_to_builtin_name(t);
    if (__ring_m70._tag === "some") {
      const builtin_name = __ring_m70._0;
      __ring_match71: {
        const __ring_m71 = t;
        if (__ring_m71._tag === "StructType") {
          break __ring_match71;
        }
        if (__ring_m71._tag === "EnumType") {
          break __ring_match71;
        }
        return Option_some(hir$DictRef_Static(hir$trait_dict_name(builtin_name, trait_name)));
        break __ring_match71;
      }
      break __ring_match70;
    }
    if (__ring_m70._tag === "none") {
      break __ring_match70;
    }
    __match_fail(__ring_m70);
  }
  __ring_match72: {
    const __ring_m72 = t;
    if (__ring_m72._tag === "TypeVar") {
      const id = __ring_m72.id;
      const bound = ((__a) => { const __i = __a.findIndex((function(fb) { return ((fb.type_param_var_id === id) ? (fb.trait_name === trait_name) : false); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(ctx.current_fn_bounds);
      __ring_match73: {
        const __ring_m73 = bound;
        if (__ring_m73._tag === "some") {
          const b = __ring_m73._0;
          return Option_some(hir$DictRef_Simple(hir$trait_bound_param_name(b.type_param_name, trait_name)));
          break __ring_match73;
        }
        if (__ring_m73._tag === "none") {
          return Option_none;
          break __ring_match73;
        }
        __match_fail(__ring_m73);
      }
      break __ring_match72;
    }
    if (__ring_m72._tag === "StructType") {
      const name = __ring_m72.name; const type_params = __ring_m72.type_params;
      if (env$has_impl(ctx.env.trait_reg, name, trait_name)) {
        if ((List_len(type_params) > 0)) {
          const inner = resolve_trait_extra_dicts(ctx, type_params, subst, trait_name);
          __ring_match74: {
            const __ring_m74 = inner;
            if (__ring_m74._tag === "some") {
              const inner_dicts = __ring_m74._0;
              return Option_some(hir$DictRef_Wrapped(hir$trait_dict_name(name, trait_name), trait_name, inner_dicts));
              break __ring_match74;
            }
            if (__ring_m74._tag === "none") {
              return Option_some(hir$DictRef_Static(hir$trait_dict_name(name, trait_name)));
              break __ring_match74;
            }
            __match_fail(__ring_m74);
          }
        } else {
          return Option_some(hir$DictRef_Static(hir$trait_dict_name(name, trait_name)));
        }
      } else {
        return Option_none;
      }
      break __ring_match72;
    }
    if (__ring_m72._tag === "EnumType") {
      const name = __ring_m72.name; const type_params = __ring_m72.type_params;
      if (env$has_impl(ctx.env.trait_reg, name, trait_name)) {
        if ((List_len(type_params) > 0)) {
          const inner = resolve_trait_extra_dicts(ctx, type_params, subst, trait_name);
          __ring_match75: {
            const __ring_m75 = inner;
            if (__ring_m75._tag === "some") {
              const inner_dicts = __ring_m75._0;
              return Option_some(hir$DictRef_Wrapped(hir$trait_dict_name(name, trait_name), trait_name, inner_dicts));
              break __ring_match75;
            }
            if (__ring_m75._tag === "none") {
              return Option_some(hir$DictRef_Static(hir$trait_dict_name(name, trait_name)));
              break __ring_match75;
            }
            __match_fail(__ring_m75);
          }
        } else {
          return Option_some(hir$DictRef_Static(hir$trait_dict_name(name, trait_name)));
        }
      } else {
        return Option_none;
      }
      break __ring_match72;
    }
    return Option_none;
    break __ring_match72;
  }
}

function resolve_trait_extra_dicts(ctx, type_args, subst, trait_name) {
  if ((List_len(type_args) === 0)) {
    return Option_none;
  }
  let dicts = [];
  const __ring_iter_8 = __List_Iterable.iter(type_args);
  while (true) {
    const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
    if (__ring_next_8._tag === "none") break;
    const arg = __ring_next_8._0;
    const resolved = env$apply_subst(subst, arg);
    const dict = resolve_type_to_dict_ref(ctx, resolved, subst, trait_name);
    __ring_match76: {
      const __ring_m76 = dict;
      if (__ring_m76._tag === "some") {
        const d = __ring_m76._0;
        List_push(dicts, d);
        break __ring_match76;
      }
      if (__ring_m76._tag === "none") {
        return Option_none;
        break __ring_match76;
      }
      __match_fail(__ring_m76);
    }
  }
  return Option_some(dicts);
}

function resolve_trait_dispatch(ctx, resolved, trait_name, error_code, subst, span, op, is_builtin) {
  if (is_builtin) {
    return hir$TraitDispatch_Builtin;
  }
  __ring_match77: {
    const __ring_m77 = resolved;
    if (__ring_m77._tag === "TypeVar") {
      const id = __ring_m77.id;
      const bound = ((__a) => { const __i = __a.findIndex((function(fb) { return ((fb.trait_name !== trait_name) ? false : ((fb.type_param_var_id === id) ? true : ((union_find$uf_find(subst, fb.type_param_var_id) === id) ? true : (function() {
  const bound_resolved = env$apply_subst(subst, types$Type_TypeVar(fb.type_param_var_id, Option_none));
  __ring_match78: {
    const __ring_m78 = bound_resolved;
    if (__ring_m78._tag === "TypeVar") {
      const bid = __ring_m78.id;
      return (bid === id);
      break __ring_match78;
    }
    return false;
    break __ring_match78;
  }
})()))); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(ctx.current_fn_bounds);
      __ring_match79: {
        const __ring_m79 = bound;
        if (__ring_m79._tag === "some") {
          const b = __ring_m79._0;
          return hir$TraitDispatch_Dict(hir$trait_bound_param_name(b.type_param_name, trait_name));
          break __ring_match79;
        }
        if (__ring_m79._tag === "none") {
          break __ring_match79;
        }
        __match_fail(__ring_m79);
      }
      __ring_match80: {
        const __ring_m80 = _Map_get(ctx.env.scope.var_bounds, id);
        if (__ring_m80._tag === "some") {
          const var_bounds = __ring_m80._0;
          if (_Set_contains(var_bounds, trait_name, __Str_Eq)) {
            return hir$TraitDispatch_Builtin;
          }
          break __ring_match80;
        }
        if (__ring_m80._tag === "none") {
          break __ring_match80;
        }
        __match_fail(__ring_m80);
      }
      const _ = infer_ctx$type_error(ctx.sink, error_code, `Type does not implement ${trait_name}, cannot use '${op}'`, span, diagnostics$DiagnosticContext_TraitError(`type does not implement ${trait_name}`));
      return hir$TraitDispatch_Builtin;
      break __ring_match77;
    }
    if (__ring_m77._tag === "StructType") {
      const name = __ring_m77.name; const type_params = __ring_m77.type_params;
      if (env$has_impl(ctx.env.trait_reg, name, trait_name)) {
        const extra_dicts = resolve_trait_extra_dicts(ctx, type_params, subst, trait_name);
        let __ring_blk1;
        __ring_match81: {
          const __ring_m81 = extra_dicts;
          if (__ring_m81._tag === "some") {
            const d = __ring_m81._0;
            __ring_blk1 = d;
            break __ring_match81;
          }
          if (__ring_m81._tag === "none") {
            __ring_blk1 = [];
            break __ring_match81;
          }
          __match_fail(__ring_m81);
        }
        return hir$TraitDispatch_Direct(hir$trait_dict_name(name, trait_name), __ring_blk1);
      }
      const _ = infer_ctx$type_error(ctx.sink, error_code, `Type '${types$type_to_string(resolved)}' does not implement ${trait_name}, cannot use '${op}'`, span, diagnostics$DiagnosticContext_TraitError(`type '${types$type_to_string(resolved)}' does not implement ${trait_name}`));
      return hir$TraitDispatch_Builtin;
      break __ring_match77;
    }
    if (__ring_m77._tag === "EnumType") {
      const name = __ring_m77.name; const type_params = __ring_m77.type_params;
      if (env$has_impl(ctx.env.trait_reg, name, trait_name)) {
        const extra_dicts = resolve_trait_extra_dicts(ctx, type_params, subst, trait_name);
        let __ring_blk2;
        __ring_match82: {
          const __ring_m82 = extra_dicts;
          if (__ring_m82._tag === "some") {
            const d = __ring_m82._0;
            __ring_blk2 = d;
            break __ring_match82;
          }
          if (__ring_m82._tag === "none") {
            __ring_blk2 = [];
            break __ring_match82;
          }
          __match_fail(__ring_m82);
        }
        return hir$TraitDispatch_Direct(hir$trait_dict_name(name, trait_name), __ring_blk2);
      }
      const _ = infer_ctx$type_error(ctx.sink, error_code, `Type '${types$type_to_string(resolved)}' does not implement ${trait_name}, cannot use '${op}'`, span, diagnostics$DiagnosticContext_TraitError(`type '${types$type_to_string(resolved)}' does not implement ${trait_name}`));
      return hir$TraitDispatch_Builtin;
      break __ring_match77;
    }
    const _ = infer_ctx$type_error(ctx.sink, error_code, `Type '${types$type_to_string(resolved)}' does not implement ${trait_name}, cannot use '${op}'`, span, diagnostics$DiagnosticContext_TraitError(`type '${types$type_to_string(resolved)}' does not implement ${trait_name}`));
    return hir$TraitDispatch_Builtin;
    break __ring_match77;
  }
}

function rewrite_bare_enum_bindings(env, pattern) {
  __ring_match83: {
    const __ring_m83 = pattern;
    if (__ring_m83._tag === "Binding") {
      const name = __ring_m83.name; const span = __ring_m83.span;
      __ring_match84: {
        const __ring_m84 = _Map_get(env.types.variant_to_enum, name);
        if (__ring_m84._tag === "some") {
          const ve = __ring_m84._0;
          __ring_match85: {
            const __ring_m85 = _Map_get(env.types.enums, ve);
            if (__ring_m85._tag === "some") {
              const edef = __ring_m85._0;
              const v = env$lookup_variant(edef, name);
              __ring_match86: {
                const __ring_m86 = v;
                if (__ring_m86._tag === "some") {
                  const found_v = __ring_m86._0;
                  if ((List_len(found_v.fields) === 0)) {
                    const empty_pats = [];
                    return ast$Pattern_Constructor(name, Option_none, empty_pats, span);
                  } else {
                    return pattern;
                  }
                  break __ring_match86;
                }
                if (__ring_m86._tag === "none") {
                  return pattern;
                  break __ring_match86;
                }
                __match_fail(__ring_m86);
              }
              break __ring_match85;
            }
            if (__ring_m85._tag === "none") {
              return pattern;
              break __ring_match85;
            }
            __match_fail(__ring_m85);
          }
          break __ring_match84;
        }
        if (__ring_m84._tag === "none") {
          return pattern;
          break __ring_match84;
        }
        __match_fail(__ring_m84);
      }
      break __ring_match83;
    }
    if (__ring_m83._tag === "TuplePattern") {
      const elements = __ring_m83.elements; const span = __ring_m83.span;
      let new_elems = [];
      const __ring_iter_9 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
        if (__ring_next_9._tag === "none") break;
        const elem = __ring_next_9._0;
        List_push(new_elems, rewrite_bare_enum_bindings(env, elem));
      }
      return ast$Pattern_TuplePattern(new_elems, span);
      break __ring_match83;
    }
    if (__ring_m83._tag === "Constructor") {
      const name = __ring_m83.name; const qualifier = __ring_m83.qualifier; const fields = __ring_m83.fields; const span = __ring_m83.span;
      let new_fields = [];
      const __ring_iter_10 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
        if (__ring_next_10._tag === "none") break;
        const f = __ring_next_10._0;
        List_push(new_fields, rewrite_bare_enum_bindings(env, f));
      }
      return ast$Pattern_Constructor(name, qualifier, new_fields, span);
      break __ring_match83;
    }
    if (__ring_m83._tag === "NamedConstructor") {
      const name = __ring_m83.name; const qualifier = __ring_m83.qualifier; const fields = __ring_m83.fields; const rest = __ring_m83.rest; const span = __ring_m83.span;
      let new_fields = [];
      const __ring_iter_11 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
        if (__ring_next_11._tag === "none") break;
        const f = __ring_next_11._0;
        List_push(new_fields, new ast$NamedPatternField(f.name, rewrite_bare_enum_bindings(env, f.pattern), f.span));
      }
      return ast$Pattern_NamedConstructor(name, qualifier, new_fields, rest, span);
      break __ring_match83;
    }
    if (__ring_m83._tag === "OrPattern") {
      const patterns = __ring_m83.patterns; const span = __ring_m83.span;
      let new_pats = [];
      const __ring_iter_12 = __List_Iterable.iter(patterns);
      while (true) {
        const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
        if (__ring_next_12._tag === "none") break;
        const p = __ring_next_12._0;
        List_push(new_pats, rewrite_bare_enum_bindings(env, p));
      }
      return ast$Pattern_OrPattern(new_pats, span);
      break __ring_match83;
    }
    return pattern;
    break __ring_match83;
  }
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


export { MethodLookupResult, StmtResult, is_value_type, cancel_local_mut_effects, resolve_var_id, check_assign_target_mutable, find_root_expr, get_assign_target_root_def_id, get_hexpr_root_type, infer_ident, infer_numeric_op, is_primitive_eq, is_primitive_ord, is_tuple_type, resolve_trait_dispatch, resolve_trait_extra_dicts, resolve_type_to_dict_ref, resolve_arg_dict_closure, resolve_arg_bound_dict, check_expr_is_let_def, get_expr_def_id, is_mut_method_call, check_receiver_mutability, lookup_impl_method, lookup_trait_method, rewrite_bare_enum_bindings };