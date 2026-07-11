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
