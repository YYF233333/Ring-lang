# Ring-lang 设计文档

**Rust 的安全性 + Python 的书写体验 + 效果系统让编译器知道一切，然后用这些信息优化性能。**

核心定位（2026-05-24 确定）：

**三支柱**：

1. **推断一切** — 类型 + effect + 可变性 + 所有权，全推断。写代码的体验接近 Python，编译器内部看到完整类型+效果+所有权信息。标注由 formatter 按配置等级自动生成，人只控制详细度。Rust 的安全性不应以标注负担为代价。
2. **追踪一切** — 签名即完整行为契约。函数的副作用（IO、失败、可变、异步）全部由 effect system 在类型层追踪。LLM 和人都能从签名读出全部副作用，无需查看实现。
3. **语义驱动性能** — LLVM 后端 + effect purity / linearity 信息直接转化为编译优化（bounds check 消除、RC 省略、纯函数重排/并行化）。前两个支柱产生的类型信息是优化燃料——这是 C++/Rust 编译器做不到或需要手动标注才能做到的。

**实验赌注**：Refinement types（类型附带值级谓词，Z3 集成编译器）。成了在第三支柱上再加一层（refinement proof → 消除运行时检查，消灭 `unsafe`），不成前三个支柱自洽。

额外目标：让 LLM 也喜欢写这门语言——模块签名信息密度最大化，LLM 在零训练数据的情况下只需签名即可正确使用 API。

## 设计公理

**全文唯一真值源 = `docs/philosophy.md`（2026-06-12 重构为九条三层；本节只留速记，消除双真值源）**：**层 0 目标** ④ 不信任程序员 · 编译器是最终权威（渐近表达 = 无人回路 × 全场景；推论：失真必须响 / 优化不可观测 / 人类审查面可枚举）。**层 1 硬约束** ⑤ 编译器必须终止（可判定片段 + fuel，B-119；放弃清单 lang-design §11.7）⑥ 确定性资源语义（Drop = scope-end 语义 + as-if 条款；RC 无 GC；环用 Weak；含 GC 取舍记录）⑦ 场景不可堵死（native / 零强制 runtime / C ABI）。**层 2 策略** ① 类型即模型，不是谜题（可判定标准：lv0 零标注 + 错误单轮可修）② 效果即可见性（主载体 = formatter 标注 + 模块签名 + llm 错误格式）③ 推断为王，标注为仆（推论：标注是文档不是语义；agent profile 下 warnings=errors）⑧ 一种事一种写法 ⑨ 语法借用。仲裁：策略让位约束；约束修订走修宪程序；记录入本文件附录「公理仲裁决策表」。

> LLM 友好性三原则（语法借用像原主 / 错误信息 LLM 可消费 / 高级特性两路径）详见 §11。

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

### 1.1b Union Type（匿名 enum 语法糖，2026-05-25 决策）

`A | B | C` 是匿名 enum 的语法糖。纯编译期展开，不引入子类型，HM 推断不受影响。

```
// 写法
fn process(x: Str | I64) -> Str {
    match x {
        Str(s) => s,
        I64(n) => n.to_str(),
    }
}
process("hello")   // 编译器自动包装为 union 的 Str 分支
process(42)        // 编译器自动包装为 union 的 I64 分支

// 错误组合——核心用例
fn load_config(path: Str) -> Config with {fail<IoError | ParseError>} {
    let raw = read_file(path)        // fail<IoError>，自动包装进 union
    let parsed = parse_json(raw)     // fail<ParseError>，自动包装进 union
    parsed
}
```

**语义规则**：
- `A | B` 展开为编译器生成的匿名 enum，tag + payload 与普通 enum 相同
- 归一化：按类型名字典序排列（`I64 | Str` = `Str | I64` 不成立，canonical form 按名字序）
- 去重：`A | A` = `A`
- 扁平化：`(A | B) | C` = `A | B | C`
- 结构等价：两处写 `Str | I64` 是同一类型
- 调用点隐式包装：传入 `Str` 值到 `Str | I64` 参数时编译器自动插入 enum 构造
- match 使用类型名作为 pattern（具体语法待定，见 backlog）

**不引入的东西**：
- 无子类型关系（`Str` 不是 `Str | I64` 的子类型——是隐式包装，不是子类型）
- 无运行时类型检查（tag 区分，同 enum）
- 无 `Any` 类型

### 1.2 Refinement Types

> **实现现状（2026-06-11 实测核定）**：`where` 全链路未强制（编译时 W0002 提示）。struct-field 位可解析（tokens 丢弃）；**参数位（`fn f(x: Int where ...)`）连解析都未实现——硬 parse error E0103**。参数位 parser 支持与验证一并归 B-001，不单独先行（避免再造「写了不生效」的静默面）。

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

### 1.3 Const Generics（值参数化类型）

> 原"Dependent Types Lite"（B-003）。2026-05-25 决策：不作为独立特性——其能力 = Const Generics（B-070 起步）+ Refinement predicates on const params（B-001）。不引入"依赖类型"概念——对用户来说就是"带编译期常量参数的泛型 + 约束"。

类型可参数化于编译期常量值，配合 refinement 约束实现维度安全：

```
// 固定长度数组（B-070）
let key: [U8; 32] = [0; 32]

// 等式约束：两个 N 必须相等（HM unification 自然处理）
fn zip<T, U, const N>(a: [T; N], b: [U; N]) -> [(T, U); N] { ... }

// Refinement on const param（B-001 SSA 约束传播）
fn head<T, const N where N > 0>(v: [T; N]) -> T {
    v[0]
}

// 远期：用户自定义类型的 const generics
// struct Mat<const M, const K> { data: [F64; M * K] }
// fn matmul<const M, K, N>(a: Mat<M, K>, b: Mat<K, N>) -> Mat<M, N>
```

### 1.4 Row Polymorphism（语法糖定位，2026-05-25 决策）

结构化多态——函数参数按字段匹配，无需定义 trait。**定位为语法糖**：编译期通过单态化消除，不作为类型系统一等概念。

```
fn greet(person: {name: Str, ..rest}) -> Str {
    "hello, ${person.name}"
}

struct User    { name: Str, age: I64, email: Str }
struct Company { name: Str, industry: Str }

greet(User { ... })       // ✓ 单态化为 greet__User
greet(Company { ... })    // ✓ 单态化为 greet__Company
```

**编译策略**：
- 编译器收集所有调用点的具体类型，为每个生成特化版本（同泛型单态化）
- 如果存在覆盖所需字段的 trait，归化为 trait 约束（trait 归化）
- `RecordType` 不出现在最终类型表示中——编译期消除
- **pub fn 不允许 row poly 参数**——模块边界必须使用具名类型或 trait

**签名显示**（lv2 formatter）：
- 有匹配 trait → 显示 trait 约束：`fn greet<T: Named>(person: T) -> Str`
- 无匹配 trait → 显示具体调用类型的 union：`fn greet(person: User | Company) -> Str`（使用 1.1b union type 语法）
- pub fn → 不适用（已禁止 row poly）

**实现时序**：当前 `RecordType` + row unification 实现保留，LLVM 后端阶段重构为单态化 pass。

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
increment(n)                 // 编译器从签名推断需要 box
print(n)                     // 1

// formatter preset "review"+ 自动插入 mut 标记：
increment(mut n)             // 等价写法，可选语法，方便人阅读
```

编译器为 `mut` 参数自动 box（`{ value }` 对象），用户无感。调用方的 `mut` 前缀是**可选标注**——编译器接受两种写法，语义相同。formatter 按配置决定是否插入：`preset = "none"` 省略，`preset = "review"+` 插入（代码审查时副作用可见）。

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

**`mut<T>` 追踪粒度：参数级，非 field 级。** `self.field.push()` 不额外注入 `mut<FieldType>` effect——`push()` 要求 `mut self`，即函数已有 `mut<Self>` effect，field mutation 是其子集。递归追踪 field chain 会产生大量冗余 effect（任何深层字段修改都传播到顶层），信噪比极低。

**不再需要 `Cell<T>` / `Ref<T>` 等包装类型。** 所有可变性通过 `let mut` + `mut` 参数 + 编译器自动 box 处理。词汇量：一个关键字 `mut`。

**闭包内的 `return` 语义**：闭包内的 `return` 返回闭包本身，不影响外层函数。这与 Rust/Kotlin 一致，与 Ruby/Smalltalk 不同。当闭包作为 HOF 回调传入时（如 `list.map(fn(x) { return x * 2 })`），`return` 仅影响该回调。当前编译器通过 IIFE 实现 block expression；当检测到 block/if/match 表达式包含 `return` 时，改用临时变量方案（inline emit + 赋值），避免 IIFE 截获 return（B-022 修复）。

### 1.6b 类型系统特性交互矩阵（2026-05-24 确定）

Refinement types、Linear types、Effect system 三个特性单独设计清晰，但组合后存在语义交互。以下为六个交互场景的已确定规则。

#### Refinement × Ownership（正交）

Refinement 是值级谓词——描述值本身的性质（`Int where it > 0`），不引用外部可变状态。Ownership 追踪值的所有者。两者正交。

- 值 move 后，refinement 随值转移到新 owner
- **约束**：refinement 谓词不允许引用可变绑定。`x: Int where x < len` 中 `len` 必须是 `let` 绑定或常量，否则编译错误。这保证谓词在值的整个生命周期内恒成立

#### Refinement × Effect（无冲突）

- **Abort 路径**（`fail.raise`）：refined 值随栈帧一起销毁，无需特殊清理——refinement 是编译期信息，没有运行时资源
- **Tail-resumptive 路径**（io/custom effect）：计算继续，refined 值不受影响
- **Handler resume 值**：handler 提供的恢复值必须满足恢复点的 refinement 约束（编译器检查）

#### Ownership × Effect（RAII / Drop trait）

`impl Drop` 的类型在所有路径自动 drop（RAII）。Rust 风格所有权模型，无 borrow checker。

```
trait Drop {
    fn drop(mut self) with {io}   // 允许 io（flush 等），禁止 fail
}
```

**所有权规则**：
- 所有值 scope 结束自动 drop（正常路径 + abort 路径 + cancel 路径均自动 RAII）
- Move 语义：赋值/传参 = move，move 后原变量不可用
- `impl Drop` 的类型禁止 `impl Clone`（资源不可复制）
- `drop(x)` 提前释放，`leak(x)` 显式逃逸（不触发 Drop）
- `mut self` 方法 = 隐式借用（不消耗所有权）
- 共享访问 → `Rc<T>`，Rc 可 Clone，内部资源 Drop 在 Rc 归零时触发
- 无 `linear` 关键字——`impl Drop` 是唯一的所有权约束入口
- 容器持有 Drop 类型值 → 容器 Drop 自动 drop 所有元素，容器自身不因此获得 Drop 约束
- 无 borrow checker——Ring 用 Perceus RC 代替借用保证内存安全

**不引入 `defer` 关键字**——RAII 覆盖了资源清理的所有场景。`Drop::drop` 禁止 `fail` effect，避免"清理时抛异常"问题。

#### Ownership × async（Move 语义）

`spawn` 闭包捕获 Drop 值 = ownership 转移。原作用域失去访问权（编译错误）。

- 一个 Drop 值不能被两个 `spawn` 闭包同时捕获（违反所有权，编译错误）
- 子任务取消时，被取消的任务走 `Cancelled` fail 路径 → 触发 Drop（同 Ownership × Effect 规则）

#### Refinement × async（成立）

值级谓词不受 await 挂起/恢复影响——`id: Int where id > 0` 在 await 前后恒成立。因为交互 1 已确定 refinement 不引用可变外部状态。

#### 三系统组合（无新规则）

前五个交互规则的自然组合。典型场景：

```
fn safe_write(file: FileHandle, data: Str where data.len() > 0) with {fail<Str>, async} {
    // file: impl Drop → scope 结束自动 close（正常 + abort 均 RAII）
    // data: refined → 保证非空，跨 await 稳定
    let written = await(file.write(data))
    if written == 0 {
        fail.raise("write failed")   // abort → file.drop() 自动触发
    }
    file.close()                      // 也可提前显式消耗
}
```

三系统的类型检查算法各自独立运行，无循环依赖。

#### 扩展交互矩阵（2026-05-24 确定）

以上六个交互覆盖 Refinement × Ownership × Effects 三大支柱。以下为其余重要特性交互的已确定规则。

**GADTs × Or-Pattern（禁止不兼容约束合并）**

Or-pattern 合并的 GADT 变体必须携带兼容的类型等式。`Lit(n) | Add(a,b)` 合法（两者均 T=Int），`Lit(n) | IsZero(e)` 非法（T=Int vs T=Bool 冲突）。编译器在 or-pattern 展开时验证各分支的 GADT 类型约束一致性，不一致则报编译错误。

**Refinement × mut 参数（赋值点重新验证）**

`fn foo(mut x: Int where x > 0)` 的 refinement 必须在每次赋值后重新成立。编译器通过 SSA 约束传播在每个赋值点验证新值满足谓词。这和 refinement 本身的流分析实现是同一层复杂度，不单独拆分。Refinement 的核心价值是使用点的保证，不只是入口检查。

**Auto-Boxing × Linear（透明）**

Auto-boxing（`mut` 参数的 `{value: x}` 包装）是 codegen 实现细节，对 linearity checker 透明。Linearity check 在 HIR 层完成，auto-boxing 在 codegen 层完成，两层不交叉。LLVM 后端 `mut` 参数直接传指针，不需要 boxing。但**被闭包写穿捕获的 `let mut` 局部**（`boxed_vars`，checker 标记 def_id）在 LLVM 后端会 auto-box 成一个单槽堆 cell（`RING_TYPEID_CELL`，`{ ptr value }`），镜像 JS 后端的 `{value: ...}`：外层作用域和闭包 env 共享同一 cell 指针，读/写走 `cell.value`，从而实现写穿（B-091）。Perceus 对 boxed cell 的赋值**不**插入旧值 Drop——写只覆写 `cell.value`，不消费共享的 cell 指针，否则每次写都会 `ring_drop` 一个外层和闭包仍持有的 cell（确定性 UAF）。cell 指针本身按普通 owned 堆值参与 RC（捕获点 dup、作用域末 drop / 工厂场景 move 进闭包）。

**delegate × Associated Types（自动继承）**

delegate 创建完整 trait impl（包含关联类型绑定）。关联类型从 inner 字段的已有 impl 自动推导——`delegate inner: Iterator<Int>` 自动获得 `type Item = Int`。语义确定：delegate = "我就是它"，关联类型必然与 inner 一致。

**Associated Types × Supertrait（自然组合）**

`T: Collection` 蕴含 `T: Iterable`，`T::Item` 等 supertrait 关联类型自动可用。实现时 supertrait bound 展开时带上关联类型即可，无需额外规则。

**GADTs × Effects / delegate × Effects（正交）**

GADT 的 scoped type equality 是编译期 unification，effect evidence 是运行时值传递，两层不交叉。delegate 转发方法时完整复制签名（含 effect 标注），evidence 正常传递。两个交互均不需要特殊规则。

**mut\<T\> × Ownership（隐式借用 + 无 borrow checker）**

`mut self` 方法调用 Drop 值时，语义为隐式借用（不消耗所有权）。Drop 值在 scope 内可通过 `mut self` 被修改，scope 结束时自动 drop（RAII）或提前 `drop(x)` / `x.close()` 显式消耗。Ring 不引入 borrow checker——Perceus RC + Ownership + mut\<T\> + Drop 已覆盖安全性需求（内存安全由 Perceus RC 保证，资源安全由 Ownership + Drop 保证，mutation 追踪由 mut\<T\> effect 保证，数据竞争由结构化并发 + move 语义排除）。不设 borrow checker 的残余可变别名窗口（`f(xs, mut xs)` 同值双借）由句法禁止收口；其余别名由 move 语义（§7.5，use-after-move 编译错误）杜绝，COW 因此为不可观测的内部优化（2026-06-11 拍板，B-110）。

### 1.7 语义规范（后端无关，2026-05-24 确定）

Ring 语言的语义规范，两个后端都必须符合。LLVM 落地后 JS 后端废弃。

#### 数值类型（2026-05-25 更新）

14 个固定宽度类型，无别名：`I8, I16, I32, I64, I128, U8, U16, U32, U64, U128, F32, F64, ISize, USize`。每个类型名自带宽度信息，拒绝 C 系 `int` 的平台歧义。

**字面量规则**：
- `42` → `I64`，`3.14` → `F64`，永远确定，无歧义
- 无后缀语法（不支持 `42u8`——可由社区反馈驱动后续添加）
- 类型标注窄化：`let x: U8 = 42`（编译期常量折叠 + 范围检查，`256` → 编译错误）
- 方法窄化：`42.to_u8()`（等价于类型标注）
- 运行时窄化：`some_int.to_u8()`（溢出 → fail effect）

**零隐式转换**：
- 不同宽度类型之间无隐式转换（无 widening、无 narrowing）
- `u8_val + i64_val` → 编译错误，要求 `u8_val.to_i64() + i64_val`
- 算术运算只在同类型之间

#### 内存布局（2026-05-24 决策）

默认布局不保证（编译器可重排字段）。`@repr(C)` C 兼容布局（FFI）、`@repr(packed)` 紧凑布局（协议解析）、`@align(N)` 显式对齐。属性标注机制。

#### 运算符重载（2026-05-24 决策）

通过 trait 实现。算术（`Add/Sub/Mul/Div/Rem/Neg`）、比较（`Eq/Ord`，`Ord: Eq`）、位运算（`BitAnd/BitOr/BitXor/BitNot/Shl/Shr`）、索引（`Index/IndexMut`）。不支持跨类型运算。14 个数值类型各自 impl 全套 trait（编译器内置）。

#### 尾调用优化（2026-05-24 决策）

编译器自动检测，无新语法。尾位置 + 无 Drop + 签名匹配 → 保证 TCO（debug/release 都做）。自递归转循环（编译器变换），互递归/间接尾调用用 LLVM `musttail`。间接尾调用模式（tail-call interpreter）自动支持。

| 维度 | Ring 语义 | 备注 |
|------|----------|------|
| **整数范围** | 各类型固定宽度（I64 = ±2^63，I32 = ±2^31 等） | JS 后端 I64 受限于 ±2^53，已知差异 |
| **整数溢出** | Debug panic / Release 二补数回绕 | Rust 模型。JS 后端静默溢出为 float，已知差异 |
| **浮点精度** | F64 = IEEE 754 double，F32 = IEEE 754 single | 两后端一致（JS 后端只有 F64） |
| **字符串编码** | UTF-8 字节串（Rust 模型，§1.7.1 拍板） | JS 后端内部 UTF-16，已知差异（B-100 前修正） |
| **`str[i]`** | 第 i 个字节（返回单字节 `Str`），越界 panic | code point 级访问用 `.chars()` 迭代器 |
| **`str.len()`** | 字节数，O(1) | code point 数用 `.char_count()`，O(n) |
| **数组越界** | panic | 安全访问用 `.get(i)` 返回 `Option<T>`。已是当前行为 |
| **整数除零** | panic | JS 后端当前返回 Infinity，需修正 |
| **栈溢出** | 实现定义的 panic 或 abort | LLVM 用 stack guard page，JS 有 RangeError。不保证所有平台均可捕获 |

#### 1.7.1 字符串编码模型（B-131 design-probe，2026-06-15）

**状态：已拍板选 A（UTF-8 字节串），2026-06-15 用户确认。实现 = B-133。**

上表（1.7）第 5-6 行当前写的是「UTF-8 编码、code point 级 `len`/`index`」，即 A+B 混合体——内部存储 UTF-8（A 的选择），但公开 API 按 code point 计数（B 的选择）。这是自相矛盾的：要么承受 B 的 O(n) index 代价并把语义完全兑现，要么选 A 的字节级 API 并获得 O(1) 性能。两条路都不走 = 留一个「设计文档写了但两个后端都没实现」的空头支票。本节分析两个候选并给出推荐。

##### 现状审计：两后端的实际行为

**LLVM 后端（`ring_runtime.cpp`，std::string = UTF-8 字节序列）：**

| 函数 | 行为 | 语义单位 |
|------|------|---------|
| `ring_str_len` (L650) | `std::string::size()` → **字节数** | 字节 |
| `ring_str_get` (L671) | `(*str)[(size_t)idx]`，取单字节构造 `std::string(1, byte)` → **字节级索引** | 字节 |
| `ring_str_char_at` (L2319) | 同 `ring_str_get`，`std::string(1, (*str)[idx])` → **字节级** | 字节 |
| `ring_str_char_code_at` (L2398) | `(unsigned char)(*str)[idx]` → **字节值** | 字节 |
| `ring_str_slice` (L683) | `str->substr(start, end-start)` → **字节级切片** | 字节 |
| `ring_str_index_of` (L2329) | `std::string::find()` → **字节偏移** | 字节 |
| `ring_str_last_index_of` (L2339) | `std::string::rfind()` → **字节偏移** | 字节 |
| `ring_str_split` (L715) | 空分隔符时逐字节拆分 `str->size()` 个元素 | 字节 |
| `ring_str_contains` (L697) | `std::string::find()` → 字节匹配（对 valid UTF-8 子串正确） | 不受影响 |
| `ring_str_starts_with` (L701) | `str->compare(0, pre->size(), *pre)` → 字节匹配（正确） | 不受影响 |
| `ring_str_ends_with` (L708) | 同上，字节匹配（正确） | 不受影响 |
| `ring_str_replace` (L754) | `std::string::find()` + `replace` → 字节匹配替换（对 valid UTF-8 正确） | 不受影响 |
| `ring_str_pad_start/end` (L2353/2371) | 以 `str->size()`（字节数）判断长度 | 字节 |
| `ring_str_to_upper/lower` (L2299/2309) | 逐字节 `toupper`/`tolower` — **仅 ASCII 正确**，多字节 UTF-8 破坏 | 字节（bug） |
| `ring_str_trim*` (L2262-2297) | ASCII 空白字符集 — 对 UTF-8 BOM/全角空格不处理 | 不受影响（仅 ASCII 空白） |

**JS 后端（`compiler/runtime.ring`，JS string = UTF-16 码元序列）：**

| 函数 | 行为 | 语义单位 |
|------|------|---------|
| `Str_len` (L51) | `self.length` → **UTF-16 码元数** | 码元 |
| `Str_char_at` (L61) | `self[i]` → **UTF-16 码元级索引**（surrogate pair 被拆成两个字符） | 码元 |
| `Str_char_code_at` (L67) | `self.charCodeAt(i)` → **UTF-16 码元值** | 码元 |
| `Str_index_of` (L62) | `self.indexOf(s)` → **UTF-16 码元偏移** | 码元 |
| `Str_slice` (L55) | `self.slice(start, end)` → **UTF-16 码元级切片** | 码元 |
| `Str_split` (L60) | `self.split(sep)` — 空字符串分隔符产出 UTF-16 码元数组 | 码元 |
| `Str_pad_start/end` (L64-65) | `padStart`/`padEnd` → 码元级 | 码元 |
| `Str_to_upper/lower` (L57-58) | `toUpperCase`/`toLowerCase` → **Unicode 感知**（JS 引擎实现 ICU 级别） | 正确 |

**发散总结**：对 ASCII 字符串，两后端行为一致（1 byte = 1 UTF-16 码元 = 1 code point）。对非 ASCII：
- `"你好".len()` → LLVM: 6（字节）；JS: 2（码元，碰巧 = code point）
- `"😀".len()` → LLVM: 4（字节）；JS: 2（码元 ≠ 1 code point）
- `"你好".char_at(0)` → LLVM: `some("\xe4")`（UTF-8 首字节，破碎）；JS: `some("你")`（正确）
- `"😀".char_at(0)` → LLVM: `some("\xf0")`（破碎）；JS: `some("\ud83d")`（high surrogate，也破碎）

**两个后端对非 ASCII 字符串都不完全正确**——LLVM 按字节，JS 按 UTF-16 码元，design.md 写的 code point 级语义两边都没实现。

##### 候选 A：UTF-8 字节串（Rust/Go/Koka 模型）

**定义**：`Str` 内部表示 = UTF-8 字节序列。`len` 返回字节数。`str[i]` 返回第 i 个字节（或编译错误/改名）。按 code point 操作通过显式 API 提供。

**API 设计**：

```
impl Str {
    // 字节级（O(1)，零开销）
    fn len(self) -> Int              // 字节数
    fn byte_at(self, i: Int) -> Int  // 第 i 字节值（0-255），越界 panic
    fn slice(self, start: Int, end: Int) -> Str  // 字节级切片，非边界时 panic 或 fail

    // Code point 级（O(n)，显式成本）
    fn chars(self) -> Iterator<Str>  // 迭代 code point（每个为 1-char Str）
    fn char_count(self) -> Int       // code point 数，O(n)
    fn char_at(self, i: Int) -> Option<Str>  // 第 i 个 code point，O(n)

    // 子串操作（UTF-8 安全，O(n)，因为操作对象本身是 valid UTF-8）
    fn contains(self, s: Str) -> Bool       // 不受编码影响
    fn starts_with(self, s: Str) -> Bool    // 不受编码影响
    fn ends_with(self, s: Str) -> Bool      // 不受编码影响
    fn index_of(self, s: Str) -> Option<Int>  // 返回字节偏移
    fn split(self, sep: Str) -> List<Str>     // UTF-8 安全（按子串匹配）
    fn replace(self, old: Str, new: Str) -> Str  // UTF-8 安全
}
```

**优势**：
1. **公理⑥（确定性资源语义）**：O(1) `len`/`slice` = 确定性性能成本，无隐藏 O(n) 操作。字节级操作的性能模型对 agent 完全透明——不存在「看起来 O(1) 实际 O(n)」的隐形陷阱
2. **公理⑦（场景不可堵死）**：系统编程需要字节级控制（协议解析、二进制格式、文件 I/O 的 BOM 处理）。纯 code point 模型做这些需要 escape hatch（`ByteStr` 或 `as_bytes()`），增加一种类型违反公理⑧
3. **竞品共识**：Rust/Go/Koka/Zig/C++ 全选 UTF-8 字节串。系统编程语言中只有 Swift 选了 grapheme cluster 级（且为此付出了 String 操作普遍 O(n) 的代价）。Python 模型在 CPython 内部其实也是 UTF-8（PEP 393 flexible string representation），code point 级 API 是抽象层的代价
4. **LLVM 后端几乎就绪**：`ring_runtime.cpp` 当前的全部实现已经是字节级，选 A 只需修 3 个函数（`to_upper`/`to_lower` 的 ASCII-only bug + `char_at`/`char_code_at` 语义澄清）+ 新增 `chars()`/`char_count()` 迭代器
5. **公理⑨（语法借用）**：Rust 的 `.len()` = 字节数、`.chars()` 迭代 code points 对 LLM 是最强先验——Rust 字符串是 LLM 训练数据里最高频的 UTF-8 字节串 API

**劣势**：
1. **字节级 `slice` 可在多字节字符中间切断**，产出 invalid UTF-8 → panic/fail 或静默乱码。Rust 用 `&str[range]` panic 解决，Go 允许静默产出 `\xfffd`。Ring 的选择：**非 code-point 边界切片 → panic**（与 Rust 一致，公理④ 失真必须响）
2. **`split("")` 逐字节拆分**对非 ASCII 不直觉——但空分隔符语义本身就是边缘情况，可改为「空分隔符 = 按 code point 拆分」作为例外
3. **LLM 写 CJK 字符串处理代码时**，`"你好".len() == 6` 而非 2 可能不直觉。但实测 LLM 对 Rust 字符串的这一特性已完全适应（训练数据中 Rust 使用量远超 Ring）

##### 候选 B：Unicode code point 序列（Python 模型）

**定义**：`Str` 对外行为 = Unicode code point 序列。`len` 返回 code point 数。`str[i]` 返回第 i 个 code point。内部可以是 UTF-8 但 API 完全隐藏字节细节。

**实现成本**：
1. **`len` = O(n)**：每次调用需遍历 UTF-8 计算 code point 数。或维护冗余的 code point 计数字段（+8 bytes/string，内存 + 每次拼接/切片需更新）
2. **`char_at(i)` = O(n)**：从头遍历跳过 i 个 code points。或维护 offset 索引表（O(1) 查询 + O(n) 构建 + 内存 = 每字符串 ~4 bytes/code point 的辅助数组）
3. **`slice(start, end)` = O(n)**：先找到 start/end 对应的字节偏移，再 `substr`
4. **`index_of` 返回 code point 偏移 = O(n)**：找到字节偏移后需回溯计算 code point 数

**性能影响估算（自编译场景）**：编译器自身 ~35k 行 Ring，是全 ASCII（标识符/关键字/运算符）。自编译的所有 `str.len()` 调用（源码读取、token 比较、字符串拼接检查等）从 O(1) 退化为 O(n)。影响程度取决于字符串操作频率——编译器是字符串密集型程序（lexer 逐字符扫描、parser 构建 AST 字符串、codegen 拼接输出），估计 2-5x 性能退化。对于 ~20s 自编译来说退化为 ~40-100s——不可接受。

**需要补充 `ByteStr` 类型**：系统编程场景（协议解析、二进制 I/O）无法用 code point 级 API 完成，需引入 `ByteStr` 或 `Bytes` 类型 + 相互转换 API。这违反公理⑧（一种事两种写法——字符串处理有两种类型可选）。

**优势**：
1. 对 LLM 直觉友好：`"你好".len() == 2`、`"hello".len() == 5` 符合自然语言理解
2. Python 模型是 LLM 训练数据最高频的字符串 API——LLM 对 `len()` = 字符数的先验最强
3. 不可能意外切断多字节字符——API 在 code point 边界上操作 by construction

**劣势**：
1. **性能模型不透明**（违反⑥的精神——「可从代码推导」的扩展含义：O(1) 写法实际 O(n) = 隐性成本）
2. **需要 `ByteStr` 补位**（违反⑧）
3. **Python 的 O(1) 假象**：CPython 3.12+ 内部用 compact UTF-8 存储，`.encode()` 才触发 UTF-8→UTF-8（实际 no-op），但 `s[i]` 是 O(1)（PEP 393 通过 kind flag + latin1/UCS2/UCS4 表示达成）。Ring 没有这个实现——native 用 `std::string` UTF-8 存储，做 O(1) code point index 需要重新设计字符串内部表示（如 UTF-32 存储 = 4x 内存，或 PEP 393 式 flexible representation = 巨大复杂度）
4. **编译器自身吃 dog food**：自编译是性能关键路径，O(n) `len` 不可承受

##### 竞品对比

| 语言 | 内部表示 | `len()` | `s[i]` | 子串搜索 | 系统编程 |
|------|---------|---------|--------|---------|---------|
| **Rust** | UTF-8 | 字节数 O(1) | `as_bytes()[i]` / `.chars().nth(i)` O(n) | 字节偏移 | 完全支持 |
| **Go** | UTF-8 | 字节数 O(1) | 字节 / `for range` 迭代 rune | 字节偏移 | 完全支持 |
| **Koka** | UTF-8 | 字节数 O(1) | `.head()`/`.tail()` | 内部实现 | 函数式，不面向系统编程 |
| **Zig** | UTF-8 | 字节数 O(1) | 字节 / `std.unicode.utf8Decode` | 字节偏移 | 完全支持 |
| **Python** | Flexible (PEP 393) | code point O(1) | code point O(1) | code point 偏移 | 不面向系统编程 |
| **Swift** | UTF-8 (5.0+) | grapheme cluster O(n) | grapheme O(n) | grapheme 偏移 | 受限 |
| **JS** | UTF-16 | 码元数 O(1) | 码元 O(1) | 码元偏移 | 不面向系统编程 |

系统编程语言（Rust/Go/Zig/C++）无一例外选 UTF-8 字节级 API。code point 级 API 只出现在不面向系统编程的语言中（Python/JS）。Swift 是唯一的例外（grapheme 级），但 String 的 O(n) 特性是 Swift 社区长期抱怨点。

##### Grapheme cluster 考量

无论选 A 或 B，code point 级 API 对 emoji 组合字符（`"👨‍👩‍👧‍👦"` = 7 code points = 25 bytes = 1 grapheme cluster）都不完美。方案：
- 不作为 `Str` 内置方法——grapheme cluster 分割需要 Unicode 规范表数据（ICU 级别），与公理⑦（零强制 runtime）冲突
- 提供 `std/unicode` 库模块（opt-in），包含 `graphemes(s: Str) -> Iterator<Str>`
- 这与 Rust（`unicode-segmentation` crate）、Go（`golang.org/x/text`）策略一致

##### 推荐：A（UTF-8 字节串）

权重分析：

| 判据 | A (UTF-8 字节) | B (code point) | 权重 |
|------|---------------|----------------|------|
| 公理⑥ 确定性 | O(1) len/index，性能可推导 | O(n) 隐藏成本 | A 赢，高 |
| 公理⑦ 场景不堵死 | 原生支持系统编程 | 需 ByteStr 补位 | A 赢，高 |
| 公理⑧ 一种写法 | Str 一种类型 | Str + ByteStr 两种 | A 赢，中 |
| 公理⑨ 语法借用 | Rust 模型（LLM 强先验） | Python 模型（LLM 也熟） | 微 A |
| 公理① LLM 友好 | `len` = 字节数不直觉 | `len` = 字符数直觉 | B 赢，中 |
| 实现成本 | LLVM 后端已 90% 就绪 | 两后端都需大改 | A 赢，高 |
| 自编译性能 | 无退化 | 2-5x 退化 | A 赢，高 |

A 在 5/7 判据胜出（其中 3 个高权重），B 只在 LLM 直觉性一项有明确优势。**推荐选 A**。

##### 否决 B 的理由

1. **性能不可承受**：Ring 编译器自身是 dog food——O(n) `len` 对 ~35k 行全 ASCII 编译器无性能影响，但**语义规范不能只为 ASCII 优化**。一旦标准库或用户代码处理 CJK/emoji 文本，O(n) `len` 在循环中成为二次复杂度来源
2. **引入第二种字符串类型**：`ByteStr` 违反公理⑧。Rust 有 `&[u8]` vs `&str` 的区分，但 Rust 的 `&str` 本身就是字节级 `len`——两种类型是数据类型层面的区分（valid UTF-8 vs arbitrary bytes），不是 API 语义层面的区分
3. **不可逆性不对称**（镜像公理⑥的 GC 取舍逻辑）：选 B 后退回 A = breaking change（所有依赖 `len` = code point 数的代码需改写）。选 A 后需要 B 的便利 = 加 `.char_count()` 方法（additive，不 breaking）
4. **设计文档当前写的 code point 语义两个后端都没实现**——选 B 需要两个后端同时大改，选 A 只需修正 JS 后端 + 少量 LLVM 修补

##### 迁移影响清单（选 A 时）

**1. design.md 本表（§1.7）修正**：

| 行 | 当前 | 改为 |
|----|------|------|
| 字符串编码 | UTF-8 | UTF-8（不变） |
| `str[i]` | 第 i 个 Unicode code point | 第 i 个字节（返回单字节 `Str`），越界 panic |
| `str.len()` | Unicode code point 数 | 字节数。另提供 `.char_count()` 返回 code point 数 |

**2. `std/str.ring` API 变更**：

| 方法 | 当前签名 | 变更 |
|------|---------|------|
| `len` | `fn len(self) -> Int` | 语义澄清为字节数（签名不变，文档改） |
| `char_at` | `fn char_at(self, i: Int) -> Option<Str>` | 语义改为第 i 字节。**或改名为 `byte_at`**，另加 code point 级 `char_at` 通过 `chars()` 迭代器 |
| `char_code_at` | `fn char_code_at(self, i: Int) -> Option<Int>` | 语义改为第 i 字节值（0-255）。**或改名为 `byte_at`** 返回 `Int` |
| `index_of` | `fn index_of(self, s: Str) -> Option<Int>` | 语义澄清返回字节偏移（两后端已是如此） |
| `slice` | `fn slice(self, start: Int, end: Int) -> Str` | 语义澄清为字节级切片。**新增：非 code-point 边界 → panic** |
| `pad_start`/`pad_end` | 按当前长度判断 | 语义澄清为字节级长度 |
| 新增 `char_count` | — | `fn char_count(self) -> Int`，O(n) 返回 code point 数 |
| 新增 `chars` | — | `fn chars(self) -> List<Str>`（或 `Iterator<Str>`），迭代 code points |
| 新增 `byte_len` | — | 不需要——`len` 已经是字节数。若需语义明确可加 alias |
| 新增 `is_valid_utf8` | — | 暂不需要——所有 `Str` 保证 valid UTF-8 by construction |

**3. `ring_runtime.cpp` 修复清单**：

| 函数 | 问题 | 修复 |
|------|------|------|
| `ring_str_to_upper` (L2299) | 逐字节 `toupper`，破坏多字节 UTF-8 | 改用 ICU 或实现 ASCII-only 语义（非 ASCII 字节原样保留） |
| `ring_str_to_lower` (L2309) | 同上 | 同上 |
| `ring_str_split` (L715) | 空分隔符逐字节拆分 | 改为逐 code point 拆分（唯一的 code-point 级例外，匹配用户直觉） |
| `ring_str_slice` (L683) | 无 UTF-8 边界检查 | 加 validity check：`start`/`end` 非 code-point 边界 → panic |
| `ring_str_char_at` (L2319) | 名称暗示 "char" 但返回单字节 | 改名为 `ring_str_byte_at` 或改为 code-point 级（设计选择见上） |
| 新增 `ring_str_char_count` | — | 遍历 UTF-8 计算 code point 数 |
| 新增 `ring_str_chars` | — | 返回 code point 列表 |

**4. `compiler/runtime.ring`（JS 后端）修正**：

| 函数 | 问题 | 修复 |
|------|------|------|
| `Str_len` (L51) | `self.length` = UTF-16 码元数 | 改为 `new TextEncoder().encode(self).length`（UTF-8 字节数） |
| `Str_char_at` (L61) | `self[i]` = UTF-16 码元级 | 改为字节级（`TextEncoder` + 索引 `Uint8Array`） |
| `Str_char_code_at` (L67) | `charCodeAt` = UTF-16 码元值 | 改为字节值 |
| `Str_index_of` (L62) | `indexOf` = UTF-16 码元偏移 | 改为字节偏移（`TextEncoder` 计算） |
| `Str_slice` (L55) | `self.slice` = UTF-16 码元级 | 改为字节级（encode → slice → decode） |
| `Str_pad_start/end` (L64-65) | UTF-16 码元级长度 | 改为字节级长度 |
| `__ring_str_index` (L125) | `s.length` = UTF-16 码元数 | 改为字节级 |
| 新增 `Str_char_count` | — | `[...self].length`（spread = code point 迭代） |
| 新增 `Str_chars` | — | `[...self]`（spread = code point 数组） |

**5. 编译器自身（`compiler/*.ring`）的影响**：编译器全 ASCII 源码处理，`len`/`slice`/`index_of` 语义不变。**零改动**。唯一注意：读取非 ASCII 源文件（Ring 支持 UTF-8 源码、字符串字面量中可包含 CJK/emoji）的 lexer 用字节索引——当前实现已是字节级，与选 A 天然一致。

**6. llvm_diff 测试**：新增非 ASCII 字符串用例（CJK + emoji），断言两后端一致。这是 B-131 的直接验收门。

##### 分阶段实施建议

| 阶段 | 内容 | 依赖 | 估计量 |
|------|------|------|--------|
| P0 | 修正 design.md §1.7 表格（本节完成后） + 更新 CLAUDE.md 已知限制 | 无 | S |
| P1 | 修 `ring_str_to_upper`/`to_lower` 的 ASCII-only bug | 无 | S |
| P2 | 新增 `char_count()`/`chars()` 到 `std/str.ring` + 两后端实现 | 无 | M |
| P3 | JS 后端 `Str_len` 等改为字节语义 + `ring_str_slice` 加 UTF-8 边界检查 | P2（先有替代 API） | L |
| P4 | `char_at`/`char_code_at` 命名决策 + 实施 | P2 | M |
| P5 | 新增 llvm_diff 非 ASCII 测试用例（CJK + emoji + mixed） | P3 | M |
| P6 | `split("")` 改为 code-point 级拆分 | P2 | S |

注意：P3（JS 后端语义修正）是 **breaking change**——现有代码中 `s.len()` 对 ASCII 不变，但对非 ASCII 字符串行为改变。由于当前测试全 ASCII、且 JS 后端终将退役（B-100），影响面有限。但仍应在 P2 先提供 `char_count()` 替代 API，再改 `len` 语义。

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

**延迟解析（2026-05-24 确定）**：`let x = []` 允许——类型变量延迟到后续 usage 消歧。函数结束时类型变量仍未确定 → 报错（要求标注）。标准 HM unification 天然支持，无需特殊处理。

### 3.2 Formatter：标注密度管理器

Ring 的 formatter 不只是语法格式化工具（缩进/空白/换行），它同时管理**标注密度**——基于编译器的类型推断结果，在源码上增删类型和 effect 标注。源码是规范形式，标注是可增减的文档层。

**核心设计原则：标注是文档，不是语义。** 编译器永远从函数体推断 convention，标注不改变编译行为（编译产物与无标注时相同）。标注缺失 = 最多 warning；标注存在即检查，**与推断不一致 = 编译错误**——统一信号「标注过期了」，修复手段是 `ring fmt` 刷新（内部标注）或人工确认 pub 契约变更（见 3.2.3/3.2.4），而非改代码迁就标注。lv0 能编译的代码补全**正确**标注后编译行为不变。（2026-06-11 订正：原「不一致 = warning 从不 error」表述与 3.2.3「不匹配 = 编译错误」矛盾，以 3.2.3 为准。）

#### 3.2.1 Git 存储模型：lv0 / lv2（2026-05-24 确定）

Ring 采用两级标注模型管理源码的标注密度：

| 等级 | 场景 | 标注密度 | 说明 |
|------|------|----------|------|
| **lv0** | 写时 | 零标注 | 编译器全推断。开发者本地编辑用 |
| **lv2** | Git 存储/推荐 | 完整语义标注 | 所有标注项均为合法可选语法 |

`ring fmt` 将 lv0 自动补全为 lv2，幂等确定性。

**lv2 具体标注内容**：

| 标注项 | lv2 标注 | 说明 |
|--------|:---:|------|
| 函数返回类型 | ✅ | `fn f(...) -> Int` |
| effect row | ✅ | `with {io, fail<E>}` |
| move 参数（声明） | ✅ | `fn f(move x: T)` |
| mut callsite | ✅ | `f(mut list)` |
| 闭包 effect | ✅ | 闭包的 effect 签名 |
| move callsite | ❌ | 编译器 use-after-move 够用，标了噪音大 |
| 局部变量类型 | ❌ | 过于繁琐（与 Rust/TS 一致） |
| borrow 参数 | ❌ | 默认即 borrow，标了是噪音 |
| 泛型实例化类型参数 | ❌ | `Vec.new()` 不写 `::<Int>` |

纯函数省略 `with` = 空 effect。lv2 中纯函数和 lv0 写法相同（无冗余标注）。

**模块边界标注（pub fn/trait/type）**：

| 标注项 | 规则 | 说明 |
|--------|------|------|
| return type | 必须有 | `ring check` 缺失报 warning |
| effect row | 必须有 | 纯函数省略 with = 空 effect |
| move 参数 | 必须有 | 有 move 推断但无标注 → warning |
| mut 参数 | 必须有 | 已有 |
| 泛型约束 | 必须有 | `<T: Ord>` |
| borrow 参数 | 不标注 | 默认 |

**pub fn Formatter 策略**：

| 源码状态 | `ring fmt` | `ring fmt --force` | `ring check` |
|---------|-----------|-------------------|-------------|
| 无标注（新 fn） | 直接补全 | 直接补全 | ⚠ warning "missing" |
| 标注正确 | 无操作 | 无操作 | ✅ |
| 标注 ≠ 推断 | 只报 warning，不改 | 更新标注 | ⚠ warning "stale" |

Breaking change 附加提示（不影响编译，只影响 warning 措辞）：
- borrow → move: ⚠ "breaking: callers' values will be consumed"
- move → borrow: ℹ "non-breaking: callers retain ownership"
- effect 新增: ⚠ "breaking: callers need additional effect"
- effect 减少: ℹ "non-breaking: fewer requirements"

**环境适配**：
- IDE：clean view 写 lv0，保存/提交时 fmt 补全为 lv2
- vim/emacs + LSP：inlay hints + 保存时 fmt
- GitHub 网页端：直接看 lv2（Git 存的就是）
- 纯文本编辑器：文件中是 lv2，手动 `ring fmt` 补全

#### 3.2.2 扩展预设（不同上下文的查看模式）

lv0/lv2 是 Git 存储模型。在此之上，formatter 提供更多预设用于不同查看场景：

配置 `.ringfmt.toml`：

```toml
[annotations]
preset = "api"
# 预设（常用组合的快捷方式）：
#   "none"   = 零标注，只格式化语法
#   "api"    = pub 函数签名（返回类型 + 参数类型 + effect）
#   "review" = 所有函数签名 + 调用点 mut 标记 + 模块 capability
#   "audit"  = review + 调用点 effect 冒泡（//: 注释）+ 复杂表达式中间类型
#   "full"   = 全标注（let 类型、lambda 返回类型、泛型实例化、推断 trait bound）

# 维度开关（覆盖预设的个别维度）：
[annotations.types]
# pub_fn = true         # pub 函数参数 + 返回类型
# internal_fn = false   # 内部函数签名
# lambda_params = false # lambda 参数类型
# lambda_return = false # lambda 返回类型
# let_bindings = false  # let 绑定类型
# generic_instantiation = false  # 泛型实例化参数

[annotations.effects]
# pub_fn = true         # pub 函数 with {...}
# internal_fn = false   # 内部函数 effect 签名
# callsite = false      # 调用点 //: effect 冒泡标注
# module_capability = false  # mod requires {...}

[annotations.mut]
# callsite = false      # 调用点 mut 参数标记：increment(mut n)

[annotations.traits]
# inferred_bounds = false  # 推断的 trait bound
```

预设是常用维度组合的快捷方式，维度开关可覆盖预设中的个别维度。例如 `preset = "review"` 再开 `callsite = true` 只加调用点 effect 标注，不开其他 audit 级内容。

同一份代码在不同等级下的表现：

```ring
// preset = "none" — 零噪音
fn process(items) {
    items.filter(fn(x) { x.age > 18 }).map(fn(x) { x.name })
}

// preset = "review" — code review / 团队协作
fn process(items: List<User>) -> List<Str> with {io} {
    items.filter(fn(x: User) -> Bool { x.age > 18 }).map(fn(x: User) -> Str { x.name })
}

// preset = "audit" — 逐行审查，调用点 effect 可见
fn process(items: List<User>) -> List<Str> with {io} {
    items
        .filter(fn(x: User) -> Bool { x.age > 18 })  //: pure
        .map(fn(x: User) -> Str { x.name })           //: pure
}
```

降级/升级标注只需一个命令：

```bash
ring fmt --preset=full    # code review 时全展开
ring fmt --preset=none    # 日常开发最简洁
ring fmt                  # 使用 .ringfmt.toml 配置
ring fmt --check          # CI 检查：是否符合配置（不修改文件）
```

#### 3.2.3 标注语义：pub 契约 vs. 内部文档

标注在两种位置有不同的语义强度：

| 位置 | 语义 | 编译器行为 | 理由 |
|------|------|-----------|------|
| `pub fn` 签名（返回类型 + effect） | **契约** | 不匹配 = 编译错误 | 调用方依赖此签名，是 API 边界 |
| 内部（let 类型、lambda 参数、局部 fn） | **文档** | 不匹配 = 编译错误 | 引导开发者运行 formatter 刷新 |

两者都在编译时检查，但 formatter 对它们的处理策略不同：

| 标注状态 | 内部标注 | pub 签名标注 |
|----------|---------|-------------|
| 缺失 | 按 level 补上 | 按 level 补上 |
| 正确（匹配推断） | 保持 | 保持 |
| **错误（不匹配推断）** | **直接更新** | **不动，报 warning** |

关键区别：内部标注是 formatter 管辖范围，过期了直接刷新；pub 签名是 API 契约，可能是有意的 breaking change，也可能是无意的 body 改动，formatter 不替人做判断。

#### 3.2.4 工作流

```
编辑代码
  → ring fmt        # 内部标注自动刷新；pub 不一致的报 warning
  → ring check      # pub 标注仍不一致 → 编译错误
  → 人决定是否更新 pub 签名
  → ring fmt        # 确认一致
```

**Intentional breaking change**：改了 pub fn 的 body 后，编译器报"标注 Int，推断 Option\<Int\>"。开发者主动修改标注 → 这个改标注的动作本身就是 breaking change 的显式声明。

**Force mode**（绕过 pub 保护）：`ring fmt --level=0` 去掉所有标注 → `ring fmt --level=N` 重新生成 → pub 签名被重置为推断结果。两步操作 = 显式意图，不需要额外 flag。

**不想管标注的人**：工作在 Level 0，没标注就没不一致的问题。需要时一键 `ring fmt --level=4` 全量生成。

#### 3.2.5 机械约束

三层保证标注与推断的一致性：

**1. 编译器**：标注存在就检查。不匹配 = 编译错误。不区分 pub/内部——统一的信号："标注过期了"。

**2. Formatter 性质**：
- **幂等性**：`fmt(fmt(code)) == fmt(code)` — 格式化两次 = 格式化一次
- **Round-trip**：`fmt(level=0, fmt(level=N, code)) == fmt(level=0, code)` — 升级再降级 = 降级
- **语义不变**：`compile(fmt(level=0, code)) == compile(fmt(level=N, code))` — 任何 level 编译到相同结果
- **规范化**：effect 排序、类型表示、空白 — formatter 输出唯一确定

**3. CI**：`ring fmt --check` 验证文件是否符合配置等级，不符合 → 非零退出码。

#### 3.2.6 架构：Formatter 是 Checker 的下游

Formatter 需要类型推断结果才能生成标注，因此它在编译管线中的位置是 checker 之后：

```
源码 → Parser → AST → Checker → HIR（含完整类型 + effect）
                                   ↓
                             Formatter（读 HIR，按 level 回写标注到源码）
                                   ↓
                             格式化后的源码
```

纯语法格式化（`ring fmt` 不带 `--level`）只需要 AST，不需要 checker。标注密度调整需要 checker 结果。Formatter 与 LSP 共享 checker 基础设施。

```toml
[annotations.effects]
ide_display = "inline"          # inline | gutter | highlight | none
materialize_as = "comment"      # comment | annotation | none
```

---

## 4. 方法调用与 impl 块

### 4.1 方法调用与 `::` 模块路径——两个独立范畴

Ring 没有 UFCS（Uniform Function Call Syntax）。`::` 和 `.method()` 是两个不互通的世界：

- **`::`（模块路径）**：解析模块内的函数/常量/类型。`std::fs::read_file(path)` 调用 `std/fs` 模块的自由函数。
- **`.method()`（方法调用）**：解析 receiver 的方法。解析链：impl 方法 > trait 方法 > builtin 方法。**不**回退到自由函数。

```ring
impl List<T> {
    fn map<U>(self, f: fn(T) -> U) -> List<U> { ... }
}

my_list.map(fn(x) { x + 1 })   // 解析到 List.map（impl 方法）
```

**自由函数不能通过 `.method()` 调用**：

```ring
fn double(x: I64) -> I64 { x * 2 }
42.double()   // ❌ 编译错误——double 是自由函数，不在方法解析链中
double(42)    // ✅ 唯一正确写法
```

**方法不能通过 `::` 调用**：

```ring
List::map(my_list, f)   // ❌ 不存在——:: 是模块路径，不是类型限定符
```

公理⑧在此被编译器结构天然保障——`::` 和 `.` 是两个互不重叠的语法域。LLM 训练数据里对数学函数用自由函数、对容器操作用方法的惯例足以区分，不需要编译器允许两种写法。

### 4.2 impl 的定位

impl 不是 OOP——没有继承、没有 vtable、没有 this 指针。self 就是第一个参数，impl 就是给函数挂了个类型标签做查找。

### 4.3 Trait Effect 子类型（2026-05-24 确定）

Trait 方法声明 = effect 上界（契约）。实现可以更窄：

- Implementer 的 effect 可以 ⊆ trait 声明（更窄有效）
- 泛型调用（`S: Storage`）：编译器用 trait 声明的 effect（保守）
- 具体类型调用（已知 `MemoryStorage`）：编译器用 impl 的实际 effect（精确）
- 私有 trait：effect 完全推断（所有 impl 的并集）
- impl effect 超出 trait 声明 → 编译错误

### 4.4 Trait 系统约束（2026-05-24 确定）

Ring 有意选择简单 trait 系统，换取更强推断能力：

- 支持 blanket impl（`impl<T: A> B for T`），不允许 overlap
- 不支持 specialization（blanket impl + 具体类型覆盖）
- 性能特化由编译器单态化 + Phase E 热路径优化替代
- Default 覆盖由 trait 默认方法替代
- 不支持函数重载（破坏 HM principal types）

### 4.5 泛型约束推断（2026-05-24 确定）

所有函数（pub/私有）统一推断泛型约束（类型检查 + lv2 标注）。单态化是 codegen 优化，和类型系统无关。

**推断算法**：方法调用 → 反查提供该方法的 trait → 添加约束。

- 方法名全局唯一时 100% 能推断
- 方法名冲突 = 语义错误（ambiguous method）
- 最小约束 = 只含实际调用方法对应的 trait（不做 supertrait 归并）
- 方法属于具体类型固有方法（非 trait）→ 推断为具体类型参数（非泛型）
- 不需要 `impl Trait` 语法（推断比 impl Trait 更强）

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

### 5.3 委托（替代继承的复用机制）✅ 已实现

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

## 7. 内存管理与所有权（2026-05-24 确定）

**当前状态**：JS 后端使用 V8 GC，开发者无需关心内存。

**目标方向**：Perceus RC（精确引用计数 + 重用分析），不引入 GC。路线：LLVM 后端初期 malloc-only（bootstrap 阶段），之后过渡到 Perceus RC（B-012）。循环引用策略（B-042）为 Perceus 的前置决策。COW（copy-on-write）为 Perceus 内部优化，不是用户可见语义。

> **历史注记**：早期设计文档曾规划"分代并发 GC"，已被 Perceus RC 方向取代。

### 7.1 所有权模型

- Ownership + move 语义（move 后不可用、Drop 恰好一次）
- 小 struct 自动值语义（栈分配，copy-on-assign），编译器按大小和递归性判断
- 逃逸分析：短命对象不上堆
- 无 borrow checker——Perceus RC + Ownership + `mut<T>` + Drop 覆盖安全性（见 1.6b 交互矩阵）
- 无可变别名（2026-06-11 拍板，B-110）：复合类型赋值/存字段/返回 = move（use-after-move 编译错误），杜绝 mutable aliasing；COW 因此是不可观测的内部优化（见 §7.5 强制状态）

### 7.2 参数传递：Borrow-by-default

Ring 的参数传递模型：默认只读借用，编译器推断 move，无 lifetime 标注。

| 参数形式 | 语义 | 说明 |
|----------|------|------|
| `x: T` | 只读借用（默认） | 调用方保留所有权，被调用方不能逃逸 |
| `mut x: T` | 可变借用 | 已有语义，不变 |
| `move x: T`（推断） | 移动所有权 | 编译器从函数体推断（参数被返回/存入字段/跨 spawn） |

**设计选择**：无 `&T` 语法，无 lifetime 标注。与 Rust 的核心区别——Ring 用 Perceus RC 代替 borrow checker 保证内存安全。

### 7.3 Move 推断

Move 由编译器从函数体推断，开发者不需要手动标注：

- 参数被返回 → move
- 参数被存入 struct 字段 → move
- 参数跨 `spawn` 闭包边界 → move
- 其他所有情况 → borrow（默认）

推断结果可通过 lv2 标注显式写出（`fn f(move x: T)`），但标注不改变编译行为——标注是文档，不是语义（见 3.2 节标注等级规范）。

### 7.4 逃逸规则

借用值受以下逃逸约束：

- 不能被返回
- 不能存入更长生命周期的位置
- 不能跨 `spawn` 闭包边界

违反逃逸约束 → 编译错误。编译器不需要跨函数逃逸分析——类型系统自动处理传染性（见 7.6 Scoped Struct Borrow）。

### 7.5 赋值语义

| 类型 | 赋值行为 | 说明 |
|------|----------|------|
| 值类型（Int/Float/Bool/Char） | auto copy | 零成本 memcpy |
| 复合类型（List/Map/struct/enum） | move | 保留需显式 `.clone()` |

**强制状态（2026-06-11 拍板，B-110）**：move 是**目标语义**（否决引用语义追认 / Swift 式值语义+COW）——`let ys = xs` 后 `xs` 不可用（use-after-move 编译错误）。当前两后端均未强制（过渡期实际为引用语义，无测试锁定）。落地 = B-110：checker 层 use-after-move pass（两后端共享）+ 句法禁止同 lvalue borrow/mut 借用重叠（`f(xs, mut xs)`，无 borrow checker 下唯一的别名洞）+ aliasing 语义测试趁 JS oracle 在世锁定。`.clone()` 语义 = 独立副本；Perceus 可用 shallow dup + COW 实现——move 杜绝可变别名后 COW 不可观测。不可变数据的共享 clone 退化为免费 dup，编译器自身的 HIR/Type 共享图不受影响；真正报错的只剩「共享 + 可变」站点（改 mut 参数线程化或 L2 `Rc<T>`）。

### 7.6 Scoped Struct Borrow

含借用的类型自动标记为"不可存储"，传参时走 borrow 语义。传染性由类型系统自动处理：

- 含 borrow 字段的 struct → 整个 struct 不可存储（不可返回、不可存入更长 scope）
- 不需要跨函数逃逸分析——struct 的"可存储性"在类型定义时已确定
- 典型用例：Iterator/Parser/Slice 等 "struct 持有引用" 模式可正常使用

### 7.7 函数类型中的 Convention

```ring
fn(T) -> U          // T 为 borrow（默认，与参数 borrow-default 一致）
fn(move T) -> U     // T 为 move（必须手写——唯一不可推断的 move 标注点）
```

大多数回调只读，极少需要 `fn(move T)`。函数类型中的 `move` 标注是唯一一个不可推断、必须显式写出的 move 标注点。

### 7.8 闭包捕获

- 同步闭包捕获借用 → OK（闭包生命周期不超过创建者 scope）
- 逃逸闭包（如 spawn、存入字段）→ 需要 move/clone 捕获
- 具体边界 case 待 B-002 实现阶段验证

### 7.9 Perceus RC + 循环引用策略（2026-05-24 确定）

Ring 采用 Perceus 精确引用计数（B-012），不引入 GC。循环引用通过 `Weak<T>` 库类型解决。

**Perceus RC 路线**：
- LLVM 后端初期：malloc-only（bootstrap 阶段，编译器是短命进程）
- 正式阶段：Perceus RC（精确引用计数 + 重用分析 / reuse analysis）
- COW（copy-on-write）为 Perceus 内部优化，不是用户可见语义

**循环引用策略：`Weak<T>`**

```ring
// Weak<T> 是标准库类型（非关键字）
let parent = Rc.new(Parent { ... })
let child = Child { parent: Rc.downgrade(parent) }

// 使用时升级
match child.parent.upgrade() {
    some(p) => p.name,
    none => "parent already dropped"
}
```

**决策内容**：
- `Weak<T>` 作为标准库类型，配合 `Rc.downgrade()` 和 `.upgrade() -> T?`
- 确定性析构——最后一个强引用 drop 时立即释放，Weak 引用变为 none
- 不引入 cycle collector（破坏 RAII 确定性析构承诺——Drop 延迟 = 资源泄漏风险）
- 不做类型系统禁止循环（GUI/图/观察者模式全部写不了，限制过强）
- 图结构推荐 arena + index 模式（节点存 `List<Node>`，边用 `USize` index 邻接表）

**场景覆盖**：

| 场景 | 解法 |
|------|------|
| GUI 父子组件 | child 持有 `Weak<Parent>` |
| 观察者模式 | listener 持有 `Weak<Emitter>` |
| 双向链表 | prev 用 `Weak<Node>` |
| 图结构 | arena + index（`List<Node>` + `List<USize>` 邻接表） |
| 事件系统 | emitter 持有 `Weak<Listener>` |

**否决方案**：
- Cycle collector：析构不确定，与 Ring 的 Drop/RAII 承诺冲突
- 类型系统禁止循环：限制过强
- 混合方案（Perceus + cycle collector fallback）：两套机制，复杂度高

**RC 性能立场：渐近零开销（2026-06-13 拍定）**

RC 计数操作（dup/drop）**当前有运行时代价**——这被承认为优化器成熟度问题，**不是模型税**。立场：

- **树状所有权（静态可证唯一）处的计数操作全部可被优化消除**，手段已在路线上：borrow 推断（L1，实参不逃逸不动计数）、move 语义（B-110，转移不计数）、Perceus reuse/FBIP（drop 原地复用）、单例化（B-104 D4 dict / D6 none+const，整类退出记账）、标记指针（B-080，标量不进堆）、后续 drop specialization。
- **计数只保留在「真共享」（图状、静态不可证唯一）处**——而该场景 Rust 同样付 `Rc`/`Arc` 的钱：borrow checker 的零开销只覆盖树状所有权，真共享处两个语言成本同构。
- **结论：相对 Rust 渐近无性能损失**。逐场景对照：树状——Rust 无条件 drop / Ring 计数消除后同样零计数；真共享——双方同付 RC；差距 = 优化器完成度，**可测量**（B-104 系列 re-measure 即此判据的实践），随支柱 3（语义驱动性能）持续收敛。
- 在 Perceus 框架下 Rust 模式 = 「计数恒为 1 的退化情形」：Ring 在所有能静态证明唯一的地方向该退化情形收敛，换取的是 lv0 零标注 + 无 borrow checker（栏 C）——Rust 把真共享的标注负担交给程序员手写 `Rc`，Ring 把它变成默认且自动。

**RC 语义立场：与 Rust 静态 drop 的可观测等价 = 四通道总账（2026-06-13 拍定）**

Ring 语义层模仿 Rust（move/borrow/Drop/RAII），底层用 RC 而非静态唯一所有权 + 无条件 drop。**对无 Drop impl 的纯内存值，「内存何时归还」无语义观测窗口——实现差异不可分辨**（残差只剩 peak RSS = 性能范畴，见上「RC 性能立场」）。全部可观测分叉收敛为四通道，逐条封堵：

| 通道 | 分叉机制 | 封堵 | 状态 |
|---|---|---|---|
| ① Drop 副作用次数/位置 | Rust clone = 深拷贝独立资源（N 份 = N 次 Drop）；Ring `.clone()` = dup + COW（一个底层对象 = 1 次 Drop）| **`impl Drop` 禁 `impl Clone`** + B-110 move：Drop 类型 move-only、可达路径恒单一 = 计数恒 1 退化情形，归零点 = 唯一所有权链终点 = **与 Rust 逐点一致且词法可定位**。「资源不可复制」只是该规则的表面理由——它是 COW 不可观测的承重墙 | 已封（本节即承重论证成文）|
| ② identity（地址等价）| dup 副本与原件同地址、Rust clone 异地址，任何指针等价 API 可分辨共享 vs 拷贝 | 语言层**永不提供 ptr_eq/is 类算子**（负面承诺；Rust 提供 `Rc::ptr_eq`，此处主动分叉），Eq 一律 trait 值比较 | 已封——contains/index_of 已改 Ring impl 走 Eq trait 派发（`impl<T: Eq> List`，audit #156 关闭 2026-06-15）；**Map key `===` 残留归 B-107** |
| ③ 析构顺序 | Drop 副作用顺序可观测；Rust 有词法承诺（同 scope 逆序、struct 字段声明序）| **对齐 Rust**（2026-06-13 拍板）：同 scope 逆序 / struct 字段声明序 / 容器元素序。两后端一致，并入差分回归 | **已定**|
| ④ drop 时机 | 提前 drop 使 `Weak.upgrade` some→none、Drop 副作用提前 | D-1 拍板：scope-end 即语义 + as-if 条款（无 Drop impl 且不被 Weak 指向才可提前——提前只发生在无观测窗口的纯内存值上）| 已封已成文（§7.11）|

**COW 的角色澄清（同日）**：COW 不是独立优化，是「`.clone()` = O(1) dup」的**语义修复机制**——dup 省拷贝、COW 保语义（写入点 rc>1 先分叉再写；rc=1 原地写 = FBIP/reuse 入口）。真拷贝成本只在「clone 后双方存活且发生写入」时支付——恰是语义上必须拷贝的时刻。该能力为 RC 模型独有：运行时计数使「唯一持有？」成为 O(1) 可答问题——Rust 静态系统与 GC 均不可答（Rust clone 永远实拷）。B-110 move 杜绝可变别名 → COW 分叉永不可观测 → COW 从应用级特性降为纯引擎优化（即决策表「COW 不可观测原则」）。现状：dup 侧已落地（L1 `HExpr::Clone` = ring_dup）；写时分叉检查随 B-110 强制落地（过渡期两后端同为引用语义，差分不炸）。

**COW 性能可预测性 = 三支柱（2026-06-13 拍定）**：COW 把拷贝成本从 clone 点搬到首个写入点且依赖运行时 rc 状态——归因漂移/非局部性/路径依赖是其经典软肋（Swift「意外 CoW 拷贝」前车之鉴）；且 Swift 的官方解药 `isKnownUniquelyReferenced` 被四通道之②封死（运行时唯一性查询 = identity 观测 API）。Ring 的自有答案：

1. **成本上界定理（预算面）**：`.clone()` 语义成本 = 深拷贝，COW 是惰性兑现——**任何程序 COW 实际成本 ≤ eager 深拷贝成本**。按语义成本做预算，优化只省不加；不存在凭空悬崖，只存在「优化未省成、回落语义基线」（「优化不可观测」在性能面的投影：优化失效下界 = 语义成本）。分叉点对给定输入完全确定可复现（优于 GC 非确定停顿一档）。
2. **move 锚点（归因面）**：Swift 病根 = 隐式共享（赋值即共享，rc 不可见乱涨），Ring B-110 后结构性不存在——「rc>1 且后续被写」仅源于显式 `.clone()`/`Rc<T>`（词法可见）；引擎隐式 dup 只在只读路径（永不分叉）。推论：**每次 COW 分叉的数据流上游必有用户亲手写的 clone/Rc 词法锚点**——归因从全程序大海捞针收窄为沿 lvalue 数据流回溯，有限可追、可教给 agent。
3. **工具层（精调面，待 B-110 写时分叉落地后 Discussion 立项）**：① `ring audit cow`——静态枚举「上游有 clone/Rc 的写入点」= 潜在分叉面，与 `ring audit unsafe` 同手法（可枚举审查面）；② debug profile 分叉归因——按站点计数 + 报共享来源（复用 B-104 `RING_BOX_PROFILE` 侧表基建，release 零开销）；③ fbip 式零分叉断言——热路径函数声明不期望分叉，静态证明或 debug 检查（Koka `fbip` 血统，支柱 3 语义驱动性能的一块砖）。

### 7.10 Perceus 分层实现路线（2026-06-01 确定）

Perceus 天然分层，层次对应依赖链（Koka 自身亦如此演进：先 core dup/drop，再 borrowing，再 reuse）。Ring 切成可独立测试、独立 merge 的序列：

| 层 | 内容 | 作用 | backlog |
|----|------|------|---------|
| **L0 RC 核心** | dup/drop 插入，owned-everywhere，归零即 free | 释放堆内存 → 打破自举内存墙 → 完成全 native 自举 | B-012 |
| **L1 借用推断引擎** | borrow-default + 逃逸点推断 owned；读取默认 borrow、escape-clone、scope-end-drop（实现模型见 §7.11）| 消除 owned-everywhere 的 move-analysis double-free + 泄漏；大幅减 RC 流量 | B-098（引擎）|
| **L1 用户面** | `fn(move T)` 语法、lv2 标注、fmt 策略、pub 规则 | 文档化借用语义（不改编译行为）| B-068（§7.2–7.8，deferred）|
| **L2 Drop/RAII** | 用户 `impl Drop`、全路径 RAII、fail/catch 改 drop-aware unwind、`Weak<T>` | 资源安全 + 循环引用 | B-002 |
| **L3 Reuse (FBIP)** | `rc==1` 时就地改写，drop-reuse 配对、reuse specialization、COW | 性能核爆（函数式零拷贝）| B-079 |
| **L0/L1 完整化** | total return-mode drop pass（drop 所有 fresh-owned 临时）+ 静态 leak verifier；完整 Perceus（Koka POPL'21 garbage-free 定理）| **G-a 内存墙真解**（2026-06-09 数据订正：墙主体 74.5% 是非标量临时，唯完整 RC 可消）+ 编译期证明 0 泄露/0 UAF | B-104 |
| **L4 标量标记指针** | 标量低位 tag 编码进字，所有位置不进堆（局部/临时/字段/容器/Option/泛型/dict 槽）；RC op `if(w&1)return` 跳过标量 | **降级为 peak/perf 优化**（2026-06-09：只消 ~21% BOOL+INT 装箱 churn，非泄漏驱动；G-a 由 B-104 完整 RC 达成）+ 减 alloc/RC 流量 | B-080 |

**关键性质（2026-06-04 订正，#134 证伪原断言）**：原设计假设「L0 owned-everywhere 单独即可解锁全自举，无硬前置」——**错误**。owned-everywhere 对「循环内条件 move」（如 `register_impl_method` 的 `self_type` 在 for 循环里被条件 `push`）是 **double-free（崩溃，非泄漏）**：branch-balancing 给未消费分支强插 `drop`，单值多次 free；Perceus 三套循环机制（pre-loop single-dup / 闭包 per-iteration seeding / branch-balancing）均不覆盖此缝。逐点 always-own sweep 修了 7 处推进 2400×（chk 144→347K）后仍残留同类崩点，本质 = 每个循环/条件 move 需深层 Perceus 手术、站点未知。**结论**：借用推断引擎（L1 的 B-098）被提前到 native-working **之前**——borrow-default 不要求每路径消费 → 未消费分支不再插 spurious drop，从根上消除整类崩溃。L1 用户面（B-068）+ L2 仍是叠加层。

**L0 架构决策**：
- **对象头**：每个堆对象 offset 0 为 `{rc: u32, typeid: u32}`，dup/drop 类型无关（读 `*(u32*)ptr` 加减）。
- **drop dispatch**：per-type drop 函数 + typeid 全局派发表；内建类型 runtime 手写，用户 struct/enum 由 codegen 生成 `drop_T`（Koka 风格 per-type drop/scan）。
- **IR**：HIR 扩展显式 `Drop`/dup 节点（RC 行为可 dump/测试），仅 `--target=llvm` pass 产出，JS 路径跳过。
- **算法**：反向 liveness + branch-balancing，翻译 Koka Perceus（POPL'21）`⟦·⟧`。
- **范围边界**：L0 不处理 abort 路径 drop（longjmp 跳过 = 泄漏，非 UAF，安全；留 L2 drop-aware unwind）；不处理循环引用（树/DAG 自举无环；`Weak<T>` 在 L2）。
- **闭包 capture 所有权（2026-06-03）**：capture 进 env 有两种所有权语义——**owned capture**（gen_lambda 普通闭包；perceus 对 non-last-use 发 dup、last-use move-in，env 死时**该** drop）与 **borrowed capture**（catch/handle 闭包为让分支平衡 `Drop` 能执行而捕入，所有权不在 env，由 arm 内的显式 `Drop` 释放，env 死时**不该** drop）。当前 env struct 复用 closure typeid（7），`drop_closure` 只 drop slot[1] → 捕获 ≥2 时泄漏 + 误递归。落地分两步：**C 增量（#130，B-084）**先给普通闭包 env 独立 typeid + per-env `drop_env_T` 释放 owned captures，catch/handle 闭包显式排除（维持现状泄漏，本就如此，因 `ring_try` 不 drop 闭包）；**A 波（B-096）**再正式建模 borrowed capture（不进 env 或标 no-drop）+ `ring_try` 后 drop body/catch 闭包。差分测试抓 double-free（crash）抓不到泄漏 → owned-capture drop 可验证安全，遗留 catch 泄漏不退化。

**Ring 相对 Koka 的简化**：effect 仅 tail-resumptive + abort（无 multi-resume）→ 无 reified continuation 复制问题，handler 的 RC 退化为普通作用域 backward liveness。

### 7.11 L1 借用推断引擎实现模型（B-098，2026-06-04 确定）

§7.2–7.8 定义**用户面 borrow 语义**（`x:T` 默认借用、move 推断规则、逃逸约束），§7.10 L1 行给出高层方向。本节定义 B-098 的 **IR 级实现模型**——用户面语义不变，本节只定「RC 行为如何落到 HIR/codegen」。

**为何 spec 字面模型不完整**：§7.10 L1 原述「读取默认 borrow、escape-clone、scope-end-drop」未指明 escape-clone 的 IR 承载层。`HStmt::Dup{name}` / `HStmt::Drop{name}` 只能按**名**操作（codegen 查 `named_values` alloca）。撤销 always-own 读取 dup 后，非 Ident 逃逸（`list.push(parser.tokens)`、`return node.children` 等 FieldAccess/IndexExpr）的值**没有名字**，perceus 无法对其发 name-level Dup → 该值成纯 borrow → 持有它的 aggregate 与存入它的容器双 drop → **double-free（崩溃）**。故需一个**按值**的 clone 原语。

**实现模型 = clone-all-escape（保守版，正确性优先，无崩无泄漏）**：

1. **读取 borrow**：撤销 always-own 读取 dup——`gen_field_access`、`ring_list_get`/`_opt`、`map_get(_opt)`、`map_int_get(_opt)` 等返回容器**内元素指针**的读取**不 dup**（borrow）。**例外：owned-容器构造器（`map_values`/`map_entries`/`map_keys` 等）不是读取**——完整结论与函数清单见下「实现订正 #1」（2026-06-04 worker [决策] 订正，此处不重复）。

2. **逃逸点 clone-or-move**（区分依据 = 逃逸值是否有**独立 owner**）：
   - **有独立 owner → clone**：Ident 绑定（绑定仍持有，scope 末 drop）、FieldAccess/IndexExpr/容器读取结果（aggregate 仍持有）。
   - **fresh 临时值 → move**（无独立 owner，sink 成唯一 owner，clone 会泄漏）：函数调用结果、字面量、struct/variant 构造。
   - 逃逸点 = 容器 push/insert、struct/variant 字段存储、list/tuple 元素存储、return/尾位置、绑定到更长 scope 的 let、逃逸闭包捕获。

3. **值层 clone IR = `HExpr::Clone{inner}`**：perceus 判定逃逸值为「有独立 owner」时把表达式包成 `Clone{inner}`；codegen lower 成 eval inner → `ring_dup(结果)` → 返回结果。携带标准 HExpr 元数据（type 取自 inner）。Ident 逃逸亦统一走 `HExpr::Clone`（或现有 statement-level `HStmt::Dup`，两者对 Ident 等价）。

4. **scope-end-drop-once**：每个 owned local 绑定在 scope 末 drop **恰好一次**；return 路径在 clone 返回值后 drop 所有 live locals。**无 per-path branch-balancing**。

5. **所有参数 borrow**：callee **永不 drop 参数**（撤销 `transform_fn_body` 无条件 param drop）。参数逃逸时 clone（调用方保留所有权）。§7.3 的 move-参数推断是**纯优化**，B-098 **不做**（留后续）。

6. **无 last-use→move 优化**（留 L3 reuse）：连 last-use 的 Ident 逃逸也 clone（再 scope-end drop）。代价是 churn，但**比 always-own 少 dup**（读取 ≫ 逃逸）、**无泄漏**。

**Drop 时机语义（2026-06-12 D-1 拍板，公理⑥消歧）**：上表 4 的 scope-end **即语义本身，不是临时实现**。last-use drop / FBIP 重用（L3，B-079）的合法性来自 **as-if 条款**——仅当该类型**无用户 Drop impl 且不被任何 `Weak<T>` 指向**（类型级可判定）时，引擎可提前 drop；否则钉死 scope-end。约束来源：`Weak.upgrade()` 使 drop 时机可观测（提前 drop 会把 `some` 变 `none`），用户 Drop impl 的副作用时机同理。**B-104 D3 的 `Weak<T>` 按 scope-end 语义落地**。仲裁记录见附录「公理仲裁决策表」。

**为何从根消除 #134**：逃逸 **clone 而非 consume** → 绑定/参数**永不被按路径消费** → 不存在每路径消费不平衡 → branch-balancing 整个不需要 → 未消费分支不再插 spurious drop → 循环内条件逃逸不再 double-free。`self_type` 验证：`resolve_impl_self_type` 创建 rc=1 → self 迭代 push 处 `Clone`（rc 1→2，list 存入）→ 非 self 迭代不碰（else 无 spurious drop）→ 循环末 scope drop 一次（rc 2→1，list 留 1）。无 double-free 无泄漏，不依赖循环/分支嵌套层数。

**闭包捕获边界（B-098 vs B-096）**：B-098 把**所有闭包捕获保守当 owned**——捕获处 clone，env 死时 drop（复用 B-084 已落地的独立 typeid + per-env `drop_env_T`）。leak-free + crash-free（绑定 rc=1 → 捕获 clone → rc=2 → env drop → rc=1 → 绑定 scope-end drop → 0，配平）。B-098 **不碰** catch/handle 闭包、`ring_try` drop、borrowed-capture 优化——这些归 **B-096**（在 B-098 之上做 sync-闭包 borrowed-capture 优化 + `ring_try` 后 drop body/catch 闭包 + guard-false 边 + Range/dict `drop_T` + evidence struct）。

**范围边界**：B-098 **仅引擎**。用户面（`fn(move T)` 语法 / lv2 标注 / fmt 策略 / pub 规则）= B-068（§7.2–7.8，deferred，不阻塞 native）。abort 路径 drop = B-002（§7.10 范围边界，longjmp 跳过 = 泄漏非 UAF，安全）。闭包 RC 收口 = B-096。

**内存**：clone-all-escape 的 dup 次数 < always-own（读取远多于逃逸），预期满足 G-a 内存门（带 RC native 自编译峰值 << 25.9GB）。

**实现订正（2026-06-04，B-098 落地）**：字面模型对**树形 owner**成立；编译器自身的 HIR / inference 是**共享图（DAG）**，落地时两处必要收紧（均保守、crash-free）：
1. **owned-container 构造器 ≠ read-borrow**：`map.values()` / `map.entries()` / `.get()`（`ring_map_values` / `ring_map_entries` / `ring_list_get_opt` / `ring_map_get_opt` / `ring_map_int_get_opt`）新建 owned 容器（List / Option）并把元素 dup 进去——这 dup 是「逃逸进容器=clone」的运行时内联，**保留**。只有**直接返回元素指针**的读取（`ring_list_get` / `ring_map_get` / `ring_map_int_get`，供 IndexExpr / for-in / tuple-field / `m[k]`）+ `gen_field_access` struct 投影撤销 dup（borrow）。`.unwrap` / `.to_fail` / `.unwrap_or_else` 返回 Option 载荷借用 → owner-bearing（逃逸 clone）。
2. **`let x = <Call 结果>` 保守不 drop**：callee 可能返回与共享状态别名的值（`InferResult.subst` 别名线程化 `UnionFind`；pass-through HIR 节点），故 scope-end drop 仅对 init 为 **fresh 构造器或 owner-bearing（→Clone）** 的绑定发出；Call/EffectOp/BinOp/控制流结果绑定**不 drop**（泄漏，crash-free）。**（已订正：本条保守机制被 B-103 return-mode 分类 + B-104 D1 取代——owned-call 结果现已正确 drop，见下 R-clean 段与 ⭐ 完整 Perceus RC 段。）**闭包捕获在 `gen_lambda` **构造时** dup（env 取得自己的 owned 引用，`drop_closure_env` 释放），非 body 内 clone。
3. **enum 变体构造器的 call 语法 = 所有权 sink（B-101，2026-06-05）**：`some(x)` / `ok(v)` / `err(e)` / 用户 `Variant(payload)` 写成 **call 语法**时 lower 成 `HExpr::Call`（callee = 变体 JS 名 `${Enum}_${variant}` 的 Ident），运行时 `ring_enum_some` / 变体构造 **按所有权存指针、不 dup**——与 `StructLit` / `NamedVariantConstruct` 字面量字段存储同构。故 perceus 把这类 call 的**全部值参数当逃逸（sink）位置**：owner-bearing 参数 escape-clone（`is_variant_constructor_call`，判据 = callee 是 bare Ident 且 `resolved_name` 以结果 EnumType 的 `${name}_` 开头）。**漏 clone → 参数 scope-end-drop 释放新 enum 持有的载荷 → native UAF**（prelude loader 的 `match find_std_dir() { some(std_dir) => … }`：`std_dir` 载荷被提前释放 → 整个 std prelude 静默加载失败）。安全不对称同 `sink_arg_indices`：假阳=多 clone（泄漏），假阴=UAF，故偏向 inclusion。回归 `tests/cases/llvm/variant_ctor_owned_arg.ring`（旧 `option_methods.ring` 只用字面量载荷 `some("alice")`，从不触发本 bug）。

**Type-DAG RC 试错结论（2026-06-05→06-07；缩编 2026-06-12，四条死路过程全文见 git history + backlog B-102 归档块）**：Wave A native 实证首版落地的根因 = `ring_dup` 浅 +1 vs `drop_T` 深递归 + `apply_subst` 故意共享子结构 → over-free DAG 共享子树。A1 never-drop（永不回收、线性爬 15GB）、A2 intern 两版（never-drop 下零内存收益 / 非-interned 仍无界泄漏）、通用 Call arm 保守不 drop（瞬态不回收）四条路先后失败。**现行真值 = R-clean pure Perceus RC：撤 A1/A2 全套 hook，Type 回 clone-all-escape（git `27fe62d`，见下段）；intern 留作后续纯性能优化。** 日后重启 intern 的三条硬约束（本轮实证，活约束）：key 逐字对齐 `types_equal`（FnType effects 有序、Record/EffectRow 无序集先排序，不复用有损 `type_to_string`）；含未解析 TypeVar 不入表（未绑定 var 会原样穿出 apply_subst）；Struct/Enum 不可 nominal-shallow key（apply_subst 不代换 variants/fields 而 exhaustive 结构化读 → stale payload 健全性洞）。

**存活修复（非试错、现行机制，B-102 Phase 1，git `1a6b1d7`）**：perceus `rc_block_inner` owned 集改**增量可见**（绑定只从 `let` 起进 visible_owned，新 `stmt_droppable_locals`）+ runtime `ring_list_extend` 元素 escape-dup——终结「codegen 同名 local 共享 function-entry alloca → 该名未构造的分支被整块 scope-drop over-free」的多层 UAF 链（`resolve_type_expr` 读 freed `TypeExpr` / owned 别名污染 sibling 分支 / extend 共享元素双释放），ASan-clean ×3。

**R-clean 落地 + B-103 return-mode 分类（2026-06-07/11，git `27fe62d`；缩编 2026-06-12，过程见 git）**：撤 A1/A2 + Type 回 clone-all-escape——dup-on-share 由 clone-all-escape 自动盖全（apply_subst 透传 + intra-node 共享走字段 escape→`HExpr::Clone`），native real_program ×3 ASan-clean。G-a 当时 gate 在「缺函数 return-mode（owned vs borrowed）知识」（贯穿 B-098/B-101/B-102 的「fresh vs alias」根问题）→ **B-103 完整 return-mode 分类（✅ 2026-06-11）**：runtime ~170 函数全量分类表（FRESH/BORROW/SCALAR/NULL-NEVER）落 perceus.ring，`is_droppable_init` 据此正确回收 owned-call 结果、不误 drop borrow。

**G-a 归因终订 + 升里程碑（2026-06-07）**：alloc/free 计数器实测 **88% 分配从不释放**——**内存墙 = incomplete Perceus RC（中间临时从不 drop）+ 标量 uniform-boxing，非 Type-DAG over-free** → B-104 升里程碑开专门 session（四波演进过程见 backlog B-104「里程碑化」归档摘要，最终形态见下段）。

**⭐ 完整 Perceus RC = total drop pass + 静态 leak verifier（2026-06-09 确定，G-a 真解，取代「标记指针 = 真解」，先读本段）**：

B-104 四波（W1/W2/W3a/W4）+ 两个 range-loop 修复（counter `15b5318` / bound `40ebf23`）**证伪了** 2026-06-08「精确-RC 已尽、INT 残留 = irreducible 存活装箱、G-a 交棒标记指针」的判断——range-loop 修复把 INT leak **47.8%→1.6% plateau**，证明 INT 残留是 precise-RC 没盖到的 **loop-var 临时**（一修就掉），非 irreducible。重测后墙主体 **74.5% 是非标量临时**（STR 24% / OPTION 22% / CLOSURE 17% / TUPLE 8%）+ BOOL 19%；标记指针（B-080）只消 ~21%（BOOL+INT）、**非墙驱动 → 「标记指针 = G-a 真解」被数据推翻**。

**根因（用户诊断准确）= clone-all-escape 只实现半套 Perceus**：只 drop named let-绑定 + 逃逸，**不 drop 中间临时、不做 backward-liveness**。wave 式按语法位置一个个补临时**无完整性不变量** = "哪里漏堵哪里"的 debug 心态打地鼠，永远不知道补完没有，只能跑 self-compile 看 OOM。

**真解 = 把 Perceus 做完整（garbage-free by construction）**：Perceus 论文（Koka POPL'21）的 garbage-free 定理——完整算法下对象在**不可达瞬间精确释放一次** → 0 泄露 + 0 UAF。漏的是"半套实现"，不是 RC 解决不了。三件事收口（D1/D2/D3，2026-06-09 用户拍板）：

1. **完整 return-mode 驱动的 total drop pass（D1，取代 wave；✅ 2026-06-11/12 落地，Stage 1-3）**：地基 = **B-103 完整 return-mode 分类**（owned vs borrowed-of-param，每个 call/builtin 叶子；提前为硬前置——total pass 的 drop 决策全靠它）。规则 = 每个 **fresh-owned 临时**（子表达式产 owned 且父节点借用/丢弃它）在 last-use 后 drop，**统一覆盖所有子表达式位置**（arg / scrutinee / condition / receiver / subexpr / control-flow-init），不再一波一个位置。**为何不重蹈 #134**：临时天然**单次使用**（被父节点用恰一次）→ "何时 drop"是 **per-subexpr 局部判定**（父消费/逃逸→不 drop；父借用/丢弃→用完即 drop），给定 B-103 分类即确定，**不需要** owned-everywhere 的 per-path 消费平衡（#134 的来源）。W1/W2/W3a/W4 是本 pass 的**前身**（手工按位置版）→ 收编为统一算法，不废弃已验证的安全性。

2. **静态 leak verifier（D2，"保证 0 泄露"的机制；✅ 2026-06-12 落地 = `verify_rc.ring` + `--verify-rc` 挂 npm test，编译器 self-verify 0 errors + 1292 文档化豁免，上线即抓出 RC pass 3 个潜伏漏洞）**：post-RC HIR 上的线性检查器——断言**每个 owned 值恰好被消费一次**（逃逸 / return / drop 三选一）+ **每个 drop 目标非 borrow**。通过 = **编译期证明** 0 泄露 + 0 UAF（不靠跑 self-compile 看 OOM）；不通过 = 编译器直接指出"第 X 行临时 owned 但无人消费"。翻译 Perceus 论文的 well-formedness judgment，挂进 `npm test`（`--verify-rc` 模式）→ 让 0 泄露被**强制**而非祈祷；同时是 total pass 重写的**编译期 UAF 安全网**（比裸跑 ASan 早，正面回应曾被 owned-everywhere double-free 烧过的风险）。这是"debug 心态"与"完整功能"的分界线。

3. **"0 泄露"的精确范围（D3）= 无环 0 泄露 + 环用 `Weak<T>`（承 §7.9）**：RC 物理收不了环 → Ring 答案是 `Weak<T>`（§7.9 已定案，不引入 cycle collector）。"0 泄露" = 无环数据**字面 0** + 环由程序员用 `Weak<T>` 打破（Swift / Rust `Rc` / Koka 同级标准保证）。自举工作负载（HIR 树/DAG，无环，§7.10 已确认）→ **字面意义的 0 泄露**。

**D1 实现不变量（Stage 2 落地，2026-06-11——扩展 rc_block_inner / total pass 时必须保持）**：

- **dropping-block tail-escape 不变量**（`rc_block_inner`）：凡发出 scope-end drops 的 block，其 tail 一律按 escape 处理——RC 把 tail 重写为 `let __rc_scope_N = <owned tail>` + Ident，hoist 的 tail 值存活到 drops **之后**才被父节点消费，故 borrow tail（直接借用，或经控制流 arm tail 借用本 block 将 drop 的 local）必然悬垂。任何「tail 借用本 block 将 drop 的 local」形态都是 UAF 类。该不变量修复了 W2 起即存在的 ASan 实证 UAF（cond-block 内材料化 scrutinee 在 block 末 drop，match arm 刚返回其 solely-owned payload 投影 → unbox 读 freed）。代价 = borrow 位 dropping-block 的 owner-bearing tail 多一个 dup（有界、crash-free 方向）。
- **unknown-ownership 守卫**：静态类型为 TypeVar / ErrorType 的值**不材料化、不 drop**（ownership 未知，drop 是赌博）——audit #149（未标注 fn 返回过度泛化 → TypeVar）洞的 RC 侧防线，ASan 双向实证（pre-guard UAF / post-guard EXIT 0）。checker 根修归 #149，守卫在根修后仍保留（防御纵深）。

**标记指针（B-080）降级**：从「G-a 真解」降为后续 **peak/perf 优化**（消 ~21% BOOL+INT 装箱 churn + 标量分配，**非泄漏驱动**）；condition-result Bool box 由 total pass drop（precise RC），BOOL 装箱本身的 churn 留 B-080。**G-a 经 B-104 完整 RC 达成，不依赖 B-080。**

**dict evidence HIR 一等化（#151 根治，2026-06-12 拍板，实现 = B-104 D4）**：

D1/D2 收口后 re-measure（2026-06-12）显示 G-a 后两门未达，最大单一泄漏类（residual 28%~38%）= **audit #151：LLVM 后端在调用点执行时 fresh 合成 trait dict**——泛型 Eq 派发恰泄 1 TUPLE + 2 CLOSURE + 1 dict 名 STR/次（5-probe 实证），单态 `xs.contains()` 同中。结构性原因：**dispatch 决策（`DictRef`/`TraitDispatch`，hir.ring:22-31）早已 HIR 可见，但 dict 值的构造与生命周期在 codegen 层合成**——HIR/ANF/D1/D2 永远盖不到，只能当 verifier 豁免类。JS 后端同名 dict = 模块级单例 const → per-execution fresh 是 LLVM 后端独有偏离。

**拍板 = 三案中 (c) HIR 一等 evidence，吸收 (b) 单例语义（静态单例 + 动态局部混合形态）**，否决 (a) per-use drop（codegen 内手工配对面大 + churn 不消，自编译 ~1.27 亿对 malloc/free 留热路径）与纯 (b) codegen 级缓存（解决泄漏与 churn 但 dict 仍 HIR 不可见，豁免类永存）：

- **静态 dict（Simple + inner 全静态的 Wrapped）= HIR 模块级单例实体**：使用点 = borrow 引用（不 Clone / 不 Drop / 不入 owned），两后端从同一 HIR 实体 lower——JS emit 模块级 const（现状不变，结构对齐），LLVM emit module 级 global + 使用点单 load。churn 与 TUPLE/CLOSURE/STR 三类泄漏一次全消。
- **动态 dict（inner 含动态 dict 参数的 Wrapped）= HIR 局部 evidence 构造表达式**：owned，D1 普通规则 drop、D2 verifier 正常记账——(b) 覆盖不了的残留在 (c) 下也被正确收口，verifier 的 #151 豁免类整类消失。
- **有界性论证（与 R-clean 否 Type intern 不冲突）**：Type 随推断步无界新生，故 intern/never-drop 是死路；dict 集 = 程序文本的静态属性（#impl × #trait + builtin 组合，小常数）→ 单例真等价于安全 intern。单例建议 dedicated never-drop typeid 作纵深（stray drop 变 no-op）。
- **范围边界**：只一等化 dict 的构造与生命周期；**不重构 evidence 参数传递机制**（`TraitDispatch::Dict{param}` / dict 实参线程化已工作，不动）。Ord cmp 结果 INT box（`gen_ord_dispatch_llvm` unbox 后不 drop，while-cond box 同家族）是独立 codegen 缺口，随 D4 一并补。

**D5 归因后收口：none/const 单例化 + And/Or lower（2026-06-12 拍板，实现 = B-104 D6/D7）**：

D4 后 residual 220.1M@2.382B 经 D5 全量定量归因（box-profile 校准 99.9~100.1%），三类真泄漏占 84%：**And/Or-cond 双臂 box ≈69M**（31%，top-2 源行占 87.5%）、**`none` 构造 ≈64M**（29%，`ring_Option_none` live=born=100% vs `some` 0.09%——JS frozen 单例 / LLVM per-eval fresh，#151 dict 同构偏离）、**const-getter/字面量重物化 ≈51M**（23%，`HDecl::Const` lower 成 zero-arg fn 每访问 fresh，JS = 模块级 const，又一 #151 同构）。#152 runtime HOF 泄漏类自编译份额 0.008% → 对 G-a 零杠杆，降级用户面收口项（脱离 G-a 关键路径，与 B-121 同档）。

- **D6 = none + const Str 单例化先行**（≈115M = 52% residual，低风险快兑现）：有界性论证与 dict 同构——none 是 nullary ctor 单值、const 集 = 程序文本静态属性，单例真等价于安全 intern（与 R-clean 否 Type intern 不冲突——Type 随推断步无界新生）；直接复用 D4 基建（lazy memoised getter + dedicated never-drop typeid 纵深 + perceus borrow 语义 + verifier 零新增豁免）。JS 后端已是单例形态——行为不变、结构对齐。
- **D7 = And/Or lower 成 if-else**（量最大单类、RC 模式改动有 D2-#3 UAF 前科 → 殿后）：checker 末端 pass（仿 dict_lower 先例，两后端同源）lower `a && b` → `if a { b } else { false }`、`a || b` → `if a { true } else { b }`——短路语义天然保持，臂变普通 block → D1 materialization + D2 verifier 统一覆盖整类（**含臂内子表达式 owned 临时**，D5 实证同漏）；既有 And/Or RC 特判（W3a 非 blanket-true 分析、D2-#3 visible-owned 门、D1 保守保留清单 And/Or 行）随 lower 退役。**否决 (a) cond 位 post-unbox drop 扩展**：只 drop 臂 box 本身、臂内临时仍在覆盖外（半套），且 And/Or 与 if-else 同语义应同一 RC 路径（⑧）。
- 三类全落地理论 residual ≈36M（≈1.5%，plateau 形态）→ D7 后 **G-a 三门重验**。

**门① 残余归因先行（D8，2026-06-13 拍板 = 方案 A，承 D7 三门重验）**：

D7 后 G-a 三门：③自编译**首次完整跑通**（exit 0，~10.42B allocs）✅ + ②peak ~10.6GB << 25.9GB ✅ + **①live plateau ✗**。门①未达的精确形态：full self-compile 全程 live 55.6M@2.38B → 185.2M@10.42B，leak% 2.3%→1.8% 单调递减、亚线性、非 plateau；爬升几乎全在 STR 101.9M（字面量/interp）+ SB 47.3M（type_to_string/interp 机器）+ Type 22.7M（D5 已判偏合法存活）= 171.9M/185.2M。**关键签名**：live 涨 3.33× / allocs 涨 4.38×（亚线性）+ leak% 单调递减 = "有界泄漏 + 合法存活增长"，而非 per-iteration 无界泄漏（后者 leak% 持平/上升）。**未归因前无法判定门①是"还差一个收口"还是"判据对持有全程序 HIR 的编译器本就误设"**。

**拍板（方案 A，否决 B 直接当 leak 收口 STR/SB、否决 C 直接重定义门① 收 G-a）= 归因先行**：复刻 D5「先归因再动手」纪律——对 STR/SB/Type 爬升类做 reachable-from-roots 切分（box-profile 站点采样扩成"活根可达 vs 孤儿"判定），定量回桌后分叉（不预批任一支）：
- **孤儿主导** → 真 RC 漏点（候选 type_to_string 瞬态 map-key / interp SB / const-getter 残余）→ 收口（D9），继续逼近 plateau。
- **合法持有主导** → 门①「绝对 plateau」对持有全程序 HIR 的编译器是误设判据 → 重定义门① = 「leak% 有界/→0 + verifier 全绿 + 无 per-iteration 无界类」（现状已满足），收 G-a。

实现 = B-104 D8（measurement-only，不动 RC 语义）。

**门① 收尾（D9，2026-06-13 拍板 = 收口路线 + 判据 refine，承 D8 归因）**：

D8 归因（measurement-only，仪表 git `7d0d10f`，diff 仅 ring_runtime.cpp 未碰 RC）切分终点 ~185M live：**孤儿泄漏 62-65% 主导（非工作集）**，单点高度收敛 `compiler/types.ring:361 type_to_string`——SB ~47M=100% 纯泄漏（插值 StringBuilder 中间临时从不 drop）、Type ~22.7M≈98.7% 泄漏（`Type::UnitType` 叶子构造）、STR ~101M 混合（~85% 合法 churn + 头部 type_to_string 站点 ~45-50M 泄漏）；其余 ~35% 合法工作集（已回收 STR churn + Type/TokenKind plateau）。

**拍板（否决 D8-C「只重定义门① 不修」——残余是真孤儿漏非工作集）= D9 收口 + 门① 判据 refine，两者并存**：
- **D9 收口（实现，= B-104 D9）**：Part 1 = interp / `.map().join()` 字符串构建临时收口（codegen 合成、HIR/D1 不可见的 SB + 中间 String，#151 dict / D6 none/const 同类，SB 100% live==born 从不 drop）——**codegen-drop 是首选/原则 garbage-free 修法**（D9 worker 实测推翻原「codegen-drop 留豁免类」premise：interp SB 是 codegen 合成、从不进 HIR，codegen-drop 零新增 verifier 豁免——属 verify_rc 头注「codegen-level boundary」第 4 类，同 while-cond box drop / Set-iter list drop / range-loop bound drop；HIR-first 对 interp 反而不成比例——SB 构建过程过于普遍、lower 成 HIR 改动面大且 JS 后端 template literal 可读性退化、LLVM 端无收益，2026-06-13 用户拍 A 否决 B/C）。Part 2 ✅ = `Type::UnitType` 单例化（D6 none 同构，done `70db1ef`）。
- **门① 判据 refine**：合法工作集（~35% residual）随被编译程序大小增长（编译器持有全程序 HIR/符号表至 codegen 结束）→ **「绝对 live plateau」对全程序编译器物理不成立、是误设判据**。门① 最终判据改为 **「孤儿类（SB/UnitType/interp-STR）→ ~0 + leak% → ~0/有界 + verifier 全绿 + 无 per-iteration 无界类」**，于 D9 re-verify 施加。**falsifiability 不减**——D8 即以此判据抓出 62-65% 真孤儿漏（= 公理⑥「RC 足够、无需 GC」claim 的可证伪锚点有牙）；refine 是把公理⑥ B-089 falsifiability 锚点「native RC plateau vs V8」中 "plateau" 的操作定义精确化，非移动球门。

**✅ G-a 三门通过（2026-06-13 用户拍板，B-104 done）**：

D9 两 part 落地后 re-measure @2.382B：leak 88%→1.2%（live 27.96M），SB 12.02M→**0**（−100%），STR 28.16M→21.10M（−25.1%）。门① refined 判据逐条：孤儿类→~0（SB=0 / Type 22.7M→0.3M / interp-STR 由 Part 1 codegen-drop 闭合）✅ + leak% 1.2% 递减有界 ✅ + verifier 全绿（self-verify 0 errors）✅ + 无 per-iteration 无界类 ✅。门② peak 10.6GB << 25.9GB ✅。门③ 自编译跑通 exit 0 ~10.42B ✅。**三门全达，B-104 完整 Perceus RC 里程碑完成**（leak 88%→1.2%@2.382B，D1-D9 九个落地棒）。解锁 B-089 native 终验 + B-122 SCC 拓扑序。Capstone 全强度 ASan 自编译（`quarantine_size_mb=256:malloc_context_size=12`）2026-06-13 启动，验证结果追记。

### 7.12 unsafe 区域图景（2026-06-11 确定，细化归 B-106）

**定位：unsafe 区是所有权模型全部张力的最终出处——它定义「语言不在安全区处理什么」。** 三栏总账，每个表达力缺口必居其一、不允许悬空：

| 栏 | 内容 |
|---|---|
| **A 安全区**（目标 ≥99% 用户代码）| 共享→Rc/Arc，环→Weak（§7.9），视图→Span/(offset,len)/arena+index，深层可变→mut 参数线程化 + 嵌套 lvalue path（B-110 #5），性能→引擎优化（COW/reuse/unboxing，不可观测原则见决策表）|
| **B unsafe 区**（库作者，少数）| 零拷贝视图（指进 buffer 的 slice）、自引用/侵入式结构、RIIR 容器底层（malloc/指针算术/未初始化内存）、FFI 裸指针 |
| **C 明确不做** | first-class 借用 / lifetime 标注 / borrow checker；安全区的跨函数零拷贝视图；cycle collector |

栏 C 的可信度由栏 B 背书：「X 不在安全区」的回答是「去 unsafe 区」，与 Rust 同构——撤销旧「Ring 用类型系统消除 unsafe 的需求」立场（原 backlog「不做的控制力」表）。

**形态 = `unsafe` effect**（承 lang-design.md §6.3「用户责任，系统不保证」）：unsafe 原语操作产生 `unsafe` effect，签名可见、自动冒泡。不可被普通 handler 处理——唯一消除方式是 discharge。

**Discharge 模型 = 两级，关键字与 Rust 一致（2026-06-11 用户拍板）**：
- **模块级 = 许可**：`mod name requires {unsafe}`（复用 mod capability 语法）——未声明的模块内不可使用 unsafe 原语；
- **块级 = 责任**：`unsafe { ... }` 吸收块内 unsafe effect，块 = 作者签字「此处不变量已人工验证」，等价 Rust unsafe block。安全封装因此成立：std 容器内部 unsafe、pub 签名纯净；
- 配套 `ring audit unsafe`：列出全代码库 discharge 点。

**与公理④（不信任程序员）的接法**：discharge 点清单 = 整个代码库需要人类审查的全部位置——有限、可枚举、签名可定位。agent 在安全区自由工作；lint 可配「agent 不得新增 unsafe 块」，使人类审查面的增长本身受控。Rust 只有隔离（靠人 grep），effect 系统补上类型层自动追踪。

**与 RC 的交互（雏形已验证）**：unsafe 区裸指针不参与 RC——extern type 类型级 RC 排除（B-104 D1 规则①：不 Clone/不 Drop/不入 owned）即此规则的现实先例，`Ptr<T>`（2026-06-13 定名）为其推广。跨界点 = 所有权显式移交（per-type 三件套，见下）。

**B-106 正文拍定（2026-06-13 Discussion，下列即真值）**：

**`Ptr<T>` 形态**：typed（offset 按 `size_of<T>` 步进，reinterpret 走显式 `cast`）；**单一类型不分 const/mut**（Rust `*const`/`*mut` 三作用中 variance 与借用来源追踪对 Ring 不存在，仅剩文档价值——公理⑧不分，const 意图归注释与封装 API 命名）；`Ptr<T>` 是**普通值**——copy 语义、不参与 RC、存字段/传参/比较皆 safe，**操作才产生 unsafe effect**（effect 挂操作不挂类型，与 fail 同构；安全封装因此成立——RIIR 容器 struct `{data: Ptr<T>, len, cap}` 定义本身不被感染）。

**原语集 v1**（由栏 B 四场景倒推）：

| 原语 | 签名（示意） | effect | 备注 |
|---|---|---|---|
| alloc | `alloc<T>(count: Int) -> Ptr<T>` | unsafe | 返回**未初始化**内存 |
| dealloc | `dealloc<T>(p: Ptr<T>, count: Int)` | unsafe | 带 count：对齐正确性 + sized-dealloc 留门 |
| read | `p.read() -> T` | unsafe | 按位 move out，**不动 RC**，返回 fresh owned |
| write | `p.write(v: T)` | unsafe | 按位 move in，**不动 RC**，不 drop 旧值 |
| offset | `p.offset(i: Int) -> Ptr<T>` | unsafe | **inbounds 语义**（同 allocation 作者承诺 → `getelementptr inbounds`，换别名分析/向量化） |
| cast | `p.cast<U>() -> Ptr<U>` | safe | 造值不炸，deref 才炸 |
| copy | `copy(src: Ptr<T>, dst: Ptr<T>, count: Int)` | unsafe | memmove 语义；nonoverlapping 变体按实测需求后加 |
| addr / from_addr | `p.addr() -> Int` / `Ptr::from_addr<T>(a: Int)` | safe | 对齐计算/tagged pointer；危险链条被 deref（unsafe）卡死 |

**read/write 所有权语义 = Perceus 接口承重墙**：read 产 fresh owned、write 耗 owned，RC pass 视作普通「产 owned / 吃 owned」函数——落进 B-103 return-mode 既有分类，**零特殊化**。buffer 内的值 = RC 世界之外、所有权由封装作者人工记账（RIIR vector：push = `data.offset(len).write(v)` 移入，pop = `data.offset(len-1).read()` 移回；重复 read 同位 = double-free，签字内容，等价 Rust `ptr::read` 契约）。

**相对 Rust 的三处简化（明确不做）**：① 无 `MaybeUninit`——Rust 需要它是因为 safe 区要能持有未初始化值，Ring 的未初始化内存只活在 Ptr 后面、永不以值形态进安全区，「read 前已 init」即签字内容；② 无泛型 `transmute`——99% 用例 = 指针 reinterpret（走 cast）+ 标量 bits 互转（具体 intrinsic 按需提供），最危险的门开最窄；③ v1 无 volatile/atomic——§8 并发定型后随 B-007 系再议。

**extern fn 边界 = 声明处签字**：extern fn 声明要求所在模块 `requires {unsafe}`，声明 = 签字「签名忠实于 C 实现」，调用点 safe（与现状 std 全部 extern 调用兼容；Rust 2024 `unsafe extern` 同方向）。**`extern type` 与 `Ptr<T>` 并存两层**：extern type = 不透明句柄（不可 deref/offset，持有传递天然 safe——LLVM FFI 91 fn 即此层）；`Ptr<T>` = 可算术可解引用的真指针。大量 FFI 永远停留在句柄层，分层本身是缩小 unsafe 面的杠杆。

**跨界移交 = per-type 三件套，不做泛型 `addr_of`**：泛型「对任意安全值取指针」把引擎私有的值表示（box 布局/unboxing/单例化——B-104 D4 dict、D6 none/const 均在动）变成可观测 API，「优化不可观测」被堵死。跨界走容器显式 API：`List<T>::from_raw_parts(p, len, cap)`（移交进 RC 世界）/ `list.into_raw_parts()`（移交出，consume）/ `list.as_ptr()`（borrow 性质，指针有效期 ≤ 宿主存活 = 签字内容）；Str 同构。FFI 调用保活无需新机制（实参 borrow 语义已覆盖）。

**`@repr(C)` 的精确角色**：read/write 按位搬 **T 的值表示**（box 指针或 unboxed 标量），任意 T 永远合法（容器场景无需布局承诺）；需要 `@repr(C)` 门票的是**字段级解释**（把 C 填的内存按字段读、字段指针投影）——默认布局编译器自由重排。投影形态（`offset_of` intrinsic vs 投影语法）归实现项 B-125。

**验收工具 v1** = ASan 两档纪律 + `ring audit unsafe`；miri 类解释器远期挂账不立项。

**RIIR 边界已定（2026-06-13 拍板）= 全部自己实现**：容器底层（vector/string/unordered_map）全部用纯 Ring + `Ptr<T>` 重写，不保留 C++ STL 依赖（「系统语言标准库借 C++ = 玩具」）。unsafe 原语实现 = B-125（P3，XL）；容器 RIIR = B-125 后立项。

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

async 和 sync 代码无缝组合。handler 决定执行策略（设计已确定 2026-05-23）：

```
effect async {
    fn spawn<T>(task: fn() -> T with {async}) -> Future<T>
    fn await<T>(f: Future<T>) -> T
}

fn fetch_both() -> (Data, Data) with {async} {
    scope {
        let a = spawn { fetch_stocks() }
        let b = spawn { fetch_bonds() }
        (await(a), await(b))
    }
}

// 生产环境：默认 async handler 驱动
fn main() with {io, async} {
    let result = fetch_both()
    print(result.debug())
}

// 测试环境：sync handler 直接执行
fn test_fetch() {
    let result = handle fetch_both() with {
        async.spawn(task) => task(),
        async.await(f) => f,
    }
    assert(result.0 == expected)
}
```

**实现策略**：Generator-based。async 函数编译为 JS `function*`，handler 作为 driver 驱动 generator。默认 handler 异步驱动（外层 await yield 出的 Promise），自定义 handler 可同步驱动（直接传 mock 值）。模块导出自动包装为 JS `async function`。

**结构化并发**：spawn 必须在 `scope { }` 内。scope 结束等待所有子任务；scope 提前退出取消未完成子任务。

**取消机制**：被取消的任务在下一个 `await` 点收到 `Cancelled` fail effect。两个 await 之间的同步代码一定完整执行。`Cancelled` 可 `catch` 做补偿（如回滚事务）。

### 8.3 Channel 通信

```
fn producer_consumer() with {async} {
    let ch = channel<Int>(buffer: 16)
    scope {
        spawn { for i in 0..100 { ch.send(i) }; ch.close() }
        spawn { for msg in ch { log("received: ${msg}") } }
    }
}
```

---

## 9. GPU 计算与语义级 Profiling ⚠️ 远期愿景

GPU 操作建模为 effect（`gpu_mem` effect），编译器从 effect/type 信息生成语义 map → 关联硬件计数器（CUPTI/NSight），自动报告"哪个 effect scope memory-bound + 为什么"。三层：编译期标注（零开销）→ 硬件计数器关联 → 编译期性能预测。开发阶段可用 effect handler 插桩做 trace（有扰动）。

**前置**：LLVM NVPTX/AMDGPU target + GPU 内存 effect 建模 + 固定数组（B-070）+ CUPTI 集成。**差异化**：Rust GPU / Mojo / Futhark 无 effect 建模；NSight 无源码语义。

---

## 10. 实现策略

> JS 后端翻译映射（§10.1–10.3）已归档至 git history——JS 是 bootstrap 后端，归档走 B-100。

### 10.4 后端策略

**JS = bootstrap，LLVM = 目标后端。** JS 后端支撑自举 + 当 LLVM codegen 的差分 oracle。归档走 B-100（证明 parity → golden 快照 → 删除）。

**LLVM 后端**：LLVM 22 + Windows MSVC + `x86_64-pc-windows-msvc`。codegen 用 Ring 编写、调用 LLVM-C API。Bootstrap 阶段经 N-API addon（`compiler/llvm-addon/`，不入仓库）；自举后直接 C ABI。**值表示**：uniform boxing（`ptr`），Int/Bool 用低位 tagged pointer（B-080，codegen inline shl/or/ashr）。Float 留 boxed。**Runtime**：`ring_runtime.cpp`（~2200 行 C++ STL wrapper），`extern "C"` 暴露；**RIIR 已拍定全部自己实现**（B-125 unsafe 原语后立项）。**fail/catch**：`setjmp`/`longjmp`；**tail-resumptive effect**：evidence passing（hybrid，详见 backlog B-090）。多文件编成单 Module/单 .o（增量编译 → B-105 deferred）。LLVM O2 管线已接入（B-126）。

### 10.5 FFI 设计

`extern fn` / `extern type` 面向 C ABI。unsafe 原语（`Ptr<T>` + alloc/read/write 等）已设计定案（§7.12），实现 = B-125。容器 RIIR 后 extern fn 数量持续减少。

---

## 11. LLM 友好性设计

> 核心论点与三原则（语法借用 / 一种事一种写法 / 高级特性两路径）详见 philosophy.md §8/§9。本节只记 philosophy.md 未覆盖的具体化内容。

### 11.2 `--error-format=llm`

结构化错误输出，包含可直接复制的修复代码建议：

```json
{
  "error": "refinement_unsatisfied",
  "expected": "Int where 1024 < it < 65536",
  "actual": "Int",
  "fix_hint": "let port = parse_int(raw); if port <= 1024 ... { raise(...) }",
  "alternative": "parse_int(raw) or 8080"
}
```

### 11.3 量化指标

| 指标 | 含义 |
|------|------|
| 首次编译通过率 | 同一 prompt，LLM 生成后首次编译通过的比例 |
| 运行时错误率 | 编译通过后实际运行时出错的比例（本语言应远低于 TS） |
| 自修正轮数 | 首次生成到编译+测试通过的迭代次数 |
| Token 效率 | 完成同一功能的总 token 数（生成+修正） |
| 大库一致性 | 100+ 文件代码库中风格/模式的一致性评分 |

核心赌注：首次编译通过率可能低于 TS（编译器更严格），但运行时错误率和总迭代轮数远低于 TS。

### 11.3.1 代价分配原则

类型系统复杂度增加的是语言的上限，不抬高下限。LLM 友好性的设计分三层：

- **推断能解决的，自动推断**：effect 推断、泛型参数推断。LLM 不需要学，编译器自动处理
- **安全性相关的，编译器强制**：linear types（资源必须消费）、exhaustive match。LLM 不学就编译不过，编译器错误信息就是教程
- **表达力增强的，opt-in**：refinement types、associated types。LLM/用户可以不用，不影响代码正确性；用了可以获得更强的编译期保证

代价分配逻辑：**类型系统的复杂度由 LLM 承担（编译器错误循环迭代），收益由终端用户享受（零 runtime surprise）。** runtime error = 用户介入 = 体验降级；LLM 与编译器搏斗十轮的代价远低于一个 runtime panic 到达用户面前的代价。

### 11.4 控制论视角：编译器替代人类审查

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

## 12. 性能优化策略

> JS/V8 时代的详细性能分析（generator 开销 / V8 去优化 / GC 压力等）已归档至 git history（`design.md@ts-compiler-final`）。当前优化策略以 LLVM native 后端为中心，见 §14.6 双层优化架构 + backlog 性能优化节。

## 13. 竞品与行业定位

详细分析见 [`docs/competitive-analysis.md`](competitive-analysis.md)。核心结论：

**Ring-lang 的独特组合（完整代数效果 + HM 推断 + LLM 友好性）仍无直接竞品。** 最接近的三个方向各有缺失：Zero 有工具链但无效果系统，MoonBit 有成熟度但只追踪错误，Mog 有极简规范但无高级类型。

---

## 14. 企业级性能路线

JS 后端是原型限制，不是架构限制。核心研究问题已被 Koka 等项目解决。

### 14.1 Koka 的启示

Koka（微软研究院）通过两项技术达到 C 性能的 75-85%：
- **Evidence passing**：effect handler 编译为函数调用 + evidence 向量查找，开销等价于 OOP 虚方法调用
- **Perceus**：精确引用计数 + 就地复用分析，完全消除 GC 停顿

### 14.2 编译目标

LLVM native 是唯一目标后端。JS 后端 = bootstrap，归档走 B-100。当前性能基线：native 自编译 290s（-O2 + B-080 tagged pointer），V8 88s，差距 3.3x——主因非标量堆分配 + 零 LLVM 属性标注。

### 14.3 泛型单态化策略（2026-05-24 决策）

按类型表示自动分流，借鉴 C#/.NET Tiered Compilation。不是全单态化 vs 全 boxing 的二选一。

**分流规则**：
- 值类型（I8/I32/I64/F64/`@value struct`）：size/layout 不同，必须单态化
- 引用类型（List/Map/Str/struct）：底层都是指针，共享一份泛型实现（trait dictionary dispatch）
- 热路径：PGO/JIT 决定是否对特定引用类型也单态化

**构建模式**：

| 模式 | 策略 | 编译速度 | 运行时性能 |
|------|------|---------|-----------|
| Debug | 全 boxing（共享泛型） | 快 | 慢（可接受） |
| Release | 值类型单态化 + 引用类型共享 | 中 | 好 |
| Release + PGO | 上面 + profile 驱动的热路径单态化 | 两次编译 | 很好 |
| JIT（远期） | 运行时 tiered compilation | — | 最佳 |

**与 Rust 的根本差异**：Rust 全量单态化导致编译膨胀。Ring 初始方案是 uniform boxing（B-011 决策），只有值类型必须单态化（实例有限，膨胀可控），引用类型共享代码。这从架构上避免了 Rust 的编译性能问题。

**编译性能额外措施（按需实现）**：
- Debug 快速后端（Cranelift）：B-011 codegen 预留后端抽象接口
- 增量编译：函数级增量，effect row 签名 = 精确依赖边界
- HIR 缓存：依赖包首次编译后缓存 type-checked HIR
- 并行编译：模块间 codegen 完全并行（check 完成后签名固定）

### 14.4 关键技术路径

- **LLVM native** 用于桌面/服务端。Koka 编译到 C 再 gcc/clang，Kotlin/Native 直接用 LLVM。已证明可行。
- **Perceus 引用计数** 替换 GC。无停顿、确定性析构、函数式代码可就地复用已死对象的内存。语言设计无需修改——Perceus 是编译器优化，用户代码不感知。
- **Evidence passing** 替换 generator effect handler。同样是编译器优化，用户代码不感知。

### 14.5 先例

- **Swift**：~4 年从"脚本手感"到系统级性能（Apple 全力投入）
- **Kotlin**：JVM → LLVM native，与 Swift 性能差距 ~15%
- **Koka**：已达到 C 的 75-85%，纯研究院项目

### 14.6 双层优化架构（2026-05-28 决策）

Ring 的静态信息（effect、linearity、refinement、purity）比市面上绝大部分语言都丰富。LLVM 能直接消费其中一部分，但不是全部。优化架构因此分两层：

```
HIR（完整 type + effect + linearity 信息）
  │
  ├─ Ring 优化 pass（HIR 层，利用 LLVM 表达不了的信息）
  │   ├─ 纯函数重排 / 并行化（effect 证明无副作用 → 安全重排）
  │   ├─ Perceus 重用分析（RC=1 → 原地修改，不分配新对象）
  │   ├─ Refinement 驱动的 bounds check 消除（Z3 证明 → 删运行时检查）
  │   ├─ 闭包内联 / 特化（已知 trait impl → 消除 dict 间接调用）
  │   └─ Dead effect 消除（handle 掉的 effect → 对应 evidence 代码全删）
  │
  ▼
LLVM IR（附带 Ring 生成的属性和 metadata）
  │
  ├─ LLVM 标准优化 pass（利用前端标注的属性，效果优于 C/C++）
  │   └─ SROA, GVN, LICM, 向量化, 内联...
  ▼
机器码
```

**LLVM 能直接消费的 Ring 信息**：

| Ring 信息 | LLVM 属性/metadata | 优化器用途 |
|-----------|-------------------|-----------|
| 纯函数（无 effect） | `readnone` | CSE、DCE、LICM、可并行化 |
| 只读函数 | `readonly` | 同上，允许重排 |
| mut 参数只改自己 | `argmemonly` | 别名分析改善 |
| 非空类型（默认非空） | `nonnull` | 消除 null 检查 |
| 值范围（refinement） | `!range` metadata / `llvm.assume` | 消除 bounds check |
| 穷尽 match | default → `unreachable` | 消除死分支 |
| move 后唯一所有权 | `noalias` | **杀手级**——允许 store forwarding、向量化 |
| 不 fail 的函数 | `nounwind` + `willreturn` | 更激进的 DCE 和重排 |
| 尾调用 | `musttail` | 保证 TCO |

**LLVM 表达不了、需要 Ring 自己处理的**：
- Effect 组合语义（LLVM 只有粗粒度 readonly/readnone）
- 任意 refinement 谓词（`!range` 只能表达整数区间）
- Perceus RC 重用分析（LLVM 不理解 RC 语义）
- 纯函数间的可交换性/可并行性（LLVM auto-parallelization 几乎不可用）
- Linear type 的"恰好消费一次"约束

**Bootstrap 阶段要求**：Ring 自己的 HIR 优化 pass 是远期工作，但 **LLVM 属性标注从第一天就做**——成本极低（每个函数多几行 `LLVMAddAttributeAtIndex` 调用），收益立竿见影（LLVM 标准 pass 因属性存在而做得更好）。具体地：
- 每个函数检查 effect row：无 effect → `readnone`；只有 fail → 不标 readnone（可能 longjmp）；有 io/mut → 不标
- 每个参数检查类型：非 Option → `nonnull`
- 每个函数检查 fail 可能性：不 raise → `nounwind`

这些信息 HIR 里全有（每个 HExpr 带 Type + EffectRow），不需要额外分析。

---

## 15. 编译器实现

**自举里程碑（2026-05-21）**：编译器从 TypeScript 完全翻译为 Ring，编译到 JS 运行于 V8。TS 原始实现归档于 git tag `ts-compiler-final`。**现状（2026-06-24）**：44 个 Ring 源文件（~35,600 行）。LLVM native 后端（codegen_llvm* 5 模块）+ Perceus RC pass + 静态 RC verifier 已落地。Native 自举 Level 1 完成（2026-06-16）——B-089 三门全绿（G-a 内存 ✅ / G-b 双 bootstrap 字节一致 ✅ / G-c 双后端差分 86/86 ✅）。

**Koka 作为参考实现**：Effect 推断（`InferEffect.hs`）和 evidence passing（`Evidence.hs`）的算法翻译自 Koka 编译器（MIT 许可）。Perceus 引用计数已翻译其 POPL'21 实现落地（§7.11）。

**自举叙事价值**：Ring-lang 的编译器用 Ring-lang 写，由 Claude vibe-coded——同时证明语言能构建复杂系统、LLM 能高效使用。

---

## 设计取舍

| 拿到了什么 | 付出了什么 |
|-----------|-----------|
| Effect 系统统一所有副作用 | 编译器实现极其复杂 |
| Refinement types 编码业务规则 | 静态验证有极限，部分退化为运行时检查 |
| 全推断 + formatter 维护标注 | 类型错误信息可能难以理解 |
| LLVM native 后端 + Perceus RC | 编译器自身是运行时依赖（self-hosting） |
| Row poly + OOP 手感 | 与现有 class-based 生态互操作需要 extern 声明 |
| Const generics + refinement 组合 | 约束求解可能不可判定，需要保守边界 |
| LLM 友好的严格编译器 | 首次编译通过率可能低于 TS |
| 一种事一种写法 | 老手可能觉得缺乏灵活性 |

## 附录：公理仲裁决策表

> philosophy.md「层级与仲裁」规则 2/3 的记录处。公理间冲突、修宪程序、体系级元决策均落此表；per-topic 设计决策仍散于各节，仅涉公理仲裁者入表。2026-06-12 建表。

| 日期 | 议题 | 裁决 | 适用规则 | 可证伪锚点 |
|------|------|------|---------|-----------|
| 2026-06-12 | 体系结构：平铺六条无优先序 → 冲突无法仲裁（D-2） | 三层结构（0 目标 / 1 约束 / 2 策略）+ 四条仲裁规则 + 修宪程序；④ 改写为「无人回路 × 全场景」（全场景 = 量词非第二目标）；⑦「场景不可堵死」自 ⑥ GC 记录升格成文；编号永不重排 | 元决策 | B-111（层 0 判据的测量仪） |
| 2026-06-12 | GC vs ⑥：no-GC 是否站得住（所有权讨论引发重审） | 维持 ⑥：语义层费用引擎无关（②④ 独立强迫 move 语义）+ 不可逆性不对称 + ⑦ 场景路径；性能（GC 停顿）明确不是理由。全文 dossier 见 philosophy.md ⑥ | 规则 3（修宪程序，首例） | B-089 re-measure：native RC plateau vs V8 自编译基线 |
| 2026-06-12 | 优化可观测性：引擎优化（COW/reuse/unboxing）vs 用户可见语义 | 优化不可观测原则（④ 推论，philosophy.md 成文）：引擎优化绝不改变可观测语义；§7.12 安全区表「见决策表」指此条 | ④ 推论成文 | — |
| 2026-06-12 | Drop 时机（D-1）：⑥ 原文「scope 退出/最后使用处」二点歧义违反 ⑥ 自身；`Weak.upgrade()` 使时机可观测 → 与「优化不可观测」（④ 推论）+ L3/FBIP（B-079）预定相撞，gates B-104 D3 | 语义 = scope-end + as-if 条款：引擎仅对「无用户 Drop impl 且非 Weak 目标」类型（类型级可判定）允许提前 drop；B-104 D3 Weak 按 scope-end 落地；⑥「无 GC 停顿」改「无不可预期停顿」（级联 drop 诚实记账）。细则 §7.11 | ⑥ 自身消歧（约束内修正，非修宪） | llvm_diff：Weak/Drop 用例在 L3 reuse 启用前后输出一致 |
| 2026-06-12 | ③ 推论「标注非语义」vs ④「失真必须响」（D-3）：过时标注 = 意图与真值的失真，却只 warning | agent profile 下 warnings 即 errors（CI gate 升级 W 类为 must-fix）；人类场景保留 warning，gradual guarantee 不破；标注语义化否决（毁 formatter 自动维护） | 规则 2（策略间，层 0 判据） | B-111 可测：标注漂移引发的 agent 迭代轮数差 |
| 2026-06-12 | ① 无判定程序、无否决记录，与 GADT/refinement 路线图潜在互蹭（D-4） | 重写为可判定标准：lv0 常见用例零标注可用 + 推断失败错误可被 LLM 单轮修复；B-033/B-001 评审以此投票 | 元决策 | B-033/B-001 评审实际使用该标准 |
| 2026-06-12 | ⑤ 做实（D-5）：HM 最坏指数与「耗时可预期」字面冲突；B-001 SMT 半可判定预定碰撞；trait instance 终止性未证 | 推断 fuel/深度上限、超限=编译错误（B-119）；B-001 spec 补具名可判定片段条款（QF_LIA 类，超出=要求 runtime check）；trait 终止性审计（B-119） | ⑤ 自身做实（约束内修正） | B-119 验收 |
| 2026-06-12 | 公理名单与实战否决记录错位 + 性能地位空白（D-6） | ⑧「一种事一种写法」⑨「语法借用」自「语法原则」升格为层 2 公理；性能成文为非公理工程目标（让位全部公理，受 ⑥⑦ 间接保护，优先级锚点=层 0 判据） | 元决策 | — |
| 2026-06-12 | ② 可见性载体失真（D-8）：「IDE 幽灵标注」对主受众 LLM 无效（agent 读源码文本/编译器输出，LSP 亦不存在） | 主载体改写 = formatter 物化标注 + 模块签名 + `--error-format=llm`；IDE 为人类适配层（B-016）；formatter 等级系统待优先级专题讨论；io 效果粒度记 lang-design §10 待议 | 规则 2 | — |
| 2026-06-12 | B-111 优先级（D-7）：层 0 判据（公理④「LLM 写 Ring 优于 TS」）至今零测量、缺测量仪 | B-111 P2→P1，地位等价公理⑥的 B-089 锚点；只改优先级不动排程（B-104 里程碑照旧先行）。条目见 backlog B-111 | 规则 2（层 0 判据） | B-111 验收 |
| 2026-06-15 | 字符串编码模型：code point API（设计文档）vs 两后端实际行为（LLVM 字节 / JS UTF-16 码元）全面失真 | 选 A（UTF-8 字节串 Rust 模型）：`len`=字节数 O(1)、`chars()`/`char_count()` 提供 code point 级 API；否决 B（code point）理由=O(n) len 自编译 2-5x 退化 + 需 ByteStr 补位违反⑧。§1.7 表格已修正。实现 = B-133 | ⑥⑦⑧（5/7 判据 A 胜出） | B-133 P5：非 ASCII llvm_diff 两后端一致 |
| 2026-06-24 | 层 0 重构：④ 原名「无人回路 × 全场景」绑定 LLM 叙事——核心 claim 应比 agent 窗口更根本 | ④ 改名「不信任程序员 · 编译器是最终权威」；「无人回路 × 全场景」降为渐近表达；出发点从「agent 验证瓶颈」回溯到「程序员不可信是永恒事实」（C/Rust/Ring 三角定位）；LLM-first 降格为推论；核心赌注分两层 | 元决策 | — |

## 附录：实现状态（持续更新；建表 2026-05-24）

### 已落地的设计决策

| 设计点 | 决策 | 理由 |
|--------|------|------|
| Effect handler 语义 | tail-resumptive + abort（full AE 已取消） | evidence passing 天然支持 tail-resume；full AE 工程价值不足（95%+ 场景已覆盖），剩余用例用 async effect + bracket 解决 |
| `or`/`try`/`?` 运算符 | 已移除，使用 `unwrap`/`to_fail`/`to_result()`/`catch` | 简化语法面，减少歧义 |
| catch 语义 | 总是消除 fail effect；部分处理用 catch 内部 match + re-raise（显式） | 消除隐式行为（原设计中有/无 catch-all arm 决定不同类型行为），降低概念数 |
| 错误模型 | 生命周期模型：fail effect 为主（诞生/流动），to_result 物化为数据（落地） | effect 是运动形态，Result 是静止形态；双模型各有地盘而非竞争 |
| 可变性统一模型 | `var` → `let mut`，`Cell<T>` 消除，`mut` 为唯一可变关键字 | 局部 mutation 不 box 不追踪（非 side effect）；闭包捕获/mut 参数自动 box + `mut<T>` effect |
| `++` 拼接运算符 | 不实现，使用字符串插值 | "一种事一种写法"原则 |
| Lambda 双向类型传播 | receiver 统一提前 + lambda 接受 expected param types | 支持 `==` 在嵌套 closure 中正确推断 |
| fn 类型 effect 标注 | `fn(T) -> U with {io}` 语法，无标注时 open row | 支持 HOF callback 的 effect 多态 |
| impl bounds | `impl<T: Eq> List { ... }` 语法 | 前置条件：Eq trait 约束迁移到 impl 方法 |
| mod capability | `mod name requires {effects} { ... }` 语法 | 模块级 effect 限制，E0405 错误码 |
| 多行字符串 | `"..."` 允许跨行，空白原样保留 | 减少字符串拼接需求 |
| Raw string | `r"..."` 和 `r#"..."#`，无转义无插值 | 正则表达式/codegen 场景减少转义噪音 |
| Effect 派发 hybrid（2026-06-03）| fail/abort → handler stack + setjmp（ambient）；tail-resumptive → evidence 值线程化（lexical）。两类绑定语义不同，同构 JS oracle | evidence 保留优化器可见性 + async 线程迁移安全 |
| 类型系统代价分配 | 复杂度由 LLM 承担（编译器错误循环），收益由用户享受（零 runtime surprise） | LLM 不是人、编译器搏斗十轮也无所谓 |
| Refinement × Ownership × Effects 交互 | 详见 1.6b 交互矩阵 | 三系统正交 + RAII（Drop trait）处理 Drop 值在所有路径的释放 |
| Ownership 模型 | Rust 风格 RAII，无 borrow checker；`impl Drop` = 所有权约束入口；Drop 与 Clone 互斥；所有路径自动 drop | LLM 从 Rust 训练数据天然理解 move/drop/RAII；无 `linear` 关键字——少一个概念 |
| 下标赋值语义 | 支持 `xs[i] = val` + bounds-check（方案 C） | 读写语义一致（越界都 panic）；JS 后端临时方案，LLVM 原生支持；Refinement Types 可消除已证明安全的 bounds-check |
| `mut<T>` 追踪粒度 | 参数级，不递归 field chain | `mut self` 已含"可修改 self 任何部分"语义，field-level 追踪是冗余子集信息 |
| 扩展交互矩阵 | 详见 1.6b 扩展部分 | GADTs×Or-Pattern 禁不兼容约束合并；Refinement×mut 赋值点重新验证；Auto-Boxing×Ownership 透明；delegate 创建完整 trait impl 含关联类型；无 borrow checker（RC+Ownership+mut\<T\>+Drop 覆盖安全性） |
| LLM 友好性三原则 | 详见设计公理后章节 | 借来的语法行为像原主；错误信息对 LLM 友好；高级特性分自动浮现/用户触发两条路径 |
| GADTs 降优先级 | P3，LLVM 之后 | 编译器不需要；无下游依赖；用户侧高级特性 |
| Iterator/Iterable 协议 | 双 trait：`Iterator { type Item; fn next(mut self) -> Item? }` + `Iterable { type Item; type Iter: Iterator; fn iter(self) -> Iter }` | `for..in` 脱糖为 `iter()` + `next()` 循环；Range 保留 C-style for 快速路径（builtin EnumType，无法 impl trait）；Iterator struct 使用 `mut self` 引用语义修改游标 |
| LLVM 后端实现 | uniform boxing（`ptr`）+ Int/Bool tagged（B-080）+ `{fn_ptr,env_ptr}` 闭包 + setjmp/longjmp fail + 单 Module/单 .o + C++ STL runtime。详见 §10.4 | codegen 只写一次（Ring→LLVM-C），bootstrap 用 N-API addon（自举后废弃） |
| Perceus 分层路线 | L0 RC核心(B-012) → L1 引擎(B-098) → L1 用户面(B-068,deferred) → L2 Drop/RAII+Weak(B-002) → L3 reuse(B-079) → L4 unboxing(B-080) | 可独立测试/merge 的序列 |
| 完整 Perceus RC（2026-06-09，G-a 真解）| L0/L1 完整化 = total return-mode drop pass（drop 所有 fresh-owned 临时，地基 B-103）+ 静态 leak verifier（post-RC HIR 线性检查，编译期证明 owned 消费一次 + drop 非 borrow）；0 泄露 = 无环 by-construction（garbage-free 定理）+ 环用 Weak<T>（§7.9）。标记指针(B-080)降级为 peak/perf | 取代 wave 式打地鼠（无完整性不变量 = debug 心态）；数据订正墙主体 74.5% 是非标量临时、标记指针仅消 ~21% 非泄漏驱动；verifier 把 0 泄露从经验观察变可检查不变量 + 当 total pass 重写的编译期 UAF 安全网 |
| Perceus L1 引擎提前（2026-06-04，#134 证伪 L0-only 自举）| 原断言「L0 owned-everywhere 单独解锁全自举、无硬前置」**错误**——对「循环内条件 move」是 double-free（崩溃非泄漏）。借用推断引擎（B-098）提前到 native-working 之前：borrow-default + escape-clone + scope-end-drop，撤销 always-own 读取补丁。仅引擎，用户面（move 语法/lv2/fmt/pub）留 B-068 deferred | branch-balancing 给未消费分支强插 drop → 单值多次 free；三套循环机制不覆盖此缝；逐点 always-own sweep 是站点未知的 whack-a-mole + 每个 move 需深层 Perceus 手术。borrow 不要求每路径消费 → 整类崩溃从根消除 |
| Perceus L0 对象头 | 每堆对象 offset 0 `{rc:u32, typeid:u32}`；per-type drop 函数 + typeid 派发表 | dup/drop 类型无关；用户类型 drop 由 codegen 生成（Koka 风格 per-type drop/scan）|
| Perceus L0 范围 | 不处理 abort 路径 drop（留 L2 drop-aware unwind）/ 循环引用（留 L2 Weak） | longjmp 跳过 drop = 泄漏非 UAF（安全）；自举走成功路径 + 树形数据无环；先解内存墙 |
| Perceus dup/drop IR | HIR 显式 Drop/dup 节点 + 反向 liveness pass（仅 llvm） | RC 行为落 IR 可 dump/测试；翻译 Koka Perceus POPL'21 |
| Perceus L1 实现模型 = clone-all-escape（2026-06-04，§7.11）| 读取 borrow；逃逸点对「有独立 owner 的值」（Ident/字段/元素/容器读取）clone、对 fresh 临时值 move；值层 clone = 新增 `HExpr::Clone{inner}`（codegen eval→ring_dup→返回）；owned 绑定 scope-end-drop 一次、**删 branch-balancing**；所有参数 borrow（callee 不 drop）；不做 last-use→move（留 L3）| `HStmt::Dup{name}` 只能按名 dup，非 Ident 逃逸无名 → 字面 perceus-escape-clone 会 double-free（崩溃）。逃逸 clone 而非 consume → 绑定永不按路径消费 → branch-balancing 不需要 → 整类循环条件 move double-free 从根消除。clone-all dup 次数 < always-own（读取≫逃逸）故内存更优。闭包保守全 owned，borrow 优化留 B-096 |
| Perceus L0 闭包 capture 所有权（2026-06-03） | owned capture（普通闭包，env 死时 drop）vs borrowed capture（catch/handle 为平衡 Drop 捕入，env 死时不 drop）；#130 走 C 增量（普通闭包 env 独立 typeid + drop_env_T，catch/handle 排除），A 波（B-096）完整收口（borrowed 建模 + ring_try drop 闭包 + #4 guard-false + Range/dict drop_T） | env 复用 closure typeid 致 ≥2 captures 泄漏+误递归；#131 借 catch env 整体泄漏安全引入 borrowed capture，裸加 auto-drop 会 double-drop；差分抓 crash 不抓泄漏 → C 增量可验证安全 |
| occurs_in/apply_subst 对 struct/enum fields 一致忽略（2026-06-03） | 维持现状（只处理 type_params，fields/variants 原样保留）= 正确 nominal 语义，非 bug；撤销 B-057（错误立项）；#108 标 wontfix；彻底统一留 #16 nominal 重构 | fields 自始至终是声明模板（apply_subst 原样保留 + 字段实例化走局部 inst_map 不写回 + type identity 只比 name+type_params），无限类型的环只能经 type_params 形成、已被 occurs check 覆盖；补 fields 遍历 → apply_subst 递归类型栈溢出 / occurs_in 误判模板 var |
| LLVM evidence 表示 D1（2026-06-03 B-090）| `{fn_ptr, env}` 闭包 struct，slot = op 在 effect 声明里的顺序；共享 helper `effect_op_slot` 给 gen_handle_expr/gen_effect_op 共用 | 与 JS oracle（`{op: closure}`）语义同构 → parity 结构性；复用现有闭包表示；跨阶段契约进共享层符合约定。否决 effect-as-trait（搅入 supertrait/关联类型包袱）|
| LLVM handler 闭包 RC D2（2026-06-03 B-090）| evidence struct + handler 闭包暂泄漏，drop 收口并入 B-096 A 波 | B-090 价值是 parity（差分可验），泄漏是正交问题且已有归宿；耦合大内存机 double-free 实测会让 P1 卡在 P3 后 |
| B-090 范围分期 D3（2026-06-03）| core（B-090，L）= 单 effect multi-op tail-resumptive + 自然涵盖的 nesting；phase 2（B-097，P2）= custom-abort + default body(#72) + delegate(B-088#4) + nesting/multi-effect edge | 单 op 是玩具（真实 effect 都多 op）；custom-abort 需独立 setjmp 落点、default 需注入默认 evidence、delegate 是派发通后的扩展，均与核心机制不同 |
| JS 后端归档策略 (Z)（2026-06-04，B-100）| 删 JS 前先**证明**两后端 feature 完全一致零 bug（parity 认证门：穷举覆盖矩阵 + 关 B-097/B-096 + 复数轮对抗 review，loop-until-dry），再 golden 快照保存量回归网，然后删 codegen.ring/JS runtime/addon。删除点 = 层 3 之前 | JS 后端是 LLVM codegen 的差分 oracle，简单删会摧毁它；但 oracle 价值 = 抓发散，parity 一旦被证明且 feature 集冻结，oracle 即用尽 → 删除无损。否决「层 3 后删」（async/unwind/refinement 要双实现，成本过高，且 JS 实现层 3 亦可能有 bug、oracle 非真值）|
| A2 Type hash-cons 边界（2026-06-07，B-102 Phase 2）| 只在 `apply_subst` **5 个**复合 arm intern（Fn/Generic/Record/EffectRow/Tuple，**排除 Struct/Enum**），表塞 `UnionFind`（零线程化）；**含未解析 TypeVar 不入表**（`type_intern_key -> Str?`，订正旧述「输出已 resolve」）；key 逐字对齐 `types_equal`（Record/EffectRow 无序排序、**FnType effects 有序**、不复用有损 `type_to_string`）；O(1) 相等彩蛋解耦另立项 | apply_subst 每次重建 spine = 2.51亿洪流；intern 去重达 G-a（A1 never-drop 不去重仍 ~25.9GB）。**Struct/Enum 排除**：nominal-shallow key 不健全——apply_subst 不代换 variants/fields、exhaustive.ring 却结构化读，intern 任选缓存致 stale payload（回归 tuple_option_sugar）；否决代换 variants（爆栈，见 occurs_in/apply_subst 忽略 fields 一条）/deep key（违反 key==types_equal） |
| 泛型 Map key（2026-06-07，B-107，P2）| 加 `Hash` trait + derive，runtime Map key 改 void* 经 Eq/Hash dict 派发（复用 `ring_get_builtin_dict`）| 类型层 `Map<K,V>` 全泛型但 runtime 只兑现 Str key（两后端，LLVM 具体化）= 类型系统说谎；bootstrap 编译器全 `Map<Str,..>` 故未暴露。镜像 Eq/Ord/Clone derive 机制；与 B-080 unboxing 协同 |
| LLVM 增量编译 deferred（2026-06-07，B-105）| 维持单 Module/单 .o；增量（每 .ring→.o）deferred 至 native 成主工具链（B-099 后）+ 编译时间成实测痛点 | 当初为省跨模块符号解析；不阻塞 B-089/099/100。真难点 = 跨模块单态化（泛型实例 emit 何处，Rust/C++ 模板问题），非 link，具体方案真做时再 Discussion |
| dict evidence HIR 一等化（2026-06-12，#151 根治，B-104 D4）| 三案取 (c) HIR 一等 evidence + 吸收 (b) 单例语义：静态 dict = HIR 模块级单例实体（使用点 borrow 引用，两后端同源 lower）、动态 wrapped = HIR 局部 evidence 构造值（owned，D1/D2 正常覆盖）；不动 evidence 参数传递机制 | dispatch 决策已 HIR 可见、唯 dict 构造在 codegen 合成（LLVM per-execution fresh = 对 JS 单例模型的偏离，residual 28~38% 最大泄漏类 + ~1.27 亿对 churn）；否决 (a) per-use drop（churn 不消 + codegen 内配对面大）与纯 (b) codegen 缓存（豁免类永存）；dict 集 = 程序文本静态属性有界小常数，与 R-clean 否 Type intern 不冲突（Type 无界新生）。详见 §7.11 |
| 低层内存原语 = design-probe 前置（2026-06-07，B-106）| RIIR（runtime C++ STL→纯 Ring）立 design-probe 而非实现项：先决「Ring 是否/以何形式提供低层内存原语」| 纯 Ring 重写 vector/map/string 需裸内存操作，与哲学「不做裸指针/manual malloc」冲突；张力不解 RIIR 无从落地。候选：value types / region effect / 受控 unsafe / 维持 C FFI 永久退缩前线 |
| native on-par 统一规划 = Level 1（2026-06-08）| 终点 = native 前端+JS 后端与 node 版对等（三门走 js 路径），**B-099（自产 .o / Node 消除 / JS 归档）= Level 2，本轮 out-of-scope**。剩余工作收编为 P0 诊断 → P1 标记指针（B-080）→ P2 三门（B-089），绕掉 B-104 后续碎波 + B-080 box-at-boundary 拆分（**2026-06-09 订正**：P1 标记指针降级、B-104 升里程碑为 G-a 真解，见上「完整 Perceus RC」行；P2 三门仍归 B-089）| 用户拍板「绕中间 milestone 直达 on-par」；碎波可绕但依赖序+验证关卡（每改一类位置 llvm_diff+ASan）不可绕，否则大改裸奔全崩无从二分 |
| 标量表示 = 标记指针（2026-06-08，B-080 重定义）| Int/Bool 低位 tag，所有位置不进堆；取代 box-at-boundary/inline-A1。Float 暂留 box（2026-06-09 起优先级降级 peak/perf，表示方案本身仍有效）| box-at-boundary 工作树实测证伪：inline 标量字段后 `a1d @402M` INT=63.3M≈W4 基线，字段 box 拆了 INT 没降→残留 INT 在多态边界（List<Int>/Option<Int>/泛型/dict 槽），uniform void* 必须 box，RC 波/inline 都消不掉；精确-RC 四波回收非标量临时后 INT 纹丝不动。标记指针让标量哪都不进堆 = 唯一结构性解，patch treadmill 终结 |
| Mutable aliasing 语义 = move 补完（2026-06-11，B-110）| 复合赋值/存字段/返回 = move（use-after-move 编译错误）；句法禁 `f(xs, mut xs)` 同 lvalue 借用/mut 重叠（无 borrow checker 唯一的洞）；`.clone()` = 独立副本，Perceus 以 dup+COW 实现（move 杜绝别名后不可观测） | 三真值源分裂（实现=引用语义、设计=move、Koka 血统=值语义+COW），且无任何测试锁定。B 胜出：迁移「响」（自举编译器依赖共享的站点变编译错误 = 迁移清单；值语义方案是静默行为变化）；不可变共享 clone = 免费 dup，编译器 HIR/Type 共享图无伤；公理 1（Rust 语法 Rust 行为）+ LLM 对 use-after-move 自修复能力最强；JS oracle 无 RC 表达不了 COW。否决引用语义追认（mut\<T\> 系统性失真、aliasing bug 类对无人回路永久开放）|
| 定位语修订（2026-06-11，设计方向复盘）| 定位改「LLM-first native 语言」，主战场 CLI/服务端/系统编程；「面向大型多端应用 / 干掉 JS/TS」开篇退役（philosophy.md 已改写）；演进判据成文 = 把人类判断逐项移交编译期判定 | 实际演进与开工定位脱节：JS 后端定归档、WasmGC 已排除、系统域决策批（16 数值类型/@repr/[T;N]/Arc）+ Perceus/move 走向使真实对标从 TS 变为 MoonBit/Zero/Mojo；leak verifier（D2）是该判据被工程自发验证的实例 |
| fold 空表 verbatim-init 修复方向（2026-06-11，audit #150）| runtime `ring_list_fold` 空表路径 `ring_dup(init)`（dup-on-share，B-103 ×9 同模式）+ `fold` 退役出 `is_arg_returning_call`（清空后 anf_arg 保守机制整个删除）| 空表 `return init;` 无 dup + caller scope-end drop = double-free（latent，全仓 19 处 fold init 全字面量零实存）；C ABI callee 借用实参约定下唯一不平衡点就是 verbatim 返回，runtime dup 一处即闭环；退役后 W1 实参材料化全覆盖、消掉最后一个分类特例 = 净简化非补丁。否决只补 dup 留分类（留死机制+保守泄漏面）与维持 latent（违背禁 temp fix 基线，D2 verifier 上线必报）|
| COW 不可观测原则（2026-06-11，所有权讨论）| COW 仅为 Perceus 引擎内部优化（`.clone()` = O(1) dup + 写时拷），**语义层绝不暴露**：任何用户可观测的 COW 分叉（写副本却以为写原件）= 设计错误，必须以编译错误或官方原地写法承接。投影绑定写入（`let item = xs[i]; item.f = v` 类）判定为 B-110 必须堵的洞（堵法见 B-110 spec 增补，机制实现前核定）| 内置且语义可见的 COW 在主流语言罕见（多为应用级特性）；静默分叉是行为级 heisenbug，对无人回路致命（agent 从局部代码看不出写丢了）；与 B-110「迁移必须响」同一原则 |
| unsafe 区域图景（2026-06-11，所有权讨论）| 三栏总账（安全区 / unsafe 区 / 明确不做）+ `unsafe` effect 形态 + 两级 discharge（`mod requires {unsafe}` 许可 + `unsafe {}` 块吸收，关键字与 Rust 一致）+ `ring audit unsafe` 审计面；裸指针不参与 RC（extern type 排除规则推广）；撤销旧「不做 unsafe 块 / 裸指针」立场。详见 §7.12，原语集细化归 B-106 | unsafe 是所有权张力的最终出处——栏 C「明确不做」的可信度由栏 B 兜底背书；effect 形态 = 签名可见自动追踪（Rust 隔离 + effect 追踪复合，竞品无）；discharge 点清单 = 全代码库人类审查面，接无人回路公理 |
| unsafe 原语集 + `Ptr<T>` 拍定（2026-06-13，B-106 正文）| typed 单一 `Ptr<T>`（不分 const/mut）普通值、操作才 unsafe；原语 v1 = alloc/dealloc/read/write/offset(inbounds)/cast/copy/addr 互转（互转 safe）；read/write = 按位 move 不动 RC（Perceus 零特殊化，落 B-103 既有分类）；extern fn 声明处签字（调用点 safe，extern type 句柄层与 Ptr 并存）；跨界 per-type 三件套、不做泛型 addr_of；不做 MaybeUninit / 泛型 transmute / v1 volatile-atomic。详见 §7.12，实现 = B-125 | 操作锚点使安全封装成立（持有即感染则容器 struct 定义本身被感染）；泛型 addr_of 把引擎私有值表示变可观测 API、堵死「优化不可观测」；inbounds 换别名分析/向量化（容器热路径）；声明处签字 = 信任点真实位置（签名忠实性在声明不在调用）+ 与现状 std 兼容、Rust 2024 同方向 |
| RIIR 边界 = 全部自己实现（2026-06-13，B-106 收尾）| 容器底层（vector/string/unordered_map）全部纯 Ring + `Ptr<T>` 重写，不保留 C++ STL 依赖。B-125（unsafe 原语）后立项 | 「系统语言标准库借 C++ = 玩具」——自包含 + 容器内部跑 Perceus reuse 是方向性收益，不需等实测数据才决定 |
| 析构顺序 = 对齐 Rust（2026-06-13，B-002 确认）| 同 scope 逆序 / struct 字段声明序 / 容器元素序，两后端一致并入差分回归 | LLM 训练数据 Rust 最强、对齐 = 零学习负担；四通道之③从悬空→已定（§7.9 表已更新）|
| G-b emit 排序确定化（2026-06-13，B-089 G-b）| codegen 所有依赖 Map 迭代的 emit 点改稳定序（名字典序等），使 native/node 产出字节一致。拍 (a) 排序确定化，否决 (b) 语义等价判定 | B-080 验收实锤：排序差异不只美观——native 产 JS 运行崩溃（`__ring_ev_fail` undefined，evidence 传递因序断裂）。(b) 不解决功能性 bug |
| RC 性能立场 = 渐近零开销（2026-06-13）| RC 计数当前有代价 = 优化器成熟度问题非模型税：树状所有权（静态可证唯一）处计数全部可优化消除（borrow 推断/move/reuse/单例化/标记指针/drop specialization），计数只保留在真共享处——该场景 Rust 同付 Rc/Arc。结论 = 相对 Rust 渐近无性能损失，差距可测量（B-104 re-measure 即实践）。详见 §7.9 | Rust 零开销只覆盖树状（borrow checker 静态证唯一 → 无条件 drop）；Perceus 框架下 Rust 模式 = 计数恒为 1 的退化情形，Ring 在可证唯一处向其收敛；真共享处两语言成本同构，Ring 把 Rust 手写 Rc 的标注负担变默认自动（lv0 零标注交换）|
| RC 语义立场 = 与 Rust 四通道可观测等价（2026-06-13）| 语义模仿 Rust + RC 实现的全部可观测分叉收敛四通道：① Drop 副作用——「Drop 禁 Clone」+ B-110 move 使 Drop 类型恒计数 1、与 Rust 逐点一致（该规则实为 COW 不可观测承重墙，非仅「资源不可复制」）② identity——永不提供 ptr_eq/is 类算子（负面承诺，主动与 Rust `Rc::ptr_eq` 分叉）；audit #156 已关闭（contains/index_of 改 Eq trait 派发，2026-06-15）；Map key 残留归 B-107 ③ 析构顺序——已定 = 对齐 Rust（2026-06-13，§7.9 表已更新）④ drop 时机——D-1 as-if 已封。COW 定性 = 「clone = dup」的语义修复机制而非独立优化（rc=1 原地写 = FBIP 入口，RC 独有能力）。详见 §7.9 | 纯内存值无「何时 free」观测窗口 → RC vs 静态 drop 的分叉只能经 Drop 副作用/identity/顺序/时机四通道传播；逐通道封堵即「与 Rust 行为等价」的可枚举证明，与 unsafe discharge 清单同手法（暴露面有界可审计）|
| `List.sort()` Ord bound + runtime 死代码清理（2026-06-15，B-130）| sort 从 `impl<T> List`（extern）移入 `impl<T: Ord> List`（Ring impl = `sort_by` + `<`/`>` 比较），同 contains/index_of 迁移模式。runtime 死代码（`ring_list_sort_default` / `ring_list_contains` / `ring_list_index_of`）一并清理。audit #156 关闭（Eq 侧已修），#159 并入 | 两后端均不正确（JS 用 JS `<` 对 struct 出垃圾、LLVM 按半地址排序）；所有自举 .sort() 调用为 List<Str>/List<Int>（均有 Ord），零迁移破坏 |
| COW 性能可预测性 = 三支柱（2026-06-13）| ① 成本上界定理：COW ≤ eager 深拷贝，预算按语义成本、优化只省不加、无凭空悬崖且确定可复现 ② move 锚点：B-110 后「rc>1 且被写」仅源于显式 clone/Rc——每次分叉数据流上游必有词法锚点，Swift 隐式共享病根结构性不存在 ③ 工具层（待 B-110 写时分叉落地后立项）：`ring audit cow` 静态分叉面枚举 + debug 分叉归因 profiler（复用 RING_BOX_PROFILE 基建）+ fbip 式零分叉断言（Koka 血统）。详见 §7.9 | COW 经典软肋 = 归因漂移/非局部性/路径依赖（Swift 前车之鉴）；Swift 解药 isKnownUniquelyReferenced = 运行时唯一性查询 = identity 观测 API，被四通道之②封死——Ring 必须以「预算上界 + 结构锚点 + 可枚举工具」替代，与 unsafe/audit 同手法 |
| 公理体系 4→6 条 + GC 取舍成文（2026-06-12）| 新增公理 5「编译器必须终止」（可判定性成文，lang-design §11.7 放弃清单挂其下）+ 公理 6「确定性资源语义」（RC/move/Weak/unsafe 区的公理地基补全）；会话原则归推论（标注是文档→3；失真必须响/优化不可观测/审查面可枚举→4）；philosophy.md 为唯一真值源，本文件公理节改速记，CLAUDE.md/README 加速查指针；GC 取舍理由成文于公理 6（语义层费用 GC 省不掉 + 引擎层四收益 + 不可逆性不对称；「GC 停顿」不是理由；B-089 re-measure 为可证伪锚点）| 推导审计发现资源管理体系站在未成文承诺上——四公理字面下 GC 严格更优、推导不闭合；philosophy/design 公理全文双真值源已现漂移隐患 |

### 幽灵功能（已解析但无语义效果）

以下语法 Parser 接受但 Checker/Codegen 不处理，保留作为扩展点：

| 功能 | 解析行为 | 激活时机 |
|------|---------|----------|
| `where` 精化子句 | 消费 tokens 后丢弃 | refinement types |
| Supertrait | AST 字段存在，始终为空 | 后续 trait 增强 |
| Resume 参数名 | AST/HIR 字段存在，无语法触达 | 已无计划（full AE 取消），可清理 |

### 实现偏差备忘

- **Enum 单元变体语法设计**：声明和模式匹配使用 `red()`（带空括号），构造使用 `red`（无括号裸名）。设计原因：声明时与命名字段变体区分；构造时单元变体是值非函数调用；模式匹配时区分于绑定变量
- **比较运算符非结合性**：parser 拒绝 `a == b == c`，有意行为
- **`+=`/`-=` 复合赋值**：支持
- **`Str.replace` 全替换语义**：对应 JS `replaceAll`，替换所有匹配项
- **单元素 `(expr)` 不是 tuple**：与 Rust/Python 一致
- **Parser 换行感知**：`(` 跨行时不触发函数调用（防止 `42\n(...)` 被解析为调用）

### 自举翻译中发现的语言限制

> 自举翻译（TS 13K→Ring 14K 行，31 文件）中发现的限制，现行清单见 CLAUDE.md「已知限制」。已修复项（空列表推断、`List.set`）已删除。

> 未实现特性优先级见 `backlog.md`。

---

## 一句话

纯函数为心脏，effect 为血管，类型为骨骼，推断为皮肤——摸到的是 Python 的手感，内部跑的是 Haskell 的引擎。
