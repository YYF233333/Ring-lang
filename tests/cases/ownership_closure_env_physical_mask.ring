extern type RuntimeCaptureHandle

effect RuntimeCaptureRead {
    fn read() -> Int
}

fn make_handle_list_reader() -> fn() -> Int {
    let values: List<RuntimeCaptureHandle> = []
    fn() -> Int { values.len() }
}

fn read_handle_list_with_handler() -> Int {
    let values: List<RuntimeCaptureHandle> = []
    handle {
        RuntimeCaptureRead.read()
    } with {
        RuntimeCaptureRead.read() => values.len(),
    }
}

fn make_text_reader() -> fn() -> Int {
    let text = "retained"
    fn() -> Int { text.len() }
}

fn main() {
    let list_reader = make_handle_list_reader()
    print(list_reader())
    print(read_handle_list_with_handler())

    // The source binding is gone before either call. The closure owns one
    // physical-RC reference and releases it when the closure itself dies.
    let text_reader = make_text_reader()
    print(text_reader())
    print(text_reader())
}
