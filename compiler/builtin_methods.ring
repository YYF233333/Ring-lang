pub fn CELL_METHODS() -> List<Str> { ["get", "set", "update"] }

pub fn STR_METHODS() -> List<Str> {
    ["len", "contains", "starts_with", "ends_with", "slice", "trim",
     "to_upper", "to_lower", "replace", "split", "char_at", "index_of",
     "pad_start", "pad_end", "repeat", "char_code_at"]
}

pub fn INT_METHODS() -> List<Str> { ["to_str"] }
pub fn FLOAT_METHODS() -> List<Str> { ["to_str"] }

pub fn LIST_NON_HOF_METHODS() -> List<Str> {
    ["len", "get", "set", "first", "last", "contains", "is_empty",
     "push", "pop", "concat", "extend", "slice", "reverse",
     "join", "sort", "shift", "clear", "index_of"]
}

pub fn LIST_HOF_METHODS() -> List<Str> {
    ["map", "filter", "flat_map", "fold", "any", "all", "find", "find_index", "sort_by"]
}

pub fn MAP_NON_HOF_METHODS() -> List<Str> {
    ["len", "get", "contains_key", "is_empty", "keys", "values", "entries",
     "insert", "remove", "clear"]
}

pub fn MAP_HOF_METHODS() -> List<Str> { ["map_values", "filter", "any", "fold"] }

pub fn SET_NON_HOF_METHODS() -> List<Str> {
    ["len", "contains", "is_empty", "to_list",
     "insert", "remove", "clear", "union", "intersect", "difference"]
}

pub fn SET_HOF_METHODS() -> List<Str> { ["filter", "fold", "any", "all"] }

pub fn OPTION_NON_HOF_METHODS() -> List<Str> { ["is_some", "is_none", "unwrap_or"] }
pub fn OPTION_HOF_METHODS() -> List<Str> { ["map", "and_then"] }
