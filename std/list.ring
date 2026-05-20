pub extern type List<T>

impl<T> List {
    pub extern fn len(self: List<T>) -> Int
    pub extern fn get(self: List<T>, index: Int) -> Option<T>
    pub extern fn first(self: List<T>) -> Option<T>
    pub extern fn last(self: List<T>) -> Option<T>
    pub extern fn contains(self: List<T>, item: T) -> Bool
    pub extern fn is_empty(self: List<T>) -> Bool
    pub extern fn push(self: List<T>, item: T) -> Unit
    pub extern fn concat(self: List<T>, other: List<T>) -> List<T>
    pub extern fn extend(self: List<T>, other: List<T>) -> Unit
    pub extern fn slice(self: List<T>, start: Int, end: Int) -> List<T>
    pub extern fn reverse(self: List<T>) -> Unit
    pub extern fn join(self: List<T>, separator: Str) -> Str
    pub extern fn sort(self: List<T>) -> Unit
    pub extern fn shift(self: List<T>) -> Option<T>
    pub extern fn index_of(self: List<T>, item: T) -> Option<Int>
}
