# 2026-08-18 B-180 callable phase handoff

## Current authority

- B-180 remains active. The root branch is
  `codex/b180-feedback-loop-continuation`; this handoff follows the 2026-08-14
  performance handoff and supersedes its movement pause.
- Formal, probe and preparation lanes remain serial, with a 12 GiB aggregate
  commit cap, at most 5 active processes including root, and the machine-wide
  fail-fast lock. No self-compile, full gate or repeated 2026-08-14 Xperf run
  was used in this continuation.
- The Windows elevated-broker client wait fix is committed and independently
  reviewed. Authentication and request send retain the short timeout; only the
  single result receive uses the bounded request timeout plus protocol grace.
  Its short suite passes 21/21. Recheck broker status before any later elevated
  request and do not prompt UAC again while the current fixed-TTL broker lives.

## Rejected callable candidates

- Complete nominal closure `d5ffad63e72ade9b94b19d29a4d870448acb6081`
  regressed the main prefix from 501 to 196 queries and exceeded the useful
  memory boundary. Hidden-only traversal
  `15895ab7797d797d4aa658072150499f135081b8` stayed at 501 and used more
  memory. Neither is integrated or eligible for bootstrap.
- The four-site binder distribution probe then proved a large materialization
  opportunity at Struct and Enum hidden-member sites, with no observed pair
  site traffic. The reviewed combined source candidate
  `6bd4bd95abfc2a9204362306f6d31a961bbbb393` and narrower Enum-only candidate
  `e018b12f44f2728de70df6fb75f1cff73a07b7f1` both preserved the two E0301
  anchors and passed the short `compiler/types.ring` check.
- Both real 120-second prefixes still ended at exactly query 501. Their sampled
  RSS / peak commit fell to 5,638,926,336 / 5,837,950,976 bytes and
  5,550,366,720 / 5,746,233,344 bytes respectively, compared with the old
  target's 8,680,701,952 / 9,006,792,704 bytes. This is real resource evidence
  but not a feedback-throughput win, so both candidates are rejected without
  integration, bootstrap or rerun. Raw receipts and identities are indexed in
  `docs/performance-baseline.md`.

## Next bounded unit

1. Treat `B180_EXH_END id=501` as a completed query: `check_patterns` and
   `check_matrix` have returned and stderr was flushed. No next query BEGIN is
   present. Existing evidence cannot distinguish caller cleanup, the current
   function/impl precheck tail, SCC/round transition or a later for-in/unify.
2. Build one measurement-only generated-C phase locator with low-frequency,
   paired markers at: the match caller return; fixed-point round; SCC group;
   function and impl precheck call sites; `lower_protocol_for_in`; and each of
   its direct outer `unify` calls. Each BEGIN precedes the original single call,
   each END follows only a normal return, and every marker flushes stderr.
   Do not install a failure handler, retry, or log recursive unify/walker calls.
3. Run one capped prefix with the unchanged command and exact executable
   identity. If the last boundary is outside callable nominal reachability,
   stop the memo/SCC line and follow that phase. Only if the boundary still
   encloses the nominal detector may the next unit measure expensive exact-root
   repetition within one selector-safe scope.
4. Do not start a nominal SCC summary unless the phase locator and a later
   exact-root probe both show repeated nominal-graph expansion that a scoped
   memo cannot cover. Do not reopen the discarded binder fast paths merely for
   their memory improvement.
