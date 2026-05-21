import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_contains, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0706 as codes$E0706, error_description as codes$error_description, error_category as codes$error_category } from "./codes.js";

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

const Severity_SevError = Object.freeze({ _tag: "SevError" });
const Severity_SevWarning = Object.freeze({ _tag: "SevWarning" });
const Severity_SevInfo = Object.freeze({ _tag: "SevInfo" });
const Severity_SevHint = Object.freeze({ _tag: "SevHint" });

function severity_to_str(s) {
  __ring_match0: {
    const __ring_m0 = s;
    if (__ring_m0._tag === "SevError") {
      return "error";
      break __ring_match0;
    }
    if (__ring_m0._tag === "SevWarning") {
      return "warning";
      break __ring_match0;
    }
    if (__ring_m0._tag === "SevInfo") {
      return "info";
      break __ring_match0;
    }
    if (__ring_m0._tag === "SevHint") {
      return "hint";
      break __ring_match0;
    }
    __match_fail(__ring_m0);
  }
}

class DiagnosticNote {
  constructor(message, span) {
    this.message = message;
    this.span = span;
  }
}

function DiagnosticContext_TypeMismatch(expected, actual, expression) {
  return { _tag: "TypeMismatch", expected, actual, expression };
}
function DiagnosticContext_UndefinedVariable(name, scope_locals) {
  return { _tag: "UndefinedVariable", name, scope_locals };
}
function DiagnosticContext_MissingField(field, ty, available) {
  return { _tag: "MissingField", field, ty, available };
}
function DiagnosticContext_EffectUnhandled(eff, in_function) {
  return { _tag: "EffectUnhandled", eff, in_function };
}
function DiagnosticContext_ParseError(token, expected) {
  return { _tag: "ParseError", token, expected };
}
function DiagnosticContext_PatternError(detail) {
  return { _tag: "PatternError", detail };
}
function DiagnosticContext_TraitError(detail) {
  return { _tag: "TraitError", detail };
}
function DiagnosticContext_OtherContext(detail) {
  return { _tag: "OtherContext", detail };
}

class Suggestion {
  constructor(message, replacement, span) {
    this.message = message;
    this.replacement = replacement;
    this.span = span;
  }
}

class Diagnostic {
  constructor(severity, code, message, span, notes, context, suggestions, category) {
    this.severity = severity;
    this.code = code;
    this.message = message;
    this.span = span;
    this.notes = notes;
    this.context = context;
    this.suggestions = suggestions;
    this.category = category;
  }
}

function dummy_span() {
  return new ast$Span("", new ast$Position(0, 0, 0), new ast$Position(0, 0, 0));
}


class CollectingSink {
  constructor(items) {
    this.items = items;
  }
}

function new_collecting_sink() {
  return new CollectingSink([]);
}

function CollectingSink_report(self, d) {
  return List_push(self.items, d);
}
function CollectingSink_has_errors(self) {
  return self.items.some((function(d) { return (function() {
  const __ring_m = d.severity;
  if (__ring_m._tag === "SevError") { return true; }
  return false;
})(); }));
}
function CollectingSink_diagnostics(self) {
  return self.items;
}
function CollectingSink_clear(self) {
  return List_clear(self.items);
}
function CollectingSink_save(self) {
  return List_len(self.items);
}
function CollectingSink_restore(self, checkpoint) {
  self.items = List_slice(self.items, 0, checkpoint);
}

function __CollectingSink_DiagnosticSink_report(self, d) {
  return List_push(self.items, d);
}
function __CollectingSink_DiagnosticSink_has_errors(self) {
  return self.items.some((function(d) { return (function() {
  const __ring_m = d.severity;
  if (__ring_m._tag === "SevError") { return true; }
  return false;
})(); }));
}
function __CollectingSink_DiagnosticSink_get_diagnostics(self) {
  return self.items;
}
const __CollectingSink_DiagnosticSink = { report: __CollectingSink_DiagnosticSink_report, has_errors: __CollectingSink_DiagnosticSink_has_errors, get_diagnostics: __CollectingSink_DiagnosticSink_get_diagnostics };

function make_diagnostic(code, severity, message, span, context, notes) {
  return new Diagnostic(severity, code, message, span, notes, context, [], Option_some(codes$error_category(code)));
}

function make_diag(code, severity, message, span, context) {
  return make_diagnostic(code, severity, message, span, context, []);
}

function __DiagnosticNote_Eq_eq(self, other) {
  return (self.message === other.message) && __Option_Eq.eq(self.span, other.span, __Span_Eq);
}
const __DiagnosticNote_Eq = { eq: __DiagnosticNote_Eq_eq, ne: function(self, other) { return !__DiagnosticNote_Eq_eq(self, other); } };

function __Suggestion_Eq_eq(self, other) {
  return (self.message === other.message) && __Option_Eq.eq(self.replacement, other.replacement, __Str_Eq) && __Option_Eq.eq(self.span, other.span, __Span_Eq);
}
const __Suggestion_Eq = { eq: __Suggestion_Eq_eq, ne: function(self, other) { return !__Suggestion_Eq_eq(self, other); } };

function __Severity_Eq_eq(self, other) {
  if (self._tag !== other._tag) return false;
  return true;
}
const __Severity_Eq = { eq: __Severity_Eq_eq, ne: function(self, other) { return !__Severity_Eq_eq(self, other); } };

function __DiagnosticNote_Clone_clone(self) {
  return new DiagnosticNote(self.message, __Option_Clone.clone(self.span, __Span_Clone));
}
const __DiagnosticNote_Clone = { clone: __DiagnosticNote_Clone_clone };

function __Suggestion_Clone_clone(self) {
  return new Suggestion(self.message, __Option_Clone.clone(self.replacement, __Str_Clone), __Option_Clone.clone(self.span, __Span_Clone));
}
const __Suggestion_Clone = { clone: __Suggestion_Clone_clone };

function __Severity_Clone_clone(self) {
  switch (self._tag) {
    case "SevError": return Severity_SevError;
    case "SevWarning": return Severity_SevWarning;
    case "SevInfo": return Severity_SevInfo;
    case "SevHint": return Severity_SevHint;
    default: return self;
  }
}
const __Severity_Clone = { clone: __Severity_Clone_clone };

function __DiagnosticContext_Clone_clone(self) {
  switch (self._tag) {
    case "TypeMismatch": return DiagnosticContext_TypeMismatch(self.expected, self.actual, __Option_Clone.clone(self.expression, __Str_Clone));
    case "UndefinedVariable": return DiagnosticContext_UndefinedVariable(self.name, __Option_Clone.clone(self.scope_locals, __List_Clone));
    case "MissingField": return DiagnosticContext_MissingField(self.field, self.ty, __Option_Clone.clone(self.available, __List_Clone));
    case "EffectUnhandled": return DiagnosticContext_EffectUnhandled(self.eff, __Option_Clone.clone(self.in_function, __Str_Clone));
    case "ParseError": return DiagnosticContext_ParseError(self.token, __Option_Clone.clone(self.expected, __List_Clone));
    case "PatternError": return DiagnosticContext_PatternError(self.detail);
    case "TraitError": return DiagnosticContext_TraitError(self.detail);
    case "OtherContext": return DiagnosticContext_OtherContext(__Option_Clone.clone(self.detail, __Str_Clone));
    default: return self;
  }
}
const __DiagnosticContext_Clone = { clone: __DiagnosticContext_Clone_clone };

function __Diagnostic_Clone_clone(self) {
  return new Diagnostic(__Severity_Clone.clone(self.severity), self.code, self.message, __Span_Clone.clone(self.span), __List_Clone.clone(self.notes, __DiagnosticNote_Clone), __DiagnosticContext_Clone.clone(self.context), __List_Clone.clone(self.suggestions, __Suggestion_Clone), __Option_Clone.clone(self.category, __Str_Clone));
}
const __Diagnostic_Clone = { clone: __Diagnostic_Clone_clone };

function __CollectingSink_Clone_clone(self) {
  return new CollectingSink(__List_Clone.clone(self.items, __Diagnostic_Clone));
}
const __CollectingSink_Clone = { clone: __CollectingSink_Clone_clone };

const __Severity_tag_order = { "SevError": 0, "SevWarning": 1, "SevInfo": 2, "SevHint": 3 };
function __Severity_Ord_cmp(self, other) {
  var t1 = __Severity_tag_order[self._tag];
  var t2 = __Severity_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  return 0;
}
const __Severity_Ord = { cmp: __Severity_Ord_cmp };

function __DiagnosticNote_Debug_debug(self) {
  return "DiagnosticNote { " + "message: " + String(self.message) + ", " + "span: " + __Option_Debug.debug(self.span, __Span_Debug) + " }";
}
const __DiagnosticNote_Debug = { debug: __DiagnosticNote_Debug_debug };

function __Suggestion_Debug_debug(self) {
  return "Suggestion { " + "message: " + String(self.message) + ", " + "replacement: " + __Option_Debug.debug(self.replacement, __Str_Debug) + ", " + "span: " + __Option_Debug.debug(self.span, __Span_Debug) + " }";
}
const __Suggestion_Debug = { debug: __Suggestion_Debug_debug };

function __Severity_Debug_debug(self) {
  switch (self._tag) {
    case "SevError": return "SevError";
    case "SevWarning": return "SevWarning";
    case "SevInfo": return "SevInfo";
    case "SevHint": return "SevHint";
    default: return self._tag;
  }
}
const __Severity_Debug = { debug: __Severity_Debug_debug };

function __DiagnosticContext_Debug_debug(self) {
  switch (self._tag) {
    case "TypeMismatch": return "TypeMismatch { " + "expected: " + String(self.expected) + ", " + "actual: " + String(self.actual) + ", " + "expression: " + __Option_Debug.debug(self.expression, __Str_Debug) + " }";
    case "UndefinedVariable": return "UndefinedVariable { " + "name: " + String(self.name) + ", " + "scope_locals: " + __Option_Debug.debug(self.scope_locals, __List_Debug) + " }";
    case "MissingField": return "MissingField { " + "field: " + String(self.field) + ", " + "ty: " + String(self.ty) + ", " + "available: " + __Option_Debug.debug(self.available, __List_Debug) + " }";
    case "EffectUnhandled": return "EffectUnhandled { " + "eff: " + String(self.eff) + ", " + "in_function: " + __Option_Debug.debug(self.in_function, __Str_Debug) + " }";
    case "ParseError": return "ParseError { " + "token: " + String(self.token) + ", " + "expected: " + __Option_Debug.debug(self.expected, __List_Debug) + " }";
    case "PatternError": return "PatternError { " + "detail: " + String(self.detail) + " }";
    case "TraitError": return "TraitError { " + "detail: " + String(self.detail) + " }";
    case "OtherContext": return "OtherContext { " + "detail: " + __Option_Debug.debug(self.detail, __Str_Debug) + " }";
    default: return self._tag;
  }
}
const __DiagnosticContext_Debug = { debug: __DiagnosticContext_Debug_debug };

function __Diagnostic_Debug_debug(self) {
  return "Diagnostic { " + "severity: " + __Severity_Debug.debug(self.severity) + ", " + "code: " + String(self.code) + ", " + "message: " + String(self.message) + ", " + "span: " + __Span_Debug.debug(self.span) + ", " + "notes: " + __List_Debug.debug(self.notes, __DiagnosticNote_Debug) + ", " + "context: " + __DiagnosticContext_Debug.debug(self.context) + ", " + "suggestions: " + __List_Debug.debug(self.suggestions, __Suggestion_Debug) + ", " + "category: " + __Option_Debug.debug(self.category, __Str_Debug) + " }";
}
const __Diagnostic_Debug = { debug: __Diagnostic_Debug_debug };

function __CollectingSink_Debug_debug(self) {
  return "CollectingSink { " + "items: " + __List_Debug.debug(self.items, __Diagnostic_Debug) + " }";
}
const __CollectingSink_Debug = { debug: __CollectingSink_Debug_debug };


export { Severity_SevError, Severity_SevWarning, Severity_SevInfo, Severity_SevHint, severity_to_str, DiagnosticNote, DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError, DiagnosticContext_PatternError, DiagnosticContext_TraitError, DiagnosticContext_OtherContext, Suggestion, Diagnostic, CollectingSink, new_collecting_sink, make_diagnostic, make_diag, CollectingSink_report, CollectingSink_has_errors, CollectingSink_diagnostics, CollectingSink_clear, CollectingSink_save, CollectingSink_restore, __CollectingSink_DiagnosticSink, __DiagnosticNote_Eq, __Suggestion_Eq, __Severity_Eq, __DiagnosticNote_Clone, __Suggestion_Clone, __Severity_Clone, __DiagnosticContext_Clone, __Diagnostic_Clone, __CollectingSink_Clone, __Severity_Ord, __DiagnosticNote_Debug, __Suggestion_Debug, __Severity_Debug, __DiagnosticContext_Debug, __Diagnostic_Debug, __CollectingSink_Debug };