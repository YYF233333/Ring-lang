// Ring-lang Type Inference Engine (Algorithm W variant)
// Two-pass: register all top-level decls, then infer all bodies.
// This is the thin shell — delegates to infer-ctx, infer-register, infer-expr, infer-modules.

import {
  Program, Decl, FnDecl, StructDecl, EnumDecl, EffectDecl, TestDecl, TraitDecl, ExternFnDecl,
  Expr, Stmt, BlockExpr,
  UseDecl,
} from "../ast/index.js";
import { assertNever, CompileError } from "../errors.js";
import { DiagnosticSink } from "../diagnostics/index.js";
import {
  Type, FnType, EffectRow,
  INT, FLOAT, STR, BOOL, UNIT,
  EMPTY_ROW, type_to_string,
} from "../types/index.js";
import {
  HExpr, HStmt, HDecl, HFnDecl, HStructDecl, HEnumDecl, HImplDecl, HEffectDecl, HTestDecl, HTraitDecl, HExternFnDecl, HExternTypeDecl, HTypeAliasDecl,
  HBlock, HParam, HProgram, HWhileStmt, HForInStmt,
  HLetDestructureStmt, HIfLetStmt,
  BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_SET, BUILTIN_MAP,
} from "../hir/index.js";
import { TypeEnv } from "./env.js";
import { Substitution, empty_subst, apply, FreshIdGen } from "./unify.js";
import { ZonkCtx, zonk_type, zonk_row, zonk_param, zonk_block } from "./zonk.js";
import { ModuleExports } from "../modules/exports.js";
import { E } from "../diagnostics/codes.js";
import type { TupleLitExpr } from "../ast/index.js";
import type { HTupleLit } from "../hir/index.js";

// Import from split modules
import type { InferCtx, InferResult, FnBoundsEntry } from "./infer-ctx.js";
import {
  type_error, merge_effects, unify_at,
  generalize, update_fn_effects,
  resolve_type_expr, resolve_self_type,
  bind_pattern,
} from "./infer-ctx.js";
import { register_decl, register_decl_public } from "./infer-register.js";
import {
  infer_ident, infer_bin_op, infer_unary_op,
  infer_call, infer_method_call, infer_field_access,
  infer_struct_lit, infer_match, infer_if,
  infer_string_interp, infer_or, infer_catch,
  infer_handle, infer_lambda, infer_list_literal,
  infer_try_block, infer_option_unwrap,
} from "./infer-expr.js";
import { inject_module_exports, resolve_uses } from "./infer-modules.js";

// ============================================================
// InferEngine — thin shell implementing InferCtx
// ============================================================

export class InferEngine implements InferCtx {
  public env: TypeEnv;
  public subst: Substitution;
  public sink: DiagnosticSink;
  public type_param_scope: Map<string, Type> = new Map();
  public current_fn_return_type: Type | null = null;
  public current_fn_bounds: FnBoundsEntry[] = [];
  public fn_bounds_stack: FnBoundsEntry[][] = [];
  public loop_depth: number = 0;
  readonly fresh_id: FreshIdGen;

  constructor(sink: DiagnosticSink) {
    this.sink = sink;
    this.env = new TypeEnv();
    this.subst = empty_subst();
    this.fresh_id = () => this.env.fresh_var_id();
  }

  // ============================================================
  // Multi-module support (delegate to infer-modules)
  // ============================================================

  inject_module_exports(exports: ModuleExports[]): void {
    inject_module_exports(this, exports);
  }

  resolve_uses(uses: UseDecl[], available_modules: ModuleExports[]): void {
    resolve_uses(this, uses, available_modules);
  }

  // ============================================================
  // Public entry point
  // ============================================================

  check(program: Program): HProgram {
    // Pass 1: register all top-level declarations (recover per decl)
    for (const decl of program.decls) {
      try {
        register_decl(this, decl);
      } catch (e) {
        if (e instanceof CompileError) continue;
        throw e;
      }
    }

    // Pass 2: type-check all declaration bodies (recover at declaration boundaries)
    const hdecls: HDecl[] = [];
    for (const decl of program.decls) {
      try {
        const hd = this.check_decl(decl);
        if (hd) {
          hdecls.push(hd);
          if (hd.kind === "fn_decl" && hd.effects.effects.length > 0) {
            update_fn_effects(this, hd.name, hd.effects);
          }
        }
      } catch (e) {
        if (e instanceof CompileError) {
          continue;
        }
        throw e;
      }
    }

    return { decls: hdecls };
  }

  public register_decl_public(decl: Decl): void {
    register_decl_public(this, decl);
  }

  // ============================================================
  // Pass 2: Check declarations
  // ============================================================

  private check_decl(decl: Decl): HDecl | null {
    switch (decl.kind) {
      case "struct_decl":
        return this.check_struct_decl(decl);
      case "enum_decl":
        return this.check_enum_decl(decl);
      case "effect_decl":
        return this.check_effect_decl(decl);
      case "impl_decl":
        return this.check_impl_decl(decl);
      case "fn_decl":
        return this.check_fn_decl(decl);
      case "test_decl":
        return this.check_test_decl(decl);
      case "trait_decl":
        return this.check_trait_decl(decl);
      case "extern_fn_decl":
        return this.check_extern_fn_decl(decl);
      case "extern_type_decl":
        return { kind: "extern_type_decl", name: decl.name, type_params: decl.type_params, is_pub: decl.is_pub, span: decl.span } as HExternTypeDecl;
      case "type_alias_decl": {
        const alias = this.env.type_aliases.get(decl.name);
        return { kind: "type_alias_decl", name: decl.name, type: alias?.type ?? UNIT, is_pub: decl.is_pub, span: decl.span } as HTypeAliasDecl;
      }
      default:
        return assertNever(decl, "check_decl");
    }
  }

  private check_struct_decl(decl: StructDecl): HStructDecl {
    const def = this.env.structs.get(decl.name)!;
    return {
      kind: "struct_decl",
      name: decl.name,
      type_params: decl.type_params,
      fields: def.fields.map(f => ({ name: f.name, type: f.type, is_pub: f.is_pub })),
      is_pub: decl.is_pub,
      span: decl.span,
    };
  }

  private check_enum_decl(decl: EnumDecl): HEnumDecl {
    const def = this.env.enums.get(decl.name)!;
    return {
      kind: "enum_decl",
      name: decl.name,
      type_params: decl.type_params,
      variants: def.variants.map(v => ({ name: v.name, fields: v.fields, field_names: v.field_names })),
      is_pub: decl.is_pub,
      span: decl.span,
    };
  }

  private check_effect_decl(decl: EffectDecl): HEffectDecl {
    const def = this.env.effects.get(decl.name)!;
    return {
      kind: "effect_decl",
      name: decl.name,
      type_params: decl.type_params,
      ops: def.ops.map((op, op_idx) => ({
        name: op.name,
        params: op.params.map((t, i) => ({ name: decl.ops[op_idx]?.params[i]?.name ?? `p${i}`, type: t })),
        return_type: op.return_type,
      })),
      is_pub: decl.is_pub,
      span: decl.span,
    };
  }

  private check_impl_decl(decl: import("../ast/index.js").ImplDecl): HImplDecl {
    const impl_self_type = resolve_self_type(this, decl.target_type);
    const hmethods: (HFnDecl | HExternFnDecl)[] = [];
    for (const method of decl.methods) {
      if (method.kind === "extern_fn_decl") {
        hmethods.push(this.check_extern_fn_decl(method));
      } else {
        hmethods.push(this.check_fn_decl(method, impl_self_type));
      }
    }
    return {
      kind: "impl_decl",
      target_type: decl.target_type,
      type_params: decl.type_params,
      trait_name: decl.trait_name,
      methods: hmethods,
      span: decl.span,
    };
  }

  private check_trait_decl(decl: TraitDecl): HTraitDecl {
    const trait_def = this.env.traits.get(decl.name)!;
    const self_var = trait_def.methods.length > 0 && trait_def.methods[0].type.params.length > 0
      ? trait_def.methods[0].type.params[0]
      : this.env.fresh_var();

    const hmethods = trait_def.methods.map(m => {
      const ast_method = decl.methods.find(dm => dm.name === m.name);
      const params: HParam[] = m.type.params.map((t, i) => ({
        name: ast_method?.params[i]?.name ?? `p${i}`,
        type: t,
        is_mutable: ast_method?.params[i]?.is_mutable,
      }));
      let body: HBlock | undefined;
      if (m.has_default && ast_method && ast_method.body.stmts.length + (ast_method.body.tail ? 1 : 0) > 0) {
        const saved_subst = this.subst;
        this.subst = empty_subst();
        this.env.push_scope();
        this.fn_bounds_stack.push(this.current_fn_bounds);
        this.current_fn_bounds = [];
        try {
          if (self_var.kind === "var") {
            this.current_fn_bounds.push({
              type_param_var_id: self_var.id,
              trait_name: decl.name,
              type_param_name: "self",
            });
          }
          for (const p of params) {
            this.env.bind_mono(p.name, p.type);
            if (p.is_mutable) {
              const ps = this.env.lookup(p.name)!;
              this.env.mutable_vars.add(ps.def_id!);
            }
          }
          const body_result = this.infer_block(ast_method.body);
          this.subst = body_result.subst;
          const trait_ctx: ZonkCtx = { subst: this.subst, names: new Map() };
          body = zonk_block(trait_ctx, body_result.hexpr as HBlock);
        } finally {
          this.env.pop_scope();
          this.current_fn_bounds = this.fn_bounds_stack.pop()!;
          this.subst = saved_subst;
        }
      }
      return { name: m.name, params, return_type: m.type.return_type, has_default: m.has_default, body };
    });
    return {
      kind: "trait_decl",
      name: decl.name,
      type_params: decl.type_params,
      methods: hmethods,
      is_pub: decl.is_pub,
      span: decl.span,
    };
  }

  private check_extern_fn_decl(decl: ExternFnDecl): HExternFnDecl {
    const scheme = this.env.lookup(decl.name)!;
    const fn_type = scheme.type as FnType;
    const hparams: HParam[] = decl.params.map((p, i) => ({
      name: p.name,
      type: fn_type.params[i],
      def_id: undefined,
    }));
    return {
      kind: "extern_fn_decl",
      name: decl.name,
      def_id: scheme.def_id,
      type_params: decl.type_params,
      params: hparams,
      return_type: fn_type.return_type,
      effects: EMPTY_ROW,
      is_pub: decl.is_pub,
      span: decl.span,
    };
  }

  private check_fn_decl(decl: FnDecl, self_type?: Type): HFnDecl {
    const saved_subst = this.subst;
    this.subst = empty_subst();
    this.env.push_scope();

    const saved_tp_scope = new Map(this.type_param_scope);
    for (const tp of decl.type_params) {
      const tv = this.env.fresh_var();
      this.type_param_scope.set(tp.name, tv);
      this.env.bind_mono(tp.name, tv);
    }

    this.fn_bounds_stack.push(this.current_fn_bounds);
    this.current_fn_bounds = [];
    for (const tp of decl.type_params) {
      const tv = this.type_param_scope.get(tp.name);
      if (tv && tv.kind === "var") {
        for (const bound of tp.bounds) {
          this.current_fn_bounds.push({ type_param_var_id: tv.id, trait_name: bound.trait_name, type_param_name: tp.name });
        }
      }
    }

    const hparams: HParam[] = [];
    for (const p of decl.params) {
      const ptype = p.type_annotation ? resolve_type_expr(this, p.type_annotation)
        : (p.name === "self" && self_type) ? self_type
        : this.env.fresh_var();
      this.env.bind_mono(p.name, ptype);
      const param_scheme = this.env.lookup(p.name)!;
      this.env.record_def_span(param_scheme.def_id!, p.span);
      if (p.is_mutable) {
        this.env.mutable_vars.add(param_scheme.def_id!);
      }
      hparams.push({ name: p.name, type: ptype, def_id: param_scheme.def_id, is_mutable: p.is_mutable });
    }

    const saved_fn_return = this.current_fn_return_type;
    const expected_ret = decl.return_type ? resolve_type_expr(this, decl.return_type) : this.env.fresh_var();
    this.current_fn_return_type = expected_ret;

    let final_params!: HParam[];
    let final_ret!: Type;
    let effects!: EffectRow;
    let final_body!: HBlock;

    try {
      const body_result = this.infer_block(decl.body);
      this.subst = body_result.subst;

      this.subst = unify_at(this, body_result.hexpr.type, expected_ret, this.subst, decl.span);

      const local_names = new Map<number, string>();
      for (const tp of decl.type_params) {
        const tv = this.type_param_scope.get(tp.name);
        if (tv && tv.kind === "var") {
          const resolved = apply(this.subst, tv);
          if (resolved.kind === "var") local_names.set(resolved.id, tp.name);
        }
      }
      const declared_tp_names = new Set(decl.type_params.map(tp => tp.name));
      for (const [name, tv] of this.type_param_scope) {
        if (!saved_tp_scope.has(name) && !declared_tp_names.has(name) && tv.kind === "var") {
          const resolved = apply(this.subst, tv);
          if (resolved.kind === "var") local_names.set(resolved.id, name);
        }
      }

      const ctx: ZonkCtx = { subst: this.subst, names: local_names };
      final_params = hparams.map(p => zonk_param(ctx, p));
      final_ret = zonk_type(ctx, expected_ret);
      effects = zonk_row(ctx, body_result.effects);
      final_body = zonk_block(ctx, body_result.hexpr as HBlock);
    } finally {
      this.current_fn_return_type = saved_fn_return;
      this.env.pop_scope();
      this.type_param_scope = saved_tp_scope;
      this.current_fn_bounds = this.fn_bounds_stack.pop()!;
      this.subst = saved_subst;
    }

    const trait_bounds: { type_param: string; trait_name: string }[] = [];
    for (const tp of decl.type_params) {
      for (const bound of tp.bounds) {
        trait_bounds.push({ type_param: tp.name, trait_name: bound.trait_name });
      }
    }

    const fn_scheme = this.env.lookup(decl.name);
    const fn_def_id = fn_scheme?.def_id;
    if (fn_def_id !== undefined) {
      this.env.record_def_span(fn_def_id, decl.span);
    }

    return {
      kind: "fn_decl",
      name: decl.name,
      def_id: fn_def_id,
      type_params: decl.type_params,
      params: final_params,
      return_type: final_ret,
      effects,
      body: final_body,
      is_pub: decl.is_pub,
      trait_bounds,
      span: decl.span,
    };
  }

  private check_test_decl(decl: TestDecl): HTestDecl {
    const saved_subst = this.subst;
    this.subst = empty_subst();
    this.env.push_scope();
    let final_body!: HBlock;
    try {
      const body_result = this.infer_block(decl.body);
      this.subst = body_result.subst;
      const ctx: ZonkCtx = { subst: this.subst, names: new Map() };
      final_body = zonk_block(ctx, body_result.hexpr as HBlock);
    } finally {
      this.env.pop_scope();
      this.subst = saved_subst;
    }
    return {
      kind: "test_decl",
      description: decl.description,
      body: final_body,
      span: decl.span,
    };
  }

  // ============================================================
  // Infer Block
  // ============================================================

  infer_block(block: BlockExpr, initial_subst?: Substitution): InferResult {
    let subst = initial_subst ?? this.subst;
    let effects: EffectRow = EMPTY_ROW;
    const hstmts: HStmt[] = [];

    for (const stmt of block.stmts) {
      const sr = this.infer_stmt(stmt, subst);
      subst = sr.subst;
      [effects, subst] = merge_effects(this, effects, sr.effects, subst);
      hstmts.push(sr.hstmt);
    }

    let tail_hexpr: HExpr | undefined;
    let block_type: Type = UNIT;

    if (block.tail) {
      const tr = this.infer_expr(block.tail, subst);
      subst = tr.subst;
      [effects, subst] = merge_effects(this, effects, tr.effects, subst);
      tail_hexpr = tr.hexpr;
      block_type = tr.hexpr.type;
    }

    const hblock: HBlock = {
      kind: "block",
      stmts: hstmts,
      tail: tail_hexpr,
      type: block_type,
      effects,
      span: block.span,
    };

    return { hexpr: hblock, subst, effects };
  }

  // ============================================================
  // Infer Statements
  // ============================================================

  infer_stmt(stmt: Stmt, subst: Substitution): { hstmt: HStmt; subst: Substitution; effects: EffectRow } {
    switch (stmt.kind) {
      case "let_stmt": {
        const init_r = this.infer_expr(stmt.init, subst);
        let s = init_r.subst;
        let var_type = init_r.hexpr.type;
        if (stmt.type_annotation) {
          const annotated = resolve_type_expr(this, stmt.type_annotation);
          s = unify_at(this, var_type, annotated, s, stmt.span);
          var_type = apply(s, annotated);
        }
        const resolved = apply(s, var_type);
        const scheme = generalize(this, resolved, s);
        this.env.bind(stmt.name, scheme);
        this.env.record_def_span(scheme.def_id!, stmt.name_span);
        return {
          hstmt: { kind: "let_stmt", name: stmt.name, name_span: stmt.name_span, def_id: scheme.def_id, type: resolved, init: init_r.hexpr, span: stmt.span },
          subst: s,
          effects: init_r.effects,
        };
      }
      case "var_stmt": {
        const init_r = this.infer_expr(stmt.init, subst);
        let s = init_r.subst;
        let var_type = init_r.hexpr.type;
        if (stmt.type_annotation) {
          const annotated = resolve_type_expr(this, stmt.type_annotation);
          s = unify_at(this, var_type, annotated, s, stmt.span);
          var_type = apply(s, annotated);
        }
        this.env.bind_mono(stmt.name, apply(s, var_type));
        const var_scheme = this.env.lookup(stmt.name)!;
        this.env.record_def_span(var_scheme.def_id!, stmt.name_span);
        this.env.mutable_vars.add(var_scheme.def_id!);
        return {
          hstmt: { kind: "var_stmt", name: stmt.name, name_span: stmt.name_span, def_id: var_scheme.def_id, type: apply(s, var_type), init: init_r.hexpr, span: stmt.span },
          subst: s,
          effects: init_r.effects,
        };
      }
      case "assign_stmt": {
        if (stmt.target.kind === "ident") {
          const scheme = this.env.lookup(stmt.target.name);
          if (scheme && scheme.def_id !== undefined && !this.env.mutable_vars.has(scheme.def_id)) {
            type_error(this,
              E.E0205,
              `Cannot assign to immutable variable '${stmt.target.name}' (declared with 'let'). Use 'var' for mutable bindings.`,
              stmt.target.span,
              { kind: "other", detail: `'${stmt.target.name}' is declared with 'let'` },
            );
          }
        } else if (stmt.target.kind === "field_access") {
          let root: Expr = stmt.target;
          while (root.kind === "field_access") root = root.receiver;
          if (root.kind === "ident") {
            const scheme = this.env.lookup(root.name);
            if (scheme && scheme.def_id !== undefined && !this.env.mutable_vars.has(scheme.def_id)) {
              type_error(this,
                E.E0205,
                `Cannot assign to field of immutable variable '${root.name}'. Use 'var' for mutable bindings.`,
                stmt.target.span,
                { kind: "other", detail: `'${root.name}' is not mutable` },
              );
            }
          }
        }
        const target_r = this.infer_expr(stmt.target, subst);
        const value_r = this.infer_expr(stmt.value, target_r.subst);
        let s = unify_at(this, target_r.hexpr.type, value_r.hexpr.type, value_r.subst, stmt.span);
        let effects: EffectRow;
        [effects, s] = merge_effects(this, target_r.effects, value_r.effects, s);
        return {
          hstmt: { kind: "assign_stmt", target: target_r.hexpr, value: value_r.hexpr, span: stmt.span },
          subst: s,
          effects,
        };
      }
      case "expr_stmt": {
        const r = this.infer_expr(stmt.expr, subst);
        return {
          hstmt: { kind: "expr_stmt", expr: r.hexpr, span: stmt.span },
          subst: r.subst,
          effects: r.effects,
        };
      }
      case "return_stmt": {
        if (stmt.value) {
          const r = this.infer_expr(stmt.value, subst);
          let s = r.subst;
          if (this.current_fn_return_type) {
            s = unify_at(this, r.hexpr.type, this.current_fn_return_type, s, stmt.span);
          }
          return {
            hstmt: { kind: "return_stmt", value: r.hexpr, span: stmt.span },
            subst: s,
            effects: r.effects,
          };
        }
        if (this.current_fn_return_type) {
          subst = unify_at(this, UNIT, this.current_fn_return_type, subst, stmt.span);
        }
        return {
          hstmt: { kind: "return_stmt", span: stmt.span },
          subst,
          effects: EMPTY_ROW,
        };
      }
      case "while_stmt": {
        const cond_r = this.infer_expr(stmt.condition, subst);
        let s = unify_at(this, cond_r.hexpr.type, BOOL, cond_r.subst, stmt.condition.span);
        this.env.push_scope();
        this.loop_depth++;
        let body_r!: InferResult;
        try {
          body_r = this.infer_block(stmt.body, s);
        } finally {
          this.loop_depth--;
          this.env.pop_scope();
        }
        s = body_r.subst;
        let while_effects: EffectRow;
        [while_effects, s] = merge_effects(this, cond_r.effects, body_r.effects, s);
        const hwhile: HWhileStmt = {
          kind: "while_stmt",
          condition: cond_r.hexpr,
          body: body_r.hexpr as HBlock,
          span: stmt.span,
        };
        return {
          hstmt: hwhile,
          subst: s,
          effects: while_effects,
        };
      }
      case "for_in_stmt": {
        const iter_r = this.infer_expr(stmt.iterable, subst);
        let s = iter_r.subst;
        const iter_type = apply(s, iter_r.hexpr.type);
        let element_type: Type;
        const is_destructure = !!stmt.destructure;
        if (iter_type.kind === "enum" && iter_type.name === BUILTIN_RANGE && iter_type.type_params.length > 0) {
          element_type = iter_type.type_params[0];
        } else if (iter_type.kind === "struct" && iter_type.name === BUILTIN_LIST && iter_type.type_params.length > 0) {
          element_type = iter_type.type_params[0];
        } else if (iter_type.kind === "struct" && iter_type.name === BUILTIN_SET && iter_type.type_params.length > 0) {
          element_type = iter_type.type_params[0];
        } else if (iter_type.kind === "struct" && iter_type.name === BUILTIN_MAP && iter_type.type_params.length >= 2) {
          if (!is_destructure) {
            type_error(this,
              E.E0301,
              `Map is not directly iterable with for..in. Use 'for (k, v) in map { ... }' instead.`,
              stmt.iterable.span,
              { kind: "other", detail: "Map requires destructuring: for (k, v) in map" }
            );
          }
          element_type = { kind: "tuple", elements: [iter_type.type_params[0], iter_type.type_params[1]] } as Type;
        } else {
          type_error(this,
            E.E0301,
            `for..in requires an iterable type (Range, List, Set, or Map), got ${type_to_string(iter_type)}`,
            stmt.iterable.span,
            { kind: "other", detail: "Supported iterables: range expressions (0..10), List<T>, Set<T>, Map<K,V>" }
          );
        }
        this.env.push_scope();
        let hdestructure: { name: string; def_id?: number }[] | undefined;
        if (is_destructure && stmt.destructure) {
          if (element_type.kind !== "tuple" || element_type.elements.length !== stmt.destructure.names.length) {
            type_error(this, E.E0301, `Destructure binding expects ${stmt.destructure.names.length} elements, but iterable element type is ${type_to_string(element_type)}`, stmt.span, { kind: "other", detail: "tuple arity mismatch" });
          }
          hdestructure = [];
          for (let i = 0; i < stmt.destructure.names.length; i++) {
            const name = stmt.destructure.names[i];
            const elem_t = element_type.kind === "tuple" && i < element_type.elements.length ? element_type.elements[i] : this.env.fresh_var();
            this.env.bind_mono(name, elem_t);
            const scheme = this.env.lookup(name)!;
            this.env.record_def_span(scheme.def_id!, stmt.destructure.spans[i]);
            hdestructure.push({ name, def_id: scheme.def_id });
          }
        } else {
          this.env.bind_mono(stmt.binding, element_type);
        }
        const binding_scheme = this.env.lookup(stmt.binding);
        if (binding_scheme) {
          this.env.record_def_span(binding_scheme.def_id!, stmt.binding_span);
        }
        this.loop_depth++;
        let body_r!: InferResult;
        try {
          body_r = this.infer_block(stmt.body, s);
        } finally {
          this.loop_depth--;
          this.env.pop_scope();
        }
        s = body_r.subst;
        let for_effects: EffectRow;
        [for_effects, s] = merge_effects(this, iter_r.effects, body_r.effects, s);
        const hfor: HForInStmt = {
          kind: "for_in_stmt",
          binding: stmt.binding,
          binding_span: stmt.binding_span,
          def_id: binding_scheme?.def_id,
          destructure: hdestructure,
          iterable: iter_r.hexpr,
          body: body_r.hexpr as HBlock,
          span: stmt.span,
        };
        return {
          hstmt: hfor,
          subst: s,
          effects: for_effects,
        };
      }
      case "break_stmt": {
        if (this.loop_depth === 0) {
          type_error(this, E.E0206, "'break' can only be used inside a loop", stmt.span, { kind: "other", detail: "break outside loop" });
        }
        return {
          hstmt: { kind: "break_stmt", span: stmt.span },
          subst,
          effects: EMPTY_ROW,
        };
      }
      case "continue_stmt": {
        if (this.loop_depth === 0) {
          type_error(this, E.E0206, "'continue' can only be used inside a loop", stmt.span, { kind: "other", detail: "continue outside loop" });
        }
        return {
          hstmt: { kind: "continue_stmt", span: stmt.span },
          subst,
          effects: EMPTY_ROW,
        };
      }
      case "let_destructure": {
        const init_r = this.infer_expr(stmt.init, subst);
        let s = init_r.subst;
        const init_type = apply(s, init_r.hexpr.type);
        if (init_type.kind !== "tuple") {
          type_error(this, E.E0301, `let destructuring requires tuple type, got ${type_to_string(init_type)}`, stmt.span, { kind: "other", detail: "not a tuple" });
        }
        const tuple_t = init_type.kind === "tuple" ? init_type : { kind: "tuple" as const, elements: [] };
        if (stmt.pattern.elements.length !== tuple_t.elements.length) {
          type_error(this, E.E0301,
            `Tuple has ${tuple_t.elements.length} elements but pattern has ${stmt.pattern.elements.length}`,
            stmt.span,
            { kind: "other", detail: "tuple arity mismatch" });
        }
        const bindings: { name: string; def_id?: number; type: Type }[] = [];
        for (let i = 0; i < stmt.pattern.elements.length; i++) {
          const p = stmt.pattern.elements[i];
          const elem_type = i < tuple_t.elements.length ? tuple_t.elements[i] : UNIT;
          if (p.kind === "binding") {
            this.env.bind_mono(p.name, elem_type);
            const scheme = this.env.lookup(p.name)!;
            this.env.record_def_span(scheme.def_id!, p.span);
            bindings.push({ name: p.name, def_id: scheme.def_id, type: elem_type });
          } else if (p.kind === "wildcard") {
            bindings.push({ name: "_", type: elem_type });
          } else {
            type_error(this, E.E0301, `Only binding and wildcard patterns are supported in let destructuring`, p.span, { kind: "other", detail: "unsupported pattern kind" });
            bindings.push({ name: "_", type: elem_type });
          }
        }
        const hstmt: HLetDestructureStmt = {
          kind: "let_destructure",
          pattern: stmt.pattern,
          bindings,
          init: init_r.hexpr,
          span: stmt.span,
        };
        return {
          hstmt,
          subst: s,
          effects: init_r.effects,
        };
      }
      case "if_let": {
        const expr_r = this.infer_expr(stmt.expr, subst);
        let s = expr_r.subst;
        const expr_type = apply(s, expr_r.hexpr.type);

        this.env.push_scope();
        let then_r!: { hexpr: HExpr; subst: Substitution; effects: EffectRow };
        let combined_effects: EffectRow = expr_r.effects;
        try {
          bind_pattern(this, stmt.pattern, expr_type, s);
          then_r = this.infer_block(stmt.then_block, s);
          s = then_r.subst;
          [combined_effects, s] = merge_effects(this, combined_effects, then_r.effects, s);
        } finally {
          this.env.pop_scope();
        }

        let else_hblock: HBlock | null = null;
        if (stmt.else_block) {
          this.env.push_scope();
          try {
            const else_r = this.infer_block(stmt.else_block, s);
            s = else_r.subst;
            else_hblock = else_r.hexpr as HBlock;
            [combined_effects, s] = merge_effects(this, combined_effects, else_r.effects, s);
          } finally {
            this.env.pop_scope();
          }
        }

        const hstmt: HIfLetStmt = {
          kind: "if_let",
          pattern: stmt.pattern,
          expr: expr_r.hexpr,
          then_block: then_r.hexpr as HBlock,
          else_block: else_hblock,
          span: stmt.span,
        };
        return { hstmt, subst: s, effects: combined_effects };
      }
    }
  }

  // ============================================================
  // Infer Expressions — dispatch to infer-expr functions
  // ============================================================

  infer_expr(expr: Expr, subst: Substitution): InferResult {
    switch (expr.kind) {
      case "int_lit":
        return {
          hexpr: { kind: "int_lit", value: expr.value, type: INT, effects: EMPTY_ROW, span: expr.span },
          subst,
          effects: EMPTY_ROW,
        };
      case "float_lit":
        return {
          hexpr: { kind: "float_lit", value: expr.value, type: FLOAT, effects: EMPTY_ROW, span: expr.span },
          subst,
          effects: EMPTY_ROW,
        };
      case "str_lit":
        return {
          hexpr: { kind: "str_lit", value: expr.value, type: STR, effects: EMPTY_ROW, span: expr.span },
          subst,
          effects: EMPTY_ROW,
        };
      case "bool_lit":
        return {
          hexpr: { kind: "bool_lit", value: expr.value, type: BOOL, effects: EMPTY_ROW, span: expr.span },
          subst,
          effects: EMPTY_ROW,
        };
      case "ident":
        return infer_ident(this, expr.name, expr.span, subst, expr.qualifier);
      case "bin_op":
        return infer_bin_op(this, expr.op, expr.left, expr.right, expr.span, subst);
      case "unary_op":
        return infer_unary_op(this, expr.op, expr.operand, expr.span, subst);
      case "call":
        return infer_call(this, expr.callee, expr.args, expr.span, subst);
      case "method_call":
        return infer_method_call(this, expr.receiver, expr.method, expr.args, expr.span, subst);
      case "field_access":
        return infer_field_access(this, expr.receiver, expr.field, expr.span, subst);
      case "struct_lit":
        return infer_struct_lit(this, expr.name, expr.fields, expr.spread, expr.span, subst, expr.qualifier);
      case "match_expr":
        return infer_match(this, expr.scrutinee, expr.arms, expr.span, subst);
      case "block":
        return this.infer_block(expr);
      case "if_expr":
        return infer_if(this, expr.condition, expr.then_branch, expr.else_branch, expr.span, subst);
      case "string_interp":
        return infer_string_interp(this, expr.parts, expr.span, subst);
      case "or_expr":
        return infer_or(this, expr.expr, expr.default_value, expr.span, subst);
      case "catch_expr":
        return infer_catch(this, expr.expr, expr.error_type, expr.error_binding, expr.handler, expr.span, subst);
      case "handle_expr":
        return infer_handle(this, expr.body, expr.handlers, expr.span, subst);
      case "lambda":
        return infer_lambda(this, expr.params, expr.body, expr.span, subst);
      case "option_unwrap":
        return infer_option_unwrap(this, expr.expr, expr.span, subst);
      case "try_block":
        return infer_try_block(this, expr.body, expr.span, subst);
      case "list_lit":
        return infer_list_literal(this, expr.elements, expr.span, subst);
      case "tuple_lit": {
        let s = subst;
        const helements: HExpr[] = [];
        let combined_effects: EffectRow = EMPTY_ROW;
        for (const el of (expr as TupleLitExpr).elements) {
          const r = this.infer_expr(el, s);
          s = r.subst;
          helements.push(r.hexpr);
          [combined_effects, s] = merge_effects(this, combined_effects, r.effects, s);
        }
        const elem_types = helements.map(e => apply(s, e.type));
        const tuple_type: Type = { kind: "tuple", elements: elem_types };
        return {
          hexpr: { kind: "tuple_lit", elements: helements, type: tuple_type, effects: combined_effects, span: expr.span } as HTupleLit,
          subst: s,
          effects: combined_effects,
        };
      }
      case "range": {
        const start_r = this.infer_expr(expr.start, subst);
        let s = unify_at(this, start_r.hexpr.type, INT, start_r.subst, expr.start.span);
        const end_r = this.infer_expr(expr.end, s);
        s = unify_at(this, end_r.hexpr.type, INT, end_r.subst, expr.end.span);
        let range_effects: EffectRow;
        [range_effects, s] = merge_effects(this, start_r.effects, end_r.effects, s);
        const range_type: Type = { kind: "enum", name: BUILTIN_RANGE, type_params: [INT], variants: [] };
        return {
          hexpr: {
            kind: "range", start: start_r.hexpr, end: end_r.hexpr, inclusive: expr.inclusive,
            type: range_type, effects: range_effects, span: expr.span,
          },
          subst: s,
          effects: range_effects,
        };
      }
      default:
        return assertNever(expr, "infer_expr");
    }
  }

  /** Resolve a syntactic TypeExpr to a semantic Type (public for prelude loading) */
  resolve_type_expr(texpr: import("../ast/index.js").TypeExpr): Type {
    return resolve_type_expr(this, texpr);
  }
}
