# Phase 3 Iteration 1: "解锁器" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现空列表 `[]` 类型推断、tuple `.0`/`.1` 字段访问、HIR accessor 统一，并用新特性清理编译器 boilerplate。

**Architecture:** 三个独立特性按依赖顺序实现。C1（HIR accessor）是纯重构，先做。A1（空列表推断）修改 `infer_list_literal` 使其返回 fresh type var 而非报错，让现有 let/var 类型标注统一机制自然解析类型。A2（tuple 访问）在 parser/checker/codegen 三层各加一个分支。每个特性完成后 bootstrap 编译器，使新特性可用于编译器自身代码，然后清理对应 boilerplate。

**Tech Stack:** Ring 自举编译器，Node.js E2E 测试

**Bootstrap 注意事项:** Ring 编译器自举——`compiler/dist/` 中的 JS 是当前可执行编译器。每次语言改动需两步：(1) 用旧编译器编译含新特性的代码（此时源码不能使用新特性），(2) 用新编译器重编译使用了新特性的源码。

---

## Task 1: C1 — HIR Accessor 统一到 hir.ring

**Files:**
- Modify: `compiler/hir.ring` (末尾追加 3 个 pub fn)
- Modify: `compiler/infer.ring:128-186` (删除 `hexpr_type` + `hexpr_effects`，更新 import)
- Modify: `compiler/zonk.ring:306-394` (删除 `expr_type` + `expr_effects` + `expr_span`，更新 import)
- Modify: `compiler/codegen_expr.ring:1254-1282` (删除 `get_expr_type`，更新 import)

- [ ] **Step 1: 在 hir.ring 末尾添加 3 个 pub accessor**

在 `compiler/hir.ring` 文件末尾（`RUNTIME_MATCH_FAIL` 之后）追加：

```ring
pub fn hexpr_type(e: HExpr) -> Type {
    match e {
        HExpr::IntLit { ty, .. } => ty,
        HExpr::FloatLit { ty, .. } => ty,
        HExpr::StrLit { ty, .. } => ty,
        HExpr::BoolLit { ty, .. } => ty,
        HExpr::Ident { ty, .. } => ty,
        HExpr::BinOp { ty, .. } => ty,
        HExpr::UnaryOp { ty, .. } => ty,
        HExpr::Call { ty, .. } => ty,
        HExpr::FieldAccess { ty, .. } => ty,
        HExpr::StructLit { ty, .. } => ty,
        HExpr::NamedVariantConstruct { ty, .. } => ty,
        HExpr::MatchExpr { ty, .. } => ty,
        HExpr::Block { ty, .. } => ty,
        HExpr::IfExpr { ty, .. } => ty,
        HExpr::StringInterp { ty, .. } => ty,
        HExpr::TryCatch { ty, .. } => ty,
        HExpr::HandleExpr { ty, .. } => ty,
        HExpr::Lambda { ty, .. } => ty,
        HExpr::EffectOp { ty, .. } => ty,
        HExpr::OptionUnwrap { ty, .. } => ty,
        HExpr::TryBlock { ty, .. } => ty,
        HExpr::OptionOr { ty, .. } => ty,
        HExpr::RangeExpr { ty, .. } => ty,
        HExpr::ListLit { ty, .. } => ty,
        HExpr::TupleLit { ty, .. } => ty
    }
}

pub fn hexpr_effects(e: HExpr) -> EffectRow {
    match e {
        HExpr::IntLit { effects, .. } => effects,
        HExpr::FloatLit { effects, .. } => effects,
        HExpr::StrLit { effects, .. } => effects,
        HExpr::BoolLit { effects, .. } => effects,
        HExpr::Ident { effects, .. } => effects,
        HExpr::BinOp { effects, .. } => effects,
        HExpr::UnaryOp { effects, .. } => effects,
        HExpr::Call { effects, .. } => effects,
        HExpr::FieldAccess { effects, .. } => effects,
        HExpr::StructLit { effects, .. } => effects,
        HExpr::NamedVariantConstruct { effects, .. } => effects,
        HExpr::MatchExpr { effects, .. } => effects,
        HExpr::Block { effects, .. } => effects,
        HExpr::IfExpr { effects, .. } => effects,
        HExpr::StringInterp { effects, .. } => effects,
        HExpr::TryCatch { effects, .. } => effects,
        HExpr::HandleExpr { effects, .. } => effects,
        HExpr::Lambda { effects, .. } => effects,
        HExpr::EffectOp { effects, .. } => effects,
        HExpr::OptionUnwrap { effects, .. } => effects,
        HExpr::TryBlock { effects, .. } => effects,
        HExpr::OptionOr { effects, .. } => effects,
        HExpr::RangeExpr { effects, .. } => effects,
        HExpr::ListLit { effects, .. } => effects,
        HExpr::TupleLit { effects, .. } => effects
    }
}

pub fn hexpr_span(e: HExpr) -> Span {
    match e {
        HExpr::IntLit { span, .. } => span,
        HExpr::FloatLit { span, .. } => span,
        HExpr::StrLit { span, .. } => span,
        HExpr::BoolLit { span, .. } => span,
        HExpr::Ident { span, .. } => span,
        HExpr::BinOp { span, .. } => span,
        HExpr::UnaryOp { span, .. } => span,
        HExpr::Call { span, .. } => span,
        HExpr::FieldAccess { span, .. } => span,
        HExpr::StructLit { span, .. } => span,
        HExpr::NamedVariantConstruct { span, .. } => span,
        HExpr::MatchExpr { span, .. } => span,
        HExpr::Block { span, .. } => span,
        HExpr::IfExpr { span, .. } => span,
        HExpr::StringInterp { span, .. } => span,
        HExpr::TryCatch { span, .. } => span,
        HExpr::HandleExpr { span, .. } => span,
        HExpr::Lambda { span, .. } => span,
        HExpr::EffectOp { span, .. } => span,
        HExpr::OptionUnwrap { span, .. } => span,
        HExpr::TryBlock { span, .. } => span,
        HExpr::OptionOr { span, .. } => span,
        HExpr::RangeExpr { span, .. } => span,
        HExpr::ListLit { span, .. } => span,
        HExpr::TupleLit { span, .. } => span
    }
}
```

- [ ] **Step 2: 更新 infer.ring — 删除私有副本，添加 import**

在 `compiler/infer.ring` 的 `use hir::{...}` import 行（第 8-14 行）中添加 `hexpr_type, hexpr_effects, hexpr_span`：

```ring
use hir::{HExpr, HStmt, HDecl, HParam, HMatchArm, HEffectHandler,
    HStructFieldInit, HStringInterpPart, HProgram, DerivedImpl,
    TraitDispatch, DictDispatchInfo, TraitBound,
    HStructField, HEnumVariant, HEffectOp, HTraitMethod,
    HForInDestructure, HLetDestructureBinding,
    variant_js_name, trait_dict_name, trait_bound_param_name,
    hexpr_type, hexpr_effects, hexpr_span,
    BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET}
```

然后删除 `compiler/infer.ring` 第 124-186 行的两个私有函数 `hexpr_type` 和 `hexpr_effects`（含注释块）。

- [ ] **Step 3: 更新 zonk.ring — 删除 3 个私有副本，添加 import**

在 `compiler/zonk.ring` 的 `use hir::{...}` import 行（第 3-5 行）中添加 `hexpr_type, hexpr_effects, hexpr_span`：

```ring
use hir::{HExpr, HStmt, HParam, HMatchArm, HEffectHandler,
    HStructFieldInit, HStringInterpPart, HForInDestructure,
    HLetDestructureBinding,
    hexpr_type, hexpr_effects, hexpr_span}
```

然后将 `zonk_expr` 中的调用 `expr_type(expr)` → `hexpr_type(expr)`、`expr_effects(expr)` → `hexpr_effects(expr)`、`expr_span(expr)` → `hexpr_span(expr)`（第 167-169 行）。

最后删除 `compiler/zonk.ring` 第 306-394 行的三个私有函数 `expr_type`、`expr_effects`、`expr_span`。

- [ ] **Step 4: 更新 codegen_expr.ring — 删除私有副本，添加 import**

在 `compiler/codegen_expr.ring` 的 `use hir::{...}` import 行（第 2-7 行）中添加 `hexpr_type`：

```ring
use hir::{HExpr, HStmt, HMatchArm, HParam, HStructFieldInit,
    HStringInterpPart, HEffectHandler,
    evidence_param_name, trait_dict_name, hexpr_type,
    ENUM_TAG_FIELD, OPTION_SOME_TAG, OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD,
    RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL,
    BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION}
```

然后将 `codegen_expr.ring` 中所有 `get_expr_type(...)` 调用改为 `hexpr_type(...)`（约 3 处：第 342、496、1228 行附近）。

最后删除 `compiler/codegen_expr.ring` 第 1254-1282 行的 `get_expr_type` 函数。

- [ ] **Step 5: Bootstrap + 测试验证**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: 编译成功，318/324 测试通过（与之前相同）。

- [ ] **Step 6: Commit**

```bash
git add compiler/hir.ring compiler/infer.ring compiler/zonk.ring compiler/codegen_expr.ring compiler/dist/
git commit -m "refactor(C1): unify HIR accessors into hir.ring — eliminate 180 lines of duplication"
```

---

## Task 2: A1 — 空列表 `[]` 类型推断

**Files:**
- Modify: `compiler/infer.ring:2253-2258` (修改 `infer_list_literal` 空列表分支)
- Modify: `tests/e2e.test.ts` (移除负面测试 `error_empty_list`，添加正面测试)
- Create: `tests/cases/empty_list.ring` (正面 E2E 测试)
- Modify: `tests/cases/error_empty_list.ring` (删除文件)

**设计：** 当 `elements.len() == 0` 时，不再立即报错，而是创建一个 fresh type variable 作为元素类型，返回 `List<$fresh>` 类型。类型标注（`let x: List<Int> = []`）或后续使用（`x.push(1)`）会通过 unification 自然解析 `$fresh` 为具体类型。无标注无使用时，`$fresh` 被 generalize 为多态类型变量——这是正确的 HM 语义。

- [ ] **Step 1: 编写正面测试文件**

创建 `tests/cases/empty_list.ring`：

```ring
fn main() {
    let xs: List<Int> = []
    assert(xs.len() == 0, "empty with annotation")

    var ys: List<Str> = []
    ys.push("hello")
    assert(ys.len() == 1, "push after empty")
    assert(ys.get(0) == some("hello"), "get after push")

    let zs: List<List<Int>> = []
    assert(zs.len() == 0, "nested generic empty")

    print("empty_list: all tests passed")
}
```

- [ ] **Step 2: 更新测试注册**

在 `tests/e2e.test.ts` 的 `cases` 数组（约第 325 行 `];` 之前）添加：

```typescript
  { file: "empty_list.ring", expected: "empty_list: all tests passed\n" },
```

从 `negative_cases` 数组中删除 `error_empty_list.ring` 那行（第 352 行）：

```typescript
    { file: "error_empty_list.ring", error_pattern: "E0301" },
```

- [ ] **Step 3: 删除旧的负面测试文件**

删除 `tests/cases/error_empty_list.ring`。

- [ ] **Step 4: 修改 infer_list_literal — 替换错误为 fresh var**

在 `compiler/infer.ring` 第 2253-2258 行，将空列表的 error 分支替换为返回 fresh type var：

原代码：
```ring
    if elements.len() == 0 {
        type_error(ctx.sink, E0301(),
            "Cannot infer element type of empty list literal; provide a type annotation",
            span, DiagnosticContext::OtherContext { detail: some("Empty list literal requires context to determine element type") })
    }
```

替换为：
```ring
    if elements.len() == 0 {
        let elem_type = ctx.env.fresh_var()
        let list_type = Type::StructType { name: BUILTIN_LIST(), type_params: [elem_type], fields: empty_fields() }
        return InferResult {
            hexpr: HExpr::ListLit { elements: empty_hexprs(), ty: list_type, effects: EMPTY_ROW(), span: span },
            subst: subst, effects: EMPTY_ROW()
        }
    }
```

此处仍使用 `empty_hexprs()` 因为新编译器尚未构建——`[]` 字面量还不可用。

- [ ] **Step 5: Bootstrap + 测试**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: 编译成功。正面测试 `empty_list.ring` 通过。原负面测试已移除。总通过数应从 318 变为 319（减 1 负面 + 加 1 正面 = 净 +1，但原来的负面测试通过数也要减 1，所以需要看具体数字变化——关键是没有新的失败）。

- [ ] **Step 6: Commit**

```bash
git add compiler/infer.ring compiler/dist/ tests/cases/empty_list.ring tests/e2e.test.ts
git rm tests/cases/error_empty_list.ring
git commit -m "feat(A1): empty list [] type inference — fresh type var resolves via annotation or usage"
```

---

## Task 3: empty_xxx() 全量清理

**Files:** 所有包含 `fn empty_xxx()` 的编译器源文件（15 个文件，~80 个函数）
**前置条件：** Task 2 完成后 `compiler/dist/` 已支持空列表推断

此任务是纯机械替换：将每个 `empty_xxx()` 调用替换为 `[]`，然后删除 `empty_xxx()` 函数定义。

- [ ] **Step 1: 批量替换所有 empty_xxx() 调用为 `[]`**

按文件逐个替换。对每个文件，使用全局搜索替换：
- `empty_strs()` → `[]`
- `empty_ints()` → `[]`
- `empty_hexprs()` → `[]`
- `empty_hdecls()` → `[]`
- `empty_hstmts()` → `[]`
- （所有其他 `empty_xxx()` 变体同理）

**涉及文件清单**（按函数定义数量排序）：

| 文件 | 定义数 | 调用范围 |
|------|--------|----------|
| `compiler/parser.ring` | 22 | 仅文件内部 |
| `compiler/infer.ring` | 20 | 仅文件内部 |
| `compiler/derive.ring` | 12 | 仅文件内部 |
| `compiler/infer_register.ring` | 8 | 仅文件内部 |
| `compiler/infer_ctx.ring` | 6 | 仅文件内部 |
| `compiler/exhaustive.ring` | 5 | 仅文件内部 |
| `compiler/env.ring` | 4 | 仅文件内部 |
| `compiler/diagnostics.ring` | 3 | 仅文件内部 |
| `compiler/builtins.ring` | 3 | 仅文件内部 |
| `compiler/lexer.ring` | 2 | 仅文件内部 |
| `compiler/codegen_ctx.ring` | 1 | 仅文件内部 |
| `compiler/compiler_mod.ring` | 2 | 仅文件内部 |
| `compiler/exports.ring` | 1 | 仅文件内部 |
| `compiler/formatter.ring` | 1 | 仅文件内部 |
| `compiler/checker.ring` | 1 | 仅文件内部 |

替换策略：每个函数都是 `fn empty_xxx() -> List<T> { ... }`，返回一个特定类型的空列表。所有调用 `empty_xxx()` 均可无条件替换为 `[]`，因为类型推断会从上下文中解析 `T`。

- [ ] **Step 2: 删除所有 empty_xxx() 函数定义**

在每个文件中删除 `fn empty_xxx()` 的完整函数体。注意有两种模式：
- 简单模式（1 行）：`fn empty_strs() -> List<Str> { let x = [""]; x.clear(); x }`
- 复杂模式（3 行）：`fn empty_hdecls() -> List<HDecl> { let _x = [0]; _x.clear(); _x.map(fn(i: Int) -> HDecl { panic("unreachable") }) }`

全部删除。

- [ ] **Step 3: Bootstrap + 测试**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: 编译成功（新编译器接受 `[]` 语法），所有测试通过。

- [ ] **Step 4: Commit**

```bash
git add compiler/*.ring compiler/dist/
git commit -m "refactor(A1-cleanup): replace ~80 empty_xxx() helpers with [] — ~300 lines eliminated"
```

---

## Task 4: A2 — Tuple 字段访问 `.0`/`.1`

**Files:**
- Modify: `compiler/parser.ring:1237-1258` (accept `TkIntLit` after `.`)
- Modify: `compiler/infer.ring:1558-1614` (add `TupleType` case in `infer_field_access`)
- Modify: `compiler/infer.ring:0` (add `use num::{parse_int}`)
- Modify: `compiler/codegen_expr.ring:64-67` (numeric field → bracket notation)
- Create: `tests/cases/tuple_field_access.ring` (正面测试)
- Create: `tests/cases/error_tuple_oob.ring` (负面测试：越界)
- Modify: `tests/e2e.test.ts` (注册新测试)

- [ ] **Step 1: 编写正面测试文件**

创建 `tests/cases/tuple_field_access.ring`：

```ring
fn main() {
    let pair = (42, "hello")
    assert(pair.0 == 42, "pair.0")
    assert(pair.1 == "hello", "pair.1")

    let triple = (1, 2, 3)
    assert(triple.0 == 1, "triple.0")
    assert(triple.1 == 2, "triple.1")
    assert(triple.2 == 3, "triple.2")

    let nested = ((1, 2), "x")
    assert(nested.0.0 == 1, "nested.0.0")
    assert(nested.0.1 == 2, "nested.0.1")
    assert(nested.1 == "x", "nested.1")

    let mixed = (true, 3.14, "yes")
    assert(mixed.0 == true, "mixed.0")

    print("tuple_field_access: all tests passed")
}
```

- [ ] **Step 2: 编写负面测试文件**

创建 `tests/cases/error_tuple_oob.ring`：

```ring
fn main() {
    let t = (1, 2)
    let x = t.2
}
```

- [ ] **Step 3: 注册测试**

在 `tests/e2e.test.ts` 的 `cases` 数组末尾添加：

```typescript
  { file: "tuple_field_access.ring", expected: "tuple_field_access: all tests passed\n" },
```

在 `negative_cases` 数组末尾添加：

```typescript
    { file: "error_tuple_oob.ring", error_pattern: "E0304" },
```

- [ ] **Step 4: 修改 parser — 接受 TkIntLit 作为字段名**

在 `compiler/parser.ring` 第 1237-1240 行，将：

```ring
    fn parse_dot_expr(var self, left: Expr) -> Expr {
        self.advance()
        let name_tok = self.expect(TokenKind::TkIdent)
        let name = name_tok.value
```

替换为：

```ring
    fn parse_dot_expr(var self, left: Expr) -> Expr {
        self.advance()
        var name = ""
        if self.check(TokenKind::TkIntLit) {
            let tok = self.advance()
            name = tok.value
        } else {
            let tok = self.expect(TokenKind::TkIdent)
            name = tok.value
        }
```

函数其余部分不变——`name` 变量在后续的 `MethodCall` 和 `FieldAccess` 分支中使用。

- [ ] **Step 5: 修改 infer — 添加 parse_int import**

在 `compiler/infer.ring` 的 import 区域（第 29 行之后）添加：

```ring
use num::{parse_int}
```

- [ ] **Step 6: 修改 infer_field_access — 添加 TupleType 分支**

在 `compiler/infer.ring` 的 `infer_field_access` 函数中，在 `Type::TypeVar { .. } => {},` 行（第 1604 行）和 `_ => type_error(...)` 行（第 1605 行）之间，插入 `TupleType` 分支：

```ring
        Type::TupleType { elements } => {
            match parse_int(field) {
                none => type_error(ctx.sink, E0304(),
                    "Cannot access named field '${field}' on tuple type; use .0, .1, etc.",
                    span, DiagnosticContext::MissingField { field: field, ty: "tuple", available: none }),
                some(i) => {
                    if i >= elements.len() {
                        type_error(ctx.sink, E0304(),
                            "Tuple index ${field} out of bounds; tuple has ${elements.len().to_str()} elements",
                            span, DiagnosticContext::MissingField { field: field, ty: "tuple", available: none })
                    }
                    match elements.get(i) {
                        some(t) => { field_type = t },
                        none => panic("unreachable: tuple index bounds already checked")
                    }
                }
            }
        },
```

- [ ] **Step 7: 修改 codegen — 数字字段用 bracket notation**

在 `compiler/codegen_expr.ring` 第 64-67 行，将：

```ring
        HExpr::FieldAccess { receiver, field, .. } => {
            let r = gen_expr(ctx, receiver)
            "${r}.${field}"
        },
```

替换为：

```ring
        HExpr::FieldAccess { receiver, field, .. } => {
            let r = gen_expr(ctx, receiver)
            if is_tuple_field(field) {
                "${r}[${field}]"
            } else {
                "${r}.${field}"
            }
        },
```

在 `codegen_expr.ring` 的 helper 区域（原 `get_expr_type` 位置之后或文件末尾）添加：

```ring
fn is_tuple_field(s: Str) -> Bool {
    if s.len() == 0 { return false }
    let c = s.char_at(0)
    c == "0" || c == "1" || c == "2" || c == "3" || c == "4" ||
    c == "5" || c == "6" || c == "7" || c == "8" || c == "9"
}
```

- [ ] **Step 8: Bootstrap + 测试**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: 编译成功。`tuple_field_access.ring` 正面测试通过。`error_tuple_oob.ring` 负面测试通过（E0304 错误）。

- [ ] **Step 9: Commit**

```bash
git add compiler/parser.ring compiler/infer.ring compiler/codegen_expr.ring compiler/dist/ tests/cases/tuple_field_access.ring tests/cases/error_tuple_oob.ring tests/e2e.test.ts
git commit -m "feat(A2): tuple positional field access .0/.1/.2 — parser, checker, codegen"
```

---

## Task 5: Wrapper Struct 清理（使用 .0/.1 替代）

**Files:**
- Modify: `compiler/infer.ring` (删除 MergeResult/merge_eff，直接使用 tuple + .0/.1)
**前置条件：** Task 4 完成后 `compiler/dist/` 已支持 `.0`/`.1`

`MergeResult` wrapper struct（第 110 行）和 `merge_eff` 函数（第 112-116 行）是最典型的 workaround。`merge_effects` 返回 `(EffectRow, Map<Int, Type>)`，因为没有 `.0`/`.1`，被包装为 `MergeResult { eff, s }`。

- [ ] **Step 1: 将所有 merge_eff 调用替换为直接 merge_effects + .0/.1**

`merge_eff` 在 `infer.ring` 中被调用约 32 次，模式统一为：

```ring
let me = merge_eff(ctx.env, combined_effects, r.effects, s)
combined_effects = me.eff
s = me.s
```

替换为直接调用 `merge_effects` 并用 `.0`/`.1`：

```ring
let me = merge_effects(ctx.env, combined_effects, r.effects, s)
combined_effects = me.0
s = me.1
```

全文搜索 `merge_eff(` 替换。注意不要影响 `merge_effects(`（被调用的底层函数）。

- [ ] **Step 2: 删除 MergeResult struct 和 merge_eff 函数**

删除 `compiler/infer.ring` 第 109-116 行：

```ring
// Struct wrapper for merge_effects return (Ring has no .0/.1 tuple access)
struct MergeResult { eff: EffectRow, s: Map<Int, Type> }

fn merge_eff(env: TypeEnv, a: EffectRow, b: EffectRow, s: Map<Int, Type>) -> MergeResult {
    let result = merge_effects(env, a, b, s)
    let (new_eff, new_s) = result
    MergeResult { eff: new_eff, s: new_s }
}
```

- [ ] **Step 3: Bootstrap + 测试**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: 编译成功，所有测试通过。

- [ ] **Step 4: Commit**

```bash
git add compiler/infer.ring compiler/dist/
git commit -m "refactor(A2-cleanup): replace MergeResult wrapper with tuple .0/.1 access"
```

---

## Task 6: 文档更新 + 最终验证

**Files:**
- Modify: `CLAUDE.md` (更新已知限制、已实现功能)
- Modify: `docs/audit-report.md` (标记已修复项)
- Modify: `docs/phase3-spec.md` (标记 Iteration 1 完成)

- [ ] **Step 1: 更新 CLAUDE.md**

在"已实现功能"段落追加提及 `[]` 空列表推断和 tuple `.0`/`.1` 访问。

在"已知限制"中移除：
- "空列表 `[]` 类型推断失败" 相关限制
- "Tuple 无 `.0` / `.1` 位置字段访问" 相关限制

更新测试通过数（如果有变化）。

- [ ] **Step 2: 更新 audit-report.md**

标记以下项为已修复：
- `#1`: `~300 行 empty_xxx() 空列表 boilerplate` → 已修复
- `#2`: `hexpr_type/expr_type/expr_effects accessor 在 3 个文件重复` → 已修复
- `#11`: `MergeResult 等 wrapper struct` → 部分修复（MergeResult 已消除）

- [ ] **Step 3: 更新 phase3-spec.md**

在 Iteration 1 部分标注为完成，记录实际耗时和任何偏差。

- [ ] **Step 4: 最终全量验证**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

确认编译器可以自举且所有测试通过。

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/audit-report.md docs/phase3-spec.md
git commit -m "docs: update for Phase 3 Iteration 1 completion — [], .0/.1, HIR accessor unification"
```
