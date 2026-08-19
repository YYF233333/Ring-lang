# Ownership critical authority handoff

> 只保存当前恢复真值；历史失败与逐轮实验留 Git / evidence index。

## Authority

- Branch：`codex/b180-feedback-loop-continuation`
- Checkpoint：`b75d2c881908c95bef180f0e7fa802e745a20713`
- Tree / compiler subtree：`2f4b5d8896db437c59f40f55708f7c201760878b` /
  `d1da4c5e437a442a0607c4fda6c25e96ecb75b06`
- Tracked C anchor：24,279,526 bytes；SHA256
  `D7BB015B32EF8F4A438093509C794C82B60C13548808B0A1093AEFEAB0DF7F2E`
- Coupled item：audit `#268` / `#269`。该 branch 不再承载其他实现 item。

## Invariants and state

1. A-prime ownership authority 仍是 symbolic shape + callable-mode fixed point +
   临时 CFG dataflow + exact HIR `Take`；checker、Perceus、verifier 不得按名字或
   leaf spelling 重建真值。
2. S-prime safe-tail Option cleanup 已有 source-built gen1 focused evidence：runtime
   1/1、RC 8/8、generated-C structural 1/1、parity 1/1；尚未通过 fixed point，
   不得更新 anchor 或关闭 `#268/#269`。
3. `B-176` 尚无可从最新 main 重放的完整 baseline；保持 doing。`B-180`
   compiler optimization 冻结，只保留 runner anchor-object cache。
4. 恢复主线：`B-186 -> #268/#269 -> B-176/B-180 -> remaining correctness/ABI
   freeze -> B-183 -> B-174/B-177/B-175 preview candidate`。

## Fixed crossing authorization

- B-186 恢复门通过后，只允许对完全固定、无代码变化的 S-prime gen1 执行一次
  gen1 -> gen2 crossing：Job commit `23622320128` bytes（22 GiB）、active processes
  `<=5`、无其他重负载、首次等待点估计精确 72 分钟、hard wall 90 分钟。
- gen1 仅是 bootstrap seed。若产出 gen2，gen2 -> gen3、文本 fixed point 和完整
  C/RC/ASan/self-host/final acceptance 全部恢复 `12884901888` bytes（12 GiB）。
  只有 gen2/gen3 C byte-identical 且原门全绿才能关闭 `#268/#269`。
- 若 22 GiB 触顶、超时或无产物，永久停止资源加码：不试 24/32 GiB、pagefile 或
  重跑。改在最新 main 独立重现/移植 S-prime 并完成其自身 fixed point，再分 checkpoint
  重放 A-prime；若二者不可分，先执行新 Argument，不恢复 seed/unity probe tree。

## Evidence and blockers

- 12 GiB S-prime gen1 -> gen2：2371.12 s 触顶，无 gen2；verifier-stub lite 同边界。
- A6 seed `098d8ea9` 的 2^32-allocation prefix 仅将 live/peak 降 0.652%/1.126%，
  未过预注册 20%/10% 门，未运行 full crossing。
- Unity `f75d107f` / `58075b40` 没有形成权威运行收据，已停止；不得静默重试。
- 全 refs bundle：`C:\Users\Yufeng Ying\Desktop\Ring-lang-convergence-backup-b75d2c88\all-refs.bundle`
  （SHA256 `74852CB23DD8D9D185446BA8B67125C666CA7F4F6A4EF4E39D0E19DBE0B2D5F2`）。
- WIP/ignored archive：同目录 `wip-and-ignored.7z`（SHA256
  `F1EB25DBB5D476396884B3A158355C6E20F6F4AB02EC7C826C4F75D48FF13B74`）。
- Codex 管理的 `219a` / `8166` ignored evidence 在 snapshot 前被宿主回收；refs 已保留，
  原始目录未备份，不得宣称仍可重放。

## Next action

先完成 B-186：main/branch 看板同步、branch 单责、repository-health gate、origin push/CI。
随后核对固定 gen1/source/runtime/toolchain 身份；只有全部 pins 与空闲资源门满足才启动上述
唯一 22 GiB crossing。
