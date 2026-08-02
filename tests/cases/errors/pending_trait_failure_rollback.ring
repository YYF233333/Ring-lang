// A trait default is a localized recovery owner: its body failure is caught
// and the enclosing trait declaration continues.  Its pending suffix must be
// rolled back before either the next method or the next declaration starts.
trait RecoveredDefaults {
    fn broken(self) -> Int {
        let _pending = set_from([])
        for value in 1 {
            print(value)
        }
        0
    }

    fn healthy(self) -> Int { 7 }
}

fn healthy_later_owner() -> Int { 7 }
