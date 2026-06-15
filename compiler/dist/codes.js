import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";



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

const E0101 = "E0101";

const E0102 = "E0102";

const E0103 = "E0103";

const E0104 = "E0104";

const E0105 = "E0105";

const E0106 = "E0106";

const E0201 = "E0201";

const E0203 = "E0203";

const E0204 = "E0204";

const E0205 = "E0205";

const E0206 = "E0206";

const E0207 = "E0207";

const E0208 = "E0208";

const E0301 = "E0301";

const E0302 = "E0302";

const E0303 = "E0303";

const E0304 = "E0304";

const E0305 = "E0305";

const E0306 = "E0306";

const E0307 = "E0307";

const E0308 = "E0308";

const E0402 = "E0402";

const E0403 = "E0403";

const E0404 = "E0404";

const E0501 = "E0501";

const E0502 = "E0502";

const E0503 = "E0503";

const E0405 = "E0405";

const E0406 = "E0406";

const E0407 = "E0407";

const E0408 = "E0408";

const E0504 = "E0504";

const E0505 = "E0505";

const E0506 = "E0506";

const E0507 = "E0507";

const E0508 = "E0508";

const E0409 = "E0409";

const E0410 = "E0410";

const E0509 = "E0509";

const E0510 = "E0510";

const E0511 = "E0511";

const E0512 = "E0512";

const E0513 = "E0513";

const E0514 = "E0514";

const E0601 = "E0601";

const E0702 = "E0702";

const E0703 = "E0703";

const E0704 = "E0704";

const E0705 = "E0705";

const E0706 = "E0706";

const W0001 = "W0001";

const W0002 = "W0002";

function error_category(code) {
  if (Str_starts_with(code, "E01")) {
    return "parse";
  }
  if (Str_starts_with(code, "E02")) {
    return "resolution";
  }
  if (Str_starts_with(code, "E03")) {
    return "type";
  }
  if (Str_starts_with(code, "E04")) {
    return "effect";
  }
  if (Str_starts_with(code, "E05")) {
    return "trait";
  }
  if (Str_starts_with(code, "E06")) {
    return "pattern";
  }
  if (Str_starts_with(code, "E07")) {
    return "module";
  }
  if (Str_starts_with(code, "W")) {
    return "warning";
  }
  return "unknown";
}

function error_description(code) {
  if ((code === "E0101")) {
    return "Unexpected token";
  }
  if ((code === "E0102")) {
    return "Unterminated string literal";
  }
  if ((code === "E0103")) {
    return "Expected token";
  }
  if ((code === "E0104")) {
    return "Empty parentheses on enum variant";
  }
  if ((code === "E0105")) {
    return "Invalid impl type argument";
  }
  if ((code === "E0106")) {
    return "Non-default parameter after default parameter";
  }
  if ((code === "E0201")) {
    return "Undefined variable";
  }
  if ((code === "E0203")) {
    return "Unknown struct or invalid constructor fields";
  }
  if ((code === "E0204")) {
    return "Unknown type";
  }
  if ((code === "E0205")) {
    return "Assignment to immutable variable";
  }
  if ((code === "E0206")) {
    return "Break/continue outside loop";
  }
  if ((code === "E0207")) {
    return "Duplicate definition";
  }
  if ((code === "E0208")) {
    return "Mutating method on immutable binding";
  }
  if ((code === "E0301")) {
    return "Type mismatch";
  }
  if ((code === "E0302")) {
    return "Infinite type (occurs check)";
  }
  if ((code === "E0303")) {
    return "Numeric type required";
  }
  if ((code === "E0304")) {
    return "Invalid field access";
  }
  if ((code === "E0305")) {
    return "Undefined method";
  }
  if ((code === "E0306")) {
    return "Type does not support indexing";
  }
  if ((code === "E0307")) {
    return "Type does not implement Eq";
  }
  if ((code === "E0308")) {
    return "Type does not implement Ord";
  }
  if ((code === "E0402")) {
    return "Unknown effect operation";
  }
  if ((code === "E0403")) {
    return "Unhandled effect";
  }
  if ((code === "E0404")) {
    return "Effect annotation violation";
  }
  if ((code === "E0405")) {
    return "Capability violation";
  }
  if ((code === "E0406")) {
    return "Cyclic effect alias";
  }
  if ((code === "E0407")) {
    return "Unknown effect";
  }
  if ((code === "E0408")) {
    return "Open effect row in capability-restricted module";
  }
  if ((code === "E0409")) {
    return "Default handler body uses effect without default handler";
  }
  if ((code === "E0410")) {
    return "Cyclic default effect handler dependency";
  }
  if ((code === "E0501")) {
    return "Unknown trait";
  }
  if ((code === "E0502")) {
    return "Missing trait method implementation";
  }
  if ((code === "E0503")) {
    return "Unsatisfied trait bound";
  }
  if ((code === "E0504")) {
    return "Ambiguous trait method";
  }
  if ((code === "E0505")) {
    return "Missing supertrait implementation";
  }
  if ((code === "E0506")) {
    return "Cyclic supertrait inheritance";
  }
  if ((code === "E0507")) {
    return "Delegate field not found";
  }
  if ((code === "E0508")) {
    return "Delegate field type does not implement trait";
  }
  if ((code === "E0509")) {
    return "Delegate conflicts with existing impl";
  }
  if ((code === "E0510")) {
    return "Missing associated type implementation";
  }
  if ((code === "E0511")) {
    return "Unknown associated type";
  }
  if ((code === "E0512")) {
    return "Ambiguous associated type";
  }
  if ((code === "E0513")) {
    return "Associated type bound not satisfied";
  }
  if ((code === "E0514")) {
    return "Unexpected associated type";
  }
  if ((code === "E0601")) {
    return "Non-exhaustive pattern match";
  }
  if ((code === "E0702")) {
    return "Module not found";
  }
  if ((code === "E0703")) {
    return "Symbol not found in module";
  }
  if ((code === "E0704")) {
    return "Circular dependency detected";
  }
  if ((code === "E0705")) {
    return "Relative path out of scope";
  }
  if ((code === "E0706")) {
    return "Use declaration must appear before other declarations";
  }
  if ((code === "W0001")) {
    return "Catch on expression with no fail effect";
  }
  if ((code === "W0002")) {
    return "Refinement where clause not enforced";
  }
  return "Unknown error";
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


export { E0101, E0102, E0103, E0104, E0105, E0106, E0201, E0203, E0204, E0205, E0206, E0207, E0208, E0301, E0302, E0303, E0304, E0305, E0306, E0307, E0308, E0402, E0403, E0404, E0501, E0502, E0503, E0405, E0406, E0407, E0408, E0504, E0505, E0506, E0507, E0508, E0409, E0410, E0509, E0510, E0511, E0512, E0513, E0514, E0601, E0702, E0703, E0704, E0705, E0706, W0001, W0002, error_description, error_category };