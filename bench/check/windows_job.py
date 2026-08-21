"""Windows Job Object process measurement for the check benchmark harness.

The root process is created suspended, assigned to a fresh kill-on-close Job
Object, and only then resumed.  Exact lifetime counters come from the Job
Object and the retained root/worker process handles.  Aggregate tree working
set is a 10 ms sample and is deliberately reported with coverage metadata.
"""

from __future__ import annotations

import ctypes
import hashlib
import os
import subprocess
import threading
import time
from ctypes import wintypes
from pathlib import Path
from typing import Mapping, Sequence


CREATE_SUSPENDED = 0x00000004
CREATE_UNICODE_ENVIRONMENT = 0x00000400
JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000
JOB_OBJECT_LIMIT_ACTIVE_PROCESS = 0x00000008
JOB_OBJECT_LIMIT_JOB_MEMORY = 0x00000200
JOB_OBJECT_BASIC_PROCESS_ID_LIST = 3
JOB_OBJECT_BASIC_AND_IO_ACCOUNTING_INFORMATION = 8
JOB_OBJECT_EXTENDED_LIMIT_INFORMATION = 9
JOB_OBJECT_ASSOCIATE_COMPLETION_PORT_INFORMATION = 7
JOB_OBJECT_MSG_ACTIVE_PROCESS_LIMIT = 3
JOB_OBJECT_MSG_JOB_MEMORY_LIMIT = 10
PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
PROCESS_VM_READ = 0x0010
ERROR_MORE_DATA = 234
STILL_ACTIVE = 259
WAIT_TIMEOUT = 258


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

    class JOBOBJECT_ASSOCIATE_COMPLETION_PORT(ctypes.Structure):
        _fields_ = [
            ("CompletionKey", ctypes.c_void_p),
            ("CompletionPort", wintypes.HANDLE),
        ]

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    psapi = ctypes.WinDLL("psapi", use_last_error=True)

    kernel32.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
    kernel32.CreateJobObjectW.restype = wintypes.HANDLE
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


def _require_windows() -> None:
    if os.name != "nt":
        raise JobMeasurementError("Windows Job Object measurement requires Windows")


def _winerror(context: str) -> JobMeasurementError:
    code = ctypes.get_last_error()
    return JobMeasurementError(f"{context}: {ctypes.WinError(code)}")


def _close_handle(handle: int | None) -> None:
    if handle:
        kernel32.CloseHandle(handle)


def _new_job() -> int:
    handle = kernel32.CreateJobObjectW(None, None)
    if not handle:
        raise _winerror("CreateJobObjectW failed")
    limits = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
    limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
    if not kernel32.SetInformationJobObject(
        handle,
        JOB_OBJECT_EXTENDED_LIMIT_INFORMATION,
        ctypes.byref(limits),
        ctypes.sizeof(limits),
    ):
        error = _winerror("SetInformationJobObject failed")
        _close_handle(handle)
        raise error
    return int(handle)


def current_process_handle_count() -> int:
    """Return the exact kernel handle count for the current Python process."""

    _require_windows()
    count = wintypes.DWORD()
    if not kernel32.GetProcessHandleCount(
        kernel32.GetCurrentProcess(), ctypes.byref(count)
    ):
        raise _winerror("GetProcessHandleCount failed")
    return int(count.value)


def preflight_job_support() -> dict[str, int]:
    """Create/configure/query a fresh Job and prove preflight leaks no handle."""

    _require_windows()
    before = current_process_handle_count()
    job = _new_job()
    try:
        accounting = _query_accounting(job)
        limits = _query_extended_limits(job)
        if accounting.BasicInfo.TotalProcesses != 0:
            raise JobMeasurementError("fresh preflight Job unexpectedly owns a process")
        if not (
            limits.BasicLimitInformation.LimitFlags
            & JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
        ):
            raise JobMeasurementError("fresh preflight Job lost kill-on-close configuration")
    finally:
        _close_handle(job)
    after = current_process_handle_count()
    if after != before:
        raise JobMeasurementError(
            f"Job preflight leaked handles: before={before}, after={after}"
        )
    return {"handle_count_before": before, "handle_count_after": after}


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


def _new_bounded_job(
    memory_limit: int | None, process_limit: int | None
) -> tuple[int, int]:
    """Create one limited Job plus its completion port, with query-back."""

    _require_windows()
    job = kernel32.CreateJobObjectW(None, None)
    if not job:
        raise _winerror("CreateJobObjectW failed")
    port: int | None = None
    try:
        flags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
        limits = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
        if memory_limit is not None:
            flags |= JOB_OBJECT_LIMIT_JOB_MEMORY
            limits.JobMemoryLimit = memory_limit
        if process_limit is not None:
            flags |= JOB_OBJECT_LIMIT_ACTIVE_PROCESS
            limits.BasicLimitInformation.ActiveProcessLimit = process_limit
        limits.BasicLimitInformation.LimitFlags = flags
        if not kernel32.SetInformationJobObject(
            job,
            JOB_OBJECT_EXTENDED_LIMIT_INFORMATION,
            ctypes.byref(limits),
            ctypes.sizeof(limits),
        ):
            raise _winerror("SetInformationJobObject(limits) failed")

        invalid_handle = wintypes.HANDLE(-1).value
        completion = kernel32.CreateIoCompletionPort(
            invalid_handle, None, ULONG_PTR(0), 1
        )
        if not completion:
            raise _winerror("CreateIoCompletionPort failed")
        port = int(completion)
        association = JOBOBJECT_ASSOCIATE_COMPLETION_PORT()
        association.CompletionKey = ctypes.c_void_p(0xB188)
        association.CompletionPort = completion
        if not kernel32.SetInformationJobObject(
            job,
            JOB_OBJECT_ASSOCIATE_COMPLETION_PORT_INFORMATION,
            ctypes.byref(association),
            ctypes.sizeof(association),
        ):
            raise _winerror("SetInformationJobObject(completion port) failed")

        observed = _query_extended_limits(int(job))
        if int(observed.BasicLimitInformation.LimitFlags) != flags:
            raise JobMeasurementError("bounded Job limit flags failed query-back")
        if memory_limit is not None and int(observed.JobMemoryLimit) != memory_limit:
            raise JobMeasurementError("bounded Job memory limit failed query-back")
        if process_limit is not None and int(
            observed.BasicLimitInformation.ActiveProcessLimit
        ) != process_limit:
            raise JobMeasurementError("bounded Job process limit failed query-back")
        return int(job), port
    except BaseException:
        if port is not None:
            _close_handle(port)
        _close_handle(int(job))
        raise


def _drain_job_messages(port: int) -> list[int]:
    messages: list[int] = []
    while True:
        message = wintypes.DWORD()
        completion_key = ULONG_PTR()
        overlapped = ctypes.c_void_p()
        ok = kernel32.GetQueuedCompletionStatus(
            port,
            ctypes.byref(message),
            ctypes.byref(completion_key),
            ctypes.byref(overlapped),
            0,
        )
        if not ok:
            error = ctypes.get_last_error()
            if error == WAIT_TIMEOUT:
                return messages
            raise _winerror("GetQueuedCompletionStatus failed")
        messages.append(int(message.value))


class _RawPrefixSink:
    def __init__(self, path: Path, relative_path: str, cap: int) -> None:
        self.path = path
        self.relative_path = relative_path
        self.cap = cap
        self.captured = 0
        self.seen = 0
        self.truncated = False
        self.fsynced = False
        self.error: str | None = None
        self.digest = hashlib.sha256()
        self._descriptor: int | None = None

    def open_exclusive(self) -> None:
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_BINARY
        self._descriptor = os.open(self.path, flags, 0o600)

    def consume(self, chunk: bytes) -> None:
        self.seen += len(chunk)
        remaining = self.cap - self.captured
        prefix = chunk[: max(0, remaining)]
        if prefix:
            if self._descriptor is None:
                raise OSError("raw sink is closed")
            view = memoryview(prefix)
            offset = 0
            while offset < len(view):
                written = os.write(self._descriptor, view[offset:])
                if written <= 0:
                    raise OSError(f"raw write made no progress: {written}")
                self.digest.update(view[offset : offset + written])
                offset += written
            self.captured += len(prefix)
        if len(chunk) > len(prefix):
            self.truncated = True

    def seal(self) -> None:
        if self._descriptor is not None:
            os.fsync(self._descriptor)
            os.close(self._descriptor)
            self._descriptor = None
            self.fsynced = True

    def record(self) -> dict[str, object]:
        return {
            "path": self.relative_path,
            "captured_size": self.captured,
            "sha256": self.digest.hexdigest(),
            "bytes_seen": self.seen,
            "cap_bytes": self.cap,
            "truncated_at_cap": self.truncated,
            "fsynced": self.fsynced,
            "error": self.error,
        }


def run_one_shot_job(
    argv: Sequence[str],
    *,
    cwd: str | os.PathLike[str],
    env: Mapping[str, str],
    stdout_path: str | os.PathLike[str],
    stderr_path: str | os.PathLike[str],
    limits,
    cleanup_armed_callback=None,
) -> dict[str, object]:
    """Run a durable one-shot child under hard Windows Job limits.

    Raw stream files are O_EXCL-created before CreateProcess and are fsynced
    before this function returns, including every failure path.
    """

    _require_windows()
    if not argv or not all(isinstance(part, str) and part for part in argv):
        raise ValueError("argv must be non-empty strings")
    if limits.wall_seconds <= 0 or limits.poll_ms != 10:
        raise ValueError("invalid one-shot timing limits")

    stdout_sink = _RawPrefixSink(Path(stdout_path), "stdout.raw", limits.stdout_cap_bytes)
    stderr_sink = _RawPrefixSink(Path(stderr_path), "stderr.raw", limits.stderr_cap_bytes)
    stdout_sink.open_exclusive()
    try:
        stderr_sink.open_exclusive()
    except BaseException:
        stdout_sink.seal()
        raise

    job: int | None = None
    completion_port: int | None = None
    process_handle: int | None = None
    thread_handle: int | None = None
    child_fds: list[int] = []
    unowned_parent_fds: set[int] = set()
    stream_threads: list[threading.Thread] = []
    process_assigned = False
    process_finished = False
    timed_out = False
    memory_limit_hit = False
    process_limit_hit = False
    launch_error: str | None = None
    infrastructure_errors: list[str] = []
    thread_errors: list[str] = []
    job_messages: list[int] = []
    peak_tree_working_set = 0
    working_set_unavailable_samples = 0
    working_set_complete = True
    sampled_process_peak = 0
    started_ns = time.perf_counter_ns()
    exit_code: int | None = None
    process_count: dict[str, int] = {"total": 0, "active": 0, "terminated": 0}
    peak_job_commit: int | None = None

    stop_event = threading.Event()

    def stream_reader(fd: int, sink: _RawPrefixSink, label: str) -> None:
        try:
            while True:
                chunk = os.read(fd, 65536)
                if not chunk:
                    break
                sink.consume(chunk)
                if sink.truncated:
                    stop_event.set()
                    break
        except BaseException as exc:
            message = f"{label}: {type(exc).__name__}: {exc}"
            sink.error = message
            thread_errors.append(message)
            stop_event.set()
        finally:
            try:
                os.close(fd)
            except OSError as exc:
                message = f"{label}-pipe-close: {type(exc).__name__}: {exc}"
                sink.error = message
                thread_errors.append(message)
                stop_event.set()
            try:
                sink.seal()
            except BaseException as exc:
                message = f"{label}-raw-seal: {type(exc).__name__}: {exc}"
                sink.error = message
                thread_errors.append(message)
                stop_event.set()

    def terminate_job(code: int) -> None:
        if job is not None and not kernel32.TerminateJobObject(job, code):
            infrastructure_errors.append(str(_winerror("TerminateJobObject failed")))

    try:
        job, completion_port = _new_bounded_job(
            limits.job_memory_bytes, limits.active_process_limit
        )
        with open(os.devnull, "rb", buffering=0) as stdin_file:
            stdout_read, stdout_write = os.pipe()
            stderr_read, stderr_write = os.pipe()
            child_fds = [stdout_write, stderr_write]
            unowned_parent_fds = {stdout_read, stderr_read}
            child_handles = [
                msvcrt.get_osfhandle(stdin_file.fileno()),
                msvcrt.get_osfhandle(stdout_write),
                msvcrt.get_osfhandle(stderr_write),
            ]
            parent_handles = [
                msvcrt.get_osfhandle(stdout_read),
                msvcrt.get_osfhandle(stderr_read),
            ]
            for handle in child_handles:
                os.set_handle_inheritable(handle, True)
            for handle in parent_handles:
                os.set_handle_inheritable(handle, False)
            startup = subprocess.STARTUPINFO()
            startup.dwFlags |= _winapi.STARTF_USESTDHANDLES
            startup.hStdInput, startup.hStdOutput, startup.hStdError = child_handles
            startup.lpAttributeList = {"handle_list": child_handles}
            try:
                hp, ht, _pid, _tid = _winapi.CreateProcess(
                    argv[0],
                    subprocess.list2cmdline(list(argv)),
                    None,
                    None,
                    True,
                    CREATE_SUSPENDED | CREATE_UNICODE_ENVIRONMENT,
                    dict(env),
                    os.fspath(cwd),
                    startup,
                )
                process_handle = int(hp)
                thread_handle = int(ht)
            except BaseException as exc:
                launch_error = f"{type(exc).__name__}: {exc}"
                raise
            finally:
                for handle in child_handles:
                    try:
                        os.set_handle_inheritable(handle, False)
                    except OSError:
                        pass
            for fd in child_fds:
                os.close(fd)
            child_fds.clear()
            if not kernel32.AssignProcessToJobObject(job, process_handle):
                launch_error = str(_winerror("AssignProcessToJobObject failed"))
                _winapi.TerminateProcess(process_handle, 127)
                raise JobMeasurementError(launch_error)
            process_assigned = True

            for label, fd, sink in (
                ("stdout", stdout_read, stdout_sink),
                ("stderr", stderr_read, stderr_sink),
            ):
                thread = threading.Thread(
                    name=f"one-shot-{label}",
                    target=stream_reader,
                    args=(fd, sink, label),
                    daemon=True,
                )
                thread.start()
                unowned_parent_fds.remove(fd)
                stream_threads.append(thread)

            if cleanup_armed_callback is not None:
                cleanup_armed_callback(
                    {
                        "adapter": "windows-job-v1",
                        "cleanup": "kill-on-job-close",
                        "root_pid": _pid,
                        "process_assigned": True,
                        "target_resumed": False,
                    }
                )

            resumed = kernel32.ResumeThread(thread_handle)
            _close_handle(thread_handle)
            thread_handle = None
            if resumed == 0xFFFFFFFF:
                launch_error = str(_winerror("ResumeThread failed"))
                raise JobMeasurementError(launch_error)

            started_ns = time.perf_counter_ns()
            deadline_ns = started_ns + int(limits.wall_seconds * 1_000_000_000)
            killed = False
            kill_deadline_ns: int | None = None
            while True:
                if completion_port is not None:
                    try:
                        messages = _drain_job_messages(completion_port)
                        job_messages.extend(messages)
                        if JOB_OBJECT_MSG_ACTIVE_PROCESS_LIMIT in messages:
                            process_limit_hit = True
                            stop_event.set()
                        if JOB_OBJECT_MSG_JOB_MEMORY_LIMIT in messages:
                            memory_limit_hit = True
                            stop_event.set()
                    except JobMeasurementError as exc:
                        infrastructure_errors.append(str(exc))
                        stop_event.set()

                try:
                    pids = _job_pids(job)
                    sampled_process_peak = max(sampled_process_peak, len(pids))
                    tree_working_set = 0
                    for sample_pid in pids:
                        handle = (
                            process_handle
                            if sample_pid == _pid
                            else _open_process(sample_pid)
                        )
                        if handle is None:
                            working_set_unavailable_samples += 1
                            working_set_complete = False
                            continue
                        try:
                            memory = _memory_info(handle)
                        finally:
                            if sample_pid != _pid:
                                _close_handle(handle)
                        if memory is None:
                            working_set_unavailable_samples += 1
                            working_set_complete = False
                        else:
                            tree_working_set += int(memory.WorkingSetSize)
                    peak_tree_working_set = max(
                        peak_tree_working_set, tree_working_set
                    )
                except JobMeasurementError as exc:
                    working_set_complete = False
                    infrastructure_errors.append(str(exc))
                    stop_event.set()

                accounting_now = _query_accounting(job).BasicInfo
                root_done = (
                    _winapi.WaitForSingleObject(process_handle, 0)
                    == _winapi.WAIT_OBJECT_0
                )
                if root_done and accounting_now.ActiveProcesses == 0:
                    process_finished = True
                    break
                now_ns = time.perf_counter_ns()
                if now_ns >= deadline_ns and not timed_out:
                    timed_out = True
                    stop_event.set()
                if stop_event.is_set() and not killed:
                    killed = True
                    terminate_job(124)
                    kill_deadline_ns = now_ns + 5_000_000_000
                if killed and kill_deadline_ns is not None and now_ns >= kill_deadline_ns:
                    infrastructure_errors.append(
                        "Job did not quiesce within 5 seconds after termination"
                    )
                    break
                time.sleep(limits.poll_ms / 1000)
    except BaseException as exc:
        if launch_error is None:
            infrastructure_errors.append(f"{type(exc).__name__}: {exc}")
        if process_assigned:
            terminate_job(127)
    finally:
        if process_assigned and not process_finished:
            terminate_job(127)
        for fd in child_fds:
            try:
                os.close(fd)
            except OSError:
                pass
        for fd in unowned_parent_fds:
            try:
                os.close(fd)
            except OSError:
                pass
        if thread_handle is not None:
            _close_handle(thread_handle)
            thread_handle = None
        for thread in stream_threads:
            thread.join(timeout=5)
        alive = [thread.name for thread in stream_threads if thread.is_alive()]
        if alive:
            thread_errors.append(f"threads did not quiesce: {alive}")
        for sink in (stdout_sink, stderr_sink):
            try:
                sink.seal()
            except BaseException as exc:
                message = f"raw-seal: {type(exc).__name__}: {exc}"
                sink.error = message
                thread_errors.append(message)

        if job is not None:
            try:
                if completion_port is not None:
                    messages = _drain_job_messages(completion_port)
                    job_messages.extend(messages)
                    process_limit_hit = process_limit_hit or (
                        JOB_OBJECT_MSG_ACTIVE_PROCESS_LIMIT in messages
                    )
                    memory_limit_hit = memory_limit_hit or (
                        JOB_OBJECT_MSG_JOB_MEMORY_LIMIT in messages
                    )
                accounting = _query_accounting(job)
                extended = _query_extended_limits(job)
                process_count = {
                    "total": int(accounting.BasicInfo.TotalProcesses),
                    "active": int(accounting.BasicInfo.ActiveProcesses),
                    "terminated": int(accounting.BasicInfo.TotalTerminatedProcesses),
                }
                peak_job_commit = int(extended.PeakJobMemoryUsed)
            except BaseException as exc:
                infrastructure_errors.append(f"final Job query: {type(exc).__name__}: {exc}")
        if process_handle is not None:
            try:
                exit_code = _signed_exit_code(
                    _winapi.GetExitCodeProcess(process_handle)
                )
            except BaseException as exc:
                infrastructure_errors.append(
                    f"GetExitCodeProcess: {type(exc).__name__}: {exc}"
                )
            _close_handle(process_handle)
        if completion_port is not None:
            _close_handle(completion_port)
        if job is not None:
            _close_handle(job)

    pipe_error = next(
        (sink.error for sink in (stdout_sink, stderr_sink) if sink.error), None
    )
    thread_error = "; ".join(thread_errors) if thread_errors else None
    infrastructure_error = (
        "; ".join(dict.fromkeys(infrastructure_errors))
        if infrastructure_errors
        else None
    )
    return {
        "adapter": "windows-job-v1",
        "support": {
            "wall": "enforced",
            "output": "enforced",
            "job_memory": (
                "enforced" if limits.job_memory_bytes is not None else "not-requested"
            ),
            "active_process": (
                "enforced"
                if limits.active_process_limit is not None
                else "not-requested"
            ),
        },
        "stage": "child-sealed",
        "exit_code": exit_code,
        "timed_out": timed_out,
        "memory_limit_hit": memory_limit_hit,
        "process_limit_hit": process_limit_hit,
        "output_limit_hit": stdout_sink.truncated or stderr_sink.truncated,
        "launch_error": launch_error,
        "pipe_error": pipe_error,
        "thread_error": thread_error,
        "infrastructure_error": infrastructure_error,
        "measurements": {
            "wall_ns": time.perf_counter_ns() - started_ns,
            "peak_tree_working_set_bytes": peak_tree_working_set,
            "working_set_unavailable_samples": working_set_unavailable_samples,
            "working_set_complete": working_set_complete,
            "peak_job_commit_bytes": peak_job_commit,
            "sampled_process_peak": sampled_process_peak,
            "process_count": process_count,
            "job_messages": job_messages,
            "thread_count": len(stream_threads),
            "threads_quiesced": not any(
                thread.is_alive() for thread in stream_threads
            ),
        },
        "streams": {
            "stdout": stdout_sink.record(),
            "stderr": stderr_sink.record(),
        },
    }


def run_in_job(
    argv: Sequence[str],
    *,
    cwd: str | os.PathLike[str],
    env: Mapping[str, str] | None,
    stdout_path: str | os.PathLike[str],
    stderr_path: str | os.PathLike[str],
    timeout_seconds: float,
    poll_ms: int = 10,
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

    stdout_file_path = Path(stdout_path)
    stderr_file_path = Path(stderr_path)
    stdout_file_path.parent.mkdir(parents=True, exist_ok=True)
    stderr_file_path.parent.mkdir(parents=True, exist_ok=True)

    job: int | None = None
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
        nonlocal job, process_handle, thread_handle
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
        job = _new_job()

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
            "peak_job_commit_bytes": int(extended.PeakJobMemoryUsed),
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
