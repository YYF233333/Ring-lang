# Plan: B-163 C 后端迁移 Phase 2

> 临时执行计划；活动状态以 `docs/backlog.md` 的 B-163 为准。Phase 2 完成后删除本文件。长期后端、ABI 与信任策略已经收口到 `docs/design.md` §10.4。

## 当前基线

- `compiler/dist/` 是冻结回退锚，不能直编 HEAD，也不作为当前 parity 输入。
- C11 后端已支持单文件、project/module、self-host 与确定性 C 文本固定点。
- 当前工作只处理 Phase 2 parity、manual gate 自动化、LLVM 退役与 bootstrap 切换。
- 详细覆盖与 gap 的唯一真值是 `tests/parity_matrix.json`；本文和 backlog 不复制逐轮计数、提交哈希或测试日志。

## Phase 2 gates

1. **矩阵诚实性**
   - 每个当前语言能力标为 `covered`、`known-gap` 或 `manual-evidence`；不得用 skip 掩盖失败。
   - shared gap 修复后直接更新 matrix 与正式 regression；LLVM-only gap 可在确认退役路径覆盖后关闭。
   - manual gate 尽可能转为 runner 可执行证据；必须人工检查的项目给出稳定产物与判定方式。

2. **C 主路径认证**
   - C E2E、golden、RC、project/module 与 self-compile 全绿。
   - `dist-c` 独立构建成功；连续 self-compile 的生成 C 达到字节固定点。
   - 生成 C 保持 C11、binary-safe、`#line`、整数 wrap/除零、ordered Float 比较、源码序 match/catch、共享 closure/evidence/Drop ABI 等 `design.md` §10.4 契约。

3. **退役前对抗 review**
   - 复核 parity matrix 是否遗漏当前可达语法/语义。
   - 复核 C-only 正确性偏离没有掩盖共享 checker/HIR/RC 缺陷。
   - 复核旧 LLVM audit 项：共享缺陷迁入共享队列，纯 LLVM 项随退役核销，不能提前删除仍承担 oracle 风险的条目。

4. **锚与删除顺序**
   - 创建 `llvm-c-backend-final` tag，证明可从 tag 恢复最后 LLVM lane。
   - 独立验证 `dist-c` 构建脚本与文本固定点，使其成为唯一 stage-0。
   - 删除 `codegen_llvm*`、`llvm_ffi.ring`、LLVM addon/link 依赖。
   - 从 main 删除旧 `dist/` 与 `dist-llvm/`；不保留第二份 legacy archive。
   - 恢复 CI bootstrap，并让 CI 以 `dist-c` 文本固定点为门。

5. **Bookkeeping**
   - 更新 README、CLAUDE、design、backlog、CI/构建命令与项目结构为 C-only。
   - 核销或重写全部只指向 LLVM/旧 bootstrap 的 backlog/audit 项。
   - 删除本文件与完成后的 B-163 条目；历史只保存在 merge/commit 与 final tag。

## 风险与停止门

- C 与 LLVM 输出分歧时，以现行语言规范、golden 和共享 HIR 契约仲裁，不以任一后端“当前行为”自动获胜。
- 若修复开始在后端复制 resolver/type/effect/RC 规则，停止局部补丁并把真值上移到共享层。
- 若 C self-host 固定点或 runner 暴露新的共享 correctness/RC blocker，先立案并修复；不得为按时退役降低门槛。
- B-163 完成前 B-152 剩余 Str RIIR/P5 保持依赖阻塞；与控制流、证据 ABI 相交的后续工作按 B-168/B-169 顺序推进。
