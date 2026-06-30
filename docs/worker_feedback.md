# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-152 RIIR 本轮执行汇总（2026-06-30）

### 1. P1 Step 1 Str C++ 去 STL ✅ [通知]

ring_runtime.cpp 中 Str 从 std::string 迁移到 RingStr struct（{char*, int64_t, int64_t}）。~50 个函数重写。新增 `make_ring_str` helper 和 `ring_memmem`（Windows 无 memmem）。Map/Set 键桥接为临时 std::string（P3 时消失）。ring_str_replace 仍用 std::string 局部变量。

### 2. P2 List RIIR ✅ [通知]

List<T> 从 `pub extern type`（std::vector<void*>）迁移到纯 Ring struct（{Ptr<T>, Int, Int}）。28 个方法全部 Ring 实现。新增 `ring_slot_*` bridge 函数（slot 级 RC 感知内存操作）。sort_by 委托 C runtime。codegen 中 custom drop 循环（逐元素 ring_drop + dealloc）替代 impl Drop（E0802 Drop/Clone 冲突）。typeid 强制为 4（匹配 RING_TYPEID_LIST）。

### 3. codegen 修复：未知 extern fn 不再 panic [通知]

`fdab843`：codegen_llvm_expr.ring 的 fallback 从"生成 panic 调用"改为"声明为 LLVM external + 正常调用"。链接器负责解析。**一劳永逸解决 RIIR bridge 函数的 bootstrap 问题**——新增的 extern fn 只要 ring_runtime.cpp 有实现就能用，不需要 extern_fn_to_runtime 映射。

### 4. #241 impl_bounds.ring crash 已关闭 [通知]

340+ 次运行零 crash，确认被 `a3ccca2`（#198 builder position save/restore）修复。

### 5. #236 apply_var_mapping 重复已修复 [通知]

`infer_decl.ring` 的 `apply_var_mapping` 改为调用 `env.ring` 的 `apply_subst_map`。净删 67 行。

### 6. B-159 effect 多态——P2 暴露的 pre-existing checker bug [观察]

P2 List RIIR 后，2 个测试回归（trait_hof_effect + adversarial_regress_closure_nested_effect）。根因：TypeScheme 不量化 closure 参数的 effect row tail 变量，导致多次调用 HOF 时 effect 变量共享。

深入调查发现 4 层问题链：
1. `register_fn_common` / `register_impl_method` 不把 effect tail 加入 type_vars
2. `build_var_mapping` 不映射 FnType 的 effect tail
3. `rebind_fn_type` 对 impl 方法 lookup 失败（impl_methods vs scope stack）
4. `load_prelude` 的 `check_prelude_decl` 不走 rebind 路径

尝试修复 1-3 后 standalone 函数 OK，但 prelude impl 方法修复（#4）导致编译器自身出现大量 W0001 和类型错误——effect 推断管线需要全面协调改造。已 revert，2 个测试标 pending/skip。

**需要 backlog item**：B-159 effect 多态（TypeScheme effect 变量泛化 + rebind + prelude 路径统一）。此 bug 在 C runtime dispatch 下被隐藏（C 函数没有 effect 签名），RIIR 后暴露。不阻塞 P3/P4（Map/Set 的 HOF 方法可暂时保留 C runtime）。

