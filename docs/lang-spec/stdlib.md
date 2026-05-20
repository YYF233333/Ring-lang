# 标准库

标准库通过 `std/` 目录下的 Ring 源码声明，编译器启动时自动加载（prelude）。运行时辅助函数由 codegen 的 preamble 提供。

## 全局函数

| 函数 | 签名 | 描述 |
|------|------|------|
| `print` | `<T>(value: T) -> Unit ! io` | 输出到 stdout |
| `assert` | `(cond: Bool, msg: Str) -> Unit` | 条件为 false 时 panic |
| `panic` | `(msg: Str) -> Never` | 致命错误，终止程序 |
| `exit` | `(code: Int) -> Never` | 以指定退出码终止 |
| `json_stringify` | `<T>(value: T) -> Str` | 序列化为 JSON 字符串 |

## Option\<T\>

内置 enum，表示可能为空的值。

```ring
enum Option<T> { some(T), none }
```

### 语法糖

- `T?` ≡ `Option<T>`
- `expr?` — 解包 some 或传播 fail
- `try { expr }` — 将 fail 转为 Option
- `opt or default` — 解包或使用默认值

## Str 方法

通过 `std/str.ring` 中的 `impl Str` 声明。

| 方法 | 签名 | JS 对应 |
|------|------|---------|
| `len` | `(self) -> Int` | `self.length` |
| `contains` | `(self, sub: Str) -> Bool` | `self.includes(sub)` |
| `starts_with` | `(self, prefix: Str) -> Bool` | `self.startsWith(prefix)` |
| `ends_with` | `(self, suffix: Str) -> Bool` | `self.endsWith(suffix)` |
| `slice` | `(self, start: Int, end: Int) -> Str` | `self.slice(start, end)` |
| `trim` | `(self) -> Str` | `self.trim()` |
| `to_upper` | `(self) -> Str` | `self.toUpperCase()` |
| `to_lower` | `(self) -> Str` | `self.toLowerCase()` |
| `replace` | `(self, old: Str, new: Str) -> Str` | `self.replaceAll(old, new)` |
| `split` | `(self, sep: Str) -> List<Str>` | `self.split(sep)` |
| `char_at` | `(self, index: Int) -> Option<Str>` | 越界返回 `none` |
| `index_of` | `(self, sub: Str) -> Option<Int>` | 未找到返回 `none` |
| `pad_start` | `(self, len: Int, fill: Str) -> Str` | `self.padStart(len, fill)` |
| `pad_end` | `(self, len: Int, fill: Str) -> Str` | `self.padEnd(len, fill)` |
| `repeat` | `(self, count: Int) -> Str` | `self.repeat(count)` |
| `char_code_at` | `(self, index: Int) -> Option<Int>` | `self.charCodeAt(index)` |

## 数值方法

通过 `std/num.ring` 声明。

| 方法/函数 | 签名 | 描述 |
|-----------|------|------|
| `Int.to_str` | `(self) -> Str` | 整数转字符串 |
| `Float.to_str` | `(self) -> Str` | 浮点转字符串 |
| `parse_int` | `(s: Str) -> Option<Int>` | 字符串转整数 |
| `parse_float` | `(s: Str) -> Option<Float>` | 字符串转浮点 |

## List\<T\>

可变有序集合。JS Array 底层。通过 `std/list.ring` 声明为 `extern type`。

### 构造

- `[expr, ...]` — 列表字面量
- 空列表 `[]` 需要类型上下文

### 非 HOF 方法

| 方法 | 签名 | 描述 |
|------|------|------|
| `len` | `(self) -> Int` | 长度 |
| `get` | `(self, index: Int) -> Option<T>` | 按索引取值 |
| `first` | `(self) -> Option<T>` | 首元素 |
| `last` | `(self) -> Option<T>` | 末元素 |
| `contains` | `(self, value: T) -> Bool` | 是否包含（`===` 比较） |
| `is_empty` | `(self) -> Bool` | 是否为空 |
| `push` | `(self, value: T) -> Unit` | 原地追加 |
| `pop` | `(self) -> Option<T>` | 移除并返回末元素 |
| `concat` | `(self, other: List<T>) -> List<T>` | 拼接为新 List（不修改原列表） |
| `extend` | `(self, other: List<T>) -> Unit` | 原地追加另一个列表 |
| `slice` | `(self, start: Int, end: Int) -> List<T>` | 子列表（新 List） |
| `reverse` | `(self) -> Unit` | 原地反转 |
| `join` | `(self, separator: Str) -> Str` | 用分隔符拼接为字符串 |
| `sort` | `(self) -> Unit` | 原地排序（数值比较器） |
| `shift` | `(self) -> Option<T>` | 移除并返回首元素 |
| `clear` | `(self) -> Unit` | 原地清空 |
| `index_of` | `(self, item: T) -> Option<Int>` | 查找元素索引（`===` 比较） |

### HOF 方法（effect 多态）

| 方法 | 签名 | 描述 |
|------|------|------|
| `map` | `<U>(self, f: (T) -> U / ?ε) -> List<U> / ?ε` | 映射 |
| `filter` | `(self, f: (T) -> Bool / ?ε) -> List<T> / ?ε` | 过滤 |
| `flat_map` | `<U>(self, f: (T) -> List<U> / ?ε) -> List<U> / ?ε` | 展平映射 |
| `fold` | `<A>(self, init: A, f: (A, T) -> A / ?ε) -> A / ?ε` | 折叠 |
| `find` | `(self, f: (T) -> Bool / ?ε) -> Option<T> / ?ε` | 查找 |
| `find_index` | `(self, f: (T) -> Bool / ?ε) -> Option<Int> / ?ε` | 查找满足条件的首个索引 |
| `any` | `(self, f: (T) -> Bool / ?ε) -> Bool / ?ε` | 存在性 |
| `all` | `(self, f: (T) -> Bool / ?ε) -> Bool / ?ε` | 全称性 |
| `sort_by` | `(self, cmp: (T, T) -> Int / ?ε) -> Unit / ?ε` | 自定义比较器原地排序 |

回调的 effect 通过 row 变量 `?ε` 自动传播到外层。

### 迭代

```ring
for x in list { ... }           // for-of
for (i, x) in list.entries() { ... }  // 不支持；需 Map.entries()
```

## Map\<K, V\>

可变键值集合。JS Map 底层。通过 `std/map.ring` 声明为 `extern type`。

### 构造

| 函数 | 签名 | 描述 |
|------|------|------|
| `map_new` | `<K, V>() -> Map<K, V>` | 空 Map |
| `map_from` | `<K, V>(entries: List<(K, V)>) -> Map<K, V>` | 从键值对列表构造 |
| `map_clone` | `<K, V>(m: Map<K, V>) -> Map<K, V>` | 浅拷贝 |

### 方法

| 方法 | 签名 | 描述 |
|------|------|------|
| `len` | `(self) -> Int` | 大小 |
| `get` | `(self, key: K) -> Option<V>` | 按键取值 |
| `contains_key` | `(self, key: K) -> Bool` | 是否包含键 |
| `is_empty` | `(self) -> Bool` | 是否为空 |
| `keys` | `(self) -> List<K>` | 所有键 |
| `values` | `(self) -> List<V>` | 所有值 |
| `entries` | `(self) -> List<(K, V)>` | 所有键值对 |
| `insert` | `(self, key: K, value: V) -> Unit` | 原地插入 |
| `remove` | `(self, key: K) -> Unit` | 原地删除 |
| `clear` | `(self) -> Unit` | 原地清空 |

### HOF 方法

| 方法 | 签名 | 描述 |
|------|------|------|
| `map_values` | `<W>(self, f: (V) -> W / ?ε) -> Map<K, W> / ?ε` | 值映射（新 Map） |
| `filter` | `(self, f: (K, V) -> Bool / ?ε) -> Map<K, V> / ?ε` | 过滤（新 Map） |
| `fold` | `<A>(self, init: A, f: (A, K, V) -> A / ?ε) -> A / ?ε` | 折叠 |
| `any` | `(self, f: (K, V) -> Bool / ?ε) -> Bool / ?ε` | 存在性 |

### 迭代

Map 不可直接 `for..in` 迭代。需使用 `map.entries()` 获取 `List<(K, V)>` 后解构迭代：

```ring
for (k, v) in map.entries() { ... }
```

## Set\<T\>

可变无序集合。JS Set 底层。通过 `std/set.ring` 声明为 `extern type`。

### 构造

| 函数 | 签名 | 描述 |
|------|------|------|
| `set_new` | `<T>() -> Set<T>` | 空 Set |
| `set_from` | `<T>(items: List<T>) -> Set<T>` | 从列表构造 |
| `set_clone` | `<T>(s: Set<T>) -> Set<T>` | 浅拷贝 |

### 方法

| 方法 | 签名 | 描述 |
|------|------|------|
| `len` | `(self) -> Int` | 大小 |
| `contains` | `(self, value: T) -> Bool` | 是否包含 |
| `is_empty` | `(self) -> Bool` | 是否为空 |
| `to_list` | `(self) -> List<T>` | 转为列表 |
| `insert` | `(self, value: T) -> Unit` | 原地插入 |
| `remove` | `(self, value: T) -> Unit` | 原地删除 |
| `clear` | `(self) -> Unit` | 原地清空 |
| `union` | `(self, other: Set<T>) -> Set<T>` | 并集（新 Set） |
| `intersect` | `(self, other: Set<T>) -> Set<T>` | 交集（新 Set） |
| `difference` | `(self, other: Set<T>) -> Set<T>` | 差集（新 Set） |

### HOF 方法

| 方法 | 签名 | 描述 |
|------|------|------|
| `filter` | `(self, f: (T) -> Bool / ?ε) -> Set<T> / ?ε` | 过滤（新 Set） |
| `fold` | `<A>(self, init: A, f: (A, T) -> A / ?ε) -> A / ?ε` | 折叠 |
| `any` | `(self, f: (T) -> Bool / ?ε) -> Bool / ?ε` | 存在性 |
| `all` | `(self, f: (T) -> Bool / ?ε) -> Bool / ?ε` | 全称性 |

### 迭代

```ring
for x in set { ... }
```

## Cell\<T\>

可变容器，用于 `mut` effect 下的状态管理。

| 操作 | 签名 | 描述 |
|------|------|------|
| `Cell(value)` | `<T>(T) -> Cell<T>` | 创建 Cell |
| `get` | `(self) -> T ! mut` | 读取值 |
| `set` | `(self, value: T) -> Unit ! mut` | 设置值 |
| `update` | `(self, f: (T) -> T) -> Unit ! mut` | 函数更新 |

## 相等性说明

所有集合操作（`contains`、`Map.get`、`Set.contains` 等）使用 JS `===` 引用相等：

- 对原始类型（Int、Str、Bool）正确
- 对 struct/enum 仅比较引用，不做结构相等

`Eq` trait 已实现（auto-derive，Phase 3a Batch 8），`==`/`!=` 运算符已解糖为 Eq trait dispatch。集合操作（`contains`、`Map.get`、`Set.contains` 等）计划升级为使用 Eq trait。
