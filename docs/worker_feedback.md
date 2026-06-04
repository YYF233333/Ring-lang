# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## #133 B-087 间歇堆损坏（已修复关闭）

### 1. audit 的 bisection 归因是错的，真因是 B-090 暴露的 pre-existing Perceus bug [通知]

audit #133 钉死"元凶 = B-087 Gap 5（#103 mut 参数 boxing），double-free 共享 cell"。worktree agent 隔离复现后**证伪**了这个归因：
- 临时 revert Gap 5（mut-param-boxing）后 3x，`effect_handler_multi_op` 仍间歇损坏 → Gap 5 排除。
- Gap 1/2/3/5 的各自用例隔离 40-50x 全稳定 → B-087 六个 gap 均无残留堆 bug。
- **真因**：`perceus.ring` 的 `HExpr::HandleExpr` case（pre-B-087 既存代码，06-01）从未处理 handler arm 捕获外层变量。这是 latent bug，被 **B-090**（effect handler LLVM codegen——arm 经 `build_handler_evidence→gen_lambda` 变捕获闭包）首次暴露。形如 `Calc.add(a,b)=>a+b+base` 的 arm，其 `base` 在 main 看似 dead → Perceus 提前 `drop(base)`（freed）→ arm 闭包 env capture 已 freed 的指针 → UAF + free-list 损坏。
- **修复**：照搬已有 Lambda case 的 capture dup/move 决策到 HandleExpr（perceus.ring，53 行，1 文件）。遵循 L0 correct-over-leak 约定，无新设计分叉。

**教训**：间歇堆损坏的"单 commit bisection"不可靠——非确定性（~1/3 命中）使逐 commit 测试容易把噪声当信号。audit 把 Wave 8 的间歇失败归因 B-087，但 Wave 8 的失败用例是非 effect 的、effect_handler_multi_op 当时还不存在，归因链断裂未被察觉。隔离 stress（同一 binary 跑 N 次）比逐 commit bisection 可靠得多。

### 2. 我额外验证并排除了"第二 bug"假设 [通知]

audit 记 Wave 8 失败的是非 effect 用例（closure_captures_dict/guard_or_pattern/option_to_fail/set_iteration/string_interp/closure_capture_nonloop/fail_catch），而 agent 修的是 effect 用例的损坏。由于每个 llvm 用例是**独立 .exe 进程**（self-corruption，无跨进程污染），这两者理论上可能是两个独立 bug。我亲自核查：
- full-suite 在 main 上又跑 3x（共 9x，含 subagent 6x）全绿。
- 对 audit 列的 6 个非 effect 用例做**隔离 stress 各 30x = 180 次零失配**。
- 数学：若存在独立的 ~1/3-rate 非 effect 损坏，9x full-suite 漏检概率 < 3%/用例；加 180x 隔离基本归零。

**结论**：只有一个 bug，已修。audit 的 Wave-8 非 effect 归因是 bisection 噪声（含它自记的 96s/387s 异常超时）。无需再开第二条 audit。

### 3. 验收数据 [通知]

JS E2E 731/731 · llvm_diff full-suite 9x 全绿（49/49）· effect_handler_multi_op 隔离 60x 全对 · 6 个非 effect 用例隔离 180x 零失配 · dist 双 bootstrap fixpoint 字节一致。

## #134 native 二进制段错误（新 Critical，B-089 G-a 首次实跑暴露）

### 1. 史上第一次实跑 native 二进制 → 段错误，已立项 + 已定位 [通知]

按你的 roadmap commit"修完 #133 → 本机实跑 native 自编译看峰值"执行 B-089 G-a，**第一次真正运行链接后的 native ring.exe**（历史只验过 .o 生成 EXIT 0，runtime 从 self-hosting 初期就崩、加了仪表但没修，一直"未测"）。结果：**native 编译器编译 hello/极小程序都 `0xC0000005` 段错误**。

你让我"先亲自快速排查"，已缩到固定点：**所有 `fn main` 程序崩在完全相同的 chk=144 / rva=0xfd797 / unbox_int，与函数体无关** → 早期声明管线**单一被误编指令**，一个结构性裸 int(57) 漏装箱被当指针解引用。**类别 = LLVM codegen boxing/ABI 误编，非 RC 堆损坏（与 #133 不同类）**。完整定位（栈回溯 RVA、机制、历史）见 **audit #134**。

### 2. 待你定 fix 策略 [决策]

**现状**：#134 已缩到单点确定性误编，但修复策略未定。下一步是反汇编 rva 0xfd797 的调用者（RVA 已记）映射到具体 Ring 函数 → 找漏装箱的 int → 对照 JS codegen。
**原因**：这是 native 自举核心硬骨头，缩到单点后仍需定调查/修复方式。
**待决策**：
- (A) 派 worktree subagent 接力反汇编定位 + 修
- (B) 你/我继续亲自深挖到 Ring 函数级再定
- (C) 暂搁 #134，先推进 B-097（effect handler phase 2，contained P2）保持节奏
**附带**：native 二进制还无法自托管 LLVM 后端（`llvm_ffi.ring` 的 LLVM-C extern fn 被塞 panic stub），属架构 gap，见 audit #134 末。
