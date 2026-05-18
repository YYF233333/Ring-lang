# Ring-lang 设计文档

一门面向大型多端应用开发的理想编程语言。追求良好的工程 scalability，内化最佳工程实践，可以轻松驾驭 Web + 移动 + 桌面的全栈场景。

思想实验起步，允许激进的学术设计。额外目标：让 LLM 也喜欢写这门语言——如果 LLM 在零训练数据的情况下，vibe coding 大规模代码库的表现能干掉 JS/TS，就是将玩具打磨成熟的强 argue。

## 设计公理

1. **类型即模型，不是谜题** — 类型系统表达力上限很高（refinement types、dependent types lite、GAT），但语法让简单场景零注解，复杂场景读起来像自然语言约束。强力但不鼓励类型体操：类型建模实际问题，不耍杂技。
2. **效果即可见性** — 函数的副作用（IO、失败、可变、异步）全部由 effect system 在类型层追踪。编译器全推断，人通过 IDE 幽灵标注感知冒泡点。只在模块边界处显式声明。
3. **推断为王，标注为仆** — Bidirectional + constraint solving + effect inference。写代码的体验接近 Python，编译器内部看到完整类型+效果信息。标注由 formatter 按配置等级自动生成维护，人只控制详细度。

## 偏好约束（来自用户画像分析）

| 维度 | 倾向 |
|------|------|
| 范式 | 过程式 + 函数式，零 OOP 语义（但模拟 OOP 手感） |
| 命名 | snake_case，ALL_CAPS 常量 |
| 不可变 | 默认不可变，`var` 显式声明可变 |
| 错误 | 错误即类型，effect 自动冒泡，4 层甜度分级 |
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

### 1.5 Option 与 fail 的统一

`Option<T>` 作为数据类型存在（struct 字段需要它），但与 fail effect 通过 `?` 和 `try` 双向桥接。用户不需要关心底层区分——`or` 两边都吃。

```
// Option 是数据类型，T? 是 Option<T> 的糖
enum Option<T> { some(T), none }

struct User {
    name:     Str,
    nickname: Str?,               // 数据层面的"有或没有"
}

// ? 后缀：Option → fail effect（提升）
fn get_nickname(user: User) -> Str {
    user.nickname?                // none → raise(Unit)，自动冒泡
}

// try 块：fail effect → Option（捕获）
let maybe_user: User? = try { find_user(42) }

// or 按表达式类型 dispatch：Option 或 fail，二选一
let nick = user.nickname or "匿名"         // Option 层面：unwrap or default
let user = find_user(42) or default_user()  // fail effect 层面：try/catch
```

设计原则：**Option 是数据，fail 是计算。`?` 从数据进入计算，`try` 从计算回到数据。`or` 是统一的兜底语法，按表达式类型选择 Option path 或 fail path，不混合（若表达式既是 `Option<T>` 又带 `fail`，`or` 只处理 Option，fail 需另行处理）。**

### 1.6 闭包捕获

默认不可变值捕获。共享可变状态通过 `Cell<T>` 显式标记：

```
// 不可变捕获（默认，安全）
let x = 10
let f = fn() { x + 1 }          // 捕获 x 的副本

// 共享可变状态用 Cell
let counter = Cell(0)
let inc = fn() { counter.update(fn(n) { n + 1 }) }
let get = fn() { counter.get() }

inc(); inc(); inc()
get()  // 3
```

Cell 的操作带 `mut` effect，自动被推断和追踪：

```
impl Cell<T> {
    fn get(self) -> T with {mut}
    fn set(self, val: T) -> Unit with {mut}
    fn update(self, f: fn(T) -> T) -> Unit with {mut}
}

// 用了 Cell 的代码自动带 mut effect
// IDE 幽灵标注会显示
```

闭包本身无特殊规则——它就是捕获值的函数。可变性在 Cell 上，不在闭包上。GC 兜底意味着不需要 borrow checker，Cell.update 接受函数而非暴露引用，不会有 RefCell 式的运行时 panic。

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

### 2.2 Effect 推断

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

### 2.3 错误处理 4 层甜度

**层级 0：传播——免费冒泡，零语法**

```
fn load_portfolio(path: Str) -> Portfolio {
    let raw = io.read(path)       // io + fail 自动冒泡
    let data = json.parse(raw)    // fail 自动冒泡
    validate(data)                 // fail 自动冒泡
}
// 不需要 ? 或 try，effect 天然向上传播
```

**层级 1：兜底——`or` 表达式**

```
let config = load_config("custom.toml") or default_config()
let port = parse_int(port_str) or 8080
```

**层级 2：轻量捕获——`catch` 表达式**

```
let config = load_config(path) catch fn(e) { log(e); default_config() }
let data = process(input) catch ParseError fn(e) { fallback(input) }
```

**层级 3：错误转换——`map_fail`**

```
let config = load_config(path).map_fail(fn(e) { AppError.config(e) })
```

**层级 4：完整 handler——复杂场景**

```
handle {
    let result = complex_pipeline()
    save(result)
} with {
    fail(e: ValidationError) => log_and_skip(e),
    fail(e: IoError)         => default_result(),
    io                       => perform,
}
```

### 2.4 Effect Handler 用于测试 Mock

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

### 2.5 Effect 多态

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

### 2.6 Effect 冒泡可见性

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

### 5.3 委托（替代继承的复用机制）

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

### 5.5 动态分发（opt-in）

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

一等模块 + 签名 + 密封，OCaml/SML 风格。

### 6.1 模块 = 命名空间 + 编译单元 + 可见性边界

```
pub mod config {
    struct Config {
        pub db_url: Str,
        pub port:   Int where 1024 < it < 65536,
    }

    pub fn load(path: Str) -> Config with {io, fail<ConfigError>}
}

mod config {
    fn load(path: Str) -> Config {
        let raw = io.read(path)
        let table = toml.parse(raw)
        Config {
            db_url: table.get("db_url"),
            port:   table.get_int("port"),
        }
    }
}
```

### 6.2 一等模块——模块作为值传递

```
sig Storage {
    fn save(key: Str, data: Bytes) -> Unit with {io, fail<StorageError>}
    fn load(key: Str) -> Bytes with {io, fail<StorageError>}
}

mod local_storage : Storage { ... }
mod s3_storage : Storage { ... }
mod mock_storage : Storage { ... }

fn init_app(storage: Storage) -> App {
    let config_data = storage.load("config")
    ...
}

let app = init_app(s3_storage)
let test_app = init_app(mock_storage)
```

---

## 7. 内存管理

分代并发 GC，开发者零心智负担。

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

## 8. 并发模型

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
| or / catch 表达式 | try-catch 包装 |
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

**一种事只有一种写法：** TS 里定义数据结构有 interface/type/class/literal 四种写法，LLM 每次选不同的导致大型代码库风格混乱。本语言只有 `struct`，错误只有 `raise`，异步只有 `spawn/await`，方法调用只有 `.method()` 链式风格（无管道运算符）。LLM 的输出天然一致。

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

## 12. MVP 路线图

以 JS 为宿主，分三阶段：

### 12.1 Phase 1：可以玩的编译器

高信心交付。完成后可以写设计文档综合示例级别的代码。

- Parser（递归下降）
- struct + enum + pattern matching（穷尽性检查）
- HM 类型推断（函数签名大部分不用写）
- UFCS + impl 块方法解析
- fail effect 的 4 层甜度（冒泡/or/catch/handle）
- JS 代码生成 + 运行

### 12.2 Phase 2：有手感的语言

中信心，需要迭代。

- Trait 系统 + 泛型约束
- Effect 推断（io + fail + mut）
- Row polymorphism
- 完整 effect handler（generator 编码）
- ~~基础 LSP server~~ ✅ 已实现全功能 LSP（diagnostics/hover/completion/definition/references/rename/symbols/code-actions）+ VSCode 插件
- `--error-format=llm` 结构化错误输出
- 性能优化：effect 编译期特化 + evidence passing、refinement 检查提升/消除、持久化数据结构

### 12.3 Phase 3：研究向扩展

低信心，探索性质。

- Refinement types（简单谓词自己做 / 复杂约束接 Z3）
- Dependent types lite
- Formatter 自动标注等级系统
- 完整 effect 多态
- 模块签名 + 一等模块
- 性能优化：热路径单态化、线性性检测就地修改、融合 + 闭包合并

---

## 13. 竞品与行业定位

### 13.1 MoonBit——最直接的竞品

MoonBit（ICSE 2024 论文，2025 beta）由张宏波创建（OCaml 核心贡献者、BuckleScript/ReScript 作者、前 Meta Flow 团队），深圳 IDEA 研究院。在实现成熟度上远远领先 Ring-lang。

**重叠度高：**

| 特性 | MoonBit | Ring-lang |
|------|---------|-----------|
| 类型系统 | ML 系：ADT + 泛型 + trait + 推断 | ML 系：ADT + 泛型 + trait + 推断 |
| 不可变优先 | 是 | 是 |
| 编译目标 | WASM + JS + Native（Perceus RC） | JS 原型，计划 WASM + Native |
| AI 友好 | ICSE 论文 + constrained decoding + `declare` 关键字 | 语言设计 + 编译器反馈 + 模块签名压缩 |
| 编译速度 | 极快（号称 9x Rust） | 依赖 TS→JS |

**核心差异——Ring-lang 追踪的范围更广：**

| | MoonBit | Ring-lang |
|---|---------|-----------|
| 错误追踪 | `raise`/`suberror`，编译时追踪 | `fail<E>` effect，编译时追踪 |
| IO 追踪 | 不追踪——签名看不出是否有 IO | `io` effect 签名可见 |
| 可变性追踪 | 不在类型中追踪 | `mut` effect 签名可见 |
| 异步追踪 | 不追踪 | `async` effect 签名可见 |
| Effect handler | 无 | 完整：声明、推断、handler、重解释、测试 mock |
| Refinement types | 无 | 核心特性 |
| Row polymorphism | 无 | 核心特性 |
| Dependent types lite | 无 | 计划特性 |

一句话：**MoonBit 追踪错误，Ring-lang 追踪一切副作用。** 对 LLM 而言，Ring-lang 的模块签名携带更多信息，LLM 需要更少上下文即可正确使用 API。

**诚实评估：MoonBit 在实现和工程上全面领先。** Ring-lang 的理论独特性在 effect 系统完整性和 refinement types。如果要推进，必须能回答"为什么 effect 系统比 MoonBit 的 checked exceptions 值得额外的复杂度？"

### 13.2 其他项目

- **Pel**（2025 arXiv）：AI agent 编排语言，解决 agent 间通信，非"agent 写代码"
- **PACT**：概念级 LLM 友好语言，零歧义语法，编译到 Rust，无成熟实现

**没有任何现有项目组合了完整代数效果 + HM 推断 + LLM 友好性。**

注：MoonBit 曾被评估为 fork 基础，但因 MoonBit Public License（魔改 SSPL）禁止商业 fork 而排除。其性能数据（"比 Rust 快 9x"等）为自报，无独立基准验证。HN 上曾出现质疑帖。二进制大小优势主要来自 WasmGC 不打包运行时，非 MoonBit 独有。

### 13.3 现有语言的态度

现有语言**没有从设计层面拥抱 Agent**。适配全在工具层：LSP 成为 AI agent 主要接口，agent-lsp 项目在 language server 上包装 AI 专用能力。没有任何语言团队公开讨论过"为 AI 改语言设计"。

### 13.4 "死亡螺旋"风险

新语言训练数据少 → LLM 写得差 → 没人用 → 训练数据更少。Ring-lang 的缓解：严格编译器本身就是一致性验证器，`--error-format=llm` 让 LLM 靠编译器反馈自修正而非靠训练数据。MoonBit 的缓解：constrained decoding 从采样层保证正确性，但需要特定 AI 管线。

---

## 14. 企业级性能路线

JS 后端是原型限制，不是架构限制。核心研究问题已被 Koka 等项目解决。

### 14.1 Koka 的启示

Koka（微软研究院）通过两项技术达到 C 性能的 75-85%：
- **Evidence passing**：effect handler 编译为函数调用 + evidence 向量查找，开销等价于 OOP 虚方法调用
- **Perceus**：精确引用计数 + 就地复用分析，完全消除 GC 停顿

### 14.2 编译目标升级路线

| 阶段 | 后端 | 性能水平 | 对标 |
|------|------|---------|------|
| 当前 | JS (V8) | V8 水平 | TypeScript 同级 |
| +WasmGC | WasmGC (所有主流浏览器已支持) | JS 的 ~2x | Dart/Kotlin-WASM 同级 |
| +LLVM | LLVM native | C 的 2-3x | Go/OCaml 同级 |
| +Perceus | LLVM + Perceus 引用计数 | C 的 1.2-1.5x | Koka/Swift 同级 |

### 14.3 关键技术路径

- **WasmGC** 已成为 W3C 标准（2025），Google Sheets 实测 2x 于 JS。Dart/Kotlin/Java 已有后端。这是最优先的升级——替换 JS 后端即可获得 Web 端的实质性能提升。
- **LLVM native** 用于桌面/服务端。Koka 编译到 C 再 gcc/clang，Kotlin/Native 直接用 LLVM。已证明可行。
- **Perceus 引用计数** 替换 GC。无停顿、确定性析构、函数式代码可就地复用已死对象的内存。语言设计无需修改——Perceus 是编译器优化，用户代码不感知。
- **Evidence passing** 替换 generator effect handler。同样是编译器优化，用户代码不感知。

### 14.4 先例

- **Swift**：~4 年从"脚本手感"到系统级性能（Apple 全力投入）
- **Kotlin**：JVM → LLVM native，与 Swift 性能差距 ~15%
- **Koka**：已达到 C 的 75-85%，纯研究院项目

---

## 15. 编译器实现

### 15.1 Bootstrap 编译器：TypeScript

编译器、LSP、formatter 均用 TypeScript 实现（路线 A：从零开始）。理由：
- LLM（Claude）写 TS 最稳
- 和目标生态一致（都是 JS）
- 迭代速度最快（无编译步骤）
- VS Code 扩展天然 TS
- 标准库用 Ring-lang 自己写（最早的 dogfooding）

曾考虑的替代路线：
- **Fork MoonBit**：MoonBit Public License（魔改 SSPL）禁止商业 fork，且加 effect 系统需要从 Core IR 层重写。排除。
- **Fork Koka**：MIT 许可，已有 effect 系统 + Perceus。但 Haskell 代码库，LLM 写 Haskell 不如 TS 稳，且不是为 fork 设计的。排除作为 fork 基础，**但作为参考实现**。

### 15.2 Koka 作为参考实现

Koka（MIT 许可）在以下子系统上有已验证的实现，Ring-lang 的 TS 编译器应参考其算法和设计：

| 子系统 | Koka 中的实现 | Ring-lang 如何复用 |
|--------|-------------|-------------------|
| Evidence passing | `Evidence.hs` — handler 引用作为隐藏参数 | 翻译算法到 TS，用于 JS 代码生成 |
| Effect 推断 | `InferEffect.hs` — row-based effect typing | 参考推断规则和约束求解策略 |
| Perceus 引用计数 | `Perceus.hs` — 精确 RC + 就地复用 | 未来 native 后端时移植算法 |
| Effect 到普通函数的编译 | `CPS.hs` / `Evidence.hs` | 翻译为 JS generator 和 evidence passing 的混合方案 |

原则：算法和论文可抄，代码结构按 TS 惯例重写。复杂子系统（effect 推断、evidence passing）参考 Koka 已验证的实现避免重新踩坑。

### 15.3 渐进式自举

Phase 2 完成后开始用 Ring-lang 重写编译器模块，按复杂度递增：
1. Formatter（纯 AST→AST 变换）
2. Codegen（IR→JS 翻译）
3. Parser（递归下降，ADT + match 天然适合）
4. Checker（类型推断 + effect 推断，最复杂）

验证方式：新实现的输出与 TS 版本做 diff，应完全一致。

自举约束：只能使用 Phase 2 子集（无 refinement、无 dependent lite）。如果 Phase 2 语言足以写自己的编译器，说明核心设计完备。

自举的叙事价值：**"Ring-lang 的编译器是用 Ring-lang 写的，由 Claude vibe-coded"**——同时证明语言能构建复杂系统、LLM 能高效使用、effect 系统在编译器场景好用。

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

## 附录：实现状态（2026-05-19 更新）

### 已落地的设计决策

| 设计点 | 决策 | 理由 |
|--------|------|------|
| Effect handler 语义 | tail-resumptive + abort（非 full algebraic） | evidence passing 天然支持 tail-resume；post-resume 需 delimited continuation，放入 Phase 3 |
| `or` 表达式 | 将扩展为 Option + fail 双用途 | Session 5 实现 Option enum 后激活 |
| typed catch | 将实现 `catch TypeName fn(e) { ... }` | Session 5 实现 |
| `mut<S>` 参数化 | 保持无参数 `mut`，Phase 3 实现 | Cell<T> 泛型已保证类型安全 |
| `++` 拼接运算符 | 不实现，使用字符串插值 | "一种事一种写法"原则 |
| `Unit` 类型标注 | Session 5 修复 | 1 行代码 |

### 幽灵功能（已解析但无语义效果）

以下语法 Parser 接受但 Checker/Codegen 不处理，保留作为扩展点：

| 功能 | 解析行为 | 激活时机 |
|------|---------|----------|
| `pub` 可见性 | 存储 `is_pub` 字段 | Phase 3 模块系统 |
| `where` 精化子句 | 消费 tokens 后丢弃 | Phase 3 refinement types |
| Supertrait | AST 字段存在，始终为空 | 后续 trait 增强 |
| Resume 参数名 | AST/HIR 字段存在，无语法触达 | Phase 3 full algebraic |

### 实现偏差备忘

- **Enum variant 位置字段**：codegen 使用 `_0`/`_1` 而非命名字段。日后 named fields 需改 codegen 的 field 命名策略
- **比较运算符非结合性**：parser 拒绝 `a == b == c`，本文档未描述但为有意行为
- **`+=`/`-=` 复合赋值**：parser 支持，本文档未描述
- **Spec 架构偏差**：spec 中独立的 `resolver.ts`/`lower.ts`/`TraitEnv` 实际合并在 `infer.ts` 和 `TypeEnv` 中
- **`let` 不可变性强制**：`let` 绑定禁止赋值（E0205），`var` 保持可变。Checker 通过 `mutable_vars: Set<number>` 追踪
- **`while` / `for..in` / `break` / `continue`**：Phase 3a Batch 1 实现。while 条件必须为 Bool，`..` 为 Rust 风格中缀运算符（Prec.Range），for..in 支持 Range 和 List 迭代器，codegen 缓存 end 表达式避免重复求值
- **Checker scope 安全**：所有 `push_scope`/`pop_scope` 用 try/finally 保护，type_error 抛出时自动清理
- **Str 内置方法**：Phase 3a Batch 2 实现。12 个纯方法（len/contains/starts_with/ends_with/slice/trim/to_upper/to_lower/replace/split/char_at/index_of），通过 `impl_methods.set("Str", ...)` 注册，infer_method_call 扩展支持 primitive type 方法查找
- **List\<T\> 内置类型**：Phase 3a Batch 2 实现。StructType 表示、JS Array 底层、不可变值语义。`[expr, ...]` 字面量语法，18 个方法。HOF 方法（map/filter/fold 等）使用 effect row 变量实现 effect 多态，codegen 内联 JS Array 方法（不走 runtime 函数）以正确转发 evidence。`contains` 使用 JS `===`，待 Eq trait 升级
- **Tuple 类型**：Phase 3a Batch 3 实现。`TupleType { kind: "tuple", elements: Type[] }`，字面量 `(e1, e2)` → JS 数组，match arm tuple pattern，`let (a, b) = expr` 解构（LetDestructureStmt/HLetDestructureStmt，含 def_id，LSP 全支持），函数参数/返回值 tuple 类型注解，穷尽性检查（按列），HM unification（元素数量 + 逐元素）。单元素 `(expr)` 不是 tuple（与 Rust/Python 一致）。Parser 换行感知修复：`(` 跨行时不触发函数调用（防止 `42\n(...)` 被解析为 `42(...)`）

### 未实现特性优先级

**高（阻塞实际程序）**：模块系统、Map\<K,V\>、Set\<T\>

**中（增强表达力）**：enum named fields、`map_fail`、关联类型、`delegate`

**低（Phase 3 研究向）**：`dyn Trait`、`async`/`spawn`/`Future`、refinement types、dependent types lite、extern FFI、平台条件编译

---

## 一句话

纯函数为心脏，effect 为血管，类型为骨骼，推断为皮肤——摸到的是 Python 的手感，内部跑的是 Haskell 的引擎。
