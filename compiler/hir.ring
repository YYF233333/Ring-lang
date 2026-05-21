use ast::{Span, Pattern, BinOp, UnaryOp, TypeParam}
use types::{Type, EffectRow}

pub use types::{BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL,
    BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET,
    BUILTIN_OPTION, BUILTIN_CELL}

pub use builtin_methods::{CELL_METHODS, STR_METHODS, INT_METHODS, FLOAT_METHODS,
    LIST_NON_HOF_METHODS, LIST_HOF_METHODS,
    MAP_NON_HOF_METHODS, MAP_HOF_METHODS,
    SET_NON_HOF_METHODS, SET_HOF_METHODS,
    OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS}

pub struct HParam {
    pub name: Str,
    pub ty: Type,
    pub def_id: Int?,
    pub is_mutable: Bool
}

pub enum TraitDispatch {
    Builtin,
    Direct { dict: Str, extra_dicts: List<Str> },
    Dict { param: Str }
}

pub struct DictDispatchInfo {
    pub dict_param: Str,
    pub method: Str
}

pub struct HStructFieldInit {
    pub name: Str,
    pub value: HExpr
}

pub struct HMatchArm {
    pub pattern: Pattern,
    pub guard: HExpr?,
    pub body: HExpr,
    pub span: Span
}

pub struct HEffectHandler {
    pub effect_name: Str,
    pub op_name: Str,
    pub params: List<HParam>,
    pub resume_name: Str?,
    pub body: HExpr
}

pub enum HStringInterpPart {
    Literal(Str),
    Expression(HExpr)
}

pub enum HExpr {
    IntLit { value: Int, ty: Type, effects: EffectRow, span: Span },
    FloatLit { value: Float, ty: Type, effects: EffectRow, span: Span },
    StrLit { value: Str, ty: Type, effects: EffectRow, span: Span },
    BoolLit { value: Bool, ty: Type, effects: EffectRow, span: Span },
    Ident { name: Str, resolved_name: Str?, def_id: Int?, dict_closure_dicts: List<Str>?, ty: Type, effects: EffectRow, span: Span },
    BinOp { op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?, ord_dispatch: TraitDispatch?, ty: Type, effects: EffectRow, span: Span },
    UnaryOp { op: UnaryOp, operand: HExpr, ty: Type, effects: EffectRow, span: Span },
    Call { callee: HExpr, args: List<HExpr>, type_args: List<Type>, resolved_dicts: List<Str>, dict_dispatch: DictDispatchInfo?, ty: Type, effects: EffectRow, span: Span },
    FieldAccess { receiver: HExpr, field: Str, ty: Type, effects: EffectRow, span: Span },
    StructLit { name: Str, type_args: List<Type>, fields: List<HStructFieldInit>, spread: HExpr?, ty: Type, effects: EffectRow, span: Span },
    NamedVariantConstruct { enum_name: Str, variant_name: Str, fields: List<HStructFieldInit>, spread: HExpr?, ty: Type, effects: EffectRow, span: Span },
    MatchExpr { scrutinee: HExpr, arms: List<HMatchArm>, ty: Type, effects: EffectRow, span: Span },
    Block { stmts: List<HStmt>, tail: HExpr?, ty: Type, effects: EffectRow, span: Span },
    IfExpr { condition: HExpr, then_branch: HExpr, else_branch: HExpr?, ty: Type, effects: EffectRow, span: Span },
    StringInterp { parts: List<HStringInterpPart>, ty: Type, effects: EffectRow, span: Span },
    TryCatch { body: HExpr, error_binding: Str?, error_type: Str?, handler: HExpr, ty: Type, effects: EffectRow, span: Span },
    HandleExpr { body: HExpr, handlers: List<HEffectHandler>, ty: Type, effects: EffectRow, span: Span },
    Lambda { params: List<HParam>, return_type: Type, body: HExpr, ty: Type, effects: EffectRow, span: Span },
    EffectOp { effect_name: Str, op_name: Str, args: List<HExpr>, ty: Type, effects: EffectRow, span: Span },
    OptionUnwrap { expr: HExpr, ty: Type, effects: EffectRow, span: Span },
    TryBlock { body: HExpr, ty: Type, effects: EffectRow, span: Span },
    OptionOr { expr: HExpr, default_value: HExpr, ty: Type, effects: EffectRow, span: Span },
    RangeExpr { start: HExpr, end: HExpr, inclusive: Bool, ty: Type, effects: EffectRow, span: Span },
    ListLit { elements: List<HExpr>, ty: Type, effects: EffectRow, span: Span },
    TupleLit { elements: List<HExpr>, ty: Type, effects: EffectRow, span: Span }
}

pub struct HForInDestructure {
    pub name: Str,
    pub def_id: Int?
}

pub struct HLetDestructureBinding {
    pub name: Str,
    pub def_id: Int?,
    pub ty: Type
}

pub enum HStmt {
    Let { name: Str, name_span: Span, def_id: Int?, ty: Type, init: HExpr, span: Span },
    Var { name: Str, name_span: Span, def_id: Int?, ty: Type, init: HExpr, span: Span },
    Assign { target: HExpr, value: HExpr, span: Span },
    ExprStmt { expr: HExpr, span: Span },
    Return { value: HExpr?, span: Span },
    While { condition: HExpr, body: HExpr, span: Span },
    ForIn { binding: Str, binding_span: Span, def_id: Int?, destructure: List<HForInDestructure>?, iterable: HExpr, body: HExpr, span: Span },
    Break { span: Span },
    Continue { span: Span },
    LetDestructure { pattern: Pattern, bindings: List<HLetDestructureBinding>, init: HExpr, span: Span },
    IfLet { pattern: Pattern, expr: HExpr, then_block: HExpr, else_block: HExpr?, span: Span }
}

pub struct HStructField {
    pub name: Str,
    pub ty: Type,
    pub is_pub: Bool
}

pub struct HEnumVariant {
    pub name: Str,
    pub fields: List<Type>,
    pub field_names: List<Str>?
}

pub struct HEffectOp {
    pub name: Str,
    pub params: List<HParam>,
    pub return_type: Type
}

pub struct HTraitMethod {
    pub name: Str,
    pub params: List<HParam>,
    pub return_type: Type,
    pub has_default: Bool,
    pub body: HExpr?
}

pub struct TraitBound {
    pub type_param: Str,
    pub trait_name: Str
}

pub enum HDecl {
    Fn { name: Str, def_id: Int?, type_params: List<TypeParam>, params: List<HParam>, return_type: Type, effects: EffectRow, body: HExpr, is_pub: Bool, trait_bounds: List<TraitBound>, span: Span },
    Struct { name: Str, type_params: List<TypeParam>, fields: List<HStructField>, is_pub: Bool, span: Span },
    Enum { name: Str, type_params: List<TypeParam>, variants: List<HEnumVariant>, is_pub: Bool, span: Span },
    Impl { target_type: Str, type_params: List<TypeParam>, trait_name: Str?, methods: List<HDecl>, span: Span },
    Effect { name: Str, type_params: List<TypeParam>, ops: List<HEffectOp>, is_pub: Bool, span: Span },
    Test { description: Str, body: HExpr, span: Span },
    Trait { name: Str, type_params: List<TypeParam>, methods: List<HTraitMethod>, is_pub: Bool, span: Span },
    ExternFn { name: Str, def_id: Int?, type_params: List<TypeParam>, params: List<HParam>, return_type: Type, effects: EffectRow, is_pub: Bool, span: Span },
    ExternType { name: Str, type_params: List<TypeParam>, is_pub: Bool, span: Span },
    TypeAlias { name: Str, ty: Type, is_pub: Bool, span: Span }
}

pub enum FieldAction {
    Identity,
    Call { dict_name: Str, extra_dicts: List<Str> }
}

pub struct DerivedField {
    pub name: Str,
    pub positional_index: Int?,
    pub action: FieldAction
}

pub struct DerivedVariant {
    pub name: Str,
    pub fields: List<DerivedField>,
    pub has_named_fields: Bool
}

pub enum TypeKind { StructKind, EnumKind }

pub struct DerivedImpl {
    pub type_name: Str,
    pub trait_name: Str,
    pub type_params: List<Str>,
    pub bounds: List<TraitBound>,
    pub type_kind: TypeKind,
    pub struct_fields: List<DerivedField>?,
    pub enum_variants: List<DerivedVariant>?
}

pub struct HProgram {
    pub decls: List<HDecl>,
    pub derived_impls: List<DerivedImpl>
}

// JS codegen naming conventions
pub fn variant_js_name(enum_name: Str, variant_name: Str) -> Str {
    "${enum_name}_${variant_name}"
}

pub fn trait_dict_name(type_name: Str, trait_name: Str) -> Str {
    "__${type_name}_${trait_name}"
}

pub fn evidence_param_name(effect_name: Str) -> Str {
    "__ring_ev_${effect_name}"
}

pub fn trait_bound_param_name(type_param: Str, trait_name: Str) -> Str {
    "__ring_${type_param}_${trait_name}"
}

pub fn default_method_self_name(type_name: Str) -> Str {
    "__ring_self_${type_name}"
}

pub fn ENUM_TAG_FIELD() -> Str { "_tag" }
pub fn OPTION_SOME_TAG() -> Str { "some" }
pub fn OPTION_NONE_TAG() -> Str { "none" }
pub fn OPTION_PAYLOAD_FIELD() -> Str { "_0" }
pub fn RUNTIME_EFFECT_ABORT() -> Str { "__EffectAbort" }
pub fn RUNTIME_MATCH_FAIL() -> Str { "__match_fail" }
