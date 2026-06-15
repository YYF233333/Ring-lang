// scc.ring — Call graph construction + Tarjan SCC for B-122 checker pass ordering
//
// build_call_graph: traverses AST bodies of all Decl::Fn and Decl::Impl methods,
// collecting edges to registered top-level fn names.
//
// tarjan_scc: standard Tarjan algorithm, returns SCCs in reverse topological order
// (dependencies before dependents — leaf callees first, top-level callers last).

use ast::{Decl, Expr, Stmt, MatchArm, EffectHandler, StringInterpPart, StructFieldInit}

// ============================================================
// Collect registered fn names from decls (mirrors Pass 1 registration)
// ============================================================

// Collect all fn/method names that Pass 1 would have registered.
// Used to build the registered_fns filter set for call graph construction.
pub fn collect_registered_fn_names(decls: List<Decl>) -> Set<Str> {
    let mut names: Set<Str> = set_new()
    collect_fn_names_from_decls(decls, names, none)
    names
}

fn collect_fn_names_from_decls(decls: List<Decl>, mut names: Set<Str>, mod_prefix: Str?) {
    for decl in decls {
        match decl {
            Decl::Fn { name, .. } => {
                let full_name = match mod_prefix { some(p) => "${p}::${name}", none => name }
                names.insert(full_name)
            },
            Decl::Impl { methods, .. } => {
                for method in methods {
                    match method {
                        Decl::Fn { name: mname, .. } => {
                            let full_name = match mod_prefix { some(p) => "${p}::${mname}", none => mname }
                            names.insert(full_name)
                        },
                        _ => {}
                    }
                }
            },
            Decl::ModBlock { name: mod_name, decls: mod_decls, .. } => {
                let prefix = match mod_prefix { some(p) => "${p}::${mod_name}", none => mod_name }
                collect_fn_names_from_decls(mod_decls, names, some(prefix))
            },
            _ => {}
        }
    }
}

// ============================================================
// Call graph construction
// ============================================================

// Build a call graph over top-level function names.
// Nodes: every fn name in registered_fns.
// Edges: caller -> callee, where callee is an Ident in a Call expr that appears in registered_fns.
//
// For impl blocks, all methods share a single node "impl::TypeName" (or "impl::TypeName::TraitName").
// Self.method() calls within the same impl produce no external edge.
pub fn build_call_graph(decls: List<Decl>, registered_fns: Set<Str>) -> Map<Str, List<Str>> {
    let mut graph: Map<Str, List<Str>> = map_new()

    // Ensure every registered fn has an entry (even if no outgoing edges).
    // Sort to ensure deterministic graph construction order across backends.
    let mut sorted_names: List<Str> = []
    for name in registered_fns { sorted_names.push(name) }
    sorted_names.sort()
    for name in sorted_names {
        if !graph.contains_key(name) {
            graph.insert(name, [])
        }
    }

    for decl in decls {
        collect_decl_edges(decl, registered_fns, graph, none)
    }
    graph
}

// Collect edges from a declaration.
// impl_node: if set, we are inside an impl block and edges go from this node.
fn collect_decl_edges(decl: Decl, registered_fns: Set<Str>, mut graph: Map<Str, List<Str>>, impl_node: Str?) {
    match decl {
        Decl::Fn { name, body, .. } => {
            let caller = match impl_node { some(inode) => inode, none => name }
            if !graph.contains_key(caller) {
                graph.insert(caller, [])
            }
            let mut edges: Set<Str> = set_new()
            collect_expr_callees(body, registered_fns, edges)
            let mut sorted_edges: List<Str> = []
            for e in edges {
                if e != caller { sorted_edges.push(e) }
            }
            sorted_edges.sort()
            match graph.get(caller) {
                some(existing) => {
                    for e in sorted_edges { existing.push(e) }
                },
                none => {
                    graph.insert(caller, sorted_edges)
                }
            }
        },
        Decl::Impl { target_type, trait_name, methods, .. } => {
            let inode = match trait_name {
                some(tn) => "impl::${target_type}::${tn}",
                none => "impl::${target_type}"
            }
            if !graph.contains_key(inode) {
                graph.insert(inode, [])
            }
            for method in methods {
                collect_decl_edges(method, registered_fns, graph, some(inode))
            }
        },
        Decl::ModBlock { name, decls, .. } => {
            for d in decls {
                // ModBlock fns are prefixed with "mod_name::" by prefix_decl_name,
                // but at call-graph time we see the raw AST before prefixing.
                // The registered_fns set has the prefixed names.
                // We need to prefix here to match.
                let prefixed = prefix_mod_decl(name, d)
                collect_decl_edges(prefixed, registered_fns, graph, impl_node)
            }
        },
        // Test, Struct, Enum, Effect, Trait, ExternFn, ExternType, TypeAlias, Const, Sig,
        // EffectAlias, Delegate, AssocType — no fn bodies to scan
        _ => {}
    }
}

// Prefix a declaration name for ModBlock scoping (mirrors prefix_decl_name logic).
fn prefix_mod_decl(mod_name: Str, decl: Decl) -> Decl {
    match decl {
        Decl::Fn { name, type_params, params, return_type, declared_effects, body, is_pub, is_abstract, span } =>
            Decl::Fn { name: "${mod_name}::${name}", type_params: type_params, params: params,
                return_type: return_type, declared_effects: declared_effects, body: body,
                is_pub: is_pub, is_abstract: is_abstract, span: span },
        Decl::Impl { target_type, type_params, trait_name, methods, span } => {
            let mut prefixed_methods: List<Decl> = []
            for m in methods {
                prefixed_methods.push(prefix_mod_decl(mod_name, m))
            }
            Decl::Impl { target_type: target_type, type_params: type_params, trait_name: trait_name,
                methods: prefixed_methods, span: span }
        },
        _ => decl
    }
}

// ============================================================
// AST expression traversal — collect callee names
// ============================================================

fn collect_expr_callees(expr: Expr, registered_fns: Set<Str>, mut callees: Set<Str>) {
    match expr {
        Expr::Call { callee, args, .. } => {
            // Check if callee is a direct Ident referencing a registered fn
            match callee {
                Expr::Ident { name, .. } => {
                    if registered_fns.contains(name) {
                        callees.insert(name)
                    }
                },
                _ => {}
            }
            // Recurse into callee expr and args
            collect_expr_callees(callee, registered_fns, callees)
            for arg in args {
                collect_expr_callees(arg, registered_fns, callees)
            }
        },
        Expr::MethodCall { receiver, args, .. } => {
            // x.method() where x is not self — don't connect edge (can't resolve callee pre-inference)
            // self.method() — same impl block, no external edge needed
            // In both cases, just recurse into receiver and args
            collect_expr_callees(receiver, registered_fns, callees)
            for arg in args {
                collect_expr_callees(arg, registered_fns, callees)
            }
        },
        Expr::Ident { .. } => {
            // Bare ident (not in Call position) — not a call, skip
        },
        Expr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                collect_stmt_callees(stmt, registered_fns, callees)
            }
            match tail {
                some(t) => collect_expr_callees(t, registered_fns, callees),
                none => {}
            }
        },
        Expr::IfExpr { condition, then_branch, else_branch, .. } => {
            collect_expr_callees(condition, registered_fns, callees)
            collect_expr_callees(then_branch, registered_fns, callees)
            match else_branch {
                some(eb) => collect_expr_callees(eb, registered_fns, callees),
                none => {}
            }
        },
        Expr::MatchExpr { scrutinee, arms, .. } => {
            collect_expr_callees(scrutinee, registered_fns, callees)
            for arm in arms {
                match arm.guard {
                    some(g) => collect_expr_callees(g, registered_fns, callees),
                    none => {}
                }
                collect_expr_callees(arm.body, registered_fns, callees)
            }
        },
        Expr::Lambda { body, .. } => {
            collect_expr_callees(body, registered_fns, callees)
        },
        Expr::BinOp { left, right, .. } => {
            collect_expr_callees(left, registered_fns, callees)
            collect_expr_callees(right, registered_fns, callees)
        },
        Expr::UnaryOp { operand, .. } => {
            collect_expr_callees(operand, registered_fns, callees)
        },
        Expr::FieldAccess { receiver, .. } => {
            collect_expr_callees(receiver, registered_fns, callees)
        },
        Expr::IndexExpr { receiver, index, .. } => {
            collect_expr_callees(receiver, registered_fns, callees)
            collect_expr_callees(index, registered_fns, callees)
        },
        Expr::StructLit { fields, spread, .. } => {
            for f in fields {
                collect_expr_callees(f.value, registered_fns, callees)
            }
            match spread {
                some(s) => collect_expr_callees(s, registered_fns, callees),
                none => {}
            }
        },
        Expr::CatchExpr { expr: inner, arms, .. } => {
            collect_expr_callees(inner, registered_fns, callees)
            for arm in arms {
                match arm.guard {
                    some(g) => collect_expr_callees(g, registered_fns, callees),
                    none => {}
                }
                collect_expr_callees(arm.body, registered_fns, callees)
            }
        },
        Expr::HandleExpr { body, handlers, .. } => {
            collect_expr_callees(body, registered_fns, callees)
            for handler in handlers {
                collect_expr_callees(handler.body, registered_fns, callees)
            }
        },
        Expr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    StringInterpPart::ExprPart(e) => collect_expr_callees(e, registered_fns, callees),
                    StringInterpPart::LitPart(_) => {}
                }
            }
        },
        Expr::Range { start, end, .. } => {
            collect_expr_callees(start, registered_fns, callees)
            collect_expr_callees(end, registered_fns, callees)
        },
        Expr::ListLit { elements, .. } => {
            for el in elements {
                collect_expr_callees(el, registered_fns, callees)
            }
        },
        Expr::TupleLit { elements, .. } => {
            for el in elements {
                collect_expr_callees(el, registered_fns, callees)
            }
        },
        // Leaf expressions — no sub-expressions to traverse
        Expr::IntLit { .. } => {},
        Expr::FloatLit { .. } => {},
        Expr::StrLit { .. } => {},
        Expr::BoolLit { .. } => {},
        // B-113: return in expression position (match arm)
        Expr::ReturnExpr { value, .. } => match value {
            some(v) => collect_expr_callees(v, registered_fns, callees),
            none => {}
        }
    }
}

fn collect_stmt_callees(stmt: Stmt, registered_fns: Set<Str>, mut callees: Set<Str>) {
    match stmt {
        Stmt::Let { init, .. } => collect_expr_callees(init, registered_fns, callees),
        Stmt::Var { init, .. } => collect_expr_callees(init, registered_fns, callees),
        Stmt::Assign { target, value, .. } => {
            collect_expr_callees(target, registered_fns, callees)
            collect_expr_callees(value, registered_fns, callees)
        },
        Stmt::ExprStmt { expr, .. } => collect_expr_callees(expr, registered_fns, callees),
        Stmt::Return { value, .. } => match value {
            some(v) => collect_expr_callees(v, registered_fns, callees),
            none => {}
        },
        Stmt::While { condition, body, .. } => {
            collect_expr_callees(condition, registered_fns, callees)
            collect_expr_callees(body, registered_fns, callees)
        },
        Stmt::ForIn { iterable, body, .. } => {
            collect_expr_callees(iterable, registered_fns, callees)
            collect_expr_callees(body, registered_fns, callees)
        },
        Stmt::LetDestructure { init, .. } => collect_expr_callees(init, registered_fns, callees),
        Stmt::IfLet { expr, then_block, else_block, .. } => {
            collect_expr_callees(expr, registered_fns, callees)
            collect_expr_callees(then_block, registered_fns, callees)
            match else_block {
                some(eb) => collect_expr_callees(eb, registered_fns, callees),
                none => {}
            }
        },
        Stmt::Break { .. } => {},
        Stmt::Continue { .. } => {}
    }
}

// ============================================================
// Tarjan SCC
// ============================================================

// Standard Tarjan's algorithm for strongly connected components.
// Returns SCCs in reverse topological order: leaf dependencies come first,
// root callers come last.
pub fn tarjan_scc(graph: Map<Str, List<Str>>) -> List<List<Str>> {
    let mut index_counter = 0
    let mut stack: List<Str> = []
    let mut on_stack: Set<Str> = set_new()
    let mut indices: Map<Str, Int> = map_new()
    let mut lowlinks: Map<Str, Int> = map_new()
    let mut result: List<List<Str>> = []

    // Collect all nodes (some might only appear as targets, not keys)
    let mut all_nodes: Set<Str> = set_new()
    let mut sorted_graph = graph.entries()
    sorted_graph.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
    for entry in sorted_graph {
        let (node, targets) = entry
        all_nodes.insert(node)
        for t in targets {
            all_nodes.insert(t)
        }
    }

    let mut sorted_nodes: List<Str> = []
    for n in all_nodes { sorted_nodes.push(n) }
    sorted_nodes.sort()
    for node in sorted_nodes {
        if !indices.contains_key(node) {
            tarjan_strongconnect(node, graph, index_counter, stack, on_stack, indices, lowlinks, result)
        }
    }
    result
}

fn tarjan_strongconnect(
    v: Str,
    graph: Map<Str, List<Str>>,
    mut index_counter: Int,
    mut stack: List<Str>,
    mut on_stack: Set<Str>,
    mut indices: Map<Str, Int>,
    mut lowlinks: Map<Str, Int>,
    mut result: List<List<Str>>
) {
    let v_index = index_counter
    index_counter = index_counter + 1
    indices.insert(v, v_index)
    lowlinks.insert(v, v_index)
    stack.push(v)
    on_stack.insert(v)

    // Visit successors
    let successors = match graph.get(v) { some(s) => s, none => [] }
    for w in successors {
        if !indices.contains_key(w) {
            // w has not been visited; recurse
            tarjan_strongconnect(w, graph, index_counter, stack, on_stack, indices, lowlinks, result)
            let v_low = lowlinks.get(v).unwrap_or(0)
            let w_low = lowlinks.get(w).unwrap_or(0)
            if w_low < v_low {
                lowlinks.insert(v, w_low)
            }
        } else if on_stack.contains(w) {
            // w is on the stack, so it's part of the current SCC
            let v_low = lowlinks.get(v).unwrap_or(0)
            let w_idx = indices.get(w).unwrap_or(0)
            if w_idx < v_low {
                lowlinks.insert(v, w_idx)
            }
        }
    }

    // If v is a root node, pop the SCC
    let v_low = lowlinks.get(v).unwrap_or(0)
    let v_idx = indices.get(v).unwrap_or(0)
    if v_low == v_idx {
        let mut scc: List<Str> = []
        let mut done = false
        while !done {
            match stack.pop() {
                some(w) => {
                    on_stack.remove(w)
                    scc.push(w)
                    if w == v { done = true }
                },
                none => { done = true }
            }
        }
        result.push(scc)
    }
}
