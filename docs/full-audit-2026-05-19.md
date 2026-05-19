# Ring-lang 全仓库审计报告

**日期**: 2026-05-19
**审计方法**: 5 路并行审计（4 个 Claude Opus 专项 agent + 1 个 DeepSeek V4 Pro 独立全量审计），交叉验证后人工汇总去重。
**审计范围**: 编译器全部源码、语言设计文档、测试套件、LSP 实现、VSCode 插件。

---

## 执行摘要

| 严重度 | 数量 | 分类 |
|--------|------|------|
| **Critical** | 6 (原报 7, C4 为误报; I4 也为误报) | ✅ C1-C3,C5-C6 已修复; C7 用户决定保持现状 |
| **Important** | 18 | ✅ I1,I3,I7-I9 已修复; I2 改善错误提示; I4 误报; I5-I6 推迟; ✅ I16-I18 文档更新; I10-I15 下批次 |
| **Minor** | 25 | ✅ M4-M5,M8,M10,M23-M24 已修复; ✅ Batch 2: M1,M3,M6-M7,M9 代码质量 + M11-M18 测试覆盖 + M19-M22 文档 + M15(E0302激活,E0104/E0401清理); M2 保持现状; M25 推迟 |

**交叉验证结论**：
- Claude 4 个 agent 独立发现了 `__ring_dt` 命名冲突（3/4 确认）和 `collect_free_vars` tuple 遗漏（3/4 确认），属于高置信度发现
- DS 漏掉了所有 Critical 级 bug，但发现了 Claude 未注意到的 `..` 优先级偏离和 raw string 限制
- 5 路审计在文档过时问题上完全一致

---

## Critical（7 项）

### C1: `let_destructure` codegen 临时变量名 `__ring_dt` 硬编码冲突 ★★★

**发现者**: Claude 代码质量 + 类型系统 + 语言设计 + 测试覆盖 (4/5)
**位置**: `compiler/src/codegen/codegen.ts:473-484`

所有 `let (a, b) = expr` 解构语句生成固定名称 `const __ring_dt`。同一 block 内两个解构必现 `SyntaxError: Identifier '__ring_dt' has already been declared`。

```ring
fn main() {
  let (a, b) = (1, 2)
  let (c, d) = (3, 4)  // JS runtime crash
}
```

**影响**: 100% 必现 bug，任何使用两个 let 解构的程序都会 crash。
**修复**: 使用递增计数器 `__ring_dt_${counter++}` 或为每个解构包裹 block scope。

---

### C2: `collect_free_vars` 遗漏 `tuple` 和 `effect_row` 类型 ★★★

**发现者**: Claude 代码质量 + 类型系统 + 语言设计 (3/5)
**位置**: `compiler/src/checker/infer.ts:101-130`

`collect_free_vars` 的 switch 没有 `case "tuple"` 和 `case "effect_row"` 分支。当遇到这两种类型时直接 fallthrough 结束，不收集其中的类型变量。

**影响**: 直接影响 `generalize` 和 `free_type_vars_in_env`。当 let 绑定的类型是包含类型变量的 tuple 时（如泛型函数内 `let pair = (x, y)`），`generalize` 可能错误地将环境中的类型变量量化为 forall，导致 unsound 的多态类型。当前由于 tuple 元素通常是具体类型不太容易触发，但随着 tuple 使用增多会变成真实问题。

**修复**: 添加 `case "tuple"` 遍历 `t.elements`，`case "effect_row"` 遍历 effects + tail。

---

### C3: `label_vars`（zonk.ts）遗漏 tuple 元素递归 ★★

**发现者**: Claude 类型系统 + 语言设计 (2/5)
**位置**: `compiler/src/checker/zonk.ts:36-57`

`label_vars` 的 switch 没有 `case "tuple"`，落入 `default: return t`。Tuple 内部的类型变量不会被标记上友好名称。

**影响**: LSP hover 对泛型 tuple 类型显示 `?42` 而非 `T`。更严重的是 zonk 后 tuple 元素中的残留变量名不会被标记，可能在后续处理中产生意外行为。
**修复**: 添加 `case "tuple": return { ...t, elements: t.elements.map(e => label_vars(names, e)) };`

---

### ~~C4: `or` 对 Option 路径的默认值 eager evaluation 语义不一致~~ **[误报]**

**发现者**: Claude 语言设计 (1/5)
**审查结论**: 此项为**误报**。JS ternary 运算符本身就是短路求值——`((v) => v._tag === "some" ? v._0 : expensive())(opt)` 中 `expensive()` 只在 `v._tag !== "some"` 时才执行。Option 路径和 fail 路径在惰性方面是一致的。

---

### C5: Effect row unification 直接 `set` tail 变量绕过 occurs check ★★

**发现者**: Claude 类型系统 (1/5)
**位置**: `compiler/src/checker/unify.ts:283-299`

当两个 effect row 都有 tail 且存在 unmatched effects 时，代码直接 `result.set(ra.tail, row_for_a_tail)` 而不通过 `unify` 函数。跳过了 occurs check。`unify_record_rows`（行 498-500）也有同样问题。

**影响**: 理论上可创建无限 effect row type，导致 `apply` 或 `type_to_string` 无限递归爆栈。实践中极难触发（需要自引用 effect row），属于理论 unsoundness。
**修复**: 在直接 set 前添加 occurs check。

---

### C6: `List.find` codegen 无法区分 `undefined` 元素与"未找到" ★

**发现者**: Claude 类型系统 + 语言设计 (2/5)
**位置**: `compiler/src/codegen/codegen.ts:599-603`

```javascript
((__r) => __r !== undefined ? { _tag: "some", _0: __r } : { _tag: "none" })(receiver.find(callback))
```

JS `Array.prototype.find` 在未找到时返回 `undefined`。如果 List 元素本身是 `undefined`（如 `List<Unit>` 中 Unit 编译为 `undefined`），会错误返回 `none`。

**影响**: 对 `List<Unit>` 调用 `find` 时结果错误。当前 Unit 很少存入 List，实际触发概率低。
**修复**: 使用 `findIndex` 替代 `find`：`(__i) => __i >= 0 ? { _tag: "some", _0: receiver[__i] } : { _tag: "none" }`

---

### C7: `==`/`!=` 对非原始类型使用 JS `===` 引用比较，静默产生错误结果 ★★

**发现者**: Claude 语言设计 (1/5)
**位置**: `compiler/src/codegen/codegen.ts:519` + `compiler/src/checker/infer.ts:1182-1186`

```ring
let a = [1, 2, 3]
let b = [1, 2, 3]
print(a == b)  // false! JS 引用比较
```

List、Map、Set、Struct、Enum（带字段）的 `==` 比较都使用 JS `===`，对复合类型是引用比较而非结构比较。代码编译通过，类型检查通过，运行时行为违反用户期望。比较运算符 `<`/`>`/`<=`/`>=` 也有同样问题——`some(1) < some(2)` 通过类型检查但 JS 对象比较结果总是 `false`。

**影响**: 最容易被人类和 LLM 写出、最难调试的 bug 类型。已知限制但缺乏编译器级别的防护。
**建议**:
- 短期：限制 `==`/`!=`/`<`/`>` 只能用于 primitive 类型（Int, Float, Str, Bool），复合类型使用时报编译错误
- 中期：实现 Eq/Ord trait 后解锁

---

## Important（18 项）

### 语言设计 (6)

**I1: `or` 双用途 dispatch 依赖类型推断时机**
- **位置**: `compiler/src/checker/infer.ts:1889-1922`
- `infer_or` 先推断 `expr` 类型再检查是否 Option。如果类型仍是 TypeVar（未 resolve），静默走 fail 路径。用户无法直观判断走哪条路径。
- **建议**: 类型无法确定时报编译错误而非静默选 fail 路径。

**I2: `for..in` 不支持 Map 迭代**
- **位置**: `compiler/src/checker/infer.ts:914-933`
- iterable 白名单只有 Range/List/Set，Map 不在其中。用户需 `for entry in map.entries() { let (k, v) = entry; ... }`，比其他语言冗长。
- **建议**: 短期改善错误提示；中期支持 `for (k, v) in map` 语法糖。

**I3: Range `..` 只有排他上界，无 `..=` inclusive range**
- **位置**: `compiler/src/parser/parser.ts:34` + codegen
- `0..10` 不包含 10。缺少 inclusive range 导致 off-by-one 错误风险高。从 Rust 转来的用户会本能寻找 `..=`。
- **建议**: 作为小增量添加 `..=` 运算符。

**I4: `..` 运算符优先级与 Rust 偏离** *(DS 独有发现)*
- **位置**: `compiler/src/parser/parser.ts:26-39`（Prec.Range = 7，在 Compare 和 AddSub 之间）
- Ring 的 `a + 0..x` 解析为 `a + (0..x)`，Rust 解析为 `(a + 0)..x`。当前影响有限（Range 几乎只在 `for x in 0..N` 中使用），但一旦与其他运算符混用就产生语义差异。
- **建议**: 降低 `..` 优先级到接近 Assign 级别（匹配 Rust），或文档明确标注差异。

**I5: `try` block 一刀切吞掉所有 `fail` effect**
- **位置**: `compiler/src/checker/infer.ts:2137-2146`
- `try { ... }` 捕获体内所有 `fail` effect，无法选择性只转化 `fail<ParseError>` 为 Option 而保留 `fail<IoError>`。
- **建议**: 考虑支持 `try<ParseError> { ... }` 形式的类型化 try。

**I6: `List.push`/`Map.insert`/`Set.insert` 名称暗示 mutation**
- **位置**: `compiler/src/checker/env.ts` 方法注册 + `runtime.ts`
- 这些方法返回新集合而非原地修改，但名称在 JS/Python/Rust 中都暗示 mutation。LLM 和人类会直觉认为 `xs.push(4)` 修改了 `xs`。
- **建议**: 考虑 `append`/`with_key`/`with_value` 等明确表示产出新值的名称。

### 编译器正确性 (5)

**I7: struct/enum unification 缺少 type_params 长度检查**
- **位置**: `compiler/src/checker/unify.ts:385-405`
- 只匹配名字后直接遍历 `a.type_params`，不验证 `a.type_params.length === b.type_params.length`。长度不等时可能丢失或越界。
- **修复**: 添加长度不等时抛出 `UnificationError`。

**I8: `resolve_named_type` 不验证 type_args 数量**
- **位置**: `compiler/src/checker/infer.ts:2237-2255`
- 用户写 `List<Int, Str>` 或 `List`（错误数量的类型参数）不会报错，可能产生字段 type_params 长度不一致的类型表示。
- **修复**: 添加 type_args 数量检查。

**I9: `infer_effect_op` 不验证参数数量**
- **位置**: `compiler/src/checker/infer.ts:1505-1561`
- 多余参数被静默忽略，缺少参数的对应类型不被验证。
- **修复**: 添加参数数量匹配检查。

**I10: Tuple 穷尽性检查按列独立，多列组合 false negative**
- **位置**: `compiler/src/checker/exhaustive.ts:90-103`
- `match (x: (Bool, Bool)) { (true, true) => ... (false, false) => ... }` 按列检查被认为穷尽，但实际缺少 `(true, false)` 和 `(false, true)`。
- **影响**: 运行时 `__match_fail`。已知限制但对 tuple 使用场景频率高于 struct。
- **修复**: 实现 pattern matrix 算法（如 Maranget's），至少对小 arity tuple 做交叉验证。

**I11: `update_fn_effects` 原地修改 TypeScheme 对象**
- **位置**: `compiler/src/checker/infer.ts:207-212`
- Pass 2 后回填 effects 时修改环境中已存储的 TypeScheme。如果其他地方持有旧引用（如 Pass 2 中先被 check 的函数对后续函数的调用），可能看到不一致的 effects。
- **建议**: 评估 effect fixpoint 或在 Pass 1 注册时使用 open effect row。

### 代码质量 (4)

**I12: LSP 4 个 feature 模块各自实现 HIR 遍历，高度重复**
- **位置**: `compiler/src/lsp/features/` 下 hover.ts/definition.ts/references.ts/completion.ts
- 四套遍历代码各约 100-200 行，结构完全相同。每新增一个 HExpr variant 需在 4 处同步修改。
- **建议**: 实现通用 `visit_hir(program, visitor)` 遍历器。

**I13: `env.ts` 的 `register_builtins` 方法约 660 行**
- **位置**: `compiler/src/checker/env.ts:119-776`
- 注册 List/Map/Set/Str 等所有内置类型方法签名，大量重复样板。
- **建议**: 拆分为 `builtins.ts`，引入辅助函数如 `register_pure_method(type, name, params, ret)`。

**I14: 内置类型名 magic string 散布各处**
- **位置**: `infer.ts`, `codegen.ts`, `env.ts`, `completion.ts` 多处
- `"Range"`, `"List"`, `"Set"`, `"Map"`, `"Option"`, `"Cell"`, `"Str"` 等裸字符串比较，与 `hir/index.ts` 中使用 `ENUM_TAG_FIELD` 等常量的做法不一致。
- **建议**: 在 `types/index.ts` 或 `hir/index.ts` 中定义 `BUILTIN_LIST = "List"` 等常量。

**I15: codegen `impl_methods` 与 env.ts `register_builtins` 双向维护**
- **位置**: `compiler/src/codegen/codegen.ts:92-119` vs `compiler/src/checker/env.ts`
- 新增内置方法需在两处修改且无编译时检查。如果 `JS_RESERVED` 中移除 `Map`，所有 Map 方法调用会断掉。
- **建议**: 从共享数据源自动生成，或添加 assertion 验证。

### 文档 (3)

**I16: CLAUDE.md 测试数量全线过时**
- **发现者**: Claude 测试覆盖 + DS (2/5)
- 文档声称 212 E2E / 64 正向 / 77 文件 / 221 单元测试
- 实际为 233 E2E / 71-72 正向 / 85 文件 / 227 单元测试
- **需要**: 全局更新所有数字。

**I17: CLAUDE.md Phase 3a Batch 4（Map/Set）未标记已完成**
- **发现者**: Claude 测试覆盖 + DS (2/5)
- Map<K,V>（13 方法）和 Set<T>（13 方法）已全管线实现并提交，但路线图仍标为未完成。`docs/design.md` 附录也将 Map/Set 列为"未实现高优先级"。
- **需要**: 更新路线图和 design.md 附录。

**I18: 已完成的 spec/plan 文件未删除**
- **位置**: `docs/specs/`, `docs/phase2-vision.md`
- CLAUDE.md 规则："已完成的 review/plan/spec 文件应删除而非保留"。这些文件为 untracked，对应的工作已完成。

---

## Minor（25 项）

### 代码质量 (10)

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| M1 | `contains_position` 函数在 hover/definition/completion 中重复定义 | `lsp/features/` 3 个文件 | 提取到 `lsp/utils.ts` |
| M2 | 三种集合的 HOF 内联 codegen 高度相似（List/Map/Set） | `codegen.ts:579-654` | 表驱动或策略方法 |
| M3 | `suggestions.ts` 的 `suggest()`/`enrich()` 始终返回空数组 | `diagnostics/suggestions.ts` | 标注 TODO 或补充规则 |
| M4 | `compose` 函数导出但未使用 | `unify.ts:154-165` | 删除 |
| M5 | `lsp_to_ring_position`/`offset_to_position` 未使用 | `lsp/utils.ts:16-24` | 删除 |
| M6 | `zonk_stmt`/`zonk_expr` 无 `assertNever` | `zonk.ts` | 添加穷尽检查 |
| M7 | `type_error` throw 空 CompileError（诊断在 sink 中） | `infer.ts:65-69` | 添加注释说明设计意图 |
| M8 | 3 处 `any` 类型泄漏 | `cli.ts:139`, `exhaustive.ts:11`, `infer.ts:1850` | 改为 `unknown` |
| M9 | `UNIFY_ID_OFFSET = 100000` 无注释 | `unify.ts:13` | 添加注释说明假设 |
| M10 | `LIST_HOF_JS` 等映射对象每次调用重新创建 | `codegen.ts:608-611` | 提取为模块级常量 |

### 测试覆盖缺口 (8)

| # | 缺口 | 严重度 |
|---|------|--------|
| M11 | 自定义 effect 声明 + handler 无 E2E 测试（所有测试仅用内置 io/fail/mut） | 高 |
| M12 | 多约束 trait `<T: A + B>` 实际调用双方方法无测试 | 高 |
| M13 | 嵌套 handler（`handle { handle { ... } }...`）无测试 | 高 |
| M14 | 9 个错误码无任何测试（E0102/E0104/E0204/E0303/E0304/E0401/E0402/E0501/E0503） | 高 |
| M15 | E0302（occurs check）和 E0403（unhandled effect）定义但从未在 checker 中使用 | 中 |
| M16 | List/Str/Map/Set 空集合边界操作（空列表 HOF、Str.slice 越界等）无测试 | 中 |
| M17 | for..in + continue 组合无测试 | 中 |
| M18 | Tuple 单元测试缺失（unification/穷尽性/zonk 均无独立测试） | 中 |

### 文档 (4)

| # | 问题 | 位置 |
|---|------|------|
| M19 | 已知限制未列出 Map for..in 不支持 | CLAUDE.md |
| M20 | 已知限制 "无 Range/List 以外的自定义迭代器" 过时（Set 已支持） | CLAUDE.md |
| M21 | E0601 错误码分类标为 "codegen"，实际是 checker/exhaustive | CLAUDE.md/codes.ts |
| M22 | `npm test` 注释声称 "221 tests"，实际 227 | CLAUDE.md |

### 语言设计 (3)

| # | 问题 | 说明 |
|---|------|------|
| M23 | `where` 子句被解析后丢弃，无任何编译器反馈 | 用户可能以为有编译期验证，产生虚假安全感。建议解析到 `where` 时报 warning |
| M24 | `pub` 可见性被解析但不强制执行，无反馈 | 同上 |
| M25 | `print` 对 enum/struct 泄漏 JS 内部表示（`_tag`/`_0`） | `print(some(42))` 输出 `{ _tag: 'some', _0: 42 }` 而非 `some(42)` |

---

## 其他观察（不计入严重度统计）

### 语言设计观察

- **O1: `Cell<T>` 通过 `let` 绑定允许间接可变**：`let c = Cell(0); c.set(42)` 合法。`let` 承诺"绑定不可变"但 Cell 内部可变。这是有意的设计（与 Rust `Cell` 一致），但需要更好的文档和 IDE 提示。
- **O2: Tuple 和 List 在 JS 层面都编译为 Array**：调试时打印值无法区分。Ring 类型系统隔离了两者，但通过 JS interop 可能混淆。
- **O3: "一种事一种写法" 存在合理例外**：错误处理有 5 种方式（`or`/`catch`/`handle`/`try`/`?`），虽各有不同语义级别但对 LLM 选择增加负担。
- **O4: Effect 系统对 LLM 友好度是设计赌注**：LLM 无 effect 系统训练数据，evidence passing 的 JS 输出（`__ring_ev_io`）对调试不友好。需要实际测量验证。
- **O5: `Cell.get()` 对 struct/list 返回 JS 引用**：Ring 声称"不可变值语义"但 JS 对象是引用语义。对 primitive 无问题，对复合类型 `Cell.get()` 返回的是引用，修改会影响 Cell 内部。
- **O6: Raw string `r#"..."#` 仅支持单 `#`**：内容包含 `"#` 序列会意外截断。*(DS 独有发现)*
- **O7: Map/Set 构造使用自由函数（`map_from`/`set_from`）而非字面量语法**：与 List `[...]` 字面量不一致。

### 架构观察

- **O8: 新增一个 Expr variant 需修改 10-12 个文件**：其中 LSP 4 处是纯机械重复，通用 visitor 可减少到 1 处。
- **O9: HIR 直接复用 AST Pattern 类型**：`hir/index.ts` 导入 `Pattern`，HIR 声称"独立于 AST"但 Pattern 未独立。
- **O10: Checker 在同一函数内首个类型错误就 throw**：LLM 一次只能看到一个错误，需多轮编译-修复循环。
- **O11: LSP 每次编辑全量重编译（150ms debounce）**：当前可接受但文件变大后可能延迟。
- **O12: Unification 全局 `_unify_next_id`**：*(DS 独有发现)* 单线程无问题但引入并行编译时会竞态。

### 性能观察

- **O13: `apply(subst, type)` 每次完整遍历类型树，无缓存**：大函数中叠加可能产生性能问题。
- **O14: `trait_impls` 线性扫描**：每次方法调用都遍历所有 trait impl。建议使用 `Map<type_name, ImplEntry[]>` 索引。

---

## 修复优先级建议

### P0 — 立即修复（影响用户程序正确性）— ✅ 已修复

1. **C1**: ✅ `__ring_dt` 命名冲突 — 使用 `dt_counter` 递增
2. ~~**C4**: `or` Option 路径 eager eval~~ — **误报**，JS ternary 已短路求值
3. **C2+C3**: ✅ `collect_free_vars` + `label_vars` 遗漏 tuple — 已添加 case

### P1 — 高优修复（类型系统 soundness + 常见陷阱）— 部分已修复

4. **C7**: 限制 `==`/`!=`/比较运算符只能用于 primitive 类型 — **待讨论**
5. **I7+I8+I9**: ✅ unification、type resolution、effect op 添加参数数量检查
6. **C6**: ✅ `List.find` 改用 `findIndex`

### P2 — 中优改善（用户体验 + 代码质量）— 部分已修复

7. **I16+I17+I18**: 文档全量更新 + spec 文件清理 — **待下批次**（需与隔壁 agent 合并后更新）
8. **I12**: LSP 通用 HIR 遍历器 — **待下批次**
9. **I13+I14+I15**: 内置类型注册重构 + magic string 常量化 — **待下批次**
10. **I3**: ✅ `..=` inclusive range 已添加

### P3 — 低优改善（设计讨论 + 测试补充）— 部分已修复

11. **I1**: ✅ `or` dispatch 类型不确定时报错
12. **I5**: 推迟（用户决定等 effect 系统重新设计）
13. **I6**: 保持现有名称（用户决定 push/insert/remove 在函数式语言中也常见）
14. **M11-M18**: 补充测试覆盖缺口 — **待下批次**
15. **M23+M24**: ✅ `where`/`pub` 添加编译器 warning
16. 附带修复: for..in `__ring_end_` 变量名冲突（使用 loop_counter）

---

## 交叉验证矩阵

| 发现 | Claude 代码质量 | Claude 类型系统 | Claude 语言设计 | Claude 测试覆盖 | DS 全量 |
|------|:-:|:-:|:-:|:-:|:-:|
| C1 `__ring_dt` 冲突 | ✓ | ✓ | ✓ | ✓ | ✗ |
| C2 `collect_free_vars` 遗漏 | ✓ | ✓ | ✓ | - | ✗ |
| C3 `label_vars` 遗漏 | - | ✓ | ✓ | - | ✗ |
| C4 `or` eager eval | - | - | ✓ | - | ✗ |
| C5 effect row occurs check | - | ✓ | - | - | ✗ |
| C6 `List.find` undefined | - | ✓ | ✓ | - | ✗ |
| C7 `==` 引用比较 | - | - | ✓ | - | ✗ |
| I4 `..` 优先级偏离 | - | - | - | - | ✓ |
| I16 文档过时 | - | - | - | ✓ | ✓ |
| O6 raw string 单 `#` | - | - | - | - | ✓ |

**结论**: Claude 专项 agent 在发现具体 bug 方面远超 DS，特别是需要跨文件追踪数据流的问题（如 `collect_free_vars` → `generalize` → soundness）。DS 的优势在于宏观视角（优先级对比、文档同步）和非编译器领域的发现（raw string 限制）。两者互补，但对于编译器审计 Claude 深度明显占优。

---

*报告由 4 个 Claude Opus agent + 1 个 DeepSeek V4 Pro agent 并行审计后汇总生成。*
