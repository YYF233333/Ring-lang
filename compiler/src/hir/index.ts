// Ring-lang HIR (High-level Intermediate Representation)
// Separate from AST: every expression carries resolved type and effects.

import { Span, Pattern, BinOp, UnaryOp, TypeParam } from "../ast/index.js";
import { Type, EffectRow } from "../types/index.js";

// ============================================================
// HIR Expressions
// ============================================================

export type HExpr =
  | HIntLit
  | HFloatLit
  | HStrLit
  | HBoolLit
  | HIdent
  | HBinOp
  | HUnaryOp
  | HCall
  | HFieldAccess
  | HStructLit
  | HMatchExpr
  | HBlock
  | HIf
  | HStringInterp
  | HTryCatch
  | HHandleExpr
  | HLambda
  | HEffectOp
  | HOptionUnwrap
  | HTryBlock
  | HOptionOr
  | HRangeExpr;

// Base fields every HExpr carries
interface HExprBase {
  type: Type;
  effects: EffectRow;
  span: Span;
}

export interface HIntLit extends HExprBase {
  kind: "int_lit";
  value: number;
}

export interface HFloatLit extends HExprBase {
  kind: "float_lit";
  value: number;
}

export interface HStrLit extends HExprBase {
  kind: "str_lit";
  value: string;
}

export interface HBoolLit extends HExprBase {
  kind: "bool_lit";
  value: boolean;
}

export interface HIdent extends HExprBase {
  kind: "ident";
  name: string;
  resolved_name?: string;
  def_id?: number;
  dict_closure_dicts?: string[];
}

export interface HBinOp extends HExprBase {
  kind: "bin_op";
  op: BinOp;
  left: HExpr;
  right: HExpr;
}

export interface HUnaryOp extends HExprBase {
  kind: "unary_op";
  op: UnaryOp;
  operand: HExpr;
}

export interface HCall extends HExprBase {
  kind: "call";
  callee: HExpr;
  args: HExpr[];
  type_args: Type[];
  resolved_dicts: string[];
  dict_dispatch?: { dict_param: string; method: string };
}

export interface HFieldAccess extends HExprBase {
  kind: "field_access";
  receiver: HExpr;
  field: string;
}

export interface HStructFieldInit {
  name: string;
  value: HExpr;
}

export interface HStructLit extends HExprBase {
  kind: "struct_lit";
  name: string;
  type_args: Type[];
  fields: HStructFieldInit[];
}

export interface HMatchArm {
  pattern: Pattern;
  guard?: HExpr;
  body: HExpr;
  span: Span;
}

export interface HMatchExpr extends HExprBase {
  kind: "match_expr";
  scrutinee: HExpr;
  arms: HMatchArm[];
}

export interface HBlock extends HExprBase {
  kind: "block";
  stmts: HStmt[];
  tail?: HExpr;
}

export interface HIf extends HExprBase {
  kind: "if_expr";
  condition: HExpr;
  then_branch: HBlock;
  else_branch?: HBlock | HIf;
}

export interface HStringInterp extends HExprBase {
  kind: "string_interp";
  parts: (string | HExpr)[];
}

// `or_expr` and `catch_expr` from AST become `try_catch` in HIR
export interface HTryCatch extends HExprBase {
  kind: "try_catch";
  body: HExpr;
  error_binding?: string;
  error_type?: string;
  handler: HExpr;
}

export interface HEffectHandler {
  effect_name: string;
  op_name: string;
  params: HParam[];
  resume_name?: string;
  body: HExpr;
}

export interface HHandleExpr extends HExprBase {
  kind: "handle_expr";
  body: HExpr;
  handlers: HEffectHandler[];
}

export interface HParam {
  name: string;
  type: Type;
  def_id?: number;
}

export interface HLambda extends HExprBase {
  kind: "lambda";
  params: HParam[];
  return_type: Type;
  body: HExpr;
}

// Effect operation invocation (yield point)
export interface HEffectOp extends HExprBase {
  kind: "effect_op";
  effect_name: string;
  op_name: string;
  args: HExpr[];
}

export interface HOptionUnwrap extends HExprBase {
  kind: "option_unwrap";
  expr: HExpr;
}

export interface HTryBlock extends HExprBase {
  kind: "try_block";
  body: HExpr;
}

export interface HOptionOr extends HExprBase {
  kind: "option_or";
  expr: HExpr;
  default_value: HExpr;
}

export interface HRangeExpr extends HExprBase {
  kind: "range";
  start: HExpr;
  end: HExpr;
}

// ============================================================
// HIR Statements
// ============================================================

export type HStmt =
  | HLetStmt
  | HVarStmt
  | HAssignStmt
  | HExprStmt
  | HReturnStmt
  | HWhileStmt
  | HForInStmt
  | HBreakStmt
  | HContinueStmt;

export interface HLetStmt {
  kind: "let_stmt";
  name: string;
  name_span: Span;
  def_id?: number;
  type: Type;
  init: HExpr;
  span: Span;
}

export interface HVarStmt {
  kind: "var_stmt";
  name: string;
  name_span: Span;
  def_id?: number;
  type: Type;
  init: HExpr;
  span: Span;
}

export interface HAssignStmt {
  kind: "assign_stmt";
  target: HExpr;
  value: HExpr;
  span: Span;
}

export interface HExprStmt {
  kind: "expr_stmt";
  expr: HExpr;
  span: Span;
}

export interface HReturnStmt {
  kind: "return_stmt";
  value?: HExpr;
  span: Span;
}

export interface HWhileStmt {
  kind: "while_stmt";
  condition: HExpr;
  body: HBlock;
  span: Span;
}

export interface HForInStmt {
  kind: "for_in_stmt";
  binding: string;
  binding_span: Span;
  def_id?: number;
  iterable: HExpr;
  body: HBlock;
  span: Span;
}

export interface HBreakStmt {
  kind: "break_stmt";
  span: Span;
}

export interface HContinueStmt {
  kind: "continue_stmt";
  span: Span;
}

// ============================================================
// HIR Declarations
// ============================================================

export type HDecl =
  | HFnDecl
  | HStructDecl
  | HEnumDecl
  | HImplDecl
  | HEffectDecl
  | HTestDecl
  | HTraitDecl;

export interface HFnDecl {
  kind: "fn_decl";
  name: string;
  def_id?: number;
  type_params: TypeParam[];
  params: HParam[];
  return_type: Type;
  effects: EffectRow;
  body: HBlock;
  is_pub: boolean;
  trait_bounds: { type_param: string; trait_name: string }[];
  span: Span;
}

export interface HStructField {
  name: string;
  type: Type;
  is_pub: boolean;
}

export interface HStructDecl {
  kind: "struct_decl";
  name: string;
  type_params: TypeParam[];
  fields: HStructField[];
  is_pub: boolean;
  span: Span;
}

export interface HEnumVariant {
  name: string;
  fields: Type[];
}

export interface HEnumDecl {
  kind: "enum_decl";
  name: string;
  type_params: TypeParam[];
  variants: HEnumVariant[];
  is_pub: boolean;
  span: Span;
}

export interface HImplDecl {
  kind: "impl_decl";
  target_type: string;
  type_params: TypeParam[];
  trait_name?: string;
  methods: HFnDecl[];
  span: Span;
}

export interface HEffectOp_ {
  name: string;
  params: HParam[];
  return_type: Type;
}

export interface HEffectDecl {
  kind: "effect_decl";
  name: string;
  type_params: TypeParam[];
  ops: HEffectOp_[];
  is_pub: boolean;
  span: Span;
}

export interface HTestDecl {
  kind: "test_decl";
  description: string;
  body: HBlock;
  span: Span;
}

export interface HTraitMethod {
  name: string;
  params: HParam[];
  return_type: Type;
  has_default: boolean;
  body?: HBlock;
}

export interface HTraitDecl {
  kind: "trait_decl";
  name: string;
  type_params: TypeParam[];
  methods: HTraitMethod[];
  is_pub: boolean;
  span: Span;
}

// ============================================================
// Program
// ============================================================

export interface HProgram {
  decls: HDecl[];
}

// JS codegen naming convention — single source of truth for enum variant identifiers
export function variant_js_name(enum_name: string, variant_name: string): string {
  return `${enum_name}_${variant_name}`;
}

// JS codegen naming convention for trait dictionary objects
export function trait_dict_name(type_name: string, trait_name: string): string {
  return `${type_name}_${trait_name}`;
}

// JS codegen naming convention for effect evidence parameters
export function evidence_param_name(effect_name: string): string {
  return `__ring_ev_${effect_name}`;
}

// JS codegen naming convention for trait bound dictionary parameters
export function trait_bound_param_name(type_param: string, trait_name: string): string {
  return `__ring_${type_param}_${trait_name}`;
}

// JS codegen naming convention for default method self parameter
export function default_method_self_name(type_name: string): string {
  return `__ring_self_${type_name}`;
}

// JS codegen enum discriminator field name
export const ENUM_TAG_FIELD = "_tag";

// Option<T> codegen constants
export const OPTION_SOME_TAG = "some";
export const OPTION_NONE_TAG = "none";
export const OPTION_PAYLOAD_FIELD = "_0";

// Runtime class/function names (shared between runtime.ts and codegen.ts)
export const RUNTIME_EFFECT_ABORT = "__EffectAbort";
export const RUNTIME_MATCH_FAIL = "__match_fail";
