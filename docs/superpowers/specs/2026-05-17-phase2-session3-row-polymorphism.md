# Phase 2 Session 3: Row Polymorphism

**日期**: 2026-05-17
**范围**: Record Row Types + Effect Row 收紧
**前置**: Session 2 Evidence Passing 完成（100 unit + 51 e2e 通过）

---

## 1. 目标

实现 Koka 风格的 row polymorphism，统一服务于两个场景：
1. **Record Row Type** — 函数参数中的结构化约束 `{name: Str, ..rest}`
2. **Effect Row 收紧** — 用 open row variable 替代当前 lenient 模式

两者共享同一个底层 row unification 算法。

## 2. 设计决策

| 决策 | 选择 | 替代方案（放弃） |
|------|------|-----------------|
| Record row 语法 | 方案 A: type-level only，无匿名 record 值 | 方案 B: 引入匿名 record |
| Effect row 收紧 | Koka 风格 open row variable + unification | 显式 subtyping |
| Struct ↔ Record | 单向 coercion: struct 可满足 record 约束 | 双向或不支持 |
| Spread 运算符 | 不做（留后续 Session） | 方案 B 需要 |

## 3. Record Row Type

### 3.1 类型表示

```typescript
// types/index.ts — 新增
export interface RecordType {
  kind: "record";
  fields: { name: string; type: Type }[];
  tail?: number; // row variable id for ..rest
}
```

`Type` union 新增 `RecordType` 成员。

### 3.2 AST 节点

```typescript
// ast/index.ts — TypeExpr union 新增
export interface RecordTypeExpr {
  kind: "record_type";
  fields: { name: string; type: TypeExpr }[];
  rest?: string; // row variable name, e.g. "rest"
  span: Span;
}
```

### 3.3 语法

```ring
// 参数类型中使用
fn greet(person: {name: Str, ..rest}) -> Str {
    "hello, ${person.name}"
}

// 多字段
fn display(item: {name: Str, age: Int, ..r}) -> Str {
    "${item.name} (${item.age})"
}

// Closed record（无 rest）— struct 必须恰好匹配
fn exact(point: {x: Int, y: Int}) -> Int {
    point.x + point.y
}
```

### 3.4 Parser 规则

Record type expr 以 `{` 开头，内部为 `name: TypeExpr` 逗号分隔列表，可选 `..ident` 结尾。

区分上下文：
- 类型位置 `{...}` → RecordTypeExpr
- 值位置 `StructName {...}` → StructLitExpr（已有）

### 3.5 不做

- 匿名 record 字面量值
- Spread 运算符 `{...r, field: val}`
- Record type 作为函数返回类型的构造
- Record 字段解构 pattern matching
- Row variable 在泛型参数中的显式传播

## 4. Row Unification 算法

统一的 row unification，服务于 record row 和 effect row。

### 4.1 算法描述

给定两个 row: `R1 = {l₁: T₁, l₂: T₂, ..α}` 和 `R2 = {l₁: T₃, l₃: T₄, ..β}`

1. **匹配共同 label**：对每对同名 label (l₁)，unify 其类型 (T₁, T₃)
2. **左侧独有 label (l₂)**：必须被 β 吸收 → β := {l₂: T₂, ..γ}
3. **右侧独有 label (l₃)**：必须被 α 吸收 → α := {l₃: T₄, ..γ}
4. **Tail 处理**：
   - 两边都有 tail → 通过新变量 γ 连接
   - 一边有 tail → tail 吸收另一边的独有 label
   - 两边都没有 tail → 必须精确匹配（独有 label 产生错误）

### 4.2 Effect Row 特化

Effect row 的 "label" 是 effect kind（io, mut, fail, custom）:
- `io ↔ io`: 无类型参数，直接匹配
- `mut ↔ mut`: 同上
- `fail ↔ fail`: unify error_type
- `custom(name) ↔ custom(name)`: unify type_args

### 4.3 Record Row 特化

Record row 的 "label" 是字段名：
- 同名字段 → unify 字段类型
- 独有字段 → 被 tail 吸收或报错

### 4.4 实现位置

`compiler/src/checker/unify.ts`:
- 新增 `unify_rows<L>(labels_a, labels_b, tail_a, tail_b, unify_label_fn)` 通用算法
- 重写 `unify_effect_rows` 调用通用算法
- 新增 `unify_record_rows` 调用通用算法
- 在 `unify()` 主函数中新增 `RecordType` 的 case

## 5. Struct → Record Coercion

### 5.1 Unification 规则

当 `unify(StructType, RecordType)` 时：
1. 对 RecordType 中每个字段，在 StructType 中查找同名字段
2. 找到 → unify 字段类型
3. 找不到 → 报错 `MissingField`
4. Struct 的剩余字段（record 没要求的）→ 如果 record 有 tail，tail 绑定为含剩余字段的 closed record；如果 record 无 tail，struct 有额外字段仍允许（宽度子类型：struct 总是可以有多余字段）

注意：这与纯 row unification（Section 4.1 "两边无 tail 必须精确匹配"）不同。Struct→Record 是一个特化的 coercion 规则，不是对称的 unification。

### 5.2 单向性

- `StructType → RecordType`: 允许（struct 满足 record 约束）
- `RecordType → StructType`: 禁止（record row 不确定是哪个 struct）

### 5.3 Codegen 影响

零成本。struct 在 JS 端已是普通对象，record 字段访问编译为属性访问。

## 6. Effect Row 收紧

### 6.1 当前行为（lenient）

```typescript
// unify_effect_rows: 只 unify 共同 effect 的类型参数，忽略差异
```

### 6.2 新行为

使用 open row variable 实现 effect polymorphism：

1. **函数推断开始时**：effect row 为 `{..α}`（open）
2. **遇到 effect 操作时**：向 α 中添加该 effect
3. **函数推断结束时**：α 收集了所有 effect → 闭合为函数的 effect row
4. **Generalize 时**：如果 α 仍自由（纯函数）→ 它成为多态 effect variable
5. **调用纯函数**：其 effect variable 可 unify 为调用处的任意 effect row → pure ⊂ any effect context

### 6.3 Handle 消除

`handle { body } with { eff.op(x) => ... }` 的效果：
- body 推断的 effect row = {handled_effect, ...other_effects, ..α}
- handle 表达式的 effect row = {other_effects, ..α}（handled_effect 被移除）

### 6.4 兼容性

现有 51 个 e2e 测试全部继续通过：
- 它们不使用显式 effect 类型标注
- 推断逻辑更精确但不拒绝有效代码
- or/catch/handle 消除逻辑不变

## 7. 新增编译错误

| 错误 | 触发条件 | 信息示例 |
|------|---------|---------|
| `MissingField` | struct 缺少 record row 要求的字段 | `Type 'Point' does not satisfy {name: Str, ..rest} — missing field 'name'` |
| `UnhandledEffect` | effect 未处理且未声明（仅显式标注时） | `Effect 'io' is not handled` |
| `EffectMismatch` | effectful 值赋给 closed pure 类型 | `Cannot assign effectful function (/ io) to pure function type` |

## 8. 测试计划

### 8.1 新增 E2E 测试用例

| 文件名 | 测试内容 |
|--------|---------|
| `row_basic.ring` | 基本 record row 参数接受 struct |
| `row_multi_field.ring` | 多字段 record row + struct 匹配 |
| `row_reject.ring` | struct 缺少字段 → 编译期错误 |
| `row_generic.ring` | 泛型函数 + record row 约束 |
| `effect_row_strict.ring` | effect row 收紧后正确推断和传播 |
| `effect_row_handle.ring` | handle 消除 effect + row 结果验证 |

### 8.2 新增 Unit 测试

- Parser: record type expr 解析
- Unify: row unification 各 case（共同 label、独有 label、tail binding）
- Unify: struct ↔ record coercion
- Unify: effect row strict mode

### 8.3 现有测试回归

所有现有 100 unit + 51 e2e 必须继续通过。

## 9. 实现顺序

1. **types/index.ts**: 新增 RecordType
2. **ast/index.ts**: 新增 RecordTypeExpr
3. **parser**: 解析 `{field: Type, ..rest}` 语法
4. **unify.ts**: 实现通用 row unification + 重写 effect row unification + struct↔record unification
5. **infer.ts**: 使用 open row variable 推断 effect、resolve RecordTypeExpr、field access on record type
6. **hir/index.ts**: 新增 RecordType 的 HIR 表示（如需要）
7. **codegen.ts**: record field access → JS property access
8. **测试**: unit tests + e2e tests
9. **回归验证**: 所有现有测试通过

## 10. 不在范围内

- 匿名 record 字面量值
- Spread/extend 运算符
- Record 解构 pattern matching
- Row variable 在泛型中的显式传播
- 模块系统
- Async/spawn
