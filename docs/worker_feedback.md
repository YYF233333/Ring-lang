# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-157 worker feedback（2026-06-29）

### [通知] test runner UAC 修复

`tests/run_tests.py` 的 `CLANG_LINK_FLAGS` 使用 `/MANIFEST:NO`，导致 Windows Installer Detection 对包含 "update" 等关键词的测试文件名（如 `cell_update.exe`）触发 UAC 提升请求（WinError 740），test runner 直接 crash。这是 main 分支也存在的预存在问题。

已修复：改用 `/MANIFEST:EMBED` + `/MANIFESTUAC:level='asInvoker'`，与 ring.exe 构建脚本一致。

### [通知] `return ()` 的 bootstrap 陷阱

修改 std/*.ring 使用 `return ()` 时，需要先完成 double bootstrap（让新 ring.exe 包含 parser 修复），否则旧 ring.exe 加载 prelude 时会因解析失败静默丢弃整个 impl block。Stage 0 self-compile 用旧 ring.exe 加载 prelude，所以 std/ 文件必须与旧 parser 兼容。只有 stage 1+ 的 ring.exe 才能处理新语法。

