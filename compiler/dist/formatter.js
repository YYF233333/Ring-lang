import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";

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

function format_human(diagnostics, source) {
  const lines = Str_split(source, "\n");
  let parts = [];
  for (const d of diagnostics) {
    List_push(parts, `${diagnostics$severity_to_str(d.severity)}[${d.code}]: ${d.message}`);
    List_push(parts, `  --> ${d.span.file}:${Int_to_str(d.span.start.line)}:${Int_to_str(d.span.start.column)}`);
    List_push(parts, "   |");
    const line_num = d.span.start.line;
    const source_line = List_get(lines, (line_num - 1));
    __ring_match6: {
      const __ring_m6 = source_line;
      if (__ring_m6._tag === "some") {
        const sl = __ring_m6._0;
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
        break __ring_match6;
      }
      if (__ring_m6._tag === "none") {
        break __ring_match6;
      }
      __match_fail(__ring_m6);
    }
    for (const s of d.suggestions) {
      List_push(parts, `   = help: ${s.message}`);
    }
    List_push(parts, "   |");
    List_push(parts, "");
  }
  return List_join(parts, "\n");
}

function format_hint(d) {
  __ring_match7: {
    const __ring_m7 = d.context;
    if (__ring_m7._tag === "TypeMismatch") {
      const expected = __ring_m7.expected; const actual = __ring_m7.actual;
      return `expected ${expected}, got ${actual}`;
      break __ring_match7;
    }
    if (__ring_m7._tag === "UndefinedVariable") {
      return "not found in this scope";
      break __ring_match7;
    }
    if (__ring_m7._tag === "MissingField") {
      const field = __ring_m7.field;
      return `field '${field}' not found`;
      break __ring_match7;
    }
    if (__ring_m7._tag === "EffectUnhandled") {
      const eff = __ring_m7.eff;
      return `effect '${eff}' must be handled`;
      break __ring_match7;
    }
    if (__ring_m7._tag === "ParseError") {
      const expected = __ring_m7.expected;
      __ring_match8: {
        const __ring_m8 = expected;
        if (__ring_m8._tag === "some") {
          const exp = __ring_m8._0;
          return `expected ${List_join(exp, " or ")}`;
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          return "";
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "PatternError") {
      const detail = __ring_m7.detail;
      return detail;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TraitError") {
      const detail = __ring_m7.detail;
      return detail;
      break __ring_match7;
    }
    if (__ring_m7._tag === "OtherContext") {
      return "";
      break __ring_match7;
    }
    __match_fail(__ring_m7);
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
    __ring_match9: {
      const __ring_m9 = d;
      if (__ring_m9._tag === "some") {
        const diag = __ring_m9._0;
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
        List_push(parts, `      "suggestions": ${suggestions_to_json(diag.suggestions)},
`);
        __ring_match10: {
          const __ring_m10 = diag.category;
          if (__ring_m10._tag === "some") {
            const cat = __ring_m10._0;
            List_push(parts, `      "category": ${jq(cat)}
`);
            break __ring_match10;
          }
          if (__ring_m10._tag === "none") {
            List_push(parts, "      \"category\": null\n");
            break __ring_match10;
          }
          __match_fail(__ring_m10);
        }
        List_push(parts, "    }");
        break __ring_match9;
      }
      if (__ring_m9._tag === "none") {
        break __ring_match9;
      }
      __match_fail(__ring_m9);
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
  __ring_match11: {
    const __ring_m11 = ctx;
    if (__ring_m11._tag === "TypeMismatch") {
      const expected = __ring_m11.expected; const actual = __ring_m11.actual; const expression = __ring_m11.expression;
      let parts = [];
      List_push(parts, "\"kind\": \"type_mismatch\"");
      List_push(parts, `"expected": ${jq(expected)}`);
      List_push(parts, `"actual": ${jq(actual)}`);
      __ring_match12: {
        const __ring_m12 = expression;
        if (__ring_m12._tag === "some") {
          const e = __ring_m12._0;
          List_push(parts, `"expression": ${jq(e)}`);
          break __ring_match12;
        }
        if (__ring_m12._tag === "none") {
          break __ring_match12;
        }
        __match_fail(__ring_m12);
      }
      return `{ ${List_join(parts, ", ")} }`;
      break __ring_match11;
    }
    if (__ring_m11._tag === "UndefinedVariable") {
      const name = __ring_m11.name; const scope_locals = __ring_m11.scope_locals;
      let parts = [];
      List_push(parts, "\"kind\": \"undefined_variable\"");
      List_push(parts, `"name": ${jq(name)}`);
      __ring_match13: {
        const __ring_m13 = scope_locals;
        if (__ring_m13._tag === "some") {
          const locals = __ring_m13._0;
          const items = locals.map((function(s) { return jq(s); }));
          List_push(parts, `"scope_locals": [${List_join(items, ", ")}]`);
          break __ring_match13;
        }
        if (__ring_m13._tag === "none") {
          break __ring_match13;
        }
        __match_fail(__ring_m13);
      }
      return `{ ${List_join(parts, ", ")} }`;
      break __ring_match11;
    }
    if (__ring_m11._tag === "MissingField") {
      const field = __ring_m11.field; const ty = __ring_m11.ty; const available = __ring_m11.available;
      let parts = [];
      List_push(parts, "\"kind\": \"missing_field\"");
      List_push(parts, `"field": ${jq(field)}`);
      List_push(parts, `"type": ${jq(ty)}`);
      __ring_match14: {
        const __ring_m14 = available;
        if (__ring_m14._tag === "some") {
          const avail = __ring_m14._0;
          const items = avail.map((function(s) { return jq(s); }));
          List_push(parts, `"available": [${List_join(items, ", ")}]`);
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      return `{ ${List_join(parts, ", ")} }`;
      break __ring_match11;
    }
    if (__ring_m11._tag === "EffectUnhandled") {
      const eff = __ring_m11.eff; const in_function = __ring_m11.in_function;
      let parts = [];
      List_push(parts, "\"kind\": \"effect_unhandled\"");
      List_push(parts, `"effect": ${jq(eff)}`);
      __ring_match15: {
        const __ring_m15 = in_function;
        if (__ring_m15._tag === "some") {
          const f = __ring_m15._0;
          List_push(parts, `"in_function": ${jq(f)}`);
          break __ring_match15;
        }
        if (__ring_m15._tag === "none") {
          break __ring_match15;
        }
        __match_fail(__ring_m15);
      }
      return `{ ${List_join(parts, ", ")} }`;
      break __ring_match11;
    }
    if (__ring_m11._tag === "ParseError") {
      const token = __ring_m11.token; const expected = __ring_m11.expected;
      let parts = [];
      List_push(parts, "\"kind\": \"parse_error\"");
      List_push(parts, `"token": ${jq(token)}`);
      __ring_match16: {
        const __ring_m16 = expected;
        if (__ring_m16._tag === "some") {
          const exp = __ring_m16._0;
          const items = exp.map((function(s) { return jq(s); }));
          List_push(parts, `"expected": [${List_join(items, ", ")}]`);
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      return `{ ${List_join(parts, ", ")} }`;
      break __ring_match11;
    }
    if (__ring_m11._tag === "PatternError") {
      const detail = __ring_m11.detail;
      return `{ "kind": "pattern_error", "detail": ${jq(detail)} }`;
      break __ring_match11;
    }
    if (__ring_m11._tag === "TraitError") {
      const detail = __ring_m11.detail;
      return `{ "kind": "trait_error", "detail": ${jq(detail)} }`;
      break __ring_match11;
    }
    if (__ring_m11._tag === "OtherContext") {
      const detail = __ring_m11.detail;
      __ring_match17: {
        const __ring_m17 = detail;
        if (__ring_m17._tag === "some") {
          const d = __ring_m17._0;
          return `{ "kind": "other", "detail": ${jq(d)} }`;
          break __ring_match17;
        }
        if (__ring_m17._tag === "none") {
          return "{ \"kind\": \"other\" }";
          break __ring_match17;
        }
        __match_fail(__ring_m17);
      }
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
}

function suggestions_to_json(suggestions) {
  if (List_is_empty(suggestions)) {
    return "[]";
  }
  let items = [];
  for (const s of suggestions) {
    __ring_match18: {
      const __ring_m18 = s.replacement;
      if (__ring_m18._tag === "some") {
        const r = __ring_m18._0;
        List_push(items, `{ "message": ${jq(s.message)}, "replacement": ${jq(r)} }`);
        break __ring_match18;
      }
      if (__ring_m18._tag === "none") {
        List_push(items, `{ "message": ${jq(s.message)} }`);
        break __ring_match18;
      }
      __match_fail(__ring_m18);
    }
  }
  return `[${List_join(items, ", ")}]`;
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

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { format_human, format_llm };