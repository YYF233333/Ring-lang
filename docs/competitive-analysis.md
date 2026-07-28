# Ring-lang 竞品与行业定位

> 最后更新：2026-07-28
>
> 事实截止：2026-07-28（版本、活跃度与 stars 均为时点数据）
>
> 用途：产品定位、路线图取舍、B-001 Refinement Types 与 B-111 LLM eval harness 的证据输入

## 0. 本轮任务记录（已完成）

**目标**：在 2026-06-11 报告保鲜期到期后，重新核验 Ring-lang 的竞品全景、机制窗口、叙事窗口和「够用就行」替代力量；补齐 Verus / AI proof synthesis 缺口，并清除旧版本、旧 stars、旧路线图和失效判断。

**覆盖范围**：

1. 直接与相邻语言：MoonBit、Zero、Mojo、Koka、Effekt、Flix、Unison、Rue、Mog；
2. 主流替代力量：TypeScript 7、Python 工具链、Rust 与 agent 工具集成；
3. 形式化验证与 agent：Verus、MoonBit `moon prove`、AlphaVerus / AutoVerus / RAG-Verus / KVerus / VeriStruct 等；
4. Ring 自身对照：当前 C 后端迁移、RIIR、effect、Perceus RC、自举，以及 B-001 / B-111 的真实状态。

**证据纪律**：

- 时效事实只采用项目官网、官方 GitHub、官方 release notes、论文或会议页面；
- 明确区分「已发货 / 实验性 / 宣称 / 计划」，不把 roadmap 当产品能力；
- 无法确认的事实标为未知，不以搜索空集证明不存在；
- 不把默认语言安全、可选 refinement 和完整功能正确性混成同一级保证；
- stars 只表示关注度，不表示采用率、成熟度或技术正确性。

**已落地**：

- 本文已改为单一全景基线，并补全 Verus、effect-language 与主流替代力量；
- `design.md §13` 同步收窄「独特组合」表述；
- B-001、B-111 的既有排队规格吸收了验证边界与可复现实验要求；
- 未新建 backlog item：`verify_ptr` 等候选方向尚缺用户确认的优先级，不绕过工作流自行立项。

---

## 1. 结论先行

### 1.1 Ring 仍有差异化，但不能再表述为「无直接竞品」

截至 2026-07-28，尚未发现一个项目**同时交付**以下组合：

- 面向应用开发、接近脚本语言的低标注表面；
- HM 类型推断与 application-facing effect inference；
- `io` / `fail` / `mut` 的签名可见性和 handler；
- Perceus 风格确定性 RC、native、自举；
- 把 agent 可修复诊断和签名信息密度作为产品目标。

但每个单项都有强先例，部分组合也已出现：

- **Koka / Effekt / Flix**：effect inference、effect polymorphism、handler 与优化；
- **Unison**：abilities（代数效果）+ 内容寻址代码库 + 语义化编辑/agent 工具；
- **MoonBit**：ML 风格应用语言 + 完整工具链 + native + 实验性形式化验证；
- **Zero**：graph-native 程序数据库 + agent checked edits；
- **Verus**：Rust 上的规范、proof/exec 分层、权限模型、SMT 验证与 AI proof 生态；
- **TypeScript 7 / Python / Rust**：凭生态、训练语料和工具链形成极强的「已经够好」替代。

因此，Ring 的可辩护定位不是“发明了无人拥有的单项机制”，而是：

> **把可推断的行为契约、确定性资源语义和 agent 闭环放在同一条 application-native 默认路径上，并用可复现实验说明它比主流工具链减少了多少上下文、重试和运行时失败。**

这仍是一个有窗口的组合，但窗口必须靠实现和数据守住，不能靠空集论证。

### 1.2 当前威胁排序

| 层级 | 对象 | 主要威胁 | 结论 |
|---|---|---|---|
| **极高** | TypeScript 7 | 主流替代、native 工具链速度、编辑器与训练数据 | 已从 beta 风险变成正式发货事实 |
| **高** | MoonBit | 最接近的应用语言产品、团队与工具链、`moon prove` | 工程威胁上调，effect 机制仍不同 |
| **高** | Python + Astral/Codex | agent 生态与低摩擦「够用」路径 | 语言保证弱，但采用阻力最低 |
| **高** | Zero | agent-first 叙事、语义图与 checked edits | 机制是另一条路线，叙事竞争直接 |
| **中高** | Rust + Verus | 安全基线、证明能力、训练数据、系统生态 | Ring 的安全/验证措辞必须分层且可证 |
| **中** | Flix / Koka / Effekt / Unison | effect 与语义工具机制先例 | 市场替代低，技术与叙事纠偏价值高 |
| **中** | Mojo | 大厂资源、AI compute、agent skills | 资源/叙事强，应用语言定位重叠有限 |
| **中** | Rue | 一人 + agent 的编译器工程速度与纪律 | 非直接产品竞品，是执行力基准 |
| **低** | Mog | 小规范、嵌入式 capability 模型 | 活跃度低，保留为规格压缩启发 |

### 1.3 三个最重要的路线图含义

1. **B-111 是立论门，不是营销附件。** TS7 已正式发布，Ring 必须用同协议、同模型、同预算的实验回答“effect 签名是否真的减少 token/轮数/运行时错误”。
2. **B-001 应做 bounded refinement，不应复制 Verus。** 普通 Ring 代码继续依靠默认类型/effect/资源检查；refinement 先限定可判定片段、机器整数语义和运行时兜底，再谈通用 SMT。
3. **形式化验证必须显式管理信任。** Verus 与 `moon prove` 都说明“证明成功”不等于“无假设”：solver、整数模型、axiom/external spec、编译器和 runtime 都属于保证边界。

---

## 2. 相比 2026-06-11 的决策变化

| 旧判断 | 2026-07-28 新证据 | 处置 |
|---|---|---|
| TypeScript 7 仍是 beta，stable 可能滑期 | TypeScript 7.0 已于 2026-07-08 正式发布；官方报告典型完整构建提升 8–12×，并给出 Slack、Vanta、Canva 等生产案例 | **上调**：从潜在风险改为已验证的极高替代威胁 |
| MoonBit v0.9.2，formal verification 仅一条动态 | 已到 v0.10.4；`moon prove` 文档公开 Why3 + Z3/cvc5/Alt-Ergo 管线、contracts、invariant、termination 与 axiomatization；仍明确为 experimental | **上调工程与验证威胁**，同时记录整数溢出模型与受支持子集限制 |
| Zero 处于首发爆发期 | v0.3.4 后 graph patching 成为主要 agent 编辑循环；6 月底后公开提交节奏较首发期降温 | **维持高叙事威胁、下调短期动量判断** |
| Rue 2026-03 后无显著更新 | 2026-07-28 仍有提交；官网 2026-07-22 快照报告 779/779 规范规则可追踪、1,950 个 spec tests，并覆盖 x86-64/arm64/macOS | **撤回“停滞”**，改列 agent 编译器工程基准 |
| Koka/Effekt/Flix/Unison 是待补空白 | 四者均活跃；Effekt 2026-07-27 发 v0.74.0，Flix 2026-07-09 发 v0.75.1，Unison 已到 1.3.0，Koka 2026-07-28 仍有修复 | **撤回空白结论**，纳入 effect/semantic 主比较轴 |
| Verus 仅以 AlphaVerus 一行出现 | Verus 每周滚动发布、公开完整 verifier 管线与 TCB；SOSP 系统案例、VerusBelt soundness 工作及多个 AI proving 项目形成生态 | **新增独立赛道**：不是直接产品竞品，是验证架构与 agent proof 的首要参照 |
| “完整代数效果 + HM + LLM 友好无直接竞品” | Flix/Koka/Effekt 覆盖 effect 机制，Unison 覆盖 abilities + semantic codebase，Zero 覆盖 graph-native agent edits | **收窄**为“尚无项目交付 Ring 的完整默认路径组合” |
| OpenAI 已收购 Astral | OpenAI 与 Astral 官方页面仍表述为已签协议/拟加入，未找到官方交割公告 | **纠正措辞**：只写“收购协议”，不写“已完成并购” |

---

## 3. 比较框架：不要把不同保证混在一起

### 3.1 保证阶梯

| 层级 | 保证 | 代表 | Ring 对应状态 |
|---|---|---|---|
| G0 | 语法、格式化、结构化诊断与可修复编辑 | Zero checked patch、LSP/MCP 工具 | `--error-format=llm` 等 agent 面已有基础，仍缺可量化证据 |
| G1 | 默认类型/效果/所有权或资源安全 | Rust、Flix/Koka effects、MoonBit 类型系统 | `io/fail/mut`、HM/trait、Perceus RC 与 verifier 已有；完整 Rust 级安全措辞仍需逐项证据 |
| G2 | 有界值级性质，编译期证明 + 明示运行时兜底 | Liquid-style refinement | B-001 规划中，尚未发货 |
| G3 | 用户规范下的功能正确性证明 | Verus、实验性 `moon prove` | 非 Ring 当前默认目标；只借鉴可组合的 verification lane |

G1 和 G3 解决的问题不同。Verus 的证明能力更强，但要求规范、lemma、trigger/invariant 与显式权限；Ring 的目标是让普通应用代码在 G1 路径保持低标注，再为局部高价值性质增加 G2。

### 3.2 威胁维度

- **产品替代**：用户今天能否直接选择它完成同类工作；
- **机制重叠**：是否已经实现 Ring 的核心技术；
- **agent 叙事**：是否占据“为 AI 编程而生”的心智；
- **证据强度**：是否有公开基准、论文、生产案例或 soundness 边界；
- **执行速度**：团队能否在 Ring 窗口内追平组合。

stars 和发布频率只辅助判断后两项，不直接证明产品质量。

---

## 4. 全景矩阵

| 项目 | 2026-07-28 状态 | 已发货核心 | Agent 路线 | 保证层 | 对 Ring 的关系 |
|---|---|---|---|---|---|
| **Ring** | 自举；C 后端迁移 Phase 2 进行中，LLVM 仍为 anchor/oracle；RIIR 后续暂停等待 | HM + trait、`io/fail/mut`、tail-resumptive/abort handler、Perceus RC、native | 诊断 + 高信息签名；B-111 待测 | G1（部分目标仍在收口） | 被比较对象 |
| **TypeScript 7** | 2026-07-08 正式发布 | Go native 编译器、LSP、`strict` 默认、并行检查 | 海量训练数据 + 编辑器/agent 生态 | G1 的结构类型子集 | 最大主流替代 |
| **Python + Astral** | Ruff/uv/ty 持续发展；OpenAI 收购协议未确认交割 | 极低摩擦生态与高速工具链 | Codex/agent 原生使用场景 | G0–G1（依工具） | 最大低阻力替代 |
| **Rust** | 成熟系统生态 | ownership/borrow、trait、unsafe 隔离、native | 高训练覆盖 + LSP/agent 工具 | 强 G1 | 安全基线与底层替代 |
| **MoonBit** | v0.10.4；1.0 目标 Q3 2026 | ML 风类型、Wasm/JS/C/native、LSP、包管理、Pilot | 专用 coding agent 与工具链 | G1；`moon prove` 为实验性 G3 | 最接近产品竞品 |
| **Zero** | v0.3.4；约 5.2k stars | semantic graph、query/patch、World capability、实验性 LLVM | agent 直接操作程序图 | G0–G1 | 最直接 agent 叙事竞品 |
| **Mojo** | 1.0 Beta 2；Modular 主仓约 26.6k stars | Pythonic syntax、linear types、compile-time reflection、AI compute | 官方 agent skills | G1 | 资源/叙事强，定位偏 AI compute |
| **Koka** | v3.2.3；活跃研究语言 | effect inference/handlers、evidence passing、Perceus、C backend | 非主要目标 | G1 | Ring 最接近理论与实现来源 |
| **Flix** | v0.75.1；活跃 | effect polymorphism、subeffecting/exclusion、handlers、purity-driven optimization | 官方已直接研究 LLM 对新语言的影响 | G1 | 被旧报告低估的机制近邻 |
| **Effekt** | v0.74.0（2026-07-27） | algebraic effects、contextual effect polymorphism、capabilities/resources | 非主要目标 | G1 | 活跃的 effect 实验场 |
| **Unison** | 1.3.0；已过 1.0 | abilities、content-addressed codebase、语义重构、分布式能力 | MCP/agent 工具持续增加 | G1 | “效果 + 语义程序库”最强先例 |
| **Verus** | 每周滚动发布；约 2.8k stars | Rust 子集、spec/proof/exec、ghost erasure、SMT、权限模型 | 多个 proof synthesis/repair 项目 | G3 | 形式化验证首要参照，非应用语言直接替代 |
| **Rue** | 活跃；约 1.1k stars、1,942 commits | affine ownership、native、自研 IR、spec/test/fuzz/sanitizer | 主要由 Claude 协助构建 | G1 目标，仍实验性 | 一人+agent 工程基准 |
| **Mog** | 2026-03 后未见新提交；约 139 stars | 3,200-token spec、host capabilities、native | 为 agent 使用而压缩规范 | G0–G1 | 小型规格/嵌入式启发 |

---

## 5. 主流「够用就行」替代

### 5.1 TypeScript 7：威胁已从计划变为现实

TypeScript 7.0 已在 2026-07-08 正式发布，不应再称为 tsgo beta。官方数据包括：

- Go native port 对典型完整构建带来约 8–12× 提升；
- 新 LSP 相对 TypeScript 6 显著降低失败命令和 crash；
- Slack 报告 CI 从 7.5 分钟降到 1.25 分钟，Canva 报告首次错误从 58 秒降到 4.8 秒；
- 7.0 默认启用 `strict`，支持稳定类型排序与并行检查；
- 7.0 暂无旧式 programmatic API，Vue/MDX/Astro/Svelte 及部分 Angular 嵌入式流程仍可能需要 TypeScript 6；官方提供 `@typescript/typescript6` 并行安装路径。

这意味着 Ring 不能再用“编译器更快”作为充分差异。TS7 的优势是：

- 训练数据、npm、编辑器与 agent 工具几乎无迁移成本；
- 反馈时延已经低到足以支撑快速 agent loop；
- 类型系统虽不追踪完整副作用，但能满足大量 Web/CLI/服务端任务。

Ring 的可证伪反论必须交给 B-111：在同模型、同任务、同预算下，行为签名是否减少总 token、修复轮数和隐藏测试失败，而不是比较宣传语。

### 5.2 Python + Astral/Codex：采用阻力最低

Python 的核心优势不是静态保证，而是：

- 模型训练覆盖广、库生态大、生成成功先验高；
- Ruff、uv、ty 等工具持续压低 lint、环境与类型反馈成本；
- OpenAI 2026-03-19 宣布与 Astral 签署收购协议，并明确工具与 Codex 的协同方向。

截至本报告日期，OpenAI 和 Astral 官方页面仍使用“拟收购/已签协议/将加入”措辞，本文不把交易写成已完成。

Ring 面对 Python 时应强调“失真必须响”的默认保证和可枚举行为契约，而不是只强调语法简短；Python 在简短与生态上几乎不可正面击败。

### 5.3 Rust：安全基线，也是 Verus 的生态地基

Rust 已把 ownership、unsafe 隔离、native 性能和成熟工具链变成用户基线。Verus 进一步证明：在 Rust 语义与生态上叠加规范和 SMT，可以覆盖高保证系统。

对 Ring 的约束：

- “Rust 的安全性 + Python 的体验”只能作为目标简写，正式材料必须列出已经保证、正在收口和明确不保证的边界；
- Ring 的零 lifetime 标注与 RC 路线是易用性差异，不自动等于更强安全；
- agent 对 Rust 的训练覆盖和工具支持会持续削弱“新语言更适合 agent”的先验，B-111 必须覆盖 onboarding 成本。

---

## 6. 最接近的产品与叙事竞品

### 6.1 MoonBit：最接近的应用语言产品

MoonBit 当前比 Ring 成熟得多：多后端、包管理、LSP、文档与专用 agent 已形成产品面。v0.10.4 的关键状态：

- native backend 已扩展到 x86-64 Linux 与 Windows nightly；Apple Silicon debug 默认 native，release 仍可走 C `-O2`；
- native LSP 默认启用，async 与 Wasm async 持续迭代；
- 通过显式 `extend Type with Trait` 收紧隐式方法附着，体现其对可重构性的重视；
- 1.0 目标为 2026 Q3，但官方保留依据测试结果调整的空间。

#### `moon prove` 的真实能力与边界

`moon prove` 不是一句 roadmap：

- `.mbt` 中写可执行代码与 contract，`.mbtp` 中写 predicate、model 和 lemma；
- 支持 `proof_require`、`proof_ensure`、`proof_assert`、循环 invariant、termination decrease、pure/axiomatized 标记；
- proof-enabled package 降到 Why3，再调用 Z3、cvc5 或 Alt-Ergo；
- 官方仍明确标为 experimental；
- 当前整数验证模型是无界数学整数，**不模拟运行时机器整数溢出**；
- 局部 mutation 与 escaping `FixedArray` 等仍有限制，验证代码更偏函数式；
- `proof_axiomatized` 等入口进入信任边界。

这使 MoonBit 同时成为产品与 verification-adjacent 竞品。Ring 不能再声称 refinement 在理论整合上天然胜出；B-001 必须通过更清晰的机器整数语义、可判定性和默认低负担证明其取舍。

#### 与 Ring 的关键差异

| 维度 | MoonBit | Ring |
|---|---|---|
| 普通函数 effect | 局部函数倾向显式 effect 声明；错误/async 有专门机制 | `io/fail/mut` 默认推断并进入签名 |
| Handler | 非 application-facing 核心卖点 | tail-resumptive + abort 已发货 |
| 资源 | 多后端与 runtime 路线并行 | Perceus RC + RIIR，确定性资源语义是公理 |
| 验证 | 独立 experimental `moon prove` lane | bounded refinement 规划中，尚未发货 |
| Agent | MoonBit Pilot + 完整工具链 | 编译器诊断/签名路线，B-111 尚待实证 |

结论：**工程与采用威胁高，effect 机制不是同一路线，验证叙事已正面相遇。**

### 6.2 Zero：semantic graph 是另一种 agent-first 赌注

Zero 的核心不是“更强类型”，而是把 semantic graph 作为程序数据库：

- `.0` 文本是面向人的 projection，语义图才是编译器/工具的稳定对象；
- agent 用 `zero query` 获取结构，用 `zero patch` 提交 checked edits；
- graph hash 让过期 patch fail closed；
- v0.3.4 已把 graph patching 推为主要 agent 编辑循环；
- `World` 是显式 capability，不是 Ring 式 effect inference；
- native/LLVM 仍有实验性部分，项目整体也明确处于早期阶段。

Zero 约 5.2k stars，首发传播证明 agent-first 叙事有强需求；但 6 月底后公开提交节奏较首发期放缓，不能把早期指数增长外推。

对 Ring 的启发不是复制 graph-native 存储，而是：

- 给 agent 稳定 identity、结构化 query、可验证 patch 与 stale guard；
- 明确文本签名路线何时比语义图足够，何时需要更强结构化接口；
- 把 agent protocol 作为可测试产品面，而非诊断 JSON 的附属品。

### 6.3 Mojo：资源与叙事强，主战场不同

Mojo 最新稳定通道为 1.0 Beta 2，Modular 主仓约 26.6k stars。已发货/公开方向包括：

- Pythonic 表面、typed errors、linear types、compile-time reflection；
- CPU/GPU/AI kernel 与模型服务的深度整合；
- 官方 agent skills 与“更早编译期反馈降低 agent 成本”的叙事。

Mojo 编译器本身的开放范围仍需区分于 Modular 主仓中的开源组件。它没有把通用 algebraic effects/handlers 作为应用语言核心。因此对 Ring 是**资源与心智竞争**，不是 effect 机制的直接替代。

---

## 7. Effect 与语义程序表示赛道

### 7.1 Koka：最接近的理论与实现来源

Koka v3.2.3，2026-07-28 仍有维护提交。它已经证明：

- polymorphic type/effect inference 与 algebraic handlers 可工程实现；
- evidence passing 可把 handlers 降为高效直接代码；
- Perceus 可把精确 RC 与 reuse analysis 结合；
- C backend 能承载这些语义。

Koka 是研究语言，生态、async library、包管理与 production support 不是其强项。它对 Ring 的意义是“核心算法并非空白创新”，也是 correctness 风险提醒：近期仍出现 Perceus 相关 UAF 修复，静态资源 pass 必须有 verifier 和回归门。

Ring 的差异在 application-facing 语法、有限 handler 语义、`mut` 可见性、自举、agent 诊断与产品目标，而不在“拥有 effects/Perceus”本身。

### 7.2 Flix：被旧报告低估的直接机制近邻

Flix v0.75.1，项目保持活跃。其 effect system 已覆盖：

- effect polymorphism、subeffecting、effect exclusion；
- primitive/algebraic/heap effects 与 handlers；
- purity reflection 和 associated effects；
- 用 purity 信息驱动自动并行化、dead-code elimination 与 inlining。

Flix 官方还直接讨论并实验 LLM 对新语言和 effect 代码的影响。这意味着“effect 签名帮助 LLM”并非 Ring 独占的话语空间，Ring 必须更快产出可复现实验和 application-native 体验。

Flix 偏函数式/JVM 与研究型生态，市场替代威胁有限；机制与 AI 论证威胁为中高。

### 7.3 Effekt：活跃的 capability/effect 实验场

Effekt v0.74.0 于 2026-07-27 发布，近期版本密集。核心包括：

- algebraic effects/handlers；
- contextual effect polymorphism；
- capability 与 resource 表达；
- JS 等后端及持续推进的 C FFI。

Effekt 是研究语言，但其活跃度说明 handler/capability 设计仍在快速迭代。Ring 应持续把 handler 子集的取舍写清：当前只做 tail-resumptive + abort，full AE 不在计划中；“完整代数效果”已不再是准确措辞。

### 7.4 Unison：effects + semantic codebase 的最强先例

Unison 已发布 1.0，当前 1.3.0；官方 1.0 数据显示已有数千项目作者和十万级发布定义/下载。它把：

- algebraic effects（abilities）与 handlers；
- 内容寻址的 codebase；
- 基于 identity 的 rename/refactor；
- 分布式计算模型；
- MCP/agent 工具

放在同一产品中。

Unison 的函数式、分布式与 codebase-as-database 产品模型和 Ring 不同，但它反驳了“effect + 语义程序库 + agent 工具无人组合”的说法。Ring 的区别应落在普通文件/Git 兼容、应用语言手感、effect inference、native 与确定性资源语义。

---

## 8. Verus：形式化验证与 AI proof 的首要参照

### 8.1 它是什么，不是什么

Verus 是在 Rust 子集上增加规范与证明的验证工具链，不是面向一般应用开发的新语言。它处于活跃开发期，README 仍明确提示缺失/损坏特性和不完整文档；同时维持每周滚动发布，并已用于多个真实系统研究。

它对 Ring 的竞争主要发生在“安全/正确性到底能保证到哪一层”的叙事，而不是语法、包生态或普通应用开发。

### 8.2 管线与架构

Verus 的核心管线为：

```text
Rust source
  → rustc HIR
  → VIR-AST
  → VIR-SST
  → AIR
  → SMT-LIB
  → Z3（cvc5 实验性）
  → 验证通过
  → 擦除 spec/proof/ghost
  → 正常 rustc MIR/LLVM 编译 exec 代码
```

代码按 `spec`、`proof`、`exec` 分层。验证 IR 与执行 codegen 解耦、ghost 擦除、proof 不进入产物，这些是 B-001 可以直接借鉴的架构原则。

### 8.3 保证、成本与 TCB

Verus 可以验证内存安全和功能正确性，但保证相对于用户规范与信任边界成立：

- `assume`、`external_body`、`external_fn_specification`、`external` 等会引入假设；
- TCB 包含顶层规范、Verus verifier、SMT solver 与 Rust 编译器；
- SMT 推理一般不可判定，工程上依赖 trigger、invariant、分解和 resource limit；
- Verus 不把“只经 Rust typecheck”视为足够：其 raw pointer/权限代码必须实际完成验证。

SOSP 论文的 5 个系统案例合计约 6.1K 行实现代码和 31K 行证明代码，说明它能处理真实低层系统，也说明完整证明仍有显著规格/lemma 成本。论文报告的速度优势是相对其他验证系统，不等于普通编程零成本。

### 8.4 权限模型对 Ring 的启发

Verus `vstd::raw_ptr` 用 `PointsTo`、`PointsToRaw`、`Dealloc` 等 ghost permissions 描述地址、provenance、metadata、初始化状态与释放权。这比“裸指针在 unsafe 块里所以没问题”强得多。

对 Ring 的可用映射：

- 当前 `unsafe` effect + `Ptr<T>` 保留显式 discharge 和 `ring audit unsafe` 审计面；
- RIIR 稳定后，可研究**可选**的 pointer permission verifier，把常见 raw pointer 义务静态化；
- 该方向尚未确认优先级，本轮不擅自创建 backlog item；
- 即使未来实现，也应是局部 verification lane，不把所有普通 Ring 代码变成 Verus 风格 proof engineering。

### 8.5 VerusBelt：soundness 证据也有边界

PLDI 2026 VerusBelt 给出了 Verus 重要子集的首个语义 soundness 证明，覆盖 proof-oriented types、lifetime/borrow/concurrency 等关键机制。其边界同样重要：

- 证明针对形式化模型中的重要子集，不是对整个 Verus 实现二进制的验证；
- 部分常用库按 axiomatized 方式建模；
- 编译器、solver 与规范仍属于整体信任链。

对 Ring 的教训是：文档应同时公布“证明了什么”和“没有证明什么”，不要把 verifier 通过压缩成无条件“安全”。

---

## 9. AI 证明生态：证明编写正在被自动化，信任边界没有消失

Verus 周围已形成连续的 AI proof synthesis/repair 研究线：

| 项目 | 时间/发表 | 方向 |
|---|---|---|
| RAG-Verus | 2025-02 | 用检索增强生成 Verus proof |
| AlphaVerus | ICML 2025 | 生成并迭代形式化证明 |
| AutoVerus | OOPSLA 2025 | 自动补全/修复 Verus annotations |
| VeriStruct | 2025-10 | 利用结构化验证信息 |
| VeruSAGE | 2025-12 | agentic proof 工程 |
| KVerus | 2026-05 | Verus 证明生成/知识利用 |
| ExVerus | ICML 2026 | 扩展 proof synthesis |
| Propose/Solve/Verify | ICML 2026 | 生成—求解—验证闭环 |

共同信号：

- LLM/agent 正在降低 lemma、invariant 和 proof repair 的人工成本；
- verifier 是强反馈 oracle，可把生成错误变成机器可判定的迭代信号；
- 但 agent 不能替代正确 specification、TCB 审计、solver 可重复性和整数/内存模型；
- “能自动证明”会提高用户对新语言保证的期待，也会降低证明语法负担这一传统反对理由。

Ring 的合理响应是双层：

1. 默认层继续以可判定的类型/effect/资源检查承担大部分代码；
2. 对钱、长度、索引、协议状态等高价值局部性质提供 bounded refinement，并让 agent 消费结构化 proof failure。

不要把完整 Verus 式功能正确性证明塞进 B-001；也不要假设 AI 会自动解决不良规范或 SMT 不稳定性。

---

## 10. Agent 构建与小语言基准

### 10.1 Rue：撤回“停滞”判断

Rue 是 Steve Klabnik 主导、Claude 深度协作的实验性系统语言。2026-07-28 仍有提交，官方状态包括：

- 779/779 个规范规则可追踪；
- 官网 2026-07-22 快照记录 1,950 个 spec test cases；
- x86-64 与 arm64/macOS 支持；
- affine ownership/borrowing/destructors、自研多层 IR、直接 native codegen；
- fuzz、sanitizer、benchmark 与规范追踪基础设施。

Rue 不追求与 Ring 相同的 HM/effect 应用语言路线，但它表明“一人 + agent”可以在数月内建立非常系统的编译器质量工程。Ring 的人效优势不能继续引用 2026-03 的静态快照，应该比较：

- spec-to-test 可追踪率；
- sanitizer/fuzz 覆盖；
- bootstrap/后端 parity；
- 活跃缺陷关闭速度；
- 可复现发布，而非总代码行或短期 commit 数。

### 10.2 Mog：规格压缩仍有启发，动量低

Mog 是小型、可嵌入、面向 agent 的静态语言：

- 完整规范约 3,200 tokens；
- safe Rust compiler/runtime 规模小；
- host capability、安全嵌入与 native codegen；
- 2026-03-09 后未见新提交，当前产品威胁低。

其启发仍有效：Ring primer 应把**稳定核心语言 + 高频 std 签名**控制在可预测上下文预算内，并由 B-111 实测 onboarding token 成本。

### 10.3 外围 agent DSL

Pel、Quasar、Dana、Darklang 的 agent 化方向主要是 workflow/orchestration、自然语言动作或“AI 唯一作者”，和 Ring 的 native application language 不同。它们可作为叙事雷达，不应与能编译、运行、自举的语言放在同一成熟度表中。

---

## 11. Ring 的真实位置

### 11.1 已有能力

- 自举编译器，Ring 源码贯穿主编译管线；
- HM 推断、trait、row-polymorphic effect 基础；
- `io` / `fail` / `mut` 可见，tail-resumptive + abort handler；
- Perceus L0/L1 RC 与 post-RC `LEAK/UAF/BALANCE` verifier；
- native 双后端过渡：C 后端 Phase 1 已覆盖单文件/project/self-host，Phase 2 parity 认证中；LLVM 仍是 anchor/oracle；
- `unsafe` effect、`Ptr<T>` 与显式 discharge/audit 面；
- 结构化/LLM 诊断基础。

### 11.2 尚未兑现，不能写成现状

- async effect 设计已有，但 native 实现未发货；
- full algebraic effects/multi-shot continuation 明确不做；
- refinement types 未实现，参数位 `where` 目前仍是 parse error；
- C 后端尚未完成 parity gate，LLVM 尚未退役；
- RIIR 标准库迁移尚未完成；
- LSP 暂不可用；
- B-111 尚无一轮公开、可复现的 Ring vs TS7 数据；
- “Rust 级安全”“LLM 更容易写对”“语义驱动性能领先”仍需分项证据，不是现成事实。

### 11.3 更新后的三支柱

1. **推断默认行为契约**：普通代码尽量不写类型/effect/ownership 注解，但编译器产生稳定、可读、可机器消费的签名；
2. **确定性资源与失真可见**：RC/Drop/unsafe discharge/审计面把不可自动保证的部分显式列出；
3. **可验证的 agent 闭环**：诊断、语义 query、受检 patch、隐藏测试与 bounded proof 共同缩短生成—验证循环。

“语义驱动性能”仍是长期收益，但在 C 后端迁移和 RIIR 未完成前，不应与已发货支柱并列宣传为已证明优势。

### 11.4 可对外使用的一句话

> **Ring 是面向人和 coding agent 的 native 应用语言：像脚本语言一样少写标注，但让编译器推断行为契约、管理确定性资源，并把无法证明的边界明确暴露出来。**

若需要更技术化的版本：

> **Ring 把 HM 类型/effect inference、Perceus RC 和结构化 agent feedback 组合成默认应用开发路径；bounded refinement 是其可选增强，而不是普通代码的证明税。**

---

## 12. 行动建议与既有工作项映射

### P0：先完成当前可信执行链

- 继续 B-163 Phase 2 parity 认证；没有跨后端/固定点证据前，不用竞品叙事打断迁移；
- RIIR 与 runtime 收口后再扩大 safety/performance 宣称；
- 保留 LLVM oracle 直到既定 gate 闭合，不为“native 已成入场券”跳过验证。

### P0：B-163 后先确定 C-native failure/control ABI

本轮讨论已立 B-168，并把它排在 B-163 与 B-167 之间：

- 用同一组最小程序中立比较 cleanup stack + `setjmp`/`longjmp` 与显式 failure-status/continuation lowering，不因 Rust/LLVM 的既有路线预选答案；
- 以多帧 Drop、部分初始化、nested catch、re-raise、B-165 局部写入可见性和 `verify_rc` 可审计性作为正确性门，而非只比正常路径吞吐；
- 同时测量 TCB、Windows/Linux C11 可移植性、生成物尺寸、self-compile 成本，以及与 B-167 closure/evidence ABI 的耦合；
- 用户依据可复核 dossier 拍板后，统一重写 B-002 Phase 2、处置 B-165，再执行 B-167，避免为三项分别制造控制流补丁。

### P1：B-111 产出可复现的 Ring vs TS7 证据

本轮已将以下要求写回 B-111：

- TS 对照固定为正式 TypeScript 7 native compiler，并记录版本、`strict` 配置与兼容路径；
- 同模型/version、同 system prompt、同重试与 token 预算；
- 增加 signature-only/API-use 子集，直接检验行为签名信息密度；
- 保存完整 prompt、compiler feedback、patch、token、时间与结果；
- 预注册指标和失败分类，允许结论为“无显著优势”；
- 单独报告 onboarding/primer 成本，防止把训练语料差异隐藏在结果中。

### P2：B-001 保持 bounded、deterministic、honest

本轮已将以下要求写回 B-001：

- 独立 verification IR；proof/ghost 信息不污染 runtime codegen；
- 明确数学整数与机器整数/溢出语义；
- 显式 assumption/trust ledger；
- deterministic resource budget 和可复现 proof artifact；
- solver 缺失、unknown、超预算或模型不支持时，不得静默视为证明成功；
- 运行时兜底只用于语言规范明确允许的 predicate，并在产物/诊断中可见。

### 候选但未立项

- `Ptr<T>` 的 `PointsTo`/`Dealloc` 风格可选权限验证；
- agent semantic query / checked patch / stale guard；
- 公开的 trust/assumption audit 命令；
- Flix 风格 purity-driven optimization 的可证基准。

这些方向需要用户确认优先级、复杂度、dispatch 与验收后才能进入 backlog；本轮只保留研究结论。

---

## 13. 复查节奏与触发条件

常规保鲜期：**6 周**。下次定期复查建议不晚于 2026-09-08。

出现以下任一事件时提前复查：

- MoonBit 1.0/RC 发布，或 `moon prove` 去掉 experimental；
- Zero 发稳定 release、公开采用数据，或 graph-native 工作流发生重大改变；
- TypeScript 7.1 恢复 programmatic API，主流 framework 完成迁移；
- Verus/AI proof 出现公开生产级采用或显著降低 proof/implementation ratio；
- Flix/Effekt/Unison 发布直接面向 coding agent 的 effect benchmark；
- Ring B-111 首轮数据或 B-001 design probe 产出，足以反向修改本文结论。

每轮复查必须同时更新日期、版本、保证层、行动映射；不再在顶部追加互相矛盾的“增量节”。

---

## 14. 主要一手来源

### 主流替代

- TypeScript：[Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- OpenAI：[OpenAI to acquire Astral](https://openai.com/index/openai-to-acquire-astral/)
- Astral：[About Astral](https://astral.sh/about)
- Rust：[The Rust Programming Language](https://doc.rust-lang.org/book/)

### 直接与相邻语言

- MoonBit：[v0.10.4 release](https://www.moonbitlang.com/updates/2026/07/13/moonbit-0-10-4-release)、[v0.10.0 release](https://www.moonbitlang.com/updates/2026/06/08/moonbit-0-10-0-release)、[Formal Verification](https://docs.moonbitlang.com/en/latest/language/verification.html)
- Zero：[vercel-labs/zerolang](https://github.com/vercel-labs/zerolang)、[releases](https://github.com/vercel-labs/zerolang/releases)
- Mojo：[Mojo releases](https://mojolang.org/releases/)、[Modular 26.4 / Mojo Beta 2](https://www.modular.com/blog/modular-26-4-sota-moe-serving-model-bringup-via-agent-skills-mojo-beta-2-and-more)
- Rue：[rue-lang.dev](https://rue-lang.dev/)、[rue-language/rue](https://github.com/rue-language/rue)
- Mog：[moglang.org](https://moglang.org/)、[voltropy/mog](https://github.com/voltropy/mog)

### Effect / semantic code

- Koka：[documentation](https://koka-lang.github.io/koka/doc/index.html)、[koka-lang/koka](https://github.com/koka-lang/koka)
- Flix：[The Flix Effect System](https://doc.flix.dev/effect-system.html)、[releases](https://github.com/flix/flix/releases)、[Will LLMs Help or Hurt New Programming Languages?](https://blog.flix.dev/blog/will-llms-help-or-hurt-new-programming-languages/)
- Effekt：[documentation](https://effekt-lang.org/docs)、[releases](https://github.com/effekt-lang/effekt/releases)
- Unison：[website](https://www.unison-lang.org/)、[abilities](https://www.unison-lang.org/docs/fundamentals/abilities/)、[releases](https://github.com/unisonweb/unison/releases)

### Verus 与 AI proof

- Verus：[repository](https://github.com/verus-lang/verus)、[code architecture](https://github.com/verus-lang/verus/blob/main/source/CODE.md)
- Verus guide：[Trusted Computing Base](https://verus-lang.github.io/verus/guide/tcb.html)、[SMT failures](https://verus-lang.github.io/verus/guide/smt_failures.html)、[memory safety](https://verus-lang.github.io/verus/guide/memory-safety.html)
- Verus std：[raw pointer permissions](https://verus-lang.github.io/verus/verusdoc/vstd/raw_ptr/index.html)
- 论文：[Verus: Verifying Rust Programs using Linear Ghost Types (SOSP)](https://www.andrew.cmu.edu/user/bparno/papers/verus-sys.pdf)、[VerusBelt (PLDI 2026)](https://iris-project.org/pdfs/2026-pldi-verusbelt.pdf)
- 研究索引：[Verus publications and projects](https://verus-lang.github.io/verus/publications-and-projects/)
