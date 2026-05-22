import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_contains, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst_map as env$apply_subst_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __IdGen_Eq as env$__IdGen_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __ImplEntry_Clone as env$__ImplEntry_Clone, __FnBound_Clone as env$__FnBound_Clone, __IdGen_Clone as env$__IdGen_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __IdGen_Ord as env$__IdGen_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __ImplEntry_Debug as env$__ImplEntry_Debug, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0405 as codes$E0405, E0504 as codes$E0504, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, error_description as codes$error_description, error_category as codes$error_category } from "./codes.js";
import { new_infer_ctx as infer_ctx$new_infer_ctx, type_error as infer_ctx$type_error, merge_effects as infer_ctx$merge_effects, unify_at as infer_ctx$unify_at, free_type_vars as infer_ctx$free_type_vars, collect_free_vars as infer_ctx$collect_free_vars, free_type_vars_in_env as infer_ctx$free_type_vars_in_env, generalize as infer_ctx$generalize, update_fn_effects as infer_ctx$update_fn_effects, build_scheme_var_map as infer_ctx$build_scheme_var_map, resolve_dicts_from_scheme as infer_ctx$resolve_dicts_from_scheme, resolve_type_expr as infer_ctx$resolve_type_expr, resolve_self_type as infer_ctx$resolve_self_type, resolve_named_type as infer_ctx$resolve_named_type, bind_pattern as infer_ctx$bind_pattern, remove_fail_effect as infer_ctx$remove_fail_effect, remove_specific_fail_effect as infer_ctx$remove_specific_fail_effect, resolve_relative_qualifier as infer_ctx$resolve_relative_qualifier, InferResult as infer_ctx$InferResult, FnBoundsEntry as infer_ctx$FnBoundsEntry, CompileError as infer_ctx$CompileError, InferCtx as infer_ctx$InferCtx, __FnBoundsEntry_Eq as infer_ctx$__FnBoundsEntry_Eq, __CompileError_Eq as infer_ctx$__CompileError_Eq, __FnBoundsEntry_Clone as infer_ctx$__FnBoundsEntry_Clone, __CompileError_Clone as infer_ctx$__CompileError_Clone, __FnBoundsEntry_Ord as infer_ctx$__FnBoundsEntry_Ord, __CompileError_Ord as infer_ctx$__CompileError_Ord, __FnBoundsEntry_Debug as infer_ctx$__FnBoundsEntry_Debug, __CompileError_Debug as infer_ctx$__CompileError_Debug } from "./infer_ctx.js";

function List_first(self) {
  return List_get(self, 0);
}
function List_last(self) {
  return List_get(self, (List_len(self) - 1));
}
function List_is_empty(self) {
  return (List_len(self) === 0);
}

function _Map_is_empty(self) {
  return (_Map_len(self) === 0);
}

function _Set_is_empty(self) {
  return (_Set_len(self) === 0);
}

function register_decl_public(ctx, decl) {
  return register_decl(ctx, decl);
}

function insert_mod_aliases(ctx, mod_name, decls, guard) {
  for (const d of decls) {
    __ring_match0: {
      const __ring_m0 = d;
      if (__ring_m0._tag === "Struct") {
        const name = __ring_m0.name;
        const qualified = `${mod_name}::${name}`;
        if (((!guard) || (!_Map_contains_key(ctx.env.types.structs, name)))) {
          __ring_match1: {
            const __ring_m1 = _Map_get(ctx.env.types.structs, qualified);
            if (__ring_m1._tag === "some") {
              const sdef = __ring_m1._0;
              _Map_insert(ctx.env.types.structs, name, sdef);
              break __ring_match1;
            }
            if (__ring_m1._tag === "none") {
              break __ring_match1;
            }
            __match_fail(__ring_m1);
          }
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "Enum") {
        const name = __ring_m0.name;
        const qualified = `${mod_name}::${name}`;
        if (((!guard) || (!_Map_contains_key(ctx.env.types.enums, name)))) {
          __ring_match2: {
            const __ring_m2 = _Map_get(ctx.env.types.enums, qualified);
            if (__ring_m2._tag === "some") {
              const edef = __ring_m2._0;
              _Map_insert(ctx.env.types.enums, name, edef);
              break __ring_match2;
            }
            if (__ring_m2._tag === "none") {
              break __ring_match2;
            }
            __match_fail(__ring_m2);
          }
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "Trait") {
        const name = __ring_m0.name;
        const qualified = `${mod_name}::${name}`;
        if (((!guard) || (!_Map_contains_key(ctx.env.trait_reg.traits, name)))) {
          __ring_match3: {
            const __ring_m3 = _Map_get(ctx.env.trait_reg.traits, qualified);
            if (__ring_m3._tag === "some") {
              const tdef = __ring_m3._0;
              _Map_insert(ctx.env.trait_reg.traits, name, tdef);
              break __ring_match3;
            }
            if (__ring_m3._tag === "none") {
              break __ring_match3;
            }
            __match_fail(__ring_m3);
          }
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "Effect") {
        const name = __ring_m0.name;
        const qualified = `${mod_name}::${name}`;
        if (((!guard) || (!_Map_contains_key(ctx.env.types.effects, name)))) {
          __ring_match4: {
            const __ring_m4 = _Map_get(ctx.env.types.effects, qualified);
            if (__ring_m4._tag === "some") {
              const edef = __ring_m4._0;
              _Map_insert(ctx.env.types.effects, name, edef);
              break __ring_match4;
            }
            if (__ring_m4._tag === "none") {
              break __ring_match4;
            }
            __match_fail(__ring_m4);
          }
        }
        break __ring_match0;
      }
      break __ring_match0;
    }
  }
}

function prefix_decl_name(mod_name, decl) {
  __ring_match5: {
    const __ring_m5 = decl;
    if (__ring_m5._tag === "Fn") {
      const name = __ring_m5.name; const type_params = __ring_m5.type_params; const params = __ring_m5.params; const return_type = __ring_m5.return_type; const declared_effects = __ring_m5.declared_effects; const body = __ring_m5.body; const is_pub = __ring_m5.is_pub; const is_abstract = __ring_m5.is_abstract; const span = __ring_m5.span;
      return ast$Decl_Fn(`${mod_name}::${name}`, type_params, params, return_type, declared_effects, body, is_pub, is_abstract, span);
      break __ring_match5;
    }
    if (__ring_m5._tag === "Struct") {
      const name = __ring_m5.name; const type_params = __ring_m5.type_params; const fields = __ring_m5.fields; const is_pub = __ring_m5.is_pub; const span = __ring_m5.span;
      return ast$Decl_Struct(`${mod_name}::${name}`, type_params, fields, is_pub, span);
      break __ring_match5;
    }
    if (__ring_m5._tag === "Enum") {
      const name = __ring_m5.name; const type_params = __ring_m5.type_params; const variants = __ring_m5.variants; const is_pub = __ring_m5.is_pub; const span = __ring_m5.span;
      return ast$Decl_Enum(`${mod_name}::${name}`, type_params, variants, is_pub, span);
      break __ring_match5;
    }
    if (__ring_m5._tag === "ExternFn") {
      const name = __ring_m5.name; const type_params = __ring_m5.type_params; const params = __ring_m5.params; const return_type = __ring_m5.return_type; const declared_effects = __ring_m5.declared_effects; const is_pub = __ring_m5.is_pub; const span = __ring_m5.span;
      return ast$Decl_ExternFn(`${mod_name}::${name}`, type_params, params, return_type, declared_effects, is_pub, span);
      break __ring_match5;
    }
    if (__ring_m5._tag === "Const") {
      const name = __ring_m5.name; const type_annotation = __ring_m5.type_annotation; const init = __ring_m5.init; const is_pub = __ring_m5.is_pub; const span = __ring_m5.span;
      return ast$Decl_Const(`${mod_name}::${name}`, type_annotation, init, is_pub, span);
      break __ring_match5;
    }
    if (__ring_m5._tag === "Sig") {
      const name = __ring_m5.name; const members = __ring_m5.members; const is_pub = __ring_m5.is_pub; const span = __ring_m5.span;
      return ast$Decl_Sig(`${mod_name}::${name}`, members, is_pub, span);
      break __ring_match5;
    }
    if (__ring_m5._tag === "Impl") {
      const target_type = __ring_m5.target_type; const type_params = __ring_m5.type_params; const trait_name = __ring_m5.trait_name; const methods = __ring_m5.methods; const span = __ring_m5.span;
      return ast$Decl_Impl(`${mod_name}::${target_type}`, type_params, trait_name, methods, span);
      break __ring_match5;
    }
    if (__ring_m5._tag === "Trait") {
      const name = __ring_m5.name; const type_params = __ring_m5.type_params; const supertraits = __ring_m5.supertraits; const methods = __ring_m5.methods; const is_pub = __ring_m5.is_pub; const span = __ring_m5.span;
      return ast$Decl_Trait(`${mod_name}::${name}`, type_params, supertraits, methods, is_pub, span);
      break __ring_match5;
    }
    if (__ring_m5._tag === "Effect") {
      const name = __ring_m5.name; const type_params = __ring_m5.type_params; const ops = __ring_m5.ops; const is_pub = __ring_m5.is_pub; const span = __ring_m5.span;
      return ast$Decl_Effect(`${mod_name}::${name}`, type_params, ops, is_pub, span);
      break __ring_match5;
    }
    if (__ring_m5._tag === "ExternType") {
      const name = __ring_m5.name; const type_params = __ring_m5.type_params; const is_pub = __ring_m5.is_pub; const span = __ring_m5.span;
      return ast$Decl_ExternType(`${mod_name}::${name}`, type_params, is_pub, span);
      break __ring_match5;
    }
    if (__ring_m5._tag === "TypeAlias") {
      const name = __ring_m5.name; const type_params = __ring_m5.type_params; const type_expr = __ring_m5.type_expr; const is_pub = __ring_m5.is_pub; const span = __ring_m5.span;
      return ast$Decl_TypeAlias(`${mod_name}::${name}`, type_params, type_expr, is_pub, span);
      break __ring_match5;
    }
    return decl;
    break __ring_match5;
  }
}

function register_phase1(ctx, decl, deferred_struct_names, deferred_enum_names) {
  __ring_match6: {
    const __ring_m6 = decl;
    if (__ring_m6._tag === "Struct") {
      const name = __ring_m6.name; const type_params = __ring_m6.type_params; const fields = __ring_m6.fields; const span = __ring_m6.span;
      preregister_struct(ctx, name, type_params);
      return List_push(deferred_struct_names, name);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Enum") {
      const name = __ring_m6.name; const type_params = __ring_m6.type_params; const variants = __ring_m6.variants; const span = __ring_m6.span;
      preregister_enum(ctx, name, type_params);
      return List_push(deferred_enum_names, name);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ModBlock") {
      const mod_name = __ring_m6.name; const mod_decls = __ring_m6.decls;
      for (const d of mod_decls) {
        __ring_match7: {
          const __ring_m7 = d;
          if (__ring_m7._tag === "Struct") {
            const prefixed = prefix_decl_name(mod_name, d);
            register_phase1(ctx, prefixed, deferred_struct_names, deferred_enum_names);
            break __ring_match7;
          }
          if (__ring_m7._tag === "Enum") {
            const prefixed = prefix_decl_name(mod_name, d);
            register_phase1(ctx, prefixed, deferred_struct_names, deferred_enum_names);
            break __ring_match7;
          }
          break __ring_match7;
        }
      }
      for (const d of mod_decls) {
        __ring_match8: {
          const __ring_m8 = d;
          if (__ring_m8._tag === "Trait") {
            const prefixed = prefix_decl_name(mod_name, d);
            register_phase1(ctx, prefixed, deferred_struct_names, deferred_enum_names);
            break __ring_match8;
          }
          if (__ring_m8._tag === "Effect") {
            const prefixed = prefix_decl_name(mod_name, d);
            register_phase1(ctx, prefixed, deferred_struct_names, deferred_enum_names);
            break __ring_match8;
          }
          if (__ring_m8._tag === "ExternType") {
            const prefixed = prefix_decl_name(mod_name, d);
            register_phase1(ctx, prefixed, deferred_struct_names, deferred_enum_names);
            break __ring_match8;
          }
          break __ring_match8;
        }
      }
      insert_mod_aliases(ctx, mod_name, mod_decls, true);
      for (const d of mod_decls) {
        __ring_match9: {
          const __ring_m9 = d;
          if (__ring_m9._tag === "Struct") {
            break __ring_match9;
          }
          if (__ring_m9._tag === "Enum") {
            break __ring_match9;
          }
          if (__ring_m9._tag === "Trait") {
            break __ring_match9;
          }
          if (__ring_m9._tag === "Effect") {
            break __ring_match9;
          }
          if (__ring_m9._tag === "ExternType") {
            break __ring_match9;
          }
          const prefixed = prefix_decl_name(mod_name, d);
          register_phase1(ctx, prefixed, deferred_struct_names, deferred_enum_names);
          break __ring_match9;
        }
      }
      break __ring_match6;
    }
    return register_decl(ctx, decl);
    break __ring_match6;
  }
}

function register_phase2_struct(ctx, decl) {
  __ring_match10: {
    const __ring_m10 = decl;
    if (__ring_m10._tag === "Struct") {
      const name = __ring_m10.name; const type_params = __ring_m10.type_params; const fields = __ring_m10.fields; const span = __ring_m10.span;
      return complete_struct_fields(ctx, name, fields);
      break __ring_match10;
    }
    if (__ring_m10._tag === "ModBlock") {
      const mod_name = __ring_m10.name; const mod_decls = __ring_m10.decls;
      for (const d of mod_decls) {
        const prefixed = prefix_decl_name(mod_name, d);
        register_phase2_struct(ctx, prefixed);
      }
      break __ring_match10;
    }
    break __ring_match10;
  }
}

function register_phase2_enum(ctx, decl) {
  __ring_match11: {
    const __ring_m11 = decl;
    if (__ring_m11._tag === "Enum") {
      const name = __ring_m11.name; const type_params = __ring_m11.type_params; const variants = __ring_m11.variants; const span = __ring_m11.span;
      return complete_enum_variants(ctx, name, type_params, variants);
      break __ring_match11;
    }
    if (__ring_m11._tag === "ModBlock") {
      const mod_name = __ring_m11.name; const mod_decls = __ring_m11.decls;
      for (const d of mod_decls) {
        const prefixed = prefix_decl_name(mod_name, d);
        register_phase2_enum(ctx, prefixed);
      }
      break __ring_match11;
    }
    break __ring_match11;
  }
}

function register_decls_two_phase(ctx, decls) {
  let deferred_struct_names = [];
  let deferred_enum_names = [];
  for (const decl of decls) {
    const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(register_phase1(ctx, decl, deferred_struct_names, deferred_enum_names)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  }
  for (const decl of decls) {
    const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(register_phase2_struct(ctx, decl)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  }
  for (const decl of decls) {
    const result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(register_phase2_enum(ctx, decl)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  }
}

function preregister_struct(ctx, name, type_params) {
  let tp_names = [];
  let tp_vars = [];
  for (const tp of type_params) {
    List_push(tp_names, tp.name);
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match12: {
      const __ring_m12 = tv;
      if (__ring_m12._tag === "TypeVar") {
        const id = __ring_m12.id;
        List_push(tp_vars, id);
        break __ring_match12;
      }
      break __ring_match12;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  const def = new env$StructDef(name, tp_names, tp_vars, []);
  return _Map_insert(ctx.env.types.structs, name, def);
}

function complete_struct_fields(ctx, name, fields) {
  __ring_match13: {
    const __ring_m13 = _Map_get(ctx.env.types.structs, name);
    if (__ring_m13._tag === "some") {
      const def = __ring_m13._0;
      const saved = map_clone(ctx.type_param_scope);
      let i = 0;
      while ((i < List_len(def.type_params))) {
        __ring_match14: {
          const __ring_m14 = [List_get(def.type_params, i), List_get(def.type_param_vars, i)];
          if (Array.isArray(__ring_m14) && __ring_m14.length === 2 && __ring_m14[0]._tag === "some" && __ring_m14[1]._tag === "some") {
            const tp_name = __ring_m14[0]._0; const tp_var = __ring_m14[1]._0;
            _Map_insert(ctx.type_param_scope, tp_name, types$Type_TypeVar(tp_var, Option_none));
            break __ring_match14;
          }
          break __ring_match14;
        }
        i = (i + 1);
      }
      for (const f of fields) {
        List_push(def.fields, new types$StructField(f.name, infer_ctx$resolve_type_expr(ctx, f.type_annotation), f.is_pub));
      }
      ctx.type_param_scope = saved;
      break __ring_match13;
    }
    if (__ring_m13._tag === "none") {
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
}

function preregister_enum(ctx, name, type_params) {
  let tp_names = [];
  let tv_ids = [];
  for (const tp of type_params) {
    List_push(tp_names, tp.name);
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match15: {
      const __ring_m15 = tv;
      if (__ring_m15._tag === "TypeVar") {
        const id = __ring_m15.id;
        List_push(tv_ids, id);
        break __ring_match15;
      }
      break __ring_match15;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  const def = new env$EnumDef(name, tp_names, tv_ids, []);
  return _Map_insert(ctx.env.types.enums, name, def);
}

function complete_enum_variants(ctx, name, type_params, variants) {
  __ring_match16: {
    const __ring_m16 = _Map_get(ctx.env.types.enums, name);
    if (__ring_m16._tag === "some") {
      const def = __ring_m16._0;
      const saved = map_clone(ctx.type_param_scope);
      let tv_types = [];
      let i = 0;
      while ((i < List_len(def.type_params))) {
        __ring_match17: {
          const __ring_m17 = [List_get(def.type_params, i), List_get(def.type_param_vars, i)];
          if (Array.isArray(__ring_m17) && __ring_m17.length === 2 && __ring_m17[0]._tag === "some" && __ring_m17[1]._tag === "some") {
            const tp_name = __ring_m17[0]._0; const tp_var = __ring_m17[1]._0;
            const tv = types$Type_TypeVar(tp_var, Option_none);
            _Map_insert(ctx.type_param_scope, tp_name, tv);
            List_push(tv_types, tv);
            break __ring_match17;
          }
          break __ring_match17;
        }
        i = (i + 1);
      }
      for (const v of variants) {
        __ring_match18: {
          const __ring_m18 = v.named_fields;
          if (__ring_m18._tag === "some") {
            const nf = __ring_m18._0;
            if ((List_len(nf) > 0)) {
              let field_types = [];
              let field_names = [];
              for (const f of nf) {
                List_push(field_types, infer_ctx$resolve_type_expr(ctx, f.type_expr));
                List_push(field_names, f.name);
              }
              List_push(def.variants, new types$EnumVariant(v.name, field_types, Option_some(field_names)));
            } else {
              let field_types = [];
              for (const f of v.fields) {
                List_push(field_types, infer_ctx$resolve_type_expr(ctx, f));
              }
              List_push(def.variants, new types$EnumVariant(v.name, field_types, Option_none));
            }
            break __ring_match18;
          }
          if (__ring_m18._tag === "none") {
            let field_types = [];
            for (const f of v.fields) {
              List_push(field_types, infer_ctx$resolve_type_expr(ctx, f));
            }
            List_push(def.variants, new types$EnumVariant(v.name, field_types, Option_none));
            break __ring_match18;
          }
          __match_fail(__ring_m18);
        }
      }
      const enum_type = types$Type_EnumType(name, tv_types, def.variants);
      const tv_ids = def.type_param_vars;
      for (const variant of def.variants) {
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
      break __ring_match16;
    }
    if (__ring_m16._tag === "none") {
      break __ring_match16;
    }
    __match_fail(__ring_m16);
  }
}

function bind_variant_constructor(ctx, variant_name, enum_type, tv_ids) {
  if ((List_len(tv_ids) > 0)) {
    return env$TypeEnv_bind(ctx.env, variant_name, new env$TypeScheme(enum_type, tv_ids, [], Option_none));
  } else {
    return env$TypeEnv_bind_mono(ctx.env, variant_name, enum_type);
  }
}

function register_effect(ctx, name, type_params, ops) {
  const saved = map_clone(ctx.type_param_scope);
  let tp_names = [];
  let tp_vars = [];
  for (const tp of type_params) {
    List_push(tp_names, tp.name);
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match19: {
      const __ring_m19 = tv;
      if (__ring_m19._tag === "TypeVar") {
        const id = __ring_m19.id;
        List_push(tp_vars, id);
        break __ring_match19;
      }
      break __ring_match19;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  let effect_ops = [];
  for (const op of ops) {
    let param_types = [];
    for (const p of op.params) {
      __ring_match20: {
        const __ring_m20 = p.type_annotation;
        if (__ring_m20._tag === "some") {
          const ta = __ring_m20._0;
          List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
          break __ring_match20;
        }
        if (__ring_m20._tag === "none") {
          List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
          break __ring_match20;
        }
        __match_fail(__ring_m20);
      }
    }
    const ret = infer_ctx$resolve_type_expr(ctx, op.return_type);
    List_push(effect_ops, new env$EffectOpDef(op.name, param_types, ret));
  }
  ctx.type_param_scope = saved;
  return _Map_insert(ctx.env.types.effects, name, new env$EffectDef(name, tp_names, tp_vars, effect_ops, Option_none));
}

function register_trait(ctx, name, type_params, methods) {
  const saved = map_clone(ctx.type_param_scope);
  let tp_names = [];
  let tp_vars = [];
  for (const tp of type_params) {
    List_push(tp_names, tp.name);
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match21: {
      const __ring_m21 = tv;
      if (__ring_m21._tag === "TypeVar") {
        const id = __ring_m21.id;
        List_push(tp_vars, id);
        break __ring_match21;
      }
      break __ring_match21;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  const self_var = env$TypeEnv_fresh_var(ctx.env);
  let trait_methods = [];
  for (const method of methods) {
    __ring_match22: {
      const __ring_m22 = method;
      if (__ring_m22._tag === "Fn") {
        const mname = __ring_m22.name; const params = __ring_m22.params; const return_type = __ring_m22.return_type; const is_abstract = __ring_m22.is_abstract;
        let param_types = [];
        for (const p of params) {
          if ((p.name === "self")) {
            List_push(param_types, self_var);
          } else {
            __ring_match23: {
              const __ring_m23 = p.type_annotation;
              if (__ring_m23._tag === "some") {
                const ta = __ring_m23._0;
                List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
                break __ring_match23;
              }
              if (__ring_m23._tag === "none") {
                List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
                break __ring_match23;
              }
              __match_fail(__ring_m23);
            }
          }
        }
        const ret = (function() {
  const __ring_m = return_type;
  if (__ring_m._tag === "some") { const rt = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, rt); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})();
        const fn_type = types$Type_FnType(param_types, ret, types$EMPTY_ROW);
        List_push(trait_methods, new env$TraitMethodDef(mname, fn_type, (!is_abstract)));
        break __ring_match22;
      }
      break __ring_match22;
    }
  }
  ctx.type_param_scope = saved;
  return _Map_insert(ctx.env.trait_reg.traits, name, new env$TraitDef(name, tp_names, tp_vars, trait_methods));
}

function register_impl(ctx, target_type, type_params, trait_name, methods, span) {
  let impl_methods_map = (function() {
  const __ring_m = _Map_get(ctx.env.trait_reg.impl_methods, target_type);
  if (__ring_m._tag === "some") { const m = __ring_m._0; return m; }
  if (__ring_m._tag === "none") { return (function() {
  let new_map = map_new();
  _Map_insert(ctx.env.trait_reg.impl_methods, target_type, new_map);
  return new_map;
})(); }
  __match_fail(__ring_m);
})();
  const saved = map_clone(ctx.type_param_scope);
  let impl_tv_ids = [];
  for (const tp of type_params) {
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match24: {
      const __ring_m24 = tv;
      if (__ring_m24._tag === "TypeVar") {
        const id = __ring_m24.id;
        List_push(impl_tv_ids, id);
        break __ring_match24;
      }
      break __ring_match24;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  let impl_scheme_bounds = [];
  let tp_idx = 0;
  for (const tp of type_params) {
    for (const b of tp.bounds) {
      if ((tp_idx < List_len(impl_tv_ids))) {
        List_push(impl_scheme_bounds, new env$SchemeBound(Option_unwrap(List_get(impl_tv_ids, tp_idx)), b.trait_name));
      }
    }
    tp_idx = (tp_idx + 1);
  }
  for (const method of methods) {
    __ring_match25: {
      const __ring_m25 = method;
      if (__ring_m25._tag === "Fn") {
        const mname = __ring_m25.name; const mtps = __ring_m25.type_params; const params = __ring_m25.params; const return_type = __ring_m25.return_type; const declared_effects = __ring_m25.declared_effects;
        register_impl_method(ctx, impl_methods_map, impl_tv_ids, target_type, mname, mtps, params, return_type, declared_effects, impl_scheme_bounds, saved, type_params);
        break __ring_match25;
      }
      if (__ring_m25._tag === "ExternFn") {
        const mname = __ring_m25.name; const mtps = __ring_m25.type_params; const params = __ring_m25.params; const return_type = __ring_m25.return_type; const declared_effects = __ring_m25.declared_effects;
        register_impl_extern_method(ctx, impl_methods_map, impl_tv_ids, target_type, mname, mtps, params, return_type, declared_effects, impl_scheme_bounds, saved, type_params);
        break __ring_match25;
      }
      break __ring_match25;
    }
  }
  __ring_match26: {
    const __ring_m26 = trait_name;
    if (__ring_m26._tag === "some") {
      const tname = __ring_m26._0;
      __ring_match27: {
        const __ring_m27 = _Map_get(ctx.env.trait_reg.traits, tname);
        if (__ring_m27._tag === "some") {
          const trait_def = __ring_m27._0;
          let impl_method_names = set_new();
          for (const m of methods) {
            __ring_match28: {
              const __ring_m28 = m;
              if (__ring_m28._tag === "Fn") {
                const mn = __ring_m28.name;
                _Set_insert(impl_method_names, mn);
                break __ring_match28;
              }
              break __ring_match28;
            }
          }
          for (const tm of trait_def.methods) {
            if (((!tm.has_default) && (!_Set_contains(impl_method_names, tm.name)))) {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0502, `Missing method '${tm.name}' in impl ${tname} for ${target_type}`, span, diagnostics$DiagnosticContext_TraitError(`missing method '${tm.name}'`));
            }
          }
          let tp_names = [];
          for (const tp of type_params) {
            List_push(tp_names, tp.name);
          }
          let method_names = [];
          for (const m of methods) {
            __ring_match29: {
              const __ring_m29 = m;
              if (__ring_m29._tag === "Fn") {
                const mn = __ring_m29.name;
                List_push(method_names, mn);
                break __ring_match29;
              }
              if (__ring_m29._tag === "ExternFn") {
                const mn = __ring_m29.name;
                List_push(method_names, mn);
                break __ring_match29;
              }
              break __ring_match29;
            }
          }
          List_push(ctx.env.trait_reg.trait_impls, new env$ImplEntry(tname, target_type, tp_names, method_names));
          break __ring_match27;
        }
        if (__ring_m27._tag === "none") {
          const _ = infer_ctx$type_error(ctx.sink, codes$E0501, `Unknown trait: ${tname}`, span, diagnostics$DiagnosticContext_TraitError(`unknown trait '${tname}'`));
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
  ctx.type_param_scope = saved;
}

function resolve_impl_self_type(ctx, target_type, impl_type_params) {
  if ((List_len(impl_type_params) === 0)) {
    return infer_ctx$resolve_self_type(ctx, target_type);
  }
  let impl_tp_types = [];
  for (const tp of impl_type_params) {
    __ring_match30: {
      const __ring_m30 = _Map_get(ctx.type_param_scope, tp.name);
      if (__ring_m30._tag === "some") {
        const tv = __ring_m30._0;
        List_push(impl_tp_types, tv);
        break __ring_match30;
      }
      if (__ring_m30._tag === "none") {
        List_push(impl_tp_types, env$TypeEnv_fresh_var(ctx.env));
        break __ring_match30;
      }
      __match_fail(__ring_m30);
    }
  }
  __ring_match31: {
    const __ring_m31 = _Map_get(ctx.env.types.structs, target_type);
    if (__ring_m31._tag === "some") {
      const def = __ring_m31._0;
      return types$Type_StructType(def.name, impl_tp_types, def.fields);
      break __ring_match31;
    }
    if (__ring_m31._tag === "none") {
      __ring_match32: {
        const __ring_m32 = _Map_get(ctx.env.types.enums, target_type);
        if (__ring_m32._tag === "some") {
          const def = __ring_m32._0;
          return types$Type_EnumType(def.name, impl_tp_types, def.variants);
          break __ring_match32;
        }
        if (__ring_m32._tag === "none") {
          return infer_ctx$resolve_self_type(ctx, target_type);
          break __ring_match32;
        }
        __match_fail(__ring_m32);
      }
      break __ring_match31;
    }
    __match_fail(__ring_m31);
  }
}

function register_impl_method(ctx, methods_map, impl_tv_ids, target_type, mname, mtps, params, return_type, declared_effects, impl_scheme_bounds, outer_saved, impl_type_params) {
  const saved_method = map_clone(ctx.type_param_scope);
  let method_tv_ids = [];
  for (const mtp of mtps) {
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match33: {
      const __ring_m33 = tv;
      if (__ring_m33._tag === "TypeVar") {
        const id = __ring_m33.id;
        List_push(method_tv_ids, id);
        break __ring_match33;
      }
      break __ring_match33;
    }
    _Map_insert(ctx.type_param_scope, mtp.name, tv);
  }
  const self_type = resolve_impl_self_type(ctx, target_type, impl_type_params);
  let param_types = [];
  for (const p of params) {
    __ring_match34: {
      const __ring_m34 = p.type_annotation;
      if (__ring_m34._tag === "some") {
        const ta = __ring_m34._0;
        List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
        break __ring_match34;
      }
      if (__ring_m34._tag === "none") {
        if ((p.name === "self")) {
          List_push(param_types, self_type);
        } else {
          List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
        }
        break __ring_match34;
      }
      __match_fail(__ring_m34);
    }
  }
  const ret = (function() {
  const __ring_m = return_type;
  if (__ring_m._tag === "some") { const rt = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, rt); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})();
  let all_tvs = list_clone(impl_tv_ids);
  for (const mtv of method_tv_ids) {
    List_push(all_tvs, mtv);
  }
  let declared_names = set_new();
  for (const entry of _Map_entries(ctx.type_param_scope)) {
    const __ring_dt0 = entry;
    const tpname = __ring_dt0[0];
    if (_Map_contains_key(outer_saved, tpname)) {
      _Set_insert(declared_names, tpname);
    }
  }
  for (const entry of _Map_entries(ctx.type_param_scope)) {
    const __ring_dt1 = entry;
    const tpname = __ring_dt1[0];
    const tv = __ring_dt1[1];
    if (((!_Map_contains_key(outer_saved, tpname)) && (!_Set_contains(declared_names, tpname)))) {
      __ring_match35: {
        const __ring_m35 = tv;
        if (__ring_m35._tag === "TypeVar") {
          const id = __ring_m35.id;
          if ((!List_contains(all_tvs, id))) {
            List_push(all_tvs, id);
          }
          break __ring_match35;
        }
        break __ring_match35;
      }
    }
  }
  const impl_m_effects = (function() {
  const __ring_m = declared_effects;
  if (__ring_m._tag === "some") { const de = __ring_m._0; return resolve_declared_effects(ctx, de); }
  if (__ring_m._tag === "none") { return types$EMPTY_ROW; }
  __match_fail(__ring_m);
})();
  const fn_type = types$Type_FnType(param_types, ret, impl_m_effects);
  _Map_insert(methods_map, mname, new env$TypeScheme(fn_type, all_tvs, impl_scheme_bounds, Option_none));
  if ((List_len(params) > 0)) {
    __ring_match36: {
      const __ring_m36 = List_first(params);
      if (__ring_m36._tag === "some") {
        const first_p = __ring_m36._0;
        if (((first_p.name === "self") && first_p.is_mutable)) {
          let mut_set = (function() {
  const __ring_m = _Map_get(ctx.env.trait_reg.mut_methods, target_type);
  if (__ring_m._tag === "some") { const s = __ring_m._0; return s; }
  if (__ring_m._tag === "none") { return (function() {
  let new_set = set_new();
  _Map_insert(ctx.env.trait_reg.mut_methods, target_type, new_set);
  return new_set;
})(); }
  __match_fail(__ring_m);
})();
          _Set_insert(mut_set, mname);
        }
        break __ring_match36;
      }
      if (__ring_m36._tag === "none") {
        break __ring_match36;
      }
      __match_fail(__ring_m36);
    }
  }
  ctx.type_param_scope = saved_method;
}

function register_impl_extern_method(ctx, methods_map, impl_tv_ids, target_type, mname, mtps, params, return_type, declared_effects, impl_scheme_bounds, outer_saved, impl_type_params) {
  const saved_method = map_clone(ctx.type_param_scope);
  let method_tv_ids = [];
  for (const mtp of mtps) {
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match37: {
      const __ring_m37 = tv;
      if (__ring_m37._tag === "TypeVar") {
        const id = __ring_m37.id;
        List_push(method_tv_ids, id);
        break __ring_match37;
      }
      break __ring_match37;
    }
    _Map_insert(ctx.type_param_scope, mtp.name, tv);
  }
  const self_type = resolve_impl_self_type(ctx, target_type, impl_type_params);
  let param_types = [];
  for (const p of params) {
    __ring_match38: {
      const __ring_m38 = p.type_annotation;
      if (__ring_m38._tag === "some") {
        const ta = __ring_m38._0;
        List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
        break __ring_match38;
      }
      if (__ring_m38._tag === "none") {
        if ((p.name === "self")) {
          List_push(param_types, self_type);
        } else {
          List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
        }
        break __ring_match38;
      }
      __match_fail(__ring_m38);
    }
  }
  const ret = (function() {
  const __ring_m = return_type;
  if (__ring_m._tag === "some") { const rt = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, rt); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})();
  let all_tvs = list_clone(impl_tv_ids);
  for (const mtv of method_tv_ids) {
    List_push(all_tvs, mtv);
  }
  const impl_ext_effects = (function() {
  const __ring_m = declared_effects;
  if (__ring_m._tag === "some") { const de = __ring_m._0; return resolve_declared_effects(ctx, de); }
  if (__ring_m._tag === "none") { return types$EMPTY_ROW; }
  __match_fail(__ring_m);
})();
  const fn_type = types$Type_FnType(param_types, ret, impl_ext_effects);
  _Map_insert(methods_map, mname, new env$TypeScheme(fn_type, all_tvs, impl_scheme_bounds, Option_none));
  if ((List_len(params) > 0)) {
    __ring_match39: {
      const __ring_m39 = List_first(params);
      if (__ring_m39._tag === "some") {
        const first_p = __ring_m39._0;
        if (((first_p.name === "self") && first_p.is_mutable)) {
          let mut_set = (function() {
  const __ring_m = _Map_get(ctx.env.trait_reg.mut_methods, target_type);
  if (__ring_m._tag === "some") { const s = __ring_m._0; return s; }
  if (__ring_m._tag === "none") { return (function() {
  let new_set = set_new();
  _Map_insert(ctx.env.trait_reg.mut_methods, target_type, new_set);
  return new_set;
})(); }
  __match_fail(__ring_m);
})();
          _Set_insert(mut_set, mname);
        }
        break __ring_match39;
      }
      if (__ring_m39._tag === "none") {
        break __ring_match39;
      }
      __match_fail(__ring_m39);
    }
  }
  ctx.type_param_scope = saved_method;
}

function resolve_effect_expr(ctx, eff) {
  if ((eff.name === "io")) {
    return types$Effect_IoEffect;
  }
  if ((eff.name === "mut")) {
    const mut_state = ((List_len(eff.type_args) > 0) ? (function() {
  const __ring_m = List_first(eff.type_args);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, t); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})() : env$TypeEnv_fresh_var(ctx.env));
    return types$Effect_MutEffect(mut_state);
  }
  if ((eff.name === "fail")) {
    const err_type = ((List_len(eff.type_args) > 0) ? (function() {
  const __ring_m = List_first(eff.type_args);
  if (__ring_m._tag === "some") { const t = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, t); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})() : env$TypeEnv_fresh_var(ctx.env));
    return types$Effect_FailEffect(err_type);
  }
  let resolved_args = [];
  for (const ta of eff.type_args) {
    List_push(resolved_args, infer_ctx$resolve_type_expr(ctx, ta));
  }
  return types$Effect_CustomEffect(eff.name, resolved_args);
}

function resolve_declared_effects(ctx, decl_effects) {
  let effects = [];
  for (const eff of decl_effects) {
    List_push(effects, resolve_effect_expr(ctx, eff));
  }
  return new types$EffectRow(effects, Option_none);
}

function check_duplicate_def(ctx, name, span) {
  __ring_match40: {
    const __ring_m40 = env$TypeEnv_lookup(ctx.env, name);
    if (__ring_m40._tag === "some") {
      const existing = __ring_m40._0;
      __ring_match41: {
        const __ring_m41 = existing.def_id;
        if (__ring_m41._tag === "some") {
          const did = __ring_m41._0;
          __ring_match42: {
            const __ring_m42 = _Map_get(ctx.env.scope.def_spans, did);
            if (__ring_m42._tag === "some") {
              const _ = infer_ctx$type_error(ctx.sink, codes$E0207, `Duplicate definition: '${name}' is already defined`, span, diagnostics$DiagnosticContext_TypeMismatch("unique name", name, Option_none));
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
      break __ring_match40;
    }
    if (__ring_m40._tag === "none") {
      break __ring_match40;
    }
    __match_fail(__ring_m40);
  }
}

function register_fn(ctx, name, type_params, params, return_type, declared_effects, span) {
  check_duplicate_def(ctx, name, span);
  let type_vars = [];
  const saved = map_clone(ctx.type_param_scope);
  for (const tp of type_params) {
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match43: {
      const __ring_m43 = tv;
      if (__ring_m43._tag === "TypeVar") {
        const id = __ring_m43.id;
        List_push(type_vars, id);
        break __ring_match43;
      }
      break __ring_match43;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  let param_types = [];
  for (const p of params) {
    __ring_match44: {
      const __ring_m44 = p.type_annotation;
      if (__ring_m44._tag === "some") {
        const ta = __ring_m44._0;
        List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
        break __ring_match44;
      }
      if (__ring_m44._tag === "none") {
        List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
        break __ring_match44;
      }
      __match_fail(__ring_m44);
    }
  }
  const ret = (function() {
  const __ring_m = return_type;
  if (__ring_m._tag === "some") { const rt = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, rt); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})();
  let declared_names = set_new();
  for (const tp of type_params) {
    _Set_insert(declared_names, tp.name);
  }
  for (const entry of _Map_entries(ctx.type_param_scope)) {
    const __ring_dt2 = entry;
    const tpname = __ring_dt2[0];
    const tv = __ring_dt2[1];
    if (((!_Map_contains_key(saved, tpname)) && (!_Set_contains(declared_names, tpname)))) {
      __ring_match45: {
        const __ring_m45 = tv;
        if (__ring_m45._tag === "TypeVar") {
          const id = __ring_m45.id;
          List_push(type_vars, id);
          break __ring_match45;
        }
        break __ring_match45;
      }
    }
  }
  const effects = (function() {
  const __ring_m = declared_effects;
  if (__ring_m._tag === "some") { const de = __ring_m._0; return resolve_declared_effects(ctx, de); }
  if (__ring_m._tag === "none") { return types$EMPTY_ROW; }
  __match_fail(__ring_m);
})();
  const fn_type = types$Type_FnType(param_types, ret, effects);
  let fn_bounds_list = [];
  let scheme_bounds = [];
  for (const tp of type_params) {
    const tv = _Map_get(ctx.type_param_scope, tp.name);
    for (const b of tp.bounds) {
      if ((!_Map_contains_key(ctx.env.trait_reg.traits, b.trait_name))) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0501, `Unknown trait: ${b.trait_name}`, tp.span, diagnostics$DiagnosticContext_TraitError(`unknown trait '${b.trait_name}'`));
      }
      List_push(fn_bounds_list, new env$FnBound(tp.name, b.trait_name));
      __ring_match46: {
        const __ring_m46 = tv;
        if (__ring_m46._tag === "some") {
          const t = __ring_m46._0;
          __ring_match47: {
            const __ring_m47 = t;
            if (__ring_m47._tag === "TypeVar") {
              const id = __ring_m47.id;
              List_push(scheme_bounds, new env$SchemeBound(id, b.trait_name));
              break __ring_match47;
            }
            break __ring_match47;
          }
          break __ring_match46;
        }
        if (__ring_m46._tag === "none") {
          break __ring_match46;
        }
        __match_fail(__ring_m46);
      }
    }
  }
  if ((List_len(fn_bounds_list) > 0)) {
    _Map_insert(ctx.env.scope.fn_bounds, name, fn_bounds_list);
  }
  ctx.type_param_scope = saved;
  if ((List_len(type_vars) > 0)) {
    env$TypeEnv_bind(ctx.env, name, new env$TypeScheme(fn_type, type_vars, scheme_bounds, Option_none));
  } else {
    env$TypeEnv_bind_mono(ctx.env, name, fn_type);
  }
  __ring_match48: {
    const __ring_m48 = env$TypeEnv_lookup(ctx.env, name);
    if (__ring_m48._tag === "some") {
      const s = __ring_m48._0;
      __ring_match49: {
        const __ring_m49 = s.def_id;
        if (__ring_m49._tag === "some") {
          const did = __ring_m49._0;
          return env$TypeEnv_record_def_span(ctx.env, did, span);
          break __ring_match49;
        }
        if (__ring_m49._tag === "none") {
          break __ring_match49;
        }
        __match_fail(__ring_m49);
      }
      break __ring_match48;
    }
    if (__ring_m48._tag === "none") {
      break __ring_match48;
    }
    __match_fail(__ring_m48);
  }
}

function register_extern_fn(ctx, name, type_params, params, return_type, declared_effects, span) {
  let type_vars = [];
  const saved = map_clone(ctx.type_param_scope);
  for (const tp of type_params) {
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match50: {
      const __ring_m50 = tv;
      if (__ring_m50._tag === "TypeVar") {
        const id = __ring_m50.id;
        List_push(type_vars, id);
        break __ring_match50;
      }
      break __ring_match50;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  let param_types = [];
  for (const p of params) {
    __ring_match51: {
      const __ring_m51 = p.type_annotation;
      if (__ring_m51._tag === "some") {
        const ta = __ring_m51._0;
        List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
        break __ring_match51;
      }
      if (__ring_m51._tag === "none") {
        List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
        break __ring_match51;
      }
      __match_fail(__ring_m51);
    }
  }
  const ret = (function() {
  const __ring_m = return_type;
  if (__ring_m._tag === "some") { const rt = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, rt); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})();
  let declared_names = set_new();
  for (const tp of type_params) {
    _Set_insert(declared_names, tp.name);
  }
  for (const entry of _Map_entries(ctx.type_param_scope)) {
    const __ring_dt3 = entry;
    const tpname = __ring_dt3[0];
    const tv = __ring_dt3[1];
    if (((!_Map_contains_key(saved, tpname)) && (!_Set_contains(declared_names, tpname)))) {
      __ring_match52: {
        const __ring_m52 = tv;
        if (__ring_m52._tag === "TypeVar") {
          const id = __ring_m52.id;
          List_push(type_vars, id);
          break __ring_match52;
        }
        break __ring_match52;
      }
    }
  }
  const reg_effects = (function() {
  const __ring_m = declared_effects;
  if (__ring_m._tag === "some") { const de = __ring_m._0; return resolve_declared_effects(ctx, de); }
  if (__ring_m._tag === "none") { return types$EMPTY_ROW; }
  __match_fail(__ring_m);
})();
  const fn_type = types$Type_FnType(param_types, ret, reg_effects);
  let scheme_bounds = [];
  for (const tp of type_params) {
    const tv = _Map_get(ctx.type_param_scope, tp.name);
    for (const b of tp.bounds) {
      if ((!_Map_contains_key(ctx.env.trait_reg.traits, b.trait_name))) {
        const _ = infer_ctx$type_error(ctx.sink, codes$E0501, `Unknown trait: ${b.trait_name}`, tp.span, diagnostics$DiagnosticContext_TraitError(`unknown trait '${b.trait_name}'`));
      }
      __ring_match53: {
        const __ring_m53 = tv;
        if (__ring_m53._tag === "some") {
          const t = __ring_m53._0;
          __ring_match54: {
            const __ring_m54 = t;
            if (__ring_m54._tag === "TypeVar") {
              const id = __ring_m54.id;
              List_push(scheme_bounds, new env$SchemeBound(id, b.trait_name));
              break __ring_match54;
            }
            break __ring_match54;
          }
          break __ring_match53;
        }
        if (__ring_m53._tag === "none") {
          break __ring_match53;
        }
        __match_fail(__ring_m53);
      }
    }
  }
  ctx.type_param_scope = saved;
  if ((List_len(type_vars) > 0)) {
    env$TypeEnv_bind(ctx.env, name, new env$TypeScheme(fn_type, type_vars, scheme_bounds, Option_none));
  } else {
    env$TypeEnv_bind_mono(ctx.env, name, fn_type);
  }
  __ring_match55: {
    const __ring_m55 = env$TypeEnv_lookup(ctx.env, name);
    if (__ring_m55._tag === "some") {
      const s = __ring_m55._0;
      __ring_match56: {
        const __ring_m56 = s.def_id;
        if (__ring_m56._tag === "some") {
          const did = __ring_m56._0;
          return env$TypeEnv_record_def_span(ctx.env, did, span);
          break __ring_match56;
        }
        if (__ring_m56._tag === "none") {
          break __ring_match56;
        }
        __match_fail(__ring_m56);
      }
      break __ring_match55;
    }
    if (__ring_m55._tag === "none") {
      break __ring_match55;
    }
    __match_fail(__ring_m55);
  }
}

function register_extern_type(ctx, name, type_params) {
  let tp_names = [];
  const saved = map_clone(ctx.type_param_scope);
  let tp_vars = [];
  for (const tp of type_params) {
    List_push(tp_names, tp.name);
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match57: {
      const __ring_m57 = tv;
      if (__ring_m57._tag === "TypeVar") {
        const id = __ring_m57.id;
        List_push(tp_vars, id);
        break __ring_match57;
      }
      break __ring_match57;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  ctx.type_param_scope = saved;
  return _Map_insert(ctx.env.types.structs, name, new env$StructDef(name, tp_names, tp_vars, []));
}

function register_type_alias(ctx, name, type_params, type_expr) {
  const saved = map_clone(ctx.type_param_scope);
  let tp_vars = [];
  for (const tp of type_params) {
    const tv = env$TypeEnv_fresh_var(ctx.env);
    __ring_match58: {
      const __ring_m58 = tv;
      if (__ring_m58._tag === "TypeVar") {
        const id = __ring_m58.id;
        List_push(tp_vars, id);
        break __ring_match58;
      }
      break __ring_match58;
    }
    _Map_insert(ctx.type_param_scope, tp.name, tv);
  }
  const resolved = infer_ctx$resolve_type_expr(ctx, type_expr);
  ctx.type_param_scope = saved;
  let tp_names = [];
  for (const tp of type_params) {
    List_push(tp_names, tp.name);
  }
  return _Map_insert(ctx.env.types.type_aliases, name, new env$TypeAliasDef(tp_names, tp_vars, resolved));
}

function register_const(ctx, name, type_annotation, span) {
  check_duplicate_def(ctx, name, span);
  __ring_match59: {
    const __ring_m59 = type_annotation;
    if (__ring_m59._tag === "some") {
      const texpr = __ring_m59._0;
      const ty = infer_ctx$resolve_type_expr(ctx, texpr);
      env$TypeEnv_bind_mono(ctx.env, name, ty);
      break __ring_match59;
    }
    if (__ring_m59._tag === "none") {
      const tv = env$TypeEnv_fresh_var(ctx.env);
      env$TypeEnv_bind_mono(ctx.env, name, tv);
      break __ring_match59;
    }
    __match_fail(__ring_m59);
  }
  __ring_match60: {
    const __ring_m60 = env$TypeEnv_lookup(ctx.env, name);
    if (__ring_m60._tag === "some") {
      const s = __ring_m60._0;
      __ring_match61: {
        const __ring_m61 = s.def_id;
        if (__ring_m61._tag === "some") {
          const did = __ring_m61._0;
          return env$TypeEnv_record_def_span(ctx.env, did, span);
          break __ring_match61;
        }
        if (__ring_m61._tag === "none") {
          break __ring_match61;
        }
        __match_fail(__ring_m61);
      }
      break __ring_match60;
    }
    if (__ring_m60._tag === "none") {
      break __ring_match60;
    }
    __match_fail(__ring_m60);
  }
}

function register_sig(ctx, name, members, is_pub) {
  const saved = map_clone(ctx.type_param_scope);
  let sig_members = map_new();
  for (const m of members) {
    let type_vars = [];
    const msaved = map_clone(ctx.type_param_scope);
    for (const tp of m.type_params) {
      const tv = env$TypeEnv_fresh_var(ctx.env);
      __ring_match62: {
        const __ring_m62 = tv;
        if (__ring_m62._tag === "TypeVar") {
          const id = __ring_m62.id;
          List_push(type_vars, id);
          break __ring_match62;
        }
        break __ring_match62;
      }
      _Map_insert(ctx.type_param_scope, tp.name, tv);
    }
    let param_types = [];
    for (const p of m.params) {
      __ring_match63: {
        const __ring_m63 = p.type_annotation;
        if (__ring_m63._tag === "some") {
          const ta = __ring_m63._0;
          List_push(param_types, infer_ctx$resolve_type_expr(ctx, ta));
          break __ring_match63;
        }
        if (__ring_m63._tag === "none") {
          List_push(param_types, env$TypeEnv_fresh_var(ctx.env));
          break __ring_match63;
        }
        __match_fail(__ring_m63);
      }
    }
    const ret = (function() {
  const __ring_m = m.return_type;
  if (__ring_m._tag === "some") { const rt = __ring_m._0; return infer_ctx$resolve_type_expr(ctx, rt); }
  if (__ring_m._tag === "none") { return env$TypeEnv_fresh_var(ctx.env); }
  __match_fail(__ring_m);
})();
    const fn_type = types$Type_FnType(param_types, ret, types$EMPTY_ROW);
    _Map_insert(sig_members, m.name, new env$TypeScheme(fn_type, type_vars, [], Option_none));
    ctx.type_param_scope = msaved;
  }
  ctx.type_param_scope = saved;
  return _Map_insert(ctx.env.types.sigs, name, new env$SigDef(name, sig_members, is_pub));
}

function register_decl(ctx, decl) {
  __ring_match64: {
    const __ring_m64 = decl;
    if (__ring_m64._tag === "Struct") {
      const name = __ring_m64.name; const type_params = __ring_m64.type_params; const fields = __ring_m64.fields; const span = __ring_m64.span;
      preregister_struct(ctx, name, type_params);
      return complete_struct_fields(ctx, name, fields);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Enum") {
      const name = __ring_m64.name; const type_params = __ring_m64.type_params; const variants = __ring_m64.variants; const span = __ring_m64.span;
      preregister_enum(ctx, name, type_params);
      return complete_enum_variants(ctx, name, type_params, variants);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Effect") {
      const name = __ring_m64.name; const type_params = __ring_m64.type_params; const ops = __ring_m64.ops;
      return register_effect(ctx, name, type_params, ops);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Impl") {
      const target_type = __ring_m64.target_type; const type_params = __ring_m64.type_params; const trait_name = __ring_m64.trait_name; const methods = __ring_m64.methods; const span = __ring_m64.span;
      return register_impl(ctx, target_type, type_params, trait_name, methods, span);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Fn") {
      const name = __ring_m64.name; const type_params = __ring_m64.type_params; const params = __ring_m64.params; const return_type = __ring_m64.return_type; const declared_effects = __ring_m64.declared_effects; const span = __ring_m64.span;
      return register_fn(ctx, name, type_params, params, return_type, declared_effects, span);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Test") {
      break __ring_match64;
    }
    if (__ring_m64._tag === "Trait") {
      const name = __ring_m64.name; const type_params = __ring_m64.type_params; const methods = __ring_m64.methods;
      return register_trait(ctx, name, type_params, methods);
      break __ring_match64;
    }
    if (__ring_m64._tag === "ExternFn") {
      const name = __ring_m64.name; const type_params = __ring_m64.type_params; const params = __ring_m64.params; const return_type = __ring_m64.return_type; const declared_effects = __ring_m64.declared_effects; const span = __ring_m64.span;
      return register_extern_fn(ctx, name, type_params, params, return_type, declared_effects, span);
      break __ring_match64;
    }
    if (__ring_m64._tag === "ExternType") {
      const name = __ring_m64.name; const type_params = __ring_m64.type_params;
      return register_extern_type(ctx, name, type_params);
      break __ring_match64;
    }
    if (__ring_m64._tag === "TypeAlias") {
      const name = __ring_m64.name; const type_params = __ring_m64.type_params; const type_expr = __ring_m64.type_expr;
      return register_type_alias(ctx, name, type_params, type_expr);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Const") {
      const name = __ring_m64.name; const type_annotation = __ring_m64.type_annotation; const span = __ring_m64.span;
      return register_const(ctx, name, type_annotation, span);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Sig") {
      const name = __ring_m64.name; const members = __ring_m64.members; const is_pub = __ring_m64.is_pub;
      return register_sig(ctx, name, members, is_pub);
      break __ring_match64;
    }
    if (__ring_m64._tag === "ModBlock") {
      const mod_name = __ring_m64.name; const mod_decls = __ring_m64.decls;
      for (const d of mod_decls) {
        __ring_match65: {
          const __ring_m65 = d;
          if (__ring_m65._tag === "Struct") {
            const prefixed = prefix_decl_name(mod_name, d);
            register_decl(ctx, prefixed);
            break __ring_match65;
          }
          if (__ring_m65._tag === "Enum") {
            const prefixed = prefix_decl_name(mod_name, d);
            register_decl(ctx, prefixed);
            break __ring_match65;
          }
          break __ring_match65;
        }
      }
      for (const d of mod_decls) {
        __ring_match66: {
          const __ring_m66 = d;
          if (__ring_m66._tag === "Trait") {
            const prefixed = prefix_decl_name(mod_name, d);
            register_decl(ctx, prefixed);
            break __ring_match66;
          }
          if (__ring_m66._tag === "Effect") {
            const prefixed = prefix_decl_name(mod_name, d);
            register_decl(ctx, prefixed);
            break __ring_match66;
          }
          if (__ring_m66._tag === "ExternType") {
            const prefixed = prefix_decl_name(mod_name, d);
            register_decl(ctx, prefixed);
            break __ring_match66;
          }
          break __ring_match66;
        }
      }
      insert_mod_aliases(ctx, mod_name, mod_decls, true);
      for (const d of mod_decls) {
        __ring_match67: {
          const __ring_m67 = d;
          if (__ring_m67._tag === "Struct") {
            break __ring_match67;
          }
          if (__ring_m67._tag === "Enum") {
            break __ring_match67;
          }
          if (__ring_m67._tag === "Trait") {
            break __ring_match67;
          }
          if (__ring_m67._tag === "Effect") {
            break __ring_match67;
          }
          if (__ring_m67._tag === "ExternType") {
            break __ring_match67;
          }
          const prefixed = prefix_decl_name(mod_name, d);
          register_decl(ctx, prefixed);
          break __ring_match67;
        }
      }
      break __ring_match64;
    }
    __match_fail(__ring_m64);
  }
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


export { register_decl_public, insert_mod_aliases, prefix_decl_name, register_decls_two_phase, resolve_effect_expr, resolve_declared_effects };