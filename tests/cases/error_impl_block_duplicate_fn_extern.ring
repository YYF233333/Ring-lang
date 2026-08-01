struct DuplicateImplFnExtern {}

impl DuplicateImplFnExtern {
    fn clash(self) -> Int { 1 }
    extern fn clash(self) -> Int
}

fn main() {}
