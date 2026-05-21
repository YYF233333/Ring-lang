import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_contains, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { mono as env$mono, new_type_env as env$new_type_env, apply_subst_map as env$apply_subst_map, apply_subst_row_map as env$apply_subst_row_map, apply_subst as env$apply_subst, apply_subst_row as env$apply_subst_row, SchemeBound as env$SchemeBound, TypeScheme as env$TypeScheme, StructDef as env$StructDef, EnumDef as env$EnumDef, EffectOpDef as env$EffectOpDef, BuiltInKind_BkIo as env$BuiltInKind_BkIo, BuiltInKind_BkFail as env$BuiltInKind_BkFail, BuiltInKind_BkMut as env$BuiltInKind_BkMut, EffectDef as env$EffectDef, TraitMethodDef as env$TraitMethodDef, TraitDef as env$TraitDef, ImplEntry as env$ImplEntry, TypeAliasDef as env$TypeAliasDef, FnBound as env$FnBound, SigDef as env$SigDef, Scope as env$Scope, TypeRegistry as env$TypeRegistry, TraitRegistry as env$TraitRegistry, ScopeManager as env$ScopeManager, IdGen as env$IdGen, TypeEnv as env$TypeEnv, __SchemeBound_Eq as env$__SchemeBound_Eq, __FnBound_Eq as env$__FnBound_Eq, __IdGen_Eq as env$__IdGen_Eq, __BuiltInKind_Eq as env$__BuiltInKind_Eq, __SchemeBound_Clone as env$__SchemeBound_Clone, __ImplEntry_Clone as env$__ImplEntry_Clone, __FnBound_Clone as env$__FnBound_Clone, __IdGen_Clone as env$__IdGen_Clone, __BuiltInKind_Clone as env$__BuiltInKind_Clone, __SchemeBound_Ord as env$__SchemeBound_Ord, __FnBound_Ord as env$__FnBound_Ord, __IdGen_Ord as env$__IdGen_Ord, __BuiltInKind_Ord as env$__BuiltInKind_Ord, __SchemeBound_Debug as env$__SchemeBound_Debug, __ImplEntry_Debug as env$__ImplEntry_Debug, __FnBound_Debug as env$__FnBound_Debug, __IdGen_Debug as env$__IdGen_Debug, __BuiltInKind_Debug as env$__BuiltInKind_Debug, TypeEnv_current_var_id as env$TypeEnv_current_var_id, TypeEnv_fresh_var as env$TypeEnv_fresh_var, TypeEnv_fresh_var_id as env$TypeEnv_fresh_var_id, TypeEnv_fresh_def_id as env$TypeEnv_fresh_def_id, TypeEnv_push_scope as env$TypeEnv_push_scope, TypeEnv_pop_scope as env$TypeEnv_pop_scope, TypeEnv_bind as env$TypeEnv_bind, TypeEnv_bind_mono as env$TypeEnv_bind_mono, TypeEnv_record_def_span as env$TypeEnv_record_def_span, TypeEnv_rebind as env$TypeEnv_rebind, TypeEnv_lookup as env$TypeEnv_lookup, TypeEnv_instantiate as env$TypeEnv_instantiate } from "./env.js";
import { register_decl_public as infer_register$register_decl_public, prefix_decl_name as infer_register$prefix_decl_name, register_decls_two_phase as infer_register$register_decls_two_phase, resolve_effect_expr as infer_register$resolve_effect_expr, resolve_declared_effects as infer_register$resolve_declared_effects } from "./infer_register.js";

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

class ModuleExports {
  constructor(module_key, module_prefix, values, types, effects, traits, trait_impls, impl_methods, inherent_methods, struct_field_orders, extern_values) {
    this.module_key = module_key;
    this.module_prefix = module_prefix;
    this.values = values;
    this.types = types;
    this.effects = effects;
    this.traits = traits;
    this.trait_impls = trait_impls;
    this.impl_methods = impl_methods;
    this.inherent_methods = inherent_methods;
    this.struct_field_orders = struct_field_orders;
    this.extern_values = extern_values;
  }
}

function TypeDef_StructDef_(_0) {
  return { _tag: "StructDef_", _0 };
}
function TypeDef_EnumDef_(_0) {
  return { _tag: "EnumDef_", _0 };
}

function extract_exports(module_key, module_prefix, program, hprogram, env) {
  let values = map_new();
  let types = map_new();
  let effects = map_new();
  let traits = map_new();
  let impl_methods = map_new();
  let inherent_methods = map_new();
  let struct_field_orders = map_new();
  let extern_values = set_new();
  for (const decl of program.decls) {
    __ring_match0: {
      const __ring_m0 = decl;
      if (__ring_m0._tag === "Fn") {
        const name = __ring_m0.name; const is_pub = __ring_m0.is_pub;
        if (is_pub) {
          __ring_match1: {
            const __ring_m1 = env$TypeEnv_lookup(env, name);
            if (__ring_m1._tag === "some") {
              const scheme = __ring_m1._0;
              _Map_insert(values, name, scheme);
              break __ring_match1;
            }
            if (__ring_m1._tag === "none") {
              break __ring_match1;
            }
            __match_fail(__ring_m1);
          }
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "Struct") {
        const name = __ring_m0.name; const is_pub = __ring_m0.is_pub;
        if (is_pub) {
          __ring_match2: {
            const __ring_m2 = _Map_get(env.types.structs, name);
            if (__ring_m2._tag === "some") {
              const sdef = __ring_m2._0;
              _Map_insert(types, name, TypeDef_StructDef_(sdef));
              let field_names = [""];
              List_clear(field_names);
              for (const f of sdef.fields) {
                List_push(field_names, f.name);
              }
              _Map_insert(struct_field_orders, name, field_names);
              break __ring_match2;
            }
            if (__ring_m2._tag === "none") {
              break __ring_match2;
            }
            __match_fail(__ring_m2);
          }
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "Enum") {
        const name = __ring_m0.name; const is_pub = __ring_m0.is_pub;
        if (is_pub) {
          __ring_match3: {
            const __ring_m3 = _Map_get(env.types.enums, name);
            if (__ring_m3._tag === "some") {
              const edef = __ring_m3._0;
              _Map_insert(types, name, TypeDef_EnumDef_(edef));
              for (const v of edef.variants) {
                __ring_match4: {
                  const __ring_m4 = env$TypeEnv_lookup(env, v.name);
                  if (__ring_m4._tag === "some") {
                    const vscheme = __ring_m4._0;
                    _Map_insert(values, v.name, vscheme);
                    break __ring_match4;
                  }
                  if (__ring_m4._tag === "none") {
                    break __ring_match4;
                  }
                  __match_fail(__ring_m4);
                }
              }
              break __ring_match3;
            }
            if (__ring_m3._tag === "none") {
              break __ring_match3;
            }
            __match_fail(__ring_m3);
          }
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "Effect") {
        const name = __ring_m0.name; const is_pub = __ring_m0.is_pub;
        if (is_pub) {
          __ring_match5: {
            const __ring_m5 = _Map_get(env.types.effects, name);
            if (__ring_m5._tag === "some") {
              const effdef = __ring_m5._0;
              _Map_insert(effects, name, effdef);
              break __ring_match5;
            }
            if (__ring_m5._tag === "none") {
              break __ring_match5;
            }
            __match_fail(__ring_m5);
          }
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "Trait") {
        const name = __ring_m0.name; const is_pub = __ring_m0.is_pub;
        if (is_pub) {
          __ring_match6: {
            const __ring_m6 = _Map_get(env.trait_reg.traits, name);
            if (__ring_m6._tag === "some") {
              const tdef = __ring_m6._0;
              _Map_insert(traits, name, tdef);
              break __ring_match6;
            }
            if (__ring_m6._tag === "none") {
              break __ring_match6;
            }
            __match_fail(__ring_m6);
          }
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "Impl") {
        const target_type = __ring_m0.target_type; const trait_name = __ring_m0.trait_name; const methods = __ring_m0.methods;
        __ring_match7: {
          const __ring_m7 = _Map_get(env.trait_reg.impl_methods, target_type);
          if (__ring_m7._tag === "some") {
            const methods_map = __ring_m7._0;
            _Map_insert(impl_methods, target_type, map_clone(methods_map));
            break __ring_match7;
          }
          if (__ring_m7._tag === "none") {
            break __ring_match7;
          }
          __match_fail(__ring_m7);
        }
        __ring_match8: {
          const __ring_m8 = trait_name;
          if (__ring_m8._tag === "none") {
            let is_pub_type = false;
            for (const d of program.decls) {
              __ring_match9: {
                const __ring_m9 = d;
                if (__ring_m9._tag === "Struct") {
                  const name = __ring_m9.name; const is_pub = __ring_m9.is_pub;
                  if (((name === target_type) && is_pub)) {
                    is_pub_type = true;
                  }
                  break __ring_match9;
                }
                if (__ring_m9._tag === "Enum") {
                  const name = __ring_m9.name; const is_pub = __ring_m9.is_pub;
                  if (((name === target_type) && is_pub)) {
                    is_pub_type = true;
                  }
                  break __ring_match9;
                }
                break __ring_match9;
              }
            }
            if (is_pub_type) {
              let method_names = [""];
              List_clear(method_names);
              for (const m of methods) {
                __ring_match10: {
                  const __ring_m10 = m;
                  if (__ring_m10._tag === "Fn") {
                    const name = __ring_m10.name;
                    List_push(method_names, name);
                    break __ring_match10;
                  }
                  break __ring_match10;
                }
              }
              __ring_match11: {
                const __ring_m11 = _Map_get(inherent_methods, target_type);
                if (__ring_m11._tag === "some") {
                  const existing = __ring_m11._0;
                  List_extend(existing, method_names);
                  break __ring_match11;
                }
                if (__ring_m11._tag === "none") {
                  _Map_insert(inherent_methods, target_type, method_names);
                  break __ring_match11;
                }
                __match_fail(__ring_m11);
              }
            }
            break __ring_match8;
          }
          if (__ring_m8._tag === "some") {
            break __ring_match8;
          }
          __match_fail(__ring_m8);
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "ExternFn") {
        const name = __ring_m0.name; const is_pub = __ring_m0.is_pub;
        if (is_pub) {
          _Set_insert(extern_values, name);
          __ring_match12: {
            const __ring_m12 = env$TypeEnv_lookup(env, name);
            if (__ring_m12._tag === "some") {
              const scheme = __ring_m12._0;
              _Map_insert(values, name, scheme);
              break __ring_match12;
            }
            if (__ring_m12._tag === "none") {
              break __ring_match12;
            }
            __match_fail(__ring_m12);
          }
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "ExternType") {
        const name = __ring_m0.name; const is_pub = __ring_m0.is_pub;
        if (is_pub) {
          __ring_match13: {
            const __ring_m13 = _Map_get(env.types.structs, name);
            if (__ring_m13._tag === "some") {
              const sdef = __ring_m13._0;
              _Map_insert(types, name, TypeDef_StructDef_(sdef));
              break __ring_match13;
            }
            if (__ring_m13._tag === "none") {
              break __ring_match13;
            }
            __match_fail(__ring_m13);
          }
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "Const") {
        const name = __ring_m0.name; const is_pub = __ring_m0.is_pub;
        if (is_pub) {
          __ring_match14: {
            const __ring_m14 = env$TypeEnv_lookup(env, name);
            if (__ring_m14._tag === "some") {
              const scheme = __ring_m14._0;
              _Map_insert(values, name, scheme);
              break __ring_match14;
            }
            if (__ring_m14._tag === "none") {
              break __ring_match14;
            }
            __match_fail(__ring_m14);
          }
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "ModBlock") {
        const mod_name = __ring_m0.name; const mod_decls = __ring_m0.decls; const mpub = __ring_m0.is_pub;
        if (mpub) {
          for (const subdecl of mod_decls) {
            const prefixed = infer_register$prefix_decl_name(mod_name, subdecl);
            __ring_match15: {
              const __ring_m15 = prefixed;
              if (__ring_m15._tag === "Fn") {
                const fname = __ring_m15.name; const fpub = __ring_m15.is_pub;
                if (fpub) {
                  __ring_match16: {
                    const __ring_m16 = env$TypeEnv_lookup(env, fname);
                    if (__ring_m16._tag === "some") {
                      const scheme = __ring_m16._0;
                      _Map_insert(values, fname, scheme);
                      break __ring_match16;
                    }
                    if (__ring_m16._tag === "none") {
                      break __ring_match16;
                    }
                    __match_fail(__ring_m16);
                  }
                }
                break __ring_match15;
              }
              if (__ring_m15._tag === "Struct") {
                const sname = __ring_m15.name; const spub = __ring_m15.is_pub;
                if (spub) {
                  __ring_match17: {
                    const __ring_m17 = _Map_get(env.types.structs, sname);
                    if (__ring_m17._tag === "some") {
                      const sdef = __ring_m17._0;
                      _Map_insert(types, sname, TypeDef_StructDef_(sdef));
                      let field_names = [""];
                      List_clear(field_names);
                      for (const f of sdef.fields) {
                        List_push(field_names, f.name);
                      }
                      _Map_insert(struct_field_orders, sname, field_names);
                      break __ring_match17;
                    }
                    if (__ring_m17._tag === "none") {
                      break __ring_match17;
                    }
                    __match_fail(__ring_m17);
                  }
                }
                break __ring_match15;
              }
              if (__ring_m15._tag === "Enum") {
                const ename = __ring_m15.name; const epub = __ring_m15.is_pub;
                if (epub) {
                  __ring_match18: {
                    const __ring_m18 = _Map_get(env.types.enums, ename);
                    if (__ring_m18._tag === "some") {
                      const edef = __ring_m18._0;
                      _Map_insert(types, ename, TypeDef_EnumDef_(edef));
                      for (const v of edef.variants) {
                        __ring_match19: {
                          const __ring_m19 = env$TypeEnv_lookup(env, v.name);
                          if (__ring_m19._tag === "some") {
                            const vscheme = __ring_m19._0;
                            _Map_insert(values, v.name, vscheme);
                            break __ring_match19;
                          }
                          if (__ring_m19._tag === "none") {
                            break __ring_match19;
                          }
                          __match_fail(__ring_m19);
                        }
                      }
                      break __ring_match18;
                    }
                    if (__ring_m18._tag === "none") {
                      break __ring_match18;
                    }
                    __match_fail(__ring_m18);
                  }
                }
                break __ring_match15;
              }
              if (__ring_m15._tag === "Const") {
                const cname = __ring_m15.name; const cpub = __ring_m15.is_pub;
                if (cpub) {
                  __ring_match20: {
                    const __ring_m20 = env$TypeEnv_lookup(env, cname);
                    if (__ring_m20._tag === "some") {
                      const scheme = __ring_m20._0;
                      _Map_insert(values, cname, scheme);
                      break __ring_match20;
                    }
                    if (__ring_m20._tag === "none") {
                      break __ring_match20;
                    }
                    __match_fail(__ring_m20);
                  }
                }
                break __ring_match15;
              }
              break __ring_match15;
            }
          }
        }
        break __ring_match0;
      }
      break __ring_match0;
    }
  }
  let trait_impls = [];
  for (const impl_ of env.trait_reg.trait_impls) {
    if ((_Map_contains_key(types, impl_.target_type_name) || _Map_contains_key(traits, impl_.trait_name))) {
      List_push(trait_impls, impl_);
    }
  }
  for (const use_decl of program.uses) {
    if (use_decl.is_pub) {
      __ring_match21: {
        const __ring_m21 = use_decl.imports;
        if (__ring_m21._tag === "NamedItems") {
          const names = __ring_m21.names;
          for (const item of names) {
            const local_name = (function() {
  const __ring_m = item.alias;
  if (__ring_m._tag === "some") { const a = __ring_m._0; return a; }
  if (__ring_m._tag === "none") { return item.name; }
  __match_fail(__ring_m);
})();
            __ring_match22: {
              const __ring_m22 = env$TypeEnv_lookup(env, local_name);
              if (__ring_m22._tag === "some") {
                const scheme = __ring_m22._0;
                _Map_insert(values, local_name, scheme);
                break __ring_match22;
              }
              if (__ring_m22._tag === "none") {
                break __ring_match22;
              }
              __match_fail(__ring_m22);
            }
            __ring_match23: {
              const __ring_m23 = _Map_get(env.types.structs, local_name);
              if (__ring_m23._tag === "some") {
                const sdef = __ring_m23._0;
                _Map_insert(types, local_name, TypeDef_StructDef_(sdef));
                let fnames = [""];
                List_clear(fnames);
                for (const f of sdef.fields) {
                  List_push(fnames, f.name);
                }
                _Map_insert(struct_field_orders, local_name, fnames);
                break __ring_match23;
              }
              if (__ring_m23._tag === "none") {
                break __ring_match23;
              }
              __match_fail(__ring_m23);
            }
            __ring_match24: {
              const __ring_m24 = _Map_get(env.types.enums, local_name);
              if (__ring_m24._tag === "some") {
                const edef = __ring_m24._0;
                _Map_insert(types, local_name, TypeDef_EnumDef_(edef));
                break __ring_match24;
              }
              if (__ring_m24._tag === "none") {
                break __ring_match24;
              }
              __match_fail(__ring_m24);
            }
            __ring_match25: {
              const __ring_m25 = _Map_get(env.types.effects, local_name);
              if (__ring_m25._tag === "some") {
                const effdef = __ring_m25._0;
                _Map_insert(effects, local_name, effdef);
                break __ring_match25;
              }
              if (__ring_m25._tag === "none") {
                break __ring_match25;
              }
              __match_fail(__ring_m25);
            }
            __ring_match26: {
              const __ring_m26 = _Map_get(env.trait_reg.traits, local_name);
              if (__ring_m26._tag === "some") {
                const tdef = __ring_m26._0;
                _Map_insert(traits, local_name, tdef);
                break __ring_match26;
              }
              if (__ring_m26._tag === "none") {
                break __ring_match26;
              }
              __match_fail(__ring_m26);
            }
          }
          break __ring_match21;
        }
        break __ring_match21;
      }
    }
  }
  return new ModuleExports(module_key, module_prefix, values, types, effects, traits, trait_impls, impl_methods, inherent_methods, struct_field_orders, extern_values);
}


export { ModuleExports, TypeDef_StructDef_, TypeDef_EnumDef_, extract_exports };