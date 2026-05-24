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
- ~~B-010 `delegate` 关键字 [M]~~ ✅ 已完成（2026-05-23）

**设计验证（Stabilize 前置，阻塞层 3）**：
- B-042 Perceus 循环引用策略 [M]（阻塞 B-012）
- ~~B-043 Refinement × Linear × Effects 交互矩阵 [M]~~ ✅ 已完成（2026-05-24）
- ~~B-044 Ring 语义规范 [M]~~ ✅ 已完成（2026-05-24）

**关键路径（2026-05-24 更新）**：
- B-004 → B-036 → B-011 LLVM（关联类型 → Iterator → LLVM 基础后端）
- B-004/B-036 阻塞 LLVM 原因：编译器自身需要这些语法糖
- Linear types 不阻塞基础 LLVM，是 Perceus RC 的前置
- B-042 与关键路径并行，阻塞 B-012 Perceus 但不阻塞 LLVM 基础
- B-033 GADTs 移出层 2，推迟至 LLVM 之后（无下游依赖，非编译器自举需求）
- 层 3（Refinement/Linear/async）在 LLVM 基础后端可用后启动
- **LLVM 落地后 JS 后端废弃**

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
- **交互规则（B-043 决策）**：refinement 是值级谓词，不允许引用可变绑定；跨 effect/await 边界恒成立；handler resume 值须满足 refinement 约束；`mut` 参数带 refinement 时每次赋值重新验证（SSA 流分析，复杂度归入本 item）。详见 design.md 1.5

### B-002 Ownership + Drop（Rust 风格 RAII，无 borrow checker）[feature] [P2] [XL] [queued]
Rust 的所有权模型减去 borrow checker。编译器做数据流分析追踪值的所有权，确保 Drop 恰好执行一次。

**模型**：
- 所有值 scope 结束自动 drop（RAII，正常路径 + abort 路径均自动）
- Move 语义：赋值/传参 = move，move 后原变量不可用
- `impl Drop` 的类型禁止 `impl Clone`（编译器拒绝，资源不可复制）
- `drop(x)` 提前释放，`leak(x)` 显式逃逸（不触发 Drop）
- `mut self` 方法 = 隐式借用（不消耗所有权）
- 共享访问 → `Rc<T>`（Ring 等价物），Rc 可 Clone，内部资源 Drop 在 Rc 归零时触发
- 无 `linear` 关键字——`impl Drop` 是唯一的 ownership 入口
- 容器持有 Drop 类型值 → 容器 Drop 自动 drop 所有元素，容器自身不因此获得 Drop 约束

**LLM 友好性**：本质是 Rust move/drop/RAII 语义，LLM 从 Rust 训练数据天然理解。自动浮现路径：LLM 正常写代码 → move 后使用原变量 → 编译器报 "value moved" → LLM 修。无新概念。

- **前置依赖**：`mut<S>` 稳定
- **复杂度**：大（ownership checker + Perceus RC 的前置条件）
- **优先级**：Phase C 与 refinement 穿插
- **交互规则（B-043 决策）**：RAII 模型——Drop 值在 abort/cancel 路径自动释放；Drop::drop 禁止 fail effect（允许 io）；spawn 为 move 语义，不可跨任务共享 Drop 值；`mut self` 调用 = 隐式借用（不消耗）。详见 design.md 1.5

### B-003 Dependent Types Lite [feature] [P3] [XL] [queued]
design.md 1.3。类型可依赖特定值（`Vec<T, n: Nat>`），不要求完整依赖类型证明。

- **前置依赖**：Refinement types
- **复杂度**：极大（约束求解可能不可判定）
- **优先级**：Phase D（研究向）

### B-004 关联类型（Associated Types）[feature] [P1] [L] [queued]
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

**前置依赖**：B-005 (Supertrait) ✅ 已完成

#### 涉及修改（详细实现 spec）

##### 1. AST（`ast.ring`）

**1a. 新增 `Decl::AssocType` 变体**（~L269，Decl enum 内）：
```ring
AssocType {
    name: Str,
    bounds: List<TypeBound>,   // type Iter: Iterator<T> + Clone
    value: TypeExpr?,          // trait 中 none（或 some 表示默认值），impl 中 some（必填）
    is_pub: Bool,
    span: Span
}
```
`Decl::Trait.methods` 和 `Decl::Impl.methods` 的 `List<Decl>` 将包含此变体（与 `Decl::Fn` 混排）。

**1b. 扩展 `TypeBound` struct**（L220-224）：
```ring
pub struct TypeBound {
    pub trait_name: Str,
    pub type_args: List<TypeExpr>,
    pub assoc_constraints: List<AssocConstraint>,  // 新增
    pub span: Span
}
```
新增 struct：
```ring
pub struct AssocConstraint {
    pub name: Str,       // "Item"
    pub ty: TypeExpr,    // Int
    pub span: Span
}
```
支持 `Iterator<Item = Int>` 语法。现有 `TypeBound` 的所有构造点需补 `assoc_constraints: []`。

##### 2. Parser（`parser.ring`）

**2a. 新增 `parse_assoc_type_decl(is_pub: Bool) -> Decl`**：
- 消费 `type` identifier（`advance()`，当前 token 已确认是 `TkIdent` 且 `value == "type"`）
- 读 name（`expect(TkIdent)`）
- 可选 bounds：若 peek 是 `:`，消费后解析 `TypeBound` 列表（用 `+` 分隔，复用 supertrait 解析逻辑）
- 可选 value：若 peek 是 `=`，消费后调 `parse_type_expr()`
- 返回 `Decl::AssocType { name, bounds, value, is_pub, span }`

**2b. 修改 `parse_trait_decl`**（~L1206-1209，body while 循环）：
```
// 现有：try_consume(TkPub) → parse_fn_decl(m_pub, true)
// 改为：
try_consume(TkPub)
if check(TkIdent) && peek().value == "type" {
    parse_assoc_type_decl(m_pub)
} else {
    parse_fn_decl(m_pub, true)
}
```

**2c. 修改 `parse_impl_decl`**（~L1094-1118，body while 循环）：
在 delegate 分支之后、`parse_fn_decl` 之前，加 `type` 检测分支（同上逻辑）。

**2d. 修改 type bound 内的 type arg 解析**：
在解析 `<...>` 内容时（`parse_type_args` 或等效函数），若遇到 `TkIdent + TkAssign`（即 `Name =`），解析为 `AssocConstraint { name, ty }`；否则解析为普通 `TypeExpr` 位置参数。需确定解析 type arg list 的具体函数位置并修改。

##### 3. 环境（`env.ring`）

**3a. 新增 `AssocTypeDef` struct**：
```ring
pub struct AssocTypeDef {
    pub name: Str,
    pub bounds: List<Str>,    // trait name bounds（"Iterator" 等）
    pub default_type: Type?   // trait 中的默认值
}
```

**3b. 扩展 `TraitDef`**（L69-75）：新增字段 `assoc_types: List<AssocTypeDef>`

**3c. 扩展 `ImplEntry`**（L77-82）：新增字段 `assoc_types: Map<Str, Type>`（name → 具体类型）

##### 4. HIR（`hir.ring`）

**4a. 新增 `HAssocType` struct**：
```ring
pub struct HAssocType {
    pub name: Str,
    pub bounds: List<Str>,
    pub concrete: Type?    // impl 中的具体类型；trait 声明中为 none 或 default
}
```

**4b. 扩展 `HDecl::Trait`**（~L160）：新增字段 `assoc_types: List<HAssocType>`

**4c. 扩展 `HDecl::Impl`**（~L157）：新增字段 `assoc_types: List<HAssocType>`

##### 5. 错误码（`codes.ring`）

新增 E05xx 系列（trait 域）：
- `E0510`：`Missing associated type implementation`（impl 未提供 trait 要求的关联类型）
- `E0511`：`Unknown associated type`（`T::Foo` 但 T 的 bounds 中无 `Foo` 关联类型）
- `E0512`：`Ambiguous associated type`（多个 trait bound 提供同名关联类型）
- `E0513`：`Associated type bound not satisfied`（`type Iter: Iterator` 但赋值类型未 impl Iterator）
- `E0514`：`Unexpected associated type`（impl 中提供了 trait 未声明的关联类型）

##### 6. 注册（`infer_register.ring`）

**6a. `register_trait`**（L549-628）：
- 在方法循环（~L600）中增加 `Decl::AssocType` 分支
- 收集到临时 list：`assoc_type_defs: List<AssocTypeDef>`
- 对每个关联类型，为其名字创建一个 fresh type variable 并注入 `type_param_scope`（使得 trait 方法签名中的裸 `Item` 引用可解析为该变量）
- 构造 `TraitDef` 时传入 `assoc_types`

**6b. `register_impl`**（L634-730）：
- 在方法循环（~L669）中增加 `Decl::AssocType` 分支
- 解析 `value` TypeExpr 为具体 Type
- 存入 `assoc_type_map: Map<Str, Type>`
- 在完整性验证（~L726 附近）中增加：
  - 检查 trait 声明的每个关联类型在 impl 中都有赋值（或 trait 提供了 default）→ 缺失报 E0510
  - 检查 impl 中没有多余的关联类型 → 多余报 E0514
  - 检查 bounds 满足：若 trait 声明 `type Iter: Iterator<T>`，验证 impl 中 `type Iter = Range` 的 Range 已 impl Iterator → 不满足报 E0513
- 构造 `ImplEntry` 时传入 `assoc_types`

**6c. trait 方法签名中的裸名引用**：
在 `register_trait` 注入 assoc type 的 fresh type variable 到 `type_param_scope` 后，trait 方法签名中 `fn next(mut self) -> Item?` 的 `Item` 会被 `resolve_named_type` 解析为该变量（因为 `type_param_scope` 中有 `"Item" → var_id`）。这依赖于 `resolve_named_type` 对 `type_param_scope` 的查找优先于 struct/enum 查找——验证确认如此。

##### 7. 类型路径解析（`infer_ctx.ring`）

**7a. 修改 `resolve_type_expr`**（~L727-756，`TypeExpr::Named` + `qualifier: some(q)` 分支）：

在现有的模块路径查找之前，插入关联类型检测：
```
if qualifier == some(q) {
    // 新增：检查 q 是否是当前 type_param_scope 中的类型参数
    if type_param_scope.contains(q) {
        // q 是类型参数，name 是关联类型名
        return resolve_assoc_type(q, name, span)
    }
    // 现有：self::/super:: 相对路径 + 模块路径查找
    ...
}
```

**7b. 新增 `resolve_assoc_type(type_param_name: Str, assoc_name: Str, span: Span) -> Type`**：
1. 获取 type_param 的 bounds（从当前 `scheme_bounds` 或 `fn_bounds_list` 中查找）
2. 遍历 bounds，查找每个 bound trait 的 `TraitDef.assoc_types` 中是否有 `assoc_name`
3. 同时遍历 supertrait（递归），supertrait 的关联类型也可通过 `T::SuperItem` 访问
4. 找到 0 个 → 报 E0511
5. 找到 1 个 → 返回对应的 fresh type variable（或在具体化上下文中直接返回具体类型）
6. 找到多个 → 报 E0512

**7c. 具体化上下文中的解析**：
当 `T` 已经被 instantiate 为具体类型（如 `Range`），`T::Item` 应解析为 `Range` 对应 trait impl 的 assoc type 具体值。这在 `instantiate_scheme` 或调用点的 type arg 替换中处理：将 assoc type 的 type variable 替换为 impl 中注册的具体类型。

##### 8. Bound 约束传播（`infer.ring` / `infer_ctx.ring`）

**8a. `Iterator<Item = Int>` 约束**：
在 trait bound 处理中（instantiate trait bound 时），遍历 `TypeBound.assoc_constraints`，对每个 `AssocConstraint { name, ty }`：
1. 查找 trait 的 `assoc_types` 中对应 `name` 的 type variable
2. 用 `unify()` 将该 variable 与 `ty` 解析后的类型统一
3. 找不到 → 报 E0511

**8b. `where I::Item == Int` 语法**：
这是 `T::Item` 路径解析（7a）+ `==` unification 的组合。Parser 中 `where` 子句已有 tokenize 但丢弃行为（当前 refinement where 解析消费后丢弃）。若要支持此语法需修改 where clause 解析——**此次不实现**，`Iterator<Item = Int>` in-bound 语法已覆盖主要用例。

##### 9. 声明检查（`infer_decl.ring`）

**9a. `check_trait_decl`**（check_one_decl 中的 Trait 分支）：
- 对 trait 的 `Decl::AssocType` 项，构造 `HAssocType { name, bounds, concrete: default_type }`
- 加入 `HDecl::Trait.assoc_types`

**9b. `check_impl_decl`**（check_one_decl 中的 Impl 分支）：
- 对 impl 的 `Decl::AssocType` 项，检查 value 不为 none（impl 中必须提供具体类型）
- 将 assoc type 的 type variable 与具体类型 unify（使得 impl 方法签名中引用的 `Item` 解析为具体类型）
- 构造 `HAssocType { name, bounds: [], concrete: some(concrete_type) }`
- 加入 `HDecl::Impl.assoc_types`

**9c. Delegate expansion**（`expand_delegate_impls`）：
- 当 delegate 的 target trait 有关联类型时：
- 从 inner 字段类型的对应 trait impl 中查找 assoc type 具体值
- 自动生成 `HAssocType` 条目加入合成的 impl

##### 10. Codegen（`codegen_decl.ring`）

**10a. `emit_trait_dictionary`**（~L199-254）：
- 遍历 impl methods 时跳过 `HDecl::AssocType`（关联类型不入 dict）
- 无运行时代码生成

**10b. 所有 `match decl` 分支**：
`Decl::AssocType` 是新 variant，编译器穷尽性检查会强制处理。在以下文件的 match 中增加分支：
- `codegen.ring`、`codegen_decl.ring`、`codegen_stmt.ring`（emit 时跳过或 panic "unreachable"）
- `exports.ring`（`extract_exports` 中，pub assoc type 不导出为独立符号）
- `checker.ring`（如有 Decl match）
- `resolver.ring`（如有 Decl match）

**10c. `HAssocType` 在 HIR match 中**：
- `zonk.ring`：zonk HDecl::Trait/Impl 时处理新的 `assoc_types` 字段
- `codegen_decl.ring`：emit trait/impl 时跳过 assoc type 条目

##### 11. 测试

**正面测试**（`tests/cases/`）：
- `assoc_type_basic.ring`：trait 声明 + impl 赋值 + 方法使用 `Item` 返回类型
- `assoc_type_bound.ring`：`type Iter: Iterator<T>` 带 bound 的关联类型
- `assoc_type_constraint.ring`：`fn foo<T: Trait<Item = Int>>()` 约束语法
- `assoc_type_qualified.ring`：`T::Item` 限定路径在函数体内使用
- `assoc_type_supertrait.ring`：通过 subtrait bound 访问 supertrait 的关联类型
- `assoc_type_delegate.ring`：delegate 自动继承关联类型绑定
- `assoc_type_default.ring`：trait 中提供默认关联类型 `type Item = Int`，impl 可省略

**负面测试**（期望编译错误）：
- `error_assoc_type_missing.ring`：impl 缺少关联类型赋值 → E0510
- `error_assoc_type_unknown.ring`：`T::Foo` 但无关联类型 Foo → E0511
- `error_assoc_type_ambiguous.ring`：多 trait 同名关联类型 → E0512
- `error_assoc_type_bound.ring`：赋值类型不满足 bound → E0513

**验收标准**：
- `trait Foo { type Item }` + `impl Foo for Bar { type Item = Int }` 可编译
- `T::Item` 在泛型函数体内解析为关联类型
- `fn foo<T: Iterator<Item = Int>>()` 约束语法生效
- 关联类型带 bound：`type Iter: Iterator<T>` → impl 中 `type Iter = X`，X 未 impl Iterator → 报 E0513
- 未提供关联类型赋值 → E0510
- 同名歧义（多 trait 提供同名关联类型）→ E0512
- `T: SubTrait` 约束下 `T::SuperItem`（supertrait 关联类型）可用
- `delegate inner: TraitWithAssocType` 自动继承关联类型绑定
- trait body 中裸名 `Item` 引用正确解析
- `where I::Item == Int` 语法本次不实现（in-bound 语法 `Iterator<Item = Int>` 已覆盖）
- 全部 E2E 测试通过
- 自举编译器正常编译自身


### B-033 GADTs（Generalized Algebraic Data Types）[feature] [P3] [L] [queued]
> 2026-05-24 从层 2 移出：无下游依赖，编译器自身不需要，推迟至 LLVM 之后。
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

**交互规则（design.md 1.5）**：
- GADTs × Or-Pattern：or-pattern 合并的 GADT 变体必须携带兼容的类型等式，不兼容则编译错误
- GADTs × Effects：正交，无需特殊规则（scoped type equality 是编译期，evidence 是运行时）

**验收标准**：
- `enum Expr<T> { Lit(Int): Expr<Int> }` 语法可解析
- match 分支内类型等式自动生效——`eval` 函数可类型检查通过
- 无返回类型约束的 enum 变体行为不变（向后兼容）
- 类型约束与 enum 类型不匹配 → 编译错误（如 `Foo(Int): Bar<Int>`）
- 分支约束不泄漏到分支外
- 穷尽性检查对 GADT enum 正常工作
- or-pattern 合并不兼容 GADT 约束的变体 → 编译错误
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

### B-011 LLVM Native Backend [feature] [P1] [XL] [queued]
编译到 LLVM IR，所有后续优化的基础。**LLVM 落地后 JS 后端废弃。**

- **前置依赖**：B-004（关联类型）+ B-036（Iterator）——编译器自身需要这些语法糖。~~B-044 语义规范~~ ✅ 已完成
- **不阻塞基础 LLVM**：Linear types / Perceus RC（后续增量添加）
- **FFI 边界 effect 设计**：
  1. Evidence 传递：LLVM 端用 TLS handler stack，C 函数无需感知
  2. Effect-free 函数保证干净 C ABI，零成本互调
  3. 跨语言资源安全：Linear types + `defer` 清理 FFI 资源（Perceus RC 阶段实现）

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


## 架构改进


## 语法增强

### B-051 Or-Pattern（模式匹配 or 分支）[feature] [P2] [M] [queued]
match arm 支持 `|` 合并多个模式，消除重复分支。

```ring
match shape {
    Circle { r } | Ellipse { r, .. } => calc_area(r),
    Rect { w, h } | Square { w, h } => w * h,
}

// 也支持 enum 变体合并：
match opt {
    Some(x) | Ok(x) => process(x),   // 要求绑定变量名和类型一致
    None | Err(_) => default(),
}
```

**动机**：审计发现编译器自身（infer.ring）至少 5 处存在 StructType/EnumType 分支逻辑完全相同的 match arm（每处 10-25 行重复），属语言限制导致的系统性问题。Or-pattern 实现后可批量消除。

**涉及修改**：
1. `ast.ring`：`Pattern` 新增 `OrPattern { patterns: List<Pattern>, span }` 变体
2. `parser.ring`：match arm 的 pattern 位置识别 `|` token，收集多个 pattern
3. `infer.ring`：推断 or-pattern 时，验证每个分支绑定相同的变量名集合且类型一致
4. `exhaustive.ring`：穷尽性检查支持 or-pattern（展开为独立行）
5. `codegen_stmt.ring`：or-pattern 生成多条件 `||` 链，bindings 取自首个匹配分支

**交互规则（design.md 1.5）**：
- Or-Pattern × GADTs：合并的 GADT 变体必须携带兼容的类型等式，不兼容则编译错误（如 `Lit(n) | IsZero(e)` 中 T=Int vs T=Bool 冲突）

**验收标准**：
- `A | B => expr` 语法可解析、可编译
- 绑定变量名不一致 → 编译错误
- 绑定变量类型不一致 → 编译错误
- GADT 变体合并时类型等式不兼容 → 编译错误
- 穷尽性检查正确处理 or-pattern
- 编译器自身可使用 or-pattern 消除重复分支
- 全部 E2E 测试通过
- 自举编译器正常编译自身

## 已知 Bug / 技术债

### B-052 `mod requires` 内纯函数被保守拒绝 [bugfix] [P3] [S] [queued]
`check_effects_capability`（`infer_decl.ring`）对任何 open tail 的 effect row 报 E0408，导致 `mod requires {io}` 内无法定义未标注 effect 的纯函数。应仅对实际携带 capability 外 effect 的函数拒绝，纯函数（空 effect row）应放行。

**涉及修改**：
1. `infer_decl.ring`：`check_effects_capability` 在检查前先 zonk effect row，区分 "open but empty"（纯函数）和 "open with concrete effects"

**验收标准**：
- `mod requires {io}` 内定义纯函数 `fn id(x: Int) -> Int { x }` 编译通过
- 携带 capability 外 effect 的函数仍报 E0408
- 全部 E2E 测试通过

### B-053 Debug derive 对 FnType 输出改为 `"<fn>"` [bugfix] [P3] [S] [queued]
`derive.ring` 对函数类型字段使用 `FieldAction::Identity`，codegen 生成 `String(expr)` 导致输出整个函数源码。应改为固定字符串 `"<fn>"`。

**涉及修改**：
1. `derive.ring` 或 `codegen_derive.ring`：FnType 字段的 Debug 输出改为 `"<fn>"` 字面量

**验收标准**：
- 含函数字段的 struct Debug 输出显示 `<fn>` 而非函数源码
- 全部 E2E 测试通过

### B-054 Parser expression-level 错误恢复 [feature] [P3] [M] [queued]
Parser 有声明级错误恢复，但 `handle...with` 等复合表达式无恢复机制，单个 malformed 表达式会 poison 整个声明的解析。

**涉及修改**：
1. `parser.ring`：在 `handle`/`match`/`if` 等复合表达式解析失败时，尝试跳到 `}`/`)` 等闭合 token 恢复

**验收标准**：
- malformed `handle` 表达式不阻止后续声明的解析
- 错误报告质量不下降
- 全部 E2E 测试通过

### B-055 Match 表达式统一 labeled block 替代 IIFE [refactor] [P3] [S] [queued]
不含 `return` 的 match 表达式用 IIFE `(function() { ... })()`，含 `return` 的已用 labeled block + temp variable。统一为后者，避免闭包分配。

**涉及修改**：
1. `codegen_stmt.ring` / `codegen_expr.ring`：match 表达式统一使用 `__ring_blkN` temp variable 方案

**验收标准**：
- 生成的 JS 中 match 表达式不再出现 IIFE
- 全部 E2E 测试通过
- 自举编译器正常编译自身

### B-056 闭包捕获 `let mut` 变量时注入 `mut<T>` effect [feature] [P3] [M] [queued]
B-048 遗留。闭包捕获 `let mut` 变量时，应在闭包签名注入 `mut<T>` effect，使 effect 追踪完整。核心的 local effect cancellation 已在 B-048 完成。

**涉及修改**：
1. `infer.ring`：lambda 推断时分析捕获列表，对捕获的 `let mut` 变量注入 `mut<T>` effect

**验收标准**：
- 闭包捕获 `let mut` 变量 → 闭包类型携带 `mut<T>` effect
- 闭包内修改捕获的 mut 变量 → `mut` effect 正确传播到调用者
- local cancellation 规则仍生效（局部变量 mutation 不传播）
- 全部 E2E 测试通过

### B-057 occurs check + apply_subst fields 遍历互锁修复 [bugfix] [P3] [M] [queued]
`occurs_in`（`unify.ring`）不检查 StructType/EnumType 的 fields/variants 中的类型；`apply_subst`（#45）同样不替换 fields 中的类型。两者互锁——当前安全但不完备。需同时修复。

**涉及修改**：
1. `unify.ring`：`occurs_in` 递归检查 fields/variants 中的类型
2. `unify.ring`：`apply_subst` 递归替换 fields/variants 中的类型

**验收标准**：
- 涉及 struct/enum 字段类型变量的统一场景正确处理
- 不引入无限类型（occurs check 正确拒绝）
- 全部 E2E 测试通过
- 自举编译器正常编译自身


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
