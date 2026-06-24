# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-100 Phase 1.1 Parity Tests (2026-06-24)

### 1. Parity 测试暴露 10 个 LLVM 后端缺口 [通知]

24 个新 llvm_diff 文件已写入。13 通过 parity，11 失败（1 个 pre-existing #138，1 个 known limitation B-141）。

**10 个新缺口——按根因分类：**

**Category A: LLVM codegen 编译期 crash——catch arm 模式绑定不在作用域**
- `catch_typed_multi.ring`: panic "undefined variable 'key'" in gen_catch_arms → gen_string_interp
- `impl_effect_chain.ring`: panic "undefined variable 'msg'" in gen_catch_arms → gen_string_interp
- `if_let_basic.ring`: 同一模式——if-let enum 解构

三个都在编译期（LLVM codegen 阶段）crash。共同路径：catch arm 引入模式绑定 → 字符串插值内引用绑定 → gen_ident 找不到变量。很可能是单一 bug：`gen_catch_arms` 没有把解构绑定注册到 LLVM 变量作用域。

**Category B: 运行时 crash——编译通过但 exe panic**
- `assoc_type.ring`: associated type 解析
- `auto_boxing.ring`: 泛型 auto-boxing
- `clone_api.ring`: 显式 Clone 调用
- `collection_eq.ring`: 集合内 struct 相等比较
- `derive_clone_debug.ring`: Clone + Debug derive
- `fn_type_effect.ring`: 函数类型 effect 标注
- `default_effect_override.ring`: default effect body override

需逐个诊断。部分可能共享根因（如 clone_api + derive_clone_debug + collection_eq 可能都源于 Clone dispatch）。

**Pre-existing（非新发现）：**
- `map_set_for_each.ring`: #138，Map.fold 缺 runtime 映射
- `trait_default_method.ring`: B-141，LLVM 不支持 default trait methods

### 2. block_expr.ring RC verifier 问题 [通知]

原版 block_expr.ring 在函数参数位置使用块表达式 `show({...})`，RC verifier 报 leak-temp。已改为先绑定变量。Perceus 不处理 block-as-argument 临时值——非正确性 bug（改后测试通过），但值得记录。

### 3. Ring 只有 `+=` 和 `-=` [通知]

WT-B3 发现 Ring 不支持 `*=` / `/=` 复合赋值运算符。basic_ops.ring 已调整。这是语言特性缺口，非 bug。

### 4. B-100 Phase 1 状态 [通知]

Phase 1.1（覆盖矩阵）测试已写完，但 10 个缺口阻塞 Phase 1.4（零失配门）。这些必须先修才能继续。预估 3-5 个独立编译器 bug。

<!-- B-142 #1(审计覆盖范围+残留) #2(Effect wildcard消除) #3(HDecl wildcard展开) 纯信息已确认删除 2026-06-24 -->

<!-- B-139 #1(纯信息) #2(→B-141) 已处理 2026-06-24 -->
<!-- B-140 #3(纯信息) #4(→B-142+design.md约束) 已处理 2026-06-24 -->

<!-- B-099 UAF 决策已处理（2026-06-24）：用户拍板 (C) 先绕后修。Workaround commit f8302d8，根因修复排 B-140 [P1]。 -->

