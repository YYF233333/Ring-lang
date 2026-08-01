# Effect 系统

Ring 用 effect row 描述计算可能发生的副作用。函数声明通常省略 effect 标注并由编译器推断；显式 `with { ... }` 是约束和文档，不改变函数体的实际语义。

## Effect 种类

| Effect | 语义 |
|--------|------|
| `io` | 外部 I/O |
| `fail<E>` | 携带 `E` 的可恢复、abortive failure |
| `mut<T>` | 修改类型为 `T` 的非局部状态；无操作的 marker effect |
| `unsafe` | 编译器无法验证的底层操作；需要显式 discharge |
| 自定义 effect | 由 `effect` 声明的一组操作 |

`io`、`fail`、`mut` 和 `unsafe` 是编译器识别的内建 effect。自定义 effect 通过其声明名称和类型参数标识。

## 自定义 Effect

```ring
effect Logger {
    fn log(msg: Str) -> Unit;
}

fn write_log(msg: Str) -> Unit with {Logger} {
    Logger.log(msg)
}
```

操作签名规定参数、返回类型和调用时产生的 effect。操作通过 `EffectName.operation(...)` 调用。

### Default handler

操作可以带默认 body：

```ring
effect Logger {
    fn log(msg: Str) -> Unit {
        print(msg)
    }
}
```

只有当一个 effect 的所有操作都有默认 body 时，调用方才能省略显式 `handle ... with`。显式 handler 总能覆盖默认实现。默认 body 本身的 effect 继续向调用方传播。

### Effect alias

`effect alias` 给一组 effect 命名：

```ring
effect alias IO = {io, fail<Str>}
effect alias Fallible<E> = {fail<E>}
```

Alias 可泛型化、可 `pub` 导出，并在类型检查前递归展开；循环 alias 被拒绝。

## `mut<T>` Marker Effect

`mut<T>` 是当前 mutation 可见性机制的一部分，并保留在 effect row 中。

- 修改函数自己的局部 `let mut` 绑定不会让 `mut` 逃逸到函数签名；
- 通过 `mut` 参数修改调用方状态，或修改闭包捕获的外部可变状态，会注入相应的 `mut<T>`；
- 调用要求可变 receiver 的方法仍需可变绑定；effect 不替代这项检查；
- `mod requires { ... }` 会检查逃逸的 `mut<T>`，因此 `requires {}` 的纯模块不能修改外部状态。

`mut<T>` 是**多实例 marker**。同一 row 可以同时包含 `mut<Int>` 与 `mut<Str>`，它们不得因为都叫 `mut` 而被统一成一个实例。裸标注 `with {mut}` 每次实例化时引入 fresh 状态类型，例如：

```ring
fn update_int(c: Cell<Int>) -> Unit with {mut<Int>} {
    c.set(c.get() + 1)
}

fn update_generic(c: Cell<Int>) -> Unit with {mut} {
    c.set(c.get() + 1)
}
```

## `unsafe` Effect

`unsafe` 标记编译器不能验证其内存安全前提的操作。它像其他 effect 一样进入函数签名并向调用方传播，但不能由普通 `handle` 或 `catch` 消除；唯一的 discharge 形式是词法 `unsafe { ... }` block。

```ring
mod raw_buffer requires {unsafe} {
    fn first(ptr: Ptr<Int>) -> Int {
        unsafe { ptr.read() }
    }
}
```

`unsafe { ... }` 只从 block 的 row 中移除显式 `unsafe`，其中产生的 `io`、`fail<E>`、`mut<T>` 或自定义 effect 仍会传播。模块必须以 `requires {unsafe}` 授权才能写 discharge block；该许可本身不消除 effect，也不证明 block 内的不变量。预加载的 raw pointer 操作见 [标准库](stdlib.md#ptrt-与-unsafe-原语)。

## Effect Row

```text
EffectRow = { e₁, e₂, ..., eₙ }          // 封闭 row
EffectRow = { e₁, e₂, ..., eₙ, ..α }     // 开放 row
```

- 封闭 row 恰好包含列出的 effect；
- 开放 row 至少包含列出的 effect，其余由尾变量 `α` 捕获；
- `{}` 表示纯计算。

规范中的函数类型可写成 `(T₁, ..., Tₙ) -> R / ε`。源码中的函数类型用 `fn(T₁, ..., Tₙ) -> R with { ... }` 表示显式 row；函数类型省略 `with` 时具有开放尾，支持 effect 多态。

### Identity 与合并

合并两个 row 时：

1. `io` 与 `io` 是同一实例；
2. `unsafe` 与 `unsafe` 是同一实例；
3. `fail<T>` 与 `fail<U>` 匹配时统一 payload 类型；
4. 同名自定义 effect 只对应一份 evidence，其类型参数必须统一；
5. `mut<T>` 按完整状态类型区分，可在同一 row 保留多个实例；
6. 未匹配 effect 只能进入开放尾；封闭侧不接受额外 effect。

两个不同的开放尾都带未匹配项时，row unification 创建共享 fresh 尾并分别保留对侧的未匹配项。该规则使 HOF 可以传播调用者尚未知晓的 effect，而不会把它们静默丢弃。

## Effect 传播

Effect 按求值组合：

| 表达式 | 结果 effect |
|--------|-------------|
| 字面量、标识符 | `{}` |
| 运算、参数列表、block | 已求值子表达式的 row 合并 |
| 函数调用 | callee row 与参数求值 row 合并 |
| 方法调用 | receiver、方法和参数 row 合并 |
| `if` / `match` | 条件或 scrutinee 与所有分支 row 合并 |
| Lambda | body row 存入函数类型；创建 lambda 本身是纯的 |

函数声明没有 `with` 时，编译器以函数体推断出的 row 为准。显式封闭 row 若漏掉函数体实际使用的 effect，编译失败。

## Effect 消除

### `catch`

`catch` 捕获左侧计算的 `fail<E>`，并用 match-arm 语法处理 payload：

```ring
let value = risky() catch {
    Missing(name) => default_for(name),
    Invalid(msg) => repair(msg),
}
```

`catch` 是完整捕获点，arms 对 `E` 做穷尽性检查；未覆盖时报 E0601。要部分处理，需在 arm 中显式重新 `fail.raise`。被捕获计算的 `fail<E>` 被消除，但 handler arm 新产生或重新抛出的 failure 向外传播。

`try` 是保留关键字，不是错误处理语法；应使用 `catch`。

### `handle ... with`

```ring
let result = handle {
    Logger.log("hello")
    42
} with {
    Logger.log(msg) => print(msg),
}
```

Handler 在词法范围内提供所列操作。被显式处理的 effect label 从 body row 中消除；开放尾中未知的 effect 原样传播。Handler arm 自己产生的 effect 也向外传播。

## Handler 语义

### Tail-resumptive 操作

非 abort 操作是 tail-resumptive：arm 的结果作为该操作调用的返回值，计算随后继续。Arm 结果必须与操作返回类型兼容；返回 `Unit` 的操作位于语句语义位置，arm 的值被丢弃。`Never` 作为 bottom 可用于任何返回位置。

Ring 不支持显式 `resume`、post-resume 代码或 multi-shot continuation。

### Abortive failure

`fail.raise(error)` 不恢复原计算。捕获它的 arm 恰好执行一次，arm 结果替换整个 `handle` / `catch` 表达式。处理当前 failure 时，对应 handler 已失活，因此 arm 内再次 `fail.raise` 会逃向外层 handler。

## HOF Effect 多态

高阶函数的 callback row 使用开放尾。以 `List.map` 的规范形状为例：

```text
map : (List<T>, (T) -> U / ?ε) -> List<U> / ?ε
```

回调的 `io`、`fail`、`mut<T>` 或自定义 effect 都通过 `?ε` 传播到 HOF 调用；HOF 不得假装回调是纯函数。精确标准库声明以 [`std/*.ring`](../../std/) 为准。

## 当前限制

- Handler 仅支持 tail-resumptive 操作和 abortive failure；
- 不支持 post-resume 或多次 resume；
- Full algebraic effects 不在当前实现范围内。
