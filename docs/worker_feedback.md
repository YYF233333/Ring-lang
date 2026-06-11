# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-104 D1 Stage 1（内置规则①②，2026-06-11）

- `[通知]` **规则① 名称对应实证**：`HDecl::ExternType` 的名与 `Type::StructType.name` 在两种形态下严格一致——file-level decl 是裸名（`LLVMContextRef`）；inline `mod` 内 decl 经 `check_mod_decl` 先 `prefix_decl_name` 再 `check_decl`，HIR decl 名与注册名同为 `${mod}::${name}`。perceus 按模块运行（compiler_mod.ring 逐模块 `perceus_transform`），而 codegen_llvm_* 各模块均本地重声明 extern types（规避 cross-module ESM import 问题的既有惯例）→ 模块内收集 `HDecl::ExternType` 即覆盖全部使用点。**已知缺口（crash 方向）**：若未来某模块通过 `use` 导入 extern type 而不本地重声明，其值不会被排除（漏 dup/drop 外来指针）。今日代码库不存在该形态；出现时需把 extern 名集合从 checker 导出（如挂 HProgram）。已在 hir.ring 帮助函数注释中记录。
- `[通知]` **规则① 容器形态枚举（grep 实证）与覆盖机制**：实存形态 = 直接值、struct 字段（LlvmCtx ×22 个含 handle 字段 / StructFieldInfo.llvm_type / EnumTypeInfo.llvm_type）、`Map<Str, LLVM*Ref>`（named_values/functions/fn_types/rt_fns/rt_fn_types/dict_globals）、Option（current_fn/loop_break_bb/loop_continue_bb + 局部 `recv_val: LLVMValueRef?`）、`List<LLVM*Ref>`（局部绑定 + extern fn 参数）、嵌套用户 struct（struct_types: Map<Str,StructFieldInfo>）。**无** tuple / 用户 enum payload 形态。覆盖分两层：**直接 extern 类型**→不 Clone/不 Drop/不 owned/不 materialise（ring_dup 会写外来内存）；**transitively-contains**（`type_contains_extern_handle`，struct 字段/enum variants/type_params/tuple/record 递归 + on-stack visited set 防递归类型死循环）→不 Drop/不 materialise，但**保留浅 Clone**（容器自身有真 RC header，dup 安全；深 drop 才会触及外来指针）。drop_T 生成对 contains-extern 字段整体跳过（容器结构 leak by design——handle 生命周期归 foreign API，如 LLVMContextDispose）。IR 实证：`ring_drop_LlvmCtx` 只 drop 16 个干净字段、跳过全部 22 个含 handle 字段；`get_or_declare_runtime_fn` 中 handle 进 map insert 不再 ring_dup、`fn_ty`/`fn_val` 绑定不 drop，而材料化的 boxed-int `__anf` 临时仍正常 drop。
- `[通知]` **规则② 9 个 mutator 名处置 = 全部删除**：13 个 std 声明逐个核验均 `-> Unit`（List.push/extend/clear/set@std/list.ring:18,21,27,29、Map.insert/remove/clear@std/map.ring:38-40、Set.insert/remove/clear@std/set.ring:35-37、SB.add/line/add_int@std/str.ring:29-31）。无一例外 → `is_borrow_returning_call` 收缩回 4 个 Option 投影（unwrap/to_fail/unwrap_or/unwrap_or_else）。分类表注释保留 ABI 证据（`return receiver;`）并记录机制变更。既有 `mutator_result_binding.ring` llvm_diff 用例继续锁定该 UAF 面（断言不变，header 更新）。
- `[通知]` **规则② 残留理论洞（已接受，未拍板不动）**：Unit 值流入 RC sink（病态形态如 `[xs.push(v)]` 构造 `List<Unit>`）会把 receiver 裸指针 un-dup'd 存入容器，容器 drop 时 free 活容器。真实代码不出现（把 mutator 结果存进容器无意义）。原则性修法 = LLVM codegen 对 Unit 类型值统一 emit null（消除 receiver-return ABI 偶然），属独立 codegen 改进，留待拍板。
- `[通知]` **llvm_ffi.ring 不在编译器 module graph 内**：全仓无任何 `use llvm_ffi`——生效的 extern 声明分布在 5 个 codegen_llvm_* 模块的本地重声明里，llvm_ffi.ring 现为参考文档性质。规则①因此按模块收集（而非锚定 llvm_ffi.ring），天然覆盖任意来源的 extern type decl。
- `[通知]` **测试覆盖方式**：规则① probe 进 llvm_diff（`extern_handle_rc_exclusion.ring`：handle 的 let 绑定/struct 字段 escape/Option payload/List 元素/字段读 escape 全部编译期过 perceus+codegen，runtime 只证双后端一致——handle 无法凭空造值，helper 不被调用）；RC 级断言靠 ring_output.ll 人工核验（本条目+commit message 记录证据）。IR 文本自动断言未挂 harness——llvm_diff 是行为差分框架，编译期静态保证本就是 D2 verifier 的职责，不在 Stage 1 造一次性 IR-grep 测试类型。
- `[通知]` **#139 标 [resolved] 未删除**：dormant bug 的修复验证 = IR 核验 + dist-llvm 自编译通过；真正 runtime 验证依赖 B-099（native 编译器自跑 --target=llvm）。条目保留供复核后删除。
- `[观察]` **extern handle 闭包捕获路径未覆盖（零实存站点）**：gen_lambda 对捕获一律构造时 ring_dup——若 lambda 捕获 handle 会写外来内存。grep 实证 codegen_llvm_* 五模块**零闭包使用**（无 .map/.filter/.fold/lambda），纯理论路径；归 D1 Stage 2 / B-099 范围。
- `[观察]` **跨模块裸名 nominal 碰撞（pre-existing 形态，未单独防护）**：`is_extern_handle_type` 按 `Type::StructType.name` 匹配；若另一模块存在与某 extern type 同裸名的用户 struct 且其值流入声明该 extern type 的模块，会被误排除（漏 dup/drop → 潜在 double-free）。与既有「跨模块 nominal 类型按名 unify」语义同级（types_equal 本就按名），现实概率≈0（LLVM*Ref 命名空间独占）。
- `[通知]` **实现形态**：externs 以参数线程穿 perceus 两个 pass（沿用 boxed_vars 的既有线程惯例，~30 个签名）；共享判定放 hir.ring（`collect_extern_type_names`/`is_extern_handle_type`/`is_rc_excluded_type`/`type_contains_extern_handle`），perceus 与 codegen_llvm 共用。`type_contains_extern_handle` 对空 extern 集 O(1) 短路——非 LLVM-codegen 模块零开销。Stage 2 total pass 若线程参数继续膨胀，建议届时引入 RcCtx 捆绑（与 audit #20 hir-visitor 评估一并考虑）。
