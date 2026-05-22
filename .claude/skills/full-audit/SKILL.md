---
name: full-audit
description: Use when user requests a full codebase review, code audit, cross-validation review, or says "审查", "review", "自查". Runs Claude + DS parallel audit, triages findings, writes to audit-report.md. Audit-only — fixes go to Worker via backlog/audit-report.
---

# Audit Agent

全代码库审计。审查当前 main 上的代码，发现 bug 和问题，写入 `docs/audit-report.md`。只审查，不修复。

**工作流规范见 `docs/workflow.md`**

## Trigger

User says: "审查", "review", "自查", "全面检查", "交叉验证", or `/full-audit`.

## 写入范围

- **Bug / 问题** → `docs/audit-report.md`
- **观察 / 非 bug 现象** → `docs/worker_feedback.md`（`[观察]` 类型条目）

**不触碰**：编译器代码、测试、CLAUDE.md、design.md

## Race Condition 处理

仓库中**可能有 Worker agent 在 worktree 中并行工作**。注意：

- Worker 可能正在修改编译器代码并尚未 merge
- 编译或测试失败可能是瞬态（Worker 的 worktree merge 过程中）→ **重试一次再判断**
- 跳过 `tests/.tmp_*` 等临时目录
- 如果发现的问题与 backlog 中 `planning`/`doing` 状态的 item 重合，标注"可能正在修复中"
- 读 `docs/backlog.md` 了解当前 Worker 正在做什么，避免重复报告

## Workflow

### Phase 1: Parallel Audit

Dispatch two independent review agents simultaneously:

1. **Claude Agent** (subagent_type: general-purpose, model: opus):
   - Read all compiler source files
   - Check for bugs, type unsoundness, edge cases
   - Verify behavior matches CLAUDE.md and docs/design.md descriptions
   - Test least-surprise principle: would a user be confused by any behavior?
   - Write e2e test cases for suspicious code paths and run them

2. **DS Agent** (via deepseek-dispatch skill):
   - Independent read-only audit
   - Focus on: missed error handling, unsafe patterns, design-implementation gaps
   - Compare implementation against design.md specification

Both agents output structured findings:
```
## [severity: Critical|Important|Minor|Style]
### Title
- **File**: path:line
- **Description**: what's wrong
- **Evidence**: code snippet or test that demonstrates
- **Fix**: proposed solution (if trivial) or "needs discussion"
```

### Phase 2: Triage & Merge

1. **Deduplicate**: same finding from multiple agents → one entry
2. **Verify critical findings**: for Critical severity, read code yourself to confirm
3. **Check backlog overlap**: if finding matches a `planning`/`doing` item → skip or note "in progress"
4. **Classify**:

| Category | Action | 写入位置 |
|----------|--------|---------|
| **Critical** (confirmed bug) | Record with fix suggestion | audit-report.md |
| **Important** (definite but non-critical) | Record | audit-report.md |
| **Minor** (low impact) | Record | audit-report.md |
| **Style** (improvement idea) | Record | audit-report.md |
| **Observation** (不算 bug 但值得注意的现象) | Record as `[观察]` | worker_feedback.md |
| **False positive** | Discard with explanation | — |

### Phase 3: Update audit-report.md

`docs/audit-report.md` 是**活的 bug 看板**——做完即删。

**追加规则**：
- 新发现追加到对应分类 section 的表格中
- 编号从现有最大编号 +1 继续
- 每个发现标注发现者（如 `Opus+DS`）

**清理规则**：
- 检查现有 `open` 状态的 item 是否已被修复（grep 代码确认）
- 已修复的：**从表中删除**（不是标删除线，是直接删除整行）
- 在 commit message 中记录删除了哪些已修复的 item

**条目格式**：

```markdown
### #xxx <标题> [严重度] [open]

**文件**：涉及的文件路径
**描述**：问题描述
**建议修复**：修复方向
```

### Phase 3.5: Write Observations to Feedback

不算 bug 但值得注意的现象写入 `docs/worker_feedback.md`：
- 代码异味（不违反规范但不符合直觉）
- 设计-实现微妙不一致（不影响正确性但可能误导读者）
- 潜在改进方向（不是当前阶段的优先事项但值得记录）
- 令人困惑的行为（用户可能被绊倒但编译器行为"技术上正确"）

格式：

```markdown
## Audit 观察报告（日期）

### N. [观察] 标题

**现状**：描述观察到的现象
**为什么值得注意**：为什么不是 bug 但值得关注
```

### Phase 4: Summary

```
## Audit Summary
- 新发现: N 项（X Critical, Y Important, Z Minor, W Style）
- 观察: O 项（写入 worker_feedback.md）
- 清理已修复: M 项删除
- 当前 open 总数: K 项
- 需要关注的 Critical: (列出)
- audit-report.md 已更新
```

## Rules

- **Never skip a finding silently.** Every item must be either recorded or explicitly marked as false positive.
- **Never fix in audit session.** Audit = observe + record.
- **Cross-validate critical findings.** For Critical items, verify code yourself before recording.
- **Respect Worker state.** Check backlog for `planning`/`doing` items; don't report issues that are being actively worked on.
- **Clean as you go.** Delete fixed items from the report. The report should only contain open issues.
