pub fn BUILTIN_INT() -> Str { "Int" }
pub fn BUILTIN_FLOAT() -> Str { "Float" }
pub fn BUILTIN_STR() -> Str { "Str" }
pub fn BUILTIN_BOOL() -> Str { "Bool" }
pub fn BUILTIN_RANGE() -> Str { "Range" }
pub fn BUILTIN_LIST() -> Str { "List" }
pub fn BUILTIN_MAP() -> Str { "Map" }
pub fn BUILTIN_SET() -> Str { "Set" }
pub fn BUILTIN_OPTION() -> Str { "Option" }
pub fn BUILTIN_CELL() -> Str { "Cell" }

pub struct StructField {
    pub name: Str,
    pub ty: Type,
    pub is_pub: Bool
}

pub struct EnumVariant {
    pub name: Str,
    pub fields: List<Type>,
    pub field_names: List<Str>?
}

pub struct RecordField {
    pub name: Str,
    pub ty: Type
}

pub enum Type {
    IntType,
    FloatType,
    StrType,
    BoolType,
    UnitType,
    NeverType,
    AnyType,
    TypeVar { id: Int, name: Str? },
    FnType { params: List<Type>, return_type: Type, effects: EffectRow },
    StructType { name: Str, type_params: List<Type>, fields: List<StructField> },
    EnumType { name: Str, type_params: List<Type>, variants: List<EnumVariant> },
    GenericType { base: Type, args: List<Type> },
    RecordType { fields: List<RecordField>, tail: Int?, tail_name: Str? },
    EffectRowType { effects: List<Effect>, tail: Int? },
    TupleType { elements: List<Type> }
}

pub enum Effect {
    IoEffect,
    FailEffect { error_type: Type },
    MutEffect,
    CustomEffect { name: Str, type_args: List<Type> }
}

pub struct EffectRow {
    pub effects: List<Effect>,
    pub tail: Int?
}

pub struct RowMergeResult {
    pub row: EffectRow,
    pub tails_to_unify: Option<(Int, Int)>
}

// Helper functions for typed empty lists (Ring cannot infer element type of `[]`)
fn empty_types() -> List<Type> { let x: List<Type> = [INT()]; x.clear(); x }
fn empty_effects() -> List<Effect> { let x: List<Effect> = [Effect::IoEffect]; x.clear(); x }
fn empty_fields() -> List<StructField> {
    let dummy = StructField { name: "", ty: INT(), is_pub: false }
    let x: List<StructField> = [dummy]; x.clear(); x
}

// Helper for string equality in nested closures (workaround: == in nested lambdas)
fn str_eq(a: Str, b: Str) -> Bool { a == b }

pub fn INT() -> Type { Type::IntType }
pub fn FLOAT() -> Type { Type::FloatType }
pub fn STR() -> Type { Type::StrType }
pub fn BOOL() -> Type { Type::BoolType }
pub fn UNIT() -> Type { Type::UnitType }
pub fn NEVER() -> Type { Type::NeverType }
pub fn ANY() -> Type { Type::AnyType }

pub fn EMPTY_ROW() -> EffectRow { EffectRow { effects: empty_effects(), tail: none } }

pub fn type_to_builtin_name(t: Type) -> Str? {
    match t {
        Type::IntType => some(BUILTIN_INT()),
        Type::FloatType => some(BUILTIN_FLOAT()),
        Type::StrType => some(BUILTIN_STR()),
        Type::BoolType => some(BUILTIN_BOOL()),
        Type::UnitType => some("Unit"),
        Type::StructType { name, .. } => some(name),
        Type::EnumType { name, .. } => some(name),
        _ => none
    }
}

pub fn make_option_type(inner: Type) -> Type {
    Type::EnumType {
        name: BUILTIN_OPTION(),
        type_params: [inner],
        variants: [
            EnumVariant { name: "some", fields: [inner], field_names: none },
            EnumVariant { name: "none", fields: empty_types(), field_names: none }
        ]
    }
}

pub fn is_option_type(t: Type) -> Bool {
    match t {
        Type::EnumType { name, type_params, .. } =>
            name == BUILTIN_OPTION() && type_params.len() == 1,
        _ => false
    }
}

pub fn option_inner(t: Type) -> Type {
    match t {
        Type::EnumType { type_params, .. } => type_params.first().unwrap_or(UNIT()),
        _ => UNIT()
    }
}

pub fn make_list_type(element: Type) -> Type {
    Type::StructType { name: BUILTIN_LIST(), type_params: [element], fields: empty_fields() }
}

pub fn is_list_type(t: Type) -> Bool {
    match t {
        Type::StructType { name, .. } => name == BUILTIN_LIST(),
        _ => false
    }
}

pub fn list_element(t: Type) -> Type {
    match t {
        Type::StructType { type_params, .. } => type_params.first().unwrap_or(UNIT()),
        _ => UNIT()
    }
}

pub fn make_map_type(key: Type, value: Type) -> Type {
    Type::StructType { name: BUILTIN_MAP(), type_params: [key, value], fields: empty_fields() }
}

pub fn is_map_type(t: Type) -> Bool {
    match t {
        Type::StructType { name, .. } => name == BUILTIN_MAP(),
        _ => false
    }
}

pub fn make_set_type(element: Type) -> Type {
    Type::StructType { name: BUILTIN_SET(), type_params: [element], fields: empty_fields() }
}

pub fn is_set_type(t: Type) -> Bool {
    match t {
        Type::StructType { name, .. } => name == BUILTIN_SET(),
        _ => false
    }
}

pub fn effect_row(effects: List<Effect>) -> EffectRow {
    EffectRow { effects: effects, tail: none }
}

pub fn open_effect_row(effects: List<Effect>, tail: Int) -> EffectRow {
    EffectRow { effects: effects, tail: some(tail) }
}

pub fn row_contains(row: EffectRow, eff: Effect) -> Bool {
    row.effects.any(fn(e) { effects_equal(e, eff) })
}

fn effects_same_kind(a: Effect, b: Effect) -> Bool {
    match a {
        Effect::IoEffect => match b { Effect::IoEffect => true, _ => false },
        Effect::MutEffect => match b { Effect::MutEffect => true, _ => false },
        Effect::FailEffect { .. } => match b { Effect::FailEffect { .. } => true, _ => false },
        Effect::CustomEffect { name: na, .. } => match b {
            Effect::CustomEffect { name: nb, .. } => na == nb,
            _ => false
        }
    }
}

pub fn row_merge(a: EffectRow, b: EffectRow) -> RowMergeResult {
    var merged = list_clone(a.effects)
    for eff in b.effects {
        if !merged.any(fn(e) { effects_same_kind(e, eff) }) {
            merged.push(eff)
        }
    }
    let tail: Int? = match (a.tail, b.tail) {
        (some(ta), _) => some(ta),
        (_, some(tb)) => some(tb),
        _ => none
    }
    let tails_to_unify: Option<(Int, Int)> = match (a.tail, b.tail) {
        (some(ta), some(tb)) => if ta != tb { some((ta, tb)) } else { none },
        _ => none
    }
    RowMergeResult {
        row: EffectRow { effects: merged, tail: tail },
        tails_to_unify: tails_to_unify
    }
}

pub fn effects_equal(a: Effect, b: Effect) -> Bool {
    match a {
        Effect::IoEffect => match b { Effect::IoEffect => true, _ => false },
        Effect::MutEffect => match b { Effect::MutEffect => true, _ => false },
        Effect::FailEffect { error_type: et_a } => match b {
            Effect::FailEffect { error_type: et_b } => types_equal(et_a, et_b),
            _ => false
        },
        Effect::CustomEffect { name: na, type_args: args_a } => match b {
            Effect::CustomEffect { name: nb, type_args: args_b } => {
                if na != nb { return false }
                if args_a.len() != args_b.len() { return false }
                var i = 0
                while i < args_a.len() {
                    if let some(aa) = args_a.get(i) {
                        if let some(bb) = args_b.get(i) {
                            if !types_equal(aa, bb) { return false }
                        }
                    }
                    i = i + 1
                }
                true
            },
            _ => false
        }
    }
}

pub fn types_equal(a: Type, b: Type) -> Bool {
    match a {
        Type::IntType => match b { Type::IntType => true, _ => false },
        Type::FloatType => match b { Type::FloatType => true, _ => false },
        Type::StrType => match b { Type::StrType => true, _ => false },
        Type::BoolType => match b { Type::BoolType => true, _ => false },
        Type::UnitType => match b { Type::UnitType => true, _ => false },
        Type::NeverType => match b { Type::NeverType => true, _ => false },
        Type::AnyType => match b { Type::AnyType => true, _ => false },
        Type::TypeVar { id: id_a, .. } => match b {
            Type::TypeVar { id: id_b, .. } => id_a == id_b,
            _ => false
        },
        Type::FnType { params: pa, return_type: ra, effects: ea } => match b {
            Type::FnType { params: pb, return_type: rb, effects: eb } => {
                if pa.len() != pb.len() { return false }
                if ea.effects.len() != eb.effects.len() { return false }
                let tails_ok = match (ea.tail, eb.tail) {
                    (some(a_t), some(b_t)) => a_t == b_t,
                    _ => ea.tail.is_none() && eb.tail.is_none()
                }
                if !tails_ok { return false }
                var i = 0
                while i < pa.len() {
                    if let some(ap) = pa.get(i) {
                        if let some(bp) = pb.get(i) {
                            if !types_equal(ap, bp) { return false }
                        }
                    }
                    i = i + 1
                }
                if !types_equal(ra, rb) { return false }
                var j = 0
                while j < ea.effects.len() {
                    if let some(ae) = ea.effects.get(j) {
                        if let some(be) = eb.effects.get(j) {
                            if !effects_equal(ae, be) { return false }
                        }
                    }
                    j = j + 1
                }
                true
            },
            _ => false
        },
        Type::StructType { name: na, type_params: tpa, .. } => match b {
            Type::StructType { name: nb, type_params: tpb, .. } => {
                if na != nb { return false }
                if tpa.len() != tpb.len() { return false }
                var i = 0
                while i < tpa.len() {
                    if let some(ap) = tpa.get(i) {
                        if let some(bp) = tpb.get(i) {
                            if !types_equal(ap, bp) { return false }
                        }
                    }
                    i = i + 1
                }
                true
            },
            _ => false
        },
        Type::EnumType { name: na, type_params: tpa, .. } => match b {
            Type::EnumType { name: nb, type_params: tpb, .. } => {
                if na != nb { return false }
                if tpa.len() != tpb.len() { return false }
                var i = 0
                while i < tpa.len() {
                    if let some(ap) = tpa.get(i) {
                        if let some(bp) = tpb.get(i) {
                            if !types_equal(ap, bp) { return false }
                        }
                    }
                    i = i + 1
                }
                true
            },
            _ => false
        },
        Type::GenericType { base: ba, args: aa } => match b {
            Type::GenericType { base: bb, args: ab } => {
                if !types_equal(ba, bb) { return false }
                if aa.len() != ab.len() { return false }
                var i = 0
                while i < aa.len() {
                    if let some(ap) = aa.get(i) {
                        if let some(bp) = ab.get(i) {
                            if !types_equal(ap, bp) { return false }
                        }
                    }
                    i = i + 1
                }
                true
            },
            _ => false
        },
        Type::RecordType { fields: fa, tail: ta, .. } => match b {
            Type::RecordType { fields: fb, tail: tb, .. } => {
                if fa.len() != fb.len() { return false }
                let tails_ok = match (ta, tb) {
                    (some(a_t), some(b_t)) => a_t == b_t,
                    _ => ta.is_none() && tb.is_none()
                }
                if !tails_ok { return false }
                fa.all(fn(f) {
                    fb.any(fn(bf) { str_eq(bf.name, f.name) && types_equal(f.ty, bf.ty) })
                })
            },
            _ => false
        },
        Type::EffectRowType { effects: ea, tail: ta } => match b {
            Type::EffectRowType { effects: eb, tail: tb } => {
                if ea.len() != eb.len() { return false }
                let tails_ok = match (ta, tb) {
                    (some(a_t), some(b_t)) => a_t == b_t,
                    _ => ta.is_none() && tb.is_none()
                }
                if !tails_ok { return false }
                var i = 0
                while i < ea.len() {
                    if let some(ae) = ea.get(i) {
                        if let some(be) = eb.get(i) {
                            if !effects_equal(ae, be) { return false }
                        }
                    }
                    i = i + 1
                }
                true
            },
            _ => false
        },
        Type::TupleType { elements: ea } => match b {
            Type::TupleType { elements: eb } => {
                if ea.len() != eb.len() { return false }
                var i = 0
                while i < ea.len() {
                    if let some(ae) = ea.get(i) {
                        if let some(be) = eb.get(i) {
                            if !types_equal(ae, be) { return false }
                        }
                    }
                    i = i + 1
                }
                true
            },
            _ => false
        }
    }
}

pub fn type_to_string(t: Type) -> Str {
    match t {
        Type::IntType => BUILTIN_INT(),
        Type::FloatType => BUILTIN_FLOAT(),
        Type::StrType => BUILTIN_STR(),
        Type::BoolType => BUILTIN_BOOL(),
        Type::UnitType => "()",
        Type::NeverType => "Never",
        Type::AnyType => "Any",
        Type::TypeVar { name, id } => match name {
            some(n) => n,
            none => "?${id.to_str()}"
        },
        Type::FnType { params, return_type, effects } => {
            let ps = params.map(fn(p) { type_to_string(p) }).join(", ")
            let ret = type_to_string(return_type)
            let eff = effect_row_to_string(effects)
            if eff.len() > 0 { "(${ps}) -> ${ret} / ${eff}" }
            else { "(${ps}) -> ${ret}" }
        },
        Type::StructType { name, type_params, .. } => {
            if type_params.len() == 0 { name }
            else { "${name}<${type_params.map(fn(p) { type_to_string(p) }).join(", ")}>" }
        },
        Type::EnumType { name, type_params, .. } => {
            if name == BUILTIN_OPTION() && type_params.len() == 1 {
                "${type_to_string(type_params.first().unwrap_or(UNIT()))}?"
            } else if type_params.len() == 0 { name }
            else { "${name}<${type_params.map(fn(p) { type_to_string(p) }).join(", ")}>" }
        },
        Type::GenericType { base, args } => {
            "${type_to_string(base)}<${args.map(fn(a) { type_to_string(a) }).join(", ")}>"
        },
        Type::RecordType { fields, tail, tail_name } => {
            let fs = fields.map(fn(f) { "${f.name}: ${type_to_string(f.ty)}" }).join(", ")
            match tail {
                some(t) => {
                    let ts = match tail_name { some(n) => n, none => "?${t.to_str()}" }
                    if fs.len() > 0 { "{${fs}, ..${ts}}" } else { "{..${ts}}" }
                },
                none => "{${fs}}"
            }
        },
        Type::EffectRowType { effects, tail } => {
            let es = effects.map(fn(e) { effect_to_string(e) }).join(", ")
            match tail {
                some(t) => "<${es}, ?${t.to_str()}>",
                none => "<${es}>"
            }
        },
        Type::TupleType { elements } =>
            "(${elements.map(fn(e) { type_to_string(e) }).join(", ")})"
    }
}

pub fn effect_to_string(e: Effect) -> Str {
    match e {
        Effect::IoEffect => "io",
        Effect::MutEffect => "mut",
        Effect::FailEffect { error_type } => "fail<${type_to_string(error_type)}>",
        Effect::CustomEffect { name, type_args } => {
            if type_args.len() == 0 { name }
            else { "${name}<${type_args.map(fn(a) { type_to_string(a) }).join(", ")}>" }
        }
    }
}

pub fn effect_row_to_string(row: EffectRow) -> Str {
    if row.effects.len() == 0 && row.tail.is_none() { return "" }
    var parts = row.effects.map(fn(e) { effect_to_string(e) })
    match row.tail {
        some(t) => parts.push("?${t.to_str()}"),
        none => {}
    }
    parts.join(", ")
}
