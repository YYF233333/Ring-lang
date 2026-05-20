// Ring-lang HIR → JavaScript code generator
// This is the thin shell — delegates to codegen-ctx, codegen-decl, codegen-stmt, codegen-expr.

import {
  HProgram, HFnDecl, HTraitDecl, HExpr, HStmt, HBlock,
  ENUM_TAG_FIELD, OPTION_SOME_TAG, OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD,
  BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_STR, BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_BOOL, BUILTIN_CELL, BUILTIN_OPTION,
  CELL_METHODS, STR_METHODS, INT_METHODS, FLOAT_METHODS,
  LIST_NON_HOF_METHODS, MAP_NON_HOF_METHODS, SET_NON_HOF_METHODS, OPTION_NON_HOF_METHODS,
  trait_dict_name, trait_bound_param_name,
} from "../hir/index.js";
import type { DerivedImpl, DerivedField } from "../hir/index.js";
import { RUNTIME_CODE } from "./runtime.js";

// Import from split modules
import type { CodegenCtx } from "./codegen-ctx.js";
import { safe_ident, get_evidence_params } from "./codegen-ctx.js";
import { emit_decl, emit_toplevel_evidence } from "./codegen-decl.js";
import { emit_stmt, emit_in_stmt_context, emit_block_in_stmt_context, emit_block_body, gen_stmt_inline } from "./codegen-stmt.js";
import { gen_expr } from "./codegen-expr.js";

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
  }

  // ============================================================
  // Utility methods (CodegenCtx interface)
  // ============================================================

  qualify(name: string): string {
    if (this.imports_map?.has(name)) return this.imports_map.get(name)!;
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
    // Collect names declared in this module (for qualify — only these get module_prefix)
    for (const decl of program.decls) {
      switch (decl.kind) {
        case "fn_decl": this.local_names.add(decl.name); break;
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
      this.emit_raw(`function Option_some(${OPTION_PAYLOAD_FIELD}) { return { ${ENUM_TAG_FIELD}: "${OPTION_SOME_TAG}", ${OPTION_PAYLOAD_FIELD} }; }`);
      this.emit_raw(`const Option_none = Object.freeze({ ${ENUM_TAG_FIELD}: "${OPTION_NONE_TAG}" });`);
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
      this.emit_derived_impl(impl);
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

    return this.lines.join("\n");
  }

  private emit_derived_impl(impl: DerivedImpl): void {
    if (impl.trait_name === "Eq") {
      emit_derived_eq(this, impl);
    }
    if (impl.trait_name === "Clone") {
      emit_derived_clone(this, impl);
    }
    if (impl.trait_name === "Ord") {
      emit_derived_ord(this, impl);
    }
    if (impl.trait_name === "Debug") {
      emit_derived_debug(this, impl);
    }
  }
}

// ============================================================
// Auto-derived trait helpers
// ============================================================

function get_derived_method_names(trait_name: string): string[] {
  switch (trait_name) {
    case "Eq": return ["eq", "ne"];
    case "Clone": return ["clone"];
    case "Debug": return ["debug"];
    case "Ord": return ["cmp"];
    default: return [];
  }
}

function emit_derived_eq(ctx: CodegenCtx, impl: DerivedImpl): void {
  const name = ctx.qualify(impl.type_name);
  const fn_name = `${name}_Eq_eq`;
  const dict_params = impl.bounds
    .filter(b => b.trait_name === "Eq")
    .map(b => trait_bound_param_name(b.type_param, b.trait_name));
  const all_params = ["self", "other", ...dict_params].join(", ");

  ctx.emit(`function ${fn_name}(${all_params}) {`);
  ctx.push_indent();

  if (impl.type_kind === "struct" && impl.struct_fields) {
    if (impl.struct_fields.length === 0) {
      ctx.emit("return true;");
    } else {
      const comparisons = impl.struct_fields.map(f => gen_field_eq(`self.${safe_ident(f.name)}`, `other.${safe_ident(f.name)}`, f));
      ctx.emit(`return ${comparisons.join(" && ")};`);
    }
  } else if (impl.type_kind === "enum" && impl.enum_variants) {
    ctx.emit(`if (self.${ENUM_TAG_FIELD} !== other.${ENUM_TAG_FIELD}) return false;`);
    const has_fields = impl.enum_variants.some(v => v.fields.length > 0);
    if (has_fields) {
      ctx.emit(`switch (self.${ENUM_TAG_FIELD}) {`);
      ctx.push_indent();
      for (const v of impl.enum_variants) {
        if (v.fields.length === 0) {
          ctx.emit(`case "${v.name}": return true;`);
        } else {
          const field_eqs = v.fields.map(f => {
            const accessor = v.has_named_fields ? safe_ident(f.name) : `_${f.positional_index}`;
            return gen_field_eq(`self.${accessor}`, `other.${accessor}`, f);
          });
          ctx.emit(`case "${v.name}": return ${field_eqs.join(" && ")};`);
        }
      }
      ctx.emit(`default: return true;`);
      ctx.pop_indent();
      ctx.emit(`}`);
    } else {
      ctx.emit("return true;");
    }
  }

  ctx.pop_indent();
  ctx.emit(`}`);

  // Emit dict object
  const dict_name = trait_dict_name(name, "Eq");
  ctx.emit(`const ${dict_name} = { eq: ${fn_name}, ne: function(${all_params}) { return !${fn_name}(${["self", "other", ...dict_params].join(", ")}); } };`);
}

function gen_field_eq(left: string, right: string, field: DerivedField): string {
  if (field.action === "identity") {
    return `(${left} === ${right})`;
  }
  const extra = field.action.extra_dicts.length > 0
    ? ", " + field.action.extra_dicts.join(", ") : "";
  return `${field.action.dict_name}.eq(${left}, ${right}${extra})`;
}

// ============================================================
// Auto-derived Clone
// ============================================================

function emit_derived_clone(ctx: CodegenCtx, impl: DerivedImpl): void {
  const name = ctx.qualify(impl.type_name);
  const fn_name = `${name}_Clone_clone`;
  const dict_params = impl.bounds
    .filter(b => b.trait_name === "Clone")
    .map(b => trait_bound_param_name(b.type_param, b.trait_name));
  const all_params = ["self", ...dict_params].join(", ");

  ctx.emit(`function ${fn_name}(${all_params}) {`);
  ctx.push_indent();

  if (impl.type_kind === "struct" && impl.struct_fields) {
    const args = impl.struct_fields.map(f =>
      gen_field_clone(`self.${safe_ident(f.name)}`, f)
    ).join(", ");
    ctx.emit(`return new ${name}(${args});`);
  } else if (impl.type_kind === "enum" && impl.enum_variants) {
    ctx.emit(`switch (self.${ENUM_TAG_FIELD}) {`);
    ctx.push_indent();
    for (const v of impl.enum_variants) {
      if (v.fields.length === 0) {
        // Unit variant: return the frozen singleton
        ctx.emit(`case "${v.name}": return ${name}_${v.name};`);
      } else {
        const args = v.fields.map(f => {
          const accessor = v.has_named_fields ? safe_ident(f.name) : `_${f.positional_index}`;
          return gen_field_clone(`self.${accessor}`, f);
        }).join(", ");
        ctx.emit(`case "${v.name}": return ${name}_${v.name}(${args});`);
      }
    }
    ctx.emit(`default: return self;`);
    ctx.pop_indent();
    ctx.emit(`}`);
  }

  ctx.pop_indent();
  ctx.emit(`}`);

  const dict_name = trait_dict_name(name, "Clone");
  ctx.emit(`const ${dict_name} = { clone: ${fn_name} };`);
}

function gen_field_clone(expr: string, field: DerivedField): string {
  if (field.action === "identity") {
    return expr;
  }
  const extra = field.action.extra_dicts.length > 0
    ? ", " + field.action.extra_dicts.join(", ") : "";
  return `${field.action.dict_name}.clone(${expr}${extra})`;
}

// ============================================================
// Auto-derived Ord
// ============================================================

function emit_derived_ord(ctx: CodegenCtx, impl: DerivedImpl): void {
  const name = ctx.qualify(impl.type_name);
  const fn_name = `${name}_Ord_cmp`;
  const dict_params = impl.bounds
    .filter(b => b.trait_name === "Ord")
    .map(b => trait_bound_param_name(b.type_param, b.trait_name));
  const all_params = ["self", "other", ...dict_params].join(", ");

  // For enums, emit tag order map before the function
  if (impl.type_kind === "enum" && impl.enum_variants) {
    const tag_entries = impl.enum_variants.map((v, i) => `"${v.name}": ${i}`).join(", ");
    ctx.emit(`const __${name}_tag_order = { ${tag_entries} };`);
  }

  ctx.emit(`function ${fn_name}(${all_params}) {`);
  ctx.push_indent();

  if (impl.type_kind === "struct" && impl.struct_fields) {
    if (impl.struct_fields.length === 0) {
      ctx.emit("return 0;");
    } else {
      ctx.emit("var c;");
      for (let i = 0; i < impl.struct_fields.length; i++) {
        const f = impl.struct_fields[i];
        const left = `self.${safe_ident(f.name)}`;
        const right = `other.${safe_ident(f.name)}`;
        const cmp = gen_field_cmp(left, right, f);
        if (i < impl.struct_fields.length - 1) {
          ctx.emit(`c = ${cmp};`);
          ctx.emit(`if (c !== 0) return c;`);
        } else {
          ctx.emit(`return ${cmp};`);
        }
      }
    }
  } else if (impl.type_kind === "enum" && impl.enum_variants) {
    ctx.emit(`var t1 = __${name}_tag_order[self.${ENUM_TAG_FIELD}];`);
    ctx.emit(`var t2 = __${name}_tag_order[other.${ENUM_TAG_FIELD}];`);
    ctx.emit(`if (t1 !== t2) return (t1 < t2 ? -1 : 1);`);

    const has_fields = impl.enum_variants.some(v => v.fields.length > 0);
    if (has_fields) {
      ctx.emit(`switch (self.${ENUM_TAG_FIELD}) {`);
      ctx.push_indent();
      for (const v of impl.enum_variants) {
        if (v.fields.length === 0) continue;
        if (v.fields.length === 1) {
          const f = v.fields[0];
          const accessor = v.has_named_fields ? safe_ident(f.name) : `_${f.positional_index}`;
          ctx.emit(`case "${v.name}": return ${gen_field_cmp(`self.${accessor}`, `other.${accessor}`, f)};`);
        } else {
          ctx.emit(`case "${v.name}": {`);
          ctx.push_indent();
          ctx.emit("var c;");
          for (let i = 0; i < v.fields.length; i++) {
            const f = v.fields[i];
            const accessor = v.has_named_fields ? safe_ident(f.name) : `_${f.positional_index}`;
            const cmp = gen_field_cmp(`self.${accessor}`, `other.${accessor}`, f);
            if (i < v.fields.length - 1) {
              ctx.emit(`c = ${cmp};`);
              ctx.emit(`if (c !== 0) return c;`);
            } else {
              ctx.emit(`return ${cmp};`);
            }
          }
          ctx.pop_indent();
          ctx.emit("}");
        }
      }
      ctx.emit(`default: return 0;`);
      ctx.pop_indent();
      ctx.emit(`}`);
    } else {
      ctx.emit("return 0;");
    }
  }

  ctx.pop_indent();
  ctx.emit(`}`);

  const dict_name = trait_dict_name(name, "Ord");
  ctx.emit(`const ${dict_name} = { cmp: ${fn_name} };`);
}

function gen_field_cmp(left: string, right: string, field: DerivedField): string {
  if (field.action === "identity") {
    return `(${left} < ${right} ? -1 : ${left} > ${right} ? 1 : 0)`;
  }
  const extra = field.action.extra_dicts.length > 0
    ? ", " + field.action.extra_dicts.join(", ") : "";
  return `${field.action.dict_name}.cmp(${left}, ${right}${extra})`;
}

// ============================================================
// Auto-derived Debug
// ============================================================

function emit_derived_debug(ctx: CodegenCtx, impl: DerivedImpl): void {
  const name = ctx.qualify(impl.type_name);
  const fn_name = `${name}_Debug_debug`;
  const dict_params = impl.bounds
    .filter(b => b.trait_name === "Debug")
    .map(b => trait_bound_param_name(b.type_param, b.trait_name));
  const all_params = ["self", ...dict_params].join(", ");

  ctx.emit(`function ${fn_name}(${all_params}) {`);
  ctx.push_indent();

  if (impl.type_kind === "struct" && impl.struct_fields) {
    if (impl.struct_fields.length === 0) {
      ctx.emit(`return "${impl.type_name}";`);
    } else {
      const parts = impl.struct_fields.map(f => {
        const val = gen_field_debug(`self.${safe_ident(f.name)}`, f);
        return `"${f.name}: " + ${val}`;
      });
      ctx.emit(`return "${impl.type_name} { " + ${parts.join(' + ", " + ')} + " }";`);
    }
  } else if (impl.type_kind === "enum" && impl.enum_variants) {
    ctx.emit(`switch (self.${ENUM_TAG_FIELD}) {`);
    ctx.push_indent();
    for (const v of impl.enum_variants) {
      if (v.fields.length === 0) {
        ctx.emit(`case "${v.name}": return "${v.name}";`);
      } else if (v.has_named_fields) {
        const parts = v.fields.map(f => {
          const val = gen_field_debug(`self.${safe_ident(f.name)}`, f);
          return `"${f.name}: " + ${val}`;
        });
        ctx.emit(`case "${v.name}": return "${v.name} { " + ${parts.join(' + ", " + ')} + " }";`);
      } else {
        const parts = v.fields.map(f => {
          const accessor = `_${f.positional_index}`;
          return gen_field_debug(`self.${accessor}`, f);
        });
        ctx.emit(`case "${v.name}": return "${v.name}(" + ${parts.join(' + ", " + ')} + ")";`);
      }
    }
    ctx.emit(`default: return self.${ENUM_TAG_FIELD};`);
    ctx.pop_indent();
    ctx.emit(`}`);
  }

  ctx.pop_indent();
  ctx.emit(`}`);

  const dict_name = trait_dict_name(name, "Debug");
  ctx.emit(`const ${dict_name} = { debug: ${fn_name} };`);
}

function gen_field_debug(expr: string, field: DerivedField): string {
  if (field.action === "identity") {
    return `String(${expr})`;
  }
  const extra = field.action.extra_dicts.length > 0
    ? ", " + field.action.extra_dicts.join(", ") : "";
  return `${field.action.dict_name}.debug(${expr}${extra})`;
}

// ============================================================
// Public API
// ============================================================

export function generate(program: HProgram, options?: import("./codegen-ctx.js").CodegenOptions): string {
  const gen = new CodeGenerator(options);
  return gen.generate(program);
}
