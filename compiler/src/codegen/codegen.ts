// Ring-lang HIR → JavaScript code generator
// This is the thin shell — delegates to codegen-ctx, codegen-decl, codegen-stmt, codegen-expr.

import {
  HProgram, HFnDecl, HTraitDecl, HExpr, HStmt, HBlock,
  BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_STR, BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_BOOL, BUILTIN_CELL, BUILTIN_OPTION,
} from "../hir/index.js";
import {
  CELL_METHODS, STR_METHODS, INT_METHODS, FLOAT_METHODS,
  LIST_NON_HOF_METHODS, MAP_NON_HOF_METHODS, SET_NON_HOF_METHODS, OPTION_NON_HOF_METHODS,
} from "../builtin-methods.js";
import { RUNTIME_CODE } from "./runtime.js";

// Import from split modules
import type { CodegenCtx } from "./codegen-ctx.js";
import { safe_ident, get_evidence_params } from "./codegen-ctx.js";
import { emit_decl, emit_toplevel_evidence } from "./codegen-decl.js";
import { emit_stmt, emit_in_stmt_context, emit_block_in_stmt_context, emit_block_body, gen_stmt_inline } from "./codegen-stmt.js";
import { gen_expr } from "./codegen-expr.js";
import { emit_derived_impl, get_derived_method_names } from "./codegen-derive.js";

// Re-export public API types
export { safe_ident, CodegenOptions } from "./codegen-ctx.js";
export type { CodegenCtx } from "./codegen-ctx.js";

// ============================================================
// CodeGenerator class — thin shell implementing CodegenCtx
// ============================================================

class CodeGenerator implements CodegenCtx {
  lines: string[] = [];
  indent_level = 0;
  impl_methods: Map<string, string | undefined> = new Map();
  struct_field_order: Map<string, string[]> = new Map();
  trait_decls: Map<string, HTraitDecl> = new Map();
  dt_counter = 0;
  loop_counter = 0;
  match_counter = 0;
  module_prefix?: string;
  imports_map?: Map<string, string>;
  skip_preamble: boolean;
  skip_main_call: boolean;
  local_names = new Set<string>();
  local_fn_effects = new Map<string, import("../types/index.js").EffectRow>();
  current_fn_effects?: import("../types/index.js").EffectRow;
  in_try_fail = false;
  module_imports?: string[];
  module_exports?: string[];

  constructor(options?: import("./codegen-ctx.js").CodegenOptions) {
    this.skip_preamble = options?.skip_preamble ?? false;
    this.skip_main_call = options?.skip_main_call ?? false;
    if (options?.module_prefix) this.module_prefix = options.module_prefix;
    if (options?.imports_map) this.imports_map = options.imports_map;
    if (options?.external_struct_fields) {
      for (const [k, v] of options.external_struct_fields) this.struct_field_order.set(k, v);
    }
    if (options?.external_impl_methods) {
      for (const [k, v] of options.external_impl_methods) this.impl_methods.set(k, v);
    }
    if (options?.module_imports) this.module_imports = options.module_imports;
    if (options?.module_exports) this.module_exports = options.module_exports;
  }

  // ============================================================
  // Utility methods (CodegenCtx interface)
  // ============================================================

  qualify(name: string): string {
    if (this.imports_map?.has(name) && !this.local_names.has(name)) {
      return this.imports_map.get(name)!;
    }
    if (this.module_prefix && this.local_names.has(name)) {
      return `${this.module_prefix}$${safe_ident(name)}`;
    }
    return safe_ident(name);
  }

  private indent(): string {
    return "  ".repeat(this.indent_level);
  }

  emit(line: string): void {
    this.lines.push(this.indent() + line);
  }

  emit_raw(text: string): void {
    this.lines.push(text);
  }

  push_indent(): void {
    this.indent_level++;
  }

  pop_indent(): void {
    this.indent_level--;
  }

  // ============================================================
  // Cross-module callbacks (delegate to split modules)
  // ============================================================

  gen_expr(expr: HExpr): string {
    return gen_expr(this, expr);
  }

  emit_stmt(stmt: HStmt): void {
    emit_stmt(this, stmt);
  }

  emit_in_stmt_context(expr: HExpr, mode: "return" | "discard"): void {
    emit_in_stmt_context(this, expr, mode);
  }

  emit_block_in_stmt_context(block: HBlock, mode: "return" | "discard"): void {
    emit_block_in_stmt_context(this, block, mode);
  }

  emit_block_body(block: HBlock): void {
    emit_block_body(this, block);
  }

  gen_stmt_inline(stmt: HStmt): string {
    return gen_stmt_inline(this, stmt);
  }

  // ============================================================
  // Top-level generation
  // ============================================================

  generate(program: HProgram): string {
    // ESM mode: emit import statements at top of file
    if (this.module_imports) {
      for (const imp of this.module_imports) {
        this.emit_raw(imp);
      }
      this.emit_raw("");
    }

    // Collect names declared in this module (for qualify — only these get module_prefix)
    for (const decl of program.decls) {
      switch (decl.kind) {
        case "fn_decl":
          this.local_names.add(decl.name);
          if (decl.effects.effects.length > 0) {
            this.local_fn_effects.set(decl.name, decl.effects);
          }
          break;
        case "struct_decl": this.local_names.add(decl.name); break;
        case "enum_decl":
          this.local_names.add(decl.name);
          for (const v of decl.variants) {
            this.local_names.add(v.name);
            this.local_names.add(`${decl.name}_${v.name}`);
          }
          break;
        case "impl_decl": this.local_names.add(decl.target_type); break;
        case "trait_decl": this.local_names.add(decl.name); break;
        case "effect_decl": this.local_names.add(decl.name); break;
        case "test_decl": break;
        case "extern_fn_decl": break;
        case "extern_type_decl": break;
        case "type_alias_decl": break;
      }
    }

    // Compute transitive effect closure: if fn A calls fn B which has effects,
    // A also needs those effects (for evidence forwarding).
    if (this.local_fn_effects.size > 0) {
      const fn_callees = new Map<string, Set<string>>();
      for (const decl of program.decls) {
        if (decl.kind === "fn_decl") {
          const callees = new Set<string>();
          collect_local_calls(decl.body, this.local_names, callees);
          fn_callees.set(decl.name, callees);
        }
      }
      let changed = true;
      while (changed) {
        changed = false;
        for (const [name, callees] of fn_callees) {
          for (const callee of callees) {
            const callee_effects = this.local_fn_effects.get(callee);
            if (!callee_effects) continue;
            const current = this.local_fn_effects.get(name);
            if (!current) {
              this.local_fn_effects.set(name, { effects: [...callee_effects.effects], tail: undefined });
              changed = true;
            } else {
              for (const e of callee_effects.effects) {
                const ename = e.kind === "custom" ? e.name : e.kind;
                if (!current.effects.some(ce => (ce.kind === "custom" ? ce.name : ce.kind) === ename)) {
                  current.effects.push(e);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }

    // Collect struct field orders and impl method signatures
    for (const decl of program.decls) {
      if (decl.kind === "struct_decl") {
        this.struct_field_order.set(this.qualify(decl.name), decl.fields.map(f => f.name));
      } else if (decl.kind === "impl_decl") {
        for (const method of decl.methods) {
          const key = `${this.qualify(decl.target_type)}.${method.name}`;
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

    // Register built-in impl methods from shared registry (hir/index.ts)
    for (const m of CELL_METHODS) this.impl_methods.set(`${safe_ident(BUILTIN_CELL)}.${m}`, undefined);
    for (const m of STR_METHODS) this.impl_methods.set(`${safe_ident(BUILTIN_STR)}.${m}`, undefined);
    for (const m of LIST_NON_HOF_METHODS) this.impl_methods.set(`${safe_ident(BUILTIN_LIST)}.${m}`, undefined);
    for (const m of MAP_NON_HOF_METHODS) this.impl_methods.set(`${safe_ident(BUILTIN_MAP)}.${m}`, undefined);
    for (const m of SET_NON_HOF_METHODS) this.impl_methods.set(`${safe_ident(BUILTIN_SET)}.${m}`, undefined);
    for (const m of INT_METHODS) this.impl_methods.set(`${safe_ident(BUILTIN_INT)}.${m}`, undefined);
    for (const m of FLOAT_METHODS) this.impl_methods.set(`${safe_ident(BUILTIN_FLOAT)}.${m}`, undefined);
    for (const m of OPTION_NON_HOF_METHODS) this.impl_methods.set(`${safe_ident(BUILTIN_OPTION)}.${m}`, undefined);

    // Register builtin trait methods for UFCS dispatch on primitives and builtins
    for (const prim of [BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL]) {
      this.impl_methods.set(`${safe_ident(prim)}.debug`, "Debug");
    }
    for (const coll of [BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION]) {
      this.impl_methods.set(`${safe_ident(coll)}.debug`, "Debug");
    }

    // Emit runtime preamble (skipped for non-root modules in multi-file builds)
    if (!this.skip_preamble) {
      this.emit_raw(RUNTIME_CODE);
      this.emit_raw("");
    }

    // Register auto-derived impl methods for UFCS dispatch BEFORE emitting declarations,
    // so method calls (e.g. .clone(), .eq()) in user code resolve correctly.
    for (const impl of program.derived_impls) {
      for (const method_name of get_derived_method_names(impl.trait_name)) {
        const key = `${this.qualify(impl.type_name)}.${method_name}`;
        if (!this.impl_methods.has(key)) {
          this.impl_methods.set(key, impl.trait_name);
        }
      }
    }

    // Emit declarations
    for (const decl of program.decls) {
      emit_decl(this, decl);
      this.emit_raw("");
    }

    // Emit auto-derived trait implementations
    for (const impl of program.derived_impls) {
      emit_derived_impl(this, impl);
      this.emit_raw("");
    }

    // Auto-call main() if present, with top-level evidence if needed
    if (!this.skip_main_call) {
      const main_decl = program.decls.find(
        d => d.kind === "fn_decl" && d.name === "main"
      ) as HFnDecl | undefined;
      if (main_decl) {
        const fn_name = this.qualify("main");
        const ev_params = get_evidence_params(main_decl.effects);
        if (ev_params.length > 0) {
          emit_toplevel_evidence(this, main_decl.effects);
          this.emit(`${fn_name}(${ev_params.join(", ")});`);
        } else {
          this.emit(`${fn_name}();`);
        }
      }
    }

    // ESM mode: emit export statement at bottom of file
    if (this.module_exports && this.module_exports.length > 0) {
      this.emit_raw("");
      this.emit_raw(`export { ${this.module_exports.join(", ")} };`);
    }

    return this.lines.join("\n");
  }

}

// ============================================================
// Public API
// ============================================================

export function generate(program: HProgram, options?: import("./codegen-ctx.js").CodegenOptions): string {
  const gen = new CodeGenerator(options);
  return gen.generate(program);
}

// Walk HIR to collect local function names called from an expression tree
function collect_local_calls(expr: HExpr, local_names: Set<string>, out: Set<string>): void {
  switch (expr.kind) {
    case "call":
      if (expr.callee.kind === "ident" && local_names.has(expr.callee.name)) {
        out.add(expr.callee.name);
      }
      collect_local_calls(expr.callee, local_names, out);
      for (const a of expr.args) collect_local_calls(a, local_names, out);
      break;
    case "block":
      for (const s of expr.stmts) collect_local_calls_stmt(s, local_names, out);
      if (expr.tail) collect_local_calls(expr.tail, local_names, out);
      break;
    case "if_expr":
      collect_local_calls(expr.condition, local_names, out);
      collect_local_calls(expr.then_branch, local_names, out);
      if (expr.else_branch) collect_local_calls(expr.else_branch, local_names, out);
      break;
    case "match_expr":
      collect_local_calls(expr.scrutinee, local_names, out);
      for (const arm of expr.arms) {
        collect_local_calls(arm.body, local_names, out);
        if (arm.guard) collect_local_calls(arm.guard, local_names, out);
      }
      break;
    case "bin_op":
      collect_local_calls(expr.left, local_names, out);
      collect_local_calls(expr.right, local_names, out);
      break;
    case "unary_op":
      collect_local_calls(expr.operand, local_names, out);
      break;
    case "field_access":
      collect_local_calls(expr.receiver, local_names, out);
      break;
    case "struct_lit":
      for (const f of expr.fields) collect_local_calls(f.value, local_names, out);
      if (expr.spread) collect_local_calls(expr.spread, local_names, out);
      break;
    case "named_variant_construct":
      for (const f of expr.fields) collect_local_calls(f.value, local_names, out);
      if (expr.spread) collect_local_calls(expr.spread, local_names, out);
      break;
    case "string_interp":
      for (const p of expr.parts) {
        if (typeof p !== "string") collect_local_calls(p, local_names, out);
      }
      break;
    case "try_catch":
      collect_local_calls(expr.body, local_names, out);
      collect_local_calls(expr.handler, local_names, out);
      break;
    case "handle_expr":
      collect_local_calls(expr.body, local_names, out);
      for (const h of expr.handlers) collect_local_calls(h.body, local_names, out);
      break;
    case "lambda":
      collect_local_calls(expr.body, local_names, out);
      break;
    case "try_block":
      collect_local_calls(expr.body, local_names, out);
      break;
    case "option_unwrap":
      collect_local_calls(expr.expr, local_names, out);
      break;
    case "option_or":
      collect_local_calls(expr.expr, local_names, out);
      collect_local_calls(expr.default_value, local_names, out);
      break;
    case "range":
      collect_local_calls(expr.start, local_names, out);
      collect_local_calls(expr.end, local_names, out);
      break;
    case "list_lit":
      for (const e of expr.elements) collect_local_calls(e, local_names, out);
      break;
    case "tuple_lit":
      for (const e of expr.elements) collect_local_calls(e, local_names, out);
      break;
    case "effect_op":
      for (const a of expr.args) collect_local_calls(a, local_names, out);
      break;
    default:
      break;
  }
}

function collect_local_calls_stmt(stmt: HStmt, local_names: Set<string>, out: Set<string>): void {
  switch (stmt.kind) {
    case "let_stmt": case "var_stmt":
      collect_local_calls(stmt.init, local_names, out);
      break;
    case "assign_stmt":
      collect_local_calls(stmt.target, local_names, out);
      collect_local_calls(stmt.value, local_names, out);
      break;
    case "expr_stmt":
      collect_local_calls(stmt.expr, local_names, out);
      break;
    case "return_stmt":
      if (stmt.value) collect_local_calls(stmt.value, local_names, out);
      break;
    case "while_stmt":
      collect_local_calls(stmt.condition, local_names, out);
      collect_local_calls(stmt.body, local_names, out);
      break;
    case "for_in_stmt":
      collect_local_calls(stmt.iterable, local_names, out);
      collect_local_calls(stmt.body, local_names, out);
      break;
    case "let_destructure":
      collect_local_calls(stmt.init, local_names, out);
      break;
    case "if_let":
      collect_local_calls(stmt.expr, local_names, out);
      collect_local_calls(stmt.then_block, local_names, out);
      if (stmt.else_block) collect_local_calls(stmt.else_block, local_names, out);
      break;
    default:
      break;
  }
}
