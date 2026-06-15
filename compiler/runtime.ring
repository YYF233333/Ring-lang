pub fn RUNTIME_CODE() -> Str {
    r#"import { createRequire as __cr } from "node:module";
const __require = __cr(import.meta.url);
try { Object.assign(globalThis, __require('../llvm-addon/build/Release/llvm_addon.node')); } catch(e) {}
// === Ring-lang Runtime ===
class __EffectAbort {
  constructor(effect, value) {
    this.effect = effect;
    this.value = value;
  }
}

function Cell(value) { return { value }; }
function Cell_get(self, __ring_ev_mut) { return self.value; }
function Cell_set(self, val, __ring_ev_mut) { self.value = val; }
function Cell_update(self, f, __ring_ev_mut) { self.value = f(self.value); }

function __ring_raise_fail(msg) {
  throw new __EffectAbort("fail", msg);
}

function __match_fail(value) {
  throw new Error("Non-exhaustive match: " + JSON.stringify(value));
}

function print(value) {
  console.log(value);
}

function assert(cond, msg) {
  if (!cond) {
    throw new Error("Assertion failed" + (msg ? ": " + msg : ""));
  }
}

function panic(msg) {
  throw new Error("panic: " + msg);
}

function exit(code) {
  process.exit(code);
}

const __ring_ev_io = { read: (p) => __require("fs").readFileSync(p, "utf-8"), write: (p, d) => __require("fs").writeFileSync(p, d, "utf-8") };

function Option_is_some(self) { return self._tag === "some"; }
function Option_is_none(self) { return self._tag === "none"; }
function Option_unwrap_or(self, def) { return self._tag === "some" ? self._0 : def; }
function Option_unwrap(self) { if (self._tag === "some") return self._0; throw new Error("panic: called unwrap on none"); }

function Str_len(self) { return self.length; }
function Str_contains(self, s) { return self.includes(s); }
function Str_starts_with(self, s) { return self.startsWith(s); }
function Str_ends_with(self, s) { return self.endsWith(s); }
function Str_slice(self, start, end) { return self.slice(start, end); }
function Str_trim(self) { return self.trim(); }
function Str_to_upper(self) { return self.toUpperCase(); }
function Str_to_lower(self) { return self.toLowerCase(); }
function Str_replace(self, old_str, new_str) { return self.replaceAll(old_str, new_str); }
function Str_split(self, sep) { return self.split(sep); }
function Str_char_at(self, i) { return i >= 0 && i < self.length ? { _tag: "some", _0: self[i] } : { _tag: "none" }; }
function Str_index_of(self, s) { var i = self.indexOf(s); return i >= 0 ? { _tag: "some", _0: i } : { _tag: "none" }; }

function Str_pad_start(self, length, fill) { return self.padStart(length, fill); }
function Str_pad_end(self, length, fill) { return self.padEnd(length, fill); }
function Str_repeat(self, count) { return self.repeat(count); }
function Str_char_code_at(self, i) { var c = self.charCodeAt(i); return isNaN(c) ? { _tag: "none" } : { _tag: "some", _0: c }; }
function Str_trim_start(self) { return self.trimStart(); }
function Str_trim_end(self) { return self.trimEnd(); }
function Str_is_empty(self) { return self.length === 0; }
function Str_last_index_of(self, s) { var i = self.lastIndexOf(s); return i >= 0 ? { _tag: "some", _0: i } : { _tag: "none" }; }

function Int_to_str(self) { return String(self); }
function Float_to_str(self) { return String(self); }
function parse_int(s) { var n = parseInt(s, 10); return isNaN(n) ? { _tag: "none" } : { _tag: "some", _0: n }; }
function parse_float(s) { var n = parseFloat(s); return isNaN(n) ? { _tag: "none" } : { _tag: "some", _0: n }; }

function List_len(self) { return self.length; }
function List_get(self, i) { return i >= 0 && i < self.length ? { _tag: "some", _0: self[i] } : { _tag: "none" }; }
function List_push(self, x) { self.push(x); }
function List_concat(self, other) { return self.concat(other); }
function List_extend(self, other) { for (var i = 0; i < other.length; i++) self.push(other[i]); }
function List_slice(self, start, end) { return self.slice(start, end); }
function List_reverse(self) { self.reverse(); }
function List_join(self, sep) { return self.join(sep); }
function List_sort(self) { self.sort(function(a, b) { return a < b ? -1 : a > b ? 1 : 0; }); }
function List_sort_by(self, cmp) { self.sort(cmp); }
function List_pop(self) { return self.length > 0 ? { _tag: "some", _0: self.pop() } : { _tag: "none" }; }
function List_shift(self) { return self.length > 0 ? { _tag: "some", _0: self.shift() } : { _tag: "none" }; }
function List_clear(self) { self.length = 0; }
function List_find_index(self, f) { var i = self.findIndex(f); return i >= 0 ? { _tag: "some", _0: i } : { _tag: "none" }; }
function List_set(self, i, v) { self[i] = v; }
function list_clone(l) { return l.slice(); }

function map_new() { return new Map(); }
function map_from(entries) { return new Map(entries); }
function map_clone(m) { return new Map(m); }
function _Map_len(self) { return self.size; }
function _Map_get(self, key) { return self.has(key) ? { _tag: "some", _0: self.get(key) } : { _tag: "none" }; }
function _Map_contains_key(self, key) { return self.has(key); }
function _Map_keys(self) { return Array.from(self.keys()); }
function _Map_values(self) { return Array.from(self.values()); }
function _Map_entries(self) { return Array.from(self.entries()); }
function _Map_insert(self, key, value) { self.set(key, value); }
function _Map_remove(self, key) { self.delete(key); }
function _Map_clear(self) { self.clear(); }

function set_new() { return new Set(); }
function set_from(items) { return new Set(items); }
function set_clone(s) { return new Set(s); }
function _Set_len(self) { return self.size; }
function _Set_to_list(self) { return Array.from(self); }
function _Set_insert(self, x) { for (var __v of self) { if (__ring_deep_eq(__v, x)) return; } self.add(x); }
function _Set_remove(self, x) { for (var __v of self) { if (__ring_deep_eq(__v, x)) { self.delete(__v); return; } } }
function _Set_union(self, other) { var r = new Set(self); for (var __v of other) { if (!__ring_set_has(r, __v)) r.add(__v); } return r; }
function _Set_intersect(self, other) { var r = new Set(); for (var __v of self) { if (__ring_set_has(other, __v)) r.add(__v); } return r; }
function _Set_difference(self, other) { var r = new Set(); for (var __v of self) { if (!__ring_set_has(other, __v)) r.add(__v); } return r; }
function _Set_clear(self) { self.clear(); }

function __ring_deep_eq(a, b) { if (a === b) return true; if (Array.isArray(a) && Array.isArray(b)) return __ring_tuple_eq(a, b); if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) { var ka = Object.keys(a), kb = Object.keys(b); if (ka.length !== kb.length) return false; for (var j = 0; j < ka.length; j++) { if (!__ring_deep_eq(a[ka[j]], b[ka[j]])) return false; } return true; } return false; }
function __ring_tuple_eq(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) { if (!__ring_deep_eq(a[i], b[i])) return false; } return true; }
function __ring_set_has(s, x) { for (var __v of s) { if (__ring_deep_eq(__v, x)) return true; } return false; }
function __ring_index(arr, i) { if (i < 0 || i >= arr.length) throw new Error("Index out of bounds: " + i + ", length: " + arr.length); return arr[i]; }
function __ring_map_index(map, key) { if (!map.has(key)) throw new Error("Key not found: " + key); return map.get(key); }
function __ring_str_index(s, i) { if (i < 0 || i >= s.length) throw new Error("Index out of bounds: " + i + ", length: " + s.length); return s[i]; }
function string_builder() { return []; }
function StringBuilder_add(self, s) { self.push(s); }
function StringBuilder_line(self, s) { self.push(s); self.push("\n"); }
function StringBuilder_add_int(self, n) { self.push(String(n)); }
function StringBuilder_to_str(self) { return self.join(""); }
function StringBuilder_len(self) { return self.reduce(function(a, b) { return a + b.length; }, 0); }

function json_stringify(value) { return JSON.stringify(value); }

var __fs = __require("fs"), __path = __require("path");
function read_file(p) { return __fs.readFileSync(p, "utf-8"); }
function write_file(p, c) { __fs.writeFileSync(p, c, "utf-8"); }
function file_exists(p) { return __fs.existsSync(p); }
function delete_file(p) { __fs.unlinkSync(p); }
function path_join(a, b) { return __path.join(a, b); }
function path_resolve(p) { return __path.resolve(p); }
function path_dirname(p) { return __path.dirname(p); }
function path_basename(p) { return __path.basename(p); }
function path_extname(p) { return __path.extname(p); }
function argv() { return process.argv.slice(2); }
function exit_process(code) { process.exit(code); }
function eprintln(msg) { process.stderr.write(msg + "\n"); }
function cwd() { return process.cwd(); }

const __Int_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };
const __Float_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };
const __Str_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };
const __Bool_Eq = { eq: function(a, b) { return a === b; }, ne: function(a, b) { return a !== b; } };

function __Option_Eq_eq(a, b, __ring_T_Eq) {
  if (a._tag !== b._tag) return false;
  if (a._tag === "none") return true;
  return __ring_T_Eq.eq(a._0, b._0);
}
const __Option_Eq = { eq: __Option_Eq_eq, ne: function(a, b, __ring_T_Eq) { return !__Option_Eq_eq(a, b, __ring_T_Eq); } };

const __Int_Clone = { clone: function(a) { return a; } };
const __Float_Clone = { clone: function(a) { return a; } };
const __Str_Clone = { clone: function(a) { return a; } };
const __Bool_Clone = { clone: function(a) { return a; } };
const __List_Clone = { clone: function(a) { return a.slice(); } };
const __Map_Clone = { clone: function(a) { return new Map(a); } };
const __Set_Clone = { clone: function(a) { return new Set(a); } };

function __Option_Clone_clone(a, __ring_T_Clone) {
  return a._tag === "some" ? { _tag: "some", _0: __ring_T_Clone.clone(a._0) } : a;
}
const __Option_Clone = { clone: __Option_Clone_clone };

const __Int_Ord = { cmp: function(a, b) { return a < b ? -1 : a > b ? 1 : 0; } };
const __Float_Ord = { cmp: function(a, b) { return a < b ? -1 : a > b ? 1 : 0; } };
const __Str_Ord = { cmp: function(a, b) { return a < b ? -1 : a > b ? 1 : 0; } };
const __Bool_Ord = { cmp: function(a, b) { return a === b ? 0 : a ? 1 : -1; } };

function __Int_Debug_debug(a) { return String(a); }
const __Int_Debug = { debug: __Int_Debug_debug };
function __Float_Debug_debug(a) { return String(a); }
const __Float_Debug = { debug: __Float_Debug_debug };
function __Str_Debug_debug(a) { return '"' + a + '"'; }
const __Str_Debug = { debug: __Str_Debug_debug };
function __Bool_Debug_debug(a) { return String(a); }
const __Bool_Debug = { debug: __Bool_Debug_debug };

function __Option_Debug_debug(a, __ring_T_Debug) {
  return a._tag === "some" ? "some(" + __ring_T_Debug.debug(a._0) + ")" : "none";
}
const __Option_Debug = { debug: __Option_Debug_debug };

function __List_Debug_debug(a, __ring_T_Debug) {
  return "[" + a.map(function(x) { return __ring_T_Debug.debug(x); }).join(", ") + "]";
}
const __List_Debug = { debug: __List_Debug_debug };

function __Map_Debug_debug(a) { return "Map{...}"; }
const __Map_Debug = { debug: __Map_Debug_debug };
function __Set_Debug_debug(a) { return "Set{...}"; }
const __Set_Debug = { debug: __Set_Debug_debug };

function Option_some(_0) { return { _tag: "some", _0 }; }
const Option_none = Object.freeze({ _tag: "none" });
"#
}

pub const RUNTIME_EXPORT_NAMES: List<Str> =
    ["__EffectAbort", "__ring_raise_fail", "Cell", "Cell_get", "Cell_set", "Cell_update",
     "__match_fail", "__ring_deep_eq", "__ring_tuple_eq", "__ring_set_has", "__ring_index", "__ring_map_index", "__ring_str_index",
     "print", "assert", "panic", "exit", "json_stringify", "__ring_ev_io",
     "Option_some", "Option_none",
     "Option_is_some", "Option_is_none", "Option_unwrap_or", "Option_unwrap",
     "Str_len", "Str_contains", "Str_starts_with", "Str_ends_with",
     "Str_slice", "Str_trim", "Str_to_upper", "Str_to_lower", "Str_replace",
     "Str_split", "Str_char_at", "Str_index_of",
     "Str_pad_start", "Str_pad_end", "Str_repeat", "Str_char_code_at",
     "Str_trim_start", "Str_trim_end", "Str_is_empty", "Str_last_index_of",
     "Int_to_str", "Float_to_str", "parse_int", "parse_float",
     "List_len", "List_get",
     "List_push", "List_concat", "List_extend", "List_slice",
     "List_reverse", "List_join", "List_sort", "List_sort_by",
     "List_set", "List_pop", "List_shift", "List_clear", "List_find_index",
     "list_clone",
     "map_new", "map_from", "map_clone",
     "_Map_len", "_Map_get", "_Map_contains_key",
     "_Map_keys", "_Map_values", "_Map_entries", "_Map_insert", "_Map_remove", "_Map_clear",
     "set_new", "set_from", "set_clone",
     "_Set_len", "_Set_to_list",
     "_Set_insert", "_Set_remove",
     "_Set_union", "_Set_intersect", "_Set_difference", "_Set_clear",
     "string_builder",
     "StringBuilder_add", "StringBuilder_line", "StringBuilder_add_int",
     "StringBuilder_to_str", "StringBuilder_len",
     "read_file", "write_file", "file_exists", "delete_file",
     "path_join", "path_resolve", "path_dirname", "path_basename", "path_extname",
     "argv", "exit_process", "eprintln", "cwd",
     "__Int_Eq", "__Float_Eq", "__Str_Eq", "__Bool_Eq", "__Option_Eq",
     "__Int_Clone", "__Float_Clone", "__Str_Clone", "__Bool_Clone",
     "__List_Clone", "__Map_Clone", "__Set_Clone", "__Option_Clone",
     "__Int_Ord", "__Float_Ord", "__Str_Ord", "__Bool_Ord",
     "__Int_Debug", "__Float_Debug", "__Str_Debug", "__Bool_Debug",
     "__Option_Debug", "__List_Debug", "__Map_Debug", "__Set_Debug"]

pub fn runtime_esm_code() -> Str {
    let names = RUNTIME_EXPORT_NAMES
    let joined = names.join(", ")
    let export_line = "\nexport { ${joined} };\n"
    let code = RUNTIME_CODE()
    "${code}${export_line}"
}
