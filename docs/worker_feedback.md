# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Wave 4（B-091 / B-074 / B-078）

### 1. design.md §Auto-Boxing × Linear 应补 cell 机制说明 [通知]

B-091 给 LLVM 后端加了「被闭包写穿捕获的 `let mut` 局部 auto-box 成单槽堆 cell（`RING_TYPEID_CELL`）」机制。worktree agent 顺手在 design.md §Auto-Boxing × Linear 补了一段说明，但 design.md 属 Discussion 域，已从 merge 剔除（还原回 `3f63ddd` 版本）。建议 Discussion 把该段补回——文案见 commit `fd7fdf1` 的 design.md diff，要点：cell 镜像 JS 的 `{value:...}`，外层作用域与闭包 env 共享 cell 指针、读写走 `cell.value`；Perceus 对 boxed cell 的赋值**不**插旧值 Drop（否则每次写 `ring_drop` 共享 cell → 确定性 UAF）；cell 指针本身按普通 owned 堆值参与 RC（捕获点 dup、作用域末 drop / 工厂场景 move 进闭包）。

### 2. B-091 / B-074 根因都比 spec 假设的深 [通知]

- **B-091**：spec 假设「Perceus 把 boxed cell 当 last-use move」。实际根因是 **LLVM 后端从没实现 auto-box-to-cell**——`boxed_vars`（checker 标记写穿捕获的 def_id 集）从没接进 LLVM codegen，闭包 env 捕获的是值的拷贝（写不回，会打印 0 而非 2）；外加 Perceus 每次 Assign 前的旧值 Drop 把共享 cell 释放 → UAF。agent 实现 cell 机制（新 typeid 14 + drop_cell + cell 读写 helper + perceus 抑制 boxed 目标旧值 Drop）。这是唯一同时满足三个验收场景的修法，agent 未回环直接做了（判断合理）。
- **B-074**：spec 假设「extern type 没生成占位导出」。实际占位导出 Wave 2a 就有；真根因是 extern type 注册成**零字段 StructDef**，auto-derive 误当可派生 unit struct，emit `__FloatBox_Clone` 等垃圾 dict → 消费方 import 时 ESM SyntaxError。agent 加 `StructDef.is_extern` 标记、derive 跳过。extern fn 跨模块经核查**不是 bug**（resolve 成全局符号，裸调用即对）。

### 3. Wave 3 留下的 dist 略 stale（已修正）[观察]

merge 时发现 base（`24dc2c3`，Wave 3）的 `dist/codegen_llvm*.js`（含 codegen_llvm_decl.js）对源码不是完美 fixpoint——B-074 worktree self-rebuild 时这几个文件会变，与 B-091 改动撞成 merge 冲突。本 wave 最终重编已归正（rebuild#2 验证 0 变化 = fixpoint）。仅 LLVM codegen 那几个文件、无功能影响，但说明 Wave 3 合入时 dist rebuild 可能没跑到 double-bootstrap 收敛。后续 wave 注意：merge 后 rebuild 必须验 fixpoint（连编两次第二次 0 diff）。

### 4. 新 audit 项 #132（LLVM print Int parity）[通知]

B-091 agent 顺手发现 LLVM `ring_print` 对 Int 不做 Int→Str 强制转换（JS 后端做），`print(intExpr)` 误打印。已开为 audit #132（medium，可并入 B-087）。不阻塞 Wave 4。
