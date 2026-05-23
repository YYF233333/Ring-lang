import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { PREC_NONE as parser$PREC_NONE, PREC_CATCH as parser$PREC_CATCH, PREC_LOGIC_OR as parser$PREC_LOGIC_OR, PREC_LOGIC_AND as parser$PREC_LOGIC_AND, PREC_EQUALITY as parser$PREC_EQUALITY, PREC_COMPARE as parser$PREC_COMPARE, PREC_RANGE as parser$PREC_RANGE, PREC_ADD_SUB as parser$PREC_ADD_SUB, PREC_MUL_DIV as parser$PREC_MUL_DIV, PREC_UNARY as parser$PREC_UNARY, PREC_POSTFIX as parser$PREC_POSTFIX, infix_precedence as parser$infix_precedence, type_expr_span as parser$type_expr_span, expr_span as parser$expr_span, new_parser as parser$new_parser, parse as parser$parse, Parser as parser$Parser, __Parser_Clone as parser$__Parser_Clone, __Parser_Debug as parser$__Parser_Debug, Parser_peek as parser$Parser_peek, Parser_peek_at as parser$Parser_peek_at, Parser_advance as parser$Parser_advance, Parser_check as parser$Parser_check, Parser_try_consume as parser$Parser_try_consume, Parser_expect as parser$Parser_expect, Parser_at_end as parser$Parser_at_end, Parser_current_span_start as parser$Parser_current_span_start, Parser_make_span as parser$Parser_make_span, Parser_report_error as parser$Parser_report_error, Parser_error as parser$Parser_error, Parser_parse_program as parser$Parser_parse_program, Parser_parse_stmt as parser$Parser_parse_stmt, Parser_parse_while_stmt as parser$Parser_parse_while_stmt, Parser_parse_loop_stmt as parser$Parser_parse_loop_stmt, Parser_parse_for_in_stmt as parser$Parser_parse_for_in_stmt, Parser_parse_break_stmt as parser$Parser_parse_break_stmt, Parser_parse_continue_stmt as parser$Parser_parse_continue_stmt, Parser_parse_if_let_stmt as parser$Parser_parse_if_let_stmt, Parser_parse_binding_stmt as parser$Parser_parse_binding_stmt, Parser_parse_binding_body as parser$Parser_parse_binding_body, Parser_parse_return_stmt as parser$Parser_parse_return_stmt, Parser_parse_block_expr as parser$Parser_parse_block_expr, Parser_parse_use_decl as parser$Parser_parse_use_decl, Parser_parse_mod_block as parser$Parser_parse_mod_block, Parser_parse_decl as parser$Parser_parse_decl, Parser_parse_effect_list as parser$Parser_parse_effect_list, Parser_parse_effect_annotation as parser$Parser_parse_effect_annotation, Parser_parse_fn_decl as parser$Parser_parse_fn_decl, Parser_parse_const_decl as parser$Parser_parse_const_decl, Parser_parse_sig_block as parser$Parser_parse_sig_block, Parser_parse_extern_decl as parser$Parser_parse_extern_decl, Parser_parse_extern_fn_decl_body as parser$Parser_parse_extern_fn_decl_body, Parser_parse_extern_type_decl_body as parser$Parser_parse_extern_type_decl_body, Parser_parse_type_alias_decl as parser$Parser_parse_type_alias_decl, Parser_parse_struct_decl as parser$Parser_parse_struct_decl, Parser_parse_enum_decl as parser$Parser_parse_enum_decl, Parser_parse_impl_decl as parser$Parser_parse_impl_decl, Parser_parse_effect_alias_decl as parser$Parser_parse_effect_alias_decl, Parser_parse_effect_decl as parser$Parser_parse_effect_decl, Parser_parse_test_decl as parser$Parser_parse_test_decl, Parser_parse_trait_decl as parser$Parser_parse_trait_decl, Parser_parse_expr as parser$Parser_parse_expr, Parser_parse_expr_no_struct as parser$Parser_parse_expr_no_struct, Parser_parse_expr_bp as parser$Parser_parse_expr_bp, Parser_parse_prefix as parser$Parser_parse_prefix, Parser_parse_dot_expr as parser$Parser_parse_dot_expr, Parser_parse_index_expr as parser$Parser_parse_index_expr, Parser_parse_call_expr as parser$Parser_parse_call_expr, Parser_parse_arg_list as parser$Parser_parse_arg_list, Parser_parse_catch_expr as parser$Parser_parse_catch_expr, Parser_parse_string_interp as parser$Parser_parse_string_interp, Parser_parse_if_expr as parser$Parser_parse_if_expr, Parser_parse_match_expr as parser$Parser_parse_match_expr, Parser_parse_match_arm as parser$Parser_parse_match_arm, Parser_parse_pattern as parser$Parser_parse_pattern, Parser_parse_handle_expr as parser$Parser_parse_handle_expr, Parser_parse_effect_handler as parser$Parser_parse_effect_handler, Parser_parse_lambda_expr as parser$Parser_parse_lambda_expr, Parser_parse_struct_literal as parser$Parser_parse_struct_literal, Parser_try_parse_type_args as parser$Parser_try_parse_type_args, Parser_parse_type_expr as parser$Parser_parse_type_expr, Parser_parse_record_type_expr as parser$Parser_parse_record_type_expr, Parser_parse_qualified_ident as parser$Parser_parse_qualified_ident, Parser_parse_type_params as parser$Parser_parse_type_params, Parser_parse_type_bound as parser$Parser_parse_type_bound, Parser_parse_params as parser$Parser_parse_params, Parser_parse_param as parser$Parser_parse_param } from "./parser.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { format_human as formatter$format_human, format_llm as formatter$format_llm } from "./formatter.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0405 as codes$E0405, E0406 as codes$E0406, E0407 as codes$E0407, E0408 as codes$E0408, E0504 as codes$E0504, E0505 as codes$E0505, E0506 as codes$E0506, E0507 as codes$E0507, E0508 as codes$E0508, E0409 as codes$E0409, E0410 as codes$E0410, E0509 as codes$E0509, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, W0001 as codes$W0001, error_description as codes$error_description, error_category as codes$error_category } from "./codes.js";

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

class ModuleId {
  constructor(path_segments, file_path) {
    this.path_segments = path_segments;
    this.file_path = file_path;
  }
}

class ModuleGraph {
  constructor(entry, modules, dependencies, topo_order, asts) {
    this.entry = entry;
    this.modules = modules;
    this.dependencies = dependencies;
    this.topo_order = topo_order;
    this.asts = asts;
  }
}

class GraphError {
  constructor(message, cycle) {
    this.message = message;
    this.cycle = cycle;
  }
}

function module_key(segments) {
  return List_join(segments, "::");
}

function module_prefix(segments) {
  return List_join(segments, "$");
}

function resolve_module_file(use_path_segments, project_root) {
  let path_part = "";
  const __ring_end0 = List_len(use_path_segments);
  for (let i = 0; i < __ring_end0; i++) {
    __ring_match6: {
      const __ring_m6 = List_get(use_path_segments, i);
      if (__ring_m6._tag === "some") {
        const seg = __ring_m6._0;
        if ((i === 0)) {
          path_part = seg;
        } else {
          path_part = path_join(path_part, seg);
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "none") {
        break __ring_match6;
      }
      __match_fail(__ring_m6);
    }
  }
  const ring_file = `${path_part}.ring`;
  const absolute = path_resolve(path_join(project_root, ring_file));
  if (file_exists(absolute)) {
    return Option_some(absolute);
  } else {
    return Option_none;
  }
}

function build_module_graph(entry_file) {
  const abs_entry = path_resolve(entry_file);
  const project_root = path_dirname(abs_entry);
  const entry_basename = Str_replace(path_basename(abs_entry), ".ring", "");
  const entry_id = new ModuleId([entry_basename], abs_entry);
  const entry_key = module_key(entry_id.path_segments);
  let modules = map_new();
  let dependencies = map_new();
  let asts_map = map_new();
  _Map_insert(modules, entry_key, entry_id);
  let empty_deps = [];
  _Map_insert(dependencies, entry_key, empty_deps);
  let queue = [entry_key];
  while ((List_len(queue) > 0)) {
    __ring_match7: {
      const __ring_m7 = List_shift(queue);
      if (__ring_m7._tag === "some") {
        const current_key = __ring_m7._0;
        __ring_match8: {
          const __ring_m8 = _Map_get(modules, current_key);
          if (__ring_m8._tag === "some") {
            const current_mod = __ring_m8._0;
            const source = read_file(current_mod.file_path);
            const resolve_sink = diagnostics$new_collecting_sink();
            const ast = parser$parse(source, current_mod.file_path, resolve_sink);
            if (diagnostics$CollectingSink_has_errors(resolve_sink)) {
              eprintln(formatter$format_human(diagnostics$CollectingSink_diagnostics(resolve_sink), source));
              return Option_none;
            }
            _Map_insert(asts_map, current_key, ast);
            let deps = [];
            for (const use_decl of ast.uses) {
              const segments = use_decl.path.segments;
              const dep_key = module_key(segments);
              if (List_contains(deps, dep_key, __Str_Eq)) {
              } else {
                __ring_match9: {
                  const __ring_m9 = resolve_module_file(segments, project_root);
                  if (__ring_m9._tag === "some") {
                    const resolved = __ring_m9._0;
                    const abs_resolved = path_resolve(resolved);
                    __ring_match10: {
                      const __ring_m10 = _Map_get(modules, dep_key);
                      if (__ring_m10._tag === "none") {
                        const dep_id = new ModuleId(list_clone(segments), abs_resolved);
                        _Map_insert(modules, dep_key, dep_id);
                        let empty = [];
                        _Map_insert(dependencies, dep_key, empty);
                        List_push(queue, dep_key);
                        break __ring_match10;
                      }
                      if (__ring_m10._tag === "some") {
                        break __ring_match10;
                      }
                      __match_fail(__ring_m10);
                    }
                    List_push(deps, dep_key);
                    break __ring_match9;
                  }
                  if (__ring_m9._tag === "none") {
                    const mod_path = List_join(segments, "::");
                    const diag = diagnostics$make_diag(codes$E0702, diagnostics$Severity_SevError, `Module '${mod_path}' not found`, use_decl.span, diagnostics$DiagnosticContext_OtherContext(Option_some(`no file '${mod_path}.ring' in project root`)));
                    const err_sink = diagnostics$new_collecting_sink();
                    diagnostics$CollectingSink_report(err_sink, diag);
                    eprintln(formatter$format_human(diagnostics$CollectingSink_diagnostics(err_sink), source));
                    return Option_none;
                    break __ring_match9;
                  }
                  __match_fail(__ring_m9);
                }
              }
            }
            _Map_insert(dependencies, current_key, deps);
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
  }
  let dep_count = map_new();
  for (const entry of _Map_entries(dependencies)) {
    const __ring_dt0 = entry;
    const key = __ring_dt0[0];
    const deps = __ring_dt0[1];
    _Map_insert(dep_count, key, List_len(deps));
  }
  let topo_order = [];
  let ready = [];
  for (const entry of _Map_entries(dep_count)) {
    const __ring_dt1 = entry;
    const key = __ring_dt1[0];
    const count = __ring_dt1[1];
    if ((count === 0)) {
      List_push(ready, key);
    }
  }
  while ((List_len(ready) > 0)) {
    __ring_match11: {
      const __ring_m11 = List_shift(ready);
      if (__ring_m11._tag === "some") {
        const node = __ring_m11._0;
        List_push(topo_order, node);
        for (const entry of _Map_entries(dependencies)) {
          const __ring_dt2 = entry;
          const key = __ring_dt2[0];
          const deps = __ring_dt2[1];
          if (List_contains(deps, node, __Str_Eq)) {
            __ring_match12: {
              const __ring_m12 = _Map_get(dep_count, key);
              if (__ring_m12._tag === "some") {
                const c = __ring_m12._0;
                const new_count = (c - 1);
                _Map_insert(dep_count, key, new_count);
                if ((new_count === 0)) {
                  List_push(ready, key);
                }
                break __ring_match12;
              }
              if (__ring_m12._tag === "none") {
                break __ring_match12;
              }
              __match_fail(__ring_m12);
            }
          }
        }
        break __ring_match11;
      }
      if (__ring_m11._tag === "none") {
        break __ring_match11;
      }
      __match_fail(__ring_m11);
    }
  }
  if ((List_len(topo_order) !== _Map_len(modules))) {
    let cycle_nodes = [];
    for (const entry of _Map_entries(modules)) {
      const __ring_dt3 = entry;
      const key = __ring_dt3[0];
      if ((!List_contains(topo_order, key, __Str_Eq))) {
        List_push(cycle_nodes, key);
      }
    }
    const cycle_path = find_cycle_path(cycle_nodes, dependencies);
    const cycle_desc = List_join(cycle_path, " -> ");
    const file_span = new ast$Span(abs_entry, new ast$Position(1, 0, 0), new ast$Position(1, 0, 0));
    const diag = diagnostics$make_diag(codes$E0704, diagnostics$Severity_SevError, `Circular dependency detected: ${cycle_desc}`, file_span, diagnostics$DiagnosticContext_OtherContext(Option_some("modules form a dependency cycle")));
    const err_sink = diagnostics$new_collecting_sink();
    diagnostics$CollectingSink_report(err_sink, diag);
    const entry_source = read_file(abs_entry);
    eprintln(formatter$format_human(diagnostics$CollectingSink_diagnostics(err_sink), entry_source));
    return Option_none;
  }
  return Option_some(new ModuleGraph(new ModuleId([entry_basename], abs_entry), modules, dependencies, topo_order, asts_map));
}

function find_cycle_path(cycle_nodes, dependencies) {
  if ((List_len(cycle_nodes) === 0)) {
    return ["(unknown)"];
  }
  const cycle_set = set_from(cycle_nodes);
  for (const start_node of cycle_nodes) {
    let path = [start_node];
    let current = start_node;
    let visited = set_new();
    _Set_insert(visited, current);
    let found_cycle = false;
    while ((!found_cycle)) {
      const maybe_deps = _Map_get(dependencies, current);
      if (Option_is_none(maybe_deps)) {
        break;
      }
      const deps = Option_unwrap(maybe_deps);
      let advanced = false;
      for (const dep of deps) {
        if (_Set_contains(cycle_set, dep, __Str_Eq)) {
          if ((dep === start_node)) {
            List_push(path, dep);
            found_cycle = true;
            advanced = true;
            break;
          }
          if ((!_Set_contains(visited, dep, __Str_Eq))) {
            _Set_insert(visited, dep);
            List_push(path, dep);
            current = dep;
            advanced = true;
            break;
          }
        }
      }
      if ((!advanced)) {
        break;
      }
    }
    if (found_cycle) {
      return path;
    }
  }
  let fallback = [];
  for (const n of cycle_nodes) {
    List_push(fallback, n);
  }
  __ring_match13: {
    const __ring_m13 = List_get(cycle_nodes, 0);
    if (__ring_m13._tag === "some") {
      const first = __ring_m13._0;
      List_push(fallback, first);
      break __ring_match13;
    }
    if (__ring_m13._tag === "none") {
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
  return fallback;
}

function __StringBuilder_Eq_eq(self, other) {
  return true;
}
const __StringBuilder_Eq = { eq: __StringBuilder_Eq_eq, ne: function(self, other) { return !__StringBuilder_Eq_eq(self, other); } };

function __Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return __ring_T_Eq.eq(self._0, other._0);
    case "Err": return __ring_E_Eq.eq(self._0, other._0);
    default: return true;
  }
}
const __Result_Eq = { eq: __Result_Eq_eq, ne: function(self, other, __ring_T_Eq, __ring_E_Eq) { return !__Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq); } };

function __StringBuilder_Clone_clone(self) {
  return new StringBuilder();
}
const __StringBuilder_Clone = { clone: __StringBuilder_Clone_clone };

function __ModuleId_Clone_clone(self) {
  return new ModuleId(__List_Clone.clone(self.path_segments, __Str_Clone), self.file_path);
}
const __ModuleId_Clone = { clone: __ModuleId_Clone_clone };

function __GraphError_Clone_clone(self) {
  return new GraphError(self.message, __Option_Clone.clone(self.cycle, __List_Clone));
}
const __GraphError_Clone = { clone: __GraphError_Clone_clone };

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

function __StringBuilder_Debug_debug(self) {
  return "StringBuilder";
}
const __StringBuilder_Debug = { debug: __StringBuilder_Debug_debug };

function __ModuleId_Debug_debug(self) {
  return "ModuleId { " + "path_segments: " + __List_Debug.debug(self.path_segments, __Str_Debug) + ", " + "file_path: " + String(self.file_path) + " }";
}
const __ModuleId_Debug = { debug: __ModuleId_Debug_debug };

function __GraphError_Debug_debug(self) {
  return "GraphError { " + "message: " + String(self.message) + ", " + "cycle: " + __Option_Debug.debug(self.cycle, __List_Debug) + " }";
}
const __GraphError_Debug = { debug: __GraphError_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { ModuleId, ModuleGraph, GraphError, module_key, module_prefix, resolve_module_file, build_module_graph, __ModuleId_Clone, __GraphError_Clone, __ModuleId_Debug, __GraphError_Debug };