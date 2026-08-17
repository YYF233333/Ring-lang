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

## Completed locator plan

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

## Targeted locator result

- The reviewed second-wave C SHA-256 is
  `E82D062B3A959798E3F45DD42D64E31BD93BC7F37BB62889C114CAE30250F225`;
  its invariance manifest SHA-256 is
  `F98768970FE097C71C2F7873D46A96BF86F757DF769805AE959768B92A15E9D4`,
  and the linked executable SHA-256 is
  `7588696C38F2FB191808DCC839F967FFD2C5749839C45758EE16D5AE5E46EA2D`.
  The raw receipt is under
  `bench/check/results/b180-post501-phase-locator-20260818/targeted-forin-locator/`;
  stderr SHA-256 is
  `E6B40C265C015B351B40821B1B4346361611DE38F59772C2E4569747752C2A7B`.
- The only 120-second run reached and returned query 501 with an all-zero
  second-wave snapshot. It emitted 268 phase events, no budget-exhaustion or
  nesting-invalid marker, one paired target for-in, and all three paired
  direct outer-unify steps. The target function and SCC then returned normally.
  Nine later function prechecks also completed; the final unmatched entry was
  `perceus$$_rc_stmt`. Sampled tree RSS / peak job commit were
  10,215,104,512 / 10,602,455,040 bytes; these describe instrumentation, not a
  candidate.
- This refutes the coarse unmatched boundary as a target-local
  callable/for-in hotspot. Stop the locator tree here: do not chase the new
  final line, instrument global unify/walker, build an exact-root memo, or
  start nominal SCC summaries from these receipts.

## Fixed-point replay counter result

- The reviewed measurement-only mirror is C SHA-256
  `E8382854DC11CF9DFE7505B9FFBABBF372A834320A1A4A1B9D6F553D53C6F5E7`,
  invariance-manifest SHA-256
  `A487B8DA205782C46E63CEF8EDCB940F24B89F5979515460FEA5D21BFD726663`,
  and executable SHA-256
  `1BE03E65C89A2338B9858CA06E4C149DF391C0A0C2DA2B0E8143369C07B58D56`.
  Raw results are under
  `bench/check/results/b180-fixedpoint-replay-counter-20260818/replay-counter/`;
  only `main-prefix-120s-exact/` launched the target. Its stderr SHA-256 is
  `C526DC8BD4B93DCC410AAD325FB53A7B005CD26E533CC14294134AA378E6AF01`.
- Query 501 has balanced exhaustive, fixed-point, round, SCC, function and impl
  counters with `invalid=0`. Fourteen initial invocations consumed 27 rounds
  and account for all 13 changed rounds. In contrast, 101 post-const
  invocations are all ordinal-zero stable with no changed round, while replaying
  1,944 SCC, 2,043 function and 7 impl attempts. Every observed function/impl
  result is true; seed clear/store and pending insert are zero.
- The executable inherits the earlier exact-types guard and therefore excludes
  the first 42 `compiler/types.ring` post-const retries. The 101 observed
  invocations establish a large opportunity in this topology, not blanket
  authority for every const owner.
- `pending_remove=8489` means only that the original `Set.remove` call executed;
  it is not a state-transition or unique-key count. Nonzero seed/pending totals
  would need a more specific measurement before attribution. This receipt is
  sufficient to reject immediate dirty-worklist/SCC scheduling and select an
  invocation-level post-const preflight as the next Argument target.

## Next bounded unit

1. Build only a behavior-preserving shadow decision; the original fixed point
   must always execute. Prove the smallest complete post-const authority token
   across last-stable→owner-before, transaction/rebind, and after→next-stable
   intervals. The existing callable fingerprint is insufficient on its own
   because pending/default
   seed identity, exact alias contracts, const finalization and rollback state
   can change without an encoded fingerprint difference. Compare a strict
   empty-state guard plus auxiliary commit epoch against a complete
   commit-generation token; failed speculative writes must not leak a bump or
   permit rollback ABA.
2. The shadow must distinguish no-op pending removal from actual membership
   transition and expose owner/incarnation check commit, forward plus reverse
   exact-alias membership, default/impl and node-universe change,
   diagnostic/Fail/fresh-state delta, and rollback. Keep the existing
   fixed-point source order and all initial/post-const invocations; do not
   introduce a per-site dirty graph, local SCC convergence, persistent callable
   cache or third locator.
3. Only if every shadow would-skip is followed by the original FP returning
   stable with zero observable delta may a later candidate skip that entire
   post-const retry. Source/mutation authority must kill omitted pending removal,
   default-seed publication, exact alias/default identity changes, successful const
   nominal/substitution commits and failed-transaction token leakage. Run the
   focused fixed-point/default/const rollback fixtures before any bootstrap.
   Retain only if the same bounded main loop moves beyond the prior phase with
   no diagnostic/coverage/resource regression; internal skip counts alone are
   not acceptance.
