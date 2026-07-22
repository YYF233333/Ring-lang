use forward::{BridgeCtx, marker}

pub fn bridge(value: Int) -> Int { value + 1 }
pub fn bridge_ctx(mut ctx: BridgeCtx) -> Int { ctx.value }
pub fn keep_provider() -> Int { marker() }
