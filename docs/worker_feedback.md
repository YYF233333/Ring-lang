# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-090 自定义 effect handler LLVM codegen

### 1. B-090 scoping —— 建议设计讨论后再 dispatch [决策]

**现状（Worker 2026-06-03 贴码 scoping）**：
- LLVM `gen_handle_expr`（`codegen_llvm_expr.ring:3303`）对非 abort effect **存 null 当 evidence**（3333）后直接跑 body（3349）——handler 根本没接线。
- `gen_effect_op`（3384）对非 fail effect **直接返回 null**（3418），不调用任何 handler。这就是 B-088 #1「Unit op + 副作用 body 静默丢输出 / 返回值 op 崩」的根因。
- 唯一能用的是 `fail.raise`（abort）：走 `ring_try`/`ring_raise`（setjmp/longjmp）。
- **好消息**：evidence threading 的脚手架**已全铺好**——fn 签名已带 evidence ptr 参数（定义处 `codegen_llvm_decl.ring:161` 绑定、call site `codegen_llvm_expr.ring:989/1408` push `lookup_evidence`）。整条管子在，只是全程喂 null。
- JS oracle（`codegen_expr.ring:1332 gen_handle`）：evidence = JS 对象 `{op: closure}`，EffectOp = `__ev_X.op(args)`，evidence 当 fn 参数线程化；tail-resumptive → op 调用返回值即 resume 值（无续延捕获，这是它可行的关键）。

**所以 B-090 不是「从零做 effect 系统」，是「把 null 换成真 evidence 对象 + 真派发」。** 但有三个跨阶段 / RC / 范围决策不该让 worktree agent 擅自定：

**原因（三个真决策）**：

- **D1 — evidence 对象表示 + op-slot 契约**：JS 用动态键对象；LLVM 必须定一个具体 struct 布局——哪个 slot 放哪个 op。这是 `gen_handle_expr`（构造）与 `gen_effect_op`（派发）之间的**跨阶段契约**，性质同 `hir.ring` 的 `variant_js_name`，按 CLAUDE.md 约定该进共享层、设计级拍板。选项：(a) struct of `{fn_ptr,env}` 闭包，slot = op 在 effect 声明里的顺序（读 effect_ops registry，与 JS 对齐）；(b) 复用 trait-dict 机制（effect-as-trait，evidence 即 dict）；(c) 其他运行时关联结构。
- **D2 — handler op body 当闭包 + RC 生命周期**：handler body 捕获外层作用域 → 闭包（typeid 7 + B-084 刚落地的 typeid 15 closure-env）。evidence 持有这些闭包，须活过 handle body、scope 结束时 drop。与刚合的 B-091（cell 14）/ B-084（env 15）RC 直接交互，有 leak / double-free 风险——这块得想清楚才动。
- **D3 — 范围分期**：tail-resumptive 非 abort（核心，必做）；多 op / 多 effect / 嵌套 handler（常见，多半必做）；默认 body（#72 未处理 op 的 default）进还是 defer？**自定义 abort effect**（非 fail 的 abort，如用户 `effect Exc`）——JS 靠 EffectAbort + effect-name 匹配，LLVM 只有 fail 接了 ring_try，进还是 defer？delegate effect 转发（B-088 #4 同根因）一并还是分开？

**待决策**：
- **(A) 推荐**：路由给 Discussion 定 D1 表示契约（建议选 (a)，与 JS 声明顺序对齐最省心）+ D3 分期，再让 Worker 按定好的契约 dispatch。理由：D1 是 load-bearing 跨阶段契约，定歪要返工。
- (B) Worker 直接按 (a) + 全范围 dispatch 一个 XL worktree agent，agent 自定布局事后 review。风险：契约 + XL 单 agent 跨 RC 交互易错。
- (C) 拆两步：先做最小核心（单 effect 单 op tail-resumptive，evidence 按 (a)）锁 parity，再单开 item 做多 op / 嵌套 / default / custom-abort。

**Sizing 修正**：脚手架已在 → 核心（D1+D2，单 effect 单 op tail-resumptive）约 **L**；全 parity（多 op / 嵌套 / default / custom-abort / delegate）才是 XL。倾向 (A)+(C)：Discussion 定契约 + 分期，先 L 核心锁 parity。

> 不阻塞链条推进：B-087（parity 收口，独立于 B-090）可在 B-092 后继续。
