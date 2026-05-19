# 自举阻塞项审计报告

审计时间：2026-05-19
审计范围：compiler/src/ 下 35 个非测试 .ts 文件（~16,000 行）
审计目标：发现将编译器从 TypeScript 重写为 Ring 的所有阻塞项
审计员：Claude Opus (全文件审计) + DeepSeek V4 Pro (独立交叉验证)

---

## CRITICAL — 不解决无法自举

### ✅ C1. 可变 Map/Set — Ring 集合全部不可变
- **状态**: 已修复 — List/Map/Set 的 push/concat/reverse/insert/remove 改为原地修改（返回 Unit），HOF 和派生方法保持返回新值

### ✅ C2. FFI / extern 声明 — 无法调用 Node.js API
- **状态**: 已修复 — `extern fn name(params) -> RetType` 全管线实现（Lexer→Parser→Checker→Codegen→LSP→模块系统），函数名直接映射 JS 全局函数，支持 pub 导出和跨模块导入

### ✅ C3. try/finally 清理语义 — Effect handler 无 finally
- **状态**: 已关闭（设计决策）— `defer` 不符合 Ring 的 effect system 设计哲学。自举时 ~10 处 try/finally 全部使用闭包模式 `with_scope(fn() { ... })` 绕过，不新增语言特性

### ✅ C4. Str 字符索引 — Lexer 核心循环受阻
- **状态**: 已修复 — 新增 `Str.byte_at(i) -> Str`（直接返回，越界返回 undefined），Lexer 自举时使用此方法替代 `str[i]`

### C5. Struct 更新语法 — zonk.ts 等大量复制+修改模式
- **状态**: 推迟 — C6（enum 命名字段 + field punning）实现后，zonk.ts 的 ~46 处 spread 可通过命名字段解构+重建覆盖。自举时评估冗长度后按需追加

### ✅ C6. Enum 命名字段 — AST/HIR/Type 翻译可行性
- **状态**: 已修复 — 支持花括号命名字段声明 `Variant { field: Type }`、命名构造 `Variant { field: val }`、命名模式匹配 `Variant { field, .. }`（含 field punning 和 partial match `..`）。位置字段和命名字段可在同一 enum 中共存。struct 字面量同步支持 field punning

---

## MAJOR — 需要显著重构但 Ring 基础能力可覆盖

### M1. Class → struct+impl+Cell 重构
- **严重性**: MAJOR
- **位置**: 10个class（Lexer, Parser, TypeEnv, InferEngine, CodeGenerator, CollectingSink, DocumentManager, CompileError, UnificationError, LSP Server相关）
- **频率**: 全编译器架构
- **问题**: Ring 没有 class。所有 class 需重写为 struct + impl block。可变字段需 Cell<T> 包装。this 映射为 self 参数。
- **绕过**: struct + impl + Cell<T> 已足够。但工作量大（~50个可变字段需 Cell 包装）。
- **需要**: 无新特性，但依赖 C1（可变 Map/Set）解决
- **状态**: 可绕过（已有语言特性覆盖）

### ✅ M2. Type aliases — `type X = Y`
- **状态**: 已修复 — `type Name<T> = TypeExpr` 语法糖，支持泛型参数，checker 注册后在类型解析时自动替换

### ✅ M3. 数字解析/格式化 — parseInt / parseFloat / toString
- **状态**: 已修复 — 新增 `parse_int(Str) -> Option<Int>`、`parse_float(Str) -> Option<Float>` 自由函数 + `Int.to_str()`、`Float.to_str()` UFCS 方法，声明在 std/num.ring

### M4. JSON 序列化 — debug + LLM format 输出
- **严重性**: MAJOR
- **位置**: cli.ts(debug), diagnostics/formatter.ts(LLM format), codegen/codegen.ts(2处)
- **频率**: ~10处
- **问题**: `--error-format=llm` 输出 JSON。debug 模式打印 AST 的 JSON。没有 JSON.stringify 就无法生成这些输出。
- **绕过**: 手写 JSON 字符串拼接（可行但脆弱），或 FFI 调用 JSON.stringify。
- **需要**: 内置 json_stringify 或 Display trait + 自动序列化
- **状态**: 未修复

### ✅ M5. Str 补充方法 — padStart / repeat / charCodeAt
- **状态**: 已修复 — 新增 `Str.pad_start(length, fill)`、`Str.repeat(count)`、`Str.char_code_at(i)` 方法，声明在 std/str.ring

### ✅ M6. for (k, v) in map — Map 解构迭代
- **状态**: 已修复 — `for (k, v) in map { ... }` 语法糖，Map 直接可迭代（生成 JS `for (const [k, v] of map)`），也支持 List<Tuple> 的解构迭代

### M7. typeof / instanceof — 运行时类型判断
- **严重性**: MAJOR
- **位置**: checker/infer.ts(string_interp parts), parser/parser.ts, cli.ts(instanceof CompileError)
- **频率**: typeof 6处, instanceof ~10处
- **绕过**: string_interp parts 重构为 `enum InterpPart { text(Str), expr(HExpr) }`。instanceof 用 typed catch + enum 变体替代。
- **需要**: 无新特性，但需重构 string_interp 内部表示
- **状态**: 可绕过

### M8. ?? 和 ?. 运算符
- **严重性**: MAJOR
- **位置**: 全编译器散布（?? 24+处，?. 10+处）
- **绕过**: `??` → Ring `or`（对 Option 类型）。`?.` → `if let` 或 match。
- **需要**: 无新特性
- **状态**: 可绕过

---

## MINOR — 容易绕过

### m1. async/await + dynamic import — 仅 cli.ts LSP 延迟加载（可改静态导入）
### m2. as const — 仅类型层面，Ring 不需要
### m3. Array.from / Array.isArray — 用循环或 List 操作替代
### m4. Date.now() — 仅 cli.ts 临时文件名（用计数器替代）
### m5. setTimeout/clearTimeout — 仅 LSP（自举不需要）
### m6. vscode-languageserver — 仅 LSP（自举不需要）
### m7. console.log/error — Ring 已有 print
### m8. Template literals — Ring 已有字符串插值

---

## 无 Soundness Bug 发现

两位审计员独立确认：未发现会影响自举编译器正确性的 soundness bug。现有已知限制（穷尽性多字段交叉、List.contains 引用相等等）已明确记录且不影响自举。

---

## 自举前必须新增的 Ring 语言特性（按优先级）

| 优先级 | 特性 | 阻塞项 | 状态 |
|--------|------|--------|------|
| ~~P0~~ | ~~MutMap/MutSet 可变集合~~ | ~~C1~~ | ✅ 已修复 |
| ~~P0~~ | ~~extern fn / FFI 声明~~ | ~~C2~~ | ✅ 已修复 |
| ~~P0~~ | ~~defer 语句或 finally 语义~~ | ~~C3~~ | ✅ 已关闭（闭包绕过） |
| ~~P0~~ | ~~Str 字符索引（byte_at）~~ | ~~C4~~ | ✅ 已修复 |
| P0 | Struct 更新语法 { base with field: val } | C5 | 推迟（待评估） |
| ~~P1~~ | ~~Enum 命名字段~~ | ~~C6~~ | ✅ 已修复 |
| P1 | type alias | M2 | 未修复 |
| ~~P1~~ | ~~Int.parse / Float.parse / to_str~~ | ~~M3~~ | ✅ 已修复 |
| P2 | JSON 序列化 | M4 | 未修复 |
| ~~P2~~ | ~~Str.pad_start / repeat~~ | ~~M5~~ | ✅ 已修复 |
| P2 | for (k,v) in map 语法糖 | M6 | 未修复 |

## 翻译工作量估计

- 需翻译代码：~13,500 行 TS（跳过 LSP ~2,500 行）
- 预计产出：~10,000 行 Ring 代码
- 前提：上述 P0/P1 语言特性全部就位
- 预计时间：2-4 周全职翻译（含测试）
