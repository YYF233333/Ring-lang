# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-139 Default trait method evidence forwarding

### 1. 实际根因与 spec 不同 [通知]

Spec 说 delegate stub 转发 call 时漏传 evidence——但调查发现 **delegate 转发路径本身是正确的**（codegen 的 `get_callee_evidence_args` 已处理）。真正的 bug 是 **`HTraitMethod` 缺少 `effects: EffectRow` 字段**，导致 codegen 为 default trait method 生成函数时无法产生 evidence 参数。修复为数据结构级变更（5 个源文件），需 double bootstrap。

### 2. LLVM 后端不支持 default trait methods [通知]

发现 LLVM 后端完全不支持 default trait methods——生成 `unknown method` warning + null closure，调用时 access violation。这是 pre-existing 限制，不在 B-139 范围内，但 llvm_diff 测试只覆盖了 explicit method 路径。

## B-140 apply_subst TypeVar UAF

### 3. 真正根因：apply_subst 返回借用值 [通知]

初始假设（"Perceus 条件 push + scope-end drop 不平衡"）被否定——HIR 层 RC 正确平衡。经三轮调查（Perceus probe → LLVM codegen 分析 → ASan 复现 + 代码审计），定位到真正根因：`apply_subst` 的 TypeVar 分支在 `root == id` 时直接返回函数参数 `t`（借用值），但 Perceus 的 `is_droppable_init(Call)=true` 把所有 Call 结果当 owned 并插 scope-end Drop——对借用值过度释放，原始持有者（UF 表/Effect 列表）仍引用已释放内存。修复：TypeVar 分支总是构造新 `Type::TypeVar { id: root, name: name }`。同时移除 `cancel_local_mut_effects` 的 Str workaround（不再需要）。ASan ×5 clean 验证通过。

### 4. 类似风险：返回参数的函数与 Perceus 假设冲突 [通知]

B-140 揭示了一个系统性风险：**任何返回 RC-managed 参数（而非新分配值）的函数，都会被 Perceus 的 `is_droppable_init(Call)=true` 错误处理**。当前代码库中 `apply_subst_map` 的 TypeVar 分支已确认安全（始终构造新节点）。未来新增的函数如果有类似的"no-op 返回输入"模式，需要意识到这个约束。

<!-- B-099 UAF 决策已处理（2026-06-24）：用户拍板 (C) 先绕后修。Workaround commit f8302d8，根因修复排 B-140 [P1]。 -->

