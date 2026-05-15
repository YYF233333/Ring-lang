# CLAUDE.md

## 项目概述

Ring-lang：面向大型多端应用的编程语言，转译到 JavaScript/V8 运行。

核心特性：代数 effect system、refinement types、ML 级类型推断、row polymorphism + OOP 手感模拟。设计目标：LLM vibe coding 友好性优于 TypeScript。

完整设计文档见 `docs/design.md`。

## 技术栈

- **编译器实现语言**：TypeScript（Node/Bun 运行）
- **编译目标**：JavaScript（V8 运行时）
- **标准库**：Ring-lang 自身（dogfooding）
- **LSP/IDE**：TypeScript（VS Code 扩展）
- **参考实现**：Koka 编译器（MIT 许可），用于 effect 推断、evidence passing 等复杂算法的翻译

## 项目结构

```
Ring-lang/
├── docs/              -- 设计文档
│   └── design.md      -- 完整语言设计（15 章）
├── compiler/          -- TS 编译器实现
│   ├── src/
│   │   ├── parser/    -- 递归下降 parser
│   │   ├── checker/   -- 类型推断 + effect 推断
│   │   ├── codegen/   -- Typed IR → JS 翻译
│   │   └── cli.ts     -- ring build / ring run 入口
│   ├── package.json
│   └── tsconfig.json
├── stdlib/            -- Ring-lang 标准库（Ring-lang 编写）
│   ├── core.ring      -- Option、Cell、基础 trait
│   └── ...
├── lsp/               -- VS Code LSP 扩展
├── examples/          -- 示例代码
└── tests/             -- 编译器测试
```

## 开发约定

- 编译器代码风格：TypeScript strict mode，snake_case 用于 Ring-lang 相关标识符
- 编译器必须编译速度快（亚秒级增量编译），因为 IDE 耦合
- 复杂算法（effect 推断、evidence passing、Perceus）参考 Koka 的 Haskell 实现翻译，标注来源
- 生成的 JS 代码应是可读的——方便调试和理解翻译逻辑
- 标准库是最早的 dogfooding，用当前已实现的 Ring-lang 子集编写

## MVP 路线图

### Phase 1：可以玩的编译器
- Parser（递归下降）
- struct + enum + pattern matching（穷尽性检查）
- HM 类型推断
- UFCS + impl 块方法解析
- fail effect 的 4 层甜度（冒泡/or/catch/handle）
- JS 代码生成 + 运行

### Phase 2：有手感的语言
- Trait 系统 + 泛型约束
- Effect 推断（io + fail + mut）
- Row polymorphism
- 完整 effect handler（evidence passing）
- 基础 LSP server
- `--error-format=llm` 结构化错误输出

### Phase 3：研究向扩展
- Refinement types
- Dependent types lite
- Formatter 自动标注等级系统
- 渐进式自举

## 常用命令

```bash
# 编译器开发
cd compiler && npm install && npm run build

# 运行 Ring-lang 程序
node compiler/dist/cli.js run examples/hello.ring

# 运行编译器测试
cd compiler && npm test
```
