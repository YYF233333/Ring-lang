import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_first, List_last, List_contains, List_is_empty, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_is_empty, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_is_empty, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";

const CELL_METHODS = ["get", "set", "update"];

const STR_METHODS = ["len", "contains", "starts_with", "ends_with", "slice", "trim", "to_upper", "to_lower", "replace", "split", "char_at", "index_of", "pad_start", "pad_end", "repeat", "char_code_at"];

const INT_METHODS = ["to_str"];

const FLOAT_METHODS = ["to_str"];

const LIST_NON_HOF_METHODS = ["len", "get", "set", "first", "last", "contains", "is_empty", "push", "pop", "concat", "extend", "slice", "reverse", "join", "sort", "shift", "clear", "index_of"];

const LIST_HOF_METHODS = ["map", "filter", "flat_map", "fold", "any", "all", "find", "find_index", "sort_by"];

const MAP_NON_HOF_METHODS = ["len", "get", "contains_key", "is_empty", "keys", "values", "entries", "insert", "remove", "clear"];

const MAP_HOF_METHODS = ["map_values", "filter", "any", "fold"];

const SET_NON_HOF_METHODS = ["len", "contains", "is_empty", "to_list", "insert", "remove", "clear", "union", "intersect", "difference"];

const SET_HOF_METHODS = ["filter", "fold", "any", "all"];

const OPTION_NON_HOF_METHODS = ["is_some", "is_none", "unwrap_or", "unwrap", "to_fail"];

const OPTION_HOF_METHODS = ["map", "and_then", "unwrap_or_else"];


export { CELL_METHODS, STR_METHODS, INT_METHODS, FLOAT_METHODS, LIST_NON_HOF_METHODS, LIST_HOF_METHODS, MAP_NON_HOF_METHODS, MAP_HOF_METHODS, SET_NON_HOF_METHODS, SET_HOF_METHODS, OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS };