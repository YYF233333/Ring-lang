// Auto-derived trait codegen (Eq/Clone/Debug/Ord)
// Extracted from codegen.ts to keep the main generator as a thin shell.

import type { DerivedImpl, DerivedField } from "../hir/index.js";
import { ENUM_TAG_FIELD, trait_dict_name, trait_bound_param_name } from "../hir/index.js";
import type { CodegenCtx } from "./codegen-ctx.js";
import { safe_ident } from "./codegen-ctx.js";

export function get_derived_method_names(trait_name: string): string[] {
  switch (trait_name) {
    case "Eq": return ["eq", "ne"];
    case "Clone": return ["clone"];
    case "Debug": return ["debug"];
    case "Ord": return ["cmp"];
    default: return [];
  }
}

export function emit_derived_impl(ctx: CodegenCtx, impl: DerivedImpl): void {
  if (impl.trait_name === "Eq") {
    emit_derived_eq(ctx, impl);
  }
  if (impl.trait_name === "Clone") {
    emit_derived_clone(ctx, impl);
  }
  if (impl.trait_name === "Ord") {
    emit_derived_ord(ctx, impl);
  }
  if (impl.trait_name === "Debug") {
    emit_derived_debug(ctx, impl);
  }
}

// ============================================================
// Auto-derived Eq
// ============================================================

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
