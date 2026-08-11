// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

enum Chain<T> { More(T, Chain<T>?), End }

fn consume(move value: Chain<Resource>) -> Int { 1 }

fn main() {
    let chain = More(Resource { id: 1 }, none)
    print(consume(chain))
    print(consume(chain))
}
