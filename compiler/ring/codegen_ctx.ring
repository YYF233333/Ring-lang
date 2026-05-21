use types::{Type, Effect, EffectRow}
use hir::{HExpr, HStmt, HTraitMethod, evidence_param_name}

fn JS_RESERVED() -> Set<Str> {
    var s = set_new()
    for w in ["abstract", "arguments", "await", "boolean", "break", "byte", "case", "catch",
              "char", "class", "const", "continue", "debugger", "default", "delete", "do",
              "double", "else", "enum", "eval", "export", "extends", "false", "final",
              "finally", "float", "for", "function", "goto", "if", "implements", "import",
              "in", "instanceof", "int", "interface", "let", "long", "native", "new",
              "null", "package", "private", "protected", "public", "return", "short",
              "static", "super", "switch", "synchronized", "this", "throw", "throws",
              "transient", "true", "try", "typeof", "undefined", "var", "void",
              "volatile", "while", "with", "yield",
              "Object", "Array", "Map", "Set", "String", "Number", "Boolean", "Symbol",
              "Promise", "Error", "RegExp", "Date", "Math", "JSON", "Proxy", "Reflect",
              "WeakMap", "WeakSet", "WeakRef", "BigInt", "ArrayBuffer", "DataView",
              "Int8Array", "Uint8Array", "Float32Array", "Float64Array"] {
        s.insert(w)
    }
    s
}

pub fn safe_ident(name: Str) -> Str {
    if JS_RESERVED().contains(name) { "_${name}" } else { name }
}

pub struct CodegenCtx {
    pub lines: List<Str>,
    pub indent_level: Int,
    pub impl_methods: Map<Str, Str?>,
    pub struct_field_order: Map<Str, List<Str>>,
    pub trait_decls: Map<Str, HTraitDeclInfo>,
    pub match_counter: Int,
    pub dt_counter: Int,
    pub loop_counter: Int,
    pub module_prefix: Str?,
    pub imports_map: Map<Str, Str>?,
    pub skip_preamble: Bool,
    pub skip_main_call: Bool,
    pub local_names: Set<Str>,
    pub module_imports: List<Str>?,
    pub module_exports: List<Str>?
}

pub struct HTraitDeclInfo {
    pub name: Str,
    pub methods: List<HTraitMethod>
}

pub fn new_codegen_ctx(skip_preamble: Bool, skip_main_call: Bool) -> CodegenCtx {
    CodegenCtx {
        lines: empty_strs(),
        indent_level: 0,
        impl_methods: map_new(),
        struct_field_order: map_new(),
        trait_decls: map_new(),
        match_counter: 0,
        dt_counter: 0,
        loop_counter: 0,
        module_prefix: none,
        imports_map: none,
        skip_preamble: skip_preamble,
        skip_main_call: skip_main_call,
        local_names: set_new(),
        module_imports: none,
        module_exports: none
    }
}

fn indent_str(level: Int) -> Str {
    var result = ""
    for i in 0..level {
        result = "${result}  "
    }
    result
}

pub fn emit(var ctx: CodegenCtx, line: Str) {
    let prefix = indent_str(ctx.indent_level)
    ctx.lines.push("${prefix}${line}")
}

pub fn emit_raw(var ctx: CodegenCtx, text: Str) {
    ctx.lines.push(text)
}

pub fn push_indent(var ctx: CodegenCtx) {
    ctx.indent_level = ctx.indent_level + 1
}

pub fn pop_indent(var ctx: CodegenCtx) {
    ctx.indent_level = ctx.indent_level - 1
}

pub fn qualify(ctx: CodegenCtx, name: Str) -> Str {
    match ctx.imports_map {
        some(imap) => {
            if !ctx.local_names.contains(name) {
                match imap.get(name) {
                    some(qualified) => { return qualified },
                    none => {},
                }
            }
        },
        none => {},
    }
    match ctx.module_prefix {
        some(prefix) => {
            if ctx.local_names.contains(name) {
                let safe = safe_ident(name)
                return "${prefix}$${safe}"
            }
        },
        none => {},
    }
    safe_ident(name)
}

fn effect_name(e: Effect) -> Str {
    match e {
        Effect::IoEffect => "io",
        Effect::FailEffect { .. } => "fail",
        Effect::MutEffect => "mut",
        Effect::CustomEffect { name, .. } => name,
    }
}

pub fn extract_effect_names(effects: EffectRow) -> List<Str> {
    var names: List<Str> = empty_strs()
    for e in effects.effects {
        let n = effect_name(e)
        if names.contains(n) == false {
            names.push(n)
        }
    }
    names.sort()
    names
}

pub fn get_evidence_params(effects: EffectRow) -> List<Str> {
    extract_effect_names(effects).map(fn(n) { evidence_param_name(n) })
}

pub fn LIST_HOF_JS_METHOD(method: Str) -> Str? {
    if method == "map" { some("map") }
    else { if method == "filter" { some("filter") }
    else { if method == "flat_map" { some("flatMap") }
    else { if method == "any" { some("some") }
    else { if method == "all" { some("every") }
    else { none } } } } }
}

fn empty_strs() -> List<Str> { let x = [""]; x.clear(); x }
