import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, AssocConstraint as ast$AssocConstraint, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { is_type_dag_type_name as hir$is_type_dag_type_name, is_type_dag_type as hir$is_type_dag_type, variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, effect_op_slot as hir$effect_op_slot, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_Clone as hir$HExpr_Clone, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HAssocType as hir$HAssocType, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, type_intern_key as types$type_intern_key, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";



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

function perceus_transform(program) {
  const new_decls = transform_decls(program.decls, program.boxed_vars);
  return new hir$HProgram(new_decls, program.derived_impls, program.boxed_vars);
}

function transform_decls(decls, boxed) {
  let result = [];
  const __ring_iter_2 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const d = __ring_next_2._0;
    List_push(result, transform_decl(d, boxed));
  }
  return result;
}

function transform_decl(decl, boxed) {
  __ring_match6: {
    const __ring_m6 = decl;
    if (__ring_m6._tag === "Fn") {
      const name = __ring_m6.name; const def_id = __ring_m6.def_id; const type_params = __ring_m6.type_params; const params = __ring_m6.params; const return_type = __ring_m6.return_type; const effects = __ring_m6.effects; const body = __ring_m6.body; const is_pub = __ring_m6.is_pub; const trait_bounds = __ring_m6.trait_bounds; const span = __ring_m6.span;
      const new_body = transform_fn_body(params, body, boxed);
      return hir$HDecl_Fn(name, def_id, type_params, params, return_type, effects, new_body, is_pub, trait_bounds, span);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Impl") {
      const target_type = __ring_m6.target_type; const type_params = __ring_m6.type_params; const trait_name = __ring_m6.trait_name; const methods = __ring_m6.methods; const assoc_types = __ring_m6.assoc_types; const span = __ring_m6.span;
      const new_methods = transform_decls(methods, boxed);
      return hir$HDecl_Impl(target_type, type_params, trait_name, new_methods, assoc_types, span);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Test") {
      const description = __ring_m6.description; const body = __ring_m6.body; const span = __ring_m6.span;
      const new_body = transform_fn_body([], body, boxed);
      return hir$HDecl_Test(description, new_body, span);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Const") {
      const name = __ring_m6.name; const def_id = __ring_m6.def_id; const ty = __ring_m6.ty; const init = __ring_m6.init; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      const owned = [];
      let gensym = [0];
      const new_init = rc_escape(init, owned, boxed, gensym);
      return hir$HDecl_Const(name, def_id, ty, new_init, is_pub, span);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ModBlock") {
      const name = __ring_m6.name; const mod_decls = __ring_m6.decls; const is_pub = __ring_m6.is_pub; const span = __ring_m6.span;
      return hir$HDecl_ModBlock(name, transform_decls(mod_decls, boxed), is_pub, span);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Struct") {
      return decl;
      break __ring_match6;
    }
    if (__ring_m6._tag === "Enum") {
      return decl;
      break __ring_match6;
    }
    if (__ring_m6._tag === "Effect") {
      return decl;
      break __ring_match6;
    }
    if (__ring_m6._tag === "Trait") {
      return decl;
      break __ring_match6;
    }
    if (__ring_m6._tag === "ExternFn") {
      return decl;
      break __ring_match6;
    }
    if (__ring_m6._tag === "ExternType") {
      return decl;
      break __ring_match6;
    }
    if (__ring_m6._tag === "TypeAlias") {
      return decl;
      break __ring_match6;
    }
    if (__ring_m6._tag === "Sig") {
      return decl;
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function transform_fn_body(params, body, boxed) {
  const owned = [];
  let gensym = [0];
  return rc_block_root(body, true, owned, boxed, gensym);
}

function is_owner_bearing(expr) {
  __ring_match7: {
    const __ring_m7 = expr;
    if (__ring_m7._tag === "Ident") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "FieldAccess") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "IndexExpr") {
      return true;
      break __ring_match7;
    }
    if (__ring_m7._tag === "Call") {
      const callee = __ring_m7.callee;
      return is_borrow_returning_call(callee);
      break __ring_match7;
    }
    return false;
    break __ring_match7;
  }
}

function is_borrow_returning_call(callee) {
  __ring_match8: {
    const __ring_m8 = callee;
    if (__ring_m8._tag === "FieldAccess") {
      const field = __ring_m8.field;
      return (((field === "unwrap") || (field === "to_fail")) || (field === "unwrap_or_else"));
      break __ring_match8;
    }
    return false;
    break __ring_match8;
  }
}

function rc_escape(expr, owned, boxed, gensym) {
  if (hir$is_type_dag_type(hir$hexpr_type(expr))) {
    return rc_expr(expr, false, owned, boxed, gensym);
  } else {
    if (is_owner_bearing(expr)) {
      const inner = rc_expr(expr, false, owned, boxed, gensym);
      return hir$HExpr_Clone(inner, hir$hexpr_type(expr), hir$hexpr_effects(expr), hir$hexpr_span(expr));
    } else {
      return rc_expr(expr, true, owned, boxed, gensym);
    }
  }
}

function rc_block_root(body, escape, owned, boxed, gensym) {
  __ring_match9: {
    const __ring_m9 = body;
    if (__ring_m9._tag === "Block") {
      const stmts = __ring_m9.stmts; const tail = __ring_m9.tail; const ty = __ring_m9.ty; const effects = __ring_m9.effects; const span = __ring_m9.span;
      const res = rc_block_inner(stmts, tail, escape, owned, boxed, gensym);
      return hir$HExpr_Block(res[0], res[1], ty, effects, span);
      break __ring_match9;
    }
    return rc_escape_or_value(body, escape, owned, boxed, gensym);
    break __ring_match9;
  }
}

function rc_block_inner(stmts, tail, escape, owned, boxed, gensym) {
  const block_locals = direct_block_locals(stmts);
  let visible_owned = List_concat(owned, []);
  let new_stmts = [];
  const __ring_iter_3 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
    if (__ring_next_3._tag === "none") break;
    const s = __ring_next_3._0;
    const __ring_iter_4 = __List_Iterable.iter(rc_stmt(s, visible_owned, boxed, gensym));
    while (true) {
      const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
      if (__ring_next_4._tag === "none") break;
      const ns = __ring_next_4._0;
      List_push(new_stmts, ns);
    }
    const __ring_iter_5 = __List_Iterable.iter(stmt_droppable_locals(s));
    while (true) {
      const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
      if (__ring_next_5._tag === "none") break;
      const n = __ring_next_5._0;
      if ((List_contains(visible_owned, n, __Str_Eq) === false)) {
        List_push(visible_owned, n);
      }
    }
  }
  const new_tail = (function() {
  const __ring_m = tail;
  if (__ring_m._tag === "some") { const t = __ring_m._0; return Option_some(rc_escape_or_value(t, escape, visible_owned, boxed, gensym)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
  let own_block_locals = [];
  const __ring_iter_6 = __List_Iterable.iter(block_locals);
  while (true) {
    const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
    if (__ring_next_6._tag === "none") break;
    const n = __ring_next_6._0;
    if ((List_contains(owned, n, __Str_Eq) === false)) {
      List_push(own_block_locals, n);
    }
  }
  if ((List_len(own_block_locals) === 0)) {
    return [new_stmts, new_tail];
  } else {
    if (block_diverges(new_stmts, new_tail)) {
      return [new_stmts, new_tail];
    } else {
      const drops = drops_for(own_block_locals);
      __ring_match10: {
        const __ring_m10 = new_tail;
        if (__ring_m10._tag === "some") {
          const t = __ring_m10._0;
          const tmp = fresh_scope_tmp(gensym);
          const tt = hir$hexpr_type(t);
          const te = hir$hexpr_effects(t);
          const ts = hir$hexpr_span(t);
          List_push(new_stmts, hir$HStmt_Let(tmp, synthetic_span(), Option_none, tt, t, synthetic_span()));
          const __ring_iter_7 = __List_Iterable.iter(drops);
          while (true) {
            const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
            if (__ring_next_7._tag === "none") break;
            const d = __ring_next_7._0;
            List_push(new_stmts, d);
          }
          const tmp_tail = hir$HExpr_Ident(tmp, Option_none, Option_none, Option_none, tt, te, ts);
          return [new_stmts, Option_some(tmp_tail)];
          break __ring_match10;
        }
        if (__ring_m10._tag === "none") {
          const __ring_iter_8 = __List_Iterable.iter(drops);
          while (true) {
            const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
            if (__ring_next_8._tag === "none") break;
            const d = __ring_next_8._0;
            List_push(new_stmts, d);
          }
          return [new_stmts, Option_none];
          break __ring_match10;
        }
        __match_fail(__ring_m10);
      }
    }
  }
}

function rc_escape_or_value(expr, escape, owned, boxed, gensym) {
  if (escape) {
    return rc_escape(expr, owned, boxed, gensym);
  } else {
    return rc_expr(expr, false, owned, boxed, gensym);
  }
}

function fresh_scope_tmp(gensym) {
  const n = (function() {
  const __ring_m = List_get(gensym, 0);
  if (__ring_m._tag === "some") { const v = __ring_m._0; return v; }
  if (__ring_m._tag === "none") { return 0; }
  __match_fail(__ring_m);
})();
  List_set(gensym, 0, (n + 1));
  return `__rc_scope_${(n + 1)}`;
}

function direct_block_locals(stmts) {
  let out = [];
  const __ring_iter_9 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
    if (__ring_next_9._tag === "none") break;
    const s = __ring_next_9._0;
    const __ring_iter_10 = __List_Iterable.iter(stmt_droppable_locals(s));
    while (true) {
      const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
      if (__ring_next_10._tag === "none") break;
      const n = __ring_next_10._0;
      if ((List_contains(out, n, __Str_Eq) === false)) {
        List_push(out, n);
      }
    }
  }
  return out;
}

function stmt_droppable_locals(s) {
  __ring_match11: {
    const __ring_m11 = s;
    if (__ring_m11._tag === "Let") {
      const name = __ring_m11.name; const ty = __ring_m11.ty; const init = __ring_m11.init;
      if ((((rc_name_skippable(name) === false) && (hir$is_type_dag_type(ty) === false)) && is_droppable_init(init))) {
        return [name];
      } else {
        return [];
      }
      break __ring_match11;
    }
    if (__ring_m11._tag === "Var") {
      const name = __ring_m11.name; const ty = __ring_m11.ty; const init = __ring_m11.init;
      if ((((rc_name_skippable(name) === false) && (hir$is_type_dag_type(ty) === false)) && is_droppable_init(init))) {
        return [name];
      } else {
        return [];
      }
      break __ring_match11;
    }
    return [];
    break __ring_match11;
  }
}

function is_droppable_init(init) {
  __ring_match12: {
    const __ring_m12 = init;
    if (__ring_m12._tag === "Ident") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "FieldAccess") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "IndexExpr") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "StructLit") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "NamedVariantConstruct") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "ListLit") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "TupleLit") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "RangeExpr") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "Lambda") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "StringInterp") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "IntLit") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "FloatLit") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "StrLit") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "BoolLit") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "Clone") {
      return true;
      break __ring_match12;
    }
    if (__ring_m12._tag === "Call") {
      const callee = __ring_m12.callee;
      return is_borrow_returning_call(callee);
      break __ring_match12;
    }
    return false;
    break __ring_match12;
  }
}

function drops_for(names) {
  let out = [];
  const __ring_iter_11 = __List_Iterable.iter(names);
  while (true) {
    const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
    if (__ring_next_11._tag === "none") break;
    const n = __ring_next_11._0;
    if ((rc_name_skippable(n) === false)) {
      List_push(out, hir$HStmt_Drop(n, types$Type_UnitType, synthetic_span()));
    }
  }
  return out;
}

function block_diverges(stmts, tail) {
  let any = false;
  const __ring_iter_12 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
    if (__ring_next_12._tag === "none") break;
    const s = __ring_next_12._0;
    if (stmt_diverges(s)) {
      any = true;
    }
  }
  if (any) {
    return true;
  }
  __ring_match13: {
    const __ring_m13 = tail;
    if (__ring_m13._tag === "some") {
      const t = __ring_m13._0;
      return expr_diverges(t);
      break __ring_match13;
    }
    if (__ring_m13._tag === "none") {
      return false;
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
}

function rc_stmt(stmt, owned, boxed, gensym) {
  __ring_match14: {
    const __ring_m14 = stmt;
    if (__ring_m14._tag === "Let") {
      const name = __ring_m14.name; const name_span = __ring_m14.name_span; const def_id = __ring_m14.def_id; const ty = __ring_m14.ty; const init = __ring_m14.init; const span = __ring_m14.span;
      const new_init = rc_escape(init, owned, boxed, gensym);
      return [hir$HStmt_Let(name, name_span, def_id, ty, new_init, span)];
      break __ring_match14;
    }
    if (__ring_m14._tag === "Var") {
      const name = __ring_m14.name; const name_span = __ring_m14.name_span; const def_id = __ring_m14.def_id; const ty = __ring_m14.ty; const init = __ring_m14.init; const span = __ring_m14.span;
      const new_init = rc_escape(init, owned, boxed, gensym);
      return [hir$HStmt_Var(name, name_span, def_id, ty, new_init, span)];
      break __ring_match14;
    }
    if (__ring_m14._tag === "Assign") {
      const target = __ring_m14.target; const value = __ring_m14.value; const span = __ring_m14.span;
      const new_value = rc_escape(value, owned, boxed, gensym);
      return [hir$HStmt_Assign(target, new_value, span)];
      break __ring_match14;
    }
    if (__ring_m14._tag === "ExprStmt") {
      const expr = __ring_m14.expr; const span = __ring_m14.span;
      const new_expr = rc_expr(expr, false, owned, boxed, gensym);
      return [hir$HStmt_ExprStmt(new_expr, span)];
      break __ring_match14;
    }
    if (__ring_m14._tag === "Return") {
      const value = __ring_m14.value; const span = __ring_m14.span;
      __ring_match15: {
        const __ring_m15 = value;
        if (__ring_m15._tag === "some") {
          const v = __ring_m15._0;
          const new_v = rc_escape(v, owned, boxed, gensym);
          let out = [];
          const tmp = fresh_scope_tmp(gensym);
          const tt = hir$hexpr_type(v);
          const te = hir$hexpr_effects(v);
          const ts = hir$hexpr_span(v);
          List_push(out, hir$HStmt_Let(tmp, synthetic_span(), Option_none, tt, new_v, synthetic_span()));
          const __ring_iter_13 = __List_Iterable.iter(drops_for(owned));
          while (true) {
            const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
            if (__ring_next_13._tag === "none") break;
            const d = __ring_next_13._0;
            List_push(out, d);
          }
          const tmp_id = hir$HExpr_Ident(tmp, Option_none, Option_none, Option_none, tt, te, ts);
          List_push(out, hir$HStmt_Return(Option_some(tmp_id), span));
          return out;
          break __ring_match15;
        }
        if (__ring_m15._tag === "none") {
          let out = [];
          const __ring_iter_14 = __List_Iterable.iter(drops_for(owned));
          while (true) {
            const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
            if (__ring_next_14._tag === "none") break;
            const d = __ring_next_14._0;
            List_push(out, d);
          }
          List_push(out, hir$HStmt_Return(Option_none, span));
          return out;
          break __ring_match15;
        }
        __match_fail(__ring_m15);
      }
      break __ring_match14;
    }
    if (__ring_m14._tag === "While") {
      const condition = __ring_m14.condition; const body = __ring_m14.body; const span = __ring_m14.span;
      const new_cond = rc_expr(condition, false, owned, boxed, gensym);
      const new_body = rc_block_root(body, false, owned, boxed, gensym);
      return [hir$HStmt_While(new_cond, new_body, span)];
      break __ring_match14;
    }
    if (__ring_m14._tag === "ForIn") {
      const binding = __ring_m14.binding; const binding_span = __ring_m14.binding_span; const def_id = __ring_m14.def_id; const destructure = __ring_m14.destructure; const iterable = __ring_m14.iterable; const body = __ring_m14.body; const iterable_type_name = __ring_m14.iterable_type_name; const iter_type_name = __ring_m14.iter_type_name; const span = __ring_m14.span;
      const new_iter = rc_expr(iterable, false, owned, boxed, gensym);
      const new_body = rc_block_root(body, false, owned, boxed, gensym);
      return [hir$HStmt_ForIn(binding, binding_span, def_id, destructure, new_iter, new_body, iterable_type_name, iter_type_name, span)];
      break __ring_match14;
    }
    if (__ring_m14._tag === "Break") {
      const span = __ring_m14.span;
      return [hir$HStmt_Break(span)];
      break __ring_match14;
    }
    if (__ring_m14._tag === "Continue") {
      const span = __ring_m14.span;
      return [hir$HStmt_Continue(span)];
      break __ring_match14;
    }
    if (__ring_m14._tag === "LetDestructure") {
      const pattern = __ring_m14.pattern; const bindings = __ring_m14.bindings; const init = __ring_m14.init; const span = __ring_m14.span;
      const new_init = rc_escape(init, owned, boxed, gensym);
      return [hir$HStmt_LetDestructure(pattern, bindings, new_init, span)];
      break __ring_match14;
    }
    if (__ring_m14._tag === "IfLet") {
      const pattern = __ring_m14.pattern; const expr = __ring_m14.expr; const then_block = __ring_m14.then_block; const else_block = __ring_m14.else_block; const span = __ring_m14.span;
      const new_expr = rc_expr(expr, false, owned, boxed, gensym);
      const new_then = rc_block_root(then_block, false, owned, boxed, gensym);
      const new_else = (function() {
  const __ring_m = else_block;
  if (__ring_m._tag === "some") { const eb = __ring_m._0; return Option_some(rc_block_root(eb, false, owned, boxed, gensym)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return [hir$HStmt_IfLet(pattern, new_expr, new_then, new_else, span)];
      break __ring_match14;
    }
    if (__ring_m14._tag === "Drop") {
      return [stmt];
      break __ring_match14;
    }
    if (__ring_m14._tag === "Dup") {
      return [stmt];
      break __ring_match14;
    }
    __match_fail(__ring_m14);
  }
}

function rc_expr(expr, escape, owned, boxed, gensym) {
  __ring_match16: {
    const __ring_m16 = expr;
    if (__ring_m16._tag === "Ident") {
      return expr;
      break __ring_match16;
    }
    if (__ring_m16._tag === "IntLit") {
      return expr;
      break __ring_match16;
    }
    if (__ring_m16._tag === "FloatLit") {
      return expr;
      break __ring_match16;
    }
    if (__ring_m16._tag === "StrLit") {
      return expr;
      break __ring_match16;
    }
    if (__ring_m16._tag === "BoolLit") {
      return expr;
      break __ring_match16;
    }
    if (__ring_m16._tag === "BinOp") {
      const op = __ring_m16.op; const left = __ring_m16.left; const right = __ring_m16.right; const eq_dispatch = __ring_m16.eq_dispatch; const ord_dispatch = __ring_m16.ord_dispatch; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      return hir$HExpr_BinOp(op, rc_expr(left, false, owned, boxed, gensym), rc_expr(right, false, owned, boxed, gensym), eq_dispatch, ord_dispatch, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "UnaryOp") {
      const op = __ring_m16.op; const operand = __ring_m16.operand; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      return hir$HExpr_UnaryOp(op, rc_expr(operand, false, owned, boxed, gensym), ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "Call") {
      const callee = __ring_m16.callee; const args = __ring_m16.args; const type_args = __ring_m16.type_args; const resolved_dicts = __ring_m16.resolved_dicts; const dict_dispatch = __ring_m16.dict_dispatch; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      const new_callee = rc_expr(callee, false, owned, boxed, gensym);
      const ctor_sink = is_variant_constructor_call(callee, ty);
      const sink = sink_arg_indices(callee, List_len(args));
      let new_args = [];
      let i = 0;
      const __ring_iter_15 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
        if (__ring_next_15._tag === "none") break;
        const a = __ring_next_15._0;
        const new_a = ((ctor_sink || list_contains_int(sink, i)) ? rc_escape(a, owned, boxed, gensym) : rc_expr(a, false, owned, boxed, gensym));
        List_push(new_args, new_a);
        i = (i + 1);
      }
      return hir$HExpr_Call(new_callee, new_args, type_args, resolved_dicts, dict_dispatch, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "FieldAccess") {
      const receiver = __ring_m16.receiver; const field = __ring_m16.field; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      return hir$HExpr_FieldAccess(rc_expr(receiver, false, owned, boxed, gensym), field, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "StructLit") {
      const name = __ring_m16.name; const type_args = __ring_m16.type_args; const fields = __ring_m16.fields; const spread = __ring_m16.spread; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      let new_fields = [];
      const __ring_iter_16 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
        if (__ring_next_16._tag === "none") break;
        const f = __ring_next_16._0;
        List_push(new_fields, new hir$HStructFieldInit(f.name, rc_escape(f.value, owned, boxed, gensym)));
      }
      const new_spread = (function() {
  const __ring_m = spread;
  if (__ring_m._tag === "some") { const s = __ring_m._0; return Option_some(rc_expr(s, false, owned, boxed, gensym)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return hir$HExpr_StructLit(name, type_args, new_fields, new_spread, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "NamedVariantConstruct") {
      const enum_name = __ring_m16.enum_name; const variant_name = __ring_m16.variant_name; const fields = __ring_m16.fields; const spread = __ring_m16.spread; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      let new_fields = [];
      const __ring_iter_17 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
        if (__ring_next_17._tag === "none") break;
        const f = __ring_next_17._0;
        List_push(new_fields, new hir$HStructFieldInit(f.name, rc_escape(f.value, owned, boxed, gensym)));
      }
      const new_spread = (function() {
  const __ring_m = spread;
  if (__ring_m._tag === "some") { const s = __ring_m._0; return Option_some(rc_expr(s, false, owned, boxed, gensym)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return hir$HExpr_NamedVariantConstruct(enum_name, variant_name, new_fields, new_spread, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "Block") {
      const stmts = __ring_m16.stmts; const tail = __ring_m16.tail; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      const res = rc_block_inner(stmts, tail, escape, owned, boxed, gensym);
      return hir$HExpr_Block(res[0], res[1], ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "IfExpr") {
      const condition = __ring_m16.condition; const then_branch = __ring_m16.then_branch; const else_branch = __ring_m16.else_branch; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      const new_cond = rc_expr(condition, false, owned, boxed, gensym);
      const new_then = rc_block_root(then_branch, escape, owned, boxed, gensym);
      const new_else = (function() {
  const __ring_m = else_branch;
  if (__ring_m._tag === "some") { const eb = __ring_m._0; return Option_some(rc_block_root(eb, escape, owned, boxed, gensym)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return hir$HExpr_IfExpr(new_cond, new_then, new_else, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "MatchExpr") {
      const scrutinee = __ring_m16.scrutinee; const arms = __ring_m16.arms; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      const new_scrutinee = rc_expr(scrutinee, false, owned, boxed, gensym);
      let new_arms = [];
      const __ring_iter_18 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
        if (__ring_next_18._tag === "none") break;
        const arm = __ring_next_18._0;
        const new_guard = (function() {
  const __ring_m = arm.guard;
  if (__ring_m._tag === "some") { const g = __ring_m._0; return Option_some(rc_expr(g, false, owned, boxed, gensym)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
        const new_body = rc_block_root(arm.body, escape, owned, boxed, gensym);
        List_push(new_arms, new hir$HMatchArm(arm.pattern, new_guard, new_body, arm.span));
      }
      return hir$HExpr_MatchExpr(new_scrutinee, new_arms, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "StringInterp") {
      const parts = __ring_m16.parts; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      let new_parts = [];
      const __ring_iter_19 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
        if (__ring_next_19._tag === "none") break;
        const p = __ring_next_19._0;
        __ring_match17: {
          const __ring_m17 = p;
          if (__ring_m17._tag === "Expression") {
            const e = __ring_m17._0;
            List_push(new_parts, hir$HStringInterpPart_Expression(rc_expr(e, false, owned, boxed, gensym)));
            break __ring_match17;
          }
          if (__ring_m17._tag === "Literal") {
            const s = __ring_m17._0;
            List_push(new_parts, hir$HStringInterpPart_Literal(s));
            break __ring_match17;
          }
          __match_fail(__ring_m17);
        }
      }
      return hir$HExpr_StringInterp(new_parts, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "TryCatch") {
      const body = __ring_m16.body; const arms = __ring_m16.arms; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      const new_body = rc_block_root(body, escape, owned, boxed, gensym);
      let new_arms = [];
      const __ring_iter_20 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
        if (__ring_next_20._tag === "none") break;
        const arm = __ring_next_20._0;
        const new_body_arm = rc_block_root(arm.body, escape, owned, boxed, gensym);
        List_push(new_arms, new hir$HMatchArm(arm.pattern, arm.guard, new_body_arm, arm.span));
      }
      return hir$HExpr_TryCatch(new_body, new_arms, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "HandleExpr") {
      const body = __ring_m16.body; const handlers = __ring_m16.handlers; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      const new_body = rc_block_root(body, escape, owned, boxed, gensym);
      let new_handlers = [];
      const __ring_iter_21 = __List_Iterable.iter(handlers);
      while (true) {
        const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
        if (__ring_next_21._tag === "none") break;
        const h = __ring_next_21._0;
        const h_body = rc_block_root(h.body, true, [], boxed, gensym);
        List_push(new_handlers, new hir$HEffectHandler(h.effect_name, h.op_name, h.params, h.resume_name, h_body));
      }
      return hir$HExpr_HandleExpr(new_body, new_handlers, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "Lambda") {
      const params = __ring_m16.params; const return_type = __ring_m16.return_type; const body = __ring_m16.body; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      const new_body = rc_block_root(body, true, [], boxed, gensym);
      return hir$HExpr_Lambda(params, return_type, new_body, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "EffectOp") {
      const effect_name = __ring_m16.effect_name; const op_name = __ring_m16.op_name; const args = __ring_m16.args; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      let new_args = [];
      const __ring_iter_22 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
        if (__ring_next_22._tag === "none") break;
        const a = __ring_next_22._0;
        List_push(new_args, rc_expr(a, false, owned, boxed, gensym));
      }
      return hir$HExpr_EffectOp(effect_name, op_name, new_args, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "RangeExpr") {
      const start = __ring_m16.start; const end = __ring_m16.end; const inclusive = __ring_m16.inclusive; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      return hir$HExpr_RangeExpr(rc_escape(start, owned, boxed, gensym), rc_escape(end, owned, boxed, gensym), inclusive, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "ListLit") {
      const elements = __ring_m16.elements; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      let new_elems = [];
      const __ring_iter_23 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
        if (__ring_next_23._tag === "none") break;
        const e = __ring_next_23._0;
        List_push(new_elems, rc_escape(e, owned, boxed, gensym));
      }
      return hir$HExpr_ListLit(new_elems, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "TupleLit") {
      const elements = __ring_m16.elements; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      let new_elems = [];
      const __ring_iter_24 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
        if (__ring_next_24._tag === "none") break;
        const e = __ring_next_24._0;
        List_push(new_elems, rc_escape(e, owned, boxed, gensym));
      }
      return hir$HExpr_TupleLit(new_elems, ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "IndexExpr") {
      const receiver = __ring_m16.receiver; const index = __ring_m16.index; const ty = __ring_m16.ty; const effects = __ring_m16.effects; const span = __ring_m16.span;
      return hir$HExpr_IndexExpr(rc_expr(receiver, false, owned, boxed, gensym), rc_expr(index, false, owned, boxed, gensym), ty, effects, span);
      break __ring_match16;
    }
    if (__ring_m16._tag === "Clone") {
      return expr;
      break __ring_match16;
    }
    __match_fail(__ring_m16);
  }
}

function sink_arg_indices(callee, arg_count) {
  __ring_match18: {
    const __ring_m18 = callee;
    if (__ring_m18._tag === "FieldAccess") {
      const field = __ring_m18.field;
      if (((((field === "push") || (field === "add")) || (field === "append")) || (field === "push_back"))) {
        if ((arg_count >= 1)) {
          return [0];
        } else {
          return [];
        }
      } else {
        if ((field === "insert")) {
          if ((arg_count >= 1)) {
            return [(arg_count - 1)];
          } else {
            return [];
          }
        } else {
          if ((field === "set")) {
            if ((arg_count >= 1)) {
              return [(arg_count - 1)];
            } else {
              return [];
            }
          } else {
            return [];
          }
        }
      }
      break __ring_match18;
    }
    return [];
    break __ring_match18;
  }
}

function is_variant_constructor_call(callee, result_ty) {
  __ring_match19: {
    const __ring_m19 = callee;
    if (__ring_m19._tag === "Ident") {
      const resolved_name = __ring_m19.resolved_name;
      __ring_match20: {
        const __ring_m20 = resolved_name;
        if (__ring_m20._tag === "some") {
          const rn = __ring_m20._0;
          __ring_match21: {
            const __ring_m21 = result_ty;
            if (__ring_m21._tag === "EnumType") {
              const name = __ring_m21.name;
              return Str_starts_with(rn, `${name}_`);
              break __ring_match21;
            }
            return false;
            break __ring_match21;
          }
          break __ring_match20;
        }
        if (__ring_m20._tag === "none") {
          return false;
          break __ring_match20;
        }
        __match_fail(__ring_m20);
      }
      break __ring_match19;
    }
    return false;
    break __ring_match19;
  }
}

function list_contains_int(xs, x) {
  const __ring_iter_25 = __List_Iterable.iter(xs);
  while (true) {
    const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
    if (__ring_next_25._tag === "none") break;
    const v = __ring_next_25._0;
    if ((v === x)) {
      return true;
    }
  }
  return false;
}

function stmt_diverges(stmt) {
  __ring_match22: {
    const __ring_m22 = stmt;
    if (__ring_m22._tag === "Return") {
      return true;
      break __ring_match22;
    }
    if (__ring_m22._tag === "Break") {
      return true;
      break __ring_match22;
    }
    if (__ring_m22._tag === "Continue") {
      return true;
      break __ring_match22;
    }
    if (__ring_m22._tag === "ExprStmt") {
      const expr = __ring_m22.expr;
      return expr_diverges(expr);
      break __ring_match22;
    }
    return false;
    break __ring_match22;
  }
}

function expr_diverges(expr) {
  __ring_match23: {
    const __ring_m23 = expr;
    if (__ring_m23._tag === "Block") {
      const stmts = __ring_m23.stmts; const tail = __ring_m23.tail;
      let any = false;
      const __ring_iter_26 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
        if (__ring_next_26._tag === "none") break;
        const s = __ring_next_26._0;
        if (stmt_diverges(s)) {
          any = true;
        }
      }
      if (any) {
        return true;
      } else {
        __ring_match24: {
          const __ring_m24 = tail;
          if (__ring_m24._tag === "some") {
            const t = __ring_m24._0;
            return expr_diverges(t);
            break __ring_match24;
          }
          if (__ring_m24._tag === "none") {
            return false;
            break __ring_match24;
          }
          __match_fail(__ring_m24);
        }
      }
      break __ring_match23;
    }
    if (__ring_m23._tag === "IfExpr") {
      const then_branch = __ring_m23.then_branch; const else_branch = __ring_m23.else_branch;
      __ring_match25: {
        const __ring_m25 = else_branch;
        if (__ring_m25._tag === "some") {
          const eb = __ring_m25._0;
          return (expr_diverges(then_branch) && expr_diverges(eb));
          break __ring_match25;
        }
        if (__ring_m25._tag === "none") {
          return false;
          break __ring_match25;
        }
        __match_fail(__ring_m25);
      }
      break __ring_match23;
    }
    if (__ring_m23._tag === "MatchExpr") {
      const arms = __ring_m23.arms;
      let all = (List_len(arms) > 0);
      const __ring_iter_27 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
        if (__ring_next_27._tag === "none") break;
        const arm = __ring_next_27._0;
        if ((expr_diverges(arm.body) === false)) {
          all = false;
        }
      }
      return all;
      break __ring_match23;
    }
    return false;
    break __ring_match23;
  }
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


export { perceus_transform };