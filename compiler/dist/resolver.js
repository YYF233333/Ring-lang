import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_contains, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { PREC_NONE as parser$PREC_NONE, PREC_CATCH as parser$PREC_CATCH, PREC_LOGIC_OR as parser$PREC_LOGIC_OR, PREC_LOGIC_AND as parser$PREC_LOGIC_AND, PREC_EQUALITY as parser$PREC_EQUALITY, PREC_COMPARE as parser$PREC_COMPARE, PREC_RANGE as parser$PREC_RANGE, PREC_ADD_SUB as parser$PREC_ADD_SUB, PREC_MUL_DIV as parser$PREC_MUL_DIV, PREC_UNARY as parser$PREC_UNARY, PREC_POSTFIX as parser$PREC_POSTFIX, infix_precedence as parser$infix_precedence, expr_span as parser$expr_span, new_parser as parser$new_parser, parse as parser$parse, Parser as parser$Parser, __Parser_Clone as parser$__Parser_Clone, __Parser_Debug as parser$__Parser_Debug, Parser_peek as parser$Parser_peek, Parser_advance as parser$Parser_advance, Parser_check as parser$Parser_check, Parser_try_consume as parser$Parser_try_consume, Parser_expect as parser$Parser_expect, Parser_at_end as parser$Parser_at_end, Parser_current_span_start as parser$Parser_current_span_start, Parser_make_span as parser$Parser_make_span, Parser_report_error as parser$Parser_report_error, Parser_error as parser$Parser_error, Parser_parse_program as parser$Parser_parse_program, Parser_parse_stmt as parser$Parser_parse_stmt, Parser_parse_while_stmt as parser$Parser_parse_while_stmt, Parser_parse_loop_stmt as parser$Parser_parse_loop_stmt, Parser_parse_for_in_stmt as parser$Parser_parse_for_in_stmt, Parser_parse_break_stmt as parser$Parser_parse_break_stmt, Parser_parse_continue_stmt as parser$Parser_parse_continue_stmt, Parser_parse_if_let_stmt as parser$Parser_parse_if_let_stmt, Parser_parse_binding_stmt as parser$Parser_parse_binding_stmt, Parser_parse_return_stmt as parser$Parser_parse_return_stmt, Parser_parse_block_expr as parser$Parser_parse_block_expr, Parser_parse_use_decl as parser$Parser_parse_use_decl, Parser_parse_decl as parser$Parser_parse_decl, Parser_parse_fn_decl as parser$Parser_parse_fn_decl, Parser_parse_const_decl as parser$Parser_parse_const_decl, Parser_parse_extern_decl as parser$Parser_parse_extern_decl, Parser_parse_extern_fn_decl_body as parser$Parser_parse_extern_fn_decl_body, Parser_parse_extern_type_decl_body as parser$Parser_parse_extern_type_decl_body, Parser_parse_type_alias_decl as parser$Parser_parse_type_alias_decl, Parser_parse_struct_decl as parser$Parser_parse_struct_decl, Parser_parse_enum_decl as parser$Parser_parse_enum_decl, Parser_parse_impl_decl as parser$Parser_parse_impl_decl, Parser_parse_effect_decl as parser$Parser_parse_effect_decl, Parser_parse_test_decl as parser$Parser_parse_test_decl, Parser_parse_trait_decl as parser$Parser_parse_trait_decl, Parser_parse_expr as parser$Parser_parse_expr, Parser_parse_expr_no_struct as parser$Parser_parse_expr_no_struct, Parser_parse_expr_bp as parser$Parser_parse_expr_bp, Parser_parse_prefix as parser$Parser_parse_prefix, Parser_parse_dot_expr as parser$Parser_parse_dot_expr, Parser_parse_call_expr as parser$Parser_parse_call_expr, Parser_parse_arg_list as parser$Parser_parse_arg_list, Parser_parse_catch_expr as parser$Parser_parse_catch_expr, Parser_parse_string_interp as parser$Parser_parse_string_interp, Parser_parse_if_expr as parser$Parser_parse_if_expr, Parser_parse_match_expr as parser$Parser_parse_match_expr, Parser_parse_match_arm as parser$Parser_parse_match_arm, Parser_parse_pattern as parser$Parser_parse_pattern, Parser_parse_handle_expr as parser$Parser_parse_handle_expr, Parser_parse_effect_handler as parser$Parser_parse_effect_handler, Parser_parse_lambda_expr as parser$Parser_parse_lambda_expr, Parser_parse_struct_literal as parser$Parser_parse_struct_literal, Parser_try_parse_type_args as parser$Parser_try_parse_type_args, Parser_parse_type_expr as parser$Parser_parse_type_expr, Parser_parse_record_type_expr as parser$Parser_parse_record_type_expr, Parser_parse_type_params as parser$Parser_parse_type_params, Parser_parse_type_bound as parser$Parser_parse_type_bound, Parser_parse_params as parser$Parser_parse_params, Parser_parse_param as parser$Parser_parse_param } from "./parser.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";

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
  const relative = path_join(List_join(use_path_segments, "/"), ".ring");
  let path_part = "";
  const __ring_end0 = List_len(use_path_segments);
  for (let i = 0; i < __ring_end0; i++) {
    __ring_match0: {
      const __ring_m0 = List_get(use_path_segments, i);
      if (__ring_m0._tag === "some") {
        const seg = __ring_m0._0;
        if ((i === 0)) {
          path_part = seg;
        } else {
          path_part = path_join(path_part, seg);
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "none") {
        break __ring_match0;
      }
      __match_fail(__ring_m0);
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
  const empty_deps = [""];
  List_clear(empty_deps);
  _Map_insert(dependencies, entry_key, empty_deps);
  let queue = [entry_key];
  while ((List_len(queue) > 0)) {
    __ring_match1: {
      const __ring_m1 = List_shift(queue);
      if (__ring_m1._tag === "some") {
        const current_key = __ring_m1._0;
        __ring_match2: {
          const __ring_m2 = _Map_get(modules, current_key);
          if (__ring_m2._tag === "some") {
            const current_mod = __ring_m2._0;
            const source = read_file(current_mod.file_path);
            const resolve_sink = diagnostics$new_collecting_sink();
            const ast = parser$parse(source, current_mod.file_path, resolve_sink);
            if (diagnostics$CollectingSink_has_errors(resolve_sink)) {
              return Option_none;
            }
            _Map_insert(asts_map, current_key, ast);
            let deps = [""];
            List_clear(deps);
            for (const use_decl of ast.uses) {
              const segments = use_decl.path.segments;
              const dep_key = module_key(segments);
              if (List_contains(deps, dep_key)) {
              } else {
                __ring_match3: {
                  const __ring_m3 = resolve_module_file(segments, project_root);
                  if (__ring_m3._tag === "some") {
                    const resolved = __ring_m3._0;
                    const abs_resolved = path_resolve(resolved);
                    __ring_match4: {
                      const __ring_m4 = _Map_get(modules, dep_key);
                      if (__ring_m4._tag === "none") {
                        const dep_id = new ModuleId(list_clone(segments), abs_resolved);
                        _Map_insert(modules, dep_key, dep_id);
                        const empty = [""];
                        List_clear(empty);
                        _Map_insert(dependencies, dep_key, empty);
                        List_push(queue, dep_key);
                        break __ring_match4;
                      }
                      if (__ring_m4._tag === "some") {
                        break __ring_match4;
                      }
                      __match_fail(__ring_m4);
                    }
                    List_push(deps, dep_key);
                    break __ring_match3;
                  }
                  if (__ring_m3._tag === "none") {
                    return Option_none;
                    break __ring_match3;
                  }
                  __match_fail(__ring_m3);
                }
              }
            }
            _Map_insert(dependencies, current_key, deps);
            break __ring_match2;
          }
          if (__ring_m2._tag === "none") {
            break __ring_match2;
          }
          __match_fail(__ring_m2);
        }
        break __ring_match1;
      }
      if (__ring_m1._tag === "none") {
        break __ring_match1;
      }
      __match_fail(__ring_m1);
    }
  }
  let dep_count = map_new();
  for (const entry of _Map_entries(dependencies)) {
    const __ring_dt0 = entry;
    const key = __ring_dt0[0];
    const deps = __ring_dt0[1];
    _Map_insert(dep_count, key, List_len(deps));
  }
  let topo_order = [""];
  List_clear(topo_order);
  let ready = [""];
  List_clear(ready);
  for (const entry of _Map_entries(dep_count)) {
    const __ring_dt1 = entry;
    const key = __ring_dt1[0];
    const count = __ring_dt1[1];
    if ((count === 0)) {
      List_push(ready, key);
    }
  }
  while ((List_len(ready) > 0)) {
    __ring_match5: {
      const __ring_m5 = List_shift(ready);
      if (__ring_m5._tag === "some") {
        const node = __ring_m5._0;
        List_push(topo_order, node);
        for (const entry of _Map_entries(dependencies)) {
          const __ring_dt2 = entry;
          const key = __ring_dt2[0];
          const deps = __ring_dt2[1];
          if (List_contains(deps, node)) {
            __ring_match6: {
              const __ring_m6 = _Map_get(dep_count, key);
              if (__ring_m6._tag === "some") {
                const c = __ring_m6._0;
                const new_count = (c - 1);
                _Map_insert(dep_count, key, new_count);
                if ((new_count === 0)) {
                  List_push(ready, key);
                }
                break __ring_match6;
              }
              if (__ring_m6._tag === "none") {
                break __ring_match6;
              }
              __match_fail(__ring_m6);
            }
          }
        }
        break __ring_match5;
      }
      if (__ring_m5._tag === "none") {
        break __ring_match5;
      }
      __match_fail(__ring_m5);
    }
  }
  if ((List_len(topo_order) !== _Map_len(modules))) {
    return Option_none;
  }
  return Option_some(new ModuleGraph(new ModuleId([entry_basename], abs_entry), modules, dependencies, topo_order, asts_map));
}

function __ModuleId_Clone_clone(self) {
  return new ModuleId(__List_Clone.clone(self.path_segments, __Str_Clone), self.file_path);
}
const __ModuleId_Clone = { clone: __ModuleId_Clone_clone };

function __GraphError_Clone_clone(self) {
  return new GraphError(self.message, __Option_Clone.clone(self.cycle, __List_Clone));
}
const __GraphError_Clone = { clone: __GraphError_Clone_clone };

function __ModuleId_Debug_debug(self) {
  return "ModuleId { " + "path_segments: " + __List_Debug.debug(self.path_segments, __Str_Debug) + ", " + "file_path: " + String(self.file_path) + " }";
}
const __ModuleId_Debug = { debug: __ModuleId_Debug_debug };

function __GraphError_Debug_debug(self) {
  return "GraphError { " + "message: " + String(self.message) + ", " + "cycle: " + __Option_Debug.debug(self.cycle, __List_Debug) + " }";
}
const __GraphError_Debug = { debug: __GraphError_Debug_debug };


export { ModuleId, ModuleGraph, GraphError, module_key, module_prefix, resolve_module_file, build_module_graph, __ModuleId_Clone, __GraphError_Clone, __ModuleId_Debug, __GraphError_Debug };