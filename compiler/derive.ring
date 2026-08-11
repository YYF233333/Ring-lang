use types::{Type, EffectRow, StructField, EnumVariant,
    INT, STR, BOOL, EMPTY_ROW, CALLABLE_BORROW_OWNED,
    CALLABLE_SOURCE_CONSERVATIVE_INTERFACE, fn_meta}
use env::{TypeEnv, TypeScheme, SchemeBound, StructDef, EnumDef,
    ImplEntry, ImplDictBound, MethodOrigin,
    add_impl, has_impl, find_impl, install_method_scheme,
    instantiate_impl_dict_requirements, new_local_callable_scheme}
use ast::{Position, Span, DeriveAttribute, span_zero}
use diagnostics::{CollectingSink, Severity, DiagnosticContext, make_diag}
use codes::{E0503}
use hir::{DerivedImpl, DerivedField, DerivedVariant, FieldAction, DictRef,
    TraitBound, TypeKind, trait_dict_name, trait_bound_param_name, compare_by_first}

fn str_at(list: List<Str>, i: Int) -> Str {
    match list.get(i) {
        some(v) => { let value = v; value },
        none => panic("unreachable: str_at out of bounds")
    }
}

fn int_at(list: List<Int>, i: Int) -> Int {
    match list.get(i) { some(v) => v, none => panic("unreachable: int_at out of bounds") }
}

fn type_at(list: List<Type>, i: Int) -> Type {
    match list.get(i) {
        some(v) => { let value = v; value },
        none => panic("unreachable: type_at out of bounds")
    }
}

fn df_at(list: List<DerivedField>, i: Int) -> DerivedField {
    match list.get(i) {
        some(v) => { let value = v; value },
        none => panic("unreachable: df_at out of bounds")
    }
}

const BUILTIN_TYPES: Set<Str> = set_from(["Option", "Cell", "List", "Map", "Set", "Range"])

// ================================================================
// Public entry point
// ================================================================

pub fn run_derive_pass(
    mut env: TypeEnv, sink: CollectingSink
) -> List<DerivedImpl> {
    let mut derived_impls: List<DerivedImpl> = []
    let all_types = collect_user_types(env)
    derive_trait(env, sink, all_types, "Eq", derived_impls)
    // B-107 coherence: only the compiler's structural Eq path may opt a type
    // into structural Hash.  At this point derived_impls contains only this
    // pass's Eq impls, so manual Eq impls already present in trait_reg cannot
    // be mistaken for auto Eq.
    let auto_eq_types = collect_derived_type_names(derived_impls, "Eq")
    derive_hash_trait(env, sink, all_types, auto_eq_types, derived_impls)
    derive_trait(env, sink, all_types, "Clone", derived_impls)
    derive_trait(env, sink, all_types, "Ord", derived_impls)
    derive_trait(env, sink, all_types, "Debug", derived_impls)
    derive_json_trait(env, sink, all_types, derived_impls)
    derived_impls
}

fn collect_derived_type_names(derived_impls: List<DerivedImpl>, trait_name: Str) -> Set<Str> {
    let mut names: Set<Str> = set_new()
    for di in derived_impls {
        if di.trait_name == trait_name {
            names.insert(di.type_name)
        }
    }
    names
}

// ================================================================
// Collect user-defined types
// ================================================================

struct UserType {
    name: Str,
    type_kind: TypeKind,
    struct_def: StructDef?,
    enum_def: EnumDef?,
    derive_attrs: List<DeriveAttribute>
}

fn collect_user_types(env: TypeEnv) -> List<UserType> {
    let builtins = BUILTIN_TYPES
    let mut result: List<UserType> = []
    let mut sorted_structs = env.types.structs.entries()
    sorted_structs.sort_by(compare_by_first)
    for entry in sorted_structs {
        let (name, def) = entry
        // Skip mod aliases (e.g. "Point" aliasing "geo::Point") to avoid duplicate derives
        if name != def.name { continue }
        // Skip opaque extern types (B-074): registered as zero-field structs for
        // type-checking, but they have no observable runtime structure to derive.
        if def.is_extern { continue }
        if builtins.contains(name) == false {
            let user_type_name = name
            let struct_definition = def
            let struct_attrs_definition = def
            result.push(UserType {
                name: user_type_name,
                type_kind: TypeKind::StructKind,
                struct_def: some(struct_definition), enum_def: none,
                derive_attrs: struct_attrs_definition.derive_attrs
            })
        }
    }
    let mut sorted_enums = env.types.enums.entries()
    sorted_enums.sort_by(compare_by_first)
    for entry in sorted_enums {
        let (name, def) = entry
        // Skip mod aliases to avoid duplicate derives
        if name != def.name { continue }
        if builtins.contains(name) == false {
            let user_type_name = name
            let enum_definition = def
            let enum_attrs_definition = def
            result.push(UserType {
                name: user_type_name,
                type_kind: TypeKind::EnumKind,
                struct_def: none, enum_def: some(enum_definition),
                derive_attrs: enum_attrs_definition.derive_attrs
            })
        }
    }
    result
}

// ================================================================
// Fixpoint derivation for a single trait
// ================================================================

fn derive_trait(
    mut env: TypeEnv, sink: CollectingSink,
    all_types: List<UserType>, trait_name: Str,
    mut derived_impls: List<DerivedImpl>
) {
    let mut known = set_new()
    let mut sorted_impls = env.trait_reg.trait_impls.entries()
    sorted_impls.sort_by(compare_by_first)
    for entry in sorted_impls {
        let (tname, impls) = entry
        for imp in impls {
            if imp.trait_name == trait_name {
                known.insert(imp.target_type_name)
            }
        }
    }
    known.insert("Int")
    known.insert("Float")
    known.insert("Str")
    known.insert("Bool")

    let mut changed = true
    while changed {
        changed = false
        for ut in all_types {
            if known.contains(ut.name) { } else {
                // Drop identity is carried by the authoritative ownership
                // shape.  Never rediscover it through the display spelling of
                // a trait: a shadow trait named Drop is unrelated.  Inspect the
                // open nominal shape directly instead of calling type_may_own
                // on Struct<TVar>, whose param_deps are intentionally
                // fail-closed before the Clone bounds are proven.
                let blocks_clone = if trait_name == "Clone" {
                    match env.types.ownership_metadata.ownership_shapes.get(ut.name) {
                        some(shape) => shape.direct_drop || shape.may_own,
                        none => panic("unreachable: derive target has no ownership shape")
                    }
                } else { false }
                if blocks_clone { } else {
                if has_manual_impl(env, ut.name, trait_name) { } else {
                    let derived_trait_name = trait_name
                    let result = try_derive(
                        env, ut, derived_trait_name, known)
                    match result {
                        some(di) => {
                            known.insert(ut.name)
                            let registered_impl = di
                            let recorded_impl = di
                            let registered_trait_name = trait_name
                            register_derived_impl(
                                env, sink, registered_impl,
                                registered_trait_name, span_zero())
                            derived_impls.push(recorded_impl)
                            changed = true
                        },
                        none => {},
                    }
                }
                }
            }
        }
    }
}

// Hash uses the same try_derive decomposition as structural Eq, but eligibility
// is restricted to the exact set of Eq impls generated by this derive pass.
// A pre-existing manual Eq therefore never silently acquires structural Hash.
fn derive_hash_trait(
    mut env: TypeEnv,
    sink: CollectingSink,
    all_types: List<UserType>,
    auto_eq_types: Set<Str>,
    mut derived_impls: List<DerivedImpl>
) {
    let mut known: Set<Str> = set_new()
    let mut sorted_impls = env.trait_reg.trait_impls.entries()
    sorted_impls.sort_by(compare_by_first)
    for entry in sorted_impls {
        let (_tname, impls) = entry
        for imp in impls {
            if imp.trait_name == "Hash" {
                known.insert(imp.target_type_name)
            }
        }
    }
    // Hash has exactly these primitive impls.  In particular Float and Unit
    // must not enter the Hash fixpoint.
    known.insert("Int")
    known.insert("Str")
    known.insert("Bool")

    let mut changed = true
    while changed {
        changed = false
        for ut in all_types {
            if auto_eq_types.contains(ut.name) {
                if known.contains(ut.name) { } else {
                    if has_manual_impl(env, ut.name, "Hash") { } else {
                        let result = try_derive(env, ut, "Hash", known)
                        match result {
                            some(di) => {
                                known.insert(ut.name)
                                let registered_impl = di
                                let recorded_impl = di
                                register_derived_impl(
                                    env, sink, registered_impl, "Hash", span_zero())
                                derived_impls.push(recorded_impl)
                                changed = true
                            },
                            none => {},
                        }
                    }
                }
            }
        }
    }
}

fn has_manual_impl(env: TypeEnv, type_name: Str, trait_name: Str) -> Bool {
    has_impl(env.trait_reg, type_name, trait_name)
}

fn requests_derive(ut: UserType, trait_name: Str) -> Bool {
    for attr in ut.derive_attrs {
        if attr.trait_name == trait_name { return true }
    }
    false
}

fn duplicate_derive_span(span: Span) -> Span {
    let copied_file = "${span.file}"
    let copied_start = Position {
        line: span.start.line,
        column: span.start.column,
        offset: span.start.offset
    }
    let copied_end = Position {
        line: span.end.line,
        column: span.end.column,
        offset: span.end.offset
    }
    Span { file: copied_file, start: copied_start, end: copied_end }
}

fn derive_attribute_span(ut: UserType, trait_name: Str) -> Span? {
    for attr in ut.derive_attrs {
        if attr.trait_name == trait_name {
            return some(duplicate_derive_span(attr.span))
        }
    }
    none
}

// Json is deliberately opt-in. Unlike the historical auto-derived traits,
// only an explicit @derive(Json) declaration enters this fixpoint.
fn derive_json_trait(
    mut env: TypeEnv, mut sink: CollectingSink,
    all_types: List<UserType>, mut derived_impls: List<DerivedImpl>
) {
    for ut in all_types {
        for attr in ut.derive_attrs {
            if attr.trait_name != "Json" {
                let requested = attr.trait_name
                let detail = "unsupported explicit derive trait '${requested}'"
                sink.report(make_diag(E0503, Severity::SevError,
                    "@derive currently supports Json; '${requested}' is not an explicit derive target",
                    attr.span, DiagnosticContext::TraitError { detail: detail }))
            }
        }
    }

    // Json is a two-phase derive.  First solve every explicit candidate's
    // ordered runtime predicates as a least fixed point.  Candidate references
    // consult the current plan, so mutually-recursive SCCs grow together rather
    // than waiting for one member to become "known" first.  Manual impls are
    // always read through their authoritative ImplEntry.dict_bounds.
    let mut candidate_names: Set<Str> = set_new()
    let mut plans: Map<Str, List<ImplDictBound>> = map_new()
    for ut in all_types {
        if requests_derive(ut, "Json") && !has_manual_impl(env, ut.name, "Json") {
            candidate_names.insert(ut.name)
            let empty: List<ImplDictBound> = []
            plans.insert(ut.name, empty)
        }
    }

    let mut invalid: Set<Str> = set_new()
    // Every successful changed round either invalidates a candidate or appends
    // at least one previously unseen (type-param, trait) pair. This finite cap
    // is an internal guard against accidental non-monotonic SCC regressions.
    let trait_count = env.trait_reg.traits.len()
    let mut max_rounds = 2 + candidate_names.len()
    for ut in all_types {
        if candidate_names.contains(ut.name) {
            max_rounds = max_rounds +
                user_type_param_count(ut) * (trait_count + 1)
        }
    }
    let mut rounds = 0
    let mut changed = true
    while changed {
        rounds = rounds + 1
        if rounds > max_rounds {
            panic("Json derive evidence fixed point did not terminate")
        }
        changed = false
        for ut in all_types {
            if candidate_names.contains(ut.name) && !invalid.contains(ut.name) {
                match plan_json_bounds_for_user_type(
                    env, ut, candidate_names, invalid, plans
                ) {
                    none => {
                        invalid.insert(ut.name)
                        changed = true
                    },
                    some(next) => {
                        // Monotonic union preserves the first-discovery order.
                        // Never replace a plan: SCC peers may expose the same
                        // finite predicate set in a different traversal order.
                        let mut merged: List<ImplDictBound> = []
                        match plans.get(ut.name) {
                            some(previous) => {
                                for bound in previous {
                                    push_impl_dict_bound(
                                        merged, bound.type_param_index,
                                        "${bound.trait_name}")
                                }
                            },
                            none => {}
                        }
                        let before = merged.len()
                        for bound in next {
                            push_impl_dict_bound(
                                merged, bound.type_param_index, bound.trait_name)
                        }
                        if merged.len() != before {
                            plans.insert(ut.name, merged)
                            changed = true
                        }
                    }
                }
            }
        }
    }

    // Register the complete valid set before producing any body actions.  A
    // recursive member can therefore resolve every peer via find_impl exactly
    // like ordinary inference does; no provisional/builtin dictionary exists.
    for ut in all_types {
        if candidate_names.contains(ut.name) && !invalid.contains(ut.name) {
            let plan = match plans.get(ut.name) {
                some(bounds) => bounds,
                none => []
            }
            let signature = json_derived_signature(ut, plan)
            match signature {
                some(di) => {
                    let attr_span = match derive_attribute_span(ut, "Json") {
                        some(span) => span,
                        none => span_zero()
                    }
                    register_derived_impl(env, sink, di, "Json", attr_span)
                },
                none => { invalid.insert(ut.name) }
            }
        }
    }

    let mut known: Set<Str> = set_new()
    let mut sorted_impls = env.trait_reg.trait_impls.entries()
    sorted_impls.sort_by(compare_by_first)
    for entry in sorted_impls {
        let (_target, impls) = entry
        for imp in impls {
            if imp.trait_name == "Json" { known.insert(imp.target_type_name) }
        }
    }

    for ut in all_types {
        if candidate_names.contains(ut.name) && !invalid.contains(ut.name) {
            match try_derive(env, ut, "Json", known) {
                some(di) => {
                    let planned = match plans.get(ut.name) {
                        some(found) => found,
                        none => []
                    }
                    let actual = match derived_impl_dict_bounds(di) {
                        some(found) => found,
                        none => panic("Json derive produced an invalid type-parameter bound")
                    }
                    if !same_impl_dict_bound_set(planned, actual) {
                        panic("Json derive evidence set changed after ImplEntry registration")
                    }
                    let planned_signature = match json_derived_signature(ut, planned) {
                        some(found) => found,
                        none => panic("Json derive lost its registered evidence plan")
                    }
                    // Field actions are name-addressed, while the method ABI is
                    // positional. Normalize the emitted ABI back to the exact
                    // first-discovery order already stored in ImplEntry.
                    derived_impls.push(derived_impl_with_bounds(
                        di, planned_signature.bounds))
                },
                none => { invalid.insert(ut.name) }
            }
        }
    }

    for ut in all_types {
        if candidate_names.contains(ut.name) && invalid.contains(ut.name) {
            let display = ut.name
            let attr_span = match derive_attribute_span(ut, "Json") {
                some(span) => span,
                none => span_zero()
            }
            sink.report(make_diag(E0503, Severity::SevError,
                "Cannot derive Json for '${display}': every field must provide Json evidence",
                attr_span, DiagnosticContext::TraitError {
                    detail: "Json derive field evidence is missing"
                }))
        }
    }
}

fn user_type_param_count(ut: UserType) -> Int {
    match ut.type_kind {
        TypeKind::StructKind => match ut.struct_def {
            some(def) => def.type_params.len(),
            none => 0
        },
        TypeKind::EnumKind => match ut.enum_def {
            some(def) => def.type_params.len(),
            none => 0
        }
    }
}

fn same_impl_dict_bound_set(
    left: List<ImplDictBound>, right: List<ImplDictBound>
) -> Bool {
    if left.len() != right.len() { return false }
    for expected in left {
        let found = right.any(fn(actual) {
            actual.type_param_index == expected.type_param_index &&
                actual.trait_name == expected.trait_name
        })
        if !found { return false }
    }
    true
}

fn push_impl_dict_bound(
    mut bounds: List<ImplDictBound>, type_param_index: Int, trait_name: Str
) {
    let duplicate = bounds.any(fn(bound) {
        bound.type_param_index == type_param_index && bound.trait_name == trait_name
    })
    if !duplicate {
        bounds.push(ImplDictBound {
            type_param_index: type_param_index,
            trait_name: trait_name
        })
    }
}

fn plan_json_bounds_for_user_type(
    env: TypeEnv, ut: UserType,
    candidate_names: Set<Str>, invalid: Set<Str>,
    plans: Map<Str, List<ImplDictBound>>
) -> List<ImplDictBound>? {
    let mut bounds: List<ImplDictBound> = []
    match ut.type_kind {
        TypeKind::StructKind => match ut.struct_def {
            some(def) => {
                for field in def.fields {
                    if !plan_json_evidence_for_type(
                        env, field.ty, def.type_param_vars, "Json",
                        candidate_names, invalid, plans, bounds
                    ) { return none }
                }
            },
            none => return none
        },
        TypeKind::EnumKind => match ut.enum_def {
            some(def) => {
                for variant in def.variants {
                    for field_ty in variant.fields {
                        if !plan_json_evidence_for_type(
                            env, field_ty, def.type_param_vars, "Json",
                            candidate_names, invalid, plans, bounds
                        ) { return none }
                    }
                }
            },
            none => return none
        }
    }
    some(bounds)
}

fn plan_json_evidence_for_type(
    env: TypeEnv, t: Type, owner_type_param_vars: List<Int>, trait_name: Str,
    candidate_names: Set<Str>, invalid: Set<Str>,
    plans: Map<Str, List<ImplDictBound>>, mut bounds: List<ImplDictBound>
) -> Bool {
    match t {
        Type::TypeVar { id, .. } => {
            let param_idx = index_of_int(owner_type_param_vars, id)
            if param_idx < 0 { return false }
            push_impl_dict_bound(bounds, param_idx, "${trait_name}")
            true
        },
        Type::StructType { name, type_params, .. } =>
            plan_json_nominal_evidence(
                env, name, type_params, owner_type_param_vars, trait_name,
                candidate_names, invalid, plans, bounds),
        Type::EnumType { name, type_params, .. } =>
            plan_json_nominal_evidence(
                env, name, type_params, owner_type_param_vars, trait_name,
                candidate_names, invalid, plans, bounds),
        Type::IntType => has_impl(env.trait_reg, "Int", trait_name),
        Type::FloatType => has_impl(env.trait_reg, "Float", trait_name),
        Type::StrType => has_impl(env.trait_reg, "Str", trait_name),
        Type::BoolType => has_impl(env.trait_reg, "Bool", trait_name),
        Type::UnitType => has_impl(env.trait_reg, "Unit", trait_name),
        _ => false
    }
}

fn plan_json_nominal_evidence(
    env: TypeEnv, name: Str, type_args: List<Type>,
    owner_type_param_vars: List<Int>, trait_name: Str,
    candidate_names: Set<Str>, invalid: Set<Str>,
    plans: Map<Str, List<ImplDictBound>>, mut bounds: List<ImplDictBound>
) -> Bool {
    if trait_name == "Json" && candidate_names.contains(name) {
        if invalid.contains(name) { return false }
        let candidate_bounds = match plans.get(name) {
            some(found) => found,
            none => return false
        }
        for candidate_bound in candidate_bounds {
            match type_args.get(candidate_bound.type_param_index) {
                some(type_arg) => {
                    if !plan_json_evidence_for_type(
                        env, type_arg, owner_type_param_vars,
                        candidate_bound.trait_name,
                        candidate_names, invalid, plans, bounds
                    ) { return false }
                },
                none => return false
            }
        }
        return true
    }

    match find_impl(env.trait_reg, name, trait_name) {
        none => false,
        some(impl_entry) => match instantiate_impl_dict_requirements(
            impl_entry, type_args
        ) {
            none => false,
            some(requirements) => {
                for requirement in requirements {
                    if !plan_json_evidence_for_type(
                        env, requirement.type_arg, owner_type_param_vars,
                        requirement.trait_name,
                        candidate_names, invalid, plans, bounds
                    ) { return false }
                }
                true
            }
        }
    }
}

fn json_derived_signature(
    ut: UserType, impl_bounds: List<ImplDictBound>
) -> DerivedImpl? {
    let type_params = match ut.type_kind {
        TypeKind::StructKind => match ut.struct_def {
            some(def) => def.type_params,
            none => return none
        },
        TypeKind::EnumKind => match ut.enum_def {
            some(def) => def.type_params,
            none => return none
        }
    }
    let mut bounds: List<TraitBound> = []
    for impl_bound in impl_bounds {
        match type_params.get(impl_bound.type_param_index) {
            some(type_param) => bounds.push(TraitBound {
                type_param: type_param,
                trait_name: impl_bound.trait_name
            }),
            none => return none
        }
    }
    some(DerivedImpl {
        type_name: ut.name,
        trait_name: "Json",
        type_params: type_params,
        bounds: bounds,
        type_kind: ut.type_kind,
        struct_fields: none,
        enum_variants: none
    })
}

fn derived_impl_dict_bounds(di: DerivedImpl) -> List<ImplDictBound>? {
    let mut result: List<ImplDictBound> = []
    for bound in di.bounds {
        let param_idx = index_of_str(di.type_params, bound.type_param)
        if param_idx < 0 { return none }
        result.push(ImplDictBound {
            type_param_index: param_idx,
            trait_name: bound.trait_name
        })
    }
    some(result)
}

fn derived_impl_with_bounds(
    di: DerivedImpl, bounds: List<TraitBound>
) -> DerivedImpl {
    DerivedImpl {
        type_name: di.type_name,
        trait_name: di.trait_name,
        type_params: di.type_params,
        bounds: bounds,
        type_kind: di.type_kind,
        struct_fields: di.struct_fields,
        enum_variants: di.enum_variants
    }
}

// ================================================================
// Try to derive a trait for a single type
// ================================================================

fn try_derive(env: TypeEnv, ut: UserType, trait_name: Str, known: Set<Str>) -> DerivedImpl? {
    let mut bounds: List<TraitBound> = []

    match ut.type_kind {
        TypeKind::StructKind => match ut.struct_def {
            some(def) => {
                let field_entries = def.fields.map(fn(f) { FieldEntry { name: f.name, ty: f.ty } })
                let fields = try_derive_fields(env, field_entries, def.type_param_vars, def.type_params, trait_name, known, ut.name, bounds)
                match fields {
                    some(fs) => {
                        let derived_fields = fs
                        some(DerivedImpl {
                        type_name: ut.name,
                        trait_name: trait_name,
                        type_params: def.type_params,
                        bounds: bounds,
                        type_kind: TypeKind::StructKind,
                        struct_fields: some(derived_fields),
                        enum_variants: none
                        })
                    },
                    none => none,
                }
            },
            none => none,
        },
        TypeKind::EnumKind => match ut.enum_def {
            some(def) => {
                let mut variants: List<DerivedVariant> = []
                let mut ok = true
                let mut discriminator = 0
                for v in def.variants {
                    if ok {
                        let has_named_fields = match v.field_names {
                            some(fns) => fns.len() > 0,
                            none => false,
                        }
                        let mut field_entries: List<FieldEntry> = []
                        for i in 0..v.fields.len() {
                            let fname = if has_named_fields {
                                match v.field_names {
                                    some(fns) => str_at(fns, i),
                                    none => "_${i}",
                                }
                            } else {
                                "_${i}"
                            }
                            field_entries.push(FieldEntry { name: fname, ty: type_at(v.fields, i) })
                        }
                        let fields = try_derive_fields(env, field_entries, def.type_param_vars, def.type_params, trait_name, known, ut.name, bounds)
                        match fields {
                            some(fs) => {
                                let mut final_fields = fs
                                if has_named_fields == false {
                                    let mut updated: List<DerivedField> = []
                                    for j in 0..fs.len() {
                                        let f = df_at(fs, j)
                                        updated.push(DerivedField { name: f.name, positional_index: some(j), action: f.action })
                                    }
                                    final_fields = updated
                                }
                                variants.push(DerivedVariant {
                                    name: v.name,
                                    discriminator: discriminator,
                                    fields: final_fields,
                                    has_named_fields: has_named_fields
                                })
                            },
                            none => { ok = false },
                        }
                    }
                    discriminator = discriminator + 1
                }
                if ok {
                    some(DerivedImpl {
                        type_name: ut.name,
                        trait_name: trait_name,
                        type_params: def.type_params,
                        bounds: bounds,
                        type_kind: TypeKind::EnumKind,
                        struct_fields: none,
                        enum_variants: some(variants)
                    })
                } else {
                    none
                }
            },
            none => none,
        },
    }
}

// ================================================================
// Try to derive fields
// ================================================================

struct FieldEntry {
    name: Str,
    ty: Type
}

fn try_derive_fields(
    env: TypeEnv,
    fields: List<FieldEntry>,
    type_param_vars: List<Int>,
    type_param_names: List<Str>,
    trait_name: Str,
    known: Set<Str>,
    self_type_name: Str, mut bounds: List<TraitBound>
) -> List<DerivedField>? {
    let mut result: List<DerivedField> = []
    for field in fields {
        let field_trait_name = trait_name
        let action = resolve_field_action(
            env, field.ty, type_param_vars, type_param_names,
            field_trait_name, known, self_type_name, bounds)
        match action {
            some(a) => {
                let field_action = a
                result.push(DerivedField {
                    name: field.name, positional_index: none,
                    action: field_action
                })
            },
            none => { return none },
        }
    }
    some(result)
}

// ================================================================
// Resolve field action
// ================================================================

fn resolve_field_action(
    env: TypeEnv,
    field_type: Type,
    type_param_vars: List<Int>,
    type_param_names: List<Str>,
    trait_name: Str,
    known: Set<Str>,
    self_type_name: Str, mut bounds: List<TraitBound>
) -> FieldAction? {
    // Hash deliberately goes through trait evidence even for primitives.  This
    // keeps derived code aligned with user-visible `hash()` dispatch and makes
    // the supported primitive set explicit instead of inheriting Eq/Ord's
    // Float/Unit identity shortcuts.
    if trait_name == "Hash" {
        return resolve_hash_field_action(
            env, field_type, type_param_vars, type_param_names,
            known, self_type_name, bounds)
    }
    if trait_name == "Json" {
        return resolve_json_field_action(
            env, field_type, type_param_vars, type_param_names, bounds)
    }
    match field_type {
        Type::IntType => some(FieldAction::Identity),
        Type::FloatType => some(FieldAction::FloatIdentity),
        Type::StrType => some(FieldAction::Identity),
        Type::BoolType => some(FieldAction::BoolIdentity),
        Type::UnitType => some(FieldAction::Identity),
        Type::TypeVar { id, .. } => {
            let param_idx = index_of_int(type_param_vars, id)
            if param_idx < 0 { return none }
            let param_name = str_at(type_param_names, param_idx)
            let tested_param_name = param_name
            let tested_trait_name = trait_name
            if has_bound(bounds, tested_param_name, tested_trait_name) == false {
                let bound_param_name = param_name
                let bound_trait_name = trait_name
                bounds.push(TraitBound {
                    type_param: bound_param_name,
                    trait_name: bound_trait_name
                })
            }
            let dict_param_name = param_name
            let dict_trait_name = trait_name
            some(FieldAction::Call {
                dict_name: trait_bound_param_name(
                    dict_param_name, dict_trait_name),
                extra_dicts: []
            })
        },
        Type::StructType { name, type_params, .. } => {
            if name == self_type_name {
                let extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds)
                match extra {
                    some(e) => {
                        let extra_dicts = e
                        some(FieldAction::Call {
                            dict_name: trait_dict_name(name, trait_name),
                            extra_dicts: extra_dicts
                        })
                    },
                    none => none,
                }
            } else {
                if known.contains(name) {
                    let extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds)
                    match extra {
                        some(e) => {
                            let extra_dicts = e
                            some(FieldAction::Call {
                                dict_name: trait_dict_name(name, trait_name),
                                extra_dicts: extra_dicts
                            })
                        },
                        none => none,
                    }
                } else {
                    none
                }
            }
        },
        Type::EnumType { name, type_params, .. } => {
            if name == self_type_name {
                let extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds)
                match extra {
                    some(e) => {
                        let extra_dicts = e
                        some(FieldAction::Call {
                            dict_name: trait_dict_name(name, trait_name),
                            extra_dicts: extra_dicts
                        })
                    },
                    none => none,
                }
            } else {
                if known.contains(name) {
                    let extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds)
                    match extra {
                        some(e) => {
                            let extra_dicts = e
                            some(FieldAction::Call {
                                dict_name: trait_dict_name(name, trait_name),
                                extra_dicts: extra_dicts
                            })
                        },
                        none => none,
                    }
                } else {
                    none
                }
            }
        },
        Type::TupleType { elements } => {
            let mut elem_actions: List<FieldAction> = []
            let mut ok = true
            for elem_ty in elements {
                if ok {
                    let elem_type_param_vars = type_param_vars
                    let elem_type_param_names = type_param_names
                    let elem_trait_name = trait_name
                    let elem_known = known
                    let elem_self_type_name = self_type_name
                    let elem_bounds = bounds
                    let elem_action = resolve_field_action(
                        env, elem_ty, elem_type_param_vars,
                        elem_type_param_names, elem_trait_name, elem_known,
                        elem_self_type_name, elem_bounds)
                    match elem_action {
                        some(a) => {
                            let action = a
                            elem_actions.push(action)
                        },
                        none => { ok = false },
                    }
                }
            }
            if ok {
                some(FieldAction::Tuple { element_actions: elem_actions })
            } else {
                none
            }
        },
        Type::FnType { .. } => {
            if trait_name == "Debug" {
                some(FieldAction::FnLiteral)
            } else {
                none
            }
        },
        Type::ErrorType => some(FieldAction::Identity),
        Type::AnyType => some(FieldAction::Identity),
        Type::NeverType => some(FieldAction::Identity),
        _ => none,
    }
}

fn resolve_json_field_action(
    env: TypeEnv,
    field_type: Type,
    type_param_vars: List<Int>,
    type_param_names: List<Str>,
    mut bounds: List<TraitBound>
) -> FieldAction? {
    match resolve_json_dict_ref(
        env, field_type, type_param_vars, type_param_names, "Json", bounds
    ) {
        some(DictRef::Simple(dict_name)) => some(FieldAction::Call {
            dict_name: dict_name,
            extra_dicts: []
        }),
        some(DictRef::Static(dict_name)) => some(FieldAction::Call {
            dict_name: dict_name,
            extra_dicts: []
        }),
        some(DictRef::Wrapped { dict, inner_dicts, .. }) => some(FieldAction::Call {
            dict_name: dict,
            extra_dicts: inner_dicts
        }),
        none => none
    }
}

// Derive-side counterpart of infer_ctx.resolve_dict_evidence_for_type.  The
// only local policy is how a surrounding derived impl turns a free type var
// into one of its own bounds; nominal requirements are instantiated by the
// shared env helper from the exact ImplEntry.dict_bounds sequence.
fn resolve_json_dict_ref(
    env: TypeEnv, t: Type,
    owner_type_param_vars: List<Int>, owner_type_param_names: List<Str>,
    trait_name: Str, mut bounds: List<TraitBound>
) -> DictRef? {
    match t {
        Type::TypeVar { id, .. } => {
            let param_idx = index_of_int(owner_type_param_vars, id)
            if param_idx < 0 { return none }
            let param_name = str_at(owner_type_param_names, param_idx)
            let dict_param_name = "${param_name}"
            let dict_trait_name = "${trait_name}"
            let dict_name = trait_bound_param_name(
                dict_param_name, dict_trait_name)
            if !has_bound(bounds, param_name, trait_name) {
                bounds.push(TraitBound {
                    type_param: param_name,
                    trait_name: trait_name
                })
            }
            some(DictRef::Simple(dict_name))
        },
        Type::StructType { name, type_params, .. } => {
            resolve_json_nominal_dict_ref(
                env, name, type_params, owner_type_param_vars,
                owner_type_param_names, trait_name, bounds)
        },
        Type::EnumType { name, type_params, .. } => {
            resolve_json_nominal_dict_ref(
                env, name, type_params, owner_type_param_vars,
                owner_type_param_names, trait_name, bounds)
        },
        Type::IntType => resolve_json_builtin_dict_ref(env, "Int", trait_name),
        Type::FloatType => resolve_json_builtin_dict_ref(env, "Float", trait_name),
        Type::StrType => resolve_json_builtin_dict_ref(env, "Str", trait_name),
        Type::BoolType => resolve_json_builtin_dict_ref(env, "Bool", trait_name),
        Type::UnitType => resolve_json_builtin_dict_ref(env, "Unit", trait_name),
        _ => none
    }
}

fn resolve_json_builtin_dict_ref(
    env: TypeEnv, type_name: Str, trait_name: Str
) -> DictRef? {
    if has_impl(env.trait_reg, type_name, trait_name) {
        some(DictRef::Static(trait_dict_name(type_name, trait_name)))
    } else {
        none
    }
}

fn resolve_json_nominal_dict_ref(
    env: TypeEnv, name: Str, type_args: List<Type>,
    owner_type_param_vars: List<Int>, owner_type_param_names: List<Str>,
    trait_name: Str, mut bounds: List<TraitBound>
) -> DictRef? {
    let impl_entry = match find_impl(env.trait_reg, name, trait_name) {
        some(found) => found,
        none => return none
    }
    let requirements = match instantiate_impl_dict_requirements(
        impl_entry, type_args
    ) {
        some(found) => found,
        none => return none
    }
    let dict_name = trait_dict_name(name, trait_name)
    if requirements.len() == 0 {
        return some(DictRef::Static(dict_name))
    }
    let mut inner_dicts: List<DictRef> = []
    for requirement in requirements {
        match resolve_json_dict_ref(
            env, requirement.type_arg, owner_type_param_vars,
            owner_type_param_names, requirement.trait_name, bounds
        ) {
            some(dict_ref) => {
                let inner_dict_ref = dict_ref
                inner_dicts.push(inner_dict_ref)
            },
            none => return none
        }
    }
    some(DictRef::Wrapped {
        dict: dict_name,
        trait_name: trait_name,
        inner_dicts: inner_dicts
    })
}

fn resolve_hash_field_action(
    env: TypeEnv,
    field_type: Type,
    type_param_vars: List<Int>,
    type_param_names: List<Str>,
    known: Set<Str>,
    self_type_name: Str,
    mut bounds: List<TraitBound>
) -> FieldAction? {
    match field_type {
        Type::IntType => some(FieldAction::Call {
            dict_name: trait_dict_name("Int", "Hash"), extra_dicts: []
        }),
        Type::StrType => some(FieldAction::Call {
            dict_name: trait_dict_name("Str", "Hash"), extra_dicts: []
        }),
        Type::BoolType => some(FieldAction::Call {
            dict_name: trait_dict_name("Bool", "Hash"), extra_dicts: []
        }),
        Type::TypeVar { id, .. } => {
            let param_idx = index_of_int(type_param_vars, id)
            if param_idx < 0 { return none }
            let param_name = str_at(type_param_names, param_idx)
            let tested_param_name = param_name
            if has_bound(bounds, tested_param_name, "Hash") == false {
                let bound_param_name = param_name
                bounds.push(TraitBound {
                    type_param: bound_param_name, trait_name: "Hash"
                })
            }
            let dict_param_name = param_name
            some(FieldAction::Call {
                dict_name: trait_bound_param_name(dict_param_name, "Hash"),
                extra_dicts: []
            })
        },
        Type::StructType { name, type_params, .. } => {
            if name != self_type_name && known.contains(name) == false {
                return none
            }
            let extra = resolve_extra_dicts(
                type_params, type_param_vars, type_param_names,
                "Hash", known, self_type_name, bounds)
            match extra {
                some(e) => {
                    let extra_dicts = e
                    some(FieldAction::Call {
                        dict_name: trait_dict_name(name, "Hash"),
                        extra_dicts: extra_dicts
                    })
                },
                none => none,
            }
        },
        Type::EnumType { name, type_params, .. } => {
            if name != self_type_name && known.contains(name) == false {
                return none
            }
            let extra = resolve_extra_dicts(
                type_params, type_param_vars, type_param_names,
                "Hash", known, self_type_name, bounds)
            match extra {
                some(e) => {
                    let extra_dicts = e
                    some(FieldAction::Call {
                        dict_name: trait_dict_name(name, "Hash"),
                        extra_dicts: extra_dicts
                    })
                },
                none => none,
            }
        },
        Type::TupleType { elements } => {
            let mut elem_actions: List<FieldAction> = []
            for elem_ty in elements {
                let elem_type_param_vars = type_param_vars
                let elem_type_param_names = type_param_names
                let elem_known = known
                let elem_self_type_name = self_type_name
                let elem_bounds = bounds
                let elem_action = resolve_hash_field_action(
                    env, elem_ty, elem_type_param_vars,
                    elem_type_param_names, elem_known,
                    elem_self_type_name, elem_bounds)
                match elem_action {
                    some(a) => {
                        let action = a
                        elem_actions.push(action)
                    },
                    none => { return none },
                }
            }
            some(FieldAction::Tuple { element_actions: elem_actions })
        },
        // Hash has no primitive evidence for Float/Unit, and address identity
        // is never a legal structural hash fallback.
        _ => none,
    }
}

// ================================================================
// Resolve extra dicts
// ================================================================

fn resolve_extra_dicts(
    type_args: List<Type>,
    type_param_vars: List<Int>,
    type_param_names: List<Str>,
    trait_name: Str,
    known: Set<Str>,
    self_type_name: Str, mut bounds: List<TraitBound>
) -> List<DictRef>? {
    let mut dicts: List<DictRef> = []
    for arg in type_args {
        let arg_type_param_vars = type_param_vars
        let arg_type_param_names = type_param_names
        let arg_trait_name = trait_name
        let arg_known = known
        let arg_self_type_name = self_type_name
        let arg_bounds = bounds
        let dict = resolve_type_arg_dict(
            arg, arg_type_param_vars, arg_type_param_names,
            arg_trait_name, arg_known, arg_self_type_name, arg_bounds)
        match dict {
            some(d) => {
                let resolved_dict = d
                dicts.push(resolved_dict)
            },
            none => { return none },
        }
    }
    some(dicts)
}

fn resolve_type_arg_dict(
    arg: Type,
    type_param_vars: List<Int>,
    type_param_names: List<Str>,
    trait_name: Str,
    known: Set<Str>,
    self_type_name: Str, mut bounds: List<TraitBound>
) -> DictRef? {
    match arg {
        Type::IntType => some(DictRef::Static(trait_dict_name("Int", trait_name))),
        Type::FloatType => {
            if trait_name == "Hash" {
                none
            } else {
                some(DictRef::Static(trait_dict_name("Float", trait_name)))
            }
        },
        Type::StrType => some(DictRef::Static(trait_dict_name("Str", trait_name))),
        Type::BoolType => some(DictRef::Static(trait_dict_name("Bool", trait_name))),
        Type::UnitType => {
            if trait_name == "Hash" || trait_name == "Json" {
                none
            } else {
                some(DictRef::Static(trait_dict_name("Unit", trait_name)))
            }
        },
        Type::TypeVar { id, .. } => {
            let param_idx = index_of_int(type_param_vars, id)
            if param_idx < 0 { return none }
            let param_name = str_at(type_param_names, param_idx)
            let tested_param_name = param_name
            let tested_trait_name = trait_name
            if has_bound(bounds, tested_param_name, tested_trait_name) == false {
                let bound_param_name = param_name
                let bound_trait_name = trait_name
                bounds.push(TraitBound {
                    type_param: bound_param_name,
                    trait_name: bound_trait_name
                })
            }
            let dict_param_name = param_name
            let dict_trait_name = trait_name
            some(DictRef::Simple(trait_bound_param_name(
                dict_param_name, dict_trait_name)))
        },
        Type::StructType { name, type_params, .. } => {
            if name != self_type_name && known.contains(name) == false {
                return none
            }
            let dict_name = trait_dict_name(name, trait_name)
            if type_params.len() == 0 {
                return some(DictRef::Static(dict_name))
            }
            let nested_trait_name = trait_name
            let wrapped_trait_name = trait_name
            let inner = resolve_extra_dicts(
                type_params, type_param_vars, type_param_names,
                nested_trait_name, known, self_type_name, bounds)
            match inner {
                some(inner_dicts) => {
                    let wrapped_inner_dicts = inner_dicts
                    some(DictRef::Wrapped {
                        dict: dict_name,
                        trait_name: wrapped_trait_name,
                        inner_dicts: wrapped_inner_dicts
                    })
                },
                none => none,
            }
        },
        Type::EnumType { name, type_params, .. } => {
            if name != self_type_name && known.contains(name) == false {
                return none
            }
            let dict_name = trait_dict_name(name, trait_name)
            if type_params.len() == 0 {
                return some(DictRef::Static(dict_name))
            }
            let nested_trait_name = trait_name
            let wrapped_trait_name = trait_name
            let inner = resolve_extra_dicts(
                type_params, type_param_vars, type_param_names,
                nested_trait_name, known, self_type_name, bounds)
            match inner {
                some(inner_dicts) => {
                    let wrapped_inner_dicts = inner_dicts
                    some(DictRef::Wrapped {
                        dict: dict_name,
                        trait_name: wrapped_trait_name,
                        inner_dicts: wrapped_inner_dicts
                    })
                },
                none => none,
            }
        },
        _ => none,
    }
}

// ================================================================
// Register derived impl
// ================================================================

fn register_derived_impl(
    mut env: TypeEnv, sink: CollectingSink,
    di: DerivedImpl, trait_name: Str, span: Span
) {
    let mut methods: Map<Str, TypeScheme> = map_new()

    let mut type_var_ids: List<Int> = []
    let mut self_type_params: List<Type> = []
    for i in 0..di.type_params.len() {
        let var_id = env.fresh_var_id()
        let recorded_var_id = var_id
        let self_var_id = var_id
        type_var_ids.push(recorded_var_id)
        self_type_params.push(Type::TypeVar {
            id: self_var_id, name: none
        })
    }

    let self_type = build_self_type(env, di.type_name, di.type_kind, self_type_params)

    let mut scheme_bounds: List<SchemeBound> = []
    let mut dict_bounds: List<ImplDictBound> = []
    for b in di.bounds {
        let param_idx = index_of_str(di.type_params, b.type_param)
        if param_idx >= 0 {
            scheme_bounds.push(SchemeBound { type_var: int_at(type_var_ids, param_idx), trait_name: b.trait_name, assoc_constraints: [] })
            dict_bounds.push(ImplDictBound { type_param_index: param_idx, trait_name: b.trait_name })
        }
    }

    let method_names = get_method_names(trait_name)
    let registered_trait_name = trait_name
    register_trait_methods(methods, registered_trait_name, self_type,
        type_var_ids, scheme_bounds)

    let mut localized_methods: Map<Str, TypeScheme> = map_new()
    let mut raw_methods = methods.entries()
    raw_methods.sort_by(compare_by_first)
    for entry in raw_methods {
        let (method_name, scheme) = entry
        let localized_method_name = method_name
        let unlocalized_scheme = scheme
        localized_methods.insert(localized_method_name,
            new_local_callable_scheme(
                env, unlocalized_scheme,
                CALLABLE_SOURCE_CONSERVATIVE_INTERFACE))
    }
    methods = localized_methods

    let origin = "<derive>:${di.type_name}:${trait_name}"
    let exact = map_clone(methods)
    let entry_trait_name = trait_name
    let method_origin_trait_name = trait_name
    let entry_origin = origin
    let method_origin = origin
    let entry_span = span
    let method_span = span
    let entry_type_name = di.type_name
    let method_target_type_name = di.type_name

    add_impl(env.trait_reg, ImplEntry {
        trait_name: entry_trait_name,
        target_type_name: entry_type_name,
        type_params: di.type_params,
        dict_bounds: dict_bounds,
        method_names: method_names,
        assoc_types: map_new(),
        method_schemes: exact,
        is_authoritative_drop: false,
        origin: entry_origin,
        span: entry_span
    })

    let mut sorted_methods = methods.entries()
    sorted_methods.sort_by(compare_by_first)
    for entry in sorted_methods {
        let (method_name, scheme) = entry
        let installed_method_name = method_name
        let installed_scheme = scheme
        let installed_target_type_name = method_target_type_name
        let installed_origin = method_origin
        let installed_trait_name = method_origin_trait_name
        let installed_span = method_span
        let _ = install_method_scheme(
            env.trait_reg, sink, installed_target_type_name,
            installed_method_name, installed_scheme,
            MethodOrigin {
                origin: installed_origin,
                trait_name: some(installed_trait_name),
                is_authoritative_drop: false,
                span: installed_span
            })
    }
}

fn get_method_names(trait_name: Str) -> List<Str> {
    match trait_name {
        "Eq" => { let mut r = ["eq"]; r.push("ne"); r },
        "Clone" => ["clone"],
        "Debug" => ["debug"],
        "Ord" => ["cmp"],
        "Hash" => ["hash"],
        "Json" => ["to_json"],
        _ => [],
    }
}

fn build_self_type(env: TypeEnv, type_name: Str, type_kind: TypeKind, type_params: List<Type>) -> Type {
    match type_kind {
        TypeKind::StructKind => Type::StructType { name: type_name, type_params: type_params },
        TypeKind::EnumKind => Type::EnumType { name: type_name, type_params: type_params },
    }
}

fn register_trait_methods(
    mut methods: Map<Str, TypeScheme>,
    trait_name: Str,
    self_type: Type,
    type_var_ids: List<Int>,
    bounds: List<SchemeBound>
) {
    match trait_name {
        "Eq" => {
            let eq_left = self_type
            let eq_right = self_type
            let ne_left = self_type
            let ne_right = self_type
            let eq_type_var_ids = type_var_ids
            let ne_type_var_ids = type_var_ids
            let eq_bounds = bounds
            let ne_bounds = bounds
            let eq_fn = Type::FnType {
                params: [eq_left, eq_right], return_type: BOOL,
                meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED)
            }
            methods.insert("eq", TypeScheme {
                ty: eq_fn, type_vars: eq_type_var_ids,
                bounds: eq_bounds, def_id: none
            })
            let ne_fn = Type::FnType {
                params: [ne_left, ne_right], return_type: BOOL,
                meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED)
            }
            methods.insert("ne", TypeScheme {
                ty: ne_fn, type_vars: ne_type_var_ids,
                bounds: ne_bounds, def_id: none
            })
        },
        "Clone" => {
            let clone_param_type = self_type
            let clone_return_type = self_type
            let clone_fn = Type::FnType {
                params: [clone_param_type],
                return_type: clone_return_type,
                meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED)
            }
            methods.insert("clone", TypeScheme { ty: clone_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
        },
        "Ord" => {
            let cmp_left = self_type
            let cmp_right = self_type
            let cmp_fn = Type::FnType {
                params: [cmp_left, cmp_right], return_type: INT,
                meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED)
            }
            methods.insert("cmp", TypeScheme { ty: cmp_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
        },
        "Debug" => {
            let debug_fn = Type::FnType { params: [self_type], return_type: STR, meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED) }
            methods.insert("debug", TypeScheme { ty: debug_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
        },
        "Hash" => {
            let hash_fn = Type::FnType { params: [self_type], return_type: INT, meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED) }
            methods.insert("hash", TypeScheme { ty: hash_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
        },
        "Json" => {
            let json_fn = Type::FnType {
                params: [self_type], return_type: STR,
                meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED)
            }
            methods.insert("to_json", TypeScheme { ty: json_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
        },
        _ => {},
    }
}

// ================================================================
// Helpers
// ================================================================

fn index_of_int(list: List<Int>, target: Int) -> Int {
    for i in 0..list.len() {
        if int_at(list, i) == target { return i }
    }
    0 - 1
}

fn index_of_str(list: List<Str>, target: Str) -> Int {
    for i in 0..list.len() {
        if str_at(list, i) == target { return i }
    }
    0 - 1
}

fn has_bound(bounds: List<TraitBound>, type_param: Str, trait_name: Str) -> Bool {
    for b in bounds {
        if b.type_param == type_param {
            if b.trait_name == trait_name {
                return true
            }
        }
    }
    false
}

