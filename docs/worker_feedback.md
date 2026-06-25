# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-100 Phase 1 — Parity 认证门准备（2026-06-25）

### 1. 新增 26 个 llvm_diff 测试，17 通过 / 9 失败 [通知]

Phase 1.1 feature 覆盖矩阵审计 + 补缺完成。从 118 → 144 个 llvm_diff 用例。9 个失败暴露了 LLVM 后端真实 parity gap：

| 测试 | 错误类型 | 根因 |
|------|----------|------|
| cell_update | codegen panic | Cell 类型/方法未实现 (Cell/Cell.update/Cell.get/Cell.set) |
| delegate_full_scenarios | 输出发散 | 委托 default method 的 self 调用结果不对（`desc=Alice` 而非 `I am Alice`）|
| for_range_variants | 输出发散 | Map destructure for-in 循环的 key 值未正确提取（`map_keys=0` vs `6`）|
| match_literal | 超时 60s | LLVM 编译或运行挂起（match Int 字面量可能无限循环）|
| mod_nested_const | codegen panic | 嵌套模块块内变量解析失败（`undefined variable 'b'`）|
| ord_derive | runtime 错误 | derive Ord 的 dict 未注册（`no builtin Ord dict for '__Priority_Ord'`）|
| row_basic | codegen panic | row type 字段访问未实现（`field access on non-struct type: {name: Str}`）|
| struct_update_generic | 崩溃 0xC0000005 | 泛型 struct update 语法导致访问违规 |
| supertrait_multi_default | runtime 错误 | 多级 supertrait self-dict 缺失（`no builtin dict for '__ring_self_Nameable'`）|

plus 已知 map_set_for_each (#138, Map.fold 未实现)。

**分类**：
- **未实现特性**（4个）：Cell、row types、derive Ord、Map.fold — LLVM 后端尚未添加
- **已有机制 bug**（5个）：delegate default method、map destructure for-in、nested module var、generic struct update 崩溃、multi-level supertrait dict、match literal 挂起

这些 gap 需要在 Phase 1.4（×3 零失配）之前修复。

### 2. Oracle-blind native-only 测试基础设施建立 [通知]

创建了 `tests/cases/native_only/` + `tests/native_only.test.mjs` harness。首批 3 个测试：
- **i64_boundary** ✅：2^53 以上精度（JS oracle 此处失真）
- **i64_overflow** ✅：tagged pointer i63 范围内 2's complement wrap
- **int_divzero** (todo)：LLVM 后端 `sdiv` 无零检查（UB，exit 0 + garbage 而非 panic）

**发现**：
- 有效整数范围是 i63（±2^62）而非 i64（tagged pointer `(value << 1) | 1` 占 1 bit）
- 整数字面量 > 2^53 编译期丢精度（bootstrap 编译器用 JS Number 解析）— 测试用运行时算术绕过
- 整数除零是 UB（LLVM `sdiv x, 0` = undefined behavior）— 需 codegen 加 guard（归为未来 codegen 改进）

### 3. 基线测试结果 [通知]

- **npm test**: 935/935 全绿（含新增 llvm_diff + verify-rc 对新测试的扫描）
- **llvm_diff**: 133/144 pass, 10 fail (9 新 + 1 已知 #138), 1 skip
- **native-only**: 2 pass, 1 todo (int_divzero)

