# Ring 语言设计文档

> 语言层面的设计决策追踪。已确定的决策 + 未成熟的研究方向。
> 成熟后需要实施的条目转入 `backlog.md` 排队；backlog 只放 worker 拿起来就能跑的。

## 1. 所有权与参数传递模型

> **2026-06-24 重新设计**。真值源 = design.md §7。本节为速查摘要。

### 1.1 赋值语义

| 类型分类 | `let b = a` | 理由 |
|---------|-------------|------|
| 值类型（I64/F64/Bool/Char） | auto copy（memcpy） | 栈上小数据，Rust Copy 等价 |
| 复合类型，非 Drop | rc+1 共享（a 仍可用） | 零标注负担，rc+1 不是深拷贝 |
| 复合类型，Drop | auto-move（a 失效） | Drop 类型保证 rc=1，scope-end 析构 |

`let b = a.clone()` = 递归深拷贝（独立副本）。`let b = move a` = 显式 move（lv0 可不写，lv2 展示）。

### 1.2 参数传递

```
默认 = 只读借用（borrow）             ← 大多数参数
x: mut T = 可变借用（编译器推断）       ← 修改调用方的值
x: move T = 移动（编译器推断）          ← 存入/返回/跨 spawn
```

**全部由编译器从函数体推断，lv2 formatter 展示。lv0 用户不写 `mut`/`move`。**

`mut` 语法位置区分含义：
- `mut` 在名称前（`let mut x`）= rebind（用户手写）
- `mut` 在类型前（`x: mut T`）= mutation（编译器推断，lv2 展示）

### 1.3 别名追踪

非 Drop 类型 `let y = x` 创建别名（rc+1）。**mutation 后旧别名失效**：
- 对 x mutation → x 的所有别名失效
- 别名在最后使用点后自然结束，之后原名恢复独占
- 纯词法分析，不需要跨函数追踪

详见 design.md §7.4。

### 1.4 函数类型中的 Convention

```ring
fn(T) -> U           // T 被 borrow（默认）
fn(move T) -> U      // T 被 move
fn(mut T) -> U       // T 被 mut borrow
```

### 1.5 闭包捕获

编译器推断，lv2 展示捕获列表 `[mut counter: Int, name: Str]`。
- 只读 → borrow 捕获（rc+1）
- mutation → mut 捕获（共享可变绑定，豁免别名规则）
- spawn → move 捕获（强制）

### 1.6 `mut<S>` effect 移除

`mut<S>` marker effect 从 effect 系统移除（2026-06-24）。mutation 可见性由参数推断（`x: mut T`）+ 闭包捕获列表承载。effect 行只追踪 io / fail / async。

---

## 2. 标注等级规范

### 2.1 等级定义

| 等级 | 用途 | 内容 |
|------|------|------|
| lv0 | 开发者本地编辑 | 零标注，编译器全推断 |
| lv2 | Git 存储 / 推荐等级 | 完整语义标注 |

**Git 中始终存 lv2。** `ring fmt` 将 lv0 补全为 lv2，幂等确定性。

### 2.2 lv2 标注什么

| 标注项 | lv2 是否标注 | 说明 |
|--------|:---:|------|
| return type | ✅ | 函数返回类型 |
| effect row | ✅ | `with {io, fail<E>}`；纯函数省略 with |
| move param（声明） | ✅ | `fn f(move x: T)` |
| mut callsite | ✅ | `f(mut list)` |
| closure effect | ✅ | 闭包的 effect 签名 |
| 泛型约束 | ✅ | `<T: Iterable>` |
| move callsite | ❌ | 编译器 use-after-move 够用 |
| local variable type | ❌ | 过于繁琐 |
| borrow param | ❌ | 默认即 borrow |
| 泛型实例化类型参数 | ❌ | `Vec.new()` 不写 `::<I64>` |

### 2.3 模块边界标注

pub fn/trait/type 必须有完整标注（`ring check` 缺失报 warning）：
- return type
- effect row（省略 with = 纯函数）
- move 参数
- mut 参数
- 泛型约束（`<T: Ord>`）
- borrow 参数不标注（默认）

### 2.4 核心设计原则

> **标注是文档，不是语义。编译器永远从函数体推断 convention，标注不改变编译行为。**

- 标注一致 = 无事
- 标注缺失/不一致 = warning（人类场景从不 error；**agent profile 下经 CI gate 升级为 must-fix**——D-3 仲裁，philosophy.md ③）
- lv0 能编译的代码加上任何标注后仍能编译
- 编译错误只来自逻辑问题（use-after-move, 类型不匹配等）

理论联系：此模型满足 Gradual Guarantee（Siek et al. 2015）的编译期变体——添加标注不改变编译行为，移除标注不引入编译错误，不一致标注仅产生 warning。这也意味着「信任标注向下传播」式的 bidi check 不适用于 Ring——标注可能过时，编译器始终从函数体推断 truth；来自调用上下文的双向传播（lambda 参数类型、expected type）仍正常使用（philosophy.md §3「Bidirectional + constraint solving」、design.md「Lambda 双向类型传播」决策行）。

### 2.5 Formatter 对 pub fn 的处理

| 源码状态 | `ring fmt` | `ring fmt --force` | `ring check` |
|---------|-----------|-------------------|-------------|
| 无标注（新 fn） | 直接补全 | 直接补全 | ⚠ warning "missing" |
| 标注正确 | 无操作 | 无操作 | ✅ |
| 标注 ≠ 推断 | 只报 warning，不改 | 更新标注 | ⚠ warning "stale" |

Breaking change 附加提示：
- borrow → move: ⚠ "breaking: callers' values will be consumed"
- move → borrow: ℹ "non-breaking: callers retain ownership"
- effect 新增: ⚠ "breaking: callers need additional effect"
- effect 减少: ℹ "non-breaking"

**私有 fn**：fmt 全自动管理，无 warning。

---

## 3. 泛型约束推断

### 3.1 统一模型

所有函数（pub 和私有）统一推断泛型约束：
- 类型检查层：推断约束，验证方法调用合法
- lv2 标注层：fmt 生成约束声明
- Codegen 层：已知具体类型时单态化（透明优化）

### 3.2 推断算法

```
infer_constraints(fn body):
  1. 未标注类型的参数 → 分配类型变量 α
  2. 遍历方法调用 α.method():
     a. 查找所有可见 trait 中提供 method 的
     b. 恰好一个 trait → 添加约束 α: Trait
     c. 零个 → 错误 "no method found"
     d. 多个 → 错误 "ambiguous method"（语义错误，非推断问题）
  3. 关联类型链：α::Item 从已确定的 trait 获取
  4. 参数传递传播：α 被传给 fn<U: Eq>(u: U) → 添加 α: Eq
  5. 输出：最小约束集（不做 supertrait 归并）
```

### 3.3 最小性保证

"最小" = 只约束函数体实际调用方法对应的 trait：

```ring
fn example(x) {
    x.eq(other)        // 只用了 eq
}
// 推断：T: Eq（不会推断 T: Ord，即使 Ord: Eq）
```

### 3.4 具体类型退化

如果方法属于具体类型的固有方法（非 trait 方法）：

```ring
fn process(user) {
    user.user_specific_method()   // 不属于任何 trait
}
// 推断：user: User（具体类型，非泛型）
```

### 3.5 不支持的特性（有意选择）

| 不支持 | 原因 | 替代 |
|--------|------|------|
| 函数重载 | 破坏 HM principal types | Trait 多态 |
| impl Trait 参数语法 | Ring 的约束推断比 impl Trait 更强 | 直接推断 |
| Overlap / Specialization | 增加 trait solver 复杂度，可能引入 unsoundness | 默认方法 + 编译器单态化优化 |

---

## 4. Trait 系统

### 4.1 设计选择

- 支持 blanket impl（`impl<T: A> B for T`）
- 不允许 overlap（一个 (Type, Trait) 全局最多一个 impl）
- 不支持 specialization
- 支持 Coherence（orphan rule）

### 4.2 Effect 子类型

Trait 方法声明 = effect 上界（契约）：

```ring
pub trait Storage {
    fn load(self, key: Str) -> Bytes with {io, fail<StorageError>}
}

impl Storage for MemoryStorage {
    // ✅ {fail} ⊆ {io, fail} — impl 可以更窄
    fn load(self, key: Str) -> Bytes with {fail<StorageError>} { ... }
}
```

调用方行为：
- 泛型调用（`S: Storage`）：使用 trait 声明的 effect（保守）
- 具体类型调用（已知 `MemoryStorage`）：使用 impl 的实际 effect（精确）

规则：
- impl effect 超出 trait 声明 → 编译错误
- 私有 trait：effect 完全推断（所有 impl 的并集）

### 4.3 Rust blanket impl 模式的 Ring 替代

| Rust 模式 | Ring 替代 |
|-----------|----------|
| `impl<T: A> B for T`（纯 blanket） | ✅ 直接支持（无 overlap 时） |
| `From/Into` 转换链 | 显式转换 + trait 方法 |
| Blanket + 覆盖（specialization） | trait 默认方法（可在 impl 中覆盖） |
| 性能特化（specialization） | 编译器单态化 + Phase E 优化 |
| Marker trait blanket | Effect system（capability 模型替代 marker） |

### 4.4 默认参数

```ring
fn connect(host: Str, port: I64 = 8080, timeout: I64 = 30) with {io} { ... }
connect("localhost")           // port=8080, timeout=30
connect("localhost", 3000)     // timeout=30
```

- 默认值必须是编译期纯表达式
- 只能从末尾省略（无命名参数时）
- 命名参数待定（实现时重新评估）

---

## 5. 类型推断延迟解析

```ring
let x = []         // List<α>（α 未知）
x.push(42)         // α = Int（从 usage 消歧）
// ✅ 编译通过
```

- HM unification 天然支持延迟解析
- 函数结束时类型变量仍未确定 → 报错（要求标注）
- Ring 比 Rust 更激进（Rust 的 trait solver 更保守）：Ring 系统更纯粹（HM + effects），歧义更少

---

## 6. 类型系统安全性分析

### 6.1 判定性（Decidability）

| 组件 | 判定性 | 来源 |
|------|:---:|------|
| HM 推断 | ✅ 保证终止 | Damas-Milner 1982 |
| Effect row inference | ✅ 多项式时间 | Leijen (Koka) 2017 |
| Row polymorphism | ✅ HM 扩展 | Rémy 1989 |
| Trait (无 overlap) | ⚠️ blanket impl 终止性待审计（B-119，D-5 条款③） | — |
| Associated types | ✅ 有限展开 | — |
| 约束推断（方法→trait） | ✅ 有限遍历 | — |

**Ring 当前系统可判定（modulo D-5 待办：HM fuel 上限 + trait instance 终止性审计 = B-119）——类型检查以保证终止为硬约束（公理⑤）。**

### 6.2 未来特性的判定性风险

| 特性 | Phase | 风险 | 缓解策略 |
|------|-------|:---:|---------|
| Refinement Types | C/D | 高（SMT 不可判定） | 具名可判定片段（QF_LIA 类）；超出片段 = 编译错误要求显式 runtime check；**禁止 timeout 语义**（D-5，B-001 spec） |
| GADTs | D | 中（推断不可判定） | GADT match scrutinee 需要已知类型 |
| HKT | D | 中（高阶 unification） | 限制为 first-order（`* -> *`） |
| Const Generics + Refinement | D | 高（定理证明） | 限制为 Presburger arithmetic（可判定片段） |

**策略：每个高级特性限制在可判定片段内。超出片段 → 编译错误（要求标注或 runtime check），不允许编译器不终止。**

### 6.3 Soundness 分析

**Soundness 定义：safe Ring 代码（无 unsafe effect）不会产生 undefined behavior。**

当前系统需要证明的关键点：

| 风险点 | 分析 | 状态 |
|--------|------|:---:|
| Effect handler + mutation | Tail-resumptive + abort only，无法通过 handler 创建别名 | ✅ 安全 |
| Value types + copy | 简单 memcpy，无 UB | ✅ 安全 |
| Effect 子类型（impl ⊆ trait） | 编译器推断 truth，标注是文档 | ✅ 安全 |
| mut 闭包共享 box | 单线程顺序安全；spawn 需要 move（阻止跨线程共享） | ✅ 安全（需证明） |
| 逃逸检查完备性（B-068） | 直接逃逸 OK；闭包间接逃逸 + 泛型间接逃逸需要递归追踪 | ⚠️ 需要形式化 |
| Perceus RC 循环引用 | 内存泄漏（非 UB）；Drop 副作用可能延迟/丢失 | ✅ 已决策（`Weak<T>`，§9.5 / design.md §7.9；落地 = B-104 D3 + B-002） |
| unsafe effect | 用户责任，系统不保证 | 设计如此 |

### 6.4 与 Rust 的对比

| 维度 | Rust | Ring |
|------|------|------|
| 内存安全保证方式 | Borrow checker（编译期证明） | Perceus RC + ownership + 逃逸分析 |
| 资源安全保证方式 | RAII + Drop + borrowck | RAII + Drop + ownership |
| 数据竞争排除方式 | Send/Sync + borrowck | Structured concurrency + move 语义 |
| Unsoundness 来源 | unsafe block | unsafe effect |
| Trait system soundness | Specialization 有 soundness issues | 不支持 specialization，无此问题 |
| 类型检查终止性 | Trait solver 图灵完备（可能不终止） | 当前系统保证终止 |

---

## 7. 推断边界总结

### 7.1 编译器能推断的

| 信息 | 来源 | 需要手写？ |
|------|------|:---:|
| 表达式类型 | HM 推断 | ❌ |
| 函数返回类型 | 函数体最后表达式 | ❌（fmt 补全） |
| Effect row | 函数体中的 effect 调用 | ❌（fmt 补全） |
| 参数 move/borrow | 函数体是否消耗参数 | ❌（fmt 补全） |
| 泛型约束 | 方法调用 → trait 反查 | ❌（fmt 补全） |
| 局部变量类型 | 右侧表达式 | ❌ |
| 闭包参数类型 | 上下文 | ❌ |

### 7.2 编译器不能推断的（必须手写）

| 信息 | 原因 | 频率 |
|------|------|:---:|
| struct/enum/trait/effect 定义 | 创造性定义 | 常见 |
| impl 块 | 选择（哪个 trait for 哪个 type） | 常见 |
| handler 选择 | 多个 handler 可选 | 中等 |
| `fn(move T) -> U` 中的 move | 具体闭包未知 | 少见 |
| pub trait 方法签名 | 契约（允许比实现更宽） | 中等 |
| 方法名歧义消解 | 多 trait 同名方法 = 语义错误 | 少见 |
| 默认参数值 | 设计选择 | 中等 |

### 7.3 设计哲学

> **你只告诉编译器它不可能自己发现的东西。** 编译器能推断的 = 不需要人写 = fmt 自动生成到 lv2。

---

## 8. 编译期计算与代码生成

### 8.1 设计思路

不引入独立的"宏语言"。编译期元编程 = comptime 函数 + 类型反射 + 声明注入。用 Ring 写 Ring 的代码生成。

### 8.2 comptime 三种能力

| 能力 | 返回什么 | 用例 | 阶段 |
|------|---------|------|------|
| 值计算 | 编译期常量值 | lookup table, 配置常量 | Phase C |
| 条件编译 | 选择分支 | 平台适配, feature flag | Phase C |
| 声明生成 | 类型化 AST 声明 | derive, builder, codegen | Phase E |

### 8.3 值计算（Phase C）

```ring
// 编译期常量
let CRC_TABLE = comptime { compute_crc_table() }

// 条件编译
comptime if target.os == "windows" {
    fn platform_init() { ... }
} else {
    fn platform_init() { ... }
}
```

约束：
- comptime 函数必须是纯的（无 effect——编译期不能做 IO）
- 支持堆分配（List/Map/Str/struct 正常使用）
- 求值器管理独立堆，中间分配在 comptime 结束时释放
- 返回值深拷贝到二进制只读段（必须可序列化——不能返回闭包/impl Drop 资源）
- 循环/递归有深度限制（防止不终止）
- Phase C 实现：comptime 代码通过 JS 后端执行，结果序列化回编译器

### 8.4 内置 derive（Phase C）

```ring
@derive(Debug, Clone, Eq, Hash, Ord)
struct User { name: Str, age: I64 }
```

内置 derive 列表：Debug, Clone, Eq, Hash, Ord, Serialize, Deserialize

编译器内置逻辑生成 impl，不需要用户写 comptime 代码。

### 8.5 类型反射 + 声明生成（Phase E）

comptime 扩展两个能力：
- `type_info(T)` — 返回类型的结构信息（字段/变体/方法/约束）
- `emit(decls)` — 将生成的声明注入当前作用域

```ring
// 用户自定义 derive
comptime fn my_derive(info: TypeInfo) -> List<Decl> {
    let fields = info.fields
    let methods = fields.map(fn(f) {
        method_decl(f.name, [param("self")], f.type_name,
            body: [field_access("self", f.name)])
    })
    [impl_decl(info.name, methods)]
}

@my_derive
struct Config { host: Str, port: I64 }
// 生成：impl Config { fn host(self) -> Str { self.host } fn port(self) -> Int { self.port } }
```

### 8.6 覆盖的场景

| 场景 | 需要的 comptime 能力 | 阶段 |
|------|---------------------|------|
| 常量表/lookup table | 值计算 | C |
| 平台条件编译 | comptime if | C |
| 内置 derive | 内置（无需用户 comptime） | C |
| 编译期字符串/格式验证 | 值计算 + 编译错误 | C |
| 自定义 derive | type_info + emit | E |
| Builder/Visitor 生成 | type_info + emit | E |
| ORM/FFI 绑定生成 | type_info + emit（或外部 codegen 工具） | E |
| 测试生成 | emit | E |
| Protocol codegen | 外部 schema → ring-gen → .ring 文件 | C（外部工具） |

### 8.7 与 Rust proc macro 的区别

| | Rust proc macro | Ring comptime |
|---|---|---|
| 宏代码语言 | Rust（独立 crate） | Ring（同一语言） |
| 输入 | TokenStream（无类型信息） | TypeInfo（类型化，含字段名/类型/约束） |
| 输出 | TokenStream（无验证） | List\<Decl\>（类型化 AST，编译器验证） |
| 类型反射 | 不能（只看 token） | 能（type_info） |
| 卫生性 | 需要手动处理 | 类型化 AST 天然卫生 |
| 可检查性 | `cargo expand` | `ring expand` |

### 8.8 判定性约束

comptime 代码运行在编译期，必须终止：
- 递归深度限制（默认 256，可配置）
- 循环次数限制（默认 10000）
- 超出 → 编译错误 "comptime evaluation exceeded limit"
- 这和 C++ constexpr 的 `constexpr_steps` 限制相同思路

---

## 9. 语言维度设计记录

### 9.1 Phase C 阻塞（2026-05-24 全部决策完成）

#### 数值类型

14 个固定宽度类型，无 `Int`/`Float` 别名：

```
I8, I16, I32, I64, I128
U8, U16, U32, U64, U128
F32, F64
ISize, USize
```

- 字面量默认推断：`42` → `I64`，`3.14` → `F64`
- 上下文需要固定宽度时推断为对应类型
- 类型间零隐式转换（不同宽度之间无 widening、无 narrowing，全部显式 `.to_xxx()`）

#### 内存布局控制

```ring
struct Point { x: F64, y: F64 }            // 默认：编译器自由优化布局

@repr(C)
struct CPoint { x: F64, y: F64 }           // C 兼容布局（FFI）

@repr(packed)
struct Packed { tag: U8, value: I32 }       // 紧凑布局（协议解析）

@align(64)
struct CacheLine { data: List<U8> }         // 显式对齐（cache line）
```

- 默认布局不保证字段顺序（编译器可重排优化）
- `@repr(C)` 是 FFI struct 对齐的门票
- 属性标注机制，和 `@derive` 同体系

#### 动态分发

推迟实现。Phase C 用 enum 包装覆盖异构集合需求。

设计方向：未来实现时，`dyn Trait` 不可被类型推断自动推出（异构集合是显式设计意图，涉及 boxing + vtable 开销）。Object safety 不作为独立概念暴露——不满足条件时编译器报具体方法级错误。

#### 尾调用优化

编译器自动检测，无新语法：

| 场景 | 编译器行为 | debug | release |
|------|-----------|-------|---------|
| 自递归尾调用 | 转循环 | ✓ 保证 | ✓ 保证 |
| 互递归/间接尾调用，签名匹配 | `musttail` | ✓ 保证 | ✓ 保证 |
| 尾调用但签名不匹配 | `tail` hint | 不保证 | 尽力 |
| 非尾位置 / 有 Drop | 正常 call | — | — |

- 尾位置 + 无 Drop + 签名匹配 → 保证 TCO（debug/release 都做）
- 自递归转循环不依赖 LLVM `musttail`，编译器自行变换
- 间接尾调用（如 tail-call interpreter 模式）通过 `musttail` 支持
- Drop 阻止 TCO 是自然语义（有资源要释放就不是真尾调用）

#### 运算符重载

通过 trait 实现，和 Rust 模型一致：

**算术**：`Add`（`+`）、`Sub`（`-`）、`Mul`（`*`）、`Div`（`/`）、`Rem`（`%`）、`Neg`（一元 `-`）
**比较**：`Eq`（`==`/`!=`）、`Ord`（`<`/`<=`/`>`/`>=`），`Ord: Eq`（supertrait）
**位运算**：`BitAnd`（`&`）、`BitOr`（`|`）、`BitXor`（`^`）、`BitNot`（`~`）、`Shl`（`<<`）、`Shr`（`>>`）
**索引**：`Index`（`[]`）、`IndexMut`（`[]=`）

- 不支持跨类型运算（`I32 + I64` 编译错误，需显式 `.to_i64()` 转换）
- 14 个数值类型各自 impl 全套 trait（编译器内置）

#### 数值转换（2026-05-25 更新：零隐式转换）

**不同宽度类型之间零隐式转换**——无 widening、无 narrowing，全部显式 `.to_xxx()`。

```ring
let a: U8 = 42
let b: I64 = a.to_i64()      // 显式 widening
let c: U8 = b.to_u8()        // 显式 narrowing（运行时溢出 → fail）
let d: U8 = 256.to_u8()      // 编译期范围检查 → 编译错误
```

理由：日常代码只用 `I64`/`F64`（字面量默认类型），不碰宽度转换问题。碰到窄类型说明在 FFI/性能关键层，显式转换是预期的。与 Rust 一致（Rust 也无隐式数值转换）。

### 9.2 Phase C/E 相关（2026-05-24 决策）

#### 并发模型

核心设计已在 B-007 确定（async effect + 结构化并发 + generator-based 实现 + 取消语义）。

剩余实现细节（推迟到 async 实际实现时决策）：
- **Runtime**：倾向线程池 + work stealing（Tokio 模型）。JS 后端用 event loop。
- **Channel**：标准库类型，`send`/`recv` 带 `async` effect，支持有界 channel（背压）。
- **并行原语**：不提供 Mutex/RwLock（move 语义 + channel 覆盖），按需提供 Atomic 原语。

`spawn` 和 `await` 是 effect operation（非关键字），handler 可替换（sync mock 测试）。

#### 闭包分类

不引入 `Fn`/`FnMut`/`FnOnce` 三 trait。Ring 已有机制覆盖：

| Rust | Ring 等价 | 机制 |
|------|----------|------|
| `Fn` | `f: fn(T) -> U` | 默认 borrow 捕获，多次调用 |
| `FnMut` | `f: fn(mut T) -> U` | mutation 由参数推断（`mut<S>` effect 已移除，§7.9） |
| `FnOnce` | `f: fn once(T) -> U` | `once` 在函数类型上，非参数前缀 |

- `once` 是函数类型的一部分：`fn once() -> Unit` = 最多调用一次（消耗性闭包）
- 参数前缀只有 `move` 和 `mut`，不堆积
- 编译器从闭包体推断 consuming 属性，fmt 写入 lv2
- 跨模块边界通过函数类型上的 `once` 传递信息

#### Generator / yield

推迟。当前 Iterator trait + 组合子覆盖大部分场景，自定义 Iterator 频率不高。

设计方向：如果未来需要，yield 作为 effect 实现（和 async 同构），加 Iterator 适配语法糖。

#### ABI 稳定性

推迟。Phase C 不需要决策。源码分发 + C ABI（`extern fn`）覆盖当前需求。

远期选项：Ring HIR 分发（类型化中间表示，比源码紧凑，支持单态化）——等生态大到编译速度成问题时设计。

#### 包管理

Cargo 模型：

- **声明**：`ring.toml`（`[package]` + `[dependencies]` + `[dev-dependencies]`）
- **版本解析**：Semver + 最新兼容版本 + `ring.lock` 锁定
- **分发**：初期 git + path，远期建 registry（`registry.ring-lang.org`）
- **Workspace**：`[workspace] members = [...]`
- **Native 依赖**：`[native-dependencies]` 通过 `pkg-config` 发现系统 C 库
- **命令**：`ring` 同时是编译器和构建工具（`ring build/run/test/check/add/update`）
- **Comptime 安全**：comptime 代码限制为纯函数（无 IO），恶意包最多拖慢编译

### 9.3 语法/体验相关（2026-05-24 决策）

#### Newtype vs 类型别名

- `type Url = Str` = 透明别名（现有语义不变）
- Newtype 用单字段 struct：`struct Email { value: Str }`
- 不引入 `newtype` 关键字

#### 可变参数

不做。`print`/`println` 接受单个 `Str`，配合字符串插值（`"x=${x}"`）覆盖格式化需求。后期需要时走 comptime 宏。

#### 字符串细节

- Raw string `r"..."`：已实现
- 多行字符串：普通 `""` 已支持多行
- Byte string `b"..."`：新增，产出 `List<U8>`

#### 命名参数

推迟 / 不做。多默认值场景用 option struct 替代（struct 字段名天然是命名参数）。命名参数给所有 pub fn 参数名加公共契约负担，收益不足。等 LSP 可用、生态有实际痛点时再评估。

### 9.4 编译性能策略（2026-05-24 决策）

Ring 的架构设计从根源上避免 Rust 的编译性能问题。

#### 与 Rust 的根本差异

| | Rust | Ring |
|---|---|---|
| 泛型默认策略 | 全单态化 | Uniform boxing（共享泛型） |
| 值类型 | 全部 unboxed + 单态化 | 值类型单态化，引用类型共享 |
| Proc macro | syn crate 重新 parse TokenStream（慢） | comptime 直接拿 TypeInfo（typed AST，无 parse） |
| Borrow checker | 有（额外分析开销） | 无 |
| Trait solver | 复杂（specialization / overlap） | 简单（无 overlap，查表） |

#### 单态化分层（借鉴 C#/.NET Tiered Compilation）

按类型表示自动分流，不是全单态化 vs 全 boxing 的二选一：

```
泛型函数 sort<T: Ord>:
├── T = I64（值类型）→ 单态化 sort_I64（size/layout 不同，必须各一份）
├── T = MyStruct（boxing）→ 共享 sort_boxed（通过 trait dictionary dispatch）
├── T = F64（值类型）→ 单态化 sort_F64
└── 热路径 T = Str → PGO/JIT 决定是否单态化
```

| 构建模式 | 策略 | 编译速度 | 运行时性能 |
|---------|------|---------|-----------|
| Debug | 全 boxing（共享泛型） | 快 | 慢（可接受） |
| Release | 值类型单态化 + 引用类型共享 | 中 | 好 |
| Release + PGO | 上面 + profile 驱动的热路径单态化 | 两次编译 | 很好 |
| JIT（远期） | 运行时 tiered compilation | — | 最佳 |

值类型（I8/I32/I64/F64/`@value struct`）大小不同，共享 `void*` 做不到——必须单态化。但值类型的泛型实例化通常有限（数值算法主要用 I64/F64），膨胀可控。

引用类型（List/Map/Str/struct）≈ .NET 引用类型，底层都是指针，共享一份泛型实现。

#### 其他优化手段（非阻塞，按需实现）

- **Debug 快速后端**：Cranelift 替代 LLVM（B-011 codegen 预留后端抽象接口）
- **增量编译**：函数级增量。Ring 的 effect row 签名 = 精确依赖边界，签名不变 → 下游不重编
- **HIR 缓存**：依赖包首次编译后缓存 type-checked HIR，后续跳过 parse + check
- **并行编译**：模块间 codegen 完全并行（check 完成后签名固定）
- **编译 daemon**：常驻进程，保持 LLVM context + 依赖 HIR 热缓存

### 9.5 补充决策（2026-05-24）

#### 循环引用策略（B-042 决策）

`Weak<T>` 库类型，确定性析构。

- `Weak<T>` 标准库类型，`Rc.downgrade()` 创建，`.upgrade() -> T?` 访问
- 不引入 cycle collector（破坏 RAII 确定性析构）
- 图结构推荐 arena + index 模式（`List<Node>` + `USize` 邻接表）

#### 固定长度数组

`[T; N]` 语法，值类型栈分配，const generics 最简子集。

```ring
let key: [U8; 32] = [0; 32]

fn dot<N>(a: [F64; N], b: [F64; N]) -> F64 { ... }
```

- 栈上分配，赋值 = memcpy，零 RC
- N 为编译期整数常量
- 越界 panic，`.to_list()` 拷贝到堆

#### 跨线程共享

`Arc<T>` / `Atomic<T>` 作为标准库类型（非语言特性），基于 LLVM 原子操作。**不提供 `Mutex`/`RwLock`**（2026-06-12 拍板取 §9.2 为真值：move 语义 + channel 覆盖共享可变场景；本行原列 `Mutex<T>` 与 §9.2 矛盾，已订正）。

- `Rc<T>` 不可跨 spawn（编译器标记为"不可跨线程"）
- `Arc<T>` 可跨 spawn（原子引用计数）
- 不需要 Send/Sync trait——spawn 的 move 语义 + Rc/Arc 区分已覆盖

---

## 10. TODO / 待形式化

- [ ] 逃逸检查完备性证明（闭包间接逃逸 + 泛型间接逃逸的覆盖）
- [ ] mut 闭包共享 box 的安全性证明（spawn 阻止跨线程共享）
- [ ] Refinement types 的可判定片段定义
- [ ] GADTs 的标注要求（哪些位置需要类型签名）
- [ ] HKT 的 kind 限制规则
- [ ] 闭包捕获借用的精确边界 case
- [ ] `lang.toml` formatter preset 配置格式
- [ ] 方法名冲突的 qualified call 语法设计
- [ ] 命名参数是否引入（实现默认参数时评估）
（comptime 设计已定，见 §12.4）
（`io` 效果拆分已设计，见 §12.1；本条 TODO 替换为指向该节。）

---

## 11. PL 理论前沿追踪

> 未成熟的研究方向。观察、评估、记录，不排入 backlog。成熟后提取具体 spec 转 backlog。

### 11.1 Algebraic Subtyping（MLsub）

**来源**：Stephen Dolan, 2017, Cambridge PhD thesis

**核心**：用 biunification（双向合一）替代标准 unification，在 HM 里加子类型 + union/intersection types，不丢 principal types，推断仍可判定。通过极性类型（polar types）保证唯一最优解存在。

**与 Ring 的关系**：如果采用，union type 可以从匿名 enum sugar 升级为真正的类型系统概念，同时保留推断性质。当前 Ring 选择 enum sugar（design.md 1.1b）是因为假设子类型 = 丢 principal types——algebraic subtyping 打破了这个假设。

**升级路径**：替换推断引擎（unification → biunification），union/intersection 成为一等类型。

**风险**：
- 整个推断引擎大重写
- 错误信息生成更难（极性类型的报错比 unification 失败更抽象）
- 工业验证不足（只有 MLsub 原型 + 少数后续实现，无工业语言采用）

**成熟度**：★★☆☆ | **观察**，不投入。等有工业语言验证后重新评估。

### 11.2 Liquid Types — 自动化 Refinement 推断

**来源**：Rondon, Kawaguchi, Jhala 2008 (UCSD). 实现：Liquid Haskell, **Flux (Rust refinement types, 2023)**

**核心**：不让用户写任意谓词——从程序中自动提取候选谓词（qualifiers），限制为 qualifier 模板的布尔组合，然后 SMT 自动求解。比完整依赖类型务实得多。

**与 Ring 的关系**：直接适用于 B-001 refinement types。Ring 当前设计"编译器尽力静态验证 + 运行时兜底"和 liquid types 的 fallback 策略一致。Flux 已在 Rust 上验证——证明数组不越界、整数不溢出，和 ownership 系统共存。

**升级路径**：B-001 实现时参考 Flux 的 qualifier 提取 + SMT 验证策略，不从零设计。

**风险**：低——理论成熟，有 Rust 工程验证。

**成熟度**：★★★☆ | **B-001 实施时直接参考 Flux**。最值得投资的前沿方向。

### 11.3 Quantitative Type Theory (QTT)

**来源**：Atkey 2018, McBride 2016. 实现：Idris 2

**核心**：每个变量绑定带使用量注释——0（编译期擦除）、1（线性，恰好一次）、ω（不限）。线性类型、仿射类型、擦除类型全部是 usage annotation 的特例。

**与 Ring 的关系**：Ring 的 ownership（move = 1, borrow = ω, Drop = 必须恰好 1）可以看作 QTT {0, 1, ω} 子集的工程实现。如果未来 ownership 模型表达力不足（如需要区分"恰好用 2 次"或"最多 N 次"），QTT 是理论上最干净的升级路径。

**风险**：中——Idris 2 是唯一采用者，工程反馈不足。

**成熟度**：★★☆☆ | **观察**。Ring 的 ownership 模型如果工程上够用就不迁移。

### 11.4 Graded Modal Types — Effect + Linearity 统一

**来源**：Orchard, Liepelt, Eades 2019. 实现：Granule 语言

**核心**：用分级模态（graded modality）统一 effects、coeffects、linearity。每个绑定带一个来自半环的 grade——不同半环表达不同性质（使用次数、副作用、信息流、敏感度）。

**与 Ring 的关系**：Ring 目前 effect system 和 ownership 是两套独立机制，B-043 交互矩阵定义了 6 条交互规则。Graded modal types 证明它们可以在同一个框架里统一。如果交互规则持续膨胀，可以考虑用 graded types 重新形式化。

**风险**：高——纯研究原型，无工业验证。

**成熟度**：★☆☆☆ | **纯理论关注**。

### 11.5 Typed Multi-Stage Programming

**来源**：Taha, Sheard 1997. 实现：MetaOCaml（成熟）

**核心**：代码生成有类型安全保证。quote/splice 机制，类型系统保证生成的代码类型正确，不需要再过 type checker。

**与 Ring 的关系**：Ring 的 comptime Phase E `emit(decls)` 生成声明后需要再过 type checker 验证。Typed staging 可以在生成时就保证正确——更高效，且消除了"生成的代码有类型错误"这一类 bug。

**风险**：低——MetaOCaml 已有长期工程验证。

**成熟度**：★★★☆ | **Phase E comptime 设计时参考**。

### 11.6 Call-by-Push-Value（CBPV）

**来源**：Paul Blain Levy 2001, Birmingham PhD thesis

**核心**：显式区分**值（value）**和**计算（computation）**。值是已求值的数据，计算是待执行的代码（可能有 effect）。两个原语：`thunk`（冻结计算为值 = 闭包创建）、`force`（执行冻结的计算 = 闭包调用）。

**与 Ring 的关系**：Ring 已有隐式的值/计算区分——`@value struct`/I64/F64（值类型，memcpy 语义）vs 带 effect 的函数（计算）。CBPV 将这个区分形式化，可以精确指导 HIR 设计：

| CBPV 概念 | Ring 对应 |
|---|---|
| 值类型 A | `@value struct`、I64/F64/Bool |
| 计算类型 B | `fn() -> T with {effects}` |
| thunk: B → U(B) | 闭包捕获 |
| force: U(B) → B | 函数调用 |
| F(A)（值提升为计算） | 纯值 return 到 effect 上下文 |

**升级路径**：HIR 重设计时，用 CBPV 的值/计算分类指导节点类型设计——哪些 HIR 节点是值节点（可 unbox、可内联存储、零 RC）、哪些是计算节点（可能分配、需要 thunk/force 消除优化）。GHC 的 Core 语言受 CBPV 影响，是成功的工程先例。

**风险**：低——理论框架，纯编译器内部参考，不影响用户面语法。

**成熟度**：★★★☆ | **HIR 重设计时参考**。理论成熟，GHC 验证，但作为 IR 设计方法论的显式落地案例不多。

### 11.7 为可判定性放弃的特性清单

> 记录 Ring 为保持 HM 可判定推断而放弃的特性，以及替代方案。前沿研究可能恢复其中部分能力。

| # | 放弃的特性 | 原因 | Ring 替代 | 可能的恢复路径 |
|---|-----------|------|----------|--------------|
| 1 | 函数重载 | 破坏 principal types | 不同名或泛型 | — |
| 2 | 真 union type（子类型） | 等式→不等式 | 匿名 enum sugar | Algebraic Subtyping (11.1) |
| 3 | Rank-2+ 多态 | 推断不可判定 | trait 对象 | — |
| 4 | Trait overlap / specialization | solver 递归 + soundness | 默认方法 + 编译器优化 | — |
| 5 | 隐式数值 widening | 推断复杂度 | 显式 .to_xxx() | — |
| 6 | Impredicative 多态 | 推断不可判定 | struct/trait 包装 | — |
| 7 | GADT 完整推断 | 不可判定 | scrutinee 需已知类型 | — |
| 8 | FunDep | solver 复杂度 | 关联类型 | — |

---

## 12. 待实施设计（暂定，实现前重新审视）

> 以下设计方向已确定但未排入 backlog。实现前需以当前上下文重审，确认前提仍然成立。

### 12.1 效果分类：`io` 效果杀死并拆分为原子效果

**状态：暂定（2026-06-23 Discussion 设计定案）。实现前与 B-007（async）、B-125（unsafe）效果表统一审视。**

#### 动机

旧 `io` 效果是一个语义不诚实的杂项——文件读写、网络通信、标准输出、环境变量、时钟、随机数、进程管理共用同一个效果标签。agent 从签名 `with {io}` 无法判断该函数是否跨信任边界（如联网发送数据）。

真正安全关键的维度只有一个：**联网**。其余 OS 交互（读文件、打印、读环境变量）是程序运行的正常上下文，不值得独立追踪。

#### 最终效果表

| 效果 | 操作 | 说明 |
|------|------|------|
| `net` | `net.dial`, `net.listen`, `net.resolve` | 网络通信——唯一跨信任边界的 OS 效应 |
| `os` | 其余全部 OS 效应：fs/stdin/stdout/stderr/env/clock/random/spawn… | 平台杂项——函数"运行在真实 OS 上"的标志 |
| `fail<E>` | `fail.raise` | 不变 |
| ~~`mut<S>`~~ | ~~marker only（调用点注入）~~ | **已移除**（2026-06-24 §7.9）——mutation 由参数推断 `x: mut T` + 闭包捕获列表承载 |
| `async` | `async.await`, `async.spawn` | B-007 待实现 |
| `unsafe` | 原语操作（alloc/dealloc/read/write/cast…） | B-125 待实现 |

**`io` 效果从语言中彻底移除。** 不保留为简写、不做 sub-effect 层次、不做 bundle 展开。每个效果是独立存在、独立追踪的原子。

**不建 sub-effect 层次**：`net` 不是 `os` 的子效果，两者无层次关系。当前效果系统（tail-resumptive + abort）不需要子类型；handler 按具体操作匹配，不需"处理某个效果分类"。保持效果平级最大化简单。

#### 签名示例

```ring
fn fetch(url: Str) -> Data with {net}              // 只联网
fn load_config() -> Config with {os}                // 读文件 + 读 env
fn fetch_and_save() -> Unit with {net, os}          // 下载 + 写文件
fn report() -> Unit with {os}                       // 只打印
fn main() -> Unit with {}                           // 纯函数——零 OS 交互
```

#### 实施要点（实现时核定）

- `os` 的操作集合：重新审视全部标准库 extern fn，按实际语义归类
- `net` 是否需拆出 `net.dns` 子操作（DNS 解析有时独立于 TCP 连接）
- `spawn` / `random` 是否从 `os` 独立（创建子进程/使用熵源是否特殊到需要独立可见）
- formatter 策略：两项以内展开（`{fs, env}`），≥三项合并为 `{os}` 或始终展开——实现时按实证签名噪音决定
- 迁移路径：旧 `io` 在 parser 层映射为 `{os}`（不 breaking），`net` 需标准库逐个标注

### 12.2 `alloc` 效果：堆分配可见化

**状态：暂定（2026-06-23 Discussion）。实现前审视。**

#### 动机

当前 Ring 的堆分配对效果系统是不可见的——`List.push()`、`Map.insert()`、`Str` 拼接在效果上是纯函数。这意味着：

- 无法从签名区分"零分配"函数和"可能分配"函数
- 嵌入式/no-std/实时场景无法**静态禁止**堆分配——只能靠约定
- OOM 是不可恢复的 panic，而非可处理的 fail effect
- 与公理⑦（场景不可堵死）存在张力：嵌入式/WASM 场景下 OOM 是常态

**先例**：Zig 将分配器作为显式参数传递，所有可能分配的函数签名携带分配器信息，编译期即可审计"哪些代码路径需要分配"。Ring 的选择是用效果系统承载同一信息——推断 + 自动冒泡，零语法负担。

#### 设计

`alloc` 是一个内建效果，操作集合：

| 操作 | 说明 |
|------|------|
| `alloc.heap(size: USize, align: USize) -> Ptr<U8>` | 堆分配原始字节 |
| `alloc.free(ptr: Ptr<U8>, size: USize, align: USize)` | 释放 |

高层操作（`List.push`、`Map.insert`、`Str` 拼接、`.clone()` 等）内部调用 `alloc.heap`，其所在函数需要 `with {alloc}`。

`alloc.free` 不被视为需要 `alloc` 效果的调用——它不失败、不阻塞、不增复杂度。只有**分配**方向携带效果。

#### 什么不产生 alloc 效果

- 值类型操作：I64/F64/Bool/Char 的 copy、`@value struct` 的 memcpy
- RC 计数操作：`ring_dup`（写对象头 rc 字段）、`ring_drop`（读/写对象头）——对象已存在，计数值变化不分配
- 栈分配：`let x = some_struct(a, b)`（alloca）
- dealloc：`ring_drop` 最终释放（已有 RC 语义，不另标）

#### 签名语义

```ring
fn pure_fn(xs: List<I64>) -> I64 with {}           // 零堆分配——纯计算
fn process(xs: List<I64>) -> List<I64> with {alloc} // 可能分配（push / clone）
fn main() -> Unit with {os, alloc}                  // 正常程序
```

**Perceus RC 区分**：`ring_dup` 不产生 `alloc` effect——dup 操作的是已存在的堆对象头。只有首次分配（malloc）产生 `alloc` effect。这是与 C++ `new` / Rust `Box::new` / Zig `allocator.alloc` 一致的语义——分配和引用计数是两个不同层。

#### 编译器自身的影响

Ring 编译器是一个重度分配的工作负载（自编译 ~10.42B allocs）。引入 `alloc` 效果后，编译器源码中几乎所有函数都将携带 `with {alloc}`——这验证了 `alloc` 作为独立效果的必要性（若它总是和 `os` 连体出现，就不值得独立）。

但 `alloc` 和 `os` 不绑定——分配可以在无 OS 的场景（嵌入式、WASM、裸机）通过自定义 allocator 满足。这正是 Zig 模型的核心：分配器独立于 OS。

#### OOM 处理（实现时核定）

`alloc` 效果可带 OOM fail 语义——分配失败 raise `fail<Oom>` 而非 panic。这对嵌入式场景是必须的。对桌面/服务端，OOM 通常是 fatal（OS overcommit 让 OOM 语义本身不可靠），两种策略可能不同：

- 桌面 profile：`alloc` 不产生 fail effect，OOM 直接 panic（当前行为）
- 嵌入式 profile：`alloc.heap` 可 raise `fail<Oom>`，由调用栈处理

#### 与 unsafe 的关系

`alloc` 和 `unsafe` 是正交的：
- `alloc`：告知"此函数需要堆内存"，签名级可见
- `unsafe`：告知"此函数执行了绕过类型安全的内存操作"

两者可共存（`with {alloc, unsafe}` = 手动管理内存）、独立存在（`with {alloc}` = List.push，安全分配）、或都不存在（纯计算）。

#### 实施要点（实现时核定）

- `alloc` 的粒度：是否需要 `alloc.heap` / `alloc.arena` / `alloc.bump` 子效果，还是只一个顶层 `alloc`
- Perceus RC 层：`ring_malloc` / `ring_free` 的调用点是否在 HIR 层显式化（当前是 codegen/runtime 层）
- 值类型定义：`@value struct` 的判定规则——不含任何堆分配字段
- 与 B-002（Drop/RAII）的交互：Drop 执行期间不应该分配（或应显式标注 `with {alloc}`）
- 迁移：标准库逐个函数审视——哪些无分配（如 `List.len`）、哪些有分配（如 `List.push`）

### 12.3 `unsafe` 效果：两级 discharge + FFI 默认 unsafe

**状态：暂定（2026-06-23 Discussion 更新原 B-125 spec）。实现前审视。**

#### unsafe 的两个根

`unsafe` effect 只有两个产生源，均为语言边界：

**源 1：编译器内建原语（闭集）**

```
ptr_alloc      ptr_free       ptr_read       ptr_write
ptr_offset     ptr_cast       ptr_copy       ptr_from_addr   ptr_addr
```

~10 条，编译器硬编码。每个签名自动带 `with {unsafe}`。闭集之外不存在 unsafe 产生路径。

**源 2：`extern fn` 声明（默认 unsafe）**

所有 `extern fn` 声明**隐式携带 `with {unsafe}`**——与 Rust 一致，编译器无法验证 FFI 声明的正确性。

```ring
// 标准库中的 extern fn 声明——自动 with {unsafe}
extern fn printf(format: *U8, ...) -> I64    // unsafe，未写但有
```

调用任何 `extern fn` 产生 `unsafe` effect。

**源 1 + 源 2 是 unsafe 的完整边界。** `ring audit unsafe` 逐项对号，不依赖约定。

#### Deny-by-default：`requires {unsafe}`

Ring 默认**禁止** unsafe 操作——与 Rust（默认允许 unsafe，靠 `#![forbid(unsafe_code)]` 主动禁止）相反。需要在模块内写 unsafe 操作的模块必须显式声明：

| 层级 | 机制 | 作用 |
|------|------|------|
| 模块许可 | `mod requires {unsafe}` | 开启本模块的 unsafe 操作能力。不带这个声明的模块**不可**写 `unsafe {}` 块、**不可**直接调用 unsafe 原语 |
| 表达式级 | `unsafe { expr }` | 吸收块内代码的 unsafe effect，对外签名纯净 |

`requires {unsafe}` 控制两类操作：
1. **discharge**：写 `unsafe { ... }` 块把 unsafe 收口成安全
2. **直接调用原语**：`ptr_write(...)`、`ptr_read(...)` 等——即使不包裹在 `unsafe {}` 里，调用原语也必须模块声明

以下**不需要**模块声明：
- 调用其他带 `with {unsafe}` 签名的函数（非原语）——unsafe 沿签名自动冒泡，这是信息传播不是安全违规

**语法注**：`mod requires {unsafe}` 是占位语法。macro 系统成熟后可能收编为 attribute macro（`#[allow(unsafe)]`），语义不变。`ring audit unsafe` 直接读编译器注册表，输出全量 discharge 点 + 原语调用点 + 模块许可清单。

#### 栈上规则

```
底层：mod requires {unsafe}  ← 调了 ptr_write（原语）或写了 unsafe {} 块
      fn raw_op() with {unsafe} { ptr_write(...) }

中层：无需 requires          ← 只调 raw_op，不调原语，不写 unsafe 块
      fn process() with {unsafe} { raw_op() }

上层：mod requires {unsafe}  ← 写 unsafe {} 块 discharge
      fn safe_api() {
          unsafe { process() }
      }
```

中层穿越 `with {unsafe}` 和穿越 `with {os}`、`with {fail}` 行为一致——效果系统的标准传播。

#### 示例

```ring
// === 底层：runtime 绑定模块 ===
mod sys_bindings {
    requires {unsafe}    // ← 要写 unsafe {} 块 discharge

    extern fn malloc(size: USize) -> *U8       // 自动 unsafe（源 2）

    pub fn raw_alloc(size: USize) -> *U8 {
        unsafe { malloc(size) }    // discharge malloc 的 unsafe
    }
}

// === 中层：纯传递 ===
mod allocator {
    // 无 requires——不调原语、不做 discharge

    pub fn alloc_buf(size: USize) -> *U8 with {unsafe} {
        // 调 sys_bindings.raw_alloc——但 raw_alloc 签名已经干净
        // 调 ptr_alloc（源 1 原语）→ 签名自然冒泡
        ptr_alloc(size)
    }
}

// === 上层：安全封装 ===
mod safe_container {
    requires {unsafe}    // ← 要写 unsafe {} 块 discharge

    pub fn make_list<T>() -> List<T> {
        unsafe {
            allocator.alloc_buf(4096)    // discharge alloc_buf 的 unsafe
        }
        // ... 给用户返回安全的 List<T>
    }
}
```

#### 与 Rust 的差异

| | Rust | Ring |
|---|---|---|
| unsafe 检查单位 | 词法块（`unsafe {}`） | effect 栈（追溯到源头） |
| unsafe 可穿越中层 | 不适用（块内封闭） | 和其他 effect 一样自动冒泡 |
| 谁可以 discharge | 任何有 `unsafe` 块的地方 | 仅 `requires {unsafe}` 模块 |
| extern fn | 默认 unsafe，调用需 unsafe 块 | 同——默认 unsafe |
| 审计 | 依赖人工/grep/clippy | `ring audit unsafe`——列所有 discharge 点 |

#### 实施要点（实现时核定）

- 原语闭集是否扩展到任意宽度的 read/write（`ptr_read_u32` 等），还是靠 `ptr_read<T>` 泛型化 + comptime 特化
- `extern fn` 的 unsafe 是否允许显式覆盖（如已知纯计算的 libm 函数 `extern fn sin(x: F64) -> F64` 不需要 unsafe——有 `extern const fn` 或属性标记的空间待定）
- `ring audit unsafe` 输出格式：按模块 → 按 discharge 点 → 按源头原语归类

### 12.4 Comptime：解释器路线（B1）

**状态：暂定（2026-06-23 Discussion 设计定案）。实现前审视。**

#### 决策

选择 **comptime 模型（Zig 路线 B1：编译期解释器）**，不采用 macro 模型（Rust 路线 A：token 流变换）。理由：

1. **Ring 是类型推断优先的语言。** macro 在类型检查之前运行，拿不到推断结果，退化为字符串处理——与 Ring 的设计根基冲突。
2. **内置 derive 已覆盖 90%+ metaprogramming 需求**（`Eq`/`Clone`/`Ord`/`Debug`/`Hash`/`Serialize`/`Deserialize`）。用户只写属性名，不写生成代码。
3. **自定义 derive 的生产者是库作者（<1% 用户），不是普通用户。** 库作者可以接受读文档学习 TypeInfo API，LLM 训练数据不足的代价落在可控群体上。
4. **macro 系统是一套完整的第二语言**（token 流 → AST → 类型信息不可用 → 输出 token 流），为 <10% 的场景引入两套语言违反公理⑧。

**LLM 兼容评估**：内置 derive 形态 `@derive(Debug)` 在 Rust 训练数据中大量存在，LLM 可直接使用。自定义 comptime 函数 `comptime fn(info: TypeInfo) -> List<Decl>` 目前训练数据极少——库作者靠 primer 文档覆盖，后续使用量上升后训练数据自然形成。

#### 模型

```ring
// 内置 derive（编译器实现，用户零代码）
@derive(Debug, Clone, Eq, Hash)
struct User { name: Str, age: I64 }

// 自定义 derive（库作者写 comptime 函数）
comptime fn builder(info: TypeInfo) -> List<Decl> {
    let methods = info.fields.map(fn(f) {
        method_decl("with_${f.name}", [param("self"), param("val", f.type_name)],
            f.type_name, body: [set_field("self", f.name, "val")])
    })
    [impl_decl(info.name, methods)]
}

@builder
struct Config { host: Str, port: I64 }
```

#### 实现策略（B1：编译期解释器）

| 阶段 | 方案 |
|------|------|
| 当前（JS bootstrap） | comptime 代码由 JS 后端在编译期执行，结果序列化回编译器 |
| LLVM native 后 | 编译器内建 Ring 解释器，或复用 JIT 基础设施（编译 + 动态加载） |

#### Comptime 做什么 / 不做什么

| 做什么 | 不做什么 |
|--------|---------|
| 内置 derive（用户只写 `@derive`） | 外部代码生成（protobuf/OpenAPI/C 头 → .ring）——这是构建系统任务，不应进编译器 |
| 自定义 derive（库作者用 TypeInfo） | 运行时反射——comptime 在编译期求值后彻底擦除 |
| 编译期常量计算（纯函数求值） | |
| 条件编译（`comptime if`） | |

#### 外部代码生成的定位

protobuf / OpenAPI / C header → Ring 代码的生成是**构建系统任务**，由独立的 CLI 工具产出 `.ring` 文件后交给编译器。不嵌入编译器——编译器不需要嵌 protobuf 解析器、不需要发网络请求取 schema。这些是 file → file 的转换，不是类型级元编程。

#### 判定性约束

comptime 代码必须终止（公理⑤）：
- 递归深度限制（默认 256）
- 循环次数限制（默认 10000）
- 超出 → 编译错误 "comptime evaluation exceeded limit"

#### 实施要点（实现时核定）

- comptime 求值器的实现路径：JS 后端执行 → native 解释器？JIT 编译 + 动态加载？
- TypeInfo API 的完整度：字段/变体/方法/泛型参数/约束/effect 签名具体提供多少
- `emit(decls)` 的类型检查：生成的声明需要再过 checker 验证（和 typed staging 的区别，lang-design.md §11.5）
- comptime 的 effect 约束：comptime 代码是否允许 `with {os}`（读文件？）——纯函数约束足够（公理②）