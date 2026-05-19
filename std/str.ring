impl Str {
    pub extern fn len(self: Str) -> Int
    pub extern fn contains(self: Str, s: Str) -> Bool
    pub extern fn starts_with(self: Str, s: Str) -> Bool
    pub extern fn ends_with(self: Str, s: Str) -> Bool
    pub extern fn slice(self: Str, start: Int, end: Int) -> Str
    pub extern fn trim(self: Str) -> Str
    pub extern fn to_upper(self: Str) -> Str
    pub extern fn to_lower(self: Str) -> Str
    pub extern fn replace(self: Str, old_str: Str, new_str: Str) -> Str
    pub extern fn split(self: Str, sep: Str) -> List<Str>
    pub extern fn char_at(self: Str, i: Int) -> Option<Str>
    pub extern fn index_of(self: Str, s: Str) -> Option<Int>
}
