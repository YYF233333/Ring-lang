# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## [决策] B-101 A1 已落地，但 native self-compile 卡在 A1 之外的 over-free 链——是否继续 native UAF 猎杀 vs 重新 scope（2026-06-05 Worker）

**已完成（已 commit，全绿）**：
- **A1（Type intern 的「永不 drop」半）落地**：runtime `ring_register_never_drop` + `never_drop_table`（`ring_dup`/`ring_drop` 对 Type-DAG typeid no-op）；codegen 对 Type-DAG 类型集不生成递归 `drop_T`、改注册 never-drop；perceus 对 Type-typed 绑定不发 Clone/Drop。撤 Wave A 空 hook（留 DEAD ROAD 注释）。**Type-DAG over-free 段错误消除**。
- **fix-forward #1（A1 暴露的真·第一 blocker）= enum 变体构造器 call-arg over-free 修复**：`some(x)`/`ok(v)`/用户 `Variant(payload)` 写成 call 语法时 lower 成 Call，运行时按所有权存指针不 dup，但 perceus 把 call-arg 当 borrow → owner-bearing local 参数 scope-end-drop 释放新 enum 的载荷 → UAF。修法 = perceus 把变体构造器 call 的值参数当 sink（escape-clone），同 StructLit/NamedVariantConstruct 字段。**这是空 prelude 的真根因**：prelude loader 的 `match find_std_dir() { some(std_dir) => … }` 里 `std_dir` 载荷被提前释放 → `find_std_dir` 返回空串 → 整个 std prelude（连 `List`/`print` builtin 全部）静默加载失败。修后 native 能加载 prelude 并进入类型解析。补回归 `tests/cases/llvm/variant_ctor_owned_arg.ring`。
- **验证全绿**：JS 731×3、llvm_diff 51×3（含新回归）、dist double-bootstrap 字节一致（仅改 codegen_llvm/hir/perceus 三文件，重编不动点）。**净行为对 JS/llvm_diff 零回归**。

**未达 A1 验收（native real_program EXIT 0 3×）—— 卡在第三层 over-free**：
- prelude 加载推进后，native 编 real_program（及任何用 prelude 的程序）现崩在 `ring_infer_ctx$$_resolve_type_expr` 的 `match texpr`：**`runtime tag=<十亿级垃圾>` / 栈溢出（0xC00000FD）/ 非穷尽 panic，间歇**（run1 panic、run2/3 栈溢出）= 读已 free 的 `TypeExpr`（堆损坏铁证）。
- **已证伪是我的回归**：我的两个改动只「加 clone（构造器 sink）」+「抑制 drop（Type-DAG）」，二者只会泄漏不会引入 over-free → 此 `TypeExpr` 损坏是 **pre-existing**，先前被空 prelude 早崩掩盖，现因推进而暴露。
- **已证伪是同一构造器/Type-DAG 类**：最小 native repro（递归 enum 字面量构造 + 字段绑定匹配 / Option<递归 enum> 字段 + 递归 resolve）全部 EXIT 0 输出对 5×——故 `TypeExpr` 损坏是**独立的第三类 over-free**，非 Type-DAG、非变体构造器 call-arg。
- 性质 = 间歇堆损坏（某处 over-free 释放了被复用的块），**需 native 调试器/ASan 级工具逐点定位**，非静态可判（同 backlog「待 native 调试」）。盲猜会无界发散。

**决策点**：A1 的 Type-DAG 修复 + 构造器 sink 修复都是**正确、必要、已回归保护**的真 bug 修复，应保留（已 merge）。但 **native self-compile 是 over-free 链**（至少三层，可能更多），逐层猎杀是开放式工程，远超 B-101 锁定的「Type-DAG intern + 永不 drop」scope。请用户拍板：
1. **继续在 B-101 内做 native UAF 链猎杀**（开放式，需要我搭 native 调试回路逐个 over-free 定位修复，工期不可估）；或
2. **B-101 收口为「A1 + 构造器 sink 已落地，结构性 Type-DAG UAF 已消除」**，把剩余 native over-free 链 + A2（hash-cons / G-a 内存门）拆成新 backlog（如 B-102 native over-free 链终结 + A2），native self-compile 终验仍归 B-089；或
3. 其它 scope 调整。

无论哪条，A1+构造器 sink 不回滚（已验证净正向）。A2（hash-cons Type 构造去重 → G-a 内存门）**尚未动**——A1 内存仍 ~25.9GB 不变（永不 drop 不去重，只杀 UAF），A2 待 native 正确性先打通（否则无法实测 peak RSS）。
