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

const RUNTIME_EXPORT_NAMES = ["__EffectAbort", "__ring_raise_fail", "Cell", "Cell_get", "Cell_set", "Cell_update", "__match_fail", "__ring_deep_eq", "__ring_tuple_eq", "__ring_set_has", "__ring_index", "__ring_map_index", "__ring_str_index", "print", "assert", "panic", "exit", "json_stringify", "__ring_ev_io", "Option_some", "Option_none", "Option_is_some", "Option_is_none", "Option_unwrap_or", "Option_unwrap", "Str_len", "Str_contains", "Str_starts_with", "Str_ends_with", "Str_slice", "Str_trim", "Str_to_upper", "Str_to_lower", "Str_replace", "Str_split", "Str_char_at", "Str_index_of", "Str_pad_start", "Str_pad_end", "Str_repeat", "Str_char_code_at", "Str_trim_start", "Str_trim_end", "Str_is_empty", "Str_last_index_of", "Int_to_str", "Float_to_str", "parse_int", "parse_float", "List_len", "List_get", "List_push", "List_concat", "List_extend", "List_slice", "List_reverse", "List_join", "List_sort", "List_sort_by", "List_set", "List_pop", "List_shift", "List_clear", "List_find_index", "list_clone", "map_new", "map_from", "map_clone", "_Map_len", "_Map_get", "_Map_contains_key", "_Map_keys", "_Map_values", "_Map_entries", "_Map_insert", "_Map_remove", "_Map_clear", "set_new", "set_from", "set_clone", "_Set_len", "_Set_to_list", "_Set_insert", "_Set_remove", "_Set_union", "_Set_intersect", "_Set_difference", "_Set_clear", "string_builder", "StringBuilder_add", "StringBuilder_line", "StringBuilder_add_int", "StringBuilder_to_str", "StringBuilder_len", "read_file", "write_file", "file_exists", "delete_file", "path_join", "path_resolve", "path_dirname", "path_basename", "path_extname", "argv", "exit_process", "eprintln", "cwd", "__Int_Eq", "__Float_Eq", "__Str_Eq", "__Bool_Eq", "__Option_Eq", "__Int_Clone", "__Float_Clone", "__Str_Clone", "__Bool_Clone", "__List_Clone", "__Map_Clone", "__Set_Clone", "__Option_Clone", "__Int_Ord", "__Float_Ord", "__Str_Ord", "__Bool_Ord", "__Int_Debug", "__Float_Debug", "__Str_Debug", "__Bool_Debug", "__Option_Debug", "__List_Debug", "__Map_Debug", "__Set_Debug"];

function RUNTIME_CODE() {
  return "import { createRequire as __cr } from \"node:module\";\nconst __require = __cr(import.meta.url);\ntry { Object.assign(globalThis, __require('../llvm-addon/build/Release/llvm_addon.node')); } catch(e) {}\n// === Ring-lang Runtime ===\nclass __EffectAbort {\n  constructor(effect, value) {\n    this.effect = effect;\n    this.value = value;\n  }\n}\n\nfunction Cell(value) { return { value }; }\nfunction Cell_get(self, __ring_ev_mut) { return self.value; }\nfunction Cell_set(self, val, __ring_ev_mut) { self.value = val; }\nfunction Cell_update(self, f, __ring_ev_mut) { self.value = f(self.value); }\n\nfunction __ring_raise_fail(msg) {\n  throw new __EffectAbort(\"fail\", msg);\n}\n\nfunction __match_fail(value) {\n  throw new Error(\"Non-exhaustive match: \" + JSON.stringify(value));\n}\n\nfunction print(value) {\n  console.log(value);\n}\n\nfunction assert(cond, msg) {\n  if (!cond) {\n    throw new Error(\"Assertion failed\" + (msg ? \": \" + msg : \"\"));\n  }\n}\n\nfunction panic(msg) {\n  throw new Error(\"panic: \" + msg);\n}\n\nfunction exit(code) {\n  process.exit(code);\n}\n\nconst __ring_ev_io = { read: (p) => __require(\"fs\").readFileSync(p, \"utf-8\"), write: (p, d) => __require(\"fs\").writeFileSync(p, d, \"utf-8\") };\n\nfunction Option_is_some(self) { return self._tag === \"some\"; }\nfunction Option_is_none(self) { return self._tag === \"none\"; }\nfunction Option_unwrap_or(self, def) { return self._tag === \"some\" ? self._0 : def; }\nfunction Option_unwrap(self) { if (self._tag === \"some\") return self._0; throw new Error(\"panic: called unwrap on none\"); }\n\nfunction Str_len(self) { return self.length; }\nfunction Str_contains(self, s) { return self.includes(s); }\nfunction Str_starts_with(self, s) { return self.startsWith(s); }\nfunction Str_ends_with(self, s) { return self.endsWith(s); }\nfunction Str_slice(self, start, end) { return self.slice(start, end); }\nfunction Str_trim(self) { return self.trim(); }\nfunction Str_to_upper(self) { return self.toUpperCase(); }\nfunction Str_to_lower(self) { return self.toLowerCase(); }\nfunction Str_replace(self, old_str, new_str) { return self.replaceAll(old_str, new_str); }\nfunction Str_split(self, sep) { return self.split(sep); }\nfunction Str_char_at(self, i) { return i >= 0 && i < self.length ? { _tag: \"some\", _0: self[i] } : { _tag: \"none\" }; }\nfunction Str_index_of(self, s) { var i = self.indexOf(s); return i >= 0 ? { _tag: \"some\", _0: i } : { _tag: \"none\" }; }\n\nfunction Str_pad_start(self, length, fill) { return self.padStart(length, fill); }\nfunction Str_pad_end(self, length, fill) { return self.padEnd(length, fill); }\nfunction Str_repeat(self, count) { return self.repeat(count); }\nfunction Str_char_code_at(self, i) { var c = self.charCodeAt(i); return isNaN(c) ? { _tag: \"none\" } : { _tag: \"some\", _0: c }; }\nfunction Str_trim_start(self) { return self.trimStart(); }\nfunction Str_trim_end(self) { return self.trimEnd(); }\nfunction Str_is_empty(self) { return self.length === 0; }\nfunction Str_last_index_of(self, s) { var i = self.lastIndexOf(s); return i >= 0 ? { _tag: \"some\", _0: i } : { _tag: \"none\" }; }\n\nfunction Int_to_str(self) { return String(self); }\nfunction Float_to_str(self) { return String(self); }\nfunction parse_int(s) { var n = parseInt(s, 10); return isNaN(n) ? { _tag: \"none\" } : { _tag: \"some\", _0: n }; }\nfunction parse_float(s) { var n = parseFloat(s); return isNaN(n) ? { _tag: \"none\" } : { _tag: \"some\", _0: n }; }\n\nfunction List_len(self) { return self.length; }\nfunction List_get(self, i) { return i >= 0 && i < self.length ? { _tag: \"some\", _0: self[i] } : { _tag: \"none\" }; }\nfunction List_push(self, x) { self.push(x); }\nfunction List_concat(self, other) { return self.concat(other); }\nfunction List_extend(self, other) { for (var i = 0; i < other.length; i++) self.push(other[i]); }\nfunction List_slice(self, start, end) { return self.slice(start, end); }\nfunction List_reverse(self) { self.reverse(); }\nfunction List_join(self, sep) { return self.join(sep); }\nfunction List_sort(self) { self.sort(function(a, b) { return a < b ? -1 : a > b ? 1 : 0; }); }\nfunction List_sort_by(self, cmp) { self.sort(cmp); }\nfunction List_pop(self) { return self.length > 0 ? { _tag: \"some\", _0: self.pop() } : { _tag: \"none\" }; }\nfunction List_shift(self) { return self.length > 0 ? { _tag: \"some\", _0: self.shift() } : { _tag: \"none\" }; }\nfunction List_clear(self) { self.length = 0; }\nfunction List_find_index(self, f) { var i = self.findIndex(f); return i >= 0 ? { _tag: \"some\", _0: i } : { _tag: \"none\" }; }\nfunction List_set(self, i, v) { self[i] = v; }\nfunction list_clone(l) { return l.slice(); }\n\nfunction map_new() { return new Map(); }\nfunction map_from(entries) { return new Map(entries); }\nfunction map_clone(m) { return new Map(m); }\nfunction _Map_len(self) { return self.size; }\nfunction _Map_get(self, key) { return self.has(key) ? { _tag: \"some\", _0: self.get(key) } : { _tag: \"none\" }; }\nfunction _Map_contains_key(self, key) { return self.has(key); }\nfunction _Map_keys(self) { return Array.from(self.keys()); }\nfunction _Map_values(self) { return Array.from(self.values()); }\nfunction _Map_entries(self) { return Array.from(self.entries()); }\nfunction _Map_insert(self, key, value) { self.set(key, value); }\nfunction _Map_remove(self, key) { self.delete(key); }\nfunction _Map_clear(self) { self.clear(); }\n\nfunction set_new() { return new Set(); }\nfunction set_from(items) { return new Set(items); }\nfunction set_clone(s) { return new Set(s); }\nfunction _Set_len(self) { return self.size; }\nfunction _Set_to_list(self) { return Array.from(self); }\nfunction _Set_insert(self, x) { for (var __v of self) { if (__ring_deep_eq(__v, x)) return; } self.add(x); }\nfunction _Set_remove(self, x) { for (var __v of self) { if (__ring_deep_eq(__v, x)) { self.delete(__v); return; } } }\nfunction _Set_union(self, other) { var r = new Set(self); for (var __v of other) { if (!__ring_set_has(r, __v)) r.add(__v); } return r; }\nfunction _Set_intersect(self, other) { var r = new Set(); for (var __v of self) { if (__ring_set_has(other, __v)) r.add(__v); } return r; }\nfunction _Set_difference(self, other) { var r = new Set(); for (var __v of self) { if (!__ring_set_has(other, __v)) r.add(__v); } return r; }\nfunction _Set_clear(self) { self.clear(); }\n\nfunction __ring_deep_eq(a, b) { if (a === b) return true; if (Array.isArray(a) && Array.isArray(b)) return __ring_tuple_eq(a, b); if (typeof a === \"object\" && a !== null && typeof b === \"object\" && b !== null) { var ka = Object.keys(a), kb = Object.keys(b); if (ka.length !== kb.length) return false; for (var j = 0; j < ka.length; j++) { if (!__ring_deep_eq(a[ka[j]], b[ka[j]])) return false; } return true; } return false; }\nfunction __ring_tuple_eq(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) { if (!__ring_deep_eq(a[i], b[i])) return false; } return true; }\nfunction __ring_set_has(s, x) { for (var __v of s) { if (__ring_deep_eq(__v, x)) return true; } return false; }\nfunction __ring_index(arr, i) { if (i < 0 || i >= arr.length) throw new Error(\"Index out of bounds: \" + i + \", length: \" + arr.length); return arr[i]; }\nfunction __ring_map_index(map, key) { if (!map.has(key)) throw new Error(\"Key not found: \" + key); return map.get(key); }\nfunction __ring_str_index(s, i) { if (i < 0 || i >= s.length) throw new Error(\"Index out of bounds: \" + i + \", length: \" + s.length); return s[i]; }\nfunction string_builder() { return []; }\nfunction StringBuilder_add(self, s) { self.push(s); }\nfunction StringBuilder_line(self, s) { self.push(s); self.push(\"\\n\"); }\nfunction StringBuilder_add_int(self, n) { self.push(String(n)); }\nfunction StringBuilder_to_str(self) { return self.join(\"\"); }\nfunction StringBuilder_len(self) { return self.reduce(function(a, b) { return a + b.length; }, 0); }\n\nfunction json_stringify(value) { return JSON.stringify(value); }\n\nvar __fs = __require(\"fs\"), __path = __require(\"path\");\nfunction read_file(p) { return __fs.readFileSync(p, \"utf-8\"); }\nfunction write_file(p, c) { __fs.writeFileSync(p, c, \"utf-8\"); }\nfunction file_exists(p) { return __fs.existsSync(p); }\nfunction delete_file(p) { __fs.unlinkSync(p); }\nfunction path_join(a, b) { return __path.join(a, b); }\nfunction path_resolve(p) { return __path.resolve(p); }\nfunction path_dirname(p) { return __path.dirname(p); }\nfunction path_basename(p) { return __path.basename(p); }\nfunction path_extname(p) { return __path.extname(p); }\nfunction argv() { return process.argv.slice(2); }\nfunction exit_process(code) { process.exit(code); }\nfunction eprintln(msg) { process.stderr.write(msg + \"\\n\"); }\nfunction cwd() { return process.cwd(); }\n\nconst __Int_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };\nconst __Float_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };\nconst __Str_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };\nconst __Bool_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };\n\nfunction __Option_Eq_eq(a, b, __ring_T_Eq) {\n  if (a._tag !== b._tag) return false;\n  if (a._tag === \"none\") return true;\n  return __ring_T_Eq.eq(a._0, b._0);\n}\nconst __Option_Eq = { eq: __Option_Eq_eq, ne: function(a, b, __ring_T_Eq) { return !__Option_Eq_eq(a, b, __ring_T_Eq); } };\n\nconst __Int_Clone = { clone: function(a) { return a; } };\nconst __Float_Clone = { clone: function(a) { return a; } };\nconst __Str_Clone = { clone: function(a) { return a; } };\nconst __Bool_Clone = { clone: function(a) { return a; } };\nconst __List_Clone = { clone: function(a) { return a.slice(); } };\nconst __Map_Clone = { clone: function(a) { return new Map(a); } };\nconst __Set_Clone = { clone: function(a) { return new Set(a); } };\n\nfunction __Option_Clone_clone(a, __ring_T_Clone) {\n  return a._tag === \"some\" ? { _tag: \"some\", _0: __ring_T_Clone.clone(a._0) } : a;\n}\nconst __Option_Clone = { clone: __Option_Clone_clone };\n\nconst __Int_Ord = { cmp: function(a, b) { return a < b ? -1 : a > b ? 1 : 0; } };\nconst __Float_Ord = { cmp: function(a, b) { return a < b ? -1 : a > b ? 1 : 0; } };\nconst __Str_Ord = { cmp: function(a, b) { return a < b ? -1 : a > b ? 1 : 0; } };\nconst __Bool_Ord = { cmp: function(a, b) { return a === b ? 0 : a ? 1 : -1; } };\n\nfunction __Int_Debug_debug(a) { return String(a); }\nconst __Int_Debug = { debug: __Int_Debug_debug };\nfunction __Float_Debug_debug(a) { return String(a); }\nconst __Float_Debug = { debug: __Float_Debug_debug };\nfunction __Str_Debug_debug(a) { return '\"' + a + '\"'; }\nconst __Str_Debug = { debug: __Str_Debug_debug };\nfunction __Bool_Debug_debug(a) { return String(a); }\nconst __Bool_Debug = { debug: __Bool_Debug_debug };\n\nfunction __Option_Debug_debug(a, __ring_T_Debug) {\n  return a._tag === \"some\" ? \"some(\" + __ring_T_Debug.debug(a._0) + \")\" : \"none\";\n}\nconst __Option_Debug = { debug: __Option_Debug_debug };\n\nfunction __List_Debug_debug(a, __ring_T_Debug) {\n  return \"[\" + a.map(function(x) { return __ring_T_Debug.debug(x); }).join(\", \") + \"]\";\n}\nconst __List_Debug = { debug: __List_Debug_debug };\n\nfunction __Map_Debug_debug(a) { return \"Map{...}\"; }\nconst __Map_Debug = { debug: __Map_Debug_debug };\nfunction __Set_Debug_debug(a) { return \"Set{...}\"; }\nconst __Set_Debug = { debug: __Set_Debug_debug };\n\nfunction Option_some(_0) { return { _tag: \"some\", _0 }; }\nconst Option_none = Object.freeze({ _tag: \"none\" });\n";
}

function runtime_esm_code() {
  const names = RUNTIME_EXPORT_NAMES;
  const joined = List_join(names, ", ");
  const export_line = `
export { ${joined} };
`;
  const code = RUNTIME_CODE();
  return `${code}${export_line}`;
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


export { RUNTIME_CODE, RUNTIME_EXPORT_NAMES, runtime_esm_code };