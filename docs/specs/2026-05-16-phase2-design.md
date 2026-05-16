# Phase 2 设计规格：有手感的语言

> 2026-05-16

## 概述

Phase 2 将 Ring-lang 从"可以玩的编译器"升级为"有手感的语言"。目标：trait 系统 + 泛型约束、完整 effect handler（evidence passing）、mut effect、row polymorphism、基础 LSP server、`--error-format=llm`。

分 4 个 session 实施，按依赖拓扑排序、技术风险前置。

## 架构原则

1. **增量扩展现有管线**：不重写，在 Parser/AST/Checker/HIR/Codegen 各阶段添加新节点和新规则
2. **Dictionary Passing 统一模式**：trait 方法和 effect operations 都编译为隐式参数传递
3. **先正确，再优化**：Phase 2 不做内联优化或单态化，Phase 3 可加
4. **assertNever 机械保护**：新增 AST/HIR 节点时，TypeScript 编译器强制补全所有分发点

## Session 划分

| Session | 内容 | 依赖 | 风险 |
|---------|------|------|------|
| 1 | Trait 系统 + 泛型约束 | 无 | 中 |
| 2 | Effect 系统重写 (evidence passing + mut) | Session 1 | 高 |
| 3 | Row Polymorphism | Session 1 | 中 |
| 4 | LSP + `--error-format=llm` | Session 1-3 | 低 |

---

## Session 1：Trait 系统 + 泛型约束

### 目标

实现 trait 声明、impl 块、泛型约束、trait 方法解析。trait 默认方法、关联类型为可选延伸目标。

### 语法

```ring
// trait 声明
trait Ord {
    fn compare(self, other: Self) -> Ordering
}

// trait 带默认方法
trait Describable {
    fn name(self) -> Str
    fn describe(self) -> Str { "${self.name()}" }
}

// 关联类型
trait Collection {
    type Item
    fn iter(self) -> Iterator<item = Self.Item>
}

// impl Trait for Type
impl Ord for Int {
    fn compare(self, other: Int) -> Ordering {
        if self < other { Ordering.less }
        else if self > other { Ordering.greater }
        else { Ordering.equal }
    }
}

// 泛型约束
fn sort<T: Ord>(list: List<T>) -> List<T> { ... }

// 多约束
fn serialize_sorted<T: Ord + Serialize>(list: List<T>) -> Bytes { ... }
```

### AST 新节点

```typescript
interface TraitDecl {
    kind: "trait_decl"
    name: string
    type_params: TypeParam[]
    supertraits: TypeBound[]
    assoc_types: AssocTypeDecl[]
    methods: FnDecl[]  // body 非空 = 默认方法
    span: Span
}

interface ImplTraitDecl {
    kind: "impl_trait_decl"
    trait_name: string
    trait_type_args: TypeExpr[]
    target_type: TypeExpr
    type_params: TypeParam[]
    assoc_type_bindings: { name: string, type: TypeExpr }[]
    methods: FnDecl[]
    span: Span
}

interface TypeBound {
    trait_name: string
    type_args: TypeExpr[]
}

// 扩展现有 TypeParam
interface TypeParam {
    name: string
    bounds: TypeBound[]  // <T: Ord + Serialize>
}
```

### HIR 新节点

```typescript
interface HTraitDecl {
    kind: "trait_decl"
    name: string
    type_params: TypeVar[]
    supertraits: ResolvedBound[]
    methods: HFnDecl[]
}

interface HImplTraitDecl {
    kind: "impl_trait_decl"
    trait_name: string
    target_type: Type
    methods: HFnDecl[]
    dictionary_name: string  // 生成的 JS dictionary 标识符
}
```

### Checker 新逻辑

#### TraitEnv

```typescript
interface TraitDef {
    name: string
    type_params: TypeVar[]
    supertraits: TypeBound[]
    methods: { name: string, type: Type, has_default: boolean }[]
    assoc_types: { name: string, bounds: TypeBound[] }[]
}

interface ImplEntry {
    trait_name: string
    target_type: Type
    type_params: TypeVar[]
    method_types: Map<string, Type>
    assoc_type_bindings: Map<string, Type>
}

interface TraitEnv {
    traits: Map<string, TraitDef>
    impls: ImplEntry[]

    resolve_method(receiver: Type, name: string): MethodResolution | null
    find_impl(trait_name: string, target: Type): ImplEntry | null
    check_bound(ty: Type, bound: TypeBound): boolean
    collect_bounds(type_params: TypeParam[]): Constraint[]
}
```

#### 约束求解流程

1. **注册阶段**：收集所有 trait 和 impl 声明
2. **推断阶段**：遇到 `<T: Ord>` 时产生 `Constraint("Ord", T)`
3. **泛化阶段**：在 let-generalization 时验证所有约束可满足
4. **方法解析**：`.method()` 调用时查找 impl 块 → trait 方法 → UFCS

#### 方法解析优先级

1. 当前类型的 impl 块中定义的方法
2. Trait 实现中的方法（如有多个 trait 提供同名方法，要求显式限定）
3. UFCS 自由函数（现有行为保留）

### Codegen：Dictionary Passing

#### 策略

每个 `impl Trait for Type` 生成一个 dictionary 对象。泛型函数接收 dictionary 作为隐式尾参数。

#### 生成规则

```
impl Ord for Int { fn compare(...) {...} }
→ const Int_Ord = { compare: function(self, other) { ... } };

fn sort<T: Ord>(list: List<T>) -> List<T>
→ function sort(list, __Ord) { /* 用 __Ord.compare() */ }

sort([3, 1, 2])  // T=Int，编译期确定
→ sort([3, 1, 2], Int_Ord);
```

#### Supertrait 处理

如果 `trait Ord: Eq`（Ord 继承 Eq），则 Ord 的 dictionary **嵌套包含** Eq dictionary：

```javascript
const Int_Ord = {
    __Eq: Int_Eq,           // supertrait dictionary 嵌入
    compare: function(self, other) { ... }
};
```

泛型函数 `<T: Ord>` 只接收一个 `__Ord` 参数，需要 Eq 方法时通过 `__Ord.__Eq.equals(...)` 访问。

#### Dictionary 命名约定

共享函数（放 `hir/index.ts`）：
```typescript
function trait_dict_name(type_name: string, trait_name: string): string {
    return `${type_name}_${trait_name}`;
}
```

#### 非泛型调用优化

当调用点类型已完全确定（非多态），编译器**可以**直接生成函数调用而非传 dictionary。Phase 2 暂不实现此优化（dictionary passing 语义正确即可），Phase 3 可加。

### 测试计划

- 单元测试：trait 注册、约束求解、方法解析
- e2e 测试：
  - `trait_basic.ring`：简单 trait + impl + 泛型约束调用
  - `trait_default.ring`：默认方法 + override
  - `trait_multi.ring`：多 trait 约束 `<T: A + B>`

---

## Session 2：Effect 系统重写（Evidence Passing + mut effect）

### 目标

将 effect handler 从 generator-based 重写为 evidence passing 模式。保留 fail 的 try/catch 特化。新增 mut effect。

### 当前状态

- `fail` effect：冒泡 = 正常调用（零开销）；`or`/`catch` = try/catch IIFE；`handle...with fail` = try/catch
- `io` effect：`handle...with io` = generator + runner（仅简单场景正确）
- 自定义 effect：同 io，generator-based

### 目标状态

- `fail` effect：**不变**（try/catch 特化保留，性能最优）
- 其他 effect（io、mut、自定义）：evidence passing

### Evidence Passing 核心模型

#### 概念

Effect 声明定义一组 operations。Handler 构造一个 evidence 对象（包含每个 operation 的实现）。使用 effect 的函数接收 evidence 作为隐式参数。

#### 编译映射

```ring
effect state<S> {
    fn get() -> S
    fn set(val: S) -> Unit
}

fn counter() -> Int with {state<Int>} {
    let current = state.get()
    state.set(current + 1)
    current
}
```

编译为：

```javascript
function counter(__ev_state) {
    const current = __ev_state.get();
    __ev_state.set(current + 1);
    return current;
}
```

Handler 编译为：

```ring
handle {
    counter() + counter()
} with {
    state.get()     => /* impl */,
    state.set(val)  => /* impl */,
}
```

```javascript
const __ev_state = (() => {
    let _s = 0;  // initial state
    return {
        get: () => _s,
        set: (val) => { _s = val; }
    };
})();
const __result = counter(__ev_state) + counter(__ev_state);
```

### resume 语义

对于需要 `resume` 的 handler（delimited continuation），使用 CPS 变换或 one-shot continuation：

```ring
handle {
    let x = state.get()
    state.set(x + 1)
    x
} with {
    state.get()    => resume(42),
    state.set(val) => resume(Unit),
}
```

Phase 2 范围：支持 **one-shot resume**（每个 operation 最多 resume 一次）。多次 resume（multi-shot continuation）留 Phase 3。

One-shot resume 的编译策略：effect operation 的调用点变成一个回调。handler 的 evidence 对象中，operation 实现接收 `resume` 函数作为最后一个参数。

```ring
handle {
    let x = state.get()   // 调用点 1
    state.set(x + 1)       // 调用点 2
    x
} with {
    state.get()    => resume(42),
    state.set(val) => resume(Unit),
}
```

编译为（简化，展示 one-shot resume 的本质）：
```javascript
// handler body 被拆分为 continuation chain
const __ev_state = {
    get: (resume) => resume(42),
    set: (val, resume) => resume(undefined),
};
// 注意：当 resume 模式简单（如直接 resume(value)），
// 编译器可以优化为直接返回值，无需实际 CPS 变换。
// 只有 resume 前后有副作用时才需要真正的 continuation。
```

**简化规则**：如果所有 handler 分支都是 `resume(expr)` 形式（即无 side-effect before/after resume），整个 handle 表达式退化为简单的 evidence passing（同 state 示例），不需要 CPS。这覆盖了 90%+ 的实际用例。

### mut effect

`mut` 是对 `state` effect 的应用层封装：

```ring
// Cell<T> 使用 mut effect
impl<T> Cell<T> {
    fn get(self) -> T with {mut} { ... }
    fn set(self, val: T) -> Unit with {mut} { ... }
    fn update(self, f: fn(T) -> T) -> Unit with {mut} { ... }
}
```

编译策略：`mut` effect 的 evidence 就是直接的 mutable reference（JS 中 = 闭包变量或对象字段）。由于 JS 本身是 mutable 的，`mut` effect 的 evidence passing 可以是 no-op（只在类型层追踪，不生成额外代码）。

### 向后兼容

- 现有 `effect_or.ring`、`effect_catch.ring` 等 e2e 测试必须继续通过
- `effect_handle_io.ring`、`effect_resume.ring` 语义可能变化（从 generator → evidence），确保输出结果相同

### 测试计划

- e2e 测试：
  - `effect_state.ring`：基本 state effect + handler
  - `effect_evidence.ring`：多个 effect 组合 + evidence 传递
  - `effect_resume_one.ring`：one-shot resume 语义
  - `effect_mut.ring`：Cell + mut effect

---

## Session 3：Row Polymorphism

### 目标

实现 row polymorphic 类型推断，允许函数接受"至少有某些字段"的 struct。

### 语法

```ring
fn greet(person: {name: Str, ..rest}) -> Str {
    "hello, ${person.name}"
}

fn with_timestamp(r: {..rest}) -> {timestamp: Int, ..rest} {
    { ...r, timestamp: now() }
}

// struct 自动满足 row 约束
struct User { name: Str, age: Int }
greet(User { name: "yufeng", age: 30 })  // OK：User 有 name 字段
```

### 类型系统扩展

#### 新 Type variant

```typescript
interface RowType {
    kind: "row"
    fields: { name: string, type: Type }[]
    rest: Type | null  // null = closed row, TypeVar = open row (row variable)
}
```

#### Row Variable

Row variable 是一种特殊的 type variable，在 unification 时遵循 row-specific 规则：

```typescript
// 在 TypeEnv 中区分普通 type var 和 row var
interface TypeVar {
    kind: "var"
    id: number
    is_row: boolean  // true = can only unify with rows
}
```

#### Unification 扩展

Row unification 规则：

1. `{ a: T, ..r1 } ~ { a: U, ..r2 }` → unify `T ~ U` 且 `r1 ~ r2`
2. `{ a: T, b: U, ..r } ~ { a: V, ..s }` → unify `T ~ V` 且 `s ~ { b: U, ..r }`（row rewriting）
3. Closed row `{ a: T }` ≁ row with extra fields
4. struct 类型可以 unify with open row（struct 视为 closed row）

#### Struct 与 Row 的关系

`struct User { name: Str, age: Int }` 是 **nominal 类型**——两个字段相同但名字不同的 struct 不等价。

Row polymorphism 中，struct 可以匹配 open row 的方式是：编译器为每个 struct 生成一个隐式的"row projection"——将 struct 视为满足某个 row 约束的证据。具体地：

- `User` 可以匹配 `{name: Str, ..rest}`，因为 User 有 `name: Str` 字段
- 此时 `rest` 被实例化为 `{age: Int}`（closed row）
- **struct 保持 nominal**：`User` ≠ `{name: Str, age: Int}`，但 `User` 可以作为参数传给需要 `{name: Str, ..}` 的函数

这是 structural subtyping 通过 row variable 实例化实现，不是 type equivalence。

### Codegen

Row polymorphism 在 JS 中几乎零翻译成本：

```ring
fn greet(person: {name: Str, ..}) -> Str { "hello, ${person.name}" }
```

```javascript
function greet(person) { return `hello, ${person.name}`; }
```

JS 天然鸭子类型，row poly 的价值纯粹在编译期类型安全。

### 与 Trait 约束的交叉

```ring
fn greet_and_log<T: Loggable>(entity: {name: Str, ..} & T) -> Str {
    entity.log("greeted")
    "hello, ${entity.name}"
}
```

这需要同时满足 row 约束（有 name 字段）和 trait 约束（实现 Loggable）。类型检查分两步：
1. Row unification 确保字段存在
2. Trait constraint checking 确保 bound 满足

### 测试计划

- e2e 测试：
  - `row_basic.ring`：基本 row poly 函数
  - `row_struct.ring`：struct 匹配 open row
  - `row_spread.ring`：spread + 添加字段
  - `row_trait.ring`：row + trait 约束交叉

---

## Session 4：LSP + `--error-format=llm`

### 目标

提供基础 LSP server（diagnostics + hover + goto-definition）和 LLM 友好的错误输出格式。

### LSP 架构

```
compiler/
├── src/
│   ├── lsp/
│   │   ├── server.ts        LSP 主入口 (JSON-RPC over stdio)
│   │   ├── diagnostics.ts   错误 → LSP Diagnostic 转换
│   │   ├── hover.ts         Hover provider（显示推断类型 + effect）
│   │   ├── definition.ts    Go-to-definition（基于 Span）
│   │   └── completion.ts    基础补全（TypeEnv + TraitEnv 符号）
│   └── ...
```

#### 增量策略

Phase 2 的 LSP 使用简单的"全文件重检查"策略：每次文件变更，重新 parse + check 该文件。不做跨文件增量（留 Phase 3）。

理由：单文件 check 在当前代码量下 < 50ms，满足亚秒响应要求。

#### 依赖

使用 `vscode-languageserver` npm 包（唯一外部依赖）。

### `--error-format=llm`

CLI flag，输出结构化 JSON：

```json
{
    "version": 1,
    "file": "app.ring",
    "errors": [
        {
            "code": "E0301",
            "severity": "error",
            "message": "Type mismatch: expected Int, got Str",
            "span": { "line": 42, "col": 5, "end_line": 42, "end_col": 12 },
            "context": {
                "expected": "Int",
                "actual": "Str",
                "in_expression": "let x: Int = \"hello\""
            },
            "suggestion": "Use parse_int() to convert Str to Int"
        }
    ],
    "warnings": []
}
```

设计要点：
- `context` 字段包含 LLM 需要的结构化信息（expected/actual type、相关表达式）
- `suggestion` 字段由 checker 的 error recovery 逻辑生成（Phase 2 可以先空着，逐步丰富）
- 版本号便于后续格式演进

### 测试计划

- LSP 集成测试：mock editor 发送 JSON-RPC 请求，验证响应
- error-format 测试：编译有错误的文件，验证 JSON 输出结构

---

## 跨 Session 共享约定

### 新增 AST/HIR 节点检查清单

每次新增节点时必须：
1. `ast/index.ts`：添加节点类型 + 加入联合类型
2. `parser.ts`：解析新语法
3. `infer.ts`：`register_decl` + `check_decl` 或 `infer_expr` 中处理
4. `hir/index.ts`：添加 HIR 节点 + 加入联合类型
5. `codegen.ts`：`emit_decl` 或 `gen_expr` 中处理
6. 所有 `assertNever` 位置自动报错（编译器保证）

### 命名约定共享函数

所有跨阶段命名约定放 `hir/index.ts`：

```typescript
// 现有
export function variant_js_name(enum_name: string, variant_name: string): string

// Phase 2 新增
export function trait_dict_name(type_name: string, trait_name: string): string
export function evidence_param_name(effect_name: string): string
```

### 测试约定

- 每个 session 完成时，所有现有测试必须继续通过（回归保护）
- 每个新特性至少一个 e2e 测试（`tests/cases/*.ring`）
- PR 合入前：`npm run lint` + `npm test` 全绿
