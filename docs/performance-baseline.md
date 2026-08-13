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
