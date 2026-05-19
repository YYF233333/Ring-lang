fn main() {
  var xs = [1, 2, 3]
  xs.push(4)
  print(xs.len())
  var zs = [1, 2, 3]
  zs.concat([4, 5])
  print(zs.len())
  let sl = zs.slice(1, 3)
  print(sl.len())
  var rev = [3, 1, 2]
  rev.reverse()
  match rev.first() {
    some(v) => print(v),
    none => print(-1),
  }
}
