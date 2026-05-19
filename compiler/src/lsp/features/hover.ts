import { Hover, Position } from "vscode-languageserver";
import { DocumentState } from "../document-manager.js";
import { format_type_for_hover, contains_position } from "../utils.js";
import { type_to_string, effect_row_to_string } from "../../types/index.js";
import {
  HDecl, HFnDecl, HStructDecl, HEnumDecl, HEffectDecl, HTraitDecl,
} from "../../hir/index.js";
import { Span } from "../../ast/index.js";
import { walk_decl } from "../hir-visitor.js";

interface HoverCandidate {
  type_str: string;
  span: Span;
}

function find_hover_in_decl(decl: HDecl, pos: Position): HoverCandidate | null {
  if (!("span" in decl) || !contains_position(decl.span, pos)) return null;

  let best: HoverCandidate | null = null;

  walk_decl(decl, {
    enter_expr(expr) {
      if (contains_position(expr.span, pos)) {
        best = { type_str: format_type_for_hover(expr.type, expr.effects), span: expr.span };
      }
    },
    enter_stmt(stmt) {
      if ((stmt.kind === "let_stmt" || stmt.kind === "var_stmt") &&
          contains_position(stmt.name_span, pos)) {
        best = { type_str: type_to_string(stmt.type), span: stmt.name_span };
      }
    },
  });

  if (best) return best;

  switch (decl.kind) {
    case "fn_decl":
      return format_fn_hover(decl);
    case "struct_decl":
      return format_struct_hover(decl);
    case "enum_decl":
      return format_enum_hover(decl);
    case "effect_decl":
      return format_effect_hover(decl);
    case "trait_decl":
      return format_trait_hover(decl);
    case "extern_fn_decl": {
      const params = decl.params.map((p: any) => `${p.name}: ${type_to_string(p.type)}`).join(", ");
      const ret = type_to_string(decl.return_type);
      return { type_str: `extern fn ${decl.name}(${params}) -> ${ret}`, span: decl.span };
    }
    case "extern_type_decl": {
      const tp = decl.type_params.map((p: any) => p.name).join(", ");
      const sig = tp ? `extern type ${decl.name}<${tp}>` : `extern type ${decl.name}`;
      return { type_str: sig, span: decl.span };
    }
    case "type_alias_decl": {
      return { type_str: `type ${decl.name} = ${type_to_string(decl.type)}`, span: decl.span };
    }
    default:
      return null;
  }
}

function format_fn_hover(fn: HFnDecl): HoverCandidate {
  const params = fn.params.map(p => `${p.name}: ${type_to_string(p.type)}`).join(", ");
  const ret = type_to_string(fn.return_type);
  const eff = effect_row_to_string(fn.effects);
  const type_str = eff ? `fn ${fn.name}(${params}) -> ${ret} / ${eff}` : `fn ${fn.name}(${params}) -> ${ret}`;
  return { type_str, span: fn.span };
}

function format_struct_hover(decl: HStructDecl): HoverCandidate {
  const tparams = decl.type_params.length > 0 ? `<${decl.type_params.map(p => p.name).join(", ")}>` : "";
  const fields = decl.fields.map(f => `${f.name}: ${type_to_string(f.type)}`).join(", ");
  return { type_str: `struct ${decl.name}${tparams} { ${fields} }`, span: decl.span };
}

function format_enum_hover(decl: HEnumDecl): HoverCandidate {
  const tparams = decl.type_params.length > 0 ? `<${decl.type_params.map(p => p.name).join(", ")}>` : "";
  const variants = decl.variants.map(v =>
    v.fields.length > 0 ? `${v.name}(${v.fields.map(f => type_to_string(f)).join(", ")})` : v.name
  ).join(" | ");
  return { type_str: `enum ${decl.name}${tparams} { ${variants} }`, span: decl.span };
}

function format_effect_hover(decl: HEffectDecl): HoverCandidate {
  const tparams = decl.type_params.length > 0 ? `<${decl.type_params.map(p => p.name).join(", ")}>` : "";
  const ops = decl.ops.map(op => {
    const params = op.params.map(p => `${p.name}: ${type_to_string(p.type)}`).join(", ");
    return `fn ${op.name}(${params}) -> ${type_to_string(op.return_type)}`;
  }).join("; ");
  return { type_str: `effect ${decl.name}${tparams} { ${ops} }`, span: decl.span };
}

function format_trait_hover(decl: HTraitDecl): HoverCandidate {
  const tparams = decl.type_params.length > 0 ? `<${decl.type_params.map(p => p.name).join(", ")}>` : "";
  const methods = decl.methods.map(m => {
    const params = m.params.map(p => `${p.name}: ${type_to_string(p.type)}`).join(", ");
    return `fn ${m.name}(${params}) -> ${type_to_string(m.return_type)}`;
  }).join("; ");
  return { type_str: `trait ${decl.name}${tparams} { ${methods} }`, span: decl.span };
}

export function get_hover(state: DocumentState, position: Position): Hover | null {
  if (!state.checkResult) return null;

  const { program } = state.checkResult;

  for (const decl of program.decls) {
    const result = find_hover_in_decl(decl, position);
    if (result) {
      return { contents: `\`\`\`ring\n${result.type_str}\n\`\`\`` };
    }
  }

  return null;
}
