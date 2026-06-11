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

## B-103 Wave A（2026-06-11，主仓直做）

### [通知] 分类结论：ring_runtime.cpp 全函数 return-mode 分类完成（表落 perceus.ring）

全量逐函数读 body 分类 ~170 个 extern "C" 函数（证据 = 是否 alloc/dup 后返回），完整表写入 `perceus.ring` `is_borrow_returning_call` 上方注释（D1 决策地基）。统计：
- **BORROW**：Option 投影 4（unwrap/unwrap_or/unwrap_or_else/to_fail，已列）+ 元素直读 3（ring_list_get/map_get/map_int_get，HIR 形态 = IndexExpr / tuple-FieldAccess，由 is_owner_bearing 既有 arm 覆盖，验证无遗漏）+ **receiver-returning mutators**（list_push/list_set/map_set/map_int_set/map_delete/map_int_delete/set_add/set_int_add/set_delete/set_int_delete/list_clear/map_clear/map_int_clear/set_clear/set_int_clear/list_extend/sb_add/sb_line/sb_add_int——19 个 runtime 函数，折合 **9 个新增 HIR 字段名**）+ ring_catch_get_error（codegen-internal，HIR 不可见）。
- **FRESH ~95**（str 全家 / Option 构造 / 容器构造 / 装箱 / dict shims）、**SCALAR ~40**（len/eq/has/unbox 族）、**NULL/NEVER ~15**（print/for_each 族 + panic/exit/raise）。
- **新增 borrow 叶子 = 9 个字段名**：`push/set/insert/remove/add/clear/extend/line/add_int`（receiver-returning：runtime `return <receiver>;` 原样返回 arg0 无 dup；Ring 类型虽为 Unit，LLVM ABI 上结果 = 活容器指针，`let r = xs.push(v)` 在 is_droppable_init(Call)=true 下 scope-end drop 即 UAF——**pre-fix 实证**：旧 dist 编 mutator_result_binding.ring，bind_push 返回后 `a.len()` 读到 -1834016752692910 垃圾值）。
- **is_arg_returning_call 审计结论：`fold` 仍是唯一成员**。其余 arg-verbatim 返回者要么 ∈ borrow 列表（Clone-wrap 平衡 materialised arg 的 drop，unwrap_or 先例）、要么是 receiver（在 FieldAccess callee 内、anf 不 materialise）。Ring 函数永不入列（clone-all-escape 恒返 owned，B-103 定理）。
- **runtime dup-on-share 补全 9 处（UAF 方向，B-103 PRE-CONDITION 注释明示的同一完整性契约）**：ring_list_filter/concat/slice/reverse/sort/sort_default（拷源元素指针不 dup → 结果+源双 deep-drop 同一批元素，旧泄漏 régime 下源永不 drop 才没引爆）+ ring_map_from/map_int_from（value 同）+ ring_list_flat_map（偷 sub-list 元素所有权、漏 sub header；closure 返回既有 list 的 Clone 时 = UAF。改 dup 元素 + drop sub，双 case 平衡）。

### [观察] str[i]（ring_str_get）实为 FRESH 但走 IndexExpr borrow arm → 多一份 Clone（leak-side）

ring_str_get 对 `s[i]` **新 alloc 1 字符串**（fresh），但 is_owner_bearing 的 IndexExpr arm 把所有索引读当 borrow → 逃逸时 Clone（+1 永不释放）。方向纪律下不解除（解除属 leak 回收 = D1 范围）；D1 可按 receiver 类型精化 IndexExpr 分类（Str → fresh，List/Map → borrow）。

### [观察] 留给 D1 的 leak-side 清单（本任务方向纪律内不动）

1. **overwrite/remove 泄漏类（runtime 侧）**：list_set/map_set/map_int_set 覆写旧值不 drop；map_delete/map_int_delete 移除值不 drop；list_clear/map_clear/map_int_clear 清空不 drop 元素；map_from 重复 key 覆写泄一份 dup。全部 crash-free leak。
2. **sink_arg_indices 的 "add"**：Set.add / SB.add 的 runtime 是**拷值**（std::string/int64 内联），arg 并非真 sink → escape-Clone 多 dup 一次（leak-side 保守）。
3. **Unit-typed mutator 在 fn-tail/return 位**：新 borrow 分类使 `fn f(xs) { xs.push(v) }` 的尾位结果被 Clone（容器 rc+1 被 pin，bounded，crash-free）。**建议 D1 引入类型级规则「UnitType 值不 Clone / 不 Drop / 不计 owned」**取代（并叠加于）名字粒度——checker 已证明 Unit 无值语义，JS 后端返回 undefined，LLVM 的 receiver-return 是 ABI 偶然。该规则同时消掉本条 + 名字误伤（用户 `.add()` 返回真值的方法被 Clone 泄一份）。
4. **ring_list_sort（comparator 版）当前 codegen 不可达**（仅 sort_default 被映射），dup 修复为防御性一致。

### [决策] llvm_ffi extern handle 需要类型级 RC 排除（D1 硬前置，audit #139）

59 个 LLVM-C extern fn 返回**非 ring_alloc 的裸外来指针**——既非 fresh 也非 borrow，必须完全排除于 dup/drop/Clone。现状：perceus 按普通 Call/Ident 处理 → 编译器自身以 `--target=llvm` 编译时，codegen_llvm 模块里的 `let x = LLVMCreateBuilder()` 会被 scope-end drop（读垃圾 header）、`LlvmCtx { builder: builder }` 字段逃逸会 ring_dup 写坏 LLVM 堆。**当前 dormant**（这些函数只在 native 编译器跑 --target=llvm 时执行 = B-099 范围，js-target 自编译不触发，故本波 ASan 全绿不矛盾）；但 **D1 total drop pass 会系统性 drop arg/subexpr 位的 extern call 结果 → 引爆**。提议：在 D1 内做**类型级排除**（HIR Type::ExternType → 不 Clone/不 Drop/不入 owned/不 materialise），而非 59 名字白名单。需拍板机制归属（D1 内置 vs 单列 backlog item）。

### [通知] double-bootstrap 按「产出文件集」比对全字节一致；compiler/dist/llvm_ffi.js 是陈年遗留

fresh bootstrap 产出 40 个 .js 与 dist 全字节一致。但 git 里的 `compiler/dist/llvm_ffi.js` 是 `7fee652`（Wave 2a）时代遗留——extern-only 模块现今构建**不再产出** JS 文件，该文件从未被后续 build 覆盖（内容是古老运行时 shim）。属 dead weight，建议删除（未动：零无关重构纪律）。

### [通知] 验证汇总（ASan 自编译按用户指示中止）

JS e2e 735/735（新增 rc_mutator_share_ops）；llvm_diff 55×3 全绿（新增 mutator_result_binding + list_share_ops_rc，前者有 pre-fix 失败实证）；double-bootstrap 字节一致（40 产出文件）；ASan real_program ×3 build EXIT 0 + 输出逐字节对 + 0 ASan 报错；native harness（test:native）3/3。**ASan 自编译（步骤 6）**：跑了 ~40 分钟（RSS 缓慢爬至 ~8.6GB，远慢于历史非 ASan 速率），**全程 stderr 零 ASan 报告**（ASan 检出即流式输出，空 log = 观察窗口内零 over-free/UAF），未跑完即按用户指示（「自编译太慢了，跳过」）中止、未达 15GB kill 线。完整门留给 B-104 D1 的 native re-measure（彼时无 ASan 的 alloc-stats 自编译本来就是必跑项）。
