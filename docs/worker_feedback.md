# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-104 D8 棒（门① 残余归因测量，2026-06-13，git `7d0d10f` 仪表 + 测量完成）

### [通知] 门① 残余归因切分完成——orphan 主导（~62-65%），单点收敛于 `type_to_string`

D8 measurement-only（仪表全在 `-D` guard，正常/llvm_diff 构建零影响；diff 仅 `ring_runtime.cpp` +58/−6，未碰 perceus/verify_rc/任何 RC 逻辑；npm test 822/0 + llvm_diff 74/0）。自编译跑到 D7 同端点（~10.41B allocs，peak ~10.6GB，无 thrash，~11min；终点是**预期的** LLVM-C-missing panic = B-099 范围，全部分配已在内存中跑完、atexit 读数完整有效）。仪表覆盖 SB（tid13）+ 全 user typeid（含 Type tid103，drop-reg RVA 符号化核实，D5 读数无误）。

**归因表（三检查点；终点 ~185M live，与 D7 端点 185.2M/1.8% 吻合）**：
- **SB（tid13）~47M = 100% 纯泄漏**（孤儿，0 回收，born==live 全程单调增）——单源 `type_to_string` 插值的 StringBuilder 中间临时从不 drop（top-2 站点占 SB live 97.6%，全 12 站点无一例外 live==born）。
- **Type（tid103）~22.7M ≈ 98.7% 泄漏**（~22.4M）——单源 `Type::UnitType` 构造器叶子（`unwrap_or(UNIT)` 等递归，live==born，占 Type live 98.7%）；剩 ~1.3% 合法 churn。**注意聚合 retention 21.5% 会误导（双峰：1 泄漏站点 + 大量 0.05% churn 站点），站点级才是真值**。
- **STR（tid3）~101M = 混合**——聚合 retention 15.5% 说明 ~85% 已回收（合法 working-set churn），但头部 5 站点全是 `type_to_string`（插值/`.map().join()` 机器）、live==born 泄漏；保守估 STR 泄漏 ~45-50M / working-set ~50-55M。
- **TokenKind（tid169）/ INT / BOOL / OPTION**：plateau 或近零留存（合法对照，非泄漏）。

**结论**：门① 残余可收口部分 ≈ SB 47M + Type 22M + STR ~45-50M ≈ **115-120M / 185M ≈ 62-65% 孤儿泄漏**（非工作集），其余 ~35% 合法工作集；且**高度集中于单函数 `compiler/types.ring:361 type_to_string`**（递归字符串拼装：每层 `"${...}"` 插值 + `.map().join()` 产 SB/STR 中间临时不 drop）+ `Type::UnitType` 叶子构造。

### [决策] 门① fork 待 Discussion 拍板：D9 收口（数据强烈推荐）vs 重定义门①口径（数据否决）

D8 数据无歧义指向 **D9 收口**——drop `type_to_string` 的 interp SB/STR 中间临时 + `Type::UnitType` 叶子，高杠杆单点真解。**否决重定义门①口径**：残余以 incomplete-RC 孤儿为主导（62-65%）、非合法工作集，故"绝对 plateau 对全程序编译器误设"那一支被数据推翻。待 Discussion 拍板 + 写 D9 spec（涉 design.md §7.11 门①收尾 + backlog D9 条目；Worker 不碰 design.md）。

（上一批：B-104 D6/D7 两组共 13 条 [通知]，2026-06-13 Discussion 处理完毕——全数纯信息/已落 backlog；D7「B-089 Map 迭代序」转 B-089 G-b 预警；门① 拍板方案 A 归因先行 → 本批 D8 即其产出。更早 D5 归因组 2026-06-12 已处理。）
