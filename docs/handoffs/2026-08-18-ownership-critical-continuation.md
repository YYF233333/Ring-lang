# 2026-08-18 ownership critical continuation

## Fixed starting point

- Branch: `codex/b180-feedback-loop-continuation`.
- Parent before this checkpoint: `89b697c4e2280ecae1377cf35b2a9effe7965199`.
- B-180 compiler-candidate exploration is closed. Do not reopen matrix, defer,
  callable memo/worklist, fresh-ID rollback, or another locator to fill the gap.
- #268/#269 remain `[critical] [doing]`; this unit is a correctness checkpoint,
  not final acceptance.

## Finding and root cause

`tests/cases/ownership_modes_cfg.ring` exposed a lexical shadow identity failure:
after an inner block dropped `Resource { id: 12 }`, the next outer
`observe(shadowed)` printed 12 instead of 11. Generated C already had distinct
`r_shadowed`/`r_shadowed_2` slots, but the post-block HIR read named the inner
DefId and therefore selected `r_shadowed_2` again. Codegen's exact-DefId lookup
was not the cause.

`infer_block` deliberately operates in the caller's current owner/binder scope.
Nested ordinary blocks and the two `infer_if` block arms bypassed every
`push_scope`/`pop_scope`; unsafe blocks had the same hole. The source fix adds
`infer_scoped_block`, which pushes a child TypeEnv scope, catches the local
`CompileError`, restores the scope, and then returns or re-raises. Only these
four nested lexical entry points use it. Function bodies and existing
while/for/pattern scopes retain their former authority.

## Tracked scope

- `compiler/infer.ring`: scoped-block firebreak and four call sites.
- `tests/cases/ownership_modes_cfg.ring/.expected`: legal Int pattern captures,
  ordinary block shadow, and independent then/else shadow observations.
- `tests/run_tests.py`: current ownership transfer-spine authorities plus exact
  nested-scope topology and six discriminating mutations.
- `docs/audit-report.md`: critical status and remaining bootstrap boundary.

Two experimental files from the abandoned import-time authority design are not
part of this checkpoint. All generated-C mirrors, wrappers, executables, and
receipts remain under ignored `tmp-ownership-critical-acceptance/`.

## Evidence

- Source-only ownership authority: PASS in
  `tmp-ownership-critical-acceptance/21-source-authority-interpolation/`.
- Canonical runner wiring plus one selected structural case: PASS in
  `tmp-ownership-critical-acceptance/22-final-canonical-source-wiring/`.
- Isolated behavior mirror uses tracked `compiler/dist-c/main.c` SHA256
  `D7BB015B32EF8F4A438093509C794C82B60C13548808B0A1093AEFEAB0DF7F2E`
  and only normal-path push/pop around the four generated nested-block calls.
  Its final C SHA256 is
  `18446E79584DC688B66A35EE08747CC691D67DE9646D4FD3352613038599F2EE`.
- The six-case mirror matrix PASS is preserved in
  `tmp-ownership-critical-acceptance/19-scoped-mirror-matrix/`: ownership modes,
  ordinary block expressions, golden block expressions, adversarial complex
  block expressions, named-pattern shadowing, and unsafe blocks.
- `git diff --check` is clean apart from the repository's existing LF/CRLF
  conversion warnings.

First failures remain evidence and must not be rewritten as passes:

- `03b-canonical-structural-source`: stale pre-A-prime ownership layout oracle.
- `03c-canonical-spread-structural`: stale generated-C temporary-name oracle.
- `04-ownership-modes-cfg` and `04b`: original owner-bearing pattern capture and
  the intermediate forgotten `.id` correction.
- `04c-ownership-modes-cfg-fixed`: the actual post-block 12-vs-11 finding.
- `07-check-infer-scoped` and `07b-check-infer-scoped`: 120 s and 300 s
  timeouts without diagnostics, at about 2.06 GiB and 2.55 GiB peak commit.

## Remaining gates

1. Independently review the Ring scope/failure ownership topology; the ignored
   C mirror is behavior evidence only and does not prove generated cleanup.
2. Generate a compiler from the changed Ring source under the 12 GiB / five
   process lane. If the current whole-compiler bottleneck prevents this, retain
   the checkpoint as unbootstrapped instead of substituting the mirror.
3. With that generated compiler, rerun the focused ownership/block matrix and
   an error-recovery case that proves a failed nested block restores its scope.
4. Only then update `compiler/dist-c/main.c`, run self-compile fixed-point, and
   proceed to the remaining #268/#269 C/RC/ASan/double-bootstrap acceptance
   matrix. Do not mark either critical finding closed before those gates.
