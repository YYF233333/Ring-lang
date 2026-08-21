# Ring-lang Steward fresh handoff（2026-08-21）

后继 Steward：`Ring-lang Steward (fresh)` / `01a02435-45eb-7710-8bbe-6d9397cf3966`。配对 Discussion：`01a02435-0a23-7f43-8846-e2c63c1b5a43`。不得再创建 Steward。

## 安全 checkpoint

- Shared `main = origin/main = 6bf7534facab101d9c6ccc788ef7270c671db1f6`；handoff commit 除外，交接前 clean、无 merge。
- Authority worktree：`.worktrees/ownership-sprime-first`；branch `codex/ownership-sprime-first`；HEAD `1d40ee3136f3a8554097b8dcf529af1f5bf88063`；full tree `28de13da8f8dabd9ef561fc8520bb9db795628ca`；compiler tree `21cb9782ccec69c4c2b0ee84c528a14bdc7076b9`；clean。
- Repository health：2 worktrees、0 dirty、0 errors；active `#268/#269`。无运行命令或子任务。
- 旧 Steward 释放 main mutation lease，并停止修改 main/authority。

## 当前 I′ 事实

- `485b0c6c`：`Pattern::Binding("_")` 在 backend 作为 non-binding fresh C temp，不查/注册 DefId。
- `3c88bfdb`：函数 HIR identity 使用 captured registration scheme；已有诊断错误的程序不进入 move/lowering，validator 未放宽。
- `976bf6b7`：extern-handle structural grammar 仅新增接受 `void* x = NULL`，仍与 bare declaration 同一事件。
- `1d40ee31`：Windows one-shot 对已退出 non-root PID 的 working-set 采样记 best-effort incomplete，不再误判 infrastructure；Job hard limits 与 benchmark `rss_complete` 未改。
- 当前 tracked `compiler/dist-c/main.c` 仍是较早 compiler tree 的 fixed point：17,976,146 bytes，SHA-256 `866EE1EA5E43E52ACDE5EDEB2C974FEC6851531B966C2D5E67413AE6DDE18A42`；对当前 compiler tree `21cb9782` 已过期。

## 当前源码的可恢复证据

- Fresh gen1：`bench/check/results/iprime-1d40ee31-gen0-gen1-aenv-v1/`；`ring.exe` 5,903,872 bytes，SHA-256 `B49C56C6DB34776B89C7C0CCAD6C411A003537DD2C3A7DE21F119258D8223F5E`；receipt SHA-256 `22EF80F9D2AF7D1BB7E8F9CFBEF2927EE4F53613EED1D662EF50990EDDBC917F`。
- Construction archive：`iprime-1d40ee31-gen0-gen1-aenv-v1-success.7z`，6,420,699 bytes，SHA-256 `A38705BAD4A2A8D349D254D2804883034E9774185EE5AA27D9E42D503CB1734B`。
- 原 full-runner 四个失败点已针对性 `4 PASS / 0 FAIL / 0 SKIP`：duplicate-def E0207、callee metadata golden、同项 RC、extern-handle structural。Archive：`iprime-1d40ee31-full-failures-focused-v1-success.7z`，46,408 bytes，SHA-256 `9F1BC7D688BA2AAC85F3202D299D4B31410F3F964F0109B50E9ADA214469EA78`。
- Current-source module checks、source/mutation、one-shot 23（4 POSIX skip）、entry 11、legacy WindowsJob 3、workflow/health 均通过。

## 边界与旧证据

- 旧 `958`、`a2d`、`ffd`、`505`、`783`、`366` 失败 transaction/root 均 sealed、nonretry、noninput；以 `docs/audit-report.md` 为真值。
- 用户批准 COFF oracle：保留 raw objects/hashes；验证 AMD64 COFF；只归一化 TimeDateStamp offsets 4..7，且全部 raw diff 必须是该集合子集；C/ledger/stderr literal identity。旧 v3 已按此裁决 PASS，禁止 v4/structural 重跑。
- 较早 `485b` tree 已通过 H+T structural、wildcard focused 与 gen2/gen3 fixed point，但不能证明当前 compiler tree `21cb9782`。
- Trait-default executable-HDecl ownership 缺口仍阻塞完整 ownership/release claim，但不阻塞 I′ identity-only checkpoint。

## 唯一下一门

- 空目录已存在：`bench/check/results/iprime-1d40ee31-gen1-gen2-aenv-v1/`（0 files）。继续时在该目录创建全新 reviewed 3-file B-189 A-env packet；输入只允许当前 gen1 `B49C56…23F5E`、receipt `22EF80…917F` 与当前 authority/tool/runtime pins。
- 资源：inner 2700s、Job 12,884,901,888 bytes、active `<=5`、poll 10、1 MiB streams；outer 2730s。近期同类成功约 574s，可用作 first wait point。
- 成功后生成 gen3，要求当前 gen2/gen3 `main.c` literal 相等；再机械更新 tracked anchor、review、运行一次标准 full runner，最后跑 targeted ASan。
- 任一 nonzero/timeout/cap/missing artifact/receipt/audit/measurement 永久停止该 exact transaction，不静默重试。

旧session的 heartbeat `ring-lang-steward` 已设为 `PAUSED`；后继若需要，应通过 app automation tool 绑定到自己的 thread。
