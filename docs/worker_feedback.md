# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-099 自编译排查

### 1. native ring.exe 间歇性 heap-use-after-free（Perceus RC bug） [决策]

**现状**：ASan 捕获 `heap-use-after-free in ring_dup`——native ring.exe 编译多模块项目时间歇性崩溃（STATUS_HEAP_CORRUPTION）。

**精确 ASan 报告**：
- **UAF 位置**：`ring_dup` 读取已 free 对象的 typeid（offset -4）
- **Free 来源**：`ring_infer$$_cancel_local_mut_effects`（`infer.ring:68-130`）
- **Alloc 来源**：`ring_env$$_apply_subst`（`env.ring`）
- 对象：40 字节 Type enum variant（8 字节 RC header + 32 字节 payload）

**根因分析**：`cancel_local_mut_effects` 中 `let resolved_st = apply_subst(s, state_type)` 创建一个 Type 值。该值在条件分支内被 `cancel_types.push(resolved_st)` 推入列表（Perceus 在 push 参数位 Clone-wrap = dup），原始 `resolved_st` 在 scope-end 被 drop。之后 filter closure 访问 `cancel_types` 中的值时触发 ring_dup → UAF。

**间歇性原因**：`ring_dup` 有 guard `if (rc == 0u || rc > 100000u) return`——freed memory 如果碰巧 RC 字段为 0 或被覆盖，ring_dup 静默跳过，不立即崩溃。ASan 的 poisoned memory 让 every read 都触发，所以 ASan 下 100% 可复现。

**不是 regression**：Level 1 验收点 `a665017`（2026-06-16）同样存在此 bug——31GB 机器上 freed memory 碰巧 RC 字段在合理范围内 → ring_dup 写入 → 碰巧没有 heap corruption 被 OS 检测到。

**复现方法**：
```bash
# 非 ASan（间歇 ~60%）：
ring.exe check compiler/scc.ring       # ×10 约 4-6 次崩溃
# ASan（100% 复现）：
ring_asan.exe check compiler/scc.ring  # 每次报 UAF
# 最小复现（ASan）：
echo 'use infer_register::{prefix_decl_name}\nfn main() { print("x") }' > compiler/test.ring
ring_asan.exe check compiler/test.ring
```

**影响范围**：
- 阻塞 B-099 自编译验证（ring.exe 编译 44 文件编译器 = 100% 触发）
- 阻塞所有 native ring.exe 的多模块编译
- 单文件编译不受影响

**待决策**：
- (A) 修 Perceus——分析 `cancel_local_mut_effects` 的 drop 序列，找到具体哪个 drop-too-early 或 dup-missing，修正 perceus.ring 的 RC 插入逻辑。可能是 Perceus 对「for 循环体内条件 push + 后续 closure 捕获 list」模式的处理有缺陷
- (B) 修源码绕过——重写 `cancel_local_mut_effects` 避免触发该 Perceus 模式（例如改变 scope 结构、避免条件 push + closure 捕获同一 list）
- (C) 两者都做——先 (B) 解除阻塞，再 (A) 从根修

