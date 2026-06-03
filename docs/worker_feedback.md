# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-086 LLVM 缺失 runtime 原语

### 1. enumerate / to_int / to_float 是否该成为 Ring 方法？[决策]

**现状**：B-086 spec（源自 audit Agent D）说这三个是"codegen 已映射，只差 runtime"。Worker 核查发现**错**——checker 没注册这三个为方法，`.enumerate()/.to_int()/.to_float()` 在 JS 和 LLVM 两后端都类型检查失败（E0305 "Type has no method"）。`infer_ctx.ring:98-105` 把 Str→Int 导向自由函数 `parse_int()` 而非 `.to_int()` 方法。所以它们在 Ring 语言里**不存在**，codegen 映射是死映射，runtime 实现无法被任何 .ring 程序触达、也无法差分测试。
**原因**：Agent D 只查了 codegen 的 method→runtime 映射表，没查 checker 的 builtin 方法注册（`builtins.ring`）。
**已动作**：撤回这三个的 runtime stub（不留无法测试的死代码），flat_map 正常合入。
**待决策**：Ring 是否要把这三个加成正式方法？
- (A) 加 `.enumerate()`（迭代器常用）——需 `builtins.ring` 注册方案 + codegen 映射（已有）+ runtime + 差分。设计扩展。
- (B) 加 `.to_int()/.to_float()`——但 Ring 已有 `parse_int()/parse_float()` 自由函数覆盖，加方法是 API 冗余。
- (C) 都不加，保持现状。并清掉 codegen 里的死映射（`codegen_llvm_expr.ring:1405/1406/1448`）以免误导后续。
推荐：enumerate 走 A 或 C，to_int/to_float 倾向 C（避免与 parse_* 冗余）。

### 2. find_index / fold 是真正的 native E2E 阻塞 gap [通知]

验收 E2E `list_flat_map.ring` 还用了 `find_index`、`list_method_chain.ring` 还用了 `fold`——两者在 JS 后端是真 builtin（能跑）但 LLVM 后端没映射+没 runtime。已设为 B-086 的剩余范围（dispatch 升级 judgment，因要改编译器源码）。flat_map 本身两后端已通。

### 3. 新 worktree 缺 LLVM N-API addon [通知]

`compiler/llvm-addon/` 是 .gitignore 的本地构建产物，新建的 worktree 里没有 `.node`，agent 要先 `node-gyp rebuild`（B-086 agent 已自行处理）才能跑 `npm run test:llvm`。后续每个跑 test:llvm 的 worktree agent 都会遇到——可在 prompt 里提前提示先 build addon，或 orchestrator 预构建。
