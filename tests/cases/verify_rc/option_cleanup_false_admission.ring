// One exact unsafe borrowed-Str tail owns the false-admission mutation.

fn option_cleanup_false_admission(value: Str) {
    {
        let mut wrapped: Str? = none
        value
    }
    print(value)
}

fn main() {
    option_cleanup_false_admission("kept")
}
