---
name: audit-fix
description: Use when user wants to fix items from docs/audit-report.md — "修 audit", "fix audit items", "处理审计项". Reads the rolling audit ledger, presents unfixed items for user triage, then executes fixes batch by batch.
---

# Audit Fix

Companion to `/full-audit`. Reads `docs/audit-report.md`, presents unfixed items, and drives the fix cycle.

## Trigger

User says: "修 audit", "fix audit items", "处理审计项", "audit fix", or `/audit-fix`.

Optional argument: item numbers or severity filter, e.g. `/audit-fix #54-57` or `/audit-fix bugs`.

## Workflow

### Step 1: Read & Present

1. Read `docs/audit-report.md`
2. Extract all unfixed items (no strikethrough, no `**已修复**`)
3. Present to user as a numbered list grouped by severity:
   - **Bug**: must fix (list items)
   - **Issue**: should fix (list items)
   - **Concern**: consider fixing (list items)
   - **Suggestion**: optional (list items)
4. Ask user which items to fix in this session (or accept argument filter)

### Step 2: Classify

For each selected item, classify:

| Category | Action |
|----------|--------|
| **Trivial** (one correct fix, < 20 lines) | Fix immediately |
| **Needs discussion** (multiple approaches) | Present options, wait for user decision |
| **Complex** (large refactor, cross-cutting) | Propose plan, get user approval |
| **Won't fix** (user decides) | Mark in audit-report.md with reason |

### Step 3: Fix Cycle

Process items in severity order (bugs first):

1. **Batch trivial fixes** — fix all trivial items together, run tests after batch
2. **Decision items one-by-one**:
   - Explain the problem
   - List options (A/B/C) with tradeoffs
   - Wait for user decision
   - Implement chosen option
3. **After each batch**: run `cd compiler && npm test`
4. **Regression tests**: add for any non-trivial bug fix

### Step 4: Update audit-report.md

After each batch of fixes:
- Mark fixed items with strikethrough + `**已修复**：{brief description}`
- Update the header statistics (fixed count)
- Do NOT delete items — preserve audit history

### Step 5: Rebuild & Verify

After all fixes in this session:
1. Rebuild compiler: `node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist`
2. Run full test suite: `cd compiler && npm test`
3. Update CLAUDE.md if any behavior or known limitations changed
4. Update docs/design.md if implementation status changed

### Step 6: Commit

Commit with message format:
```
fix(audit): batch fix N audit items — {brief summary}

Fixed: #XX, #YY, #ZZ
```

## Rules

- **Never skip a selected item silently.** Every item user selected must be either fixed, discussed, or explicitly marked won't-fix with user approval.
- **Never apply a temp fix.** If a proper fix is too complex for this session, tell the user — don't patch around it.
- **Regression tests are mandatory** for bug-severity fixes. The test should fail without the fix and pass with it.
- **Build before claiming fixed.** Run tests after code changes. Verify the fix actually works.
- **Respect user's selection.** Only fix what the user asked for. Don't scope-creep into unfixed items the user didn't select.
