// Optional fields in enum named variants

enum Node {
  Element { tag: Str, class?: Str, id?: Str },
  Text { content: Str },
}

fn make_div() -> Node {
  Element { tag: "div" }
}

fn make_div_with_class(c: Str) -> Node {
  Element { tag: "div", class: some(c) }
}

fn make_full(t: Str, c: Str, i: Str) -> Node {
  Element { tag: t, class: some(c), id: some(i) }
}

fn main() {
  let n1 = make_div()
  match n1 {
    Element { tag, class, id } => {
      assert(tag == "div", "tag is div")
      match class {
        none => {},
        some(_) => panic("expected none class"),
      }
      match id {
        none => {},
        some(_) => panic("expected none id"),
      }
    },
    _ => panic("expected Element"),
  }

  let n2 = make_div_with_class("container")
  match n2 {
    Element { tag, class, .. } => {
      assert(tag == "div", "tag")
      match class {
        some(c) => assert(c == "container", "class"),
        none => panic("expected class"),
      }
    },
    _ => panic("expected Element"),
  }

  let n3 = make_full("span", "highlight", "main")
  match n3 {
    Element { tag, class, id } => {
      assert(tag == "span", "tag")
      match class { some(c) => assert(c == "highlight", "class"), none => panic("x") }
      match id { some(i) => assert(i == "main", "id"), none => panic("x") }
    },
    _ => panic("expected Element"),
  }

  print("optional field enum: all tests passed")
}
