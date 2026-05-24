# Backlog

> 活的工作看板。做完的条目删除，只在 git commit message 留记录。
> 条目格式：`### B-xxx <标题> [类型] [优先级] [复杂度] [状态]`
> 状态流转：`queued` → `planning` → `doing` → 删除
> 反馈分支：`doing` → `waiting-feedback`（Worker 遇到设计问题）→ Discussion 处理后 → `queued`（重新排队）
> 工作流规范见 `docs/workflow.md`

## Phase C 执行计划 （2026-05-23 确定）

**目标**：基础设施特性 + 中等特性全部完成，为层 3 重型特性铺路。

**层 1（基础设施，优先）**：
- ~~B-034 Effect Aliases [S]~~ ✅ 已完成（2026-05-23）
- ~~B-005 Supertrait 继承 [M]~~ ✅ 已完成（2026-05-23）
- ~~B-037 `mut<T>` Marker Effect [M]~~ ✅ 已完成（2026-05-23）
- ~~B-008 Default Effect Handler [M]~~ ✅ 已完成（2026-05-23）

**层 2（核心特性）**：
- ~~B-004 关联类型 [L]~~ ✅ 已完成（2026-05-24）
- ~~B-036 Iterator Trait [M]~~ ✅ 已完成（2026-05-24）
- ~~B-010 `delegate` 关键字 [M]~~ ✅ 已完成（2026-05-23）

**设计验证（Stabilize 前置，阻塞层 3）**：
- B-042 Perceus 循环引用策略 [M]（阻塞 B-012）
- ~~B-043 Refinement × Linear × Effects 交互矩阵 [M]~~ ✅ 已完成（2026-05-24）
- ~~B-044 Ring 语义规范 [M]~~ ✅ 已完成（2026-05-24）

**关键路径（2026-05-24 更新）**：
- ~~B-004~~ → ~~B-036~~ → B-011 LLVM（~~关联类型~~ ✅ → ~~Iterator~~ ✅ → LLVM 基础后端）
- ~~B-036 不再阻塞 LLVM~~
- Linear types 不阻塞基础 LLVM，是 Perceus RC 的前置
- B-042 与关键路径并行，阻塞 B-012 Perceus 但不阻塞 LLVM 基础
- B-033 GADTs 移出层 2，推迟至 LLVM 之后（无下游依赖，非编译器自举需求）
- 层 3（Refinement/Linear/async）在 LLVM 基础后端可用后启动
- **LLVM 落地后 JS 后端废弃**

---

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
- **交互规则（B-043 决策）**：refinement 是值级谓词，不允许引用可变绑定；跨 effect/await 边界恒成立；handler resume 值须满足 refinement 约束；`mut` 参数带 refinement 时每次赋值重新验证（SSA 流分析，复杂度归入本 item）。详见 design.md 1.5

### B-002 Ownership + Drop（Rust 风格 RAII，无 borrow checker）[feature] [P2] [XL] [queued]
Rust 的所有权模型减去 borrow checker。编译器做数据流分析追踪值的所有权，确保 Drop 恰好执行一次。

**模型**：
- 所有值 scope 结束自动 drop（RAII，正常路径 + abort 路径均自动）
- Move 语义：赋值/传参 = move，move 后原变量不可用
- `impl Drop` 的类型禁止 `impl Clone`（编译器拒绝，资源不可复制）
- `drop(x)` 提前释放，`leak(x)` 显式逃逸（不触发 Drop）
- `mut self` 方法 = 隐式借用（不消耗所有权）
- 共享访问 → `Rc<T>`（Ring 等价物），Rc 可 Clone，内部资源 Drop 在 Rc 归零时触发
- 无 `linear` 关键字——`impl Drop` 是唯一的 ownership 入口
- 容器持有 Drop 类型值 → 容器 Drop 自动 drop 所有元素，容器自身不因此获得 Drop 约束

**LLM 友好性**：本质是 Rust move/drop/RAII 语义，LLM 从 Rust 训练数据天然理解。自动浮现路径：LLM 正常写代码 → move 后使用原变量 → 编译器报 "value moved" → LLM 修。无新概念。

- **前置依赖**：`mut<S>` 稳定
- **复杂度**：大（ownership checker + Perceus RC 的前置条件）
- **优先级**：Phase C 与 refinement 穿插
- **交互规则（B-043 决策）**：RAII 模型——Drop 值在 abort/cancel 路径自动释放；Drop::drop 禁止 fail effect（允许 io）；spawn 为 move 语义，不可跨任务共享 Drop 值；`mut self` 调用 = 隐式借用（不消耗）。详见 design.md 1.5

### B-003 Dependent Types Lite [feature] [P3] [XL] [queued]
design.md 1.3。类型可依赖特定值（`Vec<T, n: Nat>`），不要求完整依赖类型证明。

- **前置依赖**：Refinement types
- **复杂度**：极大（约束求解可能不可判定）
- **优先级**：Phase D（研究向）


### B-033 GADTs（Generalized Algebraic Data Types）[feature] [P3] [L] [queued]
> 2026-05-24 从层 2 移出：无下游依赖，编译器自身不需要，推迟至 LLVM 之后。
enum 变体可指定不同的返回类型约束，match 分支内编译器自动获得类型等式约束（完整方案：scoped unification）。

```ring
enum Expr<T> {
    Lit(Int): Expr<Int>,
    Add(Expr<Int>, Expr<Int>): Expr<Int>,
    IsZero(Expr<Int>): Expr<Bool>,
}

fn eval<T>(e: Expr<T>) -> T {
    match e {
        Lit(n) => n,                      // 分支内 T = Int，n: Int 满足 -> T
        Add(a, b) => eval(a) + eval(b),   // 分支内 T = Int
        IsZero(x) => eval(x) == 0,        // 分支内 T = Bool
    }
}

// 类型安全的异构列表
enum HList<T> {
    Nil: HList<Unit>,
    Cons(T, HList<U>): HList<(T, U)>,
}
```

**当前状态**：未实现

**前置依赖**：无硬依赖（但 union-find 需要扩展 snapshot/rollback）

**涉及修改**：
1. `ast.ring`：enum 变体声明扩展——`EnumVariant` 新增可选字段 `result_type: TypeExpr?`（`: Expr<Int>` 部分）
2. `parser.ring`：`parse_enum_variant()` 在字段列表后检查 `:` token → 解析返回类型约束。无 `:` 时为普通 enum（向后兼容）
3. `types.ring`：`EnumType` 的 variants 信息需要携带每个变体的类型约束（`variant_constraints: Map<Str, List<(Int, Type)>>`——类型参数 → 具体类型的绑定）
4. `infer_register.ring`：注册 enum 时，对有返回类型约束的变体，解析约束并验证——约束必须是 enum 自身的实例化（`Lit(Int): Expr<Int>` 中 `Expr<Int>` 是 `Expr<T>` 的实例化，绑定 T=Int）
5. `union_find.ring`：新增 `snapshot() -> Snapshot` 和 `rollback(Snapshot)` 方法——记录当前状态，分支结束后恢复
6. `infer.ring`：match 表达式推断时，若 scrutinee 类型是 GADT enum：
   - 每个分支进入前 `snapshot()`
   - 从变体的类型约束提取等式（如 T=Int），调用 `unify()` 注入
   - 推断分支体
   - 分支结束后 `rollback()` 撤回约束
   - 各分支返回类型在原始（未约束）环境中统一
7. `codegen`：无特殊改动——GADT 是纯编译期类型约束，JS 层面 enum 仍然是 tagged union

**交互规则（design.md 1.5）**：
- GADTs × Or-Pattern：or-pattern 合并的 GADT 变体必须携带兼容的类型等式，不兼容则编译错误
- GADTs × Effects：正交，无需特殊规则（scoped type equality 是编译期，evidence 是运行时）

**验收标准**：
- `enum Expr<T> { Lit(Int): Expr<Int> }` 语法可解析
- match 分支内类型等式自动生效——`eval` 函数可类型检查通过
- 无返回类型约束的 enum 变体行为不变（向后兼容）
- 类型约束与 enum 类型不匹配 → 编译错误（如 `Foo(Int): Bar<Int>`）
- 分支约束不泄漏到分支外
- 穷尽性检查对 GADT enum 正常工作
- or-pattern 合并不兼容 GADT 约束的变体 → 编译错误
- 全部 E2E 测试通过
- 自举编译器正常编译自身

### B-006 `dyn Trait`（动态分发）[feature] [P3] [L] [queued]
运行时多态，默认静态分发（泛型单态化），`dyn` 是主动选择动态分发的标志。

```ring
fn process_all(items: List<dyn Describable>) { ... }
```

- **当前状态**：未实现
- **前置依赖**：无硬依赖
- **优先级**：Phase C 或 D

### B-038 GATs（Generic Associated Types）[feature] [P3] [L] [queued]
关联类型可带自己的泛型参数，本质是 HKT-lite（类型构造器作为关联类型）。

```ring
trait StreamingIterator {
    type Item<'a>                    // Rust 风格（带 lifetime）
    fn next(mut self) -> Item<Self>? // Ring 不需要 lifetime，用 Self 参数化
}

// Ring 版本（无 lifetime，用类型参数替代）：
trait Lending<T> {
    type Output<U>                   // 关联类型带泛型参数
    fn lend(self, x: T) -> Output<T>
}

// HKT-lite：Functor
trait Functor {
    type F<A>                        // F 是类型构造器
    fn map<A, B>(self: F<A>, f: fn(A) -> B) -> F<B>
}
```

- **当前状态**：未实现
- **前置依赖**：B-004（关联类型）
- **复杂度**：大（关联类型的泛型化 + kind 检查）
- **优先级**：Phase D（研究向）。Ring 的 effect system 覆盖了 Monad 主要用例，GATs 紧迫度低

## Effect 系统

### B-007 `async` Effect + 结构化并发（设计已确定 2026-05-23）[feature] [P2] [XL] [queued]
async 作为 effect，handler 决定执行策略。Generator-based 实现，支持 sync handler（测试场景）。

```ring
effect async {
    fn spawn<T>(task: fn() -> T with {async}) -> Future<T>
    fn await<T>(f: Future<T>) -> T
}

// 结构化并发：spawn 必须在 scope 内
fn fetch_both() -> (Data, Data) with {async} {
    scope {
        let a = spawn { fetch_stocks() }
        let b = spawn { fetch_bonds() }
        (await(a), await(b))
    }  // scope 结束：等待所有子任务完成，未完成的自动取消
}

// 取消 = await 点注入 Cancelled fail，可 catch 补偿
fn transfer(from: Account, to: Account, amount: Int) with {async} {
    from.debit(amount)
    await(to.credit_async(amount))
} catch {
    Cancelled => from.refund(amount)  // 补偿逻辑
}

// Sync handler（测试）：
fn test_fetch() {
    let data = handle fetch_both() with {
        async.spawn(task) => task(),          // 立即执行
        async.await(f) => f,                  // 直接返回（已 resolved）
    }
    assert(data.0 == expected_stocks)
}
```

**已确定的设计决策（2026-05-23）：**

1. **实现策略：Generator-based**
   - async-effected 函数编译为 JS `function*`（generator）
   - Handler = driver，决定同步/异步驱动 generator
   - 默认 handler（生产）：async driver（`yield` Promise → 外层 `await`）
   - 自定义 handler（测试）：sync driver（`yield` mock value → 立即 `.next()`）
   - 模块导出自动包装为 JS `async function`（对 JS 消费者透明）
   - 后续优化选项：方案 C 双模编译（默认 handler → native async，仅需性能时再引入）

2. **强制结构化并发**
   - `spawn` 必须在 `scope { }` 内
   - scope 结束时：等待所有子任务完成
   - scope 提前退出（error/return）：取消所有未完成子任务
   - 无 `detach()`——所有任务生命周期由 scope 管理
   - 未来如需长命任务，在顶层 scope 或独立 handler 中 spawn

3. **取消机制：await 点 fail 注入**
   - Scope 退出触发子任务取消
   - 被取消的任务在下一个 `await` 点收到 `Cancelled` fail effect
   - 两个 await 之间的同步代码一定完整执行（不中断原子操作）
   - `Cancelled` 可被 `catch` 捕获做清理/补偿
   - 未 catch 的 `Cancelled` 向上传播直到 scope 捕获

**与 Rust 的差异（避坑）：**
- ❌ Rust：drop Future = 静默取消，任务不知道被取消了
- ✅ Ring：Cancelled fail = 显式通知，可 catch 补偿
- ❌ Rust：Pin/Unpin 复杂度（自引用 state machine）
- ✅ Ring：GC 托管，无 Pin 问题
- ❌ Rust：async trait 需要 boxing（直到 RPITIT）
- ✅ Ring：effect + 推断，trait 中 async 方法自然支持
- ❌ Rust：runtime 碎片化（tokio vs async-std）
- ✅ Ring：一种标准 handler/runtime

**前置依赖**：B-037（mut<T> marker effect）+ B-008（Default Effect Handler）
**复杂度**：极大（generator codegen + scope 管理 + 取消传播 + 标准库 async 原语）
**优先级**：层 3（Phase C 层 1+2 完成后启动）
**宣发价值**：直接解决 function coloring + cancellation safety——带 async effect 的函数可在同步 handler 下测试，取消可补偿。设计已确定，实现前可作为已解决的设计卖点讲

## 迭代与集合

## 性能优化（愿景：语义驱动的编译优化）

> **核心论点**：Ring 的类型系统（effect + refinement + linear）不仅用于安全性，还为编译器提供其他语言没有的优化信息。性能是 Ring 的核心卖点之一——目标不是"接近 C++/Rust"而是在特定场景**超越**。
>
> 优化分两层：AOT（LLVM 编译期）和 JIT（运行时 PGO），很多优化两层都可以做。
> 前置依赖链：LLVM backend → Perceus RC → 各项优化 pass → JIT（远期）。

### B-011 LLVM Native Backend [feature] [P1] [XL] [queued]
编译到 LLVM IR，所有后续优化的基础。**LLVM 落地后 JS 后端废弃。**

- **前置依赖**：B-004（关联类型）+ B-036（Iterator）——编译器自身需要这些语法糖。~~B-044 语义规范~~ ✅ 已完成
- **不阻塞基础 LLVM**：Linear types / Perceus RC（后续增量添加）
- **FFI 边界 effect 设计**：
  1. Evidence 传递：LLVM 端用 TLS handler stack，C 函数无需感知
  2. Effect-free 函数保证干净 C ABI，零成本互调
  3. 跨语言资源安全：Linear types + `defer` 清理 FFI 资源（Perceus RC 阶段实现）

### B-012 Perceus 引用计数 [feature] [P3] [XL] [queued]
精确 RC + 就地复用分析（reuse analysis），消除 GC。

- **前置依赖**：Linear types + B-011

### 语义驱动优化（AOT + JIT 共享）

以下优化利用 Ring 类型系统提供的**独有语义信息**，是 C++/Rust 编译器做不到或需要手动标注才能做到的：

| 优化 | 依赖的语义信息 | AOT | JIT | C++/Rust 对等物 |
|------|--------------|-----|-----|---------------|
| **Bounds check 消除** | Refinement types（编译器已证明 `i < len`） | ✓ | — | 无（需 unsafe） |
| **RC 省略** | Linear types（证明唯一持有） | ✓ | ✓ | Rust `&mut`（手动标注） |
| **就地修改保证** | Linear types + Perceus reuse analysis | ✓ | — | Rust `&mut`（手动标注） |
| **纯函数优化** | Effect purity（`with {}`） | ✓ CSE/DCE/重排 | ✓ 自动并行 | `constexpr`（有限） |
| **Evidence 特化** | Effect 单态调用点 | ✓ | ✓ | N/A |
| **Dictionary 反虚化** | Trait dispatch 热路径 | ✓ | ✓ speculative | Rust 单态化（编译期全量） |
| **融合（Deforestation）** | 纯函数管道 + Effect purity | ✓ | — | 手动循环合并 |
| **逃逸分析 → 栈分配** | 数据流分析 | ✓ | ✓ 更精确 | 手动控制 |
| **热路径单态化** | 泛型 + row-poly 函数 | 部分 | ✓ profile 驱动 | C++ 模板（编译期全量） |
| **闭包合并** | 管道中多个小闭包 | ✓ | — | 手动合并 |

### B-041 JIT 编译（LLVM ORC）[feature] [P3] [XL] [queued]
AOT native 基础上，运行时 JIT 重编译热路径。利用运行时 profile 做 AOT 无法做的优化。

- **先例**：Julia（LLVM ORC JIT）；Java HotSpot（服务端追平 C++）；Cling（C++ 解释器）
- **前置依赖**：B-011 + 基础 AOT 优化 pass 稳定
- **优先级**：远期愿景（Phase D/E）
- **独特优势**：Ring 的 effect/refinement/linear 信息给 JIT 提供其他语言没有的优化燃料

### 类型系统驱动的控制力（远期愿景）

> 设计原则：控制力通过类型系统表达，不通过 `unsafe` 逃逸口。程序员声明意图，编译器保证正确性。
> 等性能优化阶段（LLVM backend 稳定后）再逐项实现。

**Region Effect（内存分配策略）**

`region<R>` 作为 effect，handler 决定分配策略（arena / pool / bump）。块内分配零 RC 开销，块结束一次性释放。Linear types 保证引用不逃逸 region 生命周期。

```ring
handle {
    let tmp = entities.map(|e| alloc(e.pos))
    process(tmp)
} with region { arena(64 * 1024) }
```

应用场景：游戏帧循环、HTTP 请求处理、批处理管道。

**Value Types（unboxed 内联存储）**

`@value struct Point { x: Float, y: Float }` — 保证无 RC、按值传递、内联存储。编译器验证 value type 不含引用类型字段（或所有字段也是 value type）。

应用场景：数学向量/矩阵、颜色、坐标、小型不可变数据。

**Refinement 驱动的检查消除**

`fn get_unchecked(list: List<T>, i: Int where i >= 0 && i < list.len()) -> T` — refinement 证明已涵盖安全条件，编译器跳过运行时 bounds check。不需要 `unsafe`，类型系统保证安全。

应用场景：HPC 紧循环、图像像素遍历、矩阵运算。

**声明式优化 Hint**

| Hint | 作用 |
|------|------|
| `@align(N)` / `@packed` | 内存布局控制（cache line 对齐、紧凑存储） |
| `@specialize(T = Int)` | 强制泛型函数单态化 |
| `@vectorize` | 结合 effect purity 安全自动向量化 |
| `@inline` / `@noinline` | 内联控制 |

**不做的控制力**

| 机制 | 不做的原因 |
|------|-----------|
| 原始指针 / 手动 malloc | 破坏 RC/linear 保证 |
| 手动 SIMD intrinsics | 不可移植，由编译器 + hint 处理 |
| `unsafe` 块（Rust 风格） | Ring 用类型系统消除 unsafe 的需求 |
| 无 RC 模式 | 和 Perceus 架构冲突 |

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

## 设计验证（Stabilize 前置）

> 非实现任务，而是设计探针。在对应 XL 特性实现前完成，防止特性交互导致事后 breaking change。

### B-042 Perceus RC + 循环引用策略 [design] [P1] [M] [queued]
Perceus RC 不处理循环引用。Ring 有 OOP 手感（struct + impl + delegate），用户会写循环引用模式（观察者、树 + parent 指针、双向链表、图结构）。需要在 B-012 实现前确定逃逸方案。

**需要决策的选项**：
1. Weak reference 语法（`weak T`）— 显式标注，用户负责打断循环
2. Cycle collector 备选层 — RC 为主 + 可选 tracing GC 回收循环（Python/Swift 方案）
3. 类型系统禁止循环 — linear types 保证无循环（限制性强，可能影响 OOP 模式）
4. 混合方案 — 默认禁止 + `@cyclic` 标注允许（编译器自动插入 weak/cycle-collect）

**验证方式**：
- 列出 5-10 个典型 OOP 模式（观察者、树+parent、双向链表、图邻接、事件系统）
- 对每个模式验证选定方案是否可写、是否自然
- 确认方案不与 linear types / effect system 冲突

**验收标准**：
- 决策文档写入 design.md（含选定方案 + 否决理由）
- B-012 Perceus 的 spec 更新为包含循环处理

**前置依赖**：无
**阻塞**：B-012 Perceus RC


## 架构改进


## 语法增强


## 已知 Bug / 技术债


### B-054 Parser expression-level 错误恢复 [feature] [P3] [M] [queued]
Parser 有声明级错误恢复，但 `handle...with` 等复合表达式无恢复机制，单个 malformed 表达式会 poison 整个声明的解析。

**涉及修改**：
1. `parser.ring`：在 `handle`/`match`/`if` 等复合表达式解析失败时，尝试跳到 `}`/`)` 等闭合 token 恢复

**验收标准**：
- malformed `handle` 表达式不阻止后续声明的解析
- 错误报告质量不下降
- 全部 E2E 测试通过

### B-055 Match 表达式统一 labeled block 替代 IIFE [refactor] [P3] [S] [queued]
不含 `return` 的 match 表达式用 IIFE `(function() { ... })()`，含 `return` 的已用 labeled block + temp variable。统一为后者，避免闭包分配。

**⚠️ 已知阻塞（2026-05-24）**：temp variable 方案在 lambda body 中使用 match 时失效——`emit` 语句被写到 lambda 外部作用域，lambda 参数变量脱离作用域（如 `.any(fn(d) { match d.severity { ... } })`）。需要先解决 codegen 的 statement/expression 上下文区分问题。

**涉及修改**：
1. `codegen_expr.ring`：match 表达式统一使用 `__ring_blkN` temp variable 方案
2. **前置条件**：codegen 需要感知当前是否在表达式上下文中，以决定 emit 策略

**验收标准**：
- 生成的 JS 中 match 表达式不再出现 IIFE
- lambda 内部的 match 表达式仍正常工作
- 全部 E2E 测试通过
- 自举编译器正常编译自身

### B-056 闭包捕获 `let mut` 变量时注入 `mut<T>` effect [feature] [P3] [M] [queued]
B-048 遗留。闭包捕获 `let mut` 变量时，应在闭包签名注入 `mut<T>` effect，使 effect 追踪完整。核心的 local effect cancellation 已在 B-048 完成。

**涉及修改**：
1. `infer.ring`：lambda 推断时分析捕获列表，对捕获的 `let mut` 变量注入 `mut<T>` effect

**验收标准**：
- 闭包捕获 `let mut` 变量 → 闭包类型携带 `mut<T>` effect
- 闭包内修改捕获的 mut 变量 → `mut` effect 正确传播到调用者
- local cancellation 规则仍生效（局部变量 mutation 不传播）
- 全部 E2E 测试通过

### B-057 occurs check + apply_subst fields 遍历互锁修复 [bugfix] [P3] [M] [queued]
`occurs_in`（`unify.ring`）不检查 StructType/EnumType 的 fields/variants 中的类型；`apply_subst`（#45）同样不替换 fields 中的类型。两者互锁——当前安全但不完备。需同时修复。

**涉及修改**：
1. `unify.ring`：`occurs_in` 递归检查 fields/variants 中的类型
2. `unify.ring`：`apply_subst` 递归替换 fields/variants 中的类型

**验收标准**：
- 涉及 struct/enum 字段类型变量的统一场景正确处理
- 不引入无限类型（occurs check 正确拒绝）
- 全部 E2E 测试通过
- 自举编译器正常编译自身








## 关联类型修复依赖序（audit 建议）

~~B-062（#124 约束验证）~~ ✅ → ~~B-063（#125/#128 delegate 转发）~~ ✅ → ~~B-064（#129 scope 区分）~~ ✅ → ~~B-058（#115 bound 验证）~~ ✅ → ~~B-065（#121 显示改善）~~ ✅

## 性能优化



## 架构：后端策略（2026-05-23 更新）

**JS 后端定位为 bootstrap 后端，LLVM 为目标后端。**

| 后端 | 定位 | 生命周期 |
|------|------|---------|
| **JS (V8)** | Bootstrap | 当前唯一后端，支撑编译器自举。LLVM 后端成熟后归档，仅保留 Web playground 用途（可由 WASM 替代） |
| **LLVM** | 目标后端 | Ring 语言特性（linear types、Perceus RC、full AE）的完整实现平台 |

### 生态策略：RIIR（Rewrite It In Ring）

不依赖外部包管理生态（npm/crates.io），通过逐步用纯 Ring 重写标准库和核心库建立自有生态。底层原语（syscall、crypto、压缩）通过 C FFI 接入。

**FFI 边界是退缩前线**：标准库从 `extern fn` 包装 JS → 纯 Ring 实现。纯 Ring 代码天然跨后端——RIIR 进度 = 后端迁移就绪度。

### LLVM 后端引入路径

1. 语言特性完善（Phase C 层 1+2）
2. Codegen 接口抽象化（从 JS 单体中提取共享 HIR 优化 pass）
3. LLVM codegen 实现（HIR → LLVM IR）
4. 标准库底层原语移植（extern fn JS → extern fn C ABI）
5. 编译器自身 native 化（bootstrap 完成，JS 后端归档）

### 已排除的后端

- **WasmGC**：独立后端投入产出比不合理。Web 场景由 LLVM→WASM 路径覆盖。
- **QBE(Ring)**：编译器自包含是远期愿景，不主动规划。

## 已取消特性

### `or` 兜底表达式
design.md 2.3 层级 1。已被 Option 方法（`unwrap_or` / `unwrap_or_else`）取代，不再实现。

### Full Algebraic Effects（B-009）
Post-resume handler + multi-resume。取消原因：tail-resumptive + abort 覆盖 95%+ 实际需求，剩余用例用 async effect + defer 解决更好。实现复杂度（delimited continuation + 资源安全）与工程价值不成比例。

---

> 本文档随 Phase 推进更新。每个 Phase 启动时，从此处挑选特性进入该 Phase 的 spec。
