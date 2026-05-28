import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
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


















class StructFieldInfo {
  constructor(field_names, llvm_type) {
    this.field_names = field_names;
    this.llvm_type = llvm_type;
  }
}

class EnumVariantInfo {
  constructor(tag, field_count) {
    this.tag = tag;
    this.field_count = field_count;
  }
}

class EnumTypeInfo {
  constructor(variants, max_fields, llvm_type) {
    this.variants = variants;
    this.max_fields = max_fields;
    this.llvm_type = llvm_type;
  }
}

class LlvmCtx {
  constructor(context, module, builder, target_machine, ptr_type, i64_type, i32_type, i8_type, i1_type, void_type, double_type, named_values, functions, fn_types, struct_types, enum_types, rt_fns, rt_fn_types, local_fn_effects, fn_evidence_params, dict_globals, trait_method_order, module_prefix, imports_map, local_names, tmp_counter, lambda_counter, current_fn, loop_break_bb, loop_continue_bb) {
    this.context = context;
    this.module = module;
    this.builder = builder;
    this.target_machine = target_machine;
    this.ptr_type = ptr_type;
    this.i64_type = i64_type;
    this.i32_type = i32_type;
    this.i8_type = i8_type;
    this.i1_type = i1_type;
    this.void_type = void_type;
    this.double_type = double_type;
    this.named_values = named_values;
    this.functions = functions;
    this.fn_types = fn_types;
    this.struct_types = struct_types;
    this.enum_types = enum_types;
    this.rt_fns = rt_fns;
    this.rt_fn_types = rt_fn_types;
    this.local_fn_effects = local_fn_effects;
    this.fn_evidence_params = fn_evidence_params;
    this.dict_globals = dict_globals;
    this.trait_method_order = trait_method_order;
    this.module_prefix = module_prefix;
    this.imports_map = imports_map;
    this.local_names = local_names;
    this.tmp_counter = tmp_counter;
    this.lambda_counter = lambda_counter;
    this.current_fn = current_fn;
    this.loop_break_bb = loop_break_bb;
    this.loop_continue_bb = loop_continue_bb;
  }
}

function llvm_mangle_fn(name) {
  return `ring_${name}`;
}

function llvm_mangle_fn_with_prefix(prefix, name) {
  return `ring_${prefix}$$_${name}`;
}

function llvm_mangle_method(type_name, method_name) {
  return `ring_${type_name}_${method_name}`;
}

function llvm_resolve_fn(ctx, name) {
  __ring_match6: {
    const __ring_m6 = _Map_get(ctx.imports_map, name);
    if (__ring_m6._tag === "some") {
      const qualified = __ring_m6._0;
      return qualified;
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      __ring_match7: {
        const __ring_m7 = ctx.module_prefix;
        if (__ring_m7._tag === "some") {
          const prefix = __ring_m7._0;
          if (_Set_contains(ctx.local_names, name, __Str_Eq)) {
            return llvm_mangle_fn_with_prefix(prefix, name);
          } else {
            return llvm_mangle_fn(name);
          }
          break __ring_match7;
        }
        if (__ring_m7._tag === "none") {
          return llvm_mangle_fn(name);
          break __ring_match7;
        }
        __match_fail(__ring_m7);
      }
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function llvm_resolve_method(ctx, type_name, method_name) {
  return llvm_mangle_method(type_name, method_name);
}

function fresh_name(ctx, prefix) {
  const n = ctx.tmp_counter;
  ctx.tmp_counter = (ctx.tmp_counter + 1);
  return `${prefix}${n}`;
}

function get_or_declare_runtime_fn(ctx, name, param_types, ret_type) {
  __ring_match8: {
    const __ring_m8 = _Map_get(ctx.rt_fns, name);
    if (__ring_m8._tag === "some") {
      const f = __ring_m8._0;
      return f;
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      const fn_ty = LLVMFunctionType(ret_type, param_types, 0);
      const fn_val = LLVMAddFunction(ctx.module, name, fn_ty);
      _Map_insert(ctx.rt_fns, name, fn_val);
      _Map_insert(ctx.rt_fn_types, name, fn_ty);
      return fn_val;
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
}

function get_rt_fn_type(ctx, name) {
  __ring_match9: {
    const __ring_m9 = _Map_get(ctx.rt_fn_types, name);
    if (__ring_m9._tag === "some") {
      const t = __ring_m9._0;
      return t;
      break __ring_match9;
    }
    if (__ring_m9._tag === "none") {
      return panic(`LLVM codegen: runtime function type not found: ${name}`);
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
}

function build_entry_alloca(ctx, ty, name) {
  const current_bb = LLVMGetInsertBlock(ctx.builder);
  const fn_val = LLVMGetBasicBlockParent(current_bb);
  const entry_bb = LLVMGetEntryBasicBlock(fn_val);
  const first_instr = LLVMGetFirstInstruction(entry_bb);
  if ((LLVMIsNullPtr(first_instr) === 0)) {
    LLVMPositionBuilderBefore(ctx.builder, first_instr);
  } else {
    LLVMPositionBuilderAtEnd(ctx.builder, entry_bb);
  }
  const alloca = LLVMBuildAlloca(ctx.builder, ty, name);
  LLVMPositionBuilderAtEnd(ctx.builder, current_bb);
  return alloca;
}

function __StringBuilder_Eq_eq(self, other) {
  return true;
}
const __StringBuilder_Eq = { eq: __StringBuilder_Eq_eq, ne: function(self, other) { return !__StringBuilder_Eq_eq(self, other); } };

function __LLVMContextRef_Eq_eq(self, other) {
  return true;
}
const __LLVMContextRef_Eq = { eq: __LLVMContextRef_Eq_eq, ne: function(self, other) { return !__LLVMContextRef_Eq_eq(self, other); } };

function __LLVMModuleRef_Eq_eq(self, other) {
  return true;
}
const __LLVMModuleRef_Eq = { eq: __LLVMModuleRef_Eq_eq, ne: function(self, other) { return !__LLVMModuleRef_Eq_eq(self, other); } };

function __LLVMBuilderRef_Eq_eq(self, other) {
  return true;
}
const __LLVMBuilderRef_Eq = { eq: __LLVMBuilderRef_Eq_eq, ne: function(self, other) { return !__LLVMBuilderRef_Eq_eq(self, other); } };

function __LLVMTypeRef_Eq_eq(self, other) {
  return true;
}
const __LLVMTypeRef_Eq = { eq: __LLVMTypeRef_Eq_eq, ne: function(self, other) { return !__LLVMTypeRef_Eq_eq(self, other); } };

function __LLVMValueRef_Eq_eq(self, other) {
  return true;
}
const __LLVMValueRef_Eq = { eq: __LLVMValueRef_Eq_eq, ne: function(self, other) { return !__LLVMValueRef_Eq_eq(self, other); } };

function __LLVMBasicBlockRef_Eq_eq(self, other) {
  return true;
}
const __LLVMBasicBlockRef_Eq = { eq: __LLVMBasicBlockRef_Eq_eq, ne: function(self, other) { return !__LLVMBasicBlockRef_Eq_eq(self, other); } };

function __LLVMTargetMachineRef_Eq_eq(self, other) {
  return true;
}
const __LLVMTargetMachineRef_Eq = { eq: __LLVMTargetMachineRef_Eq_eq, ne: function(self, other) { return !__LLVMTargetMachineRef_Eq_eq(self, other); } };

function __EnumVariantInfo_Eq_eq(self, other) {
  return (self.tag === other.tag) && (self.field_count === other.field_count);
}
const __EnumVariantInfo_Eq = { eq: __EnumVariantInfo_Eq_eq, ne: function(self, other) { return !__EnumVariantInfo_Eq_eq(self, other); } };

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

function __LLVMContextRef_Clone_clone(self) {
  return new LLVMContextRef();
}
const __LLVMContextRef_Clone = { clone: __LLVMContextRef_Clone_clone };

function __LLVMModuleRef_Clone_clone(self) {
  return new LLVMModuleRef();
}
const __LLVMModuleRef_Clone = { clone: __LLVMModuleRef_Clone_clone };

function __LLVMBuilderRef_Clone_clone(self) {
  return new LLVMBuilderRef();
}
const __LLVMBuilderRef_Clone = { clone: __LLVMBuilderRef_Clone_clone };

function __LLVMTypeRef_Clone_clone(self) {
  return new LLVMTypeRef();
}
const __LLVMTypeRef_Clone = { clone: __LLVMTypeRef_Clone_clone };

function __LLVMValueRef_Clone_clone(self) {
  return new LLVMValueRef();
}
const __LLVMValueRef_Clone = { clone: __LLVMValueRef_Clone_clone };

function __LLVMBasicBlockRef_Clone_clone(self) {
  return new LLVMBasicBlockRef();
}
const __LLVMBasicBlockRef_Clone = { clone: __LLVMBasicBlockRef_Clone_clone };

function __LLVMTargetMachineRef_Clone_clone(self) {
  return new LLVMTargetMachineRef();
}
const __LLVMTargetMachineRef_Clone = { clone: __LLVMTargetMachineRef_Clone_clone };

function __StructFieldInfo_Clone_clone(self) {
  return new StructFieldInfo(__List_Clone.clone(self.field_names, __Str_Clone), __LLVMTypeRef_Clone.clone(self.llvm_type));
}
const __StructFieldInfo_Clone = { clone: __StructFieldInfo_Clone_clone };

function __EnumVariantInfo_Clone_clone(self) {
  return new EnumVariantInfo(self.tag, self.field_count);
}
const __EnumVariantInfo_Clone = { clone: __EnumVariantInfo_Clone_clone };

function __EnumTypeInfo_Clone_clone(self) {
  return new EnumTypeInfo(__Map_Clone.clone(self.variants, __Str_Clone, __EnumVariantInfo_Clone), self.max_fields, __LLVMTypeRef_Clone.clone(self.llvm_type));
}
const __EnumTypeInfo_Clone = { clone: __EnumTypeInfo_Clone_clone };

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

function __LLVMContextRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMContextRef_Ord = { cmp: __LLVMContextRef_Ord_cmp };

function __LLVMModuleRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMModuleRef_Ord = { cmp: __LLVMModuleRef_Ord_cmp };

function __LLVMBuilderRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMBuilderRef_Ord = { cmp: __LLVMBuilderRef_Ord_cmp };

function __LLVMTypeRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMTypeRef_Ord = { cmp: __LLVMTypeRef_Ord_cmp };

function __LLVMValueRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMValueRef_Ord = { cmp: __LLVMValueRef_Ord_cmp };

function __LLVMBasicBlockRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMBasicBlockRef_Ord = { cmp: __LLVMBasicBlockRef_Ord_cmp };

function __LLVMTargetMachineRef_Ord_cmp(self, other) {
  return 0;
}
const __LLVMTargetMachineRef_Ord = { cmp: __LLVMTargetMachineRef_Ord_cmp };

function __EnumVariantInfo_Ord_cmp(self, other) {
  var c;
  c = (self.tag < other.tag ? -1 : self.tag > other.tag ? 1 : 0);
  if (c !== 0) return c;
  return (self.field_count < other.field_count ? -1 : self.field_count > other.field_count ? 1 : 0);
}
const __EnumVariantInfo_Ord = { cmp: __EnumVariantInfo_Ord_cmp };

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

function __LLVMContextRef_Debug_debug(self) {
  return "LLVMContextRef";
}
const __LLVMContextRef_Debug = { debug: __LLVMContextRef_Debug_debug };

function __LLVMModuleRef_Debug_debug(self) {
  return "LLVMModuleRef";
}
const __LLVMModuleRef_Debug = { debug: __LLVMModuleRef_Debug_debug };

function __LLVMBuilderRef_Debug_debug(self) {
  return "LLVMBuilderRef";
}
const __LLVMBuilderRef_Debug = { debug: __LLVMBuilderRef_Debug_debug };

function __LLVMTypeRef_Debug_debug(self) {
  return "LLVMTypeRef";
}
const __LLVMTypeRef_Debug = { debug: __LLVMTypeRef_Debug_debug };

function __LLVMValueRef_Debug_debug(self) {
  return "LLVMValueRef";
}
const __LLVMValueRef_Debug = { debug: __LLVMValueRef_Debug_debug };

function __LLVMBasicBlockRef_Debug_debug(self) {
  return "LLVMBasicBlockRef";
}
const __LLVMBasicBlockRef_Debug = { debug: __LLVMBasicBlockRef_Debug_debug };

function __LLVMTargetMachineRef_Debug_debug(self) {
  return "LLVMTargetMachineRef";
}
const __LLVMTargetMachineRef_Debug = { debug: __LLVMTargetMachineRef_Debug_debug };

function __StructFieldInfo_Debug_debug(self) {
  return "StructFieldInfo { " + "field_names: " + __List_Debug.debug(self.field_names, __Str_Debug) + ", " + "llvm_type: " + __LLVMTypeRef_Debug.debug(self.llvm_type) + " }";
}
const __StructFieldInfo_Debug = { debug: __StructFieldInfo_Debug_debug };

function __EnumVariantInfo_Debug_debug(self) {
  return "EnumVariantInfo { " + "tag: " + String(self.tag) + ", " + "field_count: " + String(self.field_count) + " }";
}
const __EnumVariantInfo_Debug = { debug: __EnumVariantInfo_Debug_debug };

function __EnumTypeInfo_Debug_debug(self) {
  return "EnumTypeInfo { " + "variants: " + __Map_Debug.debug(self.variants, __Str_Debug, __EnumVariantInfo_Debug) + ", " + "max_fields: " + String(self.max_fields) + ", " + "llvm_type: " + __LLVMTypeRef_Debug.debug(self.llvm_type) + " }";
}
const __EnumTypeInfo_Debug = { debug: __EnumTypeInfo_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { StructFieldInfo, EnumVariantInfo, EnumTypeInfo, LlvmCtx, llvm_mangle_fn, llvm_mangle_fn_with_prefix, llvm_mangle_method, llvm_resolve_fn, llvm_resolve_method, fresh_name, get_or_declare_runtime_fn, get_rt_fn_type, build_entry_alloca, __EnumVariantInfo_Eq, __StructFieldInfo_Clone, __EnumVariantInfo_Clone, __EnumTypeInfo_Clone, __EnumVariantInfo_Ord, __StructFieldInfo_Debug, __EnumVariantInfo_Debug, __EnumTypeInfo_Debug };