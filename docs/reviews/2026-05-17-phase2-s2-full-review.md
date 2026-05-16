# Phase 2 Session 2 完成后全仓审查

**日期**: 2026-05-17
**审查方法**: DeepSeek V4 Pro × 2 + Claude Explore × 2 并行审查，关键发现人工代码验证
**审查范围**: 全仓代码（非增量），覆盖编译器源码、设计文档一致性、测试覆盖率、项目架构

---

## Critical — 类型安全漏洞 ✅ FIXED

### C1. Effect row unification 不完整 ✅ FIXED

抽取 `unify_effect_rows()` 函数：
- fail ↔ fail: unify error_type
- custom ↔ custom (same name): unify type_args
- io ↔ io, mut ↔ mut: no-op
- 开放行 tail: unify tail variables
- 保持宽松模式（纯函数可 unify 到有 effect 的函数），Session 3 row polymorphism 会收紧

### C2. `apply_to_effect_row` 不解析 tail ✅ FIXED

tail 现在通过 substitution 链追踪：var→var 保留新 id，var→concrete 关闭行。

---

## High — 已修复

### H1. 缺少 `assertNever` 守卫（3 处） ✅ FIXED

| 位置 | 函数 |
|------|------|
| `codegen.ts` `gen_pattern_condition` | 新增 Pattern kind 时不会编译报错 |
| `codegen.ts` `gen_pattern_bindings` | 同上 |
| `infer.ts` `resolve_type_expr` | 新增 TypeExpr kind 时不会编译报错 |

### H2. Dictionary 参数命名模式未集中化 ✅ FIXED

硬编码 `` `__${type_param}_${trait_name}` `` 出现在 codegen.ts 和 infer.ts 共 3 处，已抽取为 `hir/index.ts` 的 `trait_bound_param_name()` 函数。

### H3. Effect 名称提取逻辑重复 ✅ FIXED

`get_evidence_params` 和 `emit_toplevel_evidence` 中 10 行完全相同的 effect name 提取 + 排序逻辑，已抽取为 `extract_effect_names()` 工具函数。

### H4. `_tag` 判别字段硬编码 4 处 ✅ FIXED

`"_tag"` 字符串已抽取为 `hir/index.ts` 的 `ENUM_TAG_FIELD` 常量。

### H5. 测试 harness 无负面测试支持 — 推迟到 Session 4

E2E runner 只验证 stdout 成功输出，不检查 stderr / exit code，无预期失败测试。Session 4 做 LSP + `--error-format=llm` 时一起处理。

---

## Medium

### M1. CLAUDE.md 数据过时 ✅ FIXED

| 声明 | 实际 | 状态 |
|------|------|------|
| "42 个端到端测试" | 51 个（17 cases × 3 modes） | 已更新 |
| "已知限制：mut effect 未特殊处理" | Session 2b 已完成 Cell\<T\> + mut | 已删除 |
| "one-shot resume 未实现" | 隐式 resume 已工作 | 已更新描述 |
| "14 个 e2e cases" | 17 个 cases | 已更新 |

### M2. `io.read` 返回类型不一致 — 保持现状

- `docs/design.md:221` 设计为 `fn read(path: Str) -> Bytes`（目标设计）
- `env.ts:126-131` 实现为 `-> Str`（当前实现）
- 决策：design.md 是目标设计，代码是当前实现，不一致可接受

### M3. 错误码系统缺失

Phase 2 spec 设计了结构化错误码（`"E0301"` 等），但 `Diagnostic` 接口无 `code` 字段。属 Session 4 范围。

### M4. codegen effect 参数类型断言 ✅ FIXED

`codegen.ts:146` 的 `as { name?: string }` 类型断言已通过正确类型化消除。

### M5. Trait + Effect 交互未测试

已知限制"Trait dictionary dispatch 不转发 evidence"无测试证明或防止回归。

---

## Low

### L1. Phase 1 spec 与实际模块结构偏差

Spec 规划了 `effects.ts`、`resolver.ts`、`lower.ts`，实际合并到 `infer.ts` + `unify.ts`。合理简化，文档未同步。

### L2. `StructField.refinement` 在 spec 中定义但 AST 中缺失

Phase 1 spec 定义了 `refinement?: Expr` 字段，实际 where 子句解析后丢弃。与已知限制一致。

### L3. Parser 无错误恢复测试

41 个 parser 测试全部正向。无格式错误输入测试。

### L4. 单元测试不验证错误消息文本

Checker 测试只验证抛出错误，不验证消息的用户友好性。

---

## 架构评估（正面发现）

| 维度 | 评分 | 说明 |
|------|------|------|
| 模块边界 | 优秀 | 无循环依赖，AST→HIR→JS 管线清晰 |
| 共享约定 | 良好 | `hir/index.ts` 集中命名函数 |
| TypeScript 严格配置 | 优秀 | strict + noImplicitReturns + noUnusedLocals |
| 无 TODO/FIXME/HACK | 优秀 | 代码库无技术债标记 |
| 生成 JS 可读性 | 良好 | 生成代码结构清晰可调试 |
