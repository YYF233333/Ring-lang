use hir::{HMatchArm}
use types::{Type}

pub fn check_exhaustive(arms: List<HMatchArm>, scrutinee_type: Type, subst: Map<Int, Type>) -> Str? {
    panic("check_exhaustive: not yet implemented")
}
