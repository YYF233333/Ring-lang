# Backlog

> 活的工作看板。做完的条目删除，只在 git commit message 留记录。
> 条目格式：`### B-xxx <标题> [类型] [优先级] [复杂度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（路径唯一，可直接执行）/ `judgment`（需要跨模块推理、Argument 或独立 review）
> 状态流转：`queued` → `planning` → `doing` → 删除
> 决策分支：`doing` → `waiting-feedback`（仅该 item 等用户保留决定）→ 拍板后 `queued`；Repository Steward 同时继续其他无阻塞工作
> 工作流规范见 `docs/workflow.md`

## 层 3 排序（2026-06-27 Discussion 重定，JS 退役完成后启动）

> **2026-07-10 插队更新**：**B-163 C 后端迁移 (XL) 插队为 P0**（B-155 泥潭止损，Discussion 拍板，计划见 `docs/plan-c-backend.md`）。B-152 RIIR 剩余阶段（P4 Set / P1s2 Str / P5）暂停，B-163 完成后在 C 后端上继续。下面原排序在 B-163 之后恢复。
>
> **2026-07-29 B-163 后续更新**：B-163 完成后先执行 **B-168 C-native abort/unwind 实现模型探针 (P0/M)**，由用户依据实测 dossier 拍板，再启动 B-167。原因：B-002 Phase 2 原 LLVM `invoke`/`landingpad` 路径随 LLVM 后端退役失效；B-165 已证明现行 `setjmp`/`longjmp` 有 C 局部变量可见性缺口；B-167 又将改动 effectful function value ABI。先固定 failure/control ABI，避免 B-165、B-167、B-002 各自补丁化并重复改 ABI。audit #255/#256 等不触碰同一控制流/RC 文件的独立修复可并行。

B-151 CI → B-125 unsafe/Ptr<T> (XL) → B-002p1 精简 Drop (L) → B-163 C 后端迁移 (XL) → B-168 abort/unwind probe (M) → B-167 动态 evidence ABI (L) → B-152 RIIR std (XL) → 按 B-168 决策重写并执行 B-002p2 unwind 补全 (L)；后续 B-110 别名追踪 → B-068 用户面。B-111 可在 C ABI 稳定后执行；async 线（B-116 probe → B-007）和类型系统线（B-001 Refinement 需 B-070）在 RIIR 之后。M 项当 XL 间换气穿插；P3 研究最后。

> **战略**：unsafe + Ptr<T> → 精简 Drop → RIIR 标准库，让 Ring 拥有自己的底层，消除 C++ STL 依赖。
> B-002 拆两阶段：Phase 1 精简版（scope-end Drop，够 RIIR 用）先行；Phase 2 的 C-native unwind 模型由 B-168 实测拍板，RIIR 之后补。
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
- **验证架构约束（2026-07-28 竞品复查，Verus / `moon prove` 映射）**：
  1. checker 约束先降到独立、可打印、可缓存的 verification IR，再交给具名可判定片段的 decision procedure；proof/ghost 信息不得渗入 runtime ABI 或改变未启用 refinement 的 codegen
  2. 语言规范必须逐种数值类型声明谓词采用机器整数还是数学整数语义，以及 overflow/wrap/trap 的关系；**禁止以无界整数证明替代可能溢出的机器整数执行**
  3. 每次证明结果携带可审计 trust/assumption ledger：verification IR 指纹、算法/solver 及版本与配置、语言内 assumption/axiom/external specification、使用的整数/内存模型、资源预算
  4. solver 缺失、`unknown`、超预算或遇到不支持构造时不得静默视为已证明；只有规范明确允许的 predicate 才能生成显式 runtime check 兜底，其余 fail closed
  5. 相同输入、工具链与预算必须得到相同结果；缓存只按完整 proof fingerprint 命中，禁止把历史成功掩盖成当前成功
- **新增验收锚点（2026-07-28）**：正例/反例之外，至少覆盖 overflow 模型差异、assumption 可见性、solver 缺失/unknown、资源预算耗尽、proof cache 失效、runtime fallback 可观察性；每例同时断言 verification IR 与 ledger 稳定

### B-002 Drop / RAII [feature] [P1] [XL] [judgment] [phase1-done]

> 2026-06-24 重新设计（Discussion，资源管理模型重构）。2026-06-27 拆两阶段（Discussion，路线图重定）。**真值源 = design.md §7.6（2026-06-24 版）**。Perceus 分层 L2——在 L0/L1 RC 核心之上实现用户 `impl Drop` + 全路径 RAII。

**拆分决策（2026-06-27；2026-07-29 修订）**：Phase 1 精简版（scope-end Drop + move checker，够 RIIR 用）先行，不含 unwind；Phase 2 在 B-152 RIIR 之后补全。原 `invoke`/`landingpad` 路径已随 C-only 方向失效；B-165 触发了升级条件，因此先以 P0 B-168 确定 C-native 模型，再重写 Phase 2 实现 spec。

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

#### Phase 2: Unwind 补全 [P2] [L] [deferred: B-152+B-168]

> **2026-07-29 设计失效标记**：原 LLVM `invoke`/`landingpad` 实现路径随 B-163 退役，不再是可执行 spec。B-168 必须先在 C11 约束下比较「编译器生成 cleanup stack + `setjmp`/`longjmp`」与「显式 failure-status/continuation lowering」，由用户拍板后才能把本阶段推进到 planning/doing；`Weak<T>` 子项不受选型影响。

**涉及修改**：
5. **abort-unwind（重头）**：按 B-168 最终决策实现 C-native failure/control ABI，使 `fail.raise` 穿越任意调用帧时逐帧执行已初始化 owned 值的 Drop glue；不得重新引入 LLVM、平台私有 unwind 或 C++ exception 作为语义地基
6. **`Weak<T>`（子项）**：runtime 对象头扩展 weak_count；`Rc.downgrade()` / `Weak.upgrade()`；rc=0 时执行 Drop 但 weak_count>0 时不 free 内存
7. **try/catch 与可见性**：catch frame、局部变量写入可见性、nested catch、re-raise 与 handler 退出顺序统一服从 B-168 的控制流模型；不得把 B-165 单独以 `volatile` 或无证据的全量装箱掩盖

**Phase 2 验收标准**：
- abort 路径（fail.raise 穿越一个或多个含 Drop 局部的函数）→ 每个已初始化 owned 值恰好 Drop 一次，正常返回/early return 行为不回归
- `Rc<T>` 共享 Drop 类型 → 最后一个 Rc 消亡时 Drop 触发
- B-165 的正常路径、捕获路径、nested catch 与 re-raise 写入可见性都有确定语义和正式回归
- cleanup/failure edge 在 HIR、post-RC 或生成 C 的至少一个稳定层次可机器审计，RC verifier 能覆盖 abort 路径而非只看成功返回
- 完整 C E2E/golden、RC/ASan、自编译与 `dist-c` 文本固定点通过；主干不重新引入 LLVM

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

### B-156 extern fn 声明处 `requires {unsafe}` 签字检查 [feature] [P2] [M] [judgment] [queued]

> 2026-06-27 从 B-125 拆出。B-125 core 完成但 extern fn 签字检查推迟——当前无文件级 `requires` 语法（327 个 extern fn 声明分布在 19 个文件顶层，无 `mod` 块包装），需先设计文件级 `requires` 语法。

**前置**：文件级 `requires` 语法设计

**涉及修改**：
1. Parser：文件级 `requires { effects }` 语法（文件开头，声明之前）
2. Checker：extern fn 声明所在模块必须有 `requires {unsafe}`
3. 19 个文件批量迁移（加文件级 `requires {unsafe}`）
4. `ring audit unsafe` 子命令（列全代码库 discharge 点 + extern 声明点）

**验收标准**：
- 无 `requires {unsafe}` 的文件中 extern fn 声明 → 编译错误
- 现有 std/ + compiler/ extern fn 全部通过（迁移后）
- 自举一致

### B-168 C-native abort/unwind 实现模型探针 [design-align] [P0] [M] [judgment] [queued] [after: B-163]

> 2026-07-29 Discussion 用户拍板 P0/M、保持两候选中立实测。B-163 删除 LLVM 后，B-002 Phase 2 原定的 `invoke`/`landingpad` 路径失效；现行 `setjmp`/`longjmp` 又已由 B-165 证明存在跨 catch 局部写入不可见问题。B-167 随后还会改变 effectful function value evidence ABI，因此必须先确定共同的 C-native failure/control ABI，避免三项工作重复改写控制流、closure prototype 与 RC 证据面。

**目标**：以最小但真实的垂直切片比较两种可移植 C11 实现模型，不在立项时预选赢家：

1. **编译器生成 cleanup stack + `setjmp`/`longjmp`**：raise 沿显式 cleanup record 逐帧执行 Drop，再跳转到 catch；核实 frame 生命周期、部分初始化、局部写入可见性与 callback/FFI 边界。
2. **显式 failure-status/continuation lowering**：仅对可能 fail 的函数增加显式失败返回/continuation 路径，逐调用点传播并在边上执行 Drop；纯函数 ABI 不承担额外参数。核实跨模块/间接调用/effect row 单态化如何稳定标注 fail-capable prototype。

平台私有 unwind、SEH-only、C++ exception 或重新依赖 LLVM 均不进入候选集：它们扩大 TCB、破坏 C11 可移植性，也与 B-163 的后端收口目标相反。

**必须回答的问题**：

1. 正常返回、early return、单帧/多帧 raise、部分初始化、nested catch/handle、handler evidence 失活、re-raise 下，每个 owned 值能否恰好消费一次。
2. B-165 是被模型结构性消除，还是仍需精确 boxed-vars；禁止以 `volatile` 或全量装箱回避 C 标准语义。
3. B-167 的动态 evidence 如何穿过 direct call、closure、跨模块、泛型 HOF、递归/互递归，而不制造第二套不兼容 function-pointer ABI。
4. cleanup/failure edge 能否在 HIR、post-RC 或生成 C 的稳定层次由 `verify_rc` 机器审计。
5. `main`、未捕获 fail/panic、extern C、Ring→C callback→Ring 重入各自的 ABI 与退出语义。
6. 同一生成 C 是否在 Windows Clang、Linux Clang/GCC 的 C11 模式成立；平台差异必须被隔离在最小 runtime 边界。

**探针范围 / 文件所有权**：

- 共享层：`compiler/hir.ring`、`compiler/perceus.ring`、`compiler/verify_rc.ring`
- C lowering：`compiler/codegen_c.ring`、`compiler/codegen_c_expr.ring`、`compiler/codegen_c_runtime.ring`（以 B-163 完成后的实际文件为准）
- runtime：`ring_runtime.cpp` 或 B-163/RIIR 后承接该边界的 C runtime 文件
- 证据：`tests/cases/` 的最小程序、Python runner 与生成 C/汇编/对象尺寸记录
- 两候选原型必须位于隔离 worktree/实验分支；**不得把任一候选的行为改动并入 main**

**验收标准**：

- 两候选运行同一组最小程序，覆盖上述六类问题；生成 C 与 failure/cleanup trace 一并归档。候选若不可行，必须给出最小复现、编译器诊断/崩溃或 C 标准约束等可复核证据。
- 固定源码 commit、编译器版本、target 与 flags，测量正常/失败微基准、生成 C/对象尺寸，以及一次编译器 self-compile 的 build time、run time 与 peak memory；性能只作决策输入，不替代正确性。
- 形成 TCB、跨平台性、B-165 处置、B-167 ABI、Perceus/`verify_rc` 可审计性和迁移复杂度矩阵，明确推荐、否决理由与仍未知项。
- dossier 完成后转 `waiting-feedback` 由用户拍板；root 随决策重写 B-002 Phase 2，并把 B-165 标为结构性关闭/验证项或精确实现项，再细化 B-167 的共享 ABI。探针条目随后按工作流删除。
- main 分支行为零变化；`python .agents/scripts/validate_workflow.py` 通过。

### B-167 effectful function value 调用点动态 evidence ABI [refactor] [P0] [L] [judgment] [queued] [after: B-168]

> 2026-07-28 Discussion 用户拍板“先 C 后 A”。audit #258 先以创建处词法 evidence 收口 checker soundness：handler 只消除显式 custom label，未知 open tail 原样向外传播。本项是最终 A 语义，必须等 B-163 完成 LLVM 后端退役、`dist-c/` 成为唯一 bootstrap 锚且 CI 恢复稳定后再启动；不为即将退役的 LLVM 后端实现第二套新 ABI。**2026-07-29 前置更新**：B-168 必须先拍板 C-native failure/control ABI，本项随后复用其 function-pointer、failure edge 与 RC evidence 契约，不得另造平行 ABI。

**目标语义**：effectful function value 在调用点接收当前 effect evidence。外部创建的 callback 传入 `with_mock_clock` / `with_mock_fs` / `capture_logs` 等高阶 handler 后，其 effect 由调用点内层 handler 截获，而不是继续使用 callback 创建处的旧 evidence。静态 effect row 仍是 capability 真值；调用点只传递签名要求的 evidence，未知 open tail 必须逐项转发，不能被机械消除。

**涉及修改**：
1. HIR / function type lowering：为 effectful function value 固化调用点 evidence 参数布局，覆盖 closed row、open row、泛型 effect row、递归与互递归 closure；共享布局 helper，禁止 codegen 按字符串猜参数顺序。
2. C 后端：统一 closure function-pointer prototype、closure 构造、直接/间接调用、跨模块声明与单态化实例的 evidence ABI；纯函数与无 custom-effect 的调用不承担不必要的动态 evidence。
3. Perceus / RC：明确 evidence 参数为 borrow 还是 owned，验证 env capture、转发、嵌套 handler 和 early return 的 dup/drop 平衡；不得通过泄漏 evidence 规避生命周期问题。
4. 迁移与诊断：把 C → A 作为 breaking change 记录；若旧代码依赖创建处 handler，诊断应指向 callback 创建/调用边界并给出显式 capability 或重构建议。
5. 测试：新增外部 callback 动态截获、handler 内创建 callback、嵌套 handler、多 effect、open-tail 转发、跨模块 callback、泛型 HOF、递归 closure 及 RC/负面回归。

**验收标准**：
- 外部创建的 `Clock` callback 传入内层 fake-clock handler 后使用内层 evidence；同类 mock-fs、capture-logs 形态有正式回归。
- 显式 effect 被当前 handler 消除，未知 open tail 和未处理的其他 effect 精确向外传播；不出现 capability 漏报或错误消除。
- 直接调用、间接 closure 调用、跨模块与泛型 HOF 使用同一共享 ABI 契约；C 生成物的 function-pointer 声明与调用实参一致。
- RC verifier、定向 ASan、完整 C E2E/golden、自编译与 `dist-c` 文本固定点通过；CI bootstrap 在 clean clone 上通过。
- main 不重新引入 LLVM-C、`dist-llvm` 或双后端兼容层；迁移说明明确记录 C → A 的行为变化。

## RIIR

### B-152 RIIR 标准库（纯 Ring 重写 ring_runtime.cpp）[feature] [P1] [XL] [judgment] [paused: B-163]

> 2026-06-27 立项（Discussion，路线图重定）。消除 C++ STL 依赖，让 Ring 真正拥有自己的底层。容器（Str/List/Map/Set）全部用纯 Ring + `Ptr<T>` + Drop 重写。
> **2026-07-10 暂停**：B-163 C 后端迁移插队 P0，剩余阶段（P4 Set / P1s2 Str / P5）暂停，B-163 完成后在 C 后端上继续。P3 Map 已 merge（`8871592`），但 trait-bounded impl 方法 dict 转发 bug 迫使 Map 方法仍走 `method_to_runtime` + C++ bootstrap shim——P3 验收「~30 个 ring_map_* 删除」未闭环，调查并入 B-163 计划（plan-c-backend.md §2.5 #1），修好后回本条目关 P3。
> **2026-07-11 调查结论（B-163 step 5 worker）**：dict 转发 bug **HEAD 无法复现**——bounded impl 五场景 probe（调用位 dict 解析/方法内 bound dispatch/impl 互调转发/HOF closure 捕获 dict/双 bounds）+ Map 真实形状 Ring 路径 probe，LLVM/C 双后端全绿。共享层（resolve_dicts_from_scheme/dict_lower）无缺陷；P3 当时的 double bootstrap 崩溃疑似已被后续修复序列消除，或需自编译规模触发。**闭环实验留 B-163 step 9 后**：C 后端删 Map method_to_runtime 条目 + 全量 sweep + self-compile via C，全绿则删 C++ ring_map_* bootstrap shim，关 P3 遗留验收。
> **2026-07-27 P3 闭环（B-163 step 9）**：Map 的 LLVM/C `method_to_runtime` 映射、下标特殊发射与全部 `ring_map_*` C++ bootstrap shim 已删除；`Map<K,V>` 只走纯 Ring `K: Hash + Eq` 实现，用户 struct 的手写 Hash/Eq dict 已有双后端回归。C/LLVM 三代固定点、全量双后端门禁、RC ×3 与 ASan capstone 通过，P3 遗留验收正式关闭。B-152 仍整体暂停，待 B-163 Phase 2 完成后从 P4 / P1s2 / P5 恢复。
> **2026-07-27 P4 carve-out 决策（Discussion）**：为关闭 B-163 Phase 2 的 Set parity gap，P4 Set 与 B-107 自动 `derive Hash` 从暂停队列提前进入 B-163 P2.2；P1s2 Str 与 P5 仍保持暂停。标准 `Set<T>` 定位为有明确性能契约的哈希集合：语义等价关系来自 `Eq`，高性能表示要求 `Hash + Eq`，复用纯 Ring `Map<T, Unit>`，不得在缺 Hash 时静默退化为 O(n) List 扫描。

**前置**：B-125（unsafe/Ptr<T> 原语）+ B-002 Phase 1（精简版 Drop）

**分阶段实施**（各阶段可独立提交）：

| 阶段 | 内容 | 量 |
|------|------|----|
| P0 | StringBuilder — 管线验证 pilot（extern type → Ring struct + impl Drop + codegen 适配） | M |
| P1 | Str — Step 1 ✅（C++ 去 STL）；Step 2 排最后（需删 Type::StrType 枚举，最难） | L |
| P2 | List\<T\> — `Ptr<T>` + len + cap，替换 std::vector\<void*\> | L |
| P3 ✅ | Map\<K,V\> — 开放寻址哈希表，替换 std::unordered_map（Hash trait + 泛型 key 已兑现） | XL |
| P4 | Set\<K\> — 复用 Map 实现 | M |
| P5 | 清理：删除全部 C++ 残留，`.cpp` → `.c`，`clang++` → `clang`（最终 ~400 行纯 C：RC 核心 + boxing + IO/OS + fail effect + Ptr 原语 + init，详见 design.md §7.12） | M |

**每阶段模式**：
1. 在 `std/` 中用纯 Ring 实现新类型（`unsafe {}` 块内使用 `Ptr<T>` 原语）
2. `impl Drop`（dealloc backing buffer）
3. 删除 ring_runtime.cpp 中对应的 C++ 函数
4. 更新 codegen 映射（`method_to_runtime` + 构造函数 + 特殊 codegen 路径）
5. 保持 E2E + llvm_diff 全绿 + 自举一致

#### P0: StringBuilder pilot（管线验证）

> 2026-06-29 Discussion 拍板。目标：用最小的 extern type 验证完整 RIIR 管线（extern type → Ring struct + impl Drop + codegen 适配 + bootstrap），为后续 Str/List/Map/Set 铺路。

**新 struct 定义**（`std/str.ring`，替换 `pub extern type StringBuilder`）：
```ring
pub struct StringBuilder {
    buf: Ptr<U8>
    len: Int
    cap: Int
}

impl Drop for StringBuilder {
    fn drop(self) with {io} {
        unsafe { dealloc(self.buf, self.cap) }
    }
}
```

**Bridge 函数**（加在 ring_runtime.cpp，临时——P1 Str RIIR 后删除）：
- `ring_str_as_ptr(s: Str) -> Ptr<U8>`：返回 Str 内部字节指针（借用 `std::string::data()`）
- `ring_str_from_ptr(p: Ptr<U8>, len: Int) -> Str`：从 Ptr + len 构造新 Str（`new std::string(ptr, len)`）

**方法实现**（全部纯 Ring + unsafe 块）：
- `string_builder() -> StringBuilder`：初始 cap=64，`alloc<U8>(64)`
- `add(self, s: Str)`：`ensure_cap` + `str_as_ptr` 读 Str 字节 + `ptr_copy` 追加
- `to_str(self) -> Str`：调 bridge `str_from_ptr(self.buf, self.len)`
- `len(self) -> Int`：直接返回 `self.len`
- `add_int(self, n: Int)`：`self.add(n.to_str())`（首版不优化临时 Str 分配）
- `line(self, s: Str)`：`self.add(s)` + 追加 `'\n'` 字节
- `ensure_cap(self, needed: Int)`：cap 不够时 double（`max(cap*2, needed)`），alloc→copy→dealloc

**Codegen 变更**：
1. `codegen_llvm_expr.ring:2891-2896`：删除 5 行 StringBuilder `method_to_runtime` 映射
2. `codegen_llvm_expr.ring:2473`：删除 `string_builder` → `ring_sb_new` 映射
3. `codegen_llvm_expr.ring:~3282-3325`：字符串插值 IR 生成改用 Ring 编译符号名
4. `codegen_llvm.ring:135-139,306-308`：删除 `ring_sb_*` runtime 函数声明
5. `perceus.ring:2488-2495`：验证 StringBuilder 从特殊处理列表移除后 RC 推断正确

**Runtime 删除**：`ring_sb_new`、`ring_sb_add`、`ring_sb_to_str`、`ring_sb_len`、`ring_sb_line`、`ring_sb_add_int`、`drop_sb`（7 个函数）+ `RING_TYPEID_SB` 不再使用

**Bootstrap 策略**：旧编译器（dist-llvm/）编译新源码时，StringBuilder 已从 extern type 变为 struct——旧 codegen 的 `method_to_runtime` 映射查不到新 struct 的方法会走默认 Ring 函数调用路径（需验证）。如旧编译器无法编译 → 在 ring_runtime.cpp 保留 `ring_sb_*` 符号作 compatibility shim，double bootstrap 后删

**P0 验收标准**：
- StringBuilder 所有用法行为不变（构造 + add + line + add_int + to_str + len）
- `impl Drop` 正确释放 buffer
- 字符串插值行为不变
- ring_runtime.cpp 中 7 个 `ring_sb_*` / `drop_sb` 函数删除
- 全部 E2E + llvm_diff ×3 通过
- 自举一致（double bootstrap）
- ASan gating 档 clean

#### P1: Str RIIR（编译器自身最高频类型）

> 2026-06-30 Discussion 拍板。两步走策略（C++ 内部改布局 → Ring 迁移），解决 extern type → struct 的 ABI bootstrap 不兼容。一次性迁移全部 33 个 ring_str_* 函数，不分批。不做 SSO。

**目标 Ring 定义**（`std/str.ring`，替换 `pub extern type Str`）：
```ring
pub struct Str {
    buf: Ptr<U8>
    len: Int
    cap: Int
}

impl Drop for Str {
    fn drop(self) with {io} {
        unsafe { dealloc(self.buf, self.cap) }
    }
}
```

**Step 1：C++ 内部去 STL（bootstrap = 重编 runtime.o + 重链，零风险）**

ring_runtime.cpp 中 Str 的内部表示从 `std::string`（placement-new）改为 C struct `{ char* buf; int64_t len; int64_t cap; }`。所有 33 个 `ring_str_*` 函数签名不变（仍接受/返回 `void*`），内部改用新 struct 操作。`drop_str` 从 `~std::string()` 改为 `free(buf)`。

改完后 Str 的 RC 堆块数据区布局 = `{ char*, int64_t, int64_t }`，与未来 Ring struct `{ Ptr<U8>, Int, Int }` 完全一致。

涉及修改的 33 个函数（全部重写内部实现，签名不变）：
1. `ring_str_new` — 空字符串（alloc buf=64）
2. `ring_str_from_cstr` — 字符串字面量构造（alloc + memcpy）
3. `ring_str_len` / `ring_str_len_u32` — 直接返回 len 字段
4. `ring_str_concat` — alloc new buf + memcpy 两段
5. `ring_str_eq` / `ring_str_lt` — memcmp
6. `ring_str_get` / `ring_str_char_at` — 按字节索引，返回单字节 Str
7. `ring_str_slice` — alloc + memcpy 子串
8. `ring_str_contains` / `ring_str_starts_with` / `ring_str_ends_with` — 字节搜索
9. `ring_str_split` / `ring_str_join` / `ring_str_replace` — 重写为手动内存管理
10. `ring_str_to_cstr` — 返回 buf 指针（确保 null-terminated）
11. `ring_str_trim` / `ring_str_trim_start` / `ring_str_trim_end` — 字节级 trim
12. `ring_str_to_upper` / `ring_str_to_lower` — ASCII-only 逐字节
13. `ring_str_index_of` / `ring_str_last_index_of` — 字节搜索返回 Option
14. `ring_str_is_empty` — len == 0
15. `ring_str_pad_start` / `ring_str_pad_end` / `ring_str_repeat` — alloc + fill
16. `ring_str_char_code_at` — 返回 Option<Int>
17. `ring_str_as_ptr` / `ring_str_from_ptr` — P0 bridge，改为操作新 struct
18. `ring_cl_eq_str` / `ring_cl_ne_str` — closure-wrapped trait dispatch

**null-termination 约定**：buf 始终多分配 1 字节，末尾写 `\0`。`ring_str_to_cstr` 可直接返回 buf。所有创建 Str 的路径都保证此不变量。

**Step 1 验收**：
- 全部 E2E + llvm_diff ×3 通过
- 自编译通过（single bootstrap 即可，无 ABI 变化）
- ASan gating 档 clean

**Step 2：类型系统 struct 化 + Ring 侧迁移（打包，2026-06-30 Discussion 拍板）**

> 方案 A（删除 `Type::StrType` 枚举变体）与 Ring 方法迁移打包执行。理由：分开做需要预注册 typeid 3 作过渡，打包后 typeid 3 随 C++ `ring_str_*` 函数一起删除，更干净。

**子任务 2a：编译器类型系统——删除 `Type::StrType`**

`Type::StrType` → `Type::StructType { name: "Str", type_params: [] }`。`std/str.ring` 中注册 `pub struct Str { buf: Ptr<U8>, len: Int, cap: Int }`，让 `resolve_named_type("Str")` 走 structs map 通用路径。

涉及修改（~26 处，调研结果分类）：

*trivial（22 处，删除 StrType 分支或改为 name 匹配）*：
1. `types.ring`：删除 `StrType` 枚举变体（L34），改 `STR` 常量（L71），删 `type_to_builtin_name`/`types_equal`/`type_to_string` 的 StrType 分支（L120/302/373）——均有 StructType 通用路径兜底
2. `env.ring`：删 `apply_subst_map`/`apply_subst` 的 StrType 分支（L398/511）
3. `unify.ring`：删 `occurs_in`/unify 的 StrType 分支（L43/497）
4. `zonk.ring`：删 `label_vars` 的 StrType 分支（L94）
5. `infer_ctx.ring`：删 `collect_free_vars` 的 StrType 分支（L430）
6. `infer.ring`：改 `is_interpolatable_type` 的 StrType 为 name 匹配（L2092）
7. `infer_helpers.ring`：改 `is_value_type`/`is_primitive_eq`/`is_primitive_ord` 的 StrType 为 name 匹配（L40/444/457）
8. `infer_decl.ring`：删 StrType 注释/分支（L1951）
9. `derive.ring`：改 `field_action_for_type`/`resolve_dict_for_arg` 的 StrType 为 name 匹配（L260/379）
10. `perceus.ring`：改 `is_str_index` 的 StrType 为 name 匹配（L414）
11. `codegen_llvm.ring`：改 `llvm_is_value_type` 的 StrType 为 name 匹配（L1245）
12. `codegen_llvm_expr.ring`：改 `is_str_type` helper 为 name 匹配（L670-674）——所有调用点自动覆盖
13. `codegen_llvm_decl.ring`：改 `is_str_const` 检查为 name 匹配（L514）

*需逻辑调整（4 处）*：
14. `infer_ctx.ring` L1134：**删除** `resolve_named_type` 的 Str 短路——前提是 `std/str.ring` 的 `pub struct Str` 在 infer_register 阶段注册进 structs map。需验证 std 加载顺序
15. `infer.ring` L879：IndexExpr 对 Str 的特殊处理改为匹配 `StructType { name: "Str" }`
16. `codegen_llvm.ring` L762/L830：extern fn Str 参数/返回值 ABI marshalling（Str→cstr / cstr→Str）——改为按 name == "Str" 匹配，不能走 StructType 通用 passthrough

**子任务 2b：Ring 侧方法迁移**

1. `std/str.ring`：`pub extern type Str` → `pub struct Str { buf: Ptr<U8>, len: Int, cap: Int }` + `impl Drop`
2. 所有 33 个方法改为 Ring impl 方法（`unsafe {}` 块内使用 Ptr 原语）
3. `ring_str_from_cstr` 保留为 C++ shim（字符串字面量 codegen 仍需要——codegen 对字面量调 `ring_str_from_cstr(global_cstr)` 构造 Str，此函数不易纯 Ring 化因为 codegen 需要在 IR 层调用它）
4. 删除 ring_runtime.cpp 中其余 ring_str_* 函数 + `RING_TYPEID_STR` + `drop_str`
5. codegen 删除 Str 的 `method_to_runtime` 映射（21 行）
6. P0 bridge 函数（`ring_str_as_ptr`/`ring_str_from_ptr`）删除——Str 已是 struct，直接 `self.buf` 访问
7. Perceus：验证 Str 从特殊处理列表移除后 RC 推断正确

**关键风险点**：
- extern fn ABI marshalling 漏改 → 编译器自身所有 LLVM-C API 调用崩溃（编译器自身大量使用 Str ↔ cstr 转换）
- `resolve_named_type` 时序——std/str.ring 必须在所有 Str 使用前注册
- Perceus `is_str_index` 改后需验证 RC drop 路径不回归
- typeid 弃用——`ring_str_from_cstr`（保留的唯一 C++ shim）内 `ring_alloc(sizeof(RingStr), RING_TYPEID_STR)` 需改为接受动态 typeid 或改由 Ring 侧构造

**Bootstrap 策略**（Step 1 已将 C++ 布局对齐，大幅降低风险）：
- 旧编译器（dist-llvm/）看到 `struct Str` 而非 `extern type Str`，method_to_runtime 可能不匹配（与 P0 StringBuilder 同理）→ fallback 到 Ring 函数调用
- 字符串字面量构造：旧 codegen 仍调 `ring_str_from_cstr`，Step 1 已改为新布局，ABI 兼容
- 旧编译器的 `Type::StrType` 不会传入新源码的 match——新源码已无此变体，穷尽性安全
- **必须 double bootstrap**：stage 0（旧）→ stage 1（新，已无 StrType）→ stage 2 = stage 1（fixpoint）

**Step 2 验收**：
- Str 所有用法行为不变（构造 + 方法调用 + 字符串插值 + RC drop）
- `Type::StrType` 枚举变体从编译器源码中完全删除
- ring_runtime.cpp 中 Str 相关函数仅保留 `ring_str_from_cstr`（字面量 shim）
- `RING_TYPEID_STR` 从 runtime 中删除
- 全部 E2E + llvm_diff ×3 通过
- 自举一致（double bootstrap fixpoint）
- ASan gating 档 clean

#### P3: Map\<K,V\> RIIR — Hash trait + 开放寻址哈希表

> 2026-06-30 Discussion 拍板。引入 Hash trait（同 Eq/Ord 模式），Map 统一为单一泛型实现，消除 Str/Int 双分发 + ~700 行 C++ 重复（#226）。

**Hash trait**（`builtins.ring` 注册，同 Eq/Ord）：
```ring
trait Hash {
    fn hash(self) -> Int
}
```

原语 impl（builtins.ring 注册）：
- `impl Hash for Int`：C bridge `ring_hash_int`（multiply-xorshift mixing）
- `impl Hash for Str`：C bridge `ring_hash_str`（FNV-1a）
- `impl Hash for Bool`：C bridge `ring_hash_bool`（0/1）
- derive Hash 暂不做（编译器自身只用 Str/Int key，用户需求后续加 derive.ring 一行即可）

**Ring struct 定义**（`std/map.ring`，替换 `pub extern type Map<K, V>`）：
```ring
pub struct Map<K, V> {
    meta: Ptr<Int>      // byte buffer（ring_buf_alloc），1 byte/slot：0=empty 1=occupied 2=tombstone
    keys: Ptr<K>        // slot buffer（ring_slot_alloc），void*/slot
    values: Ptr<V>      // slot buffer（ring_slot_alloc），void*/slot
    len: Int
    cap: Int
}
```

**数据结构**：线性探测 + tombstone。负载因子 > 0.75 时 2x 扩容（rehash 到新 buffer，清除 tombstone）。最小容量 8。

**方法实现**（全部 `impl<K: Hash + Eq, V> Map`，纯 Ring + unsafe 块）：
- `map_new<K, V>() -> Map<K, V>`：初始 cap=0，三个 buffer 为空 alloc
- `insert(mut self, key: K, value: V)`：probe → hit 则以 `ring_slot_replace` 借用式替换旧 value（保留首个相等 key）；miss 则写入空/tombstone slot
- `get(self, key: K) -> Option<V>`：probe → hit 则 `ring_slot_read` value（dup）；miss 则 none
- `contains_key(self, key: K) -> Bool`：probe → hit/miss
- `remove(mut self, key: K)`：probe → hit 则 `ring_slot_drop` key+value，meta 置 tombstone
- `keys(self) -> List<K>`：遍历 occupied，`ring_slot_read` 每个 key
- `values(self) -> List<V>`：遍历 occupied，`ring_slot_read` 每个 value
- `entries(self) -> List<(K, V)>`：遍历 occupied，read key+value → tuple
- `len(self) -> Int`：`self.len`
- `is_empty(self) -> Bool`：`self.len == 0`
- `clear(mut self)`：遍历 occupied → `ring_slot_drop` key+value → meta 清零
- HOF 方法（`for_each`/`fold`/`filter`/`any`/`map_values`）：遍历 occupied slots，while 循环（避免 `mut` effect 泄漏）

**Clone**：standalone `map_clone<K, V>(m: Map<K, V>) -> Map<K, V>` 函数（非 `impl Clone`，避免 E0802），遍历 occupied → `ring_slot_read` key+value → 写入新 buffer。

**MapIterator**：保持现有 `MapIterator<K, V>` 结构，`iter()` 方法调 `self.entries()` 构造 List。

**Bridge 函数**（ring_runtime.cpp 新增）：
- `ring_hash_str(s: void*) -> int64_t`：FNV-1a 64-bit（读 RingStr::buf 字节）
- `ring_hash_int(n: void*) -> int64_t`：unbox + multiply-xorshift mixing
- `ring_hash_bool(b: void*) -> int64_t`：unbox → 0/1
- `ring_hash_combine(h1: int64_t, h2: int64_t) -> int64_t`：FNV combine（derive 用，暂不需要）
- `ring_buf_get_byte(p: void*, offset: int64_t) -> int64_t`：`((uint8_t*)p)[offset]` 返回 boxed Int

注意：Ring 无位运算符（AND/OR/XOR/shift），hash 必须由 C bridge 实现。hash 返回值为 boxed Int（tagged pointer）。probe 索引计算 `h % cap` 用 Ring `%` 运算符，负数处理：`let idx = h % cap; let idx = if idx < 0 { idx + cap } else { idx }`。

**Codegen 变更**：
1. `codegen_llvm_expr.ring:2901-2915`：删除 15 行 Map `method_to_runtime` 映射
2. `codegen_llvm_expr.ring:2708-2727`：删除 15 行 `is_int_keyed_map` 分发
3. `codegen_llvm_expr.ring:2728-2748`：删除 Int-Set 分发（P4 同时清理）
4. `codegen_llvm_expr.ring:99-108`：删除 `is_int_keyed_map()` helper
5. `codegen_llvm_expr.ring:2470,2487,2489,2491`：删除 `map_new`/`map_from`/`map_int_new`/`map_int_from` 映射
6. `codegen_llvm_expr.ring:1262-1267`：删除 `map_int_new`/`map_int_from` 构造函数分发
7. `codegen_llvm_expr.ring:4632-4637`：IndexExpr Map 下标特殊路径改为走通用 `get` 方法调用
8. `codegen_llvm.ring:194-212`：删除 `ring_map_*` runtime 函数声明（~20 行）
9. `codegen_llvm.ring:290`：删除 `ring_map_clone` 声明
10. `codegen_llvm.ring:1309` 附近：emit_drop_functions 跳过 Map（同 List）
11. `codegen_llvm_ctx.ring:407-409`：get_or_assign_typeid 加 Map → 5 特殊化

**builtins.ring 变更**：
1. 新增 `register_hash_trait`（同 `register_eq_trait` 模式）
2. 注册 Hash impl for Int, Str, Bool
3. 在 `register_all_builtins` 中调用

**Runtime 变更**：
1. 删除 ~30 个 `ring_map_*` / `ring_map_int_*` C++ 函数
2. 更新 `drop_map`：新 struct layout（meta/keys/values/len_tagged/cap_tagged），遍历 meta occupied → drop key+value → free 三个 buffer
3. 删除 `RingMapInt` typedef + `drop_map_int` + `RING_TYPEID_MAP_INT`
4. 删除 `RING_TYPEID_MAP` 定义（codegen 用 hardcoded 5）——或保留供 drop_map 使用
5. 新增 `ring_hash_str`/`ring_hash_int`/`ring_hash_bool`/`ring_buf_get_byte` bridge 函数

**B-162 workaround**：Map impl 中 `self.len = self.len + 1` 等 FieldAccess scalar reassign 会泄漏旧 boxed Int。暂不修（B-162 单独追踪），接受泄漏。Map 的 insert/remove 频率远低于 List.push，影响可控。

**Bootstrap 策略**：同 List RIIR——旧 dist-llvm/ 看到 `struct Map` 而非 `extern type Map`，method_to_runtime 查不到 → fallback 到 Ring 函数调用（`fdab843` 修复保证）。`map_new()` 等构造函数同理。需 double bootstrap。

**P3 验收标准**：
- Map 所有用法行为不变（构造 + 方法调用 + 下标 + RC drop + clone）
- Hash trait 可用（`impl<K: Hash + Eq, V> Map` 编译通过）
- ring_runtime.cpp 中 ~30 个 `ring_map_*` / `ring_map_int_*` 函数删除
- `RING_TYPEID_MAP_INT` 和双分发逻辑从 codegen 中完全删除
- 全部 E2E + llvm_diff ×3 通过
- 自举一致（double bootstrap fixpoint）
- ASan gating 档 clean

**B-107 边界**：P3 已吸收 Hash trait、primitive impl 与泛型 Map；用户 struct/enum 的自动 `derive Hash` 保留在 B-107，并因 P4 Set 的性能契约提前为 B-163 Phase 2 gate。

#### P4: Set\<T\> RIIR — Map-backed `Hash + Eq` 哈希集合

> 2026-07-27 Discussion 拍板。数学集合的最小语义能力是 `Eq`，但只给 equality oracle 时，任意负向 membership 查询最坏必须检查全部元素，无法提供次线性通用实现。标准库 `Set` 因此把 expected O(1) 作为性能契约，额外要求 `Hash`；Eq-only 容器若未来确有需求，使用显式 `LinearSet<T>` 名称另行立项，不在 `Set` 内做不可见 fallback。

**表示与 API**：
- `std/set.ring`：`pub extern type Set<T>` 改为 `pub struct Set<T> { entries: Map<T, Unit> }`。
- `set_new`、`len`、`is_empty`、`to_list`、`clear` 与结构 clone 不需要做线性查找；`set_from`、`insert`、`remove`、`contains`、`has`、`union`、`intersect`、`difference` 的查询/变更路径统一要求 `T: Hash + Eq` 并委托 `Map<T, Unit>`。
- `SetIterator` 继续基于 `to_list()`，不改变迭代顺序未指定的既有契约。
- 不允许根据 trait 是否存在自动选择 Map/List 表示；Ring 无 overlap/specialization，此类隐藏分流也会让复杂度不可从签名判断。

**自动 Hash 契约（实现归 B-107）**：
- 普通 struct/enum 在所有组成字段可 Hash 且 Eq 为编译器结构化派生时，自动结构化派生 Hash；`Set<Point>` 等既有源码保持零标注。
- 若类型手写了自定义 Eq，编译器不得再偷偷生成结构化 Hash，以免出现 `a == b` 但 `hash(a) != hash(b)`；调用 Set/Map 时要求用户显式提供匹配的 Hash。
- manual Eq/Hash 的一致性属于显式 trait law；本期至少保证编译器自动生成路径由同一结构分解产生。安全的自定义 canonical-key API 可在出现真实需求时另行设计，不扩入本 gate。

**涉及修改**：
1. `std/set.ring`：Map wrapper、全部 Set API、iterator 与 clone。
2. `compiler/builtins.ring` / `compiler/derive.ring` / HIR derived impl 发射：B-107 自动 Hash 与 bound/evidence。
3. C/LLVM codegen：删除 Set/SetInt runtime 特殊映射，直到 LLVM 退役前保持双后端 parity。
4. `ring_runtime.cpp`：删除被新 Ring Set 取代的 `ring_set_*` / `ring_set_int_*` 实现与旧布局 drop 路径；保留 Map/slot 所需 bridge。
5. `tests/cases/`：现有 `api_clone`、`set_struct_eq`、`set_ops_deep_eq` 恢复为双后端正向门，并新增 hash collision、nested/generic struct/enum、manual Eq 无自动 Hash 的负面回归。

**P4 验收标准**：
- Set 的 membership/insert/remove/集合运算只走 Map probe，不存在 List 扫描 fallback；平均复杂度契约为 O(1)。
- Int/Str/Bool、自动 Hash 的 struct/enum、显式一致 Hash+Eq 的自定义类型均双后端行为正确；相等值去重、contains/remove 与 union/intersect/difference 一致。
- 手写 Eq 且无显式 Hash 的 Set/Map 调用给出精确 trait-bound 诊断。
- `api_clone`、`set_struct_eq`、`set_ops_deep_eq` 从 parity known-gap 删除；C/LLVM/diff/RC 相关门 ×3。
- compiler fixed-point 一致；LLVM 退役前更新 `dist-llvm/main.o`，无新增 verifier 差异。

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

### B-107 自动 `derive Hash` + Set P4 性能契约 [feature] [P0] [L] [judgment] [doing: b107-derived-hash-set-p4]

> 2026-06-07 立项；2026-07-27 B-163 step 9 已关闭 Map runtime/shim 部分。2026-07-27 Discussion 用户拍板将剩余自动 Hash 与 B-152 P4 Set 一并提前，作为 B-163 Phase 2 parity gate；优先级随阻塞中的 B-163 P0 上调。完整 Set 表示/API 规范见 B-152 P4。
>
> **2026-07-29 Repository Steward Argument（Set/Map `for-in` owner）**：这是恢复既有 ownership/scope-end 保证的内部实现选择，不是修改安全契约，故无需用户决策。选 A：在 ANF/Perceus/`verify_rc` 前把标准库 Set/Map 的迭代转换显式化为共享 HIR owner；拒绝 B（C/LLVM 各建 cleanup stack，重复且 verifier 不可见）与 C（明知保留 early-return leak，只有这种 waiver 才需用户拍板）。A 的合并硬约束如下：
> - 转换 owner 必须位于循环语句专属 lexical scope：normal / `break` 后立即 drop，`continue` 不 drop，`return` 由统一 RC 路径在克隆返回值后 drop；不得被普通 ANF 提升到包含循环的外层 block 末，以免改变用户 `Drop` / `Weak` 可观测时序。
> - 只按真实 std builtin identity 识别 Set/Map，禁止复制后端按 leaf type name/arity 猜测的逻辑；自定义或 shadow `Set`/`Map` 必须是负面回归，无法确认身份时 fail closed。
> - 合成调用的 type/effect/dict 信息来自共享契约，并同步 iterable element type 为 List 语义；随后删除 C/LLVM 的重复转换与 drop 分支，防止双转换或双 drop。
> - 定向门覆盖 Set/Map × normal/`break`/`continue`/`return`、fresh iterable、返回 loop element、Map destructure、nested loops、用户 `Drop`/`Weak` 的 post-break 时序，以及 C/LLVM/diff/RC verifier。

**自动派生**：
1. `compiler/derive.ring`：把 Hash 纳入 Eq/Clone/Ord/Debug 同一 fixpoint 框架；struct 按字段声明序 combine，enum 必须先混入稳定 variant discriminator 再按字段序 combine，generic 字段产生 `T: Hash` bound。
2. `compiler/hir.ring` 及 C/LLVM derived impl 发射：增加 Hash 方法的 field action / method body，复用 primitive `hash()` evidence 与确定性 `ring_hash_combine`，不得按类型名或地址生成 hash。
3. coherence guard：检测到 manual Eq 时不自动派生结构化 Hash；缺 Hash 的 Map/Set 使用点正常报 trait-bound 错误。编译器自动 Eq+Hash 路径必须共享同一字段/variant 分解。
4. P4 Set：`std/set.ring` 改为 `Map<T, Unit>` wrapper，所有 membership/变更/集合运算要求 `T: Hash + Eq`；不实现隐式 List fallback。

**涉及修改**：`compiler/derive.ring`、`compiler/hir.ring`、C/LLVM derived impl codegen、必要的 builtin/runtime hash combine 注册、`std/set.ring`、Set runtime/mapping 清理及正负面测试。

**验收标准**：
- 自动派生覆盖 plain/nested/generic struct、positional/named/recursive enum；相等值在 C/LLVM 两后端产生相同 hash。
- enum variant discriminator 参与 hash；构造顺序、Map 迭代顺序或地址不影响 hash，compiler fixed-point 保持确定。
- manual Eq 类型不会获得不匹配的结构化 auto-Hash；显式 manual Hash+Eq 仍可用于 Map/Set。
- `Map<自动Hash类型, V>` 与 P4 `Set<自动Hash类型>` 的 insert/get/contains/remove、扩容/rehash和强碰撞回归全绿。
- 关闭三个 Set shared-positive gaps；C/LLVM/diff/RC 相关门 ×3、完整 fixed-point 与 workflow validator 通过。

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
> 2026-07-28 竞品复查：TypeScript 7 已正式发布并有生产反馈，本项不再对 beta/旧 `tsc` 做历史对比；对照固定为正式 TypeScript 7 native compiler。目标是证伪或证实「行为签名降低 agent 总成本」，不是证明 Ring 在所有任务都更强。

**形态（MVP）**：
1. **任务集**：15–25 题（字符串/数据变换/小算法/小 CLI），每题 = 自然语言 spec + 隐藏测试套件 ×（Ring + TS）。改编只替换语言表面（std API 名），不改任务实质。
2. **Ring primer**（关键产物，独立价值 = 未来所有 LLM 的标准 onboarding 文档）：~1–2K token 语法速查 + std 签名表。harness 喂 primer——「零训练数据 + 签名即够」是命题本身。
3. **驱动循环**：headless 驱动被测模型——生成 → 编译（Ring 用 `--error-format=llm`；TS 用正式 TypeScript 7 native CLI，`strict=true`）→ 错误喂回 → 重试（上限 N 轮）→ 跑隐藏测试。两语言协议完全相同；每题 ×3 取均值压噪音。
4. **指标**：首次编译通过率 / 到绿轮数 / 隐藏测试运行时错误率 / 总 token（design.md §11.3 前四项）。
5. 被测模型 Sonnet 级（平均 agentic 代表 + 便宜可多跑；顶级模型硬实力会掩盖语言差异）。放 `eval/`，手动触发，不进 CI（烧 token）。
6. **行为契约子集**：任务集中预注册一组 signature-only/API-use 题；只提供模块签名，不提供实现，覆盖纯函数误用、`io`、`fail<E>`、`mut` 与资源生命周期。TS 题提供语义等价的 `.d.ts`/文档，不额外泄漏答案。该子集直接测量「签名信息密度」，不得事后挑题。
7. **可复现协议**：锁定并记录模型名/版本、system prompt、temperature、上下文和输出预算、Ring/TS compiler commit/version、TS config、机器环境、每轮完整 prompt/diagnostic/patch、token 与 wall-clock。onboarding primer token 单独报告，不得藏入免费上下文。
8. **分析纪律**：预先固定主指标、重试上限与失败分类；报告均值同时给出原始样本和离散程度。结果允许为 Ring 无优势或更差，禁止只发布胜例；版本/协议不一致的 run 标 invalid，不与正式结果合并。

**验收标准**：
- ≥15 题 × 2 语言 × 3 重复跑通，产出指标对比报告
- Ring primer 成文且被 harness 实际使用
- 失败案例归类（语法迁移 / 类型 / effect / std API），形成修缮清单回流 backlog
- 至少 5 题属于预注册的行为契约子集；两语言输入信息量差异逐题可审计
- 发布可重放 manifest 与逐轮原始记录；报告明确列出 null/负向结果、无效 run 和已知混杂因素

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

### B-165 跨 catch（setjmp/longjmp）边界的 `let mut` 写入丢失 [bugfix] [P1] [M] [judgment] [queued] [after: B-168]

> 2026-07-12 立项（B-163 step 6 worker 实测发现，用户拍板方案 b：立案修复，不文档化）。**2026-07-29 前置更新**：暂停单独实现，先由 B-168 确定 C-native failure/control ABI；若显式 failure-status 模型结构性保留普通 C 控制流，本项改为验证后关闭，若 cleanup stack + `setjmp`/`longjmp` 胜出，再执行下面的精确 boxed-vars 方案。

**现象**：`let mut progress = 0; let r = { progress = 1; raise_x() } catch { _ => progress + 100 }` —— catch arm 与后续代码读到 `progress = 0`（写入丢失）。LLVM 与 C 后端 -O2 下行为一致。**gen_try_catch 的 B-089 G-b 注释宣称的「body 内 let mut 赋值对外可见」不成立**：跨 setjmp 修改的非 volatile 局部变量 = C 标准 indeterminate，LLVM IR 层同样被 mem2reg/DSE 优化掉。golden 零覆盖（有则早红）。

**条件修复方向（原拍板，等待 B-168 复核）**：若最终模型仍使用 `setjmp`/`longjmp`，复用 B-091 boxed_vars 装箱机制，不用 `volatile`——在共享层（checker/HIR）识别「catch body 内被写、body 外可见」的 mut 变量，并入 `program.boxed_vars` 集合，复用现有堆 cell 读写路径。若 B-168 选显式 failure-status lowering，则不得为已不存在的 longjmp 边界保留装箱成本，只保留同一回归证明写入可见。

**验收标准**：
- 上述场景双后端输出 `101 1`（写入可见）且 diff = 0
- 新增 golden 用例锁定（catch body 写外层 mut：捕获路径 + 正常路径 + 嵌套 catch）
- 全部 E2E + golden + rc 通过；动 RC 相关（box dup/drop）→ golden ×3

### B-164 alloc 原语 size=0 语义未定义（heap corruption 风险）[bugfix] [P2] [S] [judgment] [queued]

> 2026-07-10 立项（Discussion，B-152 P3 worker_feedback 通知触发）。

**现象**：B-152 P3 中 `map_new()` 用 `ring_buf_alloc(0)` / `ring_slot_alloc(0)` 创建零容量 Map，后续 `drop_map` 处理空 buffer 时 Windows heap validator 报 heap corruption。Worker 以「预分配 8 slot」绕过，根因未定位（怀疑 malloc(0) 返回的 sentinel pointer 被 free 时的行为差异 MSVC vs glibc，未证实）。size=0 分配语义未定义 = P4 Set / 未来用户 unsafe 代码的复踩点。

**涉及修改**：
1. 定位根因：构造零容量分配 + drop 的最小复现，确认是 malloc(0) sentinel、drop 遍历越界读、还是其他
2. `ring_runtime.cpp`：在 `ring_buf_alloc` / `ring_slot_alloc` / `ring_buf_alloc_zeroed` 层显式定义 size<=0 语义（推荐方向：最小分配 1 字节 / 1 slot，保证返回可安全 free 的唯一指针；具体依根因定）
3. 回归测试：零容量分配 + drop 路径

**验收标准**：
- size=0 分配 + drop 在 Windows heap validator + ASan gating 档下 clean
- 根因结论成文（本条目更新或 commit message）
- `std/map.ring` 的「预分配 8」可改为纯容量策略（不再是 corruption workaround）
- 全部 E2E + llvm_diff 通过；自举一致

### B-162 Perceus FieldAccess scalar reassign 不 drop 旧 boxed Int（List RIIR 内存回归主因）[bugfix] [P1] [M] [judgment] [queued]

> 2026-06-30 立项（内存调查：self-compile 9.86GB → 17.36GB，+76%）。

`perceus.ring:1946` 的 `scalar_reassign_drop_name` 只处理 `Ident` 目标。`self.len = self.len + 1` 等 FieldAccess 赋值不 drop 旧 boxed Int，直接泄漏。编译器 push 调用千万量级，每次泄漏 16 字节，量级 ~1-2GB。B-152 P2 前 List 是 extern type，len/cap 是 C++ int64_t，不存在此问题。

**首次尝试记录（2026-06-30，失败）**：W5 pattern（tmp→old→assign→drop 四步序列）导致 385/396 e2e heap corruption。根因未完全定位——可能是 `target` HExpr 在 Let init 和 Assign target 两处复用时 codegen 产生了意外行为（gen_expr vs emit_assign 对 FieldAccess 处理差异），或 raw target 未经 RC 处理导致 codegen 期望不匹配。需要先在 codegen 层面确认 FieldAccess 作为 Let init 的 dup/drop 行为。

**替代方案方向**：
- (A) 在 codegen 层面修（emit_assign 对 scalar FieldAccess 目标生成 load-old + drop-old + store-new）——绕过 Perceus 层复杂性
- (B) 修正 Perceus W5 pattern——需要理解 gen_expr(FieldAccess) 是否生成 dup，确保 target 复用安全
- (C) codegen 对 Int/Bool struct 字段使用 inline storage（不 box）——根治，但工作量大

**涉及修改**：
1. `compiler/perceus.ring`（方案 B）或 `compiler/codegen_llvm_expr.ring`（方案 A）
2. `compiler/verify_rc.ring`：同步更新 scalar field overwrite 报告

**验收标准**：
- `self.len = self.len + 1` 等 FieldAccess 赋值正确 drop 旧 boxed Int
- self-compile 峰值内存显著下降（预期回到 ~10GB 量级）
- 全量 e2e + llvm_diff 通过
- 编译器自举一致

### B-160 rebind_fn_type / update_fn_effects 不查 impl_methods [bugfix] [P2] [M] [judgment] [queued]

> 2026-06-30 立项（B-159 修复过程中发现的残留问题）。

`rebind_fn_type`（infer_decl.ring:1815）和 `update_fn_effects`（infer_ctx.ring:551）都用 `ctx.env.lookup(name)` 查 scope stack，但 impl 方法在 `trait_reg.impl_methods` 映射中，查不到。导致 impl 方法 body check 后的 inferred effects/return type 不回写 scheme。

B-159 靠注册时共享 closure 参数 effect tail 绕过了 HOF 场景，但非 HOF 的 impl 方法（如声明了 effects 但 body 实际 effect 更窄的方法）可能有 effect 信息不准确的问题。

此外，prelude 方法的 check 路径不走 `check_one_decl_with_rebind` 而是直接 `check_decl`，修了会导致编译器自身大量 W0001——需要协调处理 prelude 注册的 effect 推断。

**局部 `let mut` 泄漏（2026-07-10 并入，B-152 P3 worker_feedback 触发）**：impl 方法体内 `let mut i = 0; while i < n { ... }` 会把 `mut` effect 泄漏到方法签名（CLAUDE.md RIIR 陷阱 #2；P3 `map_new` 再次命中，被迫新增 `ring_buf_alloc_zeroed` C bridge 绕过）。局部变量的 mutation 外部不可观测，不应成为签名 effect——修复时需确认这是与回写同区的 masking 缺失还是独立 bug，一并处理。

**涉及修改**：
1. `infer_decl.ring`：`rebind_fn_type` 增加 `impl_methods` 查找路径
2. `infer_ctx.ring`：`update_fn_effects` 同上
3. `infer_decl.ring`：prelude check 路径走 rebind（需处理 W0001 级联）
4. 局部 `let mut` 的 `mut` effect 在函数边界 mask（不泄漏到签名）

**验收标准**：
- impl 方法的 scheme 在 body check 后正确反映 inferred effects 和 return type
- prelude 方法（List::map 等）的 scheme 正确
- impl 方法体内局部 `let mut` + while 循环不泄漏 `mut` effect 到方法签名（RIIR 陷阱 #2 场景可删除；`ring_buf_alloc_zeroed` workaround 可回退为 Ring 侧循环初始化）
- 编译器自举一致 + 全量测试通过

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

### B-163 C 后端迁移：codegen 从 LLVM-C API 改为 C 源码发射 [refactor] [P0] [XL] [judgment] [doing: phase2-gap-fix]

> 2026-07-10 立项（Discussion，B-155 泥潭止损 + 后端信道结构性分析）。**完整执行计划见 `docs/plan-c-backend.md`**，执行前必读。

**一句话**：codegen 后端从"91 个 extern fn 在内存里搭 LLVM IR"改为"纯 Ring StringBuilder 发射 C11 源码 + shell out clang"。编译期零 FFI、零 marshalling、零 LLVM 链接，产物可读可 diff，`#line` 映射让 sanitizer 报告直指 .ring 源码。HIR 之前全链路 + Perceus + runtime 零改动。

**Phase 0 ✅（2026-07-10）**：链式重放 21 代完成（方案 A，JS 锚点 0bd7822 → HEAD）。「执行层污染」假设**推翻**——B-155 为现行源码活 RC bug（已回填 B-155 条目，改写为方向 C 审计）。干净 dist-llvm@HEAD = `1e2bc9d`。**注意**：Phase 1 验收「.c 文本字节一致」被 B-155 gate，方向 C 审计需在 Phase 1 收尾前完成（并行不冲突）。

**Phase 1 ✅**：C 后端实现（叶到根九步，见 plan §2.2）。移植期间 LLVM 后端保留为差分 oracle——双后端同用例输出 diff = 0。
> **进度（2026-07-10）**：steps 1–3 ✅（`4edc7a1`+`ba76b67`，golden 子集 14/14 三重判据全绿：C==.expected、双后端 diff=0、.c ×2 字节一致）+ 双后端差分 harness ✅（`4314e1a`，run_tests.py `--backend=c`/`--suite diff`/`C_SKIP`/`--filter`，diff opt-in）。exec_sync runtime 已补实现（此前 std 声明但 native 从未实现）。
> **进度（2026-07-11）**：step 4 ✅（`2b85e9f`，struct/enum 构造 + 字段访问/赋值 + match/if-let + record row 访问；golden 28 + e2e 47 子集三重判据全绿，diff 82/0；全量 C sweep：llvm 84/213、e2e 256/380，余项全为 step 5/6 stub + drop_basic step 7 窗口）。sweep 逼出两个 C 侧修复（调用位局部作用域优先、同名 impl first-wins）并分诊出 audit **#243**（LLVM 同序潜伏 miscompile）/ **#244**（mangling 歧义根因）/ **#245**（**critical 共享 wrong-code**：ctor 嵌套 literal 不比值，双后端一致，oracle 污染面）。**#245 插队修复 ✅（`95f79c3`，2026-07-11）**：ctor 字段位 literal 值比较 + tuple 元素位 ctor 递归 + or-pattern invalid IR/wrong-code 一并修复（双后端同改 diff=0）；穷尽性层排查正确无需修（E0601 负面回归锁定）；golden 零污染（旧错误行为未烤入任何 .expected）。范围外分诊出 #246（catch arm 无嵌套检查，step 6 注意项已入 §2.5）/ #247（预存在 verification failed）。**step 5 ✅（`f80f202`，2026-07-11）**：closure/trait dict/evidence 七类 stub 清零 + B-141 default trait methods 全链 + derived impls；trait 方法序单一来源落 `hir.ring`（§2.5 #2 达成，LLVM 私有副本未切换、Phase 2 随退役删）；#243 顺带修复；**§2.5 #1 调查结论：dict 转发 bug HEAD 无法复现**（双后端五场景 probe + Map Ring 路径 probe 全绿，共享层无缺陷；闭环实验 = C 后端删 Map method_to_runtime + 删 ring_map_* shim，留 step 9 自编译后做，成则关 B-152 P3 遗留验收）。C sweep：step 5 面清零，剩余 44+46 fail 全为 step 6 面 + drop_basic（step 7）。分诊入 audit：#248/#249（LLVM 侧已知缺陷，deferred 退役）/#250（CLI out-dir 不对称）。**step 6 ✅（`9140506`，2026-07-12）**：effect handler（setjmp/longjmp abort + evidence struct tail-resumptive）+ catch（复用 emit_c_match_arm 统一链）+ default evidence 收口；**#246 同波修复**（四形态 wrong-code + verifier error 实锤，catch_pattern_needs_chain 路由 + 嵌套检查接入，回归 expected 手写）。C sweep：**llvm 218/0**，e2e 380 pass / 1 fail（仅 drop_basic = step 7 面）；diff 五 filter 全绿；LLVM 回归 ×2 全绿。LLVM_SKIP 重评估：4 用例 C 下 PASS（含 2 个 LLVM AV crash 用例——差分信道兑现）、6 用例双后端同构失败 = 共享层缺陷（证据已回填 #219/#220/#221）。分诊入 audit：#251（high：abort arm body 从不执行，静默 wrong-code）/#252（catch 顶层 tuple/or LLVM 空分支）/#253（gen_lambda cleanup stack 泄漏，deferred 退役）。**[决策] 待用户拍板**：跨 longjmp 的 `let mut` 写入丢失（见 worker_feedback.md，文档化 vs 立案修复）。**遗留处置**：4 个 C-PASS 用例挪出 LLVM_SKIP 的 runner 分化机制留后续波。**step 7 ✅（`03abbcc`，2026-07-12）**：emit_c_drop_functions（用户 Drop struct + enum payload 递归 + 注册序列内联 main）+ RC 消费完整性核对（19 处 dup/drop 发射位点无遗漏零修补）+ E0801/E0802/E0803 边界验证。**里程碑：C sweep ×3 零失败（e2e 381/0、llvm 219/0 三轮全同）= 单文件模式全覆盖**；diff 全量 504/0/36。一处对 oracle 的正确性偏离（用户 drop 补齐 evidence 实参 = audit #254）。分诊入 audit：#255（high：impl Drop for enum 用户 drop 不调用，两后端同 gap）/#256（high：Result payload 不递归释放同构泄漏）/#244 撞名补充。CLAUDE.md RIIR 陷阱 #1 已修正（容器 drop 实际走 runtime 固定 tid，非 codegen 生成）。**下一步 = step 8**（extern fn/FFI 声明、emit_c_main 收口、模块初始化 + project mode → `C_BACKEND_SUPPORTS_MODULES` 翻 True；顺带补 E0803 负面用例）→ step 9（自编译冲刺 + B-155 判别实验 + B-152 P3 闭环实验）。未移植面 grep `c_stub_` 可列全（现仅防御性 guard）。

> **2026-07-15 step 8 二次 review（未 merge，waiting-feedback）**：`68999dd` 的 function/project 骨架经对抗 review 发现五类 blocker：E0803 负面用例缺 `.error` 实际零覆盖；`rebind_fn_type` effect FTV 过度泛化且未保持 SchemeBound/assoc constraints；嵌套 module prefix 拼接错误；module-qualified C symbol 经 `c_sanitize` 非单射；effect/mut/call-graph registry 用 bare fn name 跨模块串线。修复 worktree 已完成前三类核心补丁和定向回归，但进一步 probe 实锤更深的共享模块身份缺口：checker/HIR/ModuleExports 对 nominal type 与 re-export value 均不保存定义模块 origin。两个模块各有不同布局的 private 同名 struct 时，check 通过但双后端 codegen metadata 覆盖后 panic；同名 enum 在 C 后端可 build/link，却生成 wrong-code 并 0xC0000005。另 mut alias 因 `resolve_uses` 不传播 `fn_mut_params` 仍失败。需要用户拍板：扩大 step 8 建立 module nominal identity/origin 契约，或明确收窄 Phase 1 project 支持面后完成函数级收尾。主分支仍停 step 7，step 9 未开始。f3394d4 LLVM self-compile 基线 ×3 的 main.o/IR 均逐字节一致，故 step 8 最终合并仍须恢复 LLVM ×3 确定性，不能直接用 B-155 豁免。
> **用户决策（2026-07-15）**：选择 **A，彻底修复**。step 8 扩大为 module-qualified nominal identity + resolved export origin 的完整契约修复；同时闭合 alias 后的 mut/ABI 元数据传播，不以 project 子集或 fail-closed 收窄替代。完成 LLVM self-compile ×3 gate 后停下汇报，不进入 step 9。
> **额度停止点（2026-07-15，未 merge）**：方案 A 的实现与正式对抗用例已在隔离 worktree 提交为 WIP `d4c1c0a`（base `68999dd`，worktree clean）。已覆盖 canonical nominal/trait/effect identity、DefId-bound value origin、resolved pattern、SCC exact scope、named/module/transitive/inline pub-use origin、可逆 C symbol，以及 effect rebind 约束保持；但最后 bootstrap 尚未通过，不能宣称 step 8 完成。原始 stage-0 已越过 ExternType ABI chicken-and-egg，最后仅报 `exports.ring` inline helper 两处不存在字段；两处已删但依停止指令未重跑。完整 provenance、验证边界和续跑顺序见 `docs/worker_feedback.md`；step 9 未开始，恢复时必须先完成 WIP bootstrap 与双后端 gate，禁止直接 merge/进 step 9。
> **恢复（2026-07-19）**：额度已恢复，按上述保存点与顺序继续 step 8。已复核 WIP HEAD、worktree clean 与原始 stage-0 SHA256；当前先重跑最新源码 bootstrap，再执行定向双后端回归和 LLVM self-compile ×3 gate，仍不进入 step 9。
> **再次停止点（2026-07-21，未 merge）**：新 WIP checkpoint `fa22ac2` 已提交到原隔离 worktree。已修 method export canonical identity、type alias/export namespaces、C `ring_` prefix symbol collision、module main E0403、exact self/super/qualified SCC 与 inline 依赖闭包；bootstrap 进一步定位到 canonical fn scheme rebind 未同步同 DefId 源码短名，当前补丁已落盘但未重编验证。inline raw ABI extern-fn re-export/enum ctor 用例、二代自举、双后端 gates、LLVM self-compile ×3仍未完成。完整 provenance 与恢复首序见该 worktree `docs/worker_feedback.md`；step 9 未开始。
> **step 8 ✅（2026-07-23，本 merge commit）**：C project/module codegen、extern/FFI bridge、module-qualified nominal/effect/trait identity、resolved re-export origin、alias 后 mut/ABI metadata 与诊断显示全部收口，`C_BACKEND_SUPPORTS_MODULES = true`。最终门：e2e LLVM 435/0、e2e C 439/0、LLVM golden 219/0、RC 536/0、diff 重跑 543/0；LLVM self-compile 三轮对象 3/3 字节一致。`dist-llvm/main.o` 连编两次二进制零差异，SHA256 `61C49BC9BE7185B3FE94064A5A59E038843E77401414DACFA83208EFE4FD8EF9`。一次 diff 首跑出现两个与 B-155 已知形态相同的间歇 `0xC0000005`；两个用例各独立 ×3 与完整重跑均通过，证据保留在 worker feedback，未静默忽略。**下一步 step 9 仅排队，尚未开始。**
> **step 9 ✅（2026-07-27，本 merge commit）**：C self-host、B-155 C 信道判别与 B-152 P3 闭环完成。Map 的后端特殊映射/C++ shim 全部删除，compiler intrinsic identity 改为用户不可拼写；LLVM lazy dict getter 改为 forward registration，关闭 audit #249。终验发现并彻底修复另一处 compiler-scale RC blocker：用户无字段 enum ctor 在 HIR 中是 `Ident`，但 codegen 实际分配 fresh box，旧 Perceus 因把它当 borrowed 而每次 escape 多 clone 且不 materialize operand；修复以精确 ctor `DefId` provenance 贯穿 builtins、direct/inline/named/wildcard/transitive import/re-export、HIR/Perceus/move checker/RC verifier，显式保留 `Option_none` borrowed singleton 例外，并用同名 local/const/fn/跨模块 shadow 负面对抗锁定。分配探针从每轮 **3N live** 降为常数 1；compiler-scale 计数从 `4,475,020,322 alloc / 4,292,365,880 free / 182,654,442 live` 降至同 alloc 下 `4,468,103,421 free / 6,916,901 live`（live 减少约 96.2%）。
>
> 固定点：C self-host 三代 `main.c` 均为 17,837,093 bytes、SHA256 `7F65EB315DE702FB2C1B75EC5542DA30471ECE8495FE3DFA95801025027983C3`；9741 个 `ring_cstr` 的 raw-byte/escape hard scan 无 NUL/control、长度错配、坏 escape、异常 padding、`[109]`/`[1410]` 或 ≥1000-byte 膨胀。LLVM anchor 三代 `main.o` 均为 4,744,208 bytes、SHA256 `F481CC52F6CDF89CDC42B36C3365231A71A5247567811677D6DC51828FFB6DA3`，已写回 `dist-llvm/main.o`。最终门：C e2e `449/0/17`、C golden `220/0/1`、diff `552/0/20`、RC 三轮各 `542/0/2`；最终聚合 runner `1211/0`（LLVM e2e `445/0/21`、golden `220/0/1`、RC `542/0/2`、self-compile `4/0`）。ASan gating 15/15，full-strength capstone（`quarantine_size_mb=256:malloc_context_size=12`）4:07:21 完成、零 sanitizer error，产出的 `main.c` 与三代 C 固定点同哈希。聚合绿轮前两次独立 LLVM e2e 曾分别出现 3 个和 1 个无诊断 `0xC0000005`（`442/3/21`、`444/1/21`），四个信号均独立 ×3 全绿且未跨轮重复，按 B-155 既有 LLVM 信道残留如实保留；最终完整绿轮不抹除间歇证据，也不阻塞已由 C/diff/固定点/ASan 闭合的 Phase 1。**停止于 Phase 1；Phase 2 尚未开始。**

**Phase 2（进行中）**：B-100 (Z) 策略 parity 认证 → LLVM-C 后端 tag `llvm-c-backend-final` 归档删除 → dist-c/（.c 文本）成为唯一 stage 0 信任锚 → 删除 main 中的 dist/ 与 dist-llvm/ → CI bootstrap 重启（文本 diff）→ 文档 bookkeeping（清单见 plan §3）。

> **Phase 2 P2.1 parity 证据基线 ✅（2026-07-27，merge `156b005`）**：新增 machine-readable `tests/parity_matrix.json` 与 `--suite parity`，由 `hir.ring` / `ast.ring` 反向校验 HExpr 27 + HStmt 13 + HDecl 13 + Pattern 7 全变体，并覆盖 8 个后端结构面；runner 的旧 `LLVM_SKIP` 已拆成 repo-relative 的 LLVM-only / shared-positive / check-only 三类真实 gap，`native_only` 四个手写 oracle（含 `EXPECT_PANIC`）恢复进 Python runner，C self-compile 现真正比较 `main.c`，新增 `HDecl::Test` 双后端独立用例。对抗 review 修复了 marker 越界假绿、单 lane 自证、basename 串线、错误 HIR evidence、orphan golden 和字符串伪 enum 六类证据门漏洞；当前矩阵 **65 covered / 13 known-gap / 3 manual-evidence / 0 fail**。
>
> 合并前真实全集：C e2e `458/0/12` + golden `222/0`；LLVM e2e `457/0/13` + golden `222/0`。全量 diff 两轮分别 `563/2/12`、`562/3/12`，5 个失败全为 LLVM 编译进程无诊断 `0xC0000005`，且五个用例互不重复、各自独立 ×3 全绿；原始整轮失败如实保留，未伪造全绿。audit #220 的 `exhaustive_generic_payload` 已在 C/LLVM/diff 恢复并删单。当前硬门仍有 **1 LLVM-only + 11 shared-positive + 1 check-only** gap，以及 **3 个 manual-evidence**（死的 `HStmt::Dup`、C `#line`、extern-handle RC 结构断言）。**下一步 = P2.2 gap 修复与 manual gate 自动化；LLVM tag/删除、dist-c 切换均未开始。**
>
> **P2.2 进度（2026-07-27）**：audit #222 ✅——tuple 越界字段访问记录 E0304 后不再继续索引/panic，以 `ErrorType` 安全恢复；含补丁的 C-self-host compiler 实测负向诊断 E0304、合法 tuple field access 通过，matrix 变为 **66 covered / 12 known-gap / 3 manual-evidence**。`CHECK_ONLY_GAPS` 已清零；剩余语义门为 1 LLVM-only + 11 shared-positive。
>
> module-qualified effect evidence ✅——统一反解 `__ring_ev_` 参数，结构性保留 file-module `$$_` canonical boundary，仅还原 inline `::`；C/LLVM 的 main、lookup 与 user-drop 五个消费点已收口。新增 unqualified/inline 与真实多文件 `pkg$effects$$_child::InlineDefault` 双后端回归，独立对抗 review PASS；matrix 现为 **68 covered / 11 known-gap / 3 manual-evidence**，剩余 1 LLVM-only + 10 shared-positive。LLVM bootstrap 的 verifier warning 在 clean `97bbd64` 与 patched 同命令下逐字一致且都产出对象，排除本补丁回归。
>
> default effect body pipeline ✅——default body 现完整穿过 `andor_lower`、`dict_lower`、ANF、Perceus 与 HIR verifier，参数作用域、borrow/escape 与五字段 `HEffectOp` 重建均纳入正式回归；定向 C/LLVM/diff 各 ×3、RC 与 self-verify 通过。LLVM anchor 三代 fixed-point 对象逐字节一致（4,749,677 bytes，SHA256 `A1604D96EDD13A449905A85B81415B6207D805BF24F19D44F113F68ADF6794D8`）并写回 `dist-llvm/main.o`；matrix 现为 **69 covered / 10 known-gap / 3 manual-evidence**，剩余 1 LLVM-only + 9 shared-positive。完整 C 聚合门 `1296/0`（e2e 462、llvm 222、RC 543、parity 69；24 项按 matrix/既有契约 skip）。LLVM 聚合首轮为 e2e `461/0/10`、llvm `220/2`、parity `69/0/13`；`adversarial_effect_closure` 与 `recursive_fn` 均无诊断退出 `0xC0000005`，各自独立 ×3 全绿，按 B-155 既有 LLVM 信道间歇证据如实保留，不伪记全绿。
>
> Set P4 方向已拍板（2026-07-27）——标准 `Set` 保留数学上的 Eq 语义，但以 expected O(1) 为公开性能契约，要求 `Hash + Eq` 并复用 `Map<T, Unit>`；自动 `derive Hash` 提前为本 Phase 2 gate，普通结构类型保持零标注。禁止缺 Hash 时静默退化为 O(n) List；实现与验收归 B-107 / B-152 P4。
>
> handler mutable capture + struct named-pattern ✅——handler arm 在 infer 阶段按真实 closure 深度触发 outer `let mut` auto-box；C/LLVM capture 与 extern-classifier walker 递归遍历 handler arms，并按 arm params/resume binder 隔离 lexical scope，真 arm-in-arm 三层传递与 false-capture/extern shadow 均有生成物静态证据。struct named-pattern 现按字段名递归检查 literal/nested ctor，并在 match/catch/if-let 全路径恢复 pattern/arm bindings，避免 sibling/else/join 污染。两个原 shared gap 与扩展回归均由正式 C/LLVM/diff runner 执行通过，RC 门通过；#251 abort-arm 行为保持未变。matrix 现为 **71 covered / 8 known-gap / 3 manual-evidence**，剩余 1 LLVM-only + 7 shared-positive。LLVM anchor 三代 fixed-point 对象逐字节一致（4,757,685 bytes，SHA256 `401CD341752CF61339BB758085E7EF4BDFACC895613116A8AE79E8124EF1EBBE`）并写回 `dist-llvm/main.o`；audit #219 已关，#221 收窄为 tuple equality，另立 #257 跟踪 verify_rc 的 local-shadow 旧 alloca 假设。
>
> abort handler 方案 A ✅（2026-07-28，audit #251 已关闭）——双后端在捕获 `fail.raise(payload)` 后先退出当前 catch/evidence 作用域，再绑定参数并恰好执行一次 arm；arm 结果成为整个 `handle` 结果，arm 内 re-raise 逃向外层。checker 统一 handle/arm 结果并保留 arm 的 io/re-raised fail effects；开放 HOF effect row 会按 payload 做精确约束，registration-owned 单态变量不会被误泛化，owner-qualified associated type provenance 可安全还原时保留、无法表示的 equality/structured/open-record 冲突 fail-closed。新增显式/未标注/nested/mixed/跨模块与多 owner 正负回归；matrix 现为 **77 covered / 7 known-gap / 3 manual-evidence**，剩余 1 LLVM-only + 6 shared-positive。最终源码下 C e2e `486/0/6`、LLVM e2e `485/0/7`、RC `548/0/2`、parity `77/0/10`；diff `575/2/7` 的两项均为既有 LLVM 无诊断 `0xC0000005`，同快照独立重试全部通过并如实保留。合并后完整 main runner 为 e2e `484/1/7`、golden `223/0`、RC `548/0/2`、self-compile `4/0`、parity `77/0/10`；唯一失败 `module_nominal_enum_pattern_tags` 同样是无诊断 `0xC0000005`，隔离复验 `3/3` 通过，不重跑整轮掩盖原始信号。LLVM `main.o` 三份独立产物逐字节一致（4,828,560 bytes，SHA256 `A084097B38A14988F79C250768B2B455FC71471C7F92D908A0A37D6849BF614E`）。
>
> tail-resumptive handler C 方案 ✅（2026-07-28，audit #258 已关闭）——arm 结果与 operation return type 统一，`Never` 不再污染 fresh generic return，arm effects 在过滤 handled body label 后向外合并；同一 handle 的 multi-op arms 共享 canonical effect 实例。所有显式 effect-row occurrence 在按 name 去重前统一参数，覆盖 row 内/跨 row 与 alias 展开冲突，未知 open tail 不参与该检查。现阶段 closure 保留创建处词法 evidence，handler 只消除 body 中显式 custom label；最终调用点动态 evidence 独立归 B-167。独立 reviewer 的 duplicate-label、Never-first、pure/open-row multi-op probes 全部转为预期拒绝；tail e2e `9/0`、LLVM golden `1/0`、#251 双后端回归与 RC self-verify 全绿，上一源码轮完整 e2e `492/0/7`。
>
> 退役锚去留已拍板（2026-07-28）——`llvm-c-backend-final` 必须先指向仍含 LLVM-C 后端、dist/ 与最终 dist-llvm/ 的可恢复快照；dist-c/ 的冻结 `main.c`、构建脚本、clean-clone 构建与 C self-compile 文本固定点全部验证后，在后续 retirement commit 从 main 同时删除 dist/ 和 dist-llvm/。main 不保留 legacy 副本或压缩包，历史调查与紧急恢复统一 checkout tag。验收还须证明删除后的 bootstrap/CI 不依赖 Node、llvm-addon、LLVM-C 或两个旧锚。

**验收标准**：
- Phase 1：全部 E2E + golden 210+ 在 C 后端通过；双后端差分 diff = 0（除显式 skip）
- Phase 1：self-compile via C 后端 ×3 **.c 文本字节一致**（B-155 验收升级版）
- Phase 1：ASan capstone 全量通过
- Phase 2：LLVM 退役、dist-c anchor、CI bootstrap 重启与 bookkeeping 清单全部完成

**排序影响**：B-152 RIIR 剩余（P4 Set / P1s2 Str / P5）建议暂停，本条完成后在 C 后端上继续（纯 Ring 代码天然跨后端）。远期 LLVM target 重启 gates 见 plan §4（届时走修宪程序）。

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


### B-158 `get_or_declare_runtime_fn` 与 Ring 编译函数同名 LLVM 冲突 [bugfix] [P2] [M] [judgment] [queued] [deferred: B-163p2-retire]

> 2026-06-29 B-152 P0 worker 发现。
> **2026-07-11 分诊注记（worker feedback 回流）**：本条目机制是 LLVM 后端特有（`get_or_declare_runtime_fn` 的 module 级声明冲突）——**随 B-163 Phase 2 LLVM 后端退役消亡，不单独修**。C 后端在 steps 1-3 已结构性解决同类问题：撞 runtime 符号表的 prelude Ring 函数定义加 `__ring` 后缀，调用点经 CFnInfo.c_name 透明解析。残余愿望（ring_sb_* C++ 函数删除）归 B-152 P5（RIIR runtime 收官），不归本条。Phase 2 退役清单执行时确认删除本条目。

**现象**：Ring 编译的函数（如 `ring_string_builder`）已存在于 LLVM module 中时，`get_or_declare_runtime_fn` 再声明同名但函数类型不同的外部函数，LLVM 自动加 `.XX` 后缀，导致链接时 undefined symbol。

**影响**：gen_string_interp 无法迁移到 Ring 编译符号（当前保留旧 ring_sb_* C++ 函数作为 workaround）。

**2026-06-29 尝试记录**：用 `get_ring_fn`/`get_ring_toplevel_fn`（从 ctx.functions 查找）替代 `get_or_declare_runtime_fn`。单文件 e2e 通过，但 project mode 自编译 panic：`get_ring_toplevel_fn` 用当前模块前缀（如 `ring_parser$$_string_builder`）查找，但 `string_builder()` 定义在 `str` 模块（应为 `ring_str$$_string_builder`）。核心问题：prelude 函数跨模块查找在 project mode 下需要知道定义模块。已 revert。

**涉及修改**：
1. 需要解决 prelude 函数跨模块查找：codegen 在 project mode 下需要能找到其他模块（如 std/str）定义的函数的正确 mangled name
2. 可能需要在 ctx 中维护 prelude 函数的 mangled name 映射，或在 forward-declare 阶段记录

**验收标准**：
- gen_string_interp 可使用 Ring 编译的 StringBuilder 函数（单文件 + project mode 均可）
- 旧 ring_sb_* C++ 函数可删除
- 全部 E2E 通过；**自编译通过**（project mode 验证）

### B-155 自编译 IR 非确定性：字符串常量含堆垃圾（LLVM 信道残留）[bugfix] [P0] [L] [judgment] [queued] [deferred: B-163p2-retire]

> 2026-06-27 立项（Discussion，CI bootstrap 失败调查）。2026-06-30 深度调查（见下）。
> **2026-07-10 Phase 0 定性（B-163 链式重放 21 代 + 完美对照实验，commit `1e2bc9d`/`361c490`）**：「执行层污染 / 尸体遗传」假设**推翻**——**活 bug 在现行源码**，经 native RC（Perceus dup/drop 生效）暴露；JS 后端 GC 下 RC 是 no-op 故全程不可见。判据（0bd7822 完美对照对，同源码同 LLVM，唯一变量 = 执行信道）：JS 执行 0 垃圾 + 三次重编与提交版逐字节一致；native 执行（干净 JS 锚点 .o 链接的 ring.exe）64×`[109 x i8]` + ×2 重编不一致；干净链条复现间歇性 0xC0000005（~1/3 命中，同一 RC bug 的致命形态）。本条目改写为**方向 C 审计**。
> **Phase 0 收窄线索**：膨胀常量 = 31 字符 Str 常量（allocator size class 32）emit 时 Length 变 108（前 31 字节 + null 正确，后 77 字节堆垃圾）；引用处 `ring_str_from_cstr` strlen 截断 → 运行时行为无恙（解释测试全绿可自举）。非确定性 100% 局限于膨胀常量内容（HEAD ×3 各轮 .ll 互 diff 恰好 69 行 = 69 个 `[109 x i8]`，零 .text/语义差异）。垃圾**计数**由源码代际决定（每轮恒定，内容随机）：`[14xx]`×210 仅存在于 27815e0（B-159）~951de21 代际，6198020（P3 Map RIIR）后消失且 109 型 64→69——B-159/B-152 改动交叉点是归因起点。膨胀机制疑似发生在 marshalling 之前（编译器堆内 Str len 已脏，Phase 0 判读）。
> **基线**：干净 dist-llvm@HEAD = `1e2bc9d`（provenance 全程可追溯 JS 锚点 0bd7822）。取证数据持久化于 `C:\Users\Yufeng Ying\Desktop\Ring-lang-artifacts\b155-replay-2026-07-10\`（逐代比对 CSV + 全部构建日志 + 0bd7822 JS/native 完美对照 .ll 对；各代 .ll/exe 体积大未存，可按 CSV 重放复建）。
> **2026-07-10 审计中断快照（方向 C 半程，用户拍板绕过转 B-163 Phase 1）**：① 膨胀 = 读取时 `s->len` 已脏而 buf 完好——数组类型（Ring 层 `value.len()+1`）与 initializer 长度（marshalling 层 `ring_str_len_u32`）两条独立路径一致读到 108，LLVM 越界抄 108 字节把相邻堆烤进常量；② Length 恒 108/1408 非随机 → 覆写者是系统性固定模式，108 为偶数排除 tagged Int 覆写，受害块 = RingStr header（24B raw，size class 32）；③ 受害 Str 全部是**插值构造的临时**（`"${type_name} { "` 类）；④ `gen_str_lit_simple`/`build_global_cstring_decl` 两层 IR 的 RC 时序正确（drop 全在 scope-end）→ 嫌疑上移至 `gen_string_interp` 插值构造层（B-158 revert `a5fb9a4` 可能是同 bug 另一形态）或 Perceus 跨函数传参 borrow 推断；⑤ **07-01「strlen==len 零 mismatch」结论不可靠**（当时诊断跑在脏 stage 上），重启时需在干净 stage 重验。**重启序（性价比排序）**：ASan 单用例循环（复现候选：`string_builder.ring` / `handle_try_return_cleanup.ring` 编译进程曾间歇 AV）→ free 毒化二分 → 插值路径审计 → Perceus extern 约定审计。
> **推迟决策（2026-07-10 用户拍板）**：B-163 Phase 1 step 2（字符串字面量发射）= 本 bug 判别实验——.c 文本带垃圾 → 拿文本证据重启审计（好查一个量级）；.c 干净 → bug 为 marshalling 层特有，随 LLVM 后端退役消亡。Phase 1 收尾验收「.c 字节一致」仍被本 bug gate。
> **2026-07-27 Phase 1 终验**：C self-host 三代 `main.c` 逐字节一致（17,837,093 bytes，SHA256 `7F65EB315DE702FB2C1B75EC5542DA30471ECE8495FE3DFA95801025027983C3`），9741 个 `ring_cstr` 的 hard scan 未发现 NUL/control、声明长度错配、padding、坏 escape、`[109]`/`[1410]` 或任何 ≥1000 字节膨胀常量；full-strength ASan compiler self-compile 4:07:21 完成且生成同哈希文本。C 信道上的历史堆垃圾与非确定性已排除。LLVM anchor 本身三代对象一致，但测试执行仍可间歇出现无诊断 `0xC0000005`，且既有 +1 NUL marshalling 异常形态仍在，因此不能把 B-155 普遍关单；剩余 LLVM 信道问题随 B-163 Phase 2 退役收口，Phase 1 不再另开方向 C 修复。

**现象**：`ring.exe build compiler/main.ring --target=llvm` 两次编译产出的 LLVM IR 不一致。64 个 `[109 x i8]` + 210 个 `[1410 x i8]` 常量包含编译进程的堆数据，每次运行不同。代码段（.text 反汇编）两次编译完全一致，差异仅在 `.rdata`。

**2026-06-30 调查结论**：
- **非确定性 100% 在 pre-opt IR**（Ring codegen 层，非 LLVM 优化 pass）
- 所有 64 个 109 字节常量都是**恰好 31 字符**的字符串（如 "Result in ring_Result_unwrap_or"、"Option in ring_zonk$$_zonk_expr"）——应为 `[32 x i8]` 但变成 `[109 x i8]`（多 77 字节脏数据）
- `ring_str_to_cstr` 断言通过：`strlen(buf) == s->len`，null-termination 正确
- strlen 不匹配诊断：**零匹配**——C API 层面一切正确
- **不是 bootstrap 传播**——每次运行独立产生非确定性（stage2≠stage3，但两个都能运行）
- `gen_str_lit` 的编译输出 IR 确认 `ring_str_to_cstr` → `LLVMBuildGlobalStringPtr` 之间无 drop/alloc

**2026-07-01 深度调查（LLVMConstStringInContext 绕过 + C wrapper 实验）**：

排除的假设：
- ❌ **LLVMBuildGlobalStringPtr 的 strlen 读垃圾**——改用 LLVMConstStringInContext（显式 len）后 `[109 x i8]` 完全不变。commit `d1a52ea`
- ❌ **UAF（buf 在 ring_str_to_cstr 返回后被释放）**——strdup 防御无效，`[109 x i8]` 不变
- ❌ **ring_str_to_cstr 返回损坏数据**——运行时诊断确认每次调用时 `strlen(buf) == len`，零 mismatch

确认的事实：
- `ring_str_to_cstr` 在被调用时返回正确数据（strlen==len），但 LLVM API 收到的 Length 参数不是 31
- 小文件（`test_str31.ring`）的 31 字节字符串正确产出 `[32 x i8]`——**问题只在自编译（大文件）时出现**
- C wrapper `ring_const_string(ctx, cstr, len)` 完全绕过 `StrToCstrAndLen`，用标准 `StrToCstr` + `IntToI32` 传参——消除了 `[109 x i8]`（**0 个！**），但引入了新的 crash（ring_fix.exe 自编译时 0xC0000005）
- C wrapper 的 crash 可能是因为 `StrToCstr` marshalling 让 Perceus 过早 drop 了 Str 参数

**根因定位（2026-07-10 修订）**：~~编译器 binary 自身常量损坏导致行为异常~~——已被 Phase 0 推翻（干净链条照样产生垃圾）。现行结论：现行源码存在活的 RC/marshalling 生命周期 bug，`StrToCstrAndLen` 特殊路径生成的 IR 形式正确但运行时 Length 值膨胀，小文件正确大文件出错（堆翻腾相关）。

**下一步 = 方向 C（唯一主方向）**：**Perceus extern fn 参数生命周期审计**——检查 `StrToCstr`/`StrToCstrAndLen` marshalling 对 Str 参数的 RC 语义：是否过早 drop Str 对象导致同 run 内堆块复用、len/buf 被"新住户"改写。辅助手段：(A) 反汇编比对 `build_global_cstring`（检查 Length 实参来源）；间歇性 0xC0000005 用 ASan gating 档抓（CLAUDE.md ASan 两档跑法）。

**与 B-163 关系**：方向 C 审计与 Phase 1 移植并行不冲突（plan §5 风险表）；但膨胀机制疑似在 marshalling 之前（编译器堆内 Str len 已脏）——若为通用 RC 排序 bug，C 后端 emit 的字符串字面量同样受影响（文本层肉眼可见）。**B-163 Phase 1 验收「self-compile ×3 .c 文本字节一致」被本 bug gate，Phase 1 收尾前必须修**。

**验收标准**：
- `ring.exe build compiler/main.ring --target=llvm` 两次编译产出字节一致的 `ring_output.ll`
- 垃圾常量归零（`[109 x i8]` 型膨胀消失）+ 自编译间歇性 0xC0000005 消失（llvm_diff ×3 全绿）
- CI bootstrap（self-compile ×3 一致性检查）通过

---

---

## 架构：后端策略（2026-06-27 更新）

> **2026-07-10 更新**：**B-163（C 后端迁移）已立项 P0 queued**——完成后本节改写为：C 源码发射为唯一后端，LLVM-C 后端 tag 归档。远期 LLVM target 重启 gates 见 `docs/plan-c-backend.md` §4（Phase 2 bookkeeping 时迁入 design.md）。在此之前下述内容为现状描述。

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
- **QBE(Ring)**：编译器自包含是远期愿景，不主动规划。**2026-07-10 角色修正**：若未来实施，定位为"第三信道 / 信任锚"（naive、显然正确、只参与差分与 DDC），永不担任生产后端——角色约束全文见 `docs/plan-c-backend.md` §4（Phase 2 bookkeeping 时迁入 design.md）。

## 已取消特性

### `or` 兜底表达式
design.md 2.3 层级 1。已被 Option 方法（`unwrap_or` / `unwrap_or_else`）取代，不再实现。

### Dependent Types Lite（B-003）
取消原因：功能与 Refinement Types（B-001）+ Const Generics（B-070）完全重叠。"依赖类型"的三个核心能力——值参数化类型（= const generics）、等式约束（= const generic unification）、值谓词约束（= refinement on const params）——已分别归入 B-070 和 B-001。不引入"依赖类型"概念，降低用户认知负担。

### Full Algebraic Effects（B-009）
Post-resume handler + multi-resume。取消原因：tail-resumptive + abort 覆盖 95%+ 实际需求，剩余用例用 async effect + defer 解决更好。实现复杂度（delimited continuation + 资源安全）与工程价值不成比例。

---

## TODO（非正式立项，备忘）

> 尚未正式立项（无 B-xxx 编号），但值得记录的想法和发现。正式推进时再开 B-xxx 条目。

- **位运算符（AND/OR/XOR/shift）**：Ring 当前无位运算。hash 函数必须走 C bridge。后续如果有更多 low-level 场景需求，考虑加 `&`/`|`/`^`/`<<`/`>>` 运算符（lexer/parser/infer/codegen 全链路，LLVM 对应 `LLVMBuildAnd`/`LLVMBuildOr`/`LLVMBuildXor`/`LLVMBuildShl`/`LLVMBuildAShr`）。当前被 hash 需求触发但不阻塞（P3 Map RIIR 靠 C bridge 绕过）。
- **impl Drop + impl Clone 互斥（E0802）放松**：当前 Drop 类型禁止 auto-derive Clone。容器（List/Map/Set）用 C++ drop 函数 + standalone clone 函数绕过。长期考虑放松为"有 Drop 的类型 Clone 必须手动 impl"而非完全禁止。依赖 B-002p2 unwind 做稳后再评估。

---

> 本文档随 Phase 推进更新。每个 Phase 启动时，从此处挑选特性进入该 Phase 的 spec。
