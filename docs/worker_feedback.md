# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

（上一批：B-104 D4 + 验收棒 + 下一杠杆组，2026-06-12 Discussion 处理完毕——主决策拍板 = 选项 C 归因先行（D5，落 B-104 执行序，数据出来回桌拍 A/B，不预批）；capstone 全强度 ASan 挂账待用户指定在场时间；2 条 dict dispatch pre-existing [决策] 合并立项 **B-121** [P2]；10 条 [通知] 纯信息/已闭环确认删除；残留③ dist-llvm warning 数字顺手更新进 B-099 备忘（~970→~1020）。）

## B-104 D5 归因测量（2026-06-12，worker 直做主仓，measurement-only）

> 仪表 git `7323ee6`（BOOL profile + [hof-stats] 直接计数器 + [drop-reg]）/ `deab122`（OPTION 记录点修正 + STR 升 IR 站点粒度）。跑法 = ring_stats.exe（-O2 -DRING_ALLOC_STATS -DRING_BOX_PROFILE + linker map）自编译 --target=llvm，@2.382B 检查点收数即杀（15GB watchdog 未触发，两轮均 ~峰值 9GB 内）。**两跑 [alloc-stats]/[hof-stats] 与 D4 基线（git `2635bcc`）逐字节一致**——仪表零扰动 + 工作负载确定性三重确认。RVA→符号 = linker map 二分（B-080 P0 同流程）。

[通知] **① BOOL 71.4M 切分（任务主问）：#152 HOF 谓词份额 = 0.008%（绝对值 5,921 个），And/Or-cond 双臂 box ≈97%——双嫌定量一边倒**。直接计数器（无采样、逐次累加）@2.382B：pred_bool=5,921 / fold_acc=0 / foreach_key_str=0 / foreach_key_int=0——#152 全部三类站点在自编译 workload 量化份额 ≈ 0（编译器源码因「.map 闭包不能捕获 mut」惯例以 for 循环为主，HOF 走得极少）。box-profile（外推 71.36M vs 实际 71.45M，99.9% 校准）top 站点全部 live=born=100%（漏方向纯泄露，无部分回收）：`exhaustive$$_build_inst_map` 双站点 54.9%≈39.2M（= exhaustive.ring:35 `while i < a.len() && i < b.len()` 的 LHS/RHS 臂）+ `types$$_type_to_string` 双站点 32.6%≈23.3M（= types.ring:386 `name == BUILTIN_OPTION && type_params.len() == 1`）+ lexer 族（code_in_range/skip_whitespace/lex_ident/is_ident_continue）9.2%≈6.6M。**就两行源码占 87.5%**；热度驱动者 = 穷尽性检查在非错误路径拿 type_to_string 当类型 identity key（exhaustive.ring:121/245/332/573）。

[通知] **② OPTION 64.2M 归因：`ring_Option_none` 100% 泄、`ring_Option_some` 仅 0.09%——none 构造系统性无人 drop，结构性而非站点性**。box-profile（v2 移 ring_alloc 后外推 64.23M vs 实际 64.18M 全覆盖）：none live=born=1,003,052 样本（99.94% 类内）；some born=616,855 → live=584（正常回收）。run 1 反向佐证：runtime helper（find/get_opt 等经 enum_some）产的 Option 零 live 样本 = D1/D2 已盖住。JS 后端 `none` 是 `Object.freeze({_tag:"none"})` 模块级单例（runtime.ring:208）、LLVM 是 per-eval fresh 16B 分配且 RC 从不 drop——**与 #151 dict 完全同构的 JS/LLVM 偏离**（perceus.ring 零特判 none，疑 zero-arg ctor 路径在所有权记账外，机制深挖留下一棒）。已开 audit #153。波及面注：不限自编译——所有用户程序每个 none 求值都泄。

[通知] **③ tid103 = `Type` enum（[drop-reg] RVA 符号化 `ring_drop_Type` 直接定身份）**：5.37M@2.382B，2.15B 才进 top-6，斜率 ~+37K/33.5M allocs 缓慢线性——与 tid169=TokenKind（4,131,865 从 268M→2.38B 硬 plateau，纯合法存活）形态不同，但量级小（2.4% residual）、与 checker 推进期 HIR/env 类型注解合法累积一致；判定 = **偏合法存活、不能排除小比例泄漏、非主杠杆**。INT 3.90M plateau 同口径固化（top = Lexer_advance 双站点 ≈3.4M，边界装箱合法存活）。

[通知] **④ STR 57.5M：for_each 合成 key 份额 = 0（#152③ 证伪于自编译）；真身 = 常量/字面量重物化，~90% 挂在类型字符串化热路径**。IR 站点粒度（v2）：`BUILTIN_OPTION` getter 18.0M + `BUILTIN_STR` 6.3M + `BUILTIN_INT` 4.7M + FLOAT/BOOL 0.7M ≈ **29.6M = HDecl::Const 的 zero-arg getter 每次访问 fresh 物化**（codegen_llvm_decl.ring:88「Generate const as a zero-arg function」；JS 后端 = 模块级 const 单例，又一个 #151 同构）→ audit #154；`type_to_string` 内部字面量/interp 站点 ≈23M（三个 100% 泄 + 两个 ~50% 泄）；`sb_to_str` ≈6.8M（11.7%）。types.ring:386 一行同时贡献 BOOL（`&&` 双臂）和 STR（BUILTIN_OPTION 重物化）两类泄漏。

[通知] **测量途中新发现（非 Ring bug）**：`npm run test:llvm` 今日起 `struct_update_enum.ring` 必失败——Windows UAC installer-detection 启发式对名含 "update" 的无 manifest exe 报 ERROR_ELEVATION_REQUIRED（同字节改名即过；HEAD/d1f10ff 两 runtime A/A 同失败，与本棒改动无关；昨日 D4 ×3 还全绿 = 机器策略状态今日变化）。失败形态多变（空输出 exit 0 / 60s 挂死）易误判为堆损坏。已开 audit #155；**在修复前 llvm_diff 全套恒 71/72，×3 纪律的判读须把该例排除**。本棒三轮全套（v1 并发跑 + v1 静置 + v2 终验）均 71/72、除该例零回归——宏卫生门通过。

[通知] capstone 全强度 ASan 自编译仍挂账（D4 纪律项，需用户在场），不随本棒。scratch 产物（dist-llvm-scratch/、d5_run*.log、ring_stats.exe/map、sue_*.exe 等）已清，仪表源码入 git、测量产物不入。

[决策] **D5 后下一杠杆排序（数据呈上，等 Discussion 拍板，不预批）**。
**现状**：D4 后 residual 220.1M@2.382B 已全量归因——And/Or-cond 双臂 box ≈69M（31%）、none 重物化+不 drop ≈64M（29%）、const-getter/字面量重物化 ≈51M（23%）三类合计 84%；SB 11.9M/Type 5.4M/TokenKind 4.1M/INT 3.9M 合计 ~11%（后两者判合法存活）。原 A/B 框架被数据改写：**A（#152 runtime HOF drop wave）对 G-a 杠杆 = 0.008%**（但用户面 HOF-heavy 程序仍真实存在该泄漏类，建议降级为用户面收口项与 B-121 同档排期，不进 G-a 关键路径）；**B（And/Or 收口）仍是最大单类**但内涵从「phi 结果保守保留」精化为「cond 位下双臂 box + 臂内子表达式 owned 临时全部不 drop」（BUILTIN_OPTION getter 结果同漏佐证臂内子表达式也在泄）。
**原因**：none 单例化与 const-getter 单例化与 D4 dict 单例是同一设计家族（JS 后端模块级 immutable 单例 / LLVM per-eval fresh 的系统性偏离），D4 的 DICT_STATIC never-drop + lazy memoised getter 基建直接可复用，工程确定性高；And/Or 收口是 perceus/codegen RC 模式改动，有 D2-#3（And/Or phi verbatim borrow 误 drop = UAF）前科，需 verifier/ASan 全套护航，风险更高但量最大。
**待决策**：① 执行顺序——选项一「none + const 单例先行」（≈115M、52% residual，低风险快兑现，D4 同构基建复用，且同时消 churn）vs 选项二「And/Or 收口先行」（≈69M 最大单类，但高风险慢）vs 一波合并；② And/Or 收口的实现路线（cond 位臂 box post-unbox drop 扩展 vs And/Or lower 成 if-else 让 D1 统一覆盖）是否本轮一并拍；③ #152 是否如建议降级为用户面收口项（脱离 G-a 关键路径）。三类全落地理论 residual ≈36M（~1.5%），接近 plateau 形态——G-a 三门有望在下一棒后重验。
