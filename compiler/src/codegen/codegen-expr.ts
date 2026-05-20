// Expression codegen — extracted from CodeGenerator class.
// All functions take `ctx: CodegenCtx` as first parameter.

import type { HExpr, HBlock } from "../hir/index.js";
import {
  evidence_param_name,
  ENUM_TAG_FIELD, OPTION_SOME_TAG, OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD,
  RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL,
  BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_STR, BUILTIN_INT, BUILTIN_FLOAT,
} from "../hir/index.js";
import type { Type } from "../types/index.js";
import { assertNever } from "../errors.js";
import type { CodegenCtx } from "./codegen-ctx.js";
import { safe_ident, get_evidence_params, LIST_HOF_JS } from "./codegen-ctx.js";
import { gen_pattern_condition, gen_pattern_bindings, gen_stmt_inline } from "./codegen-stmt.js";

// ============================================================
// Main expression dispatch
// ============================================================

export function gen_expr(ctx: CodegenCtx, expr: HExpr): string {
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
      const name = expr.resolved_name
        ? ctx.qualify(expr.resolved_name)
        : ctx.qualify(expr.name);
      if (expr.dict_closure_dicts && expr.dict_closure_dicts.length > 0) {
        const fn_type = expr.type;
        if (fn_type.kind === "fn") {
          const params = fn_type.params.map((_, i) => `__ring_a${i}`);
          const dict_args = expr.dict_closure_dicts.join(", ");
          const ev_args = get_callee_evidence_args(ctx, fn_type);
          const all_call_args = [...params, dict_args, ...(ev_args ? [ev_args] : [])].join(", ");
          return `((${params.join(", ")}) => ${name}(${all_call_args}))`;
        }
      }
      return name;
    }
    case "bin_op": {
      const js_op = expr.op === "==" ? "===" : expr.op === "!=" ? "!==" : expr.op;
      return `(${gen_expr(ctx, expr.left)} ${js_op} ${gen_expr(ctx, expr.right)})`;
    }
    case "unary_op":
      return `(${expr.op}${gen_expr(ctx, expr.operand)})`;
    case "call":
      return gen_call(ctx, expr);
    case "field_access":
      return `${gen_expr(ctx, expr.receiver)}.${expr.field}`;
    case "struct_lit":
      return gen_struct_lit(ctx, expr);
    case "named_variant_construct":
      return gen_named_variant_construct(ctx, expr);
    case "match_expr":
      return gen_match(ctx, expr);
    case "block":
      return gen_block_expr(ctx, expr);
    case "if_expr":
      return gen_if(ctx, expr);
    case "string_interp":
      return gen_string_interp(ctx, expr);
    case "try_catch":
      return gen_try_catch(ctx, expr);
    case "handle_expr":
      return gen_handle(ctx, expr);
    case "lambda":
      return gen_lambda(ctx, expr);
    case "effect_op":
      return gen_effect_op(ctx, expr);
    case "option_unwrap":
      return gen_option_unwrap(ctx, expr);
    case "try_block":
      return gen_try_block(ctx, expr);
    case "option_or":
      return gen_option_or(ctx, expr);
    case "range":
      return `{ start: ${gen_expr(ctx, expr.start)}, end: ${gen_expr(ctx, expr.end)} }`;
    case "list_lit":
      return `[${expr.elements.map(e => gen_expr(ctx, e)).join(", ")}]`;
    case "tuple_lit":
      return `[${expr.elements.map(e => gen_expr(ctx, e)).join(", ")}]`;
    default:
      return assertNever(expr, "gen_expr");
  }
}

// ============================================================
// Call expression
// ============================================================

function get_callee_evidence_args(_ctx: CodegenCtx, callee_type: Type): string {
  if (callee_type.kind !== "fn" || callee_type.effects.effects.length === 0) return "";
  return get_evidence_params(callee_type.effects).join(", ");
}

function gen_call(ctx: CodegenCtx, expr: HExpr & { kind: "call" }): string {
  // Trait method dispatch via dictionary
  if (expr.dict_dispatch) {
    const { dict_param, method: meth } = expr.dict_dispatch;
    const receiver_arg = expr.callee.kind === "field_access" ? gen_expr(ctx, expr.callee.receiver) : gen_expr(ctx, expr.args[0]);
    const other_args = expr.args.map(a => gen_expr(ctx, a));
    const all = [receiver_arg, ...other_args].join(", ");
    return `${dict_param}.${safe_ident(meth)}(${all})`;
  }

  // Inline List HOF methods — bypass runtime to forward evidence via closure capture
  if (expr.callee.kind === "field_access") {
    const recv_type = expr.callee.receiver.type;
    const method = expr.callee.field;
    if (recv_type.kind === "struct" && recv_type.name === BUILTIN_LIST) {
      const js_method = LIST_HOF_JS[method];
      if (js_method) {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[0]);
        return `${receiver}.${js_method}(${callback})`;
      }
      if (method === "fold") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const init = gen_expr(ctx, expr.args[0]);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[1]);
        return `${receiver}.reduce(${callback}, ${init})`;
      }
      if (method === "find") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[0]);
        return `((__a) => { const __i = __a.findIndex(${callback}); return __i >= 0 ? { _tag: "some", _0: __a[__i] } : { _tag: "none" }; })(${receiver})`;
      }
      if (method === "find_index") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[0]);
        return `((__a) => { const __i = __a.findIndex(${callback}); return __i >= 0 ? { _tag: "some", _0: __i } : { _tag: "none" }; })(${receiver})`;
      }
      if (method === "sort_by") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[0]);
        return `${receiver}.sort(${callback})`;
      }
    }

    // Inline Map HOF methods
    if (recv_type.kind === "struct" && recv_type.name === BUILTIN_MAP) {
      if (method === "map_values") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[0]);
        return `((__m, __f) => { const __r = new Map(); for (const [__k, __v] of __m) __r.set(__k, __f(__v)); return __r; })(${receiver}, ${callback})`;
      }
      if (method === "filter") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[0]);
        return `((__m, __f) => { const __r = new Map(); for (const [__k, __v] of __m) if (__f(__k, __v)) __r.set(__k, __v); return __r; })(${receiver}, ${callback})`;
      }
      if (method === "fold") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const init = gen_expr(ctx, expr.args[0]);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[1]);
        return `((__m, __a, __f) => { for (const [__k, __v] of __m) __a = __f(__a, __k, __v); return __a; })(${receiver}, ${init}, ${callback})`;
      }
      if (method === "any") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[0]);
        return `((__m, __f) => { for (const [__k, __v] of __m) if (__f(__k, __v)) return true; return false; })(${receiver}, ${callback})`;
      }
    }

    // Inline Set HOF methods
    if (recv_type.kind === "struct" && recv_type.name === BUILTIN_SET) {
      if (method === "filter") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[0]);
        return `((__s, __f) => { const __r = new Set(); for (const __x of __s) if (__f(__x)) __r.add(__x); return __r; })(${receiver}, ${callback})`;
      }
      if (method === "fold") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const init = gen_expr(ctx, expr.args[0]);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[1]);
        return `((__s, __a, __f) => { for (const __x of __s) __a = __f(__a, __x); return __a; })(${receiver}, ${init}, ${callback})`;
      }
      if (method === "any") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[0]);
        return `((__s, __f) => { for (const __x of __s) if (__f(__x)) return true; return false; })(${receiver}, ${callback})`;
      }
      if (method === "all") {
        const receiver = gen_expr(ctx, expr.callee.receiver);
        const callback = gen_lambda_capture_evidence(ctx, expr.args[0]);
        return `((__s, __f) => { for (const __x of __s) if (!__f(__x)) return false; return true; })(${receiver}, ${callback})`;
      }
    }
  }

  // Detect UFCS method call: call(field_access(receiver, method), args)
  if (expr.callee.kind === "field_access") {
    const recv_type = expr.callee.receiver.type;
    const method = expr.callee.field;
    const type_name = recv_type.kind === "struct" ? recv_type.name
      : recv_type.kind === "enum" ? recv_type.name
      : recv_type.kind === "str" ? BUILTIN_STR
      : recv_type.kind === "int" ? BUILTIN_INT
      : recv_type.kind === "float" ? BUILTIN_FLOAT
      : null;
    const impl_key = type_name ? `${ctx.qualify(type_name)}.${method}` : null;
    if (type_name && impl_key && ctx.impl_methods.has(impl_key)) {
      const trait_name = ctx.impl_methods.get(impl_key);
      const fn_name = trait_name
        ? `${ctx.qualify(type_name)}_${safe_ident(trait_name)}_${safe_ident(method)}`
        : `${ctx.qualify(type_name)}_${safe_ident(method)}`;
      const receiver = gen_expr(ctx, expr.callee.receiver);
      const args = expr.args.map(a => gen_expr(ctx, a)).join(", ");
      const all_args = args ? `${receiver}, ${args}` : receiver;
      const ev_args = get_callee_evidence_args(ctx, expr.callee.type);
      const all_with_ev = [all_args, ev_args].filter(s => s.length > 0).join(", ");
      return `${fn_name}(${all_with_ev})`;
    }
  }

  // Pass dictionary args + evidence args at call sites
  const callee = gen_expr(ctx, expr.callee);
  const args = expr.args.map(a => gen_expr(ctx, a)).join(", ");
  const dict_args = (expr.resolved_dicts ?? []).map(d => ctx.qualify(d)).join(", ");
  const ev_args = get_callee_evidence_args(ctx, expr.callee.type);
  const all_args = [args, dict_args, ev_args].filter(s => s.length > 0).join(", ");
  return `${callee}(${all_args})`;
}

// ============================================================
// Struct literal
// ============================================================

function gen_struct_lit(ctx: CodegenCtx, expr: HExpr & { kind: "struct_lit" }): string {
  const declared_order = ctx.struct_field_order.get(ctx.qualify(expr.name));
  if (declared_order) {
    const field_map = new Map(expr.fields.map(f => [f.name, f.value]));
    if (expr.spread) {
      return gen_spread_struct(ctx, expr.spread, ctx.qualify(expr.name), declared_order, field_map, true);
    }
    const args = declared_order.map(name => {
      const val = field_map.get(name);
      return val ? gen_expr(ctx, val) : "undefined";
    }).join(", ");
    return `new ${ctx.qualify(expr.name)}(${args})`;
  }
  if (expr.spread) {
    const field_map = new Map(expr.fields.map(f => [f.name, f.value]));
    const order = expr.fields.map(f => f.name);
    return gen_spread_struct(ctx, expr.spread, ctx.qualify(expr.name), order, field_map, true);
  }
  const args = expr.fields.map(f => gen_expr(ctx, f.value)).join(", ");
  return `new ${ctx.qualify(expr.name)}(${args})`;
}

function gen_spread_struct(
  ctx: CodegenCtx, spread: HExpr, constructor: string,
  field_order: string[], field_map: Map<string, HExpr>, use_new: boolean,
): string {
  const is_simple = spread.kind === "ident" || spread.kind === "field_access";
  if (is_simple) {
    const base = gen_expr(ctx, spread);
    const args = field_order.map(name => {
      const val = field_map.get(name);
      return val ? gen_expr(ctx, val) : `${base}.${safe_ident(name)}`;
    }).join(", ");
    return use_new ? `new ${constructor}(${args})` : `${constructor}(${args})`;
  }
  const args = field_order.map(name => {
    const val = field_map.get(name);
    return val ? gen_expr(ctx, val) : `__su.${safe_ident(name)}`;
  }).join(", ");
  const call = use_new ? `new ${constructor}(${args})` : `${constructor}(${args})`;
  return `((__su) => ${call})(${gen_expr(ctx, spread)})`;
}

// ============================================================
// Named variant construct
// ============================================================

function gen_named_variant_construct(ctx: CodegenCtx, expr: HExpr & { kind: "named_variant_construct" }): string {
  const js_name = `${ctx.qualify(expr.enum_name)}_${expr.variant_name}`;
  const field_map = new Map(expr.fields.map(f => [f.name, f.value]));
  const enum_type = expr.type as import("../types/index.js").EnumType;
  const variant = enum_type.variants.find(v => v.name === expr.variant_name);
  if (variant?.field_names) {
    if (expr.spread) {
      return gen_spread_struct(ctx, expr.spread, js_name, variant.field_names, field_map, false);
    }
    const args = variant.field_names.map(n => {
      const val = field_map.get(n);
      return val ? gen_expr(ctx, val) : "undefined";
    }).join(", ");
    return `${js_name}(${args})`;
  }
  const args = expr.fields.map(f => gen_expr(ctx, f.value)).join(", ");
  return `${js_name}(${args})`;
}

// ============================================================
// Match expression (expression-mode — returns IIFE)
// ============================================================

function gen_match(ctx: CodegenCtx, expr: HExpr & { kind: "match_expr" }): string {
  const scrutinee = gen_expr(ctx, expr.scrutinee);
  const parts: string[] = [];
  parts.push("(function() {");
  parts.push(`  const __ring_m = ${scrutinee};`);

  for (const arm of expr.arms) {
    const cond = gen_pattern_condition(ctx, "__ring_m", arm.pattern);
    const bindings = gen_pattern_bindings(ctx, "__ring_m", arm.pattern);
    const body = gen_expr(ctx, arm.body);
    if (cond === "true" && !arm.guard) {
      parts.push(`  ${bindings}return ${body};`);
    } else if (arm.guard) {
      parts.push(`  if (${cond}) { ${bindings}if (${gen_expr(ctx, arm.guard)}) { return ${body}; } }`);
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

// ============================================================
// Block expression (expression-mode — returns IIFE)
// ============================================================

function gen_block_expr(ctx: CodegenCtx, block: HBlock): string {
  if (block.stmts.length === 0 && block.tail) {
    return gen_expr(ctx, block.tail);
  }
  const saved_lines = ctx.lines;
  const saved_indent = ctx.indent_level;
  ctx.lines = [];
  ctx.indent_level = 1;
  ctx.emit_block_body(block);
  const body_lines = ctx.lines;
  ctx.lines = saved_lines;
  ctx.indent_level = saved_indent;
  return ["(function() {", ...body_lines, "})()"].join("\n");
}

// ============================================================
// If expression (expression-mode — returns ternary)
// ============================================================

function gen_if(ctx: CodegenCtx, expr: HExpr & { kind: "if_expr" }): string {
  const cond = gen_expr(ctx, expr.condition);
  const then_val = gen_block_as_value(ctx, expr.then_branch);

  if (!expr.else_branch) {
    return `(${cond} ? ${then_val} : undefined)`;
  }

  if (expr.else_branch.kind === "if_expr") {
    const else_val = gen_if(ctx, expr.else_branch as HExpr & { kind: "if_expr" });
    return `(${cond} ? ${then_val} : ${else_val})`;
  }

  const else_val = gen_block_as_value(ctx, expr.else_branch as HBlock);
  return `(${cond} ? ${then_val} : ${else_val})`;
}

function gen_block_as_value(ctx: CodegenCtx, block: HBlock): string {
  if (block.stmts.length === 0 && block.tail) {
    return gen_expr(ctx, block.tail);
  }
  return gen_block_expr(ctx, block);
}

// ============================================================
// String interpolation
// ============================================================

function gen_string_interp(ctx: CodegenCtx, expr: HExpr & { kind: "string_interp" }): string {
  const parts = expr.parts.map(p => {
    if (typeof p === "string") {
      return p.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
    }
    return `\${${gen_expr(ctx, p)}}`;
  });
  return "`" + parts.join("") + "`";
}

// ============================================================
// Try/catch expression
// ============================================================

function gen_try_catch(ctx: CodegenCtx, expr: HExpr & { kind: "try_catch" }): string {
  const body_has_fail = expr.body.effects.effects.some(e => e.kind === "fail");
  const body = gen_expr(ctx, expr.body);
  const handler = gen_expr(ctx, expr.handler);

  if (!body_has_fail) {
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

// ============================================================
// Handle expression
// ============================================================

function gen_handle(ctx: CodegenCtx, expr: HExpr & { kind: "handle_expr" }): string {
  const by_effect = new Map<string, typeof expr.handlers>();
  for (const h of expr.handlers) {
    const existing = by_effect.get(h.effect_name) ?? [];
    existing.push(h);
    by_effect.set(h.effect_name, existing);
  }

  const ev_decls: string[] = [];
  let has_abort = false;

  for (const [effect_name, handlers] of by_effect) {
    const entries: string[] = [];
    for (const h of handlers) {
      const params = h.params.map(p => safe_ident(p.name)).join(", ");
      const body = gen_expr(ctx, h.body);
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

  const ev_param_names = [...by_effect.keys()].sort().map(n => evidence_param_name(n));
  const ev_arg_names = ev_param_names.join(", ");
  const body_code = gen_handle_body(ctx, expr.body, ev_arg_names);
  const decls = ev_decls.join(" ");

  if (has_abort) {
    return `(function() { ${decls} try { return ${body_code}; } catch (__ring_e) { if (__ring_e instanceof ${RUNTIME_EFFECT_ABORT}) return __ring_e.value; throw __ring_e; } })()`;
  } else {
    return `(function() { ${decls} return ${body_code}; })()`;
  }
}

function gen_handle_body(ctx: CodegenCtx, expr: HExpr, ev_params: string): string {
  if (expr.kind === "block") {
    const parts: string[] = [];
    parts.push(`(function(${ev_params}) {`);
    for (const stmt of (expr as HBlock).stmts) {
      parts.push("  " + gen_stmt_inline(ctx, stmt));
    }
    if ((expr as HBlock).tail) {
      parts.push(`  return ${gen_expr(ctx, (expr as HBlock).tail!)};`);
    }
    parts.push(`})(${ev_params})`);
    return parts.join("\n");
  }
  return `(function(${ev_params}) { return ${gen_expr(ctx, expr)}; })(${ev_params})`;
}

// ============================================================
// Lambda
// ============================================================

function gen_lambda(ctx: CodegenCtx, expr: HExpr & { kind: "lambda" }): string {
  const params = expr.params.map(p => safe_ident(p.name));
  const ev_params = expr.type.kind === "fn" ? get_evidence_params(expr.type.effects) : [];
  const all_params = [...params, ...ev_params].join(", ");
  const body = gen_expr(ctx, expr.body);
  return `(function(${all_params}) { return ${body}; })`;
}

function gen_lambda_capture_evidence(ctx: CodegenCtx, expr: HExpr): string {
  if (expr.kind === "lambda") {
    const params = expr.params.map(p => safe_ident(p.name));
    const body = gen_expr(ctx, expr.body);
    return `(function(${params.join(", ")}) { return ${body}; })`;
  }
  const fn_expr = gen_expr(ctx, expr);
  if (expr.type.kind === "fn") {
    const arity = expr.type.params.length;
    const params = Array.from({ length: arity }, (_, i) => `__ring_a${i}`);
    const ev_args = get_callee_evidence_args(ctx, expr.type);
    const all_args = ev_args ? [...params, ev_args].join(", ") : params.join(", ");
    return `(function(${params.join(", ")}) { return ${fn_expr}(${all_args}); })`;
  }
  return fn_expr;
}

// ============================================================
// Option expressions
// ============================================================

function gen_option_or(ctx: CodegenCtx, expr: HExpr & { kind: "option_or" }): string {
  const inner = gen_expr(ctx, expr.expr);
  const def = gen_expr(ctx, expr.default_value);
  return `((v) => v.${ENUM_TAG_FIELD} === "${OPTION_SOME_TAG}" ? v.${OPTION_PAYLOAD_FIELD} : ${def})(${inner})`;
}

function gen_try_block(ctx: CodegenCtx, expr: HExpr & { kind: "try_block" }): string {
  const body = gen_expr(ctx, expr.body);
  return `(function() { const ${evidence_param_name("fail")} = { raise: (__ring_err) => { throw new ${RUNTIME_EFFECT_ABORT}("fail", __ring_err); } }; try { return { ${ENUM_TAG_FIELD}: "${OPTION_SOME_TAG}", ${OPTION_PAYLOAD_FIELD}: ${body} }; } catch (__ring_e) { if (__ring_e instanceof ${RUNTIME_EFFECT_ABORT} && __ring_e.effect === "fail") return { ${ENUM_TAG_FIELD}: "${OPTION_NONE_TAG}" }; throw __ring_e; } })()`;
}

function gen_option_unwrap(ctx: CodegenCtx, expr: HExpr & { kind: "option_unwrap" }): string {
  const inner = gen_expr(ctx, expr.expr);
  return `((v) => v.${ENUM_TAG_FIELD} === "${OPTION_SOME_TAG}" ? v.${OPTION_PAYLOAD_FIELD} : ${evidence_param_name("fail")}.raise(undefined))(${inner})`;
}

// ============================================================
// Effect operation
// ============================================================

function gen_effect_op(ctx: CodegenCtx, expr: HExpr & { kind: "effect_op" }): string {
  const ev_name = evidence_param_name(expr.effect_name);
  const args = expr.args.map(a => gen_expr(ctx, a)).join(", ");
  return `${ev_name}.${expr.op_name}(${args})`;
}
