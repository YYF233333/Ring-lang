// Ring-lang end-to-end compiler tests
// Runs the full pipeline: parse → check → codegen → execute
// P0 optimization: in-process compilation + vm execution (no child process per test)

import { test, describe } from "node:test";
import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as vm from "node:vm";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { Parser } from "../compiler/dist/parser/parser.js";
import { check } from "../compiler/dist/checker/checker.js";
import { generate } from "../compiler/dist/codegen/codegen.js";
import { CollectingSink } from "../compiler/dist/diagnostics/index.js";
import { format_llm } from "../compiler/dist/diagnostics/formatter.js";
import { compile_project, compile_project_esm } from "../compiler/dist/modules/compiler.js";
import { CompileError } from "../compiler/dist/errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = __dirname.includes("dist")
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "..");
const CASES_DIR = path.resolve(REPO_ROOT, "tests/cases");
const MODULES_DIR = path.resolve(REPO_ROOT, "tests/cases/modules");

// ============================================================
// In-process runtime: strip ESM imports, provide Node globals via vm
// ============================================================

class ExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

function make_sandbox(output_lines: string[]): vm.Context {
  const sandbox = {
    console: {
      log: (...args: unknown[]) => {
        output_lines.push(args.map(a => typeof a === "string" ? a : String(a)).join(" "));
      },
      error: () => {},
      warn: () => {},
    },
    process: {
      exit: (code: number) => { throw new ExitError(code); },
      argv: ["node", "test"],
      cwd: () => process.cwd(),
      stderr: { write: () => {} },
    },
    JSON,
    Map,
    Set,
    Array,
    Object,
    Error,
    String,
    Number,
    Boolean,
    RegExp,
    Symbol,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Infinity,
    NaN,
    undefined,
    Math,
    __fs: fs,
    __path: path,
  };
  return vm.createContext(sandbox);
}

function strip_esm_lines(js: string): string {
  return js
    .replace(/^import \{[^\n]*\n/m, "")
    .replace(/^const __require[^\n]*\n/m, "")
    .replace(/var __fs = __require\("fs"\), __path = __require\("path"\);/, "");
}

function run_js_in_vm(js_code: string): string {
  const output_lines: string[] = [];
  const ctx = make_sandbox(output_lines);
  const script = new vm.Script(js_code, { filename: "ring-output.js", timeout: 5000 });
  script.runInContext(ctx);
  return output_lines.length > 0 ? output_lines.join("\n") + "\n" : "";
}

// ============================================================
// In-process compile helpers
// ============================================================

interface RunResult {
  output: string;
}

interface CheckFailure {
  diagnostics_text: string;
}

function ring_run_single(file_path: string): RunResult {
  const source = fs.readFileSync(file_path, "utf-8");
  const sink = new CollectingSink();
  const ast = Parser.parse(source, file_path, sink);
  if (sink.has_errors()) {
    throw new Error(`Parse error: ${[...sink.diagnostics()].map(d => d.message).join("; ")}`);
  }
  const { program: hir } = check(ast, sink);
  if ([...sink.diagnostics()].some(d => d.severity === "error")) {
    throw new Error(`Type error: ${[...sink.diagnostics()].filter(d => d.severity === "error").map(d => d.message).join("; ")}`);
  }
  const js = generate(hir);
  const output = run_js_in_vm(strip_esm_lines(js));
  return { output };
}

function ring_run_multi(file_path: string): RunResult {
  const tmp_dir = fs.mkdtempSync(path.join(REPO_ROOT, "tests/.tmp_esm_"));
  try {
    const sink = new CollectingSink();
    const result = compile_project_esm(file_path, tmp_dir, sink);
    if (!result.success) {
      throw new Error(`Compile error: ${result.diagnostics.map(d => d.message).join("; ")}`);
    }
    const output = execSync(`node "${result.entry_js_path}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 10000,
    });
    return { output };
  } finally {
    fs.rmSync(tmp_dir, { recursive: true, force: true });
  }
}

function ring_run(file_path: string): RunResult {
  const source = fs.readFileSync(file_path, "utf-8");
  const sink = new CollectingSink();
  const ast = Parser.parse(source, file_path, sink);
  if (ast.uses.length > 0) {
    return ring_run_multi(file_path);
  }
  return ring_run_single(file_path);
}

function ring_check(file_path: string): { success: boolean; error_output: string } {
  const source = fs.readFileSync(file_path, "utf-8");
  const sink = new CollectingSink();
  try {
    const ast = Parser.parse(source, file_path, sink);
    if (sink.has_errors()) {
      const text = [...sink.diagnostics()].map(d => `${d.code}: ${d.message}`).join("\n");
      return { success: false, error_output: text };
    }
    if (ast.uses.length > 0) {
      const project_sink = new CollectingSink();
      const result = compile_project(file_path, project_sink);
      if (!result.success) {
        const text = result.diagnostics.map(d => `${d.code}: ${d.message}`).join("\n");
        return { success: false, error_output: text };
      }
      return { success: true, error_output: "" };
    }
    const { program: hir } = check(ast, sink);
    if ([...sink.diagnostics()].some(d => d.severity === "error")) {
      const text = [...sink.diagnostics()].filter(d => d.severity === "error").map(d => `${d.code}: ${d.message}`).join("\n");
      return { success: false, error_output: text };
    }
    return { success: true, error_output: "" };
  } catch (err) {
    let diagnostics = [...sink.diagnostics()];
    if (err instanceof CompileError) {
      for (const d of err.diagnostics) {
        if (!diagnostics.includes(d)) diagnostics.push(d);
      }
    }
    const text = diagnostics.map(d => `${d.code}: ${d.message}`).join("\n");
    return { success: false, error_output: text || (err instanceof Error ? err.message : String(err)) };
  }
}

function ring_build_single(file_path: string): string {
  const source = fs.readFileSync(file_path, "utf-8");
  const sink = new CollectingSink();
  const ast = Parser.parse(source, file_path, sink);
  if (sink.has_errors()) throw new Error("Parse error");
  const { program: hir } = check(ast, sink);
  if ([...sink.diagnostics()].some(d => d.severity === "error")) throw new Error("Type error");
  return generate(hir);
}

function ring_build_multi_esm(file_path: string): Map<string, string> {
  const project_dir = path.dirname(file_path);
  const dist_dir = path.join(project_dir, "dist");
  if (fs.existsSync(dist_dir)) fs.rmSync(dist_dir, { recursive: true, force: true });

  const sink = new CollectingSink();
  const result = compile_project_esm(file_path, dist_dir, sink);
  if (!result.success) throw new Error("Compile error");

  const files = new Map<string, string>();
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".js")) {
        const rel = path.relative(dist_dir, full);
        files.set(rel, fs.readFileSync(full, "utf-8"));
      }
    }
  }
  walk(dist_dir);
  fs.rmSync(dist_dir, { recursive: true, force: true });
  return files;
}

// ============================================================
// Test cases
// ============================================================

interface TestCase {
  file: string;
  expected: string;
}

const cases: TestCase[] = [
  { file: "hello.ring", expected: "3\n" },
  { file: "enum_match.ring", expected: "red\n" },
  { file: "enum_named_fields.ring", expected: "enum_named_fields: all tests passed\n" },
  { file: "enum_named_fields_generic.ring", expected: "enum_named_fields_generic: all tests passed\n" },
  { file: "enum_named_mixed.ring", expected: "enum_named_mixed: all tests passed\n" },
  { file: "json_stringify.ring", expected: "json_stringify: all tests passed\n" },
  { file: "string_interp.ring", expected: "Hello, World!\n" },
  { file: "effect_or.ring", expected: "42\n" },
  { file: "effect_catch.ring", expected: "42\n" },
  { file: "effect_handle_fail.ring", expected: "42\n" },
  { file: "effect_handle_io.ring", expected: "got: mock-data\n" },
  { file: "effect_resume.ring", expected: "processed: mock-data\n" },
  { file: "trait_basic.ring", expected: "hello-trait\n" },
  { file: "trait_chain.ring", expected: "num\n" },
  { file: "trait_multi_call.ring", expected: "24\n" },
  { file: "effect_evidence.ring", expected: "mock-data\n" },
  { file: "effect_multi_handler.ring", expected: "file-content\n" },
  { file: "effect_propagate.ring", expected: "propagated\n" },
  { file: "effect_cell.ring", expected: "2\n" },
  { file: "effect_cell_closure.ring", expected: "3\n" },
  { file: "effect_resume_side.ring", expected: "reading: input.txt\nmock-result\n" },
  { file: "row_basic.ring", expected: "alice\n" },
  { file: "row_multi_field.ring", expected: "30\n" },
  { file: "row_generic.ring", expected: "whiskers-rex\n" },
  { file: "effect_row_strict.ring", expected: "3-mock-data\n" },
  { file: "effect_row_handle.ring", expected: "42\n" },
  { file: "option_basic.ring", expected: "42\n" },
  { file: "option_unwrap.ring", expected: "43\n" },
  { file: "option_try.ring", expected: "42\n" },
  { file: "option_or.ring", expected: "141\n" },
  { file: "catch_typed.ring", expected: "99\n" },
  { file: "match_wildcard.ring", expected: "yes\nno\nother\n" },
  { file: "try_nested.ring", expected: "-1\n6\n" },
  { file: "trait_higher_order.ring", expected: "num\n" },
  { file: "option_unwrap_none.ring", expected: "99\n6\n" },
  { file: "string_interp_nested.ring", expected: "sum: 3\nab1cd\n" },
  { file: "assign_compound.ring", expected: "12\n" },
  { file: "match_guard.ring", expected: "positive\nnegative\nzero\n" },
  { file: "else_if.ring", expected: "A\nB\nC\n" },
  { file: "trait_default.ring", expected: "Whiskers\n" },
  { file: "eq_strict.ring", expected: "true\ntrue\nfalse\ntrue\nfalse\n" },
  { file: "float_basic.ring", expected: "12.56\n" },
  { file: "bool_ops.ring", expected: "false\ntrue\nfalse\ntrue\n" },
  { file: "unary_ops.ring", expected: "-42\n5\n" },
  { file: "generic_basic.ring", expected: "42\nhello\n1\n" },
  { file: "lambda_arg.ring", expected: "42\n6\n" },
  { file: "return_early.ring", expected: "5\n3\n" },
  { file: "struct_basic.ring", expected: "25\n" },
  { file: "struct_update_test.ring", expected: "struct update: all tests passed\n" },
  { file: "struct_update_enum_test.ring", expected: "struct update enum: all tests passed\n" },
  { file: "struct_update_generic_test.ring", expected: "struct update generic: all tests passed\n" },
  { file: "ufcs_basic.ring", expected: "1\n" },
  { file: "match_guard_multi.ring", expected: "big circle\nsmall circle\nsquare\nrectangle\n" },
  { file: "match_nested.ring", expected: "positive\nnon-positive\nnothing\n" },
  { file: "nested_match_stmt.ring", expected: "42\ndeep\n" },
  { file: "trait_alias.ring", expected: "num\n" },
  { file: "return_if.ring", expected: "5\n3\npositive\nnegative\nzero\n" },
  { file: "while_basic.ring", expected: "10\n" },
  { file: "break_continue.ring", expected: "7\n" },
  { file: "for_range.ring", expected: "10\n" },
  { file: "for_range_nested.ring", expected: "9\n" },
  { file: "for_range_break.ring", expected: "10\n" },
  { file: "for_range_inclusive.ring", expected: "15\n1\n" },
  { file: "match_multi_stmt.ring", expected: "1\n2\n3\n" },
  { file: "str_methods.ring", expected: "13\ntrue\ntrue\ntrue\nHello\nHello, World!\nABC\nxyz\na_b_c\n" },
  { file: "str_split_index.ring", expected: "3\n2\nb\n" },
  { file: "list_basic.ring", expected: "3\nfalse\ntrue\n20\n10\n30\n" },
  { file: "list_transform.ring", expected: "4\n5\n2\n2\n" },
  { file: "list_concat_extend.ring", expected: "list_concat_extend: all tests passed\n" },
  { file: "list_hof.ring", expected: "5\n2\n2\ntrue\ntrue\n4\n" },
  { file: "list_fold.ring", expected: "10\n4\n" },
  { file: "list_for_in.ring", expected: "60\n" },
  { file: "list_hof_effect.ring", expected: "1\n2\n3\n3\n" },
  { file: "tuple_basic.ring", expected: "10\nhello\nx\n" },
  { file: "tuple_fn.ring", expected: "answer\n42\n" },
  { file: "tuple_multi_destructure.ring", expected: "9\n19\n" },
  { file: "tuple_exhaustive.ring", expected: "tf\nft\nt*\nf*\nxf\nft\n" },
  { file: "map_basic.ring", expected: "3\ntrue\nfalse\n4\n3\n" },
  { file: "map_methods.ring", expected: "b\n3\n3\ntrue\n2\n" },
  { file: "map_hof.ring", expected: "40\n2\n60\ntrue\n" },
  { file: "set_basic.ring", expected: "3\ntrue\nfalse\n4\n3\n" },
  { file: "set_ops.ring", expected: "4\n2\n1\n3\n" },
  { file: "set_for_in.ring", expected: "60\n" },
  { file: "set_hof.ring", expected: "2\n15\ntrue\ntrue\n" },
  { file: "if_let_basic.ring", expected: "42\nwas none\n" },
  { file: "if_let_map.ring", expected: "one\nnot found\n" },
  { file: "if_let_no_else.ring", expected: "4\n" },
  { file: "custom_effect.ring", expected: "hello\nworld\n" },
  { file: "trait_multi_bound.ring", expected: "btn: 12\n" },
  { file: "nested_handler.ring", expected: "inner-inner-file-outer-outer-file\n" },
  { file: "for_in_continue.ring", expected: "35\n" },
  { file: "empty_collection.ring", expected: "0\n0\n0\nfalse\ntrue\nnone\n0\nfalse\n0\nfalse\n0\nfalse\n" },
  { file: "extern_fn_basic.ring", expected: "42\n3.14\n" },
  { file: "str_byte_at.ring", expected: "h\no\nnone\n" },
  { file: "str_extra_methods.ring", expected: "00042\nababab\n65\nnone\n" },
  { file: "num_parse_format.ring", expected: "42\n-1\n3.14\n99\n" },
  { file: "type_alias.ring", expected: "42: hello\n" },
  { file: "for_map_destructure.ring", expected: "6\n" },
  { file: "block_expr_complex_stmts.ring", expected: "all block expr tests passed\n" },
  { file: "trait_hof_effect.ring", expected: "trait_hof_effect: all tests passed\n" },
  { file: "recursive_enum.ring", expected: "recursive_enum: all tests passed\n" },
  { file: "recursive_struct.ring", expected: "recursive_struct: all tests passed\n" },
  { file: "mutual_recursive_types.ring", expected: "Int\nfail<Int>\nFoo\n" },
  { file: "list_extra_methods.ring", expected: "list_extra_methods: all tests passed\n" },
  { file: "sort_by.ring", expected: "sort_by: all tests passed\n" },
  { file: "map_clone.ring", expected: "map_clone: all tests passed\n" },
  { file: "os_api_basic.ring", expected: "os_api_basic: all tests passed\n" },
  { file: "var_self_test.ring", expected: "all var_self tests passed\n" },
  { file: "enum_qualified.ring", expected: "red\nenum_qualified: all tests passed\n" },
  { file: "api_clone.ring", expected: "api_clone: all tests passed\n" },
  { file: "list_pop.ring", expected: "list_pop: all tests passed\n" },
  { file: "str_pad_end.ring", expected: "str_pad_end: all tests passed\n" },
  { file: "collection_clear.ring", expected: "collection_clear: all tests passed\n" },
  { file: "option_methods.ring", expected: "option_methods: all tests passed\n" },
  { file: "eq_struct.ring", expected: "eq_struct: all tests passed\n" },
  { file: "eq_enum.ring", expected: "eq_enum: all tests passed\n" },
  { file: "eq_generic.ring", expected: "eq_generic: all tests passed\n" },
  { file: "eq_nested.ring", expected: "eq_nested: all tests passed\n" },
  { file: "clone_struct.ring", expected: "clone_struct: all tests passed\n" },
  { file: "clone_enum.ring", expected: "clone_enum: all tests passed\n" },
  { file: "ord_struct.ring", expected: "ord_struct: all tests passed\n" },
  { file: "ord_enum.ring", expected: "ord_enum: all tests passed\n" },
  { file: "debug_basic.ring", expected: "debug_basic: all tests passed\n" },
  { file: "debug_generic.ring", expected: "debug_generic: all tests passed\n" },
  { file: "nested-closure-eq.ring", expected: "nested closure eq: all passed\n" },
  { file: "trait_generic_impl.ring", expected: "trait_generic_impl: all passed\n" },
];

describe("e2e: ring run", { concurrency: true }, () => {
  for (const tc of cases) {
    test(`ring run ${tc.file}`, () => {
      const filePath = path.join(CASES_DIR, tc.file);
      assert.ok(fs.existsSync(filePath), `Test file not found: ${filePath}`);
      const { output } = ring_run(filePath);
      assert.strictEqual(output, tc.expected);
    });
  }
});


describe("e2e: ring check (negative — should reject)", { concurrency: true }, () => {
  const negative_cases = [
    { file: "row_reject.ring", error_pattern: "E0301" },
    { file: "error_multi_parse.ring", error_pattern: "E0103" },
    { file: "error_type_context.ring", error_pattern: "E0301" },
    { file: "error_multi_type.ring", error_pattern: "E0301" },
    { file: "error_arity.ring", error_pattern: "E0301" },
    { file: "error_undefined.ring", error_pattern: "E0201" },
    { file: "error_operator.ring", error_pattern: "E0301" },
    { file: "error_nonexhaustive.ring", error_pattern: "E0601" },
    { file: "error_undef_method.ring", error_pattern: "E0305" },
    { file: "error_missing_field.ring", error_pattern: "E0203" },
    { file: "error_assign_immutable.ring", error_pattern: "E0205" },
    { file: "error_break_outside.ring", error_pattern: "E0206" },
    { file: "error_empty_list.ring", error_pattern: "E0301" },
    { file: "error_unterminated_str.ring", error_pattern: "E0102" },
    { file: "error_unknown_type.ring", error_pattern: "E0204" },
    { file: "error_numeric_required.ring", error_pattern: "E0303" },
    { file: "error_field_non_struct.ring", error_pattern: "E0304" },
    { file: "error_unknown_effect_op.ring", error_pattern: "E0402" },
    { file: "error_unknown_trait.ring", error_pattern: "E0501" },
    { file: "error_unsatisfied_bound.ring", error_pattern: "E0503" },
    { file: "error_occurs_check.ring", error_pattern: "E0302" },
    { file: "error_tuple_cross_exhaust.ring", error_pattern: "E0601" },
    { file: "enum_named_wrong_field.ring", error_pattern: "E0203" },
    { file: "enum_named_missing_field.ring", error_pattern: "E0203" },
    { file: "negative/struct_update_wrong_type.ring", error_pattern: "E0301" },
    { file: "neg_field_assign_immutable.ring", error_pattern: "E0205" },
    { file: "neg_let_field_assign.ring", error_pattern: "E0205" },
    { file: "error_no_eq.ring", error_pattern: "E0307" },
    { file: "error_no_ord.ring", error_pattern: "E0308" },
  ];

  for (const tc of negative_cases) {
    test(`ring check ${tc.file} should fail with "${tc.error_pattern}"`, () => {
      const filePath = path.join(CASES_DIR, tc.file);
      assert.ok(fs.existsSync(filePath), `Test file not found: ${filePath}`);
      const result = ring_check(filePath);
      assert.ok(!result.success, `Expected ${tc.file} to fail type checking`);
      assert.ok(
        result.error_output.toLowerCase().includes(tc.error_pattern.toLowerCase()),
        `Expected error containing "${tc.error_pattern}", got: ${result.error_output.slice(0, 200)}`
      );
    });
  }
});

// ============================================================
// Multi-file module tests
// ============================================================

interface ModuleTestCase {
  dir: string;
  expected: string;
}

const module_cases: ModuleTestCase[] = [
  { dir: "basic_import", expected: "hello from lib\n" },
  { dir: "import_struct", expected: "5\n" },
  { dir: "import_enum", expected: "red\n" },
  { dir: "multi_import", expected: "7\n12\n" },
  { dir: "diamond_dep", expected: "11\n12\n" },
  { dir: "pub_use", expected: "re-exported\n" },
  { dir: "cross_module_method", expected: "75\n" },
  { dir: "io_in_main", expected: "7\n" },
  { dir: "cross_option", expected: "42\n99\n" },
  { dir: "cross_effect", expected: "5\n-1\n" },
  { dir: "cross_trait", expected: "Rex\n" },
  { dir: "extern_fn", expected: "100\n2.5\n42\n" },
  { dir: "esm_verify", expected: "hello, world\n3\n" },
];

describe("e2e: multi-file modules (ring run)", { concurrency: true }, () => {
  for (const tc of module_cases) {
    test(`modules/${tc.dir}`, () => {
      const mainFile = path.join(MODULES_DIR, tc.dir, "main.ring");
      assert.ok(fs.existsSync(mainFile), `Test entry not found: ${mainFile}`);
      const { output } = ring_run_multi(mainFile);
      assert.strictEqual(output, tc.expected);
    });
  }
});

describe("e2e: multi-file modules (ring check)", { concurrency: true }, () => {
  for (const tc of module_cases) {
    test(`modules/${tc.dir} check`, () => {
      const mainFile = path.join(MODULES_DIR, tc.dir, "main.ring");
      const result = ring_check(mainFile);
      assert.ok(result.success, `Expected check to pass, got: ${result.error_output.slice(0, 200)}`);
    });
  }
});

describe("e2e: multi-file modules (negative)", () => {
  test("modules/error_not_found should fail with 'not found'", () => {
    const mainFile = path.join(MODULES_DIR, "error_not_found", "main.ring");
    assert.ok(fs.existsSync(mainFile), `Test entry not found: ${mainFile}`);
    const result = ring_check(mainFile);
    assert.ok(!result.success, "Expected compilation to fail");
    assert.ok(
      result.error_output.toLowerCase().includes("not found"),
      `Expected error containing "not found", got: ${result.error_output.slice(0, 200)}`
    );
  });
});

describe("e2e: --error-format=llm", { concurrency: true }, () => {
  test("outputs valid JSON for parse errors", () => {
    const filePath = path.join(CASES_DIR, "error_multi_parse.ring");
    const source = fs.readFileSync(filePath, "utf-8");
    const sink = new CollectingSink();
    try { Parser.parse(source, filePath, sink); } catch {}
    const diagnostics = [...sink.diagnostics()];
    const json_str = format_llm(diagnostics, filePath);
    const parsed = JSON.parse(json_str);
    assert.equal(parsed.version, 1);
    assert.ok(parsed.diagnostics.length >= 1);
    assert.ok(parsed.diagnostics[0].code.startsWith("E01"));
  });

  test("outputs valid JSON for type errors", () => {
    const filePath = path.join(CASES_DIR, "error_type_context.ring");
    const source = fs.readFileSync(filePath, "utf-8");
    const sink = new CollectingSink();
    try {
      const ast = Parser.parse(source, filePath, sink);
      if (!sink.has_errors()) check(ast, sink);
    } catch {}
    const diagnostics = [...sink.diagnostics()].filter(d => d.severity === "error");
    assert.ok(diagnostics.length >= 1, "Should have type errors");
    const json_str = format_llm(diagnostics, filePath);
    const parsed = JSON.parse(json_str);
    assert.equal(parsed.version, 1);
    assert.ok(parsed.diagnostics.length >= 1);
    assert.ok(parsed.diagnostics[0].message.toLowerCase().includes("unify"));
  });

  test("outputs nothing special for valid files", () => {
    const filePath = path.join(CASES_DIR, "hello.ring");
    const result = ring_check(filePath);
    assert.ok(result.success);
  });
});

// ============================================================
// Compiler determinism — same input must produce identical JS
// ============================================================

describe("determinism: single-file", { concurrency: true }, () => {
  for (const tc of cases) {
    test(`build ${tc.file} is deterministic`, () => {
      const filePath = path.join(CASES_DIR, tc.file);
      const js1 = ring_build_single(filePath);
      const js2 = ring_build_single(filePath);
      assert.strictEqual(js1, js2);
    });
  }
});

describe("determinism: multi-file modules", { concurrency: true }, () => {
  for (const tc of module_cases) {
    test(`build modules/${tc.dir} is deterministic`, () => {
      const mainFile = path.join(MODULES_DIR, tc.dir, "main.ring");
      const js1 = ring_build_multi_esm(mainFile);
      const js2 = ring_build_multi_esm(mainFile);
      assert.strictEqual(js1.size, js2.size, "different number of output files");
      for (const [file, content] of js1) {
        assert.ok(js2.has(file), `file ${file} missing in second build`);
        assert.strictEqual(content, js2.get(file), `content differs: ${file}`);
      }
    });
  }
});

describe("e2e: ESM output structure", () => {
  test("ring build produces dist/ with separate .js files", () => {
    const mainFile = path.join(MODULES_DIR, "esm_verify", "main.ring");
    const dist_dir = path.join(MODULES_DIR, "esm_verify", "dist");

    if (fs.existsSync(dist_dir)) fs.rmSync(dist_dir, { recursive: true, force: true });

    const sink = new CollectingSink();
    const result = compile_project_esm(mainFile, dist_dir, sink);
    assert.ok(result.success, "ESM compilation should succeed");

    // Verify structure
    assert.ok(fs.existsSync(path.join(dist_dir, "__ring_runtime.js")), "runtime.js exists");
    assert.ok(fs.existsSync(path.join(dist_dir, "main.js")), "main.js exists");
    assert.ok(fs.existsSync(path.join(dist_dir, "lib.js")), "lib.js exists");

    // Verify ESM imports
    const main_js = fs.readFileSync(path.join(dist_dir, "main.js"), "utf-8");
    assert.ok(main_js.includes("import "), "main.js has import statements");
    assert.ok(main_js.includes("__ring_runtime.js"), "main.js imports runtime");
    assert.ok(main_js.includes("from \"./lib.js\""), "main.js imports lib");

    const lib_js = fs.readFileSync(path.join(dist_dir, "lib.js"), "utf-8");
    assert.ok(lib_js.includes("export {"), "lib.js has export statement");
    assert.ok(lib_js.includes("greet"), "lib.js exports greet");

    // Verify it runs correctly via node (ESM requires real node execution)
    const output = execSync(`node "${path.join(dist_dir, "main.js")}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 15000,
    });
    assert.strictEqual(output, "hello, world\n3\n");

    fs.rmSync(dist_dir, { recursive: true, force: true });
  });
});
