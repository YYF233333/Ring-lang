import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";



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

function synthetic_span() {
  const pos = new ast$Position(0, 0, 0);
  return new ast$Span("<perceus>", pos, pos);
}

function rc_name_skippable(name) {
  return (name === "_");
}

function collect_expr_vars(expr, out) {
  __ring_match6: {
    const __ring_m6 = expr;
    if (__ring_m6._tag === "Ident") {
      const name = __ring_m6.name;
      return _Set_insert(out, name);
      break __ring_match6;
    }
    if (__ring_m6._tag === "BinOp") {
      const left = __ring_m6.left; const right = __ring_m6.right;
      collect_expr_vars(left, out);
      return collect_expr_vars(right, out);
      break __ring_match6;
    }
    if (__ring_m6._tag === "UnaryOp") {
      const operand = __ring_m6.operand;
      return collect_expr_vars(operand, out);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Call") {
      const callee = __ring_m6.callee; const args = __ring_m6.args;
      collect_expr_vars(callee, out);
      const __ring_iter_2 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
        if (__ring_next_2._tag === "none") break;
        const a = __ring_next_2._0;
        collect_expr_vars(a, out);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "FieldAccess") {
      const receiver = __ring_m6.receiver;
      return collect_expr_vars(receiver, out);
      break __ring_match6;
    }
    if (__ring_m6._tag === "StructLit") {
      const fields = __ring_m6.fields; const spread = __ring_m6.spread;
      const __ring_iter_3 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
        if (__ring_next_3._tag === "none") break;
        const f = __ring_next_3._0;
        collect_expr_vars(f.value, out);
      }
      __ring_match7: {
        const __ring_m7 = spread;
        if (__ring_m7._tag === "some") {
          const s = __ring_m7._0;
          return collect_expr_vars(s, out);
          break __ring_match7;
        }
        if (__ring_m7._tag === "none") {
          break __ring_match7;
        }
        __match_fail(__ring_m7);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "NamedVariantConstruct") {
      const fields = __ring_m6.fields; const spread = __ring_m6.spread;
      const __ring_iter_4 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
        if (__ring_next_4._tag === "none") break;
        const f = __ring_next_4._0;
        collect_expr_vars(f.value, out);
      }
      __ring_match8: {
        const __ring_m8 = spread;
        if (__ring_m8._tag === "some") {
          const s = __ring_m8._0;
          return collect_expr_vars(s, out);
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "MatchExpr") {
      const scrutinee = __ring_m6.scrutinee; const arms = __ring_m6.arms;
      collect_expr_vars(scrutinee, out);
      const __ring_iter_5 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const arm = __ring_next_5._0;
        collect_expr_vars(arm.body, out);
        __ring_match9: {
          const __ring_m9 = arm.guard;
          if (__ring_m9._tag === "some") {
            const g = __ring_m9._0;
            collect_expr_vars(g, out);
            break __ring_match9;
          }
          if (__ring_m9._tag === "none") {
            break __ring_match9;
          }
          __match_fail(__ring_m9);
        }
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "Block") {
      const stmts = __ring_m6.stmts; const tail = __ring_m6.tail;
      const __ring_iter_6 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
        if (__ring_next_6._tag === "none") break;
        const s = __ring_next_6._0;
        collect_stmt_vars(s, out);
      }
      __ring_match10: {
        const __ring_m10 = tail;
        if (__ring_m10._tag === "some") {
          const t = __ring_m10._0;
          return collect_expr_vars(t, out);
          break __ring_match10;
        }
        if (__ring_m10._tag === "none") {
          break __ring_match10;
        }
        __match_fail(__ring_m10);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "IfExpr") {
      const condition = __ring_m6.condition; const then_branch = __ring_m6.then_branch; const else_branch = __ring_m6.else_branch;
      collect_expr_vars(condition, out);
      collect_expr_vars(then_branch, out);
      __ring_match11: {
        const __ring_m11 = else_branch;
        if (__ring_m11._tag === "some") {
          const eb = __ring_m11._0;
          return collect_expr_vars(eb, out);
          break __ring_match11;
        }
        if (__ring_m11._tag === "none") {
          break __ring_match11;
        }
        __match_fail(__ring_m11);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "StringInterp") {
      const parts = __ring_m6.parts;
      const __ring_iter_7 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
        if (__ring_next_7._tag === "none") break;
        const p = __ring_next_7._0;
        __ring_match12: {
          const __ring_m12 = p;
          if (__ring_m12._tag === "Expression") {
            const e = __ring_m12._0;
            collect_expr_vars(e, out);
            break __ring_match12;
          }
          if (__ring_m12._tag === "Literal") {
            break __ring_match12;
          }
          __match_fail(__ring_m12);
        }
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "TryCatch") {
      const body = __ring_m6.body; const arms = __ring_m6.arms;
      collect_expr_vars(body, out);
      const __ring_iter_8 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
        if (__ring_next_8._tag === "none") break;
        const arm = __ring_next_8._0;
        collect_expr_vars(arm.body, out);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "HandleExpr") {
      const body = __ring_m6.body; const handlers = __ring_m6.handlers;
      collect_expr_vars(body, out);
      const __ring_iter_9 = __List_Iterable.iter(handlers);
      while (true) {
        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
        if (__ring_next_9._tag === "none") break;
        const h = __ring_next_9._0;
        collect_expr_vars(h.body, out);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "Lambda") {
      const body = __ring_m6.body;
      return collect_expr_vars(body, out);
      break __ring_match6;
    }
    if (__ring_m6._tag === "EffectOp") {
      const args = __ring_m6.args;
      const __ring_iter_10 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
        if (__ring_next_10._tag === "none") break;
        const a = __ring_next_10._0;
        collect_expr_vars(a, out);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "RangeExpr") {
      const start = __ring_m6.start; const end = __ring_m6.end;
      collect_expr_vars(start, out);
      return collect_expr_vars(end, out);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ListLit") {
      const elements = __ring_m6.elements;
      const __ring_iter_11 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
        if (__ring_next_11._tag === "none") break;
        const e = __ring_next_11._0;
        collect_expr_vars(e, out);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "TupleLit") {
      const elements = __ring_m6.elements;
      const __ring_iter_12 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
        if (__ring_next_12._tag === "none") break;
        const e = __ring_next_12._0;
        collect_expr_vars(e, out);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "IndexExpr") {
      const receiver = __ring_m6.receiver; const index = __ring_m6.index;
      collect_expr_vars(receiver, out);
      return collect_expr_vars(index, out);
      break __ring_match6;
    }
    if (__ring_m6._tag === "IntLit") {
      break __ring_match6;
    }
    if (__ring_m6._tag === "FloatLit") {
      break __ring_match6;
    }
    if (__ring_m6._tag === "StrLit") {
      break __ring_match6;
    }
    if (__ring_m6._tag === "BoolLit") {
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function collect_stmt_vars(stmt, out) {
  __ring_match13: {
    const __ring_m13 = stmt;
    if (__ring_m13._tag === "Let") {
      const init = __ring_m13.init;
      return collect_expr_vars(init, out);
      break __ring_match13;
    }
    if (__ring_m13._tag === "Var") {
      const init = __ring_m13.init;
      return collect_expr_vars(init, out);
      break __ring_match13;
    }
    if (__ring_m13._tag === "Assign") {
      const target = __ring_m13.target; const value = __ring_m13.value;
      collect_expr_vars(target, out);
      return collect_expr_vars(value, out);
      break __ring_match13;
    }
    if (__ring_m13._tag === "ExprStmt") {
      const expr = __ring_m13.expr;
      return collect_expr_vars(expr, out);
      break __ring_match13;
    }
    if (__ring_m13._tag === "Return") {
      const value = __ring_m13.value;
      __ring_match14: {
        const __ring_m14 = value;
        if (__ring_m14._tag === "some") {
          const v = __ring_m14._0;
          return collect_expr_vars(v, out);
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "While") {
      const condition = __ring_m13.condition; const body = __ring_m13.body;
      collect_expr_vars(condition, out);
      return collect_expr_vars(body, out);
      break __ring_match13;
    }
    if (__ring_m13._tag === "ForIn") {
      const iterable = __ring_m13.iterable; const body = __ring_m13.body;
      collect_expr_vars(iterable, out);
      return collect_expr_vars(body, out);
      break __ring_match13;
    }
    if (__ring_m13._tag === "LetDestructure") {
      const init = __ring_m13.init;
      return collect_expr_vars(init, out);
      break __ring_match13;
    }
    if (__ring_m13._tag === "IfLet") {
      const expr = __ring_m13.expr; const then_block = __ring_m13.then_block; const else_block = __ring_m13.else_block;
      collect_expr_vars(expr, out);
      collect_expr_vars(then_block, out);
      __ring_match15: {
        const __ring_m15 = else_block;
        if (__ring_m15._tag === "some") {
          const eb = __ring_m15._0;
          return collect_expr_vars(eb, out);
          break __ring_match15;
        }
        if (__ring_m15._tag === "none") {
          break __ring_match15;
        }
        __match_fail(__ring_m15);
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "Break") {
      break __ring_match13;
    }
    if (__ring_m13._tag === "Continue") {
      break __ring_match13;
    }
    if (__ring_m13._tag === "Drop") {
      break __ring_match13;
    }
    if (__ring_m13._tag === "Dup") {
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
}

function collect_lambda_captures_expr(expr, out) {
  __ring_match16: {
    const __ring_m16 = expr;
    if (__ring_m16._tag === "Lambda") {
      const params = __ring_m16.params; const body = __ring_m16.body;
      let bound = set_new();
      const __ring_iter_13 = __List_Iterable.iter(params);
      while (true) {
        const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
        if (__ring_next_13._tag === "none") break;
        const p = __ring_next_13._0;
        _Set_insert(bound, p.name);
      }
      collect_local_defs_expr(body, bound);
      let body_vars = set_new();
      collect_expr_vars(body, body_vars);
      const __ring_iter_14 = ___Set_Iterable.iter(body_vars);
      while (true) {
        const __ring_next_14 = __SetIterator_Iterator.next(__ring_iter_14);
        if (__ring_next_14._tag === "none") break;
        const v = __ring_next_14._0;
        if ((_Set_contains(bound, v, __Str_Eq) === false)) {
          _Set_insert(out, v);
        }
      }
      return collect_lambda_captures_expr(body, out);
      break __ring_match16;
    }
    if (__ring_m16._tag === "BinOp") {
      const left = __ring_m16.left; const right = __ring_m16.right;
      collect_lambda_captures_expr(left, out);
      return collect_lambda_captures_expr(right, out);
      break __ring_match16;
    }
    if (__ring_m16._tag === "UnaryOp") {
      const operand = __ring_m16.operand;
      return collect_lambda_captures_expr(operand, out);
      break __ring_match16;
    }
    if (__ring_m16._tag === "Call") {
      const callee = __ring_m16.callee; const args = __ring_m16.args;
      collect_lambda_captures_expr(callee, out);
      const __ring_iter_15 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
        if (__ring_next_15._tag === "none") break;
        const a = __ring_next_15._0;
        collect_lambda_captures_expr(a, out);
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "FieldAccess") {
      const receiver = __ring_m16.receiver;
      return collect_lambda_captures_expr(receiver, out);
      break __ring_match16;
    }
    if (__ring_m16._tag === "StructLit") {
      const fields = __ring_m16.fields; const spread = __ring_m16.spread;
      const __ring_iter_16 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
        if (__ring_next_16._tag === "none") break;
        const f = __ring_next_16._0;
        collect_lambda_captures_expr(f.value, out);
      }
      __ring_match17: {
        const __ring_m17 = spread;
        if (__ring_m17._tag === "some") {
          const s = __ring_m17._0;
          return collect_lambda_captures_expr(s, out);
          break __ring_match17;
        }
        if (__ring_m17._tag === "none") {
          break __ring_match17;
        }
        __match_fail(__ring_m17);
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "NamedVariantConstruct") {
      const fields = __ring_m16.fields; const spread = __ring_m16.spread;
      const __ring_iter_17 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
        if (__ring_next_17._tag === "none") break;
        const f = __ring_next_17._0;
        collect_lambda_captures_expr(f.value, out);
      }
      __ring_match18: {
        const __ring_m18 = spread;
        if (__ring_m18._tag === "some") {
          const s = __ring_m18._0;
          return collect_lambda_captures_expr(s, out);
          break __ring_match18;
        }
        if (__ring_m18._tag === "none") {
          break __ring_match18;
        }
        __match_fail(__ring_m18);
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "MatchExpr") {
      const scrutinee = __ring_m16.scrutinee; const arms = __ring_m16.arms;
      collect_lambda_captures_expr(scrutinee, out);
      const __ring_iter_18 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
        if (__ring_next_18._tag === "none") break;
        const arm = __ring_next_18._0;
        collect_lambda_captures_expr(arm.body, out);
        __ring_match19: {
          const __ring_m19 = arm.guard;
          if (__ring_m19._tag === "some") {
            const g = __ring_m19._0;
            collect_lambda_captures_expr(g, out);
            break __ring_match19;
          }
          if (__ring_m19._tag === "none") {
            break __ring_match19;
          }
          __match_fail(__ring_m19);
        }
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "Block") {
      const stmts = __ring_m16.stmts; const tail = __ring_m16.tail;
      const __ring_iter_19 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
        if (__ring_next_19._tag === "none") break;
        const s = __ring_next_19._0;
        collect_lambda_captures_stmt(s, out);
      }
      __ring_match20: {
        const __ring_m20 = tail;
        if (__ring_m20._tag === "some") {
          const t = __ring_m20._0;
          return collect_lambda_captures_expr(t, out);
          break __ring_match20;
        }
        if (__ring_m20._tag === "none") {
          break __ring_match20;
        }
        __match_fail(__ring_m20);
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "IfExpr") {
      const condition = __ring_m16.condition; const then_branch = __ring_m16.then_branch; const else_branch = __ring_m16.else_branch;
      collect_lambda_captures_expr(condition, out);
      collect_lambda_captures_expr(then_branch, out);
      __ring_match21: {
        const __ring_m21 = else_branch;
        if (__ring_m21._tag === "some") {
          const eb = __ring_m21._0;
          return collect_lambda_captures_expr(eb, out);
          break __ring_match21;
        }
        if (__ring_m21._tag === "none") {
          break __ring_match21;
        }
        __match_fail(__ring_m21);
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "StringInterp") {
      const parts = __ring_m16.parts;
      const __ring_iter_20 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
        if (__ring_next_20._tag === "none") break;
        const p = __ring_next_20._0;
        __ring_match22: {
          const __ring_m22 = p;
          if (__ring_m22._tag === "Expression") {
            const e = __ring_m22._0;
            collect_lambda_captures_expr(e, out);
            break __ring_match22;
          }
          if (__ring_m22._tag === "Literal") {
            break __ring_match22;
          }
          __match_fail(__ring_m22);
        }
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "TryCatch") {
      const body = __ring_m16.body; const arms = __ring_m16.arms;
      collect_lambda_captures_expr(body, out);
      const __ring_iter_21 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
        if (__ring_next_21._tag === "none") break;
        const arm = __ring_next_21._0;
        collect_lambda_captures_expr(arm.body, out);
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "HandleExpr") {
      const body = __ring_m16.body; const handlers = __ring_m16.handlers;
      collect_lambda_captures_expr(body, out);
      const __ring_iter_22 = __List_Iterable.iter(handlers);
      while (true) {
        const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
        if (__ring_next_22._tag === "none") break;
        const h = __ring_next_22._0;
        collect_lambda_captures_expr(h.body, out);
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "EffectOp") {
      const args = __ring_m16.args;
      const __ring_iter_23 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
        if (__ring_next_23._tag === "none") break;
        const a = __ring_next_23._0;
        collect_lambda_captures_expr(a, out);
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "RangeExpr") {
      const start = __ring_m16.start; const end = __ring_m16.end;
      collect_lambda_captures_expr(start, out);
      return collect_lambda_captures_expr(end, out);
      break __ring_match16;
    }
    if (__ring_m16._tag === "ListLit") {
      const elements = __ring_m16.elements;
      const __ring_iter_24 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
        if (__ring_next_24._tag === "none") break;
        const e = __ring_next_24._0;
        collect_lambda_captures_expr(e, out);
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "TupleLit") {
      const elements = __ring_m16.elements;
      const __ring_iter_25 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
        if (__ring_next_25._tag === "none") break;
        const e = __ring_next_25._0;
        collect_lambda_captures_expr(e, out);
      }
      break __ring_match16;
    }
    if (__ring_m16._tag === "IndexExpr") {
      const receiver = __ring_m16.receiver; const index = __ring_m16.index;
      collect_lambda_captures_expr(receiver, out);
      return collect_lambda_captures_expr(index, out);
      break __ring_match16;
    }
    if (__ring_m16._tag === "Ident") {
      break __ring_match16;
    }
    if (__ring_m16._tag === "IntLit") {
      break __ring_match16;
    }
    if (__ring_m16._tag === "FloatLit") {
      break __ring_match16;
    }
    if (__ring_m16._tag === "StrLit") {
      break __ring_match16;
    }
    if (__ring_m16._tag === "BoolLit") {
      break __ring_match16;
    }
    __match_fail(__ring_m16);
  }
}

function collect_lambda_captures_stmt(stmt, out) {
  __ring_match23: {
    const __ring_m23 = stmt;
    if (__ring_m23._tag === "Let") {
      const init = __ring_m23.init;
      return collect_lambda_captures_expr(init, out);
      break __ring_match23;
    }
    if (__ring_m23._tag === "Var") {
      const init = __ring_m23.init;
      return collect_lambda_captures_expr(init, out);
      break __ring_match23;
    }
    if (__ring_m23._tag === "Assign") {
      const target = __ring_m23.target; const value = __ring_m23.value;
      collect_lambda_captures_expr(target, out);
      return collect_lambda_captures_expr(value, out);
      break __ring_match23;
    }
    if (__ring_m23._tag === "ExprStmt") {
      const expr = __ring_m23.expr;
      return collect_lambda_captures_expr(expr, out);
      break __ring_match23;
    }
    if (__ring_m23._tag === "Return") {
      const value = __ring_m23.value;
      __ring_match24: {
        const __ring_m24 = value;
        if (__ring_m24._tag === "some") {
          const v = __ring_m24._0;
          return collect_lambda_captures_expr(v, out);
          break __ring_match24;
        }
        if (__ring_m24._tag === "none") {
          break __ring_match24;
        }
        __match_fail(__ring_m24);
      }
      break __ring_match23;
    }
    if (__ring_m23._tag === "While") {
      const condition = __ring_m23.condition; const body = __ring_m23.body;
      collect_lambda_captures_expr(condition, out);
      return collect_lambda_captures_expr(body, out);
      break __ring_match23;
    }
    if (__ring_m23._tag === "ForIn") {
      const iterable = __ring_m23.iterable; const body = __ring_m23.body;
      collect_lambda_captures_expr(iterable, out);
      return collect_lambda_captures_expr(body, out);
      break __ring_match23;
    }
    if (__ring_m23._tag === "LetDestructure") {
      const init = __ring_m23.init;
      return collect_lambda_captures_expr(init, out);
      break __ring_match23;
    }
    if (__ring_m23._tag === "IfLet") {
      const expr = __ring_m23.expr; const then_block = __ring_m23.then_block; const else_block = __ring_m23.else_block;
      collect_lambda_captures_expr(expr, out);
      collect_lambda_captures_expr(then_block, out);
      __ring_match25: {
        const __ring_m25 = else_block;
        if (__ring_m25._tag === "some") {
          const eb = __ring_m25._0;
          return collect_lambda_captures_expr(eb, out);
          break __ring_match25;
        }
        if (__ring_m25._tag === "none") {
          break __ring_match25;
        }
        __match_fail(__ring_m25);
      }
      break __ring_match23;
    }
    if (__ring_m23._tag === "Break") {
      break __ring_match23;
    }
    if (__ring_m23._tag === "Continue") {
      break __ring_match23;
    }
    if (__ring_m23._tag === "Drop") {
      break __ring_match23;
    }
    if (__ring_m23._tag === "Dup") {
      break __ring_match23;
    }
    __match_fail(__ring_m23);
  }
}

function pattern_binding_names(pat, out) {
  __ring_match26: {
    const __ring_m26 = pat;
    if (__ring_m26._tag === "Wildcard") {
      break __ring_match26;
    }
    if (__ring_m26._tag === "Literal") {
      break __ring_match26;
    }
    if (__ring_m26._tag === "Binding") {
      const name = __ring_m26.name;
      return List_push(out, name);
      break __ring_match26;
    }
    if (__ring_m26._tag === "Constructor") {
      const fields = __ring_m26.fields;
      const __ring_iter_26 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
        if (__ring_next_26._tag === "none") break;
        const f = __ring_next_26._0;
        pattern_binding_names(f, out);
      }
      break __ring_match26;
    }
    if (__ring_m26._tag === "NamedConstructor") {
      const fields = __ring_m26.fields;
      const __ring_iter_27 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
        if (__ring_next_27._tag === "none") break;
        const f = __ring_next_27._0;
        pattern_binding_names(f.pattern, out);
      }
      break __ring_match26;
    }
    if (__ring_m26._tag === "TuplePattern") {
      const elements = __ring_m26.elements;
      const __ring_iter_28 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_28 = __ListIterator_Iterator.next(__ring_iter_28);
        if (__ring_next_28._tag === "none") break;
        const e = __ring_next_28._0;
        pattern_binding_names(e, out);
      }
      break __ring_match26;
    }
    if (__ring_m26._tag === "OrPattern") {
      const patterns = __ring_m26.patterns;
      if ((List_len(patterns) > 0)) {
        __ring_match27: {
          const __ring_m27 = List_get(patterns, 0);
          if (__ring_m27._tag === "some") {
            const p = __ring_m27._0;
            return pattern_binding_names(p, out);
            break __ring_match27;
          }
          if (__ring_m27._tag === "none") {
            break __ring_match27;
          }
          __match_fail(__ring_m27);
        }
      }
      break __ring_match26;
    }
    __match_fail(__ring_m26);
  }
}

function collect_local_defs_stmts(stmts, out) {
  const __ring_iter_29 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
    if (__ring_next_29._tag === "none") break;
    const stmt = __ring_next_29._0;
    __ring_match28: {
      const __ring_m28 = stmt;
      if (__ring_m28._tag === "Let") {
        const name = __ring_m28.name;
        _Set_insert(out, name);
        break __ring_match28;
      }
      if (__ring_m28._tag === "Var") {
        const name = __ring_m28.name;
        _Set_insert(out, name);
        break __ring_match28;
      }
      if (__ring_m28._tag === "LetDestructure") {
        const pattern = __ring_m28.pattern; const bindings = __ring_m28.bindings;
        const __ring_iter_30 = __List_Iterable.iter(bindings);
        while (true) {
          const __ring_next_30 = __ListIterator_Iterator.next(__ring_iter_30);
          if (__ring_next_30._tag === "none") break;
          const b = __ring_next_30._0;
          _Set_insert(out, b.name);
        }
        break __ring_match28;
      }
      if (__ring_m28._tag === "ForIn") {
        const binding = __ring_m28.binding; const body = __ring_m28.body;
        _Set_insert(out, binding);
        collect_local_defs_expr(body, out);
        break __ring_match28;
      }
      if (__ring_m28._tag === "While") {
        const body = __ring_m28.body;
        collect_local_defs_expr(body, out);
        break __ring_match28;
      }
      if (__ring_m28._tag === "IfLet") {
        const pattern = __ring_m28.pattern; const then_block = __ring_m28.then_block; const else_block = __ring_m28.else_block;
        let pat_names = [];
        pattern_binding_names(pattern, pat_names);
        const __ring_iter_31 = __List_Iterable.iter(pat_names);
        while (true) {
          const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
          if (__ring_next_31._tag === "none") break;
          const pn = __ring_next_31._0;
          _Set_insert(out, pn);
        }
        collect_local_defs_expr(then_block, out);
        __ring_match29: {
          const __ring_m29 = else_block;
          if (__ring_m29._tag === "some") {
            const e = __ring_m29._0;
            collect_local_defs_expr(e, out);
            break __ring_match29;
          }
          if (__ring_m29._tag === "none") {
            break __ring_match29;
          }
          __match_fail(__ring_m29);
        }
        break __ring_match28;
      }
      if (__ring_m28._tag === "ExprStmt") {
        const expr = __ring_m28.expr;
        collect_local_defs_expr(expr, out);
        break __ring_match28;
      }
      if (__ring_m28._tag === "Return") {
        const value = __ring_m28.value;
        __ring_match30: {
          const __ring_m30 = value;
          if (__ring_m30._tag === "some") {
            const v = __ring_m30._0;
            collect_local_defs_expr(v, out);
            break __ring_match30;
          }
          if (__ring_m30._tag === "none") {
            break __ring_match30;
          }
          __match_fail(__ring_m30);
        }
        break __ring_match28;
      }
      if (__ring_m28._tag === "Assign") {
        const value = __ring_m28.value;
        collect_local_defs_expr(value, out);
        break __ring_match28;
      }
      if (__ring_m28._tag === "Break") {
        break __ring_match28;
      }
      if (__ring_m28._tag === "Continue") {
        break __ring_match28;
      }
      if (__ring_m28._tag === "Drop") {
        break __ring_match28;
      }
      if (__ring_m28._tag === "Dup") {
        break __ring_match28;
      }
      __match_fail(__ring_m28);
    }
  }
}

function collect_local_defs_expr(expr, out) {
  __ring_match31: {
    const __ring_m31 = expr;
    if (__ring_m31._tag === "Block") {
      const stmts = __ring_m31.stmts; const tail = __ring_m31.tail;
      collect_local_defs_stmts(stmts, out);
      __ring_match32: {
        const __ring_m32 = tail;
        if (__ring_m32._tag === "some") {
          const t = __ring_m32._0;
          return collect_local_defs_expr(t, out);
          break __ring_match32;
        }
        if (__ring_m32._tag === "none") {
          break __ring_match32;
        }
        __match_fail(__ring_m32);
      }
      break __ring_match31;
    }
    if (__ring_m31._tag === "IfExpr") {
      const then_branch = __ring_m31.then_branch; const else_branch = __ring_m31.else_branch;
      collect_local_defs_expr(then_branch, out);
      __ring_match33: {
        const __ring_m33 = else_branch;
        if (__ring_m33._tag === "some") {
          const e = __ring_m33._0;
          return collect_local_defs_expr(e, out);
          break __ring_match33;
        }
        if (__ring_m33._tag === "none") {
          break __ring_match33;
        }
        __match_fail(__ring_m33);
      }
      break __ring_match31;
    }
    if (__ring_m31._tag === "MatchExpr") {
      const arms = __ring_m31.arms;
      const __ring_iter_32 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_32 = __ListIterator_Iterator.next(__ring_iter_32);
        if (__ring_next_32._tag === "none") break;
        const arm = __ring_next_32._0;
        let pat_names = [];
        pattern_binding_names(arm.pattern, pat_names);
        const __ring_iter_33 = __List_Iterable.iter(pat_names);
        while (true) {
          const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
          if (__ring_next_33._tag === "none") break;
          const pn = __ring_next_33._0;
          _Set_insert(out, pn);
        }
        collect_local_defs_expr(arm.body, out);
      }
      break __ring_match31;
    }
    if (__ring_m31._tag === "TryCatch") {
      const body = __ring_m31.body; const arms = __ring_m31.arms;
      collect_local_defs_expr(body, out);
      const __ring_iter_34 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_34 = __ListIterator_Iterator.next(__ring_iter_34);
        if (__ring_next_34._tag === "none") break;
        const arm = __ring_next_34._0;
        let pat_names = [];
        pattern_binding_names(arm.pattern, pat_names);
        const __ring_iter_35 = __List_Iterable.iter(pat_names);
        while (true) {
          const __ring_next_35 = __ListIterator_Iterator.next(__ring_iter_35);
          if (__ring_next_35._tag === "none") break;
          const pn = __ring_next_35._0;
          _Set_insert(out, pn);
        }
        collect_local_defs_expr(arm.body, out);
      }
      break __ring_match31;
    }
    if (__ring_m31._tag === "Lambda") {
      break __ring_match31;
    }
    break __ring_match31;
  }
}

function perceus_transform(program) {
  const new_decls = transform_decls(program.decls, program.boxed_vars);
  return new hir$HProgram(new_decls, program.derived_impls, program.boxed_vars);
}

function transform_decls(decls, boxed) {
  let result = [];
  const __ring_iter_36 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_36 = __ListIterator_Iterator.next(__ring_iter_36);
    if (__ring_next_36._tag === "none") break;
    const d = __ring_next_36._0;
    List_push(result, transform_decl(d, boxed));
  }
  return result;
}

function transform_decl(decl, boxed) {
  __ring_match34: {
    const __ring_m34 = decl;
    if (__ring_m34._tag === "Fn") {
      const name = __ring_m34.name; const def_id = __ring_m34.def_id; const type_params = __ring_m34.type_params; const params = __ring_m34.params; const return_type = __ring_m34.return_type; const effects = __ring_m34.effects; const body = __ring_m34.body; const is_pub = __ring_m34.is_pub; const trait_bounds = __ring_m34.trait_bounds; const span = __ring_m34.span;
      const new_body = transform_fn_body(params, body, boxed);
      return hir$HDecl_Fn(name, def_id, type_params, params, return_type, effects, new_body, is_pub, trait_bounds, span);
      break __ring_match34;
    }
    if (__ring_m34._tag === "Impl") {
      const target_type = __ring_m34.target_type; const type_params = __ring_m34.type_params; const trait_name = __ring_m34.trait_name; const methods = __ring_m34.methods; const assoc_types = __ring_m34.assoc_types; const span = __ring_m34.span;
      const new_methods = transform_decls(methods, boxed);
      return hir$HDecl_Impl(target_type, type_params, trait_name, new_methods, assoc_types, span);
      break __ring_match34;
    }
    if (__ring_m34._tag === "Test") {
      const description = __ring_m34.description; const body = __ring_m34.body; const span = __ring_m34.span;
      const new_body = transform_fn_body([], body, boxed);
      return hir$HDecl_Test(description, new_body, span);
      break __ring_match34;
    }
    if (__ring_m34._tag === "Const") {
      const name = __ring_m34.name; const def_id = __ring_m34.def_id; const ty = __ring_m34.ty; const init = __ring_m34.init; const is_pub = __ring_m34.is_pub; const span = __ring_m34.span;
      const live = set_new();
      const locals = set_new();
      const result = rc_expr(init, live, locals, boxed);
      const init_flushed = flush_dups_into_expr(result.expr, result.dups);
      return hir$HDecl_Const(name, def_id, ty, init_flushed, is_pub, span);
      break __ring_match34;
    }
    if (__ring_m34._tag === "ModBlock") {
      const name = __ring_m34.name; const mod_decls = __ring_m34.decls; const is_pub = __ring_m34.is_pub; const span = __ring_m34.span;
      return hir$HDecl_ModBlock(name, transform_decls(mod_decls, boxed), is_pub, span);
      break __ring_match34;
    }
    if (__ring_m34._tag === "Struct") {
      return decl;
      break __ring_match34;
    }
    if (__ring_m34._tag === "Enum") {
      return decl;
      break __ring_match34;
    }
    if (__ring_m34._tag === "Effect") {
      return decl;
      break __ring_match34;
    }
    if (__ring_m34._tag === "Trait") {
      return decl;
      break __ring_match34;
    }
    if (__ring_m34._tag === "ExternFn") {
      return decl;
      break __ring_match34;
    }
    if (__ring_m34._tag === "ExternType") {
      return decl;
      break __ring_match34;
    }
    if (__ring_m34._tag === "TypeAlias") {
      return decl;
      break __ring_match34;
    }
    if (__ring_m34._tag === "Sig") {
      return decl;
      break __ring_match34;
    }
    __match_fail(__ring_m34);
  }
}

function transform_fn_body(params, body, boxed) {
  let locals = set_new();
  const __ring_iter_37 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_37 = __ListIterator_Iterator.next(__ring_iter_37);
    if (__ring_next_37._tag === "none") break;
    const p = __ring_next_37._0;
    _Set_insert(locals, p.name);
  }
  collect_local_defs_expr(body, locals);
  const live = set_new();
  const result = rc_expr(body, live, locals, boxed);
  const remaining_live = result.live;
  const body_flushed = flush_dups_into_expr(result.expr, result.dups);
  let param_drops = [];
  const __ring_iter_38 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_38 = __ListIterator_Iterator.next(__ring_iter_38);
    if (__ring_next_38._tag === "none") break;
    const p = __ring_next_38._0;
    if (((_Set_contains(remaining_live, p.name, __Str_Eq) === false) && (rc_name_skippable(p.name) === false))) {
      List_push(param_drops, hir$HStmt_Drop(p.name, p.ty, synthetic_span()));
    }
  }
  if ((List_len(param_drops) === 0)) {
    return body_flushed;
  }
  __ring_match35: {
    const __ring_m35 = body_flushed;
    if (__ring_m35._tag === "Block") {
      const stmts = __ring_m35.stmts; const tail = __ring_m35.tail; const ty = __ring_m35.ty; const effects = __ring_m35.effects; const span = __ring_m35.span;
      const new_stmts = List_concat(param_drops, stmts);
      return hir$HExpr_Block(new_stmts, tail, ty, effects, span);
      break __ring_match35;
    }
    const ty = hir$hexpr_type(body_flushed);
    const effects = hir$hexpr_effects(body_flushed);
    const span = hir$hexpr_span(body_flushed);
    return hir$HExpr_Block(param_drops, Option_some(body_flushed), ty, effects, span);
    break __ring_match35;
  }
}

class RcResult {
  constructor(expr, live, dups) {
    this.expr = expr;
    this.live = live;
    this.dups = dups;
  }
}

class RcStmtsResult {
  constructor(stmts, live) {
    this.stmts = stmts;
    this.live = live;
  }
}

function rc_stmts(stmts, live, locals, boxed) {
  let result = [];
  let cur_live = live;
  let i = (List_len(stmts) - 1);
  while ((i >= 0)) {
    __ring_match36: {
      const __ring_m36 = List_get(stmts, i);
      if (__ring_m36._tag === "some") {
        const stmt = __ring_m36._0;
        const r = rc_stmt(stmt, cur_live, locals, boxed);
        let j = (List_len(r.stmts) - 1);
        while ((j >= 0)) {
          __ring_match37: {
            const __ring_m37 = List_get(r.stmts, j);
            if (__ring_m37._tag === "some") {
              const s = __ring_m37._0;
              List_push(result, s);
              break __ring_match37;
            }
            if (__ring_m37._tag === "none") {
              break __ring_match37;
            }
            __match_fail(__ring_m37);
          }
          j = (j - 1);
        }
        cur_live = r.live;
        break __ring_match36;
      }
      if (__ring_m36._tag === "none") {
        break __ring_match36;
      }
      __match_fail(__ring_m36);
    }
    i = (i - 1);
  }
  List_reverse(result);
  return new RcStmtsResult(result, cur_live);
}

function rc_stmt(stmt, live, locals, boxed) {
  __ring_match38: {
    const __ring_m38 = stmt;
    if (__ring_m38._tag === "Let") {
      const name = __ring_m38.name; const name_span = __ring_m38.name_span; const def_id = __ring_m38.def_id; const ty = __ring_m38.ty; const init = __ring_m38.init; const span = __ring_m38.span;
      const init_result = rc_expr(init, live, locals, boxed);
      let cur_live = init_result.live;
      let out = dups_to_stmts(init_result.dups);
      List_push(out, hir$HStmt_Let(name, name_span, def_id, ty, init_result.expr, span));
      if (_Set_contains(cur_live, name, __Str_Eq)) {
        _Set_remove(cur_live, name);
      } else {
        if ((rc_name_skippable(name) === false)) {
          List_push(out, hir$HStmt_Drop(name, ty, synthetic_span()));
        }
      }
      return new RcStmtsResult(out, cur_live);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Var") {
      const name = __ring_m38.name; const name_span = __ring_m38.name_span; const def_id = __ring_m38.def_id; const ty = __ring_m38.ty; const init = __ring_m38.init; const span = __ring_m38.span;
      const init_result = rc_expr(init, live, locals, boxed);
      let cur_live = init_result.live;
      let out = dups_to_stmts(init_result.dups);
      List_push(out, hir$HStmt_Var(name, name_span, def_id, ty, init_result.expr, span));
      if (_Set_contains(cur_live, name, __Str_Eq)) {
        _Set_remove(cur_live, name);
      } else {
        if ((rc_name_skippable(name) === false)) {
          List_push(out, hir$HStmt_Drop(name, ty, synthetic_span()));
        }
      }
      return new RcStmtsResult(out, cur_live);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Assign") {
      const target = __ring_m38.target; const value = __ring_m38.value; const span = __ring_m38.span;
      const val_result = rc_expr(value, live, locals, boxed);
      let out = dups_to_stmts(val_result.dups);
      __ring_match39: {
        const __ring_m39 = target;
        if (__ring_m39._tag === "Ident") {
          const name = __ring_m39.name; const def_id = __ring_m39.def_id; const ty = __ring_m39.ty;
          const is_boxed = (function() {
  const __ring_m = def_id;
  if (__ring_m._tag === "some") { const did = __ring_m._0; return _Set_contains(boxed, did, __Int_Eq); }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
          if ((is_boxed === false)) {
            List_push(out, hir$HStmt_Drop(name, ty, synthetic_span()));
          }
          break __ring_match39;
        }
        break __ring_match39;
      }
      List_push(out, hir$HStmt_Assign(target, val_result.expr, span));
      return new RcStmtsResult(out, val_result.live);
      break __ring_match38;
    }
    if (__ring_m38._tag === "ExprStmt") {
      const expr = __ring_m38.expr; const span = __ring_m38.span;
      const r = rc_expr(expr, live, locals, boxed);
      let out = dups_to_stmts(r.dups);
      List_push(out, hir$HStmt_ExprStmt(r.expr, span));
      return new RcStmtsResult(out, r.live);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Return") {
      const value = __ring_m38.value; const span = __ring_m38.span;
      __ring_match40: {
        const __ring_m40 = value;
        if (__ring_m40._tag === "some") {
          const v = __ring_m40._0;
          const r = rc_expr(v, live, locals, boxed);
          let out = dups_to_stmts(r.dups);
          const __ring_iter_39 = __List_Iterable.iter(sorted_set_names(r.live));
          while (true) {
            const __ring_next_39 = __ListIterator_Iterator.next(__ring_iter_39);
            if (__ring_next_39._tag === "none") break;
            const name = __ring_next_39._0;
            List_push(out, hir$HStmt_Drop(name, types$Type_UnitType, synthetic_span()));
          }
          List_push(out, hir$HStmt_Return(Option_some(r.expr), span));
          return new RcStmtsResult(out, set_new());
          break __ring_match40;
        }
        if (__ring_m40._tag === "none") {
          let out = [];
          const __ring_iter_40 = __List_Iterable.iter(sorted_set_names(live));
          while (true) {
            const __ring_next_40 = __ListIterator_Iterator.next(__ring_iter_40);
            if (__ring_next_40._tag === "none") break;
            const name = __ring_next_40._0;
            List_push(out, hir$HStmt_Drop(name, types$Type_UnitType, synthetic_span()));
          }
          List_push(out, hir$HStmt_Return(Option_none, span));
          return new RcStmtsResult(out, set_new());
          break __ring_match40;
        }
        __match_fail(__ring_m40);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "While") {
      const condition = __ring_m38.condition; const body = __ring_m38.body; const span = __ring_m38.span;
      let loop_vars = set_new();
      collect_expr_vars(condition, loop_vars);
      collect_expr_vars(body, loop_vars);
      let loop_captures = set_new();
      collect_lambda_captures_expr(condition, loop_captures);
      collect_lambda_captures_expr(body, loop_captures);
      let local_loop_captures = set_new();
      const __ring_iter_41 = ___Set_Iterable.iter(loop_captures);
      while (true) {
        const __ring_next_41 = __SetIterator_Iterator.next(__ring_iter_41);
        if (__ring_next_41._tag === "none") break;
        const v = __ring_next_41._0;
        if (_Set_contains(locals, v, __Str_Eq)) {
          _Set_insert(local_loop_captures, v);
        }
      }
      let seeded_live = set_clone(live);
      const __ring_iter_42 = ___Set_Iterable.iter(local_loop_captures);
      while (true) {
        const __ring_next_42 = __SetIterator_Iterator.next(__ring_iter_42);
        if (__ring_next_42._tag === "none") break;
        const v = __ring_next_42._0;
        _Set_insert(seeded_live, v);
      }
      const body_result = rc_expr(body, seeded_live, locals, boxed);
      const cond_result = rc_expr(condition, body_result.live, locals, boxed);
      let cur_live = cond_result.live;
      const cond_flushed = flush_dups_into_expr(cond_result.expr, cond_result.dups);
      const body_flushed = flush_dups_into_expr(body_result.expr, body_result.dups);
      const __ring_iter_43 = ___Set_Iterable.iter(local_loop_captures);
      while (true) {
        const __ring_next_43 = __SetIterator_Iterator.next(__ring_iter_43);
        if (__ring_next_43._tag === "none") break;
        const v = __ring_next_43._0;
        if (_Set_contains(live, v, __Str_Eq)) {
          _Set_insert(cur_live, v);
        } else {
          _Set_remove(cur_live, v);
        }
      }
      let out = [];
      const __ring_iter_44 = __List_Iterable.iter(sorted_set_names(loop_vars));
      while (true) {
        const __ring_next_44 = __ListIterator_Iterator.next(__ring_iter_44);
        if (__ring_next_44._tag === "none") break;
        const v = __ring_next_44._0;
        if (((_Set_contains(cur_live, v, __Str_Eq) && (_Set_contains(local_loop_captures, v, __Str_Eq) === false)) && (rc_name_skippable(v) === false))) {
          List_push(out, hir$HStmt_Dup(v, types$Type_UnitType, synthetic_span()));
        }
      }
      List_push(out, hir$HStmt_While(cond_flushed, body_flushed, span));
      return new RcStmtsResult(out, cur_live);
      break __ring_match38;
    }
    if (__ring_m38._tag === "ForIn") {
      const binding = __ring_m38.binding; const binding_span = __ring_m38.binding_span; const def_id = __ring_m38.def_id; const destructure = __ring_m38.destructure; const iterable = __ring_m38.iterable; const body = __ring_m38.body; const iterable_type_name = __ring_m38.iterable_type_name; const iter_type_name = __ring_m38.iter_type_name; const span = __ring_m38.span;
      let loop_vars = set_new();
      collect_expr_vars(iterable, loop_vars);
      collect_expr_vars(body, loop_vars);
      let loop_captures = set_new();
      collect_lambda_captures_expr(body, loop_captures);
      let local_loop_captures = set_new();
      const __ring_iter_45 = ___Set_Iterable.iter(loop_captures);
      while (true) {
        const __ring_next_45 = __SetIterator_Iterator.next(__ring_iter_45);
        if (__ring_next_45._tag === "none") break;
        const v = __ring_next_45._0;
        if ((_Set_contains(locals, v, __Str_Eq) && (v !== binding))) {
          _Set_insert(local_loop_captures, v);
        }
      }
      __ring_match41: {
        const __ring_m41 = destructure;
        if (__ring_m41._tag === "some") {
          const ds = __ring_m41._0;
          const __ring_iter_46 = __List_Iterable.iter(ds);
          while (true) {
            const __ring_next_46 = __ListIterator_Iterator.next(__ring_iter_46);
            if (__ring_next_46._tag === "none") break;
            const d = __ring_next_46._0;
            _Set_remove(local_loop_captures, d.name);
          }
          break __ring_match41;
        }
        if (__ring_m41._tag === "none") {
          break __ring_match41;
        }
        __match_fail(__ring_m41);
      }
      let seeded_live = set_clone(live);
      const __ring_iter_47 = ___Set_Iterable.iter(local_loop_captures);
      while (true) {
        const __ring_next_47 = __SetIterator_Iterator.next(__ring_iter_47);
        if (__ring_next_47._tag === "none") break;
        const v = __ring_next_47._0;
        _Set_insert(seeded_live, v);
      }
      const body_result = rc_expr(body, seeded_live, locals, boxed);
      const iter_result = rc_expr(iterable, body_result.live, locals, boxed);
      let cur_live = iter_result.live;
      _Set_remove(cur_live, binding);
      __ring_match42: {
        const __ring_m42 = destructure;
        if (__ring_m42._tag === "some") {
          const ds = __ring_m42._0;
          const __ring_iter_48 = __List_Iterable.iter(ds);
          while (true) {
            const __ring_next_48 = __ListIterator_Iterator.next(__ring_iter_48);
            if (__ring_next_48._tag === "none") break;
            const d = __ring_next_48._0;
            _Set_remove(cur_live, d.name);
          }
          break __ring_match42;
        }
        if (__ring_m42._tag === "none") {
          break __ring_match42;
        }
        __match_fail(__ring_m42);
      }
      const __ring_iter_49 = ___Set_Iterable.iter(local_loop_captures);
      while (true) {
        const __ring_next_49 = __SetIterator_Iterator.next(__ring_iter_49);
        if (__ring_next_49._tag === "none") break;
        const v = __ring_next_49._0;
        if (_Set_contains(live, v, __Str_Eq)) {
          _Set_insert(cur_live, v);
        } else {
          _Set_remove(cur_live, v);
        }
      }
      let out = dups_to_stmts(iter_result.dups);
      const __ring_iter_50 = __List_Iterable.iter(sorted_set_names(loop_vars));
      while (true) {
        const __ring_next_50 = __ListIterator_Iterator.next(__ring_iter_50);
        if (__ring_next_50._tag === "none") break;
        const v = __ring_next_50._0;
        if (((_Set_contains(cur_live, v, __Str_Eq) && (_Set_contains(local_loop_captures, v, __Str_Eq) === false)) && (rc_name_skippable(v) === false))) {
          List_push(out, hir$HStmt_Dup(v, types$Type_UnitType, synthetic_span()));
        }
      }
      const body_flushed = flush_dups_into_expr(body_result.expr, body_result.dups);
      List_push(out, hir$HStmt_ForIn(binding, binding_span, def_id, destructure, iter_result.expr, body_flushed, iterable_type_name, iter_type_name, span));
      return new RcStmtsResult(out, cur_live);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Break") {
      const span = __ring_m38.span;
      return new RcStmtsResult([hir$HStmt_Break(span)], live);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Continue") {
      const span = __ring_m38.span;
      return new RcStmtsResult([hir$HStmt_Continue(span)], live);
      break __ring_match38;
    }
    if (__ring_m38._tag === "LetDestructure") {
      const pattern = __ring_m38.pattern; const bindings = __ring_m38.bindings; const init = __ring_m38.init; const span = __ring_m38.span;
      const init_result = rc_expr(init, live, locals, boxed);
      let cur_live = init_result.live;
      let bound = [];
      const __ring_iter_51 = __List_Iterable.iter(bindings);
      while (true) {
        const __ring_next_51 = __ListIterator_Iterator.next(__ring_iter_51);
        if (__ring_next_51._tag === "none") break;
        const b = __ring_next_51._0;
        List_push(bound, b.name);
      }
      let out = dups_to_stmts(init_result.dups);
      List_push(out, hir$HStmt_LetDestructure(pattern, bindings, init_result.expr, span));
      const __ring_iter_52 = __List_Iterable.iter(bindings);
      while (true) {
        const __ring_next_52 = __ListIterator_Iterator.next(__ring_iter_52);
        if (__ring_next_52._tag === "none") break;
        const b = __ring_next_52._0;
        if (_Set_contains(cur_live, b.name, __Str_Eq)) {
          _Set_remove(cur_live, b.name);
        } else {
          if ((rc_name_skippable(b.name) === false)) {
            List_push(out, hir$HStmt_Drop(b.name, b.ty, synthetic_span()));
          }
        }
      }
      return new RcStmtsResult(out, cur_live);
      break __ring_match38;
    }
    if (__ring_m38._tag === "IfLet") {
      const pattern = __ring_m38.pattern; const expr = __ring_m38.expr; const then_block = __ring_m38.then_block; const else_block = __ring_m38.else_block; const span = __ring_m38.span;
      const then_result = rc_expr(then_block, set_clone(live), locals, boxed);
      const else_result = (function() {
  const __ring_m = else_block;
  if (__ring_m._tag === "some") { const eb = __ring_m._0; return (function() {
  const r = rc_expr(eb, set_clone(live), locals, boxed);
  return Option_some(r);
})(); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      const live_then = then_result.live;
      const live_else = (function() {
  const __ring_m = else_result;
  if (__ring_m._tag === "some") { const r = __ring_m._0; return r.live; }
  if (__ring_m._tag === "none") { return set_clone(live); }
  __match_fail(__ring_m);
})();
      const then_flushed = flush_dups_into_expr(then_result.expr, then_result.dups);
      const balanced_then = balance_branch(then_flushed, live_then, live_else);
      const balanced_else = (function() {
  const __ring_m = else_result;
  if (__ring_m._tag === "some") { const r = __ring_m._0; return (function() {
  const else_flushed = flush_dups_into_expr(r.expr, r.dups);
  return Option_some(balance_branch(else_flushed, live_else, live_then));
})(); }
  if (__ring_m._tag === "none") { return (function() {
  const drops = make_drop_list(_Set_difference(live_then, live_else));
  if ((List_len(drops) > 0)) {
    const ty = hir$hexpr_type(then_result.expr);
    const effects = hir$hexpr_effects(then_result.expr);
    return Option_some(hir$HExpr_Block(drops, Option_none, types$Type_UnitType, effects, synthetic_span()));
  } else {
    return Option_none;
  }
})(); }
  __match_fail(__ring_m);
})();
      const merged_live = _Set_union(live_then, live_else);
      let pat_names = [];
      pattern_binding_names(pattern, pat_names);
      let final_live = merged_live;
      const __ring_iter_53 = __List_Iterable.iter(pat_names);
      while (true) {
        const __ring_next_53 = __ListIterator_Iterator.next(__ring_iter_53);
        if (__ring_next_53._tag === "none") break;
        const pn = __ring_next_53._0;
        _Set_remove(final_live, pn);
      }
      const expr_result = rc_expr(expr, final_live, locals, boxed);
      let out = dups_to_stmts(expr_result.dups);
      List_push(out, hir$HStmt_IfLet(pattern, expr_result.expr, balanced_then, balanced_else, span));
      return new RcStmtsResult(out, expr_result.live);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Drop") {
      return new RcStmtsResult([stmt], live);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Dup") {
      return new RcStmtsResult([stmt], live);
      break __ring_match38;
    }
    __match_fail(__ring_m38);
  }
}

function rc_expr(expr, live, locals, boxed) {
  __ring_match43: {
    const __ring_m43 = expr;
    if (__ring_m43._tag === "Ident") {
      const name = __ring_m43.name; const resolved_name = __ring_m43.resolved_name; const def_id = __ring_m43.def_id; const dict_closure_dicts = __ring_m43.dict_closure_dicts; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      if ((!_Set_contains(locals, name, __Str_Eq))) {
        return new RcResult(expr, live, []);
      } else {
        if (_Set_contains(live, name, __Str_Eq)) {
          return new RcResult(expr, live, [name]);
        } else {
          _Set_insert(live, name);
          return new RcResult(hir$HExpr_Ident(name, resolved_name, def_id, dict_closure_dicts, ty, effects, span), live, []);
        }
      }
      break __ring_match43;
    }
    if (__ring_m43._tag === "IntLit") {
      return new RcResult(expr, live, []);
      break __ring_match43;
    }
    if (__ring_m43._tag === "FloatLit") {
      return new RcResult(expr, live, []);
      break __ring_match43;
    }
    if (__ring_m43._tag === "StrLit") {
      return new RcResult(expr, live, []);
      break __ring_match43;
    }
    if (__ring_m43._tag === "BoolLit") {
      return new RcResult(expr, live, []);
      break __ring_match43;
    }
    if (__ring_m43._tag === "BinOp") {
      const op = __ring_m43.op; const left = __ring_m43.left; const right = __ring_m43.right; const eq_dispatch = __ring_m43.eq_dispatch; const ord_dispatch = __ring_m43.ord_dispatch; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      const r_result = rc_expr(right, live, locals, boxed);
      const l_result = rc_expr(left, r_result.live, locals, boxed);
      __ring_match44: {
        const __ring_m44 = op;
        if (__ring_m44._tag === "And") {
          const new_right = flush_dups_into_expr(r_result.expr, r_result.dups);
          return new RcResult(hir$HExpr_BinOp(op, l_result.expr, new_right, eq_dispatch, ord_dispatch, ty, effects, span), l_result.live, l_result.dups);
          break __ring_match44;
        }
        if (__ring_m44._tag === "Or") {
          const new_right = flush_dups_into_expr(r_result.expr, r_result.dups);
          return new RcResult(hir$HExpr_BinOp(op, l_result.expr, new_right, eq_dispatch, ord_dispatch, ty, effects, span), l_result.live, l_result.dups);
          break __ring_match44;
        }
        return new RcResult(hir$HExpr_BinOp(op, l_result.expr, r_result.expr, eq_dispatch, ord_dispatch, ty, effects, span), l_result.live, List_concat(l_result.dups, r_result.dups));
        break __ring_match44;
      }
      break __ring_match43;
    }
    if (__ring_m43._tag === "UnaryOp") {
      const op = __ring_m43.op; const operand = __ring_m43.operand; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      const r = rc_expr(operand, live, locals, boxed);
      return new RcResult(hir$HExpr_UnaryOp(op, r.expr, ty, effects, span), r.live, r.dups);
      break __ring_match43;
    }
    if (__ring_m43._tag === "Call") {
      const callee = __ring_m43.callee; const args = __ring_m43.args; const type_args = __ring_m43.type_args; const resolved_dicts = __ring_m43.resolved_dicts; const dict_dispatch = __ring_m43.dict_dispatch; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      let cur_live = live;
      let new_args = [];
      let arg_dups_rev = [];
      let i = (List_len(args) - 1);
      while ((i >= 0)) {
        __ring_match45: {
          const __ring_m45 = List_get(args, i);
          if (__ring_m45._tag === "some") {
            const a = __ring_m45._0;
            const r = rc_expr(a, cur_live, locals, boxed);
            List_push(new_args, r.expr);
            const __ring_iter_54 = __List_Iterable.iter(r.dups);
            while (true) {
              const __ring_next_54 = __ListIterator_Iterator.next(__ring_iter_54);
              if (__ring_next_54._tag === "none") break;
              const d = __ring_next_54._0;
              List_push(arg_dups_rev, d);
            }
            cur_live = r.live;
            break __ring_match45;
          }
          if (__ring_m45._tag === "none") {
            break __ring_match45;
          }
          __match_fail(__ring_m45);
        }
        i = (i - 1);
      }
      List_reverse(new_args);
      List_reverse(arg_dups_rev);
      const callee_result = rc_expr(callee, cur_live, locals, boxed);
      return new RcResult(hir$HExpr_Call(callee_result.expr, new_args, type_args, resolved_dicts, dict_dispatch, ty, effects, span), callee_result.live, List_concat(arg_dups_rev, callee_result.dups));
      break __ring_match43;
    }
    if (__ring_m43._tag === "FieldAccess") {
      const receiver = __ring_m43.receiver; const field = __ring_m43.field; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      const r = rc_expr(receiver, live, locals, boxed);
      return new RcResult(hir$HExpr_FieldAccess(r.expr, field, ty, effects, span), r.live, r.dups);
      break __ring_match43;
    }
    if (__ring_m43._tag === "StructLit") {
      const name = __ring_m43.name; const type_args = __ring_m43.type_args; const fields = __ring_m43.fields; const spread = __ring_m43.spread; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      let cur_live = live;
      let spread_dups = [];
      const new_spread = (function() {
  const __ring_m = spread;
  if (__ring_m._tag === "some") { const s = __ring_m._0; return (function() {
  const r = rc_expr(s, cur_live, locals, boxed);
  cur_live = r.live;
  spread_dups = r.dups;
  return Option_some(r.expr);
})(); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      let new_fields = [];
      let field_dups_rev = [];
      let i = (List_len(fields) - 1);
      while ((i >= 0)) {
        __ring_match46: {
          const __ring_m46 = List_get(fields, i);
          if (__ring_m46._tag === "some") {
            const f = __ring_m46._0;
            const r = rc_expr(f.value, cur_live, locals, boxed);
            List_push(new_fields, new hir$HStructFieldInit(f.name, r.expr));
            const __ring_iter_55 = __List_Iterable.iter(r.dups);
            while (true) {
              const __ring_next_55 = __ListIterator_Iterator.next(__ring_iter_55);
              if (__ring_next_55._tag === "none") break;
              const d = __ring_next_55._0;
              List_push(field_dups_rev, d);
            }
            cur_live = r.live;
            break __ring_match46;
          }
          if (__ring_m46._tag === "none") {
            break __ring_match46;
          }
          __match_fail(__ring_m46);
        }
        i = (i - 1);
      }
      List_reverse(new_fields);
      List_reverse(field_dups_rev);
      return new RcResult(hir$HExpr_StructLit(name, type_args, new_fields, new_spread, ty, effects, span), cur_live, List_concat(spread_dups, field_dups_rev));
      break __ring_match43;
    }
    if (__ring_m43._tag === "NamedVariantConstruct") {
      const enum_name = __ring_m43.enum_name; const variant_name = __ring_m43.variant_name; const fields = __ring_m43.fields; const spread = __ring_m43.spread; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      let cur_live = live;
      let spread_dups = [];
      const new_spread = (function() {
  const __ring_m = spread;
  if (__ring_m._tag === "some") { const s = __ring_m._0; return (function() {
  const r = rc_expr(s, cur_live, locals, boxed);
  cur_live = r.live;
  spread_dups = r.dups;
  return Option_some(r.expr);
})(); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      let new_fields = [];
      let field_dups_rev = [];
      let i = (List_len(fields) - 1);
      while ((i >= 0)) {
        __ring_match47: {
          const __ring_m47 = List_get(fields, i);
          if (__ring_m47._tag === "some") {
            const f = __ring_m47._0;
            const r = rc_expr(f.value, cur_live, locals, boxed);
            List_push(new_fields, new hir$HStructFieldInit(f.name, r.expr));
            const __ring_iter_56 = __List_Iterable.iter(r.dups);
            while (true) {
              const __ring_next_56 = __ListIterator_Iterator.next(__ring_iter_56);
              if (__ring_next_56._tag === "none") break;
              const d = __ring_next_56._0;
              List_push(field_dups_rev, d);
            }
            cur_live = r.live;
            break __ring_match47;
          }
          if (__ring_m47._tag === "none") {
            break __ring_match47;
          }
          __match_fail(__ring_m47);
        }
        i = (i - 1);
      }
      List_reverse(new_fields);
      List_reverse(field_dups_rev);
      return new RcResult(hir$HExpr_NamedVariantConstruct(enum_name, variant_name, new_fields, new_spread, ty, effects, span), cur_live, List_concat(spread_dups, field_dups_rev));
      break __ring_match43;
    }
    if (__ring_m43._tag === "Block") {
      const stmts = __ring_m43.stmts; const tail = __ring_m43.tail; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      let cur_live = live;
      let tail_dups = [];
      const new_tail = (function() {
  const __ring_m = tail;
  if (__ring_m._tag === "some") { const t = __ring_m._0; return (function() {
  const r = rc_expr(t, cur_live, locals, boxed);
  cur_live = r.live;
  tail_dups = r.dups;
  return Option_some(r.expr);
})(); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      const stmts_result = rc_stmts(stmts, cur_live, locals, boxed);
      const final_stmts = List_concat(stmts_result.stmts, dups_to_stmts(tail_dups));
      return new RcResult(hir$HExpr_Block(final_stmts, new_tail, ty, effects, span), stmts_result.live, []);
      break __ring_match43;
    }
    if (__ring_m43._tag === "IfExpr") {
      const condition = __ring_m43.condition; const then_branch = __ring_m43.then_branch; const else_branch = __ring_m43.else_branch; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      const then_result = rc_expr(then_branch, set_clone(live), locals, boxed);
      const else_result = (function() {
  const __ring_m = else_branch;
  if (__ring_m._tag === "some") { const eb = __ring_m._0; return (function() {
  const r = rc_expr(eb, set_clone(live), locals, boxed);
  return Option_some(r);
})(); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      const live_then = then_result.live;
      const live_else = (function() {
  const __ring_m = else_result;
  if (__ring_m._tag === "some") { const r = __ring_m._0; return r.live; }
  if (__ring_m._tag === "none") { return set_clone(live); }
  __match_fail(__ring_m);
})();
      const then_flushed = flush_dups_into_expr(then_result.expr, then_result.dups);
      const balanced_then = balance_branch(then_flushed, live_then, live_else);
      const balanced_else = (function() {
  const __ring_m = else_result;
  if (__ring_m._tag === "some") { const r = __ring_m._0; return (function() {
  const else_flushed = flush_dups_into_expr(r.expr, r.dups);
  return Option_some(balance_branch(else_flushed, live_else, live_then));
})(); }
  if (__ring_m._tag === "none") { return else_branch; }
  __match_fail(__ring_m);
})();
      const merged_live = _Set_union(live_then, live_else);
      const cond_result = rc_expr(condition, merged_live, locals, boxed);
      return new RcResult(hir$HExpr_IfExpr(cond_result.expr, balanced_then, balanced_else, ty, effects, span), cond_result.live, cond_result.dups);
      break __ring_match43;
    }
    if (__ring_m43._tag === "MatchExpr") {
      const scrutinee = __ring_m43.scrutinee; const arms = __ring_m43.arms; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      let arm_exts = [];
      let fallthrough_live = set_new();
      const __ring_iter_57 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_57 = __ListIterator_Iterator.next(__ring_iter_57);
        if (__ring_next_57._tag === "none") break;
        const arm = __ring_next_57._0;
        List_push(arm_exts, set_new());
      }
      let ai = (List_len(arms) - 1);
      while ((ai >= 0)) {
        __ring_match48: {
          const __ring_m48 = List_get(arms, ai);
          if (__ring_m48._tag === "some") {
            const arm = __ring_m48._0;
            const body_result = rc_expr(arm.body, set_clone(live), locals, boxed);
            let arm_ext = (function() {
  const __ring_m = arm.guard;
  if (__ring_m._tag === "some") { const g = __ring_m._0; return (function() {
  const guard_live_out = _Set_union(body_result.live, fallthrough_live);
  const gr = rc_expr(g, guard_live_out, locals, boxed);
  return set_clone(gr.live);
})(); }
  if (__ring_m._tag === "none") { return set_clone(body_result.live); }
  __match_fail(__ring_m);
})();
            let pat_names = [];
            pattern_binding_names(arm.pattern, pat_names);
            const __ring_iter_58 = __List_Iterable.iter(pat_names);
            while (true) {
              const __ring_next_58 = __ListIterator_Iterator.next(__ring_iter_58);
              if (__ring_next_58._tag === "none") break;
              const pn = __ring_next_58._0;
              _Set_remove(arm_ext, pn);
            }
            List_set(arm_exts, ai, set_clone(arm_ext));
            fallthrough_live = arm_ext;
            break __ring_match48;
          }
          if (__ring_m48._tag === "none") {
            break __ring_match48;
          }
          __match_fail(__ring_m48);
        }
        ai = (ai - 1);
      }
      let merged_live = set_new();
      const __ring_iter_59 = __List_Iterable.iter(arm_exts);
      while (true) {
        const __ring_next_59 = __ListIterator_Iterator.next(__ring_iter_59);
        if (__ring_next_59._tag === "none") break;
        const ae = __ring_next_59._0;
        merged_live = _Set_union(merged_live, ae);
      }
      let balanced_arms = [];
      const __ring_end60 = List_len(arms);
      for (let i = 0; i < __ring_end60; i++) {
        __ring_match49: {
          const __ring_m49 = List_get(arms, i);
          if (__ring_m49._tag === "some") {
            const arm = __ring_m49._0;
            const body_result = rc_expr(arm.body, set_clone(live), locals, boxed);
            const new_guard = (function() {
  const __ring_m = arm.guard;
  if (__ring_m._tag === "some") { const g = __ring_m._0; return (function() {
  const guard_live_out = _Set_union(merged_live, body_result.live);
  const gr = rc_expr(g, guard_live_out, locals, boxed);
  return Option_some(flush_dups_into_expr(gr.expr, gr.dups));
})(); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
            const need_drop = _Set_difference(merged_live, body_result.live);
            const body_flushed = flush_dups_into_expr(body_result.expr, body_result.dups);
            const body_balanced = ((_Set_len(need_drop) > 0) ? prepend_stmts_to_expr(body_flushed, make_drop_list(need_drop)) : body_flushed);
            List_push(balanced_arms, new hir$HMatchArm(arm.pattern, new_guard, body_balanced, arm.span));
            break __ring_match49;
          }
          if (__ring_m49._tag === "none") {
            break __ring_match49;
          }
          __match_fail(__ring_m49);
        }
      }
      const scrut_result = rc_expr(scrutinee, merged_live, locals, boxed);
      return new RcResult(hir$HExpr_MatchExpr(scrut_result.expr, balanced_arms, ty, effects, span), scrut_result.live, scrut_result.dups);
      break __ring_match43;
    }
    if (__ring_m43._tag === "StringInterp") {
      const parts = __ring_m43.parts; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      let cur_live = live;
      let new_parts = [];
      let part_dups_rev = [];
      let i = (List_len(parts) - 1);
      while ((i >= 0)) {
        __ring_match50: {
          const __ring_m50 = List_get(parts, i);
          if (__ring_m50._tag === "some") {
            const p = __ring_m50._0;
            __ring_match51: {
              const __ring_m51 = p;
              if (__ring_m51._tag === "Expression") {
                const e = __ring_m51._0;
                const r = rc_expr(e, cur_live, locals, boxed);
                List_push(new_parts, hir$HStringInterpPart_Expression(r.expr));
                const __ring_iter_61 = __List_Iterable.iter(r.dups);
                while (true) {
                  const __ring_next_61 = __ListIterator_Iterator.next(__ring_iter_61);
                  if (__ring_next_61._tag === "none") break;
                  const d = __ring_next_61._0;
                  List_push(part_dups_rev, d);
                }
                cur_live = r.live;
                break __ring_match51;
              }
              if (__ring_m51._tag === "Literal") {
                const s = __ring_m51._0;
                List_push(new_parts, hir$HStringInterpPart_Literal(s));
                break __ring_match51;
              }
              __match_fail(__ring_m51);
            }
            break __ring_match50;
          }
          if (__ring_m50._tag === "none") {
            break __ring_match50;
          }
          __match_fail(__ring_m50);
        }
        i = (i - 1);
      }
      List_reverse(new_parts);
      List_reverse(part_dups_rev);
      return new RcResult(hir$HExpr_StringInterp(new_parts, ty, effects, span), cur_live, part_dups_rev);
      break __ring_match43;
    }
    if (__ring_m43._tag === "TryCatch") {
      const body = __ring_m43.body; const arms = __ring_m43.arms; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      const body_result = rc_expr(body, set_clone(live), locals, boxed);
      const body_flushed = flush_dups_into_expr(body_result.expr, body_result.dups);
      let arm_results = [];
      const __ring_iter_62 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_62 = __ListIterator_Iterator.next(__ring_iter_62);
        if (__ring_next_62._tag === "none") break;
        const arm = __ring_next_62._0;
        const arm_live = set_clone(live);
        const body_r = rc_expr(arm.body, arm_live, locals, boxed);
        const arm_body_flushed = flush_dups_into_expr(body_r.expr, body_r.dups);
        let arm_final = body_r.live;
        let pat_names = [];
        pattern_binding_names(arm.pattern, pat_names);
        const __ring_iter_63 = __List_Iterable.iter(pat_names);
        while (true) {
          const __ring_next_63 = __ListIterator_Iterator.next(__ring_iter_63);
          if (__ring_next_63._tag === "none") break;
          const pn = __ring_next_63._0;
          _Set_remove(arm_final, pn);
        }
        List_push(arm_results, [new hir$HMatchArm(arm.pattern, arm.guard, arm_body_flushed, arm.span), arm_final]);
      }
      let merged = body_result.live;
      const __ring_iter_64 = __List_Iterable.iter(arm_results);
      while (true) {
        const __ring_next_64 = __ListIterator_Iterator.next(__ring_iter_64);
        if (__ring_next_64._tag === "none") break;
        const ar = __ring_next_64._0;
        merged = _Set_union(merged, ar[1]);
      }
      const balanced_body = balance_branch(body_flushed, body_result.live, merged);
      let balanced_arms = [];
      const __ring_iter_65 = __List_Iterable.iter(arm_results);
      while (true) {
        const __ring_next_65 = __ListIterator_Iterator.next(__ring_iter_65);
        if (__ring_next_65._tag === "none") break;
        const ar = __ring_next_65._0;
        const need_drop = _Set_difference(merged, ar[1]);
        if ((_Set_len(need_drop) > 0)) {
          const drops = make_drop_list(need_drop);
          List_push(balanced_arms, new hir$HMatchArm(ar[0].pattern, ar[0].guard, prepend_stmts_to_expr(ar[0].body, drops), ar[0].span));
        } else {
          List_push(balanced_arms, ar[0]);
        }
      }
      return new RcResult(hir$HExpr_TryCatch(balanced_body, balanced_arms, ty, effects, span), merged, []);
      break __ring_match43;
    }
    if (__ring_m43._tag === "HandleExpr") {
      const body = __ring_m43.body; const handlers = __ring_m43.handlers; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      const body_result = rc_expr(body, live, locals, boxed);
      const body_flushed = flush_dups_into_expr(body_result.expr, body_result.dups);
      let new_handlers = [];
      const __ring_iter_66 = __List_Iterable.iter(handlers);
      while (true) {
        const __ring_next_66 = __ListIterator_Iterator.next(__ring_iter_66);
        if (__ring_next_66._tag === "none") break;
        const h = __ring_next_66._0;
        const h_live = set_new();
        let h_locals = set_new();
        const __ring_iter_67 = __List_Iterable.iter(h.params);
        while (true) {
          const __ring_next_67 = __ListIterator_Iterator.next(__ring_iter_67);
          if (__ring_next_67._tag === "none") break;
          const hp = __ring_next_67._0;
          _Set_insert(h_locals, hp.name);
        }
        __ring_match52: {
          const __ring_m52 = h.resume_name;
          if (__ring_m52._tag === "some") {
            const rn = __ring_m52._0;
            _Set_insert(h_locals, rn);
            break __ring_match52;
          }
          if (__ring_m52._tag === "none") {
            break __ring_match52;
          }
          __match_fail(__ring_m52);
        }
        collect_local_defs_expr(h.body, h_locals);
        const h_result = rc_expr(h.body, h_live, h_locals, boxed);
        const h_body_flushed = flush_dups_into_expr(h_result.expr, h_result.dups);
        List_push(new_handlers, new hir$HEffectHandler(h.effect_name, h.op_name, h.params, h.resume_name, h_body_flushed));
      }
      return new RcResult(hir$HExpr_HandleExpr(body_flushed, new_handlers, ty, effects, span), body_result.live, []);
      break __ring_match43;
    }
    if (__ring_m43._tag === "Lambda") {
      const params = __ring_m43.params; const return_type = __ring_m43.return_type; const body = __ring_m43.body; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      let lambda_bound = set_new();
      const __ring_iter_68 = __List_Iterable.iter(params);
      while (true) {
        const __ring_next_68 = __ListIterator_Iterator.next(__ring_iter_68);
        if (__ring_next_68._tag === "none") break;
        const p = __ring_next_68._0;
        _Set_insert(lambda_bound, p.name);
      }
      collect_local_defs_expr(body, lambda_bound);
      let body_vars = set_new();
      collect_expr_vars(body, body_vars);
      const incoming = set_clone(live);
      let outer_live = set_clone(live);
      let capture_dups = [];
      const __ring_iter_69 = ___Set_Iterable.iter(body_vars);
      while (true) {
        const __ring_next_69 = __SetIterator_Iterator.next(__ring_iter_69);
        if (__ring_next_69._tag === "none") break;
        const v = __ring_next_69._0;
        if (((_Set_contains(lambda_bound, v, __Str_Eq) === false) && _Set_contains(locals, v, __Str_Eq))) {
          if (_Set_contains(incoming, v, __Str_Eq)) {
            List_push(capture_dups, v);
          } else {
            _Set_insert(outer_live, v);
          }
        }
      }
      const new_body = transform_fn_body(params, body, boxed);
      return new RcResult(hir$HExpr_Lambda(params, return_type, new_body, ty, effects, span), outer_live, capture_dups);
      break __ring_match43;
    }
    if (__ring_m43._tag === "EffectOp") {
      const effect_name = __ring_m43.effect_name; const op_name = __ring_m43.op_name; const args = __ring_m43.args; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      let cur_live = live;
      let new_args = [];
      let arg_dups_rev = [];
      let i = (List_len(args) - 1);
      while ((i >= 0)) {
        __ring_match53: {
          const __ring_m53 = List_get(args, i);
          if (__ring_m53._tag === "some") {
            const a = __ring_m53._0;
            const r = rc_expr(a, cur_live, locals, boxed);
            List_push(new_args, r.expr);
            const __ring_iter_70 = __List_Iterable.iter(r.dups);
            while (true) {
              const __ring_next_70 = __ListIterator_Iterator.next(__ring_iter_70);
              if (__ring_next_70._tag === "none") break;
              const d = __ring_next_70._0;
              List_push(arg_dups_rev, d);
            }
            cur_live = r.live;
            break __ring_match53;
          }
          if (__ring_m53._tag === "none") {
            break __ring_match53;
          }
          __match_fail(__ring_m53);
        }
        i = (i - 1);
      }
      List_reverse(new_args);
      List_reverse(arg_dups_rev);
      return new RcResult(hir$HExpr_EffectOp(effect_name, op_name, new_args, ty, effects, span), cur_live, arg_dups_rev);
      break __ring_match43;
    }
    if (__ring_m43._tag === "RangeExpr") {
      const start = __ring_m43.start; const end = __ring_m43.end; const inclusive = __ring_m43.inclusive; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      const end_r = rc_expr(end, live, locals, boxed);
      const start_r = rc_expr(start, end_r.live, locals, boxed);
      return new RcResult(hir$HExpr_RangeExpr(start_r.expr, end_r.expr, inclusive, ty, effects, span), start_r.live, List_concat(start_r.dups, end_r.dups));
      break __ring_match43;
    }
    if (__ring_m43._tag === "ListLit") {
      const elements = __ring_m43.elements; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      let cur_live = live;
      let new_elems = [];
      let elem_dups_rev = [];
      let i = (List_len(elements) - 1);
      while ((i >= 0)) {
        __ring_match54: {
          const __ring_m54 = List_get(elements, i);
          if (__ring_m54._tag === "some") {
            const e = __ring_m54._0;
            const r = rc_expr(e, cur_live, locals, boxed);
            List_push(new_elems, r.expr);
            const __ring_iter_71 = __List_Iterable.iter(r.dups);
            while (true) {
              const __ring_next_71 = __ListIterator_Iterator.next(__ring_iter_71);
              if (__ring_next_71._tag === "none") break;
              const d = __ring_next_71._0;
              List_push(elem_dups_rev, d);
            }
            cur_live = r.live;
            break __ring_match54;
          }
          if (__ring_m54._tag === "none") {
            break __ring_match54;
          }
          __match_fail(__ring_m54);
        }
        i = (i - 1);
      }
      List_reverse(new_elems);
      List_reverse(elem_dups_rev);
      return new RcResult(hir$HExpr_ListLit(new_elems, ty, effects, span), cur_live, elem_dups_rev);
      break __ring_match43;
    }
    if (__ring_m43._tag === "TupleLit") {
      const elements = __ring_m43.elements; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      let cur_live = live;
      let new_elems = [];
      let elem_dups_rev = [];
      let i = (List_len(elements) - 1);
      while ((i >= 0)) {
        __ring_match55: {
          const __ring_m55 = List_get(elements, i);
          if (__ring_m55._tag === "some") {
            const e = __ring_m55._0;
            const r = rc_expr(e, cur_live, locals, boxed);
            List_push(new_elems, r.expr);
            const __ring_iter_72 = __List_Iterable.iter(r.dups);
            while (true) {
              const __ring_next_72 = __ListIterator_Iterator.next(__ring_iter_72);
              if (__ring_next_72._tag === "none") break;
              const d = __ring_next_72._0;
              List_push(elem_dups_rev, d);
            }
            cur_live = r.live;
            break __ring_match55;
          }
          if (__ring_m55._tag === "none") {
            break __ring_match55;
          }
          __match_fail(__ring_m55);
        }
        i = (i - 1);
      }
      List_reverse(new_elems);
      List_reverse(elem_dups_rev);
      return new RcResult(hir$HExpr_TupleLit(new_elems, ty, effects, span), cur_live, elem_dups_rev);
      break __ring_match43;
    }
    if (__ring_m43._tag === "IndexExpr") {
      const receiver = __ring_m43.receiver; const index = __ring_m43.index; const ty = __ring_m43.ty; const effects = __ring_m43.effects; const span = __ring_m43.span;
      const idx_r = rc_expr(index, live, locals, boxed);
      const recv_r = rc_expr(receiver, idx_r.live, locals, boxed);
      return new RcResult(hir$HExpr_IndexExpr(recv_r.expr, idx_r.expr, ty, effects, span), recv_r.live, List_concat(recv_r.dups, idx_r.dups));
      break __ring_match43;
    }
    __match_fail(__ring_m43);
  }
}

function sorted_set_names(names) {
  let out = _Set_to_list(names);
  List_sort(out);
  return out;
}

function make_drop_list(names) {
  let drops = [];
  const __ring_iter_73 = __List_Iterable.iter(sorted_set_names(names));
  while (true) {
    const __ring_next_73 = __ListIterator_Iterator.next(__ring_iter_73);
    if (__ring_next_73._tag === "none") break;
    const name = __ring_next_73._0;
    if ((rc_name_skippable(name) === false)) {
      List_push(drops, hir$HStmt_Drop(name, types$Type_UnitType, synthetic_span()));
    }
  }
  return drops;
}

function balance_branch(body, my_live, other_live) {
  const need_drop = _Set_difference(other_live, my_live);
  if ((_Set_len(need_drop) === 0)) {
    return body;
  }
  const drops = make_drop_list(need_drop);
  return prepend_stmts_to_expr(body, drops);
}

function prepend_stmts_to_expr(expr, stmts) {
  if ((List_len(stmts) === 0)) {
    return expr;
  }
  __ring_match56: {
    const __ring_m56 = expr;
    if (__ring_m56._tag === "Block") {
      const existing = __ring_m56.stmts; const tail = __ring_m56.tail; const ty = __ring_m56.ty; const effects = __ring_m56.effects; const span = __ring_m56.span;
      const new_stmts = List_concat(stmts, existing);
      return hir$HExpr_Block(new_stmts, tail, ty, effects, span);
      break __ring_match56;
    }
    const ty = hir$hexpr_type(expr);
    const effects = hir$hexpr_effects(expr);
    const span = hir$hexpr_span(expr);
    return hir$HExpr_Block(stmts, Option_some(expr), ty, effects, span);
    break __ring_match56;
  }
}

function dups_to_stmts(dups) {
  let out = [];
  const __ring_iter_74 = __List_Iterable.iter(dups);
  while (true) {
    const __ring_next_74 = __ListIterator_Iterator.next(__ring_iter_74);
    if (__ring_next_74._tag === "none") break;
    const name = __ring_next_74._0;
    if ((rc_name_skippable(name) === false)) {
      List_push(out, hir$HStmt_Dup(name, types$Type_UnitType, synthetic_span()));
    }
  }
  return out;
}

function flush_dups_into_expr(expr, dups) {
  return prepend_stmts_to_expr(expr, dups_to_stmts(dups));
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

function __ListIterator_Clone_clone(self, __ring_T_Clone) {
  return new ListIterator(__List_Clone.clone(self.list, __ring_T_Clone), self.index);
}
const __ListIterator_Clone = { clone: __ListIterator_Clone_clone };

function __SetIterator_Clone_clone(self, __ring_T_Clone) {
  return new SetIterator(__List_Clone.clone(self.items, __ring_T_Clone), self.index);
}
const __SetIterator_Clone = { clone: __SetIterator_Clone_clone };

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

function __ListIterator_Debug_debug(self, __ring_T_Debug) {
  return "ListIterator { " + "list: " + __List_Debug.debug(self.list, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __ListIterator_Debug = { debug: __ListIterator_Debug_debug };

function __SetIterator_Debug_debug(self, __ring_T_Debug) {
  return "SetIterator { " + "items: " + __List_Debug.debug(self.items, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __SetIterator_Debug = { debug: __SetIterator_Debug_debug };

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


export { perceus_transform };