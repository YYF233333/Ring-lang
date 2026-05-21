# Phase B 设计规格：核心设计兑现期

> 时间范围：Phase 3 完成 → Phase C（Refinement Types）启动前
> 目标：兑现 design.md 三大核心设计承诺——模块系统、参数化 effect、formatter

## 1. 定位

Phase B 是 Ring-lang 从"可用的自举语言"到"有核心竞争力的语言"的跨越。Phase 3 巩固了编译器架构和 LLM 开发体验，Phase B 在此基础上补齐 design.md 中承诺的核心特性。

三件事并行推进：
1. **模块系统完善**：`mod` 块 + `sig` 签名 + 一等模块 + 相对路径 + capability 限制——兑现 design.md 第 6 章
2. **`mut<S>` 参数化 effect**：精确追踪可变状态的 scope——兑现 design.md 2.1 的 `effect mut<S>`
3. **Formatter + Effect 标注语法**：标注等级系统 + 自动标注生成——兑现 design.md 第 3 章 "推断为王，标注为仆"

附带持续目标：标准库去 hack 化，将 extern fn 替换为 Ring 实现。

不在 Phase B 范围内：Refinement types、linear types、dyn Trait、async effect、delegate、LLVM/WasmGC 后端、LSP。详见 `docs/backlog.md`。

## 2. 退出标准

| # | 标准 | 当前状态 | 目标状态 |
|---|------|----------|----------|
| E1 | E2E 测试全部通过 | 442/442 | 只增不减 |
| E2 | `mod` 块嵌套 | **✅ Wave 1 完成** | 支持 inline `mod` 块 + 嵌套命名空间 |
| E3 | `sig` 签名 | 不支持 | 模块可声明签名，一等模块可传递 |
| E4 | `mut<S>` 参数化 | mut 无参数 | `effect mut<S>` 可用，Cell\<T\> 迁移 |
| E5 | Effect 标注语法 | **✅ Wave 1 完成** | 函数声明可写 `with {effect}` |
| E6 | Formatter | 不存在 | `ring fmt` 可用，支持标注等级 0-4 |
| E7 | 标准库 extern 比例 | ~85% extern（5 方法已迁移） | 可用 Ring 写的方法全部迁移 |
| E8 | HOF 方法注册 | 硬编码在编译器 | 通过标准库 + effect 标注声明 |
| E9 | design.md 同步 | 部分过时 | 与实现完全一致 |

## 3. 三轨 + 标准库架构

### 轨道 M：模块系统完善

补齐 design.md 第 6 章设计的所有模块特性。当前模块系统是文件级的扁平结构（一个 .ring 文件 = 一个模块），Phase B 扩展为支持嵌套 + 签名 + 一等模块。

#### 现状

- `use path::{items}` / `pub use` 重导出 / 多文件 ESM 编译均已实现
- 模块以文件为单位，`::` 路径映射到目录结构
- resolver 做 BFS 依赖发现 + Kahn 拓扑排序 + 循环检测
- AST 有 `UseDecl` 节点和 `Decl::ModBlock` 节点
- **inline `mod` 块已实现**（Wave 1 完成），支持 `pub mod name { decls }`
- 无相对路径（`super::` / `self::`），无 `sig` 签名

#### M1：`mod` 块（inline module） ✅ Wave 1 完成

**实现方案**（2026-05-22 合入）：
- AST：`Decl::ModBlock { name, decls, is_pub, span }`（用 ModBlock 而非 Mod，避免与 `BinOp::Mod` 冲突）
- Lexer：新增 `TkMod` 关键字
- Parser：`parse_mod_block()` 解析 `mod name { decls }`；表达式中区分大写 `Enum::Variant` 和小写 `mod::member` qualified access
- Checker：扁平前缀方案——`mod math { fn add }` 注册为 `math::add`，3-pass 注册（类型 → 别名 → 函数）；`infer_ident` / `infer_struct_lit` 支持 `qualifier::name` 查找
- Codegen：`safe_ident` 将 `::` 替换为 `$`（如 `math$add`），`HDecl::ModBlock` 委托子声明 emit
- Exports / compiler_mod：处理 `Decl::ModBlock` / `HDecl::ModBlock` 的导出和 ESM 收集
- `infer_ctx.ring`：`resolve_named_type` 使用 `def.name`（规范名）而非查找 key，避免别名/限定名 unification 错误

**难度**：中（已完成）。

#### M2：`sig` 签名（模块接口）

声明模块的公共契约（类型 + effect），不含实现：

```ring
pub sig Storage {
    fn save(key: Str, data: Bytes) -> Unit with {io, fail<StorageError>}
    fn load(key: Str) -> Bytes with {io, fail<StorageError>}
}
```

**实现要点**：
- AST：新增 `Decl::Sig { name: Str, members: List<SigMember>, is_pub: Bool, span: Span }`
- `SigMember`：函数签名（名字 + 参数类型 + 返回类型 + effect）、类型声明、关联类型
- Checker：`sig` 注册为一种类型级别的模块接口，可用于约束
- 与 LLM 友好性的关系：sig 是模块的 "类型签名"，LLM 读一个 sig 等于读整个模块的 API 契约

**依赖**：需要 F1（effect 标注语法），因为 sig 内的函数签名必须显式声明 effect。

**难度**：中大。需要新的类型级概念 + 一致性检查（模块是否满足签名）。

#### M3：一等模块（模块作为值传递）

模块可以满足 `sig` 约束，作为函数参数传递：

```ring
mod local_storage : Storage { ... }
mod s3_storage : Storage { ... }

fn init_app(storage: Storage) -> App {
    let data = storage.load("config")
    // ...
}

let app = init_app(s3_storage)
let test_app = init_app(mock_storage)
```

**实现要点**：
- 模块值在运行时表示为 JS 对象（方法作为属性）
- `sig` 约束的检查类似 trait 满足性检查
- Codegen：模块值传递 → JS 对象传递，方法调用 → 属性调用

**依赖**：M1 + M2。

**难度**：大。涉及类型系统扩展（模块作为类型）+ codegen 的模块值化。

#### M4：相对路径

```ring
use super::utils       // 父模块
use self::helpers      // 当前模块内的子模块
```

**实现要点**：
- Resolver：路径解析时处理 `super` / `self` 前缀
- 需要维护模块层级关系（当前是扁平的文件列表）

**难度**：小。Resolver 改动为主。

#### M5：Capability 限制

模块声明自身可使用的 effect 集合：

```ring
mod pure_logic requires {} {
    // 此模块内禁止 io、mut 等 effect
    fn validate(data: Data) -> Bool { ... }
}

mod io_layer requires {io} {
    fn read_config(path: Str) -> Config { ... }
}
```

**实现要点**：
- Parser：`mod` 块可选 `requires {effects}` 子句
- Checker：在模块作用域内，检查所有表达式的推断 effect 是否在 requires 集合内

**依赖**：M1 + F1（effect 标注语法）。

**难度**：中。Effect 检查逻辑已有基础，需要增加作用域级约束。

### 轨道 E：`mut<S>` 参数化 effect

将 `mut` 从无参 effect 升级为参数化 `mut<S>`，精确追踪哪个状态被修改。

#### 现状

- `mut` effect 在 `types.ring` 中定义为 `MutEffect`（无参数的 enum variant）
- Cell\<T\> 注册为内置 struct，方法（get/set/update）携带 `mut` effect
- Effect 系统已支持参数化（`CustomEffect { name, type_args }` + `EffectDef { type_params }`）
- Unification 已有 `unify_effect_params()` 处理参数化 effect，但 `MutEffect` 走无参分支
- Evidence passing 已实现，但 mut 的 evidence 无参数信息

#### E1：Effect 声明支持类型参数

```ring
effect mut<S> {
    fn get() -> S
    fn set(new_state: S) -> Unit
}
```

**实现要点**：
- `types.ring`：`MutEffect` 改为 `MutEffect { state_type: Type }`
- `builtins.ring`：注册 mut 到 `env.effects`（如同 fail），带 type_params
- `env.ring`：`EffectDef` 已支持 `type_params`，直接复用

#### E2：Effect 推断支持参数化

```ring
let counter = Cell(0)
counter.set(1)
// 推断: mut<Int> effect
```

**实现要点**：
- `unify.ring`：`effects_match_kind()` 中 MutEffect 分支增加参数统一
- `infer.ring`：Cell 方法调用时，从 Cell\<T\> 的 T 推断 mut\<T\>
- 多个不同 Cell 类型同时使用时，effect row 中出现多个 `mut<S1>`, `mut<S2>`

#### E3：Evidence passing 适配

**实现要点**：
- Evidence 参数携带 state 类型信息
- Handler 可以按 state 类型匹配不同的 mut effect
- Codegen：evidence 对象区分不同 state scope

#### E4：Cell\<T\> 迁移

```ring
// 之前：Cell<T> 方法带 mut effect（无参数）
// 之后：Cell<T> 方法带 mut<T> effect

let x = Cell(42)
let y = Cell("hello")
x.set(0)       // mut<Int>
y.set("world")  // mut<Str>
// 函数签名推断: with {mut<Int>, mut<Str>}
```

**难度**：中。基础设施（参数化 effect）已存在于 CustomEffect，核心工作是将 MutEffect 升级为参数化并更新所有引用点。

### 轨道 F：Formatter + Effect 标注语法

#### 现状

- **Effect 标注语法已实现**（Wave 1 完成）：`fn foo() -> T with {io, fail<E>}`
- `extern fn` 支持 effect 标注作为唯一 effect 来源
- 无标注时仍纯推断（向后兼容）
- 违反标注报 E0404（"Effect annotation violation"）
- 无 formatter 工具

#### F1：Effect 标注语法 ✅ Wave 1 完成

**实现方案**（2026-05-22 合入）：
- AST（`ast.ring`）：新增 `EffectExpr { name, type_args, span }`。`Decl::Fn` / `Decl::ExternFn` 增加 `declared_effects: List<EffectExpr>?`
- Parser（`parser.ring`）：`parse_effect_annotation()` 在返回类型后解析 `with { effect, ... }`
- Checker（`infer_register.ring`）：`resolve_effect_expr` + `resolve_declared_effects` 将 AST effect 解析为类型系统 Effect。`register_fn`/`register_extern_fn`/`register_impl_method`/`register_impl_extern_method` 均接受并使用 `declared_effects`
- Checker（`infer_decl.ring`）：`effects_match_kind` helper 验证推断 effect ⊆ 声明 effect（声明是上界）
- 错误码：`E0404`（effect annotation violation）

**语义规则**（已实现）：
- 有标注 → 推断 effect 必须是声明 effect 的子集
- 无标注 → 纯推断（向后兼容）
- `extern fn` 的标注是唯一的 effect 来源

**难度**：中（已完成）。

#### F2：`ring.toml` 标注等级配置

```toml
[annotations]
level = 2
# 0 = 裸奔（纯推断，零标注）
# 1 = pub 函数签名（类型 + effect）
# 2 = 所有函数签名 + 模块边界 effect
# 3 = 所有签名 + 所有 effect + 复杂表达式类型
# 4 = 全标注（每个 let 绑定都有类型）
```

**实现要点**：
- 配置文件解析（ring.toml 或 lang.toml）
- Formatter 根据等级决定生成/移除哪些标注

#### F3：Formatter 核心

用 Ring 实现的源码格式化器：读 Ring 源码 → parse → AST 变换 → 输出格式化源码。

```bash
ring fmt src/            # 格式化目录
ring fmt --check src/    # 只检查，不修改
```

**实现要点**：
- 新增 `compiler/formatter.ring`（Ring 实现，dogfood）
- AST → 源码的 pretty printer
- 保留注释（需要 lexer 输出注释 token）
- 缩进、对齐、换行规则

**前置条件**：需要 lexer 保留注释信息（当前注释被丢弃）。

**难度**：中大。Pretty printer 本身逻辑量大，注释保留是隐含的前置工作。

#### F4：标注自动生成/更新

根据标注等级，formatter 自动：
- 从编译器推断结果读取类型和 effect 信息
- 插入/更新函数签名上的标注
- 移除多余标注（降级时）

```ring
// level 0（你写的）
fn process(items) {
    items.filter(fn(x) { x.age > 18 }).map(fn(x) { x.name })
}

// ring fmt 后（level 2）
fn process(items: List<User>) -> List<Str> {
    items.filter(fn(x) { x.age > 18 }).map(fn(x) { x.name })
}
```

**实现要点**：
- Formatter 调用 checker 获取推断结果
- 按等级规则决定哪些位置插入标注
- 输出修改后的源码

**依赖**：F1 + F3。

**难度**：大。需要 formatter 和 checker 深度集成。

### 轨道 S：标准库去 hack 化（贯穿全程）

随语言能力增长，持续将标准库从 extern hack 迁移到 Ring 原生实现。

#### S1：可立即迁移的方法（无需新语言特性） ✅ Wave 1 完成

**实现方案**（2026-05-22 合入）：

5 个方法从 `extern fn`（JS 实现）迁移为 Ring 原生实现：
- `List.is_empty`、`List.first`、`List.last`（`std/list.ring`）
- `Map.is_empty`（`std/map.ring`）
- `Set.is_empty`（`std/set.ring`）

**基础设施改进**：为支持此迁移，`checker.ring` 的 `load_prelude` 新增 Phase 2——编译非 extern impl 方法体（之前 prelude 只注册类型不编译方法体）。`infer_decl.ring` 新增 `check_prelude_decl` 包装函数。`runtime.ring` 移除了 5 个对应的 JS 函数定义和导出。

#### S2：需要 effect 标注的迁移（依赖 F1）

HOF 方法（map/filter/fold 等）需要 effect 多态：

```ring
impl<T> List {
    pub fn map<U>(self: List<T>, f: fn(T) -> U with {e}) -> List<U> with {e} {
        let result: List<U> = []
        for item in self {
            result.push(f(item))
        }
        result
    }

    pub fn filter(self: List<T>, pred: fn(T) -> Bool with {e}) -> List<T> with {e} {
        let result: List<T> = []
        for item in self {
            if pred(item) { result.push(item) }
        }
        result
    }
}
```

**完成后可移除 `compiler/builtins.ring` 中 ~250 行的 HOF 注册代码。**

#### S3：需要 trait 约束的迁移

`contains`/`index_of`/`Set.contains`/`Map.get` 需要 `T: Eq` 约束：

```ring
impl<T: Eq> List {
    pub fn contains(self: List<T>, item: T) -> Bool {
        for x in self {
            if x == item { return true }
        }
        false
    }
}
```

**注意**：当前 `impl<T: Eq>` 语法是否已支持需要验证。如果不支持，S3 需要先补充这个能力。

#### S4：clone 方法统一

将 `list_clone(x)` / `map_clone(x)` / `set_clone(x)` 自由函数统一为 `.clone()` 方法，解决与 auto-derive Clone trait 的冲突。

## 4. 迭代编排

三个轨道相对独立，可并行推进。以下是建议的依赖驱动编排（用户无先后偏好）：

### Wave 1："基础设施" ✅ 全部完成（2026-05-22）

| 轨道 | 任务 | 状态 | 备注 |
|------|------|------|------|
| S | S1: 可立即迁移的 extern 方法 | ✅ 完成 | 5 方法迁移 + prelude 编译基础设施 |
| F | F1: Effect 标注语法 | ✅ 完成 | `with {effect}` 语法 + E0404 验证 |
| M | M1: `mod` 块 | ✅ 完成 | 扁平前缀方案 + qualified access |

**里程碑（已达成）**：可以写 `fn foo() -> T with {io}`。inline `mod` 块可用。标准库简单方法迁移完成。E2E 测试从 352 增至 442。

### Wave 2："核心特性"

| 轨道 | 任务 | 理由 |
|------|------|------|
| M | M2: `sig` 签名 | 依赖 F1（sig 内需要 effect 标注） |
| M | M4: 相对路径 | 独立，M1 后即可做 |
| E | E1-E2: `mut<S>` 声明 + 推断 | 独立于 M 轨道 |
| S | S2: HOF 方法迁移 | 依赖 F1 |

**里程碑**：`sig` 签名可用。`mut<S>` 推断可用。HOF 方法从编译器迁移到标准库。

### Wave 3："高级特性"

| 轨道 | 任务 | 理由 |
|------|------|------|
| M | M3: 一等模块 | 依赖 M2 |
| M | M5: Capability 限制 | 依赖 M1 + F1 |
| E | E3-E4: Evidence 适配 + Cell 迁移 | 依赖 E1-E2 |
| S | S3: Eq trait 约束迁移 | 独立 |

**里程碑**：模块可作为值传递。mut\<S\> 端到端可用。集合方法使用 Eq trait。

### Wave 4："Formatter"

| 轨道 | 任务 | 理由 |
|------|------|------|
| F | F3: Formatter 核心 | 需要 lexer 注释保留（前置工作） |
| F | F2: 标注等级配置 | 与 F3 同步 |
| F | F4: 标注自动生成 | 依赖 F3 + checker 集成 |
| S | S4: clone 方法统一 | 独立 |

**里程碑**：`ring fmt` 可用。标注等级 0-4 可切换。标准库去 hack 化完成。

## 5. 依赖关系

```
F1(effect标注)✅ ──→ M2(sig签名)
F1(effect标注)✅ ──→ M5(capability)
F1(effect标注)✅ ──→ S2(HOF迁移)
F1(effect标注)✅ ──→ F3(formatter)
M1(mod块)✅     ──→ M2(sig签名)
M1(mod块)✅     ──→ M3(一等模块)
M1(mod块)✅     ──→ M5(capability)
M2(sig签名)     ──→ M3(一等模块)
E1(mut声明)     ──→ E2(mut推断)
E2(mut推断)     ──→ E3(evidence)
E3(evidence)    ──→ E4(Cell迁移)
F3(formatter)   ──→ F4(标注生成)
```

**关键路径**：~~F1~~ → M2 → M3（F1/M1 已完成，Wave 2 全部解锁）

## 6. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 一等模块（M3）设计复杂度超预期 | 高 | 先做 M1+M2 验证架构，M3 可缩小范围（只支持 sig 约束传递，不支持运行时模块构造） |
| Formatter 注释保留改动 lexer 全链路 | 中 | Lexer 改为可选输出注释 token，不影响现有管线 |
| `mut<S>` 多 Cell 场景的 effect row 爆炸 | 中 | 参考 Koka 的 effect row 简化规则，相同 state 类型的 mut 合并 |
| 标准库迁移导致编译器自举回归 | 中 | 每次迁移后执行完整自举验证 |
| Effect 标注与推断不一致的错误消息难懂 | 中 | 先实现基础一致性检查，错误消息质量在 B3/B4 改进基础上迭代 |

## 7. 测试策略

- **模块系统（轨道 M）**：每个特性正向 + 负向 E2E 测试 + 多文件编译集成测试
- **`mut<S>`（轨道 E）**：单 Cell、多 Cell、嵌套函数、handler 场景的 E2E 测试
- **Effect 标注（F1）**：有标注/无标注/标注不匹配的测试矩阵
- **Formatter（F3-F4）**：round-trip 测试（格式化后重新 parse 语义不变）+ 标注等级升降测试
- **标准库（轨道 S）**：替换 extern 后全量 E2E 回归 + 编译器自举验证
- **每个 Wave 结束**：完整 `npm test` + 编译器自举验证
