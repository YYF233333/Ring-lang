# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-104 W1+W2+W3a — precise Perceus RC 多波（native 攻坚 session，2026-06-07）

### 00. W3a 落地 + 决定性发现：精确-RC 临时回收触顶，INT 64M 唯 B-080 可解 [决策]

W3a（control-flow-init droppable，branch-value 分析）已落地 + 全验证（JS 733 / llvm_diff 52×3 / native harness 3/3 / ASan real_program + self-compile 13GB clean）。is_droppable_init 对 If/Match/Block 递归判（每非发散分支 tail 自身 droppable；And/Or-tail → false 保守，否则 `if c{a&&obj.field}` drop=UAF）。leak ~39%→~33.5%@268M、~30%@大规模，轨迹更强平稳。

**决定性发现（三波数据支撑）**：W1（Call-arg）/W2（scrutinee）/W3a（control-flow）回收了 OPTION（−65%）/BOOL（27→18M）/STR（19→13M）/容器临时，但 **INT 卡死 64M，三波纹丝不动，且随 allocs ~线性增长**。→ **精确-RC 临时-materialize 已近收益上限**；残留绝对主导 INT 不在任何「临时」位置，而是：①mut-var 重赋值泄漏（`x=x+1` 泄漏旧 Int box，按 L0/L1 约定）②合法存活装箱标量（HIR/AST 的 Span/def_id/type-var-id 等 Int 字段）。

**待决策（达 G-a 的下一步）**：
- (A) **B-080 标量 unboxing**（推荐）：Int/Bool 不装箱 → INT/BOOL 堆对象整类消失 → 同时根除①②+装箱开销。是 INT 64M 的唯一杠杆。backlog 原定「A(精确RC)先、B(unboxing)后叠加」，三波已证 A 对 INT 触顶 → 该上 B 了。
- (B) **scalar-reassign-drop 子波**：精确化 mut-var 重赋值（标量值语义不共享 → drop 旧值安全），回收①。但②（合法装箱标量）仍只能 B-080 解，且 peak 已知 OOM → 单 B 多半不够达 G-a。
- (C) **先做 W3b receiver 收口**：`f(x).field` owned receiver——但 receiver 多是 struct/Option 非 INT，对 INT 64M 贡献小。
建议 (A)。peak 仍 OOM（>15GB），精确-RC 单独到不了 G-a（<<25.9GB）已是数据结论。

### 0. W2 落地：scrutinee materialize 无需 match-arm 分析，OPTION −65%，轨迹压平 [通知]

W2（MatchExpr scrutinee materialize）已落地 + 全验证（JS 733 / llvm_diff 52×3 / native harness 3/3 / ASan real_program + self-compile(13GB) 全 clean）。**两个发现**：
1. **backlog 担心的「match-arm return-value 分析」不需要**——`match scrut{_=>scrut}` 的 double-free 已被 clone-all-escape 中和：match 在 escape 位时每 arm tail 单独 rc_escape，返回 scrutinee/pattern 绑定/投影皆 owner-bearing → Clone-wrap（ring_dup）→ 结果持 fresh dup、scrutinee scope-drop 释原件，平衡。与 W1 unwrap_or 同源。逐案 + ASan 实证。scrutinee 改 `anf_arg`→`anf_operand` 一行即可。
2. **效果**：leak ~52%→~39%@268M，**OPTION 65.8M→22.6M（−65%）**，**轨迹由 W1 的爬升（42→55%）转为平稳下降（42→38%），近 live plateau**。W1+W2 合计 ~69%→~39%@268M。

但 peak 仍 OOM（>15GB）。**剩余主导转为 INT（64M@402M，现最大 typeid）+ BOOL 27M = 标量装箱**。下一步：W3（control-flow-init + receiver/And-Or/EffectOp）后需**评估 B-080 标量 unboxing 是否为达 G-a 的必需叠加**——精确 RC 已把可回收临时砍掉大半，剩余 INT/BOOL 大块可能含「合法存活的装箱标量」，纯 RC 到不了 <<25.9GB。这是给后续决策的输入。

### 1. W1 落地 + 实测：W1 是真胜利，但 leak 归因数字此前偏乐观 [通知]

W1（Call 实参 materialize）已落地并全维度验证（JS 733 / llvm_diff 52×3 / native harness 3/3 / ASan real_program + self-compile(13GB) 全 clean，零 over-free/UAF）。**用同一 alloc/free 计数器、同输入（self-compile）、同 alloc 里程碑严格对比 baseline**：
- **此前文档/memory 记的「ANF 易类 ~50% leak」偏乐观**——重测 pre-W1 HEAD 实为 **~69% leak**（@268M allocs）。真实进程 = **88%（R-clean+B-103）→ ~69%（ANF 易类）→ ~52%（W1）**。
- W1 削 ~16pp（@268M）~29pp（@33M 早期）。逐 typeid：INT 106M→75M（−31M，Call-arg int 临时回收）；**OPTION 65M→66M 几乎未动**。

含义：W1 与前几步同量级、值得做，但「~50%→W1 就接近 G-a」的预期不成立——leak 仍 ~52% 且单调爬，离 G-a（<<25.9GB / 本机可运行）还远，需 W2/W3。

### 2. 最大剩余块 = scrutinee 位 OPTION，不是 arg [通知]

backlog 原把 W1 描述为「arg/**scrutinee** materialize（最大头）」。实测证实 **OPTION 大块在 scrutinee 位**（编译器海量 `match map.get(k)/find(...){...}` 的 fresh Option scrutinee），W1 的 Call-arg materialize 没碰它（OPTION 几乎没降）。我把 W1 收窄成只做 Call-arg（scrutinee 因 `match scrut{ _=>scrut }` 把 scrutinee verbatim 返回的别名风险留 W2）。**W2 = scrutinee materialize + match-arm return-value 分析**，是确认的下一最大头。

### 3. native 回归网 `native_selfcompile.test.mjs` 未接入 `npm test` [通知]

`tests/native_selfcompile.test.mjs` + `tests/native/real_program.ring` 在 git HEAD 树里、可用（本 session 跑通 3/3），`package.json` 有 `test:native` 脚本指向它，但**默认 `npm test` 只跑 `test:e2e`，不含 native**。这是 native-frontend RC 的唯一回归网（依赖本地 `ring.exe`，fresh worktree 自动 skip）。建议评估是否：(a) 文档化「native 验收需手动 `npm run test:native`（先 native build）」，或 (b) 接入某个聚合 test 脚本。当前 native build 链路（main.o → ring_runtime.o → ring.exe）也无脚本，全手动。

### 4. alloc/free 计数器重新加回 ring_runtime.cpp（守卫，惰性）[观察]

G-a 诊断用的 alloc/free 计数器（memory 记载的标准工具）此前用完被移除。本 session 重加回，用 `#ifdef RING_ALLOC_STATS` 守卫（默认构建零影响）：`g_allocs`/`g_frees`/`g_live_tid[4096]` 在 ring_alloc/ring_drop，每 32M allocs + atexit 打印 live% + top-6 typeid。W2/W3 直接 `-DRING_ALLOC_STATS` 复用。已随 W1 commit。
