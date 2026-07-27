# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
>
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

---

## B-163 Phase 2 P2.1 parity 基线（2026-07-27）[通知]

merge `156b005` 已把 Phase 2 的证据层落成机器门：81 行 matrix（65 covered / 13 known-gap / 3 manual），enum variant closure、完整双后端 lane bundle、repo-relative gap identity、orphan companion 与 `EXPECT_PANIC` 作用域都由 runner 反向校验。完整结果与五个 LLVM 间歇 `0xC0000005` 样本已回填 backlog B-163。

当前进度与后续顺序：

1. P2.2 已闭合唯一 check-only gap audit #222、module-qualified effect evidence、default effect body pipeline、handler mutable/transitive capture 与 struct named-pattern；matrix 当前 **71 covered / 8 known-gap / 3 manual**，剩余 1 LLVM-only + 7 shared-positive。LLVM-only `default_effect_topo` 保留为退役证据，不为即将删除的后端扩修。
2. 七个 shared-positive 的明确归宿：`api_clone` + 两个 Set gap 进入已拍板的 B-107/B-152 P4（Map-backed `Hash + Eq` + 自动 derive Hash）；tuple equality 两项与 Iterator 可独立修；`effect_custom_and_fail` 对应 audit #251，已拍板方案 A（执行 arm body、结果替换整个 handle、re-raise 逃向外层），现可独立实现。
3. 把三个 manual 项变成自动门或删除死面：`HStmt::Dup` 无生产者、C `#line`、extern-handle RC 结构断言。
4. 对抗 review + 全量 C/LLVM/diff/RC/self-compile 固定点；只有认证门闭合后才创建 `llvm-c-backend-final` tag 并进入删除清单。

当前禁止把 matrix 的 wiring PASS 当语义执行 PASS；`--suite parity` 输出已明确标注这一点。LLVM tag/删除、dist-c anchor 与 CI bootstrap 尚未开始。

本轮 handler/struct 收口的 LLVM anchor 三代 `main.o` 已达到 fixed point：4,757,685 bytes，SHA256 `401CD341752CF61339BB758085E7EF4BDFACC895613116A8AE79E8124EF1EBBE`。reviewer 发现并纠正了最初把 known-gap SKIP 误报为 3/3 的证据问题；最终结论只采用移除 skip 后的正式 runner 与 direct build/link/run。LLVM 内存 verifier 的单条 warning 与最小程序/旧 anchor 同构，落盘 IR 经 clang 与独立 LLVM-C verifier 均合法，继续归 audit #247 baseline，不伪称 verifier clean。

abort 方案 A 的实现前静态 probe 还确认：`infer_handle` 会丢弃所有 handler arm effects，且不把 tail-resumptive arm 结果与 op return type 统一；纯函数 arm 调用 `print`、Int op arm 返回 Str 均被错误接受。abort 半边纳入 #251 必要验收，通用 tail-resumptive 半边独立记 audit #258。
