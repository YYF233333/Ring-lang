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
2. Build one measurement-only generated-C coarse locator. Before query 501 it
   may update only allocation-free active-context latches; query 501 emits one
   parent snapshot. At and after that boundary, use paired markers only for the
   match caller return, fixed-point round/body/convergence, SCC group, and
   function/impl precheck call sites. Give dynamic calls monotonic IDs, flush
   every event, and enforce a fixed event budget with an explicit
   `TRACE_BUDGET_EXHAUSTED` marker. Do not install a failure handler or retry,
   and do not log for-in, recursive unify or walker calls in this first wave.
3. Run one capped prefix with the unchanged command and exact executable
   identity. If it locks a single function/impl site, one later targeted wave
   may add its `lower_protocol_for_in` caller edge and direct outer `unify`
   edge. If the last coarse boundary is outside callable nominal reachability,
   stop the memo/SCC line and follow that phase. A missing END is not a normal
   return; budget exhaustion or incoherent nesting invalidates the receipt.
4. Do not start a nominal SCC summary unless the phase locator and a later
   exact-root probe both show repeated nominal-graph expansion that a scoped
   memo cannot cover. Do not reopen the discarded binder fast paths merely for
   their memory improvement.

## Coarse locator result

- The reviewed insertion-only locator is C SHA-256
  `3B7A3FAA3D028130E304DB57C9A74EE5703C862E6F195D350D8808C6176B0309`
  and executable SHA-256
  `5AA0563BE70BC7A729834BD6D779FB6F539F3C64A0D8E6C4A5E9BFFB2848DF46`.
  Its compile and ThinLTO link completed under the normal Job cap with empty
  stderr and no measurement errors.
- The single 120-second prefix reached `B180_EXH_END id=501`, emitted its live
  parent snapshot, and then emitted `MATCH_EXH_RETURN callsite=2`. The snapshot
  had no active fixed-point parent; a new fixed-point invocation and round then
  began. The trace contains 224 events, no budget-exhaustion marker and one
  coherent unmatched stack: SCC 2726 → function precheck 2824,
  `perceus$$_ownership_metadata_with_role_maps`. Dynamic IDs are receipt-local;
  the function name and source are the durable identity.
- `compiler/perceus.ring:418-449` contains exactly one for-in in that function,
  at line 424 over `callable_by_def_id.keys()`. One second-wave C locator may
  gate on the active exact function name and bracket only the generic for-in
  caller plus the three direct `unify_at_noted` steps in
  `lower_protocol_for_in`. Its first missing normal-return marker decides the
  next phase. It must not instrument global unify or the callable walker.
