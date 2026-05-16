# Phase 2 Session 1 Trait System Review

**日期**: 2026-05-16  
**审查方法**: Claude Agent + DeepSeek V4 Pro + 手工测试三方交叉验证  
**审查范围**: commits `1b4ad48..1af5b7d` (4 feat + 1 fix + 1 docs)

---

## Critical Bugs（3 个，全部运行验证）

### Bug #1：多类型参数同 trait 时字典参数名重复 + 字典解析错误

**文件**: `compiler/src/codegen/codegen.ts:119` + `compiler/src/checker/infer.ts:920-933`

**复现**: `tests/scratch/multi_tp.ring`
```ring
fn both<T: Show, U: Show>(x: T, y: U) -> Str { x.show() }
```

**生成的 JS**:
```js
function both(x, y, __Show, __Show) { ... }  // SyntaxError: Duplicate parameter
both(new A(1), new B("x"), A_Show, A_Show)   // A_Show 传了两次！
```

**两个 bug 叠加**:
1. Codegen 用 `__${trait_name}` 命名，不含类型参数名 → 重复参数名
2. `infer_call` 对每个 bound 全量扫描 args 取第一个匹配 → 两次都取到 arg[0] 的类型

**修复方案**: 改命名为 `__${type_param}_${trait_name}`（如 `__T_Show`, `__U_Show`），重写 resolution 逻辑按 type param var ID 定位对应 arg

---

### Bug #2：同名方法跨 trait impl 的 JS 命名冲突

**文件**: `compiler/src/codegen/codegen.ts:164-166`

**复现**: `tests/scratch/diamond.ring`
```ring
trait A { fn name(self) -> Str }
trait B { fn name(self) -> Str }
impl A for Thing { fn name(self) -> Str { "from-A" } }
impl B for Thing { fn name(self) -> Str { "from-B" } }
```

**生成的 JS**:
```js
function Thing_name(self) { return "from-A"; }  // impl A
function Thing_name(self) { return "from-B"; }  // SyntaxError: already declared!
```

**根因**: `emit_impl_decl` 调 `emit_fn_decl(method, decl.target_type)` 生成 `${Type}_${method}`，不含 trait 名

**修复方案**: trait impl 的方法名改为 `${Type}_${Trait}_${method}`（如 `Thing_A_name`）

---

### Bug #3：未实现 trait 的类型传入 bounded 泛型函数时无编译报错

**文件**: `compiler/src/checker/infer.ts:917-953`

**复现**: `tests/scratch/dict_not_found.ring`
```ring
trait Show { fn show(self) -> Str }
struct Point { x: Int }  // 没有 impl Show for Point
fn display<T: Show>(x: T) -> Str { x.show() }
fn main() { print(display(Point { x: 1 })) }  // 编译通过！运行时 TypeError
```

**根因**: dictionary resolution 是"尽力而为"——找不到匹配就跳过，`resolved_dicts` 保持为空

**修复方案**: 在 `infer_call` 的 resolution 循环后，若 `resolved_dicts.length < bounds_list.length` 则报编译错误

---

## Important Issues（4 个）

### Issue #4：`self_var` 不在 `type_param_vars` 中

**文件**: `compiler/src/checker/infer.ts:295`

`register_trait` 为所有方法创建一个共享 `self_var`，但不加入 `type_param_vars`。`instantiate` 时不会 freshen 这个 var，多次调用同一 trait 方法可能产生 stale unification。

**当前状态**: 由于具体类型走 `impl_methods` 路径，泛型类型走 dict_dispatch，此 bug 暂未被触发。但随着 trait 功能扩展将暴露。

---

### Issue #5：Trait bound 中的 trait 名不验证存在性

**文件**: `compiler/src/checker/infer.ts:378-387`

`fn foo<T: NonExistent>(x: T)` 可以通过编译，拼写错误不会被捕获。

---

### Issue #6：Default method body 被解析但静默丢弃

**文件**: `compiler/src/checker/infer.ts:479-497`

Parser 正确解析 default method body，`has_default` 标记也正确，但 checker 和 codegen 完全不处理 body 内容。用户写的 default 实现代码静默失效。

---

### Issue #7：高阶函数传递 bounded fn 时字典不传递

**文件**: `compiler/src/checker/infer.ts:917`

Dictionary resolution 只在 `callee.kind === "ident"` 时触发。`let f = display; f(x)` 不会传字典。

---

## Minor Issues（5 个）

| # | 问题 | 文件 |
|---|------|------|
| 8 | `supertraits` AST 字段永远为空，未解析未检查 | parser.ts:294 |
| 9 | Method call 参数数量不校验 | infer.ts:1056 |
| 10 | `gen_call` dict_dispatch fallback `args[0]` 不安全 | codegen.ts:295 |
| 11 | `fn_bounds` 用函数名做 key，模块系统后冲突 | env.ts:89 |
| 12 | Diamond 场景 `impl_methods` 后注册覆盖先注册无冲突检测 | env.ts:85 |

---

## 总体评估

**基础架构正确**：dictionary passing 概念、两阶段注册、方法解析优先级链（impl_methods → trait_impls → dict_dispatch）设计合理。

**命名 scheme 有缺陷**：假设了 trait name 在函数签名中唯一，未处理 N:1（多类型参数同 trait）场景。

**修复优先级**：Bug #1 > Bug #2 > Bug #3 > Issue #5 > Issue #4 > Issue #6

**结论**：修完 3 个 Critical bug 后可安全进入 Phase 2 Session 2。
