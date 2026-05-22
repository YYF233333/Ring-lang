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

- **前置依赖**：Linear types（Perceus RC 基础）；迁移正前方需完成 Str Unicode 语义统一（`len`/`char_at`/`slice` 等从 UTF-16 切到 code point 语义，消除 JS-ism）
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

## 已知 Bug / 技术债

### B-022 表达式位置 IIFE return 截获 [bugfix] [P3] [M] [queued]
`let x = { return y; 0 }` 中的 return 被 IIFE 截获。语句位置已修复。

- **当前状态**：实践中极少遇到
- **优先级**：低

### B-023 集合 `===` 引用相等 [bugfix] [P2] [L] [queued]
`List.contains`/`List.find`/`Map.get`/`Set.contains` 使用 JS `===` 引用相等，对 struct/enum 值无法正确匹配。

**方案**：用 Ring 重写（方案 C）——将 contains/find 等从 JS runtime 移到 `std/*.ring`，用 `get(i)` + 长度循环实现，自动走 `==`（Eq trait dispatch）。最干净、后端无关。

**涉及修改**：
1. `std/list.ring`：Ring 实现 `contains`/`find`/`index_of_elem`（需要 `get(i)` + `len()` 底层原语）
2. `std/set.ring`：Ring 实现 `contains`（需要迭代原语）
3. `runtime.ring`：移除对应 JS 实现
4. `builtins.ring`：更新方法注册
5. `tests/cases/`：struct 值的 contains/find 测试

**前置依赖**：B-025（下标运算符）完成后实现更自然
- **优先级**：推迟执行，不急

### B-024 深层嵌套泛型 UFCS 调用 [bugfix] [P3] [L] [queued]
`Pair<Pair<Int, Int>, Int>` 的 `.eq()` 等直接方法调用受限。

- **当前状态**：auto-derive 和 operator dispatch 正常，直接方法调用受限
- **优先级**：低

### B-029 Str 方法补全（编译器急需）[feature] [P1] [S] [queued]
编译器自举中高频 workaround 的方法。API 设计后端无关，不引入 JS-ism。

**新增方法**：
- `trim_start()` / `trim_end()` → `Str`
- `is_empty()` → `Bool`
- `last_index_of(s: Str)` → `Option<Int>`

**涉及修改**：
1. `std/str.ring`：4 个 `pub extern fn`
2. `runtime.ring`：4 个 JS runtime 函数
3. `builtins.ring`：注册到 STR_METHODS（如需）

**验收标准**：
- 方法可在 Ring 代码中调用并正确工作
- 编译器中对应 workaround 可替换

### B-031 消除 Cell\<T\>（完全移除 interior mutability）[design-align] [P1] [M] [queued]
B-019 遗留项。Cell\<T\> 原本用于闭包捕获可变变量，`let mut` + 自动 boxing 已替代此用途。Ring 不保留 interior mutability——需要修改就用 `let mut`。

**涉及修改**：
1. `builtins.ring`：移除 Cell\<T\> 类型注册、Cell 构造函数、CELL_METHODS
2. `runtime.ring`：移除 `Cell` / `Cell_get` / `Cell_set` / `Cell_update` runtime 代码
3. `codegen.ring`：移除 Cell 方法 codegen 注册
4. `compiler/*.ring`：将所有 `Cell(x)` / `.get()` / `.set()` / `.update()` 用法替换为 `let mut` + 直接赋值
5. `tests/cases/`：改写 7 个 Cell 相关测试为 `let mut` + 闭包捕获测试
6. 重新编译 `dist/`

**验收标准**：
- `Cell` 类型不可用（报 unknown type）
- 原 Cell 测试改写为 `let mut` 闭包捕获测试并通过
- 全部 E2E 测试通过
- 自举编译器正常编译自身

### B-030 函数参数 mut enforcement + 全量迁移 [design-align] [P1] [M] [queued]
B-019 遗留项。当前 `mut self` 方法调用检查仅针对 `let` 绑定，函数参数不受限。设计要求：不标 `mut` 的参数不可调用 `mut self` 方法。

**涉及修改**：
1. `infer.ring`：`check_receiver_mutability` 扩展——函数参数也纳入检查（移除 `let_defs` 的特殊豁免）
2. `compiler/*.ring`（33 个文件）：所有接收集合类型（List/Map/Set）并调用 mutating 方法的参数加 `mut` 标记
3. `std/*.ring`：标准库函数参数同步更新
4. `tests/cases/`：新增负面测试（非 `mut` 参数调 `.push()` 报错）
5. 重新编译 `dist/`

**验收标准**：
- `fn foo(list: List<Int>) { list.push(1) }` → 编译错误
- `fn foo(mut list: List<Int>) { list.push(1) }` → 编译通过
- 全部 E2E 测试通过
- 自举编译器正常编译自身

### B-025 下标运算符 `list[i]` / `map[key]` [feature] [P1] [M] [queued]
提供集合直接访问语法。自举时因时间压力漏掉，导致 ~40 个 `_at()` helper 散布在编译器中。

**语义**：
- `list[i]` → 越界 panic（等价于 `list.get(i).unwrap()`）
- `map[key]` → key 不存在 panic（等价于 `map.get(key).unwrap()`）
- 安全访问仍用 `.get()` 返回 `Option<T>` — 两个操作，两种语义，不违反"一种事一种写法"

**涉及修改**：
1. `parser.ring`：后缀 `[expr]` 解析为 `Expr::IndexExpr { receiver, index, span }`
2. `ast.ring`：新增 `IndexExpr` 节点
3. `hir.ring`：新增 `HExpr::IndexExpr` 或脱糖为 `HExpr::MethodCall`（`.get().unwrap()`）
4. `infer.ring`：类型检查——receiver 必须是 `List<T>` / `Map<K,V>` / `Str`，推断结果类型
5. `codegen_expr.ring`：生成 JS 下标访问（List/Str → `[i]`，Map → `.get(key)`）+ 越界检查
6. `tests/cases/`：正面测试 + 越界 panic 负面测试

**验收标准**：
- `list[0]` 编译通过，运行时返回元素或越界 panic
- `map["key"]` 编译通过，运行时返回值或 key 不存在 panic
- `.get()` 仍正常工作
- 自举编译器中 `_at()` helper 可替换为下标语法

### B-026 `catch` arm 穷尽性检查 [bugfix] [P1] [S] [queued]
`catch` 总是消除 `fail` effect（B-020 语义），但 checker 未验证 catch arms 是否穷尽覆盖错误类型。非穷尽 catch 导致类型层面声称"fail 已消除"，运行时却有未处理的错误路径。

**当前状态**：`infer_catch`（`infer.ring:2119`）直接调用 `remove_fail_effect(effects)`，不检查 arms 穷尽性。`check_exhaustive` 已在 match 语句中使用，catch 可直接复用。

**涉及修改**：
1. `infer.ring`：`infer_catch` 中 arms 循环结束后、`remove_fail_effect` 之前，插入 `check_exhaustive(harms, apply_subst(s, error_type), s)`，非穷尽时报 E0601
2. `tests/cases/`：新增正面测试（穷尽 catch 编译通过）+ 负面测试（非穷尽 catch 报 E0601）

**验收标准**：
- 非穷尽 catch 报 E0601，错误信息含缺失的 pattern 描述
- 穷尽 catch（含 wildcard/binding catch-all）正常编译
- 现有 E2E 测试全部通过

### B-027 多行字符串 + Raw String [feature] [P1] [M] [queued]
两个独立的字符串增强，解决不同问题。

**A. 多行字符串：`"..."` 允许跨行**

去掉"字符串必须单行"的限制。转义和插值照常工作。不做缩进 strip——前导空白是内容的一部分。

```ring
let code = "
function ${name}() {
    return ${expr};
}
"
```

解决 codegen 痛点：`runtime.ring` 几百行 `.push()` 可重构为多行字符串 + 插值。

**B. Raw string：`r"..."`**

无转义、无插值。用于正则、Windows 路径、嵌入含 `${` 的 JS 模板字面量。

```ring
let re = r"\d+\.\d+"                    // 字面 \d，不是转义
let js = r"const tpl = `hi ${name}`"    // ${name} 不触发 Ring 插值
let nested = r#"contains "quotes""#     // Rust 风格可变分隔符
```

- `r"..."` — 无转义、无插值、允许多行
- `r#"..."#` — 内容含 `"` 时的嵌套方案

**涉及修改**：
1. `lexer.ring`：允许普通字符串 token 跨行（当前遇到换行可能报错或截断）
2. `lexer.ring`：识别 `r"` 和 `r#"` 前缀，进入 raw 词法模式
3. `codegen_expr.ring`：含换行的字符串生成 JS 模板字面量（backtick）或 `\n` 拼接
4. `tests/cases/`：多行插值、raw 无转义、raw 含 `${` 字面文本、`r#"..."#` 嵌套

**验收标准**：
- 普通 `"..."` 可跨行，插值和转义正常，空白原样保留
- `r"..."` 中 `\n` 是字面 `\` + `n`，`${x}` 是字面文本
- `r#"..."#` 支持内容含双引号
- 现有单行字符串测试不受影响

### B-028 StringBuilder [feature] [P1] [S] [queued]
标准库 string builder，替代 `List<Str>` + `.push()` + `.join()` 的 codegen 模式。

**API**：
```ring
let mut sb = string_builder()
sb.add("hello")              // 追加字符串
sb.line("world")             // 追加字符串 + 换行
sb.add_int(42)               // 追加数字（避免 .to_str() 样板）
let result = sb.to_str()     // 最终化
```

- `string_builder()` → 新建 builder
- `.add(s: Str)` → 追加（`mut self`）
- `.line(s: Str)` → 追加 + `\n`（`mut self`）
- `.add_int(n: Int)` → 追加整数（`mut self`）
- `.to_str()` → 生成最终字符串（`self`，非消耗）
- `.len()` → 当前长度

**涉及修改**：
1. `std/str.ring`：新增 `extern type StringBuilder` + 方法 impl + `string_builder()` 构造函数
2. `runtime.ring`：StringBuilder JS runtime（内部用数组收集，`to_str` 时 `.join("")`）
3. `builtins.ring`：注册 StringBuilder 类型 + 方法
4. `tests/cases/`：基本使用 + 链式构建 + 空 builder

**验收标准**：
- `string_builder()` + `.add()` + `.to_str()` 基本流程工作
- `.line()` 自动追加换行
- 可用于替代 codegen 中的 `List<Str>` + `.push()` + `.join("\n")` 模式

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
