import { __EffectAbort, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_first, List_last, List_contains, List_is_empty, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_is_empty, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_is_empty, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { severity_to_str as diagnostics$severity_to_str, new_collecting_sink as diagnostics$new_collecting_sink, make_diagnostic as diagnostics$make_diagnostic, make_diag as diagnostics$make_diag, Severity_SevError as diagnostics$Severity_SevError, Severity_SevWarning as diagnostics$Severity_SevWarning, Severity_SevInfo as diagnostics$Severity_SevInfo, Severity_SevHint as diagnostics$Severity_SevHint, DiagnosticNote as diagnostics$DiagnosticNote, DiagnosticContext_TypeMismatch as diagnostics$DiagnosticContext_TypeMismatch, DiagnosticContext_UndefinedVariable as diagnostics$DiagnosticContext_UndefinedVariable, DiagnosticContext_MissingField as diagnostics$DiagnosticContext_MissingField, DiagnosticContext_EffectUnhandled as diagnostics$DiagnosticContext_EffectUnhandled, DiagnosticContext_ParseError as diagnostics$DiagnosticContext_ParseError, DiagnosticContext_PatternError as diagnostics$DiagnosticContext_PatternError, DiagnosticContext_TraitError as diagnostics$DiagnosticContext_TraitError, DiagnosticContext_OtherContext as diagnostics$DiagnosticContext_OtherContext, Suggestion as diagnostics$Suggestion, Diagnostic as diagnostics$Diagnostic, CollectingSink as diagnostics$CollectingSink, __CollectingSink_DiagnosticSink as diagnostics$__CollectingSink_DiagnosticSink, __DiagnosticNote_Eq as diagnostics$__DiagnosticNote_Eq, __Suggestion_Eq as diagnostics$__Suggestion_Eq, __Severity_Eq as diagnostics$__Severity_Eq, __DiagnosticNote_Clone as diagnostics$__DiagnosticNote_Clone, __Suggestion_Clone as diagnostics$__Suggestion_Clone, __Severity_Clone as diagnostics$__Severity_Clone, __DiagnosticContext_Clone as diagnostics$__DiagnosticContext_Clone, __Diagnostic_Clone as diagnostics$__Diagnostic_Clone, __CollectingSink_Clone as diagnostics$__CollectingSink_Clone, __Severity_Ord as diagnostics$__Severity_Ord, __DiagnosticNote_Debug as diagnostics$__DiagnosticNote_Debug, __Suggestion_Debug as diagnostics$__Suggestion_Debug, __Severity_Debug as diagnostics$__Severity_Debug, __DiagnosticContext_Debug as diagnostics$__DiagnosticContext_Debug, __Diagnostic_Debug as diagnostics$__Diagnostic_Debug, __CollectingSink_Debug as diagnostics$__CollectingSink_Debug, CollectingSink_report as diagnostics$CollectingSink_report, CollectingSink_has_errors as diagnostics$CollectingSink_has_errors, CollectingSink_diagnostics as diagnostics$CollectingSink_diagnostics, CollectingSink_clear as diagnostics$CollectingSink_clear, CollectingSink_save as diagnostics$CollectingSink_save, CollectingSink_restore as diagnostics$CollectingSink_restore } from "./diagnostics.js";
import { E0101 as codes$E0101, E0102 as codes$E0102, E0103 as codes$E0103, E0104 as codes$E0104, E0201 as codes$E0201, E0203 as codes$E0203, E0204 as codes$E0204, E0205 as codes$E0205, E0206 as codes$E0206, E0207 as codes$E0207, E0301 as codes$E0301, E0302 as codes$E0302, E0303 as codes$E0303, E0304 as codes$E0304, E0305 as codes$E0305, E0307 as codes$E0307, E0308 as codes$E0308, E0402 as codes$E0402, E0403 as codes$E0403, E0501 as codes$E0501, E0502 as codes$E0502, E0503 as codes$E0503, E0601 as codes$E0601, E0702 as codes$E0702, E0703 as codes$E0703, E0704 as codes$E0704, E0706 as codes$E0706, error_description as codes$error_description } from "./codes.js";

const TokenKind_TkFn = Object.freeze({ _tag: "TkFn" });
const TokenKind_TkLet = Object.freeze({ _tag: "TkLet" });
const TokenKind_TkVar = Object.freeze({ _tag: "TkVar" });
const TokenKind_TkStruct = Object.freeze({ _tag: "TkStruct" });
const TokenKind_TkEnum = Object.freeze({ _tag: "TkEnum" });
const TokenKind_TkMatch = Object.freeze({ _tag: "TkMatch" });
const TokenKind_TkImpl = Object.freeze({ _tag: "TkImpl" });
const TokenKind_TkEffect = Object.freeze({ _tag: "TkEffect" });
const TokenKind_TkHandle = Object.freeze({ _tag: "TkHandle" });
const TokenKind_TkWith = Object.freeze({ _tag: "TkWith" });
const TokenKind_TkIf = Object.freeze({ _tag: "TkIf" });
const TokenKind_TkElse = Object.freeze({ _tag: "TkElse" });
const TokenKind_TkCatch = Object.freeze({ _tag: "TkCatch" });
const TokenKind_TkTest = Object.freeze({ _tag: "TkTest" });
const TokenKind_TkReturn = Object.freeze({ _tag: "TkReturn" });
const TokenKind_TkFor = Object.freeze({ _tag: "TkFor" });
const TokenKind_TkIn = Object.freeze({ _tag: "TkIn" });
const TokenKind_TkPub = Object.freeze({ _tag: "TkPub" });
const TokenKind_TkWhere = Object.freeze({ _tag: "TkWhere" });
const TokenKind_TkTrue = Object.freeze({ _tag: "TkTrue" });
const TokenKind_TkFalse = Object.freeze({ _tag: "TkFalse" });
const TokenKind_TkTrait = Object.freeze({ _tag: "TkTrait" });
const TokenKind_TkTry = Object.freeze({ _tag: "TkTry" });
const TokenKind_TkWhile = Object.freeze({ _tag: "TkWhile" });
const TokenKind_TkBreak = Object.freeze({ _tag: "TkBreak" });
const TokenKind_TkContinue = Object.freeze({ _tag: "TkContinue" });
const TokenKind_TkUse = Object.freeze({ _tag: "TkUse" });
const TokenKind_TkAs = Object.freeze({ _tag: "TkAs" });
const TokenKind_TkExtern = Object.freeze({ _tag: "TkExtern" });
const TokenKind_TkIntLit = Object.freeze({ _tag: "TkIntLit" });
const TokenKind_TkFloatLit = Object.freeze({ _tag: "TkFloatLit" });
const TokenKind_TkStringLit = Object.freeze({ _tag: "TkStringLit" });
const TokenKind_TkStringInterpStart = Object.freeze({ _tag: "TkStringInterpStart" });
const TokenKind_TkStringInterpMiddle = Object.freeze({ _tag: "TkStringInterpMiddle" });
const TokenKind_TkStringInterpEnd = Object.freeze({ _tag: "TkStringInterpEnd" });
const TokenKind_TkRawStringLit = Object.freeze({ _tag: "TkRawStringLit" });
const TokenKind_TkIdent = Object.freeze({ _tag: "TkIdent" });
const TokenKind_TkPlus = Object.freeze({ _tag: "TkPlus" });
const TokenKind_TkMinus = Object.freeze({ _tag: "TkMinus" });
const TokenKind_TkStar = Object.freeze({ _tag: "TkStar" });
const TokenKind_TkSlash = Object.freeze({ _tag: "TkSlash" });
const TokenKind_TkPercent = Object.freeze({ _tag: "TkPercent" });
const TokenKind_TkEqEq = Object.freeze({ _tag: "TkEqEq" });
const TokenKind_TkBangEq = Object.freeze({ _tag: "TkBangEq" });
const TokenKind_TkLt = Object.freeze({ _tag: "TkLt" });
const TokenKind_TkGt = Object.freeze({ _tag: "TkGt" });
const TokenKind_TkLtEq = Object.freeze({ _tag: "TkLtEq" });
const TokenKind_TkGtEq = Object.freeze({ _tag: "TkGtEq" });
const TokenKind_TkAmpAmp = Object.freeze({ _tag: "TkAmpAmp" });
const TokenKind_TkPipePipe = Object.freeze({ _tag: "TkPipePipe" });
const TokenKind_TkBang = Object.freeze({ _tag: "TkBang" });
const TokenKind_TkEq = Object.freeze({ _tag: "TkEq" });
const TokenKind_TkPlusEq = Object.freeze({ _tag: "TkPlusEq" });
const TokenKind_TkMinusEq = Object.freeze({ _tag: "TkMinusEq" });
const TokenKind_TkLParen = Object.freeze({ _tag: "TkLParen" });
const TokenKind_TkRParen = Object.freeze({ _tag: "TkRParen" });
const TokenKind_TkLBrace = Object.freeze({ _tag: "TkLBrace" });
const TokenKind_TkRBrace = Object.freeze({ _tag: "TkRBrace" });
const TokenKind_TkLBracket = Object.freeze({ _tag: "TkLBracket" });
const TokenKind_TkRBracket = Object.freeze({ _tag: "TkRBracket" });
const TokenKind_TkComma = Object.freeze({ _tag: "TkComma" });
const TokenKind_TkColon = Object.freeze({ _tag: "TkColon" });
const TokenKind_TkColonColon = Object.freeze({ _tag: "TkColonColon" });
const TokenKind_TkDot = Object.freeze({ _tag: "TkDot" });
const TokenKind_TkDotDot = Object.freeze({ _tag: "TkDotDot" });
const TokenKind_TkDotDotEq = Object.freeze({ _tag: "TkDotDotEq" });
const TokenKind_TkFatArrow = Object.freeze({ _tag: "TkFatArrow" });
const TokenKind_TkArrow = Object.freeze({ _tag: "TkArrow" });
const TokenKind_TkQuestion = Object.freeze({ _tag: "TkQuestion" });
const TokenKind_TkSemi = Object.freeze({ _tag: "TkSemi" });
const TokenKind_TkEof = Object.freeze({ _tag: "TkEof" });
const TokenKind_TkError = Object.freeze({ _tag: "TkError" });

function token_kind_value(k) {
  __ring_match0: {
    const __ring_m0 = k;
    if (__ring_m0._tag === "TkFn") {
      return "fn";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkLet") {
      return "let";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkVar") {
      return "var";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkStruct") {
      return "struct";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkEnum") {
      return "enum";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkMatch") {
      return "match";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkImpl") {
      return "impl";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkEffect") {
      return "effect";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkHandle") {
      return "handle";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkWith") {
      return "with";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkIf") {
      return "if";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkElse") {
      return "else";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkCatch") {
      return "catch";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkTest") {
      return "test";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkReturn") {
      return "return";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkFor") {
      return "for";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkIn") {
      return "in";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkPub") {
      return "pub";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkWhere") {
      return "where";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkTrue") {
      return "true";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkFalse") {
      return "false";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkTrait") {
      return "trait";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkTry") {
      return "try";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkWhile") {
      return "while";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkBreak") {
      return "break";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkContinue") {
      return "continue";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkUse") {
      return "use";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkAs") {
      return "as";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkExtern") {
      return "extern";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkIntLit") {
      return "int_lit";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkFloatLit") {
      return "float_lit";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkStringLit") {
      return "string_lit";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkStringInterpStart") {
      return "string_interp_start";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkStringInterpMiddle") {
      return "string_interp_middle";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkStringInterpEnd") {
      return "string_interp_end";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkRawStringLit") {
      return "raw_string_lit";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkIdent") {
      return "ident";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkPlus") {
      return "+";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkMinus") {
      return "-";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkStar") {
      return "*";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkSlash") {
      return "/";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkPercent") {
      return "%";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkEqEq") {
      return "==";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkBangEq") {
      return "!=";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkLt") {
      return "<";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkGt") {
      return ">";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkLtEq") {
      return "<=";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkGtEq") {
      return ">=";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkAmpAmp") {
      return "&&";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkPipePipe") {
      return "||";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkBang") {
      return "!";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkEq") {
      return "=";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkPlusEq") {
      return "+=";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkMinusEq") {
      return "-=";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkLParen") {
      return "(";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkRParen") {
      return ")";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkLBrace") {
      return "{";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkRBrace") {
      return "}";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkLBracket") {
      return "[";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkRBracket") {
      return "]";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkComma") {
      return ",";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkColon") {
      return ":";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkColonColon") {
      return "::";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkDot") {
      return ".";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkDotDot") {
      return "..";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkDotDotEq") {
      return "..=";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkFatArrow") {
      return "=>";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkArrow") {
      return "->";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkQuestion") {
      return "?";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkSemi") {
      return ";";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkEof") {
      return "eof";
      break __ring_match0;
    }
    if (__ring_m0._tag === "TkError") {
      return "error_token";
      break __ring_match0;
    }
    __match_fail(__ring_m0);
  }
}

function keyword_lookup(word) {
  __ring_match1: {
    const __ring_m1 = word;
    if (__ring_m1 === "fn") {
      return Option_some(TokenKind_TkFn);
      break __ring_match1;
    }
    if (__ring_m1 === "let") {
      return Option_some(TokenKind_TkLet);
      break __ring_match1;
    }
    if (__ring_m1 === "var") {
      return Option_some(TokenKind_TkVar);
      break __ring_match1;
    }
    if (__ring_m1 === "struct") {
      return Option_some(TokenKind_TkStruct);
      break __ring_match1;
    }
    if (__ring_m1 === "enum") {
      return Option_some(TokenKind_TkEnum);
      break __ring_match1;
    }
    if (__ring_m1 === "match") {
      return Option_some(TokenKind_TkMatch);
      break __ring_match1;
    }
    if (__ring_m1 === "impl") {
      return Option_some(TokenKind_TkImpl);
      break __ring_match1;
    }
    if (__ring_m1 === "effect") {
      return Option_some(TokenKind_TkEffect);
      break __ring_match1;
    }
    if (__ring_m1 === "handle") {
      return Option_some(TokenKind_TkHandle);
      break __ring_match1;
    }
    if (__ring_m1 === "with") {
      return Option_some(TokenKind_TkWith);
      break __ring_match1;
    }
    if (__ring_m1 === "if") {
      return Option_some(TokenKind_TkIf);
      break __ring_match1;
    }
    if (__ring_m1 === "else") {
      return Option_some(TokenKind_TkElse);
      break __ring_match1;
    }
    if (__ring_m1 === "catch") {
      return Option_some(TokenKind_TkCatch);
      break __ring_match1;
    }
    if (__ring_m1 === "test") {
      return Option_some(TokenKind_TkTest);
      break __ring_match1;
    }
    if (__ring_m1 === "return") {
      return Option_some(TokenKind_TkReturn);
      break __ring_match1;
    }
    if (__ring_m1 === "for") {
      return Option_some(TokenKind_TkFor);
      break __ring_match1;
    }
    if (__ring_m1 === "in") {
      return Option_some(TokenKind_TkIn);
      break __ring_match1;
    }
    if (__ring_m1 === "pub") {
      return Option_some(TokenKind_TkPub);
      break __ring_match1;
    }
    if (__ring_m1 === "where") {
      return Option_some(TokenKind_TkWhere);
      break __ring_match1;
    }
    if (__ring_m1 === "true") {
      return Option_some(TokenKind_TkTrue);
      break __ring_match1;
    }
    if (__ring_m1 === "false") {
      return Option_some(TokenKind_TkFalse);
      break __ring_match1;
    }
    if (__ring_m1 === "trait") {
      return Option_some(TokenKind_TkTrait);
      break __ring_match1;
    }
    if (__ring_m1 === "try") {
      return Option_some(TokenKind_TkTry);
      break __ring_match1;
    }
    if (__ring_m1 === "while") {
      return Option_some(TokenKind_TkWhile);
      break __ring_match1;
    }
    if (__ring_m1 === "break") {
      return Option_some(TokenKind_TkBreak);
      break __ring_match1;
    }
    if (__ring_m1 === "continue") {
      return Option_some(TokenKind_TkContinue);
      break __ring_match1;
    }
    if (__ring_m1 === "use") {
      return Option_some(TokenKind_TkUse);
      break __ring_match1;
    }
    if (__ring_m1 === "as") {
      return Option_some(TokenKind_TkAs);
      break __ring_match1;
    }
    if (__ring_m1 === "extern") {
      return Option_some(TokenKind_TkExtern);
      break __ring_match1;
    }
    return Option_none;
    break __ring_match1;
  }
}

class Token {
  constructor(kind, value, span) {
    this.kind = kind;
    this.value = value;
    this.span = span;
  }
}

function code_in_range(c, low, high) {
  if (((c >= low) && (c <= high))) {
    return true;
  } else {
    return false;
  }
}

function is_digit(ch) {
  return code_in_range(Option_unwrap_or(Str_char_code_at(ch, 0), 0), 48, 57);
}

function is_ident_start(ch) {
  const c = Option_unwrap_or(Str_char_code_at(ch, 0), 0);
  if (code_in_range(c, 97, 122)) {
    return true;
  } else {
    if (code_in_range(c, 65, 90)) {
      return true;
    } else {
      return (c === 95);
    }
  }
}

function is_ident_continue(ch) {
  if (is_ident_start(ch)) {
    return true;
  } else {
    return is_digit(ch);
  }
}

class Lexer {
  constructor(source, file, pos, line, column, sink, interp_brace_depth) {
    this.source = source;
    this.file = file;
    this.pos = pos;
    this.line = line;
    this.column = column;
    this.sink = sink;
    this.interp_brace_depth = interp_brace_depth;
  }
}

function new_lexer(source, file, sink) {
  return new Lexer(source, file, 0, 1, 0, sink, []);
}

function Lexer_tokenize(self) {
  let tokens = [];
  while (true) {
    const tok = Lexer_next_token(self);
    const is_eof = (function() {
  const __ring_m = tok.kind;
  if (__ring_m._tag === "TkEof") { return true; }
  return false;
})();
    List_push(tokens, tok);
    if (is_eof) {
      break;
    }
  }
  return tokens;
}
function Lexer_next_token(self) {
  Lexer_skip_whitespace_and_comments(self);
  if ((self.pos >= Str_len(self.source))) {
    return Lexer_make_token(self, TokenKind_TkEof, "", Lexer_current_position(self), Lexer_current_position(self));
  }
  if ((List_len(self.interp_brace_depth) > 0)) {
    const top = Option_unwrap_or(List_last(self.interp_brace_depth), 0);
    if (((top === 0) && (Lexer_peek(self) === "}"))) {
      Lexer_advance(self);
      return Lexer_lex_string_continuation(self);
    }
  }
  const start = Lexer_current_position(self);
  const ch = Lexer_peek(self);
  if ((((ch === "r") && ((self.pos + 1) < Str_len(self.source))) && (Option_unwrap_or(Str_char_at(self.source, (self.pos + 1)), "") === "#"))) {
    return Lexer_lex_raw_string(self, start);
  }
  if ((ch === "\"")) {
    return Lexer_lex_string(self, start);
  }
  if (is_digit(ch)) {
    return Lexer_lex_number(self, start);
  }
  if (is_ident_start(ch)) {
    return Lexer_lex_ident(self, start);
  }
  return Lexer_lex_punctuation(self, start);
}
function Lexer_lex_string(self, start) {
  Lexer_advance(self);
  return Lexer_lex_string_body(self, start, true);
}
function Lexer_lex_string_continuation(self) {
  const start = Lexer_current_position(self);
  return Lexer_lex_string_body(self, start, false);
}
function Lexer_lex_string_body(self, start, is_new) {
  let value = "";
  while ((self.pos < Str_len(self.source))) {
    const ch = Lexer_peek(self);
    if ((ch === "\"")) {
      Lexer_advance(self);
      const end = Lexer_current_position(self);
      if (is_new) {
        return Lexer_make_token(self, TokenKind_TkStringLit, value, start, end);
      } else {
        List_pop(self.interp_brace_depth);
        return Lexer_make_token(self, TokenKind_TkStringInterpEnd, value, start, end);
      }
    }
    if ((((ch === "$") && ((self.pos + 1) < Str_len(self.source))) && (Option_unwrap_or(Str_char_at(self.source, (self.pos + 1)), "") === "{"))) {
      Lexer_advance(self);
      Lexer_advance(self);
      const end = Lexer_current_position(self);
      if (is_new) {
        List_push(self.interp_brace_depth, 0);
        return Lexer_make_token(self, TokenKind_TkStringInterpStart, value, start, end);
      } else {
        Lexer_reset_last_depth(self);
        return Lexer_make_token(self, TokenKind_TkStringInterpMiddle, value, start, end);
      }
    }
    if ((ch === "\\")) {
      Lexer_advance(self);
      if ((self.pos >= Str_len(self.source))) {
        value = `${value}\\`;
        break;
      }
      const esc = Lexer_peek(self);
      Lexer_advance(self);
      if ((esc === "n")) {
        value = `${value}
`;
      } else {
        if ((esc === "t")) {
          value = `${value}	`;
        } else {
          if ((esc === "r")) {
            value = `${value}\r`;
          } else {
            if ((esc === "\\")) {
              value = `${value}\\`;
            } else {
              if ((esc === "\"")) {
                value = `${value}"`;
              } else {
                if ((esc === "$")) {
                  value = `${value}$`;
                } else {
                  value = `${value}${esc}`;
                }
              }
            }
          }
        }
      }
    } else {
      value = `${value}${ch}`;
      Lexer_advance(self);
    }
  }
  const end = Lexer_current_position(self);
  const span = new ast$Span(self.file, start, end);
  diagnostics$CollectingSink_report(self.sink, diagnostics$make_diag(codes$E0102(), diagnostics$Severity_SevError, "Unterminated string literal", span, diagnostics$DiagnosticContext_ParseError(value, Option_none)));
  return Lexer_make_token(self, TokenKind_TkError, value, start, end);
}
function Lexer_lex_raw_string(self, start) {
  Lexer_advance(self);
  if ((Lexer_peek(self) !== "#")) {
    const end = Lexer_current_position(self);
    return Lexer_make_token(self, TokenKind_TkIdent, "r", start, end);
  }
  Lexer_advance(self);
  if ((Lexer_peek(self) !== "\"")) {
    self.pos = (self.pos - 1);
    self.column = (self.column - 1);
    const end = Lexer_current_position(self);
    return Lexer_make_token(self, TokenKind_TkIdent, "r", start, end);
  }
  Lexer_advance(self);
  let value = "";
  while ((self.pos < Str_len(self.source))) {
    const ch = Lexer_peek(self);
    if ((((ch === "\"") && ((self.pos + 1) < Str_len(self.source))) && (Option_unwrap_or(Str_char_at(self.source, (self.pos + 1)), "") === "#"))) {
      Lexer_advance(self);
      Lexer_advance(self);
      const end = Lexer_current_position(self);
      return Lexer_make_token(self, TokenKind_TkRawStringLit, value, start, end);
    }
    value = `${value}${ch}`;
    Lexer_advance(self);
  }
  const span = new ast$Span(self.file, start, Lexer_current_position(self));
  diagnostics$CollectingSink_report(self.sink, diagnostics$make_diag(codes$E0102(), diagnostics$Severity_SevError, "Unterminated raw string literal", span, diagnostics$DiagnosticContext_ParseError(value, Option_none)));
  const end = Lexer_current_position(self);
  return Lexer_make_token(self, TokenKind_TkError, value, start, end);
}
function Lexer_lex_number(self, start) {
  let value = "";
  let is_float = false;
  while (((self.pos < Str_len(self.source)) && is_digit(Lexer_peek(self)))) {
    value = `${value}${Lexer_peek(self)}`;
    Lexer_advance(self);
  }
  if (((((self.pos < Str_len(self.source)) && (Lexer_peek(self) === ".")) && ((self.pos + 1) < Str_len(self.source))) && is_digit(Option_unwrap_or(Str_char_at(self.source, (self.pos + 1)), "")))) {
    is_float = true;
    value = `${value}.`;
    Lexer_advance(self);
    while (((self.pos < Str_len(self.source)) && is_digit(Lexer_peek(self)))) {
      value = `${value}${Lexer_peek(self)}`;
      Lexer_advance(self);
    }
  }
  const end = Lexer_current_position(self);
  if (is_float) {
    return Lexer_make_token(self, TokenKind_TkFloatLit, value, start, end);
  } else {
    return Lexer_make_token(self, TokenKind_TkIntLit, value, start, end);
  }
}
function Lexer_lex_ident(self, start) {
  let value = "";
  while (((self.pos < Str_len(self.source)) && is_ident_continue(Lexer_peek(self)))) {
    value = `${value}${Lexer_peek(self)}`;
    Lexer_advance(self);
  }
  const end = Lexer_current_position(self);
  const kind = Option_unwrap_or(keyword_lookup(value), TokenKind_TkIdent);
  return Lexer_make_token(self, kind, value, start, end);
}
function Lexer_lex_punctuation(self, start) {
  const ch = Lexer_peek(self);
  Lexer_advance(self);
  if ((ch === "(")) {
    return Lexer_make_token(self, TokenKind_TkLParen, "(", start, Lexer_current_position(self));
  }
  if ((ch === ")")) {
    return Lexer_make_token(self, TokenKind_TkRParen, ")", start, Lexer_current_position(self));
  }
  if ((ch === "{")) {
    if ((List_len(self.interp_brace_depth) > 0)) {
      Lexer_inc_last_depth(self);
    }
    return Lexer_make_token(self, TokenKind_TkLBrace, "{", start, Lexer_current_position(self));
  }
  if ((ch === "}")) {
    if ((List_len(self.interp_brace_depth) > 0)) {
      Lexer_dec_last_depth(self);
    }
    return Lexer_make_token(self, TokenKind_TkRBrace, "}", start, Lexer_current_position(self));
  }
  if ((ch === "[")) {
    return Lexer_make_token(self, TokenKind_TkLBracket, "[", start, Lexer_current_position(self));
  }
  if ((ch === "]")) {
    return Lexer_make_token(self, TokenKind_TkRBracket, "]", start, Lexer_current_position(self));
  }
  if ((ch === ",")) {
    return Lexer_make_token(self, TokenKind_TkComma, ",", start, Lexer_current_position(self));
  }
  if ((ch === ":")) {
    if ((Lexer_peek(self) === ":")) {
      Lexer_advance(self);
      return Lexer_make_token(self, TokenKind_TkColonColon, "::", start, Lexer_current_position(self));
    }
    return Lexer_make_token(self, TokenKind_TkColon, ":", start, Lexer_current_position(self));
  }
  if ((ch === ";")) {
    return Lexer_make_token(self, TokenKind_TkSemi, ";", start, Lexer_current_position(self));
  }
  if ((ch === "?")) {
    return Lexer_make_token(self, TokenKind_TkQuestion, "?", start, Lexer_current_position(self));
  }
  if ((ch === ".")) {
    if ((Lexer_peek(self) === ".")) {
      Lexer_advance(self);
      if ((Lexer_peek(self) === "=")) {
        Lexer_advance(self);
        return Lexer_make_token(self, TokenKind_TkDotDotEq, "..=", start, Lexer_current_position(self));
      }
      return Lexer_make_token(self, TokenKind_TkDotDot, "..", start, Lexer_current_position(self));
    }
    return Lexer_make_token(self, TokenKind_TkDot, ".", start, Lexer_current_position(self));
  }
  if ((ch === "+")) {
    if ((Lexer_peek(self) === "=")) {
      Lexer_advance(self);
      return Lexer_make_token(self, TokenKind_TkPlusEq, "+=", start, Lexer_current_position(self));
    }
    return Lexer_make_token(self, TokenKind_TkPlus, "+", start, Lexer_current_position(self));
  }
  if ((ch === "-")) {
    if ((Lexer_peek(self) === ">")) {
      Lexer_advance(self);
      return Lexer_make_token(self, TokenKind_TkArrow, "->", start, Lexer_current_position(self));
    }
    if ((Lexer_peek(self) === "=")) {
      Lexer_advance(self);
      return Lexer_make_token(self, TokenKind_TkMinusEq, "-=", start, Lexer_current_position(self));
    }
    return Lexer_make_token(self, TokenKind_TkMinus, "-", start, Lexer_current_position(self));
  }
  if ((ch === "*")) {
    return Lexer_make_token(self, TokenKind_TkStar, "*", start, Lexer_current_position(self));
  }
  if ((ch === "/")) {
    return Lexer_make_token(self, TokenKind_TkSlash, "/", start, Lexer_current_position(self));
  }
  if ((ch === "%")) {
    return Lexer_make_token(self, TokenKind_TkPercent, "%", start, Lexer_current_position(self));
  }
  if ((ch === "=")) {
    if ((Lexer_peek(self) === "=")) {
      Lexer_advance(self);
      return Lexer_make_token(self, TokenKind_TkEqEq, "==", start, Lexer_current_position(self));
    }
    if ((Lexer_peek(self) === ">")) {
      Lexer_advance(self);
      return Lexer_make_token(self, TokenKind_TkFatArrow, "=>", start, Lexer_current_position(self));
    }
    return Lexer_make_token(self, TokenKind_TkEq, "=", start, Lexer_current_position(self));
  }
  if ((ch === "!")) {
    if ((Lexer_peek(self) === "=")) {
      Lexer_advance(self);
      return Lexer_make_token(self, TokenKind_TkBangEq, "!=", start, Lexer_current_position(self));
    }
    return Lexer_make_token(self, TokenKind_TkBang, "!", start, Lexer_current_position(self));
  }
  if ((ch === "<")) {
    if ((Lexer_peek(self) === "=")) {
      Lexer_advance(self);
      return Lexer_make_token(self, TokenKind_TkLtEq, "<=", start, Lexer_current_position(self));
    }
    return Lexer_make_token(self, TokenKind_TkLt, "<", start, Lexer_current_position(self));
  }
  if ((ch === ">")) {
    if ((Lexer_peek(self) === "=")) {
      Lexer_advance(self);
      return Lexer_make_token(self, TokenKind_TkGtEq, ">=", start, Lexer_current_position(self));
    }
    return Lexer_make_token(self, TokenKind_TkGt, ">", start, Lexer_current_position(self));
  }
  if ((ch === "&")) {
    if ((Lexer_peek(self) === "&")) {
      Lexer_advance(self);
      return Lexer_make_token(self, TokenKind_TkAmpAmp, "&&", start, Lexer_current_position(self));
    }
    const tok = Lexer_make_token(self, TokenKind_TkError, "&", start, Lexer_current_position(self));
    diagnostics$CollectingSink_report(self.sink, diagnostics$make_diag(codes$E0101(), diagnostics$Severity_SevError, "Unexpected character '&' (use '&&' for logical AND)", tok.span, diagnostics$DiagnosticContext_ParseError("&", Option_none)));
    return tok;
  }
  if ((ch === "|")) {
    if ((Lexer_peek(self) === "|")) {
      Lexer_advance(self);
      return Lexer_make_token(self, TokenKind_TkPipePipe, "||", start, Lexer_current_position(self));
    }
    const tok = Lexer_make_token(self, TokenKind_TkError, "|", start, Lexer_current_position(self));
    diagnostics$CollectingSink_report(self.sink, diagnostics$make_diag(codes$E0101(), diagnostics$Severity_SevError, "Unexpected character '|' (use '||' for logical OR)", tok.span, diagnostics$DiagnosticContext_ParseError("|", Option_none)));
    return tok;
  }
  const tok = Lexer_make_token(self, TokenKind_TkError, ch, start, Lexer_current_position(self));
  diagnostics$CollectingSink_report(self.sink, diagnostics$make_diag(codes$E0101(), diagnostics$Severity_SevError, `Unexpected character '${ch}'`, tok.span, diagnostics$DiagnosticContext_ParseError(ch, Option_none)));
  return tok;
}
function Lexer_skip_whitespace_and_comments(self) {
  while ((self.pos < Str_len(self.source))) {
    const ch = Lexer_peek(self);
    if ((((ch === " ") || (ch === "\t")) || (ch === "\r"))) {
      Lexer_advance(self);
    } else {
      if ((ch === "\n")) {
        Lexer_advance(self);
      } else {
        if ((((ch === "/") && ((self.pos + 1) < Str_len(self.source))) && (Option_unwrap_or(Str_char_at(self.source, (self.pos + 1)), "") === "/"))) {
          while (((self.pos < Str_len(self.source)) && (Lexer_peek(self) !== "\n"))) {
            Lexer_advance(self);
          }
        } else {
          break;
        }
      }
    }
  }
}
function Lexer_peek(self) {
  return Option_unwrap_or(Str_char_at(self.source, self.pos), "");
}
function Lexer_advance(self) {
  if ((self.pos < Str_len(self.source))) {
    if ((Option_unwrap_or(Str_char_at(self.source, self.pos), "") === "\n")) {
      self.line = (self.line + 1);
      self.column = 0;
    } else {
      self.column = (self.column + 1);
    }
    self.pos = (self.pos + 1);
  }
}
function Lexer_current_position(self) {
  return new ast$Position(self.line, self.column, self.pos);
}
function Lexer_make_token(self, kind, value, start, end) {
  return new Token(kind, value, new ast$Span(self.file, start, end));
}
function Lexer_inc_last_depth(self) {
  const val = Option_unwrap_or(List_pop(self.interp_brace_depth), 0);
  return List_push(self.interp_brace_depth, (val + 1));
}
function Lexer_dec_last_depth(self) {
  const val = Option_unwrap_or(List_pop(self.interp_brace_depth), 0);
  return List_push(self.interp_brace_depth, (val - 1));
}
function Lexer_reset_last_depth(self) {
  List_pop(self.interp_brace_depth);
  return List_push(self.interp_brace_depth, 0);
}

function __TokenKind_Eq_eq(self, other) {
  if (self._tag !== other._tag) return false;
  return true;
}
const __TokenKind_Eq = { eq: __TokenKind_Eq_eq, ne: function(self, other) { return !__TokenKind_Eq_eq(self, other); } };

function __Token_Eq_eq(self, other) {
  return __TokenKind_Eq.eq(self.kind, other.kind) && (self.value === other.value) && __Span_Eq.eq(self.span, other.span);
}
const __Token_Eq = { eq: __Token_Eq_eq, ne: function(self, other) { return !__Token_Eq_eq(self, other); } };

function __Lexer_Clone_clone(self) {
  return new Lexer(self.source, self.file, self.pos, self.line, self.column, __CollectingSink_Clone.clone(self.sink), __List_Clone.clone(self.interp_brace_depth, __Int_Clone));
}
const __Lexer_Clone = { clone: __Lexer_Clone_clone };

function __TokenKind_Clone_clone(self) {
  switch (self._tag) {
    case "TkFn": return TokenKind_TkFn;
    case "TkLet": return TokenKind_TkLet;
    case "TkVar": return TokenKind_TkVar;
    case "TkStruct": return TokenKind_TkStruct;
    case "TkEnum": return TokenKind_TkEnum;
    case "TkMatch": return TokenKind_TkMatch;
    case "TkImpl": return TokenKind_TkImpl;
    case "TkEffect": return TokenKind_TkEffect;
    case "TkHandle": return TokenKind_TkHandle;
    case "TkWith": return TokenKind_TkWith;
    case "TkIf": return TokenKind_TkIf;
    case "TkElse": return TokenKind_TkElse;
    case "TkCatch": return TokenKind_TkCatch;
    case "TkTest": return TokenKind_TkTest;
    case "TkReturn": return TokenKind_TkReturn;
    case "TkFor": return TokenKind_TkFor;
    case "TkIn": return TokenKind_TkIn;
    case "TkPub": return TokenKind_TkPub;
    case "TkWhere": return TokenKind_TkWhere;
    case "TkTrue": return TokenKind_TkTrue;
    case "TkFalse": return TokenKind_TkFalse;
    case "TkTrait": return TokenKind_TkTrait;
    case "TkTry": return TokenKind_TkTry;
    case "TkWhile": return TokenKind_TkWhile;
    case "TkBreak": return TokenKind_TkBreak;
    case "TkContinue": return TokenKind_TkContinue;
    case "TkUse": return TokenKind_TkUse;
    case "TkAs": return TokenKind_TkAs;
    case "TkExtern": return TokenKind_TkExtern;
    case "TkIntLit": return TokenKind_TkIntLit;
    case "TkFloatLit": return TokenKind_TkFloatLit;
    case "TkStringLit": return TokenKind_TkStringLit;
    case "TkStringInterpStart": return TokenKind_TkStringInterpStart;
    case "TkStringInterpMiddle": return TokenKind_TkStringInterpMiddle;
    case "TkStringInterpEnd": return TokenKind_TkStringInterpEnd;
    case "TkRawStringLit": return TokenKind_TkRawStringLit;
    case "TkIdent": return TokenKind_TkIdent;
    case "TkPlus": return TokenKind_TkPlus;
    case "TkMinus": return TokenKind_TkMinus;
    case "TkStar": return TokenKind_TkStar;
    case "TkSlash": return TokenKind_TkSlash;
    case "TkPercent": return TokenKind_TkPercent;
    case "TkEqEq": return TokenKind_TkEqEq;
    case "TkBangEq": return TokenKind_TkBangEq;
    case "TkLt": return TokenKind_TkLt;
    case "TkGt": return TokenKind_TkGt;
    case "TkLtEq": return TokenKind_TkLtEq;
    case "TkGtEq": return TokenKind_TkGtEq;
    case "TkAmpAmp": return TokenKind_TkAmpAmp;
    case "TkPipePipe": return TokenKind_TkPipePipe;
    case "TkBang": return TokenKind_TkBang;
    case "TkEq": return TokenKind_TkEq;
    case "TkPlusEq": return TokenKind_TkPlusEq;
    case "TkMinusEq": return TokenKind_TkMinusEq;
    case "TkLParen": return TokenKind_TkLParen;
    case "TkRParen": return TokenKind_TkRParen;
    case "TkLBrace": return TokenKind_TkLBrace;
    case "TkRBrace": return TokenKind_TkRBrace;
    case "TkLBracket": return TokenKind_TkLBracket;
    case "TkRBracket": return TokenKind_TkRBracket;
    case "TkComma": return TokenKind_TkComma;
    case "TkColon": return TokenKind_TkColon;
    case "TkColonColon": return TokenKind_TkColonColon;
    case "TkDot": return TokenKind_TkDot;
    case "TkDotDot": return TokenKind_TkDotDot;
    case "TkDotDotEq": return TokenKind_TkDotDotEq;
    case "TkFatArrow": return TokenKind_TkFatArrow;
    case "TkArrow": return TokenKind_TkArrow;
    case "TkQuestion": return TokenKind_TkQuestion;
    case "TkSemi": return TokenKind_TkSemi;
    case "TkEof": return TokenKind_TkEof;
    case "TkError": return TokenKind_TkError;
    default: return self;
  }
}
const __TokenKind_Clone = { clone: __TokenKind_Clone_clone };

function __Token_Clone_clone(self) {
  return new Token(__TokenKind_Clone.clone(self.kind), self.value, __Span_Clone.clone(self.span));
}
const __Token_Clone = { clone: __Token_Clone_clone };

const __TokenKind_tag_order = { "TkFn": 0, "TkLet": 1, "TkVar": 2, "TkStruct": 3, "TkEnum": 4, "TkMatch": 5, "TkImpl": 6, "TkEffect": 7, "TkHandle": 8, "TkWith": 9, "TkIf": 10, "TkElse": 11, "TkCatch": 12, "TkTest": 13, "TkReturn": 14, "TkFor": 15, "TkIn": 16, "TkPub": 17, "TkWhere": 18, "TkTrue": 19, "TkFalse": 20, "TkTrait": 21, "TkTry": 22, "TkWhile": 23, "TkBreak": 24, "TkContinue": 25, "TkUse": 26, "TkAs": 27, "TkExtern": 28, "TkIntLit": 29, "TkFloatLit": 30, "TkStringLit": 31, "TkStringInterpStart": 32, "TkStringInterpMiddle": 33, "TkStringInterpEnd": 34, "TkRawStringLit": 35, "TkIdent": 36, "TkPlus": 37, "TkMinus": 38, "TkStar": 39, "TkSlash": 40, "TkPercent": 41, "TkEqEq": 42, "TkBangEq": 43, "TkLt": 44, "TkGt": 45, "TkLtEq": 46, "TkGtEq": 47, "TkAmpAmp": 48, "TkPipePipe": 49, "TkBang": 50, "TkEq": 51, "TkPlusEq": 52, "TkMinusEq": 53, "TkLParen": 54, "TkRParen": 55, "TkLBrace": 56, "TkRBrace": 57, "TkLBracket": 58, "TkRBracket": 59, "TkComma": 60, "TkColon": 61, "TkColonColon": 62, "TkDot": 63, "TkDotDot": 64, "TkDotDotEq": 65, "TkFatArrow": 66, "TkArrow": 67, "TkQuestion": 68, "TkSemi": 69, "TkEof": 70, "TkError": 71 };
function __TokenKind_Ord_cmp(self, other) {
  var t1 = __TokenKind_tag_order[self._tag];
  var t2 = __TokenKind_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  return 0;
}
const __TokenKind_Ord = { cmp: __TokenKind_Ord_cmp };

function __Token_Ord_cmp(self, other) {
  var c;
  c = __TokenKind_Ord.cmp(self.kind, other.kind);
  if (c !== 0) return c;
  c = (self.value < other.value ? -1 : self.value > other.value ? 1 : 0);
  if (c !== 0) return c;
  return __Span_Ord.cmp(self.span, other.span);
}
const __Token_Ord = { cmp: __Token_Ord_cmp };

function __Lexer_Debug_debug(self) {
  return "Lexer { " + "source: " + String(self.source) + ", " + "file: " + String(self.file) + ", " + "pos: " + String(self.pos) + ", " + "line: " + String(self.line) + ", " + "column: " + String(self.column) + ", " + "sink: " + __CollectingSink_Debug.debug(self.sink) + ", " + "interp_brace_depth: " + __List_Debug.debug(self.interp_brace_depth, __Int_Debug) + " }";
}
const __Lexer_Debug = { debug: __Lexer_Debug_debug };

function __TokenKind_Debug_debug(self) {
  switch (self._tag) {
    case "TkFn": return "TkFn";
    case "TkLet": return "TkLet";
    case "TkVar": return "TkVar";
    case "TkStruct": return "TkStruct";
    case "TkEnum": return "TkEnum";
    case "TkMatch": return "TkMatch";
    case "TkImpl": return "TkImpl";
    case "TkEffect": return "TkEffect";
    case "TkHandle": return "TkHandle";
    case "TkWith": return "TkWith";
    case "TkIf": return "TkIf";
    case "TkElse": return "TkElse";
    case "TkCatch": return "TkCatch";
    case "TkTest": return "TkTest";
    case "TkReturn": return "TkReturn";
    case "TkFor": return "TkFor";
    case "TkIn": return "TkIn";
    case "TkPub": return "TkPub";
    case "TkWhere": return "TkWhere";
    case "TkTrue": return "TkTrue";
    case "TkFalse": return "TkFalse";
    case "TkTrait": return "TkTrait";
    case "TkTry": return "TkTry";
    case "TkWhile": return "TkWhile";
    case "TkBreak": return "TkBreak";
    case "TkContinue": return "TkContinue";
    case "TkUse": return "TkUse";
    case "TkAs": return "TkAs";
    case "TkExtern": return "TkExtern";
    case "TkIntLit": return "TkIntLit";
    case "TkFloatLit": return "TkFloatLit";
    case "TkStringLit": return "TkStringLit";
    case "TkStringInterpStart": return "TkStringInterpStart";
    case "TkStringInterpMiddle": return "TkStringInterpMiddle";
    case "TkStringInterpEnd": return "TkStringInterpEnd";
    case "TkRawStringLit": return "TkRawStringLit";
    case "TkIdent": return "TkIdent";
    case "TkPlus": return "TkPlus";
    case "TkMinus": return "TkMinus";
    case "TkStar": return "TkStar";
    case "TkSlash": return "TkSlash";
    case "TkPercent": return "TkPercent";
    case "TkEqEq": return "TkEqEq";
    case "TkBangEq": return "TkBangEq";
    case "TkLt": return "TkLt";
    case "TkGt": return "TkGt";
    case "TkLtEq": return "TkLtEq";
    case "TkGtEq": return "TkGtEq";
    case "TkAmpAmp": return "TkAmpAmp";
    case "TkPipePipe": return "TkPipePipe";
    case "TkBang": return "TkBang";
    case "TkEq": return "TkEq";
    case "TkPlusEq": return "TkPlusEq";
    case "TkMinusEq": return "TkMinusEq";
    case "TkLParen": return "TkLParen";
    case "TkRParen": return "TkRParen";
    case "TkLBrace": return "TkLBrace";
    case "TkRBrace": return "TkRBrace";
    case "TkLBracket": return "TkLBracket";
    case "TkRBracket": return "TkRBracket";
    case "TkComma": return "TkComma";
    case "TkColon": return "TkColon";
    case "TkColonColon": return "TkColonColon";
    case "TkDot": return "TkDot";
    case "TkDotDot": return "TkDotDot";
    case "TkDotDotEq": return "TkDotDotEq";
    case "TkFatArrow": return "TkFatArrow";
    case "TkArrow": return "TkArrow";
    case "TkQuestion": return "TkQuestion";
    case "TkSemi": return "TkSemi";
    case "TkEof": return "TkEof";
    case "TkError": return "TkError";
    default: return self._tag;
  }
}
const __TokenKind_Debug = { debug: __TokenKind_Debug_debug };

function __Token_Debug_debug(self) {
  return "Token { " + "kind: " + __TokenKind_Debug.debug(self.kind) + ", " + "value: " + String(self.value) + ", " + "span: " + __Span_Debug.debug(self.span) + " }";
}
const __Token_Debug = { debug: __Token_Debug_debug };


export { TokenKind_TkFn, TokenKind_TkLet, TokenKind_TkVar, TokenKind_TkStruct, TokenKind_TkEnum, TokenKind_TkMatch, TokenKind_TkImpl, TokenKind_TkEffect, TokenKind_TkHandle, TokenKind_TkWith, TokenKind_TkIf, TokenKind_TkElse, TokenKind_TkCatch, TokenKind_TkTest, TokenKind_TkReturn, TokenKind_TkFor, TokenKind_TkIn, TokenKind_TkPub, TokenKind_TkWhere, TokenKind_TkTrue, TokenKind_TkFalse, TokenKind_TkTrait, TokenKind_TkTry, TokenKind_TkWhile, TokenKind_TkBreak, TokenKind_TkContinue, TokenKind_TkUse, TokenKind_TkAs, TokenKind_TkExtern, TokenKind_TkIntLit, TokenKind_TkFloatLit, TokenKind_TkStringLit, TokenKind_TkStringInterpStart, TokenKind_TkStringInterpMiddle, TokenKind_TkStringInterpEnd, TokenKind_TkRawStringLit, TokenKind_TkIdent, TokenKind_TkPlus, TokenKind_TkMinus, TokenKind_TkStar, TokenKind_TkSlash, TokenKind_TkPercent, TokenKind_TkEqEq, TokenKind_TkBangEq, TokenKind_TkLt, TokenKind_TkGt, TokenKind_TkLtEq, TokenKind_TkGtEq, TokenKind_TkAmpAmp, TokenKind_TkPipePipe, TokenKind_TkBang, TokenKind_TkEq, TokenKind_TkPlusEq, TokenKind_TkMinusEq, TokenKind_TkLParen, TokenKind_TkRParen, TokenKind_TkLBrace, TokenKind_TkRBrace, TokenKind_TkLBracket, TokenKind_TkRBracket, TokenKind_TkComma, TokenKind_TkColon, TokenKind_TkColonColon, TokenKind_TkDot, TokenKind_TkDotDot, TokenKind_TkDotDotEq, TokenKind_TkFatArrow, TokenKind_TkArrow, TokenKind_TkQuestion, TokenKind_TkSemi, TokenKind_TkEof, TokenKind_TkError, token_kind_value, Token, Lexer, new_lexer, Lexer_tokenize, Lexer_next_token, Lexer_lex_string, Lexer_lex_string_continuation, Lexer_lex_string_body, Lexer_lex_raw_string, Lexer_lex_number, Lexer_lex_ident, Lexer_lex_punctuation, Lexer_skip_whitespace_and_comments, Lexer_peek, Lexer_advance, Lexer_current_position, Lexer_make_token, Lexer_inc_last_depth, Lexer_dec_last_depth, Lexer_reset_last_depth, __TokenKind_Eq, __Token_Eq, __Lexer_Clone, __TokenKind_Clone, __Token_Clone, __TokenKind_Ord, __Token_Ord, __Lexer_Debug, __TokenKind_Debug, __Token_Debug };