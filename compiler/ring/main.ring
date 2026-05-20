use types::{Type, Effect, EffectRow, INT, FLOAT, STR, UNIT, type_to_string, BUILTIN_INT, EMPTY_ROW, make_option_type, is_option_type, types_equal, effects_equal, effect_to_string}
use ast::{Span, Position, span_zero, Expr, Stmt, Decl, Program, BinOp, Pattern, TypeExpr}
use hir::{HExpr, HStmt, HDecl, HProgram, variant_js_name, trait_dict_name, evidence_param_name, ENUM_TAG_FIELD, OPTION_SOME_TAG, TraitDispatch, HParam}
use codes::{E0301, error_description}
use builtin_methods::{STR_METHODS, LIST_HOF_METHODS}
use diagnostics::{Severity, DiagnosticContext, Diagnostic, CollectingSink, new_collecting_sink, make_diagnostic, make_diag, severity_to_str}
use formatter::{format_human, format_llm}
use lexer::{TokenKind, Token, Lexer, new_lexer, token_kind_value}

fn main() {
    // Test types module
    let t = INT()
    print(type_to_string(t))
    print(type_to_string(FLOAT()))
    print(type_to_string(STR()))

    // Test Option type helper
    let opt = make_option_type(INT())
    print(type_to_string(opt))

    // Test type equality
    if types_equal(INT(), INT()) {
        print("INT == INT: true")
    }
    if !types_equal(INT(), FLOAT()) {
        print("INT == FLOAT: false")
    }

    // Test effect helpers
    let row = EMPTY_ROW()
    print("empty row effects: ${row.effects.len().to_str()}")

    // Test span_zero
    let s = span_zero()
    print("span file: ${s.file}")

    // Test hir naming conventions
    print(variant_js_name("Option", "some"))
    print(trait_dict_name("Int", "Eq"))
    print(evidence_param_name("io"))
    print(ENUM_TAG_FIELD())

    // Test codes module
    print(E0301())
    print(error_description("E0301"))

    // Test builtin_methods module
    let methods = STR_METHODS()
    print("Str methods count: ${methods.len().to_str()}")
    let hof = LIST_HOF_METHODS()
    print("List HOF methods count: ${hof.len().to_str()}")

    // ============================================================
    // Batch 2: Diagnostics + Formatter + Lexer
    // ============================================================

    // Test diagnostics module
    let sink = new_collecting_sink()
    assert(!sink.has_errors(), "empty sink has no errors")
    let test_span = span_zero()
    let d = make_diag(
        "E0301",
        Severity::SevError,
        "Type mismatch",
        test_span,
        DiagnosticContext::TypeMismatch { expected: "Int", actual: "Str", expression: none }
    )
    sink.report(d)
    assert(sink.has_errors(), "sink has errors after report")
    assert(sink.diagnostics().len() == 1, "one diagnostic")
    print("severity: ${severity_to_str(Severity::SevError)}")

    // Test formatter
    let fmt_source = "let x: Int = \"hello\""
    let fmt_out = format_human(sink.diagnostics(), fmt_source)
    print("format_human output length: ${fmt_out.len().to_str()}")

    let llm_out = format_llm(sink.diagnostics(), "test.ring")
    assert(llm_out.contains("\"version\": 1"), "llm format has version")
    assert(llm_out.contains("\"code\": \"E0301\""), "llm format has code")
    print("format_llm ok")

    // Test lexer
    let lex_source = "fn main() { let x = 42 }"
    var lexer = new_lexer(lex_source, "<test>", new_collecting_sink())
    let tokens = lexer.tokenize()
    print("token count: ${tokens.len().to_str()}")

    let first = tokens.get(0)
    match first {
        some(tok) => {
            assert(token_kind_value(tok.kind) == "fn", "first token is fn")
            print("first token: ${token_kind_value(tok.kind)}")
        },
        none => panic("no tokens")
    }

    // Test lexer with string interpolation
    var lex2 = new_lexer("\"hello \${x} world\"", "<test>", new_collecting_sink())
    let tokens2 = lex2.tokenize()
    let first2 = tokens2.get(0)
    match first2 {
        some(tok) => {
            assert(token_kind_value(tok.kind) == "string_interp_start", "interp start")
            assert(tok.value == "hello ", "interp start value")
        },
        none => panic("no tokens")
    }
    print("string interpolation lexing ok")

    // Test lexer with operators
    var lex3 = new_lexer("x >= 0 && y != 1", "<test>", new_collecting_sink())
    let tokens3 = lex3.tokenize()
    print("operator token count: ${tokens3.len().to_str()}")

    print("All modules linked successfully!")
}
