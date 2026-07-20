pub effect Alarm {
    fn ring() -> Unit
}

pub fn trigger() {
    Alarm.ring()
}
