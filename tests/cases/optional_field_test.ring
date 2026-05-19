// Optional field syntax: field?: Type → desugars to field: Option<Type>

struct User {
  name: Str,
  email?: Str,
  age?: Int,
}

// All fields provided
fn full_user() -> User {
  User { name: "Alice", email: some("alice@example.com"), age: some(30) }
}

// Optional fields omitted → defaults to none
fn minimal_user() -> User {
  User { name: "Bob" }
}

// Mix: some optional provided, some omitted
fn partial_user() -> User {
  User { name: "Carol", age: some(25) }
}

// Struct update with optional fields
fn add_email(u: User, e: Str) -> User {
  User { ..u, email: some(e) }
}

fn main() {
  let u1 = full_user()
  assert(u1.name == "Alice", "u1 name")
  match u1.email {
    some(e) => assert(e == "alice@example.com", "u1 email"),
    none => panic("expected email"),
  }

  let u2 = minimal_user()
  assert(u2.name == "Bob", "u2 name")
  match u2.email {
    some(_) => panic("expected none email"),
    none => {},
  }
  match u2.age {
    some(_) => panic("expected none age"),
    none => {},
  }

  let u3 = partial_user()
  assert(u3.name == "Carol", "u3 name")
  match u3.email {
    none => {},
    some(_) => panic("expected none email"),
  }
  match u3.age {
    some(a) => assert(a == 25, "u3 age"),
    none => panic("expected age"),
  }

  let u4 = add_email(u2, "bob@example.com")
  assert(u4.name == "Bob", "u4 name")
  match u4.email {
    some(e) => assert(e == "bob@example.com", "u4 email"),
    none => panic("expected email"),
  }

  print("optional field: all tests passed")
}
