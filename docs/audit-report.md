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

### C3. try/finally 清理语义 — Effect handler 无 finally
- **严重性**: CRITICAL（P0）
- **位置**: checker/infer.ts(~10处), parser/parser.ts(~8处), cli.ts(5处), modules/compiler.ts(2处)
- **频率**: 高（54次throw, 39次try/catch, ~10处try/finally）
- **问题**: throw/try/catch 可用 fail effect + catch/handle..with 替代。但 try/finally（保证清理）在 Ring effect system 中无对应物。checker 的 push_scope/pop_scope 全部依赖 try/finally 保证 scope 栈不泄漏。
- **示例**: `this.env.push_scope(); try { ... } finally { this.env.pop_scope(); }`
- **需要**: Effect handler 增加 finally 语义，或新增 `defer` 语句（Go 风格）
- **状态**: 未修复

### ✅ C4. Str 字符索引 — Lexer 核心循环受阻
- **状态**: 已修复 — 新增 `Str.byte_at(i) -> Str`（直接返回，越界返回 undefined），Lexer 自举时使用此方法替代 `str[i]`

### C5. Struct 更新语法 — zonk.ts 等大量复制+修改模式
- **严重性**: CRITICAL（P0）
- **位置**: checker/zonk.ts(38处), checker/infer.ts(多处), types/index.ts(row_merge)
- **频率**: 很高（~46处 object spread `{ ...obj, field: val }`）
- **问题**: Ring 没有 struct 复制+字段覆盖语法。zonk.ts 的每个 zonk 函数都需要复制 HIR 节点并修改 type 字段。没有更新语法，每个节点需手动重建所有字段。
- **示例**: `return { ...stmt, type: zonk_type(ctx, stmt.type), init: zonk_expr(ctx, stmt.init) }`
- **需要**: `{ base with field: value }` 结构更新语法（Rust 风格 `MyStruct { ..base, field: value }`）
- **状态**: 未修复

### C6. Enum 命名字段 — AST/HIR/Type 翻译可行性
- **严重性**: CRITICAL（P1）
- **位置**: ast/index.ts(6个union type), hir/index.ts(3个), types/index.ts(3个)
- **频率**: 极高（所有编译器阶段基于 discriminated union + .field 访问）
- **问题**: TS 的 union type 变体有命名字段（`t.name`, `t.params`, `t.return_type`）。Ring enum 变体只有位置字段。翻译为 Ring enum 后，每次字段访问都需要 match 解构取位置参数。对于 FnType 有 4 个字段的情况，这极不人性化。
- **示例**: TS `t.params.map(...)` → Ring 需 `match t { fn(params, _, _, _) => params.map(...) }`
- **需要**: Enum 命名字段语法 `enum Type { fn(params: List<Type>, ret: Type, effects: EffectRow) }`
- **状态**: 未修复

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

### M2. Type aliases — `type X = Y`
- **严重性**: MAJOR
- **位置**: checker/unify.ts(Substitution), checker/builtins.ts(Methods), cli.ts(ErrorFormat), lsp/hir-visitor.ts(WalkAction)
- **频率**: ~10处
- **问题**: Ring 没有 type alias。`type Substitution = Map<number, Type>` 需要在每个使用处写全类型。
- **绕过**: 内联类型。可行但降低可读性。
- **需要**: `type` 关键字（纯语法糖）
- **状态**: 未修复

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

### M6. for (k, v) in map — Map 解构迭代
- **严重性**: MAJOR
- **位置**: checker/infer.ts(10+处), codegen/codegen.ts, modules/resolver.ts, modules/exports.ts
- **频率**: 20+处
- **问题**: `for (const [name, def] of mod.types)` 需要 Map 迭代 + 解构绑定。Ring for..in 不支持 Map 直接迭代，且 binding 位置不支持解构。
- **绕过**: `for entry in map.entries() { let (k, v) = entry; ... }` 可行但冗长。
- **需要**: `for (k, v) in map { ... }` 语法糖
- **状态**: 未修复

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

| 优先级 | 特性 | 阻塞项 | 工作量估计 |
|--------|------|--------|-----------|
| P0 | MutMap<K,V> / MutSet<T> 可变集合 | C1 | 中（类比 List 实现，新增 ~15 个方法） |
| P0 | extern fn / FFI 声明 | C2 | 中（AST+checker+codegen 新增 extern 节点） |
| P0 | defer 语句或 finally 语义 | C3 | 中（AST+HIR+codegen 新增 defer 节点） |
| P0 | Str 字符索引（byte_at 或 [] 重载） | C4 | 小（新增 1 个 Str 内置方法） |
| P0 | Struct 更新语法 { base with field: val } | C5 | 中（parser+checker+codegen） |
| P1 | Enum 命名字段 | C6 | 大（parser+checker+codegen+exhaustive 全链路） |
| P1 | type alias | M2 | 小（纯语法糖） |
| P1 | Int.parse / Float.parse / to_str | M3 | 小（新增 4 个内置方法） |
| P2 | JSON 序列化 | M4 | 中（内置函数或 trait） |
| P2 | Str.pad_start / repeat | M5 | 小（新增 2 个 Str 方法） |
| P2 | for (k,v) in map 语法糖 | M6 | 小（parser+codegen） |

## 翻译工作量估计

- 需翻译代码：~13,500 行 TS（跳过 LSP ~2,500 行）
- 预计产出：~10,000 行 Ring 代码
- 前提：上述 P0/P1 语言特性全部就位
- 预计时间：2-4 周全职翻译（含测试）
