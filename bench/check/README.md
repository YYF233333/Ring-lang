# `check` feedback measurement harness

This directory is the bounded measurement entry point for B-176. It records
compiler and validation feedback cost without changing compiler, runtime, or
test-runner behavior. The checked-in manifest is a replay plan; this continuity
unit intentionally does not contain a formal baseline or phase-timing compiler
change.

## Integrity model

`windows_job.py` creates each root process with `CREATE_SUSPENDED`, assigns it
to a fresh kill-on-close Windows Job Object, then resumes its primary thread.
The invocation record distinguishes exact lifetime counters from sampled
memory:

- aggregate user/kernel CPU, total process count, Job I/O, and
  `PeakJobMemoryUsed` come from `QueryInformationJobObject`;
- `PeakJobMemoryUsed` is peak committed memory for the job, **not RSS**;
- root and observed per-process peak working set come from retained process
  handles and `GetProcessMemoryInfo`, including after process exit;
- tree working set is summed every 10 ms. Its sample count, covered duration,
  coverage ratio, observed-process count, and exact Job total are retained.
  `rss_complete=false` makes the tree peak an explicit lower bound when a short
  process was missed, coverage fell below 95%, or sampling produced an error.

stdout and stderr are never merged. Each is retained with its own path, byte
count, and SHA-256. Runner summaries, declared artifacts, and opt-in JSONL phase
traces are copied into the invocation record rather than inferred later.

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

## Output contract

Every fresh result directory contains:

- `manifest.snapshot.json` and `result.schema.json` — exact replay contract;
- `environment.json` — commit and dirty state, manifest hash, tracked
  `dist-c`/runtime hashes, Python/clang/clang++ paths, versions and executable
  hashes, flags, OS, CPU, total memory, logical cores, power status/plan, and
  ThinLTO cache inventory;
- `samples.jsonl` — one schema-validated row per invocation;
- `samples/<case>/<sample>/stdout.txt` and `stderr.txt` plus declared artifacts;
- `summary.json` — statistics derived only from included rows and a hard
  completeness result.

`manifest.json` includes tiny/large/module/diagnostic/RC direct checks,
`compiler/main.ring`, hello build, filtered e2e, each current suite, the full
gate, and a fresh tracked-bootstrap build. `bootstrap.py` mirrors the production
O3+ThinLTO build into the sample directory and emits compile/runtime/link phase
wall times. Compiler-internal opt-in phase traces are accepted by the result
format but remain a later B-176 continuity unit.

The harness is Windows-only because the measurement contract is specifically a
Windows Job Object contract. The implementation uses Python's standard library
only; its small JSON-schema validator intentionally supports only the keywords
used by `result.schema.json` and fails closed on unexpected result fields.
