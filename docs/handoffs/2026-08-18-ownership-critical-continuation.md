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
- Latest-main fallback base：`75f83b2d2208462051fa67b99d9296d79b61dcb2`；旧 branch 只保留 A-prime/S-prime 证据 authority，不作为可直接 bootstrap 的 seed。

## Invariants and state

1. A-prime ownership authority 仍是 symbolic shape + callable-mode fixed point +
   临时 CFG dataflow + exact HIR `Take`；checker、Perceus、verifier 不得按名字或
   leaf spelling 重建真值。
2. S-prime safe-tail Option cleanup 已有 source-built gen1 focused evidence：runtime
   1/1、RC 8/8、generated-C structural 1/1、parity 1/1；尚未通过 fixed point，
   不得更新 anchor 或关闭 `#268/#269`。
3. `B-176` 尚无可从最新 main 重放的完整 baseline；保持 queued。`B-180`
   compiler optimization 冻结，只保留 runner anchor-object cache。
4. 恢复主线：`#268/#269 -> B-176/B-180 -> remaining correctness/ABI
   freeze -> B-183 -> B-174/B-177/B-175 preview candidate`。

## Closed crossing route

- 固定 `a11ea063` archive 可由 exact A6 重建出精确 `DBC154…` C，但同一轮产出的
  `main-lto.o` 为 `E7910…`、`runtime-lto.o` 为 `6A09B…`，分别不等于权威
  `5E862…` / `9DFD…` pins。
- Git refs、B-186 bundle/WIP manifest、备份目录和现存 receipts 没有另存的 object bytes
  或完整历史 recipe；`219a` / `8166` ignored evidence 已在 snapshot 前被宿主回收。
- exact-object precondition 因而失败；22 GiB crossing 永久关闭且不算已消费一次 run。
  禁止 link 近似 objects、接受新 hashes、猜 flags/path、以最终行为替代 pins、继续搜索或重试。
- fallback 固定为 latest main 独立重现/移植 S-prime，先在 12 GiB 下完成自身 fixed point，
  再分 bounded checkpoints 重放 A-prime；若二者不可分，先执行新 Argument。不得恢复
  seed/unity probe tree。

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

先做一个只读 S-prime 独立性矩阵：从 `cbfd5817`、`4eb08ce8`、`cf275c36`、`a11ea063`
及其 focused tests 中列出每个新增/消费 symbol，并对 latest-main fallback base 证明它不依赖
A-prime 的 lexical-scope、ownership-shape 或 callable-mode 变化。任何不可分依赖立即停止并提交
新 Argument；矩阵闭合后才建立唯一 #268/#269 authority checkpoint，原子移植 S-prime 与 verifier/tests，
先走 focused correctness，再按原 12 GiB 门做 S-prime 自身 fixed point。A-prime 只在该 fixed point 后分段重放。
