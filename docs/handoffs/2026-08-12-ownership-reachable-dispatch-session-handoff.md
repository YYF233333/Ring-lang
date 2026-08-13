# Repository Steward strict ownership / performance-unblock completion handoff（2026-08-13）

## 完成状态（2026-08-13，用户验收口径）

**状态：COMPLETE。** 用户已明确把 `ownership-reachable-dispatch` development-unblock item 认定完成，
要求提交当前成果、归档本 session，并由新 session 启动性能主线。本文以下旧恢复步骤仅保留为实现与证据
lineage，不再授权恢复本 ownership wave 或重跑已经通过的 focused 检查。

最终开发解阻证据：

- current source 已由 final A7 严格生成 clean `main.c`，随后完成 O3+ThinLTO native link；核心 compiler
  单文件检查以及 callable const re-export、const-owner barrier、default freshening/fixed-point、method
  generic bound/dictionary、exact effect-variable mapping 等 focused 正负矩阵已通过。
- `default_precheck_fixed_point` 完成 build/link/run，输出与 expected 精确一致；`list_sort_ord` 的旧 5 条
  E0503 已消失；两个 transaction/rejected-default negatives 仅产生预期 E0301，无 ICE/panic/级联污染。
- tracked `compiler/dist-c/main.c` 已更新为 final A7 clean generation，SHA256
  `D7BB015B32EF8F4A438093509C794C82B60C13548808B0A1093AEFEAB0DF7F2E`，并与已成功 native link 的
  TEMP generation byte-identical。
- A7→A8 byte fixed point 因单进程约 20–22GB working set、长时间分页而由用户决定停止；这项和 final
  full-suite 属于 B-180 完成认定/release 的严格门，不再阻塞 developer-unblock checkpoint 或 B-176
  baseline。当前没有 Ring 长进程。
- 按用户明确的降级验收规则，不因缺少重复退出码、日志形式或 byte-identical A8 再复跑已确认通过的
  检查；只有确定失败才重新执行对应测试。

下一任务：在本提交快照上执行 B-176 正式 cold/warm baseline，固定 compiler/anchor/toolchain/manifest、
CPU/RSS 与原始样本，形成 top-3 构成及收益预算；随后按 profile 进入 B-180。#268/#269 的非开发阻塞
长尾继续留在 final acceptance gate，不回退本 item 的完成状态。

> 这是 `codex/ownership-reachable-dispatch` 当前唯一恢复真值。它完整取代本文件此前关于
> OR projection a2、6×E0801、旧 dirty 列表、旧 bootstrap pins 和旧执行顺序的内容。
> 2026-08-13 完成段落优先于下文 2026-08-12 的恢复说明；下文只作历史证据记录。

## 用户已拍板的目标与顺序

用户同意混合推进方案：

1. 先关闭“开发解阻门”所需的 critical 核心：严格 self-host/bootstrap 必须可信，不能有会污染
   性能基线的 ownership/metadata 假绿、panic 或跨代 artifact。
2. 开发解阻门通过后立即正式执行 B-176 性能基线，并推进 B-180 性能优化。
3. 与性能开发正交、不会污染基线或编译器信任链的 critical tail 可以暂缓。
4. B-180 最终验收、发布或宣称性能目标完成前，所有 critical tail 与完整 C/RC/ASan/self-host/
   double-bootstrap 门仍必须关闭，不能降低 correctness 或测试覆盖。

该策略已作为治理决策提交；不要再按旧 handoff 的“所有 critical 完整关闭后才开始 B-176”执行。
同样不要承诺未经验证的结束时间。

## 恢复前必须完整读取与硬约束

新 session 开始时完整读取：

- repository root `CLAUDE.md`
- repository root `docs/workflow.md`
- repository root `.agents/skills/steward/SKILL.md`
- 若要继续讨论优先级/语义决策，再读 `.agents/skills/discussion/SKILL.md`
- 本 handoff

随后：

```powershell
Set-Location 'C:\Users\Yufeng Ying\Desktop\Ring-lang\.worktrees\ownership-reachable-dispatch'
python .agents/scripts/validate_workflow.py
git status --short
git diff --check
```

硬约束：

- 所有仓库推进只在上述现有 worktree；不要创建替代 worktree。
- 不要 reset、stash、clean、checkout，不要丢弃任何 dirty compiler/tests patch。
- 使用 `apply_patch` 编辑仓库文件。
- focused 严格门和同源 fixed point 通过前，不再改 tracked `compiler/dist-c/main.c`。
- TEMP diagnostic C 不得复制进仓库。
- 当前没有长命令或 Ring 子进程在运行。

## Git、治理提交与当前状态

- worktree：`C:\Users\Yufeng Ying\Desktop\Ring-lang\.worktrees\ownership-reachable-dispatch`
- branch：`codex/ownership-reachable-dispatch`
- HEAD：`9a34747c7de5f8974e9f5d65738c0e27e2c6a237`
- HEAD subject：`docs: allow feedback performance after dev-unblock checkpoint`
- `main`：`7734c27c6fe4875d03e8451ac9f507c9d8270bd1`
- merge-base：`7734c27c6fe4875d03e8451ac9f507c9d8270bd1`
- workflow validator：PASS，`46 active backlog items, 18 active audit items, 2 steward adapters,
  4 Codex roles, 20 negative fixtures, 2 durable-ledger regressions`
- `git diff --check`：PASS；仅 LF→CRLF warning。

治理提交 `9a34747c` 修改并提交了：

- `docs/backlog.md`
- `docs/design.md`
- `docs/philosophy.md`
- `docs/audit-report.md`

它正式写明两道门：developer-unblock checkpoint 与 final acceptance gate；B-176 可在前者后开始，
B-180 的 infra/profile/runner/cache/jobs 及语义独立热点可先推进，最终验收仍要求全部 critical。

当前 worktree 仍有大量预期 dirty 文件。tracked compiler dirty 为：

`builtins.ring`, `checker.ring`, `codegen_c_expr.ring`, `dist-c/main.c`, `env.ring`,
`exports.ring`, `hir.ring`, `infer.ring`, `infer_ctx.ring`, `infer_decl.ring`,
`infer_register.ring`, `ownership.ring`, `perceus.ring`, `types.ring`, `verify_rc.ring`。

另有 tracked fixture/runner edits 与多组 untracked focused fixtures。完整名单以恢复时
`git status --short` 为准；这些全部是当前工作成果，不是未知 writer drift。tracked diff（不含
untracked）约 `420419 insertions / 407959 deletions`，大头是历史生成的 tracked C。

## 当前源码与 tracked artifact pins

| 文件 | bytes | SHA256 |
|---|---:|---|
| `compiler/builtins.ring` | 60133 | `4A2E3EE3AF21403627D12DFA74211E84D0D8C2681EB88BF507F38E4FF036AEAF` |
| `compiler/checker.ring` | 64862 | `DE2FE45D1DA378901717F70F72D45FBA43B851736E1E18451AC00A2166DF9A4D` |
| `compiler/codegen_c_expr.ring` | 204540 | `091A5F9942760C4F40262E76A2454BBB9F045D532B5FB7656E56FDE529AFCE53` |
| `compiler/env.ring` | 73453 | `AB0DBD369B7C0276DF01EE052CAC5BB73919E7DA6B3313A81314C7FB2DC6C36B` |
| `compiler/exports.ring` | 64810 | `052E323CD6A09DE09FA796434073C75AB34F86378DE015797F931FBDF482926E` |
| `compiler/hir.ring` | 101022 | `554EE9907CF4A8148796360C6BA86FFD384C66D646B6DE46DB0D5F921BADDBB9` |
| `compiler/infer.ring` | 191784 | `82C63988F81A77A83737BE42027D6FA1764678A04BFA2EE8B370552154B45B2A` |
| `compiler/infer_ctx.ring` | 167662 | `EE08D5A7DE38F15C290DCEE80969CF91FD8E3E77ADBD04074FE1F2C0F58B93D7` |
| `compiler/infer_decl.ring` | 284456 | `243F87314D84F1942B5FF2CC1ABB5E7BD9EA5F8735E46B96407A1B161FF0C640` |
| `compiler/infer_register.ring` | 214247 | `11814429D3981BBCF5F0B2D92E6BE35E84FE3CC7536321CC171F51F58D0CD250` |
| `compiler/ownership.ring` | 398347 | `3D20F007B17E85597A9ABFDFEC81BBCC85E7C46D36F3D1444C8EB6A7961625BA` |
| `compiler/perceus.ring` | 213913 | `91FCE4CFB70222FF4E626E4BCC7C9646487E3C9287F54C7FBDCFA03A31012507` |
| `compiler/types.ring` | 80852 | `8CDF252A0C277F036ACC251918CD97A159746AE06EE79BAFAF2B0E7FBBB7A4BC` |
| `compiler/verify_rc.ring` | 111887 | `046DB7B750A9948BD77E8800A09788E13E84B4653E54B869BD174291F9C3AD00` |
| `tests/run_tests.py` | 454046 | `B73363C06DE5C923E7D93C5523D931E8D11E1BD08069DA3B463068A41DAB8623` |
| tracked `compiler/dist-c/main.c` | 22465167 | `7A637EE98888676ED21B4DF7E13546745CE9364420CF675874D8A0D0969C5392` |
| root `ring.exe` | 6340096 | `7552EA17438B1AE61089F6B2EFBD35BE70B68FFAF6AB2BB8168803E513AE81A2` |
| root `ring_runtime_lto.o` | 141624 | `963F6AB8DFDB6F537060C38B8EEAE74B7EB4884E8BCA7AE8DC10B88D5F5B826F` |

tracked C 与 root `ring.exe` 都不是当前最终同源 authority；保留但不要用于宣称 fixed point。

## 已证明是合理推进、可保留的 bounded 实现

以下不是“跑报错乱修”，每一项都有独立 root lineage 与可证伪 oracle：

1. ownership OR payload projection/reachability：ACCEPT（bounded）。修复 whole payload 在 alias
   fallback 前发布 exact DefId，并保持多 whole fail-closed；projection check 与 payload runtime 已过。
2. OR binder frontend invariant：ACCEPT。每 alternative 同名集合、无 duplicate、对应 type unify，
   canonical DefId 只分配一次；missing/duplicate/incompatible negatives 已锁 E0301。
3. C OR lowering：ACCEPT。每 alternative 完整 test 成功后绑定同一 arm DefId slot，再汇合 body；
   runtime 已覆盖首/末 alternative、nested miss、tuple/named/callable payload。
4. structural reachability + retained-HIR metadata census：ACCEPT（bounded）。semantic child edges与
   retained metadata totality分离，Match/If/While/For/IfLet/TryCatch 共用 structural reachability；
   planner/backend 对 dead dependent child neutral；RC guard edge另有 verifier oracle。
5. tuple Match borrow-view：ACCEPT。direct tuple scrutinee 不再把 inspection 错当 owning transfer；
   `golden/tuple_match_named` strict runtime 通过。
6. FORCE/OWNING side authority：方向与 focused 行为已验证。descriptor仍只有 Borrow/Mut/Move；
   per-DefId transfer levels保存 caller invalidation strength，explicit Move=FORCE，body/storage inferred
   Move=OWNING。六个跨模块显式 FORCE negatives和 scalar OWNING positives已同时通过，证明不是
   blanket FORCE/blanket OWNING。

这些是 critical 真实进展，但整个 #268/#269 仍未关闭。

## 本 session 新关闭的 development-blocking root：impl effect precheck transaction

原 P0：impl effect prepass 逐方法把 checked scheme写入 live registries，随后全量回滚 ownership UF；
omitted-return lambda/call-result 的 durable scheme因此可引用已删除 term，或在 term id复用后静默串到
无关 descriptor。`compiler/diagnostics.ring:133` 的 impl lambda曾触发
`final callable ownership has no transfer authority`。

当前实现：

- `InferCtx` 有 `ImplEffectPrecheckUndo` journal。
- precheck 先记录旧 method scheme；成功只提交映射回 registration params/return/outer ownership term
  的 EffectRow projection。
- speculative method scheme、DefId metadata、roles、defaults、boxing/provenance等回滚。
- 成功路径保留 ownership term arena单调性，因为 committed effect row可能含 callable term。
- 失败路径恢复旧 UF parents/solutions，但不回退 term id。
- 本 session 修复了 journal helper 本身对 owner-bearing `target_type/trait_name/origin/method_name/span`
  的重复消费；使用真实字符串/Span duplicate firebreak，不改事务语义。

严格 A6 证据：

- `check compiler/diagnostics.ring`：exit 0，0.72s，stderr 0。
- `check tests/cases/trait_generic_impl.ring`：exit 0，0.20s，stderr 0。
- `tests/cases/impl_effect_precheck_callable_return_transaction.ring` strict build/link/run：exit 0，
  stdout精确 `2\n3\n4`，覆盖 omitted lambda、omitted callable call-result、annotated control。

这直接反证 dangling-term 原 P0；不要回退 transaction patch。

## 本 session 新定位/修复的 root：pre-solve lexical callable alias provenance

已证根因：project/inline namespace alias在 body ownership fixed point 前分配 fresh lexical DefId，
`localize_exact_import_alias_scheme`复制 provisional state；ownership term可随 UF收敛，side transfer
levels不会自动刷新。named factory返回该 alias时，explicit FORCE 会被 stale false 洗成 OWNING。

正确边界：

- 保留 alias 独立 lexical DefId；不得复用 canonical DefId。
- 记录 exact `alias DefId -> canonical source DefId` producer edge与 arity。
- checker把两张 map传入 ownership fixed point；solver预种 alias graph并通过现有 resolver发布完整
  transfer levels与result roles。
- impl effect precheck同时 snapshot/restore这两张 map。
- 不按名字、FnType、ownership term或 `move` descriptor猜 producer/force。

当前源码已实现两条入口：

1. `apply_project_value_binding`（project root/child namespace overlay）。
2. `bind_exact_import_alias`（inline `pub use self/super` 与 exact import/re-export）。

第二条是 session 最后新增，位于当前 `infer_ctx.ring` hash `EE08D5...`，尚未进入任何严格
generated compiler。

### 为什么追加第二条

A6 strict focused 仅 `ownership_private_callable_const_reexport` panic：
`unreachable: callable slot has no full transfer authority`。

TEMP-only A6 C diagnostic（绝不能入仓）精确输出：

```text
callable-transfer-slot=1295 logical=647
table state=0 alias=0 contract=1 arity=1 untrusted=0 opaque=0
metadata contract=1 state=1
```

即 logical DefId 647 有 provisional contract/state但没有 alias edge/transfer authority；fixture恰为
private exact callable const经 `pub use super::HIDDEN_CALLBACK as callback` 重导出。静态路径确认它走
`bind_exact_import_alias`，不是 `apply_project_value_binding`。当前补丁把该 exact alias接入同一
producer map；没有放宽断言。

用 A6 strict 对更新后的 `compiler/infer_ctx.ring` 做单文件 check，子进程完成且 stdout/stderr均0；
外层 shell先超时，未保留可靠 exit code，因此这只能算无诊断 smoke，不能算 current-source PASS。

## A6 crossing / strict artifact lineage

旧 A5 有已确认的 orphan bug，不能直接作为 current semantic authority。仅在 TEMP A5 C 中把该单一
strict empty-transfer panic替换为 Unit，生成 O2 bridge；bridge只用于跨越到第一代当前编译器。

第一轮 crossing在约15.9分钟确定性报9条 E0801，全部位于 effect-precheck journal helper的参数
重复使用；修复duplicate firebreak后第二轮完整生成成功：约34.2分钟，exit 0，stderr 0。

A6 原始 clean 产物（在 TEMP diagnostic插桩之前）：

| artifact | bytes | SHA256 |
|---|---:|---|
| clean generated `main.c` | 22733018 | `D3A268EDF433D94ADDE96E8F141CFC7D5BF2197E2021D554C155D57C107A5C7F` |
| generated `main.o` | 5672761 | `6F9BF19E9E73888B83D1985BE05264F05334C90862072F318C8E27CEC8CF6C2F` |
| O3+ThinLTO `main-lto.o` | 5073264 | `0FD16FE3858E57D9272621A8999A52866FD7397A42428A306281B14AFE68E625` |
| O3+ThinLTO runtime | 141396 | `4FEC2CF0BAB27D3F1B90155D314F2A4B317B79190BF75CC2D43EBD65773C6835` |
| strict A6 native | 6494208 | `AB63D5632132497187677091FC511CC58B19CA73081A106321374244BEB7C8AE` |

A6 strict path：

`C:\Users\YUFENG~1\AppData\Local\Temp\ring-force-build-a6b-current\ring-strict.exe`

重要：A6 clean C生成后，为定位private const panic，TEMP路径的 `main.c` 被加入 `stdio`/DefId map
diagnostics；当前该文件已经不是clean artifact：22735341 bytes，SHA256
`30E62444703D2B67AAD2CFFAE275B66B581F61064E512A18190E461FB703F2F2`。不得复制、比较或提交它。
`ring-strict.exe` 与 clean `main-lto.o` 是插桩前构建，仍对应原始 clean D3A C。

A6源码快照包含 project overlay alias修复和transaction修复，但不包含 session最后的
`bind_exact_import_alias` producer-edge补丁；因此 A6是下一代 crossing compiler，不是 current
source fixed point。

## A6 strict focused 动态证据

### PASS

- six explicit FORCE module negatives全部 exit 1，含预期 E0801 moved binding，且无 panic/ICE/
  错误 `callable call target has no exact ownership source`：
  - `error_ownership_callable_explicit_transfer_import`
  - `..._reexport`
  - `..._chained_import`
  - `..._direct_import`
  - `..._wrapped_import`
  - `error_ownership_callable_interface_factory_import`
- module OWNING scalar positive `ownership_callable_transfer_strength` build/run exit0，输出
  `7/7`, `8/8`；实际CRLF与expected LF规范化后精确相等。
- focused positive build/link/run exact output：
  - `ownership_inferred_generic_scalar_copy`
  - `ownership_option_storage_scalar_copy`
  - `ownership_callable_transfer_strength`（single-file）
  - `ownership_retained_callable_totality`
  - `ownership_dead_control_children`
  - `ownership_callable_payload_provenance`
  - `or_pattern_shared_payload_bindings`
  - `golden/tuple_match_named`
  - `trait_generic_impl`
- `ownership_callable_or_pattern_projection_paths` strict check exit0。

### 唯一失败与当前状态

- `ownership_private_callable_const_reexport` 在 A6 panic；已按上节定位并修改current source。
- current-source A7生成在用户要求handoff时运行95.6s，stdout/stderr均0；已明确终止PID 17972，
  `%TEMP%\ring-force-build-a7-current` 只有两个空日志，没有C/object，不可复用。

## 性能路线已有证据

治理完成后运行：

```powershell
python -m pytest -q bench/check/test_harness.py `
  bench/check/test_disabled_path_gate.py `
  bench/check/test_combine.py `
  tests/test_run_tests_phase_timing.py
```

结果：`103 passed, 2 skipped in 13.59s`。这只证明B-176/B-180 harness/schema/phase timing wiring，
不是正式baseline。正式B-176必须使用developer-unblock checkpoint的同一semantic snapshot，并固定
source/anchor/toolchain/manifest。

## 重启后的精确执行顺序

### 1. 重算 pins / validator / no-process

按开头命令执行，确认current `infer_ctx.ring`仍为 `EE08D5...` 且没有Ring长进程。若任何source
hash改变，先归因，不要直接复用A6证据。

### 2. 用clean strict A6生成current-source A7（新TEMP目录）

不要复用已中止的 `ring-force-build-a7-current`；使用新目录：

```powershell
$out = Join-Path $env:TEMP 'ring-force-build-a7b-current'
New-Item -ItemType Directory -Path $out | Out-Null
$exe = Join-Path $env:TEMP 'ring-force-build-a6b-current\ring-strict.exe'
& $exe build compiler/main.ring --target=c --out-dir=$out --no-c-lines `
  1> (Join-Path $out 'build.stdout.log') `
  2> (Join-Path $out 'build.stderr.log')
```

预计旧路径可能很慢且占用约6–7GB；只依据进程CPU/响应/stderr判断，不用未经验证的时限截断。
源码在生成期间保持冻结。

### 3. 从A7 clean C构建strict native

按 `compiler/scripts/build_native.ps1` 同等 O3+ThinLTO flags，在A7 TEMP目录生成
`main-lto.o`, `runtime-lto.o`, `ring-strict.exe`；不要覆盖root `ring.exe`。

### 4. 第一优先复测最后root

用A7 strict：

```powershell
& $a7 check tests/cases/ownership_private_callable_const_reexport.ring
```

必须exit0；随后build/link/run必须精确输出`2`。若仍失败，先用exact DefId graph诊断，不要添加
FnType/name fallback，也不要把panic改默认Borrow/OWNING。

### 5. 复跑focused矩阵

至少复跑本handoff A6 strict PASS列表、六个跨模块 FORCE negatives、module OWNING positive，另跑：

- new/changed ownership negatives全部按 `.error` required/forbidden substring；
- `verify_rc/retained_never_guard.ring --verify-rc`，fatal/local finding都必须0；
- `verify_rc/move_str_take.ring` live与missing-Take mutation exact6 contract；
- factory opaque/mixed/reachable/chained negatives；
- OR missing/duplicate/incompatible negatives；
- public opaque projection negative与private exact re-export positive成对。

### 6. 同源A8与developer-unblock checkpoint

A7 focused通过后，用A7 strict对完全不变源码生成A8，比较A7/A8 clean `main.c` byte-identical。
然后才可把clean fixed-point C更新tracked `compiler/dist-c/main.c`，从tracked C构建native，再跑：

- strict compiler/main self-host；
- focused e2e/RC/structural门；
- workflow/diff gates；
- 必要的同源再生确认。

只有这道developer-unblock checkpoint通过，才正式记录B-176 baseline并进入B-180。full default当前
历史184 lanes含大量baseline debt，不能简单以总数判当前patch；但任何current incremental panic/
false-green仍是blocker。

### 7. 性能与最终门

- B-176：固定source/anchor/compiler/toolchain/manifest，记录phase/profile、CPU/RSS与重复分布。
- B-180先做cache/jobs/outdir isolation/deterministic aggregation/phase profile和独立热点。
- 后续critical若改变workload/pass set，必须配对刷新baseline。
- 最终≤50%目标、提交/发布前仍跑完整default、strict RC、ASan、self-host、double bootstrap并关闭
  所有critical tail。

## 禁止捷径与恢复注意

- 不要复制当前TEMP diagnostic `main.c`；原clean D3A C只剩hash证据与其编出的strict binary/object。
- 不要把A6称为current fixed point；它缺最后inline alias补丁。
- 不要用root `ring.exe`或tracked C结果冒充current-source strict证据。
- 不要降低 callable totality、ERROR_RECOVERY export gate、E0801、Take/RC verifier。
- 不要以修改fixture吸收compiler panic；测试只在设计真值与root lineage证明后调整。
- 不要回退已通过的 OR projection/binder/C lowering、retained reachability、tuple borrow-view、
  effect-precheck transaction或FORCE/OWNING side authority。
- 不要删除、重写或忽略现有dirty patch与untracked fixtures。
- 当前无长命令；重启后可从A7b fresh generation直接继续。
