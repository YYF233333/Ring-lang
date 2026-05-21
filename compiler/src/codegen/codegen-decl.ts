// Declaration codegen — extracted from CodeGenerator class.
// All functions take `ctx: CodegenCtx` as first parameter.

import type {
  HFnDecl, HStructDecl, HEnumDecl, HImplDecl,
  HEffectDecl, HTestDecl, HTraitDecl, HDecl,
} from "../hir/index.js";
import {
  trait_dict_name, evidence_param_name,
  trait_bound_param_name, default_method_self_name, ENUM_TAG_FIELD,
} from "../hir/index.js";
import type { EffectRow } from "../types/index.js";
import { assertNever } from "../errors.js";
import type { CodegenCtx } from "./codegen-ctx.js";
import { safe_ident, extract_effect_names, get_evidence_params } from "./codegen-ctx.js";

// ============================================================
// Top-level dispatch
// ============================================================

export function emit_decl(ctx: CodegenCtx, decl: HDecl): void {
  switch (decl.kind) {
    case "fn_decl": emit_fn_decl(ctx, decl); break;
    case "struct_decl": emit_struct_decl(ctx, decl); break;
    case "enum_decl": emit_enum_decl(ctx, decl); break;
    case "impl_decl": emit_impl_decl(ctx, decl); break;
    case "effect_decl": emit_effect_decl(ctx, decl); break;
    case "test_decl": emit_test_decl(ctx, decl); break;
    case "trait_decl": emit_trait_decl(ctx, decl); break;
    case "extern_fn_decl": emit_extern_fn_decl(ctx, decl); break;
    case "extern_type_decl": break;
    case "type_alias_decl": break;
    default: assertNever(decl, "emit_decl");
  }
}

// ============================================================
// Function declarations
// ============================================================

export function emit_fn_decl(ctx: CodegenCtx, decl: HFnDecl, prefix?: string): void {
  const name = prefix ? `${prefix}_${safe_ident(decl.name)}` : ctx.qualify(decl.name);
  const param_names = decl.params.map(p => safe_ident(p.name));
  const dict_params = (decl.trait_bounds ?? []).map(b => trait_bound_param_name(b.type_param, b.trait_name));
  // Use transitive effects from local_fn_effects if available (more complete than decl.effects)
  const effective_effects = ctx.local_fn_effects.get(decl.name) ?? decl.effects;
  const ev_params = get_evidence_params(effective_effects);
  const all_params = [...param_names, ...dict_params, ...ev_params].join(", ");
  ctx.emit(`function ${name}(${all_params}) {`);
  ctx.push_indent();
  const saved_fn_effects = ctx.current_fn_effects;
  ctx.current_fn_effects = effective_effects;
  ctx.emit_block_body(decl.body);
  ctx.current_fn_effects = saved_fn_effects;
  ctx.pop_indent();
  ctx.emit("}");
}

// ============================================================
// Extern fn declarations
// ============================================================

export function emit_extern_fn_decl(ctx: CodegenCtx, decl: import("../hir/index.js").HExternFnDecl): void {
  if (ctx.module_prefix) {
    const qualified = `${ctx.module_prefix}$${safe_ident(decl.name)}`;
    ctx.emit(`const ${qualified} = ${safe_ident(decl.name)};`);
  }
}

// ============================================================
// Struct declarations
// ============================================================

export function emit_struct_decl(ctx: CodegenCtx, decl: HStructDecl): void {
  const raw_fields = decl.fields.map(f => f.name);
  const fields = raw_fields.map(f => safe_ident(f));
  ctx.emit(`class ${ctx.qualify(decl.name)} {`);
  ctx.push_indent();
  ctx.emit(`constructor(${fields.join(", ")}) {`);
  ctx.push_indent();
  for (let i = 0; i < raw_fields.length; i++) {
    ctx.emit(`this.${raw_fields[i]} = ${fields[i]};`);
  }
  ctx.pop_indent();
  ctx.emit("}");
  ctx.pop_indent();
  ctx.emit("}");
}

// ============================================================
// Enum declarations
// ============================================================

export function emit_enum_decl(ctx: CodegenCtx, decl: HEnumDecl): void {
  for (const variant of decl.variants) {
    const js_name = `${ctx.qualify(decl.name)}_${variant.name}`;
    if (variant.fields.length === 0) {
      ctx.emit(
        `const ${js_name} = Object.freeze({ ${ENUM_TAG_FIELD}: "${variant.name}" });`
      );
    } else if (variant.field_names) {
      const params = variant.field_names.map(n => safe_ident(n)).join(", ");
      const field_assigns = variant.field_names.map(n => safe_ident(n)).join(", ");
      ctx.emit(`function ${js_name}(${params}) {`);
      ctx.push_indent();
      ctx.emit(`return { ${ENUM_TAG_FIELD}: "${variant.name}", ${field_assigns} };`);
      ctx.pop_indent();
      ctx.emit("}");
    } else {
      const params = variant.fields.map((_, i) => `_${i}`).join(", ");
      ctx.emit(`function ${js_name}(${params}) {`);
      ctx.push_indent();
      const field_assigns = variant.fields.map((_, i) => `_${i}`).join(", ");
      ctx.emit(`return { ${ENUM_TAG_FIELD}: "${variant.name}", ${field_assigns} };`);
      ctx.pop_indent();
      ctx.emit("}");
    }
  }
}

// ============================================================
// Impl declarations
// ============================================================

export function emit_impl_decl(ctx: CodegenCtx, decl: HImplDecl): void {
  const prefix = decl.trait_name
    ? `${ctx.qualify(decl.target_type)}_${safe_ident(decl.trait_name)}`
    : ctx.qualify(decl.target_type);
  for (const method of decl.methods) {
    if (method.kind === "extern_fn_decl") continue;
    emit_fn_decl(ctx, method, prefix);
  }
  if (decl.trait_name) {
    emit_trait_dictionary(ctx, decl);
  }
}

function emit_trait_dictionary(ctx: CodegenCtx, decl: HImplDecl): void {
  const dict_name = trait_dict_name(ctx.qualify(decl.target_type), decl.trait_name!);
  const impl_method_names = new Set(decl.methods.map(m => m.name));
  const entries = decl.methods.map(m => {
    const fn_name = `${ctx.qualify(decl.target_type)}_${safe_ident(decl.trait_name!)}_${safe_ident(m.name)}`;
    return `${safe_ident(m.name)}: ${fn_name}`;
  });
  const trait_decl = ctx.trait_decls.get(decl.trait_name!);
  if (trait_decl) {
    for (const tm of trait_decl.methods) {
      if (tm.has_default && !impl_method_names.has(tm.name)) {
        const default_fn = `__${safe_ident(decl.trait_name!)}_${safe_ident(tm.name)}`;
        const param_names = tm.params.map(p => safe_ident(p.name));
        entries.push(`${safe_ident(tm.name)}: function(${param_names.join(", ")}) { return ${default_fn}(${dict_name}, ${param_names.join(", ")}); }`);
      }
    }
  }
  ctx.emit(`const ${dict_name} = { ${entries.join(", ")} };`);
}

// ============================================================
// Effect declarations
// ============================================================

export function emit_effect_decl(_ctx: CodegenCtx, _decl: HEffectDecl): void {
  // Effect declarations don't produce runtime code directly.
  // The operations are translated at call sites.
}

// ============================================================
// Trait declarations
// ============================================================

export function emit_trait_decl(ctx: CodegenCtx, decl: HTraitDecl): void {
  for (const method of decl.methods) {
    if (method.has_default && method.body) {
      const fn_name = `__${safe_ident(decl.name)}_${safe_ident(method.name)}`;
      const param_names = method.params.map(p => safe_ident(p.name));
      const all_params = [default_method_self_name(safe_ident(decl.name)), ...param_names].join(", ");
      ctx.emit(`function ${fn_name}(${all_params}) {`);
      ctx.push_indent();
      ctx.emit_block_body(method.body);
      ctx.pop_indent();
      ctx.emit("}");
    }
  }
}

// ============================================================
// Test declarations
// ============================================================

export function emit_test_decl(ctx: CodegenCtx, decl: HTestDecl): void {
  ctx.emit(`// test: ${decl.description}`);
  ctx.emit("(function() {");
  ctx.push_indent();
  ctx.emit_block_body(decl.body);
  ctx.pop_indent();
  ctx.emit("})();");
}

// ============================================================
// Top-level evidence emission (for main() auto-call)
// ============================================================

export function emit_toplevel_evidence(ctx: CodegenCtx, effects: EffectRow): void {
  const effect_names = extract_effect_names(effects);

  for (const name of effect_names) {
    const ev_name = evidence_param_name(name);
    if (name === "io") {
      ctx.emit(`const ${ev_name} = { read: (p) => require("fs").readFileSync(p, "utf-8"), write: (p, d) => require("fs").writeFileSync(p, d, "utf-8") };`);
    } else if (name === "fail") {
      ctx.emit(`const ${ev_name} = { raise: (error) => { throw error; } };`);
    } else {
      ctx.emit(`const ${ev_name} = {};`);
    }
  }
}
