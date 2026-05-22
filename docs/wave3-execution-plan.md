# Wave 3 并行执行计划

> 基于 phase-b-spec.md Wave 3 + 前置条件修复
> Main HEAD: `953d246`（P2 完成后）
> 测试基线: 487/487

## 执行进度 (2026-05-22)

| Wave | 任务 | 状态 | 测试 | 备注 |
|------|------|------|------|------|
| A | M5 (capability 限制) | ✅ 完成 | 469 | worktree agent 完成 |
| A | P1 (fn type effect 标注) | ✅ 完成 | 485 | worktree 失败，直接在 main 实现 |
| B | P2 (impl bounds) | ✅ 完成 | 487 | 直接在 main 实现。已知 bug #72：bounded impl 方法跨类型调用冲突 |
| B | S2 (HOF 迁移) | ⏳ 待做 | — | 下个 session |
| C | S3 (Eq trait 约束迁移) | ⏳ 待做 | — | 依赖 P2 ✅ |

## 总览

| Wave | 任务 | Worktrees | 预计难度 |
|------|------|-----------|----------|
| A | P1 (fn type effect 标注) + M5 (capability 限制) | 2 并行 | 中 + 中 |
| B | S2 (HOF 迁移) + P2 (impl bounds) | 2 并行 | 大 + 中 |
| C | S3 (Eq trait 约束迁移) | 1 | 中大 |

文件冲突分析：
- Wave A：P1 与 M5 仅在 parser.ring / ast.ring 轻微重叠（不同函数区域），可安全并行
- Wave B：S2 与 P2 零文件重叠，安全并行
- Wave C：S3 依赖 Wave B 的 P2（impl bounds），必须等 Wave B 完成

---

## Wave A-1: P1 — fn 类型表达式 effect 标注

### 目标

使函数类型表达式支持 `with {effects}` 语法，如 `fn(T) -> U with {e}`。这是 S2 (HOF 迁移) 的前置条件——HOF 方法的 callback 参数需要能声明 effect 多态。

### 当前状态

- `TypeExpr::FnType`（ast.ring）：只有 `params: List<TypeExpr>` 和 `return_type: TypeExpr?`，**没有 effects 字段**
- `parse_fn_type_expr`（parser.ring）：解析 `fn(T) -> U` 但不处理 `with {effects}`
- `resolve_type_expr`（infer_ctx.ring）：对 FnType 硬编码 `effects: EMPTY_ROW`
- 函数**声明**的 `with {effects}` 已实现（F1），但函数**类型表达式**不支持

### 实现步骤

#### 1. ast.ring — FnType 加 effects 字段

找到 `TypeExpr` enum 中的 `FnType` variant，添加 effects 字段：

```ring
// 之前
FnType { params: List<TypeExpr>, return_type: TypeExpr?, span: Span },

// 之后
FnType { params: List<TypeExpr>, return_type: TypeExpr?, effects: List<EffectExpr>, span: Span },
```

注意：`effects: List<EffectExpr>` 用空列表 `[]` 表示无标注（等价于 EMPTY_ROW 或 open row，由 checker 决定）。

所有构造 `TypeExpr::FnType` 的地方需更新（加 `effects: []`）。

#### 2. parser.ring — parse_fn_type_expr 支持 with

找到 `parse_fn_type_expr`（解析 `fn(T, U) -> V` 的函数），在返回类型之后添加 effect 解析：

```ring
// 在 parse 完返回类型后
var effects: List<EffectExpr> = []
if self.check(TokenKind::TkWith) {
    effects = self.parse_effect_annotation()
}
```

`parse_effect_annotation()` 已存在（F1 实现），直接复用。返回 `List<EffectExpr>`。

#### 3. infer_ctx.ring — resolve_type_expr 处理 effects

找到 `resolve_type_expr` 函数中处理 `TypeExpr::FnType` 的分支。当前硬编码 `EMPTY_ROW`：

```ring
TypeExpr::FnType { params, return_type, .. } => {
    // ...
    Type::FnType { params: resolved_params, return_type: ret, effects: EMPTY_ROW }
}
```

改为：如果有 effect 标注，resolve 为实际的 EffectRow；如果无标注，使用 open row（fresh tail variable）以支持 effect 多态：

```ring
TypeExpr::FnType { params, return_type, effects, .. } => {
    let resolved_params = params.map(fn(p) { resolve_type_expr(ctx, p) })
    let ret = match return_type {
        some(r) => resolve_type_expr(ctx, r),
        none => UNIT
    }
    let eff_row = if effects.len() > 0 {
        // 有显式标注：resolve 每个 effect
        let resolved_effects = effects.map(fn(e) { resolve_effect_expr(ctx, e) })
        EffectRow { effects: resolved_effects, tail: none }
    } else {
        // 无标注：open row（用于 effect 多态）
        let tail_id = ctx.env.fresh_var_id()
        EffectRow { effects: [], tail: some(tail_id) }
    }
    Type::FnType { params: resolved_params, return_type: ret, effects: eff_row }
}
```

注意：需要从 `infer_register.ring` 导入 `resolve_effect_expr`。如果这个函数不是 pub 的，需要先将它改为 pub。

#### 4. 穷尽性检查

grep 所有 `TypeExpr::FnType` 的 match，确保加了 `effects` 字段或用 `..`。

#### 5. 测试

新增 `tests/cases/fn_type_effect.ring`：

```ring
// 函数类型参数带 effect 标注
fn apply_with_io(f: fn(Int) -> Str with {io}) -> Str with {io} {
    f(42)
}

fn int_to_str(x: Int) -> Str with {io} {
    print("converting")
    x.to_str()
}

fn main() {
    let result = apply_with_io(int_to_str)
    assert(result == "42", "fn type effect annotation")
    print("fn_type_effect: all tests passed")
}
```

新增 `tests/cases/fn_type_effect_poly.ring`（effect 多态）：

```ring
// effect-polymorphic callback
fn transform<T, U>(items: List<T>, f: fn(T) -> U) -> List<U> {
    var result: List<U> = []
    for item in items {
        result.push(f(item))
    }
    result
}

fn main() {
    let nums = [1, 2, 3]
    let strs = transform(nums, fn(x) { x.to_str() })
    assert(strs.len() == 3, "transform length")
    assert(strs.get(0).unwrap() == "1", "transform first")
    print("fn_type_effect_poly: all tests passed")
}
```

#### 6. 编译验证

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

### 触碰文件清单

| 文件 | 改动类型 |
|------|---------|
| compiler/ast.ring | TypeExpr::FnType 加 effects 字段 |
| compiler/parser.ring | parse_fn_type_expr 加 with 解析 |
| compiler/infer_ctx.ring | resolve_type_expr FnType 分支处理 effects |
| compiler/infer_register.ring | resolve_effect_expr 改为 pub（如需要） |
| tests/cases/fn_type_effect.ring | 新增正面测试 |
| tests/cases/fn_type_effect_poly.ring | 新增正面测试 |
| tests/e2e.test.ts | 注册新测试 |

---

## Wave A-2: M5 — Capability 限制

### 目标

支持 `mod name requires {effects} { ... }` 语法，声明 mod 块允许使用的 effect 集合。mod 内的函数推断出的 effect 必须是 requires 集合的子集。

### 当前状态

- `Decl::ModBlock`（ast.ring）：`{ name, uses, decls, is_pub, span }`，无 requires 字段
- `parse_mod_block`（parser.ring:651）：解析 `mod name { ... }`，不支持 requires
- `check_mod_decl`（infer_decl.ring:61）：push/pop mod_path_stack，不做 effect 约束检查
- `TkWith` 已存在（用于 `with {effects}` 语法）
- effect 检查机制已在 `check_fn_decl` 中实现（E0404 错误码）

### 设计决策

- 使用 `requires` 关键字而非复用 `with`（语义不同：`with` 声明函数产生的 effect，`requires` 限制 mod 允许的 effect）
- 新增 `TkRequires` 关键字
- `requires {}` 表示纯模块（不允许任何 effect）
- 无 `requires` 子句表示不限制（向后兼容）
- 检查粒度：mod 内每个**函数声明**推断出的 effect 都必须是 requires 集合的子集

### 实现步骤

#### 1. lexer.ring — TkRequires 关键字

```ring
// TokenKind enum
TkRequires,

// keyword_lookup
"requires" => some(TokenKind::TkRequires),

// token_kind_value
TkRequires => "requires",
```

#### 2. ast.ring — ModBlock 加 required_effects

```ring
// 之前
ModBlock { name: Str, uses: List<UseDecl>, decls: List<Decl>, is_pub: Bool, span: Span }

// 之后
ModBlock { name: Str, uses: List<UseDecl>, decls: List<Decl>, required_effects: List<EffectExpr>?, is_pub: Bool, span: Span }
```

所有构造 `Decl::ModBlock` 的地方需更新（加 `required_effects: none`）。

#### 3. parser.ring — parse_mod_block 支持 requires

在 `parse_mod_block` 中，mod name 和 `{` 之间解析 requires 子句：

```ring
fn parse_mod_block(var self, is_pub: Bool) -> Decl {
    let start = self.current_span_start()
    self.expect(TokenKind::TkMod)
    let name = self.expect(TokenKind::TkIdent).value

    // 解析可选的 requires 子句
    var required_effects: List<EffectExpr>? = none
    if self.check(TokenKind::TkRequires) {
        self.advance()
        required_effects = some(self.parse_effect_annotation())
    }

    self.expect(TokenKind::TkLBrace)
    // ... 后续不变 ...
    Decl::ModBlock { name: name, uses: uses, decls: decls, required_effects: required_effects, is_pub: is_pub, span: ... }
}
```

`parse_effect_annotation()` 解析 `{ effect1, effect2, ... }` 并返回 `List<EffectExpr>`。

#### 4. codes.ring — 新增错误码

```ring
pub const E0405: Str = "E0405"

// error_description 中
if code == "E0405" { return "Capability violation" }
```

#### 5. infer_decl.ring — check_mod_decl 加 capability 检查

在 `check_mod_decl` 中，解析 `required_effects` 为 EffectRow，然后对每个检查过的子声明验证 effect：

```ring
fn check_mod_decl(var ctx: InferCtx, mod_name: Str, uses: List<UseDecl>, decls: List<Decl>, required_effects: List<EffectExpr>?, is_pub: Bool, span: Span) -> HDecl {
    ctx.mod_path_stack.push(mod_name)

    // 解析 capability 约束
    var cap_row: EffectRow? = none
    match required_effects {
        some(effects) => {
            let resolved = effects.map(fn(e) { resolve_effect_expr(ctx, e) })
            cap_row = some(EffectRow { effects: resolved, tail: none })
        },
        none => {}
    }

    // ... 现有逻辑（别名注册、use 解析）...

    var hdecls: List<HDecl> = []
    for decl in decls {
        let prefixed = prefix_decl_name(mod_name, decl)
        // 检查每个声明
        let checked = check_decl(ctx, prefixed)
        match checked {
            some(hd) => {
                // 如果有 capability 约束，验证函数的 effect
                match cap_row {
                    some(cap) => check_capability(ctx, hd, cap, span),
                    none => {}
                }
                hdecls.push(hd)
            },
            none => {}
        }
    }
    ctx.mod_path_stack.pop()
    HDecl::ModBlock { name: mod_name, decls: hdecls, is_pub: is_pub, span: span }
}
```

`check_capability` 辅助函数：对 HDecl::Fn 检查其 effects 是否是 cap_row 的子集：

```ring
fn check_capability(var ctx: InferCtx, decl: HDecl, cap: EffectRow, mod_span: Span) {
    match decl {
        HDecl::Fn { name, effects, span, .. } => {
            for eff in effects.effects {
                let kind = effect_kind_name(eff)
                let in_cap = cap.effects.any(fn(c) { effects_match_kind(eff, c) })
                if !in_cap {
                    let _ = type_error(ctx.sink, E0405,
                        "Function '${name}' uses effect '${kind}' which is not in the module's requires set",
                        span,
                        DiagnosticContext::OtherContext { detail: some("capability violation") })
                }
            }
        },
        _ => {}
    }
}
```

#### 6. 穷尽性

grep 所有 `Decl::ModBlock` 和 `ModBlock {` 的 match/构造，确保加了 `required_effects` 字段或用 `..`。重点：
- compiler/exports.ring
- compiler/compiler_mod.ring
- compiler/infer_register.ring（prefix_decl_name）
- compiler/parser.ring

#### 7. 测试

新增 `tests/cases/mod_capability.ring`：

```ring
mod pure_logic requires {} {
    pub fn add(a: Int, b: Int) -> Int { a + b }
    pub fn double(x: Int) -> Int { x + x }
}

mod io_layer requires {io} {
    pub fn greet(name: Str) -> Unit with {io} {
        print("Hello, ${name}!")
    }
}

fn main() {
    assert(pure_logic::add(1, 2) == 3, "pure mod add")
    assert(pure_logic::double(5) == 10, "pure mod double")
    io_layer::greet("world")
    print("mod_capability: all tests passed")
}
```

负面测试 `tests/cases/errors/mod_capability_violation.ring`：

```ring
// expect-error: E0405
mod pure requires {} {
    pub fn bad() -> Unit with {io} {
        print("this should fail")
    }
}
```

#### 8. 编译验证

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

### 触碰文件清单

| 文件 | 改动类型 |
|------|---------|
| compiler/lexer.ring | TkRequires 关键字 |
| compiler/ast.ring | ModBlock 加 required_effects 字段 |
| compiler/parser.ring | parse_mod_block 支持 requires |
| compiler/codes.ring | E0405 错误码 |
| compiler/infer_decl.ring | check_mod_decl capability 检查 |
| compiler/infer_register.ring | prefix_decl_name ModBlock 分支更新 |
| compiler/exports.ring | ModBlock match 更新（.. 通配已覆盖） |
| compiler/compiler_mod.ring | ModBlock match 更新（.. 通配已覆盖） |
| tests/cases/mod_capability.ring | 新增正面测试 |
| tests/cases/errors/mod_capability_violation.ring | 新增负面测试 |
| tests/e2e.test.ts | 注册新测试 |

---

## Wave B-1: S2 — HOF 方法迁移到标准库

### 目标

将 21 个 HOF 方法从编译器 builtins.ring 内置注册迁移到标准库 std/*.ring 的 Ring 原生实现。完成后移除 builtins.ring 中 ~291 行的 HOF 注册代码。

### 前置条件

Wave A-1 (P1) 必须完成——fn 类型表达式需要支持 `with {effects}` 以实现 effect 多态。

### 当前状态

- builtins.ring:556-847：4 个 `register_*_hof()` 函数注册 21 个 HOF 方法
- `open_row()` helper（builtins.ring:39-45）创建 open effect row 用于 effect 多态
- builtin_methods.ring：`LIST_HOF_METHODS`、`MAP_HOF_METHODS`、`SET_HOF_METHODS`、`OPTION_HOF_METHODS` 常量
- codegen.ring：对应的 HOF codegen 注册（`register_list_hof_codegen` 等）
- runtime.ring：对应的 JS runtime 实现

### 实现步骤

#### 1. std/list.ring — 添加 HOF impl 方法

在 std/list.ring 的现有 impl 块后面，添加新的 HOF impl 块。所有 HOF 方法需要 effect 多态的 callback：

```ring
impl<T> List {
    pub fn map<U>(self, f: fn(T) -> U) -> List<U> {
        var result: List<U> = []
        for item in self { result.push(f(item)) }
        result
    }

    pub fn filter(self, pred: fn(T) -> Bool) -> List<T> {
        var result: List<T> = []
        for item in self { if pred(item) { result.push(item) } }
        result
    }

    pub fn flat_map<U>(self, f: fn(T) -> List<U>) -> List<U> {
        var result: List<U> = []
        for item in self { result.extend(f(item)) }
        result
    }

    pub fn fold<U>(self, init: U, f: fn(U, T) -> U) -> U {
        var acc = init
        for item in self { acc = f(acc, item) }
        acc
    }

    pub fn any(self, pred: fn(T) -> Bool) -> Bool {
        for item in self { if pred(item) { return true } }
        false
    }

    pub fn all(self, pred: fn(T) -> Bool) -> Bool {
        for item in self { if !pred(item) { return false } }
        true
    }

    pub fn find(self, pred: fn(T) -> Bool) -> T? {
        for item in self { if pred(item) { return some(item) } }
        none
    }

    pub fn find_index(self, pred: fn(T) -> Bool) -> Int? {
        var i = 0
        for item in self {
            if pred(item) { return some(i) }
            i = i + 1
        }
        none
    }

    pub fn sort_by(self, cmp: fn(T, T) -> Int) -> List<T> {
        // 委托给 JS Array.sort（extern fn 已存在）
        let copy = self.slice(0, self.len())
        __list_sort_by(copy, cmp)
        copy
    }
}

extern fn __list_sort_by<T>(list: List<T>, cmp: fn(T, T) -> Int) -> Unit
```

注意：`sort_by` 需要保留 extern fn 因为 JS `Array.sort` 是原地操作且用 comparator。可以包装一个 Ring 函数调用 extern。

#### 2. std/map.ring — 添加 HOF impl 方法

```ring
impl<K, V> Map {
    pub fn map_values<U>(self, f: fn(V) -> U) -> Map<K, U> {
        let result: Map<K, U> = map_new()
        for entry in self.entries() {
            let (k, v) = entry
            result.insert(k, f(v))
        }
        result
    }

    pub fn filter(self, pred: fn(K, V) -> Bool) -> Map<K, V> {
        let result: Map<K, V> = map_new()
        for entry in self.entries() {
            let (k, v) = entry
            if pred(k, v) { result.insert(k, v) }
        }
        result
    }

    pub fn any(self, pred: fn(K, V) -> Bool) -> Bool {
        for entry in self.entries() {
            let (k, v) = entry
            if pred(k, v) { return true }
        }
        false
    }

    pub fn fold<U>(self, init: U, f: fn(U, K, V) -> U) -> U {
        var acc = init
        for entry in self.entries() {
            let (k, v) = entry
            acc = f(acc, k, v)
        }
        acc
    }
}
```

#### 3. std/set.ring — 添加 HOF impl 方法

```ring
impl<T> Set {
    pub fn filter(self, pred: fn(T) -> Bool) -> Set<T> {
        let result: Set<T> = set_new()
        for item in self.to_list() { if pred(item) { result.insert(item) } }
        result
    }

    pub fn fold<U>(self, init: U, f: fn(U, T) -> U) -> U {
        var acc = init
        for item in self.to_list() { acc = f(acc, item) }
        acc
    }

    pub fn any(self, pred: fn(T) -> Bool) -> Bool {
        for item in self.to_list() { if pred(item) { return true } }
        false
    }

    pub fn all(self, pred: fn(T) -> Bool) -> Bool {
        for item in self.to_list() { if !pred(item) { return false } }
        true
    }
}
```

#### 4. Option HOF 方法

Option HOF 方法（map, and_then, unwrap_or_else）需要检查是否已在标准库中。如果已在 builtins 中处理，同样迁移。

#### 5. builtins.ring — 移除 HOF 注册

移除以下函数及其调用：
- `register_list_hof()`（builtins.ring:556-672）
- `register_map_hof()`（builtins.ring:678-740）
- `register_set_hof()`（builtins.ring:746-798）
- `register_option_hof()`（builtins.ring:804-847）
- `open_row()` helper（builtins.ring:39-45）——如果只有 HOF 用它

同时移除对这些函数的调用（在 `register_builtins()` 中）。

#### 6. builtin_methods.ring — 更新常量

将 HOF 方法从 `*_HOF_METHODS` 常量中移除（或移到其他常量中，取决于 codegen 是否还需要区分）。

#### 7. codegen.ring — 移除 HOF codegen 注册

移除 `register_list_hof_codegen()` 等函数。对应的 codegen 逻辑改为编译 Ring 源码产出（load_prelude 编译 impl 方法后，codegen 通过标准的 impl method dispatch 处理）。

#### 8. runtime.ring — 移除 HOF JS 实现

移除 runtime 中对应的 JS HOF 实现函数。

#### 9. checker.ring — load_prelude 验证

确认 `load_prelude` 的 Phase 2 能正确编译新增的 HOF impl 方法。已有的 Result.ring HOF 方法（map/and_then）证明此机制可行。

#### 10. 测试

现有 HOF 测试（list_hof.ring, list_fold.ring, list_flat_map.ring, map_hof.ring, set_hof.ring, list_hof_effect.ring）应全部继续通过——行为不变，只是实现从 JS 内置切换到 Ring 原生。

新增 `tests/cases/hof_effect_propagation.ring` 测试 effect 从 callback 传播：

```ring
fn effectful_map() -> List<Str> with {io} {
    let nums = [1, 2, 3]
    nums.map(fn(x) {
        print("processing ${x.to_str()}")
        x.to_str()
    })
}

fn main() {
    let result = effectful_map()
    assert(result.len() == 3, "HOF effect propagation")
    print("hof_effect_propagation: all tests passed")
}
```

#### 11. 编译验证

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

### 触碰文件清单

| 文件 | 改动类型 |
|------|---------|
| std/list.ring | 新增 9 个 HOF impl 方法 |
| std/map.ring | 新增 4 个 HOF impl 方法 |
| std/set.ring | 新增 4 个 HOF impl 方法 |
| compiler/builtins.ring | 移除 ~291 行 HOF 注册代码 |
| compiler/builtin_methods.ring | 更新 HOF 方法常量 |
| compiler/codegen.ring | 移除 HOF codegen 注册 |
| compiler/runtime.ring | 移除 HOF JS 实现 |
| tests/cases/hof_effect_propagation.ring | 新增测试 |
| tests/e2e.test.ts | 注册新测试 |

### 已知风险

1. **Effect 多态**：迁移后的 HOF 方法需要 P1（fn type effect 标注）正确工作才能保持 effect 传播。如果 P1 的 open row 语义不完全匹配 builtins 的 open_row()，可能需要调整。
2. **自举回归**：编译器自身使用 List.map 等方法。迁移后编译器源码的 HOF 调用改为走标准库路径，需要两次自举验证。
3. **sort_by**：需要 extern fn 做 JS Array.sort 桥接，不能完全迁移为纯 Ring。
4. **Option HOF**：Option 的 map/and_then/unwrap_or_else 可能与现有 builtins 的 Option 注册有交互，需仔细处理。

---

## Wave B-2: P2 — impl 类型参数 bounds 支持

### 目标

使 `impl<T: Eq> List { ... }` 语法可用——impl 声明的类型参数支持 trait bounds。这是 S3 (Eq trait 约束迁移) 的前置条件。

### 当前状态

- `TypeParam`（ast.ring）：已有 `bounds: List<TypeBound>` 字段
- `Decl::Impl`（ast.ring）：有 `type_params: List<TypeParam>`，但 parser 不解析 bounds
- `parse_impl_decl`（parser.ring）：解析 `impl<T> Type { ... }`，不处理 `<T: Trait>`
- `register_impl_method`（infer_register.ring）：注册方法时不使用 type param bounds
- `check_impl_decl`（infer_decl.ring）：检查 impl 时不验证 bounds 约束

### 实现步骤

#### 1. parser.ring — parse_type_params 已支持 bounds

检查 `parse_type_params` 是否已经解析 `<T: Bound>`。TypeParam 结构体已有 bounds 字段，parser 可能已经支持。如果已支持，这步跳过。如果不支持，需要添加 `: Bound` 解析。

#### 2. infer_register.ring — 注册时传递 bounds

`register_impl_method` 需要将 impl 的 type param bounds 传递到方法的 TypeScheme 中。找到方法注册逻辑，确保 bounds 被记录为 `SchemeBound`。

#### 3. infer_decl.ring — check_impl_decl 使用 bounds

在 `check_impl_decl` 中，impl 的 type param bounds 需要：
1. 注册为当前作用域的约束（方法体内的泛型调用需要满足 bounds）
2. 在方法调用时，caller 传递的类型必须满足 bounds（类似函数的 trait bounds 检查）

#### 4. codegen — trait dict 参数传递

`impl<T: Eq>` 的方法在 codegen 时需要接受 Eq trait dict 作为参数。检查现有的 trait bounds codegen 机制（用于泛型函数 `fn<T: Eq>`）是否可以直接复用。

#### 5. 测试

新增 `tests/cases/impl_bounds.ring`：

```ring
impl<T: Eq> List {
    pub fn dedup(self) -> List<T> {
        var result: List<T> = []
        for item in self {
            if result.len() == 0 || !(result.last().unwrap() == item) {
                result.push(item)
            }
        }
        result
    }
}

fn main() {
    let nums = [1, 1, 2, 3, 3, 3, 4]
    let deduped = nums.dedup()
    assert(deduped.len() == 4, "dedup length")
    print("impl_bounds: all tests passed")
}
```

负面测试 `tests/cases/errors/impl_bounds_unsatisfied.ring`：

```ring
// expect-error
struct NoEq { x: Int }

impl<T: Eq> List {
    pub fn has(self, item: T) -> Bool {
        self.any(fn(x) { x == item })
    }
}

fn main() {
    let items = [NoEq { x: 1 }]
    items.has(NoEq { x: 1 })  // NoEq 没有 Eq impl，应报错
}
```

#### 6. 编译验证

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

### 触碰文件清单

| 文件 | 改动类型 |
|------|---------|
| compiler/parser.ring | parse_type_params bounds 支持（如未有） |
| compiler/infer_register.ring | register_impl_method 传递 bounds |
| compiler/infer_decl.ring | check_impl_decl 使用 bounds |
| compiler/codegen_expr.ring | impl method trait dict 参数（如需要） |
| tests/cases/impl_bounds.ring | 新增正面测试 |
| tests/cases/errors/impl_bounds_unsatisfied.ring | 新增负面测试 |
| tests/e2e.test.ts | 注册新测试 |

---

## Wave C-1: S3 — Eq trait 约束迁移

### 目标

将集合方法中的 JS `===` 引用相等替换为 Eq trait 结构相等。涉及：`List.contains`、`List.index_of`、`Set.contains`、`Map.get`、`Map.contains_key`。

### 前置条件

Wave B-2 (P2) 必须完成——需要 `impl<T: Eq>` 语法。

### 当前状态

- `List.contains`/`List.index_of` 在 runtime.ring 中用 JS `===`
- `Set.contains` 用 JS `Set.has()`（基于引用相等）
- `Map.get`/`Map.contains_key` 用 JS `Map.has()/get()`（key 引用相等）
- Eq trait dispatch 已工作（`==` 运算符 → `TraitDispatch::Direct`）
- auto-derive Eq 已工作

### 实现步骤

#### 1. std/list.ring — 迁移 contains 和 index_of

将 `contains` 和 `index_of` 从 extern fn 改为 Ring impl 方法，使用 `==`（走 Eq trait dispatch）：

```ring
impl<T: Eq> List {
    pub fn contains(self, item: T) -> Bool {
        for x in self {
            if x == item { return true }
        }
        false
    }

    pub fn index_of(self, item: T) -> Int {
        var i = 0
        for x in self {
            if x == item { return i }
            i = i + 1
        }
        -1
    }
}
```

同时从原来的 `impl<T> List` 块中移除 `contains` 和 `index_of` 的 extern 声明。

#### 2. runtime.ring — 移除对应 JS 实现

移除 `List_contains` 和 `List_indexOf` 的 JS 实现。

#### 3. Map 和 Set 的 Eq 迁移

Map 和 Set 的底层是 JS Map/Set，key 查找基于 JS `===`。这个限制更深——JS Map 的 key 查找无法直接使用 Ring 的 Eq trait。

**评估后可能需要推迟**：Map/Set 的 key equality 改造需要替换底层数据结构或 hack JS Map 的查找逻辑，影响面过大。首期只迁移 List 的方法。

#### 4. builtin_methods.ring — 更新

从 `LIST_NON_HOF_METHODS` 中移除 `contains` 和 `index_of`（它们变成了 trait-bounded impl 方法）。

#### 5. 测试

新增 `tests/cases/eq_contains.ring`：

```ring
struct Point { x: Int, y: Int } derive(Eq)

fn main() {
    let points = [Point { x: 1, y: 2 }, Point { x: 3, y: 4 }]
    assert(points.contains(Point { x: 1, y: 2 }), "struct Eq contains")
    assert(!points.contains(Point { x: 5, y: 6 }), "struct Eq not contains")

    let nums = [1, 2, 3]
    assert(nums.contains(2), "Int contains")
    assert(nums.index_of(3) == 2, "Int index_of")
    assert(nums.index_of(99) == -1, "Int index_of missing")

    print("eq_contains: all tests passed")
}
```

#### 6. 编译验证

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

### 触碰文件清单

| 文件 | 改动类型 |
|------|---------|
| std/list.ring | 迁移 contains/index_of 到 impl<T: Eq> |
| compiler/runtime.ring | 移除 List_contains/List_indexOf JS |
| compiler/builtin_methods.ring | 更新 LIST_NON_HOF_METHODS |
| tests/cases/eq_contains.ring | 新增测试 |
| tests/e2e.test.ts | 注册新测试 |

---

## 执行指令

### 启动 Wave A

在同一条消息中发出两个 `Agent({ isolation: "worktree", run_in_background: true })` 调用：

1. **WT-A1: P1 fn type effect 标注** — prompt 包含上述 "Wave A-1" 全部内容
2. **WT-A2: M5 capability 限制** — prompt 包含上述 "Wave A-2" 全部内容

### Wave A 完成后

1. Review diff
2. 顺序 merge（P1 优先）
3. Rebuild dist + 全量测试
4. 自动启动 Wave B

### Wave B 完成后

1. Review diff
2. 顺序 merge（S2 优先，因为 P2 改动更集中不易冲突）
3. Rebuild dist + 全量测试
4. 自动启动 Wave C

### 最终验证

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

确认测试只增不减，更新 phase-b-spec.md 标记 Wave 3 完成状态。
