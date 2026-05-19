// Statement + pattern codegen — extracted from CodeGenerator class.
// All functions take `ctx: CodegenCtx` as first parameter.

import type { HStmt, HExpr, HBlock } from "../hir/index.js";
import { ENUM_TAG_FIELD, RUNTIME_MATCH_FAIL } from "../hir/index.js";
import type { Pattern } from "../ast/index.js";
import { assertNever } from "../errors.js";
import type { CodegenCtx } from "./codegen-ctx.js";
import { safe_ident } from "./codegen-ctx.js";

// ============================================================
// Statement-mode expression emission
// ============================================================

export function emit_in_stmt_context(ctx: CodegenCtx, expr: HExpr, mode: "return" | "discard"): void {
  switch (expr.kind) {
    case "if_expr":
      emit_if_stmt(ctx, expr, mode);
      return;
    case "block":
      emit_block_in_stmt_context(ctx, expr, mode);
      return;
    case "match_expr":
      emit_match_stmt(ctx, expr, mode);
      return;
    default:
      if (mode === "return") {
        ctx.emit(`return ${ctx.gen_expr(expr)};`);
      } else {
        ctx.emit(`${ctx.gen_expr(expr)};`);
      }
  }
}

// ============================================================
// If statement (statement-mode)
// ============================================================

function emit_if_stmt(ctx: CodegenCtx, expr: HExpr & { kind: "if_expr" }, mode: "return" | "discard"): void {
  ctx.emit(`if (${ctx.gen_expr(expr.condition)}) {`);
  ctx.push_indent();
  emit_block_in_stmt_context(ctx, expr.then_branch, mode);
  ctx.pop_indent();
  if (!expr.else_branch) {
    ctx.emit("}");
  } else if (expr.else_branch.kind === "if_expr") {
    emit_else_if(ctx, expr.else_branch, mode);
  } else {
    ctx.emit("} else {");
    ctx.push_indent();
    emit_block_in_stmt_context(ctx, expr.else_branch, mode);
    ctx.pop_indent();
    ctx.emit("}");
  }
}

function emit_else_if(ctx: CodegenCtx, expr: HExpr & { kind: "if_expr" }, mode: "return" | "discard"): void {
  ctx.emit(`} else if (${ctx.gen_expr(expr.condition)}) {`);
  ctx.push_indent();
  emit_block_in_stmt_context(ctx, expr.then_branch, mode);
  ctx.pop_indent();
  if (!expr.else_branch) {
    ctx.emit("}");
  } else if (expr.else_branch.kind === "if_expr") {
    emit_else_if(ctx, expr.else_branch, mode);
  } else {
    ctx.emit("} else {");
    ctx.push_indent();
    emit_block_in_stmt_context(ctx, expr.else_branch, mode);
    ctx.pop_indent();
    ctx.emit("}");
  }
}

// ============================================================
// Block in statement context
// ============================================================

export function emit_block_in_stmt_context(ctx: CodegenCtx, block: HBlock, mode: "return" | "discard"): void {
  for (const stmt of block.stmts) {
    ctx.emit_stmt(stmt);
  }
  if (block.tail) {
    emit_in_stmt_context(ctx, block.tail, mode);
  }
}

// ============================================================
// Block body (shared between functions and IIFE blocks)
// ============================================================

export function emit_block_body(ctx: CodegenCtx, block: HBlock): void {
  for (const stmt of block.stmts) {
    ctx.emit_stmt(stmt);
  }
  if (block.tail) {
    emit_in_stmt_context(ctx, block.tail, "return");
  }
}

// ============================================================
// Match statement (statement-mode)
// ============================================================

export function emit_match_stmt(ctx: CodegenCtx, expr: HExpr & { kind: "match_expr" }, mode: "return" | "discard"): void {
  const label = `__ring_match${ctx.match_counter++}`;
  const scrutinee = ctx.gen_expr(expr.scrutinee);
  ctx.emit(`${label}: {`);
  ctx.push_indent();
  const scrut_var = `__ring_m${ctx.match_counter - 1}`;
  ctx.emit(`const ${scrut_var} = ${scrutinee};`);

  for (const arm of expr.arms) {
    const cond = gen_pattern_condition(ctx, scrut_var, arm.pattern);
    const bindings_str = gen_pattern_bindings(ctx, scrut_var, arm.pattern);
    if (cond === "true" && !arm.guard) {
      if (bindings_str) ctx.emit(bindings_str.trim());
      emit_in_stmt_context(ctx, arm.body, mode);
      ctx.emit(`break ${label};`);
    } else if (arm.guard) {
      ctx.emit(`if (${cond}) {`);
      ctx.push_indent();
      if (bindings_str) ctx.emit(bindings_str.trim());
      ctx.emit(`if (${ctx.gen_expr(arm.guard)}) {`);
      ctx.push_indent();
      emit_in_stmt_context(ctx, arm.body, mode);
      ctx.emit(`break ${label};`);
      ctx.pop_indent();
      ctx.emit("}");
      ctx.pop_indent();
      ctx.emit("}");
    } else {
      ctx.emit(`if (${cond}) {`);
      ctx.push_indent();
      if (bindings_str) ctx.emit(bindings_str.trim());
      emit_in_stmt_context(ctx, arm.body, mode);
      ctx.emit(`break ${label};`);
      ctx.pop_indent();
      ctx.emit("}");
    }
  }

  const has_catchall = expr.arms.some(a =>
    (a.pattern.kind === "wildcard" || a.pattern.kind === "binding") && !a.guard
  );
  if (!has_catchall) {
    ctx.emit(`${RUNTIME_MATCH_FAIL}(${scrut_var});`);
  }
  ctx.pop_indent();
  ctx.emit(`}`);
}

// ============================================================
// Statements
// ============================================================

export function emit_stmt(ctx: CodegenCtx, stmt: HStmt): void {
  switch (stmt.kind) {
    case "expr_stmt":
      emit_in_stmt_context(ctx, stmt.expr, "discard");
      return;
    case "return_stmt":
      if (stmt.value) {
        emit_in_stmt_context(ctx, stmt.value, "return");
      } else {
        ctx.emit("return;");
      }
      return;
    case "while_stmt":
      ctx.emit(`while (${ctx.gen_expr(stmt.condition)}) {`);
      ctx.push_indent();
      emit_block_in_stmt_context(ctx, stmt.body, "discard");
      ctx.pop_indent();
      ctx.emit("}");
      return;
    case "for_in_stmt": {
      if (stmt.iterable.kind === "range") {
        const start_js = ctx.gen_expr(stmt.iterable.start);
        const end_js = ctx.gen_expr(stmt.iterable.end);
        const binding = safe_ident(stmt.binding);
        const end_var = `__ring_end${ctx.loop_counter++}`;
        ctx.emit(`const ${end_var} = ${end_js};`);
        const cmp = stmt.iterable.inclusive ? "<=" : "<";
        ctx.emit(`for (let ${binding} = ${start_js}; ${binding} ${cmp} ${end_var}; ${binding}++) {`);
      } else if (stmt.destructure && stmt.destructure.length > 0) {
        const iter = ctx.gen_expr(stmt.iterable);
        const names = stmt.destructure.map(d => safe_ident(d.name)).join(", ");
        ctx.emit(`for (const [${names}] of ${iter}) {`);
      } else {
        const iter = ctx.gen_expr(stmt.iterable);
        const binding = safe_ident(stmt.binding);
        ctx.emit(`for (const ${binding} of ${iter}) {`);
      }
      ctx.push_indent();
      emit_block_in_stmt_context(ctx, stmt.body, "discard");
      ctx.pop_indent();
      ctx.emit("}");
      return;
    }
    case "break_stmt":
      ctx.emit("break;");
      return;
    case "continue_stmt":
      ctx.emit("continue;");
      return;
    case "let_destructure": {
      const init = ctx.gen_expr(stmt.init);
      const tmp = `__ring_dt${ctx.dt_counter++}`;
      ctx.emit(`const ${tmp} = ${init};`);
      for (let i = 0; i < stmt.bindings.length; i++) {
        const b = stmt.bindings[i];
        if (b.name !== "_") {
          ctx.emit(`const ${safe_ident(b.name)} = ${tmp}[${i}];`);
        }
      }
      return;
    }
    case "if_let": {
      ctx.emit("{");
      ctx.push_indent();
      const scrutinee = ctx.gen_expr(stmt.expr);
      ctx.emit(`const __ring_t = ${scrutinee};`);
      const cond = gen_pattern_condition(ctx, "__ring_t", stmt.pattern);
      ctx.emit(`if (${cond}) {`);
      ctx.push_indent();
      const bindings = gen_pattern_bindings(ctx, "__ring_t", stmt.pattern);
      if (bindings.trim()) ctx.emit(bindings.trim());
      emit_block_in_stmt_context(ctx, stmt.then_block, "discard");
      ctx.pop_indent();
      if (stmt.else_block) {
        ctx.emit("} else {");
        ctx.push_indent();
        emit_block_in_stmt_context(ctx, stmt.else_block, "discard");
        ctx.pop_indent();
        ctx.emit("}");
      } else {
        ctx.emit("}");
      }
      ctx.pop_indent();
      ctx.emit("}");
      return;
    }
    default:
      ctx.emit(gen_stmt_inline(ctx, stmt));
  }
}

// ============================================================
// Inline statement generation (for IIFE bodies)
// ============================================================

export function gen_stmt_inline(ctx: CodegenCtx, stmt: HStmt): string {
  switch (stmt.kind) {
    case "let_stmt":
      return `const ${safe_ident(stmt.name)} = ${ctx.gen_expr(stmt.init)};`;
    case "var_stmt":
      return `let ${safe_ident(stmt.name)} = ${ctx.gen_expr(stmt.init)};`;
    case "assign_stmt":
      return `${ctx.gen_expr(stmt.target)} = ${ctx.gen_expr(stmt.value)};`;
    case "expr_stmt":
      return `${ctx.gen_expr(stmt.expr)};`;
    case "return_stmt":
      if (stmt.value) {
        return `return ${ctx.gen_expr(stmt.value)};`;
      }
      return "return;";
    case "while_stmt":
    case "for_in_stmt":
    case "break_stmt":
    case "continue_stmt":
    case "let_destructure":
    case "if_let":
      throw new Error(`${stmt.kind} handled in emit_stmt`);
    default:
      return assertNever(stmt, "gen_stmt_inline");
  }
}

// ============================================================
// Pattern condition generation
// ============================================================

export function gen_pattern_condition(_ctx: CodegenCtx, target: string, pat: Pattern): string {
  switch (pat.kind) {
    case "wildcard":
    case "binding":
      return "true";
    case "literal":
      return `${target} === ${JSON.stringify(pat.value)}`;
    case "constructor": {
      const tag_check = `${target}.${ENUM_TAG_FIELD} === "${pat.name}"`;
      const sub_conds = pat.fields.map((f, i) =>
        gen_pattern_condition(_ctx, `${target}._${i}`, f)
      ).filter(c => c !== "true");
      if (sub_conds.length === 0) return tag_check;
      return `${tag_check} && ${sub_conds.join(" && ")}`;
    }
    case "named_constructor": {
      const tag_check = `${target}.${ENUM_TAG_FIELD} === "${pat.name}"`;
      const sub_conds = pat.fields.map(f =>
        gen_pattern_condition(_ctx, `${target}.${safe_ident(f.name)}`, f.pattern)
      ).filter(c => c !== "true");
      if (sub_conds.length === 0) return tag_check;
      return `${tag_check} && ${sub_conds.join(" && ")}`;
    }
    case "tuple": {
      const len_check = `Array.isArray(${target}) && ${target}.length === ${pat.elements.length}`;
      const sub_conds = pat.elements.map((e, i) =>
        gen_pattern_condition(_ctx, `${target}[${i}]`, e)
      ).filter(c => c !== "true");
      if (sub_conds.length === 0) return len_check;
      return `${len_check} && ${sub_conds.join(" && ")}`;
    }
    default:
      return assertNever(pat, "gen_pattern_condition");
  }
}

// ============================================================
// Pattern bindings generation
// ============================================================

export function gen_pattern_bindings(_ctx: CodegenCtx, target: string, pat: Pattern): string {
  switch (pat.kind) {
    case "wildcard":
    case "literal":
      return "";
    case "binding":
      return `const ${safe_ident(pat.name)} = ${target}; `;
    case "constructor":
      return pat.fields.map((f, i) =>
        gen_pattern_bindings(_ctx, `${target}._${i}`, f)
      ).join("");
    case "named_constructor":
      return pat.fields.map(f =>
        gen_pattern_bindings(_ctx, `${target}.${safe_ident(f.name)}`, f.pattern)
      ).join("");
    case "tuple":
      return pat.elements.map((e, i) =>
        gen_pattern_bindings(_ctx, `${target}[${i}]`, e)
      ).join("");
    default:
      return assertNever(pat, "gen_pattern_bindings");
  }
}
