# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## Codegen

### #158 ~~字符串操作系统性字节 vs 字符索引分歧~~ [medium] [judgment] [closed — B-133 跟踪]

ring_runtime.cpp 的所有字符串操作使用 `std::string` 的字节级 API，JS 后端使用 JS 原生 UTF-16 码元级 API。对 ASCII 两者一致；对非 ASCII（CJK、emoji 等）**系统性发散**：

| 操作 | JS（runtime.ring） | Native（ring_runtime.cpp） | 例：`"你好world"` |
|------|-------------------|--------------------------|-----------------|
| `len` | `self.length`（UTF-16 码元数） | `str->size()`（字节数） | JS=7, native=11 |
| `index_of("world")` | `self.indexOf()`（码元偏移） | `str->find()`（字节偏移） | JS=2, native=6 |
| `char_at(0)` | `self[0]`（返回字符 "你"） | `(*str)[0]`（返回单字节 0xE4，**无效 UTF-8**） | JS="你", native=乱码 |
| `slice(0,1)` | `self.slice(0,1)`（码元切片） | `str->substr(0,1)`（字节切片，**切断多字节字符**） | JS="你", native=0xE4 |

**影响**：
- `char_at` 对多字节字符返回**无效 UTF-8 单字节**——不只是数值差异，是语义损坏
- `slice` 可切断多字节字符产生无效 UTF-8 字符串——后续字符串操作可能行为未定义
- 当前 llvm_diff 测试全部使用 ASCII → 分歧**不可见**（oracle 盲区）
- JS 退役后 native 字节语义成为唯一行为，无安全网

**修复方向**（需设计拍板）：
- (A) Ring 定义字符串为 UTF-8 字节串（Rust 模型）→ native 正确，JS 是"临时近似"，退役后无影响。但 `char_at`/`slice` 对用户不友好（需 byte 级思考），且 `char_at` 返回无效 UTF-8 仍是 bug
- (B) Ring 定义字符串为 Unicode 字符串（Python 模型）→ native 需改为 code-point 级操作（遍历 UTF-8 计数/切片），性能代价更高但语义正确
- 不论选 A/B，`char_at` 返回无效 UTF-8 这条**两种模型下都是 bug**——A 模型也应改为返回完整 code point 或报错
- **B-100 JS 退役前必须拍板**，否则语义在退役时静默变化

发现者：Audit workflow (oracle-blind + backend-parity lens, 2026-06-13)

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [judgment] [open]

可移植性问题。

### #138 Map/Set.fold + clone 方法语法在 native 落 panic-stub [low] [judgment] [open] [latent]

**已修复（2026-06-16 核实）**：StringBuilder.line/add_int、Set.clear/union/intersect/difference 已补齐 method_to_runtime 映射 + runtime 符号。

**残留（latent，编译器零使用）**：`Map.fold` / `Set.fold`（无 runtime 符号 + 无映射）；str-keyed `Map.clone()` / `List.clone()` / `Set.clone()` 方法语法（int-keyed 有映射、str-keyed 落空；直呼 `map_clone(m)` 经 `ring_` fallback 正常）。发现者：B-103 Wave A。

### #147 跨模块裸名碰撞可误伤 extern-handle 排除判定 [low] [judgment] [open] [latent]

`is_extern_handle_type`（hir.ring:504）按裸名匹配 `externs.contains(name)`。B-144 全局化了集合但未改匹配策略——同名用户 struct 仍会被误排除。当前风险≈0（`LLVM*Ref` 命名空间独占）。真解 = 模块限定名。发现者：B-104 D1 Stage 1。

## 设计-实现差距（参考，已在 backlog 跟踪）

> 以下为未实现特性的跟踪参考，不作为 Worker 任务源。实际实现由 backlog 对应条目驱动。

| # | 设计功能 | Backlog 对应 | 状态 |
|---|----------|--------------|------|
| 36 | Refinement types (where 子句) | B-001 | 语法解析但语义忽略 |
| 37 | ~~`mut<S>` 参数化 effect~~ | B-037 | ✅ 已实现 → **已移除**（2026-06-24 design.md §7.9；实现保留但 effect 语义废弃，mutation 改由参数推断承载） |
| 38 | Post-resume handler / Full AE | 已取消 (B-009) | 不实现 |
| 39 | `dyn Trait` 动态分发 | B-006 | 未实现 |
| 40 | Supertrait 继承 | B-005 | ✅ 已实现 |
| 41 | 关联类型 | B-004 | ✅ 已实现 |
