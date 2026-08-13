# Ring-lang 竞品与行业定位

> 最后更新：2026-08-13
>
> 基线事实截止：2026-08-03；BAML 专项事实截止：2026-08-13（版本、活跃度与 stars 均为时点数据）
>
> 用途：产品定位、路线图取舍、B-001 Refinement Types 与 B-111 LLM eval harness 的证据输入

## 口径与证据纪律

本文比较直接与相邻语言、主流替代工具链、形式化验证/AI proof 生态，以及 Ring 当前已实现能力。除明确标注的 BAML 专项复核外，时效结论受顶部基线事实截止日期约束：

- 时效事实只采用项目官网、官方 GitHub、官方 release notes、论文或会议页面；
- 明确区分「已发货 / 实验性 / 宣称 / 计划」，不把 roadmap 当产品能力；
- 无法确认的事实标为未知，不以搜索空集证明不存在；
- 不把默认语言安全、可选 refinement 和完整功能正确性混成同一级保证；
- stars 只表示关注度，不表示采用率、成熟度或技术正确性。

---

## 1. 结论先行

### 1.1 Ring 仍有差异化，但不能再表述为「无直接竞品」

截至 2026-08-03 基线复查，并纳入 2026-08-13 的 BAML 专项复核后，尚未发现一个项目**同时交付**以下组合：

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
- **BAML**：typed agent/workflow language + standalone VM + 跨宿主 bridge + agent skill/semantic tools/eval 回流；
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
| **高** | Zero | graph-native 程序库、checked edits 与完整 agent CLI/skills | 机制路线不同，但产品面竞争直接 |
| **高** | BAML | 直接占据“programming language for agents”、agent-first toolchain、跨语言渐进采用与公开反馈回流 | 新语言通道仍为 canary，但产品与叙事竞争已经正面成立 |
| **中高** | Rust + Verus | 安全基线、证明能力、训练数据、系统生态 | Ring 的安全/验证措辞必须分层且可证 |
| **中** | Flix / Koka / Effekt / Unison | effect 与语义工具机制先例 | 市场替代低，技术与叙事纠偏价值高 |
| **中** | Mojo | 大厂资源、AI compute、agent skills | 资源/叙事强，应用语言定位重叠有限 |
| **中** | Rue | 一人 + agent 的编译器工程速度与纪律 | 非直接产品竞品，是执行力基准 |
| **低** | Mog | 小规范、嵌入式 capability 模型 | 活跃度低，保留为规格压缩启发 |

### 1.3 五个最重要的路线图含义

1. **B-111 是立论门，不是营销附件。** TS7 已正式发布，Ring 必须用同协议、同模型、同预算的实验回答“effect 签名是否真的减少 token/轮数/运行时错误”。
2. **B-001 应做 bounded refinement，不应复制 Verus。** 普通 Ring 代码继续依靠默认类型/effect/资源检查；refinement 先限定可判定片段、机器整数语义和运行时兜底，再谈通用 SMT。
3. **形式化验证必须显式管理信任。** Verus 与 `moon prove` 都说明“证明成功”不等于“无假设”：solver、整数模型、axiom/external spec、编译器和 runtime 都属于保证边界。
4. **C-only 只是发布地基，不是产品发布。** Zero 已把 install/query/check/test/run、稳定 identity 与版本匹配的 agent skills 做成 compiler 产品面，Koka/MoonBit/TS7 也都有可安装工具链。Ring 应先完成 B-174/B-175 的本地闭环与候选包，再以 B-177 提供只读、版本化的 semantic inspection/primer；保持源码 + Git 为真值，不追随 graph-native 存储重写。
5. **“Agent PL”已经成为真实品类，不再只是 Ring 的内部定位词。** BAML 已把 `agent install`、`describe`/`grep`、standalone run、跨语言 bridge、内建 eval 与 agent 反馈回流放在同一产品面。Ring 不应跟随其 LLM-workflow VM/GC 路线，而应让 B-174/B-177/B-111 证明 inference-first native、显式 effect 与确定性资源契约在普通应用任务上的独立价值。

---

## 2. 比较框架：不要把不同保证混在一起

### 2.1 保证阶梯

| 层级 | 保证 | 代表 | Ring 对应状态 |
|---|---|---|---|
| G0 | 语法、格式化、结构化诊断与可修复编辑 | Zero checked patch、LSP/MCP 工具 | `--error-format=llm` 等 agent 面已有基础，仍缺可量化证据 |
| G1 | 默认类型/效果/所有权或资源安全 | Rust、Flix/Koka effects、MoonBit 类型系统 | `io/fail/mut`、HM/trait、Perceus RC 与 verifier 已有；完整 Rust 级安全措辞仍需逐项证据 |
| G2 | 有界值级性质，编译期证明 + 明示运行时兜底 | Liquid-style refinement | B-001 规划中，尚未发货 |
| G3 | 用户规范下的功能正确性证明 | Verus、实验性 `moon prove` | 非 Ring 当前默认目标；只借鉴可组合的 verification lane |

G1 和 G3 解决的问题不同。Verus 的证明能力更强，但要求规范、lemma、trigger/invariant 与显式权限；Ring 的目标是让普通应用代码在 G1 路径保持低标注，再为局部高价值性质增加 G2。

### 2.2 威胁维度

- **产品替代**：用户今天能否直接选择它完成同类工作；
- **机制重叠**：是否已经实现 Ring 的核心技术；
- **agent 叙事**：是否占据“为 AI 编程而生”的心智；
- **证据强度**：是否有公开基准、论文、生产案例或 soundness 边界；
- **执行速度**：团队能否在 Ring 窗口内追平组合。

stars 和发布频率只辅助判断后两项，不直接证明产品质量。

---

## 3. 全景矩阵

| 项目 | 时点状态 | 已发货核心 | Agent 路线 | 保证层 | 对 Ring 的关系 |
|---|---|---|---|---|---|
| **Ring** | 自举；2026-08-03 完成 C-only codegen/bootstrap 与 tracked `dist-c` 固定点；发布产品面/RIIR/Drop Phase 2 待收口 | HM + trait、`io/fail/mut`、tail-resumptive/abort handler、Perceus RC、C11 native | 结构化诊断已有；inspection/primer 与 B-111 待交付 | G1（部分 ownership/runtime 保证仍在收口） | 被比较对象 |
| **TypeScript 7** | 2026-07-08 正式发布 | Go native 编译器、LSP、`strict` 默认、并行检查 | 海量训练数据 + 编辑器/agent 生态 | G1 的结构类型子集 | 最大主流替代 |
| **Python + Astral** | Ruff/uv/ty 持续发展；OpenAI 收购协议未确认交割 | 极低摩擦生态与高速工具链 | Codex/agent 原生使用场景 | G0–G1（依工具） | 最大低阻力替代 |
| **Rust** | 成熟系统生态 | ownership/borrow、trait、unsafe 隔离、native | 高训练覆盖 + LSP/agent 工具 | 强 G1 | 安全基线与底层替代 |
| **MoonBit** | v0.10.4；1.0 目标 Q3 2026 | ML 风类型、Wasm/JS/C/native、LSP、包管理、Pilot | 专用 coding agent 与工具链 | G1；`moon prove` 为实验性 G3 | 最接近产品竞品 |
| **Zero** | experimental；官方 main 已明确 graph-native，semantic graph 是程序数据库、`.0` 是 projection | checked graph/patch、query/inspect/check/test/run、显式 capability | agent 直接操作图并消费版本匹配 skills | G0–G1 | 最直接 agent 产品面竞品 |
| **BAML** | 2026-08-13：默认 `canary`；新 BAML Language 0.16.0，legacy BAML v0 为 0.225.0 | TypeScript 风类型/泛型/lambda、typed errors、bytecode VM/GC、green-thread workflow、standalone run、跨宿主 bridge、内建 tests/evals | `baml agent install`、`describe`/`grep`、版本化 toolchain、Agent Tries BAML 反馈面 | G0–G1（类型/错误；非确定性 ownership） | 直接 agent-language 产品/叙事竞品；运行与资源路线不同 |
| **Mojo** | 1.0 Beta 2；Modular 主仓约 26.6k stars | Pythonic syntax、linear types、compile-time reflection、AI compute | 官方 agent skills | G1 | 资源/叙事强，定位偏 AI compute |
| **Koka** | v3.2.3；活跃研究语言 | effect inference/handlers、evidence passing、Perceus、C backend | 非主要目标 | G1 | Ring 最接近理论与实现来源 |
| **Flix** | v0.75.1；活跃 | effect polymorphism、subeffecting/exclusion、handlers、purity-driven optimization | 官方已直接研究 LLM 对新语言的影响 | G1 | 直接机制近邻 |
| **Effekt** | v0.74.0（2026-07-27） | algebraic effects、contextual effect polymorphism、capabilities/resources | 非主要目标 | G1 | 活跃的 effect 实验场 |
| **Unison** | 1.3.0；已过 1.0 | abilities、content-addressed codebase、语义重构、分布式能力 | MCP/agent 工具持续增加 | G1 | “效果 + 语义程序库”最强先例 |
| **Verus** | 每周滚动发布；约 2.8k stars | Rust 子集、spec/proof/exec、ghost erasure、SMT、权限模型 | 多个 proof synthesis/repair 项目 | G3 | 形式化验证首要参照，非应用语言直接替代 |
| **Rue** | 活跃；约 1.1k stars、1,942 commits | affine ownership、native、自研 IR、spec/test/fuzz/sanitizer | 主要由 Claude 协助构建 | G1 目标，仍实验性 | 一人+agent 工程基准 |
| **Mog** | 2026-03 后未见新提交；约 139 stars | 3,200-token spec、host capabilities、native | 为 agent 使用而压缩规范 | G0–G1 | 小型规格/嵌入式启发 |

---

## 4. 主流「够用就行」替代

### 4.1 TypeScript 7：威胁已从计划变为现实

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

### 4.2 Python + Astral/Codex：采用阻力最低

Python 的核心优势不是静态保证，而是：

- 模型训练覆盖广、库生态大、生成成功先验高；
- Ruff、uv、ty 等工具持续压低 lint、环境与类型反馈成本；
- OpenAI 2026-03-19 宣布与 Astral 签署收购协议，并明确工具与 Codex 的协同方向。

截至本报告日期，OpenAI 和 Astral 官方页面仍使用“拟收购/已签协议/将加入”措辞，本文不把交易写成已完成。

Ring 面对 Python 时应强调“失真必须响”的默认保证和可枚举行为契约，而不是只强调语法简短；Python 在简短与生态上几乎不可正面击败。

### 4.3 Rust：安全基线，也是 Verus 的生态地基

Rust 已把 ownership、unsafe 隔离、native 性能和成熟工具链变成用户基线。Verus 进一步证明：在 Rust 语义与生态上叠加规范和 SMT，可以覆盖高保证系统。

对 Ring 的约束：

- “Rust 的安全性 + Python 的体验”只能作为目标简写，正式材料必须列出已经保证、正在收口和明确不保证的边界；
- Ring 的零 lifetime 标注与 RC 路线是易用性差异，不自动等于更强安全；
- agent 对 Rust 的训练覆盖和工具支持会持续削弱“新语言更适合 agent”的先验，B-111 必须覆盖 onboarding 成本。

---

## 5. 最接近的产品与叙事竞品

### 5.1 MoonBit：最接近的应用语言产品

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

### 5.2 BAML：已经正面占据“programming language for agents”

2026-08-13 专项复核确认，BAML 已不再只把自己描述成 prompt/structured-output DSL。官方默认分支、仓库 description 与新官网统一使用 **“the programming language for agents”**；新 BAML Language 通道已发布 0.16.0，原 0.225.0 系列被明确标为 legacy BAML v0。两条产品面仍处于迁移期：旧文档首页继续把 BAML 定义为 structured-output DSL，而新官网与 canary 工具链已经展示更广的 standalone agent/workflow language。

#### 已交付或可由官方产物核验的产品面

- TypeScript 风表面包含 union、generic、lambda 与 pattern matching；类型在 runtime 保留，公开设计排除 `any` 和 unchecked cast，并以 typed error/`throws` 进入函数类型；
- Rust 实现的 compiler、bytecode VM、GC 与 async engine 支撑 standalone `baml run`、green-thread/colorless workflow、取消和并发；这不是 Ring 的 C11 AOT + Perceus deterministic RC 路线；
- wrapper/toolchain 可安装、固定 project-local 版本并跨 macOS/Linux/Windows 运行；Python、TypeScript、Go、Rust、Java、C#、C++、Kotlin、Swift 等宿主通过生成 bridge 渐进采用；
- `baml agent install` 提供版本匹配的 agent skill，`baml describe` / `baml grep` 面向 agent 暴露语言与项目事实；IDE/LSP、内建 tests/evals、标准库和本地 tracing 已形成连续产品面；
- “Agent Tries BAML” 公开了 run、agent、finding、skill arena 与 pinned build 的反馈结构，明确把 agent 真实写程序、发现问题、修复并在新 build 复验作为语言迭代输入。

官网还宣称 compiler 快于 Go、semantic search 优于 ripgrep、pack 产物小于 Bun，以及 tracing 相对 OpenTelemetry 的数量级优势。本轮没有把这些营销数字核验为可独立重放的 benchmark，也没有确认 Agent Tries BAML 已提供稳定的跨语言对照协议与完整 raw manifest；因此它们当前只算**官方宣称/方法信号**，不能进入 Ring 的性能或 agent-efficiency 事实账本。

#### 与 Ring 的关键差异

| 维度 | BAML | Ring |
|---|---|---|
| 首要 workload | LLM function、agent/workflow、eval 与宿主应用嵌入 | 普通 native CLI/应用；agent 是重要作者/消费者而非唯一运行对象 |
| 执行与资源 | bytecode VM + tracing GC + async engine；多宿主 bridge | C11 AOT + Perceus RC；确定性资源与显式 failure/effect 是语言公理 |
| 类型/行为契约 | 严格 runtime-preserved types、typed errors，强调无 `any`/unchecked casts | HM/trait + inferred `io/fail/mut` + handler + ownership/resource contract |
| Agent 产品面 | skill、`describe`/`grep`、eval、公开 agent feedback loop 已可见 | 结构化诊断已有；B-174/B-177/B-111 仍待形成可安装、可测量闭环 |
| 采用路径 | standalone + 多语言渐进 bridge，降低替换成本 | 目标是独立 native application language；首个 preview 不以 FFI bridge 生态为前置 |

结论：**威胁为高，但主要是产品、采用与叙事威胁，不是 effect/ownership/native 机制同构。** BAML 已使“专为 agent 的编程语言”成为有安装入口、runtime、工具链和反馈系统的公开品类；Ring 不能再把 LLM-first/agent-readable 本身当差异。可辩护边界应收窄到 inference-first native application language、显式 effect 与确定性资源语义，并由 B-111 量化。

路线响应不新增独立 backlog：B-174/B-175 继续先交付 standalone preview；B-177 把 `describe`/`grep`/version-matched skill 当产品基准但仍只导出 checker/HIR 权威事实；B-111 保持用户已拍板的 TypeScript 7 单一对照，先完成可归因实验，再决定是否以独立扩展研究 BAML。不能为追赶其宿主 bridge、GC VM 或 workflow stdlib 扩大首个 preview 范围。

### 5.3 Zero：graph-native 已从叙事推进为完整 agent loop

2026-08-03 复核官方 main 后，Zero 的定位比 7 月 28 日记录更激进：semantic graph 明确成为 program database，`.0` 文本是 human-readable projection，而不是普通 authoring 真值；checked graph 是 compiler input。其公开 loop 已包括：

- `zero query` / `zero inspect` 获取 stable graph facts，`zero patch` 以 graph hash 拒绝陈旧或非法编辑；
- `zero check` / `zero test` / `zero run` 覆盖日常闭环，并提供一行安装与 `--version`；
- compiler 随版本提供 language/stdlib/agent/graph skills，减少外部 primer 漂移；
- `World`/capability 与 graph model 仍不同于 Ring 的 inferred effect + 普通文件/Git 路线；项目继续明确标为 experimental，不应把产品面完整误写成 production safety。

这使 Zero 的威胁从“agent-first 叙事”上升为“agent compiler 产品面”。Ring 不应复制 graph-native source-of-truth：这会牺牲现有 Git/文本生态并引入第二套存储模型。合理响应是 B-174/B-175 先交付可安装的 check/build/run/doctor，再由 B-177 从 checker/HIR 导出只读、版本化的 identity/signature/effect/import/unsafe contract，配套 source hash stale guard 与 bundled primer。是否需要 checked patch 必须由 B-111/真实 agent loop 证据另行立项，不能因竞品存在就预设。

### 5.4 Mojo：资源与叙事强，主战场不同

Mojo 最新稳定通道为 1.0 Beta 2，Modular 主仓约 26.6k stars。已发货/公开方向包括：

- Pythonic 表面、typed errors、linear types、compile-time reflection；
- CPU/GPU/AI kernel 与模型服务的深度整合；
- 官方 agent skills 与“更早编译期反馈降低 agent 成本”的叙事。

Mojo 编译器本身的开放范围仍需区分于 Modular 主仓中的开源组件。它没有把通用 algebraic effects/handlers 作为应用语言核心。因此对 Ring 是**资源与心智竞争**，不是 effect 机制的直接替代。

---

## 6. Effect 与语义程序表示赛道

### 6.1 Koka：最接近的理论与实现来源

Koka v3.2.3，2026-08-03 官方 dev 主线仍活跃。它已经证明：

- polymorphic type/effect inference 与 algebraic handlers 可工程实现；
- evidence passing 可把 handlers 降为高效直接代码；
- Perceus 可把精确 RC 与 reuse analysis 结合；
- C backend 能承载这些语义。

Koka 是研究语言，生态、async library、包管理与 production support 不是其强项。它对 Ring 的意义是“核心算法并非空白创新”，也是 correctness 风险提醒：近期仍出现 Perceus 相关 UAF 修复，静态资源 pass 必须有 verifier 和回归门。

Ring 的差异在 application-facing 语法、有限 handler 语义、`mut` 可见性、自举、agent 诊断与产品目标，而不在“拥有 effects/Perceus”本身。

### 6.2 Flix：直接机制近邻

Flix v0.75.1，项目保持活跃。其 effect system 已覆盖：

- effect polymorphism、subeffecting、effect exclusion；
- primitive/algebraic/heap effects 与 handlers；
- purity reflection 和 associated effects；
- 用 purity 信息驱动自动并行化、dead-code elimination 与 inlining。

Flix 官方还直接讨论并实验 LLM 对新语言和 effect 代码的影响。这意味着“effect 签名帮助 LLM”并非 Ring 独占的话语空间，Ring 必须更快产出可复现实验和 application-native 体验。

Flix 偏函数式/JVM 与研究型生态，市场替代威胁有限；机制与 AI 论证威胁为中高。

### 6.3 Effekt：活跃的 capability/effect 实验场

Effekt v0.74.0 于 2026-07-27 发布，近期版本密集。核心包括：

- algebraic effects/handlers；
- contextual effect polymorphism；
- capability 与 resource 表达；
- JS 等后端及持续推进的 C FFI。

Effekt 是研究语言，但其活跃度说明 handler/capability 设计仍在快速迭代。Ring 应持续把 handler 子集的取舍写清：当前只做 tail-resumptive + abort，full AE 不在计划中；“完整代数效果”已不再是准确措辞。

### 6.4 Unison：effects + semantic codebase 的最强先例

Unison 已发布 1.0，当前 1.3.0；官方 1.0 数据显示已有数千项目作者和十万级发布定义/下载。它把：

- algebraic effects（abilities）与 handlers；
- 内容寻址的 codebase；
- 基于 identity 的 rename/refactor；
- 分布式计算模型；
- MCP/agent 工具

放在同一产品中。

Unison 的函数式、分布式与 codebase-as-database 产品模型和 Ring 不同，但它反驳了“effect + 语义程序库 + agent 工具无人组合”的说法。Ring 的区别应落在普通文件/Git 兼容、应用语言手感、effect inference、native 与确定性资源语义。

---

## 7. Verus：形式化验证与 AI proof 的首要参照

### 7.1 它是什么，不是什么

Verus 是在 Rust 子集上增加规范与证明的验证工具链，不是面向一般应用开发的新语言。它处于活跃开发期，README 仍明确提示缺失/损坏特性和不完整文档；同时维持每周滚动发布，并已用于多个真实系统研究。

它对 Ring 的竞争主要发生在“安全/正确性到底能保证到哪一层”的叙事，而不是语法、包生态或普通应用开发。

### 7.2 管线与架构

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

### 7.3 保证、成本与 TCB

Verus 可以验证内存安全和功能正确性，但保证相对于用户规范与信任边界成立：

- `assume`、`external_body`、`external_fn_specification`、`external` 等会引入假设；
- TCB 包含顶层规范、Verus verifier、SMT solver 与 Rust 编译器；
- SMT 推理一般不可判定，工程上依赖 trigger、invariant、分解和 resource limit；
- Verus 不把“只经 Rust typecheck”视为足够：其 raw pointer/权限代码必须实际完成验证。

SOSP 论文的 5 个系统案例合计约 6.1K 行实现代码和 31K 行证明代码，说明它能处理真实低层系统，也说明完整证明仍有显著规格/lemma 成本。论文报告的速度优势是相对其他验证系统，不等于普通编程零成本。

### 7.4 权限模型对 Ring 的启发

Verus `vstd::raw_ptr` 用 `PointsTo`、`PointsToRaw`、`Dealloc` 等 ghost permissions 描述地址、provenance、metadata、初始化状态与释放权。这比“裸指针在 unsafe 块里所以没问题”强得多。

对 Ring 的可用映射：

- 当前 `unsafe` effect + `Ptr<T>` 保留显式 discharge 和 `ring audit unsafe` 审计面；
- RIIR 稳定后，可研究**可选**的 pointer permission verifier，把常见 raw pointer 义务静态化；
- 即使未来实现，也应是局部 verification lane，不把所有普通 Ring 代码变成 Verus 风格 proof engineering。

### 7.5 VerusBelt：soundness 证据也有边界

PLDI 2026 VerusBelt 给出了 Verus 重要子集的首个语义 soundness 证明，覆盖 proof-oriented types、lifetime/borrow/concurrency 等关键机制。其边界同样重要：

- 证明针对形式化模型中的重要子集，不是对整个 Verus 实现二进制的验证；
- 部分常用库按 axiomatized 方式建模；
- 编译器、solver 与规范仍属于整体信任链。

对 Ring 的教训是：文档应同时公布“证明了什么”和“没有证明什么”，不要把 verifier 通过压缩成无条件“安全”。

---

## 8. AI 证明生态：证明编写正在被自动化，信任边界没有消失

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

## 9. Agent 构建与小语言基准

### 9.1 Rue：持续活跃的 agent 编译器工程基准

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

### 9.2 Mog：规格压缩仍有启发，动量低

Mog 是小型、可嵌入、面向 agent 的静态语言：

- 完整规范约 3,200 tokens；
- safe Rust compiler/runtime 规模小；
- host capability、安全嵌入与 native codegen；
- 2026-03-09 后未见新提交，当前产品威胁低。

其启发仍有效：Ring primer 应把**稳定核心语言 + 高频 std 签名**控制在可预测上下文预算内，并由 B-111 实测 onboarding token 成本。

### 9.3 外围 agent DSL

Pel、Quasar、Dana、Darklang 的 agent 化方向主要是 workflow/orchestration、自然语言动作或“AI 唯一作者”，和 Ring 的 native application language 不同。它们可作为叙事雷达，不应与能编译、运行、自举的语言放在同一成熟度表中。

---

## 10. Ring 的真实位置

### 10.1 已有能力

- 自举编译器，Ring 源码贯穿主编译管线；
- HM 推断、trait、row-polymorphic effect 基础；
- `io` / `fail` / `mut` 可见，tail-resumptive + abort handler；
- Perceus L0/L1 RC 与 post-RC `LEAK/UAF/BALANCE` verifier；
- C11 是唯一 native codegen/bootstrap，覆盖单文件/project/self-host；tracked `dist-c` 达到文本固定点，最后 LLVM lane 只保存在历史 tag；
- `unsafe` effect、`Ptr<T>` 与显式 discharge/audit 面；
- 结构化/LLM 诊断基础。

### 10.2 尚未兑现，不能写成现状

- async effect 设计已有，但 native 实现未发货；
- full algebraic effects/multi-shot continuation 明确不做；
- refinement types 未实现，参数位 `where` 目前仍是 parse error；
- RIIR 标准库迁移尚未完成；
- Drop 的 C-native abort unwind、Weak 与若干已知 critical RC/runtime 缺陷尚未收口；
- CLI 仍只有 `check/build`，缺可安装 bundle、exe link/run/doctor、跨平台 release matrix 与版本化 agent inspection contract；
- LSP 暂不可用；
- B-111 尚无一轮公开、可复现的 Ring vs TS7 数据；
- “Rust 级安全”“LLM 更容易写对”“语义驱动性能领先”仍需分项证据，不是现成事实。

### 10.3 三支柱

1. **推断默认行为契约**：普通代码尽量不写类型/effect/ownership 注解，但编译器产生稳定、可读、可机器消费的签名；
2. **确定性资源与失真可见**：RC/Drop/unsafe discharge/审计面把不可自动保证的部分显式列出；
3. **可验证的 agent 闭环**：诊断、语义 query、受检 patch、隐藏测试与 bounded proof 共同缩短生成—验证循环。

“语义驱动性能”仍是长期收益，但在 B-181 生成程序基线、RIIR 与 ownership 边界未完成前，不应与已发货支柱并列宣传为已证明优势。B-176/B-180 解决的是 compiler/check 反馈吞吐，不能把开发工具 wall-time 改善混报为用户程序性能。

### 10.4 可对外使用的一句话

> **Ring 是面向人和 coding agent 的 native 应用语言：像脚本语言一样少写标注，但让编译器推断行为契约、管理确定性资源，并把无法证明的边界明确暴露出来。**

若需要更技术化的版本：

> **Ring 把 HM 类型/effect inference、Perceus RC 和结构化 agent feedback 组合成默认应用开发路径；bounded refinement 是其可选增强，而不是普通代码的证明税。**

---

## 11. 相关工作项

- **B-174/B-175**：交付可安装、可运行、可诊断的 preview CLI 与 Windows/Linux candidate artifacts；BAML 的 wrapper/toolchain pin/run/bridge 说明版本匹配与渐进采用已成为竞争基线，但首个 Ring preview 不以多宿主 bridge 为前置。
- **B-176/B-180**：建立 `check`、RC/self-verify、runner/self-compile 的可复现 baseline，并以不减覆盖的 2× wall-time 改善恢复快速开发反馈。
- **B-181**：单独建立生成程序 runtime、内存/分配与产物尺寸的 release baseline/budget。
- **B-177**：导出版本化只读 semantic inspection contract 与 bundled primer，不改变源码/Git 真值模型；对照 BAML `agent install`、`describe`/`grep` 与 Zero query/inspect 的可发现性，但只消费 checker/HIR 权威事实。
- **B-168**：在 B-176/B-180 工具链吞吐专项后确定 C-native failure/control ABI 及其 Drop、TCB 与可移植性边界。
- **B-111**：用固定模型、预算和公开 artifact 复现 Ring vs TypeScript 7 的 agent 开发对照；借鉴 BAML 的 run/finding/skill-variant/build-pin 回流形态，不把其未独立核验的结果当先验，也不在首轮擅自增加第三对照。
- **B-001**：保持 refinement bounded、deterministic，并显式记录 solver、整数模型与 assumption 边界。

---

## 12. 复查节奏与触发条件

### 12.1 GitHub 竞品雷达

公开的 [`Ring-lang` Star List](https://github.com/stars/YYF233333/lists/ring-lang) 是本报告的持续观察入口，由 Repository Steward 依 `docs/workflow.md` 的 standing authorization 维护。每轮竞品复查先读取该清单，再按本报告的一手来源纪律核验事实；复查可在同一工作中自主 Star 官方仓库、更新描述及增删清单成员，无需逐项请求用户确认。

纳入清单至少满足一项：① 可直接替代 Ring 的产品或工具链；② 与当前类型/effect/ownership/resource/verification 设计有实质机制重叠；③ 对 agent 开发闭环、诊断、语义 inspection、发布工具链或执行速度构成可复核基准；④ 正在为活动 backlog 提供一手实现或实验参考。优先收录官方、canonical、仍可核验的仓库；同一项目默认只收一个主仓，只有独立的 agent/eval/runtime 子仓确实承载不同证据面时才例外。泛编译器资料、仅因 stars 高而相关性弱的项目、重复镜像和不可确认来源不进入核心雷达。

清单可以是本文全景矩阵的超集：被纳入只表示“值得观察”，不表示直接竞品、成熟、正确或已采用。移出清单通常只表示重复、长期失活或已不再影响当前决策；默认保留用户原有 Star。GitHub stars、更新时间与提交频率只能用于发现复查对象，任何进入本文的能力、版本、威胁或行动结论仍须回到官网、官方仓库、release notes、论文或会议页面核验。

### 12.2 复查节奏

常规保鲜期：**6 周**。下次定期复查建议不晚于 2026-09-14。

出现以下任一事件时提前复查：

- MoonBit 1.0/RC 发布，或 `moon prove` 去掉 experimental；
- Zero 发稳定 release、公开采用数据，或 graph-native 工作流发生重大改变；
- BAML 新 language channel 离开 canary/达到 1.0，旧 v0 文档与新语言产品面完成收口，或 Agent Tries BAML 发布可独立重放的协议、raw traces 与跨语言结论；
- TypeScript 7.1 恢复 programmatic API，主流 framework 完成迁移；
- Verus/AI proof 出现公开生产级采用或显著降低 proof/implementation ratio；
- Flix/Effekt/Unison 发布直接面向 coding agent 的 effect benchmark；
- Ring B-111 首轮数据或 B-001 design probe 产出，足以反向修改本文结论。

每轮复查必须同时更新日期、版本、保证层、行动映射；不再在顶部追加互相矛盾的“增量节”。

---

## 13. 主要一手来源

### 主流替代

- TypeScript：[Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- OpenAI：[OpenAI to acquire Astral](https://openai.com/index/openai-to-acquire-astral/)
- Astral：[About Astral](https://astral.sh/about)
- Rust：[The Rust Programming Language](https://doc.rust-lang.org/book/)

### 直接与相邻语言

- MoonBit：[v0.10.4 release](https://www.moonbitlang.com/updates/2026/07/13/moonbit-0-10-4-release)、[v0.10.0 release](https://www.moonbitlang.com/updates/2026/06/08/moonbit-0-10-0-release)、[Formal Verification](https://docs.moonbitlang.com/en/latest/language/verification.html)
- Zero：[vercel-labs/zerolang](https://github.com/vercel-labs/zerolang)、[releases](https://github.com/vercel-labs/zerolang/releases)
- BAML：[BoundaryML/baml](https://github.com/BoundaryML/baml)、[BAML Language 0.16.0](https://github.com/BoundaryML/baml/releases/tag/baml-language-0.16.0)、[new language overview](https://boundaryml.com/)、[quickstart](https://boundaryml.com/quickstart)、[changelog](https://boundaryml.com/changelog)、[Agent Tries BAML](https://boundaryml.com/atb)
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
