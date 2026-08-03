# Repository Steward Inbox

> 用户低频 check-in 收件箱；仅允许 `[决策]`、最多五条 `[里程碑]` 和 `[全局阻塞]`。完整规则见 `docs/workflow.md` §3。

---

当前无待用户处理的决策。

- `[里程碑]` 2026-08-03：C11 已成为唯一 codegen/bootstrap lane（merge `a197669`），tracked `dist-c` 达到固定点，LLVM/旧 anchors 从 main 退役并由 `llvm-c-backend-final` tag 保留恢复点；B-163 只剩文档、clean-clone/远端 CI 与 worktree 收官。
- `[里程碑]` 2026-07-31：B-107（`ce994fc`）完成 derive Hash、Set-on-Map 与 namespace plan 收口，review/重复回归/double bootstrap 通过；后续为 B-171/B-172/B-173，间歇编译器 AV 另由 #261 跟踪。
