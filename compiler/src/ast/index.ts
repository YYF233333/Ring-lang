// Ring-lang AST node definitions
// All nodes carry a Span for source positions.

// ============================================================
// Span
// ============================================================

export interface Span {
  file: string;
  start: Position;
  end: Position;
}

export interface Position {
  line: number;   // 1-based
  column: number; // 0-based
  offset: number; // byte offset
}

export function span_zero(): Span {
  return { file: "<unknown>", start: { line: 1, column: 0, offset: 0 }, end: { line: 1, column: 0, offset: 0 } };
}

// ============================================================
// Type Expressions (syntactic — before type inference)
// ============================================================

export type TypeExpr =
  | NamedTypeExpr
  | FnTypeExpr
  | OptionTypeExpr
  | RecordTypeExpr
  | TupleTypeExpr;

export interface NamedTypeExpr {
  kind: "named";
  name: string;
  type_args: TypeExpr[];
  span: Span;
}

export interface FnTypeExpr {
  kind: "fn_type";
  params: TypeExpr[];
  return_type: TypeExpr;
  span: Span;
}

export interface OptionTypeExpr {
  kind: "option";
  inner: TypeExpr;
  span: Span;
}

export interface RecordTypeField {
  name: string;
  type: TypeExpr;
  span: Span;
}

export interface RecordTypeExpr {
  kind: "record_type";
  fields: RecordTypeField[];
  rest?: string;
  span: Span;
}

export interface TupleTypeExpr {
  kind: "tuple_type";
  elements: TypeExpr[];
  span: Span;
}

// ============================================================
// Patterns
// ============================================================

export type Pattern =
  | WildcardPattern
  | BindingPattern
  | ConstructorPattern
  | NamedConstructorPattern
  | LiteralPattern
  | TuplePattern;

export interface WildcardPattern {
  kind: "wildcard";
  span: Span;
}

export interface BindingPattern {
  kind: "binding";
  name: string;
  span: Span;
}

export interface ConstructorPattern {
  kind: "constructor";
  name: string;
  fields: Pattern[];
  span: Span;
}

export interface LiteralPattern {
  kind: "literal";
  value: number | string | boolean;
  span: Span;
}

export interface NamedConstructorPattern {
  kind: "named_constructor";
  name: string;
  fields: { name: string; pattern: Pattern; span: Span }[];
  rest: boolean;
  span: Span;
}

export interface TuplePattern {
  kind: "tuple";
  elements: Pattern[];
  span: Span;
}

// ============================================================
// Match arm
// ============================================================

export interface MatchArm {
  pattern: Pattern;
  guard?: Expr;
  body: Expr;
  span: Span;
}

// ============================================================
// Expressions
// ============================================================

export type Expr =
  | IntLitExpr
  | FloatLitExpr
  | StrLitExpr
  | BoolLitExpr
  | IdentExpr
  | BinOpExpr
  | UnaryOpExpr
  | CallExpr
  | MethodCallExpr
  | FieldAccessExpr
  | StructLitExpr
  | MatchExpr
  | BlockExpr
  | IfExpr
  | StringInterpExpr
  | OrExpr
  | CatchExpr
  | HandleExpr
  | LambdaExpr
  | OptionUnwrapExpr
  | TryBlockExpr
  | RangeExpr
  | ListLitExpr
  | TupleLitExpr;

export interface IntLitExpr {
  kind: "int_lit";
  value: number;
  span: Span;
}

export interface FloatLitExpr {
  kind: "float_lit";
  value: number;
  span: Span;
}

export interface StrLitExpr {
  kind: "str_lit";
  value: string;
  span: Span;
}

export interface BoolLitExpr {
  kind: "bool_lit";
  value: boolean;
  span: Span;
}

export interface IdentExpr {
  kind: "ident";
  name: string;
  span: Span;
}

export type BinOp =
  | "+" | "-" | "*" | "/" | "%"
  | "==" | "!=" | "<" | "<=" | ">" | ">="
  | "&&" | "||";

export interface BinOpExpr {
  kind: "bin_op";
  op: BinOp;
  left: Expr;
  right: Expr;
  span: Span;
}

export type UnaryOp = "-" | "!";

export interface UnaryOpExpr {
  kind: "unary_op";
  op: UnaryOp;
  operand: Expr;
  span: Span;
}

export interface CallExpr {
  kind: "call";
  callee: Expr;
  args: Expr[];
  type_args: TypeExpr[];
  span: Span;
}

export interface MethodCallExpr {
  kind: "method_call";
  receiver: Expr;
  method: string;
  args: Expr[];
  type_args: TypeExpr[];
  span: Span;
}

export interface FieldAccessExpr {
  kind: "field_access";
  receiver: Expr;
  field: string;
  span: Span;
}

export interface StructFieldInit {
  name: string;
  value: Expr;
  span: Span;
}

export interface StructLitExpr {
  kind: "struct_lit";
  name: string;
  type_args: TypeExpr[];
  fields: StructFieldInit[];
  spread?: Expr;
  span: Span;
}

export interface MatchExpr {
  kind: "match_expr";
  scrutinee: Expr;
  arms: MatchArm[];
  span: Span;
}

export interface BlockExpr {
  kind: "block";
  stmts: Stmt[];
  tail?: Expr;
  span: Span;
}

export interface IfExpr {
  kind: "if_expr";
  condition: Expr;
  then_branch: BlockExpr;
  else_branch?: BlockExpr | IfExpr;
  span: Span;
}

export interface StringInterpExpr {
  kind: "string_interp";
  parts: (string | Expr)[];
  span: Span;
}

// `expr or default` — sugar for fail handling
export interface OrExpr {
  kind: "or_expr";
  expr: Expr;
  default_value: Expr;
  span: Span;
}

// `expr catch |e| handler` — sugar for fail handling
export interface CatchExpr {
  kind: "catch_expr";
  expr: Expr;
  error_type?: string;
  error_binding: string;
  handler: Expr;
  span: Span;
}

export interface EffectHandler {
  effect_name: string;
  op_name: string;
  params: Param[];
  resume_name?: string;
  body: Expr;
  span: Span;
}

export interface HandleExpr {
  kind: "handle_expr";
  body: Expr;
  handlers: EffectHandler[];
  span: Span;
}

export interface Param {
  name: string;
  is_mutable?: boolean;
  type_annotation?: TypeExpr;
  span: Span;
}

export interface LambdaExpr {
  kind: "lambda";
  params: Param[];
  return_type?: TypeExpr;
  body: Expr;
  span: Span;
}

export interface OptionUnwrapExpr {
  kind: "option_unwrap";
  expr: Expr;
  span: Span;
}

export interface TryBlockExpr {
  kind: "try_block";
  body: Expr;
  span: Span;
}

export interface RangeExpr {
  kind: "range";
  start: Expr;
  end: Expr;
  inclusive: boolean;
  span: Span;
}

export interface ListLitExpr {
  kind: "list_lit";
  elements: Expr[];
  span: Span;
}

export interface TupleLitExpr {
  kind: "tuple_lit";
  elements: Expr[];
  span: Span;
}

// ============================================================
// Statements
// ============================================================

export type Stmt =
  | LetStmt
  | VarStmt
  | AssignStmt
  | ExprStmt
  | ReturnStmt
  | WhileStmt
  | ForInStmt
  | BreakStmt
  | ContinueStmt
  | LetDestructureStmt
  | IfLetStmt;

export interface LetStmt {
  kind: "let_stmt";
  name: string;
  name_span: Span;
  type_annotation?: TypeExpr;
  init: Expr;
  span: Span;
}

export interface VarStmt {
  kind: "var_stmt";
  name: string;
  name_span: Span;
  type_annotation?: TypeExpr;
  init: Expr;
  span: Span;
}

export interface AssignStmt {
  kind: "assign_stmt";
  target: Expr;
  value: Expr;
  span: Span;
}

export interface ExprStmt {
  kind: "expr_stmt";
  expr: Expr;
  has_semi: boolean;
  span: Span;
}

export interface ReturnStmt {
  kind: "return_stmt";
  value?: Expr;
  span: Span;
}

export interface WhileStmt {
  kind: "while_stmt";
  condition: Expr;
  body: BlockExpr;
  span: Span;
}

export interface ForInStmt {
  kind: "for_in_stmt";
  binding: string;
  binding_span: Span;
  destructure?: { names: string[]; spans: Span[] };
  iterable: Expr;
  body: BlockExpr;
  span: Span;
}

export interface BreakStmt {
  kind: "break_stmt";
  span: Span;
}

export interface ContinueStmt {
  kind: "continue_stmt";
  span: Span;
}

export interface LetDestructureStmt {
  kind: "let_destructure";
  pattern: TuplePattern;
  init: Expr;
  span: Span;
}

export interface IfLetStmt {
  kind: "if_let";
  pattern: Pattern;
  expr: Expr;
  then_block: BlockExpr;
  else_block: BlockExpr | null;
  span: Span;
}

// ============================================================
// Use declarations (imports)
// ============================================================

export interface UsePath {
  segments: string[];
  span: Span;
}

export type UseImport =
  | { kind: "named"; names: { name: string; alias?: string; span: Span }[] }
  | { kind: "module" };

export interface UseDecl {
  kind: "use_decl";
  path: UsePath;
  imports: UseImport;
  alias?: string;
  is_pub: boolean;
  span: Span;
}

// ============================================================
// Declarations
// ============================================================

export interface TraitDecl {
  kind: "trait_decl";
  name: string;
  type_params: TypeParam[];
  supertraits: TypeBound[];
  methods: FnDecl[];
  is_pub: boolean;
  span: Span;
}

export type Decl =
  | FnDecl
  | StructDecl
  | EnumDecl
  | ImplDecl
  | EffectDecl
  | TestDecl
  | TraitDecl
  | ExternFnDecl
  | ExternTypeDecl
  | TypeAliasDecl;

export interface TypeBound {
  trait_name: string;
  type_args: TypeExpr[];
  span: Span;
}

export interface TypeParam {
  name: string;
  bounds: TypeBound[];
  span: Span;
}

export interface FnDecl {
  kind: "fn_decl";
  name: string;
  type_params: TypeParam[];
  params: Param[];
  return_type?: TypeExpr;
  body: BlockExpr;
  is_pub: boolean;
  is_abstract?: boolean;
  span: Span;
}

export interface StructField {
  name: string;
  type_annotation: TypeExpr;
  is_pub: boolean;
  is_optional?: boolean;
  span: Span;
}

export interface StructDecl {
  kind: "struct_decl";
  name: string;
  type_params: TypeParam[];
  fields: StructField[];
  is_pub: boolean;
  span: Span;
}

export interface NamedEnumField {
  name: string;
  type_expr: TypeExpr;
  is_optional?: boolean;
  span: Span;
}

export interface EnumVariant {
  name: string;
  fields: TypeExpr[];
  named_fields?: NamedEnumField[];
  span: Span;
}

export interface EnumDecl {
  kind: "enum_decl";
  name: string;
  type_params: TypeParam[];
  variants: EnumVariant[];
  is_pub: boolean;
  span: Span;
}

export interface ImplDecl {
  kind: "impl_decl";
  target_type: string;
  type_params: TypeParam[];
  trait_name?: string;
  methods: (FnDecl | ExternFnDecl)[];
  span: Span;
}

export interface EffectOp {
  name: string;
  params: Param[];
  return_type: TypeExpr;
  span: Span;
}

export interface EffectDecl {
  kind: "effect_decl";
  name: string;
  type_params: TypeParam[];
  ops: EffectOp[];
  is_pub: boolean;
  span: Span;
}

export interface TestDecl {
  kind: "test_decl";
  description: string;
  body: BlockExpr;
  span: Span;
}

export interface ExternFnDecl {
  kind: "extern_fn_decl";
  name: string;
  type_params: TypeParam[];
  params: Param[];
  return_type?: TypeExpr;
  is_pub: boolean;
  span: Span;
}

export interface ExternTypeDecl {
  kind: "extern_type_decl";
  name: string;
  type_params: TypeParam[];
  is_pub: boolean;
  span: Span;
}

export interface TypeAliasDecl {
  kind: "type_alias_decl";
  name: string;
  type_params: TypeParam[];
  type_expr: TypeExpr;
  is_pub: boolean;
  span: Span;
}

// ============================================================
// Program (top-level)
// ============================================================

export interface Program {
  uses: UseDecl[];
  decls: Decl[];
  span: Span;
}
