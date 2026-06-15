# Backlog

> 活的工作看板。做完的条目删除，只在 git commit message 留记录。
> 条目格式：`### B-xxx <标题> [类型] [优先级] [复杂度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`queued` → `planning` → `doing` → 删除
> 反馈分支：`doing` → `waiting-feedback`（Worker 遇到设计问题）→ Discussion 处理后 → `queued`（重新排队）
> 工作流规范见 `docs/workflow.md`

## Phase C 执行计划 （2026-05-23 确定）

**目标**：基础设施特性 + 中等特性全部完成，为层 3 重型特性铺路。

**已完成（2026-05-23→06-05，明细见 git）**：层 1（B-034/B-005/B-037/B-008）+ 层 2（B-004/B-036/B-010）+ 设计验证（B-043/B-044；B-042 吸收——设计在 design.md §7.9 定案 `Weak<T>`，实现归 B-002 L2）+ 关键路径 B-011 LLVM → B-012 RC L0 → B-082 RC 诊断 → B-081 dup 架构迁移 全部落地。

**现状 / 未完成项**：
- **当前目标：native 自举 + E2E + 双后端行为对比全过**（见下「Native 自举路线图」与「⭐ native on-par 统一规划」）
- B-068 Borrow-by-default 参数传递模型 [L]——**引擎部分已拆出为 B-098（✅）**；B-068 缩减为用户面（`fn(move T)` 语法 / lv2 标注 / fmt 策略 / pub 规则），仍 deferred、不阻塞 native（**无独立条目**——模型见 design.md §7.2-7.8，B-110 落地后再立项）
- **订正（2026-06-04，#134 证伪）**：「L0 owned-everywhere 即可自举」的原假设错误——L0 对「循环内条件 move」是 double-free（崩溃，非泄漏）。借用推断引擎（B-098）被提前到 native-working 之前并已落地
- B-033 GADTs 推迟至 native 自举之后（无下游依赖）
- 层 3 在 native 自举 + 归档后启动。**排序（2026-06-05 Discussion 定）**：B-002 Drop/RAII(L2) → **async(B-007) 先**（设计已锁、自包含、风险低、宣发价值大）→ Refinement(B-001) 随后（需 Z3 + 先做 B-070 const generics）；M 项（B-072 Union / B-069 默认参数 / B-070 固定数组）当 XL 间换气穿插；P3 研究（GADTs/dyn/GATs）最后。B-002 的 abort-unwind 子集可能因 G-a 内存提前（B-104 ✅，G-a 终态已达；abort 路径泄漏已入 D2 豁免类，design-accepted）
- **LLVM 落地后 JS 后端归档**（策略见 B-100，非简单废弃——先证 parity + golden 快照）

### Native 自举路线图（2026-06-03 规划，2026-06-13 更新）

三个验收门：
- **G-a 内存** ✅：B-104 完整 Perceus RC 落地（2026-06-13），leak 88%→1.2%，native 自编译跑通
- **G-b 双 bootstrap 一致**：待 B-089 emit 排序确定化（B-122 SCC 拓扑序 ✅ + B-136 generalize/codegen Set 排序 ✅）
- **G-c 双后端 parity**：待 B-089 native E2E + llvm_diff 全量

铺垫已全部完成（明细见 git）。**当前关键路径**：B-089（Level 1 终点）→ B-099（Level 2）→ B-100（JS 退役）。详见上方「⭐ native on-par → JS 退役 统一路线」。

---

## ⭐ native on-par → JS 退役 统一路线（2026-06-08 定，2026-06-13 更新）

> **现状（2026-06-13）**：B-104 完整 Perceus RC **✅**（G-a 三门通过）+ B-080 标记指针 **✅**。P0/P1 阶段完成。

**Level 定义**：
- **Level 1** = B-089（B-122 ✅）：native ring.exe 的前端 + JS 后端与 node 版对等，三门全绿。
- **Level 2** = B-099：native 自产 .o、Node 从工具链消除。
- **JS 退役** = B-100：parity 认证 + golden 快照 + 删 JS 后端。层 3 之前完成。

**执行序（2026-06-13 Discussion 拍板）**：

| 阶段 | 内容 | item | 并行 |
|------|------|------|------|
| **✅ P0+P1** | 完整 Perceus RC + 标记指针 | B-104 ✅ + B-080 ✅ | — |
| **✅ P2a checker 健全** | 顶层推断改 SCC 拓扑序 | **B-122** ✅ | — |
| **P2b 三门终验** | G-a/G-b（含 emit 排序确定化）/G-c | **B-089** [P1/L] | + B-097 [P2/M] + B-096 [P3/L] |
| **P3 Node 消除** | LLVM-C marshalling + link libLLVM | **B-099** [P2/XL, deferred:B-089] | 单独 |
| **P4 JS 退役** | parity 认证门 + golden 快照 + 删除 | **B-100** [P3/L, deferred:B-099] | 单独 |

**纪律**：每阶段验收全绿才进下一阶段。B-097/B-096 不阻塞主链路但是 B-100 Phase 1 前置，与 B-089 并行消化。

---

## 类型系统


### B-001 Refinement Types [feature] [P2] [XL] [judgment] [queued]
design.md 1.2。类型附带谓词，编译期静态验证 + 运行时检查兜底。

```ring
type Positive = Int where it > 0
type Email = Str where it.matches(r"^[^@]+@[^@]+\.[^@]+$")
fn divide(a: Float, b: Float where b != 0.0) -> Float { a / b }
```

- **当前状态**：struct-field 位 `where` 可解析（tokens 消费后丢弃，W0002 warning）；**参数位 `where`（`fn f(x: Int where x > 0)`）连解析都未实现——硬 parse error E0103（2026-06-11 实测核定）。参数位 parser 支持归本项，不单独先行**（先做解析又只丢弃 = 再造一个「写了不生效」的静默面，正是公理 1 违例的制造机；2026-06-11 用户拍板）。checker 验证未实现
- **前置依赖**：Phase B 模块系统稳定后启动
- **复杂度**：极大（SSA 约束传播 + 可选 Z3 集成）
- **优先级**：Phase C 首要
- **交互规则（B-043 决策）**：refinement 是值级谓词，不允许引用可变绑定；跨 effect/await 边界恒成立；handler resume 值须满足 refinement 约束；`mut` 参数带 refinement 时每次赋值重新验证（SSA 流分析，复杂度归入本 item）。详见 design.md 1.5
- **可判定片段条款（2026-06-12 D-5 拍板，公理⑤做实）**：SMT 查询限于**具名可判定片段**（QF_LIA + enum/bool 等式类，Liquid-style；具体片段定义 = lang-design §10 TODO「Refinement types 的可判定片段定义」，实现前必须完成）；超出片段 = 编译错误，要求显式 runtime check 兜底。**禁止 timeout 语义**——SMT timeout 即「耗时不可预期」，违反公理⑤
- **含 const generic 参数谓词**（2026-05-25，原 B-003 吸收）：refinement predicates 作用于 const generic 参数（如 `where N > 0`）归入本 item 的 SSA 约束传播。详见 design.md 1.3

### B-002 Ownership + Drop（Rust 风格 RAII，无 borrow checker）[feature] [P2] [XL] [judgment] [queued]
Rust 的所有权模型减去 borrow checker。编译器做数据流分析追踪值的所有权，确保 Drop 恰好执行一次。

> **Perceus 分层角色 = L2**（见 §7.10 / B-012）：在 L0 RC 核心（B-012）之上实现用户 `impl Drop` + 正常/abort/cancel 全路径 RAII。**两个并入项**：(1) fail/catch 从 setjmp/longjmp 切换到 **drop-aware unwind**（longjmp 会跳过 drop → 改成栈展开时逐帧 drop）；(2) `Weak<T>` 库类型实现（`Rc.downgrade()` + `.upgrade() -> T?`，循环引用解法，设计见 §7.9）。
>
> **#2 TryCatch / handler abort 的 abort-unwind drop 泄漏并入本项（2026-06-03 决策）**：try body 中途 `fail.raise`（经 `ring_try` longjmp）绕过正常 drop 序列，已分配局部值 + 未调用的 resume 闭包 + handler param 捕获全泄漏（方向安全）。perceus 静态 pass 插不进 longjmp 边——必须靠上面的 drop-aware unwind 在栈展开时逐帧 drop。涉及 `perceus.ring`（TryCatch/HandleExpr 分支）+ `ring_runtime.cpp`（ring_try/raise unwind）+ codegen_llvm。影响 G-a 内存 + G-c 正确性。原 B-083 #2 退回后归此。

**模型**：
- 所有值 scope 结束自动 drop（RAII，正常路径 + abort 路径均自动）——**scope-end 即语义**（2026-06-12 D-1 拍板，公理⑥/design.md §7.11 as-if 条款）：带 Drop impl 或被 `Weak<T>` 指向的类型禁止引擎提前 drop，纯数据类型引擎可在不可观测前提下提前
- Move 语义：赋值/传参 = move，move 后原变量不可用
- `impl Drop` 的类型禁止 `impl Clone`（编译器拒绝，资源不可复制）
- `drop(x)` 提前释放，`leak(x)` 显式逃逸（不触发 Drop）
- `mut self` 方法 = 隐式借用（不消耗所有权）
- 共享访问 → `Rc<T>`（Ring 等价物），Rc 可 Clone，内部资源 Drop 在 Rc 归零时触发
- 无 `linear` 关键字——`impl Drop` 是唯一的 ownership 入口
- 容器持有 Drop 类型值 → 容器 Drop 自动 drop 所有元素，容器自身不因此获得 Drop 约束
- **析构顺序（2026-06-13 拍板 = 对齐 Rust）**：同 scope 逆序 / struct 字段声明序 / 容器元素序，对齐 Rust。两后端一致并入差分回归

**LLM 友好性**：本质是 Rust move/drop/RAII 语义，LLM 从 Rust 训练数据天然理解。自动浮现路径：LLM 正常写代码 → move 后使用原变量 → 编译器报 "value moved" → LLM 修。无新概念。

- **前置依赖**：`mut<S>` 稳定
- **复杂度**：大（ownership checker + Perceus RC 的前置条件）
- **优先级**：Phase C 与 refinement 穿插
- **交互规则（B-043 决策）**：RAII 模型——Drop 值在 abort/cancel 路径自动释放；Drop::drop 禁止 fail effect（允许 io）；spawn 为 move 语义，不可跨任务共享 Drop 值；`mut self` 调用 = 隐式借用（不消耗）。详见 design.md 1.5



### B-110 Move 语义补完：use-after-move checker + 可变别名收口 [feature] [P2] [L] [judgment] [queued]

> 2026-06-11 立项（Discussion，Fable 全面审视）。**Mutable aliasing 语义拍板 = move 补完**，详见 design.md §7.5「强制状态」+ 决策表。背景：三真值源分裂——实现 = 引用语义（两后端，`let ys = xs; xs.push(3)` 后 ys 可见 3 元素，已核实 checker 无任何 use-after-move 检查、runtime 无 COW）、设计文档 = move（§7.5）、Koka 血统 = 值语义+COW——且无任何测试锁定任一。已否决引用语义追认（`mut<T>` 系统性失真、aliasing bug 类对无人回路永久开放）与值语义+COW（编译器自迁移是静默行为变化、JS oracle 无 RC 表达不了 COW）。

**涉及修改**：
1. checker：新增 use-after-move pass——复合类型绑定在「赋值给新绑定 / 存入 struct 字段 / 容器 insert / return 局部 / 跨 spawn 闭包捕获」后标记 moved，后续使用报编译错误（E07xx，`--error-format=llm` 含 `let ys = xs.clone()` 修复建议）。值类型（标量）auto copy 不受影响；Str 是否豁免（不可变值语义）实现时核定。
2. checker：句法禁止同一调用中同 lvalue 同时作 borrow 与 `mut` 实参（`f(xs, mut xs)`）——无 borrow checker 下唯一的别名洞。
3. 测试：aliasing 语义 E2E——判定程序 + 字段存储 + 容器 insert + spawn 捕获各一例断言编译错误；`.clone()` 后独立性正常路径（趁 JS oracle 在世双后端跑）。
4. 编译器自身迁移：use-after-move 错误即迁移清单——不可变共享改 `.clone()`（运行时=免费 dup），共享可变站点改 mut 参数线程化。**首步先跑 checker 统计错误数再定波次**，量大则回报拆分。
5. **投影绑定堵缝（2026-06-11 增补，COW 不可观测原则，见 design.md 决策表）**：`let item = xs[i]`（IndexExpr/FieldAccess 源的绑定）后对 item 写入，在 dup+COW 下会静默 detach（写副本不写原件）——use-after-move checker 不触发、行为静默变化，**原则已拍：不得静默分叉，必须响**。堵法 = (a) 写从投影绑定出的复合值 = 编译错误（与 use-after-move 同级）+ (b) 嵌套 lvalue path 官方化承接 + 测试锁定。**实测（2026-06-11 Discussion，两后端核实完毕）**：
   - **FieldAccess 为根的嵌套左值已全链工作且两后端一致**：`pts[0].x = v`、`w.p.x = v` 原地改——(b) 的主体已存在，缺测试锁定（补 E2E + llvm_diff）。
   - **IndexExpr 为根、receiver 非 Ident 的赋值两后端双崩**：`grid[0][1] = v`、`bag.items[1] = v`——JS codegen 产**非法 JS**（运行时 ReferenceError，产物级 bug），LLVM codegen 编译期 panic `unsupported assignment target`。修复归本条：按堵缝方案要么 emit set 路径递归化支持、要么 checker 显式报错，**不允许维持产非法 JS 现状**。
   - **投影绑定写穿透实锤**：`let mut item = pts2[0]; item.x = 99` → 原件同变（IndexExpr/FieldAccess 源、两后端一致）——B-110 落地时该模式必须按 (a) 报错，否则 COW 下语义静默反转。

**范围边界**：参数 move 推断（§7.3，callee 消耗实参 → caller use-after-move 传播）**不在本项**——参数维持 borrow-default，调用永不消耗实参（spawn 闭包捕获除外）；归 B-068/后续。本项纯 checker 层，不改 RC 行为——Perceus escape-clone 在 move 强制后成为可优化冗余（last-use move），留 L3。

**与现有项关系**：B-068（move 标注/lv2/fmt 文档化）的语义前置；B-002（Drop/RAII）依赖本项 move 基础设施。

**验收标准**：
- 判定程序与四类逃逸位置 use-after-move 全报编译错误，含 clone 修复建议；`f(xs, mut xs)` 编译错误
- 编译器自身（31 文件）在新 checker 下编译通过（迁移完成）+ double bootstrap 一致
- JS 全量 + llvm_diff 全绿

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

**match 语法（2026-06-15 拍板）**：Union = 匿名 enum，variant 名 = 类型的非限定名，match 语法与普通 enum 完全一致（`Str(s) => ...`）。消歧规则：同名类型冲突时（如 `io.Error | parse.Error`）要求用户写具名 enum，不支持匿名 union 含同名 variant

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

### B-007 `async` Effect + 结构化并发（设计已确定 2026-05-23）[feature] [P2] [XL] [judgment] [queued] [deferred: B-116]
async 作为 effect，handler 决定执行策略。Generator-based 实现（**JS 后端**），支持 sync handler（测试场景）。**native 实现模型未定——挂起超出 tail-resumptive 表达力 → 前置 B-116 design-probe（2026-06-11），probe 出方案后本 spec 补「native 实现策略」节再动工。**

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

### B-125 unsafe effect + `Ptr<T>` 原语全链路 [feature] [P3] [XL] [judgment] [queued]

> 2026-06-13 立项（Discussion，B-106 design-probe 正文拍定后的实现项，用户拍板 P3）。**设计真值 = design.md §7.12**（三栏总账 + unsafe effect 两级 discharge + `Ptr<T>` 形态 + 原语集 v1 + extern fn 声明处签字 + 跨界三件套）。**时序：B-104 落地后**（动 checker/effect/双后端 codegen，避免与 milestone 并发；同 B-117/B-118/B-121 约定）。

**涉及修改**：
1. Lexer/Parser：`unsafe { ... }` 块、`mod name requires {unsafe}`（复用 mod capability 语法）。
2. Checker/effect：内建 `unsafe` effect——原语操作产生、自动冒泡、不可被普通 handler 处理；块级 discharge（吸收块内 unsafe）+ 模块级许可检查（未声明模块内使用原语 = 编译错误）。
3. 内建类型 `Ptr<T>`：普通值语义（copy、不参与 RC——extern type 类型级排除规则推广：不 Clone/不 Drop/不入 owned）。
4. 原语集 v1（§7.12 表）：alloc/dealloc/read/write/offset(inbounds)/cast/copy/addr/from_addr。LLVM 后端为主战场；**JS 后端口径实现时定**（ArrayBuffer 模拟 vs llvm-only + 差分跳过），差分测试需明确口径。
5. extern fn 声明处签字：声明所在模块 `requires {unsafe}` 检查（现状 std extern 声明模块需批量迁移加声明——机械）。
6. `ring audit unsafe` 子命令：列全代码库 discharge 点（unsafe 块 + 模块许可 + extern 声明）。
7. Perceus/verify_rc：read 产 fresh owned / write 耗 owned 落 B-103 既有分类——预期零特殊化，验证之；verifier 对 unsafe 块内指针操作的豁免口径。
8. 字段投影（`@repr(C)` 门票，`offset_of` intrinsic vs 投影语法）：实现时定形态，可后置子项。

**验收标准**：
- 未 discharge 使用原语 = 编译错误（负面测试两类：无 unsafe 块 / 模块未 requires）
- 安全封装成立：Ptr buffer + len/cap 容器 demo 内部 unsafe、pub 签名纯净，E2E 行为正确
- read/write 所有权语义过 verify_rc 三判据；llvm_diff 全量 ×3（动 RC 纪律）+ ASan-clean
- `ring audit unsafe` 输出全部 discharge 点
- per-type 三件套（List/Str 的 as_ptr/from_raw_parts/into_raw_parts）可用且 E2E 覆盖

## 迭代与集合

### B-095 List.enumerate 方法 [feature] [P3] [M] [judgment] [queued]

> 2026-06-03 立项备忘，低优先（B-086 #1 决策）。当前拿索引迭代只能 `for i in 0..xs.len()` 再索引，啰嗦。enumerate 是高频糖但不阻塞自举（全代码库零调用），按需再做。与 B-094（清死映射）耦合：B-094 删了 LLVM 死映射，本项真做时需重新补齐 checker + runtime + codegen 全套。

`List.enumerate() -> List<(Int, T)>`：返回带索引的元素对。

**涉及修改**：
1. `compiler/builtins.ring`：注册 `List.enumerate` 方法签名 `(self) -> List<(Int, T)>`
2. `ring_runtime.cpp`：实现 `ring_list_enumerate`（构造 `(Int, T)` tuple 列表）
3. `compiler/codegen.ring`：JS 后端映射
4. `compiler/codegen_llvm_expr.ring`：LLVM 映射（恢复 B-094 删除的行）
5. `tests/cases/llvm/`：差分用例

**验收标准**：
- `for (i, x) in xs.enumerate()` 两后端可用且行为一致
- 全部 E2E + llvm_diff 通过；自举一致

### B-107 泛型 Map key（Hash trait + derive）[feature] [P2] [L] [judgment] [queued]

> 2026-06-07 立项（Discussion）。**类型系统说谎的缺口**：`std/map.ring` 的 `Map<K,V>` 类型层全泛型（`get(key:K)`/`insert(key:K,..)` 用类型变量 K），类型检查器放行 `Map<Int,T>`/`Map<MyEnum,T>`，但 runtime（LLVM `unordered_map<std::string,void*>`、JS 同样 Str-key）只兑现 Str key。非 Str key 静默错误，**两后端皆有，LLVM 上具体化**。bootstrap 阶段编译器自身的 Map 几乎全是 `Map<Str,...>` 故未暴露（migration diary 记录的简化）。

**设计方向**：加 `Hash` trait + derive，镜像现有 Eq/Ord/Clone/Debug 的 derive 机制；runtime Map 改为 key 为 void*，经 Eq/Hash dict 派发——**复用 `List.contains` 已走的 `ring_get_builtin_dict` 泛型 Eq 派发路径**。与 B-080（标量 unboxing）协同：Int unbox 后 hash Int key trivial。

**涉及修改**：
1. `compiler/builtins.ring` / `std/`：定义 `Hash` trait（`fn hash(self) -> Int` 或等价）；内置类型 + 用户 struct/enum derive。
2. `compiler/derive.ring`：Hash derive（同 Eq/Ord 模式）。
3. `ring_runtime.cpp`：Map key 从 `std::string` 泛化为 void* + 自定义 hash/eq（经 dict），或等价方案。
4. `compiler/codegen_llvm_*.ring`：Map 操作传 Eq/Hash dict（同泛型 Eq 派发）。
5. `compiler/codegen.ring`：JS 后端对应（非 Str key 正确处理）。
6. checker：`Map<K,V>` 的 K 要求 `K: Hash + Eq` bound（内置类型自动 derive）。

**验收标准**：
- `Map<Int,T>` / `Map<MyEnum,T>` / `Map<用户struct,T>` get/insert/contains_key 两后端行为一致且正确
- `K: Hash + Eq` bound 缺失时报错
- 现有 `Map<Str,...>` 全部不回归
- 全部 E2E + llvm_diff 通过；自举一致

### B-133 UTF-8 字节串模型落地（B-131 probe 拍板 A）[feature] [P3] [L] [judgment] [queued]

> 2026-06-15 立项（Discussion，B-131 design-probe 拍板 A = UTF-8 字节串 Rust 模型）。**设计真值 = design.md §1.7.1**（完整分析 + API 设计 + 迁移清单）。现状：design.md 写的 code point 语义两后端都没实现——LLVM 按字节、JS 按 UTF-16 码元；对 ASCII 两后端行为一致，非 ASCII 全失真。

**分阶段实施**（各阶段可独立提交，顺序依赖标注于下）：

| 阶段 | 内容 | 依赖 | 量 |
|------|------|------|----|
| P0 | design.md §1.7 表格修正 + CLAUDE.md 已知限制更新 | 无 | S |
| P1 | `ring_str_to_upper`/`to_lower` ASCII-only bug 修复（多字节 UTF-8 破坏） | 无 | S |
| P2 | 新增 `char_count()`/`chars()` 到 `std/str.ring` + 两后端实现 | 无 | M |
| P3 | JS 后端 `Str_len` 等改为字节语义 + `ring_str_slice` 加 UTF-8 边界检查 | P2 | L |
| P4 | `char_at`/`char_code_at` 命名决策（改 `byte_at`？）+ 实施 | P2 | M |
| P5 | 新增 llvm_diff 非 ASCII 测试用例（CJK + emoji + mixed） | P3 | M |
| P6 | `split("")` 改为 code-point 级拆分 | P2 | S |

**涉及修改**：
1. `ring_runtime.cpp`：修 `to_upper`/`to_lower`（ASCII-only 保留非 ASCII 原样）；新增 `ring_str_char_count`/`ring_str_chars`；`ring_str_slice` 加 UTF-8 边界 panic
2. `compiler/runtime.ring`（JS）：`Str_len` 改 `TextEncoder` 字节数；`Str_char_at`/`Str_slice` 等改字节级；新增 `Str_char_count`/`Str_chars`
3. `std/str.ring`：新增 `char_count`/`chars` 方法签名
4. `compiler/builtins.ring`：注册新方法
5. `tests/cases/llvm/`：非 ASCII 差分用例

**验收标准**：
- `"你好".len() == 6`（字节数）两后端一致
- `"😀".len() == 4`（字节数）两后端一致
- `"你好".char_count() == 2` 两后端一致
- `"你好".chars()` 返回 `["你", "好"]` 两后端一致
- 非 code-point 边界 `slice` → panic
- `to_upper`/`to_lower` 不破坏多字节 UTF-8
- 全部 E2E + llvm_diff 通过；自举一致


## 性能优化（愿景：语义驱动的编译优化）

> **核心论点**：Ring 的类型系统（effect + refinement + linear）不仅用于安全性，还为编译器提供其他语言没有的优化信息。性能是 Ring 的核心卖点之一——目标不是"接近 C++/Rust"而是在特定场景**超越**。
>
> 优化分两层：AOT（LLVM 编译期）和 JIT（运行时 PGO），很多优化两层都可以做。
> 前置依赖链：LLVM backend → Perceus RC → 各项优化 pass → JIT（远期）。

> **B-011 LLVM Native Backend 已完成（2026-06-01）** — 前端自举打通：ring.exe 单文件产出与参考编译器字节级一致，多模块端到端跑通，所有 codegen bug + fail/catch 已修（见 `tests/cases/llvm/` 回归套件）。**完整 native 自举的剩余两条验收（二次自举一致性 + native E2E 全过）受内存墙（25.9GB，no-GC）阻塞，已并入 B-012——Perceus RC 是解锁它们的唯一路径。**

### B-079 Perceus Reuse Analysis / FBIP (L3) [feature] [P3] [XL] [judgment] [queued]
就地复用分析（functional but in-place）：`rc == 1` 时 match 解构 + 同尺寸重构 → 就地改写，drop-reuse 配对消除分配。Perceus 的性能核爆点（函数式写法零拷贝：list map、tree rebalance/insert）。含 reuse specialization（为有/无 reuse token 特化函数）+ COW（`rc > 1` 时 clone-on-write，内部优化非用户可见语义）。
- **前置依赖**：B-012（L0 RC 核心）
- **参考**：Koka Perceus reuse pass
- **合法性边界（2026-06-12 D-1 拍板）**：last-use drop / 重用仅限「无用户 Drop impl 且非 `Weak<T>` 目标」的类型（as-if 条款，公理⑥ / design.md §7.11）；Weak 目标与带 Drop 类型钉死 scope-end，不得重用
- **验收**：典型 FBIP 模式（list map/filter、tree insert）生成就地改写而非新分配；基准显示分配数下降；全 E2E + `llvm_diff` 不回归；自举一致；Weak/Drop 用例在 reuse 启用前后输出一致（D-1 锚点）



### B-119 公理⑤做实：推断 fuel 上限 + trait instance 终止性审计 [design-align] [P3] [M] [judgment] [queued]

> 2026-06-12 立项（D-5 拍板，公理⑤「做实条款」①③）。公理⑤承诺「耗时可预期」与「当前系统全部可判定」，两处缺工程兜底/证据。

**涉及修改**：
1. **trait instance 终止性审计（probe 部分，先行）**：核查 checker 的 trait resolution（`trait_impls` 查找/递归 bound 解析）对 `impl Foo for T where Bar<T>: Foo` 类自引用 impl 是否会无界递归——有 Paterson 式结构递减条件或深度上限则记录证据入 lang-design；没有则构造最小复现（负面测试）。
2. **fuel/深度上限（实现部分，依审计结论定范围）**：推断与 trait resolution 加深度/迭代上限，超限 = 编译错误（E 码 + 提示加标注兜底），不允许卡死或不可预期耗时。上限值取「真实代码永不触发」量级（参考 Rust recursion_limit=128）。
3. 负面测试：爆炸/递归构造案例报错而非挂起（带 timeout 的测试 harness）。

**验收标准**：
- 审计结论成文（lang-design §6 或 §10）：终止性有证据，或修复后有上限
- 病态构造（自引用 impl / 深嵌套 let-多态）编译器在上限处报错退出，不挂起
- `npm test` 全绿，无现有代码触发上限

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

**不做的控制力**（2026-06-11 订正：unsafe 两行旧立场撤销，见 design.md §7.12 unsafe 区域图景）

| 机制 | 状态/原因 |
|------|-----------|
| 原始指针 / 手动 malloc | **安全区不做；unsafe 区提供**（§7.12 三栏总账；原语集已拍定 §7.12「B-106 正文拍定」，实现 = B-125）|
| `unsafe` 块 | **改做**——`unsafe` effect + 两级 discharge（`mod requires {unsafe}` + `unsafe {}`，关键字与 Rust 一致），§7.12 |
| 手动 SIMD intrinsics | 不可移植，由编译器 + hint 处理 |
| 无 RC 模式 | 和 Perceus 架构冲突 |

## 工具链

### B-016 LSP 移植 [feature] [P2] [L] [judgment] [queued]
原 TS 实现未移植到 Ring 自举编译器。需要重新实现。

- **当前状态**：VSCode 插件仅提供语法高亮
- **前置依赖**：无硬依赖（但 formatter 完成后 LSP 可复用其 AST 处理）
- **复杂度**：大
- **优先级**：Phase B 之后，用户需求驱动


### B-018 Debugger [feature] [P3] [L] [judgment] [queued]
source-map 支持 + 断点调试。

- **前置依赖**：LSP
- **复杂度**：大
- **优先级**：Phase D/E

### B-111 LLM eval harness：核心赌注测量仪 [feature] [P1] [L] [judgment] [queued]

> 2026-06-12 D-7 拍板：P2→P1——层 0 判据（公理④）的测量仪，地位等价公理⑥的 B-089 锚点；只改优先级，不动排程（B-104 里程碑照旧先行）。
> 2026-06-11 立项（Discussion）。design.md §11.3 五指标至今零测量——「LLM 写 Ring 优于 TS」是项目存在理由，须从信念变数据，且结果反向校准语言面特性优先级（哪类 papercut 真烧 token）。拍板：**对照组 TS only**；**题目从既有 benchmark（HumanEval/MBPP 风格）改编**（防自选偏差，题目分布不由我们控制）。

**形态（MVP）**：
1. **任务集**：15–25 题（字符串/数据变换/小算法/小 CLI），每题 = 自然语言 spec + 隐藏测试套件 ×（Ring + TS）。改编只替换语言表面（std API 名），不改任务实质。
2. **Ring primer**（关键产物，独立价值 = 未来所有 LLM 的标准 onboarding 文档）：~1–2K token 语法速查 + std 签名表。harness 喂 primer——「零训练数据 + 签名即够」是命题本身。
3. **驱动循环**：headless 驱动被测模型——生成 → 编译（Ring 用 `--error-format=llm`；TS 用 tsc）→ 错误喂回 → 重试（上限 N 轮）→ 跑隐藏测试。两语言协议完全相同；每题 ×3 取均值压噪音。
4. **指标**：首次编译通过率 / 到绿轮数 / 隐藏测试运行时错误率 / 总 token（design.md §11.3 前四项）。
5. 被测模型 Sonnet 级（平均 agentic 代表 + 便宜可多跑；顶级模型硬实力会掩盖语言差异）。放 `eval/`，手动触发，不进 CI（烧 token）。

**验收标准**：
- ≥15 题 × 2 语言 × 3 重复跑通，产出指标对比报告
- Ring primer 成文且被 harness 实际使用
- 失败案例归类（语法迁移 / 类型 / effect / std API），形成修缮清单回流 backlog

## 设计验证（Stabilize 前置）

> 非实现任务，而是设计探针。在对应 XL 特性实现前完成，防止特性交互导致事后 breaking change。

### B-116 async native 实现模型（B-007 前置 design-probe）[design-align] [P3] [M] [judgment] [queued]

> 2026-06-11 立项（Discussion）。**design-probe，非实现项**。已锁「handler 仅 tail-resumptive + abort」，但 §8 async 需要**挂起**——tail-resumptive 表达不了。JS 后端靠 generator（V8 代做挂起）；native 无答案。B-007（XL）动工前必须先定实现模型。**用户拍板：不预置倾向，probe 中性评估三候选。**

**要回答的设计问题**（三候选，差异 = 挂起在哪层实现）：
1. **Stackless 状态机/CPS（Rust/C#/Koka 路线）**：codegen 把含 async effect row 的函数编译为状态机。核实：与 Perceus 的交互（跨 await 局部搬进状态 struct 如何改写 drop 位置）、effect-多态 HOF 是否需 sync/async 双版本编译、工程量级。
2. **Stackful fiber（Go 路线）**：每任务用户态栈，await = 栈切换。核实：Windows fiber/ucontext 可行性、固定栈预算（`mut` 参数传 caller alloca 指针 → 栈搬迁疑似被锁死，需证实）、FFI 重入、万级 vs 十万级任务上限。
3. **线程池 + 阻塞 await**：是否值得作 (1)/(2) 前的垫脚石交付（结构化 scope + cancellation token 可先行）。
4. 共同项：§8.2 取消语义（cancel-at-await、两 await 间同步代码完整执行）在各模型下的实现；结构化并发 scope 运行时形态；与 tail-resumptive evidence passing 的共存。

**产出**：design.md §8 增「native 实现模型」节（决策 + 否决理由）+ B-007 spec 更新 + 解除 deferred。

**验收标准**：
- 三候选关键风险点逐条**核实**（非纸面比较）：Windows API 可行性 / Perceus 交互 / FFI 边界
- design.md 记录决策；B-007 spec 含选定模型的实现策略


## 语法增强


## 已知 Bug / 技术债


### B-139 impl method effect 传播 E2E 测试 [bugfix] [P3] [S] [mechanical] [queued]

> 2026-06-15 立项（Discussion，Wave A 通知 #1）。B-138 impl SCC 排序已落地（triple bootstrap 验证），但 spec 要求的独立 E2E 测试未加。补一个 `impl_method_effect.ring` 锁定 impl 内方法 effect 传播（非环依赖场景：callee 的 effect 正确传播到 caller）。

**涉及修改**：
1. `tests/cases/impl_method_effect.ring`：impl 内方法 A 调方法 B（B 有 fail effect），验证 A 推断出 fail effect

**验收标准**：
- 测试锁定 impl 内非环依赖方法的 effect 传播
- 全部 E2E 通过

### B-140 多段相对路径导入丢失中间段 [bugfix] [P3] [S] [judgment] [queued]

> 2026-06-15 立项（Discussion，Wave A 通知 #4，B-126 执行中发现的 pre-existing bug）。`resolve_mod_uses()` 在 `infer_decl.ring` 中，`use super::a::{do_thing}` 路径 `["super", "a"]` 会丢失中间段 `"a"`，解析为 `"do_thing"` 而非 `"a::do_thing"`。多段相对路径导入可能静默查找错误名字。

**涉及修改**：
1. `compiler/infer_decl.ring`：`resolve_mod_uses` 路径拼接逻辑修复，保留中间段

**验收标准**：
- `use super::a::{Foo}` 正确解析为 `a::Foo`
- 负面测试：错误路径报编译错误而非静默绑定错误名字
- 全部 E2E 通过；自举一致

### B-129 Map/Set for_each llvm_diff 覆盖 [bugfix] [P3] [S] [mechanical] [queued] [deferred: B-089]

> 2026-06-15 立项（Discussion，#152 worker 通知 #3）。#152 HOF 内存泄漏修复中 Map/Set for_each drop 修复未入 llvm_diff 回归——两后端迭代顺序不同导致 diff 必然失败。B-089 G-b 排序确定化完成后迭代序一致，可补覆盖。

**涉及修改**：
1. `tests/cases/llvm/`：新增 Map for_each / Set for_each 差分用例，验证 HOF 内 drop 正确性（排序确定化后两后端输出应一致）

**验收标准**：
- Map for_each + Set for_each llvm_diff 用例两后端输出一致
- 全部 E2E + llvm_diff 通过





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

### B-054 Parser expression-level 错误恢复 [feature] [P3] [M] [judgment] [doing]
Parser 有声明级错误恢复，但 `handle...with` 等复合表达式无恢复机制，单个 malformed 表达式会 poison 整个声明的解析。

**涉及修改**：
1. `parser.ring`：在 `handle`/`match`/`if` 等复合表达式解析失败时，尝试跳到 `}`/`)` 等闭合 token 恢复

**验收标准**：
- malformed `handle` 表达式不阻止后续声明的解析
- 错误报告质量不下降
- 全部 E2E 测试通过


### B-056 闭包捕获 `let mut` 变量时注入 `mut<T>` effect [feature] [P3] [M] [judgment] [queued]
B-048 遗留。闭包捕获 `let mut` 变量时，应在闭包签名注入 `mut<T>` effect，使 effect 追踪完整。核心的 local effect cancellation 已在 B-048 完成。

**涉及修改**：
1. `infer.ring`：lambda 推断时分析捕获列表，对捕获的 `let mut` 变量注入 `mut<T>` effect

**验收标准**：
- 闭包捕获 `let mut` 变量 → 闭包类型携带 `mut<T>` effect
- 闭包内修改捕获的 mut 变量 → `mut` effect 正确传播到调用者
- local cancellation 规则仍生效（局部变量 mutation 不传播）
- 全部 E2E 测试通过

### B-071 推断失败错误信息 UX [feature] [P2] [M] [judgment] [doing]
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

## LLVM 后端质量

### B-097 自定义 effect handler LLVM — phase 2（custom-abort / default / delegate / nesting）[feature] [P2] [M] [judgment] [queued]
> 2026-06-03 从 B-090 拆出（D3 分期）。B-090 核心（单 effect multi-op tail-resumptive）落地后的全 parity 收口。复杂度 M-L。依赖 B-090（✅ 已落地，依赖已满足）。

承接 B-090 的 evidence 派发机制，补齐剩余 custom-effect parity 场景：

1. **custom-abort effect（非 fail 的 abort）**：用户 `effect Exc { fn throw(...) }` 当 abort 用。JS 靠 `EffectAbort` + effect-name 匹配；LLVM 当前只有 `fail` 接了 `ring_try`/`ring_raise`。需 per-abort-effect 的 setjmp 落点（泛化 `ring_try` 带 effect tag，或 per-effect handler 栈帧），与 tail-resumptive 是两套机制。
2. **default body（#72）**：op 带默认 handler 时，无 `handle...with` 也能调用——需自动注入默认 evidence（默认 op 闭包）。对照 JS 默认 handler 注入。
3. **delegate 转发 effect（B-088 #4）**：delegate 方法转发 effect 时正确传递 evidence（同 handler dispatch 根因的 delegate 表现）。
4. **nested / multi-effect evidence scoping edge**：B-090 核心吃掉 lexical scoping 自然涵盖的部分后，剩余的嵌套 handler / 同时 handle 多 effect 的 evidence shadowing 边角。

**涉及修改**：
1. `compiler/codegen_llvm_expr.ring`：custom-abort 的 handle/effect-op lowering；default evidence 注入；delegate evidence 转发；nested scoping
2. `ring_runtime.cpp`：泛化 `ring_try`/`ring_raise` 支持 custom-abort effect tag（或 per-effect handler 栈）

**验收标准**：
- custom-abort effect（用户 `effect Exc`）handle + raise JS/LLVM 一致
- 带 default body 的 op 无 handler 调用两后端一致
- delegate 转发 effect（B-088 #4 复现）JS/LLVM 一致
- 嵌套 handler / multi-effect handle 差分用例锁 parity
- 全 E2E + llvm_diff 通过；自举一致

### B-096 Perceus 闭包 RC 完整收口（A 波）[bugfix] [P3] [L] [judgment] [queued]

> 2026-06-03 从 B-084 拆出。B-084 的 #130 C 增量落地后的完整收口。**本机可做**（native 实跑即可观测 double-free / 内存峰值，放心动 `ring_try` 闭包 drop）。纯泄漏方向，差分测试比输出非内存，抓不到对错——做了之后差分全绿。见 design.md §7.10 闭包 capture 所有权。

B-084 C 增量只修普通闭包 owned-capture drop，catch/handle 闭包仍整体泄漏。A 波收口剩余四块：

1. **borrowed capture 正式建模**：perceus 区分 owned vs borrowed capture（#131 给 catch env 塞的 borrow-for-drop），borrowed 不进 env 或标记 no-drop。
2. **ring_try 闭包 drop**：`ring_try`（`ring_runtime.cpp:1517`）调完 body/catch 闭包后 drop 两者（连 env），消除整体泄漏。**必须与 borrowed capture 建模配套**，否则 double-drop catch arm 的 `f`。
3. **#4 guard-false 边泄漏**（B-083 残留）：带 guard 的 arm，pattern 绑定被 body dup 但 guard 假 fall-through → 该 dup 无人 drop（泄漏）。B-083 为消除 UAF 选保守策略（match 消费变量跨 guard fork 全程 dup 不 move），代价即此。修：perceus 产出 guard-false 边 drop 列表 + codegen 在 guard cond-false 目标前插 cleanup block 绑定并 drop。纯泄漏无 UAF。
4. **#3 残留 drop_T**：Range struct（start/end）+ Eq/Ord-dict struct（2 closures）当前共用 no-op TUPLE typeid，process-lifetime 极小泄漏。给各自专属 drop_T（与 env typeid 方案一并设计）。
5. **B-090 evidence struct + handler 闭包 drop**（2026-06-03 D2 吸收）：B-090 的 tail-resumptive handler 在 `gen_handle_expr` 分配 evidence struct（N slot 闭包）后暂泄漏（同 #2 的 `ring_try` 闭包策略）。本波给 evidence struct 专属 typeid + `drop_T`（drop 时递归 drop 各 slot 的 handler 闭包及其 env），perceus 在 handle scope 末尾发 drop。与 #1 borrowed capture 建模配套（handler op body 捕获外层的 owned vs borrowed 区分）。

**涉及修改**：
1. `compiler/perceus.ring`：owned/borrowed capture 区分；guard-false 边 drop 列表；handle scope 末尾发 evidence struct drop
2. `ring_runtime.cpp`：`ring_try` 后 drop body/catch 闭包；Range/dict struct 专属 drop_T；evidence struct 专属 typeid + drop_T
3. `compiler/codegen_llvm_expr.ring`：borrowed capture env 处理；guard cond-false cleanup block

**验收标准**：
- catch/handle 闭包 env 无泄漏；`ring_try` 后两闭包释放，无 double-drop（catch arm `f` 仅释放一次）
- guard-false 边 pattern 绑定 dup 正确 drop
- Range/dict struct 有注册的专属 drop_T
- B-090 evidence struct + handler 闭包在 handle scope 末尾正确 drop，无泄漏无 double-free
- 大内存机实测无 double-free；带 RC 自编译内存峰值进一步下降
- 全部 E2E + llvm_diff 通过；自举一致

### B-089 Native 自举终验 capstone [bugfix] [P1] [L] [judgment] [doing]

> **native on-par 统一规划 P2（2026-06-08）= Level 1 终点**：依赖 **B-104 完整 Perceus RC（G-a 真解，total drop pass + leak verifier）**落地后启动（2026-06-09：原写 B-080 标记指针，已降级；G-a 改由 B-104 完整 RC 达成）。三门走 **js 路径**（native 自编译产 JS dist 与 node 版一致）。**B-099 显式 out-of-scope**——Level 1 不要求 native 自产 .o（产 .o 仍可借 node），B-099 是 Level 1→Level 2 分界，deferred。验收门以下文「合 B-012 遗留」为准，唯依赖从 B-102 改为 B-104。

> **本机可做**：依赖 B-083/B-084/B-085/B-086/B-087/B-088 + #133 + **B-098（✅ 2026-06-04 done）** + **B-101（✅ A1 Type-DAG done）** + **B-102（✅ R-clean done，git `1a6b1d7`/`27fe62d`，over-free/UAF 链终结；条目 2026-06-12 删除，终验参照并入下方验收；试错史 = design.md §7.11「Type-DAG RC 试错结论」+ git）** 落地。

> **B-098 落地后的起点（2026-06-04 验证态）**：clone-all-escape 借用引擎落地，**#134 系统性 double-free 崩溃类消除**——native ring.exe 编 `a_empty.ring` EXIT 0（register_impl_method 崩点消除）、JS 731×3 + llvm_diff 49×3 全绿、dist double-bootstrap 字节一致。本项从「native 能编平凡程序」起步推进全自举。

> **B-098 暴露、归入本项的 blocker（⚠️ 2026-06-04/05 时点记录，缩编 2026-06-12——#1/#2 已被后续工作解决，过程全文见 git history）**：
> 1. ~~native prelude RC over-free~~（pre-existing L0 bug，revert 实验证实自 B-012 就在）——**已由 B-101 → B-102 R-clean → B-103 链终结**（ASan-clean ×3）。
> 2. ~~`is_droppable_init` 无界泄漏~~（apply_subst 167 调用点全落「永不 drop」）——**已由 B-103 return-mode 分类 + B-104 D1 解决**（当时记录的「修法 = A2 intern」已被 R-clean 撤销取代）。
> 3. **~247 条 `[rc-warn] Drop: variable not found`**：perceus block 作用域 vs codegen flat-named_values 未对齐，fail-safe 跳过 = 泄漏非崩。属内存优化精化，G-a 终验时复核是否仍存在。
> 4. **`--target=llvm` 自举依赖 B-099**：native 二进制未链 LLVM-C → G-b/G-c 走 --target=llvm 需 B-099 先落地（js 路径不受影响）。

> **G-b 预警（2026-06-13，B-104 D7 自编译跑通后首次可对比，worker_feedback 落账）**：native 自编译产出的 JS dist 与 node 版**功能等价但字节不同**——42/42 文件长度逐文件相同、hash 全不同，diff 全部是 import 列表序 + 函数定义 emit 序差异（native C++ map 迭代序 vs JS 插入序）。**B-080 验收（2026-06-13 Discussion）实锤排序差异不只是美观问题——native 产 JS 在 node 中 `__ring_ev_fail` undefined 运行崩溃**（evidence 传递因排序断裂）。**拍板 = (a) codegen emit 排序确定化**（2026-06-13 Discussion）：所有依赖 Map 迭代的 emit 点（import 列表、函数定义、dict 常量等）改用与后端无关的稳定序（如按名字典序）。根治 + 产出 deterministic（利于缓存/增量编译）。(b) 语义等价判定不能替代——排序差异已致功能性 bug。实现归 B-089 G-b 门。
>
> **G-b 根因定位（2026-06-15，深度调查）**：B-136 修 Ring 层 Set 排序后 G-b 从 32→5 文件差异但 5/44 未动。进一步调查确认：**直接 `fail.raise` 在 native 正常**（effect=1），**跨模块导入函数的 effect 丢失**（`merge_effects` 调 imported `unify`，JS 两后端 fail effect=2，native 推断 effect=0）。所有 Ring 层 Set/Map 迭代已确认排序。结论：**LLVM codegen 对 TypeScheme/FnType/EffectRow 的数据布局有 bug**（字段偏移错位，native 运行时读 effect 字段拿到空值）。下一步 = 排查 `infer_call` 处理 imported function 的 TypeScheme 时 FnType.effects 字段在 native 的实际偏移。

合 B-012 遗留的两条验收 + 内存门。三门：
- **G-a 内存**：带 RC pass 自编译，内存峰值降至机器可运行（验证 RC 有效）
- **G-b 双 bootstrap**：native 二进制重编译编译器，与参考产出字节级一致（依赖 B-085 determinism）
- **G-c parity**：native E2E + llvm_diff 全过，行为与 JS oracle 一致

**验收标准**：
- 带 RC pass native 自编译跑通且内存峰值 << 25.9GB
- double-bootstrap 字节级一致
- native E2E + llvm_diff 全过
- **B-102 Type-DAG RC 终验参照（2026-06-12 条目删除并入）**：Type 语义不变（`types_equal`/推断/unification 行为不变）+ native real_program ×3 ASan-clean；B-098 时点记录的 ~247 条 `[rc-warn] Drop: variable not found`（fail-safe 泄漏非崩）复核是否仍存在
- 全过后：CLAUDE.md 标 native 自举完成，启动 JS 后端归档 + 层 3

> fix-forward：跑通过程中暴露的新泄漏/发散就地开 audit/backlog，不预设"全绿才动"。


### B-099 native 自托管 LLVM 后端（Node 消除 / JS 归档最后一公里）[feature] [P2] [XL] [judgment] [queued] [deferred: B-089]

> **= Level 1→Level 2 分界（2026-06-08 native on-par 统一规划）**：Level 1（B-104+B-089）做到 native 前端+JS 后端与 node 版对等；本 item 是「native 自产 native 代码 / Node 彻底消除 / JS 后端归档」的 Level 2。**2026-06-13 升 P2**——Node 消除是确定目标，B-089 完成后立即启动。

> 2026-06-04 立项（Discussion，从 #134 架构 gap 转入）。**deferred——严格在 B-089 三门验收之后**（B-098 已 ✅）。**不阻塞 native-working**：native ring.exe 跑 `--target=js` 即可自托管前端（内存墙在前端，G-a/b/c 全可用 js 路径达成），本项只挡「native 二进制自己产 native 代码、Node 从工具链彻底消除、JS 后端归档」这最后一公里。

**gap 精确形态**：native codegen 对 extern fn 分两类——ring_runtime C ABI fn 走 allow-list（`get_or_declare_runtime_fn`）emit `declare` + 链接 `ring_runtime.o`，原生可用；LLVM-C extern fn（`LLVMBuildRet`/`LLVMConstInt`…）不在 allow-list 且 `HDecl::ExternFn` 在 forward-declare 被跳过（`codegen_llvm.ring:347`）→ 调用塞 panic stub。JS 后端由 N-API addon（`compiler/llvm-addon/`）在 Node runtime 满足。故 native `ring.exe build x --target=llvm` panic。

**真实 scope（非仅 link libLLVM）**：N-API addon 现在在 JS 里做 C-ABI marshalling——`List<T>`→`T*+count`（count 省略、addon 重建）、`Str`→`const char*`、opaque ref 透传、output 参数折进返回值（`llvm_ffi.ring:9-15`）。native 路径需把这套 marshalling 从 JS 搬成 codegen 内联 native glue（uniform-boxed Ring 值 ↔ C ABI）+ 链接 LLVM-C 22。

**涉及修改**：
1. `compiler/codegen_llvm.ring` / `codegen_llvm_decl.ring`：LLVM-C extern fn 改 emit 真实 `declare`（external 符号）而非跳过/panic；扩展 extern fn 处理覆盖 LLVM-C 全集。
2. codegen：emit C-ABI marshalling glue（List↔array+count、Str↔char*、output-param 折叠），对照 addon 当前 JS marshalling。
3. 构建/链接：native ring.exe 链接 libLLVM-C（22）。
4. addon 退役路径：marshalling 移入 codegen 后，N-API addon 仅剩 bootstrap 用途。

**验收标准**：
- native `ring.exe build x.ring --target=llvm` 产出可链接运行的 .o（不 panic）
- native 二进制自编译 native（`ring.exe build compiler/main.ring --target=llvm`）产出与参考一致
- 工具链全链路无 Node（除 bootstrap 历史）
- 全 E2E + llvm_diff 通过；自举一致
- **extern-handle RC 排除 runtime 级终验**（原 audit #139 修复的真实 runtime 验证，git `bfd4fe6`..`b62423b`：native 自跑 `--target=llvm` 全程无 handle dup/drop 损坏；audit #140/#146/#147 latent 路径届时一并复核）

**既有现象备忘（2026-06-12，worker [观察] 归档）**：dist-llvm 自编译现有 ~970→~1020 条 `unknown function 'LLVM*'` warning（base 即有、非回归——llvm_ffi extern fn 在 JS-host 编译路径下的输出形态；D4 后自然增长 = 新增 lazy getter/global 调用点）。本项落地（LLVM-C extern 真实 declare）后应消失，作回归观察点。

**依赖**：B-098（native 能跑，✅）+ B-089（native 自举三门验收通过）。B-089 完成前不启动。

### B-100 JS 后端归档（parity 认证门 + golden 快照 + 删除）[feature] [P3] [L] [judgment] [queued] [deferred: B-099]

> 2026-06-04 立项（Discussion）。**deferred——排在 B-099 之后**，删 JS 前提是 native 工具链已自立。**归档策略 = (Z) 证明 parity → 快照 golden → 删除**。核心论点：差分 oracle 价值 = 抓两后端发散；一旦两后端被**证明** feature 完全一致且零 bug，oracle 对当前 feature 集已用尽，删除不损失测试价值。**删除点选「层 3 之前」**：golden 快照保存量回归网，层 3 新 codegen（async generator / Drop unwind / refinement 运行时检查）靠手写 E2E 期望值（无活 oracle——可接受，JS 后端实现层 3 也可能有 bug，oracle 非真值，且为层 3 维护两遍 codegen 成本过高）。

**前置**：B-099（native 自托管，Node 消除）+ B-097（custom-effect handler parity）+ B-096（闭包 RC 收口）——即「两后端 feature 完全一致」的剩余工作。

**Phase 1 — parity 认证门**（删除前置，可验收）：
1. **feature 覆盖矩阵**：穷举语言面，每个特性 ≥1 个 llvm_diff 用例断言两后端输出一致（不抽样）。补齐当前 llvm_diff 未覆盖的特性。
2. **关闭残留 G-c gap**：B-097（custom-abort / default / delegate / nesting）+ B-096（闭包 RC 泄漏）全绿。
3. **复数轮对抗 review**：`/full-audit` + `/code-review` 多轮交叉验证，每轮喂边角/对抗用例，loop-until-dry——连续 ≥2 轮零新发散方算通过（参照间歇 bug 的 3x 经验）。
4. 全 llvm_diff **×3** 零失配 + native E2E 全过 + 双 bootstrap 字节一致。

**Phase 2 — golden 快照 + 删除**（认证通过后）：
1. 把 parity 认证的 llvm_diff 语料**快照成 golden 输出**，存为回归基准（取代 JS-oracle 的活对照）。
2. 删 JS 后端：`codegen.ring` / `codegen_expr.ring` / `codegen_stmt.ring` / `runtime.ring`（JS runtime 拼接）+ llvm-addon 残留 + `--target=js` 路径 + llvm_diff 的 JS-oracle 执行（改 golden 对照）。
3. `CLAUDE.md` / `design.md` 更新：JS 后端标归档；测试策略改 golden + 手写 E2E 期望值。
4. Web playground 若仍需 JS/WASM，单独评估（已排除 WasmGC，Web 由 LLVM→WASM 覆盖）。

**验收标准**：
- parity 认证门 4 条全过（穷举矩阵 + G-c gap 清零 + 复数轮零新发散 + ×3 零失配）
- golden 快照建立；删 JS 后端后全测试套件仍通过（对照 golden）
- native 工具链无 JS/Node 依赖
- 删除点 = 层 3 启动之前
- **oracle 盲区 native-only 语义测试（2026-06-11 增）**：归档前为已知差异角落补 native 侧手写期望值测试——I64 全宽度（±2^63 边界）/ 整数溢出（debug panic / release 回绕）/ 整数除零 panic / UTF-8 code point 索引 + `byte_len`。这些角落 JS oracle 本身失真（±2^53 / 静默 float / Infinity / UTF-16），差分测不了，归档后再无任何安全网

**已知取舍**：层 3 codegen 失去活差分 oracle，靠手写 E2E 期望值 + golden 回归验证（(Z) 策略的代价，已确认接受）。

### B-105 增量编译（per-module .o）[feature] [P3] [XL] [judgment] [queued] [deferred: native-primary]

> 2026-06-07 立项（Discussion，从 migration diary 未登记债转入）。**deferred**——gate 在「native 成为主工具链（B-099 之后）+ 编译时间成实测痛点」。不阻塞 B-089/B-099/B-100。

**现状**：`generate_llvm_project`（`codegen_llvm.ring`）把所有 .ring 编进单个 LLVM Module → 单 .o。当初为省跨模块符号解析（migration diary 记录的简化）。

**核心设计难点（非工程量，是设计未解）**：Ring 对泛型做单态化。模块 B 用模块 A 的泛型函数 → 该实例化版本 emit 在哪个 .o？（Rust/C++ 模板实例化经典问题）。外加跨模块 struct 布局 / trait dict / enum tag 一致性。真正难的是跨模块单态化，不是 link。具体方案（实例化放使用方 vs 独立 codegen unit）等真要做时单独 Discussion。

**涉及修改**（方向，待细化）：
1. `compiler/codegen_llvm.ring`：每 .ring → 独立 Module → 独立 .o；跨模块单态化策略。
2. 链接：多 .o 链接（符号 mangling 已有 `ring_` 前缀基础）。
3. 跨模块类型 / dict / enum tag 一致性保证。

**验收标准**：
- 改单文件只重编该文件 + 受影响的单态化实例
- 多 .o 链接产出与单 Module 行为一致
- 全部 E2E + llvm_diff 通过；自举一致

## 架构：后端策略（2026-05-23 更新）

**JS 后端定位为 bootstrap 后端，LLVM 为目标后端。**

| 后端 | 定位 | 生命周期 |
|------|------|---------|
| **JS (V8)** | Bootstrap + 差分 oracle | 当前唯一后端，支撑自举 + 当 LLVM codegen 的差分 oracle。归档走 B-100（(Z) 证明 parity → golden 快照 → 删除），不是简单废弃 |
| **LLVM** | 目标后端 | Ring 语言特性（linear types、Perceus RC、full AE）的完整实现平台 |

### JS 后端归档策略（2026-06-04 确定，B-100）

JS 后端不只是 bootstrap，还是 **LLVM codegen 的差分 oracle**（llvm_diff 用 JS 输出当真值）。因此「归档」≠ 随手删——简单删会摧毁这个 oracle，而层 3（async/unwind/refinement）恰是 codegen 最复杂处。

**策略 (Z)**：删除前先**证明**两后端 feature 完全一致且零 bug（parity 认证门：穷举覆盖矩阵 + 关 B-097/B-096 + 复数轮对抗 review，loop-until-dry），此时 oracle 对当前 feature 集已用尽；再把 llvm_diff 语料**快照成 golden**保留存量回归网，然后删 JS 后端。删除点 = **层 3 之前**——层 3 新 codegen 靠手写 E2E 期望值 + golden 回归（接受失去活 oracle，因 JS 实现层 3 亦可能有 bug 且双实现成本过高）。详见 B-100。

### 生态策略：RIIR（Rewrite It In Ring）

不依赖外部包管理生态（npm/crates.io），通过逐步用纯 Ring 重写标准库和核心库建立自有生态。底层原语（syscall、crypto、压缩）通过 C FFI 接入。

**全部自己实现（2026-06-13 拍板）**：容器底层（vector/string/unordered_map）全部用纯 Ring + `Ptr<T>` 重写，不保留 C++ STL 依赖。标准库从 `extern fn` 包装 JS → 纯 Ring 实现。纯 Ring 代码天然跨后端——RIIR 进度 = 后端迁移就绪度。

### LLVM 后端引入路径

1. 语言特性完善（Phase C 层 1+2）
2. Codegen 接口抽象化（从 JS 单体中提取共享 HIR 优化 pass）
3. LLVM codegen 实现（HIR → LLVM IR）
4. 标准库底层原语移植（extern fn JS → extern fn C ABI）
5. 编译器自身 native 化（B-098 借用引擎 → B-089 自举三门 → B-099 native 自托管 LLVM / Node 消除 → B-100 parity 认证门 + golden 快照 + 删 JS 后端）

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
