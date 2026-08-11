// B-087 generic Eq dispatch remains covered without capturing `target: T` in a
// closure.  Ownership treats unresolved TypeVar captures as may-own and rejects
// them fail-closed, so the search is intentionally expressed as a direct loop.

fn find_first_match<T: Eq>(xs: List<T>, target: T) -> Bool {
    for x in xs {
        if x == target { return true }
    }
    false
}

fn main() {
    print(find_first_match([1, 2, 3], 2))      // true
    print(find_first_match([1, 2, 3], 9))      // false
    print(find_first_match(["a", "b"], "b"))   // true
    print(find_first_match(["a", "b"], "z"))   // false
}
