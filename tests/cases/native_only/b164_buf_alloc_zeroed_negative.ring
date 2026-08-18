fn main() {
    let buffer = ring_buf_alloc_zeroed(-1)
    ring_buf_dealloc(buffer)
}
