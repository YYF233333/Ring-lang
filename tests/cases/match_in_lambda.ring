// B-055: Regression test — match expression inside lambda body.
// Before B-055, non-return match used IIFE which worked but was wasteful.
// After B-055, all match uses labeled-block + temp variable; lambda codegen
// must capture emitted statements into the lambda body.

enum Severity {
    Error,
    Warning,
    Info
}

struct Diagnostic {
    severity: Severity,
    message: Str
}

fn main() {
    let diags = [
        Diagnostic { severity: Severity::Error, message: "type mismatch" },
        Diagnostic { severity: Severity::Warning, message: "unused var" },
        Diagnostic { severity: Severity::Info, message: "note" },
        Diagnostic { severity: Severity::Error, message: "missing field" },
    ]

    // match in lambda — the critical case for B-055
    let has_error = diags.any(fn(d) {
        match d.severity {
            Severity::Error => true,
            _ => false,
        }
    })
    assert(has_error, "should find error")

    // match in lambda with binding
    let error_messages: List<Str> = diags
        .filter(fn(d) {
            match d.severity {
                Severity::Error => true,
                _ => false,
            }
        })
        .map(fn(d) { d.message })
    assert(error_messages.len() == 2, "should have 2 errors")
    assert(error_messages[0] == "type mismatch", "first error")
    assert(error_messages[1] == "missing field", "second error")

    // match in lambda returning a value
    let labels = diags.map(fn(d) {
        match d.severity {
            Severity::Error => "ERR",
            Severity::Warning => "WARN",
            Severity::Info => "INFO",
        }
    })
    assert(labels[0] == "ERR", "label 0")
    assert(labels[1] == "WARN", "label 1")
    assert(labels[2] == "INFO", "label 2")
    assert(labels[3] == "ERR", "label 3")

    // nested: match inside lambda inside another match arm
    let result = match diags.len() {
        4 => diags.any(fn(d) {
            match d.severity {
                Severity::Warning => true,
                _ => false,
            }
        }),
        _ => false,
    }
    assert(result, "nested match-in-lambda-in-match should find warning")

    print("match_in_lambda: all tests passed")
}
