---
name: full-audit
description: Use when user requests a full codebase review, code audit, cross-validation review, or says "审查", "review", "自查". Runs Claude + DS parallel audit, triages findings, and writes to rolling audit-report.md. Audit-only — fixes are a separate session via /audit-fix.
---

# Full Codebase Audit

Standardized review workflow extracted from Ring-lang development sessions. Covers code correctness, test coverage, design consistency, and least-surprise behavior.

**审计和修复分离**：本 skill 只做审计（发现 + 记录），不做修复。修复使用 `/audit-fix` skill 在独立 session 中执行。

## Trigger

User says any of: "审查", "review", "代码审查", "自查", "全面检查", "交叉验证", or `/full-audit`.

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

Both agents output structured findings in this format:
```
## [severity: bug|issue|concern|suggestion]
### Title
- **File**: path:line
- **Description**: what's wrong
- **Evidence**: code snippet or test that demonstrates
- **Fix**: proposed solution (if trivial) or "needs discussion"
```

### Phase 2: Triage & Merge

Wait for all agents to complete. Merge findings:

1. **Deduplicate**: same finding from multiple agents → one entry, note which agents found it
2. **Verify critical findings**: for any bug-severity finding, read the relevant code yourself to confirm
3. **Classify** each finding:

| Category | Action |
|----------|--------|
| **Bug** (confirmed) | Record with fix suggestion |
| **Issue** (definite but non-critical) | Record |
| **Concern** (possible problem) | Record |
| **Suggestion** (improvement idea) | Record |
| **False positive** | Discard with explanation |

### Phase 3: Update audit-report.md

`docs/audit-report.md` is a **rolling ledger** — it persists across sessions and is never deleted.

**增量追加规则**：
- 新发现追加到文件末尾，以审计日期为 section header（如 `## Phase B Wave 1 审计 (2026-05-22)`）
- 编号从上次最大编号 +1 继续（如上次到 #53，新增从 #54 开始）
- 每个发现标注发现者（如 `Opus+DS`）

**已修复项处理**：
- 修复后用删除线标记（`~~原文~~`）并附 `**已修复**` + 简要说明
- 不删除已修复项（保留审计历史）
- 文件头部更新已修复统计

**不要在本 session 中修复任何问题。** 审计结束后告知用户发现摘要，修复工作留给 `/audit-fix` session。

### Phase 4: Summary

End the audit with a summary to the user:

```
## Audit Summary
- New findings: N total (X bugs, Y issues, Z concerns, W suggestions)
- By agent: Opus found A, DS found B (C shared)
- Critical items requiring attention: (list top 3)
- audit-report.md updated: #NN - #MM added
```

## Rules

- **Never skip a finding silently.** Every item must be either recorded or explicitly marked as false positive with explanation.
- **Never fix in audit session.** Audit = observe + record. Fix = `/audit-fix` in a separate session. This prevents context exhaustion and ensures user reviews findings before action.
- **Cross-validate critical findings.** For bug-severity items, verify the code yourself before recording. If Claude and DS disagree, investigate further.
- **Preserve audit history.** Never delete or rewrite old sections of audit-report.md. Only append and mark fixed items with strikethrough.
- **Note agent agreement.** When multiple agents independently find the same issue, it's higher confidence. Record which agents found each item.
