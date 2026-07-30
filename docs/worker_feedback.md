# Repository Steward Inbox

> 路径因历史引用保留；这里不是 worker 日志，而是用户低频 check-in 的异步收件箱。
>
> 只允许三种条目：
>
> - `[决策]`：语言方向、公开语义/ABI、安全保证、P0/路线或不可逆动作等用户保留决定；
> - `[里程碑]`：跨 session 仍值得用户知道的结果，最多五条；
> - `[全局阻塞]`：所有可执行队列均被同一问题阻塞。
>
> 禁止记录 subagent 等待、命令执行状态、普通实现细节、原始日志、逐文件流水或可从 Git/看板恢复的 WIP。
>
> 单个 item 等决策时转 `waiting-feedback`；Repository Steward 必须继续其他无阻塞工作，不能停下来等用户。

---

当前无待用户处理的决策。

- `[里程碑]` 2026-07-31：B-107 主体 merge（`ce994fc`）——自动 `derive Hash` + Set-on-Map（B-152 P4 完成，runtime -440 行）+ Unit 3 `ResolvedNamespacePlan` 抽取 + E0305 导出修复（对抗 review 抓到并消灭 plan-replay 镜像机制）。门禁：双 review + 干净 ×3 + double bootstrap 固定点。剩余工作分流为 B-171（裸名收紧实施）/ B-172（C′ 主体）/ B-173（Hash 覆盖面）。间歇编译器 AV 定量立案 #261（~1/全量轮，先于本分支存在）。
