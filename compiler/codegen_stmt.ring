use ast::{Pattern, NamedPatternField, LiteralValue}
use hir::{HExpr, HStmt, HMatchArm, HLetDestructureBinding,
    ENUM_TAG_FIELD, RUNTIME_MATCH_FAIL}
use codegen_ctx::{CodegenCtx, emit, push_indent, pop_indent, safe_ident}

// Forward declarations — these will be provided by codegen_expr
// In Ring, we pass gen_expr as a function parameter or use a separate module import
// For now we declare the cross-module functions

extern fn gen_expr(var ctx: CodegenCtx, expr: HExpr) -> Str

// ============================================================
// Statement-mode expression emission
// ============================================================

pub fn emit_in_stmt_context(var ctx: CodegenCtx, expr: HExpr, mode: Str) {
    match expr {
        HExpr::IfExpr { condition, then_branch, else_branch, .. } =>
            emit_if_stmt(ctx, condition, then_branch, else_branch, mode),
        HExpr::Block { stmts, tail, .. } =>
            emit_block_in_stmt_context_inner(ctx, stmts, tail, mode),
        HExpr::MatchExpr { scrutinee, arms, .. } =>
            emit_match_stmt(ctx, scrutinee, arms, mode),
        _ => {
            let e = gen_expr(ctx, expr)
            if mode == "return" {
                emit(ctx, "return ${e};")
            } else {
                emit(ctx, "${e};")
            }
        },
    }
}

// ============================================================
// If statement (statement-mode)
// ============================================================

fn emit_if_stmt(var ctx: CodegenCtx, condition: HExpr, then_branch: HExpr, else_branch: HExpr?, mode: Str) {
    let cond = gen_expr(ctx, condition)
    emit(ctx, "if (${cond}) {")
    push_indent(ctx)
    emit_block_in_stmt_context(ctx, then_branch, mode)
    pop_indent(ctx)
    match else_branch {
        none => emit(ctx, "}"),
        some(eb) => match eb {
            HExpr::IfExpr { condition: ec, then_branch: et, else_branch: ee, .. } => {
                emit_else_if(ctx, ec, et, ee, mode)
            },
            _ => {
                emit(ctx, "} else {")
                push_indent(ctx)
                emit_block_in_stmt_context(ctx, eb, mode)
                pop_indent(ctx)
                emit(ctx, "}")
            },
        },
    }
}

fn emit_else_if(var ctx: CodegenCtx, condition: HExpr, then_branch: HExpr, else_branch: HExpr?, mode: Str) {
    let cond = gen_expr(ctx, condition)
    emit(ctx, "} else if (${cond}) {")
    push_indent(ctx)
    emit_block_in_stmt_context(ctx, then_branch, mode)
    pop_indent(ctx)
    match else_branch {
        none => emit(ctx, "}"),
        some(eb) => match eb {
            HExpr::IfExpr { condition: ec, then_branch: et, else_branch: ee, .. } => {
                emit_else_if(ctx, ec, et, ee, mode)
            },
            _ => {
                emit(ctx, "} else {")
                push_indent(ctx)
                emit_block_in_stmt_context(ctx, eb, mode)
                pop_indent(ctx)
                emit(ctx, "}")
            },
        },
    }
}

// ============================================================
// Block in statement context
// ============================================================

pub fn emit_block_in_stmt_context(var ctx: CodegenCtx, block: HExpr, mode: Str) {
    match block {
        HExpr::Block { stmts, tail, .. } =>
            emit_block_in_stmt_context_inner(ctx, stmts, tail, mode),
        _ => emit_in_stmt_context(ctx, block, mode),
    }
}

fn emit_block_in_stmt_context_inner(var ctx: CodegenCtx, stmts: List<HStmt>, tail: HExpr?, mode: Str) {
    for stmt in stmts {
        emit_stmt(ctx, stmt)
    }
    match tail {
        some(t) => emit_in_stmt_context(ctx, t, mode),
        none => {},
    }
}

// ============================================================
// Block body (shared between functions and IIFE blocks)
// ============================================================

pub fn emit_block_body(var ctx: CodegenCtx, block: HExpr) {
    match block {
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                emit_stmt(ctx, stmt)
            }
            match tail {
                some(t) => emit_in_stmt_context(ctx, t, "return"),
                none => {},
            }
        },
        _ => emit_in_stmt_context(ctx, block, "return"),
    }
}

// ============================================================
// Match statement (statement-mode)
// ============================================================

fn emit_match_stmt(var ctx: CodegenCtx, scrutinee: HExpr, arms: List<HMatchArm>, mode: Str) {
    let label = "__ring_match${ctx.match_counter}"
    ctx.match_counter = ctx.match_counter + 1
    let scrut_js = gen_expr(ctx, scrutinee)
    emit(ctx, "${label}: {")
    push_indent(ctx)
    let scrut_var = "__ring_m${ctx.match_counter - 1}"
    emit(ctx, "const ${scrut_var} = ${scrut_js};")

    for arm in arms {
        let cond = gen_pattern_condition(scrut_var, arm.pattern)
        let bindings_str = gen_pattern_bindings(scrut_var, arm.pattern)
        match arm.guard {
            none => {
                if cond == "true" {
                    if bindings_str.len() > 0 { emit(ctx, bindings_str.trim()) }
                    emit_in_stmt_context(ctx, arm.body, mode)
                    emit(ctx, "break ${label};")
                } else {
                    emit(ctx, "if (${cond}) {")
                    push_indent(ctx)
                    if bindings_str.len() > 0 { emit(ctx, bindings_str.trim()) }
                    emit_in_stmt_context(ctx, arm.body, mode)
                    emit(ctx, "break ${label};")
                    pop_indent(ctx)
                    emit(ctx, "}")
                }
            },
            some(guard) => {
                emit(ctx, "if (${cond}) {")
                push_indent(ctx)
                if bindings_str.len() > 0 { emit(ctx, bindings_str.trim()) }
                let guard_js = gen_expr(ctx, guard)
                emit(ctx, "if (${guard_js}) {")
                push_indent(ctx)
                emit_in_stmt_context(ctx, arm.body, mode)
                emit(ctx, "break ${label};")
                pop_indent(ctx)
                emit(ctx, "}")
                pop_indent(ctx)
                emit(ctx, "}")
            },
        }
    }

    var has_catchall = false
    for a in arms {
        match a.pattern {
            Pattern::Wildcard { .. } => match a.guard { none => { has_catchall = true }, some(_) => {} },
            Pattern::Binding { .. } => match a.guard { none => { has_catchall = true }, some(_) => {} },
            _ => {},
        }
    }
    if has_catchall == false {
        emit(ctx, "${RUNTIME_MATCH_FAIL}(${scrut_var});")
    }
    pop_indent(ctx)
    emit(ctx, "}")
}

// ============================================================
// Statements
// ============================================================

pub fn emit_stmt(var ctx: CodegenCtx, stmt: HStmt) {
    match stmt {
        HStmt::ExprStmt { expr, .. } => emit_in_stmt_context(ctx, expr, "discard"),
        HStmt::Return { value, .. } => match value {
            some(v) => emit_in_stmt_context(ctx, v, "return"),
            none => emit(ctx, "return;"),
        },
        HStmt::While { condition, body, .. } => {
            let cond = gen_expr(ctx, condition)
            emit(ctx, "while (${cond}) {")
            push_indent(ctx)
            emit_block_in_stmt_context(ctx, body, "discard")
            pop_indent(ctx)
            emit(ctx, "}")
        },
        HStmt::ForIn { binding, destructure, iterable, body, .. } => {
            match iterable {
                HExpr::RangeExpr { start, end, inclusive, .. } => {
                    let start_js = gen_expr(ctx, start)
                    let end_js = gen_expr(ctx, end)
                    let b = safe_ident(binding)
                    let end_var = "__ring_end${ctx.loop_counter}"
                    ctx.loop_counter = ctx.loop_counter + 1
                    emit(ctx, "const ${end_var} = ${end_js};")
                    let cmp = if inclusive { "<=" } else { "<" }
                    emit(ctx, "for (let ${b} = ${start_js}; ${b} ${cmp} ${end_var}; ${b}++) {")
                },
                _ => match destructure {
                    some(ds) => {
                        if ds.len() > 0 {
                            let iter = gen_expr(ctx, iterable)
                            var names: List<Str> = [""]; names.clear()
                            for d in ds { names.push(safe_ident(d.name)) }
                            let joined = names.join(", ")
                            emit(ctx, "for (const [${joined}] of ${iter}) {")
                        } else {
                            let iter = gen_expr(ctx, iterable)
                            let b = safe_ident(binding)
                            emit(ctx, "for (const ${b} of ${iter}) {")
                        }
                    },
                    none => {
                        let iter = gen_expr(ctx, iterable)
                        let b = safe_ident(binding)
                        emit(ctx, "for (const ${b} of ${iter}) {")
                    },
                },
            }
            push_indent(ctx)
            emit_block_in_stmt_context(ctx, body, "discard")
            pop_indent(ctx)
            emit(ctx, "}")
        },
        HStmt::Break { .. } => emit(ctx, "break;"),
        HStmt::Continue { .. } => emit(ctx, "continue;"),
        HStmt::LetDestructure { bindings, init, .. } => {
            let init_js = gen_expr(ctx, init)
            let tmp = "__ring_dt${ctx.dt_counter}"
            ctx.dt_counter = ctx.dt_counter + 1
            emit(ctx, "const ${tmp} = ${init_js};")
            for i in 0..bindings.len() {
                match bindings.get(i) {
                    some(b) => {
                        if b.name != "_" {
                            let sname = safe_ident(b.name)
                            emit(ctx, "const ${sname} = ${tmp}[${i}];")
                        }
                    },
                    none => {},
                }
            }
        },
        HStmt::IfLet { pattern, expr, then_block, else_block, .. } => {
            emit(ctx, "{")
            push_indent(ctx)
            let scrutinee = gen_expr(ctx, expr)
            emit(ctx, "const __ring_t = ${scrutinee};")
            let cond = gen_pattern_condition("__ring_t", pattern)
            emit(ctx, "if (${cond}) {")
            push_indent(ctx)
            let bindings = gen_pattern_bindings("__ring_t", pattern)
            if bindings.trim().len() > 0 { emit(ctx, bindings.trim()) }
            emit_block_in_stmt_context(ctx, then_block, "discard")
            pop_indent(ctx)
            match else_block {
                some(eb) => {
                    emit(ctx, "} else {")
                    push_indent(ctx)
                    emit_block_in_stmt_context(ctx, eb, "discard")
                    pop_indent(ctx)
                    emit(ctx, "}")
                },
                none => emit(ctx, "}"),
            }
            pop_indent(ctx)
            emit(ctx, "}")
        },
        HStmt::Let { name, init, .. } => {
            let sname = safe_ident(name)
            let init_js = gen_expr(ctx, init)
            emit(ctx, "const ${sname} = ${init_js};")
        },
        HStmt::Var { name, init, .. } => {
            let sname = safe_ident(name)
            let init_js = gen_expr(ctx, init)
            emit(ctx, "let ${sname} = ${init_js};")
        },
        HStmt::Assign { target, value, .. } => {
            let t = gen_expr(ctx, target)
            let v = gen_expr(ctx, value)
            emit(ctx, "${t} = ${v};")
        },
    }
}

// ============================================================
// Inline statement generation (for IIFE bodies)
// ============================================================

pub fn gen_stmt_inline(var ctx: CodegenCtx, stmt: HStmt) -> Str {
    match stmt {
        HStmt::Let { name, init, .. } => {
            let sname = safe_ident(name)
            let init_js = gen_expr(ctx, init)
            "const ${sname} = ${init_js};"
        },
        HStmt::Var { name, init, .. } => {
            let sname = safe_ident(name)
            let init_js = gen_expr(ctx, init)
            "let ${sname} = ${init_js};"
        },
        HStmt::Assign { target, value, .. } => {
            let t = gen_expr(ctx, target)
            let v = gen_expr(ctx, value)
            "${t} = ${v};"
        },
        HStmt::ExprStmt { expr, .. } => {
            let e = gen_expr(ctx, expr)
            "${e};"
        },
        HStmt::Return { value, .. } => match value {
            some(v) => {
                let e = gen_expr(ctx, v)
                "return ${e};"
            },
            none => "return;",
        },
        _ => "/* codegen: unhandled inline stmt */ undefined;",
    }
}

// ============================================================
// Pattern condition generation
// ============================================================

pub fn gen_pattern_condition(target: Str, pat: Pattern) -> Str {
    match pat {
        Pattern::Wildcard { .. } => "true",
        Pattern::Binding { .. } => "true",
        Pattern::Literal { value, .. } => {
            let val_str = match value {
                LiteralValue::IntVal(n) => n.to_str(),
                LiteralValue::FloatVal(f) => f.to_str(),
                LiteralValue::StrVal(s) => json_stringify(s),
                LiteralValue::BoolVal(b) => if b { "true" } else { "false" },
            }
            "${target} === ${val_str}"
        },
        Pattern::Constructor { name, fields, .. } => {
            let tag_check = "${target}.${ENUM_TAG_FIELD} === \"${name}\""
            var sub_conds: List<Str> = [""]; sub_conds.clear()
            for i in 0..fields.len() {
                match fields.get(i) {
                    some(f) => {
                        let sub = gen_pattern_condition("${target}._${i}", f)
                        if sub != "true" { sub_conds.push(sub) }
                    },
                    none => {},
                }
            }
            if sub_conds.len() == 0 { tag_check }
            else {
                let joined = sub_conds.join(" && ")
                "${tag_check} && ${joined}"
            }
        },
        Pattern::NamedConstructor { name, fields, .. } => {
            let tag_check = "${target}.${ENUM_TAG_FIELD} === \"${name}\""
            var sub_conds: List<Str> = [""]; sub_conds.clear()
            for f in fields {
                let sname = safe_ident(f.name)
                let sub = gen_pattern_condition("${target}.${sname}", f.pattern)
                if sub != "true" { sub_conds.push(sub) }
            }
            if sub_conds.len() == 0 { tag_check }
            else {
                let joined = sub_conds.join(" && ")
                "${tag_check} && ${joined}"
            }
        },
        Pattern::TuplePattern { elements, .. } => {
            let len_check = "Array.isArray(${target}) && ${target}.length === ${elements.len()}"
            var sub_conds: List<Str> = [""]; sub_conds.clear()
            for i in 0..elements.len() {
                match elements.get(i) {
                    some(e) => {
                        let sub = gen_pattern_condition("${target}[${i}]", e)
                        if sub != "true" { sub_conds.push(sub) }
                    },
                    none => {},
                }
            }
            if sub_conds.len() == 0 { len_check }
            else {
                let joined = sub_conds.join(" && ")
                "${len_check} && ${joined}"
            }
        },
    }
}

// ============================================================
// Pattern bindings generation
// ============================================================

pub fn gen_pattern_bindings(target: Str, pat: Pattern) -> Str {
    match pat {
        Pattern::Wildcard { .. } => "",
        Pattern::Literal { .. } => "",
        Pattern::Binding { name, .. } => {
            let sname = safe_ident(name)
            "const ${sname} = ${target}; "
        },
        Pattern::Constructor { fields, .. } => {
            var result = ""
            for i in 0..fields.len() {
                match fields.get(i) {
                    some(f) => {
                        let sub = gen_pattern_bindings("${target}._${i}", f)
                        result = "${result}${sub}"
                    },
                    none => {},
                }
            }
            result
        },
        Pattern::NamedConstructor { fields, .. } => {
            var result = ""
            for f in fields {
                let sname = safe_ident(f.name)
                let sub = gen_pattern_bindings("${target}.${sname}", f.pattern)
                result = "${result}${sub}"
            }
            result
        },
        Pattern::TuplePattern { elements, .. } => {
            var result = ""
            for i in 0..elements.len() {
                match elements.get(i) {
                    some(e) => {
                        let sub = gen_pattern_bindings("${target}[${i}]", e)
                        result = "${result}${sub}"
                    },
                    none => {},
                }
            }
            result
        },
    }
}
