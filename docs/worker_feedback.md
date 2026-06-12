# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

（上一批：B-104 D1 Stage 3 收尾组，2026-06-12 Discussion 处理完毕——4 条 [通知] 已落账确认删除（#150 修复 = git `0f80b42`/`735a669` + audit 墓碑；map/set fold 核实 = #138 精化；HOF 泄漏类 = audit #152 [open]；退役方式 = git）；[观察] dist-llvm 970 warning 已转 B-099 条目既有现象备忘。）

## B-104 D4（dict evidence HIR 一等化，2026-06-12 worker）

- [决策] **LLVM Eq/Ord BinOp dispatch 忽略 `extra_dicts`（既有功能缺口，#151 之外，本棒未修）**：`resolve_dispatch_dict`（codegen_llvm_expr.ring）对 `TraitDispatch::Direct` 只取 base dict、丢弃 `extra_dicts`，而 JS 后端把 extra 作尾参传入。后果：参数化类型值**直接用 `==`/`<`**（非经泛型 fn 中转，如两个 `Pair<T,Int>` 值在泛型上下文里直接比较）时，LLVM 用未绑 inner 的 base dict 派发 → 行为错误方向（非泄漏）。现无测试命中（llvm_diff 全绿）。修复方向：BinOp dispatch 路径对带 extra 的 Direct 改走 wrapped-dict 构造（与 call 路径同机制，D4 后基建现成）。是否立项请拍板。dict_lower 已对此位置做静态实例化（JS 受益），动态残留按原样保留。
- [决策] **`gen_dict_dispatch_call` named_values miss → ConstPointerNull（delegate 静态 dict 路径，疑似 #93/#123 族实证，本棒未修）**：delegate 展开合成的 `dict_dispatch.dict_param` 是静态 dict 名（非参数），LLVM 在 named_values 查不到时直接返回 null → 后续 slot load 即崩。建议 fallback `resolve_static_dict_by_name`（一行，D4 后顺手）；属 pre-existing，按「决策必须讨论」未动。
- [通知] **HIR 节点形态（spec 留给 worker 定）**：`DictRef::Static(name)`（模块级单例借用引用）+ `HExpr::DictConstruct{base_dict, trait_name, inner: List<DictRef>}`（动态 wrapped 局部构造，叶子节点——inner 是 DictRef 非子表达式）+ `HDictDef{name, base_dict, trait_name, inner}` / `HProgram.static_dicts`。关键取舍：**分类在 infer 产生点定型**（`trait_dict_name` 创建点 → Static，`trait_bound_param_name` → Simple），彻底避免名字前缀猜测；动态 wrapped 由新 pass `dict_lower.ring`（checker 末端，两后端共用）lower 成 `Block{let __ring_dictlocal_N = DictConstruct; tail: call}`——binding 走 D1 普通 scope-end drop + D2 普通记账，**零新增豁免类**。
- [通知] **eager vs lazy（spec 留给 worker 定）= lazy first-use memoised getter**（`@__ring_dictg_<name>` 全局 + null-check shell，`ring_dict_init_<name>` 统一入口；impl dict 原 init fn 拆为 `ring_dict_build_*` + memo 壳）。理由：① 无模块 init 基建可挂（eager 还需 topo 排序 instance 依赖）；② instance inner 经各自 getter 递归解析，顺序自动正确；③ 未用到的 dict 不构造。代价 = 每次使用一个 load+branch，相对修前整套 dict 构造可忽略。
- [通知] **dict 布局统一改 count-prefix `{i64 method_count, slots...}`**（同 CLOSURE_ENV 模式），typeid 16 DICT_STATIC（runtime 注册 never-drop——spec 第 7 点纵深）+ 17 DICT_DYN（`drop_dict` 走 count 释放 method closures）。改动面 = 6 个 GEP 站点 + runtime `ring_make_eq/ord_dict`。布局必须统一：dispatch 是类型盲的（dict 参数可能收到静态或动态 dict）。
- [通知] **RC 诚实化（超 spec 字面但必要）**：`build_wrapped_dict` method-thunk env 与 `gen_dict_closure_wrapper` env 的 dict slots 从 count=0 raw 改为 **count+dup**。原因：动态 dict 引入 scope-end drop 后，这两条 codegen 级 raw 存储是修前「leak-immortal」掩盖的潜在悬垂边（lambda 捕获路径 B-098 本就 dup ✓ 无需动）；never-drop 单例让 dup/drop 对静态 dict 零成本，动态 dict 则获得正确的引用寿命。evidence slots 保持 count 窗口外（B-096 posture 不变）。
- [通知] **Neq 中间 box drop 一并收**：spec 第 8 点只点了 `gen_ord_dispatch_llvm` 的 cmp INT box；`gen_eq_dispatch_llvm` 的 Neq 路径对 eq Bool box unbox 后重 box，同族同模式的内部泄漏，一并补 drop。
- [通知] **smoke 读数（修复方向兑现）**：#151 probe A（泛型 Eq）+ D（泛型 Ord）+ 单态 contains，300K 次派发 native + `-DRING_ALLOC_STATS`：`allocs=1,700,023 frees=1,700,010 live=13 (0.0% leak)`，top = tid3(STR)=5 / tid7(CLOSURE)=5 / tid16(DICT_STATIC)=3——全部为单例常量。修前同形态每次泄 4-5 box（300K 次 ≈1.3M live 线性爬升）。完整 5-probe 套件与自编译 re-measure 归下一棒。
- [通知] **残留（非本棒 scope，备查）**：① `Ident.dict_closure_dicts`（`List<Str>`）与 derive `FieldAction.extra_dicts`（`List<Str>`）仍是名字引用未一等化——LLVM 侧经 memoised 链已单例化（泄漏已消），仅 HIR 形态欠整齐；② backlog #150 条目记「自校验 1292→1289 exempt」，但 base `252b08a` 实测 = 1292（本棒前后均 1292，零变化）——账面数字与实测不符，请核对；③ dist-llvm rebuild 的 `unknown function 'LLVM*'` warning ~970→~1020 条（新增 getter/global 调用点，B-099 既有现象的自然增长）。
