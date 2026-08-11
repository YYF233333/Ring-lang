// expect-error: E0801
enum Tree<T> {
    Leaf { value: T },
    Node { left: Tree<T>, right: Tree<T>, value: T },
}

// Overriding value still leaves the recursive left/right projections to be
// copied. Tree<T> may transitively carry Drop through T.
fn replace_node_value<T>(tree: Tree<T>, value: T) -> Tree<T> {
    match tree {
        Node { left, right, value: old } => Node { ..tree, value: value },
        Leaf { value: old } => tree,
    }
}

fn main() {}
