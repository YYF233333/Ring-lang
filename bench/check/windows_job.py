"""Windows Job Object process measurement for the check benchmark harness.

The root process is created suspended, assigned to a fresh kill-on-close Job
Object, and only then resumed.  Exact lifetime counters come from the Job
Object and the retained root/worker process handles.  Aggregate tree working
set is a 10 ms sample and is deliberately reported with coverage metadata.
"""

from __future__ import annotations

import ctypes
import os
import subprocess
import time
from ctypes import wintypes
from pathlib import Path
from typing import Mapping, Sequence


CREATE_SUSPENDED = 0x00000004
CREATE_UNICODE_ENVIRONMENT = 0x00000400
JOB_OBJECT_LIMIT_ACTIVE_PROCESS = 0x00000008
JOB_OBJECT_LIMIT_JOB_MEMORY = 0x00000200
JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000
JOB_OBJECT_BASIC_PROCESS_ID_LIST = 3
JOB_OBJECT_ASSOCIATE_COMPLETION_PORT_INFORMATION = 7
JOB_OBJECT_BASIC_AND_IO_ACCOUNTING_INFORMATION = 8
JOB_OBJECT_EXTENDED_LIMIT_INFORMATION = 9
JOB_OBJECT_MSG_ACTIVE_PROCESS_LIMIT = 3
JOB_OBJECT_MSG_ACTIVE_PROCESS_ZERO = 4
PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
PROCESS_VM_READ = 0x0010
ERROR_MORE_DATA = 234
WAIT_TIMEOUT = 258
STILL_ACTIVE = 259
DEFAULT_JOB_MEMORY_LIMIT_BYTES = 12_884_901_888
DEFAULT_ACTIVE_PROCESS_LIMIT = 5
JOB_COMPLETION_KEY = 0xB176
SIZE_T_MAX = (1 << (ctypes.sizeof(ctypes.c_size_t) * 8)) - 1


class JobMeasurementError(RuntimeError):
    """The command could not be measured without losing a required invariant."""


if os.name == "nt":
    import _winapi
    import msvcrt

    ULONG_PTR = ctypes.c_size_t
    SIZE_T = ctypes.c_size_t
    ULONGLONG = ctypes.c_ulonglong

    class IO_COUNTERS(ctypes.Structure):
        _fields_ = [
            ("ReadOperationCount", ULONGLONG),
            ("WriteOperationCount", ULONGLONG),
            ("OtherOperationCount", ULONGLONG),
            ("ReadTransferCount", ULONGLONG),
            ("WriteTransferCount", ULONGLONG),
            ("OtherTransferCount", ULONGLONG),
        ]

    class JOBOBJECT_BASIC_ACCOUNTING_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("TotalUserTime", ctypes.c_longlong),
            ("TotalKernelTime", ctypes.c_longlong),
            ("ThisPeriodTotalUserTime", ctypes.c_longlong),
            ("ThisPeriodTotalKernelTime", ctypes.c_longlong),
            ("TotalPageFaultCount", wintypes.DWORD),
            ("TotalProcesses", wintypes.DWORD),
            ("ActiveProcesses", wintypes.DWORD),
            ("TotalTerminatedProcesses", wintypes.DWORD),
        ]

    class JOBOBJECT_BASIC_AND_IO_ACCOUNTING_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("BasicInfo", JOBOBJECT_BASIC_ACCOUNTING_INFORMATION),
            ("IoInfo", IO_COUNTERS),
        ]

    class JOBOBJECT_BASIC_LIMIT_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("PerProcessUserTimeLimit", ctypes.c_longlong),
            ("PerJobUserTimeLimit", ctypes.c_longlong),
            ("LimitFlags", wintypes.DWORD),
            ("MinimumWorkingSetSize", SIZE_T),
            ("MaximumWorkingSetSize", SIZE_T),
            ("ActiveProcessLimit", wintypes.DWORD),
            ("Affinity", ULONG_PTR),
            ("PriorityClass", wintypes.DWORD),
            ("SchedulingClass", wintypes.DWORD),
        ]

    class JOBOBJECT_EXTENDED_LIMIT_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("BasicLimitInformation", JOBOBJECT_BASIC_LIMIT_INFORMATION),
            ("IoInfo", IO_COUNTERS),
            ("ProcessMemoryLimit", SIZE_T),
            ("JobMemoryLimit", SIZE_T),
            ("PeakProcessMemoryUsed", SIZE_T),
            ("PeakJobMemoryUsed", SIZE_T),
        ]

    class JOBOBJECT_ASSOCIATE_COMPLETION_PORT(ctypes.Structure):
        _fields_ = [
            ("CompletionKey", ctypes.c_void_p),
            ("CompletionPort", wintypes.HANDLE),
        ]

    class PROCESS_MEMORY_COUNTERS_EX(ctypes.Structure):
        _fields_ = [
            ("cb", wintypes.DWORD),
            ("PageFaultCount", wintypes.DWORD),
            ("PeakWorkingSetSize", SIZE_T),
            ("WorkingSetSize", SIZE_T),
            ("QuotaPeakPagedPoolUsage", SIZE_T),
            ("QuotaPagedPoolUsage", SIZE_T),
            ("QuotaPeakNonPagedPoolUsage", SIZE_T),
            ("QuotaNonPagedPoolUsage", SIZE_T),
            ("PagefileUsage", SIZE_T),
            ("PeakPagefileUsage", SIZE_T),
            ("PrivateUsage", SIZE_T),
        ]

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    psapi = ctypes.WinDLL("psapi", use_last_error=True)

    kernel32.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
    kernel32.CreateJobObjectW.restype = wintypes.HANDLE
    kernel32.CreateIoCompletionPort.argtypes = [
        wintypes.HANDLE,
        wintypes.HANDLE,
        ULONG_PTR,
        wintypes.DWORD,
    ]
    kernel32.CreateIoCompletionPort.restype = wintypes.HANDLE
    kernel32.GetQueuedCompletionStatus.argtypes = [
        wintypes.HANDLE,
        ctypes.POINTER(wintypes.DWORD),
        ctypes.POINTER(ULONG_PTR),
        ctypes.POINTER(ctypes.c_void_p),
        wintypes.DWORD,
    ]
    kernel32.GetQueuedCompletionStatus.restype = wintypes.BOOL
    kernel32.SetInformationJobObject.argtypes = [
        wintypes.HANDLE,
        ctypes.c_int,
        ctypes.c_void_p,
        wintypes.DWORD,
    ]
    kernel32.SetInformationJobObject.restype = wintypes.BOOL
    kernel32.QueryInformationJobObject.argtypes = [
        wintypes.HANDLE,
        ctypes.c_int,
        ctypes.c_void_p,
        wintypes.DWORD,
        ctypes.POINTER(wintypes.DWORD),
    ]
    kernel32.QueryInformationJobObject.restype = wintypes.BOOL
    kernel32.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
    kernel32.AssignProcessToJobObject.restype = wintypes.BOOL
    kernel32.TerminateJobObject.argtypes = [wintypes.HANDLE, wintypes.UINT]
    kernel32.TerminateJobObject.restype = wintypes.BOOL
    kernel32.ResumeThread.argtypes = [wintypes.HANDLE]
    kernel32.ResumeThread.restype = wintypes.DWORD
    kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel32.OpenProcess.restype = wintypes.HANDLE
    kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel32.CloseHandle.restype = wintypes.BOOL
    kernel32.GetCurrentProcess.argtypes = []
    kernel32.GetCurrentProcess.restype = wintypes.HANDLE
    kernel32.GetProcessHandleCount.argtypes = [
        wintypes.HANDLE,
        ctypes.POINTER(wintypes.DWORD),
    ]
    kernel32.GetProcessHandleCount.restype = wintypes.BOOL
    psapi.GetProcessMemoryInfo.argtypes = [
        wintypes.HANDLE,
        ctypes.POINTER(PROCESS_MEMORY_COUNTERS_EX),
        wintypes.DWORD,
    ]
    psapi.GetProcessMemoryInfo.restype = wintypes.BOOL


def _require_windows() -> None:
    if os.name != "nt":
        raise JobMeasurementError("Windows Job Object measurement requires Windows")


def _winerror(context: str) -> JobMeasurementError:
    code = ctypes.get_last_error()
    return JobMeasurementError(f"{context}: {ctypes.WinError(code)}")


def _close_handle(handle: int | None) -> None:
    if handle:
        kernel32.CloseHandle(handle)


def job_limit_identity(
    memory_limit_bytes: int, active_process_limit: int
) -> dict[str, int]:
    if isinstance(memory_limit_bytes, bool) or not isinstance(memory_limit_bytes, int):
        raise JobMeasurementError("Job memory limit must be an integer byte count")
    if memory_limit_bytes <= 0:
        raise JobMeasurementError("Job memory limit must be positive")
    if memory_limit_bytes > SIZE_T_MAX:
        raise JobMeasurementError(
            f"Job memory limit {memory_limit_bytes} exceeds this process's "
            f"{SIZE_T_MAX.bit_length()}-bit SIZE_T capacity"
        )
    if isinstance(active_process_limit, bool) or not isinstance(
        active_process_limit, int
    ):
        raise JobMeasurementError("Job active-process limit must be an integer")
    if not 1 <= active_process_limit <= 0xFFFFFFFF:
        raise JobMeasurementError("Job active-process limit is outside DWORD range")
    return {
        "limit_flags": (
            JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
            | JOB_OBJECT_LIMIT_JOB_MEMORY
            | JOB_OBJECT_LIMIT_ACTIVE_PROCESS
        ),
        "job_memory_limit_bytes": memory_limit_bytes,
        "active_process_limit": active_process_limit,
    }


def _limit_identity(
    limits: JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
) -> dict[str, int]:
    return {
        "limit_flags": int(limits.BasicLimitInformation.LimitFlags),
        "job_memory_limit_bytes": int(limits.JobMemoryLimit),
        "active_process_limit": int(
            limits.BasicLimitInformation.ActiveProcessLimit
        ),
    }


def _new_job(
    memory_limit_bytes: int = DEFAULT_JOB_MEMORY_LIMIT_BYTES,
    active_process_limit: int = DEFAULT_ACTIVE_PROCESS_LIMIT,
) -> int:
    expected = job_limit_identity(memory_limit_bytes, active_process_limit)
    handle = kernel32.CreateJobObjectW(None, None)
    if not handle:
        raise _winerror("CreateJobObjectW failed")
    limits = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
    limits.BasicLimitInformation.LimitFlags = expected["limit_flags"]
    limits.BasicLimitInformation.ActiveProcessLimit = expected[
        "active_process_limit"
    ]
    limits.JobMemoryLimit = expected["job_memory_limit_bytes"]
    if not kernel32.SetInformationJobObject(
        handle,
        JOB_OBJECT_EXTENDED_LIMIT_INFORMATION,
        ctypes.byref(limits),
        ctypes.sizeof(limits),
    ):
        error = _winerror("SetInformationJobObject failed")
        _close_handle(handle)
        raise error
    try:
        actual = _limit_identity(_query_extended_limits(int(handle)))
    except BaseException:
        _close_handle(handle)
        raise
    if actual != expected:
        _close_handle(handle)
        raise JobMeasurementError(
            "Job limit round-trip mismatch: "
            f"expected={expected}, actual={actual}"
        )
    return int(handle)


def _new_completion_port(job: int) -> int:
    invalid_handle_value = ctypes.c_void_p(-1).value
    handle = kernel32.CreateIoCompletionPort(
        invalid_handle_value, None, 0, 1
    )
    if not handle:
        raise _winerror("CreateIoCompletionPort failed")
    association = JOBOBJECT_ASSOCIATE_COMPLETION_PORT()
    association.CompletionKey = JOB_COMPLETION_KEY
    association.CompletionPort = handle
    if not kernel32.SetInformationJobObject(
        job,
        JOB_OBJECT_ASSOCIATE_COMPLETION_PORT_INFORMATION,
        ctypes.byref(association),
        ctypes.sizeof(association),
    ):
        error = _winerror(
            "SetInformationJobObject(completion port) failed"
        )
        _close_handle(int(handle))
        raise error
    return int(handle)


def _drain_completion_port(port: int) -> list[tuple[int, int]]:
    events: list[tuple[int, int]] = []
    while True:
        message = wintypes.DWORD()
        completion_key = ULONG_PTR()
        completion_value = ctypes.c_void_p()
        ctypes.set_last_error(0)
        if not kernel32.GetQueuedCompletionStatus(
            port,
            ctypes.byref(message),
            ctypes.byref(completion_key),
            ctypes.byref(completion_value),
            0,
        ):
            error = ctypes.get_last_error()
            if error == WAIT_TIMEOUT:
                return events
            raise _winerror("GetQueuedCompletionStatus failed")
        if int(completion_key.value) != JOB_COMPLETION_KEY:
            raise JobMeasurementError(
                "Job completion port returned an unexpected completion key: "
                f"{int(completion_key.value)}"
            )
        events.append(
            (int(message.value), int(completion_value.value or 0))
        )


def current_process_handle_count() -> int:
    """Return the exact kernel handle count for the current Python process."""

    _require_windows()
    count = wintypes.DWORD()
    if not kernel32.GetProcessHandleCount(
        kernel32.GetCurrentProcess(), ctypes.byref(count)
    ):
        raise _winerror("GetProcessHandleCount failed")
    return int(count.value)


def preflight_job_support(
    memory_limit_bytes: int = DEFAULT_JOB_MEMORY_LIMIT_BYTES,
    active_process_limit: int = DEFAULT_ACTIVE_PROCESS_LIMIT,
) -> dict[str, int]:
    """Create/configure/query a fresh Job and prove preflight leaks no handle."""

    _require_windows()
    expected = job_limit_identity(memory_limit_bytes, active_process_limit)
    before = current_process_handle_count()
    job = _new_job(memory_limit_bytes, active_process_limit)
    try:
        accounting = _query_accounting(job)
        limits = _query_extended_limits(job)
        if accounting.BasicInfo.TotalProcesses != 0:
            raise JobMeasurementError("fresh preflight Job unexpectedly owns a process")
        actual = _limit_identity(limits)
        if actual != expected:
            raise JobMeasurementError(
                "fresh preflight Job limit identity drifted: "
                f"expected={expected}, actual={actual}"
            )
    finally:
        _close_handle(job)
    after = current_process_handle_count()
    if after != before:
        raise JobMeasurementError(
            f"Job preflight leaked handles: before={before}, after={after}"
        )
    return {
        **expected,
        "handle_count_before": before,
        "handle_count_after": after,
    }


def _query_struct(job: int, info_class: int, value: ctypes.Structure) -> None:
    returned = wintypes.DWORD()
    if not kernel32.QueryInformationJobObject(
        job,
        info_class,
        ctypes.byref(value),
        ctypes.sizeof(value),
        ctypes.byref(returned),
    ):
        raise _winerror(f"QueryInformationJobObject({info_class}) failed")


def _query_accounting(job: int) -> JOBOBJECT_BASIC_AND_IO_ACCOUNTING_INFORMATION:
    value = JOBOBJECT_BASIC_AND_IO_ACCOUNTING_INFORMATION()
    _query_struct(job, JOB_OBJECT_BASIC_AND_IO_ACCOUNTING_INFORMATION, value)
    return value


def _query_extended_limits(job: int) -> JOBOBJECT_EXTENDED_LIMIT_INFORMATION:
    value = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
    _query_struct(job, JOB_OBJECT_EXTENDED_LIMIT_INFORMATION, value)
    return value


def _job_pids(job: int) -> list[int]:
    capacity = 64
    item_size = ctypes.sizeof(ULONG_PTR)
    header_size = ctypes.sizeof(wintypes.DWORD) * 2
    while capacity <= 65536:
        buffer = ctypes.create_string_buffer(header_size + capacity * item_size)
        returned = wintypes.DWORD()
        ok = kernel32.QueryInformationJobObject(
            job,
            JOB_OBJECT_BASIC_PROCESS_ID_LIST,
            buffer,
            len(buffer),
            ctypes.byref(returned),
        )
        assigned = wintypes.DWORD.from_buffer(buffer, 0).value
        listed = wintypes.DWORD.from_buffer(buffer, ctypes.sizeof(wintypes.DWORD)).value
        if ok:
            array_type = ULONG_PTR * listed
            pids = array_type.from_buffer(buffer, header_size)
            return [int(pid) for pid in pids if pid]
        error = ctypes.get_last_error()
        if error != ERROR_MORE_DATA:
            raise _winerror("QueryInformationJobObject(process ids) failed")
        capacity = max(capacity * 2, int(assigned), int(listed), 1)
    raise JobMeasurementError("Job process list exceeded 65536 entries")


def _open_process(pid: int) -> int | None:
    handle = kernel32.OpenProcess(
        PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_VM_READ,
        False,
        pid,
    )
    return int(handle) if handle else None


def _memory_info(handle: int) -> PROCESS_MEMORY_COUNTERS_EX | None:
    value = PROCESS_MEMORY_COUNTERS_EX()
    value.cb = ctypes.sizeof(value)
    if not psapi.GetProcessMemoryInfo(handle, ctypes.byref(value), value.cb):
        return None
    return value


def _coverage_ns(intervals: list[tuple[int, int]], start_ns: int, end_ns: int) -> int:
    if not intervals or end_ns <= start_ns:
        return 0
    clipped = [
        (max(start_ns, begin), min(end_ns, finish))
        for begin, finish in intervals
        if finish > start_ns and begin < end_ns
    ]
    if not clipped:
        return 0
    clipped.sort()
    covered = 0
    current_begin, current_end = clipped[0]
    for begin, finish in clipped[1:]:
        if begin <= current_end:
            current_end = max(current_end, finish)
        else:
            covered += current_end - current_begin
            current_begin, current_end = begin, finish
    return covered + current_end - current_begin


def _signed_exit_code(code: int) -> int:
    return ctypes.c_int32(code).value


def run_in_job(
    argv: Sequence[str],
    *,
    cwd: str | os.PathLike[str],
    env: Mapping[str, str] | None,
    stdout_path: str | os.PathLike[str],
    stderr_path: str | os.PathLike[str],
    timeout_seconds: float,
    poll_ms: int = 10,
    memory_limit_bytes: int = DEFAULT_JOB_MEMORY_LIMIT_BYTES,
    active_process_limit: int = DEFAULT_ACTIVE_PROCESS_LIMIT,
) -> dict[str, object]:
    """Run one command in a fresh Job Object and return raw measurements.

    stdout and stderr are inherited file handles, never merged.  The returned
    exact counters are lifetime Job Object values.  Sampled tree working set is
    a lower bound whenever ``rss_complete`` is false.
    """

    _require_windows()
    if not argv or not all(isinstance(part, str) and part for part in argv):
        raise ValueError("argv must be a non-empty sequence of non-empty strings")
    if timeout_seconds <= 0:
        raise ValueError("timeout_seconds must be positive")
    if poll_ms != 10:
        raise ValueError("B-176 requires a fixed 10 ms RSS poll interval")
    job_limit_identity(memory_limit_bytes, active_process_limit)

    stdout_file_path = Path(stdout_path)
    stderr_file_path = Path(stderr_path)
    stdout_file_path.parent.mkdir(parents=True, exist_ok=True)
    stderr_file_path.parent.mkdir(parents=True, exist_ok=True)

    job: int | None = None
    completion_port: int | None = None
    process_handle: int | None = None
    thread_handle: int | None = None
    retained_handles: dict[int, int] = {}
    timed_out = False
    sampling_errors: set[str] = set()
    sample_intervals: list[tuple[int, int]] = []
    sampled_peak_tree_rss = 0
    rss_samples = 0
    pid = 0

    def release_handles() -> None:
        nonlocal completion_port, job, process_handle, thread_handle
        if thread_handle is not None:
            _close_handle(thread_handle)
            thread_handle = None
        for current_pid, handle in retained_handles.items():
            if current_pid != pid:
                _close_handle(handle)
        retained_handles.clear()
        if process_handle is not None:
            _close_handle(process_handle)
            process_handle = None
        if job is not None:
            _close_handle(job)
            job = None
        if completion_port is not None:
            _close_handle(completion_port)
            completion_port = None

    def drain_completion_events() -> None:
        assert completion_port is not None
        for message, completion_value in _drain_completion_port(completion_port):
            if message == JOB_OBJECT_MSG_ACTIVE_PROCESS_LIMIT:
                sampling_errors.add(
                    "active_process_limit_reached: "
                    f"completion_message={message}, "
                    f"completion_value={completion_value}, "
                    f"limit={active_process_limit}"
                )

    with (
        open(os.devnull, "rb", buffering=0) as stdin_file,
        open(stdout_file_path, "wb", buffering=0) as stdout_file,
        open(stderr_file_path, "wb", buffering=0) as stderr_file,
    ):
        std_handles = [
            msvcrt.get_osfhandle(stdin_file.fileno()),
            msvcrt.get_osfhandle(stdout_file.fileno()),
            msvcrt.get_osfhandle(stderr_file.fileno()),
        ]
        for handle in std_handles:
            os.set_handle_inheritable(handle, True)

        startup = subprocess.STARTUPINFO()
        startup.dwFlags |= _winapi.STARTF_USESTDHANDLES
        startup.hStdInput, startup.hStdOutput, startup.hStdError = std_handles
        startup.lpAttributeList = {"handle_list": std_handles}
        command_line = subprocess.list2cmdline(list(argv))
        child_env = dict(os.environ if env is None else env)
        job = _new_job(memory_limit_bytes, active_process_limit)
        try:
            completion_port = _new_completion_port(job)
        except BaseException:
            release_handles()
            raise

        try:
            hp, ht, pid, _tid = _winapi.CreateProcess(
                argv[0],
                command_line,
                None,
                None,
                True,
                CREATE_SUSPENDED | CREATE_UNICODE_ENVIRONMENT,
                child_env,
                os.fspath(cwd),
                startup,
            )
            process_handle = int(hp)
            thread_handle = int(ht)
            retained_handles[int(pid)] = process_handle
        except Exception:
            release_handles()
            raise
        finally:
            for handle in std_handles:
                try:
                    os.set_handle_inheritable(handle, False)
                except OSError:
                    # The child already owns only the explicit handle list.  A
                    # close below still makes a failed parent reset harmless.
                    pass

        if not kernel32.AssignProcessToJobObject(job, process_handle):
            error = _winerror("AssignProcessToJobObject failed")
            _winapi.TerminateProcess(process_handle, 127)
            release_handles()
            raise error

        resumed = kernel32.ResumeThread(thread_handle)
        _close_handle(thread_handle)
        thread_handle = None
        if resumed == 0xFFFFFFFF:
            error = _winerror("ResumeThread failed")
            kernel32.TerminateJobObject(job, 127)
            release_handles()
            raise error

        start_ns = time.perf_counter_ns()
        deadline_ns = start_ns + int(timeout_seconds * 1_000_000_000)
        poll_ns = poll_ms * 1_000_000
        next_poll_ns = start_ns

        try:
            while True:
                drain_completion_events()
                sample_begin = time.perf_counter_ns()
                try:
                    current_pids = _job_pids(job)
                except JobMeasurementError as exc:
                    current_pids = []
                    sampling_errors.add(str(exc))

                tree_rss = 0
                complete_sample = True
                for current_pid in current_pids:
                    handle = retained_handles.get(current_pid)
                    if handle is None:
                        handle = _open_process(current_pid)
                        if handle is None:
                            complete_sample = False
                            continue
                        retained_handles[current_pid] = handle
                    memory = _memory_info(handle)
                    if memory is None:
                        complete_sample = False
                        continue
                    tree_rss += int(memory.WorkingSetSize)
                if current_pids and complete_sample:
                    sampled_peak_tree_rss = max(sampled_peak_tree_rss, tree_rss)
                    rss_samples += 1
                    sample_intervals.append((sample_begin, sample_begin + poll_ns))
                elif current_pids:
                    sampling_errors.add(
                        "one or more active process working sets were not observed"
                    )

                accounting_now = _query_accounting(job).BasicInfo
                root_done = (
                    _winapi.WaitForSingleObject(process_handle, 0)
                    == _winapi.WAIT_OBJECT_0
                )
                if root_done and accounting_now.ActiveProcesses == 0:
                    # The Job is quiescent; retain every notification already
                    # queued for the completed process tree before returning.
                    drain_completion_events()
                    break

                now_ns = time.perf_counter_ns()
                if now_ns >= deadline_ns and not timed_out:
                    timed_out = True
                    if not kernel32.TerminateJobObject(job, 124):
                        sampling_errors.add(str(_winerror("TerminateJobObject failed")))
                    deadline_ns = now_ns + 5_000_000_000
                elif timed_out and now_ns >= deadline_ns:
                    sampling_errors.add("job did not quiesce within 5 seconds after timeout")
                    break

                next_poll_ns += poll_ns
                sleep_ns = next_poll_ns - time.perf_counter_ns()
                if sleep_ns > 0:
                    time.sleep(sleep_ns / 1_000_000_000)

            end_ns = time.perf_counter_ns()
        except BaseException:
            kernel32.TerminateJobObject(job, 127)
            release_handles()
            raise

    try:
        exit_code = _signed_exit_code(_winapi.GetExitCodeProcess(process_handle))
        accounting = _query_accounting(job)
        extended = _query_extended_limits(job)
        root_memory = _memory_info(process_handle)

        worker_peaks: list[int] = []
        for worker_pid, handle in retained_handles.items():
            if worker_pid == pid:
                continue
            memory = _memory_info(handle)
            if memory is not None:
                worker_peaks.append(int(memory.PeakWorkingSetSize))

        total_processes = int(accounting.BasicInfo.TotalProcesses)
        observed_processes = len(retained_handles)
        wall_ns = end_ns - start_ns
        covered_ns = _coverage_ns(sample_intervals, start_ns, end_ns)
        coverage_ratio = min(1.0, covered_ns / wall_ns) if wall_ns else 0.0
        peak_job_commit = int(extended.PeakJobMemoryUsed)
        if peak_job_commit >= memory_limit_bytes:
            sampling_errors.add(
                "job_memory_limit_reached: "
                f"peak_job_commit={peak_job_commit}, limit={memory_limit_bytes}"
            )
        rss_complete = (
            observed_processes >= total_processes
            and coverage_ratio >= 0.95
            and not sampling_errors
        )

        return {
            "root_pid": int(pid),
            "wall_ns": wall_ns,
            "cpu_user_ns": int(accounting.BasicInfo.TotalUserTime) * 100,
            "cpu_kernel_ns": int(accounting.BasicInfo.TotalKernelTime) * 100,
            "peak_root_rss_bytes": (
                int(root_memory.PeakWorkingSetSize) if root_memory is not None else None
            ),
            "sampled_peak_tree_rss_bytes": sampled_peak_tree_rss,
            "max_worker_peak_rss_bytes": max(worker_peaks) if worker_peaks else None,
            "peak_job_commit_bytes": peak_job_commit,
            "rss_poll_ms": poll_ms,
            "rss_samples_observed": rss_samples,
            "rss_covered_ns": covered_ns,
            "rss_coverage_ratio": coverage_ratio,
            "rss_observed_process_count": observed_processes,
            "rss_job_total_processes": total_processes,
            "rss_complete": rss_complete,
            "process_count": {
                "total": total_processes,
                "active_at_query": int(accounting.BasicInfo.ActiveProcesses),
                "terminated": int(accounting.BasicInfo.TotalTerminatedProcesses),
            },
            "job_io": {
                "read_operations": int(accounting.IoInfo.ReadOperationCount),
                "write_operations": int(accounting.IoInfo.WriteOperationCount),
                "other_operations": int(accounting.IoInfo.OtherOperationCount),
                "read_bytes": int(accounting.IoInfo.ReadTransferCount),
                "write_bytes": int(accounting.IoInfo.WriteTransferCount),
                "other_bytes": int(accounting.IoInfo.OtherTransferCount),
            },
            "exit_code": exit_code,
            "timed_out": timed_out,
            "measurement_errors": sorted(sampling_errors),
        }
    finally:
        release_handles()
