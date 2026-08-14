---
name: windows-elevated-broker
description: Start and use a bounded Windows administrator broker after one UAC prompt. Use for Windows UAC work, Samply/Xperf/ETW capture, several administrator commands, or a persistent elevated helper with a fixed lifetime. This does not cache or export administrator credentials; it creates one already-elevated broker process with a fixed TTL.
---

# Windows Elevated Broker

Use `scripts/elevated_broker.py` for the complete `start → status/run → stop` lifecycle. Keep the broker configuration narrow enough to review before the single UAC prompt.

## Start

Resolve every non-Python executable to an absolute path. Declare Python only through repository script roots; the broker pins the current interpreter plus the exact `.py`/`.pyw` inventory and hashes at startup.

Run the same `start` command with `--dry-run` first. Inspect the absolute paths, hashes, TTL, PATH hash, results root, and resource caps in its JSON. Dry-run neither writes broker state nor opens UAC.

```powershell
$broker = ".agents/skills/windows-elevated-broker/scripts/elevated_broker.py"
python $broker start `
  --dry-run `
  --ttl-seconds 3600 `
  --request-timeout-max-seconds 1800 `
  --allow-executable "C:\absolute\path\to\samply.exe" `
  --python-root "bench/check"
```

Remove `--dry-run` only when the user is present to accept one UAC prompt. `start` uses Windows `runas` to create a hidden elevated Python broker that remains alive independently of the Codex app. It binds IPv4 loopback only and authenticates each connection with a fresh HMAC challenge-response; the random authentication key is never sent as request data.

Use the default ignored roots unless the task needs isolation:

- Results: `bench/check/results/`
- Control: `bench/check/results/elevated-broker/`

For a custom root, pass it to every command and require `git check-ignore` to prove it is ignored. Never place the authentication key, bootstrap, state, receipts, stdout, stderr, or measurements in tracked Git paths.

## Inspect and run

Query state without another UAC prompt:

```powershell
python $broker status
```

Confirm that state reports the expected broker PID, `administrator.is_admin=true`, identity, expiry, executable hashes, PATH hash, Job preflight, 12 GiB aggregate commit cap, five-process cap, and request-timeout maximum.

Run one exact argv. Give every request a fresh output directory under the fixed results root:

```powershell
python $broker run `
  --cwd "C:\absolute\path\to\Ring-lang" `
  --output-dir "C:\absolute\path\to\Ring-lang\bench\check\results\capture-001" `
  --timeout-seconds 600 `
  -- "C:\absolute\path\to\samply.exe" record --help
```

For Python, put the pinned interpreter at `argv[0]` and a startup-pinned absolute script at `argv[1]`. Do not use `-c`, `-m`, a shell, a command string, PATH lookup, or request-supplied environment variables.

### Xperf/ETW capture

For the repository's ignored controlled capture script, pin all three executable identities at `start`: the Python interpreter through `--python-root bench/check/results/tools`, plus the exact `xperf.exe` and `ring.exe` through separate `--allow-executable` options. The broker also validates every absolute `.exe`/`.com` argument to a Python request against that fixed executable allowlist and current content hash.

Invoke the script only by absolute path. Keep its capture output in a fresh nested directory because the broker owns the fresh outer request directory and writes `request.json` before the script starts:

```powershell
python $broker run `
  --cwd $repo `
  --output-dir "$repo\bench\check\results\broker-xperf-001" `
  --timeout-seconds 180 `
  -- $python "$repo\bench\check\results\tools\capture_xperf_profile.py" `
  --xperf $xperf --repo $repo --ring $ring --target $target `
  --output "$repo\bench\check\results\broker-xperf-001\capture" --duration 10
```

Use absolute values for `$repo`, `$python`, `$xperf`, `$ring`, and `$target`. Do not authorize a general shell to wrap this capture.

The broker imports the repository authorities `bench/check/run.py::measurement_machine_lock` and `bench/check/windows_job.py::run_in_job`. It serializes requests behind the machine lock and creates a fresh kill-on-close Job for each command. Treat a lock conflict, hash/PATH drift, expired TTL, timeout, malformed request, path escape, or existing output directory as a hard failure; never relax the guardrail to make a capture run.

Retain each fresh output directory intact:

- `stdout.bin` and `stderr.bin` are the unmodified process streams.
- `measurement.json` is the direct `run_in_job` measurement dictionary.
- `request.json` and `run-receipt.json` bind argv, hashes, administrator identity, expiry, resource caps, and stream/measurement hashes.
- `failure-receipt.json` plus preserved streams records a fail-loud spawn/lock/measurement failure.

The broker refuses to overwrite any request directory or sidecar. It restricts `cwd` to the repository and output to the ignored results root after resolving filesystem links.

## Stop and rotate

Stop without another UAC prompt:

```powershell
python $broker stop
python $broker status
```

The fixed TTL cannot be renewed. Stop and start a new broker—with a new UAC prompt—when the allowlist, pinned file content, Python script inventory, PATH, results boundary, timeout maximum, or resource caps must change. The stopped state and start/stop receipts retain PID, administrator identity, expiry, fixed hashes, and caps; the transient authentication key and bootstrap are removed.

Do not describe this mechanism as saved UAC approval or cached administrator credentials. The only persistence is the already-elevated, time-limited broker process.
