# Architecture Health & Technical Debt Audit Report

**Date**: 2026-05-20
**Scope**: compiler/src/ (46 files, 13,134 LoC)
**Auditors**: Claude Opus (B+), DeepSeek V4 Pro (C+)
**Composite Grade**: B-

---

## Category A: Code Duplication (Most Actionable)

### A1 [issue] Eq/Ord dispatch logic copy-pasted
- **Files**: checker/infer-expr.ts:201-293, hir/index.ts:73-81
- `resolve_eq_extra_dicts` / `resolve_ord_extra_dicts` differ only in "Eq"/"Ord" string
- `resolve_type_to_eq_dict` / `resolve_type_to_ord_dict` identical structure
- `EqDispatch` / `OrdDispatch` HIR types structurally identical
- **Fix**: Parameterize by trait name, use single `TraitDispatch` type
- **Status**: pending

### A2 [issue] Primitive type→builtin name mapping repeated 5+ locations
- **Files**: infer-expr.ts:466-479, infer-expr.ts:392-400, infer-ctx.ts:269-275, codegen-expr.ts:264-270
- Same `recv_type.kind === "str" ? BUILTIN_STR : ...` pattern in 5 places
- **Fix**: Extract `type_to_builtin_name(t: Type)` utility
- **Status**: pending

### A3 [issue] struct/enum branches duplicated in infer_method_call
- **File**: checker/infer-expr.ts:444-462
- Both branches do identical `ctx.env.impl_methods.get(name)` lookup
- **Fix**: Merge branches (2-minute fix)
- **Status**: pending

### A4 [concern] HExpr/HStmt switch duplicated across 5+ files
- **Files**: codegen-expr.ts, zonk.ts, hir-visitor.ts, completion.ts
- Full 26-variant HExpr switch in 4+ locations, 11-variant HStmt in 5+ locations
- completion.ts maintains its own HIR walker despite hir-visitor.ts existing
- **Fix**: Extend hir-visitor.ts for completion's use case; inherent to multi-pass compiler for others
- **Status**: pending

### A5 [concern] AST expression traversal duplicated in definition.ts
- **File**: lsp/features/definition.ts:45-137
- 90-line switch over all AST Expr kinds, paralleling infer-expr.ts dispatch
- **Fix**: Extract shared AST visitor or migrate to HIR-based approach
- **Status**: pending

---

## Category B: Module Boundaries

### B1 [issue] Circular import: types/index.ts <-> hir/index.ts
- types/index.ts imports BUILTIN_* from hir/index.ts; hir imports Type from types
- Conceptually wrong: types/ should be foundational, not depend on HIR
- **Fix**: Move BUILTIN_* constants to types/ (they are type-system names)
- **Status**: pending

### B2 [concern] Method name registries (CELL_METHODS, STR_METHODS etc.) in hir/index.ts
- **File**: hir/index.ts:557-583
- 14 const arrays of method names -- runtime registrations, not HIR definitions
- Consumed by codegen and checker, creating cross-cutting dependency
- **Fix**: Move to shared builtin-methods.ts
- **Status**: pending

### B3 [concern] DerivedImpl leaks derive pass details into codegen
- codegen.ts:248-440 reconstructs trait dictionaries by walking DerivedImpl fields
- Change to auto-derive requires updates in derive.ts + hir/index.ts + codegen.ts
- **Fix**: Either accept 3-file coupling (it's well-structured) or pre-generate JS in derive pass
- **Status**: pending

---

## Category C: God File Risk

### C1 [concern] infer-expr.ts at 1195 lines
- 20+ expression inference functions + Eq/Ord dispatch helpers
- No clear internal grouping between HOF helpers, trait helpers, core inference
- **Fix**: Extract trait dispatch to infer-dispatch.ts; split further at ~1500 lines
- **Status**: pending

### C2 [concern] infer.ts at 851 lines
- Mixes pass orchestration with 10+ declaration body checkers + stmt inference
- Expression inference extracted but statement inference not (asymmetry)
- **Fix**: Extract infer-stmt.ts and/or infer-check-decl.ts
- **Status**: pending

### C3 [suggestion] builtins.ts at 561 lines
- Core builtins + HOF intrinsics in one file, no shared helpers
- Adding a method requires navigating 600-line file
- **Fix**: Split into builtins/core.ts + builtins/hof-intrinsics.ts
- **Status**: pending

### C4 [suggestion] codegen.ts: ~300 lines auto-derive codegen
- emit_derived_eq/clone/ord/debug occupy half the file
- **Fix**: Extract to codegen-derive.ts
- **Status**: pending

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
- **Status**: pending

### E2 [concern] Runtime JS code is 140-line string literal
- **File**: codegen/runtime.ts
- No syntax checking, no type checking, only caught at Ring-program runtime
- **Fix**: Smoke test evaluating runtime string, or break into function strings
- **Status**: pending

### E3 [concern] Empty catch blocks swallowing errors
- cli.ts:143 silently ignores file deletion failures
- checker.ts:47 swallows prelude loading with warning, continues with incomplete env
- **Fix**: Hard error for prelude; debug-log for temp file
- **Status**: pending

### E4 [suggestion] ExprStmt.has_semi field never used downstream
- **File**: ast/index.ts:414
- Parser sets it but checker/codegen/HIR never consume
- **Fix**: Remove or use
- **Status**: pending

### E5 [suggestion] Three dead error codes (E0202, E0701, E0705)
- Reserved codes with no active use, adding noise
- **Fix**: Remove or document timeline
- **Status**: pending

### E6 [suggestion] Redundant `as TypeVar` casts in infer-register.ts
- fresh_var() already returns TypeVar, casts unnecessary
- **Fix**: Remove casts
- **Status**: pending

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

| Category | Items | Action |
|----------|-------|--------|
| Code Duplication | 5 | Fix A1-A3 now, A4-A5 deferred |
| Module Boundaries | 3 | Fix B1 now, B2-B3 assess |
| God File Risk | 4 | Fix C1-C2 if near threshold |
| Abstraction Quality | 2 | Deferred to self-bootstrap |
| Technical Debt | 6 | Fix E1/E3 now, rest assess |
| Positive | 6 | -- |

**Total**: 20 findings (5 issues, 8 concerns, 7 suggestions) + 6 positive
