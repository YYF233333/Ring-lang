# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-100 Phase 1.1 Parity Tests + Fix Wave (2026-06-24)

### 1. 总览 [通知]

B-100 Phase 1.1 在本 session 完成了两个阶段：(A) 写 24 个 parity 测试暴露缺口；(B) 修复全部 10 个新发现的 LLVM 后端 bug + 1 个 pre-existing B-141。

**最终状态**：llvm_diff 119 pass / 1 fail（#138 map_set_for_each，用户拍板不修——等 RIIR 自然解决）。E2E 912/912。

### 2. 修复的 9 个 bug + B-141 [通知]

| Fix | 根因 | 改动范围 | 修复的测试 |
|-----|------|---------|-----------|
| Fix 1 | `gen_catch_arms` / `emit_if_let` 缺 `NamedConstructor` arm | codegen_llvm_expr + codegen_llvm_stmt | impl_effect_chain, if_let_basic |
| Fix 1.5 | `gen_catch_arms` 不做 tag dispatch，只执行第一个 arm | codegen_llvm_expr（重写为 switch） | catch_typed_multi |
| Fix 2 | LLVM 后端完全没处理 `derived_impls`——Eq/Clone/Debug 零 codegen | codegen_llvm_decl +350 行 | collection_eq + 隐性修复多个 |
| Fix 3 | associated type 变量在 `rebind_fn_type` 中遗漏 + scheme bounds 缺隐式约束 | infer.ring + infer_ctx + infer_decl + infer_register（4 文件协调改） | assoc_type |
| Fix 4/6 | 函数作为一等值时裸指针未包装成 closure struct | codegen_llvm_expr gen_ident | auto_boxing, fn_type_effect |
| Fix 5 | Clone = `ring_dup`；Debug 生成 `"Type { field: val }"` 格式字符串 | codegen_llvm_decl | clone_api, derive_clone_debug |
| Fix 5b | derived impl 函数在函数体 pass 之后才注册到 `ctx.functions` | codegen_llvm.ring（调序） | clone_api, derive_clone_debug |
| Fix 7 | `gen_handle_expr` evidence alloca 在 handle scope 退出后未恢复外层 → UAF | codegen_llvm_expr（save/restore） | default_effect_override |
| B-141 | LLVM 后端跳过 `HDecl::Trait`，不生成 default method body | codegen_llvm + codegen_llvm_decl +285 行 | trait_default_method |

### 3. Fix 3 的深度影响 [通知]

assoc_type 修复动了推断管线 4 个文件。`rebind_fn_type` 之前不比较返回类型位置的 TypeVar，导致 associated type 变量成为 orphan。改动：
- `infer_decl.ring`: `build_var_mapping` 增加返回类型比较
- `infer_register.ring`: 隐式 assoc type 注入 scheme bounds
- `infer_ctx.ring`: `check_assoc_constraints` 接受 `var_map` 做变量翻译
- `infer.ring`: `result_type` 移到 dict resolution 之后

这是推断层的结构性改动，非局部 fix。虽然 E2E 912 全绿，后续如果出现推断异常建议优先排查此处。

### 4. block_expr.ring RC verifier 问题 [通知]

block expression 作函数参数位 `show({...})` 触发 RC verifier leak-temp。改为先绑定变量。Perceus 不处理 block-as-argument 临时值——非正确性 bug 但值得记录。

### 5. Ring 只有 `+=` 和 `-=` [通知]

WT-B3 发现 Ring 不支持 `*=` / `/=`。basic_ops.ring 已调整。

### 6. B-100 下一步 [通知]

Phase 1.1（覆盖矩阵 + gap fix）✅ 完成。剩余：
- **Phase 1.3**：复数轮对抗 review（`/full-audit` + `/code-review`，loop-until-dry）
- **Phase 1.4**：llvm_diff ×3 零失配 + native E2E 全过 + 双 bootstrap 字节一致
- **Oracle-blind native-only 测试**（4 类：I64 全宽度 / 整数溢出 / 整数除零 / UTF-8）——需新测试机制
- **Phase 2**：golden 快照 + JS 后端删除

#138 (Map/Set HOF) 用户拍板不修——等 unsafe + RIIR 后 JS runtime 映射问题自然消失。

<!-- B-142 #1(审计覆盖范围+残留) #2(Effect wildcard消除) #3(HDecl wildcard展开) 纯信息已确认删除 2026-06-24 -->

<!-- B-139 #1(纯信息) #2(→B-141) 已处理 2026-06-24 -->
<!-- B-140 #3(纯信息) #4(→B-142+design.md约束) 已处理 2026-06-24 -->

<!-- B-099 UAF 决策已处理（2026-06-24）：用户拍板 (C) 先绕后修。Workaround commit f8302d8，根因修复排 B-140 [P1]。 -->

