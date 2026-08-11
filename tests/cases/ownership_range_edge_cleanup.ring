// B-104 Range binding ownership across normal, Continue, Break, nested-loop,
// Return, Take, range-value, and wildcard codegen paths.

fn consume(move value: Int) -> Int { value }

fn stmt_return_take() -> Int {
    for i in 0..5 {
        if i == 2 { return consume(i) }
    }
    -1
}

fn expr_return_take() -> Int {
    for i in 0..5 {
        match i {
            3 => return consume(i)
            _ => {}
        }
    }
    -1
}

fn stmt_return_live() -> Int {
    for i in 0..5 {
        if i == 2 { return 7 }
    }
    -1
}

fn expr_return_live() -> Int {
    for i in 0..5 {
        match i {
            3 => return 8
            _ => {}
        }
    }
    -1
}

fn main() {
    let mut total = 0

    // Normal edge with a Take: backend cleanup observes a null slot.
    for i in 0..3 {
        total = total + consume(i)
    }

    // Continue while LIVE and after Take/MOVED.
    for i in 0..4 {
        if i == 1 { continue }
        total = total + i
    }
    for i in 0..4 {
        let moved = consume(i)
        if moved == 2 { continue }
        total = total + moved
    }

    // Break while LIVE and after Take/MOVED.
    for i in 0..5 {
        if i == 2 { break }
        total = total + i
    }
    for i in 0..5 {
        let moved = consume(i)
        if moved == 3 { break }
        total = total + moved
    }

    // An inner While/Range Break must not clean the outer Range counter.
    for i in 0..3 {
        let mut once = 0
        while once < 1 {
            once = once + 1
            break
        }
        total = total + consume(i)
    }
    for i in 0..3 {
        for j in 0..3 {
            if j == 1 { break }
        }
        total = total + consume(i)
    }

    // A named Range value shares the same cleanup path.
    let values = 0..3
    for i in values {
        total = total + consume(i)
    }

    // Wildcards have no counter slot to box or drop (direct and named Range).
    for _ in 0..2 { total = total + 1 }
    let wildcard_values = 0..2
    for _ in wildcard_values { total = total + 1 }

    total = total + stmt_return_take() + expr_return_take()
    total = total + stmt_return_live() + expr_return_live()
    print(total)
}
