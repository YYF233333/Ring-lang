import { __EffectAbort, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_first, List_last, List_contains, List_is_empty, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_is_empty, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_is_empty, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0706 as codes$E0706, error_description as codes$error_description } from "./codes.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, FnBound as env$FnBound, Scope as env$Scope, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __ImplEntry_Clone as env$__ImplEntry_Clone, __FnBound_Clone as env$__FnBound_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __ImplEntry_Debug as env$__ImplEntry_Debug, __FnBound_Debug as env$__FnBound_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { empty_subst as unify$empty_subst, occurs_in as unify$occurs_in, unify_effect_rows as unify$unify_effect_rows, unify as unify$unify, UnificationError as unify$UnificationError, __UnificationError_Eq as unify$__UnificationError_Eq, __UnificationError_Clone as unify$__UnificationError_Clone, __UnificationError_Ord as unify$__UnificationError_Ord, __UnificationError_Debug as unify$__UnificationError_Debug } from "./unify.js";

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
  constructor(env, subst, sink, type_param_scope, current_fn_return_type, current_fn_bounds, fn_bounds_stack, loop_depth) {
    this.env = env;
    this.subst = subst;
    this.sink = sink;
    this.type_param_scope = type_param_scope;
    this.current_fn_return_type = current_fn_return_type;
    this.current_fn_bounds = current_fn_bounds;
    this.fn_bounds_stack = fn_bounds_stack;
    this.loop_depth = loop_depth;
  }
}

function new_infer_ctx(sink) {
  return new InferCtx(env$new_type_env(), unify$empty_subst(), sink, map_new(), Option_none, [], [], 0);
}

function type_error(sink, code, message, span, context, __ring_ev_fail) {
  const diag = diagnostics$make_diag(code, diagnostics$Severity_SevError, message, span, context);
  diagnostics$CollectingSink_report(sink, diag);
  return __ring_ev_fail.raise(new CompileError());
}

function merge_effects(env, a, b, s, __ring_ev_fail) {
  const m = types$row_merge(a, b);
  let result_s = s;
  __ring_match0: {
    const __ring_m0 = m.tails_to_unify;
    if (__ring_m0._tag === "some") {
      const pair = __ring_m0._0;
      const __ring_dt0 = pair;
      const ta = __ring_dt0[0];
      const tb = __ring_dt0[1];
      result_s = unify$unify(types$Type_TypeVar(ta, Option_none), types$Type_TypeVar(tb, Option_none), s, env, __ring_ev_fail);
      break __ring_match0;
    }
    if (__ring_m0._tag === "none") {
      break __ring_match0;
    }
    __match_fail(__ring_m0);
  }
  const out = [m.row, result_s];
  return out;
}

function unify_at(sink, env, t1, t2, s, span, __ring_ev_fail) {
  return (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return unify$unify(t1, t2, s, env, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { const e = __ring_err; return (function() {
  const code = (e.is_occurs_check ? codes$E0302() : codes$E0301());
  return type_error(sink, code, e.message, span, diagnostics$DiagnosticContext_TypeMismatch(types$type_to_string(env$apply_subst(s, t1)), types$type_to_string(env$apply_subst(s, t2)), Option_none), __ring_ev_fail);
})(); } } throw __ring_e; } })();
}

function free_type_vars(t, subst) {
  const resolved = env$apply_subst(subst, t);
  const result = set_new();
  collect_free_vars(resolved, result);
  return result;
}

function collect_free_vars(t, result) {
  __ring_match1: {
    const __ring_m1 = t;
    if (__ring_m1._tag === "IntType") {
      break __ring_match1;
    }
    if (__ring_m1._tag === "FloatType") {
      break __ring_match1;
    }
    if (__ring_m1._tag === "StrType") {
      break __ring_match1;
    }
    if (__ring_m1._tag === "BoolType") {
      break __ring_match1;
    }
    if (__ring_m1._tag === "UnitType") {
      break __ring_match1;
    }
    if (__ring_m1._tag === "NeverType") {
      break __ring_match1;
    }
    if (__ring_m1._tag === "AnyType") {
      break __ring_match1;
    }
    if (__ring_m1._tag === "TypeVar") {
      const id = __ring_m1.id;
      return _Set_insert(result, id);
      break __ring_match1;
    }
    if (__ring_m1._tag === "FnType") {
      const params = __ring_m1.params; const return_type = __ring_m1.return_type; const effects = __ring_m1.effects;
      for (const p of params) {
        collect_free_vars(p, result);
      }
      collect_free_vars(return_type, result);
      __ring_match2: {
        const __ring_m2 = effects.tail;
        if (__ring_m2._tag === "some") {
          const tail_id = __ring_m2._0;
          _Set_insert(result, tail_id);
          break __ring_match2;
        }
        if (__ring_m2._tag === "none") {
          break __ring_match2;
        }
        __match_fail(__ring_m2);
      }
      for (const e of effects.effects) {
        __ring_match3: {
          const __ring_m3 = e;
          if (__ring_m3._tag === "FailEffect") {
            const error_type = __ring_m3.error_type;
            collect_free_vars(error_type, result);
            break __ring_match3;
          }
          if (__ring_m3._tag === "CustomEffect") {
            const type_args = __ring_m3.type_args;
            for (const a of type_args) {
              collect_free_vars(a, result);
            }
            break __ring_match3;
          }
          break __ring_match3;
        }
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "StructType") {
      const type_params = __ring_m1.type_params;
      for (const tp of type_params) {
        collect_free_vars(tp, result);
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "EnumType") {
      const type_params = __ring_m1.type_params;
      for (const tp of type_params) {
        collect_free_vars(tp, result);
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "GenericType") {
      const base = __ring_m1.base; const args = __ring_m1.args;
      collect_free_vars(base, result);
      for (const a of args) {
        collect_free_vars(a, result);
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "RecordType") {
      const fields = __ring_m1.fields; const tail = __ring_m1.tail;
      for (const f of fields) {
        collect_free_vars(f.ty, result);
      }
      __ring_match4: {
        const __ring_m4 = tail;
        if (__ring_m4._tag === "some") {
          const t_id = __ring_m4._0;
          return _Set_insert(result, t_id);
          break __ring_match4;
        }
        if (__ring_m4._tag === "none") {
          break __ring_match4;
        }
        __match_fail(__ring_m4);
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "TupleType") {
      const elements = __ring_m1.elements;
      for (const e of elements) {
        collect_free_vars(e, result);
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "EffectRowType") {
      const effects = __ring_m1.effects; const tail = __ring_m1.tail;
      __ring_match5: {
        const __ring_m5 = tail;
        if (__ring_m5._tag === "some") {
          const t_id = __ring_m5._0;
          _Set_insert(result, t_id);
          break __ring_match5;
        }
        if (__ring_m5._tag === "none") {
          break __ring_match5;
        }
        __match_fail(__ring_m5);
      }
      for (const e of effects) {
        __ring_match6: {
          const __ring_m6 = e;
          if (__ring_m6._tag === "FailEffect") {
            const error_type = __ring_m6.error_type;
            collect_free_vars(error_type, result);
            break __ring_match6;
          }
          if (__ring_m6._tag === "CustomEffect") {
            const type_args = __ring_m6.type_args;
            for (const a of type_args) {
              collect_free_vars(a, result);
            }
            break __ring_match6;
          }
          break __ring_match6;
        }
      }
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
}

function free_type_vars_in_env(env, subst) {
  const result = set_new();
  for (const scope of env.scopes) {
    for (const entry of _Map_entries(scope.variables)) {
      const __ring_dt1 = entry;
      const scheme = __ring_dt1[1];
      const ftv = free_type_vars(scheme.ty, subst);
      const quantified = set_new();
      for (const v of scheme.type_vars) {
        const resolved = env$apply_subst(subst, types$Type_TypeVar(v, Option_none));
        __ring_match7: {
          const __ring_m7 = resolved;
          if (__ring_m7._tag === "TypeVar") {
            const id = __ring_m7.id;
            _Set_insert(quantified, id);
            break __ring_match7;
          }
          _Set_insert(quantified, v);
          break __ring_match7;
        }
      }
      for (const v of ftv) {
        if ((!_Set_contains(quantified, v))) {
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
  for (const v of ftv_type) {
    if ((!_Set_contains(ftv_env, v))) {
      List_push(type_vars, v);
    }
  }
  let bounds = [];
  for (const tv of type_vars) {
    __ring_match8: {
      const __ring_m8 = _Map_get(env.var_bounds, tv);
      if (__ring_m8._tag === "some") {
        const traits = __ring_m8._0;
        for (const trait_name of traits) {
          List_push(bounds, new env$SchemeBound(tv, trait_name));
        }
        break __ring_match8;
      }
      if (__ring_m8._tag === "none") {
        break __ring_match8;
      }
      __match_fail(__ring_m8);
    }
  }
  return new env$TypeScheme(resolved, type_vars, bounds, Option_none);
}

function update_fn_effects(env, name, effects) {
  __ring_match9: {
    const __ring_m9 = env$TypeEnv_lookup(env, name);
    if (__ring_m9._tag === "some") {
      const scheme = __ring_m9._0;
      __ring_match10: {
        const __ring_m10 = scheme.ty;
        if (__ring_m10._tag === "FnType") {
          const params = __ring_m10.params; const return_type = __ring_m10.return_type;
          const new_type = types$Type_FnType(params, return_type, effects);
          return env$TypeEnv_rebind(env, name, new env$TypeScheme(new_type, scheme.type_vars, scheme.bounds, scheme.def_id));
          break __ring_match10;
        }
        break __ring_match10;
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "none") {
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
}

function build_scheme_var_map(scheme, instantiated_type) {
  const result = map_new();
  __ring_match11: {
    const __ring_m11 = [scheme.ty, instantiated_type];
    if (Array.isArray(__ring_m11) && __ring_m11.length === 2 && __ring_m11[0]._tag === "FnType" && __ring_m11[1]._tag === "FnType") {
      const sp = __ring_m11[0].params; const sr = __ring_m11[0].return_type; const ip = __ring_m11[1].params; const ir = __ring_m11[1].return_type;
      let i = 0;
      const limit = ((List_len(sp) < List_len(ip)) ? List_len(sp) : List_len(ip));
      while ((i < limit)) {
        __ring_match12: {
          const __ring_m12 = [List_get(sp, i), List_get(ip, i)];
          if (Array.isArray(__ring_m12) && __ring_m12.length === 2 && __ring_m12[0]._tag === "some" && __ring_m12[1]._tag === "some") {
            const s_param = __ring_m12[0]._0; const i_param = __ring_m12[1]._0;
            collect_var_mappings(s_param, i_param, scheme.type_vars, result);
            break __ring_match12;
          }
          break __ring_match12;
        }
        i = (i + 1);
      }
      collect_var_mappings(sr, ir, scheme.type_vars, result);
      break __ring_match11;
    }
    break __ring_match11;
  }
  return result;
}

function collect_var_mappings(scheme_type, inst_type, type_vars, result) {
  __ring_match13: {
    const __ring_m13 = scheme_type;
    if (__ring_m13._tag === "TypeVar") {
      const id = __ring_m13.id;
      if (List_contains(type_vars, id)) {
        return _Map_insert(result, id, inst_type);
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "StructType") {
      const sn = __ring_m13.name; const stp = __ring_m13.type_params;
      __ring_match14: {
        const __ring_m14 = inst_type;
        if (__ring_m14._tag === "StructType") {
          const in_ = __ring_m14.name; const itp = __ring_m14.type_params;
          if ((sn === in_)) {
            let i = 0;
            const limit = ((List_len(stp) < List_len(itp)) ? List_len(stp) : List_len(itp));
            while ((i < limit)) {
              __ring_match15: {
                const __ring_m15 = [List_get(stp, i), List_get(itp, i)];
                if (Array.isArray(__ring_m15) && __ring_m15.length === 2 && __ring_m15[0]._tag === "some" && __ring_m15[1]._tag === "some") {
                  const s = __ring_m15[0]._0; const inst = __ring_m15[1]._0;
                  collect_var_mappings(s, inst, type_vars, result);
                  break __ring_match15;
                }
                break __ring_match15;
              }
              i = (i + 1);
            }
          }
          break __ring_match14;
        }
        break __ring_match14;
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "EnumType") {
      const sn = __ring_m13.name; const stp = __ring_m13.type_params;
      __ring_match16: {
        const __ring_m16 = inst_type;
        if (__ring_m16._tag === "EnumType") {
          const in_ = __ring_m16.name; const itp = __ring_m16.type_params;
          if ((sn === in_)) {
            let i = 0;
            const limit = ((List_len(stp) < List_len(itp)) ? List_len(stp) : List_len(itp));
            while ((i < limit)) {
              __ring_match17: {
                const __ring_m17 = [List_get(stp, i), List_get(itp, i)];
                if (Array.isArray(__ring_m17) && __ring_m17.length === 2 && __ring_m17[0]._tag === "some" && __ring_m17[1]._tag === "some") {
                  const s = __ring_m17[0]._0; const inst = __ring_m17[1]._0;
                  collect_var_mappings(s, inst, type_vars, result);
                  break __ring_match17;
                }
                break __ring_match17;
              }
              i = (i + 1);
            }
          }
          break __ring_match16;
        }
        break __ring_match16;
      }
      break __ring_match13;
    }
    break __ring_match13;
  }
}

function resolve_dicts_from_scheme(sink, env, current_fn_bounds, scheme, callee_type, s, span, __ring_ev_fail) {
  if ((List_len(scheme.bounds) === 0)) {
    return [];
  }
  const var_map = build_scheme_var_map(scheme, callee_type);
  let resolved_dicts = [];
  for (const bound of scheme.bounds) {
    let found = false;
    __ring_match18: {
      const __ring_m18 = _Map_get(var_map, bound.type_var);
      if (__ring_m18._tag === "some") {
        const fresh_var = __ring_m18._0;
        const concrete = env$apply_subst(s, fresh_var);
        __ring_match19: {
          const __ring_m19 = concrete;
          if (__ring_m19._tag === "StructType") {
            const name = __ring_m19.name;
            if (env.trait_impls.some((function(impl_) { return ((impl_.target_type_name === name) && (impl_.trait_name === bound.trait_name)); }))) {
              List_push(resolved_dicts, hir$trait_dict_name(name, bound.trait_name));
              found = true;
            }
            break __ring_match19;
          }
          if (__ring_m19._tag === "EnumType") {
            const name = __ring_m19.name;
            if (env.trait_impls.some((function(impl_) { return ((impl_.target_type_name === name) && (impl_.trait_name === bound.trait_name)); }))) {
              List_push(resolved_dicts, hir$trait_dict_name(name, bound.trait_name));
              found = true;
            }
            break __ring_match19;
          }
          if (__ring_m19._tag === "TypeVar") {
            const id = __ring_m19.id;
            const matching = ((__a) => { const __i = __a.findIndex((function(fb) { return ((fb.type_param_var_id === id) && (fb.trait_name === bound.trait_name)); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(current_fn_bounds);
            __ring_match20: {
              const __ring_m20 = matching;
              if (__ring_m20._tag === "some") {
                const fb = __ring_m20._0;
                List_push(resolved_dicts, hir$trait_bound_param_name(fb.type_param_name, fb.trait_name));
                found = true;
                break __ring_match20;
              }
              if (__ring_m20._tag === "none") {
                break __ring_match20;
              }
              __match_fail(__ring_m20);
            }
            break __ring_match19;
          }
          break __ring_match19;
        }
        if ((!found)) {
          __ring_match21: {
            const __ring_m21 = types$type_to_builtin_name(concrete);
            if (__ring_m21._tag === "some") {
              const prim_name = __ring_m21._0;
              if (env.trait_impls.some((function(impl_) { return ((impl_.target_type_name === prim_name) && (impl_.trait_name === bound.trait_name)); }))) {
                List_push(resolved_dicts, hir$trait_dict_name(prim_name, bound.trait_name));
                found = true;
              }
              break __ring_match21;
            }
            if (__ring_m21._tag === "none") {
              break __ring_match21;
            }
            __match_fail(__ring_m21);
          }
        }
        break __ring_match18;
      }
      if (__ring_m18._tag === "none") {
        break __ring_match18;
      }
      __match_fail(__ring_m18);
    }
    if ((!found)) {
      type_error(sink, codes$E0503(), `Type does not satisfy trait bound '${bound.trait_name}'`, span, diagnostics$DiagnosticContext_TraitError(`type does not satisfy '${bound.trait_name}'`), __ring_ev_fail);
    }
  }
  return resolved_dicts;
}

function resolve_type_expr(ctx, texpr, __ring_ev_fail) {
  __ring_match22: {
    const __ring_m22 = texpr;
    if (__ring_m22._tag === "Named") {
      const name = __ring_m22.name; const type_args = __ring_m22.type_args; const span = __ring_m22.span;
      return resolve_named_type(ctx, name, type_args, span, __ring_ev_fail);
      break __ring_match22;
    }
    if (__ring_m22._tag === "FnType") {
      const params = __ring_m22.params; const return_type = __ring_m22.return_type;
      let resolved_params = [];
      for (const p of params) {
        List_push(resolved_params, resolve_type_expr(ctx, p, __ring_ev_fail));
      }
      const ret = resolve_type_expr(ctx, return_type, __ring_ev_fail);
      return types$Type_FnType(resolved_params, ret, types$EMPTY_ROW());
      break __ring_match22;
    }
    if (__ring_m22._tag === "OptionType") {
      const inner = __ring_m22.inner;
      return types$make_option_type(resolve_type_expr(ctx, inner, __ring_ev_fail));
      break __ring_match22;
    }
    if (__ring_m22._tag === "RecordType") {
      const fields = __ring_m22.fields; const rest = __ring_m22.rest;
      let resolved_fields = [];
      for (const f of fields) {
        List_push(resolved_fields, new types$RecordField(f.name, resolve_type_expr(ctx, f.ty, __ring_ev_fail)));
      }
      __ring_match23: {
        const __ring_m23 = rest;
        if (__ring_m23._tag === "some") {
          const rest_name = __ring_m23._0;
          const tail_var = env$TypeEnv_fresh_var(ctx.env);
          __ring_match24: {
            const __ring_m24 = tail_var;
            if (__ring_m24._tag === "TypeVar") {
              const id = __ring_m24.id;
              _Map_insert(ctx.type_param_scope, rest_name, tail_var);
              return types$Type_RecordType(resolved_fields, Option_some(id), Option_some(rest_name));
              break __ring_match24;
            }
            return types$Type_RecordType(resolved_fields, Option_none, Option_none);
            break __ring_match24;
          }
          break __ring_match23;
        }
        if (__ring_m23._tag === "none") {
          return types$Type_RecordType(resolved_fields, Option_none, Option_none);
          break __ring_match23;
        }
        __match_fail(__ring_m23);
      }
      break __ring_match22;
    }
    if (__ring_m22._tag === "TupleType") {
      const elements = __ring_m22.elements;
      let resolved_elems = [];
      for (const e of elements) {
        List_push(resolved_elems, resolve_type_expr(ctx, e, __ring_ev_fail));
      }
      return types$Type_TupleType(resolved_elems);
      break __ring_match22;
    }
    __match_fail(__ring_m22);
  }
}

function resolve_self_type(ctx, name, __ring_ev_fail) {
  return resolve_named_type(ctx, name, [], ast$span_zero(), __ring_ev_fail);
}

function resolve_named_type(ctx, name, type_args, span, __ring_ev_fail) {
  if ((name === hir$BUILTIN_INT())) {
    return types$INT();
  }
  if ((name === hir$BUILTIN_FLOAT())) {
    return types$FLOAT();
  }
  if ((name === hir$BUILTIN_STR())) {
    return types$STR();
  }
  if ((name === hir$BUILTIN_BOOL())) {
    return types$BOOL();
  }
  if ((name === "Never")) {
    return types$NEVER();
  }
  if ((name === "Unit")) {
    return types$UNIT();
  }
  __ring_match25: {
    const __ring_m25 = _Map_get(ctx.type_param_scope, name);
    if (__ring_m25._tag === "some") {
      const tp = __ring_m25._0;
      return tp;
      break __ring_match25;
    }
    if (__ring_m25._tag === "none") {
      break __ring_match25;
    }
    __match_fail(__ring_m25);
  }
  if (((name === hir$BUILTIN_OPTION()) && (List_len(type_args) === 1))) {
    __ring_match26: {
      const __ring_m26 = List_get(type_args, 0);
      if (__ring_m26._tag === "some") {
        const arg = __ring_m26._0;
        return types$make_option_type(resolve_type_expr(ctx, arg, __ring_ev_fail));
        break __ring_match26;
      }
      if (__ring_m26._tag === "none") {
        break __ring_match26;
      }
      __match_fail(__ring_m26);
    }
  }
  if (_Map_contains_key(ctx.env.structs, name)) {
    __ring_match27: {
      const __ring_m27 = _Map_get(ctx.env.structs, name);
      if (__ring_m27._tag === "some") {
        const def = __ring_m27._0;
        if (((List_len(type_args) > 0) && (List_len(type_args) !== List_len(def.type_params)))) {
          type_error(ctx.sink, codes$E0301(), `Type '${name}' expects ${Int_to_str(List_len(def.type_params))} type argument(s), got ${Int_to_str(List_len(type_args))}`, span, diagnostics$DiagnosticContext_TypeMismatch(`${Int_to_str(List_len(def.type_params))} type args`, `${Int_to_str(List_len(type_args))} type args`, Option_none), __ring_ev_fail);
        }
        let resolved_params = [];
        if ((List_len(type_args) > 0)) {
          for (const a of type_args) {
            List_push(resolved_params, resolve_type_expr(ctx, a, __ring_ev_fail));
          }
        } else {
          for (const _ of def.type_params) {
            List_push(resolved_params, env$TypeEnv_fresh_var(ctx.env));
          }
        }
        return types$Type_StructType(name, resolved_params, def.fields);
        break __ring_match27;
      }
      if (__ring_m27._tag === "none") {
        break __ring_match27;
      }
      __match_fail(__ring_m27);
    }
  }
  if (_Map_contains_key(ctx.env.enums, name)) {
    __ring_match28: {
      const __ring_m28 = _Map_get(ctx.env.enums, name);
      if (__ring_m28._tag === "some") {
        const def = __ring_m28._0;
        if (((List_len(type_args) > 0) && (List_len(type_args) !== List_len(def.type_params)))) {
          type_error(ctx.sink, codes$E0301(), `Type '${name}' expects ${Int_to_str(List_len(def.type_params))} type argument(s), got ${Int_to_str(List_len(type_args))}`, span, diagnostics$DiagnosticContext_TypeMismatch(`${Int_to_str(List_len(def.type_params))} type args`, `${Int_to_str(List_len(type_args))} type args`, Option_none), __ring_ev_fail);
        }
        let resolved_params = [];
        if ((List_len(type_args) > 0)) {
          for (const a of type_args) {
            List_push(resolved_params, resolve_type_expr(ctx, a, __ring_ev_fail));
          }
        } else {
          for (const _ of def.type_params) {
            List_push(resolved_params, env$TypeEnv_fresh_var(ctx.env));
          }
        }
        return types$Type_EnumType(name, resolved_params, def.variants);
        break __ring_match28;
      }
      if (__ring_m28._tag === "none") {
        break __ring_match28;
      }
      __match_fail(__ring_m28);
    }
  }
  __ring_match29: {
    const __ring_m29 = _Map_get(ctx.env.type_aliases, name);
    if (__ring_m29._tag === "some") {
      const alias = __ring_m29._0;
      if (((List_len(type_args) > 0) && (List_len(type_args) !== List_len(alias.type_params)))) {
        type_error(ctx.sink, codes$E0301(), `Type '${name}' expects ${Int_to_str(List_len(alias.type_params))} type argument(s), got ${Int_to_str(List_len(type_args))}`, span, diagnostics$DiagnosticContext_TypeMismatch(`${Int_to_str(List_len(alias.type_params))} type args`, `${Int_to_str(List_len(type_args))} type args`, Option_none), __ring_ev_fail);
      }
      if ((List_len(alias.type_param_vars) === 0)) {
        return alias.ty;
      }
      let resolved_args = [];
      for (const a of type_args) {
        List_push(resolved_args, resolve_type_expr(ctx, a, __ring_ev_fail));
      }
      const mapping = map_new();
      let i = 0;
      const limit = ((List_len(alias.type_param_vars) < List_len(resolved_args)) ? List_len(alias.type_param_vars) : List_len(resolved_args));
      while ((i < limit)) {
        __ring_match30: {
          const __ring_m30 = [List_get(alias.type_param_vars, i), List_get(resolved_args, i)];
          if (Array.isArray(__ring_m30) && __ring_m30.length === 2 && __ring_m30[0]._tag === "some" && __ring_m30[1]._tag === "some") {
            const var_id = __ring_m30[0]._0; const arg = __ring_m30[1]._0;
            _Map_insert(mapping, var_id, arg);
            break __ring_match30;
          }
          break __ring_match30;
        }
        i = (i + 1);
      }
      return env$apply_subst(mapping, alias.ty);
      break __ring_match29;
    }
    if (__ring_m29._tag === "none") {
      break __ring_match29;
    }
    __match_fail(__ring_m29);
  }
  return type_error(ctx.sink, codes$E0204(), `Unknown type: ${name}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some(`unknown type '${name}'`)), __ring_ev_fail);
}

function bind_pattern(ctx, pattern, expected_type, subst, __ring_ev_fail) {
  __ring_match31: {
    const __ring_m31 = pattern;
    if (__ring_m31._tag === "Wildcard") {
      break __ring_match31;
    }
    if (__ring_m31._tag === "Binding") {
      const name = __ring_m31.name; const span = __ring_m31.span;
      env$TypeEnv_bind_mono(ctx.env, name, env$apply_subst(subst, expected_type));
      __ring_match32: {
        const __ring_m32 = env$TypeEnv_lookup(ctx.env, name);
        if (__ring_m32._tag === "some") {
          const scheme = __ring_m32._0;
          __ring_match33: {
            const __ring_m33 = scheme.def_id;
            if (__ring_m33._tag === "some") {
              const did = __ring_m33._0;
              return env$TypeEnv_record_def_span(ctx.env, did, span);
              break __ring_match33;
            }
            if (__ring_m33._tag === "none") {
              break __ring_match33;
            }
            __match_fail(__ring_m33);
          }
          break __ring_match32;
        }
        if (__ring_m32._tag === "none") {
          break __ring_match32;
        }
        __match_fail(__ring_m32);
      }
      break __ring_match31;
    }
    if (__ring_m31._tag === "Constructor") {
      const name = __ring_m31.name; const qualifier = __ring_m31.qualifier; const fields = __ring_m31.fields; const span = __ring_m31.span;
      return bind_constructor_pattern(ctx, name, qualifier, fields, expected_type, subst, span, __ring_ev_fail);
      break __ring_match31;
    }
    if (__ring_m31._tag === "Literal") {
      break __ring_match31;
    }
    if (__ring_m31._tag === "NamedConstructor") {
      const name = __ring_m31.name; const qualifier = __ring_m31.qualifier; const fields = __ring_m31.fields; const span = __ring_m31.span;
      return bind_named_constructor_pattern(ctx, name, qualifier, fields, expected_type, subst, span, __ring_ev_fail);
      break __ring_match31;
    }
    if (__ring_m31._tag === "TuplePattern") {
      const elements = __ring_m31.elements; const span = __ring_m31.span;
      const resolved = env$apply_subst(subst, expected_type);
      __ring_match34: {
        const __ring_m34 = resolved;
        if (__ring_m34._tag === "TupleType") {
          const type_elems = __ring_m34.elements;
          if ((List_len(elements) !== List_len(type_elems))) {
            type_error(ctx.sink, codes$E0301(), `Tuple pattern has ${Int_to_str(List_len(elements))} elements but type has ${Int_to_str(List_len(type_elems))}`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("tuple arity mismatch")), __ring_ev_fail);
          }
          let i = 0;
          while ((i < List_len(elements))) {
            __ring_match35: {
              const __ring_m35 = [List_get(elements, i), List_get(type_elems, i)];
              if (Array.isArray(__ring_m35) && __ring_m35.length === 2 && __ring_m35[0]._tag === "some" && __ring_m35[1]._tag === "some") {
                const pat = __ring_m35[0]._0; const ty = __ring_m35[1]._0;
                bind_pattern(ctx, pat, ty, subst, __ring_ev_fail);
                break __ring_match35;
              }
              break __ring_match35;
            }
            i = (i + 1);
          }
          break __ring_match34;
        }
        return type_error(ctx.sink, codes$E0301(), `Tuple pattern requires tuple type, got ${types$type_to_string(resolved)}`, span, diagnostics$DiagnosticContext_TypeMismatch("tuple", types$type_to_string(resolved), Option_none), __ring_ev_fail);
        break __ring_match34;
      }
      break __ring_match31;
    }
    __match_fail(__ring_m31);
  }
}

function bind_constructor_pattern(ctx, name, qualifier, fields, expected_type, subst, span, __ring_ev_fail) {
  const enum_name = resolve_pattern_enum(ctx, name, qualifier, span, __ring_ev_fail);
  __ring_match36: {
    const __ring_m36 = enum_name;
    if (__ring_m36._tag === "some") {
      const ename = __ring_m36._0;
      __ring_match37: {
        const __ring_m37 = _Map_get(ctx.env.enums, ename);
        if (__ring_m37._tag === "some") {
          const enum_def = __ring_m37._0;
          const variant = ((__a) => { const __i = __a.findIndex((function(v) { return (v.name === name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(enum_def.variants);
          __ring_match38: {
            const __ring_m38 = variant;
            if (__ring_m38._tag === "some") {
              const v = __ring_m38._0;
              const resolved_expected = env$apply_subst(subst, expected_type);
              __ring_match39: {
                const __ring_m39 = resolved_expected;
                if (__ring_m39._tag === "EnumType") {
                  const rname = __ring_m39.name;
                  if ((rname !== ename)) {
                    type_error(ctx.sink, codes$E0301(), `variant '${name}' belongs to enum '${ename}', not '${rname}'`, span, diagnostics$DiagnosticContext_TypeMismatch(rname, ename, Option_none), __ring_ev_fail);
                  }
                  break __ring_match39;
                }
                if (__ring_m39._tag === "TypeVar") {
                  break __ring_match39;
                }
                type_error(ctx.sink, codes$E0301(), `cannot destructure type '${types$type_to_string(resolved_expected)}' with constructor pattern '${name}'`, span, diagnostics$DiagnosticContext_PatternError("constructor pattern on non-enum type"), __ring_ev_fail);
                break __ring_match39;
              }
              const inst_map = build_instantiation_map(enum_def.type_param_vars, resolved_expected);
              let i = 0;
              while (((i < List_len(fields)) && (i < List_len(v.fields)))) {
                __ring_match40: {
                  const __ring_m40 = [List_get(fields, i), List_get(v.fields, i)];
                  if (Array.isArray(__ring_m40) && __ring_m40.length === 2 && __ring_m40[0]._tag === "some" && __ring_m40[1]._tag === "some") {
                    const fpat = __ring_m40[0]._0; const ftype = __ring_m40[1]._0;
                    const field_type = ((_Map_len(inst_map) > 0) ? env$apply_subst(inst_map, ftype) : ftype);
                    bind_pattern(ctx, fpat, field_type, subst, __ring_ev_fail);
                    break __ring_match40;
                  }
                  break __ring_match40;
                }
                i = (i + 1);
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
    if (__ring_m36._tag === "none") {
      break __ring_match36;
    }
    __match_fail(__ring_m36);
  }
}

function bind_named_constructor_pattern(ctx, name, qualifier, fields, expected_type, subst, span, __ring_ev_fail) {
  const enum_name = resolve_pattern_enum(ctx, name, qualifier, span, __ring_ev_fail);
  __ring_match41: {
    const __ring_m41 = enum_name;
    if (__ring_m41._tag === "some") {
      const ename = __ring_m41._0;
      __ring_match42: {
        const __ring_m42 = _Map_get(ctx.env.enums, ename);
        if (__ring_m42._tag === "some") {
          const enum_def = __ring_m42._0;
          const variant = ((__a) => { const __i = __a.findIndex((function(v) { return (v.name === name); })); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(enum_def.variants);
          __ring_match43: {
            const __ring_m43 = variant;
            if (__ring_m43._tag === "some") {
              const v = __ring_m43._0;
              __ring_match44: {
                const __ring_m44 = v.field_names;
                if (__ring_m44._tag === "some") {
                  const vfield_names = __ring_m44._0;
                  const resolved_expected = env$apply_subst(subst, expected_type);
                  __ring_match45: {
                    const __ring_m45 = resolved_expected;
                    if (__ring_m45._tag === "EnumType") {
                      const rname = __ring_m45.name;
                      if ((rname !== ename)) {
                        type_error(ctx.sink, codes$E0301(), `variant '${name}' belongs to enum '${ename}', not '${rname}'`, span, diagnostics$DiagnosticContext_TypeMismatch(rname, ename, Option_none), __ring_ev_fail);
                      }
                      break __ring_match45;
                    }
                    break __ring_match45;
                  }
                  const inst_map = build_instantiation_map(enum_def.type_param_vars, resolved_expected);
                  for (const field of fields) {
                    const field_idx = List_index_of(vfield_names, field.name);
                    __ring_match46: {
                      const __ring_m46 = field_idx;
                      if (__ring_m46._tag === "some") {
                        const idx = __ring_m46._0;
                        __ring_match47: {
                          const __ring_m47 = List_get(v.fields, idx);
                          if (__ring_m47._tag === "some") {
                            const ftype = __ring_m47._0;
                            const field_type = ((_Map_len(inst_map) > 0) ? env$apply_subst(inst_map, ftype) : ftype);
                            bind_pattern(ctx, field.pattern, field_type, subst, __ring_ev_fail);
                            break __ring_match47;
                          }
                          if (__ring_m47._tag === "none") {
                            break __ring_match47;
                          }
                          __match_fail(__ring_m47);
                        }
                        break __ring_match46;
                      }
                      if (__ring_m46._tag === "none") {
                        type_error(ctx.sink, codes$E0301(), `variant '${name}' has no field '${field.name}'`, field.span, diagnostics$DiagnosticContext_OtherContext(Option_some(`unknown field '${field.name}'`)), __ring_ev_fail);
                        break __ring_match46;
                      }
                      __match_fail(__ring_m46);
                    }
                  }
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
          break __ring_match42;
        }
        if (__ring_m42._tag === "none") {
          break __ring_match42;
        }
        __match_fail(__ring_m42);
      }
      break __ring_match41;
    }
    if (__ring_m41._tag === "none") {
      break __ring_match41;
    }
    __match_fail(__ring_m41);
  }
}

function resolve_pattern_enum(ctx, variant_name, qualifier, span, __ring_ev_fail) {
  __ring_match48: {
    const __ring_m48 = qualifier;
    if (__ring_m48._tag === "some") {
      const q = __ring_m48._0;
      __ring_match49: {
        const __ring_m49 = _Map_get(ctx.env.enums, q);
        if (__ring_m49._tag === "some") {
          const enum_def = __ring_m49._0;
          if (enum_def.variants.some((function(v) { return (v.name === variant_name); }))) {
            return Option_some(q);
          } else {
            return type_error(ctx.sink, codes$E0201(), `'${q}' has no variant '${variant_name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(variant_name, Option_none), __ring_ev_fail);
          }
          break __ring_match49;
        }
        if (__ring_m49._tag === "none") {
          return type_error(ctx.sink, codes$E0201(), `'${q}' has no variant '${variant_name}'`, span, diagnostics$DiagnosticContext_UndefinedVariable(variant_name, Option_none), __ring_ev_fail);
          break __ring_match49;
        }
        __match_fail(__ring_m49);
      }
      break __ring_match48;
    }
    if (__ring_m48._tag === "none") {
      return _Map_get(ctx.env.variant_to_enum, variant_name);
      break __ring_match48;
    }
    __match_fail(__ring_m48);
  }
}

function build_instantiation_map(type_param_vars, resolved_expected) {
  const inst_map = map_new();
  __ring_match50: {
    const __ring_m50 = resolved_expected;
    if (__ring_m50._tag === "EnumType") {
      const type_params = __ring_m50.type_params;
      let i = 0;
      while (((i < List_len(type_param_vars)) && (i < List_len(type_params)))) {
        __ring_match51: {
          const __ring_m51 = [List_get(type_param_vars, i), List_get(type_params, i)];
          if (Array.isArray(__ring_m51) && __ring_m51.length === 2 && __ring_m51[0]._tag === "some" && __ring_m51[1]._tag === "some") {
            const var_id = __ring_m51[0]._0; const tp = __ring_m51[1]._0;
            _Map_insert(inst_map, var_id, tp);
            break __ring_match51;
          }
          break __ring_match51;
        }
        i = (i + 1);
      }
      break __ring_match50;
    }
    break __ring_match50;
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

function remove_specific_fail_effect(row, target, subst) {
  const resolved_target = env$apply_subst(subst, target);
  const filtered = row.effects.filter((function(e) { return (function() {
  const __ring_m = e;
  if (__ring_m._tag === "FailEffect") { const error_type = __ring_m.error_type; return (!types$types_equal(env$apply_subst(subst, error_type), resolved_target)); }
  return true;
})(); }));
  return new types$EffectRow(filtered, row.tail);
}

function __FnBoundsEntry_Eq_eq(self, other) {
  return (self.type_param_var_id === other.type_param_var_id) && (self.trait_name === other.trait_name) && (self.type_param_name === other.type_param_name);
}
const __FnBoundsEntry_Eq = { eq: __FnBoundsEntry_Eq_eq, ne: function(self, other) { return !__FnBoundsEntry_Eq_eq(self, other); } };

function __CompileError_Eq_eq(self, other) {
  return true;
}
const __CompileError_Eq = { eq: __CompileError_Eq_eq, ne: function(self, other) { return !__CompileError_Eq_eq(self, other); } };

function __FnBoundsEntry_Clone_clone(self) {
  return new FnBoundsEntry(self.type_param_var_id, self.trait_name, self.type_param_name);
}
const __FnBoundsEntry_Clone = { clone: __FnBoundsEntry_Clone_clone };

function __CompileError_Clone_clone(self) {
  return new CompileError();
}
const __CompileError_Clone = { clone: __CompileError_Clone_clone };

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

function __FnBoundsEntry_Debug_debug(self) {
  return "FnBoundsEntry { " + "type_param_var_id: " + String(self.type_param_var_id) + ", " + "trait_name: " + String(self.trait_name) + ", " + "type_param_name: " + String(self.type_param_name) + " }";
}
const __FnBoundsEntry_Debug = { debug: __FnBoundsEntry_Debug_debug };

function __CompileError_Debug_debug(self) {
  return "CompileError";
}
const __CompileError_Debug = { debug: __CompileError_Debug_debug };


export { InferResult, FnBoundsEntry, CompileError, InferCtx, new_infer_ctx, type_error, merge_effects, unify_at, free_type_vars, collect_free_vars, free_type_vars_in_env, generalize, update_fn_effects, build_scheme_var_map, resolve_dicts_from_scheme, resolve_type_expr, resolve_self_type, resolve_named_type, bind_pattern, remove_fail_effect, remove_specific_fail_effect, __FnBoundsEntry_Eq, __CompileError_Eq, __FnBoundsEntry_Clone, __CompileError_Clone, __FnBoundsEntry_Ord, __CompileError_Ord, __FnBoundsEntry_Debug, __CompileError_Debug };