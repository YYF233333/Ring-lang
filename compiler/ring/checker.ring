use types::{Type, UNIT}
use ast::{Program, UseDecl}
use hir::{HProgram}
use diagnostics::{CollectingSink, new_collecting_sink}
use env::{TypeEnv, new_type_env}
use builtins::{register_builtins, register_hof_intrinsics}
use infer::{check as infer_check}
use infer_ctx::{InferCtx, FnBoundsEntry, empty_fn_bounds}
use infer_register::{register_decl_public}
use parser::{parse}
use unify::{empty_subst}

pub struct CheckResult {
    pub program: HProgram,
    pub env: TypeEnv
}

fn STD_FILES() -> List<Str> {
    ["io.ring", "list.ring", "map.ring", "set.ring", "str.ring", "num.ring", "fs.ring", "path.ring", "process.ring"]
}

fn find_std_dir() -> Str? {
    let candidates = [
        path_resolve(path_join(path_dirname(path_resolve(".")), "std")),
        path_resolve("std")
    ]
    for dir in candidates {
        if file_exists(dir) { return some(dir) }
    }
    none
}

fn load_prelude(var ctx: InferCtx) {
    match find_std_dir() {
        some(std_dir) => {
            for file in STD_FILES() {
                let file_path = path_join(std_dir, file)
                if file_exists(file_path) {
                    let source = read_file(file_path)
                    let ast = parse(source, file_path)
                    for decl in ast.decls {
                        register_decl_public(ctx, decl)
                    }
                }
            }
        },
        none => {},
    }
}

fn new_infer_ctx(sink: CollectingSink) -> InferCtx {
    var env = new_type_env()
    register_builtins(env)
    register_hof_intrinsics(env)

    var fn_bounds_stack = empty_fn_bounds_stack()

    InferCtx {
        env: env,
        subst: empty_subst(),
        sink: sink,
        type_param_scope: map_new(),
        current_fn_return_type: none,
        current_fn_bounds: empty_fn_bounds(),
        fn_bounds_stack: fn_bounds_stack,
        loop_depth: 0
    }
}

fn empty_fn_bounds_stack() -> List<List<FnBoundsEntry>> {
    let x = [empty_fn_bounds()]; x.clear(); x
}

pub fn check(program: Program, sink: CollectingSink) -> CheckResult {
    var ctx = new_infer_ctx(sink)
    load_prelude(ctx)
    let hprogram = infer_check(ctx, program)
    CheckResult { program: hprogram, env: ctx.env }
}
