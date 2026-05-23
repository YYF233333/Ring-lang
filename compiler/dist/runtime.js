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

function RUNTIME_CODE() {
  let lines = [""];
  List_clear(lines);
  List_push(lines, "import { createRequire as __cr } from \"node:module\";");
  List_push(lines, "const __require = __cr(import.meta.url);");
  List_push(lines, "// === Ring-lang Runtime ===");
  List_push(lines, "class __EffectAbort {");
  List_push(lines, "  constructor(effect, value) {");
  List_push(lines, "    this.effect = effect;");
  List_push(lines, "    this.value = value;");
  List_push(lines, "  }");
  List_push(lines, "}");
  List_push(lines, "");
  List_push(lines, "function Cell(value) { return { value }; }");
  List_push(lines, "function Cell_get(self, __ring_ev_mut) { return self.value; }");
  List_push(lines, "function Cell_set(self, val, __ring_ev_mut) { self.value = val; }");
  List_push(lines, "function Cell_update(self, f, __ring_ev_mut) { self.value = f(self.value); }");
  List_push(lines, "");
  List_push(lines, "function __ring_raise_fail(msg) {");
  List_push(lines, "  throw new __EffectAbort(\"fail\", msg);");
  List_push(lines, "}");
  List_push(lines, "");
  List_push(lines, "function __match_fail(value) {");
  List_push(lines, "  throw new Error(\"Non-exhaustive match: \" + JSON.stringify(value));");
  List_push(lines, "}");
  List_push(lines, "");
  List_push(lines, "function print(value) {");
  List_push(lines, "  console.log(value);");
  List_push(lines, "}");
  List_push(lines, "");
  List_push(lines, "function assert(cond, msg) {");
  List_push(lines, "  if (!cond) {");
  List_push(lines, "    throw new Error(\"Assertion failed\" + (msg ? \": \" + msg : \"\"));");
  List_push(lines, "  }");
  List_push(lines, "}");
  List_push(lines, "");
  List_push(lines, "function panic(msg) {");
  List_push(lines, "  throw new Error(\"panic: \" + msg);");
  List_push(lines, "}");
  List_push(lines, "");
  List_push(lines, "function exit(code) {");
  List_push(lines, "  process.exit(code);");
  List_push(lines, "}");
  List_push(lines, "");
  List_push(lines, "const __ring_ev_io = { read: (p) => __require(\"fs\").readFileSync(p, \"utf-8\"), write: (p, d) => __require(\"fs\").writeFileSync(p, d, \"utf-8\") };");
  List_push(lines, "");
  List_push(lines, "function Option_is_some(self) { return self._tag === \"some\"; }");
  List_push(lines, "function Option_is_none(self) { return self._tag === \"none\"; }");
  List_push(lines, "function Option_unwrap_or(self, def) { return self._tag === \"some\" ? self._0 : def; }");
  List_push(lines, "function Option_unwrap(self) { if (self._tag === \"some\") return self._0; throw new Error(\"panic: called unwrap on none\"); }");
  List_push(lines, "");
  List_push(lines, "function Str_len(self) { return self.length; }");
  List_push(lines, "function Str_contains(self, s) { return self.includes(s); }");
  List_push(lines, "function Str_starts_with(self, s) { return self.startsWith(s); }");
  List_push(lines, "function Str_ends_with(self, s) { return self.endsWith(s); }");
  List_push(lines, "function Str_slice(self, start, end) { return self.slice(start, end); }");
  List_push(lines, "function Str_trim(self) { return self.trim(); }");
  List_push(lines, "function Str_to_upper(self) { return self.toUpperCase(); }");
  List_push(lines, "function Str_to_lower(self) { return self.toLowerCase(); }");
  List_push(lines, "function Str_replace(self, old_str, new_str) { return self.replaceAll(old_str, new_str); }");
  List_push(lines, "function Str_split(self, sep) { return self.split(sep); }");
  List_push(lines, "function Str_char_at(self, i) { return i >= 0 && i < self.length ? { _tag: \"some\", _0: self[i] } : { _tag: \"none\" }; }");
  List_push(lines, "function Str_index_of(self, s) { var i = self.indexOf(s); return i >= 0 ? { _tag: \"some\", _0: i } : { _tag: \"none\" }; }");
  List_push(lines, "");
  List_push(lines, "function Str_pad_start(self, length, fill) { return self.padStart(length, fill); }");
  List_push(lines, "function Str_pad_end(self, length, fill) { return self.padEnd(length, fill); }");
  List_push(lines, "function Str_repeat(self, count) { return self.repeat(count); }");
  List_push(lines, "function Str_char_code_at(self, i) { var c = self.charCodeAt(i); return isNaN(c) ? { _tag: \"none\" } : { _tag: \"some\", _0: c }; }");
  List_push(lines, "function Str_trim_start(self) { return self.trimStart(); }");
  List_push(lines, "function Str_trim_end(self) { return self.trimEnd(); }");
  List_push(lines, "function Str_is_empty(self) { return self.length === 0; }");
  List_push(lines, "function Str_last_index_of(self, s) { var i = self.lastIndexOf(s); return i >= 0 ? { _tag: \"some\", _0: i } : { _tag: \"none\" }; }");
  List_push(lines, "");
  List_push(lines, "function Int_to_str(self) { return String(self); }");
  List_push(lines, "function Float_to_str(self) { return String(self); }");
  List_push(lines, "function parse_int(s) { var n = parseInt(s, 10); return isNaN(n) ? { _tag: \"none\" } : { _tag: \"some\", _0: n }; }");
  List_push(lines, "function parse_float(s) { var n = parseFloat(s); return isNaN(n) ? { _tag: \"none\" } : { _tag: \"some\", _0: n }; }");
  List_push(lines, "");
  List_push(lines, "function List_len(self) { return self.length; }");
  List_push(lines, "function List_get(self, i) { return i >= 0 && i < self.length ? { _tag: \"some\", _0: self[i] } : { _tag: \"none\" }; }");
  List_push(lines, "function List_push(self, x) { self.push(x); }");
  List_push(lines, "function List_concat(self, other) { return self.concat(other); }");
  List_push(lines, "function List_extend(self, other) { for (var i = 0; i < other.length; i++) self.push(other[i]); }");
  List_push(lines, "function List_slice(self, start, end) { return self.slice(start, end); }");
  List_push(lines, "function List_reverse(self) { self.reverse(); }");
  List_push(lines, "function List_join(self, sep) { return self.join(sep); }");
  List_push(lines, "function List_sort(self) { self.sort(function(a, b) { return a < b ? -1 : a > b ? 1 : 0; }); }");
  List_push(lines, "function List_sort_by(self, cmp) { self.sort(cmp); }");
  List_push(lines, "function List_pop(self) { return self.length > 0 ? { _tag: \"some\", _0: self.pop() } : { _tag: \"none\" }; }");
  List_push(lines, "function List_shift(self) { return self.length > 0 ? { _tag: \"some\", _0: self.shift() } : { _tag: \"none\" }; }");
  List_push(lines, "function List_clear(self) { self.length = 0; }");
  List_push(lines, "function List_find_index(self, f) { var i = self.findIndex(f); return i >= 0 ? { _tag: \"some\", _0: i } : { _tag: \"none\" }; }");
  List_push(lines, "function List_set(self, i, v) { self[i] = v; }");
  List_push(lines, "function list_clone(l) { return l.slice(); }");
  List_push(lines, "");
  List_push(lines, "function map_new() { return new Map(); }");
  List_push(lines, "function map_from(entries) { return new Map(entries); }");
  List_push(lines, "function map_clone(m) { return new Map(m); }");
  List_push(lines, "function _Map_len(self) { return self.size; }");
  List_push(lines, "function _Map_get(self, key) { return self.has(key) ? { _tag: \"some\", _0: self.get(key) } : { _tag: \"none\" }; }");
  List_push(lines, "function _Map_contains_key(self, key) { return self.has(key); }");
  List_push(lines, "function _Map_keys(self) { return Array.from(self.keys()); }");
  List_push(lines, "function _Map_values(self) { return Array.from(self.values()); }");
  List_push(lines, "function _Map_entries(self) { return Array.from(self.entries()); }");
  List_push(lines, "function _Map_insert(self, key, value) { self.set(key, value); }");
  List_push(lines, "function _Map_remove(self, key) { self.delete(key); }");
  List_push(lines, "function _Map_clear(self) { self.clear(); }");
  List_push(lines, "");
  List_push(lines, "function set_new() { return new Set(); }");
  List_push(lines, "function set_from(items) { return new Set(items); }");
  List_push(lines, "function set_clone(s) { return new Set(s); }");
  List_push(lines, "function _Set_len(self) { return self.size; }");
  List_push(lines, "function _Set_to_list(self) { return Array.from(self); }");
  List_push(lines, "function _Set_insert(self, x) { for (var __v of self) { if (__ring_deep_eq(__v, x)) return; } self.add(x); }");
  List_push(lines, "function _Set_remove(self, x) { for (var __v of self) { if (__ring_deep_eq(__v, x)) { self.delete(__v); return; } } }");
  List_push(lines, "function _Set_union(self, other) { var r = new Set(self); for (var __v of other) { if (!__ring_set_has(r, __v)) r.add(__v); } return r; }");
  List_push(lines, "function _Set_intersect(self, other) { var r = new Set(); for (var __v of self) { if (__ring_set_has(other, __v)) r.add(__v); } return r; }");
  List_push(lines, "function _Set_difference(self, other) { var r = new Set(); for (var __v of self) { if (!__ring_set_has(other, __v)) r.add(__v); } return r; }");
  List_push(lines, "function _Set_clear(self) { self.clear(); }");
  List_push(lines, "");
  List_push(lines, "function __ring_deep_eq(a, b) { if (a === b) return true; if (Array.isArray(a) && Array.isArray(b)) return __ring_tuple_eq(a, b); if (typeof a === \"object\" && a !== null && typeof b === \"object\" && b !== null) { var ka = Object.keys(a), kb = Object.keys(b); if (ka.length !== kb.length) return false; for (var j = 0; j < ka.length; j++) { if (!__ring_deep_eq(a[ka[j]], b[ka[j]])) return false; } return true; } return false; }");
  List_push(lines, "function __ring_tuple_eq(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) { if (!__ring_deep_eq(a[i], b[i])) return false; } return true; }");
  List_push(lines, "function __ring_set_has(s, x) { for (var __v of s) { if (__ring_deep_eq(__v, x)) return true; } return false; }");
  List_push(lines, "function __ring_index(arr, i) { if (i < 0 || i >= arr.length) throw new Error(\"Index out of bounds: \" + i + \", length: \" + arr.length); return arr[i]; }");
  List_push(lines, "function __ring_map_index(map, key) { if (!map.has(key)) throw new Error(\"Key not found: \" + key); return map.get(key); }");
  List_push(lines, "function __ring_str_index(s, i) { if (i < 0 || i >= s.length) throw new Error(\"Index out of bounds: \" + i + \", length: \" + s.length); return s[i]; }");
  List_push(lines, "function string_builder() { return []; }");
  List_push(lines, "function StringBuilder_add(self, s) { self.push(s); }");
  List_push(lines, "function StringBuilder_line(self, s) { self.push(s); self.push(\"\\n\"); }");
  List_push(lines, "function StringBuilder_add_int(self, n) { self.push(String(n)); }");
  List_push(lines, "function StringBuilder_to_str(self) { return self.join(\"\"); }");
  List_push(lines, "function StringBuilder_len(self) { return self.reduce(function(a, b) { return a + b.length; }, 0); }");
  List_push(lines, "");
  List_push(lines, "function json_stringify(value) { return JSON.stringify(value); }");
  List_push(lines, "");
  List_push(lines, "var __fs = __require(\"fs\"), __path = __require(\"path\");");
  List_push(lines, "function read_file(p) { return __fs.readFileSync(p, \"utf-8\"); }");
  List_push(lines, "function write_file(p, c) { __fs.writeFileSync(p, c, \"utf-8\"); }");
  List_push(lines, "function file_exists(p) { return __fs.existsSync(p); }");
  List_push(lines, "function delete_file(p) { __fs.unlinkSync(p); }");
  List_push(lines, "function path_join(a, b) { return __path.join(a, b); }");
  List_push(lines, "function path_resolve(p) { return __path.resolve(p); }");
  List_push(lines, "function path_dirname(p) { return __path.dirname(p); }");
  List_push(lines, "function path_basename(p) { return __path.basename(p); }");
  List_push(lines, "function path_extname(p) { return __path.extname(p); }");
  List_push(lines, "function argv() { return process.argv.slice(2); }");
  List_push(lines, "function exit_process(code) { process.exit(code); }");
  List_push(lines, "function eprintln(msg) { process.stderr.write(msg + \"\\n\"); }");
  List_push(lines, "function cwd() { return process.cwd(); }");
  List_push(lines, "");
  List_push(lines, "const __Int_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };");
  List_push(lines, "const __Float_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };");
  List_push(lines, "const __Str_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };");
  List_push(lines, "const __Bool_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };");
  List_push(lines, "");
  List_push(lines, "function __Option_Eq_eq(a, b, __ring_T_Eq) {");
  List_push(lines, "  if (a._tag !== b._tag) return false;");
  List_push(lines, "  if (a._tag === \"none\") return true;");
  List_push(lines, "  return __ring_T_Eq.eq(a._0, b._0);");
  List_push(lines, "}");
  List_push(lines, "const __Option_Eq = { eq: __Option_Eq_eq, ne: function(a, b, __ring_T_Eq) { return !__Option_Eq_eq(a, b, __ring_T_Eq); } };");
  List_push(lines, "");
  List_push(lines, "const __Int_Clone = { clone: function(a) { return a; } };");
  List_push(lines, "const __Float_Clone = { clone: function(a) { return a; } };");
  List_push(lines, "const __Str_Clone = { clone: function(a) { return a; } };");
  List_push(lines, "const __Bool_Clone = { clone: function(a) { return a; } };");
  List_push(lines, "const __List_Clone = { clone: function(a) { return a.slice(); } };");
  List_push(lines, "const __Map_Clone = { clone: function(a) { return new Map(a); } };");
  List_push(lines, "const __Set_Clone = { clone: function(a) { return new Set(a); } };");
  List_push(lines, "");
  List_push(lines, "function __Option_Clone_clone(a, __ring_T_Clone) {");
  List_push(lines, "  return a._tag === \"some\" ? { _tag: \"some\", _0: __ring_T_Clone.clone(a._0) } : a;");
  List_push(lines, "}");
  List_push(lines, "const __Option_Clone = { clone: __Option_Clone_clone };");
  List_push(lines, "");
  List_push(lines, "const __Int_Ord = { cmp: function(a, b) { return a < b ? -1 : a > b ? 1 : 0; } };");
  List_push(lines, "const __Float_Ord = { cmp: function(a, b) { return a < b ? -1 : a > b ? 1 : 0; } };");
  List_push(lines, "const __Str_Ord = { cmp: function(a, b) { return a < b ? -1 : a > b ? 1 : 0; } };");
  List_push(lines, "const __Bool_Ord = { cmp: function(a, b) { return a === b ? 0 : a ? 1 : -1; } };");
  List_push(lines, "");
  List_push(lines, "function __Int_Debug_debug(a) { return String(a); }");
  List_push(lines, "const __Int_Debug = { debug: __Int_Debug_debug };");
  List_push(lines, "function __Float_Debug_debug(a) { return String(a); }");
  List_push(lines, "const __Float_Debug = { debug: __Float_Debug_debug };");
  List_push(lines, "function __Str_Debug_debug(a) { return '\"' + a + '\"'; }");
  List_push(lines, "const __Str_Debug = { debug: __Str_Debug_debug };");
  List_push(lines, "function __Bool_Debug_debug(a) { return String(a); }");
  List_push(lines, "const __Bool_Debug = { debug: __Bool_Debug_debug };");
  List_push(lines, "");
  List_push(lines, "function __Option_Debug_debug(a, __ring_T_Debug) {");
  List_push(lines, "  return a._tag === \"some\" ? \"some(\" + __ring_T_Debug.debug(a._0) + \")\" : \"none\";");
  List_push(lines, "}");
  List_push(lines, "const __Option_Debug = { debug: __Option_Debug_debug };");
  List_push(lines, "");
  List_push(lines, "function __List_Debug_debug(a, __ring_T_Debug) {");
  List_push(lines, "  return \"[\" + a.map(function(x) { return __ring_T_Debug.debug(x); }).join(\", \") + \"]\";");
  List_push(lines, "}");
  List_push(lines, "const __List_Debug = { debug: __List_Debug_debug };");
  List_push(lines, "");
  List_push(lines, "function __Map_Debug_debug(a) { return \"Map{...}\"; }");
  List_push(lines, "const __Map_Debug = { debug: __Map_Debug_debug };");
  List_push(lines, "function __Set_Debug_debug(a) { return \"Set{...}\"; }");
  List_push(lines, "const __Set_Debug = { debug: __Set_Debug_debug };");
  List_push(lines, "");
  List_push(lines, "function Option_some(_0) { return { _tag: \"some\", _0 }; }");
  List_push(lines, "const Option_none = Object.freeze({ _tag: \"none\" });");
  List_push(lines, "");
  return List_join(lines, "\n");
}

const RUNTIME_EXPORT_NAMES = ["__EffectAbort", "__ring_raise_fail", "Cell", "Cell_get", "Cell_set", "Cell_update", "__match_fail", "__ring_deep_eq", "__ring_tuple_eq", "__ring_set_has", "__ring_index", "__ring_map_index", "__ring_str_index", "print", "assert", "panic", "exit", "json_stringify", "__ring_ev_io", "Option_some", "Option_none", "Option_is_some", "Option_is_none", "Option_unwrap_or", "Option_unwrap", "Str_len", "Str_contains", "Str_starts_with", "Str_ends_with", "Str_slice", "Str_trim", "Str_to_upper", "Str_to_lower", "Str_replace", "Str_split", "Str_char_at", "Str_index_of", "Str_pad_start", "Str_pad_end", "Str_repeat", "Str_char_code_at", "Str_trim_start", "Str_trim_end", "Str_is_empty", "Str_last_index_of", "Int_to_str", "Float_to_str", "parse_int", "parse_float", "List_len", "List_get", "List_push", "List_concat", "List_extend", "List_slice", "List_reverse", "List_join", "List_sort", "List_sort_by", "List_set", "List_pop", "List_shift", "List_clear", "List_find_index", "list_clone", "map_new", "map_from", "map_clone", "_Map_len", "_Map_get", "_Map_contains_key", "_Map_keys", "_Map_values", "_Map_entries", "_Map_insert", "_Map_remove", "_Map_clear", "set_new", "set_from", "set_clone", "_Set_len", "_Set_to_list", "_Set_insert", "_Set_remove", "_Set_union", "_Set_intersect", "_Set_difference", "_Set_clear", "string_builder", "StringBuilder_add", "StringBuilder_line", "StringBuilder_add_int", "StringBuilder_to_str", "StringBuilder_len", "read_file", "write_file", "file_exists", "delete_file", "path_join", "path_resolve", "path_dirname", "path_basename", "path_extname", "argv", "exit_process", "eprintln", "cwd", "__Int_Eq", "__Float_Eq", "__Str_Eq", "__Bool_Eq", "__Option_Eq", "__Int_Clone", "__Float_Clone", "__Str_Clone", "__Bool_Clone", "__List_Clone", "__Map_Clone", "__Set_Clone", "__Option_Clone", "__Int_Ord", "__Float_Ord", "__Str_Ord", "__Bool_Ord", "__Int_Debug", "__Float_Debug", "__Str_Debug", "__Bool_Debug", "__Option_Debug", "__List_Debug", "__Map_Debug", "__Set_Debug"];

function runtime_esm_code() {
  const names = RUNTIME_EXPORT_NAMES;
  const joined = List_join(names, ", ");
  const export_line = `
export { ${joined} };
`;
  const code = RUNTIME_CODE();
  return `${code}${export_line}`;
}

function __StringBuilder_Eq_eq(self, other) {
  return true;
}
const __StringBuilder_Eq = { eq: __StringBuilder_Eq_eq, ne: function(self, other) { return !__StringBuilder_Eq_eq(self, other); } };

function __Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return __ring_T_Eq.eq(self._0, other._0);
    case "Err": return __ring_E_Eq.eq(self._0, other._0);
    default: return true;
  }
}
const __Result_Eq = { eq: __Result_Eq_eq, ne: function(self, other, __ring_T_Eq, __ring_E_Eq) { return !__Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq); } };

function __StringBuilder_Clone_clone(self) {
  return new StringBuilder();
}
const __StringBuilder_Clone = { clone: __StringBuilder_Clone_clone };

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

function __StringBuilder_Debug_debug(self) {
  return "StringBuilder";
}
const __StringBuilder_Debug = { debug: __StringBuilder_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { RUNTIME_CODE, RUNTIME_EXPORT_NAMES, runtime_esm_code };