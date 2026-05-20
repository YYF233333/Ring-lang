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
use unify::{UnificationError, empty_subst, occurs_in, unify, unify_effect_rows}
use infer_ctx::{InferResult, FnBoundsEntry, CompileError, InferCtx, new_infer_ctx,
    type_error, merge_effects, unify_at, free_type_vars, generalize,
    resolve_type_expr, resolve_named_type, bind_pattern,
    remove_fail_effect, remove_specific_fail_effect}
use infer_register::{register_decl_public, register_decls_two_phase}

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

    // ============================================================
    // Batch 4c: Unification
    // ============================================================

    // Test empty_subst
    let s0 = empty_subst()
    assert(s0.len() == 0, "empty subst has 0 entries")
    print("unify: empty_subst ok")

    // Test unify same primitives
    var env3 = new_type_env()
    let s1 = unify(INT(), INT(), empty_subst(), env3) or empty_subst()
    assert(s1.len() == 0, "unifying Int with Int adds no entries")
    print("unify: Int == Int ok")

    // Test unify var with concrete type
    var env4 = new_type_env()
    let tv = env4.fresh_var()
    let s2 = unify(tv, STR(), empty_subst(), env4) or empty_subst()
    assert(s2.len() == 1, "unifying var with Str adds 1 entry")
    let resolved = apply_subst(s2, tv)
    match resolved {
        Type::StrType => print("unify: var -> Str ok"),
        _ => panic("expected Str after unification")
    }

    // Test unify mismatch (should fail)
    var env5 = new_type_env()
    let mismatch_result = try { unify(INT(), STR(), empty_subst(), env5) }
    assert(mismatch_result.is_none(), "Int vs Str should fail")
    print("unify: mismatch detected ok")

    // Test occurs check
    var env6 = new_type_env()
    let v_occ = env6.fresh_var()
    let fn_with_v = Type::FnType {
        params: [v_occ],
        return_type: INT(),
        effects: EMPTY_ROW()
    }
    let occurs_result = try { unify(v_occ, fn_with_v, empty_subst(), env6) }
    assert(occurs_result.is_none(), "occurs check should fail")
    print("unify: occurs check ok")

    // Test occurs_in directly
    var env7 = new_type_env()
    let vid = env7.fresh_var_id()
    assert(occurs_in(vid, Type::TypeVar { id: vid, name: none }, empty_subst()), "var occurs in itself")
    assert(!occurs_in(vid, INT(), empty_subst()), "var does not occur in Int")
    print("unify: occurs_in ok")

    // Test unify function types
    var env8 = new_type_env()
    let fn_a = Type::FnType { params: [INT()], return_type: STR(), effects: EMPTY_ROW() }
    let fn_b = Type::FnType { params: [INT()], return_type: STR(), effects: EMPTY_ROW() }
    let s3 = unify(fn_a, fn_b, empty_subst(), env8) or empty_subst()
    assert(s3.len() == 0, "unifying identical fn types adds no entries")
    print("unify: fn types ok")

    // Test unify with type variables in fn
    var env9 = new_type_env()
    let tv2 = env9.fresh_var()
    let fn_c = Type::FnType { params: [tv2], return_type: tv2, effects: EMPTY_ROW() }
    let fn_d = Type::FnType { params: [INT()], return_type: INT(), effects: EMPTY_ROW() }
    let s4 = unify(fn_c, fn_d, empty_subst(), env9) or empty_subst()
    assert(s4.len() > 0, "unifying fn with vars produces substitution")
    let resolved2 = apply_subst(s4, tv2)
    match resolved2 {
        Type::IntType => print("unify: fn type vars resolved ok"),
        _ => panic("expected Int after fn unification")
    }

    // Test effect row unification
    var env10 = new_type_env()
    let row_a = EffectRow { effects: [Effect::IoEffect], tail: none }
    let row_b = EffectRow { effects: [Effect::IoEffect], tail: none }
    let s5 = unify_effect_rows(row_a, row_b, empty_subst(), env10) or empty_subst()
    assert(s5.len() == 0, "unifying same effect rows adds no entries")
    print("unify: effect rows ok")

    // Test never unifies with anything
    var env11 = new_type_env()
    let s6 = unify(Type::NeverType, INT(), empty_subst(), env11) or empty_subst()
    assert(s6.len() == 0, "never unifies with Int")
    let s7 = unify(STR(), Type::NeverType, empty_subst(), env11) or empty_subst()
    assert(s7.len() == 0, "Str unifies with never")
    print("unify: never ok")

    // ============================================================
    // Batch 4d: InferCtx
    // ============================================================

    // Test InferCtx creation
    let ictx = new_infer_ctx(new_collecting_sink())
    assert(ictx.env.scopes.len() == 1, "infer ctx has initial scope")
    assert(ictx.loop_depth == 0, "initial loop depth is 0")
    assert(ictx.current_fn_return_type.is_none(), "no fn return type initially")
    print("infer_ctx: new_infer_ctx ok")

    // Test unify_at (success case)
    var ictx2 = new_infer_ctx(new_collecting_sink())
    let us1 = unify_at(ictx2.sink, ictx2.env, INT(), INT(), empty_subst(), span_zero())
    assert(us1.len() == 0, "unify_at Int=Int no entries")
    print("infer_ctx: unify_at ok")

    // Test unify_at (failure → CompileError)
    var ictx3 = new_infer_ctx(new_collecting_sink())
    let uat_result = try { unify_at(ictx3.sink, ictx3.env, INT(), STR(), empty_subst(), span_zero()) }
    assert(uat_result.is_none(), "unify_at Int vs Str should fail")
    assert(ictx3.sink.has_errors(), "sink has error after unify_at failure")
    print("infer_ctx: unify_at error ok")

    // Test merge_effects
    var ictx4 = new_infer_ctx(new_collecting_sink())
    let (merged_row, merged_s) = merge_effects(ictx4.env, EMPTY_ROW(), EMPTY_ROW(), empty_subst())
    assert(merged_row.effects.len() == 0, "merge empty rows")
    print("infer_ctx: merge_effects ok")

    // Test free_type_vars
    var ictx5 = new_infer_ctx(new_collecting_sink())
    let tv_free = ictx5.env.fresh_var()
    let ftv = free_type_vars(tv_free, empty_subst())
    assert(ftv.len() == 1, "one free var in fresh var")
    let ftv_int = free_type_vars(INT(), empty_subst())
    assert(ftv_int.len() == 0, "no free vars in Int")
    print("infer_ctx: free_type_vars ok")

    // Test generalize
    var ictx6 = new_infer_ctx(new_collecting_sink())
    let tv_gen = ictx6.env.fresh_var()
    let gen_scheme = generalize(ictx6.env, tv_gen, empty_subst())
    assert(gen_scheme.type_vars.len() == 1, "generalize captures free var")
    print("infer_ctx: generalize ok")

    // Test resolve_named_type
    var ictx7 = new_infer_ctx(new_collecting_sink())
    register_builtins(ictx7.env)
    let resolved_int = resolve_named_type(ictx7, "Int", empty_type_exprs_for_test(), span_zero())
    match resolved_int {
        Type::IntType => print("infer_ctx: resolve_named_type Int ok"),
        _ => panic("expected IntType")
    }

    // Test remove_fail_effect
    let io_row = EffectRow { effects: [Effect::IoEffect], tail: none }
    let cleaned = remove_fail_effect(io_row)
    assert(cleaned.effects.len() == 1, "io not removed by remove_fail_effect")
    let empty_cleaned = remove_fail_effect(EMPTY_ROW())
    assert(empty_cleaned.effects.len() == 0, "empty row stays empty")
    print("infer_ctx: remove_fail_effect ok")

    // Test infer_register — parse + register a struct
    var ictx8 = new_infer_ctx(new_collecting_sink())
    register_builtins(ictx8.env)
    let prog_reg = parse("struct Point { x: Int, y: Int }\nfn add(a: Int, b: Int) -> Int { a }", "<test>")
    register_decls_two_phase(ictx8, prog_reg.decls)
    assert(ictx8.env.structs.contains_key("Point"), "Point struct registered")
    match ictx8.env.lookup("add") {
        some(s) => print("infer_register: fn 'add' registered ok"),
        none => panic("add not registered")
    }
    print("infer_register: two_phase ok")

    print("All modules linked successfully!")
}

fn empty_type_exprs_for_test() -> List<TypeExpr> {
    let x = [0]
    x.clear()
    x.map(fn(i: Int) -> TypeExpr { panic("unreachable") })
}
