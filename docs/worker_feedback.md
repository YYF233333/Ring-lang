# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-086 LLVM 缺失 runtime 原语

### 1. enumerate / to_int / to_float 是否该成为 Ring 方法？[决策]

**现状**：B-086 spec（源自 audit Agent D）说这三个是"codegen 已映射，只差 runtime"。Worker 核查发现**错**——checker 没注册这三个为方法，`.enumerate()/.to_int()/.to_float()` 在 JS 和 LLVM 两后端都类型检查失败（E0305 "Type has no method"）。`infer_ctx.ring:98-105` 把 Str→Int 导向自由函数 `parse_int()` 而非 `.to_int()` 方法。所以它们在 Ring 语言里**不存在**，codegen 映射是死映射，runtime 实现无法被任何 .ring 程序触达、也无法差分测试。
**原因**：Agent D 只查了 codegen 的 method→runtime 映射表，没查 checker 的 builtin 方法注册（`builtins.ring`）。
**已动作**：撤回这三个的 runtime stub（不留无法测试的死代码），flat_map 正常合入。
**待决策**：Ring 是否要把这三个加成正式方法？
- (A) 加 `.enumerate()`（迭代器常用）——需 `builtins.ring` 注册方案 + codegen 映射（已有）+ runtime + 差分。设计扩展。
- (B) 加 `.to_int()/.to_float()`——但 Ring 已有 `parse_int()/parse_float()` 自由函数覆盖，加方法是 API 冗余。
- (C) 都不加，保持现状。并清掉 codegen 里的死映射（`codegen_llvm_expr.ring:1405/1406/1448`）以免误导后续。
推荐：enumerate 走 A 或 C，to_int/to_float 倾向 C（避免与 parse_* 冗余）。

### 2. find_index / fold 是真正的 native E2E 阻塞 gap [通知]

验收 E2E `list_flat_map.ring` 还用了 `find_index`、`list_method_chain.ring` 还用了 `fold`——两者在 JS 后端是真 builtin（能跑）但 LLVM 后端没映射+没 runtime。已设为 B-086 的剩余范围（dispatch 升级 judgment，因要改编译器源码）。flat_map 本身两后端已通。

### 3. 新 worktree 缺 LLVM N-API addon [通知]

`compiler/llvm-addon/` 是 .gitignore 的本地构建产物，新建的 worktree 里没有 `.node`，agent 要先 `node-gyp rebuild`（B-086 agent 已自行处理）才能跑 `npm run test:llvm`。后续每个跑 test:llvm 的 worktree agent 都会遇到——可在 prompt 里提前提示先 build addon，或 orchestrator 预构建。

## B-088 双后端差分覆盖扩展 — 发现的 LLVM 发散（喂给 B-087）

> B-088 给 7 个高发散风险特性各写自包含差分用例，先确认 JS 后端（oracle）能跑，再在 LLVM 后端对比。
> 锁定了 6 个 parity 用例（已 commit）：`delegate_effects`、`map_string_key_dispatch`、`option_methods`、
> `result_enum_chain`（first-order 形式）、`string_interp`、`struct_update_enum`。
> 下面是 bisect 出来的真实发散——每条都是 JS 正确跑、LLVM 崩溃/丢输出/误编译。最小复现已自包含。

### 1. 自定义 effect handler 在 LLVM 后端整体损坏 [通知]
**特性**：custom effect 声明 + handler（`effect E { fn op() -> T }` + `handle {...} with { E.op() => ... }`）。
**JS**：正常（E2E 68 例全过）。**LLVM**：根本不工作，两种症状：
- 返回值的 op（`fn get_name() -> Str`）：handler resume 时 `str_from_cstr` 段错误（`code=0xc0000005`，`chk=1`）。
- `Unit` op + handler body 有副作用（`Logger.log(msg) => print(msg)`）：**静默丢输出**——LLVM exit 0 但什么都不打印，JS 打印 `hello\nworld`。
- 多 op handler、嵌套 handler 同样崩。
**最小复现**（崩）：
```
effect Config { fn get_name() -> Str }
fn describe() -> Str { "name=${Config.get_name()}" }
fn main() {
    let d = handle { describe() } with { Config.get_name() => "app" }
    print(d)   // JS: name=app ; LLVM: CRASH str_from_cstr
}
```
**最小复现**（丢输出）：
```
effect Logger { fn log(msg: Str) -> Unit }
fn main() {
    handle { Logger.log("hi") } with { Logger.log(m) => print(m) }
    // JS: hi ; LLVM: (无输出，exit 0)
}
```
**影响**：custom-effect 是 G-c 大类，68 E2E 零 native 覆盖，现确认 LLVM 完全没实现/误编译。因为特性本身不工作，这一类**没法锁 parity 用例**。`fail/catch` 走 ring_try 是独立路径、正常（`fail_catch.ring` 已覆盖）；坏的是非 fail 的 tail-resumptive handler lowering。

### 2. boxed 可变 cell 闭包捕获在 LLVM 后端 UAF [通知]
**特性**：闭包写穿捕获 `let mut`（auto-boxing cell）。
**JS**：正常（`auto_boxing_closure.ring` 等 E2E）。**LLVM**：确定性 use-after-free。
**最小复现**（就是 `auto_boxing_closure.ring` 的核心，必崩）：
```
fn main() {
    let mut c = 0
    let inc = fn() { c = c + 1 }
    inc(); inc(); inc()
    print("c: ${c}")   // JS: c: 3 ; LLVM: ring panic: use-after-free detected!
}
```
把这种闭包作为参数传过调用边界（`each(xs, fn(v){ sum = sum + v })`）、或工厂返回 counter（`make_counter()`）并交替调用，同样 UAF。
**根因方向**：Perceus 把 boxed mut cell 当 last-use move 掉了，闭包还持有引用 → 释放后再用。现有 LLVM 差分用例只覆盖**不可变**堆值捕获（`closure_capture_move/loop/nonloop`），boxed-mut-cell 写穿路径零覆盖且坏。这一类**没法锁 parity 用例**（连最简单的本地 mut 闭包都崩）。

### 3. 泛型 trait-method dispatch（经类型参数）在 LLVM 后端崩 [通知]
**特性**：`fn f<T: Trait>(x: T)` 里调用 `x.method()`（dict-passing 单态化派发），以及泛型 `Ord` 派发。
**JS**：正常。**LLVM**：
- 用户 trait 经类型参数派发（哪怕单方法）：`str_from_cstr` 段错误。
  ```
  trait Named { fn name(self) -> Str }
  struct Cat { n: Str }
  impl Named for Cat { fn name(self) -> Str { self.n } }
  fn show<T: Named>(x: T) -> Str { x.name() }
  fn main() { print(show(Cat { n: "felix" })) }  // JS: felix ; LLVM: CRASH
  ```
- 泛型 `Ord` 派发：`ring: no builtin dict for '__Int_Ord'`（runtime 缺 Ord builtin dict，只注册了 Eq）。
  ```
  fn larger<T: Ord>(a: T, b: T) -> T { if a > b { a } else { b } }
  fn main() { print("${larger(7, 12)}") }  // JS: 12 ; LLVM: no builtin dict __Int_Ord + crash
  ```
**已覆盖的好路径**：经 `==` 的 Eq 操作符派发正常（`generic_eq_dispatch.ring`）；string-key Map 派发正常（新增 `map_string_key_dispatch.ring`）。坏的是**用户 trait 经 `<T: Trait>` 的方法派发**和 **builtin `Ord` 的 `__T_Ord` dict**。

### 4. delegate 转发自定义 effect 在 LLVM 后端丢失 [通知]
**特性**：delegate 转发的 trait 方法内部 raise 自定义 effect，外层 handler 拦截。
**JS**：handler 拦到、打印 audit 行。**LLVM**：方法本体跑了（io 副作用 print 正常），但**自定义 effect 被静默丢弃**——外层 handler 的 `Audit.record(t) => print("audit: ${t}")` 不触发，audit 行消失。
（这是 #1 custom-effect 损坏在 delegate 路径上的表现。）
**已锁的好路径**：delegate 转发**纯 io** 方法（带参、调 sibling 方法）正常 → 新增 `delegate_effects.ring` 锁这一段。

### 5. Option.to_fail() 在 LLVM 后端未实现 [通知]
`some/none` 的 `.to_fail("msg")`（none → fail effect）：JS 正常，LLVM `ring panic: LLVM: missing method 'Option.to_fail'`。codegen/runtime 没映射这个方法。Option 的 `map/unwrap_or/is_none/is_some` 正常（新增 `option_methods.ring` 覆盖）。

### 6. 用户 enum 的高阶组合子（传闭包）在 LLVM 后端间歇崩 [通知]
**特性**：用户 enum（如 `Res::Ok/Err`）的 `and_then`/`map_ok` 接收 `fn(v) {...}` 闭包做链式。
**JS**：正常。**LLVM**：**间歇** double-free / `str_from_cstr` 崩（standalone 压测 ~2/200，全 suite 里更易触发 ~1/3 概率整跑挂）。输出大多正确，偶发释放越界。
**最小复现**（间歇崩，需多跑几次）：
```
enum Res { Ok(Int), Err(Str) }
impl Res { fn and_then(self, f: fn(Int) -> Res) -> Res { match self { Res::Ok(v) => f(v), Res::Err(e) => Res::Err(e) } } ... }
fn step(x: Int) -> Res { if x < 100 { Res::Ok(x * 2) } else { Res::Err("too big") } }
fn main() { print(step(10).and_then(fn(v) { step(v) }).map_ok(fn(v) { v + 1 }).show()) }
```
**根因方向**：enum payload + 闭包参数的 RC 不平衡（dup/drop 竞态/重复 drop）。**注意这是间歇 bug**，不能靠单跑判定；写差分用例时改成 first-order（手写 match 链、不传闭包）才稳定 → 新增 `result_enum_chain.ring` 用 first-order 形式锁住 enum 构造/match-payload parity。
**额外观察**：Option-method 链（`.map(fn(s){...})`）与 user-enum 高阶链**混在同一程序**时更易触发 double-free；拆成两个用例后各自稳定（300x 零失败）。

**字符串插值**：基础/嵌套/match-arm/方法调用全部 parity（新增 `string_interp.ring` 锁定）；唯一没覆盖的"effect 驱动求值顺序"因为依赖 #1 的 custom-effect handler（坏），等 #1 修好再补。
**struct update / 复杂 enum 变体**：完全 parity（新增 `struct_update_enum.ring`，含嵌套 struct update + 递归 enum 变体重建）。

## B-084 Perceus drop 精度 + drop_T 完整性

### 1. #131 已完整修复（96 rc-warn → 0）[通知]

带 RC pass 自编译的 96 处 `[rc-warn] Drop: variable 'X' not found in named_values` 全部消除，根因有两类，都已修：

- **`_` 通配符（14 处）**：perceus 给 `let _ = ...` / `let (_, x) = ...` 的 destructure 绑定、`for _ in` 绑定生成 `Drop _`，但 codegen 故意跳过 `_` 不入 named_values → 漏 drop 警告。修在 `perceus.ring`：新增 `rc_name_skippable("_")`，所有 Drop/Dup 生成点（Let/Var/LetDestructure/param/loop-var dup/make_drop_list/dups_to_stmts）统一跳过 `_`。`_` 是 discard，值的所有权随 scrutinee 自身的 RC 走，没有独立绑定需要释放，跳过是语义正确的。
- **闭包隔离导致的"跨分支 drop 落空"（82 处，含 `f`×39/`ctx`/`decl`/`span`/`sink`/`notes`/`env`/`body` 等）**：根因是 perceus 的 TryCatch / HandleExpr 分支平衡把一个**外层变量**的 `Drop` 插进 body 或 catch arm，而 codegen 把 body 和 catch arm 各自降级成**独立闭包**（`gen_lambda` / `gen_catch_closure`），闭包有自己的 named_values，只 capture 它"引用到"的变量。`collect_captures_stmt` 之前不处理 `HStmt::Drop`/`Dup`，所以被 drop 的外层变量没进闭包 env → 闭包里查不到 → 警告。典型：`std/result.ring` 的 `to_result(f) = Result::Ok(f()) catch { e => Result::Err(e) }`——body 用 `f`，catch arm 不用，平衡把 `Drop f` 插进 catch arm，但 catch 闭包没 capture `f`。修在 `codegen_llvm_expr.ring`：抽出 `consider_capture_name` 复用 Ident 的 param/fn/local 分类，`collect_captures_stmt` 对 `Drop`/`Dup` 把目标名当作一次"使用"纳入 capture。

dist 已 bootstrap 到不动点（pass2==pass3 字节一致）。npm test 728/728、test:llvm 20/20 不回归。

### 2. #130 闭包 env drop —— 与 #131 修复存在所有权模型冲突，需决策 [决策]

**现状**：`ring_runtime.cpp` 的 `drop_closure`（行 2062）把所有 typeid==7（RING_TYPEID_CLOSURE）的块当 `{fn_ptr, env_ptr}` pair，只 drop `slot[1]`。但 env struct 本身也用 typeid 7 分配（`codegen_llvm_expr.ring` gen_lambda 行 2865 / gen_catch_closure 行 3157）。于是 env 被当成 pair：捕获 0 个/1 个变量时行为偶然接近正确，捕获 ≥2 个时 `slot[0]`（cap0）泄漏、`slot[1]` 被当成"子 env"错误递归 drop。结论：env 的 per-capture drop 基本是错的（方向：泄漏 + 对 cap1 的误递归）。

**为什么不能照任务描述直接"给 env 独立 typeid + 生成 drop_env_T"一把梭**：和我刚做的 #131 修复**直接冲突**，会把安全泄漏变成 double-free（比泄漏更糟，且差分测试抓不到内存只抓 crash，我无法在本机 runtime 验证——25.9GB）：

1. **try/catch 闭包当前根本不被 drop**。`ring_try`（runtime 行 1474）收到 body_cl / catch_cl 后既不 drop 也不在 `gen_try_catch` 后 drop——这俩闭包及其 env 今天是**整体泄漏**的。正因如此，#131 我往 catch env 里加 `f` 是安全的：catch arm 里的显式 `Drop f` 释放捕获副本，env 块泄漏（`f` slot 已释放）。一旦给 env 自动 drop captures，就会 **double-drop `f`**（catch arm 的 `Drop f` + env-drop 的 `f`）。
2. 更本质：catch env 里的 `f` 是 **borrow-for-drop**（捕获进来只为了让 catch arm 能执行那条平衡 drop），而 gen_lambda 普通闭包里的 capture 是 **owned +1**（perceus 对 non-last-use capture 发 `Dup`，对 last-use capture 直接 move）。这两类 capture 的 env-death 语义相反（前者不该 drop，后者该 drop）。**当前 env 布局没有区分这两类的元信息。**

**待决策**：env 自动 drop 需要先定 capture 所有权模型，三选一：
- (A) env 用独立 typeid + 生成 per-env `drop_env_T`，**且** perceus 区分 owned vs borrowed capture（borrowed 不放进 env 而走别的机制），**且** try/catch 在 `ring_try` 之后 drop 两个闭包。完整但牵动 perceus capture 模型 + runtime ring_try + codegen 三处，且无法本机验证 double-free。
- (B) 暂不给 env 自动 drop（保持当前泄漏），先把 #131 的 borrow-capture 和普通 owned-capture 在 HIR 上区分清楚，作为 #130 的前置。
- (C) 只修 gen_lambda 普通闭包的 owned-capture drop（独立 typeid + drop_env_T + 闭包 drop 时释放 captures），catch/handle 闭包**显式排除**（它们本就整体泄漏，不引入 env-drop，避免和 borrow-capture 冲突）。范围可控但 catch 闭包仍泄漏。
推荐 (C) 作为 #130 的安全增量，(A) 作为后续完整 RC 收口（连同 ring_try 闭包 drop）。需用户拍板再动 runtime / perceus capture 模型。

### 3. #3 drop_T 完整性核查结论：基本已正确，仅 2 处 process-lifetime 残留 [观察]

核查 StructType / EnumType / TupleType / 单态化泛型实例的 drop_T 覆盖：
- **Struct / Enum**：`emit_drop_functions` 按 bare name 生成 drop_T 并注册，字段逐个 `ring_drop`。**单态化泛型不破坏**——uniform boxing 下所有字段都是 `ptr`，drop_T 类型擦除，字段的真实类型靠各自的 RC header typeid 派发。`Box<Int>` 和 `Box<Str>` 共用同一 `Box` drop_T 是正确的。
- **TupleType**：LLVM codegen 把 tuple 降级成 **List**（`gen_tuple_lit` → `gen_list_lit` → `ring_list_new`，typeid LIST），走 `drop_list` 递归 drop 元素——**不泄漏**。runtime 的 `drop_tuple`（typeid 10 no-op）实际只被 Range struct（gen_range_expr，`{start,end,inclusive}`）和 Eq-dict struct（`ring_make_eq_dict`，2 个 closure）用到。
- **残留泄漏（极小）**：(a) Range 的 start/end 若为堆值不被 drop——但实际只对 Int range，Int payload 是 `drop_int` no-op，无实质泄漏；(b) Eq-dict 的 2 个 closure 泄漏——但 dict 是 process-lifetime 的，泄漏一次。
结论：#3 没有大面积漏 drop，无需大改。若要彻底干净，给 Range / dict struct 各自的 drop_T（而非共用 no-op TUPLE typeid），但收益极低、和 #130 的 env-typeid 方案应一起设计。

### 4. #4 guard-false 边 pattern 绑定泄漏 —— 未实现，需 HIR 层设计 [决策]

**现状**：带 guard 的 arm `P if g => body`，perceus 现在（B-083）已正确处理 **UAF 方向**（guard 把 body+fallthrough 都需要的变量 dup 而非 move，`guard_fallthrough_rc.ring` 通过）。任务 #4 是**残留的泄漏方向**：若 guard 为 body dup 了某个 pattern 绑定，但 guard 假、fall-through 到下一 arm，body 不执行 → 那次 dup 无人 drop（泄漏，非 UAF）。

**为什么未做**：
1. 纯泄漏，本机无法 runtime 验证（同 #130，差分测试只抓 crash）。
2. 修复要在 HIR / perceus 给 guard-false 边加 drop slot，但 codegen 侧 guard-false 边目前**没有承载 per-binding drop 的位置**——pattern 绑定是 arm-local，只在 arm 的 block 内存在，guard 假时直接 `br next_bb`（`codegen_llvm_expr.ring` gen_ctor_tag_test / match.next 路径），没有"guard-false 清理块"。需要同时改 perceus（产出 guard-false drop 列表）和 codegen（在 guard cond-false 目标前插一个 cleanup block 绑定并 drop）。
3. 和 #130 一样，guard 为 body dup 的到底是哪些绑定、它们在 guard-false 边的所有权，依赖 capture/move 所有权模型的统一定义。

**待决策**：是否在本轮收口；若做，需先定 guard fork 两条边的 RC slot 模型（与 #130 的 owned/borrowed capture 模型同源）。任务 prompt 已明确允许"做不动如实报告"——此处如实报告：未实现，已定位修复需 perceus + codegen 双侧改动 + 一个 guard-false cleanup block 的设计。
