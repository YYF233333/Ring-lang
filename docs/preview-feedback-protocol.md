# Ring Preview 激活与反馈回流协议

> 本协议定义 release candidate 出现后如何观察首个用户闭环、收集可复核反馈并把重复问题收敛为永久改进。它不是 B-111 的 Ring vs TypeScript 对照实验，也不授权当前招募、发布或修改外部平台。

## 1. 要回答的问题

首轮 preview 只回答三个产品问题：

1. 一个不熟悉 Ring 的用户和 coding agent，能否不读取仓库实现、不接受项目作者实时教学，从 candidate bundle 完成一个小型 native CLI？
2. 失败时，用户能否凭 `doctor`、compiler diagnostic、版本匹配 skill/inspection、primer 和 public signatures 自己回到正确路径？
3. 每个失败是否能形成可重放 evidence，并被路由到 compiler/test、diagnostic、primer/docs、packaging 或明确非目标？

首轮不回答市场规模、长期留存、Ring 是否优于 TypeScript，也不证明所有通过 CI 的补丁正确。后三者分别需要独立分发数据、B-111 与 B-182。

## 2. 目标场景与输入隔离

**参与者**：会使用 coding agent 和命令行、但没有参与 Ring 实现的人。PL 专家和普通应用开发者分层记录，不能把专家结果混成普通 onboarding 成功率。

**任务形状**：一个有参数、输入校验、文件或标准输入、数据变换和可执行输出的小型 CLI；至少触发 `io` 与可恢复失败路径，并包含一个多模块版本。精确题目不复用 B-111 预注册 benchmark，避免训练/试用 traces 污染后续对照。

**参与者只获得**：

- candidate archive、checksum 与安装说明；
- bundle 自带的版本匹配 provider-neutral agent skill、inspection schema、primer、std public signatures 和 quickstart；
- 任务说明、公开验收例和不可见 smoke oracle；
- 结构化反馈入口。

**不得获得**：源码仓库历史、实现文件、隐藏 oracle、项目作者的即时答案或为该参与者定制的额外示例。确需介入时先记录时间点、阻塞原因和介入内容；该 run 仍可用于问题诊断，但不计“无人介入激活”。

## 3. 激活事件

一次 run 从参与者首次打开 archive/说明开始，依次记录：

1. 验证 checksum，解压或安装；
2. 在非仓库目录运行 `ring doctor`；
3. 校验 compiler/schema/skill/primer/signatures identity，将 bundled skill 安装或复制到干净 agent workspace；任一失配立即标 invalid；
4. 让 agent 只依据任务、bundled skill/primer/signatures 与候选包公开 CLI 生成程序，并保留语义查询记录；
5. 执行 `ring check`，把完整结构化 diagnostic 原样反馈给 agent；
6. 重复修正直到编译通过或参与者放弃；
7. 执行公开例与隐藏 smoke oracle；
8. `ring run` 成功后生成 native executable；
9. 从另一个工作目录运行 executable，确认不依赖源码 checkout；
10. 填写退出问卷：成功、主动放弃、工具阻塞、任务理解错误或协议无效。

**主激活事件**：无项目作者介入，candidate bundle 从干净目录完成上述 1–9，隐藏 oracle 全绿且没有未声明 runtime surprise。

首轮内部 calibration 不预设一个凭直觉产生的“15 分钟成功”阈值：完整记录实际分布和放弃点，形成 baseline；在看过 calibration 结果后、外部 cohort 开始前，固定 time budget、最大修正轮数和成功阈值。阈值一旦预注册，不得为美化结果事后移动。

## 4. Run evidence envelope

每次 run 分配不可变 `run_id`，保存以下字段；缺少必填字段的 run 标为 invalid，不与正式结果合并。

| 类别 | 必填字段 |
|---|---|
| Candidate identity | archive SHA-256、Ring version、compiler commit、tracked anchor hash、target triple、inspection schema version、skill/primer/signatures hash |
| Environment | OS/arch、shell、clang/gcc 版本、CPU/RAM、冷/热缓存声明 |
| Participant | 经验分层、是否参与 Ring、是否事先看过任务；公开报告使用匿名 ID |
| Agent | provider、精确 model/version、system prompt、temperature、上下文/输出预算、工具权限 |
| Timeline | start、doctor、first generation、first check、first compile-green、first hidden-green、exe success、end |
| Loop | 每轮 prompt、语义查询与返回、源码/patch、diagnostic、退出码、token、wall time、人工介入 |
| Outcome | success/abandon/invalid、隐藏测试结果、runtime surprise、退出原因与首个阻塞阶段 |
| Consent | 哪些 raw trace 可公开、必须删除/脱敏的字段、保留期限 |

原始 prompt、源码和日志可能含本地路径、账号、密钥或私人输入。默认先脱敏再持久化；参与者未明确允许公开时，只发布聚合指标和匿名最小复现。任何秘密进入 trace 后先停止传播，不以“benchmark 可复现”为由越过隐私边界。

## 5. 产品指标

**主指标**：

- activation success / abandon / invalid 数量；
- time-to-doctor-green、time-to-first-compile-green、time-to-hidden-green、time-to-exe；
- agent 修正轮数、总 token、人工介入次数与首次介入阶段；
- compile-green 后隐藏失败或 runtime crash 的次数。

**诊断指标**：

- 安装/发现工具链失败率；
- skill/inspection 不可发现、版本失配、语义查询无法回到权威 checker/HIR 事实的次数；
- 同一 diagnostic 重复出现但 patch 无进展的循环；
- error format 缺失 span、expected/actual、修复动作或稳定 identity 的次数；
- primer/signature 未覆盖的概念或 API；
- 从 repo 外运行时暴露的 std/runtime/path 假设。

参与者满意度和“语言很酷”等主观评价可以保留，但不能替代上述行为证据。stars、视频播放量和 issue 数也不作为激活成功率。

## 6. 反馈分类与优先顺序

| 类别 | 定义 | 默认处置 |
|---|---|---|
| F0 escaped correctness | compile/check/CI 绿色后 wrong-code、crash、资源/ABI 违约或隐藏 oracle 失败 | 立即停止相关 claim/preview lane；最小复现；进入 critical/相称 audit，补永久 oracle |
| F1 false rejection / dead end | 符合现行 spec 的程序被拒，或 compiler feedback 无法导向可接受程序 | 核对 spec；形成 bug/diagnostic regression，不用文档绕过真实 compiler 缺陷 |
| F2 activation/toolchain | 安装、doctor、路径、链接、版本或 artifact discovery 阻塞 | 路由 B-174/B-177/B-175 产品面；保留 clean-environment replay |
| F3 repair friction | diagnostic 正确但含糊、反复、缺少机器字段，或 skill/inspection 不能减少语义搜索，显著增加轮数/token | 路由 B-177 diagnostic/inspection contract；以修正轮数变化验收 |
| F4 primer/std/docs gap | compiler 行为正确，但 primer、签名或常用 std 缺口迫使猜测 | 先确认不是 F1；更新版本匹配材料或立有测量锚点的 std item |
| F5 capability request | 当前明确不支持的新场景 | 记录频次与被阻塞任务；不因单票越过 correctness/release 主线 |

排序原则是 **F0 → F1 → F2 → F3 → F4 → F5**。同类反馈的重复度用于衡量影响，但不能把高票 feature request 排到 escaped correctness 之前。

## 7. 从反馈到永久改进

每份有效反馈遵循同一生命周期：

```text
evidence envelope
  → 在原 candidate 上重放
  → 在当前 main 上确认仍存在
  → 分类 F0–F5 / duplicate / invalid
  → 落入唯一权威层
  → regression 或明确不支持边界
  → candidate 重放
  → 更新 product claim 状态
```

“唯一权威层”只允许以下出口：

- compiler 类型/effect/ownership/RC/ABI 不变量；
- deterministic test、property/fuzz/mutation 或隐藏行为 oracle；
- CLI/package/doctor 产品契约；
- versioned diagnostic/inspection/primer；
- 现行 spec 中明确的非目标。

不能把 compiler bug 写成 FAQ 让用户绕过；不能用模型 reviewer 的 `clear` 替代行为 oracle；不能因无法复现就静默关闭，必须标 `insufficient-evidence` 并列缺失字段。

## 8. 反馈入口草案

正式启用 GitHub Issue Forms 前，先按本节字段生成预览并做一次无提交 dry-run。公开入口至少分三类：

### Bug / correctness

- version/commit/anchor、OS/target、安装来源；
- 最小 `.ring` 程序、命令、完整 stdout/stderr 与退出码；
- expected/actual；是否 compile-green、是否可稳定重现；
- sanitizer/hidden test 证据（若有）；
- 是否允许公开附件。

### Agent loop friction

- model/version、skill/inspection/primer/signature identity、工具权限；
- 从第一个 prompt 到退出的轮次、semantic query 与 diagnostic；
- 首个卡点和是否人工介入；
- token/wall 数据（provider 能提供时）；
- 经脱敏的最小 trace。

### Capability request

- 要完成的用户任务，而不只是期望语法；
- 当前替代方案及失败位置；
- 是否阻塞首个 CLI 场景；
- 可执行验收例。

Issue Form 不收集 secrets，不要求用户公开完整私人仓库。安全敏感报告需要独立私密通道；在该通道、响应责任和 disclosure policy 明确前，README 不承诺 security response SLA。

## 9. Cohort 与停止条件

1. **内部 protocol dry-run**：只验证字段、计时点、hidden oracle 隔离和 bundle 独立性；不能算外部采用证据。
2. **封闭 calibration cohort**：须由用户批准招募与数据边界；参与者之间隔离任务答案，失败也保留。
3. **扩大 preview**：只在预注册 activation/escape budget 达标、F0 已清零且反馈处理容量真实存在时进行。

出现以下任一条件立即停止扩大：新 F0、candidate identity 不可重放、hidden oracle 泄漏、原始 trace 出现秘密、超过团队可处理的反馈积压，或对外措辞越过 [`product-governance.md`](product-governance.md) 的 claim 状态。

## 10. 与 B-111 / B-182 的隔离

- preview activation 观察“产品能否被首次用起来”；B-111 比较 Ring 与 TypeScript 7 的 agent 总成本。二者任务、报告和结论不得混用。
- preview 中发现的失败分类可以改进 compiler/skill/inspection/primer，但 B-111 正式题目、主指标与 Ring 工具面消融必须在 run 前预注册；改进前后的结果分开报告。
- B-182 的 repository patch acceptance 需要历史补丁、seeded mutation、权限隔离和风险分层；preview 用户代码成功不能替代这些证据。

因此，preview traces 是产品反馈语料，不自动成为比较实验或安全证明。
