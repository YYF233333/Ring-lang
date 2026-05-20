use types::{Type, Effect, EffectRow, INT, FLOAT, STR, UNIT, type_to_string, BUILTIN_INT, EMPTY_ROW, make_option_type, is_option_type, types_equal, effects_equal, effect_to_string}
use ast::{Span, Position, span_zero, Expr, Stmt, Decl, Program, BinOp, Pattern, TypeExpr}
use hir::{HExpr, HStmt, HDecl, HProgram, variant_js_name, trait_dict_name, evidence_param_name, ENUM_TAG_FIELD, OPTION_SOME_TAG, TraitDispatch, HParam}
use codes::{E0301, error_description}
use builtin_methods::{STR_METHODS, LIST_HOF_METHODS}
use diagnostics::{Severity, DiagnosticContext, Diagnostic, CollectingSink, new_collecting_sink, make_diagnostic, make_diag, severity_to_str}
use formatter::{format_human, format_llm}
use lexer::{TokenKind, Token, Lexer, new_lexer, token_kind_value}
use parser::{parse}
use env::{SchemeBound, TypeScheme, mono, StructDef, EnumDef, EffectOpDef, BuiltInKind, EffectDef, TraitMethodDef, TraitDef, ImplEntry, TypeAliasDef, FnBound, Scope, TypeEnv, new_type_env, apply_subst, apply_subst_row}
use builtins::{register_builtins, register_hof_intrinsics, get_or_create_methods}

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

    // ============================================================
    // Batch 3: Parser
    // ============================================================

    // Test parser — parse a simple function
    let prog = parse("fn main() { let x = 42 }", "<test>")
    assert(prog.decls.len() == 1, "one decl")
    match prog.decls.get(0) {
        some(decl) => match decl {
            Decl::Fn { name, params, .. } => {
                assert(name == "main", "fn name is main")
                assert(params.len() == 0, "main has no params")
            },
            _ => panic("expected fn decl")
        },
        none => panic("no decls")
    }
    print("parser: simple fn ok")

    // Test parser — parse struct
    let prog2 = parse("struct Point { x: Int, y: Int }", "<test>")
    assert(prog2.decls.len() == 1, "one struct decl")
    match prog2.decls.get(0) {
        some(decl) => match decl {
            Decl::Struct { name, fields, .. } => {
                assert(name == "Point", "struct name is Point")
                assert(fields.len() == 2, "Point has 2 fields")
            },
            _ => panic("expected struct decl")
        },
        none => panic("no decls")
    }
    print("parser: struct ok")

    // Test parser — parse enum
    let prog3 = parse("enum Color { Red, Green, Blue }", "<test>")
    assert(prog3.decls.len() == 1, "one enum decl")
    match prog3.decls.get(0) {
        some(decl) => match decl {
            Decl::Enum { name, variants, .. } => {
                assert(name == "Color", "enum name is Color")
                assert(variants.len() == 3, "Color has 3 variants")
            },
            _ => panic("expected enum decl")
        },
        none => panic("no decls")
    }
    print("parser: enum ok")

    // Test parser — precedence and operators
    let prog4 = parse("fn f() { 1 + 2 * 3 }", "<test>")
    assert(prog4.decls.len() == 1, "one decl for expr")
    print("parser: operators ok")

    // Test parser — use declaration
    let prog5 = parse("use foo::{bar, baz}\nfn main() {}", "<test>")
    assert(prog5.uses.len() == 1, "one use decl")
    assert(prog5.decls.len() == 1, "one fn decl after use")
    print("parser: use decl ok")

    // ============================================================
    // Batch 4a: TypeEnv
    // ============================================================

    // Test TypeScheme + mono
    let ts = mono(INT())
    assert(ts.type_vars.len() == 0, "mono has no type_vars")
    assert(ts.bounds.len() == 0, "mono has no bounds")
    assert(ts.def_id.is_none(), "mono has no def_id")
    print("env: mono ok")

    // Test TypeEnv creation
    var env = new_type_env()
    assert(env.scopes.len() == 1, "initial scope count")
    assert(env.current_var_id() == 0, "initial var id")
    print("env: new_type_env ok")

    // Test fresh_var
    let v1 = env.fresh_var()
    let v2 = env.fresh_var()
    assert(env.current_var_id() == 2, "var id after 2 fresh")
    print("env: fresh_var ok")

    // Test scope management
    env.push_scope()
    assert(env.scopes.len() == 2, "2 scopes after push")
    env.bind_mono("x", INT())
    match env.lookup("x") {
        some(ts_x) => print("env: lookup x ok"),
        none => panic("lookup x failed")
    }
    env.pop_scope()
    assert(env.scopes.len() == 1, "1 scope after pop")
    assert(env.lookup("x").is_none(), "x not found after pop")
    print("env: scope management ok")

    // Test instantiate with type vars
    let tv_id = env.fresh_var_id()
    let scheme = TypeScheme {
        ty: Type::FnType {
            params: [Type::TypeVar { id: tv_id, name: none }],
            return_type: Type::TypeVar { id: tv_id, name: none },
            effects: EMPTY_ROW()
        },
        type_vars: [tv_id],
        bounds: [SchemeBound { type_var: tv_id, trait_name: "Eq" }],
        def_id: none
    }
    let instantiated = env.instantiate(scheme)
    match instantiated {
        Type::FnType { params, .. } => print("env: instantiate ok"),
        _ => panic("instantiate should return FnType")
    }

    // Test apply_subst
    let subst: Map<Int, Type> = map_new()
    subst.insert(99, INT())
    let substituted = apply_subst(subst, Type::TypeVar { id: 99, name: none })
    match substituted {
        Type::IntType => print("env: apply_subst ok"),
        _ => panic("apply_subst failed")
    }

    // ============================================================
    // Batch 4b: Builtins registration
    // ============================================================

    var env2 = new_type_env()
    register_builtins(env2)

    // Verify effects registered
    assert(env2.effects.contains_key("io"), "io effect registered")
    assert(env2.effects.contains_key("fail"), "fail effect registered")
    print("builtins: effects ok")

    // Verify Cell struct registered
    assert(env2.structs.contains_key("Cell"), "Cell struct registered")
    print("builtins: Cell ok")

    // Verify Option enum registered
    assert(env2.enums.contains_key("Option"), "Option enum registered")
    assert(env2.variant_to_enum.contains_key("some"), "some variant registered")
    assert(env2.variant_to_enum.contains_key("none"), "none variant registered")
    print("builtins: Option ok")

    // Verify traits registered
    assert(env2.traits.contains_key("Eq"), "Eq trait registered")
    assert(env2.traits.contains_key("Clone"), "Clone trait registered")
    assert(env2.traits.contains_key("Ord"), "Ord trait registered")
    assert(env2.traits.contains_key("Debug"), "Debug trait registered")
    print("builtins: traits ok")

    // Verify trait impls exist
    assert(env2.trait_impls.len() > 0, "trait impls registered")
    print("builtins: trait_impls count: ${env2.trait_impls.len().to_str()}")

    // Verify HOF registration
    register_hof_intrinsics(env2)
    let list_methods = get_or_create_methods(env2, "List")
    assert(list_methods.contains_key("map"), "List.map registered")
    assert(list_methods.contains_key("filter"), "List.filter registered")
    assert(list_methods.contains_key("fold"), "List.fold registered")
    print("builtins: HOF ok")

    print("All modules linked successfully!")
}
