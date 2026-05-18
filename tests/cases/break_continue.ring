fn main() {
    var sum = 0
    var i = 0
    while true {
        if i == 5 {
            break
        }
        if i == 3 {
            i += 1
            continue
        }
        sum += i
        i += 1
    }
    print(sum)
}
