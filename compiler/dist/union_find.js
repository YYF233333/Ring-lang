import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";

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

class UnionFind {
  constructor(parent, rank, types) {
    this.parent = parent;
    this.rank = rank;
    this.types = types;
  }
}

function new_union_find() {
  return new UnionFind(map_new(), map_new(), map_new());
}

function uf_find(uf, id) {
  __ring_match1: {
    const __ring_m1 = _Map_get(uf.parent, id);
    if (__ring_m1._tag === "none") {
      return id;
      break __ring_match1;
    }
    if (__ring_m1._tag === "some") {
      const p = __ring_m1._0;
      if ((p === id)) {
        return id;
      }
      const root = uf_find(uf, p);
      _Map_insert(uf.parent, id, root);
      return root;
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
}

function uf_bind(uf, id, ty) {
  const root = uf_find(uf, id);
  return _Map_insert(uf.types, root, ty);
}

function uf_lookup(uf, id) {
  const root = uf_find(uf, id);
  return _Map_get(uf.types, root);
}

function uf_union(uf, a, b) {
  const ra = uf_find(uf, a);
  const rb = uf_find(uf, b);
  if ((ra === rb)) {
    return;
  }
  const rank_a = (function() {
  const __ring_m = _Map_get(uf.rank, ra);
  if (__ring_m._tag === "some") { const r = __ring_m._0; return r; }
  if (__ring_m._tag === "none") { return 0; }
  __match_fail(__ring_m);
})();
  const rank_b = (function() {
  const __ring_m = _Map_get(uf.rank, rb);
  if (__ring_m._tag === "some") { const r = __ring_m._0; return r; }
  if (__ring_m._tag === "none") { return 0; }
  __match_fail(__ring_m);
})();
  if ((rank_a < rank_b)) {
    _Map_insert(uf.parent, ra, rb);
    __ring_match2: {
      const __ring_m2 = _Map_get(uf.types, ra);
      if (__ring_m2._tag === "some") {
        const ty = __ring_m2._0;
        __ring_match3: {
          const __ring_m3 = _Map_get(uf.types, rb);
          if (__ring_m3._tag === "none") {
            return _Map_insert(uf.types, rb, ty);
            break __ring_match3;
          }
          if (__ring_m3._tag === "some") {
            break __ring_match3;
          }
          __match_fail(__ring_m3);
        }
        break __ring_match2;
      }
      if (__ring_m2._tag === "none") {
        break __ring_match2;
      }
      __match_fail(__ring_m2);
    }
  } else {
    _Map_insert(uf.parent, rb, ra);
    __ring_match4: {
      const __ring_m4 = _Map_get(uf.types, rb);
      if (__ring_m4._tag === "some") {
        const ty = __ring_m4._0;
        __ring_match5: {
          const __ring_m5 = _Map_get(uf.types, ra);
          if (__ring_m5._tag === "none") {
            _Map_insert(uf.types, ra, ty);
            break __ring_match5;
          }
          if (__ring_m5._tag === "some") {
            break __ring_match5;
          }
          __match_fail(__ring_m5);
        }
        break __ring_match4;
      }
      if (__ring_m4._tag === "none") {
        break __ring_match4;
      }
      __match_fail(__ring_m4);
    }
    if ((rank_a === rank_b)) {
      return _Map_insert(uf.rank, ra, (rank_a + 1));
    }
  }
}

function uf_insert(uf, id, ty) {
  const root = uf_find(uf, id);
  return _Map_insert(uf.types, root, ty);
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


export { UnionFind, new_union_find, uf_find, uf_bind, uf_lookup, uf_union, uf_insert };