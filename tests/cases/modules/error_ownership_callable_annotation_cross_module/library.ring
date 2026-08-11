pub struct Resource { pub id: Int }
impl Drop for Resource { fn drop(self) {} }

pub fn borrow_value(value: Resource) -> Int { value.id }
