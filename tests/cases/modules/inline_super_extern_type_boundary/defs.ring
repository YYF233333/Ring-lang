pub mod facade {
    // Set<T> is a prelude extern type, but this file does not declare it.
    // A raw ABI fallback must not turn it into a super:: file member.
    pub use super::Set as LeakedSet
}
