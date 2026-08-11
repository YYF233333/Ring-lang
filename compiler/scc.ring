// scc.ring — Call graph construction + Tarjan SCC for B-122 checker pass ordering
//
// build_call_graph: traverses AST bodies of all Decl::Fn and Decl::Impl methods,
// collecting edges to registered top-level fn names.
//
// tarjan_scc: standard Tarjan algorithm, returns SCCs in reverse topological order
// (dependencies before dependents — leaf callees first, top-level callers last).

use ast::{Decl, Expr, Stmt, MatchArm, EffectHandler, StringInterpPart, StructFieldInit}
use hir::{compare_by_first}

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
    for name in registered_fns {
        let sorted_name = name
        sorted_names.push(sorted_name)
    }
    sorted_names.sort()
    for name in sorted_names {
        let lookup_name = name
        if !graph.contains_key(lookup_name) {
            let entry_name = name
            graph.insert(entry_name, [])
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
            let caller_lookup = caller
            if !graph.contains_key(caller_lookup) {
                let caller_entry = caller
                graph.insert(caller_entry, [])
            }
            let mut edges: Set<Str> = set_new()
            let body_ = body
            let registered_for_body = registered_fns
            let caller_for_body = caller
            collect_expr_callees(body_, registered_for_body,
                caller_for_body, edges)
            let mut sorted_edges: List<Str> = []
            for e in edges {
                if e != caller {
                    let sorted_edge = e
                    sorted_edges.push(sorted_edge)
                }
            }
            sorted_edges.sort()
            let graph_lookup = caller
            match graph.get(graph_lookup) {
                some(existing) => {
                    for e in sorted_edges {
                        let edge = e
                        existing.push(edge)
                    }
                },
                none => {
                    let graph_key = caller
                    let graph_edges = sorted_edges
                    graph.insert(graph_key, graph_edges)
                }
            }
        },
        Decl::Impl { target_type, trait_name, methods, .. } => {
            let inode = match trait_name {
                some(tn) => "impl::${target_type}::${tn}",
                none => "impl::${target_type}"
            }
            let inode_lookup = inode
            if !graph.contains_key(inode_lookup) {
                let inode_entry = inode
                graph.insert(inode_entry, [])
            }
            for method in methods {
                let method_ = method
                let recursive_fns = registered_fns
                let recursive_inode = inode
                collect_decl_edges(method_, recursive_fns, graph,
                    some(recursive_inode))
            }
        },
        Decl::ModBlock { name, decls, .. } => {
            for d in decls {
                // ModBlock fns are prefixed with "mod_name::" by prefix_decl_name,
                // but at call-graph time we see the raw AST before prefixing.
                // The registered_fns set has the prefixed names.
                // We need to prefix here to match.
                let decl_ = d
                let prefix_name = name
                let prefixed = prefix_mod_decl(prefix_name, decl_)
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
        Decl::Fn { name, .. } =>
            Decl::Fn { ..decl, name: "${mod_name}::${name}" },
        Decl::Impl { methods, .. } => {
            let mut prefixed_methods: List<Decl> = []
            for m in methods {
                let method_ = m
                let prefix_name = mod_name
                prefixed_methods.push(prefix_mod_decl(prefix_name, method_))
            }
            Decl::Impl { ..decl, methods: prefixed_methods }
        },
        _ => decl
    }
}

// ============================================================
// AST expression/statement traversal — collect callee names
// ============================================================
// Unified walker for two modes (#193):
//   TopLevel:    collect Ident callees from Call exprs matching registered_fns
//   SelfMethod:  collect self.method() callees matching impl method_names
//
// The mode enum selects which Call/MethodCall logic fires; all other AST
// traversal is shared.

enum CalleeMode {
    TopLevel { registered_fns: Set<Str>, scope_prefix: Str },
    SelfMethod { method_names: Set<Str> }
}

fn scc_file_root(scope_prefix: Str) -> Str {
    let parts = scope_prefix.split("$$_")
    if parts.len() > 1 { "${parts.get(0).unwrap_or("")}$$_" } else { "" }
}

fn scc_inline_scope(scope_prefix: Str) -> List<Str> {
    let mut scope = scope_prefix
    if scope.ends_with("::") { scope = scope.slice(0, scope.len() - 2) }
    let root_parts = scope.split("$$_")
    let inline_text = if root_parts.len() > 1 {
        root_parts.get(1).unwrap_or("")
    } else {
        scope
    }
    if inline_text == "" { [] } else { inline_text.split("::") }
}

fn scc_join_name(root: Str, inline_parts: List<Str>, name: Str) -> Str {
    if inline_parts.len() == 0 { return "${root}${name}" }
    "${root}${inline_parts.join("::")}::${name}"
}

// `self` preserves the current inline scope; each leading `super` removes one
// level.  Returning none on over-pop prevents a bogus fallback edge.
fn resolve_relative_callee(scope_prefix: Str, qualifier: Str, name: Str) -> Str? {
    let root = scc_file_root(scope_prefix)
    let mut inline_parts = scc_inline_scope(scope_prefix)
    let qualifier_parts = qualifier.split("::")
    let mut index = 0
    if qualifier_parts.get(0).unwrap_or("") == "self" {
        index = 1
    } else {
        while index < qualifier_parts.len() && qualifier_parts.get(index).unwrap_or("") == "super" {
            if inline_parts.len() == 0 { return none }
            inline_parts.pop()
            index = index + 1
        }
    }
    while index < qualifier_parts.len() {
        inline_parts.push(qualifier_parts.get(index).unwrap_or(""))
        index = index + 1
    }
    some(scc_join_name(root, inline_parts, name))
}

fn walk_expr_callees(expr: Expr, mode: CalleeMode, mut callees: Set<Str>) {
    match expr {
        Expr::Call { callee, args, .. } => {
            // TopLevel: check if callee is a direct Ident referencing a registered fn
            match mode {
                CalleeMode::TopLevel { registered_fns, scope_prefix } => {
                    match callee {
                        Expr::Ident { name, qualifier, .. } => {
                            match qualifier {
                                some(q) => {
                                    if q == "self" || q.starts_with("self::") || q == "super" || q.starts_with("super::") {
                                        match resolve_relative_callee(scope_prefix, q, name) {
                                            some(exact_name) => {
                                                if registered_fns.contains(exact_name) {
                                                    let callee_name = exact_name
                                                    callees.insert(callee_name)
                                                }
                                            },
                                            none => {}
                                        }
                                    } else {
                                         let root = scc_file_root(scope_prefix)
                                         let root_candidate = scc_join_name(root, q.split("::"), name)
                                         if registered_fns.contains(root_candidate) {
                                             let callee_name = root_candidate
                                             callees.insert(callee_name)
                                         } else {
                                            let mut current_parts = scc_inline_scope(scope_prefix)
                                            current_parts.extend(q.split("::"))
                                             let current_candidate = scc_join_name(root, current_parts, name)
                                             if registered_fns.contains(current_candidate) {
                                                 let callee_name = current_candidate
                                                 callees.insert(callee_name)
                                             }
                                        }
                                    }
                                },
                                none => {
                                    let root = scc_file_root(scope_prefix)
                                     let scoped_name = scc_join_name(root, scc_inline_scope(scope_prefix), name)
                                     if registered_fns.contains(scoped_name) {
                                         let callee_name = scoped_name
                                         callees.insert(callee_name)
                                     } else {
                                         let root_name = "${root}${name}"
                                         if registered_fns.contains(root_name) {
                                             let callee_name = root_name
                                             callees.insert(callee_name)
                                         }
                                    }
                                }
                            }
                        },
                        _ => {}
                    }
                },
                CalleeMode::SelfMethod { .. } => {}
            }
            // Recurse into callee expr and args
            walk_expr_callees(callee, mode, callees)
            for arg in args {
                walk_expr_callees(arg, mode, callees)
            }
        },
        Expr::MethodCall { receiver, method, args, .. } => {
            // SelfMethod: check if this is self.method() where method is in the impl
            match mode {
                CalleeMode::SelfMethod { method_names } => {
                    match receiver {
                         Expr::Ident { name, .. } => {
                             if name == "self" && method_names.contains(method) {
                                 let callee_method = method
                                 callees.insert(callee_method)
                            }
                        },
                        _ => {}
                    }
                },
                CalleeMode::TopLevel { .. } => {}
            }
            walk_expr_callees(receiver, mode, callees)
            for arg in args {
                walk_expr_callees(arg, mode, callees)
            }
        },
        Expr::Ident { .. } => {
            // Bare ident (not in Call position) — not a call, skip
        },
        Expr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                walk_stmt_callees(stmt, mode, callees)
            }
            match tail {
                some(t) => walk_expr_callees(t, mode, callees),
                none => {}
            }
        },
        Expr::IfExpr { condition, then_branch, else_branch, .. } => {
            walk_expr_callees(condition, mode, callees)
            walk_expr_callees(then_branch, mode, callees)
            match else_branch {
                some(eb) => walk_expr_callees(eb, mode, callees),
                none => {}
            }
        },
        Expr::MatchExpr { scrutinee, arms, .. } => {
            walk_expr_callees(scrutinee, mode, callees)
            for arm in arms {
                match arm.guard {
                    some(g) => walk_expr_callees(g, mode, callees),
                    none => {}
                }
                walk_expr_callees(arm.body, mode, callees)
            }
        },
        Expr::Lambda { body, .. } => {
            walk_expr_callees(body, mode, callees)
        },
        Expr::BinOp { left, right, .. } => {
            walk_expr_callees(left, mode, callees)
            walk_expr_callees(right, mode, callees)
        },
        Expr::UnaryOp { operand, .. } => {
            walk_expr_callees(operand, mode, callees)
        },
        Expr::FieldAccess { receiver, .. } => {
            walk_expr_callees(receiver, mode, callees)
        },
        Expr::IndexExpr { receiver, index, .. } => {
            walk_expr_callees(receiver, mode, callees)
            walk_expr_callees(index, mode, callees)
        },
        Expr::StructLit { fields, spread, .. } => {
            for f in fields {
                walk_expr_callees(f.value, mode, callees)
            }
            match spread {
                some(s) => walk_expr_callees(s, mode, callees),
                none => {}
            }
        },
        Expr::CatchExpr { expr: inner, arms, .. } => {
            walk_expr_callees(inner, mode, callees)
            for arm in arms {
                match arm.guard {
                    some(g) => walk_expr_callees(g, mode, callees),
                    none => {}
                }
                walk_expr_callees(arm.body, mode, callees)
            }
        },
        Expr::HandleExpr { body, handlers, .. } => {
            walk_expr_callees(body, mode, callees)
            for handler in handlers {
                walk_expr_callees(handler.body, mode, callees)
            }
        },
        Expr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    StringInterpPart::ExprPart(e) => walk_expr_callees(e, mode, callees),
                    StringInterpPart::LitPart(_) => {}
                }
            }
        },
        Expr::Range { start, end, .. } => {
            walk_expr_callees(start, mode, callees)
            walk_expr_callees(end, mode, callees)
        },
        Expr::ListLit { elements, .. } => {
            for el in elements {
                walk_expr_callees(el, mode, callees)
            }
        },
        Expr::TupleLit { elements, .. } => {
            for el in elements {
                walk_expr_callees(el, mode, callees)
            }
        },
        // Leaf expressions — no sub-expressions to traverse
        Expr::IntLit { .. } => {},
        Expr::FloatLit { .. } => {},
        Expr::StrLit { .. } => {},
        Expr::BoolLit { .. } => {},
        // B-113: return in expression position (match arm)
        Expr::ReturnExpr { value, .. } => match value {
            some(v) => walk_expr_callees(v, mode, callees),
            none => {}
        },
        // B-125: unsafe block — walk the body
        Expr::UnsafeBlock { body, .. } => walk_expr_callees(body, mode, callees)
    }
}

fn walk_stmt_callees(stmt: Stmt, mode: CalleeMode, mut callees: Set<Str>) {
    match stmt {
        Stmt::Let { init, .. } => walk_expr_callees(init, mode, callees),
        Stmt::Var { init, .. } => walk_expr_callees(init, mode, callees),
        Stmt::Assign { target, value, .. } => {
            walk_expr_callees(target, mode, callees)
            walk_expr_callees(value, mode, callees)
        },
        Stmt::ExprStmt { expr, .. } => walk_expr_callees(expr, mode, callees),
        Stmt::Return { value, .. } => match value {
            some(v) => walk_expr_callees(v, mode, callees),
            none => {}
        },
        Stmt::While { condition, body, .. } => {
            walk_expr_callees(condition, mode, callees)
            walk_expr_callees(body, mode, callees)
        },
        Stmt::ForIn { iterable, body, .. } => {
            walk_expr_callees(iterable, mode, callees)
            walk_expr_callees(body, mode, callees)
        },
        Stmt::LetDestructure { init, .. } => walk_expr_callees(init, mode, callees),
        Stmt::IfLet { expr, then_block, else_block, .. } => {
            walk_expr_callees(expr, mode, callees)
            walk_expr_callees(then_block, mode, callees)
            match else_block {
                some(eb) => walk_expr_callees(eb, mode, callees),
                none => {}
            }
        },
        Stmt::Break { .. } => {},
        Stmt::Continue { .. } => {}
    }
}

// Thin wrappers preserving original call-site signatures.
fn fn_scope_prefix(fn_name: Str) -> Str {
    let inline_parts = fn_name.split("::")
    if inline_parts.len() > 1 {
        let mut scope_parts: List<Str> = []
        for i in 0..inline_parts.len() - 1 {
            match inline_parts.get(i) {
                some(p) => {
                    let scope_part = p
                    scope_parts.push(scope_part)
                },
                none => {}
            }
        }
        return "${scope_parts.join("::")}::"
    }
    let module_parts = fn_name.split("$$_")
    if module_parts.len() > 1 {
        return "${module_parts.get(0).unwrap_or("")}$$_"
    }
    ""
}

fn collect_expr_callees(expr: Expr, registered_fns: Set<Str>, caller: Str, mut callees: Set<Str>) {
    let mode_fns = registered_fns
    let caller_ = caller
    let scope_prefix = fn_scope_prefix(caller_)
    let mode = CalleeMode::TopLevel {
        registered_fns: mode_fns,
        scope_prefix: scope_prefix
    }
    let expr_ = expr
    walk_expr_callees(expr_, mode, callees)
}

// Collect self.method() callees within an AST expression body (B-138).
// Only captures MethodCall where receiver is Ident("self") and method name
// is in the provided method_names set. Used for impl-internal SCC ordering.
pub fn collect_self_method_callees(expr: Expr, method_names: Set<Str>, mut callees: Set<Str>) {
    let mode_names = method_names
    let mode = CalleeMode::SelfMethod { method_names: mode_names }
    let expr_ = expr
    walk_expr_callees(expr_, mode, callees)
}

// ============================================================
// Tarjan SCC
// ============================================================

// Standard Tarjan's algorithm for strongly connected components.
// Returns SCCs in reverse topological order: leaf dependencies come first,
// root callers come last.
pub fn tarjan_scc(graph: Map<Str, List<Str>>) -> List<List<Str>> {
    // index_counter is wrapped in a List<Int> (length-1) so that recursive calls
    // share the same mutable counter — Int is a value type in Ring, so `mut Int`
    // increments would not propagate back to the caller (#181).
    let mut index_counter: List<Int> = [0]
    let mut stack: List<Str> = []
    let mut on_stack: Set<Str> = set_new()
    let mut indices: Map<Str, Int> = map_new()
    let mut lowlinks: Map<Str, Int> = map_new()
    let mut result: List<List<Str>> = []

    // Collect all nodes (some might only appear as targets, not keys)
    let mut all_nodes: Set<Str> = set_new()
    let mut sorted_graph = graph.entries()
    sorted_graph.sort_by(compare_by_first)
    for entry in sorted_graph {
        let (node, targets) = entry
        let source_node = node
        all_nodes.insert(source_node)
        for t in targets {
            let target_node = t
            all_nodes.insert(target_node)
        }
    }

    let mut sorted_nodes: List<Str> = []
    for n in all_nodes {
        let sorted_node = n
        sorted_nodes.push(sorted_node)
    }
    sorted_nodes.sort()
    for node in sorted_nodes {
        if !indices.contains_key(node) {
            let root_node = node
            tarjan_strongconnect(root_node, graph, index_counter, stack,
                on_stack, indices, lowlinks, result)
        }
    }
    result
}

fn tarjan_strongconnect(
    v: Str,
    graph: Map<Str, List<Str>>,
    mut index_counter: List<Int>,
    mut stack: List<Str>,
    mut on_stack: Set<Str>,
    mut indices: Map<Str, Int>,
    mut lowlinks: Map<Str, Int>,
    mut result: List<List<Str>>
) {
    let v_index = index_counter[0]
    index_counter.set(0, index_counter[0] + 1)
    let indices_key = v
    let lowlinks_key = v
    let stack_value = v
    let stack_key = v
    let indices_value = v_index
    let lowlinks_value = v_index
    indices.insert(indices_key, indices_value)
    lowlinks.insert(lowlinks_key, lowlinks_value)
    stack.push(stack_value)
    on_stack.insert(stack_key)

    // Visit successors
    let successors = match graph.get(v) { some(s) => s, none => [] }
    for w in successors {
        if !indices.contains_key(w) {
            // w has not been visited; recurse
            let recursive_node = w
            tarjan_strongconnect(recursive_node, graph, index_counter, stack,
                on_stack, indices, lowlinks, result)
            let v_low = lowlinks.get(v).unwrap_or(0)
            let w_low = lowlinks.get(w).unwrap_or(0)
            if w_low < v_low {
                let lowlink_key = v
                lowlinks.insert(lowlink_key, w_low)
            }
        } else if on_stack.contains(w) {
            // w is on the stack, so it's part of the current SCC
            let v_low = lowlinks.get(v).unwrap_or(0)
            let w_idx = indices.get(w).unwrap_or(0)
            if w_idx < v_low {
                let lowlink_key = v
                lowlinks.insert(lowlink_key, w_idx)
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
                    let is_root = w == v
                    on_stack.remove(w)
                    let component_node = w
                    scc.push(component_node)
                    if is_root { done = true }
                },
                none => { done = true }
            }
        }
        result.push(scc)
    }
}
