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

## B-163 step 8 — Orchestrator 交接（2026-07-13，未 merge，待明天处理）

> Worker orchestrator 汇总。WT1 agent 已完成实现并 commit，但**未 merge 进主分支**——存在待拍板决策 + dist-llvm 重编问题 + 用户叫停编译。worktree 完整 feedback（agent 原文 3 条）在 `.claude/worktrees/agent-a268973c3c61d7b2a/docs/worker_feedback.md`。

**产物位置**：worktree `agent-a268973c3c61d7b2a`，commit `68999dd`（base = 主 HEAD `f3394d4`，已验证）。worktree **保留未清理**，供明天 merge。

**step 8 功能完成度（agent 自测，orchestrator 未复跑——用户叫停编译）**：
- `generate_c_project` + `compile_project_c` + cli 路由：project/module 模式 C 发射（镜像 `generate_llvm_project`/`compile_project_llvm`）✅
- C sweep：e2e 401/0 + llvm 219/0；module 集 C 后端全绿（含 extern_fn）；project .c ×2 字节一致（diamond_dep/cross_trait SHA256 相等）
- LLVM 回归：e2e 397/0 + llvm 219/0 + rc 536/0
- `C_BACKEND_SUPPORTS_MODULES = True`；`LLVM_ONLY_SKIP` 集（default_effect_topo/exhaustive_generic_payload/map_hof/map_ufcs_bug 从 LLVM_SKIP 挪出）；E0803 负面用例（drop_fail_effect.ring）✅
- **orchestrator review（纯读，无编译）**：compile_project_c 干净镜像 llvm 版；cli 路由 out_dir 对齐；骨架结构合理。

### 1. self-compile ×3 LLVM 后端字节不一致 [决策]

**现象**：step 8 后跑 self-compile ×3，run 间 main.o 字节不一致（大小同 4992827、SHA256 异）。IR 文本 diff = 154 行，全集中在字符串常量 padding 尾字节，嵌堆地址型垃圾（`@X+}\03\02\00\00` 型小端指针）+ `__rc_scope_NNNNNN` 残留串 —— 与 **B-155「垃圾常量签名」吻合**。

**归属未确证**：agent 未跑 base 对照。orchestrator 已启动 base 对照实验（base ring.exe 编 base 源码 ×2 比 SHA），但**用户叫停编译，实验中止未出结果**。
- **强旁证指向 B-155 既有（非 step 8 引入）**：CLAUDE.md 白纸黑字「CI bootstrap 因 B-155 IR 非确定性暂禁用」= HEAD 本就非确定；step 8 的 LLVM codegen 零改动（只改 codegen_c + checker）；IR diff 是内存污染型 padding 垃圾（非结构性差异），不像 checker 改动的直接后果。
- **残留疑点**：step 8 改了 `rebind_fn_type`（见下），理论上可能间接影响 typeid 分配序 / scope 命名。需 base 对照排除。

**待拍板**：① 明天跑 base 对照确证归属（一条命令，~4min 编译）；② 若确证 B-155 既有，step 8 是否照常 merge（self-compile 门在 HEAD 已知失败，是 B-163 Phase 1 收尾 gate 而非 step 8 gate，plan §2.4）；③ dist-llvm/ 如何重编提交（非确定性产物——单次 rebuild 产物功能正确可用，但字节不确定；建议：merge 时重编一次提交，字节确定性留 B-155 收口）。

### 2. rebind_fn_type checker 范围外修复 [决策/review]

**背景**：step 8 加 `compile_project_c` 跨模块调用后，`ring check compiler/main.ring` 在无关代码行报荒谬 E0301（如 `print("OK")` 报 unify 失败）。根因 = `rebind_fn_type`（B-122 引入）写回导出 scheme 时，effect row 的 check-time 变量（row tail + `fail<?e>`/`mut<List<?t>>` payload，不出现在 param/return 位、var_mapping 够不到）以 free 变量残留，跨模块 `instantiate()` 只重命名 type_vars、free 变量带生产模块编号进消费模块撞号。

**agent 修复**：写回 scheme 前把 mapped effect row 的 free 变量（复用 `collect_free_vars`，sorted 保确定性）追加进 `scheme.type_vars`——对称于注册路径的 `collect_effect_tail_vars` quantify。+15 行，经 double bootstrap 生效。

**为何需 review**：① 改的是 checker 核心（infer_decl.ring）敏感面；② **放宽了类型系统**——既有导出（compile_project_llvm 等）的 scheme 现在也 quantify effect 变量，调用位从「跨调用位共享推断变量」变为「各自 fresh」，agent 称「理论上更宽松、接受更多程序，全量测试未见行为变化」；③ 这是 CLAUDE.md 记录的 B-159 残留区域（rebind_fn_type 相关）附近，需确认与 B-159 workaround 不冲突。**agent 已标注请 review。**

### 3. 未 merge 原因 + 明天接手步骤 [通知]

**未 merge 原因**：有上述 [决策] 待拍板 + dist-llvm 未重编（用户叫停编译）+ 遵循 worker 规范（遇 [决策] 停在安全点）。

**明天接手步骤（建议序）**：
1. 跑 base 对照确证 self-compile 归属（决策 1①）
2. review rebind_fn_type 改动拍板（决策 2）
3. 若两者放行：`git merge 68999dd` → 重编 dist-llvm/ 一次 amend 进 merge → 全量测试 ×3（含 self-compile，预期仍非确定=B-155） → 删 backlog step 8 记录 + 清理 worktree
4. B-163 step 9（自编译冲刺 + B-155 判别实验 + B-152 P3 闭环）另起 wave

---

## B-163 step 8 二次 review — 模块 nominal identity / origin 缺失（2026-07-15）

### 1. 是否扩大 step 8 建立完整模块身份契约 [决策]

**现状**：对 `68999dd` 做独立 review 后确认不能直接 merge。函数级 project codegen 的可修问题包括：module prefix 分隔错误、C symbol 非单射、跨模块同名函数的 effect/mut registry 串线，以及 `rebind_fn_type` effect FTV 过度泛化/约束丢失。隔离 worktree 已有未提交补丁与回归。

**更深 blocker**：两个模块各自定义不同布局的 private `struct Packet`，checker 接受，C/LLVM codegen 均因裸名 metadata 覆盖而 panic；checker 甚至允许把 `b::Packet` 传给 `a::read`。两个模块各自定义不同 private `enum Token` 时，C 后端能编译链接，但合法路径生成 wrong-code 并以 `0xC0000005` 崩溃。根因是 HIR、ModuleExports、struct/enum/effect/typeid/drop registries 都缺少定义模块 origin，不是仅修改 C mangling 能解决。

**相邻证据**：named re-export 也不保留原始定义模块；当前 C/LLVM 都靠 suffix fallback，在存在同名 decoy 时会静默调用错误函数。mut 函数经 alias import 时，`resolve_uses` 不复制 `fn_mut_params`，调用侧不会装 Cell。

**待决策**：
- **A — 扩大 step 8**：先建立 module-qualified nominal identity 与 resolved export origin 契约，再完成 C project backend。工作量显著增加，但 project mode 不留静默 wrong-code。
- **B — 收窄 Phase 1 step 8**：只承诺无跨模块同名 nominal type、无歧义 re-export 的 project 子集；对不支持形态 fail-closed，并将完整模块身份另立 P0/P1。函数 key/effect/mut/checker 修复完成后可合入。

**用户决策（2026-07-15）**：选择 **A，彻底修复**。本项恢复执行；step 8 必须同时闭合 module-qualified nominal identity、resolved export origin、alias 后的 mut/ABI 元数据传播，并通过双后端对抗回归与 LLVM self-compile ×3 确定性 gate。完成后停下汇报，不进入 step 9。

决策前停在安全点：主分支未 merge，step 9 未开始；现已复用保留约 `+314/-51` 未提交修复的 worktree 恢复 step 8。

### 2. 基线确定性已确证 [通知]

f3394d4 使用基线 ring.exe 连续 LLVM self-compile ×3：三轮 `main.o` 均为 4,958,491 bytes、SHA256 `1CBAA9CD6A94B9E5ABDAE1E61967AAC7632A0A19D3DD512FEC2E6D9C13349871`；三轮 `ring_output.ll` SHA256 均为 `55E93772EA5BBEBC8599DDC817B1247B791B961CBEF672D7EE79ADA08379CF7B`。因此 step 8 最终 merge gate 必须恢复 LLVM ×3 一致，不能直接把不一致归为基线 B-155。

---

## B-163 step 8 方案 A — quota checkpoint / WIP handoff（2026-07-15）

**边界**：用户因额度不足要求当前 bootstrap 结束后立即落档停止。step 8 **尚未完成、尚未 merge**；step 9 未开始。

### 保存点

- worktree：`C:\Users\Yufeng Ying\Desktop\Ring-lang\.claude\worktrees\agent-a268973c3c61d7b2a`
- branch：`worktree-agent-a268973c3c61d7b2a`
- base：`68999dd`
- WIP commit：`d4c1c0a912fdca411f9aedfad01d28f11341c86d`（`wip(step8): canonicalize module identities`）
- 规模：101 files，1898 insertions / 411 deletions；worktree clean；`git diff --check` clean。
- `tests/.tmp_step8_fix`、`tests/.tmp_step8_probe_review`、`ring_output.ll` 已清理；正式 regression tests 保留在 commit。

### 已实现但需最新 stage 复验

1. file-module 用户定义普通符号采用 `<resolver module_prefix>$$_<decl>` canonical identity；诊断还原为 `a::Type`。`extern fn` / `extern type` 保留 raw ABI identity。
2. value origin 改为消费者本地 `DefId -> canonical origin`，导入时重新分配本地 DefId；局部同名 closure/变量不再被 module/import spelling map 劫持。
3. `ModuleExports` 显式转发真实 value origin；named、alias、whole-module、transitive 与 inline `pub use` 均覆盖，连同 fn-mut / impl / inherent / mut-method metadata。
4. struct/enum/custom effect/trait、impl target、supertrait、bounds、effect alias body与 handler/op 均 canonicalize。
5. match/catch/if-let pattern 在 HIR 前解析为 exact enum/struct identity；C/LLVM 删除全局 first-variant、struct suffix、function prefix/suffix correctness fallback。
6. SCC 按 canonical file/inline scope恢复本地调用边；qualified `inner::f` 经 binding origin进入 HIR。
7. canonical C 函数、方法、ctor、drop、dict、evidence、default thunk统一走可逆 symbol encoder，覆盖 `a::b` / `a_b` collision。
8. `rebind_fn_type` effect free vars、SchemeBound/assoc constraints 修复保留；test runner runtime 从 `-O0` 修为 `-O2`。

正式用例覆盖同名 struct/enum 正负例、不同 enum tag 顺序的 guarded/nested match、同名 trait/impl、effect alias decoy、value shadow、两模块各自 inline `inner::f`、三类 re-export decoy、transitive metadata、type rename re-export trait impl、inline pub use、C key collision、effect bound/assoc/E0803。

### 已验证与未验证边界

晚期补丁前，中间编译器 `ring_new` / `ring_new2` 已手动证明：同名 struct/enum isolation 与 E0301、named/module/transitive re-export `111/999`、transitive/same-name metadata `1/7`、key collision `1/2`、effect-bound rebind `9`、extern ABI、cross-module method、pub_use 等在 LLVM/C 得到预期结果；诊断为 `a::Packet` vs `b::Packet`，不泄 `$$_`。

但随后修复了 resolved pattern、binding shadow、trait/SCC/effect alias/inline pub-use 等共享层缺口，**这些最新源码没有成功产出新 compiler**，上述绿灯不能替代最终 gate。

### 最后 bootstrap 状态与 provenance

- stage-0：`C:\Users\Yufeng Ying\Desktop\Ring-lang\.claude\worktrees\agent-a268973c3c61d7b2a\ring.exe`
- SHA256：`73468AF6B14EE2F97C18D6349C68A66B2C2E371B369BDAC439B6F3AC1B3C8DF2`
- 未 tracked，命中 `.gitignore:32 /ring*.exe`；mtime `2026-07-13T00:04:16.1809038+09:00`。

两次 `ring_new2` bootstrap（约 251s / 259s）因该 executable 内置旧的 ExternType canonical 行为，把跨文件 LLVM ABI handle 分裂为不同 nominal type，报大量 E0301；源码随后已改为 ExternType raw ABI identity。用上述原始 stage-0 再跑约 341s，`exit=1`、无 object/最终 compiler 产物；已越过 ABI 问题，最后仅报 `exports.ring` inline helper 两处读取不存在的 `TraitRegistry.inherent_methods`。这两个读取随后已删除，但依用户停止指令**未重跑**。

### 恢复顺序

1. 从 WIP worktree `d4c1c0a` 开始；先用上述原始 stage-0 对当前 `compiler/main.ring` 做 LLVM build 到全新 temp out-dir。不要用旧 `ring_new2`，否则重复 ExternType chicken-and-egg。
2. runtime 从 C 源显式 `clang -O2 -c` 到 temp，链接临时新 compiler；不复用未知 runtime object。
3. 先跑短 gate：`module_value_origin_shadow`、三类 `reexport_*_origin_decoy`、`module_nominal_enum_pattern_tags`、`module_inline_fn_origin`、`module_nominal_trait_isolation`、`module_effect_alias_origin`、`reexport_type_alias_trait_impl`、`inline_pub_use_origin`。
4. 正例分别跑 LLVM/C build+run并比较 `.expected`；负例锁 E0301/E0513/E0803，确认诊断无 `$$_`；再跑 step 8 metadata/key/effect 旧回归与必要 suites。
5. 最终 LLVM self-compile ×3 仍为 step 8 merge gate。任一 gate 失败先修 step 8；禁止直接 merge 或进入 step 9。

### 恢复记录（2026-07-19）

用户确认额度恢复并按原计划续跑。orchestrator 已复核 worktree HEAD 精确为 `d4c1c0a912fdca411f9aedfad01d28f11341c86d`、工作区 clean，原始 stage-0 SHA256 仍为 `73468AF6B14EE2F97C18D6349C68A66B2C2E371B369BDAC439B6F3AC1B3C8DF2`；从恢复顺序第 1 项继续，step 9 继续冻结。

## B-163 step 8 — 再次额度停止（2026-07-21）

- 隔离 worktree 已提交安全保存点 `fa22ac2`（`wip(step8): checkpoint module scheme propagation`），worktree clean，主分支未 merge。
- 本轮成功产出 inline-only bridge，但闭包源码二代仍在 `is_occurs_check` field access panic。最小 probe 已把根因锁定为：file-module canonical binding rebind 后未同步同 DefId 的源码短名 scheme，导致同模块调用读到注册期 EMPTY_ROW/未解析 return var。当前已实现按 DefId 同步 alias 的补丁，尚未重新编译。
- 仍需先补 inline `pub use` raw ABI extern-fn metadata与 enum ctor 实际用例，再做 stage-0→新 compiler→二代、双后端短 gate、必要 suites、LLVM self-compile ×3。任一项未完成前不得 merge；step 9 继续冻结。
- 完整 SHA、资源轨迹、对照结果和逐步恢复顺序已写入隔离 worktree的 `docs/worker_feedback.md`。
