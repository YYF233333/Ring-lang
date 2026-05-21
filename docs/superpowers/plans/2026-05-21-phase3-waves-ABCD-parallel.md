# Phase 3 Waves A-D: Parallel Execution Plan (Post-It3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Phase 3 的 it4/5/6（共 10 个任务）重新编排为 4 波并行执行，利用 worktree 隔离将原计划 8 周压缩到 ~5 周。

**Architecture:** 按文件依赖将任务分为无冲突并行组。每波内的 worktree 分支独立开发、独立测试，完成后 `git merge` 回 main。波间串行（后波依赖前波的 merge 结果）。关键路径：C3(TypeEnv 拆分) → B3(诊断) → B4(error-format)。

**Tech Stack:** Ring compiler (self-hosted), node:test E2E framework, git worktree

**前置条件:** It3（C2 infer 拆分 + A5 struct literal 歧义 + A6 loop + C8 sentinel→Option）已完成并合入 main。

---

## Orchestration Overview

```
It3 (main)  ─────────────────┐
                              │ merge
Wave A (3 worktrees) ─────────┤  ← 并行于 it3 后半段或紧接 it3
  ├─ WTa1: A7 (List.set)     │
  ├─ WTa2: C6 (if/else→match)│
  └─ WTa3: C7 (AST cache)    │
                              │ merge all
Wave B (2 worktrees) ─────────┤
  ├─ WTb1: B2 (checker 多错误)│
  └─ WTb2: C5 (代码去重)      │
                              │ merge all
Wave C (main, sequential) ────┤
  └─ C3 (TypeEnv 拆分)        │  ← 最大单体任务，2-3 周
                              │ merge
Wave D (3 worktrees) ─────────┘
  ├─ WTd1: C4 (union-find)
  ├─ WTd2: B3+B4 (诊断质量+error-format)
  └─ WTd3: C9 (panic→DiagnosticSink)
```

### 依赖关系验证

| 波 | 任务 | 实际前置 | 文件冲突检查 |
|----|------|---------|-------------|
| A | A7 | 无 | std/list.ring, builtin_methods.ring, runtime.ring — 与 it3 零冲突 |
| A | C6 | 无 | derive.ring, codegen_derive.ring — 与 it3 零冲突 |
| A | C7 | 无 | resolver.ring, compiler_mod.ring — 与 it3 零冲突 |
| B | B2 | B1✓ | infer.ring, infer_ctx.ring — 需 C2(it3) 先合入 |
| B | C5 | A1/A2✓ | types.ring, codegen_derive.ring — 需 C6(Wave A) 先合入 |
| C | C3 | C2(it3)✓ | env.ring + 全编译器 — 独占 main |
| D | C4 | 无强依赖 | unify.ring — 与 B3/C9 零冲突 |
| D | B3+B4 | C3+B2✓ | diagnostics.ring, formatter.ring, cli.ring — 与 C4/C9 零冲突 |
| D | C9 | 架构稳定 | 散布 ~40 个 panic 站点 — 与 C4/B3 低冲突（不同函数） |

---

## Wave A — Independent Sprint (3 worktrees)

每个 worktree 从 main（it3 合入后）分支。任务互相无文件冲突，可完全并行。

### Task A.1: A7 — `List.set(i, v)` 方法

添加 `List.set(index, value)` 原地修改方法。四层改动：std 声明 → 类型注册 → runtime JS → codegen 注册。

**Files:**
- Modify: `std/list.ring:22` — 添加 extern 方法声明
- Modify: `compiler/builtin_methods.ring:11-14` — 添加到 LIST_NON_HOF_METHODS
- Modify: `compiler/runtime.ring:91` — 添加 JS runtime 函数
- Modify: `compiler/codegen.ring:190` — 已自动覆盖（register_builtin_methods 读 LIST_NON_HOF_METHODS）
- Create: `tests/cases/list_set.ring`
- Modify: `tests/e2e.test.ts`
- Rebuild: `compiler/dist/*.js`

- [ ] **Step 1: Write the E2E test**

Create `tests/cases/list_set.ring`:

```ring
fn main() {
    var xs = [10, 20, 30]
    xs.set(1, 99)
    assert(xs.get(1) == some(99), "set middle element")

    xs.set(0, 1)
    assert(xs.get(0) == some(1), "set first element")

    xs.set(2, 3)
    assert(xs.get(2) == some(3), "set last element")

    assert(xs.len() == 3, "length unchanged after set")

    print("list_set: all tests passed")
}
```

- [ ] **Step 2: Register the test in e2e.test.ts**

Add to positive cases:
```typescript
{ file: "list_set.ring", expected: "list_set: all tests passed\n" },
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd compiler && npm test -- --test-name-pattern="list_set"
```

Expected: FAIL — `set` not a recognized method.

- [ ] **Step 4: Add `set` to std/list.ring**

In `std/list.ring`, after line 21 (`clear`), add:

```ring
    pub extern fn set(self: List<T>, index: Int, value: T) -> Unit
```

- [ ] **Step 5: Add `"set"` to LIST_NON_HOF_METHODS**

In `compiler/builtin_methods.ring`, line 12:

```ring
// BEFORE:
pub const LIST_NON_HOF_METHODS: List<Str> =
    ["len", "get", "first", "last", "contains", "is_empty",
     "push", "pop", "concat", "extend", "slice", "reverse",
     "join", "sort", "shift", "clear", "index_of"]

// AFTER:
pub const LIST_NON_HOF_METHODS: List<Str> =
    ["len", "get", "set", "first", "last", "contains", "is_empty",
     "push", "pop", "concat", "extend", "slice", "reverse",
     "join", "sort", "shift", "clear", "index_of"]
```

- [ ] **Step 6: Add JS runtime function**

In `compiler/runtime.ring`, after `List_index_of` (line 91), add:

```ring
    lines.push("function List_set(self, i, v) { self[i] = v; }")
```

- [ ] **Step 7: Rebuild dist and run tests**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: `list_set` passes, all other tests unaffected.

- [ ] **Step 8: Commit**

```bash
git add std/list.ring compiler/builtin_methods.ring compiler/runtime.ring tests/cases/list_set.ring tests/e2e.test.ts compiler/dist/
git commit -m "feat(A7): add List.set(i, v) method — in-place element update"
```

---

### Task A.2: C6 — if/else → match 重构

将 `derive.ring` 和 `codegen_derive.ring` 中基于 `trait_name` 字符串的嵌套 if/else 链改为 match 表达式。

**注意：** Ring 的 match 表达式支持字符串字面量匹配。如果编译器报错（当前未测试过字符串 match），则需退回 if/else 方案并报告。

**Files:**
- Modify: `compiler/derive.ring:437-513` — `get_method_names` + `register_trait_methods`
- Modify: `compiler/codegen_derive.ring:5-18` — `get_derived_method_names` + `emit_derived_impl`
- Rebuild: `compiler/dist/*.js`

- [ ] **Step 1: Write a quick validation test for string match**

Create `tests/cases/match_string.ring`:

```ring
fn describe(s: Str) -> Str {
    match s {
        "hello" => "greeting",
        "bye" => "farewell",
        _ => "unknown",
    }
}

fn main() {
    assert(describe("hello") == "greeting", "match hello")
    assert(describe("bye") == "farewell", "match bye")
    assert(describe("x") == "unknown", "match wildcard")
    print("match_string: all tests passed")
}
```

Register in `tests/e2e.test.ts`:
```typescript
{ file: "match_string.ring", expected: "match_string: all tests passed\n" },
```

Run:
```bash
cd compiler && npm test -- --test-name-pattern="match_string"
```

**If FAIL**: String literal match is not supported. Skip this task (C6), keep if/else chains, report to user. **If PASS**: Continue.

- [ ] **Step 2: Refactor `get_method_names` in derive.ring**

In `compiler/derive.ring`, replace lines 437-456:

```ring
// BEFORE:
fn get_method_names(trait_name: Str) -> List<Str> {
    if trait_name == "Eq" {
        let r = ["eq"]; r.push("ne"); r
    } else {
        if trait_name == "Clone" {
            ["clone"]
        } else {
            if trait_name == "Debug" {
                ["debug"]
            } else {
                if trait_name == "Ord" {
                    ["cmp"]
                } else {
                    let e: List<Str> = []
                    e
                }
            }
        }
    }
}

// AFTER:
fn get_method_names(trait_name: Str) -> List<Str> {
    match trait_name {
        "Eq" => { let r = ["eq"]; r.push("ne"); r },
        "Clone" => ["clone"],
        "Debug" => ["debug"],
        "Ord" => ["cmp"],
        _ => [],
    }
}
```

- [ ] **Step 3: Refactor `register_trait_methods` in derive.ring**

In `compiler/derive.ring`, replace lines 491-513:

```ring
// BEFORE:
    if trait_name == "Eq" {
        // ... 5 lines
    } else {
        if trait_name == "Clone" {
            // ...
        } else {
            if trait_name == "Ord" {
                // ...
            } else {
                if trait_name == "Debug" {
                    // ...
                }
            }
        }
    }

// AFTER:
    match trait_name {
        "Eq" => {
            let eq_fn = Type::FnType { params: [self_type, self_type], return_type: BOOL, effects: EMPTY_ROW }
            methods.insert("eq", TypeScheme { ty: eq_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
            let ne_fn = Type::FnType { params: [self_type, self_type], return_type: BOOL, effects: EMPTY_ROW }
            methods.insert("ne", TypeScheme { ty: ne_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
        },
        "Clone" => {
            let clone_fn = Type::FnType { params: [self_type], return_type: self_type, effects: EMPTY_ROW }
            methods.insert("clone", TypeScheme { ty: clone_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
        },
        "Ord" => {
            let cmp_fn = Type::FnType { params: [self_type, self_type], return_type: INT, effects: EMPTY_ROW }
            methods.insert("cmp", TypeScheme { ty: cmp_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
        },
        "Debug" => {
            let debug_fn = Type::FnType { params: [self_type], return_type: STR, effects: EMPTY_ROW }
            methods.insert("debug", TypeScheme { ty: debug_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
        },
        _ => {},
    }
```

- [ ] **Step 4: Refactor `get_derived_method_names` in codegen_derive.ring**

In `compiler/codegen_derive.ring`, replace lines 5-11:

```ring
// BEFORE:
pub fn get_derived_method_names(trait_name: Str) -> List<Str> {
    if trait_name == "Eq" { ["eq", "ne"] }
    else { if trait_name == "Clone" { ["clone"] }
    else { if trait_name == "Debug" { ["debug"] }
    else { if trait_name == "Ord" { ["cmp"] }
    else { let e: List<Str> = [""]; e.clear(); e } } } }
}

// AFTER:
pub fn get_derived_method_names(trait_name: Str) -> List<Str> {
    match trait_name {
        "Eq" => ["eq", "ne"],
        "Clone" => ["clone"],
        "Debug" => ["debug"],
        "Ord" => ["cmp"],
        _ => [],
    }
}
```

- [ ] **Step 5: Refactor `emit_derived_impl` in codegen_derive.ring**

In `compiler/codegen_derive.ring`, replace lines 13-18:

```ring
// BEFORE:
pub fn emit_derived_impl(var ctx: CodegenCtx, impl_: DerivedImpl) {
    if impl_.trait_name == "Eq" { emit_derived_eq(ctx, impl_) }
    if impl_.trait_name == "Clone" { emit_derived_clone(ctx, impl_) }
    if impl_.trait_name == "Ord" { emit_derived_ord(ctx, impl_) }
    if impl_.trait_name == "Debug" { emit_derived_debug(ctx, impl_) }
}

// AFTER:
pub fn emit_derived_impl(var ctx: CodegenCtx, impl_: DerivedImpl) {
    match impl_.trait_name {
        "Eq" => emit_derived_eq(ctx, impl_),
        "Clone" => emit_derived_clone(ctx, impl_),
        "Ord" => emit_derived_ord(ctx, impl_),
        "Debug" => emit_derived_debug(ctx, impl_),
        _ => {},
    }
}
```

- [ ] **Step 6: Rebuild and run tests**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: 全量通过，纯重构无行为变更。

- [ ] **Step 7: Bootstrap verification**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

- [ ] **Step 8: Commit**

```bash
git add compiler/derive.ring compiler/codegen_derive.ring tests/cases/match_string.ring tests/e2e.test.ts compiler/dist/
git commit -m "refactor(C6): if/else chains → match expressions in derive + codegen_derive"
```

---

### Task A.3: C7 — Module Resolver AST Cache

**问题：** 多文件编译时，每个 .ring 文件被 parse 两次：一次在 `resolver.ring:87`（依赖发现），一次在 `compiler_mod.ring:53`（实际编译）。

**修复：** 让 resolver 在 `ModuleGraph` 中缓存 AST，`compiler_mod.ring` 直接复用。

**Files:**
- Modify: `compiler/resolver.ring:43-115` — ModuleGraph 增加 `asts` 字段，resolve 时缓存
- Modify: `compiler/compiler_mod.ring:36-64` — 从 graph.asts 读取而非重新 parse
- Rebuild: `compiler/dist/*.js`

- [ ] **Step 1: Read current ModuleGraph struct definition**

```bash
grep -n "struct ModuleGraph" compiler/resolver.ring
```

- [ ] **Step 2: Add `asts` field to ModuleGraph**

In `compiler/resolver.ring`, find the `ModuleGraph` struct and add:

```ring
// BEFORE:
pub struct ModuleGraph {
    pub modules: Map<Str, ModuleId>,
    pub dependencies: Map<Str, List<Str>>,
    pub topo_order: List<Str>
}

// AFTER:
pub struct ModuleGraph {
    pub modules: Map<Str, ModuleId>,
    pub dependencies: Map<Str, List<Str>>,
    pub topo_order: List<Str>,
    pub asts: Map<Str, Program>
}
```

- [ ] **Step 3: Update ModuleGraph construction**

Find where `ModuleGraph` is constructed (likely near end of `build_module_graph`). Add `asts: map_new()` to the struct literal.

- [ ] **Step 4: Cache AST during resolve**

In `compiler/resolver.ring`, after `let ast = parse(source, current_mod.file_path, resolve_sink)` (line 87):

```ring
// ADD after parse:
asts.insert(current_key, ast)
```

Initialize `var asts: Map<Str, Program> = map_new()` at the top of the resolve function. Pass it into the ModuleGraph constructor.

- [ ] **Step 5: Update `compiler_mod.ring` to use cached ASTs**

In `compiler/compiler_mod.ring`, replace the "Parse all modules" section (lines 44-64):

```ring
// BEFORE:
            // Parse all modules
            var parse_ok = true
            for key in graph.topo_order {
                if parse_ok {
                    match graph.modules.get(key) {
                        some(mod_) => {
                            let source = read_file(mod_.file_path)
                            let mod_sink = new_collecting_sink()
                            let ast = parse(source, mod_.file_path, mod_sink)
                            if mod_sink.has_errors() {
                                eprintln(format_human(mod_sink.diagnostics(), source))
                                parse_ok = false
                            } else {
                                module_asts.insert(key, ast)
                            }
                        },
                        none => { parse_ok = false },
                    }
                }
            }

// AFTER:
            // Use cached ASTs from resolver
            for key in graph.topo_order {
                match graph.asts.get(key) {
                    some(ast) => { module_asts.insert(key, ast) },
                    none => {},
                }
            }
            let parse_ok = true
```

Note: Parse errors are now caught during resolution. If `build_module_graph` returned `some(graph)`, all files parsed successfully. Remove the `parse` import from `compiler_mod.ring` if no longer used.

- [ ] **Step 6: Rebuild and run tests**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

Expected: 全量通过。多文件测试（如果有）应运行更快。

- [ ] **Step 7: Bootstrap verification**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

- [ ] **Step 8: Commit**

```bash
git add compiler/resolver.ring compiler/compiler_mod.ring compiler/dist/
git commit -m "perf(C7): cache ASTs in module resolver — eliminate double-parse in multi-file compilation"
```

---

### Wave A Merge Checkpoint

所有 3 个 worktree 完成后，依次 merge 回 main：

```bash
# 在 main 分支上
git merge wta1-list-set
git merge wta2-match-refactor
git merge wta3-ast-cache
```

每次 merge 后运行：
```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

如有冲突（极低概率，因为文件无重叠），手工解决后重新 bootstrap。

---

## Wave B — Error Recovery + Code Dedup (2 worktrees)

从 Wave A 合入后的 main 分支出发。B2 触碰 infer.ring/infer_ctx.ring，C5 触碰 types.ring/codegen_derive.ring，两者无文件冲突。

### Task B.1: B2 — Checker 函数内多错误恢复

**当前状态：** Checker 在同一函数体内遇到首个类型错误即停止（通过 `type_error` 调用 `fail.raise`）。声明级恢复已有（it2 B1），但函数体内部仍是首错即停。

**目标：** 表达式/语句级恢复——遇到类型错误时记录诊断、返回 ErrorType 占位、继续检查函数体其余部分。

**策略：** 将 `type_error` 从 `fail.raise()` 改为记录错误 + 返回 ErrorType。在 unification 中，ErrorType 与任何类型 unify 成功（不传播错误）。在推断表达式时，遇到 ErrorType 输入则短路返回 ErrorType。

**Files:**
- Modify: `compiler/types.ring` — 添加 `Type::ErrorType` variant
- Modify: `compiler/infer_ctx.ring` — `type_error` 改为非 fatal，返回 ErrorType
- Modify: `compiler/unify.ring` — ErrorType 与任何类型 unify 成功
- Modify: `compiler/infer.ring` — 关键推断函数处理 ErrorType 输入
- Modify: `compiler/zonk.ring` — zonk ErrorType → ErrorType
- Modify: `compiler/codegen_expr.ring` — 遇 ErrorType 生成 `undefined` 占位
- Create: `tests/cases/error_multi_type.ring`
- Modify: `tests/e2e.test.ts`
- Rebuild: `compiler/dist/*.js`

- [ ] **Step 1: Add `Type::ErrorType` variant**

In `compiler/types.ring`, add to the `Type` enum:

```ring
    ErrorType
```

- [ ] **Step 2: Handle ErrorType in all `match ty` sites**

Search all exhaustive matches on `Type` in the compiler:

```bash
grep -rn "match.*ty\b" compiler/*.ring | grep -v dist
```

Add `Type::ErrorType => ...` arms. In most cases: return ErrorType or skip processing. Key files:
- `types.ring` (`type_to_string`): return `"<error>"`
- `unify.ring` (`unify`): ErrorType unifies with anything — return success
- `zonk.ring` (`zonk_type`): return `Type::ErrorType`
- `infer.ring` / `infer_ctx.ring`: propagate ErrorType through inference

- [ ] **Step 3: Change `type_error` to return ErrorType instead of raising fail**

In `compiler/infer_ctx.ring`, find `type_error`:

```ring
// BEFORE:
pub fn type_error(var ctx: InferCtx, msg: Str, span: Span) -> Never {
    ctx.report_error(E0301(), msg, some(span))
    fail.raise(msg)
    panic("unreachable")
}

// AFTER:
pub fn type_error(var ctx: InferCtx, msg: Str, span: Span) -> Type {
    ctx.report_error(E0301(), msg, some(span))
    Type::ErrorType
}
```

**Warning:** This changes the return type from `Never` to `Type`. ALL callers of `type_error` will need updating — they currently rely on `Never` to prove dead code after the call. Each call site needs restructuring:

```ring
// BEFORE (typical pattern):
    type_error(ctx, "msg", span)
    // unreachable code, but compiler was happy because Never

// AFTER:
    return type_error(ctx, "msg", span)
    // or: let _ = type_error(ctx, "msg", span); continue with ErrorType logic
```

Identify all callers:
```bash
grep -rn "type_error(" compiler/*.ring | grep -v dist
```

Update each call site to handle the `Type` return value appropriately.

- [ ] **Step 4: Update unify to handle ErrorType**

In `compiler/unify.ring`, at the top of the `unify` function, add early return:

```ring
pub fn unify(var ctx: InferCtx, t1: Type, t2: Type, span: Span) -> Type {
    // ErrorType absorbs errors — never fails
    match t1 { Type::ErrorType => { return Type::ErrorType }, _ => {} }
    match t2 { Type::ErrorType => { return Type::ErrorType }, _ => {} }
    // ... rest of existing unify logic
}
```

- [ ] **Step 5: Write multi-error test**

Create `tests/cases/error_multi_type.ring`:

```ring
fn main() {
    let x: Int = "hello"
    let y: Str = 42
    let z = x + y
}
```

Register as negative test:
```typescript
{ file: "error_multi_type.ring", error_pattern: "E0301" },
```

Add a specific test verifying multiple errors are reported:
```typescript
test("reports multiple type errors in one function", () => {
    const result = ring_check(path.join(CASES_DIR, "error_multi_type.ring"));
    assert.strictEqual(result.success, false);
    const errorCount = (result.error_output.match(/E0301/g) || []).length;
    assert.ok(errorCount >= 2, `Expected at least 2 type errors, got ${errorCount}`);
});
```

- [ ] **Step 6: Rebuild and run tests**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

- [ ] **Step 7: Bootstrap verification**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

- [ ] **Step 8: Commit**

```bash
git add compiler/types.ring compiler/infer_ctx.ring compiler/unify.ring compiler/infer.ring compiler/zonk.ring compiler/codegen_expr.ring tests/cases/error_multi_type.ring tests/e2e.test.ts compiler/dist/
git commit -m "feat(B2): checker function-level multi-error recovery — ErrorType absorbs and continues"
```

---

### Task B.2: C5 — 代码去重

**目标：** 消除编译器中两类主要重复：`types_equal`（148 行硬编码类型比较）和 HOF inline 模式（~100 行重复）。

**前置：** A1(空列表 `[]`) 和 A2(tuple `.0`/`.1`) 已在 it1 完成，C6(match 重构) 已在 Wave A 完成——这些为去重提供了更简洁的表达方式。

**Files:**
- Modify: `compiler/types.ring` — 重构 `types_equal`
- Modify: `compiler/codegen_derive.ring` — 提取 HOF inline 重复模式
- Modify: `compiler/infer.ring` — 如有重复的类型比较逻辑
- Rebuild: `compiler/dist/*.js`

- [ ] **Step 1: Audit `types_equal` in types.ring**

```bash
grep -n "fn types_equal" compiler/types.ring
```

Read the full function. Identify which branches are structurally identical (e.g., `Named` vs `Named` comparison that's just recursive on args).

- [ ] **Step 2: Refactor `types_equal` using helper functions**

Extract repeated patterns into helpers. Example:

```ring
fn lists_equal(a: List<Type>, b: List<Type>) -> Bool {
    if a.len() != b.len() { return false }
    var i = 0
    for x in a {
        match b.get(i) {
            some(y) => { if types_equal(x, y) == false { return false } },
            none => { return false },
        }
        i = i + 1
    }
    true
}
```

Then each branch in `types_equal` that compares type argument lists calls `lists_equal` instead of repeating the loop.

- [ ] **Step 3: Audit HOF inline patterns in codegen_derive.ring**

```bash
grep -n "emit_derived" compiler/codegen_derive.ring | head -20
```

Identify repeated patterns across `emit_derived_eq`, `emit_derived_clone`, `emit_derived_debug`, `emit_derived_ord`. Common patterns:
- Field iteration + codegen
- Enum variant tag check + dispatch
- Bound param passing

- [ ] **Step 4: Extract common codegen helpers**

Create helper functions for shared patterns. Example:

```ring
fn emit_field_loop(var ctx: CodegenCtx, fields: List<DerivedField>, sep: Str, fn_body: fn(CodegenCtx, DerivedField) -> Unit) {
    // shared field iteration + separator logic
}
```

**Note:** Exact refactoring depends on how much commonality exists. The agent should identify the top 3-4 most repeated patterns and extract those. Don't over-abstract — only extract if 3+ call sites share the pattern.

- [ ] **Step 5: Rebuild and run tests**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

- [ ] **Step 6: Bootstrap verification**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

- [ ] **Step 7: Commit**

```bash
git add compiler/types.ring compiler/codegen_derive.ring compiler/dist/
git commit -m "refactor(C5): deduplicate types_equal + codegen_derive patterns"
```

---

### Wave B Merge Checkpoint

```bash
git merge wtb1-checker-multi-error
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test

git merge wtb2-code-dedup
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

---

## Wave C — Core Architecture (sequential, main branch)

C3 是 Phase 3 最大的单体重构，影响面广。在 main 分支上直接执行，不用 worktree。

### Task C.1: C3 — TypeEnv 拆分

**当前状态：** `TypeEnv` 是 15 个 public mutable 字段的 god object（`compiler/env.ring:104-120`）。所有编译器阶段通过 TypeEnv 访问类型注册、作用域、trait 注册等全部状态。

**目标：** 按职责拆分为子结构，TypeEnv 降级为 facade。

**拆分方案（三阶段）：**

**阶段 1 — 提取只读查询接口（不改外部 API）：**

```ring
pub struct TypeRegistry {
    pub structs: Map<Str, StructDef>,
    pub enums: Map<Str, EnumDef>,
    pub effects: Map<Str, EffectDef>,
    pub variant_to_enum: Map<Str, Str>,
    pub type_aliases: Map<Str, TypeAliasDef>
}

pub struct TraitRegistry {
    pub traits: Map<Str, TraitDef>,
    pub trait_impls: List<ImplEntry>,
    pub impl_methods: Map<Str, Map<Str, TypeScheme>>
}

pub struct ScopeManager {
    pub scopes: List<Scope>,
    pub fn_bounds: Map<Str, List<FnBound>>,
    pub var_bounds: Map<Int, Set<Str>>,
    pub def_spans: Map<Int, Span>,
    pub mutable_vars: Set<Int>
}

pub struct IdGen {
    pub next_type_var_id: Int,
    pub next_def_id: Int
}
```

**阶段 2 — TypeEnv 变为 facade：**

```ring
pub struct TypeEnv {
    pub types: TypeRegistry,
    pub traits: TraitRegistry,
    pub scope: ScopeManager,
    pub ids: IdGen
}
```

**阶段 3 — 迁移访问路径：**

所有 `env.structs` → `env.types.structs`，所有 `env.traits` → `env.traits_reg.traits` 等。

**Files:**
- Modify: `compiler/env.ring` — 定义子结构、改 TypeEnv 为 facade
- Modify: 所有引用 TypeEnv 字段的文件（~15 个 .ring 文件）
- Rebuild: `compiler/dist/*.js`

**实现原则：**
- 每个阶段完成后都要 bootstrap + 全量测试
- 用编译器的穷尽匹配帮助发现遗漏（如果新增 enum variant）
- 搜索所有 `env.structs`、`env.enums` 等直接字段访问，逐一迁移

- [ ] **Step 1: Define sub-structs in env.ring (keep old TypeEnv intact)**

Add the 4 new structs above TypeEnv. Don't modify TypeEnv yet — this is additive.

- [ ] **Step 2: Add constructor functions for sub-structs**

- [ ] **Step 3: Change TypeEnv to use sub-structs**

Replace the 15 fields with 4 sub-struct fields. Add facade methods for backwards-compatible access.

- [ ] **Step 4: Migrate callers batch by batch**

Work through files alphabetically. Each file:
1. Update field access paths
2. Rebuild: `node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist`
3. Fix compile errors
4. Run tests: `cd compiler && npm test`
5. Commit when 3-4 files are migrated

- [ ] **Step 5: Remove facade methods**

Once all callers use direct sub-struct access, remove any temporary facade methods.

- [ ] **Step 6: Final bootstrap verification**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

- [ ] **Step 7: Commit**

```bash
git add compiler/env.ring compiler/*.ring compiler/dist/
git commit -m "refactor(C3): split TypeEnv into TypeRegistry + TraitRegistry + ScopeManager + IdGen"
```

---

## Wave D — Performance + Polish (3 worktrees)

从 C3 合入后的 main 分支出发。三个 worktree 分别触碰不同子系统，文件冲突极低。

### Task D.1: C4 — Substitution Union-Find

**当前状态：** Substitution 是 `Map<Int, Type>`（`compiler/unify.ring:13`）。每次 unify 操作通过 `apply_subst` 全量遍历+复制整个 Map，O(n²)。

**目标：** 替换为 union-find 数据结构，O(α(n)) 近乎常数时间。

**策略：**
1. 定义 `UnionFind` struct（parent array + rank array + type store）
2. 实现 `find`（路径压缩）、`union`（按秩合并）、`bind`（绑定 type var 到具体类型）
3. 替换 `empty_subst` / `apply_subst` / `apply_subst_row` 的内部实现
4. 保持外部 API 不变——`InferCtx.subst` 类型从 `Map<Int, Type>` 变为 `UnionFind`

**Files:**
- Create: `compiler/union_find.ring` — UnionFind 数据结构
- Modify: `compiler/unify.ring` — 使用 UnionFind 替代 Map
- Modify: `compiler/infer_ctx.ring` — subst 字段类型变更
- Modify: `compiler/env.ring` — `apply_subst` 签名可能变化
- Rebuild: `compiler/dist/*.js`

- [ ] **Step 1: Create `compiler/union_find.ring`**

```ring
pub struct UnionFind {
    parent: Map<Int, Int>,
    rank: Map<Int, Int>,
    types: Map<Int, Type>
}

pub fn new_union_find() -> UnionFind {
    UnionFind {
        parent: map_new(),
        rank: map_new(),
        types: map_new()
    }
}

pub fn uf_find(var uf: UnionFind, id: Int) -> Int {
    match uf.parent.get(id) {
        none => id,
        some(p) => {
            if p == id { return id }
            let root = uf_find(uf, p)
            uf.parent.insert(id, root)
            root
        },
    }
}

pub fn uf_union(var uf: UnionFind, a: Int, b: Int) {
    let ra = uf_find(uf, a)
    let rb = uf_find(uf, b)
    if ra == rb { return }
    let rank_a = match uf.rank.get(ra) { some(r) => r, none => 0 }
    let rank_b = match uf.rank.get(rb) { some(r) => r, none => 0 }
    if rank_a < rank_b {
        uf.parent.insert(ra, rb)
    } else {
        if rank_a > rank_b {
            uf.parent.insert(rb, ra)
        } else {
            uf.parent.insert(rb, ra)
            uf.rank.insert(ra, rank_a + 1)
        }
    }
}

pub fn uf_bind(var uf: UnionFind, id: Int, ty: Type) {
    let root = uf_find(uf, id)
    uf.types.insert(root, ty)
}

pub fn uf_lookup(var uf: UnionFind, id: Int) -> Type? {
    let root = uf_find(uf, id)
    uf.types.get(root)
}
```

- [ ] **Step 2: Replace subst in InferCtx**

In `compiler/infer_ctx.ring`, change:
```ring
// BEFORE:
pub subst: Map<Int, Type>

// AFTER:
pub subst: UnionFind
```

- [ ] **Step 3: Update `apply_subst` to use UnionFind**

In `compiler/env.ring` (or wherever `apply_subst` lives):

```ring
pub fn apply_subst(var uf: UnionFind, ty: Type) -> Type {
    match ty {
        Type::TypeVar { id, name } => {
            match uf_lookup(uf, id) {
                some(resolved) => apply_subst(uf, resolved),
                none => ty,
            }
        },
        // ... recursive cases stay the same, just pass uf instead of subst map
    }
}
```

- [ ] **Step 4: Update unify to use uf_bind instead of map insert**

In `compiler/unify.ring`, replace `ctx.subst.insert(id, ty)` with `uf_bind(ctx.subst, id, ty)`.

- [ ] **Step 5: Update all callers of apply_subst**

```bash
grep -rn "apply_subst" compiler/*.ring | grep -v dist
```

Update each call site to pass `ctx.subst` (which is now `UnionFind` instead of `Map`).

- [ ] **Step 6: Rebuild and run tests**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

- [ ] **Step 7: Bootstrap verification + performance check**

```bash
# Time the bootstrap
powershell -c "Measure-Command { node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist }" 
cd compiler && npm test
```

- [ ] **Step 8: Commit**

```bash
git add compiler/union_find.ring compiler/unify.ring compiler/infer_ctx.ring compiler/env.ring compiler/dist/
git commit -m "perf(C4): union-find substitution — O(α(n)) type variable resolution"
```

---

### Task D.2: B3 + B4 — 诊断质量提升 + error-format=llm 增强

B3 和 B4 有依赖关系（B3 → B4），在同一 worktree 中顺序执行。

**B3 目标：** 为高频错误码添加 "did you mean..." 建议、常见误用提示。

**B4 目标：** `--error-format=llm` 输出增加修复建议字段和错误分类标签。

**Files:**
- Modify: `compiler/diagnostics.ring` — Diagnostic struct 增加 `suggestion` 和 `category` 字段
- Modify: `compiler/formatter.ring` — format_human 和 format_llm 输出建议
- Modify: `compiler/infer_ctx.ring` — type_error 添加建议逻辑
- Modify: `compiler/cli.ring` — 如需传递新选项
- Modify: `compiler/codes.ring` — 错误码分类
- Create: `tests/cases/error_suggestions.ring`
- Modify: `tests/e2e.test.ts`
- Rebuild: `compiler/dist/*.js`

**B3 部分：**

- [ ] **Step 1: Extend Diagnostic struct**

In `compiler/diagnostics.ring`, add fields:

```ring
// BEFORE:
pub struct Diagnostic {
    pub code: Str,
    pub severity: Severity,
    pub message: Str,
    pub span: Span?,
    pub file: Str
}

// AFTER:
pub struct Diagnostic {
    pub code: Str,
    pub severity: Severity,
    pub message: Str,
    pub span: Span?,
    pub file: Str,
    pub suggestion: Str?,
    pub category: Str?
}
```

- [ ] **Step 2: Update all Diagnostic construction sites**

```bash
grep -rn "Diagnostic {" compiler/*.ring | grep -v dist
```

Add `suggestion: none, category: none` to each construction site.

- [ ] **Step 3: Add suggestions for common errors**

In `compiler/infer_ctx.ring`, enhance `type_error` to detect common patterns:

```ring
pub fn type_error(var ctx: InferCtx, msg: Str, span: Span) -> Type {
    ctx.report_error_with_suggestion(E0301(), msg, some(span), infer_suggestion(msg))
    Type::ErrorType
}

fn infer_suggestion(msg: Str) -> Str? {
    if msg.contains("Str") && msg.contains("Int") {
        return some("Use parse_int() to convert Str to Int, or .to_str() for Int to Str")
    }
    if msg.contains("Option") && msg.contains("unwrap") {
        return some("Use match or .unwrap_or() to handle the None case")
    }
    none
}
```

- [ ] **Step 4: Update format_human to show suggestions**

In `compiler/formatter.ring`, after the main error message line:

```ring
match d.suggestion {
    some(s) => {
        lines.push("  help: ${s}")
    },
    none => {},
}
```

- [ ] **Step 5: Write test for suggestions**

Create `tests/cases/error_suggestions.ring`:

```ring
fn main() {
    let x: Int = "hello"
}
```

Verify the output includes a suggestion line. Test via `--error-format=llm` JSON check.

**B4 部分：**

- [ ] **Step 6: Enhance format_llm with new fields**

In `compiler/formatter.ring`, update `format_llm` to include suggestion and category:

```ring
// In the JSON object construction for each diagnostic:
if d.suggestion.is_some() {
    parts.push("\"suggestion\": \"${escape_json(d.suggestion.unwrap_or(""))}\", ")
}
if d.category.is_some() {
    parts.push("\"category\": \"${escape_json(d.category.unwrap_or(""))}\", ")
}
```

- [ ] **Step 7: Add error categories to codes.ring**

```ring
pub fn error_category(code: Str) -> Str {
    if code.starts_with("E01") { return "parse" }
    if code.starts_with("E02") { return "resolution" }
    if code.starts_with("E03") { return "type" }
    if code.starts_with("E04") { return "effect" }
    if code.starts_with("E05") { return "pattern" }
    if code.starts_with("E06") { return "import" }
    if code.starts_with("E07") { return "semantic" }
    "unknown"
}
```

- [ ] **Step 8: Rebuild and run tests**

```bash
node compiler/dist/main.js build compiler/main.js --out-dir=compiler/dist
cd compiler && npm test
```

- [ ] **Step 9: Commit**

```bash
git add compiler/diagnostics.ring compiler/formatter.ring compiler/infer_ctx.ring compiler/codes.ring compiler/cli.ring tests/ compiler/dist/
git commit -m "feat(B3+B4): diagnostic suggestions + error categories + enhanced --error-format=llm"
```

---

### Task D.3: C9 — `panic()` → DiagnosticSink（部分）

**当前状态：** 编译器中有 ~68 处 `panic()` 调用，其中 ~40 是 unreachable guards（合法），~28 是可恢复的错误点。

**目标：** 将可恢复的 panic 替换为 DiagnosticSink 报错。保留 unreachable guards 中的 panic。

**策略：** 逐文件扫描，分类每个 panic：
- `unreachable`: 保留（match 兜底、内部一致性断言）
- `recoverable`: 改为 `ctx.report_error(...)` + 返回默认值或 ErrorType

**Files:**
- Modify: ~10-15 个 compiler/*.ring 文件中的可恢复 panic
- Rebuild: `compiler/dist/*.js`

- [ ] **Step 1: Audit all panic sites**

```bash
grep -rn "panic(" compiler/*.ring | grep -v dist | grep -v "unreachable"
```

分类每个 panic：标注为 `[unreachable]` 或 `[recoverable]`。

- [ ] **Step 2: Convert recoverable panics in codegen files**

Codegen 阶段的 panic 通常是"遇到了 checker 应该拦截的非法状态"。这些可以改为生成一个 JS 注释 + console.error：

```ring
// BEFORE:
    panic("unexpected type in codegen")

// AFTER:
    emit(ctx, "/* codegen error: unexpected type */ undefined")
```

- [ ] **Step 3: Convert recoverable panics in checker files**

Checker 阶段的 panic 可以改为 `type_error` + ErrorType（利用 B2 的基础设施）：

```ring
// BEFORE:
    panic("expected struct type, got something else")

// AFTER:
    type_error(ctx, "expected struct type", span)
```

- [ ] **Step 4: Rebuild and run tests after each batch**

每处理 3-5 个 panic 后：
```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

- [ ] **Step 5: Final commit**

```bash
git add compiler/*.ring compiler/dist/
git commit -m "refactor(C9): convert ~25 recoverable panics to diagnostic errors"
```

---

### Wave D Merge Checkpoint

```bash
git merge wtd1-union-find
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test

git merge wtd2-diagnostics
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test

git merge wtd3-panic-cleanup
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

---

## Exit Criteria Verification

Wave D 全部合入后，检查 Phase 3 退出标准：

| # | 标准 | 验证方法 |
|---|------|---------|
| E1 | E2E 测试全部通过 | `cd compiler && npm test` — 0 failures |
| E2 | Parser 错误恢复 | it2 B1 已完成 ✓ |
| E3 | 语言 gotcha 消除 | A5(it3) + A7(Wave A) 已完成 ✓ |
| E4 | 最大文件行数 < 1500 | `wc -l compiler/infer.ring` — C2(it3) 已拆分 ✓ |
| E5 | TypeEnv 拆分 | C3(Wave C) 已完成 ✓ |
| E6 | Substitution O(α(n)) | C4(Wave D) 已完成 ✓ |
| E7 | 编译器 boilerplate 消除 | A3(it2 const) + A1/A2(it1) 已完成 ✓ |

```bash
# Final bootstrap verification
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

---

## Documentation Update

- [ ] **Update CLAUDE.md:** 测试数量、已知限制、已实现功能、项目结构（新文件 union_find.ring, infer_decl.ring）
- [ ] **Update docs/design.md:** 实现状态附录
- [ ] **Delete completed plan files:** 本文件 + it3 plan + it2 plan
- [ ] **Commit:**

```bash
git add CLAUDE.md docs/design.md
git commit -m "docs: Phase 3 complete — all exit criteria met"
```
