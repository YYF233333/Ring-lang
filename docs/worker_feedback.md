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

## B-163 step 5（closure / trait dict / evidence passing，2026-07-11）

- `[通知]` **§2.5 #1 调查结论：trait-bounded impl dict 转发 bug 在 HEAD 无法复现——两后端、五类场景全绿**。构造了两个 probe：① `impl<K: MyKey + Eq> Bucket` 覆盖调用位 dict 解析 / 方法内 bound dispatch（`key.keyhash()`）/ impl 方法互调转发（`self.total_hash()`、`self.contains()`）/ HOF closure 捕获 dict param（`fold`/`any` 内 `k.keyhash()`、`k == key`）/ 单参数双 bounds；② Map 真实形状 Ring 路径（`map_get_panic` → `map_probe_index` → `key.hash()` + slot 桥，Str key 与 Int key）——LLVM/C 输出全一致且正确。**定位结论：共享层（infer resolve_dicts_from_scheme / dict_lower）无缺陷；codegen_llvm 现行版本该路径也正确**。P3（7/1）当时的 double bootstrap 崩溃疑似已被后续修复序列消除，或需自编译规模才能触发。建议后续波做闭环实验：C 后端删 Map 的 method_to_runtime 条目 + 全量 sweep（self-compile via C 在 step 9 才可行），全绿则删 C++ ring_map_* bootstrap shim，关掉 P3 遗留验收。audit #93/#123 在现行 audit-report.md 已无对应条目（已清理），delegate 路径 golden 用例（非 effect 类 delegate_*）本轮 C sweep 全过，未见同根残留。
- `[通知]` **LLVM 侧 derived clone 签名/调用契约不一致（本轮在 C 侧暴露，LLVM 未修）**：checker（derive.ring `register_derived_impl`）给 derived clone 注册的 scheme 带 `[T: Clone]` bounds → 调用位按 scheme 传 dict 参数；但 LLVM `emit_clone_fn` 用 empty_bounds 生成**单参**函数——调用位对单参函数多传 1 个 dict 参数，LLVM-C 不校验、x64 下静默无害（plan §0.1"类型系统真空"的实例；clang 把它变成硬错误：`adversarial_regress_debug_option_field` C 编译失败）。C 侧修复 = clone 签名与 scheme 对齐（接收 dict 参数，body 忽略——clone 是 shallow `ring_dup`）。LLVM 侧不动（超出 #243 授权），Phase 2 随后端退役消失；若在此之前动 LLVM derived 区，建议同步改 `emit_clone_fn` 传 `di.bounds`。
- `[通知]` **trait_method_order 单一来源方案（§2.5 #2）**：`hir.ring` 新增 `scan_trait_method_order`（含 Eq/Clone/Ord/Debug/Hash 内建 seed）+ `collect_all_supertraits`（DFS 序 = default method supertrait dict 参数序，跨阶段契约）。C 后端从 hir 层消费；**LLVM 侧私有 `scan_trait_decls` / `collect_all_supertraits_llvm` 副本未切换**（避免触碰 LLVM 重编敏感面，逻辑逐字一致），Phase 2 随后端退役删除。此前若新增内建 trait，需在 hir.ring seed 一处 + LLVM 副本同步。
- `[通知]` **closure ABI C 渲染取舍**：统一 `{fn_ptr, env}` 对（typeid 7）+ `{i64 count, slots...}` env（typeid 15），布局与 LLVM/runtime 一致。调用位渲染为函数指针 cast 调用：`((void*(*)(void*,...))((void**)clo)[0])(env, args...)`——cast 形参数由调用位决定，与 LLVM call-site fn_ty 构造同构；dict method thunk 全参转发（含 evidence 槽）、dispatch 只传用户参数的 LLVM 既有行为照搬（多/少参在 x64 调用约定下与 LLVM 等价——此为 LLVM 侧已知残留形态，未 faithful 修复也未恶化）。裸函数值（零 dict）统一包 thunk closure（LLVM `gen_ident` FnType fallback parity）——steps 1-3 的裸函数指针临时路径已移除。
- `[通知]` **impl trait dict build fn 预注册（对 LLVM lazy 链的一处有意偏离）**：LLVM `resolve_static_dict_by_name` 是 lazy 的——若某 dispatch 位在 decl 顺序上先于其 `impl` 块，getter 先以 runtime builtin fallback 形态创建，之后 `emit_trait_dict` 的 memoised getter 注册发现同名已存在直接 return existing，**手写 dict 的 build fn 成为死代码、dispatch 走 tag-only fallback**（decl-order 敏感缺陷，实践少触发）。C 侧在 forward pass 预注册全部 impl trait dict 的 build fn（`CCtx.dict_build_fns`），getter 内容由注册表决定、与 decl 顺序无关。derived dict 按 LLVM 同序（body pass 前）emit，手写 impl 优先（预注册即占位）。
- `[观察]` 范围外发现：`ring.exe build --target=llvm --out-dir=<dir>` 不遵守 out-dir（.o 落源文件旁），C 后端遵守——双后端 CLI 行为不对称（本轮手动 Move-Item 绕过）。未动，建议立 audit 条目。

---
