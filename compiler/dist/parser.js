import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { token_kind_value as lexer$token_kind_value, new_lexer as lexer$new_lexer, TokenKind_TkFn as lexer$TokenKind_TkFn, TokenKind_TkLet as lexer$TokenKind_TkLet, TokenKind_TkVar as lexer$TokenKind_TkVar, TokenKind_TkMut as lexer$TokenKind_TkMut, TokenKind_TkConst as lexer$TokenKind_TkConst, TokenKind_TkStruct as lexer$TokenKind_TkStruct, TokenKind_TkEnum as lexer$TokenKind_TkEnum, TokenKind_TkMatch as lexer$TokenKind_TkMatch, TokenKind_TkImpl as lexer$TokenKind_TkImpl, TokenKind_TkEffect as lexer$TokenKind_TkEffect, TokenKind_TkHandle as lexer$TokenKind_TkHandle, TokenKind_TkWith as lexer$TokenKind_TkWith, TokenKind_TkIf as lexer$TokenKind_TkIf, TokenKind_TkElse as lexer$TokenKind_TkElse, TokenKind_TkCatch as lexer$TokenKind_TkCatch, TokenKind_TkTest as lexer$TokenKind_TkTest, TokenKind_TkReturn as lexer$TokenKind_TkReturn, TokenKind_TkFor as lexer$TokenKind_TkFor, TokenKind_TkIn as lexer$TokenKind_TkIn, TokenKind_TkPub as lexer$TokenKind_TkPub, TokenKind_TkWhere as lexer$TokenKind_TkWhere, TokenKind_TkTrue as lexer$TokenKind_TkTrue, TokenKind_TkFalse as lexer$TokenKind_TkFalse, TokenKind_TkTrait as lexer$TokenKind_TkTrait, TokenKind_TkTry as lexer$TokenKind_TkTry, TokenKind_TkWhile as lexer$TokenKind_TkWhile, TokenKind_TkBreak as lexer$TokenKind_TkBreak, TokenKind_TkContinue as lexer$TokenKind_TkContinue, TokenKind_TkLoop as lexer$TokenKind_TkLoop, TokenKind_TkUse as lexer$TokenKind_TkUse, TokenKind_TkAs as lexer$TokenKind_TkAs, TokenKind_TkExtern as lexer$TokenKind_TkExtern, TokenKind_TkMod as lexer$TokenKind_TkMod, TokenKind_TkSuper as lexer$TokenKind_TkSuper, TokenKind_TkSig as lexer$TokenKind_TkSig, TokenKind_TkRequires as lexer$TokenKind_TkRequires, TokenKind_TkIntLit as lexer$TokenKind_TkIntLit, TokenKind_TkFloatLit as lexer$TokenKind_TkFloatLit, TokenKind_TkStringLit as lexer$TokenKind_TkStringLit, TokenKind_TkStringInterpStart as lexer$TokenKind_TkStringInterpStart, TokenKind_TkStringInterpMiddle as lexer$TokenKind_TkStringInterpMiddle, TokenKind_TkStringInterpEnd as lexer$TokenKind_TkStringInterpEnd, TokenKind_TkRawStringLit as lexer$TokenKind_TkRawStringLit, TokenKind_TkIdent as lexer$TokenKind_TkIdent, TokenKind_TkPlus as lexer$TokenKind_TkPlus, TokenKind_TkMinus as lexer$TokenKind_TkMinus, TokenKind_TkStar as lexer$TokenKind_TkStar, TokenKind_TkSlash as lexer$TokenKind_TkSlash, TokenKind_TkPercent as lexer$TokenKind_TkPercent, TokenKind_TkEqEq as lexer$TokenKind_TkEqEq, TokenKind_TkBangEq as lexer$TokenKind_TkBangEq, TokenKind_TkLt as lexer$TokenKind_TkLt, TokenKind_TkGt as lexer$TokenKind_TkGt, TokenKind_TkLtEq as lexer$TokenKind_TkLtEq, TokenKind_TkGtEq as lexer$TokenKind_TkGtEq, TokenKind_TkAmpAmp as lexer$TokenKind_TkAmpAmp, TokenKind_TkPipePipe as lexer$TokenKind_TkPipePipe, TokenKind_TkBang as lexer$TokenKind_TkBang, TokenKind_TkEq as lexer$TokenKind_TkEq, TokenKind_TkPlusEq as lexer$TokenKind_TkPlusEq, TokenKind_TkMinusEq as lexer$TokenKind_TkMinusEq, TokenKind_TkLParen as lexer$TokenKind_TkLParen, TokenKind_TkRParen as lexer$TokenKind_TkRParen, TokenKind_TkLBrace as lexer$TokenKind_TkLBrace, TokenKind_TkRBrace as lexer$TokenKind_TkRBrace, TokenKind_TkLBracket as lexer$TokenKind_TkLBracket, TokenKind_TkRBracket as lexer$TokenKind_TkRBracket, TokenKind_TkComma as lexer$TokenKind_TkComma, TokenKind_TkColon as lexer$TokenKind_TkColon, TokenKind_TkColonColon as lexer$TokenKind_TkColonColon, TokenKind_TkDot as lexer$TokenKind_TkDot, TokenKind_TkDotDot as lexer$TokenKind_TkDotDot, TokenKind_TkDotDotEq as lexer$TokenKind_TkDotDotEq, TokenKind_TkFatArrow as lexer$TokenKind_TkFatArrow, TokenKind_TkArrow as lexer$TokenKind_TkArrow, TokenKind_TkQuestion as lexer$TokenKind_TkQuestion, TokenKind_TkSemi as lexer$TokenKind_TkSemi, TokenKind_TkEof as lexer$TokenKind_TkEof, TokenKind_TkError as lexer$TokenKind_TkError, Token as lexer$Token, Lexer as lexer$Lexer, __TokenKind_Eq as lexer$__TokenKind_Eq, __Token_Eq as lexer$__Token_Eq, __Lexer_Clone as lexer$__Lexer_Clone, __TokenKind_Clone as lexer$__TokenKind_Clone, __Token_Clone as lexer$__Token_Clone, __TokenKind_Ord as lexer$__TokenKind_Ord, __Token_Ord as lexer$__Token_Ord, __Lexer_Debug as lexer$__Lexer_Debug, __TokenKind_Debug as lexer$__TokenKind_Debug, __Token_Debug as lexer$__Token_Debug, Lexer_tokenize as lexer$Lexer_tokenize, Lexer_next_token as lexer$Lexer_next_token, Lexer_lex_string as lexer$Lexer_lex_string, Lexer_lex_string_continuation as lexer$Lexer_lex_string_continuation, Lexer_lex_string_body as lexer$Lexer_lex_string_body, Lexer_lex_raw_string as lexer$Lexer_lex_raw_string, Lexer_lex_number as lexer$Lexer_lex_number, Lexer_lex_ident as lexer$Lexer_lex_ident, Lexer_lex_punctuation as lexer$Lexer_lex_punctuation, Lexer_skip_whitespace_and_comments as lexer$Lexer_skip_whitespace_and_comments, Lexer_peek as lexer$Lexer_peek, Lexer_advance as lexer$Lexer_advance, Lexer_current_position as lexer$Lexer_current_position, Lexer_make_token as lexer$Lexer_make_token, Lexer_inc_last_depth as lexer$Lexer_inc_last_depth, Lexer_dec_last_depth as lexer$Lexer_dec_last_depth, Lexer_reset_last_depth as lexer$Lexer_reset_last_depth } from "./lexer.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
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


const PREC_NONE = 0;

const PREC_CATCH = 1;

const PREC_LOGIC_OR = 2;

const PREC_LOGIC_AND = 3;

const PREC_EQUALITY = 4;

const PREC_COMPARE = 5;

const PREC_RANGE = 6;

const PREC_ADD_SUB = 7;

const PREC_MUL_DIV = 8;

const PREC_UNARY = 9;

const PREC_POSTFIX = 10;

function infix_precedence(kind) {
  __ring_match6: {
    const __ring_m6 = kind;
    if (__ring_m6._tag === "TkCatch") {
      return PREC_CATCH;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkPipePipe") {
      return PREC_LOGIC_OR;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkAmpAmp") {
      return PREC_LOGIC_AND;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkEqEq") {
      return PREC_EQUALITY;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkBangEq") {
      return PREC_EQUALITY;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkLt") {
      return PREC_COMPARE;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkGt") {
      return PREC_COMPARE;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkLtEq") {
      return PREC_COMPARE;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkGtEq") {
      return PREC_COMPARE;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkDotDot") {
      return PREC_RANGE;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkDotDotEq") {
      return PREC_RANGE;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkPlus") {
      return PREC_ADD_SUB;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkMinus") {
      return PREC_ADD_SUB;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkStar") {
      return PREC_MUL_DIV;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkSlash") {
      return PREC_MUL_DIV;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkPercent") {
      return PREC_MUL_DIV;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkDot") {
      return PREC_POSTFIX;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkLParen") {
      return PREC_POSTFIX;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TkLBracket") {
      return PREC_POSTFIX;
      break __ring_match6;
    }
    return PREC_NONE;
    break __ring_match6;
  }
}

function str_to_binop(s) {
  if ((s === "+")) {
    return ast$BinOp_Add;
  }
  if ((s === "-")) {
    return ast$BinOp_Sub;
  }
  if ((s === "*")) {
    return ast$BinOp_Mul;
  }
  if ((s === "/")) {
    return ast$BinOp_Div;
  }
  if ((s === "%")) {
    return ast$BinOp_Mod;
  }
  if ((s === "==")) {
    return ast$BinOp_Eq;
  }
  if ((s === "!=")) {
    return ast$BinOp_Neq;
  }
  if ((s === "<")) {
    return ast$BinOp_Lt;
  }
  if ((s === "<=")) {
    return ast$BinOp_Lte;
  }
  if ((s === ">")) {
    return ast$BinOp_Gt;
  }
  if ((s === ">=")) {
    return ast$BinOp_Gte;
  }
  if ((s === "&&")) {
    return ast$BinOp_And;
  }
  if ((s === "||")) {
    return ast$BinOp_Or;
  }
  return panic(`unreachable: unknown binary operator '${s}'`);
}

function str_to_unaryop(s) {
  if ((s === "-")) {
    return ast$UnaryOp_Neg;
  }
  if ((s === "!")) {
    return ast$UnaryOp_Not;
  }
  return panic(`unreachable: unknown unary operator '${s}'`);
}

function dummy_type_expr() {
  return ast$TypeExpr_Named("", Option_none, [], ast$span_zero());
}

function is_decl_start(k) {
  __ring_match7: {
    const __ring_m7 = k;
    if (__ring_m7._tag === "TkFn") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkStruct") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkEnum") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkEffect") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkTrait") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkImpl") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkExtern") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkUse") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkPub") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkTest") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkConst") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkMod") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "TkSig") {
      return true;
      break __ring_match7;
    }
    return false;
    break __ring_match7;
  }
}

function is_uppercase(ch) {
  const c = Option_unwrap_or(Str_char_code_at(ch, 0), 0);
  return ((c >= 65) && (c <= 90));
}

function type_expr_span(te) {
  __ring_match8: {
    const __ring_m8 = te;
    if (__ring_m8._tag === "Named") {
      const span = __ring_m8.span;
      return span;
      break __ring_match8;
    }
    if (__ring_m8._tag === "FnType") {
      const span = __ring_m8.span;
      return span;
      break __ring_match8;
    }
    if (__ring_m8._tag === "OptionType") {
      const span = __ring_m8.span;
      return span;
      break __ring_match8;
    }
    if (__ring_m8._tag === "RecordType") {
      const span = __ring_m8.span;
      return span;
      break __ring_match8;
    }
    if (__ring_m8._tag === "TupleType") {
      const span = __ring_m8.span;
      return span;
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
}

function expr_span(e) {
  __ring_match9: {
    const __ring_m9 = e;
    if (__ring_m9._tag === "IntLit") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "FloatLit") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "StrLit") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "BoolLit") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Ident") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "BinOp") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "UnaryOp") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Call") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "MethodCall") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "FieldAccess") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "StructLit") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "MatchExpr") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Block") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "IfExpr") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "StringInterp") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "CatchExpr") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "HandleExpr") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Lambda") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Range") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "ListLit") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "TupleLit") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    if (__ring_m9._tag === "IndexExpr") {
      const span = __ring_m9.span;
      return span;
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
}

class Parser {
  constructor(tokens, pos, file, sink, error_count) {
    this.tokens = tokens;
    this.pos = pos;
    this.file = file;
    this.sink = sink;
    this.error_count = error_count;
  }
}

const MAX_ERRORS = 20;

function new_parser(tokens, file, sink) {
  return new Parser(tokens, 0, file, sink, 0);
}

function parse(source, file, sink) {
  let lexer = lexer$new_lexer(source, file, sink);
  const tokens = lexer$Lexer_tokenize(lexer);
  let parser = new_parser(tokens, file, sink);
  return Parser_parse_program(parser);
}

function Parser_peek(self) {
  if ((self.pos >= List_len(self.tokens))) {
    return Option_unwrap_or(List_get(self.tokens, (List_len(self.tokens) - 1)), new lexer$Token(lexer$TokenKind_TkEof, "", new ast$Span(self.file, new ast$Position(1, 0, 0), new ast$Position(1, 0, 0))));
  }
  return Option_unwrap_or(List_get(self.tokens, self.pos), new lexer$Token(lexer$TokenKind_TkEof, "", new ast$Span(self.file, new ast$Position(1, 0, 0), new ast$Position(1, 0, 0))));
}
function Parser_peek_at(self, offset) {
  const idx = (self.pos + offset);
  if ((idx >= List_len(self.tokens))) {
    return new lexer$Token(lexer$TokenKind_TkEof, "", new ast$Span(self.file, new ast$Position(1, 0, 0), new ast$Position(1, 0, 0)));
  }
  return Option_unwrap_or(List_get(self.tokens, idx), new lexer$Token(lexer$TokenKind_TkEof, "", new ast$Span(self.file, new ast$Position(1, 0, 0), new ast$Position(1, 0, 0))));
}
function Parser_advance(self) {
  const tok = Parser_peek(self);
  self.pos = (self.pos + 1);
  return tok;
}
function Parser_check(self, kind) {
  return lexer$__TokenKind_Eq.eq(Parser_peek(self).kind, kind);
}
function Parser_try_consume(self, kind) {
  if (Parser_check(self, kind)) {
    Parser_advance(self);
    return true;
  }
  return false;
}
function Parser_expect(self, kind) {
  const tok = Parser_peek(self);
  if ((!lexer$__TokenKind_Eq.eq(tok.kind, kind))) {
    Parser_error(self, `Expected '${lexer$token_kind_value(kind)}', got '${tok.value}' (${lexer$token_kind_value(tok.kind)})`);
  }
  return Parser_advance(self);
}
function Parser_at_end(self) {
  return Parser_check(self, lexer$TokenKind_TkEof);
}
function Parser_current_span_start(self) {
  return Parser_peek(self).span.start;
}
function Parser_make_span(self, start, end) {
  return new ast$Span(self.file, start, end);
}
function Parser_report_error(self, code, msg, span) {
  const tok = Parser_peek(self);
  const error_span = Option_unwrap_or(span, tok.span);
  diagnostics$CollectingSink_report(self.sink, diagnostics$make_diag(code, diagnostics$Severity_SevError, msg, error_span, diagnostics$DiagnosticContext_ParseError(tok.value, Option_none)));
  self.error_count = (self.error_count + 1);
  if ((self.error_count >= MAX_ERRORS)) {
    return __ring_raise_fail("Too many parse errors");
  }
}
function Parser_error(self, msg) {
  const tok = Parser_peek(self);
  Parser_report_error(self, codes$E0103, msg, Option_some(tok.span));
  return __ring_raise_fail(msg);
}
function Parser_parse_program(self) {
  const start = Parser_current_span_start(self);
  let uses = [];
  let decls = [];
  let decls_started = false;
  while ((!Parser_at_end(self))) {
    if (Parser_check(self, lexer$TokenKind_TkError)) {
      Parser_advance(self);
      continue;
    }
    if (Parser_check(self, lexer$TokenKind_TkUse)) {
      if (decls_started) {
        Parser_report_error(self, codes$E0706, "Use declaration must appear before other declarations", Option_some(Parser_peek(self).span));
      }
      const use_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_use_decl(self, false)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      __ring_match10: {
        const __ring_m10 = use_result;
        if (__ring_m10._tag === "some") {
          const ud = __ring_m10._0;
          List_push(uses, ud);
          break __ring_match10;
        }
        if (__ring_m10._tag === "none") {
          while ((!Parser_at_end(self))) {
            if (is_decl_start(Parser_peek(self).kind)) {
              break;
            }
            Parser_advance(self);
          }
          break __ring_match10;
        }
        __match_fail(__ring_m10);
      }
      continue;
    }
    if (Parser_check(self, lexer$TokenKind_TkPub)) {
      const save_pos = self.pos;
      const save_errors = self.error_count;
      const sink_checkpoint = diagnostics$CollectingSink_save(self.sink);
      Parser_advance(self);
      if (Parser_check(self, lexer$TokenKind_TkUse)) {
        if (decls_started) {
          Parser_report_error(self, codes$E0706, "Use declaration must appear before other declarations", Option_some(Option_unwrap_or(List_get(self.tokens, save_pos), Parser_peek(self)).span));
        }
        const pub_use_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_use_decl(self, true)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
        __ring_match11: {
          const __ring_m11 = pub_use_result;
          if (__ring_m11._tag === "some") {
            const ud = __ring_m11._0;
            List_push(uses, ud);
            break __ring_match11;
          }
          if (__ring_m11._tag === "none") {
            while ((!Parser_at_end(self))) {
              if (is_decl_start(Parser_peek(self).kind)) {
                break;
              }
              Parser_advance(self);
            }
            break __ring_match11;
          }
          __match_fail(__ring_m11);
        }
        continue;
      }
      self.pos = save_pos;
      self.error_count = save_errors;
      diagnostics$CollectingSink_restore(self.sink, sink_checkpoint);
    }
    decls_started = true;
    const maybe_decl = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Parser_parse_decl(self); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    __ring_match12: {
      const __ring_m12 = maybe_decl;
      if (__ring_m12._tag === "some") {
        const decl = __ring_m12._0;
        List_push(decls, decl);
        break __ring_match12;
      }
      if (__ring_m12._tag === "none") {
        while ((!Parser_at_end(self))) {
          if (is_decl_start(Parser_peek(self).kind)) {
            break;
          }
          Parser_advance(self);
        }
        break __ring_match12;
      }
      __match_fail(__ring_m12);
    }
  }
  const end = Parser_current_span_start(self);
  return new ast$Program(uses, decls, Parser_make_span(self, start, end));
}
function Parser_parse_stmt(self) {
  const start = Parser_current_span_start(self);
  if (Parser_check(self, lexer$TokenKind_TkLet)) {
    if (lexer$__TokenKind_Eq.eq(Parser_peek_at(self, 1).kind, lexer$TokenKind_TkMut)) {
      const bind_start = Parser_current_span_start(self);
      Parser_advance(self);
      Parser_advance(self);
      return Parser_parse_binding_body(self, true, bind_start);
    }
    const saved_pos = self.pos;
    Parser_advance(self);
    if (Parser_check(self, lexer$TokenKind_TkLParen)) {
      const pattern = Parser_parse_pattern(self);
      Parser_expect(self, lexer$TokenKind_TkEq);
      const init = Parser_parse_expr(self);
      Parser_try_consume(self, lexer$TokenKind_TkSemi);
      const end = Parser_current_span_start(self);
      return ast$Stmt_LetDestructure(pattern, init, Parser_make_span(self, start, end));
    }
    self.pos = saved_pos;
    return Parser_parse_binding_stmt(self, false);
  }
  if (Parser_check(self, lexer$TokenKind_TkVar)) {
    return Parser_parse_binding_stmt(self, true);
  }
  if (Parser_check(self, lexer$TokenKind_TkReturn)) {
    return Parser_parse_return_stmt(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkIf)) {
    const saved_pos = self.pos;
    Parser_advance(self);
    if (Parser_check(self, lexer$TokenKind_TkLet)) {
      return Parser_parse_if_let_stmt(self, start);
    }
    self.pos = saved_pos;
  }
  if (Parser_check(self, lexer$TokenKind_TkWhile)) {
    return Parser_parse_while_stmt(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkLoop)) {
    return Parser_parse_loop_stmt(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkFor)) {
    return Parser_parse_for_in_stmt(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkBreak)) {
    return Parser_parse_break_stmt(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkContinue)) {
    return Parser_parse_continue_stmt(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkTry)) {
    Parser_report_error(self, codes$E0101, "`try` is a reserved keyword; use `expr catch { pattern => handler }` for error handling", Option_some(Parser_peek(self).span));
    Parser_advance(self);
    if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
      Parser_advance(self);
      let depth = 1;
      while (((depth > 0) && (self.pos < (List_len(self.tokens) - 1)))) {
        if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
          depth = (depth + 1);
        } else {
          if (Parser_check(self, lexer$TokenKind_TkRBrace)) {
            depth = (depth - 1);
          }
        }
        Parser_advance(self);
      }
    }
    const end = Parser_current_span_start(self);
    return ast$Stmt_ExprStmt(ast$Expr_IntLit(0, Parser_make_span(self, start, end)), false, Parser_make_span(self, start, end));
  }
  const expr = Parser_parse_expr(self);
  if (((Parser_check(self, lexer$TokenKind_TkEq) || Parser_check(self, lexer$TokenKind_TkPlusEq)) || Parser_check(self, lexer$TokenKind_TkMinusEq))) {
    const op_tok = Parser_advance(self);
    const value_expr = Parser_parse_expr(self);
    Parser_try_consume(self, lexer$TokenKind_TkSemi);
    const end = Parser_current_span_start(self);
    let value = value_expr;
    if (lexer$__TokenKind_Eq.eq(op_tok.kind, lexer$TokenKind_TkPlusEq)) {
      value = ast$Expr_BinOp(ast$BinOp_Add, expr, value_expr, expr_span(value_expr));
    } else {
      if (lexer$__TokenKind_Eq.eq(op_tok.kind, lexer$TokenKind_TkMinusEq)) {
        value = ast$Expr_BinOp(ast$BinOp_Sub, expr, value_expr, expr_span(value_expr));
      }
    }
    return ast$Stmt_Assign(expr, value, Parser_make_span(self, start, end));
  }
  const has_semi = Parser_try_consume(self, lexer$TokenKind_TkSemi);
  const end = Parser_current_span_start(self);
  return ast$Stmt_ExprStmt(expr, has_semi, Parser_make_span(self, start, end));
}
function Parser_parse_while_stmt(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkWhile);
  const condition = Parser_parse_expr_no_struct(self);
  const body = Parser_parse_block_expr(self);
  return ast$Stmt_While(condition, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_loop_stmt(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkLoop);
  const body = Parser_parse_block_expr(self);
  const condition = ast$Expr_BoolLit(true, Parser_make_span(self, start, start));
  return ast$Stmt_While(condition, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_for_in_stmt(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkFor);
  let binding = "";
  let binding_span = ast$span_zero();
  let destructure = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkLParen)) {
    Parser_advance(self);
    let names = [];
    let spans = [];
    const first = Parser_expect(self, lexer$TokenKind_TkIdent);
    List_push(names, first.value);
    List_push(spans, first.span);
    while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
      if (Parser_check(self, lexer$TokenKind_TkRParen)) {
        break;
      }
      const tok = Parser_expect(self, lexer$TokenKind_TkIdent);
      List_push(names, tok.value);
      List_push(spans, tok.span);
    }
    Parser_expect(self, lexer$TokenKind_TkRParen);
    binding = Option_unwrap_or(List_first(names), "");
    binding_span = Option_unwrap_or(List_first(spans), ast$span_zero());
    if ((List_len(names) > 1)) {
      destructure = Option_some(new ast$DestructureBinding(names, spans));
    }
  } else {
    const name_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
    binding = name_tok.value;
    binding_span = name_tok.span;
  }
  Parser_expect(self, lexer$TokenKind_TkIn);
  const iterable = Parser_parse_expr_no_struct(self);
  const body = Parser_parse_block_expr(self);
  return ast$Stmt_ForIn(binding, binding_span, destructure, iterable, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_break_stmt(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkBreak);
  Parser_try_consume(self, lexer$TokenKind_TkSemi);
  const end = Parser_current_span_start(self);
  return ast$Stmt_Break(Parser_make_span(self, start, end));
}
function Parser_parse_continue_stmt(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkContinue);
  Parser_try_consume(self, lexer$TokenKind_TkSemi);
  const end = Parser_current_span_start(self);
  return ast$Stmt_Continue(Parser_make_span(self, start, end));
}
function Parser_parse_if_let_stmt(self, start) {
  Parser_expect(self, lexer$TokenKind_TkLet);
  const pattern = Parser_parse_pattern(self);
  Parser_expect(self, lexer$TokenKind_TkEq);
  const expr = Parser_parse_expr(self);
  const then_block = Parser_parse_block_expr(self);
  let else_block = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkElse)) {
    else_block = Option_some(Parser_parse_block_expr(self));
  }
  const end_pos = (function() {
  const __ring_m = else_block;
  if (__ring_m._tag === "some") { const eb = __ring_m._0; return expr_span(eb).end; }
  if (__ring_m._tag === "none") { return expr_span(then_block).end; }
  __match_fail(__ring_m);
})();
  return ast$Stmt_IfLet(pattern, expr, then_block, else_block, Parser_make_span(self, start, end_pos));
}
function Parser_parse_binding_stmt(self, mutable) {
  const start = Parser_current_span_start(self);
  if (mutable) {
    Parser_expect(self, lexer$TokenKind_TkVar);
  } else {
    Parser_expect(self, lexer$TokenKind_TkLet);
  }
  return Parser_parse_binding_body(self, mutable, start);
}
function Parser_parse_binding_body(self, mutable, start) {
  const name_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
  const name = name_tok.value;
  const name_span = name_tok.span;
  let type_annotation = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
    type_annotation = Option_some(Parser_parse_type_expr(self));
  }
  Parser_expect(self, lexer$TokenKind_TkEq);
  const init = Parser_parse_expr(self);
  Parser_try_consume(self, lexer$TokenKind_TkSemi);
  const end = Parser_current_span_start(self);
  const span = Parser_make_span(self, start, end);
  if (mutable) {
    return ast$Stmt_Var(name, name_span, type_annotation, init, span);
  } else {
    return ast$Stmt_Let(name, name_span, type_annotation, init, span);
  }
}
function Parser_parse_return_stmt(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkReturn);
  let value = Option_none;
  if ((((!Parser_check(self, lexer$TokenKind_TkSemi)) && (!Parser_check(self, lexer$TokenKind_TkRBrace))) && (!Parser_at_end(self)))) {
    value = Option_some(Parser_parse_expr(self));
  }
  Parser_try_consume(self, lexer$TokenKind_TkSemi);
  const end = Parser_current_span_start(self);
  return ast$Stmt_Return(value, Parser_make_span(self, start, end));
}
function Parser_parse_block_expr(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let stmts = [];
  let tail = Option_none;
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    const stmt = Parser_parse_stmt(self);
    if (Parser_check(self, lexer$TokenKind_TkRBrace)) {
      __ring_match13: {
        const __ring_m13 = stmt;
        if (__ring_m13._tag === "ExprStmt") {
          const e = __ring_m13.expr; const hs = __ring_m13.has_semi;
          if ((!hs)) {
            tail = Option_some(e);
          } else {
            List_push(stmts, stmt);
          }
          break __ring_match13;
        }
        List_push(stmts, stmt);
        break __ring_match13;
      }
    } else {
      List_push(stmts, stmt);
    }
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$Expr_Block(stmts, tail, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_use_decl(self, is_pub) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkUse);
  let segments = [];
  const path_start = Parser_current_span_start(self);
  if (Parser_check(self, lexer$TokenKind_TkSuper)) {
    List_push(segments, "super");
    const _ = Parser_advance(self);
  } else {
    if (((Parser_check(self, lexer$TokenKind_TkIdent) && (Parser_peek(self).value === "self")) && lexer$__TokenKind_Eq.eq(Parser_peek_at(self, 1).kind, lexer$TokenKind_TkColonColon))) {
      List_push(segments, "self");
      const _ = Parser_advance(self);
    } else {
      List_push(segments, Parser_expect(self, lexer$TokenKind_TkIdent).value);
    }
  }
  while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
    Parser_advance(self);
    if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
      break;
    }
    if (Parser_check(self, lexer$TokenKind_TkSuper)) {
      List_push(segments, "super");
      const _ = Parser_advance(self);
    } else {
      List_push(segments, Parser_expect(self, lexer$TokenKind_TkIdent).value);
    }
  }
  const path_end = Parser_current_span_start(self);
  let path = new ast$UsePath(segments, Parser_make_span(self, path_start, path_end));
  let imports = ast$UseImport_Module;
  let alias = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
    Parser_advance(self);
    let names = [];
    while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
      const name_start = Parser_current_span_start(self);
      const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
      let name_alias = Option_none;
      if (Parser_try_consume(self, lexer$TokenKind_TkAs)) {
        name_alias = Option_some(Parser_expect(self, lexer$TokenKind_TkIdent).value);
      }
      const name_end = Parser_current_span_start(self);
      List_push(names, new ast$NamedImport(name, name_alias, Parser_make_span(self, name_start, name_end)));
      if ((!Parser_try_consume(self, lexer$TokenKind_TkComma))) {
        break;
      }
    }
    Parser_expect(self, lexer$TokenKind_TkRBrace);
    imports = ast$UseImport_NamedItems(names);
  } else {
    if (Parser_check(self, lexer$TokenKind_TkAs)) {
      Parser_advance(self);
      alias = Option_some(Parser_expect(self, lexer$TokenKind_TkIdent).value);
      imports = ast$UseImport_Module;
    } else {
      if ((List_len(segments) > 1)) {
        const imported_name = Option_unwrap_or(List_pop(segments), "");
        path = new ast$UsePath(segments, Parser_make_span(self, path_start, path_end));
        const name_span = Parser_make_span(self, path_start, path_end);
        imports = ast$UseImport_NamedItems([new ast$NamedImport(imported_name, Option_none, name_span)]);
      }
    }
  }
  const end = Parser_current_span_start(self);
  return new ast$UseDecl(path, imports, alias, is_pub, Parser_make_span(self, start, end));
}
function Parser_parse_mod_block(self, is_pub) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkMod);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  let required_effects = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkRequires)) {
    Parser_advance(self);
    required_effects = Option_some(Parser_parse_effect_list(self));
  }
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let uses = [];
  let decls = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    if (Parser_check(self, lexer$TokenKind_TkUse)) {
      const use_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_use_decl(self, false)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      __ring_match14: {
        const __ring_m14 = use_result;
        if (__ring_m14._tag === "some") {
          const ud = __ring_m14._0;
          List_push(uses, ud);
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          while ((!Parser_at_end(self))) {
            if (((is_decl_start(Parser_peek(self).kind) || Parser_check(self, lexer$TokenKind_TkUse)) || Parser_check(self, lexer$TokenKind_TkRBrace))) {
              break;
            }
            Parser_advance(self);
          }
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      continue;
    }
    const maybe_decl = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Parser_parse_decl(self); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    __ring_match15: {
      const __ring_m15 = maybe_decl;
      if (__ring_m15._tag === "some") {
        const decl = __ring_m15._0;
        List_push(decls, decl);
        break __ring_match15;
      }
      if (__ring_m15._tag === "none") {
        while ((!Parser_at_end(self))) {
          if ((is_decl_start(Parser_peek(self).kind) || Parser_check(self, lexer$TokenKind_TkRBrace))) {
            break;
          }
          Parser_advance(self);
        }
        break __ring_match15;
      }
      __match_fail(__ring_m15);
    }
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$Decl_ModBlock(name, uses, decls, required_effects, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_decl(self) {
  const is_pub = Parser_try_consume(self, lexer$TokenKind_TkPub);
  const tok = Parser_peek(self);
  __ring_match16: {
    const __ring_m16 = tok.kind;
    if (__ring_m16._tag === "TkMod") {
      return Option_some(Parser_parse_mod_block(self, is_pub));
      break __ring_match16;
    }
    if (__ring_m16._tag === "TkFn") {
      return Option_some(Parser_parse_fn_decl(self, is_pub, false));
      break __ring_match16;
    }
    if (__ring_m16._tag === "TkStruct") {
      return Option_some(Parser_parse_struct_decl(self, is_pub));
      break __ring_match16;
    }
    if (__ring_m16._tag === "TkEnum") {
      return Option_some(Parser_parse_enum_decl(self, is_pub));
      break __ring_match16;
    }
    if (__ring_m16._tag === "TkImpl") {
      return Option_some(Parser_parse_impl_decl(self));
      break __ring_match16;
    }
    if (__ring_m16._tag === "TkEffect") {
      return Option_some(Parser_parse_effect_decl(self, is_pub));
      break __ring_match16;
    }
    if (__ring_m16._tag === "TkTest") {
      return Option_some(Parser_parse_test_decl(self));
      break __ring_match16;
    }
    if (__ring_m16._tag === "TkTrait") {
      return Option_some(Parser_parse_trait_decl(self, is_pub));
      break __ring_match16;
    }
    if (__ring_m16._tag === "TkExtern") {
      return Option_some(Parser_parse_extern_decl(self, is_pub));
      break __ring_match16;
    }
    if (__ring_m16._tag === "TkConst") {
      return Option_some(Parser_parse_const_decl(self, is_pub));
      break __ring_match16;
    }
    if (__ring_m16._tag === "TkSig") {
      return Option_some(Parser_parse_sig_block(self, is_pub));
      break __ring_match16;
    }
    if (__ring_m16._tag === "TkIdent") {
      if ((tok.value === "type")) {
        return Option_some(Parser_parse_type_alias_decl(self, is_pub));
      }
      Parser_report_error(self, codes$E0101, `Expected declaration, got '${tok.value}' (${lexer$token_kind_value(tok.kind)})`, Option_some(tok.span));
      return Option_none;
      break __ring_match16;
    }
    Parser_report_error(self, codes$E0101, `Expected declaration, got '${tok.value}' (${lexer$token_kind_value(tok.kind)})`, Option_some(tok.span));
    return Option_none;
    break __ring_match16;
  }
}
function Parser_parse_effect_list(self) {
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let effects = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    const estart = Parser_current_span_start(self);
    let ename = "";
    if (Parser_check(self, lexer$TokenKind_TkMut)) {
      ename = Parser_advance(self).value;
    } else {
      ename = Parser_expect(self, lexer$TokenKind_TkIdent).value;
      while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
        Parser_advance(self);
        const next = Parser_expect(self, lexer$TokenKind_TkIdent).value;
        ename = `${ename}::${next}`;
      }
    }
    let type_args = [];
    if (Parser_check(self, lexer$TokenKind_TkLt)) {
      Parser_advance(self);
      while (((!Parser_check(self, lexer$TokenKind_TkGt)) && (!Parser_at_end(self)))) {
        List_push(type_args, Parser_parse_type_expr(self));
        if ((!Parser_check(self, lexer$TokenKind_TkGt))) {
          Parser_expect(self, lexer$TokenKind_TkComma);
        }
      }
      Parser_expect(self, lexer$TokenKind_TkGt);
    }
    const eend = Parser_current_span_start(self);
    List_push(effects, new ast$EffectExpr(ename, type_args, Parser_make_span(self, estart, eend)));
    if ((!Parser_check(self, lexer$TokenKind_TkRBrace))) {
      Parser_expect(self, lexer$TokenKind_TkComma);
    }
  }
  Parser_expect(self, lexer$TokenKind_TkRBrace);
  return effects;
}
function Parser_parse_effect_annotation(self) {
  Parser_expect(self, lexer$TokenKind_TkWith);
  return Parser_parse_effect_list(self);
}
function Parser_parse_fn_decl(self, is_pub, body_optional) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkFn);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  const type_params = Parser_parse_type_params(self);
  Parser_expect(self, lexer$TokenKind_TkLParen);
  const params = Parser_parse_params(self);
  Parser_expect(self, lexer$TokenKind_TkRParen);
  let return_type = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkArrow)) {
    return_type = Option_some(Parser_parse_type_expr(self));
  }
  let declared_effects = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkWith)) {
    declared_effects = Option_some(Parser_parse_effect_annotation(self));
  }
  let body = ast$Expr_Block([], Option_none, ast$span_zero());
  let is_abstract_val = false;
  if ((body_optional && (!Parser_check(self, lexer$TokenKind_TkLBrace)))) {
    const pos = Parser_current_span_start(self);
    body = ast$Expr_Block([], Option_none, Parser_make_span(self, pos, pos));
    is_abstract_val = true;
  } else {
    body = Parser_parse_block_expr(self);
  }
  return ast$Decl_Fn(name, type_params, params, return_type, declared_effects, body, is_pub, is_abstract_val, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_const_decl(self, is_pub) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkConst);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  let type_annotation = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
    type_annotation = Option_some(Parser_parse_type_expr(self));
  }
  Parser_expect(self, lexer$TokenKind_TkEq);
  const init = Parser_parse_expr(self);
  return ast$Decl_Const(name, type_annotation, init, is_pub, Parser_make_span(self, start, expr_span(init).end));
}
function Parser_parse_sig_block(self, is_pub) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkSig);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let members = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    const mstart = Parser_current_span_start(self);
    Parser_expect(self, lexer$TokenKind_TkFn);
    const mname = Parser_expect(self, lexer$TokenKind_TkIdent).value;
    const mtps = Parser_parse_type_params(self);
    Parser_expect(self, lexer$TokenKind_TkLParen);
    const mparams = Parser_parse_params(self);
    Parser_expect(self, lexer$TokenKind_TkRParen);
    let ret = Option_none;
    if (Parser_try_consume(self, lexer$TokenKind_TkArrow)) {
      ret = Option_some(Parser_parse_type_expr(self));
    }
    let meffects = [];
    if (Parser_try_consume(self, lexer$TokenKind_TkWith)) {
      Parser_expect(self, lexer$TokenKind_TkLBrace);
      while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
        const eff = Parser_parse_type_expr(self);
        List_push(meffects, eff);
        Parser_try_consume(self, lexer$TokenKind_TkComma);
      }
      Parser_expect(self, lexer$TokenKind_TkRBrace);
    }
    const mend = Parser_current_span_start(self);
    List_push(members, new ast$SigMember(mname, mtps, mparams, ret, meffects, Parser_make_span(self, mstart, mend)));
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$Decl_Sig(name, members, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_extern_decl(self, is_pub) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkExtern);
  if ((Parser_check(self, lexer$TokenKind_TkIdent) && (Parser_peek(self).value === "type"))) {
    return Parser_parse_extern_type_decl_body(self, is_pub, start);
  }
  return Parser_parse_extern_fn_decl_body(self, is_pub, start);
}
function Parser_parse_extern_fn_decl_body(self, is_pub, start) {
  Parser_expect(self, lexer$TokenKind_TkFn);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  const type_params = Parser_parse_type_params(self);
  Parser_expect(self, lexer$TokenKind_TkLParen);
  const params = Parser_parse_params(self);
  const rparen = Parser_expect(self, lexer$TokenKind_TkRParen);
  let last_end = rparen.span.end;
  let return_type = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkArrow)) {
    const rt = Parser_parse_type_expr(self);
    return_type = Option_some(rt);
    last_end = type_expr_span(rt).end;
  }
  let declared_effects = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkWith)) {
    declared_effects = Option_some(Parser_parse_effect_annotation(self));
    last_end = Parser_current_span_start(self);
  }
  return ast$Decl_ExternFn(name, type_params, params, return_type, declared_effects, is_pub, Parser_make_span(self, start, last_end));
}
function Parser_parse_extern_type_decl_body(self, is_pub, start) {
  Parser_advance(self);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  const type_params = Parser_parse_type_params(self);
  const end = Parser_current_span_start(self);
  return ast$Decl_ExternType(name, type_params, is_pub, Parser_make_span(self, start, end));
}
function Parser_parse_type_alias_decl(self, is_pub) {
  const start = Parser_current_span_start(self);
  Parser_advance(self);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  const type_params = Parser_parse_type_params(self);
  Parser_expect(self, lexer$TokenKind_TkEq);
  const type_expr = Parser_parse_type_expr(self);
  const end = Parser_current_span_start(self);
  return ast$Decl_TypeAlias(name, type_params, type_expr, is_pub, Parser_make_span(self, start, end));
}
function Parser_parse_struct_decl(self, is_pub) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkStruct);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  const type_params = Parser_parse_type_params(self);
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let fields = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    const field_start = Parser_current_span_start(self);
    const field_pub = Parser_try_consume(self, lexer$TokenKind_TkPub);
    const field_name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
    Parser_expect(self, lexer$TokenKind_TkColon);
    const type_annotation = Parser_parse_type_expr(self);
    if (Parser_check(self, lexer$TokenKind_TkWhere)) {
      const where_span = Parser_peek(self).span;
      diagnostics$CollectingSink_report(self.sink, diagnostics$make_diag("W0001", diagnostics$Severity_SevWarning, "Refinement types are not yet implemented; 'where' clause is ignored", where_span, diagnostics$DiagnosticContext_OtherContext(Option_some("where clause parsed but not enforced"))));
      Parser_advance(self);
      let depth = 0;
      while ((!Parser_at_end(self))) {
        if (((depth === 0) && (Parser_check(self, lexer$TokenKind_TkComma) || Parser_check(self, lexer$TokenKind_TkRBrace)))) {
          break;
        }
        if (((Parser_check(self, lexer$TokenKind_TkLParen) || Parser_check(self, lexer$TokenKind_TkLBrace)) || Parser_check(self, lexer$TokenKind_TkLBracket))) {
          depth = (depth + 1);
        }
        if (((Parser_check(self, lexer$TokenKind_TkRParen) || Parser_check(self, lexer$TokenKind_TkRBrace)) || Parser_check(self, lexer$TokenKind_TkRBracket))) {
          depth = (depth - 1);
        }
        if ((depth < 0)) {
          break;
        }
        Parser_advance(self);
      }
    }
    const field_end = Parser_current_span_start(self);
    List_push(fields, new ast$StructFieldDecl(field_name, type_annotation, field_pub, Parser_make_span(self, field_start, field_end)));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$Decl_Struct(name, type_params, fields, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_enum_decl(self, is_pub) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkEnum);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  const type_params = Parser_parse_type_params(self);
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let variants = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    const v_start = Parser_current_span_start(self);
    const v_name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
    let v_fields = [];
    let named_fields = Option_none;
    if (Parser_try_consume(self, lexer$TokenKind_TkLParen)) {
      if (Parser_check(self, lexer$TokenKind_TkRParen)) {
        const rp_span = Parser_peek(self).span;
        Parser_report_error(self, codes$E0104, `empty parentheses on enum variant '${v_name}' — use bare name instead`, Option_some(rp_span));
        const _rp = Parser_advance(self);
      } else {
        List_push(v_fields, Parser_parse_type_expr(self));
        while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
          if (Parser_check(self, lexer$TokenKind_TkRParen)) {
            break;
          }
          List_push(v_fields, Parser_parse_type_expr(self));
        }
        const _rp = Parser_expect(self, lexer$TokenKind_TkRParen);
      }
    } else {
      if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
        Parser_advance(self);
        let nf = [];
        while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
          const f_start = Parser_current_span_start(self);
          const f_name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
          Parser_expect(self, lexer$TokenKind_TkColon);
          const f_type = Parser_parse_type_expr(self);
          const f_end = Parser_current_span_start(self);
          List_push(nf, new ast$NamedEnumField(f_name, f_type, Parser_make_span(self, f_start, f_end)));
          Parser_try_consume(self, lexer$TokenKind_TkComma);
        }
        Parser_expect(self, lexer$TokenKind_TkRBrace);
        named_fields = Option_some(nf);
      }
    }
    const v_end = Parser_current_span_start(self);
    List_push(variants, new ast$EnumVariantDecl(v_name, v_fields, named_fields, Parser_make_span(self, v_start, v_end)));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$Decl_Enum(name, type_params, variants, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_impl_decl(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkImpl);
  const type_params = Parser_parse_type_params(self);
  const first_name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  let target_type = first_name;
  let trait_name = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkFor)) {
    Parser_advance(self);
    trait_name = Option_some(first_name);
    target_type = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  }
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let methods = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    if ((Parser_check(self, lexer$TokenKind_TkIdent) && (Parser_peek(self).value === "delegate"))) {
      const d_start = Parser_current_span_start(self);
      Parser_advance(self);
      const d_field = Parser_expect(self, lexer$TokenKind_TkIdent).value;
      Parser_expect(self, lexer$TokenKind_TkColon);
      let d_traits = [];
      List_push(d_traits, Parser_expect(self, lexer$TokenKind_TkIdent).value);
      while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
        List_push(d_traits, Parser_expect(self, lexer$TokenKind_TkIdent).value);
      }
      const d_end = Parser_current_span_start(self);
      List_push(methods, ast$Decl_Delegate(d_field, d_traits, Parser_make_span(self, d_start, d_end)));
      continue;
    }
    const m_pub = Parser_try_consume(self, lexer$TokenKind_TkPub);
    if (Parser_check(self, lexer$TokenKind_TkExtern)) {
      const m_start = Parser_current_span_start(self);
      Parser_expect(self, lexer$TokenKind_TkExtern);
      List_push(methods, Parser_parse_extern_fn_decl_body(self, m_pub, m_start));
    } else {
      List_push(methods, Parser_parse_fn_decl(self, m_pub, false));
    }
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$Decl_Impl(target_type, type_params, trait_name, methods, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_effect_alias_decl(self, is_pub, start) {
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  const type_params = Parser_parse_type_params(self);
  Parser_expect(self, lexer$TokenKind_TkEq);
  const effects = Parser_parse_effect_list(self);
  const end = Parser_current_span_start(self);
  return ast$Decl_EffectAlias(name, type_params, effects, is_pub, Parser_make_span(self, start, end));
}
function Parser_parse_effect_decl(self, is_pub) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkEffect);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  if ((name === "alias")) {
    return Parser_parse_effect_alias_decl(self, is_pub, start);
  }
  const type_params = Parser_parse_type_params(self);
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let ops = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    const op_start = Parser_current_span_start(self);
    Parser_expect(self, lexer$TokenKind_TkFn);
    const op_name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
    Parser_expect(self, lexer$TokenKind_TkLParen);
    const params = Parser_parse_params(self);
    Parser_expect(self, lexer$TokenKind_TkRParen);
    Parser_expect(self, lexer$TokenKind_TkArrow);
    const return_type = Parser_parse_type_expr(self);
    let op_body = Option_none;
    if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
      op_body = Option_some(Parser_parse_block_expr(self));
    }
    const op_end = Parser_current_span_start(self);
    List_push(ops, new ast$EffectOpDecl(op_name, params, return_type, op_body, Parser_make_span(self, op_start, op_end)));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
    Parser_try_consume(self, lexer$TokenKind_TkSemi);
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$Decl_Effect(name, type_params, ops, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_test_decl(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkTest);
  const desc_tok = Parser_expect(self, lexer$TokenKind_TkStringLit);
  const body = Parser_parse_block_expr(self);
  return ast$Decl_Test(desc_tok.value, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_trait_decl(self, is_pub) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkTrait);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  const type_params = Parser_parse_type_params(self);
  let supertraits = [];
  if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
    List_push(supertraits, Parser_parse_type_bound(self));
    while (Parser_check(self, lexer$TokenKind_TkPlus)) {
      Parser_advance(self);
      List_push(supertraits, Parser_parse_type_bound(self));
    }
  }
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let methods = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    const m_pub = Parser_try_consume(self, lexer$TokenKind_TkPub);
    List_push(methods, Parser_parse_fn_decl(self, m_pub, true));
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$Decl_Trait(name, type_params, supertraits, methods, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_expr(self) {
  return Parser_parse_expr_bp(self, PREC_NONE, true);
}
function Parser_parse_expr_no_struct(self) {
  return Parser_parse_expr_bp(self, PREC_NONE, false);
}
function Parser_parse_expr_bp(self, min_prec, allow_struct_lit) {
  let left = Parser_parse_prefix(self, allow_struct_lit);
  let last_was_comparison = false;
  while (true) {
    const tok = Parser_peek(self);
    const prec = infix_precedence(tok.kind);
    if ((prec <= min_prec)) {
      break;
    }
    if (Parser_check(self, lexer$TokenKind_TkCatch)) {
      left = Parser_parse_catch_expr(self, left);
      last_was_comparison = false;
    } else {
      if (Parser_check(self, lexer$TokenKind_TkDot)) {
        left = Parser_parse_dot_expr(self, left);
        last_was_comparison = false;
      } else {
        if (Parser_check(self, lexer$TokenKind_TkLParen)) {
          if ((tok.span.start.line > expr_span(left).end.line)) {
            break;
          }
          left = Parser_parse_call_expr(self, left);
          last_was_comparison = false;
        } else {
          if (Parser_check(self, lexer$TokenKind_TkLBracket)) {
            if ((tok.span.start.line > expr_span(left).end.line)) {
              break;
            }
            left = Parser_parse_index_expr(self, left);
            last_was_comparison = false;
          } else {
            if ((Parser_check(self, lexer$TokenKind_TkDotDot) || Parser_check(self, lexer$TokenKind_TkDotDotEq))) {
              const inclusive = Parser_check(self, lexer$TokenKind_TkDotDotEq);
              Parser_advance(self);
              const right = Parser_parse_expr_bp(self, prec, allow_struct_lit);
              const span = Parser_make_span(self, expr_span(left).start, expr_span(right).end);
              left = ast$Expr_Range(left, right, inclusive, span);
              last_was_comparison = false;
            } else {
              const is_comparison = ((prec === PREC_EQUALITY) || (prec === PREC_COMPARE));
              if ((is_comparison && last_was_comparison)) {
                Parser_error(self, `Comparison operators are non-associative: cannot chain '${tok.value}' after another comparison`);
              }
              Parser_advance(self);
              const right = Parser_parse_expr_bp(self, prec, allow_struct_lit);
              const span = Parser_make_span(self, expr_span(left).start, expr_span(right).end);
              left = ast$Expr_BinOp(str_to_binop(tok.value), left, right, span);
              last_was_comparison = is_comparison;
            }
          }
        }
      }
    }
  }
  return left;
}
function Parser_parse_prefix(self, allow_struct_lit) {
  const tok = Parser_peek(self);
  const start = Parser_current_span_start(self);
  if ((Parser_check(self, lexer$TokenKind_TkMinus) || Parser_check(self, lexer$TokenKind_TkBang))) {
    Parser_advance(self);
    const operand = Parser_parse_expr_bp(self, PREC_UNARY, allow_struct_lit);
    return ast$Expr_UnaryOp(str_to_unaryop(tok.value), operand, Parser_make_span(self, start, expr_span(operand).end));
  }
  if (Parser_check(self, lexer$TokenKind_TkIntLit)) {
    Parser_advance(self);
    return ast$Expr_IntLit(Option_unwrap_or(parse_int(tok.value), 0), tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkFloatLit)) {
    Parser_advance(self);
    return ast$Expr_FloatLit(Option_unwrap_or(parse_float(tok.value), 0), tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkStringLit)) {
    Parser_advance(self);
    return ast$Expr_StrLit(tok.value, tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkRawStringLit)) {
    Parser_advance(self);
    return ast$Expr_StrLit(tok.value, tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkTrue)) {
    Parser_advance(self);
    return ast$Expr_BoolLit(true, tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkFalse)) {
    Parser_advance(self);
    return ast$Expr_BoolLit(false, tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkStringInterpStart)) {
    return Parser_parse_string_interp(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
    return Parser_parse_block_expr(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkIf)) {
    return Parser_parse_if_expr(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkMatch)) {
    return Parser_parse_match_expr(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkHandle)) {
    return Parser_parse_handle_expr(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkFn)) {
    return Parser_parse_lambda_expr(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkLBracket)) {
    Parser_advance(self);
    let elements = [];
    if ((!Parser_check(self, lexer$TokenKind_TkRBracket))) {
      List_push(elements, Parser_parse_expr(self));
      while (Parser_check(self, lexer$TokenKind_TkComma)) {
        Parser_advance(self);
        if (Parser_check(self, lexer$TokenKind_TkRBracket)) {
          break;
        }
        List_push(elements, Parser_parse_expr(self));
      }
    }
    const end_tok = Parser_expect(self, lexer$TokenKind_TkRBracket);
    return ast$Expr_ListLit(elements, Parser_make_span(self, start, end_tok.span.end));
  }
  if (Parser_check(self, lexer$TokenKind_TkLParen)) {
    Parser_advance(self);
    const first = Parser_parse_expr(self);
    if (Parser_check(self, lexer$TokenKind_TkComma)) {
      Parser_advance(self);
      let elements = [first];
      if ((!Parser_check(self, lexer$TokenKind_TkRParen))) {
        List_push(elements, Parser_parse_expr(self));
        while (Parser_check(self, lexer$TokenKind_TkComma)) {
          Parser_advance(self);
          if (Parser_check(self, lexer$TokenKind_TkRParen)) {
            break;
          }
          List_push(elements, Parser_parse_expr(self));
        }
      }
      const end_tok = Parser_expect(self, lexer$TokenKind_TkRParen);
      return ast$Expr_TupleLit(elements, Parser_make_span(self, start, end_tok.span.end));
    }
    Parser_expect(self, lexer$TokenKind_TkRParen);
    return first;
  }
  if (Parser_check(self, lexer$TokenKind_TkSuper)) {
    Parser_advance(self);
    Parser_expect(self, lexer$TokenKind_TkColonColon);
    let qualifier_parts = ["super"];
    while (Parser_check(self, lexer$TokenKind_TkSuper)) {
      List_push(qualifier_parts, "super");
      Parser_advance(self);
      Parser_expect(self, lexer$TokenKind_TkColonColon);
    }
    const member_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
    const member_name = member_tok.value;
    const qualifier_str = List_join(qualifier_parts, "::");
    if (((allow_struct_lit && is_uppercase(Option_unwrap_or(Str_char_at(member_name, 0), ""))) && Parser_check(self, lexer$TokenKind_TkLBrace))) {
      return Parser_parse_struct_literal(self, member_name, start, Option_some(qualifier_str));
    }
    return ast$Expr_Ident(member_name, Option_some(qualifier_str), Parser_make_span(self, start, member_tok.span.end));
  }
  if (Parser_check(self, lexer$TokenKind_TkIdent)) {
    Parser_advance(self);
    const name = tok.value;
    if ((is_uppercase(Option_unwrap_or(Str_char_at(name, 0), "")) && Parser_check(self, lexer$TokenKind_TkColonColon))) {
      Parser_advance(self);
      const variant_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
      const variant_name = variant_tok.value;
      if (((allow_struct_lit && is_uppercase(Option_unwrap_or(Str_char_at(variant_name, 0), ""))) && Parser_check(self, lexer$TokenKind_TkLBrace))) {
        return Parser_parse_struct_literal(self, variant_name, start, Option_some(name));
      }
      return ast$Expr_Ident(variant_name, Option_some(name), Parser_make_span(self, start, variant_tok.span.end));
    }
    if (((!is_uppercase(Option_unwrap_or(Str_char_at(name, 0), ""))) && Parser_check(self, lexer$TokenKind_TkColonColon))) {
      let qualifier_parts = [name];
      let member_tok = tok;
      let member_name = name;
      while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
        Parser_advance(self);
        member_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
        member_name = member_tok.value;
        if (((!is_uppercase(Option_unwrap_or(Str_char_at(member_name, 0), ""))) && Parser_check(self, lexer$TokenKind_TkColonColon))) {
          List_push(qualifier_parts, member_name);
        } else {
          break;
        }
      }
      const qualifier_str = List_join(qualifier_parts, "::");
      if ((is_uppercase(Option_unwrap_or(Str_char_at(member_name, 0), "")) && Parser_check(self, lexer$TokenKind_TkColonColon))) {
        Parser_advance(self);
        const variant_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
        const variant_name = variant_tok.value;
        const full_qualifier = `${qualifier_str}::${member_name}`;
        if (((allow_struct_lit && is_uppercase(Option_unwrap_or(Str_char_at(variant_name, 0), ""))) && Parser_check(self, lexer$TokenKind_TkLBrace))) {
          return Parser_parse_struct_literal(self, variant_name, start, Option_some(full_qualifier));
        }
        return ast$Expr_Ident(variant_name, Option_some(full_qualifier), Parser_make_span(self, start, variant_tok.span.end));
      }
      if (((allow_struct_lit && is_uppercase(Option_unwrap_or(Str_char_at(member_name, 0), ""))) && Parser_check(self, lexer$TokenKind_TkLBrace))) {
        return Parser_parse_struct_literal(self, member_name, start, Option_some(qualifier_str));
      }
      return ast$Expr_Ident(member_name, Option_some(qualifier_str), Parser_make_span(self, start, member_tok.span.end));
    }
    if (((allow_struct_lit && is_uppercase(Option_unwrap_or(Str_char_at(name, 0), ""))) && Parser_check(self, lexer$TokenKind_TkLBrace))) {
      return Parser_parse_struct_literal(self, name, start, Option_none);
    }
    return ast$Expr_Ident(name, Option_none, tok.span);
  }
  return Parser_error(self, `Unexpected token '${tok.value}' (${lexer$token_kind_value(tok.kind)}) in expression`);
}
function Parser_parse_dot_expr(self, left) {
  Parser_advance(self);
  let name = "";
  let name_end = Parser_current_span_start(self);
  if (Parser_check(self, lexer$TokenKind_TkFloatLit)) {
    const tok = Parser_advance(self);
    const parts = Str_split(tok.value, ".");
    let result = left;
    for (const part of parts) {
      result = ast$Expr_FieldAccess(result, part, Parser_make_span(self, expr_span(left).start, tok.span.end));
    }
    return result;
  }
  if (Parser_check(self, lexer$TokenKind_TkIntLit)) {
    const tok = Parser_advance(self);
    name = tok.value;
    name_end = tok.span.end;
  } else {
    const tok = Parser_expect(self, lexer$TokenKind_TkIdent);
    name = tok.value;
    name_end = tok.span.end;
  }
  if (Parser_check(self, lexer$TokenKind_TkLParen)) {
    Parser_advance(self);
    const args = Parser_parse_arg_list(self);
    const rparen = Parser_expect(self, lexer$TokenKind_TkRParen);
    return ast$Expr_MethodCall(left, name, args, [], Parser_make_span(self, expr_span(left).start, rparen.span.end));
  }
  return ast$Expr_FieldAccess(left, name, Parser_make_span(self, expr_span(left).start, name_end));
}
function Parser_parse_index_expr(self, receiver) {
  Parser_advance(self);
  const index = Parser_parse_expr(self);
  const end_tok = Parser_expect(self, lexer$TokenKind_TkRBracket);
  const span = Parser_make_span(self, expr_span(receiver).start, end_tok.span.end);
  return ast$Expr_IndexExpr(receiver, index, span);
}
function Parser_parse_call_expr(self, left) {
  Parser_advance(self);
  const args = Parser_parse_arg_list(self);
  const rparen = Parser_expect(self, lexer$TokenKind_TkRParen);
  return ast$Expr_Call(left, args, [], Parser_make_span(self, expr_span(left).start, rparen.span.end));
}
function Parser_parse_arg_list(self) {
  let args = [];
  if (Parser_check(self, lexer$TokenKind_TkRParen)) {
    return args;
  }
  List_push(args, Parser_parse_expr(self));
  while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
    if (Parser_check(self, lexer$TokenKind_TkRParen)) {
      break;
    }
    List_push(args, Parser_parse_expr(self));
  }
  return args;
}
function Parser_parse_catch_expr(self, left) {
  Parser_advance(self);
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let arms = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    List_push(arms, Parser_parse_match_arm(self));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  const end_tok = Parser_expect(self, lexer$TokenKind_TkRBrace);
  const span = Parser_make_span(self, expr_span(left).start, end_tok.span.end);
  return ast$Expr_CatchExpr(left, arms, span);
}
function Parser_parse_string_interp(self) {
  const start_tok = Parser_advance(self);
  let parts = [];
  let last_end = start_tok.span.end;
  if ((Str_len(start_tok.value) > 0)) {
    List_push(parts, ast$StringInterpPart_LitPart(start_tok.value));
  }
  List_push(parts, ast$StringInterpPart_ExprPart(Parser_parse_expr(self)));
  while (true) {
    const tok = Parser_peek(self);
    if (Parser_check(self, lexer$TokenKind_TkStringInterpMiddle)) {
      Parser_advance(self);
      last_end = tok.span.end;
      if ((Str_len(tok.value) > 0)) {
        List_push(parts, ast$StringInterpPart_LitPart(tok.value));
      }
      List_push(parts, ast$StringInterpPart_ExprPart(Parser_parse_expr(self)));
    } else {
      if (Parser_check(self, lexer$TokenKind_TkStringInterpEnd)) {
        Parser_advance(self);
        last_end = tok.span.end;
        if ((Str_len(tok.value) > 0)) {
          List_push(parts, ast$StringInterpPart_LitPart(tok.value));
        }
        break;
      } else {
        break;
      }
    }
  }
  return ast$Expr_StringInterp(parts, Parser_make_span(self, start_tok.span.start, last_end));
}
function Parser_parse_if_expr(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkIf);
  const condition = Parser_parse_expr_no_struct(self);
  const then_branch = Parser_parse_block_expr(self);
  let else_branch = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkElse)) {
    if (Parser_check(self, lexer$TokenKind_TkIf)) {
      else_branch = Option_some(Parser_parse_if_expr(self));
    } else {
      else_branch = Option_some(Parser_parse_block_expr(self));
    }
  }
  const end_pos = (function() {
  const __ring_m = else_branch;
  if (__ring_m._tag === "some") { const eb = __ring_m._0; return expr_span(eb).end; }
  if (__ring_m._tag === "none") { return expr_span(then_branch).end; }
  __match_fail(__ring_m);
})();
  return ast$Expr_IfExpr(condition, then_branch, else_branch, Parser_make_span(self, start, end_pos));
}
function Parser_parse_match_expr(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkMatch);
  const scrutinee = Parser_parse_expr_no_struct(self);
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let arms = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    List_push(arms, Parser_parse_match_arm(self));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$Expr_MatchExpr(scrutinee, arms, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_match_arm(self) {
  const start = Parser_current_span_start(self);
  const pattern = Parser_parse_pattern(self);
  let guard = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkIf)) {
    Parser_advance(self);
    guard = Option_some(Parser_parse_expr(self));
  }
  Parser_expect(self, lexer$TokenKind_TkFatArrow);
  const body = Parser_parse_expr(self);
  return new ast$MatchArm(pattern, guard, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_pattern(self) {
  const tok = Parser_peek(self);
  const start = Parser_current_span_start(self);
  if ((Parser_check(self, lexer$TokenKind_TkIdent) && (tok.value === "_"))) {
    Parser_advance(self);
    return ast$Pattern_Wildcard(tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkIntLit)) {
    Parser_advance(self);
    return ast$Pattern_Literal(ast$LiteralValue_IntVal(Option_unwrap_or(parse_int(tok.value), 0)), tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkFloatLit)) {
    Parser_advance(self);
    return ast$Pattern_Literal(ast$LiteralValue_FloatVal(Option_unwrap_or(parse_float(tok.value), 0)), tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkStringLit)) {
    Parser_advance(self);
    return ast$Pattern_Literal(ast$LiteralValue_StrVal(tok.value), tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkTrue)) {
    Parser_advance(self);
    return ast$Pattern_Literal(ast$LiteralValue_BoolVal(true), tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkFalse)) {
    Parser_advance(self);
    return ast$Pattern_Literal(ast$LiteralValue_BoolVal(false), tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkIdent)) {
    Parser_advance(self);
    let name = tok.value;
    let qualifier = Option_none;
    if (((!is_uppercase(Option_unwrap_or(Str_char_at(name, 0), ""))) && Parser_check(self, lexer$TokenKind_TkColonColon))) {
      let qual_parts = [name];
      let next_name = name;
      while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
        Parser_advance(self);
        const next_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
        next_name = next_tok.value;
        if (((!is_uppercase(Option_unwrap_or(Str_char_at(next_name, 0), ""))) && Parser_check(self, lexer$TokenKind_TkColonColon))) {
          List_push(qual_parts, next_name);
        } else {
          break;
        }
      }
      const qual_str = List_join(qual_parts, "::");
      if ((is_uppercase(Option_unwrap_or(Str_char_at(next_name, 0), "")) && Parser_check(self, lexer$TokenKind_TkColonColon))) {
        Parser_advance(self);
        const variant_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
        qualifier = Option_some(`${qual_str}::${next_name}`);
        name = variant_tok.value;
      } else {
        qualifier = Option_some(qual_str);
        name = next_name;
      }
    }
    if ((is_uppercase(Option_unwrap_or(Str_char_at(name, 0), "")) && Parser_check(self, lexer$TokenKind_TkColonColon))) {
      Parser_advance(self);
      const variant_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
      qualifier = Option_some((function() {
  const __ring_m = qualifier;
  if (__ring_m._tag === "some") { const q = __ring_m._0; return `${q}::${name}`; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})());
      name = variant_tok.value;
    }
    if (Parser_check(self, lexer$TokenKind_TkLParen)) {
      Parser_advance(self);
      let fields = [];
      if ((!Parser_check(self, lexer$TokenKind_TkRParen))) {
        List_push(fields, Parser_parse_pattern(self));
        while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
          if (Parser_check(self, lexer$TokenKind_TkRParen)) {
            break;
          }
          List_push(fields, Parser_parse_pattern(self));
        }
      }
      const rparen = Parser_expect(self, lexer$TokenKind_TkRParen);
      return ast$Pattern_Constructor(name, qualifier, fields, Parser_make_span(self, start, rparen.span.end));
    }
    if ((Parser_check(self, lexer$TokenKind_TkLBrace) && is_uppercase(Option_unwrap_or(Str_char_at(name, 0), "")))) {
      Parser_advance(self);
      let named_fields = [];
      let rest = false;
      while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
        if (Parser_check(self, lexer$TokenKind_TkDotDot)) {
          Parser_advance(self);
          rest = true;
          Parser_try_consume(self, lexer$TokenKind_TkComma);
          break;
        }
        const f_start = Parser_current_span_start(self);
        const f_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
        const f_name = f_tok.value;
        let pat = ast$Pattern_Binding(f_name, f_tok.span);
        if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
          pat = Parser_parse_pattern(self);
        }
        const f_end = Parser_current_span_start(self);
        List_push(named_fields, new ast$NamedPatternField(f_name, pat, Parser_make_span(self, f_start, f_end)));
        Parser_try_consume(self, lexer$TokenKind_TkComma);
      }
      const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
      return ast$Pattern_NamedConstructor(name, qualifier, named_fields, rest, Parser_make_span(self, start, rbrace.span.end));
    }
    if (Option_is_some(qualifier)) {
      return ast$Pattern_Constructor(name, qualifier, [], Parser_make_span(self, start, Parser_current_span_start(self)));
    }
    return ast$Pattern_Binding(name, tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkLParen)) {
    Parser_advance(self);
    const first = Parser_parse_pattern(self);
    if ((!Parser_check(self, lexer$TokenKind_TkComma))) {
      Parser_error(self, "Expected ',' in tuple pattern - single-element tuple patterns not supported");
    }
    Parser_advance(self);
    let elements = [first];
    if ((!Parser_check(self, lexer$TokenKind_TkRParen))) {
      List_push(elements, Parser_parse_pattern(self));
      while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
        if (Parser_check(self, lexer$TokenKind_TkRParen)) {
          break;
        }
        List_push(elements, Parser_parse_pattern(self));
      }
    }
    const end_tok = Parser_expect(self, lexer$TokenKind_TkRParen);
    return ast$Pattern_TuplePattern(elements, Parser_make_span(self, start, end_tok.span.end));
  }
  return Parser_error(self, `Unexpected token '${tok.value}' in pattern`);
}
function Parser_parse_handle_expr(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkHandle);
  const body = Parser_parse_block_expr(self);
  Parser_expect(self, lexer$TokenKind_TkWith);
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let handlers = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    List_push(handlers, Parser_parse_effect_handler(self));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$Expr_HandleExpr(body, handlers, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_effect_handler(self) {
  const start = Parser_current_span_start(self);
  let effect_name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
    Parser_advance(self);
    const next = Parser_expect(self, lexer$TokenKind_TkIdent).value;
    effect_name = `${effect_name}::${next}`;
  }
  Parser_expect(self, lexer$TokenKind_TkDot);
  const op_name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  Parser_expect(self, lexer$TokenKind_TkLParen);
  const params = Parser_parse_params(self);
  Parser_expect(self, lexer$TokenKind_TkRParen);
  Parser_expect(self, lexer$TokenKind_TkFatArrow);
  const body = Parser_parse_expr(self);
  return new ast$EffectHandler(effect_name, op_name, params, Option_none, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_lambda_expr(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkFn);
  Parser_expect(self, lexer$TokenKind_TkLParen);
  const params = Parser_parse_params(self);
  Parser_expect(self, lexer$TokenKind_TkRParen);
  let return_type = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkArrow)) {
    return_type = Option_some(Parser_parse_type_expr(self));
  }
  const body = Parser_parse_block_expr(self);
  return ast$Expr_Lambda(params, return_type, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_struct_literal(self, name, start, qualifier) {
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let fields = [];
  let spread = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkDotDot)) {
    Parser_advance(self);
    spread = Option_some(Parser_parse_expr(self));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    const f_start = Parser_current_span_start(self);
    const f_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
    const f_name = f_tok.value;
    let f_value = ast$Expr_Ident(f_name, Option_none, f_tok.span);
    if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
      f_value = Parser_parse_expr(self);
    }
    const f_end = expr_span(f_value).end;
    List_push(fields, new ast$StructFieldInit(f_name, f_value, Parser_make_span(self, f_start, f_end)));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$Expr_StructLit(name, qualifier, [], fields, spread, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_try_parse_type_args(self) {
  if ((!Parser_check(self, lexer$TokenKind_TkLt))) {
    return [];
  }
  const save_pos = self.pos;
  const save_errors = self.error_count;
  const sink_checkpoint = diagnostics$CollectingSink_save(self.sink);
  Parser_advance(self);
  let args = [];
  List_push(args, Parser_parse_type_expr(self));
  while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
    List_push(args, Parser_parse_type_expr(self));
  }
  if ((!Parser_check(self, lexer$TokenKind_TkGt))) {
    self.pos = save_pos;
    self.error_count = save_errors;
    diagnostics$CollectingSink_restore(self.sink, sink_checkpoint);
    return [];
  }
  Parser_advance(self);
  return args;
}
function Parser_parse_type_expr(self) {
  const start = Parser_current_span_start(self);
  if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
    return Parser_parse_record_type_expr(self);
  }
  if (Parser_check(self, lexer$TokenKind_TkFn)) {
    Parser_advance(self);
    Parser_expect(self, lexer$TokenKind_TkLParen);
    let params = [];
    if ((!Parser_check(self, lexer$TokenKind_TkRParen))) {
      List_push(params, Parser_parse_type_expr(self));
      while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
        if (Parser_check(self, lexer$TokenKind_TkRParen)) {
          break;
        }
        List_push(params, Parser_parse_type_expr(self));
      }
    }
    Parser_expect(self, lexer$TokenKind_TkRParen);
    Parser_expect(self, lexer$TokenKind_TkArrow);
    const return_type = Parser_parse_type_expr(self);
    let fn_end = type_expr_span(return_type).end;
    let fn_effects = [];
    if (Parser_check(self, lexer$TokenKind_TkWith)) {
      fn_effects = Parser_parse_effect_annotation(self);
      fn_end = Parser_current_span_start(self);
    }
    return ast$TypeExpr_FnType(params, return_type, fn_effects, Parser_make_span(self, start, fn_end));
  }
  if (Parser_check(self, lexer$TokenKind_TkLParen)) {
    Parser_advance(self);
    const first = Parser_parse_type_expr(self);
    if (Parser_check(self, lexer$TokenKind_TkComma)) {
      Parser_advance(self);
      let elements = [first];
      if ((!Parser_check(self, lexer$TokenKind_TkRParen))) {
        List_push(elements, Parser_parse_type_expr(self));
        while (Parser_check(self, lexer$TokenKind_TkComma)) {
          Parser_advance(self);
          if (Parser_check(self, lexer$TokenKind_TkRParen)) {
            break;
          }
          List_push(elements, Parser_parse_type_expr(self));
        }
      }
      const end_tok = Parser_expect(self, lexer$TokenKind_TkRParen);
      return ast$TypeExpr_TupleType(elements, Parser_make_span(self, start, end_tok.span.end));
    }
    Parser_expect(self, lexer$TokenKind_TkRParen);
    return first;
  }
  if (Parser_check(self, lexer$TokenKind_TkSuper)) {
    Parser_advance(self);
    Parser_expect(self, lexer$TokenKind_TkColonColon);
    let qualifier_parts = ["super"];
    while (Parser_check(self, lexer$TokenKind_TkSuper)) {
      List_push(qualifier_parts, "super");
      Parser_advance(self);
      Parser_expect(self, lexer$TokenKind_TkColonColon);
    }
    const type_name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
    const type_args = Parser_try_parse_type_args(self);
    const end = Parser_current_span_start(self);
    let result = ast$TypeExpr_Named(type_name, Option_some(List_join(qualifier_parts, "::")), type_args, Parser_make_span(self, start, end));
    if (Parser_try_consume(self, lexer$TokenKind_TkQuestion)) {
      const opt_end = Parser_current_span_start(self);
      result = ast$TypeExpr_OptionType(result, Parser_make_span(self, start, opt_end));
    }
    return result;
  }
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  let qualifier = Option_none;
  let actual_name = name;
  if (Parser_check(self, lexer$TokenKind_TkColonColon)) {
    let qual_parts = [name];
    while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
      Parser_advance(self);
      const member_tok = Parser_expect(self, lexer$TokenKind_TkIdent);
      const member_name = member_tok.value;
      if (((!is_uppercase(Option_unwrap_or(Str_char_at(member_name, 0), ""))) && Parser_check(self, lexer$TokenKind_TkColonColon))) {
        List_push(qual_parts, member_name);
      } else {
        actual_name = member_name;
        break;
      }
    }
    qualifier = Option_some(List_join(qual_parts, "::"));
  }
  const type_args = Parser_try_parse_type_args(self);
  const end = Parser_current_span_start(self);
  let result = ast$TypeExpr_Named(actual_name, qualifier, type_args, Parser_make_span(self, start, end));
  if (Parser_try_consume(self, lexer$TokenKind_TkQuestion)) {
    const opt_end = Parser_current_span_start(self);
    result = ast$TypeExpr_OptionType(result, Parser_make_span(self, start, opt_end));
  }
  return result;
}
function Parser_parse_record_type_expr(self) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkLBrace);
  let fields = [];
  let rest = Option_none;
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) && (!Parser_at_end(self)))) {
    if (Parser_check(self, lexer$TokenKind_TkDotDot)) {
      Parser_advance(self);
      rest = Option_some(Parser_expect(self, lexer$TokenKind_TkIdent).value);
      Parser_try_consume(self, lexer$TokenKind_TkComma);
      break;
    }
    const field_start = Parser_current_span_start(self);
    const field_name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
    Parser_expect(self, lexer$TokenKind_TkColon);
    const field_type = Parser_parse_type_expr(self);
    const field_end = Parser_current_span_start(self);
    List_push(fields, new ast$RecordTypeField(field_name, field_type, Parser_make_span(self, field_start, field_end)));
    if ((!Parser_try_consume(self, lexer$TokenKind_TkComma))) {
      break;
    }
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace);
  return ast$TypeExpr_RecordType(fields, rest, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_type_params(self) {
  if ((!Parser_check(self, lexer$TokenKind_TkLt))) {
    return [];
  }
  Parser_advance(self);
  let params = [];
  while (((!Parser_check(self, lexer$TokenKind_TkGt)) && (!Parser_at_end(self)))) {
    const tp_start = Parser_current_span_start(self);
    const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
    let bounds = [];
    if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
      List_push(bounds, Parser_parse_type_bound(self));
      while (Parser_check(self, lexer$TokenKind_TkPlus)) {
        Parser_advance(self);
        List_push(bounds, Parser_parse_type_bound(self));
      }
    }
    const tp_end = Parser_current_span_start(self);
    List_push(params, new ast$TypeParam(name, bounds, Parser_make_span(self, tp_start, tp_end)));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  Parser_expect(self, lexer$TokenKind_TkGt);
  return params;
}
function Parser_parse_type_bound(self) {
  const start = Parser_current_span_start(self);
  const trait_name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  const type_args = Parser_try_parse_type_args(self);
  const end = Parser_current_span_start(self);
  return new ast$TypeBound(trait_name, type_args, Parser_make_span(self, start, end));
}
function Parser_parse_params(self) {
  let params = [];
  if (Parser_check(self, lexer$TokenKind_TkRParen)) {
    return params;
  }
  List_push(params, Parser_parse_param(self));
  while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
    if (Parser_check(self, lexer$TokenKind_TkRParen)) {
      break;
    }
    List_push(params, Parser_parse_param(self));
  }
  return params;
}
function Parser_parse_param(self) {
  const start = Parser_current_span_start(self);
  let is_mutable = false;
  if (Parser_check(self, lexer$TokenKind_TkVar)) {
    Parser_advance(self);
    is_mutable = true;
  } else {
    if (Parser_check(self, lexer$TokenKind_TkMut)) {
      Parser_advance(self);
      is_mutable = true;
    }
  }
  const name = Parser_expect(self, lexer$TokenKind_TkIdent).value;
  let type_annotation = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
    type_annotation = Option_some(Parser_parse_type_expr(self));
  }
  const end = Parser_current_span_start(self);
  return new ast$Param(name, is_mutable, type_annotation, Parser_make_span(self, start, end));
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

function __Parser_Clone_clone(self) {
  return new Parser(__List_Clone.clone(self.tokens, __Token_Clone), self.pos, self.file, __CollectingSink_Clone.clone(self.sink), self.error_count);
}
const __Parser_Clone = { clone: __Parser_Clone_clone };

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

function __Parser_Debug_debug(self) {
  return "Parser { " + "tokens: " + __List_Debug.debug(self.tokens, __Token_Debug) + ", " + "pos: " + String(self.pos) + ", " + "file: " + String(self.file) + ", " + "sink: " + __CollectingSink_Debug.debug(self.sink) + ", " + "error_count: " + String(self.error_count) + " }";
}
const __Parser_Debug = { debug: __Parser_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { PREC_NONE, PREC_CATCH, PREC_LOGIC_OR, PREC_LOGIC_AND, PREC_EQUALITY, PREC_COMPARE, PREC_RANGE, PREC_ADD_SUB, PREC_MUL_DIV, PREC_UNARY, PREC_POSTFIX, infix_precedence, type_expr_span, expr_span, Parser, new_parser, parse, Parser_peek, Parser_peek_at, Parser_advance, Parser_check, Parser_try_consume, Parser_expect, Parser_at_end, Parser_current_span_start, Parser_make_span, Parser_report_error, Parser_error, Parser_parse_program, Parser_parse_stmt, Parser_parse_while_stmt, Parser_parse_loop_stmt, Parser_parse_for_in_stmt, Parser_parse_break_stmt, Parser_parse_continue_stmt, Parser_parse_if_let_stmt, Parser_parse_binding_stmt, Parser_parse_binding_body, Parser_parse_return_stmt, Parser_parse_block_expr, Parser_parse_use_decl, Parser_parse_mod_block, Parser_parse_decl, Parser_parse_effect_list, Parser_parse_effect_annotation, Parser_parse_fn_decl, Parser_parse_const_decl, Parser_parse_sig_block, Parser_parse_extern_decl, Parser_parse_extern_fn_decl_body, Parser_parse_extern_type_decl_body, Parser_parse_type_alias_decl, Parser_parse_struct_decl, Parser_parse_enum_decl, Parser_parse_impl_decl, Parser_parse_effect_alias_decl, Parser_parse_effect_decl, Parser_parse_test_decl, Parser_parse_trait_decl, Parser_parse_expr, Parser_parse_expr_no_struct, Parser_parse_expr_bp, Parser_parse_prefix, Parser_parse_dot_expr, Parser_parse_index_expr, Parser_parse_call_expr, Parser_parse_arg_list, Parser_parse_catch_expr, Parser_parse_string_interp, Parser_parse_if_expr, Parser_parse_match_expr, Parser_parse_match_arm, Parser_parse_pattern, Parser_parse_handle_expr, Parser_parse_effect_handler, Parser_parse_lambda_expr, Parser_parse_struct_literal, Parser_try_parse_type_args, Parser_parse_type_expr, Parser_parse_record_type_expr, Parser_parse_type_params, Parser_parse_type_bound, Parser_parse_params, Parser_parse_param, __Parser_Clone, __Parser_Debug };