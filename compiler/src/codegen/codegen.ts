// Ring-lang HIR → JavaScript code generator

import {
  HProgram, HDecl, HFnDecl, HStructDecl, HEnumDecl, HImplDecl,
  HEffectDecl, HTestDecl, HTraitDecl, HStmt, HExpr, HBlock, HMatchArm,
  variant_js_name, trait_dict_name,
} from "../hir/index.js";
import { Pattern } from "../ast/index.js";
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
          this.impl_methods.set(`${decl.target_type}.${method.name}`, decl.trait_name);
        }
      } else if (decl.kind === "trait_decl") {
        this.trait_decls.set(decl.name, decl);
      }
    }

    // Emit runtime preamble
    this.emit_raw(RUNTIME_CODE);

    // Emit declarations
    for (const decl of program.decls) {
      this.emit_decl(decl);
      this.emit_raw("");
    }

    // Auto-call main() if present
    const has_main = program.decls.some(
      d => d.kind === "fn_decl" && d.name === "main"
    );
    if (has_main) {
      this.emit("main();");
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

  private has_non_fail_effects(effects: { effects: { kind: string }[] }): boolean {
    return effects.effects.some(e => e.kind !== "fail");
  }

  private emit_fn_decl(decl: HFnDecl, prefix?: string): void {
    const name = prefix ? `${prefix}_${safe_ident(decl.name)}` : safe_ident(decl.name);
    const param_names = decl.params.map(p => safe_ident(p.name));
    const dict_params = (decl.trait_bounds ?? []).map(b => `__${b.type_param}_${b.trait_name}`);
    const all_params = [...param_names, ...dict_params].join(", ");
    const star = this.has_non_fail_effects(decl.effects) ? "*" : "";
    this.emit(`function${star} ${name}(${all_params}) {`);
    this.push_indent();
    this.emit_block_body(decl.body);
    this.pop_indent();
    this.emit("}");
  }

  private emit_struct_decl(decl: HStructDecl): void {
    const fields = decl.fields.map(f => f.name);
    this.emit(`class ${decl.name} {`);
    this.push_indent();
    this.emit(`constructor(${fields.join(", ")}) {`);
    this.push_indent();
    for (const f of fields) {
      this.emit(`this.${f} = ${f};`);
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
          `const ${js_name} = Object.freeze({ _tag: "${variant.name}" });`
        );
      } else {
        const params = variant.fields.map((_, i) => `_${i}`).join(", ");
        this.emit(`function ${js_name}(${params}) {`);
        this.push_indent();
        const field_assigns = variant.fields.map((_, i) => `_${i}`).join(", ");
        this.emit(`return { _tag: "${variant.name}", ${field_assigns} };`);
        this.pop_indent();
        this.emit("}");
      }
    }
  }

  private emit_impl_decl(decl: HImplDecl): void {
    const prefix = decl.trait_name
      ? `${decl.target_type}_${decl.trait_name}`
      : decl.target_type;
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
        const all_params = [`__self_${safe_ident(decl.name)}`, ...param_names].join(", ");
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
      this.emit(`return ${this.gen_expr(block.tail)};`);
    }
  }

  // ============================================================
  // Statements
  // ============================================================

  private emit_stmt(stmt: HStmt): void {
    switch (stmt.kind) {
      case "let_stmt":
        this.emit(`const ${safe_ident(stmt.name)} = ${this.gen_expr(stmt.init)};`);
        break;
      case "var_stmt":
        this.emit(`let ${safe_ident(stmt.name)} = ${this.gen_expr(stmt.init)};`);
        break;
      case "assign_stmt":
        this.emit(`${this.gen_expr(stmt.target)} = ${this.gen_expr(stmt.value)};`);
        break;
      case "expr_stmt":
        this.emit(`${this.gen_expr(stmt.expr)};`);
        break;
      case "return_stmt":
        if (stmt.value) {
          this.emit(`return ${this.gen_expr(stmt.value)};`);
        } else {
          this.emit("return;");
        }
        break;
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
      case "ident":
        return safe_ident(expr.resolved_name ?? expr.name);
      case "bin_op":
        return `(${this.gen_expr(expr.left)} ${expr.op} ${this.gen_expr(expr.right)})`;
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
      default:
        return assertNever(expr, "gen_expr");
    }
  }

  private needs_yield_star(callee_type: any): boolean {
    return callee_type?.kind === "fn" && this.has_non_fail_effects(callee_type.effects);
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

    // Detect UFCS method call: call(field_access(receiver, method), args)
    if (expr.callee.kind === "field_access") {
      const recv_type = expr.callee.receiver.type;
      const method = expr.callee.field;
      const type_name = recv_type.kind === "struct" ? recv_type.name
        : recv_type.kind === "enum" ? recv_type.name
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
        const prefix = this.needs_yield_star(expr.callee.type) ? "yield* " : "";
        return `${prefix}${fn_name}(${all_args})`;
      }
    }

    // Task 8c: Pass dictionary args at call sites
    const callee = this.gen_expr(expr.callee);
    const args = expr.args.map(a => this.gen_expr(a)).join(", ");
    const dict_args = (expr.resolved_dicts ?? []).join(", ");
    const all_args = [args, dict_args].filter(s => s.length > 0).join(", ");
    const prefix = this.needs_yield_star(expr.callee.type) ? "yield* " : "";
    return `${prefix}${callee}(${all_args})`;
  }

  private gen_struct_lit(expr: HExpr & { kind: "struct_lit" }): string {
    const declared_order = this.struct_field_order.get(expr.name);
    if (declared_order) {
      const field_map = new Map(expr.fields.map(f => [f.name, f.value]));
      const args = declared_order.map(name => {
        const val = field_map.get(name);
        return val ? this.gen_expr(val) : "undefined";
      }).join(", ");
      return `new ${expr.name}(${args})`;
    }
    const args = expr.fields.map(f => this.gen_expr(f.value)).join(", ");
    return `new ${expr.name}(${args})`;
  }

  private gen_match(expr: HExpr & { kind: "match_expr" }): string {
    const scrutinee = this.gen_expr(expr.scrutinee);
    const parts: string[] = [];
    parts.push("(function() {");
    parts.push(`  const __m = ${scrutinee};`);

    // Determine if this is a tag-based match (enum) or value-based
    const has_constructor = expr.arms.some(a => a.pattern.kind === "constructor");
    if (has_constructor) {
      parts.push("  switch (__m._tag) {");
      for (const arm of expr.arms) {
        const arm_code = this.gen_match_arm(arm);
        parts.push(arm_code);
      }
      parts.push("    default: __match_fail(__m);");
      parts.push("  }");
    } else {
      // Use if-chain for literal/binding/wildcard patterns
      for (let i = 0; i < expr.arms.length; i++) {
        const arm = expr.arms[i];
        const cond = this.gen_pattern_condition("__m", arm.pattern);
        const bindings = this.gen_pattern_bindings("__m", arm.pattern);
        const body = this.gen_expr(arm.body);
        if (cond === "true") {
          // Wildcard or binding — always matches
          parts.push(`  ${bindings}return ${body};`);
        } else {
          const guard = arm.guard ? ` && ${this.gen_expr(arm.guard)}` : "";
          parts.push(`  if (${cond}${guard}) { ${bindings}return ${body}; }`);
        }
      }
      parts.push("  __match_fail(__m);");
    }

    parts.push("})()");
    return parts.join("\n");
  }

  private gen_match_arm(arm: HMatchArm): string {
    const pat = arm.pattern;
    switch (pat.kind) {
      case "constructor": {
        const bindings = pat.fields.map((f, i) => {
          if (f.kind === "binding") {
            return `const ${safe_ident(f.name)} = __m._${i}; `;
          }
          return "";
        }).join("");
        if (arm.guard) {
          const body = this.gen_expr(arm.body);
          return `    case "${pat.name}": { ${bindings}if (${this.gen_expr(arm.guard)}) { return ${body}; } break; }`;
        }
        const body = this.gen_expr(arm.body);
        return `    case "${pat.name}": { ${bindings}return ${body}; }`;
      }
      case "wildcard": {
        const body = this.gen_expr(arm.body);
        return `    default: return ${body};`;
      }
      case "binding": {
        const body = this.gen_expr(arm.body);
        return `    default: { const ${safe_ident(pat.name)} = __m; return ${body}; }`;
      }
      case "literal": {
        // Literal in a tag-switch doesn't make sense, but handle gracefully
        const body = this.gen_expr(arm.body);
        return `    /* literal ${JSON.stringify(pat.value)} */ default: return ${body};`;
      }
    }
  }

  private gen_pattern_condition(target: string, pat: Pattern): string {
    switch (pat.kind) {
      case "wildcard":
        return "true";
      case "binding":
        return "true";
      case "literal":
        return `${target} === ${JSON.stringify(pat.value)}`;
      case "constructor":
        return `${target}._tag === "${pat.name}"`;
    }
  }

  private gen_pattern_bindings(target: string, pat: Pattern): string {
    switch (pat.kind) {
      case "wildcard":
        return "";
      case "binding":
        return `const ${pat.name} = ${target}; `;
      case "literal":
        return "";
      case "constructor":
        return pat.fields.map((f, i) => {
          if (f.kind === "binding") {
            return `const ${f.name} = ${target}._${i}; `;
          }
          return "";
        }).join("");
    }
  }

  private gen_block_expr(block: HBlock): string {
    // If block has no stmts and just a tail, emit tail directly
    if (block.stmts.length === 0 && block.tail) {
      return this.gen_expr(block.tail);
    }

    // If block has non-fail effects, use generator IIFE with yield* delegation
    const needs_generator = this.has_non_fail_effects(block.effects);
    const parts: string[] = [];
    if (needs_generator) {
      parts.push("yield* (function*() {");
    } else {
      parts.push("(function() {");
    }
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
        return `const ${stmt.name} = ${this.gen_expr(stmt.init)};`;
      case "var_stmt":
        return `let ${stmt.name} = ${this.gen_expr(stmt.init)};`;
      case "assign_stmt":
        return `${this.gen_expr(stmt.target)} = ${this.gen_expr(stmt.value)};`;
      case "expr_stmt":
        return `${this.gen_expr(stmt.expr)};`;
      case "return_stmt":
        if (stmt.value) {
          return `return ${this.gen_expr(stmt.value)};`;
        }
        return "return;";
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
    const body = this.gen_expr(expr.body);
    const binding = expr.error_binding ?? "__e";
    const handler = this.gen_expr(expr.handler);
    return `(function() { try { return ${body}; } catch (${binding}) { return ${handler}; } })()`;
  }

  private gen_handle(expr: HExpr & { kind: "handle_expr" }): string {
    // Check if this is a simple fail-only handler
    const is_fail_only = expr.handlers.every(h => h.effect_name === "fail");

    if (is_fail_only) {
      const body = this.gen_expr(expr.body);
      const h = expr.handlers[expr.handlers.length - 1];
      const catch_binding = h.params[0]?.name ?? "__err";
      const catch_body = this.gen_expr(h.body);
      return `(function() { try { return ${body}; } catch (${catch_binding}) { return ${catch_body}; } })()`;
    }

    // General effect handling via generators
    const handler_entries = expr.handlers.map(h => {
      const key = `"${h.effect_name}.${h.op_name}"`;
      const params = h.params.map(p => p.name);
      const resume = h.resume_name ?? "__resume";
      const handler_body = this.gen_expr(h.body);
      return `${key}: function(args, ${resume}) { ${params.map((p, i) => `const ${p} = args[${i}];`).join(" ")} return ${handler_body}; }`;
    });
    const gen_body = this.gen_generator_body(expr.body);
    return `__run_handler((function*() { ${gen_body} })(), { ${handler_entries.join(", ")} })`;
  }

  private gen_lambda(expr: HExpr & { kind: "lambda" }): string {
    const params = expr.params.map(p => safe_ident(p.name)).join(", ");
    const body = this.gen_expr(expr.body);
    return `(function(${params}) { return ${body}; })`;
  }

  private gen_generator_body(expr: HExpr): string {
    if (expr.kind === "block") {
      const parts: string[] = [];
      for (const stmt of expr.stmts) {
        parts.push(this.gen_stmt_inline(stmt));
      }
      if (expr.tail) {
        parts.push(`return ${this.gen_expr(expr.tail)};`);
      }
      return parts.join(" ");
    }
    return `return ${this.gen_expr(expr)};`;
  }

  private gen_effect_op(expr: HExpr & { kind: "effect_op" }): string {
    const args = expr.args.map(a => this.gen_expr(a)).join(", ");
    return `yield { effect: "${expr.effect_name}", op: "${expr.op_name}", args: [${args}] }`;
  }
}

// ============================================================
// Public API
// ============================================================

export function generate(program: HProgram): string {
  const gen = new CodeGenerator();
  return gen.generate(program);
}
