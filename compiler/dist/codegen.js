import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_contains, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { CELL_METHODS as builtin_methods$CELL_METHODS, STR_METHODS as builtin_methods$STR_METHODS, INT_METHODS as builtin_methods$INT_METHODS, FLOAT_METHODS as builtin_methods$FLOAT_METHODS, LIST_NON_HOF_METHODS as builtin_methods$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as builtin_methods$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as builtin_methods$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as builtin_methods$MAP_HOF_METHODS, SET_NON_HOF_METHODS as builtin_methods$SET_NON_HOF_METHODS, SET_HOF_METHODS as builtin_methods$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as builtin_methods$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as builtin_methods$OPTION_HOF_METHODS } from "./builtin_methods.js";
import { RUNTIME_CODE as runtime$RUNTIME_CODE, RUNTIME_EXPORT_NAMES as runtime$RUNTIME_EXPORT_NAMES, runtime_esm_code as runtime$runtime_esm_code } from "./runtime.js";
import { safe_ident as codegen_ctx$safe_ident, new_codegen_ctx as codegen_ctx$new_codegen_ctx, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, push_indent as codegen_ctx$push_indent, pop_indent as codegen_ctx$pop_indent, qualify as codegen_ctx$qualify, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";
import { emit_decl as codegen_decl$emit_decl, emit_fn_decl as codegen_decl$emit_fn_decl, emit_toplevel_evidence as codegen_decl$emit_toplevel_evidence } from "./codegen_decl.js";
import { gen_expr as codegen_expr$gen_expr } from "./codegen_expr.js";
import { get_derived_method_names as codegen_derive$get_derived_method_names, emit_derived_impl as codegen_derive$emit_derived_impl } from "./codegen_derive.js";

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

function generate(program, skip_preamble, skip_main_call, module_prefix, imports_map, external_struct_fields, external_impl_methods, module_imports, module_exports) {
  let ctx = codegen_ctx$new_codegen_ctx(skip_preamble, skip_main_call);
  ctx.module_prefix = module_prefix;
  ctx.imports_map = imports_map;
  ctx.module_imports = module_imports;
  ctx.module_exports = module_exports;
  __ring_match0: {
    const __ring_m0 = external_struct_fields;
    if (__ring_m0._tag === "some") {
      const esf = __ring_m0._0;
      for (const entry of _Map_entries(esf)) {
        const __ring_dt0 = entry;
        const k = __ring_dt0[0];
        const v = __ring_dt0[1];
        _Map_insert(ctx.struct_field_order, k, v);
      }
      break __ring_match0;
    }
    if (__ring_m0._tag === "none") {
      break __ring_match0;
    }
    __match_fail(__ring_m0);
  }
  __ring_match1: {
    const __ring_m1 = external_impl_methods;
    if (__ring_m1._tag === "some") {
      const eim = __ring_m1._0;
      for (const entry of _Map_entries(eim)) {
        const __ring_dt1 = entry;
        const k = __ring_dt1[0];
        const v = __ring_dt1[1];
        _Map_insert(ctx.impl_methods, k, v);
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "none") {
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
  const has_imports = (function() {
  const __ring_m = ctx.module_imports;
  if (__ring_m._tag === "some") { const imports = __ring_m._0; return (List_len(imports) > 0); }
  if (__ring_m._tag === "none") { return false; }
  __match_fail(__ring_m);
})();
  if (has_imports) {
    __ring_match2: {
      const __ring_m2 = ctx.module_imports;
      if (__ring_m2._tag === "some") {
        const imports = __ring_m2._0;
        for (const imp of imports) {
          codegen_ctx$emit_raw(ctx, imp);
        }
        break __ring_match2;
      }
      if (__ring_m2._tag === "none") {
        break __ring_match2;
      }
      __match_fail(__ring_m2);
    }
    const empty = "";
    codegen_ctx$emit_raw(ctx, empty);
  }
  for (const decl of program.decls) {
    __ring_match3: {
      const __ring_m3 = decl;
      if (__ring_m3._tag === "Fn") {
        const name = __ring_m3.name; const effects = __ring_m3.effects;
        _Set_insert(ctx.local_names, name);
        if ((List_len(effects.effects) > 0)) {
          _Map_insert(ctx.local_fn_effects, name, effects);
        }
        break __ring_match3;
      }
      if (__ring_m3._tag === "Struct") {
        const name = __ring_m3.name;
        _Set_insert(ctx.local_names, name);
        break __ring_match3;
      }
      if (__ring_m3._tag === "Enum") {
        const name = __ring_m3.name; const variants = __ring_m3.variants;
        _Set_insert(ctx.local_names, name);
        for (const v of variants) {
          _Set_insert(ctx.local_names, v.name);
          _Set_insert(ctx.local_names, `${name}_${v.name}`);
        }
        break __ring_match3;
      }
      if (__ring_m3._tag === "Impl") {
        const target_type = __ring_m3.target_type;
        _Set_insert(ctx.local_names, target_type);
        break __ring_match3;
      }
      if (__ring_m3._tag === "Trait") {
        const name = __ring_m3.name;
        _Set_insert(ctx.local_names, name);
        break __ring_match3;
      }
      if (__ring_m3._tag === "Effect") {
        const name = __ring_m3.name;
        _Set_insert(ctx.local_names, name);
        break __ring_match3;
      }
      if (__ring_m3._tag === "Const") {
        const name = __ring_m3.name;
        _Set_insert(ctx.local_names, name);
        break __ring_match3;
      }
      if (__ring_m3._tag === "ModBlock") {
        const mname = __ring_m3.name; const mod_decls = __ring_m3.decls;
        _Set_insert(ctx.local_names, mname);
        for (const subdecl of mod_decls) {
          __ring_match4: {
            const __ring_m4 = subdecl;
            if (__ring_m4._tag === "Fn") {
              const fname = __ring_m4.name; const effects = __ring_m4.effects;
              _Set_insert(ctx.local_names, fname);
              if ((List_len(effects.effects) > 0)) {
                _Map_insert(ctx.local_fn_effects, fname, effects);
              }
              break __ring_match4;
            }
            if (__ring_m4._tag === "Struct") {
              const sname = __ring_m4.name;
              _Set_insert(ctx.local_names, sname);
              break __ring_match4;
            }
            if (__ring_m4._tag === "Enum") {
              const ename = __ring_m4.name; const variants = __ring_m4.variants;
              _Set_insert(ctx.local_names, ename);
              for (const v of variants) {
                _Set_insert(ctx.local_names, v.name);
                _Set_insert(ctx.local_names, `${ename}_${v.name}`);
              }
              break __ring_match4;
            }
            if (__ring_m4._tag === "Const") {
              const cname = __ring_m4.name;
              _Set_insert(ctx.local_names, cname);
              break __ring_match4;
            }
            break __ring_match4;
          }
        }
        break __ring_match3;
      }
      break __ring_match3;
    }
  }
  if ((_Map_len(ctx.local_fn_effects) > 0)) {
    let fn_callees = map_new();
    for (const decl of program.decls) {
      __ring_match5: {
        const __ring_m5 = decl;
        if (__ring_m5._tag === "Fn") {
          const name = __ring_m5.name; const body = __ring_m5.body;
          let callees = set_new();
          collect_local_calls(body, ctx.local_names, callees);
          _Map_insert(fn_callees, name, callees);
          break __ring_match5;
        }
        if (__ring_m5._tag === "ModBlock") {
          const mod_decls = __ring_m5.decls;
          for (const subdecl of mod_decls) {
            __ring_match6: {
              const __ring_m6 = subdecl;
              if (__ring_m6._tag === "Fn") {
                const fname = __ring_m6.name; const body = __ring_m6.body;
                let callees = set_new();
                collect_local_calls(body, ctx.local_names, callees);
                _Map_insert(fn_callees, fname, callees);
                break __ring_match6;
              }
              break __ring_match6;
            }
          }
          break __ring_match5;
        }
        break __ring_match5;
      }
    }
    let changed = true;
    while (changed) {
      changed = false;
      for (const entry of _Map_entries(fn_callees)) {
        const __ring_dt2 = entry;
        const name = __ring_dt2[0];
        const callees = __ring_dt2[1];
        for (const callee of _Set_to_list(callees)) {
          __ring_match7: {
            const __ring_m7 = _Map_get(ctx.local_fn_effects, callee);
            if (__ring_m7._tag === "some") {
              const callee_effects = __ring_m7._0;
              __ring_match8: {
                const __ring_m8 = _Map_get(ctx.local_fn_effects, name);
                if (__ring_m8._tag === "none") {
                  let effs = [types$Effect_IoEffect];
                  List_clear(effs);
                  for (const e of callee_effects.effects) {
                    List_push(effs, e);
                  }
                  _Map_insert(ctx.local_fn_effects, name, new types$EffectRow(effs, Option_none));
                  changed = true;
                  break __ring_match8;
                }
                if (__ring_m8._tag === "some") {
                  const current = __ring_m8._0;
                  for (const e of callee_effects.effects) {
                    const ename = effect_name_str(e);
                    let found = false;
                    for (const ce of current.effects) {
                      if ((effect_name_str(ce) === ename)) {
                        found = true;
                      }
                    }
                    if ((found === false)) {
                      List_push(current.effects, e);
                      changed = true;
                    }
                  }
                  break __ring_match8;
                }
                __match_fail(__ring_m8);
              }
              break __ring_match7;
            }
            if (__ring_m7._tag === "none") {
              break __ring_match7;
            }
            __match_fail(__ring_m7);
          }
        }
      }
    }
  }
  for (const decl of program.decls) {
    __ring_match9: {
      const __ring_m9 = decl;
      if (__ring_m9._tag === "Struct") {
        const name = __ring_m9.name; const fields = __ring_m9.fields;
        const qname = codegen_ctx$qualify(ctx, name);
        let field_names = [""];
        List_clear(field_names);
        for (const f of fields) {
          List_push(field_names, f.name);
        }
        _Map_insert(ctx.struct_field_order, qname, field_names);
        break __ring_match9;
      }
      if (__ring_m9._tag === "Impl") {
        const target_type = __ring_m9.target_type; const trait_name = __ring_m9.trait_name; const methods = __ring_m9.methods;
        for (const method of methods) {
          __ring_match10: {
            const __ring_m10 = method;
            if (__ring_m10._tag === "Fn") {
              const name = __ring_m10.name;
              const key = `${codegen_ctx$qualify(ctx, target_type)}.${name}`;
              __ring_match11: {
                const __ring_m11 = trait_name;
                if (__ring_m11._tag === "none") {
                  __ring_match12: {
                    const __ring_m12 = _Map_get(ctx.impl_methods, key);
                    if (__ring_m12._tag === "none") {
                      _Map_insert(ctx.impl_methods, key, Option_none);
                      break __ring_match12;
                    }
                    if (__ring_m12._tag === "some") {
                      break __ring_match12;
                    }
                    __match_fail(__ring_m12);
                  }
                  break __ring_match11;
                }
                if (__ring_m11._tag === "some") {
                  const tn = __ring_m11._0;
                  __ring_match13: {
                    const __ring_m13 = _Map_get(ctx.impl_methods, key);
                    if (__ring_m13._tag === "none") {
                      _Map_insert(ctx.impl_methods, key, Option_some(tn));
                      break __ring_match13;
                    }
                    if (__ring_m13._tag === "some") {
                      break __ring_match13;
                    }
                    __match_fail(__ring_m13);
                  }
                  break __ring_match11;
                }
                __match_fail(__ring_m11);
              }
              break __ring_match10;
            }
            break __ring_match10;
          }
        }
        break __ring_match9;
      }
      if (__ring_m9._tag === "Trait") {
        const name = __ring_m9.name; const methods = __ring_m9.methods;
        _Map_insert(ctx.trait_decls, name, new codegen_ctx$HTraitDeclInfo(name, methods));
        break __ring_match9;
      }
      if (__ring_m9._tag === "ModBlock") {
        const mod_decls = __ring_m9.decls;
        for (const subdecl of mod_decls) {
          __ring_match14: {
            const __ring_m14 = subdecl;
            if (__ring_m14._tag === "Struct") {
              const sname = __ring_m14.name; const fields = __ring_m14.fields;
              const qname = codegen_ctx$qualify(ctx, sname);
              let field_names = [""];
              List_clear(field_names);
              for (const f of fields) {
                List_push(field_names, f.name);
              }
              _Map_insert(ctx.struct_field_order, qname, field_names);
              break __ring_match14;
            }
            break __ring_match14;
          }
        }
        break __ring_match9;
      }
      break __ring_match9;
    }
  }
  register_builtin_methods(ctx, hir$BUILTIN_CELL, builtin_methods$CELL_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_STR, builtin_methods$STR_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_LIST, builtin_methods$LIST_NON_HOF_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_MAP, builtin_methods$MAP_NON_HOF_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_SET, builtin_methods$SET_NON_HOF_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_INT, builtin_methods$INT_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_FLOAT, builtin_methods$FLOAT_METHODS);
  register_builtin_methods(ctx, hir$BUILTIN_OPTION, builtin_methods$OPTION_NON_HOF_METHODS);
  for (const prim of [hir$BUILTIN_INT, hir$BUILTIN_FLOAT, hir$BUILTIN_STR, hir$BUILTIN_BOOL]) {
    const key = `${codegen_ctx$safe_ident(prim)}.debug`;
    _Map_insert(ctx.impl_methods, key, Option_some("Debug"));
  }
  for (const coll of [hir$BUILTIN_LIST, hir$BUILTIN_MAP, hir$BUILTIN_SET, hir$BUILTIN_OPTION]) {
    const key = `${codegen_ctx$safe_ident(coll)}.debug`;
    _Map_insert(ctx.impl_methods, key, Option_some("Debug"));
  }
  if ((ctx.skip_preamble === false)) {
    codegen_ctx$emit_raw(ctx, runtime$RUNTIME_CODE());
    codegen_ctx$emit_raw(ctx, "");
  }
  for (const impl_ of program.derived_impls) {
    for (const method_name of codegen_derive$get_derived_method_names(impl_.trait_name)) {
      const key = `${codegen_ctx$qualify(ctx, impl_.type_name)}.${method_name}`;
      __ring_match15: {
        const __ring_m15 = _Map_get(ctx.impl_methods, key);
        if (__ring_m15._tag === "none") {
          _Map_insert(ctx.impl_methods, key, Option_some(impl_.trait_name));
          break __ring_match15;
        }
        if (__ring_m15._tag === "some") {
          break __ring_match15;
        }
        __match_fail(__ring_m15);
      }
    }
  }
  for (const decl of program.decls) {
    codegen_decl$emit_decl(ctx, decl);
    codegen_ctx$emit_raw(ctx, "");
  }
  for (const impl_ of program.derived_impls) {
    codegen_derive$emit_derived_impl(ctx, impl_);
    codegen_ctx$emit_raw(ctx, "");
  }
  if ((ctx.skip_main_call === false)) {
    for (const decl of program.decls) {
      __ring_match16: {
        const __ring_m16 = decl;
        if (__ring_m16._tag === "Fn") {
          const name = __ring_m16.name; const effects = __ring_m16.effects;
          if ((name === "main")) {
            const fn_name = codegen_ctx$qualify(ctx, "main");
            const ev_params = codegen_ctx$get_evidence_params(effects);
            if ((List_len(ev_params) > 0)) {
              codegen_decl$emit_toplevel_evidence(ctx, effects);
              const ev_str = List_join(ev_params, ", ");
              codegen_ctx$emit(ctx, `${fn_name}(${ev_str});`);
            } else {
              codegen_ctx$emit(ctx, `${fn_name}();`);
            }
          }
          break __ring_match16;
        }
        break __ring_match16;
      }
    }
  }
  __ring_match17: {
    const __ring_m17 = ctx.module_exports;
    if (__ring_m17._tag === "some") {
      const exports = __ring_m17._0;
      if ((List_len(exports) > 0)) {
        codegen_ctx$emit_raw(ctx, "");
        const joined = List_join(exports, ", ");
        codegen_ctx$emit_raw(ctx, `export { ${joined} };`);
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "none") {
      break __ring_match17;
    }
    __match_fail(__ring_m17);
  }
  return List_join(ctx.lines, "\n");
}

function register_builtin_methods(ctx, type_name, methods) {
  const sn = codegen_ctx$safe_ident(type_name);
  for (const m of methods) {
    const key = `${sn}.${m}`;
    _Map_insert(ctx.impl_methods, key, Option_none);
  }
}

function effect_name_str(e) {
  __ring_match18: {
    const __ring_m18 = e;
    if (__ring_m18._tag === "IoEffect") {
      return "io";
      break __ring_match18;
    }
    if (__ring_m18._tag === "FailEffect") {
      return "fail";
      break __ring_match18;
    }
    if (__ring_m18._tag === "MutEffect") {
      return "mut";
      break __ring_match18;
    }
    if (__ring_m18._tag === "CustomEffect") {
      const name = __ring_m18.name;
      return name;
      break __ring_match18;
    }
    __match_fail(__ring_m18);
  }
}

function collect_local_calls(expr, local_names, out) {
  __ring_match19: {
    const __ring_m19 = expr;
    if (__ring_m19._tag === "Call") {
      const callee = __ring_m19.callee; const args = __ring_m19.args;
      __ring_match20: {
        const __ring_m20 = callee;
        if (__ring_m20._tag === "Ident") {
          const name = __ring_m20.name;
          if (_Set_contains(local_names, name)) {
            _Set_insert(out, name);
          }
          break __ring_match20;
        }
        break __ring_match20;
      }
      collect_local_calls(callee, local_names, out);
      for (const a of args) {
        collect_local_calls(a, local_names, out);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "Block") {
      const stmts = __ring_m19.stmts; const tail = __ring_m19.tail;
      for (const s of stmts) {
        collect_local_calls_stmt(s, local_names, out);
      }
      __ring_match21: {
        const __ring_m21 = tail;
        if (__ring_m21._tag === "some") {
          const t = __ring_m21._0;
          return collect_local_calls(t, local_names, out);
          break __ring_match21;
        }
        if (__ring_m21._tag === "none") {
          break __ring_match21;
        }
        __match_fail(__ring_m21);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "IfExpr") {
      const condition = __ring_m19.condition; const then_branch = __ring_m19.then_branch; const else_branch = __ring_m19.else_branch;
      collect_local_calls(condition, local_names, out);
      collect_local_calls(then_branch, local_names, out);
      __ring_match22: {
        const __ring_m22 = else_branch;
        if (__ring_m22._tag === "some") {
          const eb = __ring_m22._0;
          return collect_local_calls(eb, local_names, out);
          break __ring_match22;
        }
        if (__ring_m22._tag === "none") {
          break __ring_match22;
        }
        __match_fail(__ring_m22);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "MatchExpr") {
      const scrutinee = __ring_m19.scrutinee; const arms = __ring_m19.arms;
      collect_local_calls(scrutinee, local_names, out);
      for (const arm of arms) {
        collect_local_calls(arm.body, local_names, out);
        __ring_match23: {
          const __ring_m23 = arm.guard;
          if (__ring_m23._tag === "some") {
            const g = __ring_m23._0;
            collect_local_calls(g, local_names, out);
            break __ring_match23;
          }
          if (__ring_m23._tag === "none") {
            break __ring_match23;
          }
          __match_fail(__ring_m23);
        }
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "BinOp") {
      const left = __ring_m19.left; const right = __ring_m19.right;
      collect_local_calls(left, local_names, out);
      return collect_local_calls(right, local_names, out);
      break __ring_match19;
    }
    if (__ring_m19._tag === "UnaryOp") {
      const operand = __ring_m19.operand;
      return collect_local_calls(operand, local_names, out);
      break __ring_match19;
    }
    if (__ring_m19._tag === "FieldAccess") {
      const receiver = __ring_m19.receiver;
      return collect_local_calls(receiver, local_names, out);
      break __ring_match19;
    }
    if (__ring_m19._tag === "StructLit") {
      const fields = __ring_m19.fields; const spread = __ring_m19.spread;
      for (const f of fields) {
        collect_local_calls(f.value, local_names, out);
      }
      __ring_match24: {
        const __ring_m24 = spread;
        if (__ring_m24._tag === "some") {
          const s = __ring_m24._0;
          return collect_local_calls(s, local_names, out);
          break __ring_match24;
        }
        if (__ring_m24._tag === "none") {
          break __ring_match24;
        }
        __match_fail(__ring_m24);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "NamedVariantConstruct") {
      const fields = __ring_m19.fields; const spread = __ring_m19.spread;
      for (const f of fields) {
        collect_local_calls(f.value, local_names, out);
      }
      __ring_match25: {
        const __ring_m25 = spread;
        if (__ring_m25._tag === "some") {
          const s = __ring_m25._0;
          return collect_local_calls(s, local_names, out);
          break __ring_match25;
        }
        if (__ring_m25._tag === "none") {
          break __ring_match25;
        }
        __match_fail(__ring_m25);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "StringInterp") {
      const parts = __ring_m19.parts;
      for (const p of parts) {
        __ring_match26: {
          const __ring_m26 = p;
          if (__ring_m26._tag === "Expression") {
            const e = __ring_m26._0;
            collect_local_calls(e, local_names, out);
            break __ring_match26;
          }
          if (__ring_m26._tag === "Literal") {
            break __ring_match26;
          }
          __match_fail(__ring_m26);
        }
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "TryCatch") {
      const body = __ring_m19.body; const arms = __ring_m19.arms;
      collect_local_calls(body, local_names, out);
      for (const arm of arms) {
        collect_local_calls(arm.body, local_names, out);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "HandleExpr") {
      const body = __ring_m19.body; const handlers = __ring_m19.handlers;
      collect_local_calls(body, local_names, out);
      for (const h of handlers) {
        collect_local_calls(h.body, local_names, out);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "Lambda") {
      const body = __ring_m19.body;
      return collect_local_calls(body, local_names, out);
      break __ring_match19;
    }
    if (__ring_m19._tag === "RangeExpr") {
      const start = __ring_m19.start; const end = __ring_m19.end;
      collect_local_calls(start, local_names, out);
      return collect_local_calls(end, local_names, out);
      break __ring_match19;
    }
    if (__ring_m19._tag === "ListLit") {
      const elements = __ring_m19.elements;
      for (const e of elements) {
        collect_local_calls(e, local_names, out);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "TupleLit") {
      const elements = __ring_m19.elements;
      for (const e of elements) {
        collect_local_calls(e, local_names, out);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "EffectOp") {
      const args = __ring_m19.args;
      for (const a of args) {
        collect_local_calls(a, local_names, out);
      }
      break __ring_match19;
    }
    break __ring_match19;
  }
}

function collect_local_calls_stmt(stmt, local_names, out) {
  __ring_match27: {
    const __ring_m27 = stmt;
    if (__ring_m27._tag === "Let") {
      const init = __ring_m27.init;
      return collect_local_calls(init, local_names, out);
      break __ring_match27;
    }
    if (__ring_m27._tag === "Var") {
      const init = __ring_m27.init;
      return collect_local_calls(init, local_names, out);
      break __ring_match27;
    }
    if (__ring_m27._tag === "Assign") {
      const target = __ring_m27.target; const value = __ring_m27.value;
      collect_local_calls(target, local_names, out);
      return collect_local_calls(value, local_names, out);
      break __ring_match27;
    }
    if (__ring_m27._tag === "ExprStmt") {
      const expr = __ring_m27.expr;
      return collect_local_calls(expr, local_names, out);
      break __ring_match27;
    }
    if (__ring_m27._tag === "Return") {
      const value = __ring_m27.value;
      __ring_match28: {
        const __ring_m28 = value;
        if (__ring_m28._tag === "some") {
          const v = __ring_m28._0;
          return collect_local_calls(v, local_names, out);
          break __ring_match28;
        }
        if (__ring_m28._tag === "none") {
          break __ring_match28;
        }
        __match_fail(__ring_m28);
      }
      break __ring_match27;
    }
    if (__ring_m27._tag === "While") {
      const condition = __ring_m27.condition; const body = __ring_m27.body;
      collect_local_calls(condition, local_names, out);
      return collect_local_calls(body, local_names, out);
      break __ring_match27;
    }
    if (__ring_m27._tag === "ForIn") {
      const iterable = __ring_m27.iterable; const body = __ring_m27.body;
      collect_local_calls(iterable, local_names, out);
      return collect_local_calls(body, local_names, out);
      break __ring_match27;
    }
    if (__ring_m27._tag === "LetDestructure") {
      const init = __ring_m27.init;
      return collect_local_calls(init, local_names, out);
      break __ring_match27;
    }
    if (__ring_m27._tag === "IfLet") {
      const expr = __ring_m27.expr; const then_block = __ring_m27.then_block; const else_block = __ring_m27.else_block;
      collect_local_calls(expr, local_names, out);
      collect_local_calls(then_block, local_names, out);
      __ring_match29: {
        const __ring_m29 = else_block;
        if (__ring_m29._tag === "some") {
          const eb = __ring_m29._0;
          return collect_local_calls(eb, local_names, out);
          break __ring_match29;
        }
        if (__ring_m29._tag === "none") {
          break __ring_match29;
        }
        __match_fail(__ring_m29);
      }
      break __ring_match27;
    }
    break __ring_match27;
  }
}


export { generate };