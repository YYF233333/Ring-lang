# LLVM 迁移日记

> 纯 append 日记。记录 Ring 编译器从 JS 后端迁移到 LLVM native 后端的全过程——想法、决策、踩坑、经验。
> 迁移完成后归档到个人 context。

---

## 2026-05-24 设计讨论：确定 LLVM 后端整体方案

### 背景

Phase C 层 1+2 全部完成（effect aliases、supertrait、mut\<T\>、default handler、关联类型、Iterator trait、delegate、语义规范）。LLVM 的所有前置依赖清零，可以启动。

### 核心决策

**1. Codegen 只写一次**

最初考虑了三个方案：emit LLVM 文本 IR (.ll)、LLVM C API via FFI、先 .ll 后 C API。

.ll 文本方案的问题：控制不了优化 pass，拖慢编译速度，用户还得自己装 LLVM CLI 工具。但直接用 C API 有个鸡生蛋问题——Ring 当前只能跑在 JS 上，无法调用 C API。

解法藏在 Ring 已有的 `extern fn` 机制里：LLVM codegen 用 Ring 写，通过 `extern fn` 调用 LLVM-C API。Bootstrap 阶段用一个本地的 Node N-API addon（C++ 薄皮）桥接 JS → LLVM-C；自举完成后同样的 `extern fn` 直接映射到 C ABI 调用 statically linked libLLVM。一份代码，两个运行时。

N-API addon 是一次性本地工具，不入仓库，不分发，自举后直接删掉。

**2. 内存管理：不回收 → Perceus RC**

不搞中间方案（Boehm GC 之类的）。编译器是短命进程，malloc 不释放完全可用。等 Perceus RC 直接一步到位。

**3. 值表示：Uniform Boxing**

所有 Ring 值在 LLVM 层面统一为 `void*`，包括 Int/Float/Bool。这让容器天然类型擦除（`void*` 数组）、闭包捕获统一、递归类型自然工作。代价是 `1 + 2` 要多几步 load/store/malloc，但编译器的瓶颈在 I/O 和树遍历，不在算术。Perceus RC 阶段再引入 unboxing 优化。

**4. Runtime：C++ STL wrapper**

最初计划自己写 ~1200 行 C（手写动态数组、哈希表、字符串操作）。后来发现可以蹭 C++ STL——`std::vector<void*>` 做 List，`std::unordered_map<std::string, void*>` 做 Map，`std::string*` 做 Str。用 `extern "C"` 包一层薄皮，~300 行搞定。libstdc++ 随 clang 自带，零额外依赖。

Map 的 key 在 bootstrap 阶段统一为 Str（编译器的 Map 几乎全是 `Map<Str, ...>`），避免泛型 hash 问题。

**5. 闭包：{fn_ptr, env_ptr}**

每个 lambda 生成环境 struct + 带 env 参数的函数。已知函数（非 lambda，直接调用）不走闭包。Trait dict 中的方法也是 `RingClosure*`。

**6. Enum 布局：tag + 内联 fields**

`{tag: i64, fields: void*[N]}`，N = 该 enum 最大变体的字段数。Uniform boxing 下所有字段本来就是 `void*`，递归类型（AST/HIR/Type 全是递归 enum）天然工作。

**7. fail/catch：setjmp/longjmp**

JS 后端用 `throw`/`try-catch`。LLVM 端用 setjmp/longjmp。Bootstrap 阶段没有 Drop/RAII，不需要栈展开。等 Ownership 上来后可以切换到 C++ exceptions 或自定义 unwind 机制。

**8. 多文件编译：单 Module**

Bootstrap 阶段所有 .ring 文件编译到一个 LLVM Module → 一个 .o → 链接为单一二进制。不需要处理跨模块符号解析。增量编译留给后续。

### 工作量评估

| 组件 | 说明 |
|------|------|
| LLVM FFI 层 | ~50-80 个 `extern fn` 声明 |
| LLVM codegen 模块 | codegen_llvm.ring + codegen_llvm_expr.ring + codegen_llvm_decl.ring |
| ring_runtime.cpp | ~300 行 C++ STL wrapper |
| N-API addon | ~300 行 C++（本地临时，不入仓库） |
| 标准库 extern fn 迁移 | 编译器用到多少就迁多少 |

### 未来演进路径

- Uniform boxing → Perceus RC 阶段引入 unboxing（基础类型不装箱）
- setjmp/longjmp → Ownership/RAII 阶段切换栈展开机制
- 单 Module → 增量编译（每个 .ring → 一个 .o）
- C++ STL runtime → RIIR（纯 Ring 重写，有 raw pointer 后）
- Map Str-only key → 泛型 Hash trait

---
