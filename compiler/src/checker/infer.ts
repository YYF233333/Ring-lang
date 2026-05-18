// Ring-lang Type Inference Engine (Algorithm W variant)
// Two-pass: register all top-level decls, then infer all bodies.

import {
  Program, Decl, FnDecl, StructDecl, EnumDecl, ImplDecl, EffectDecl, TestDecl, TraitDecl,
  Expr, Stmt, Pattern, MatchArm, TypeExpr, Param, BlockExpr,
  BinOp, UnaryOp,
  Span,
} from "../ast/index.js";
import { assertNever, CompileError } from "../errors.js";
import { DiagnosticSink, DiagnosticContext, make_diagnostic } from "../diagnostics/index.js";
import { E } from "../diagnostics/codes.js";
import {
  Type, FnType, TypeVar, EffectRow, Effect,
  INT, FLOAT, STR, BOOL, UNIT, NEVER,
  EMPTY_ROW, effect_row, row_merge, type_to_string, types_equal,
  make_option_type, is_option_type, option_inner,
} from "../types/index.js";
import {
  HExpr, HStmt, HDecl, HFnDecl, HStructDecl, HEnumDecl, HImplDecl, HEffectDecl, HTestDecl, HTraitDecl,
  HBlock, HParam, HProgram, HMatchArm, HEffectHandler, HStructFieldInit, HIdent,
  variant_js_name, trait_dict_name, trait_bound_param_name,
} from "../hir/index.js";
import { TypeEnv, StructDef, EnumDef, EffectDef, TraitMethodDef, substitute_type } from "./env.js";
import { Substitution, empty_subst, unify, UnificationError, apply, apply_to_effect_row, init_unify_fresh_counter } from "./unify.js";
import { check_exhaustive } from "./exhaustive.js";

// ============================================================
// Error helpers
// ============================================================

// ============================================================
// Inference result for expressions
// ============================================================

interface InferResult {
  hexpr: HExpr;
  subst: Substitution;
  effects: EffectRow;
}

// ============================================================
// InferEngine
// ============================================================

export class InferEngine {
  public env: TypeEnv;
  public subst: Substitution;
  private sink: DiagnosticSink;
  private type_param_scope: Map<string, Type> = new Map();
  private current_fn_return_type: Type | null = null;
  private current_fn_bounds: { type_param_var_id: number; trait_name: string; type_param_name: string }[] = [];
  private fn_bounds_stack: typeof this.current_fn_bounds[] = [];
  public type_var_names: Map<number, string> = new Map();

  constructor(sink: DiagnosticSink) {
    this.sink = sink;
    this.env = new TypeEnv();
    this.subst = empty_subst();
    init_unify_fresh_counter(this.env.current_var_id);
  }

  private type_error(code: string, message: string, span: Span, context: DiagnosticContext): never {
    const diag = make_diagnostic(code, "error", message, span, context);
    this.sink.report(diag);
    throw new CompileError([]);
  }

  private merge_effects(a: EffectRow, b: EffectRow, s: Substitution): [EffectRow, Substitution] {
    const m = row_merge(a, b);
    if (m.tails_to_unify) {
      s = unify({ kind: "var", id: m.tails_to_unify[0] } as TypeVar, { kind: "var", id: m.tails_to_unify[1] } as TypeVar, s);
    }
    return [m.row, s];
  }

  private unify_at(t1: Type, t2: Type, s: Substitution, span: Span): Substitution {
    try {
      return unify(t1, t2, s);
    } catch (e) {
      if (e instanceof UnificationError) {
        this.type_error("E0301", e.message, span, {
          kind: "type_mismatch",
          expected: type_to_string(apply(s, t1)),
          actual: type_to_string(apply(s, t2)),
        });
      }
      throw e;
    }
  }

  private free_type_vars(t: Type, subst: Substitution): Set<number> {
    const resolved = apply(subst, t);
    const result = new Set<number>();
    this.collect_free_vars(resolved, result);
    return result;
  }

  private collect_free_vars(t: Type, result: Set<number>): void {
    switch (t.kind) {
      case "var": result.add(t.id); break;
      case "fn":
        for (const p of t.params) this.collect_free_vars(p, result);
        this.collect_free_vars(t.return_type, result);
        if (t.effects.tail !== undefined) result.add(t.effects.tail);
        for (const e of t.effects.effects) {
          if (e.kind === "fail") this.collect_free_vars(e.error_type, result);
          if (e.kind === "custom") for (const a of e.type_args) this.collect_free_vars(a, result);
        }
        break;
      case "struct":
        for (const tp of t.type_params) this.collect_free_vars(tp, result);
        for (const f of t.fields) this.collect_free_vars(f.type, result);
        break;
      case "enum":
        for (const tp of t.type_params) this.collect_free_vars(tp, result);
        for (const v of t.variants) for (const f of v.fields) this.collect_free_vars(f, result);
        break;
      case "generic":
        this.collect_free_vars(t.base, result);
        for (const a of t.args) this.collect_free_vars(a, result);
        break;
      case "record":
        for (const f of t.fields) this.collect_free_vars(f.type, result);
        if (t.tail !== undefined) result.add(t.tail);
        break;
    }
  }

  private free_type_vars_in_env(subst: Substitution): Set<number> {
    const result = new Set<number>();
    for (const scope of this.env.scopes) {
      for (const [, scheme] of scope.variables) {
        const ftv = this.free_type_vars(scheme.type, subst);
        for (const v of ftv) {
          if (!scheme.type_vars.includes(v)) result.add(v);
        }
      }
    }
    return result;
  }

  private generalize(t: Type, subst: Substitution): { type: Type; type_vars: number[] } {
    const resolved = apply(subst, t);
    const ftv_type = this.free_type_vars(resolved, empty_subst());
    const ftv_env = this.free_type_vars_in_env(subst);
    const type_vars: number[] = [];
    for (const v of ftv_type) {
      if (!ftv_env.has(v)) type_vars.push(v);
    }
    return { type: resolved, type_vars };
  }

  // ============================================================
  // Public entry point
  // ============================================================

  check(program: Program): HProgram {
    // Pass 1: register all top-level declarations (recover per decl)
    for (const decl of program.decls) {
      try {
        this.register_decl(decl);
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
            this.update_fn_effects(hd.name, hd.effects);
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

  private update_fn_effects(name: string, effects: EffectRow): void {
    const scheme = this.env.lookup(name);
    if (scheme && scheme.type.kind === "fn") {
      scheme.type = { ...scheme.type, effects } as FnType;
    }
  }

  // ============================================================
  // Pass 1: Register declarations
  // ============================================================

  private register_decl(decl: Decl): void {
    switch (decl.kind) {
      case "struct_decl":
        this.register_struct(decl);
        break;
      case "enum_decl":
        this.register_enum(decl);
        break;
      case "effect_decl":
        this.register_effect(decl);
        break;
      case "impl_decl":
        this.register_impl(decl);
        break;
      case "fn_decl":
        this.register_fn(decl);
        break;
      case "test_decl":
        break;
      case "trait_decl":
        this.register_trait(decl);
        break;
      default:
        assertNever(decl, "register_decl");
    }
  }

  private register_struct(decl: StructDecl): void {
    const type_param_names = decl.type_params.map(tp => tp.name);

    // Push type params into scope for field type resolution
    const saved_tp_scope = new Map(this.type_param_scope);
    const type_param_vars: number[] = [];
    for (const tp of decl.type_params) {
      const tv = this.env.fresh_var(tp.name);
      this.type_var_names.set(tv.id, tp.name);
      type_param_vars.push(tv.id);
      this.type_param_scope.set(tp.name, tv);
    }

    const fields = decl.fields.map(f => ({
      name: f.name,
      type: this.resolve_type_expr(f.type_annotation),
      is_pub: f.is_pub,
    }));

    this.type_param_scope = saved_tp_scope;
    const def: StructDef = {
      name: decl.name,
      type_params: type_param_names,
      type_param_vars,
      fields,
    };
    this.env.structs.set(decl.name, def);
  }

  private register_enum(decl: EnumDecl): void {
    const type_param_names = decl.type_params.map(tp => tp.name);

    // Push type params into scope for resolving field types
    const saved_tp_scope = new Map(this.type_param_scope);
    const type_var_ids: number[] = [];
    const type_var_types: Type[] = [];
    for (const tp of decl.type_params) {
      const tv = this.env.fresh_var(tp.name);
      this.type_var_names.set(tv.id, tp.name);
      type_var_ids.push(tv.id);
      type_var_types.push(tv);
      this.type_param_scope.set(tp.name, tv);
    }

    const variants = decl.variants.map(v => ({
      name: v.name,
      fields: v.fields.map(f => this.resolve_type_expr(f)),
    }));
    const def: EnumDef = {
      name: decl.name,
      type_params: type_param_names,
      type_param_vars: type_var_ids,
      variants,
    };
    this.env.enums.set(decl.name, def);

    // Register variant constructors as functions
    const enum_type: Type = {
      kind: "enum",
      name: decl.name,
      type_params: type_var_types,
      variants: variants,
    };

    for (const variant of variants) {
      this.env.variant_to_enum.set(variant.name, decl.name);
      if (variant.fields.length === 0) {
        if (type_var_ids.length > 0) {
          this.env.bind(variant.name, { type: enum_type, type_vars: type_var_ids });
        } else {
          this.env.bind_mono(variant.name, enum_type);
        }
      } else {
        const fn_type: FnType = {
          kind: "fn",
          params: variant.fields,
          return_type: enum_type,
          effects: EMPTY_ROW,
        };
        if (type_var_ids.length > 0) {
          this.env.bind(variant.name, { type: fn_type, type_vars: type_var_ids });
        } else {
          this.env.bind_mono(variant.name, fn_type);
        }
      }
    }

    this.type_param_scope = saved_tp_scope;
  }

  private register_effect(decl: EffectDecl): void {
    const type_param_names = decl.type_params.map(tp => tp.name);
    const ops = decl.ops.map(op => ({
      name: op.name,
      params: op.params.map(p => p.type_annotation ? this.resolve_type_expr(p.type_annotation) : this.env.fresh_var()),
      return_type: this.resolve_type_expr(op.return_type),
    }));
    const def: EffectDef = {
      name: decl.name,
      type_params: type_param_names,
      ops,
    };
    this.env.effects.set(decl.name, def);
  }

  private register_trait(decl: TraitDecl): void {
    const saved_tp_scope = new Map(this.type_param_scope);
    const type_param_names = decl.type_params.map(tp => tp.name);
    const type_param_vars: number[] = [];
    for (const tp of decl.type_params) {
      const tv = this.env.fresh_var(tp.name);
      this.type_var_names.set(tv.id, tp.name);
      type_param_vars.push(tv.id);
      this.type_param_scope.set(tp.name, tv);
    }

    const self_var = this.env.fresh_var();
    const methods: TraitMethodDef[] = [];
    for (const method of decl.methods) {
      const param_types = method.params.map(p => {
        if (p.name === "self") return self_var;
        return p.type_annotation ? this.resolve_type_expr(p.type_annotation) : this.env.fresh_var();
      });
      const ret_type = method.return_type ? this.resolve_type_expr(method.return_type) : this.env.fresh_var();
      const fn_type: FnType = {
        kind: "fn", params: param_types, return_type: ret_type, effects: EMPTY_ROW,
      };
      methods.push({ name: method.name, type: fn_type, has_default: !method.is_abstract });
    }

    this.type_param_scope = saved_tp_scope;
    this.env.traits.set(decl.name, { name: decl.name, type_params: type_param_names, type_param_vars, methods });
  }

  private register_impl(decl: ImplDecl): void {
    // Register methods for later lookup
    let methods = this.env.impl_methods.get(decl.target_type);
    if (!methods) {
      methods = new Map();
      this.env.impl_methods.set(decl.target_type, methods);
    }
    for (const method of decl.methods) {
      const param_types = method.params.map(p =>
        p.type_annotation ? this.resolve_type_expr(p.type_annotation) : this.env.fresh_var()
      );
      const ret_type = method.return_type ? this.resolve_type_expr(method.return_type) : this.env.fresh_var();
      const fn_type: FnType = {
        kind: "fn",
        params: param_types,
        return_type: ret_type,
        effects: EMPTY_ROW,
      };
      methods.set(method.name, { type: fn_type, type_vars: [] });
    }

    // Task 6b: Validate trait impl completeness
    if (decl.trait_name) {
      const trait_def = this.env.traits.get(decl.trait_name);
      if (!trait_def) {
        this.type_error(E.E0501, `Unknown trait: ${decl.trait_name}`, decl.span, { kind: "trait_error", detail: `unknown trait '${decl.trait_name}'` });
      }
      const impl_method_names = new Set(decl.methods.map(m => m.name));
      for (const tm of trait_def.methods) {
        if (!tm.has_default && !impl_method_names.has(tm.name)) {
          this.type_error(E.E0502, `Missing method '${tm.name}' in impl ${decl.trait_name} for ${decl.target_type}`, decl.span, { kind: "trait_error", detail: `missing method '${tm.name}'` });
        }
      }
      this.env.trait_impls.push({
        trait_name: decl.trait_name,
        target_type_name: decl.target_type,
        type_params: decl.type_params.map(tp => tp.name),
        method_names: decl.methods.map(m => m.name),
      });
    }
  }

  private register_fn(decl: FnDecl): void {
    const type_vars: number[] = [];
    const saved_tp_scope = new Map(this.type_param_scope);
    for (const tp of decl.type_params) {
      const tv = this.env.fresh_var(tp.name);
      this.type_var_names.set(tv.id, tp.name);
      type_vars.push((tv as TypeVar).id);
      this.type_param_scope.set(tp.name, tv);
    }

    const param_types = decl.params.map(p =>
      p.type_annotation ? this.resolve_type_expr(p.type_annotation) : this.env.fresh_var()
    );
    const ret_type = decl.return_type ? this.resolve_type_expr(decl.return_type) : this.env.fresh_var();

    // Collect row variables introduced by record type annotations (..rest)
    const declared_tp_names = new Set(decl.type_params.map(tp => tp.name));
    for (const [name, tv] of this.type_param_scope) {
      if (!saved_tp_scope.has(name) && !declared_tp_names.has(name) && tv.kind === "var") {
        type_vars.push(tv.id);
      }
    }

    const fn_type: FnType = {
      kind: "fn",
      params: param_types,
      return_type: ret_type,
      effects: EMPTY_ROW,
    };

    // Task 6c: Store fn_bounds for generic functions with trait constraints
    const fn_bounds_list: { type_param: string; trait_name: string }[] = [];
    for (const tp of decl.type_params) {
      for (const b of tp.bounds) {
        if (!this.env.traits.has(b.trait_name)) {
          this.type_error(E.E0501, `Unknown trait: ${b.trait_name}`, tp.span, { kind: "trait_error", detail: `unknown trait '${b.trait_name}'` });
        }
        fn_bounds_list.push({ type_param: tp.name, trait_name: b.trait_name });
      }
    }
    if (fn_bounds_list.length > 0) {
      this.env.fn_bounds.set(decl.name, fn_bounds_list);
    }

    this.type_param_scope = saved_tp_scope;

    if (type_vars.length > 0) {
      this.env.bind(decl.name, { type: fn_type, type_vars });
    } else {
      this.env.bind_mono(decl.name, fn_type);
    }
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
      variants: def.variants.map(v => ({ name: v.name, fields: v.fields })),
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

  private check_impl_decl(decl: ImplDecl): HImplDecl {
    const methods: HFnDecl[] = [];
    for (const method of decl.methods) {
      const hfn = this.check_fn_decl(method);
      methods.push(hfn);
    }
    return {
      kind: "impl_decl",
      target_type: decl.target_type,
      type_params: decl.type_params,
      trait_name: decl.trait_name,
      methods,
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
      const params = m.type.params.map((t, i) => ({
        name: ast_method?.params[i]?.name ?? `p${i}`,
        type: t,
      }));
      let body: HBlock | undefined;
      if (m.has_default && ast_method && ast_method.body.stmts.length + (ast_method.body.tail ? 1 : 0) > 0) {
        const saved_subst = this.subst;
        this.subst = empty_subst();
        this.env.push_scope();
        this.fn_bounds_stack.push(this.current_fn_bounds);
        this.current_fn_bounds = [];
        if (self_var.kind === "var") {
          this.current_fn_bounds.push({
            type_param_var_id: self_var.id,
            trait_name: decl.name,
            type_param_name: "self",
          });
        }
        for (const p of params) {
          this.env.bind_mono(p.name, p.type);
        }
        const body_result = this.infer_block(ast_method.body);
        this.subst = body_result.subst;
        this.env.pop_scope();
        body = body_result.hexpr as HBlock;
        this.current_fn_bounds = this.fn_bounds_stack.pop()!;
        for (const [k, v] of this.subst) saved_subst.set(k, v);
        this.subst = saved_subst;
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

  private check_fn_decl(decl: FnDecl): HFnDecl {
    const saved_subst = this.subst;
    this.subst = empty_subst();
    this.env.push_scope();

    // Bind type parameters as fresh type variables
    const saved_tp_scope = new Map(this.type_param_scope);
    for (const tp of decl.type_params) {
      const tv = this.env.fresh_var(tp.name);
      this.type_var_names.set(tv.id, tp.name);
      this.type_param_scope.set(tp.name, tv);
      this.env.bind_mono(tp.name, tv);
    }

    // Build current_fn_bounds for trait method dispatch on type params
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

    // Bind parameters
    const hparams: HParam[] = [];
    for (const p of decl.params) {
      const ptype = p.type_annotation ? this.resolve_type_expr(p.type_annotation) : this.env.fresh_var();
      this.env.bind_mono(p.name, ptype);
      hparams.push({ name: p.name, type: ptype });
    }

    // Set expected return type for return-statement checking
    const saved_fn_return = this.current_fn_return_type;
    const expected_ret = decl.return_type ? this.resolve_type_expr(decl.return_type) : this.env.fresh_var();
    this.current_fn_return_type = expected_ret;

    // Infer body
    const body_result = this.infer_block(decl.body);
    this.subst = body_result.subst;

    // Determine return type
    this.subst = this.unify_at(body_result.hexpr.type, expected_ret, this.subst, decl.span);
    const ret_type = apply(this.subst, expected_ret);

    this.current_fn_return_type = saved_fn_return;
    this.env.pop_scope();

    // Apply final substitution to params and label remaining type vars with param names
    const tp_id_to_name = new Map<number, string>();
    for (const tp of decl.type_params) {
      const tv = this.type_param_scope.get(tp.name);
      if (tv && tv.kind === "var") {
        const resolved = apply(this.subst, tv);
        if (resolved.kind === "var") tp_id_to_name.set(resolved.id, tp.name);
      }
    }
    const final_params = hparams.map(p => {
      const t = apply(this.subst, p.type);
      if (t.kind === "var" && !t.name && tp_id_to_name.has(t.id)) {
        return { name: p.name, type: { ...t, name: tp_id_to_name.get(t.id) } };
      }
      return { name: p.name, type: t };
    });

    const effects = apply_to_effect_row(this.subst, body_result.effects);

    this.type_param_scope = saved_tp_scope;
    this.current_fn_bounds = this.fn_bounds_stack.pop()!;
    for (const [k, v] of this.subst) saved_subst.set(k, v);
    this.subst = saved_subst;

    const trait_bounds: { type_param: string; trait_name: string }[] = [];
    for (const tp of decl.type_params) {
      for (const bound of tp.bounds) {
        trait_bounds.push({ type_param: tp.name, trait_name: bound.trait_name });
      }
    }

    const final_ret = (ret_type.kind === "var" && !ret_type.name && tp_id_to_name.has(ret_type.id))
      ? { ...ret_type, name: tp_id_to_name.get(ret_type.id) }
      : ret_type;

    return {
      kind: "fn_decl",
      name: decl.name,
      type_params: decl.type_params,
      params: final_params,
      return_type: final_ret,
      effects,
      body: body_result.hexpr as HBlock,
      is_pub: decl.is_pub,
      trait_bounds,
      span: decl.span,
    };
  }

  private check_test_decl(decl: TestDecl): HTestDecl {
    const saved_subst = this.subst;
    this.subst = empty_subst();
    this.env.push_scope();
    const body_result = this.infer_block(decl.body);
    this.subst = body_result.subst;
    this.env.pop_scope();
    for (const [k, v] of this.subst) saved_subst.set(k, v);
    this.subst = saved_subst;
    return {
      kind: "test_decl",
      description: decl.description,
      body: body_result.hexpr as HBlock,
      span: decl.span,
    };
  }

  // ============================================================
  // Infer Block
  // ============================================================

  private infer_block(block: BlockExpr, initial_subst?: Substitution): InferResult {
    let subst = initial_subst ?? this.subst;
    let effects: EffectRow = EMPTY_ROW;
    const hstmts: HStmt[] = [];

    for (const stmt of block.stmts) {
      const sr = this.infer_stmt(stmt, subst);
      subst = sr.subst;
      [effects, subst] = this.merge_effects(effects, sr.effects, subst);
      hstmts.push(sr.hstmt);
    }

    let tail_hexpr: HExpr | undefined;
    let block_type: Type = UNIT;

    if (block.tail) {
      const tr = this.infer_expr(block.tail, subst);
      subst = tr.subst;
      [effects, subst] = this.merge_effects(effects, tr.effects, subst);
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

  private infer_stmt(stmt: Stmt, subst: Substitution): { hstmt: HStmt; subst: Substitution; effects: EffectRow } {
    switch (stmt.kind) {
      case "let_stmt": {
        const init_r = this.infer_expr(stmt.init, subst);
        let s = init_r.subst;
        let var_type = init_r.hexpr.type;
        if (stmt.type_annotation) {
          const annotated = this.resolve_type_expr(stmt.type_annotation);
          s = this.unify_at(var_type, annotated, s, stmt.span);
          var_type = apply(s, annotated);
        }
        const resolved = apply(s, var_type);
        const scheme = this.generalize(resolved, s);
        this.env.bind(stmt.name, scheme);
        return {
          hstmt: { kind: "let_stmt", name: stmt.name, type: resolved, init: init_r.hexpr, span: stmt.span },
          subst: s,
          effects: init_r.effects,
        };
      }
      case "var_stmt": {
        const init_r = this.infer_expr(stmt.init, subst);
        let s = init_r.subst;
        let var_type = init_r.hexpr.type;
        if (stmt.type_annotation) {
          const annotated = this.resolve_type_expr(stmt.type_annotation);
          s = this.unify_at(var_type, annotated, s, stmt.span);
          var_type = apply(s, annotated);
        }
        this.env.bind_mono(stmt.name, apply(s, var_type));
        return {
          hstmt: { kind: "var_stmt", name: stmt.name, type: apply(s, var_type), init: init_r.hexpr, span: stmt.span },
          subst: s,
          effects: init_r.effects,
        };
      }
      case "assign_stmt": {
        const target_r = this.infer_expr(stmt.target, subst);
        const value_r = this.infer_expr(stmt.value, target_r.subst);
        let s = this.unify_at(target_r.hexpr.type, value_r.hexpr.type, value_r.subst, stmt.span);
        let effects: EffectRow;
        [effects, s] = this.merge_effects(target_r.effects, value_r.effects, s);
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
            s = this.unify_at(r.hexpr.type, this.current_fn_return_type, s, stmt.span);
          }
          return {
            hstmt: { kind: "return_stmt", value: r.hexpr, span: stmt.span },
            subst: s,
            effects: r.effects,
          };
        }
        if (this.current_fn_return_type) {
          subst = this.unify_at(UNIT, this.current_fn_return_type, subst, stmt.span);
        }
        return {
          hstmt: { kind: "return_stmt", span: stmt.span },
          subst,
          effects: EMPTY_ROW,
        };
      }
    }
  }

  // ============================================================
  // Infer Expressions
  // ============================================================

  private infer_expr(expr: Expr, subst: Substitution): InferResult {
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
        return this.infer_ident(expr.name, expr.span, subst);
      case "bin_op":
        return this.infer_bin_op(expr.op, expr.left, expr.right, expr.span, subst);
      case "unary_op":
        return this.infer_unary_op(expr.op, expr.operand, expr.span, subst);
      case "call":
        return this.infer_call(expr.callee, expr.args, expr.span, subst);
      case "method_call":
        return this.infer_method_call(expr.receiver, expr.method, expr.args, expr.span, subst);
      case "field_access":
        return this.infer_field_access(expr.receiver, expr.field, expr.span, subst);
      case "struct_lit":
        return this.infer_struct_lit(expr.name, expr.fields, expr.span, subst);
      case "match_expr":
        return this.infer_match(expr.scrutinee, expr.arms, expr.span, subst);
      case "block":
        return this.infer_block(expr);
      case "if_expr":
        return this.infer_if(expr.condition, expr.then_branch, expr.else_branch, expr.span, subst);
      case "string_interp":
        return this.infer_string_interp(expr.parts, expr.span, subst);
      case "or_expr":
        return this.infer_or(expr.expr, expr.default_value, expr.span, subst);
      case "catch_expr":
        return this.infer_catch(expr.expr, expr.error_type, expr.error_binding, expr.handler, expr.span, subst);
      case "handle_expr":
        return this.infer_handle(expr.body, expr.handlers, expr.span, subst);
      case "lambda":
        return this.infer_lambda(expr.params, expr.body, expr.span, subst);
      case "option_unwrap":
        return this.infer_option_unwrap(expr.expr, expr.span, subst);
      case "try_block":
        return this.infer_try_block(expr.body, expr.span, subst);
      default:
        return assertNever(expr, "infer_expr");
    }
  }

  // ============================================================
  // Expression-specific inference
  // ============================================================

  private infer_ident(name: string, span: Span, subst: Substitution): InferResult {
    const scheme = this.env.lookup(name);
    if (!scheme) {
      this.type_error(E.E0201, `Undefined variable: ${name}`, span, { kind: "undefined_variable", name });
    }
    const t = this.env.instantiate(scheme);

    let resolved_name: string | undefined;
    const enum_name = this.env.variant_to_enum.get(name);
    if (enum_name) {
      resolved_name = variant_js_name(enum_name, name);
    }

    return {
      hexpr: { kind: "ident", name, resolved_name, type: t, effects: EMPTY_ROW, span },
      subst,
      effects: EMPTY_ROW,
    };
  }

  private infer_bin_op(op: BinOp, left: Expr, right: Expr, span: Span, subst: Substitution): InferResult {
    const lr = this.infer_expr(left, subst);
    const rr = this.infer_expr(right, lr.subst);
    let s = rr.subst;
    let result_type: Type;

    switch (op) {
      case "+": case "-": case "*": case "/": case "%": {
        // Both sides must be same numeric type
        s = this.unify_at(lr.hexpr.type, rr.hexpr.type, s, span);
        const resolved = apply(s, lr.hexpr.type);
        // If it's still a var, default to Int
        if (resolved.kind === "var") {
          s = this.unify_at(resolved, INT, s, span);
          result_type = INT;
        } else if (resolved.kind === "int" || resolved.kind === "float") {
          result_type = resolved;
        } else {
          this.type_error(E.E0303, `Operator ${op} requires numeric types, got ${type_to_string(resolved)}`, span, { kind: "type_mismatch", expected: "Int or Float", actual: type_to_string(resolved) });
        }
        break;
      }
      case "==": case "!=": case "<": case "<=": case ">": case ">=": {
        // Both sides must be same type
        s = this.unify_at(lr.hexpr.type, rr.hexpr.type, s, span);
        result_type = BOOL;
        break;
      }
      case "&&": case "||": {
        s = this.unify_at(lr.hexpr.type, BOOL, s, span);
        s = this.unify_at(rr.hexpr.type, BOOL, s, span);
        result_type = BOOL;
        break;
      }
    }

    let effects: EffectRow;
    [effects, s] = this.merge_effects(lr.effects, rr.effects, s);
    return {
      hexpr: { kind: "bin_op", op, left: lr.hexpr, right: rr.hexpr, type: result_type!, effects, span },
      subst: s,
      effects,
    };
  }

  private infer_unary_op(op: UnaryOp, operand: Expr, span: Span, subst: Substitution): InferResult {
    const r = this.infer_expr(operand, subst);
    let s = r.subst;
    let result_type: Type;

    if (op === "-") {
      // Numeric negation
      const resolved = apply(s, r.hexpr.type);
      if (resolved.kind === "var") {
        s = this.unify_at(resolved, INT, s, span);
        result_type = INT;
      } else if (resolved.kind === "int" || resolved.kind === "float") {
        result_type = resolved;
      } else {
        this.type_error(E.E0303, `Unary - requires numeric type, got ${type_to_string(resolved)}`, span, { kind: "type_mismatch", expected: "Int or Float", actual: type_to_string(resolved) });
      }
    } else {
      // Logical not
      s = this.unify_at(r.hexpr.type, BOOL, s, span);
      result_type = BOOL;
    }

    return {
      hexpr: { kind: "unary_op", op, operand: r.hexpr, type: result_type, effects: r.effects, span },
      subst: s,
      effects: r.effects,
    };
  }

  private recover_type_param_vars(
    bounds_list: { type_param: string; trait_name: string }[],
    scheme: { type: Type; type_vars: number[] } | undefined,
    callee_type: Type,
  ): Map<string, Type> {
    const result = new Map<string, Type>();
    if (!scheme || scheme.type.kind !== "fn" || callee_type.kind !== "fn") return result;

    const unique_type_params: string[] = [];
    const seen = new Set<string>();
    for (const b of bounds_list) {
      if (!seen.has(b.type_param)) {
        unique_type_params.push(b.type_param);
        seen.add(b.type_param);
      }
    }

    const var_to_tp_index = new Map<number, number>();
    for (let i = 0; i < scheme.type_vars.length && i < unique_type_params.length; i++) {
      var_to_tp_index.set(scheme.type_vars[i], i);
    }

    for (let i = 0; i < scheme.type.params.length && i < callee_type.params.length; i++) {
      const orig = scheme.type.params[i];
      if (orig.kind === "var") {
        const tp_idx = var_to_tp_index.get(orig.id);
        if (tp_idx !== undefined) {
          result.set(unique_type_params[tp_idx], callee_type.params[i]);
        }
      }
    }
    return result;
  }

  private infer_call(callee: Expr, args: Expr[], span: Span, subst: Substitution): InferResult {
    const callee_r = this.infer_expr(callee, subst);
    let s = callee_r.subst;
    let effects = callee_r.effects;

    const hargs: HExpr[] = [];
    const arg_types: Type[] = [];
    for (const arg of args) {
      const ar = this.infer_expr(arg, s);
      s = ar.subst;
      [effects, s] = this.merge_effects(effects, ar.effects, s);
      hargs.push(ar.hexpr);
      arg_types.push(ar.hexpr.type);
    }

    const ret_var = this.env.fresh_var();
    const effect_tail = this.env.fresh_var() as TypeVar;
    const expected_fn: FnType = {
      kind: "fn",
      params: arg_types,
      return_type: ret_var,
      effects: { effects: [], tail: effect_tail.id },
    };

    s = this.unify_at(callee_r.hexpr.type, expected_fn, s, span);
    const resolved_callee_type = apply(s, callee_r.hexpr.type);

    // If the callee is a function type, merge its effects
    if (resolved_callee_type.kind === "fn") {
      [effects, s] = this.merge_effects(effects, resolved_callee_type.effects, s);
    }

    const result_type = apply(s, ret_var);

    const resolved_dicts: string[] = [];
    if (callee.kind === "ident") {
      const bounds_list = this.env.fn_bounds.get(callee.name);
      if (bounds_list) {
        const scheme = this.env.lookup(callee.name);
        const type_param_to_fresh = this.recover_type_param_vars(
          bounds_list, scheme, callee_r.hexpr.type
        );

        for (const bound of bounds_list) {
          let found = false;
          const fresh_var = type_param_to_fresh.get(bound.type_param);
          if (fresh_var) {
            const concrete = apply(s, fresh_var);
            if ((concrete.kind === "struct" || concrete.kind === "enum") &&
                this.env.trait_impls.some(
                  impl => impl.target_type_name === concrete.name && impl.trait_name === bound.trait_name
                )) {
              resolved_dicts.push(trait_dict_name(concrete.name, bound.trait_name));
              found = true;
            } else if (concrete.kind === "var") {
              const matching_bound = this.current_fn_bounds.find(
                fb => fb.type_param_var_id === concrete.id && fb.trait_name === bound.trait_name
              );
              if (matching_bound) {
                resolved_dicts.push(trait_bound_param_name(matching_bound.type_param_name, matching_bound.trait_name));
                found = true;
              }
            }
          }
          if (!found) {
            this.type_error(E.E0503, `Type does not satisfy trait bound '${bound.trait_name}' required by '${callee.name}'`, span, { kind: "trait_error", detail: `type does not satisfy '${bound.trait_name}'` });
          }
        }
      }
    }

    // Resolve dict closures for args that are generic fns with trait bounds passed as values
    for (const harg of hargs) {
      if (harg.kind !== "ident") continue;
      const arg_bounds = this.env.fn_bounds.get(harg.name);
      if (!arg_bounds) continue;
      const scheme = this.env.lookup(harg.name);
      const type_param_to_fresh = this.recover_type_param_vars(arg_bounds, scheme, harg.type);
      const dicts: string[] = [];
      for (const bound of arg_bounds) {
        const fresh_var = type_param_to_fresh.get(bound.type_param);
        if (fresh_var) {
          const concrete = apply(s, fresh_var);
          if ((concrete.kind === "struct" || concrete.kind === "enum") &&
              this.env.trait_impls.some(
                impl => impl.target_type_name === concrete.name && impl.trait_name === bound.trait_name
              )) {
            dicts.push(trait_dict_name(concrete.name, bound.trait_name));
          } else if (concrete.kind === "var") {
            const matching_bound = this.current_fn_bounds.find(
              fb => fb.type_param_var_id === concrete.id && fb.trait_name === bound.trait_name
            );
            if (matching_bound) {
              dicts.push(trait_bound_param_name(matching_bound.type_param_name, matching_bound.trait_name));
            }
          }
        }
      }
      if (dicts.length > 0) {
        (harg as HIdent).dict_closure_dicts = dicts;
      }
    }

    return {
      hexpr: { kind: "call", callee: callee_r.hexpr, args: hargs, type_args: [], resolved_dicts, type: result_type, effects, span },
      subst: s,
      effects,
    };
  }

  private infer_method_call(receiver: Expr, method: string, args: Expr[], span: Span, subst: Substitution): InferResult {
    // Check if receiver is an effect module (e.g., io.read, io.write)
    if (receiver.kind === "ident") {
      const effect_def = this.env.effects.get(receiver.name);
      if (effect_def) {
        return this.infer_effect_op(receiver.name, method, args, span, subst);
      }
    }

    // Infer receiver
    const recv_r = this.infer_expr(receiver, subst);
    let s = recv_r.subst;
    let effects = recv_r.effects;

    // Look up method in impl
    const recv_type = apply(s, recv_r.hexpr.type);
    let method_type: Type | undefined;

    if (recv_type.kind === "struct") {
      const impl_methods = this.env.impl_methods.get(recv_type.name);
      if (impl_methods) {
        const scheme = impl_methods.get(method);
        if (scheme) {
          method_type = this.env.instantiate(scheme);
        }
      }
    } else if (recv_type.kind === "enum") {
      const impl_methods = this.env.impl_methods.get(recv_type.name);
      if (impl_methods) {
        const scheme = impl_methods.get(method);
        if (scheme) {
          method_type = this.env.instantiate(scheme);
        }
      }
    }

    // Task 6e: Check trait impls for the receiver type
    if (!method_type && (recv_type.kind === "struct" || recv_type.kind === "enum")) {
      const type_name = recv_type.name;
      for (const impl_entry of this.env.trait_impls) {
        if (impl_entry.target_type_name === type_name) {
          const trait_def = this.env.traits.get(impl_entry.trait_name);
          if (trait_def) {
            const tm = trait_def.methods.find(m => m.name === method);
            if (tm) {
              method_type = this.env.instantiate({ type: tm.type, type_vars: trait_def.type_param_vars });
              break;
            }
          }
        }
      }
    }

    let dict_dispatch: { dict_param: string; method: string } | undefined;
    // Resolve a var id to its terminal var id through the substitution chain.
    const resolve_var_id = (id: number, sub: Substitution): number => {
      const resolved = sub.get(id);
      if (resolved && resolved.kind === "var") return resolve_var_id(resolved.id, sub);
      return id;
    };
    const recv_raw_type = recv_r.hexpr.type;
    const recv_var_id = recv_raw_type.kind === "var" ? resolve_var_id(recv_raw_type.id, s) : null;
    if (!method_type && recv_var_id !== null) {
      for (const fb of this.current_fn_bounds) {
        if (resolve_var_id(fb.type_param_var_id, s) === recv_var_id) {
          const trait_def = this.env.traits.get(fb.trait_name);
          if (trait_def) {
            const tm = trait_def.methods.find(m => m.name === method);
            if (tm) {
              method_type = this.env.instantiate({ type: tm.type, type_vars: trait_def.type_param_vars });
              dict_dispatch = { dict_param: trait_bound_param_name(fb.type_param_name, fb.trait_name), method };
              break;
            }
          }
        }
      }
    }

    // Infer arguments
    const hargs: HExpr[] = [];
    for (const arg of args) {
      const ar = this.infer_expr(arg, s);
      s = ar.subst;
      [effects, s] = this.merge_effects(effects, ar.effects, s);
      hargs.push(ar.hexpr);
    }

    let result_type: Type;
    if (method_type && method_type.kind === "fn") {
      // Unify receiver with self param (first param)
      if (method_type.params.length > 0) {
        s = this.unify_at(recv_r.hexpr.type, method_type.params[0], s, span);
      }
      // Unify call args with remaining params (skip self at index 0)
      for (let i = 0; i < hargs.length && i + 1 < method_type.params.length; i++) {
        s = this.unify_at(hargs[i].type, method_type.params[i + 1], s, span);
      }
      result_type = apply(s, method_type.return_type);
      [effects, s] = this.merge_effects(effects, method_type.effects, s);
    } else {
      // Unknown method — use fresh type var
      result_type = this.env.fresh_var();
    }

    // Lower to HCall with receiver as first arg conceptually (UFCS)
    return {
      hexpr: {
        kind: "call",
        callee: { kind: "field_access", receiver: recv_r.hexpr, field: method, type: method_type ?? this.env.fresh_var(), effects: EMPTY_ROW, span },
        args: hargs,
        type_args: [],
        resolved_dicts: [],
        dict_dispatch,
        type: result_type,
        effects,
        span,
      },
      subst: s,
      effects,
    };
  }

  private infer_effect_op(effect_name: string, op_name: string, args: Expr[], span: Span, subst: Substitution): InferResult {
    const effect_def = this.env.effects.get(effect_name);
    if (!effect_def) {
      this.type_error(E.E0401, `Unknown effect: ${effect_name}`, span, { kind: "effect_unhandled", effect: effect_name });
    }
    const op = effect_def.ops.find(o => o.name === op_name);
    if (!op) {
      this.type_error(E.E0402, `Effect ${effect_name} has no operation ${op_name}`, span, { kind: "other", detail: `no operation '${op_name}' on effect '${effect_name}'` });
    }

    let s = subst;
    let effects: EffectRow = EMPTY_ROW;
    const hargs: HExpr[] = [];

    for (let i = 0; i < args.length; i++) {
      const ar = this.infer_expr(args[i], s);
      s = ar.subst;
      [effects, s] = this.merge_effects(effects, ar.effects, s);
      hargs.push(ar.hexpr);
      if (i < op.params.length) {
        s = this.unify_at(ar.hexpr.type, op.params[i], s, span);
      }
    }

    // Add the effect to the effect row
    let effect: Effect;
    switch (effect_def.built_in_kind) {
      case "io":
        effect = { kind: "io" };
        break;
      case "fail": {
        const error_type = hargs.length > 0 ? apply(s, hargs[0].type) : UNIT;
        effect = { kind: "fail", error_type };
        break;
      }
      case "mut":
        effect = { kind: "mut" };
        break;
      default:
        effect = { kind: "custom", name: effect_name, type_args: [] };
    }
    [effects, s] = this.merge_effects(effects, effect_row(effect), s);

    return {
      hexpr: {
        kind: "effect_op",
        effect_name,
        op_name,
        args: hargs,
        type: op.return_type,
        effects,
        span,
      },
      subst: s,
      effects,
    };
  }

  private infer_field_access(receiver: Expr, field: string, span: Span, subst: Substitution): InferResult {
    const recv_r = this.infer_expr(receiver, subst);
    const s = recv_r.subst;
    const recv_type = apply(s, recv_r.hexpr.type);

    let field_type: Type;
    if (recv_type.kind === "struct") {
      const struct_def = this.env.structs.get(recv_type.name);
      if (struct_def) {
        const f = struct_def.fields.find(f => f.name === field);
        if (f) {
          const instantiation_map = new Map<number, Type>();
          for (let i = 0; i < struct_def.type_param_vars.length; i++) {
            if (i < recv_type.type_params.length) {
              instantiation_map.set(struct_def.type_param_vars[i], recv_type.type_params[i]);
            }
          }
          field_type = substitute_type(f.type, instantiation_map);
        } else {
          this.type_error(E.E0304, `Struct ${recv_type.name} has no field ${field}`, span, { kind: "missing_field", field, type: recv_type.name });
        }
      } else {
        this.type_error(E.E0203, `Unknown struct: ${recv_type.name}`, span, { kind: "other", detail: `unknown struct '${recv_type.name}'` });
      }
    } else if (recv_type.kind === "record") {
      const f = recv_type.fields.find(f => f.name === field);
      if (f) {
        field_type = f.type;
      } else if (recv_type.tail !== undefined) {
        field_type = this.env.fresh_var();
      } else {
        this.type_error(E.E0304, `Record type has no field '${field}'`, span, { kind: "missing_field", field, type: "record" });
      }
    } else if (recv_type.kind === "var") {
      // Unresolved type variable — defer with fresh var
      field_type = this.env.fresh_var();
    } else {
      this.type_error(E.E0304, `Cannot access field '${field}' on type ${type_to_string(recv_type)}`, span, { kind: "missing_field", field, type: type_to_string(recv_type) });
    }

    return {
      hexpr: { kind: "field_access", receiver: recv_r.hexpr, field, type: field_type, effects: recv_r.effects, span },
      subst: s,
      effects: recv_r.effects,
    };
  }

  private infer_struct_lit(name: string, fields: { name: string; value: Expr; span: Span }[], span: Span, subst: Substitution): InferResult {
    const struct_def = this.env.structs.get(name);
    if (!struct_def) {
      this.type_error(E.E0203, `Unknown struct: ${name}`, span, { kind: "other", detail: `unknown struct '${name}'` });
    }

    // Build substitution: registration-time type vars -> fresh vars for this instantiation
    const instantiation_map = new Map<number, Type>();
    const type_param_types: Type[] = [];
    for (let i = 0; i < struct_def.type_params.length; i++) {
      const tv = this.env.fresh_var();
      instantiation_map.set(struct_def.type_param_vars[i], tv);
      type_param_types.push(tv);
    }

    let s = subst;
    let effects: EffectRow = EMPTY_ROW;
    const hfields: HStructFieldInit[] = [];

    for (const field of fields) {
      const fr = this.infer_expr(field.value, s);
      s = fr.subst;
      [effects, s] = this.merge_effects(effects, fr.effects, s);

      const def_field = struct_def.fields.find(f => f.name === field.name);
      if (def_field) {
        const field_type = substitute_type(def_field.type, instantiation_map);
        s = this.unify_at(fr.hexpr.type, field_type, s, span);
      }
      hfields.push({ name: field.name, value: fr.hexpr });
    }

    const struct_type: Type = {
      kind: "struct",
      name,
      type_params: type_param_types,
      fields: struct_def.fields.map(f => ({ name: f.name, type: f.type, is_pub: f.is_pub })),
    };

    return {
      hexpr: { kind: "struct_lit", name, type_args: [], fields: hfields, type: struct_type, effects, span },
      subst: s,
      effects,
    };
  }

  private infer_match(scrutinee: Expr, arms: MatchArm[], span: Span, subst: Substitution): InferResult {
    const scrut_r = this.infer_expr(scrutinee, subst);
    let s = scrut_r.subst;
    let effects = scrut_r.effects;

    const result_type = this.env.fresh_var();
    const harms: HMatchArm[] = [];

    for (const arm of arms) {
      this.env.push_scope();

      // Reclassify binding patterns that match zero-field enum variants
      if (arm.pattern.kind === "binding") {
        const pat_name = arm.pattern.name;
        const variant_enum = this.env.variant_to_enum.get(pat_name);
        if (variant_enum) {
          const enum_def = this.env.enums.get(variant_enum);
          const variant = enum_def?.variants.find(v => v.name === pat_name);
          if (variant && variant.fields.length === 0) {
            arm.pattern = { kind: "constructor", name: pat_name, fields: [], span: arm.pattern.span };
          }
        }
      }

      // Bind pattern variables
      this.bind_pattern(arm.pattern, scrut_r.hexpr.type, s);

      // Infer guard if present
      let guard_hexpr: HExpr | undefined;
      if (arm.guard) {
        const gr = this.infer_expr(arm.guard, s);
        s = gr.subst;
        s = this.unify_at(gr.hexpr.type, BOOL, s, arm.span);
        [effects, s] = this.merge_effects(effects, gr.effects, s);
        guard_hexpr = gr.hexpr;
      }

      // Infer body
      const body_r = this.infer_expr(arm.body, s);
      s = body_r.subst;
      [effects, s] = this.merge_effects(effects, body_r.effects, s);

      // Unify body type with result type
      s = this.unify_at(body_r.hexpr.type, result_type, s, arm.span);

      harms.push({
        pattern: arm.pattern,
        guard: guard_hexpr,
        body: body_r.hexpr,
        span: arm.span,
      });

      this.env.pop_scope();
    }

    // Check exhaustiveness
    const scrut_type_resolved = apply(s, scrut_r.hexpr.type);
    const missing = check_exhaustive(arms, scrut_type_resolved, s);
    if (missing !== null) {
      const type_str = type_to_string(scrut_type_resolved);
      this.type_error(E.E0601, `Non-exhaustive match on type ${type_str}: missing pattern for ${missing}`, span, { kind: "pattern_error", detail: `missing: ${missing}` });
    }

    const final_type = apply(s, result_type);
    return {
      hexpr: { kind: "match_expr", scrutinee: scrut_r.hexpr, arms: harms, type: final_type, effects, span },
      subst: s,
      effects,
    };
  }

  private bind_pattern(pattern: Pattern, expected_type: Type, subst: Substitution): void {
    switch (pattern.kind) {
      case "wildcard":
        break;
      case "binding":
        this.env.bind_mono(pattern.name, apply(subst, expected_type));
        break;
      case "constructor": {
        const enum_name = this.env.variant_to_enum.get(pattern.name);
        if (enum_name) {
          const enum_def = this.env.enums.get(enum_name);
          if (enum_def) {
            const variant = enum_def.variants.find(v => v.name === pattern.name);
            if (variant) {
              const resolved_expected = apply(subst, expected_type);
              // Verify pattern's enum matches scrutinee type
              if (resolved_expected.kind === "enum" && resolved_expected.name !== enum_name) {
                this.type_error("E0301",
                  `variant '${pattern.name}' belongs to enum '${enum_name}', not '${resolved_expected.name}'`,
                  pattern.span, { kind: "type_mismatch", expected: resolved_expected.name, actual: enum_name });
              }
              // Defensive: if scrutinee is a concrete non-enum type, report error
              if (resolved_expected.kind !== "enum" && resolved_expected.kind !== "var") {
                this.type_error("E0301",
                  `cannot destructure type '${type_to_string(resolved_expected)}' with constructor pattern '${pattern.name}'`,
                  pattern.span, { kind: "pattern_error", detail: "constructor pattern on non-enum type" });
              }
              const instantiation_map = new Map<number, Type>();
              if (resolved_expected.kind === "enum") {
                for (let i = 0; i < enum_def.type_param_vars.length; i++) {
                  if (i < resolved_expected.type_params.length) {
                    instantiation_map.set(enum_def.type_param_vars[i], resolved_expected.type_params[i]);
                  }
                }
              }
              for (let i = 0; i < pattern.fields.length && i < variant.fields.length; i++) {
                const field_type = instantiation_map.size > 0
                  ? substitute_type(variant.fields[i], instantiation_map)
                  : variant.fields[i];
                this.bind_pattern(pattern.fields[i], field_type, subst);
              }
            }
          }
        }
        break;
      }
      case "literal":
        break;
    }
  }

  private infer_if(condition: Expr, then_branch: BlockExpr, else_branch: BlockExpr | { kind: "if_expr"; condition: Expr; then_branch: BlockExpr; else_branch?: any; span: Span } | undefined, span: Span, subst: Substitution): InferResult {
    const cond_r = this.infer_expr(condition, subst);
    let s = cond_r.subst;
    s = this.unify_at(cond_r.hexpr.type, BOOL, s, span);
    let effects = cond_r.effects;

    const then_r = this.infer_block(then_branch, s);
    s = then_r.subst;
    [effects, s] = this.merge_effects(effects, then_r.effects, s);

    let else_hexpr: HBlock | undefined;
    let result_type: Type;

    if (else_branch) {
      if (else_branch.kind === "block") {
        const else_r = this.infer_block(else_branch, s);
        s = else_r.subst;
        [effects, s] = this.merge_effects(effects, else_r.effects, s);
        s = this.unify_at(then_r.hexpr.type, else_r.hexpr.type, s, span);
        result_type = apply(s, then_r.hexpr.type);
        else_hexpr = else_r.hexpr as HBlock;
      } else {
        // else if — treat as nested if expression
        const else_if_r = this.infer_if(else_branch.condition, else_branch.then_branch, else_branch.else_branch, else_branch.span, s);
        s = else_if_r.subst;
        [effects, s] = this.merge_effects(effects, else_if_r.effects, s);
        s = this.unify_at(then_r.hexpr.type, else_if_r.hexpr.type, s, span);
        result_type = apply(s, then_r.hexpr.type);
        // Wrap in a block for HIR
        else_hexpr = {
          kind: "block",
          stmts: [],
          tail: else_if_r.hexpr,
          type: else_if_r.hexpr.type,
          effects: else_if_r.effects,
          span: else_branch.span,
        };
      }
    } else {
      // No else branch — result is Unit
      result_type = UNIT;
    }

    return {
      hexpr: {
        kind: "if_expr",
        condition: cond_r.hexpr,
        then_branch: then_r.hexpr as HBlock,
        else_branch: else_hexpr,
        type: result_type,
        effects,
        span,
      },
      subst: s,
      effects,
    };
  }

  private infer_string_interp(parts: (string | Expr)[], span: Span, subst: Substitution): InferResult {
    let s = subst;
    let effects: EffectRow = EMPTY_ROW;
    const hparts: (string | HExpr)[] = [];

    for (const part of parts) {
      if (typeof part === "string") {
        hparts.push(part);
      } else {
        const r = this.infer_expr(part, s);
        s = r.subst;
        [effects, s] = this.merge_effects(effects, r.effects, s);
        hparts.push(r.hexpr);
      }
    }

    return {
      hexpr: { kind: "string_interp", parts: hparts, type: STR, effects, span },
      subst: s,
      effects,
    };
  }

  private infer_or(expr: Expr, default_value: Expr, span: Span, subst: Substitution): InferResult {
    const expr_r = this.infer_expr(expr, subst);
    let s = expr_r.subst;
    const expr_type = apply(s, expr_r.hexpr.type);

    // Option path: expr is Option<T>, default is T
    if (is_option_type(expr_type)) {
      const inner = option_inner(expr_type);
      const default_r = this.infer_expr(default_value, s);
      s = default_r.subst;
      s = this.unify_at(inner, default_r.hexpr.type, s, span);
      const result_type = apply(s, inner);
      let effects: EffectRow;
      [effects, s] = this.merge_effects(expr_r.effects, default_r.effects, s);
      return {
        hexpr: { kind: "option_or", expr: expr_r.hexpr, default_value: default_r.hexpr, type: result_type, effects, span },
        subst: s,
        effects,
      };
    }

    // Fail path: existing behavior
    const default_r = this.infer_expr(default_value, s);
    s = default_r.subst;
    s = this.unify_at(expr_r.hexpr.type, default_r.hexpr.type, s, span);
    let effects: EffectRow;
    [effects, s] = this.merge_effects(expr_r.effects, default_r.effects, s);
    effects = this.remove_fail_effect(effects);
    const result_type = apply(s, expr_r.hexpr.type);
    return {
      hexpr: { kind: "try_catch", body: expr_r.hexpr, handler: default_r.hexpr, type: result_type, effects, span },
      subst: s,
      effects,
    };
  }

  private infer_catch(expr: Expr, error_type_name: string | undefined, error_binding: string, handler: Expr, span: Span, subst: Substitution): InferResult {
    const expr_r = this.infer_expr(expr, subst);
    let s = expr_r.subst;

    this.env.push_scope();
    let error_var_type: Type;
    if (error_type_name) {
      error_var_type = this.resolve_named_type(error_type_name, [], span);
    } else {
      error_var_type = this.env.fresh_var();
    }
    this.env.bind_mono(error_binding, error_var_type);

    const handler_r = this.infer_expr(handler, s);
    s = handler_r.subst;
    this.env.pop_scope();

    s = this.unify_at(expr_r.hexpr.type, handler_r.hexpr.type, s, span);

    let effects: EffectRow;
    [effects, s] = this.merge_effects(expr_r.effects, handler_r.effects, s);
    if (error_type_name) {
      effects = this.remove_specific_fail_effect(effects, error_var_type, s);
    } else {
      effects = this.remove_fail_effect(effects);
    }

    const result_type = apply(s, expr_r.hexpr.type);

    return {
      hexpr: {
        kind: "try_catch",
        body: expr_r.hexpr,
        error_binding,
        error_type: error_type_name,
        handler: handler_r.hexpr,
        type: result_type,
        effects,
        span,
      },
      subst: s,
      effects,
    };
  }

  private infer_handle(body: Expr, handlers: { effect_name: string; op_name: string; params: Param[]; resume_name?: string; body: Expr; span: Span }[], span: Span, subst: Substitution): InferResult {
    const body_r = this.infer_expr(body, subst);
    let s = body_r.subst;
    let effects = body_r.effects;

    const hhandlers: HEffectHandler[] = [];
    const handled_effects = new Set<string>();

    for (const handler of handlers) {
      this.env.push_scope();

      // Look up effect op definition for proper typing
      const effect_def = this.env.effects.get(handler.effect_name);
      const op_def = effect_def?.ops.find(o => o.name === handler.op_name);

      // Bind handler params from effect op definition
      const hparams: HParam[] = [];
      for (let i = 0; i < handler.params.length; i++) {
        const p = handler.params[i];
        const pt = p.type_annotation
          ? this.resolve_type_expr(p.type_annotation)
          : (op_def && i < op_def.params.length ? op_def.params[i] : this.env.fresh_var());
        this.env.bind_mono(p.name, pt);
        hparams.push({ name: p.name, type: pt });
      }

      // Bind resume with typed signature: fn(ReturnType) -> ResultType
      if (handler.resume_name) {
        const resume_param = op_def ? op_def.return_type : this.env.fresh_var();
        const resume_ret = this.env.fresh_var();
        this.env.bind_mono(handler.resume_name, {
          kind: "fn", params: [resume_param], return_type: resume_ret, effects: EMPTY_ROW,
        } as FnType);
      }

      const handler_body_r = this.infer_expr(handler.body, s);
      s = handler_body_r.subst;

      this.env.pop_scope();

      hhandlers.push({
        effect_name: handler.effect_name,
        op_name: handler.op_name,
        params: hparams,
        resume_name: handler.resume_name,
        body: handler_body_r.hexpr,
      });

      handled_effects.add(handler.effect_name);
    }

    // Remove handled effects from effect row
    effects = {
      effects: effects.effects.filter(e => {
        if (e.kind === "io" && handled_effects.has("io")) return false;
        if (e.kind === "custom" && handled_effects.has(e.name)) return false;
        if (e.kind === "fail" && handled_effects.has("fail")) return false;
        if (e.kind === "mut" && handled_effects.has("mut")) return false;
        return true;
      }),
      tail: effects.tail,
    };

    return {
      hexpr: {
        kind: "handle_expr",
        body: body_r.hexpr,
        handlers: hhandlers,
        type: body_r.hexpr.type,
        effects,
        span,
      },
      subst: s,
      effects,
    };
  }

  private infer_lambda(params: Param[], body: Expr, span: Span, subst: Substitution): InferResult {
    this.env.push_scope();

    const hparams: HParam[] = [];
    const param_types: Type[] = [];
    for (const p of params) {
      const pt = p.type_annotation ? this.resolve_type_expr(p.type_annotation) : this.env.fresh_var();
      this.env.bind_mono(p.name, pt);
      hparams.push({ name: p.name, type: pt });
      param_types.push(pt);
    }

    const body_r = this.infer_expr(body, subst);
    const s = body_r.subst;

    this.env.pop_scope();

    const fn_type: FnType = {
      kind: "fn",
      params: param_types.map(t => apply(s, t)),
      return_type: apply(s, body_r.hexpr.type),
      effects: body_r.effects,
    };

    return {
      hexpr: {
        kind: "lambda",
        params: hparams.map(p => ({ name: p.name, type: apply(s, p.type) })),
        return_type: apply(s, body_r.hexpr.type),
        body: body_r.hexpr,
        type: fn_type,
        effects: EMPTY_ROW,
        span,
      },
      subst: s,
      effects: EMPTY_ROW,
    };
  }

  // ============================================================
  // Helpers
  // ============================================================

  private infer_try_block(body: Expr, span: Span, subst: Substitution): InferResult {
    const body_r = this.infer_expr(body, subst);
    const result_type = make_option_type(body_r.hexpr.type);
    const effects = this.remove_fail_effect(body_r.effects);
    return {
      hexpr: { kind: "try_block", body: body_r.hexpr, type: result_type, effects, span },
      subst: body_r.subst,
      effects,
    };
  }

  private infer_option_unwrap(inner_expr: Expr, span: Span, subst: Substitution): InferResult {
    const inner_r = this.infer_expr(inner_expr, subst);
    let s = inner_r.subst;
    const inner_type = this.env.fresh_var();
    s = this.unify_at(inner_r.hexpr.type, make_option_type(inner_type), s, span);
    const unwrapped = apply(s, inner_type);
    const fail_eff: Effect = { kind: "fail", error_type: UNIT };
    let effects: EffectRow;
    [effects, s] = this.merge_effects(inner_r.effects, { effects: [fail_eff] }, s);
    return {
      hexpr: { kind: "option_unwrap", expr: inner_r.hexpr, type: unwrapped, effects, span },
      subst: s,
      effects,
    };
  }

  private remove_fail_effect(row: EffectRow): EffectRow {
    return {
      effects: row.effects.filter(e => e.kind !== "fail"),
      tail: row.tail,
    };
  }

  private remove_specific_fail_effect(row: EffectRow, target: Type, subst: Substitution): EffectRow {
    return {
      effects: row.effects.filter(e =>
        !(e.kind === "fail" && types_equal(apply(subst, e.error_type), target))
      ),
      tail: row.tail,
    };
  }

  /** Resolve a syntactic TypeExpr to a semantic Type */
  resolve_type_expr(texpr: TypeExpr): Type {
    switch (texpr.kind) {
      case "named":
        return this.resolve_named_type(texpr.name, texpr.type_args, texpr.span);
      case "fn_type": {
        const params = texpr.params.map(p => this.resolve_type_expr(p));
        const ret = this.resolve_type_expr(texpr.return_type);
        return { kind: "fn", params, return_type: ret, effects: EMPTY_ROW };
      }
      case "option": {
        const inner = this.resolve_type_expr(texpr.inner);
        return make_option_type(inner);
      }
      case "record_type": {
        const fields = texpr.fields.map(f => ({
          name: f.name,
          type: this.resolve_type_expr(f.type),
        }));
        const tail_var = texpr.rest ? this.env.fresh_var(texpr.rest) : undefined;
        const tail = tail_var?.id;
        if (texpr.rest && tail_var) {
          this.type_param_scope.set(texpr.rest, tail_var);
        }
        return { kind: "record", fields, tail, tail_name: texpr.rest } as Type;
      }
      default:
        return assertNever(texpr, "resolve_type_expr");
    }
  }

  private resolve_named_type(name: string, type_args: TypeExpr[], span: Span): Type {
    switch (name) {
      case "Int": return INT;
      case "Float": return FLOAT;
      case "Str": return STR;
      case "Bool": return BOOL;
      case "Never": return NEVER;
      case "Unit": return UNIT;
      default: {
        // Check if it's a type parameter in scope
        const tp = this.type_param_scope.get(name);
        if (tp) return tp;

        // Option<T> resolves to EnumType "Option"
        if (name === "Option" && type_args.length === 1) {
          return make_option_type(this.resolve_type_expr(type_args[0]));
        }

        // Check if it's a known struct
        if (this.env.structs.has(name)) {
          const def = this.env.structs.get(name)!;
          return {
            kind: "struct",
            name,
            type_params: type_args.map(a => this.resolve_type_expr(a)),
            fields: def.fields.map(f => ({ name: f.name, type: f.type, is_pub: f.is_pub })),
          };
        }
        // Check if it's a known enum
        if (this.env.enums.has(name)) {
          const def = this.env.enums.get(name)!;
          return {
            kind: "enum",
            name,
            type_params: type_args.map(a => this.resolve_type_expr(a)),
            variants: def.variants,
          };
        }
        this.type_error(E.E0204, `Unknown type: ${name}`, span, { kind: "other", detail: `unknown type '${name}'` });
      }
    }
  }
}
