fn main() {
  let m = map_from([(1, "a"), (2, "b"), (3, "c")])

  match m.get(2) {
    some(v) => print(v),
    none => print("not found"),
  }

  let ks = m.keys()
  print(ks.len())

  let vs = m.values()
  print(vs.len())

  let empty: Map<Int, Str> = map_new()
  print(empty.is_empty())

  let built = map_new().insert(10, "ten").insert(20, "twenty")
  print(built.len())
}
