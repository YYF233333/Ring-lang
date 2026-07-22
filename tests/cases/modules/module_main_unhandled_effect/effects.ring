pub effect Alarm {
    fn ring() -> Unit
}

fn fail_now() {
    Alarm.ring()
}

pub fn via_helper() {
    fail_now()
}
