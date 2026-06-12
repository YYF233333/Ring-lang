# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

（上一批：B-104 D5 归因测量组，2026-06-12 Discussion 处理完毕——主决策拍板 = **D6 none+const 单例化先行 → D7 And/Or lower 成 if-else**（路线 (b)，否决 (a) post-unbox drop 半套），spec 落 backlog B-104 D6/D7 块 + design.md §7.11「D5 归因后收口」节；#152 拍板降级用户面收口（脱 G-a 路径，B-104 落地后与 B-121 同档，header 加 [deferred: B-104]）；#155 拍板修法 = harness 嵌 asInvoker manifest（先行/随 D6 首棒解锁 72/72）；#153/#154 收口归 D6；6 条 [通知] 纯信息/已转 audit 追踪确认删除；capstone 全强度 ASan 继续挂账待用户指定在场时间。）

## B-104 D6 棒（#155 + none/const 单例化，2026-06-12，git `ae8ab01`/`17a4ad3` + 落账）

### [通知] #155 修法实验确认：clang 驱动 lld-link 两 flag 直通，control 实证

`-Wl,/MANIFEST:EMBED -Wl,/MANIFESTUAC:level='asInvoker'` 经 clang 22 驱动直接可用（无需 -Xlinker 形态）。control 实验：同字节 `update_*.exe` 无 manifest 100% 启动失败（"操作已被用户取消" / consent 挂死——与 audit 记录的两种失败形态吻合），嵌 manifest 后正常。llvm_diff 恢复 72/72；docs 两处 ring.exe 配方同步补 flag。

### [通知] D6 none 单例形态：选了 runtime 单例而非 D4 式 codegen memo-global——一个指针管两个世界

D4 dict getter 的 memo-global 在 codegen 层；none 我放进了 runtime（`ring_enum_none` lazy 单例 + `extern "C" ring_Option_none` 包装，codegen 只声明不再 emit 函数体）。理由：none 的产生点横跨 codegen（每个 `none` 求值）和 runtime helper（find/get_opt/pop/try 一族），runtime 单例让**全部产生点共享同一指针**——顺带把 LLVM 后端的 none 指针恒等对齐到 JS oracle（`Option_none === Option_none` 为 true；pre-D6 native 两个 fresh none 指针比较为 false，是潜在差分盲区，现在 by construction 消除）。这是 native 行为变化（严格向 oracle 收敛方向），llvm_diff ×3 全绿。

### [通知] D6 最重要的实现发现：HIR/perceus/verify_rc 零修改——HIR 一直是对的

spec 预留了「HIR/perceus 形态你定」的空间，落地发现**不需要任何 HIR 侧改动**：HIR 把 `none`/const 访问 lower 成 Ident，perceus 一直按模块单例 borrow 记账（escape 处 Clone→dup、droppable 绑定 scope-end drop——never-drop typeid 下全为 no-op，天然平衡），verify_rc 同。fresh-per-eval 是 LLVM 后端 lowering 的独有偏离（gen_ident → call_zero_arg_or_return 每次调 ctor/getter），修在产生点即闭合。这解释了 D5 的「live=born=100%」：不是记账漏洞，是 codegen 没兑现 HIR 早已声明的单例语义。零新增豁免类、self-verify 0 errors + 1292 exempt 持平均为此推论的直接验证。

### [通知] typeid 18/19 + 非 Str const 的范围决定

typeid 18 OPTION_NONE（none 单例直接以此分配，OPTION 量化口径自动只剩 some 类）、19 CONST_STATIC（`ring_const_intern` 构建后重标 header；ALLOC_STATS live 计数迁类 + BOX_PROFILE 样本 erase，不污染 STR 口径）。非 Str const（标量/List）保持 per-access 现状——标量箱 FRESH-owned 正常 drop 非泄漏类，spec 留给我定，选了最小风险面（const List 单例化会引入容器别名问题，不值）。

### [通知] probe 构造期撞出 interp SB 泄漏类的隔离复现（已记账类，非新发现）

probe D 初版用 `"${A}-${B}"` 热循环，stats 显示 1 SB + 1 STR/求值泄漏；无 const/none 参与的最小复现确认与 D6 两类无关——即 D5 已记账的 SB 11.9M / sb_to_str ≈6.8M 残留类的隔离实证（此前只有自编译聚合读数）。probe 已重构避开（同 dict probe 避开 `&&` 的先例），复现形态存档于 probe 头注，归 D7 后残留 re-measure 看。

### [通知] 差点误判：dist-llvm 构建日志的 "unknown function LLVM*" 警告流是 pre-existing

D6 后首次 dist-llvm 重建看到 `unknown function 'LLVMBuildRet', generating panic` 一度疑为回归；HEAD 源对照构建（stash 往返）输出同样的警告流——这是 B-099 类（native ring.exe 不含 LLVM-C 链接，llvm_ffi extern 在 --target=llvm 自编译时生成 panic stub），与 D6 无关。记录在案防后人再误判。

### [通知] re-measure 读数摘要 + 相位偏移口径注意

@2.382B：live 220.1M→128.6M（9.2%→5.4%，−41.6%）；OPTION 64.2M→0.04M（box-profile 主站点 live/born=0.09% = some 类对照组水平，验收兑现）；STR −29.4M（预测 −29.6M）；15GB kill 3.993B→>6.677B（+67%）；两跑 71 检查点全字节一致。**口径注意**：BOOL 71.4M→73.2M 微涨非增长——D6 二进制每单位工作分配数更少，同 alloc 检查点下编译进度更深（相位偏移），未触类（SB/Type/TokenKind/INT）持平验证口径成立。残留 top：BOOL（And/Or，D7）> STR（type_to_string 字面量/interp）> SB（interp 机器）——D7 + 残留 re-measure 路径与拍板预测一致。capstone 全强度 ASan 自编译仍挂账待用户在场。
