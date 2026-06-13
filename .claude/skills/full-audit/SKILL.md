---
name: full-audit
description: Use when user requests a full codebase review, code audit, cross-validation review, or says "审查", "review", "自查". Runs a multi-lens adversarial audit workflow (finder fan-out + skeptic verify + loop-until-dry), triages findings, writes to audit-report.md. Audit-only — fixes go to Worker via backlog/audit-report. Also supports exemption-list adversarial spot-check mode ("审豁免").
---

# Audit Agent

全代码库审计。审查当前 main 上的代码，发现 bug 和问题，写入 `docs/audit-report.md`。只审查，不修复。

**工作流规范见 `docs/workflow.md`**

> 2026-06-12 升级：审计执行从「双 agent 单轮」升级为 **Workflow 对抗审计编排**（finder fan-out → adversarial verify → loop-until-dry）。目的：误报在到用户手上之前被 skeptic 杀掉（用户 triage 时间是真实成本），漏报由视角多样性 + dry 收敛压低。本 skill 的指令即 Workflow 工具的用户 opt-in。

## Trigger

- User says: "审查", "review", "自查", "全面检查", "交叉验证", or `/full-audit` → **标准审计**（默认，单轮 fan-out + verify，workflow 跑完即停）
- User says "彻底审查", "audit until dry", "审到收敛" → **thorough 档**（loop-until-dry，连续 2 轮零新 confirmed 才停；token 消耗约为标准档 2-3 倍）
- User says "审豁免", "豁免抽审", or `/full-audit exemptions` → **豁免清单对抗抽审**专项模式（见下）

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

### Phase 0: 准备

1. 读 `docs/backlog.md`（`planning`/`doing` 项清单——喂给 verify 阶段的 already-tracked 视角）+ `docs/audit-report.md` 现有 `[open]` 项（喂给 dedup）。
2. 确定本轮 **finder lens 集**。基准六维（按近期改动面增删，每轮在 prompt 里写明该 lens 的近期重点文件）：

| lens | 关注面 | 历史战果类型 |
|------|--------|------------|
| `rc-memory` | perceus / verify_rc / runtime dup-drop 配对、UAF/泄漏/double-free | #150 fold 洞、W4 UAF |
| `type-soundness` | checker/infer 健全性、过度泛化、说谎的类型 | #149 TypeVar 洞、B-107 Map key |
| `backend-parity` | codegen vs codegen_llvm 语义分歧、G-b/G-c 地雷 | #137 reverse/sort 分歧 |
| `runtime-abi` | ring_runtime.cpp C ABI 边界、堆溢出、panic-stub、missing symbol | #148 join 溢出、#136/#138 |
| `design-drift` | design.md/CLAUDE.md 陈述 vs 实现一致性 | 立项前实测前提条款的源头 |
| `oracle-blind` | JS oracle 自身失真、差分测不出的类（B-100 登记类） | #148 同属此类 |

3. **DS Agent 条款（独立模型交叉验证）**：DS CLI 可用的机器上**必须**并行派发一路 DS 独立审计（`deepseek exec --auto --json --disable subagents`，禁 sub-agent 保前缀缓存），其 findings 注入 Phase 1 的 verify 阶段与 Claude findings 同等对待。**本机现状无 deepseek CLI**（见 memory）→ 该路不可达时不阻塞审计，由 workflow 多 lens fan-out 的视角多样性部分替代；不得以此为由在 DS 可用的机器上省略 DS。

### Phase 1: Workflow 对抗审计

用 Workflow 工具执行（脚本骨架如下，lens prompt 按 Phase 0 现写）。结构三要点：

1. **Find**：每 lens 一个 finder agent，结构化输出 findings（read-only，禁止修代码）。
2. **Verify（对抗，核心）**：每个 fresh finding 派 3 个**不同视角** skeptic，每个默认 `refuted=true`，≥2 票不可证伪才存活：
   - `refute-correctness`：读源码证明该 finding 是误读（行为实际正确 / 防御已存在 / 类型不可达）
   - `reproduce`：构造最小复现（探针程序 / 推演执行路径）——复现不出 = refuted。**立项前实测前提**条款（workflow.md）在此强制执行
   - `already-tracked`：对照 backlog `planning`/`doing` 项 + audit-report 现有 `[open]` 项——已有追踪 = refuted（标注对应 ID 后丢弃）
3. **收敛**：standard 档（默认）= **单轮，find + verify 后直接 return，不循环**；thorough 档 = loop-until-dry（dedup 对 `seen` 全集做，不对 confirmed——否则被 refute 的 finding 每轮复活，永不收敛）。

```js
export const meta = {
  name: 'full-audit',
  description: 'Multi-lens adversarial codebase audit',
  phases: [{ title: 'Find' }, { title: 'Verify' }],
}
const FINDINGS = {type:'object', required:['findings'], properties:{findings:{type:'array', items:{
  type:'object', required:['title','file','severity','evidence'],
  properties:{title:{type:'string'}, file:{type:'string'}, line:{type:'number'},
    severity:{enum:['critical','medium','low']}, evidence:{type:'string'}, fix_direction:{type:'string'}}}}}}
const VERDICT = {type:'object', required:['refuted','reason'], properties:{refuted:{type:'boolean'}, reason:{type:'string'}}}
const key = f => `${f.file}:${f.title}`
const seen = new Set(/* 现有 [open] 项的 file:title，Phase 0 注入 */), confirmed = []
let dry = 0
while (dry < DRY) {            // standard（默认）: DRY=1，首轮 find+verify 后无条件 break（不循环）；thorough: DRY=2
  const found = (await parallel(LENSES.map(l => () =>
    agent(l.prompt, {label:`find:${l.key}`, phase:'Find', schema:FINDINGS})
  ))).filter(Boolean).flatMap(r => r.findings)
  const fresh = found.filter(f => !seen.has(key(f)))
  if (!fresh.length) { dry++; continue }
  dry = 0; fresh.forEach(f => seen.add(key(f)))
  const judged = await parallel(fresh.map(f => () =>
    parallel(['refute-correctness','reproduce','already-tracked'].map(v => () =>
      agent(VERIFY_PROMPTS[v](f), {label:`verify:${f.title}`, phase:'Verify', schema:VERDICT})))
      .then(vs => ({f, alive: vs.filter(Boolean).filter(x => !x.refuted).length >= 2,
                    reasons: vs.filter(Boolean).map(x => x.reason)}))))
  confirmed.push(...judged.filter(j => j.alive).map(j => ({...j.f, verify_notes: j.reasons})))
  log(`round: +${judged.filter(j=>j.alive).length} confirmed (total ${confirmed.length}), killed ${judged.filter(j=>!j.alive).length}`)
}
return { confirmed, killed_total: seen.size - confirmed.length }
```

**No silent caps**：若因预算砍了 lens 或轮次，Summary 必须写明砍了什么。

### Phase 2: Orchestrator Triage（workflow 之后，人工不可省的部分）

workflow 已做掉 dedup + 三视角验证。orchestrator 余下：

1. **Critical 亲自确认**：`[critical]` 级 finding 必须自己读码复核（skeptic 多数票不替代这条规则）
2. **严重度/dispatch 终审**（标准沿用）：
   - 严重度只允许 `critical` / `medium` / `low`
   - `mechanical`：修复方向唯一确定，spec 能完整描述"改哪里、怎么改"
   - `judgment`：涉及设计选择、架构权衡、effect system 推理
3. 被 skeptic 杀掉的 findings 不进报告，但 Summary 给一行统计（数量 + 典型 refute 理由）——保证「Never skip a finding silently」可审计

### Phase 3: Update audit-report.md

`docs/audit-report.md` 是**活的 bug 看板**——做完即删。

**格式规则（CRITICAL——Worker 依赖 `grep "\[open\]"` 扫描条目，格式不对 = Worker 看不见）**：

每个条目**必须**是 heading 格式：
```markdown
### #xxx <标题> [严重度] [dispatch] [open]

<问题描述，含文件路径、行号、影响、建议修复方向>

发现者：<lens 名 / DS / Opus+DS>
```

- **`[open]` 标记不可省略**——没有 `[open]` 的条目 Worker 扫描不到
- **严重度只能是 `critical` / `medium` / `low`**；**dispatch 只能是 `mechanical` / `judgment`**
- **禁止使用表格格式**——必须用 `###` heading
- 新发现追加到对应分类 section 末尾；编号从现有最大编号 +1 继续
- **清理规则**：检查现有 `[open]` 项是否已被修复（grep 代码确认）——已修复的直接删除整个条目，commit message 留记录
- **格式验证（写入后自检）**：`grep -n "\[open\]" docs/audit-report.md`，新条目必须在输出中

### Phase 3.5: Write Observations to Feedback

不算 bug 但值得注意的现象写入 `docs/worker_feedback.md`（`[观察]`）：代码异味、设计-实现微妙不一致、潜在改进方向、技术上正确但令人困惑的行为。

```markdown
## Audit 观察报告（日期）

### N. [观察] 标题

**现状**：描述观察到的现象
**为什么值得注意**：为什么不是 bug 但值得关注
```

### Phase 4: Summary

```
## Audit Summary
- 档位: standard | thorough（N 轮收敛）
- 新发现: N 项（X critical, Y medium, Z low）
- skeptic 杀掉: M 项（典型理由：…）
- 观察: O 项（写入 worker_feedback.md）
- 清理已修复: P 项删除
- 当前 open 总数: K 项；需要关注的 critical: (列出)
- 覆盖缺口（如有砍删）: …
- 格式验证: grep "\[open\]" 命中 K 项 ✓
```

## 专项模式：豁免清单对抗抽审

**对象**：`compiler/verify_rc.ring` 头注的豁免清单（leak-direction 豁免类 + codegen 级边界 + abort 路径 + 规则级不入账）。D2 verifier 上线即抓出 3 个真实潜伏漏洞——豁免类里「保守正确」的论证同样可能有洞。

**编排**：每个豁免类派一个 skeptic agent，任务二选一交差：
1. **构造反例**：写出一个属于该豁免类、但实际不安全（UAF 方向）或泄漏无界（非有界常数）的程序形态——给出形态 + 推演的执行路径；
2. **挑论证的洞**：该类的安全/有界论证依赖的前提里，哪条没有被测试或不变量钉住（指出具体缺失的回归锚点）。

两者都做不到 → verdict = 论证成立（写明检查过哪些路径）。发现 → 按正常流程进 audit-report（UAF 方向标 `[critical]`/`[medium]`，无界泄漏标 `[medium]`）；缺锚点 → `[观察]` 进 worker_feedback。Summary 给逐类 verdict 表。

**注意**：豁免清单是 verify_rc.ring 头注 + 运行尾随 boundary note 两处，先读两处核对类目一致再派发；抽审用例可以写探针程序跑（measurement-only），但不得改编译器代码。

## Rules

- **Never skip a finding silently.** Every finding must be either recorded, or counted in the killed statistics with a refute reason.
- **Never fix in audit session.** Audit = observe + record.
- **Critical findings need orchestrator's own eyes.** Skeptic 票数不替代亲自读码。
- **Respect Worker state.** Check backlog for `planning`/`doing` items; don't report issues that are being actively worked on.
- **Clean as you go.** Delete fixed items from the report. The report should only contain open issues.
- **No silent caps.** 预算导致的 lens/轮次裁剪必须出现在 Summary。
