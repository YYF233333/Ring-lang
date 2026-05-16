// Ring-lang HIR → JavaScript code generator

import {
  HProgram, HDecl, HFnDecl, HStructDecl, HEnumDecl, HImplDecl,
  HEffectDecl, HTestDecl, HStmt, HExpr, HBlock, HMatchArm,
  HParam, HEffectHandler,
} from "../hir/index.js";
import { Pattern } from "../ast/index.js";
import { RUNTIME_CODE } from "./runtime.js";

// ============================================================
// CodeGenerator class
// ============================================================

class CodeGenerator {
  private lines: string[] = [];
  private indent_level = 0;

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
    }
  }

  private emit_fn_decl(decl: HFnDecl, prefix?: string): void {
    const name = prefix ? `${prefix}_${decl.name}` : decl.name;
    const params = decl.params.map(p => p.name).join(", ");
    this.emit(`function ${name}(${params}) {`);
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
      if (variant.fields.length === 0) {
        // Unit variant — constant object
        this.emit(
          `const ${decl.name}_${variant.name} = Object.freeze({ _tag: "${variant.name}" });`
        );
      } else {
        // Variant with fields — factory function
        const params = variant.fields.map((_, i) => `_${i}`).join(", ");
        this.emit(`function ${decl.name}_${variant.name}(${params}) {`);
        this.push_indent();
        const field_assigns = variant.fields.map((_, i) => `_${i}`).join(", ");
        this.emit(`return { _tag: "${variant.name}", ${field_assigns} };`);
        this.pop_indent();
        this.emit("}");
      }
    }
  }

  private emit_impl_decl(decl: HImplDecl): void {
    for (const method of decl.methods) {
      this.emit_fn_decl(method, decl.target_type);
    }
  }

  private emit_effect_decl(_decl: HEffectDecl): void {
    // Effect declarations don't produce runtime code directly.
    // The operations are translated at call sites.
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
        this.emit(`const ${stmt.name} = ${this.gen_expr(stmt.init)};`);
        break;
      case "var_stmt":
        this.emit(`let ${stmt.name} = ${this.gen_expr(stmt.init)};`);
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
        return expr.resolved_name ?? expr.name;
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
    }
  }

  private gen_call(expr: HExpr & { kind: "call" }): string {
    const callee = this.gen_expr(expr.callee);
    const args = expr.args.map(a => this.gen_expr(a)).join(", ");
    return `${callee}(${args})`;
  }

  private gen_struct_lit(expr: HExpr & { kind: "struct_lit" }): string {
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
            return `const ${f.name} = __m._${i}; `;
          }
          return "";
        }).join("");
        const guard = arm.guard ? `if (!(${this.gen_expr(arm.guard)})) break; ` : "";
        const body = this.gen_expr(arm.body);
        return `    case "${pat.name}": { ${bindings}${guard}return ${body}; }`;
      }
      case "wildcard": {
        const body = this.gen_expr(arm.body);
        return `    default: return ${body};`;
      }
      case "binding": {
        const body = this.gen_expr(arm.body);
        return `    default: { const ${pat.name} = __m; return ${body}; }`;
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

    // Otherwise emit as IIFE
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
        // Escape backticks and ${} in literal parts
        return p.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
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
      // Translate as try/catch
      const body = this.gen_expr(expr.body);
      const handler_parts: string[] = [];
      for (const h of expr.handlers) {
        const params = h.params.map(p => p.name).join(", ");
        handler_parts.push(`const ${params || "__err"} = ${h.params.length > 0 ? h.params[0].name : "__err"}; return ${this.gen_expr(h.body)};`);
      }
      const catch_binding = expr.handlers[0]?.params[0]?.name ?? "__err";
      const catch_body = this.gen_expr(expr.handlers[0].body);
      return `(function() { try { return ${body}; } catch (${catch_binding}) { return ${catch_body}; } })()`;
    }

    // General effect handling via generators
    const body = this.gen_expr(expr.body);
    const handler_entries = expr.handlers.map(h => {
      const key = `"${h.effect_name}.${h.op_name}"`;
      const params = h.params.map(p => p.name);
      const resume = h.resume_name ?? "__resume";
      const handler_body = this.gen_expr(h.body);
      return `${key}: function(args, ${resume}) { ${params.map((p, i) => `const ${p} = args[${i}];`).join(" ")} return ${handler_body}; }`;
    });
    return `__run_handler((function*() { return ${body}; })(), { ${handler_entries.join(", ")} })`;
  }

  private gen_lambda(expr: HExpr & { kind: "lambda" }): string {
    const params = expr.params.map(p => p.name).join(", ");
    const body = this.gen_expr(expr.body);
    return `(function(${params}) { return ${body}; })`;
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
