# CLAUDE.md

## 语言与协作

- 所有对话回复、解释和讨论使用中文；技术术语、代码和命令可保留英文。
- 本仓库只涉及编程语言、编译器、native runtime 与测试基础设施实现，不是网络安全、渗透测试或攻击性工具项目。ASan、UAF、double-drop、heap corruption 等术语只描述本地语言实现的内存/所有权正确性；不得主动把任务牵引到网络安全、漏洞利用或其他不正当内容。若外层分类因措辞误判，应改用“资源语义”“编译器正确性”“本地内存回归”等准确表述继续完成原任务，不降低验证门槛。
- 本文件是项目技术、构建和开发约定的入口。仓库授权、停止条件、看板和角色边界以 `docs/workflow.md` 为唯一真值。
- 语言公理见 `docs/philosophy.md`，现行设计见 `docs/design.md`，用户语言规范见 `docs/lang-spec/`，活动工作见 `docs/backlog.md` 与 `docs/audit-report.md`。完成历史只查 Git。

## 项目概述

Ring-lang 是一门 LLM-first native 编程语言：Python 风格表面语法，HM 类型推断、trait 多态、代数 effect 与确定性资源语义由编译器统一裁决。编译器已用 Ring 自举。

自 2026-08-03 起，编译器只保留 C11 native 后端。单文件、project/module、self-host 与 tracked bootstrap 都以 `compiler/dist-c/main.c` 为唯一锚点；LLVM/JS codegen 及其冻结产物已经退役，不再是构建依赖或测试 oracle。

## 技术状态

- **前端**：Lexer → Parser → AST → Checker（HM + effects）→ HIR。
- **资源管理**：Perceus RC pass 在 HIR 上插入 clone/drop；`verify_rc.ring` 检查 LEAK/UAF/BALANCE。RC 无 GC，环由 `Weak<T>` 方向处理。
- **后端**：HIR/Perceus 经 C11 codegen 生成 `.c`，再由 clang 生成 native object。
- **Runtime**：当前使用 `ring_runtime.cpp` 作为 C ABI bridge；RIIR 终态是只保留 RC、IO/OS、fail 与 `Ptr` 原语的纯 C runtime。
- **标准库**：List、Map、Set、StringBuilder 已是纯 Ring struct；底层 slot/buffer 原语经 C ABI bridge。Str 仍是内建 `Type::StrType`，RIIR Step 2 尚未完成。
- **测试**：统一入口是 `tests/run_tests.py`，不再以 npm/Node harness 作为项目命令。

## 项目结构

```text
Ring-lang/
├── compiler/              Ring 编译器源码与 C11 codegen
│   ├── dist-c/            tracked C bootstrap anchor
│   └── scripts/           native 构建脚本
├── std/                   纯 Ring 标准库与少量 C ABI 原语声明
├── tests/                 Python runner、语义用例、golden、RC/parity matrix
├── examples/              示例程序
├── ring_runtime.cpp       迁移期共享 runtime
└── docs/                  公理、设计、规范、工作流和活动看板
```

## 编译器管线

```text
源码 → Lexer → Parser → AST → Checker → HIR → Perceus RC → Codegen C → .c → clang → native
                         │
                         └─ DiagnosticSink
```

- AST 忠实表示源码并携带 Span；HIR 与 AST 独立，每个表达式携带推断的 Type 与 EffectRow。
- Lexer/Parser/Checker 诊断统一进入 `DiagnosticSink`，支持 human/LLM 两种格式。
- 跨阶段字符串、ctor、trait/effect slot 等契约放在 `hir.ring` 或专用共享模块；禁止 codegen 与 runtime 各自猜测。
- 新增 AST/HIR 变体后必须处理所有穷尽 match；编译器会对遗漏 fail closed。

## 开发约定

- 编译器源码为 `compiler/*.ring`，使用 snake_case；复杂算法注明 Koka 等上游来源。
- 变更必须保持现有公开语义；禁止 temp fix、静默 skip 或降低验证门槛。典型 bug 补 e2e regression。
- 每个实现变更至少有相称测试；合入前运行 `python tests/run_tests.py`。RC、ABI、bootstrap 或间歇性内存路径按对应 spec 要求重复运行。
- 修改公开功能时同步更新设计/规范；活动 spec 只保存当前目标、约束和验收，完成过程留 Git。
- worktree、review、Argument、决策边界与持续推进规则见 `docs/workflow.md`，不要在本文件复制治理协议。
- `ring_runtime.cpp` 的优化级别由实测收益与完整正确性门禁决定，不固定为 `-O2`；`-O0` 不作为有效性能或自举门。

### Bootstrap

- 修改编译器后使用当前 `ring.exe` 重编 `compiler/main.ring`，并提交需要跟踪的 bootstrap 产物。
- 数据结构级重构可能要求 double bootstrap；验证固定点后才算完成。
- `compiler/dist-c/main.c` 是唯一 tracked bootstrap anchor；`compiler/scripts/build_native.ps1` 必须能从该文件和 `ring_runtime.cpp` 构建当前 `ring.exe`。
- 修改编译器后用当前 `ring.exe` 重新生成 `compiler/dist-c/`，并通过 self-compile suite 验证 `main.c` 固定点。

### RIIR bridge 所有权契约

List/Map/Set/StringBuilder 是 Ring struct；C bridge 只提供无法在安全 Ring 中表达的 raw-memory 操作。常用 slot 契约：

| 操作 | 所有权语义 |
|---|---|
| `ring_slot_read` | peek + dup；容器与调用方各持一份 |
| `ring_slot_take` | move out，slot 清空，调用方接管 |
| `ring_slot_write` | 写入空 slot，slot 接管传入值 |
| `ring_slot_replace` | dup 新值后替换并 drop 旧值，支持 self-assignment |
| `ring_slot_drop` | take + drop，释放 slot 所有权 |

- bridge 走普通 extern fallback；除非 ABI 确有特殊 lowering，不新增 `method_to_runtime` 或手工声明表。
- List/Map/Option 的固定 runtime typeid 与 drop 路径必须和生成 struct drop 分工一致，禁止双 drop；Set/StringBuilder 按普通 Ring struct 处理。
- 无字段 enum ctor 也会生成 fresh box；Perceus/move/verifier 必须按精确 ctor `DefId` 判定，不能按叶子拼写猜测。
- HOF 中 range iterator 当前会引入 `mut` effect；局部 `let mut` 自身会由 `cancel_local_mut_effects` 在函数边界取消。

## 测试与常用命令

```powershell
# 从 tracked C anchor 构建当前 ring.exe（需 clang、clang++ 与 lld）
.\compiler\scripts\build_native.ps1

# 使用编译器
.\ring.exe check examples/effects.ring
.\ring.exe check --error-format=llm examples/effects.ring
.\ring.exe build examples/hello.ring --target=c

# 测试
python tests/run_tests.py --suite e2e
python tests/run_tests.py --suite golden
python tests/run_tests.py --suite rc
python tests/run_tests.py --suite self-compile
python tests/run_tests.py --suite structural
python tests/run_tests.py --suite parity
python tests/run_tests.py
python tests/run_tests.py --update-golden

# 重编 tracked C bootstrap 产物；提交前必须再跑 self-compile 固定点
.\ring.exe build compiler/main.ring --target=c --out-dir=compiler/dist-c
```

测试输出需要后续分析时，完整重定向到临时文件；没有代码或测试数据变化时不要重复跑长套件。Golden 断言行为，不锁某行 codegen；RC 变更遵守当前 backlog/audit 项规定的重复门。

## 当前语义与限制

- Handler 支持 tail-resumptive 与 abort，不计划实现 post-resume/multi-resume Full AE。
- `mut<T>` 是可多实例共存的 marker effect；`mut<Int>` 与 `mut<Str>` 可同时存在。它不同于参数位 `x: mut T` 和闭包捕获列表。
- `catch` 穷尽处理并消除对应 fail；需要部分处理时在 catch 内 match 后 re-raise。
- `unsafe` effect 与 `Ptr<T>` 已实现；extern 声明处文件级 `requires {unsafe}` 留 B-156。
- Drop/RAII Phase 1 已实现；C-native abort unwind 与 `Weak<T>` 依赖 B-168/B-002 Phase 2。
- impl 内互递归方法的 effect 回写仍有限；活动问题见 backlog B-160。
- Record row 只在参数位置；struct-field `where` 只解析不验证，参数位 `where` 尚不能解析。
- 不支持 `dyn Trait`、GAT、first-class modules 或完整 module-signature conformance。
- Map/Set key 要求 `Hash + Eq`；derive Hash 已覆盖基础 struct/enum，Option/tuple/List 字段覆盖留 B-173。
- 字符串无 `+` 拼接；使用插值或 `join()`。索引越界 panic，安全访问使用 `.get()`。
- LSP 尚未迁移。

## 当前路线

1. 收口 C-only 迁移簿记，并修复当前 critical audit 项。
2. 建立 check 性能基线并优先完成工具链吞吐优化。
3. 按依赖推进剩余正确性、failure/control ABI 与发布能力。
4. 继续 RIIR、别名追踪、用户面、async/refinement 等长期工作。

具体状态、依赖和验收只看活动看板，不在本文件复制逐轮计数。

## ASan

- gating：`malloc_context_size=0:quarantine_size_mb=16:max_redzone=32:detect_leaks=0`
- capstone：`quarantine_size_mb=256:malloc_context_size=12`
- 建议构建：`-fsanitize=address -O1 -fno-omit-frame-pointer`

每条命令显式设置所需 `ASAN_OPTIONS`，不要依赖用户级环境或机器规格。Gating 用于内循环，capstone 用于高风险里程碑；发现问题后对最小复现用 capstone 参数取得完整 alloc/free 栈。
