pub sig Direct {
    fn direct(value: Int) -> Int
}

pub mod outer {
    pub mod middle {
        pub mod inner {
            pub sig Deep {
                fn deep(value: Int) -> Int
            }
        }
    }
}

// Deliberately precedes its private source sibling: inline facade extraction
// must use the canonical registered SigDef, independent of source order.
pub mod facade {
    pub use super::origin::{Hidden as HiddenFacade}
}

mod origin {
    pub sig Hidden {
        fn hidden(value: Int) -> Int
    }
}
