import { __EffectAbort, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_first, List_last, List_contains, List_is_empty, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_is_empty, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_is_empty, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";

function BUILTIN_INT() {
  return "Int";
}

function BUILTIN_FLOAT() {
  return "Float";
}

function BUILTIN_STR() {
  return "Str";
}

function BUILTIN_BOOL() {
  return "Bool";
}

function BUILTIN_RANGE() {
  return "Range";
}

function BUILTIN_LIST() {
  return "List";
}

function BUILTIN_MAP() {
  return "Map";
}

function BUILTIN_SET() {
  return "Set";
}

function BUILTIN_OPTION() {
  return "Option";
}

function BUILTIN_CELL() {
  return "Cell";
}

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
function Type_StructType(name, type_params, fields) {
  return { _tag: "StructType", name, type_params, fields };
}
function Type_EnumType(name, type_params, variants) {
  return { _tag: "EnumType", name, type_params, variants };
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

const Effect_IoEffect = Object.freeze({ _tag: "IoEffect" });
function Effect_FailEffect(error_type) {
  return { _tag: "FailEffect", error_type };
}
const Effect_MutEffect = Object.freeze({ _tag: "MutEffect" });
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

function empty_types() {
  const x = [INT()];
  List_clear(x);
  return x;
}

function empty_effects() {
  const x = [Effect_IoEffect];
  List_clear(x);
  return x;
}

function empty_fields() {
  const dummy = new StructField("", INT(), false);
  const x = [dummy];
  List_clear(x);
  return x;
}

function INT() {
  return Type_IntType;
}

function FLOAT() {
  return Type_FloatType;
}

function STR() {
  return Type_StrType;
}

function BOOL() {
  return Type_BoolType;
}

function UNIT() {
  return Type_UnitType;
}

function NEVER() {
  return Type_NeverType;
}

function ANY() {
  return Type_AnyType;
}

function EMPTY_ROW() {
  return new EffectRow(empty_effects(), Option_none);
}

function type_to_builtin_name(t) {
  __ring_match0: {
    const __ring_m0 = t;
    if (__ring_m0._tag === "IntType") {
      return Option_some(BUILTIN_INT());
      break __ring_match0;
    }
    if (__ring_m0._tag === "FloatType") {
      return Option_some(BUILTIN_FLOAT());
      break __ring_match0;
    }
    if (__ring_m0._tag === "StrType") {
      return Option_some(BUILTIN_STR());
      break __ring_match0;
    }
    if (__ring_m0._tag === "BoolType") {
      return Option_some(BUILTIN_BOOL());
      break __ring_match0;
    }
    if (__ring_m0._tag === "UnitType") {
      return Option_some("Unit");
      break __ring_match0;
    }
    if (__ring_m0._tag === "StructType") {
      const name = __ring_m0.name;
      return Option_some(name);
      break __ring_match0;
    }
    if (__ring_m0._tag === "EnumType") {
      const name = __ring_m0.name;
      return Option_some(name);
      break __ring_match0;
    }
    return Option_none;
    break __ring_match0;
  }
}

function make_option_type(inner) {
  return Type_EnumType(BUILTIN_OPTION(), [inner], [new EnumVariant("some", [inner], Option_none), new EnumVariant("none", empty_types(), Option_none)]);
}

function is_option_type(t) {
  __ring_match1: {
    const __ring_m1 = t;
    if (__ring_m1._tag === "EnumType") {
      const name = __ring_m1.name; const type_params = __ring_m1.type_params;
      return ((name === BUILTIN_OPTION()) && (List_len(type_params) === 1));
      break __ring_match1;
    }
    return false;
    break __ring_match1;
  }
}

function option_inner(t) {
  __ring_match2: {
    const __ring_m2 = t;
    if (__ring_m2._tag === "EnumType") {
      const type_params = __ring_m2.type_params;
      return Option_unwrap_or(List_first(type_params), UNIT());
      break __ring_match2;
    }
    return UNIT();
    break __ring_match2;
  }
}

function make_list_type(element) {
  return Type_StructType(BUILTIN_LIST(), [element], empty_fields());
}

function is_list_type(t) {
  __ring_match3: {
    const __ring_m3 = t;
    if (__ring_m3._tag === "StructType") {
      const name = __ring_m3.name;
      return (name === BUILTIN_LIST());
      break __ring_match3;
    }
    return false;
    break __ring_match3;
  }
}

function list_element(t) {
  __ring_match4: {
    const __ring_m4 = t;
    if (__ring_m4._tag === "StructType") {
      const type_params = __ring_m4.type_params;
      return Option_unwrap_or(List_first(type_params), UNIT());
      break __ring_match4;
    }
    return UNIT();
    break __ring_match4;
  }
}

function make_map_type(key, value) {
  return Type_StructType(BUILTIN_MAP(), [key, value], empty_fields());
}

function is_map_type(t) {
  __ring_match5: {
    const __ring_m5 = t;
    if (__ring_m5._tag === "StructType") {
      const name = __ring_m5.name;
      return (name === BUILTIN_MAP());
      break __ring_match5;
    }
    return false;
    break __ring_match5;
  }
}

function make_set_type(element) {
  return Type_StructType(BUILTIN_SET(), [element], empty_fields());
}

function is_set_type(t) {
  __ring_match6: {
    const __ring_m6 = t;
    if (__ring_m6._tag === "StructType") {
      const name = __ring_m6.name;
      return (name === BUILTIN_SET());
      break __ring_match6;
    }
    return false;
    break __ring_match6;
  }
}

function effect_row(effects) {
  return new EffectRow(effects, Option_none);
}

function open_effect_row(effects, tail) {
  return new EffectRow(effects, Option_some(tail));
}

function row_contains(row, eff) {
  return row.effects.some((function(e) { return effects_equal(e, eff); }));
}

function effects_same_kind(a, b) {
  __ring_match7: {
    const __ring_m7 = a;
    if (__ring_m7._tag === "IoEffect") {
      __ring_match8: {
        const __ring_m8 = b;
        if (__ring_m8._tag === "IoEffect") {
          return true;
          break __ring_match8;
        }
        return false;
        break __ring_match8;
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "MutEffect") {
      __ring_match9: {
        const __ring_m9 = b;
        if (__ring_m9._tag === "MutEffect") {
          return true;
          break __ring_match9;
        }
        return false;
        break __ring_match9;
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "FailEffect") {
      __ring_match10: {
        const __ring_m10 = b;
        if (__ring_m10._tag === "FailEffect") {
          return true;
          break __ring_match10;
        }
        return false;
        break __ring_match10;
      }
      break __ring_match7;
    }
    if (__ring_m7._tag === "CustomEffect") {
      const na = __ring_m7.name;
      __ring_match11: {
        const __ring_m11 = b;
        if (__ring_m11._tag === "CustomEffect") {
          const nb = __ring_m11.name;
          return (na === nb);
          break __ring_match11;
        }
        return false;
        break __ring_match11;
      }
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
}

function row_merge(a, b) {
  let merged = list_clone(a.effects);
  for (const eff of b.effects) {
    if ((!merged.some((function(e) { return effects_same_kind(e, eff); })))) {
      List_push(merged, eff);
    }
  }
  const tail = (function() {
  const __ring_m = [a.tail, b.tail];
  if (Array.isArray(__ring_m) && __ring_m.length === 2 && __ring_m[0]._tag === "some") { const ta = __ring_m[0]._0; return Option_some(ta); }
  if (Array.isArray(__ring_m) && __ring_m.length === 2 && __ring_m[1]._tag === "some") { const tb = __ring_m[1]._0; return Option_some(tb); }
  return Option_none;
})();
  const tails_to_unify = (function() {
  const __ring_m = [a.tail, b.tail];
  if (Array.isArray(__ring_m) && __ring_m.length === 2 && __ring_m[0]._tag === "some" && __ring_m[1]._tag === "some") { const ta = __ring_m[0]._0; const tb = __ring_m[1]._0; return ((ta !== tb) ? Option_some([ta, tb]) : Option_none); }
  return Option_none;
})();
  return new RowMergeResult(new EffectRow(merged, tail), tails_to_unify);
}

function effects_equal(a, b) {
  __ring_match12: {
    const __ring_m12 = a;
    if (__ring_m12._tag === "IoEffect") {
      __ring_match13: {
        const __ring_m13 = b;
        if (__ring_m13._tag === "IoEffect") {
          return true;
          break __ring_match13;
        }
        return false;
        break __ring_match13;
      }
      break __ring_match12;
    }
    if (__ring_m12._tag === "MutEffect") {
      __ring_match14: {
        const __ring_m14 = b;
        if (__ring_m14._tag === "MutEffect") {
          return true;
          break __ring_match14;
        }
        return false;
        break __ring_match14;
      }
      break __ring_match12;
    }
    if (__ring_m12._tag === "FailEffect") {
      const et_a = __ring_m12.error_type;
      __ring_match15: {
        const __ring_m15 = b;
        if (__ring_m15._tag === "FailEffect") {
          const et_b = __ring_m15.error_type;
          return types_equal(et_a, et_b);
          break __ring_match15;
        }
        return false;
        break __ring_match15;
      }
      break __ring_match12;
    }
    if (__ring_m12._tag === "CustomEffect") {
      const na = __ring_m12.name; const args_a = __ring_m12.type_args;
      __ring_match16: {
        const __ring_m16 = b;
        if (__ring_m16._tag === "CustomEffect") {
          const nb = __ring_m16.name; const args_b = __ring_m16.type_args;
          if ((na !== nb)) {
            return false;
          }
          if ((List_len(args_a) !== List_len(args_b))) {
            return false;
          }
          let i = 0;
          while ((i < List_len(args_a))) {
            {
              const __ring_t = List_get(args_a, i);
              if (__ring_t._tag === "some") {
                const aa = __ring_t._0;
                {
                  const __ring_t = List_get(args_b, i);
                  if (__ring_t._tag === "some") {
                    const bb = __ring_t._0;
                    if ((!types_equal(aa, bb))) {
                      return false;
                    }
                  }
                }
              }
            }
            i = (i + 1);
          }
          return true;
          break __ring_match16;
        }
        return false;
        break __ring_match16;
      }
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
}

function types_equal(a, b) {
  __ring_match17: {
    const __ring_m17 = a;
    if (__ring_m17._tag === "IntType") {
      __ring_match18: {
        const __ring_m18 = b;
        if (__ring_m18._tag === "IntType") {
          return true;
          break __ring_match18;
        }
        return false;
        break __ring_match18;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "FloatType") {
      __ring_match19: {
        const __ring_m19 = b;
        if (__ring_m19._tag === "FloatType") {
          return true;
          break __ring_match19;
        }
        return false;
        break __ring_match19;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "StrType") {
      __ring_match20: {
        const __ring_m20 = b;
        if (__ring_m20._tag === "StrType") {
          return true;
          break __ring_match20;
        }
        return false;
        break __ring_match20;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "BoolType") {
      __ring_match21: {
        const __ring_m21 = b;
        if (__ring_m21._tag === "BoolType") {
          return true;
          break __ring_match21;
        }
        return false;
        break __ring_match21;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "UnitType") {
      __ring_match22: {
        const __ring_m22 = b;
        if (__ring_m22._tag === "UnitType") {
          return true;
          break __ring_match22;
        }
        return false;
        break __ring_match22;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "NeverType") {
      __ring_match23: {
        const __ring_m23 = b;
        if (__ring_m23._tag === "NeverType") {
          return true;
          break __ring_match23;
        }
        return false;
        break __ring_match23;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "AnyType") {
      __ring_match24: {
        const __ring_m24 = b;
        if (__ring_m24._tag === "AnyType") {
          return true;
          break __ring_match24;
        }
        return false;
        break __ring_match24;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "TypeVar") {
      const id_a = __ring_m17.id;
      __ring_match25: {
        const __ring_m25 = b;
        if (__ring_m25._tag === "TypeVar") {
          const id_b = __ring_m25.id;
          return (id_a === id_b);
          break __ring_match25;
        }
        return false;
        break __ring_match25;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "FnType") {
      const pa = __ring_m17.params; const ra = __ring_m17.return_type; const ea = __ring_m17.effects;
      __ring_match26: {
        const __ring_m26 = b;
        if (__ring_m26._tag === "FnType") {
          const pb = __ring_m26.params; const rb = __ring_m26.return_type; const eb = __ring_m26.effects;
          if ((List_len(pa) !== List_len(pb))) {
            return false;
          }
          if ((List_len(ea.effects) !== List_len(eb.effects))) {
            return false;
          }
          const tails_ok = (function() {
  const __ring_m = [ea.tail, eb.tail];
  if (Array.isArray(__ring_m) && __ring_m.length === 2 && __ring_m[0]._tag === "some" && __ring_m[1]._tag === "some") { const a_t = __ring_m[0]._0; const b_t = __ring_m[1]._0; return (a_t === b_t); }
  return (Option_is_none(ea.tail) && Option_is_none(eb.tail));
})();
          if ((!tails_ok)) {
            return false;
          }
          let i = 0;
          while ((i < List_len(pa))) {
            {
              const __ring_t = List_get(pa, i);
              if (__ring_t._tag === "some") {
                const ap = __ring_t._0;
                {
                  const __ring_t = List_get(pb, i);
                  if (__ring_t._tag === "some") {
                    const bp = __ring_t._0;
                    if ((!types_equal(ap, bp))) {
                      return false;
                    }
                  }
                }
              }
            }
            i = (i + 1);
          }
          if ((!types_equal(ra, rb))) {
            return false;
          }
          let j = 0;
          while ((j < List_len(ea.effects))) {
            {
              const __ring_t = List_get(ea.effects, j);
              if (__ring_t._tag === "some") {
                const ae = __ring_t._0;
                {
                  const __ring_t = List_get(eb.effects, j);
                  if (__ring_t._tag === "some") {
                    const be = __ring_t._0;
                    if ((!effects_equal(ae, be))) {
                      return false;
                    }
                  }
                }
              }
            }
            j = (j + 1);
          }
          return true;
          break __ring_match26;
        }
        return false;
        break __ring_match26;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "StructType") {
      const na = __ring_m17.name; const tpa = __ring_m17.type_params;
      __ring_match27: {
        const __ring_m27 = b;
        if (__ring_m27._tag === "StructType") {
          const nb = __ring_m27.name; const tpb = __ring_m27.type_params;
          if ((na !== nb)) {
            return false;
          }
          if ((List_len(tpa) !== List_len(tpb))) {
            return false;
          }
          let i = 0;
          while ((i < List_len(tpa))) {
            {
              const __ring_t = List_get(tpa, i);
              if (__ring_t._tag === "some") {
                const ap = __ring_t._0;
                {
                  const __ring_t = List_get(tpb, i);
                  if (__ring_t._tag === "some") {
                    const bp = __ring_t._0;
                    if ((!types_equal(ap, bp))) {
                      return false;
                    }
                  }
                }
              }
            }
            i = (i + 1);
          }
          return true;
          break __ring_match27;
        }
        return false;
        break __ring_match27;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "EnumType") {
      const na = __ring_m17.name; const tpa = __ring_m17.type_params;
      __ring_match28: {
        const __ring_m28 = b;
        if (__ring_m28._tag === "EnumType") {
          const nb = __ring_m28.name; const tpb = __ring_m28.type_params;
          if ((na !== nb)) {
            return false;
          }
          if ((List_len(tpa) !== List_len(tpb))) {
            return false;
          }
          let i = 0;
          while ((i < List_len(tpa))) {
            {
              const __ring_t = List_get(tpa, i);
              if (__ring_t._tag === "some") {
                const ap = __ring_t._0;
                {
                  const __ring_t = List_get(tpb, i);
                  if (__ring_t._tag === "some") {
                    const bp = __ring_t._0;
                    if ((!types_equal(ap, bp))) {
                      return false;
                    }
                  }
                }
              }
            }
            i = (i + 1);
          }
          return true;
          break __ring_match28;
        }
        return false;
        break __ring_match28;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "GenericType") {
      const ba = __ring_m17.base; const aa = __ring_m17.args;
      __ring_match29: {
        const __ring_m29 = b;
        if (__ring_m29._tag === "GenericType") {
          const bb = __ring_m29.base; const ab = __ring_m29.args;
          if ((!types_equal(ba, bb))) {
            return false;
          }
          if ((List_len(aa) !== List_len(ab))) {
            return false;
          }
          let i = 0;
          while ((i < List_len(aa))) {
            {
              const __ring_t = List_get(aa, i);
              if (__ring_t._tag === "some") {
                const ap = __ring_t._0;
                {
                  const __ring_t = List_get(ab, i);
                  if (__ring_t._tag === "some") {
                    const bp = __ring_t._0;
                    if ((!types_equal(ap, bp))) {
                      return false;
                    }
                  }
                }
              }
            }
            i = (i + 1);
          }
          return true;
          break __ring_match29;
        }
        return false;
        break __ring_match29;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "RecordType") {
      const fa = __ring_m17.fields; const ta = __ring_m17.tail;
      __ring_match30: {
        const __ring_m30 = b;
        if (__ring_m30._tag === "RecordType") {
          const fb = __ring_m30.fields; const tb = __ring_m30.tail;
          if ((List_len(fa) !== List_len(fb))) {
            return false;
          }
          const tails_ok = (function() {
  const __ring_m = [ta, tb];
  if (Array.isArray(__ring_m) && __ring_m.length === 2 && __ring_m[0]._tag === "some" && __ring_m[1]._tag === "some") { const a_t = __ring_m[0]._0; const b_t = __ring_m[1]._0; return (a_t === b_t); }
  return (Option_is_none(ta) && Option_is_none(tb));
})();
          if ((!tails_ok)) {
            return false;
          }
          return fa.every((function(f) { return fb.some((function(bf) { return ((bf.name === f.name) && types_equal(f.ty, bf.ty)); })); }));
          break __ring_match30;
        }
        return false;
        break __ring_match30;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "EffectRowType") {
      const ea = __ring_m17.effects; const ta = __ring_m17.tail;
      __ring_match31: {
        const __ring_m31 = b;
        if (__ring_m31._tag === "EffectRowType") {
          const eb = __ring_m31.effects; const tb = __ring_m31.tail;
          if ((List_len(ea) !== List_len(eb))) {
            return false;
          }
          const tails_ok = (function() {
  const __ring_m = [ta, tb];
  if (Array.isArray(__ring_m) && __ring_m.length === 2 && __ring_m[0]._tag === "some" && __ring_m[1]._tag === "some") { const a_t = __ring_m[0]._0; const b_t = __ring_m[1]._0; return (a_t === b_t); }
  return (Option_is_none(ta) && Option_is_none(tb));
})();
          if ((!tails_ok)) {
            return false;
          }
          let i = 0;
          while ((i < List_len(ea))) {
            {
              const __ring_t = List_get(ea, i);
              if (__ring_t._tag === "some") {
                const ae = __ring_t._0;
                {
                  const __ring_t = List_get(eb, i);
                  if (__ring_t._tag === "some") {
                    const be = __ring_t._0;
                    if ((!effects_equal(ae, be))) {
                      return false;
                    }
                  }
                }
              }
            }
            i = (i + 1);
          }
          return true;
          break __ring_match31;
        }
        return false;
        break __ring_match31;
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "TupleType") {
      const ea = __ring_m17.elements;
      __ring_match32: {
        const __ring_m32 = b;
        if (__ring_m32._tag === "TupleType") {
          const eb = __ring_m32.elements;
          if ((List_len(ea) !== List_len(eb))) {
            return false;
          }
          let i = 0;
          while ((i < List_len(ea))) {
            {
              const __ring_t = List_get(ea, i);
              if (__ring_t._tag === "some") {
                const ae = __ring_t._0;
                {
                  const __ring_t = List_get(eb, i);
                  if (__ring_t._tag === "some") {
                    const be = __ring_t._0;
                    if ((!types_equal(ae, be))) {
                      return false;
                    }
                  }
                }
              }
            }
            i = (i + 1);
          }
          return true;
          break __ring_match32;
        }
        return false;
        break __ring_match32;
      }
      break __ring_match17;
    }
    __match_fail(__ring_m17);
  }
}

function type_to_string(t) {
  __ring_match33: {
    const __ring_m33 = t;
    if (__ring_m33._tag === "IntType") {
      return BUILTIN_INT();
      break __ring_match33;
    }
    if (__ring_m33._tag === "FloatType") {
      return BUILTIN_FLOAT();
      break __ring_match33;
    }
    if (__ring_m33._tag === "StrType") {
      return BUILTIN_STR();
      break __ring_match33;
    }
    if (__ring_m33._tag === "BoolType") {
      return BUILTIN_BOOL();
      break __ring_match33;
    }
    if (__ring_m33._tag === "UnitType") {
      return "()";
      break __ring_match33;
    }
    if (__ring_m33._tag === "NeverType") {
      return "Never";
      break __ring_match33;
    }
    if (__ring_m33._tag === "AnyType") {
      return "Any";
      break __ring_match33;
    }
    if (__ring_m33._tag === "TypeVar") {
      const name = __ring_m33.name; const id = __ring_m33.id;
      __ring_match34: {
        const __ring_m34 = name;
        if (__ring_m34._tag === "some") {
          const n = __ring_m34._0;
          return n;
          break __ring_match34;
        }
        if (__ring_m34._tag === "none") {
          return `?${Int_to_str(id)}`;
          break __ring_match34;
        }
        __match_fail(__ring_m34);
      }
      break __ring_match33;
    }
    if (__ring_m33._tag === "FnType") {
      const params = __ring_m33.params; const return_type = __ring_m33.return_type; const effects = __ring_m33.effects;
      const ps = List_join(params.map((function(p) { return type_to_string(p); })), ", ");
      const ret = type_to_string(return_type);
      const eff = effect_row_to_string(effects);
      if ((Str_len(eff) > 0)) {
        return `(${ps}) -> ${ret} / ${eff}`;
      } else {
        return `(${ps}) -> ${ret}`;
      }
      break __ring_match33;
    }
    if (__ring_m33._tag === "StructType") {
      const name = __ring_m33.name; const type_params = __ring_m33.type_params;
      if ((List_len(type_params) === 0)) {
        return name;
      } else {
        return `${name}<${List_join(type_params.map((function(p) { return type_to_string(p); })), ", ")}>`;
      }
      break __ring_match33;
    }
    if (__ring_m33._tag === "EnumType") {
      const name = __ring_m33.name; const type_params = __ring_m33.type_params;
      if (((name === BUILTIN_OPTION()) && (List_len(type_params) === 1))) {
        return `${type_to_string(Option_unwrap_or(List_first(type_params), UNIT()))}?`;
      } else {
        if ((List_len(type_params) === 0)) {
          return name;
        } else {
          return `${name}<${List_join(type_params.map((function(p) { return type_to_string(p); })), ", ")}>`;
        }
      }
      break __ring_match33;
    }
    if (__ring_m33._tag === "GenericType") {
      const base = __ring_m33.base; const args = __ring_m33.args;
      return `${type_to_string(base)}<${List_join(args.map((function(a) { return type_to_string(a); })), ", ")}>`;
      break __ring_match33;
    }
    if (__ring_m33._tag === "RecordType") {
      const fields = __ring_m33.fields; const tail = __ring_m33.tail; const tail_name = __ring_m33.tail_name;
      const fs = List_join(fields.map((function(f) { return `${f.name}: ${type_to_string(f.ty)}`; })), ", ");
      __ring_match35: {
        const __ring_m35 = tail;
        if (__ring_m35._tag === "some") {
          const t = __ring_m35._0;
          const ts = (function() {
  const __ring_m = tail_name;
  if (__ring_m._tag === "some") { const n = __ring_m._0; return n; }
  if (__ring_m._tag === "none") { return `?${Int_to_str(t)}`; }
  __match_fail(__ring_m);
})();
          if ((Str_len(fs) > 0)) {
            return `{${fs}, ..${ts}}`;
          } else {
            return `{..${ts}}`;
          }
          break __ring_match35;
        }
        if (__ring_m35._tag === "none") {
          return `{${fs}}`;
          break __ring_match35;
        }
        __match_fail(__ring_m35);
      }
      break __ring_match33;
    }
    if (__ring_m33._tag === "EffectRowType") {
      const effects = __ring_m33.effects; const tail = __ring_m33.tail;
      const es = List_join(effects.map((function(e) { return effect_to_string(e); })), ", ");
      __ring_match36: {
        const __ring_m36 = tail;
        if (__ring_m36._tag === "some") {
          const t = __ring_m36._0;
          return `<${es}, ?${Int_to_str(t)}>`;
          break __ring_match36;
        }
        if (__ring_m36._tag === "none") {
          return `<${es}>`;
          break __ring_match36;
        }
        __match_fail(__ring_m36);
      }
      break __ring_match33;
    }
    if (__ring_m33._tag === "TupleType") {
      const elements = __ring_m33.elements;
      return `(${List_join(elements.map((function(e) { return type_to_string(e); })), ", ")})`;
      break __ring_match33;
    }
    __match_fail(__ring_m33);
  }
}

function effect_to_string(e) {
  __ring_match37: {
    const __ring_m37 = e;
    if (__ring_m37._tag === "IoEffect") {
      return "io";
      break __ring_match37;
    }
    if (__ring_m37._tag === "MutEffect") {
      return "mut";
      break __ring_match37;
    }
    if (__ring_m37._tag === "FailEffect") {
      const error_type = __ring_m37.error_type;
      return `fail<${type_to_string(error_type)}>`;
      break __ring_match37;
    }
    if (__ring_m37._tag === "CustomEffect") {
      const name = __ring_m37.name; const type_args = __ring_m37.type_args;
      if ((List_len(type_args) === 0)) {
        return name;
      } else {
        return `${name}<${List_join(type_args.map((function(a) { return type_to_string(a); })), ", ")}>`;
      }
      break __ring_match37;
    }
    __match_fail(__ring_m37);
  }
}

function effect_row_to_string(row) {
  if (((List_len(row.effects) === 0) && Option_is_none(row.tail))) {
    return "";
  }
  let parts = row.effects.map((function(e) { return effect_to_string(e); }));
  __ring_match38: {
    const __ring_m38 = row.tail;
    if (__ring_m38._tag === "some") {
      const t = __ring_m38._0;
      List_push(parts, `?${Int_to_str(t)}`);
      break __ring_match38;
    }
    if (__ring_m38._tag === "none") {
      break __ring_match38;
    }
    __match_fail(__ring_m38);
  }
  return List_join(parts, ", ");
}


export { BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL, BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION, BUILTIN_CELL, StructField, EnumVariant, RecordField, Type_IntType, Type_FloatType, Type_StrType, Type_BoolType, Type_UnitType, Type_NeverType, Type_AnyType, Type_TypeVar, Type_FnType, Type_StructType, Type_EnumType, Type_GenericType, Type_RecordType, Type_EffectRowType, Type_TupleType, Effect_IoEffect, Effect_FailEffect, Effect_MutEffect, Effect_CustomEffect, EffectRow, RowMergeResult, empty_types, empty_effects, empty_fields, INT, FLOAT, STR, BOOL, UNIT, NEVER, ANY, EMPTY_ROW, type_to_builtin_name, make_option_type, is_option_type, option_inner, make_list_type, is_list_type, list_element, make_map_type, is_map_type, make_set_type, is_set_type, effect_row, open_effect_row, row_contains, row_merge, effects_equal, types_equal, type_to_string, effect_to_string, effect_row_to_string };