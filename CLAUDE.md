# CLAUDE.md

## 项目概述

Ring-lang：不信任程序员的 native 编程语言——编译器是最终权威，不是程序员。写起来像 Python，编译器看到 Rust 级别的类型和副作用信息。代数 effect system + HM 类型推断 + trait 多态，编译器全推断，零标注负担。当前编译到 JS/V8（bootstrap 后端），目标后端为 LLVM native。

编译器已自举（Ring 写 Ring），完整设计文档见 `docs/design.md`。

## 设计公理（速查，全文唯一真值源 = `docs/philosophy.md`，2026-06-12 重构为九条三层）

**层 0 目标**：④ 不信任程序员 · 编译器是最终权威（渐近表达 = 无人回路 × 全场景；推论：失真必须响 / 优化不可观测 / 人类审查面可枚举 = unsafe discharge 清单）。**层 1 硬约束**：⑤ 编译器必须终止（可判定片段 + fuel，B-119）⑥ 确定性资源语义（Drop = scope-end 语义 + as-if 条款；RC 无 GC；环用 Weak）⑦ 场景不可堵死（native / 零强制 runtime / C ABI）。**层 2 策略**：① 类型即模型（可判定标准：lv0 零标注 + 错误单轮可修）② 效果即可见性（主载体 = formatter 标注 + 模块签名 + llm 错误格式）③ 推断为王（标注是文档不是语义；agent profile 下 warnings=errors）⑧ 一种事一种写法 ⑨ 语法借用。仲裁：策略让位约束；约束修订走修宪程序（dossier + 可证伪锚点）；记录入 design.md「公理仲裁决策表」。

## 技术栈

- **编译器**：Ring 自举，编译为 JS 运行（bootstrap 后端）；LLVM native 后端开发中
- **LLVM 后端**：codegen_llvm*.ring（5 个模块，~6400 行 Ring），通过 N-API addon 桥接 LLVM-C 22 API。native ring.exe 已能自编译（peak ~10.6GB）
- **测试**：node:test，零外部依赖
- **参考实现**：Koka 编译器（MIT），用于 effect 推断、evidence passing 等算法翻译
- **历史**：TS 原始实现归档于 git tag `ts-compiler-final`

## 项目结构

```
Ring-lang/
├── compiler/          编译器源码（*.ring）+ dist/（JS 产出，入 git）+ dist-llvm/（.o 产出）
│   ├── codegen*.ring      JS 后端 codegen
│   ├── codegen_llvm*.ring LLVM 后端 codegen（5 个模块）
│   ├── llvm_ffi.ring      LLVM-C API 声明（91 extern fn + 13 extern type）
│   └── llvm-addon/        N-API addon（本地构建，.gitignore）
├── ring_runtime.cpp   LLVM native backend 的 C ABI runtime（~2200 行 C++ STL wrapper）
├── std/               标准库（io/fs/path/process/str/num/list/map/set/result/iterator）
├── tests/             E2E 测试用例 + 测试运行器
├── examples/          示例程序
├── editor/vscode/     VSCode 插件（语法高亮，LSP 暂不可用）
└── docs/              设计文档、技术债清单、竞品分析（含 lang-design.md：语言面长期决策——数值类型/@repr/TCO/comptime/包管理等）
```

## 编译器管线

```
源码 (.ring) → Lexer → Parser → AST → Checker (HM + effects) → HIR → Codegen → JavaScript
                                  ↓ (errors)                           ↘ Codegen LLVM → .o → native binary
                           DiagnosticSink → format_human / format_llm
```

- **AST**：忠实反映源码结构，所有节点带 Span
- **HIR**：独立数据结构，每个表达式带推断的 Type + EffectRow，语法糖已展开
- **DiagnosticSink**：Lexer/Parser/Checker 错误统一收集，支持多错误报告
- HIR 独立于 AST，后续优化 pass 在 HIR → Codegen 之间插入
- **Perceus RC pass**（`perceus.ring`，仅 `--target=llvm`）：HIR → [escape-clone/drop 插入] → RC 标注 HIR → Codegen LLVM。L1 借用引擎 clone-all-escape（Koka POPL'21）。post-RC HIR 经 `verify_rc.ring` 静态 LEAK/UAF/BALANCE 检查（随 npm test 强制）。见 design.md §7.11
- **双后端**：`--target=js`（默认，bootstrap）和 `--target=llvm`（native，开发中）共享同一 HIR

## 开发约定

- 编译器源码是 Ring（`compiler/*.ring`），snake_case 命名
- 编译器各阶段共享约定放 `hir.ring`（如 `variant_js_name`），不允许跨阶段硬编码字符串契约
- **修改编译器后必须重新编译 dist/**：`node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist`，并提交更新后的 dist/ 文件。**Worktree merge 后的 rebuild 必须 amend 进 merge commit**——不允许 broken intermediate state（dist/ 失配）作为独立 commit 存在。同理，merge 后的 bookkeeping（更新 audit-report/backlog 删除已完成条目）也 amend 进 merge commit。**数据结构级重构**（如 `trait_impls` 从 List 改为 Map）merge 后需要 double bootstrap——旧 dist 编译新源码的产出可能有引用错误，需先用 worktree 的 dist 做中间 bootstrap 再 double bootstrap。
- **dist-llvm/ rebuild 纪律与 dist/ 同级**：动编译器（含 lexer/parser 等任何前端阶段）或 RC/LLVM 后端后同步重编 `node compiler/dist/main.js build compiler/main.ring --target=llvm --out-dir=compiler/dist-llvm` 并提交；worktree merge 后的重建一并 amend 进 merge commit（背景：维护 wave `b19c85b` 改 lexer 后未重建 dist-llvm）。
- 注释语法 `//`，无 pipe 运算符，`.method()` 是唯一链式调用方式（`::` 模块路径和 `.method()` 方法调用是两个不互通的范畴，无 UFCS）
- 生成的 JS 代码应可读——方便调试
- 复杂算法参考 Koka 的 Haskell 实现翻译，标注来源
- 新增 AST/HIR 节点后必须处理所有 match 穷尽分支（编译器自动检查）
- 每个 PR 至少包含一个 e2e 测试，合入前必须通过 `npm test`（从 `compiler/` 目录运行）
- **Worktree 隔离规则**：Agent 工具可使用 `isolation: "worktree"` 进行并行开发。worktree 完成后必须通过 `git merge` CLI 命令同步回主分支，禁止用 Edit 工具手动搬迁。Worktree agent 启动后必须立即 `git log --oneline -1` 验证 base commit。**每次任务完成后必须清理 stale worktree**：`git worktree remove -f -f <path>`。
- **决策必须讨论**：发现问题后不得自行决定修复方案，除非问题 trivial 且有唯一正确修复方式。不讨论就动手 = 错误。
- **禁止忽略问题**：不能以"推迟"、"很难触发"等原因主动替用户忽略问题，必须上报由用户拍板。
- **文档时效性**：修改编译器功能后同步更新 CLAUDE.md 和 docs/design.md。已完成的 review/plan/spec 文件应删除。
- **禁止 temp fix**：修复应提升项目健壮性，不增加技术债，即使工作量更大。
- bug fix 后如果问题典型，补充 regression test。

## 测试策略

- **E2E 语义测试**（`tests/cases/*.ring`）：语言规范的可执行版本，每个特性一个文件
- **负面测试**（期望编译错误）：定义类型系统边界，含 pending 测试标记未来特性
- **回归测试写 E2E 层**：不写 "第 X 行生成的 JS 应该是 Y"——codegen 实现可变
- **度量语义覆盖**，不度量代码行覆盖
- **LLVM 差分回归测试**（`tests/cases/llvm/*.ring` + `tests/llvm_diff.test.mjs`，`npm run test:llvm`）：每个用例用 JS 和 LLVM 两个后端编译运行，断言输出一致（JS 后端是 oracle）。锁定历次 LLVM codegen/RC/effect-handler 修复——用例即规约，修复明细在 git history。需本地 clang，无则自动 skip。**动 RC 的改动必须 ×3 跑全套**（间歇性堆损坏单跑约 1/3 命中，单跑假绿）。
- **RC 静态 verifier 套件**（`tests/verify_rc.test.mjs`，随 `npm test`）：post-RC HIR 线性检查（LEAK/UAF/BALANCE 三判据）——self-verify 门（编译器自身 0 errors）+ llvm 用例 in-process sweep + 负面套件。见 design.md §7.11 D2

## 已知限制

### Effect / Codegen

- **Handler 只支持 tail-resumptive + abort**：非 abort effect 的 handler 返回值即 resume 值；`fail.raise` 为 abort。Full AE（post-resume / multi-resume）不计划实现
- **Trait dictionary dispatch 的 evidence 转发已基本修复**（#77），delegate 复杂路径仍有低风险残留问题（见 audit-report #93/#123）
- **`catch` 总是消除 fail effect**：完整捕获点，catch arms 经穷尽性检查。需要部分处理时在 catch 内部 match + re-raise

### 类型系统

- Record row types 仅在参数位置使用（无匿名 record 字面量）
- struct-field 位 `where` 只解析不验证（W0002）；参数位 `where` 未实现（硬 parse error E0103）；均归 B-001
- 不支持 `dyn Trait` 动态分发、GATs
- `pub` 可见性在单文件模式不强制（向后兼容）
- 穷尽性检查：嵌套模式递归检查正常，多字段交叉组合不验证
- `Map` key 查找仍用 JS `===`（追踪于 B-107；List 方法已全部通过 trait dict dispatch）

### 语法

- 字符串无 `+` 拼接：用插值 `"${a}${b}"` 或 `join()`
- `list[i]` / `map[key]` / `str[i]` 越界 panic，安全访问用 `.get()`
- Struct literal 不能直接出现在 if/while/for/match 条件位置（`{` 歧义），需加括号或用变量

### 基础设施

- 无 CI（test 手动执行）
- 模块系统不支持 first-class modules、`mod : SigName` 一致性检查
- Checker 多错误恢复是 declaration 级（同一函数内停于首错）
- LSP 暂不可用（TS 实现未移植）
- **Impl 方法 effect 传播**：B-138 ✅ impl 内方法按 SCC 拓扑排序检查（callee 先于 caller），非环依赖的 effect 正确传播。**残留限制**：impl 内互递归方法（SCC 环，如 `parse_mod_block` ↔ `parse_decl`）仍有 effect 遗漏，与顶层 SCC（B-122）同一限制

## 路线图

**当前**：**Native 自举 Level 1 完成（2026-06-16）**——B-089 三门全绿（G-a 内存 ✅ / G-b 双 bootstrap 44/44 字节一致 ✅ / G-c llvm_diff 86/86 + native E2E 3/3 ✅）。B-104 完整 Perceus RC ✅。B-080 tagged pointer ✅。B-122 SCC 拓扑序 ✅。B-138 impl SCC 排序 ✅。

**后续**：B-099 native LLVM-C 链接（Node 消除，Level 2）→ B-100 JS 退役 → L1 用户面（B-068）/ L2 Drop/RAII（B-002）→ async effect + 结构化并发 → Refinement types（Z3 集成）→ GADTs

**遗留**：impl effect 传播修复（B-138，impl 内 SCC 排序）、LSP 移植、技术债清理（见 `docs/audit-report.md`）

## 常用命令

```bash
# 运行单文件
node compiler/dist/main.js run examples/hello.ring

# 编译为 JS
node compiler/dist/main.js build examples/hello.ring

# 类型检查
node compiler/dist/main.js check examples/effects.ring

# LLM 格式错误输出
node compiler/dist/main.js check --error-format=llm examples/effects.ring

# E2E 测试（JS 后端）
cd compiler && npm test

# LLVM 后端差分回归测试（需 clang）
cd compiler && npm run test:llvm

# 重新编译编译器自身
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist

# 调试模式（多文件入口）
node compiler/dist/main.js run --debug <project-entry>.ring

# LLVM 后端：编译为 native .o
node compiler/dist/main.js build examples/hello.ring --target=llvm

# LLVM 后端：编译编译器自身（多文件）
node compiler/dist/main.js build compiler/main.ring --target=llvm --out-dir=compiler/dist-llvm

# Native 构建（需 clang）
powershell compiler/scripts/build_native.ps1

# Native 构建（含 alloc 计数器）
powershell compiler/scripts/build_native.ps1 -Stats

# 全量测试（e2e + llvm + native，各阶段缺依赖自动 skip）
cd compiler && npm run test:all
```

## ASan 跑法（两档，2026-06-11 定）

ASan 对自编译（数十亿次分配，@2026-06-12 ~26 亿）默认参数会放大 ~100x（每次 malloc/free 抓 30 帧栈 + redzone + quarantine），半小时起步。分两档：

- **gating（内循环 / ×3 例行 / llvm_diff + real_program）**：`ASAN_OPTIONS=malloc_context_size=0:quarantine_size_mb=16:max_redzone=32:detect_leaks=0`（**已设为 User 级默认 env，新 shell 自动继承**；已在跑的旧 session 需内联设置）。检测面不变（立即 UAF/over-free 照抓），代价 = 报告无 alloc/free 栈 + 延迟 UAF 覆盖缩小。**ASan self-compile 不进内循环**——内循环 self-compile 用非 ASan + alloc/free 计数器 + 退出码（20s/轮）。
- **capstone 终验（self-compile 全量 ASan，每个 milestone 一次，可过夜）**：必须显式覆盖回全强度 `$env:ASAN_OPTIONS='quarantine_size_mb=256:malloc_context_size=12'`。gating 抓到 bug 后对单用例用此档重跑拿完整 alloc/free 栈。
- ring_asan 构建建议 `-fsanitize=address -O1 -fno-omit-frame-pointer`（-O0 下减速翻数倍）。
- thrash 预警：31GB 物理内存，ASan self-compile 后段可能换页——CPU 掉零 + 磁盘狂转即杀，别等。
