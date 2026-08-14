# 2026-08-14 performance mainline handoff

## Current authority and boundary

- `ownership-reachable-dispatch` remains COMPLETE; none of its focused checks
  were reopened or rerun.
- B-176 is closed by the bounded measurement wave recorded in
  `docs/performance-baseline.md`. B-180 is active, not complete.
- Formal/probe/preparation work is serialized and capped at 12 GiB aggregate
  commit and 5 active processes including the root. One bounded A7-to-A8
  attempt ran and timed out without artifacts; no self-compile or full gate
  ran.
- The user requested another movement pause after the next bottleneck was
  identified. No new implementation, test or profile may start until the user
  resumes the session.

## Retained implementation

- Root branch `codex/b176-workflow-throughput` contains the reviewed runner
  anchor-object cache, the exact probe phase topology, the normal-history
  revert of the rejected prelude candidate, and the repository-owned bounded
  Windows elevated broker. Broker skill commits through `8ea40bcf` are in
  normal history; this handoff is the only remaining documentation checkpoint.
- The retained cold sample source is
  `8a3cf3d4966537f1c8671d51450af9b3bda57abb`; the warm sample source is
  `f02d176b1f6b458beed8d27bb7d8695e7f4f38f3`. They provide directional
  cold-to-warm evidence only, not a paired comparison from the same snapshot.
- The runner caches only the controlled Windows `main.c` to ThinLTO anchor
  object. Runtime compilation, final link and every test action stay fresh.
- Key closure, immutable publication, cache bounds, poison-on-divergence and
  exact phase topology are described in the backlog checkpoint.
- Raw focused evidence:
  `bench/check/results/b180-runner-cache-20260814/cold-miss-fixed/` and
  `bench/check/results/b180-runner-cache-20260814/warm-hit/`. Both pass
  `bool_ops`; their pass outcomes and recorded wall times are retained only as
  directional evidence. The warm trace was accepted by the collection-snapshot
  classifier. The current exact-probe classifier intentionally rejects both
  legacy traces because they lack the required probe rows; neither establishes
  current exact-topology acceptance.

## Rejected candidates and retained failures

- Runtime ABI bridge always-inline and a 64 MiB bounded small-object pool both
  made the whole `types.ring` command no faster and must not be merged.
- The old const fixed-point skip remains rejected for a callable-const
  correctness hole.
- Root branch commit `1542211068fcce2aef7bc61a19393098d1579fdc`
  (`perf: parse project prelude once`) was rejected by independent review and
  has already been reverted normally by `ed360d47`; do not resurrect it.
- Raw timeouts/failures are indexed in `docs/performance-baseline.md`; do not
  rerun them merely to obtain a prettier baseline.

## Isolated compiler candidates

- Worktree/branch: `.worktrees/b180-primitive-const-retry`,
  `codex/b180-primitive-const-retry`, clean at
  `8931ad0dafb0c55b00f12b6e0b769831f0b80a11`.
- The implementation keeps the complete const owner transaction and exact
  alias rebind, and elides the following callable fixed-point retry only for an
  exact unqualified zero-argument `Int/Float/Str/Bool` annotation, matching
  literal and matching rebound primitive scheme, with all blocked, pending and
  default-seed maps empty. Independent source/mutation review is CLEAR.
- Raw profile/probe evidence under
  `bench/check/results/b180-primitive-const-retry-20260814/` shows a strong
  whole-command direction, but it is not acceptance evidence for the Ring
  source implementation.
- Exact A7 `check compiler/infer_decl.ring` hit its 300 s cap. The subsequent
  A7-to-A8 generation hit 1500 s (exit 124, peak job commit about 5.7 GiB),
  emitted no `main.c`/`main.o`, and had empty stdout/stderr. The job receipt is
  `bounded-generation-a8-job-02/measurement.json`. A fixture-only commit landed
  while that job ran; the `compiler/` tree is byte-identical at the job's
  recorded `5a8696e7` source and current `92d90d89`, but the timeout is still a
  failure and was not retried.
- A follow-up source-only refactor at `8931ad0d` reduced the candidate's added
  top-level helpers from four to two without changing the reviewed guard; its
  short source/mutation gates passed. A distinct 900 s stage0 attempt used the
  measurement-only C probe to compile this exact clean source. It also timed
  out without artifacts (exit 124, peak job commit about 2.9 GiB, empty
  stdout/stderr); receipt:
  `probe-seed-generation-a8-job/measurement.json`. This lighter trajectory is
  directional evidence only, not a trusted bootstrap, and no third generation
  attempt was started.
- `.worktrees/b180-exhaustive-precheck-defer` is clean at
  `2af820bc932acecda20d098fdc28fbef0fcb8a7e`. It skips only the discarded
  E0601 computation under the two exact precheck flags and preserves retained
  recomputation, resolved types, HIR and catch cleanup. Independent source and
  mutation review is CLEAR; no Ring/bootstrap gate ran.
- `.worktrees/b180-exhaustive-matrix-base` is clean at
  `b627b8becec292d52465287fce004c0275be481b`. Its irrefutable-row base is after
  the zero-column base and before constructor expansion; malformed row widths,
  Or-pattern semantics and unified runner authority are fail-closed.
  Independent review is CLEAR; no Ring/bootstrap gate ran.

## Latest bounded profile

- The generated-C span locator first isolated `compiler/hir.ring:1886` (28
  HExpr arms) at more than 100,000 recursive matrix calls. The matrix-base
  locator reduced it to exactly 28 calls and progressed through 501 queries
  before a later capped timeout. Raw directories are indexed in
  `docs/performance-baseline.md`.
- A fresh 60 s Xperf prefix used the exact matrix locator executable SHA
  `A9CB6F640D5D97EC1CE98D5DB56801C7A666467219EE0C108E02DC5B8D6F21A7`.
  The ETL SHA is
  `AE1422F56CD978A4C4A2C6787730DBDB15A1FF590CA94864445FB848F68B324E`;
  raw ETL, capture receipt, stdout/stderr and Job measurement are under
  `bench/check/results/b180-exhaustive-matrix-xperf-20260814/`.
- The old `check_matrix` hotspot is absent. The next dominant chain is
  `precheck_callable_summaries_to_fixed_point` (about 90% sampled inclusive),
  then `lower_protocol_for_in → unify → unification_pair_reaches_callable →
  type_may_hide_callable → type_reaches_callable_through_nominals` (about 67%).
  The next candidate should address repeated nominal-to-callable reachability
  in discarded callable prechecks, with allocation churn treated as a symptom;
  do not make another matrix change from this profile.

## Profiler broker

- Repository skill `.agents/skills/windows-elevated-broker/` now starts a
  fixed-TTL administrator broker through one visible UAC. PID 11904 listens on
  authenticated loopback, reports `administrator=true`, enforces 12 GiB/5
  processes and expires at 17:58 JST. Recheck `status` after movement/sleep;
  do not request another UAC while it remains live.
- The first long `run` exposed a client bug: the client retained the 5 s socket
  authentication timeout while waiting for the result, reported timeout, but
  the server correctly finished the sole request and wrote its success receipt.
  No duplicate profile was started. Before any future broker run, give the
  authenticated result wait its bounded request timeout while retaining the
  short authentication timeout, and add a regression test.

## Next safe step

1. Pause now. On resume, first repair and short-test the broker client's result
   timeout; verify PID/state or start a new broker only if the old TTL expired.
2. Keep all three compiler candidates isolated. Do not cherry-pick them or update
   tracked `compiler/dist-c/main.c` without a real generated candidate and
   focused behavior/bootstrap evidence.
3. Use the retained Xperf chain to inspect repeated nominal-to-callable
   reachability in discarded fixed-point prechecks. Start with a source-bounded,
   independently reviewed candidate; do not start another profile merely to
   rediscover the same chain.
4. If a bounded real candidate becomes available, run only the planned focused
   primitive/alias/nonliteral, default-seed, blocked-callable, nested-path and
   failure-cleanup cases, followed by the required bootstrap gates. Preserve
   any first failure and stop that candidate.
5. Do not rerun the already-passing runner-cache `bool_ops` samples, reopen the
   completed ownership item, resurrect the rejected prelude/runtime candidates,
   or use the old unsafe broad const shortcut.
