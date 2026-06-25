import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { add_impl as env$add_impl, apply_subst as env$apply_subst, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_map as env$apply_subst_map, apply_subst_row as env$apply_subst_row, apply_subst_row_map as env$apply_subst_row_map, find_impl as env$find_impl, has_impl as env$has_impl, lookup_variant as env$lookup_variant, mono as env$mono, new_type_env as env$new_type_env, AssocConstraintEntry as env$AssocConstraintEntry, AssocTypeDef as env$AssocTypeDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectAliasDef as env$EffectAliasDef, EffectDef as env$EffectDef, EffectOpDef as env$EffectOpDef, EnumDef as env$EnumDef, FnBound as env$FnBound, IdGen as env$IdGen, ImplEntry as env$ImplEntry, SchemeBound as env$SchemeBound, Scope as env$Scope, ScopeManager as env$ScopeManager, SigDef as env$SigDef, StructDef as env$StructDef, TraitDef as env$TraitDef, TraitMethodDef as env$TraitMethodDef, TraitRegistry as env$TraitRegistry, TypeAliasDef as env$TypeAliasDef, TypeEnv as env$TypeEnv, TypeRegistry as env$TypeRegistry, TypeScheme as env$TypeScheme, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __BuiltInKind_Debug as env$__BuiltInKind_Debug, __FnBound_Eq as env$__FnBound_Eq, __FnBound_Clone as env$__FnBound_Clone, __FnBound_Ord as env$__FnBound_Ord, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Eq as env$__IdGen_Eq, __IdGen_Clone as env$__IdGen_Clone, __IdGen_Ord as env$__IdGen_Ord, __IdGen_Debug as env$__IdGen_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { make_diag as diagnostics$make_diag, make_diagnostic as diagnostics$make_diagnostic, new_collecting_sink as diagnostics$new_collecting_sink, severity_to_str as diagnostics$severity_to_str, CollectingSink as diagnostics$CollectingSink, Diagnostic as diagnostics$Diagnostic, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, DiagnosticNote as diagnostics$DiagnosticNote, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, Suggestion as diagnostics$Suggestion, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Severity_Eq as diagnostics$__Severity_Eq, __Severity_Clone as diagnostics$__Severity_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __Severity_Debug as diagnostics$__Severity_Debug, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Suggestion_Debug as diagnostics$__Suggestion_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0105 as codes$E0105, E0106 as codes$E0106, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0405 as codes$E0405, E0406 as codes$E0406, E0407 as codes$E0407, E0408 as codes$E0408, E0409 as codes$E0409, E0410 as codes$E0410, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0504 as codes$E0504, E0505 as codes$E0505, E0506 as codes$E0506, E0507 as codes$E0507, E0508 as codes$E0508, E0509 as codes$E0509, E0510 as codes$E0510, E0511 as codes$E0511, E0512 as codes$E0512, E0513 as codes$E0513, E0514 as codes$E0514, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, E0707 as codes$E0707, W0001 as codes$W0001, W0002 as codes$W0002, error_category as codes$error_category, error_description as codes$error_description } from "./codes.js";
import { bind_pattern as infer_ctx$bind_pattern, build_scheme_var_map as infer_ctx$build_scheme_var_map, collect_free_vars as infer_ctx$collect_free_vars, free_type_vars as infer_ctx$free_type_vars, free_type_vars_in_env as infer_ctx$free_type_vars_in_env, generalize as infer_ctx$generalize, merge_effects as infer_ctx$merge_effects, new_infer_ctx as infer_ctx$new_infer_ctx, remove_fail_effect as infer_ctx$remove_fail_effect, resolve_dicts_from_scheme as infer_ctx$resolve_dicts_from_scheme, resolve_named_type as infer_ctx$resolve_named_type, resolve_relative_qualifier as infer_ctx$resolve_relative_qualifier, resolve_self_type as infer_ctx$resolve_self_type, resolve_type_expr as infer_ctx$resolve_type_expr, type_error as infer_ctx$type_error, type_error_with_notes as infer_ctx$type_error_with_notes, unify_at as infer_ctx$unify_at, unify_at_noted as infer_ctx$unify_at_noted, update_fn_effects as infer_ctx$update_fn_effects, CompileError as infer_ctx$CompileError, FnBoundsEntry as infer_ctx$FnBoundsEntry, InferCtx as infer_ctx$InferCtx, InferResult as infer_ctx$InferResult, __CompileError_Eq as infer_ctx$__CompileError_Eq, __CompileError_Clone as infer_ctx$__CompileError_Clone, __CompileError_Ord as infer_ctx$__CompileError_Ord, __CompileError_Debug as infer_ctx$__CompileError_Debug, __FnBoundsEntry_Eq as infer_ctx$__FnBoundsEntry_Eq, __FnBoundsEntry_Clone as infer_ctx$__FnBoundsEntry_Clone, __FnBoundsEntry_Ord as infer_ctx$__FnBoundsEntry_Ord, __FnBoundsEntry_Debug as infer_ctx$__FnBoundsEntry_Debug } from "./infer_ctx.js";



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

function bind_variant_constructor(ctx, variant_name, enum_type, tv_ids) {
  if ((List_len(tv_ids) > 0)) {
    return env$TypeEnv_bind(ctx.env, variant_name, new env$TypeScheme(enum_type, tv_ids, [], Option_none));
  } else {
    return env$TypeEnv_bind_mono(ctx.env, variant_name, enum_type);
  }
}

function check_duplicate_def(ctx, name, span) {
  __ring_match6: {
    const __ring_m6 = env$TypeEnv_lookup(ctx.env, name);
    if (__ring_m6._tag === "some") {
      const existing = __ring_m6._0;
      __ring_match7: {
        const __ring_m7 = existing.def_id;
        if (__ring_m7._tag === "some") {
          const did = __ring_m7._0;
          __ring_match8: {
            const __ring_m8 = _Map_get(ctx.env.scope.def_spans, did);
            if (__ring_m8._tag === "some") {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0207, `Duplicate definition: '${name}' is already defined`, span, diagnostics$DiagnosticContext_TypeMismatch("unique name", name, Option_none));
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
    if (__ring_m6._tag === "none") {
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function collect_all_supertraits(ctx, trait_name) {
  let result = [];
  let visited = set_new();
  let stack = [];
  __ring_match9: {
    const __ring_m9 = _Map_get(ctx.env.trait_reg.traits, trait_name);
    if (__ring_m9._tag === "some") {
      const tdef = __ring_m9._0;
      const __ring_iter_2 = __List_Iterable.iter(tdef.supertraits);
      while (true) {
        const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
        if (__ring_next_2._tag === "none") break;
        const st = __ring_next_2._0;
        List_push(stack, st);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "none") {
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
  while ((List_len(stack) > 0)) {
    const current = Option_unwrap(List_pop(stack));
    if (_Set_contains(visited, current, __Str_Eq)) {
      continue;
    }
    _Set_insert(visited, current);
    List_push(result, current);
    __ring_match10: {
      const __ring_m10 = _Map_get(ctx.env.trait_reg.traits, current);
      if (__ring_m10._tag === "some") {
        const parent_def = __ring_m10._0;
        const __ring_iter_3 = __List_Iterable.iter(parent_def.supertraits);
        while (true) {
          const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
          if (__ring_next_3._tag === "none") break;
          const parent_st = __ring_next_3._0;
          List_push(stack, parent_st);
        }
        break __ring_match10;
      }
      if (__ring_m10._tag === "none") {
        break __ring_match10;
      }
      __match_fail(__ring_m10);
    }
  }
  return result;
}

function complete_enum_variants(ctx, name, type_params, variants) {
  __ring_match11: {
    const __ring_m11 = _Map_get(ctx.env.types.enums, name);
    if (__ring_m11._tag === "some") {
      const def = __ring_m11._0;
      const saved = map_clone(ctx.type_param_scope);
      let tv_types = [];
      let i = 0;
      while ((i < List_len(def.type_params))) {
        __ring_match12: {
          const __ring_m12 = [List_get(def.type_params, i), List_get(def.type_param_vars, i)];
          if (Array.isArray(__ring_m12) && __ring_m12.length === 2 && __ring_m12[0]._tag === "some" && __ring_m12[1]._tag === "some") {
            const tp_name = __ring_m12[0]._0; const tp_var = __ring_m12[1]._0;
            const tv = types$Type_TypeVar(tp_var, Option_none);
            _Map_insert(ctx.type_param_scope, tp_name, tv);
            List_push(tv_types, tv);
            break __ring_match12;
          }
          break __ring_match12;
        }
        i = (i + 1);
      }
      let vi = 0;
      const __ring_iter_4 = __List_Iterable.iter(variants);
      while (true) {
        const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
        if (__ring_next_4._tag === "none") break;
        const v = __ring_next_4._0;
        __ring_match13: {
          const __ring_m13 = v.named_fields;
          if (__ring_m13._tag === "some") {
            const nf = __ring_m13._0;
            if ((List_len(nf) > 0)) {
              let field_types = [];
              let field_names = [];
              const __ring_iter_5 = __List_Iterable.iter(nf);
              while (true) {
                const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
                if (__ring_next_5._tag === "none") break;
                const f = __ring_next_5._0;
                List_push(field_types, infer_ctx$resolve_type_expr(ctx, f.type_expr));
                List_push(field_names, f.name);
              }
              List_push(def.variants, new types$EnumVariant(v.name, field_types, Option_some(field_names)));
            } else {
              let field_types = [];
              const __ring_iter_6 = __List_Iterable.iter(v.fields);
              while (true) {
                const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
                if (__ring_next_6._tag === "none") break;
                const f = __ring_next_6._0;
                List_push(field_types, infer_ctx$resolve_type_expr(ctx, f));
              }
              List_push(def.variants, new types$EnumVariant(v.name, field_types, Option_none));
            }
            break __ring_match13;
          }
          if (__ring_m13._tag === "none") {
            let field_types = [];
            const __ring_iter_7 = __List_Iterable.iter(v.fields);
            while (true) {
              const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
              if (__ring_next_7._tag === "none") break;
              const f = __ring_next_7._0;
              List_push(field_types, infer_ctx$resolve_type_expr(ctx, f));
            }
            List_push(def.variants, new types$EnumVariant(v.name, field_types, Option_none));
            break __ring_match13;
          }
          __match_fail(__ring_m13);
        }
        _Map_insert(def.variant_index, v.name, vi);
        vi = (vi + 1);
      }
      const enum_type = types$Type_EnumType(name, tv_types);
      const tv_ids = def.type_param_vars;
      const __ring_iter_8 = __List_Iterable.iter(def.variants);
      while (true) {
        const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
        if (__ring_next_8._tag === "none") break;
        const variant = __ring_next_8._0;
        _Map_insert(ctx.env.types.variant_to_enum, variant.name, name);
        if (Option_is_some(variant.field_names)) {
          bind_variant_constructor(ctx, variant.name, enum_type, tv_ids);
        } else {
          if ((List_len(variant.fields) === 0)) {
            bind_variant_constructor(ctx, variant.name, enum_type, tv_ids);
          } else {
            const fn_type = types$Type_FnType(variant.fields, enum_type, types$EMPTY_ROW);
            if ((List_len(tv_ids) > 0)) {
              env$TypeEnv_bind(ctx.env, variant.name, new env$TypeScheme(fn_type, tv_ids, [], Option_none));
            } else {
              env$TypeEnv_bind_mono(ctx.env, variant.name, fn_type);
            }
          }
        }
      }
      ctx.type_param_scope = saved;
      break __ring_match11;
    }
    if (__ring_m11._tag === "none") {
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
}

function complete_struct_fields(ctx, name, fields) {
  __ring_match14: {
    const __ring_m14 = _Map_get(ctx.env.types.structs, name);
    if (__ring_m14._tag === "some") {
      const def = __ring_m14._0;
      const saved = map_clone(ctx.type_param_scope);
      let i = 0;
      while ((i < List_len(def.type_params))) {
        __ring_match15: {
          const __ring_m15 = [List_get(def.type_params, i), List_get(def.type_param_vars, i)];
          if (Array.isArray(__ring_m15) && __ring_m15.length === 2 && __ring_m15[0]._tag === "some" && __ring_m15[1]._tag === "some") {
            const tp_name = __ring_m15[0]._0; const tp_var = __ring_m15[1]._0;
            _Map_insert(ctx.type_param_scope, tp_name, types$Type_TypeVar(tp_var, Option_none));
            break __ring_match15;
          }
          break __ring_match15;
        }
        i = (i + 1);
      }
      const __ring_iter_9 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
        if (__ring_next_9._tag === "none") break;
        const f = __ring_next_9._0;
        List_push(def.fields, new types$StructField(f.name, infer_ctx$resolve_type_expr(ctx, f.type_annotation), f.is_pub));
      }
      ctx.type_param_scope = saved;
      break __ring_match14;
    }
    if (__ring_m14._tag === "none") {
      break __ring_match14;
    }
    __match_fail(__ring_m14);
  }
}

function resolve_effect_expr(ctx, eff) {
  if ((eff.name === "io")) {
    return types$Effect_IoEffect;
  }
  if ((eff.name === "mut")) {
    let __ring_blk0;
    __ring_match16: {
      const __ring_m16 = List_first(eff.type_args);
      if (__ring_m16._tag === "some") {
        const t = __ring_m16._0;
        __ring_blk0 = infer_ctx$resolve_type_expr(ctx, t);
        break __ring_match16;
      }
      if (__ring_m16._tag === "none") {
        __ring_blk0 = env$TypeEnv_fresh_var(ctx.env);
        break __ring_match16;
      }
      __match_fail(__ring_m16);
    }
    const mut_state = ((List_len(eff.type_args) > 0) ? __ring_blk0 : env$TypeEnv_fresh_var(ctx.env));
    return types$Effect_MutEffect(mut_state);
  }
  if ((eff.name === "fail")) {
    let __ring_blk1;
    __ring_match17: {
      const __ring_m17 = List_first(eff.type_args);
      if (__ring_m17._tag === "some") {
        const t = __ring_m17._0;
        __ring_blk1 = infer_ctx$resolve_type_expr(ctx, t);
        break __ring_match17;
      }
      if (__ring_m17._tag === "none") {
        __ring_blk1 = env$TypeEnv_fresh_var(ctx.env);
        break __ring_match17;
      }
      __match_fail(__ring_m17);
    }
    const err_type = ((List_len(eff.type_args) > 0) ? __ring_blk1 : env$TypeEnv_fresh_var(ctx.env));
    return types$Effect_FailEffect(err_type);
  }
  let __ring_blk2;
  __ring_match18: {
    const __ring_m18 = _Map_get(ctx.env.types.effects, eff.name);
    if (__ring_m18._tag === "some") {
      const edef = __ring_m18._0;
      __ring_blk2 = edef.name;
      break __ring_match18;
    }
    if (__ring_m18._tag === "none") {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0407, `Unknown effect '${eff.name}'`, eff.span, diagnostics$DiagnosticContext_OtherContext(Option_some("unknown effect")));
      __ring_blk2 = eff.name;
      break __ring_match18;
    }
    __match_fail(__ring_m18);
  }
  const canonical_name = __ring_blk2;
  let resolved_args = [];
  const __ring_iter_10 = __List_Iterable.iter(eff.type_args);
  while (true) {
    const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
    if (__ring_next_10._tag === "none") break;
    const ta = __ring_next_10._0;
    List_push(resolved_args, infer_ctx$resolve_type_expr(ctx, ta));
  }
  return types$Effect_CustomEffect(canonical_name, resolved_args);
}

function expand_effect_exprs(ctx, decl_effects, expanding) {
  let effects = [];
  const __ring_iter_11 = __List_Iterable.iter(decl_effects);
  while (true) {
    const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
    if (__ring_next_11._tag === "none") break;
    const eff = __ring_next_11._0;
    __ring_match19: {
      const __ring_m19 = _Map_get(ctx.env.types.effect_aliases, eff.name);
      if (__ring_m19._tag === "some") {
        const alias_def = __ring_m19._0;
        if (_Set_contains(expanding, eff.name, __Str_Eq)) {
          const _ = infer_ctx$type_error(ctx.sink, codes$E0406, `Cyclic effect alias: '${eff.name}' references itself`, eff.span, diagnostics$DiagnosticContext_OtherContext(Option_some("cyclic effect alias")));
        } else {
          _Set_insert(expanding, eff.name);
          let saved_scope = [];
          let vi = 0;
          const __ring_iter_12 = __List_Iterable.iter(alias_def.type_params);
          while (true) {
            const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
            if (__ring_next_12._tag === "none") break;
            const tp_name = __ring_next_12._0;
            List_push(saved_scope, [tp_name, _Map_get(ctx.type_param_scope, tp_name)]);
            __ring_match20: {
              const __ring_m20 = List_get(alias_def.type_param_vars, vi);
              if (__ring_m20._tag === "some") {
                const var_id = __ring_m20._0;
                _Map_insert(ctx.type_param_scope, tp_name, types$Type_TypeVar(var_id, Option_none));
                break __ring_match20;
              }
              if (__ring_m20._tag === "none") {
                break __ring_match20;
              }
              __match_fail(__ring_m20);
            }
            vi = (vi + 1);
          }
          const expanded = expand_effect_exprs(ctx, alias_def.effects, expanding);
          const __ring_iter_13 = __List_Iterable.iter(saved_scope);
          while (true) {
            const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
            if (__ring_next_13._tag === "none") break;
            const entry = __ring_next_13._0;
            __ring_match21: {
              const __ring_m21 = entry;
              if (Array.isArray(__ring_m21) && __ring_m21.length === 2 && __ring_m21[1]._tag === "some") {
                const name = __ring_m21[0]; const prev_type = __ring_m21[1]._0;
                _Map_insert(ctx.type_param_scope, name, prev_type);
                break __ring_match21;
              }
              if (Array.isArray(__ring_m21) && __ring_m21.length === 2 && __ring_m21[1]._tag === "none") {
                const name = __ring_m21[0];
                _Map_remove(ctx.type_param_scope, name);
                break __ring_match21;
              }
              __match_fail(__ring_m21);
            }
          }
          let subst_map = map_new();
          let si = 0;
          while (((si < List_len(alias_def.type_param_vars)) ? (si < List_len(eff.type_args)) : false)) {
            __ring_match22: {
              const __ring_m22 = [List_get(alias_def.type_param_vars, si), List_get(eff.type_args, si)];
              if (Array.isArray(__ring_m22) && __ring_m22.length === 2 && __ring_m22[0]._tag === "some" && __ring_m22[1]._tag === "some") {
                const var_id = __ring_m22[0]._0; const ta = __ring_m22[1]._0;
                _Map_insert(subst_map, var_id, infer_ctx$resolve_type_expr(ctx, ta));
                break __ring_match22;
              }
              break __ring_match22;
            }
            si = (si + 1);
          }
          const __ring_iter_14 = __List_Iterable.iter(expanded);
          while (true) {
            const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
            if (__ring_next_14._tag === "none") break;
            const e = __ring_next_14._0;
            List_push(effects, env$apply_subst_effect_map(subst_map, e));
          }
          _Set_remove(expanding, eff.name);
        }
        break __ring_match19;
      }
      if (__ring_m19._tag === "none") {
        List_push(effects, resolve_effect_expr(ctx, eff));
        break __ring_match19;
      }
      __match_fail(__ring_m19);
    }
  }
  return effects;
}

function inject_assoc_types_from_bounds(ctx, type_params) {
  const __ring_iter_15 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
    if (__ring_next_15._tag === "none") break;
    const tp = __ring_next_15._0;
    const __ring_iter_16 = __List_Iterable.iter(tp.bounds);
    while (true) {
      const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
      if (__ring_next_16._tag === "none") break;
      const b = __ring_next_16._0;
      const __ring_iter_17 = __List_Iterable.iter(b.assoc_constraints);
      while (true) {
        const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
        if (__ring_next_17._tag === "none") break;
        const ac = __ring_next_17._0;
        const concrete_ty = infer_ctx$resolve_type_expr(ctx, ac.ty);
        _Map_insert(ctx.type_param_scope, ac.name, concrete_ty);
        _Map_insert(ctx.qualified_assoc_scope, `${tp.name}::${ac.name}`, concrete_ty);
      }
      __ring_match23: {
        const __ring_m23 = _Map_get(ctx.env.trait_reg.traits, b.trait_name);
        if (__ring_m23._tag === "some") {
          const tdef = __ring_m23._0;
          const __ring_iter_18 = __List_Iterable.iter(tdef.assoc_types);
          while (true) {
            const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
            if (__ring_next_18._tag === "none") break;
            const atdef = __ring_next_18._0;
            if ((!_Map_contains_key(ctx.type_param_scope, atdef.name))) {
              const at_var = env$TypeEnv_fresh_var(ctx.env);
              _Map_insert(ctx.type_param_scope, atdef.name, at_var);
              _Map_insert(ctx.qualified_assoc_scope, `${tp.name}::${atdef.name}`, at_var);
            } else {
              const at_var = env$TypeEnv_fresh_var(ctx.env);
              _Map_insert(ctx.qualified_assoc_scope, `${tp.name}::${atdef.name}`, at_var);
            }
          }
          break __ring_match23;
        }
        if (__ring_m23._tag === "none") {
          break __ring_match23;
        }
        __match_fail(__ring_m23);
      }
    }
  }
}

function insert_mod_aliases(ctx, mod_name, decls, guard) {
  const __ring_iter_19 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
    if (__ring_next_19._tag === "none") break;
    const d = __ring_next_19._0;
    __ring_match24: {
      const __ring_m24 = d;
      if (__ring_m24._tag === "Struct") {
        const name = __ring_m24.name;
        const qualified = `${mod_name}::${name}`;
        if (((!guard) ? true : (!_Map_contains_key(ctx.env.types.structs, name)))) {
          __ring_match25: {
            const __ring_m25 = _Map_get(ctx.env.types.structs, qualified);
            if (__ring_m25._tag === "some") {
              const sdef = __ring_m25._0;
              _Map_insert(ctx.env.types.structs, name, sdef);
              break __ring_match25;
            }
            if (__ring_m25._tag === "none") {
              break __ring_match25;
            }
            __match_fail(__ring_m25);
          }
        }
        break __ring_match24;
      }
      if (__ring_m24._tag === "Enum") {
        const name = __ring_m24.name;
        const qualified = `${mod_name}::${name}`;
        if (((!guard) ? true : (!_Map_contains_key(ctx.env.types.enums, name)))) {
          __ring_match26: {
            const __ring_m26 = _Map_get(ctx.env.types.enums, qualified);
            if (__ring_m26._tag === "some") {
              const edef = __ring_m26._0;
              _Map_insert(ctx.env.types.enums, name, edef);
              break __ring_match26;
            }
            if (__ring_m26._tag === "none") {
              break __ring_match26;
            }
            __match_fail(__ring_m26);
          }
        }
        break __ring_match24;
      }
      if (__ring_m24._tag === "Trait") {
        const name = __ring_m24.name;
        const qualified = `${mod_name}::${name}`;
        if (((!guard) ? true : (!_Map_contains_key(ctx.env.trait_reg.traits, name)))) {
          __ring_match27: {
            const __ring_m27 = _Map_get(ctx.env.trait_reg.traits, qualified);
            if (__ring_m27._tag === "some") {
              const tdef = __ring_m27._0;
              _Map_insert(ctx.env.trait_reg.traits, name, tdef);
              break __ring_match27;
            }
            if (__ring_m27._tag === "none") {
              break __ring_match27;
            }
            __match_fail(__ring_m27);
          }
        }
        break __ring_match24;
      }
      if (__ring_m24._tag === "Effect") {
        const name = __ring_m24.name;
        const qualified = `${mod_name}::${name}`;
        if (((!guard) ? true : (!_Map_contains_key(ctx.env.types.effects, name)))) {
          __ring_match28: {
            const __ring_m28 = _Map_get(ctx.env.types.effects, qualified);
            if (__ring_m28._tag === "some") {
              const edef = __ring_m28._0;
              _Map_insert(ctx.env.types.effects, name, edef);
              break __ring_match28;
            }
            if (__ring_m28._tag === "none") {
              break __ring_match28;
            }
            __match_fail(__ring_m28);
          }
        }
        break __ring_match24;
      }
      if (__ring_m24._tag === "EffectAlias") {
        const name = __ring_m24.name;
        const qualified = `${mod_name}::${name}`;
        if (((!guard) ? true : (!_Map_contains_key(ctx.env.types.effect_aliases, name)))) {
          __ring_match29: {
            const __ring_m29 = _Map_get(ctx.env.types.effect_aliases, qualified);
            if (__ring_m29._tag === "some") {
              const adef = __ring_m29._0;
              _Map_insert(ctx.env.types.effect_aliases, name, adef);
              break __ring_match29;
            }
            if (__ring_m29._tag === "none") {
              break __ring_match29;
            }
            __match_fail(__ring_m29);
          }
        }
        break __ring_match24;
      }
      break __ring_match24;
    }
  }
}

function is_register_value_type(t) {
  __ring_match30: {
    const __ring_m30 = t;
    if (__ring_m30._tag === "IntType") {
      return true;
      break __ring_match30;
    }
    if (__ring_m30._tag === "FloatType") {
      return true;
      break __ring_match30;
    }
    if (__ring_m30._tag === "BoolType") {
      return true;
      break __ring_match30;
    }
    if (__ring_m30._tag === "StrType") {
      return true;
      break __ring_match30;
    }
    return false;
    break __ring_match30;
  }
}

function prefix_decl_name(mod_name, decl) {
  __ring_match31: {
    const __ring_m31 = decl;
    if (__ring_m31._tag === "Fn") {
      const name = __ring_m31.name; const type_params = __ring_m31.type_params; const params = __ring_m31.params; const return_type = __ring_m31.return_type; const declared_effects = __ring_m31.declared_effects; const body = __ring_m31.body; const is_pub = __ring_m31.is_pub; const is_abstract = __ring_m31.is_abstract; const span = __ring_m31.span;
      return ast$Decl_Fn(`${mod_name}::${name}`, type_params, params, return_type, declared_effects, body, is_pub, is_abstract, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "Struct") {
      const name = __ring_m31.name; const type_params = __ring_m31.type_params; const fields = __ring_m31.fields; const is_pub = __ring_m31.is_pub; const span = __ring_m31.span;
      return ast$Decl_Struct(`${mod_name}::${name}`, type_params, fields, is_pub, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "Enum") {
      const name = __ring_m31.name; const type_params = __ring_m31.type_params; const variants = __ring_m31.variants; const is_pub = __ring_m31.is_pub; const span = __ring_m31.span;
      return ast$Decl_Enum(`${mod_name}::${name}`, type_params, variants, is_pub, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "ExternFn") {
      const name = __ring_m31.name; const type_params = __ring_m31.type_params; const params = __ring_m31.params; const return_type = __ring_m31.return_type; const declared_effects = __ring_m31.declared_effects; const is_pub = __ring_m31.is_pub; const span = __ring_m31.span;
      return ast$Decl_ExternFn(`${mod_name}::${name}`, type_params, params, return_type, declared_effects, is_pub, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "Const") {
      const name = __ring_m31.name; const type_annotation = __ring_m31.type_annotation; const init = __ring_m31.init; const is_pub = __ring_m31.is_pub; const span = __ring_m31.span;
      return ast$Decl_Const(`${mod_name}::${name}`, type_annotation, init, is_pub, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "Sig") {
      const name = __ring_m31.name; const members = __ring_m31.members; const is_pub = __ring_m31.is_pub; const span = __ring_m31.span;
      return ast$Decl_Sig(`${mod_name}::${name}`, members, is_pub, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "Impl") {
      const target_type = __ring_m31.target_type; const type_params = __ring_m31.type_params; const trait_name = __ring_m31.trait_name; const methods = __ring_m31.methods; const span = __ring_m31.span;
      const prefixed_target = (Str_contains(target_type, "::") ? target_type : `${mod_name}::${target_type}`);
      return ast$Decl_Impl(prefixed_target, type_params, trait_name, methods, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "Trait") {
      const name = __ring_m31.name; const type_params = __ring_m31.type_params; const supertraits = __ring_m31.supertraits; const methods = __ring_m31.methods; const is_pub = __ring_m31.is_pub; const span = __ring_m31.span;
      return ast$Decl_Trait(`${mod_name}::${name}`, type_params, supertraits, methods, is_pub, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "Effect") {
      const name = __ring_m31.name; const type_params = __ring_m31.type_params; const ops = __ring_m31.ops; const is_pub = __ring_m31.is_pub; const span = __ring_m31.span;
      return ast$Decl_Effect(`${mod_name}::${name}`, type_params, ops, is_pub, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "ExternType") {
      const name = __ring_m31.name; const type_params = __ring_m31.type_params; const is_pub = __ring_m31.is_pub; const span = __ring_m31.span;
      return ast$Decl_ExternType(`${mod_name}::${name}`, type_params, is_pub, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "TypeAlias") {
      const name = __ring_m31.name; const type_params = __ring_m31.type_params; const type_expr = __ring_m31.type_expr; const is_pub = __ring_m31.is_pub; const span = __ring_m31.span;
      return ast$Decl_TypeAlias(`${mod_name}::${name}`, type_params, type_expr, is_pub, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "EffectAlias") {
      const name = __ring_m31.name; const type_params = __ring_m31.type_params; const effects = __ring_m31.effects; const is_pub = __ring_m31.is_pub; const span = __ring_m31.span;
      return ast$Decl_EffectAlias(`${mod_name}::${name}`, type_params, effects, is_pub, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "ModBlock") {
      const name = __ring_m31.name; const uses = __ring_m31.uses; const decls = __ring_m31.decls; const required_effects = __ring_m31.required_effects; const is_pub = __ring_m31.is_pub; const span = __ring_m31.span;
      return ast$Decl_ModBlock(`${mod_name}::${name}`, uses, decls, required_effects, is_pub, span);
      break __ring_match31;
    }
    if (__ring_m31._tag === "AssocType") {
      return decl;
      break __ring_match31;
    }
    return decl;
    break __ring_match31;
  }
}

function preregister_enum(ctx, name, type_params) {
  let tp_names = [];
  let tv_ids = [];
  const __ring_iter_20 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
    if (__ring_next_20._tag === "none") break;
    const tp = __ring_next_20._0;
    List_push(tp_names, tp.name);
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match32: {
      const __ring_m32 = tv;
      if (__ring_m32._tag === "TypeVar") {
        const id = __ring_m32.id;
        List_push(tv_ids, id);
        break __ring_match32;
      }
      break __ring_match32;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  const def = new env$EnumDef(name, tp_names, tv_ids, [], map_new());
  return _Map_insert(ctx.env.types.enums, name, def);
}

function preregister_struct(ctx, name, type_params) {
  let tp_names = [];
  let tp_vars = [];
  const __ring_iter_21 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
    if (__ring_next_21._tag === "none") break;
    const tp = __ring_next_21._0;
    List_push(tp_names, tp.name);
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match33: {
      const __ring_m33 = tv;
      if (__ring_m33._tag === "TypeVar") {
        const id = __ring_m33.id;
        List_push(tp_vars, id);
        break __ring_match33;
      }
      break __ring_match33;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  const def = new env$StructDef(name, tp_names, tp_vars, [], false);
  return _Map_insert(ctx.env.types.structs, name, def);
}

function register_const(ctx, name, type_annotation, span) {
  check_duplicate_def(ctx, name, span);
  __ring_match34: {
    const __ring_m34 = type_annotation;
    if (__ring_m34._tag === "some") {
      const texpr = __ring_m34._0;
      const ty = infer_ctx$resolve_type_expr(ctx, texpr);
      env$TypeEnv_bind_mono(ctx.env, name, ty);
      break __ring_match34;
    }
    if (__ring_m34._tag === "none") {
      const tv = env$TypeEnv_fresh_var(ctx.env);
      env$TypeEnv_bind_mono(ctx.env, name, tv);
      break __ring_match34;
    }
    __match_fail(__ring_m34);
  }
  __ring_match35: {
    const __ring_m35 = env$TypeEnv_lookup(ctx.env, name);
    if (__ring_m35._tag === "some") {
      const s = __ring_m35._0;
      __ring_match36: {
        const __ring_m36 = s.def_id;
        if (__ring_m36._tag === "some") {
          const did = __ring_m36._0;
          return env$TypeEnv_record_def_span(ctx.env, did, span);
          break __ring_match36;
        }
        if (__ring_m36._tag === "none") {
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
}

function register_effect(ctx, name, type_params, ops) {
  const saved = map_clone(ctx.type_param_scope);
  let tp_names = [];
  let tp_vars = [];
  const __ring_iter_22 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
    if (__ring_next_22._tag === "none") break;
    const tp = __ring_next_22._0;
    List_push(tp_names, tp.name);
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match37: {
      const __ring_m37 = tv;
      if (__ring_m37._tag === "TypeVar") {
        const id = __ring_m37.id;
        List_push(tp_vars, id);
        break __ring_match37;
      }
      break __ring_match37;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  let effect_ops = [];
  const __ring_iter_23 = __List_Iterable.iter(ops);
  while (true) {
    const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
    if (__ring_next_23._tag === "none") break;
    const op = __ring_next_23._0;
    let param_types = [];
    const __ring_iter_24 = __List_Iterable.iter(op.params);
    while (true) {
      const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
      if (__ring_next_24._tag === "none") break;
      const p = __ring_next_24._0;
      __ring_match38: {
        const __ring_m38 = p.type_annotation;
        if (__ring_m38._tag === "some") {
          const ta = __ring_m38._0;
          List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
          break __ring_match38;
        }
        if (__ring_m38._tag === "none") {
          List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
          break __ring_match38;
        }
        __match_fail(__ring_m38);
      }
    }
    const ret = infer_ctx$resolve_type_expr(ctx, op.return_type);
    const op_has_default = Option_is_some(op.body);
    List_push(effect_ops, new env$EffectOpDef(op.name, param_types, ret, op_has_default));
  }
  let all_defaults = true;
  const __ring_iter_25 = __List_Iterable.iter(effect_ops);
  while (true) {
    const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
    if (__ring_next_25._tag === "none") break;
    const eop = __ring_next_25._0;
    if ((!eop.has_default)) {
      all_defaults = false;
    }
  }
  if ((List_len(effect_ops) === 0)) {
    all_defaults = false;
  }
  ctx.type_param_scope = saved;
  return _Map_insert(ctx.env.types.effects, name, new env$EffectDef(name, tp_names, tp_vars, effect_ops, Option_none, all_defaults));
}

function register_effect_alias(ctx, name, type_params, effects, span) {
  if (_Map_contains_key(ctx.env.types.effect_aliases, name)) {
    const _ = infer_ctx$type_error(ctx.sink, codes$E0207, `Duplicate definition: effect alias '${name}' is already defined`, span, diagnostics$DiagnosticContext_OtherContext(Option_some("duplicate effect alias")));
  } else {
    let tp_names = [];
    let tp_vars = [];
    const __ring_iter_26 = __List_Iterable.iter(type_params);
    while (true) {
      const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
      if (__ring_next_26._tag === "none") break;
      const tp = __ring_next_26._0;
      List_push(tp_names, tp.name);
      const tv = env$TypeEnv_fresh_var(ctx.env);
      __ring_match39: {
        const __ring_m39 = tv;
        if (__ring_m39._tag === "TypeVar") {
          const id = __ring_m39.id;
          List_push(tp_vars, id);
          break __ring_match39;
        }
        break __ring_match39;
      }
    }
    return _Map_insert(ctx.env.types.effect_aliases, name, new env$EffectAliasDef(name, tp_names, tp_vars, effects, span));
  }
}

function resolve_declared_effects(ctx, decl_effects) {
  let expanding = set_new();
  const effects = expand_effect_exprs(ctx, decl_effects, expanding);
  let deduped = [];
  let seen = set_new();
  const __ring_iter_27 = __List_Iterable.iter(effects);
  while (true) {
    const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
    if (__ring_next_27._tag === "none") break;
    const eff = __ring_next_27._0;
    const key = types$effect_to_string(eff);
    if ((!_Set_contains(seen, key, __Str_Eq))) {
      _Set_insert(seen, key);
      List_push(deduped, eff);
    }
  }
  return new types$EffectRow(deduped, Option_none);
}

function register_fn_common(ctx, name, type_params, params, return_type, declared_effects, span, check_dup, track_mut_params, track_fn_bounds) {
  if (check_dup) {
    check_duplicate_def(ctx, name, span);
  }
  let type_vars = [];
  const saved = map_clone(ctx.type_param_scope);
  const saved_qualified = map_clone(ctx.qualified_assoc_scope);
  const __ring_iter_28 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
    if (__ring_next_28._tag === "none") break;
    const tp = __ring_next_28._0;
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match40: {
      const __ring_m40 = tv;
      if (__ring_m40._tag === "TypeVar") {
        const id = __ring_m40.id;
        List_push(type_vars, id);
        break __ring_match40;
      }
      break __ring_match40;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  inject_assoc_types_from_bounds(ctx, type_params);
  let param_types = [];
  if (track_mut_params) {
    let mut_flags = [];
    const __ring_iter_29 = __List_Iterable.iter(params);
    while (true) {
      const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
      if (__ring_next_29._tag === "none") break;
      const p = __ring_next_29._0;
      let __ring_blk3;
      __ring_match41: {
        const __ring_m41 = p.type_annotation;
        if (__ring_m41._tag === "some") {
          const ta = __ring_m41._0;
          __ring_blk3 = infer_ctx$resolve_type_expr(ctx, ta);
          break __ring_match41;
        }
        if (__ring_m41._tag === "none") {
          __ring_blk3 = env$TypeEnv_fresh_var(ctx.env);
          break __ring_match41;
        }
        __match_fail(__ring_m41);
      }
      const pt = __ring_blk3;
      List_push(param_types, pt);
      if (((p.name === "self") ? true : (!p.is_mutable))) {
        List_push(mut_flags, false);
      } else {
        List_push(mut_flags, is_register_value_type(pt));
      }
    }
    _Map_insert(ctx.fn_mut_params, name, mut_flags);
  } else {
    const __ring_iter_30 = __List_Iterable.iter(params);
    while (true) {
      const __ring_next_30 = __ListIterator_Iterator.next(__ring_iter_30);
      if (__ring_next_30._tag === "none") break;
      const p = __ring_next_30._0;
      __ring_match42: {
        const __ring_m42 = p.type_annotation;
        if (__ring_m42._tag === "some") {
          const ta = __ring_m42._0;
          List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
          break __ring_match42;
        }
        if (__ring_m42._tag === "none") {
          List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
          break __ring_match42;
        }
        __match_fail(__ring_m42);
      }
    }
  }
  let __ring_blk4;
  __ring_match43: {
    const __ring_m43 = return_type;
    if (__ring_m43._tag === "some") {
      const rt = __ring_m43._0;
      __ring_blk4 = infer_ctx$resolve_type_expr(ctx, rt);
      break __ring_match43;
    }
    if (__ring_m43._tag === "none") {
      __ring_blk4 = env$TypeEnv_fresh_var(ctx.env);
      break __ring_match43;
    }
    __match_fail(__ring_m43);
  }
  const ret = __ring_blk4;
  let declared_names = set_new();
  const __ring_iter_31 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
    if (__ring_next_31._tag === "none") break;
    const tp = __ring_next_31._0;
    _Set_insert(declared_names, tp.name);
  }
  let sorted_tp_scope3 = _Map_entries(ctx.type_param_scope);
  sorted_tp_scope3.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_32 = __List_Iterable.iter(sorted_tp_scope3);
  while (true) {
    const __ring_next_32 = __ListIterator_Iterator.next(__ring_iter_32);
    if (__ring_next_32._tag === "none") break;
    const entry = __ring_next_32._0;
    const __ring_dt0 = entry;
    const tpname = __ring_dt0[0];
    const tv = __ring_dt0[1];
    if (((!_Map_contains_key(saved, tpname)) ? (!_Set_contains(declared_names, tpname, __Str_Eq)) : false)) {
      __ring_match44: {
        const __ring_m44 = tv;
        if (__ring_m44._tag === "TypeVar") {
          const id = __ring_m44.id;
          List_push(type_vars, id);
          break __ring_match44;
        }
        break __ring_match44;
      }
    }
  }
  let __ring_blk5;
  __ring_match45: {
    const __ring_m45 = declared_effects;
    if (__ring_m45._tag === "some") {
      const de = __ring_m45._0;
      __ring_blk5 = resolve_declared_effects(ctx, de);
      break __ring_match45;
    }
    if (__ring_m45._tag === "none") {
      __ring_blk5 = types$EMPTY_ROW;
      break __ring_match45;
    }
    __match_fail(__ring_m45);
  }
  const effects = __ring_blk5;
  const fn_type = types$Type_FnType(param_types, ret, effects);
  let fn_bounds_list = [];
  let scheme_bounds = [];
  const __ring_iter_33 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
    if (__ring_next_33._tag === "none") break;
    const tp = __ring_next_33._0;
    const tv = _Map_get(ctx.type_param_scope, tp.name);
    const __ring_iter_34 = __List_Iterable.iter(tp.bounds);
    while (true) {
      const __ring_next_34 = __ListIterator_Iterator.next(__ring_iter_34);
      if (__ring_next_34._tag === "none") break;
      const b = __ring_next_34._0;
      if ((!_Map_contains_key(ctx.env.trait_reg.traits, b.trait_name))) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0501, `Unknown trait: ${b.trait_name}`, tp.span, diagnostics$DiagnosticContext_TraitError(`unknown trait '${b.trait_name}'`));
      }
      if (track_fn_bounds) {
        List_push(fn_bounds_list, new env$FnBound(tp.name, b.trait_name));
      }
      let assoc_entries = [];
      const __ring_iter_35 = __List_Iterable.iter(b.assoc_constraints);
      while (true) {
        const __ring_next_35 = __ListIterator_Iterator.next(__ring_iter_35);
        if (__ring_next_35._tag === "none") break;
        const ac = __ring_next_35._0;
        const concrete_ty = infer_ctx$resolve_type_expr(ctx, ac.ty);
        List_push(assoc_entries, new env$AssocConstraintEntry(ac.name, concrete_ty));
      }
      __ring_match46: {
        const __ring_m46 = _Map_get(ctx.env.trait_reg.traits, b.trait_name);
        if (__ring_m46._tag === "some") {
          const tdef = __ring_m46._0;
          const __ring_iter_36 = __List_Iterable.iter(tdef.assoc_types);
          while (true) {
            const __ring_next_36 = __ListIterator_Iterator.next(__ring_iter_36);
            if (__ring_next_36._tag === "none") break;
            const atdef = __ring_next_36._0;
            const already = assoc_entries.some((function(e) { return (e.name === atdef.name); }));
            if ((!already)) {
              const qk = `${tp.name}::${atdef.name}`;
              __ring_match47: {
                const __ring_m47 = _Map_get(ctx.qualified_assoc_scope, qk);
                if (__ring_m47._tag === "some") {
                  const at_var = __ring_m47._0;
                  List_push(assoc_entries, new env$AssocConstraintEntry(atdef.name, at_var));
                  break __ring_match47;
                }
                if (__ring_m47._tag === "none") {
                  break __ring_match47;
                }
                __match_fail(__ring_m47);
              }
            }
          }
          break __ring_match46;
        }
        if (__ring_m46._tag === "none") {
          break __ring_match46;
        }
        __match_fail(__ring_m46);
      }
      __ring_match48: {
        const __ring_m48 = tv;
        if (__ring_m48._tag === "some") {
          const t = __ring_m48._0;
          __ring_match49: {
            const __ring_m49 = t;
            if (__ring_m49._tag === "TypeVar") {
              const id = __ring_m49.id;
              List_push(scheme_bounds, new env$SchemeBound(id, b.trait_name, assoc_entries));
              break __ring_match49;
            }
            break __ring_match49;
          }
          break __ring_match48;
        }
        if (__ring_m48._tag === "none") {
          break __ring_match48;
        }
        __match_fail(__ring_m48);
      }
      const supers = collect_all_supertraits(ctx, b.trait_name);
      const __ring_iter_37 = __List_Iterable.iter(supers);
      while (true) {
        const __ring_next_37 = __ListIterator_Iterator.next(__ring_iter_37);
        if (__ring_next_37._tag === "none") break;
        const st_name = __ring_next_37._0;
        if (track_fn_bounds) {
          List_push(fn_bounds_list, new env$FnBound(tp.name, st_name));
        }
        __ring_match50: {
          const __ring_m50 = tv;
          if (__ring_m50._tag === "some") {
            const t = __ring_m50._0;
            __ring_match51: {
              const __ring_m51 = t;
              if (__ring_m51._tag === "TypeVar") {
                const id = __ring_m51.id;
                List_push(scheme_bounds, new env$SchemeBound(id, st_name, []));
                break __ring_match51;
              }
              break __ring_match51;
            }
            break __ring_match50;
          }
          if (__ring_m50._tag === "none") {
            break __ring_match50;
          }
          __match_fail(__ring_m50);
        }
      }
    }
  }
  if ((track_fn_bounds ? (List_len(fn_bounds_list) > 0) : false)) {
    _Map_insert(ctx.env.scope.fn_bounds, name, fn_bounds_list);
  }
  ctx.type_param_scope = saved;
  ctx.qualified_assoc_scope = saved_qualified;
  if ((List_len(type_vars) > 0)) {
    env$TypeEnv_bind(ctx.env, name, new env$TypeScheme(fn_type, type_vars, scheme_bounds, Option_none));
  } else {
    env$TypeEnv_bind_mono(ctx.env, name, fn_type);
  }
  __ring_match52: {
    const __ring_m52 = env$TypeEnv_lookup(ctx.env, name);
    if (__ring_m52._tag === "some") {
      const s = __ring_m52._0;
      __ring_match53: {
        const __ring_m53 = s.def_id;
        if (__ring_m53._tag === "some") {
          const did = __ring_m53._0;
          return env$TypeEnv_record_def_span(ctx.env, did, span);
          break __ring_match53;
        }
        if (__ring_m53._tag === "none") {
          break __ring_match53;
        }
        __match_fail(__ring_m53);
      }
      break __ring_match52;
    }
    if (__ring_m52._tag === "none") {
      break __ring_match52;
    }
    __match_fail(__ring_m52);
  }
}

function register_extern_fn(ctx, name, type_params, params, return_type, declared_effects, span) {
  return register_fn_common(ctx, name, type_params, params, return_type, declared_effects, span, false, false, false);
}

function register_extern_type(ctx, name, type_params) {
  let tp_names = [];
  const saved = map_clone(ctx.type_param_scope);
  let tp_vars = [];
  const __ring_iter_38 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_38 = __ListIterator_Iterator.next(__ring_iter_38);
    if (__ring_next_38._tag === "none") break;
    const tp = __ring_next_38._0;
    List_push(tp_names, tp.name);
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match54: {
      const __ring_m54 = tv;
      if (__ring_m54._tag === "TypeVar") {
        const id = __ring_m54.id;
        List_push(tp_vars, id);
        break __ring_match54;
      }
      break __ring_match54;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  ctx.type_param_scope = saved;
  return _Map_insert(ctx.env.types.structs, name, new env$StructDef(name, tp_names, tp_vars, [], true));
}

function register_fn(ctx, name, type_params, params, return_type, declared_effects, span) {
  return register_fn_common(ctx, name, type_params, params, return_type, declared_effects, span, true, true, true);
}

function resolve_impl_self_type(ctx, target_type, impl_type_params) {
  if ((List_len(impl_type_params) === 0)) {
    return infer_ctx$resolve_self_type(ctx, target_type);
  }
  let impl_tp_types = [];
  const __ring_iter_39 = __List_Iterable.iter(impl_type_params);
  while (true) {
    const __ring_next_39 = __ListIterator_Iterator.next(__ring_iter_39);
    if (__ring_next_39._tag === "none") break;
    const tp = __ring_next_39._0;
    __ring_match55: {
      const __ring_m55 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m55._tag === "some") {
        const tv = __ring_m55._0;
        List_push(impl_tp_types, tv);
        break __ring_match55;
      }
      if (__ring_m55._tag === "none") {
        List_push(impl_tp_types, env$TypeEnv_fresh_var(ctx.env));
        break __ring_match55;
      }
      __match_fail(__ring_m55);
    }
  }
  __ring_match56: {
    const __ring_m56 = _Map_get(ctx.env.types.structs, target_type);
    if (__ring_m56._tag === "some") {
      const def = __ring_m56._0;
      return types$Type_StructType(def.name, impl_tp_types);
      break __ring_match56;
    }
    if (__ring_m56._tag === "none") {
      __ring_match57: {
        const __ring_m57 = _Map_get(ctx.env.types.enums, target_type);
        if (__ring_m57._tag === "some") {
          const def = __ring_m57._0;
          return types$Type_EnumType(def.name, impl_tp_types);
          break __ring_match57;
        }
        if (__ring_m57._tag === "none") {
          return infer_ctx$resolve_self_type(ctx, target_type);
          break __ring_match57;
        }
        __match_fail(__ring_m57);
      }
      break __ring_match56;
    }
    __match_fail(__ring_m56);
  }
}

function register_impl_method(ctx, methods_map, impl_tv_ids, target_type, mname, mtps, params, return_type, declared_effects, impl_scheme_bounds, outer_saved, impl_type_params, is_extern) {
  const saved_method = map_clone(ctx.type_param_scope);
  let method_tv_ids = [];
  const __ring_iter_40 = __List_Iterable.iter(mtps);
  while (true) {
    const __ring_next_40 = __ListIterator_Iterator.next(__ring_iter_40);
    if (__ring_next_40._tag === "none") break;
    const mtp = __ring_next_40._0;
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match58: {
      const __ring_m58 = tv;
      if (__ring_m58._tag === "TypeVar") {
        const id = __ring_m58.id;
        List_push(method_tv_ids, id);
        break __ring_match58;
      }
      break __ring_match58;
    }
    _Map_insert(ctx.type_param_scope, mtp.name, tv);
  }
  const self_type = resolve_impl_self_type(ctx, target_type, impl_type_params);
  let param_types = [];
  const __ring_iter_41 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_41 = __ListIterator_Iterator.next(__ring_iter_41);
    if (__ring_next_41._tag === "none") break;
    const p = __ring_next_41._0;
    __ring_match59: {
      const __ring_m59 = p.type_annotation;
      if (__ring_m59._tag === "some") {
        const ta = __ring_m59._0;
        List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
        break __ring_match59;
      }
      if (__ring_m59._tag === "none") {
        if ((p.name === "self")) {
          List_push(param_types, self_type);
        } else {
          List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
        }
        break __ring_match59;
      }
      __match_fail(__ring_m59);
    }
  }
  let __ring_blk6;
  __ring_match60: {
    const __ring_m60 = return_type;
    if (__ring_m60._tag === "some") {
      const rt = __ring_m60._0;
      __ring_blk6 = infer_ctx$resolve_type_expr(ctx, rt);
      break __ring_match60;
    }
    if (__ring_m60._tag === "none") {
      __ring_blk6 = env$TypeEnv_fresh_var(ctx.env);
      break __ring_match60;
    }
    __match_fail(__ring_m60);
  }
  const ret = __ring_blk6;
  let all_tvs = list_clone(impl_tv_ids);
  const __ring_iter_42 = __List_Iterable.iter(method_tv_ids);
  while (true) {
    const __ring_next_42 = __ListIterator_Iterator.next(__ring_iter_42);
    if (__ring_next_42._tag === "none") break;
    const mtv = __ring_next_42._0;
    List_push(all_tvs, mtv);
  }
  if ((!is_extern)) {
    let declared_names = set_new();
    let sorted_tp_scope = _Map_entries(ctx.type_param_scope);
    sorted_tp_scope.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
    const __ring_iter_43 = __List_Iterable.iter(sorted_tp_scope);
    while (true) {
      const __ring_next_43 = __ListIterator_Iterator.next(__ring_iter_43);
      if (__ring_next_43._tag === "none") break;
      const entry = __ring_next_43._0;
      const __ring_dt1 = entry;
      const tpname = __ring_dt1[0];
      if (_Map_contains_key(outer_saved, tpname)) {
        _Set_insert(declared_names, tpname);
      }
    }
    const __ring_iter_44 = __List_Iterable.iter(sorted_tp_scope);
    while (true) {
      const __ring_next_44 = __ListIterator_Iterator.next(__ring_iter_44);
      if (__ring_next_44._tag === "none") break;
      const entry = __ring_next_44._0;
      const __ring_dt2 = entry;
      const tpname = __ring_dt2[0];
      const tv = __ring_dt2[1];
      if (((!_Map_contains_key(outer_saved, tpname)) ? (!_Set_contains(declared_names, tpname, __Str_Eq)) : false)) {
        __ring_match61: {
          const __ring_m61 = tv;
          if (__ring_m61._tag === "TypeVar") {
            const id = __ring_m61.id;
            if ((!List_contains(all_tvs, id, __Int_Eq))) {
              List_push(all_tvs, id);
            }
            break __ring_match61;
          }
          break __ring_match61;
        }
      }
    }
  }
  let __ring_blk7;
  __ring_match62: {
    const __ring_m62 = declared_effects;
    if (__ring_m62._tag === "some") {
      const de = __ring_m62._0;
      __ring_blk7 = resolve_declared_effects(ctx, de);
      break __ring_match62;
    }
    if (__ring_m62._tag === "none") {
      __ring_blk7 = types$EMPTY_ROW;
      break __ring_match62;
    }
    __match_fail(__ring_m62);
  }
  const impl_m_effects = __ring_blk7;
  const fn_type = types$Type_FnType(param_types, ret, impl_m_effects);
  _Map_insert(methods_map, mname, new env$TypeScheme(fn_type, all_tvs, impl_scheme_bounds, Option_none));
  if ((List_len(params) > 0)) {
    __ring_match63: {
      const __ring_m63 = List_first(params);
      if (__ring_m63._tag === "some") {
        const first_p = __ring_m63._0;
        if (((first_p.name === "self") ? first_p.is_mutable : false)) {
          let __ring_blk8;
          __ring_match64: {
            const __ring_m64 = _Map_get(ctx.env.trait_reg.mut_methods, target_type);
            if (__ring_m64._tag === "some") {
              const s = __ring_m64._0;
              __ring_blk8 = s;
              break __ring_match64;
            }
            if (__ring_m64._tag === "none") {
              let new_set = set_new();
              _Map_insert(ctx.env.trait_reg.mut_methods, target_type, new_set);
              __ring_blk8 = new_set;
              break __ring_match64;
            }
            __match_fail(__ring_m64);
          }
          let mut_set = __ring_blk8;
          _Set_insert(mut_set, mname);
        }
        break __ring_match63;
      }
      if (__ring_m63._tag === "none") {
        break __ring_match63;
      }
      __match_fail(__ring_m63);
    }
  }
  ctx.type_param_scope = saved_method;
}

function register_impl(ctx, target_type, type_params, trait_name, methods, span) {
  let __ring_blk9;
  __ring_match65: {
    const __ring_m65 = _Map_get(ctx.env.trait_reg.impl_methods, target_type);
    if (__ring_m65._tag === "some") {
      const m = __ring_m65._0;
      __ring_blk9 = m;
      break __ring_match65;
    }
    if (__ring_m65._tag === "none") {
      let new_map = map_new();
      _Map_insert(ctx.env.trait_reg.impl_methods, target_type, new_map);
      __ring_blk9 = new_map;
      break __ring_match65;
    }
    __match_fail(__ring_m65);
  }
  let impl_methods_map = __ring_blk9;
  const saved = map_clone(ctx.type_param_scope);
  const saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope);
  let impl_tv_ids = [];
  const __ring_iter_45 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_45 = __ListIterator_Iterator.next(__ring_iter_45);
    if (__ring_next_45._tag === "none") break;
    const tp = __ring_next_45._0;
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match66: {
      const __ring_m66 = tv;
      if (__ring_m66._tag === "TypeVar") {
        const id = __ring_m66.id;
        List_push(impl_tv_ids, id);
        break __ring_match66;
      }
      break __ring_match66;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  let impl_scheme_bounds = [];
  let tp_idx = 0;
  const __ring_iter_46 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_46 = __ListIterator_Iterator.next(__ring_iter_46);
    if (__ring_next_46._tag === "none") break;
    const tp = __ring_next_46._0;
    const __ring_iter_47 = __List_Iterable.iter(tp.bounds);
    while (true) {
      const __ring_next_47 = __ListIterator_Iterator.next(__ring_iter_47);
      if (__ring_next_47._tag === "none") break;
      const b = __ring_next_47._0;
      if ((tp_idx < List_len(impl_tv_ids))) {
        const tv_id = Option_unwrap(List_get(impl_tv_ids, tp_idx));
        List_push(impl_scheme_bounds, new env$SchemeBound(tv_id, b.trait_name, []));
        const supers = collect_all_supertraits(ctx, b.trait_name);
        const __ring_iter_48 = __List_Iterable.iter(supers);
        while (true) {
          const __ring_next_48 = __ListIterator_Iterator.next(__ring_iter_48);
          if (__ring_next_48._tag === "none") break;
          const st_name = __ring_next_48._0;
          List_push(impl_scheme_bounds, new env$SchemeBound(tv_id, st_name, []));
        }
      }
    }
    tp_idx = (tp_idx + 1);
  }
  let assoc_type_map = map_new();
  const __ring_iter_49 = __List_Iterable.iter(methods);
  while (true) {
    const __ring_next_49 = __ListIterator_Iterator.next(__ring_iter_49);
    if (__ring_next_49._tag === "none") break;
    const method = __ring_next_49._0;
    __ring_match67: {
      const __ring_m67 = method;
      if (__ring_m67._tag === "AssocType") {
        const aname = __ring_m67.name; const avalue = __ring_m67.value; const aspan = __ring_m67.span;
        __ring_match68: {
          const __ring_m68 = avalue;
          if (__ring_m68._tag === "some") {
            const v = __ring_m68._0;
            const resolved_ty = infer_ctx$resolve_type_expr(ctx, v);
            _Map_insert(assoc_type_map, aname, resolved_ty);
            _Map_insert(ctx.type_param_scope, aname, resolved_ty);
            break __ring_match68;
          }
          if (__ring_m68._tag === "none") {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0510, `Associated type '${aname}' must have a value in impl`, aspan, diagnostics$DiagnosticContext_TraitError("missing associated type value"));
            break __ring_match68;
          }
          __match_fail(__ring_m68);
        }
        break __ring_match67;
      }
      break __ring_match67;
    }
  }
  const impl_self_type = resolve_impl_self_type(ctx, target_type, type_params);
  _Map_insert(ctx.type_param_scope, "Self", impl_self_type);
  let sorted_assoc_map = _Map_entries(assoc_type_map);
  sorted_assoc_map.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_50 = __List_Iterable.iter(sorted_assoc_map);
  while (true) {
    const __ring_next_50 = __ListIterator_Iterator.next(__ring_iter_50);
    if (__ring_next_50._tag === "none") break;
    const entry = __ring_next_50._0;
    const __ring_dt3 = entry;
    const aname = __ring_dt3[0];
    const aty = __ring_dt3[1];
    _Map_insert(ctx.qualified_assoc_scope, `Self::${aname}`, aty);
  }
  const __ring_iter_51 = __List_Iterable.iter(methods);
  while (true) {
    const __ring_next_51 = __ListIterator_Iterator.next(__ring_iter_51);
    if (__ring_next_51._tag === "none") break;
    const method = __ring_next_51._0;
    __ring_match69: {
      const __ring_m69 = method;
      if (__ring_m69._tag === "Fn") {
        const mname = __ring_m69.name; const mtps = __ring_m69.type_params; const params = __ring_m69.params; const return_type = __ring_m69.return_type; const declared_effects = __ring_m69.declared_effects;
        register_impl_method(ctx, impl_methods_map, impl_tv_ids, target_type, mname, mtps, params, return_type, declared_effects, impl_scheme_bounds, saved, type_params, false);
        break __ring_match69;
      }
      if (__ring_m69._tag === "ExternFn") {
        const mname = __ring_m69.name; const mtps = __ring_m69.type_params; const params = __ring_m69.params; const return_type = __ring_m69.return_type; const declared_effects = __ring_m69.declared_effects;
        register_impl_method(ctx, impl_methods_map, impl_tv_ids, target_type, mname, mtps, params, return_type, declared_effects, impl_scheme_bounds, saved, type_params, true);
        break __ring_match69;
      }
      if (__ring_m69._tag === "Delegate") {
        break __ring_match69;
      }
      if (__ring_m69._tag === "AssocType") {
        break __ring_match69;
      }
      break __ring_match69;
    }
  }
  __ring_match70: {
    const __ring_m70 = trait_name;
    if (__ring_m70._tag === "some") {
      const tname = __ring_m70._0;
      __ring_match71: {
        const __ring_m71 = _Map_get(ctx.env.trait_reg.traits, tname);
        if (__ring_m71._tag === "some") {
          const trait_def = __ring_m71._0;
          let impl_method_names = set_new();
          const __ring_iter_52 = __List_Iterable.iter(methods);
          while (true) {
            const __ring_next_52 = __ListIterator_Iterator.next(__ring_iter_52);
            if (__ring_next_52._tag === "none") break;
            const m = __ring_next_52._0;
            __ring_match72: {
              const __ring_m72 = m;
              if (__ring_m72._tag === "Fn") {
                const mn = __ring_m72.name;
                _Set_insert(impl_method_names, mn);
                break __ring_match72;
              }
              break __ring_match72;
            }
          }
          const __ring_iter_53 = __List_Iterable.iter(trait_def.methods);
          while (true) {
            const __ring_next_53 = __ListIterator_Iterator.next(__ring_iter_53);
            if (__ring_next_53._tag === "none") break;
            const tm = __ring_next_53._0;
            if (((!tm.has_default) ? (!_Set_contains(impl_method_names, tm.name, __Str_Eq)) : false)) {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0502, `Missing method '${tm.name}' in impl ${tname} for ${target_type}`, span, diagnostics$DiagnosticContext_TraitError(`missing method '${tm.name}'`));
            }
          }
          let impl_assoc_names = set_new();
          let sorted_assoc_map2 = _Map_entries(assoc_type_map);
          sorted_assoc_map2.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
          const __ring_iter_54 = __List_Iterable.iter(sorted_assoc_map2);
          while (true) {
            const __ring_next_54 = __ListIterator_Iterator.next(__ring_iter_54);
            if (__ring_next_54._tag === "none") break;
            const entry = __ring_next_54._0;
            const __ring_dt4 = entry;
            const aname = __ring_dt4[0];
            _Set_insert(impl_assoc_names, aname);
          }
          const __ring_iter_55 = __List_Iterable.iter(trait_def.assoc_types);
          while (true) {
            const __ring_next_55 = __ListIterator_Iterator.next(__ring_iter_55);
            if (__ring_next_55._tag === "none") break;
            const atdef = __ring_next_55._0;
            if ((!_Set_contains(impl_assoc_names, atdef.name, __Str_Eq))) {
              __ring_match73: {
                const __ring_m73 = atdef.default_type;
                if (__ring_m73._tag === "some") {
                  const dt = __ring_m73._0;
                  _Map_insert(assoc_type_map, atdef.name, dt);
                  break __ring_match73;
                }
                if (__ring_m73._tag === "none") {
                  const _ = infer_ctx$type_error(ctx.sink, codes$E0510, `Missing associated type '${atdef.name}' in impl ${tname} for ${target_type}`, span, diagnostics$DiagnosticContext_TraitError(`missing associated type '${atdef.name}'`));
                  break __ring_match73;
                }
                __match_fail(__ring_m73);
              }
            }
          }
          let trait_assoc_names = set_new();
          const __ring_iter_56 = __List_Iterable.iter(trait_def.assoc_types);
          while (true) {
            const __ring_next_56 = __ListIterator_Iterator.next(__ring_iter_56);
            if (__ring_next_56._tag === "none") break;
            const atdef = __ring_next_56._0;
            _Set_insert(trait_assoc_names, atdef.name);
          }
          let sorted_assoc_map3 = _Map_entries(assoc_type_map);
          sorted_assoc_map3.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
          const __ring_iter_57 = __List_Iterable.iter(sorted_assoc_map3);
          while (true) {
            const __ring_next_57 = __ListIterator_Iterator.next(__ring_iter_57);
            if (__ring_next_57._tag === "none") break;
            const entry = __ring_next_57._0;
            const __ring_dt5 = entry;
            const aname = __ring_dt5[0];
            if ((!_Set_contains(trait_assoc_names, aname, __Str_Eq))) {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0514, `Unexpected associated type '${aname}' in impl ${tname} for ${target_type}; trait '${tname}' does not declare it`, span, diagnostics$DiagnosticContext_TraitError(`unexpected associated type '${aname}'`));
            }
          }
          const __ring_iter_58 = __List_Iterable.iter(trait_def.assoc_types);
          while (true) {
            const __ring_next_58 = __ListIterator_Iterator.next(__ring_iter_58);
            if (__ring_next_58._tag === "none") break;
            const atdef = __ring_next_58._0;
            if ((List_len(atdef.bounds) > 0)) {
              __ring_match74: {
                const __ring_m74 = _Map_get(assoc_type_map, atdef.name);
                if (__ring_m74._tag === "some") {
                  const concrete_ty = __ring_m74._0;
                  const concrete_name = types$type_to_builtin_name(concrete_ty);
                  __ring_match75: {
                    const __ring_m75 = concrete_name;
                    if (__ring_m75._tag === "some") {
                      const cname = __ring_m75._0;
                      const __ring_iter_59 = __List_Iterable.iter(atdef.bounds);
                      while (true) {
                        const __ring_next_59 = __ListIterator_Iterator.next(__ring_iter_59);
                        if (__ring_next_59._tag === "none") break;
                        const bound_trait = __ring_next_59._0;
                        if ((!env$has_impl(ctx.env.trait_reg, cname, bound_trait))) {
                          const _ = infer_ctx$type_error(ctx.sink, codes$E0513, `Associated type '${atdef.name}' requires '${bound_trait}', but '${types$type_to_string(concrete_ty)}' does not implement it`, span, diagnostics$DiagnosticContext_TraitError(`associated type bound '${bound_trait}' not satisfied by '${cname}'`));
                        }
                      }
                      break __ring_match75;
                    }
                    if (__ring_m75._tag === "none") {
                      break __ring_match75;
                    }
                    __match_fail(__ring_m75);
                  }
                  break __ring_match74;
                }
                if (__ring_m74._tag === "none") {
                  break __ring_match74;
                }
                __match_fail(__ring_m74);
              }
            }
          }
          const all_supertraits = collect_all_supertraits(ctx, tname);
          const __ring_iter_60 = __List_Iterable.iter(all_supertraits);
          while (true) {
            const __ring_next_60 = __ListIterator_Iterator.next(__ring_iter_60);
            if (__ring_next_60._tag === "none") break;
            const required_st = __ring_next_60._0;
            if ((!env$has_impl(ctx.env.trait_reg, target_type, required_st))) {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0505, `Type '${target_type}' does not implement supertrait '${required_st}' required by '${tname}'`, span, diagnostics$DiagnosticContext_TraitError(`missing supertrait impl '${required_st}'`));
            }
          }
          let tp_names = [];
          const __ring_iter_61 = __List_Iterable.iter(type_params);
          while (true) {
            const __ring_next_61 = __ListIterator_Iterator.next(__ring_iter_61);
            if (__ring_next_61._tag === "none") break;
            const tp = __ring_next_61._0;
            List_push(tp_names, tp.name);
          }
          let method_names = [];
          const __ring_iter_62 = __List_Iterable.iter(methods);
          while (true) {
            const __ring_next_62 = __ListIterator_Iterator.next(__ring_iter_62);
            if (__ring_next_62._tag === "none") break;
            const m = __ring_next_62._0;
            __ring_match76: {
              const __ring_m76 = m;
              if (__ring_m76._tag === "Fn") {
                const mn = __ring_m76.name;
                List_push(method_names, mn);
                break __ring_match76;
              }
              if (__ring_m76._tag === "ExternFn") {
                const mn = __ring_m76.name;
                List_push(method_names, mn);
                break __ring_match76;
              }
              break __ring_match76;
            }
          }
          env$add_impl(ctx.env.trait_reg, new env$ImplEntry(tname, target_type, tp_names, method_names, map_clone(assoc_type_map)));
          break __ring_match71;
        }
        if (__ring_m71._tag === "none") {
          const _ = infer_ctx$type_error(ctx.sink, codes$E0501, `Unknown trait: ${tname}`, span, diagnostics$DiagnosticContext_TraitError(`unknown trait '${tname}'`));
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
  ctx.type_param_scope = saved;
  ctx.qualified_assoc_scope = saved_qualified_assoc;
}

function register_sig(ctx, name, members, is_pub) {
  const saved = map_clone(ctx.type_param_scope);
  let sig_members = map_new();
  const __ring_iter_63 = __List_Iterable.iter(members);
  while (true) {
    const __ring_next_63 = __ListIterator_Iterator.next(__ring_iter_63);
    if (__ring_next_63._tag === "none") break;
    const m = __ring_next_63._0;
    let type_vars = [];
    const msaved = map_clone(ctx.type_param_scope);
    const __ring_iter_64 = __List_Iterable.iter(m.type_params);
    while (true) {
      const __ring_next_64 = __ListIterator_Iterator.next(__ring_iter_64);
      if (__ring_next_64._tag === "none") break;
      const tp = __ring_next_64._0;
      const tv = env$TypeEnv_fresh_var(ctx.env);
      __ring_match77: {
        const __ring_m77 = tv;
        if (__ring_m77._tag === "TypeVar") {
          const id = __ring_m77.id;
          List_push(type_vars, id);
          break __ring_match77;
        }
        break __ring_match77;
      }
      _Map_insert(ctx.type_param_scope, tp.name, tv);
    }
    let param_types = [];
    const __ring_iter_65 = __List_Iterable.iter(m.params);
    while (true) {
      const __ring_next_65 = __ListIterator_Iterator.next(__ring_iter_65);
      if (__ring_next_65._tag === "none") break;
      const p = __ring_next_65._0;
      __ring_match78: {
        const __ring_m78 = p.type_annotation;
        if (__ring_m78._tag === "some") {
          const ta = __ring_m78._0;
          List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
          break __ring_match78;
        }
        if (__ring_m78._tag === "none") {
          List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
          break __ring_match78;
        }
        __match_fail(__ring_m78);
      }
    }
    let __ring_blk10;
    __ring_match79: {
      const __ring_m79 = m.return_type;
      if (__ring_m79._tag === "some") {
        const rt = __ring_m79._0;
        __ring_blk10 = infer_ctx$resolve_type_expr(ctx, rt);
        break __ring_match79;
      }
      if (__ring_m79._tag === "none") {
        __ring_blk10 = env$TypeEnv_fresh_var(ctx.env);
        break __ring_match79;
      }
      __match_fail(__ring_m79);
    }
    const ret = __ring_blk10;
    const fn_type = types$Type_FnType(param_types, ret, types$EMPTY_ROW);
    _Map_insert(sig_members, m.name, new env$TypeScheme(fn_type, type_vars, [], Option_none));
    ctx.type_param_scope = msaved;
  }
  ctx.type_param_scope = saved;
  return _Map_insert(ctx.env.types.sigs, name, new env$SigDef(name, sig_members, is_pub));
}

function register_trait(ctx, name, type_params, supertraits, methods, span) {
  const saved = map_clone(ctx.type_param_scope);
  const saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope);
  let tp_names = [];
  let tp_vars = [];
  const __ring_iter_66 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_66 = __ListIterator_Iterator.next(__ring_iter_66);
    if (__ring_next_66._tag === "none") break;
    const tp = __ring_next_66._0;
    List_push(tp_names, tp.name);
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match80: {
      const __ring_m80 = tv;
      if (__ring_m80._tag === "TypeVar") {
        const id = __ring_m80.id;
        List_push(tp_vars, id);
        break __ring_match80;
      }
      break __ring_match80;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  let supertrait_names = [];
  const __ring_iter_67 = __List_Iterable.iter(supertraits);
  while (true) {
    const __ring_next_67 = __ListIterator_Iterator.next(__ring_iter_67);
    if (__ring_next_67._tag === "none") break;
    const st = __ring_next_67._0;
    if ((!_Map_contains_key(ctx.env.trait_reg.traits, st.trait_name))) {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0501, `Unknown supertrait: ${st.trait_name}`, span, diagnostics$DiagnosticContext_TraitError(`unknown supertrait '${st.trait_name}'`));
    } else {
      List_push(supertrait_names, st.trait_name);
    }
  }
  const __ring_iter_68 = __List_Iterable.iter(supertrait_names);
  while (true) {
    const __ring_next_68 = __ListIterator_Iterator.next(__ring_iter_68);
    if (__ring_next_68._tag === "none") break;
    const st_name = __ring_next_68._0;
    let visited = set_new();
    _Set_insert(visited, name);
    let stack = [st_name];
    while ((List_len(stack) > 0)) {
      const current = Option_unwrap(List_pop(stack));
      if (_Set_contains(visited, current, __Str_Eq)) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0506, `Cyclic supertrait inheritance: '${name}' -> '${current}'`, span, diagnostics$DiagnosticContext_TraitError("cyclic supertrait inheritance"));
        break;
      }
      _Set_insert(visited, current);
      __ring_match81: {
        const __ring_m81 = _Map_get(ctx.env.trait_reg.traits, current);
        if (__ring_m81._tag === "some") {
          const parent_def = __ring_m81._0;
          const __ring_iter_69 = __List_Iterable.iter(parent_def.supertraits);
          while (true) {
            const __ring_next_69 = __ListIterator_Iterator.next(__ring_iter_69);
            if (__ring_next_69._tag === "none") break;
            const parent_st = __ring_next_69._0;
            List_push(stack, parent_st);
          }
          break __ring_match81;
        }
        if (__ring_m81._tag === "none") {
          break __ring_match81;
        }
        __match_fail(__ring_m81);
      }
    }
  }
  const self_var = env$TypeEnv_fresh_var(ctx.env);
  let assoc_type_defs = [];
  const __ring_iter_70 = __List_Iterable.iter(methods);
  while (true) {
    const __ring_next_70 = __ListIterator_Iterator.next(__ring_iter_70);
    if (__ring_next_70._tag === "none") break;
    const method = __ring_next_70._0;
    __ring_match82: {
      const __ring_m82 = method;
      if (__ring_m82._tag === "AssocType") {
        const aname = __ring_m82.name; const abounds = __ring_m82.bounds; const avalue = __ring_m82.value;
        const at_var_id = env$TypeEnv_fresh_var_id(ctx.env);
        const at_var = types$Type_TypeVar(at_var_id, Option_some(aname));
        _Map_insert(ctx.type_param_scope, aname, at_var);
        let bound_names = [];
        const __ring_iter_71 = __List_Iterable.iter(abounds);
        while (true) {
          const __ring_next_71 = __ListIterator_Iterator.next(__ring_iter_71);
          if (__ring_next_71._tag === "none") break;
          const b = __ring_next_71._0;
          List_push(bound_names, b.trait_name);
        }
        let __ring_blk11;
        __ring_match83: {
          const __ring_m83 = avalue;
          if (__ring_m83._tag === "some") {
            const v = __ring_m83._0;
            __ring_blk11 = Option_some(infer_ctx$resolve_type_expr(ctx, v));
            break __ring_match83;
          }
          if (__ring_m83._tag === "none") {
            __ring_blk11 = Option_none;
            break __ring_match83;
          }
          __match_fail(__ring_m83);
        }
        const default_ty = __ring_blk11;
        List_push(assoc_type_defs, new env$AssocTypeDef(aname, bound_names, default_ty, at_var_id));
        break __ring_match82;
      }
      break __ring_match82;
    }
  }
  _Map_insert(ctx.type_param_scope, "Self", self_var);
  const __ring_iter_72 = __List_Iterable.iter(assoc_type_defs);
  while (true) {
    const __ring_next_72 = __ListIterator_Iterator.next(__ring_iter_72);
    if (__ring_next_72._tag === "none") break;
    const atd = __ring_next_72._0;
    __ring_match84: {
      const __ring_m84 = _Map_get(ctx.type_param_scope, atd.name);
      if (__ring_m84._tag === "some") {
        const at_ty = __ring_m84._0;
        _Map_insert(ctx.qualified_assoc_scope, `Self::${atd.name}`, at_ty);
        break __ring_match84;
      }
      if (__ring_m84._tag === "none") {
        break __ring_match84;
      }
      __match_fail(__ring_m84);
    }
  }
  let trait_methods = [];
  const __ring_iter_73 = __List_Iterable.iter(methods);
  while (true) {
    const __ring_next_73 = __ListIterator_Iterator.next(__ring_iter_73);
    if (__ring_next_73._tag === "none") break;
    const method = __ring_next_73._0;
    __ring_match85: {
      const __ring_m85 = method;
      if (__ring_m85._tag === "Fn") {
        const mname = __ring_m85.name; const method_tps = __ring_m85.type_params; const params = __ring_m85.params; const return_type = __ring_m85.return_type; const declared_effects = __ring_m85.declared_effects; const is_abstract = __ring_m85.is_abstract;
        let param_types = [];
        let param_muts = [];
        const __ring_iter_74 = __List_Iterable.iter(params);
        while (true) {
          const __ring_next_74 = __ListIterator_Iterator.next(__ring_iter_74);
          if (__ring_next_74._tag === "none") break;
          const p = __ring_next_74._0;
          List_push(param_muts, p.is_mutable);
          if ((p.name === "self")) {
            List_push(param_types, self_var);
          } else {
            __ring_match86: {
              const __ring_m86 = p.type_annotation;
              if (__ring_m86._tag === "some") {
                const ta = __ring_m86._0;
                List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
                break __ring_match86;
              }
              if (__ring_m86._tag === "none") {
                List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
                break __ring_match86;
              }
              __match_fail(__ring_m86);
            }
          }
        }
        let __ring_blk12;
        __ring_match87: {
          const __ring_m87 = return_type;
          if (__ring_m87._tag === "some") {
            const rt = __ring_m87._0;
            __ring_blk12 = infer_ctx$resolve_type_expr(ctx, rt);
            break __ring_match87;
          }
          if (__ring_m87._tag === "none") {
            __ring_blk12 = env$TypeEnv_fresh_var(ctx.env);
            break __ring_match87;
          }
          __match_fail(__ring_m87);
        }
        const ret = __ring_blk12;
        let __ring_blk13;
        __ring_match88: {
          const __ring_m88 = declared_effects;
          if (__ring_m88._tag === "some") {
            const de = __ring_m88._0;
            __ring_blk13 = resolve_declared_effects(ctx, de);
            break __ring_match88;
          }
          if (__ring_m88._tag === "none") {
            __ring_blk13 = types$EMPTY_ROW;
            break __ring_match88;
          }
          __match_fail(__ring_m88);
        }
        const method_effects = __ring_blk13;
        const fn_type = types$Type_FnType(param_types, ret, method_effects);
        List_push(trait_methods, new env$TraitMethodDef(mname, fn_type, (!is_abstract), param_muts, method_tps));
        break __ring_match85;
      }
      break __ring_match85;
    }
  }
  ctx.type_param_scope = saved;
  ctx.qualified_assoc_scope = saved_qualified_assoc;
  return _Map_insert(ctx.env.trait_reg.traits, name, new env$TraitDef(name, tp_names, tp_vars, trait_methods, supertrait_names, assoc_type_defs));
}

function register_type_alias(ctx, name, type_params, type_expr) {
  const saved = map_clone(ctx.type_param_scope);
  let tp_vars = [];
  const __ring_iter_75 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_75 = __ListIterator_Iterator.next(__ring_iter_75);
    if (__ring_next_75._tag === "none") break;
    const tp = __ring_next_75._0;
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match89: {
      const __ring_m89 = tv;
      if (__ring_m89._tag === "TypeVar") {
        const id = __ring_m89.id;
        List_push(tp_vars, id);
        break __ring_match89;
      }
      break __ring_match89;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  const resolved = infer_ctx$resolve_type_expr(ctx, type_expr);
  ctx.type_param_scope = saved;
  let tp_names = [];
  const __ring_iter_76 = __List_Iterable.iter(type_params);
  while (true) {
    const __ring_next_76 = __ListIterator_Iterator.next(__ring_iter_76);
    if (__ring_next_76._tag === "none") break;
    const tp = __ring_next_76._0;
    List_push(tp_names, tp.name);
  }
  return _Map_insert(ctx.env.types.type_aliases, name, new env$TypeAliasDef(tp_names, tp_vars, resolved));
}

function register_phase1(ctx, decl, deferred_struct_names, deferred_enum_names) {
  __ring_match90: {
    const __ring_m90 = decl;
    if (__ring_m90._tag === "Struct") {
      const name = __ring_m90.name; const type_params = __ring_m90.type_params; const fields = __ring_m90.fields; const span = __ring_m90.span;
      preregister_struct(ctx, name, type_params);
      return List_push(deferred_struct_names, name);
      break __ring_match90;
    }
    if (__ring_m90._tag === "Enum") {
      const name = __ring_m90.name; const type_params = __ring_m90.type_params; const variants = __ring_m90.variants; const span = __ring_m90.span;
      preregister_enum(ctx, name, type_params);
      return List_push(deferred_enum_names, name);
      break __ring_match90;
    }
    if (__ring_m90._tag === "ModBlock") {
      const mod_name = __ring_m90.name; const mod_decls = __ring_m90.decls;
      return register_mod_block_items(ctx, mod_name, mod_decls, Option_some(deferred_struct_names), Option_some(deferred_enum_names));
      break __ring_match90;
    }
    return register_decl(ctx, decl);
    break __ring_match90;
  }
}

function register_mod_item(ctx, decl, deferred_struct_names, deferred_enum_names) {
  __ring_match91: {
    const __ring_m91 = deferred_struct_names;
    if (__ring_m91._tag === "some") {
      const dsn = __ring_m91._0;
      __ring_match92: {
        const __ring_m92 = deferred_enum_names;
        if (__ring_m92._tag === "some") {
          const den = __ring_m92._0;
          return register_phase1(ctx, decl, dsn, den);
          break __ring_match92;
        }
        if (__ring_m92._tag === "none") {
          return register_decl(ctx, decl);
          break __ring_match92;
        }
        __match_fail(__ring_m92);
      }
      break __ring_match91;
    }
    if (__ring_m91._tag === "none") {
      return register_decl(ctx, decl);
      break __ring_match91;
    }
    __match_fail(__ring_m91);
  }
}

function register_mod_block_items(ctx, mod_name, mod_decls, deferred_struct_names, deferred_enum_names) {
  const __ring_iter_77 = __List_Iterable.iter(mod_decls);
  while (true) {
    const __ring_next_77 = __ListIterator_Iterator.next(__ring_iter_77);
    if (__ring_next_77._tag === "none") break;
    const d = __ring_next_77._0;
    __ring_match93: {
      const __ring_m93 = d;
      if (__ring_m93._tag === "Struct") {
        const prefixed = prefix_decl_name(mod_name, d);
        register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names);
        break __ring_match93;
      }
      if (__ring_m93._tag === "Enum") {
        const prefixed = prefix_decl_name(mod_name, d);
        register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names);
        break __ring_match93;
      }
      break __ring_match93;
    }
  }
  insert_mod_aliases(ctx, mod_name, mod_decls, true);
  const __ring_iter_78 = __List_Iterable.iter(mod_decls);
  while (true) {
    const __ring_next_78 = __ListIterator_Iterator.next(__ring_iter_78);
    if (__ring_next_78._tag === "none") break;
    const d = __ring_next_78._0;
    __ring_match94: {
      const __ring_m94 = d;
      if (__ring_m94._tag === "Trait") {
        const prefixed = prefix_decl_name(mod_name, d);
        register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names);
        insert_mod_aliases(ctx, mod_name, mod_decls, true);
        break __ring_match94;
      }
      break __ring_match94;
    }
  }
  const __ring_iter_79 = __List_Iterable.iter(mod_decls);
  while (true) {
    const __ring_next_79 = __ListIterator_Iterator.next(__ring_iter_79);
    if (__ring_next_79._tag === "none") break;
    const d = __ring_next_79._0;
    __ring_match95: {
      const __ring_m95 = d;
      if (__ring_m95._tag === "Effect") {
        const prefixed = prefix_decl_name(mod_name, d);
        register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names);
        break __ring_match95;
      }
      if (__ring_m95._tag === "EffectAlias") {
        const prefixed = prefix_decl_name(mod_name, d);
        register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names);
        break __ring_match95;
      }
      if (__ring_m95._tag === "ExternType") {
        const prefixed = prefix_decl_name(mod_name, d);
        register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names);
        break __ring_match95;
      }
      break __ring_match95;
    }
  }
  insert_mod_aliases(ctx, mod_name, mod_decls, true);
  const __ring_iter_80 = __List_Iterable.iter(mod_decls);
  while (true) {
    const __ring_next_80 = __ListIterator_Iterator.next(__ring_iter_80);
    if (__ring_next_80._tag === "none") break;
    const d = __ring_next_80._0;
    __ring_match96: {
      const __ring_m96 = d;
      if (__ring_m96._tag === "Struct") {
        break __ring_match96;
      }
      if (__ring_m96._tag === "Enum") {
        break __ring_match96;
      }
      if (__ring_m96._tag === "Trait") {
        break __ring_match96;
      }
      if (__ring_m96._tag === "Effect") {
        break __ring_match96;
      }
      if (__ring_m96._tag === "EffectAlias") {
        break __ring_match96;
      }
      if (__ring_m96._tag === "ExternType") {
        break __ring_match96;
      }
      const prefixed = prefix_decl_name(mod_name, d);
      register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names);
      break __ring_match96;
    }
  }
}

function register_decl(ctx, decl) {
  __ring_match97: {
    const __ring_m97 = decl;
    if (__ring_m97._tag === "Struct") {
      const name = __ring_m97.name; const type_params = __ring_m97.type_params; const fields = __ring_m97.fields; const span = __ring_m97.span;
      preregister_struct(ctx, name, type_params);
      return complete_struct_fields(ctx, name, fields);
      break __ring_match97;
    }
    if (__ring_m97._tag === "Enum") {
      const name = __ring_m97.name; const type_params = __ring_m97.type_params; const variants = __ring_m97.variants; const span = __ring_m97.span;
      preregister_enum(ctx, name, type_params);
      return complete_enum_variants(ctx, name, type_params, variants);
      break __ring_match97;
    }
    if (__ring_m97._tag === "Effect") {
      const name = __ring_m97.name; const type_params = __ring_m97.type_params; const ops = __ring_m97.ops;
      return register_effect(ctx, name, type_params, ops);
      break __ring_match97;
    }
    if (__ring_m97._tag === "Impl") {
      const target_type = __ring_m97.target_type; const type_params = __ring_m97.type_params; const trait_name = __ring_m97.trait_name; const methods = __ring_m97.methods; const span = __ring_m97.span;
      return register_impl(ctx, target_type, type_params, trait_name, methods, span);
      break __ring_match97;
    }
    if (__ring_m97._tag === "Fn") {
      const name = __ring_m97.name; const type_params = __ring_m97.type_params; const params = __ring_m97.params; const return_type = __ring_m97.return_type; const declared_effects = __ring_m97.declared_effects; const span = __ring_m97.span;
      return register_fn(ctx, name, type_params, params, return_type, declared_effects, span);
      break __ring_match97;
    }
    if (__ring_m97._tag === "Test") {
      break __ring_match97;
    }
    if (__ring_m97._tag === "Trait") {
      const name = __ring_m97.name; const type_params = __ring_m97.type_params; const supertraits = __ring_m97.supertraits; const methods = __ring_m97.methods; const span = __ring_m97.span;
      return register_trait(ctx, name, type_params, supertraits, methods, span);
      break __ring_match97;
    }
    if (__ring_m97._tag === "ExternFn") {
      const name = __ring_m97.name; const type_params = __ring_m97.type_params; const params = __ring_m97.params; const return_type = __ring_m97.return_type; const declared_effects = __ring_m97.declared_effects; const span = __ring_m97.span;
      return register_extern_fn(ctx, name, type_params, params, return_type, declared_effects, span);
      break __ring_match97;
    }
    if (__ring_m97._tag === "ExternType") {
      const name = __ring_m97.name; const type_params = __ring_m97.type_params;
      return register_extern_type(ctx, name, type_params);
      break __ring_match97;
    }
    if (__ring_m97._tag === "TypeAlias") {
      const name = __ring_m97.name; const type_params = __ring_m97.type_params; const type_expr = __ring_m97.type_expr;
      return register_type_alias(ctx, name, type_params, type_expr);
      break __ring_match97;
    }
    if (__ring_m97._tag === "Const") {
      const name = __ring_m97.name; const type_annotation = __ring_m97.type_annotation; const span = __ring_m97.span;
      return register_const(ctx, name, type_annotation, span);
      break __ring_match97;
    }
    if (__ring_m97._tag === "Sig") {
      const name = __ring_m97.name; const members = __ring_m97.members; const is_pub = __ring_m97.is_pub;
      return register_sig(ctx, name, members, is_pub);
      break __ring_match97;
    }
    if (__ring_m97._tag === "EffectAlias") {
      const name = __ring_m97.name; const type_params = __ring_m97.type_params; const effects = __ring_m97.effects; const span = __ring_m97.span;
      return register_effect_alias(ctx, name, type_params, effects, span);
      break __ring_match97;
    }
    if (__ring_m97._tag === "Delegate") {
      break __ring_match97;
    }
    if (__ring_m97._tag === "AssocType") {
      break __ring_match97;
    }
    if (__ring_m97._tag === "ModBlock") {
      const mod_name = __ring_m97.name; const mod_decls = __ring_m97.decls;
      return register_mod_block_items(ctx, mod_name, mod_decls, Option_none, Option_none);
      break __ring_match97;
    }
    __match_fail(__ring_m97);
  }
}

function register_decl_public(ctx, decl) {
  return register_decl(ctx, decl);
}

function register_phase2_enum(ctx, decl) {
  __ring_match98: {
    const __ring_m98 = decl;
    if (__ring_m98._tag === "Enum") {
      const name = __ring_m98.name; const type_params = __ring_m98.type_params; const variants = __ring_m98.variants; const span = __ring_m98.span;
      return complete_enum_variants(ctx, name, type_params, variants);
      break __ring_match98;
    }
    if (__ring_m98._tag === "ModBlock") {
      const mod_name = __ring_m98.name; const mod_decls = __ring_m98.decls;
      const __ring_iter_81 = __List_Iterable.iter(mod_decls);
      while (true) {
        const __ring_next_81 = __ListIterator_Iterator.next(__ring_iter_81);
        if (__ring_next_81._tag === "none") break;
        const d = __ring_next_81._0;
        const prefixed = prefix_decl_name(mod_name, d);
        register_phase2_enum(ctx, prefixed);
      }
      break __ring_match98;
    }
    break __ring_match98;
  }
}

function register_phase2_struct(ctx, decl) {
  __ring_match99: {
    const __ring_m99 = decl;
    if (__ring_m99._tag === "Struct") {
      const name = __ring_m99.name; const type_params = __ring_m99.type_params; const fields = __ring_m99.fields; const span = __ring_m99.span;
      return complete_struct_fields(ctx, name, fields);
      break __ring_match99;
    }
    if (__ring_m99._tag === "ModBlock") {
      const mod_name = __ring_m99.name; const mod_decls = __ring_m99.decls;
      const __ring_iter_82 = __List_Iterable.iter(mod_decls);
      while (true) {
        const __ring_next_82 = __ListIterator_Iterator.next(__ring_iter_82);
        if (__ring_next_82._tag === "none") break;
        const d = __ring_next_82._0;
        const prefixed = prefix_decl_name(mod_name, d);
        register_phase2_struct(ctx, prefixed);
      }
      break __ring_match99;
    }
    break __ring_match99;
  }
}

function register_delegate_traits(ctx, methods_map, impl_tv_ids, target_type, field, trait_names, span, impl_scheme_bounds, impl_type_params, field_type_name, ft) {
  const __ring_iter_83 = __List_Iterable.iter(trait_names);
  while (true) {
    const __ring_next_83 = __ListIterator_Iterator.next(__ring_iter_83);
    if (__ring_next_83._tag === "none") break;
    const tname = __ring_next_83._0;
    __ring_match100: {
      const __ring_m100 = _Map_get(ctx.env.trait_reg.traits, tname);
      if (__ring_m100._tag === "none") {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0501, `Unknown trait: ${tname}`, span, diagnostics$DiagnosticContext_TraitError(`unknown trait '${tname}'`));
        break __ring_match100;
      }
      if (__ring_m100._tag === "some") {
        const trait_def = __ring_m100._0;
        if ((!env$has_impl(ctx.env.trait_reg, field_type_name, tname))) {
          const _ = infer_ctx$type_error(ctx.sink, codes$E0508, `type '${field_type_name}' (field '${field}') does not implement trait '${tname}'`, span, diagnostics$DiagnosticContext_TraitError("delegate field type missing trait impl"));
        } else {
          if (env$has_impl(ctx.env.trait_reg, target_type, tname)) {
            const _ = infer_ctx$type_error(ctx.sink, codes$E0509, `trait '${tname}' is already implemented for '${target_type}'; cannot delegate the same trait`, span, diagnostics$DiagnosticContext_TraitError("delegate conflicts with existing impl"));
            continue;
          }
          let all_traits_to_register = [tname];
          const supers = collect_all_supertraits(ctx, tname);
          const __ring_iter_84 = __List_Iterable.iter(supers);
          while (true) {
            const __ring_next_84 = __ListIterator_Iterator.next(__ring_iter_84);
            if (__ring_next_84._tag === "none") break;
            const st_name = __ring_next_84._0;
            List_push(all_traits_to_register, st_name);
          }
          const self_type = resolve_impl_self_type(ctx, target_type, impl_type_params);
          const __ring_iter_85 = __List_Iterable.iter(all_traits_to_register);
          while (true) {
            const __ring_next_85 = __ListIterator_Iterator.next(__ring_iter_85);
            if (__ring_next_85._tag === "none") break;
            const reg_tname = __ring_next_85._0;
            if (env$has_impl(ctx.env.trait_reg, target_type, reg_tname)) {
              continue;
            }
            if ((!env$has_impl(ctx.env.trait_reg, field_type_name, reg_tname))) {
              continue;
            }
            __ring_match101: {
              const __ring_m101 = _Map_get(ctx.env.trait_reg.traits, reg_tname);
              if (__ring_m101._tag === "none") {
                break __ring_match101;
              }
              if (__ring_m101._tag === "some") {
                const reg_trait_def = __ring_m101._0;
                let field_assoc_types = map_new();
                __ring_match102: {
                  const __ring_m102 = env$find_impl(ctx.env.trait_reg, field_type_name, reg_tname);
                  if (__ring_m102._tag === "some") {
                    const field_impl = __ring_m102._0;
                    field_assoc_types = map_clone(field_impl.assoc_types);
                    break __ring_match102;
                  }
                  if (__ring_m102._tag === "none") {
                    break __ring_match102;
                  }
                  __match_fail(__ring_m102);
                }
                let tp_names = [];
                const __ring_iter_86 = __List_Iterable.iter(impl_type_params);
                while (true) {
                  const __ring_next_86 = __ListIterator_Iterator.next(__ring_iter_86);
                  if (__ring_next_86._tag === "none") break;
                  const tp = __ring_next_86._0;
                  List_push(tp_names, tp.name);
                }
                let method_names = [];
                const __ring_iter_87 = __List_Iterable.iter(reg_trait_def.methods);
                while (true) {
                  const __ring_next_87 = __ListIterator_Iterator.next(__ring_iter_87);
                  if (__ring_next_87._tag === "none") break;
                  const tm = __ring_next_87._0;
                  List_push(method_names, tm.name);
                }
                env$add_impl(ctx.env.trait_reg, new env$ImplEntry(reg_tname, target_type, tp_names, method_names, map_clone(field_assoc_types)));
                const field_methods = _Map_get(ctx.env.trait_reg.impl_methods, field_type_name);
                const __ring_iter_88 = __List_Iterable.iter(reg_trait_def.methods);
                while (true) {
                  const __ring_next_88 = __ListIterator_Iterator.next(__ring_iter_88);
                  if (__ring_next_88._tag === "none") break;
                  const tm = __ring_next_88._0;
                  __ring_match103: {
                    const __ring_m103 = tm.ty;
                    if (__ring_m103._tag === "FnType") {
                      const trait_params = __ring_m103.params; const trait_ret_ty = __ring_m103.return_type; const trait_eff = __ring_m103.effects;
                      let __ring_blk14;
                      __ring_match104: {
                        const __ring_m104 = field_methods;
                        if (__ring_m104._tag === "some") {
                          const fm_map = __ring_m104._0;
                          __ring_blk14 = _Map_get(fm_map, tm.name);
                          break __ring_match104;
                        }
                        if (__ring_m104._tag === "none") {
                          __ring_blk14 = Option_none;
                          break __ring_match104;
                        }
                        __match_fail(__ring_m104);
                      }
                      const resolved_method_scheme = __ring_blk14;
                      let __ring_blk15;
                      __ring_match105: {
                        const __ring_m105 = resolved_method_scheme;
                        if (__ring_m105._tag === "some") {
                          const rs = __ring_m105._0;
                          let __ring_blk16;
                          __ring_match106: {
                            const __ring_m106 = rs.ty;
                            if (__ring_m106._tag === "FnType") {
                              const rr = __ring_m106.return_type;
                              __ring_blk16 = rr;
                              break __ring_match106;
                            }
                            __ring_blk16 = trait_ret_ty;
                            break __ring_match106;
                          }
                          __ring_blk15 = __ring_blk16;
                          break __ring_match105;
                        }
                        if (__ring_m105._tag === "none") {
                          __ring_blk15 = trait_ret_ty;
                          break __ring_match105;
                        }
                        __match_fail(__ring_m105);
                      }
                      const ret_ty = __ring_blk15;
                      let __ring_blk17;
                      __ring_match107: {
                        const __ring_m107 = resolved_method_scheme;
                        if (__ring_m107._tag === "some") {
                          const rs = __ring_m107._0;
                          let __ring_blk18;
                          __ring_match108: {
                            const __ring_m108 = rs.ty;
                            if (__ring_m108._tag === "FnType") {
                              const re = __ring_m108.effects;
                              __ring_blk18 = re;
                              break __ring_match108;
                            }
                            __ring_blk18 = trait_eff;
                            break __ring_match108;
                          }
                          __ring_blk17 = __ring_blk18;
                          break __ring_match107;
                        }
                        if (__ring_m107._tag === "none") {
                          __ring_blk17 = trait_eff;
                          break __ring_match107;
                        }
                        __match_fail(__ring_m107);
                      }
                      const eff = __ring_blk17;
                      let param_types = [];
                      let first = true;
                      const __ring_iter_89 = __List_Iterable.iter(trait_params);
                      while (true) {
                        const __ring_next_89 = __ListIterator_Iterator.next(__ring_iter_89);
                        if (__ring_next_89._tag === "none") break;
                        const tp = __ring_next_89._0;
                        if (first) {
                          List_push(param_types, self_type);
                          first = false;
                        } else {
                          List_push(param_types, tp);
                        }
                      }
                      const fn_type = types$Type_FnType(param_types, ret_ty, eff);
                      _Map_insert(methods_map, tm.name, new env$TypeScheme(fn_type, list_clone(impl_tv_ids), impl_scheme_bounds, Option_none));
                      break __ring_match103;
                    }
                    break __ring_match103;
                  }
                }
                break __ring_match101;
              }
              __match_fail(__ring_m101);
            }
          }
        }
        break __ring_match100;
      }
      __match_fail(__ring_m100);
    }
  }
}

function register_delegate(ctx, methods_map, impl_tv_ids, target_type, field, trait_names, span, impl_scheme_bounds, outer_saved, impl_type_params) {
  __ring_match109: {
    const __ring_m109 = _Map_get(ctx.env.types.structs, target_type);
    if (__ring_m109._tag === "none") {
      const _ = infer_ctx$type_error(ctx.sink, codes$E0507, `delegate can only be used on struct types, '${target_type}' is not a struct`, span, diagnostics$DiagnosticContext_TraitError("delegate on non-struct type"));
      break __ring_match109;
    }
    if (__ring_m109._tag === "some") {
      const struct_def = __ring_m109._0;
      let field_type = Option_none;
      const __ring_iter_90 = __List_Iterable.iter(struct_def.fields);
      while (true) {
        const __ring_next_90 = __ListIterator_Iterator.next(__ring_iter_90);
        if (__ring_next_90._tag === "none") break;
        const f = __ring_next_90._0;
        if ((f.name === field)) {
          field_type = Option_some(f.ty);
        }
      }
      __ring_match110: {
        const __ring_m110 = field_type;
        if (__ring_m110._tag === "none") {
          const _ = infer_ctx$type_error(ctx.sink, codes$E0507, `field '${field}' not found in struct '${target_type}'`, span, diagnostics$DiagnosticContext_TraitError("delegate field not found"));
          break __ring_match110;
        }
        if (__ring_m110._tag === "some") {
          const ft = __ring_m110._0;
          let field_type_name = Option_none;
          __ring_match111: {
            const __ring_m111 = ft;
            if (__ring_m111._tag === "StructType") {
              const name = __ring_m111.name;
              field_type_name = Option_some(name);
              break __ring_match111;
            }
            if (__ring_m111._tag === "EnumType") {
              const name = __ring_m111.name;
              field_type_name = Option_some(name);
              break __ring_match111;
            }
            const _ = infer_ctx$type_error(ctx.sink, codes$E0507, `delegate field '${field}' must have a named type (struct or enum)`, span, diagnostics$DiagnosticContext_TraitError("delegate field has unnamed type"));
            break __ring_match111;
          }
          __ring_match112: {
            const __ring_m112 = field_type_name;
            if (__ring_m112._tag === "none") {
              break __ring_match112;
            }
            if (__ring_m112._tag === "some") {
              const ftn = __ring_m112._0;
              return register_delegate_traits(ctx, methods_map, impl_tv_ids, target_type, field, trait_names, span, impl_scheme_bounds, impl_type_params, ftn, ft);
              break __ring_match112;
            }
            __match_fail(__ring_m112);
          }
          break __ring_match110;
        }
        __match_fail(__ring_m110);
      }
      break __ring_match109;
    }
    __match_fail(__ring_m109);
  }
}

function register_phase3_delegate(ctx, decl) {
  __ring_match113: {
    const __ring_m113 = decl;
    if (__ring_m113._tag === "Impl") {
      const target_type = __ring_m113.target_type; const type_params = __ring_m113.type_params; const methods = __ring_m113.methods; const span = __ring_m113.span;
      let has_delegates = false;
      const __ring_iter_91 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_91 = __ListIterator_Iterator.next(__ring_iter_91);
        if (__ring_next_91._tag === "none") break;
        const m = __ring_next_91._0;
        __ring_match114: {
          const __ring_m114 = m;
          if (__ring_m114._tag === "Delegate") {
            has_delegates = true;
            break __ring_match114;
          }
          break __ring_match114;
        }
      }
      if (has_delegates) {
        const saved = map_clone(ctx.type_param_scope);
        let impl_tv_ids = [];
        const __ring_iter_92 = __List_Iterable.iter(type_params);
        while (true) {
          const __ring_next_92 = __ListIterator_Iterator.next(__ring_iter_92);
          if (__ring_next_92._tag === "none") break;
          const tp = __ring_next_92._0;
          const tv = env$TypeEnv_fresh_var(ctx.env);
          __ring_match115: {
            const __ring_m115 = tv;
            if (__ring_m115._tag === "TypeVar") {
              const id = __ring_m115.id;
              List_push(impl_tv_ids, id);
              break __ring_match115;
            }
            break __ring_match115;
          }
          _Map_insert(ctx.type_param_scope, tp.name, tv);
        }
        let impl_scheme_bounds = [];
        let tp_idx = 0;
        const __ring_iter_93 = __List_Iterable.iter(type_params);
        while (true) {
          const __ring_next_93 = __ListIterator_Iterator.next(__ring_iter_93);
          if (__ring_next_93._tag === "none") break;
          const tp = __ring_next_93._0;
          const __ring_iter_94 = __List_Iterable.iter(tp.bounds);
          while (true) {
            const __ring_next_94 = __ListIterator_Iterator.next(__ring_iter_94);
            if (__ring_next_94._tag === "none") break;
            const b = __ring_next_94._0;
            if ((tp_idx < List_len(impl_tv_ids))) {
              const tv_id = Option_unwrap(List_get(impl_tv_ids, tp_idx));
              List_push(impl_scheme_bounds, new env$SchemeBound(tv_id, b.trait_name, []));
              const supers = collect_all_supertraits(ctx, b.trait_name);
              const __ring_iter_95 = __List_Iterable.iter(supers);
              while (true) {
                const __ring_next_95 = __ListIterator_Iterator.next(__ring_iter_95);
                if (__ring_next_95._tag === "none") break;
                const st_name = __ring_next_95._0;
                List_push(impl_scheme_bounds, new env$SchemeBound(tv_id, st_name, []));
              }
            }
          }
          tp_idx = (tp_idx + 1);
        }
        let __ring_blk19;
        __ring_match116: {
          const __ring_m116 = _Map_get(ctx.env.trait_reg.impl_methods, target_type);
          if (__ring_m116._tag === "some") {
            const m = __ring_m116._0;
            __ring_blk19 = m;
            break __ring_match116;
          }
          if (__ring_m116._tag === "none") {
            let new_map = map_new();
            _Map_insert(ctx.env.trait_reg.impl_methods, target_type, new_map);
            __ring_blk19 = new_map;
            break __ring_match116;
          }
          __match_fail(__ring_m116);
        }
        let impl_methods_map = __ring_blk19;
        const __ring_iter_96 = __List_Iterable.iter(methods);
        while (true) {
          const __ring_next_96 = __ListIterator_Iterator.next(__ring_iter_96);
          if (__ring_next_96._tag === "none") break;
          const m = __ring_next_96._0;
          __ring_match117: {
            const __ring_m117 = m;
            if (__ring_m117._tag === "Delegate") {
              const field = __ring_m117.field; const trait_names = __ring_m117.trait_names; const dspan = __ring_m117.span;
              register_delegate(ctx, impl_methods_map, impl_tv_ids, target_type, field, trait_names, dspan, impl_scheme_bounds, saved, type_params);
              break __ring_match117;
            }
            break __ring_match117;
          }
        }
        ctx.type_param_scope = saved;
      }
      break __ring_match113;
    }
    if (__ring_m113._tag === "ModBlock") {
      const mod_name = __ring_m113.name; const mod_decls = __ring_m113.decls;
      const __ring_iter_97 = __List_Iterable.iter(mod_decls);
      while (true) {
        const __ring_next_97 = __ListIterator_Iterator.next(__ring_iter_97);
        if (__ring_next_97._tag === "none") break;
        const d = __ring_next_97._0;
        const prefixed = prefix_decl_name(mod_name, d);
        register_phase3_delegate(ctx, prefixed);
      }
      break __ring_match113;
    }
    break __ring_match113;
  }
}

function register_decls_two_phase(ctx, decls) {
  let deferred_struct_names = [];
  let deferred_enum_names = [];
  const __ring_iter_98 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_98 = __ListIterator_Iterator.next(__ring_iter_98);
    if (__ring_next_98._tag === "none") break;
    const decl = __ring_next_98._0;
    const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(register_phase1(ctx, decl, deferred_struct_names, deferred_enum_names)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  }
  const __ring_iter_99 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_99 = __ListIterator_Iterator.next(__ring_iter_99);
    if (__ring_next_99._tag === "none") break;
    const decl = __ring_next_99._0;
    const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(register_phase2_struct(ctx, decl)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  }
  const __ring_iter_100 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_100 = __ListIterator_Iterator.next(__ring_iter_100);
    if (__ring_next_100._tag === "none") break;
    const decl = __ring_next_100._0;
    const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(register_phase2_enum(ctx, decl)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  }
  const __ring_iter_101 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_101 = __ListIterator_Iterator.next(__ring_iter_101);
    if (__ring_next_101._tag === "none") break;
    const decl = __ring_next_101._0;
    register_phase3_delegate(ctx, decl);
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


export { register_decl_public, insert_mod_aliases, prefix_decl_name, register_decls_two_phase, collect_all_supertraits, resolve_effect_expr, resolve_declared_effects, inject_assoc_types_from_bounds };