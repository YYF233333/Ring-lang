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

## [通知] B-163 Phase 1 测试 runner 扩展：实现取舍（2026-07-10，runner worker）

`tests/run_tests.py` 已支持 `--backend=llvm|c` / `--suite diff` / `C_SKIP` / `--filter`。默认行为逐行零变化（改动前后 `--suite e2e` 输出 Compare-Object 完全一致，396/0/21）。自差分（临时 llvm vs llvm，已还原为 llvm vs c）全量 494 pass / 36 skip，2 例 `const_basic.ring` / `llvm/effect_nested_handle.ring` 撞 ring.exe 间歇 AV（exit 3221225477，复跑均过——即 B-155 快照里的已知间歇崩溃，非 runner 问题）。取舍如下：

1. **C 后端产物落 tmpdir，不落源目录**：`--backend=c` 单文件用例也总是传 `--out-dir=<tmpdir>`（契约产出 `D/foo.c` + `D/foo.o`），避免 `.c`/`.o` 残留在 `tests/cases/`。LLVM 单文件路径保持现状（源旁 .o、用后即删）。
2. **modules 在 C 侧静态跳过**：C 后端 project 模式支持性无法运行时探测（迁移期后端尚不存在），用模块级常量 `C_BACKEND_SUPPORTS_MODULES = False` 控制——`--backend=c` 与 `--suite diff` 下 module 正向用例报 SKIP（detail 注明原因），后续 wave 支持后翻 True 即纳入。
3. **`--backend=c` 下 LLVM_SKIP 照样生效**（与 C_SKIP 叠加）：LLVM_SKIP 内混有 checker 层问题（frozen dist-llvm、负面行为差异）与 LLVM runtime crash，迁移期在 C 下状态未知，先统一跳；plan §2.3 的 #219-#222 重评估时再把确认可跑的从 LLVM_SKIP 挪出或挪入 C_SKIP。
4. **diff 输出格式**：FAIL detail 为 `[llvm]/[c] <编译/链接/运行错误>`（单侧失败）或 `backend outputs differ: llvm=<repr 前 200 字符>, c=<repr 前 200 字符>`（输出不一致），与现有 e2e 的 expected/got 风格一致。diff 不读 `.expected`——LLVM 是 oracle，两侧一致即断言。
5. **`--filter` 语义**：大小写不敏感子串，`\` 归一化为 `/`（`--filter llvm/` 可选中 golden 子集）。被过滤的用例不跑不报（不计 SKIP）。rc 的 self-verify 按条目名匹配；self-compile 整套按 suite 名 `self-compile` 匹配（粗粒度）。
6. **防呆**：`--update-golden` 强制要求 `--backend=llvm`（golden 快照是 oracle，禁止 C 侧覆写）。
7. **当前 ring.exe 对 `--target=c` 的行为**：exit 0 但不产出 .o → runner 报 `.o file not found` FAIL（安全方向，不假绿）；C 后端 worktree 按契约落地后自然走通。

## [通知] B-155 方向 C 审计中断快照（2026-07-10，用户拍板转 Phase 1）

> 审计进行约半程时用户拍板收卷（B-163 Phase 1 直接开工，B-155 推迟到字符串字面量步骤有 .c 文本证据后再审）。以下为全部阶段性发现，**下次重启审计从这里接力**。无修复尝试、无诊断脚手架残留（源码零改动，#241 除外）。

### 新确认的事实（本次审计新增，静态证据，全部可零成本复验）

1. **膨胀发生在「读取时 len 字段已脏」，buf 完好**。证据：`[109 x i8]` 的数组类型来自 Ring 层 `value.len() + 1`（`build_global_cstring_decl`，codegen_llvm_decl.ring:1811），initializer 的 109 字节来自 marshalling 的 `ring_str_len_u32`（同一对象独立调用）——两处**一致**读到 108 → `s->len == 108` 而 `s->buf` 前 32 字节完好（31 字符 + null）。LLVM 从 buf 越界抄 108 字节把相邻堆内存烤进常量（垃圾尾含堆指针）。
2. **Length 恒为 108（109 型）/ 1408（1409 型），不是随机值**。64-69 个不同的 31 字符字符串、跨运行、跨代际恒定 → 覆写者是**系统性的固定模式**（同一代码路径在同一相对时机的分配/写入），不是随机堆损坏。这大幅收窄嫌疑：找「什么东西会把 raw int64 值 108 写到 RingStr.len 偏移（offset 8）」。注意 108 为偶数 → **排除 tagged Int 字段覆写**（tagged 恒奇数）；RingStr 是 C++ raw 布局 {buf@0, len@8, cap@16}，24 字节，size class 32。
3. **受害 Str 全部是插值构造的临时**（如 `"${type_name} { "`、panic 消息 `"Result in ring_Result_unwrap_or"`），经 `gen_str_lit_simple(ctx, s)` → `build_global_cstring_decl(ctx, value)` 传递。
4. **这两层的 RC 时序在 IR 层面正确**（x3/run1.ll 实查）：`build_global_cstring_decl` 函数体内对 `%value` 零 dup/drop（所有权在 caller）；`gen_str_lit_simple` 的 4 个 `ring_drop` 全部在最后一次使用（LLVMBuildCall2）之后 scope-end 位置。→ premature drop 不在这两层的直接发射里，嫌疑上移至**插值构造层**（`gen_string_interp` 的 concat 路径）或**跨函数传参的 Perceus borrow 推断**。
5. **07-01 的「ring_str_to_cstr 内 strlen==len 诊断零 mismatch」与本次「读取时 len==108」直接矛盾**——历史诊断跑在带垃圾的脏 stage 二进制上（Phase 0 已证当时全部二进制带病），结论不可靠。**历史排除清单需要在干净 stage 上全部重验**，重启审计时不要把 07-01 的排除当死路。

### 下一步建议（按性价比排序）

1. **ASan gating 档跑单文件复现**：两个模型（s 是尸体 → `ring_str_len_u32` 内 heap-use-after-free READ；s 活着被越界写 → heap-buffer-overflow WRITE 于写者）ASan 都能一发直指现场，检测点在 runtime C++ 层（有插桩）。注意 ASan 下 quarantine 会让「垃圾症状」消失但报告照出。自编译全量 ASan 慢，先试触发面小的工作负载：本 session 撞到过 `string_builder.ring` / `handle_try_return_cleanup.ring` 编译进程 0xC0000005（复跑均过）——单用例循环跑 ASan 可能比自编译便宜得多。
2. **free-毒化二分实验**：runtime free 前把块头 24 字节填 0xDD 跑自编译——[109] 变巨数/崩溃 = s 是尸体（premature drop 实锤）；仍恒 108 = s 活着被定向写。一次实验二分两个模型，非 ASan 速度。
3. **审计插值发射路径**：`gen_string_interp`（B-158 曾迁到 Ring StringBuilder 后被 revert `a5fb9a4`——revert 原因值得查，可能当时就撞了同一 bug 的另一形态）+ `ring_str_concat` 的 RC 语义。
4. **审计 Perceus 对 extern fn 的参数约定**：perceus.ring 中 extern call 参数按什么约定插 dup/drop；确认 `gen_str_lit_simple` 尾部 4 个 drop 对应对象（是 s 本体还是中间值）。
5. 垃圾计数代际敏感（27815e0 引入 210×[14xx]、6198020 消解并 64→69）= 堆分配序列微扰即变症状——修复验证必须用「×2 字节一致 + 归零」硬判据，不能看计数变化。

### #241 随车修复结果（同 session 完成）

`codegen_llvm.ring:624` `("nonnull", 6)` → 7（`3047d2f`）+ dist-llvm double bootstrap 重编（`a0ec2a6`，采用 r2）。验证：r2 发射产物 nonnull attr **0 → 2670 处**（JS 时代 2284 量级吻合）；e2e 396/0/21、llvm golden 211/0/1 全绿；r1/r2 同尺寸（字节比较因 B-155 known issue 不可比，按现行标准验收）。验证途中撞 2 次 B-155 间歇 AV（上述两用例），复跑均过，非 #241 引入。

## [通知] B-163 Phase 0 完成：链式重放 21 代 + HEAD 终验——路由 = 回填 B-155 方向 C（活 bug 实锤）（2026-07-10，Phase 0 worker）

**结论路由（plan §1 预批二选一）：仍不一致 → 回填 B-155 方向 C**。干净 stage 0 baseline 已提交（`1e2bc9d`，provenance 全程可追溯 JS 锚点）。

### 核心发现（B-155 假设修正）

**「执行层污染 / 尸体遗传」假设被推翻，活 bug 实锤**。判据（0bd7822 完美对照对：同源码同 LLVM，唯一变量 = 执行信道）：
- JS 执行（node）：0 垃圾常量，三次重编与提交版**逐字节一致**
- native 执行（干净 JS 锚点 .o 链接的 ring.exe）：64 个 `[109 x i8]`，×2 重编产物不一致
- → bug 在**现行源码**经 native RC（Perceus dup/drop 生效）暴露；JS 后端 GC 下 RC 是 no-op 故全程不可见。不存在「带病旧二进制→遗传」，每代 native 编译都新鲜产生垃圾

**症状剖析**（对方向 C 审计的收窄）：
1. 膨胀常量 = 31 字符 Str 常量（allocator size class 32）emit 时 len 膨胀为 108 → `[109 x i8]`（前 31 字节 + null 正确，后 77 字节堆垃圾含堆指针）；另一形状 `[1409/1410 x i8]`（24 字符常量膨胀）。**引用处为 `ring_str_from_cstr`（strlen 截断）→ 运行时行为无恙**——解释了带垃圾编译器测试全绿、可自举
2. 非确定性 **100% 局限于膨胀常量内容**：HEAD ×3 各轮 .ll 互 diff 恰好 69 行 = 69 个 `[109 x i8]` 行，零语义/零 .text 差异
3. 垃圾**计数**由源码代际决定（每轮恒定），内容随机：`[14xx]`×210 仅存在于 27815e0（B-159 checker 改动引入）~951de21 代际，6198020（P3 Map RIIR）后消失且 109 型 64→69——嫌疑路径与 B-159/B-152 改动交叉可作归因起点
4. fdab843 代重放时复现**间歇性 0xC0000005**（重跑即过，~1/3 命中特征）——同一 RC bug 的致命形态

### 链式重放记录（21 代，0bd7822 锚点 → 6198020 = HEAD 编译器源码代际）

- 逐代与提交版字节比对**全部 mismatch**——预期内：提交版与重放版各含随机垃圾。全程垃圾计数：0bd7822~951de21 恒 64×[109]（部分代 +20×[1409]），27815e0 起 +210×[14xx]，6198020 后 69×[109]+0
- 特殊代：**f9b90a3** 需 staged bootstrap（B-157 `()` 语法台阶，历史中间态未提交；用 compiler@f511991 + std/str.ring@105188c 混合树补台阶）；**6e8e4be / 6198020** 数据结构重构点按纪律 double bootstrap，采用二次产物（P3 db2 尺寸 3,198,291 与历史提交版精确同尺寸，结构印证）
- **历史瑕疵**：f9b90a3（merge f511991）提交版 main.o 直接沿用分支产物，**不含 merge 树的 unify.ring perf 改动**（105188c occurs_in 优化）——语义等价未被发现，记录备查
- revert 对 ca5b610→a5fb9a4 blob 级确认恢复原状，跳过

### HEAD 终验

- e2e sanity（干净 ring.exe 实跑）：**396 pass / 0 fail / 21 skip**
- self-compile ×3（独立 out-dir）：run1 `b6ef5375` / run2 `c3ac3fe0` / run3 `4c103ce6` —— **互不相同**；垃圾计数每轮恒定 69×[109] + 0×[14xx]（B-155 基线 64+210 对应旧代际，HEAD 代际计数为 69+0）
- 完整逐代 CSV / 各代 .ll / 构建日志留存 session scratchpad `replay\`

### 新独立 bug（spec 外，未修）

**`LLVMGetEnumAttributeKindForName("nonnull", 6)` 长度错误**（`codegen_llvm.ring:624`，"nonnull" 是 7 字符）：native 直连忠实传 6 → 查无此 attr → **全部 nonnull 参数属性静默丢失**（JS 产物 2284 处 vs native 0 处）。JS 时代不可见的原因：addon 包装忽略 Ring 传的 len、用 `name.size()` 重算（llvm_addon.cpp:346 注释自证）——正是 plan §0.1「FFI marshalling 类型真空」的活标本。影响 = 仅优化提示缺失，语义无害，确定性。修复 trivial（6→7）但按纪律不自行修，建议随 B-155 方向 C 或 C 后端移植顺带处理。同文件 "nounwind"/8、"returns_twice"/13 均正确。

### 对 B-163 Phase 1 的含义

C 后端（纯 Ring StringBuilder 拼接 + 文本 .c）不经过 Str→FFI marshalling 层，但**膨胀机制发生在 marshalling 之前**（编译器堆内 Str 对象 len 已脏）——若根因是通用 Perceus RC 排序 bug，C 后端 emit 的字符串字面量同样可能带垃圾（文本层肉眼可见，恰好符合 plan「B-155 类问题在文本层肉眼可见」预期）。方向 C 审计与 Phase 1 并行不冲突的判断维持成立。

## [通知] binding.gyp LLVM 路径为另一台开发机路径，本机构建需本地改写（2026-07-10，Phase 0 worker）

tracked 的 `compiler/llvm-addon/binding.gyp` include/lib 路径是 `C:/software/Scoop/...`（另一台机，`e1c9cb9` 提交）；本机实际为 `C:/Users/Yufeng Ying/scoop/...`（先例 `41e84a1`）。为完成 addon 重建已本地改写，**未提交**（提交会反向弄坏另一台机）。两机路径冲突建议长期解法：binding.gyp 改用环境变量（`LLVM_DIR`）或 `!(node -p ...)` 动态探测，免得每次换机来回翻烙饼。

## [通知] 冻结 JS 编译器 emit 失败时 exit code 仍为 0（2026-07-10，Phase 0 worker）

`node compiler/dist/main.js build … --out-dir=<不存在的目录>` 时报 `Failed to emit object file` 但**进程退出码为 0**——脚本/CI 层面假绿隐患。冻结产物已不再更新可不修，但现源码 cli.ring 是否同病未查证，建议列入 audit 待验。
