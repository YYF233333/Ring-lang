# 2026-08-14 performance mainline handoff

## Current authority and boundary

- `ownership-reachable-dispatch` remains COMPLETE; none of its focused checks
  were reopened or rerun.
- B-176 is closed by the bounded measurement wave recorded in
  `docs/performance-baseline.md`. B-180 is active, not complete.
- Formal/probe/preparation work is serialized and capped at 12 GiB aggregate
  commit and 5 active processes including the root. No A7-to-A8 generation,
  self-compile lane or full gate ran in this session.
- Stop starting new work at 10:30 JST and leave a recovery report before the
  user's 11:00 JST move.

## Retained implementation

- Integration branch/worktree: `codex/b180-runner-cache-integration`; final
  implementation checkpoint before this documentation update is
  `25ae0bba` (the retained cold/warm samples were taken at `f02d176b1`).
- The runner caches only the controlled Windows `main.c` to ThinLTO anchor
  object. Runtime compilation, final link and every test action stay fresh.
- Key closure, immutable publication, cache bounds, poison-on-divergence and
  exact phase topology are described in the backlog checkpoint.
- Raw focused evidence:
  `bench/check/results/b180-runner-cache-20260814/cold-miss-fixed/` and
  `bench/check/results/b180-runner-cache-20260814/warm-hit/`. Both pass
  `bool_ops`; the warm trace is accepted by the strict bench classifier.

## Rejected candidates and retained failures

- Runtime ABI bridge always-inline and a 64 MiB bounded small-object pool both
  made the whole `types.ring` command no faster and must not be merged.
- The old const fixed-point skip remains rejected for a callable-const
  correctness hole.
- Root branch commit `1542211068fcce2aef7bc61a19393098d1579fdc`
  (`perf: parse project prelude once`) was committed by an agent before an
  isolation stop arrived. Independent review found its authoritative mutation
  gate was not migrated; do not treat it as accepted. Revert it with a new
  commit before integrating the runner candidate unless its full gate contract
  is repaired first.
- Raw timeouts/failures are indexed in `docs/performance-baseline.md`; do not
  rerun them merely to obtain a prettier baseline.

## Profiler broker

- Elevated broker PID 17432 listens only on authenticated loopback and expires
  automatically at 10:30 JST. It was successfully reused from ordinary
  processes without another UAC prompt. No restart is needed unless it exits
  before a genuinely new bounded profile request.

## Next safe step

1. Require independent CLEAR on the final poison-publication fallback.
2. Commit this documentation checkpoint on the clean integration branch.
3. Revert the unaccepted prelude commit on the root branch with a normal revert
   commit, then cherry-pick the reviewed integration commits; do not reset or
   overwrite history.
4. Run only the short relevant tests plus one strict integration review. The
   focused cold/warm e2e already passed and should not be repeated without a
   definite new failure.
5. Continue B-180 from the profiled fixed-point snapshot cost; do not resurrect
   either rejected runtime candidate or the unsafe const shortcut.
