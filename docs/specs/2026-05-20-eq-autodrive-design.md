# Eq Trait + Auto-derive + `==` 解糖 设计规范

> 日期：2026-05-20
> 状态：待实现
> 目标：Phase A 自举准备补全——结构相等 + 自动派生

---

## 一、概述

当前 `==` 编译为 JS `===`（引用相等），struct/enum 比较引用而非内容。这是自举的阻塞问题（编译器内部大量使用 Map/Set 存放 AST 节点，引用相等语义错误）。

本设计引入三个互相关联的特性：
1. **Eq trait** — 定义结构相等的标准接口
2. **`==` 运算符解糖** — `==`/`!=` 从直接 JS `===` 改为通过 Eq trait dispatch
3. **Auto-derive** — 编译器自动为所有可派生的 struct/enum 生成 Eq/Clone/Debug impl

硬切换策略：`==` 要求操作数类型有 Eq impl，否则编译错误。Auto-derive 覆盖绝大多数类型，用户代码基本无感。

## 二、Eq Trait

### 2.1 Trait 定义

```ring
trait Eq {
    fn eq(self: Self, other: Self) -> Bool;
    fn ne(self: Self, other: Self) -> Bool {
        !self.eq(other)
    }
}
```

`ne` 有默认实现。用户只需实现 `eq`。

### 2.2 内置 Eq 实现

在 `builtins.ts` 中注册，不需要 `.ring` 文件：

| 类型 | Eq 实现 | Codegen |
|------|---------|---------|
| Int | 值相等 | `===` |
| Float | 值相等 | `===` |
| Str | 值相等 | `===` |
| Bool | 值相等 | `===` |
| Unit | 恒 true | `true` |

这些类型的 Eq 在 codegen 中走快路径（直接 `===`），不生成函数调用。

### 2.3 Tuple Eq

元素全部 Eq 时自动 Eq。逐元素 `&&` 比较。

### 2.4 Option Eq

内置实现：tag 相同 + 内部值 Eq。

```javascript
function Option_Eq_eq(a, b) {
  if (a._tag !== b._tag) return false;
  if (a._tag === "none") return true;
  return /* eq(a._0, b._0) */;
}
```

内部值的比较需要根据 `T` 的 Eq 实现 dispatch（泛型，需要 dict 参数 `__ring_T_Eq`）。Option 的 Eq impl 注册为 `TypeScheme { bounds: [{ type_var: T_id, trait_name: "Eq" }] }`，调用时由现有 trait dict 解析机制自动传递。

### 2.5 不 Derive Eq 的类型

- **集合类型（List/Map/Set）**：引用比较在集合上是合理的，结构比较开销大。暂不 derive。
- **函数类型**：函数不可比较。含函数字段的 struct 不会 auto-derive Eq。
- **Cell\<T\>**：可变容器，引用语义更合理。

## 三、Auto-derive 机制

### 3.1 触发时机

在 checker 的声明注册阶段（`register_struct` / `register_enum`）全部完成后，新增一个 **derive pass**。此 pass 在类型检查函数体之前执行。

### 3.2 Derive 条件

对每个 struct/enum，检查所有字段类型：
- 原始类型（Int/Float/Str/Bool/Unit）→ 可 Eq
- 已 derive Eq 的 struct/enum → 可 Eq
- Tuple（元素全可 Eq）→ 可 Eq
- Option（内部类型可 Eq）→ 可 Eq
- 函数类型 / 集合类型 / Cell → 不可 Eq

全部字段可 Eq → 自动注册 synthetic `impl Eq for Type`。

### 3.3 处理顺序

类型之间可能有依赖关系（struct A 包含 struct B 字段）。使用 fixpoint 迭代：

```
已知 Eq 集合 = { Int, Float, Str, Bool, Unit }
repeat:
  对每个未 derive 的 struct/enum:
    if 所有字段类型 ∈ 已知 Eq 集合:
      derive Eq, 加入已知 Eq 集合
until 无新增
```

### 3.4 泛型类型的 Derive

```ring
struct Pair<A, B> { a: A, b: B }
```

生成的 Eq impl 需要 `A: Eq + B: Eq` bound：

```
impl<A: Eq, B: Eq> Eq for Pair<A, B> {
    fn eq(self, other) -> Bool {
        __ring_A_Eq.eq(self.a, other.a) && __ring_B_Eq.eq(self.b, other.b)
    }
}
```

Type scheme 中的 bounds 字段记录这些约束。调用时需要传递 dict 参数。

### 3.5 生成的代码

#### Struct

```ring
struct Point { x: Int, y: Int }
```

生成 JS：

```javascript
function Point_Eq_eq(self, other) {
  return (self.x === other.x) && (self.y === other.y);
}
const Point_Eq = { eq: Point_Eq_eq, ne: function(self, other) { return !Point_Eq_eq(self, other); } };
```

原始类型字段直接用 `===`，复合类型字段调用其 `Type_Eq.eq()` 方法。

#### Enum

```ring
enum Shape { Circle(Float), Rect(Float, Float), Empty }
```

生成 JS：

```javascript
function Shape_Eq_eq(self, other) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Circle": return (self._0 === other._0);
    case "Rect": return (self._0 === other._0) && (self._1 === other._1);
    case "Empty": return true;
    default: return false;
  }
}
const Shape_Eq = { eq: Shape_Eq_eq, ne: function(self, other) { return !Shape_Eq_eq(self, other); } };
```

#### Enum 命名字段

```ring
enum Result { Ok { value: Int }, Err { msg: Str } }
```

```javascript
function Result_Eq_eq(self, other) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return (self.value === other.value);
    case "Err": return (self.msg === other.msg);
    default: return false;
  }
}
```

#### 泛型 Struct（含 dict 参数）

```ring
struct Pair<A, B> { a: A, b: B }
```

```javascript
function Pair_Eq_eq(self, other, __ring_A_Eq, __ring_B_Eq) {
  return __ring_A_Eq.eq(self.a, other.a) && __ring_B_Eq.eq(self.b, other.b);
}
```

### 3.6 HIR 表示

Auto-derived impl 不生成 `HImplDecl` HIR 节点。而是：
1. 在 `env.impl_methods` 中直接注册方法的 TypeScheme
2. 在 `env.trait_impls` 中添加 ImplEntry
3. 在 codegen 阶段，通过一个新的 `derived_impls` 列表生成对应 JS 代码

这样不需要构造完整的 HIR 函数声明，减少复杂度。

## 四、`==` 运算符解糖

### 4.1 Checker 层改动

`infer_bin_op`（infer-expr.ts）中 `==` / `!=` 的处理：

```
旧逻辑：
  unify(left_type, right_type)
  result = Bool

新逻辑：
  unify(left_type, right_type)
  resolved_type = apply(subst, left_type)
  if is_primitive(resolved_type) || resolved_type is Unit:
    eq_dispatch = "builtin"
  else if resolved_type is TypeVar with Eq bound:
    eq_dispatch = { kind: "dict", param: trait_bound_param_name(var, "Eq") }
  else if has_eq_impl(resolved_type):
    eq_dispatch = { kind: "direct", dict: trait_dict_name(type_name, "Eq") }
  else:
    error E0307: "type X does not implement Eq, cannot use =="
  result = Bool
```

### 4.2 HIR 层改动

`HBinOp` 新增字段：

```typescript
interface HBinOp extends HExprBase {
  kind: "bin_op";
  op: string;
  left: HExpr;
  right: HExpr;
  eq_dispatch?: EqDispatch;  // 新增
}

type EqDispatch =
  | "builtin"                           // 原始类型，codegen 用 ===
  | { kind: "direct"; dict: string }    // 具体类型，codegen 用 Dict.eq()
  | { kind: "dict"; param: string }     // 泛型，codegen 用 __ring_T_Eq.eq()
```

### 4.3 Codegen 层改动

`codegen-expr.ts` 中 `bin_op` case：

```
case "==" or "!=":
  if eq_dispatch == "builtin":
    emit `(left === right)` / `(left !== right)`
  else if eq_dispatch.kind == "direct":
    eq_call = `${dict}.eq(${left}, ${right})`
    emit eq_call (==) or `!${eq_call}` (!=)
  else if eq_dispatch.kind == "dict":
    eq_call = `${param}.eq(${left}, ${right})`
    emit eq_call (==) or `!${eq_call}` (!=)

其他运算符 (<, >, +, - 等) 保持原样不变。
```

### 4.4 Tuple `==` 处理

Tuple 没有命名类型，无法生成 `Tuple_Eq` dict。Codegen 内联展开：

```javascript
(a[0] === b[0]) && (a[1] === b[1])  // 元素为原始类型时
(a[0] === b[0]) && Type_Eq.eq(a[1], b[1])  // 元素含复合类型时
```

在 HIR 中，tuple `==` 的 eq_dispatch 标记为 `"builtin"`（codegen 特殊处理 tuple 类型）。

## 五、Clone Trait

### 5.1 定义

```ring
trait Clone {
    fn clone(self: Self) -> Self;
}
```

### 5.2 内置实现

| 类型 | Clone 实现 |
|------|-----------|
| Int/Float/Str/Bool/Unit | identity（值语义） |
| Tuple | 逐元素 clone |
| Option | tag 拷贝 + 内部值 clone |
| List/Map/Set | 浅拷贝（新容器，元素不 clone） |

### 5.3 Auto-derive Clone

Struct：`new Type(self.f1.clone(), self.f2.clone(), ...)`
Enum：按 tag dispatch + 递归 clone 字段

原始类型字段直接拷贝（值语义），复合类型字段调用 clone。

### 5.4 生成的代码

```javascript
// struct Point { x: Int, y: Int }
function Point_Clone_clone(self) {
  return new Point(self.x, self.y);
}
const Point_Clone = { clone: Point_Clone_clone };

// enum Shape { Circle(Float), Rect(Float, Float) }
function Shape_Clone_clone(self) {
  switch (self._tag) {
    case "Circle": return Shape_Circle(self._0);
    case "Rect": return Shape_Rect(self._0, self._1);
    default: return self;
  }
}
```

## 六、Debug Trait

### 6.1 定义

```ring
trait Debug {
    fn debug(self: Self) -> Str;
}
```

### 6.2 内置实现

| 类型 | Debug 输出 |
|------|-----------|
| Int | `String(value)` |
| Float | `String(value)` |
| Str | `"\"" + value + "\""` |
| Bool | `String(value)` |
| Unit | `"()"` |
| Tuple | `"(v1, v2, ...)"` |
| Option | `"some(v)"` / `"none"` |

### 6.3 生成的代码

```javascript
// struct Point { x: Int, y: Int }
function Point_Debug_debug(self) {
  return `Point { x: ${String(self.x)}, y: ${String(self.y)} }`;
}
```

复合类型字段递归调用 `Type_Debug.debug()`。

## 七、错误码

| 错误码 | 描述 | 示例 |
|--------|------|------|
| E0307 | 类型未实现 Eq，不可使用 `==`/`!=` | `fn_value == other_fn` |

错误消息示例：
```
error[E0307]: type `Handler` does not implement `Eq`
  --> main.ring:5:12
  |
5 |     if handler == other_handler {
  |        ^^^^^^^^^^^^^^^^^^^^^^^^ cannot compare with `==`
  |
  note: `Handler` contains a function field which cannot be compared
  hint: consider comparing specific fields instead
```

## 八、执行分批

### Batch A：Eq trait + `==` 解糖（核心，必做）

1. 在 builtins.ts 注册 Eq trait 定义
2. 注册原始类型 + Unit 的内置 Eq impl
3. 实现 auto-derive Eq 的 fixpoint pass（struct + enum + 泛型）
4. 实现 Option Eq（内置，泛型 dict 传递）
5. 改 infer-expr.ts：`==`/`!=` 检查 Eq + 标记 dispatch
6. 改 hir/index.ts：`HBinOp` 新增 `eq_dispatch`
7. 改 codegen-expr.ts：按 dispatch 类型生成代码
8. 新增 codegen 阶段：生成 auto-derived Eq 的 JS 函数和 dict
9. Tuple `==` 内联展开处理
10. 新增错误码 E0307
11. 更新所有 `assertNever` / zonk / LSP hir-visitor
12. 更新 E2E 测试（现有 `eq_strict.ring` 等需要适配）
13. 新增 E2E 测试（struct 相等、enum 相等、泛型相等、嵌套相等、负向测试）

### Batch B：Clone trait（重要，自举需要）

1. 注册 Clone trait + 原始类型/集合类型内置 impl
2. Auto-derive Clone（struct + enum + 泛型）
3. Codegen 生成 clone 方法
4. E2E 测试

### Batch C：Debug trait（有用，可推迟）

1. 注册 Debug trait + 原始类型内置 impl
2. Auto-derive Debug（struct + enum + 泛型）
3. Codegen 生成 debug 方法
4. 增强 `print` 函数使用 Debug（可选）
5. E2E 测试

## 九、不在范围内

- `<` / `>` 解糖到 Ord trait（后续做，Eq 先行）
- `#[no_derive]` opt-out 语法（暂不需要）
- 手动 `impl Eq` 覆盖 auto-derive（现有 trait 系统已支持，不需要额外工作）
- Hash trait（Map/Set 底层用 JS 原生 hash，暂不需要）
