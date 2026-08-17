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
