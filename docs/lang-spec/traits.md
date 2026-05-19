# Trait 系统

Ring 的 trait 系统提供有界多态性（bounded polymorphism），通过 dictionary passing 编译到 JavaScript。

## Trait 声明

```ring
trait Show {
    fn to_str(self: Self) -> Str;
}
```

声明一组类型必须实现的方法。`Self` 类型变量引用实现该 trait 的具体类型。

### 默认方法

```ring
trait Eq {
    fn eq(self: Self, other: Self) -> Bool;
    fn ne(self: Self, other: Self) -> Bool {
        !self.eq(other)
    }
}
```

有函数体的方法提供默认实现。实现类型可以覆盖默认方法，也可以直接使用默认实现。

## Impl 块

### 固有方法

```ring
impl Point {
    pub fn distance(self) -> Float { ... }
}
```

为类型定义方法，不依赖任何 trait。通过 UFCS 调用：`point.distance()`。

### Trait 实现

```ring
impl Show for Point {
    fn to_str(self: Self) -> Str {
        "${self.x}, ${self.y}"
    }
}
```

为具体类型实现 trait。必须提供所有无默认实现的抽象方法。缺少必需方法报错。

### 泛型 Impl

```ring
impl<T: Show> Show for List<T> {
    fn to_str(self: Self) -> Str { ... }
}
```

Impl 块可以有自己的类型参数和约束。

## Trait Bound

### 函数约束

```ring
fn stringify<T: Show>(x: T) -> Str {
    x.to_str()
}
```

`T: Show` 约束要求 `T` 实现 `Show` trait。函数体内可调用 `Show` 的方法。

### 多约束

```ring
fn process<T: Show + Eq>(x: T, y: T) -> Bool { ... }
```

`+` 组合多个 trait bound。`T` 必须同时实现 `Show` 和 `Eq`。

### Bound 在 Type Scheme 中的传播

```
TypeScheme = ∀α₁..αₙ. τ [bounds]
bounds = { (α₁, "Show"), (α₂, "Eq"), ... }
```

泛化时 trait bound 从 `var_bounds` 收集并存入 type scheme。实例化时 bound 从旧变量转移到 fresh 变量。

## 方法解析

调用 `x.method()` 时，方法按以下顺序查找：

1. **固有方法**：`impl_methods[type_name]["method"]`
2. **原始类型方法**：Str/Int/Float 的内置方法表
3. **Trait 方法**：搜索所有 `trait_impls`，找到为该类型实现的 trait 中的方法
4. **Dictionary dispatch**：如果 receiver 是类型变量且有 trait bound，通过 dictionary 调用

### 具体类型直接调用

```ring
let p = Point { x: 1, y: 2 }
p.to_str()   // 直接调用 Point_Show_to_str(p)
```

类型已知时，编译器直接选择具体实现。

### 泛型 Dictionary Dispatch

```ring
fn show_it<T: Show>(x: T) -> Str {
    x.to_str()   // 通过 dictionary 调用
}
```

类型变量时，方法调用通过 dictionary 参数间接调用。

## Dictionary Passing 编译模型

### Trait 实现 → Dictionary 对象

```ring
impl Show for Point { fn to_str(self) -> Str { ... } }
```

编译为：

```javascript
function Point_Show_to_str(self) { ... }
const Point_Show = { to_str: Point_Show_to_str };
```

### 泛型函数 → 接收 Dictionary 参数

```ring
fn stringify<T: Show>(x: T) -> Str { x.to_str() }
```

编译为：

```javascript
function stringify(x, __ring_T_Show) {
    return __ring_T_Show.to_str(x);
}
```

### 调用时 → 传递 Dictionary

```ring
stringify(my_point)
```

编译为：

```javascript
stringify(my_point, Point_Show)
```

### Dictionary 转发

泛型函数调用另一个泛型函数时自动传递 dictionary：

```ring
fn show_twice<T: Show>(x: T) -> Str {
    stringify(x) + stringify(x)
}
```

编译为：

```javascript
function show_twice(x, __ring_T_Show) {
    return stringify(x, __ring_T_Show) + stringify(x, __ring_T_Show);
}
```

### 默认方法的 Dictionary 引用

默认方法以独立函数形式存在，dictionary 中通过 wrapper 引用：

```javascript
const Point_Eq = {
    eq: Point_Eq_eq,
    ne: function(other) {
        return __Eq_ne(Point_Eq, other);
    }
};
```

## 限制

- 不支持关联类型
- 不支持 supertrait 继承（`trait B: A`）
- 不支持 `dyn Trait` 动态分发
- Trait dictionary dispatch 不转发 evidence（trait 方法带 effect 时缺少 evidence 参数）
