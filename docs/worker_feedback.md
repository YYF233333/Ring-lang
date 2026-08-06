# Repository Steward Inbox

> 用户低频 check-in 收件箱；仅允许 `[决策]`、最多五条 `[里程碑]` 和 `[全局阻塞]`。完整规则见 `docs/workflow.md` §3。

---

## D-001 `json_stringify<T>` 的公开支持域 [决策]

- 影响：阻塞 critical #260；不阻塞 #268、B-176 测量基础设施及其他独立工作。
- 事实：当前无约束泛型签名接受 Int/Bool 等值，但 native 实现只按 Str 读取；Int/Bool 的 `0/1` 表示重合，runtime 无法可靠猜类型。
- 事实：历史实现与回归覆盖 primitive、List、struct 与 enum；只支持 primitive 或 Str 都是公开能力收窄。
- 事实：完全保持无约束签名需要新增可递归 encoder evidence，并沿泛型调用、函数值、lambda 与跨模块固定点传播；当前泛型 ABI 没有这条类型证据，改动显著大于 critical 补丁。
- 推荐：新增公开 `Json` trait，把 API 改为 `json_stringify<T: Json>`；内建 primitive/List 实现，struct/enum 通过显式 derive，固定历史字段/`_tag` 与 Float 编码规则。不支持类型在编译期报错，复用现有 trait dictionary，能最快恢复可证明正确的契约。
- 备选：① 保持无约束 `<T>`，实现完整递归 encoder evidence，源码兼容最好但会横跨泛型 ABI/HIR/codegen；② 收窄为 Str-only，改动最小但破坏最大，不推荐。
- 延迟期间：Steward 继续关闭其他 critical、完成 B-176 基础设施与 CI；不得实现 primitive-only 隐式收窄，也不得让 unknown 类型落入 runtime fallback。

- `[里程碑]` 2026-08-06：B-163 已收官。exact compiler snapshot `50a96a` 的 clean clone 全量 ×3 每轮 1551 pass，tracked anchor SHA-256 固定为 `60fc53609c5e4f48abc0638bd6e7bbb3e865aa014b8eaeb4332fa9b7cfc01e9e`；10 个历史本地资源回归 fixture ×3 的生成 C 均跨轮稳定且无 sanitizer 诊断；远端 CI run `31107890823` 的 check/test/bootstrap 全绿，`llvm-c-backend-final` tag 与旧 worktree/branch 已核对收官。
