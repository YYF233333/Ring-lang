// Compile-only structural fixture for closure-environment physical RC policy.
// Ptr and foreign-handle parameters are never fabricated or invoked by main.

extern type StructuralCaptureHandle

struct StructuralDeadResource {
    id: Int
}

impl Drop for StructuralDeadResource {
    fn drop(self) {}
}

effect StructuralCaptureRead {
    fn read() -> Int
}

effect StructuralBoundRead {
    fn read() -> Int
}

fn observe_capture_ptr(value: Ptr<Int>) -> Int { 11 }
fn observe_capture_handle(value: StructuralCaptureHandle) -> Int { 12 }

fn structural_ordinary_ptr_capture(
    value: Ptr<Int>
) -> fn() -> Int {
    fn() -> Int { observe_capture_ptr(value) }
}

fn structural_ordinary_handle_capture(
    value: StructuralCaptureHandle
) -> fn() -> Int {
    fn() -> Int { observe_capture_handle(value) }
}

fn structural_ordinary_list_handle_capture(
    values: List<StructuralCaptureHandle>
) -> fn() -> Int {
    fn() -> Int { values.len() }
}

fn structural_ordinary_str_capture(value: Str) -> fn() -> Int {
    fn() -> Int { value.len() }
}

fn structural_handler_ptr_capture(value: Ptr<Int>) -> Int {
    handle {
        StructuralCaptureRead.read()
    } with {
        StructuralCaptureRead.read() => observe_capture_ptr(value),
    }
}

fn structural_handler_handle_capture(
    value: StructuralCaptureHandle
) -> Int {
    handle {
        StructuralCaptureRead.read()
    } with {
        StructuralCaptureRead.read() => observe_capture_handle(value),
    }
}

fn structural_handler_list_handle_capture(
    values: List<StructuralCaptureHandle>
) -> Int {
    handle {
        StructuralCaptureRead.read()
    } with {
        StructuralCaptureRead.read() => values.len(),
    }
}

fn structural_handler_str_capture(value: Str) -> Int {
    handle {
        StructuralCaptureRead.read()
    } with {
        StructuralCaptureRead.read() => value.len(),
    }
}

fn structural_handler_int_capture(value: Int) -> Int {
    handle {
        StructuralCaptureRead.read()
    } with {
        StructuralCaptureRead.read() => value,
    }
}

fn structural_bound_read() -> Int with {StructuralBoundRead} {
    StructuralBoundRead.read()
}

fn structural_named_value_local() -> Int {
    handle {
        let reader = structural_bound_read
        reader()
    } with {
        StructuralBoundRead.read() => 31,
    }
}

fn structural_named_value_early_local() -> Int {
    handle {
        let reader = structural_bound_read
        return reader()
        0
    } with {
        StructuralBoundRead.read() => 32,
    }
}

fn structural_dead_lambda_return(
    source: StructuralDeadResource
) -> Int {
    let reader = fn() -> Int {
        return 71
        source.id
    }
    reader()
}

fn structural_dead_lambda_never(
    source: StructuralDeadResource
) -> Int {
    let reader = fn() -> Int {
        panic("unreachable structural lambda")
        source.id
    }
    72
}

fn structural_dead_handler_return(
    source: StructuralDeadResource
) -> Int {
    handle {
        StructuralCaptureRead.read()
    } with {
        StructuralCaptureRead.read() => {
            return 73
            source.id
        },
    }
}

fn structural_dead_handler_never(
    source: StructuralDeadResource
) -> Int {
    handle {
        74
    } with {
        StructuralCaptureRead.read() => {
            panic("unreachable structural handler")
            source.id
        },
    }
}

fn main() {
    // The structural oracle builds but does not execute this fixture.
}
