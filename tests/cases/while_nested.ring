// Test: nested while loops with break/continue interactions

fn main() {
    // Nested loops — break only exits inner loop
    var outer_count = 0
    var inner_total = 0
    var i = 0
    while i < 3 {
        var j = 0
        while j < 10 {
            if j == 3 { break }
            inner_total = inner_total + 1
            j = j + 1
        }
        outer_count = outer_count + 1
        i = i + 1
    }
    assert(outer_count == 3, "outer loops all ran")
    assert(inner_total == 9, "inner break at 3, 3 outer iterations")

    // Continue in outer, break in inner
    var sum = 0
    var x = 0
    while x < 5 {
        x = x + 1
        if x == 3 { continue }
        var y = 0
        while y < 3 {
            y = y + 1
            sum = sum + 1
        }
    }
    // x=1,2,4,5 each run inner (3 iterations) = 12, x=3 skipped
    assert(sum == 12, "continue outer, full inner")

    print("while_nested: all tests passed")
}
