# Backlog

> 活的工作看板。做完的条目删除，只在 git commit message 留记录。
> 条目格式：`### B-xxx <标题> [类型] [优先级] [复杂度] [状态]`
> 状态流转：`queued` → `planning` → `doing` → 删除
> 反馈分支：`doing` → `waiting-feedback`（Worker 遇到设计问题）→ Discussion 处理后 → `queued`（重新排队）
> 工作流规范见 `docs/workflow.md`

## 类型系统

### B-001 Refinement Types [feature] [P2] [XL] [queued]
design.md 1.2。类型附带谓词，编译期静态验证 + 运行时检查兜底。

```ring
type Positive = Int where it > 0
type Email = Str where it.matches(r"^[^@]+@[^@]+\.[^@]+$")
fn divide(a: Float, b: Float where b != 0.0) -> Float { a / b }
```

- **当前状态**：Parser 已能解析 `where` 子句（tokens 被消费后丢弃），checker 验证未实现
- **前置依赖**：Phase B 模块系统稳定后启动
- **复杂度**：极大（SSA 约束传播 + 可选 Z3 集成）
- **优先级**：Phase C 首要

### B-002 Linear Types（自动推断）[feature] [P2] [XL] [queued]
design.md 11.2 解法 B。编译器做数据流分析，旧值无后续引用时安全就地修改。

- **前置依赖**：`mut<S>` 稳定
- **复杂度**：大（linearity checker + Perceus RC 的前置条件）
- **优先级**：Phase C 与 refinement 穿插

### B-003 Dependent Types Lite [feature] [P3] [XL] [queued]
design.md 1.3。类型可依赖特定值（`Vec<T, n: Nat>`），不要求完整依赖类型证明。

- **前置依赖**：Refinement types
- **复杂度**：极大（约束求解可能不可判定）
- **优先级**：Phase D（研究向）

### B-004 关联类型（Associated Types）[feature] [P2] [L] [queued]
Trait 中声明关联类型 `type Item`，impl 时指定具体类型。

```ring
trait Collection {
    type Item
    type Iter: Iterator<item = Item>
    fn iter(self) -> Iter
}
```

- **当前状态**：未实现
- **前置依赖**：无硬依赖
- **优先级**：Phase C 或 D

### B-005 Supertrait 继承 [feature] [P2] [M] [queued]
Trait 之间的继承关系（`trait Ord: Eq`）。

- **当前状态**：未实现
- **前置依赖**：无硬依赖
- **优先级**：Phase C

### B-033 GADTs（Generalized Algebraic Data Types）[feature] [P2] [L] [queued]
enum 变体可指定不同的返回类型约束，match 分支内编译器自动获得类型等式约束。

```ring
enum Expr<T> {
    Lit(Int): Expr<Int>,
    Add(Expr<Int>, Expr<Int>): Expr<Int>,
    IsZero(Expr<Int>): Expr<Bool>,
}

fn eval<T>(e: Expr<T>) -> T {
    match e {
        Lit(n) => n,                      // T = Int
        Add(a, b) => eval(a) + eval(b),   // T = Int
        IsZero(x) => eval(x) == 0,        // T = Bool
    }
}
```

- **当前状态**：未实现
- **前置依赖**：无硬依赖
- **复杂度**：大（checker 需要在 match 分支内注入类型等式约束，unification 需要支持局部约束环境）
- **优先级**：Phase C（ML 级类型系统标配）

### B-006 `dyn Trait`（动态分发）[feature] [P3] [L] [queued]
运行时多态，默认静态分发（泛型单态化），`dyn` 是主动选择动态分发的标志。

```ring
fn process_all(items: List<dyn Describable>) { ... }
```

- **当前状态**：未实现
- **前置依赖**：无硬依赖
- **优先级**：Phase C 或 D

## Effect 系统

### B-007 `async` Effect + 结构化并发 [feature] [P2] [XL] [queued]
design.md 2.1 + 第 8 章。async 作为 effect 而非颜色标记，handler 决定执行策略。

```ring
effect async {
    fn spawn<T>(task: fn() -> T) -> Future<T>
    fn await<T>(f: Future<T>) -> T
}

fn fetch_data() {
    scope {
        let a = spawn { fetch_stocks() }
        let b = spawn { fetch_bonds() }
        (await(a), await(b))
    }
}
```

- **前置依赖**：`mut<S>` 参数化完成（effect 系统成熟度）
- **复杂度**：大（结构化并发 + JS async/await 映射；LLVM backend 需 native async runtime）
- **优先级**：Phase C 或 D
- **宣发价值**：直接解决 function coloring 问题——async 是 effect 而非颜色标记，带 async effect 的函数可以在同步 handler 下测试。设计阶段可讲，实现前不可作为已解决的卖点

### B-008 Default Effect Handler（设计已确定 2026-05-22）[feature] [P2] [M] [queued]
design.md 2.2。Op 带 body = 默认 handler，语法与 trait 默认方法一致。解决"每次调用都要写 handle...with"的 boilerplate 问题。

```ring
effect Logger {
    fn log(msg: Str) -> Unit {    // 有 body = 有默认 handler
        print(msg)
    }
}

effect Storage {
    fn read(key: Str) -> Str              // 无 body = 必须 handle
    fn log(msg: Str) -> Unit { print(msg) } // 有 body = 可选 handle
}

fn main() {
    do_work()  // Logger 全部 op 有默认，无需 handle...with
}
```

**已确定的语义：**
1. 签名透明：有默认的 effect 仍出现在推断签名中（`with {Logger}`）
2. 部分默认：显式 handle 覆盖默认，无默认且未 handle → 编译错误
3. 全默认可省略 handle：编译器自动注入默认 evidence

**Effect 约束（中间版）：**
- Default handler body 可用内置 effect（io/fail/mut）和已有 default 的自定义 effect
- 不可用无默认的自定义 effect
- 编译器拓扑排序 default handler 依赖，循环 → 编译错误

- **前置依赖**：无硬依赖
- **复杂度**：中
- **优先级**：Phase C
- **参考**：语法方案模仿 trait 默认方法（Ring 已有先例），中间版避免了 Snowflyt 指出的 handler 链式解析的完整复杂度


### B-034 Effect Aliases [feature] [P2] [S] [queued]
效果组合命名，简化复杂 effect 标注。

```ring
effect alias IO = {io, fail<Str>}
effect alias WebHandler = {io, fail<HttpError>, mut<Session>}

fn handle_request(req: Request) -> Response with {WebHandler} { ... }
```

- **当前状态**：未实现
- **前置依赖**：B-008（Default Effect Handler）完成后更自然
- **复杂度**：小（主要是语法糖 + effect row 展开）
- **优先级**：Phase C

## OOP 模拟

### B-010 `delegate` 关键字 [feature] [P2] [M] [queued]
design.md 5.3。替代继承的复用机制，将 trait 实现委托给内部字段。

```ring
struct Admin {
    base: User,
    permissions: List<Str>,
}

impl Admin {
    delegate base: Describable, Loggable, Serializable
}
```

- **前置依赖**：无硬依赖
- **复杂度**：中
- **优先级**：Phase C

## 迭代与集合

### B-036 Iterator Trait + 自定义迭代器 [feature] [P2] [M] [queued]
定义 `Iterator<T>` trait，让用户自定义类型支持 `for..in`。当前只有 List/Map/Set 内置迭代，无法扩展。

```ring
trait Iterator<T> {
    fn next(mut self) -> T?
}

struct Range { start: Int, end: Int, current: Int }

impl Iterator<Int> for Range {
    fn next(mut self) -> Int? {
        if self.current < self.end {
            let v = self.current
            self.current = self.current + 1
            v
        } else {
            none
        }
    }
}

// for..in 脱糖为 Iterator::next() 循环
for i in Range { start: 0, end: 10, current: 0 } {
    print(i.to_str())
}
```

- **当前状态**：未实现（已知限制：无自定义迭代器）
- **前置依赖**：无硬依赖（但 B-005 Supertrait 完成后可建立 Iterator 层次）
- **复杂度**：中（trait 定义 + `for..in` 脱糖改造 + 标准库集合适配）
- **优先级**：Phase C

## 性能优化

### B-011 LLVM Native Backend [feature] [P3] [XL] [queued]
design.md 14.2。编译到 LLVM IR，桌面/服务端场景。

- **前置依赖**：Linear types（Perceus RC 基础）；迁移正前方需完成 Str Unicode 语义统一（`len`/`char_at`/`slice` 等从 UTF-16 切到 code point 语义，消除 JS-ism）
- **复杂度**：极大
- **优先级**：Phase C（长期视野 [[long-term-vision]]）
- **FFI 边界 effect 设计**（LLVM 阶段必须在设计期解决的问题）：
  1. **Evidence 传递方案**：LLVM 端使用 TLS（Thread-Local Storage）handler stack 存储 evidence，而非函数参数传递。C 函数无需感知 evidence 存在，Ring→C→Ring callback 中 effect 自然穿透（与 JS 端 try/catch 的 ambient 语义对齐）
  2. **Effect-free 的 Ring 函数保证干净 C ABI**（无 evidence 参数），零成本互调
  3. **跨语言资源安全**：Linear types 保证 Ring 侧资源，但 C 分配的资源（`malloc`/`fopen`）不在 RC 图中。effect handler abort 时需要 `defer` 机制清理 FFI 资源
  - **参考**：Koka 不暴露 C FFI 给用户（monadic transformation 编译到 C）；OCaml 5 限制 effect 不能跨 C 帧；Rust `extern "C" fn` 不能是 async
  - **已排除**：full AE 跨 C 帧（B-009 已取消，不需要 delimited continuation）

### B-012 Perceus 引用计数 [feature] [P3] [XL] [queued]
design.md 14.3。精确 RC + 就地复用分析，消除 GC 停顿。

- **前置依赖**：Linear types + LLVM backend
- **复杂度**：极大
- **优先级**：Phase C/D

### B-013 热路径单态化 [feature] [P3] [M] [queued]
design.md 11.3。Row-poly 函数在热循环中特化为具体类型版本。

- **前置依赖**：性能 profiling 基础设施
- **复杂度**：中
- **优先级**：Phase D/E

### B-014 融合（Deforestation）[feature] [P3] [M] [queued]
design.md 11.2 解法 C。消除中间集合，多次遍历合并为一次。

- **前置依赖**：标准库 HOF 方法迁移到 Ring（Phase B S2）
- **复杂度**：中
- **优先级**：Phase D/E

### B-015 闭包合并 [feature] [P3] [M] [queued]
design.md 11.5。管道中多个小闭包合并为单次遍历的合并函数。

- **前置依赖**：融合
- **复杂度**：中
- **优先级**：Phase E

## 工具链

### B-016 LSP 移植 [feature] [P2] [L] [queued]
原 TS 实现未移植到 Ring 自举编译器。需要重新实现。

- **当前状态**：VSCode 插件仅提供语法高亮
- **前置依赖**：无硬依赖（但 formatter 完成后 LSP 可复用其 AST 处理）
- **复杂度**：大
- **优先级**：Phase B 之后，用户需求驱动

### B-017 CI 管线 [feature] [P3] [S] [queued]
测试全靠手动 `npm test`。

- **当前状态**：无 CI
- **前置依赖**：无
- **复杂度**：小
- **优先级**：按需（"仅跨平台时需要"——flywheel memory）

### B-018 Debugger [feature] [P3] [L] [queued]
source-map 支持 + 断点调试。

- **前置依赖**：LSP
- **复杂度**：大
- **优先级**：Phase D/E

## 设计对齐：待实现变更

### B-037 `mut<T>` Marker Effect 接入统一 mut 系统 [design-align] [P2] [M] [queued]
当前 `mut self` / `mut` 参数的检查是纯编译期，不经过 effect system。`mut<T>` effect 基础设施（推断/unification/codegen）在编译器中已存在（原 Cell\<T\> 遗留），但无触发源。

**设计**：将 `mut<T>` 作为 marker effect（与 `io` 同类——纯编译期追踪，零运行时成本），由 `mut self` 方法调用和 `mut` 参数传递触发：

| 操作 | 产生的 effect | 理由 |
|------|--------------|------|
| `let mut` 局部变量赋值 | 无 | 调用方不可观测 |
| `mut self` 方法调用 | `mut<Self>` | 修改调用方持有的对象 |
| `mut` 参数传递 | `mut<T>` | 修改调用方传入的数据 |

**Effect 分类**：

| 类别 | 代表 | 运行时 | 用途 |
|------|------|--------|------|
| Runtime effect | `fail<E>`, 自定义 effect | 有 evidence / handler | 控制流改变 |
| Marker effect | `io`, `mut<T>` | 零成本，纯编译期 | 签名可见性、模块 capability、formatter 标注 |

类比 Rust `Send`/`Sync` trait：标记能力，不产生代码。Ring 的优势是自动推断 + 自动传播。

**涉及修改**：
1. `infer.ring`：`mut self` 方法调用和 `mut` 参数传递时向当前 effect row 注入 `mut<T>`
2. `codegen*.ring`：确认 `mut<T>` effect 不生成 evidence 参数（与 `io` 一致）
3. `tests/cases/`：验证 `mut<T>` 在签名中正确推断和传播

**验收标准**：
- `fn foo(mut list: List<Int>) { list.push(1) }` 推断出 `with {mut<List<Int>>}`
- `let mut x = 0; x = 1` 不产生 effect（纯局部）
- `mod pure requires {}` 内调用 mutating 函数报错
- 全部 E2E 测试通过
- 自举编译器正常编译自身

## 已知 Bug / 技术债

### B-022 表达式位置 IIFE return 截获 [bugfix] [P3] [M] [queued]
`let x = { return y; 0 }` 中的 return 被 IIFE 截获。语句位置已修复。

- **当前状态**：实践中极少遇到
- **优先级**：低

### B-024 深层嵌套泛型 UFCS 调用 [bugfix] [P3] [L] [queued]
`Pair<Pair<Int, Int>, Int>` 的 `.eq()` 等直接方法调用受限。

- **当前状态**：auto-derive 和 operator dispatch 正常，直接方法调用受限
- **优先级**：低

## 架构：多后端策略

Ring 成熟后为双后端结构（JS + LLVM），各有主场：

| 后端 | 主场景 | 特有约束 |
|------|--------|---------|
| **JS** | Web 前端、快速原型、Playground、Node CLI、全栈 | GC 托管，effect 通过 evidence passing + try/catch |
| **LLVM** | 桌面/服务端、系统级性能 | 完整控制栈和内存，Perceus RC，delimited continuation 可行 |

### 已排除的后端

- **WasmGC**：JS 后端的卖点不是性能，Web 端追求 ~2x 性能提升投入产出比不合理。如果未来有真实需求再重新评估。
- **QBE(Ring)**：编译器自包含是终极愿景但优先级极低，不主动规划。

### 核心张力

**1. Effect 实现分歧**

两个后端实现 effect 的机制不同：
- JS：evidence passing → 普通函数参数 + try/catch（当前方案）
- LLVM：evidence passing + delimited continuation（full AE 所需）

同一套 effect 语义在不同后端可能有不同的能力边界——例如 multi-resume 在 JS 后端可能无法高效实现（无法捕获栈段），但在 LLVM 后端可以。**是否允许后端间的 feature gap？** 如果允许，需要编译期按目标后端检查 effect 使用是否合法。

**2. 标准库 runtime 分裂**

当前标准库（`std/*.ring`）的底层实现全是 JS（`extern type List<T>` = JS Array）。LLVM 后端需要自己的 runtime 实现：
- JS runtime：当前的 `runtime.ring` 产出
- LLVM runtime：需要 C/Ring 实现的 List/Map/Set/Str + GC 或 RC

**应对策略**：
- 标准库**接口**（方法签名 + 语义契约）由 `std/*.ring` 定义，是跨后端的 single source of truth
- 每个后端提供自己的 runtime 实现，通过 **同一套 E2E 测试** 验证语义一致性
- 用 Ring 自身实现尽可能多的标准库逻辑（纯 Ring 代码自动适配所有后端），仅将最底层原语（内存分配、IO syscall）作为后端特定的 `extern fn`

**3. FFI 表面积分裂**

两个后端面对不同的外部世界：
- JS：`extern fn` → JS 函数，`extern type` → JS 对象
- LLVM：`extern fn` → C ABI 函数，`extern type` → C struct

使用 FFI 的 Ring 库绑定到特定后端。需要条件编译机制（`#[backend(js)]`）或 FFI 抽象层。

**4. Codegen 架构**

当前 codegen 是单体 JS 代码生成。引入 LLVM 后端需要：
- 共享的 HIR → 后端无关优化 pass（常量折叠、死代码消除、内联）
- 后端特定的 lowering：HIR → JS / HIR → LLVM IR
- **接口设计**：codegen 应抽象为 trait/接口，各后端实现。当前的 `codegen*.ring` 文件需要重构为 JS 后端的具体实现

### 引入时机

1. **Phase B-C**：JS 后端稳定，语言特性完善（Refinement types + Linear types）
2. **Phase C-D**：LLVM 后端（需要 Linear types + Perceus RC 作为前置）

引入 LLVM 前必须先完成 codegen 接口抽象化（从当前 JS 单体中提取共享 HIR 优化 pass）。**第二个后端是最痛的**——它迫使所有"隐式假设 JS"的代码显式化。

## 已取消特性

### `or` 兜底表达式
design.md 2.3 层级 1。已被 Option 方法（`unwrap_or` / `unwrap_or_else`）取代，不再实现。

### Full Algebraic Effects（B-009）
Post-resume handler + multi-resume。取消原因：tail-resumptive + abort 覆盖 95%+ 实际需求，剩余用例用 async effect + defer 解决更好。实现复杂度（delimited continuation + 资源安全）与工程价值不成比例。

---

> 本文档随 Phase 推进更新。每个 Phase 启动时，从此处挑选特性进入该 Phase 的 spec。
