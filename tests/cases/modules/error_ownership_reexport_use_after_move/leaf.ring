pub struct Resource { pub id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

pub fn transfer(value: Resource) -> Resource { value }
