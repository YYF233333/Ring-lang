# Phase 3 Iteration 3: 大文件拆分 + 语言小修

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 拆分 `infer.ring`（提取声明检查到 `infer_decl.ring`）；修复 struct literal 解析歧义（context-aware parsing）；添加 `loop` 关键字；消除 `try_eq_dispatch` 空字符串 sentinel。

**Architecture:** `infer.ring` 声明检查函数提取到 `infer_decl.ring`（单向依赖，无循环导入）。`loop` 在 parser 层脱糖为 `while true`，无需新增 AST/HIR 节点。struct literal 歧义通过给 `parse_expr_bp` 添加 `allow_struct_lit` 参数解决——if/while/for/match 的条件位置禁止 struct literal（Go/Rust 标准做法）。sentinel 改为 `Option<Str>`。

**Tech Stack:** Ring compiler (self-hosted), node:test E2E framework

**前置条件:** Iteration 2（Parser 错误恢复 + const 声明）已完成并提交。

---

## Task 1: C8 — `try_eq_dispatch` / `try_ord_dispatch` sentinel → Option

将空字符串 sentinel 改为 `Option<Str>`，消除脆弱约定。

**Files:**
- Modify: `compiler/codegen_expr.ring:122-164`
- Rebuild: `compiler/dist/codegen_expr.js`

- [ ] **Step 1: Change `try_eq_dispatch` return type to `Str?`**

In `compiler/codegen_expr.ring`, change `try_eq_dispatch`:

```ring
// BEFORE (line 140):
fn try_eq_dispatch(var ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?) -> Str {
    match eq_dispatch {
        some(dispatch) => {
            let is_eq_op = (op == BinOp::Eq) || (op == BinOp::Neq)
            if is_eq_op {
                return gen_eq_dispatch(ctx, op, left, right, dispatch)
            }
        },
        none => {},
    }
    ""
}

// AFTER:
fn try_eq_dispatch(var ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?) -> Str? {
    match eq_dispatch {
        some(dispatch) => {
            let is_eq_op = (op == BinOp::Eq) || (op == BinOp::Neq)
            if is_eq_op {
                return some(gen_eq_dispatch(ctx, op, left, right, dispatch))
            }
        },
        none => {},
    }
    none
}
```

- [ ] **Step 2: Change `try_ord_dispatch` return type to `Str?`**

```ring
// BEFORE (line 153):
fn try_ord_dispatch(var ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, ord_dispatch: TraitDispatch?) -> Str {
    match ord_dispatch {
        some(dispatch) => {
            let is_ord_op = (op == BinOp::Lt) || (op == BinOp::Gt) || (op == BinOp::Lte) || (op == BinOp::Gte)
            if is_ord_op {
                return gen_ord_dispatch(ctx, op, left, right, dispatch)
            }
        },
        none => {},
    }
    ""
}

// AFTER:
fn try_ord_dispatch(var ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, ord_dispatch: TraitDispatch?) -> Str? {
    match ord_dispatch {
        some(dispatch) => {
            let is_ord_op = (op == BinOp::Lt) || (op == BinOp::Gt) || (op == BinOp::Lte) || (op == BinOp::Gte)
            if is_ord_op {
                return some(gen_ord_dispatch(ctx, op, left, right, dispatch))
            }
        },
        none => {},
    }
    none
}
```

- [ ] **Step 3: Update caller `gen_binop` to use `match` instead of `.len() > 0`**

```ring
// BEFORE (line 122):
fn gen_binop(var ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?, ord_dispatch: TraitDispatch?) -> Str {
    var eq_result = try_eq_dispatch(ctx, op, left, right, eq_dispatch)
    if eq_result.len() > 0 { return eq_result }
    var ord_result = try_ord_dispatch(ctx, op, left, right, ord_dispatch)
    if ord_result.len() > 0 { return ord_result }
    // ...
}

// AFTER:
fn gen_binop(var ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?, ord_dispatch: TraitDispatch?) -> Str {
    match try_eq_dispatch(ctx, op, left, right, eq_dispatch) {
        some(result) => { return result },
        none => {},
    }
    match try_ord_dispatch(ctx, op, left, right, ord_dispatch) {
        some(result) => { return result },
        none => {},
    }
    let js_op = match op {
        BinOp::Eq => "===",
        BinOp::Neq => "!==",
        _ => binop_str(op),
    }
    let l = gen_expr(ctx, left)
    let r = gen_expr(ctx, right)
    "(${l} ${js_op} ${r})"
}
```

- [ ] **Step 4: Rebuild dist and run tests**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: same pass count as before — pure refactoring, no behavior change.

- [ ] **Step 5: Commit**

```bash
git add compiler/codegen_expr.ring compiler/dist/codegen_expr.js
git commit -m "refactor(C8): try_eq_dispatch/try_ord_dispatch sentinel → Option<Str>"
```

---

## Task 2: A6 — `loop` 关键字

添加 `loop { ... }` 语法，在 parser 层脱糖为 `while true { ... }`。无需新增 AST/HIR/Checker/Codegen 处理。

**Files:**
- Modify: `compiler/lexer.ring:9-110` (TokenKind enum + keyword_lookup + token_kind_value)
- Modify: `compiler/parser.ring:298-340` (parse_stmt) + 新增 parse_loop_stmt
- Create: `tests/cases/loop_basic.ring`
- Modify: `tests/e2e.test.ts`
- Rebuild: `compiler/dist/*.js`

- [ ] **Step 1: Write the E2E test**

Create `tests/cases/loop_basic.ring`:

```ring
fn main() {
    var count = 0
    loop {
        count = count + 1
        if count == 5 { break }
    }
    assert(count == 5, "loop with break")

    var sum = 0
    var i = 0
    loop {
        i = i + 1
        if i > 10 { break }
        if i % 2 == 0 { continue }
        sum = sum + i
    }
    assert(sum == 25, "loop with continue: 1+3+5+7+9")

    print("loop_basic: all tests passed")
}
```

- [ ] **Step 2: Register the test in e2e.test.ts**

Add to the positive cases array:

```typescript
{ file: "loop_basic.ring", expected: "loop_basic: all tests passed\n" },
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd compiler && npm test -- --test-name-pattern="loop_basic"
```

Expected: FAIL — `loop` is not a recognized keyword.

- [ ] **Step 4: Add `TkLoop` to lexer TokenKind enum**

In `compiler/lexer.ring`, line 16, add `TkLoop` after `TkContinue`:

```ring
// BEFORE:
    TkWhile, TkBreak, TkContinue,

// AFTER:
    TkWhile, TkBreak, TkContinue, TkLoop,
```

- [ ] **Step 5: Add `TkLoop` to `token_kind_value`**

In `compiler/lexer.ring`, line 54:

```ring
// BEFORE:
        TkWhile => "while", TkBreak => "break", TkContinue => "continue",

// AFTER:
        TkWhile => "while", TkBreak => "break", TkContinue => "continue", TkLoop => "loop",
```

- [ ] **Step 6: Add "loop" to `keyword_lookup`**

In `compiler/lexer.ring`, after line 104 (`"continue"`):

```ring
// BEFORE:
        "continue" => some(TokenKind::TkContinue),
        "use" => some(TokenKind::TkUse),

// AFTER:
        "continue" => some(TokenKind::TkContinue),
        "loop" => some(TokenKind::TkLoop),
        "use" => some(TokenKind::TkUse),
```

- [ ] **Step 7: Add `TkLoop` branch to `parse_stmt` in parser**

In `compiler/parser.ring`, after the `TkWhile` check (line 329-331):

```ring
// BEFORE:
        if self.check(TokenKind::TkWhile) {
            return self.parse_while_stmt()
        }

// AFTER:
        if self.check(TokenKind::TkWhile) {
            return self.parse_while_stmt()
        }
        if self.check(TokenKind::TkLoop) {
            return self.parse_loop_stmt()
        }
```

- [ ] **Step 8: Add `parse_loop_stmt` method**

In `compiler/parser.ring`, immediately after `parse_while_stmt` (after line 373):

```ring
    fn parse_loop_stmt(var self) -> Stmt {
        let start = self.current_span_start()
        self.expect(TokenKind::TkLoop)
        let body = self.parse_block_expr()
        let end = self.current_span_start()
        let condition = Expr::BoolLit { value: true, span: self.make_span(start, start) }
        Stmt::While { condition: condition, body: body, span: self.make_span(start, end) }
    }
```

- [ ] **Step 9: Check parser error recovery keyword set**

If iteration 2 added parser error recovery that uses a set of "declaration start" keywords for synchronization, ensure `TkLoop` is NOT in that set (it's a statement keyword, not a declaration keyword). Check `parse_program` or similar recovery logic.

- [ ] **Step 10: Rebuild dist and run tests**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: loop_basic test passes.

- [ ] **Step 11: Commit**

```bash
git add compiler/lexer.ring compiler/parser.ring tests/cases/loop_basic.ring tests/e2e.test.ts compiler/dist/
git commit -m "feat(A6): add loop keyword — desugars to while true in parser"
```

---

## Task 3: A5 — struct literal 解析歧义修复（Context-Aware Parsing）

**问题：** `parse_prefix()` 看到大写标识符后跟 `{` 时，无条件解析为 struct literal。导致 `if op == BinOp::Eq { body }` 崩溃——parser 将 `Eq {` 解析为 struct literal，吃掉了 if 的 body `{`。同样影响 `while`/`for`/`match` 的条件位置。

**修复策略（Go/Rust 标准做法）：** 给 `parse_expr_bp` 添加 `allow_struct_lit: Bool` 参数。在 if/while/for/match 的条件/scrutinee 表达式中设为 `false`，禁止 struct literal 解析。Flag 在 infix RHS 递归时传播（条件内的 `==` RHS 也禁止），在括号/方括号等子表达式中重置为 `true`。

**不破坏现有代码：** `CompileError {}`、`Empty {}` 等出现在普通表达式上下文（赋值、函数参数等），`allow_struct_lit` 为 `true`，照常工作。

**唯一 trade-off：** 条件位置不能直接写 struct literal，需括号或变量：`if x == (MyStruct { f: 1 }) { ... }`。实践中极罕见。

**Files:**
- Modify: `compiler/parser.ring` — `parse_expr`, `parse_expr_bp`, `parse_prefix`, `parse_if_expr`, `parse_match_expr`, `parse_while_stmt`, `parse_for_in_stmt`
- Modify: `compiler/codegen_expr.ring` — remove workaround parentheses
- Create: `tests/cases/enum_variant_brace_disambig.ring`
- Modify: `tests/e2e.test.ts`
- Rebuild: `compiler/dist/*.js`

- [ ] **Step 1: Write the E2E test**

Create `tests/cases/enum_variant_brace_disambig.ring`:

```ring
enum Op {
    Add,
    Eq
}

enum Color {
    Red,
    Green { shade: Int }
}

struct Empty {}

fn op_name(op: Op) -> Str {
    if op == Op::Eq {
        return "eq"
    }
    if op == Op::Add {
        return "add"
    }
    "unknown"
}

fn main() {
    assert(op_name(Op::Eq) == "eq", "eq variant comparison + block")
    assert(op_name(Op::Add) == "add", "add variant comparison + block")

    // Named-field variant construction in normal expression context — still works
    let g = Color::Green { shade: 50 }
    match g {
        Color::Green { shade } => assert(shade == 50, "named field variant"),
        _ => assert(false, "unreachable"),
    }

    // Bare variant comparison + block
    let c = Color::Red
    var found = false
    if c == Color::Red {
        found = true
    }
    assert(found, "bare variant comparison + block")

    // Empty struct construction in normal expression context — still works
    let e = Empty {}

    // Struct literal inside function call arguments — still works (parenthesized context)
    let g2 = Color::Green { shade: 100 }

    // while with enum comparison
    var count = 0
    let target = Op::Eq
    while target == Op::Eq {
        count = count + 1
        break
    }
    assert(count == 1, "while with enum comparison")

    print("enum_variant_brace_disambig: all tests passed")
}
```

- [ ] **Step 2: Register the test in e2e.test.ts**

```typescript
{ file: "enum_variant_brace_disambig.ring", expected: "enum_variant_brace_disambig: all tests passed\n" },
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd compiler && npm test -- --test-name-pattern="enum_variant_brace_disambig"
```

Expected: FAIL — parser misparses `Op::Eq {` as struct literal.

- [ ] **Step 4: Add `allow_struct_lit` parameter to `parse_expr_bp`**

In `compiler/parser.ring`, change `parse_expr` and `parse_expr_bp`:

```ring
// BEFORE (line 957):
    pub fn parse_expr(var self) -> Expr {
        self.parse_expr_bp(PREC_NONE())
    }

    pub fn parse_expr_bp(var self, min_prec: Int) -> Expr {
        var left = self.parse_prefix()

// AFTER:
    pub fn parse_expr(var self) -> Expr {
        self.parse_expr_bp(PREC_NONE(), true)
    }

    fn parse_expr_no_struct(var self) -> Expr {
        self.parse_expr_bp(PREC_NONE(), false)
    }

    pub fn parse_expr_bp(var self, min_prec: Int, allow_struct_lit: Bool) -> Expr {
        var left = self.parse_prefix(allow_struct_lit)
```

- [ ] **Step 5: Propagate flag in infix recursive calls within `parse_expr_bp`**

In `parse_expr_bp`, update ALL recursive calls to `parse_expr_bp` to pass the flag:

```ring
// Line ~983 (range expression RHS):
// BEFORE:
                let right = self.parse_expr_bp(prec)
// AFTER:
                let right = self.parse_expr_bp(prec, allow_struct_lit)

// Line ~993 (binary operator RHS):
// BEFORE:
                let right = self.parse_expr_bp(prec)
// AFTER:
                let right = self.parse_expr_bp(prec, allow_struct_lit)
```

- [ ] **Step 6: Add `allow_struct_lit` parameter to `parse_prefix`**

Change the signature and guard the struct literal branches:

```ring
// BEFORE (line 1003):
    pub fn parse_prefix(var self) -> Expr {

// AFTER:
    fn parse_prefix(var self, allow_struct_lit: Bool) -> Expr {
```

Then guard the TWO struct literal checks in `parse_prefix`:

```ring
// Qualified case (line 1071) — BEFORE:
            if is_uppercase(variant_name.char_at(0).unwrap_or("")) && self.check(TokenKind::TkLBrace) {
                return self.parse_struct_literal(variant_name, start, some(name))
            }
// AFTER:
            if allow_struct_lit && is_uppercase(variant_name.char_at(0).unwrap_or("")) && self.check(TokenKind::TkLBrace) {
                return self.parse_struct_literal(variant_name, start, some(name))
            }

// Non-qualified case (line 1079) — BEFORE:
            if is_uppercase(name.char_at(0).unwrap_or("")) && self.check(TokenKind::TkLBrace) {
                return self.parse_struct_literal(name, start, none)
            }
// AFTER:
            if allow_struct_lit && is_uppercase(name.char_at(0).unwrap_or("")) && self.check(TokenKind::TkLBrace) {
                return self.parse_struct_literal(name, start, none)
            }
```

- [ ] **Step 7: Update `parse_prefix` internal calls to use `allow_struct_lit: true`**

Inside `parse_prefix`, sub-expressions in grouping constructs should reset to `true`:

```ring
// Unary operator (line ~1009) — BEFORE:
            let operand = self.parse_expr_bp(PREC_UNARY())
// AFTER:
            let operand = self.parse_expr_bp(PREC_UNARY(), allow_struct_lit)
```

Parenthesized expressions (`parse_expr()` calls inside `(...)`) and array literals (`[...]`) already use `parse_expr()` which defaults to `allow_struct_lit = true`. No changes needed there.

- [ ] **Step 8: Use `parse_expr_no_struct` in condition/scrutinee positions**

Change these 4 callers to use `parse_expr_no_struct()`:

```ring
// parse_if_expr (line 1254) — BEFORE:
        let condition = self.parse_expr()
// AFTER:
        let condition = self.parse_expr_no_struct()

// parse_match_expr (line 1275) — BEFORE:
        let scrutinee = self.parse_expr()
// AFTER:
        let scrutinee = self.parse_expr_no_struct()

// parse_while_stmt (line 369) — BEFORE:
        let condition = self.parse_expr()
// AFTER:
        let condition = self.parse_expr_no_struct()

// parse_for_in_stmt (line ~417, the iterable expression after `in`) — BEFORE:
        let iterable = self.parse_expr()
// AFTER:
        let iterable = self.parse_expr_no_struct()
```

- [ ] **Step 9: Fix any other callers of `parse_expr_bp` that pass wrong arity**

Search for all direct calls to `parse_expr_bp` in parser.ring. Each needs the new `allow_struct_lit` argument. Typical fix: pass `true` (the default). Places to check:

```bash
grep -n "parse_expr_bp(" compiler/parser.ring
```

For each call not yet updated, add `, true` as the second argument. Exception: calls already updated in Steps 5 and 7.

- [ ] **Step 10: Rebuild and run tests**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: `enum_variant_brace_disambig` passes. `CompileError {}`, `Empty {}` and all other tests unaffected.

- [ ] **Step 11: Remove workaround parentheses from compiler code**

Search for and remove unnecessary parentheses that were workarounds for this bug:

```ring
// compiler/codegen_expr.ring — try_eq_dispatch (around line 143, post-C8):
// BEFORE:
            let is_eq_op = (op == BinOp::Eq) || (op == BinOp::Neq)
// AFTER:
            let is_eq_op = op == BinOp::Eq || op == BinOp::Neq

// compiler/codegen_expr.ring — try_ord_dispatch (around line 156, post-C8):
// BEFORE:
            let is_ord_op = (op == BinOp::Lt) || (op == BinOp::Gt) || (op == BinOp::Lte) || (op == BinOp::Gte)
// AFTER:
            let is_ord_op = op == BinOp::Lt || op == BinOp::Gt || op == BinOp::Lte || op == BinOp::Gte
```

Search for other occurrences:

```bash
grep -rn "(.*== BinOp::" compiler/*.ring
```

Remove workaround parentheses wherever found.

- [ ] **Step 12: Rebuild after parentheses removal and run tests**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: All tests pass.

- [ ] **Step 13: Commit**

```bash
git add compiler/parser.ring compiler/codegen_expr.ring tests/cases/enum_variant_brace_disambig.ring tests/e2e.test.ts compiler/dist/
git commit -m "fix(A5): context-aware struct literal parsing — disallow in if/while/for/match conditions"
```

---

## Task 4: C2 — `infer.ring` 声明检查提取到 `infer_decl.ring`

**背景：** 原 spec 提议三文件拆分（infer + infer_expr + infer_stmt），经分析因 Ring 不支持循环模块导入（block→stmt→expr→block 环路）而不可行。本迭代仅提取声明检查函数（infer.ring lines 2172-2429）到 `infer_decl.ring`，使 infer.ring 从 2429 行降到 ~2175 行。

**依赖链（无环路）：**
```
infer_ctx ← infer ← infer_decl ← checker
```

**Files:**
- Create: `compiler/infer_decl.ring`
- Modify: `compiler/infer.ring` (remove extracted code)
- Modify: `compiler/checker.ring:7` (update import)
- Rebuild: `compiler/dist/*.js`

- [ ] **Step 1: Create `compiler/infer_decl.ring`**

Create the file with imports and cut-paste functions from `infer.ring` lines 2172-2429. The file contains these functions (bodies unchanged, just moved):

- `check_decl` (dispatch)
- `check_struct_decl`
- `check_enum_decl`
- `check_effect_decl`
- `check_impl_decl`
- `check_trait_decl`
- `check_trait_default_body`
- `find_ast_fn_by_name`
- `check_extern_fn_decl`
- `FnBodyResult` struct
- `check_fn_body`
- `check_fn_decl`
- `check_test_decl`
- `check_one_decl`
- `pub fn check` (entry point)
- `pub fn resolve_type_expr_public`

**Imports for `infer_decl.ring`:**

```ring
use types::{Type, EffectRow, UNIT, EMPTY_ROW, type_to_string}
use ast::{Program, Decl, Param, TypeExpr, TypeParam, TypeBound,
    Span, EffectOpDecl, span_zero}
use hir::{HDecl, HParam, HExpr, HProgram, DerivedImpl,
    HStructField, HEnumVariant, HEffectOp, HTraitMethod,
    hexpr_type, hexpr_effects, variant_js_name}
use diagnostics::{DiagnosticContext, CollectingSink}
use codes::{E0201, E0601}
use env::{TypeEnv, TypeScheme, SchemeBound, apply_subst, apply_subst_row}
use unify::{unify}
use infer_ctx::{InferCtx, InferResult, FnBoundsEntry, CompileError,
    type_error, merge_effects, unify_at, update_fn_effects,
    resolve_type_expr, resolve_self_type, resolve_named_type,
    generalize}
use infer_register::{register_decl_public, register_decls_two_phase}
use infer::{infer_block}
use zonk::{ZonkCtx, zonk_type, zonk_row, zonk_param, zonk_block}
use derive::{run_derive_pass}
```

**Functions that need `pub`:**
- `pub fn check(...)` — called by `checker.ring`
- `pub fn resolve_type_expr_public(...)` — called by external modules

All other functions remain module-private (no `pub`).

- [ ] **Step 2: Remove extracted functions from `infer.ring`**

Delete from `// Pass 2: Check declarations` comment (line 2172) to end of file (line 2429) in `compiler/infer.ring`.

- [ ] **Step 3: Verify `infer_block` is public in `infer.ring`**

`infer_block` at line 60 already has `pub fn` prefix. Verify `infer_decl.ring` can import it via `use infer::{infer_block}`.

Also make `infer_expr` and `infer_stmt` public (they are currently `pub`) — `infer_decl.ring` may transitively need them via `infer_block`.

- [ ] **Step 4: Update `checker.ring` import**

```ring
// BEFORE (line 7):
use infer::{check as infer_check}

// AFTER:
use infer_decl::{check as infer_check}
```

- [ ] **Step 5: Check for other files importing `check` or `resolve_type_expr_public` from `infer`**

```bash
grep -rn "use infer::" compiler/*.ring
```

Only `checker.ring` imports from `infer`. If `resolve_type_expr_public` is imported elsewhere (e.g., `compiler_mod.ring`), update those imports too.

- [ ] **Step 6: Remove unused imports from `infer.ring`**

After extracting declarations, `infer.ring` no longer needs:
- `use zonk::` — only used by declaration checking
- `use derive::` — only used by `check`
- `use infer_register::{register_decls_two_phase}` — only used by `check`

Verify and remove. Keep `register_decl_public` only if still referenced in remaining code.

- [ ] **Step 7: Rebuild and run tests**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: Same pass count. Pure refactoring.

- [ ] **Step 8: Bootstrap verification (compile twice)**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Second compilation uses the newly-compiled compiler. Tests passing on both runs confirms the split is sound.

- [ ] **Step 9: Verify line counts**

```powershell
(Get-Content compiler\infer.ring | Measure-Object -Line).Lines
(Get-Content compiler\infer_decl.ring | Measure-Object -Line).Lines
```

Expected: `infer.ring` ~2175 lines, `infer_decl.ring` ~280 lines.

- [ ] **Step 10: Commit**

```bash
git add compiler/infer.ring compiler/infer_decl.ring compiler/checker.ring compiler/dist/
git commit -m "refactor(C2): extract infer_decl.ring — declaration checking separated from inference core"
```

---

## Task 5: 文档更新 + 收尾

- [ ] **Step 1: Update CLAUDE.md**

更新以下内容：
- "已知限制" → 移除 "`BinOp::Eq {` 解析歧义" 条目
- "已知限制" → 移除 "无 `loop` 无限循环语法"（改为"已实现"）
- "已实现功能" → 添加 `loop` 关键字
- "已知限制" → 添加 "struct literal 不能直接出现在 if/while/for/match 条件位置（需用括号或变量）"
- 更新测试数量
- 更新项目结构中的文件列表（新增 `infer_decl.ring`）

- [ ] **Step 2: Update docs/design.md**

在相关章节添加 `loop` 关键字文档和 struct literal 条件位置限制说明。

- [ ] **Step 3: Delete this plan file**

```bash
rm docs/superpowers/plans/2026-05-21-iteration3-infer-split-loop-binop.md
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md docs/design.md
git commit -m "docs: update for Iteration 3 — loop keyword, struct literal disambiguation, infer.ring split"
```
