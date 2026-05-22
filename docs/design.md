# Ring-lang 设计文档

一门面向大型多端应用开发的理想编程语言。追求良好的工程 scalability，内化最佳工程实践，可以轻松驾驭 Web + 移动 + 桌面的全栈场景。

思想实验起步，允许激进的学术设计。额外目标：让 LLM 也喜欢写这门语言——如果 LLM 在零训练数据的情况下，vibe coding 大规模代码库的表现能干掉 JS/TS，就是将玩具打磨成熟的强 argue。

## 设计公理

1. **类型即模型，不是谜题** — 类型系统表达力上限很高（refinement types、dependent types lite、GAT），但语法让简单场景零注解，复杂场景读起来像自然语言约束。强力但不鼓励类型体操：类型建模实际问题，不耍杂技。
2. **效果即可见性** — 函数的副作用（IO、失败、可变、异步）全部由 effect system 在类型层追踪。编译器全推断，人通过 IDE 幽灵标注感知冒泡点。只在模块边界处显式声明。
3. **推断为王，标注为仆** — Bidirectional + constraint solving + effect inference。写代码的体验接近 Python，编译器内部看到完整类型+效果信息。标注由 formatter 按配置等级自动生成维护，人只控制详细度。
4. **无人回路** — 语言设计的终极约束：让 LLM agent 能在无人审查的情况下自主编写正确代码。每个语言特性的评估标准之一是"它能替代人类在开发回路中的哪个角色"。编译器不只是检查工具，而是自主开发闭环中替代人类的控制器。

## 偏好约束（来自用户画像分析）

| 维度 | 倾向 |
|------|------|
| 范式 | 过程式 + 函数式，零 OOP 语义（但模拟 OOP 手感） |
| 命名 | snake_case，ALL_CAPS 常量 |
| 不可变 | 默认不可变，`let mut` 显式声明可变，`mut` 是唯一的可变性关键字 |
| 错误 | 错误即 effect，自动冒泡；需持久化时物化为 Result 数据 |
| 抽象 | 扁平 > 嵌套，中间变量 > 链式调用 |
| 数据结构 | struct + enum + trait，不造 class 层级 |
| 内存 | GC，开发者零心智负担 |
| 标注 | 工具生成，人控制详细度 |

---

## 1. 类型系统

### 1.1 基础层：ADT + Trait

所有抽象由三种构造完成，无 class、无继承：

```
struct Point { x: Float, y: Float }

enum Shape {
    circle(radius: Float),
    rect(width: Float, height: Float),
    polygon(vertices: List<Point>),
}

fn area(s: Shape) -> Float {
    match s {
        circle(r)    => pi * r * r,
        rect(w, h)   => w * h,
        polygon(vs)  => polygon_area(vs),
    }
}

trait Drawable {
    type Surface
    fn draw(self, target: Surface) -> Unit
}

impl Drawable for Shape {
    type Surface = Canvas
    fn draw(self, target: Canvas) -> Unit {
        match self { ... }
    }
}
```

Trait 泛型约束：

```
fn sort<T: Ord>(list: List<T>) -> List<T> { ... }

fn serialize_sorted<T: Ord + Serialize>(list: List<T>) -> Bytes {
    list.sort().map(to_bytes).concat()
}

trait Collection {
    type Item
    type Iter: Iterator<item = Item>
    fn iter(self) -> Iter
}
```

### 1.2 Refinement Types

类型附带谓词，编译器尽力静态检查，无法证明时插入运行时检查：

```
type Positive    = Int where it > 0
type NonEmpty<T> = List<T> where it.len() > 0
type Percentage  = Float where 0.0 <= it <= 100.0
type Email       = Str where it.matches(r"^[^@]+@[^@]+\.[^@]+$")

fn divide(a: Float, b: Float where b != 0.0) -> Float {
    a / b
}

struct Portfolio {
    weights: List<Percentage> where it.sum() == 100.0,
    assets:  NonEmpty<Asset>,
}

let x = 42
divide(1.0, x)      // 编译器证明 42 != 0 ✓

let y = read_input()
divide(1.0, y)      // 编译器插入运行时检查，失败触发 fail effect
```

### 1.3 Dependent Types Lite

类型可以依赖特定值，不要求完整依赖类型的证明能力：

```
struct Vec<T, n: Nat> {
    data: Array<T>,
}

fn zip<T, U, n: Nat>(a: Vec<T, n>, b: Vec<U, n>) -> Vec<(T, U), n> { ... }

fn head<T, n: Nat where n > 0>(v: Vec<T, n>) -> T {
    v.data[0]
}

fn matmul<m: Nat, k: Nat, n: Nat>(
    a: Mat<m, k>,
    b: Mat<k, n>,
) -> Mat<m, n> { ... }
```

### 1.4 Row Polymorphism

无继承的结构化多态：

```
fn greet(person: {name: Str, ..rest}) -> Str {
    "hello, ${person.name}"
}

struct User    { name: Str, age: Int, email: Str }
struct Company { name: Str, industry: Str }

greet(User { ... })       // ✓
greet(Company { ... })    // ✓

// 注意：spread 和 record 返回类型属于方案 B（未实现）
// 当前实现为方案 A：row type 仅在参数类型中使用
// fn with_timestamp(r: {..rest}) -> {timestamp: Int, ..rest} {
//     { ...r, timestamp: now() }
// }
```

### 1.5 错误的生命周期模型

Ring 的错误处理基于一个核心洞察：**错误有生命周期——诞生（raise）、流动（propagate）、有时落地（materialize）。** effect 是错误的运动形态，Result 是错误的静止形态。两者不是竞争关系，是同一个错误在不同阶段的表现。

- **`fail<E>` effect 是主模型** —— 错误默认以 effect 形式存在和流动，零语法自动传播
- **`to_result()` 是"物化"操作** —— 当需要存储、序列化、收集多个错误时，将 effect 转为数据
- **`catch` 是就地恢复** —— 捕获 fail effect 并提供替代值，总是消除 fail effect
- **`Option<T>` 是独立的数据类型** —— 表达"有或没有"，通过 `to_fail()` 进入 effect 世界

```
// Option 是数据类型，T? 是 Option<T> 的糖
enum Option<T> { some(T), none }

struct User {
    name:     Str,
    nickname: Str?,               // 数据层面的"有或没有"
}

// Option → 值：unwrap 方法
let nick = user.nickname.unwrap()              // none → panic
let nick = user.nickname.unwrap_or("匿名")     // none → 默认值
let nick = user.nickname.unwrap_or_else(fn() { compute_default() })

// Option → fail effect：to_fail 方法（从数据进入 effect 世界）
fn get_nickname(user: User) -> Str {
    user.nickname.to_fail()       // none → raise(Unit)，自动冒泡
}

// fail effect → 就地恢复：catch 表达式（总是消除 fail）
let config = load_config(path) catch {
    IoError(e) => default_config(),
    _          => panic("unexpected error"),
}

// fail effect → 物化为数据：to_result（当需要错误作为持久数据时）
let result: Result<Config, Str> = to_result(fn() { load_config(path) })
```

**什么时候用哪个：**

| 场景 | 机制 | 理由 |
|------|------|------|
| 不关心错误，让上层处理 | 零语法（自由传播） | 错误在流动，不需要干预 |
| 在调用点就地恢复 | `catch { ... }` | 错误到此为止，提供替代值 |
| 需要错误作为数据（收集/序列化/测试断言） | `to_result()` | 错误需要落地成持久值 |
| 拦截/替换 effect 实现（mock/DI） | `handle...with` | 不只是错误，是 effect 语义替换 |

设计原则：**错误在 effect 世界诞生和流动（零开销），只在需要持久化时物化为数据。大多数代码不需要物化。**

### 1.6 可变性模型

Ring 的可变性由唯一关键字 `mut` 统一管理。设计原则：**局部 mutation 不是 side effect，共享 mutation 才是。**

**`let` vs `let mut`：**

```
let x = 10                   // 不可变——不可重绑定，不可调用 mut self 方法
let mut counter = 0          // 可变——可重绑定，可调用 mut self 方法

let list = [1, 2, 3]
list.push(4)                 // ERROR — push 是 mut self 方法，需要 let mut
list.len()                   // ok — len 是只读方法

let mut list = [1, 2, 3]
list.push(4)                 // ok
list = [5, 6]                // ok — 重绑定
```

**`mut` 参数——传入可变引用：**

```
fn increment(mut counter: Int) {
    counter = counter + 1    // 直接赋值，修改调用方的变量
}

let mut n = 0
increment(mut n)             // 调用方显式标 mut
print(n)                     // 1
```

编译器为 `mut` 参数自动 box（`{ value }` 对象），用户无感。调用方必须写 `mut` 前缀表示授权修改。

**`mut self`——可变方法：**

```
impl List<T> {
    fn len(self) -> Int { ... }           // 只读
    fn push(mut self, value: T) { ... }   // 可变——调用方需要 let mut 绑定
    fn clear(mut self) { ... }            // 可变
}
```

**闭包捕获——编译器透明 box：**

```
let mut counter = 0
let inc = fn() { counter = counter + 1 }  // 闭包捕获 mut 绑定
let get = fn() { counter }

inc(); inc(); inc()
get()  // 3
```

编译器检测到 `counter` 被闭包捕获且为 `let mut`，自动 box 为 `{ value: 0 }`。闭包和外层作用域共享同一个 box。用户写的是直觉代码，编译器干脏活。

**Effect 追踪规则：**

| 场景 | 是否 box | `mut<T>` effect | 理由 |
|------|---------|-----------------|------|
| `let mut x` 纯局部使用 | 不 box（JS `let`） | 不出现 | 局部 mutation 不是 side effect |
| `let mut x` 被闭包捕获 | 自动 box | 出现在闭包签名 | 共享 mutation 是 side effect |
| `mut` 参数传递 | 调用方 box | 出现在函数签名 | 修改外部状态是 side effect |
| struct 字段修改（`let mut s; s.f = v`） | 不 box | 不出现 | 局部持有的 struct 修改是局部行为 |

**不再需要 `Cell<T>` / `Ref<T>` 等包装类型。** 所有可变性通过 `let mut` + `mut` 参数 + 编译器自动 box 处理。词汇量：一个关键字 `mut`。

**闭包内的 `return` 语义**：闭包内的 `return` 返回闭包本身，不影响外层函数。这与 Rust/Kotlin 一致，与 Ruby/Smalltalk 不同。当闭包作为 HOF 回调传入时（如 `list.map(fn(x) { return x * 2 })`），`return` 仅影响该回调。当前编译器通过 IIFE 实现 block expression，表达式位置的 block/if 包含 `return` 时可能被 IIFE 截获（已知限制 C10）。

---

## 2. Effect 系统

代数效果统一所有副作用。

### 2.1 效果声明

```
effect io {
    fn read(path: Str) -> Bytes
    fn write(path: Str, data: Bytes) -> Unit
    fn net_get(url: Str) -> Bytes
}

effect fail<E> {
    fn raise(error: E) -> Never
}

effect async {
    fn spawn<T>(task: fn() -> T) -> Future<T>
    fn await<T>(f: Future<T>) -> T
}

// 当前实现：mut 无类型参数（Cell<T> 泛型保证类型安全）
// Phase 3 目标：mut<S> 参数化 effect
effect mut<S> {
    fn get() -> S
    fn set(new_state: S) -> Unit
}
```

### 2.2 Default Handler（默认处理器）

Effect 的 op 可以带 body，语法与 trait 默认方法一致——有 body = 有默认 handler，无 body = 必须显式 handle：

```
effect Logger {
    fn log(msg: Str) -> Unit {       // 有默认 handler
        print(msg)
    }
}

effect Storage {
    fn read(key: Str) -> Str         // 无默认，必须 handle
    fn write(key: Str, val: Str) -> Unit  // 无默认，必须 handle
    fn log(msg: Str) -> Unit {       // 有默认，可选 handle
        print("storage: ${msg}")
    }
}
```

**语义规则：**

1. **签名透明**：有默认的 effect 仍出现在函数签名中（`fn work() -> Unit with {Logger}`）。"效果即可见性"——默认 handler 消除的是 boilerplate，不是可见性。

2. **部分默认**：`handle...with` 中显式 handle 的 op 覆盖默认，未写的 op 走默认。如果一个 op **没有默认且未 handle → 编译错误**。

3. **全默认可省略 handle**：如果一个 effect 的所有 op 都有默认，调用者可以完全不写 `handle...with`，编译器自动注入默认 evidence。

```
// Logger 全部 op 有默认，无需 handle
fn main() {
    do_work()  // Logger.log 自动走 print(msg)
}

// Storage 部分 op 无默认，只 handle 无默认的
handle {
    work()
} with {
    Storage.read(k) => read_from_disk(k),
    Storage.write(k, v) => write_to_disk(k, v),
    // Storage.log 不写 → 走默认的 print
}
```

**Default handler 的 effect 约束（中间版设计）：**

Default handler body 可以使用：
- 内置 effect（io / fail / mut）
- 已有 default handler 的自定义 effect

不允许使用无默认 handler 的自定义 effect（会产生无法解析的依赖）。编译器对 default handler 间的依赖做拓扑排序，检测循环时报编译错误。

⚠️ 设计已确定（2026-05-22），尚未实现。

### 2.3 Effect 推断

你不写 effect 标注，编译器全推断：

```
// 你写的：
fn load_portfolio(path: Str) -> Portfolio {
    let raw = io.read(path)
    let data = json.parse(raw)
    let weights = validate(data)
    Portfolio { weights, assets: data.assets }
}

// 编译器推断的完整签名（IDE hover 可见）：
// fn load_portfolio(path: Str) -> Portfolio
//     with {io, fail<ParseError | ValidationError>}
```

### 2.4 错误处理——生命周期模型

错误有生命周期：诞生（raise）→ 流动（propagate）→ 落地（materialize 或 catch）。大多数代码只涉及前两个阶段。

**阶段 1：诞生与流动——零语法**

```
fn load_portfolio(path: Str) -> Portfolio {
    let raw = io.read(path)       // io + fail 自动冒泡
    let data = json.parse(raw)    // fail 自动冒泡
    validate(data)                 // fail 自动冒泡
}
```

80% 的错误处理到此结束。函数签名自动推断出 `with {io, fail<...>}`，调用方继续传播。

**阶段 2：就地恢复——`catch` 表达式**

```
let config = load_config(path) catch {
    IoError(e)    => { log(e); default_config() },
    ParseError(e) => fallback(path),
    _             => panic("unexpected"),
}
```

`catch` 总是消除 `fail` effect——它是一个完整捕获点。内部用模式匹配分派不同错误类型。如果需要选择性处理（只处理部分错误、其余继续传播），在 catch 内部 match + re-raise：

```
let config = load_config(path) catch { e =>
    match e {
        IoError(io_err) => default_config(),
        other           => raise(other),    // 显式重新抛出
    }
}
```

这样"部分处理"是显式的（re-raise），而非隐式的（有没有 catch-all arm）。

**阶段 3a：物化为数据——`to_result()`**

当需要错误作为持久数据时（收集多个错误、序列化、测试断言、跨 API 边界传递）：

```
let result: Result<Config, Str> = to_result(fn() { load_config(path) })
match result {
    ok(config) => use_config(config),
    err(e)     => log("failed: ${e}"),
}

// 典型场景：验证收集
let results = fields.map(fn(f) { to_result(fn() { validate_field(f) }) })
let errors = results.filter(fn(r) { r.is_err() })
```

**阶段 3b：effect 替换——`handle...with`（高级）**

用于拦截和替换 effect 实现，不限于错误处理（mock、DI、自定义 effect）：

```
handle {
    let result = complex_pipeline()
    save(result)
} with {
    io => perform,                          // 透传 io
    fail(e: ValidationError) => log_and_skip(e),
}
```

### 2.5 Effect Handler 用于测试 Mock

```
test "load_portfolio parses correctly" {
    let mock_data = r#"{"weights": [25, 25, 25, 25], ...}"#

    handle {
        let p = load_portfolio("fake.json")
        assert(p.weights.len() == 4)
    } with {
        io.read(_path) => mock_data,
        fail(e) => panic("unexpected: ${e}"),
    }
}
```

### 2.6 Effect 多态

当前 handler 支持两种语义：

- **Tail-resumptive**（已实现）：handler 返回值即 resume 值，计算继续。覆盖 mock、adapter、default provider 等场景。
- **Abort**（已实现）：`fail.raise` 专用，handler 替换整个计算结果。

```
// tail-resumptive：handler 返回值替代 io.read 的返回值，计算继续
handle {
    let data = io.read("config.toml")   // → "mock-data"
    "got: ${data}"                       // → "got: mock-data"
} with {
    io.read(path) => "mock-data",
}
```

> **Phase 3 目标：full algebraic effect**（post-resume handler，需要 delimited continuation）：
>
> ```
> // 未实现：handler body 调用 resume 后继续执行额外代码
> fn retry<T, E>(times: Int, action: fn() -> T with {fail<E>}) -> T with {fail<E>} {
>     var attempts = 0
>     loop {
>         handle {
>             return action()
>         } with {
>             fail(e) => {
>                 attempts += 1
>                 if attempts >= times { raise(e) }
>             }
>         }
>     }
> }
> ```

### 2.7 Effect 冒泡可见性

冒泡点是人的需求，不是编译器的需求。由 IDE 层解决：

```
// IDE 模式 A：行尾幽灵文字
let raw = io.read(path)           ░ io, fail<IoError> ░
let data = json.parse(raw)        ░ fail<ParseError> ░

// IDE 模式 B：底色高亮
// 纯表达式 = 无底色
// fail 效果 = 淡黄底色
// io 效果 = 淡蓝底色
// async 效果 = 淡紫底色
```

Formatter 可选将 effect 标注固化为源码注释：

```
//: 前缀注释，formatter 自动维护
let raw = io.read(path)           //: io, fail<IoError>
let data = json.parse(raw)        //: fail<ParseError>
```

---

## 3. 类型推断与标注系统

### 3.1 三层推断

```
// 局部推断
let x = 42                        // Int
let names = ["a", "b", "c"]      // List<Str>

// 双向推断
let f: fn(Int) -> Bool = fn(x) { x > 0 }

// 全局约束求解 + row poly
fn process(items) {
    items.filter(fn(x) { x.age > 18 }).map(fn(x) { x.name })
}
// 推断: items: List<{age: Int, name: Str, ..rest}>
```

### 3.2 标注等级由 Formatter 维护

配置 `lang.toml`：

```toml
[annotations]
level = 2
# 0 = 裸奔
# 1 = pub 函数签名
# 2 = 所有函数签名 + 模块边界 effect
# 3 = 所有签名 + 所有 effect + 复杂表达式
# 4 = 全标注

[annotations.effects]
ide_display = "inline"          # inline | gutter | highlight | none
materialize_as = "comment"      # comment | annotation | none
```

工作流：你手写 level 0 代码，`lang fmt` 按配置等级自动插入/更新标注。改了逻辑，标注自动跟着变。

```
// 你写的（level 0）：
fn process(items) {
    items.filter(fn(x) { x.age > 18 }).map(fn(x) { x.name })
}

// lang fmt 后（level 2）：
fn process(items: List<User>) -> List<Str> {
    items.filter(fn(x) { x.age > 18 }).map(fn(x) { x.name })
}
```

降级/升级标注只需要一个命令：

```bash
lang fmt --annotation-level 4    # code review 时全展开
lang fmt --annotation-level 1    # 日常开发最简洁
```

---

## 4. 方法调用与 impl 块

### 4.1 UFCS + impl 命名空间

`.method()` 是语法糖，第一个参数即 self。impl 块创建类型关联的命名空间，用于方法解析：

```
impl List<T> {
    fn map<U>(self, f: fn(T) -> U) -> List<U> { ... }
    fn filter(self, pred: fn(T) -> Bool) -> List<T> { ... }
}

impl Tree<T> {
    fn map<U>(self, f: fn(T) -> U) -> Tree<U> { ... }
}

my_list.map(fn(x) { x + 1 })   // 解析到 List.map
my_tree.map(fn(x) { x + 1 })   // 解析到 Tree.map
```

解析优先级：impl 块 > trait 实现 > 作用域内自由函数（UFCS 兜底）。

歧义时显式限定：

```
List.map(my_list, f)
Functor.map(my_tree, f)
```

自由函数仍可用 `.` 调用：

```
fn double(x: Int) -> Int { x * 2 }
42.double()                      // 无 Int.double impl，退到 UFCS
```

链式调用是唯一的方法调用风格——一种事只有一种写法：

```
users.filter(pred).map(f).sort()
```

### 4.2 impl 的定位

impl 不是 OOP——没有继承、没有 vtable、没有 this 指针。self 就是第一个参数，impl 就是给函数挂了个类型标签做查找。

---

## 5. OOP 手感模拟

底层没有 OOP 包袱，但给习惯 OOP 的场景提供等价的人体工学。

### 5.1 Trait 默认方法（"继承"的感觉）

```
trait Describable {
    fn name(self) -> Str
    fn kind(self) -> Str
    fn describe(self) -> Str {
        "${self.kind()}: ${self.name()}"
    }
}

struct User { name: Str, age: Int }

impl Describable for User {
    fn name(self) -> Str { self.name }
    fn kind(self) -> Str { "用户" }
    // describe 自动获得
}
```

### 5.2 Trait 组合（"多继承"无菱形问题）

```
trait Loggable {
    fn log_tag(self) -> Str
    fn log(self, msg: Str) { print("[${self.log_tag()}] ${msg}") }
}

trait Serializable {
    fn to_json(self) -> Str
}

impl Loggable for User {
    fn log_tag(self) -> Str { "User:${self.name}" }
}

impl Serializable for User {
    fn to_json(self) -> Str { ... }
}

// User 现在有 .describe() + .log() + .to_json()
```

### 5.3 委托（替代继承的复用机制）⚠️ 设计愿景，尚未实现

```
struct Admin {
    base: User,
    permissions: List<Str>,
}

impl Admin {
    delegate base: Describable, Loggable, Serializable
}

impl Describable for Admin {
    fn kind(self) -> Str { "管理员" }
    // name 和 describe 仍委托到 base
}

admin.describe()    // "管理员: yufeng"
admin.log("login")  // 转发到 User 的 Loggable 实现
```

### 5.4 Row Poly + Trait 交叉

```
fn greet_and_log<T: Loggable>(entity: {name: Str, ..} & T) -> Str {
    entity.log("被打招呼了")
    "你好, ${entity.name}"
}
```

### 5.5 动态分发（opt-in）⚠️ 设计愿景，尚未实现

```
fn process_all(items: List<dyn Describable>) {
    for item in items {
        print(item.describe())     // 动态分发
    }
}

let things: List<dyn Describable> = [user, admin, company]
process_all(things)
```

默认静态分发（泛型单态化），`dyn` 是主动选择运行时多态的标志。

### 5.6 OOP 概念映射表

| OOP 概念 | 本语言等价物 |
|----------|------------|
| class | struct + impl |
| 继承 | delegate + trait 默认方法 |
| 接口 | trait |
| 多态 | 泛型（静态）/ dyn（动态） |
| 鸭子类型 | row polymorphism |
| mixin | 多 trait impl |
| 向下转型 | pattern match on enum |

---

## 6. 模块系统

文件即模块。每个 `.ring` 文件是一个模块，通过 `use` 导入、`pub` 控制可见性。

### 6.1 文件级模块

```
// config.ring
pub struct Config {
    pub db_url: Str,
    pub port:   Int,
}

pub fn load(path: Str) -> Config {
    let raw = io.read(path)
    let table = toml.parse(raw)
    Config {
        db_url: table.get("db_url"),
        port:   table.get_int("port"),
    }
}
```

### 6.2 导入与可见性

```
// main.ring
use config                          // 导入 config.ring

let cfg = config::load("app.toml")

// 可以 pub use 重导出
pub use config
```

`pub` 可见性在多文件模式下强制执行，单文件模式不强制（向后兼容）。

### 6.3 未来方向 ⚠️ 设计愿景，尚未实现

- `sig` 模块签名（OCaml/SML 风格接口）
- 一等模块（模块作为值传递）
- ~~`inline mod` 块~~ ✅ 已实现（`pub mod name { ... }` 嵌套命名空间，声明自动加前缀 `mod_name::decl_name`）
- 相对路径导入（`super::`/`self::`）
- ~~Capability 限制~~ ✅ 已实现（`mod name requires {effects} { ... }` 语法，E0405 检查函数推断 effect 是否在 requires 集合内）

---

## 7. 内存管理 ⚠️ 设计愿景，当前使用 V8 GC

设计目标：分代并发 GC，开发者零心智负担。当前转译到 JS，直接使用 V8 GC。

- 所有分配由 GC 管理，无 Box/Rc/Arc/lifetime
- 小 struct 自动值语义（栈分配，copy-on-assign），编译器按大小和递归性判断
- 逃逸分析：短命对象不上堆
- GC 调优暴露为 effect（极少数场景如游戏帧循环）

```
effect gc_control {
    fn pause() -> Unit
    fn resume() -> Unit
}

fn render_frame() with {gc_control} {
    gc_control.pause()
    draw_scene()
    gc_control.resume()
}
```

---

## 8. 并发模型 ⚠️ 设计愿景，尚未实现

### 8.1 结构化并发

```
fn fetch_portfolio_data() -> PortfolioData {
    scope {
        let stocks_task = spawn { fetch_stocks() }
        let bonds_task  = spawn { fetch_bonds() }
        let gold_task   = spawn { fetch_gold() }

        PortfolioData {
            stocks: await(stocks_task),
            bonds:  await(bonds_task),
            gold:   await(gold_task),
        }
    }
}
```

### 8.2 async 是 effect，不是颜色

async 和 sync 代码无缝组合。handler 决定执行策略：

```
handle {
    let r = fetch_portfolio_data()
    process(r)
} with {
    async => runtime.multi_thread,   // 或 runtime.single（WASM）
}
```

### 8.3 Channel 通信

```
fn producer_consumer() {
    let ch = channel<Int>(buffer: 16)
    scope {
        spawn { for i in 0..100 { ch.send(i) }; ch.close() }
        spawn { for msg in ch { log("received: ${msg}") } }
    }
}
```

---

## 9. 实现策略：转译到 JavaScript

不自建运行时，站在 V8 的肩膀上。编译器是核心工作，JS 是代码生成目标。

### 9.1 架构

```
源码 → Parser → AST → 类型/Effect 推断 → Typed IR → JS 代码生成 → V8 执行
         ↑                ↑                              ↑
      我们的工作         核心数学            朴素翻译，V8 负责优化
```

性能不是目标——V8 的 JIT 对生成的 JS 代码（函数调用、对象创建、switch 分支）优化足够好，比 Python 快得多。编译速度是硬约束，因为 IDE 耦合的开发循环不能慢。

### 9.2 翻译映射

| 本语言 | 生成的 JS |
|--------|----------|
| struct | class（constructor + 字段） |
| enum | tagged object `{ _tag: "variant", ...fields }` |
| pattern match | switch/if 链 |
| trait + impl | dictionary passing（泛型）/ 直接调用（具体类型） |
| let / var | const / let |
| row poly | 直接属性访问（JS 天然鸭子类型，零翻译成本） |
| fail 冒泡（90%场景） | 直接就是 JS 的正常调用（无额外开销） |
| fail effect | throw / try-catch |
| catch 表达式 | try-catch 包装 |
| 完整 effect handler | evidence passing + EffectAbort try/catch |
| async effect | async/await 透传 |
| refinement 运行时检查 | if (!pred) throw |

### 9.3 Effect handler 的 JS 编码

90% 的 fail 场景特化成 try/catch（零额外成本）。完整 handler 用 evidence passing：

```javascript
// handle { load_config(path) } with { fail(e) => default_config() }
// 编译为：
try {
  load_config(path, __ev_io, { raise: (e) => { throw new __EffectAbort(e); } });
} catch (__e) {
  if (__e instanceof __EffectAbort) { default_config(); }
  else { throw __e; }
}

// 完整 effect handler（测试 mock 等复杂场景）：
// handle { read_config() } with { io.read(path) => "mock-data" }
// 编译为 evidence 对象构造：
const __ev_io = { read: (path) => { throw new __EffectAbort("mock-data"); } };
try {
  read_config(__ev_io);
} catch (__e) {
  if (__e instanceof __EffectAbort) { return __e.value; }
  throw __e;
}
// 函数签名自动注入 evidence 参数：read_config(__ev_io) 而非 generator yield
```

### 9.4 多端覆盖

JS 宿主天然覆盖全部目标平台：
- Web：浏览器直接运行
- 桌面：Electron / Tauri
- 移动：React Native / Capacitor
- 服务端：Node / Deno / Bun
- CLI：Node 单文件

平台抽象仍然通过 trait 设计，编译时绑定具体平台模块。条件编译作为逃生舱保留：

```
fn get_data_dir() -> Str {
    when platform {
        node    => "${env("HOME")}/.myapp",
        browser => "/virtual/data",
        mobile  => app_data_dir(),
    }
}
```

### 9.5 JS 生态互操作

npm 包是事实上的标准库扩展。通过 `extern` 声明引入 JS 函数，手动标注类型和 effect：

```
extern "npm:express" {
    fn create_app() -> App with {io}
    fn listen(app: App, port: Int) -> Unit with {io, async}
}
```

---

## 10. LLM 友好性设计

额外设计目标：让 LLM 在零训练数据的情况下，vibe coding 大规模代码库的表现优于 JS/TS。

### 10.1 核心论点

**编译器严格度 = LLM 安全网面积。** 同样的 prompt，TS 编译器放行的代码中藏着运行时炸弹，本语言的编译器在 LLM 提交前就炸出来了。LLM 少的是训练数据，但它多了一个比 TS 严格 10 倍的 pair reviewer。

### 10.2 具体设计决策

**语法借用——最大化知识迁移：**
- `fn`/`let`/`var`/`struct`/`enum`/`match`/`trait`/`impl` 全部来自 Rust
- `"${x}"` 字符串插值来自 JS/Kotlin
- `//` 行注释来自 C/JS/Rust（最大化 LLM 已有知识迁移）
- `or` 来自 Python
- 不发明新关键字，除非语义确实是新的（如 `handle...with`）

**一种事只有一种写法：** TS 里定义数据结构有 interface/type/class/literal 四种写法，LLM 每次选不同的导致大型代码库风格混乱。本语言只有 `struct`，错误触发只有 `raise`，错误恢复只有 `catch`，effect 替换只有 `handle...with`，异步只有 `spawn/await`，方法调用只有 `.method()` 链式风格（无管道运算符）。LLM 的输出天然一致。错误处理看似有多种机制，但它们对应错误生命周期的不同阶段（流动/恢复/物化/替换），不是同一件事的不同写法。

**模块签名 = LLM 的完美上下文压缩：** LLM 上下文窗口有限。TS 要读完实现才知道函数会抛什么异常；本语言的模块签名包含完整契约（类型+效果），一行顶 TS 几十行，LLM 用更少 token 获得更多 API 信息。

**标注等级匹配 vibe coding 工作流：** LLM 生成 level 0 代码（最少 token，最快），formatter 自动补全到 level 2，人类扫一眼签名审查。

**编译器错误驱动自修正：** 提供 `--error-format=llm` 输出结构化错误，包含可直接复制的修复代码建议：

```json
{
  "error": "refinement_unsatisfied",
  "expected": "Int where 1024 < it < 65536",
  "actual": "Int",
  "fix_hint": "let port = parse_int(raw); if port <= 1024 ... { raise(...) }",
  "alternative": "parse_int(raw) or 8080"
}
```

### 10.3 量化指标

| 指标 | 含义 |
|------|------|
| 首次编译通过率 | 同一 prompt，LLM 生成后首次编译通过的比例 |
| 运行时错误率 | 编译通过后实际运行时出错的比例（本语言应远低于 TS） |
| 自修正轮数 | 首次生成到编译+测试通过的迭代次数 |
| Token 效率 | 完成同一功能的总 token 数（生成+修正） |
| 大库一致性 | 100+ 文件代码库中风格/模式的一致性评分 |

核心赌注：首次编译通过率可能低于 TS（编译器更严格），但运行时错误率和总迭代轮数远低于 TS。

### 10.4 控制论视角：无人回路

设计公理 4 的理论根基。当前 LLM 开发工具链（如 Claude Code）中，人类在回路里承担三个控制论角色：

| 角色 | 控制论术语 | 人类做什么 |
|------|-----------|-----------|
| 观测器 | Observer | 看代码对不对、看行为是否符合预期 |
| 判决器 | Controller | approve / reject / 修正方向 |
| 兜底 | Stability guarantee | 系统再怎么跑偏，人最终能拉回来 |

**把人踢出回路，这三个功能不会消失，必须由语言和工具链接管。**

**前馈控制——编译器替代观测器和判决器：**

控制论中前馈控制在错误发生前阻止，反馈控制在错误发生后纠正。Ring 的安全特性本质上是把反馈控制（测试、review、监控）转化为前馈控制（编译时拦截）：

| 语言特性 | 替代人类的哪个判断 |
|----------|------------------|
| Refinement types | "这个参数合法吗？" — 编译器直接拦截非法值 |
| Linear types | "资源释放了吗？" — 编译器保证恰好使用一次 |
| Effect 标注 | "这个函数有副作用吗？" — 签名可见，不需读实现 |
| 穷尽匹配 | "所有 case 都处理了吗？" — 编译器强制穷尽 |
| `--error-format=llm` | "错误信息看懂了吗？" — 结构化输出，LLM 直接消费 |

**每加一个类型安全特性，就是把一个原本需要人当观测器+判决器的场景，交给编译器自动完成。**

**反馈控制——补全编译器覆盖不到的语义正确性：**

前馈控制（编译器）不可能覆盖全部——编译通过 ≠ 语义正确。反馈回路仍然必要：

- **自举 dogfooding**：Ring 编译器用 Ring 写，编译器自身的 bug 是最直接的反馈信号——修类型系统 → 同类 bug 永远消失。这比测试驱动更强，因为修的是约束本身
- **Property-based testing / fuzzing**：编译器保证类型正确，自动测试保证语义正确，两层叠加后 LLM 输出才能不经人审就上线
- **Effect 系统作为可观测性**：副作用被类型追踪后，运行时行为变得可预测，等于自带观测器

**飞轮策略的控制论表述：**

飞轮（见 13.4 节学术验证）用控制论语言重新表述：

> **用类型系统最大化前馈控制的覆盖面，用自动测试补全反馈控制，直到闭环足够紧密，人可以退出回路。**

"安全特性优先于性能特性"的判断等价于：**先把控制器造好，再提升被控对象的性能。** 反过来做（先上 LLVM/JIT 追求性能）等于给一个没有控制器的系统加大油门。

---

## 11. 性能分析与优化策略

Phase 1 全部朴素翻译，不做优化。以下分析各特性的性能瓶颈及编译器侧解法，供 Phase 2+ 按优先级逐个实施。所有优化都在编译器侧完成，不修改运行时。

### 11.1 Effect Handler 的 Generator 开销（影响：最高）

完整 effect handler 用 generator 编码时，每次 yield 涉及帧保存/恢复和堆分配。V8 的 TurboFan 基本不内联 generator 函数，热路径可能慢 10-100x。

**解法：编译期特化 + evidence passing**

编译器静态分析 handler 行为，绝大多数场景消除 generator：

```
-- fail handler 只是捕获 → 特化为 try/catch
handle { load_config(path) } with { fail(e) => default() }
-- 生成: try { load_config(path) } catch(e) { default() }

-- io handler 只是穿透 → 完全消除
handle { pipeline() } with { io => perform }
-- 生成: pipeline()  （无额外代码）

-- 只有 effect 重解释（如测试 mock）才保留完整机制
```

对于无法特化的场景，采用 evidence passing（Koka 论文的核心优化）——handler 引用作为隐藏参数传递，effect 操作变成直接调用：

```javascript
// evidence passing 风格的 JS 输出
function load_config(path, __ring_ev_io, __ring_ev_fail) {
    const raw = __ring_ev_io.read(path);
    const data = __ring_ev_fail.try_(() => json_parse(raw));
    return data;
}
// 零 generator，零 yield，只是函数调用 + 间接引用
// V8 的 inline cache 可以优化间接调用
```

### 11.2 不可变数据的拷贝开销（影响：高）

函数式风格下 filter/map/spread 每次创建新对象，大集合或深嵌套结构产生大量短命对象。

**解法 A：持久化数据结构**

标准库的 List/Map 底层用 HAMT 或 RRB-Tree，结构共享：

```
let new_list = old_list.push(item)
-- 底层只创建 O(log n) 个新节点，共享其余结构
```

JS 生态有成熟实现可集成。

**解法 B：线性性检测**

编译器做数据流分析：旧值之后无引用 → 安全就地修改：

```
let result = old_list.filter(f).map(g).sort()
-- 如果 old_list 此后无引用，直接在原数组上操作
```

**解法 C：融合（deforestation）**

消除中间数据结构，多次遍历合并为一次：

```
-- 源码: users.filter(f).map(g).filter(h)
-- 朴素: 3 次遍历，2 个中间数组
-- 融合: 1 次遍历，1 个结果数组
```

三种解法可叠加。

### 11.3 Row Poly 导致 V8 去优化（影响：中）

Row-polymorphic 函数被多种 object shape 调用时，V8 的 inline cache 从 monomorphic → polymorphic → megamorphic，回退到字典查找（慢 5-10x）。

**解法：热路径单态化**

编译器分析调用点，热循环中只有 1-2 种具体类型的 row-poly 函数生成特化版本：

```javascript
// 编译器发现 greet 在此循环中只接收 User
function greet_User(person) { return "hello, " + person.name; }
// V8 看到单态调用，全力 JIT

// 冷路径保留泛用版
function greet(person) { return "hello, " + person.name; }
```

### 11.4 Refinement 运行时检查冗余（影响：中）

热循环中每次迭代重复检查同一约束。

**解法：检查提升 + refinement 传播**

```
-- 如果类型已是 List<Item where price > 0>
-- 元素级 refinement check 完全消除

-- 如果类型是 List<Item>（未 refined）
-- 检查提升到循环入口，一次性验证
for item in items {
    assert_refine(item)    // 只在入口一次
    compute(item)           // 内部不再检查
}
```

本质是 refinement 的 SSA 传播：变量在某程序点被证明满足约束后，后续同一约束检查全部消除。

### 11.5 闭包创建的 GC 压力（影响：低）

管道中多个小闭包产生堆分配。V8 能内联小闭包，但复杂管道可能超出内联预算。

**解法：闭包合并**

配合融合优化，多个闭包合并为单次遍历中的一个合并函数。与 11.2 的 deforestation 自然联动。

### 11.6 优先级矩阵

| 瓶颈 | 影响 | 解法 | 实现难度 | 阶段 |
|------|------|------|---------|------|
| Effect handler generator | 最高 | 编译期特化 + evidence passing | 中 | Phase 2 |
| 不可变拷贝 | 高 | 持久化数据结构 + 线性性检测 + 融合 | 中 | Phase 2 |
| Row poly 去优化 | 中 | 热路径单态化 | 中 | Phase 3 |
| Refinement 冗余检查 | 中 | 检查提升 + SSA 传播 | 低 | Phase 2 |
| 闭包 GC 压力 | 低 | 闭包合并 + 融合 | 中 | Phase 3 |

---

## 12. 竞品与行业定位

详细分析见 [`docs/competitive-analysis.md`](competitive-analysis.md)。核心结论：

**Ring-lang 的独特组合（完整代数效果 + HM 推断 + LLM 友好性）仍无直接竞品。** 最接近的三个方向各有缺失：Zero 有工具链但无效果系统，MoonBit 有成熟度但只追踪错误，Mog 有极简规范但无高级类型。

---

## 13. 企业级性能路线

JS 后端是原型限制，不是架构限制。核心研究问题已被 Koka 等项目解决。

### 13.1 Koka 的启示

Koka（微软研究院）通过两项技术达到 C 性能的 75-85%：
- **Evidence passing**：effect handler 编译为函数调用 + evidence 向量查找，开销等价于 OOP 虚方法调用
- **Perceus**：精确引用计数 + 就地复用分析，完全消除 GC 停顿

### 13.2 编译目标升级路线

| 阶段 | 后端 | 性能水平 | 对标 |
|------|------|---------|------|
| 当前 | JS (V8) | V8 水平 | TypeScript 同级 |
| +LLVM | LLVM native | C 的 2-3x | Go/OCaml 同级 |
| +Perceus | LLVM + Perceus 引用计数 | C 的 1.2-1.5x | Koka/Swift 同级 |

JS 后端是 Web/全栈的长期方案——其卖点是生态覆盖和开发体验，不是性能。LLVM 后端面向桌面/服务端场景中有真实性能需求的用户。

### 13.3 关键技术路径

- **LLVM native** 用于桌面/服务端。Koka 编译到 C 再 gcc/clang，Kotlin/Native 直接用 LLVM。已证明可行。
- **Perceus 引用计数** 替换 GC。无停顿、确定性析构、函数式代码可就地复用已死对象的内存。语言设计无需修改——Perceus 是编译器优化，用户代码不感知。
- **Evidence passing** 替换 generator effect handler。同样是编译器优化，用户代码不感知。

### 13.4 先例

- **Swift**：~4 年从"脚本手感"到系统级性能（Apple 全力投入）
- **Kotlin**：JVM → LLVM native，与 Swift 性能差距 ~15%
- **Koka**：已达到 C 的 75-85%，纯研究院项目

---

## 14. 编译器实现

**当前状态：自举完成（2026-05-21）。** 编译器已从 TypeScript 完全翻译为 31 个 Ring 源文件（~14,260 行），编译到 JS 运行于 V8。TS 原始实现归档于 git tag `ts-compiler-final`。

**Koka 作为参考实现**：Effect 推断（`InferEffect.hs`）和 evidence passing（`Evidence.hs`）的算法翻译自 Koka 编译器（MIT 许可）。未来 Perceus 引用计数也将参考其实现。

**自举叙事价值**：Ring-lang 的编译器用 Ring-lang 写，由 Claude vibe-coded——同时证明语言能构建复杂系统、LLM 能高效使用。

---

## 设计取舍

| 拿到了什么 | 付出了什么 |
|-----------|-----------|
| Effect 系统统一所有副作用 | 编译器实现极其复杂 |
| Refinement types 编码业务规则 | 静态验证有极限，部分退化为运行时检查 |
| 全推断 + formatter 维护标注 | 类型错误信息可能难以理解 |
| 转译到 JS，零运行时成本 | 性能天花板受 V8 限制（对玩具无所谓） |
| Row poly + OOP 手感 | 与现有 class-based 生态互操作需要 extern 声明 |
| Dependent types lite | 约束求解可能不可判定，需要保守边界 |
| LLM 友好的严格编译器 | 首次编译通过率可能低于 TS |
| 一种事一种写法 | 老手可能觉得缺乏灵活性 |

## 附录：实现状态（2026-05-22 更新）

### 已落地的设计决策

| 设计点 | 决策 | 理由 |
|--------|------|------|
| Effect handler 语义 | tail-resumptive + abort（非 full algebraic） | evidence passing 天然支持 tail-resume；post-resume 需 delimited continuation |
| `or`/`try`/`?` 运算符 | 已移除，使用 `unwrap`/`to_fail`/`to_result()`/`catch` | 简化语法面，减少歧义 |
| catch 语义 | 总是消除 fail effect；部分处理用 catch 内部 match + re-raise（显式） | 消除隐式行为（原设计中有/无 catch-all arm 决定不同类型行为），降低概念数 |
| 错误模型 | 生命周期模型：fail effect 为主（诞生/流动），to_result 物化为数据（落地） | effect 是运动形态，Result 是静止形态；双模型各有地盘而非竞争 |
| 可变性统一模型 | `var` → `let mut`，`Cell<T>` 消除，`mut` 为唯一可变关键字 | 局部 mutation 不 box 不追踪（非 side effect）；闭包捕获/mut 参数自动 box + `mut<T>` effect |
| `++` 拼接运算符 | 不实现，使用字符串插值 | "一种事一种写法"原则 |
| Lambda 双向类型传播 | receiver 统一提前 + lambda 接受 expected param types | 支持 `==` 在嵌套 closure 中正确推断 |
| fn 类型 effect 标注 | `fn(T) -> U with {io}` 语法，无标注时 open row | 支持 HOF callback 的 effect 多态 |
| impl bounds | `impl<T: Eq> List { ... }` 语法 | 前置条件：Eq trait 约束迁移到 impl 方法 |
| mod capability | `mod name requires {effects} { ... }` 语法 | 模块级 effect 限制，E0405 错误码 |

### 幽灵功能（已解析但无语义效果）

以下语法 Parser 接受但 Checker/Codegen 不处理，保留作为扩展点：

| 功能 | 解析行为 | 激活时机 |
|------|---------|----------|
| `where` 精化子句 | 消费 tokens 后丢弃 | refinement types |
| Supertrait | AST 字段存在，始终为空 | 后续 trait 增强 |
| Resume 参数名 | AST/HIR 字段存在，无语法触达 | full algebraic effects |

### 实现偏差备忘

- **Enum 单元变体语法设计**：声明和模式匹配使用 `red()`（带空括号），构造使用 `red`（无括号裸名）。设计原因：声明时与命名字段变体区分；构造时单元变体是值非函数调用；模式匹配时区分于绑定变量
- **比较运算符非结合性**：parser 拒绝 `a == b == c`，有意行为
- **`+=`/`-=` 复合赋值**：支持
- **`Str.replace` 全替换语义**：对应 JS `replaceAll`，替换所有匹配项
- **单元素 `(expr)` 不是 tuple**：与 Rust/Python 一致
- **Parser 换行感知**：`(` 跨行时不触发函数调用（防止 `42\n(...)` 被解析为调用）

### 自举翻译中发现的语言限制（2026-05-21）

将 ~13,340 行 TS 编译器翻译为 ~14,260 行 Ring 代码（31 文件），以下限制在实际大规模 Ring 编程中反复出现：

**字符串处理**：
- **插值不支持嵌套引号**：`"\{fn("arg")}"` 解析失败——内层 `"` 被视为外层字符串终止。必须预计算到变量再插值。在 codegen 模块中每次函数调用带字符串参数都需要额外 `let`，代码量膨胀约 15%
- **无 `+` 拼接运算符**：所有字符串拼接只能用 `"\{a}\{b}"` 或 `List<Str>.join()`。构建复杂 JS 代码字符串时需要大量 `List<Str> + push + join("")`，可读性低于 TS 的 template literal
- **`$\{` 与 JS template literal 冲突**：Ring 的 `${...}` 与 JS 的 `${...}` 语法相同，codegen 生成 JS template literal 时需要 `escape_for_template_literal()` 逐字符构建

**集合与索引**：
- **`List.get(i)` 返回 `Option<T>`，无直接下标**：安全但冗长，翻译大型 switch/case 分发逻辑时每次索引需要 `match list.get(i) { some(v) => ..., none => ... }`。实际做法是封装 `_at(list, i)` helper（panic on out-of-bounds），但每个类型需要独立 helper（无泛型 helper 跨类型复用）
- **`[x].clear()` 返回 `Unit` 不可链式**：空列表构造必须三条语句 `let x = [dummy]; x.clear(); x`，封装为 `empty_xxx()` 但每种元素类型需独立函数。31 个源文件中共定义了约 40 个 `empty_xxx()` helper
- **无 `List.set(i, v)`**：修改列表中间元素需重建整个列表

**控制流**：
- **`return` 不能在 match arm 表达式位置**：match arm 是表达式，`return` 是语句级构造。需要提取为独立函数或改用 if-else。codegen_expr 中 eq/ord dispatch 的 early-return 模式需要完全重构
- **Struct literal 不能在条件位置**：`if x == MyStruct { f: 1 } { ... }` 歧义，parser 无法区分 struct literal 和块。需用括号或变量绑定（Go/Rust 同有此限制）

**类型推断**：
- ~~**空列表 `[]` 类型推断失败**~~：已修复（Phase 3）。`let x: List<T> = []` 和上下文推断均正常
- **`.map()` 闭包不能捕获 `var` 变量**：HOF 闭包内引用 `var ctx` 会报错，需改用 `for` 循环 + `push`

### 未实现特性优先级

**中（增强表达力）**：关联类型、`delegate`、supertrait 继承

**低（研究向）**：`dyn Trait`、`async`/`spawn`/`Future`、refinement types、dependent types lite、平台条件编译

---

## 一句话

纯函数为心脏，effect 为血管，类型为骨骼，推断为皮肤——摸到的是 Python 的手感，内部跑的是 Haskell 的引擎。
