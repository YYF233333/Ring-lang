# Agent Feedback

> Agent → 用户的 durable 异步通道，只保存当前仍未解决、且必须跨 turn / session 传递的信息。
>
> - `[决策]`：需要用户判断的设计问题；对应 item 转为 `waiting-feedback`。
> - `[通知]`：影响后续执行、但当前不阻塞的关键事实。
> - `[观察]`：不算 bug、但值得后续关注的现象。
>
> 常规进度、实现取舍、review 意见和命令日志走实时消息或 worktree artifact。每个活跃 item 最多保留一个 current-state checkpoint，新版本替换旧版本；任务完成后立即删除。历史通过 branch、commit 和测试日志追溯。

---

目前没有待处理的 durable feedback。
