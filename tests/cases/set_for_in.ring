fn main() {
  let s = set_from([10, 20, 30])
  var total = 0
  for x in s {
    total = total + x
  }
  print(total)
}
