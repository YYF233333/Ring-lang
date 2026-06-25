import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { new_lexer as lexer$new_lexer, token_kind_value as lexer$token_kind_value, Lexer as lexer$Lexer, Token as lexer$Token, TokenKind_TkFn as lexer$TokenKind_TkFn, TokenKind_TkLet as lexer$TokenKind_TkLet, TokenKind_TkMut as lexer$TokenKind_TkMut, TokenKind_TkConst as lexer$TokenKind_TkConst, TokenKind_TkStruct as lexer$TokenKind_TkStruct, TokenKind_TkEnum as lexer$TokenKind_TkEnum, TokenKind_TkMatch as lexer$TokenKind_TkMatch, TokenKind_TkImpl as lexer$TokenKind_TkImpl, TokenKind_TkEffect as lexer$TokenKind_TkEffect, TokenKind_TkHandle as lexer$TokenKind_TkHandle, TokenKind_TkWith as lexer$TokenKind_TkWith, TokenKind_TkIf as lexer$TokenKind_TkIf, TokenKind_TkElse as lexer$TokenKind_TkElse, TokenKind_TkCatch as lexer$TokenKind_TkCatch, TokenKind_TkTest as lexer$TokenKind_TkTest, TokenKind_TkReturn as lexer$TokenKind_TkReturn, TokenKind_TkFor as lexer$TokenKind_TkFor, TokenKind_TkIn as lexer$TokenKind_TkIn, TokenKind_TkPub as lexer$TokenKind_TkPub, TokenKind_TkWhere as lexer$TokenKind_TkWhere, TokenKind_TkTrue as lexer$TokenKind_TkTrue, TokenKind_TkFalse as lexer$TokenKind_TkFalse, TokenKind_TkTrait as lexer$TokenKind_TkTrait, TokenKind_TkTry as lexer$TokenKind_TkTry, TokenKind_TkWhile as lexer$TokenKind_TkWhile, TokenKind_TkBreak as lexer$TokenKind_TkBreak, TokenKind_TkContinue as lexer$TokenKind_TkContinue, TokenKind_TkLoop as lexer$TokenKind_TkLoop, TokenKind_TkUse as lexer$TokenKind_TkUse, TokenKind_TkAs as lexer$TokenKind_TkAs, TokenKind_TkExtern as lexer$TokenKind_TkExtern, TokenKind_TkMod as lexer$TokenKind_TkMod, TokenKind_TkSuper as lexer$TokenKind_TkSuper, TokenKind_TkSig as lexer$TokenKind_TkSig, TokenKind_TkRequires as lexer$TokenKind_TkRequires, TokenKind_TkIntLit as lexer$TokenKind_TkIntLit, TokenKind_TkFloatLit as lexer$TokenKind_TkFloatLit, TokenKind_TkStringLit as lexer$TokenKind_TkStringLit, TokenKind_TkStringInterpStart as lexer$TokenKind_TkStringInterpStart, TokenKind_TkStringInterpMiddle as lexer$TokenKind_TkStringInterpMiddle, TokenKind_TkStringInterpEnd as lexer$TokenKind_TkStringInterpEnd, TokenKind_TkRawStringLit as lexer$TokenKind_TkRawStringLit, TokenKind_TkIdent as lexer$TokenKind_TkIdent, TokenKind_TkPlus as lexer$TokenKind_TkPlus, TokenKind_TkMinus as lexer$TokenKind_TkMinus, TokenKind_TkStar as lexer$TokenKind_TkStar, TokenKind_TkSlash as lexer$TokenKind_TkSlash, TokenKind_TkPercent as lexer$TokenKind_TkPercent, TokenKind_TkEqEq as lexer$TokenKind_TkEqEq, TokenKind_TkBangEq as lexer$TokenKind_TkBangEq, TokenKind_TkLt as lexer$TokenKind_TkLt, TokenKind_TkGt as lexer$TokenKind_TkGt, TokenKind_TkLtEq as lexer$TokenKind_TkLtEq, TokenKind_TkGtEq as lexer$TokenKind_TkGtEq, TokenKind_TkAmpAmp as lexer$TokenKind_TkAmpAmp, TokenKind_TkPipePipe as lexer$TokenKind_TkPipePipe, TokenKind_TkPipe as lexer$TokenKind_TkPipe, TokenKind_TkBang as lexer$TokenKind_TkBang, TokenKind_TkEq as lexer$TokenKind_TkEq, TokenKind_TkPlusEq as lexer$TokenKind_TkPlusEq, TokenKind_TkMinusEq as lexer$TokenKind_TkMinusEq, TokenKind_TkStarEq as lexer$TokenKind_TkStarEq, TokenKind_TkSlashEq as lexer$TokenKind_TkSlashEq, TokenKind_TkPercentEq as lexer$TokenKind_TkPercentEq, TokenKind_TkLParen as lexer$TokenKind_TkLParen, TokenKind_TkRParen as lexer$TokenKind_TkRParen, TokenKind_TkLBrace as lexer$TokenKind_TkLBrace, TokenKind_TkRBrace as lexer$TokenKind_TkRBrace, TokenKind_TkLBracket as lexer$TokenKind_TkLBracket, TokenKind_TkRBracket as lexer$TokenKind_TkRBracket, TokenKind_TkComma as lexer$TokenKind_TkComma, TokenKind_TkColon as lexer$TokenKind_TkColon, TokenKind_TkColonColon as lexer$TokenKind_TkColonColon, TokenKind_TkDot as lexer$TokenKind_TkDot, TokenKind_TkDotDot as lexer$TokenKind_TkDotDot, TokenKind_TkDotDotEq as lexer$TokenKind_TkDotDotEq, TokenKind_TkFatArrow as lexer$TokenKind_TkFatArrow, TokenKind_TkArrow as lexer$TokenKind_TkArrow, TokenKind_TkQuestion as lexer$TokenKind_TkQuestion, TokenKind_TkSemi as lexer$TokenKind_TkSemi, TokenKind_TkEof as lexer$TokenKind_TkEof, TokenKind_TkError as lexer$TokenKind_TkError, __Lexer_Clone as lexer$__Lexer_Clone, __Lexer_Debug as lexer$__Lexer_Debug, __Token_Eq as lexer$__Token_Eq, __Token_Clone as lexer$__Token_Clone, __Token_Ord as lexer$__Token_Ord, __Token_Debug as lexer$__Token_Debug, __TokenKind_Eq as lexer$__TokenKind_Eq, __TokenKind_Clone as lexer$__TokenKind_Clone, __TokenKind_Ord as lexer$__TokenKind_Ord, __TokenKind_Debug as lexer$__TokenKind_Debug, Lexer_tokenize as lexer$Lexer_tokenize, Lexer_next_token as lexer$Lexer_next_token, Lexer_lex_string as lexer$Lexer_lex_string, Lexer_lex_string_continuation as lexer$Lexer_lex_string_continuation, Lexer_lex_string_body as lexer$Lexer_lex_string_body, Lexer_lex_raw_string as lexer$Lexer_lex_raw_string, Lexer_lex_number as lexer$Lexer_lex_number, Lexer_lex_ident as lexer$Lexer_lex_ident, Lexer_lex_punctuation as lexer$Lexer_lex_punctuation, Lexer_skip_whitespace_and_comments as lexer$Lexer_skip_whitespace_and_comments, Lexer_peek as lexer$Lexer_peek, Lexer_advance as lexer$Lexer_advance, Lexer_current_position as lexer$Lexer_current_position, Lexer_make_token as lexer$Lexer_make_token, Lexer_last_frame_depth as lexer$Lexer_last_frame_depth, Lexer_last_frame_span as lexer$Lexer_last_frame_span, Lexer_inc_last_depth as lexer$Lexer_inc_last_depth, Lexer_dec_last_depth as lexer$Lexer_dec_last_depth, Lexer_reset_last_frame as lexer$Lexer_reset_last_frame } from "./lexer.js";
import { make_diag as diagnostics$make_diag, make_diagnostic as diagnostics$make_diagnostic, new_collecting_sink as diagnostics$new_collecting_sink, severity_to_str as diagnostics$severity_to_str, CollectingSink as diagnostics$CollectingSink, Diagnostic as diagnostics$Diagnostic, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, DiagnosticNote as diagnostics$DiagnosticNote, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, Suggestion as diagnostics$Suggestion, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Severity_Eq as diagnostics$__Severity_Eq, __Severity_Clone as diagnostics$__Severity_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __Severity_Debug as diagnostics$__Severity_Debug, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Suggestion_Debug as diagnostics$__Suggestion_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0105 as codes$E0105, E0106 as codes$E0106, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0208 as codes$E0208, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0306 as codes$E0306, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0404 as codes$E0404, E0405 as codes$E0405, E0406 as codes$E0406, E0407 as codes$E0407, E0408 as codes$E0408, E0409 as codes$E0409, E0410 as codes$E0410, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0504 as codes$E0504, E0505 as codes$E0505, E0506 as codes$E0506, E0507 as codes$E0507, E0508 as codes$E0508, E0509 as codes$E0509, E0510 as codes$E0510, E0511 as codes$E0511, E0512 as codes$E0512, E0513 as codes$E0513, E0514 as codes$E0514, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0705 as codes$E0705, E0706 as codes$E0706, E0707 as codes$E0707, W0001 as codes$W0001, W0002 as codes$W0002, error_category as codes$error_category, error_description as codes$error_description } from "./codes.js";



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

function Parser_peek(self) {
  if ((self.pos >= List_len(self.tokens))) {
    return Option_unwrap_or(List_get(self.tokens, (List_len(self.tokens) - 1)), new lexer$Token(lexer$TokenKind_TkEof, "", new ast$Span(self.file, new ast$Position(1, 0, 0), new ast$Position(1, 0, 0))));
  }
  return Option_unwrap_or(List_get(self.tokens, self.pos), new lexer$Token(lexer$TokenKind_TkEof, "", new ast$Span(self.file, new ast$Position(1, 0, 0), new ast$Position(1, 0, 0))));
}
function Parser_advance(self) {
  const tok = Parser_peek(self);
  self.pos = (self.pos + 1);
  return tok;
}
function Parser_check(self, kind) {
  return lexer$__TokenKind_Eq.eq(Parser_peek(self).kind, kind);
}
function Parser_at_end(self) {
  return Parser_check(self, lexer$TokenKind_TkEof);
}
function Parser_current_span_start(self) {
  return Parser_peek(self).span.start;
}
function Parser_report_error(self, code, msg, span, __ring_ev_fail) {
  const tok = Parser_peek(self);
  const error_span = Option_unwrap_or(span, tok.span);
  diagnostics$CollectingSink_report(self.sink, diagnostics$make_diag(code, diagnostics$Severity_SevError, msg, error_span, diagnostics$DiagnosticContext_ParseError(tok.value, Option_none)));
  self.error_count = (self.error_count + 1);
  if ((self.error_count >= MAX_ERRORS)) {
    return __ring_raise_fail("Too many parse errors", __ring_ev_fail);
  }
}
function Parser_error(self, msg, __ring_ev_fail) {
  const tok = Parser_peek(self);
  Parser_report_error(self, codes$E0103, msg, Option_some(tok.span), __ring_ev_fail);
  return __ring_raise_fail(msg, __ring_ev_fail);
}
function Parser_expect(self, kind, __ring_ev_fail) {
  const tok = Parser_peek(self);
  if ((!lexer$__TokenKind_Eq.eq(tok.kind, kind))) {
    Parser_error(self, `Expected '${lexer$token_kind_value(kind)}', got '${tok.value}' (${lexer$token_kind_value(tok.kind)})`, __ring_ev_fail);
  }
  return Parser_advance(self);
}
function Parser_make_span(self, start, end) {
  return new ast$Span(self.file, start, end);
}
function Parser_try_consume(self, kind) {
  if (Parser_check(self, kind)) {
    Parser_advance(self);
    return true;
  }
  return false;
}
function Parser_parse_pattern(self, __ring_ev_fail) {
  const tok = Parser_peek(self);
  const start = Parser_current_span_start(self);
  if ((Parser_check(self, lexer$TokenKind_TkIdent) ? (tok.value === "_") : false)) {
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
    if (((!is_uppercase(Option_unwrap_or(Str_char_at(name, 0), ""))) ? Parser_check(self, lexer$TokenKind_TkColonColon) : false)) {
      let qual_parts = [name];
      let next_name = name;
      while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
        Parser_advance(self);
        const next_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
        next_name = next_tok.value;
        if (((!is_uppercase(Option_unwrap_or(Str_char_at(next_name, 0), ""))) ? Parser_check(self, lexer$TokenKind_TkColonColon) : false)) {
          List_push(qual_parts, next_name);
        } else {
          break;
        }
      }
      const qual_str = List_join(qual_parts, "::");
      if ((is_uppercase(Option_unwrap_or(Str_char_at(next_name, 0), "")) ? Parser_check(self, lexer$TokenKind_TkColonColon) : false)) {
        Parser_advance(self);
        const variant_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
        qualifier = Option_some(`${qual_str}::${next_name}`);
        name = variant_tok.value;
      } else {
        qualifier = Option_some(qual_str);
        name = next_name;
      }
    }
    if ((is_uppercase(Option_unwrap_or(Str_char_at(name, 0), "")) ? Parser_check(self, lexer$TokenKind_TkColonColon) : false)) {
      Parser_advance(self);
      const variant_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
      let __ring_blk0;
      __ring_match6: {
        const __ring_m6 = qualifier;
        if (__ring_m6._tag === "some") {
          const q = __ring_m6._0;
          __ring_blk0 = `${q}::${name}`;
          break __ring_match6;
        }
        if (__ring_m6._tag === "none") {
          __ring_blk0 = name;
          break __ring_match6;
        }
        __match_fail(__ring_m6);
      }
      qualifier = Option_some(__ring_blk0);
      name = variant_tok.value;
    }
    if (Parser_check(self, lexer$TokenKind_TkLParen)) {
      Parser_advance(self);
      let fields = [];
      if ((!Parser_check(self, lexer$TokenKind_TkRParen))) {
        List_push(fields, Parser_parse_pattern(self, __ring_ev_fail));
        while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
          if (Parser_check(self, lexer$TokenKind_TkRParen)) {
            break;
          }
          List_push(fields, Parser_parse_pattern(self, __ring_ev_fail));
        }
      }
      const rparen = Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
      return ast$Pattern_Constructor(name, qualifier, fields, Parser_make_span(self, start, rparen.span.end));
    }
    if ((Parser_check(self, lexer$TokenKind_TkLBrace) ? is_uppercase(Option_unwrap_or(Str_char_at(name, 0), "")) : false)) {
      Parser_advance(self);
      let named_fields = [];
      let rest = false;
      while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
        if (Parser_check(self, lexer$TokenKind_TkDotDot)) {
          Parser_advance(self);
          rest = true;
          Parser_try_consume(self, lexer$TokenKind_TkComma);
          break;
        }
        const f_start = Parser_current_span_start(self);
        const f_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
        const f_name = f_tok.value;
        let pat = ast$Pattern_Binding(f_name, f_tok.span);
        if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
          pat = Parser_parse_pattern(self, __ring_ev_fail);
        }
        const f_end = Parser_current_span_start(self);
        List_push(named_fields, new ast$NamedPatternField(f_name, pat, Parser_make_span(self, f_start, f_end)));
        Parser_try_consume(self, lexer$TokenKind_TkComma);
      }
      const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
      return ast$Pattern_NamedConstructor(name, qualifier, named_fields, rest, Parser_make_span(self, start, rbrace.span.end));
    }
    if (Option_is_some(qualifier)) {
      return ast$Pattern_Constructor(name, qualifier, [], Parser_make_span(self, start, Parser_current_span_start(self)));
    }
    return ast$Pattern_Binding(name, tok.span);
  }
  if (Parser_check(self, lexer$TokenKind_TkLParen)) {
    Parser_advance(self);
    const first = Parser_parse_pattern(self, __ring_ev_fail);
    if ((!Parser_check(self, lexer$TokenKind_TkComma))) {
      Parser_error(self, "Expected ',' in tuple pattern - single-element tuple patterns not supported", __ring_ev_fail);
    }
    Parser_advance(self);
    let elements = [first];
    if ((!Parser_check(self, lexer$TokenKind_TkRParen))) {
      List_push(elements, Parser_parse_pattern(self, __ring_ev_fail));
      while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
        if (Parser_check(self, lexer$TokenKind_TkRParen)) {
          break;
        }
        List_push(elements, Parser_parse_pattern(self, __ring_ev_fail));
      }
    }
    const end_tok = Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
    return ast$Pattern_TuplePattern(elements, Parser_make_span(self, start, end_tok.span.end));
  }
  return Parser_error(self, `Unexpected token '${tok.value}' in pattern`, __ring_ev_fail);
}
function Parser_try_parse_type_args(self, __ring_ev_fail) {
  if ((!Parser_check(self, lexer$TokenKind_TkLt))) {
    return [];
  }
  const save_pos = self.pos;
  const save_errors = self.error_count;
  const sink_checkpoint = diagnostics$CollectingSink_save(self.sink);
  Parser_advance(self);
  let args = [];
  List_push(args, Parser_parse_type_expr(self, __ring_ev_fail));
  while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
    List_push(args, Parser_parse_type_expr(self, __ring_ev_fail));
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
function Parser_parse_record_type_expr(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let fields = [];
  let rest = Option_none;
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    if (Parser_check(self, lexer$TokenKind_TkDotDot)) {
      Parser_advance(self);
      rest = Option_some(Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value);
      Parser_try_consume(self, lexer$TokenKind_TkComma);
      break;
    }
    const field_start = Parser_current_span_start(self);
    const field_name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
    Parser_expect(self, lexer$TokenKind_TkColon, __ring_ev_fail);
    const field_type = Parser_parse_type_expr(self, __ring_ev_fail);
    const field_end = Parser_current_span_start(self);
    List_push(fields, new ast$RecordTypeField(field_name, field_type, Parser_make_span(self, field_start, field_end)));
    if ((!Parser_try_consume(self, lexer$TokenKind_TkComma))) {
      break;
    }
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$TypeExpr_RecordType(fields, rest, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_effect_list(self, __ring_ev_fail) {
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let effects = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    const estart = Parser_current_span_start(self);
    let ename = "";
    if (Parser_check(self, lexer$TokenKind_TkMut)) {
      ename = Parser_advance(self).value;
    } else {
      ename = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
      while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
        Parser_advance(self);
        const next = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
        ename = `${ename}::${next}`;
      }
    }
    let type_args = [];
    if (Parser_check(self, lexer$TokenKind_TkLt)) {
      Parser_advance(self);
      while (((!Parser_check(self, lexer$TokenKind_TkGt)) ? (!Parser_at_end(self)) : false)) {
        List_push(type_args, Parser_parse_type_expr(self, __ring_ev_fail));
        if ((!Parser_check(self, lexer$TokenKind_TkGt))) {
          Parser_expect(self, lexer$TokenKind_TkComma, __ring_ev_fail);
        }
      }
      Parser_expect(self, lexer$TokenKind_TkGt, __ring_ev_fail);
    }
    const eend = Parser_current_span_start(self);
    List_push(effects, new ast$EffectExpr(ename, type_args, Parser_make_span(self, estart, eend)));
    if ((!Parser_check(self, lexer$TokenKind_TkRBrace))) {
      Parser_expect(self, lexer$TokenKind_TkComma, __ring_ev_fail);
    }
  }
  Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return effects;
}
function Parser_parse_effect_annotation(self, __ring_ev_fail) {
  Parser_expect(self, lexer$TokenKind_TkWith, __ring_ev_fail);
  return Parser_parse_effect_list(self, __ring_ev_fail);
}
function Parser_parse_type_expr(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
    return Parser_parse_record_type_expr(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkFn)) {
    Parser_advance(self);
    Parser_expect(self, lexer$TokenKind_TkLParen, __ring_ev_fail);
    let params = [];
    if ((!Parser_check(self, lexer$TokenKind_TkRParen))) {
      List_push(params, Parser_parse_type_expr(self, __ring_ev_fail));
      while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
        if (Parser_check(self, lexer$TokenKind_TkRParen)) {
          break;
        }
        List_push(params, Parser_parse_type_expr(self, __ring_ev_fail));
      }
    }
    Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
    Parser_expect(self, lexer$TokenKind_TkArrow, __ring_ev_fail);
    const return_type = Parser_parse_type_expr(self, __ring_ev_fail);
    let fn_end = type_expr_span(return_type).end;
    let fn_effects = [];
    if (Parser_check(self, lexer$TokenKind_TkWith)) {
      fn_effects = Parser_parse_effect_annotation(self, __ring_ev_fail);
      fn_end = Parser_current_span_start(self);
    }
    return ast$TypeExpr_FnType(params, return_type, fn_effects, Parser_make_span(self, start, fn_end));
  }
  if (Parser_check(self, lexer$TokenKind_TkLParen)) {
    Parser_advance(self);
    const first = Parser_parse_type_expr(self, __ring_ev_fail);
    if (Parser_check(self, lexer$TokenKind_TkComma)) {
      Parser_advance(self);
      let elements = [first];
      if ((!Parser_check(self, lexer$TokenKind_TkRParen))) {
        List_push(elements, Parser_parse_type_expr(self, __ring_ev_fail));
        while (Parser_check(self, lexer$TokenKind_TkComma)) {
          Parser_advance(self);
          if (Parser_check(self, lexer$TokenKind_TkRParen)) {
            break;
          }
          List_push(elements, Parser_parse_type_expr(self, __ring_ev_fail));
        }
      }
      const end_tok = Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
      let result = ast$TypeExpr_TupleType(elements, Parser_make_span(self, start, end_tok.span.end));
      if (Parser_try_consume(self, lexer$TokenKind_TkQuestion)) {
        const opt_end = Parser_current_span_start(self);
        result = ast$TypeExpr_OptionType(result, Parser_make_span(self, start, opt_end));
      }
      return result;
    }
    Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
    return first;
  }
  if (Parser_check(self, lexer$TokenKind_TkSuper)) {
    Parser_advance(self);
    Parser_expect(self, lexer$TokenKind_TkColonColon, __ring_ev_fail);
    let qualifier_parts = ["super"];
    while (Parser_check(self, lexer$TokenKind_TkSuper)) {
      List_push(qualifier_parts, "super");
      Parser_advance(self);
      Parser_expect(self, lexer$TokenKind_TkColonColon, __ring_ev_fail);
    }
    const type_name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
    const type_args = Parser_try_parse_type_args(self, __ring_ev_fail);
    const end = Parser_current_span_start(self);
    let result = ast$TypeExpr_Named(type_name, Option_some(List_join(qualifier_parts, "::")), type_args, Parser_make_span(self, start, end));
    if (Parser_try_consume(self, lexer$TokenKind_TkQuestion)) {
      const opt_end = Parser_current_span_start(self);
      result = ast$TypeExpr_OptionType(result, Parser_make_span(self, start, opt_end));
    }
    return result;
  }
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  let qualifier = Option_none;
  let actual_name = name;
  if (Parser_check(self, lexer$TokenKind_TkColonColon)) {
    let qual_parts = [name];
    while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
      Parser_advance(self);
      const member_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
      const member_name = member_tok.value;
      if (((!is_uppercase(Option_unwrap_or(Str_char_at(member_name, 0), ""))) ? Parser_check(self, lexer$TokenKind_TkColonColon) : false)) {
        List_push(qual_parts, member_name);
      } else {
        actual_name = member_name;
        break;
      }
    }
    qualifier = Option_some(List_join(qual_parts, "::"));
  }
  const type_args = Parser_try_parse_type_args(self, __ring_ev_fail);
  const end = Parser_current_span_start(self);
  let result = ast$TypeExpr_Named(actual_name, qualifier, type_args, Parser_make_span(self, start, end));
  if (Parser_try_consume(self, lexer$TokenKind_TkQuestion)) {
    const opt_end = Parser_current_span_start(self);
    result = ast$TypeExpr_OptionType(result, Parser_make_span(self, start, opt_end));
  }
  return result;
}
function Parser_parse_break_stmt(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkBreak, __ring_ev_fail);
  Parser_try_consume(self, lexer$TokenKind_TkSemi);
  const end = Parser_current_span_start(self);
  return ast$Stmt_Break(Parser_make_span(self, start, end));
}
function Parser_parse_continue_stmt(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkContinue, __ring_ev_fail);
  Parser_try_consume(self, lexer$TokenKind_TkSemi);
  const end = Parser_current_span_start(self);
  return ast$Stmt_Continue(Parser_make_span(self, start, end));
}
function Parser_peek_at(self, offset) {
  const idx = (self.pos + offset);
  if ((idx >= List_len(self.tokens))) {
    return new lexer$Token(lexer$TokenKind_TkEof, "", new ast$Span(self.file, new ast$Position(1, 0, 0), new ast$Position(1, 0, 0)));
  }
  return Option_unwrap_or(List_get(self.tokens, idx), new lexer$Token(lexer$TokenKind_TkEof, "", new ast$Span(self.file, new ast$Position(1, 0, 0), new ast$Position(1, 0, 0))));
}
function Parser_skip_to_recovery_point(self, stop_tokens) {
  let brace_depth = 0;
  while ((!Parser_at_end(self))) {
    const kind = Parser_peek(self).kind;
    if ((brace_depth === 0)) {
      const __ring_iter_2 = __List_Iterable.iter(stop_tokens);
      while (true) {
        const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
        if (__ring_next_2._tag === "none") break;
        const stop = __ring_next_2._0;
        if (lexer$__TokenKind_Eq.eq(kind, stop)) {
          return;
        }
      }
    }
    if (lexer$__TokenKind_Eq.eq(kind, lexer$TokenKind_TkRBrace)) {
      if ((brace_depth === 0)) {
        return;
      }
      brace_depth = (brace_depth - 1);
    }
    if (lexer$__TokenKind_Eq.eq(kind, lexer$TokenKind_TkLBrace)) {
      brace_depth = (brace_depth + 1);
    }
    Parser_advance(self);
  }
}
function Parser_parse_struct_literal(self, name, start, qualifier, __ring_ev_fail) {
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let fields = [];
  let spread = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkDotDot)) {
    Parser_advance(self);
    spread = Option_some(Parser_parse_expr(self, __ring_ev_fail));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    const f_start = Parser_current_span_start(self);
    const f_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
    const f_name = f_tok.value;
    let f_value = ast$Expr_Ident(f_name, Option_none, f_tok.span);
    if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
      f_value = Parser_parse_expr(self, __ring_ev_fail);
    }
    const f_end = expr_span(f_value).end;
    List_push(fields, new ast$StructFieldInit(f_name, f_value, Parser_make_span(self, f_start, f_end)));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$Expr_StructLit(name, qualifier, [], fields, spread, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_string_interp(self, __ring_ev_fail) {
  const start_tok = Parser_advance(self);
  let parts = [];
  let last_end = start_tok.span.end;
  if ((Str_len(start_tok.value) > 0)) {
    List_push(parts, ast$StringInterpPart_LitPart(start_tok.value));
  }
  List_push(parts, ast$StringInterpPart_ExprPart(Parser_parse_expr(self, __ring_ev_fail)));
  while (true) {
    const tok = Parser_peek(self);
    if (Parser_check(self, lexer$TokenKind_TkStringInterpMiddle)) {
      Parser_advance(self);
      last_end = tok.span.end;
      if ((Str_len(tok.value) > 0)) {
        List_push(parts, ast$StringInterpPart_LitPart(tok.value));
      }
      List_push(parts, ast$StringInterpPart_ExprPart(Parser_parse_expr(self, __ring_ev_fail)));
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
function Parser_parse_match_expr(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkMatch, __ring_ev_fail);
  const scrutinee = Parser_parse_expr_no_struct(self);
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let arms = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    const arm_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_match_arm(self, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    __ring_match7: {
      const __ring_m7 = arm_result;
      if (__ring_m7._tag === "some") {
        const arm = __ring_m7._0;
        List_push(arms, arm);
        break __ring_match7;
      }
      if (__ring_m7._tag === "none") {
        Parser_skip_to_recovery_point(self, [lexer$TokenKind_TkComma]);
        break __ring_match7;
      }
      __match_fail(__ring_m7);
    }
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$Expr_MatchExpr(scrutinee, arms, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_lambda_expr(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkFn, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkLParen, __ring_ev_fail);
  const params = Parser_parse_params(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
  let return_type = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkArrow)) {
    return_type = Option_some(Parser_parse_type_expr(self, __ring_ev_fail));
  }
  const body = Parser_parse_block_expr(self, __ring_ev_fail);
  return ast$Expr_Lambda(params, return_type, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_if_expr(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkIf, __ring_ev_fail);
  const cond_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_expr_no_struct(self)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  let __ring_blk1;
  __ring_match8: {
    const __ring_m8 = cond_result;
    if (__ring_m8._tag === "some") {
      const c = __ring_m8._0;
      __ring_blk1 = c;
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      Parser_skip_to_recovery_point(self, [lexer$TokenKind_TkLBrace]);
      __ring_blk1 = dummy_expr();
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
  const condition = __ring_blk1;
  const then_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_block_expr(self, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
  let __ring_blk2;
  __ring_match9: {
    const __ring_m9 = then_result;
    if (__ring_m9._tag === "some") {
      const t = __ring_m9._0;
      __ring_blk2 = t;
      break __ring_match9;
    }
    if (__ring_m9._tag === "none") {
      Parser_skip_to_recovery_point(self, [lexer$TokenKind_TkElse]);
      __ring_blk2 = ast$Expr_Block([], Option_none, Parser_make_span(self, start, Parser_current_span_start(self)));
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
  const then_branch = __ring_blk2;
  let else_branch = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkElse)) {
    if (Parser_check(self, lexer$TokenKind_TkIf)) {
      const else_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_if_expr(self, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      __ring_match10: {
        const __ring_m10 = else_result;
        if (__ring_m10._tag === "some") {
          const e = __ring_m10._0;
          else_branch = Option_some(e);
          break __ring_match10;
        }
        if (__ring_m10._tag === "none") {
          Parser_skip_to_recovery_point(self, []);
          break __ring_match10;
        }
        __match_fail(__ring_m10);
      }
    } else {
      const else_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_block_expr(self, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      __ring_match11: {
        const __ring_m11 = else_result;
        if (__ring_m11._tag === "some") {
          const e = __ring_m11._0;
          else_branch = Option_some(e);
          break __ring_match11;
        }
        if (__ring_m11._tag === "none") {
          Parser_skip_to_recovery_point(self, []);
          break __ring_match11;
        }
        __match_fail(__ring_m11);
      }
    }
  }
  let __ring_blk3;
  __ring_match12: {
    const __ring_m12 = else_branch;
    if (__ring_m12._tag === "some") {
      const eb = __ring_m12._0;
      __ring_blk3 = expr_span(eb).end;
      break __ring_match12;
    }
    if (__ring_m12._tag === "none") {
      __ring_blk3 = expr_span(then_branch).end;
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
  const end_pos = __ring_blk3;
  return ast$Expr_IfExpr(condition, then_branch, else_branch, Parser_make_span(self, start, end_pos));
}
function Parser_parse_param(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  let is_mutable = false;
  if (Parser_check(self, lexer$TokenKind_TkMut)) {
    Parser_advance(self);
    is_mutable = true;
  }
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  let type_annotation = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
    type_annotation = Option_some(Parser_parse_type_expr(self, __ring_ev_fail));
  }
  let default_value = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkEq)) {
    default_value = Option_some(Parser_parse_expr(self, __ring_ev_fail));
  }
  const end = Parser_current_span_start(self);
  return new ast$Param(name, is_mutable, type_annotation, default_value, Parser_make_span(self, start, end));
}
function Parser_parse_params(self, __ring_ev_fail) {
  let params = [];
  if (Parser_check(self, lexer$TokenKind_TkRParen)) {
    return params;
  }
  List_push(params, Parser_parse_param(self, __ring_ev_fail));
  while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
    if (Parser_check(self, lexer$TokenKind_TkRParen)) {
      break;
    }
    List_push(params, Parser_parse_param(self, __ring_ev_fail));
  }
  let seen_default = false;
  const __ring_iter_3 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
    if (__ring_next_3._tag === "none") break;
    const p = __ring_next_3._0;
    __ring_match13: {
      const __ring_m13 = p.default_value;
      if (__ring_m13._tag === "some") {
        seen_default = true;
        break __ring_match13;
      }
      if (__ring_m13._tag === "none") {
        if (seen_default) {
          diagnostics$CollectingSink_report(self.sink, diagnostics$make_diag(codes$E0106, diagnostics$Severity_SevError, `Non-default parameter '${p.name}' after default parameter`, p.span, diagnostics$DiagnosticContext_ParseError(p.name, Option_none)));
        }
        break __ring_match13;
      }
      __match_fail(__ring_m13);
    }
  }
  return params;
}
function Parser_parse_effect_handler(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  let effect_name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
    Parser_advance(self);
    const next = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
    effect_name = `${effect_name}::${next}`;
  }
  Parser_expect(self, lexer$TokenKind_TkDot, __ring_ev_fail);
  const op_name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  Parser_expect(self, lexer$TokenKind_TkLParen, __ring_ev_fail);
  const params = Parser_parse_params(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkFatArrow, __ring_ev_fail);
  const body = Parser_parse_expr(self, __ring_ev_fail);
  return new ast$EffectHandler(effect_name, op_name, params, Option_none, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_handle_expr(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkHandle, __ring_ev_fail);
  const body = Parser_parse_block_expr(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkWith, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let handlers = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    const handler_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_effect_handler(self, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    __ring_match14: {
      const __ring_m14 = handler_result;
      if (__ring_m14._tag === "some") {
        const h = __ring_m14._0;
        List_push(handlers, h);
        break __ring_match14;
      }
      if (__ring_m14._tag === "none") {
        Parser_skip_to_recovery_point(self, [lexer$TokenKind_TkComma]);
        break __ring_match14;
      }
      __match_fail(__ring_m14);
    }
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$Expr_HandleExpr(body, handlers, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_while_stmt(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkWhile, __ring_ev_fail);
  const condition = Parser_parse_expr_no_struct(self);
  const body = Parser_parse_block_expr(self, __ring_ev_fail);
  return ast$Stmt_While(condition, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_return_stmt(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkReturn, __ring_ev_fail);
  let value = Option_none;
  if ((((!Parser_check(self, lexer$TokenKind_TkSemi)) ? (!Parser_check(self, lexer$TokenKind_TkRBrace)) : false) ? (!Parser_at_end(self)) : false)) {
    value = Option_some(Parser_parse_expr(self, __ring_ev_fail));
  }
  Parser_try_consume(self, lexer$TokenKind_TkSemi);
  const end = Parser_current_span_start(self);
  return ast$Stmt_Return(value, Parser_make_span(self, start, end));
}
function Parser_parse_loop_stmt(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkLoop, __ring_ev_fail);
  const body = Parser_parse_block_expr(self, __ring_ev_fail);
  const condition = ast$Expr_BoolLit(true, Parser_make_span(self, start, start));
  return ast$Stmt_While(condition, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_if_let_stmt(self, start, __ring_ev_fail) {
  Parser_expect(self, lexer$TokenKind_TkLet, __ring_ev_fail);
  const pattern = Parser_parse_pattern(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkEq, __ring_ev_fail);
  const expr = Parser_parse_expr(self, __ring_ev_fail);
  const then_block = Parser_parse_block_expr(self, __ring_ev_fail);
  let else_block = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkElse)) {
    else_block = Option_some(Parser_parse_block_expr(self, __ring_ev_fail));
  }
  let __ring_blk4;
  __ring_match15: {
    const __ring_m15 = else_block;
    if (__ring_m15._tag === "some") {
      const eb = __ring_m15._0;
      __ring_blk4 = expr_span(eb).end;
      break __ring_match15;
    }
    if (__ring_m15._tag === "none") {
      __ring_blk4 = expr_span(then_block).end;
      break __ring_match15;
    }
    __match_fail(__ring_m15);
  }
  const end_pos = __ring_blk4;
  return ast$Stmt_IfLet(pattern, expr, then_block, else_block, Parser_make_span(self, start, end_pos));
}
function Parser_parse_expr_no_struct(self, __ring_ev_fail) {
  return Parser_parse_expr_bp(self, PREC_NONE, false, __ring_ev_fail);
}
function Parser_parse_for_in_stmt(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkFor, __ring_ev_fail);
  let binding = "";
  let binding_span = ast$span_zero();
  let destructure = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkLParen)) {
    Parser_advance(self);
    let names = [];
    let spans = [];
    const first = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
    List_push(names, first.value);
    List_push(spans, first.span);
    while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
      if (Parser_check(self, lexer$TokenKind_TkRParen)) {
        break;
      }
      const tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
      List_push(names, tok.value);
      List_push(spans, tok.span);
    }
    Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
    binding = Option_unwrap_or(List_first(names), "");
    binding_span = Option_unwrap_or(List_first(spans), ast$span_zero());
    if ((List_len(names) > 1)) {
      destructure = Option_some(new ast$DestructureBinding(names, spans));
    }
  } else {
    const name_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
    binding = name_tok.value;
    binding_span = name_tok.span;
  }
  Parser_expect(self, lexer$TokenKind_TkIn, __ring_ev_fail);
  const iterable = Parser_parse_expr_no_struct(self, __ring_ev_fail);
  const body = Parser_parse_block_expr(self, __ring_ev_fail);
  return ast$Stmt_ForIn(binding, binding_span, destructure, iterable, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_binding_stmt(self, mutable, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkLet, __ring_ev_fail);
  return Parser_parse_binding_body(self, mutable, start, __ring_ev_fail);
}
function Parser_parse_binding_body(self, mutable, start, __ring_ev_fail) {
  const name_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
  const name = name_tok.value;
  const name_span = name_tok.span;
  let type_annotation = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
    type_annotation = Option_some(Parser_parse_type_expr(self, __ring_ev_fail));
  }
  Parser_expect(self, lexer$TokenKind_TkEq, __ring_ev_fail);
  const init = Parser_parse_expr(self, __ring_ev_fail);
  Parser_try_consume(self, lexer$TokenKind_TkSemi);
  const end = Parser_current_span_start(self);
  const span = Parser_make_span(self, start, end);
  if (mutable) {
    return ast$Stmt_Var(name, name_span, type_annotation, init, span);
  } else {
    return ast$Stmt_Let(name, name_span, type_annotation, init, span);
  }
}
function Parser_parse_stmt(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  if (Parser_check(self, lexer$TokenKind_TkLet)) {
    if (lexer$__TokenKind_Eq.eq(Parser_peek_at(self, 1).kind, lexer$TokenKind_TkMut)) {
      const bind_start = Parser_current_span_start(self);
      Parser_advance(self);
      Parser_advance(self);
      return Parser_parse_binding_body(self, true, bind_start, __ring_ev_fail);
    }
    const saved_pos = self.pos;
    Parser_advance(self);
    if (Parser_check(self, lexer$TokenKind_TkLParen)) {
      const pattern = Parser_parse_pattern(self, __ring_ev_fail);
      Parser_expect(self, lexer$TokenKind_TkEq, __ring_ev_fail);
      const init = Parser_parse_expr(self, __ring_ev_fail);
      Parser_try_consume(self, lexer$TokenKind_TkSemi);
      const end = Parser_current_span_start(self);
      return ast$Stmt_LetDestructure(pattern, init, Parser_make_span(self, start, end));
    }
    self.pos = saved_pos;
    return Parser_parse_binding_stmt(self, false, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkReturn)) {
    return Parser_parse_return_stmt(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkIf)) {
    const saved_pos = self.pos;
    Parser_advance(self);
    if (Parser_check(self, lexer$TokenKind_TkLet)) {
      return Parser_parse_if_let_stmt(self, start, __ring_ev_fail);
    }
    self.pos = saved_pos;
  }
  if (Parser_check(self, lexer$TokenKind_TkWhile)) {
    return Parser_parse_while_stmt(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkLoop)) {
    return Parser_parse_loop_stmt(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkFor)) {
    return Parser_parse_for_in_stmt(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkBreak)) {
    return Parser_parse_break_stmt(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkContinue)) {
    return Parser_parse_continue_stmt(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkTry)) {
    Parser_report_error(self, codes$E0101, "`try` is a reserved keyword; use `expr catch { pattern => handler }` for error handling", Option_some(Parser_peek(self).span), __ring_ev_fail);
    Parser_advance(self);
    if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
      Parser_advance(self);
      let depth = 1;
      while (((depth > 0) ? (self.pos < (List_len(self.tokens) - 1)) : false)) {
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
  const expr = Parser_parse_expr(self, __ring_ev_fail);
  if ((((((Parser_check(self, lexer$TokenKind_TkEq) ? true : Parser_check(self, lexer$TokenKind_TkPlusEq)) ? true : Parser_check(self, lexer$TokenKind_TkMinusEq)) ? true : Parser_check(self, lexer$TokenKind_TkStarEq)) ? true : Parser_check(self, lexer$TokenKind_TkSlashEq)) ? true : Parser_check(self, lexer$TokenKind_TkPercentEq))) {
    const op_tok = Parser_advance(self);
    const value_expr = Parser_parse_expr(self, __ring_ev_fail);
    Parser_try_consume(self, lexer$TokenKind_TkSemi);
    const end = Parser_current_span_start(self);
    let value = value_expr;
    if (lexer$__TokenKind_Eq.eq(op_tok.kind, lexer$TokenKind_TkPlusEq)) {
      value = ast$Expr_BinOp(ast$BinOp_Add, expr, value_expr, expr_span(value_expr));
    } else {
      if (lexer$__TokenKind_Eq.eq(op_tok.kind, lexer$TokenKind_TkMinusEq)) {
        value = ast$Expr_BinOp(ast$BinOp_Sub, expr, value_expr, expr_span(value_expr));
      } else {
        if (lexer$__TokenKind_Eq.eq(op_tok.kind, lexer$TokenKind_TkStarEq)) {
          value = ast$Expr_BinOp(ast$BinOp_Mul, expr, value_expr, expr_span(value_expr));
        } else {
          if (lexer$__TokenKind_Eq.eq(op_tok.kind, lexer$TokenKind_TkSlashEq)) {
            value = ast$Expr_BinOp(ast$BinOp_Div, expr, value_expr, expr_span(value_expr));
          } else {
            if (lexer$__TokenKind_Eq.eq(op_tok.kind, lexer$TokenKind_TkPercentEq)) {
              value = ast$Expr_BinOp(ast$BinOp_Mod, expr, value_expr, expr_span(value_expr));
            }
          }
        }
      }
    }
    return ast$Stmt_Assign(expr, value, Parser_make_span(self, start, end));
  }
  const has_semi = Parser_try_consume(self, lexer$TokenKind_TkSemi);
  const end = Parser_current_span_start(self);
  return ast$Stmt_ExprStmt(expr, has_semi, Parser_make_span(self, start, end));
}
function Parser_parse_block_expr(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let stmts = [];
  let tail = Option_none;
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    const stmt = Parser_parse_stmt(self, __ring_ev_fail);
    if (Parser_check(self, lexer$TokenKind_TkRBrace)) {
      __ring_match16: {
        const __ring_m16 = stmt;
        if (__ring_m16._tag === "ExprStmt") {
          const e = __ring_m16.expr; const hs = __ring_m16.has_semi;
          if ((!hs)) {
            tail = Option_some(e);
          } else {
            List_push(stmts, stmt);
          }
          break __ring_match16;
        }
        List_push(stmts, stmt);
        break __ring_match16;
      }
    } else {
      List_push(stmts, stmt);
    }
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$Expr_Block(stmts, tail, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_prefix(self, allow_struct_lit, __ring_ev_fail) {
  const tok = Parser_peek(self);
  const start = Parser_current_span_start(self);
  if ((Parser_check(self, lexer$TokenKind_TkMinus) ? true : Parser_check(self, lexer$TokenKind_TkBang))) {
    Parser_advance(self);
    const operand = Parser_parse_expr_bp(self, PREC_UNARY, allow_struct_lit, __ring_ev_fail);
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
    return Parser_parse_string_interp(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
    return Parser_parse_block_expr(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkIf)) {
    return Parser_parse_if_expr(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkMatch)) {
    return Parser_parse_match_expr(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkHandle)) {
    return Parser_parse_handle_expr(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkFn)) {
    return Parser_parse_lambda_expr(self, __ring_ev_fail);
  }
  if (Parser_check(self, lexer$TokenKind_TkLBracket)) {
    Parser_advance(self);
    let elements = [];
    if ((!Parser_check(self, lexer$TokenKind_TkRBracket))) {
      List_push(elements, Parser_parse_expr(self, __ring_ev_fail));
      while (Parser_check(self, lexer$TokenKind_TkComma)) {
        Parser_advance(self);
        if (Parser_check(self, lexer$TokenKind_TkRBracket)) {
          break;
        }
        List_push(elements, Parser_parse_expr(self, __ring_ev_fail));
      }
    }
    const end_tok = Parser_expect(self, lexer$TokenKind_TkRBracket, __ring_ev_fail);
    return ast$Expr_ListLit(elements, Parser_make_span(self, start, end_tok.span.end));
  }
  if (Parser_check(self, lexer$TokenKind_TkLParen)) {
    Parser_advance(self);
    const first = Parser_parse_expr(self, __ring_ev_fail);
    if (Parser_check(self, lexer$TokenKind_TkComma)) {
      Parser_advance(self);
      let elements = [first];
      if ((!Parser_check(self, lexer$TokenKind_TkRParen))) {
        List_push(elements, Parser_parse_expr(self, __ring_ev_fail));
        while (Parser_check(self, lexer$TokenKind_TkComma)) {
          Parser_advance(self);
          if (Parser_check(self, lexer$TokenKind_TkRParen)) {
            break;
          }
          List_push(elements, Parser_parse_expr(self, __ring_ev_fail));
        }
      }
      const end_tok = Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
      return ast$Expr_TupleLit(elements, Parser_make_span(self, start, end_tok.span.end));
    }
    Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
    return first;
  }
  if (Parser_check(self, lexer$TokenKind_TkSuper)) {
    Parser_advance(self);
    Parser_expect(self, lexer$TokenKind_TkColonColon, __ring_ev_fail);
    let qualifier_parts = ["super"];
    while (Parser_check(self, lexer$TokenKind_TkSuper)) {
      List_push(qualifier_parts, "super");
      Parser_advance(self);
      Parser_expect(self, lexer$TokenKind_TkColonColon, __ring_ev_fail);
    }
    const member_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
    const member_name = member_tok.value;
    const qualifier_str = List_join(qualifier_parts, "::");
    if (((allow_struct_lit ? is_uppercase(Option_unwrap_or(Str_char_at(member_name, 0), "")) : false) ? Parser_check(self, lexer$TokenKind_TkLBrace) : false)) {
      return Parser_parse_struct_literal(self, member_name, start, Option_some(qualifier_str), __ring_ev_fail);
    }
    return ast$Expr_Ident(member_name, Option_some(qualifier_str), Parser_make_span(self, start, member_tok.span.end));
  }
  if (Parser_check(self, lexer$TokenKind_TkIdent)) {
    Parser_advance(self);
    const name = tok.value;
    if ((is_uppercase(Option_unwrap_or(Str_char_at(name, 0), "")) ? Parser_check(self, lexer$TokenKind_TkColonColon) : false)) {
      Parser_advance(self);
      const variant_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
      const variant_name = variant_tok.value;
      if (((allow_struct_lit ? is_uppercase(Option_unwrap_or(Str_char_at(variant_name, 0), "")) : false) ? Parser_check(self, lexer$TokenKind_TkLBrace) : false)) {
        return Parser_parse_struct_literal(self, variant_name, start, Option_some(name), __ring_ev_fail);
      }
      return ast$Expr_Ident(variant_name, Option_some(name), Parser_make_span(self, start, variant_tok.span.end));
    }
    if (((!is_uppercase(Option_unwrap_or(Str_char_at(name, 0), ""))) ? Parser_check(self, lexer$TokenKind_TkColonColon) : false)) {
      let qualifier_parts = [name];
      let member_tok = tok;
      let member_name = name;
      while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
        Parser_advance(self);
        member_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
        member_name = member_tok.value;
        if (((!is_uppercase(Option_unwrap_or(Str_char_at(member_name, 0), ""))) ? Parser_check(self, lexer$TokenKind_TkColonColon) : false)) {
          List_push(qualifier_parts, member_name);
        } else {
          break;
        }
      }
      const qualifier_str = List_join(qualifier_parts, "::");
      if ((is_uppercase(Option_unwrap_or(Str_char_at(member_name, 0), "")) ? Parser_check(self, lexer$TokenKind_TkColonColon) : false)) {
        Parser_advance(self);
        const variant_tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
        const variant_name = variant_tok.value;
        const full_qualifier = `${qualifier_str}::${member_name}`;
        if (((allow_struct_lit ? is_uppercase(Option_unwrap_or(Str_char_at(variant_name, 0), "")) : false) ? Parser_check(self, lexer$TokenKind_TkLBrace) : false)) {
          return Parser_parse_struct_literal(self, variant_name, start, Option_some(full_qualifier), __ring_ev_fail);
        }
        return ast$Expr_Ident(variant_name, Option_some(full_qualifier), Parser_make_span(self, start, variant_tok.span.end));
      }
      if (((allow_struct_lit ? is_uppercase(Option_unwrap_or(Str_char_at(member_name, 0), "")) : false) ? Parser_check(self, lexer$TokenKind_TkLBrace) : false)) {
        return Parser_parse_struct_literal(self, member_name, start, Option_some(qualifier_str), __ring_ev_fail);
      }
      return ast$Expr_Ident(member_name, Option_some(qualifier_str), Parser_make_span(self, start, member_tok.span.end));
    }
    if (((allow_struct_lit ? is_uppercase(Option_unwrap_or(Str_char_at(name, 0), "")) : false) ? Parser_check(self, lexer$TokenKind_TkLBrace) : false)) {
      return Parser_parse_struct_literal(self, name, start, Option_none, __ring_ev_fail);
    }
    return ast$Expr_Ident(name, Option_none, tok.span);
  }
  return Parser_error(self, `Unexpected token '${tok.value}' (${lexer$token_kind_value(tok.kind)}) in expression`, __ring_ev_fail);
}
function Parser_parse_index_expr(self, receiver, __ring_ev_fail) {
  Parser_advance(self);
  const index = Parser_parse_expr(self, __ring_ev_fail);
  const end_tok = Parser_expect(self, lexer$TokenKind_TkRBracket, __ring_ev_fail);
  const span = Parser_make_span(self, expr_span(receiver).start, end_tok.span.end);
  return ast$Expr_IndexExpr(receiver, index, span);
}
function Parser_parse_dot_expr(self, left, __ring_ev_fail) {
  Parser_advance(self);
  let name = "";
  let name_end = Parser_current_span_start(self);
  if (Parser_check(self, lexer$TokenKind_TkFloatLit)) {
    const tok = Parser_advance(self);
    const parts = Str_split(tok.value, ".");
    let result = left;
    const __ring_iter_4 = __List_Iterable.iter(parts);
    while (true) {
      const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
      if (__ring_next_4._tag === "none") break;
      const part = __ring_next_4._0;
      result = ast$Expr_FieldAccess(result, part, Parser_make_span(self, expr_span(left).start, tok.span.end));
    }
    return result;
  }
  if (Parser_check(self, lexer$TokenKind_TkIntLit)) {
    const tok = Parser_advance(self);
    name = tok.value;
    name_end = tok.span.end;
  } else {
    const tok = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail);
    name = tok.value;
    name_end = tok.span.end;
  }
  if (Parser_check(self, lexer$TokenKind_TkLParen)) {
    Parser_advance(self);
    const args = Parser_parse_arg_list(self, __ring_ev_fail);
    const rparen = Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
    return ast$Expr_MethodCall(left, name, args, [], Parser_make_span(self, expr_span(left).start, rparen.span.end));
  }
  return ast$Expr_FieldAccess(left, name, Parser_make_span(self, expr_span(left).start, name_end));
}
function Parser_parse_return_expr(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkReturn, __ring_ev_fail);
  let value = Option_none;
  if ((((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_check(self, lexer$TokenKind_TkComma)) : false) ? (!Parser_at_end(self)) : false)) {
    value = Option_some(Parser_parse_expr(self, __ring_ev_fail));
  }
  const end = Parser_current_span_start(self);
  return ast$Expr_ReturnExpr(value, Parser_make_span(self, start, end));
}
function Parser_parse_match_arm(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  let pattern = Parser_parse_pattern(self, __ring_ev_fail);
  if (Parser_check(self, lexer$TokenKind_TkPipe)) {
    let patterns = [pattern];
    while (Parser_try_consume(self, lexer$TokenKind_TkPipe)) {
      List_push(patterns, Parser_parse_pattern(self, __ring_ev_fail));
    }
    const end = pattern_span(Option_unwrap(List_get(patterns, (List_len(patterns) - 1))));
    pattern = ast$Pattern_OrPattern(patterns, Parser_make_span(self, start, end.end));
  }
  let guard = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkIf)) {
    Parser_advance(self);
    guard = Option_some(Parser_parse_expr(self, __ring_ev_fail));
  }
  Parser_expect(self, lexer$TokenKind_TkFatArrow, __ring_ev_fail);
  const body = (Parser_check(self, lexer$TokenKind_TkReturn) ? Parser_parse_return_expr(self, __ring_ev_fail) : Parser_parse_expr(self, __ring_ev_fail));
  return new ast$MatchArm(pattern, guard, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_catch_expr(self, left, __ring_ev_fail) {
  Parser_advance(self);
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let arms = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    List_push(arms, Parser_parse_match_arm(self, __ring_ev_fail));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  const end_tok = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  const span = Parser_make_span(self, expr_span(left).start, end_tok.span.end);
  return ast$Expr_CatchExpr(left, arms, span);
}
function Parser_parse_call_expr(self, left, __ring_ev_fail) {
  Parser_advance(self);
  const args = Parser_parse_arg_list(self, __ring_ev_fail);
  const rparen = Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
  return ast$Expr_Call(left, args, [], Parser_make_span(self, expr_span(left).start, rparen.span.end));
}
function Parser_parse_expr_bp(self, min_prec, allow_struct_lit, __ring_ev_fail) {
  let left = Parser_parse_prefix(self, allow_struct_lit, __ring_ev_fail);
  let last_was_comparison = false;
  while (true) {
    const tok = Parser_peek(self);
    const prec = infix_precedence(tok.kind);
    if ((prec <= min_prec)) {
      break;
    }
    if (Parser_check(self, lexer$TokenKind_TkCatch)) {
      left = Parser_parse_catch_expr(self, left, __ring_ev_fail);
      last_was_comparison = false;
    } else {
      if (Parser_check(self, lexer$TokenKind_TkDot)) {
        left = Parser_parse_dot_expr(self, left, __ring_ev_fail);
        last_was_comparison = false;
      } else {
        if (Parser_check(self, lexer$TokenKind_TkLParen)) {
          if ((tok.span.start.line > expr_span(left).end.line)) {
            break;
          }
          left = Parser_parse_call_expr(self, left, __ring_ev_fail);
          last_was_comparison = false;
        } else {
          if (Parser_check(self, lexer$TokenKind_TkLBracket)) {
            if ((tok.span.start.line > expr_span(left).end.line)) {
              break;
            }
            left = Parser_parse_index_expr(self, left, __ring_ev_fail);
            last_was_comparison = false;
          } else {
            if ((Parser_check(self, lexer$TokenKind_TkDotDot) ? true : Parser_check(self, lexer$TokenKind_TkDotDotEq))) {
              const inclusive = Parser_check(self, lexer$TokenKind_TkDotDotEq);
              Parser_advance(self);
              const right = Parser_parse_expr_bp(self, prec, allow_struct_lit, __ring_ev_fail);
              const span = Parser_make_span(self, expr_span(left).start, expr_span(right).end);
              left = ast$Expr_Range(left, right, inclusive, span);
              last_was_comparison = false;
            } else {
              const is_comparison = ((prec === PREC_EQUALITY) ? true : (prec === PREC_COMPARE));
              if ((is_comparison ? last_was_comparison : false)) {
                Parser_error(self, `Comparison operators are non-associative: cannot chain '${tok.value}' after another comparison`, __ring_ev_fail);
              }
              Parser_advance(self);
              const right = Parser_parse_expr_bp(self, prec, allow_struct_lit, __ring_ev_fail);
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
function Parser_parse_expr(self, __ring_ev_fail) {
  return Parser_parse_expr_bp(self, PREC_NONE, true, __ring_ev_fail);
}
function Parser_parse_arg_list(self, __ring_ev_fail) {
  let args = [];
  if (Parser_check(self, lexer$TokenKind_TkRParen)) {
    return args;
  }
  List_push(args, Parser_parse_expr(self, __ring_ev_fail));
  while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
    if (Parser_check(self, lexer$TokenKind_TkRParen)) {
      break;
    }
    List_push(args, Parser_parse_expr(self, __ring_ev_fail));
  }
  return args;
}
function Parser_parse_type_bound(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  const trait_name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  let type_args = [];
  let assoc_constraints = [];
  if (Parser_check(self, lexer$TokenKind_TkLt)) {
    const save_pos = self.pos;
    const save_errors = self.error_count;
    const sink_checkpoint = diagnostics$CollectingSink_save(self.sink);
    Parser_advance(self);
    while (((!Parser_check(self, lexer$TokenKind_TkGt)) ? (!Parser_at_end(self)) : false)) {
      if ((Parser_check(self, lexer$TokenKind_TkIdent) ? lexer$__TokenKind_Eq.eq(Parser_peek_at(self, 1).kind, lexer$TokenKind_TkEq) : false)) {
        const ac_start = Parser_current_span_start(self);
        const ac_name = Parser_advance(self).value;
        Parser_advance(self);
        const ac_ty = Parser_parse_type_expr(self, __ring_ev_fail);
        const ac_end = Parser_current_span_start(self);
        List_push(assoc_constraints, new ast$AssocConstraint(ac_name, ac_ty, Parser_make_span(self, ac_start, ac_end)));
      } else {
        List_push(type_args, Parser_parse_type_expr(self, __ring_ev_fail));
      }
      if ((!Parser_check(self, lexer$TokenKind_TkGt))) {
        Parser_try_consume(self, lexer$TokenKind_TkComma);
      }
    }
    if ((!Parser_check(self, lexer$TokenKind_TkGt))) {
      self.pos = save_pos;
      self.error_count = save_errors;
      diagnostics$CollectingSink_restore(self.sink, sink_checkpoint);
      type_args = [];
      assoc_constraints = [];
    } else {
      const _ = Parser_advance(self);
    }
  }
  const end = Parser_current_span_start(self);
  return new ast$TypeBound(trait_name, type_args, assoc_constraints, Parser_make_span(self, start, end));
}
function Parser_parse_assoc_type_decl(self, is_pub, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_advance(self);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  let bounds = [];
  if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
    List_push(bounds, Parser_parse_type_bound(self, __ring_ev_fail));
    while (Parser_check(self, lexer$TokenKind_TkPlus)) {
      Parser_advance(self);
      List_push(bounds, Parser_parse_type_bound(self, __ring_ev_fail));
    }
  }
  let value = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkEq)) {
    value = Option_some(Parser_parse_type_expr(self, __ring_ev_fail));
  }
  const end = Parser_current_span_start(self);
  return ast$Decl_AssocType(name, bounds, value, is_pub, Parser_make_span(self, start, end));
}
function Parser_parse_const_decl(self, is_pub, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkConst, __ring_ev_fail);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  let type_annotation = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
    type_annotation = Option_some(Parser_parse_type_expr(self, __ring_ev_fail));
  }
  Parser_expect(self, lexer$TokenKind_TkEq, __ring_ev_fail);
  const init = Parser_parse_expr(self, __ring_ev_fail);
  return ast$Decl_Const(name, type_annotation, init, is_pub, Parser_make_span(self, start, expr_span(init).end));
}
function Parser_parse_type_params(self, __ring_ev_fail) {
  if ((!Parser_check(self, lexer$TokenKind_TkLt))) {
    return [];
  }
  Parser_advance(self);
  let params = [];
  while (((!Parser_check(self, lexer$TokenKind_TkGt)) ? (!Parser_at_end(self)) : false)) {
    const tp_start = Parser_current_span_start(self);
    const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
    let bounds = [];
    if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
      List_push(bounds, Parser_parse_type_bound(self, __ring_ev_fail));
      while (Parser_check(self, lexer$TokenKind_TkPlus)) {
        Parser_advance(self);
        List_push(bounds, Parser_parse_type_bound(self, __ring_ev_fail));
      }
    }
    const tp_end = Parser_current_span_start(self);
    List_push(params, new ast$TypeParam(name, bounds, Parser_make_span(self, tp_start, tp_end)));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  Parser_expect(self, lexer$TokenKind_TkGt, __ring_ev_fail);
  return params;
}
function Parser_parse_effect_alias_decl(self, is_pub, start, __ring_ev_fail) {
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  const type_params = Parser_parse_type_params(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkEq, __ring_ev_fail);
  const effects = Parser_parse_effect_list(self, __ring_ev_fail);
  const end = Parser_current_span_start(self);
  return ast$Decl_EffectAlias(name, type_params, effects, is_pub, Parser_make_span(self, start, end));
}
function Parser_parse_effect_decl(self, is_pub, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkEffect, __ring_ev_fail);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  if ((name === "alias")) {
    return Parser_parse_effect_alias_decl(self, is_pub, start, __ring_ev_fail);
  }
  const type_params = Parser_parse_type_params(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let ops = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    const op_start = Parser_current_span_start(self);
    Parser_expect(self, lexer$TokenKind_TkFn, __ring_ev_fail);
    const op_name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
    Parser_expect(self, lexer$TokenKind_TkLParen, __ring_ev_fail);
    const params = Parser_parse_params(self, __ring_ev_fail);
    Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
    Parser_expect(self, lexer$TokenKind_TkArrow, __ring_ev_fail);
    const return_type = Parser_parse_type_expr(self, __ring_ev_fail);
    let op_body = Option_none;
    if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
      op_body = Option_some(Parser_parse_block_expr(self, __ring_ev_fail));
    }
    const op_end = Parser_current_span_start(self);
    List_push(ops, new ast$EffectOpDecl(op_name, params, return_type, op_body, Parser_make_span(self, op_start, op_end)));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
    Parser_try_consume(self, lexer$TokenKind_TkSemi);
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$Decl_Effect(name, type_params, ops, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_enum_decl(self, is_pub, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkEnum, __ring_ev_fail);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  const type_params = Parser_parse_type_params(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let variants = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    const v_start = Parser_current_span_start(self);
    const v_name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
    let v_fields = [];
    let named_fields = Option_none;
    if (Parser_try_consume(self, lexer$TokenKind_TkLParen)) {
      if (Parser_check(self, lexer$TokenKind_TkRParen)) {
        const rp_span = Parser_peek(self).span;
        Parser_report_error(self, codes$E0104, `empty parentheses on enum variant '${v_name}' — use bare name instead`, Option_some(rp_span), __ring_ev_fail);
        const _rp = Parser_advance(self);
      } else {
        List_push(v_fields, Parser_parse_type_expr(self, __ring_ev_fail));
        while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
          if (Parser_check(self, lexer$TokenKind_TkRParen)) {
            break;
          }
          List_push(v_fields, Parser_parse_type_expr(self, __ring_ev_fail));
        }
        const _rp = Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
      }
    } else {
      if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
        Parser_advance(self);
        let nf = [];
        while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
          const f_start = Parser_current_span_start(self);
          const f_name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
          Parser_expect(self, lexer$TokenKind_TkColon, __ring_ev_fail);
          const f_type = Parser_parse_type_expr(self, __ring_ev_fail);
          const f_end = Parser_current_span_start(self);
          List_push(nf, new ast$NamedEnumField(f_name, f_type, Parser_make_span(self, f_start, f_end)));
          Parser_try_consume(self, lexer$TokenKind_TkComma);
        }
        Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
        named_fields = Option_some(nf);
      }
    }
    const v_end = Parser_current_span_start(self);
    List_push(variants, new ast$EnumVariantDecl(v_name, v_fields, named_fields, Parser_make_span(self, v_start, v_end)));
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$Decl_Enum(name, type_params, variants, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_extern_fn_decl_body(self, is_pub, start, __ring_ev_fail) {
  Parser_expect(self, lexer$TokenKind_TkFn, __ring_ev_fail);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  const type_params = Parser_parse_type_params(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkLParen, __ring_ev_fail);
  const params = Parser_parse_params(self, __ring_ev_fail);
  const rparen = Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
  let last_end = rparen.span.end;
  let return_type = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkArrow)) {
    const rt = Parser_parse_type_expr(self, __ring_ev_fail);
    return_type = Option_some(rt);
    last_end = type_expr_span(rt).end;
  }
  let declared_effects = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkWith)) {
    declared_effects = Option_some(Parser_parse_effect_annotation(self, __ring_ev_fail));
    last_end = Parser_current_span_start(self);
  }
  return ast$Decl_ExternFn(name, type_params, params, return_type, declared_effects, is_pub, Parser_make_span(self, start, last_end));
}
function Parser_parse_extern_type_decl_body(self, is_pub, start, __ring_ev_fail) {
  Parser_advance(self);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  const type_params = Parser_parse_type_params(self, __ring_ev_fail);
  const end = Parser_current_span_start(self);
  return ast$Decl_ExternType(name, type_params, is_pub, Parser_make_span(self, start, end));
}
function Parser_parse_extern_decl(self, is_pub, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkExtern, __ring_ev_fail);
  if ((Parser_check(self, lexer$TokenKind_TkIdent) ? (Parser_peek(self).value === "type") : false)) {
    return Parser_parse_extern_type_decl_body(self, is_pub, start, __ring_ev_fail);
  }
  return Parser_parse_extern_fn_decl_body(self, is_pub, start, __ring_ev_fail);
}
function Parser_parse_fn_decl(self, is_pub, body_optional, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkFn, __ring_ev_fail);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  const type_params = Parser_parse_type_params(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkLParen, __ring_ev_fail);
  const params = Parser_parse_params(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
  let return_type = Option_none;
  if (Parser_try_consume(self, lexer$TokenKind_TkArrow)) {
    return_type = Option_some(Parser_parse_type_expr(self, __ring_ev_fail));
  }
  let declared_effects = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkWith)) {
    declared_effects = Option_some(Parser_parse_effect_annotation(self, __ring_ev_fail));
  }
  let body = ast$Expr_Block([], Option_none, ast$span_zero());
  let is_abstract_val = false;
  if ((body_optional ? (!Parser_check(self, lexer$TokenKind_TkLBrace)) : false)) {
    const pos = Parser_current_span_start(self);
    body = ast$Expr_Block([], Option_none, Parser_make_span(self, pos, pos));
    is_abstract_val = true;
  } else {
    body = Parser_parse_block_expr(self, __ring_ev_fail);
  }
  return ast$Decl_Fn(name, type_params, params, return_type, declared_effects, body, is_pub, is_abstract_val, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_qualified_ident(self, __ring_ev_fail) {
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  if ((!Parser_check(self, lexer$TokenKind_TkColonColon))) {
    return name;
  }
  let parts = [name];
  while (Parser_check(self, lexer$TokenKind_TkColonColon)) {
    Parser_advance(self);
    const segment = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
    List_push(parts, segment);
    if (is_uppercase(Option_unwrap_or(Str_char_at(segment, 0), ""))) {
      break;
    }
  }
  return List_join(parts, "::");
}
function Parser_validate_target_type_args(self, type_params, __ring_ev_fail) {
  if ((!Parser_check(self, lexer$TokenKind_TkLt))) {
    return;
  }
  Parser_advance(self);
  while (((!Parser_check(self, lexer$TokenKind_TkGt)) ? (!Parser_at_end(self)) : false)) {
    const arg_tok = Parser_peek(self);
    if (lexer$__TokenKind_Eq.eq(arg_tok.kind, lexer$TokenKind_TkIdent)) {
      const arg_name = arg_tok.value;
      let found = false;
      const __ring_iter_5 = __List_Iterable.iter(type_params);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const tp = __ring_next_5._0;
        if ((tp.name === arg_name)) {
          found = true;
        }
      }
      if ((!found)) {
        Parser_report_error(self, codes$E0105, `type argument '${arg_name}' in target type is not a type parameter declared on the impl; expected one of the impl's type parameters`, Option_some(arg_tok.span), __ring_ev_fail);
      }
      Parser_advance(self);
    } else {
      Parser_report_error(self, codes$E0105, `expected type parameter name in target type arguments, got '${arg_tok.value}'`, Option_some(arg_tok.span), __ring_ev_fail);
      Parser_advance(self);
    }
    Parser_try_consume(self, lexer$TokenKind_TkComma);
  }
  if (Parser_check(self, lexer$TokenKind_TkGt)) {
    return Parser_advance(self);
  }
}
function Parser_parse_impl_decl(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkImpl, __ring_ev_fail);
  const type_params = Parser_parse_type_params(self, __ring_ev_fail);
  const first_name = Parser_parse_qualified_ident(self, __ring_ev_fail);
  let target_type = first_name;
  let trait_name = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkFor)) {
    Parser_advance(self);
    trait_name = Option_some(first_name);
    target_type = Parser_parse_qualified_ident(self, __ring_ev_fail);
    Parser_validate_target_type_args(self, type_params, __ring_ev_fail);
  }
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let methods = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    if ((Parser_check(self, lexer$TokenKind_TkIdent) ? (Parser_peek(self).value === "delegate") : false)) {
      const d_start = Parser_current_span_start(self);
      Parser_advance(self);
      const d_field = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
      Parser_expect(self, lexer$TokenKind_TkColon, __ring_ev_fail);
      let d_traits = [];
      List_push(d_traits, Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value);
      while (Parser_try_consume(self, lexer$TokenKind_TkComma)) {
        List_push(d_traits, Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value);
      }
      const d_end = Parser_current_span_start(self);
      List_push(methods, ast$Decl_Delegate(d_field, d_traits, Parser_make_span(self, d_start, d_end)));
      continue;
    }
    const m_pub = Parser_try_consume(self, lexer$TokenKind_TkPub);
    if ((Parser_check(self, lexer$TokenKind_TkIdent) ? (Parser_peek(self).value === "type") : false)) {
      List_push(methods, Parser_parse_assoc_type_decl(self, m_pub, __ring_ev_fail));
    } else {
      if (Parser_check(self, lexer$TokenKind_TkExtern)) {
        const m_start = Parser_current_span_start(self);
        Parser_expect(self, lexer$TokenKind_TkExtern, __ring_ev_fail);
        List_push(methods, Parser_parse_extern_fn_decl_body(self, m_pub, m_start, __ring_ev_fail));
      } else {
        List_push(methods, Parser_parse_fn_decl(self, m_pub, false, __ring_ev_fail));
      }
    }
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$Decl_Impl(target_type, type_params, trait_name, methods, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_use_decl(self, is_pub, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkUse, __ring_ev_fail);
  let segments = [];
  const path_start = Parser_current_span_start(self);
  if (Parser_check(self, lexer$TokenKind_TkSuper)) {
    List_push(segments, "super");
    const _ = Parser_advance(self);
  } else {
    if (((Parser_check(self, lexer$TokenKind_TkIdent) ? (Parser_peek(self).value === "self") : false) ? lexer$__TokenKind_Eq.eq(Parser_peek_at(self, 1).kind, lexer$TokenKind_TkColonColon) : false)) {
      List_push(segments, "self");
      const _ = Parser_advance(self);
    } else {
      List_push(segments, Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value);
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
      List_push(segments, Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value);
    }
  }
  const path_end = Parser_current_span_start(self);
  let path = new ast$UsePath(segments, Parser_make_span(self, path_start, path_end));
  let imports = ast$UseImport_Module;
  let alias = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkLBrace)) {
    Parser_advance(self);
    let names = [];
    while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
      const name_start = Parser_current_span_start(self);
      const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
      let name_alias = Option_none;
      if (Parser_try_consume(self, lexer$TokenKind_TkAs)) {
        name_alias = Option_some(Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value);
      }
      const name_end = Parser_current_span_start(self);
      List_push(names, new ast$NamedImport(name, name_alias, Parser_make_span(self, name_start, name_end)));
      if ((!Parser_try_consume(self, lexer$TokenKind_TkComma))) {
        break;
      }
    }
    Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
    imports = ast$UseImport_NamedItems(names);
  } else {
    if (Parser_check(self, lexer$TokenKind_TkAs)) {
      Parser_advance(self);
      alias = Option_some(Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value);
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
function Parser_parse_sig_block(self, is_pub, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkSig, __ring_ev_fail);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let members = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    const mstart = Parser_current_span_start(self);
    Parser_expect(self, lexer$TokenKind_TkFn, __ring_ev_fail);
    const mname = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
    const mtps = Parser_parse_type_params(self, __ring_ev_fail);
    Parser_expect(self, lexer$TokenKind_TkLParen, __ring_ev_fail);
    const mparams = Parser_parse_params(self, __ring_ev_fail);
    Parser_expect(self, lexer$TokenKind_TkRParen, __ring_ev_fail);
    let ret = Option_none;
    if (Parser_try_consume(self, lexer$TokenKind_TkArrow)) {
      ret = Option_some(Parser_parse_type_expr(self, __ring_ev_fail));
    }
    let meffects = [];
    if (Parser_try_consume(self, lexer$TokenKind_TkWith)) {
      Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
      while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
        const eff = Parser_parse_type_expr(self, __ring_ev_fail);
        List_push(meffects, eff);
        Parser_try_consume(self, lexer$TokenKind_TkComma);
      }
      Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
    }
    const mend = Parser_current_span_start(self);
    List_push(members, new ast$SigMember(mname, mtps, mparams, ret, meffects, Parser_make_span(self, mstart, mend)));
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$Decl_Sig(name, members, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_struct_decl(self, is_pub, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkStruct, __ring_ev_fail);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  const type_params = Parser_parse_type_params(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let fields = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    const field_start = Parser_current_span_start(self);
    const field_pub = Parser_try_consume(self, lexer$TokenKind_TkPub);
    const field_name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
    Parser_expect(self, lexer$TokenKind_TkColon, __ring_ev_fail);
    const type_annotation = Parser_parse_type_expr(self, __ring_ev_fail);
    if (Parser_check(self, lexer$TokenKind_TkWhere)) {
      const where_span = Parser_peek(self).span;
      diagnostics$CollectingSink_report(self.sink, diagnostics$make_diag(codes$W0002, diagnostics$Severity_SevWarning, "refinement 'where' clause is parsed but not enforced; it is a documentation-only annotation until refinement types are implemented", where_span, diagnostics$DiagnosticContext_OtherContext(Option_some("where clause parsed but not enforced"))));
      Parser_advance(self);
      let depth = 0;
      while ((!Parser_at_end(self))) {
        if (((depth === 0) ? (Parser_check(self, lexer$TokenKind_TkComma) ? true : Parser_check(self, lexer$TokenKind_TkRBrace)) : false)) {
          break;
        }
        if (((Parser_check(self, lexer$TokenKind_TkLParen) ? true : Parser_check(self, lexer$TokenKind_TkLBrace)) ? true : Parser_check(self, lexer$TokenKind_TkLBracket))) {
          depth = (depth + 1);
        }
        if (((Parser_check(self, lexer$TokenKind_TkRParen) ? true : Parser_check(self, lexer$TokenKind_TkRBrace)) ? true : Parser_check(self, lexer$TokenKind_TkRBracket))) {
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
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$Decl_Struct(name, type_params, fields, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_test_decl(self, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkTest, __ring_ev_fail);
  const desc_tok = Parser_expect(self, lexer$TokenKind_TkStringLit, __ring_ev_fail);
  const body = Parser_parse_block_expr(self, __ring_ev_fail);
  return ast$Decl_Test(desc_tok.value, body, Parser_make_span(self, start, expr_span(body).end));
}
function Parser_parse_trait_decl(self, is_pub, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkTrait, __ring_ev_fail);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  const type_params = Parser_parse_type_params(self, __ring_ev_fail);
  let supertraits = [];
  if (Parser_try_consume(self, lexer$TokenKind_TkColon)) {
    List_push(supertraits, Parser_parse_type_bound(self, __ring_ev_fail));
    while (Parser_check(self, lexer$TokenKind_TkPlus)) {
      Parser_advance(self);
      List_push(supertraits, Parser_parse_type_bound(self, __ring_ev_fail));
    }
  }
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let methods = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    const m_pub = Parser_try_consume(self, lexer$TokenKind_TkPub);
    if ((Parser_check(self, lexer$TokenKind_TkIdent) ? (Parser_peek(self).value === "type") : false)) {
      List_push(methods, Parser_parse_assoc_type_decl(self, m_pub, __ring_ev_fail));
    } else {
      List_push(methods, Parser_parse_fn_decl(self, m_pub, true, __ring_ev_fail));
    }
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$Decl_Trait(name, type_params, supertraits, methods, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_type_alias_decl(self, is_pub, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_advance(self);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  const type_params = Parser_parse_type_params(self, __ring_ev_fail);
  Parser_expect(self, lexer$TokenKind_TkEq, __ring_ev_fail);
  const type_expr = Parser_parse_type_expr(self, __ring_ev_fail);
  const end = Parser_current_span_start(self);
  return ast$Decl_TypeAlias(name, type_params, type_expr, is_pub, Parser_make_span(self, start, end));
}
function Parser_parse_mod_block(self, is_pub, __ring_ev_fail) {
  const start = Parser_current_span_start(self);
  Parser_expect(self, lexer$TokenKind_TkMod, __ring_ev_fail);
  const name = Parser_expect(self, lexer$TokenKind_TkIdent, __ring_ev_fail).value;
  let required_effects = Option_none;
  if (Parser_check(self, lexer$TokenKind_TkRequires)) {
    Parser_advance(self);
    required_effects = Option_some(Parser_parse_effect_list(self, __ring_ev_fail));
  }
  Parser_expect(self, lexer$TokenKind_TkLBrace, __ring_ev_fail);
  let uses = [];
  let decls = [];
  while (((!Parser_check(self, lexer$TokenKind_TkRBrace)) ? (!Parser_at_end(self)) : false)) {
    if (Parser_check(self, lexer$TokenKind_TkUse)) {
      const use_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_use_decl(self, false, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      __ring_match17: {
        const __ring_m17 = use_result;
        if (__ring_m17._tag === "some") {
          const ud = __ring_m17._0;
          List_push(uses, ud);
          break __ring_match17;
        }
        if (__ring_m17._tag === "none") {
          while ((!Parser_at_end(self))) {
            if (((is_decl_start(Parser_peek(self).kind) ? true : Parser_check(self, lexer$TokenKind_TkUse)) ? true : Parser_check(self, lexer$TokenKind_TkRBrace))) {
              break;
            }
            Parser_advance(self);
          }
          break __ring_match17;
        }
        __match_fail(__ring_m17);
      }
      continue;
    }
    const maybe_decl = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Parser_parse_decl(self, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    __ring_match18: {
      const __ring_m18 = maybe_decl;
      if (__ring_m18._tag === "some") {
        const decl = __ring_m18._0;
        List_push(decls, decl);
        break __ring_match18;
      }
      if (__ring_m18._tag === "none") {
        while ((!Parser_at_end(self))) {
          if ((is_decl_start(Parser_peek(self).kind) ? true : Parser_check(self, lexer$TokenKind_TkRBrace))) {
            break;
          }
          Parser_advance(self);
        }
        break __ring_match18;
      }
      __match_fail(__ring_m18);
    }
  }
  const rbrace = Parser_expect(self, lexer$TokenKind_TkRBrace, __ring_ev_fail);
  return ast$Decl_ModBlock(name, uses, decls, required_effects, is_pub, Parser_make_span(self, start, rbrace.span.end));
}
function Parser_parse_decl(self, __ring_ev_fail) {
  const is_pub = Parser_try_consume(self, lexer$TokenKind_TkPub);
  const tok = Parser_peek(self);
  __ring_match19: {
    const __ring_m19 = tok.kind;
    if (__ring_m19._tag === "TkMod") {
      return Option_some(Parser_parse_mod_block(self, is_pub, __ring_ev_fail));
      break __ring_match19;
    }
    if (__ring_m19._tag === "TkFn") {
      return Option_some(Parser_parse_fn_decl(self, is_pub, false, __ring_ev_fail));
      break __ring_match19;
    }
    if (__ring_m19._tag === "TkStruct") {
      return Option_some(Parser_parse_struct_decl(self, is_pub, __ring_ev_fail));
      break __ring_match19;
    }
    if (__ring_m19._tag === "TkEnum") {
      return Option_some(Parser_parse_enum_decl(self, is_pub, __ring_ev_fail));
      break __ring_match19;
    }
    if (__ring_m19._tag === "TkImpl") {
      return Option_some(Parser_parse_impl_decl(self, __ring_ev_fail));
      break __ring_match19;
    }
    if (__ring_m19._tag === "TkEffect") {
      return Option_some(Parser_parse_effect_decl(self, is_pub, __ring_ev_fail));
      break __ring_match19;
    }
    if (__ring_m19._tag === "TkTest") {
      return Option_some(Parser_parse_test_decl(self, __ring_ev_fail));
      break __ring_match19;
    }
    if (__ring_m19._tag === "TkTrait") {
      return Option_some(Parser_parse_trait_decl(self, is_pub, __ring_ev_fail));
      break __ring_match19;
    }
    if (__ring_m19._tag === "TkExtern") {
      return Option_some(Parser_parse_extern_decl(self, is_pub, __ring_ev_fail));
      break __ring_match19;
    }
    if (__ring_m19._tag === "TkConst") {
      return Option_some(Parser_parse_const_decl(self, is_pub, __ring_ev_fail));
      break __ring_match19;
    }
    if (__ring_m19._tag === "TkSig") {
      return Option_some(Parser_parse_sig_block(self, is_pub, __ring_ev_fail));
      break __ring_match19;
    }
    if (__ring_m19._tag === "TkIdent") {
      if ((tok.value === "type")) {
        return Option_some(Parser_parse_type_alias_decl(self, is_pub, __ring_ev_fail));
      }
      Parser_report_error(self, codes$E0101, `Expected declaration, got '${tok.value}' (${lexer$token_kind_value(tok.kind)})`, Option_some(tok.span), __ring_ev_fail);
      return Option_none;
      break __ring_match19;
    }
    Parser_report_error(self, codes$E0101, `Expected declaration, got '${tok.value}' (${lexer$token_kind_value(tok.kind)})`, Option_some(tok.span), __ring_ev_fail);
    return Option_none;
    break __ring_match19;
  }
}
function Parser_parse_program(self, __ring_ev_fail) {
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
        Parser_report_error(self, codes$E0706, "Use declaration must appear before other declarations", Option_some(Parser_peek(self).span), __ring_ev_fail);
      }
      const use_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_use_decl(self, false, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
      __ring_match20: {
        const __ring_m20 = use_result;
        if (__ring_m20._tag === "some") {
          const ud = __ring_m20._0;
          List_push(uses, ud);
          break __ring_match20;
        }
        if (__ring_m20._tag === "none") {
          while ((!Parser_at_end(self))) {
            if (is_decl_start(Parser_peek(self).kind)) {
              break;
            }
            Parser_advance(self);
          }
          break __ring_match20;
        }
        __match_fail(__ring_m20);
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
          Parser_report_error(self, codes$E0706, "Use declaration must appear before other declarations", Option_some(Option_unwrap_or(List_get(self.tokens, save_pos), Parser_peek(self)).span), __ring_ev_fail);
        }
        const pub_use_result = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Option_some(Parser_parse_use_decl(self, true, __ring_ev_fail)); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
        __ring_match21: {
          const __ring_m21 = pub_use_result;
          if (__ring_m21._tag === "some") {
            const ud = __ring_m21._0;
            List_push(uses, ud);
            break __ring_match21;
          }
          if (__ring_m21._tag === "none") {
            while ((!Parser_at_end(self))) {
              if (is_decl_start(Parser_peek(self).kind)) {
                break;
              }
              Parser_advance(self);
            }
            break __ring_match21;
          }
          __match_fail(__ring_m21);
        }
        continue;
      }
      self.pos = save_pos;
      self.error_count = save_errors;
      diagnostics$CollectingSink_restore(self.sink, sink_checkpoint);
    }
    decls_started = true;
    const maybe_decl = (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Parser_parse_decl(self, __ring_ev_fail); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { return Option_none; } else { throw __ring_e; } } throw __ring_e; } })();
    __ring_match22: {
      const __ring_m22 = maybe_decl;
      if (__ring_m22._tag === "some") {
        const decl = __ring_m22._0;
        List_push(decls, decl);
        break __ring_match22;
      }
      if (__ring_m22._tag === "none") {
        while ((!Parser_at_end(self))) {
          if (is_decl_start(Parser_peek(self).kind)) {
            break;
          }
          Parser_advance(self);
        }
        break __ring_match22;
      }
      __match_fail(__ring_m22);
    }
  }
  const end = Parser_current_span_start(self);
  return new ast$Program(uses, decls, Parser_make_span(self, start, end));
}

function dummy_expr() {
  return ast$Expr_BoolLit(false, ast$span_zero());
}

function dummy_type_expr() {
  return ast$TypeExpr_Named("", Option_none, [], ast$span_zero());
}

function expr_span(e) {
  __ring_match23: {
    const __ring_m23 = e;
    if (__ring_m23._tag === "IntLit") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "FloatLit") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "StrLit") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "BoolLit") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "Ident") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "BinOp") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "UnaryOp") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "Call") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "MethodCall") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "FieldAccess") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "StructLit") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "MatchExpr") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "Block") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "IfExpr") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "StringInterp") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "CatchExpr") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "HandleExpr") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "Lambda") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "Range") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "ListLit") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "TupleLit") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "IndexExpr") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    if (__ring_m23._tag === "ReturnExpr") {
      const span = __ring_m23.span;
      return span;
      break __ring_match23;
    }
    __match_fail(__ring_m23);
  }
}

function is_decl_start(k) {
  __ring_match24: {
    const __ring_m24 = k;
    if (__ring_m24._tag === "TkFn") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkStruct") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkEnum") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkEffect") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkTrait") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkImpl") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkExtern") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkUse") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkPub") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkTest") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkConst") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkMod") {
      return true;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TkSig") {
      return true;
      break __ring_match24;
    }
    return false;
    break __ring_match24;
  }
}

function type_expr_span(te) {
  __ring_match25: {
    const __ring_m25 = te;
    if (__ring_m25._tag === "Named") {
      const span = __ring_m25.span;
      return span;
      break __ring_match25;
    }
    if (__ring_m25._tag === "FnType") {
      const span = __ring_m25.span;
      return span;
      break __ring_match25;
    }
    if (__ring_m25._tag === "OptionType") {
      const span = __ring_m25.span;
      return span;
      break __ring_match25;
    }
    if (__ring_m25._tag === "RecordType") {
      const span = __ring_m25.span;
      return span;
      break __ring_match25;
    }
    if (__ring_m25._tag === "TupleType") {
      const span = __ring_m25.span;
      return span;
      break __ring_match25;
    }
    __match_fail(__ring_m25);
  }
}

function infix_precedence(kind) {
  __ring_match26: {
    const __ring_m26 = kind;
    if (__ring_m26._tag === "TkCatch") {
      return PREC_CATCH;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkPipePipe") {
      return PREC_LOGIC_OR;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkAmpAmp") {
      return PREC_LOGIC_AND;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkEqEq") {
      return PREC_EQUALITY;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkBangEq") {
      return PREC_EQUALITY;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkLt") {
      return PREC_COMPARE;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkGt") {
      return PREC_COMPARE;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkLtEq") {
      return PREC_COMPARE;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkGtEq") {
      return PREC_COMPARE;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkDotDot") {
      return PREC_RANGE;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkDotDotEq") {
      return PREC_RANGE;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkPlus") {
      return PREC_ADD_SUB;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkMinus") {
      return PREC_ADD_SUB;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkStar") {
      return PREC_MUL_DIV;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkSlash") {
      return PREC_MUL_DIV;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkPercent") {
      return PREC_MUL_DIV;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkDot") {
      return PREC_POSTFIX;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkLParen") {
      return PREC_POSTFIX;
      break __ring_match26;
    }
    if (__ring_m26._tag === "TkLBracket") {
      return PREC_POSTFIX;
      break __ring_match26;
    }
    return PREC_NONE;
    break __ring_match26;
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

function is_uppercase(ch) {
  const c = Option_unwrap_or(Str_char_code_at(ch, 0), 0);
  if ((c >= 65)) {
    return (c <= 90);
  } else {
    return false;
  }
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

function pattern_span(p) {
  __ring_match27: {
    const __ring_m27 = p;
    if (__ring_m27._tag === "Wildcard") {
      const span = __ring_m27.span;
      return span;
      break __ring_match27;
    }
    if (__ring_m27._tag === "Binding") {
      const span = __ring_m27.span;
      return span;
      break __ring_match27;
    }
    if (__ring_m27._tag === "Constructor") {
      const span = __ring_m27.span;
      return span;
      break __ring_match27;
    }
    if (__ring_m27._tag === "NamedConstructor") {
      const span = __ring_m27.span;
      return span;
      break __ring_match27;
    }
    if (__ring_m27._tag === "Literal") {
      const span = __ring_m27.span;
      return span;
      break __ring_match27;
    }
    if (__ring_m27._tag === "TuplePattern") {
      const span = __ring_m27.span;
      return span;
      break __ring_match27;
    }
    if (__ring_m27._tag === "OrPattern") {
      const span = __ring_m27.span;
      return span;
      break __ring_match27;
    }
    __match_fail(__ring_m27);
  }
}

function new_parser(tokens, file, sink) {
  return new Parser(tokens, 0, file, sink, 0);
}

function parse(source, file, sink, __ring_ev_fail) {
  let lexer = lexer$new_lexer(source, file, sink);
  const tokens = lexer$Lexer_tokenize(lexer);
  let parser = new_parser(tokens, file, sink);
  return Parser_parse_program(parser, __ring_ev_fail);
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

function __Parser_Clone_clone(self) {
  return new Parser(__List_Clone.clone(self.tokens, __Token_Clone), self.pos, self.file, __CollectingSink_Clone.clone(self.sink), self.error_count);
}
const __Parser_Clone = { clone: __Parser_Clone_clone };

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

function __Parser_Debug_debug(self) {
  return "Parser { " + "tokens: " + __List_Debug.debug(self.tokens, __Token_Debug) + ", " + "pos: " + String(self.pos) + ", " + "file: " + String(self.file) + ", " + "sink: " + __CollectingSink_Debug.debug(self.sink) + ", " + "error_count: " + String(self.error_count) + " }";
}
const __Parser_Debug = { debug: __Parser_Debug_debug };

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


export { PREC_NONE, PREC_CATCH, PREC_LOGIC_OR, PREC_LOGIC_AND, PREC_EQUALITY, PREC_COMPARE, PREC_RANGE, PREC_ADD_SUB, PREC_MUL_DIV, PREC_UNARY, PREC_POSTFIX, infix_precedence, type_expr_span, expr_span, pattern_span, Parser, new_parser, parse, Parser_peek, Parser_peek_at, Parser_advance, Parser_check, Parser_try_consume, Parser_expect, Parser_at_end, Parser_skip_to_recovery_point, Parser_current_span_start, Parser_make_span, Parser_report_error, Parser_error, Parser_parse_program, Parser_parse_stmt, Parser_parse_while_stmt, Parser_parse_loop_stmt, Parser_parse_for_in_stmt, Parser_parse_break_stmt, Parser_parse_continue_stmt, Parser_parse_if_let_stmt, Parser_parse_binding_stmt, Parser_parse_binding_body, Parser_parse_return_stmt, Parser_parse_return_expr, Parser_parse_block_expr, Parser_parse_use_decl, Parser_parse_mod_block, Parser_parse_decl, Parser_parse_effect_list, Parser_parse_effect_annotation, Parser_parse_fn_decl, Parser_parse_const_decl, Parser_parse_sig_block, Parser_parse_extern_decl, Parser_parse_extern_fn_decl_body, Parser_parse_extern_type_decl_body, Parser_parse_type_alias_decl, Parser_parse_struct_decl, Parser_parse_enum_decl, Parser_parse_impl_decl, Parser_parse_effect_alias_decl, Parser_parse_effect_decl, Parser_parse_test_decl, Parser_parse_assoc_type_decl, Parser_parse_trait_decl, Parser_parse_expr, Parser_parse_expr_no_struct, Parser_parse_expr_bp, Parser_parse_prefix, Parser_parse_dot_expr, Parser_parse_index_expr, Parser_parse_call_expr, Parser_parse_arg_list, Parser_parse_catch_expr, Parser_parse_string_interp, Parser_parse_if_expr, Parser_parse_match_expr, Parser_parse_match_arm, Parser_parse_pattern, Parser_parse_handle_expr, Parser_parse_effect_handler, Parser_parse_lambda_expr, Parser_parse_struct_literal, Parser_try_parse_type_args, Parser_parse_type_expr, Parser_parse_record_type_expr, Parser_parse_qualified_ident, Parser_validate_target_type_args, Parser_parse_type_params, Parser_parse_type_bound, Parser_parse_params, Parser_parse_param, __Parser_Clone, __Parser_Debug };