use types::{Type, EffectRow}
use ast::{TypeParam}
use hir::{HExpr, HStmt, HDecl, HParam, HProgram, HStructField, HEnumVariant,
    HTraitMethod, TraitBound, DerivedImpl,
    BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_STR, BUILTIN_INT,
    BUILTIN_FLOAT, BUILTIN_BOOL, BUILTIN_CELL, BUILTIN_OPTION}
use builtin_methods::{CELL_METHODS, STR_METHODS, INT_METHODS, FLOAT_METHODS,
    LIST_NON_HOF_METHODS, MAP_NON_HOF_METHODS, SET_NON_HOF_METHODS,
    OPTION_NON_HOF_METHODS}
use runtime::{RUNTIME_CODE}
use codegen_ctx::{CodegenCtx, HTraitDeclInfo, new_codegen_ctx,
    emit, emit_raw, push_indent, pop_indent, qualify, safe_ident,
    get_evidence_params}
use codegen_decl::{emit_decl, emit_toplevel_evidence}
use codegen_derive::{emit_derived_impl, get_derived_method_names}

// ============================================================
// Public API
// ============================================================

pub fn generate(program: HProgram, skip_preamble: Bool, skip_main_call: Bool,
                module_prefix: Str?, imports_map: Map<Str, Str>?,
                external_struct_fields: Map<Str, List<Str>>?,
                external_impl_methods: Map<Str, Str?>?,
                module_imports: List<Str>?, module_exports: List<Str>?) -> Str {
    var ctx = new_codegen_ctx(skip_preamble, skip_main_call)
    ctx.module_prefix = module_prefix
    ctx.imports_map = imports_map
    ctx.module_imports = module_imports
    ctx.module_exports = module_exports

    // Load external struct fields
    match external_struct_fields {
        some(esf) => {
            for entry in esf.entries() {
                let (k, v) = entry
                ctx.struct_field_order.insert(k, v)
            }
        },
        none => {},
    }

    // Load external impl methods
    match external_impl_methods {
        some(eim) => {
            for entry in eim.entries() {
                let (k, v) = entry
                ctx.impl_methods.insert(k, v)
            }
        },
        none => {},
    }

    // ESM mode: emit import statements
    let has_imports = match ctx.module_imports {
        some(imports) => imports.len() > 0,
        none => false,
    }
    if has_imports {
        match ctx.module_imports {
            some(imports) => {
                for imp in imports { emit_raw(ctx, imp) }
            },
            none => {},
        }
        let empty = ""
        emit_raw(ctx, empty)
    }

    // Collect local names
    for decl in program.decls {
        match decl {
            HDecl::Fn { name, .. } => { ctx.local_names.insert(name) },
            HDecl::Struct { name, .. } => { ctx.local_names.insert(name) },
            HDecl::Enum { name, variants, .. } => {
                ctx.local_names.insert(name)
                for v in variants {
                    ctx.local_names.insert(v.name)
                    ctx.local_names.insert("${name}_${v.name}")
                }
            },
            HDecl::Impl { target_type, .. } => { ctx.local_names.insert(target_type) },
            HDecl::Trait { name, .. } => { ctx.local_names.insert(name) },
            HDecl::Effect { name, .. } => { ctx.local_names.insert(name) },
            _ => {},
        }
    }

    // Collect struct field orders and impl methods
    for decl in program.decls {
        match decl {
            HDecl::Struct { name, fields, .. } => {
                let qname = qualify(ctx, name)
                var field_names: List<Str> = [""]; field_names.clear()
                for f in fields { field_names.push(f.name) }
                ctx.struct_field_order.insert(qname, field_names)
            },
            HDecl::Impl { target_type, trait_name, methods, .. } => {
                for method in methods {
                    match method {
                        HDecl::Fn { name, .. } => {
                            let key = "${qualify(ctx, target_type)}.${name}"
                            match trait_name {
                                none => {
                                    match ctx.impl_methods.get(key) {
                                        none => { ctx.impl_methods.insert(key, none) },
                                        some(_) => {},
                                    }
                                },
                                some(tn) => {
                                    match ctx.impl_methods.get(key) {
                                        none => { ctx.impl_methods.insert(key, some(tn)) },
                                        some(_) => {},
                                    }
                                },
                            }
                        },
                        _ => {},
                    }
                }
            },
            HDecl::Trait { name, methods, .. } => {
                ctx.trait_decls.insert(name, HTraitDeclInfo { name: name, methods: methods })
            },
            _ => {},
        }
    }

    // Register built-in impl methods
    register_builtin_methods(ctx, BUILTIN_CELL(), CELL_METHODS())
    register_builtin_methods(ctx, BUILTIN_STR(), STR_METHODS())
    register_builtin_methods(ctx, BUILTIN_LIST(), LIST_NON_HOF_METHODS())
    register_builtin_methods(ctx, BUILTIN_MAP(), MAP_NON_HOF_METHODS())
    register_builtin_methods(ctx, BUILTIN_SET(), SET_NON_HOF_METHODS())
    register_builtin_methods(ctx, BUILTIN_INT(), INT_METHODS())
    register_builtin_methods(ctx, BUILTIN_FLOAT(), FLOAT_METHODS())
    register_builtin_methods(ctx, BUILTIN_OPTION(), OPTION_NON_HOF_METHODS())

    // Register builtin trait methods for UFCS dispatch
    for prim in [BUILTIN_INT(), BUILTIN_FLOAT(), BUILTIN_STR(), BUILTIN_BOOL()] {
        let key = "${safe_ident(prim)}.debug"
        ctx.impl_methods.insert(key, some("Debug"))
    }
    for coll in [BUILTIN_LIST(), BUILTIN_MAP(), BUILTIN_SET(), BUILTIN_OPTION()] {
        let key = "${safe_ident(coll)}.debug"
        ctx.impl_methods.insert(key, some("Debug"))
    }

    // Emit runtime preamble
    if ctx.skip_preamble == false {
        emit_raw(ctx, RUNTIME_CODE())
        emit_raw(ctx, "")
    }

    // Register auto-derive impl methods BEFORE emitting declarations
    for impl_ in program.derived_impls {
        for method_name in get_derived_method_names(impl_.trait_name) {
            let key = "${qualify(ctx, impl_.type_name)}.${method_name}"
            match ctx.impl_methods.get(key) {
                none => { ctx.impl_methods.insert(key, some(impl_.trait_name)) },
                some(_) => {},
            }
        }
    }

    // Emit declarations
    for decl in program.decls {
        emit_decl(ctx, decl)
        emit_raw(ctx, "")
    }

    // Emit auto-derived trait implementations
    for impl_ in program.derived_impls {
        emit_derived_impl(ctx, impl_)
        emit_raw(ctx, "")
    }

    // Auto-call main() if present
    if ctx.skip_main_call == false {
        for decl in program.decls {
            match decl {
                HDecl::Fn { name, effects, .. } => {
                    if name == "main" {
                        let fn_name = qualify(ctx, "main")
                        let ev_params = get_evidence_params(effects)
                        if ev_params.len() > 0 {
                            emit_toplevel_evidence(ctx, effects)
                            let ev_str = ev_params.join(", ")
                            emit(ctx, "${fn_name}(${ev_str});")
                        } else {
                            emit(ctx, "${fn_name}();")
                        }
                    }
                },
                _ => {},
            }
        }
    }

    // ESM mode: emit export statement
    match ctx.module_exports {
        some(exports) => {
            if exports.len() > 0 {
                emit_raw(ctx, "")
                let joined = exports.join(", ")
                emit_raw(ctx, "export { ${joined} };")
            }
        },
        none => {},
    }

    ctx.lines.join("\n")
}

fn register_builtin_methods(var ctx: CodegenCtx, type_name: Str, methods: List<Str>) {
    let sn = safe_ident(type_name)
    for m in methods {
        let key = "${sn}.${m}"
        ctx.impl_methods.insert(key, none)
    }
}
