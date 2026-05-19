# Clone + Debug + Ord Trait 设计规范

> 日期：2026-05-20
> 状态：待实现
> 前置依赖：`2026-05-20-eq-autodrive-design.md`（Eq trait + auto-derive 基础设施）
> 目标：补全自举所需的核心 trait 三件套

---

## 一、概述

在 Eq trait + auto-derive 基础设施落地后，复用同一套 derive pass 和 codegen 管线，新增三个 trait：

| Trait | 用途 | 自举必要性 |
|-------|------|-----------|
| Clone | 值拷贝 | 高——编译器内部大量需要复制 AST/HIR 节点 |
| Debug | 调试字符串 | 中——替代当前 `print` 对 struct/enum 输出 `[object Object]` |
| Ord | 有序比较 | 中——编译器中排序、Map key 比较需要 |

三个 trait 共享 auto-derive 的 fixpoint 迭代机制（Eq spec 3.3 节），仅需在已有循环中增加派生逻辑。

---

## 二、Clone Trait

### 2.1 定义

```ring
trait Clone {
    fn clone(self: Self) -> Self;
}
```

单方法，无默认实现。

### 2.2 内置实现

| 类型 | Clone 语义 | Codegen |
|------|-----------|---------|
| Int / Float / Str / Bool / Unit | 值拷贝（identity） | 直接返回 self |
| Tuple | 逐元素 clone | `[clone(a[0]), clone(a[1]), ...]` |
| Option | tag 拷贝 + 内部值 clone | `some(clone(v))` / `none` |
| List | 浅拷贝（新数组，元素不 clone） | `[...self]` |
| Map | 浅拷贝 | `new Map(self)` |
| Set | 浅拷贝 | `new Set(self)` |

**设计决策：** 集合类型做浅拷贝（新容器，元素共享引用），不做深拷贝。原因：
1. 深拷贝需要元素 T: Clone 约束，对 `List<fn(Int) -> Int>` 等类型不可行
2. JS 语义中 `[...arr]` 是标准的集合"clone"操作
3. 自举中编译器需要的是"独立修改的副本"，浅拷贝足够（元素是 immutable 的 AST 节点）

### 2.3 Auto-derive 条件

所有字段类型可 Clone → 自动 derive。

可 Clone 的类型：
- 原始类型 ✓
- 已 derive Clone 的 struct/enum ✓
- Tuple（元素全可 Clone）✓
- Option ✓
- List/Map/Set ✓（内置浅拷贝）
- 函数类型 ✗（闭包不可 clone）
- Cell\<T\> ✗（可变容器 clone 语义模糊）

实际上，只有含函数字段或 Cell 字段的类型不能 auto-derive Clone。

### 2.4 生成的代码

#### Struct（全原始类型字段）

```ring
struct Point { x: Int, y: Int }
```

```javascript
function Point_Clone_clone(self) {
  return new Point(self.x, self.y);
}
const Point_Clone = { clone: Point_Clone_clone };
```

原始类型字段直接拷贝值（JS 值语义保证）。

#### Struct（含复合类型字段）

```ring
struct Line { start: Point, end: Point }
```

```javascript
function Line_Clone_clone(self) {
  return new Line(Point_Clone.clone(self.start), Point_Clone.clone(self.end));
}
const Line_Clone = { clone: Line_Clone_clone };
```

复合类型字段调用其 Clone dict 方法。

#### Enum（位置字段）

```ring
enum Shape { Circle(Float), Rect(Float, Float), Empty }
```

```javascript
function Shape_Clone_clone(self) {
  switch (self._tag) {
    case "Circle": return Shape_Circle(self._0);
    case "Rect": return Shape_Rect(self._0, self._1);
    case "Empty": return Shape_Empty;
    default: return self;
  }
}
const Shape_Clone = { clone: Shape_Clone_clone };
```

Unit 变体返回冻结的单例对象（与构造器相同）。位置字段为原始类型时直接拷贝。

#### Enum（命名字段）

```ring
enum Expr { Lit { value: Int }, Add { left: Expr, right: Expr } }
```

```javascript
function Expr_Clone_clone(self) {
  switch (self._tag) {
    case "Lit": return Expr_Lit(self.value);
    case "Add": return Expr_Add(Expr_Clone.clone(self.left), Expr_Clone.clone(self.right));
    default: return self;
  }
}
```

递归类型的 clone 自然递归——不会无穷循环，因为值是有穷的（无循环引用）。

#### 泛型 Struct

```ring
struct Pair<A, B> { a: A, b: B }
```

```javascript
function Pair_Clone_clone(self, __ring_A_Clone, __ring_B_Clone) {
  return new Pair(__ring_A_Clone.clone(self.a), __ring_B_Clone.clone(self.b));
}
```

Type scheme bounds: `A: Clone, B: Clone`。

### 2.5 用户调用方式

```ring
let p2 = p1.clone()
```

UFCS 方法调用，走现有 trait method dispatch。

---

## 三、Debug Trait

### 3.1 定义

```ring
trait Debug {
    fn debug(self: Self) -> Str;
}
```

单方法。返回类型的调试表示字符串。

### 3.2 内置实现

| 类型 | Debug 输出 | JS 实现 |
|------|-----------|---------|
| Int | `"42"` | `String(self)` |
| Float | `"3.14"` | `String(self)` |
| Str | `'"hello"'` | `'"' + self + '"'` |
| Bool | `"true"` / `"false"` | `String(self)` |
| Unit | `"()"` | `"()"` |
| Tuple | `"(42, \"hi\")"` | 逐元素 debug + 拼接 |
| Option | `"some(42)"` / `"none"` | 按 tag dispatch |
| List | `"[1, 2, 3]"` | `.map(debug).join(", ")` 外包 `[]` |
| Map | `"Map {1: \"a\", 2: \"b\"}"` | entries 遍历 |
| Set | `"Set {1, 2, 3}"` | values 遍历 |

### 3.3 Auto-derive 条件

所有字段类型可 Debug → 自动 derive。

可 Debug 的类型范围比 Clone 更宽——函数类型也可以有 Debug（输出 `"<fn>"`）。因此几乎所有类型都能 auto-derive Debug。

函数类型的 Debug：内置实现，输出 `"<fn>"`。

### 3.4 生成的代码

#### Struct

```ring
struct Point { x: Int, y: Int }
```

```javascript
function Point_Debug_debug(self) {
  return "Point { x: " + String(self.x) + ", y: " + String(self.y) + " }";
}
const Point_Debug = { debug: Point_Debug_debug };
```

字段为原始类型时用 `String()`，为复合类型时调用 `Type_Debug.debug()`。

格式：`TypeName { field1: value1, field2: value2 }`。

#### Enum（位置字段）

```ring
enum Color { Red, Green, Blue }
enum Option<T> { some(T), none }
```

```javascript
// Unit variant
function Color_Debug_debug(self) {
  return self._tag;  // "Red", "Green", "Blue"
}

// With fields
function Option_Debug_debug(self, __ring_T_Debug) {
  switch (self._tag) {
    case "some": return "some(" + __ring_T_Debug.debug(self._0) + ")";
    case "none": return "none";
    default: return self._tag;
  }
}
```

格式：
- Unit 变体：`VariantName`
- 位置字段：`VariantName(value1, value2)`
- 命名字段：`VariantName { field: value }`

#### Enum（命名字段）

```ring
enum Shape { Circle { radius: Float }, Rect { w: Float, h: Float } }
```

```javascript
function Shape_Debug_debug(self) {
  switch (self._tag) {
    case "Circle": return "Circle { radius: " + String(self.radius) + " }";
    case "Rect": return "Rect { w: " + String(self.w) + ", h: " + String(self.h) + " }";
    default: return self._tag;
  }
}
```

#### 泛型 Struct

```ring
struct Pair<A, B> { a: A, b: B }
```

```javascript
function Pair_Debug_debug(self, __ring_A_Debug, __ring_B_Debug) {
  return "Pair { a: " + __ring_A_Debug.debug(self.a) + ", b: " + __ring_B_Debug.debug(self.b) + " }";
}
```

### 3.5 与 print 的集成

当前 `print` 编译为 `console.log`。对 struct/enum 输出 `[object Object]`。

改进：`print` 检查参数类型是否有 Debug impl，有则自动调用 `debug()` 后输出字符串。

**实现方式**：在 codegen 中，`print(x)` 对非原始类型参数生成 `console.log(Type_Debug.debug(x))` 而非 `console.log(x)`。对原始类型保持 `console.log(x)`（JS 原生格式化足够好）。

这是可选增强，不阻塞核心 derive 功能。

---

## 四、Ord Trait

### 4.1 定义

```ring
trait Ord {
    fn cmp(self: Self, other: Self) -> Int;
}
```

单方法。返回值语义：
- 负数（-1）：`self < other`
- 零：`self == other`
- 正数（1）：`self > other`

**不使用 Ordering enum**——`Int` 返回值直接映射 JS 比较器模式（`Array.sort` 的回调签名），零额外类型开销。

**Ord 不要求 Eq 作为 supertrait**（当前不支持 supertrait），但 auto-derive 时要求类型同时可 Eq（`cmp` 返回 0 应与 `eq` 返回 true 一致）。

### 4.2 内置实现

| 类型 | Ord 语义 | Codegen |
|------|---------|---------|
| Int | 数值比较 | `self < other ? -1 : self > other ? 1 : 0` |
| Float | 数值比较 | 同上 |
| Str | 字典序 | `self < other ? -1 : self > other ? 1 : 0` |
| Bool | false < true | `(self === other ? 0 : self ? 1 : -1)` |
| Unit | 恒 0 | `0` |

**集合类型不 derive Ord。** 集合的排序语义不唯一（按长度？按元素？按 key？），强制一种会误导。

**函数类型不可 Ord。**

### 4.3 `<` / `>` / `<=` / `>=` 运算符解糖

与 Eq 的 `==` 解糖模式完全对称：

#### Checker 层

`infer_bin_op` 中 `<` / `>` / `<=` / `>=` 的处理：

```
旧逻辑：
  unify(left_type, right_type)
  result = Bool

新逻辑：
  unify(left_type, right_type)
  resolved_type = apply(subst, left_type)
  if is_primitive_orderable(resolved_type):
    ord_dispatch = "builtin"
  else if resolved_type is TypeVar with Ord bound:
    ord_dispatch = { kind: "dict", param: trait_bound_param_name(var, "Ord") }
  else if has_ord_impl(resolved_type):
    ord_dispatch = { kind: "direct", dict: trait_dict_name(type_name, "Ord") }
  else:
    error E0308: "type X does not implement Ord, cannot use <"
  result = Bool
```

#### HIR 层

`HBinOp` 新增字段：

```typescript
ord_dispatch?: OrdDispatch;  // 与 eq_dispatch 平行

type OrdDispatch =
  | "builtin"
  | { kind: "direct"; dict: string }
  | { kind: "dict"; param: string }
```

#### Codegen 层

```
case "<":
  if ord_dispatch == "builtin":
    emit `(left < right)`
  else:
    cmp_call = `${dict_or_param}.cmp(${left}, ${right})`
    emit `(${cmp_call} < 0)`

case "<=":
  builtin → `(left <= right)`
  trait   → `(${cmp_call} <= 0)`

case ">":
  builtin → `(left > right)`
  trait   → `(${cmp_call} > 0)`

case ">=":
  builtin → `(left >= right)`
  trait   → `(${cmp_call} >= 0)`
```

trait dispatch 后，外层的 `< 0` / `<= 0` / `> 0` / `>= 0` 是 **Int 比较**，走 builtin 快路径，不会递归到 Ord dispatch。

### 4.4 Auto-derive Ord

#### 条件

所有字段类型可 Ord 且可 Eq → 自动 derive。

#### Struct 排序语义

**字典序**（lexicographic），按字段声明顺序：

```ring
struct Version { major: Int, minor: Int, patch: Int }
```

```javascript
function Version_Ord_cmp(self, other) {
  let c;
  c = (self.major < other.major ? -1 : self.major > other.major ? 1 : 0);
  if (c !== 0) return c;
  c = (self.minor < other.minor ? -1 : self.minor > other.minor ? 1 : 0);
  if (c !== 0) return c;
  c = (self.patch < other.patch ? -1 : self.patch > other.patch ? 1 : 0);
  return c;
}
const Version_Ord = { cmp: Version_Ord_cmp };
```

原始类型字段直接用 JS `<`/`>`，复合类型字段调用其 `Ord_cmp` 方法。

#### Enum 排序语义

**先按变体声明顺序，再按字段内容字典序：**

```ring
enum Priority { Low, Medium, High }
```

变体索引：Low=0, Medium=1, High=2。

```javascript
const __Priority_tag_order = { "Low": 0, "Medium": 1, "High": 2 };

function Priority_Ord_cmp(self, other) {
  const t1 = __Priority_tag_order[self._tag];
  const t2 = __Priority_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  // 同 tag 时比较字段（unit variant 无字段，返回 0）
  return 0;
}
```

带字段的变体：

```ring
enum Expr { Lit(Int), Add(Expr, Expr) }
```

```javascript
function Expr_Ord_cmp(self, other) {
  const t1 = __Expr_tag_order[self._tag];
  const t2 = __Expr_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  switch (self._tag) {
    case "Lit": return (self._0 < other._0 ? -1 : self._0 > other._0 ? 1 : 0);
    case "Add": {
      let c = Expr_Ord.cmp(self._0, other._0);
      if (c !== 0) return c;
      return Expr_Ord.cmp(self._1, other._1);
    }
    default: return 0;
  }
}
```

#### Tuple 排序

逐元素字典序，与 struct 相同模式。

#### 泛型

```ring
struct Pair<A, B> { a: A, b: B }
```

```javascript
function Pair_Ord_cmp(self, other, __ring_A_Ord, __ring_B_Ord) {
  let c = __ring_A_Ord.cmp(self.a, other.a);
  if (c !== 0) return c;
  return __ring_B_Ord.cmp(self.b, other.b);
}
```

Type scheme bounds: `A: Ord, B: Ord`。

### 4.5 错误码

| 错误码 | 描述 |
|--------|------|
| E0308 | 类型未实现 Ord，不可使用 `<`/`>`/`<=`/`>=` |

---

## 五、统一 Auto-derive Pass

### 5.1 执行顺序

derive pass 在所有声明注册完成后、函数体类型检查之前执行。

四个 trait 的 derive 在同一个 fixpoint 循环中处理：

```
已知集合 = {
  Eq:    { Int, Float, Str, Bool, Unit },
  Clone: { Int, Float, Str, Bool, Unit, List, Map, Set },
  Debug: { Int, Float, Str, Bool, Unit, List, Map, Set, FnType },
  Ord:   { Int, Float, Str, Bool, Unit },
}

repeat:
  对每个未完成 derive 的 struct/enum:
    if 所有字段 ∈ Eq 集合   → derive Eq, 加入 Eq 集合
    if 所有字段 ∈ Clone 集合 → derive Clone, 加入 Clone 集合
    if 所有字段 ∈ Debug 集合 → derive Debug, 加入 Debug 集合
    if 所有字段 ∈ Ord 集合 且 ∈ Eq 集合 → derive Ord, 加入 Ord 集合
until 无新增
```

### 5.2 与现有 trait impl 的优先级

如果用户手动写了 `impl Eq for MyType`，auto-derive 跳过该类型的 Eq（现有 `impl_methods` 中已有条目 → 不覆盖）。

这允许用户自定义特殊的相等/比较语义。

### 5.3 Codegen 生成时机

Auto-derived impl 的 JS 代码在 codegen 阶段生成，位于用户声明之后、main() 调用之前。

需要在 CodeGenerator 中新增一个 `emit_derived_impls()` 步骤，遍历 derive pass 标记的类型列表，按依赖顺序生成函数和 dict 对象。

### 5.4 多文件模块支持

多文件模式下，每个模块独立运行 derive pass（基于该模块可见的类型）。导出的 derived dict 需要通过 `ModuleExports` 传递给下游模块。

与 Eq spec 的 codegen 命名空间化一致：`module$Type_Eq`、`module$Type_Clone` 等。

---

## 六、影响范围汇总

在 Eq spec 基础上的增量改动：

| 文件 | Clone 改动 | Debug 改动 | Ord 改动 |
|------|-----------|-----------|----------|
| `builtins.ts` | 注册 Clone trait + 内置 impl | 注册 Debug trait + 内置 impl | 注册 Ord trait + 内置 impl |
| `infer-register.ts` | derive pass 增加 Clone 逻辑 | derive pass 增加 Debug 逻辑 | derive pass 增加 Ord 逻辑 |
| `infer-expr.ts` | — | — | `<`/`>`/`<=`/`>=` 检查 Ord + 标记 dispatch |
| `hir/index.ts` | — | — | `HBinOp` 新增 `ord_dispatch` |
| `codegen-expr.ts` | — | — | 按 dispatch 类型生成比较代码 |
| `codegen-decl.ts` | 生成 Clone 函数 + dict | 生成 Debug 函数 + dict | 生成 Ord 函数 + dict + tag_order |
| `diagnostics/codes.ts` | — | — | E0308 |
| `zonk.ts` / `hir-visitor.ts` | — | — | 处理 `ord_dispatch` 字段 |
| `runtime.ts` | — | 可选：改 print 集成 Debug | — |

### 新增 E2E 测试

| 测试 | 内容 |
|------|------|
| `clone_struct.ring` | struct clone + 独立修改验证 |
| `clone_enum.ring` | enum clone（unit/位置/命名变体） |
| `clone_generic.ring` | 泛型 struct/enum clone |
| `debug_basic.ring` | 原始类型 + struct + enum debug 输出 |
| `debug_nested.ring` | 嵌套 struct/enum + 泛型 debug |
| `ord_basic.ring` | 原始类型 `<`/`>` 仍然工作 |
| `ord_struct.ring` | struct 字典序比较 |
| `ord_enum.ring` | enum 变体顺序 + 字段比较 |
| `error_no_ord.ring` | 不可 Ord 类型使用 `<` 报 E0308 |

---

## 七、执行建议

与 Eq spec 的三个 batch 合并为统一执行序列：

| 序号 | 内容 | 依赖 |
|------|------|------|
| **Batch A** | Eq trait + `==` 解糖 + auto-derive Eq | — |
| **Batch B** | Clone trait + auto-derive Clone | Batch A（共享 derive pass） |
| **Batch C** | Ord trait + `<`/`>`/`<=`/`>=` 解糖 + auto-derive Ord | Batch A（共享 derive pass + dispatch 模式） |
| **Batch D** | Debug trait + auto-derive Debug + print 集成 | Batch A |

Batch B/C/D 互相独立，可按需调整顺序。对自举而言 B（Clone）和 C（Ord）优先级高于 D（Debug）。

---

## 八、不在范围内

- Supertrait（`trait Ord: Eq`）— 当前 trait 系统不支持，Ord/Eq 独立声明
- Hash trait — Map/Set 底层用 JS 原生 hash，暂不需要自定义
- Display trait（用户友好格式化）— Debug 已足够，Display 推迟
- `#[no_derive]` opt-out 语法 — 暂不需要
- `derive(CustomTrait)` 可扩展 derive 机制 — 后续做
- `sort_by` / 自定义比较器 — Ord trait 的 `.cmp()` 方法可直接传给排序函数
