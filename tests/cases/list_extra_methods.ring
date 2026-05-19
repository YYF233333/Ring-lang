// Test: List extra methods (join, sort, shift, index_of, find_index)

fn main() {
    // join
    let words = ["hello", "world", "ring"]
    let joined = words.join(", ")
    assert(joined == "hello, world, ring", "join with comma")
    assert(["a", "b"].join("") == "ab", "join empty sep")

    // sort (in-place, default JS lexicographic)
    var nums = ["c", "a", "b"]
    nums.sort()
    assert(nums.join(",") == "a,b,c", "sort strings")

    // shift (remove first element)
    var queue = [10, 20, 30]
    let first = queue.shift()
    match first {
        some(v) => assert(v == 10, "shift returns first"),
        none => assert(false, "shift should not be none")
    }
    assert(queue.len() == 2, "shift removes element")

    // index_of
    let xs = [10, 20, 30, 40]
    match xs.index_of(30) {
        some(i) => assert(i == 2, "index_of found"),
        none => assert(false, "index_of should find 30")
    }
    match xs.index_of(99) {
        some(i) => assert(false, "should not find 99"),
        none => {}
    }

    // find_index (HOF)
    match xs.find_index(fn(x) { x > 25 }) {
        some(i) => assert(i == 2, "find_index found"),
        none => assert(false, "find_index should find")
    }
    match xs.find_index(fn(x) { x > 100 }) {
        some(i) => assert(false, "should not find"),
        none => {}
    }

    print("list_extra_methods: all tests passed")
}
