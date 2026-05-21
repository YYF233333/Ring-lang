# Phase 3 设计规格：自举巩固期

> 时间范围：2026-05-21（自举完成）→ Phase B（安全类型）启动前
> 目标：LLM 开发效率优先 + 编译器迭代效率优先，两者穿插推进

## 1. 定位

Phase 3 是 bootstrap 完成到 Phase B（安全类型：refinement types / linear types / `mut<S>`）之间的过渡期。不引入重大新语言特性，聚焦两件事：

1. **让 LLM 能高效自主写 Ring 代码**：改善错误反馈质量、消除语言陷阱
2. **让编译器代码库为下一代特性做好架构准备**：清理技术债、拆分大文件、改善数据结构

不在 Phase 3 范围内：LSP 移植、新类型系统特性、人类开发者工具链（formatter / debugger）。

## 2. 退出标准

| # | 标准 | 当前状态 | 目标状态 |
|---|------|----------|----------|
| E1 | E2E 测试全部通过 | ✅ 352/352 | 324/324 |
| E2 | Parser 错误恢复 | ✅ 声明级恢复已实现（B1） | 声明级恢复 + 多错误报告 |
| E3 | 语言 gotcha 消除 | ✅ A3-A7 全部完成 | 高频陷阱全部修复 |
| E4 | 编译器最大文件行数 | ✅ infer.ring 已拆分（C2） | 所有文件 < 1500 行 |
| E5 | TypeEnv god object | 15 个 public mutable 字段 | 拆分为职责清晰的子结构 |
| E6 | Substitution 性能 | O(n²) 全量复制 | Union-find O(α(n)) |
| E7 | 编译器 boilerplate | ✅ const 声明消除 ~300 行（A3） | 通过语言改进消除 |

## 3. 三轨架构

### 轨道 A：语言改进（小粒度、高频）

消除 LLM 和编译器代码反复踩的语言陷阱。每项 1-3 天。

| # | 改进项 | 痛点 | 预期效果 | 难度 | 状态 |
|---|--------|------|----------|------|------|
| A1 | **空列表 `[]` 类型推断** | `let x: List<T> = []` 失败，必须 `[dummy]; x.clear()` | 消除 ~300 行 `empty_xxx()` boilerplate + LLM 第一大 gotcha | 中 | ✅ It1 |
| A2 | **Tuple 字段访问 `.0`/`.1`** | 必须解构绑定才能取 tuple 元素 | 消除 wrapper struct，代码更简洁 | 中 | ✅ It1 |
| A3 | **`const` 声明** | `BUILTIN_*()` / `JS_RESERVED()` 每次调用分配新对象 | 编译器性能改善 + 惯用代码模式 | 中 | ✅ It2 |
| A4 | **字符串插值嵌套引号** | `"\{fn("arg")}"` 解析失败 | 消除 LLM 反复踩的 gotcha | 小 | ✅ It2 |
| A5 | **`BinOp::Eq {` 解析歧义** | `op == BinOp::Eq` 后跟 `{` 误解析为命名字段变体构造 | 消除编译器代码的括号 workaround | 小 | ✅ It3 |
| A6 | **`loop` 关键字** | `while true` 可替代但不惯用 | 微小改善 | 极小 | ✅ It3 |
| A7 | **`List.set(i, v)` 方法** | 修改列表元素需重建整个列表 | 编译器 codegen 等场景实用 | 极小 | ✅ WaveA |

**A1 实现思路**：在 unification 中，当空列表字面量（元素类型为 fresh type var）遇到 `List<T>` 约束时，将元素类型变量统一为 `T`。需要在 parser（生成 `ListLit` 节点）、checker（推断空列表类型）、codegen（生成 `[]`）三处协调。

### 轨道 B：错误基础设施（中粒度，Parser 错误恢复为锚点）

系统性提升编译器错误报告能力，直接影响 LLM 迭代效率。

| # | 改进项 | 当前状态 | 预期效果 | 难度 | 状态 |
|---|--------|----------|----------|------|------|
| B1 | **Parser 错误恢复** | 遇语法错误直接 panic | 声明级同步恢复，一次 parse 报告多个语法错误 | **大** | ✅ It2 |
| B2 | **Checker 函数内多错误恢复** | 同一函数体内首错即停 | 表达式/语句级恢复，一个函数报多个类型错误 | 中 | 🔄 WaveB |
| B3 | **诊断信息质量提升** | 部分错误码缺乏上下文 | "did you mean..." 建议、常见误用提示 | 中 | |
| B4 | **`--error-format=llm` 增强** | 基本结构化输出 | 修复建议、错误分类标签 | 小 | |

**B1 实现策略**：
- 声明级同步：遇到语法错误时，跳过 token 直到下一个声明起始关键字（`fn`/`struct`/`enum`/`trait`/`impl`/`use`/`let`），插入 `ErrorDecl` 占位节点
- AST 增加 `ErrorDecl`/`ErrorStmt`/`ErrorExpr` 节点类型
- Checker 遇到 Error 节点直接跳过或返回 `ErrorType`，不传播 panic
- 参考：Rust analyzer 的 parser resilience 策略

### 轨道 C：架构重构（大粒度，TypeEnv/infer.ring 为锚点）

降低编译器代码复杂度，为 Phase B 新特性做好架构准备。

| # | 改进项 | 当前状态 | 预期效果 | 难度 | 状态 |
|---|--------|----------|----------|------|------|
| C1 | **HIR accessor 统一** | `hexpr_type`/`expr_type`/`expr_effects` 在 3 个文件重复 | 统一到 `hir.ring`，审计报告"最高 ROI 重构" | 小 | ✅ It1 |
| C2 | **`infer.ring` 拆分** | 2763 行单文件 | 拆为 `infer.ring` + `infer_decl.ring` | 中 | ✅ It3 |
| C3 | **TypeEnv 拆分** | 17+ public mutable 字段 god object | 拆为职责清晰的子结构 | **大** | |
| C4 | **Substitution union-find** | 每次 unify 复制整个 Map（O(n²)） | union-find O(α(n))，大项目编译提速 | 大 | |
| C5 | **代码去重** | `types_equal` 148 行重复、HOF inline ~100 行重复 | 抽象 helper + 统一模式 | 中 | 🔄 WaveB |
| C6 | **if/else → match 重构** | derive.ring/codegen_derive.ring 嵌套 if/else | 改用 match 表达式 | 小 | ✅ WaveA |
| C7 | **模块 resolver AST 缓存** | 每个文件 parse 两次 | 缓存首次 parse 结果 | 小 | ✅ WaveA |
| C8 | **`try_eq_dispatch` sentinel → Option** | 用空字符串作 sentinel | 改用 `Option<Str>` | 极小 | ✅ It3 |
| C9 | **`panic()` → DiagnosticSink** | 68 处 panic（~40 unreachable） | 可行的替换为诊断报错 | 中 | |

**C3 实现策略**（分步）：
1. 提取只读查询接口（不改变外部 API）
2. 将字段按职责分组（struct 注册 / trait 注册 / scope 管理 / type var 管理）
3. 拆分为独立结构，TypeEnv 降级为 facade

## 4. 迭代编排

### Iteration 1："解锁器"（Week 1-2）✅ 完成

| 轨道 | 任务 | 理由 |
|------|------|------|
| A | A1: 空列表 `[]` 类型推断 | 解锁 boilerplate 清理 + LLM 第一大 gotcha |
| A | A2: Tuple 字段访问 `.0`/`.1` | 解锁 wrapper struct 清理 |
| C | C1: HIR accessor 统一 | 独立、高 ROI |

### Iteration 2："Parser 攻坚 + 语言完善"（Week 3-5）✅ 完成

| 轨道 | 任务 | 理由 |
|------|------|------|
| B | B1: Parser 错误恢复 | Phase 3 最大单体任务 |
| A | A3: `const` 声明 | 穿插在 parser 工作间隙 |
| A | A4: 字符串插值嵌套引号 | 小修复，parser 相关 |

### Iteration 3："大文件拆分 + 小修"（Week 6-7）✅ 完成

| 轨道 | 任务 | 理由 |
|------|------|------|
| C | C2: `infer.ring` 拆分（→ infer_decl.ring） | 为 TypeEnv 重构做准备 |
| A | A5: `BinOp::Eq {` 解析歧义 | 小修 |
| A | A6: `loop` 关键字 | 极小改动 |
| C | C8: `try_eq_dispatch` sentinel → Option | 极小 |

### Wave A："独立冲刺"（与 It3 并行）✅ 完成

原 It4/5/6 的无依赖任务提前并行执行（3 worktrees）。

| 轨道 | 任务 | 理由 |
|------|------|------|
| A | A7: `List.set(i, v)` | 无依赖，与 It3 零文件冲突 |
| C | C6: if/else → match 重构 | 无依赖，derive.ring/codegen_derive.ring |
| C | C7: 模块 resolver AST 缓存 | 无依赖，消除双重 parse |

### Wave B："错误恢复 + 去重"（Wave A 后）🔄 进行中

| 轨道 | 任务 | 理由 |
|------|------|------|
| B | B2: Checker 函数内多错误恢复 | ErrorType 吸收错误，函数内继续 |
| C | C5: 代码去重（types_equal + HOF inline） | 利用 A1/A2 新特性清理 |

### Wave C："核心架构"（Wave B 后）

| 轨道 | 任务 | 理由 |
|------|------|------|
| C | C3: TypeEnv 拆分 | 最大架构债，独占 main |

**里程碑**：TypeEnv 不再是 god object。

### Wave D："性能 + 打磨"（Wave C 后，3 worktrees 并行）

| 轨道 | 任务 | 理由 |
|------|------|------|
| C | C4: Substitution union-find | unify.ring，与 B3/C9 零冲突 |
| B | B3 + B4: 诊断质量 + error-format=llm | diagnostics.ring/formatter.ring |
| C | C9: `panic()` → DiagnosticSink（部分） | ~28 个可恢复 panic |

**里程碑**：Phase 3 退出标准全部达成。准备进入 Phase B。

## 5. 依赖关系

```
A1(空列表) ──→ C5(代码去重)
A2(tuple)  ──→ C5
A3(const)  ──→ 编译器性能改善
B1(parser recovery) ──→ B2(checker recovery) ──→ B3(诊断改进)
C2(infer拆分) ──→ C3(TypeEnv拆分)
C3(TypeEnv) ──→ B3(诊断改进)
```

## 6. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| TypeEnv 拆分引入回归 | 高 | 分步进行，每步全量 E2E 测试 |
| Parser 错误恢复比预期复杂 | 中 | 先做声明级恢复（保守），表达式级可延后 |
| Union-find 改 Substitution 语义偏差 | 中 | 先写全面的 unification 测试套件 |
| 语言改进需要重新编译 dist/ | 低 | 每个语言改进完成后立即 bootstrap 验证 |
| Iteration 排期滑动 | 低 | 每轮迭代结束后回顾，调整后续排期 |

## 7. 测试策略

- **每个语言改进（轨道 A）**：正向 E2E 测试（新特性可用）+ 负向测试（错误用法报错）
- **Parser 错误恢复（B1）**：修复 6 个现有失败测试 + 新增多错误场景测试
- **架构重构（轨道 C）**：全量 E2E 回归（318/324 → 只增不减）+ 编译器自举验证
- **每个迭代结束**：完整 `npm test` + 编译器自举验证（`node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist`）
