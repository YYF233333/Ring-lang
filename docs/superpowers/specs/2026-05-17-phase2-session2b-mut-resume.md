# Phase 2 Session 2b: Cell<T> + mut effect + resume 验证

## Overview

补完 Session 2 的两个推迟功能：
1. **Cell<T> + mut effect**：内置 struct，跨闭包共享可变引用，类型层追踪 mutation
2. **Resume 验证**：确认 evidence passing 下 handler body 中"side effects + return"模式已工作（无新代码）

## Cell<T> 设计

### 用户视角

```ring
fn main() {
    let counter = Cell(0)
    let inc = fn() { counter.set(counter.get() + 1) }
    inc()
    inc()
    print(counter.get())  // 2
}
```

### 语义

- `Cell(val)` — 创建一个可变引用，初始值为 val
- `cell.get()` — 读取当前值，携带 `{mut}` effect
- `cell.set(val)` — 设置新值，携带 `{mut}` effect
- `cell.update(f)` — 应用函数更新值，携带 `{mut}` effect

### mut effect 追踪

- 调用 Cell 方法的函数自动推断 `{mut}` effect
- `{mut}` 向上传播到所有 caller
- 纯函数（无 `{mut}`）无法调用 Cell.set/get → 类型安全
- `handle { ... } with { ... }` 可以消除 `{mut}`（checker 已支持）

### 与 `var` 的区别

| | `var` | `Cell<T>` |
|--|-------|-----------|
| 作用域 | 局部变量 | 可跨函数/闭包传递 |
| Effect | 无（纯局部赋值） | `{mut}` 追踪 |
| JS 编译 | `let x = ...` | `{ value: ... }` |
| 用途 | 循环计数器等 | 闭包共享状态 |

## Checker 变更

### 注册 Cell<T>

在 `env.ts` 中注册：
- Cell<T> 作为内置 struct（含 `value: T` 字段）
- Cell 的 impl 方法注册为带 `{mut}` effect：
  - `Cell_get: fn(self: Cell<T>) -> T with {mut}`
  - `Cell_set: fn(self: Cell<T>, val: T) -> Unit with {mut}`
  - `Cell_update: fn(self: Cell<T>, f: fn(T) -> T) -> Unit with {mut}`

### 类型推断

当 `infer_call` 解析 UFCS `c.get()` 时：
1. 识别 receiver 类型为 `Cell<T>`
2. 查找 impl method `Cell_get`
3. 从注册的方法类型中获取 effects: `{mut}`
4. 合并到当前表达式的 effect row

无需改动推断算法——现有 UFCS 解析 + effect 合并已支持。

## Codegen 变更

### Cell struct

```javascript
class Cell { constructor(value) { this.value = value; } }
```

### Cell methods

```javascript
function Cell_get(self, __ev_mut) { return self.value; }
function Cell_set(self, val, __ev_mut) { self.value = val; }
function Cell_update(self, f, __ev_mut) { self.value = f(self.value); }
```

`__ev_mut` 参数存在但不使用——纯类型追踪，JS 本身可变。

### 顶层 evidence

当 main 有 `{mut}` effect 时：
```javascript
const __ev_mut = {};
main(__ev_mut);
```

`emit_toplevel_evidence` 已支持（unknown effect → `{}`）。

### 闭包中的 Cell

```ring
let counter = Cell(0)
let inc = fn() { counter.set(counter.get() + 1) }
```

编译为：
```javascript
const counter = new Cell(0);
const inc = (function() { Cell_set(counter, (Cell_get(counter, __ev_mut) + 1), __ev_mut); });
```

Lambda 通过 JS 闭包捕获 `counter` 和 `__ev_mut`——无需注入 evidence 参数。

## Resume 验证

当前 evidence passing 下，handler body 的返回值就是 effect op 的 resume 值。"Side effects before return" 已天然支持：

```ring
handle { io.read("x") } with {
    io.read(path) => {
        print("intercepted: ${path}")
        "mock-data"
    }
}
```

编译为：
```javascript
const __ev_io = { read: (path) => { print(`intercepted: ${path}`); return ("mock-data"); } };
```

**无需代码变更**，只需 e2e 测试验证此模式。

## Testing

### 新增 e2e 测试

| 文件 | 验证内容 |
|------|----------|
| `effect_cell.ring` | Cell 创建 + get/set + mut 传播 |
| `effect_cell_closure.ring` | Cell 通过闭包共享 + 多次修改 |
| `effect_resume_side.ring` | handler body 有副作用 + return（验证 resume） |

### effect_cell.ring

```ring
fn increment(c: Cell<Int>) -> Unit {
    c.set(c.get() + 1)
}

fn main() {
    let c = Cell(0)
    increment(c)
    increment(c)
    print(c.get())
}
```
Expected: `2\n`

### effect_cell_closure.ring

```ring
fn main() {
    let counter = Cell(0)
    let inc = fn() { counter.set(counter.get() + 1) }
    inc()
    inc()
    inc()
    print(counter.get())
}
```
Expected: `3\n`

### effect_resume_side.ring

```ring
fn work() -> Str {
    io.read("input.txt")
}

fn main() {
    let result = handle {
        work()
    } with {
        io.read(path) => {
            print("reading: ${path}")
            "mock-result"
        },
    }
    print(result)
}
```
Expected: `reading: input.txt\nmock-result\n`

## Acceptance Criteria

- `npm test` 全部通过（100+ 单元 + 45 e2e）
- `npm run lint` 通过
- Cell<T> 方法调用推断 `{mut}` effect
- `{mut}` 正确传播到 caller
- 纯函数中调用 Cell.get/set → 类型检查通过（{mut} 传播到 main，不报错）
- handler body side effects + return 正确执行
