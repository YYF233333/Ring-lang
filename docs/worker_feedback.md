# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

---

## [通知] binding.gyp LLVM 路径为另一台开发机路径，本机构建需本地改写（2026-07-10，Phase 0 worker）

tracked 的 `compiler/llvm-addon/binding.gyp` include/lib 路径是 `C:/software/Scoop/...`（另一台机，`e1c9cb9` 提交）；本机实际为 `C:/Users/Yufeng Ying/scoop/...`（先例 `41e84a1`）。为完成 addon 重建已本地改写，**未提交**（提交会反向弄坏另一台机）。两机路径冲突建议长期解法：binding.gyp 改用环境变量（`LLVM_DIR`）或 `!(node -p ...)` 动态探测，免得每次换机来回翻烙饼。

## [通知] 冻结 JS 编译器 emit 失败时 exit code 仍为 0（2026-07-10，Phase 0 worker）

`node compiler/dist/main.js build … --out-dir=<不存在的目录>` 时报 `Failed to emit object file` 但**进程退出码为 0**——脚本/CI 层面假绿隐患。冻结产物已不再更新可不修，但现源码 cli.ring 是否同病未查证，建议列入 audit 待验。
