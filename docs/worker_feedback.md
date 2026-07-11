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

## #245 ctor 嵌套 literal 子模式修复（2026-07-11 worker）

- **[通知] 发射策略取舍**：修复统一收敛到 `check_nested_ctor_tags`（LLVM）/ `check_c_nested_ctor_tags`（C）一个递归检查器——新增 `Pattern::Literal` 分支（复用 `gen_literal_pattern_cond` / `emit_c_literal_fail_test`，Int/Bool 走 untag 比较、Str 走 ring_str_eq + 自理 drop、Float 走 OEQ）与 `Pattern::TuplePattern` 分支（ring_list_get borrow + 递归）。tuple 元素位 Phase-1 的手写一层 tag 检查替换为对该函数的递归调用（顺带修复了 `((0, _), y)` tuple 套 tuple 与 `P((0, y))` ctor 字段位 tuple 两个同族漏网——同函数同族，不修会留已知 wrong-code，判定纳入）。`tuple_element_type` 因此孤立，已删除。RC 面零新增义务：比较对象全部是 borrow（enum 字段 load / ring_list_get），rc 套件 532 pass 验证。
- **[通知] 穷尽性排查结论（任务点 4）**：checker 层**正确**，无需修。`exhaustive.ring` 走 Maranget 矩阵：`specialize_row` 对 Int/Str/Float literal 返回 none（不计覆盖），Bool 拆 true/false ctor。实测 `some(0), none` 无兜底正确报 E0601 missing `some(_)`。已加负面回归 `tests/cases/negative/match_ctor_literal_nonexhaustive.ring` 锁定。
- **[通知] or-pattern 扩面（判定纳入范围）**：探针发现 `some(1) | some(2) => ...` 被 checker 接受，但修复前 LLVM 产 **invalid IR**（or-alternative 不计入 dup-tag 检测 → 同 tag 重复 LLVMAddCase）且 C 后端 wrong-code（`some(9)` → "small"，alternative 只查 tag）。任务书点 2 明示"注意 or-pattern 正确性"，判定同族纳入：① or-alt ctor 名计入 dup-tag 扫描；② 含 refutable 字段的 or-alt 强制走 if-else 链（switch 无 per-alt fall-through，如 `A(0) | B(_)` + `_` 形状）；③ if-else / C 后端的 ctor alternative 走完整 `check_*_nested_ctor_tags`（tag + 嵌套字段）。C 侧孤立的 `emit_c_ctor_tag_match_test` 已删。嵌套 or（`some(1 | 2)`）被 parser 拒绝（E0103），无此面。
- **[通知] 范围外发现①——catch arm 无 Phase-1 嵌套检查**：LLVM catch lowering（codegen_llvm_expr.ring 的 guarded 链 ~L5527 与其下的 enum dispatch 路径）对 ctor arm 只做顶层 tag 测试即直接 bind，**连嵌套 ctor tag 都不查**（match 路径早有的 check_nested_ctor_tags 从未接入 catch），literal 子模式同样不查。`catch { MyErr(0) => .., MyErr(n) => .. }` 形状预计 wrong-code。同族但独立路径，比 #245 声明面更宽，未动——建议入 audit。C 侧 catch 是 step-6 stub 不受影响。
- **[通知] 范围外发现②——预存在 module verification failed**：`fn f(o: Int?) -> Str { match o { some(n) => "n=${n}", none => "none" } }` + main 两次调用即触发 "LLVM module verification failed (1 errors)"，**基线 44e69f9 ring.exe 同样报**（与本改动无关，已对照验证）。怪异点：dump 的 ring_output.ll 经 clang 解析编译无错——在内存 module 与文本形式不一致（疑似空 block / 游离 block 类）。运行输出正确。未查根因。
- **[观察] invalid IR "attempting emit anyway" 会挂死 ring.exe**：旧 ring.exe 编 or-pattern 探针（duplicate switch case invalid IR）时 emit 阶段挂死，进程滞留占住文件锁。verification 失败继续 emit 违背"失真必须响"（公理④）——建议 verify 失败直接 fail-stop，需用户拍板。
- **[通知] B-155 间歇 AV 命中一次**：llvm ×3 第 3 轮 `generic_trait_multimethod_dispatch.ring` 编译期 exit 3221225477，单用例复跑 ×3 全过，非稳定复现，符合任务书豁免条款。
- **[通知] self-compile ×3 一致性 FAIL = B-155 既有非确定性，已归因排除本改动**：任务书验收清单不含 self-compile，但动了 codegen 故补跑——3 轮编译全 PASS，字节一致性 FAIL。归因证据链：① 同一新 ring.exe 编**基线源码**（44e69f9，无本次修改）同样一致性 FAIL；② 两轮自编译 IR 精确 diff：857194 行中仅 77 行差异，**100% 是 `[112 x i8]` 膨胀字符串常量行**（B-155 备案形态：31 字符 Str 常量含堆垃圾；backlog 记录 HEAD 现状 "×3 互 diff 恰好 69 行 [109 x i8]"，计数/尺寸随代际漂移符合其"垃圾计数由源码代际决定"结论），零 .text/语义差异。
