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

## B-163 step 6 遗留 [决策]（2026-07-12，其余 7 条已分诊入表清除）

### [决策] 跨 longjmp 的 `let mut` 写入丢失（两后端一致，B-089 G-b 注释宣称的语义不成立）

场景：`let mut progress = 0; let r = { progress = 1; raise_x() } catch { _ => progress + 100 }` —— catch arm 与后续代码读到的 `progress` 都是 **0**（写入丢失），LLVM 与 C 后端 -O2 下行为一致（step 6 实测，`mut: 100 0`）。gen_try_catch 的 B-089 G-b 注释宣称 inline setjmp 让 body 内 `let mut` 赋值对外可见，但该保证在优化器下并不成立（跨 setjmp 修改的变量 = C 标准 indeterminate；LLVM IR 层同样被 mem2reg/DSE 吃掉）。golden 里没有覆盖此场景的用例（有则早红）。**需要拍板**：
- (a) 接受为语义限制并文档化（catch 语义边界注明「body 内对外层 mut 变量的写入在 catch 路径不可见」+ CLAUDE.md 已知限制）
- (b) 立案修复（volatile 化跨 setjmp 活跃变量 / 强制内存语义，两后端同修，性能代价待评估）

step 6 用例已刻意移除该场景，不锁定 UB。

---

## B-163 step 7（emit_drop_functions + RC 收口，2026-07-12）

### [通知] 用户 drop 调用的 evidence 实参——对 LLVM oracle 的有意正确性偏离

`fn drop(self)` 经 checker 推断带 `{io}` effect → C 原型是 `ring_<T>_drop(void* self, void* ev_io)` 两参。LLVM 侧 `emit_drop_functions` 构建调用时**只传 data_ptr 一个实参**（under-call：callee 从垃圾寄存器读第二参，io 路径恰好不读所以不炸）。C 侧 clang 强制原型 arity，必须补齐：evidence 位传 B-097 default evidence 全局（该 effect 有 all-default ops 时）或 RING_UNIT（io/fail/handler-only），与 ring_main 调用约定同款。**LLVM 侧的 under-call 是潜伏 wart**：若未来 drop 方法带「有 default ops 的自定义 effect」且 body 调 op，LLVM 读垃圾 evidence 指针会炸，C 侧则正确。Phase 2 退役 LLVM 则自然消失；若 LLVM 还要长期维护值得立案对齐。

### [通知] `impl Drop for <enum>` 的用户 drop 不会被调用（两后端一致的既有 gap）

checker 对 enum 的 `impl Drop` 照常收进 `drop_types`（E0801 move 语义也生效），但 LLVM `emit_drop_functions` 只在 **struct 循环**里查 `drop_types` 调用户 drop——enum 循环只做 payload 递归 drop，用户 drop body 静默不执行。C 侧按 oracle parity 照搬（diff=0 优先）。这是 LLVM 侧既有缺口，非本步引入；修复应两后端同步（enum drop fn 里 tag switch 前插用户 drop 调用）+ E2E 锁定。建议入 audit-report 或 backlog 由用户拍板。

### [通知] drop 注册时机与形态取舍

注册序列直接内联进 C `main()`（`ring_runtime_init` 之后、`__ring_default_evidence_init` 之前），未走合成 init fn——LLVM parity（emit_drop_registrations 在 main entry block 发射）且注册行是纯文本无需 per-function 发射基建。顺序：struct sorted 先、enum sorted 后（audit #237 确定性纪律）。typeid 用 `get_or_assign_c_typeid` 幂等复取，与 forward pass ctor 分配一致（RIIR 陷阱 #4）。

### [通知] 容器 drop 循环范围：C 侧无需生成，skip 集与 LLVM 逐一对齐

CLAUDE.md RIIR 陷阱 #1 说「在 emit_drop_functions 中为容器生成 custom drop 循环」——对照现实现，B-152 P2/P3 后 List/Map 实际路径是**跳过 codegen 生成、由 runtime 的 drop_list/drop_map 在固定 typeid 4/5 上原生处理**（RingList/RingMapStruct 布局是 runtime 私有，per-field drop 会漏 slot buffer）。C 侧同样 skip List/Map；Option 走 runtime drop_option（typeid 8）；Set/StringBuilder 仍是 extern type 不进 struct_types。**顺带发现：Result 两侧都不注册 drop**（LLVM enum 循环 skip "Result" 但 runtime 无 drop_result）——Result 壳 RC 归零时 payload 不递归释放 = 同构泄漏。既有行为，非本步引入，上报待拍板（修法：runtime 加 drop_result 固定 tid，或两侧 codegen 为 Result 生成 drop fn）。

### [观察] drop fn 命名沿用 LLVM 的 `ring_drop_<T>` 前缀，撞名时 clang 硬报错

用户若写 `fn drop_Foo()` 会 mangle 成 `ring_drop_Foo`，与 struct Foo 的 drop fn 撞符号——LLVM 侧靠模块级自动 rename 静默兜底（audit #244 家族），C 侧是 clang redefinition 硬错误（失真必须响，行为更稳但报错对用户不友好）。概率极低，不单独处理。

### RC 消费完整性核对结论（任务 2：无遗漏，本步零修补）

对照 LLVM 后端 emit_drop_functions 之外全部 19 处 dup/drop 发射位点逐一核对 C 侧：HStmt::Drop/Dup 标注消费、HExpr::Clone、lambda capture 把 Drop/Dup 名视作 use（B-084 #131）、return 路径 cleanup walk（#173/#193，stmt 位 + expr 位）、eq dispatch Neq 内部 box drop、ord dispatch cmp box drop（#151 probe D）、struct literal 字段 dup（B-098）、字符串插值临时 drop（B-104 D9）、guard fresh-owned drop、#162 字面量比较后 drop、B-096 evidence drops、while-cond box drop、derived clone dup、derived debug SB 临时 drop——全部已在 steps 2-6 落地。E0801/E0802/E0803 在 checker 共享层，`--backend=c` 下验证照常报错（E0803 无现成负面用例，手工验证通过；可考虑补一个 errors 用例，未擅自加）。
