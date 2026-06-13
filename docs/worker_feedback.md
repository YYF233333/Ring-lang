# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-104 D9 棒（门① 收尾，2026-06-13）

### [通知] Part 2 ✅ `Type::UnitType` / enum-const 单例化 done（git `70db1ef`）

D6 同构落地：runtime `RING_TYPEID_CONST_HEAP_STATIC=20` + `ring_unit_intern`（D6 `ring_const_intern` 兄弟，header-only retag + ALLOC_STATS/BOX_PROFILE 计数迁类，never-drop 注册）；`emit_const_body` 按**值类型**（`is_enum_const_type`，非 init shape）走 D6 memoised 单例 getter。**关键发现**：无字段 variant（`Type::UnitType`/`Color::Red`）经 `bind_mono` 解析成 `Ident` 而非 `NamedVariantConstruct`，首版 shape-based 谓词静默 no-match，被 probe 首跑（tid68=100000、无 tid20）抓出，改值类型 keyed。HIR/perceus/verify_rc 零改（D6 预测成立）。re-measure（仪表自编译到 ~10.38B）：**Type 22.7M→~0.3M（−22.4M，超 "Type→~0" 目标、退出 top-6）、总 live 185.2M→162.3M（leak 1.8%→1.6%，−12.3%）**。验证：probe `unit_const_singleton_hotloop.ring`（tid20 跨 n=20K/40K 恒=1、双点字节一致）/ JS 827 / llvm_diff ×3 76/76 / verifier 0 errors **892 exempt 零新增** / ASan gating clean / double-bootstrap 字节一致。

### [决策] Part 1（interp/join SB 收口）升级——**discussion 前提被实测推翻**，请重新拍

**现状**：`gen_string_interp`（codegen_llvm_expr.ring:2443）是纯 codegen 合成——`ring_sb_new()`→逐 part `ring_sb_add`→`ring_sb_to_str`。SB(tid13) + 逐 part 中间 string（字面量 part→`ring_str_from_cstr`、非 Str 表达式 part→`convert_to_str`/`ring_int_to_str` 等）是 **codegen 内部 SSA 值、从不进 HIR**，故 D1 ANF 永不材料化、永不 drop（只最终 `ring_sb_to_str` 结果是 HExpr、D1 覆盖）。`ring_sb_add` 拷贝但不消费其 string 实参（runtime 核实）。micro-probe（2 interp 循环 n=20K）：41.2% leak，SB 100% leak（2/iter）+ 逐 part string leak，定量坐实。

**推翻 discussion 前提（关键，orchestrator 已核实）**：D9 spec 把 codegen-drop 列为兜底、理由「留 verifier 豁免类、违 D4 豁免类永存」。**此前提对 interp 不成立**——verifier 是 **HIR 级**检查器；interp SB/中间 string 是 codegen 合成、**从不进 HIR** → verifier 根本不记账它们 → codegen 里 drop 它们 **零新增豁免类**。这是 **codegen-level boundary drop**，与 `verify_rc.ring` 头注（行 65-73）**已接受并文档化的 3 个先例同类**：while-cond Bool box drop / Set-iteration list drop / range-loop bound box drop——全是 codegen 发射的、对 codegen 合成临时的 drop，无一计入豁免（x-*）账（orchestrator 已读头注核实）。故 codegen-drop 在此是**原则性 garbage-free 修法、非 band-aid**。

**选项**：
- **(A) gen_string_interp codegen-drop（subagent + orchestrator 共同推荐）**：`ring_sb_to_str` 后 `ring_drop(sb)` + drop 每个 codegen 合成中间 string（(i) 字面量 part from_cstr 结果、(ii) 非 Str 表达式 part convert_to_str 结果）。**绝不 drop Str 类型表达式 part 值**（那是 HExpr 自身、D1 管理，double-drop=UAF；convert_to_str 对 Str 是 pass-through）。加一条 verify_rc 头注 boundary 行（仿 while-cond），**零豁免类**。闭 SB-47M + STR-head。~30 行局部改 + JS 后端不动（JS 用 template literal、GC、本就零泄漏）。
- **(B) HIR-first**：否决——强制 JS 后端弃 template literal（违 CLAUDE.md「生成 JS 可读」）、blast radius 大、LLVM 侧零额外收益。
- **(C) 留着 + 靠门① refined 判据**：但 SB 是真 per-iteration 孤儿（100% live==born），C 留真孤儿类、违 refined 判据「孤儿类→~0」。否决。

**为何 subagent 停而不做**：spec 明令兜底走 [决策] 升级；且零豁免发现 reframe 了 spec 前提，该 reframe 涉门① 最终判据，应你拍。若拍 (A)：自包含后续棒——实现→probe（interp 热循环 SB-flat）→JS+llvm_diff×3+ASan+double-bootstrap→re-measure（SB 47M→~0、STR-head 消）+ 门① refined 判据 re-verify + G-a 三门收尾。

### [观察] probe 期撞出一个可能独立的 RC gap（非 D9 范围，待 triage）

probe-E `let c = Color::Blue{shade}` 在循环里 matched-then-discarded，每轮泄 `tid68=n`——**fresh payload-enum 局部**（非 const，与 Part 2 无关）matched 时只投影标量、未 scope-end-drop。subagent 已改写 probe 避开以隔离 const 类。可能是独立 RC 漏点、值得后看，flag triage（是否转 audit-report 由你/discussion 定）。

（上一批：B-104 D8 门① 归因测量组，2026-06-13 Discussion 处理完毕——fork 拍定 = D9 收口 + 门① 判据 refine，spec 落 design.md §7.11「门① 收尾」+ backlog B-104 D9 块。更早 D6/D7 组 2026-06-13、D5 组 2026-06-12 已处理。）
