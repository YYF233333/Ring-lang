// B-163 C backend — emission context and shared helpers (step 1).
// Mirrors codegen_llvm_ctx.ring, but the "module" is plain C11 source text:
// pure Ring string assembly, ZERO FFI during compilation (plan-c-backend §2.1).
//
// Value representation is UNCHANGED from the LLVM backend:
//   * every Ring value crosses function boundaries as `void*`
//   * Int/Bool are tagged pointers: (value << 1) | 1  (B-080)
//   * Float/Str/List/... are ring_alloc'd heap objects with an
//     [rc:u32 | typeid:u32] header at ptr-8 (Perceus RC)
//   * ring_runtime.cpp C ABI functions are called directly by name.

use types::{Type, EffectRow}
use ast::{Span}

// Per-function registration info (forward-declare pass).
// total_params = ring params + trait-bound dict params + evidence params —
// the exact C prototype arity (clang enforces call-site arity for us).
pub struct CFnInfo {
    pub c_name: Str,
    pub total_params: Int
}

// Struct field layout registration (field ORDER is the C struct layout;
// actual struct emission is step 4 — steps 1-3 only need the registry).
pub struct CStructInfo {
    pub field_names: List<Str>
}

pub struct CCtx {
    // ---- module output sections (assembled by generate_c) ----
    pub globals: List<Str>,     // string-constant byte arrays + const globals
    pub fn_protos: List<Str>,   // Ring function prototypes (decl order)
    pub fn_defs: List<Str>,     // completed function definitions (decl order)

    // ---- current function emission state ----
    // All locals/temps are hoisted to the top of the function (cur_decls) —
    // the C analogue of LLVM entry-block allocas.  This sidesteps every C
    // block-scope pitfall (if/loop bodies assigning result temps, goto over
    // declarations, Ring `let` shadowing).
    pub cur_decls: List<Str>,
    pub cur_body: List<Str>,
    pub used_locals: Set<Str>,
    pub indent: Int,
    pub in_function: Bool,
    pub current_fn_name: Str,

    // ---- counters (module-wide; names stay unique across functions) ----
    pub tmp_counter: Int,
    pub str_counter: Int,
    pub label_counter: Int,

    // ---- registries ----
    pub named_values: Map<Str, Str>,           // ring var name -> C var name
    pub functions: Map<Str, CFnInfo>,          // C mangled name -> info
    pub fn_evidence_params: Map<Str, List<Str>>, // C mangled name -> evidence param names
    pub local_fn_effects: Map<Str, EffectRow>,
    pub fn_mut_params: Map<Str, List<Bool>>,
    pub struct_types: Map<Str, CStructInfo>,
    pub rt_protos: Map<Str, Str>,              // runtime fn name -> full C prototype line
    pub cstr_cache: Map<Str, Str>,             // interned message -> global cstr name
    pub extern_types: Set<Str>,
    pub boxed_vars: Set<Int>,
    pub type_to_typeid: Map<Str, Int>,
    pub next_user_typeid: Int,

    // ---- loop context ----
    // The C statement that implements Ring `continue` for the innermost loop:
    // "continue;" for while loops (cond re-evaluated at the top) or
    // "goto <incr label>;" for for-loops (increment/drop sequence first).
    pub loop_continue_stmt: Str,
    pub in_loop: Bool,

    // ---- #line directives (--no-c-lines disables) ----
    pub emit_lines: Bool,
    pub last_line: Int,
    pub last_file: Str,

    // ---- test decls (#215 parity: no fn main -> C main calls tests) ----
    pub test_fns: List<Str>,
    pub test_emit_idx: Int
}

pub fn new_c_ctx(emit_lines: Bool) -> CCtx {
    CCtx {
        globals: [],
        fn_protos: [],
        fn_defs: [],
        cur_decls: [],
        cur_body: [],
        used_locals: set_new(),
        indent: 1,
        in_function: false,
        current_fn_name: "",
        tmp_counter: 0,
        str_counter: 0,
        label_counter: 0,
        named_values: map_new(),
        functions: map_new(),
        fn_evidence_params: map_new(),
        local_fn_effects: map_new(),
        fn_mut_params: map_new(),
        struct_types: map_new(),
        rt_protos: map_new(),
        cstr_cache: map_new(),
        extern_types: set_new(),
        boxed_vars: set_new(),
        type_to_typeid: map_new(),
        next_user_typeid: 64,
        loop_continue_stmt: "",
        in_loop: false,
        emit_lines: emit_lines,
        last_line: -1,
        last_file: "",
        test_fns: [],
        test_emit_idx: 0
    }
}

// ============================================================
// Name mangling — same scheme as the LLVM backend (ring_<name> /
// ring_<Type>_<method>), sanitized to the portable C identifier set.
// ============================================================

pub fn c_sanitize(name: Str) -> Str {
    let mut parts: List<Str> = []
    for i in 0..name.len() {
        let c = name.char_code_at(i).unwrap_or(95)
        let ok = (c >= 97 && c <= 122) || (c >= 65 && c <= 90) || (c >= 48 && c <= 57) || c == 95
        if ok {
            parts.push(name[i])
        } else {
            // `$` (module mangling / dict instances) and anything else exotic.
            parts.push("_")
        }
    }
    parts.join("")
}

pub fn c_mangle_fn(name: Str) -> Str {
    "ring_${c_sanitize(name)}"
}

pub fn c_mangle_method(type_name: Str, method_name: Str) -> Str {
    "ring_${c_sanitize(type_name)}_${c_sanitize(method_name)}"
}

// ============================================================
// Emission primitives
// ============================================================

fn indent_of(n: Int) -> Str {
    "    ".repeat(n)
}

// Emit one indented statement line into the current function body.
pub fn c_emit(mut ctx: CCtx, line: Str) {
    ctx.cur_body.push("${indent_of(ctx.indent)}${line}")
}

// Emit a raw (column-0) line: labels, #line directives.
pub fn c_raw(mut ctx: CCtx, line: Str) {
    ctx.cur_body.push(line)
}

// Fresh void* temporary — hoisted declaration + returns the name.
pub fn fresh_tmp(mut ctx: CCtx) -> Str {
    let n = ctx.tmp_counter
    ctx.tmp_counter = n + 1
    let name = "t${n}"
    ctx.cur_decls.push("    void* ${name};")
    name
}

// Fresh int64_t temporary (loop counters, unboxed condition flags).
pub fn fresh_i64(mut ctx: CCtx) -> Str {
    let n = ctx.tmp_counter
    ctx.tmp_counter = n + 1
    let name = "i${n}"
    ctx.cur_decls.push("    int64_t ${name};")
    name
}

// Fresh double temporary (unboxed float operands).
pub fn fresh_dbl(mut ctx: CCtx) -> Str {
    let n = ctx.tmp_counter
    ctx.tmp_counter = n + 1
    let name = "d${n}"
    ctx.cur_decls.push("    double ${name};")
    name
}

pub fn fresh_label(mut ctx: CCtx, prefix: Str) -> Str {
    let n = ctx.label_counter
    ctx.label_counter = n + 1
    "__ring_${prefix}_${n}"
}

// Register a Ring local binding: unique C name + hoisted decl + name map.
pub fn c_local(mut ctx: CCtx, ring_name: Str) -> Str {
    let cname = c_unique_local(ctx, ring_name)
    ctx.cur_decls.push("    void* ${cname};")
    ctx.named_values.insert(ring_name, cname)
    cname
}

// Register a Ring parameter: unique C name + name map (declared in the
// function signature, so no hoisted decl).
pub fn c_param(mut ctx: CCtx, ring_name: Str) -> Str {
    let cname = c_unique_local(ctx, ring_name)
    ctx.named_values.insert(ring_name, cname)
    cname
}

fn c_unique_local(mut ctx: CCtx, ring_name: Str) -> Str {
    let base = "r_${c_sanitize(ring_name)}"
    let mut cname = base
    let mut k = 2
    while ctx.used_locals.contains(cname) {
        cname = "${base}_${k}"
        k = k + 1
    }
    ctx.used_locals.insert(cname)
    cname
}

// ============================================================
// String constants — explicit-length byte arrays (binary-safe, no strlen
// dependency in the EMITTED TEXT; plan §2.1: B-155-class corruption becomes
// eyeball-visible in the .c).  Content stays null-terminated to keep the
// ring_str_from_cstr zero-copy convention.
// ============================================================

// Escape one Ring string into a C string-literal body.  Printable ASCII
// passes through; everything else uses fixed-width 3-digit octal escapes
// (unambiguous even when the next source byte is a digit).
pub fn c_escape(s: Str) -> Str {
    let mut parts: List<Str> = []
    for i in 0..s.len() {
        let c = s.char_code_at(i).unwrap_or(0)
        if c == 34 {
            parts.push("\\\"")
        } else if c == 92 {
            parts.push("\\\\")
        } else if c == 10 {
            parts.push("\\n")
        } else if c == 9 {
            parts.push("\\t")
        } else if c == 13 {
            parts.push("\\r")
        } else if c >= 32 && c <= 126 {
            parts.push(s[i])
        } else {
            let hi = c / 64
            let mid = (c / 8) % 8
            let lo = c % 8
            parts.push("\\${hi}${mid}${lo}")
        }
    }
    parts.join("")
}

// Emit a fresh module-level string constant; returns its C name.
// One global per literal occurrence (mirrors the LLVM backend's fresh
// build_global_cstring per gen_str_lit — no dedup, byte-for-byte parity
// of allocation behaviour).
pub fn c_global_cstr(mut ctx: CCtx, s: Str) -> Str {
    let n = ctx.str_counter
    ctx.str_counter = n + 1
    let name = "ring_cstr_${n}"
    ctx.globals.push("static const char ${name}[${s.len() + 1}] = \"${c_escape(s)}\";")
    name
}

// Interned variant for compiler-synthesised messages (panic texts for
// unsupported constructs) — dedupes the potentially hundreds of identical
// stub messages emitted while step 4+ features are not yet ported.
pub fn c_interned_cstr(mut ctx: CCtx, s: Str) -> Str {
    match ctx.cstr_cache.get(s) {
        some(name) => name,
        none => {
            let name = c_global_cstr(ctx, s)
            ctx.cstr_cache.insert(s, name)
            name
        },
    }
}

// ============================================================
// Unsupported-construct stubs (steps 4-8 features reached through prelude
// bodies).  The emitted C compiles fine; executing the statement panics at
// runtime with a precise message.  Golden-subset cases never reach these.
// ============================================================

pub fn c_stub_stmt(mut ctx: CCtx, what: Str) {
    let g = c_interned_cstr(ctx, "ring-c backend: ${what} not implemented yet (B-163 later step)")
    rt_use(ctx, "ring_panic", 1)
    rt_use(ctx, "ring_str_from_cstr", 1)
    c_emit(ctx, "ring_panic(ring_str_from_cstr(${g}));")
}

pub fn c_stub_expr(mut ctx: CCtx, what: Str) -> Str {
    c_stub_stmt(ctx, what)
    "RING_UNIT"
}

// ============================================================
// #line directives — map emitted C back to .ring source (default ON;
// --no-c-lines for human-readable output).
// ============================================================

pub fn c_line_directive(mut ctx: CCtx, span: Span) {
    if ctx.emit_lines == false { return }
    if ctx.in_function == false { return }
    let line = span.start.line
    let file = span.file
    if line == ctx.last_line && file == ctx.last_file { return }
    ctx.last_line = line
    ctx.last_file = file
    let esc = file.replace("\\", "\\\\")
    c_raw(ctx, "#line ${line} \"${esc}\"")
}

// ============================================================
// Perceus RC typeids — same allocator discipline as the LLVM backend
// (codegen_llvm_ctx::get_or_assign_typeid): user types start at 64,
// List/Map keep their fixed runtime typeids.
// ============================================================

pub fn get_or_assign_c_typeid(mut ctx: CCtx, type_name: Str) -> Int {
    match ctx.type_to_typeid.get(type_name) {
        some(id) => id,
        none => {
            if type_name == "List" {
                ctx.type_to_typeid.insert(type_name, 4)
                return 4
            }
            if type_name == "Map" {
                ctx.type_to_typeid.insert(type_name, 5)
                return 5
            }
            let id = ctx.next_user_typeid
            ctx.next_user_typeid = id + 1
            ctx.type_to_typeid.insert(type_name, id)
            id
        },
    }
}

// ============================================================
// Runtime function prototypes.
// rt_use(name, arity) registers the prototype on first use; the assembled
// file prints them sorted by name (deterministic — audit #237 discipline).
// Known signatures are transcribed from codegen_llvm.ring::declare_runtime_fns
// (which in turn matches ring_runtime.cpp's extern "C" definitions).
// Unknown names (user/std `extern fn`s like ring_slot_read) fall back to the
// uniform boxed ABI: all params void*, returns void*.
// ============================================================

pub fn rt_use(mut ctx: CCtx, name: Str, arity: Int) {
    if ctx.rt_protos.contains_key(name) { return }
    let enc = match rt_sig(name) {
        some(s) => s,
        none => {
            let mut ps: List<Str> = []
            for _i in 0..arity { ps.push("p") }
            "${ps.join("")}>p"
        },
    }
    ctx.rt_protos.insert(name, sig_to_proto(name, enc))
}

// Insert a hand-written prototype verbatim (signatures the p/i/d/c encoding
// cannot express, e.g. ring_runtime_init(int, char**)).
pub fn rt_use_raw(mut ctx: CCtx, name: Str, proto: Str) {
    if ctx.rt_protos.contains_key(name) { return }
    ctx.rt_protos.insert(name, proto)
}

// True when `name` is a known ring_runtime.cpp symbol.  A Ring function whose
// mangled name collides with one (std map_new → ring_map_new vs the C++
// bootstrap shim) must be renamed — the LLVM backend gets this for free from
// LLVM's module-level symbol renaming; in C a duplicate definition is a hard
// link error.
pub fn is_runtime_symbol(name: Str) -> Bool {
    match rt_sig(name) {
        some(_) => true,
        none => false,
    }
}

// The declared arity of a known runtime function (used to NULL-pad calls the
// checker allows with fewer args, e.g. sb.line() — mirrors the LLVM backend's
// LLVMCountParams pad in gen_method_call).
pub fn rt_known_arity(name: Str) -> Int? {
    match rt_sig(name) {
        some(s) => {
            match s.index_of(">") {
                some(idx) => some(idx),
                none => none,
            }
        },
        none => none,
    }
}

fn ctype_of(ch: Str) -> Str {
    if ch == "p" { "void*" }
    else if ch == "i" { "int64_t" }
    else if ch == "d" { "double" }
    else if ch == "c" { "const char*" }
    else { "void" }
}

// sig encoding: "<params>><ret>", one char per param: p=void* i=int64_t
// d=double c=const char*; ret additionally v=void.
fn sig_to_proto(name: Str, enc: Str) -> Str {
    let sep = match enc.index_of(">") {
        some(i) => i,
        none => panic("C codegen: bad runtime signature encoding '${enc}' for ${name}"),
    }
    let params_enc = enc.slice(0, sep)
    let ret_enc = enc.slice(sep + 1, enc.len())
    let mut params: List<Str> = []
    for i in 0..params_enc.len() {
        params.push("${ctype_of(params_enc[i])} a${i}")
    }
    let params_str = if params.len() == 0 { "void" } else { params.join(", ") }
    "${ctype_of(ret_enc)} ${name}(${params_str});"
}

// Known runtime signatures (transcribed from declare_runtime_fns; kept in the
// same grouping/order for reviewability).
fn rt_sig(name: Str) -> Str? {
    // Boxing / unboxing
    if name == "ring_box_int" { return some("i>p") }
    if name == "ring_unbox_int" { return some("p>i") }
    if name == "ring_box_float" { return some("d>p") }
    if name == "ring_unbox_float" { return some("p>d") }
    if name == "ring_box_bool" { return some("i>p") }
    if name == "ring_unbox_bool" { return some("p>i") }
    // Str
    if name == "ring_str_from_cstr" { return some("c>p") }
    if name == "ring_str_len" { return some("p>i") }
    if name == "ring_str_concat" { return some("pp>p") }
    if name == "ring_str_eq" { return some("pp>i") }
    if name == "ring_str_lt" { return some("pp>i") }
    if name == "ring_str_get" { return some("pi>p") }
    if name == "ring_str_contains" { return some("pp>i") }
    if name == "ring_str_starts_with" { return some("pp>i") }
    if name == "ring_str_ends_with" { return some("pp>i") }
    if name == "ring_str_slice" { return some("pii>p") }
    if name == "ring_str_split" { return some("pp>p") }
    if name == "ring_str_replace" { return some("ppp>p") }
    if name == "ring_str_trim" { return some("p>p") }
    if name == "ring_str_trim_start" { return some("p>p") }
    if name == "ring_str_trim_end" { return some("p>p") }
    if name == "ring_str_to_upper" { return some("p>p") }
    if name == "ring_str_to_lower" { return some("p>p") }
    if name == "ring_str_char_at" { return some("pi>p") }
    if name == "ring_str_char_code_at" { return some("pi>p") }
    if name == "ring_str_index_of" { return some("pp>p") }
    if name == "ring_str_last_index_of" { return some("pp>p") }
    if name == "ring_str_is_empty" { return some("p>i") }
    if name == "ring_str_pad_start" { return some("pip>p") }
    if name == "ring_str_pad_end" { return some("pip>p") }
    if name == "ring_str_repeat" { return some("pi>p") }
    if name == "ring_str_join" { return some("pp>p") }
    if name == "ring_str_to_cstr" { return some("p>p") }
    // StringBuilder (runtime std::string SB used by string interpolation)
    if name == "ring_sb_new" { return some(">p") }
    if name == "ring_sb_add" { return some("pp>p") }
    if name == "ring_sb_to_str" { return some("p>p") }
    if name == "ring_sb_len" { return some("p>i") }
    if name == "ring_sb_line" { return some("pp>p") }
    if name == "ring_sb_add_int" { return some("pi>p") }
    // Scalar to Str
    if name == "ring_int_to_str" { return some("i>p") }
    if name == "ring_float_to_str" { return some("d>p") }
    if name == "ring_bool_to_str" { return some("i>p") }
    // IO / process
    if name == "ring_print" { return some("p>p") }
    if name == "ring_eprintln" { return some("p>p") }
    if name == "ring_panic" { return some("p>p") }
    if name == "ring_exit" { return some("p>p") }
    if name == "ring_args" { return some(">p") }
    if name == "ring_cwd" { return some(">p") }
    // Memory / RC
    if name == "ring_alloc" { return some("ii>p") }
    if name == "ring_dup" { return some("p>v") }
    if name == "ring_drop" { return some("p>v") }
    if name == "ring_register_drop" { return some("ip>v") }
    if name == "ring_register_never_drop" { return some("i>v") }
    if name == "ring_const_intern" { return some("p>p") }
    if name == "ring_unit_intern" { return some("p>p") }
    // List
    if name == "ring_list_new" { return some(">p") }
    if name == "ring_list_push" { return some("pp>p") }
    if name == "ring_list_get" { return some("pi>p") }
    if name == "ring_list_len" { return some("p>i") }
    if name == "ring_list_join" { return some("pp>p") }
    if name == "ring_list_concat" { return some("pp>p") }
    if name == "ring_list_slice" { return some("pii>p") }
    if name == "ring_list_reverse" { return some("p>p") }
    if name == "ring_list_sort" { return some("pp>p") }
    if name == "ring_list_pop" { return some("p>p") }
    if name == "ring_list_is_empty" { return some("p>i") }
    if name == "ring_list_first" { return some("p>p") }
    if name == "ring_list_last" { return some("p>p") }
    if name == "ring_list_map" { return some("pp>p") }
    if name == "ring_list_filter" { return some("pp>p") }
    if name == "ring_list_for_each" { return some("pp>p") }
    if name == "ring_list_set" { return some("pip>p") }
    if name == "ring_list_any" { return some("pp>i") }
    if name == "ring_list_all" { return some("pp>i") }
    if name == "ring_list_find" { return some("pp>p") }
    if name == "ring_list_flat_map" { return some("pp>p") }
    if name == "ring_list_shift" { return some("p>p") }
    if name == "ring_list_clear" { return some("p>p") }
    if name == "ring_list_extend" { return some("pp>p") }
    // Map
    if name == "ring_map_new" { return some(">p") }
    if name == "ring_map_get" { return some("pp>p") }
    if name == "ring_map_get_opt" { return some("pp>p") }
    if name == "ring_map_set" { return some("ppp>p") }
    if name == "ring_map_has" { return some("pp>i") }
    if name == "ring_map_delete" { return some("pp>p") }
    if name == "ring_map_keys" { return some("p>p") }
    if name == "ring_map_values" { return some("p>p") }
    if name == "ring_map_entries" { return some("p>p") }
    if name == "ring_map_len" { return some("p>i") }
    if name == "ring_map_is_empty" { return some("p>i") }
    if name == "ring_map_for_each" { return some("pp>p") }
    if name == "ring_map_fold" { return some("ppp>p") }
    if name == "ring_map_filter" { return some("pp>p") }
    if name == "ring_map_any" { return some("pp>i") }
    if name == "ring_map_map_values" { return some("pp>p") }
    if name == "ring_map_clone" { return some("p>p") }
    if name == "ring_map_from" { return some("p>p") }
    if name == "ring_map_clear" { return some("p>p") }
    // Map<Int>
    if name == "ring_map_int_new" { return some(">p") }
    if name == "ring_map_int_get" { return some("pp>p") }
    if name == "ring_map_int_get_opt" { return some("pp>p") }
    if name == "ring_map_int_set" { return some("ppp>p") }
    if name == "ring_map_int_has" { return some("pp>i") }
    if name == "ring_map_int_delete" { return some("pp>p") }
    if name == "ring_map_int_keys" { return some("p>p") }
    if name == "ring_map_int_values" { return some("p>p") }
    if name == "ring_map_int_entries" { return some("p>p") }
    if name == "ring_map_int_len" { return some("p>i") }
    if name == "ring_map_int_is_empty" { return some("p>i") }
    if name == "ring_map_int_for_each" { return some("pp>p") }
    if name == "ring_map_int_clone" { return some("p>p") }
    if name == "ring_map_int_from" { return some("p>p") }
    if name == "ring_map_int_clear" { return some("p>p") }
    if name == "ring_map_int_fold" { return some("ppp>p") }
    if name == "ring_map_int_filter" { return some("pp>p") }
    if name == "ring_map_int_any" { return some("pp>i") }
    if name == "ring_map_int_map_values" { return some("pp>p") }
    // Set
    if name == "ring_set_new" { return some(">p") }
    if name == "ring_set_add" { return some("pp>p") }
    if name == "ring_set_has" { return some("pp>i") }
    if name == "ring_set_delete" { return some("pp>p") }
    if name == "ring_set_to_list" { return some("p>p") }
    if name == "ring_set_len" { return some("p>i") }
    if name == "ring_set_is_empty" { return some("p>i") }
    if name == "ring_set_from_list" { return some("p>p") }
    if name == "ring_set_for_each" { return some("pp>p") }
    if name == "ring_set_fold" { return some("ppp>p") }
    if name == "ring_set_filter" { return some("pp>p") }
    if name == "ring_set_any" { return some("pp>i") }
    if name == "ring_set_all" { return some("pp>i") }
    if name == "ring_set_union" { return some("pp>p") }
    if name == "ring_set_intersect" { return some("pp>p") }
    if name == "ring_set_difference" { return some("pp>p") }
    if name == "ring_set_clear" { return some("p>p") }
    if name == "ring_set_clone" { return some("p>p") }
    // Set<Int>
    if name == "ring_set_int_new" { return some(">p") }
    if name == "ring_set_int_add" { return some("pp>p") }
    if name == "ring_set_int_has" { return some("pp>i") }
    if name == "ring_set_int_delete" { return some("pp>p") }
    if name == "ring_set_int_to_list" { return some("p>p") }
    if name == "ring_set_int_len" { return some("p>i") }
    if name == "ring_set_int_is_empty" { return some("p>i") }
    if name == "ring_set_int_from_list" { return some("p>p") }
    if name == "ring_set_int_for_each" { return some("pp>p") }
    if name == "ring_set_int_clone" { return some("p>p") }
    if name == "ring_set_int_union" { return some("pp>p") }
    if name == "ring_set_int_intersect" { return some("pp>p") }
    if name == "ring_set_int_difference" { return some("pp>p") }
    if name == "ring_set_int_clear" { return some("p>p") }
    if name == "ring_set_int_fold" { return some("ppp>p") }
    if name == "ring_set_int_filter" { return some("pp>p") }
    if name == "ring_set_int_any" { return some("pp>i") }
    if name == "ring_set_int_all" { return some("pp>i") }
    // Catch / raise (setjmp-based; used from step 6 on, listed for parity)
    if name == "ring_catch_push" { return some(">p") }
    if name == "ring_catch_get_buf" { return some("p>p") }
    if name == "ring_catch_pop" { return some(">v") }
    if name == "ring_catch_get_error" { return some("p>p") }
    if name == "ring_raise" { return some("p>v") }
    if name == "__ring_raise_fail" { return some("p>p") }
    // File IO / path
    if name == "ring_read_file" { return some("p>p") }
    if name == "ring_write_file" { return some("pp>p") }
    if name == "ring_file_exists" { return some("p>p") }
    if name == "ring_delete_file" { return some("p>p") }
    if name == "ring_path_join" { return some("pp>p") }
    if name == "ring_path_resolve" { return some("p>p") }
    if name == "ring_path_dirname" { return some("p>p") }
    if name == "ring_path_basename" { return some("p>p") }
    if name == "ring_path_extname" { return some("p>p") }
    // Parse
    if name == "ring_parse_int" { return some("p>p") }
    if name == "ring_parse_float" { return some("p>p") }
    // Misc
    if name == "ring_assert" { return some("ip>p") }
    if name == "ring_json_stringify" { return some("p>p") }
    if name == "ring_match_fail" { return some("piip>p") }
    // Option
    if name == "ring_Option_unwrap_or" { return some("pp>p") }
    if name == "ring_Option_unwrap" { return some("p>p") }
    if name == "ring_Option_is_some" { return some("p>i") }
    if name == "ring_Option_is_none" { return some("p>i") }
    if name == "ring_Option_map" { return some("pp>p") }
    if name == "ring_Option_and_then" { return some("pp>p") }
    if name == "ring_Option_unwrap_or_else" { return some("pp>p") }
    if name == "ring_Option_to_fail" { return some("pp>p") }
    if name == "ring_Option_none" { return some(">p") }
    // Cell
    if name == "ring_Cell_new" { return some("p>p") }
    if name == "ring_Cell_get" { return some("p>p") }
    if name == "ring_Cell_set" { return some("pp>p") }
    if name == "ring_Cell_update" { return some("pp>p") }
    // B-125 Ptr<T> primitives
    if name == "ring_raw_alloc" { return some("p>p") }
    if name == "ring_raw_dealloc" { return some("pp>v") }
    if name == "ring_ptr_copy" { return some("ppp>v") }
    none
}
