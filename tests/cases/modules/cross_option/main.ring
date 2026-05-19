use lib::find_positive

fn main() {
  let result = find_positive(42) or 0
  print(result)
  let result2 = find_positive(-1) or 99
  print(result2)
}
