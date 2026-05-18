import { Substitution, apply, apply_to_effect_row } from "./unify.js";
import {
  HProgram, HDecl, HFnDecl, HBlock, HStmt, HExpr,
  HStructDecl, HEnumDecl, HImplDecl, HEffectDecl, HTestDecl, HTraitDecl,
  HParam, HMatchArm, HEffectHandler, HStructFieldInit, HTraitMethod,
} from "../hir/index.js";
import { Type, EffectRow } from "../types/index.js";

type Ctx = { subst: Substitution; names: Map<number, string> };

function z(ctx: Ctx, t: Type): Type {
  const resolved = apply(ctx.subst, t);
  return label_vars(ctx.names, resolved);
}

function label_vars(names: Map<number, string>, t: Type): Type {
  switch (t.kind) {
    case "var":
      return (!t.name && names.has(t.id)) ? { ...t, name: names.get(t.id) } : t;
    case "fn":
      return { ...t, params: t.params.map(p => label_vars(names, p)), return_type: label_vars(names, t.return_type) };
    case "struct":
      return { ...t, type_params: t.type_params.map(p => label_vars(names, p)), fields: t.fields.map(f => ({ ...f, type: label_vars(names, f.type) })) };
    case "enum":
      return { ...t, type_params: t.type_params.map(p => label_vars(names, p)), variants: t.variants.map(v => ({ ...v, fields: v.fields.map(f => label_vars(names, f)) })) };
    case "generic":
      return { ...t, base: label_vars(names, t.base), args: t.args.map(a => label_vars(names, a)) };
    case "record":
      return { ...t, fields: t.fields.map(f => ({ ...f, type: label_vars(names, f.type) })) };
    default:
      return t;
  }
}

function zr(ctx: Ctx, r: EffectRow): EffectRow {
  return apply_to_effect_row(ctx.subst, r);
}

function zp(ctx: Ctx, p: HParam): HParam {
  return { ...p, type: z(ctx, p.type) };
}

function ze(ctx: Ctx, expr: HExpr): HExpr {
  const type = z(ctx, expr.type);
  const effects = zr(ctx, expr.effects);
  const base = { type, effects, span: expr.span };

  switch (expr.kind) {
    case "int_lit":    return { ...base, kind: "int_lit", value: expr.value };
    case "float_lit":  return { ...base, kind: "float_lit", value: expr.value };
    case "str_lit":    return { ...base, kind: "str_lit", value: expr.value };
    case "bool_lit":   return { ...base, kind: "bool_lit", value: expr.value };
    case "ident":      return { ...base, kind: "ident", name: expr.name, resolved_name: expr.resolved_name, dict_closure_dicts: expr.dict_closure_dicts };
    case "bin_op":     return { ...base, kind: "bin_op", op: expr.op, left: ze(ctx, expr.left), right: ze(ctx, expr.right) };
    case "unary_op":   return { ...base, kind: "unary_op", op: expr.op, operand: ze(ctx, expr.operand) };
    case "call":
      return {
        ...base, kind: "call",
        callee: ze(ctx, expr.callee), args: expr.args.map(a => ze(ctx, a)),
        type_args: expr.type_args.map(t => z(ctx, t)),
        resolved_dicts: expr.resolved_dicts, dict_dispatch: expr.dict_dispatch,
      };
    case "field_access": return { ...base, kind: "field_access", receiver: ze(ctx, expr.receiver), field: expr.field };
    case "struct_lit":
      return {
        ...base, kind: "struct_lit", name: expr.name,
        type_args: expr.type_args.map(t => z(ctx, t)),
        fields: expr.fields.map((f): HStructFieldInit => ({ name: f.name, value: ze(ctx, f.value) })),
      };
    case "match_expr":
      return {
        ...base, kind: "match_expr", scrutinee: ze(ctx, expr.scrutinee),
        arms: expr.arms.map((a): HMatchArm => ({
          pattern: a.pattern, guard: a.guard ? ze(ctx, a.guard) : undefined,
          body: ze(ctx, a.body), span: a.span,
        })),
      };
    case "block":   return { ...base, kind: "block", ...zbi(ctx, expr) };
    case "if_expr": {
      const eb = expr.else_branch
        ? (expr.else_branch.kind === "block"
          ? { ...zbb(ctx, expr.else_branch), kind: "block" as const, ...zbi(ctx, expr.else_branch) }
          : ze(ctx, expr.else_branch))
        : undefined;
      return {
        ...base, kind: "if_expr", condition: ze(ctx, expr.condition),
        then_branch: { ...zbb(ctx, expr.then_branch), kind: "block" as const, ...zbi(ctx, expr.then_branch) },
        else_branch: eb as HBlock | import("../hir/index.js").HIf | undefined,
      };
    }
    case "string_interp":
      return { ...base, kind: "string_interp", parts: expr.parts.map(p => typeof p === "string" ? p : ze(ctx, p)) };
    case "try_catch":
      return { ...base, kind: "try_catch", body: ze(ctx, expr.body), error_binding: expr.error_binding, error_type: expr.error_type, handler: ze(ctx, expr.handler) };
    case "handle_expr":
      return {
        ...base, kind: "handle_expr", body: ze(ctx, expr.body),
        handlers: expr.handlers.map((h): HEffectHandler => ({
          effect_name: h.effect_name, op_name: h.op_name,
          params: h.params.map(p => zp(ctx, p)), resume_name: h.resume_name, body: ze(ctx, h.body),
        })),
      };
    case "lambda":
      return { ...base, kind: "lambda", params: expr.params.map(p => zp(ctx, p)), return_type: z(ctx, expr.return_type), body: ze(ctx, expr.body) };
    case "effect_op":
      return { ...base, kind: "effect_op", effect_name: expr.effect_name, op_name: expr.op_name, args: expr.args.map(a => ze(ctx, a)) };
    case "option_unwrap": return { ...base, kind: "option_unwrap", expr: ze(ctx, expr.expr) };
    case "try_block":     return { ...base, kind: "try_block", body: ze(ctx, expr.body) };
    case "option_or":     return { ...base, kind: "option_or", expr: ze(ctx, expr.expr), default_value: ze(ctx, expr.default_value) };
  }
}

function zbb(ctx: Ctx, block: HBlock) {
  return { type: z(ctx, block.type), effects: zr(ctx, block.effects), span: block.span };
}

function zbi(ctx: Ctx, block: HBlock) {
  return { stmts: block.stmts.map(s => zs(ctx, s)), tail: block.tail ? ze(ctx, block.tail) : undefined };
}

function zb(ctx: Ctx, block: HBlock): HBlock {
  return { kind: "block", ...zbb(ctx, block), ...zbi(ctx, block) };
}

function zs(ctx: Ctx, stmt: HStmt): HStmt {
  switch (stmt.kind) {
    case "let_stmt":    return { ...stmt, type: z(ctx, stmt.type), init: ze(ctx, stmt.init) };
    case "var_stmt":    return { ...stmt, type: z(ctx, stmt.type), init: ze(ctx, stmt.init) };
    case "assign_stmt": return { ...stmt, target: ze(ctx, stmt.target), value: ze(ctx, stmt.value) };
    case "expr_stmt":   return { ...stmt, expr: ze(ctx, stmt.expr) };
    case "return_stmt": return { ...stmt, value: stmt.value ? ze(ctx, stmt.value) : undefined };
  }
}

function zfn(ctx: Ctx, fn: HFnDecl): HFnDecl {
  return { ...fn, params: fn.params.map(p => zp(ctx, p)), return_type: z(ctx, fn.return_type), effects: zr(ctx, fn.effects), body: zb(ctx, fn.body) };
}

function zd(ctx: Ctx, decl: HDecl): HDecl {
  switch (decl.kind) {
    case "fn_decl":     return zfn(ctx, decl);
    case "struct_decl": return { ...decl, fields: decl.fields.map(f => ({ ...f, type: z(ctx, f.type) })) } as HStructDecl;
    case "enum_decl":   return { ...decl, variants: decl.variants.map(v => ({ ...v, fields: v.fields.map(f => z(ctx, f)) })) } as HEnumDecl;
    case "impl_decl":   return { ...decl, methods: decl.methods.map(m => zfn(ctx, m)) } as HImplDecl;
    case "effect_decl":
      return { ...decl, ops: decl.ops.map(op => ({ ...op, params: op.params.map(p => zp(ctx, p)), return_type: z(ctx, op.return_type) })) } as HEffectDecl;
    case "test_decl":   return { ...decl, body: zb(ctx, decl.body) } as HTestDecl;
    case "trait_decl":
      return {
        ...decl,
        methods: decl.methods.map((m): HTraitMethod => ({
          ...m, params: m.params.map(p => zp(ctx, p)), return_type: z(ctx, m.return_type),
          body: m.body ? zb(ctx, m.body) : undefined,
        })),
      } as HTraitDecl;
  }
}

export function zonk_program(subst: Substitution, names: Map<number, string>, program: HProgram): HProgram {
  const ctx: Ctx = { subst, names };
  return { decls: program.decls.map(d => zd(ctx, d)) };
}
