import { __EffectAbort, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_first, List_last, List_contains, List_is_empty, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_is_empty, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_is_empty, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_OptionUnwrap as ast$Expr_OptionUnwrap, Expr_TryBlock as ast$Expr_TryBlock, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_OptionUnwrap as hir$HExpr_OptionUnwrap, HExpr_TryBlock as hir$HExpr_TryBlock, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { safe_ident as codegen_ctx$safe_ident, new_codegen_ctx as codegen_ctx$new_codegen_ctx, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, push_indent as codegen_ctx$push_indent, pop_indent as codegen_ctx$pop_indent, qualify as codegen_ctx$qualify, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";
import { gen_expr as codegen_expr$gen_expr } from "./codegen_expr.js";


function emit_in_stmt_context(ctx, expr, mode) {
  __ring_match0: {
    const __ring_m0 = expr;
    if (__ring_m0._tag === "IfExpr") {
      const condition = __ring_m0.condition; const then_branch = __ring_m0.then_branch; const else_branch = __ring_m0.else_branch;
      return emit_if_stmt(ctx, condition, then_branch, else_branch, mode);
      break __ring_match0;
    }
    if (__ring_m0._tag === "Block") {
      const stmts = __ring_m0.stmts; const tail = __ring_m0.tail;
      return emit_block_in_stmt_context_inner(ctx, stmts, tail, mode);
      break __ring_match0;
    }
    if (__ring_m0._tag === "MatchExpr") {
      const scrutinee = __ring_m0.scrutinee; const arms = __ring_m0.arms;
      return emit_match_stmt(ctx, scrutinee, arms, mode);
      break __ring_match0;
    }
    const e = codegen_expr$gen_expr(ctx, expr);
    if ((mode === "return")) {
      return codegen_ctx$emit(ctx, `return ${e};`);
    } else {
      return codegen_ctx$emit(ctx, `${e};`);
    }
    break __ring_match0;
  }
}

function emit_if_stmt(ctx, condition, then_branch, else_branch, mode) {
  const cond = codegen_expr$gen_expr(ctx, condition);
  codegen_ctx$emit(ctx, `if (${cond}) {`);
  codegen_ctx$push_indent(ctx);
  emit_block_in_stmt_context(ctx, then_branch, mode);
  codegen_ctx$pop_indent(ctx);
  __ring_match1: {
    const __ring_m1 = else_branch;
    if (__ring_m1._tag === "none") {
      return codegen_ctx$emit(ctx, "}");
      break __ring_match1;
    }
    if (__ring_m1._tag === "some") {
      const eb = __ring_m1._0;
      __ring_match2: {
        const __ring_m2 = eb;
        if (__ring_m2._tag === "IfExpr") {
          const ec = __ring_m2.condition; const et = __ring_m2.then_branch; const ee = __ring_m2.else_branch;
          return emit_else_if(ctx, ec, et, ee, mode);
          break __ring_match2;
        }
        codegen_ctx$emit(ctx, "} else {");
        codegen_ctx$push_indent(ctx);
        emit_block_in_stmt_context(ctx, eb, mode);
        codegen_ctx$pop_indent(ctx);
        return codegen_ctx$emit(ctx, "}");
        break __ring_match2;
      }
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
}

function emit_else_if(ctx, condition, then_branch, else_branch, mode) {
  const cond = codegen_expr$gen_expr(ctx, condition);
  codegen_ctx$emit(ctx, `} else if (${cond}) {`);
  codegen_ctx$push_indent(ctx);
  emit_block_in_stmt_context(ctx, then_branch, mode);
  codegen_ctx$pop_indent(ctx);
  __ring_match3: {
    const __ring_m3 = else_branch;
    if (__ring_m3._tag === "none") {
      return codegen_ctx$emit(ctx, "}");
      break __ring_match3;
    }
    if (__ring_m3._tag === "some") {
      const eb = __ring_m3._0;
      __ring_match4: {
        const __ring_m4 = eb;
        if (__ring_m4._tag === "IfExpr") {
          const ec = __ring_m4.condition; const et = __ring_m4.then_branch; const ee = __ring_m4.else_branch;
          return emit_else_if(ctx, ec, et, ee, mode);
          break __ring_match4;
        }
        codegen_ctx$emit(ctx, "} else {");
        codegen_ctx$push_indent(ctx);
        emit_block_in_stmt_context(ctx, eb, mode);
        codegen_ctx$pop_indent(ctx);
        return codegen_ctx$emit(ctx, "}");
        break __ring_match4;
      }
      break __ring_match3;
    }
    __match_fail(__ring_m3);
  }
}

function emit_block_in_stmt_context(ctx, block, mode) {
  __ring_match5: {
    const __ring_m5 = block;
    if (__ring_m5._tag === "Block") {
      const stmts = __ring_m5.stmts; const tail = __ring_m5.tail;
      return emit_block_in_stmt_context_inner(ctx, stmts, tail, mode);
      break __ring_match5;
    }
    return emit_in_stmt_context(ctx, block, mode);
    break __ring_match5;
  }
}

function emit_block_in_stmt_context_inner(ctx, stmts, tail, mode) {
  for (const stmt of stmts) {
    emit_stmt(ctx, stmt);
  }
  __ring_match6: {
    const __ring_m6 = tail;
    if (__ring_m6._tag === "some") {
      const t = __ring_m6._0;
      return emit_in_stmt_context(ctx, t, mode);
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function emit_block_body(ctx, block) {
  __ring_match7: {
    const __ring_m7 = block;
    if (__ring_m7._tag === "Block") {
      const stmts = __ring_m7.stmts; const tail = __ring_m7.tail;
      for (const stmt of stmts) {
        emit_stmt(ctx, stmt);
      }
      __ring_match8: {
        const __ring_m8 = tail;
        if (__ring_m8._tag === "some") {
          const t = __ring_m8._0;
          return emit_in_stmt_context(ctx, t, "return");
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      break __ring_match7;
    }
    return emit_in_stmt_context(ctx, block, "return");
    break __ring_match7;
  }
}

function emit_match_stmt(ctx, scrutinee, arms, mode) {
  const label = `__ring_match${ctx.match_counter}`;
  ctx.match_counter = (ctx.match_counter + 1);
  const scrut_js = codegen_expr$gen_expr(ctx, scrutinee);
  codegen_ctx$emit(ctx, `${label}: {`);
  codegen_ctx$push_indent(ctx);
  const scrut_var = `__ring_m${(ctx.match_counter - 1)}`;
  codegen_ctx$emit(ctx, `const ${scrut_var} = ${scrut_js};`);
  for (const arm of arms) {
    const cond = gen_pattern_condition(scrut_var, arm.pattern);
    const bindings_str = gen_pattern_bindings(scrut_var, arm.pattern);
    __ring_match9: {
      const __ring_m9 = arm.guard;
      if (__ring_m9._tag === "none") {
        if ((cond === "true")) {
          if ((Str_len(bindings_str) > 0)) {
            codegen_ctx$emit(ctx, Str_trim(bindings_str));
          }
          emit_in_stmt_context(ctx, arm.body, mode);
          codegen_ctx$emit(ctx, `break ${label};`);
        } else {
          codegen_ctx$emit(ctx, `if (${cond}) {`);
          codegen_ctx$push_indent(ctx);
          if ((Str_len(bindings_str) > 0)) {
            codegen_ctx$emit(ctx, Str_trim(bindings_str));
          }
          emit_in_stmt_context(ctx, arm.body, mode);
          codegen_ctx$emit(ctx, `break ${label};`);
          codegen_ctx$pop_indent(ctx);
          codegen_ctx$emit(ctx, "}");
        }
        break __ring_match9;
      }
      if (__ring_m9._tag === "some") {
        const guard = __ring_m9._0;
        codegen_ctx$emit(ctx, `if (${cond}) {`);
        codegen_ctx$push_indent(ctx);
        if ((Str_len(bindings_str) > 0)) {
          codegen_ctx$emit(ctx, Str_trim(bindings_str));
        }
        const guard_js = codegen_expr$gen_expr(ctx, guard);
        codegen_ctx$emit(ctx, `if (${guard_js}) {`);
        codegen_ctx$push_indent(ctx);
        emit_in_stmt_context(ctx, arm.body, mode);
        codegen_ctx$emit(ctx, `break ${label};`);
        codegen_ctx$pop_indent(ctx);
        codegen_ctx$emit(ctx, "}");
        codegen_ctx$pop_indent(ctx);
        codegen_ctx$emit(ctx, "}");
        break __ring_match9;
      }
      __match_fail(__ring_m9);
    }
  }
  let has_catchall = false;
  for (const a of arms) {
    __ring_match10: {
      const __ring_m10 = a.pattern;
      if (__ring_m10._tag === "Wildcard") {
        __ring_match11: {
          const __ring_m11 = a.guard;
          if (__ring_m11._tag === "none") {
            has_catchall = true;
            break __ring_match11;
          }
          if (__ring_m11._tag === "some") {
            break __ring_match11;
          }
          __match_fail(__ring_m11);
        }
        break __ring_match10;
      }
      if (__ring_m10._tag === "Binding") {
        __ring_match12: {
          const __ring_m12 = a.guard;
          if (__ring_m12._tag === "none") {
            has_catchall = true;
            break __ring_match12;
          }
          if (__ring_m12._tag === "some") {
            break __ring_match12;
          }
          __match_fail(__ring_m12);
        }
        break __ring_match10;
      }
      break __ring_match10;
    }
  }
  if ((has_catchall === false)) {
    codegen_ctx$emit(ctx, `${hir$RUNTIME_MATCH_FAIL()}(${scrut_var});`);
  }
  codegen_ctx$pop_indent(ctx);
  return codegen_ctx$emit(ctx, "}");
}

function emit_stmt(ctx, stmt) {
  __ring_match13: {
    const __ring_m13 = stmt;
    if (__ring_m13._tag === "ExprStmt") {
      const expr = __ring_m13.expr;
      return emit_in_stmt_context(ctx, expr, "discard");
      break __ring_match13;
    }
    if (__ring_m13._tag === "Return") {
      const value = __ring_m13.value;
      __ring_match14: {
        const __ring_m14 = value;
        if (__ring_m14._tag === "some") {
          const v = __ring_m14._0;
          return emit_in_stmt_context(ctx, v, "return");
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          return codegen_ctx$emit(ctx, "return;");
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "While") {
      const condition = __ring_m13.condition; const body = __ring_m13.body;
      const cond = codegen_expr$gen_expr(ctx, condition);
      codegen_ctx$emit(ctx, `while (${cond}) {`);
      codegen_ctx$push_indent(ctx);
      emit_block_in_stmt_context(ctx, body, "discard");
      codegen_ctx$pop_indent(ctx);
      return codegen_ctx$emit(ctx, "}");
      break __ring_match13;
    }
    if (__ring_m13._tag === "ForIn") {
      const binding = __ring_m13.binding; const destructure = __ring_m13.destructure; const iterable = __ring_m13.iterable; const body = __ring_m13.body;
      __ring_match15: {
        const __ring_m15 = iterable;
        if (__ring_m15._tag === "RangeExpr") {
          const start = __ring_m15.start; const end = __ring_m15.end; const inclusive = __ring_m15.inclusive;
          const start_js = codegen_expr$gen_expr(ctx, start);
          const end_js = codegen_expr$gen_expr(ctx, end);
          const b = codegen_ctx$safe_ident(binding);
          const end_var = `__ring_end${ctx.loop_counter}`;
          ctx.loop_counter = (ctx.loop_counter + 1);
          codegen_ctx$emit(ctx, `const ${end_var} = ${end_js};`);
          const cmp = (inclusive ? "<=" : "<");
          codegen_ctx$emit(ctx, `for (let ${b} = ${start_js}; ${b} ${cmp} ${end_var}; ${b}++) {`);
          break __ring_match15;
        }
        __ring_match16: {
          const __ring_m16 = destructure;
          if (__ring_m16._tag === "some") {
            const ds = __ring_m16._0;
            if ((List_len(ds) > 0)) {
              const iter = codegen_expr$gen_expr(ctx, iterable);
              let names = [""];
              List_clear(names);
              for (const d of ds) {
                List_push(names, codegen_ctx$safe_ident(d.name));
              }
              const joined = List_join(names, ", ");
              codegen_ctx$emit(ctx, `for (const [${joined}] of ${iter}) {`);
            } else {
              const iter = codegen_expr$gen_expr(ctx, iterable);
              const b = codegen_ctx$safe_ident(binding);
              codegen_ctx$emit(ctx, `for (const ${b} of ${iter}) {`);
            }
            break __ring_match16;
          }
          if (__ring_m16._tag === "none") {
            const iter = codegen_expr$gen_expr(ctx, iterable);
            const b = codegen_ctx$safe_ident(binding);
            codegen_ctx$emit(ctx, `for (const ${b} of ${iter}) {`);
            break __ring_match16;
          }
          __match_fail(__ring_m16);
        }
        break __ring_match15;
      }
      codegen_ctx$push_indent(ctx);
      emit_block_in_stmt_context(ctx, body, "discard");
      codegen_ctx$pop_indent(ctx);
      return codegen_ctx$emit(ctx, "}");
      break __ring_match13;
    }
    if (__ring_m13._tag === "Break") {
      return codegen_ctx$emit(ctx, "break;");
      break __ring_match13;
    }
    if (__ring_m13._tag === "Continue") {
      return codegen_ctx$emit(ctx, "continue;");
      break __ring_match13;
    }
    if (__ring_m13._tag === "LetDestructure") {
      const bindings = __ring_m13.bindings; const init = __ring_m13.init;
      const init_js = codegen_expr$gen_expr(ctx, init);
      const tmp = `__ring_dt${ctx.dt_counter}`;
      ctx.dt_counter = (ctx.dt_counter + 1);
      codegen_ctx$emit(ctx, `const ${tmp} = ${init_js};`);
      const __ring_end0 = List_len(bindings);
      for (let i = 0; i < __ring_end0; i++) {
        __ring_match17: {
          const __ring_m17 = List_get(bindings, i);
          if (__ring_m17._tag === "some") {
            const b = __ring_m17._0;
            if ((b.name !== "_")) {
              const sname = codegen_ctx$safe_ident(b.name);
              codegen_ctx$emit(ctx, `const ${sname} = ${tmp}[${i}];`);
            }
            break __ring_match17;
          }
          if (__ring_m17._tag === "none") {
            break __ring_match17;
          }
          __match_fail(__ring_m17);
        }
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "IfLet") {
      const pattern = __ring_m13.pattern; const expr = __ring_m13.expr; const then_block = __ring_m13.then_block; const else_block = __ring_m13.else_block;
      codegen_ctx$emit(ctx, "{");
      codegen_ctx$push_indent(ctx);
      const scrutinee = codegen_expr$gen_expr(ctx, expr);
      codegen_ctx$emit(ctx, `const __ring_t = ${scrutinee};`);
      const cond = gen_pattern_condition("__ring_t", pattern);
      codegen_ctx$emit(ctx, `if (${cond}) {`);
      codegen_ctx$push_indent(ctx);
      const bindings = gen_pattern_bindings("__ring_t", pattern);
      if ((Str_len(Str_trim(bindings)) > 0)) {
        codegen_ctx$emit(ctx, Str_trim(bindings));
      }
      emit_block_in_stmt_context(ctx, then_block, "discard");
      codegen_ctx$pop_indent(ctx);
      __ring_match18: {
        const __ring_m18 = else_block;
        if (__ring_m18._tag === "some") {
          const eb = __ring_m18._0;
          codegen_ctx$emit(ctx, "} else {");
          codegen_ctx$push_indent(ctx);
          emit_block_in_stmt_context(ctx, eb, "discard");
          codegen_ctx$pop_indent(ctx);
          codegen_ctx$emit(ctx, "}");
          break __ring_match18;
        }
        if (__ring_m18._tag === "none") {
          codegen_ctx$emit(ctx, "}");
          break __ring_match18;
        }
        __match_fail(__ring_m18);
      }
      codegen_ctx$pop_indent(ctx);
      return codegen_ctx$emit(ctx, "}");
      break __ring_match13;
    }
    if (__ring_m13._tag === "Let") {
      const name = __ring_m13.name; const init = __ring_m13.init;
      const sname = codegen_ctx$safe_ident(name);
      const init_js = codegen_expr$gen_expr(ctx, init);
      return codegen_ctx$emit(ctx, `const ${sname} = ${init_js};`);
      break __ring_match13;
    }
    if (__ring_m13._tag === "Var") {
      const name = __ring_m13.name; const init = __ring_m13.init;
      const sname = codegen_ctx$safe_ident(name);
      const init_js = codegen_expr$gen_expr(ctx, init);
      return codegen_ctx$emit(ctx, `let ${sname} = ${init_js};`);
      break __ring_match13;
    }
    if (__ring_m13._tag === "Assign") {
      const target = __ring_m13.target; const value = __ring_m13.value;
      const t = codegen_expr$gen_expr(ctx, target);
      const v = codegen_expr$gen_expr(ctx, value);
      return codegen_ctx$emit(ctx, `${t} = ${v};`);
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
}

function gen_stmt_inline(ctx, stmt) {
  __ring_match19: {
    const __ring_m19 = stmt;
    if (__ring_m19._tag === "Let") {
      const name = __ring_m19.name; const init = __ring_m19.init;
      const sname = codegen_ctx$safe_ident(name);
      const init_js = codegen_expr$gen_expr(ctx, init);
      return `const ${sname} = ${init_js};`;
      break __ring_match19;
    }
    if (__ring_m19._tag === "Var") {
      const name = __ring_m19.name; const init = __ring_m19.init;
      const sname = codegen_ctx$safe_ident(name);
      const init_js = codegen_expr$gen_expr(ctx, init);
      return `let ${sname} = ${init_js};`;
      break __ring_match19;
    }
    if (__ring_m19._tag === "Assign") {
      const target = __ring_m19.target; const value = __ring_m19.value;
      const t = codegen_expr$gen_expr(ctx, target);
      const v = codegen_expr$gen_expr(ctx, value);
      return `${t} = ${v};`;
      break __ring_match19;
    }
    if (__ring_m19._tag === "ExprStmt") {
      const expr = __ring_m19.expr;
      const e = codegen_expr$gen_expr(ctx, expr);
      return `${e};`;
      break __ring_match19;
    }
    if (__ring_m19._tag === "Return") {
      const value = __ring_m19.value;
      __ring_match20: {
        const __ring_m20 = value;
        if (__ring_m20._tag === "some") {
          const v = __ring_m20._0;
          const e = codegen_expr$gen_expr(ctx, v);
          return `return ${e};`;
          break __ring_match20;
        }
        if (__ring_m20._tag === "none") {
          return "return;";
          break __ring_match20;
        }
        __match_fail(__ring_m20);
      }
      break __ring_match19;
    }
    return panic("gen_stmt_inline: unhandled stmt kind");
    break __ring_match19;
  }
}

function gen_pattern_condition(target, pat) {
  __ring_match21: {
    const __ring_m21 = pat;
    if (__ring_m21._tag === "Wildcard") {
      return "true";
      break __ring_match21;
    }
    if (__ring_m21._tag === "Binding") {
      return "true";
      break __ring_match21;
    }
    if (__ring_m21._tag === "Literal") {
      const value = __ring_m21.value;
      const val_str = (function() {
  const __ring_m = value;
  if (__ring_m._tag === "IntVal") { const n = __ring_m._0; return Int_to_str(n); }
  if (__ring_m._tag === "FloatVal") { const f = __ring_m._0; return Float_to_str(f); }
  if (__ring_m._tag === "StrVal") { const s = __ring_m._0; return json_stringify(s); }
  if (__ring_m._tag === "BoolVal") { const b = __ring_m._0; return (b ? "true" : "false"); }
  __match_fail(__ring_m);
})();
      return `${target} === ${val_str}`;
      break __ring_match21;
    }
    if (__ring_m21._tag === "Constructor") {
      const name = __ring_m21.name; const fields = __ring_m21.fields;
      const tag_check = `${target}.${hir$ENUM_TAG_FIELD()} === "${name}"`;
      let sub_conds = [""];
      List_clear(sub_conds);
      const __ring_end1 = List_len(fields);
      for (let i = 0; i < __ring_end1; i++) {
        __ring_match22: {
          const __ring_m22 = List_get(fields, i);
          if (__ring_m22._tag === "some") {
            const f = __ring_m22._0;
            const sub = gen_pattern_condition(`${target}._${i}`, f);
            if ((sub !== "true")) {
              List_push(sub_conds, sub);
            }
            break __ring_match22;
          }
          if (__ring_m22._tag === "none") {
            break __ring_match22;
          }
          __match_fail(__ring_m22);
        }
      }
      if ((List_len(sub_conds) === 0)) {
        return tag_check;
      } else {
        const joined = List_join(sub_conds, " && ");
        return `${tag_check} && ${joined}`;
      }
      break __ring_match21;
    }
    if (__ring_m21._tag === "NamedConstructor") {
      const name = __ring_m21.name; const fields = __ring_m21.fields;
      const tag_check = `${target}.${hir$ENUM_TAG_FIELD()} === "${name}"`;
      let sub_conds = [""];
      List_clear(sub_conds);
      for (const f of fields) {
        const sname = codegen_ctx$safe_ident(f.name);
        const sub = gen_pattern_condition(`${target}.${sname}`, f.pattern);
        if ((sub !== "true")) {
          List_push(sub_conds, sub);
        }
      }
      if ((List_len(sub_conds) === 0)) {
        return tag_check;
      } else {
        const joined = List_join(sub_conds, " && ");
        return `${tag_check} && ${joined}`;
      }
      break __ring_match21;
    }
    if (__ring_m21._tag === "TuplePattern") {
      const elements = __ring_m21.elements;
      const len_check = `Array.isArray(${target}) && ${target}.length === ${List_len(elements)}`;
      let sub_conds = [""];
      List_clear(sub_conds);
      const __ring_end2 = List_len(elements);
      for (let i = 0; i < __ring_end2; i++) {
        __ring_match23: {
          const __ring_m23 = List_get(elements, i);
          if (__ring_m23._tag === "some") {
            const e = __ring_m23._0;
            const sub = gen_pattern_condition(`${target}[${i}]`, e);
            if ((sub !== "true")) {
              List_push(sub_conds, sub);
            }
            break __ring_match23;
          }
          if (__ring_m23._tag === "none") {
            break __ring_match23;
          }
          __match_fail(__ring_m23);
        }
      }
      if ((List_len(sub_conds) === 0)) {
        return len_check;
      } else {
        const joined = List_join(sub_conds, " && ");
        return `${len_check} && ${joined}`;
      }
      break __ring_match21;
    }
    __match_fail(__ring_m21);
  }
}

function gen_pattern_bindings(target, pat) {
  __ring_match24: {
    const __ring_m24 = pat;
    if (__ring_m24._tag === "Wildcard") {
      return "";
      break __ring_match24;
    }
    if (__ring_m24._tag === "Literal") {
      return "";
      break __ring_match24;
    }
    if (__ring_m24._tag === "Binding") {
      const name = __ring_m24.name;
      const sname = codegen_ctx$safe_ident(name);
      return `const ${sname} = ${target}; `;
      break __ring_match24;
    }
    if (__ring_m24._tag === "Constructor") {
      const fields = __ring_m24.fields;
      let result = "";
      const __ring_end3 = List_len(fields);
      for (let i = 0; i < __ring_end3; i++) {
        __ring_match25: {
          const __ring_m25 = List_get(fields, i);
          if (__ring_m25._tag === "some") {
            const f = __ring_m25._0;
            const sub = gen_pattern_bindings(`${target}._${i}`, f);
            result = `${result}${sub}`;
            break __ring_match25;
          }
          if (__ring_m25._tag === "none") {
            break __ring_match25;
          }
          __match_fail(__ring_m25);
        }
      }
      return result;
      break __ring_match24;
    }
    if (__ring_m24._tag === "NamedConstructor") {
      const fields = __ring_m24.fields;
      let result = "";
      for (const f of fields) {
        const sname = codegen_ctx$safe_ident(f.name);
        const sub = gen_pattern_bindings(`${target}.${sname}`, f.pattern);
        result = `${result}${sub}`;
      }
      return result;
      break __ring_match24;
    }
    if (__ring_m24._tag === "TuplePattern") {
      const elements = __ring_m24.elements;
      let result = "";
      const __ring_end4 = List_len(elements);
      for (let i = 0; i < __ring_end4; i++) {
        __ring_match26: {
          const __ring_m26 = List_get(elements, i);
          if (__ring_m26._tag === "some") {
            const e = __ring_m26._0;
            const sub = gen_pattern_bindings(`${target}[${i}]`, e);
            result = `${result}${sub}`;
            break __ring_match26;
          }
          if (__ring_m26._tag === "none") {
            break __ring_match26;
          }
          __match_fail(__ring_m26);
        }
      }
      return result;
      break __ring_match24;
    }
    __match_fail(__ring_m24);
  }
}


export { emit_in_stmt_context, emit_block_in_stmt_context, emit_block_body, emit_stmt, gen_stmt_inline, gen_pattern_condition, gen_pattern_bindings };