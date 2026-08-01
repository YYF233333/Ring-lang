# Ring

Ring 是一门“不信任程序员”的 native 编程语言：源码保持接近 Python 的低标注体验，编译器负责推断类型、effect、trait 约束与资源行为，并把无法证明的边界显式暴露出来。

编译器已经用 Ring 自举。当前默认后端是 LLVM native；C11 后端已覆盖单文件、project/module 与 self-host，正在进行跨后端 parity 认证。在认证门闭合前，LLVM 仍是默认后端和差分 oracle。测试入口已经统一为零第三方 Python runner。

## 语言一瞥

```ring
enum Shape {
    circle(radius: Float),
    rect(width: Float, height: Float),
}

fn area(shape: Shape) -> Float {
    match shape {
        circle(r) => 3.14159 * r * r,
        rect(w, h) => w * h,
    }
}

fn main() {
    let shapes = [circle(2.0), rect(3.0, 4.0)]
    let total = shapes.fold(0.0, fn(sum, shape) { sum + area(shape) })
    print("total = ${total}")
}
```

Effect 也参与推断，并可由词法 handler 替换：

```ring
effect Greeting {
    fn word() -> Str;
}

fn greet() -> Str with {Greeting} {
    "${Greeting.word()}, Ring"
}

fn main() {
    let message = handle { greet() } with {
        Greeting.word() => "hello",
    }
    print(message)
}
```

## Native 构建与运行

当前开发环境以 Windows、Clang 和 LLVM-C 为基线。以下命令均从仓库根目录运行；`<LLVM_LIB_DIR>` 替换为本机 LLVM 的 `lib` 目录。

```powershell
# 从冻结的 native 自举产物链接编译器
clang++ -c ring_runtime.cpp -o ring_runtime.o -std=c++17 -O2 -D_CRT_SECURE_NO_WARNINGS
clang compiler/dist-llvm/main.o ring_runtime.o -o ring.exe -lmsvcrt "-Wl,/STACK:536870912" "-Wl,/MANIFEST:EMBED" "-Wl,/MANIFESTUAC:level='asInvoker'" "-L<LLVM_LIB_DIR>" -lLLVM-C

# 检查、编译、链接并运行一个程序（LLVM 是当前默认后端）
.\ring.exe check examples/hello.ring
.\ring.exe build examples/hello.ring --target=llvm
clang examples/hello.o ring_runtime.o -o examples/hello.exe -lmsvcrt "-Wl,/STACK:536870912" "-Wl,/MANIFEST:EMBED" "-Wl,/MANIFESTUAC:level='asInvoker'"
.\examples\hello.exe
```

要试验正在认证的 C11 后端，把构建命令改为：

```powershell
.\ring.exe build examples/hello.ring --target=c
```

该命令生成 `examples/hello.c` 和 `examples/hello.o`；链接、运行步骤与上面相同。

## 测试

Python runner 会查找或从冻结产物临时链接 `ring.exe`，并按需构建 runtime：

```powershell
python tests/run_tests.py                 # 全部默认门禁
python tests/run_tests.py --suite e2e     # 语言语义 E2E
python tests/run_tests.py --suite llvm    # native golden
python tests/run_tests.py --suite rc      # post-RC verifier
python tests/run_tests.py --suite diff    # LLVM/C 差分（显式启用）
```

## 文档

- [语言规范](docs/lang-spec/README.md)：当前已实现的公开语法与语义
- [设计哲学](docs/philosophy.md)：九条公理与仲裁层级
- [编译器与 runtime 设计](docs/design.md)：实现架构和不变量
- [长期语言设计](docs/lang-design.md)：尚未全部落地的语言面方向
- [竞品与行业定位](docs/competitive-analysis.md)：有事实截止日期的比较基线
- [开发约定](CLAUDE.md)：工具链、bootstrap、测试与仓库工作流
