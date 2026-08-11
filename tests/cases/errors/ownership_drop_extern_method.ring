// expect-error: E0801
struct Resource { id: Int }

impl Drop for Resource {
    // The authoritative destructor must have a Ring body that ownership and
    // effect checking can inspect; an extern slot cannot become runtime glue.
    extern fn drop(self)
}

fn main() {}
