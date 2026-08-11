use types::{Type, Effect, EffectRow, RecordField, StructField, type_to_string,
    effect_kind_name, effects_match_kind_with_ownership, UNIT,
    callable_ownership_constraints_compatible,
    commit_callable_ownership_constraints}
use union_find::{UnionFind, uf_bind, uf_find, uf_lookup, uf_insert,
    new_union_find, clone_union_find, commit_union_find}
use env::{TypeEnv, apply_subst, apply_subst_row, apply_subst_map}

// ============================================================
// Unification error (raised via fail effect, caught by infer-ctx)
// ============================================================

pub struct UnificationError {
    pub message: Str,
    pub is_occurs_check: Bool
}

pub fn empty_subst() -> UnionFind { new_union_find() }

fn readonly_uf_root(uf: UnionFind, id: Int) -> Int {
    match uf.parent.get(id) {
        some(parent) => if parent == id {
            id
        } else {
            readonly_uf_root(uf, parent)
        },
        none => id
    }
}

// Read-only surface scan used solely to choose the transactional path.  It
// allocates no Set/Map: occurs-check keeps bound TypeVars acyclic and nominal
// definitions are expanded only by the pair-sensitive Struct↔Record helper
// below, where ordinary unification actually exposes hidden fields.
fn type_reaches_callable(ty: Type, subst: UnionFind) -> Bool {
    match ty {
        Type::FnType { .. } => true,
        Type::TypeVar { id, .. } => {
            let root = readonly_uf_root(subst, id)
            match subst.types.get(root) {
                some(bound) => type_reaches_callable(bound, subst),
                none => false
            }
        },
        Type::StructType { type_params, .. } => {
            for param in type_params {
                if type_reaches_callable(param, subst) {
                    return true
                }
            }
            false
        },
        Type::EnumType { type_params, .. } => {
            for param in type_params {
                if type_reaches_callable(param, subst) {
                    return true
                }
            }
            false
        },
        Type::GenericType { base, args } =>
            type_reaches_callable(base, subst) ||
            args.any(fn(arg) { type_reaches_callable(arg, subst) }),
        Type::RecordType { fields, tail, .. } => {
            if fields.any(fn(field) {
                    type_reaches_callable(field.ty, subst)
                }) {
                return true
            }
            match tail {
                some(id) => type_reaches_callable(
                    Type::TypeVar { id: id, name: none }, subst),
                none => false
            }
        },
        Type::EffectRowType { effects, tail } => {
            for eff in effects {
                if effect_reaches_callable(eff, subst) {
                    return true
                }
            }
            match tail {
                some(id) => type_reaches_callable(
                    Type::TypeVar { id: id, name: none }, subst),
                none => false
            }
        },
        Type::TupleType { elements } => elements.any(fn(element) {
            type_reaches_callable(element, subst)
        }),
        Type::PtrType { pointee } =>
            type_reaches_callable(pointee, subst),
        _ => false
    }
}

fn effect_reaches_callable(eff: Effect, subst: UnionFind) -> Bool {
    match eff {
        Effect::FailEffect { error_type } =>
            type_reaches_callable(error_type, subst),
        Effect::MutEffect { state_type } =>
            type_reaches_callable(state_type, subst),
        Effect::CustomEffect { type_args, .. } =>
            type_args.any(fn(arg) {
                type_reaches_callable(arg, subst)
            }),
        _ => false
    }
}

fn type_contains_nominal(ty: Type, subst: UnionFind) -> Bool {
    match ty {
        Type::StructType { .. } | Type::EnumType { .. } => true,
        Type::TypeVar { id, .. } => {
            let root = readonly_uf_root(subst, id)
            match subst.types.get(root) {
                some(bound) => type_contains_nominal(bound, subst),
                none => false
            }
        },
        Type::FnType { params, return_type, meta } =>
            params.any(fn(param) { type_contains_nominal(param, subst) }) ||
            type_contains_nominal(return_type, subst) ||
            meta.effects.effects.any(fn(eff) {
                effect_contains_nominal(eff, subst)
            }),
        Type::GenericType { base, args } =>
            type_contains_nominal(base, subst) ||
            args.any(fn(arg) { type_contains_nominal(arg, subst) }),
        Type::RecordType { fields, tail, .. } => {
            if fields.any(fn(field) {
                    type_contains_nominal(field.ty, subst)
                }) {
                return true
            }
            match tail {
                some(id) => type_contains_nominal(
                    Type::TypeVar { id: id, name: none }, subst),
                none => false
            }
        },
        Type::EffectRowType { effects, tail } => {
            if effects.any(fn(eff) {
                    effect_contains_nominal(eff, subst)
                }) {
                return true
            }
            match tail {
                some(id) => type_contains_nominal(
                    Type::TypeVar { id: id, name: none }, subst),
                none => false
            }
        },
        Type::TupleType { elements } => elements.any(fn(element) {
            type_contains_nominal(element, subst)
        }),
        Type::PtrType { pointee } => type_contains_nominal(pointee, subst),
        _ => false
    }
}

fn effect_contains_nominal(eff: Effect, subst: UnionFind) -> Bool {
    match eff {
        Effect::FailEffect { error_type } =>
            type_contains_nominal(error_type, subst),
        Effect::MutEffect { state_type } =>
            type_contains_nominal(state_type, subst),
        Effect::CustomEffect { type_args, .. } => type_args.any(fn(arg) {
            type_contains_nominal(arg, subst)
        }),
        _ => false
    }
}

fn type_reaches_callable_through_nominals(
    ty: Type, subst: UnionFind, env: TypeEnv,
    mut nominal_visited: Set<Str>
) -> Bool {
    if type_reaches_callable(ty, subst) { return true }
    match ty {
        Type::TypeVar { id, .. } => {
            let root = readonly_uf_root(subst, id)
            match subst.types.get(root) {
                some(bound) => type_reaches_callable_through_nominals(
                    bound, subst, env, nominal_visited),
                none => false
            }
        },
        Type::StructType { name, type_params } => {
            let key = "struct:${name}"
            let checked_key = key
            let inserted_key = key
            if nominal_visited.contains(checked_key) { return false }
            nominal_visited.insert(inserted_key)
            match env.types.structs.get(name) {
                some(def) => {
                    let mut mapping: Map<Int, Type>? = none
                    if def.type_param_vars.len() > 0 &&
                       type_params.len() > 0 {
                        let mut created: Map<Int, Type> = map_new()
                        let mut index = 0
                        while index < def.type_param_vars.len() &&
                              index < type_params.len() {
                             match (def.type_param_vars.get(index),
                                   type_params.get(index)) {
                                (some(id), some(arg)) => {
                                    let mapped_id = id
                                    let mapped_arg = arg
                                    created.insert(mapped_id, mapped_arg)
                                },
                                _ => {}
                            }
                            index = index + 1
                        }
                        mapping = some(created)
                    }
                    for field in def.fields {
                        let field_ty = match mapping {
                            some(subst_map) =>
                                apply_subst_map(subst_map, field.ty),
                            none => field.ty
                        }
                        if type_reaches_callable_through_nominals(
                                field_ty, subst, env, nominal_visited) {
                            let removed_key = key
                            nominal_visited.remove(removed_key)
                            return true
                        }
                    }
                    let removed_key = key
                    nominal_visited.remove(removed_key)
                    false
                },
                none => {
                    let removed_key = key
                    nominal_visited.remove(removed_key)
                    false
                }
            }
        },
        Type::EnumType { name, type_params } => {
            let key = "enum:${name}"
            let checked_key = key
            let inserted_key = key
            if nominal_visited.contains(checked_key) { return false }
            nominal_visited.insert(inserted_key)
            match env.types.enums.get(name) {
                some(def) => {
                    let mut mapping: Map<Int, Type>? = none
                    if def.type_param_vars.len() > 0 &&
                       type_params.len() > 0 {
                        let mut created: Map<Int, Type> = map_new()
                        let mut index = 0
                        while index < def.type_param_vars.len() &&
                              index < type_params.len() {
                             match (def.type_param_vars.get(index),
                                   type_params.get(index)) {
                                (some(id), some(arg)) => {
                                    let mapped_id = id
                                    let mapped_arg = arg
                                    created.insert(mapped_id, mapped_arg)
                                },
                                _ => {}
                            }
                            index = index + 1
                        }
                        mapping = some(created)
                    }
                    for variant in def.variants {
                        for field in variant.fields {
                            let field_ty = match mapping {
                                some(subst_map) =>
                                    apply_subst_map(subst_map, field),
                                none => field
                            }
                        if type_reaches_callable_through_nominals(
                                field_ty, subst, env, nominal_visited) {
                                let removed_key = key
                                nominal_visited.remove(removed_key)
                                return true
                            }
                        }
                    }
                    let removed_key = key
                    nominal_visited.remove(removed_key)
                    false
                },
                none => {
                    let removed_key = key
                    nominal_visited.remove(removed_key)
                    false
                }
            }
        },
        Type::GenericType { base, args } => {
            if type_reaches_callable_through_nominals(
                    base, subst, env, nominal_visited) {
                return true
            }
            for arg in args {
                if type_reaches_callable_through_nominals(
                        arg, subst, env, nominal_visited) {
                    return true
                }
            }
            false
        },
        Type::RecordType { fields, tail, .. } => {
            for field in fields {
                if type_reaches_callable_through_nominals(
                        field.ty, subst, env, nominal_visited) {
                    return true
                }
            }
            // A row tail may already be bound to a record whose fields contain
            // nominal wrappers around callable contracts.  The surface scan
            // follows the TypeVar but cannot see through those nominal fields,
            // so the complete nominal walk must continue through the tail too.
            match tail {
                some(id) => type_reaches_callable_through_nominals(
                    Type::TypeVar { id: id, name: none },
                    subst, env, nominal_visited),
                none => false
            }
        },
        Type::EffectRowType { effects, tail } => {
            for eff in effects {
                if effect_reaches_callable_through_nominals(
                        eff, subst, env, nominal_visited) {
                    return true
                }
            }
            // Effect-row tails share the same hidden-nominal hazard as record
            // tails.  Skipping a bound tail can incorrectly select the
            // non-transactional unifier and silently commit a later callable
            // Borrow/Move mismatch.
            match tail {
                some(id) => type_reaches_callable_through_nominals(
                    Type::TypeVar { id: id, name: none },
                    subst, env, nominal_visited),
                none => false
            }
        },
        Type::TupleType { elements } => {
            for element in elements {
                if type_reaches_callable_through_nominals(
                        element, subst, env, nominal_visited) {
                    return true
                }
            }
            false
        },
        Type::PtrType { pointee } =>
            type_reaches_callable_through_nominals(
                pointee, subst, env, nominal_visited),
        _ => false
    }
}

fn effect_reaches_callable_through_nominals(
    eff: Effect, subst: UnionFind, env: TypeEnv,
    nominal_visited: Set<Str>
) -> Bool {
    match eff {
        Effect::FailEffect { error_type } =>
            type_reaches_callable_through_nominals(
                error_type, subst, env, nominal_visited),
        Effect::MutEffect { state_type } =>
            type_reaches_callable_through_nominals(
                state_type, subst, env, nominal_visited),
        Effect::CustomEffect { type_args, .. } => type_args.any(fn(arg) {
            type_reaches_callable_through_nominals(
                arg, subst, env, nominal_visited)
        }),
        _ => false
    }
}

fn type_may_hide_callable(
    ty: Type, subst: UnionFind, env: TypeEnv
) -> Bool {
    if !type_contains_nominal(ty, subst) { return false }
    let nominal_visited: Set<Str> = set_new()
    type_reaches_callable_through_nominals(
        ty, subst, env, nominal_visited)
}

fn effect_pair_reaches_callable(
    left: Effect, right: Effect, subst: UnionFind, env: TypeEnv
) -> Bool {
    match (left, right) {
        (Effect::FailEffect { error_type: a },
         Effect::FailEffect { error_type: b }) =>
            unification_pair_reaches_callable(a, b, subst, env),
        (Effect::MutEffect { state_type: a },
         Effect::MutEffect { state_type: b }) =>
            unification_pair_reaches_callable(a, b, subst, env),
        (Effect::CustomEffect { name: an, type_args: aa },
         Effect::CustomEffect { name: bn, type_args: ba }) => {
            if an != bn || aa.len() != ba.len() { return false }
            let mut index = 0
            while index < aa.len() {
                match (aa.get(index), ba.get(index)) {
                    (some(a), some(b)) => {
                        let left_arg = a
                        let right_arg = b
                        if unification_pair_reaches_callable(
                            left_arg, right_arg, subst, env) {
                        return true
                        }
                    },
                    _ => {}
                }
                index = index + 1
            }
            false
        },
        _ => false
    }
}

fn row_pair_reaches_callable(
    left: EffectRow, right: EffectRow, subst: UnionFind, env: TypeEnv
) -> Bool {
    for a in left.effects {
        for b in right.effects {
            let matched_left = a
            let matched_right = b
            let callable_left = a
            let callable_right = b
            if effects_match_kind_with_ownership(
                    env.types.ownership_metadata,
                    matched_left, matched_right) &&
               effect_pair_reaches_callable(
                    callable_left, callable_right, subst, env) {
                return true
            }
        }
    }
    false
}

fn struct_record_pair_reaches_callable(
    st: Type, rt: Type, subst: UnionFind, env: TypeEnv
) -> Bool {
    match (st, rt) {
        (Type::StructType { name, type_params },
         Type::RecordType { fields, tail, .. }) => match env.types.structs.get(name) {
            some(def) => {
                // Monomorphic structs are the common coercion case and need no
                // temporary substitution Map at all.
                let mut mapping: Map<Int, Type>? = none
                if def.type_param_vars.len() > 0 && type_params.len() > 0 {
                    let mut created: Map<Int, Type> = map_new()
                    let mut index = 0
                    while index < def.type_param_vars.len() &&
                          index < type_params.len() {
                        match (def.type_param_vars.get(index),
                               type_params.get(index)) {
                            (some(id), some(arg)) => {
                                let mapped_id = id
                                let mapped_arg = arg
                                created.insert(mapped_id, mapped_arg)
                            },
                            _ => {}
                        }
                        index = index + 1
                    }
                    mapping = some(created)
                }
                for field in fields {
                    match def.fields.find(fn(candidate) {
                        candidate.name == field.name
                    }) {
                        some(source) => {
                            let source_ty = match mapping {
                                some(subst_map) =>
                                    apply_subst_map(subst_map, source.ty),
                                none => source.ty
                            }
                            if unification_pair_reaches_callable(
                                    source_ty, field.ty, subst, env) {
                                return true
                            }
                        },
                        none => {}
                    }
                }
                // An open record tail receives every unmatched struct field.
                // If one hides a callable, the row binding itself must be part
                // of the scratch transaction even when no explicit record
                // field mentioned it.
                if tail.is_some() {
                    for source in def.fields {
                        if !fields.any(fn(field) {
                                field.name == source.name
                            }) {
                            let source_ty = match mapping {
                                some(subst_map) =>
                                    apply_subst_map(subst_map, source.ty),
                                none => source.ty
                            }
                            if type_reaches_callable(source_ty, subst) {
                                return true
                            }
                        }
                    }
                }
                false
            },
            none => false
        },
        _ => false
    }
}

fn nominal_pair_reaches_callable(
    an: Str, aa: List<Type>, bn: Str, ba: List<Type>,
    subst: UnionFind, env: TypeEnv
) -> Bool {
    if an != bn || aa.len() != ba.len() { return false }
    let mut index = 0
    while index < aa.len() {
        match (aa.get(index), ba.get(index)) {
            (some(a), some(b)) => if unification_pair_reaches_callable(
                    a, b, subst, env) {
                return true
            },
            _ => {}
        }
        index = index + 1
    }
    false
}

fn unification_pair_reaches_callable(
    left: Type, right: Type, subst: UnionFind, env: TypeEnv
) -> Bool {
    let direct_left = left
    let direct_right = right
    let hidden_left = left
    let hidden_right = right
    let matched_left = left
    let matched_right = right
    let forward_struct = left
    let forward_record = right
    let reverse_record = left
    let reverse_struct = right
    if type_reaches_callable(direct_left, subst) ||
       type_reaches_callable(direct_right, subst) {
        return true
    }
    // Row-tail and shared-TypeVar bindings can expose a nominal from one
    // sibling to a structurally unrelated later sibling. Pair-local matching
    // cannot predict that closure without running unification, so any hidden
    // callable reachable from either initial side selects the transaction.
    if type_may_hide_callable(hidden_left, subst, env) ||
       type_may_hide_callable(hidden_right, subst, env) {
        return true
    }
    match (matched_left, matched_right) {
        (Type::TypeVar { id, .. }, other) => {
            let root = readonly_uf_root(subst, id)
            match subst.types.get(root) {
                some(bound) => {
                    let resolved_bound = bound
                    let paired_other = other
                    unification_pair_reaches_callable(
                        resolved_bound, paired_other, subst, env)
                },
                none => type_may_hide_callable(other, subst, env)
            }
        },
        (other, Type::TypeVar { id, .. }) => {
            let root = readonly_uf_root(subst, id)
            match subst.types.get(root) {
                some(bound) => {
                    let paired_other = other
                    let resolved_bound = bound
                    unification_pair_reaches_callable(
                        paired_other, resolved_bound, subst, env)
                },
                none => type_may_hide_callable(other, subst, env)
            }
        },
        (Type::StructType { .. }, Type::RecordType { .. }) =>
            struct_record_pair_reaches_callable(
                forward_struct, forward_record, subst, env),
        (Type::RecordType { .. }, Type::StructType { .. }) =>
            struct_record_pair_reaches_callable(
                reverse_struct, reverse_record, subst, env),
        (Type::StructType { name: an, type_params: aa },
         Type::StructType { name: bn, type_params: ba }) =>
            nominal_pair_reaches_callable(an, aa, bn, ba, subst, env),
        (Type::EnumType { name: an, type_params: aa },
         Type::EnumType { name: bn, type_params: ba }) =>
            nominal_pair_reaches_callable(an, aa, bn, ba, subst, env),
        (Type::GenericType { base: ab, args: aa },
         Type::GenericType { base: bb, args: ba }) => {
            let base_left = ab
            let base_right = bb
            if unification_pair_reaches_callable(
                    base_left, base_right, subst, env) {
                return true
            }
            let mut index = 0
            while index < aa.len() && index < ba.len() {
                match (aa.get(index), ba.get(index)) {
                    (some(a), some(b)) => {
                        let arg_left = a
                        let arg_right = b
                        if unification_pair_reaches_callable(
                            arg_left, arg_right, subst, env) {
                        return true
                        }
                    },
                    _ => {}
                }
                index = index + 1
            }
            false
        },
        (Type::RecordType { fields: af, .. },
         Type::RecordType { fields: bf, .. }) => {
            for a in af {
                match bf.find(fn(b) { b.name == a.name }) {
                    some(b) => {
                        let field_left = a.ty
                        let field_right = b.ty
                        if unification_pair_reaches_callable(
                            field_left, field_right, subst, env) {
                        return true
                        }
                    },
                    none => {}
                }
            }
            false
        },
        (Type::EffectRowType { effects: ae, tail: at },
         Type::EffectRowType { effects: be, tail: bt }) => {
            let left_effects = ae
            let left_tail = at
            let right_effects = be
            let right_tail = bt
            row_pair_reaches_callable(
                EffectRow {
                    effects: left_effects, tail: left_tail
                },
                EffectRow {
                    effects: right_effects, tail: right_tail
                }, subst, env)
        },
        (Type::TupleType { elements: aa },
         Type::TupleType { elements: ba }) => {
            let mut index = 0
            while index < aa.len() && index < ba.len() {
                match (aa.get(index), ba.get(index)) {
                    (some(a), some(b)) => {
                        let element_left = a
                        let element_right = b
                        if unification_pair_reaches_callable(
                            element_left, element_right, subst, env) {
                        return true
                        }
                    },
                    _ => {}
                }
                index = index + 1
            }
            false
        },
        (Type::PtrType { pointee: a }, Type::PtrType { pointee: b }) =>
            {
                let pointee_left = a
                let pointee_right = b
                unification_pair_reaches_callable(
                    pointee_left, pointee_right, subst, env)
            },
        _ => false
    }
}

// ============================================================
// Error helpers
// ============================================================

fn unify_error(t1: Type, t2: Type, detail: Str?) -> Never {
    let base = "Type mismatch: cannot unify ${type_to_string(t1)} with ${type_to_string(t2)}"
    let msg = match detail { some(d) => "${base} — ${d}", none => base }
    fail.raise(UnificationError { message: msg, is_occurs_check: false })
}

fn unify_error_occurs(t1: Type, t2: Type) -> Never {
    let msg = "Type mismatch: cannot unify ${type_to_string(t1)} with ${type_to_string(t2)} — infinite type (occurs check)"
    fail.raise(UnificationError { message: msg, is_occurs_check: true })
}

fn unify_error_msg(detail: Str) -> Never {
    fail.raise(UnificationError { message: detail, is_occurs_check: false })
}

// ============================================================
// Occurs check: does var_id appear anywhere in type?
// ============================================================

pub fn occurs_in(var_id: Int, t: Type, subst: UnionFind) -> Bool {
    match t {
        Type::IntType => false,
        Type::FloatType => false,
        Type::StrType => false,
        Type::BoolType => false,
        Type::UnitType => false,
        Type::NeverType => false,
        Type::AnyType => false,
        Type::ErrorType => false,
        Type::TypeVar { id, .. } => {
            let root = uf_find(subst, id)
            if root == var_id { return true }
            match uf_lookup(subst, root) {
                some(resolved) => occurs_in(var_id, resolved, subst),
                none => false
            }
        },
        Type::FnType { params, return_type, meta } =>
            params.any(fn(p) { occurs_in(var_id, p, subst) }) ||
            occurs_in(var_id, return_type, subst) ||
            occurs_in_row(var_id, meta.effects, subst),
        Type::StructType { type_params, .. } =>
            type_params.any(fn(p) { occurs_in(var_id, p, subst) }),
        Type::EnumType { type_params, .. } =>
            type_params.any(fn(p) { occurs_in(var_id, p, subst) }),
        Type::GenericType { base, args } =>
            occurs_in(var_id, base, subst) ||
            args.any(fn(a) { occurs_in(var_id, a, subst) }),
        Type::RecordType { fields, tail, .. } => {
            let in_tail = match tail {
                some(t_id) => {
                    let root = uf_find(subst, t_id)
                    if root == var_id { return true }
                    match uf_lookup(subst, root) {
                        some(resolved) => occurs_in(var_id, resolved, subst),
                        none => false
                    }
                },
                none => false
            }
            in_tail || fields.any(fn(f) { occurs_in(var_id, f.ty, subst) })
        },
        Type::EffectRowType { effects, tail } => {
            let row_effects = effects
            let row_tail = tail
            occurs_in_row(var_id, EffectRow {
                effects: row_effects, tail: row_tail
            }, subst)
        },
        Type::TupleType { elements } =>
            elements.any(fn(e) { occurs_in(var_id, e, subst) }),
        Type::PtrType { pointee } =>
            occurs_in(var_id, pointee, subst)
    }
}

fn occurs_in_row(var_id: Int, row: EffectRow, subst: UnionFind) -> Bool {
    let in_tail = match row.tail {
        some(t_id) => {
            let root = uf_find(subst, t_id)
            if root == var_id { return true }
            match uf_lookup(subst, root) {
                some(resolved) => occurs_in(var_id, resolved, subst),
                none => false
            }
        },
        none => false
    }
    in_tail || row.effects.any(fn(e) { occurs_in_effect(var_id, e, subst) })
}

fn occurs_in_effect(var_id: Int, e: Effect, subst: UnionFind) -> Bool {
    match e {
        Effect::FailEffect { error_type } => occurs_in(var_id, error_type, subst),
        Effect::MutEffect { state_type } => occurs_in(var_id, state_type, subst),
        Effect::CustomEffect { type_args, .. } =>
            type_args.any(fn(a) { occurs_in(var_id, a, subst) }),
        Effect::IoEffect => false,
        Effect::UnsafeEffect => false
    }
}

// ============================================================


fn unify_effect_params_inner(a: Effect, b: Effect, subst: UnionFind, mut env: TypeEnv) -> UnionFind {
    match (a, b) {
        (Effect::FailEffect { error_type: et_a }, Effect::FailEffect { error_type: et_b }) =>
            unify_types(et_a, et_b, subst, env),
        (Effect::MutEffect { state_type: sa }, Effect::MutEffect { state_type: sb }) =>
            unify_types(sa, sb, subst, env),
        (Effect::CustomEffect { name, type_args: ta_a }, Effect::CustomEffect { type_args: ta_b, .. }) => {
            if ta_a.len() != ta_b.len() {
                unify_error_msg("effect '${name}' type argument count mismatch: ${ta_a.len()} vs ${ta_b.len()}")
            }
            let mut s = subst
            let mut i = 0
            while i < ta_a.len() {
                s = unify_types(
                    ta_a.get(i).unwrap_or(UNIT),
                    ta_b.get(i).unwrap_or(UNIT),
                    s, env
                )
                i = i + 1
            }
            s
        },
        _ => subst
    }
}

// ============================================================
// Index filter helper
// ============================================================

fn filter_by_index_not_in(effects: List<Effect>, excluded: Set<Int>) -> List<Effect> {
    let mut result: List<Effect> = []
    let mut idx = 0
    for e in effects {
        if !excluded.contains(idx) {
            let retained_effect = e
            result.push(retained_effect)
        }
        idx = idx + 1
    }
    result
}

// ============================================================
// Unify effect rows (Koka-style row variable solving)
// ============================================================

fn unify_effect_rows_inner(a: EffectRow, b: EffectRow, subst: UnionFind, mut env: TypeEnv) -> UnionFind {
    let mut s = subst
    let ra = apply_subst_row(s, a)
    let rb = apply_subst_row(s, b)

    let mut a_matched: Set<Int> = set_new()
    let mut b_matched: Set<Int> = set_new()
    let mut ai = 0
    while ai < ra.effects.len() {
        let mut bi = 0
        while bi < rb.effects.len() {
            if !b_matched.contains(bi) {
                match (ra.effects.get(ai), rb.effects.get(bi)) {
                    (some(eff_a), some(eff_b)) => {
                        let matched_effect_a = eff_a
                        let matched_effect_b = eff_b
                        let unified_effect_a = eff_a
                        let unified_effect_b = eff_b
                        if effects_match_kind_with_ownership(
                            env.types.ownership_metadata,
                            matched_effect_a, matched_effect_b
                        ) {
                            s = unify_effect_params_inner(
                                unified_effect_a, unified_effect_b, s, env)
                            let matched_a_index = ai
                            a_matched.insert(matched_a_index)
                            b_matched.insert(bi)
                            break
                        }
                    },
                    _ => {}
                }
            }
            bi = bi + 1
        }
        ai = ai + 1
    }

    let a_unmatched = filter_by_index_not_in(ra.effects, a_matched)
    let b_unmatched = filter_by_index_not_in(rb.effects, b_matched)

    if a_unmatched.len() > 0 && rb.tail.is_none() {
        let names = a_unmatched.map(fn(e) { effect_kind_name(e) }).join(", ")
        unify_error_msg("effect mismatch: effects [${names}] not allowed in pure context")
    }
    if b_unmatched.len() > 0 && ra.tail.is_none() {
        let names = b_unmatched.map(fn(e) { effect_kind_name(e) }).join(", ")
        unify_error_msg("effect mismatch: effects [${names}] not allowed in pure context")
    }

    match (ra.tail, rb.tail) {
        (some(ta), some(tb)) => {
            if ta == tb {
                if a_unmatched.len() > 0 || b_unmatched.len() > 0 {
                    let fresh = env.fresh_var_id()
                    let mut all_unmatched: List<Effect> = []
                    for e in a_unmatched {
                        let unmatched_effect = e
                        all_unmatched.push(unmatched_effect)
                    }
                    for e in b_unmatched {
                        let unmatched_effect = e
                        all_unmatched.push(unmatched_effect)
                    }
                    let extended_row = Type::EffectRowType {
                        effects: all_unmatched, tail: some(fresh)
                    }
                    let checked_extended_row = extended_row
                    let inserted_extended_row = extended_row
                    if occurs_in(ta, checked_extended_row, s) {
                        unify_error_msg("infinite type in effect row variable")
                    }
                    uf_insert(s, ta, inserted_extended_row)
                }
            } else if a_unmatched.len() == 0 && b_unmatched.len() == 0 {
                s = unify_types(Type::TypeVar { id: ta, name: none }, Type::TypeVar { id: tb, name: none }, s, env)
            } else {
                let fresh = env.fresh_var_id()
                if b_unmatched.len() > 0 {
                    let a_fresh_tail = fresh
                    let row_for_a_tail = Type::EffectRowType {
                        effects: b_unmatched, tail: some(a_fresh_tail)
                    }
                    let checked_row_for_a_tail = row_for_a_tail
                    let inserted_row_for_a_tail = row_for_a_tail
                    if occurs_in(ta, checked_row_for_a_tail, s) {
                        unify_error_msg("infinite type in effect row variable")
                    }
                    uf_insert(s, ta, inserted_row_for_a_tail)
                } else {
                    let a_fresh_tail = fresh
                    s = unify_types(
                        Type::TypeVar { id: ta, name: none },
                        Type::TypeVar { id: a_fresh_tail, name: none },
                        s, env)
                }
                if a_unmatched.len() > 0 {
                    let b_fresh_tail = fresh
                    let row_for_b_tail = Type::EffectRowType {
                        effects: a_unmatched, tail: some(b_fresh_tail)
                    }
                    let checked_row_for_b_tail = row_for_b_tail
                    let inserted_row_for_b_tail = row_for_b_tail
                    if occurs_in(tb, checked_row_for_b_tail, s) {
                        unify_error_msg("infinite type in effect row variable")
                    }
                    uf_insert(s, tb, inserted_row_for_b_tail)
                } else {
                    let b_fresh_tail = fresh
                    s = unify_types(
                        Type::TypeVar { id: tb, name: none },
                        Type::TypeVar { id: b_fresh_tail, name: none },
                        s, env)
                }
            }
        },
        (none, some(tb)) => {
            // a is closed, b is open — push a's unmatched effects into b's tail
            if a_unmatched.len() > 0 {
                let row_for_b_tail = Type::EffectRowType { effects: a_unmatched, tail: none }
                let checked_row_for_b_tail = row_for_b_tail
                let inserted_row_for_b_tail = row_for_b_tail
                if occurs_in(tb, checked_row_for_b_tail, s) {
                    unify_error_msg("infinite type in effect row variable")
                }
                uf_insert(s, tb, inserted_row_for_b_tail)
            }
            // When a_unmatched is empty, all effects matched — the tail variable
            // is left unbound to avoid over-constraining shared type variables
            // (e.g., effect-polymorphic HOF instantiation tails used by merge_effects).
        },
        (some(ta), none) => {
            // a is open, b is closed — push b's unmatched effects into a's tail
            if b_unmatched.len() > 0 {
                let row_for_a_tail = Type::EffectRowType { effects: b_unmatched, tail: none }
                let checked_row_for_a_tail = row_for_a_tail
                let inserted_row_for_a_tail = row_for_a_tail
                if occurs_in(ta, checked_row_for_a_tail, s) {
                    unify_error_msg("infinite type in effect row variable")
                }
                uf_insert(s, ta, inserted_row_for_a_tail)
            }
            // When b_unmatched is empty, all effects matched — the tail variable
            // is left unbound to avoid over-constraining shared type variables.
        },
        (none, none) => {}
    }

    s
}

// ============================================================
// Record row unification
// ============================================================

fn unify_record_rows(ra: Type, rb: Type, subst: UnionFind, mut env: TypeEnv) -> UnionFind {
    let matched_ra = ra
    let matched_rb = rb
    let missing_a_ra = ra
    let missing_a_rb = rb
    let missing_b_ra = ra
    let missing_b_rb = rb
    let cross_a_ra = ra
    let cross_a_rb = rb
    let cross_b_ra = ra
    let cross_b_rb = rb
    let tail_a_ra = ra
    let tail_a_rb = rb
    let tail_b_ra = ra
    let tail_b_rb = rb
    match (matched_ra, matched_rb) {
        (Type::RecordType { fields: a_fields, tail: a_tail, .. },
         Type::RecordType { fields: b_fields, tail: b_tail, .. }) => {
            let mut s = subst

            let mut b_name_set: Set<Str> = set_new()
            for f in b_fields { b_name_set.insert(f.name) }
            let mut a_name_set: Set<Str> = set_new()
            for f in a_fields { a_name_set.insert(f.name) }

            for af in a_fields {
                let bf = b_fields.find(fn(f) { f.name == af.name })
                match bf {
                    some(matched) => { s = unify_types(af.ty, matched.ty, s, env) },
                    none => {}
                }
            }

            let a_only = a_fields.filter(fn(f) { !b_name_set.contains(f.name) })
            let b_only = b_fields.filter(fn(f) { !a_name_set.contains(f.name) })

            if a_only.len() > 0 && b_tail.is_none() {
                let missing = a_only.map(fn(f) { f.name }).join(", ")
                unify_error(missing_a_ra, missing_a_rb,
                    some("record missing fields: ${missing}"))
            }
            if b_only.len() > 0 && a_tail.is_none() {
                let missing = b_only.map(fn(f) { f.name }).join(", ")
                unify_error(missing_b_ra, missing_b_rb,
                    some("record missing fields: ${missing}"))
            }

            if a_only.len() > 0 && b_only.len() > 0 && a_tail.is_some() && b_tail.is_some() {
                let paired_a_tail = a_tail
                let paired_b_tail = b_tail
                match (paired_a_tail, paired_b_tail) {
                    (some(ta), some(tb)) => {
                        let fresh_tail = env.fresh_var_id()
                        let a_fresh_tail = fresh_tail
                        let b_fresh_tail = fresh_tail
                        let a_tail_fields = b_only
                        let b_tail_fields = a_only
                        let a_tail_record = Type::RecordType {
                            fields: a_tail_fields,
                            tail: some(a_fresh_tail), tail_name: none
                        }
                        let b_tail_record = Type::RecordType {
                            fields: b_tail_fields,
                            tail: some(b_fresh_tail), tail_name: none
                        }
                        let checked_a_tail_record = a_tail_record
                        let inserted_a_tail_record = a_tail_record
                        let checked_b_tail_record = b_tail_record
                        let inserted_b_tail_record = b_tail_record
                        if occurs_in(ta, checked_a_tail_record, s) {
                            unify_error(cross_a_ra, cross_a_rb,
                                some("infinite type in row variable"))
                        }
                        if occurs_in(tb, checked_b_tail_record, s) {
                            unify_error(cross_b_ra, cross_b_rb,
                                some("infinite type in row variable"))
                        }
                        uf_insert(s, ta, inserted_a_tail_record)
                        uf_insert(s, tb, inserted_b_tail_record)
                    },
                    _ => {}
                }
            } else {
                let b_only_for_a_tail = b_only
                let a_only_for_b_tail = a_only
                let a_only_for_final = a_only
                let b_only_for_final = b_only
                let first_a_tail = a_tail
                let first_b_tail = b_tail
                let final_a_tail = a_tail
                let final_b_tail = b_tail
                match first_a_tail {
                    some(ta) => {
                        if b_only_for_a_tail.len() > 0 {
                            let record_for_tail = Type::RecordType {
                                fields: b_only_for_a_tail,
                                tail: none, tail_name: none
                            }
                            let checked_record_for_tail = record_for_tail
                            let inserted_record_for_tail = record_for_tail
                            if occurs_in(ta, checked_record_for_tail, s) {
                                unify_error(tail_a_ra, tail_a_rb,
                                    some("infinite type in row variable"))
                            }
                            uf_insert(s, ta, inserted_record_for_tail)
                        }
                    },
                    none => {}
                }
                match first_b_tail {
                    some(tb) => {
                        if a_only_for_b_tail.len() > 0 {
                            let record_for_tail = Type::RecordType {
                                fields: a_only_for_b_tail,
                                tail: none, tail_name: none
                            }
                            let checked_record_for_tail = record_for_tail
                            let inserted_record_for_tail = record_for_tail
                            if occurs_in(tb, checked_record_for_tail, s) {
                                unify_error(tail_b_ra, tail_b_rb,
                                    some("infinite type in row variable"))
                            }
                            uf_insert(s, tb, inserted_record_for_tail)
                        }
                    },
                    none => {}
                }
                match (final_a_tail, final_b_tail) {
                    (some(ta), some(tb)) => {
                        if a_only_for_final.len() == 0 &&
                           b_only_for_final.len() == 0 && ta != tb {
                            s = unify_types(
                                Type::TypeVar { id: ta, name: none },
                                Type::TypeVar { id: tb, name: none },
                                s, env
                            )
                        }
                    },
                    _ => {}
                }
            }

            s
        },
        _ => panic("unreachable: unify_record_rows expected RecordType")
    }
}

// ============================================================
// Struct -> Record coercion
// ============================================================

fn unify_struct_with_record(st: Type, rt: Type, subst: UnionFind, mut env: TypeEnv) -> UnionFind {
    let matched_st = st
    let matched_rt = rt
    let missing_st = st
    let missing_rt = rt
    let occurs_st = st
    let occurs_rt = rt
    match (matched_st, matched_rt) {
        (Type::StructType { name, type_params, .. },
         Type::RecordType { fields: record_fields, tail: record_tail, .. }) => {
            // Look up struct fields from registry and instantiate with type_params
            let struct_fields = match env.types.structs.get(name) {
                some(struct_def) => {
                    let mut inst_map: Map<Int, Type> = map_new()
                    let mut fi = 0
                    while fi < struct_def.type_param_vars.len() && fi < type_params.len() {
                        match (struct_def.type_param_vars.get(fi), type_params.get(fi)) {
                            (some(var_id), some(tp)) => {
                                let mapped_var_id = var_id
                                let mapped_type = tp
                                inst_map.insert(mapped_var_id, mapped_type)
                            },
                            _ => {}
                        }
                        fi = fi + 1
                    }
                    struct_def.fields.map(fn(f) { StructField { name: f.name, ty: apply_subst_map(inst_map, f.ty), is_pub: f.is_pub } })
                },
                none => {
                    let empty: List<StructField> = []
                    empty
                }
            }
            let mut s = subst

            for rf in record_fields {
                let sf = struct_fields.find(fn(f) { f.name == rf.name })
                match sf {
                    some(matched) => {
                        let source_type = matched.ty
                        let current_subst = s
                        s = unify_types(
                            source_type, rf.ty, current_subst, env)
                    },
                    none => {
                        let field_names = record_fields.map(fn(f) { f.name }).join(", ")
                        unify_error(missing_st, missing_rt,
                            some("type '${name}' does not satisfy {${field_names}, ..} — missing field '${rf.name}'"))
                    }
                }
            }

            match record_tail {
                some(tail_id) => {
                    let remaining = struct_fields.filter(fn(sf) {
                        !record_fields.any(fn(rf) { rf.name == sf.name })
                    })
                    let remaining_mapped = remaining.map(fn(f) {
                        RecordField { name: f.name, ty: apply_subst(s, f.ty) }
                    })
                    let tail_record = Type::RecordType { fields: remaining_mapped, tail: none, tail_name: none }
                    let checked_tail_record = tail_record
                    let inserted_tail_record = tail_record
                    if occurs_in(tail_id, checked_tail_record, s) {
                        unify_error(occurs_st, occurs_rt,
                            some("infinite type in row variable"))
                    }
                    uf_insert(s, tail_id, inserted_tail_record)
                },
                none => {}
            }

            let result_subst = s
            result_subst
        },
        _ => panic("unreachable: unify_struct_with_record expected StructType and RecordType")
    }
}

// ============================================================
// Type kind helpers (for early returns in unify)
// ============================================================

fn is_any(t: Type) -> Bool { match t { Type::AnyType => true, _ => false } }
fn is_never(t: Type) -> Bool { match t { Type::NeverType => true, _ => false } }
fn var_id(t: Type) -> Int? {
    match t {
        Type::TypeVar { id, .. } => {
            let result_id = id
            some(result_id)
        },
        _ => none
    }
}

// ============================================================
// Bind type variable (with occurs check)
// ============================================================

fn bind_var(id: Int, target: Type, t1: Type, t2: Type, subst: UnionFind) -> UnionFind {
    if occurs_in(id, target, subst) {
        unify_error_occurs(t1, t2)
    }
    uf_bind(subst, id, target)
    subst
}

// ============================================================
// Transactional callable-ownership collection
// ============================================================

fn collect_ownership_effect_pairs(
    left: Effect, right: Effect, mut pairs: List<(Int, Int)>,
    env: TypeEnv
) {
    match (left, right) {
        (Effect::FailEffect { error_type: a },
         Effect::FailEffect { error_type: b }) => {
            let left_error_type = a
            let right_error_type = b
            collect_ownership_pairs(
                left_error_type, right_error_type, pairs, env)
        },
        (Effect::MutEffect { state_type: a },
         Effect::MutEffect { state_type: b }) => {
            let left_state_type = a
            let right_state_type = b
            collect_ownership_pairs(
                left_state_type, right_state_type, pairs, env)
        },
        (Effect::CustomEffect { name: an, type_args: aa },
         Effect::CustomEffect { name: bn, type_args: ba }) => {
            if an != bn || aa.len() != ba.len() { return }
            let mut index = 0
            while index < aa.len() {
                match (aa.get(index), ba.get(index)) {
                    (some(a), some(b)) => {
                        let left_arg = a
                        let right_arg = b
                        collect_ownership_pairs(
                            left_arg, right_arg, pairs, env)
                    },
                    _ => {}
                }
                index = index + 1
            }
        },
        _ => {}
    }
}

fn collect_ownership_row_pairs(
    left: EffectRow, right: EffectRow, mut pairs: List<(Int, Int)>,
    env: TypeEnv
) {
    let mut matched: Set<Int> = set_new()
    for a in left.effects {
        let mut index = 0
        while index < right.effects.len() {
            if !matched.contains(index) {
                match right.effects.get(index) {
                    some(b) => if effects_match_kind_with_ownership(
                        env.types.ownership_metadata, a, b
                    ) {
                        let left_effect = a
                        let right_effect = b
                        collect_ownership_effect_pairs(
                            left_effect, right_effect, pairs, env)
                        matched.insert(index)
                        break
                    },
                    none => {}
                }
            }
            index = index + 1
        }
    }
}

fn collect_struct_record_ownership_pairs(
    st: Type, rt: Type, mut pairs: List<(Int, Int)>, env: TypeEnv
) {
    match (st, rt) {
        (Type::StructType { name, type_params },
         Type::RecordType { fields, .. }) => {
            match env.types.structs.get(name) {
                some(def) => {
                    let mut mapping: Map<Int, Type> = map_new()
                    let mut index = 0
                    while index < def.type_param_vars.len() &&
                          index < type_params.len() {
                        match (def.type_param_vars.get(index),
                               type_params.get(index)) {
                            (some(id), some(arg)) => {
                                let mapped_id = id
                                let mapped_arg = arg
                                mapping.insert(mapped_id, mapped_arg)
                            },
                            _ => {}
                        }
                        index = index + 1
                    }
                    for field in fields {
                        match def.fields.find(fn(candidate) {
                            candidate.name == field.name
                        }) {
                            some(source) => {
                                let source_type = apply_subst_map(
                                    mapping, source.ty)
                                let record_field_type = field.ty
                                collect_ownership_pairs(
                                    source_type, record_field_type, pairs, env)
                            },
                            none => {}
                        }
                    }
                },
                none => {}
            }
        },
        _ => {}
    }
}

fn collect_ownership_pairs(
    left: Type, right: Type, mut pairs: List<(Int, Int)>, env: TypeEnv
) {
    // The final Struct<->Record arms delegate the original whole values after
    // the early bottom checks and the main structural match have borrowed them.
    // Preserve exact whole-value views before any match; arm-local aliases are
    // too late and would read an already-consumed match scrutinee.
    let struct_record_left = left
    let struct_record_right = right
    match left {
        Type::ErrorType | Type::AnyType | Type::NeverType => return,
        _ => {}
    }
    match right {
        Type::ErrorType | Type::AnyType | Type::NeverType => return,
        _ => {}
    }
    match (left, right) {
        (Type::FnType { params: ap, return_type: ar, meta: am },
         Type::FnType { params: bp, return_type: br, meta: bm }) => {
            pairs.push((am.ownership_term, bm.ownership_term))
            if ap.len() == bp.len() {
                let mut index = 0
                while index < ap.len() {
                    match (ap.get(index), bp.get(index)) {
                        (some(a), some(b)) => {
                            let left_param = a
                            let right_param = b
                            collect_ownership_pairs(
                                left_param, right_param, pairs, env)
                        },
                        _ => {}
                    }
                    index = index + 1
                }
            }
            let left_return = ar
            let right_return = br
            collect_ownership_pairs(
                left_return, right_return, pairs, env)
            let left_effects = am.effects
            let right_effects = bm.effects
            collect_ownership_row_pairs(
                left_effects, right_effects, pairs, env)
        },
        (Type::StructType { name: an, type_params: aa },
         Type::StructType { name: bn, type_params: ba }) => {
            if an != bn || aa.len() != ba.len() { return }
            let mut index = 0
            while index < aa.len() {
                match (aa.get(index), ba.get(index)) {
                    (some(a), some(b)) => {
                        let left_param = a
                        let right_param = b
                        collect_ownership_pairs(
                            left_param, right_param, pairs, env)
                    },
                    _ => {}
                }
                index = index + 1
            }
        },
        (Type::EnumType { name: an, type_params: aa },
         Type::EnumType { name: bn, type_params: ba }) => {
            if an != bn || aa.len() != ba.len() { return }
            let mut index = 0
            while index < aa.len() {
                match (aa.get(index), ba.get(index)) {
                    (some(a), some(b)) => {
                        let left_param = a
                        let right_param = b
                        collect_ownership_pairs(
                            left_param, right_param, pairs, env)
                    },
                    _ => {}
                }
                index = index + 1
            }
        },
        (Type::GenericType { base: ab, args: aa },
         Type::GenericType { base: bb, args: ba }) => {
            let left_base = ab
            let right_base = bb
            collect_ownership_pairs(left_base, right_base, pairs, env)
            if aa.len() != ba.len() { return }
            let mut index = 0
            while index < aa.len() {
                match (aa.get(index), ba.get(index)) {
                    (some(a), some(b)) => {
                        let left_arg = a
                        let right_arg = b
                        collect_ownership_pairs(
                            left_arg, right_arg, pairs, env)
                    },
                    _ => {}
                }
                index = index + 1
            }
        },
        (Type::RecordType { fields: af, .. },
         Type::RecordType { fields: bf, .. }) => {
            for a in af {
                match bf.find(fn(b) { b.name == a.name }) {
                    some(b) => {
                        let left_field_type = a.ty
                        let right_field_type = b.ty
                        collect_ownership_pairs(
                            left_field_type, right_field_type, pairs, env)
                    },
                    none => {}
                }
            }
        },
        (Type::EffectRowType { effects: ae, tail: at },
         Type::EffectRowType { effects: be, tail: bt }) => {
            let left_effects = ae
            let left_tail = at
            let right_effects = be
            let right_tail = bt
            collect_ownership_row_pairs(
                EffectRow { effects: left_effects, tail: left_tail },
                EffectRow { effects: right_effects, tail: right_tail },
                pairs, env)
        },
        (Type::TupleType { elements: aa },
         Type::TupleType { elements: ba }) => {
            if aa.len() != ba.len() { return }
            let mut index = 0
            while index < aa.len() {
                match (aa.get(index), ba.get(index)) {
                    (some(a), some(b)) => {
                        let left_element = a
                        let right_element = b
                        collect_ownership_pairs(
                            left_element, right_element, pairs, env)
                    },
                    _ => {}
                }
                index = index + 1
            }
        },
        (Type::PtrType { pointee: a },
         Type::PtrType { pointee: b }) => {
            let left_pointee = a
            let right_pointee = b
            collect_ownership_pairs(
                left_pointee, right_pointee, pairs, env)
        },
        (Type::StructType { .. }, Type::RecordType { .. }) => {
            collect_struct_record_ownership_pairs(
                struct_record_left, struct_record_right, pairs, env)
        },
        (Type::RecordType { .. }, Type::StructType { .. }) => {
            collect_struct_record_ownership_pairs(
                struct_record_right, struct_record_left, pairs, env)
        },
        _ => {}
    }
}

pub fn unify(t1: Type, t2: Type, subst: UnionFind, mut env: TypeEnv) -> UnionFind {
    // The overwhelmingly common checker path contains no callable contract at
    // all. Keep it allocation-neutral: the ordinary unifier retains its
    // historical in-place behavior and no Map is cloned.
    let detection_t1 = t1
    let detection_t2 = t2
    let direct_t1 = t1
    let direct_t2 = t2
    let preflight_t1 = t1
    let preflight_t2 = t2
    let unify_t1 = t1
    let unify_t2 = t2
    let final_t1 = t1
    let final_t2 = t2
    let mismatch_t1 = t1
    let mismatch_t2 = t2
    let direct_subst = subst
    let scratch_source = subst
    let committed_subst = subst
    if !unification_pair_reaches_callable(
            detection_t1, detection_t2, subst, env) {
        return unify_types(direct_t1, direct_t2, direct_subst, env)
    }
    // UnionFind owns mutable Maps. Work on a deep scratch copy so an error
    // caught by unify_at cannot leak ordinary TypeVar bindings or compression.
    let scratch = clone_union_find(scratch_source)
    let a = apply_subst(scratch, preflight_t1)
    let b = apply_subst(scratch, preflight_t2)
    let mut ownership_pairs: List<(Int, Int)> = []
    collect_ownership_pairs(a, b, ownership_pairs, env)
    if !callable_ownership_constraints_compatible(
            env.types.ownership_metadata, ownership_pairs) {
        unify_error(mismatch_t1, mismatch_t2,
            some("callable ownership contract mismatch"))
    }
    let result = unify_types(unify_t1, unify_t2, scratch, env)
    // Ordinary TypeVar bindings made above can reveal a callable pair that was
    // not structurally visible in the initial types (`(?a, ?a)` against
    // `(fn(var), fn(move))`). Re-collect from the final substitution and
    // preflight the combined batch before the first ownership mutation.
    let result_for_left = result
    let result_for_right = result
    let committed_result = result
    collect_ownership_pairs(
        apply_subst(result_for_left, final_t1),
        apply_subst(result_for_right, final_t2),
        ownership_pairs, env)
    if !callable_ownership_constraints_compatible(
            env.types.ownership_metadata, ownership_pairs) {
        let final_mismatch_t1 = t1
        let final_mismatch_t2 = t2
        unify_error(final_mismatch_t1, final_mismatch_t2,
            some("callable ownership contract mismatch"))
    }
    commit_callable_ownership_constraints(
        env.types.ownership_metadata, ownership_pairs)
    commit_union_find(committed_subst, committed_result)
    let result_subst = subst
    result_subst
}

pub fn unify_effect_params(
    a: Effect, b: Effect, subst: UnionFind, mut env: TypeEnv
) -> UnionFind {
    let effect_subst = subst
    unify(
        Type::EffectRowType { effects: [a], tail: none },
        Type::EffectRowType { effects: [b], tail: none },
        effect_subst, env)
}

// ============================================================
// Main ordinary-type unification (ownership commits only in wrapper above)
// ============================================================

fn unify_types(t1: Type, t2: Type, subst: UnionFind, mut env: TypeEnv) -> UnionFind {
    let applied_t1 = t1
    let applied_t2 = t2
    let bind_left_t1 = t1
    let bind_left_t2 = t2
    let bind_right_t1 = t1
    let bind_right_t2 = t2
    let applied_a = apply_subst(subst, applied_t1)
    let applied_b = apply_subst(subst, applied_t2)
    let error_a = applied_a
    let error_b = applied_b
    let any_a = applied_a
    let any_b = applied_b
    let var_a = applied_a
    let var_b = applied_b
    let bind_target_a = applied_a
    let bind_target_b = applied_b
    let never_a = applied_a
    let never_b = applied_b
    let matched_a = applied_a
    let matched_b = applied_b
    let record_left = applied_a
    let record_right = applied_b
    let struct_left = applied_a
    let struct_right = applied_b

    // ErrorType absorbs: unification with ErrorType always succeeds
    match error_a { Type::ErrorType => { return subst }, _ => {} }
    match error_b { Type::ErrorType => { return subst }, _ => {} }

    // any unifies with anything
    if is_any(any_a) || is_any(any_b) { return subst }

    // Same type variable
    let va = var_id(var_a)
    let vb = var_id(var_b)
    let compared_va = va
    let compared_vb = vb
    match (compared_va, compared_vb) {
        (some(ia), some(ib)) => { if ia == ib { return subst } },
        _ => {}
    }

    // Bind a variable (must come before never so that unify(?a, never) binds ?a)
    match va {
        some(id) => {
            return bind_var(
                id, bind_target_b, bind_left_t1, bind_left_t2, subst)
        },
        none => {}
    }
    match vb {
        some(id) => {
            return bind_var(
                id, bind_target_a, bind_right_t1, bind_right_t2, subst)
        },
        none => {}
    }

    // never unifies with anything (bottom type)
    if is_never(never_a) || is_never(never_b) { return subst }

    // Structured type unification
    match (matched_a, matched_b) {
        // Same primitive types
        (Type::IntType, Type::IntType) => subst,
        (Type::FloatType, Type::FloatType) => subst,
        (Type::StrType, Type::StrType) => subst,
        (Type::BoolType, Type::BoolType) => subst,
        (Type::UnitType, Type::UnitType) => subst,

        // Ownership pairs were collectively preflighted by the public wrapper;
        // this helper now unifies only the ordinary parameter/return/effect
        // structure and cannot mutate the ownership UF.
        (Type::FnType { params: pa, return_type: ra, meta: ma },
         Type::FnType { params: pb, return_type: rb, meta: mb }) => {
            if pa.len() != pb.len() {
                unify_error(t1, t2, some("parameter count mismatch: ${pa.len()} vs ${pb.len()}"))
            }
            let mut s = subst
            let mut i = 0
            while i < pa.len() {
                s = unify_types(
                    pa.get(i).unwrap_or(UNIT),
                    pb.get(i).unwrap_or(UNIT),
                    s, env
                )
                i = i + 1
            }
            s = unify_types(ra, rb, s, env)
            s = unify_effect_rows_inner(ma.effects, mb.effects, s, env)
            s
        },

        // Struct types
        (Type::StructType { name: na, type_params: tpa, .. },
         Type::StructType { name: nb, type_params: tpb, .. }) => {
            if na != nb {
                unify_error(t1, t2, some("different struct types"))
            }
            if tpa.len() != tpb.len() {
                unify_error(t1, t2, some("different type parameter counts for struct '${na}'"))
            }
            let mut s = subst
            let mut i = 0
            while i < tpa.len() {
                s = unify_types(
                    tpa.get(i).unwrap_or(UNIT),
                    tpb.get(i).unwrap_or(UNIT),
                    s, env
                )
                i = i + 1
            }
            s
        },

        // Enum types
        (Type::EnumType { name: na, type_params: tpa, .. },
         Type::EnumType { name: nb, type_params: tpb, .. }) => {
            if na != nb {
                unify_error(t1, t2, some("different enum types"))
            }
            if tpa.len() != tpb.len() {
                unify_error(t1, t2, some("different type parameter counts for enum '${na}'"))
            }
            let mut s = subst
            let mut i = 0
            while i < tpa.len() {
                s = unify_types(
                    tpa.get(i).unwrap_or(UNIT),
                    tpb.get(i).unwrap_or(UNIT),
                    s, env
                )
                i = i + 1
            }
            s
        },

        // Generic types
        (Type::GenericType { base: ba, args: aa },
         Type::GenericType { base: bb, args: ab }) => {
            let mut s = unify_types(ba, bb, subst, env)
            if aa.len() != ab.len() {
                unify_error(t1, t2, some("different type argument counts"))
            }
            let mut i = 0
            while i < aa.len() {
                s = unify_types(
                    aa.get(i).unwrap_or(UNIT),
                    ab.get(i).unwrap_or(UNIT),
                    s, env
                )
                i = i + 1
            }
            s
        },

        // Record types (row unification)
        (Type::RecordType { .. }, Type::RecordType { .. }) =>
            unify_record_rows(record_left, record_right, subst, env),

        // Effect row types
        (Type::EffectRowType { effects: ea, tail: ta },
         Type::EffectRowType { effects: eb, tail: tb }) => {
            let left_effects = ea
            let left_tail = ta
            let right_effects = eb
            let right_tail = tb
            unify_effect_rows_inner(
                EffectRow {
                    effects: left_effects, tail: left_tail
                },
                EffectRow {
                    effects: right_effects, tail: right_tail
                }, subst, env)
        },

        // Tuple types
        (Type::TupleType { elements: ea }, Type::TupleType { elements: eb }) => {
            if ea.len() != eb.len() {
                unify_error(t1, t2, some("tuple arity mismatch: ${ea.len()} vs ${eb.len()}"))
            }
            let mut s = subst
            let mut i = 0
            while i < ea.len() {
                s = unify_types(
                    ea.get(i).unwrap_or(UNIT),
                    eb.get(i).unwrap_or(UNIT),
                    s, env
                )
                i = i + 1
            }
            s
        },

        // Ptr types
        (Type::PtrType { pointee: pa }, Type::PtrType { pointee: pb }) =>
            unify_types(pa, pb, subst, env),

        // Struct satisfies record constraint (one-direction coercion)
        (Type::StructType { .. }, Type::RecordType { .. }) =>
            unify_struct_with_record(struct_left, struct_right, subst, env),
        (Type::RecordType { .. }, Type::StructType { .. }) =>
            unify_struct_with_record(struct_right, struct_left, subst, env),

        // Mismatch
        _ => unify_error(t1, t2, none)
    }
}
