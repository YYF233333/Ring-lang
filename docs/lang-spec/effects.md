# Effect 系统

Ring 的 effect 系统基于 effect row（来自 Koka），通过 evidence passing 编译到 JavaScript。Effect 追踪函数可能执行的副作用，并由类型系统强制执行。

## Effect 种类

| Effect | 描述 | 操作 |
|--------|------|------|
| `io` | I/O 副作用 | `read(path: Str) -> Str`、`write(path: Str, data: Str) -> Unit` |
| `fail<E>` | 可恢复错误 | `raise(error: E) -> Never` |
| `mut` | 可变状态 | Cell 操作 |
| 自定义 | 用户定义 effect | 用户定义的操作 |

### 内置 Effect

`io` 和 `fail` 是内置的——编译器直接理解它们的语义。`mut` 用于 `Cell<T>` 操作。自定义 effect 通过 `effect` 声明引入。

### 自定义 Effect 声明

```ring
effect Logger {
    fn log(msg: Str) -> Unit;
}
```

声明一个 effect 及其操作。操作签名定义参数和返回类型。

## Effect Row

```
EffectRow = { e₁, e₂, ..., eₙ }          (* 封闭 row *)
EffectRow = { e₁, e₂, ..., eₙ, ..α }     (* 开放 row，带尾变量 α *)
```

- **封闭 row**：恰好包含列出的 effect
- **开放 row**：至少包含列出的 effect，其余由尾变量 `α` 捕获

Effect row 附加在函数类型上。一个类型为 `(Int) -> Str / { io }` 的函数执行 `io` effect。类型为 `(Int) -> Int / {}` 的函数是纯函数。

## Effect 传播

Effect 通过表达式自动传播：

| 表达式 | 结果 effect |
|--------|------------|
| 标识符 | `{}` |
| 二元运算 | `ε₁ ∪ ε₂`（操作数的 effect 合并） |
| 函数调用 | `εf ∪ ε_args`（被调函数 + 参数的 effect） |
| 方法调用 | `ε_recv ∪ εm ∪ ε_args` |
| 块 | 所有语句的 effect 顺序合并 |
| Match | 所有分支 effect 的并集 |
| If-else | 所有分支 effect 的并集 |
| Lambda | 捕获在 FnType.effects 中（lambda 本身无 effect） |

### Effect 合并（Row Merge）

```
merge(ε₁, ε₂):
  1. 按 identity 去重（io ~ io, custom(f) ~ custom(f)）
  2. fail<T> ~ fail<U>：在 unification 中统一 T 和 U
  3. 两边都有尾变量时按 row unification 求解
```

## Effect 消除

四种机制从 effect row 中移除 effect：

### `try { ... }` — 将 fail 转为 Option

```ring
let result: Option<Int> = try { risky_operation() }
```

移除所有 `fail` effect，将结果包装为 `Option<T>`：成功 → `some(result)`，fail → `none`。

### `or` — 默认值

```ring
let x = risky() or 42
```

当左操作数有 `fail` effect 时：移除 `fail`，失败时使用右操作数作为默认值。

当左操作数为 `Option<T>` 时：解包 `some` 或使用默认值。

### `catch` — 错误处理

```ring
let x = risky() catch fn(e) { handle(e) }
let y = risky() catch MyError fn(e) { handle(e) }
```

不带类型名：捕获所有 `fail` effect。
带类型名：仅捕获特定类型的 `fail<E>` effect（typed catch）。

### `handle...with` — Effect Handler

```ring
let result = handle {
    logger.log("hello")
    42
} with {
    Logger.log(msg) => print(msg),
}
```

Handler 拦截 effect 操作。被处理的 effect 从 body 的 effect row 中移除。

## Effect Row Unification

```
unify_effect_rows(ε₁, ε₂):

第 1 步：应用当前替换
  ε₁' = apply_to_effect_row(subst, ε₁)
  ε₂' = apply_to_effect_row(subst, ε₂)

第 2 步：按 identity 匹配 effect
  对 ε₁' 中每个 effect e₁：
    在 ε₂' 中查找匹配的 effect e₂（相同 kind 和自定义名称）
    找到：统一参数，标记为已匹配
    未找到：加入 a_unmatched

  同理处理 ε₂' → b_unmatched

第 3 步：验证未匹配 effect
  如果 a_unmatched 非空且 ε₂' 无尾变量 → Error（纯上下文中不允许的 effect）
  如果 b_unmatched 非空且 ε₁' 无尾变量 → Error

第 4 步：求解尾变量
  两边都有尾变量（α, β）：
    α = β：无约束
    α ≠ β，两边都有未匹配项：
      创建 fresh γ
      绑定 α ↦ { b_unmatched, ..γ }
      绑定 β ↦ { a_unmatched, ..γ }
    α ≠ β，一边无未匹配项：
      将无未匹配项的尾绑定到另一个尾

  一边或两边封闭：
    有未匹配 effect 在封闭侧 → Error
    无未匹配：将开放尾绑定到另一侧的尾
```

## HOF Effect 多态

高阶函数（如 `List.map`、`List.filter`）的回调参数使用 effect row 变量：

```
List.map<T, U, ?ε>: (List<T>, (T) -> U / ?ε) -> List<U> / ?ε
```

effect 尾变量 `?ε` 允许回调具有任意 effect，这些 effect 自动传播到外层调用结果。

## Handler 语义

### Tail-resumptive（非 abort）

```ring
handle { io.read("input.txt") } with {
    io.read(path) => "mocked-data",
}
```

Handler 的返回值作为操作的结果，计算继续。适用于 `io` 和自定义 effect。

### Abort

```ring
handle { fail.raise("error"); 0 } with {
    fail.raise(e) => -1,
}
```

`fail.raise` 具有 abort 语义：handler 的返回值成为整个 `handle` 表达式的结果，原始计算被丢弃。

### 限制

- 不支持 post-resume handler（resume 后继续执行额外代码）
- 需要 delimited continuation 的完整代数 effect 尚未实现

## Evidence Passing 编译模型

Effect 编译为 evidence 参数传递：

1. 每个 effect 对应一个 evidence 参数 `__ring_ev_{effect_name}`
2. Effect 操作编译为 evidence 方法调用：`io.read(x)` → `__ring_ev_io.read(x)`
3. Handler 构造 evidence 对象并传递给 body
4. 参数按 effect 名字母序排列
5. 顶层 `main()` 自动注入真实 evidence（io → fs，fail → throw）

详细翻译规则见 [JS 翻译](codegen.md)。
