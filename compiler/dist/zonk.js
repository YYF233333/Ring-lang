import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_tuple_eq, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { new_union_find as union_find$new_union_find, uf_find as union_find$uf_find, uf_bind as union_find$uf_bind, uf_lookup as union_find$uf_lookup, uf_union as union_find$uf_union, uf_insert as union_find$uf_insert, UnionFind as union_find$UnionFind } from "./union_find.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst_map as env$apply_subst_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __IdGen_Eq as env$__IdGen_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __ImplEntry_Clone as env$__ImplEntry_Clone, __FnBound_Clone as env$__FnBound_Clone, __IdGen_Clone as env$__IdGen_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __IdGen_Ord as env$__IdGen_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __ImplEntry_Debug as env$__ImplEntry_Debug, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";

function List_first(self) {
  return List_get(self, 0);
}
function List_last(self) {
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

class ZonkCtx {
  constructor(subst, names) {
    this.subst = subst;
    this.names = names;
  }
}

function zonk_type(ctx, t) {
  const resolved = env$apply_subst(ctx.subst, t);
  return label_vars(ctx.names, resolved);
}

function label_effect(names, e) {
  __ring_match6: {
    const __ring_m6 = e;
    if (__ring_m6._tag === "FailEffect") {
      const error_type = __ring_m6.error_type;
      return types$Effect_FailEffect(label_vars(names, error_type));
      break __ring_match6;
    }
    if (__ring_m6._tag === "MutEffect") {
      const state_type = __ring_m6.state_type;
      return types$Effect_MutEffect(label_vars(names, state_type));
      break __ring_match6;
    }
    if (__ring_m6._tag === "CustomEffect") {
      const name = __ring_m6.name; const type_args = __ring_m6.type_args;
      return types$Effect_CustomEffect(name, type_args.map((function(a) { return label_vars(names, a); })));
      break __ring_match6;
    }
    if (__ring_m6._tag === "IoEffect") {
      return e;
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function label_effect_row(names, row) {
  return new types$EffectRow(row.effects.map((function(e) { return label_effect(names, e); })), row.tail);
}

function label_vars(names, t) {
  __ring_match7: {
    const __ring_m7 = t;
    if (__ring_m7._tag === "TypeVar") {
      const id = __ring_m7.id; const name = __ring_m7.name;
      __ring_match8: {
        const __ring_m8 = _Map_get(names, id);
        if (__ring_m8._tag === "some") {
          const n = __ring_m8._0;
          return types$Type_TypeVar(id, Option_some(n));
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          return t;
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "FnType") {
      const params = __ring_m7.params; const return_type = __ring_m7.return_type; const effects = __ring_m7.effects;
      return types$Type_FnType(params.map((function(p) { return label_vars(names, p); })), label_vars(names, return_type), label_effect_row(names, effects));
      break __ring_match7;
    }
    if (__ring_m7._tag === "StructType") {
      const name = __ring_m7.name; const type_params = __ring_m7.type_params; const fields = __ring_m7.fields;
      return types$Type_StructType(name, type_params.map((function(p) { return label_vars(names, p); })), fields);
      break __ring_match7;
    }
    if (__ring_m7._tag === "EnumType") {
      const name = __ring_m7.name; const type_params = __ring_m7.type_params; const variants = __ring_m7.variants;
      return types$Type_EnumType(name, type_params.map((function(p) { return label_vars(names, p); })), variants);
      break __ring_match7;
    }
    if (__ring_m7._tag === "GenericType") {
      const base = __ring_m7.base; const args = __ring_m7.args;
      return types$Type_GenericType(label_vars(names, base), args.map((function(a) { return label_vars(names, a); })));
      break __ring_match7;
    }
    if (__ring_m7._tag === "RecordType") {
      const fields = __ring_m7.fields; const tail = __ring_m7.tail; const tail_name = __ring_m7.tail_name;
      const new_tail_name = (function() {
  const __ring_m = tail;
  if (__ring_m._tag === "some") { const t_id = __ring_m._0; return (function() {
  const __ring_m = _Map_get(names, t_id);
  if (__ring_m._tag === "some") { const n = __ring_m._0; return Option_some(n); }
  if (__ring_m._tag === "none") { return tail_name; }
  __match_fail(__ring_m);
})(); }
  if (__ring_m._tag === "none") { return tail_name; }
  __match_fail(__ring_m);
})();
      return types$Type_RecordType(fields.map((function(f) { return new types$RecordField(f.name, label_vars(names, f.ty)); })), tail, new_tail_name);
      break __ring_match7;
    }
    if (__ring_m7._tag === "EffectRowType") {
      const effects = __ring_m7.effects; const tail = __ring_m7.tail;
      return types$Type_EffectRowType(effects.map((function(e) { return label_effect(names, e); })), tail);
      break __ring_match7;
    }
    if (__ring_m7._tag === "TupleType") {
      const elements = __ring_m7.elements;
      return types$Type_TupleType(elements.map((function(e) { return label_vars(names, e); })));
      break __ring_match7;
    }
    if (__ring_m7._tag === "IntType") {
      return t;
      break __ring_match7;
    }
    if (__ring_m7._tag === "FloatType") {
      return t;
      break __ring_match7;
    }
    if (__ring_m7._tag === "StrType") {
      return t;
      break __ring_match7;
    }
    if (__ring_m7._tag === "BoolType") {
      return t;
      break __ring_match7;
    }
    if (__ring_m7._tag === "UnitType") {
      return t;
      break __ring_match7;
    }
    if (__ring_m7._tag === "NeverType") {
      return t;
      break __ring_match7;
    }
    if (__ring_m7._tag === "AnyType") {
      return t;
      break __ring_match7;
    }
    if (__ring_m7._tag === "ErrorType") {
      return t;
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
}

function zonk_row(ctx, r) {
  return env$apply_subst_row(ctx.subst, r);
}

function zonk_param(ctx, p) {
  return new hir$HParam(p.name, zonk_type(ctx, p.ty), p.def_id, p.is_mutable);
}

function zonk_block(ctx, block) {
  __ring_match9: {
    const __ring_m9 = block;
    if (__ring_m9._tag === "Block") {
      const stmts = __ring_m9.stmts; const tail = __ring_m9.tail; const ty = __ring_m9.ty; const effects = __ring_m9.effects; const span = __ring_m9.span;
      const z_stmts = stmts.map((function(s) { return zonk_stmt(ctx, s); }));
      const z_tail = (function() {
  const __ring_m = tail;
  if (__ring_m._tag === "some") { const t = __ring_m._0; return Option_some(zonk_expr(ctx, t)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return hir$HExpr_Block(z_stmts, z_tail, zonk_type(ctx, ty), zonk_row(ctx, effects), span);
      break __ring_match9;
    }
    return panic("zonk_block: expected Block");
    break __ring_match9;
  }
}

function zonk_stmt(ctx, stmt) {
  __ring_match10: {
    const __ring_m10 = stmt;
    if (__ring_m10._tag === "Let") {
      const name = __ring_m10.name; const name_span = __ring_m10.name_span; const def_id = __ring_m10.def_id; const ty = __ring_m10.ty; const init = __ring_m10.init; const span = __ring_m10.span;
      return hir$HStmt_Let(name, name_span, def_id, zonk_type(ctx, ty), zonk_expr(ctx, init), span);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Var") {
      const name = __ring_m10.name; const name_span = __ring_m10.name_span; const def_id = __ring_m10.def_id; const ty = __ring_m10.ty; const init = __ring_m10.init; const span = __ring_m10.span;
      return hir$HStmt_Var(name, name_span, def_id, zonk_type(ctx, ty), zonk_expr(ctx, init), span);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Assign") {
      const target = __ring_m10.target; const value = __ring_m10.value; const span = __ring_m10.span;
      return hir$HStmt_Assign(zonk_expr(ctx, target), zonk_expr(ctx, value), span);
      break __ring_match10;
    }
    if (__ring_m10._tag === "ExprStmt") {
      const expr = __ring_m10.expr; const span = __ring_m10.span;
      return hir$HStmt_ExprStmt(zonk_expr(ctx, expr), span);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Return") {
      const value = __ring_m10.value; const span = __ring_m10.span;
      const z_val = (function() {
  const __ring_m = value;
  if (__ring_m._tag === "some") { const v = __ring_m._0; return Option_some(zonk_expr(ctx, v)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return hir$HStmt_Return(z_val, span);
      break __ring_match10;
    }
    if (__ring_m10._tag === "While") {
      const condition = __ring_m10.condition; const body = __ring_m10.body; const span = __ring_m10.span;
      return hir$HStmt_While(zonk_expr(ctx, condition), zonk_block(ctx, body), span);
      break __ring_match10;
    }
    if (__ring_m10._tag === "ForIn") {
      const binding = __ring_m10.binding; const binding_span = __ring_m10.binding_span; const def_id = __ring_m10.def_id; const destructure = __ring_m10.destructure; const iterable = __ring_m10.iterable; const body = __ring_m10.body; const span = __ring_m10.span;
      return hir$HStmt_ForIn(binding, binding_span, def_id, destructure, zonk_expr(ctx, iterable), zonk_block(ctx, body), span);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Break") {
      const span = __ring_m10.span;
      return stmt;
      break __ring_match10;
    }
    if (__ring_m10._tag === "Continue") {
      const span = __ring_m10.span;
      return stmt;
      break __ring_match10;
    }
    if (__ring_m10._tag === "LetDestructure") {
      const pattern = __ring_m10.pattern; const bindings = __ring_m10.bindings; const init = __ring_m10.init; const span = __ring_m10.span;
      const z_bindings = bindings.map((function(b) { return new hir$HLetDestructureBinding(b.name, b.def_id, zonk_type(ctx, b.ty)); }));
      return hir$HStmt_LetDestructure(pattern, z_bindings, zonk_expr(ctx, init), span);
      break __ring_match10;
    }
    if (__ring_m10._tag === "IfLet") {
      const pattern = __ring_m10.pattern; const expr = __ring_m10.expr; const then_block = __ring_m10.then_block; const else_block = __ring_m10.else_block; const span = __ring_m10.span;
      const z_else = (function() {
  const __ring_m = else_block;
  if (__ring_m._tag === "some") { const eb = __ring_m._0; return Option_some(zonk_block(ctx, eb)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return hir$HStmt_IfLet(pattern, zonk_expr(ctx, expr), zonk_block(ctx, then_block), z_else, span);
      break __ring_match10;
    }
    __match_fail(__ring_m10);
  }
}

function zonk_expr(ctx, expr) {
  const z_ty = zonk_type(ctx, hir$hexpr_type(expr));
  const z_eff = zonk_row(ctx, hir$hexpr_effects(expr));
  const z_span = hir$hexpr_span(expr);
  __ring_match11: {
    const __ring_m11 = expr;
    if (__ring_m11._tag === "IntLit") {
      const value = __ring_m11.value;
      return hir$HExpr_IntLit(value, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "FloatLit") {
      const value = __ring_m11.value;
      return hir$HExpr_FloatLit(value, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "StrLit") {
      const value = __ring_m11.value;
      return hir$HExpr_StrLit(value, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "BoolLit") {
      const value = __ring_m11.value;
      return hir$HExpr_BoolLit(value, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "Ident") {
      const name = __ring_m11.name; const resolved_name = __ring_m11.resolved_name; const def_id = __ring_m11.def_id; const dict_closure_dicts = __ring_m11.dict_closure_dicts;
      return hir$HExpr_Ident(name, resolved_name, def_id, dict_closure_dicts, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "BinOp") {
      const op = __ring_m11.op; const left = __ring_m11.left; const right = __ring_m11.right; const eq_dispatch = __ring_m11.eq_dispatch; const ord_dispatch = __ring_m11.ord_dispatch;
      return hir$HExpr_BinOp(op, zonk_expr(ctx, left), zonk_expr(ctx, right), eq_dispatch, ord_dispatch, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "UnaryOp") {
      const op = __ring_m11.op; const operand = __ring_m11.operand;
      return hir$HExpr_UnaryOp(op, zonk_expr(ctx, operand), z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "Call") {
      const callee = __ring_m11.callee; const args = __ring_m11.args; const type_args = __ring_m11.type_args; const resolved_dicts = __ring_m11.resolved_dicts; const dict_dispatch = __ring_m11.dict_dispatch;
      return hir$HExpr_Call(zonk_expr(ctx, callee), args.map((function(a) { return zonk_expr(ctx, a); })), type_args.map((function(t) { return zonk_type(ctx, t); })), resolved_dicts, dict_dispatch, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "FieldAccess") {
      const receiver = __ring_m11.receiver; const field = __ring_m11.field;
      return hir$HExpr_FieldAccess(zonk_expr(ctx, receiver), field, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "StructLit") {
      const name = __ring_m11.name; const type_args = __ring_m11.type_args; const fields = __ring_m11.fields; const spread = __ring_m11.spread;
      const z_spread = (function() {
  const __ring_m = spread;
  if (__ring_m._tag === "some") { const s = __ring_m._0; return Option_some(zonk_expr(ctx, s)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return hir$HExpr_StructLit(name, type_args.map((function(t) { return zonk_type(ctx, t); })), fields.map((function(f) { return new hir$HStructFieldInit(f.name, zonk_expr(ctx, f.value)); })), z_spread, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "NamedVariantConstruct") {
      const enum_name = __ring_m11.enum_name; const variant_name = __ring_m11.variant_name; const fields = __ring_m11.fields; const spread = __ring_m11.spread;
      const z_spread = (function() {
  const __ring_m = spread;
  if (__ring_m._tag === "some") { const s = __ring_m._0; return Option_some(zonk_expr(ctx, s)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return hir$HExpr_NamedVariantConstruct(enum_name, variant_name, fields.map((function(f) { return new hir$HStructFieldInit(f.name, zonk_expr(ctx, f.value)); })), z_spread, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "MatchExpr") {
      const scrutinee = __ring_m11.scrutinee; const arms = __ring_m11.arms;
      return hir$HExpr_MatchExpr(zonk_expr(ctx, scrutinee), arms.map((function(a) { return (function() {
  const z_guard = (function() {
  const __ring_m = a.guard;
  if (__ring_m._tag === "some") { const g = __ring_m._0; return Option_some(zonk_expr(ctx, g)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
  return new hir$HMatchArm(a.pattern, z_guard, zonk_expr(ctx, a.body), a.span);
})(); })), z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "Block") {
      const stmts = __ring_m11.stmts; const tail = __ring_m11.tail;
      const z_tail = (function() {
  const __ring_m = tail;
  if (__ring_m._tag === "some") { const t = __ring_m._0; return Option_some(zonk_expr(ctx, t)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return hir$HExpr_Block(stmts.map((function(s) { return zonk_stmt(ctx, s); })), z_tail, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "IfExpr") {
      const condition = __ring_m11.condition; const then_branch = __ring_m11.then_branch; const else_branch = __ring_m11.else_branch;
      const z_else = (function() {
  const __ring_m = else_branch;
  if (__ring_m._tag === "some") { const eb = __ring_m._0; return Option_some(zonk_expr(ctx, eb)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
      return hir$HExpr_IfExpr(zonk_expr(ctx, condition), zonk_block(ctx, then_branch), z_else, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "StringInterp") {
      const parts = __ring_m11.parts;
      return hir$HExpr_StringInterp(parts.map((function(p) { return (function() {
  const __ring_m = p;
  if (__ring_m._tag === "Literal") { const s = __ring_m._0; return p; }
  if (__ring_m._tag === "Expression") { const e = __ring_m._0; return hir$HStringInterpPart_Expression(zonk_expr(ctx, e)); }
  __match_fail(__ring_m);
})(); })), z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "TryCatch") {
      const body = __ring_m11.body; const arms = __ring_m11.arms;
      return hir$HExpr_TryCatch(zonk_expr(ctx, body), arms.map((function(a) { return new hir$HMatchArm(a.pattern, (function() {
  const __ring_m = a.guard;
  if (__ring_m._tag === "some") { const g = __ring_m._0; return Option_some(zonk_expr(ctx, g)); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})(), zonk_expr(ctx, a.body), a.span); })), z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "HandleExpr") {
      const body = __ring_m11.body; const handlers = __ring_m11.handlers;
      return hir$HExpr_HandleExpr(zonk_expr(ctx, body), handlers.map((function(h) { return new hir$HEffectHandler(h.effect_name, h.op_name, h.params.map((function(p) { return zonk_param(ctx, p); })), h.resume_name, zonk_expr(ctx, h.body)); })), z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "Lambda") {
      const params = __ring_m11.params; const return_type = __ring_m11.return_type; const body = __ring_m11.body;
      return hir$HExpr_Lambda(params.map((function(p) { return zonk_param(ctx, p); })), zonk_type(ctx, return_type), zonk_expr(ctx, body), z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "EffectOp") {
      const effect_name = __ring_m11.effect_name; const op_name = __ring_m11.op_name; const args = __ring_m11.args;
      return hir$HExpr_EffectOp(effect_name, op_name, args.map((function(a) { return zonk_expr(ctx, a); })), z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "RangeExpr") {
      const start = __ring_m11.start; const end = __ring_m11.end; const inclusive = __ring_m11.inclusive;
      return hir$HExpr_RangeExpr(zonk_expr(ctx, start), zonk_expr(ctx, end), inclusive, z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "ListLit") {
      const elements = __ring_m11.elements;
      return hir$HExpr_ListLit(elements.map((function(e) { return zonk_expr(ctx, e); })), z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "TupleLit") {
      const elements = __ring_m11.elements;
      return hir$HExpr_TupleLit(elements.map((function(e) { return zonk_expr(ctx, e); })), z_ty, z_eff, z_span);
      break __ring_match11;
    }
    if (__ring_m11._tag === "IndexExpr") {
      const receiver = __ring_m11.receiver; const index = __ring_m11.index;
      return hir$HExpr_IndexExpr(zonk_expr(ctx, receiver), zonk_expr(ctx, index), z_ty, z_eff, z_span);
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
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


export { ZonkCtx, zonk_type, zonk_row, zonk_param, zonk_block, zonk_expr };