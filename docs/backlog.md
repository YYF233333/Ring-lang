# Backlog

> 活的工作看板。做完的条目删除，只在 git commit message 留记录。
> 条目格式：`### B-xxx <标题> [类型] [优先级] [复杂度] [状态]`
> 状态流转：`queued` → `planning` → `doing` → 删除
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

### B-009 Full Algebraic Effects（Post-resume Handler + Multi-resume）[feature] [P3] [XL] [queued]
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

## 性能优化

### B-011 LLVM Native Backend [feature] [P3] [XL] [queued]
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

### B-019 可变性统一模型（`var` → `let mut`，消除 `Cell<T>`）[design-align] [P0] [XL] [queued]

设计决策 2026-05-22：Ring 的可变性由唯一关键字 `mut` 统一管理。`var` 关键字废弃，`Cell<T>` 包装类型消除。

**设计要点：**

1. **`let mut` 替代 `var`**：`let` = 不可变，`let mut` = 可变。`let` 绑定不可重绑定，不可调用 `mut self` 方法。
2. **`mut` 参数**：`fn foo(mut x: Int)` 表示传入可变引用，修改对调用方可见。调用方的 `mut` 前缀是**可选标注**（编译器从函数签名推断 box），formatter level 2+ 自动插入。
3. **`mut self` 替代 `var self`**：可变方法接收者统一为 `mut self`。`push`/`set`/`clear` 等 mutating 方法为 `mut self`，调用方需要 `let mut` 绑定。
4. **`Cell<T>` 消除**：不再需要包装类型。闭包捕获 `let mut` 变量时编译器自动 box（`{ value }` 对象）；`mut` 参数自动 box。用户无感。
5. **Effect 规则**：
   - `let mut` 纯局部使用 → 不 box，不产生 effect，编译为 JS `let`（零开销）
   - `let mut` 被闭包捕获 → 自动 box，闭包签名含 `mut<T>` effect
   - `mut` 参数 → box 传递，函数签名含 `mut<T>` effect
   - struct 字段修改（`let mut s; s.f = v`）→ 不 box，不产生 effect（局部行为）
6. **`let` 绑定禁止调用 `mut self` 方法**：`let list = []; list.push(1)` → 编译错误。封堵 JS 引用语义的隐式 mutation 通道。

**语法总结：**

```ring
let x = 1                        // 不可变
let mut counter = 0               // 局部可变（JS let，零开销）
counter = counter + 1             // ok

let mut list = [1, 2, 3]
list.push(4)                      // ok — push 是 mut self 方法

fn increment(mut x: Int) {        // mut 参数（自动 box）
    x = x + 1
}
let mut n = 0
increment(n)                      // 编译器从签名推断 box（level 0）
// increment(mut n)               // formatter level 2+ 自动插入 mut 标记
print(n)                          // 1

let mut counter = 0
let inc = fn() { counter = counter + 1 }  // 自动 box，闭包带 mut<Int> effect
```

**涉及修改（按阶段）：**

**阶段 A：语法层（Parser）**
1. `parser.ring`：`let mut` 声明语法（`let` 后接可选 `mut` 关键字）
2. `parser.ring`：`mut` 参数声明（函数参数列表中 `mut name: Type`）
3. `parser.ring`：`mut` 调用语法——调用时 `foo(mut x)` 是可选标注（编译器接受有/无两种写法，语义相同；formatter level 2+ 自动插入）
4. `ast.ring`：`LetStmt` / `Param` 节点增加 `is_mut` 标记
5. `lexer.ring`：确认 `mut` 是关键字（可能已在 `var` 之外注册）
6. 兼容期：`var` 暂时保留为 `let mut` 的别名并产生 deprecation warning

**阶段 B：类型检查层（Checker）**
7. `infer.ring` / `infer_ctx.ring`：`let mut` 替代 `var` 的 `mutable_vars` 逻辑
8. `infer.ring`：`mut self` 方法调用检查——receiver 必须是 `let mut` 绑定
9. `builtins.ring`：标记内置类型的 mutating 方法（`List.push`/`set`/`clear`/`pop`/`remove`/`sort`/`reverse`, `Map.set`/`remove`/`clear`, `Set.add`/`remove`/`clear`）为 `mut self`
10. `infer.ring`：`mut` 参数的类型推断——参数类型标记为"按引用传递"
11. `infer.ring`：闭包捕获分析——检测 `let mut` 变量被闭包捕获，标记需要 box + 产生 `mut<T>` effect
12. `builtins.ring`：移除 `Cell<T>` 注册（struct、impl_methods、constructor）

**阶段 C：代码生成层（Codegen）**
13. `codegen_stmt.ring`：`let mut` 编译——纯局部 → JS `let`；被捕获 → JS `const name = { value: init }`
14. `codegen_expr.ring`：`mut` 参数的 box/unbox——调用时 wrap `{ value: x }`，函数内读写转为 `.value` 访问
15. `codegen_expr.ring`：闭包内对 boxed 变量的访问——`counter` → `counter.value`
16. `codegen_expr.ring`：`mut self` 方法调用——与当前行为一致（方法内部修改 receiver）
17. `runtime.ring`：移除 `Cell` / `Cell_get` / `Cell_set` / `Cell_update` runtime 代码
18. `codegen.ring`：移除 `CELL_METHODS` 注册

**阶段 D：自举编译器迁移**
19. 全部 33 个 `compiler/*.ring` 文件：`var` → `let mut`
20. 全部 `compiler/*.ring`：`var self` → `mut self`
21. 移除所有 `Cell(x)` / `.get()` / `.set()` / `.update()` 用法，改为 `let mut` + 闭包自动捕获
22. `let list = []; list.push(x)` 模式 → `let mut list = []; list.push(x)`
23. 重新编译 `dist/`

**阶段 E：标准库和测试**
24. `std/*.ring`：更新可变性语法
25. `tests/cases/`：更新所有 `var` → `let mut`，Cell 相关测试改写
26. 新增测试：`let` 绑定调用 `mut self` 方法的负面测试
27. 新增测试：`mut` 参数传递、闭包自动 box、effect 推断
28. `examples/*.ring`：更新

- **前置依赖**：无
- **复杂度**：大（语法变更 + 类型检查 + codegen + 全量代码迁移）
- **优先级**：高——可变性是使用最广泛的语言特性，越早统一越好
- **风险**：自举编译器迁移量大（33 个文件），但变更是机械性的（`var` → `let mut`），适合批量处理
- **参考**：Rust `let mut`、Koka `var`（自动 scope effect）、Swift/Kotlin（闭包自动捕获 var）

### B-020 `catch` 语义简化（生命周期模型对齐）[design-align] [P0] [M] [queued]
设计决策 2026-05-22：`catch` 总是消除 `fail` effect，不再区分有/无 catch-all arm 的隐式行为。

**当前实现**：checker 中 `catch` 的 fail effect 消除取决于是否存在 catch-all arm（wildcard/binding 无 guard）。无 catch-all 时 fail effect 保留在签名中。

**目标实现**：`catch` 总是完全捕获 fail effect，从签名中移除。需要部分处理（只恢复某些错误、其余继续传播）时，用户在 catch body 内 `match e { ... => raise(other) }` 显式 re-raise。

**涉及修改**：
1. `infer.ring`：`catch` 表达式的 effect row 处理逻辑——移除"有无 catch-all arm"的分支判断，统一消除 fail
2. `codegen_expr.ring`：`catch` 代码生成——确保总是生成 try-catch 包装（当前可能在无 catch-all 时不生成完整包装）
3. 测试用例：更新/新增 `tests/cases/` 中的 catch 相关测试，覆盖：总是消除 fail、catch 内 re-raise 继续传播
4. 文档：CLAUDE.md 已更新

- **前置依赖**：无
- **复杂度**：小-中（checker 逻辑简化，但需仔细验证 codegen 路径）
- **优先级**：下一批修复

## 已知 Bug / 技术债

### B-021 Impl 方法 Effect 传播 [bugfix] [P1] [M] [queued]
impl 方法的 `fail` effect 在 Pass 1 注册为 `EMPTY_ROW`，Pass 2 推断后不回传。

- **当前 workaround**：parser 用 `__ring_raise_fail` extern fn 直接抛 `__EffectAbort`，codegen 的 `gen_try_catch` 已去除 `has_fail_effect` 前置检查
- **正确修复**：Pass 2 推断后回传 effect 到 TypeScheme
- **前置依赖**：可能受益于 F1（effect 标注语法——标注后 Pass 1 直接读取）
- **优先级**：Phase B 期间顺势修复

### B-022 表达式位置 IIFE return 截获 [bugfix] [P3] [M] [queued]
`let x = { return y; 0 }` 中的 return 被 IIFE 截获。语句位置已修复。

- **当前状态**：实践中极少遇到
- **优先级**：低

### B-023 集合 `===` 引用相等 [bugfix] [P1] [M] [queued]
`List.contains`/`Map.get`/`Set.contains` 使用 JS `===`。

- **当前状态**：Phase B S3 计划迁移到 Eq trait
- **优先级**：Phase B

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

---

> 本文档随 Phase 推进更新。每个 Phase 启动时，从此处挑选特性进入该 Phase 的 spec。
