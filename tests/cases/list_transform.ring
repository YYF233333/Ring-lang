fn main() {
  let xs = [1, 2, 3]
  let ys = xs.push(4)
  print(ys.len())
  let zs = xs.concat([4, 5])
  print(zs.len())
  let sl = zs.slice(1, 3)
  print(sl.len())
  let rev = [3, 1, 2].reverse()
  match rev.first() {
    some(v) => print(v),
    none => print(-1),
  }
}
