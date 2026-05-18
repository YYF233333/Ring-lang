# Ring-lang 编译器自举准备设计

## 概述

Ring-lang 编译器当前用 TypeScript 实现（~9,200 行非测试代码），编译 Ring 源码到 JavaScript。目标：用 Ring 语言重写整个编译器（含 LSP），实现自举。

### 决策记录

- **自举范围**：全部重写（parser + checker + codegen + diagnostics + LSP + CLI）
- **迁移策略**：一次性重写，TS 编译器作为引导编译器和参考实现
- **等价标准**：行为等价（所有 e2e 测试通过即可，JS 输出结构可不同）
- **class 处理**：struct + impl 取代 class，无需新增 class 语法（刻意的语言设计）
- **标准库**：提前建设，作为第一个主要 Ring 工程项目，用于迭代语言设计

## 现状分析

### TS 编译器特征

| 维度 | 数据 |
|------|------|
| 代码量 | ~9,200 行（不含测试） |
| 外部依赖 | 核心编译 0 依赖；LSP 用 vscode-languageserver |
| 主要 TS 特性 | discriminated union (189 type)、Map/Set (45 处)、Array 高阶方法 (204 处)、class (15 个)、enum (TokenKind 89 变体) |
| 测试覆盖 | 207 单元 + 161 e2e |

### Ring 语言当前能力

已支持：struct、enum、pattern matching（穷尽性）、HM 类型推断、trait 系统、effect system（evidence passing）、UFCS、Option\<T\>、`?`/`try`/`or`/`catch`、row polymorphism、Cell\<T\>、字符串插值、lambda/闭包。

## Ring 缺失特性清单

### Tier 1：绝对阻塞

| 特性 | TS 中使用量 | 说明 |
|------|------------|------|
| 模块系统 (import/export) | 所有文件 | 编译器 15+ 源文件 |
| 循环 (for/while) | 50+ 处 | 遍历 token 列表、AST 子节点、参数列表 |
| List\<T\> (数组 + 高阶方法) | 204 处 | `.map`/`.filter`/`.find`/`.push`/索引访问 |
| Map\<K,V\> | 45 处 | 替换表、符号表、impl 注册表 |

### Tier 2：高度需要

| 特性 | TS 中使用量 | 说明 |
|------|------------|------|
| 字符串方法 | lexer 全局 | `.slice`/`.charCodeAt`/`.startsWith`/长度/字符分类 |
| 可变绑定 + 赋值 (var/=) | 大量 | lexer pos、parser 状态、codegen 缓冲区 |
| 类型窄化 (match 分支) | 130 处 `as` | discriminated union 的 switch 分支内窄化 |

### Tier 3：可设计替代

| 特性 | 替代方案 |
|------|---------|
| Set\<T\> | Map\<T, Unit\> |
| 可选属性 (field?) | Option\<T\> 字段 |
| TS enum (TokenKind) | Ring enum 或常量集 |
| 字符串 → 数字转换 | ring-std/str 方法 |
| Error 类继承 | struct + effect |

## 标准库规划 (ring-std)

标准库是自举的前置依赖，也是第一个用 Ring 写的真实项目。

### 模块划分

| 模块 | 核心 API | 编译器依赖场景 |
|------|---------|--------------|
| list | `new`, `push`, `get`, `len`, `map`, `filter`, `find`, `fold`, `any`, `all`, `join`, 索引 | AST 子节点、参数列表、match arms |
| map | `new`, `get`, `set`, `has`, `delete`, `keys`, `values`, `entries` | 替换表、符号表、impl 注册表 |
| str | `len`, `char_at`, `slice`, `starts_with`, `contains`, `split`, `trim`, `to_int`, `to_float` | lexer、标识符、codegen 输出 |
| set | `new`, `add`, `has`, `delete`, `union`, `intersect` | 类型变量收集、free vars |
| io | `read_file`, `write_file`, `args`, `exit`, `print`, `eprint` | CLI、文件读写 |
| fmt | `format` 或增强字符串插值 | diagnostics、codegen 输出 |

### 实现策略

底层编译为直接的 JS 内置操作（List → Array、Map → Map、Str → String.prototype），零运行时开销。标准库用 Ring 编写接口 + 编译器 intrinsic codegen 支持。

## TS 编译器重构方向

在继续完善 TS 编译器时逐步调整结构：

| 当前 TS 模式 | 重构目标 | 原因 |
|-------------|---------|------|
| `class Parser { ... }` | struct + 独立函数 | Ring 用 struct + impl |
| `expr as CallExpr` | match 或 if 窄化 | Ring 无 `as` |
| `node.field?.subfield` | 显式 match on Option | Ring 用 Option |
| `x ?? default` | `or` 表达式 | Ring 已有 |
| `throw new Error(...)` | `fail.raise(...)` | 映射 effect 系统 |

不需要重构的部分：discriminated union 的 switch/case（→ match）、函数式数据变换（→ lambda）、const 绑定（→ let）、字符串插值。

## 测试加强策略

### Golden output 测试

对每个 e2e 测试用例固化完整输出链：

| 阶段 | 固化内容 | 用途 |
|------|---------|------|
| Parser | AST JSON dump | 解析行为不变 |
| Checker | HIR type annotation dump | 类型推断一致 |
| Codegen | 生成的 JS 代码 | codegen 逻辑不变 |
| 执行 | stdout 输出 | 端到端行为不变（已有） |

### 边界测试补充

- 类型推断：多层泛型实例化、trait bound 传递链、row variable 跨函数传播
- Effect 组合：多 effect 叠加、handler 嵌套、evidence 多层转发
- Codegen 边角：深度嵌套 match、大量 variant、闭包捕获 evidence
- 错误恢复：同一文件多个不相关错误
- 字符串：空串、Unicode、多层插值嵌套

### 测试基础设施

- `ring dump-ast` / `ring dump-hir` CLI 命令
- Golden file 管理（.expected 文件 + --update-golden 刷新）
- 差异报告（精确 diff 而非 pass/fail）

### 自举专项测试（Phase 4）

- 定点测试：ring-ring 编译自身 → 输出与 ring-ts 编译 ring-ring 一致
- 交叉验证：同一 .ring 测试用例分别用两版编译器编译运行，输出一致

## 执行阶段

### Phase 3a：语言特性 + 标准库

按依赖关系排序：

1. 可变绑定 + 赋值 (var/=) — 已部分实现，需完善
2. 循环 (for/while/break/continue) — 标准库实现的基础
3. 字符串方法 — 内置 + ring-std/str
4. List\<T\> — ring-std/list（依赖循环）
5. Map\<K,V\> + Set\<T\> — ring-std/map, ring-std/set
6. 模块系统 (import/export) — 标准库拆分为多文件的前提
7. 类型窄化 (match 分支自动窄化) — 编译器代码大量使用

**验证里程碑**：用 Ring 写一个迷你 lexer（~200 行），能分词 Ring 源码。

### Phase 3b：TS 重构 + 测试加强（与 3a 交错）

- 逐步消除 `as` 断言 → match 窄化
- class → struct-like 结构
- Golden output 测试框架 + 边界测试补充
- `ring dump-ast` / `ring dump-hir` CLI 命令

### Phase 3c：标准库成型

- 标准库从 intrinsic 迁移为 Ring 源码 + 编译器 intrinsic 混合
- 形成 ring-std 包结构
- 标准库测试套件

### Phase 4：自举

- 用 Ring 从零写编译器，TS 版作为参考
- ring-ts 编译 ring-ring → ring-ring 通过所有 e2e 测试
- 定点测试通过
- TS 版退役

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| 模块系统设计不当导致返工 | 研究 Koka/Rust 模块设计；标准库作为第一个用户验证 |
| 标准库 API 不好用 | 标准库和编译器同步迭代，API 不提前固化 |
| TS 重构引入 regression | golden output 测试作为安全网 |
| Ring 语言能力不足以写编译器 | Phase 3a 迷你 lexer 验证是硬门槛 |
