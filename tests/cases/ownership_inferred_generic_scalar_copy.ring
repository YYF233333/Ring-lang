// One body-inferred owning edge must specialize by the concrete value shape:
// scalar, Ptr and direct extern values copy across it rather than becoming
// logically unavailable.  Ptr/H probes are compile-time only because they have
// no safe source constructor in this fixture.
extern type H

fn forward<T>(value: T) -> T { value }
fn observe_ptr(value: Ptr<Int>) {}
fn observe_handle(value: H) {}

fn probe_ptr(source: Ptr<Int>) {
    let returned = forward(source)
    observe_ptr(returned)
    observe_ptr(source)
}

fn probe_handle(source: H) {
    let returned = forward(source)
    observe_handle(returned)
    observe_handle(source)
}

fn main() {
    let source = 7
    let returned = forward(source)
    print("${returned}/${source}")
}
