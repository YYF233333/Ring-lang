trait DefaultClash {
    fn clash(self) -> Int { 163 }
}

struct DefaultCollision {}

impl DefaultCollision {
    fn clash(self, suffix: Str) -> Str { "inherent=${suffix}" }
}

impl DefaultClash for DefaultCollision {}

fn main() {}
