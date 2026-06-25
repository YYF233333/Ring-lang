import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";



function List_is_empty(self) {
  return (List_len(self) === 0);
}
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

function Result_and_then(self, f) {
  __ring_match1: {
    const __ring_m1 = self;
    if (__ring_m1._tag === "Ok") {
      const v = __ring_m1._0;
      return f(v);
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
function Result_is_err(self) {
  __ring_match2: {
    const __ring_m2 = self;
    if (__ring_m2._tag === "Ok") {
      return false;
      break __ring_match2;
    }
    if (__ring_m2._tag === "Err") {
      return true;
      break __ring_match2;
    }
    __match_fail(__ring_m2);
  }
}
function Result_is_ok(self) {
  __ring_match3: {
    const __ring_m3 = self;
    if (__ring_m3._tag === "Ok") {
      return true;
      break __ring_match3;
    }
    if (__ring_m3._tag === "Err") {
      return false;
      break __ring_match3;
    }
    __match_fail(__ring_m3);
  }
}
function Result_map(self, f) {
  __ring_match4: {
    const __ring_m4 = self;
    if (__ring_m4._tag === "Ok") {
      const v = __ring_m4._0;
      return Result_Ok(f(v));
      break __ring_match4;
    }
    if (__ring_m4._tag === "Err") {
      const e = __ring_m4._0;
      return Result_Err(e);
      break __ring_match4;
    }
    __match_fail(__ring_m4);
  }
}
function Result_unwrap_or(self, _default) {
  __ring_match5: {
    const __ring_m5 = self;
    if (__ring_m5._tag === "Ok") {
      const v = __ring_m5._0;
      return v;
      break __ring_match5;
    }
    if (__ring_m5._tag === "Err") {
      return _default;
      break __ring_match5;
    }
    __match_fail(__ring_m5);
  }
}

function to_result(f) {
  return (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Result_Ok(f()); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { const e = __ring_err; return Result_Err(e); } else { throw __ring_e; } } throw __ring_e; } })();
}

const BUILTIN_INT = "Int";

const BUILTIN_FLOAT = "Float";

const BUILTIN_STR = "Str";

const BUILTIN_BOOL = "Bool";

const BUILTIN_RANGE = "Range";

const BUILTIN_LIST = "List";

const BUILTIN_MAP = "Map";

const BUILTIN_SET = "Set";

const BUILTIN_OPTION = "Option";

const BUILTIN_CELL = "Cell";

const BUILTIN_STRING_BUILDER = "StringBuilder";

class StructField {
  constructor(name, ty, is_pub) {
    this.name = name;
    this.ty = ty;
    this.is_pub = is_pub;
  }
}

class EnumVariant {
  constructor(name, fields, field_names) {
    this.name = name;
    this.fields = fields;
    this.field_names = field_names;
  }
}

class RecordField {
  constructor(name, ty) {
    this.name = name;
    this.ty = ty;
  }
}

const Type_IntType = Object.freeze({ _tag: "IntType" });
const Type_FloatType = Object.freeze({ _tag: "FloatType" });
const Type_StrType = Object.freeze({ _tag: "StrType" });
const Type_BoolType = Object.freeze({ _tag: "BoolType" });
const Type_UnitType = Object.freeze({ _tag: "UnitType" });
const Type_NeverType = Object.freeze({ _tag: "NeverType" });
const Type_AnyType = Object.freeze({ _tag: "AnyType" });
function Type_TypeVar(id, name) {
  return { _tag: "TypeVar", id, name };
}
function Type_FnType(params, return_type, effects) {
  return { _tag: "FnType", params, return_type, effects };
}
function Type_StructType(name, type_params) {
  return { _tag: "StructType", name, type_params };
}
function Type_EnumType(name, type_params) {
  return { _tag: "EnumType", name, type_params };
}
function Type_GenericType(base, args) {
  return { _tag: "GenericType", base, args };
}
function Type_RecordType(fields, tail, tail_name) {
  return { _tag: "RecordType", fields, tail, tail_name };
}
function Type_EffectRowType(effects, tail) {
  return { _tag: "EffectRowType", effects, tail };
}
function Type_TupleType(elements) {
  return { _tag: "TupleType", elements };
}
const Type_ErrorType = Object.freeze({ _tag: "ErrorType" });

const Effect_IoEffect = Object.freeze({ _tag: "IoEffect" });
function Effect_FailEffect(error_type) {
  return { _tag: "FailEffect", error_type };
}
function Effect_MutEffect(state_type) {
  return { _tag: "MutEffect", state_type };
}
function Effect_CustomEffect(name, type_args) {
  return { _tag: "CustomEffect", name, type_args };
}

class EffectRow {
  constructor(effects, tail) {
    this.effects = effects;
    this.tail = tail;
  }
}

class RowMergeResult {
  constructor(row, tails_to_unify) {
    this.row = row;
    this.tails_to_unify = tails_to_unify;
  }
}

const INT = Type_IntType;

const FLOAT = Type_FloatType;

const STR = Type_StrType;

const BOOL = Type_BoolType;

const UNIT = Type_UnitType;

const NEVER = Type_NeverType;

const ANY = Type_AnyType;

const EMPTY_ROW = new EffectRow([], Option_none);

function effect_kind_name(e) {
  __ring_match6: {
    const __ring_m6 = e;
    if (__ring_m6._tag === "IoEffect") {
      return "io";
      break __ring_match6;
    }
    if (__ring_m6._tag === "MutEffect") {
      return "mut";
      break __ring_match6;
    }
    if (__ring_m6._tag === "FailEffect") {
      return "fail";
      break __ring_match6;
    }
    if (__ring_m6._tag === "CustomEffect") {
      const name = __ring_m6.name;
      return name;
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function effect_row(effects) {
  return new EffectRow(effects, Option_none);
}

function type_to_string(t) {
  __ring_match7: {
    const __ring_m7 = t;
    if (__ring_m7._tag === "IntType") {
      return BUILTIN_INT;
      break __ring_match7;
    }
    if (__ring_m7._tag === "FloatType") {
      return BUILTIN_FLOAT;
      break __ring_match7;
    }
    if (__ring_m7._tag === "StrType") {
      return BUILTIN_STR;
      break __ring_match7;
    }
    if (__ring_m7._tag === "BoolType") {
      return BUILTIN_BOOL;
      break __ring_match7;
    }
    if (__ring_m7._tag === "UnitType") {
      return "()";
      break __ring_match7;
    }
    if (__ring_m7._tag === "NeverType") {
      return "Never";
      break __ring_match7;
    }
    if (__ring_m7._tag === "AnyType") {
      return "Any";
      break __ring_match7;
    }
    if (__ring_m7._tag === "TypeVar") {
      const name = __ring_m7.name; const id = __ring_m7.id;
      __ring_match8: {
        const __ring_m8 = name;
        if (__ring_m8._tag === "some") {
          const n = __ring_m8._0;
          return n;
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          return `?${Int_to_str(id)}`;
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "FnType") {
      const params = __ring_m7.params; const return_type = __ring_m7.return_type; const effects = __ring_m7.effects;
      const ps = List_join(params.map((function(p) { return type_to_string(p); })), ", ");
      const ret = type_to_string(return_type);
      const eff = effect_row_to_string(effects);
      if ((Str_len(eff) > 0)) {
        return `(${ps}) -> ${ret} / ${eff}`;
      } else {
        return `(${ps}) -> ${ret}`;
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "StructType") {
      const name = __ring_m7.name; const type_params = __ring_m7.type_params;
      if ((List_len(type_params) === 0)) {
        return name;
      } else {
        return `${name}<${List_join(type_params.map((function(p) { return type_to_string(p); })), ", ")}>`;
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "EnumType") {
      const name = __ring_m7.name; const type_params = __ring_m7.type_params;
      if (((name === BUILTIN_OPTION) ? (List_len(type_params) === 1) : false)) {
        return `${type_to_string(Option_unwrap_or(List_first(type_params), UNIT))}?`;
      } else {
        if ((List_len(type_params) === 0)) {
          return name;
        } else {
          return `${name}<${List_join(type_params.map((function(p) { return type_to_string(p); })), ", ")}>`;
        }
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "GenericType") {
      const base = __ring_m7.base; const args = __ring_m7.args;
      return `${type_to_string(base)}<${List_join(args.map((function(a) { return type_to_string(a); })), ", ")}>`;
      break __ring_match7;
    }
    if (__ring_m7._tag === "RecordType") {
      const fields = __ring_m7.fields; const tail = __ring_m7.tail; const tail_name = __ring_m7.tail_name;
      const fs = List_join(fields.map((function(f) { return `${f.name}: ${type_to_string(f.ty)}`; })), ", ");
      __ring_match9: {
        const __ring_m9 = tail;
        if (__ring_m9._tag === "some") {
          const t = __ring_m9._0;
          let __ring_blk0;
          __ring_match10: {
            const __ring_m10 = tail_name;
            if (__ring_m10._tag === "some") {
              const n = __ring_m10._0;
              __ring_blk0 = n;
              break __ring_match10;
            }
            if (__ring_m10._tag === "none") {
              __ring_blk0 = `?${Int_to_str(t)}`;
              break __ring_match10;
            }
            __match_fail(__ring_m10);
          }
          const ts = __ring_blk0;
          if ((Str_len(fs) > 0)) {
            return `{${fs}, ..${ts}}`;
          } else {
            return `{..${ts}}`;
          }
          break __ring_match9;
        }
        if (__ring_m9._tag === "none") {
          return `{${fs}}`;
          break __ring_match9;
        }
        __match_fail(__ring_m9);
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "EffectRowType") {
      const effects = __ring_m7.effects; const tail = __ring_m7.tail;
      const es = List_join(effects.map((function(e) { return effect_to_string(e); })), ", ");
      __ring_match11: {
        const __ring_m11 = tail;
        if (__ring_m11._tag === "some") {
          const t = __ring_m11._0;
          return `<${es}, ?${Int_to_str(t)}>`;
          break __ring_match11;
        }
        if (__ring_m11._tag === "none") {
          return `<${es}>`;
          break __ring_match11;
        }
        __match_fail(__ring_m11);
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "TupleType") {
      const elements = __ring_m7.elements;
      return `(${List_join(elements.map((function(e) { return type_to_string(e); })), ", ")})`;
      break __ring_match7;
    }
    if (__ring_m7._tag === "ErrorType") {
      return "<error>";
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
}

function effect_to_string(e) {
  __ring_match12: {
    const __ring_m12 = e;
    if (__ring_m12._tag === "IoEffect") {
      return "io";
      break __ring_match12;
    }
    if (__ring_m12._tag === "MutEffect") {
      const state_type = __ring_m12.state_type;
      return `mut<${type_to_string(state_type)}>`;
      break __ring_match12;
    }
    if (__ring_m12._tag === "FailEffect") {
      const error_type = __ring_m12.error_type;
      return `fail<${type_to_string(error_type)}>`;
      break __ring_match12;
    }
    if (__ring_m12._tag === "CustomEffect") {
      const name = __ring_m12.name; const type_args = __ring_m12.type_args;
      if ((List_len(type_args) === 0)) {
        return name;
      } else {
        return `${name}<${List_join(type_args.map((function(a) { return type_to_string(a); })), ", ")}>`;
      }
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
}

function effect_row_to_string(row) {
  if (((List_len(row.effects) === 0) ? Option_is_none(row.tail) : false)) {
    return "";
  }
  let parts = row.effects.map((function(e) { return effect_to_string(e); }));
  __ring_match13: {
    const __ring_m13 = row.tail;
    if (__ring_m13._tag === "some") {
      const t = __ring_m13._0;
      List_push(parts, `?${Int_to_str(t)}`);
      break __ring_match13;
    }
    if (__ring_m13._tag === "none") {
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
  return List_join(parts, ", ");
}

function optional_ids_equal(a, b) {
  __ring_match14: {
    const __ring_m14 = [a, b];
    if (Array.isArray(__ring_m14) && __ring_m14.length === 2 && __ring_m14[0]._tag === "some" && __ring_m14[1]._tag === "some") {
      const x = __ring_m14[0]._0; const y = __ring_m14[1]._0;
      return (x === y);
      break __ring_match14;
    }
    if (Option_is_none(a)) {
      return Option_is_none(b);
    } else {
      return false;
    }
    break __ring_match14;
  }
}

function effects_list_equal(a, b) {
  if ((List_len(a) !== List_len(b))) {
    return false;
  }
  let i = 0;
  while ((i < List_len(a))) {
    {
      const __ring_t = List_get(a, i);
      if (__ring_t._tag === "some") {
        const x = __ring_t._0;
        {
          const __ring_t = List_get(b, i);
          if (__ring_t._tag === "some") {
            const y = __ring_t._0;
            if ((!effects_equal(x, y))) {
              return false;
            }
          }
        }
      }
    }
    i = (i + 1);
  }
  return true;
}

function types_equal(a, b) {
  __ring_match15: {
    const __ring_m15 = a;
    if (__ring_m15._tag === "IntType") {
      __ring_match16: {
        const __ring_m16 = b;
        if (__ring_m16._tag === "IntType") {
          return true;
          break __ring_match16;
        }
        return false;
        break __ring_match16;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "FloatType") {
      __ring_match17: {
        const __ring_m17 = b;
        if (__ring_m17._tag === "FloatType") {
          return true;
          break __ring_match17;
        }
        return false;
        break __ring_match17;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "StrType") {
      __ring_match18: {
        const __ring_m18 = b;
        if (__ring_m18._tag === "StrType") {
          return true;
          break __ring_match18;
        }
        return false;
        break __ring_match18;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "BoolType") {
      __ring_match19: {
        const __ring_m19 = b;
        if (__ring_m19._tag === "BoolType") {
          return true;
          break __ring_match19;
        }
        return false;
        break __ring_match19;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "UnitType") {
      __ring_match20: {
        const __ring_m20 = b;
        if (__ring_m20._tag === "UnitType") {
          return true;
          break __ring_match20;
        }
        return false;
        break __ring_match20;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "NeverType") {
      __ring_match21: {
        const __ring_m21 = b;
        if (__ring_m21._tag === "NeverType") {
          return true;
          break __ring_match21;
        }
        return false;
        break __ring_match21;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "AnyType") {
      __ring_match22: {
        const __ring_m22 = b;
        if (__ring_m22._tag === "AnyType") {
          return true;
          break __ring_match22;
        }
        return false;
        break __ring_match22;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "ErrorType") {
      __ring_match23: {
        const __ring_m23 = b;
        if (__ring_m23._tag === "ErrorType") {
          return true;
          break __ring_match23;
        }
        return false;
        break __ring_match23;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "TypeVar") {
      const id_a = __ring_m15.id;
      __ring_match24: {
        const __ring_m24 = b;
        if (__ring_m24._tag === "TypeVar") {
          const id_b = __ring_m24.id;
          return (id_a === id_b);
          break __ring_match24;
        }
        return false;
        break __ring_match24;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "FnType") {
      const pa = __ring_m15.params; const ra = __ring_m15.return_type; const ea = __ring_m15.effects;
      __ring_match25: {
        const __ring_m25 = b;
        if (__ring_m25._tag === "FnType") {
          const pb = __ring_m25.params; const rb = __ring_m25.return_type; const eb = __ring_m25.effects;
          if (((type_lists_equal(pa, pb) ? types_equal(ra, rb) : false) ? effects_list_equal(ea.effects, eb.effects) : false)) {
            return optional_ids_equal(ea.tail, eb.tail);
          } else {
            return false;
          }
          break __ring_match25;
        }
        return false;
        break __ring_match25;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "StructType") {
      const na = __ring_m15.name; const tpa = __ring_m15.type_params;
      __ring_match26: {
        const __ring_m26 = b;
        if (__ring_m26._tag === "StructType") {
          const nb = __ring_m26.name; const tpb = __ring_m26.type_params;
          if ((na === nb)) {
            return type_lists_equal(tpa, tpb);
          } else {
            return false;
          }
          break __ring_match26;
        }
        return false;
        break __ring_match26;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "EnumType") {
      const na = __ring_m15.name; const tpa = __ring_m15.type_params;
      __ring_match27: {
        const __ring_m27 = b;
        if (__ring_m27._tag === "EnumType") {
          const nb = __ring_m27.name; const tpb = __ring_m27.type_params;
          if ((na === nb)) {
            return type_lists_equal(tpa, tpb);
          } else {
            return false;
          }
          break __ring_match27;
        }
        return false;
        break __ring_match27;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "GenericType") {
      const ba = __ring_m15.base; const aa = __ring_m15.args;
      __ring_match28: {
        const __ring_m28 = b;
        if (__ring_m28._tag === "GenericType") {
          const bb = __ring_m28.base; const ab = __ring_m28.args;
          if (types_equal(ba, bb)) {
            return type_lists_equal(aa, ab);
          } else {
            return false;
          }
          break __ring_match28;
        }
        return false;
        break __ring_match28;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "RecordType") {
      const fa = __ring_m15.fields; const ta = __ring_m15.tail;
      __ring_match29: {
        const __ring_m29 = b;
        if (__ring_m29._tag === "RecordType") {
          const fb = __ring_m29.fields; const tb = __ring_m29.tail;
          if ((List_len(fa) !== List_len(fb))) {
            return false;
          }
          if ((!optional_ids_equal(ta, tb))) {
            return false;
          }
          return fa.every((function(f) { return fb.some((function(bf) { return ((bf.name === f.name) ? types_equal(f.ty, bf.ty) : false); })); }));
          break __ring_match29;
        }
        return false;
        break __ring_match29;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "EffectRowType") {
      const ea = __ring_m15.effects; const ta = __ring_m15.tail;
      __ring_match30: {
        const __ring_m30 = b;
        if (__ring_m30._tag === "EffectRowType") {
          const eb = __ring_m30.effects; const tb = __ring_m30.tail;
          if ((!optional_ids_equal(ta, tb))) {
            return false;
          }
          if ((List_len(ea) !== List_len(eb))) {
            return false;
          }
          return ea.every((function(ae) { return eb.some((function(be) { return effects_equal(ae, be); })); }));
          break __ring_match30;
        }
        return false;
        break __ring_match30;
      }
      break __ring_match15;
    }
    if (__ring_m15._tag === "TupleType") {
      const ea = __ring_m15.elements;
      __ring_match31: {
        const __ring_m31 = b;
        if (__ring_m31._tag === "TupleType") {
          const eb = __ring_m31.elements;
          return type_lists_equal(ea, eb);
          break __ring_match31;
        }
        return false;
        break __ring_match31;
      }
      break __ring_match15;
    }
    __match_fail(__ring_m15);
  }
}

function type_lists_equal(a, b) {
  if ((List_len(a) !== List_len(b))) {
    return false;
  }
  let i = 0;
  while ((i < List_len(a))) {
    {
      const __ring_t = List_get(a, i);
      if (__ring_t._tag === "some") {
        const x = __ring_t._0;
        {
          const __ring_t = List_get(b, i);
          if (__ring_t._tag === "some") {
            const y = __ring_t._0;
            if ((!types_equal(x, y))) {
              return false;
            }
          }
        }
      }
    }
    i = (i + 1);
  }
  return true;
}

function effects_equal(a, b) {
  __ring_match32: {
    const __ring_m32 = a;
    if (__ring_m32._tag === "IoEffect") {
      __ring_match33: {
        const __ring_m33 = b;
        if (__ring_m33._tag === "IoEffect") {
          return true;
          break __ring_match33;
        }
        return false;
        break __ring_match33;
      }
      break __ring_match32;
    }
    if (__ring_m32._tag === "MutEffect") {
      const sa = __ring_m32.state_type;
      __ring_match34: {
        const __ring_m34 = b;
        if (__ring_m34._tag === "MutEffect") {
          const sb = __ring_m34.state_type;
          return types_equal(sa, sb);
          break __ring_match34;
        }
        return false;
        break __ring_match34;
      }
      break __ring_match32;
    }
    if (__ring_m32._tag === "FailEffect") {
      const et_a = __ring_m32.error_type;
      __ring_match35: {
        const __ring_m35 = b;
        if (__ring_m35._tag === "FailEffect") {
          const et_b = __ring_m35.error_type;
          return types_equal(et_a, et_b);
          break __ring_match35;
        }
        return false;
        break __ring_match35;
      }
      break __ring_match32;
    }
    if (__ring_m32._tag === "CustomEffect") {
      const na = __ring_m32.name; const args_a = __ring_m32.type_args;
      __ring_match36: {
        const __ring_m36 = b;
        if (__ring_m36._tag === "CustomEffect") {
          const nb = __ring_m36.name; const args_b = __ring_m36.type_args;
          if ((na === nb)) {
            return type_lists_equal(args_a, args_b);
          } else {
            return false;
          }
          break __ring_match36;
        }
        return false;
        break __ring_match36;
      }
      break __ring_match32;
    }
    __match_fail(__ring_m32);
  }
}

function is_type_var(t) {
  __ring_match37: {
    const __ring_m37 = t;
    if (__ring_m37._tag === "TypeVar") {
      return true;
      break __ring_match37;
    }
    return false;
    break __ring_match37;
  }
}

function effects_match_kind(a, b) {
  __ring_match38: {
    const __ring_m38 = a;
    if (__ring_m38._tag === "IoEffect") {
      __ring_match39: {
        const __ring_m39 = b;
        if (__ring_m39._tag === "IoEffect") {
          return true;
          break __ring_match39;
        }
        return false;
        break __ring_match39;
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "MutEffect") {
      const sa = __ring_m38.state_type;
      __ring_match40: {
        const __ring_m40 = b;
        if (__ring_m40._tag === "MutEffect") {
          const sb = __ring_m40.state_type;
          if ((is_type_var(sa) ? true : is_type_var(sb))) {
            return true;
          } else {
            return types_equal(sa, sb);
          }
          break __ring_match40;
        }
        return false;
        break __ring_match40;
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "FailEffect") {
      __ring_match41: {
        const __ring_m41 = b;
        if (__ring_m41._tag === "FailEffect") {
          return true;
          break __ring_match41;
        }
        return false;
        break __ring_match41;
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "CustomEffect") {
      const na = __ring_m38.name;
      __ring_match42: {
        const __ring_m42 = b;
        if (__ring_m42._tag === "CustomEffect") {
          const nb = __ring_m42.name;
          return (na === nb);
          break __ring_match42;
        }
        return false;
        break __ring_match42;
      }
      break __ring_match38;
    }
    __match_fail(__ring_m38);
  }
}

function effects_same_kind(a, b) {
  __ring_match43: {
    const __ring_m43 = a;
    if (__ring_m43._tag === "IoEffect") {
      __ring_match44: {
        const __ring_m44 = b;
        if (__ring_m44._tag === "IoEffect") {
          return true;
          break __ring_match44;
        }
        return false;
        break __ring_match44;
      }
      break __ring_match43;
    }
    if (__ring_m43._tag === "MutEffect") {
      const sa = __ring_m43.state_type;
      __ring_match45: {
        const __ring_m45 = b;
        if (__ring_m45._tag === "MutEffect") {
          const sb = __ring_m45.state_type;
          return types_equal(sa, sb);
          break __ring_match45;
        }
        return false;
        break __ring_match45;
      }
      break __ring_match43;
    }
    if (__ring_m43._tag === "FailEffect") {
      const ea = __ring_m43.error_type;
      __ring_match46: {
        const __ring_m46 = b;
        if (__ring_m46._tag === "FailEffect") {
          const eb = __ring_m46.error_type;
          return types_equal(ea, eb);
          break __ring_match46;
        }
        return false;
        break __ring_match46;
      }
      break __ring_match43;
    }
    if (__ring_m43._tag === "CustomEffect") {
      const na = __ring_m43.name;
      __ring_match47: {
        const __ring_m47 = b;
        if (__ring_m47._tag === "CustomEffect") {
          const nb = __ring_m47.name;
          return (na === nb);
          break __ring_match47;
        }
        return false;
        break __ring_match47;
      }
      break __ring_match43;
    }
    __match_fail(__ring_m43);
  }
}

function is_list_type(t) {
  __ring_match48: {
    const __ring_m48 = t;
    if (__ring_m48._tag === "StructType") {
      const name = __ring_m48.name; const type_params = __ring_m48.type_params;
      if ((name === BUILTIN_LIST)) {
        return (List_len(type_params) === 1);
      } else {
        return false;
      }
      break __ring_match48;
    }
    return false;
    break __ring_match48;
  }
}

function is_map_type(t) {
  __ring_match49: {
    const __ring_m49 = t;
    if (__ring_m49._tag === "StructType") {
      const name = __ring_m49.name; const type_params = __ring_m49.type_params;
      if ((name === BUILTIN_MAP)) {
        return (List_len(type_params) === 2);
      } else {
        return false;
      }
      break __ring_match49;
    }
    return false;
    break __ring_match49;
  }
}

function is_option_type(t) {
  __ring_match50: {
    const __ring_m50 = t;
    if (__ring_m50._tag === "EnumType") {
      const name = __ring_m50.name; const type_params = __ring_m50.type_params;
      if ((name === BUILTIN_OPTION)) {
        return (List_len(type_params) === 1);
      } else {
        return false;
      }
      break __ring_match50;
    }
    return false;
    break __ring_match50;
  }
}

function is_set_type(t) {
  __ring_match51: {
    const __ring_m51 = t;
    if (__ring_m51._tag === "StructType") {
      const name = __ring_m51.name; const type_params = __ring_m51.type_params;
      if ((name === BUILTIN_SET)) {
        return (List_len(type_params) === 1);
      } else {
        return false;
      }
      break __ring_match51;
    }
    return false;
    break __ring_match51;
  }
}

function list_element(t) {
  __ring_match52: {
    const __ring_m52 = t;
    if (__ring_m52._tag === "StructType") {
      const type_params = __ring_m52.type_params;
      return Option_unwrap_or(List_first(type_params), UNIT);
      break __ring_match52;
    }
    return UNIT;
    break __ring_match52;
  }
}

function make_list_type(element) {
  return Type_StructType(BUILTIN_LIST, [element]);
}

function make_map_type(key, value) {
  return Type_StructType(BUILTIN_MAP, [key, value]);
}

function make_option_type(inner) {
  return Type_EnumType(BUILTIN_OPTION, [inner]);
}

function make_set_type(element) {
  return Type_StructType(BUILTIN_SET, [element]);
}

function open_effect_row(effects, tail) {
  return new EffectRow(effects, Option_some(tail));
}

function option_inner(t) {
  __ring_match53: {
    const __ring_m53 = t;
    if (__ring_m53._tag === "EnumType") {
      const type_params = __ring_m53.type_params;
      return Option_unwrap_or(List_first(type_params), UNIT);
      break __ring_match53;
    }
    return UNIT;
    break __ring_match53;
  }
}

function row_contains(row, eff) {
  return row.effects.some((function(e) { return effects_equal(e, eff); }));
}

function row_merge(a, b) {
  let merged = list_clone(a.effects);
  const __ring_iter_2 = __List_Iterable.iter(b.effects);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const eff = __ring_next_2._0;
    if ((!merged.some((function(e) { return effects_match_kind(e, eff); })))) {
      List_push(merged, eff);
    }
  }
  let __ring_blk1;
  __ring_match54: {
    const __ring_m54 = [a.tail, b.tail];
    if (Array.isArray(__ring_m54) && __ring_m54.length === 2 && __ring_m54[0]._tag === "some") {
      const ta = __ring_m54[0]._0;
      __ring_blk1 = Option_some(ta);
      break __ring_match54;
    }
    if (Array.isArray(__ring_m54) && __ring_m54.length === 2 && __ring_m54[1]._tag === "some") {
      const tb = __ring_m54[1]._0;
      __ring_blk1 = Option_some(tb);
      break __ring_match54;
    }
    __ring_blk1 = Option_none;
    break __ring_match54;
  }
  const tail = __ring_blk1;
  let __ring_blk2;
  __ring_match55: {
    const __ring_m55 = [a.tail, b.tail];
    if (Array.isArray(__ring_m55) && __ring_m55.length === 2 && __ring_m55[0]._tag === "some" && __ring_m55[1]._tag === "some") {
      const ta = __ring_m55[0]._0; const tb = __ring_m55[1]._0;
      __ring_blk2 = ((ta !== tb) ? Option_some([ta, tb]) : Option_none);
      break __ring_match55;
    }
    __ring_blk2 = Option_none;
    break __ring_match55;
  }
  const tails_to_unify = __ring_blk2;
  return new RowMergeResult(new EffectRow(merged, tail), tails_to_unify);
}

function type_to_builtin_name(t) {
  __ring_match56: {
    const __ring_m56 = t;
    if (__ring_m56._tag === "IntType") {
      return Option_some(BUILTIN_INT);
      break __ring_match56;
    }
    if (__ring_m56._tag === "FloatType") {
      return Option_some(BUILTIN_FLOAT);
      break __ring_match56;
    }
    if (__ring_m56._tag === "StrType") {
      return Option_some(BUILTIN_STR);
      break __ring_match56;
    }
    if (__ring_m56._tag === "BoolType") {
      return Option_some(BUILTIN_BOOL);
      break __ring_match56;
    }
    if (__ring_m56._tag === "UnitType") {
      return Option_some("Unit");
      break __ring_match56;
    }
    if (__ring_m56._tag === "StructType") {
      const name = __ring_m56.name;
      return Option_some(name);
      break __ring_match56;
    }
    if (__ring_m56._tag === "EnumType") {
      const name = __ring_m56.name;
      return Option_some(name);
      break __ring_match56;
    }
    if (__ring_m56._tag === "ErrorType") {
      return Option_none;
      break __ring_match56;
    }
    return Option_none;
    break __ring_match56;
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


export { BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL, BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION, BUILTIN_CELL, BUILTIN_STRING_BUILDER, StructField, EnumVariant, RecordField, Type_IntType, Type_FloatType, Type_StrType, Type_BoolType, Type_UnitType, Type_NeverType, Type_AnyType, Type_TypeVar, Type_FnType, Type_StructType, Type_EnumType, Type_GenericType, Type_RecordType, Type_EffectRowType, Type_TupleType, Type_ErrorType, Effect_IoEffect, Effect_FailEffect, Effect_MutEffect, Effect_CustomEffect, EffectRow, RowMergeResult, INT, FLOAT, STR, BOOL, UNIT, NEVER, ANY, EMPTY_ROW, effect_kind_name, effects_match_kind, type_to_builtin_name, make_option_type, is_option_type, option_inner, make_list_type, is_list_type, list_element, make_map_type, is_map_type, make_set_type, is_set_type, effect_row, open_effect_row, row_contains, effects_same_kind, row_merge, effects_equal, types_equal, type_to_string, effect_to_string, effect_row_to_string };