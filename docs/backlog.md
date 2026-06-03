# Backlog

> 活的工作看板。做完的条目删除，只在 git commit message 留记录。
> 条目格式：`### B-xxx <标题> [类型] [优先级] [复杂度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
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
- B-068 Borrow-by-default 参数传递模型 [L]（阻塞 B-012 Perceus，与 B-042 并行）
- ~~B-043 Refinement × Linear × Effects 交互矩阵 [M]~~ ✅ 已完成（2026-05-24）
- ~~B-044 Ring 语义规范 [M]~~ ✅ 已完成（2026-05-24）

**关键路径（2026-06-03 更新）**：
- ~~B-004~~ → ~~B-036~~ → ~~B-011 LLVM~~ ✅ → ~~B-012 Perceus RC L0 基础设施~~ ✅ → ~~B-082 RC 诊断~~ ✅ → ~~B-081 dup 架构迁移~~ ✅
- **当前目标：native 自举 + E2E + 双后端行为对比全过**（2026-06-03 规划，见下「Native 自举路线图」）
- B-042 / B-068 阻塞 L1/L2，不阻塞 native 自举（L0 正确性即可）
- B-033 GADTs 推迟至 native 自举之后（无下游依赖）
- 层 3（Refinement/Linear/async）在 native 自举验证通过后启动
- **LLVM 落地后 JS 后端废弃**

### Native 自举路线图（2026-06-03 规划）

> 来源：本次 Discussion 4 路只读调研（codegen gap / 差分覆盖 / RC gap / runtime 完整性）+ 亲自贴码核查 load-bearing 断言。子 agent 报告按核过的可信度分档落项；hedged 断言走差分验证（B-088）再修。

三个验收门：
- **G-a 内存**：带 RC pass 自编译，内存峰值从 no-GC 的 25.9GB 降至机器可运行
- **G-b 双 bootstrap 一致**：native 二进制重编译编译器，字节级一致
- **G-c 双后端 parity**：native E2E + llvm_diff 全过，行为与 JS oracle 一致

| Item | 内容 | 门 | 优先级 |
|------|------|-----|--------|
| ~~B-083~~ ✅ | LLVM match guard 完整实现（codegen + perceus RC + diff）| G-c + G-a/b(RC) | P1 |
| ~~B-088~~ ✅ | 双后端差分覆盖扩展 — 锁 6 parity 用例 + 发现 6 处 LLVM 发散喂 B-087 | G-c | P1 |
| B-084 | Perceus drop 精度（#131 落地 + #130 env drop + drop_T 完整性）| G-a/b | P2 |
| B-085 | Perceus 发射 determinism（drop/dup 顺序独立于 Set 迭代序）| G-b | P2 |
| B-086 | LLVM 缺失 runtime 原语（flat_map/enumerate/str_to_int/float）| G-c | P2 |
| B-087 | LLVM codegen 双后端 parity（dict 多态 / Wrapped / range / #103 mut 等）| G-c | P2 |
| B-002 | abort-unwind drop（#2 TryCatch + handler abort）并入 Drop/RAII | G-a/c | P2 |
| B-089 | Native 终验 capstone（跑通 G-a/b/c，待大内存机 + 前置项）| 全部 | P1（阻塞中）|

依赖：B-089 依赖前述全部；B-088 是 G-c 的发现+锁定引擎（失败的 diff 用例喂给 B-083/B-087，通过的锁定 parity）。**关键认识**：编译器自身重度用 trait/泛型/dict 且 LLVM 自编译字节级一致——故 B-087 那些 dict/多态发散**不阻塞自举**（编译器不触发），只阻塞 G-c E2E parity（特定模式触发）。

---

## 类型系统

### B-001 Refinement Types [feature] [P2] [XL] [judgment] [queued]
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
- **含 const generic 参数谓词**（2026-05-25，原 B-003 吸收）：refinement predicates 作用于 const generic 参数（如 `where N > 0`）归入本 item 的 SSA 约束传播。详见 design.md 1.3

### B-002 Ownership + Drop（Rust 风格 RAII，无 borrow checker）[feature] [P2] [XL] [judgment] [queued]
Rust 的所有权模型减去 borrow checker。编译器做数据流分析追踪值的所有权，确保 Drop 恰好执行一次。

> **Perceus 分层角色 = L2**（见 §7.10 / B-012）：在 L0 RC 核心（B-012）之上实现用户 `impl Drop` + 正常/abort/cancel 全路径 RAII。**两个并入项**：(1) fail/catch 从 setjmp/longjmp 切换到 **drop-aware unwind**（longjmp 会跳过 drop → 改成栈展开时逐帧 drop）；(2) `Weak<T>` 库类型实现（`Rc.downgrade()` + `.upgrade() -> T?`，循环引用解法，设计见 §7.9）。
>
> **#2 TryCatch / handler abort 的 abort-unwind drop 泄漏并入本项（2026-06-03 决策）**：try body 中途 `fail.raise`（经 `ring_try` longjmp）绕过正常 drop 序列，已分配局部值 + 未调用的 resume 闭包 + handler param 捕获全泄漏（方向安全）。perceus 静态 pass 插不进 longjmp 边——必须靠上面的 drop-aware unwind 在栈展开时逐帧 drop。涉及 `perceus.ring`（TryCatch/HandleExpr 分支）+ `ring_runtime.cpp`（ring_try/raise unwind）+ codegen_llvm。影响 G-a 内存 + G-c 正确性。原 B-083 #2 退回后归此。

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



### B-072 Union Type（匿名 enum 语法糖）[feature] [P2] [M] [judgment] [queued]
`A | B | C` 作为匿名 enum 的语法糖。纯编译期展开，不引入子类型，HM 推断不受影响。详见 design.md 1.1b。

**核心用例**：
1. 错误组合：`fail<IoError | ParseError>` — 消除手写包装 enum 的 boilerplate
2. Row poly 签名显示：`fn greet(person: User | Company)` — 单态化后的具体类型展示
3. 多类型参数：`fn process(x: Str | I64)` — 轻量级 sum type

**语义规则**：
- 展开为匿名 enum（tagged，同 enum codegen）
- 归一化：按类型名字典序、去重、扁平化
- 结构等价：两处 `Str | I64` = 同一类型
- 调用点隐式包装：传 `Str` 到 `Str | I64` 时编译器自动插入构造

**待定**：match 语法——用类型名做 pattern（`Str(s) => ...`）的消歧规则，需后续 discussion 细化

**涉及修改**：
1. `parser.ring`：类型语法支持 `A | B`
2. `types.ring`：`UnionType` 或复用 `EnumType` + 匿名 enum 生成
3. `infer.ring`：调用点隐式包装推断
4. `codegen.ring`：同 enum（tag + payload）

**验收标准**：
- `Str | I64` 可声明为参数/返回/变量类型
- `fail<IoError | ParseError>` 可编译，catch 可按类型 match
- 调用点自动包装
- 归一化 + 去重 + 扁平化正确
- 不影响 HM 推断
- 全部 E2E 测试通过
- 自举编译器正常编译自身

### B-033 GADTs（Generalized Algebraic Data Types）[feature] [P3] [L] [judgment] [queued]
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

### B-006 `dyn Trait`（动态分发）[feature] [P3] [L] [judgment] [queued]
运行时多态，默认静态分发（泛型单态化），`dyn` 是主动选择动态分发的标志。

```ring
fn process_all(items: List<dyn Describable>) { ... }
```

- **当前状态**：未实现
- **前置依赖**：无硬依赖
- **优先级**：Phase C 或 D

### B-038 GATs（Generic Associated Types）[feature] [P3] [L] [judgment] [queued]
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

### B-007 `async` Effect + 结构化并发（设计已确定 2026-05-23）[feature] [P2] [XL] [judgment] [queued]
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

> **B-011 LLVM Native Backend 已完成（2026-06-01）** — 前端自举打通：ring.exe 单文件产出与参考编译器字节级一致，多模块端到端跑通，所有 codegen bug + fail/catch 已修（见 `tests/cases/llvm/` 回归套件）。**完整 native 自举的剩余两条验收（二次自举一致性 + native E2E 全过）受内存墙（25.9GB，no-GC）阻塞，已并入 B-012——Perceus RC 是解锁它们的唯一路径。**

### ~~B-012 Perceus RC 核心 (L0)~~ ✅ 已完成（2026-06-01）

基础设施全部落地：runtime RC（ring_alloc/dup/drop + typeid dispatch + builtin drops）、HIR Drop/Dup 节点、Perceus pass（backward liveness + branch-balancing）、LLVM codegen 集成。不带 RC pass 可自举且功能正常。728 E2E + 11 LLVM diff 全过。

**Perceus 分层不变**：L0 ✅ → L1 借用优化（B-068）→ L2 Drop/RAII（B-002）→ L3 reuse/FBIP（B-079）→ L4 标量 unboxing（B-080）。

**L0 剩余收尾**（从 B-012 拆出为独立 item）：
- B-082：RC 诊断基础设施（runtime 断言 + codegen 警告）
- B-081：dup 从表达式层 Block 包装迁移到语句层 emit
- B-083：RC pass 正确性修复（闭包捕获 / try-catch / 循环+闭包 / match guard）
- 全部完成后：带 RC pass 编译编译器自身，验证内存下降 + 二次自举一致性

### B-079 Perceus Reuse Analysis / FBIP (L3) [feature] [P3] [XL] [judgment] [queued]
就地复用分析（functional but in-place）：`rc == 1` 时 match 解构 + 同尺寸重构 → 就地改写，drop-reuse 配对消除分配。Perceus 的性能核爆点（函数式写法零拷贝：list map、tree rebalance/insert）。含 reuse specialization（为有/无 reuse token 特化函数）+ COW（`rc > 1` 时 clone-on-write，内部优化非用户可见语义）。
- **前置依赖**：B-012（L0 RC 核心）
- **参考**：Koka Perceus reuse pass
- **验收**：典型 FBIP 模式（list map/filter、tree insert）生成就地改写而非新分配；基准显示分配数下降；全 E2E + `llvm_diff` 不回归；自举一致

### B-080 标量 Unboxing (L4) [feature] [P3] [L] [judgment] [queued]
Int/Float/Bool 从 uniform-boxed 堆 ptr 改为寄存器内联值，消除标量的 alloc + RC 流量。当前 uniform boxing 一切皆 `void*`（含标量）。
- **前置依赖**：B-012（L0）。与 L1/L3 正交
- **注**：内存墙主要由结构体/list/string 主导（box_int 缓存实测无效），unboxing 是性能优化，非内存墙解法
- **验收**：标量不再堆分配；算术热路径无 box/unbox；全 E2E + `llvm_diff` 不回归；自举一致

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

### B-041 JIT 编译（LLVM ORC）[feature] [P3] [XL] [judgment] [queued]
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

### B-016 LSP 移植 [feature] [P2] [L] [judgment] [queued]
原 TS 实现未移植到 Ring 自举编译器。需要重新实现。

- **当前状态**：VSCode 插件仅提供语法高亮
- **前置依赖**：无硬依赖（但 formatter 完成后 LSP 可复用其 AST 处理）
- **复杂度**：大
- **优先级**：Phase B 之后，用户需求驱动

### B-017 CI 管线 [feature] [P3] [S] [mechanical] [queued]
测试全靠手动 `npm test`。

- **当前状态**：无 CI
- **前置依赖**：无
- **复杂度**：小
- **优先级**：按需（"仅跨平台时需要"——flywheel memory）

### B-018 Debugger [feature] [P3] [L] [judgment] [queued]
source-map 支持 + 断点调试。

- **前置依赖**：LSP
- **复杂度**：大
- **优先级**：Phase D/E

## 设计验证（Stabilize 前置）

> 非实现任务，而是设计探针。在对应 XL 特性实现前完成，防止特性交互导致事后 breaking change。



## 架构改进


## 语法增强

### B-069 默认参数 [feature] [P2] [M] [judgment] [queued]
函数参数支持默认值。调用时可省略有默认值的参数。

```ring
fn connect(host: Str, port: Int = 8080, timeout: Int = 30) with {io} { ... }

connect("localhost")           // port=8080, timeout=30
connect("localhost", 3000)     // timeout=30
```

**设计约束**：
- 默认值必须是编译期可求值的纯表达式（无 effect）
- 只能从参数列表末尾开始省略（无命名参数时）
- 默认值是签名的一部分，lv2 标注展示
- 与 borrow/move/effect 系统无冲突

**命名参数（待定）**：
- 配合默认参数可实现"跳过中间参数"：`connect("localhost", timeout = 60)`
- 参数名成为 API 一部分（改名 = breaking change）
- 推迟到实现默认参数时重新评估是否需要

**前置依赖**：无
**复杂度**：M（Parser 扩展 + Checker 参数匹配 + Codegen 展开）


## 已知 Bug / 技术债

### B-074 ESM extern type/fn 跨模块导入缺陷 [bugfix] [P3] [M] [judgment] [queued]
Ring 的 ESM codegen 无法导出 extern type（它们没有 JS 值表示），导致 `use other_module::{SomeExternType}` 失败。当前 workaround：每个文件局部 re-declare 所需的 extern type/fn。不只影响 LLVM codegen，任何多文件项目用到 extern type 都会遇到。

**涉及修改**：
1. `codegen.ring`：extern type 生成某种占位导出（如 `export const SomeExternType = Symbol("SomeExternType")`），使 ESM import 不报错
2. `codegen.ring`：extern fn 的导出机制确认——当前是否已正确导出？如否，同步修复
3. 替代方案：模块系统层面允许 extern type 作为"类型级导出"（不生成运行时值），import 时跳过运行时绑定

**验收标准**：
- `use other_module::{SomeExternType, some_extern_fn}` 正常工作
- extern type 可跨模块用于类型标注
- 不影响 extern type 的运行时语义（仍然是 opaque）
- 全部 E2E 测试通过
- 自举编译器正常编译自身



### B-073 Row poly 降级为语法糖 + 单态化 [refactor] [P3] [M] [judgment] [queued]
Row poly 从类型系统一等概念降级为语法糖（design.md 1.4，2026-05-25 决策）。编译期通过单态化消除 `RecordType`，pub fn 禁止 row poly 参数。

**涉及修改**：
1. `unify.ring`：移除 row unification（~260 行），替换为"检查 struct 是否有所需字段"
2. `types.ring`：`RecordType` 降级为 desugar 中间表示，不出现在最终类型
3. `infer.ring`：row poly 函数标记为需单态化，收集调用点具体类型
4. `codegen.ring`：为每个具体类型生成特化版本（同泛型单态化）
5. `checker.ring`：pub fn 使用 row poly 参数 → 编译错误

**验收标准**：
- 现有 row poly 测试（row_basic/multi_field/generic/reject）全部通过
- pub fn 使用 row poly → 编译错误
- `RecordType` 不出现在 HIR 最终类型中
- 如存在匹配 trait → trait 归化（可选，增量实现）
- 全部 E2E 测试通过
- 自举编译器正常编译自身

### B-054 Parser expression-level 错误恢复 [feature] [P3] [M] [judgment] [queued]
Parser 有声明级错误恢复，但 `handle...with` 等复合表达式无恢复机制，单个 malformed 表达式会 poison 整个声明的解析。

**涉及修改**：
1. `parser.ring`：在 `handle`/`match`/`if` 等复合表达式解析失败时，尝试跳到 `}`/`)` 等闭合 token 恢复

**验收标准**：
- malformed `handle` 表达式不阻止后续声明的解析
- 错误报告质量不下降
- 全部 E2E 测试通过

### B-055 Match 表达式统一 labeled block 替代 IIFE [refactor] [P3] [S] [judgment] [queued]
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

### B-056 闭包捕获 `let mut` 变量时注入 `mut<T>` effect [feature] [P3] [M] [judgment] [queued]
B-048 遗留。闭包捕获 `let mut` 变量时，应在闭包签名注入 `mut<T>` effect，使 effect 追踪完整。核心的 local effect cancellation 已在 B-048 完成。

**涉及修改**：
1. `infer.ring`：lambda 推断时分析捕获列表，对捕获的 `let mut` 变量注入 `mut<T>` effect

**验收标准**：
- 闭包捕获 `let mut` 变量 → 闭包类型携带 `mut<T>` effect
- 闭包内修改捕获的 mut 变量 → `mut` effect 正确传播到调用者
- local cancellation 规则仍生效（局部变量 mutation 不传播）
- 全部 E2E 测试通过

### B-057 occurs check + apply_subst fields 遍历互锁修复 [bugfix] [P3] [M] [mechanical] [queued]
`occurs_in`（`unify.ring`）不检查 StructType/EnumType 的 fields/variants 中的类型；`apply_subst`（#45）同样不替换 fields 中的类型。两者互锁——当前安全但不完备。需同时修复。

**涉及修改**：
1. `unify.ring`：`occurs_in` 递归检查 fields/variants 中的类型
2. `unify.ring`：`apply_subst` 递归替换 fields/variants 中的类型

**验收标准**：
- 涉及 struct/enum 字段类型变量的统一场景正确处理
- 不引入无限类型（occurs check 正确拒绝）
- 全部 E2E 测试通过
- 自举编译器正常编译自身

### B-071 推断失败错误信息 UX [feature] [P2] [M] [judgment] [queued]
> ✅ Phase 1 已完成（2026-05-29）：基础设施 + 10 个关键 unify 调用点 + notes 渲染。剩余场景（空集合、row poly、effect 不匹配专用消息）后续迭代。

**已完成**：
- `type_error_with_notes()` + `unify_at_noted()` 基础设施
- 10 个 unify 调用点加了约束来源 notes（let/var/assign/return/call/method/struct-field/match/if-else）
- `format_human` 渲染 `= note:` 行，`format_llm` 输出 `notes` 数组
- 5 个新测试验证 notes 功能

**待做（后续迭代）**：
- 空集合推断失败 → 建议加类型标注
- Row poly 字段缺失 → 指向字段访问点
- Effect 不匹配 → 说明缺少的 effect + handler
- `--error-format=llm` 修复建议增强





### B-070 固定长度数组 `[T; N]` [feature] [P2] [M] [judgment] [queued]
栈分配固定长度数组，值类型语义。密码学、音视频、矩阵运算、协议头等场景必备。

```ring
let key: [U8; 32] = [0; 32]
let matrix: [F64; 16] = [0.0; 16]

fn dot<N>(a: [F64; N], b: [F64; N]) -> F64 {
    let mut sum: F64 = 0.0
    let mut i: USize = 0
    while i < N { sum = sum + a[i] * b[i]; i = i + 1 }
    sum
}
```

**语义**：
- 栈上分配，内联存储（值类型）
- 赋值 = memcpy（值语义，零 RC）
- 越界 panic（和 `List` 一致）
- `N` 为编译期整数常量（const generic 最简子集）
- `.to_list() -> List<T>`（拷贝到堆），`List.to_array<N>() -> [T; N]?`

**涉及修改**：
1. `parser.ring`：类型语法 `[T; expr]` 解析
2. `types.ring`：新增 `ArrayType { element: Type, length: I64 }`
3. `infer.ring`：const generic 参数追踪 + 常量求值
4. `codegen.ring`：JS 后端映射为普通 Array（语义近似）
5. `codegen_llvm.ring`：LLVM `[N x T]` 数组类型，直接映射

**验收标准**：
- `[U8; 32]` 类型可声明、初始化、索引
- `fn f<N>(a: [T; N])` const generic 可推断
- 越界 panic
- 值语义（赋值 = 拷贝）
- 全部 E2E 测试通过
- 自举编译器正常编译自身

**等式约束（2026-05-25，原 B-003 吸收）**：const generic 参数支持等式 unification——`fn zip<T, U, const N>(a: [T; N], b: [U; N])` 要求两个 `N` 相等，由 HM unification 自然处理。用户自定义类型的 const generics（如 `struct Mat<const M, const K>`）为远期扩展。

**前置依赖**：无
**复杂度**：M（Parser + Checker const generic + Codegen）

## 关联类型修复依赖序（audit 建议）

~~B-062（#124 约束验证）~~ ✅ → ~~B-063（#125/#128 delegate 转发）~~ ✅ → ~~B-064（#129 scope 区分）~~ ✅ → ~~B-058（#115 bound 验证）~~ ✅ → ~~B-065（#121 显示改善）~~ ✅

## LLVM 后端质量

### B-084 Perceus drop 精度 + drop_T 完整性 [bugfix] [P2] [L] [judgment] [doing]

带 RC pass 自编译暴露的 drop 精度问题，方向安全（泄漏，非 UAF），但拉高 native 内存峰值（G-a）并可能漏 drop。四块（原 audit #130/#131 + B-083 guard-false 残留归此）：

**1. #131 drop 落不了地**（`perceus.ring` drop 生成 / `codegen_llvm_stmt.ring` Drop emit）：带 RC pass 自编译报 **96 处** `[rc-warn] Drop: variable 'X' not found in named_values`——perceus 给某些变量插 `HStmt::Drop` 但 codegen 在 `named_values` 找不到 → 跳过（fail-safe 不崩，但漏 drop）。变量含通配符 `_`（不该 drop）及大量真实局部（decl/ctx/f/body/span/arm/env/then_block/methods/hparams/expected_ret…）。修：(a) perceus 不对 `_`/已 move/模式绑定变量生成 drop；(b) 核对 named_values 作用域覆盖（destructure 绑定 + 嵌套作用域）。

**2. #130 闭包 env drop**（`ring_runtime.cpp:2043` drop_closure / `codegen_llvm_expr.ring:2647` gen_lambda env 分配）：env struct 复用 `RING_TYPEID_CLOSURE`（typeid 7，本是 `{fn_ptr,env_ptr}` pair），drop_closure 只 drop slot[1]，捕获指针不 drop → 泄漏。B-083 #1/#3 修了 perceus 对闭包捕获 emit dup，但 runtime 缺配套 drop。修：env struct 用独立 typeid + 按捕获布局生成 per-capture `drop_env_T`。

**3. drop_T 完整性核查**：runtime `drop_tuple` 是 no-op（L0 简化，靠 codegen 生成 per-type drop_T）。需核查每个 StructType/EnumType/TupleType + 单态化泛型实例都生成并注册了正确布局的 drop_T，否则 fields 漏 drop。B-082 的 rc-warn 是发现面。

**4. guard-false 边 pattern 绑定泄漏**（B-083 残留，2026-06-03）：带 guard 的 arm，其 pattern 绑定若被 body 用到会为 body dup，但 guard 为假 fall-through 时 body 不跑 → 该 dup 泄漏。B-083 为消除 UAF 选了保守安全策略（match 消费变量跨 guard fork 全程 dup 不 move），代价即此泄漏。需在 HIR 给 guard-false 边加 drop slot 才能根治。纯泄漏无 UAF，差分测试（比输出非内存）抓不到。

**涉及修改**：
1. `compiler/perceus.ring`：drop 生成排除 `_`/已 move/模式变量；guard-false 边 drop slot
2. `compiler/codegen_llvm_stmt.ring`：named_values 覆盖 destructure/嵌套作用域绑定
3. `ring_runtime.cpp`：closure env 独立 typeid + per-capture drop
4. `compiler/codegen_llvm_expr.ring`：gen_lambda env 用新 typeid
5. `compiler/codegen_llvm*.ring`：核查 drop_T 对所有 allocatable 类型（含单态化泛型）生成

**验收标准**：
- 带 RC pass 自编译 rc-warn 数降为 0（或只剩明确正确的豁免）
- 闭包捕获值在 env drop 时正确释放（per-capture）
- 所有堆分配类型有注册的正确 drop_T
- 全部 E2E + llvm_diff 通过；自举一致

### B-085 Perceus 发射 determinism（双 bootstrap 字节级一致）[bugfix] [P2] [S] [judgment] [queued]

`perceus.ring:1633 make_drop_list` 对 `Set<Str>` 直接 `for name in names` 生成 drop，**不排序**。JS 后端 Set 是插入序（确定），LLVM 后端 Set 是 `std::unordered_set`（hash 序）——两后端迭代序不同。当某点 drop 多个变量（Set size > 1）时，native 编译器与 JS 参考编译器生成的 drop 顺序不同 → IR/.o 字节级不一致 → 破坏 G-b 双 bootstrap。注：drop 顺序不影响**行为**（正确性上可交换），只影响字节一致——不阻塞 G-c。

**涉及修改**：
1. `compiler/perceus.ring`：`make_drop_list`（及任何从 Set 迭代生成发射的点：dup 列表、branch-balancing 的 difference 迭代）对变量名排序后再发射
2. 排查 perceus 是否还有其他依赖 Set/Map 迭代序的发射点

**验收标准**：
- perceus 发射的 drop/dup 顺序只依赖变量名（确定），不依赖 Set 迭代序
- 同源 + 同 args 下 native 编译器与 JS 参考编译器对同一输入产出字节一致（drop 序部分）
- 全部 E2E + llvm_diff 通过

### B-086 LLVM 缺失 runtime 原语 — find_index / fold [feature] [P2] [M] [judgment] [queued]

> **flat_map ✅ 已完成**（commit a93b19c）：补 `ring_list_flat_map` + 差分用例 `tests/cases/llvm/list_flat_map.ring`，JS/LLVM 一致。
>
> **enumerate / to_int / to_float 撤出本项**：Worker 核查发现 Agent D 审计有误——这三个方法 checker **根本没注册**（`.enumerate()/.to_int()/.to_float()` 在两后端都 E0305 "no method"，JS oracle 自己就拒绝），codegen 映射是死映射，无法做差分测试。是否给 Ring 加这三个方法是**设计决策**（见 worker_feedback），决策前不实现；已撤回它们的 runtime stub。

**真正剩余的 E2E-阻塞 gap**：`find_index`（List）和 `fold`（List）—— 两者在 JS 后端是真 builtin（E2E 用、能跑），但 LLVM 后端**既没 codegen 映射也没 runtime**。它们阻塞验收 E2E `list_flat_map.ring`（用 find_index）和 `list_method_chain.ring`（用 fold）在 native 跑通。dispatch 升级为 judgment——需改编译器源码（要 rebuild dist）+ runtime + 差分。

**涉及修改**：
1. `compiler/codegen_llvm_expr.ring`：方法映射加 `find_index` → `ring_list_find_index`、`fold` → `ring_list_fold`（以 JS 后端语义/签名为 oracle）
2. `ring_runtime.cpp`：实现 `ring_list_find_index` / `ring_list_fold`（参考 `ring_list_find` / `ring_list_for_each` 的 closure pattern）
3. `tests/cases/llvm/`：find_index / fold 差分用例
4. rebuild dist（改了编译器源码）

**验收标准**：
- `list_flat_map.ring` / `list_method_chain.ring` 在 LLVM 后端通过
- find_index / fold 差分用例 JS/LLVM 一致
- 全部 E2E + llvm_diff 通过；自举一致

### B-087 LLVM codegen 双后端 parity 修复 [bugfix] [P2] [L] [judgment] [queued]

编译器自身不触发故自编译字节级一致，但特定模式下 LLVM 后端与 JS oracle 发散，阻塞 G-c 双后端 parity。**方法论**：B-088 的差分用例复现发散 → 在此修。**已亲自核实**的 gap：

- **dict_closure_dicts 不处理**（`codegen_llvm_expr.ring:107` gen_ident 签名只收 name/resolved_name，`dict_closure_dicts` 被 `..` 丢）：多态函数标识符作为一等值带 dict 包装时，LLVM 不生成 wrapper → 调用签名错。JS 见 `codegen_expr.ring:38-62`。
- **DictRef::Wrapped 返回 null**（`codegen_llvm_expr.ring:794-797` 自承认 TODO "pass null — future wave"）：嵌套/wrapped trait dict 派发拿到 null → 方法派发错。
- **closure 捕获 dict/evidence 参数**：`collect_captures` 不收 dict_params/evidence params，多态闭包可能丢 dict。
- **range 变量 for-in**（`codegen_llvm_stmt.ring:322-340` 有 fallback 注释，struct GEP 不全）：`for x in range_var` 可能错。
- **#103 mut 参数统一 boxing**（已 audit-tracked，原 deferred-LLVM）：JS 对值类型 mut 参数 box `.value`，引用类型靠 JS 引用语义；LLVM 需所有 mut 参数统一指针-to-box，否则重赋值不反映调用方。此处一并落地，解除 deferred 状态。

- **待 B-088 差分确认后再修**（Agent 报告 hedged，未亲核）：if-let 复杂模式、tuple 内字面量模式 unbox、handler resume 捕获、HOF 方法闭包传递。

**涉及修改**：
1. `compiler/codegen_llvm_expr.ring`：gen_ident 处理 dict_closure_dicts；DictRef::Wrapped 构造真实 wrapper；collect_captures 收 dict/evidence；mut 参数 boxing
2. `compiler/codegen_llvm_stmt.ring`：range 变量 for-in 完整 GEP；mut 参数指针传递
3. 按 B-088 差分结果补修确认的发散

**验收标准**：
- 上述确认 gap 的差分用例 JS/LLVM 一致
- 多态/泛型/trait dispatch 的非平凡用例（含一等多态函数值、嵌套 trait bound）native 行为与 JS 一致
- #103 mut 参数重赋值在 LLVM 反映到调用方
- 全部 E2E + llvm_diff 通过；自举一致

### B-089 Native 自举终验 capstone [bugfix] [P1] [L] [judgment] [queued]

> **阻塞中**：依赖 B-083/B-084/B-085/B-086/B-087/B-088（+ B-002 若内存实测需要 abort-unwind）全部落地 + 大内存机（no-GC 基线 25.9GB）。

合 B-012 遗留的两条验收 + 内存门。三门：
- **G-a 内存**：带 RC pass 自编译，内存峰值降至机器可运行（验证 RC 有效）
- **G-b 双 bootstrap**：native 二进制重编译编译器，与参考产出字节级一致（依赖 B-085 determinism）
- **G-c parity**：native E2E + llvm_diff 全过，行为与 JS oracle 一致

**验收标准**：
- 带 RC pass native 自编译跑通且内存峰值 << 25.9GB
- double-bootstrap 字节级一致
- native E2E + llvm_diff 全过
- 全过后：CLAUDE.md 标 native 自举完成，启动 JS 后端归档 + 层 3

> fix-forward：跑通过程中暴露的新泄漏/发散就地开 audit/backlog，不预设"全绿才动"。

### B-078 清理 B-066 parser workaround（string literal → import）[refactor] [P3] [S] [mechanical] [queued]
`parser.ring:998` 仍用 string literal `"W0001"` 而非 `import codes::{W0001}`，这是 B-066 实现时因 B-077 跨模块 const bug 而采用的 workaround。B-077 已修复，应改回正常 import。

**涉及修改**：
1. `compiler/parser.ring`：将 `"W0001"` string literal 改为 `use codes::{W0001}` + 直接引用 `W0001`

**验收标准**：
- `parser.ring` 不再使用 string literal 绕过 const import
- Double-bootstrap 正常通过
- 全部 E2E 测试通过

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

### Dependent Types Lite（B-003）
取消原因：功能与 Refinement Types（B-001）+ Const Generics（B-070）完全重叠。"依赖类型"的三个核心能力——值参数化类型（= const generics）、等式约束（= const generic unification）、值谓词约束（= refinement on const params）——已分别归入 B-070 和 B-001。不引入"依赖类型"概念，降低用户认知负担。

### Full Algebraic Effects（B-009）
Post-resume handler + multi-resume。取消原因：tail-resumptive + abort 覆盖 95%+ 实际需求，剩余用例用 async effect + defer 解决更好。实现复杂度（delimited continuation + 资源安全）与工程价值不成比例。

---

> 本文档随 Phase 推进更新。每个 Phase 启动时，从此处挑选特性进入该 Phase 的 spec。
