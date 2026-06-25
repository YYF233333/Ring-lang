# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-100 Phase 1 — Parity 认证门准备（2026-06-25）

### 1. 新增 26 个 llvm_diff 测试 + 修复 11 个 parity gap [通知]

Phase 1.1 feature 覆盖矩阵审计 + 补缺完成。从 118 → 144 个 llvm_diff 用例。发现并修复了 11 个 LLVM 后端 parity gap（9 个来自新测试 + 2 个来自已有测试的新 bug 暴露）：

| 测试 | 根因 | 修复 |
|------|------|------|
| for_range_variants | Map 未转 entries 直接当 list 迭代 (UB) | ✅ codegen_llvm_stmt.ring |
| cell_update | Cell 类型/方法未实现 + RC double-free | ✅ ring_runtime.cpp + codegen_llvm_expr.ring |
| match_literal (timeout) | 重复 switch case tag 导致 LLVM UB | ✅ codegen_llvm_expr.ring |
| match_literal (diverge) | 嵌套 constructor 模式缺内层 tag 检查 | ✅ codegen_llvm_expr.ring |
| delegate_full_scenarios | delegate dict dispatch 的 trait name 解析 | ✅ codegen_llvm_expr.ring |
| ord_derive | derive Ord 未在 LLVM 注册 | ✅ codegen_llvm_decl.ring |
| supertrait_multi_default | 多级 supertrait self-dict 链缺失 | ✅ codegen_llvm_decl.ring + codegen_llvm.ring |
| row_basic | row type 字段访问 codegen 缺 RecordType 分支 | ✅ codegen_llvm_expr.ring |
| mod_nested_const | struct pattern 模块限定名与注册名不匹配 | ✅ codegen_llvm_expr.ring |
| struct_update_generic | enum variant spread 字段未拷贝 | ✅ codegen_llvm_expr.ring |
| string_builder | runtime 方法 call args 不足 + sb_line null 解引用 | ✅ codegen_llvm_expr.ring + ring_runtime.cpp |

**最终基线**：142/144 pass, 1 fail (已知 #138 Map.fold), 1 skip (receiver_temp_drop)。

### 2. Oracle-blind native-only 测试基础设施建立 [通知]

创建了 `tests/cases/native_only/` + `tests/native_only.test.mjs` harness。首批 3 个测试：
- **i64_boundary** ✅：2^53 以上精度（JS oracle 此处失真）
- **i64_overflow** ✅：tagged pointer i63 范围内 2's complement wrap
- **int_divzero** (todo)：LLVM 后端 `sdiv` 无零检查（UB，exit 0 + garbage 而非 panic）

**发现**：
- 有效整数范围是 i63（±2^62）而非 i64（tagged pointer `(value << 1) | 1` 占 1 bit）
- 整数字面量 > 2^53 编译期丢精度（bootstrap 编译器用 JS Number 解析）— 测试用运行时算术绕过
- 整数除零是 UB（LLVM `sdiv x, 0` = undefined behavior）— 需 codegen 加 guard（归为未来 codegen 改进）

### 3. 最终基线测试结果 [通知]

- **npm test**: 935/935 全绿
- **llvm_diff**: 142/144 pass, 1 fail (已知 #138 Map.fold), 1 skip (receiver_temp_drop)
- **native-only**: 2 pass, 1 todo (int_divzero)

### 4. 修复过程中发现的预存问题 [观察]

- **gen_match_arm_enum switch 路径**同样有嵌套 constructor tag 不检查的 bug（已修 if-else 路径，switch 路径仅无 duplicate-tag 时触发，风险较低）
- **checker infer_method_call 缺参数下溢检查**：`sb.line()` 无参调用通过类型检查（应报 arity error）
- **整数除零是 LLVM UB**：`sdiv x, 0` 无 guard，exit 0 + garbage（native_only int_divzero 标为 todo）
- **整数字面量 > 2^53 编译期丢精度**：bootstrap 编译器用 JS Number 解析

### 5. 下一步：B-100 Phase 1.3 对抗 review [通知]

Phase 1.1（覆盖矩阵）✅ + Phase 1.2（gap 修复）✅ 完成。Phase 1.3 需要 `/full-audit` + `/code-review` 多轮对抗 review，loop-until-dry。Phase 1.4 需要 llvm_diff ×3 零失配（当前仅剩 #138，需决定是修复还是从 llvm_diff 排除）。

