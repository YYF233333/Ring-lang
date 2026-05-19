# Ring-lang 二期技术愿景与路线图

> 本文档基于 2026-05-19 的技术讨论，总结 Ring-lang 在一期（JS 后端原型）之后的长期技术方向。涵盖性能架构、核心类型系统扩展、工程特性、以及独特的优化机会。供后续实现阶段作为指导性参考。

---

## 零、设计一致性原则

Ring 的设计公理第三条："推断为王，标注为仆"。本文档中所有特性的设计**必须**通过以下检验：

**核心检验标准**：一个 Ring 新手，只会写 `let`/`fn`/`struct`/`match`，应该能写出自动获得线性资源安全、值类型优化、capability 隔离、effect 追踪的代码。**不需要知道这些概念存在。**

具体规则：

1. **默认路径零标注**：所有新特性的常见用例不需要额外语法。编译器在内部推断，用户在 IDE 通过幽灵标注感知。
2. **复杂度留给编译器**：推断算法可以任意复杂（SMT、dataflow analysis、whole-program analysis），但用户面对的语法保持不变。
3. **Opt-in 而非 required**：高级用户想精细控制时，标注作为可选工具提供。但不写标注的代码也必须是正确的、优化的。
4. **错误信息用日常语言**：当推断发现违规时，报错用用户能理解的概念（"resource type 用了就没了"），不暴露理论术语（"linear type consumption violation"）。
5. **module 边界是显式标注的唯一强制点**：对外 API（`pub` 函数）的签名由 formatter 按配置等级自动生成，内部代码全推断。

以下各章的示例代码展示的是**编译器内部行为**或**高级 opt-in 语法**，用户日常写代码时不需要接触这些标注。每个特性会在"用户视角"和"编译器视角"两个层面分别说明。

---

## 一、定位分析

### 1.1 Ring 能做什么、不能做什么

Ring 的核心优势是 **effect system + ML 推断 + （当前的）JS 生态**。设计方向是应用层语言——GC、effect system、HM 类型推断指向的是业务逻辑、数据处理、上层应用。

**不适合**的场景（一期阶段）：系统基础设施（如 JS 运行时、操作系统、数据库引擎）。这类项目需要 C FFI、原生编译、手动内存控制——一期的 JS 后端不具备。

**适合**的场景：
- Web 前端/全栈应用（已编译到 JS，effect system 比 React hooks 更优雅）
- 编译器和语言工具（ADT + pattern matching 的传统强项，自举是里程碑）
- LLM 应用层 / AI agent 编排（`--error-format=llm` 已有基础，effect 天然描述 agent 副作用）
- 后端服务中间件（effect handler 抽象请求处理管线）

### 1.2 同族语言参照

| 语言 | 定位 | 大型项目案例 |
|------|------|-------------|
| Elm | ML → JS，纯函数前端 | NoRedInk 整个前端（零运行时异常） |
| ReScript | OCaml → JS | Facebook Messenger |
| PureScript | Haskell → JS | Lumi 电商平台全栈 |
| OCaml | 原生 ML | Jane Street 交易系统、Flow 类型检查器 |
| Koka | Effect 研究语言 | 无生产案例——这是 Ring 的机会 |

Koka 证明了 algebraic effects 的理论可行性但始终没走出学术圈。Ring 如果补上工程缺口，就是**第一个把 algebraic effects 带进生产的语言**。

---

## 二、性能架构

### 2.1 LLVM 后端

切换到 LLVM native 后端是二期的核心基础设施变更。Ring 的 HIR 已有，主要工作：

- **HIR → LLVM IR codegen**
- **Perceus 引用计数**替代 JS 的 GC
- 单态化（monomorphization）消除泛型间接调用

LLVM 后端落地后 Ring 的定位发生质变：从"编译到 JS 的 ML 方言"变成"带 algebraic effects 的原生语言"。

### 2.2 Perceus 引用计数

Perceus 是 Koka 团队提出的替代 tracing GC 的方案：**编译器自动插入的精确引用计数**。

核心机制：
- 每个堆对象有引用计数，编译器在绑定处插 `inc`、作用域结束处插 `dec`
- 计数归零立即释放——**无 GC 暂停，析构时机确定**

关键创新是 **reuse analysis**：编译器发现值被解构后引用计数为 1（唯一引用），新的同形状值可以**原地复用内存**，不释放旧的、不分配新的。这叫 **FBIP（Functional But In-Place）**：纯函数式代码自动编译为原地突变。

经典例子：红黑树插入，手写纯函数式版本需要 copy 节点到根，但 Perceus 在唯一引用时直接原地改写，性能等价于 C 的命令式实现。

| | Tracing GC | Rust 所有权 | Perceus RC |
|--|-----------|------------|------------|
| 程序员负担 | 零 | 高（生命周期标注） | 零 |
| 暂停 | 有 | 无 | 无 |
| 析构确定性 | 不确定 | 确定 | 确定 |
| 循环引用 | 能处理 | 编译期阻止 | 需额外处理 |
| 原地优化 | 不可能 | 手动写 `&mut` | 自动 reuse analysis |

**关键论文**：
- "Perceus: Garbage Free Reference Counting with Reuse" (PLDI 2021)
- "FBIP: Functional But In Place" (2023)

### 2.3 与 C++ 的性能对比预期（AOT only）

| 场景 | vs C++ | 原因 |
|------|--------|------|
| 紧凑数值循环 / SIMD | 0.3-0.5x | 无 intrinsics，无布局控制 |
| 数据结构操作（FBIP 命中） | 0.8-1.0x | 编译为等价原地突变 |
| 通用应用逻辑 | 0.5-0.7x | refcount 开销 + 堆分配 |
| 高阶函数密集（单态化后） | 0.7-0.9x | 间接调用消除后接近 |
| 并发/多核（纯函数自动并行） | 有可能赢 | 编译器自动并行化 |

不可避免的性能税：
1. **引用计数开销**：每个 `inc`/`dec` 是运行时操作，多线程下为原子操作。缓解：reuse analysis 命中时消除、borrowing inference 省掉不必要的计数、单线程路径不需原子操作。
2. **间接调用**：高阶函数 + effect evidence passing 走函数指针。缓解：单态化 + 内联。
3. **内存布局不可控**：对象全 heap + refcount header，cache 不友好。缓解：value types（见第三章）。

### 2.4 JIT 分层编译

在 AOT 基础上叠加 JIT 可以进一步突破性能天花板。JIT 掌握 AOT 不知道的运行时信息：

- 哪个分支是热路径（直接按热路径编译，冷路径走 deopt）
- 虚调用是否实际单态（只有一个实现 → 内联）
- 数据的实际分布

**Ring + JIT 的独特优化机会**（别的语言做不到）：

1. **Effect handler 动态内联**：JIT 观察到某 handler 始终不变 → 直接内联。C# 的 JIT 能去虚化类方法，Ring 的 JIT 能去虚化 effect handler——这是独有的。
2. **投机性纯度优化**：签名有 `io` 但运行时从未触发 → JIT 按纯函数优化，触发时 deopt。
3. **Perceus refcount 投机消除**：JIT 观察到某对象 refcount 始终为 1 → 跳过检查，直接原地复用。FBIP 命中率大幅提升。
4. **热路径跨函数 handler fusion**：突破 AOT 编译单元边界的 fusion。
5. **Effect row 运行时特化**：只为实际出现的 effect 组合生成特化代码——既不膨胀又是特化的。

建议的分层架构：

```
Tier 0: LLVM AOT（基线，冷启动快）
Tier 1: Cranelift JIT（热路径快速重编译，编译速度 > LLVM 10x）
Tier 2: LLVM ORC JIT（超热路径极致优化）
```

**JIT 后性能预期**：

| 场景 | AOT only | AOT + JIT | vs C++ |
|------|----------|-----------|--------|
| 数据结构（FBIP） | 0.8-1.0x | ~1.0x | 持平 |
| 通用应用逻辑 | 0.5-0.7x | 0.7-0.9x | 接近 |
| Effect 密集代码 | 0.4-0.6x | 0.8-1.0x | 持平 |
| 热循环 + PGO | 0.6x | 0.9-1.1x | 可能赢 |
| 冷启动 | 快 | 慢（需 warm-up） | 输 |

---

## 三、关键性能特性

以下特性专门用于弥合与 C++ 的性能差距，每个都有独立的优化贡献。

### 3.1 Value Types（值类型）

**这是影响最大的单一特性。** 当前 Ring 所有 struct/enum 都是堆上引用类型 + refcount header。一个 `Point { x: Int, y: Int }` 本应是栈上 16 字节，实际是堆上 32+ 字节 + 指针间接访问。

```
栈上 Point（C++）               堆上 Point（Ring 现状）
┌──────────┐                    ┌──────┐     ┌──────────────┐
│ x: 8byte │ ← cache 命中       │ ptr ─┼────→│ rc: 8byte    │
│ y: 8byte │                    └──────┘     │ x: 8byte     │
└──────────┘                                 │ y: 8byte     │
16 bytes, 0 indirection                      └──────────────┘
                                             32+ bytes, 1 indirection
```

数组更严重：`List<Point>` 是指针数组，每个元素指向堆上不同位置 → cache 局部性全毁。

**用户视角**：语法完全不变，编译器自动决定布局。

```ring
// 用户写的（和现在一模一样）
struct Point { x: Int, y: Int }

// 编译器自动判断：
//   - 所有字段是基本类型或已确认的 value type ✓
//   - 总大小 <= 阈值（如 64 bytes）✓
//   - 无自引用、无需共享 ✓
//   → 自动栈分配，无 refcount
```

**编译器视角**：推断规则：
- 小的、字段全是值类型的 struct → 自动 value（栈分配、赋值拷贝、内联进父结构）
- 大的、含引用字段的、递归的 → 自动 reference（堆分配、Perceus RC）
- 高级用户可 opt-in 覆盖：`#[heap] struct BigPoint { ... }` 强制引用语义

**解决的连锁问题**：

| 问题 | value types 前 | value types 后 |
|------|---------------|---------------|
| 小结构体分配 | 堆 + refcount | 栈，零开销 |
| 数组内存布局 | 指针数组（离散） | 连续内存（cache 友好） |
| SIMD 自动向量化 | 不可能（间接访问） | LLVM 可自动做 |
| 函数传参 | 传指针 + inc | 传值（寄存器内） |
| 闭包捕获 | 堆分配环境对象 | 小闭包内联到栈上 |

**加上 value types，数值密集型场景从 0.3x 跳到 0.9x+。**

### 3.2 Region Inference（区域推断）

编译器自动识别：一批对象的生命周期绑定在同一个作用域 → 分配到 arena，作用域结束一次性释放。不需要逐个 refcount。

**用户视角**：完全透明，零标注。用户写正常代码，编译器在背后自动分析生命周期、分配到合适的 region。

```ring
// 用户写的
fn process(data: List<Point>) -> Result {
    let temp = data.map(fn(p) { transform(p) })  // temp 只在本函数内使用
    summarize(temp)
}

// 编译器内部推断：
//   temp 的生命周期 ⊆ process 的作用域
//   → 分配到栈上 region，函数返回时一次性释放
//   → 无需逐个 dec
```

**编译器视角**：Effect system 天然适合表达 region。MLKit（ML 语言的 region inference 实现）证明这条路可行。Ring 的 effect system 比 MLKit 更强。

**三层内存管理配合**：Value types 处理小对象 → Region inference 处理大批量临时对象 → Perceus 只处理真正长生命周期的共享对象。refcount 的实际开销趋近于零。

### 3.3 Ownership/Borrowing Inference（所有权推断）

不是 Rust 那种需要程序员标注的 borrow checker，而是编译器自动推断的所有权信息：

- Effect row "无 mut" → 整条调用链无突变 → 告诉 LLVM `noalias`
- Perceus 的 borrowing inference：推断"这个值只是被借用，不需要 inc" → 省掉大量计数操作

Ring 的 effect system 在别名分析上比 Rust 有一个优势：**effect row 是全调用链的信息**。Rust 的 `&mut` 只保证当前作用域没别名，Ring 的"无 mut effect"保证整条调用链都没有突变。

---

## 四、核心类型系统扩展

以下是类型系统层面的基础能力扩展，不是工程特性，而是扩展 Ring 的表达力上限。

### 4.1 Linear / Affine Types（线性类型）

一个值**必须被使用恰好一次**（linear）或至多一次（affine）。

**用户视角**：不需要写 `linear` 关键字。编译器自动推断值的线性度，违规时用日常语言报错。

```ring
// 用户写的（零标注）
fn process(file: File) -> Str / io {
    file.read_all()
}

// 编译器内部推断：file 只被使用一次 → linear
// → Perceus 保证原地复用，零 refcount 开销

// 如果用户写了有问题的代码：
fn bad(file: File) -> Str / io {
    let a = file.read_all()
    let b = file.read_all()  // ← 编译错误（见下方错误信息）
    a ++ b
}
```

**错误信息使用日常概念，不暴露理论术语**：
```
Error E0301: `file` is a resource type and cannot be used after
             `read_all()` consumes it
  --> main.ring:3:13
  |
2 |     let a = file.read_all()
  |             ^^^^ consumed here
3 |     let b = file.read_all()
  |             ^^^^ error: already consumed
  |
  hint: resource types are single-use — consider cloning if you
        need multiple reads
```

**编译器视角**：

```
普通类型：refcount 可能是 1 也可能是 N → 运行时检查
推断为 linear 的类型：refcount 保证是 1 → 编译期确定 → 直接原地复用，零开销
```

Linear type 把 Perceus reuse analysis 从 best-case 变成 guaranteed-case。高级用户可通过 opt-in 标注 `#[linear]` 强制线性语义。

**解锁的能力**：
- Session types（类型安全的通信协议）
- Safe in-place mutation（不需要 `mut` effect 也能安全突变 linear 值）
- 资源安全（推断为 linear 的 File 不可能忘记关闭）
- 与 multi-shot continuations 的交互：linear 值不允许出现在 multi-shot continuation 中（会被用多次），编译器静态拒绝

### 4.2 Multi-shot Delimited Continuations（多次恢复续延）

当前 Ring 的 effect handler 只支持 tail-resumptive（resume 一次且在尾部）。Multi-shot 允许一个 continuation 被 resume 多次：

```ring
effect choice {
    choose() -> Bool
}

fn search() -> Int / choice {
    if choose() {
        if choose() { 1 } else { 2 }
    } else {
        if choose() { 3 } else { 4 }
    }
}

handle search() with {
    choose() => {
        let a = resume(true)   // 走 true 分支
        let b = resume(false)  // 同一个 continuation，再走 false 分支
        a ++ b
    }
}
// 结果: [1, 2, 3, 4]
```

**没有 multi-shot 无法表达的计算**：
- 非确定性计算（回溯搜索、SAT solver、逻辑编程）
- 概率编程（从分布中采样，穷举所有可能性）
- 事务性内存（try 一条路径，失败了 rollback 走另一条）
- 真正的协程（不只是 generator）

Tail-resumptive 覆盖 ~70% 用例，multi-shot 补上剩余 30%——恰好是 effect system 最有说服力的部分。

**工程挑战**：需要拷贝栈帧（每次 resume 要独立栈）。与 Perceus 有交互：continuation 里捕获的值在 clone 时需要 inc refcount。Linear types 在此帮忙：linear 值编译期禁止进入 multi-shot continuation。

### 4.3 Higher-Kinded Types（高阶类型）

当前泛型的 `T` 是一个类型。HKT 允许把 `List`、`Option` 本身（类型构造器）作为参数传递。

**对 Ring 是核心需求**——effect handler 本身就是高阶的。通用的 handler 组合子（重试、超时、日志装饰）需要对任意 effect 抽象，没有 HKT 写不出来。

**用户视角**：HKT 的复杂度留在 trait 定义层（库作者），使用层完全透明。

```ring
// 库作者写的（需要理解 HKT）
trait Functor<F> {
    fn map<A, B>(fa: F<A>, f: fn(A) -> B) -> F<B>
}

// 终端用户写的（零 HKT 知识）
let doubled = double_all([1, 2, 3])
// 编译器推断：[1,2,3] 是 List<Int> → F = List → 自动选择 Functor<List>.map
// 用户不需要写 double_all<List>([1, 2, 3])
```

**标准库策略**：不推 Haskell 风格的 Functor/Monad/Applicative typeclass 层级。标准库用具体类型方法（`List.map`、`Option.map`），HKT 留给高级库作者做通用抽象。简单用法不需要懂什么是 Functor。

### 4.4 First-class Polymorphism（一等多态）

HM 推断的限制：多态函数不能作为参数传递。

```ring
fn id<T>(x: T) -> T { x }

// HM 做不到：
fn apply_to_both(f: forall T. fn(T) -> T, x: Int, y: Str) -> (Int, Str) {
    (f(x), f(y))   // f 需同时是 fn(Int)->Int 和 fn(Str)->Str
}
```

GHC 的 Quick Look 算法（2020 年论文）已工业验证可行。Effect handler 的类型经常是高阶多态的——某些 handler 接收多态的 resume 函数，没有 first-class polymorphism 类型写不出来。

### 4.5 四个核心特性的关系

```
                    Linear Types
                   /            \
                  /              \
    Perceus 保证优化          Session Types / Resource Safety
                              
    Multi-shot Continuations
           |
    完整 algebraic effects（非确定性 / 概率 / 事务）
           
    Higher-Kinded Types
           |
    通用 effect 组合子 / 容器抽象（Functor / Monad）
           |
    First-class Polymorphism
           |
    高阶 handler 类型可表达
```

四个特性形成闭环：linear types 管值的使用方式，multi-shot 管控制流的分叉方式，HKT 管类型的抽象方式，first-class polymorphism 让前三个自由组合。**缺任何一个，effect system 的表达力都不完整。**

---

## 五、工程特性

以下是面向实际生产力的特性，建立在核心类型系统之上。

### 5.1 Derive / 自动实例派生

**用户视角**：所有 struct/enum 自动获得可派生的 trait 实现。不需要写任何 `deriving` 标注。

```ring
// 用户写的
struct Point { x: Int, y: Int }

// 自动获得 Eq, Ord, Hash, Debug, Clone（因为所有字段都支持）
// 不需要写 deriving (Eq, Debug, ...)
```

**只有不想要时才 opt-out**：

```ring
struct Secret { key: Str } #[no_derive(Debug)]  // 不想被 debug 打印（安全考虑）
```

不需要宏系统——编译器内置对 ADT 结构的递归派生即可。**日常开发的生产力必需品。**

### 5.2 Capability-based Security（编译期权限控制）

将 `io` effect 拆分为细粒度 capability：`io.file`、`io.net`、`io.env` 等。

**用户视角**：函数内部零标注，capability 全推断。只在模块边界（`pub` 函数）由 formatter 按配置等级自动生成签名。

```ring
// 用户日常写的（零标注）
fn complex_task() -> Result {
    let config = read_file("config.json")  // 编译器推断出 io.file
    let resp = http_get(url)               // 编译器推断出 io.net
    log("done")                            // 编译器推断出 io.log
    process(config, resp)
}

// IDE 幽灵标注显示推断出的 capability（灰色文字，不影响代码）
// 模块边界的 pub 函数：formatter 自动生成
pub fn complex_task() -> Result / io.file, io.net, io.log
```

**安全保证**：如果一个模块声明只用 `io.file`，其内部代码试图做网络请求 → 编译错误。安全审查只需看模块签名。

```ring
// 模块声明
mod config_reader / io.file {
    // 这个模块里的所有代码只允许 io.file
    fn load() -> Config {
        http_get(url)  // ← 编译错误：io.net 不在模块允许的 capability 中
    }
}
```

Deno 在运行时做权限控制（`--allow-net`），Ring 可以在**编译期**做——更强的保证，零运行时开销。**这是 Ring effect system 的独特杀手级应用。**

### 5.3 Generators / Yield Effect（流式处理）

Algebraic effects 天然支持 yield，不需要新语法：

```ring
effect yield<T> {
    yield(value: T) -> Unit
}

fn fibonacci() -> Unit / yield<Int> {
    var a = 0
    var b = 1
    while true {
        yield(a)
        let temp = a + b
        a = b
        b = temp
    }
}

handle fibonacci() with {
    yield(n) => {
        if n > 1000 { stop() }
        print(n)
        resume(())
    }
}
```

这可能是向外界展示 "effect 到底有什么用" 最直观的例子。

### 5.4 Resource Management via Effects

Effect handler 保证资源获取和释放配对：

```ring
fn with_file(path: Str, f: fn(File) -> T / fail<IOError>) -> T / io.file {
    handle {
        let file = acquire()
        let result = f(file)
        release(file)
        result
    } with {
        acquire() => File.open(path)
        release(f) => f.close()  // handler 保证 release 一定执行
    }
}
```

比 `try-finally` 好在：编译器强制通过 handler 获取资源。比 Rust RAII 好在：不需要生命周期标注。

### 5.5 编译期求值

没有 effect 的表达式都可以在编译期求值——effect 推断自动判断：

```ring
let table = generate_lookup_table(256)  // 无 effect → 编译期直接算出结果
```

不需要像 Rust 那样标 `const fn`，effect system 天然提供判断标准。

### 5.6 Type-safe Serialization

结合 derive + effect 的类型安全序列化：

```ring
struct User { name: Str, age: Int } deriving (Serialize, Deserialize)

fn parse_user(raw: Str) -> User / fail<ParseError> {
    deserialize(raw)  // 编译期知道目标类型，生成专用 parser
}
```

---

## 六、Effect-aware 优化机会

Ring 的 effect system 提供了一个**别的语言没有的优化维度**。Rust 用所有权在空间维度提供优化信息，Ring 可以用 effect 在行为维度提供优化信息——两套正交策略。

### 6.1 Effect-guided Reuse（效果指导的复用分析）

```ring
fn transform(data: List<Int>) -> List<Int>  // 无 mut effect
```

无 `mut` effect → 无 `Cell.set` → 无共享可变状态 → 编译器更激进地推断唯一性，不用等运行时 refcount 检查。某些场景下比 Rust 更强——Rust 的 `&` 只保证当前作用域没有 `&mut`，Ring 的 effect row 保证**整条调用链**的纯度。

### 6.2 Effect 消除（Zero-cost Effects）

当 effect handler 编译期可静态解析（handler 已知、effect 单态化），evidence passing 完全内联消除。可按 effect row 特化：同一泛型函数的纯版本和有 `io` 版本生成不同机器码。

### 6.3 Handler Fusion

类似 Haskell 的 stream fusion：

```ring
data |> map(f) |> filter(g) |> fold(h, 0)
```

三个 effect handler 融合成一趟遍历，消除中间数据结构。Effect 的组合语义明确，比 Haskell 更自然。

### 6.4 Purity-driven 自动并行化

```ring
fn process(a: Data, b: Data) -> (Result, Result) {
    (compute(a), compute(b))  // compute 无 effect → 编译器可安全并行
}
```

Rust 需要 `Send + Sync` trait bound，Ring 的 effect row 天然提供——没有 `io`/`mut` 的函数一定纯，可安全并行。**编译器自动做，不是库层面的 `par_iter()`。**

### 6.5 Perceus + Effect 联合优化

Effect handler 的 resume 创建 continuation frame。Perceus 对这些 frame 做 reuse analysis——反复 catch-resume 的 handler，continuation frame 可原地复用。

---

## 七、自增强飞轮：LLM-first 开发策略

### 7.1 核心洞察

Ring 不只是一个编程语言项目——**它是一个自加速的 AI 开发平台。**

大多数项目用 AI 辅助开发，但项目本身不让 AI 变得更可靠。Ring 是罕见的例外：项目的产出物（更强的类型安全）直接提升了项目的开发工具（LLM agent 的自主可靠性）。这形成一个自增强循环：

```
Ring 的类型安全提升 → LLM 自主工作更可靠 → 更多并行 session → Ring 开发更快
→ 更强的类型安全 → LLM 更可靠 → ...
```

投资在安全特性上的时间有**双重回报**：
1. 语言本身更好（对外价值）
2. 开发效率指数提升（对内价值）

而且这个优势不可复制——其他语言项目用 Rust/TS 写编译器，LLM 写的代码需要人 review。Ring 自举后，LLM 写的 Ring 代码被 Ring 自身的类型系统验证，形成闭环。

### 7.2 效率台阶

| 台阶 | 前提 | 人的角色 | 有效并行度 |
|------|------|----------|-----------|
| **0（现状）** | TS 编译器，LLM 写代码 | 逐行 review 每个 session | ~3x |
| **1（自举）** | Ring 编译器编译自己 | 看测试结果，不读代码 | ~10-20x |
| **2（安全类型）** | Linear types + Refinement types | Review 设计决策，不 review 代码 | ~100x |
| **3（形式化）** | Dependent types + spec 验证 | 手机上看进度汇报 | 无上限 |

**台阶 0 → 1**（自举）：effect system 捕获副作用 bug，exhaustive match 捕获遗漏分支。LLM 提交的代码只要编译通过 + 测试通过 = 大概率正确。

**台阶 1 → 2**（安全类型）：资源泄露？编译器拒绝。越权访问？编译器拒绝。除零、越界？编译器拒绝。编译通过 ≈ 95% 正确率。人从 code reviewer 变成 product manager。

**台阶 2 → 3**（形式化验证）：LLM 生成代码 + spec，编译器验证 spec 满足。编译通过 = 证明正确。人完全退出开发循环，只做战略决策。

### 7.3 对路线图的影响

安全特性的优先级必须大幅提前——它们不只是 feature，是**开发效率的乘数**。越早拿到乘数，后面所有工作的成本越低。

---

## 八、二期路线图

路线图重新按**飞轮加速优先**排序：先拿到自增强循环的关键拐点，再用放大后的开发能力推进其余特性。

### Phase A：自举准备（JS 后端补全）

补全自举所需的最小特性集。

| 特性 | 优先级 | 说明 |
|------|--------|------|
| Module system | P0 | `mod`/`import`/`export`，多文件编译——自举的硬前提 |
| Auto-derive | P0 | 所有 struct/enum 自动派生可推导 trait，opt-out 覆盖 |
| **核心 trait（Eq/Ord/Hash）+ 运算符解糖** | P0 | `==`/`<` 等运算符解糖到 trait 方法调用，auto-derive 的首批目标，解决 C7 审计问题（JS `===` 引用比较） |
| Map\<K,V\> + Set\<T\> | P0 | 编译器内部大量使用的数据结构 |
| Tuple types | P0 | 多返回值、解构 |
| `--error-format=llm` 增强 | P0 | 结构化错误 + 修复建议，加速 LLM 自动修复循环 |

**里程碑**：Ring 语言特性足以表达自身编译器。

### Phase B：自举 + 安全基础（飞轮启动） ← 关键转折点

自举落地 + 第一批安全特性，从台阶 0 跳到台阶 1-2。

| 特性 | 优先级 | 说明 |
|------|--------|------|
| **自举（JS 后端）** | P0 | 11k 行 TS → Ring，LLM 辅助翻译，Ring 安全保证覆盖自身开发 |
| **Refinement types（基础版）** | P0 | 数组越界、除零、非空——消灭 LLM 最常犯的 bug 类别 |
| **Linear types（推断版）** | P0 | 资源安全——编译器自动推断线性度，零标注 |
| **闭包线性推断** | P0 | 闭包捕获 linear 资源时自动标记为一次性闭包，无需 `FnOnce`——与 linear types 同期设计 |
| **原生字符串表示设计** | P1 | 确定 UTF-8 内部编码 + 码点级 API 语义，为 Phase C 原生后端铺路，保证双后端行为一致 |
| **内建测试框架** | P1 | `test "name" { }` 语法 + 断言原语 + test runner 集成，自举的质量保证基础设施 |
| **标准库基础（JS 后端）** | P1 | std/io、std/fs、std/process 等自举所需模块，薄封装 Node.js API |
| Yield effect (generator) | P1 | 流式处理 + effect system 展示窗口 |
| Capability-based io 拆分 | P1 | 全推断，仅 `pub` 边界由 formatter 生成签名 |
| 增量编译设计 | P2 | 模块级 content-hash 缓存策略，自举后项目规模增长的必备基础设施 |

**里程碑**：Ring 编译器自举成功。LLM 代码编译通过 ≈ 95% 正确率，有效并行 session 从 3 个提升到 ~100 个。**从此以 "百人团队" 速度推进。**

### Phase C：Native 后端（性能跃迁）

用飞轮放大后的开发能力完成重型基础设施。

| 特性 | 优先级 | 说明 |
|------|--------|------|
| LLVM IR codegen | P0 | HIR → LLVM IR，含 DWARF/PDB 调试信息生成 |
| **unsafe effect + RawPtr\<T\>** | **P0** | **受控的底层访问能力，解锁运行时自举（详见下方设计）** |
| **panic + never type** | **P0** | **不可恢复错误（OOM、栈溢出、断言失败）→ 立即终止 + 栈回溯，`fn panic(msg: Str) -> !`** |
| 原生字符串实现 | P0 | 落地 Phase B 设计的 UTF-8 表示，SSO 优化，保证与 JS 后端 API 语义一致 |
| Perceus RC 实现 | P0 | 用 Ring unsafe 自举实现，替代 JS GC——unsafe 的第一个重量级用户 |
| Monomorphization | P0 | 泛型特化，消除间接调用 |
| Value types | P0 | 编译器按大小/结构自动决定布局，零标注 |
| C FFI（safe 设计） | P1 | safe FFI + 自动 marshalling，调用端无需 unsafe |
| **结构化并发 + async effect** | P1 | **design.md 第八章落地：scope/spawn/await + channel + OS 线程，async effect handler 选择执行策略** |
| **原生标准库** | P1 | **std/io、std/fs、std/net、std/process 的原生实现（libc/系统调用绑定），替代 JS 后端封装** |
| **SIMD intrinsics** | P1 | **类型安全的 SSE/AVX/NEON 内建函数，LLVM auto-vectorization 之外的显式控制，游戏/科学计算/编解码性能命脉** |
| **内存布局控制（repr/align）** | P1 | **struct 字段对齐、排列顺序、padding 的显式注解，ECS 架构、GPU buffer、网络协议序列化的硬前提** |
| Borrowing inference | P1 | 自动推断所有权，省 refcount |
| Region inference | P1 | Arena 分配，批量临时对象零开销 |
| Effect-guided reuse | P2 | 利用 effect row 增强 Perceus |
| Const evaluation | P2 | 无 effect 表达式编译期求值 |

#### unsafe effect 设计要点

**核心原则：unsafe 是 effect，不是语法标记。** 与 Rust 的 `unsafe {}` 块（编译器不追踪传播）不同，Ring 的 unsafe 融入 effect system，传播性在类型签名中可见。

**三层架构：**

1. **原语层**（编译器内建）：`RawPtr<T>` 为 linear type（不可复制、不可丢弃），配套 5 个内建操作（`alloc`/`dealloc`/`ptr_read`/`ptr_write`/`ptr_offset`），均标记 `with {unsafe}`
2. **消化层**：`unsafe {}` 块作为 unsafe effect 的 handler，在当前作用域消化 unsafe 使其不传播到函数签名——语义等价于"我（作者）为这段代码的安全性负责"
3. **封装层**：标准库用 unsafe 实现内部（如 `Vec.push`），对外暴露安全 API，用户代码从头到尾不接触 unsafe

**比 Rust 更安全的关键：** unsafe 块内 linear type 约束仍然生效——编译器在 unsafe 代码中仍能捕获 double-free 和 use-after-free，这两类错误在 Rust unsafe 中是未定义行为。

**依赖关系：** LLVM 后端（unsafe 只对原生编译有意义）+ Phase B 的 linear types（裸指针必须线性）→ unsafe effect → Perceus RC 自举。

**里程碑**：benchmark 达到 0.5-0.7x C++ 性能。Perceus RC 成为首个用 Ring unsafe 自举的核心组件。

### Phase D：类型系统完善 + 表达力扩展

补全类型系统的理论上限。此阶段可多线并行推进。

| 特性 | 优先级 | 说明 |
|------|--------|------|
| Multi-shot continuations | P0 | 完整 algebraic effects |
| Higher-Kinded Types | P1 | 通用 effect 组合子 |
| First-class polymorphism | P1 | Quick Look 算法，高阶 handler 类型 |
| Dependent types lite | P1 | 索引类型 `Vec<T, N>`，向台阶 3（形式化）推进 |
| **Trait 一致性 / 孤儿规则** | P1 | **包管理器的前置条件——定义跨包 impl 冲突解决规则，防止生态碎片化** |
| Type-safe serialization | P2 | JSON/binary，依赖 derive |
| Formatter | P2 | 代码格式化工具 |
| **文档生成** | P2 | **doc comment 语法（`///`）+ API 文档生成工具，包生态的可发现性基础设施** |
| 包管理器 | P2 | 依赖管理和发布（依赖 Trait 一致性规则） |

**里程碑**：Ring 的 effect system 可表达非确定性、概率编程、事务等高阶模式。Dependent types 推进形式化验证能力。包生态具备完整工具链（包管理 + 文档 + 格式化）。

### Phase E：JIT + 极致优化

在 AOT 基础上叠加 JIT 分层编译。

| 特性 | 优先级 | 说明 |
|------|--------|------|
| Cranelift JIT (Tier 1) | P0 | 热路径快速重编译 |
| LLVM ORC JIT (Tier 2) | P1 | 超热路径极致优化 |
| Dynamic PGO | P1 | 运行时 profile 指导优化 |
| Effect handler 动态内联 | P1 | JIT 独有优化 |
| Perceus 投机消除 | P2 | refcount 投机跳过 |
| 自动并行化 | P2 | 纯函数自动并行 |
| Handler fusion | P2 | 跨函数 effect 融合 |

**里程碑**：热路径性能达到 0.9-1.0x C++ 甚至超过（PGO + effect 优化），effect 密集代码零开销。

### 路线图总览

```
Phase A: 自举准备         ──→  Phase B: 自举 + 安全基础  ← 飞轮启动
  Module system                  自举（JS 后端）
  Auto-derive                    Refinement types
  Eq/Ord/Hash + 运算符解糖       Linear types + 闭包线性推断
  Map/Set, Tuple                 字符串表示设计（UTF-8）
  LLM error format               测试框架 + 标准库（JS）
                                 Yield, Capability
        │                              │
        │    ┌─────────────────────────┘
        │    │  从此 ~100x 并行开发能力
        │    ▼
        │  Phase C: Native 后端    Phase D: 类型系统     (并行推进)
        │    LLVM codegen (+ 调试信息)   Multi-shot
        │    unsafe effect ← 依赖 B 的 linear types
        │    panic + never type      HKT
        │    原生 UTF-8 字符串       First-class poly
        │    Perceus (Ring 自举)     Dependent types
        │    Monomorphization        Trait 一致性规则
        │    Value types             文档生成
        │    Safe C FFI              包管理器
        │    结构化并发 + async         │
        │    SIMD / repr+align          │
        │    原生标准库                  │
        │         │                     │
        │         └──────────┬──────────┘
        │                    ▼
        │              Phase E: JIT
        │                Cranelift / LLVM ORC
        │                Dynamic PGO
        │                Effect-aware JIT 优化
        ▼
  最终形态：编译通过 = 证明正确，人退出开发循环
```

---

## 九、长期愿景

补齐所有特性后，Ring 的独特定位：

**"第一个将 linear types + 完整 algebraic effects + HKT 统一在一个工业级语言里的系统——同时也是第一个为 LLM 自主开发而设计的语言。"**

与现有语言的差异化：

| 维度 | Rust | Go | OCaml | Koka | Ring（完整形态） |
|------|------|-----|-------|------|-----------------|
| 内存安全 | 借用检查（手动） | GC | GC | Perceus | Perceus + linear |
| 副作用追踪 | 无 | 无 | 无 | effect system | effect system + capability |
| 底层访问 | unsafe 块（编译器不追踪） | unsafe 包（约定制） | Obj.magic | 无 | **unsafe effect（编译器追踪传播 + linear 兜底）** |
| 泛型抽象 | 单态化 + trait | interface | functor | limited | HKT + first-class poly |
| 并发安全 | Send/Sync | goroutine | 无 | 无 | effect-driven 自动并行 |
| 性能控制 | 完全手动 | GC bound | GC bound | Perceus | Value types + Perceus + JIT |
| LLM 自主开发 | 部分（强类型） | 弱（接口太宽松） | 部分 | 部分 | **编译通过 ≈ 证明正确** |
| 生产就绪 | 是 | 是 | 部分 | 否 | 目标 |

C++ 得到性能是因为程序员手动提供所有信息。Ring 的目标是**让编译器自动推断出等价的信息**——value types + region inference + effect-guided aliasing + JIT PGO。信息量等价，获取方式不同。理论上限相同，某些场景（自动并行、全程序 effect 分析）可以超过。

### 设计哲学一致性总结

二期所有特性的用户体验承诺：

| 特性 | 用户写的 | 编译器做的 |
|------|----------|-----------|
| Linear types | 正常代码，零标注 | 自动推断线性度，违规时用"resource type"报错 |
| Value types | `struct Point { x: Int, y: Int }` | 自动按大小/结构决定栈分配或堆分配 |
| Capability | 函数内零标注 | 全推断，`pub` 边界由 formatter 自动生成 |
| HKT | `double_all([1,2,3])` | 自动推断 F = List，选择正确 impl |
| Derive | `struct Point { x: Int, y: Int }` | 自动派生 Eq/Ord/Hash/Debug/Clone |
| Region | 正常代码 | 自动分析生命周期，分配到 arena |
| Ownership | 正常代码 | 自动推断别名信息，喂 LLVM noalias |
| Const eval | `let table = gen(256)` | 自动检测无 effect → 编译期求值 |
| 自动并行 | `(compute(a), compute(b))` | 自动检测纯函数 → 并行执行 |

**一句话**：Ring 的复杂度预算花在编译器上，不花在用户身上。用户是人还是 LLM，体验一样——写最简单的代码，获得最强的安全保证。
