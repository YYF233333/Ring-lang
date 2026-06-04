# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-098 借用推断引擎 — escape-clone 层放置（HStmt::Dup 只能按名 dup）

**[决策]**（阻塞 B-098 的完整实现路线，但有明确推荐解，等用户拍板后即可执行）

### 问题
spec 的模型是「读取 borrow（撤销 read-dup）+ perceus 在逃逸点 escape-clone（dup）+ scope-end drop 一次」。`self_type` 验收用例的逃逸表达式是**裸 Ident**（`param_types.push(self_type)`），perceus 的 `HStmt::Dup { name }` 按变量名查 `named_values`，能精确 dup 它。该用例 spec 模型成立。

**但 `HStmt::Dup` 只能 dup「有名字的绑定」**（codegen `emit_llvm_stmt` 的 Dup 分支按 name 查 alloca）。逃逸表达式若不是裸 Ident 而是 **FieldAccess / IndexExpr**（如 `list.push(parser.tokens)`、`return node.children`），perceus 无法对其发 name-level Dup。撤销 read-dup 后，`parser.tokens` 变成 borrow（不 dup）：
- `parser` 是 owned 绑定 → scope-end `drop(parser)` 递归 drop `parser.tokens`；
- `list` 也持有被 push 的同一指针 → `list` drop 时再 drop `parser.tokens` 一次 → **double-free（崩溃，非泄漏）**。

即 spec 的字面模型对「非 Ident 表达式直接逃逸」是 **incomplete 且会崩**，正是 GATE 1 要消除的同一类 double-free。这是 spec 与代码现状（Dup 只能按名）的真实不符，触发 spec 的 STOP-and-report 条款 + CLAUDE.md「决策必须讨论」。

### 根因
ownership 转移（escape-clone）对**非 Ident 逃逸值**必须发生在**值层**（sink 处的 runtime/codegen store dup），perceus 的 name-level Dup 覆盖不到。spec 把 escape-clone 全划给 perceus，但 perceus 的 IR 原语（按名 Dup）做不到值层 dup。

### 推荐解（store-side escape-clone + scope-end-drop，统一、完整、无崩无泄漏）
把 escape-clone 从「读取侧 always-own dup」**整体迁到写入侧（sink）**，对 Ident / 非 Ident 逃逸一视同仁：
- **读取**：borrow，不 dup（= spec Part 2/3 的撤销，方向一致）。
- **逃逸 sink dup（值层）**：`ring_list_push` / `ring_map_set` / `ring_map_int_set` / `ring_set_add` 等容器写入 runtime fn 对存入值 `ring_dup`；codegen struct/variant 字段 store、ListLit/TupleLit 元素 store、closure capture、return value 对存入值发值层 dup。
- **perceus**：只管「每个 owned 绑定在 scope 末 drop 恰好一次（去掉 per-path branch-balancing）」+「撤销无条件 param drop」。逃逸点的 dup 不再由 perceus 发（避免与 sink dup 双 dup）。
- 平衡：绑定 alloc rc=1；每次逃逸 sink +1；scope-end -1。配平，Ident 和非 Ident 同构。

与 spec 语义等价（rc 在元素进容器前 1→2，scope 末 2→1，容器留 1，正是 spec `self_type` 描述的数），只是 dup 落在 sink 层而非 perceus —— 因为 name-level Dup 物理上做不到非 Ident 值层 dup。这是**实现层必然**，非用户可见语义变更。

### 备选解（faithful-to-spec，但不完整 / 会崩）
严格按 spec 让 perceus 只对裸 Ident 逃逸发 name Dup，非 Ident 逃逸不处理 → 上述 double-free 仍在，GATE 1 在编译器命中非 Ident 直接逃逸时会崩。**不推荐**（不满足 GATE 1）。

### 请求
确认采用「推荐解（store-side escape-clone）」即可执行。该方案改动面比 spec 字面（perceus 逃逸分类）小且鲁棒，但 escape-clone 落点（sink 层 vs perceus 层）偏离 spec 文字，故上报拍板。

---

### Orchestrator 核实 + 细化（2026-06-04）

**问题诊断已代码级证实**：`hir.ring:115` `HStmt::Dup { name: Str, .. }` 只携带名字；`codegen_llvm_stmt.ring:113-124` 的 Dup 分支按 `named_values.get(name)` 查 alloca，查不到只发 `[rc-warn]`。perceus 物理上无法对 FieldAccess/IndexExpr 逃逸值发 dup。spec 字面模型对非 Ident 直接逃逸确会 double-free。

**但「推荐解：sink 无条件 dup」有反向缺陷**：`ring_list_push`(ring_runtime.cpp:684-688) / `ring_map_set`(1074-1079) 当前**取所有权、不 dup**。若改成 sink 一律 dup，则 `list.push(make_token())` 这类 fresh **无名临时值**（rc=1 → sink dup → rc=2）因无名字，perceus 的 `HStmt::Drop{name}`（同样按名）**无法 scope-end drop 它 → 每次泄漏 1 ref**。此类模式（`list.push(call())`、`return make_token()`）在编译器中极常见 → 泄漏 pervasive，且 return-sink 嵌套级联 over-count。**威胁 G-a 内存门（<<25.9GB，B-098 验收标准）**。

**正确解 = 条件式 escape-clone（不是无条件 sink dup）**：
- 读取 borrow（撤销 read-dup），方向同 spec。
- 逃逸默认 **move**：fresh temp / last-use Ident 直接转移所有权进 sink，**不 dup**（无泄漏）。
- 仅 **borrowed** 逃逸才 clone：
  - Ident 非 last-use（源仍 live）→ 现有 name-level `HStmt::Dup`（已能做）。
  - 非 Ident（FieldAccess/IndexExpr，必为 retained aggregate 的 borrow）→ **新增值层 clone 机制**（如 `HExpr::Clone{inner}` wrapper，codegen lower 成 eval→ring_dup→返回；或 clone-on-bind 的临时 let）。perceus 在逃逸点判 borrow-vs-owned 后决定是否包 Clone。
- perceus：owned 绑定 scope-end drop 一次（去 branch-balancing）+ 撤销无条件 param drop。

此解满足 GATE 1 崩溃门，且因 owned 逃逸 move（dup 比 always-own 少）大概率满足 G-a 内存门。代价：需小 IR 增量（值层 clone）+ perceus last-use/escape 分析覆盖非 Ident。**Orchestrator 推荐此解，不推荐无条件 sink dup。**

### 用户裁决（2026-06-04）：先 Discussion 落定完整 borrow 设计再实现

用户选择不直接拍实现解，而是先在 Discussion 把完整 borrow 模型设计落 design.md §7 再开 B-098 实现。**Discussion 需落定的设计决策**：

1. **escape-clone 落点 + 值层 clone 机制**：非 Ident（FieldAccess/IndexExpr）borrowed 逃逸如何 clone？候选：(a) 新增 `HExpr::Clone{inner}` 节点（codegen lower 成 eval→ring_dup→返回值）；(b) clone-on-bind 临时 let（perceus 把非 Ident 逃逸 hoist 成 owned 临时绑定）；(c) sink 条件式 dup（codegen 在 sink 处按 perceus 标注的 borrow-vs-owned 决定是否 dup）。定 IR 形态。
2. **borrow-vs-owned 判定**：perceus 在逃逸点如何区分「值是 borrowed（源仍持有 → 需 clone）」vs「owned（fresh temp / last-use var → move）」？复用现有 backward last-use 分析到什么程度。
3. **move 推断边界**：spec 原说「保守版不需 last-use→move」，但 fresh-temp 入 sink 必须 move（否则泄漏）。落定本期做哪些 move（至少：fresh temp 入 sink + last-use Ident 入 sink），哪些推迟。
4. **design.md §7.2–7.8 增订**：原 spec 称语义已「定死」，但**实现模型**（escape-clone 由哪层承载）未定且字面版会崩。需在 §7 补「escape-clone 的 IR 承载层 + borrow/owned 判定 + move 边界」一节。
5. **与 B-096 边界**：borrowed capture 建模两项都碰，落定各自范围避免重复/冲突。

落定后 B-098 重排队（waiting-feedback → queued），按定案实现 + 跑三门 ×3。
