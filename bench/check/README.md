# `check` feedback measurement harness

This directory is the bounded measurement entry point for B-176. It records
compiler and validation feedback cost without changing default compiler,
runtime, or test-runner behavior. The checked-in manifest is a replay plan; it
does not itself contain a formal baseline.

## Integrity model

`windows_job.py` creates each root process with `CREATE_SUSPENDED`, assigns it
to a fresh kill-on-close Windows Job Object, then resumes its primary thread.
The invocation record distinguishes exact lifetime counters from sampled
memory:

- aggregate user/kernel CPU, total process count, Job I/O, and
  `PeakJobMemoryUsed` come from `QueryInformationJobObject`;
- `PeakJobMemoryUsed` is peak committed memory for the job, **not RSS**;
- root and observed per-process peak working set come from retained process
  handles and `GetProcessMemoryInfo`, including after process exit. The
  per-worker maximum excludes the root and is `null` when no worker existed;
- tree working set is summed every 10 ms. Its sample count, covered duration,
  coverage ratio, observed-process count, and exact Job total are retained.
  `rss_complete=false` makes the tree peak an explicit lower bound when a short
  process was missed, coverage fell below 95%, or sampling produced an error.

Preflight creates, configures, and queries a genuinely fresh Job Object, checks
the kill-on-close flag, and proves that closing it restores the current-process
handle count. Self-tests also assert that one invocation creates exactly one
Job and does not grow the steady-state handle count.

stdout and stderr are never merged. Each is retained with its own path, byte
count, and SHA-256. Runner summaries, declared artifacts, and opt-in JSONL phase
traces are copied into the invocation record rather than inferred later.

Direct successful and diagnostic `check` lanes explicitly request the hidden
compiler option `--phase-timing=<sample path>`. Default compiler invocations do
not call the clock and do not create a timing file. Compiler timing always goes
to that independent JSONL file, never to the human or LLM diagnostic stream.
Every row uses `ring.compiler-phase-timing.v1`, nanoseconds from a monotonic
clock, exact lane/compiler/source identities, `executed`, `complete`, and
`command_success` flags. The stable phase vocabulary is:

- `input_entry_load`;
- `entry_parse`;
- `project_module_load_parse` (the resolver currently combines module I/O and
  parse, and single-file checks mark it skipped rather than inventing detail);
- `type_effect_check_lower` (checker-owned HIR/dictionary lowering is not yet a
  separate stable boundary);
- `resource_plan_verify` (zero-duration and `executed=false` for ordinary
  checks, measured for `--verify-rc`);
- `command_total`.

The harness requires exact phase order and fields, rejects incomplete or
identity-mismatched rows, and checks that measured phases fit inside command
total and command total fits inside Job wall time. Bootstrap traces continue to
use `ring.check-benchmark.bootstrap-phase.v1` and are validated separately;
unknown trace schemas fail closed.

`tiny_hello_check_no_phase` is an otherwise identical 21-sample control lane.
The combined report compares its cold/warm wall median, MAD, and empirical p95
against `tiny_hello_check`, including absolute deltas and ratios.

## Sample policy

- `direct_short`: retain one excluded warm-up, then require 21 valid samples.
- `adaptive`: the first valid invocation selects 5 samples when it is under
  300 seconds, otherwise 3.
- `full_gate`: always require 3 valid samples.
- A lane gets at most `target + 2` measured attempts. Failing to obtain the
target is a failed run, never a silently reduced sample set.
- All raw attempts stay in `samples.jsonl`, including warm-up and invalid
  attempts. Summaries report median, median absolute deviation, and range;
  empirical p95 is emitted only for exactly 21 valid samples.

An invocation with incomplete RSS coverage or any sampling error is retained as
an invalid lower-bound row; it never enters the formal aggregate. Lane summaries
count complete/incomplete samples, unavailable worker peaks, measurement errors,
runtime-isolation errors, and separately summarize incomplete tree-RSS lower
bounds.

Cold and warm are separate lane IDs. Every invocation is labelled only with:

```json
{
  "thinlto_cache": "cold|warm",
  "output": "fresh",
  "os_file_cache": "uncontrolled"
}
```

Cold lanes point `TEMP`/`TMP` at a fresh per-sample directory, so the runner's
hard-coded `ring-lang-thinlto-cache` is empty for every invocation. That
generated cache is removed after counters and artifacts are collected. Warm
lanes point `TEMP`/`TMP` at the parent of the explicitly supplied shared cache;
preflight requires that cache to be named `ring-lang-thinlto-cache`, exist, and
be non-empty. The operator must prewarm it with the same source/toolchain/flags
before confirming `warm`. OS file cache is deliberately not flushed or claimed
as controlled.

The Python runner also has a separate ignored root artifact,
`ring_runtime.o`. Lanes that can consume it (`filtered_e2e`, e2e, golden, and
the full gate) isolate it for every invocation and restore any pre-existing
object afterward. Cold samples start with no root object and therefore measure
its O2 build each time. Warm samples receive an unmeasured, freshly prepared
object built with the runner's exact clang++ path and
`-std=c++17 -O2 -D_CRT_SECURE_NO_WARNINGS`; its source/object hashes, flags,
pre/post state, and restoration result are recorded. A stale ignored object can
therefore neither silently turn a cold sample warm nor contaminate another lane.
The original is atomically renamed to a same-directory ignored backup before
any replacement; warm installation is copied to a sibling staging path,
hash-checked, then atomically renamed into place. Restoration is attempted
before cleanup. If restoration itself fails, the backup is deliberately kept
and its path/state is recorded instead of deleting the only original copy.

## Commands

List the expanded cold/warm lanes and run static preflight:

```powershell
python bench/check/run.py --list
python bench/check/run.py --preflight `
  --case suite_parity_cold `
  --confirm-cache-state cold
```

Run one direct lane from a clean worktree with an explicitly selected compiler:

```powershell
python bench/check/run.py `
  --case tiny_hello_check_warm `
  --ring C:\path\to\ring.exe `
  --thinlto-cache "$env:TEMP\ring-lang-thinlto-cache" `
  --confirm-cache-state warm `
  --output C:\path\to\fresh-results
```

Formal runs require a clean tracked worktree. A one-invocation harness probe is
available while developing the harness and is explicitly not baseline evidence:

```powershell
python bench/check/run.py --probe --output "$env:TEMP\ring-check-probe"
```

Run the short self-tests:

```powershell
python -m unittest discover -s bench/check -p "test_*.py" -v
```

Formal cold/warm lanes may be run in separate fresh result directories. Combine
only a complete set of non-overlapping batches into one auditable baseline:

```powershell
python bench/check/combine.py `
  --run-dir C:\path\to\batch-1 `
  --run-dir C:\path\to\batch-2 `
  --output C:\path\to\fresh-combined
```

The strict combiner revalidates raw samples and recomputes lane summaries. It
requires identical source, manifest/result schema, tracked bootstrap/runtime,
toolchain, flags, and stable machine/power identity; rejects dirty/incomplete
runs, duplicate lanes/samples and identity drift; and requires the full manifest
cold/warm coverage matrix. It writes `combined-samples.jsonl` and
`combined-summary.json` plus the shared manifest/schema snapshots.

## Output contract

Every fresh result directory contains:

- `manifest.snapshot.json` and `result.schema.json` — exact replay contract;
- `environment.json` — commit and dirty state, manifest hash, tracked
  `dist-c`/runtime hashes, Python/clang/clang++ paths, versions and executable
  hashes, flags, OS, CPU, total memory, logical cores, power status/plan, and
  ThinLTO cache inventory, plus runner-runtime preparation state and hashes;
- `samples.jsonl` — one schema-validated row per invocation;
- `samples/<case>/<sample>/stdout.txt` and `stderr.txt` plus declared artifacts;
- `summary.json` — statistics derived only from included rows and a hard
  completeness result.

`manifest.json` includes tiny/large/module/diagnostic/RC direct checks,
`compiler/main.ring`, hello build, filtered e2e, each current suite, the full
gate, and a fresh tracked-bootstrap build. `bootstrap.py` mirrors the production
O3+ThinLTO build into the sample directory and emits compile/runtime/link phase
wall times. Compiler-internal phase traces are requested only by the direct
`check` lanes described above.

The harness is Windows-only because the measurement contract is specifically a
Windows Job Object contract. The implementation uses Python's standard library
only; its small JSON-schema validator intentionally supports only the keywords
used by `result.schema.json` and fails closed on unexpected result fields.
