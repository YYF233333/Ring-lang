fn risky(x: Int) -> Int {
    if x > 0 { x } else { fail.raise("negative") }
}

fn main() {
    let a = try { risky(42) }
    let b = try { risky(-1) }
    let va = match a { some(v) => v, none => 0 }
    let vb = match b { some(v) => v, none => 0 }
    print(va + vb)
}
