use ast::{Program}
use hir::{HProgram}
use diagnostics::{CollectingSink, Diagnostic, new_collecting_sink}
use formatter::{format_human, format_llm}
use checker::{CheckResult, check as check_single}
use codegen_c::{generate_c}
use compiler_mod::{compile_project, compile_project_c, verify_project_rc}
use parser::{parse}
use perceus::{perceus_transform, perceus_transform_mutated}
use verify_rc::{verify_rc_program, rc_fatal_count, format_rc_findings}
use phase_timing::{new_phase_timing}

pub fn cli_main() {
    let args = argv()
    let parsed = parse_cli_args(args)
    let mut timing = new_phase_timing(
        parsed.phase_timing_file, parsed.phase_timing_lane,
        parsed.phase_timing_compiler, parsed.phase_timing_source,
        parsed.file)

    if parsed.target != "c" {
        eprintln("Error: unsupported code generation target '${parsed.target}'; this compiler supports only '--target=c'.")
        timing.skip_phase("input_entry_load")
        timing.skip_phase("entry_parse")
        timing.skip_phase("project_module_load_parse")
        timing.skip_phase("type_effect_check_lower")
        timing.skip_phase("resource_plan_verify")
        timing.finish_command(false)
        exit_process(1)
        return
    }

    if parsed.command == "help" || parsed.command == "" {
        usage()
        timing.skip_phase("input_entry_load")
        timing.skip_phase("entry_parse")
        timing.skip_phase("project_module_load_parse")
        timing.skip_phase("type_effect_check_lower")
        timing.skip_phase("resource_plan_verify")
        timing.finish_command(true)
        return
    }

    if parsed.command == "lsp" {
        // LSP not yet supported in Ring bootstrap
        eprintln("LSP mode not available in Ring compiler")
        timing.skip_phase("input_entry_load")
        timing.skip_phase("entry_parse")
        timing.skip_phase("project_module_load_parse")
        timing.skip_phase("type_effect_check_lower")
        timing.skip_phase("resource_plan_verify")
        timing.finish_command(false)
        exit_process(1)
        return
    }

    if parsed.file == "" {
        eprintln("Error: no input file specified.")
        timing.skip_phase("input_entry_load")
        timing.skip_phase("entry_parse")
        timing.skip_phase("project_module_load_parse")
        timing.skip_phase("type_effect_check_lower")
        timing.skip_phase("resource_plan_verify")
        timing.finish_command(false)
        exit_process(1)
        return
    }

    let input_start = timing.start_phase()
    let file_path = path_resolve(parsed.file)
    timing.set_entry_file(file_path)
    if file_exists(file_path) == false {
        eprintln("Error: file not found: ${file_path}")
        timing.finish_phase("input_entry_load", input_start)
        timing.skip_phase("entry_parse")
        timing.skip_phase("project_module_load_parse")
        timing.skip_phase("type_effect_check_lower")
        timing.skip_phase("resource_plan_verify")
        timing.finish_command(false)
        exit_process(1)
        return
    }

    let source = read_file(file_path)
    timing.finish_phase("input_entry_load", input_start)
    let parse_start = timing.start_phase()
    let parse_sink = new_collecting_sink()
    let ast = parse(source, file_path, parse_sink)
    timing.finish_phase("entry_parse", parse_start)

    if parse_sink.has_errors() {
        let diagnostics = parse_sink.items
        if parsed.error_format == "llm" {
            print(format_llm(diagnostics, file_path))
        } else {
            eprintln(format_human(diagnostics, source))
        }
        // Production behavior stays fail-fast. Debug mode additionally exposes
        // parser recovery state and checks the recovered AST so recovery
        // regressions can be asserted through the native CLI.
        if parsed.debug {
            eprintln("[debug] parse-recovery decls=${ast.decls.len()}")
            let recovery_sink = new_collecting_sink()
            let recovery_result = check_single(ast, recovery_sink)
            if recovery_sink.items.len() > 0 {
                if parsed.error_format == "llm" {
                    eprintln(format_llm(recovery_sink.items, file_path))
                } else {
                    eprintln(format_human(recovery_sink.items, source))
                }
            }
        }
        timing.skip_phase("project_module_load_parse")
        timing.skip_phase("type_effect_check_lower")
        timing.skip_phase("resource_plan_verify")
        timing.finish_command(false)
        exit_process(1)
        return
    }

    // Multi-file mode
    if ast.uses.len() > 0 {
        // B-104 D2: static RC leak/UAF verification (post-perceus HIR linear
        // check; --verify-rc on the `check` command).  Runs the same per-module
        // perceus_transform as native compilation, then verify_rc_program.
        if parsed.command == "check" && (parsed.verify_rc || parsed.verify_strict) {
            let res = verify_project_rc(
                file_path, parsed.rc_mutate, parsed.verify_strict,
                parsed.error_format, timing)
            if res.success == false {
                eprintln("Compilation failed")
                timing.skip_phase("resource_plan_verify")
                timing.finish_command(false)
                exit_process(1)
                return
            }
            print(res.report)
            if res.fatal > 0 || (parsed.verify_strict && res.exempt > 0) {
                timing.finish_command(false)
                exit_process(1)
            } else {
                print("OK")
                timing.finish_command(true)
            }
            return
        }
        if parsed.command == "check" {
            let result = compile_project(file_path, parsed.error_format, timing)
            timing.skip_phase("resource_plan_verify")
            if result.success {
                print("OK")
                timing.finish_command(true)
            } else {
                eprintln("Compilation failed")
                timing.finish_command(false)
                exit_process(1)
            }
        } else {
            if parsed.command == "build" {
                let out_dir = path_resolve(parsed.out_dir)
                // Multi-file (project) C emission: both the .c and the
                // clang-compiled .o land in out_dir.
                let base = path_basename(file_path).replace(".ring", "")
                let c_path = path_join(out_dir, "${base}.c")
                let o_path = path_join(out_dir, "${base}.o")
                let c_result = compile_project_c(
                    file_path, c_path, o_path, parsed.c_lines,
                    parsed.error_format, timing)
                if c_result.success {
                    // success message printed by generate_c_project
                    timing.finish_command(true)
                } else {
                    eprintln("Compilation failed")
                    timing.skip_phase("resource_plan_verify")
                    timing.finish_command(false)
                    exit_process(1)
                }
                return
            } else {
                eprintln("Only 'build' and 'check' commands are supported")
                timing.skip_phase("project_module_load_parse")
                timing.skip_phase("type_effect_check_lower")
                timing.skip_phase("resource_plan_verify")
                timing.finish_command(false)
                exit_process(1)
            }
        }
        return
    }

    // Single-file mode
    timing.skip_phase("project_module_load_parse")
    let check_start = timing.start_phase()
    let sink = new_collecting_sink()
    let check_result = check_single(ast, sink)
    timing.finish_phase("type_effect_check_lower", check_start)

    if sink.has_errors() {
        let diagnostics = sink.items
        if parsed.error_format == "llm" {
            print(format_llm(diagnostics, file_path))
        } else {
            eprintln(format_human(diagnostics, source))
        }
        timing.skip_phase("resource_plan_verify")
        timing.finish_command(false)
        exit_process(1)
        return
    }

    // Surface warnings (non-error diagnostics) even on success — to stderr,
    // so stdout keeps its success contract ("OK" / "Compiled: ...") and the
    // exit code is unchanged. Includes parser warnings (e.g. W0002 refinement
    // 'where' clause) and checker warnings (e.g. W0001 catch on pure expr).
    let mut warning_diags: List<Diagnostic> = []
    for d in parse_sink.items { warning_diags.push(d) }
    for d in sink.items { warning_diags.push(d) }
    if warning_diags.len() > 0 {
        if parsed.error_format == "llm" {
            eprintln(format_llm(warning_diags, file_path))
        } else {
            eprintln(format_human(warning_diags, source))
        }
    }

    // B-104 D2: single-file --verify-rc (see the multi-file branch above).
    if parsed.command == "check" && (parsed.verify_rc || parsed.verify_strict) {
        let resource_start = timing.start_phase()
        let rc_program = perceus_transform_mutated(check_result.program, parsed.rc_mutate)
        let findings = verify_rc_program(rc_program)
        let fatal = rc_fatal_count(findings)
        let exempt = findings.len() - fatal
        timing.finish_phase("resource_plan_verify", resource_start)
        print(format_rc_findings(findings, parsed.verify_strict))
        if fatal > 0 || (parsed.verify_strict && exempt > 0) {
            timing.finish_command(false)
            exit_process(1)
        } else {
            print("OK")
            timing.finish_command(true)
        }
        return
    }

    if parsed.command == "check" {
        timing.skip_phase("resource_plan_verify")
        print("OK")
        timing.finish_command(true)
    } else {
        if parsed.command == "build" {
            let resource_start = timing.start_phase()
            let rc_program = perceus_transform(check_result.program)
            timing.finish_phase("resource_plan_verify", resource_start)
            // Emit <name>.c, then shell out clang -c → <name>.o.
            // --out-dir redirects both artifacts when explicitly given;
            // the default places them next to the source.
            let base = path_basename(file_path).replace(".ring", "")
            let c_path = if parsed.out_dir_set {
                path_join(path_resolve(parsed.out_dir), "${base}.c")
            } else {
                file_path.replace(".ring", ".c")
            }
            let o_path = if parsed.out_dir_set {
                path_join(path_resolve(parsed.out_dir), "${base}.o")
            } else {
                file_path.replace(".ring", ".o")
            }
            generate_c(rc_program, c_path, o_path, parsed.c_lines)
            timing.finish_command(true)
        } else {
            eprintln("Only 'build' and 'check' commands are supported")
            timing.skip_phase("resource_plan_verify")
            timing.finish_command(false)
            exit_process(1)
        }
    }
}

// ============================================================
// Argument parsing
// ============================================================

struct CliArgs {
    command: Str,
    file: Str,
    debug: Bool,
    error_format: Str,
    out_dir: Str,
    out_dir_set: Bool,
    target: Str,
    c_lines: Bool,
    verify_rc: Bool,
    verify_strict: Bool,
    rc_mutate: Str,
    phase_timing_file: Str,
    phase_timing_lane: Str,
    phase_timing_compiler: Str,
    phase_timing_source: Str
}

fn normalize_cli_args(args: List<Str>) -> List<Str> {
    let mut result: List<Str> = []
    let mut i = 0
    while i < args.len() {
        let arg = args[i]
        if (arg == "--error-format" || arg == "--out-dir" || arg == "--target" ||
            arg == "--rc-mutate" || arg == "--phase-timing" ||
            arg == "--phase-timing-lane" || arg == "--phase-timing-compiler" ||
            arg == "--phase-timing-source") && i + 1 < args.len() {
            result.push("${arg}=${args[i + 1]}")
            i = i + 2
        } else {
            result.push(arg)
            i = i + 1
        }
    }
    result
}

fn parse_cli_args(raw_args: List<Str>) -> CliArgs {
    let args = normalize_cli_args(raw_args)
    let mut debug = false
    let mut error_format = "human"
    let mut out_dir = "dist"
    let mut out_dir_set = false
    let mut target = "c"
    let mut c_lines = true
    let mut verify_rc = false
    let mut verify_strict = false
    let mut rc_mutate = ""
    let mut phase_timing_file = ""
    let mut phase_timing_lane = ""
    let mut phase_timing_compiler = ""
    let mut phase_timing_source = ""
    let mut positional: List<Str> = []

    for arg in args {
        if arg == "--debug" {
            debug = true
        } else {
            if arg == "--verify-rc" {
                verify_rc = true
            } else {
                if arg == "--verify-rc-strict" {
                    verify_strict = true
                } else {
                    if arg == "--no-c-lines" {
                        // B-163: suppress #line directives in --target=c output
                        // (human-readable generated C; default keeps them so
                        // sanitizer/debugger reports point at .ring sources).
                        c_lines = false
                    } else {
                    if arg.starts_with("--rc-mutate=") {
                        // TEST-ONLY (B-104 D2 negative tests): degrade the RC
                        // pipeline so the verifier's detection can be asserted.
                        rc_mutate = arg.slice(12, arg.len())
                    } else {
                        if arg.starts_with("--phase-timing=") {
                            phase_timing_file = arg.slice(15, arg.len())
                        } else {
                        if arg.starts_with("--phase-timing-lane=") {
                            phase_timing_lane = arg.slice(20, arg.len())
                        } else {
                        if arg.starts_with("--phase-timing-compiler=") {
                            phase_timing_compiler = arg.slice(24, arg.len())
                        } else {
                        if arg.starts_with("--phase-timing-source=") {
                            phase_timing_source = arg.slice(22, arg.len())
                        } else {
                        if arg.starts_with("--error-format=") {
                            error_format = arg.slice(15, arg.len())
                        } else {
                            if arg.starts_with("--out-dir=") {
                                out_dir = arg.slice(10, arg.len())
                                out_dir_set = true
                            } else {
                                if arg.starts_with("--target=") {
                                    target = arg.slice(9, arg.len())
                                } else {
                                    positional.push(arg)
                                }
                            }
                        }
                        }
                        }
                        }
                        }
                    }
                    }
                }
            }
        }
    }

    let command = match positional.get(0) { some(c) => c, none => "help" }
    let file = match positional.get(1) { some(f) => f, none => "" }

    CliArgs {
        command: command,
        file: file,
        debug: debug,
        error_format: error_format,
        out_dir: out_dir,
        out_dir_set: out_dir_set,
        target: target,
        c_lines: c_lines,
        verify_rc: verify_rc,
        verify_strict: verify_strict,
        rc_mutate: rc_mutate,
        phase_timing_file: phase_timing_file,
        phase_timing_lane: phase_timing_lane,
        phase_timing_compiler: phase_timing_compiler,
        phase_timing_source: phase_timing_source
    }
}

fn usage() {
    print("Ring-lang compiler v0.1.0 (Ring bootstrap)")
    print("")
    print("Usage:")
    print("  ring build <file.ring>    Compile to native .o file")
    print("  ring check <file.ring>    Type-check only")
    print("  ring help                 Show this help")
    print("")
    print("Options:")
    print("  --debug                   Print intermediate info")
    print("  --error-format=human|llm  Error output format (default: human)")
    print("  --out-dir=<path>          Output directory (default: dist)")
    print("  --target=c                Code generation target (default: c)")
    print("  --no-c-lines              Omit #line directives from the generated C")
    print("  --verify-rc               (check) static RC leak/UAF verification of the post-RC HIR")
    print("  --verify-rc-strict        like --verify-rc, but documented-exempt findings also fail")
}
