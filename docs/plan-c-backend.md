# Plan: B-163 C-only 收官

> 一次性收官清单；活动状态以 `docs/backlog.md` 的 B-163 为准。代码迁移已完成，本文件不再保存 parity/gap 历史。收官后与 B-163 一并删除，完成过程只查 Git 与 `llvm-c-backend-final` tag。

## 已完成基线（2026-08-03）

- C11 是 main 唯一 codegen；单文件、project/module 与 self-host 已进入正式 C-native gates。
- `compiler/dist-c/main.c` 是 tracked stage-0，连续 self-compile 的生成 C 达到字节固定点。
- `llvm-c-backend-final` tag 保存最后 LLVM lane；main 已删除 LLVM-C/addon、`codegen_llvm*`、`dist/` 与 `dist-llvm/`。
- Python runner 与 CI 定义已切到 e2e/golden/RC/structural/parity/self-compile 的 C-only 证据；compiler clean build 使用 tracked C anchor。
- LLVM-only backlog/audit 项已在 2026-08-03 Discussion 中核销；共享/C-native finding 留在活动队列。

## 剩余收官

1. **技术/用户文档**
   - 更新 `CLAUDE.md`、README、构建命令、项目树与测试 suite 名称为 C-only；删除“LLVM 默认/oracle”“冻结 JS dist 可编译 HEAD”等现行叙述。
   - `docs/design.md`、philosophy、competitive analysis 已更新；完成后再次全仓搜索 LLVM/旧 dist，只允许历史 tag、退役说明或未来第二后端门。

2. **Clean-clone 证据**
   - 新临时目录 clean clone，只用 Python + clang/clang++ 从 `dist-c/main.c` 构建 `ring.exe`。
   - 跑 e2e、golden、RC、structural、parity、self-compile；固定点必须字节一致，不能使用主工作区遗留 object/exe。
   - #261 用该 C-only compiler 跑全套 ×3 与历史高频 fixture 的 ASan gating；按 audit 条目规则关闭或升级。

3. **远端与清理**
   - 批量 push main 与 final tag，取得 Windows 远端 CI 证据；公开 release 不在本项。
   - 核对并清理 `.worktrees/b163-c-only-infra`、`.worktrees/b163-c-only-retirement` 及对应已合并 branch。
   - 运行 `python .agents/scripts/validate_workflow.py`，删除本文件与 B-163，并把 C-only 结果写入一个里程碑。

## 停止门

- clean clone 不能从 tracked C anchor 自举、任一正式 C gate 红、固定点不一致或 #261 在 C-only 复现时，不得用“迁移已经成功”跳过；先形成具体 blocker 并修复。
- 文档/runner 不得保留假兼容 target 或静默接受 `--target=llvm`；退役 target 必须 fail loud。
- 本项不扩大为 release CLI、installer、跨平台支持或性能优化；工具链反馈由 B-176/B-180、release CLI/package 由 B-174/B-175、生成程序性能由 B-181 承担。
