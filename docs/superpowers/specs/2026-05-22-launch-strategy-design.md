# Ring-lang 宣发策略设计文档

> 2026-05-22 定稿。本文档为 Ring-lang 从零到公开发布的完整宣发方案。

## 核心叙事

**一句话**：Ring-lang 让 LLM 独立完成软件开发——无人回路，飞轮效应。

**叙事层次**：

1. **表层（吸引注意）**：一门按天计进度的编程语言——路线图本身就是速度证据
2. **中层（建立兴趣）**：LLM 只需读函数签名就能正确使用 API，因为每种副作用都在签名中可见
3. **深层（留住用户）**：完整代数 effect 系统 + HM 推断 + 自举编译器——理论深度无竞品

**禁忌**：不直接吹"7 天 242 commit"——用按天计的路线图让读者自己算。自己得出的结论比被告知的更有冲击力。

---

## 发布前准备物料

### 1. GitHub README

**风格参考**：[oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent)——人格驱动、叙事弧线、可扫描、有态度。

**结构**：

```
1. 开场（用户定调，飞轮叙事切入）

2. 一句话定位（侧重叙事）
   LLM 独立完成软件开发 → 无人回路 → 飞轮效应

3. 按天计路线图（间接展示速度）
   Day 1-7:  自举编译器 ✓
   Day 8-9:  Phase B (mut<S> + 模块完善) ✓
   Day 10-12: LSP ✓
   Day 13:   Refinement types 原型 ✓
   ...持续更新

4. "Why another language?" 对比表
   | | TypeScript | Ring |
   |---|-----------|------|
   | 函数会抛错吗？ | 🤷 读实现 | ✅ 签名可见 |
   | 函数有 IO 吗？  | 🤷 读实现 | ✅ 签名可见 |
   | LLM 只看签名能用对 API？ | ❌ | ✅ |

5. Playground 链接（大按钮，不安装就能试）

6. DS V4 实测结果
   "DeepSeek V4 用 Ring 独立完成 JSON parser，
    通过 318/318 测试，零人工干预。"

7. 示例代码（极短，展示 effect 签名 vs 等价 TS）

8. 快速开始（3 行命令）

9. 技术深度链接（给想深挖的人）
   → Effect system 详解
   → 与 Koka/MoonBit 对比
   → 编译器架构
```

**关键原则**：前 3 屏决定生死。叙事开场 → 路线图（速度证据）→ 为什么值得关注 → 立即能试。技术细节全部后置。

**预估工时**：2h（AI 辅助写，用户审定调性）

### 2. 在线 Playground

**方案**：Ring 编译器产出 JS，浏览器端直接执行。将 `compiler/dist/` 打包为浏览器可用的 bundle，用户输入 Ring 代码 → 编译 → 执行 → 显示结果。

**最小功能**：
- 代码编辑器（Monaco 或 CodeMirror）
- 编译 + 运行按钮
- 输出面板（stdout + 编译错误）
- 3-5 个预置示例（effect 签名、pattern matching、trait 等）

**不做**：多文件、保存分享、LSP 集成——这些是后期功能。

**托管**：GitHub Pages 或 Vercel（免费）。

**预估工时**：1-2 天

### 3. DS V4 评测

**目标**：证明"中等水平的开源模型也能用 Ring 独立完成中型项目"。

**项目**：JSON parser（Ring 实现）

**为什么选 JSON parser**：
- 经典 PL 基准，业界公认
- [JSON Test Suite](https://github.com/nst/JSONTestSuite) 提供 318 个标准化测试
- 错误处理密集——正好展示 `fail<E>` effect 的价值
- 复杂度适中——不会太大导致失败，不会太小失去说服力

**测试设计**：

| 维度 | 具体做法 |
|------|---------|
| 模型 | DeepSeek V4（刚开源，借热度窗口） |
| 输入 | Ring 语言规范文档 + JSON spec + 任务描述 |
| 约束 | 零人工干预——模型自行编写、编译、调试、迭代 |
| 度量 | 测试通过率、编译错误→修复迭代次数、总耗时、总 token 消耗 |
| **对照组** | 同一任务用 TypeScript 完成，对比 LLM 在副作用相关 bug 上的表现 |
| 输出 | 完整 transcript + 量化数据 + 博文 |

**对照组是关键**：光说"DS V4 能写 Ring"不够。必须证明 Ring 的类型系统帮 LLM 犯更少的错——特别是 TS 里常见的"忘记处理错误""不知道函数有副作用"类 bug。

**预估工时**：1 天（实际测试 + 数据整理 + 写文）

### 4. 示例项目

2-3 个可运行的示例，展示 Ring 的实际应用能力：

| 项目 | 展示价值 | 来源 |
|------|---------|------|
| JSON parser（DS V4 产出） | fail effect + 实际用途 | 评测副产品 |
| CLI 工具（如 word count） | io effect + 参数解析 | 手写/AI 写 |
| 数据处理管线 | 多 effect 组合 | 手写/AI 写 |

**预估工时**：JSON parser 从评测中获得，其余 1 天

### 5. Error Message 对比 Demo

展示 Ring 编译器错误信息的 LLM 友好性：

- 同一个 bug，分别展示 TS 编译器报错 vs Ring 编译器报错（`--error-format=llm`）
- 将两种报错分别喂给 LLM，对比修复成功率
- 制作对比图/GIF

**预估工时**：2h

### 6. 博文（英+中双语）

**标题方向**（非最终标题）：
- 英文："Building a Self-Hosting Compiler in [N] Days: What Happens When AI Writes a Language Designed for AI"
- 中文："当 AI 为 AI 设计编程语言——Ring-lang 的飞轮效应"

**内容结构**：
1. 问题：为什么 LLM 写代码经常出错（隐藏副作用、类型信息不足）
2. 方案：effect 系统让签名携带完整行为契约
3. 证据：DS V4 评测数据 + 按天路线图
4. 愿景：飞轮效应——语言为 AI 设计 → AI 开发更高效 → 语言迭代更快 → ...

**预估工时**：半天（AI 辅助写，双语各一版）

---

## 发布节奏

### Wave 1 — 蹭 DS V4 热度（DS V4 开源后尽快）

**时间**：~5/29（视 DS V4 发布时间调整）

**发什么**：DS V4 用 Ring 完成 JSON parser 的评测报告

**发哪里**：
- Twitter/X（英文 AI 圈，@提及 DeepSeek 官方账号）
- 知乎（AI/编程话题，含中文版数据）
- Reddit r/LocalLLaMA（开源模型社区）

**叙事角度**："我们测了 DeepSeek V4 用一门新语言写 JSON parser——结果出乎意料"

**目的**：借 DS V4 流量窗口，把 Ring-lang 名字植入 AI 社区意识。不需要读者深入理解 Ring，只需要知道"有个新语言，开源模型就能写"。

### Wave 2 — Show HN（Wave 1 后 3-5 天）

**时间**：~6/2

**发什么**：
- HN "Show HN: Ring-lang — ..." 帖子（链接到 GitHub）
- 博文同步发布
- Playground 上线

**发哪里**：
- Hacker News（Show HN）
- Reddit r/ProgrammingLanguages
- 知乎 PL 话题
- V2EX

**叙事角度**：飞轮叙事 + 按天路线图。HN 标题需要精炼，候选：
- "Show HN: Ring-lang – A language where LLMs only need signatures to use your API"
- "Show HN: Ring-lang – Algebraic effects meet AI-first language design"

**目的**：建立技术可信度，吸引 PL 爱好者和深度技术用户。

### Wave 3 — 持续回应（6/2 起持续）

**做什么**：
- 去知乎 effect system 辩论帖回答（带 Ring-lang 实际代码示例）
- 回应 HN/Reddit 评论区可预期的质疑：
  - "这不就是 Koka？" → 自举 + LLM 友好设计 + JS 目标 = 实用化
  - "Effect system 值得额外复杂度吗？" → DS V4 评测数据说话
  - "训练数据不够 LLM 写不好" → 签名自描述 + 评测实证
- 发 error message 对比 demo 作为后续内容弹药
- 有节奏地发示例项目

**投入**：每周 2-3 小时

---

## 可预期的质疑与回应准备

| 质疑 | 回应策略 |
|------|---------|
| "这不就是 Koka？" | Koka 是研究语言，Ring 已自举、目标 JS、为 LLM 设计。Koka 没有 playground，没有按天出活的路线图 |
| "Effect system 太复杂" | 对人复杂，对 LLM 不复杂——签名信息越多 LLM 越不容易犯错。DS V4 数据为证 |
| "训练数据少 LLM 写不好" | 评测实证反驳。签名自描述机制不依赖训练数据 |
| "7 天写的能靠谱？" | 348 个 E2E 测试、自举（编译器编译自己）、路线图持续按天推进 |
| "为什么不用 TS + 更好的工具？" | TS 7 快 10x 仍然是"快速检查不完整的类型"。工具层补丁不改变签名信息密度 |
| "一个人的项目能持续？" | 飞轮效应——AI 开发效率本身就是项目的核心论点。按天路线图是持续的证据 |

---

## 时间线总览

| 阶段 | 时间 | 产出 |
|------|------|------|
| Phase B 完成 | 5/24 | mut\<S\> + 模块完善 |
| 发布准备 | 5/25-5/27 | README + Playground + 示例项目 + 博文草稿 |
| DS V4 实测 | 5/27-5/28 | JSON parser 评测（Ring vs TS 对照）+ 写文 |
| Wave 1：蹭热度 | ~5/29 | Twitter/X + 知乎 + r/LocalLLaMA |
| Wave 2：Show HN | ~6/2 | HN + r/ProgrammingLanguages + V2EX |
| Wave 3：持续回应 | 6/2+ | 知乎 effect 帖 + 评论区 + 后续内容 |

**从首次 commit 到公开发布：~14 天。**

---

## 成功度量

**Wave 1 后（1 周内）**：
- GitHub stars > 100
- 至少 1 个非作者的 issue 或 PR

**Wave 2 后（2 周内）**：
- GitHub stars > 500
- HN 帖子 > 50 points
- 知乎回答 > 100 赞

**1 个月后**：
- GitHub stars > 1k
- 至少 3 个外部贡献者
- DS V4 评测被至少 1 家科技媒体引用

这些是乐观但非不切实际的目标。Zero 首日 900 stars 表明 AI-first 语言赛道有足够的关注度。Ring-lang 的技术深度更强，但缺乏品牌加持，因此预期低于 Zero 但应在同一数量级。

---

## 后续可选动作（不在首发范围）

- 学术短论文（投 LMPL 或类似 workshop）
- 官网（当前 GitHub README 足够）
- Logo 设计
- Discord/微信社区
- 更多评测（Claude / GPT-4 / Gemini 对比）
- "用 Ring 重写 X" 系列博文
