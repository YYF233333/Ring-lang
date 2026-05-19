// Test: var self in impl methods + var parameters

struct Counter {
  count: Int,
  name: Str
}

impl Counter {
  fn increment(var self) {
    self.count = self.count + 1
  }

  fn add(var self, amount: Int) {
    self.count = self.count + amount
  }

  fn set_name(var self, new_name: Str) {
    self.name = new_name
  }

  fn get_count(self) -> Int {
    self.count
  }
}

// Test: nested field access mutation
struct Inner {
  value: Int
}

struct Outer {
  inner: Inner,
  label: Str
}

impl Outer {
  fn set_inner_value(var self, v: Int) {
    self.inner.value = v
  }
}

// Test: var parameter in regular function
fn double_in_place(var x: Int) -> Int {
  x = x * 2
  x
}

fn main() {
  var c = Counter { count: 0, name: "test" }
  assert(c.get_count() == 0, "initial count")

  c.increment()
  assert(c.get_count() == 1, "after increment")

  c.add(5)
  assert(c.get_count() == 6, "after add 5")

  c.set_name("updated")
  assert(c.name == "updated", "name changed")

  // Nested field mutation
  var o = Outer { inner: Inner { value: 10 }, label: "hi" }
  o.set_inner_value(42)
  assert(o.inner.value == 42, "nested field mutation")

  // var parameter
  let result = double_in_place(7)
  assert(result == 14, "var param double")

  print("all var_self tests passed")
}
