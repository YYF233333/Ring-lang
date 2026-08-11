pub struct Resource { pub id: Int }

impl Drop for Resource {
    fn drop(self) { print("drop ${self.id}") }
}

pub fn transfer(value: Resource) -> Resource { value }
