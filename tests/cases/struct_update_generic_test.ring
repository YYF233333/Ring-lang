// Struct update with generic types

struct Pair<A, B> {
  first: A,
  second: B,
}

// Spread remains a borrow/copy operation. Exercise it on a concrete
// non-may-own instantiation; the generic may-own case is a compile-negative.
fn swap_first(p: Pair<Int, Str>, new_first: Int) -> Pair<Int, Str> {
  Pair { ..p, first: new_first }
}

enum Tree<T> {
  Leaf { value: T },
  Node { left: Tree<T>, right: Tree<T>, value: T },
}

fn update_value(t: Tree<Int>, v: Int) -> Tree<Int> {
  match t {
    Node { left, right, value } => Node { ..t, value: v },
    // Every Leaf field is overridden, so the spread retains no projection.
    Leaf { value } => Leaf { ..t, value: v },
  }
}

fn main() {
  let p = Pair { first: 1, second: "hello" }
  let p2 = swap_first(p, 42)
  assert(p2.first == 42, "first updated")
  assert(p2.second == "hello", "second unchanged")

  let tree = Node { left: Leaf { value: 1 }, right: Leaf { value: 2 }, value: 0 }
  let tree2 = update_value(tree, 99)
  match tree2 {
    Node { left, right, value } => {
      assert(value == 99, "node value updated")
      match left {
        Leaf { value } => assert(value == 1, "left unchanged"),
        _ => panic("expected Leaf"),
      }
    },
    _ => panic("expected Node"),
  }

  print("struct update generic: all tests passed")
}
