# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-089 G-b 根因定位（2026-06-16）

### 1. 根因：LLVM codegen TryCatch closure capture 值拷贝 [通知]

`codegen_llvm_expr.ring:gen_try_catch`（line 4114）将 TryCatch body 编译为 closure（`gen_lambda`），captured 外层 `let mut` 变量是值拷贝（load 外层 alloca → store 闭包 local alloca）。闭包内对 captured 变量的赋值（如 `effects = me.0`）修改的是 local 副本，不回传外层。JS 后端用 IIFE + try/catch（引用 capture），修改可见——所以 JS 版正确、LLVM 版丢失。

**影响**：编译器内所有 `some({...}) catch` 块内的外层 mut 变量赋值在 native 中丢失。具体表现为 checker 推断的 fail effect 在 match arm 处理后消失，导致 ~20 处 W0001 warning + evidence 参数缺失。

**最小复现**：`tests/cases/b089_repro7.ring`（33 行）——struct impl method 内 match + fail method call，native 丢 fail effect。

### 2. 修复原型已验证但 RC 平衡未解 [通知]

修复方案 = `gen_try_body_closure`：闭包返回前 write-back local alloca → env，ring_try 返回后 read-back env → outer alloca。小文件验证通过（parser.js evidence 6→427 = node），但全量自编译 heap corruption——env 在 B-096 闭包 RC 未收口（leak）状态下 write-back 的 dup/drop 不平衡。

**两个修复方向**：
- (A) 修 RC 平衡：理解 B-096 env leak 下的精确 RC 语义，使 write-back dup/drop 正确
- (B) 改 inline setjmp：不用 closure 实现 TryCatch，直接在当前函数 emit setjmp/longjmp IR，彻底消除 capture 问题

### 3. 发现路径 [通知]

instrumented debugging（eprintln 追踪 checker effect 流）→ 确认 `infer_match` 的 `merge_effects` 返回值正确但赋值后被清零 → 最小复现（33 行，单 arm match）→ 排除 SCC/Map 排序/UAF → 确认 match-only（if/else 正确）→ 追踪到 `gen_try_catch` 的 closure capture 机制 → 根因锁定

