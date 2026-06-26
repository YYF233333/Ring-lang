import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, compare_by_first as hir$compare_by_first, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_FloatIdentity as hir$FieldAction_FloatIdentity, FieldAction_BoolIdentity as hir$FieldAction_BoolIdentity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { make_diag as diagnostics$make_diag, make_diagnostic as diagnostics$make_diagnostic, new_collecting_sink as diagnostics$new_collecting_sink, severity_to_str as diagnostics$severity_to_str, CollectingSink as diagnostics$CollectingSink, Diagnostic as diagnostics$Diagnostic, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, DiagnosticNote as diagnostics$DiagnosticNote, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, Suggestion as diagnostics$Suggestion, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Severity_Eq as diagnostics$__Severity_Eq, __Severity_Clone as diagnostics$__Severity_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __Severity_Debug as diagnostics$__Severity_Debug, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Suggestion_Debug as diagnostics$__Suggestion_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { format_human as formatter$format_human, format_llm as formatter$format_llm } from "./formatter.js";
import { check as checker$check, check_module as checker$check_module, CheckResult as checker$CheckResult } from "./checker.js";
import { collect_all_supertraits_llvm as codegen_llvm$collect_all_supertraits_llvm, generate_llvm as codegen_llvm$generate_llvm, generate_llvm_project as codegen_llvm$generate_llvm_project } from "./codegen_llvm.js";
import { compile_project as compiler_mod$compile_project, compile_project_llvm as compiler_mod$compile_project_llvm, verify_project_rc as compiler_mod$verify_project_rc, CompileProjectResult as compiler_mod$CompileProjectResult, LlvmCompileResult as compiler_mod$LlvmCompileResult, RcProjectVerifyResult as compiler_mod$RcProjectVerifyResult, __CompileProjectResult_Eq as compiler_mod$__CompileProjectResult_Eq, __CompileProjectResult_Clone as compiler_mod$__CompileProjectResult_Clone, __CompileProjectResult_Ord as compiler_mod$__CompileProjectResult_Ord, __CompileProjectResult_Debug as compiler_mod$__CompileProjectResult_Debug, __LlvmCompileResult_Eq as compiler_mod$__LlvmCompileResult_Eq, __LlvmCompileResult_Clone as compiler_mod$__LlvmCompileResult_Clone, __LlvmCompileResult_Ord as compiler_mod$__LlvmCompileResult_Ord, __LlvmCompileResult_Debug as compiler_mod$__LlvmCompileResult_Debug, __RcProjectVerifyResult_Eq as compiler_mod$__RcProjectVerifyResult_Eq, __RcProjectVerifyResult_Clone as compiler_mod$__RcProjectVerifyResult_Clone, __RcProjectVerifyResult_Ord as compiler_mod$__RcProjectVerifyResult_Ord, __RcProjectVerifyResult_Debug as compiler_mod$__RcProjectVerifyResult_Debug } from "./compiler_mod.js";
import { PREC_ADD_SUB as parser$PREC_ADD_SUB, PREC_CATCH as parser$PREC_CATCH, PREC_COMPARE as parser$PREC_COMPARE, PREC_EQUALITY as parser$PREC_EQUALITY, PREC_LOGIC_AND as parser$PREC_LOGIC_AND, PREC_LOGIC_OR as parser$PREC_LOGIC_OR, PREC_MUL_DIV as parser$PREC_MUL_DIV, PREC_NONE as parser$PREC_NONE, PREC_POSTFIX as parser$PREC_POSTFIX, PREC_RANGE as parser$PREC_RANGE, PREC_UNARY as parser$PREC_UNARY, expr_span as parser$expr_span, infix_precedence as parser$infix_precedence, new_parser as parser$new_parser, parse as parser$parse, pattern_span as parser$pattern_span, type_expr_span as parser$type_expr_span, Parser as parser$Parser, __Parser_Clone as parser$__Parser_Clone, __Parser_Debug as parser$__Parser_Debug, Parser_peek as parser$Parser_peek, Parser_peek_at as parser$Parser_peek_at, Parser_advance as parser$Parser_advance, Parser_check as parser$Parser_check, Parser_try_consume as parser$Parser_try_consume, Parser_expect as parser$Parser_expect, Parser_at_end as parser$Parser_at_end, Parser_skip_to_recovery_point as parser$Parser_skip_to_recovery_point, Parser_current_span_start as parser$Parser_current_span_start, Parser_make_span as parser$Parser_make_span, Parser_report_error as parser$Parser_report_error, Parser_error as parser$Parser_error, Parser_parse_program as parser$Parser_parse_program, Parser_parse_stmt as parser$Parser_parse_stmt, Parser_parse_while_stmt as parser$Parser_parse_while_stmt, Parser_parse_loop_stmt as parser$Parser_parse_loop_stmt, Parser_parse_for_in_stmt as parser$Parser_parse_for_in_stmt, Parser_parse_break_stmt as parser$Parser_parse_break_stmt, Parser_parse_continue_stmt as parser$Parser_parse_continue_stmt, Parser_parse_if_let_stmt as parser$Parser_parse_if_let_stmt, Parser_parse_binding_stmt as parser$Parser_parse_binding_stmt, Parser_parse_binding_body as parser$Parser_parse_binding_body, Parser_parse_return_stmt as parser$Parser_parse_return_stmt, Parser_parse_return_expr as parser$Parser_parse_return_expr, Parser_parse_block_expr as parser$Parser_parse_block_expr, Parser_parse_use_decl as parser$Parser_parse_use_decl, Parser_parse_mod_block as parser$Parser_parse_mod_block, Parser_parse_decl as parser$Parser_parse_decl, Parser_parse_effect_list as parser$Parser_parse_effect_list, Parser_parse_effect_annotation as parser$Parser_parse_effect_annotation, Parser_parse_fn_decl as parser$Parser_parse_fn_decl, Parser_parse_const_decl as parser$Parser_parse_const_decl, Parser_parse_sig_block as parser$Parser_parse_sig_block, Parser_parse_extern_decl as parser$Parser_parse_extern_decl, Parser_parse_extern_fn_decl_body as parser$Parser_parse_extern_fn_decl_body, Parser_parse_extern_type_decl_body as parser$Parser_parse_extern_type_decl_body, Parser_parse_type_alias_decl as parser$Parser_parse_type_alias_decl, Parser_parse_struct_decl as parser$Parser_parse_struct_decl, Parser_parse_enum_decl as parser$Parser_parse_enum_decl, Parser_parse_impl_decl as parser$Parser_parse_impl_decl, Parser_parse_effect_alias_decl as parser$Parser_parse_effect_alias_decl, Parser_parse_effect_decl as parser$Parser_parse_effect_decl, Parser_parse_test_decl as parser$Parser_parse_test_decl, Parser_parse_assoc_type_decl as parser$Parser_parse_assoc_type_decl, Parser_parse_trait_decl as parser$Parser_parse_trait_decl, Parser_parse_expr as parser$Parser_parse_expr, Parser_parse_expr_no_struct as parser$Parser_parse_expr_no_struct, Parser_parse_expr_bp as parser$Parser_parse_expr_bp, Parser_parse_prefix as parser$Parser_parse_prefix, Parser_parse_dot_expr as parser$Parser_parse_dot_expr, Parser_parse_index_expr as parser$Parser_parse_index_expr, Parser_parse_call_expr as parser$Parser_parse_call_expr, Parser_parse_arg_list as parser$Parser_parse_arg_list, Parser_parse_catch_expr as parser$Parser_parse_catch_expr, Parser_parse_string_interp as parser$Parser_parse_string_interp, Parser_parse_if_expr as parser$Parser_parse_if_expr, Parser_parse_match_expr as parser$Parser_parse_match_expr, Parser_parse_match_arm as parser$Parser_parse_match_arm, Parser_parse_pattern as parser$Parser_parse_pattern, Parser_parse_handle_expr as parser$Parser_parse_handle_expr, Parser_parse_effect_handler as parser$Parser_parse_effect_handler, Parser_parse_lambda_expr as parser$Parser_parse_lambda_expr, Parser_parse_struct_literal as parser$Parser_parse_struct_literal, Parser_try_parse_type_args as parser$Parser_try_parse_type_args, Parser_parse_type_expr as parser$Parser_parse_type_expr, Parser_parse_record_type_expr as parser$Parser_parse_record_type_expr, Parser_parse_qualified_ident as parser$Parser_parse_qualified_ident, Parser_validate_target_type_args as parser$Parser_validate_target_type_args, Parser_parse_type_params as parser$Parser_parse_type_params, Parser_parse_type_bound as parser$Parser_parse_type_bound, Parser_parse_params as parser$Parser_parse_params, Parser_parse_param as parser$Parser_parse_param } from "./parser.js";
import { expr_diverges as perceus$expr_diverges, is_scalar_type as perceus$is_scalar_type, is_str_index as perceus$is_str_index, is_unresolved_var_type as perceus$is_unresolved_var_type, is_variant_constructor_call as perceus$is_variant_constructor_call, perceus_transform as perceus$perceus_transform, perceus_transform_mutated as perceus$perceus_transform_mutated, rc_name_skippable as perceus$rc_name_skippable, sink_arg_indices as perceus$sink_arg_indices, stmt_diverges as perceus$stmt_diverges } from "./perceus.js";
import { format_rc_findings as verify_rc$format_rc_findings, rc_fatal_count as verify_rc$rc_fatal_count, rc_verify_boundary_note as verify_rc$rc_verify_boundary_note, verify_rc_program as verify_rc$verify_rc_program, RcFinding as verify_rc$RcFinding, __RcFinding_Eq as verify_rc$__RcFinding_Eq, __RcFinding_Clone as verify_rc$__RcFinding_Clone, __RcFinding_Ord as verify_rc$__RcFinding_Ord, __RcFinding_Debug as verify_rc$__RcFinding_Debug } from "./verify_rc.js";



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

class CliArgs {
  constructor(command, file, debug, error_format, out_dir, target, verify_rc, verify_strict, rc_mutate) {
    this.command = command;
    this.file = file;
    this.debug = debug;
    this.error_format = error_format;
    this.out_dir = out_dir;
    this.target = target;
    this.verify_rc = verify_rc;
    this.verify_strict = verify_strict;
    this.rc_mutate = rc_mutate;
  }
}

function parse_cli_args(args) {
  let debug = false;
  let error_format = "human";
  let out_dir = "dist";
  let target = "llvm";
  let verify_rc = false;
  let verify_strict = false;
  let rc_mutate = "";
  let positional = [];
  const __ring_iter_2 = __List_Iterable.iter(args);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const arg = __ring_next_2._0;
    if ((arg === "--debug")) {
      debug = true;
    } else {
      if ((arg === "--verify-rc")) {
        verify_rc = true;
      } else {
        if ((arg === "--verify-rc-strict")) {
          verify_strict = true;
        } else {
          if (Str_starts_with(arg, "--rc-mutate=")) {
            rc_mutate = Str_slice(arg, 12, Str_len(arg));
          } else {
            if (Str_starts_with(arg, "--error-format=")) {
              error_format = Str_slice(arg, 15, Str_len(arg));
            } else {
              if (Str_starts_with(arg, "--out-dir=")) {
                out_dir = Str_slice(arg, 10, Str_len(arg));
              } else {
                if (Str_starts_with(arg, "--target=")) {
                  target = Str_slice(arg, 9, Str_len(arg));
                } else {
                  List_push(positional, arg);
                }
              }
            }
          }
        }
      }
    }
  }
  let __ring_blk0;
  __ring_match6: {
    const __ring_m6 = List_get(positional, 0);
    if (__ring_m6._tag === "some") {
      const c = __ring_m6._0;
      __ring_blk0 = c;
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      __ring_blk0 = "help";
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
  const command = __ring_blk0;
  let __ring_blk1;
  __ring_match7: {
    const __ring_m7 = List_get(positional, 1);
    if (__ring_m7._tag === "some") {
      const f = __ring_m7._0;
      __ring_blk1 = f;
      break __ring_match7;
    }
    if (__ring_m7._tag === "none") {
      __ring_blk1 = "";
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
  const file = __ring_blk1;
  return new CliArgs(command, file, debug, error_format, out_dir, target, verify_rc, verify_strict, rc_mutate);
}

function usage(__ring_ev_io) {
  print("Ring-lang compiler v0.1.0 (Ring bootstrap)", __ring_ev_io);
  print("", __ring_ev_io);
  print("Usage:", __ring_ev_io);
  print("  ring build <file.ring>    Compile to native .o file", __ring_ev_io);
  print("  ring check <file.ring>    Type-check only", __ring_ev_io);
  print("  ring help                 Show this help", __ring_ev_io);
  print("", __ring_ev_io);
  print("Options:", __ring_ev_io);
  print("  --debug                   Print intermediate info", __ring_ev_io);
  print("  --error-format=human|llm  Error output format (default: human)", __ring_ev_io);
  print("  --out-dir=<path>          Output directory (default: dist)", __ring_ev_io);
  print("  --verify-rc               (check) static RC leak/UAF verification of the post-RC HIR", __ring_ev_io);
  return print("  --verify-rc-strict        like --verify-rc, but documented-exempt findings also fail", __ring_ev_io);
}

function cli_main(__ring_ev_fail, __ring_ev_io) {
  const args = argv();
  const parsed = parse_cli_args(args);
  if (((parsed.command === "help") ? true : (parsed.command === ""))) {
    usage(__ring_ev_io);
    return;
  }
  if ((parsed.command === "lsp")) {
    eprintln("LSP mode not available in Ring compiler");
    exit_process(1);
    return;
  }
  if ((parsed.file === "")) {
    eprintln("Error: no input file specified.");
    exit_process(1);
    return;
  }
  const file_path = path_resolve(parsed.file);
  if ((file_exists(file_path) === false)) {
    eprintln(`Error: file not found: ${file_path}`);
    exit_process(1);
    return;
  }
  const source = read_file(file_path);
  const parse_sink = diagnostics$new_collecting_sink();
  const ast = parser$parse(source, file_path, parse_sink, __ring_ev_fail);
  if (diagnostics$CollectingSink_has_errors(parse_sink)) {
    const diagnostics = parse_sink.items;
    if ((parsed.error_format === "llm")) {
      print(formatter$format_llm(diagnostics, file_path), __ring_ev_io);
    } else {
      eprintln(formatter$format_human(diagnostics, source));
    }
    exit_process(1);
    return;
  }
  if ((List_len(ast.uses) > 0)) {
    if (((parsed.command === "check") ? (parsed.verify_rc ? true : parsed.verify_strict) : false)) {
      const res = compiler_mod$verify_project_rc(file_path, parsed.rc_mutate, parsed.verify_strict, parsed.error_format, __ring_ev_fail);
      if ((res.success === false)) {
        eprintln("Compilation failed");
        exit_process(1);
        return;
      }
      print(res.report, __ring_ev_io);
      if (((res.fatal > 0) ? true : (parsed.verify_strict ? (res.exempt > 0) : false))) {
        exit_process(1);
      } else {
        print("OK", __ring_ev_io);
      }
      return;
    }
    if ((parsed.command === "check")) {
      const result = compiler_mod$compile_project(file_path, parsed.error_format, __ring_ev_fail);
      if (result.success) {
        print("OK", __ring_ev_io);
      } else {
        eprintln("Compilation failed");
        exit_process(1);
      }
    } else {
      if ((parsed.command === "build")) {
        const out_dir = path_resolve(parsed.out_dir);
        const out_path = path_join(out_dir, Str_replace(path_basename(file_path), ".ring", ".o"));
        const result = compiler_mod$compile_project_llvm(file_path, out_path, parsed.error_format, __ring_ev_fail, __ring_ev_io);
        if (result.success) {
        } else {
          eprintln("Compilation failed");
          exit_process(1);
        }
      } else {
        eprintln("Only 'build' and 'check' commands are supported");
        exit_process(1);
      }
    }
    return;
  }
  const sink = diagnostics$new_collecting_sink();
  const check_result = checker$check(ast, sink, __ring_ev_fail);
  if (diagnostics$CollectingSink_has_errors(sink)) {
    const diagnostics = sink.items;
    if ((parsed.error_format === "llm")) {
      print(formatter$format_llm(diagnostics, file_path), __ring_ev_io);
    } else {
      eprintln(formatter$format_human(diagnostics, source));
    }
    exit_process(1);
    return;
  }
  let warning_diags = [];
  const __ring_iter_3 = __List_Iterable.iter(parse_sink.items);
  while (true) {
    const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
    if (__ring_next_3._tag === "none") break;
    const d = __ring_next_3._0;
    List_push(warning_diags, d);
  }
  const __ring_iter_4 = __List_Iterable.iter(sink.items);
  while (true) {
    const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
    if (__ring_next_4._tag === "none") break;
    const d = __ring_next_4._0;
    List_push(warning_diags, d);
  }
  if ((List_len(warning_diags) > 0)) {
    if ((parsed.error_format === "llm")) {
      eprintln(formatter$format_llm(warning_diags, file_path));
    } else {
      eprintln(formatter$format_human(warning_diags, source));
    }
  }
  if (((parsed.command === "check") ? (parsed.verify_rc ? true : parsed.verify_strict) : false)) {
    const rc_program = perceus$perceus_transform_mutated(check_result.program, parsed.rc_mutate);
    const findings = verify_rc$verify_rc_program(rc_program);
    const fatal = verify_rc$rc_fatal_count(findings);
    const exempt = (List_len(findings) - fatal);
    print(verify_rc$format_rc_findings(findings, parsed.verify_strict), __ring_ev_io);
    if (((fatal > 0) ? true : (parsed.verify_strict ? (exempt > 0) : false))) {
      exit_process(1);
    } else {
      print("OK", __ring_ev_io);
    }
    return;
  }
  if ((parsed.command === "check")) {
    return print("OK", __ring_ev_io);
  } else {
    if ((parsed.command === "build")) {
      const out_path = Str_replace(file_path, ".ring", ".o");
      const rc_program = perceus$perceus_transform(check_result.program);
      return codegen_llvm$generate_llvm(rc_program, out_path, __ring_ev_io);
    } else {
      eprintln("Only 'build' and 'check' commands are supported");
      return exit_process(1);
    }
  }
}

function __CliArgs_Eq_eq(self, other) {
  return (self.command === other.command) && (self.file === other.file) && (self.debug === other.debug) && (self.error_format === other.error_format) && (self.out_dir === other.out_dir) && (self.target === other.target) && (self.verify_rc === other.verify_rc) && (self.verify_strict === other.verify_strict) && (self.rc_mutate === other.rc_mutate);
}
const __CliArgs_Eq = { eq: __CliArgs_Eq_eq, ne: function(self, other) { return !__CliArgs_Eq_eq(self, other); } };

function __Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return __ring_T_Eq.eq(self._0, other._0);
    case "Err": return __ring_E_Eq.eq(self._0, other._0);
    default: return true;
  }
}
const __Result_Eq = { eq: __Result_Eq_eq, ne: function(self, other, __ring_T_Eq, __ring_E_Eq) { return !__Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq); } };

function __CliArgs_Clone_clone(self) {
  return new CliArgs(self.command, self.file, self.debug, self.error_format, self.out_dir, self.target, self.verify_rc, self.verify_strict, self.rc_mutate);
}
const __CliArgs_Clone = { clone: __CliArgs_Clone_clone };

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

function __CliArgs_Ord_cmp(self, other) {
  var c;
  c = (self.command < other.command ? -1 : self.command > other.command ? 1 : 0);
  if (c !== 0) return c;
  c = (self.file < other.file ? -1 : self.file > other.file ? 1 : 0);
  if (c !== 0) return c;
  c = (self.debug < other.debug ? -1 : self.debug > other.debug ? 1 : 0);
  if (c !== 0) return c;
  c = (self.error_format < other.error_format ? -1 : self.error_format > other.error_format ? 1 : 0);
  if (c !== 0) return c;
  c = (self.out_dir < other.out_dir ? -1 : self.out_dir > other.out_dir ? 1 : 0);
  if (c !== 0) return c;
  c = (self.target < other.target ? -1 : self.target > other.target ? 1 : 0);
  if (c !== 0) return c;
  c = (self.verify_rc < other.verify_rc ? -1 : self.verify_rc > other.verify_rc ? 1 : 0);
  if (c !== 0) return c;
  c = (self.verify_strict < other.verify_strict ? -1 : self.verify_strict > other.verify_strict ? 1 : 0);
  if (c !== 0) return c;
  return (self.rc_mutate < other.rc_mutate ? -1 : self.rc_mutate > other.rc_mutate ? 1 : 0);
}
const __CliArgs_Ord = { cmp: __CliArgs_Ord_cmp };

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

function __CliArgs_Debug_debug(self) {
  return "CliArgs { " + "command: " + String(self.command) + ", " + "file: " + String(self.file) + ", " + "debug: " + String(self.debug) + ", " + "error_format: " + String(self.error_format) + ", " + "out_dir: " + String(self.out_dir) + ", " + "target: " + String(self.target) + ", " + "verify_rc: " + String(self.verify_rc) + ", " + "verify_strict: " + String(self.verify_strict) + ", " + "rc_mutate: " + String(self.rc_mutate) + " }";
}
const __CliArgs_Debug = { debug: __CliArgs_Debug_debug };

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


export { cli_main };