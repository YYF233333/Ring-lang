pub extern type Map<K, V>

pub extern fn map_new<K, V>() -> Map<K, V>
pub extern fn map_from<K, V>(entries: List<(K, V)>) -> Map<K, V>
pub extern fn map_clone<K, V>(m: Map<K, V>) -> Map<K, V>

impl<K, V> Map {
    pub extern fn len(self: Map<K, V>) -> Int
    pub extern fn get(self: Map<K, V>, key: K) -> Option<V>
    pub extern fn contains_key(self: Map<K, V>, key: K) -> Bool
    pub fn is_empty(self: Map<K, V>) -> Bool { self.len() == 0 }
    pub extern fn keys(self: Map<K, V>) -> List<K>
    pub extern fn values(self: Map<K, V>) -> List<V>
    pub extern fn entries(self: Map<K, V>) -> List<(K, V)>
    pub extern fn insert(self: Map<K, V>, key: K, value: V) -> Unit
    pub extern fn remove(self: Map<K, V>, key: K) -> Unit
    pub extern fn clear(self: Map<K, V>) -> Unit
}
