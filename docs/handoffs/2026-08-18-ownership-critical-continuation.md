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
- A runtime-only allocation census now supplies the first direct allocation
  authority for the shared-front-end wall. It reuses the fixed source-built
  gen1 `main-lto.o` SHA256
  `503BB6337287DED78ADFB153259B0580F1CF6472A7A37AFF327AFC243DE7FB65`
  and unchanged generated C SHA256
  `62D4439839EC1FED4BB8ADD3C24FD7872C0812483B8DCA281BFE4E13DF41FAD7`.
  Only `ring_runtime.cpp` SHA256
  `162005B4A2DBAB6DC34646B2F4D21218424DE17FDC446D6A204842160EAD2B91`
  was rebuilt with the existing opt-in `-DRING_ALLOC_STATS`; the resulting
  runtime object is
  `007B8887C366A25D6044A6374BD06E3D25C328FE9328865650965CD9E161B8E4`
  and the linked diagnostic executable is
  `189CA7F4BECF68860146629AEEBE2D6F06D6D870867AFE7D3A620B44894E8304`.
  Exact compile/link receipts `56-alloc-stats-runtime-compile` and
  `57-alloc-stats-link` PASS. Receipt `58-alloc-stats-smoke` checks
  `examples/hello.ring`, prints `OK`, and emits a normal final alloc report;
  its stderr SHA256 is
  `8DCEB87CCA2B3214653514370AFB1A6653D428CECC7C0904B0E983AE1FFE0A35`.
- The one authorized long census is final in
  `results/59-alloc-stats-check-main-e38a489a`. The exact command remained
  `check compiler/main.ring` under 2400 s / 12 GiB / 5-process governance.
  It timed out normally after 2400.57 s with no measurement error, one process,
  6,951,931,904 bytes peak job commit (6.47 GiB), and 5,579,550,720 bytes
  sampled/root RSS (5.20 GiB). Measurement SHA256 is
  `668875678285C7F7E16ACA6B1E8E66F63385491E6B60442787344DEBFF0598A1`;
  stdout is empty (SHA256
  `E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855`)
  and stderr SHA256 is
  `EAE367E6552B794ED716B1B3B0EC70F632B9F6CD45AB7A497E52A8BBDC8ECE57`.
  The timeout killed the process, so there is no `atexit` final sample; stderr
  contains 1,238 periodic `[alloc-stats]` lines, 238 registration lines, and
  no other diagnostic or panic.
- The periodic census trajectory is absolute and monotone in allocation
  milestones:

  | allocs | live | Option (tid 8) | Map (tid 5) | List (tid 4) | Type (tid 76) |
  | ---: | ---: | ---: | ---: | ---: | ---: |
  | 3,355,443,200 | 9,443,158 | 1,948,006 | 1,918,178 | 1,589,766 | 1,048,251 |
  | 13,421,772,800 | 17,422,061 | 5,794,398 | 5,771,930 | 1,693,456 | 1,126,322 |
  | 26,843,545,600 | 28,358,497 | 11,057,595 | 11,046,426 | 1,841,122 | 1,238,333 |
  | 40,265,318,400 | 39,464,472 | 16,405,451 | 16,405,329 | 1,989,334 | 1,350,535 |
  | 41,540,386,816 | 40,119,805 | 16,725,978 | 16,725,286 | 1,995,069 | 1,354,400 |

  The last complete sample represents 17.30 million allocations/s and
  0.09658% absolute retention. Frees therefore keep pace in percentage terms,
  but that small residual over 41.54 billion allocations leaves 40.12 million
  live boxes. `Option` and `Map` differ by only 692 objects and together form
  83.38% of final live objects. From the 3.355-billion milestone onward they
  contribute 29,585,080 of the 30,676,647 additional live objects: 96.44% of
  net growth. The remaining mapped top types are `tid76=types::Type`,
  `tid150=types::EffectRow`, and `tid84=hir::HExpr`; the final top six account
  for 94.95% of live objects. This is strong evidence for a retained
  `Option<Map<...>>`-shaped construction or two coupled producers, not for the
  rejected completed-module `TypeEnv` hypothesis and not for a global failure
  to run destructors.
- The stats executable is deliberately not a performance comparator. Each
  alloc/free performs extra global counter and type-table writes and the run
  emitted 1,238 flushed reports. It reached an unknown earlier logical point
  than receipt 43 and used 46.0% less commit / 55.1% less RSS; those differences
  are instrumentation perturbation or progress differences, not an accepted
  memory improvement. The census authorizes allocation-site attribution only.
- The focused attribution implementation is checkpoint
  `b8e40d79c22918a08e7d00772e0760b14bcd148c`. It is guarded by the new
  measurement-only `RING_MAP_OPTION_PROFILE`: Map and Option each use two
  independently mixed 1/4096 lanes, sampled live state is keyed by pointer,
  and born/live aggregation is keyed by `(tid, lane, RA0, RA1, RA2)`. Reports
  occur only at 2^31 allocations and every 2^29 thereafter; 2^32 emits a final
  report and self-stops with exit 86. Outer free and const retag both retire the
  exact live count and sampled pointer. Independent review found no blocker.
  With the macro disabled, parent and working-tree O3 LLVM IR are byte-identical
  (847,543 characters under the same clang/flags), so the default runtime path
  is unchanged.
- The exact profile build reuses fixed `main-lto.o` SHA256
  `503BB6337287DED78ADFB153259B0580F1CF6472A7A37AFF327AFC243DE7FB65`.
  `ring_runtime.cpp` SHA256 is
  `EBEA029A8CB6626872E470A23CB6DE00ADDF531A924910826D66D026AC6CB883`;
  the O3/ThinLTO profile runtime object is
  `A94C84BE6CF404A25CB911E493794D9EE19BB52FFD7C0AB243A50C7E3EADC004`.
  The exact executable/map pair is
  `AB57D9B0A8996156941F42A76B884191E58D8F34393121CADEBF09A0316F5ABF`
  / `7360754C9D3AEC29F8F5B50C9AE0A0B56C0939E3701FE90E8F61E9D5B9E0A87F`.
  The map contains one retained `ring_alloc`; all return addresses below are
  symbolized against this map using `RVA - 1`. Toolchain is clang/LLD 22.1.6
  (`fc4aad7b5db3fff421df9a9637605b9ca5667881`). Exact compile/link receipts are
  `results/62-map-option-profile-runtime-compile` and
  `results/63-map-option-profile-link`.
- Smoke receipt `results/64-map-option-profile-smoke-hello` is PASS: exit 0,
  stdout exactly `OK\r\n`, 2,668,459 allocations, both tids sampled,
  `stack_failures=0`, `invariant_failures=0`, and every reported RA0/RA1/RA2 is
  inside the exact image/map. Born-only signatures remain visible after their
  sampled objects are freed, so the smoke also proves allocation/free closure.
  Its measurement/stdout/stderr SHA256 values are respectively
  `B7FDCB950DF781ECC9E3C9E4ABDBDC5D1B2F5B1A5AD9B08D0525790C7DB258C6`,
  `19D8C9921B99C82D78C985136A5E28F6382011641FB6160C0C1A7573A402EA66`,
  and `88051F872FD159095FEEEF33D69FBFEA475A0BFC3226C1815848E74F2287DE03`.
- The one authorized main attribution is final in
  `results/65-map-option-profile-check-main`. It reached the exact 2^32
  allocation self-stop after 208.78 s, exit 86, with no timeout or measurement
  error, one process, 2,339,614,720 bytes peak job commit and 2,276,249,600
  bytes sampled tree RSS. stdout is empty. The measurement/stdout/stderr hashes
  are `744E447942ACA600D0E65F7883A19E99C979685F286B67B23332E6A08DD806BD`,
  `E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855`,
  and `817ABA4C78D6FC90A5B9F016BECD964CE4202CD1B267FF1C9DAD193341BE8222`.
  All five snapshots have zero stack/invariant failures:

  | allocations | Map exact live | Option exact live | Map sample A/B | Option sample A/B |
  | ---: | ---: | ---: | ---: | ---: |
  | 2,147,483,648 | 1,564,502 | 1,594,411 | 405 / 386 | 379 / 359 |
  | 2,684,354,560 | 1,800,221 | 1,830,222 | 466 / 458 | 437 / 415 |
  | 3,221,225,472 | 1,918,183 | 1,948,011 | 490 / 487 | 467 / 444 |
  | 3,758,096,384 | 2,120,634 | 2,150,562 | 541 / 527 | 506 / 493 |
  | 4,294,967,296 | 2,446,941 | 2,475,254 | 632 / 613 | 597 / 567 |

- The sampler is internally credible but the source-authorization gate fails.
  Final estimate error versus exact live is 5.79% / 2.61% for Map A/B and
  1.21% / 6.17% for Option A/B. However the final top-signature shares are only
  34.02% / 36.05% and 29.82% / 32.10%; their Wilson 95% lower bounds are only
  30.43% / 32.35% and 26.28% / 28.39%. Only Map A and Option B keep one top for
  all final three snapshots. The final top explains 45.77% / 52.38% and
  45.38% / 47.15% of sampled net-live growth from the third-last snapshot, so
  only one lane barely crosses 50%.
- Exact map, disassembly and fixed-C correlation resolve the two dominant
  sibling groups, not one producer. The Struct arm at
  `compiler/unify.ring:197-215` allocates Map at line 200 and wraps it in Some
  at line 215; the Enum arm at `compiler/unify.ring:249-267` does the same at
  lines 252/267. Both live signatures recurse through the enum-field return at
  lines 276-277. Generated C moves `created` into the Option and borrows its
  payload, but emits no drop for either `mapping` local on normal or early
  return. The two arms share an invariant and missing-cleanup shape, yet they
  remain two separately sampled source sites. Post-hoc top-two grouping reaches
  roughly 62%-68% Map and 54%-57% Option, but it was not the preregistered unit
  and its holdout majority is not closed. Verdict: `insufficient-evidence`.
  Do not turn this result into a source workaround, cache/drop guess, new sample
  grouping, or another run on the same snapshot.
- A genuinely new abstraction-level fixture is preserved under ignored
  `bench/check/results/ownership-option-cleanup-20260819/direct-evidence/`.
  It uses the exact source-built gen1 compiler SHA256
  `688DDC2B8244EA7A9086AEC33DF396C0453285C7C0CC81331D15CE783D3D83E7`.
  Direct Map early return, direct `some(Resource)`, and direct `some(Map)` normal
  and early-return controls print exactly one `drop 10/20/30/40`. Three assigned
  forms—`Option<Map>` early, `Option<Map>` normal, and `Option<Resource>`
  normal—return true but print no `drop 50/60/70`. A live `--verify-rc` build
  exits 0, proving the old verifier shares the blind spot.
- Fixed generated C makes the transition exact: `created` is moved into Some
  and nulled; pattern payloads remain borrows; the assigned wrapper has no Drop
  on either fallthrough or Return. Perceus classifies a Var only from its
  initial producer, so exact immortal `none` never enters the cleanup set;
  subsequent Assign therefore receives neither W4 old-value Drop nor final
  scope/return cleanup. The ownership planner's exact DefId/Take state is not
  the failing layer, and codegen only reflects the missing post-RC HIR Drop.
- Independent Argument rejected the direct-none promotion: existing `owned`
  membership also forces `tail_escape`, so a never-assigned neutral Var would
  add an unconsumed Clone to unrelated borrowed tails or panic on a move-only
  borrowed tail. The larger post-RC `{none, owned, empty}` prototype is durable
  only as rejected commit `56a3c95e3dca08de39bd2804d3a794b66b13a91e`
  (`REJECTED EXPERIMENT — DO NOT MERGE`). It exceeded 1,000 lines of duplicate
  HIR traversal, left If/Match/Block tail provenance unknown, polluted
  Lambda/handler gensym/projection state during loop probes, and failed focused
  source check with 12 E0208 diagnostics. No point fixes are authorized on that
  branch.
- The only active implementation candidate is the bounded S-prime subset. An
  exact-none, physical-RC, nonboxed Var may enter cleanup only when every
  reachable block-tail value proves—by existing expression ownership facts,
  not type or spelling—that switching the tail to escape mode inserts no Clone,
  changes no Take, and cannot hit a may-own escape panic. Fresh values are
  eligible; Ident/Field/Index/borrow-return Call and opaque effect/control
  shapes are fail-closed. A dedicated verifier kind must independently reject
  missing first/rearmed W4 and exit Drops. This is a correct, reversible subset,
  not closure of the general owner-bearing-tail finding.
- That candidate is now implemented on the continuation branch. Perceus uses
  exact DefId cleanup slots plus the bounded reachable-tail predicate; verify_rc
  independently recovers post-RC synthetic producers and tracks a dedicated
  Option state. Independent review cleared the final TryCatch and strict-A6
  transfer fixes. The source-built gen1 passes runtime Drop output 1/1, focused
  RC live/mutations 8/8, generated-C structural 1/1, and parity 1/1. The fixed
  A6 generated 24,431,738-byte C in 1435.52 s at 9,351,241,728 bytes peak Job
  commit; C SHA256 is
  `DBC1547E1B7031949B990ECB8D63062D49CC94897091428833BF0B1EB2D9AA1A`,
  and the native O3/ThinLTO gen1 SHA256 is
  `64CED1C43E95BC15314685E5EF78FF34D22D84D12BE1592708D4E36C0C14EB30`.
- This does not close self-host. The full candidate gen1 is itself old-lowered;
  its one gen2 build reached the fixed 12 GiB limit after 2371.12 s with
  `ring_alloc failed (size=16, typeid=8)` and no output. The result explains the
  crossing cycle: S-prime runs inside gen1 and would clean generated gen2 C, but
  cannot retroactively clean the A6-generated gen1 executable that must survive
  long enough to emit it.
- One bounded crossing construction was independently authorized and is final.
  Bootstrap-only commit `883e5713` replaces only the temporary mirror's
  3016-line verifier with a 30-line, API-compatible, fail-closed stub. It leaves
  ordinary parser/checker/ownership/Perceus/codegen/build paths intact. The
  gen1-to-lite attempt still reached 12 GiB after 2347.24 s with byte-identical
  typeid-8 stderr and no C artifact. The construction is insufficient and must
  not merge or be widened by removing more modules.

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
- `results/59-alloc-stats-check-main-e38a489a`: the one 2400 s allocation
  census times out without panic after 1,238 complete samples. It is diagnostic
  authority for live-type growth, not a performance or whole-loop pass, and
  must not be rerun to compare wall time or peak memory with receipt 43.
- `bench/check/results/ownership-option-cleanup-20260819/s-prime-acceptance/01-a6-fresh-gen1`:
  operator-precondition failure after
  compilation because the output directory had not been pre-created; preserved
  and superseded once by receipt `02`, never rewritten as candidate evidence.
- `bench/check/results/ownership-option-cleanup-20260819/s-prime-acceptance/07`,
  `08`, and `10`: first executable test failures that
  exposed non-unique mutation ordinals and invalid structural controls; tests
  were isolated rather than production guarantees weakened.
- `bench/check/results/ownership-option-cleanup-20260819/s-prime-acceptance/14-gen1-fresh-gen2`:
  the only full S-prime self-host
  attempt, final at 12 GiB/typeid 8 after 2371.12 s with no artifact.
- `bench/check/results/ownership-option-cleanup-20260819/s-prime-acceptance/15-gen1-build-bootstrap-lite`:
  the only verifier-stub
  crossing attempt, final at the same wall after 2347.24 s with no artifact.

## Remaining gates

### A6-compatible S-prime seed Argument (2026-08-19 continuation)

- The next bounded construction is an untrusted bootstrap seed, not a compiler
  acceptance candidate.  It keeps the accepted S-prime Perceus/verifier blobs,
  restores `compiler/infer.ring` to the pre-scoped-block `95e12437` blob, and
  removes only the final exact-import producer-edge helper/call from
  `compiler/infer_ctx.ring`.  Every other compiler/runtime blob remains at
  `a11ea063`; the seed, its generated C, and its branch must never merge or
  replace the tracked anchor.
- The rejected alternative is not another module deletion.  If this seed is
  falsified, the next real candidate is an inline-module unity-source bridge,
  preceded by a small import/trait/effect identity equivalence probe.  The
  current CLI has no HIR serialization, phase-resume, or module-object artifact
  that would make direct split compilation an existing short path.
- Before the one A6-to-seed generation, static admission requires exactly two
  changed compiler files, `infer.ring` blob
  `91a7797d1f28817fd1432b0967c55033f71b740f`, removal of the exact-alias helper
  and unique call, unchanged S-prime blobs `deb88eed474f168e8848a58a16fcafbdf86b13a7`
  / `57dbda21604c0a4f4fb9e6da9be2cb62598860ba`, and clean diff/source gates.
- A generated seed is contained, not trusted: lexical shadow and private
  callable-const re-export must reproduce their two known pre-fix outcomes and
  no new failure; the S-prime runtime, RC mutation, structural, and parity gates
  must still pass.  The same existing Map/Option profiler will then stop both
  constructions at exactly 2^32 allocations.  Against receipt 65's final exact
  Map+Option live count 4,922,195 and peak Job commit 2,339,614,720 bytes, seed
  admission to a full crossing requires combined live <= 3,937,756 (20% lower)
  and peak commit <= 2,105,653,248 bytes (10% lower), with exit 86, five complete
  milestones, and zero stack/invariant failures.  Missing either threshold
  stops this route; there is no full-run retry.
- If the prefix passes, seed-to-current1 must complete under the unchanged
  12 GiB/5-process limits.  Current1 must restore both contained fixes and all
  S-prime gates before current1-to-current2-to-current3.  Only byte-identical
  current2/current3 C can establish the fixed point; current1/current2 is not
  sufficient because current1 was inferred by the deliberately reduced seed.

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
3. The fixed-object allocation route remains closed as `insufficient-evidence`:
   do not rerun, regroup, disable ICF, or patch `unify.ring`. S-prime has passed
   its focused correctness gates, but both the full gen2 and the only authorized
   bootstrap-lite crossing hit the unchanged resource wall. Do not profile the
   same old-lowered gen1 again: profiling cannot make a Perceus-only fix apply to
   the executable that contains it. Any next construction needs a new Argument
   with direct authority for crossing the peak, not another retained-container
   guess, module deletion, runtime/typeid workaround, or cap increase.
4. Do not replace `compiler/dist-c/main.c` with gen1 yet. The generated file is
   not fixed-point proven and differs broadly from the tracked anchor; review
   and a successful gen2 byte comparison are prerequisites.
5. After a genuinely new authorized route produces a full compiler generated by
   S-prime, generate one further full compiler and compare those two full C
   outputs byte-for-byte. Restore verifier/mutation gates on that full compiler,
   then update the bootstrap anchor and proceed to the remaining #268/#269
   C/RC/ASan/double-bootstrap acceptance matrix. Neither critical finding nor
   the performance blocker is closed here.
