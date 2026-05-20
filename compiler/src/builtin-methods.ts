// Built-in method name registries — shared between checker (type checking) and codegen (code gen).
// HOF methods have special inline codegen; non-HOF methods use runtime function dispatch.

export const CELL_METHODS = ["get", "set", "update"] as const;
export const STR_METHODS = [
  "len", "contains", "starts_with", "ends_with", "slice", "trim",
  "to_upper", "to_lower", "replace", "split", "char_at", "index_of",
  "pad_start", "pad_end", "repeat", "char_code_at",
] as const;
export const INT_METHODS = ["to_str"] as const;
export const FLOAT_METHODS = ["to_str"] as const;
export const LIST_NON_HOF_METHODS = [
  "len", "get", "first", "last", "contains", "is_empty",
  "push", "pop", "concat", "extend", "slice", "reverse",
  "join", "sort", "shift", "clear", "index_of",
] as const;
export const LIST_HOF_METHODS = ["map", "filter", "flat_map", "fold", "any", "all", "find", "find_index", "sort_by"] as const;
export const MAP_NON_HOF_METHODS = [
  "len", "get", "contains_key", "is_empty", "keys", "values", "entries",
  "insert", "remove", "clear",
] as const;
export const MAP_HOF_METHODS = ["map_values", "filter", "any", "fold"] as const;
export const SET_NON_HOF_METHODS = [
  "len", "contains", "is_empty", "to_list",
  "insert", "remove", "clear", "union", "intersect", "difference",
] as const;
export const SET_HOF_METHODS = ["filter", "fold", "any", "all"] as const;

export const OPTION_NON_HOF_METHODS = ["is_some", "is_none", "unwrap_or"] as const;
export const OPTION_HOF_METHODS = ["map", "and_then"] as const;
