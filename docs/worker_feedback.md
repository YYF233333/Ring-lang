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

## [决策] B-163 Phase 0 阻塞：JS stage 0 无法编译 HEAD 源码，需拍板链式重放方案（2026-07-10，Phase 0 worker）

**发现（阻塞 plan §1 Step 1）**：dist/（JS 冻结产出）停在 `0bd7822`（06-27，B-138 时代），不含 Ptr/unsafe（B-125）、Drop（B-002p1）、Hash trait 支持。HEAD 的 std/{list,map,str}.ring 因 B-152 RIIR 硬依赖 `Ptr<T>`/`unsafe`（48 处），JS stage 0 编 HEAD 立即 `E0204: Unknown type: Ptr` 失败。**plan §1 Step 1「JS dist/ 直接全量重建当前源码」的单跳假设不成立**；CLAUDE.md「dist/ 保留作紧急 stage 0 回退」实际已失效——回退上限是 0bd7822 语言快照，编不了现源码。

**探针已验证（第一跳可行 + 重大数据点）**：
- addon 重建成功（node v26.2.0 + node-gyp v13.0.1，`npx node-gyp rebuild`）。
- JS dist/ 编 source@`0bd7822` 成功（~37s，exit 0 仅 W0001），产出 main.o 与 **0bd7822 提交版逐字节一致**（SHA256 `BABA0FB1…F37A652`）。推论：① `0bd7822` 的 dist-llvm/main.o 本身就是干净 JS 信道产物；② JS 信道确定性今日可完美复现（node 大版本变化不影响）；③ 污染（若有）只可能发生在 0bd7822 之后的 ~17 个 ring.exe 自编 rebuild 代际（`c07e060`…`6198020`）。

**可选方案（需拍板）**：
- **A. 全量链式重放 + 代际审计**（worker 建议）：从锚点 0bd7822 起，按 dist-llvm rebuild commit 顺序逐代重放——gen N ring.exe 编 source@commit(N+1) → 与提交版 main.o 逐字节比对。全程一致 = 整链干净，直接得到干净 dist-llvm@HEAD 接原 Step 2/3；首个分歧代 = B-155 污染/非确定性引入点被直接定位（审计红利，服务 B-155 归因）。~17 跳 × (~35s 编译 + 该代 runtime 编译 + 链接)；B-152 P2（`fae4738`）/ P3（`8871592`）数据结构重构点按 CLAUDE.md 纪律 double bootstrap；`26abe34`→`a5fb9a4` revert 对跳过。估 2-4h。
- **B. 最小特性跳链**：只在特性引入点跳（0bd7822 → fd02fe3 Ptr → 769f712 Drop → b00736d Hash → fae4738/8871592 RIIR → HEAD，~5-6 跳）。更快，但每跳可行性需实测（中间源码可能已用上更晚特性），且放弃代际审计信息。
- **C. 其他**（如 A/B 混合：重放至某已验证干净的中间代后直接跳 HEAD）。

**现场状态**：无 commit 产生；dist-llvm/ 未动（工作树漂移的 `M main.o` 原样保留）；gen1 产物与全部日志在 session scratchpad；B-163 Phase 0 转 waiting-feedback。

## [通知] binding.gyp LLVM 路径为另一台开发机路径，本机构建需本地改写（2026-07-10，Phase 0 worker）

tracked 的 `compiler/llvm-addon/binding.gyp` include/lib 路径是 `C:/software/Scoop/...`（另一台机，`e1c9cb9` 提交）；本机实际为 `C:/Users/Yufeng Ying/scoop/...`（先例 `41e84a1`）。为完成 addon 重建已本地改写，**未提交**（提交会反向弄坏另一台机）。两机路径冲突建议长期解法：binding.gyp 改用环境变量（`LLVM_DIR`）或 `!(node -p ...)` 动态探测，免得每次换机来回翻烙饼。

## [通知] 冻结 JS 编译器 emit 失败时 exit code 仍为 0（2026-07-10，Phase 0 worker）

`node compiler/dist/main.js build … --out-dir=<不存在的目录>` 时报 `Failed to emit object file` 但**进程退出码为 0**——脚本/CI 层面假绿隐患。冻结产物已不再更新可不修，但现源码 cli.ring 是否同病未查证，建议列入 audit 待验。
