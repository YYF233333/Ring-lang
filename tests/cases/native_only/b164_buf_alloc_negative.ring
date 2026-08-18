fn main() {
    let buffer = ring_buf_alloc(-1)
    ring_buf_dealloc(buffer)
}
