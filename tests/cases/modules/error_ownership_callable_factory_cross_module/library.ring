pub struct Resource { pub id: Int }
impl Drop for Resource { fn drop(self) {} }

pub fn consume(move value: Resource) -> Int { value.id }
pub fn make_consumer() -> fn(move Resource) -> Int { consume }
