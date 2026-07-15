pub effect Signal {
    fn number() -> Int
}

pub effect alias Bundle = {Signal}

pub fn emit() -> Int with {Bundle} {
    Signal.number()
}
