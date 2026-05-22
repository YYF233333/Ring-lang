# Worker Feedback

> Worker 执行过程中发现的问题、设计偏差、需要讨论的决策。每次 worker session 结束后追加。

## B-019 可变性统一模型

### 1. Enforcement 仅针对 `let` 绑定，不针对函数参数

**现状**：`check_receiver_mutability` 使用 `let_defs: Set<Int>` 区分 `let` 绑定和函数参数。函数参数（即使未标 `mut`）不受 enforcement 限制——可以对 `fn foo(list: List<Int>)` 的 `list` 调用 `.push()`。

**原因**：如果参数也受限，所有接收 List/Map/Set 的函数都需要 `mut` 标记，自举编译器改动量极大且不实际。

**待决策**：这是否是最终设计？还是应该：
- (A) 保持现状——参数不受限（务实，但与 `let mut` 语义不一致）
- (B) 参数也受限，但分阶段推进（先 warning，后 error）
- (C) 参数默认 `mut`（非 `let` 绑定的参数天然可变）

### 2. Cell\<T\> 消除被推迟

**现状**：Cell\<T\> 仍存在于 builtins/runtime/codegen 中。7 个测试文件使用 Cell。

**原因**：Cell 消除依赖闭包自动 boxing（`let mut` 被闭包捕获时编译器自动生成 `{ value }` 包装）。这是 codegen 层面的深度变更，不适合与语法迁移同一 wave 进行。此外，Cell 在 struct 字段中的内部可变性模式（`struct State { counter: Cell<Int> }`）无直接替代方案。

**待决策**：
- 闭包自动 boxing 的实现方案（codegen 检测 + 转换）
- struct 字段的内部可变性：是否保留 Cell 作为 "interior mutability" 的显式工具（类似 Rust 的 `RefCell`），还是完全消除？

### 3. `generalize()` 返回的 def_id 总是 none

**发现**：`Stmt::Let` 处理中，`generalize()` 返回的 `TypeScheme.def_id` 总是 `none`。Agent 修复为在 `bind()` 后通过 `lookup()` 获取实际 `def_id`。

**影响**：修复前，`HStmt::Let` 的 `def_id` 字段始终为 `none`，可能影响 codegen 或后续 pass 对 let 绑定的追踪。这个 bug 在 enforcement 之前就存在，但因为没有依赖 `def_id` 的逻辑所以没有暴露。

### 4. 批量替换的边界 case

**发现**：Wave C 的 `var` → `let mut` 批量替换中，行首正则 `(?m)^(\s*)var (\w)` 错误匹配了多行函数参数（参数换行后 `var param_name:` 出现在行首）。Agent 发现并修复了 3 处（infer_register.ring ×2, derive.ring ×1）。

**教训**：批量正则替换后必须验证——特别是 Ring 代码中参数可能跨行的情况。后续类似迁移应增加 post-replacement grep 验证步骤。

## B-023 集合 `===` 引用相等 — 需要设计重审

**问题**：`List.contains(x)`、`Map.get(key)`、`Set.contains(x)` 使用 JS `===` 引用相等，对 struct/enum 值无法正确匹配。

**Worker 分析的三种修复方案**：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **(A) 运行时 `__ring_eq`** — runtime 中实现通用结构相等函数 | 改动小（仅 runtime.ring） | 不尊重用户自定义 Eq impl；硬编码结构比较逻辑 |
| **(B) 传 Eq 字典** — codegen 调用 contains 时传入 Eq comparator | 完全正确；与 `==` 行为一致 | 改动大（runtime 签名 + codegen 方法调用 + 调用点解析 Eq dict） |
| **(C) 用 Ring 重写** — 将 contains/find 等从 JS runtime 移到 std/*.ring | 最干净；自动走 Eq dispatch | 需要 Ring 能对 extern type List 做底层迭代（目前缺少原语） |

**需要设计 agent 决策**：选择方案路线 + 设计 API 细节，然后返回 backlog 作为可执行 spec。
