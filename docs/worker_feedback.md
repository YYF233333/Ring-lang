# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-104 D1 Stage 2（total drop pass 收编 + 规则③，2026-06-11）

- `[通知]` **位置清单收口结果（git 81c43be..98eb25b，8 commits，每轮独立验证 + 独立 commit）**：已收口 = 规则③ Str-IndexExpr fresh（A）/ receiver 位 FieldAccess+IndexExpr（B）/ ForIn iterable + IfLet scrutinee（C1）/ LetDestructure init（C2，ANF 材料化 + RC 端 escape→borrow 双改，顺带消除 `let (a,b) = pair` 的 Clone-pin 泄漏）/ ExprStmt 丢弃值（C3）/ EffectOp args（D，handler-tail escape-Clone 平衡论证）/ while-cond+guard 结果 box（E，codegen post-unbox drop + hir.ring 共享谓词）/ Set 迭代转换 list（F，codegen 合成临时）。**保守保留** = StructLit/NVC spread 源（codegen 裸字段指针拷贝，材料化即 UAF）/ fold 实参（anf_arg 唯一余户，#150 拍板后可退役）/ Call-callee 自身为 Call 的形态（罕见，残余泄漏）/ And/Or 结果与非 while/guard 位的控制流丢弃值（phi 可能 verbatim 借用，泄漏方向）/ TypeVar/ErrorType 类型值（#149 守卫，unknown ownership）。
- `[通知]` **新机制：dropping-block tail-escape 不变量**（rc_block_inner）：发 scope-end drops 的 block 一律以 escape 处理 tail——hoist 的 tail 值存活到 drops 之后，borrow tail（直接或经控制流 arm tail）会悬垂。修复了 **W2 起就存在的 ASan 实证 UAF**：`while match make(i) { some(p) => p.flag, none => false }`（材料化 scrutinee 在 cond-block 末 drop，arm 刚返回其 solely-owned payload 投影 → ring_unbox_bool 读 freed；pre-fix 复现 / post-fix EXIT 0，回归 receiver_temp_drop.ring）。代价 = borrow 位 dropping-block 的 owner-bearing tail 多一个 dup（有界、crash-free 方向）。
- `[通知]` **新机制：codegen 级 condition-box drop**（E 轮，B-104b 先例推广）：while-cond / match-guard 的 Bool box 唯一消费者是 codegen 的 unbox，HIR 表达不了「unbox 后释放」（wrapper 绑定要么悬垂要么照漏，已穷举论证）→ emit_while / emit_match_arm_body 在 unbox 后按 `is_fresh_owned_bool_value`（hir.ring，跨阶段共享）补 drop。`is_borrow_returning_call`/`is_arg_returning_call` 按 CLAUDE.md 共享约定规则迁入 hir.ring（B-103 证据表留 perceus.ring 互指）。post-RC Block 形态结构化识别（dropping block 的 tail 被 RC 重写为 `let __rc_scope_N = <owned tail>` + Ident——按「本 block 直接 stmts 中最后同名 Let/Var 的 init」分类，无名字字符串契约）。隔离 probe 决定性：**1M 迭代 `while i < n` BOOL live 1,000,001 → 3（0.0%）**。
- `[通知]` **leak% 轨迹（自编译 -DRING_ALLOC_STATS，统一 @2.382B allocs 里程碑，15GB kill）**：基线 f7d5544 = 15.3%（live 364.66M）→ A 15.3%（rule③ 编译器零 str[i]，lexer 用 char_at——用户面收益）→ **B 14.3%（live −25.1M；OPTION 74.0→60.9M，lexer char_at-Option receiver 回收兑现）** → C1/C2/C3/D ~14.2%（编译器中形态占比小，用户面收益）→ E 14.1%（live −3.2M，BOOL −1.5M——编译器热循环是 for-in 非 while）→ F 持平。**残余主体 @2.382B = STR 86.5M / BOOL 67.8M / CLOSURE 63.8M / OPTION 61.1M / TUPLE 31.9M**：CLOSURE+TUPLE 高度疑似 #151（codegen 合成 Eq/Ord dict，HIR 不可见、ANF 不可达）；且 live 计数**含合法存活**（编译器整棵 AST/HIR/env 在内存里）——leak% 仪表非纯泄漏，真伪判别要 D2 verifier。
- `[通知]` **测试与验证**：llvm_diff 57→65 例（str_index_fresh / receiver_temp_drop / eval_once_head_drop / letdestructure_init_drop / exprstmt_discard_drop / effectop_arg_drop / while_cond_box_drop / set_iteration_drop），每轮 JS 743 全绿 + llvm ×3 全绿 + dist double-bootstrap fixpoint 0 diff + native harness 3/3 + ASan real_program ×3 clean。C1 首跑撞出 #148（`List<Int>.join` native 堆溢出，oracle 盲区类）；C3 撞出 #149（未标注 fn 返回过度泛化 → TypeVar → double-free 类，ASan 双向实证：pre-guard `let r = tp(a)` UAF 在 c470d13 即存在 / post-guard EXIT 0；perceus 守卫已落，checker 根修开 audit #149 [high]）。
- `[决策]` **#150 fold 空表 verbatim-init 洞的修复方向**：`ring_list_fold` 空表 `return init;` 无 dup + `is_droppable_init(Call)=true` ⇒ `let x = xs.fold(<owner-bearing>, g)` 空表时 double-free（推导发现、runtime 源码核实；全仓 19 处 fold init 全字面量 = 零实存站点）。建议 = runtime 空表路径 `ring_dup(init)`（B-103 dup-on-share ×9 同模式）+ fold 退役出 `is_arg_returning_call`（W1 实参材料化全覆盖、anf_arg 机制可删）。Stage 2 未动，留拍板。
- `[通知]` **#140 处置 = 不顺手收口，留 B-099**：`drop_closure_env` 是按 leading-count 迭代的**通用** runtime drop（非 per-env typed），跳过 extern-handle slot 需捕获重排 + 部分计数（env 布局/协议变更）或 per-slot 标志；且 `collect_captures` 只收集名字无类型（穿类型 = 签名链改动，泛型捕获类型还可能未解析）。不满足「低侵入」判据；零实存站点维持 latent。
- `[观察]` **`__rc_scope_` hoist 机制的固有约束**：borrow 位 block 的 tail 值在 block-end drops 之后才被父节点消费——任何「tail 借用本 block 将 drop 的 local」形态都是 UAF 类（tail-escape 不变量已封死）。今后扩展 rc_block_inner 时此不变量必须保持。
- `[观察]` **维护 wave 的 merge（b19c85b）改了 lexer 但未重建 dist-llvm**——Round A 已带上重建。建议 dist-llvm 的 rebuild 纪律与 dist 同级写进 CLAUDE.md（现仅 dist 有明文）。
