# 2026-08-18 ownership critical continuation

## Fixed starting point

- Branch: `codex/b180-feedback-loop-continuation`.
- Parent before this checkpoint: `89b697c4e2280ecae1377cf35b2a9effe7965199`.
- Source-fix checkpoint: `4adbd7e8`; current authority checkpoint:
  `e38a489a4a5de77d5546474b6f10cbfebc93a4f8` (tree
  `43179ac6328d6832be451c50a19b8c9d95ea3549`).
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
- The formal source-compiler build in
  `tmp-ownership-critical-acceptance/23-source-build-compiler/` timed out at
  1200 s with empty stdout/stderr and no measurement error. It remained one
  process, reached 4,921,294,848 bytes sampled/root RSS and 5,087,723,520 bytes
  peak job commit, and produced no compiler artifact. This is a bootstrap
  blocker, not evidence of a source diagnostic or crash; do not extend or
  rerun it merely to obtain a more attractive receipt.
- The stale Unit-1 `compiler.ownership_shadow_layout` oracle now follows the
  A-prime transport: ownership terms, direct/result DefIds, transfer-state
  spines, and content-addressed descriptor intern/merge/import. Its focused
  source/mutation structural receipt is PASS (1/1) in
  `tmp-ownership-critical-acceptance/24-current-ownership-shadow-layout/`.
- The stale spread source-sequence oracle now accepts only a linear,
  side-effect-free C identifier transport from the evaluated Never/Return
  source through generated RC-scope and return temporaries. It still rejects
  a wrong alias, reordered allocation, multiple/missing early returns, and any
  intervening call or RC operation. The tracked-C diagnostic artifact is
  recorded under `tmp-ownership-critical-acceptance/spread-inspect/`; the
  explicit generated-C structural gate is PASS (1/1) in
  `tmp-ownership-critical-acceptance/26-current-spread-source-sequence/`
  (16.70 s wall, 216,129,536 bytes peak job commit, 251,879,424 bytes sampled
  peak process-tree RSS, no timeout or measurement error).
- The integrated canonical source-wiring gate is also PASS (1/1) in
  `tmp-ownership-critical-acceptance/27-current-canonical-source-wiring/`
  (15.96 s wall, 195,121,152 bytes peak commit, 229,289,984 bytes sampled
  tree RSS; measurement SHA256
  `2C37628A319591100ACC5DD59C6F130E3F7A44A311D02E31EBFBEA3CAAEF1742`).
- A historical lv0 compiler
  (`ring-old.exe` SHA256
  `DAACBB6C5587942FA109FE097E9D508BDED2440A4D7F315B1631CCE219FCA0A9`)
  still checks current `compiler/infer.ring` successfully (`29-old-anchor-check-infer`,
  304.95 s), but its first fresh build fails immediately and correctly records
  the known old-parser incompatibility at `compiler/ownership.ring:8556`
  (`Expected ')', got 'expr'`). Receipt `30-old-anchor-fresh-gen1-e38a489a`
  is the preserved first failure; it produced no artifact and must not be
  rewritten as a bootstrap attempt that reached inference.
- A clean strict A6 crossing compiler (SHA256
  `AB63D5632132497187677091FC511CC58B19CA73081A106321374244BEB7C8AE`)
  checks current `compiler/infer.ring` successfully (`31-a6-check-infer`) and
  then generated a fresh current-source gen1 compiler in
  `32-a6-fresh-gen1-e38a489a`: PASS in 1380.61 s, 8,882,806,784 bytes sampled
  tree RSS, and 9,185,689,600 bytes peak job commit. The generated `main.c` is
  24,282,398 bytes with SHA256
  `62D4439839EC1FED4BB8ADD3C24FD7872C0812483B8DCA281BFE4E13DF41FAD7`;
  its generated object SHA256 is
  `4FECA011104F2B0DF843D7082248B6281A62CB1A82E16F1DBB0942AF117B843E`.
  The formal measurement SHA256 is
  `AF050D176A0DDA44135025EB570171E37BDA69C36FA5AE3483B311D6CA7466BB`.
- That gen1 C was compiled and linked with the exact O3/ThinLTO recipe into
  `ring-gen1.exe` SHA256
  `688DDC2B8244EA7A9086AEC33DF396C0453285C7C0CC81331D15CE783D3D83E7`
  (`33` through `35`, all PASS). The source-generated compiler then passed
  `check` and `build` for `ownership_modes_cfg` (`36`/`37`), the generated
  executable was compiled/linked (`38`/`39`), and its complete stdout matched
  the tracked expected output byte-for-byte (`40`), including the repaired
  post-shadow outer value 11 and full Drop ordering. A separate ignored probe
  also proves failed nested-block inference restores the outer scope: `41`
  expects exactly one E0301 and rejects Undefined, parameter-mismatch, E0801,
  panic/internal, stdout, or extra diagnostics; it is PASS.
- The fresh gen1-to-gen2 fixed-point attempt is preserved in
  `42-gen1-fresh-gen2-e38a489a`. It did not time out: at 2279.57 s the fixed
  12 GiB Job boundary was reached, with 12,885,045,248 bytes peak commit and
  12,420,407,296 bytes sampled tree RSS. stderr contains only
  `ring panic: ring_alloc failed (size=16, typeid=109)`; stdout is empty and
  the fresh gen2 directory contains no file. Measurement SHA256 is
  `CF6D4CF61C529EB12FD359F11E3575893930B8E270A4E5DA0A8E3D68BF64303A`.
  This is a resource-bound fixed-point blocker, not a source diagnostic or a
  failed ownership behavior gate. The first failure is final: do not rerun it
  or raise the cap merely to obtain a fixed point.
- A paired pure-front-end control confirms that code generation is not the
  boundary. `43-gen1-check-main-e38a489a` ran the same source-built gen1 with
  `check compiler/main.ring`; it reached the same 12 GiB Job cap after
  2281.06 s, with 12,885,037,056 bytes peak commit and 12,420,317,184 bytes
  peak RSS. stdout is empty and stderr is exactly
  `ring panic: ring_alloc failed (size=16, typeid=8)`. The measurement SHA256
  is `45F51790C584269F313C04ABC896FE382C57A98CDD585F59706130BA695B3068`.
- The first materially different peak-state candidate is preserved, but
  performance-rejected, on branch `codex/b180-project-env-projection` at
  `a58bf3e4a8467ff0a22061bd41c007270882e658`. It projects each completed
  module's `TypeEnv` immediately to the exact B-145 `Set<Str>` of visible
  extern type names instead of retaining the full environment until the late
  filter. Its source/mutation authority passed; a minimal private nested
  extern / public ordinary-function collision passed candidate and baseline
  checks byte-for-byte, then candidate C build, link and native execution
  produced exactly `7`. A clean A6 build also produced candidate gen1 C
  SHA256 `6671E030987D39F24F855B16B03979C898EF125C8BC46B161F78CE205B0842F7`
  and executable SHA256
  `40D9DC7956DBFEFA754D667B58BDEB1ABBD59CAF306AAB6C7DA1DB77A6C84456`.
- The decisive candidate `check compiler/main.ring` receipt is
  `results/55-candidate-gen1-check-compiler-main-projection`. It still hit the
  12 GiB cap after 2251.54 s: 12,885,041,152 bytes peak commit and
  12,420,857,856 bytes peak RSS. Compared with receipt 43 this is 29.52 s
  earlier, +4,096 bytes commit and +540,672 bytes RSS. stderr is byte-identical
  to receipt 43 (SHA256
  `C880F9E6AAEB6177D826DFCCE20F624E312A1B350F1CF60CE027891EE690CF35`),
  and the candidate measurement SHA256 is
  `FEEE26ED6EEC0FB0A6BE7A3BFD6523EA723804120ECFE09A7F2079BA557F84D3`.
  This refutes retained per-module `TypeEnv` as the material peak owner. Do not
  merge the candidate, run gen2 from it, or rerun it for a prettier result.

First failures remain evidence and must not be rewritten as passes:

- `03b-canonical-structural-source`: stale pre-A-prime ownership layout oracle;
  retained as the first failure and superseded only by focused receipt `24`.
- `03c-canonical-spread-structural`: stale generated-C temporary-name oracle;
  retained as the first failure and superseded only by focused receipt `26`.
- `04-ownership-modes-cfg` and `04b`: original owner-bearing pattern capture and
  the intermediate forgotten `.id` correction.
- `04c-ownership-modes-cfg-fixed`: the actual post-block 12-vs-11 finding.
- `07-check-infer-scoped` and `07b-check-infer-scoped`: 120 s and 300 s
  timeouts without diagnostics, at about 2.06 GiB and 2.55 GiB peak commit.
- `30-old-anchor-fresh-gen1-e38a489a`: old lv0 parser rejects current move
  parameter syntax before generation; no artifact.
- `42-gen1-fresh-gen2-e38a489a`: source-built gen1 reaches the 12 GiB Job
  commit boundary after 2279.57 s and fails a 16-byte allocation; no artifact.
- `43-gen1-check-main-e38a489a`: the pure front end reaches the same boundary
  after 2281.06 s with byte-stable `typeid=8` panic output.
- `results/55-candidate-gen1-check-compiler-main-projection`: the exact
  projection candidate reaches the same boundary 29.52 s earlier with the
  same stderr; this is the final receipt for that rejected construction.

## Remaining gates

1. Treat the new gen1 as real source-generated correctness evidence: the
   ownership/block runtime matrix and the failure-scope recovery probe have
   both passed. The older C mirror remains supporting evidence only.
2. Retain the checkpoint as **not fixed-point closed**. Gen1-to-gen2 and the
   pure check now have the same precise resource blocker at the unchanged
   12 GiB limit. Early projection of completed module TypeEnvs has been tested
   and refuted as a peak-memory remedy. Any later bootstrap proposal must avoid
   a proven high-volume allocation/rebuild, or change construction in a way
   that has direct authority for the peak; another unmeasured retained-container
   projection is not authorized. Do not rerun either command, raise the cap, or
   describe the absence of gen2 output as a correctness failure.
3. Do not replace `compiler/dist-c/main.c` with gen1 yet. The generated file is
   not fixed-point proven and differs broadly from the tracked anchor; review
   and a successful gen2 byte comparison are prerequisites.
4. After a materially different route produces gen2, compare gen1/gen2 C
   byte-for-byte, rerun the two focused gen2 gates, and only then update the
   bootstrap anchor and proceed to the remaining #268/#269 C/RC/ASan/double-
   bootstrap acceptance matrix. Neither critical finding is closed here.
