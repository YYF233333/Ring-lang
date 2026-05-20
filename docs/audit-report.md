# Architecture Health & Technical Debt Audit Report

**Date**: 2026-05-20
**Scope**: compiler/src/ (46 files, 13,134 LoC)
**Auditors**: Claude Opus (B+), DeepSeek V4 Pro (C+)
**Composite Grade**: B-

---

## Category A: Code Duplication (Most Actionable)

### A1 [issue] Eq/Ord dispatch logic copy-pasted ✅
- **Fix applied**: Merged EqDispatch/OrdDispatch → TraitDispatch; parameterized resolve_trait_dispatch/resolve_trait_extra_dicts/resolve_type_to_trait_dict
- **Status**: fixed

### A2 [issue] Primitive type→builtin name mapping repeated 5+ locations ✅
- **Fix applied**: Extracted `type_to_builtin_name()` to types/index.ts; used in infer-expr.ts, infer-ctx.ts, codegen-expr.ts
- **Status**: fixed

### A3 [issue] struct/enum branches duplicated in infer_method_call ✅
- **Fix applied**: Merged into single `if (recv_type.kind === "struct" || recv_type.kind === "enum")`
- **Status**: fixed

### A4 [concern] HExpr/HStmt switch duplicated across 5+ files
- **Files**: codegen-expr.ts, zonk.ts, hir-visitor.ts, completion.ts
- Full 26-variant HExpr switch in 4+ locations, 11-variant HStmt in 5+ locations
- completion.ts maintains its own HIR walker despite hir-visitor.ts existing
- **Fix**: Extend hir-visitor.ts for completion's use case; inherent to multi-pass compiler for others
- **Status**: deferred

### A5 [concern] AST expression traversal duplicated in definition.ts
- **File**: lsp/features/definition.ts:45-137
- 90-line switch over all AST Expr kinds, paralleling infer-expr.ts dispatch
- **Fix**: Extract shared AST visitor or migrate to HIR-based approach
- **Status**: deferred

---

## Category B: Module Boundaries

### B1 [issue] Circular import: types/index.ts <-> hir/index.ts ✅
- **Fix applied**: Moved BUILTIN_* constants to types/index.ts; hir re-exports for backward compat
- **Status**: fixed

### B2 [concern] Method name registries (CELL_METHODS, STR_METHODS etc.) in hir/index.ts
- **File**: hir/index.ts:557-583
- 14 const arrays of method names -- runtime registrations, not HIR definitions
- Consumed by codegen and checker, creating cross-cutting dependency
- **Fix**: Move to shared builtin-methods.ts
- **Status**: deferred

### B3 [concern] DerivedImpl leaks derive pass details into codegen
- codegen.ts:248-440 reconstructs trait dictionaries by walking DerivedImpl fields
- Change to auto-derive requires updates in derive.ts + hir/index.ts + codegen.ts
- **Fix**: Either accept 3-file coupling (it's well-structured) or pre-generate JS in derive pass
- **Status**: deferred

---

## Category C: God File Risk

### C1 [concern] infer-expr.ts at 1195 lines
- 20+ expression inference functions + Eq/Ord dispatch helpers
- No clear internal grouping between HOF helpers, trait helpers, core inference
- **Fix**: Extract trait dispatch to infer-dispatch.ts; split further at ~1500 lines
- **Status**: deferred

### C2 [concern] infer.ts at 851 lines
- Mixes pass orchestration with 10+ declaration body checkers + stmt inference
- Expression inference extracted but statement inference not (asymmetry)
- **Fix**: Extract infer-stmt.ts and/or infer-check-decl.ts
- **Status**: deferred

### C3 [suggestion] builtins.ts at 561 lines
- Core builtins + HOF intrinsics in one file, no shared helpers
- Adding a method requires navigating 600-line file
- **Fix**: Split into builtins/core.ts + builtins/hof-intrinsics.ts
- **Status**: deferred

### C4 [suggestion] codegen.ts: ~300 lines auto-derive codegen ✅
- **Fix applied**: Extracted to codegen-derive.ts; codegen.ts reduced from ~540 to ~240 lines
- **Status**: fixed

---

## Category D: Abstraction Quality

### D1 [suggestion] TypeEnv is a god object (17 public mutable fields)
- **File**: checker/env.ts:83-98
- No encapsulation, any code can mutate any part
- **Fix**: Group into sub-objects (env.types, env.trait_system, etc.) -- best done during self-bootstrap
- **Status**: deferred suggestion

### D2 [suggestion] Type representations carry redundant structural data
- StructType carries fields[], EnumType carries variants[] -- duplicates TypeEnv data
- **Fix**: Make types nominal (just name + type_params); large refactor
- **Status**: deferred suggestion

---

## Category E: Technical Debt Markers

### E1 [issue] 30+ unsafe `as` casts in parser files
- parser.ts, parser-expr.ts, parser-decl.ts use `as TypeName` on object literals
- Mismatched field silently produces runtime error
- **Fix**: Use typed constructors (mk_int_lit, mk_fn_decl, etc.)
- **Status**: deferred

### E2 [concern] Runtime JS code is 140-line string literal
- **File**: codegen/runtime.ts
- No syntax checking, no type checking, only caught at Ring-program runtime
- **Fix**: Smoke test evaluating runtime string, or break into function strings
- **Status**: deferred

### E3 [concern] Empty catch blocks swallowing errors — FALSE POSITIVE
- cli.ts:143 is standard temp file cleanup practice
- checker.ts:47 has console.error warning + existsSync guard; acceptable behavior
- **Status**: false positive

### E4 [suggestion] ExprStmt.has_semi field never used downstream — FALSE POSITIVE
- Used at parser.ts:348 for block-final expression detection
- **Status**: false positive

### E5 [suggestion] Three dead error codes (E0202, E0701, E0705) ✅
- **Fix applied**: Removed from codes.ts and ERROR_DESCRIPTIONS
- **Status**: fixed

### E6 [suggestion] Redundant `as TypeVar` casts in infer-register.ts ✅
- **Fix applied**: Removed casts + unused TypeVar import
- **Status**: fixed

---

## Category F: Positive Findings

- **F1** Ctx interface pattern (InferCtx, CodegenCtx, ParserCtx) -- clean circular dependency breaking
- **F2** assertNever exhaustiveness at all dispatch sites -- catches missed cases at compile time
- **F3** Zero TODO/FIXME/HACK comments -- unusually clean
- **F4** Naming conventions highly consistent across codebase
- **F5** Clean module decomposition: parser/checker/codegen/diagnostics are independent
- **F6** CLAUDE.md documentation is comprehensive and up-to-date

---

## Summary

| Category | Items | Fixed | Remaining |
|----------|-------|-------|-----------|
| Code Duplication | 5 | A1 A2 A3 | A4 A5 deferred |
| Module Boundaries | 3 | B1 | B2 B3 deferred |
| God File Risk | 4 | C4 | C1 C2 C3 deferred |
| Abstraction Quality | 2 | -- | D1 D2 deferred to self-bootstrap |
| Technical Debt | 6 | E5 E6 | E1 E2 deferred; E3 E4 false positive |
| Positive | 6 | -- | -- |

**Total**: 20 findings — **7 fixed**, 2 false positives, 11 deferred + 6 positive

### Additional bugs found and fixed during audit
- **Parser declaration-level recovery**: `parse_program` didn't catch `parse_decl_failed` errors — fixed with token-skipping recovery
- **Nested exhaustiveness check**: `check_exhaustive` used original AST patterns (where `none` is a binding) instead of reclassified HIR patterns — fixed by passing `harms` instead of `arms`
