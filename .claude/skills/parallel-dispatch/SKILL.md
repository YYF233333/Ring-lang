---
name: parallel-dispatch
description: Use when user wants to execute multiple implementation tasks in parallel — "执行 Iteration N", "并行执行 A1/A2/C1", or any batch of independent tasks. Analyzes dependencies, partitions into waves, executes via worktree-isolated agents, auto-continues between waves if verification passes.
---

# Parallel Dispatch Orchestrator

你是 orchestrator。用户给你一份执行 spec（含任务列表），你分析依赖、划分 wave、用 worktree agent 并行执行、wave 间验证、自动推进。

## 触发条件

用户说类似："执行 Iteration N"、"并行跑 A1 A2 C1"、"继续"（在已有 plan 的上下文中）、或给出一批任务要求并行完成。

## 核心原则

1. **Wave 间自动推进**：验证通过 → 直接启动下一波，不等用户确认
2. **出问题才停下**：merge 冲突无法自动解决、测试失败、base commit 不对 → 停下来报告用户
3. **Orchestrator 不实现任务**：你调度和合并，不自己写代码

## 工作流

```
用户给出 spec/任务列表
    ↓
Step 1: 分析仓库状态 + 文件依赖
    ↓
Step 2: 划分 Wave（按文件冲突分组）
    ↓
Step 3: 呈现计划，等用户一次性 approve
    ↓
Step 4: 执行 Wave N
    ├─ 启动 worktree agents（并行）
    ├─ 等待全部完成
    ├─ 验证 base commit
    ├─ Review 源码 diff
    ├─ 顺序 merge 回 main
    ├─ Rebuild + 全量测试
    ↓
验证通过？
    ├─ YES → 自动启动 Wave N+1（回到 Step 4）
    └─ NO  → 停下来，报告问题，等用户决策
    ↓
所有 Wave 完成 → 最终报告
```

## Step 1: 分析仓库状态

```bash
git log --oneline -1          # 记录 main HEAD（后续 agent 验证用）
git status --short             # 确认 main 干净
```

对每个任务，列出它会修改的文件（source files only，不算 dist/）。

## Step 2: 划分 Wave

按文件冲突将任务分组：

- **同一 Wave**：任务间零文件重叠，可安全并行
- **不同 Wave**：任务间有文件重叠，必须串行（前一波 merge 后才启动下一波）
- **Wave 内排序**：无所谓（并行执行）
- **Wave 间排序**：有依赖的任务排后面的 Wave

每 Wave 最多 3 个 worktree agent（避免资源争抢）。

## Step 3: 呈现计划

向用户展示：

```markdown
## 并行执行计划

**Main HEAD**: `<commit-hash>`

### Wave A（3 worktrees 并行）
| 任务 | 触碰文件 | 与其他任务冲突 |
|------|---------|--------------|
| X1   | a.ring, b.ring | 无 |
| X2   | c.ring, d.ring | 无 |
| X3   | e.ring         | 无 |

### Wave B（Wave A merge 后，2 worktrees 并行）
| 任务 | 触碰文件 | 依赖 |
|------|---------|------|
| X4   | a.ring, c.ring | 需要 X1+X2 的结果 |
| X5   | f.ring         | 无直接依赖 |
```

等用户一次性 approve。**不逐项审批。**

## Step 4: 执行 Wave

### 4a. 记录 base commit

```bash
git log --oneline -1   # 记为 EXPECTED_BASE
```

### 4b. 并行派发 worktree agents

**关键：在同一条消息中发出所有 Agent 调用，让它们并发执行。**

每个 agent 使用 `isolation: "worktree"` + `run_in_background: true`：

```
Agent({
  description: "WT<wave><n>: <task-id> <short-desc>",
  isolation: "worktree",
  run_in_background: true,
  prompt: "<agent prompt>"
})
```

### Agent Prompt 模板

```
你是 Ring-lang 编译器的实现 agent。你在一个隔离的 git worktree 中。

**CRITICAL: 首先验证 base commit。** 执行 `git log --oneline -1`，
确认输出为 `<EXPECTED_BASE>`。如果不是，立即停止并报告
"Base commit mismatch: expected <EXPECTED_BASE>, got XXX"。

## 任务
<TASK_SPEC — 包含完整的实现步骤、代码示例、要修改的文件>

## 项目上下文
- Ring-lang 是自举编译器（Ring 写 Ring），产出 JavaScript
- 编译器源码：compiler/*.ring，编译产出：compiler/dist/
- 重编译：node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
- 测试：cd compiler && npm test
- <当前测试数/总数>
- <其他相关上下文，如 TypeEnv 已拆分为子结构等>
```

Prompt 要点：
- **包含足够的实现细节**：文件路径、代码片段、变更模式。Agent 没有 session 上下文。
- **base commit 验证是必须的**：Claude Code worktree 有 race condition，可能拿到旧 base。
- **明确禁止额外重构**：只做 spec 范围内的改动。

### 4c. 等待完成

所有 agent 完成后会自动通知。

### 4d. 验证每个 agent 结果

对每个完成的 agent：

1. **检查 base**：`git log --oneline -3` 确认 base commit 正确
2. **Review diff**：`git diff HEAD~1 -- ":(exclude)compiler/dist/*"` 检查源码改动
3. **标记结果**：✅ 通过 / ⚠️ 需清理 / ❌ 失败

如果 base 错误（严重落后）：标记 ❌，该任务需要在正确 base 上重做。

### 4e. 顺序 merge

按冲突由少到多的顺序 merge：

```bash
# 获取 worktree 实际 HEAD（branch ref 可能没更新）
cd <worktree-path> && git rev-parse HEAD

# 回到 main 执行 merge
cd <main-repo> && git merge <commit-hash> --no-edit
```

dist/ 冲突处理：
```bash
git checkout --ours compiler/dist/     # 取 main 版本
git add compiler/dist/
git commit --no-edit
```

源码冲突处理：
- **自动可解决**（如两个任务改同文件不同区域）：手动 Edit 解决 → commit
- **语义冲突**（需要判断哪个版本正确）：停下来问用户

### 4f. Rebuild + 全量测试

每次 merge 后：
```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

全部 merge 完成后，提交 dist 重建：
```bash
git add compiler/dist/
git commit -m "chore: rebuild dist after Wave <X> merge (<task-list>)"
```

### 4g. 验证通过 → 自动推进

如果测试全绿：
1. 报告 Wave 结果（简表）
2. **直接启动下一个 Wave**（不等用户确认）

如果测试失败：
1. 定位问题（二分 revert 找到哪个 merge 引入的）
2. 报告用户，等待决策

## 最终报告

所有 Wave 完成后：

```markdown
## 执行完成

| Wave | 任务 | 状态 | 测试 |
|------|------|------|------|
| A | X1, X2, X3 | ✅ | 355/355 |
| B | X4, X5 | ✅ | 358/358 |

**总计**: N 个任务, M 个 Wave, 全部通过
**测试**: 起始 353 → 最终 358 (+5 新测试)
```

## 特殊情况处理

| 情况 | 处理 |
|------|------|
| Agent base commit 错误 | ❌ 标记失败，在正确 base 上重新派发 |
| Agent 编译失败未能 commit | ❌ 标记失败，报告错误信息 |
| Merge 冲突（dist/ only） | checkout --ours，rebuild 覆盖 |
| Merge 冲突（源码，可解决） | 手动 Edit 解决，优先取 match 的新风格 |
| Merge 冲突（源码，语义冲突） | 停下来问用户 |
| 测试回归（merge 后） | 二分定位，revert 问题 merge，报告用户 |
| 同一 Wave 两个任务都改 types.ring | 允许——只要改的是不同函数/区域，merge 通常自动成功 |

## 注意事项

- **不要串行派发**。同一 Wave 的所有 agent 必须在同一条消息中并行发出。
- **Orchestrator 不实现任务**。你调度和合并，不自己写代码。
- **Base commit 验证是必须的**。每个 agent prompt 的第一件事。
- **dist/ 是编译产物**。冲突一律 checkout --ours 然后 rebuild 覆盖。
- **Wave 间自动推进是默认行为**。只在出问题时才停下来。
