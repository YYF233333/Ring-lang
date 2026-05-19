fn main() {
  let s = set_from([1, 2, 3, 2, 1])
  print(s.len())
  print(s.contains(2))
  print(s.is_empty())

  let s2 = s.insert(4)
  print(s2.len())

  let s3 = s2.remove(1)
  print(s3.len())
}
