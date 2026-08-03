trait Marker {
    fn marker(self) -> Int
}

impl Marker for Int {
    fn marker(self) -> Int { self }
}

fn bounded_effect<T: Marker>() -> Unit with {fail<T>} {
    ()
}

trait DefaultEffectOwner {
    fn invoke(self) -> Unit with {fail<Int>} {
        // The trait method's declared effect payload is the only source for T.
        bounded_effect()
    }
}

struct EffectHost {}
impl DefaultEffectOwner for EffectHost {}

fn main() {
    let host = EffectHost {}
    host.invoke()
    print("trait-effect-annotation=ok")
}
