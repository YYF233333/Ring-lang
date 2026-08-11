use facade::{Resource, consume, make_consumer}

fn main() {
    // The returned callable contract must survive factory export, import and a
    // second re-export before it meets the direct exact target at this join.
    let selected = if true { make_consumer() } else { consume }
    let one_hop = selected
    let two_hop = one_hop
    print(two_hop(Resource { id: 9 }))
}
