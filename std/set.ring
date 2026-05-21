pub extern type Set<T>

pub extern fn set_new<T>() -> Set<T>
pub extern fn set_from<T>(items: List<T>) -> Set<T>
pub extern fn set_clone<T>(s: Set<T>) -> Set<T>

impl<T> Set {
    pub extern fn len(self: Set<T>) -> Int
    pub extern fn contains(self: Set<T>, item: T) -> Bool
    pub fn is_empty(self: Set<T>) -> Bool { self.len() == 0 }
    pub extern fn to_list(self: Set<T>) -> List<T>
    pub extern fn insert(self: Set<T>, item: T) -> Unit
    pub extern fn remove(self: Set<T>, item: T) -> Unit
    pub extern fn clear(self: Set<T>) -> Unit
    pub extern fn union(self: Set<T>, other: Set<T>) -> Set<T>
    pub extern fn intersect(self: Set<T>, other: Set<T>) -> Set<T>
    pub extern fn difference(self: Set<T>, other: Set<T>) -> Set<T>
}
