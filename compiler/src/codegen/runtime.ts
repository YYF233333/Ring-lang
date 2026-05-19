// Ring-lang runtime helpers — emitted as preamble in generated JS.

export const RUNTIME_CODE = `// === Ring-lang Runtime ===
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

function __match_fail(value) {
  throw new Error("Non-exhaustive match: " + JSON.stringify(value));
}

function print(...args) {
  console.log(...args);
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
function Str_byte_at(self, i) { return i >= 0 && i < self.length ? { _tag: "some", _0: self[i] } : { _tag: "none" }; }
function Str_pad_start(self, length, fill) { return self.padStart(length, fill); }
function Str_repeat(self, count) { return self.repeat(count); }
function Str_char_code_at(self, i) { var c = self.charCodeAt(i); return isNaN(c) ? { _tag: "none" } : { _tag: "some", _0: c }; }

function Int_to_str(self) { return String(self); }
function Float_to_str(self) { return String(self); }
function parse_int(s) { var n = parseInt(s, 10); return isNaN(n) ? { _tag: "none" } : { _tag: "some", _0: n }; }
function parse_float(s) { var n = parseFloat(s); return isNaN(n) ? { _tag: "none" } : { _tag: "some", _0: n }; }

function List_len(self) { return self.length; }
function List_get(self, i) { return i >= 0 && i < self.length ? { _tag: "some", _0: self[i] } : { _tag: "none" }; }
function List_first(self) { return self.length > 0 ? { _tag: "some", _0: self[0] } : { _tag: "none" }; }
function List_last(self) { return self.length > 0 ? { _tag: "some", _0: self[self.length - 1] } : { _tag: "none" }; }
function List_contains(self, x) { return self.includes(x); }
function List_is_empty(self) { return self.length === 0; }
function List_push(self, x) { self.push(x); }
function List_concat(self, other) { for (var i = 0; i < other.length; i++) self.push(other[i]); }
function List_slice(self, start, end) { return self.slice(start, end); }
function List_reverse(self) { self.reverse(); }

function map_new() { return new Map(); }
function map_from(entries) { return new Map(entries); }
function _Map_len(self) { return self.size; }
function _Map_get(self, key) { return self.has(key) ? { _tag: "some", _0: self.get(key) } : { _tag: "none" }; }
function _Map_contains_key(self, key) { return self.has(key); }
function _Map_is_empty(self) { return self.size === 0; }
function _Map_keys(self) { return Array.from(self.keys()); }
function _Map_values(self) { return Array.from(self.values()); }
function _Map_entries(self) { return Array.from(self.entries()); }
function _Map_insert(self, key, value) { self.set(key, value); }
function _Map_remove(self, key) { self.delete(key); }

function set_new() { return new Set(); }
function set_from(items) { return new Set(items); }
function _Set_len(self) { return self.size; }
function _Set_contains(self, x) { return self.has(x); }
function _Set_is_empty(self) { return self.size === 0; }
function _Set_to_list(self) { return Array.from(self); }
function _Set_insert(self, x) { self.add(x); }
function _Set_remove(self, x) { self.delete(x); }
function _Set_union(self, other) { return new Set([...self, ...other]); }
function _Set_intersect(self, other) { return new Set([...self].filter(function(x) { return other.has(x); })); }
function _Set_difference(self, other) { return new Set([...self].filter(function(x) { return !other.has(x); })); }

function json_stringify(value) { return JSON.stringify(value); }
`;
