# Ring-lang

语言演化实验——验证代数 effect system、refinement types、ML 级类型推断在大规模工程中的实用化。

**核心主张**：代数 effect system + ML 级类型推断 + OOP 手感，写起来像 Python，编译器看到完整类型+副作用信息。设计目标之一是让 LLM 在零训练数据下 vibe coding 的表现超过 TypeScript。

**当前状态**：自举完成。编译器由 33 个 .ring 源文件实现，编译自身，578 个 E2E 测试全部通过。当前编译到 JS/V8（bootstrap 后端），目标后端为 LLVM native。

## Quick Start

```bash
# 运行
node compiler/dist/main.js run examples/hello.ring

# 编译为 JS
node compiler/dist/main.js build examples/hello.ring

# 仅类型检查
node compiler/dist/main.js check examples/hello.ring

# 运行测试
npm test           # 从 compiler/ 目录
```

无外部依赖，只需 Node.js。

## 语言速览

### 基础：struct + enum + trait，无 class

```ring
struct Point { x: Float, y: Float }

enum Shape {
    circle(radius: Float),
    rect(width: Float, height: Float),
}

fn area(s: Shape) -> Float {
    match s {
        circle(r)  => 3.14159 * r * r,
        rect(w, h) => w * h,
    }
}

trait Drawable {
    fn draw(self) -> Str
}

impl Drawable for Shape {
    fn draw(self) -> Str {
        match self {
            circle(r)  => "circle(${r})",
            rect(w, h) => "rect(${w}x${h})",
        }
    }
}
```

### Effect System：副作用全追踪，零语法冒泡

```ring
// 你写的——不需要任何 effect 标注
fn load_config(path: Str) -> Config {
    let raw = io.read(path)        // io + fail 自动冒泡
    let data = json.parse(raw)     // fail 自动冒泡
    Config { host: data.host, port: data.port }
}

// 编译器推断的完整签名（IDE hover 可见）：
// fn load_config(path: Str) -> Config with {io, fail<ParseError>}
```

**错误处理——`catch` 表达式**：

```ring
let config = load_config(path) catch {
    IoError(e)    => default_config(),
    ParseError(e) => fallback(path),
}
```

**测试 mock——handler 替换副作用实现**：

```ring
test "config loading" {
    handle {
        let c = load_config("test.toml")
        assert(c.port == 8080, "port check")
    } with {
        io.read(_path) => "{\"host\":\"localhost\",\"port\":8080}",
    }
}
```

不需要 mock 框架，不需要依赖注入。Handler 在语言层面替换 effect 的实现。

### 类型推断：写起来像动态语言

```ring
fn main() {
    let items = [1, 2, 3, 4, 5]                   // List<Int>
    let doubled = items.map(fn(x) { x * 2 })      // List<Int>
    let evens = items.filter(fn(x) { x % 2 == 0 })
    let sum = items.fold(0, fn(acc, x) { acc + x })
    print("sum = ${sum}")
}
```

零类型标注，完整 HM 推断 + effect 推断。Lambda 参数从调用上下文双向推断类型。

### Row Polymorphism：无继承的结构化多态

```ring
fn greet(person: {name: Str, ..rest}) -> Str {
    "hello, ${person.name}"
}

struct User    { name: Str, age: Int }
struct Company { name: Str, industry: Str }

// 两个都能传——只要有 name: Str 字段
greet(User { name: "Alice", age: 30 })
greet(Company { name: "Acme", industry: "Tech" })
```

### Option 与 fail 的桥接

```ring
// Option 是数据，fail 是计算
// to_fail() 从数据进入计算，to_result() 从计算回到数据

fn find_user(id: Int) -> User {
    let maybe_user: User? = db_lookup(id)
    maybe_user.to_fail()    // none → raise(Unit)，自动冒泡
}

let result = to_result(fn() { find_user(42) })   // fail → Result::err
```

### 可变状态：`let mut` + 编译器追踪

```ring
fn main() {
    let mut counter = 0
    counter += 1
    counter += 1
    print("${counter}")   // 2

    let mut items = [1, 2, 3]
    items.push(4)           // mut 方法，编译器检查 items 是 let mut
    print("${items.len()}")  // 4
}
```

`let` 不可变（赋值报错），`let mut` 可变。Mut 方法只能在 `let mut` 绑定上调用。

## 设计公理

1. **类型即模型，不是谜题** — 表达力上限很高（refinement types、dependent types lite），但简单场景零注解。强力但不鼓励类型体操。
2. **效果即可见性** — IO、失败、可变、异步全部由 effect system 在类型层追踪。编译器全推断，只在模块边界显式声明。
3. **推断为王，标注为仆** — 写代码的体验接近 Python，编译器看到完整类型+效果信息。
4. **无人回路** — 语言设计的终极约束：让 LLM agent 能在无人审查的情况下自主编写正确代码。编译器不只是检查工具，而是自主开发闭环中替代人类的控制器。

## 编译器架构

```
源码 (.ring) → Lexer → Parser → AST → Checker (HM + effects) → HIR → Codegen → JavaScript
```

| 组件 | 说明 |
|------|------|
| Lexer + Parser | 手写，Pratt 表达式解析，声明级错误恢复 |
| Checker | HM 推断 + effect 推断 + trait 解析 + 穷尽性检查 |
| HIR | 独立数据结构，每个表达式带推断的 Type + EffectRow |
| Codegen | 生成可读 JS，effect → evidence passing，trait → dictionary passing |

编译器自身用 Ring 写成（自举），33 个源文件，编译到 JS 后运行。当前 JS 后端为 bootstrap 用途，目标后端为 LLVM native。

## 已实现特性

- 完整 HM 类型推断 + effect 推断 + effect 标注验证
- 代数 effect system（tail-resumptive + abort handler）+ effect alias 语法糖
- Trait system + auto-derive（Eq/Clone/Debug/Ord）+ supertrait 继承
- Row polymorphism（结构化参数多态）
- 模式匹配 + 穷尽性检查（Maranget 算法，含 catch arm 穷尽性）
- 集合类型：List / Map / Set / Tuple + 下标运算符 `list[i]` / `map[key]` / `str[i]`
- 模块系统：多文件 ESM 编译、pub/use、inline mod（含嵌套）、`super::`/`self::` 路径、`mod requires` capability
- Option\<T\>（`T?` 语法糖）+ Result\<T,E\> + fail 桥接
- `let mut` 可变绑定 + `mut self` 方法 + compound assign（`+=`/`-=`/`*=`/`/=`）
- 字符串插值（支持嵌套）+ 多行字符串 + raw string（`r"..."` / `r#"..."#`）
- `const` 顶级声明 + `loop` 关键字
- 标准库 10 个模块（io/fs/path/process/str/num/list/map/set/result）
- FFI（extern fn / extern type）
- Parser 声明级错误恢复 + Checker 函数级多错误恢复
- 578 个 E2E 测试（正向 + 负向）
- VSCode 语法高亮插件

## 路线图

**Phase C 层 1（基础设施，进行中）**：
- ~~Effect aliases~~ ✅、~~supertrait 继承~~ ✅、`mut<T>` marker effect、default effect handler

**Phase C 层 2（核心特性）**：
- 关联类型、Iterator trait、`delegate` 关键字、GADTs

**未来**：
- LLVM native backend（目标后端，编译器自身也将迁移）
- Refinement types 编译期验证（语法已支持，验证未实现）
- Linear types + Perceus 引用计数
- async effect + 结构化并发（设计已确定）
- LSP（从 TS 归档版本移植）

## 项目结构

```
Ring-lang/
├── compiler/          33 个 .ring 源文件（编译器自身）
│   └── dist/          编译产出的 JS（可直接 node 运行）
├── std/               10 个标准库模块
├── tests/cases/       288 个 E2E 测试文件（578 个测试用例）
├── examples/          示例程序
├── editor/vscode/     VSCode 插件（语法高亮）
└── docs/design.md     完整语言设计文档（14 章）
```

## 反馈方向

我们特别希望听到关于以下方面的意见：

- **Effect system 的实用性**：handler 替代 mock / DI 的方式是否直觉？错误冒泡的零语法设计是否清晰？
- **类型推断的体验**：零标注写法是否足够舒适？推断失败时的错误信息是否有帮助？
- **LLM 友好性**：如果你用 AI 辅助编码，这门语言的语法和语义是否更容易被 LLM 正确生成？
- **与现有语言的对比**：相比 TypeScript / Rust / Kotlin / Go，哪些设计让你觉得有价值，哪些觉得多余？
- **缺什么**：你的场景里缺少什么关键特性？
