# 特性排队表（Backlog）

> 未纳入当前阶段的特性和改进项，按类别整理。每项标注设计来源和前置依赖。
> 上次更新：2026-05-22，Phase B spec 制定时

## 类型系统

### Refinement Types
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

### Linear Types（自动推断）
design.md 11.2 解法 B。编译器做数据流分析，旧值无后续引用时安全就地修改。

- **前置依赖**：`mut<S>` 稳定
- **复杂度**：大（linearity checker + Perceus RC 的前置条件）
- **优先级**：Phase C 与 refinement 穿插

### Dependent Types Lite
design.md 1.3。类型可依赖特定值（`Vec<T, n: Nat>`），不要求完整依赖类型证明。

- **前置依赖**：Refinement types
- **复杂度**：极大（约束求解可能不可判定）
- **优先级**：Phase D（研究向）

### 关联类型（Associated Types）
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

### Supertrait 继承
Trait 之间的继承关系（`trait Ord: Eq`）。

- **当前状态**：未实现
- **前置依赖**：无硬依赖
- **优先级**：Phase C

### `dyn Trait`（动态分发）
运行时多态，默认静态分发（泛型单态化），`dyn` 是主动选择动态分发的标志。

```ring
fn process_all(items: List<dyn Describable>) { ... }
```

- **当前状态**：未实现
- **前置依赖**：无硬依赖
- **优先级**：Phase C 或 D

## Effect 系统

### `async` Effect + 结构化并发
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

### Default Effect Handler
用户自定义 effect 的默认 handler，解决"每次执行程序都需要带一坨 handler"的问题。内置 effect（io/fail/mut）已有隐式 handler，但用户自定义 effect 目前必须显式 handle。

```ring
// 想法：在 effect 声明时提供 default handler
effect log {
    fn log(msg: Str) -> Unit
} default {
    log(msg) => print(msg)  // 默认行为：打印到 stdout
}

// 调用者可以不写 handler，自动使用 default
fn main() {
    do_work()  // do_work 内部 perform log，自动用 default handler
}
```

- **前置依赖**：无硬依赖（但 handler 可能抛出其他 effect，需考虑 effect 链的默认解析顺序）
- **复杂度**：中（语法设计简单，但 default handler 抛出其他 effect 时的语义需仔细设计）
- **优先级**：Phase C
- **参考**：Unison 仅 IO 有内置 handler；Snowflyt 指出"默认 Effect handler 看起来是个很容易解决的问题，但考虑到 handler 还可能抛出其他 Effect，实现上的复杂性就显著增加了"

### Full Algebraic Effects（Post-resume Handler + Multi-resume）
design.md 2.5。当前 handler 只支持 tail-resumptive + abort，不支持 resume 后继续执行额外代码，也不支持多次 resume。

```ring
handle {
    let result = complex_pipeline()
} with {
    fail(e: ValidationError) => {
        log(e)
        resume(default_value)  // resume 后继续执行
        log("recovered")       // post-resume 代码
    }
}
```

- **前置依赖**：需要 delimited continuation + Linear types（多次 resume 的资源安全保证）
- **复杂度**：极大
- **优先级**：Phase D
- **资源安全设计**：多次 resume 会 fork 执行路径，导致锁释放/文件操作等资源问题。Linear types 保证 Ring 侧资源在 fork 时正确 move/clone，但跨 FFI 边界的外部资源（C `malloc`/`fopen`）不受 linear type 保护——需配合 FFI 边界 effect 策略（见下方 LLVM 条目）

## OOP 模拟

### `delegate` 关键字
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

## 性能优化

### LLVM Native Backend
design.md 14.2。编译到 LLVM IR，桌面/服务端场景。

- **前置依赖**：Linear types（Perceus RC 基础）
- **复杂度**：极大
- **优先级**：Phase C（长期视野 [[long-term-vision]]）
- **FFI 边界 effect 设计**（LLVM 阶段必须在设计期解决的问题）：
  1. **ABI 不可见参数**：带 effect 的 Ring 函数编译后有额外的 evidence 参数，C 调用者无法感知。effect-free 的 Ring 函数应保证干净的 C ABI（无 evidence 参数），零成本互调
  2. **`extern fn` effect 策略**：Ring → C 暴露的函数和 C → Ring 调用的函数是否必须 effect-free？最安全的方案（Rust 路线：`extern "C" fn` 不能是 async），但限制表达力
  3. **C 回调中的 effect 边界**：传给 C 的回调函数内 perform effect 时，effect handler 链需跨越 C 栈帧。选项：a) 编译期禁止（最安全）；b) 入口安装 trampoline 恢复 handler 链（复杂但可行）
  4. **栈管理冲突（Full Algebraic Effects）**：tail-resumptive 无问题（纯参数传递），但 delimited continuation（multi-resume/post-resume）需要捕获/复制栈段，与 C 线性调用栈模型冲突——C 栈帧中的指针可能悬空
  5. **跨语言资源安全**：Linear types 保证 Ring 侧资源，但 C 分配的资源（`malloc`/`fopen`）不在 RC 图中。effect handler abort 时需要类似 `Drop`/`defer` 的机制清理 FFI 资源
  - **参考**：Koka 不暴露 C FFI 给用户（monadic transformation 编译到 C）；OCaml 5 限制 effect 不能跨 C 帧；Rust `extern "C" fn` 不能是 async

### WasmGC Backend
design.md 14.2。编译到 WasmGC，Web 端 ~2x JS 性能。

- **前置依赖**：语言特性基本稳定
- **复杂度**：大
- **优先级**：Phase C（比 LLVM 更优先——W3C 标准已落地，投入产出比高）

### Perceus 引用计数
design.md 14.3。精确 RC + 就地复用分析，消除 GC 停顿。

- **前置依赖**：Linear types + LLVM backend
- **复杂度**：极大
- **优先级**：Phase C/D

### 热路径单态化
design.md 11.3。Row-poly 函数在热循环中特化为具体类型版本。

- **前置依赖**：性能 profiling 基础设施
- **复杂度**：中
- **优先级**：Phase D/E

### 融合（Deforestation）
design.md 11.2 解法 C。消除中间集合，多次遍历合并为一次。

- **前置依赖**：标准库 HOF 方法迁移到 Ring（Phase B S2）
- **复杂度**：中
- **优先级**：Phase D/E

### 闭包合并
design.md 11.5。管道中多个小闭包合并为单次遍历的合并函数。

- **前置依赖**：融合
- **复杂度**：中
- **优先级**：Phase E

## 工具链

### LSP 移植
原 TS 实现未移植到 Ring 自举编译器。需要重新实现。

- **当前状态**：VSCode 插件仅提供语法高亮
- **前置依赖**：无硬依赖（但 formatter 完成后 LSP 可复用其 AST 处理）
- **复杂度**：大
- **优先级**：Phase B 之后，用户需求驱动

### CI 管线
测试全靠手动 `npm test`。

- **当前状态**：无 CI
- **前置依赖**：无
- **复杂度**：小
- **优先级**：按需（"仅跨平台时需要"——flywheel memory）

### Debugger
source-map 支持 + 断点调试。

- **前置依赖**：LSP
- **复杂度**：大
- **优先级**：Phase D/E

## 已知 Bug / 技术债

### Impl 方法 Effect 传播
impl 方法的 `fail` effect 在 Pass 1 注册为 `EMPTY_ROW`，Pass 2 推断后不回传。

- **当前 workaround**：parser 用 `__ring_raise_fail` extern fn 直接抛 `__EffectAbort`，codegen 的 `gen_try_catch` 已去除 `has_fail_effect` 前置检查
- **正确修复**：Pass 2 推断后回传 effect 到 TypeScheme
- **前置依赖**：可能受益于 F1（effect 标注语法——标注后 Pass 1 直接读取）
- **优先级**：Phase B 期间顺势修复

### 表达式位置 IIFE return 截获
`let x = { return y; 0 }` 中的 return 被 IIFE 截获。语句位置已修复。

- **当前状态**：实践中极少遇到
- **优先级**：低

### 集合 `===` 引用相等
`List.contains`/`Map.get`/`Set.contains` 使用 JS `===`。

- **当前状态**：Phase B S3 计划迁移到 Eq trait
- **优先级**：Phase B

### 深层嵌套泛型 UFCS 调用
`Pair<Pair<Int, Int>, Int>` 的 `.eq()` 等直接方法调用受限。

- **当前状态**：auto-derive 和 operator dispatch 正常，直接方法调用受限
- **优先级**：低

## 架构：多后端策略

Ring 成熟后为多后端结构，各后端长期共存，各有主场：

| 后端 | 主场景 | 特有约束 |
|------|--------|---------|
| **JS** | Web 前端、快速原型、Playground、Node CLI | GC 托管，无 linear type 收益，effect 通过 evidence passing + try/catch |
| **WasmGC** | Web 高性能（~2x JS）、沙箱环境 | WasmGC stack switching 提案尚未稳定，effect 实现受限 |
| **LLVM** | 桌面/服务端、系统级性能 | 完整控制栈和内存，Perceus RC，delimited continuation 可行 |
| **QBE(Ring)** | 自包含编译器（零外部依赖）、嵌入式 | QBE 级后端用 Ring 自身实现，优化能力弱于 LLVM 但编译速度极快 |

### 核心张力

**1. Effect 实现分歧**

各后端实现 effect 的机制不同：
- JS：evidence passing → 普通函数参数 + try/catch（当前方案）
- LLVM：evidence passing + delimited continuation（full AE 所需）
- WasmGC：等待 stack switching 提案落地，否则需 CPS 变换
- QBE(Ring)：setjmp/longjmp 或轻量级栈切换

同一套 effect 语义在不同后端可能有不同的能力边界——例如 multi-resume 在 JS 后端可能无法高效实现（无法捕获栈段），但在 LLVM 后端可以。**是否允许后端间的 feature gap？** 如果允许，需要编译期按目标后端检查 effect 使用是否合法。

**2. 标准库 runtime 分裂**

当前标准库（`std/*.ring`）的底层实现全是 JS（`extern type List<T>` = JS Array）。多后端意味着每个后端需要自己的 runtime 实现：
- JS runtime：当前的 `runtime.ring` 产出
- LLVM runtime：需要 C/Ring 实现的 List/Map/Set/Str + GC 或 RC
- WasmGC runtime：WasmGC 原生 struct/array
- QBE runtime：Ring 自实现的数据结构

**维护倍增器**：N 个后端 × M 个 runtime 函数 = N×M 实现需要保持语义一致。应对策略：
- 标准库**接口**（方法签名 + 语义契约）由 `std/*.ring` 定义，是跨后端的 single source of truth
- 每个后端提供自己的 runtime 实现，通过 **同一套 E2E 测试** 验证语义一致性
- 考虑用 Ring 自身实现尽可能多的标准库逻辑（纯 Ring 代码自动适配所有后端），仅将最底层原语（内存分配、IO syscall）作为后端特定的 `extern fn`

**3. FFI 表面积分裂**

每个后端面对不同的外部世界：
- JS：`extern fn` → JS 函数，`extern type` → JS 对象
- LLVM：`extern fn` → C ABI 函数，`extern type` → C struct
- WasmGC：`extern fn` → WASM import/export
- QBE：同 LLVM（C ABI）

**问题**：一个使用 FFI 的 Ring 库是否只能跑在单一后端上？如果是，需要条件编译机制（`#[backend(js)]`）。如果想跨后端，需要 FFI 抽象层。

**4. Codegen 架构**

当前 codegen 是单体 JS 代码生成。多后端需要：
- 共享的 HIR → 后端无关优化 pass（常量折叠、死代码消除、内联）
- 后端特定的 lowering：HIR → JS / HIR → LLVM IR / HIR → WasmGC / HIR → QBE IR
- **接口设计**：codegen 应抽象为 trait/接口，各后端实现。当前的 `codegen*.ring` 文件需要重构为 JS 后端的具体实现

**5. 测试矩阵爆炸**

N 个后端 × M 个语言特性 = N×M 测试配置。应对策略：
- E2E 测试（`tests/cases/*.ring`）是后端无关的——同一份测试用例，分别跑各后端产出
- 后端特定测试仅覆盖 FFI、runtime 实现、性能基准
- CI 按后端维度并行

### 引入顺序建议

1. **Phase B-C**：JS 后端稳定，语言特性完善
2. **Phase C**：WasmGC 后端（投入产出比最高——W3C 标准已落地，与 JS 生态互补）
3. **Phase C-D**：LLVM 后端（需要 linear types + Perceus RC 作为前置）
4. **Phase D+**：QBE(Ring) 后端（编译器完全自包含的终极目标）

每引入一个新后端前，必须先完成 codegen 接口抽象化（从当前 JS 单体中提取共享 HIR 优化 pass）。**第二个后端是最痛的**——它迫使所有"隐式假设 JS"的代码显式化。

## 已取消特性

### `or` 兜底表达式
design.md 2.3 层级 1。已被 Option 方法（`unwrap_or` / `unwrap_or_else`）取代，不再实现。

---

> 本文档随 Phase 推进更新。每个 Phase 启动时，从此处挑选特性进入该 Phase 的 spec。
