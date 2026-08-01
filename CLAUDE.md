# CLAUDE.md

## 语言与协作

- 所有对话回复、解释和讨论使用中文；技术术语、代码和命令可保留英文。
- 本文件是项目技术、构建和开发约定的入口。仓库授权、停止条件、看板和角色边界以 `docs/workflow.md` 为唯一真值。
- 语言公理见 `docs/philosophy.md`，现行设计见 `docs/design.md`，用户语言规范见 `docs/lang-spec/`，活动工作见 `docs/backlog.md` 与 `docs/audit-report.md`。完成历史只查 Git。

## 项目概述

Ring-lang 是一门 LLM-first native 编程语言：Python 风格表面语法，HM 类型推断、trait 多态、代数 effect 与确定性资源语义由编译器统一裁决。编译器已用 Ring 自举。

当前处于 B-163 后端迁移期：C11 后端已完成 Phase 1，支持单文件、project/module 与 self-host；Phase 2 parity 认证完成前，LLVM 后端仍是默认 native、bootstrap anchor 与差分 oracle。JS codegen 已归档；`compiler/dist/` 只是冻结在 `0bd7822` 的 stage-0 回退锚，不能直接编译 HEAD。

## 技术状态

- **前端**：Lexer → Parser → AST → Checker（HM + effects）→ HIR。
- **资源管理**：Perceus RC pass 在 HIR 上插入 clone/drop；`verify_rc.ring` 检查 LEAK/UAF/BALANCE。RC 无 GC，环由 `Weak<T>` 方向处理。
- **后端**：共享 HIR/Perceus/runtime ABI，分流到 C11 发射或 LLVM-C 发射。
- **Runtime**：迁移期使用 `ring_runtime.cpp`；RIIR 终态是只保留 RC、IO/OS、fail 与 `Ptr` 原语的纯 C runtime。
- **标准库**：List、Map、Set、StringBuilder 已是纯 Ring struct；底层 slot/buffer 原语经 C ABI bridge。Str 仍是内建 `Type::StrType`，RIIR Step 2 尚未完成。
- **测试**：统一入口是 `tests/run_tests.py`，不再以 npm/Node harness 作为项目命令。

## 项目结构

```text
Ring-lang/
├── compiler/              Ring 编译器源码；codegen_c* 与 codegen_llvm* 双后端
│   ├── dist/              冻结 JS stage-0 回退锚
│   └── dist-llvm/         当前 native bootstrap 对象产物
├── std/                   纯 Ring 标准库与少量 C ABI 原语声明
├── tests/                 Python runner、语义用例、golden、RC/parity matrix
├── examples/              示例程序
├── ring_runtime.cpp       迁移期共享 runtime
└── docs/                  公理、设计、规范、工作流和活动看板
```

## 编译器管线

```text
源码 → Lexer → Parser → AST → Checker → HIR → Perceus RC
                         │                    ├─ Codegen C → .c → clang → native
                         └─ DiagnosticSink    └─ Codegen LLVM → .o → native
```

- AST 忠实表示源码并携带 Span；HIR 与 AST 独立，每个表达式携带推断的 Type 与 EffectRow。
- Lexer/Parser/Checker 诊断统一进入 `DiagnosticSink`，支持 human/LLM 两种格式。
- 跨阶段字符串、ctor、trait/effect slot 等契约放在 `hir.ring` 或专用共享模块；禁止两后端各自猜测。
- 新增 AST/HIR 变体后必须处理所有穷尽 match；编译器会对遗漏 fail closed。

## 开发约定

- 编译器源码为 `compiler/*.ring`，使用 snake_case；复杂算法注明 Koka 等上游来源。
- 变更必须保持现有公开语义；禁止 temp fix、静默 skip 或降低验证门槛。典型 bug 补 e2e regression。
- 每个实现变更至少有相称测试；合入前运行 `python tests/run_tests.py`。RC、ABI、bootstrap 或间歇性内存路径按对应 spec 要求重复运行。
- 修改公开功能时同步更新设计/规范；活动 spec 只保存当前目标、约束和验收，完成过程留 Git。
- worktree、review、Argument、决策边界与持续推进规则见 `docs/workflow.md`，不要在本文件复制治理协议。
- `ring_runtime.cpp` 必须以 `-O2` 编译；`-O0` 不作为有效性能或自举门。

### Bootstrap

- 修改编译器后使用当前 `ring.exe` 重编 `compiler/main.ring`，并提交需要跟踪的 bootstrap 产物。
- 数据结构级重构可能要求 double bootstrap；验证固定点后才算完成。
- `compiler/dist/` 语言快照停在 `0bd7822`，回退到 HEAD 需按历史链式重放；不要把它当成当前 compiler CLI。
- B-163 完成前 LLVM 仍是 anchor/oracle；LLVM、`dist/`、`dist-llvm/` 的删除顺序以 `docs/plan-c-backend.md` 当前 gate 为准。

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
# 构建当前 ring.exe（迁移期需 clang + LLVM）
clang++ -c ring_runtime.cpp -o ring_runtime.o -std=c++17 -O2 -D_CRT_SECURE_NO_WARNINGS
clang compiler/dist-llvm/main.o ring_runtime.o -o ring.exe -lmsvcrt "-Wl,/STACK:536870912" "-Wl,/MANIFEST:EMBED" "-Wl,/MANIFESTUAC:level='asInvoker'" "-L<LLVM_LIB_DIR>" -lLLVM-C

# 使用编译器
.\ring.exe check examples/effects.ring
.\ring.exe check --error-format=llm examples/effects.ring
.\ring.exe build examples/hello.ring

# 测试
python tests/run_tests.py --suite e2e
python tests/run_tests.py --suite llvm
python tests/run_tests.py --suite rc
python tests/run_tests.py --suite self-compile
python tests/run_tests.py
python tests/run_tests.py --update-golden

# 重编当前 LLVM bootstrap 产物
.\ring.exe build compiler/main.ring --target=llvm --out-dir=compiler/dist-llvm
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

1. 完成 B-163 Phase 2：共享 gap、manual gate、dist-c 固定点、LLVM 退役与 bootstrap 恢复。
2. 执行 B-168 failure/control ABI 探针与 B-169 evidence 融洽性探针。
3. 恢复 B-152 剩余 Str RIIR/P5，再完成 B-002 Phase 2。
4. 后续按 backlog 推进别名追踪、用户面、async/refinement 与工具链。

具体状态、依赖和验收只看活动看板，不在本文件复制逐轮计数。

## ASan

- gating：`malloc_context_size=0:quarantine_size_mb=16:max_redzone=32:detect_leaks=0`
- capstone：`quarantine_size_mb=256:malloc_context_size=12`
- 建议构建：`-fsanitize=address -O1 -fno-omit-frame-pointer`

每条命令显式设置所需 `ASAN_OPTIONS`，不要依赖用户级环境或机器规格。Gating 用于内循环，capstone 用于高风险里程碑；发现问题后对最小复现用 capstone 参数取得完整 alloc/free 栈。
