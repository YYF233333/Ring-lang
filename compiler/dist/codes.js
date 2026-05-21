import { __EffectAbort, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_first, List_last, List_contains, List_is_empty, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_is_empty, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_is_empty, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";

function E0101() {
  return "E0101";
}

function E0102() {
  return "E0102";
}

function E0103() {
  return "E0103";
}

function E0201() {
  return "E0201";
}

function E0203() {
  return "E0203";
}

function E0204() {
  return "E0204";
}

function E0205() {
  return "E0205";
}

function E0206() {
  return "E0206";
}

function E0207() {
  return "E0207";
}

function E0301() {
  return "E0301";
}

function E0302() {
  return "E0302";
}

function E0303() {
  return "E0303";
}

function E0304() {
  return "E0304";
}

function E0305() {
  return "E0305";
}

function E0307() {
  return "E0307";
}

function E0308() {
  return "E0308";
}

function E0402() {
  return "E0402";
}

function E0403() {
  return "E0403";
}

function E0501() {
  return "E0501";
}

function E0502() {
  return "E0502";
}

function E0503() {
  return "E0503";
}

function E0601() {
  return "E0601";
}

function E0702() {
  return "E0702";
}

function E0703() {
  return "E0703";
}

function E0704() {
  return "E0704";
}

function E0706() {
  return "E0706";
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
  if ((code === "E0501")) {
    return "Unknown trait";
  }
  if ((code === "E0502")) {
    return "Missing trait method implementation";
  }
  if ((code === "E0503")) {
    return "Unsatisfied trait bound";
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
  if ((code === "E0706")) {
    return "Use declaration must appear before other declarations";
  }
  return "Unknown error";
}


export { E0101, E0102, E0103, E0201, E0203, E0204, E0205, E0206, E0207, E0301, E0302, E0303, E0304, E0305, E0307, E0308, E0402, E0403, E0501, E0502, E0503, E0601, E0702, E0703, E0704, E0706, error_description };