import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, effects_same_kind as types$effects_same_kind, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { new_union_find as union_find$new_union_find, uf_find as union_find$uf_find, uf_bind as union_find$uf_bind, uf_lookup as union_find$uf_lookup, uf_union as union_find$uf_union, uf_insert as union_find$uf_insert, UnionFind as union_find$UnionFind } from "./union_find.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst_map as env$apply_subst_map, apply_subst_effect_map as env$apply_subst_effect_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, EffectAliasDef as env$EffectAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __IdGen_Eq as env$__IdGen_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __ImplEntry_Clone as env$__ImplEntry_Clone, __FnBound_Clone as env$__FnBound_Clone, __IdGen_Clone as env$__IdGen_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __IdGen_Ord as env$__IdGen_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __ImplEntry_Debug as env$__ImplEntry_Debug, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, default_evidence_name as hir$default_evidence_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";

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

class Ctor {
  constructor(name, arity, field_types, field_names, is_tuple) {
    this.name = name;
    this.arity = arity;
    this.field_types = field_types;
    this.field_names = field_names;
    this.is_tuple = is_tuple;
  }
}

function pat_at(list, i) {
  __ring_match6: {
    const __ring_m6 = List_get(list, i);
    if (__ring_m6._tag === "some") {
      const v = __ring_m6._0;
      return v;
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      return panic("pat_at: out of bounds");
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function type_at(list, i) {
  __ring_match7: {
    const __ring_m7 = List_get(list, i);
    if (__ring_m7._tag === "some") {
      const v = __ring_m7._0;
      return v;
      break __ring_match7;
    }
    if (__ring_m7._tag === "none") {
      return panic("type_at: out of bounds");
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
}

function str_at(list, i) {
  __ring_match8: {
    const __ring_m8 = List_get(list, i);
    if (__ring_m8._tag === "some") {
      const v = __ring_m8._0;
      return v;
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      return panic("str_at: out of bounds");
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
}

function row_at(list, i) {
  __ring_match9: {
    const __ring_m9 = List_get(list, i);
    if (__ring_m9._tag === "some") {
      const v = __ring_m9._0;
      return v;
      break __ring_match9;
    }
    if (__ring_m9._tag === "none") {
      return panic("row_at: out of bounds");
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
}

function ctor_at(list, i) {
  __ring_match10: {
    const __ring_m10 = List_get(list, i);
    if (__ring_m10._tag === "some") {
      const v = __ring_m10._0;
      return v;
      break __ring_match10;
    }
    if (__ring_m10._tag === "none") {
      return panic("ctor_at: out of bounds");
      break __ring_match10;
    }
    __match_fail(__ring_m10);
  }
}

function type_is_recursive(ty, key) {
  __ring_match11: {
    const __ring_m11 = ty;
    if (__ring_m11._tag === "EnumType") {
      const variants = __ring_m11.variants;
      let visited = set_new();
      _Set_insert(visited, key);
      for (const v of variants) {
        for (const ft of v.fields) {
          if (type_contains_key(ft, key, visited)) {
            return true;
          }
        }
      }
      return false;
      break __ring_match11;
    }
    return false;
    break __ring_match11;
  }
}

function type_contains_key(ty, key, visited) {
  const ty_str = types$type_to_string(ty);
  if ((ty_str === key)) {
    return true;
  }
  if (_Set_contains(visited, ty_str, __Str_Eq)) {
    return false;
  }
  _Set_insert(visited, ty_str);
  __ring_match12: {
    const __ring_m12 = ty;
    if (__ring_m12._tag === "EnumType") {
      const variants = __ring_m12.variants;
      for (const v of variants) {
        for (const ft of v.fields) {
          if (type_contains_key(ft, key, visited)) {
            return true;
          }
        }
      }
      return false;
      break __ring_match12;
    }
    if (__ring_m12._tag === "StructType") {
      const fields = __ring_m12.fields;
      for (const f of fields) {
        if (type_contains_key(f.ty, key, visited)) {
          return true;
        }
      }
      return false;
      break __ring_match12;
    }
    if (__ring_m12._tag === "TupleType") {
      const elements = __ring_m12.elements;
      for (const e of elements) {
        if (type_contains_key(e, key, visited)) {
          return true;
        }
      }
      return false;
      break __ring_match12;
    }
    if (__ring_m12._tag === "FnType") {
      const params = __ring_m12.params; const return_type = __ring_m12.return_type;
      for (const p of params) {
        if (type_contains_key(p, key, visited)) {
          return true;
        }
      }
      return type_contains_key(return_type, key, visited);
      break __ring_match12;
    }
    return false;
    break __ring_match12;
  }
}

function check_exhaustive(arms, scrutinee_type, subst) {
  let patterns = [];
  for (const arm of arms) {
    __ring_match13: {
      const __ring_m13 = arm.guard;
      if (__ring_m13._tag === "some") {
        break __ring_match13;
      }
      if (__ring_m13._tag === "none") {
        List_push(patterns, arm.pattern);
        break __ring_match13;
      }
      __match_fail(__ring_m13);
    }
  }
  return check_patterns(patterns, scrutinee_type, subst);
}

function check_patterns(patterns, ty, subst) {
  const resolved = env$apply_subst(subst, ty);
  for (const p of patterns) {
    __ring_match14: {
      const __ring_m14 = p;
      if (__ring_m14._tag === "Wildcard") {
        return Option_none;
        break __ring_match14;
      }
      if (__ring_m14._tag === "Binding") {
        return Option_none;
        break __ring_match14;
      }
      break __ring_match14;
    }
  }
  __ring_match15: {
    const __ring_m15 = resolved;
    if (__ring_m15._tag === "EnumType") {
      const name = __ring_m15.name; const type_params = __ring_m15.type_params; const variants = __ring_m15.variants;
      const variant_names = variants.map((function(v) { return v.name; }));
      let covered = set_new();
      for (const v of variants) {
        let sub_patterns_for_variant = [];
        for (const p of patterns) {
          __ring_match16: {
            const __ring_m16 = p;
            if (__ring_m16._tag === "Constructor") {
              const pname = __ring_m16.name; const fields = __ring_m16.fields;
              if ((pname === v.name)) {
                _Set_insert(covered, v.name);
                List_push(sub_patterns_for_variant, fields);
              }
              break __ring_match16;
            }
            if (__ring_m16._tag === "NamedConstructor") {
              const pname = __ring_m16.name; const nfields = __ring_m16.fields;
              __ring_match17: {
                const __ring_m17 = v.field_names;
                if (__ring_m17._tag === "some") {
                  const fnames = __ring_m17._0;
                  if ((pname === v.name)) {
                    _Set_insert(covered, v.name);
                    const positional = named_pattern_to_positional(nfields, fnames, List_len(v.fields));
                    List_push(sub_patterns_for_variant, positional);
                  }
                  break __ring_match17;
                }
                if (__ring_m17._tag === "none") {
                  break __ring_match17;
                }
                __match_fail(__ring_m17);
              }
              break __ring_match16;
            }
            break __ring_match16;
          }
        }
        if ((_Set_contains(covered, v.name, __Str_Eq) === false)) {
        } else {
          if ((List_len(v.fields) > 0)) {
            const wild = ast$Pattern_Wildcard(ast$span_zero());
            let normalized = [];
            for (const row of sub_patterns_for_variant) {
              let padded = list_clone(row);
              while ((List_len(padded) < List_len(v.fields))) {
                List_push(padded, wild);
              }
              List_push(normalized, padded);
            }
            let expanding = set_new();
            _Set_insert(expanding, types$type_to_string(resolved));
            const missing_fields = check_matrix(normalized, v.fields, subst, expanding);
            __ring_match18: {
              const __ring_m18 = missing_fields;
              if (__ring_m18._tag === "some") {
                const mf = __ring_m18._0;
                const joined = join_strs(mf, ", ");
                return Option_some(`${v.name}(${joined})`);
                break __ring_match18;
              }
              if (__ring_m18._tag === "none") {
                break __ring_match18;
              }
              __match_fail(__ring_m18);
            }
          }
        }
      }
      for (const vn of variant_names) {
        if ((_Set_contains(covered, vn, __Str_Eq) === false)) {
          return Option_some(vn);
        }
      }
      return Option_none;
      break __ring_match15;
    }
    if (__ring_m15._tag === "BoolType") {
      let has_true = false;
      let has_false = false;
      for (const p of patterns) {
        __ring_match19: {
          const __ring_m19 = p;
          if (__ring_m19._tag === "Literal") {
            const value = __ring_m19.value;
            __ring_match20: {
              const __ring_m20 = value;
              if (__ring_m20._tag === "BoolVal") {
                const b = __ring_m20._0;
                if (b) {
                  has_true = true;
                } else {
                  has_false = true;
                }
                break __ring_match20;
              }
              break __ring_match20;
            }
            break __ring_match19;
          }
          break __ring_match19;
        }
      }
      if ((has_true === true)) {
        if ((has_false === true)) {
          return Option_none;
        } else {
          return Option_some("false");
        }
      } else {
        return Option_some("true");
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "StructType") {
      const sname = __ring_m15.name; const sfields = __ring_m15.fields;
      let covered = false;
      let sub_patterns = [];
      let field_names = [];
      let field_types = [];
      for (const f of sfields) {
        List_push(field_names, f.name);
        List_push(field_types, f.ty);
      }
      for (const p of patterns) {
        __ring_match21: {
          const __ring_m21 = p;
          if (__ring_m21._tag === "NamedConstructor") {
            const pname = __ring_m21.name; const nfields = __ring_m21.fields;
            if ((pname === sname)) {
              covered = true;
              const positional = named_pattern_to_positional(nfields, field_names, List_len(sfields));
              List_push(sub_patterns, positional);
            }
            break __ring_match21;
          }
          if (__ring_m21._tag === "Constructor") {
            const pname = __ring_m21.name; const cfields = __ring_m21.fields;
            if ((pname === sname)) {
              covered = true;
              List_push(sub_patterns, cfields);
            }
            break __ring_match21;
          }
          break __ring_match21;
        }
      }
      if ((covered === false)) {
        return Option_some(sname);
      }
      if ((List_len(sfields) > 0)) {
        const wild = ast$Pattern_Wildcard(ast$span_zero());
        let normalized = [];
        for (const row of sub_patterns) {
          let padded = list_clone(row);
          while ((List_len(padded) < List_len(sfields))) {
            List_push(padded, wild);
          }
          List_push(normalized, padded);
        }
        let expanding = set_new();
        _Set_insert(expanding, types$type_to_string(resolved));
        const missing_fields = check_matrix(normalized, field_types, subst, expanding);
        __ring_match22: {
          const __ring_m22 = missing_fields;
          if (__ring_m22._tag === "some") {
            const mf = __ring_m22._0;
            const joined = join_strs(mf, ", ");
            return Option_some(`${sname}(${joined})`);
            break __ring_match22;
          }
          if (__ring_m22._tag === "none") {
            break __ring_match22;
          }
          __match_fail(__ring_m22);
        }
      }
      return Option_none;
      break __ring_match15;
    }
    if (__ring_m15._tag === "UnitType") {
      return Option_none;
      break __ring_match15;
    }
    if (__ring_m15._tag === "TupleType") {
      const elements = __ring_m15.elements;
      let matrix = [];
      for (const p of patterns) {
        __ring_match23: {
          const __ring_m23 = p;
          if (__ring_m23._tag === "TuplePattern") {
            const pelems = __ring_m23.elements;
            if ((List_len(pelems) === List_len(elements))) {
              List_push(matrix, pelems);
            }
            break __ring_match23;
          }
          break __ring_match23;
        }
      }
      if ((List_len(matrix) === 0)) {
        const underscores = elements.map((function(e) { return "_"; }));
        const joined = join_strs(underscores, ", ");
        return Option_some(`(${joined})`);
      }
      const missing = check_matrix(matrix, elements, subst, set_new());
      __ring_match24: {
        const __ring_m24 = missing;
        if (__ring_m24._tag === "some") {
          const m = __ring_m24._0;
          const joined = join_strs(m, ", ");
          return Option_some(`(${joined})`);
          break __ring_match24;
        }
        if (__ring_m24._tag === "none") {
          return Option_none;
          break __ring_match24;
        }
        __match_fail(__ring_m24);
      }
      break __ring_match15;
    }
    return Option_some("_");
    break __ring_match15;
  }
}

function finite_type_ctors(ty) {
  __ring_match25: {
    const __ring_m25 = ty;
    if (__ring_m25._tag === "BoolType") {
      let result = [];
      List_push(result, new Ctor("true", 0, [], Option_none, false));
      List_push(result, new Ctor("false", 0, [], Option_none, false));
      return Option_some(result);
      break __ring_match25;
    }
    if (__ring_m25._tag === "EnumType") {
      const variants = __ring_m25.variants;
      let result = [];
      for (const v of variants) {
        List_push(result, new Ctor(v.name, List_len(v.fields), v.fields, v.field_names, false));
      }
      return Option_some(result);
      break __ring_match25;
    }
    if (__ring_m25._tag === "StructType") {
      const name = __ring_m25.name; const fields = __ring_m25.fields;
      let field_types = [];
      let field_names = [];
      for (const f of fields) {
        List_push(field_types, f.ty);
        List_push(field_names, f.name);
      }
      let result = [];
      List_push(result, new Ctor(name, List_len(fields), field_types, Option_some(field_names), false));
      return Option_some(result);
      break __ring_match25;
    }
    if (__ring_m25._tag === "UnitType") {
      let result = [];
      List_push(result, new Ctor("()", 0, [], Option_none, false));
      return Option_some(result);
      break __ring_match25;
    }
    if (__ring_m25._tag === "TupleType") {
      const elements = __ring_m25.elements;
      let result = [];
      List_push(result, new Ctor("", List_len(elements), elements, Option_none, true));
      return Option_some(result);
      break __ring_match25;
    }
    return Option_none;
    break __ring_match25;
  }
}

function wild_pattern() {
  return ast$Pattern_Wildcard(ast$span_zero());
}

function named_pattern_to_positional(fields, field_names, arity) {
  const wild = wild_pattern();
  let result = [];
  const __ring_end0 = arity;
  for (let i = 0; i < __ring_end0; i++) {
    List_push(result, wild);
  }
  for (const f of fields) {
    const idx = index_of(field_names, f.name);
    if ((idx >= 0)) {
      if ((idx < arity)) {
        let new_result = [];
        const __ring_end1 = List_len(result);
        for (let j = 0; j < __ring_end1; j++) {
          if ((j === idx)) {
            List_push(new_result, f.pattern);
          } else {
            List_push(new_result, pat_at(result, j));
          }
        }
        result = new_result;
      }
    }
  }
  return result;
}

function index_of(list, target) {
  const __ring_end2 = List_len(list);
  for (let i = 0; i < __ring_end2; i++) {
    if ((str_at(list, i) === target)) {
      return i;
    }
  }
  return (0 - 1);
}

function specialize_row(row, ctor) {
  const first = pat_at(row, 0);
  let rest = [];
  const __ring_end3 = List_len(row);
  for (let i = 1; i < __ring_end3; i++) {
    List_push(rest, pat_at(row, i));
  }
  __ring_match26: {
    const __ring_m26 = first;
    if (__ring_m26._tag === "Wildcard") {
      let result = [];
      const wild = wild_pattern();
      const __ring_end4 = ctor.arity;
      for (let i = 0; i < __ring_end4; i++) {
        List_push(result, wild);
      }
      List_extend(result, rest);
      return Option_some(result);
      break __ring_match26;
    }
    if (__ring_m26._tag === "Binding") {
      let result = [];
      const wild = wild_pattern();
      const __ring_end5 = ctor.arity;
      for (let i = 0; i < __ring_end5; i++) {
        List_push(result, wild);
      }
      List_extend(result, rest);
      return Option_some(result);
      break __ring_match26;
    }
    if (__ring_m26._tag === "Literal") {
      const value = __ring_m26.value;
      __ring_match27: {
        const __ring_m27 = value;
        if (__ring_m27._tag === "BoolVal") {
          const b = __ring_m27._0;
          const match_name = (b ? "true" : "false");
          if ((match_name === ctor.name)) {
            return Option_some(rest);
          } else {
            return Option_none;
          }
          break __ring_match27;
        }
        return Option_none;
        break __ring_match27;
      }
      break __ring_match26;
    }
    if (__ring_m26._tag === "Constructor") {
      const name = __ring_m26.name; const fields = __ring_m26.fields;
      if ((name === ctor.name)) {
        let sub = list_clone(fields);
        const wild = wild_pattern();
        while ((List_len(sub) < ctor.arity)) {
          List_push(sub, wild);
        }
        List_extend(sub, rest);
        return Option_some(sub);
      } else {
        return Option_none;
      }
      break __ring_match26;
    }
    if (__ring_m26._tag === "NamedConstructor") {
      const name = __ring_m26.name; const nfields = __ring_m26.fields;
      if ((name === ctor.name)) {
        const field_names = (function() {
  const __ring_m = ctor.field_names;
  if (__ring_m._tag === "some") { const fns = __ring_m._0; return fns; }
  if (__ring_m._tag === "none") { return (function() {
  const empty = [];
  return empty;
})(); }
  __match_fail(__ring_m);
})();
        let positional = named_pattern_to_positional(nfields, field_names, ctor.arity);
        List_extend(positional, rest);
        return Option_some(positional);
      } else {
        return Option_none;
      }
      break __ring_match26;
    }
    if (__ring_m26._tag === "TuplePattern") {
      const elements = __ring_m26.elements;
      if ((ctor.is_tuple === true)) {
        if ((List_len(elements) === ctor.arity)) {
          let result = list_clone(elements);
          List_extend(result, rest);
          return Option_some(result);
        } else {
          return Option_none;
        }
      } else {
        return Option_none;
      }
      break __ring_match26;
    }
    __match_fail(__ring_m26);
  }
}

function check_matrix(rows, col_types, subst, expanding) {
  if ((List_len(col_types) === 0)) {
    if ((List_len(rows) > 0)) {
      return Option_none;
    } else {
      const empty = [];
      return Option_some(empty);
    }
  }
  const first_type = env$apply_subst(subst, type_at(col_types, 0));
  let rest_types = [];
  const __ring_end6 = List_len(col_types);
  for (let i = 1; i < __ring_end6; i++) {
    List_push(rest_types, type_at(col_types, i));
  }
  const type_key = (function() {
  const __ring_m = first_type;
  if (__ring_m._tag === "EnumType") { return types$type_to_string(first_type); }
  return "";
})();
  const is_reentrant = ((type_key !== "") ? _Set_contains(expanding, type_key, __Str_Eq) : false);
  const ctors = (is_reentrant ? Option_none : finite_type_ctors(first_type));
  __ring_match28: {
    const __ring_m28 = ctors;
    if (__ring_m28._tag === "some") {
      const ctor_list = __ring_m28._0;
      let new_expanding = set_clone(expanding);
      if ((type_key !== "")) {
        if (type_is_recursive(first_type, type_key)) {
          _Set_insert(new_expanding, type_key);
        }
      }
      for (const ctor of ctor_list) {
        let specialized = [];
        for (const row of rows) {
          __ring_match29: {
            const __ring_m29 = specialize_row(row, ctor);
            if (__ring_m29._tag === "some") {
              const s = __ring_m29._0;
              List_push(specialized, s);
              break __ring_match29;
            }
            if (__ring_m29._tag === "none") {
              break __ring_match29;
            }
            __match_fail(__ring_m29);
          }
        }
        let new_types = [];
        List_extend(new_types, ctor.field_types);
        List_extend(new_types, rest_types);
        const sub = check_matrix(specialized, new_types, subst, new_expanding);
        __ring_match30: {
          const __ring_m30 = sub;
          if (__ring_m30._tag === "some") {
            const sub_result = __ring_m30._0;
            let ctor_sub = [];
            const __ring_end7 = ctor.arity;
            for (let i = 0; i < __ring_end7; i++) {
              List_push(ctor_sub, str_at(sub_result, i));
            }
            let rest_sub = [];
            const __ring_end8 = List_len(sub_result);
            for (let i = ctor.arity; i < __ring_end8; i++) {
              List_push(rest_sub, str_at(sub_result, i));
            }
            let ctor_str = "";
            if (ctor.is_tuple) {
              const joined_sub = join_strs(ctor_sub, ", ");
              ctor_str = `(${joined_sub})`;
            } else {
              if ((ctor.arity === 0)) {
                ctor_str = ctor.name;
              } else {
                const joined_sub2 = join_strs(ctor_sub, ", ");
                ctor_str = `${ctor.name}(${joined_sub2})`;
              }
            }
            let result = [];
            List_push(result, ctor_str);
            List_extend(result, rest_sub);
            return Option_some(result);
            break __ring_match30;
          }
          if (__ring_m30._tag === "none") {
            break __ring_match30;
          }
          __match_fail(__ring_m30);
        }
      }
      return Option_none;
      break __ring_match28;
    }
    if (__ring_m28._tag === "none") {
      let defaults = [];
      for (const row of rows) {
        const first = pat_at(row, 0);
        __ring_match31: {
          const __ring_m31 = first;
          if (__ring_m31._tag === "Wildcard") {
            let tail = [];
            const __ring_end9 = List_len(row);
            for (let i = 1; i < __ring_end9; i++) {
              List_push(tail, pat_at(row, i));
            }
            List_push(defaults, tail);
            break __ring_match31;
          }
          if (__ring_m31._tag === "Binding") {
            let tail = [];
            const __ring_end10 = List_len(row);
            for (let i = 1; i < __ring_end10; i++) {
              List_push(tail, pat_at(row, i));
            }
            List_push(defaults, tail);
            break __ring_match31;
          }
          break __ring_match31;
        }
      }
      const sub = check_matrix(defaults, rest_types, subst, expanding);
      __ring_match32: {
        const __ring_m32 = sub;
        if (__ring_m32._tag === "some") {
          const s = __ring_m32._0;
          let result = [];
          List_push(result, "_");
          List_extend(result, s);
          return Option_some(result);
          break __ring_match32;
        }
        if (__ring_m32._tag === "none") {
          return Option_none;
          break __ring_match32;
        }
        __match_fail(__ring_m32);
      }
      break __ring_match28;
    }
    __match_fail(__ring_m28);
  }
}

function join_strs(parts, sep) {
  let result = "";
  const __ring_end11 = List_len(parts);
  for (let i = 0; i < __ring_end11; i++) {
    if ((i > 0)) {
      result = `${result}${sep}`;
    }
    const part = str_at(parts, i);
    result = `${result}${part}`;
  }
  return result;
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


export { check_exhaustive };