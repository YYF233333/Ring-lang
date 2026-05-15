-- Ring-lang: Hello World
-- 这个文件展示语言的基本语法

struct Greeting {
    target: Str,
    enthusiasm: Int where it > 0,
}

fn greet(g: Greeting) -> Str {
    let bangs = "!".repeat(g.enthusiasm)
    "Hello, ${g.target}${bangs}"
}

fn main() {
    let g = Greeting { target: "Ring-lang", enthusiasm: 3 }
    print(greet(g))
}
