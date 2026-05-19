use lib::risky_div

fn main() {
  let a = risky_div(10, 2) or 0
  print(a)
  let b = risky_div(10, 0) or -1
  print(b)
}
