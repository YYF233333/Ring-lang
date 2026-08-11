pub struct Resource { pub id: Int }
impl Drop for Resource { fn drop(self) {} }

pub struct OpenValue {
    pub tag: Int,
    pub resource: Resource,
}

pub fn consume_open(value: {tag: Int, ..row}) -> Int {
    let owned = value
    owned.tag
}
