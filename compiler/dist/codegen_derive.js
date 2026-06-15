import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, is_imported_name as codegen_ctx$is_imported_name, new_codegen_ctx as codegen_ctx$new_codegen_ctx, pop_indent as codegen_ctx$pop_indent, push_indent as codegen_ctx$push_indent, qualify as codegen_ctx$qualify, safe_ident as codegen_ctx$safe_ident, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";



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

function collect_dict_params(impl_, trait_name) {
  let params = [];
  const __ring_iter_2 = __List_Iterable.iter(impl_.bounds);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const b = __ring_next_2._0;
    if ((b.trait_name === trait_name)) {
      List_push(params, hir$trait_bound_param_name(b.type_param, b.trait_name));
    }
  }
  return params;
}

function field_accessor(v, f) {
  if (v.has_named_fields) {
    return codegen_ctx$safe_ident(f.name);
  } else {
    __ring_match6: {
      const __ring_m6 = f.positional_index;
      if (__ring_m6._tag === "some") {
        const pi = __ring_m6._0;
        return `_${pi}`;
        break __ring_match6;
      }
      if (__ring_m6._tag === "none") {
        return f.name;
        break __ring_match6;
      }
      __match_fail(__ring_m6);
    }
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

function gen_action_clone(expr, action) {
  __ring_match7: {
    const __ring_m7 = action;
    if (__ring_m7._tag === "Identity") {
      return expr;
      break __ring_match7;
    }
    if (__ring_m7._tag === "Call") {
      const dict_name = __ring_m7.dict_name; const extra_dicts = __ring_m7.extra_dicts;
      const extra = extra_dicts_str(extra_dicts);
      return `${dict_name}.clone(${expr}${extra})`;
      break __ring_match7;
    }
    if (__ring_m7._tag === "Tuple") {
      const element_actions = __ring_m7.element_actions;
      let parts = [];
      const __ring_end3 = List_len(element_actions);
      for (let i = 0; i < __ring_end3; i++) {
        __ring_match8: {
          const __ring_m8 = List_get(element_actions, i);
          if (__ring_m8._tag === "some") {
            const ea = __ring_m8._0;
            List_push(parts, gen_action_clone(`${expr}[${i}]`, ea));
            break __ring_match8;
          }
          if (__ring_m8._tag === "none") {
            break __ring_match8;
          }
          __match_fail(__ring_m8);
        }
      }
      return `[${List_join(parts, ", ")}]`;
      break __ring_match7;
    }
    if (__ring_m7._tag === "FnLiteral") {
      return panic("unreachable: FnLiteral in Clone derive");
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
}

function gen_field_clone(expr, field) {
  return gen_action_clone(expr, field.action);
}

function emit_derived_clone(ctx, impl_) {
  const name = codegen_ctx$qualify(ctx, impl_.type_name);
  const dict_base = hir$trait_dict_name(name, "Clone");
  const fn_name = `${dict_base}_clone`;
  const dict_params = collect_dict_params(impl_, "Clone");
  let all_list = ["self"];
  List_extend(all_list, dict_params);
  const all_params = List_join(all_list, ", ");
  codegen_ctx$emit(ctx, `function ${fn_name}(${all_params}) {`);
  codegen_ctx$push_indent(ctx);
  __ring_match9: {
    const __ring_m9 = impl_.type_kind;
    if (__ring_m9._tag === "StructKind") {
      __ring_match10: {
        const __ring_m10 = impl_.struct_fields;
        if (__ring_m10._tag === "some") {
          const fields = __ring_m10._0;
          let args = [];
          const __ring_iter_4 = __List_Iterable.iter(fields);
          while (true) {
            const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
            if (__ring_next_4._tag === "none") break;
            const f = __ring_next_4._0;
            List_push(args, gen_field_clone(`self.${codegen_ctx$safe_ident(f.name)}`, f));
          }
          const joined = List_join(args, ", ");
          codegen_ctx$emit(ctx, `return new ${name}(${joined});`);
          break __ring_match10;
        }
        if (__ring_m10._tag === "none") {
          break __ring_match10;
        }
        __match_fail(__ring_m10);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "EnumKind") {
      __ring_match11: {
        const __ring_m11 = impl_.enum_variants;
        if (__ring_m11._tag === "some") {
          const variants = __ring_m11._0;
          codegen_ctx$emit(ctx, `switch (self.${hir$ENUM_TAG_FIELD}) {`);
          codegen_ctx$push_indent(ctx);
          const __ring_iter_5 = __List_Iterable.iter(variants);
          while (true) {
            const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
            if (__ring_next_5._tag === "none") break;
            const v = __ring_next_5._0;
            if ((List_len(v.fields) === 0)) {
              codegen_ctx$emit(ctx, `case "${v.name}": return ${name}_${v.name};`);
            } else {
              let args = [];
              const __ring_iter_6 = __List_Iterable.iter(v.fields);
              while (true) {
                const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
                if (__ring_next_6._tag === "none") break;
                const f = __ring_next_6._0;
                const accessor = field_accessor(v, f);
                List_push(args, gen_field_clone(`self.${accessor}`, f));
              }
              const joined = List_join(args, ", ");
              codegen_ctx$emit(ctx, `case "${v.name}": return ${name}_${v.name}(${joined});`);
            }
          }
          codegen_ctx$emit(ctx, "default: return self;");
          codegen_ctx$pop_indent(ctx);
          codegen_ctx$emit(ctx, "}");
          break __ring_match11;
        }
        if (__ring_m11._tag === "none") {
          break __ring_match11;
        }
        __match_fail(__ring_m11);
      }
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
  codegen_ctx$pop_indent(ctx);
  codegen_ctx$emit(ctx, "}");
  const dict_name = hir$trait_dict_name(name, "Clone");
  return codegen_ctx$emit(ctx, `const ${dict_name} = { clone: ${fn_name} };`);
}

function gen_action_debug(expr, action) {
  __ring_match12: {
    const __ring_m12 = action;
    if (__ring_m12._tag === "Identity") {
      return `String(${expr})`;
      break __ring_match12;
    }
    if (__ring_m12._tag === "Call") {
      const dict_name = __ring_m12.dict_name; const extra_dicts = __ring_m12.extra_dicts;
      const extra = extra_dicts_str(extra_dicts);
      return `${dict_name}.debug(${expr}${extra})`;
      break __ring_match12;
    }
    if (__ring_m12._tag === "Tuple") {
      const element_actions = __ring_m12.element_actions;
      if ((List_len(element_actions) === 0)) {
        return "\"()\"";
      } else {
        let parts = [];
        const __ring_end7 = List_len(element_actions);
        for (let i = 0; i < __ring_end7; i++) {
          __ring_match13: {
            const __ring_m13 = List_get(element_actions, i);
            if (__ring_m13._tag === "some") {
              const ea = __ring_m13._0;
              List_push(parts, gen_action_debug(`${expr}[${i}]`, ea));
              break __ring_match13;
            }
            if (__ring_m13._tag === "none") {
              break __ring_match13;
            }
            __match_fail(__ring_m13);
          }
        }
        return `"(" + ${List_join(parts, " + \", \" + ")} + ")"`;
      }
      break __ring_match12;
    }
    if (__ring_m12._tag === "FnLiteral") {
      return "\"<fn>\"";
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
}

function gen_field_debug(expr, field) {
  return gen_action_debug(expr, field.action);
}

function emit_derived_debug(ctx, impl_) {
  const name = codegen_ctx$qualify(ctx, impl_.type_name);
  const dict_base = hir$trait_dict_name(name, "Debug");
  const fn_name = `${dict_base}_debug`;
  const dict_params = collect_dict_params(impl_, "Debug");
  let all_list = ["self"];
  List_extend(all_list, dict_params);
  const all_params = List_join(all_list, ", ");
  codegen_ctx$emit(ctx, `function ${fn_name}(${all_params}) {`);
  codegen_ctx$push_indent(ctx);
  __ring_match14: {
    const __ring_m14 = impl_.type_kind;
    if (__ring_m14._tag === "StructKind") {
      __ring_match15: {
        const __ring_m15 = impl_.struct_fields;
        if (__ring_m15._tag === "some") {
          const fields = __ring_m15._0;
          if ((List_len(fields) === 0)) {
            codegen_ctx$emit(ctx, `return "${impl_.type_name}";`);
          } else {
            let parts = [];
            const __ring_iter_8 = __List_Iterable.iter(fields);
            while (true) {
              const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
              if (__ring_next_8._tag === "none") break;
              const f = __ring_next_8._0;
              const val = gen_field_debug(`self.${codegen_ctx$safe_ident(f.name)}`, f);
              List_push(parts, `"${f.name}: " + ${val}`);
            }
            const joined = List_join(parts, " + \", \" + ");
            codegen_ctx$emit(ctx, `return "${impl_.type_name} { " + ${joined} + " }";`);
          }
          break __ring_match15;
        }
        if (__ring_m15._tag === "none") {
          break __ring_match15;
        }
        __match_fail(__ring_m15);
      }
      break __ring_match14;
    }
    if (__ring_m14._tag === "EnumKind") {
      __ring_match16: {
        const __ring_m16 = impl_.enum_variants;
        if (__ring_m16._tag === "some") {
          const variants = __ring_m16._0;
          codegen_ctx$emit(ctx, `switch (self.${hir$ENUM_TAG_FIELD}) {`);
          codegen_ctx$push_indent(ctx);
          const __ring_iter_9 = __List_Iterable.iter(variants);
          while (true) {
            const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
            if (__ring_next_9._tag === "none") break;
            const v = __ring_next_9._0;
            if ((List_len(v.fields) === 0)) {
              codegen_ctx$emit(ctx, `case "${v.name}": return "${v.name}";`);
            } else {
              if (v.has_named_fields) {
                let parts = [];
                const __ring_iter_10 = __List_Iterable.iter(v.fields);
                while (true) {
                  const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
                  if (__ring_next_10._tag === "none") break;
                  const f = __ring_next_10._0;
                  const accessor = field_accessor(v, f);
                  const val = gen_field_debug(`self.${accessor}`, f);
                  List_push(parts, `"${f.name}: " + ${val}`);
                }
                const joined = List_join(parts, " + \", \" + ");
                codegen_ctx$emit(ctx, `case "${v.name}": return "${v.name} { " + ${joined} + " }";`);
              } else {
                let parts = [];
                const __ring_iter_11 = __List_Iterable.iter(v.fields);
                while (true) {
                  const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
                  if (__ring_next_11._tag === "none") break;
                  const f = __ring_next_11._0;
                  const accessor = field_accessor(v, f);
                  List_push(parts, gen_field_debug(`self.${accessor}`, f));
                }
                const joined = List_join(parts, " + \", \" + ");
                codegen_ctx$emit(ctx, `case "${v.name}": return "${v.name}(" + ${joined} + ")";`);
              }
            }
          }
          codegen_ctx$emit(ctx, `default: return self.${hir$ENUM_TAG_FIELD};`);
          codegen_ctx$pop_indent(ctx);
          codegen_ctx$emit(ctx, "}");
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      break __ring_match14;
    }
    __match_fail(__ring_m14);
  }
  codegen_ctx$pop_indent(ctx);
  codegen_ctx$emit(ctx, "}");
  const dict_name = hir$trait_dict_name(name, "Debug");
  return codegen_ctx$emit(ctx, `const ${dict_name} = { debug: ${fn_name} };`);
}

function gen_action_eq(left, right, action) {
  __ring_match17: {
    const __ring_m17 = action;
    if (__ring_m17._tag === "Identity") {
      return `(${left} === ${right})`;
      break __ring_match17;
    }
    if (__ring_m17._tag === "Call") {
      const dict_name = __ring_m17.dict_name; const extra_dicts = __ring_m17.extra_dicts;
      const extra = extra_dicts_str(extra_dicts);
      return `${dict_name}.eq(${left}, ${right}${extra})`;
      break __ring_match17;
    }
    if (__ring_m17._tag === "Tuple") {
      const element_actions = __ring_m17.element_actions;
      if ((List_len(element_actions) === 0)) {
        return "true";
      } else {
        let parts = [];
        const __ring_end12 = List_len(element_actions);
        for (let i = 0; i < __ring_end12; i++) {
          __ring_match18: {
            const __ring_m18 = List_get(element_actions, i);
            if (__ring_m18._tag === "some") {
              const ea = __ring_m18._0;
              const el = `${left}[${i}]`;
              const er = `${right}[${i}]`;
              List_push(parts, gen_action_eq(el, er, ea));
              break __ring_match18;
            }
            if (__ring_m18._tag === "none") {
              break __ring_match18;
            }
            __match_fail(__ring_m18);
          }
        }
        return `(${List_join(parts, " && ")})`;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "FnLiteral") {
      return panic("unreachable: FnLiteral in Eq derive");
      break __ring_match17;
    }
    __match_fail(__ring_m17);
  }
}

function gen_field_eq(left, right, field) {
  return gen_action_eq(left, right, field.action);
}

function variants_have_fields(variants) {
  let result = false;
  const __ring_iter_13 = __List_Iterable.iter(variants);
  while (true) {
    const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
    if (__ring_next_13._tag === "none") break;
    const v = __ring_next_13._0;
    if ((List_len(v.fields) > 0)) {
      result = true;
    }
  }
  return result;
}

function emit_derived_eq(ctx, impl_) {
  const name = codegen_ctx$qualify(ctx, impl_.type_name);
  const dict_base = hir$trait_dict_name(name, "Eq");
  const fn_name = `${dict_base}_eq`;
  const dict_params = collect_dict_params(impl_, "Eq");
  let all_params_list = ["self", "other"];
  List_extend(all_params_list, dict_params);
  const all_params = List_join(all_params_list, ", ");
  codegen_ctx$emit(ctx, `function ${fn_name}(${all_params}) {`);
  codegen_ctx$push_indent(ctx);
  __ring_match19: {
    const __ring_m19 = impl_.type_kind;
    if (__ring_m19._tag === "StructKind") {
      __ring_match20: {
        const __ring_m20 = impl_.struct_fields;
        if (__ring_m20._tag === "some") {
          const fields = __ring_m20._0;
          if ((List_len(fields) === 0)) {
            codegen_ctx$emit(ctx, "return true;");
          } else {
            let comps = [];
            const __ring_iter_14 = __List_Iterable.iter(fields);
            while (true) {
              const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
              if (__ring_next_14._tag === "none") break;
              const f = __ring_next_14._0;
              const left = `self.${codegen_ctx$safe_ident(f.name)}`;
              const right = `other.${codegen_ctx$safe_ident(f.name)}`;
              List_push(comps, gen_field_eq(left, right, f));
            }
            const joined = List_join(comps, " && ");
            codegen_ctx$emit(ctx, `return ${joined};`);
          }
          break __ring_match20;
        }
        if (__ring_m20._tag === "none") {
          break __ring_match20;
        }
        __match_fail(__ring_m20);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "EnumKind") {
      __ring_match21: {
        const __ring_m21 = impl_.enum_variants;
        if (__ring_m21._tag === "some") {
          const variants = __ring_m21._0;
          codegen_ctx$emit(ctx, `if (self.${hir$ENUM_TAG_FIELD} !== other.${hir$ENUM_TAG_FIELD}) return false;`);
          if (variants_have_fields(variants)) {
            codegen_ctx$emit(ctx, `switch (self.${hir$ENUM_TAG_FIELD}) {`);
            codegen_ctx$push_indent(ctx);
            const __ring_iter_15 = __List_Iterable.iter(variants);
            while (true) {
              const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
              if (__ring_next_15._tag === "none") break;
              const v = __ring_next_15._0;
              if ((List_len(v.fields) === 0)) {
                codegen_ctx$emit(ctx, `case "${v.name}": return true;`);
              } else {
                let feqs = [];
                const __ring_iter_16 = __List_Iterable.iter(v.fields);
                while (true) {
                  const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
                  if (__ring_next_16._tag === "none") break;
                  const f = __ring_next_16._0;
                  const accessor = field_accessor(v, f);
                  List_push(feqs, gen_field_eq(`self.${accessor}`, `other.${accessor}`, f));
                }
                const joined = List_join(feqs, " && ");
                codegen_ctx$emit(ctx, `case "${v.name}": return ${joined};`);
              }
            }
            codegen_ctx$emit(ctx, "default: return true;");
            codegen_ctx$pop_indent(ctx);
            codegen_ctx$emit(ctx, "}");
          } else {
            codegen_ctx$emit(ctx, "return true;");
          }
          break __ring_match21;
        }
        if (__ring_m21._tag === "none") {
          break __ring_match21;
        }
        __match_fail(__ring_m21);
      }
      break __ring_match19;
    }
    __match_fail(__ring_m19);
  }
  codegen_ctx$pop_indent(ctx);
  codegen_ctx$emit(ctx, "}");
  const dict_name = hir$trait_dict_name(name, "Eq");
  const params_str = List_join(all_params_list, ", ");
  return codegen_ctx$emit(ctx, `const ${dict_name} = { eq: ${fn_name}, ne: function(${all_params}) { return !${fn_name}(${params_str}); } };`);
}

function gen_action_cmp(left, right, action) {
  __ring_match22: {
    const __ring_m22 = action;
    if (__ring_m22._tag === "Identity") {
      return `(${left} < ${right} ? -1 : ${left} > ${right} ? 1 : 0)`;
      break __ring_match22;
    }
    if (__ring_m22._tag === "Call") {
      const dict_name = __ring_m22.dict_name; const extra_dicts = __ring_m22.extra_dicts;
      const extra = extra_dicts_str(extra_dicts);
      return `${dict_name}.cmp(${left}, ${right}${extra})`;
      break __ring_match22;
    }
    if (__ring_m22._tag === "Tuple") {
      const element_actions = __ring_m22.element_actions;
      if ((List_len(element_actions) === 0)) {
        return "0";
      } else {
        if ((List_len(element_actions) === 1)) {
          __ring_match23: {
            const __ring_m23 = List_get(element_actions, 0);
            if (__ring_m23._tag === "some") {
              const ea = __ring_m23._0;
              return gen_action_cmp(`${left}[0]`, `${right}[0]`, ea);
              break __ring_match23;
            }
            if (__ring_m23._tag === "none") {
              return "0";
              break __ring_match23;
            }
            __match_fail(__ring_m23);
          }
        } else {
          let body_parts = [];
          const __ring_end17 = List_len(element_actions);
          for (let i = 0; i < __ring_end17; i++) {
            __ring_match24: {
              const __ring_m24 = List_get(element_actions, i);
              if (__ring_m24._tag === "some") {
                const ea = __ring_m24._0;
                const cmp = gen_action_cmp(`${left}[${i}]`, `${right}[${i}]`, ea);
                if ((i < (List_len(element_actions) - 1))) {
                  List_push(body_parts, `c = ${cmp}; if (c !== 0) return c;`);
                } else {
                  List_push(body_parts, `return ${cmp};`);
                }
                break __ring_match24;
              }
              if (__ring_m24._tag === "none") {
                break __ring_match24;
              }
              __match_fail(__ring_m24);
            }
          }
          return `(function() { var c; ${List_join(body_parts, " ")} })()`;
        }
      }
      break __ring_match22;
    }
    if (__ring_m22._tag === "FnLiteral") {
      return panic("unreachable: FnLiteral in Ord derive");
      break __ring_match22;
    }
    __match_fail(__ring_m22);
  }
}

function gen_field_cmp(left, right, field) {
  return gen_action_cmp(left, right, field.action);
}

function emit_derived_ord(ctx, impl_) {
  const name = codegen_ctx$qualify(ctx, impl_.type_name);
  const dict_base = hir$trait_dict_name(name, "Ord");
  const fn_name = `${dict_base}_cmp`;
  const dict_params = collect_dict_params(impl_, "Ord");
  let all_list = ["self", "other"];
  List_extend(all_list, dict_params);
  const all_params = List_join(all_list, ", ");
  __ring_match25: {
    const __ring_m25 = impl_.type_kind;
    if (__ring_m25._tag === "EnumKind") {
      __ring_match26: {
        const __ring_m26 = impl_.enum_variants;
        if (__ring_m26._tag === "some") {
          const variants = __ring_m26._0;
          let tag_entries = [];
          const __ring_end18 = List_len(variants);
          for (let i = 0; i < __ring_end18; i++) {
            __ring_match27: {
              const __ring_m27 = List_get(variants, i);
              if (__ring_m27._tag === "some") {
                const v = __ring_m27._0;
                List_push(tag_entries, `"${v.name}": ${i}`);
                break __ring_match27;
              }
              if (__ring_m27._tag === "none") {
                break __ring_match27;
              }
              __match_fail(__ring_m27);
            }
          }
          const joined = List_join(tag_entries, ", ");
          codegen_ctx$emit(ctx, `const __${name}_tag_order = { ${joined} };`);
          break __ring_match26;
        }
        if (__ring_m26._tag === "none") {
          break __ring_match26;
        }
        __match_fail(__ring_m26);
      }
      break __ring_match25;
    }
    break __ring_match25;
  }
  codegen_ctx$emit(ctx, `function ${fn_name}(${all_params}) {`);
  codegen_ctx$push_indent(ctx);
  __ring_match28: {
    const __ring_m28 = impl_.type_kind;
    if (__ring_m28._tag === "StructKind") {
      __ring_match29: {
        const __ring_m29 = impl_.struct_fields;
        if (__ring_m29._tag === "some") {
          const fields = __ring_m29._0;
          if ((List_len(fields) === 0)) {
            codegen_ctx$emit(ctx, "return 0;");
          } else {
            codegen_ctx$emit(ctx, "var c;");
            const __ring_end19 = List_len(fields);
            for (let i = 0; i < __ring_end19; i++) {
              __ring_match30: {
                const __ring_m30 = List_get(fields, i);
                if (__ring_m30._tag === "some") {
                  const f = __ring_m30._0;
                  const left = `self.${codegen_ctx$safe_ident(f.name)}`;
                  const right = `other.${codegen_ctx$safe_ident(f.name)}`;
                  const cmp = gen_field_cmp(left, right, f);
                  if ((i < (List_len(fields) - 1))) {
                    codegen_ctx$emit(ctx, `c = ${cmp};`);
                    codegen_ctx$emit(ctx, "if (c !== 0) return c;");
                  } else {
                    codegen_ctx$emit(ctx, `return ${cmp};`);
                  }
                  break __ring_match30;
                }
                if (__ring_m30._tag === "none") {
                  break __ring_match30;
                }
                __match_fail(__ring_m30);
              }
            }
          }
          break __ring_match29;
        }
        if (__ring_m29._tag === "none") {
          break __ring_match29;
        }
        __match_fail(__ring_m29);
      }
      break __ring_match28;
    }
    if (__ring_m28._tag === "EnumKind") {
      __ring_match31: {
        const __ring_m31 = impl_.enum_variants;
        if (__ring_m31._tag === "some") {
          const variants = __ring_m31._0;
          codegen_ctx$emit(ctx, `var t1 = __${name}_tag_order[self.${hir$ENUM_TAG_FIELD}];`);
          codegen_ctx$emit(ctx, `var t2 = __${name}_tag_order[other.${hir$ENUM_TAG_FIELD}];`);
          codegen_ctx$emit(ctx, "if (t1 !== t2) return (t1 < t2 ? -1 : 1);");
          if (variants_have_fields(variants)) {
            codegen_ctx$emit(ctx, `switch (self.${hir$ENUM_TAG_FIELD}) {`);
            codegen_ctx$push_indent(ctx);
            const __ring_iter_20 = __List_Iterable.iter(variants);
            while (true) {
              const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
              if (__ring_next_20._tag === "none") break;
              const v = __ring_next_20._0;
              if ((List_len(v.fields) === 0)) {
              } else {
                if ((List_len(v.fields) === 1)) {
                  __ring_match32: {
                    const __ring_m32 = List_get(v.fields, 0);
                    if (__ring_m32._tag === "some") {
                      const f = __ring_m32._0;
                      const accessor = field_accessor(v, f);
                      const cmp = gen_field_cmp(`self.${accessor}`, `other.${accessor}`, f);
                      codegen_ctx$emit(ctx, `case "${v.name}": return ${cmp};`);
                      break __ring_match32;
                    }
                    if (__ring_m32._tag === "none") {
                      break __ring_match32;
                    }
                    __match_fail(__ring_m32);
                  }
                } else {
                  codegen_ctx$emit(ctx, `case "${v.name}": {`);
                  codegen_ctx$push_indent(ctx);
                  codegen_ctx$emit(ctx, "var c;");
                  const __ring_end21 = List_len(v.fields);
                  for (let i = 0; i < __ring_end21; i++) {
                    __ring_match33: {
                      const __ring_m33 = List_get(v.fields, i);
                      if (__ring_m33._tag === "some") {
                        const f = __ring_m33._0;
                        const accessor = field_accessor(v, f);
                        const cmp = gen_field_cmp(`self.${accessor}`, `other.${accessor}`, f);
                        if ((i < (List_len(v.fields) - 1))) {
                          codegen_ctx$emit(ctx, `c = ${cmp};`);
                          codegen_ctx$emit(ctx, "if (c !== 0) return c;");
                        } else {
                          codegen_ctx$emit(ctx, `return ${cmp};`);
                        }
                        break __ring_match33;
                      }
                      if (__ring_m33._tag === "none") {
                        break __ring_match33;
                      }
                      __match_fail(__ring_m33);
                    }
                  }
                  codegen_ctx$pop_indent(ctx);
                  codegen_ctx$emit(ctx, "}");
                }
              }
            }
            codegen_ctx$emit(ctx, "default: return 0;");
            codegen_ctx$pop_indent(ctx);
            codegen_ctx$emit(ctx, "}");
          } else {
            codegen_ctx$emit(ctx, "return 0;");
          }
          break __ring_match31;
        }
        if (__ring_m31._tag === "none") {
          break __ring_match31;
        }
        __match_fail(__ring_m31);
      }
      break __ring_match28;
    }
    __match_fail(__ring_m28);
  }
  codegen_ctx$pop_indent(ctx);
  codegen_ctx$emit(ctx, "}");
  const dict_name = hir$trait_dict_name(name, "Ord");
  return codegen_ctx$emit(ctx, `const ${dict_name} = { cmp: ${fn_name} };`);
}

function emit_derived_impl(ctx, impl_) {
  __ring_match34: {
    const __ring_m34 = impl_.trait_name;
    if (__ring_m34 === "Eq") {
      return emit_derived_eq(ctx, impl_);
      break __ring_match34;
    }
    if (__ring_m34 === "Clone") {
      return emit_derived_clone(ctx, impl_);
      break __ring_match34;
    }
    if (__ring_m34 === "Ord") {
      return emit_derived_ord(ctx, impl_);
      break __ring_match34;
    }
    if (__ring_m34 === "Debug") {
      return emit_derived_debug(ctx, impl_);
      break __ring_match34;
    }
    break __ring_match34;
  }
}

function get_derived_method_names(trait_name) {
  __ring_match35: {
    const __ring_m35 = trait_name;
    if (__ring_m35 === "Eq") {
      return ["eq", "ne"];
      break __ring_match35;
    }
    if (__ring_m35 === "Clone") {
      return ["clone"];
      break __ring_match35;
    }
    if (__ring_m35 === "Debug") {
      return ["debug"];
      break __ring_match35;
    }
    if (__ring_m35 === "Ord") {
      return ["cmp"];
      break __ring_match35;
    }
    let e = [];
    return e;
    break __ring_match35;
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


export { get_derived_method_names, emit_derived_impl };