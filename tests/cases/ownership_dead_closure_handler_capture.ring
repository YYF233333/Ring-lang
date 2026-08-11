struct DeadResource {
    id: Int
}

impl Drop for DeadResource {
    fn drop(self) {}
}

effect DeadProbe {
    fn read() -> Int
}

fn lambda_return_dead_read() -> Int {
    let source = DeadResource { id: 70 }
    let reader = fn() -> Int {
        return 7
        source.id
    }
    reader()
}

fn build_lambda_never_dead_read() -> Int {
    let source = DeadResource { id: 71 }
    let reader = fn() -> Int {
        panic("unreachable reader")
        source.id
    }
    12
}

fn handler_return_dead_read() -> Int {
    let source = DeadResource { id: 80 }
    handle {
        DeadProbe.read()
    } with {
        DeadProbe.read() => {
            return 8
            source.id
        },
    }
}

fn build_handler_never_dead_read() -> Int {
    let source = DeadResource { id: 81 }
    handle {
        0
    } with {
        DeadProbe.read() => {
            panic("unreachable handler")
            source.id
        },
    }
}

fn borrow_dead_resource(value: DeadResource) -> Int {
    value.id
}

fn consume_dead_resource(value: DeadResource) -> Int {
    let owned = value
    owned.id
}

fn reachable_callable_return() -> fn(DeadResource) -> Int {
    let mut selected = borrow_dead_resource
    return selected
    selected = consume_dead_resource
    consume_dead_resource
}

fn main() {
    print(lambda_return_dead_read())
    print(build_lambda_never_dead_read())
    print(handler_return_dead_read())
    print(build_handler_never_dead_read())

    let callable_source = DeadResource { id: 90 }
    let callback = reachable_callable_return()
    print(callback(callable_source))
    print(callable_source.id)
}
