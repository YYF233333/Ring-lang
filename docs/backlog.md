# Backlog

> 活的工作看板。做完的条目删除，只在 git commit message 留记录。
> 条目格式：`### B-xxx <标题> [类型] [优先级] [复杂度] [状态]`
> 状态流转：`queued` → `planning` → `doing` → 删除
> 反馈分支：`doing` → `waiting-feedback`（Worker 遇到设计问题）→ Discussion 处理后 → `queued`（重新排队）
> 工作流规范见 `docs/workflow.md`

## Phase C 执行计划 （2026-05-23 确定）

**目标**：基础设施特性 + 中等特性全部完成，为层 3 重型特性铺路。

**层 1（基础设施，优先）**：
- ~~B-034 Effect Aliases [S]~~ ✅ 已完成（2026-05-23）
- ~~B-005 Supertrait 继承 [M]~~ ✅ 已完成（2026-05-23）
- ~~B-037 `mut<T>` Marker Effect [M]~~ ✅ 已完成（2026-05-23）
- ~~B-008 Default Effect Handler [M]~~ ✅ 已完成（2026-05-23）

**层 2（核心特性）**：
- B-004 关联类型 [L]（依赖 B-005）
- B-036 Iterator Trait [M]（依赖 B-005 + B-004，双 trait 方案）
- B-010 `delegate` 关键字 [M]
- B-033 GADTs [L]

**设计验证（Stabilize 前置，阻塞层 3）**：
- B-042 Perceus 循环引用策略 [M]（阻塞 B-012）
- B-043 Refinement × Linear × Effects 交互矩阵 [M]（阻塞 B-001、B-002）
- B-044 Ring 语义规范 [M]（阻塞 B-011）

**约束**：
- 依赖链：B-005 → B-004 → B-036（supertrait → 关联类型 → Iterator 完整双 trait 方案）
- B-010、B-033 无依赖，可与链中任意步骤并行
- 层 3 前置：B-042/B-043/B-044 必须在对应 XL 特性开工前完成
- 层 3（Refinement/Linear/async/LLVM）Phase C 层 1+2 + 设计验证完成后启动

---

## 类型系统

### B-001 Refinement Types [feature] [P2] [XL] [queued]
design.md 1.2。类型附带谓词，编译期静态验证 + 运行时检查兜底。

```ring
type Positive = Int where it > 0
type Email = Str where it.matches(r"^[^@]+@[^@]+\.[^@]+$")
fn divide(a: Float, b: Float where b != 0.0) -> Float { a / b }
```

- **当前状态**：Parser 已能解析 `where` 子句（tokens 被消费后丢弃），checker 验证未实现
- **前置依赖**：Phase B 模块系统稳定后启动
- **复杂度**：极大（SSA 约束传播 + 可选 Z3 集成）
- **优先级**：Phase C 首要

### B-002 Linear Types（自动推断）[feature] [P2] [XL] [queued]
design.md 11.2 解法 B。编译器做数据流分析，旧值无后续引用时安全就地修改。

- **前置依赖**：`mut<S>` 稳定
- **复杂度**：大（linearity checker + Perceus RC 的前置条件）
- **优先级**：Phase C 与 refinement 穿插

### B-003 Dependent Types Lite [feature] [P3] [XL] [queued]
design.md 1.3。类型可依赖特定值（`Vec<T, n: Nat>`），不要求完整依赖类型证明。

- **前置依赖**：Refinement types
- **复杂度**：极大（约束求解可能不可判定）
- **优先级**：Phase D（研究向）

### B-004 关联类型（Associated Types）[feature] [P2] [L] [queued]
Trait 中声明关联类型 `type Item`，impl 时指定具体类型。访问语法 `T::Item`（统一路径，checker 语义区分；歧义时后续加 `<T as Trait>::Item` 消歧）。

```ring
trait Iterator<T> {
    type Item
    fn next(mut self) -> Item?
}

trait Collection {
    type Item
    type Iter: Iterator<Self::Item>  // 关联类型带 bound
    fn iter(self) -> Iter
}

impl Iterator<Int> for Range {
    type Item = Int
    fn next(mut self) -> Int? { ... }
}

// 在泛型约束中使用
fn sum<I: Iterator<Int>>(iter: I) -> Int where I::Item == Int { ... }

// 简写：直接在 bound 中约束关联类型
fn first<I: Iterator<Item = Int>>(iter: I) -> Int { ... }
```

**当前状态**：未实现。AST/HIR/env 中无关联类型相关字段。

**前置依赖**：B-005 (Supertrait)——关联类型的 bound 约束（`type Iter: Iterator`）需要 supertrait 基础设施

**涉及修改**：
1. `ast.ring`：`Decl::Trait` 的 methods 列表支持 `Decl::TypeAlias { name, bounds, span }` 成员（或新增 `assoc_types` 字段）
2. `parser.ring`：在 trait body 内识别 `type Name` 声明（可选 `: Bound`，可选 `= Default`）；在 impl body 内识别 `type Name = ConcreteType`
3. `env.ring`：`TraitDef` 新增 `assoc_types: List<AssocTypeDef>`（含 name + bounds）；`ImplEntry` 新增 `assoc_types: Map<Str, Type>`（name → 具体类型）
4. `infer_register.ring`：
   - `register_trait()`：注册关联类型声明
   - `register_impl()`：收集 impl 中的 `type X = T` 赋值，验证 trait 声明的每个关联类型都有赋值，验证赋值类型满足 bound
5. `infer.ring`：
   - 路径解析（`T::Item`）：当路径前缀是类型参数时，查找该参数 bounds 中 trait 的关联类型，返回对应具体类型（或约束类型变量）
   - Bound 匹配：`T: Iterator<Item = Int>` 在 instantiate 时将关联类型约束传播为 unification 约束
6. `hir.ring`：`HTraitMethod` 平级新增 `HAssocType { name: Str, bounds: List<TraitBound>, concrete: Type? }`
7. `codegen`：关联类型是纯编译期概念，不生成运行时代码。trait 字典不携带类型信息。

**验收标准**：
- `trait Foo { type Item }` + `impl Foo for Bar { type Item = Int }` 可编译
- `T::Item` 在泛型函数体内解析为关联类型
- `fn foo<T: Iterator<Item = Int>>()` 约束语法生效
- 关联类型带 bound：`type Iter: Iterator<T>` → impl 中 `type Iter = X`，X 未 impl Iterator → 报错
- 未提供关联类型赋值 → 编译错误
- 同名歧义（多 trait 提供同名关联类型）→ 暂报"ambiguous associated type"错误（后续加消歧语法）
- 全部 E2E 测试通过
- 自举编译器正常编译自身


### B-033 GADTs（Generalized Algebraic Data Types）[feature] [P2] [L] [queued]
enum 变体可指定不同的返回类型约束，match 分支内编译器自动获得类型等式约束（完整方案：scoped unification）。

```ring
enum Expr<T> {
    Lit(Int): Expr<Int>,
    Add(Expr<Int>, Expr<Int>): Expr<Int>,
    IsZero(Expr<Int>): Expr<Bool>,
}

fn eval<T>(e: Expr<T>) -> T {
    match e {
        Lit(n) => n,                      // 分支内 T = Int，n: Int 满足 -> T
        Add(a, b) => eval(a) + eval(b),   // 分支内 T = Int
        IsZero(x) => eval(x) == 0,        // 分支内 T = Bool
    }
}

// 类型安全的异构列表
enum HList<T> {
    Nil: HList<Unit>,
    Cons(T, HList<U>): HList<(T, U)>,
}
```

**当前状态**：未实现

**前置依赖**：无硬依赖（但 union-find 需要扩展 snapshot/rollback）

**涉及修改**：
1. `ast.ring`：enum 变体声明扩展——`EnumVariant` 新增可选字段 `result_type: TypeExpr?`（`: Expr<Int>` 部分）
2. `parser.ring`：`parse_enum_variant()` 在字段列表后检查 `:` token → 解析返回类型约束。无 `:` 时为普通 enum（向后兼容）
3. `types.ring`：`EnumType` 的 variants 信息需要携带每个变体的类型约束（`variant_constraints: Map<Str, List<(Int, Type)>>`——类型参数 → 具体类型的绑定）
4. `infer_register.ring`：注册 enum 时，对有返回类型约束的变体，解析约束并验证——约束必须是 enum 自身的实例化（`Lit(Int): Expr<Int>` 中 `Expr<Int>` 是 `Expr<T>` 的实例化，绑定 T=Int）
5. `union_find.ring`：新增 `snapshot() -> Snapshot` 和 `rollback(Snapshot)` 方法——记录当前状态，分支结束后恢复
6. `infer.ring`：match 表达式推断时，若 scrutinee 类型是 GADT enum：
   - 每个分支进入前 `snapshot()`
   - 从变体的类型约束提取等式（如 T=Int），调用 `unify()` 注入
   - 推断分支体
   - 分支结束后 `rollback()` 撤回约束
   - 各分支返回类型在原始（未约束）环境中统一
7. `codegen`：无特殊改动——GADT 是纯编译期类型约束，JS 层面 enum 仍然是 tagged union

**验收标准**：
- `enum Expr<T> { Lit(Int): Expr<Int> }` 语法可解析
- match 分支内类型等式自动生效——`eval` 函数可类型检查通过
- 无返回类型约束的 enum 变体行为不变（向后兼容）
- 类型约束与 enum 类型不匹配 → 编译错误（如 `Foo(Int): Bar<Int>`）
- 分支约束不泄漏到分支外
- 穷尽性检查对 GADT enum 正常工作
- 全部 E2E 测试通过
- 自举编译器正常编译自身

### B-006 `dyn Trait`（动态分发）[feature] [P3] [L] [queued]
运行时多态，默认静态分发（泛型单态化），`dyn` 是主动选择动态分发的标志。

```ring
fn process_all(items: List<dyn Describable>) { ... }
```

- **当前状态**：未实现
- **前置依赖**：无硬依赖
- **优先级**：Phase C 或 D

### B-038 GATs（Generic Associated Types）[feature] [P3] [L] [queued]
关联类型可带自己的泛型参数，本质是 HKT-lite（类型构造器作为关联类型）。

```ring
trait StreamingIterator {
    type Item<'a>                    // Rust 风格（带 lifetime）
    fn next(mut self) -> Item<Self>? // Ring 不需要 lifetime，用 Self 参数化
}

// Ring 版本（无 lifetime，用类型参数替代）：
trait Lending<T> {
    type Output<U>                   // 关联类型带泛型参数
    fn lend(self, x: T) -> Output<T>
}

// HKT-lite：Functor
trait Functor {
    type F<A>                        // F 是类型构造器
    fn map<A, B>(self: F<A>, f: fn(A) -> B) -> F<B>
}
```

- **当前状态**：未实现
- **前置依赖**：B-004（关联类型）
- **复杂度**：大（关联类型的泛型化 + kind 检查）
- **优先级**：Phase D（研究向）。Ring 的 effect system 覆盖了 Monad 主要用例，GATs 紧迫度低

## Effect 系统

### B-007 `async` Effect + 结构化并发（设计已确定 2026-05-23）[feature] [P2] [XL] [queued]
async 作为 effect，handler 决定执行策略。Generator-based 实现，支持 sync handler（测试场景）。

```ring
effect async {
    fn spawn<T>(task: fn() -> T with {async}) -> Future<T>
    fn await<T>(f: Future<T>) -> T
}

// 结构化并发：spawn 必须在 scope 内
fn fetch_both() -> (Data, Data) with {async} {
    scope {
        let a = spawn { fetch_stocks() }
        let b = spawn { fetch_bonds() }
        (await(a), await(b))
    }  // scope 结束：等待所有子任务完成，未完成的自动取消
}

// 取消 = await 点注入 Cancelled fail，可 catch 补偿
fn transfer(from: Account, to: Account, amount: Int) with {async} {
    from.debit(amount)
    await(to.credit_async(amount))
} catch {
    Cancelled => from.refund(amount)  // 补偿逻辑
}

// Sync handler（测试）：
fn test_fetch() {
    let data = handle fetch_both() with {
        async.spawn(task) => task(),          // 立即执行
        async.await(f) => f,                  // 直接返回（已 resolved）
    }
    assert(data.0 == expected_stocks)
}
```

**已确定的设计决策（2026-05-23）：**

1. **实现策略：Generator-based**
   - async-effected 函数编译为 JS `function*`（generator）
   - Handler = driver，决定同步/异步驱动 generator
   - 默认 handler（生产）：async driver（`yield` Promise → 外层 `await`）
   - 自定义 handler（测试）：sync driver（`yield` mock value → 立即 `.next()`）
   - 模块导出自动包装为 JS `async function`（对 JS 消费者透明）
   - 后续优化选项：方案 C 双模编译（默认 handler → native async，仅需性能时再引入）

2. **强制结构化并发**
   - `spawn` 必须在 `scope { }` 内
   - scope 结束时：等待所有子任务完成
   - scope 提前退出（error/return）：取消所有未完成子任务
   - 无 `detach()`——所有任务生命周期由 scope 管理
   - 未来如需长命任务，在顶层 scope 或独立 handler 中 spawn

3. **取消机制：await 点 fail 注入**
   - Scope 退出触发子任务取消
   - 被取消的任务在下一个 `await` 点收到 `Cancelled` fail effect
   - 两个 await 之间的同步代码一定完整执行（不中断原子操作）
   - `Cancelled` 可被 `catch` 捕获做清理/补偿
   - 未 catch 的 `Cancelled` 向上传播直到 scope 捕获

**与 Rust 的差异（避坑）：**
- ❌ Rust：drop Future = 静默取消，任务不知道被取消了
- ✅ Ring：Cancelled fail = 显式通知，可 catch 补偿
- ❌ Rust：Pin/Unpin 复杂度（自引用 state machine）
- ✅ Ring：GC 托管，无 Pin 问题
- ❌ Rust：async trait 需要 boxing（直到 RPITIT）
- ✅ Ring：effect + 推断，trait 中 async 方法自然支持
- ❌ Rust：runtime 碎片化（tokio vs async-std）
- ✅ Ring：一种标准 handler/runtime

**前置依赖**：B-037（mut<T> marker effect）+ B-008（Default Effect Handler）
**复杂度**：极大（generator codegen + scope 管理 + 取消传播 + 标准库 async 原语）
**优先级**：层 3（Phase C 层 1+2 完成后启动）
**宣发价值**：直接解决 function coloring + cancellation safety——带 async effect 的函数可在同步 handler 下测试，取消可补偿。设计已确定，实现前可作为已解决的设计卖点讲

## OOP 模拟

### B-010 `delegate` 关键字 [feature] [P2] [M] [queued]
design.md 5.3。替代继承的复用机制，将 trait 实现委托给内部字段。编译器自动生成转发方法。

```ring
struct Admin {
    base: User,
    permissions: List<Str>,
}

impl Admin {
    delegate base: Describable, Loggable, Serializable
}

// 编译器自动生成等价代码：
// impl Describable for Admin {
//     fn describe(self) -> Str { self.base.describe() }
// }
// impl Loggable for Admin { ... }
// impl Serializable for Admin { ... }
```

**涉及修改**：
1. `ast.ring`：新增 `Decl::Delegate { field: Str, traits: List<Str>, span: Span }`，作为 impl 块内的声明
2. `parser.ring`：在 `parse_impl_body()` 中识别 `delegate` 关键字 → `parse_delegate_decl()` 解析 `field_name: Trait1, Trait2`
3. `infer_register.ring`：处理 delegate 声明——查找字段类型、验证字段类型确实 impl 了指定 trait、为外层 struct 合成 trait impl 注册（复用 `register_impl` 逻辑）
4. `infer_decl.ring`：delegate 合成的 impl 跳过方法体检查（方法体是自动生成的转发）
5. `codegen_decl.ring`：delegate 生成转发方法代码——每个 trait method 生成 `fn method(self, ...) { self.field.method(...) }`
6. `hir.ring`：可选——delegate 在 HIR 层展开为普通 impl（desugar），或保留 HDecl::Delegate 由 codegen 处理

**验收标准**：
- `delegate field: Trait` 语法可解析
- 委托后外层类型可作为 trait bound 使用（`fn foo<T: Describable>(x: T)` 可接受 Admin）
- 字段类型未 impl 指定 trait → 编译错误
- 字段名不存在 → 编译错误
- 委托 trait 方法可正常调用
- 委托不影响外层类型自己的方法（不冲突）
- 同一 trait 不能既 delegate 又手写 impl → 编译错误
- 全部 E2E 测试通过
- 自举编译器正常编译自身

## 迭代与集合

### B-036 Iterator Trait + 自定义迭代器 [feature] [P2] [M] [queued]
双 trait 方案：`Iterable<T>` 负责创建迭代器，`Iterator<T>` 负责逐步产出。`for..in` 脱糖为 Iterable 协议。

```ring
trait Iterator<T> {
    type Item    // 关联类型（B-004）
    fn next(mut self) -> Item?
}

trait Iterable<T> {
    type Iter: Iterator<T>
    fn iter(self) -> Iter
}

// 自定义 Iterator
struct Range { start: Int, end: Int, current: Int }

impl Iterator<Int> for Range {
    type Item = Int
    fn next(mut self) -> Int? {
        if self.current < self.end {
            let v = self.current
            self.current = self.current + 1
            v
        } else {
            none
        }
    }
}

// Range 自身既是数据又是游标，直接 impl Iterable 返回自己
impl Iterable<Int> for Range {
    type Iter = Range
    fn iter(self) -> Range { self }
}

// List 需要独立游标
struct ListIterator<T> { list: List<T>, index: Int }

impl<T> Iterator<T> for ListIterator<T> {
    type Item = T
    fn next(mut self) -> T? {
        if self.index < self.list.len() {
            let v = self.list.get(self.index)
            self.index = self.index + 1
            v
        } else {
            none
        }
    }
}

impl<T> Iterable<T> for List<T> {
    type Iter = ListIterator<T>
    fn iter(self) -> ListIterator<T> {
        ListIterator { list: self, index: 0 }
    }
}

// for..in 脱糖
for x in collection { body }
// → let mut __iter = collection.iter()
//   loop { match __iter.next() { some(x) => { body }, none => break } }
```

**前置依赖**：B-005 (Supertrait) + B-004 (关联类型)

**涉及修改**：
1. `std/iterator.ring`：新标准库文件，定义 `Iterator<T>` + `Iterable<T>` trait
2. `std/list.ring`：新增 `ListIterator<T>` struct + impl Iterator + impl Iterable for List
3. `std/map.ring`：新增 `MapIterator<K,V>` + impl（迭代 entries）
4. `std/set.ring`：新增 `SetIterator<T>` + impl
5. `compiler/infer.ring`：`for..in` 推断逻辑从硬编码 List/Map/Set 改为查找 `Iterable` trait impl，调用 `.iter()` 获取 Iterator 类型，再推断 `.next()` 返回类型
6. `compiler/codegen_stmt.ring`：`for..in` codegen 从硬编码 JS `for` 循环改为脱糖：`let __iter = collection.iter(); while (true) { let __next = __iter.next(); if (__next === undefined) break; ... }`
7. `runtime.ring`：可能需要为内置集合的 Iterator 提供 JS 实现（如果 Ring-native 实现性能不够）

**验收标准**：
- 自定义类型 impl Iterator → `for x in obj` 正常工作
- `for x in [1,2,3]` 仍正常（通过 List 的 Iterable impl）
- `for entry in map.entries()` 仍正常
- 嵌套 `for` 遍历同一 list → 两个独立游标，结果正确
- Iterator 自身可 `for..in`（impl Iterable for Iterator 返回 self）
- 全部 E2E 测试通过
- 自举编译器正常编译自身

## 性能优化（愿景：语义驱动的编译优化）

> **核心论点**：Ring 的类型系统（effect + refinement + linear）不仅用于安全性，还为编译器提供其他语言没有的优化信息。性能是 Ring 的核心卖点之一——目标不是"接近 C++/Rust"而是在特定场景**超越**。
>
> 优化分两层：AOT（LLVM 编译期）和 JIT（运行时 PGO），很多优化两层都可以做。
> 前置依赖链：LLVM backend → Perceus RC → 各项优化 pass → JIT（远期）。

### B-011 LLVM Native Backend [feature] [P3] [XL] [queued]
编译到 LLVM IR，所有后续优化的基础。

- **前置依赖**：Linear types（Perceus RC 基础）；Str Unicode 语义统一（消除 JS-ism）
- **FFI 边界 effect 设计**：
  1. Evidence 传递：LLVM 端用 TLS handler stack，C 函数无需感知
  2. Effect-free 函数保证干净 C ABI，零成本互调
  3. 跨语言资源安全：Linear types + `defer` 清理 FFI 资源

### B-012 Perceus 引用计数 [feature] [P3] [XL] [queued]
精确 RC + 就地复用分析（reuse analysis），消除 GC。

- **前置依赖**：Linear types + B-011

### 语义驱动优化（AOT + JIT 共享）

以下优化利用 Ring 类型系统提供的**独有语义信息**，是 C++/Rust 编译器做不到或需要手动标注才能做到的：

| 优化 | 依赖的语义信息 | AOT | JIT | C++/Rust 对等物 |
|------|--------------|-----|-----|---------------|
| **Bounds check 消除** | Refinement types（编译器已证明 `i < len`） | ✓ | — | 无（需 unsafe） |
| **RC 省略** | Linear types（证明唯一持有） | ✓ | ✓ | Rust `&mut`（手动标注） |
| **就地修改保证** | Linear types + Perceus reuse analysis | ✓ | — | Rust `&mut`（手动标注） |
| **纯函数优化** | Effect purity（`with {}`） | ✓ CSE/DCE/重排 | ✓ 自动并行 | `constexpr`（有限） |
| **Evidence 特化** | Effect 单态调用点 | ✓ | ✓ | N/A |
| **Dictionary 反虚化** | Trait dispatch 热路径 | ✓ | ✓ speculative | Rust 单态化（编译期全量） |
| **融合（Deforestation）** | 纯函数管道 + Effect purity | ✓ | — | 手动循环合并 |
| **逃逸分析 → 栈分配** | 数据流分析 | ✓ | ✓ 更精确 | 手动控制 |
| **热路径单态化** | 泛型 + row-poly 函数 | 部分 | ✓ profile 驱动 | C++ 模板（编译期全量） |
| **闭包合并** | 管道中多个小闭包 | ✓ | — | 手动合并 |

### B-041 JIT 编译（LLVM ORC）[feature] [P3] [XL] [queued]
AOT native 基础上，运行时 JIT 重编译热路径。利用运行时 profile 做 AOT 无法做的优化。

- **先例**：Julia（LLVM ORC JIT）；Java HotSpot（服务端追平 C++）；Cling（C++ 解释器）
- **前置依赖**：B-011 + 基础 AOT 优化 pass 稳定
- **优先级**：远期愿景（Phase D/E）
- **独特优势**：Ring 的 effect/refinement/linear 信息给 JIT 提供其他语言没有的优化燃料

### 类型系统驱动的控制力（远期愿景）

> 设计原则：控制力通过类型系统表达，不通过 `unsafe` 逃逸口。程序员声明意图，编译器保证正确性。
> 等性能优化阶段（LLVM backend 稳定后）再逐项实现。

**Region Effect（内存分配策略）**

`region<R>` 作为 effect，handler 决定分配策略（arena / pool / bump）。块内分配零 RC 开销，块结束一次性释放。Linear types 保证引用不逃逸 region 生命周期。

```ring
handle {
    let tmp = entities.map(|e| alloc(e.pos))
    process(tmp)
} with region { arena(64 * 1024) }
```

应用场景：游戏帧循环、HTTP 请求处理、批处理管道。

**Value Types（unboxed 内联存储）**

`@value struct Point { x: Float, y: Float }` — 保证无 RC、按值传递、内联存储。编译器验证 value type 不含引用类型字段（或所有字段也是 value type）。

应用场景：数学向量/矩阵、颜色、坐标、小型不可变数据。

**Refinement 驱动的检查消除**

`fn get_unchecked(list: List<T>, i: Int where i >= 0 && i < list.len()) -> T` — refinement 证明已涵盖安全条件，编译器跳过运行时 bounds check。不需要 `unsafe`，类型系统保证安全。

应用场景：HPC 紧循环、图像像素遍历、矩阵运算。

**声明式优化 Hint**

| Hint | 作用 |
|------|------|
| `@align(N)` / `@packed` | 内存布局控制（cache line 对齐、紧凑存储） |
| `@specialize(T = Int)` | 强制泛型函数单态化 |
| `@vectorize` | 结合 effect purity 安全自动向量化 |
| `@inline` / `@noinline` | 内联控制 |

**不做的控制力**

| 机制 | 不做的原因 |
|------|-----------|
| 原始指针 / 手动 malloc | 破坏 RC/linear 保证 |
| 手动 SIMD intrinsics | 不可移植，由编译器 + hint 处理 |
| `unsafe` 块（Rust 风格） | Ring 用类型系统消除 unsafe 的需求 |
| 无 RC 模式 | 和 Perceus 架构冲突 |

## 工具链

### B-016 LSP 移植 [feature] [P2] [L] [queued]
原 TS 实现未移植到 Ring 自举编译器。需要重新实现。

- **当前状态**：VSCode 插件仅提供语法高亮
- **前置依赖**：无硬依赖（但 formatter 完成后 LSP 可复用其 AST 处理）
- **复杂度**：大
- **优先级**：Phase B 之后，用户需求驱动

### B-017 CI 管线 [feature] [P3] [S] [queued]
测试全靠手动 `npm test`。

- **当前状态**：无 CI
- **前置依赖**：无
- **复杂度**：小
- **优先级**：按需（"仅跨平台时需要"——flywheel memory）

### B-018 Debugger [feature] [P3] [L] [queued]
source-map 支持 + 断点调试。

- **前置依赖**：LSP
- **复杂度**：大
- **优先级**：Phase D/E

## 设计验证（Stabilize 前置）

> 非实现任务，而是设计探针。在对应 XL 特性实现前完成，防止特性交互导致事后 breaking change。

### B-042 Perceus RC + 循环引用策略 [design] [P1] [M] [queued]
Perceus RC 不处理循环引用。Ring 有 OOP 手感（struct + impl + delegate），用户会写循环引用模式（观察者、树 + parent 指针、双向链表、图结构）。需要在 B-012 实现前确定逃逸方案。

**需要决策的选项**：
1. Weak reference 语法（`weak T`）— 显式标注，用户负责打断循环
2. Cycle collector 备选层 — RC 为主 + 可选 tracing GC 回收循环（Python/Swift 方案）
3. 类型系统禁止循环 — linear types 保证无循环（限制性强，可能影响 OOP 模式）
4. 混合方案 — 默认禁止 + `@cyclic` 标注允许（编译器自动插入 weak/cycle-collect）

**验证方式**：
- 列出 5-10 个典型 OOP 模式（观察者、树+parent、双向链表、图邻接、事件系统）
- 对每个模式验证选定方案是否可写、是否自然
- 确认方案不与 linear types / effect system 冲突

**验收标准**：
- 决策文档写入 design.md（含选定方案 + 否决理由）
- B-012 Perceus 的 spec 更新为包含循环处理

**前置依赖**：无
**阻塞**：B-012 Perceus RC

### B-043 Refinement × Linear × Effects 交互矩阵 [design] [P1] [M] [queued]
三个类型系统特性单独设计优雅，但组合后存在未探索的语义交互。需要在三者实现前确认无根本矛盾。

**需要验证的交互场景**：

| 交互 | 场景 | 问题 |
|------|------|------|
| Refinement × Linear | `x: Int where x > 0` 是 linear 的，消耗后谓词状态如何？ | 谓词是否附着于值的生命周期？ |
| Refinement × Effect | `fail.raise` 中断时，已验证的 refinement 值是否需要清理？ | handler 边界的 refinement 保持/失效规则 |
| Linear × Effect | linear 值在 effect handler 中被 abort，资源释放路径？ | `catch` 是否隐含 linear 值的 drop？ |
| Refinement × Linear × Effect | 带 refinement 的 linear 值跨 handler 传递 | 三系统同时作用时的类型检查算法 |
| Linear × async | linear 值在 `spawn` 的子任务中使用 | 跨任务的 ownership 转移规则 |
| Refinement × async | refinement 约束跨 `await` 点是否保持？ | 异步恢复后约束是否需要重新验证 |

**验证方式**：
- 为每个交互场景写伪代码示例
- 确定语义规则（保持 / 失效 / 报错）
- 验证规则之间无矛盾

**验收标准**：
- 交互矩阵文档写入 design.md
- B-001 / B-002 的 spec 更新为包含交互规则
- 无"待定"项——每个交互必须有明确决策

**前置依赖**：无
**阻塞**：B-001 Refinement Types、B-002 Linear Types

### B-044 Ring 语义规范（后端无关）[design] [P1] [M] [queued]
JS 后端和 LLVM 后端存在语义鸿沟（Int 溢出、字符串编码、数组越界行为）。需要在 LLVM 实现前钉死 Ring 语言自身的语义规范，两个后端都必须符合。

**需要规范的语义**：

| 维度 | 需要决定 | JS 现状 | LLVM 预期 |
|------|---------|---------|-----------|
| Int 溢出 | 回绕 / panic / 自动 BigInt？ | 静默变 Float（f64） | 二补数回绕（i64） |
| Int 范围 | 固定 i64 / 平台依赖 / BigInt？ | 安全整数 ±2^53 | i64 ±2^63 |
| Float 精度 | IEEE 754 double？ | 是 | 是 |
| 字符串编码 | UTF-8 / UTF-16 / 抽象 Unicode？ | UTF-16（JS 内部） | UTF-8（通常选择） |
| `str[i]` 语义 | 字节 / code unit / code point / grapheme？ | UTF-16 code unit | 取决于编码决策 |
| `str.len()` | 字节 / code unit / code point / grapheme？ | UTF-16 code unit 数 | 取决于编码决策 |
| 数组越界 | panic / 返回 Option / UB？ | 返回 undefined（已改为 panic） | panic |
| 整数除零 | panic / Infinity / 编译错误？ | Infinity（JS） | panic 或 refinement 排除 |
| 栈溢出 | panic / UB？ | RangeError | 取决于平台 |

**验收标准**：
- 语义规范文档写入 design.md 新章节
- JS 后端的不符合项列出 + 计划（哪些需要修正，哪些可以容忍到 LLVM）
- LLVM 后端 codegen 设计时直接引用本规范

**前置依赖**：无
**阻塞**：B-011 LLVM Backend

## Effect 系统补全

### B-046 Default Handler Body 约束检查 [feature] [P2] [S] [queued]
B-008 Default Effect Handler 的分阶段遗留。当前 default handler body 可自由使用任何 effect，缺少以下约束验证：

1. **依赖约束**：default handler body 不可使用无默认实现的自定义 effect（否则"全默认可省略 handle"的前提不成立）
2. **拓扑排序**：多个 effect 互相依赖默认 handler 时，需按依赖顺序注入 evidence
3. **循环检测**：effect A 的 default handler 使用 effect B，B 的 default handler 使用 A → 报编译错误

**涉及修改**：
1. `infer_decl.ring`：`check_effect_decl` 中对 default handler body 进行 effect 可达性分析——收集 body 使用的 effect，验证均有 default handler 或为内置（io/fail）
2. `checker.ring` 或 `infer.ring`：effect 声明全部注册后，构建 default handler 依赖图，拓扑排序 + 循环检测
3. `codegen_decl.ring`：`emit_toplevel_evidence` 按拓扑序生成 default evidence（当前未排序，可能因依赖顺序错误导致运行时 undefined）

**验收标准**：
- default handler body 使用无默认的自定义 effect → 编译错误
- 循环依赖 → 编译错误（含清晰的循环路径提示）
- 拓扑排序正确 → 多个互依赖 default effect 按序注入，运行正常
- 内置 effect（io/fail）在 default handler body 中自由使用 → 不报错
- 全部 E2E 测试通过
- 自举编译器正常编译自身

## 已知 Bug / 技术债

### B-022 表达式位置 IIFE return 截获 [bugfix] [P3] [M] [queued]
`let x = { return y; 0 }` 中的 return 被 IIFE 截获。语句位置已修复。

- **当前状态**：实践中极少遇到
- **优先级**：低

### B-024 深层嵌套泛型 UFCS 调用 [bugfix] [P3] [L] [queued]
`Pair<Pair<Int, Int>, Int>` 的 `.eq()` 等直接方法调用受限。

- **当前状态**：auto-derive 和 operator dispatch 正常，直接方法调用受限
- **优先级**：低



## 架构：后端策略（2026-05-23 更新）

**JS 后端定位为 bootstrap 后端，LLVM 为目标后端。**

| 后端 | 定位 | 生命周期 |
|------|------|---------|
| **JS (V8)** | Bootstrap | 当前唯一后端，支撑编译器自举。LLVM 后端成熟后归档，仅保留 Web playground 用途（可由 WASM 替代） |
| **LLVM** | 目标后端 | Ring 语言特性（linear types、Perceus RC、full AE）的完整实现平台 |

### 生态策略：RIIR（Rewrite It In Ring）

不依赖外部包管理生态（npm/crates.io），通过逐步用纯 Ring 重写标准库和核心库建立自有生态。底层原语（syscall、crypto、压缩）通过 C FFI 接入。

**FFI 边界是退缩前线**：标准库从 `extern fn` 包装 JS → 纯 Ring 实现。纯 Ring 代码天然跨后端——RIIR 进度 = 后端迁移就绪度。

### LLVM 后端引入路径

1. 语言特性完善（Phase C 层 1+2）
2. Codegen 接口抽象化（从 JS 单体中提取共享 HIR 优化 pass）
3. LLVM codegen 实现（HIR → LLVM IR）
4. 标准库底层原语移植（extern fn JS → extern fn C ABI）
5. 编译器自身 native 化（bootstrap 完成，JS 后端归档）

### 已排除的后端

- **WasmGC**：独立后端投入产出比不合理。Web 场景由 LLVM→WASM 路径覆盖。
- **QBE(Ring)**：编译器自包含是远期愿景，不主动规划。

## 已取消特性

### `or` 兜底表达式
design.md 2.3 层级 1。已被 Option 方法（`unwrap_or` / `unwrap_or_else`）取代，不再实现。

### Full Algebraic Effects（B-009）
Post-resume handler + multi-resume。取消原因：tail-resumptive + abort 覆盖 95%+ 实际需求，剩余用例用 async effect + defer 解决更好。实现复杂度（delimited continuation + 资源安全）与工程价值不成比例。

---

> 本文档随 Phase 推进更新。每个 Phase 启动时，从此处挑选特性进入该 Phase 的 spec。
