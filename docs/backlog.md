# Backlog

> 活的工作看板。做完的条目删除，只在 git commit message 留记录。
> 条目格式：`### B-xxx <标题> [类型] [优先级] [复杂度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`queued` → `planning` → `doing` → 删除
> 反馈分支：`doing` → `waiting-feedback`（Worker 遇到设计问题）→ Discussion 处理后 → `queued`（重新排队）
> 工作流规范见 `docs/workflow.md`

## 层 3 排序（2026-06-27 Discussion 重定，JS 退役完成后启动）

B-151 CI → B-125 unsafe/Ptr<T> (XL) → B-002p1 精简 Drop (L) → B-152 RIIR std (XL) → B-002p2 unwind 补全 (L)；后续 B-110 别名追踪 → B-068 用户面。async 线（B-116 probe → B-007）和类型系统线（B-001 Refinement 需 B-070）在 RIIR 之后。M 项当 XL 间换气穿插；P3 研究最后。

> **战略**：unsafe + Ptr<T> → 精简 Drop → RIIR 标准库，让 Ring 拥有自己的底层，消除 C++ STL 依赖。
> B-002 拆两阶段：Phase 1 精简版（scope-end Drop，够 RIIR 用）先行；Phase 2 unwind（invoke/landingpad）RIIR 之后补。
> B-111 LLM eval harness 在开发进入正轨后再排。
> B-068 用户面在 B-110 落地后再立项——模型见 design.md §7.2-7.8。

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

### B-002 Drop / RAII [feature] [P1] [XL] [judgment] [queued]

> 2026-06-24 重新设计（Discussion，资源管理模型重构）。2026-06-27 拆两阶段（Discussion，路线图重定）。**真值源 = design.md §7.6（2026-06-24 版）**。Perceus 分层 L2——在 L0/L1 RC 核心之上实现用户 `impl Drop` + 全路径 RAII。

**拆分决策（2026-06-27）**：Phase 1 精简版（scope-end Drop + move checker，够 RIIR 用）先行，不含 unwind；Phase 2 补 invoke/landingpad unwind，B-152 RIIR 之后。**升级条件**：如果实现过程中 setjmp/longjmp 路径出 bug，Phase 2 立即上调优先级先做。

**Drop trait**：

```ring
trait Drop {
    fn drop(self) with {io}   // 允许 io（flush/log/close），禁止 fail（2026-06-24 确认）
}
```

**模型（2026-06-24 更新）**：
- Drop 类型赋值 auto-move（本项自带简单 consumed-flag checker），rc 恒 1，scope-end drop = rc 归零 = Rust 析构时机
- `impl Drop` 禁止 `impl Clone`（资源不可复制）
- Drop 顺序对齐 Rust：同 scope 逆序 / struct 字段声明序 / 容器元素序
- `drop(x)` 提前释放，`leak(x)` 显式逃逸
- 复合类型自动 derive Drop：struct 含 Drop 字段 → 编译器自动生成 Drop（逐字段 drop）。用户 `impl Drop` 覆盖
- 共享 Drop 类型 → `Rc<T>`（非 Drop 包装，§7.7），内部 T 的 Drop 在 Rc rc=0 时触发
- 容器持有 Drop 值 → 容器 drop 时自动 drop 所有元素
- 非 Drop 类型的 RC 环泄漏：接受（同 Koka），编译器对可能自引用的类型定义发 warning 并建议 arena+index 或 Weak

#### Phase 1: 精简版 Drop [P1] [L] — B-125 之后、B-152 RIIR 之前

**前置**：B-125（unsafe/Ptr<T>，RIIR 容器的 Drop 需要 dealloc 原语）

**涉及修改**：
1. **checker**：`impl Drop` 注册 + `impl Drop` 禁 `impl Clone` 检查 + Drop 方法 effect 约束（禁 fail）
2. **checker：简单 move checker（consumed-flag）**——Drop 类型 `let y = x` 标记 x 为 consumed，后续使用 x 报编译错误（E07xx）。纯变量级线性扫描，不需要别名追踪/mutation 推断/NLL。`--error-format=llm` 提示 "x was moved to y"
3. **codegen_llvm**：Drop glue 生成——per-type `drop_T` 函数（用户 `impl Drop` body + 字段递归 drop）；复合类型自动 derive
4. **perceus**：Drop 类型的 RC 行为——auto-move 不 dup（由 sub-item 2 的 checker 保证），scope-end drop 恒释放

**Phase 1 验收标准**：
- `impl Drop for T` 可编译，scope-end 触发 Drop
- Drop 内 `fail.raise` → 编译错误
- struct 含 Drop 字段 → 自动 Drop 按字段声明序
- Drop 类型 auto-move：`let g = f`（Drop）→ 后续使用 f 编译错误
- 全部 E2E + llvm_diff 通过；自举一致

#### Phase 2: Unwind 补全 [P2] [L] [deferred: B-152]

**涉及修改**：
5. **abort-unwind（重头）**：fail.raise 从 setjmp/longjmp 改为 **LLVM invoke/landingpad**（和 Rust 同一机制）。TryCatch/HandleExpr codegen 改用 invoke + landing pad；landing pad 执行 Drop glue 后 resume unwind。`ring_runtime.cpp` 的 `ring_try`/`ring_raise` 改用 unwind API
6. **`Weak<T>`（子项）**：runtime 对象头扩展 weak_count；`Rc.downgrade()` / `Weak.upgrade()`；rc=0 时执行 Drop 但 weak_count>0 时不 free 内存
7. **try/catch codegen 改用栈分配 catch frame**：当前 codegen（`codegen_llvm_expr.ring`）使用 `ring_catch_push`/`ring_catch_pop`（每次 try/catch 堆分配+释放 RingCatchFrame）；`ring_runtime.cpp` 已有 `ring_try`（栈分配 RingCatchFrame，零堆开销）但未被使用。unwind 重写时一并切换到栈分配方案（2026-06-27 审计观察 #1 并入）

**Phase 2 验收标准**：
- abort 路径（fail.raise 穿越含 Drop 局部的函数）→ 所有 Drop 正确执行（invoke/landingpad）
- `Rc<T>` 共享 Drop 类型 → 最后一个 Rc 消亡时 Drop 触发
- try/catch 不再堆分配 CatchFrame
- 全部 E2E + llvm_diff 通过；自举一致

- **后续**：B-110（非 Drop 类型别名追踪）在 B-002 Phase 2 之后落地



### B-110 非 Drop 类型别名追踪（资源管理 checker）[feature] [P1] [L] [judgment] [queued] [deferred: B-002]

> 2026-06-11 立项，2026-06-24 重新设计+拆分（Discussion）。**真值源 = design.md §7.4（2026-06-24 版）**。Drop auto-move 已移入 B-002（简单 consumed-flag checker）。本项专注非 Drop 类型的别名追踪 + mutation 推断。B-002 和 B-110 都完成后再做整体优化。

**设计决策（2026-06-24 Discussion）**：
- **mutation 判定完备性**：上线即全覆盖——赋值 = mutation；用户函数从函数体自底向上推断（mut 传播到签名）；extern fn 必须显式标注 `mut`（§7.3）。不接受渐进白名单
- **别名作用域**：默认到大括号结束。编译器可隐式缩小别名生存期至最后使用点（NLL 风格），精度取决于 NLL 设计探针结果
- **循环别名**：参考 Rust 规则，循环体内 mutation 使循环外别名在整个循环体内失效

**前置**：B-002（Drop/RAII，提供 Drop 类型信息用于 share vs move 分叉判定）+ NLL 设计探针

**涉及修改**：
1. **checker：mutation 推断（自底向上）**——分析函数体：赋值字段/index = mutation；调用 mutating 方法 = mutation（递归：callee 的参数已推断 mut → caller 该调用是 mutation）。推断结果标记参数为 `mut T`。extern fn 从声明读取 `mut` 标注
2. **checker：别名追踪 pass（§7.4）**——`let y = x`（非 Drop 复合类型）建立别名关系；对 x 的 mutation 使 y 失效；失效后使用 y = 编译错误（E07xx，`--error-format=llm` 含 `.clone()` 修复建议）。别名生存期到大括号结束，编译器可隐式缩小到最后使用点（NLL）
3. **调用点检查**——callee 参数推断为 `mut T` 时，caller 实参不能有其他活跃别名
4. **测试**：别名失效 E2E + mutation 推断 + `.clone()` 独立性 + 编译器自身零错误
5. **嵌套赋值 codegen bug（承继旧 B-110 #5）**：`grid[0][1] = v` 两后端崩（JS 产非法 JS / LLVM panic），修复或显式报错

**编译器自身迁移**：新模型下非 Drop 类型不 move，编译器现有的 `let y = x` 共享模式天然合规——无需大规模迁移。可能需要修复的只有 mutation-after-alias 站点（预期少量）。首步跑 checker 统计错误数。

**验收标准**：
- 别名失效：`let ys = xs; xs.push(1); print(ys)` → 编译错误
- mutation 推断：用户函数体 mutate 参数 → 签名推断 `mut T`；extern fn 声明 `mut` → 调用点检查别名
- 调用点别名安全：`let ys = xs; sort_in_place(xs)` → 编译错误（xs 有活跃别名 ys）
- `.clone()` 路径：`let ys = xs.clone(); xs.push(1); print(ys)` → ✅
- 编译器自身（31+ 文件）在新 checker 下零错误 + double bootstrap 一致
- 全部 E2E + llvm_diff 通过

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

### B-149 Display trait + 字符串插值类型约束 [feature] [P2] [M] [judgment] [queued]

> 2026-06-25 立项（Discussion，#184 审计发现触发）。

字符串插值 `"${x}"` 当前对非 Str/Int/Float/Bool 类型在 LLVM 后端输出 garbage 整数。需要设计 Display trait 并约束插值语义。

**设计方向（2026-06-25 Discussion 拍板）**：

1. **新增 `trait Display { fn display(self) -> Str }`**
2. **内置 impl**：Str（identity）、Int/Float/Bool（to_str）
3. **`"${x}"` 要求 Display 约束**——无 Display 的类型插值 = 编译错误
4. **`derive(Display)` 可选**：default impl 委托给 `debug()`，用户一行 derive 即可用于插值
5. **Debug vs Display 分工**：Debug 给开发者（`dbg(x)` 等结构化输出），Display 给用户（插值、print）
6. **Debug/Display 所有权契约**：`debug()` 和 `display()` 返回值必须是 fresh-owned `Str`（调用方无条件 `ring_drop`）。derive Debug 已遵守此契约（`gen_str_lit_simple` 总返回 fresh；`emit_identity_to_debug_str` 的 heap 路径通过 `ring_dup` 补偿）。此契约需在 design.md Debug/Display trait 小节显式记录（2026-06-26 审计观察 #4 触发）

**即时修复**（#184 audit-report 条目）：checker 阶段对非基本类型插值报编译错误，不依赖 Display trait 存在。Display trait 实现后放宽为"要求 Display impl"。

**涉及修改**：
1. `compiler/infer.ring` / `infer_helpers.ring`：插值表达式的类型检查，要求 Display trait bound
2. `compiler/derive.ring`：新增 Display derive 支持（委托给 debug）
3. `compiler/codegen_llvm_expr.ring`：`convert_to_str` 改为通过 Display dict dispatch
4. `compiler/codegen_expr.ring`：JS 后端同步（如仍存在）
5. `std/` 或 `compiler/builtins.ring`：内置 Display trait 定义 + 基本类型 impl

**验收标准**：
- `"${my_struct}"` 对有 Display 的类型正确输出
- 无 Display 的类型编译错误，错误消息提示 `derive(Display)` 或手动实现
- 所有现有 E2E 测试通过（基本类型插值不变）
- 新增 E2E 测试覆盖 struct/enum 插值

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

**前置依赖**：B-008（Default Effect Handler）。（原前置 B-037 `mut<T>` marker effect 已移除，见 design.md §7.9。）
**复杂度**：极大（generator codegen + scope 管理 + 取消传播 + 标准库 async 原语）
**优先级**：层 3（Phase C 层 1+2 完成后启动）
**宣发价值**：直接解决 function coloring + cancellation safety——带 async effect 的函数可在同步 handler 下测试，取消可补偿。设计已确定，实现前可作为已解决的设计卖点讲

### B-125 unsafe effect + `Ptr<T>` 原语全链路 [feature] [P1] [XL] [judgment] [doing]

> 2026-06-13 立项（Discussion，B-106 design-probe 正文拍定后的实现项）。2026-06-27 P3→P1 提升 + 实施规划（Discussion，路线图重定 + read/take 拆分决策 + 4-wave 实施计划）。**设计真值 = design.md §7.12**（三栏总账 + unsafe effect 两级 discharge + `Ptr<T>` 形态 + 原语集 v1 + extern fn 声明处签字 + 跨界三件套）。**前置 B-104 已完成。B-151 CI 之后立即启动。**

**2026-06-27 Discussion 决策摘要**：
- **Ptr<T> 注册方式**：新增内建类型 variant `PtrType { pointee: Type }`（与 ListType/OptionType 同级），不复用 extern type
- **原语实现形式**：`alloc<T>` / `dealloc<T>` / `copy` 为顶层 builtin；`read` / `take` / `write` / `offset` / `cast` / `addr` 为 `Ptr<T>` 方法；`from_addr<T>` 为静态构造
- **read/take 拆分**：原 `read`（move out）拆为 `read`（peek + dup/RC+1）+ `take`（move out 不 dup）。动机：RIIR 容器 `get()` 是最高频操作，read=move 需三步（read+dup+write_back），拆分后一行完成
- **命名**：`alloc` / `dealloc`（对称，不用 `free`）
- **extern fn safe 覆盖**：B-125 不做，全部 extern fn 一律 unsafe，后续单独加 `extern safe fn`

**4-Wave 实施计划**：

**Wave 1：语言骨架**（纯类型+effect 管道，无原语）
1. Lexer：`TkUnsafe` 关键字
2. Parser：`unsafe { expr }` 块表达式 → AST `UnsafeBlock` 节点
3. HIR：`UnsafeBlock` lowering
4. Effect 枚举：`UnsafeEffect` variant + 全部 match 分支（types.ring ~6 处）
5. Checker：`unsafe {}` 块 discharge unsafe effect；模块级 `requires {unsafe}` 检查（激活已解析但未 enforce 的路径）
6. 负面测试：未 discharge / 模块未 requires → 编译错误

**Wave 2：Ptr<T> 类型 + 核心原语**
1. 内建类型 `PtrType { pointee: Type }`：注册到类型系统，RC 排除（复用 `is_rc_excluded_type` 模式）
2. unsafe 原语（产生 unsafe effect）：`alloc<T>(count)` / `dealloc<T>(p, count)` / `p.read()` / `p.take()` / `p.write(v)` / `p.offset(i)` / `copy(src, dst, count)`
3. safe 原语：`p.cast<U>()` / `p.addr()` / `Ptr::from_addr<T>(a)`
4. runtime：`ring_raw_alloc` / `ring_raw_dealloc` / `ring_ptr_read` / `ring_ptr_take` / `ring_ptr_write` / `ring_ptr_offset` / `ring_ptr_copy`（裸内存操作，不含 RC header）
5. Codegen LLVM：原语映射（`alloc` → `malloc`，`read` → load+dup，`take` → load，`write` → store，`offset` → `getelementptr inbounds`）

**Wave 3：extern fn 签字 + Perceus 验证**
1. extern fn 声明处 `requires {unsafe}` 检查
2. std/ 批量迁移（extern 声明模块加 `mod requires {unsafe}`）
3. Perceus/verify_rc：验证 read/take/write 落入既有 return-mode 分类（零特殊化）
4. E2E + llvm_diff 全量 ×3 + ASan-clean

**Wave 4：工具 + 收尾**
1. `ring audit unsafe` 子命令
2. 安全封装 demo：Ptr buffer + len/cap 的容器原型（内部 unsafe、pub 签名纯净）
3. 字段投影（`@repr(C)` 门票，可后置子项）
4. per-type 三件套 demo（List/Str 的 as_ptr/from_raw_parts/into_raw_parts）

**验收标准**：
- 未 discharge 使用原语 = 编译错误（负面测试两类：无 unsafe 块 / 模块未 requires）
- 安全封装成立：Ptr buffer + len/cap 容器 demo 内部 unsafe、pub 签名纯净，E2E 行为正确
- read（peek）可重复调用不破坏 buffer slot；take（move out）后重复 take = double-free（签字内容）
- read/take/write 所有权语义过 verify_rc 三判据；llvm_diff 全量 ×3（动 RC 纪律）+ ASan-clean
- `ring audit unsafe` 输出全部 discharge 点
- per-type 三件套（List/Str 的 as_ptr/from_raw_parts/into_raw_parts）可用且 E2E 覆盖

## RIIR

### B-152 RIIR 标准库（纯 Ring 重写 ring_runtime.cpp）[feature] [P1] [XL] [judgment] [queued] [deferred: B-002p1]

> 2026-06-27 立项（Discussion，路线图重定）。消除 C++ STL 依赖，让 Ring 真正拥有自己的底层。容器（Str/List/Map/Set）全部用纯 Ring + `Ptr<T>` + Drop 重写。

**前置**：B-125（unsafe/Ptr<T> 原语）+ B-002 Phase 1（精简版 Drop）

**分阶段实施**（各阶段可独立提交）：

| 阶段 | 内容 | 量 |
|------|------|----|
| P1 | Str — `Ptr<U8>` + len + cap，替换 std::string | L |
| P2 | List\<T\> — `Ptr<T>` + len + cap，替换 std::vector\<void*\> | L |
| P3 | Map\<K,V\> — 开放寻址哈希表，替换 std::unordered_map（吸收 B-107 Hash trait） | XL |
| P4 | Set\<K\> — 复用 Map 实现 | M |
| P5 | 清理 ring_runtime.cpp（保留 RC 核心 + IO + FFI glue） | M |

**每阶段模式**：
1. 在 `std/` 中用纯 Ring 实现新类型（`unsafe {}` 块内使用 `Ptr<T>` 原语）
2. `impl Drop`（dealloc backing buffer）
3. 逐个替换 ring_runtime.cpp 中的 extern fn → 纯 Ring 方法
4. 保持 E2E + llvm_diff 全绿 + 自举一致

**Str 实施细节**（P1，最先做——编译器自身最高频使用的类型）：
- 内部表示：`struct Str { buf: Ptr<U8>, len: Int, cap: Int }`
- UTF-8 字节串语义（design.md §1.7.1 已拍板）
- `impl Drop for Str { fn drop(self) { dealloc(self.buf) } }`
- 小字符串优化（SSO）可后续加，首版不做
- 替换 ring_runtime.cpp 中 ~30 个 ring_str_* 函数

**吸收 B-107**：P3（Map）自然包含 Hash trait + derive，不再需要单独做 B-107。

**验收标准**：
- 各阶段：替换的容器类型 E2E 行为与 C++ 版一致
- ring_runtime.cpp 中被替换的函数全部删除
- 编译器自举一致（double bootstrap）
- 全部 E2E + llvm_diff ×3 通过
- ASan clean（至少 gating 档）
- 最终：ring_runtime.cpp 只剩 RC 核心 + IO + 进程管理

## 迭代与集合

### B-095 List.enumerate 方法 [feature] [P3] [M] [judgment] [queued]

> 2026-06-03 立项备忘，低优先（B-086 #1 决策）。当前拿索引迭代只能 `for i in 0..xs.len()` 再索引，啰嗦。enumerate 是高频糖但不阻塞自举（全代码库零调用），按需再做。与 B-094（清死映射）耦合：B-094 删了 LLVM 死映射，本项真做时需重新补齐 checker + runtime + codegen 全套。

`List.enumerate() -> List<(Int, T)>`：返回带索引的元素对。

**涉及修改**：
1. `compiler/builtins.ring`：注册 `List.enumerate` 方法签名 `(self) -> List<(Int, T)>`
2. `ring_runtime.cpp`：实现 `ring_list_enumerate`（构造 `(Int, T)` tuple 列表）
3. `compiler/codegen_llvm_expr.ring`：LLVM 映射（恢复 B-094 删除的行）
4. `tests/cases/llvm/`：差分用例

**验收标准**：
- `for (i, x) in xs.enumerate()` 可用且行为正确
- 全部 E2E + llvm_diff 通过；自举一致

### B-107 泛型 Map key（Hash trait + derive）[feature] [P2] [L] [judgment] [absorbed: B-152p3]

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

## 基础设施

## 测试基础设施

### B-153 verify_rc mutation testing harness [infra] [P3] [M] [judgment] [queued]

> 2026-06-27 立项（Discussion，#205 审计发现触发）。verify_rc 负面测试 22 类中仍有 9 类（均为 fatal 类别）缺专用测试。这 9 类无法用正常 Ring 源码触发——仅在 RC pass 本身出 bug 时产生。需要 mutation testing harness 自动注入缺陷并验证检测。

**设计**：
- 对 perceus.ring 产出的 post-RC HIR 进行定向 mutation（如删除 drop 插入、跳过 dup、交换 drop/dup 位置）
- 每次注入一个 mutation，运行 verify_rc，断言报出对应类别的错误
- 覆盖剩余 9 类 fatal 判据

**涉及修改**：
1. `tests/mutation_rc.py`（或 `.mjs`）：mutation harness——读取编译器对测试用例的 RC 标注输出，注入 mutation，跑 verify_rc
2. 需要编译器暴露 post-RC HIR 的可序列化形式（或 harness 直接 patch verify_rc 的输入数据结构）
3. 每类 fatal 判据至少一个 mutation 用例

**验收标准**：
- 22/22 verify_rc 负面测试类别有覆盖
- 每个 mutation 被 verify_rc 正确检测
- harness 可重复运行，无误报
- #205 审计条目可删除

## 已知 Bug / 技术债


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

### B-155 自编译 IR 非确定性：字符串常量含堆地址 [bugfix] [P2] [L] [judgment] [queued] [deferred: B-152]

> 2026-06-27 立项（Discussion，CI bootstrap 失败调查）。

**现象**：`ring.exe build compiler/main.ring --target=llvm` 两次编译产出的 LLVM IR 不一致。84 个字符串常量（64 个 109 字节 + 20 个 1409 字节）包含编译进程的堆地址，每次运行不同。代码段（反汇编）完全一致，差异仅在 `.rdata` 常量池。

**已排除**：
- Map 迭代顺序：IR 差异不是函数/声明顺序问题，而是字符串常量内容差异
- LLVM O2 非确定性：差异在 Ring 产出的 IR 层，不在 LLVM 优化层
- extern fn marshalling 错误：编译后 IR 确认 `ring_str_to_cstr` 被正确调用

**根因线索**：
- 所有受影响常量由 `LLVMBuildGlobalStringPtr` 创建（经 `ring_str_to_cstr` 提取 `const char*`）
- 可见文本长度 24-31 字符，但常量分别是 109/1409 字节——`std::string` 内容超出可见文本，含二进制数据（堆指针）
- 简单程序（`tests/cases/`）不受影响，仅自编译（大代码量）时出现
- 疑似 `std::string` 操作中的内存越界读取或内容污染，与 MSVC STL 内部表示相关

**涉及修改**：
1. 定位哪个代码路径导致 `std::string` 内容被污染（可能需 ASan 或 valgrind 辅助）
2. 修复 `ring_runtime.cpp` 或编译器 codegen 中的相关 bug

**验收标准**：
- `ring.exe build compiler/main.ring --target=llvm` 两次编译产出字节一致的 `ring_output.ll`
- CI bootstrap（self-compile ×3 一致性检查）通过

---

---

## 架构：后端策略（2026-06-27 更新）

**LLVM 是唯一后端。** JS codegen 后端已归档（B-100 Phase 2，commit `5df6c99`，2026-06-27）。dist/ JS 编译产出冻结作 stage 0 回退。

| 后端 | 定位 | 状态 |
|------|------|------|
| **LLVM** | 唯一后端 | Ring 语言特性（linear types、Perceus RC、full AE）的完整实现平台 |
| **JS (V8)** | 已归档 | 原 bootstrap + 差分 oracle。经 B-100 parity 认证（(Z) 策略）后删除，golden 快照保留存量回归网 |

### 生态策略：RIIR（Rewrite It In Ring）

不依赖外部包管理生态（npm/crates.io），通过逐步用纯 Ring 重写标准库和核心库建立自有生态。底层原语（syscall、crypto、压缩）通过 C FFI 接入。

**全部自己实现（2026-06-13 拍板）**：容器底层（vector/string/unordered_map）全部用纯 Ring + `Ptr<T>` 重写，不保留 C++ STL 依赖。标准库从 `extern fn` 包装 JS → 纯 Ring 实现。纯 Ring 代码天然跨后端——RIIR 进度 = 后端迁移就绪度。

### LLVM 后端引入路径（已完成 ✅，2026-06-27）

1. ✅ 语言特性完善（Phase C 层 1+2）
2. ✅ Codegen 接口抽象化（共享 HIR 优化 pass）
3. ✅ LLVM codegen 实现（HIR → LLVM IR，codegen_llvm* 5 模块）
4. ✅ 标准库底层原语移植（extern fn → C ABI ring_runtime.cpp）
5. ✅ 编译器自身 native 化（B-098 → B-089 → B-099 → B-100）

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
