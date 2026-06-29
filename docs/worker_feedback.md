# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-152 P1 Step 1 worker feedback（2026-06-30）

### 1. Step 1 完成总结 [通知]

ring_runtime.cpp Str 从 std::string 迁移到 RingStr struct（{char*, int64_t, int64_t}）。约 50 个函数重写（含 33 个 ring_str_* + ring_int_to_str/float_to_str/bool_to_str + IO/Map/Set 桥接）。新增 `make_ring_str` helper 和 `ring_memmem`（Windows 无 memmem）。验证：E2E 395/0/22、llvm_diff 210/1（pre-existing #218）×4 runs、RC 527/0、self-compile pass（consistency 差异 = B-155）。

### 2. dist-llvm/main.o 非确定性 [通知]

worktree agent 做 self-compile 时重生成了 dist-llvm/main.o（SHA256 不同）。已在 merge 时还原 main 分支的 .o，因为 Step 1 没有改 Ring 源码。B-155 IR 非确定性仍然存在。

### 3. Map/Set 桥接 = 临时方案 [通知]

Map/Set 内部仍用 std::unordered_map<std::string, void*>。Step 1 在每个 Map/Set 函数入口把 RingStr 转为临时 std::string（`std::string ks(k->buf, k->len)`），有拷贝开销。P3（Map RIIR）时这些桥接自然消失。

### 4. ring_str_replace 仍用 std::string 局部变量 [通知]

ring_str_replace 的查找替换逻辑用了 std::string 临时变量做中间操作，最后 make_ring_str 返回。不影响正确性，P1 Step 2 迁移到 Ring 后消失。

### 5. Step 2 前置发现：Str 是内建类型，不是 extern type [决策]

**现状**：Str 在编译器中是 `Type::StrType`（types.ring L34），与 Int/Bool/Float 同级的内建类型枚举变体。**不是** `pub extern type Str`。`resolve_named_type("Str")`（infer_ctx.ring L1134）直接短路返回 `Type::StrType`，**跳过 structs map 查找**。即使添加 `pub struct Str { ... }` 到 std/str.ring，StructDef 会被注册但永远不会被类型解析使用（orphaned）。

**关键差异**：
- **StringBuilder/List/Map/Set** = `pub extern type`，走 structs map → `Type::StructType { name: "..." }`，P0 改为 struct 只需翻 `is_extern` 标志
- **Str/Int/Bool/Float** = Type 枚举变体，有 resolve_named_type 短路，codegen 26 处特殊分支（13 个文件）

**影响**：P2-P4（List/Map/Set RIIR）不受此问题影响，可照搬 P0 模式。Str Step 2 需要额外的编译器工程。

**待决策**：
- (A) **真 struct 化**：去掉 resolve_named_type 的 Str 短路，改 26 处 `Type::StrType` 引用为 `Type::StructType { name: "Str" }`，让 Str 走正常 struct 路径。彻底但工程量大（改编译器类型系统 + codegen + perceus + 全量 bootstrap）。
- (B) **保留 StrType + struct 布局**：保持 `Type::StrType` 枚举变体，但教 codegen 为 StrType 生成 struct 布局代码（field GEPs + struct construction 用 RING_TYPEID_STR）。类型系统不动，只改 codegen。中等工程量。
- (C) **跳过 Str Step 2，先做 P2 List**：Step 1 已消除 std::string 依赖（Str RIIR 的 80%），List 是 `pub extern type`，可以直接照搬 P0 模式做 RIIR。积累经验后再回来做 Str struct 化。最安全。
- (D) **桥接方案**：保持 Str 为内建类型，方法实现移到 Ring（通过 field accessor bridge 函数），codegen 不改。收益有限，增加间接层。

