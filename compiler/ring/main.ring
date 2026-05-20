use types::{Type, Effect, EffectRow, INT, FLOAT, STR, UNIT, type_to_string, BUILTIN_INT, EMPTY_ROW, make_option_type, is_option_type, types_equal, effects_equal, effect_to_string}
use ast::{Span, Position, span_zero, Expr, Stmt, Decl, Program, BinOp, Pattern, TypeExpr}
use hir::{HExpr, HStmt, HDecl, HProgram, variant_js_name, trait_dict_name, evidence_param_name, ENUM_TAG_FIELD, OPTION_SOME_TAG, TraitDispatch, HParam}
use codes::{E0301, error_description}
use builtin_methods::{STR_METHODS, LIST_HOF_METHODS}

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

    print("All modules linked successfully!")
}
