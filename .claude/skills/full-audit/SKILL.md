---
name: full-audit
description: Use when user requests a full codebase review, code audit, cross-validation review, or says "审查", "review", "自查". Runs Claude + DS parallel audit, triages findings, and drives fix-discuss-commit cycle.
---

# Full Codebase Audit

Standardized review workflow extracted from Ring-lang development sessions. Covers code correctness, test coverage, design consistency, and least-surprise behavior.

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

2. **DS Agent** (via deepseek-dispatch skill, if available):
   - Independent read-only audit of the same codebase
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

### Phase 1.5: Persist Report

**立刻**将合并后的审计报告写入 `docs/audit-report.md`。这是防止 session 中断（上下文过长、网络断连）导致发现丢失的保险措施。后续 Phase 3 每修一批就在报告中标记已修复。全部完成后在 Phase 4 删除。

### Phase 2: Triage

Merge findings from both agents. Deduplicate. Classify each:

| Category | Action |
|----------|--------|
| **Trivial fix** (obvious, single correct solution) | Fix immediately, add regression test |
| **Needs decision** (multiple valid approaches) | Present to user one-by-one with options |
| **False positive** (not actually a bug) | Discard with explanation |
| **Enhancement** (not a bug, but could be better) | Record in findings, don't act |

### Phase 3: Fix Cycle

1. Fix all trivial issues first. Run `npm run lint && npm run test:all` after each batch.
2. Present decision-requiring issues **one at a time**:
   - Explain the problem
   - List options (A/B/C) with tradeoffs
   - Wait for user decision
   - Implement chosen option
   - Add regression test if the bug was non-obvious
3. After each batch of fixes, update `docs/audit-report.md` — mark fixed items with ✅.
4. After all fixes, run full test suite once more.

### Phase 4: Cleanup

1. Update CLAUDE.md: test counts, known limitations, any new conventions discovered
2. Update docs/design.md if implementation behavior changed
3. Delete `docs/audit-report.md`（全部修完才删，修完之前必须保留作为跨 session 的工作清单）
4. Commit with descriptive message listing all fixes

## Rules

- **Never skip a finding silently.** Every item must be either fixed, discussed, or explicitly marked as false positive with explanation.
- **Never apply a temp fix.** If a proper fix is too complex for this session, record it and tell the user — don't patch around it.
- **Regression tests are mandatory** for any bug fix that wasn't trivially obvious. The test should fail without the fix and pass with it.
- **Build before claiming fixed.** Run `npm run build` after code changes. Verify the fix actually works — don't just say "done."
- **Cross-validate when uncertain.** If Claude and DS disagree on whether something is a bug, investigate further before deciding.

## Output

End the audit with a summary:

```
## Audit Summary
- Findings: N total (X bugs, Y issues, Z concerns)
- Fixed: N (list)
- User decisions: N (list)
- False positives: N
- New tests added: N
- Test suite: XXX unit + XXX e2e, all passing
```
