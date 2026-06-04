# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## 2026-06-03 worker session 收尾（明天入口）

### 1. 明天第一优先：audit #133（B-087 间歇堆损坏）[通知]

本 session 收尾 3x 压测暴露了一个 **Critical 间歇堆内存损坏**，bisection 已钉死元凶 = **B-087**（Wave 8，#103 mut 参数 boxing 嫌疑最大）。详见 **audit-report #133**（含完整 bisection 链 + 复现 + 修复方向）。

- **明天第一件事**：bisect B-087 内部 6 个 gap（最快：临时 revert mut-param-boxing 那部分，`npm run test:llvm` 连跑 3x 看是否变干净）→ 定位 double-free → 修。
- **为什么 Critical**：阻塞 G-c parity（B-089），且 native 自编译大概率也踩（编译器自身重度用 mut 参数）→ 可能威胁 G-b 双 bootstrap 一致性。
- **当前 main 状态**：`4f9cbf9`，功能上 B-090 已落地，但 `npm run test:llvm` 单跑 ~1/3 概率间歇失败（B-087 的损坏，非 B-090）。不是干净绿。

### 2. 本 session 已完成（Wave 4-9）[通知]

全部已 merge + 删 backlog + dist fixpoint + 提交：
- **B-091** boxed mut-cell 闭包捕获 UAF（cell typeid 14）
- **B-074** extern type 跨模块 import（is_extern 跳过 derive）
- **B-078** parser W0001 字面量 → import
- **B-084** closure env owned-capture drop（typeid 15 + drop_closure_env）
- **B-093** 关闭（未复现，B-084 顺带修，加了回归锁测）
- **B-092** 泛型 trait-method dispatch（env-first dict thunk）
- **B-087** 双后端 parity 6 gap + tuple-literal ← **但引入了 #133 间歇损坏**
- **B-090** custom effect handler 核心（evidence struct + effect_op_slot 契约）

llvm_diff 用例 31 → 49。

### 3. 剩余 backlog（明天/后续，已在表里躺着）[通知]

- **B-097**（effect handler phase 2：custom-abort / default body / delegate / 嵌套）——依赖 B-090，本机可做
- **B-096**（闭包 RC 完整收口 A 波）/ **B-089**（native 终验 capstone）——卡大内存机
- 非 LLVM：B-072 Union Type、B-069 默认参数、B-070 固定数组、B-001 Refinement、B-002 Ownership/Drop 等（P2/P3 排队）

**建议明天顺序**：#133（必须，解血栓）→ B-097 → 然后看大内存机能否上 B-096/B-089。
