// B-100 P1.1 parity: generic basics — unbounded generics (identity, first),
// generic struct, generic enum, generic functions with multiple type params.



fn identity<T>(x: T) -> T {
    x
}

fn first<A, B>(a: A, b: B) -> A {
    a
}

fn second<A, B>(a: A, b: B) -> B {
    b
}

struct Wrapper<T> {
    value: T,
}

// A generic method may inspect a projected value by borrow. Returning the
// unconstrained field would instead be an unsupported partial move.
impl<T: Eq> Wrapper {
    fn matches(self, expected: T) -> Bool { self.value == expected }
}

struct Pair<A, B> {
    fst: A,
    snd: B,
}

enum Either<L, R> {
    Left(L),
    Right(R),
}

// Keep the projected return non-may-own while the enum itself remains generic.
fn get_right_or<L>(e: Either<L, Int>, default: Int) -> Int {
    match e {
        Left(l) => default,
        Right(r) => r,
    }
}

fn swap_pair<A, B>(fst: A, snd: B) -> Pair<B, A> {
    Pair { fst: snd, snd: fst }
}

fn main() {
    // Identity with different types
    print("id_int=${identity(42)}")
    print("id_str=${identity("hello")}")
    print("id_bool=${identity(true)}")

    // First and second
    print("first=${first(1, "a")}")
    print("second=${second(1, "b")}")

    // Generic struct
    let w1 = Wrapper { value: 99 }
    assert(w1.matches(99), "generic wrapper Int borrow")
    print("wrap_int=99")
    let w2 = Wrapper { value: "wrapped" }
    assert(w2.matches("wrapped"), "generic wrapper Str borrow")
    print("wrap_str=wrapped")

    // Generic pair
    let p = Pair { fst: 10, snd: "ten" }
    print("pair_fst=${p.fst}")
    print("pair_snd=${p.snd}")
    let sp = swap_pair(p.fst, p.snd)
    print("swap_fst=${sp.fst}")
    print("swap_snd=${sp.snd}")

    // Generic enum
    let e1: Either<Str, Int> = Right(42)
    print("right=${get_right_or(e1, 0)}")
    let e2: Either<Str, Int> = Left("err")
    print("left_default=${get_right_or(e2, -1)}")
}
