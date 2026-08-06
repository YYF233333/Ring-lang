// Compiler-internal, opt-in phase timing for B-176 benchmark evidence.
// This is deliberately not part of std: normal Ring programs do not gain a
// clock API, and the compiler does not touch the clock or filesystem unless a
// phase-timing output path was explicitly supplied.

extern fn ring_bench_monotonic_ns() -> Int

struct PhaseTimingRow {
    phase: Str,
    duration_ns: Int,
    executed: Bool,
    complete: Bool
}

pub struct PhaseTiming {
    pub enabled: Bool,
    output_path: Str,
    lane: Str,
    compiler_identity: Str,
    source_identity: Str,
    entry_file: Str,
    command_start_ns: Int,
    integrity: Bool,
    next_phase: Int,
    finalized: Bool,
    rows: List<PhaseTimingRow>
}

pub fn new_phase_timing(
    output_path: Str, lane: Str, compiler_identity: Str,
    source_identity: Str, entry_file: Str
) -> PhaseTiming {
    // Keep the default compiler path allocation-free apart from the inert
    // recorder value itself: no identity defaults, path interpolation, clock,
    // or filesystem work is performed when timing was not requested.
    if output_path.len() == 0 {
        return PhaseTiming {
            enabled: false,
            output_path: "",
            lane: "",
            compiler_identity: "",
            source_identity: "",
            entry_file: "",
            command_start_ns: 0,
            integrity: true,
            next_phase: 0,
            finalized: false,
            rows: []
        }
    }
    let actual_lane = if lane.len() > 0 { lane } else { "manual" }
    let actual_compiler = if compiler_identity.len() > 0 {
        compiler_identity
    } else {
        "ring-bootstrap-v0.1.0"
    }
    let actual_entry = if entry_file.len() > 0 {
        path_resolve(entry_file)
    } else {
        ""
    }
    let actual_source = if source_identity.len() > 0 {
        source_identity
    } else {
        "path:${actual_entry}"
    }
    PhaseTiming {
        enabled: true,
        output_path: output_path,
        lane: actual_lane,
        compiler_identity: actual_compiler,
        source_identity: actual_source,
        entry_file: actual_entry,
        command_start_ns: ring_bench_monotonic_ns(),
        integrity: true,
        next_phase: 0,
        finalized: false,
        rows: []
    }
}

fn phase_timing_phase(index: Int) -> Str {
    if index == 0 { return "input_entry_load" }
    if index == 1 { return "entry_parse" }
    if index == 2 { return "project_module_load_parse" }
    if index == 3 { return "type_effect_check_lower" }
    if index == 4 { return "resource_plan_verify" }
    "<invalid-phase>"
}

impl PhaseTiming {
    pub fn set_entry_file(mut self, entry_file: Str) {
        if self.enabled { self.entry_file = entry_file }
    }

    pub fn start_phase(self) -> Int {
        if self.enabled { ring_bench_monotonic_ns() } else { 0 }
    }

    fn record_phase(
        mut self, phase: Str, duration_ns: Int, executed: Bool,
        phase_complete: Bool
    ) {
        if self.enabled == false { return }
        if self.finalized || self.next_phase >= 5 ||
            phase != phase_timing_phase(self.next_phase) {
            // Do not append the bad transition: finalization will emit a
            // canonical six-row trace, but every row will be incomplete. This
            // exposes duplicate/out-of-order/missing instrumentation instead
            // of normalizing it into apparently valid evidence.
            self.integrity = false
            return
        }
        if phase_complete == false { self.integrity = false }
        self.rows.push(PhaseTimingRow {
            phase: phase,
            duration_ns: duration_ns,
            executed: executed,
            complete: phase_complete
        })
        self.next_phase = self.next_phase + 1
    }

    pub fn finish_phase(mut self, phase: Str, start_ns: Int) {
        if self.enabled == false { return }
        let end_ns = ring_bench_monotonic_ns()
        let monotonic = end_ns >= start_ns
        let duration_ns = if monotonic { end_ns - start_ns } else { 0 }
        self.record_phase(phase, duration_ns, true, monotonic)
    }

    pub fn skip_phase(mut self, phase: Str) {
        if self.enabled == false { return }
        self.record_phase(phase, 0, false, true)
    }

    // Completeness is derived exclusively from recorder integrity and canonical
    // phase coverage. Compiler success is an independent outcome bit.
    pub fn finish_command(mut self, command_success: Bool) {
        if self.enabled == false { return }
        if self.finalized {
            self.integrity = false
            return
        }
        self.finalized = true
        if self.next_phase != 5 { self.integrity = false }
        while self.next_phase < 5 {
            self.rows.push(PhaseTimingRow {
                phase: phase_timing_phase(self.next_phase),
                duration_ns: 0,
                executed: false,
                complete: false
            })
            self.next_phase = self.next_phase + 1
        }
        let end_ns = ring_bench_monotonic_ns()
        let monotonic = end_ns >= self.command_start_ns
        let duration_ns = if monotonic { end_ns - self.command_start_ns } else { 0 }
        let trace_complete = self.integrity && monotonic
        self.rows.push(PhaseTimingRow {
            phase: "command_total",
            duration_ns: duration_ns,
            executed: true,
            complete: trace_complete
        })

        let mut lines: List<Str> = []
        for row in self.rows {
            lines.push(phase_timing_json_line(
                self, row, trace_complete, command_success))
        }
        write_file(self.output_path, "${lines.join("\n")}\n")
    }
}

fn json_bool(value: Bool) -> Str {
    if value { "true" } else { "false" }
}

fn phase_timing_json_line(
    timing: PhaseTiming, row: PhaseTimingRow, trace_complete: Bool,
    command_success: Bool
) -> Str {
    let lane = json_stringify(timing.lane)
    let phase = json_stringify(row.phase)
    let compiler_identity = json_stringify(timing.compiler_identity)
    let source_identity = json_stringify(timing.source_identity)
    let entry_file = json_stringify(timing.entry_file)
    let executed = json_bool(row.executed)
    let complete = json_bool(trace_complete && row.complete)
    let success = json_bool(command_success)
    "{\"schema\":\"ring.compiler-phase-timing.v1\",\"schema_version\":1,\"lane\":${lane},\"phase\":${phase},\"duration_ns\":${row.duration_ns},\"unit\":\"ns\",\"compiler_identity\":${compiler_identity},\"source_identity\":${source_identity},\"entry_file\":${entry_file},\"executed\":${executed},\"complete\":${complete},\"command_success\":${success}}"
}
