pub mod same {
    pub enum First {
        Clash,
    }
    pub struct Handle {}
}

pub mod same {
    pub enum Second {
        Clash,
    }
    pub extern type Handle
}

fn main() {}
