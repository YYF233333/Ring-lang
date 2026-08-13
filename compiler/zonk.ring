use types::{Type, Effect, EffectRow, StructField, RecordField,
    OwnershipMetadata, type_to_string, fn_meta,
    resolve_callable_ownership_type, freeze_callable_ownership_type,
    resolve_callable_ownership_row, freeze_callable_ownership_row}
use ast::{Pattern, Span}
use hir::{HExpr, HStmt, HParam, HMatchArm, HEffectHandler,
    HStructFieldInit, HStringInterpPart, HForInDestructure,
    HLetDestructureBinding, HPatternBinding, ValueBindingKind, TraitDispatch,
    hexpr_type, hexpr_effects, hexpr_span, hexpr_callable_def_id}
use union_find::{UnionFind, new_union_find}
use env::{apply_subst, apply_subst_row}
use infer_ctx::{InferCtx, value_binding_kind}
use infer_helpers::{resolve_value_ident}

pub struct ZonkCtx {
    pub subst: UnionFind,
    pub names: Map<Int, Str>,
    // Present for checker-owned zonks.  Keeping it optional preserves zonk's
    // pure type-substitution use sites while allowing fully-unified function
    // VALUE identifiers to resolve their complete DictRef evidence once.
    pub dict_resolver: InferCtx?,
    pub ownership_metadata: OwnershipMetadata?,
    pub require_exact_ownership: Bool
}

pub fn zonk_type(ctx: ZonkCtx, t: Type) -> Type {
    let resolved = apply_subst(ctx.subst, t)
    let labelled = label_vars(ctx.names, resolved)
    match ctx.ownership_metadata {
        some(metadata) => if ctx.require_exact_ownership {
            freeze_callable_ownership_type(metadata, labelled)
        } else {
            resolve_callable_ownership_type(metadata, labelled)
        },
        none => labelled
    }
}

pub fn freeze_ownership_expr(
    metadata: OwnershipMetadata, expr: HExpr
) -> HExpr {
    zonk_expr(ZonkCtx {
        subst: new_union_find(), names: map_new(), dict_resolver: none,
        ownership_metadata: some(metadata), require_exact_ownership: true
    }, expr)
}

fn label_effect(names: Map<Int, Str>, e: Effect) -> Effect {
    match e {
        Effect::FailEffect { error_type } => {
            let error_type_for_label = error_type
            Effect::FailEffect {
                error_type: label_vars(names, error_type_for_label)
            }
        },
        Effect::MutEffect { state_type } => {
            let state_type_for_label = state_type
            Effect::MutEffect {
                state_type: label_vars(names, state_type_for_label)
            }
        },
        Effect::CustomEffect { name, type_args } => {
            let result_name = name
            Effect::CustomEffect {
                name: result_name,
                type_args: type_args.map(fn(a) {
                    let type_arg_for_label = a
                    label_vars(names, type_arg_for_label)
                })
            }
        },
        Effect::IoEffect => e,
        Effect::UnsafeEffect => e,
    }
}

fn label_effect_row(names: Map<Int, Str>, row: EffectRow) -> EffectRow {
    EffectRow {
        effects: row.effects.map(fn(e) {
            let effect_for_label = e
            label_effect(names, effect_for_label)
        }),
        tail: row.tail
    }
}

fn label_vars(names: Map<Int, Str>, t: Type) -> Type {
    match t {
        Type::TypeVar { id, name } => {
            match names.get(id) {
                some(n) => {
                    let result_name = n
                    Type::TypeVar { id: id, name: some(result_name) }
                },
                none => t,
            }
        },
        Type::FnType { params, return_type, meta } => {
            let return_type_for_label = return_type
            Type::FnType {
                params: params.map(fn(p) {
                    let param_for_label = p
                    label_vars(names, param_for_label)
                }),
                return_type: label_vars(names, return_type_for_label),
                meta: fn_meta(
                    label_effect_row(names, meta.effects), meta.ownership_term)
            }
        },
        Type::StructType { name, type_params } => {
            let result_name = name
            Type::StructType {
                name: result_name,
                type_params: type_params.map(fn(p) {
                    let type_param_for_label = p
                    label_vars(names, type_param_for_label)
                })
            }
        },
        Type::EnumType { name, type_params } => {
            let result_name = name
            Type::EnumType {
                name: result_name,
                type_params: type_params.map(fn(p) {
                    let type_param_for_label = p
                    label_vars(names, type_param_for_label)
                })
            }
        },
        Type::GenericType { base, args } => {
            let base_for_label = base
            Type::GenericType {
                base: label_vars(names, base_for_label),
                args: args.map(fn(a) {
                    let arg_for_label = a
                    label_vars(names, arg_for_label)
                })
            }
        },
        Type::RecordType { fields, tail, tail_name } => {
            let new_tail_name = match tail {
                some(t_id) => match names.get(t_id) {
                    some(n) => {
                        let result_tail_name = n
                        some(result_tail_name)
                    },
                    none => tail_name,
                },
                none => tail_name,
            }
            let result_tail = tail
            Type::RecordType {
                fields: fields.map(fn(f) { RecordField { name: f.name, ty: label_vars(names, f.ty) } }),
                tail: result_tail,
                tail_name: new_tail_name
            }
        },
        Type::EffectRowType { effects, tail } => {
            let result_tail = tail
            Type::EffectRowType {
                effects: effects.map(fn(e) {
                    let effect_for_label = e
                    label_effect(names, effect_for_label)
                }),
                tail: result_tail
            }
        },
        Type::TupleType { elements } =>
            Type::TupleType { elements: elements.map(fn(e) {
                let element_for_label = e
                label_vars(names, element_for_label)
            }) },
        Type::PtrType { pointee } => {
            let pointee_for_label = pointee
            Type::PtrType { pointee: label_vars(names, pointee_for_label) }
        },
        Type::IntType => t,
        Type::FloatType => t,
        Type::StrType => t,
        Type::BoolType => t,
        Type::UnitType => t,
        Type::NeverType => t,
        Type::AnyType => t,
        Type::ErrorType => t,
    }
}

pub fn zonk_row(ctx: ZonkCtx, r: EffectRow) -> EffectRow {
    let resolved = apply_subst_row(ctx.subst, r)
    match ctx.ownership_metadata {
        some(metadata) => if ctx.require_exact_ownership {
            freeze_callable_ownership_row(metadata, resolved)
        } else {
            resolve_callable_ownership_row(metadata, resolved)
        },
        none => resolved
    }
}

pub fn zonk_param(ctx: ZonkCtx, p: HParam) -> HParam {
    HParam {
        name: p.name, ty: zonk_type(ctx, p.ty), def_id: p.def_id,
        flags: p.flags
    }
}

fn zonk_dispatch(ctx: ZonkCtx, dispatch: TraitDispatch?) -> TraitDispatch? {
    match dispatch {
        some(TraitDispatch::Tuple { element_types, elements }) => {
            let mut zonked_types: List<Type> = []
            let mut zonked_elements: List<TraitDispatch> = []
            for element_type in element_types {
                zonked_types.push(zonk_type(ctx, element_type))
            }
            for element in elements {
                let element_for_zonk = element
                match zonk_dispatch(ctx, some(element_for_zonk)) {
                    some(zonked) => {
                        let zonked_element = zonked
                        zonked_elements.push(zonked_element)
                    },
                    none => panic("zonk: tuple dispatch element disappeared"),
                }
            }
            some(TraitDispatch::Tuple {
                element_types: zonked_types,
                elements: zonked_elements
            })
        },
        _ => dispatch,
    }
}

pub fn zonk_block(ctx: ZonkCtx, block: HExpr) -> HExpr {
    match block {
        HExpr::Block { stmts, tail, ty, effects, span } => {
            let z_stmts = stmts.map(fn(s) {
                let stmt_for_zonk = s
                zonk_stmt(ctx, stmt_for_zonk)
            })
            let z_tail = match tail {
                some(t) => some(zonk_expr(ctx, t)),
                none => none,
            }
            let result_span = span
            HExpr::Block {
                stmts: z_stmts,
                tail: z_tail,
                ty: zonk_type(ctx, ty),
                effects: zonk_row(ctx, effects),
                span: result_span
            }
        },
        _ => zonk_expr(ctx, block),
    }
}

fn zonk_stmt(ctx: ZonkCtx, stmt: HStmt) -> HStmt {
    match stmt {
        HStmt::Let { name, name_span, def_id, ty, init, span } => {
            let result_name = name
            let result_name_span = name_span
            let result_def_id = def_id
            let result_span = span
            HStmt::Let {
                name: result_name,
                name_span: result_name_span,
                def_id: result_def_id,
                ty: zonk_type(ctx, ty),
                init: zonk_expr(ctx, init),
                span: result_span
            }
        },
        HStmt::Var { name, name_span, def_id, ty, init, span } => {
            let result_name = name
            let result_name_span = name_span
            let result_def_id = def_id
            let result_span = span
            HStmt::Var {
                name: result_name,
                name_span: result_name_span,
                def_id: result_def_id,
                ty: zonk_type(ctx, ty),
                init: zonk_expr(ctx, init),
                span: result_span
            }
        },
        HStmt::Assign { target, value, span } => {
            let result_span = span
            HStmt::Assign {
                target: zonk_expr(ctx, target),
                value: zonk_expr(ctx, value),
                span: result_span
            }
        },
        HStmt::ExprStmt { expr, span } => {
            let result_span = span
            HStmt::ExprStmt {
                expr: zonk_expr(ctx, expr), span: result_span
            }
        },
        HStmt::Return { value, span } => {
            let z_val = match value {
                some(v) => some(zonk_expr(ctx, v)),
                none => none,
            }
            let result_span = span
            HStmt::Return { value: z_val, span: result_span }
        },
        HStmt::While { condition, body, span } => {
            let result_span = span
            HStmt::While {
                condition: zonk_expr(ctx, condition),
                body: zonk_block(ctx, body),
                span: result_span
            }
        },
        HStmt::ForIn { binding, binding_span, def_id, destructure, iterable, body, iterable_type_name, iter_type_name, span } => {
            let result_binding = binding
            let result_binding_span = binding_span
            let result_def_id = def_id
            let result_destructure = destructure
            let result_iterable_type_name = iterable_type_name
            let result_iter_type_name = iter_type_name
            let result_span = span
            HStmt::ForIn {
                binding: result_binding,
                binding_span: result_binding_span,
                def_id: result_def_id,
                destructure: result_destructure,
                iterable: zonk_expr(ctx, iterable),
                body: zonk_block(ctx, body),
                iterable_type_name: result_iterable_type_name,
                iter_type_name: result_iter_type_name,
                span: result_span
            }
        },
        HStmt::Break { span } => stmt,
        HStmt::Continue { span } => stmt,
        HStmt::LetDestructure { pattern, bindings, init, span } => {
            let z_bindings = bindings.map(fn(b) {
                HLetDestructureBinding { name: b.name, def_id: b.def_id, ty: zonk_type(ctx, b.ty) }
            })
            let result_pattern = pattern
            let result_span = span
            HStmt::LetDestructure {
                pattern: result_pattern,
                bindings: z_bindings,
                init: zonk_expr(ctx, init),
                span: result_span
            }
        },
        HStmt::IfLet { pattern, bindings, expr, then_block, else_block, span } => {
            let z_else = match else_block {
                some(eb) => some(zonk_block(ctx, eb)),
                none => none,
            }
            let result_pattern = pattern
            let result_span = span
            HStmt::IfLet { pattern: result_pattern,
                bindings: bindings.map(fn(b) { HPatternBinding {
                    name: b.name, def_id: b.def_id,
                    ty: zonk_type(ctx, b.ty) } }),
                expr: zonk_expr(ctx, expr),
                then_block: zonk_block(ctx, then_block),
                else_block: z_else, span: result_span }
        },
        HStmt::Drop { name, def_id, ty, span } => {
            let result_name = name
            let result_span = span
            HStmt::Drop { name: result_name, def_id: def_id,
                ty: zonk_type(ctx, ty), span: result_span }
        }
    }
}

pub fn zonk_expr(ctx: ZonkCtx, expr: HExpr) -> HExpr {
    let z_ty = zonk_type(ctx, hexpr_type(expr))
    let z_eff = zonk_row(ctx, hexpr_effects(expr))
    let z_span = hexpr_span(expr)

    match expr {
        HExpr::IntLit { value, .. } =>
            HExpr::IntLit { value: value, ty: z_ty, effects: z_eff, span: z_span },
        HExpr::FloatLit { value, .. } =>
            HExpr::FloatLit { value: value, ty: z_ty, effects: z_eff, span: z_span },
        HExpr::StrLit { value, .. } => {
            let result_value = value
            HExpr::StrLit {
                value: result_value, ty: z_ty,
                effects: z_eff, span: z_span
            }
        },
        HExpr::BoolLit { value, .. } =>
            HExpr::BoolLit { value: value, ty: z_ty, effects: z_eff, span: z_span },
        HExpr::Ident { name, resolved_name, def_id, dict_closure_dicts, .. } => {
            let ident_name = name
            let ident_resolved_name = resolved_name
            let ident_def_id = def_id
            let ident_dict_closure_dicts = dict_closure_dicts
            let ident = HExpr::Ident {
                name: ident_name,
                resolved_name: ident_resolved_name,
                def_id: ident_def_id,
                dict_closure_dicts: ident_dict_closure_dicts,
                ty: z_ty, effects: z_eff, span: z_span
            }
            match ctx.dict_resolver {
                some(resolver) => resolve_value_ident(
                    resolver, ident, ctx.subst),
                none => ident,
            }
        },
        // B-104 D4: synthesised by dict_lower AFTER checking/zonking — never
        // seen here; ty is already concrete (TupleType{[]}).  Pass through.
        HExpr::DictConstruct { base_dict, trait_name, inner, .. } => {
            let result_base_dict = base_dict
            let result_trait_name = trait_name
            let result_inner = inner
            HExpr::DictConstruct {
                base_dict: result_base_dict,
                trait_name: result_trait_name,
                inner: result_inner,
                ty: z_ty, effects: z_eff, span: z_span
            }
        },
        HExpr::BinOp { op, left, right, eq_dispatch, ord_dispatch, .. } => {
            let result_op = op
            let eq_dispatch_for_zonk = eq_dispatch
            let ord_dispatch_for_zonk = ord_dispatch
            HExpr::BinOp {
                op: result_op,
                left: zonk_expr(ctx, left),
                right: zonk_expr(ctx, right),
                eq_dispatch: zonk_dispatch(ctx, eq_dispatch_for_zonk),
                ord_dispatch: zonk_dispatch(ctx, ord_dispatch_for_zonk),
                ty: z_ty, effects: z_eff, span: z_span
            }
        },
        HExpr::UnaryOp { op, operand, .. } => {
            let result_op = op
            HExpr::UnaryOp {
                op: result_op,
                operand: zonk_expr(ctx, operand),
                ty: z_ty, effects: z_eff, span: z_span
            }
        },
        HExpr::Call { callee, callee_def_id, callable_result_def_id, args, type_args, resolved_dicts, dict_dispatch, .. } => {
            let zonked_callee = zonk_direct_callee(ctx, callee)
            // A ConstGetter Ident lowers here to an inner zero-argument Call.
            // The outer source call must invoke that result identity, not the
            // getter's Borrow/arity-0 DefId. Other direct callees retain the
            // inference-selected identity as a fail-closed fallback.
            let result_callee_def_id = match hexpr_callable_def_id(
                    zonked_callee) {
                some(def_id) => some(def_id),
                none => callee_def_id
            }
            let result_callable_result_def_id = callable_result_def_id
            let result_resolved_dicts = resolved_dicts
            let result_dict_dispatch = dict_dispatch
            HExpr::Call {
                // A syntactic Ident callee uses the direct ABI and gets its
                // evidence from Call.resolved_dicts.  Every other recursive
                // position is a value position and must form a real closure.
                callee: zonked_callee,
                callee_def_id: result_callee_def_id,
                callable_result_def_id: result_callable_result_def_id,
                args: args.map(fn(a) { zonk_expr(ctx, a) }),
                type_args: type_args.map(fn(t) { zonk_type(ctx, t) }),
                resolved_dicts: result_resolved_dicts,
                dict_dispatch: result_dict_dispatch,
                ty: z_ty, effects: z_eff, span: z_span
            }
        },
        HExpr::FieldAccess { receiver, field, .. } => {
            let result_field = field
            HExpr::FieldAccess {
                receiver: zonk_expr(ctx, receiver),
                field: result_field,
                ty: z_ty, effects: z_eff, span: z_span
            }
        },
        HExpr::StructLit { name, type_args, fields, spread, .. } => {
            let z_spread = match spread {
                some(s) => some(zonk_expr(ctx, s)),
                none => none,
            }
            let result_name = name
            HExpr::StructLit {
                name: result_name,
                type_args: type_args.map(fn(t) { zonk_type(ctx, t) }),
                fields: fields.map(fn(f) { HStructFieldInit { name: f.name, value: zonk_expr(ctx, f.value) } }),
                spread: z_spread,
                ty: z_ty, effects: z_eff, span: z_span
            }
        },
        HExpr::NamedVariantConstruct { enum_name, variant_name, fields, spread, .. } => {
            let z_spread = match spread {
                some(s) => some(zonk_expr(ctx, s)),
                none => none,
            }
            let result_enum_name = enum_name
            let result_variant_name = variant_name
            HExpr::NamedVariantConstruct {
                enum_name: result_enum_name,
                variant_name: result_variant_name,
                fields: fields.map(fn(f) { HStructFieldInit { name: f.name, value: zonk_expr(ctx, f.value) } }),
                spread: z_spread,
                ty: z_ty, effects: z_eff, span: z_span
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } =>
            HExpr::MatchExpr {
                scrutinee: zonk_expr(ctx, scrutinee),
                arms: arms.map(fn(a) {
                    let z_guard = match a.guard {
                        some(g) => some(zonk_expr(ctx, g)),
                        none => none,
                    }
                    HMatchArm { pattern: a.pattern,
                        bindings: a.bindings.map(fn(b) { HPatternBinding {
                            name: b.name, def_id: b.def_id,
                            ty: zonk_type(ctx, b.ty) } }),
                        guard: z_guard, body: zonk_expr(ctx, a.body),
                        span: a.span }
                }),
                ty: z_ty, effects: z_eff, span: z_span
            },
        HExpr::Block { stmts, tail, .. } => {
            let z_tail = match tail {
                some(t) => some(zonk_expr(ctx, t)),
                none => none,
            }
            HExpr::Block {
                stmts: stmts.map(fn(s) {
                    let stmt_for_zonk = s
                    zonk_stmt(ctx, stmt_for_zonk)
                }),
                tail: z_tail,
                ty: z_ty, effects: z_eff, span: z_span
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            let z_else = match else_branch {
                some(eb) => some(zonk_expr(ctx, eb)),
                none => none,
            }
            HExpr::IfExpr {
                condition: zonk_expr(ctx, condition),
                then_branch: zonk_block(ctx, then_branch),
                else_branch: z_else,
                ty: z_ty, effects: z_eff, span: z_span
            }
        },
        HExpr::StringInterp { parts, .. } => {
            let mut z_parts: List<HStringInterpPart> = []
            for p in parts {
                match p {
                    HStringInterpPart::Literal(s) => {
                        let literal_text = s
                        let literal_part = HStringInterpPart::Literal(
                            literal_text)
                        z_parts.push(literal_part)
                    },
                    HStringInterpPart::Expression(e) => {
                        let expression_for_zonk = e
                        let zonked_expression = zonk_expr(
                            ctx, expression_for_zonk)
                        let expression_part = HStringInterpPart::Expression(
                            zonked_expression)
                        z_parts.push(expression_part)
                    }
                }
            }
            HExpr::StringInterp {
                parts: z_parts,
                ty: z_ty, effects: z_eff, span: z_span
            }
        },
        HExpr::TryCatch { body, arms, .. } =>
            HExpr::TryCatch {
                body: zonk_expr(ctx, body),
                arms: arms.map(fn(a) {
                    HMatchArm {
                        pattern: a.pattern,
                        bindings: a.bindings.map(fn(b) { HPatternBinding {
                            name: b.name, def_id: b.def_id,
                            ty: zonk_type(ctx, b.ty) } }),
                        guard: match a.guard {
                            some(g) => some(zonk_expr(ctx, g)),
                            none => none
                        },
                        body: zonk_expr(ctx, a.body),
                        span: a.span
                    }
                }),
                ty: z_ty, effects: z_eff, span: z_span
            },
        HExpr::HandleExpr { body, handlers, .. } =>
            HExpr::HandleExpr {
                body: zonk_expr(ctx, body),
                handlers: handlers.map(fn(h) {
                    HEffectHandler {
                        effect_name: h.effect_name, op_name: h.op_name,
                        is_abortive: h.is_abortive,
                        params: h.params.map(fn(p) { zonk_param(ctx, p) }),
                        resume_binding: match h.resume_binding {
                            some(binding) => some(HPatternBinding {
                                name: binding.name,
                                def_id: binding.def_id,
                                ty: zonk_type(ctx, binding.ty)
                            }),
                            none => none
                        },
                        body: zonk_expr(ctx, h.body)
                    }
                }),
                ty: z_ty, effects: z_eff, span: z_span
            },
        HExpr::Lambda { def_id, params, return_type, body, .. } =>
            HExpr::Lambda {
                def_id: def_id,
                params: params.map(fn(p) { zonk_param(ctx, p) }),
                return_type: zonk_type(ctx, return_type),
                body: zonk_expr(ctx, body),
                ty: z_ty, effects: z_eff, span: z_span
            },
        HExpr::EffectOp { effect_name, op_name, is_abortive, args, .. } => {
            let result_effect_name = effect_name
            let result_op_name = op_name
            HExpr::EffectOp {
                effect_name: result_effect_name,
                op_name: result_op_name,
                is_abortive: is_abortive,
                args: args.map(fn(a) { zonk_expr(ctx, a) }),
                ty: z_ty, effects: z_eff, span: z_span
            }
        },
        HExpr::RangeExpr { start, end, inclusive, .. } =>
            HExpr::RangeExpr { start: zonk_expr(ctx, start), end: zonk_expr(ctx, end), inclusive: inclusive, ty: z_ty, effects: z_eff, span: z_span },
        HExpr::ListLit { elements, .. } =>
            HExpr::ListLit { elements: elements.map(fn(e) { zonk_expr(ctx, e) }), ty: z_ty, effects: z_eff, span: z_span },
        HExpr::TupleLit { elements, .. } =>
            HExpr::TupleLit { elements: elements.map(fn(e) { zonk_expr(ctx, e) }), ty: z_ty, effects: z_eff, span: z_span },
        HExpr::IndexExpr { receiver, index, .. } =>
            HExpr::IndexExpr { receiver: zonk_expr(ctx, receiver), index: zonk_expr(ctx, index), ty: z_ty, effects: z_eff, span: z_span },
        // B-098: Clone is inserted by the Perceus pass (post-zonk), so it never
        // reaches zonk in practice; the arm exists only for match exhaustiveness.
        HExpr::Clone { inner, .. } =>
            HExpr::Clone { inner: zonk_expr(ctx, inner), ty: z_ty, effects: z_eff, span: z_span },
        // Take is inserted after zonk; retain exact DefId if a future caller
        // deliberately re-zonks planned HIR.
        HExpr::Take { name, source_def_id, .. } => {
            let result_name = name
            HExpr::Take { name: result_name, source_def_id: source_def_id,
                ty: z_ty, effects: z_eff, span: z_span }
        },
        // B-113: return in expression position (match arm)
        HExpr::ReturnExpr { value, .. } => match value {
            some(v) => HExpr::ReturnExpr { value: some(zonk_expr(ctx, v)), ty: z_ty, effects: z_eff, span: z_span },
            none => HExpr::ReturnExpr { value: none, ty: z_ty, effects: z_eff, span: z_span },
        },
        // B-125: unsafe block — zonk the body
        HExpr::UnsafeBlock { body, .. } =>
            HExpr::UnsafeBlock { body: zonk_expr(ctx, body), ty: z_ty, effects: z_eff, span: z_span },
    }
}

fn zonk_direct_callee(ctx: ZonkCtx, callee: HExpr) -> HExpr {
    match callee {
        HExpr::Ident { name, resolved_name, def_id, dict_closure_dicts, .. } => {
            let z_ty = zonk_type(ctx, hexpr_type(callee))
            let z_eff = zonk_row(ctx, hexpr_effects(callee))
            let z_span = hexpr_span(callee)
            let ident_name = name
            let ident_resolved_name = resolved_name
            let ident_def_id = def_id
            let ident_dict_closure_dicts = dict_closure_dicts
            let ident = HExpr::Ident {
                name: ident_name,
                resolved_name: ident_resolved_name,
                def_id: ident_def_id,
                dict_closure_dicts: ident_dict_closure_dicts,
                ty: z_ty, effects: z_eff, span: z_span
            }
            match ctx.dict_resolver {
                some(resolver) => {
                    match value_binding_kind(resolver, def_id) {
                        ValueBindingKind::ConstGetter =>
                            resolve_value_ident(resolver, ident, ctx.subst),
                        _ => ident
                    }
                },
                none => ident
            }
        },
        _ => zonk_expr(ctx, callee),
    }
}

