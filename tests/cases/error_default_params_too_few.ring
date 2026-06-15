// B-069: Too few arguments even accounting for defaults should be rejected (E0301)

fn connect(host: Str, port: Int = 8080, timeout: Int = 30) -> Str {
    "${host}:${port.to_str()}"
}

fn main() {
    // host is required, so 0 args should fail
    print(connect())
}
