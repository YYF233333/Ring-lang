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

## B-163 Phase 1 step 6（effect handler + catch + #246，2026-07-12）

### [通知] handler 机制映射方案（先读现实现，原样映射）

- **abort（fail.raise / catch）= setjmp/longjmp**：`ring_catch_push()` → `ring_catch_get_buf(frame)` → C 标准 `setjmp` 宏 → 失败路径 `ring_catch_get_error(frame)`。与 LLVM 唯一的形态差异：LLVM 手动声明 `_setjmp(buf, @llvm.frameaddress)`（Windows x64 ABI 手工传帧指针），C 侧用 `<setjmp.h>` 的 `setjmp(*(jmp_buf*)buf)` 宏——clang 展开时自动处理同一 ABI，比手工版更稳。`setjmp` 只出现在 `if (setjmp(...) != 0) goto ...` 完整控制表达式位置（C11 7.13.1.1p5 合法上下文，不赋值给临时）。
- **tail-resumptive = evidence struct**：`{int64_t count, void* slot0, ...}`，typeid 21（RING_TYPEID_EVIDENCE），slot k = op k 的 {fn_ptr, env} 闭包（hir::effect_op_slot 契约），handler arm 经 gen_c_lambda 成闭包；effect op 派发 = load slot + closure call，arm 返回值即 resume 值。B-096 drop（handle 尾部 + return 路径）/ B-097 default 合并 / B-161 sibling-op evidence 重定向 / B-100 Fix 7 外层 evidence 恢复全部逐条对齐。
- **default evidence**：LLVM 在 main entry block 内联构造；C 侧为独立合成函数 `__ring_default_evidence_init()`（`static void*` 全局 + main 在 ring_main 前调用）。语义相同（进程生命周期、永不 drop），形态差异记录在案。
- **setjmp 非 volatile 局部变量**：C 标准说跨 setjmp 修改过的非 volatile automatic 在 longjmp 后 indeterminate。依赖与 LLVM 后端完全相同的机制兜底：clang 对 `<setjmp.h>` 的 setjmp 标 returns_twice，后端对含此调用的函数做保守寄存器处理——与 LLVM 后端（手工 returns_twice attr + entry alloca）走的是同一条 LLVM 管线路径。实测两后端在该面行为逐位一致（含下述已知缺陷场景也一致）。

### [通知] abort handler 的 arm body 不执行（LLVM 现存语义，faithful port）

`handle { body } with { fail.raise(e) => <arm> }` 两后端的实现都是「raise 的值直接成为 handle 结果」——**arm body 从不执行**（LLVM gen_handle_expr 注释自述 "the catch path simply returns the error value"）。若 arm body 不是恒等（如 `fail.raise(e) => match e {...}`），结果类型虽通过 checker，运行时却拿到原始 error 值（enum 指针被当 Int 打印 = 垃圾数字，本 step 用例开发中实测）。这不是 step 6 引入——C 侧忠实移植保持 diff=0。**建议立 audit 条目**（checker 允许非恒等 arm body 但 codegen 忽略之 = 静默 wrong-code 面）。`c_backend_step6.ring` 的 abort 场景刻意用恒等 arm 规避。

### [通知] #246 复现确认 + 修复

修复前（复现用例 `catch_nested_ctor_tags.ring` 实测，旧 ring.exe）四形态全 wrong-code，且伴随 **LLVM module verifier error**（同 tag 两 arm → 重复 switch case = invalid IR）：
1. `Code(0)` vs `Code(n)`：literal 子模式从不比较，Code(0) arm 全 dead（raise Code(0) 落进 Code(n)，r1=0 应为 100）
2. `W(A)` vs `W(B)`：嵌套 ctor tag 不测，首 arm 恒赢（r3=1 应为 2）
3. 顶层 literal arm（fail<Int> 的 `0 => ...`）：simple path 无条件执行首 arm（r4=100 应为 7）
4. guarded ctor arm 的 literal 子模式不查（r5=90 应为 3）

修复：`gen_catch_arms` 增加 `catch_pattern_needs_chain` 扫描——含 refutable 子模式的 ctor arm / 顶层 literal arm 与 guarded arm 一起路由进 if-else 链；链内 ctor arm 在 tag 测试后接 `check_positional_fields_nested_tags` / `check_named_fields_nested_tags`（与 gen_match_if_else 逐字同构）；链内新增 `Pattern::Literal` 分支（gen_literal_pattern_cond）。纯 tag 可判别的多 ctor arm 仍走原 switch（不回退性能）。回归用例 expected **手写**（LLVM 是 bug 方，不经 oracle）。C 侧 catch arms 直接复用 `emit_c_match_arm` 统一测试链（含 #245 后的 check_c_nested_ctor_tags 全族）——该缺陷未被移植。

### [观察] catch 顶层 TuplePattern / OrPattern 在 LLVM 链路径仍是 `_ => {}` 空分支

本次修复覆盖 ctor 嵌套 + 顶层 literal（#246 明示面）。若 checker 允许 catch arm 顶层写 tuple/or-pattern（fail<(Int,Str)> 之类），LLVM 链路径会静默跳过该 arm（C 侧 emit_c_match_arm 天然支持）。未在本波扩面——建议 audit 复核 checker 是否放行此类 arm，放行则补。

### [决策] 跨 longjmp 的 `let mut` 写入丢失（两后端一致，B-089 G-b 注释宣称的语义不成立）

场景：`let mut progress = 0; let r = { progress = 1; raise_x() } catch { _ => progress + 100 }` —— catch arm 与后续代码读到的 `progress` 都是 **0**（写入丢失），LLVM 与 C 后端 -O2 下行为一致（本 step 实测，`mut: 100 0`）。gen_try_catch 的 B-089 G-b 注释宣称 inline setjmp 让 body 内 `let mut` 赋值对外可见，但该保证在优化器下并不成立（跨 setjmp 修改的变量 = C 标准 indeterminate；LLVM IR 层同样被 mem2reg/DSE 吃掉）。golden 里没有覆盖此场景的用例（有则早红）。**需要拍板**：a) 接受为语义限制并文档化（catch 语义边界注明「body 内对外层 mut 变量的写入在 catch 路径不可见」）；b) 立案修复（volatile 化跨 setjmp 活跃变量 / 强制内存语义，两后端同修）。step 6 用例已刻意移除该场景，不锁定 UB。

### [通知] c_push_fn/c_pop_fn 隔离 handle_cleanup_stack（对 LLVM 的有意正确性偏离）

嵌套函数（lambda/dict getter/thunk）是独立 C 栈帧——lambda body 里的 `return` 不得 pop 外层函数的 catch frame。C 侧 c_push_fn 保存并清空 cleanup stack，c_pop_fn 恢复。**LLVM 的 gen_lambda 没有对应处理**（handle_cleanup_stack 泄漏进 lambda 发射，lambda body 内含 `return` 时会在 lambda 帧里错误发射 ring_catch_pop）——触发面窄（handler body 的 lambda 内显式 return），建议 audit 复核。

### [通知] LLVM_SKIP handler/effect + runtime-crash 条目 C 后端重评估（§2.3，只评估未改 SKIP 表）

| 用例 | C 后端行为 | 处置建议 |
|---|---|---|
| default_effect_topo | **PASS**（exit 0） | 后续波挪出 SKIP / 加 LLVM 例外 |
| exhaustive_generic_payload | **PASS**（all tests passed） | 同上 |
| map_hof | **PASS**（40/2/60/true 全对；LLVM 是 AV crash） | 同上 |
| map_ufcs_bug | **PASS**（ok；LLVM 是 AV crash） | 同上 |
| default_effect_body_io | 输出全对但退出时 0xC0000374 堆损坏——**与 LLVM 行为逐位一致**（同输出+同退出码） | 保持 SKIP；根因在共享 RC 层（default-body 闭包的 RC 平衡），非后端问题 |
| mod_effect_evidence | 0xC0000005 AV 无输出 | 保持 SKIP；疑似 qualified effect 名（`::`→`$`）在 evidence 名 slice(10) 提取后查不到 default evidence → null evidence 派发（LLVM 同构问题） |
| effect_custom_and_fail | assertion fail（fail on bad port）——与 LLVM 同 | 保持 SKIP；缺陷在共享层 |
| effect_custom_multi_effect | assertion fail（log called twice）——与 LLVM 同 | 保持 SKIP；共享层 |
| struct_match_pattern | assertion fail（y-axis）——与 LLVM 同 | 保持 SKIP；共享层 |
| tuple_eq / tuple_eq_struct | assertion fail——与 LLVM 同 | 保持 SKIP；共享层（tuple == 派发） |

四个「与 LLVM 同 fail」条目意味着缺陷在 HIR/checker/perceus 共享层而非 codegen——双后端差分在这里给出了新证据（原 LLVM_SKIP 注释把它们归为 "pre-existing LLVM backend bugs"，现在可以排除 codegen 单侧嫌疑）。

### [通知] 其它取舍

- catch 穷尽失败：C 发 `ring_panic("catch exhaustion failure #N")`（LLVM 发 unreachable）——step 4 match 家族同款稳健性偏离，仅 checker 保证不可达路径可观测。
- 非 abort handle 的结果值在 evidence drop 前材料化到临时（对齐 LLVM SSA 求值顺序）。
- evidence drop 按**唯一 C 变量名**记账（非 evidence 名）——嵌套同 effect handle 不双 free（LLVM 按 alloca 记账的等价物）。
- `#include <setjmp.h>` 无条件进 preamble（确定性优先，未用时无害）。
