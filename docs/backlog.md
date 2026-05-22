# Backlog

> 活的工作看板。做完的条目删除，只在 git commit message 留记录。
> 条目格式：`### B-xxx <标题> [类型] [优先级] [复杂度] [状态]`
> 状态流转：`queued` → `planning` → `doing` → 删除
> 反馈分支：`doing` → `waiting-feedback`（Worker 遇到设计问题）→ Discussion 处理后 → `queued`（重新排队）
> 工作流规范见 `docs/workflow.md`

## Phase C 执行计划���2026-05-23 确定）

**目标**：基础设施特性 + 中等特性全部完成，为层 3 重型特性铺路。

**层 1（基础设施，优先）**：
- B-034 Effect Aliases [S]
- B-005 Supertrait 继承 [M]
- B-037 `mut<T>` Marker Effect [M]
- B-008 Default Effect Handler [M]

**层 2（核心特性）**：
- B-004 关联类型 [L]（依赖 B-005）
- B-036 Iterator Trait [M]（依赖 B-005 + B-004，双 trait 方案）
- B-010 `delegate` 关键字 [M]
- B-033 GADTs [L]

**约束**：
- 依赖链：B-005 → B-004 → B-036（supertrait → 关联类型 → Iterator 完整双 trait 方案）
- B-010、B-033 无依赖，可与链中任意步骤并行
- 层 3（Refinement/Linear/async/LLVM）Phase C 完成后再讨论

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

### B-005 Supertrait 继承 [feature] [P2] [M] [queued]
Trait 之间的继承关系。实现 subtrait 时必须先实现所有 supertrait。

```ring
trait Eq {
    fn eq(self, other: Self) -> Bool
}

trait Ord: Eq {  // Ord 要求 Eq
    fn cmp(self, other: Self) -> Int
}

trait Printable: Eq + Debug {  // 多个 supertrait
    fn pretty(self) -> Str
}

// impl Ord 时编译器要求 impl Eq 已存在
impl Ord for MyType {
    fn cmp(self, other: MyType) -> Int { ... }
}
// 若无 impl Eq for MyType → 编译错误
```

**当前状态**：AST `Decl::Trait` 已有 `supertraits: List<TypeBound>` 字段（parser.ring:1132 固定为空列表）。`TraitDef`（env.ring:65）无 supertrait 字段。

**涉及修改**：
1. `parser.ring`：在 `parse_trait_decl()` 中，type_params 解析后、`{` 之前，检查 `:` token → 调用 `parse_type_bound_list()`（用 `+` 分隔多个 bound）填充 `supertraits`
2. `env.ring`：`TraitDef` 新增 `supertraits: List<Str>` 字段
3. `infer_register.ring`：`register_trait()` 接收并存储 supertraits；验证 supertrait 名已注册（否则报错）
4. `infer_decl.ring`：`check_impl_decl()` 中，当 impl 的 trait 有 supertrait 时，验证目标类型对每个 supertrait 都有 impl（遍历 `trait_reg.trait_impls` 查找匹配）——缺失时报新错误码（如 E0505 "type `X` does not implement supertrait `Y` required by `Z`"）
5. `codegen_decl.ring`：`emit_trait_dictionary()` 中 supertrait 方法**不合并**到子 trait 字典——各 trait 独立字典，泛型函数需要 subtrait 时编译器同时传递 supertrait 字典参数
6. `infer.ring`：trait bound 解析时，`T: Ord` 隐含 `T: Eq`——在 bound 推断/检查中自动展开 supertrait 链

**验收标准**：
- `trait Ord: Eq` 语法可解析
- `impl Ord for X` 无 `impl Eq for X` → 报 E0505
- `impl Ord for X` 有 `impl Eq for X` → 正常编译
- `fn foo<T: Ord>(x: T)` 内部可调用 `.eq()` 和 `.cmp()`
- 多级继承：`trait A: B`, `trait B: C` → impl A 要求 B 和 C 都��� impl
- 循环继承检测：`trait A: B`, `trait B: A` → 编译错误
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

## Effect 系统

### B-007 `async` Effect + 结构化并发 [feature] [P2] [XL] [queued]
design.md 2.1 + 第 8 章。async 作为 effect 而非颜色标记，handler 决定执行策略。

```ring
effect async {
    fn spawn<T>(task: fn() -> T) -> Future<T>
    fn await<T>(f: Future<T>) -> T
}

fn fetch_data() {
    scope {
        let a = spawn { fetch_stocks() }
        let b = spawn { fetch_bonds() }
        (await(a), await(b))
    }
}
```

- **前置依赖**：`mut<S>` 参数化完成（effect 系统成熟度）
- **复杂度**：大（结构化并发 + JS async/await 映射；LLVM backend 需 native async runtime）
- **优先级**：Phase C 或 D
- **宣发价值**：直接解决 function coloring 问题——async 是 effect 而非颜色标记，带 async effect 的函数可以在同步 handler 下测试。设计阶段可讲，实现前不可作为已解决的卖点

### B-008 Default Effect Handler（设计已确定 2026-05-22）[feature] [P2] [M] [queued]
design.md 2.2。Op 带 body = 默认 handler，语法与 trait 默认方法一致。解决"每次调用都要写 handle...with"的 boilerplate 问题。

```ring
effect Logger {
    fn log(msg: Str) -> Unit {    // 有 body = 有默认 handler
        print(msg)
    }
}

effect Storage {
    fn read(key: Str) -> Str              // 无 body = 必须 handle
    fn log(msg: Str) -> Unit { print(msg) } // 有 body = 可选 handle
}

fn main() {
    do_work()  // Logger 全部 op 有默认，无需 handle...with
}
```

**已确定的语义：**
1. 签名透明：有默认的 effect 仍出现在推断签名中（`with {Logger}`）
2. 部分默认：显式 handle 覆盖默认，无默认且未 handle → 编译错误
3. 全默认可省略 handle：编译器自动注入默认 evidence

**Effect 约束（中间版）：**
- Default handler body 可用内置 effect（io/fail/mut）和已有 default 的自定义 effect
- 不可用无默认的自定义 effect
- 编译器拓扑排序 default handler 依赖，循环 → 编译错误

- **前置依赖**：无硬依赖
- **复杂度**：中
- **优先级**：Phase C
- **参考**：语法方案模仿 trait 默认方法（Ring 已有先例），中间版避免了 Snowflyt 指出的 handler 链式解析的完整复杂度


### B-034 Effect Aliases [feature] [P2] [S] [queued]
效果组合命名，简化复杂 effect 标注。纯语法糖——在 resolve 阶段展开为 effect 列表。

```ring
effect alias IO = {io, fail<Str>}
effect alias WebHandler = {io, fail<HttpError>, mut<Session>}

fn handle_request(req: Request) -> Response with {WebHandler} { ... }
// 推断签名等价于 with {io, fail<HttpError>, mut<Session>}
```

**涉及修��**：
1. `ast.ring`：新增 `Decl::EffectAlias { name: Str, type_params: List<TypeParam>, effects: List<EffectExpr>, is_pub: Bool, span: Span }`
2. `parser.ring`：��� `parse_decl()` 中识别 `effect alias` 两个连续 token，调用新函数 `parse_effect_alias_decl()` 解析 `Name<T> = { effects }`
3. `env.ring`：新增 `EffectAliasDef { name: Str, type_params: List<Str>, effects: List<Effect> }`，存储在 `TypeRegistry` 中（新字段 `effect_aliases: Map<Str, EffectAliasDef>`）
4. `infer_register.ring`：新增 `register_effect_alias()` 在 Pass 1 注册别名定义
5. `infer_register.ring`：修改 `resolve_effect_expr()`——当 effect name 不是 builtin（io/fail/mut）且不在 `effects` map 中时，查找 `effect_aliases` map，展开为效果列表（支持类型参数替换）
6. `hir.ring`：HIR 不需要 EffectAlias 节点——展开发生在 resolve 阶段，HIR 只看到展开后的 effects
7. `codegen`：无改动（alias 在 checker 阶段已消失）

**验收标准**：
- `effect alias IO = {io, fail<Str>}` 可声明
- `fn foo() with {IO}` 等价于 `with {io, fail<Str>}`——推断结果和 catch 行为一致
- 带类型参数：`effect alias Failable<E> = {fail<E>}` → `with {Failable<MyErr>}` 展开为 `with {fail<MyErr>}`
- 不允许递归别名（A 引用 B 引用 A → 编译错误）
- `pub effect alias` 在模块间可见
- 全部 E2E 测试通过
- 自举编译器正常编译自身

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

## 性能优化

### B-011 LLVM Native Backend [feature] [P3] [XL] [queued]
design.md 14.2。编译到 LLVM IR，桌面/服务端场景。

- **前置依赖**：Linear types（Perceus RC 基础）；迁移正前方需完成 Str Unicode 语义统一（`len`/`char_at`/`slice` 等从 UTF-16 切到 code point 语义，消除 JS-ism）
- **复杂度**：极大
- **优先级**：Phase C（长期视野 [[long-term-vision]]）
- **FFI 边界 effect 设计**（LLVM 阶段必须在设计期解决的问题）：
  1. **Evidence 传递方案**：LLVM 端使用 TLS（Thread-Local Storage）handler stack 存储 evidence，而非函数参数传递。C 函数无需感知 evidence 存在，Ring→C→Ring callback 中 effect 自然穿透（与 JS 端 try/catch 的 ambient 语义对齐）
  2. **Effect-free 的 Ring 函数保证干净 C ABI**（无 evidence 参数），零成本互调
  3. **跨语言资源安全**：Linear types 保证 Ring 侧资源，但 C 分配的资源（`malloc`/`fopen`）不在 RC 图中。effect handler abort 时需要 `defer` 机制清理 FFI 资源
  - **参考**：Koka 不暴露 C FFI 给用户（monadic transformation 编译到 C）；OCaml 5 限制 effect 不能跨 C 帧；Rust `extern "C" fn` 不能是 async
  - **已排除**：full AE 跨 C 帧（B-009 已取消，不需要 delimited continuation）

### B-012 Perceus 引用计数 [feature] [P3] [XL] [queued]
design.md 14.3。精确 RC + 就地复用分析，消除 GC 停顿。

- **前置依赖**：Linear types + LLVM backend
- **复杂度**：极大
- **优先级**：Phase C/D

### B-013 热路径单态化 [feature] [P3] [M] [queued]
design.md 11.3。Row-poly 函数在热循环中特化为具体类型版本。

- **前置依赖**：性能 profiling 基础设施
- **复杂度**：中
- **优先级**：Phase D/E

### B-014 融合（Deforestation）[feature] [P3] [M] [queued]
design.md 11.2 解法 C。消除中间集合，多次遍历合并为一次。

- **前置依赖**：标准库 HOF 方法迁移到 Ring（Phase B S2）
- **复杂度**：中
- **优先级**：Phase D/E

### B-015 闭包合并 [feature] [P3] [M] [queued]
design.md 11.5。管道中多个小闭包合并为单次遍历的合并函数。

- **前置依赖**：融合
- **复杂度**：中
- **优先级**：Phase E

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

## 设计对齐：待实现变更

### B-037 `mut<T>` Marker Effect 接入统一 mut 系统 [design-align] [P2] [M] [queued]
当前 `mut self` / `mut` 参数的检查是纯编译期，不经过 effect system。`mut<T>` effect 基础设施（推断/unification/codegen）在编译器中已存在（原 Cell\<T\> 遗留），但无触发源。

**设计**：将 `mut<T>` 作为 marker effect（与 `io` 同类——纯编译期追踪，零运行时成本），由 `mut self` 方法调用和 `mut` 参数传递触发：

| 操作 | 产生的 effect | 理由 |
|------|--------------|------|
| `let mut` 局部变量赋值 | 无 | 调用方不可观测 |
| `mut self` 方法调用 | `mut<Self>` | 修改调用方持有的对象 |
| `mut` 参数传递 | `mut<T>` | 修改调用方传入的数据 |

**Effect 分类**：

| 类别 | 代表 | 运行时 | 用途 |
|------|------|--------|------|
| Runtime effect | `fail<E>`, 自定义 effect | 有 evidence / handler | 控制流改变 |
| Marker effect | `io`, `mut<T>` | 零成本，纯编译期 | 签名可见性、模块 capability、formatter 标注 |

类比 Rust `Send`/`Sync` trait：标记能力，不产生代码。Ring 的优势是自动推断 + 自动传播。

**涉及修改**：
1. `infer.ring`：`mut self` 方法调用和 `mut` 参数传递时向当前 effect row 注入 `mut<T>`
2. `codegen*.ring`：确认 `mut<T>` effect 不生成 evidence 参数（与 `io` 一致）
3. `tests/cases/`：验证 `mut<T>` 在签名中正确推断和传播

**验收标准**：
- `fn foo(mut list: List<Int>) { list.push(1) }` 推断出 `with {mut<List<Int>>}`
- `let mut x = 0; x = 1` 不产生 effect（纯局部）
- `mod pure requires {}` 内调用 mutating 函数报错
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

## 架构：多后端策略

Ring 成熟后为双后端结构（JS + LLVM），各有主场：

| 后端 | 主场景 | 特有约束 |
|------|--------|---------|
| **JS** | Web 前端、快速原型、Playground、Node CLI、全栈 | GC 托管，effect 通过 evidence passing + try/catch |
| **LLVM** | 桌面/服务端、系统级性能 | 完整控制栈和内存，Perceus RC，delimited continuation 可行 |

### 已排除的后端

- **WasmGC**：JS 后端的卖点不是性能，Web 端追求 ~2x 性能提升投入产出比不合理。如果未来有真实需求再重新评估。
- **QBE(Ring)**：编译器自包含是终极愿景但优先级极低，不主动规划。

### 核心张力

**1. Effect 实现分歧**

两个后端实现 effect 的机制不同：
- JS：evidence passing → 普通函数参数 + try/catch（当前方案）
- LLVM：evidence passing + delimited continuation（full AE 所需）

同一套 effect 语义在不同后端可能有不同的能力边界——例如 multi-resume 在 JS 后端可能无法高效实现（无法捕获栈段），但在 LLVM 后端可以。**是否允许后端间的 feature gap？** 如果允许，需要编译期按目标后端检查 effect 使用是否合法。

**2. 标准库 runtime 分裂**

当前标准库（`std/*.ring`）的底层实现全是 JS（`extern type List<T>` = JS Array）。LLVM 后端需要自己的 runtime 实现：
- JS runtime：当前的 `runtime.ring` 产出
- LLVM runtime：需要 C/Ring 实现的 List/Map/Set/Str + GC 或 RC

**应对策略**：
- 标准库**接口**（方法签名 + 语义契约）由 `std/*.ring` 定义，是跨后端的 single source of truth
- 每个后端提供自己的 runtime 实现，通过 **同一套 E2E 测试** 验证语义一致性
- 用 Ring 自身实现尽可能多的标准库逻辑（纯 Ring 代码自动适配所有后端），仅将最底层原语（内存分配、IO syscall）作为后端特定的 `extern fn`

**3. FFI 表面积分裂**

两个后端面对不同的外部世界：
- JS：`extern fn` → JS 函数，`extern type` → JS 对象
- LLVM：`extern fn` → C ABI 函数，`extern type` → C struct

使用 FFI 的 Ring 库绑定到特定后端。需要条件编译机制（`#[backend(js)]`）或 FFI 抽象层。

**4. Codegen 架构**

当前 codegen 是单体 JS 代码生成。引入 LLVM 后端需要：
- 共享的 HIR → 后端无关优化 pass（常量折叠、死代码消除、内联）
- 后端特定的 lowering：HIR → JS / HIR → LLVM IR
- **接口设计**：codegen 应抽象为 trait/接口，各后端实现。当前的 `codegen*.ring` 文件需要重构为 JS 后端的具体实现

### 引入时机

1. **Phase B-C**：JS 后端稳定，语言特性完善（Refinement types + Linear types）
2. **Phase C-D**：LLVM 后端（需要 Linear types + Perceus RC 作为前置）

引入 LLVM 前必须先完成 codegen 接口抽象化（从当前 JS 单体中提取共享 HIR 优化 pass）。**第二个后端是最痛的**——它迫使所有"隐式假设 JS"的代码显式化。

## 已取消特性

### `or` 兜底表达式
design.md 2.3 层级 1。已被 Option 方法（`unwrap_or` / `unwrap_or_else`）取代，不再实现。

### Full Algebraic Effects（B-009）
Post-resume handler + multi-resume。取消原因：tail-resumptive + abort 覆盖 95%+ 实际需求，剩余用例用 async effect + defer 解决更好。实现复杂度（delimited continuation + 资源安全）与工程价值不成比例。

---

> 本文档随 Phase 推进更新。每个 Phase 启动时，从此处挑选特性进入该 Phase 的 spec。
