// Tuple match with NamedConstructor sub-patterns (like unify's `match (a,b)`).
// The wrong arm must NOT be selected when tags differ.
enum Ty {
    V { id: Int },
    Fn { params: List<Ty>, ret: Ty },
    Str2 { name: Str, tparams: List<Ty> }
}

fn classify(a: Ty, b: Ty) -> Str {
    match (a, b) {
        (Ty::Fn { params: pa, ret: ra }, Ty::Fn { params: pb, ret: rb }) =>
            "both Fn (np=${pa.len()}/${pb.len()})",
        (Ty::Str2 { name: na, tparams: ta }, Ty::Str2 { name: nb, tparams: tb }) =>
            "both Str2 ${na}/${nb} (nt=${ta.len()}/${tb.len()})",
        _ => "other"
    }
}

fn classify_nested(value: Ty) -> Int {
    match ((value, value), (value, value)) {
        ((Ty::V { id: left }, _), (_, Ty::V { id: right })) => left + right,
        _ => 0
    }
}

fn main() {
    // The exact callable type makes the intended borrow-only contract explicit:
    // matching the direct tuple view in classify must not strengthen either
    // parameter to Move.
    let classifier: fn(Ty, Ty) -> Str = classify
    let a = Ty::Str2 { name: "X", tparams: [Ty::V { id: 1 }] }
    let b = Ty::Str2 { name: "Y", tparams: [Ty::V { id: 2 }] }
    print(classifier(a, b))   // expect: both Str2 X/Y (nt=1/1)

    let f = Ty::Fn { params: [Ty::V { id: 3 }], ret: Ty::V { id: 4 } }
    print(classifier(f, f))   // expect: both Fn (np=1/1)

    print(classifier(a, f))   // expect: other

    // Nested direct tuple views must share the same borrow-only rule, while the
    // ordinary tuple constructor path remains owning outside Match.
    let nested_classifier: fn(Ty) -> Int = classify_nested
    let value = Ty::V { id: 7 }
    print(nested_classifier(value))
    print(nested_classifier(value))
}
