use types::{Type, EffectRow}
use ast::{TypeParam}
use hir::{HExpr, HStmt, HDecl, HParam, HStructField, HEnumVariant,
    HEffectOp, HTraitMethod, TraitBound,
    trait_dict_name, evidence_param_name, trait_bound_param_name,
    default_method_self_name, ENUM_TAG_FIELD}
use codegen_ctx::{CodegenCtx, HTraitDeclInfo, emit, emit_raw, push_indent, pop_indent,
    qualify, safe_ident, extract_effect_names, get_evidence_params}
use codegen_stmt::{emit_block_body}

// ============================================================
// Top-level dispatch
// ============================================================

pub fn emit_decl(var ctx: CodegenCtx, decl: HDecl) {
    match decl {
        HDecl::Fn { name, params, effects, body, trait_bounds, .. } =>
            emit_fn_decl(ctx, name, params, effects, body, trait_bounds, none),
        HDecl::Struct { name, fields, .. } =>
            emit_struct_decl(ctx, name, fields),
        HDecl::Enum { name, variants, .. } =>
            emit_enum_decl(ctx, name, variants),
        HDecl::Impl { target_type, trait_name, methods, .. } =>
            emit_impl_decl(ctx, target_type, trait_name, methods),
        HDecl::Effect { .. } => {},
        HDecl::Test { description, body, .. } =>
            emit_test_decl(ctx, description, body),
        HDecl::Trait { name, methods, .. } =>
            emit_trait_decl(ctx, name, methods),
        HDecl::ExternFn { name, .. } =>
            emit_extern_fn_decl(ctx, name),
        HDecl::ExternType { .. } => {},
        HDecl::TypeAlias { .. } => {},
    }
}

// ============================================================
// Function declarations
// ============================================================

pub fn emit_fn_decl(var ctx: CodegenCtx, name: Str, params: List<HParam>, effects: EffectRow, body: HExpr, trait_bounds: List<TraitBound>, prefix: Str?) {
    let fn_name = match prefix {
        some(p) => {
            let sn = safe_ident(name)
            "${p}_${sn}"
        },
        none => qualify(ctx, name),
    }
    var param_names: List<Str> = [""]; param_names.clear()
    for p in params { param_names.push(safe_ident(p.name)) }
    var dict_params: List<Str> = [""]; dict_params.clear()
    for b in trait_bounds {
        dict_params.push(trait_bound_param_name(b.type_param, b.trait_name))
    }
    let effective_effects = match ctx.local_fn_effects.get(name) {
        some(eff) => eff,
        none => effects,
    }
    let ev_params = get_evidence_params(effective_effects)
    var all: List<Str> = [""]; all.clear()
    all.extend(param_names)
    all.extend(dict_params)
    all.extend(ev_params)
    let all_str = all.join(", ")
    emit(ctx, "function ${fn_name}(${all_str}) {")
    push_indent(ctx)
    let saved_fn_effects = ctx.current_fn_effects
    ctx.current_fn_effects = some(effective_effects)
    emit_block_body(ctx, body)
    ctx.current_fn_effects = saved_fn_effects
    pop_indent(ctx)
    emit(ctx, "}")
}

// ============================================================
// Extern fn declarations
// ============================================================

fn emit_extern_fn_decl(var ctx: CodegenCtx, name: Str) {
    match ctx.module_prefix {
        some(prefix) => {
            let qualified = "${prefix}$${safe_ident(name)}"
            let sn = safe_ident(name)
            emit(ctx, "const ${qualified} = ${sn};")
        },
        none => {},
    }
}

// ============================================================
// Struct declarations
// ============================================================

fn emit_struct_decl(var ctx: CodegenCtx, name: Str, fields: List<HStructField>) {
    var raw_fields: List<Str> = [""]; raw_fields.clear()
    var safe_fields: List<Str> = [""]; safe_fields.clear()
    for f in fields {
        raw_fields.push(f.name)
        safe_fields.push(safe_ident(f.name))
    }
    let qname = qualify(ctx, name)
    let params = safe_fields.join(", ")
    emit(ctx, "class ${qname} {")
    push_indent(ctx)
    emit(ctx, "constructor(${params}) {")
    push_indent(ctx)
    for i in 0..raw_fields.len() {
        match (raw_fields.get(i), safe_fields.get(i)) {
            (some(raw), some(safe)) => emit(ctx, "this.${raw} = ${safe};"),
            _ => {},
        }
    }
    pop_indent(ctx)
    emit(ctx, "}")
    pop_indent(ctx)
    emit(ctx, "}")
}

// ============================================================
// Enum declarations
// ============================================================

fn emit_enum_decl(var ctx: CodegenCtx, name: Str, variants: List<HEnumVariant>) {
    let tag = ENUM_TAG_FIELD()
    for v in variants {
        let js_name = "${qualify(ctx, name)}_${v.name}"
        if v.fields.len() == 0 {
            emit(ctx, "const ${js_name} = Object.freeze({ ${tag}: \"${v.name}\" });")
        } else {
            match v.field_names {
                some(fnames) => {
                    var sparams: List<Str> = [""]; sparams.clear()
                    for n in fnames { sparams.push(safe_ident(n)) }
                    let params_str = sparams.join(", ")
                    emit(ctx, "function ${js_name}(${params_str}) {")
                    push_indent(ctx)
                    emit(ctx, "return { ${tag}: \"${v.name}\", ${params_str} };")
                    pop_indent(ctx)
                    emit(ctx, "}")
                },
                none => {
                    var sparams: List<Str> = [""]; sparams.clear()
                    for i in 0..v.fields.len() { sparams.push("_${i}") }
                    let params_str = sparams.join(", ")
                    emit(ctx, "function ${js_name}(${params_str}) {")
                    push_indent(ctx)
                    emit(ctx, "return { ${tag}: \"${v.name}\", ${params_str} };")
                    pop_indent(ctx)
                    emit(ctx, "}")
                },
            }
        }
    }
}

// ============================================================
// Impl declarations
// ============================================================

fn emit_impl_decl(var ctx: CodegenCtx, target_type: Str, trait_name: Str?, methods: List<HDecl>) {
    let prefix = match trait_name {
        some(tn) => trait_dict_name(qualify(ctx, target_type), safe_ident(tn)),
        none => qualify(ctx, target_type),
    }
    for method in methods {
        match method {
            HDecl::ExternFn { .. } => {},
            HDecl::Fn { name, params, effects, body, trait_bounds, .. } =>
                emit_fn_decl(ctx, name, params, effects, body, trait_bounds, some(prefix)),
            _ => {},
        }
    }
    match trait_name {
        some(tn) => emit_trait_dictionary(ctx, target_type, tn, methods),
        none => {},
    }
}

fn emit_trait_dictionary(var ctx: CodegenCtx, target_type: Str, trait_name: Str, methods: List<HDecl>) {
    let qt = qualify(ctx, target_type)
    let dict_name = trait_dict_name(qt, trait_name)
    var impl_method_names = set_new()
    for m in methods {
        match m {
            HDecl::Fn { name, .. } => { impl_method_names.insert(name) },
            _ => {},
        }
    }

    var entries: List<Str> = [""]; entries.clear()
    for m in methods {
        match m {
            HDecl::Fn { name, .. } => {
                let smn = safe_ident(name)
                let fn_name = "${dict_name}_${smn}"
                entries.push("${smn}: ${fn_name}")
            },
            _ => {},
        }
    }

    match ctx.trait_decls.get(trait_name) {
        some(trait_decl) => {
            for tm in trait_decl.methods {
                if tm.has_default {
                    if impl_method_names.contains(tm.name) == false {
                        let stn = safe_ident(trait_name)
                        let smn = safe_ident(tm.name)
                        let default_fn = "__${stn}_${smn}"
                        var param_names: List<Str> = [""]; param_names.clear()
                        for p in tm.params { param_names.push(safe_ident(p.name)) }
                        let params_str = param_names.join(", ")
                        var call_args: List<Str> = [""]; call_args.clear()
                        call_args.push(dict_name)
                        call_args.extend(param_names)
                        let call_str = call_args.join(", ")
                        entries.push("${smn}: function(${params_str}) { return ${default_fn}(${call_str}); }")
                    }
                }
            }
        },
        none => {},
    }

    let entries_str = entries.join(", ")
    emit(ctx, "const ${dict_name} = { ${entries_str} };")
}

// ============================================================
// Trait declarations
// ============================================================

fn emit_trait_decl(var ctx: CodegenCtx, name: Str, methods: List<HTraitMethod>) {
    for method in methods {
        match method.body {
            some(body) => {
                if method.has_default {
                    let sn = safe_ident(name)
                    let smn = safe_ident(method.name)
                    let fn_name = "__${sn}_${smn}"
                    var param_names: List<Str> = [""]; param_names.clear()
                    for p in method.params { param_names.push(safe_ident(p.name)) }
                    let self_name = default_method_self_name(safe_ident(name))
                    var all: List<Str> = [""]; all.clear()
                    all.push(self_name)
                    all.extend(param_names)
                    let all_str = all.join(", ")
                    emit(ctx, "function ${fn_name}(${all_str}) {")
                    push_indent(ctx)
                    emit_block_body(ctx, body)
                    pop_indent(ctx)
                    emit(ctx, "}")
                }
            },
            none => {},
        }
    }
}

// ============================================================
// Test declarations
// ============================================================

fn emit_test_decl(var ctx: CodegenCtx, description: Str, body: HExpr) {
    emit(ctx, "// test: ${description}")
    emit(ctx, "(function() {")
    push_indent(ctx)
    emit_block_body(ctx, body)
    pop_indent(ctx)
    emit(ctx, "})();")
}

// ============================================================
// Top-level evidence emission (for main() auto-call)
// ============================================================

pub fn emit_toplevel_evidence(var ctx: CodegenCtx, effects: EffectRow) {
    let effect_names = extract_effect_names(effects)
    for name in effect_names {
        let ev_name = evidence_param_name(name)
        if name == "io" {
            emit(ctx, "const ${ev_name} = { read: (p) => __require(\"fs\").readFileSync(p, \"utf-8\"), write: (p, d) => __require(\"fs\").writeFileSync(p, d, \"utf-8\") };")
        } else {
            if name == "fail" {
                emit(ctx, "const ${ev_name} = { raise: (error) => { throw error; } };")
            } else {
                emit(ctx, "const ${ev_name} = {};")
            }
        }
    }
}
