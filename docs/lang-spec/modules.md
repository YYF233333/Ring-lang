# 模块系统

Ring 使用基于文件的模块系统。每个 `.ring` 文件是一个模块。模块通过 `use` 声明导入其他模块的公开符号。

## 模块标识

模块名由文件路径派生，`::` 分隔符映射到文件系统目录分隔符：

```
use parser::lexer    →  parser/lexer.ring
use utils            →  utils.ring
```

项目根目录是入口文件所在目录。

## 导入语法

### 单符号导入

```ring
use parser::Token
```

从 `parser.ring` 导入 `Token`。

### 多符号导入

```ring
use parser::{Token, parse, Lexer}
```

从同一模块导入多个符号。

### 整模块导入

```ring
use parser
```

导入模块作为命名空间。通过 `parser::Token` 访问。

### 重命名导入

```ring
use parser as p
use parser::{Token as T}
```

模块别名或符号别名。

### 嵌套路径

```ring
use checker::env::TypeEnv
```

映射到 `checker/env.ring` 中的 `TypeEnv`。

## 导出和可见性

### `pub` 修饰符

```ring
pub fn greet() -> Str { "hello" }
pub struct Point { pub x: Int, pub y: Int }
```

在多文件模式下，未标记 `pub` 的声明不可被其他模块导入。导入非 pub 符号报 E0701 错误。

单文件模式下 `pub` 被接受但不强制执行（向后兼容）。

### `pub use` 再导出

```ring
pub use inner::greet
```

将依赖模块的导出提升为当前模块的公开接口。支持模块门面模式。

## 编译模型

### 自动检测

编译器通过检查源文件中是否有 `use` 声明来决定编译模式。有 `use` → 多文件模式，无 `use` → 单文件模式。

### 编译流程

```
1. 从入口文件开始，BFS 发现所有依赖模块
2. 拓扑排序（Kahn 算法）确定编译顺序
3. 按序处理每个模块：
   a. Parse → AST
   b. Check → HIR（注入依赖模块的 ModuleExports）
   c. Codegen → JS（命名空间化）
4. 拼接为单文件 JS bundle 输出
```

### 循环依赖

循环依赖在拓扑排序阶段检测，报 E0704 错误。

### 命名空间化

多文件模式下，每个模块的顶层声明添加 `module$` 前缀：

```
parser.ring 中的 fn parse()  →  JS 中的 function parser$parse()
parser.ring 中的 struct Token  →  JS 中的 class parser$Token
```

跨模块引用通过 `imports_map` 解析为正确的前缀名。

内置类型（Option、List 等）和运行时函数不加前缀。`extern fn` 声明保留原始 JS 函数名。

## ModuleExports

每个编译完成的模块产生一个 `ModuleExports` 记录：

```
ModuleExports {
  types: Map<string, TypeDef>           // struct/enum/extern type
  values: Map<string, TypeScheme>       // 函数、常量
  trait_impls: TraitImpl[]              // trait 实现
  re_exports: Map<string, ...>          // pub use 再导出
  extern_values: Set<string>            // extern fn（不加模块前缀）
}
```

下游模块的 checker 通过 `inject_module_exports` 将这些信息注入类型环境。

## 错误码

| 错误码 | 描述 |
|--------|------|
| E0701 | 导入非 pub 符号 |
| E0702 | 模块未找到 |
| E0703 | 模块中无此符号 |
| E0704 | 循环依赖 |
| E0705 | 重复导入 |
| E0706 | `use` 不在文件顶部 |

## 限制

- 不支持 `sig` 签名（module signature）
- 不支持 first-class modules
- 不支持 inline `mod` 块
- 不支持 capability 限制
- 不支持相对路径（`super::`/`self::`）
- 跨文件跳转定义和查找引用在 LSP 中尚未实现（hover 和类型检查已支持跨模块）
