use hir::{DerivedImpl, DerivedField, DerivedVariant, FieldAction, TypeKind,
    trait_dict_name, trait_bound_param_name, ENUM_TAG_FIELD}
use codegen_ctx::{CodegenCtx, emit, emit_raw, push_indent, pop_indent,
    qualify, safe_ident}

pub fn get_derived_method_names(trait_name: Str) -> List<Str> {
    if trait_name == "Eq" { ["eq", "ne"] }
    else { if trait_name == "Clone" { ["clone"] }
    else { if trait_name == "Debug" { ["debug"] }
    else { if trait_name == "Ord" { ["cmp"] }
    else { let e: List<Str> = [""]; e.clear(); e } } } }
}

pub fn emit_derived_impl(var ctx: CodegenCtx, impl_: DerivedImpl) {
    if impl_.trait_name == "Eq" { emit_derived_eq(ctx, impl_) }
    if impl_.trait_name == "Clone" { emit_derived_clone(ctx, impl_) }
    if impl_.trait_name == "Ord" { emit_derived_ord(ctx, impl_) }
    if impl_.trait_name == "Debug" { emit_derived_debug(ctx, impl_) }
}

// ============================================================
// Eq
// ============================================================

fn emit_derived_eq(var ctx: CodegenCtx, impl_: DerivedImpl) {
    let name = qualify(ctx, impl_.type_name)
    let dict_base = trait_dict_name(name, "Eq")
    let fn_name = "${dict_base}_eq"
    var dict_params: List<Str> = [""]; dict_params.clear()
    for b in impl_.bounds {
        if b.trait_name == "Eq" {
            dict_params.push(trait_bound_param_name(b.type_param, b.trait_name))
        }
    }
    var all_params_list = ["self", "other"]
    all_params_list.extend(dict_params)
    let all_params = all_params_list.join(", ")

    emit(ctx, "function ${fn_name}(${all_params}) {")
    push_indent(ctx)

    match impl_.type_kind {
        TypeKind::StructKind => match impl_.struct_fields {
            some(fields) => {
                if fields.len() == 0 {
                    emit(ctx, "return true;")
                } else {
                    var comps: List<Str> = [""]; comps.clear()
                    for f in fields {
                        let left = "self.${safe_ident(f.name)}"
                        let right = "other.${safe_ident(f.name)}"
                        comps.push(gen_field_eq(left, right, f))
                    }
                    let joined = comps.join(" && ")
                    emit(ctx, "return ${joined};")
                }
            },
            none => {},
        },
        TypeKind::EnumKind => match impl_.enum_variants {
            some(variants) => {
                emit(ctx, "if (self.${ENUM_TAG_FIELD()} !== other.${ENUM_TAG_FIELD()}) return false;")
                var has_fields = false
                for v in variants {
                    if v.fields.len() > 0 { has_fields = true }
                }
                if has_fields {
                    emit(ctx, "switch (self.${ENUM_TAG_FIELD()}) {")
                    push_indent(ctx)
                    for v in variants {
                        if v.fields.len() == 0 {
                            emit(ctx, "case \"${v.name}\": return true;")
                        } else {
                            var feqs: List<Str> = [""]; feqs.clear()
                            for f in v.fields {
                                let accessor = if v.has_named_fields { safe_ident(f.name) } else { match f.positional_index { some(pi) => "_${pi}", none => f.name } }
                                feqs.push(gen_field_eq("self.${accessor}", "other.${accessor}", f))
                            }
                            let joined = feqs.join(" && ")
                            emit(ctx, "case \"${v.name}\": return ${joined};")
                        }
                    }
                    emit(ctx, "default: return true;")
                    pop_indent(ctx)
                    emit(ctx, "}")
                } else {
                    emit(ctx, "return true;")
                }
            },
            none => {},
        },
    }

    pop_indent(ctx)
    emit(ctx, "}")

    let dict_name = trait_dict_name(name, "Eq")
    let params_str = all_params_list.join(", ")
    emit(ctx, "const ${dict_name} = { eq: ${fn_name}, ne: function(${all_params}) { return !${fn_name}(${params_str}); } };")
}

fn gen_field_eq(left: Str, right: Str, field: DerivedField) -> Str {
    match field.action {
        FieldAction::Identity => "(${left} === ${right})",
        FieldAction::Call { dict_name, extra_dicts } => {
            let extra = extra_dicts_str(extra_dicts)
            "${dict_name}.eq(${left}, ${right}${extra})"
        },
    }
}

// ============================================================
// Clone
// ============================================================

fn emit_derived_clone(var ctx: CodegenCtx, impl_: DerivedImpl) {
    let name = qualify(ctx, impl_.type_name)
    let dict_base = trait_dict_name(name, "Clone")
    let fn_name = "${dict_base}_clone"
    var dict_params: List<Str> = [""]; dict_params.clear()
    for b in impl_.bounds {
        if b.trait_name == "Clone" {
            dict_params.push(trait_bound_param_name(b.type_param, b.trait_name))
        }
    }
    var all_list = ["self"]
    all_list.extend(dict_params)
    let all_params = all_list.join(", ")

    emit(ctx, "function ${fn_name}(${all_params}) {")
    push_indent(ctx)

    match impl_.type_kind {
        TypeKind::StructKind => match impl_.struct_fields {
            some(fields) => {
                var args: List<Str> = [""]; args.clear()
                for f in fields {
                    args.push(gen_field_clone("self.${safe_ident(f.name)}", f))
                }
                let joined = args.join(", ")
                emit(ctx, "return new ${name}(${joined});")
            },
            none => {},
        },
        TypeKind::EnumKind => match impl_.enum_variants {
            some(variants) => {
                emit(ctx, "switch (self.${ENUM_TAG_FIELD()}) {")
                push_indent(ctx)
                for v in variants {
                    if v.fields.len() == 0 {
                        emit(ctx, "case \"${v.name}\": return ${name}_${v.name};")
                    } else {
                        var args: List<Str> = [""]; args.clear()
                        for f in v.fields {
                            let accessor = if v.has_named_fields { safe_ident(f.name) } else { match f.positional_index { some(pi) => "_${pi}", none => f.name } }
                            args.push(gen_field_clone("self.${accessor}", f))
                        }
                        let joined = args.join(", ")
                        emit(ctx, "case \"${v.name}\": return ${name}_${v.name}(${joined});")
                    }
                }
                emit(ctx, "default: return self;")
                pop_indent(ctx)
                emit(ctx, "}")
            },
            none => {},
        },
    }

    pop_indent(ctx)
    emit(ctx, "}")

    let dict_name = trait_dict_name(name, "Clone")
    emit(ctx, "const ${dict_name} = { clone: ${fn_name} };")
}

fn gen_field_clone(expr: Str, field: DerivedField) -> Str {
    match field.action {
        FieldAction::Identity => expr,
        FieldAction::Call { dict_name, extra_dicts } => {
            let extra = extra_dicts_str(extra_dicts)
            "${dict_name}.clone(${expr}${extra})"
        },
    }
}

// ============================================================
// Ord
// ============================================================

fn emit_derived_ord(var ctx: CodegenCtx, impl_: DerivedImpl) {
    let name = qualify(ctx, impl_.type_name)
    let dict_base = trait_dict_name(name, "Ord")
    let fn_name = "${dict_base}_cmp"
    var dict_params: List<Str> = [""]; dict_params.clear()
    for b in impl_.bounds {
        if b.trait_name == "Ord" {
            dict_params.push(trait_bound_param_name(b.type_param, b.trait_name))
        }
    }
    var all_list = ["self", "other"]
    all_list.extend(dict_params)
    let all_params = all_list.join(", ")

    match impl_.type_kind {
        TypeKind::EnumKind => match impl_.enum_variants {
            some(variants) => {
                var tag_entries: List<Str> = [""]; tag_entries.clear()
                for i in 0..variants.len() {
                    match variants.get(i) {
                        some(v) => tag_entries.push("\"${v.name}\": ${i}"),
                        none => {},
                    }
                }
                let joined = tag_entries.join(", ")
                emit(ctx, "const __${name}_tag_order = { ${joined} };")
            },
            none => {},
        },
        _ => {},
    }

    emit(ctx, "function ${fn_name}(${all_params}) {")
    push_indent(ctx)

    match impl_.type_kind {
        TypeKind::StructKind => match impl_.struct_fields {
            some(fields) => {
                if fields.len() == 0 {
                    emit(ctx, "return 0;")
                } else {
                    emit(ctx, "var c;")
                    for i in 0..fields.len() {
                        match fields.get(i) {
                            some(f) => {
                                let left = "self.${safe_ident(f.name)}"
                                let right = "other.${safe_ident(f.name)}"
                                let cmp = gen_field_cmp(left, right, f)
                                if i < fields.len() - 1 {
                                    emit(ctx, "c = ${cmp};")
                                    emit(ctx, "if (c !== 0) return c;")
                                } else {
                                    emit(ctx, "return ${cmp};")
                                }
                            },
                            none => {},
                        }
                    }
                }
            },
            none => {},
        },
        TypeKind::EnumKind => match impl_.enum_variants {
            some(variants) => {
                emit(ctx, "var t1 = __${name}_tag_order[self.${ENUM_TAG_FIELD()}];")
                emit(ctx, "var t2 = __${name}_tag_order[other.${ENUM_TAG_FIELD()}];")
                emit(ctx, "if (t1 !== t2) return (t1 < t2 ? -1 : 1);")
                var has_fields = false
                for v in variants { if v.fields.len() > 0 { has_fields = true } }
                if has_fields {
                    emit(ctx, "switch (self.${ENUM_TAG_FIELD()}) {")
                    push_indent(ctx)
                    for v in variants {
                        if v.fields.len() == 0 { } else {
                            if v.fields.len() == 1 {
                                match v.fields.get(0) {
                                    some(f) => {
                                        let accessor = if v.has_named_fields { safe_ident(f.name) } else { match f.positional_index { some(pi) => "_${pi}", none => f.name } }
                                        let cmp = gen_field_cmp("self.${accessor}", "other.${accessor}", f)
                                        emit(ctx, "case \"${v.name}\": return ${cmp};")
                                    },
                                    none => {},
                                }
                            } else {
                                emit(ctx, "case \"${v.name}\": {")
                                push_indent(ctx)
                                emit(ctx, "var c;")
                                for i in 0..v.fields.len() {
                                    match v.fields.get(i) {
                                        some(f) => {
                                            let accessor = if v.has_named_fields { safe_ident(f.name) } else { match f.positional_index { some(pi) => "_${pi}", none => f.name } }
                                            let cmp = gen_field_cmp("self.${accessor}", "other.${accessor}", f)
                                            if i < v.fields.len() - 1 {
                                                emit(ctx, "c = ${cmp};")
                                                emit(ctx, "if (c !== 0) return c;")
                                            } else {
                                                emit(ctx, "return ${cmp};")
                                            }
                                        },
                                        none => {},
                                    }
                                }
                                pop_indent(ctx)
                                emit(ctx, "}")
                            }
                        }
                    }
                    emit(ctx, "default: return 0;")
                    pop_indent(ctx)
                    emit(ctx, "}")
                } else {
                    emit(ctx, "return 0;")
                }
            },
            none => {},
        },
    }

    pop_indent(ctx)
    emit(ctx, "}")

    let dict_name = trait_dict_name(name, "Ord")
    emit(ctx, "const ${dict_name} = { cmp: ${fn_name} };")
}

fn gen_field_cmp(left: Str, right: Str, field: DerivedField) -> Str {
    match field.action {
        FieldAction::Identity => "(${left} < ${right} ? -1 : ${left} > ${right} ? 1 : 0)",
        FieldAction::Call { dict_name, extra_dicts } => {
            let extra = extra_dicts_str(extra_dicts)
            "${dict_name}.cmp(${left}, ${right}${extra})"
        },
    }
}

// ============================================================
// Debug
// ============================================================

fn emit_derived_debug(var ctx: CodegenCtx, impl_: DerivedImpl) {
    let name = qualify(ctx, impl_.type_name)
    let dict_base = trait_dict_name(name, "Debug")
    let fn_name = "${dict_base}_debug"
    var dict_params: List<Str> = [""]; dict_params.clear()
    for b in impl_.bounds {
        if b.trait_name == "Debug" {
            dict_params.push(trait_bound_param_name(b.type_param, b.trait_name))
        }
    }
    var all_list = ["self"]
    all_list.extend(dict_params)
    let all_params = all_list.join(", ")

    emit(ctx, "function ${fn_name}(${all_params}) {")
    push_indent(ctx)

    match impl_.type_kind {
        TypeKind::StructKind => match impl_.struct_fields {
            some(fields) => {
                if fields.len() == 0 {
                    emit(ctx, "return \"${impl_.type_name}\";")
                } else {
                    var parts: List<Str> = [""]; parts.clear()
                    for f in fields {
                        let val = gen_field_debug("self.${safe_ident(f.name)}", f)
                        parts.push("\"${f.name}: \" + ${val}")
                    }
                    let joined = parts.join(" + \", \" + ")
                    emit(ctx, "return \"${impl_.type_name} { \" + ${joined} + \" }\";")
                }
            },
            none => {},
        },
        TypeKind::EnumKind => match impl_.enum_variants {
            some(variants) => {
                emit(ctx, "switch (self.${ENUM_TAG_FIELD()}) {")
                push_indent(ctx)
                for v in variants {
                    if v.fields.len() == 0 {
                        emit(ctx, "case \"${v.name}\": return \"${v.name}\";")
                    } else {
                        if v.has_named_fields {
                            var parts: List<Str> = [""]; parts.clear()
                            for f in v.fields {
                                let val = gen_field_debug("self.${safe_ident(f.name)}", f)
                                parts.push("\"${f.name}: \" + ${val}")
                            }
                            let joined = parts.join(" + \", \" + ")
                            emit(ctx, "case \"${v.name}\": return \"${v.name} { \" + ${joined} + \" }\";")
                        } else {
                            var parts: List<Str> = [""]; parts.clear()
                            for f in v.fields {
                                let accessor = match f.positional_index { some(pi) => "_${pi}", none => f.name }
                                parts.push(gen_field_debug("self.${accessor}", f))
                            }
                            let joined = parts.join(" + \", \" + ")
                            emit(ctx, "case \"${v.name}\": return \"${v.name}(\" + ${joined} + \")\";")
                        }
                    }
                }
                emit(ctx, "default: return self.${ENUM_TAG_FIELD()};")
                pop_indent(ctx)
                emit(ctx, "}")
            },
            none => {},
        },
    }

    pop_indent(ctx)
    emit(ctx, "}")

    let dict_name = trait_dict_name(name, "Debug")
    emit(ctx, "const ${dict_name} = { debug: ${fn_name} };")
}

fn gen_field_debug(expr: Str, field: DerivedField) -> Str {
    match field.action {
        FieldAction::Identity => "String(${expr})",
        FieldAction::Call { dict_name, extra_dicts } => {
            let extra = extra_dicts_str(extra_dicts)
            "${dict_name}.debug(${expr}${extra})"
        },
    }
}

fn extra_dicts_str(dicts: List<Str>) -> Str {
    if dicts.len() > 0 {
        let joined = dicts.join(", ")
        ", ${joined}"
    } else {
        ""
    }
}
