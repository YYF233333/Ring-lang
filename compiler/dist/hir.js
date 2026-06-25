import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { CELL_METHODS as builtin_methods$CELL_METHODS, FLOAT_METHODS as builtin_methods$FLOAT_METHODS, INT_METHODS as builtin_methods$INT_METHODS, LIST_HOF_METHODS as builtin_methods$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as builtin_methods$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as builtin_methods$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as builtin_methods$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as builtin_methods$OPTION_HOF_METHODS, OPTION_NON_HOF_METHODS as builtin_methods$OPTION_NON_HOF_METHODS, SET_HOF_METHODS as builtin_methods$SET_HOF_METHODS, SET_NON_HOF_METHODS as builtin_methods$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as builtin_methods$STRINGBUILDER_METHODS, STR_METHODS as builtin_methods$STR_METHODS } from "./builtin_methods.js";
const BUILTIN_INT = types$BUILTIN_INT;
const BUILTIN_FLOAT = types$BUILTIN_FLOAT;
const BUILTIN_STR = types$BUILTIN_STR;
const BUILTIN_BOOL = types$BUILTIN_BOOL;
const BUILTIN_RANGE = types$BUILTIN_RANGE;
const BUILTIN_LIST = types$BUILTIN_LIST;
const BUILTIN_MAP = types$BUILTIN_MAP;
const BUILTIN_SET = types$BUILTIN_SET;
const BUILTIN_OPTION = types$BUILTIN_OPTION;
const BUILTIN_CELL = types$BUILTIN_CELL;
const BUILTIN_STRING_BUILDER = types$BUILTIN_STRING_BUILDER;
const CELL_METHODS = builtin_methods$CELL_METHODS;
const STR_METHODS = builtin_methods$STR_METHODS;
const INT_METHODS = builtin_methods$INT_METHODS;
const FLOAT_METHODS = builtin_methods$FLOAT_METHODS;
const LIST_NON_HOF_METHODS = builtin_methods$LIST_NON_HOF_METHODS;
const LIST_HOF_METHODS = builtin_methods$LIST_HOF_METHODS;
const MAP_NON_HOF_METHODS = builtin_methods$MAP_NON_HOF_METHODS;
const MAP_HOF_METHODS = builtin_methods$MAP_HOF_METHODS;
const SET_NON_HOF_METHODS = builtin_methods$SET_NON_HOF_METHODS;
const SET_HOF_METHODS = builtin_methods$SET_HOF_METHODS;
const OPTION_NON_HOF_METHODS = builtin_methods$OPTION_NON_HOF_METHODS;
const OPTION_HOF_METHODS = builtin_methods$OPTION_HOF_METHODS;
const STRINGBUILDER_METHODS = builtin_methods$STRINGBUILDER_METHODS;



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

class HParam {
  constructor(name, ty, def_id, is_mutable) {
    this.name = name;
    this.ty = ty;
    this.def_id = def_id;
    this.is_mutable = is_mutable;
  }
}

function DictRef_Simple(_0) {
  return { _tag: "Simple", _0 };
}
function DictRef_Wrapped(dict, trait_name, inner_dicts) {
  return { _tag: "Wrapped", dict, trait_name, inner_dicts };
}
function DictRef_Static(_0) {
  return { _tag: "Static", _0 };
}

class HDictDef {
  constructor(name, base_dict, trait_name, inner) {
    this.name = name;
    this.base_dict = base_dict;
    this.trait_name = trait_name;
    this.inner = inner;
  }
}

const TraitDispatch_Builtin = Object.freeze({ _tag: "Builtin" });
function TraitDispatch_Direct(dict, extra_dicts) {
  return { _tag: "Direct", dict, extra_dicts };
}
function TraitDispatch_Dict(param) {
  return { _tag: "Dict", param };
}

class DictDispatchInfo {
  constructor(dict_param, method) {
    this.dict_param = dict_param;
    this.method = method;
  }
}

class HStructFieldInit {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
}

class HMatchArm {
  constructor(pattern, guard, body, span) {
    this.pattern = pattern;
    this.guard = guard;
    this.body = body;
    this.span = span;
  }
}

class HEffectHandler {
  constructor(effect_name, op_name, params, resume_name, body) {
    this.effect_name = effect_name;
    this.op_name = op_name;
    this.params = params;
    this.resume_name = resume_name;
    this.body = body;
  }
}

function HStringInterpPart_Literal(_0) {
  return { _tag: "Literal", _0 };
}
function HStringInterpPart_Expression(_0) {
  return { _tag: "Expression", _0 };
}

function HExpr_IntLit(value, ty, effects, span) {
  return { _tag: "IntLit", value, ty, effects, span };
}
function HExpr_FloatLit(value, ty, effects, span) {
  return { _tag: "FloatLit", value, ty, effects, span };
}
function HExpr_StrLit(value, ty, effects, span) {
  return { _tag: "StrLit", value, ty, effects, span };
}
function HExpr_BoolLit(value, ty, effects, span) {
  return { _tag: "BoolLit", value, ty, effects, span };
}
function HExpr_Ident(name, resolved_name, def_id, dict_closure_dicts, ty, effects, span) {
  return { _tag: "Ident", name, resolved_name, def_id, dict_closure_dicts, ty, effects, span };
}
function HExpr_BinOp(op, left, right, eq_dispatch, ord_dispatch, ty, effects, span) {
  return { _tag: "BinOp", op, left, right, eq_dispatch, ord_dispatch, ty, effects, span };
}
function HExpr_UnaryOp(op, operand, ty, effects, span) {
  return { _tag: "UnaryOp", op, operand, ty, effects, span };
}
function HExpr_Call(callee, args, type_args, resolved_dicts, dict_dispatch, ty, effects, span) {
  return { _tag: "Call", callee, args, type_args, resolved_dicts, dict_dispatch, ty, effects, span };
}
function HExpr_FieldAccess(receiver, field, ty, effects, span) {
  return { _tag: "FieldAccess", receiver, field, ty, effects, span };
}
function HExpr_StructLit(name, type_args, fields, spread, ty, effects, span) {
  return { _tag: "StructLit", name, type_args, fields, spread, ty, effects, span };
}
function HExpr_NamedVariantConstruct(enum_name, variant_name, fields, spread, ty, effects, span) {
  return { _tag: "NamedVariantConstruct", enum_name, variant_name, fields, spread, ty, effects, span };
}
function HExpr_MatchExpr(scrutinee, arms, ty, effects, span) {
  return { _tag: "MatchExpr", scrutinee, arms, ty, effects, span };
}
function HExpr_Block(stmts, tail, ty, effects, span) {
  return { _tag: "Block", stmts, tail, ty, effects, span };
}
function HExpr_IfExpr(condition, then_branch, else_branch, ty, effects, span) {
  return { _tag: "IfExpr", condition, then_branch, else_branch, ty, effects, span };
}
function HExpr_StringInterp(parts, ty, effects, span) {
  return { _tag: "StringInterp", parts, ty, effects, span };
}
function HExpr_TryCatch(body, arms, ty, effects, span) {
  return { _tag: "TryCatch", body, arms, ty, effects, span };
}
function HExpr_HandleExpr(body, handlers, ty, effects, span) {
  return { _tag: "HandleExpr", body, handlers, ty, effects, span };
}
function HExpr_Lambda(params, return_type, body, ty, effects, span) {
  return { _tag: "Lambda", params, return_type, body, ty, effects, span };
}
function HExpr_EffectOp(effect_name, op_name, args, ty, effects, span) {
  return { _tag: "EffectOp", effect_name, op_name, args, ty, effects, span };
}
function HExpr_RangeExpr(start, end, inclusive, ty, effects, span) {
  return { _tag: "RangeExpr", start, end, inclusive, ty, effects, span };
}
function HExpr_ListLit(elements, ty, effects, span) {
  return { _tag: "ListLit", elements, ty, effects, span };
}
function HExpr_TupleLit(elements, ty, effects, span) {
  return { _tag: "TupleLit", elements, ty, effects, span };
}
function HExpr_IndexExpr(receiver, index, ty, effects, span) {
  return { _tag: "IndexExpr", receiver, index, ty, effects, span };
}
function HExpr_DictConstruct(base_dict, trait_name, inner, ty, effects, span) {
  return { _tag: "DictConstruct", base_dict, trait_name, inner, ty, effects, span };
}
function HExpr_Clone(inner, ty, effects, span) {
  return { _tag: "Clone", inner, ty, effects, span };
}
function HExpr_ReturnExpr(value, ty, effects, span) {
  return { _tag: "ReturnExpr", value, ty, effects, span };
}

class HForInDestructure {
  constructor(name, def_id) {
    this.name = name;
    this.def_id = def_id;
  }
}

class HLetDestructureBinding {
  constructor(name, def_id, ty) {
    this.name = name;
    this.def_id = def_id;
    this.ty = ty;
  }
}

function HStmt_Let(name, name_span, def_id, ty, init, span) {
  return { _tag: "Let", name, name_span, def_id, ty, init, span };
}
function HStmt_Var(name, name_span, def_id, ty, init, span) {
  return { _tag: "Var", name, name_span, def_id, ty, init, span };
}
function HStmt_Assign(target, value, span) {
  return { _tag: "Assign", target, value, span };
}
function HStmt_ExprStmt(expr, span) {
  return { _tag: "ExprStmt", expr, span };
}
function HStmt_Return(value, span) {
  return { _tag: "Return", value, span };
}
function HStmt_While(condition, body, span) {
  return { _tag: "While", condition, body, span };
}
function HStmt_ForIn(binding, binding_span, def_id, destructure, iterable, body, iterable_type_name, iter_type_name, span) {
  return { _tag: "ForIn", binding, binding_span, def_id, destructure, iterable, body, iterable_type_name, iter_type_name, span };
}
function HStmt_Break(span) {
  return { _tag: "Break", span };
}
function HStmt_Continue(span) {
  return { _tag: "Continue", span };
}
function HStmt_LetDestructure(pattern, bindings, init, span) {
  return { _tag: "LetDestructure", pattern, bindings, init, span };
}
function HStmt_IfLet(pattern, expr, then_block, else_block, span) {
  return { _tag: "IfLet", pattern, expr, then_block, else_block, span };
}
function HStmt_Drop(name, ty, span) {
  return { _tag: "Drop", name, ty, span };
}
function HStmt_Dup(name, ty, span) {
  return { _tag: "Dup", name, ty, span };
}

class HStructField {
  constructor(name, ty, is_pub) {
    this.name = name;
    this.ty = ty;
    this.is_pub = is_pub;
  }
}

class HEnumVariant {
  constructor(name, fields, field_names) {
    this.name = name;
    this.fields = fields;
    this.field_names = field_names;
  }
}

class HEffectOp {
  constructor(name, params, return_type, has_default, default_body) {
    this.name = name;
    this.params = params;
    this.return_type = return_type;
    this.has_default = has_default;
    this.default_body = default_body;
  }
}

class HTraitMethod {
  constructor(name, params, return_type, effects, has_default, body) {
    this.name = name;
    this.params = params;
    this.return_type = return_type;
    this.effects = effects;
    this.has_default = has_default;
    this.body = body;
  }
}

class TraitBound {
  constructor(type_param, trait_name) {
    this.type_param = type_param;
    this.trait_name = trait_name;
  }
}

class HAssocType {
  constructor(name, bounds, concrete) {
    this.name = name;
    this.bounds = bounds;
    this.concrete = concrete;
  }
}

class HSigMember {
  constructor(name, fn_type, span) {
    this.name = name;
    this.fn_type = fn_type;
    this.span = span;
  }
}

function HDecl_Fn(name, def_id, type_params, params, return_type, effects, body, is_pub, trait_bounds, span) {
  return { _tag: "Fn", name, def_id, type_params, params, return_type, effects, body, is_pub, trait_bounds, span };
}
function HDecl_Struct(name, type_params, fields, is_pub, span) {
  return { _tag: "Struct", name, type_params, fields, is_pub, span };
}
function HDecl_Enum(name, type_params, variants, is_pub, span) {
  return { _tag: "Enum", name, type_params, variants, is_pub, span };
}
function HDecl_Impl(target_type, type_params, trait_name, methods, assoc_types, span) {
  return { _tag: "Impl", target_type, type_params, trait_name, methods, assoc_types, span };
}
function HDecl_Effect(name, type_params, ops, is_pub, span) {
  return { _tag: "Effect", name, type_params, ops, is_pub, span };
}
function HDecl_Test(description, body, span) {
  return { _tag: "Test", description, body, span };
}
function HDecl_Trait(name, type_params, methods, supertraits, assoc_types, is_pub, span) {
  return { _tag: "Trait", name, type_params, methods, supertraits, assoc_types, is_pub, span };
}
function HDecl_ExternFn(name, def_id, type_params, params, return_type, effects, is_pub, span) {
  return { _tag: "ExternFn", name, def_id, type_params, params, return_type, effects, is_pub, span };
}
function HDecl_ExternType(name, type_params, is_pub, span) {
  return { _tag: "ExternType", name, type_params, is_pub, span };
}
function HDecl_TypeAlias(name, ty, is_pub, span) {
  return { _tag: "TypeAlias", name, ty, is_pub, span };
}
function HDecl_Const(name, def_id, ty, init, is_pub, span) {
  return { _tag: "Const", name, def_id, ty, init, is_pub, span };
}
function HDecl_ModBlock(name, decls, is_pub, span) {
  return { _tag: "ModBlock", name, decls, is_pub, span };
}
function HDecl_Sig(name, members, is_pub, span) {
  return { _tag: "Sig", name, members, is_pub, span };
}

const FieldAction_Identity = Object.freeze({ _tag: "Identity" });
function FieldAction_Call(dict_name, extra_dicts) {
  return { _tag: "Call", dict_name, extra_dicts };
}
function FieldAction_Tuple(element_actions) {
  return { _tag: "Tuple", element_actions };
}
const FieldAction_FnLiteral = Object.freeze({ _tag: "FnLiteral" });

class DerivedField {
  constructor(name, positional_index, action) {
    this.name = name;
    this.positional_index = positional_index;
    this.action = action;
  }
}

class DerivedVariant {
  constructor(name, fields, has_named_fields) {
    this.name = name;
    this.fields = fields;
    this.has_named_fields = has_named_fields;
  }
}

const TypeKind_StructKind = Object.freeze({ _tag: "StructKind" });
const TypeKind_EnumKind = Object.freeze({ _tag: "EnumKind" });

class DerivedImpl {
  constructor(type_name, trait_name, type_params, bounds, type_kind, struct_fields, enum_variants) {
    this.type_name = type_name;
    this.trait_name = trait_name;
    this.type_params = type_params;
    this.bounds = bounds;
    this.type_kind = type_kind;
    this.struct_fields = struct_fields;
    this.enum_variants = enum_variants;
  }
}

class HProgram {
  constructor(decls, derived_impls, boxed_vars, static_dicts, extern_type_names) {
    this.decls = decls;
    this.derived_impls = derived_impls;
    this.boxed_vars = boxed_vars;
    this.static_dicts = static_dicts;
    this.extern_type_names = extern_type_names;
  }
}

const ENUM_TAG_FIELD = "_tag";

const OPTION_SOME_TAG = "some";

const OPTION_NONE_TAG = "none";

const OPTION_PAYLOAD_FIELD = "_0";

const RUNTIME_EFFECT_ABORT = "__EffectAbort";

const RUNTIME_MATCH_FAIL = "__match_fail";

function block_local_init(stmts, name) {
  let found = Option_none;
  const __ring_iter_2 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const s = __ring_next_2._0;
    __ring_match6: {
      const __ring_m6 = s;
      if (__ring_m6._tag === "Let") {
        const n = __ring_m6.name; const init = __ring_m6.init;
        if ((n === name)) {
          found = Option_some(init);
        }
        break __ring_match6;
      }
      if (__ring_m6._tag === "Var") {
        const n = __ring_m6.name; const init = __ring_m6.init;
        if ((n === name)) {
          found = Option_some(init);
        }
        break __ring_match6;
      }
      break __ring_match6;
    }
  }
  return found;
}

function collect_extern_type_names_rec(decls, out) {
  const __ring_iter_3 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
    if (__ring_next_3._tag === "none") break;
    const d = __ring_next_3._0;
    __ring_match7: {
      const __ring_m7 = d;
      if (__ring_m7._tag === "ExternType") {
        const name = __ring_m7.name;
        _Set_insert(out, name);
        break __ring_match7;
      }
      if (__ring_m7._tag === "ModBlock") {
        const md = __ring_m7.decls;
        collect_extern_type_names_rec(md, out);
        break __ring_match7;
      }
      break __ring_match7;
    }
  }
}

function collect_extern_type_names(decls) {
  let out = set_new();
  collect_extern_type_names_rec(decls, out);
  return out;
}

function default_evidence_name(effect_name) {
  const safe = (Str_contains(effect_name, "::") ? Str_replace(effect_name, "::", "$") : effect_name);
  return `__ring_default_ev_${safe}`;
}

function default_method_self_name(type_name) {
  return `__ring_self_${type_name}`;
}

function dict_instance_name(base_dict, inner) {
  if ((List_len(inner) === 0)) {
    return base_dict;
  } else {
    return `${base_dict}$${List_join(inner, "$")}`;
  }
}

function effect_op_slot(effect_ops, effect_name, op_name) {
  __ring_match8: {
    const __ring_m8 = _Map_get(effect_ops, effect_name);
    if (__ring_m8._tag === "some") {
      const ops = __ring_m8._0;
      let idx = 0;
      let found = (-1);
      const __ring_iter_4 = __List_Iterable.iter(ops);
      while (true) {
        const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
        if (__ring_next_4._tag === "none") break;
        const o = __ring_next_4._0;
        if (((o.name === op_name) ? (found === (-1)) : false)) {
          found = idx;
        }
        idx = (idx + 1);
      }
      return found;
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      return (-1);
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
}

function evidence_param_name(effect_name) {
  const safe = (Str_contains(effect_name, "::") ? Str_replace(effect_name, "::", "$") : effect_name);
  return `__ring_ev_${safe}`;
}

function hexpr_effects(e) {
  __ring_match9: {
    const __ring_m9 = e;
    if (__ring_m9._tag === "IntLit") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "FloatLit") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "StrLit") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "BoolLit") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Ident") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "BinOp") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "UnaryOp") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Call") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "FieldAccess") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "StructLit") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "NamedVariantConstruct") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "MatchExpr") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Block") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "IfExpr") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "StringInterp") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "TryCatch") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "HandleExpr") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Lambda") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "EffectOp") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "RangeExpr") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "ListLit") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "TupleLit") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "IndexExpr") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "DictConstruct") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Clone") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    if (__ring_m9._tag === "ReturnExpr") {
      const effects = __ring_m9.effects;
      return effects;
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
}

function hexpr_span(e) {
  __ring_match10: {
    const __ring_m10 = e;
    if (__ring_m10._tag === "IntLit") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "FloatLit") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "StrLit") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "BoolLit") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "Ident") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "BinOp") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "UnaryOp") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "Call") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "FieldAccess") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "StructLit") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "NamedVariantConstruct") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "MatchExpr") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "Block") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "IfExpr") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "StringInterp") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "TryCatch") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "HandleExpr") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "Lambda") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "EffectOp") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "RangeExpr") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "ListLit") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "TupleLit") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "IndexExpr") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "DictConstruct") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "Clone") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    if (__ring_m10._tag === "ReturnExpr") {
      const span = __ring_m10.span;
      return span;
      break __ring_match10;
    }
    __match_fail(__ring_m10);
  }
}

function hexpr_type(e) {
  __ring_match11: {
    const __ring_m11 = e;
    if (__ring_m11._tag === "IntLit") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "FloatLit") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "StrLit") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "BoolLit") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "Ident") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "BinOp") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "UnaryOp") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "Call") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "FieldAccess") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "StructLit") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "NamedVariantConstruct") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "MatchExpr") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "Block") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "IfExpr") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "StringInterp") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "TryCatch") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "HandleExpr") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "Lambda") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "EffectOp") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "RangeExpr") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "ListLit") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "TupleLit") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "IndexExpr") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "DictConstruct") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "Clone") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    if (__ring_m11._tag === "ReturnExpr") {
      const ty = __ring_m11.ty;
      return ty;
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
}

function is_borrow_returning_call(callee) {
  __ring_match12: {
    const __ring_m12 = callee;
    if (__ring_m12._tag === "FieldAccess") {
      const field = __ring_m12.field;
      if ((((field === "unwrap") ? true : (field === "to_fail")) ? true : (field === "unwrap_or"))) {
        return true;
      } else {
        return (field === "unwrap_or_else");
      }
      break __ring_match12;
    }
    return false;
    break __ring_match12;
  }
}

function is_extern_handle_type(ty, externs) {
  if ((_Set_len(externs) === 0)) {
    return false;
  } else {
    __ring_match13: {
      const __ring_m13 = ty;
      if (__ring_m13._tag === "StructType") {
        const name = __ring_m13.name;
        return _Set_contains(externs, name, __Str_Eq);
        break __ring_match13;
      }
      return false;
      break __ring_match13;
    }
  }
}

function is_fresh_owned_bool_value(expr) {
  let __ring_blk0;
  __ring_match14: {
    const __ring_m14 = hexpr_type(expr);
    if (__ring_m14._tag === "BoolType") {
      __ring_blk0 = true;
      break __ring_match14;
    }
    __ring_blk0 = false;
    break __ring_match14;
  }
  const is_bool = __ring_blk0;
  if ((is_bool === false)) {
    return false;
  }
  __ring_match15: {
    const __ring_m15 = expr;
    if (__ring_m15._tag === "BinOp") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "UnaryOp") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "Call") {
      const callee = __ring_m15.callee;
      return (is_borrow_returning_call(callee) === false);
      break __ring_match15;
    }
    if (__ring_m15._tag === "BoolLit") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "Clone") {
      return true;
      break __ring_match15;
    }
    if (__ring_m15._tag === "Block") {
      const stmts = __ring_m15.stmts; const tail = __ring_m15.tail;
      __ring_match16: {
        const __ring_m16 = tail;
        if (__ring_m16._tag === "some") {
          const t = __ring_m16._0;
          __ring_match17: {
            const __ring_m17 = t;
            if (__ring_m17._tag === "Ident") {
              const name = __ring_m17.name;
              __ring_match18: {
                const __ring_m18 = block_local_init(stmts, name);
                if (__ring_m18._tag === "some") {
                  const init = __ring_m18._0;
                  return is_fresh_owned_bool_value(init);
                  break __ring_match18;
                }
                if (__ring_m18._tag === "none") {
                  return false;
                  break __ring_match18;
                }
                __match_fail(__ring_m18);
              }
              break __ring_match17;
            }
            return is_fresh_owned_bool_value(t);
            break __ring_match17;
          }
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          return false;
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "IfExpr") {
      const then_branch = __ring_m15.then_branch; const else_branch = __ring_m15.else_branch;
      __ring_match19: {
        const __ring_m19 = else_branch;
        if (__ring_m19._tag === "none") {
          return false;
          break __ring_match19;
        }
        if (__ring_m19._tag === "some") {
          const eb = __ring_m19._0;
          if (is_fresh_owned_bool_value(then_branch)) {
            return is_fresh_owned_bool_value(eb);
          } else {
            return false;
          }
          break __ring_match19;
        }
        __match_fail(__ring_m19);
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "MatchExpr") {
      const arms = __ring_m15.arms;
      let all = (List_len(arms) > 0);
      const __ring_iter_5 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const arm = __ring_next_5._0;
        if ((is_fresh_owned_bool_value(arm.body) === false)) {
          all = false;
        }
      }
      return all;
      break __ring_match15;
    }
    return false;
    break __ring_match15;
  }
}

function is_rc_excluded_type(ty, externs) {
  __ring_match20: {
    const __ring_m20 = ty;
    if (__ring_m20._tag === "UnitType") {
      return true;
      break __ring_match20;
    }
    return is_extern_handle_type(ty, externs);
    break __ring_match20;
  }
}

function trait_bound_param_name(type_param, trait_name) {
  const safe_trait = (Str_contains(trait_name, "::") ? Str_replace(trait_name, "::", "$") : trait_name);
  return `__ring_${type_param}_${safe_trait}`;
}

function trait_dict_name(type_name, trait_name) {
  const safe_type = (Str_contains(type_name, "::") ? Str_replace(type_name, "::", "$") : type_name);
  const safe_trait = (Str_contains(trait_name, "::") ? Str_replace(trait_name, "::", "$") : trait_name);
  return `__${safe_type}_${safe_trait}`;
}

function type_contains_extern_rec(ty, externs, visited) {
  __ring_match21: {
    const __ring_m21 = ty;
    if (__ring_m21._tag === "StructType") {
      const name = __ring_m21.name; const type_params = __ring_m21.type_params;
      if (_Set_contains(externs, name, __Str_Eq)) {
        return true;
      } else {
        if (_Set_contains(visited, `S:${name}`, __Str_Eq)) {
          return false;
        } else {
          _Set_insert(visited, `S:${name}`);
          let found = false;
          const __ring_iter_6 = __List_Iterable.iter(type_params);
          while (true) {
            const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
            if (__ring_next_6._tag === "none") break;
            const tp = __ring_next_6._0;
            if (type_contains_extern_rec(tp, externs, visited)) {
              found = true;
            }
          }
          return found;
        }
      }
      break __ring_match21;
    }
    if (__ring_m21._tag === "EnumType") {
      const name = __ring_m21.name; const type_params = __ring_m21.type_params;
      if (_Set_contains(visited, `E:${name}`, __Str_Eq)) {
        return false;
      } else {
        _Set_insert(visited, `E:${name}`);
        let found = false;
        const __ring_iter_7 = __List_Iterable.iter(type_params);
        while (true) {
          const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
          if (__ring_next_7._tag === "none") break;
          const tp = __ring_next_7._0;
          if (type_contains_extern_rec(tp, externs, visited)) {
            found = true;
          }
        }
        return found;
      }
      break __ring_match21;
    }
    if (__ring_m21._tag === "TupleType") {
      const elements = __ring_m21.elements;
      let found = false;
      const __ring_iter_8 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
        if (__ring_next_8._tag === "none") break;
        const e = __ring_next_8._0;
        if (type_contains_extern_rec(e, externs, visited)) {
          found = true;
        }
      }
      return found;
      break __ring_match21;
    }
    if (__ring_m21._tag === "GenericType") {
      const base = __ring_m21.base; const args = __ring_m21.args;
      let found = type_contains_extern_rec(base, externs, visited);
      const __ring_iter_9 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
        if (__ring_next_9._tag === "none") break;
        const a = __ring_next_9._0;
        if (type_contains_extern_rec(a, externs, visited)) {
          found = true;
        }
      }
      return found;
      break __ring_match21;
    }
    if (__ring_m21._tag === "RecordType") {
      const fields = __ring_m21.fields;
      let found = false;
      const __ring_iter_10 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
        if (__ring_next_10._tag === "none") break;
        const f = __ring_next_10._0;
        if (type_contains_extern_rec(f.ty, externs, visited)) {
          found = true;
        }
      }
      return found;
      break __ring_match21;
    }
    return false;
    break __ring_match21;
  }
}

function type_contains_extern_handle(ty, externs) {
  if ((_Set_len(externs) === 0)) {
    return false;
  } else {
    let visited = set_new();
    return type_contains_extern_rec(ty, externs, visited);
  }
}

function variant_js_name(enum_name, variant_name) {
  return `${enum_name}_${variant_name}`;
}

function __DictDispatchInfo_Eq_eq(self, other) {
  return (self.dict_param === other.dict_param) && (self.method === other.method);
}
const __DictDispatchInfo_Eq = { eq: __DictDispatchInfo_Eq_eq, ne: function(self, other) { return !__DictDispatchInfo_Eq_eq(self, other); } };

function __HForInDestructure_Eq_eq(self, other) {
  return (self.name === other.name) && __Option_Eq.eq(self.def_id, other.def_id, __Int_Eq);
}
const __HForInDestructure_Eq = { eq: __HForInDestructure_Eq_eq, ne: function(self, other) { return !__HForInDestructure_Eq_eq(self, other); } };

function __TraitBound_Eq_eq(self, other) {
  return (self.type_param === other.type_param) && (self.trait_name === other.trait_name);
}
const __TraitBound_Eq = { eq: __TraitBound_Eq_eq, ne: function(self, other) { return !__TraitBound_Eq_eq(self, other); } };

function __Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return __ring_T_Eq.eq(self._0, other._0);
    case "Err": return __ring_E_Eq.eq(self._0, other._0);
    default: return true;
  }
}
const __Result_Eq = { eq: __Result_Eq_eq, ne: function(self, other, __ring_T_Eq, __ring_E_Eq) { return !__Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq); } };

function __TypeKind_Eq_eq(self, other) {
  if (self._tag !== other._tag) return false;
  return true;
}
const __TypeKind_Eq = { eq: __TypeKind_Eq_eq, ne: function(self, other) { return !__TypeKind_Eq_eq(self, other); } };

function __DictDispatchInfo_Clone_clone(self) {
  return new DictDispatchInfo(self.dict_param, self.method);
}
const __DictDispatchInfo_Clone = { clone: __DictDispatchInfo_Clone_clone };

function __HDictDef_Clone_clone(self) {
  return new HDictDef(self.name, self.base_dict, self.trait_name, __List_Clone.clone(self.inner, __Str_Clone));
}
const __HDictDef_Clone = { clone: __HDictDef_Clone_clone };

function __HForInDestructure_Clone_clone(self) {
  return new HForInDestructure(self.name, __Option_Clone.clone(self.def_id, __Int_Clone));
}
const __HForInDestructure_Clone = { clone: __HForInDestructure_Clone_clone };

function __ListIterator_Clone_clone(self, __ring_T_Clone) {
  return new ListIterator(__List_Clone.clone(self.list, __ring_T_Clone), self.index);
}
const __ListIterator_Clone = { clone: __ListIterator_Clone_clone };

function __SetIterator_Clone_clone(self, __ring_T_Clone) {
  return new SetIterator(__List_Clone.clone(self.items, __ring_T_Clone), self.index);
}
const __SetIterator_Clone = { clone: __SetIterator_Clone_clone };

function __TraitBound_Clone_clone(self) {
  return new TraitBound(self.type_param, self.trait_name);
}
const __TraitBound_Clone = { clone: __TraitBound_Clone_clone };

function __DictRef_Clone_clone(self) {
  switch (self._tag) {
    case "Simple": return DictRef_Simple(self._0);
    case "Wrapped": return DictRef_Wrapped(self.dict, self.trait_name, __List_Clone.clone(self.inner_dicts, __DictRef_Clone));
    case "Static": return DictRef_Static(self._0);
    default: return self;
  }
}
const __DictRef_Clone = { clone: __DictRef_Clone_clone };

function __FieldAction_Clone_clone(self) {
  switch (self._tag) {
    case "Identity": return FieldAction_Identity;
    case "Call": return FieldAction_Call(self.dict_name, __List_Clone.clone(self.extra_dicts, __Str_Clone));
    case "Tuple": return FieldAction_Tuple(__List_Clone.clone(self.element_actions, __FieldAction_Clone));
    case "FnLiteral": return FieldAction_FnLiteral;
    default: return self;
  }
}
const __FieldAction_Clone = { clone: __FieldAction_Clone_clone };

function __Result_Clone_clone(self, __ring_T_Clone, __ring_E_Clone) {
  switch (self._tag) {
    case "Ok": return Result_Ok(__ring_T_Clone.clone(self._0));
    case "Err": return Result_Err(__ring_E_Clone.clone(self._0));
    default: return self;
  }
}
const __Result_Clone = { clone: __Result_Clone_clone };

function __TraitDispatch_Clone_clone(self) {
  switch (self._tag) {
    case "Builtin": return TraitDispatch_Builtin;
    case "Direct": return TraitDispatch_Direct(self.dict, __List_Clone.clone(self.extra_dicts, __DictRef_Clone));
    case "Dict": return TraitDispatch_Dict(self.param);
    default: return self;
  }
}
const __TraitDispatch_Clone = { clone: __TraitDispatch_Clone_clone };

function __TypeKind_Clone_clone(self) {
  switch (self._tag) {
    case "StructKind": return TypeKind_StructKind;
    case "EnumKind": return TypeKind_EnumKind;
    default: return self;
  }
}
const __TypeKind_Clone = { clone: __TypeKind_Clone_clone };

function __DerivedField_Clone_clone(self) {
  return new DerivedField(self.name, __Option_Clone.clone(self.positional_index, __Int_Clone), __FieldAction_Clone.clone(self.action));
}
const __DerivedField_Clone = { clone: __DerivedField_Clone_clone };

function __DerivedImpl_Clone_clone(self) {
  return new DerivedImpl(self.type_name, self.trait_name, __List_Clone.clone(self.type_params, __Str_Clone), __List_Clone.clone(self.bounds, __TraitBound_Clone), __TypeKind_Clone.clone(self.type_kind), __Option_Clone.clone(self.struct_fields, __List_Clone), __Option_Clone.clone(self.enum_variants, __List_Clone));
}
const __DerivedImpl_Clone = { clone: __DerivedImpl_Clone_clone };

function __DerivedVariant_Clone_clone(self) {
  return new DerivedVariant(self.name, __List_Clone.clone(self.fields, __DerivedField_Clone), self.has_named_fields);
}
const __DerivedVariant_Clone = { clone: __DerivedVariant_Clone_clone };

function __DictDispatchInfo_Ord_cmp(self, other) {
  var c;
  c = (self.dict_param < other.dict_param ? -1 : self.dict_param > other.dict_param ? 1 : 0);
  if (c !== 0) return c;
  return (self.method < other.method ? -1 : self.method > other.method ? 1 : 0);
}
const __DictDispatchInfo_Ord = { cmp: __DictDispatchInfo_Ord_cmp };

function __TraitBound_Ord_cmp(self, other) {
  var c;
  c = (self.type_param < other.type_param ? -1 : self.type_param > other.type_param ? 1 : 0);
  if (c !== 0) return c;
  return (self.trait_name < other.trait_name ? -1 : self.trait_name > other.trait_name ? 1 : 0);
}
const __TraitBound_Ord = { cmp: __TraitBound_Ord_cmp };

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

const __TypeKind_tag_order = { "StructKind": 0, "EnumKind": 1 };
function __TypeKind_Ord_cmp(self, other) {
  var t1 = __TypeKind_tag_order[self._tag];
  var t2 = __TypeKind_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  return 0;
}
const __TypeKind_Ord = { cmp: __TypeKind_Ord_cmp };

function __DictDispatchInfo_Debug_debug(self) {
  return "DictDispatchInfo { " + "dict_param: " + String(self.dict_param) + ", " + "method: " + String(self.method) + " }";
}
const __DictDispatchInfo_Debug = { debug: __DictDispatchInfo_Debug_debug };

function __HDictDef_Debug_debug(self) {
  return "HDictDef { " + "name: " + String(self.name) + ", " + "base_dict: " + String(self.base_dict) + ", " + "trait_name: " + String(self.trait_name) + ", " + "inner: " + __List_Debug.debug(self.inner, __Str_Debug) + " }";
}
const __HDictDef_Debug = { debug: __HDictDef_Debug_debug };

function __HForInDestructure_Debug_debug(self) {
  return "HForInDestructure { " + "name: " + String(self.name) + ", " + "def_id: " + __Option_Debug.debug(self.def_id, __Int_Debug) + " }";
}
const __HForInDestructure_Debug = { debug: __HForInDestructure_Debug_debug };

function __ListIterator_Debug_debug(self, __ring_T_Debug) {
  return "ListIterator { " + "list: " + __List_Debug.debug(self.list, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __ListIterator_Debug = { debug: __ListIterator_Debug_debug };

function __SetIterator_Debug_debug(self, __ring_T_Debug) {
  return "SetIterator { " + "items: " + __List_Debug.debug(self.items, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __SetIterator_Debug = { debug: __SetIterator_Debug_debug };

function __TraitBound_Debug_debug(self) {
  return "TraitBound { " + "type_param: " + String(self.type_param) + ", " + "trait_name: " + String(self.trait_name) + " }";
}
const __TraitBound_Debug = { debug: __TraitBound_Debug_debug };

function __DictRef_Debug_debug(self) {
  switch (self._tag) {
    case "Simple": return "Simple(" + String(self._0) + ")";
    case "Wrapped": return "Wrapped { " + "dict: " + String(self.dict) + ", " + "trait_name: " + String(self.trait_name) + ", " + "inner_dicts: " + __List_Debug.debug(self.inner_dicts, __DictRef_Debug) + " }";
    case "Static": return "Static(" + String(self._0) + ")";
    default: return self._tag;
  }
}
const __DictRef_Debug = { debug: __DictRef_Debug_debug };

function __FieldAction_Debug_debug(self) {
  switch (self._tag) {
    case "Identity": return "Identity";
    case "Call": return "Call { " + "dict_name: " + String(self.dict_name) + ", " + "extra_dicts: " + __List_Debug.debug(self.extra_dicts, __Str_Debug) + " }";
    case "Tuple": return "Tuple { " + "element_actions: " + __List_Debug.debug(self.element_actions, __FieldAction_Debug) + " }";
    case "FnLiteral": return "FnLiteral";
    default: return self._tag;
  }
}
const __FieldAction_Debug = { debug: __FieldAction_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };

function __TraitDispatch_Debug_debug(self) {
  switch (self._tag) {
    case "Builtin": return "Builtin";
    case "Direct": return "Direct { " + "dict: " + String(self.dict) + ", " + "extra_dicts: " + __List_Debug.debug(self.extra_dicts, __DictRef_Debug) + " }";
    case "Dict": return "Dict { " + "param: " + String(self.param) + " }";
    default: return self._tag;
  }
}
const __TraitDispatch_Debug = { debug: __TraitDispatch_Debug_debug };

function __TypeKind_Debug_debug(self) {
  switch (self._tag) {
    case "StructKind": return "StructKind";
    case "EnumKind": return "EnumKind";
    default: return self._tag;
  }
}
const __TypeKind_Debug = { debug: __TypeKind_Debug_debug };

function __DerivedField_Debug_debug(self) {
  return "DerivedField { " + "name: " + String(self.name) + ", " + "positional_index: " + __Option_Debug.debug(self.positional_index, __Int_Debug) + ", " + "action: " + __FieldAction_Debug.debug(self.action) + " }";
}
const __DerivedField_Debug = { debug: __DerivedField_Debug_debug };

function __DerivedImpl_Debug_debug(self) {
  return "DerivedImpl { " + "type_name: " + String(self.type_name) + ", " + "trait_name: " + String(self.trait_name) + ", " + "type_params: " + __List_Debug.debug(self.type_params, __Str_Debug) + ", " + "bounds: " + __List_Debug.debug(self.bounds, __TraitBound_Debug) + ", " + "type_kind: " + __TypeKind_Debug.debug(self.type_kind) + ", " + "struct_fields: " + __Option_Debug.debug(self.struct_fields, __List_Debug) + ", " + "enum_variants: " + __Option_Debug.debug(self.enum_variants, __List_Debug) + " }";
}
const __DerivedImpl_Debug = { debug: __DerivedImpl_Debug_debug };

function __DerivedVariant_Debug_debug(self) {
  return "DerivedVariant { " + "name: " + String(self.name) + ", " + "fields: " + __List_Debug.debug(self.fields, __DerivedField_Debug) + ", " + "has_named_fields: " + String(self.has_named_fields) + " }";
}
const __DerivedVariant_Debug = { debug: __DerivedVariant_Debug_debug };


export { HParam, DictRef_Simple, DictRef_Wrapped, DictRef_Static, HDictDef, dict_instance_name, TraitDispatch_Builtin, TraitDispatch_Direct, TraitDispatch_Dict, DictDispatchInfo, HStructFieldInit, HMatchArm, HEffectHandler, HStringInterpPart_Literal, HStringInterpPart_Expression, HExpr_IntLit, HExpr_FloatLit, HExpr_StrLit, HExpr_BoolLit, HExpr_Ident, HExpr_BinOp, HExpr_UnaryOp, HExpr_Call, HExpr_FieldAccess, HExpr_StructLit, HExpr_NamedVariantConstruct, HExpr_MatchExpr, HExpr_Block, HExpr_IfExpr, HExpr_StringInterp, HExpr_TryCatch, HExpr_HandleExpr, HExpr_Lambda, HExpr_EffectOp, HExpr_RangeExpr, HExpr_ListLit, HExpr_TupleLit, HExpr_IndexExpr, HExpr_DictConstruct, HExpr_Clone, HExpr_ReturnExpr, HForInDestructure, HLetDestructureBinding, HStmt_Let, HStmt_Var, HStmt_Assign, HStmt_ExprStmt, HStmt_Return, HStmt_While, HStmt_ForIn, HStmt_Break, HStmt_Continue, HStmt_LetDestructure, HStmt_IfLet, HStmt_Drop, HStmt_Dup, HStructField, HEnumVariant, HEffectOp, HTraitMethod, TraitBound, HAssocType, HSigMember, HDecl_Fn, HDecl_Struct, HDecl_Enum, HDecl_Impl, HDecl_Effect, HDecl_Test, HDecl_Trait, HDecl_ExternFn, HDecl_ExternType, HDecl_TypeAlias, HDecl_Const, HDecl_ModBlock, HDecl_Sig, FieldAction_Identity, FieldAction_Call, FieldAction_Tuple, FieldAction_FnLiteral, DerivedField, DerivedVariant, TypeKind_StructKind, TypeKind_EnumKind, DerivedImpl, HProgram, variant_js_name, trait_dict_name, evidence_param_name, default_evidence_name, effect_op_slot, trait_bound_param_name, default_method_self_name, ENUM_TAG_FIELD, OPTION_SOME_TAG, OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL, hexpr_type, hexpr_effects, hexpr_span, collect_extern_type_names, is_extern_handle_type, is_rc_excluded_type, type_contains_extern_handle, is_borrow_returning_call, is_fresh_owned_bool_value, __DictDispatchInfo_Eq, __HForInDestructure_Eq, __TraitBound_Eq, __TypeKind_Eq, __DictDispatchInfo_Clone, __HDictDef_Clone, __HForInDestructure_Clone, __TraitBound_Clone, __DictRef_Clone, __FieldAction_Clone, __TraitDispatch_Clone, __TypeKind_Clone, __DerivedField_Clone, __DerivedImpl_Clone, __DerivedVariant_Clone, __DictDispatchInfo_Ord, __TraitBound_Ord, __TypeKind_Ord, __DictDispatchInfo_Debug, __HDictDef_Debug, __HForInDestructure_Debug, __TraitBound_Debug, __DictRef_Debug, __FieldAction_Debug, __TraitDispatch_Debug, __TypeKind_Debug, __DerivedField_Debug, __DerivedImpl_Debug, __DerivedVariant_Debug, BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL, BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION, BUILTIN_CELL, BUILTIN_STRING_BUILDER, CELL_METHODS, STR_METHODS, INT_METHODS, FLOAT_METHODS, LIST_NON_HOF_METHODS, LIST_HOF_METHODS, MAP_NON_HOF_METHODS, MAP_HOF_METHODS, SET_NON_HOF_METHODS, SET_HOF_METHODS, OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS, STRINGBUILDER_METHODS };