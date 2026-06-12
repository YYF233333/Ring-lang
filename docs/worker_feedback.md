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

## B-104 D4 验收棒（5-probe 固化 + 自编译 re-measure，2026-06-12 worker）

- [通知] **5-probe 套件固化取舍（无计数器测试基建 → 差分用例 + 手跑读数）**：tests/ 无 alloc-stats harness（llvm_diff 只断言输出一致）→ 按棒规不新建框架，固化为 `tests/cases/llvm/dict_singleton_hotloop.ring`（A-E 五形态各 20K 热循环，llvm_diff 71→72 例；C 形态补缺——用户 impl Eq 静态 dict 此前无独立用例；A/D/E 已有非热循环形态用例，热循环版收于本例；动态 wrapped 由 WB1 的 `dynamic_wrapped_dict.ring` 覆盖不重复）。「live 不随迭代爬升」断言以手跑双点验证替代：n=20K → `allocs=600,048 live=24`；n=40K → `allocs=1,200,048 live=24`（live 与逐 typeid 字节级一致）；top 全常量 = tid3(STR)=12 / tid13(SB)=5 / tid7(CLOSURE)=4 / tid16(DICT_STATIC)=3。修前同迭代量 A/E 4box/次 + C 2box/次 + D 1 INT/次 ≈26 万 live 线性爬升 → **0 兑现**。probe C 原始观察中的 `&&` LHS phi BOOL box 为 And/Or 保守保留类（非 dict 成员、D4 范围外），固化用例 eq 取单字段保持 dict 类信号纯净；该类在 `dynamic_wrapped_dict` 计数器读数中可见（100 轮 → tid2=102），同时 **tid17(DICT_DYN)=0 live**（动态 dict 100 轮构造全回收实证）。
- [通知] **全量回归**：npm test **820** 全绿（819+1，新例进 verifier sweep）；llvm_diff **72/72 ×3** 全绿；ASan gating 档（User 级默认 env）`dict_singleton_hotloop` + `dynamic_wrapped_dict` + `real_program` 全部 exit 0 / 0 errors / 输出与 oracle 一致。
- [通知] **自编译 re-measure 读数表（ring_remeasure.exe = `f8d8891` dist-llvm + `-DRING_ALLOC_STATS -O2`，15GB RSS watchdog，两跑 @2.382B 计数器逐字段字节级一致 = 确定性维持）**：
  - **@2.382B 对齐点：live 220.1M（leak 9.2%）vs D2 后 333.7M（14.0%）/ Stage 3 基线 336.3M（14.1%）= −113.7M（−34.1%）**——#151 预测份额 28%~38%，实际兑现 34%，正中区间。
  - 逐 typeid @2.382B（D2 → 本次）：**CLOSURE(tid7) 63.4M → 退出 top-6（<4.13M，≥−93%）；TUPLE(tid10) 31.7M → 退出 top-6（<4.13M，≥−87%）；STR 85.0→57.5M（−27.5M ≈ dict 名字串份额）**；BOOL 67.1→71.4M / OPTION 61.1→64.2M / SB 11.0→11.9M——升幅主要为相位口径：churn 下降使同 alloc 点处于更晚编译相位，且本次 workload 比基线大（HEAD 源码含 dict_lower/verify_rc 新增，Type-intern plateau 值 4.04M→4.13M，+2.3%）。
  - **churn 双口径**：① 相位标记到达点——Type-intern plateau（tid169=4,131,865 恒定）@~168M allocs vs 基线（tid168=4,040,976）@268M → 前段 churn −~100M（−37%）；INT plateau（tid0≈3.900M，基线 3.805M@402M 起）@134M 即稳。② kill 点——基线 15GB @2.617B（88s）→ run1 @>3.355B（156s）/ run2 @>3.993B（152s）= **+28%~+53% allocs**（同为 15GB kill；RSS-alloc 映射受堆碎片/时序影响两跑浮动 ~20%，计数器轨迹本身完全确定）。基线 kill 点 @2.617B 在本次读数：live 234.0M（8.9%）。
  - **轨迹形态**：leak% 21.8%@33M → 谷 8.2%@704M → 相位间 8.5%~9.9% 波动 → 9.2%@2.38B → 9.0%@3.99B；**live 绝对值仍持续线性爬升**（220.1M@2.38B → 358.1M@3.99B，区间边际 ~8.6%）→ 无 plateau。**自编译未跑完**（out-dir 空，watchdog kill 护机）。RSS 线性 1.25GB@10s → 15.1GB@152~156s，sysfree 充足无 thrash。
  - tid16(DICT_STATIC)/tid17(DICT_DYN) 全程未进自编译 top-6（计数器仅报 top-6，自编译精确值不可见；probe 侧实证 tid16=3 / tid17=0，单例常量量级符合预期）。INT 3.90M / tid169 4.13M plateau 维持（精确-RC 标量修复在新规模继续成立）。
- [通知] **G-a 三门逐门判定**：① live plateau——**未达**（线性爬升仍在，累计 leak 斜率 14.0%→9.2%）；② peak << 25.9GB——**未达**（15GB 护机 kill，自然 peak 未见）；③ 自编译跑完——**未达**（kill 点比基线多走 28%~53%，终点未到）。#151 修复规模如预测兑现但非最后一堵墙：残余 ~9% 仍随 allocs 线性爬升，**下一个最大类 = BOOL 71.4M@2.38B**（#152 runtime HOF 谓词 box——filter/any/all/find 每元素泄 1 BOOL，编译器重度使用——+ And/Or phi 保守保留类双嫌疑），其后 OPTION 64.2M（待归因）/ STR 残余 57.5M（#152 for_each 合成 key 嫌疑 + 待归因）/ SB 11.9M（前棒 [观察] 维持）/ tid103 用户结构 5.4M（新进 top-6 可见类）。
- [通知] **capstone 待安排**：全强度 ASan 自编译（`quarantine_size_mb=256:malloc_context_size=12`）本棒未跑——用户不在场，thrash 风险需人盯（CLAUDE.md：CPU 掉零 + 磁盘狂转即杀）。D4 milestone capstone 待用户回来安排。
