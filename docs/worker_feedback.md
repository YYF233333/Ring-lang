# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-122 SCC 拓扑序（2026-06-14，Worker）

### 1. 实现方案偏差 [通知]

Spec 说"未标注 ret 复用注册签名的 var（消除 :1306 的二次 fresh var）"，实际实现用了 **rebind-after** 方案：check_fn_decl 仍创建自己的 fresh var（:1306 不改），checking 完成后 `rebind_fn_type` 将 zonked 的 resolved 类型映射回注册层的 var 空间并 rebind。功能等价，对 check_fn_decl 内部零侵入，更稳妥。

### 2. 缺少 rebind post-check 断言 [通知]

Spec 要求的"rebind 时若发现 ret var 仍 unresolved → 报内部错误（漏边信号）"未实现。当前 rebind_fn_type 的 apply_var_mapping 对未匹配的 TypeVar 保持 as-is（无 panic）。实际场景通过 835 测试 + double bootstrap 验证无漏边，但形式化兜底缺失。如果后续要补，加在 `rebind_fn_type` 末尾即可。

### 3. impl 方法 SCC 粒度 [通知]

Spec 说"顶层 fn / impl 方法"作为 SCC 节点。实际实现将 **impl block 作为整体** 参与 SCC（`"impl::TypeName"` 或 `"impl::TypeName::TraitName"`），同 impl 内方法不拆分。这对当前已知 bug（顶层 fn 间的声明序依赖）已足够。如果将来出现 impl 方法间的 SCC 问题，需细化到方法级。

### 4. 附带修复 [通知]

SCC rebinding 暴露了 `codegen_llvm_decl.ring:507` 的一个潜在类型不匹配：`emit_dict_method_slot` 返回 `LLVMValueRef` 但调用处丢弃返回值（Unit 上下文）。加了 `let _ =` 修复。这是 SCC 改变了 check 顺序后新暴露的 latent issue——之前 Pass 2 按声明序检查时该路径未触发 rebind 校验。

### 5. hdecls 顺序变化 [通知]

新的三阶段 check() 输出 hdecls 不再按源码声明序，而是：非 fn/impl 声明 → impl 块 → 顶层 fn（SCC 拓扑序）→ 安全网兜底。JS/LLVM codegen 不依赖声明顺序（JS 函数声明提升、LLVM module-level 无序），double bootstrap 确认无影响。

## Audit 观察报告（2026-06-13，JS 退役准备审计）

### 1. [观察] `variant_js_name`（hir.ring:296）名称含 "js" 但实现后端无关

**现状**：`variant_js_name(enum_name, variant_name)` 实现为 `"${enum_name}_${variant_name}"` 的简单拼接，无任何 JS 特有转义/保留字处理。注释写 "// JS codegen naming conventions" 但 LLVM 后端（codegen_llvm_expr.ring）同样使用此函数生成 enum tag 字符串。
**为什么值得注意**：B-100 JS 退役清理时，若有人看到 "js" 前缀误以为是 JS 专属函数而删除，会导致 LLVM 后端 enum 匹配静默失败。建议在 B-100 清理阶段重命名为 `variant_tag_name` 或 `variant_canonical_name`，同时去掉 "JS codegen naming conventions" 注释。

### 2. [观察] llvm_diff 测试套件零非 ASCII 覆盖

**现状**：`tests/cases/llvm/` 全部测试用例仅使用 ASCII 字符串。#158 揭示的 UTF-8 字节 vs UTF-16 字符分歧对 ASCII 不可见。
**为什么值得注意**：B-100 Phase 1 parity 认证门要求"穷举覆盖矩阵"。非 ASCII 测试缺失意味着字符串操作 parity 的整个角落未验证。建议 B-089/B-100 之前补 CJK/emoji 字符的 str 方法差分用例（len/index_of/char_at/slice）——如果 diff 测试失败，说明需要先解决 #158 的设计拍板。

### 3. [观察] llvm_diff 覆盖率 ~72 vs ~820（~9% 特性覆盖）

**现状**：`tests/cases/llvm/` 约 72 个测试文件，`tests/cases/` 约 820 个。约 91% 的语言特性测试仅 JS 后端运行。
**为什么值得注意**：B-100 Phase 1 要求"不抽样的穷举特性覆盖"。当前差距巨大——特别是 closure/effect handler/pattern matching 等复杂特性的 LLVM 覆盖可能不足。此数字可作为 B-089/B-100 工作量估算的输入。

### 4. [观察] #152 的 `[deferred: B-104]` 标记已过期

**现状**：B-104 已于 2026-06-13 落地（G-a 三门通过）。#152（runtime HOF 内部临时不 drop）的 deferred 条件已满足。
**为什么值得注意**：#152 原文已拍板"B-104 落地后与 B-121 同档排期"。deferred 标记应更新（移除或改标新的 deferred 条件），否则 Worker 扫描可能跳过。
