# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-100 Phase 1.3 Worker Session（2026-06-25）

### 1. Wave A+B: 4 个小 bugfix 完成 [通知]

B-145（extern type 裸名碰撞）、B-146（switch 路径嵌套 tag 检查）、B-147（method arity 下溢检查）、B-148（整数除零 guard）全部完成并 merge。测试 935→937，llvm_diff 142→143，native_only 2→4。

### 2. Phase 1.3 Round 1-2: 10 个 gap 发现+修复 [通知]

**Round 1**（25 测试）：1 gap（Option.and_then 未实现）→ 已修。
**Round 2**（15 测试）：9 gap → 全部修复：
- 8 个 Map/Set HOF 方法实现（fold/filter/any/all/map_values，含 Int-keyed 变体，14 个新 runtime 函数）
- derive Eq/Ord/Debug 对泛型 struct/enum 缺 dict 参数传递 → 修复 6 个 emit 函数
- 闭包未捕获间接 effect 调用的 evidence → collect_captures 修复
- 泛型函数 body 以 Never 结尾时返回类型被绑定为 Never → checker 修复

### 3. Phase 1.3 Round 3: 未收敛 [通知]

19 个新测试，14 通过，5 失败。暴露 4 个 distinct bug，已记录为 audit #178-#181：
- #178 深层嵌套泛型 Eq 总 false（Round 2 dict fix 不彻底）
- #179 LLVM runtime 缺 Debug dict
- #180 catch 路径 + 泛型 Str 返回 garbage
- #181 Int literal or-pattern LLVM codegen crash

这些与外部审计 #159-#172 合并后，后续统一修复。

### 4. 关键判断 [通知]

- **Never 类型 checker fix（infer_decl.ring）**：skip body-vs-return unification when body is Never。这是 checker 级 bug，不仅影响 LLVM——只是 JS 后端的 template literal 掩盖了症状。修复正确但可能有边角残留（#180 可能相关）。
- **derive 泛型 dict 传参**：修了 1 层泛型 struct 的 dict 传递，但 3 层嵌套仍有问题（#178）。根因可能不是简单的"加参数"而是 dict resolve 链路在递归调用时的状态管理。

