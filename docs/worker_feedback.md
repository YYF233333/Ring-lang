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
