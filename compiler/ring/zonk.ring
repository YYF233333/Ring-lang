use types::{Type, EffectRow}
use hir::{HExpr, HParam}

pub struct ZonkCtx {
    pub subst: Map<Int, Type>,
    pub names: Map<Int, Str>
}

pub fn zonk_type(ctx: ZonkCtx, t: Type) -> Type {
    panic("zonk_type: not yet implemented")
}

pub fn zonk_row(ctx: ZonkCtx, row: EffectRow) -> EffectRow {
    panic("zonk_row: not yet implemented")
}

pub fn zonk_param(ctx: ZonkCtx, p: HParam) -> HParam {
    panic("zonk_param: not yet implemented")
}

pub fn zonk_block(ctx: ZonkCtx, block: HExpr) -> HExpr {
    panic("zonk_block: not yet implemented")
}
