// Test ..= inclusive range operator
fn main() {
  var sum = 0
  for i in 1..=5 {
    sum = sum + i
  }
  print(sum)

  var count = 0
  for i in 0..=0 {
    count = count + 1
  }
  print(count)
}
// expect: 15
// expect: 1
