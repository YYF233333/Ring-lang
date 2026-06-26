# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-100 P1.4 执行（2026-06-26）

### 1. #208 修复：emit_fn_body effect key mismatch [通知]

**根因**：`codegen_llvm_decl.ring:emit_fn_body` 用未限定方法名（如 `"check"`）查 `ctx.local_fn_effects`，而 `scan_fn_effects` 存 impl method 时用 qualified key `"${target_type}_${mn}"`（如 `"Parser_check"`）。当编译器有同名顶层函数（`checker.check` / `infer_decl.check`，带 `fail` effect）时，impl method 错误继承了那个 effect → forward declaration（用正确 qualified key，无 fail）和 body emission 参数数量不一致 → `LLVMGetParam` 越界 → ACCESS_VIOLATION。

**修复**：在 `emit_fn_body` 中根据 `impl_type` 计算 `effect_key`，与 `scan_fn_effects` / `forward_declare_fn_with_name` 使用相同的 qualified key 格式。

**诊断过程**：通过在 dist/ JS 文件中逐级添加 `process.stderr.write` 追踪定位——先到 module/decl 级，再到 method 级，再到 emit_fn_body 内部步骤——最终精确定位到 `LLVMGetParam(fn_val, param_idx=2)` 越界。从发现 #208 到修复约 45 分钟。

### 2. 支线审计：未限定名一致性 [通知]

Fork agent 审计了所有 `codegen_llvm*.ring` 中的 map lookup key 一致性。除 #208 外，所有 LLVM 后端的 key 使用一致。

**JS 后端有同类潜在 bug**（`codegen_decl.ring:71` 和 `codegen_expr.ring:408`），但 JS 对多余参数容忍所以不崩溃——语义可能错误但不 crash。JS 后端即将退役，不紧急。

### 3. #209 发现：ring.exe 嵌套表达式 RC 崩溃 [通知]

#208 修复后 dist-llvm 自编译成功，但 ring.exe 本身存在嵌套 BinOp 崩溃问题（`3 * 2 * 2` 崩、拆成 `let a = 3*2; a*2` 正常）。316 个测试中 57 个复现。疑似 Perceus RC 对嵌套表达式中间临时 Str 的 drop 位置错误（use-after-free）。

**阻塞双 bootstrap**——ring.exe 无法编译编译器自身。G-b（2026-06-16）曾通过，后续 RC/codegen 修改（#175 perceus sink / #193-#206 审计修复）可能引入回归。

### 4. P1.4 最终状态 [通知]

| 项 | 状态 |
|---|---|
| llvm_diff ×3 | ✅ 209/209 |
| #208 dist-llvm 自编译 | ✅ 修复 |
| native E2E (test:native-only) | ✅ 4/4 |
| native E2E (test:native) | ✅ 3/3 |
| 双 bootstrap | ❌ #209 阻塞 |


