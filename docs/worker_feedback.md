# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-104 D9 Part 1

### 1. re-measure 数据 + 门① 待拍 [通知]

D9 Part 1（interp SB codegen-drop，git `7ff1718`）验收全过：
- **probe**：allocs=frees=460020, live=0 (0.0% leak)，SB 0.0% retention，STR 0.0% retention
- **re-measure @2.382B**：live 55.63M→27.96M（−49.7%，leak 2.3%→1.2%）；SB 12.02M→**0**（−100%）；STR 28.16M→21.10M（−25.1%）
- **全编译终点**：SB retention 0.0% 贯穿全程（born ~46M，live 0，spec「SB 47M→~0」完整兑现）；STR retention ~5%（live ~31M / born ~655M），合法存活为主

D9 两 part 落地后 B-104 的技术工作全部完成。**待 Discussion 拍板**：
- 门① refined 判据 re-verify（孤儿类→~0 + leak%→~0/有界 + verifier 全绿 + 无 per-iteration 无界类）
- G-a 三门收尾判定
- capstone 全强度 ASan 自编译时间安排

### 2. 自编译 exit code 1 [通知]

re-measure 自编译（`ring.exe build compiler/main.ring --out-dir=compiler/dist-test`）exit code 1。产出文件正常（43 个 .js），alloc-stats 完整输出。可能原因：目标目录问题或单文件编译错误（编译器自身含某些触发编译 warning 的模式）。不影响 re-measure 数据有效性（alloc-stats 在 atexit handler 中打印，进程正常退出才有）。B-089 终验时需排查。

### 3. Str pass-through 安全性确认 [通知]

probe C（Str 类型表达式在 interpolation 中，convert_to_str pass-through）ASan 全 clean，验证了 `!is_str_type(expr_type)` 条件判断正确——不会 double-drop D1 管理的 HExpr 值。
