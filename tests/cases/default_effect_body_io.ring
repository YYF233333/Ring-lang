// Test: default effect body that calls a local function requiring io
// Verifies evidence parameters are correctly passed to default effect
// handler factory functions when the body needs effects like io.

fn log_message(msg: Str) {
    print("LOG: ${msg}")
}

trait Renderable {
    fn render(self) -> Str
}

struct LogValue {
    text: Str
}

impl Renderable for LogValue {
    fn render(self) -> Str { self.text }
}

fn render_value<T: Renderable>(value: T) -> Str {
    value.render()
}

effect Logger {
    fn log(msg: Str) -> Str {
        // Default body calls log_message which requires io
        log_message(msg)
        // The borrowed op parameter escapes as the default body's result.
        msg
    }

    fn tag() -> Str {
        // Default body directly calls print (extern fn with io effect)
        print("TAG")
        "tagged"
    }

    fn format(value: LogValue, enabled: Bool) -> Str {
        // Static trait evidence must be lowered inside default bodies. The
        // short-circuit expression also exercises and/or + ANF traversal.
        let rendered = render_value(value)
        if enabled && rendered.len() > 0 {
            rendered
        } else {
            "disabled"
        }
    }
}

fn use_logger() -> Str {
    let tag = Logger.tag()
    Logger.log("hello ${tag}")
}

fn main() {
    let result = use_logger()
    assert(result == "hello tagged", "should return the message")
    let rendered = Logger.format(LogValue { text: "dict-value" }, true)
    assert(rendered == "dict-value", "default body should lower trait evidence")
    let disabled = Logger.format(LogValue { text: "ignored" }, false)
    assert(disabled == "disabled", "default body should preserve short-circuit semantics")
    print("default effect body io: ok")
}
