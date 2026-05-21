# Ring-lang 竞品与行业定位

> 从 `docs/design.md` 分离（2026-05-21），完整竞品分析独立维护。

## MoonBit——最直接的竞品

MoonBit（ICSE 2024 论文，2025 beta）由张宏波创建（OCaml 核心贡献者、BuckleScript/ReScript 作者、前 Meta Flow 团队），深圳 IDEA 研究院。在实现成熟度上远远领先 Ring-lang。

**重叠度高：**

| 特性 | MoonBit | Ring-lang |
|------|---------|-----------|
| 类型系统 | ML 系：ADT + 泛型 + trait + 推断 | ML 系：ADT + 泛型 + trait + 推断 |
| 不可变优先 | 是 | 是 |
| 编译目标 | WASM + JS + Native（Perceus RC） | JS 原型，计划 WASM + Native |
| AI 友好 | ICSE 论文 + constrained decoding + `declare` 关键字 | 语言设计 + 编译器反馈 + 模块签名压缩 |
| 编译速度 | 极快（号称 9x Rust） | 依赖 TS→JS |

**核心差异——Ring-lang 追踪的范围更广：**

| | MoonBit | Ring-lang |
|---|---------|-----------|
| 错误追踪 | `raise`/`suberror`，编译时追踪 | `fail<E>` effect，编译时追踪 |
| IO 追踪 | 不追踪——签名看不出是否有 IO | `io` effect 签名可见 |
| 可变性追踪 | 不在类型中追踪 | `mut` effect 签名可见 |
| 异步追踪 | 不追踪 | `async` effect 签名可见 |
| Effect handler | 无 | 完整：声明、推断、handler、重解释、测试 mock |
| Refinement types | 无 | 核心特性 |
| Row polymorphism | 无 | 核心特性 |
| Dependent types lite | 无 | 计划特性 |

一句话：**MoonBit 追踪错误，Ring-lang 追踪一切副作用。** 对 LLM 而言，Ring-lang 的模块签名携带更多信息，LLM 需要更少上下文即可正确使用 API。

**诚实评估：MoonBit 在实现和工程上全面领先。** Ring-lang 的理论独特性在 effect 系统完整性和 refinement types。如果要推进，必须能回答"为什么 effect 系统比 MoonBit 的 checked exceptions 值得额外的复杂度？"

注：MoonBit 曾被评估为 fork 基础，但因 MoonBit Public License（魔改 SSPL）禁止商业 fork 而排除。其性能数据（"比 Rust 快 9x"等）为自报，无独立基准验证。

## Zero（Vercel Labs, 2026-05）——agent-first 系统语言

Zero（zerolang.ai）是 Vercel Labs 推出的 agent-first 系统语言，v0.1.3，Apache-2.0，3.5k stars。定位：**AI agent 是一等用户，语言和工具链从零为 agent 设计**。

**编译器架构（基于源码分析）：**

编译器 100% C 实现（12 个源文件，~1.7MB），无自举——C 是实现语言，不是 bootstrap 语言。

**核心技术选择**：无 LLVM、无 QBE、无汇编器——直接手写 x86-64/ARM64 机器码字节 + 自行构造 ELF/Mach-O/COFF 二进制格式。8 个编译目标。Runtime 源码以 C 字符串数组形式嵌入编译器二进制。

**Zero vs Ring-lang 对比：**

| 维度 | Zero | Ring-lang |
|------|------|-----------|
| 切入点 | **工具链** — JSON 诊断、修复计划、machine-readable 一切 | **语言** — effect 系统、严格编译器、最小语法面 |
| 类型系统 | 中等深度：泛型 + interface 约束 + choice | 激进：refinement/dependent lite/row poly/HM 推断 |
| 副作用追踪 | Capability 对象（`World`），仅区分"有IO/无IO" | 完整代数效果系统（io/fail/async/mut 独立追踪） |
| 所有权/安全 | `owned<T>`/`ref<T>`/`mutref<T>` + borrow check | GC，零心智负担 |
| 编译目标 | 原生二进制（手写 code emitter） | JS → WasmGC → LLVM |
| 错误处理 | `raises { ErrorName }` + `check`/`rescue` | `fail<E>` effect + catch + handler |

**核心差异：Zero 没有 effect 系统。** `World` 只能区分"有 IO / 无 IO"，无法独立追踪四种 effect、展示传播链、通过 handler 重解释 effect。

**Zero 的工具链亮点（Ring-lang 应借鉴）：**
- `zero check --json`：stable error code + typed repair object
- `zero fix --plan --json`：machine-readable 修复步骤
- `zero explain <code>`：版本匹配的错误解释
- `zero graph --json`：依赖拓扑
- `zero skills get zero --full`：agent 引导指南

**评估：**
- Zero 的工具链深度领先 Ring-lang
- Ring-lang 的副作用追踪维度远超 Zero
- 两者定位不直接冲突：Zero 是系统语言，Ring-lang 是应用语言
- 真正的竞争在叙事层面：Zero 有 Vercel 品牌加持

## Mog（Voltropy, 2026-03）——嵌入式 agent 语言

定位"静态类型的 Lua"。MIT 许可。**核心卖点：完整语言规范仅 3,200 tokens。**

| 维度 | Mog | Ring-lang |
|------|-----|-----------|
| 定位 | 嵌入式脚本 | 通用应用语言 |
| 规范大小 | ~3,200 tokens | 远大于此 |
| 安全模型 | Capability 沙箱 | Effect 系统编译时追踪 |
| 类型系统 | 基础静态类型 | HM + refinement + row poly |

**启发：** "规范塞进上下文窗口"是强力叙事角度。

## 其他 agent-first 项目

- **Dana**（Aitomatic / AI Alliance, 2025）：agent 编排语言，企业定位，非通用 PL
- **Rue**（Steve Klabnik, 2025-12）：简化版 Rust，`inout` 参数替代借用检查器。整个编译器由 Claude 在 2 周内完成
- **Darklang-GPT**（Paul Biggar）：转向"AI 是唯一的代码编写者"
- **Pel**（2025 arXiv）：AI agent 编排语言
- **PACT**：概念级 LLM 友好语言，编译到 Rust

**Ring-lang 的独特组合（完整代数效果 + HM 推断 + LLM 友好性）仍无直接竞品。**

## "够用就行"威胁——现有语言的 AI 适配

| 力量 | 做什么 | 威胁等级 |
|------|--------|---------|
| **Constrained decoding** | 限制 LLM token 采样，保证输出符合语法 | 高 |
| **OpenAI 收购 Astral** | Ruff + uv + ty 集成 Codex，Python "够用"上限拉高 | 高 |
| **TypeScript 7 / Project Corsa** | Go 重写 TS 编译器，10x 加速，AI 工具集成 | 高 |
| **LSP 桥接** | 任意语言的 LSP 包装为 MCP/agent 接口 | 中 |
| **Spec-driven 开发** | 结构化意图层补偿语言弱点 | 中 |

**Ring-lang 的反论**：工具层补丁无法改变签名信息密度、副作用 bug 捕获、业务规则编码深度。

## 学术验证

- **LMPL 2025**：代数效果分离 LLM 工作流副作用，验证 effect 系统赌注
- **TypePilot**（EPFL）：高级类型系统是 AI 代码正确性的乘数
- **SimPy**（ISSTA 2024）：为 AI 优化语法有实际收益
- **AlphaVerus**：LLM 生成形式化验证代码
- **Kleppmann "Vericoding"**：AI 将使形式化验证主流化

## "死亡螺旋"风险

新语言训练数据少 → LLM 写得差 → 没人用 → 训练数据更少。

Ring-lang 的独特缓解：**模块签名自描述**。Effect 系统让模块的完整行为契约压缩在签名中，LLM 只需签名即可正确使用 API。
