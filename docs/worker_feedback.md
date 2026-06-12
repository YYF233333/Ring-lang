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

## B-104 D7 棒（And/Or lower 成 if-else，2026-06-13，git `2de19dc`/`3893997` + 落账）

### [通知] G-a 三门读数：自编译**首次完整跑通**（门③✅）+ peak 10.6GB（门②✅）+ live plateau 未达（门①✗）

核心结果：native 自编译三跑全部跑完（exit 0，全程 ~10.42B allocs，43 个 .js 产出；D6 还在 6.677B 处 15GB kill）。peak RSS ~10.6GB << 25.9GB。@2.382B 检查点 leak 5.4%→2.3%（live 128.6M→55.63M，−56.7%），BOOL 73.2M→**~43.6K**（box-profile 40 站点 681 样本，−99.94%——验收预测「≈2M 量级」超额兑现，top-6 退出）；未触类全部持平（STR 28.16M/SB 12.02M/Type 5.50M/TokenKind 4.19M/INT 3.97M）。**门① live plateau 未达**：live 55.6M@2.38B→185.2M@10.42B，leak% 2.3%→1.8% 亚线性递减但非 plateau；爬升类 = STR 101.9M + SB 47.3M（type_to_string 字面量/interp SB——D5 已记账、D7 spec 显式范围外）+ Type 22.7M（D5 判定偏合法存活）。**下一杠杆候选**（不拍板，留 orchestrator/用户）：interp SB/sb_to_str + type_to_string 字面量收口（残余主体 ≈80%），或先核 Type/SB 中合法存活份额定门①口径。两跑 311 个检查点全字节一致；capstone 全强度 ASan 自编译仍挂账待用户在场。

### [通知] D7 载荷件不止 lower 本身：anf_should_materialize 新 IfExpr 臂是 if-cond 类（types.ring:386 ≈23.3M）的收口件

while-cond/guard 位的 phi box 由既有 post-unbox drop（is_fresh_owned_bool_value 的 If 递归）接管，但 one-shot if-cond/operand/discard 位没有这个机制——它们的既有 RC 路径是 ANF 物化（`if a == b {}` 的比较 box 一直是物化+drop 的）。所以配套给 anf_should_materialize 加了 IfExpr 臂：全非发散臂尾 fresh ⇒ 整 phi `let __anf_N = if a { b } else { false }` + scope-end drop（⑧：lowered 形态走 if-cond 的同一条既有路径，而非加第三个 codegen drop 站点）。borrow 臂（Ident/FieldAccess 尾）否决物化 → 留 x-cf-value 保守姿态 = 旧 And/Or 泄漏方向不变量。MatchExpr 值位有意不扩（非 D7 范围，避免读数归因被污染）。

### [通知] 特判退役的两个解读决定：W3a 递归保留（effect-value 尾）+ D2-#3 门保留（And/Or 实例消失）

「W3a 非 blanket-true 分析退役」落地为：And/Or 动因退役（BinOp 臂翻 blanket true），但 If/Match 分支递归**本身保留**——其残余存在理由 = EffectOp/TryCatch/HandleExpr 尾可 alias（B-002 abort 路径），这不是 And/Or 双路径而是另一类值的既有保守。同理 D2-#3 visible-owned 门保留（防 effect-valued init），其 And/Or 实例随 lower 结构性消失。顺带收益：`let mut ok = false; ok = a && obj.flag; ok = false` 这族**潜伏 UAF 方向**（owned 标量绑定被 And/Or-of-borrow 重赋值后 W4 drop 借用 box）随 lower 封死——lowered IfExpr 的 borrow 臂尾被 rc_escape Clone-wrap，绑定永远持 owned dup（probe E 固化为回归）。

### [通知] probe 构造期撞出 borrow 臂残余类的精确形态（文档化 x-cf-value，非新发现）

probe D 初版嵌套链 `(j < 0 && ok) || j >= 0`（`ok` 为 Ident borrow 臂）BOOL live 随迭代 1:1 爬：内层 IfExpr 物化被 borrow 臂否决 → 未取边 BoolLit box 每轮泄 1 个。严格优于 pre-D7（gen_and 的 false_val 在分支前无条件分配，双边都泄）；self-verify 中此类 x-cf-value 共 81 处。形态存档 probe 头注，probe D 已改全 fresh 臂锁 D7 目标类。

### [通知] verifier 豁免账目 1292→892（−400，零新增类）

x-andor 整类退役；余 6 类全既有：x-overwrite-field=242 / x-overwrite-var=428 / x-cf-value=81 / x-overwrite-boxed=1 / x-discard=114 / x-effect-value=26。net −400 = x-andor 消失 + 原 And/Or 位次生 findings 被物化/可 drop 化吸收（部分迁入 x-cf-value）。

### [通知] B-089 预警：native 自编译产出的 JS 与 node dist 仅 import/函数 emit **顺序**差异（Map 迭代序），功能 sanity 过

首次能做这个对比（以前跑不完）。42/42 文件 hash 不同但长度逐文件相同，diff 全部是 import 列表序/函数定义序（native C++ map 迭代序 vs JS 插入序）；用 native 产出的 main.js 编译 hello.ring 正常。B-089 的「native 产 JS dist 与 node 版一致」门会正面撞上这个——届时要么 codegen 排序确定化（与后端无关的稳定序），要么门改语义等价。先记录，不在 D7 动。

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
