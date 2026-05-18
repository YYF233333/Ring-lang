fn main() {
  let m = map_from([(1, "one"), (2, "two"), (3, "three")])
  print(m.len())
  print(m.contains_key(2))
  print(m.is_empty())

  let m2 = m.insert(4, "four")
  print(m2.len())

  let m3 = m2.remove(1)
  print(m3.len())
}
