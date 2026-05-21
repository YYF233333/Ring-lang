import { __EffectAbort, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_first, List_last, List_contains, List_is_empty, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_is_empty, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_is_empty, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_OptionUnwrap as ast$Expr_OptionUnwrap, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";

function format_human(diagnostics, source) {
  const lines = Str_split(source, "\n");
  let parts = [];
  for (const d of diagnostics) {
    List_push(parts, `${diagnostics$severity_to_str(d.severity)}[${d.code}]: ${d.message}`);
    List_push(parts, `  --> ${d.span.file}:${Int_to_str(d.span.start.line)}:${Int_to_str(d.span.start.column)}`);
    List_push(parts, "   |");
    const line_num = d.span.start.line;
    const source_line = List_get(lines, (line_num - 1));
    __ring_match0: {
      const __ring_m0 = source_line;
      if (__ring_m0._tag === "some") {
        const sl = __ring_m0._0;
        const gutter = Str_pad_start(Int_to_str(line_num), 3, " ");
        List_push(parts, `${gutter} | ${sl}`);
        const underline_start = d.span.start.column;
        let underline_len = 1;
        if ((d.span.start.line === d.span.end.line)) {
          const diff = (d.span.end.column - d.span.start.column);
          if ((diff > 1)) {
            underline_len = diff;
          }
        } else {
          const diff = (Str_len(sl) - underline_start);
          if ((diff > 1)) {
            underline_len = diff;
          }
        }
        const padding = Str_repeat(" ", underline_start);
        const carets = Str_repeat("^", underline_len);
        const hint = format_hint(d);
        if ((Str_len(hint) > 0)) {
          List_push(parts, `   | ${padding}${carets} ${hint}`);
        } else {
          List_push(parts, `   | ${padding}${carets}`);
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "none") {
        break __ring_match0;
      }
      __match_fail(__ring_m0);
    }
    List_push(parts, "   |");
    List_push(parts, "");
  }
  return List_join(parts, "\n");
}

function format_hint(d) {
  __ring_match1: {
    const __ring_m1 = d.context;
    if (__ring_m1._tag === "TypeMismatch") {
      const expected = __ring_m1.expected; const actual = __ring_m1.actual;
      return `expected ${expected}, got ${actual}`;
      break __ring_match1;
    }
    if (__ring_m1._tag === "UndefinedVariable") {
      return "not found in this scope";
      break __ring_match1;
    }
    if (__ring_m1._tag === "MissingField") {
      const field = __ring_m1.field;
      return `field '${field}' not found`;
      break __ring_match1;
    }
    if (__ring_m1._tag === "EffectUnhandled") {
      const eff = __ring_m1.eff;
      return `effect '${eff}' must be handled`;
      break __ring_match1;
    }
    if (__ring_m1._tag === "ParseError") {
      const expected = __ring_m1.expected;
      __ring_match2: {
        const __ring_m2 = expected;
        if (__ring_m2._tag === "some") {
          const exp = __ring_m2._0;
          return `expected ${List_join(exp, " or ")}`;
          break __ring_match2;
        }
        if (__ring_m2._tag === "none") {
          return "";
          break __ring_match2;
        }
        __match_fail(__ring_m2);
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "PatternError") {
      const detail = __ring_m1.detail;
      return detail;
      break __ring_match1;
    }
    if (__ring_m1._tag === "TraitError") {
      const detail = __ring_m1.detail;
      return detail;
      break __ring_match1;
    }
    if (__ring_m1._tag === "OtherContext") {
      return "";
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
}

function format_llm(diagnostics, file) {
  let parts = [];
  List_push(parts, "{\n");
  List_push(parts, "  \"version\": 1,\n");
  List_push(parts, `  "file": ${jq(file)},
`);
  List_push(parts, "  \"diagnostics\": [");
  const __ring_end0 = List_len(diagnostics);
  for (let i = 0; i < __ring_end0; i++) {
    const d = List_get(diagnostics, i);
    __ring_match3: {
      const __ring_m3 = d;
      if (__ring_m3._tag === "some") {
        const diag = __ring_m3._0;
        if ((i > 0)) {
          List_push(parts, ",");
        }
        List_push(parts, "\n    {\n");
        List_push(parts, `      "code": ${jq(diag.code)},
`);
        List_push(parts, `      "severity": ${jq(diagnostics$severity_to_str(diag.severity))},
`);
        List_push(parts, `      "message": ${jq(diag.message)},
`);
        List_push(parts, "      \"span\": {\n");
        List_push(parts, `        "line": ${Int_to_str(diag.span.start.line)},
`);
        List_push(parts, `        "col": ${Int_to_str(diag.span.start.column)},
`);
        List_push(parts, `        "end_line": ${Int_to_str(diag.span.end.line)},
`);
        List_push(parts, `        "end_col": ${Int_to_str(diag.span.end.column)}
`);
        List_push(parts, "      },\n");
        List_push(parts, `      "context": ${context_to_json(diag.context)},
`);
        List_push(parts, `      "suggestions": ${suggestions_to_json(diag.suggestions)}
`);
        List_push(parts, "    }");
        break __ring_match3;
      }
      if (__ring_m3._tag === "none") {
        break __ring_match3;
      }
      __match_fail(__ring_m3);
    }
  }
  List_push(parts, "\n  ]\n");
  List_push(parts, "}");
  return List_join(parts, "");
}

function jq(s) {
  const escaped = Str_replace(Str_replace(Str_replace(Str_replace(Str_replace(s, "\\", "\\\\"), "\"", "\\\""), "\n", "\\n"), "\t", "\\t"), "\r", "\\r");
  return `"${escaped}"`;
}

function context_to_json(ctx) {
  __ring_match4: {
    const __ring_m4 = ctx;
    if (__ring_m4._tag === "TypeMismatch") {
      const expected = __ring_m4.expected; const actual = __ring_m4.actual; const expression = __ring_m4.expression;
      let parts = [];
      List_push(parts, "\"kind\": \"type_mismatch\"");
      List_push(parts, `"expected": ${jq(expected)}`);
      List_push(parts, `"actual": ${jq(actual)}`);
      __ring_match5: {
        const __ring_m5 = expression;
        if (__ring_m5._tag === "some") {
          const e = __ring_m5._0;
          List_push(parts, `"expression": ${jq(e)}`);
          break __ring_match5;
        }
        if (__ring_m5._tag === "none") {
          break __ring_match5;
        }
        __match_fail(__ring_m5);
      }
      return `{ ${List_join(parts, ", ")} }`;
      break __ring_match4;
    }
    if (__ring_m4._tag === "UndefinedVariable") {
      const name = __ring_m4.name; const scope_locals = __ring_m4.scope_locals;
      let parts = [];
      List_push(parts, "\"kind\": \"undefined_variable\"");
      List_push(parts, `"name": ${jq(name)}`);
      __ring_match6: {
        const __ring_m6 = scope_locals;
        if (__ring_m6._tag === "some") {
          const locals = __ring_m6._0;
          const items = locals.map((function(s) { return jq(s); }));
          List_push(parts, `"scope_locals": [${List_join(items, ", ")}]`);
          break __ring_match6;
        }
        if (__ring_m6._tag === "none") {
          break __ring_match6;
        }
        __match_fail(__ring_m6);
      }
      return `{ ${List_join(parts, ", ")} }`;
      break __ring_match4;
    }
    if (__ring_m4._tag === "MissingField") {
      const field = __ring_m4.field; const ty = __ring_m4.ty; const available = __ring_m4.available;
      let parts = [];
      List_push(parts, "\"kind\": \"missing_field\"");
      List_push(parts, `"field": ${jq(field)}`);
      List_push(parts, `"type": ${jq(ty)}`);
      __ring_match7: {
        const __ring_m7 = available;
        if (__ring_m7._tag === "some") {
          const avail = __ring_m7._0;
          const items = avail.map((function(s) { return jq(s); }));
          List_push(parts, `"available": [${List_join(items, ", ")}]`);
          break __ring_match7;
        }
        if (__ring_m7._tag === "none") {
          break __ring_match7;
        }
        __match_fail(__ring_m7);
      }
      return `{ ${List_join(parts, ", ")} }`;
      break __ring_match4;
    }
    if (__ring_m4._tag === "EffectUnhandled") {
      const eff = __ring_m4.eff; const in_function = __ring_m4.in_function;
      let parts = [];
      List_push(parts, "\"kind\": \"effect_unhandled\"");
      List_push(parts, `"effect": ${jq(eff)}`);
      __ring_match8: {
        const __ring_m8 = in_function;
        if (__ring_m8._tag === "some") {
          const f = __ring_m8._0;
          List_push(parts, `"in_function": ${jq(f)}`);
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      return `{ ${List_join(parts, ", ")} }`;
      break __ring_match4;
    }
    if (__ring_m4._tag === "ParseError") {
      const token = __ring_m4.token; const expected = __ring_m4.expected;
      let parts = [];
      List_push(parts, "\"kind\": \"parse_error\"");
      List_push(parts, `"token": ${jq(token)}`);
      __ring_match9: {
        const __ring_m9 = expected;
        if (__ring_m9._tag === "some") {
          const exp = __ring_m9._0;
          const items = exp.map((function(s) { return jq(s); }));
          List_push(parts, `"expected": [${List_join(items, ", ")}]`);
          break __ring_match9;
        }
        if (__ring_m9._tag === "none") {
          break __ring_match9;
        }
        __match_fail(__ring_m9);
      }
      return `{ ${List_join(parts, ", ")} }`;
      break __ring_match4;
    }
    if (__ring_m4._tag === "PatternError") {
      const detail = __ring_m4.detail;
      return `{ "kind": "pattern_error", "detail": ${jq(detail)} }`;
      break __ring_match4;
    }
    if (__ring_m4._tag === "TraitError") {
      const detail = __ring_m4.detail;
      return `{ "kind": "trait_error", "detail": ${jq(detail)} }`;
      break __ring_match4;
    }
    if (__ring_m4._tag === "OtherContext") {
      const detail = __ring_m4.detail;
      __ring_match10: {
        const __ring_m10 = detail;
        if (__ring_m10._tag === "some") {
          const d = __ring_m10._0;
          return `{ "kind": "other", "detail": ${jq(d)} }`;
          break __ring_match10;
        }
        if (__ring_m10._tag === "none") {
          return "{ \"kind\": \"other\" }";
          break __ring_match10;
        }
        __match_fail(__ring_m10);
      }
      break __ring_match4;
    }
    __match_fail(__ring_m4);
  }
}

function suggestions_to_json(suggestions) {
  if (List_is_empty(suggestions)) {
    return "[]";
  }
  let items = [];
  for (const s of suggestions) {
    __ring_match11: {
      const __ring_m11 = s.replacement;
      if (__ring_m11._tag === "some") {
        const r = __ring_m11._0;
        List_push(items, `{ "message": ${jq(s.message)}, "replacement": ${jq(r)} }`);
        break __ring_match11;
      }
      if (__ring_m11._tag === "none") {
        List_push(items, `{ "message": ${jq(s.message)} }`);
        break __ring_match11;
      }
      __match_fail(__ring_m11);
    }
  }
  return `[${List_join(items, ", ")}]`;
}


export { format_human, format_llm };