# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-121 LLVM dict dispatch 双缺口

### 1. 实现形态 [通知]

两缺口均按 spec 修复（git `e0a9c61`）：
- **缺口 1**：`resolve_dispatch_dict` 新增 `trait_name_hint: Str?` 参数，extra_dicts 非空时调 `build_wrapped_dict`。gen_eq 传 `some("Eq")`，gen_ord 传 `some("Ord")`。
- **缺口 2**：`gen_dict_dispatch_call` 重构为 `let dict_ptr = match ...` 统一两分支，none 走 `resolve_static_dict_by_name`。消除了原 some/none 分支间的代码重复。

### 2. 测试覆盖 [通知]

两个回归用例均成功触发目标路径并通过 llvm_diff：
- `dict_dispatch_extra_dicts.ring`：泛型函数内 `Pair<T,Int>` 直接 `==` — 触发 Direct + extra_dicts
- `dict_dispatch_delegate_static.ring`：delegate Eq 到 struct field — 触发 dict_dispatch 的 named_values miss 路径

JS 831 / llvm_diff ×3 79/79。

## B-118 Unit emit null

### 1. 实现形态 [通知]

`gen_call` 两个路径（dict dispatch early return + 普通 callee match）在 `result_ty` 为 `UnitType` 时替换返回值为 `LLVMConstPointerNull`。新增 `is_unit_type` helper（仿 `is_str_type`/`is_bool_type` 格式）。codegen_llvm_stmt.ring 未改（stmt 层不产 Unit 值流入 RC sink 的场景）。JS 832 / llvm_diff ×3 80/80。

## B-117 LLVM 属性标注

### 1. 实现形态 [通知]

`apply_fn_attributes` 在 `forward_declare_fn_with_name`（`LLVMAddFunction` 后）调用：
- **nounwind**（function-level，attr_index=-1）：无 FailEffect 时标注
- **nonnull**（per-param，attr_index=idx+1）：非 Option 参数标注

新增 llvm_ffi.ring 声明（`LLVMGetEnumAttributeKindForName` / `LLVMCreateEnumAttribute` / `LLVMAddAttributeAtIndex` + `LLVMAttributeRef` 类型）和 llvm-addon N-API wrapper。extern fn 不标注。readnone/memory 类留后续。JS 832 / llvm_diff ×3 80/80。

### 2. llvm-addon 源码改动 [通知]

agent 修改了 `compiler/llvm-addon/llvm_addon.cpp` 添加两个 N-API wrapper。这是 gitignored 的本地构建目录中的源码——源码本身入 git，但 build 产出（.node）不入 git。其他机器需 `cd compiler/llvm-addon && npm run build` 重建 addon。
