import { Substitution, apply, apply_to_effect_row } from "./unify.js";
import {
  HProgram, HDecl, HFnDecl, HBlock, HStmt, HExpr,
  HStructDecl, HEnumDecl, HImplDecl, HEffectDecl, HTestDecl, HTraitDecl,
  HParam, HMatchArm, HEffectHandler, HStructFieldInit, HTraitMethod,
} from "../hir/index.js";
import { Type, EffectRow } from "../types/index.js";

function z(subst: Substitution, t: Type): Type {
  return apply(subst, t);
}

function zr(subst: Substitution, r: EffectRow): EffectRow {
  return apply_to_effect_row(subst, r);
}

function zonk_param(subst: Substitution, p: HParam): HParam {
  return { ...p, type: z(subst, p.type) };
}

function zonk_expr(subst: Substitution, expr: HExpr): HExpr {
  const type = z(subst, expr.type);
  const effects = zr(subst, expr.effects);
  const base = { type, effects, span: expr.span };

  switch (expr.kind) {
    case "int_lit":
      return { ...base, kind: "int_lit", value: expr.value };
    case "float_lit":
      return { ...base, kind: "float_lit", value: expr.value };
    case "str_lit":
      return { ...base, kind: "str_lit", value: expr.value };
    case "bool_lit":
      return { ...base, kind: "bool_lit", value: expr.value };
    case "ident":
      return { ...base, kind: "ident", name: expr.name, resolved_name: expr.resolved_name, dict_closure_dicts: expr.dict_closure_dicts };
    case "bin_op":
      return { ...base, kind: "bin_op", op: expr.op, left: zonk_expr(subst, expr.left), right: zonk_expr(subst, expr.right) };
    case "unary_op":
      return { ...base, kind: "unary_op", op: expr.op, operand: zonk_expr(subst, expr.operand) };
    case "call":
      return {
        ...base, kind: "call",
        callee: zonk_expr(subst, expr.callee),
        args: expr.args.map(a => zonk_expr(subst, a)),
        type_args: expr.type_args.map(t => z(subst, t)),
        resolved_dicts: expr.resolved_dicts,
        dict_dispatch: expr.dict_dispatch,
      };
    case "field_access":
      return { ...base, kind: "field_access", receiver: zonk_expr(subst, expr.receiver), field: expr.field };
    case "struct_lit":
      return {
        ...base, kind: "struct_lit", name: expr.name,
        type_args: expr.type_args.map(t => z(subst, t)),
        fields: expr.fields.map((f): HStructFieldInit => ({ name: f.name, value: zonk_expr(subst, f.value) })),
      };
    case "match_expr":
      return {
        ...base, kind: "match_expr",
        scrutinee: zonk_expr(subst, expr.scrutinee),
        arms: expr.arms.map((a): HMatchArm => ({
          pattern: a.pattern, guard: a.guard ? zonk_expr(subst, a.guard) : undefined,
          body: zonk_expr(subst, a.body), span: a.span,
        })),
      };
    case "block":
      return { ...base, kind: "block", ...zonk_block_inner(subst, expr) };
    case "if_expr": {
      const else_branch = expr.else_branch
        ? (expr.else_branch.kind === "block"
          ? { ...zonk_block_base(subst, expr.else_branch), kind: "block" as const, ...zonk_block_inner(subst, expr.else_branch) }
          : zonk_expr(subst, expr.else_branch))
        : undefined;
      return {
        ...base, kind: "if_expr",
        condition: zonk_expr(subst, expr.condition),
        then_branch: { ...zonk_block_base(subst, expr.then_branch), kind: "block" as const, ...zonk_block_inner(subst, expr.then_branch) },
        else_branch: else_branch as HBlock | import("../hir/index.js").HIf | undefined,
      };
    }
    case "string_interp":
      return {
        ...base, kind: "string_interp",
        parts: expr.parts.map(p => typeof p === "string" ? p : zonk_expr(subst, p)),
      };
    case "try_catch":
      return {
        ...base, kind: "try_catch",
        body: zonk_expr(subst, expr.body),
        error_binding: expr.error_binding, error_type: expr.error_type,
        handler: zonk_expr(subst, expr.handler),
      };
    case "handle_expr":
      return {
        ...base, kind: "handle_expr",
        body: zonk_expr(subst, expr.body),
        handlers: expr.handlers.map((h): HEffectHandler => ({
          effect_name: h.effect_name, op_name: h.op_name,
          params: h.params.map(p => zonk_param(subst, p)),
          resume_name: h.resume_name,
          body: zonk_expr(subst, h.body),
        })),
      };
    case "lambda":
      return {
        ...base, kind: "lambda",
        params: expr.params.map(p => zonk_param(subst, p)),
        return_type: z(subst, expr.return_type),
        body: zonk_expr(subst, expr.body),
      };
    case "effect_op":
      return {
        ...base, kind: "effect_op",
        effect_name: expr.effect_name, op_name: expr.op_name,
        args: expr.args.map(a => zonk_expr(subst, a)),
      };
    case "option_unwrap":
      return { ...base, kind: "option_unwrap", expr: zonk_expr(subst, expr.expr) };
    case "try_block":
      return { ...base, kind: "try_block", body: zonk_expr(subst, expr.body) };
    case "option_or":
      return {
        ...base, kind: "option_or",
        expr: zonk_expr(subst, expr.expr),
        default_value: zonk_expr(subst, expr.default_value),
      };
  }
}

function zonk_block_base(subst: Substitution, block: HBlock): { type: Type; effects: EffectRow; span: typeof block.span } {
  return { type: z(subst, block.type), effects: zr(subst, block.effects), span: block.span };
}

function zonk_block_inner(subst: Substitution, block: HBlock): { stmts: HStmt[]; tail?: HExpr } {
  return {
    stmts: block.stmts.map(s => zonk_stmt(subst, s)),
    tail: block.tail ? zonk_expr(subst, block.tail) : undefined,
  };
}

function zonk_block(subst: Substitution, block: HBlock): HBlock {
  return {
    kind: "block",
    ...zonk_block_base(subst, block),
    ...zonk_block_inner(subst, block),
  };
}

function zonk_stmt(subst: Substitution, stmt: HStmt): HStmt {
  switch (stmt.kind) {
    case "let_stmt":
      return { ...stmt, type: z(subst, stmt.type), init: zonk_expr(subst, stmt.init) };
    case "var_stmt":
      return { ...stmt, type: z(subst, stmt.type), init: zonk_expr(subst, stmt.init) };
    case "assign_stmt":
      return { ...stmt, target: zonk_expr(subst, stmt.target), value: zonk_expr(subst, stmt.value) };
    case "expr_stmt":
      return { ...stmt, expr: zonk_expr(subst, stmt.expr) };
    case "return_stmt":
      return { ...stmt, value: stmt.value ? zonk_expr(subst, stmt.value) : undefined };
  }
}

function zonk_fn(subst: Substitution, fn: HFnDecl): HFnDecl {
  return {
    ...fn,
    params: fn.params.map(p => zonk_param(subst, p)),
    return_type: z(subst, fn.return_type),
    effects: zr(subst, fn.effects),
    body: zonk_block(subst, fn.body),
  };
}

function zonk_decl(subst: Substitution, decl: HDecl): HDecl {
  switch (decl.kind) {
    case "fn_decl":
      return zonk_fn(subst, decl);
    case "struct_decl": {
      const d: HStructDecl = {
        ...decl,
        fields: decl.fields.map(f => ({ ...f, type: z(subst, f.type) })),
      };
      return d;
    }
    case "enum_decl": {
      const d: HEnumDecl = {
        ...decl,
        variants: decl.variants.map(v => ({ ...v, fields: v.fields.map(f => z(subst, f)) })),
      };
      return d;
    }
    case "impl_decl": {
      const d: HImplDecl = {
        ...decl,
        methods: decl.methods.map(m => zonk_fn(subst, m)),
      };
      return d;
    }
    case "effect_decl": {
      const d: HEffectDecl = {
        ...decl,
        ops: decl.ops.map(op => ({
          ...op,
          params: op.params.map(p => zonk_param(subst, p)),
          return_type: z(subst, op.return_type),
        })),
      };
      return d;
    }
    case "test_decl": {
      const d: HTestDecl = {
        ...decl,
        body: zonk_block(subst, decl.body),
      };
      return d;
    }
    case "trait_decl": {
      const d: HTraitDecl = {
        ...decl,
        methods: decl.methods.map((m): HTraitMethod => ({
          ...m,
          params: m.params.map(p => zonk_param(subst, p)),
          return_type: z(subst, m.return_type),
          body: m.body ? zonk_block(subst, m.body) : undefined,
        })),
      };
      return d;
    }
  }
}

export function zonk_program(subst: Substitution, program: HProgram): HProgram {
  return { decls: program.decls.map(d => zonk_decl(subst, d)) };
}
