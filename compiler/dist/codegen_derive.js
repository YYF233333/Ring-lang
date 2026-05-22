import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_contains, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { variant_js_name as hir$variant_js_name, trait_dict_name as hir$trait_dict_name, evidence_param_name as hir$evidence_param_name, trait_bound_param_name as hir$trait_bound_param_name, default_method_self_name as hir$default_method_self_name, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, hexpr_type as hir$hexpr_type, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_CELL as hir$BUILTIN_CELL, CELL_METHODS as hir$CELL_METHODS, STR_METHODS as hir$STR_METHODS, INT_METHODS as hir$INT_METHODS, FLOAT_METHODS as hir$FLOAT_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, SET_HOF_METHODS as hir$SET_HOF_METHODS, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, HParam as hir$HParam, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, DictDispatchInfo as hir$DictDispatchInfo, HStructFieldInit as hir$HStructFieldInit, HMatchArm as hir$HMatchArm, HEffectHandler as hir$HEffectHandler, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStructField as hir$HStructField, HEnumVariant as hir$HEnumVariant, HEffectOp as hir$HEffectOp, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, HSigMember as hir$HSigMember, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, DerivedField as hir$DerivedField, DerivedVariant as hir$DerivedVariant, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, DerivedImpl as hir$DerivedImpl, HProgram as hir$HProgram, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __TraitBound_Eq as hir$__TraitBound_Eq, __TypeKind_Eq as hir$__TypeKind_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __FieldAction_Clone as hir$__FieldAction_Clone, __TypeKind_Clone as hir$__TypeKind_Clone, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __TraitBound_Ord as hir$__TraitBound_Ord, __TypeKind_Ord as hir$__TypeKind_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __FieldAction_Debug as hir$__FieldAction_Debug, __TypeKind_Debug as hir$__TypeKind_Debug, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DerivedImpl_Debug as hir$__DerivedImpl_Debug } from "./hir.js";
import { safe_ident as codegen_ctx$safe_ident, new_codegen_ctx as codegen_ctx$new_codegen_ctx, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, push_indent as codegen_ctx$push_indent, pop_indent as codegen_ctx$pop_indent, qualify as codegen_ctx$qualify, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";

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

function get_derived_method_names(trait_name) {
  __ring_match0: {
    const __ring_m0 = trait_name;
    if (__ring_m0 === "Eq") {
      return ["eq", "ne"];
      break __ring_match0;
    }
    if (__ring_m0 === "Clone") {
      return ["clone"];
      break __ring_match0;
    }
    if (__ring_m0 === "Debug") {
      return ["debug"];
      break __ring_match0;
    }
    if (__ring_m0 === "Ord") {
      return ["cmp"];
      break __ring_match0;
    }
    let e = [""];
    List_clear(e);
    return e;
    break __ring_match0;
  }
}

function emit_derived_impl(ctx, impl_) {
  __ring_match1: {
    const __ring_m1 = impl_.trait_name;
    if (__ring_m1 === "Eq") {
      return emit_derived_eq(ctx, impl_);
      break __ring_match1;
    }
    if (__ring_m1 === "Clone") {
      return emit_derived_clone(ctx, impl_);
      break __ring_match1;
    }
    if (__ring_m1 === "Ord") {
      return emit_derived_ord(ctx, impl_);
      break __ring_match1;
    }
    if (__ring_m1 === "Debug") {
      return emit_derived_debug(ctx, impl_);
      break __ring_match1;
    }
    break __ring_match1;
  }
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
  __ring_match2: {
    const __ring_m2 = impl_.type_kind;
    if (__ring_m2._tag === "StructKind") {
      __ring_match3: {
        const __ring_m3 = impl_.struct_fields;
        if (__ring_m3._tag === "some") {
          const fields = __ring_m3._0;
          if ((List_len(fields) === 0)) {
            codegen_ctx$emit(ctx, "return true;");
          } else {
            let comps = [""];
            List_clear(comps);
            for (const f of fields) {
              const left = `self.${codegen_ctx$safe_ident(f.name)}`;
              const right = `other.${codegen_ctx$safe_ident(f.name)}`;
              List_push(comps, gen_field_eq(left, right, f));
            }
            const joined = List_join(comps, " && ");
            codegen_ctx$emit(ctx, `return ${joined};`);
          }
          break __ring_match3;
        }
        if (__ring_m3._tag === "none") {
          break __ring_match3;
        }
        __match_fail(__ring_m3);
      }
      break __ring_match2;
    }
    if (__ring_m2._tag === "EnumKind") {
      __ring_match4: {
        const __ring_m4 = impl_.enum_variants;
        if (__ring_m4._tag === "some") {
          const variants = __ring_m4._0;
          codegen_ctx$emit(ctx, `if (self.${hir$ENUM_TAG_FIELD} !== other.${hir$ENUM_TAG_FIELD}) return false;`);
          if (variants_have_fields(variants)) {
            codegen_ctx$emit(ctx, `switch (self.${hir$ENUM_TAG_FIELD}) {`);
            codegen_ctx$push_indent(ctx);
            for (const v of variants) {
              if ((List_len(v.fields) === 0)) {
                codegen_ctx$emit(ctx, `case "${v.name}": return true;`);
              } else {
                let feqs = [""];
                List_clear(feqs);
                for (const f of v.fields) {
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
          break __ring_match4;
        }
        if (__ring_m4._tag === "none") {
          break __ring_match4;
        }
        __match_fail(__ring_m4);
      }
      break __ring_match2;
    }
    __match_fail(__ring_m2);
  }
  codegen_ctx$pop_indent(ctx);
  codegen_ctx$emit(ctx, "}");
  const dict_name = hir$trait_dict_name(name, "Eq");
  const params_str = List_join(all_params_list, ", ");
  return codegen_ctx$emit(ctx, `const ${dict_name} = { eq: ${fn_name}, ne: function(${all_params}) { return !${fn_name}(${params_str}); } };`);
}

function gen_field_eq(left, right, field) {
  __ring_match5: {
    const __ring_m5 = field.action;
    if (__ring_m5._tag === "Identity") {
      return `(${left} === ${right})`;
      break __ring_match5;
    }
    if (__ring_m5._tag === "Call") {
      const dict_name = __ring_m5.dict_name; const extra_dicts = __ring_m5.extra_dicts;
      const extra = extra_dicts_str(extra_dicts);
      return `${dict_name}.eq(${left}, ${right}${extra})`;
      break __ring_match5;
    }
    __match_fail(__ring_m5);
  }
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
  __ring_match6: {
    const __ring_m6 = impl_.type_kind;
    if (__ring_m6._tag === "StructKind") {
      __ring_match7: {
        const __ring_m7 = impl_.struct_fields;
        if (__ring_m7._tag === "some") {
          const fields = __ring_m7._0;
          let args = [""];
          List_clear(args);
          for (const f of fields) {
            List_push(args, gen_field_clone(`self.${codegen_ctx$safe_ident(f.name)}`, f));
          }
          const joined = List_join(args, ", ");
          codegen_ctx$emit(ctx, `return new ${name}(${joined});`);
          break __ring_match7;
        }
        if (__ring_m7._tag === "none") {
          break __ring_match7;
        }
        __match_fail(__ring_m7);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "EnumKind") {
      __ring_match8: {
        const __ring_m8 = impl_.enum_variants;
        if (__ring_m8._tag === "some") {
          const variants = __ring_m8._0;
          codegen_ctx$emit(ctx, `switch (self.${hir$ENUM_TAG_FIELD}) {`);
          codegen_ctx$push_indent(ctx);
          for (const v of variants) {
            if ((List_len(v.fields) === 0)) {
              codegen_ctx$emit(ctx, `case "${v.name}": return ${name}_${v.name};`);
            } else {
              let args = [""];
              List_clear(args);
              for (const f of v.fields) {
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
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
  codegen_ctx$pop_indent(ctx);
  codegen_ctx$emit(ctx, "}");
  const dict_name = hir$trait_dict_name(name, "Clone");
  return codegen_ctx$emit(ctx, `const ${dict_name} = { clone: ${fn_name} };`);
}

function gen_field_clone(expr, field) {
  __ring_match9: {
    const __ring_m9 = field.action;
    if (__ring_m9._tag === "Identity") {
      return expr;
      break __ring_match9;
    }
    if (__ring_m9._tag === "Call") {
      const dict_name = __ring_m9.dict_name; const extra_dicts = __ring_m9.extra_dicts;
      const extra = extra_dicts_str(extra_dicts);
      return `${dict_name}.clone(${expr}${extra})`;
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
}

function emit_derived_ord(ctx, impl_) {
  const name = codegen_ctx$qualify(ctx, impl_.type_name);
  const dict_base = hir$trait_dict_name(name, "Ord");
  const fn_name = `${dict_base}_cmp`;
  const dict_params = collect_dict_params(impl_, "Ord");
  let all_list = ["self", "other"];
  List_extend(all_list, dict_params);
  const all_params = List_join(all_list, ", ");
  __ring_match10: {
    const __ring_m10 = impl_.type_kind;
    if (__ring_m10._tag === "EnumKind") {
      __ring_match11: {
        const __ring_m11 = impl_.enum_variants;
        if (__ring_m11._tag === "some") {
          const variants = __ring_m11._0;
          let tag_entries = [""];
          List_clear(tag_entries);
          const __ring_end0 = List_len(variants);
          for (let i = 0; i < __ring_end0; i++) {
            __ring_match12: {
              const __ring_m12 = List_get(variants, i);
              if (__ring_m12._tag === "some") {
                const v = __ring_m12._0;
                List_push(tag_entries, `"${v.name}": ${i}`);
                break __ring_match12;
              }
              if (__ring_m12._tag === "none") {
                break __ring_match12;
              }
              __match_fail(__ring_m12);
            }
          }
          const joined = List_join(tag_entries, ", ");
          codegen_ctx$emit(ctx, `const __${name}_tag_order = { ${joined} };`);
          break __ring_match11;
        }
        if (__ring_m11._tag === "none") {
          break __ring_match11;
        }
        __match_fail(__ring_m11);
      }
      break __ring_match10;
    }
    break __ring_match10;
  }
  codegen_ctx$emit(ctx, `function ${fn_name}(${all_params}) {`);
  codegen_ctx$push_indent(ctx);
  __ring_match13: {
    const __ring_m13 = impl_.type_kind;
    if (__ring_m13._tag === "StructKind") {
      __ring_match14: {
        const __ring_m14 = impl_.struct_fields;
        if (__ring_m14._tag === "some") {
          const fields = __ring_m14._0;
          if ((List_len(fields) === 0)) {
            codegen_ctx$emit(ctx, "return 0;");
          } else {
            codegen_ctx$emit(ctx, "var c;");
            const __ring_end1 = List_len(fields);
            for (let i = 0; i < __ring_end1; i++) {
              __ring_match15: {
                const __ring_m15 = List_get(fields, i);
                if (__ring_m15._tag === "some") {
                  const f = __ring_m15._0;
                  const left = `self.${codegen_ctx$safe_ident(f.name)}`;
                  const right = `other.${codegen_ctx$safe_ident(f.name)}`;
                  const cmp = gen_field_cmp(left, right, f);
                  if ((i < (List_len(fields) - 1))) {
                    codegen_ctx$emit(ctx, `c = ${cmp};`);
                    codegen_ctx$emit(ctx, "if (c !== 0) return c;");
                  } else {
                    codegen_ctx$emit(ctx, `return ${cmp};`);
                  }
                  break __ring_match15;
                }
                if (__ring_m15._tag === "none") {
                  break __ring_match15;
                }
                __match_fail(__ring_m15);
              }
            }
          }
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      break __ring_match13;
    }
    if (__ring_m13._tag === "EnumKind") {
      __ring_match16: {
        const __ring_m16 = impl_.enum_variants;
        if (__ring_m16._tag === "some") {
          const variants = __ring_m16._0;
          codegen_ctx$emit(ctx, `var t1 = __${name}_tag_order[self.${hir$ENUM_TAG_FIELD}];`);
          codegen_ctx$emit(ctx, `var t2 = __${name}_tag_order[other.${hir$ENUM_TAG_FIELD}];`);
          codegen_ctx$emit(ctx, "if (t1 !== t2) return (t1 < t2 ? -1 : 1);");
          if (variants_have_fields(variants)) {
            codegen_ctx$emit(ctx, `switch (self.${hir$ENUM_TAG_FIELD}) {`);
            codegen_ctx$push_indent(ctx);
            for (const v of variants) {
              if ((List_len(v.fields) === 0)) {
              } else {
                if ((List_len(v.fields) === 1)) {
                  __ring_match17: {
                    const __ring_m17 = List_get(v.fields, 0);
                    if (__ring_m17._tag === "some") {
                      const f = __ring_m17._0;
                      const accessor = field_accessor(v, f);
                      const cmp = gen_field_cmp(`self.${accessor}`, `other.${accessor}`, f);
                      codegen_ctx$emit(ctx, `case "${v.name}": return ${cmp};`);
                      break __ring_match17;
                    }
                    if (__ring_m17._tag === "none") {
                      break __ring_match17;
                    }
                    __match_fail(__ring_m17);
                  }
                } else {
                  codegen_ctx$emit(ctx, `case "${v.name}": {`);
                  codegen_ctx$push_indent(ctx);
                  codegen_ctx$emit(ctx, "var c;");
                  const __ring_end2 = List_len(v.fields);
                  for (let i = 0; i < __ring_end2; i++) {
                    __ring_match18: {
                      const __ring_m18 = List_get(v.fields, i);
                      if (__ring_m18._tag === "some") {
                        const f = __ring_m18._0;
                        const accessor = field_accessor(v, f);
                        const cmp = gen_field_cmp(`self.${accessor}`, `other.${accessor}`, f);
                        if ((i < (List_len(v.fields) - 1))) {
                          codegen_ctx$emit(ctx, `c = ${cmp};`);
                          codegen_ctx$emit(ctx, "if (c !== 0) return c;");
                        } else {
                          codegen_ctx$emit(ctx, `return ${cmp};`);
                        }
                        break __ring_match18;
                      }
                      if (__ring_m18._tag === "none") {
                        break __ring_match18;
                      }
                      __match_fail(__ring_m18);
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
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
  codegen_ctx$pop_indent(ctx);
  codegen_ctx$emit(ctx, "}");
  const dict_name = hir$trait_dict_name(name, "Ord");
  return codegen_ctx$emit(ctx, `const ${dict_name} = { cmp: ${fn_name} };`);
}

function gen_field_cmp(left, right, field) {
  __ring_match19: {
    const __ring_m19 = field.action;
    if (__ring_m19._tag === "Identity") {
      return `(${left} < ${right} ? -1 : ${left} > ${right} ? 1 : 0)`;
      break __ring_match19;
    }
    if (__ring_m19._tag === "Call") {
      const dict_name = __ring_m19.dict_name; const extra_dicts = __ring_m19.extra_dicts;
      const extra = extra_dicts_str(extra_dicts);
      return `${dict_name}.cmp(${left}, ${right}${extra})`;
      break __ring_match19;
    }
    __match_fail(__ring_m19);
  }
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
  __ring_match20: {
    const __ring_m20 = impl_.type_kind;
    if (__ring_m20._tag === "StructKind") {
      __ring_match21: {
        const __ring_m21 = impl_.struct_fields;
        if (__ring_m21._tag === "some") {
          const fields = __ring_m21._0;
          if ((List_len(fields) === 0)) {
            codegen_ctx$emit(ctx, `return "${impl_.type_name}";`);
          } else {
            let parts = [""];
            List_clear(parts);
            for (const f of fields) {
              const val = gen_field_debug(`self.${codegen_ctx$safe_ident(f.name)}`, f);
              List_push(parts, `"${f.name}: " + ${val}`);
            }
            const joined = List_join(parts, " + \", \" + ");
            codegen_ctx$emit(ctx, `return "${impl_.type_name} { " + ${joined} + " }";`);
          }
          break __ring_match21;
        }
        if (__ring_m21._tag === "none") {
          break __ring_match21;
        }
        __match_fail(__ring_m21);
      }
      break __ring_match20;
    }
    if (__ring_m20._tag === "EnumKind") {
      __ring_match22: {
        const __ring_m22 = impl_.enum_variants;
        if (__ring_m22._tag === "some") {
          const variants = __ring_m22._0;
          codegen_ctx$emit(ctx, `switch (self.${hir$ENUM_TAG_FIELD}) {`);
          codegen_ctx$push_indent(ctx);
          for (const v of variants) {
            if ((List_len(v.fields) === 0)) {
              codegen_ctx$emit(ctx, `case "${v.name}": return "${v.name}";`);
            } else {
              if (v.has_named_fields) {
                let parts = [""];
                List_clear(parts);
                for (const f of v.fields) {
                  const accessor = field_accessor(v, f);
                  const val = gen_field_debug(`self.${accessor}`, f);
                  List_push(parts, `"${f.name}: " + ${val}`);
                }
                const joined = List_join(parts, " + \", \" + ");
                codegen_ctx$emit(ctx, `case "${v.name}": return "${v.name} { " + ${joined} + " }";`);
              } else {
                let parts = [""];
                List_clear(parts);
                for (const f of v.fields) {
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
          break __ring_match22;
        }
        if (__ring_m22._tag === "none") {
          break __ring_match22;
        }
        __match_fail(__ring_m22);
      }
      break __ring_match20;
    }
    __match_fail(__ring_m20);
  }
  codegen_ctx$pop_indent(ctx);
  codegen_ctx$emit(ctx, "}");
  const dict_name = hir$trait_dict_name(name, "Debug");
  return codegen_ctx$emit(ctx, `const ${dict_name} = { debug: ${fn_name} };`);
}

function gen_field_debug(expr, field) {
  __ring_match23: {
    const __ring_m23 = field.action;
    if (__ring_m23._tag === "Identity") {
      return `String(${expr})`;
      break __ring_match23;
    }
    if (__ring_m23._tag === "Call") {
      const dict_name = __ring_m23.dict_name; const extra_dicts = __ring_m23.extra_dicts;
      const extra = extra_dicts_str(extra_dicts);
      return `${dict_name}.debug(${expr}${extra})`;
      break __ring_match23;
    }
    __match_fail(__ring_m23);
  }
}

function field_accessor(v, f) {
  if (v.has_named_fields) {
    return codegen_ctx$safe_ident(f.name);
  } else {
    __ring_match24: {
      const __ring_m24 = f.positional_index;
      if (__ring_m24._tag === "some") {
        const pi = __ring_m24._0;
        return `_${pi}`;
        break __ring_match24;
      }
      if (__ring_m24._tag === "none") {
        return f.name;
        break __ring_match24;
      }
      __match_fail(__ring_m24);
    }
  }
}

function collect_dict_params(impl_, trait_name) {
  let params = [""];
  List_clear(params);
  for (const b of impl_.bounds) {
    if ((b.trait_name === trait_name)) {
      List_push(params, hir$trait_bound_param_name(b.type_param, b.trait_name));
    }
  }
  return params;
}

function variants_have_fields(variants) {
  let result = false;
  for (const v of variants) {
    if ((List_len(v.fields) > 0)) {
      result = true;
    }
  }
  return result;
}

function extra_dicts_str(dicts) {
  if ((List_len(dicts) > 0)) {
    const joined = List_join(dicts, ", ");
    return `, ${joined}`;
  } else {
    return "";
  }
}


export { get_derived_method_names, emit_derived_impl };