import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_tuple_eq, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { safe_ident as codegen_ctx$safe_ident, new_codegen_ctx as codegen_ctx$new_codegen_ctx, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, push_indent as codegen_ctx$push_indent, pop_indent as codegen_ctx$pop_indent, qualify as codegen_ctx$qualify, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";
import { emit_in_stmt_context as codegen_stmt$emit_in_stmt_context, emit_block_in_stmt_context as codegen_stmt$emit_block_in_stmt_context, emit_block_body as codegen_stmt$emit_block_body, emit_stmt as codegen_stmt$emit_stmt, gen_stmt_inline as codegen_stmt$gen_stmt_inline, gen_pattern_condition as codegen_stmt$gen_pattern_condition, gen_pattern_bindings as codegen_stmt$gen_pattern_bindings } from "./codegen_stmt.js";

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

function gen_expr(ctx, expr) {
  __ring_match1: {
    const __ring_m1 = expr;
    if (__ring_m1._tag === "IntLit") {
      const value = __ring_m1.value;
      return Int_to_str(value);
      break __ring_match1;
    }
    if (__ring_m1._tag === "FloatLit") {
      const value = __ring_m1.value;
      return Float_to_str(value);
      break __ring_match1;
    }
    if (__ring_m1._tag === "StrLit") {
      const value = __ring_m1.value;
      return json_stringify(value);
      break __ring_match1;
    }
    if (__ring_m1._tag === "BoolLit") {
      const value = __ring_m1.value;
      if (value) {
        return "true";
      } else {
        return "false";
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "Ident") {
      const name = __ring_m1.name; const resolved_name = __ring_m1.resolved_name; const ty = __ring_m1.ty; const dict_closure_dicts = __ring_m1.dict_closure_dicts;
      const qname = (function() {
  const __ring_m = resolved_name;
  if (__ring_m._tag === "some") { const rn = __ring_m._0; return codegen_ctx$qualify(ctx, rn); }
  if (__ring_m._tag === "none") { return codegen_ctx$qualify(ctx, name); }
  __match_fail(__ring_m);
})();
      __ring_match2: {
        const __ring_m2 = dict_closure_dicts;
        if (__ring_m2._tag === "some") {
          const dicts = __ring_m2._0;
          if ((List_len(dicts) > 0)) {
            __ring_match3: {
              const __ring_m3 = ty;
              if (__ring_m3._tag === "FnType") {
                const params = __ring_m3.params; const effects = __ring_m3.effects;
                let p_names = [""];
                List_clear(p_names);
                const __ring_end0 = List_len(params);
                for (let i = 0; i < __ring_end0; i++) {
                  List_push(p_names, `__ring_a${i}`);
                }
                const dict_args = List_join(dicts, ", ");
                const ev_args = get_callee_evidence_args(ctx, ty, Option_none);
                let all_call = [""];
                List_clear(all_call);
                List_extend(all_call, p_names);
                List_push(all_call, dict_args);
                if ((Str_len(ev_args) > 0)) {
                  List_push(all_call, ev_args);
                }
                const call_str = List_join(all_call, ", ");
                const params_str = List_join(p_names, ", ");
                return `((${params_str}) => ${qname}(${call_str}))`;
                break __ring_match3;
              }
              return qname;
              break __ring_match3;
            }
          } else {
            return qname;
          }
          break __ring_match2;
        }
        if (__ring_m2._tag === "none") {
          return qname;
          break __ring_match2;
        }
        __match_fail(__ring_m2);
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "BinOp") {
      const op = __ring_m1.op; const left = __ring_m1.left; const right = __ring_m1.right; const eq_dispatch = __ring_m1.eq_dispatch; const ord_dispatch = __ring_m1.ord_dispatch; const ty = __ring_m1.ty;
      return gen_binop(ctx, op, left, right, eq_dispatch, ord_dispatch);
      break __ring_match1;
    }
    if (__ring_m1._tag === "UnaryOp") {
      const op = __ring_m1.op; const operand = __ring_m1.operand;
      const o = gen_expr(ctx, operand);
      const op_str = (function() {
  const __ring_m = op;
  if (__ring_m._tag === "Neg") { return "-"; }
  if (__ring_m._tag === "Not") { return "!"; }
  __match_fail(__ring_m);
})();
      return `(${op_str}${o})`;
      break __ring_match1;
    }
    if (__ring_m1._tag === "Call") {
      const callee = __ring_m1.callee; const args = __ring_m1.args; const type_args = __ring_m1.type_args; const resolved_dicts = __ring_m1.resolved_dicts; const dict_dispatch = __ring_m1.dict_dispatch;
      return gen_call(ctx, callee, args, resolved_dicts, dict_dispatch);
      break __ring_match1;
    }
    if (__ring_m1._tag === "FieldAccess") {
      const receiver = __ring_m1.receiver; const field = __ring_m1.field;
      const r = gen_expr(ctx, receiver);
      if (is_tuple_field(field)) {
        return `${r}[${field}]`;
      } else {
        return `${r}.${field}`;
      }
      break __ring_match1;
    }
    if (__ring_m1._tag === "StructLit") {
      const name = __ring_m1.name; const fields = __ring_m1.fields; const spread = __ring_m1.spread;
      return gen_struct_lit(ctx, name, fields, spread);
      break __ring_match1;
    }
    if (__ring_m1._tag === "NamedVariantConstruct") {
      const enum_name = __ring_m1.enum_name; const variant_name = __ring_m1.variant_name; const fields = __ring_m1.fields; const spread = __ring_m1.spread; const ty = __ring_m1.ty;
      return gen_named_variant_construct(ctx, enum_name, variant_name, fields, spread, ty);
      break __ring_match1;
    }
    if (__ring_m1._tag === "MatchExpr") {
      const scrutinee = __ring_m1.scrutinee; const arms = __ring_m1.arms;
      return gen_match(ctx, scrutinee, arms);
      break __ring_match1;
    }
    if (__ring_m1._tag === "Block") {
      const stmts = __ring_m1.stmts; const tail = __ring_m1.tail;
      return gen_block_expr(ctx, stmts, tail, expr);
      break __ring_match1;
    }
    if (__ring_m1._tag === "IfExpr") {
      const condition = __ring_m1.condition; const then_branch = __ring_m1.then_branch; const else_branch = __ring_m1.else_branch;
      return gen_if(ctx, condition, then_branch, else_branch);
      break __ring_match1;
    }
    if (__ring_m1._tag === "StringInterp") {
      const parts = __ring_m1.parts;
      return gen_string_interp(ctx, parts);
      break __ring_match1;
    }
    if (__ring_m1._tag === "TryCatch") {
      const body = __ring_m1.body; const arms = __ring_m1.arms;
      return gen_try_catch(ctx, body, arms);
      break __ring_match1;
    }
    if (__ring_m1._tag === "HandleExpr") {
      const body = __ring_m1.body; const handlers = __ring_m1.handlers;
      return gen_handle(ctx, body, handlers);
      break __ring_match1;
    }
    if (__ring_m1._tag === "Lambda") {
      const params = __ring_m1.params; const body = __ring_m1.body; const ty = __ring_m1.ty;
      return gen_lambda(ctx, params, body, ty);
      break __ring_match1;
    }
    if (__ring_m1._tag === "EffectOp") {
      const effect_name = __ring_m1.effect_name; const op_name = __ring_m1.op_name; const args = __ring_m1.args;
      const ev_name = hir$evidence_param_name(effect_name);
      let arg_strs = [""];
      List_clear(arg_strs);
      for (const a of args) {
        List_push(arg_strs, gen_expr(ctx, a));
      }
      const joined = List_join(arg_strs, ", ");
      return `${ev_name}.${op_name}(${joined})`;
      break __ring_match1;
    }
    if (__ring_m1._tag === "RangeExpr") {
      const start = __ring_m1.start; const end = __ring_m1.end;
      const s = gen_expr(ctx, start);
      const e = gen_expr(ctx, end);
      return `{ start: ${s}, end: ${e} }`;
      break __ring_match1;
    }
    if (__ring_m1._tag === "ListLit") {
      const elements = __ring_m1.elements;
      let elems = [""];
      List_clear(elems);
      for (const e of elements) {
        List_push(elems, gen_expr(ctx, e));
      }
      const joined = List_join(elems, ", ");
      return `[${joined}]`;
      break __ring_match1;
    }
    if (__ring_m1._tag === "TupleLit") {
      const elements = __ring_m1.elements;
      let elems = [""];
      List_clear(elems);
      for (const e of elements) {
        List_push(elems, gen_expr(ctx, e));
      }
      const joined = List_join(elems, ", ");
      return `[${joined}]`;
      break __ring_match1;
    }
    if (__ring_m1._tag === "IndexExpr") {
      const receiver = __ring_m1.receiver; const index = __ring_m1.index;
      const r = gen_expr(ctx, receiver);
      const i = gen_expr(ctx, index);
      const recv_ty = hir$hexpr_type(receiver);
      __ring_match4: {
        const __ring_m4 = recv_ty;
        if (__ring_m4._tag === "StructType") {
          const name = __ring_m4.name;
          if ((name === hir$BUILTIN_MAP)) {
            return `__ring_map_index(${r}, ${i})`;
          } else {
            return `__ring_index(${r}, ${i})`;
          }
          break __ring_match4;
        }
        if (__ring_m4._tag === "StrType") {
          return `__ring_str_index(${r}, ${i})`;
          break __ring_match4;
        }
        return `__ring_index(${r}, ${i})`;
        break __ring_match4;
      }
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
}

function gen_binop(ctx, op, left, right, eq_dispatch, ord_dispatch) {
  __ring_match5: {
    const __ring_m5 = try_eq_dispatch(ctx, op, left, right, eq_dispatch);
    if (__ring_m5._tag === "some") {
      const result = __ring_m5._0;
      return result;
      break __ring_match5;
    }
    if (__ring_m5._tag === "none") {
      break __ring_match5;
    }
    __match_fail(__ring_m5);
  }
  __ring_match6: {
    const __ring_m6 = try_ord_dispatch(ctx, op, left, right, ord_dispatch);
    if (__ring_m6._tag === "some") {
      const result = __ring_m6._0;
      return result;
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
  const l = gen_expr(ctx, left);
  const r = gen_expr(ctx, right);
  if (ast$__BinOp_Eq.eq(op, ast$BinOp_Div)) {
    __ring_match7: {
      const __ring_m7 = hir$hexpr_type(left);
      if (__ring_m7._tag === "IntType") {
        return `Math.trunc(${l} / ${r})`;
        break __ring_match7;
      }
      break __ring_match7;
    }
  }
  const js_op = (function() {
  const __ring_m = op;
  if (__ring_m._tag === "Eq") { return "==="; }
  if (__ring_m._tag === "Neq") { return "!=="; }
  return binop_str(op);
})();
  return `(${l} ${js_op} ${r})`;
}

function try_eq_dispatch(ctx, op, left, right, eq_dispatch) {
  __ring_match8: {
    const __ring_m8 = eq_dispatch;
    if (__ring_m8._tag === "some") {
      const dispatch = __ring_m8._0;
      const is_eq_op = (ast$__BinOp_Eq.eq(op, ast$BinOp_Eq) || ast$__BinOp_Eq.eq(op, ast$BinOp_Neq));
      if (is_eq_op) {
        return Option_some(gen_eq_dispatch(ctx, op, left, right, dispatch));
      }
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
  return Option_none;
}

function try_ord_dispatch(ctx, op, left, right, ord_dispatch) {
  __ring_match9: {
    const __ring_m9 = ord_dispatch;
    if (__ring_m9._tag === "some") {
      const dispatch = __ring_m9._0;
      const is_ord_op = (((ast$__BinOp_Eq.eq(op, ast$BinOp_Lt) || ast$__BinOp_Eq.eq(op, ast$BinOp_Gt)) || ast$__BinOp_Eq.eq(op, ast$BinOp_Lte)) || ast$__BinOp_Eq.eq(op, ast$BinOp_Gte));
      if (is_ord_op) {
        return Option_some(gen_ord_dispatch(ctx, op, left, right, dispatch));
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "none") {
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
  return Option_none;
}

function binop_str(op) {
  __ring_match10: {
    const __ring_m10 = op;
    if (__ring_m10._tag === "Add") {
      return "+";
      break __ring_match10;
    }
    if (__ring_m10._tag === "Sub") {
      return "-";
      break __ring_match10;
    }
    if (__ring_m10._tag === "Mul") {
      return "*";
      break __ring_match10;
    }
    if (__ring_m10._tag === "Div") {
      return "/";
      break __ring_match10;
    }
    if (__ring_m10._tag === "Mod") {
      return "%";
      break __ring_match10;
    }
    if (__ring_m10._tag === "Eq") {
      return "===";
      break __ring_match10;
    }
    if (__ring_m10._tag === "Neq") {
      return "!==";
      break __ring_match10;
    }
    if (__ring_m10._tag === "Lt") {
      return "<";
      break __ring_match10;
    }
    if (__ring_m10._tag === "Lte") {
      return "<=";
      break __ring_match10;
    }
    if (__ring_m10._tag === "Gt") {
      return ">";
      break __ring_match10;
    }
    if (__ring_m10._tag === "Gte") {
      return ">=";
      break __ring_match10;
    }
    if (__ring_m10._tag === "And") {
      return "&&";
      break __ring_match10;
    }
    if (__ring_m10._tag === "Or") {
      return "||";
      break __ring_match10;
    }
    __match_fail(__ring_m10);
  }
}

function is_tuple_field(s) {
  if ((Str_len(s) === 0)) {
    return false;
  }
  __ring_match11: {
    const __ring_m11 = Str_char_at(s, 0);
    if (__ring_m11._tag === "some") {
      const c = __ring_m11._0;
      return ((((((((((c === "0") || (c === "1")) || (c === "2")) || (c === "3")) || (c === "4")) || (c === "5")) || (c === "6")) || (c === "7")) || (c === "8")) || (c === "9"));
      break __ring_match11;
    }
    if (__ring_m11._tag === "none") {
      return false;
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
}

function gen_eq_dispatch(ctx, op, left, right, dispatch) {
  const l = gen_expr(ctx, left);
  const r = gen_expr(ctx, right);
  const is_ne = ast$__BinOp_Eq.eq(op, ast$BinOp_Neq);
  __ring_match12: {
    const __ring_m12 = dispatch;
    if (__ring_m12._tag === "Builtin") {
      __ring_match13: {
        const __ring_m13 = hir$hexpr_type(left);
        if (__ring_m13._tag === "TupleType") {
          const elements = __ring_m13.elements;
          if (is_ne) {
            return `(!__ring_tuple_eq(${l}, ${r}))`;
          } else {
            return `__ring_tuple_eq(${l}, ${r})`;
          }
          break __ring_match13;
        }
        if (is_ne) {
          return `(${l} !== ${r})`;
        } else {
          return `(${l} === ${r})`;
        }
        break __ring_match13;
      }
      break __ring_match12;
    }
    if (__ring_m12._tag === "Direct") {
      const dict = __ring_m12.dict; const extra_dicts = __ring_m12.extra_dicts;
      const d = codegen_ctx$qualify(ctx, dict);
      const extra = extra_dicts_str(extra_dicts);
      const eq_call = `${d}.eq(${l}, ${r}${extra})`;
      if (is_ne) {
        return `(!${eq_call})`;
      } else {
        return eq_call;
      }
      break __ring_match12;
    }
    if (__ring_m12._tag === "Dict") {
      const param = __ring_m12.param;
      const eq_call = `${param}.eq(${l}, ${r})`;
      if (is_ne) {
        return `(!${eq_call})`;
      } else {
        return eq_call;
      }
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
}

function gen_ord_dispatch(ctx, op, left, right, dispatch) {
  const l = gen_expr(ctx, left);
  const r = gen_expr(ctx, right);
  __ring_match14: {
    const __ring_m14 = dispatch;
    if (__ring_m14._tag === "Builtin") {
      const op_str = binop_str(op);
      return `(${l} ${op_str} ${r})`;
      break __ring_match14;
    }
    if (__ring_m14._tag === "Direct") {
      const dict = __ring_m14.dict; const extra_dicts = __ring_m14.extra_dicts;
      const d = codegen_ctx$qualify(ctx, dict);
      const extra = extra_dicts_str(extra_dicts);
      const cmp_call = `${d}.cmp(${l}, ${r}${extra})`;
      __ring_match15: {
        const __ring_m15 = op;
        if (__ring_m15._tag === "Lt") {
          return `(${cmp_call} < 0)`;
          break __ring_match15;
        }
        if (__ring_m15._tag === "Lte") {
          return `(${cmp_call} <= 0)`;
          break __ring_match15;
        }
        if (__ring_m15._tag === "Gt") {
          return `(${cmp_call} > 0)`;
          break __ring_match15;
        }
        if (__ring_m15._tag === "Gte") {
          return `(${cmp_call} >= 0)`;
          break __ring_match15;
        }
        return `(${l} ${binop_str(op)} ${r})`;
        break __ring_match15;
      }
      break __ring_match14;
    }
    if (__ring_m14._tag === "Dict") {
      const param = __ring_m14.param;
      const cmp_call = `${param}.cmp(${l}, ${r})`;
      __ring_match16: {
        const __ring_m16 = op;
        if (__ring_m16._tag === "Lt") {
          return `(${cmp_call} < 0)`;
          break __ring_match16;
        }
        if (__ring_m16._tag === "Lte") {
          return `(${cmp_call} <= 0)`;
          break __ring_match16;
        }
        if (__ring_m16._tag === "Gt") {
          return `(${cmp_call} > 0)`;
          break __ring_match16;
        }
        if (__ring_m16._tag === "Gte") {
          return `(${cmp_call} >= 0)`;
          break __ring_match16;
        }
        return `(${l} ${binop_str(op)} ${r})`;
        break __ring_match16;
      }
      break __ring_match14;
    }
    __match_fail(__ring_m14);
  }
}

function extra_dicts_str(dicts) {
  if ((List_len(dicts) > 0)) {
    const joined = List_join(dicts, ", ");
    return `, ${joined}`;
  } else {
    return "";
  }
}

function get_callee_evidence_args(ctx, callee_type, callee_name) {
  __ring_match17: {
    const __ring_m17 = callee_type;
    if (__ring_m17._tag === "FnType") {
      const effects = __ring_m17.effects;
      if ((List_len(effects.effects) > 0)) {
        return List_join(codegen_ctx$get_evidence_params(effects), ", ");
      }
      break __ring_match17;
    }
    break __ring_match17;
  }
  __ring_match18: {
    const __ring_m18 = callee_name;
    if (__ring_m18._tag === "some") {
      const cn = __ring_m18._0;
      __ring_match19: {
        const __ring_m19 = _Map_get(ctx.local_fn_effects, cn);
        if (__ring_m19._tag === "some") {
          const actual_effects = __ring_m19._0;
          if ((List_len(actual_effects.effects) > 0)) {
            let caller_effect_names = set_new();
            __ring_match20: {
              const __ring_m20 = ctx.current_fn_effects;
              if (__ring_m20._tag === "some") {
                const cfe = __ring_m20._0;
                for (const e of cfe.effects) {
                  _Set_insert(caller_effect_names, types$effect_kind_name(e));
                }
                break __ring_match20;
              }
              if (__ring_m20._tag === "none") {
                break __ring_match20;
              }
              __match_fail(__ring_m20);
            }
            if (ctx.in_try_fail) {
              _Set_insert(caller_effect_names, "fail");
            }
            let needed = [types$Effect_IoEffect];
            List_clear(needed);
            for (const e of actual_effects.effects) {
              if (_Set_contains(caller_effect_names, types$effect_kind_name(e), __Str_Eq)) {
                List_push(needed, e);
              }
            }
            if ((List_len(needed) > 0)) {
              return List_join(codegen_ctx$get_evidence_params(new types$EffectRow(needed, Option_none)), ", ");
            }
          }
          break __ring_match19;
        }
        if (__ring_m19._tag === "none") {
          break __ring_match19;
        }
        __match_fail(__ring_m19);
      }
      break __ring_match18;
    }
    if (__ring_m18._tag === "none") {
      break __ring_match18;
    }
    __match_fail(__ring_m18);
  }
  return "";
}

function gen_call(ctx, callee, args, resolved_dicts, dict_dispatch) {
  __ring_match21: {
    const __ring_m21 = dict_dispatch;
    if (__ring_m21._tag === "some") {
      const dd = __ring_m21._0;
      const receiver_arg = (function() {
  const __ring_m = callee;
  if (__ring_m._tag === "FieldAccess") { const receiver = __ring_m.receiver; return gen_expr(ctx, receiver); }
  return (function() {
  const __ring_m = List_get(args, 0);
  if (__ring_m._tag === "some") { const a = __ring_m._0; return gen_expr(ctx, a); }
  if (__ring_m._tag === "none") { return gen_expr(ctx, callee); }
  __match_fail(__ring_m);
})();
})();
      let other_args = [""];
      List_clear(other_args);
      for (const a of args) {
        List_push(other_args, gen_expr(ctx, a));
      }
      let all = [""];
      List_clear(all);
      List_push(all, receiver_arg);
      List_extend(all, other_args);
      const all_str = List_join(all, ", ");
      const meth = codegen_ctx$safe_ident(dd.method);
      return `${dd.dict_param}.${meth}(${all_str})`;
      break __ring_match21;
    }
    if (__ring_m21._tag === "none") {
      break __ring_match21;
    }
    __match_fail(__ring_m21);
  }
  __ring_match22: {
    const __ring_m22 = callee;
    if (__ring_m22._tag === "FieldAccess") {
      const receiver = __ring_m22.receiver; const field = __ring_m22.field; const callee_type = __ring_m22.ty;
      const recv_type = hir$hexpr_type(receiver);
      const method = field;
      __ring_match23: {
        const __ring_m23 = recv_type;
        if (__ring_m23._tag === "StructType") {
          const name = __ring_m23.name;
          if ((name === hir$BUILTIN_LIST)) {
            __ring_match24: {
              const __ring_m24 = codegen_ctx$LIST_HOF_JS_METHOD(method);
              if (__ring_m24._tag === "some") {
                const js_method = __ring_m24._0;
                const r = gen_expr(ctx, receiver);
                const cb = gen_lambda_capture_evidence(ctx, args, 0);
                return `${r}.${js_method}(${cb})`;
                break __ring_match24;
              }
              if (__ring_m24._tag === "none") {
                break __ring_match24;
              }
              __match_fail(__ring_m24);
            }
            if ((method === "fold")) {
              const r = gen_expr(ctx, receiver);
              const init = (function() {
  const __ring_m = List_get(args, 0);
  if (__ring_m._tag === "some") { const a = __ring_m._0; return gen_expr(ctx, a); }
  if (__ring_m._tag === "none") { return "undefined"; }
  __match_fail(__ring_m);
})();
              const cb = gen_lambda_capture_evidence(ctx, args, 1);
              return `${r}.reduce(${cb}, ${init})`;
            }
            if ((method === "find")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return gen_find_expr(r, cb);
            }
            if ((method === "find_index")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return gen_find_index_expr(r, cb);
            }
            if ((method === "sort_by")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return `${r}.sort(${cb})`;
            }
          }
          if ((name === hir$BUILTIN_MAP)) {
            if ((method === "map_values")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return `((__m, __f) => { const __r = new Map(); for (const [__k, __v] of __m) __r.set(__k, __f(__v)); return __r; })(${r}, ${cb})`;
            }
            if ((method === "filter")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return `((__m, __f) => { const __r = new Map(); for (const [__k, __v] of __m) if (__f(__k, __v)) __r.set(__k, __v); return __r; })(${r}, ${cb})`;
            }
            if ((method === "fold")) {
              const r = gen_expr(ctx, receiver);
              const init = (function() {
  const __ring_m = List_get(args, 0);
  if (__ring_m._tag === "some") { const a = __ring_m._0; return gen_expr(ctx, a); }
  if (__ring_m._tag === "none") { return "undefined"; }
  __match_fail(__ring_m);
})();
              const cb = gen_lambda_capture_evidence(ctx, args, 1);
              return `((__m, __a, __f) => { for (const [__k, __v] of __m) __a = __f(__a, __k, __v); return __a; })(${r}, ${init}, ${cb})`;
            }
            if ((method === "any")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return `((__m, __f) => { for (const [__k, __v] of __m) if (__f(__k, __v)) return true; return false; })(${r}, ${cb})`;
            }
          }
          if ((name === hir$BUILTIN_SET)) {
            if ((method === "filter")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return `((__s, __f) => { const __r = new Set(); for (const __x of __s) if (__f(__x)) __r.add(__x); return __r; })(${r}, ${cb})`;
            }
            if ((method === "fold")) {
              const r = gen_expr(ctx, receiver);
              const init = (function() {
  const __ring_m = List_get(args, 0);
  if (__ring_m._tag === "some") { const a = __ring_m._0; return gen_expr(ctx, a); }
  if (__ring_m._tag === "none") { return "undefined"; }
  __match_fail(__ring_m);
})();
              const cb = gen_lambda_capture_evidence(ctx, args, 1);
              return `((__s, __a, __f) => { for (const __x of __s) __a = __f(__a, __x); return __a; })(${r}, ${init}, ${cb})`;
            }
            if ((method === "any")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return `((__s, __f) => { for (const __x of __s) if (__f(__x)) return true; return false; })(${r}, ${cb})`;
            }
            if ((method === "all")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return `((__s, __f) => { for (const __x of __s) if (!__f(__x)) return false; return true; })(${r}, ${cb})`;
            }
          }
          break __ring_match23;
        }
        if (__ring_m23._tag === "EnumType") {
          const name = __ring_m23.name;
          if ((name === hir$BUILTIN_OPTION)) {
            if ((method === "map")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return gen_option_map_expr(r, cb);
            }
            if ((method === "and_then")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return gen_option_and_then_expr(r, cb);
            }
            if ((method === "unwrap_or_else")) {
              const r = gen_expr(ctx, receiver);
              const cb = gen_lambda_capture_evidence(ctx, args, 0);
              return gen_option_unwrap_or_else_expr(r, cb);
            }
            if ((method === "to_fail")) {
              const r = gen_expr(ctx, receiver);
              const err_arg = (function() {
  const __ring_m = List_get(args, 0);
  if (__ring_m._tag === "some") { const a = __ring_m._0; return gen_expr(ctx, a); }
  if (__ring_m._tag === "none") { return "undefined"; }
  __match_fail(__ring_m);
})();
              const ev = hir$evidence_param_name("fail");
              const tag_f = hir$ENUM_TAG_FIELD;
              const some_t = hir$OPTION_SOME_TAG;
              const pay_f = hir$OPTION_PAYLOAD_FIELD;
              return `((v) => v.${tag_f} === "${some_t}" ? v.${pay_f} : ${ev}.raise(${err_arg}))(${r})`;
            }
          }
          break __ring_match23;
        }
        break __ring_match23;
      }
      const type_name = types$type_to_builtin_name(recv_type);
      __ring_match25: {
        const __ring_m25 = type_name;
        if (__ring_m25._tag === "some") {
          const tn = __ring_m25._0;
          const impl_key = `${codegen_ctx$qualify(ctx, tn)}.${method}`;
          __ring_match26: {
            const __ring_m26 = _Map_get(ctx.impl_methods, impl_key);
            if (__ring_m26._tag === "some") {
              const trait_opt = __ring_m26._0;
              const fn_name = (function() {
  const __ring_m = trait_opt;
  if (__ring_m._tag === "some") { const trait_name = __ring_m._0; return (function() {
  const dict = hir$trait_dict_name(codegen_ctx$qualify(ctx, tn), codegen_ctx$safe_ident(trait_name));
  return `${dict}_${codegen_ctx$safe_ident(method)}`;
})(); }
  if (__ring_m._tag === "none") { return `${codegen_ctx$qualify(ctx, tn)}_${codegen_ctx$safe_ident(method)}`; }
  __match_fail(__ring_m);
})();
              const r = gen_expr(ctx, receiver);
              let arg_strs = [""];
              List_clear(arg_strs);
              for (const a of args) {
                List_push(arg_strs, gen_expr(ctx, a));
              }
              const all_args = ((List_len(arg_strs) > 0) ? (function() {
  const joined = List_join(arg_strs, ", ");
  return `${r}, ${joined}`;
})() : r);
              let dict_parts = [""];
              List_clear(dict_parts);
              for (const d of resolved_dicts) {
                List_push(dict_parts, codegen_ctx$qualify(ctx, d));
              }
              const dict_str = List_join(dict_parts, ", ");
              const ev_args = get_callee_evidence_args(ctx, callee_type, Option_none);
              let parts = [""];
              List_clear(parts);
              List_push(parts, all_args);
              if ((Str_len(dict_str) > 0)) {
                List_push(parts, dict_str);
              }
              if ((Str_len(ev_args) > 0)) {
                List_push(parts, ev_args);
              }
              const final_args = List_join(parts, ", ");
              return `${fn_name}(${final_args})`;
              break __ring_match26;
            }
            if (__ring_m26._tag === "none") {
              break __ring_match26;
            }
            __match_fail(__ring_m26);
          }
          break __ring_match25;
        }
        if (__ring_m25._tag === "none") {
          break __ring_match25;
        }
        __match_fail(__ring_m25);
      }
      break __ring_match22;
    }
    break __ring_match22;
  }
  const callee_str = gen_expr(ctx, callee);
  const cn = (function() {
  const __ring_m = callee;
  if (__ring_m._tag === "Ident") { const name = __ring_m.name; return Option_some(name); }
  return Option_none;
})();
  let arg_strs = [""];
  List_clear(arg_strs);
  for (const a of args) {
    List_push(arg_strs, gen_expr(ctx, a));
  }
  const args_str = List_join(arg_strs, ", ");
  let dict_parts = [""];
  List_clear(dict_parts);
  for (const d of resolved_dicts) {
    List_push(dict_parts, codegen_ctx$qualify(ctx, d));
  }
  const dict_str = List_join(dict_parts, ", ");
  const ev_args = get_callee_evidence_args(ctx, hir$hexpr_type(callee), cn);
  let all_parts = [""];
  List_clear(all_parts);
  if ((Str_len(args_str) > 0)) {
    List_push(all_parts, args_str);
  }
  if ((Str_len(dict_str) > 0)) {
    List_push(all_parts, dict_str);
  }
  if ((Str_len(ev_args) > 0)) {
    List_push(all_parts, ev_args);
  }
  const all_str = List_join(all_parts, ", ");
  return `${callee_str}(${all_str})`;
}

function gen_find_expr(receiver, cb) {
  let p = [""];
  List_clear(p);
  List_push(p, "((__a) => { const __i = __a.findIndex(");
  List_push(p, cb);
  List_push(p, "); return __i >= 0 ? { _tag: \"some\", _0: __a[__i] } : { _tag: \"none\" }; })(");
  List_push(p, receiver);
  List_push(p, ")");
  return List_join(p, "");
}

function gen_find_index_expr(receiver, cb) {
  let p = [""];
  List_clear(p);
  List_push(p, "((__a) => { const __i = __a.findIndex(");
  List_push(p, cb);
  List_push(p, "); return __i >= 0 ? { _tag: \"some\", _0: __i } : { _tag: \"none\" }; })(");
  List_push(p, receiver);
  List_push(p, ")");
  return List_join(p, "");
}

function gen_option_map_expr(receiver, cb) {
  let p = [""];
  List_clear(p);
  List_push(p, "((__o, __f) => __o._tag === \"some\" ? { _tag: \"some\", _0: __f(__o._0) } : __o)(");
  List_push(p, receiver);
  List_push(p, ", ");
  List_push(p, cb);
  List_push(p, ")");
  return List_join(p, "");
}

function gen_option_and_then_expr(receiver, cb) {
  let p = [""];
  List_clear(p);
  List_push(p, "((__o, __f) => __o._tag === \"some\" ? __f(__o._0) : __o)(");
  List_push(p, receiver);
  List_push(p, ", ");
  List_push(p, cb);
  List_push(p, ")");
  return List_join(p, "");
}

function gen_option_unwrap_or_else_expr(receiver, cb) {
  let p = [""];
  List_clear(p);
  List_push(p, "((__o, __f) => __o._tag === \"some\" ? __o._0 : __f())(");
  List_push(p, receiver);
  List_push(p, ", ");
  List_push(p, cb);
  List_push(p, ")");
  return List_join(p, "");
}

function gen_struct_lit(ctx, name, fields, spread) {
  const qname = codegen_ctx$qualify(ctx, name);
  __ring_match27: {
    const __ring_m27 = _Map_get(ctx.struct_field_order, qname);
    if (__ring_m27._tag === "some") {
      const declared_order = __ring_m27._0;
      let field_map = map_new();
      for (const f of fields) {
        _Map_insert(field_map, f.name, f.value);
      }
      __ring_match28: {
        const __ring_m28 = spread;
        if (__ring_m28._tag === "some") {
          const sp = __ring_m28._0;
          return gen_spread_struct(ctx, sp, qname, declared_order, field_map, true);
          break __ring_match28;
        }
        if (__ring_m28._tag === "none") {
          let args = [""];
          List_clear(args);
          for (const fn_ of declared_order) {
            __ring_match29: {
              const __ring_m29 = _Map_get(field_map, fn_);
              if (__ring_m29._tag === "some") {
                const v = __ring_m29._0;
                List_push(args, gen_expr(ctx, v));
                break __ring_match29;
              }
              if (__ring_m29._tag === "none") {
                List_push(args, "undefined");
                break __ring_match29;
              }
              __match_fail(__ring_m29);
            }
          }
          const joined = List_join(args, ", ");
          return `new ${qname}(${joined})`;
          break __ring_match28;
        }
        __match_fail(__ring_m28);
      }
      break __ring_match27;
    }
    if (__ring_m27._tag === "none") {
      __ring_match30: {
        const __ring_m30 = spread;
        if (__ring_m30._tag === "some") {
          const sp = __ring_m30._0;
          let field_map = map_new();
          for (const f of fields) {
            _Map_insert(field_map, f.name, f.value);
          }
          let order = [""];
          List_clear(order);
          for (const f of fields) {
            List_push(order, f.name);
          }
          return gen_spread_struct(ctx, sp, qname, order, field_map, true);
          break __ring_match30;
        }
        if (__ring_m30._tag === "none") {
          let args = [""];
          List_clear(args);
          for (const f of fields) {
            List_push(args, gen_expr(ctx, f.value));
          }
          const joined = List_join(args, ", ");
          return `new ${qname}(${joined})`;
          break __ring_match30;
        }
        __match_fail(__ring_m30);
      }
      break __ring_match27;
    }
    __match_fail(__ring_m27);
  }
}

function gen_spread_struct(ctx, spread, ctor_name, field_order, field_map, use_new) {
  const is_simple = (function() {
  const __ring_m = spread;
  if (__ring_m._tag === "Ident") { return true; }
  if (__ring_m._tag === "FieldAccess") { return true; }
  return false;
})();
  if (is_simple) {
    const base = gen_expr(ctx, spread);
    let args = [""];
    List_clear(args);
    for (const fn_ of field_order) {
      __ring_match31: {
        const __ring_m31 = _Map_get(field_map, fn_);
        if (__ring_m31._tag === "some") {
          const v = __ring_m31._0;
          List_push(args, gen_expr(ctx, v));
          break __ring_match31;
        }
        if (__ring_m31._tag === "none") {
          const sf = codegen_ctx$safe_ident(fn_);
          List_push(args, `${base}.${sf}`);
          break __ring_match31;
        }
        __match_fail(__ring_m31);
      }
    }
    const joined = List_join(args, ", ");
    if (use_new) {
      return `new ${ctor_name}(${joined})`;
    } else {
      return `${ctor_name}(${joined})`;
    }
  } else {
    let args = [""];
    List_clear(args);
    for (const fn_ of field_order) {
      __ring_match32: {
        const __ring_m32 = _Map_get(field_map, fn_);
        if (__ring_m32._tag === "some") {
          const v = __ring_m32._0;
          List_push(args, gen_expr(ctx, v));
          break __ring_match32;
        }
        if (__ring_m32._tag === "none") {
          const sf = codegen_ctx$safe_ident(fn_);
          List_push(args, `__su.${sf}`);
          break __ring_match32;
        }
        __match_fail(__ring_m32);
      }
    }
    const joined = List_join(args, ", ");
    const sp_js = gen_expr(ctx, spread);
    const call = (use_new ? `new ${ctor_name}(${joined})` : `${ctor_name}(${joined})`);
    return `((__su) => ${call})(${sp_js})`;
  }
}

function gen_named_variant_construct(ctx, enum_name, variant_name, fields, spread, ty) {
  const js_name = `${codegen_ctx$qualify(ctx, enum_name)}_${variant_name}`;
  let field_map = map_new();
  for (const f of fields) {
    _Map_insert(field_map, f.name, f.value);
  }
  __ring_match33: {
    const __ring_m33 = ty;
    if (__ring_m33._tag === "EnumType") {
      const variants = __ring_m33.variants;
      for (const v of variants) {
        if ((v.name === variant_name)) {
          __ring_match34: {
            const __ring_m34 = v.field_names;
            if (__ring_m34._tag === "some") {
              const fnames = __ring_m34._0;
              __ring_match35: {
                const __ring_m35 = spread;
                if (__ring_m35._tag === "some") {
                  const sp = __ring_m35._0;
                  return gen_spread_struct(ctx, sp, js_name, fnames, field_map, false);
                  break __ring_match35;
                }
                if (__ring_m35._tag === "none") {
                  let args = [""];
                  List_clear(args);
                  for (const n of fnames) {
                    __ring_match36: {
                      const __ring_m36 = _Map_get(field_map, n);
                      if (__ring_m36._tag === "some") {
                        const v_ = __ring_m36._0;
                        List_push(args, gen_expr(ctx, v_));
                        break __ring_match36;
                      }
                      if (__ring_m36._tag === "none") {
                        List_push(args, "undefined");
                        break __ring_match36;
                      }
                      __match_fail(__ring_m36);
                    }
                  }
                  const joined = List_join(args, ", ");
                  return `${js_name}(${joined})`;
                  break __ring_match35;
                }
                __match_fail(__ring_m35);
              }
              break __ring_match34;
            }
            if (__ring_m34._tag === "none") {
              break __ring_match34;
            }
            __match_fail(__ring_m34);
          }
        }
      }
      break __ring_match33;
    }
    break __ring_match33;
  }
  let args = [""];
  List_clear(args);
  for (const f of fields) {
    List_push(args, gen_expr(ctx, f.value));
  }
  const joined = List_join(args, ", ");
  return `${js_name}(${joined})`;
}

function gen_match(ctx, scrutinee, arms) {
  const scrut = gen_expr(ctx, scrutinee);
  let parts = [""];
  List_clear(parts);
  List_push(parts, "(function() {");
  List_push(parts, `  const __ring_m = ${scrut};`);
  for (const arm of arms) {
    const cond = codegen_stmt$gen_pattern_condition("__ring_m", arm.pattern);
    const bindings = codegen_stmt$gen_pattern_bindings("__ring_m", arm.pattern);
    const body = gen_expr(ctx, arm.body);
    __ring_match37: {
      const __ring_m37 = arm.guard;
      if (__ring_m37._tag === "none") {
        if ((cond === "true")) {
          List_push(parts, `  ${bindings}return ${body};`);
        } else {
          List_push(parts, `  if (${cond}) { ${bindings}return ${body}; }`);
        }
        break __ring_match37;
      }
      if (__ring_m37._tag === "some") {
        const g = __ring_m37._0;
        const guard_js = gen_expr(ctx, g);
        List_push(parts, `  if (${cond}) { ${bindings}if (${guard_js}) { return ${body}; } }`);
        break __ring_match37;
      }
      __match_fail(__ring_m37);
    }
  }
  let has_catchall = false;
  for (const a of arms) {
    __ring_match38: {
      const __ring_m38 = a.pattern;
      if (__ring_m38._tag === "Wildcard") {
        __ring_match39: {
          const __ring_m39 = a.guard;
          if (__ring_m39._tag === "none") {
            has_catchall = true;
            break __ring_match39;
          }
          if (__ring_m39._tag === "some") {
            break __ring_match39;
          }
          __match_fail(__ring_m39);
        }
        break __ring_match38;
      }
      if (__ring_m38._tag === "Binding") {
        __ring_match40: {
          const __ring_m40 = a.guard;
          if (__ring_m40._tag === "none") {
            has_catchall = true;
            break __ring_match40;
          }
          if (__ring_m40._tag === "some") {
            break __ring_match40;
          }
          __match_fail(__ring_m40);
        }
        break __ring_match38;
      }
      break __ring_match38;
    }
  }
  if ((has_catchall === false)) {
    const mf = hir$RUNTIME_MATCH_FAIL;
    List_push(parts, `  ${mf}(__ring_m);`);
  }
  List_push(parts, "})()");
  return List_join(parts, "\n");
}

function gen_block_expr(ctx, stmts, tail, block) {
  __ring_match41: {
    const __ring_m41 = tail;
    if (__ring_m41._tag === "some") {
      const t = __ring_m41._0;
      if ((List_len(stmts) === 0)) {
        return gen_expr(ctx, t);
      }
      break __ring_match41;
    }
    if (__ring_m41._tag === "none") {
      break __ring_match41;
    }
    __match_fail(__ring_m41);
  }
  const saved_lines = ctx.lines;
  const saved_indent = ctx.indent_level;
  ctx.lines = [""];
  List_clear(ctx.lines);
  ctx.indent_level = 1;
  codegen_stmt$emit_block_body(ctx, block);
  const body_lines = ctx.lines;
  ctx.lines = saved_lines;
  ctx.indent_level = saved_indent;
  let result = [""];
  List_clear(result);
  List_push(result, "(function() {");
  List_extend(result, body_lines);
  List_push(result, "})()");
  return List_join(result, "\n");
}

function gen_if(ctx, condition, then_branch, else_branch) {
  const cond = gen_expr(ctx, condition);
  const then_val = gen_block_as_value(ctx, then_branch);
  __ring_match42: {
    const __ring_m42 = else_branch;
    if (__ring_m42._tag === "none") {
      return `(${cond} ? ${then_val} : undefined)`;
      break __ring_match42;
    }
    if (__ring_m42._tag === "some") {
      const eb = __ring_m42._0;
      __ring_match43: {
        const __ring_m43 = eb;
        if (__ring_m43._tag === "IfExpr") {
          const ec = __ring_m43.condition; const et = __ring_m43.then_branch; const ee = __ring_m43.else_branch;
          const else_val = gen_if(ctx, ec, et, ee);
          return `(${cond} ? ${then_val} : ${else_val})`;
          break __ring_match43;
        }
        const else_val = gen_block_as_value(ctx, eb);
        return `(${cond} ? ${then_val} : ${else_val})`;
        break __ring_match43;
      }
      break __ring_match42;
    }
    __match_fail(__ring_m42);
  }
}

function gen_block_as_value(ctx, block) {
  __ring_match44: {
    const __ring_m44 = block;
    if (__ring_m44._tag === "Block") {
      const stmts = __ring_m44.stmts; const tail = __ring_m44.tail;
      __ring_match45: {
        const __ring_m45 = tail;
        if (__ring_m45._tag === "some") {
          const t = __ring_m45._0;
          if ((List_len(stmts) === 0)) {
            return gen_expr(ctx, t);
          }
          break __ring_match45;
        }
        if (__ring_m45._tag === "none") {
          break __ring_match45;
        }
        __match_fail(__ring_m45);
      }
      return gen_block_expr(ctx, stmts, tail, block);
      break __ring_match44;
    }
    return gen_expr(ctx, block);
    break __ring_match44;
  }
}

function escape_for_template_literal(s) {
  let result = [""];
  List_clear(result);
  let i = 0;
  while ((i < Str_len(s))) {
    const ch = Option_unwrap_or(Str_char_at(s, i), "");
    if ((ch === "\\")) {
      List_push(result, "\\\\");
    } else {
      if ((ch === "`")) {
        List_push(result, "\\`");
      } else {
        if ((ch === "\r")) {
          List_push(result, "\\r");
        } else {
          if ((ch === "$")) {
            const next = (((i + 1) < Str_len(s)) ? Option_unwrap_or(Str_char_at(s, (i + 1)), "") : "");
            if ((next === "{")) {
              List_push(result, "\\$");
            } else {
              List_push(result, ch);
            }
          } else {
            List_push(result, ch);
          }
        }
      }
    }
    i = (i + 1);
  }
  return List_join(result, "");
}

function gen_string_interp(ctx, parts) {
  let result = [""];
  List_clear(result);
  List_push(result, "`");
  for (const p of parts) {
    __ring_match46: {
      const __ring_m46 = p;
      if (__ring_m46._tag === "Literal") {
        const s = __ring_m46._0;
        List_push(result, escape_for_template_literal(s));
        break __ring_match46;
      }
      if (__ring_m46._tag === "Expression") {
        const e = __ring_m46._0;
        const expr_str = gen_expr(ctx, e);
        List_push(result, "${");
        List_push(result, expr_str);
        List_push(result, "}");
        break __ring_match46;
      }
      __match_fail(__ring_m46);
    }
  }
  List_push(result, "`");
  return List_join(result, "");
}

function gen_catch_pattern_condition(ctx, target, pat) {
  __ring_match47: {
    const __ring_m47 = pat;
    if (__ring_m47._tag === "NamedConstructor") {
      const name = __ring_m47.name; const fields = __ring_m47.fields;
      if (_Map_contains_key(ctx.struct_field_order, name)) {
        const qualified_name = codegen_ctx$qualify(ctx, codegen_ctx$safe_ident(name));
        const inst_check = `${target} instanceof ${qualified_name}`;
        let sub_conds = [];
        for (const f of fields) {
          const sname = codegen_ctx$safe_ident(f.name);
          const sub = codegen_stmt$gen_pattern_condition(`${target}.${sname}`, f.pattern);
          if ((sub !== "true")) {
            List_push(sub_conds, sub);
          }
        }
        if ((List_len(sub_conds) === 0)) {
          return inst_check;
        } else {
          const joined = List_join(sub_conds, " && ");
          return `${inst_check} && ${joined}`;
        }
      } else {
        return codegen_stmt$gen_pattern_condition(target, pat);
      }
      break __ring_match47;
    }
    return codegen_stmt$gen_pattern_condition(target, pat);
    break __ring_match47;
  }
}

function gen_try_catch(ctx, body, arms) {
  const body_has_fail = has_fail_effect(body);
  const saved_in_try = ctx.in_try_fail;
  ctx.in_try_fail = true;
  const body_js = gen_expr(ctx, body);
  ctx.in_try_fail = saved_in_try;
  const ev = hir$evidence_param_name("fail");
  const ea = hir$RUNTIME_EFFECT_ABORT;
  const q = "\"";
  let arm_js = [];
  for (const arm of arms) {
    const cond = gen_catch_pattern_condition(ctx, "__ring_err", arm.pattern);
    const bindings = codegen_stmt$gen_pattern_bindings("__ring_err", arm.pattern);
    const arm_body_js = gen_expr(ctx, arm.body);
    let guard_js = "";
    __ring_match48: {
      const __ring_m48 = arm.guard;
      if (__ring_m48._tag === "some") {
        const g = __ring_m48._0;
        guard_js = ` && (${gen_expr(ctx, g)})`;
        break __ring_match48;
      }
      if (__ring_m48._tag === "none") {
        break __ring_match48;
      }
      __match_fail(__ring_m48);
    }
    List_push(arm_js, `if (${cond}${guard_js}) { ${bindings}return ${arm_body_js}; }`);
  }
  let p = [];
  List_push(p, "(function() { const ");
  List_push(p, ev);
  List_push(p, " = { raise: (__ring_err) => { throw new ");
  List_push(p, ea);
  List_push(p, "(");
  List_push(p, q);
  List_push(p, "fail");
  List_push(p, q);
  List_push(p, ", __ring_err); } }; try { return ");
  List_push(p, body_js);
  List_push(p, "; } catch (__ring_e) { if (__ring_e instanceof ");
  List_push(p, ea);
  List_push(p, " && __ring_e.effect === ");
  List_push(p, q);
  List_push(p, "fail");
  List_push(p, q);
  List_push(p, ") { const __ring_err = __ring_e.value; ");
  let first = true;
  for (const aj of arm_js) {
    if (first) {
      List_push(p, aj);
      first = false;
    } else {
      List_push(p, ` else ${aj}`);
    }
  }
  if ((List_len(arm_js) > 0)) {
    List_push(p, " else { throw __ring_e; }");
  } else {
    List_push(p, "throw __ring_e;");
  }
  List_push(p, " } throw __ring_e; } })()");
  return List_join(p, "");
}

function has_fail_effect(expr) {
  __ring_match49: {
    const __ring_m49 = expr;
    if (__ring_m49._tag === "IntLit") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "FloatLit") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "StrLit") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "BoolLit") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "Ident") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "BinOp") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "UnaryOp") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "Call") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "FieldAccess") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "StructLit") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "NamedVariantConstruct") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "MatchExpr") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "Block") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "IfExpr") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "StringInterp") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "TryCatch") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "HandleExpr") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "Lambda") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "EffectOp") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "RangeExpr") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "ListLit") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "TupleLit") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    if (__ring_m49._tag === "IndexExpr") {
      const effects = __ring_m49.effects;
      return check_fail(effects);
      break __ring_match49;
    }
    __match_fail(__ring_m49);
  }
}

function check_fail(effects) {
  for (const e of effects.effects) {
    __ring_match50: {
      const __ring_m50 = e;
      if (__ring_m50._tag === "FailEffect") {
        return true;
        break __ring_match50;
      }
      break __ring_match50;
    }
  }
  return false;
}

function gen_handle(ctx, body, handlers) {
  let by_effect = map_new();
  for (const h of handlers) {
    __ring_match51: {
      const __ring_m51 = _Map_get(by_effect, h.effect_name);
      if (__ring_m51._tag === "some") {
        const existing = __ring_m51._0;
        List_push(existing, h);
        break __ring_match51;
      }
      if (__ring_m51._tag === "none") {
        _Map_insert(by_effect, h.effect_name, [h]);
        break __ring_match51;
      }
      __match_fail(__ring_m51);
    }
  }
  let ev_decls = [""];
  List_clear(ev_decls);
  let has_abort = false;
  const q = "\"";
  for (const entry of _Map_entries(by_effect)) {
    const __ring_dt0 = entry;
    const effect_name = __ring_dt0[0];
    const hs = __ring_dt0[1];
    let entries = [""];
    List_clear(entries);
    for (const h of hs) {
      let params = [""];
      List_clear(params);
      for (const p of h.params) {
        List_push(params, codegen_ctx$safe_ident(p.name));
      }
      const params_str = List_join(params, ", ");
      const b = gen_expr(ctx, h.body);
      const is_abort = ((effect_name === "fail") && (h.op_name === "raise"));
      if (is_abort) {
        has_abort = true;
        const ea = hir$RUNTIME_EFFECT_ABORT;
        let ep = [""];
        List_clear(ep);
        List_push(ep, h.op_name);
        List_push(ep, ": (");
        List_push(ep, params_str);
        List_push(ep, ") => { throw new ");
        List_push(ep, ea);
        List_push(ep, "(");
        List_push(ep, q);
        List_push(ep, effect_name);
        List_push(ep, q);
        List_push(ep, ", ");
        List_push(ep, b);
        List_push(ep, "); }");
        List_push(entries, List_join(ep, ""));
      } else {
        let ep = [""];
        List_clear(ep);
        List_push(ep, h.op_name);
        List_push(ep, ": (");
        List_push(ep, params_str);
        List_push(ep, ") => (");
        List_push(ep, b);
        List_push(ep, ")");
        List_push(entries, List_join(ep, ""));
      }
    }
    const ev_name = hir$evidence_param_name(effect_name);
    const entries_str = List_join(entries, ", ");
    List_push(ev_decls, `const ${ev_name} = { ${entries_str} };`);
  }
  let ev_param_names = [""];
  List_clear(ev_param_names);
  for (const entry of _Map_entries(by_effect)) {
    const __ring_dt1 = entry;
    const ename = __ring_dt1[0];
    List_push(ev_param_names, hir$evidence_param_name(ename));
  }
  List_sort(ev_param_names);
  const ev_args = List_join(ev_param_names, ", ");
  const body_code = gen_handle_body(ctx, body, ev_args);
  const decls = List_join(ev_decls, " ");
  const ea = hir$RUNTIME_EFFECT_ABORT;
  if (has_abort) {
    let p = [""];
    List_clear(p);
    List_push(p, "(function() { ");
    List_push(p, decls);
    List_push(p, " try { return ");
    List_push(p, body_code);
    List_push(p, "; } catch (__ring_e) { if (__ring_e instanceof ");
    List_push(p, ea);
    List_push(p, ") return __ring_e.value; throw __ring_e; } })()");
    return List_join(p, "");
  } else {
    return `(function() { ${decls} return ${body_code}; })()`;
  }
}

function gen_handle_body(ctx, expr, ev_params) {
  __ring_match52: {
    const __ring_m52 = expr;
    if (__ring_m52._tag === "Block") {
      const stmts = __ring_m52.stmts; const tail = __ring_m52.tail;
      __ring_match53: {
        const __ring_m53 = tail;
        if (__ring_m53._tag === "some") {
          const t = __ring_m53._0;
          if ((List_len(stmts) === 0)) {
            const b = gen_expr(ctx, t);
            return `(function(${ev_params}) { return ${b}; })(${ev_params})`;
          }
          break __ring_match53;
        }
        if (__ring_m53._tag === "none") {
          break __ring_match53;
        }
        __match_fail(__ring_m53);
      }
      const saved_lines = ctx.lines;
      const saved_indent = ctx.indent_level;
      ctx.lines = [""];
      List_clear(ctx.lines);
      ctx.indent_level = 1;
      codegen_stmt$emit_block_body(ctx, expr);
      const body_lines = ctx.lines;
      ctx.lines = saved_lines;
      ctx.indent_level = saved_indent;
      let result = [""];
      List_clear(result);
      List_push(result, `(function(${ev_params}) {`);
      List_extend(result, body_lines);
      List_push(result, `})(${ev_params})`);
      return List_join(result, "\n");
      break __ring_match52;
    }
    const b = gen_expr(ctx, expr);
    return `(function(${ev_params}) { return ${b}; })(${ev_params})`;
    break __ring_match52;
  }
}

function gen_lambda(ctx, params, body, ty) {
  let p_names = [""];
  List_clear(p_names);
  for (const p of params) {
    List_push(p_names, codegen_ctx$safe_ident(p.name));
  }
  let ev_params = [""];
  List_clear(ev_params);
  __ring_match54: {
    const __ring_m54 = ty;
    if (__ring_m54._tag === "FnType") {
      const effects = __ring_m54.effects;
      ev_params = codegen_ctx$get_evidence_params(effects);
      break __ring_match54;
    }
    break __ring_match54;
  }
  let all = [""];
  List_clear(all);
  List_extend(all, p_names);
  List_extend(all, ev_params);
  const all_str = List_join(all, ", ");
  const b = gen_expr(ctx, body);
  return `(function(${all_str}) { return ${b}; })`;
}

function gen_lambda_capture_evidence(ctx, args, idx) {
  __ring_match55: {
    const __ring_m55 = List_get(args, idx);
    if (__ring_m55._tag === "some") {
      const arg = __ring_m55._0;
      __ring_match56: {
        const __ring_m56 = arg;
        if (__ring_m56._tag === "Lambda") {
          const params = __ring_m56.params; const body = __ring_m56.body;
          let p_names = [""];
          List_clear(p_names);
          for (const p of params) {
            List_push(p_names, codegen_ctx$safe_ident(p.name));
          }
          const params_str = List_join(p_names, ", ");
          const b = gen_expr(ctx, body);
          return `(function(${params_str}) { return ${b}; })`;
          break __ring_match56;
        }
        const fn_expr = gen_expr(ctx, arg);
        const arg_type = hir$hexpr_type(arg);
        __ring_match57: {
          const __ring_m57 = arg_type;
          if (__ring_m57._tag === "FnType") {
            const params = __ring_m57.params;
            const arity = List_len(params);
            let p_names = [""];
            List_clear(p_names);
            const __ring_end1 = arity;
            for (let i = 0; i < __ring_end1; i++) {
              List_push(p_names, `__ring_a${i}`);
            }
            const ev_args = get_callee_evidence_args(ctx, arg_type, Option_none);
            let all = [""];
            List_clear(all);
            List_extend(all, p_names);
            if ((Str_len(ev_args) > 0)) {
              List_push(all, ev_args);
            }
            const all_str = List_join(all, ", ");
            const params_str = List_join(p_names, ", ");
            return `(function(${params_str}) { return ${fn_expr}(${all_str}); })`;
            break __ring_match57;
          }
          return fn_expr;
          break __ring_match57;
        }
        break __ring_match56;
      }
      break __ring_match55;
    }
    if (__ring_m55._tag === "none") {
      return "undefined";
      break __ring_match55;
    }
    __match_fail(__ring_m55);
  }
}

function __StringBuilder_Eq_eq(self, other) {
  return true;
}
const __StringBuilder_Eq = { eq: __StringBuilder_Eq_eq, ne: function(self, other) { return !__StringBuilder_Eq_eq(self, other); } };

function __StringBuilder_Clone_clone(self) {
  return new StringBuilder();
}
const __StringBuilder_Clone = { clone: __StringBuilder_Clone_clone };

function __StringBuilder_Ord_cmp(self, other) {
  return 0;
}
const __StringBuilder_Ord = { cmp: __StringBuilder_Ord_cmp };

function __StringBuilder_Debug_debug(self) {
  return "StringBuilder";
}
const __StringBuilder_Debug = { debug: __StringBuilder_Debug_debug };


export { gen_expr };