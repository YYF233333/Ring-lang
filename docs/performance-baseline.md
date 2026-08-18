# B-176 developer feedback replay index

This file is a compact replay index, not a performance KPI report. B-176 uses
measurements only to choose and verify changes that shorten the end-to-end
Ring-lang development loop.

## Frozen identity

- Semantic source commit: `95e12437d33bb2b425ad6257d5d103e51dbce3ae`.
- Governance-only continuation: `90c2c9d3238e570828eb4e013482f72d71f42769`;
  the diff from the semantic source touches only `docs/backlog.md`.
- Git tree at the semantic source: `38a2fb63da88ccde33d6303bf3c317b20a1bf7bc`.
- Tracked C anchor SHA-256:
  `D7BB015B32EF8F4A438093509C794C82B60C13548808B0A1093AEFEAB0DF7F2E`.
- Runtime SHA-256:
  `162005B4A2DBAB6DC34646B2F4D21218424DE17FDC446D6A204842160EAD2B91`.
- Measurement manifest SHA-256:
  `560C0ABDF7360A46E93B7FA77D07173086093AC295363B1E59234939164ED535`.
- Invocation schema SHA-256:
  `39CB8F3437393205F3E2CE80A16F4DB60032435CA4B45A7673DDF8B291A617A4`.

The ownership-reachable-dispatch developer-unblock item is complete. Its
focused checks are not part of this replay plan. The high-memory A7-to-A8
bootstrap and the final full acceptance gates remain deferred to the B-180
completion gate.

## Host and toolchain

- Host: `YYF-LAPTOP`, Windows 11 build `26200`, balanced power plan, AC power.
- CPU: AMD Ryzen AI 9 H 365, 20 logical cores.
- Physical memory: `33597804544` bytes.
- Python: 3.11.9,
  `C:\Users\Yufeng Ying\scoop\apps\python311\current\python.exe`, SHA-256
  `5F7B89A612C9B8AF1D6456CDFCD1DBE5CA630849E79AEBCED9BEE9A6694952EC`.
- clang/clang++: 22.1.6, executable SHA-256
  `F168B58C0F1C38F21B04C1D43A487A7EC73553C42526D26D1190EFE05C07239A`.
- lld-link: 22.1.6, executable SHA-256
  `7B8E47E423175ED6CACCC0E96603FBAD97A6BEC6361387BBED145DC7ACC08E49`.

## Representative developer commands

1. Short fixed-cost control: `ring.exe check tests/cases/hello.ring`.
2. Main edit loop: `ring.exe check compiler/main.ring`.
3. Ownership/RC edit loop:
   `ring.exe check compiler/main.ring --verify-rc`.
4. Focused validation loop:
   `python tests/run_tests.py --suite e2e --filter bool_ops.ring`.
5. The complete local standard gate is measured only when a candidate reaches
   merge review; it is not repeatedly run for profile refinement.

Cold/warm labels, wall/CPU, peak RSS, process count, stdout, stderr and phase
traces stay in ignored raw result directories. The only durable conclusion
needed here is which whole-loop candidate was kept or rejected.

## Resource envelope

- One resource-intensive measurement lane at a time; candidate implementation,
  static inspection and review may continue in other worktrees.
- Enforced Job Object memory cap: `12884901888` bytes (12 GiB aggregate
  committed memory).
- Enforced active process cap: 5 including the lane root; formal lane
  concurrency: 1.
- Keep at least 8 GiB available to Windows and the root session before starting
  a lane. A cap hit or raw command failure is retained and is not retried.
- A fail-fast machine-wide mutex covers formal lanes, preparation and probes.
  `self-compile`, `full_gate` profile loops and A7-to-A8 generation remain
  outside this bounded wave.

## Raw evidence and decisions

- `bench/check/results/b176-20260814T0012/` retains the warm seed and the raw
  `compiler_main_check_cold` timeout. The latter was also source-contaminated
  during collection, so it is failure evidence, not a comparable baseline, and
  was not retried.
- `bench/check/results/b176-profile-20260814/51e03adb/command-probes/` retains
  direct command probes. `types.ring` completed naturally; `ownership.ring`
  hit its bounded timeout and was not retried.
- `bench/check/results/b176-profile-20260814/51e03adb/elevated-broker-02/`
  retains the Samply profile and symbolized hotspot summary. The useful
  conclusion is that callable-summary fixed-point work and its speculative
  map/list/RC churn dominate; parser and file I/O do not.
- Runtime bridge inlining and a bounded small-object pool were each built from
  the same tracked C anchor and rejected because the whole `types.ring` command
  did not improve. Their raw candidates remain under
  `bench/check/results/b180-runtime-{inline,pool}-20260814/`.
- `bench/check/results/b180-runner-cache-20260814/` retains the kept first
  B-180 candidate. The focused `bool_ops` e2e command passes both from a fresh
  miss (about 59 s) and a verified warm anchor-object hit (about 3.2 s). The
  warm trace still performs both dependency scans, runtime compile, link,
  Ring build, generated-program link and execution; only the tracked anchor
  compile is reused. This is directional developer-loop evidence, not a KPI.
- `bench/check/results/b180-primitive-const-retry-20260814/` retains the next
  profile-guided compiler candidate. A bounded generated-C probe showed that
  eliminating redundant post-const callable retries for exact primitive
  literals removes the dominant fixed-point wait on `compiler/types.ring`.
  The Ring source implementation is independently source-reviewed and remains
  isolated at `8931ad0dafb0c55b00f12b6e0b769831f0b80a11`; it is not integrated.
  Exact A7 source validation did not complete: the focused source check hit its
  300 s boundary, and a capped A7-to-A8 generation hit 1500 s with no emitted
  artifact. A separate 15-minute stage-0 attempt from the measurement-only C
  probe also timed out without an artifact; it used much less memory, which is
  useful directional evidence but not a trusted bootstrap. All failures are
  retained verbatim and are not retried merely to obtain a passing sample.
  Until a real generated candidate passes focused behavior and bootstrap gates,
  the probe is optimization guidance only.
- `bench/check/results/b180-exhaustive-span-locator-20260814/` and
  `bench/check/results/b180-exhaustive-matrix-locator-20260814/` retain the
  bounded generated-C locator evidence for the next compiler prefix. The first
  locator stopped at `compiler/hir.ring:1886`: its 28-arm match exceeded
  100,000 recursive matrix calls. The reviewed irrefutable-row base reduced
  that same query to 28 calls and allowed the bounded run to progress through
  501 exhaustiveness queries before a later timeout. The timeout is retained;
  this is evidence that the earlier hotspot moved, not a claim that the whole
  command completed.
- `bench/check/results/b180-exhaustive-matrix-xperf-20260814/` is the fresh
  60-second Xperf prefix from the matrix locator executable
  (`SHA256 A9CB6F640D5D97EC1CE98D5DB56801C7A666467219EE0C108E02DC5B8D6F21A7`).
  Raw ETL is under `compiler-main-60s-capture/`; the authenticated elevated Job
  receipt is under `compiler-main-60s-request/`. The wrapper completed without
  measurement errors (about 57.4 s user CPU, 4.84 GB peak job commit, 4.66 GB
  sampled tree RSS); the target was deliberately terminated at the capture
  boundary, so its nonzero exit is not a compiler diagnostic result. Local-PDB
  stack analysis attributes about 90% of samples to callable-summary fixed
  point replay and about 67% to the `for`-protocol/unification chain ending in
  recursive nominal-to-callable reachability. The earlier `check_matrix`
  hotspot is absent from the leading stacks. Percentages are only routing
  evidence, not a performance KPI.
- `bench/check/results/b180-callable-reachability-20260817/` retains the first
  bounded response to that Xperf chain. The Argument rejected any cache that
  outlives one selector call because neither the nominal registry nor the
  mutable substitution has a generation/transaction identity. An isolated
  complete-walk source candidate remains at
  `d5ffad63e72ade9b94b19d29a4d870448acb6081`; it is not integrated. Its
  behavior-preserving generated-C probe is identified by source SHA-256
  `B70C083C6DCE2347B6DA2D1E0F6473F9DBCFA95A8C3FA50D5068E6DC0E3F52D5`
  and executable SHA-256
  `19BED451A7224FC21F0D9DD13035D6653743EBBFFFD98727D389AD2354BB8AD5`.
  The recursive-generic and hidden-record-tail ownership anchors both retained
  the original E0301 callable-contract diagnostic, and `compiler/types.ring`
  completed in about 2.30 s. The decisive 120-second `compiler/main.ring`
  prefix nevertheless completed only 196 locator queries with 11.41 GiB peak
  job commit and 10.99 GiB sampled tree RSS; the unchanged old locator target
  had completed 501 queries under the same wall boundary with 8.39/8.08 GiB.
  A pair-collapse-only mutation still reached 501 queries but changed the
  recursive-generic authority to a later rebind error, so removing the
  pair-sensitive recursion is not an admissible shortcut. The complete-walk
  candidate is therefore rejected without bootstrap, source integration or a
  repeat ETW capture. The next traversal candidate must preserve the existing
  selector decision set and prove progress in the same bounded prefix.
- The same raw directory also retains the exact-decision hidden-only follow-up.
  Source commit `15895ab7797d797d4aa658072150499f135081b8` kept every
  pair-sensitive helper and Struct/Enum actual rule unchanged, removed only
  descendant surface-scan replay, and passed independent review plus its
  source/mutation authority. The measurement-only source SHA-256 is
  `54243F74B45A3CF877713013E0B9F237722DA4EA026F29E273A35C91CF57DBD2`;
  executable SHA-256 is
  `81A5631484D3773AB6042A13399B8EA312EF6993B40E95CA48E73CC3D4B730DC`.
  Both E0301 anchors were unchanged and `compiler/types.ring` completed in
  about 2.29 s, but the 120-second main prefix stopped at the same 501 queries
  as the old target while peak job commit / sampled RSS rose to 10.68/10.29
  GiB. It is rejected without integration or bootstrap. The useful conclusion
  is that replaying the surface scan inside one nominal walk is not sufficient
  to move the whole loop; the remaining detector-local Map construction and
  `apply_subst_map` materialization require a separate authority audit before
  any further candidate.
- The `binder-fastpath-distribution/main-prefix-120s/` receipt in that raw
  directory records the next measurement-only split. The generated C SHA-256
  is `3E2E6B17220D0345CC10F1B568ED6ED51B61DFA5FAEAB8B71E12F1E18B6AC286`;
  executable SHA-256 is
  `1B5480CE5F6844F29D9973B9388BF9AFEFEC36BF46206C15B605E26D685C0FD8`.
  At the flushed query-501 boundary it had observed 34,764,600 Struct-hidden
  substitutions (23,162,798 raw-safe, 11,601,802 fallback), 15,215,813
  Enum-hidden substitutions (all safe root-binder direct), and zero calls at
  either Struct/Record pair site. These are cumulative shape counts, not a
  timing result; they justified one bounded source candidate rather than a
  persistent cache.
- `binder-fastpath-source-candidate/main-prefix-120s/` retains the reviewed
  Struct+Enum implementation at source commit
  `6bd4bd95abfc2a9204362306f6d31a961bbbb393`. Its behavior-preserving C mirror
  SHA-256 is `0593AED25A58ABE3610955D56CDD0705B7C4A871DECB60435DA463C69325FF02`;
  executable SHA-256 is
  `AB91D70F98EE36AE802DFD48E956356EA47C26B04FCEE324BE3DC0ECBB3EADE0`.
  Independent source/mutation and C-mirror reviews were CLEAR; both ownership
  anchors retained E0301 and `compiler/types.ring` passed. The 120-second main
  prefix nevertheless stopped at exactly 501 queries. Sampled tree RSS was
  5,638,926,336 bytes and peak job commit was 5,837,950,976 bytes, versus the
  old target's 8,680,701,952 / 9,006,792,704 bytes. The resource reduction did
  not move the visible feedback-loop boundary, so the candidate is rejected
  without integration or bootstrap.
- `enum-direct-source-candidate/main-prefix-120s/` retains the final narrower
  test of this path. Source commit
  `e018b12f44f2728de70df6fb75f1cff73a07b7f1` changes only the observed
  Enum root-binder case; Struct and pair paths are byte-identical to the base.
  Its reviewed C mirror SHA-256 is
  `AD944D4CB0BA514EA30126E15ADEF5B3F901A39C8817C021422EA116EA4958A9`;
  executable SHA-256 is
  `E7B6671D0F55DBEEF5C7B9F651D9DB4EC2B54B7D653433CA4B319C222407BFAD`.
  The same short correctness gates passed, but the 120-second main prefix again
  stopped at exactly 501 queries, with 5,550,366,720 bytes sampled tree RSS and
  5,746,233,344 bytes peak job commit. It is also rejected. Query 501 has
  already returned normally and no next `check_exhaustive` entry is visible;
  the next bounded probe must locate that caller-to-next-query phase gap before
  any exact-root memo experiment or nominal SCC summary.
- `bench/check/results/b180-post501-phase-locator-20260818/coarse-locator/`
  retains that bounded phase probe. Its insertion-only C SHA-256 is
  `3B7A3FAA3D028130E304DB57C9A74EE5703C862E6F195D350D8808C6176B0309`;
  executable SHA-256 is
  `5AA0563BE70BC7A729834BD6D779FB6F539F3C64A0D8E6C4A5E9BFFB2848DF46`.
  The diff is 295 insertions and no deletions against the exact old locator C;
  independent review verified unchanged calls, RC, failure and cleanup paths.
  The 120-second receipt has no measurement error, reaches query 501, and
  records its normal return from the catch caller before a new fixed-point
  invocation begins. It emitted 224 budgeted phase events without exhaustion;
  the only unmatched dynamic boundary is function precheck
  `perceus$$_ownership_metadata_with_role_maps` inside one SCC. Sampled tree
  RSS was 9,925,169,152 bytes and peak job commit was 10,300,665,856 bytes;
  these resource values describe the instrumented locator, not a candidate.
  The named function at `compiler/perceus.ring:418` contains one for-in at line
  424, so the permitted second locator is limited to that function's for-in
  caller and its three direct outer unify steps. No global memo, SCC summary or
  traversal change follows from the coarse receipt alone.
- `bench/check/results/b180-post501-phase-locator-20260818/targeted-forin-locator/`
  retains the one allowed second-wave locator. Its reviewed C SHA-256 is
  `E82D062B3A959798E3F45DD42D64E31BD93BC7F37BB62889C114CAE30250F225`,
  invariance-manifest SHA-256 is
  `F98768970FE097C71C2F7873D46A96BF86F757DF769805AE959768B92A15E9D4`,
  and executable SHA-256 is
  `7588696C38F2FB191808DCC839F967FFD2C5749839C45758EE16D5AE5E46EA2D`.
  Compile and ThinLTO link completed under the 12 GiB Job cap without errors.
  The single 120-second receipt timed out as expected with no measurement
  errors, no trace-budget exhaustion and no nesting-invalid marker; sampled
  tree RSS was 10,215,104,512 bytes and peak job commit was 10,602,455,040
  bytes. Raw stderr SHA-256 is
  `E6B40C265C015B351B40821B1B4346361611DE38F59772C2E4569747752C2A7B`.
  Query 501 and its caller returned normally. The exact target then emitted one
  paired for-in, three paired direct outer-unify steps, a paired function
  precheck and a paired SCC; nine later function prechecks also completed
  before the final unmatched entry moved to `perceus$$_rc_stmt`. The coarse
  unmatched function was therefore a run-local progress boundary, not a
  callable/for-in hotspot. This closes the allowed locator descent: do not add
  a third locator layer, exact-root memo or nominal SCC summary from this
  evidence. The next evidence unit is the fixed-point replay/worklist model.
- `bench/check/results/b180-fixedpoint-replay-counter-20260818/replay-counter/`
  retains that next measurement unit. The independently reviewed C mirror
  SHA-256 is
  `E8382854DC11CF9DFE7505B9FFBABBF372A834320A1A4A1B9D6F553D53C6F5E7`,
  its invariance manifest SHA-256 is
  `A487B8DA205782C46E63CEF8EDCB940F24B89F5979515460FEA5D21BFD726663`,
  and executable SHA-256 is
  `1BE03E65C89A2338B9858CA06E4C149DF391C0A0C2DA2B0E8143369C07B58D56`.
  Compile and ThinLTO link completed under the normal Job cap in about 10.10 s
  and 108.81 s. The only real 120-second run is
  `main-prefix-120s-exact/`; it timed out as expected with no measurement
  error, 10,335,952,896 bytes sampled tree RSS and 10,727,804,928 bytes peak
  Job commit. Stderr SHA-256 is
  `C526DC8BD4B93DCC410AAD325FB53A7B005CD26E533CC14294134AA378E6AF01`.
  A preceding `main-prefix-120s/` launcher attempt failed before creating the
  target process because its Python executable was not absolute; it is kept
  as raw setup-failure evidence and did not duplicate the workload. Its plain
  failure receipt SHA-256 is
  `999E335BC896FD163F99DCF876BF768DE382F9AF0683A1598A31E7A64CFAD04E`.
- At query 501 the replay receipt is internally closed: `invalid=0`, all
  invocation/round/SCC/function/impl opens are zero, and all 501 exhaustive
  queries have matching BEGIN/END. Fourteen initial fixed-point invocations
  used 27 rounds, with 13 changed rounds. All 101 post-const invocations used
  exactly one round, were stable at ordinal zero, and had zero changed rounds.
  Those provably stable post-const rounds nevertheless executed 1,944 SCC,
  2,043 function-node and 7 impl attempts; all observed function/impl results
  were true. Seed clear/store and pending insert counts were zero. The 8,489
  pending-remove count records calls to the original remove operation, not
  unique keys or actual set transitions. This is strong evidence for a narrow
  post-const invocation preflight, not for changing fixed-point order or
  building a worklist. The existing callable fingerprint omits authority that
  can change across const commit/rollback, so it cannot by itself authorize a
  skip. This exact executable retains the earlier 50-const measurement guard,
  which intentionally skips the first 42 `compiler/types.ring` post-const
  retries; the 101 observed invocations therefore do not cover every const
  shape and cannot alone justify a general shortcut.
  Independent rebuttal therefore requires the next unit to remain shadow-only:
  the original fixed point must still run while a proposed preflight records
  authority changes from the last stable return through the const transaction
  and next stable return. No skip is authorized until every would-skip also has
  zero diagnostic/Fail/fresh-state, alias/default/impl, pending/seed and
  rollback-visible delta.
- `bench/check/results/b180-postconst-fingerprint-shadow-20260818/shadow-fullfp/`
  retains the full-replay preflight shadow. The independently reviewed C
  SHA-256 is
  `905583B0E9FD7AD0783C0DBD684F96B6EEE152B359E35ABD14C37E216D3CACB8`,
  its invariance-manifest SHA-256 is
  `447BCD539F49D1B6BA40F0D2531BAB0CF924B8F2458892BD6F00C1C0E6C9E79F`,
  and the linked executable SHA-256 is
  `A5ED537EAA91E9887CA4CFF4E5BB0F30D1B0FA954AB17887F10123B5A0678F10`.
  This measurement topology keeps the reviewed matrix/defer locator but fully
  removes the old 50-const primitive guard, so every original post-const fixed
  point runs. Compile and ThinLTO link completed under the normal Job cap in
  about 9.67 s and 107.13 s, with no measurement errors.
- The only 120-second main-prefix run timed out as expected with no measurement
  error, 9,893,416,960 bytes sampled tree RSS and 10,250,764,288 bytes peak Job
  commit. Stderr SHA-256 is
  `77F5659F87B4A4677AE9EC8BB75B37826171F779BCA4E6D9C57494BEF08AE728`;
  measurement-receipt SHA-256 is
  `4C8F83C5321C1F3742BEE7F5D0EA8E64D29193EFBF44FE6719F74479819606A7`.
  Query 501 is valid and closed: all 143 post-const ENTRY/END pairs match,
  trace budget is not exhausted, and every invocation is transaction-true,
  entry-signature-equal and ordinal-zero stable.
- Only 13 of those 143 invocations have zero delta in next type-variable ID,
  next DefId, next callable-ownership term, ownership parent/solution Map
  lengths and diagnostics. They are exactly the 13 top-level `*_METHODS`
  constants in `compiler/builtin_methods.ring`; that module has no function or
  impl scheduler work, so an entry-signature preflight could save at most one
  additional 34,467-byte fingerprint per const, or 448,071 bytes of output
  construction. The other 130 invocations all advance fresh IDs, and 71 also
  advance ownership terms/maps, even though their output signature is stable.
  This rejects invocation-level skip, transition/deep-owner shadow, dirty
  worklists and local-SCC scheduling from this evidence. Length/hash equality
  and zero length deltas are not authority for UF/Map contents, aliases,
  defaults, diagnostics, rollback or ABA. The next bounded unit is a read-only
  retention/rollback audit of the real fresh-ID and ownership rebuild in those
  130 rounds, not another skip experiment.
- That audit closes the rebuild/rollback branch. In the four observed modules,
  which have no default parameters, all 42,648 fresh DefIds belong to discarded
  HIR and become unreachable after cleanup. Rolling back their monotonic counter
  would not reclaim construction work or objects, while the general operation is
  unsafe because default HIR may retain fresh DefIds. Fresh TypeVars and callable
  ownership terms cannot be treated the same way: successful function and impl
  prechecks deliberately keep ownership parents/solutions and may publish a
  scheme or EffectRow that references the new identities. Stable callable-summary
  text therefore is not raw-state equality, and no suffix rollback, compaction or
  generation-based reuse is authorized.
- No additional profile was captured. Offline stack aggregation of the already
  retained 2026-08-14 ETL (`AE1422F56CD978A4C4A2C6787730DBDB15A1FF590CA94864445FB848F68B324E`)
  bounds the remaining snapshot-dedup opportunity: out of 15,036 samples,
  `precheck_callable_summaries_to_fixed_point` has 13,554 inclusive samples
  (90.14%), while `infer_decl::map_clone` has 209 (1.39%),
  `callable_summary_fingerprint` 186 (1.24%),
  `snapshot_const_owner_transaction` 94 (0.63%), and
  `snapshot_default_authority_surface` 61 (0.41%). These inclusive counts may
  overlap; they nevertheless put repeated snapshot construction far below the
  whole-loop stall. Do not build a new snapshot-volume probe or retain a local
  snapshot refactor from this evidence. The next candidate audit returns to the
  isolated irrefutable matrix base at `b627b8becec292d52465287fce004c0275be481b`.
- `bench/check/results/b180-exhaustive-matrix-narrow-20260818/` retains the
  follow-up narrow matrix checkpoint. The isolated Ring source candidate is
  `e757487802489deea42b4f05d2b4f9d17b66fd5c`; it admits only direct
  Wildcard/Binding cells, keeps Or and every other Pattern on the old path, scans
  all row widths before the shortcut, and leaves the zero-column base first.
  Two independent source reviews are CLEAR. The content-bound targeted
  source/mutation wrapper (`DF214EE2E4B2BD28B654B1E6DF5B5AF666E0D02C6E1669B7802E520B1277419E`)
  passed in 0.36 s; the receipt SHA-256 is
  `F306576803FDB5216F1C7242C5A288444276C79196FE25EB8676344EAD11AA89`.
  The unified structural lane is not a passing receipt: its first attempt failed
  before the gate because a 261-character cache artifact path exceeded the
  Windows hard-link boundary, the corrected short-TEMP attempt hit its mistaken
  60 s compiler-preparation cap, and the cached 180 s attempt exposed three
  unrelated pre-existing ownership/const/alias authority failures. All three raw
  failures remain under `gates/` and were not retried for a prettier result.
- The measurement-only narrow C mirror is
  `83D352A835D475BA79E09803340DC0C89BAE2FBCCADE77BA454BC2B2F4A11CCC`;
  its invariant manifest is
  `4AAA996E8504ED2F38F2660C6EF692BFFF1C453D926641D1D8C3ED64BE626CC4`.
  The exact O3/ThinLTO/debug build produced executable
  `0C32AA9EF9AF5B2753892E68C16473DA1D06168E81C7A3F21C88C99848D6AD96`.
  Five non-primitive focused checks preserved both E0601 negatives and three
  positive programs. In the single 120 s `compiler/main.ring` prefix, query 202
  at `compiler/hir.ring:1886` remained exactly 28 matrix calls / 28 base hits;
  all 501 BEGIN/END pairs closed and no 20,000-call abort fired. This confirms
  the local hotspot movement, but not whole-loop progress: the old and narrow
  locators both stop after query 501. The narrow run sampled
  10,715,787,264 bytes tree RSS and 11,132,325,888 bytes peak job commit versus
  the old same-topology locator's 8,680,701,952 / 9,006,792,704 bytes. A 0.67 s
  timeout-boundary difference prevents a causal memory-regression claim, but the
  required positive resource/progress evidence is absent. The candidate is
  performance-rejected: do not merge it, bootstrap it, rerun the locator, or
  combine it with primitive/defer experiments. Retain the local 28-call and
  source-correct evidence only. The next and final independently supported
  B-180 candidate is an isolated defer-only validation of
  `2af820bc932acecda20d098fdc28fbef0fcb8a7e` from the clean current base.
- `bench/check/results/b180-exhaustive-precheck-defer-20260818/` closes that
  final candidate. The isolated source checkpoint is
  `d8fe4ded621b832caadcfee920b721b54e68e3a6`; its raw source/mutation authority
  and both A0/B0 focused retained-diagnostic, catch-consumption and recovery
  gates passed once. The formal performance pair was strictly uninstrumented:
  A0 generated C / executable are
  `D7BB015B32EF8F4A438093509C794C82B60C13548808B0A1093AEFEAB0DF7F2E` /
  `1AAC8A782EF8C892F74ED676B116EECB28B9E31AABBF65BEE064B56320CE0B25`,
  and B0 are
  `E855D11A68DAED20362B45E4E12FD72BA991D38EADC049C2D643DC916B7ADC51` /
  `3470425C054B6D9B949D9C8860A3B2F3E5EAAD7E00AD2439F8B9A6AD75E00E0E`.
  Both `check compiler/main.ring` runs timed out at the single 120-second cap,
  so B0 did not establish whole-loop progress. A0 sampled 2,043,904,000 bytes
  tree RSS and 2,097,664,000 bytes peak job commit; B0 sampled
  6,690,410,496 / 6,926,209,024 bytes, about 3.27x / 3.30x A0. The candidate is
  performance-rejected without bootstrap, ETW or retry. The symmetric locator
  mirrors are archived only as local topology evidence: their executed I/O is
  asymmetric on skipped work and cannot decide performance. No independently
  supported B-180 compiler candidate remains.
