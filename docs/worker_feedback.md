# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Worker Wave A（2026-05-24）

### 1. B-048 闭包捕获 `let mut` 的 effect 注入未实现 [通知]

B-048 spec 第 3 项要求"闭包捕获 `let mut` 变量时，在闭包签名注入 `mut<T>` effect"。Agent 实现了核心的 local effect cancellation（函数/方法调用后检查实参是否为局部变量并过滤 mut effect），但闭包捕获注入部分因需要额外的闭包分析逻辑而跳过。已在 commit message 中标注。

### 2. #99 完成但 #100/#101 因 API 错误中断 [通知]

WT-A1 agent 在完成 #99（合并 register_impl_method/register_impl_extern_method）后遭遇 API socket 断连，#100 和 #101 未开始。#99 已手动验证（编译 + 669 测试全过）并提交。#100/#101 状态回退为 `open`，将在后续 wave 继续。

### 3. #102 替换数量为 106 处而非 spec 预估的 96 处 [通知]

实际搜索发现 106 处 workaround 模式（spec 预估 96 处），包括 2 个 `List<Int>` 和 1 个 `List<Effect>` 变体。compiler_mod.ring 中 2 个 helper 函数（`empty_module_exports_list`/`empty_str_list`）需要额外添加类型标注。全部替换后测试 669 → 669 全过。

## Audit 观察报告（2026-05-24）

### 1. [观察] ``check_effects_capability`` 的保守拒绝策略

**现状**：`check_effects_capability`（`infer_decl.ring:174-184`）对任何 open tail 的 effect row 报 E0408，包括完全无 effect 的函数（如 `fn id(x: Int) -> Int { x }`）。代码注释写 "Reject conservatively"。

**为什么值得注意**：这使 `mod requires {io}` 内无法定义**任何**未标注 explicit effect 的函数——即使该函数完全纯。当前编译器自举中 mod requires 使用较少，但该限制会显著影响 `mod requires` 的可用性（已记录为 #107）。

### 2. [观察] `delegate` 仅支持 struct 是有意设计，非 bug

**现状**：`register_delegate`（`infer_register.ring:871`）仅查 `ctx.env.types.structs.get(target_type)`，不查 enums。错误消息明确写 "delegate can only be used on struct types"。

**为什么值得注意**：Claude agent 将此标记为 medium 级别的 bug，但实际是 intentional design limit——delegate 语义上对应 struct 字段转发（类似 Rust Deref），enum 的变体结构不支持此模式。审计时需注意区分 "缺失功能" 和 "bug"。

### 3. [观察] Claude agent 误判 #100 为已修复

**现状**：Claude agent 声称 `register_fn` 和 `register_extern_fn` 已合并，但代码中两函数（`infer_register.ring:1189` 和 `infer_register.ring:1277`）仍然独立存在。

**为什么值得注意**：交叉验证审计价值被再次证明——单模型可能误判。DS agent 虽然在某些方面不如 Claude 深入，但独立视角消除单模型盲点。

### 4. [观察] Occurs check 缺失 fields 遍历与 #45 相关

**现状**：`occurs_in`（`unify.ring:55-58`）不检查 StructType/EnumType 的 fields/variants 中的类型。但 `apply_subst`（#45）同样不替换 fields 中的类型，所以即使 occurs check 检查了 fields，看到的也是未经替换的 type var（可能不是同一个 var_id）。

**为什么值得注意**：#108 和 #45 形成互锁——修复一个需要同时修复另一个。当前两问题虽然都存在但安全（fields 中的类型变量永远不会和外部统一，所以 occurs check 也不需要看它们）。这确认了 #45 的长期容忍决策是正确的。

### 5. [观察] `parser.ring` 无 expression-level 错误恢复

**现状**：Parser 有声明级错误恢复（遇到语法错误跳到下一个声明关键字），但 `handle...with` 等表达式没有错误恢复机制。

**为什么值得注意**：单个 malformed handle 表达式可 poison 整个表达式的 parsing。但影响有限——handle 表达式在实践中使用较少（主要用于标准库和少数测试）。Claude agent 和 DS agent 均未将此项提升为 critical。

### 6. [观察] HOF lambda codegen 剥离 evidence 参数依赖闭包捕获

**现状**：`gen_lambda_capture_evidence`（`codegen_expr.ring:1470-1501`）对传给 HOF 方法（map/filter/fold 等）的 lambda 剥离 evidence 参数，改为从闭包作用域捕获。

**为什么值得注意**：当前安全——HOF lambda 在同一作用域内立即调用。但如果未来 lambda 被存储到数据结构中延迟调用（如 event handler），捕获的 evidence 可能已失效。这是 JS 后端特有的问题，LLVM 后端需要不同的 evidence threading 策略。

### 7. [观察] Debug derive 对 FnType 用 `String(expr)` 输出函数源码

**现状**：`derive.ring:323-328` 对函数类型字段使用 `FieldAction::Identity`，`codegen_derive.ring:460` 将其生成为 `String(expr)`。对函数值，`String(fn)` 会输出整个函数源码。

**为什么值得注意**：struct 中包含函数字段时，Debug 输出会非常冗长。实际场景中函数字段较少见，影响有限。建议改为 `"<fn>"` 固定字符串。

### 8. [观察] Match 表达式 IIFE 分配闭包开销

**现状**：不含 `return` 的 match 表达式用 `(function() { ... })()` IIFE 模式。含 `return` 的 match 使用 labeled block + temp variable 方案（`gen_match` 中 `stmts_contain_return` 检测）。

**为什么值得注意**：每个 match 表达式创建一个新的 function 对象。V8 可以内联小 IIFE，实际性能影响低。但统一使用 labeled block 方案可避免闭包分配，且代码更一致。低优先级。

