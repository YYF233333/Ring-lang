// Ring-lang HIR → JavaScript code generator

import {
  HProgram, HDecl, HFnDecl, HStructDecl, HEnumDecl, HImplDecl,
  HEffectDecl, HTestDecl, HTraitDecl, HStmt, HExpr, HBlock,
  variant_js_name, trait_dict_name, evidence_param_name,
  trait_bound_param_name, default_method_self_name, ENUM_TAG_FIELD,
  OPTION_SOME_TAG, OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD,
  RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL,
} from "../hir/index.js";
import { Pattern } from "../ast/index.js";
import { Type, Effect, EffectRow } from "../types/index.js";
import { assertNever } from "../errors.js";
import { RUNTIME_CODE } from "./runtime.js";

const JS_RESERVED = new Set([
  "abstract", "arguments", "await", "boolean", "break", "byte", "case", "catch",
  "char", "class", "const", "continue", "debugger", "default", "delete", "do",
  "double", "else", "enum", "eval", "export", "extends", "false", "final",
  "finally", "float", "for", "function", "goto", "if", "implements", "import",
  "in", "instanceof", "int", "interface", "let", "long", "native", "new",
  "null", "package", "private", "protected", "public", "return", "short",
  "static", "super", "switch", "synchronized", "this", "throw", "throws",
  "transient", "true", "try", "typeof", "undefined", "var", "void",
  "volatile", "while", "with", "yield",
  // JS built-in global names — prevent user types from shadowing these
  "Object", "Array", "Map", "Set", "String", "Number", "Boolean", "Symbol",
  "Promise", "Error", "RegExp", "Date", "Math", "JSON", "Proxy", "Reflect",
  "WeakMap", "WeakSet", "WeakRef", "BigInt", "ArrayBuffer", "DataView",
  "Int8Array", "Uint8Array", "Float32Array", "Float64Array",
]);

function safe_ident(name: string): string {
  if (JS_RESERVED.has(name)) return `_${name}`;
  return name;
}

// ============================================================
// CodeGenerator class
// ============================================================

class CodeGenerator {
  private lines: string[] = [];
  private indent_level = 0;
  private impl_methods: Map<string, string | undefined> = new Map();
  private struct_field_order: Map<string, string[]> = new Map();
  private trait_decls: Map<string, HTraitDecl> = new Map();

  private indent(): string {
    return "  ".repeat(this.indent_level);
  }

  private emit(line: string): void {
    this.lines.push(this.indent() + line);
  }

  private emit_raw(line: string): void {
    this.lines.push(line);
  }

  private push_indent(): void {
    this.indent_level++;
  }

  private pop_indent(): void {
    this.indent_level--;
  }

  // ============================================================
  // Top-level generation
  // ============================================================

  generate(program: HProgram): string {
    // Collect struct field orders and impl method signatures
    for (const decl of program.decls) {
      if (decl.kind === "struct_decl") {
        this.struct_field_order.set(decl.name, decl.fields.map(f => f.name));
      } else if (decl.kind === "impl_decl") {
        for (const method of decl.methods) {
          const key = `${decl.target_type}.${method.name}`;
          if (!decl.trait_name) {
            this.impl_methods.set(key, undefined);
          } else if (!this.impl_methods.has(key)) {
            this.impl_methods.set(key, decl.trait_name);
          }
        }
      } else if (decl.kind === "trait_decl") {
        this.trait_decls.set(decl.name, decl);
      }
    }

    // Built-in Cell impl methods (in runtime, not in source)
    this.impl_methods.set("Cell.get", undefined);
    this.impl_methods.set("Cell.set", undefined);
    this.impl_methods.set("Cell.update", undefined);

    // Built-in Str impl methods
    for (const m of ["len", "contains", "starts_with", "ends_with", "slice", "trim",
                     "to_upper", "to_lower", "replace", "split", "char_at", "index_of"]) {
      this.impl_methods.set(`Str.${m}`, undefined);
    }

    // Built-in List non-HOF impl methods (runtime functions)
    for (const m of ["len", "get", "first", "last", "contains", "is_empty",
                     "push", "concat", "slice", "reverse"]) {
      this.impl_methods.set(`List.${m}`, undefined);
    }

    // Emit runtime preamble
    this.emit_raw(RUNTIME_CODE);

    // Option<T> constructors
    this.emit_raw(`function Option_some(${OPTION_PAYLOAD_FIELD}) { return { ${ENUM_TAG_FIELD}: "${OPTION_SOME_TAG}", ${OPTION_PAYLOAD_FIELD} }; }`);
    this.emit_raw(`const Option_none = Object.freeze({ ${ENUM_TAG_FIELD}: "${OPTION_NONE_TAG}" });`);
    this.emit_raw("");

    // Emit declarations
    for (const decl of program.decls) {
      this.emit_decl(decl);
      this.emit_raw("");
    }

    // Auto-call main() if present, with top-level evidence if needed
    const main_decl = program.decls.find(
      d => d.kind === "fn_decl" && d.name === "main"
    ) as HFnDecl | undefined;
    if (main_decl) {
      const ev_params = this.get_evidence_params(main_decl.effects);
      if (ev_params.length > 0) {
        this.emit_toplevel_evidence(main_decl.effects);
        this.emit(`main(${ev_params.join(", ")});`);
      } else {
        this.emit("main();");
      }
    }

    return this.lines.join("\n");
  }

  // ============================================================
  // Declarations
  // ============================================================

  private emit_decl(decl: HDecl): void {
    switch (decl.kind) {
      case "fn_decl": this.emit_fn_decl(decl); break;
      case "struct_decl": this.emit_struct_decl(decl); break;
      case "enum_decl": this.emit_enum_decl(decl); break;
      case "impl_decl": this.emit_impl_decl(decl); break;
      case "effect_decl": this.emit_effect_decl(decl); break;
      case "test_decl": this.emit_test_decl(decl); break;
      case "trait_decl": this.emit_trait_decl(decl); break;
      default: assertNever(decl, "emit_decl");
    }
  }

  private emit_fn_decl(decl: HFnDecl, prefix?: string): void {
    const name = prefix ? `${prefix}_${safe_ident(decl.name)}` : safe_ident(decl.name);
    const param_names = decl.params.map(p => safe_ident(p.name));
    const dict_params = (decl.trait_bounds ?? []).map(b => trait_bound_param_name(b.type_param, b.trait_name));
    const ev_params = this.get_evidence_params(decl.effects);
    const all_params = [...param_names, ...dict_params, ...ev_params].join(", ");
    this.emit(`function ${name}(${all_params}) {`);
    this.push_indent();
    this.emit_block_body(decl.body);
    this.pop_indent();
    this.emit("}");
  }

  private get_evidence_params(effects: EffectRow): string[] {
    return extract_effect_names(effects).map(n => evidence_param_name(n));
  }

  private emit_toplevel_evidence(effects: EffectRow): void {
    const effect_names = extract_effect_names(effects);

    for (const name of effect_names) {
      const ev_name = evidence_param_name(name);
      if (name === "io") {
        this.emit(`const ${ev_name} = { read: (p) => require("fs").readFileSync(p, "utf-8"), write: (p, d) => require("fs").writeFileSync(p, d, "utf-8") };`);
      } else if (name === "fail") {
        this.emit(`const ${ev_name} = { raise: (error) => { throw error; } };`);
      } else {
        this.emit(`const ${ev_name} = {};`);
      }
    }
  }

  private emit_struct_decl(decl: HStructDecl): void {
    const raw_fields = decl.fields.map(f => f.name);
    const fields = raw_fields.map(f => safe_ident(f));
    this.emit(`class ${safe_ident(decl.name)} {`);
    this.push_indent();
    this.emit(`constructor(${fields.join(", ")}) {`);
    this.push_indent();
    for (let i = 0; i < raw_fields.length; i++) {
      this.emit(`this.${raw_fields[i]} = ${fields[i]};`);
    }
    this.pop_indent();
    this.emit("}");
    this.pop_indent();
    this.emit("}");
  }

  private emit_enum_decl(decl: HEnumDecl): void {
    for (const variant of decl.variants) {
      const js_name = variant_js_name(decl.name, variant.name);
      if (variant.fields.length === 0) {
        this.emit(
          `const ${js_name} = Object.freeze({ ${ENUM_TAG_FIELD}: "${variant.name}" });`
        );
      } else {
        const params = variant.fields.map((_, i) => `_${i}`).join(", ");
        this.emit(`function ${js_name}(${params}) {`);
        this.push_indent();
        const field_assigns = variant.fields.map((_, i) => `_${i}`).join(", ");
        this.emit(`return { ${ENUM_TAG_FIELD}: "${variant.name}", ${field_assigns} };`);
        this.pop_indent();
        this.emit("}");
      }
    }
  }

  private emit_impl_decl(decl: HImplDecl): void {
    const prefix = decl.trait_name
      ? `${safe_ident(decl.target_type)}_${safe_ident(decl.trait_name)}`
      : safe_ident(decl.target_type);
    for (const method of decl.methods) {
      this.emit_fn_decl(method, prefix);
    }
    if (decl.trait_name) {
      this.emit_trait_dictionary(decl);
    }
  }

  private emit_trait_dictionary(decl: HImplDecl): void {
    const dict_name = trait_dict_name(decl.target_type, decl.trait_name!);
    const impl_method_names = new Set(decl.methods.map(m => m.name));
    const entries = decl.methods.map(m => {
      const fn_name = `${safe_ident(decl.target_type)}_${safe_ident(decl.trait_name!)}_${safe_ident(m.name)}`;
      return `${safe_ident(m.name)}: ${fn_name}`;
    });
    const trait_decl = this.trait_decls.get(decl.trait_name!);
    if (trait_decl) {
      for (const tm of trait_decl.methods) {
        if (tm.has_default && !impl_method_names.has(tm.name)) {
          const default_fn = `__${safe_ident(decl.trait_name!)}_${safe_ident(tm.name)}`;
          const param_names = tm.params.map(p => safe_ident(p.name));
          entries.push(`${safe_ident(tm.name)}: function(${param_names.join(", ")}) { return ${default_fn}(${dict_name}, ${param_names.join(", ")}); }`);
        }
      }
    }
    this.emit(`const ${dict_name} = { ${entries.join(", ")} };`);
  }

  private emit_effect_decl(_decl: HEffectDecl): void {
    // Effect declarations don't produce runtime code directly.
    // The operations are translated at call sites.
  }

  private emit_trait_decl(decl: HTraitDecl): void {
    for (const method of decl.methods) {
      if (method.has_default && method.body) {
        const fn_name = `__${safe_ident(decl.name)}_${safe_ident(method.name)}`;
        const param_names = method.params.map(p => safe_ident(p.name));
        const all_params = [default_method_self_name(safe_ident(decl.name)), ...param_names].join(", ");
        this.emit(`function ${fn_name}(${all_params}) {`);
        this.push_indent();
        this.emit_block_body(method.body);
        this.pop_indent();
        this.emit("}");
      }
    }
  }

  private emit_test_decl(decl: HTestDecl): void {
    this.emit(`// test: ${decl.description}`);
    this.emit("(function() {");
    this.push_indent();
    this.emit_block_body(decl.body);
    this.pop_indent();
    this.emit("})();");
  }

  // ============================================================
  // Block body (shared between functions and IIFE blocks)
  // ============================================================

  private emit_block_body(block: HBlock): void {
    for (const stmt of block.stmts) {
      this.emit_stmt(stmt);
    }
    if (block.tail) {
      this.emit_in_stmt_context(block.tail, "return");
    }
  }

  // ============================================================
  // Statement-mode expression emission
  // ============================================================

  private emit_in_stmt_context(expr: HExpr, mode: "return" | "discard"): void {
    switch (expr.kind) {
      case "if_expr":
        this.emit_if_stmt(expr, mode);
        return;
      case "block":
        this.emit_block_in_stmt_context(expr, mode);
        return;
      case "match_expr":
        this.emit_match_stmt(expr, mode);
        return;
      default:
        if (mode === "return") {
          this.emit(`return ${this.gen_expr(expr)};`);
        } else {
          this.emit(`${this.gen_expr(expr)};`);
        }
    }
  }

  private emit_if_stmt(expr: HExpr & { kind: "if_expr" }, mode: "return" | "discard"): void {
    this.emit(`if (${this.gen_expr(expr.condition)}) {`);
    this.push_indent();
    this.emit_block_in_stmt_context(expr.then_branch, mode);
    this.pop_indent();
    if (!expr.else_branch) {
      this.emit("}");
    } else if (expr.else_branch.kind === "if_expr") {
      this.emit_else_if(expr.else_branch, mode);
    } else {
      this.emit("} else {");
      this.push_indent();
      this.emit_block_in_stmt_context(expr.else_branch, mode);
      this.pop_indent();
      this.emit("}");
    }
  }

  private emit_else_if(expr: HExpr & { kind: "if_expr" }, mode: "return" | "discard"): void {
    this.emit(`} else if (${this.gen_expr(expr.condition)}) {`);
    this.push_indent();
    this.emit_block_in_stmt_context(expr.then_branch, mode);
    this.pop_indent();
    if (!expr.else_branch) {
      this.emit("}");
    } else if (expr.else_branch.kind === "if_expr") {
      this.emit_else_if(expr.else_branch, mode);
    } else {
      this.emit("} else {");
      this.push_indent();
      this.emit_block_in_stmt_context(expr.else_branch, mode);
      this.pop_indent();
      this.emit("}");
    }
  }

  private emit_block_in_stmt_context(block: HBlock, mode: "return" | "discard"): void {
    for (const stmt of block.stmts) {
      this.emit_stmt(stmt);
    }
    if (block.tail) {
      this.emit_in_stmt_context(block.tail, mode);
    }
  }

  private emit_match_stmt(expr: HExpr & { kind: "match_expr" }, mode: "return" | "discard"): void {
    const scrutinee = this.gen_expr(expr.scrutinee);
    this.emit(`__ring_match: {`);
    this.push_indent();
    this.emit(`const __ring_m = ${scrutinee};`);

    for (const arm of expr.arms) {
      const cond = this.gen_pattern_condition("__ring_m", arm.pattern);
      const bindings_str = this.gen_pattern_bindings("__ring_m", arm.pattern);
      if (cond === "true" && !arm.guard) {
        if (bindings_str) this.emit(bindings_str.trim());
        this.emit_in_stmt_context(arm.body, mode);
        this.emit("break __ring_match;");
      } else if (arm.guard) {
        this.emit(`if (${cond}) {`);
        this.push_indent();
        if (bindings_str) this.emit(bindings_str.trim());
        this.emit(`if (${this.gen_expr(arm.guard)}) {`);
        this.push_indent();
        this.emit_in_stmt_context(arm.body, mode);
        this.emit("break __ring_match;");
        this.pop_indent();
        this.emit("}");
        this.pop_indent();
        this.emit("}");
      } else {
        this.emit(`if (${cond}) {`);
        this.push_indent();
        if (bindings_str) this.emit(bindings_str.trim());
        this.emit_in_stmt_context(arm.body, mode);
        this.emit("break __ring_match;");
        this.pop_indent();
        this.emit("}");
      }
    }

    const has_catchall = expr.arms.some(a =>
      (a.pattern.kind === "wildcard" || a.pattern.kind === "binding") && !a.guard
    );
    if (!has_catchall) {
      this.emit(`${RUNTIME_MATCH_FAIL}(__ring_m);`);
    }
    this.pop_indent();
    this.emit(`}`);
  }

  // ============================================================
  // Statements
  // ============================================================

  private emit_stmt(stmt: HStmt): void {
    switch (stmt.kind) {
      case "expr_stmt":
        this.emit_in_stmt_context(stmt.expr, "discard");
        return;
      case "return_stmt":
        if (stmt.value) {
          this.emit_in_stmt_context(stmt.value, "return");
        } else {
          this.emit("return;");
        }
        return;
      case "while_stmt":
        this.emit(`while (${this.gen_expr(stmt.condition)}) {`);
        this.push_indent();
        this.emit_block_in_stmt_context(stmt.body, "discard");
        this.pop_indent();
        this.emit("}");
        return;
      case "for_in_stmt": {
        if (stmt.iterable.kind === "range") {
          const start_js = this.gen_expr(stmt.iterable.start);
          const end_js = this.gen_expr(stmt.iterable.end);
          const binding = safe_ident(stmt.binding);
          const end_var = `__ring_end_${binding}`;
          this.emit(`const ${end_var} = ${end_js};`);
          this.emit(`for (let ${binding} = ${start_js}; ${binding} < ${end_var}; ${binding}++) {`);
        } else {
          const iter = this.gen_expr(stmt.iterable);
          const binding = safe_ident(stmt.binding);
          this.emit(`for (const ${binding} of ${iter}) {`);
        }
        this.push_indent();
        this.emit_block_in_stmt_context(stmt.body, "discard");
        this.pop_indent();
        this.emit("}");
        return;
      }
      case "break_stmt":
        this.emit("break;");
        return;
      case "continue_stmt":
        this.emit("continue;");
        return;
      default:
        this.emit(this.gen_stmt_inline(stmt));
    }
  }

  // ============================================================
  // Expressions — returns JS expression string
  // ============================================================

  gen_expr(expr: HExpr): string {
    switch (expr.kind) {
      case "int_lit":
        return String(expr.value);
      case "float_lit":
        return String(expr.value);
      case "str_lit":
        return JSON.stringify(expr.value);
      case "bool_lit":
        return expr.value ? "true" : "false";
      case "ident": {
        const name = safe_ident(expr.resolved_name ?? expr.name);
        if (expr.dict_closure_dicts && expr.dict_closure_dicts.length > 0) {
          const fn_type = expr.type;
          if (fn_type.kind === "fn") {
            const params = fn_type.params.map((_, i) => `__ring_a${i}`);
            const dict_args = expr.dict_closure_dicts.join(", ");
            const ev_args = this.get_callee_evidence_args(fn_type);
            const all_call_args = [...params, dict_args, ...(ev_args ? [ev_args] : [])].join(", ");
            return `((${params.join(", ")}) => ${name}(${all_call_args}))`;
          }
        }
        return name;
      }
      case "bin_op": {
        const js_op = expr.op === "==" ? "===" : expr.op === "!=" ? "!==" : expr.op;
        return `(${this.gen_expr(expr.left)} ${js_op} ${this.gen_expr(expr.right)})`;
      }
      case "unary_op":
        return `(${expr.op}${this.gen_expr(expr.operand)})`;
      case "call":
        return this.gen_call(expr);
      case "field_access":
        return `${this.gen_expr(expr.receiver)}.${expr.field}`;
      case "struct_lit":
        return this.gen_struct_lit(expr);
      case "match_expr":
        return this.gen_match(expr);
      case "block":
        return this.gen_block_expr(expr);
      case "if_expr":
        return this.gen_if(expr);
      case "string_interp":
        return this.gen_string_interp(expr);
      case "try_catch":
        return this.gen_try_catch(expr);
      case "handle_expr":
        return this.gen_handle(expr);
      case "lambda":
        return this.gen_lambda(expr);
      case "effect_op":
        return this.gen_effect_op(expr);
      case "option_unwrap":
        return this.gen_option_unwrap(expr);
      case "try_block":
        return this.gen_try_block(expr);
      case "option_or":
        return this.gen_option_or(expr);
      case "range":
        return `{ start: ${this.gen_expr(expr.start)}, end: ${this.gen_expr(expr.end)} }`;
      case "list_lit":
        return `[${expr.elements.map(e => this.gen_expr(e)).join(", ")}]`;
      default:
        return assertNever(expr, "gen_expr");
    }
  }

  private get_callee_evidence_args(callee_type: Type): string {
    if (callee_type.kind !== "fn" || callee_type.effects.effects.length === 0) return "";
    return this.get_evidence_params(callee_type.effects).join(", ");
  }

  private gen_call(expr: HExpr & { kind: "call" }): string {
    // Task 8b: Trait method dispatch via dictionary
    if (expr.dict_dispatch) {
      const { dict_param, method: meth } = expr.dict_dispatch;
      const receiver_arg = expr.callee.kind === "field_access" ? this.gen_expr(expr.callee.receiver) : this.gen_expr(expr.args[0]);
      const other_args = expr.args.map(a => this.gen_expr(a));
      const all = [receiver_arg, ...other_args].join(", ");
      return `${dict_param}.${safe_ident(meth)}(${all})`;
    }

    // Inline List HOF methods — bypass runtime to forward evidence via closure capture
    if (expr.callee.kind === "field_access") {
      const recv_type = expr.callee.receiver.type;
      const method = expr.callee.field;
      if (recv_type.kind === "struct" && recv_type.name === "List") {
        const LIST_HOF_JS: Record<string, string> = {
          map: "map", filter: "filter", flat_map: "flatMap",
          any: "some", all: "every",
        };
        const js_method = LIST_HOF_JS[method];
        if (js_method) {
          const receiver = this.gen_expr(expr.callee.receiver);
          const callback = this.gen_lambda_capture_evidence(expr.args[0]);
          return `${receiver}.${js_method}(${callback})`;
        }
        if (method === "fold") {
          const receiver = this.gen_expr(expr.callee.receiver);
          const init = this.gen_expr(expr.args[0]);
          const callback = this.gen_lambda_capture_evidence(expr.args[1]);
          return `${receiver}.reduce(${callback}, ${init})`;
        }
        if (method === "find") {
          const receiver = this.gen_expr(expr.callee.receiver);
          const callback = this.gen_lambda_capture_evidence(expr.args[0]);
          return `((__r) => __r !== undefined ? { _tag: "some", _0: __r } : { _tag: "none" })(${receiver}.find(${callback}))`;
        }
      }
    }

    // Detect UFCS method call: call(field_access(receiver, method), args)
    if (expr.callee.kind === "field_access") {
      const recv_type = expr.callee.receiver.type;
      const method = expr.callee.field;
      const type_name = recv_type.kind === "struct" ? recv_type.name
        : recv_type.kind === "enum" ? recv_type.name
        : recv_type.kind === "str" ? "Str"
        : recv_type.kind === "int" ? "Int"
        : recv_type.kind === "float" ? "Float"
        : null;
      const impl_key = type_name ? `${type_name}.${method}` : null;
      if (type_name && impl_key && this.impl_methods.has(impl_key)) {
        const trait_name = this.impl_methods.get(impl_key);
        const fn_name = trait_name
          ? `${safe_ident(type_name)}_${safe_ident(trait_name)}_${safe_ident(method)}`
          : `${safe_ident(type_name)}_${safe_ident(method)}`;
        const receiver = this.gen_expr(expr.callee.receiver);
        const args = expr.args.map(a => this.gen_expr(a)).join(", ");
        const all_args = args ? `${receiver}, ${args}` : receiver;
        const ev_args = this.get_callee_evidence_args(expr.callee.type);
        const all_with_ev = [all_args, ev_args].filter(s => s.length > 0).join(", ");
        return `${fn_name}(${all_with_ev})`;
      }
    }

    // Task 8c: Pass dictionary args + evidence args at call sites
    const callee = this.gen_expr(expr.callee);
    const args = expr.args.map(a => this.gen_expr(a)).join(", ");
    const dict_args = (expr.resolved_dicts ?? []).join(", ");
    const ev_args = this.get_callee_evidence_args(expr.callee.type);
    const all_args = [args, dict_args, ev_args].filter(s => s.length > 0).join(", ");
    return `${callee}(${all_args})`;
  }

  private gen_struct_lit(expr: HExpr & { kind: "struct_lit" }): string {
    const declared_order = this.struct_field_order.get(expr.name);
    if (declared_order) {
      const field_map = new Map(expr.fields.map(f => [f.name, f.value]));
      const args = declared_order.map(name => {
        const val = field_map.get(name);
        return val ? this.gen_expr(val) : "undefined";
      }).join(", ");
      return `new ${safe_ident(expr.name)}(${args})`;
    }
    const args = expr.fields.map(f => this.gen_expr(f.value)).join(", ");
    return `new ${safe_ident(expr.name)}(${args})`;
  }

  private gen_match(expr: HExpr & { kind: "match_expr" }): string {
    const scrutinee = this.gen_expr(expr.scrutinee);
    const parts: string[] = [];
    parts.push("(function() {");
    parts.push(`  const __ring_m = ${scrutinee};`);

    for (const arm of expr.arms) {
      const cond = this.gen_pattern_condition("__ring_m", arm.pattern);
      const bindings = this.gen_pattern_bindings("__ring_m", arm.pattern);
      const body = this.gen_expr(arm.body);
      if (cond === "true" && !arm.guard) {
        parts.push(`  ${bindings}return ${body};`);
      } else if (arm.guard) {
        parts.push(`  if (${cond}) { ${bindings}if (${this.gen_expr(arm.guard)}) { return ${body}; } }`);
      } else {
        parts.push(`  if (${cond}) { ${bindings}return ${body}; }`);
      }
    }

    const has_catchall = expr.arms.some(a =>
      (a.pattern.kind === "wildcard" || a.pattern.kind === "binding") && !a.guard
    );
    if (!has_catchall) {
      parts.push(`  ${RUNTIME_MATCH_FAIL}(__ring_m);`);
    }

    parts.push("})()");
    return parts.join("\n");
  }

  private gen_pattern_condition(target: string, pat: Pattern): string {
    switch (pat.kind) {
      case "wildcard":
      case "binding":
        return "true";
      case "literal":
        return `${target} === ${JSON.stringify(pat.value)}`;
      case "constructor": {
        const tag_check = `${target}.${ENUM_TAG_FIELD} === "${pat.name}"`;
        const sub_conds = pat.fields.map((f, i) =>
          this.gen_pattern_condition(`${target}._${i}`, f)
        ).filter(c => c !== "true");
        if (sub_conds.length === 0) return tag_check;
        return `${tag_check} && ${sub_conds.join(" && ")}`;
      }
      default:
        return assertNever(pat, "gen_pattern_condition");
    }
  }

  private gen_pattern_bindings(target: string, pat: Pattern): string {
    switch (pat.kind) {
      case "wildcard":
      case "literal":
        return "";
      case "binding":
        return `const ${safe_ident(pat.name)} = ${target}; `;
      case "constructor":
        return pat.fields.map((f, i) =>
          this.gen_pattern_bindings(`${target}._${i}`, f)
        ).join("");
      default:
        return assertNever(pat, "gen_pattern_bindings");
    }
  }

  private gen_block_expr(block: HBlock): string {
    if (block.stmts.length === 0 && block.tail) {
      return this.gen_expr(block.tail);
    }
    const parts: string[] = [];
    parts.push("(function() {");
    for (const stmt of block.stmts) {
      parts.push("  " + this.gen_stmt_inline(stmt));
    }
    if (block.tail) {
      parts.push(`  return ${this.gen_expr(block.tail)};`);
    }
    parts.push("})()");
    return parts.join("\n");
  }

  private gen_stmt_inline(stmt: HStmt): string {
    switch (stmt.kind) {
      case "let_stmt":
        return `const ${safe_ident(stmt.name)} = ${this.gen_expr(stmt.init)};`;
      case "var_stmt":
        return `let ${safe_ident(stmt.name)} = ${this.gen_expr(stmt.init)};`;
      case "assign_stmt":
        return `${this.gen_expr(stmt.target)} = ${this.gen_expr(stmt.value)};`;
      case "expr_stmt":
        return `${this.gen_expr(stmt.expr)};`;
      case "return_stmt":
        if (stmt.value) {
          return `return ${this.gen_expr(stmt.value)};`;
        }
        return "return;";
      case "while_stmt":
      case "for_in_stmt":
      case "break_stmt":
      case "continue_stmt":
        throw new Error(`${stmt.kind} handled in emit_stmt`);
      default:
        return assertNever(stmt, "gen_stmt_inline");
    }
  }

  private gen_if(expr: HExpr & { kind: "if_expr" }): string {
    const cond = this.gen_expr(expr.condition);
    const then_val = this.gen_block_as_value(expr.then_branch);

    if (!expr.else_branch) {
      return `(${cond} ? ${then_val} : undefined)`;
    }

    if (expr.else_branch.kind === "if_expr") {
      const else_val = this.gen_if(expr.else_branch as HExpr & { kind: "if_expr" });
      return `(${cond} ? ${then_val} : ${else_val})`;
    }

    const else_val = this.gen_block_as_value(expr.else_branch as HBlock);
    return `(${cond} ? ${then_val} : ${else_val})`;
  }

  private gen_block_as_value(block: HBlock): string {
    if (block.stmts.length === 0 && block.tail) {
      return this.gen_expr(block.tail);
    }
    return this.gen_block_expr(block);
  }

  private gen_string_interp(expr: HExpr & { kind: "string_interp" }): string {
    const parts = expr.parts.map(p => {
      if (typeof p === "string") {
        return p.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
      }
      return `\${${this.gen_expr(p)}}`;
    });
    return "`" + parts.join("") + "`";
  }

  private gen_try_catch(expr: HExpr & { kind: "try_catch" }): string {
    const body_has_fail = expr.body.effects.effects.some(e => e.kind === "fail");
    const body = this.gen_expr(expr.body);
    const handler = this.gen_expr(expr.handler);

    if (!body_has_fail) {
      // Body doesn't produce fail effect — or/catch is a no-op
      return body;
    }

    if (expr.error_binding) {
      const binding = safe_ident(expr.error_binding);
      if (expr.error_type) {
        const type_name = safe_ident(expr.error_type);
        return `(function() { const ${evidence_param_name("fail")} = { raise: (${binding}) => { throw new ${RUNTIME_EFFECT_ABORT}("fail", ${binding}); } }; try { return ${body}; } catch (__ring_e) { if (__ring_e instanceof ${RUNTIME_EFFECT_ABORT} && __ring_e.effect === "fail" && __ring_e.value instanceof ${type_name}) { const ${binding} = __ring_e.value; return ${handler}; } throw __ring_e; } })()`;
      }
      return `(function() { const ${evidence_param_name("fail")} = { raise: (${binding}) => { throw new ${RUNTIME_EFFECT_ABORT}("fail", ${binding}); } }; try { return ${body}; } catch (__ring_e) { if (__ring_e instanceof ${RUNTIME_EFFECT_ABORT} && __ring_e.effect === "fail") { const ${binding} = __ring_e.value; return ${handler}; } throw __ring_e; } })()`;
    } else {
      return `(function() { const ${evidence_param_name("fail")} = { raise: (__ring_err) => { throw new ${RUNTIME_EFFECT_ABORT}("fail", undefined); } }; try { return ${body}; } catch (__ring_e) { if (__ring_e instanceof ${RUNTIME_EFFECT_ABORT} && __ring_e.effect === "fail") return ${handler}; throw __ring_e; } })()`;
    }
  }

  private gen_handle(expr: HExpr & { kind: "handle_expr" }): string {
    // Group handlers by effect name
    const by_effect = new Map<string, typeof expr.handlers>();
    for (const h of expr.handlers) {
      const existing = by_effect.get(h.effect_name) ?? [];
      existing.push(h);
      by_effect.set(h.effect_name, existing);
    }

    // Build evidence objects for each handled effect
    const ev_decls: string[] = [];
    let has_abort = false;

    for (const [effect_name, handlers] of by_effect) {
      const entries: string[] = [];
      for (const h of handlers) {
        const params = h.params.map(p => safe_ident(p.name)).join(", ");
        const body = this.gen_expr(h.body);
        const is_abort = effect_name === "fail" && h.op_name === "raise";
        if (is_abort) {
          has_abort = true;
          entries.push(`${h.op_name}: (${params}) => { throw new ${RUNTIME_EFFECT_ABORT}("${effect_name}", ${body}); }`);
        } else {
          entries.push(`${h.op_name}: (${params}) => (${body})`);
        }
      }
      const ev_name = evidence_param_name(effect_name);
      ev_decls.push(`const ${ev_name} = { ${entries.join(", ")} };`);
    }

    // Generate body
    const ev_param_names = [...by_effect.keys()].sort().map(n => evidence_param_name(n));
    const ev_arg_names = ev_param_names.join(", ");
    const body_code = this.gen_handle_body(expr.body, ev_arg_names);
    const decls = ev_decls.join(" ");

    if (has_abort) {
      return `(function() { ${decls} try { return ${body_code}; } catch (__ring_e) { if (__ring_e instanceof ${RUNTIME_EFFECT_ABORT}) return __ring_e.value; throw __ring_e; } })()`;
    } else {
      return `(function() { ${decls} return ${body_code}; })()`;
    }
  }

  private gen_handle_body(expr: HExpr, ev_params: string): string {
    if (expr.kind === "block") {
      const parts: string[] = [];
      parts.push(`(function(${ev_params}) {`);
      for (const stmt of (expr as HBlock).stmts) {
        parts.push("  " + this.gen_stmt_inline(stmt));
      }
      if ((expr as HBlock).tail) {
        parts.push(`  return ${this.gen_expr((expr as HBlock).tail!)};`);
      }
      parts.push(`})(${ev_params})`);
      return parts.join("\n");
    }
    return `(function(${ev_params}) { return ${this.gen_expr(expr)}; })(${ev_params})`;
  }

  private gen_lambda(expr: HExpr & { kind: "lambda" }): string {
    const params = expr.params.map(p => safe_ident(p.name));
    const ev_params = expr.type.kind === "fn" ? this.get_evidence_params(expr.type.effects) : [];
    const all_params = [...params, ...ev_params].join(", ");
    const body = this.gen_expr(expr.body);
    return `(function(${all_params}) { return ${body}; })`;
  }

  private gen_lambda_capture_evidence(expr: HExpr): string {
    if (expr.kind === "lambda") {
      const params = expr.params.map(p => safe_ident(p.name));
      const body = this.gen_expr(expr.body);
      return `(function(${params.join(", ")}) { return ${body}; })`;
    }
    const fn_expr = this.gen_expr(expr);
    if (expr.type.kind === "fn") {
      const arity = expr.type.params.length;
      const params = Array.from({ length: arity }, (_, i) => `__ring_a${i}`);
      const ev_args = this.get_callee_evidence_args(expr.type);
      const all_args = ev_args ? [...params, ev_args].join(", ") : params.join(", ");
      return `(function(${params.join(", ")}) { return ${fn_expr}(${all_args}); })`;
    }
    return fn_expr;
  }

  private gen_option_or(expr: HExpr & { kind: "option_or" }): string {
    const inner = this.gen_expr(expr.expr);
    const def = this.gen_expr(expr.default_value);
    return `((v) => v.${ENUM_TAG_FIELD} === "${OPTION_SOME_TAG}" ? v.${OPTION_PAYLOAD_FIELD} : ${def})(${inner})`;
  }

  private gen_try_block(expr: HExpr & { kind: "try_block" }): string {
    const body = this.gen_expr(expr.body);
    return `(function() { const ${evidence_param_name("fail")} = { raise: (__ring_err) => { throw new ${RUNTIME_EFFECT_ABORT}("fail", __ring_err); } }; try { return { ${ENUM_TAG_FIELD}: "${OPTION_SOME_TAG}", ${OPTION_PAYLOAD_FIELD}: ${body} }; } catch (__ring_e) { if (__ring_e instanceof ${RUNTIME_EFFECT_ABORT} && __ring_e.effect === "fail") return { ${ENUM_TAG_FIELD}: "${OPTION_NONE_TAG}" }; throw __ring_e; } })()`;
  }

  private gen_option_unwrap(expr: HExpr & { kind: "option_unwrap" }): string {
    const inner = this.gen_expr(expr.expr);
    return `((v) => v.${ENUM_TAG_FIELD} === "${OPTION_SOME_TAG}" ? v.${OPTION_PAYLOAD_FIELD} : ${evidence_param_name("fail")}.raise(undefined))(${inner})`;
  }

  private gen_effect_op(expr: HExpr & { kind: "effect_op" }): string {
    const ev_name = evidence_param_name(expr.effect_name);
    const args = expr.args.map(a => this.gen_expr(a)).join(", ");
    return `${ev_name}.${expr.op_name}(${args})`;
  }
}

// ============================================================
// Utilities
// ============================================================

function effect_name(e: Effect): string {
  switch (e.kind) {
    case "io": return "io";
    case "fail": return "fail";
    case "mut": return "mut";
    case "custom": return e.name;
    default: return assertNever(e, "effect_name");
  }
}

function extract_effect_names(effects: EffectRow): string[] {
  const names: string[] = [];
  for (const e of effects.effects) {
    const n = effect_name(e);
    if (!names.includes(n)) names.push(n);
  }
  names.sort();
  return names;
}

// ============================================================
// Public API
// ============================================================

export function generate(program: HProgram): string {
  const gen = new CodeGenerator();
  return gen.generate(program);
}
