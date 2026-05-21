import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_contains, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_pop, List_shift, List_clear, List_find_index, List_index_of, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_contains, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";

function List_first(self) {
  return List_get(self, 0);
}
function List_last(self) {
  return List_get(self, (List_len(self) - 1));
}
function List_is_empty(self) {
  return (List_len(self) === 0);
}

function _Map_is_empty(self) {
  return (_Map_len(self) === 0);
}

function _Set_is_empty(self) {
  return (_Set_len(self) === 0);
}

class Position {
  constructor(line, column, offset) {
    this.line = line;
    this.column = column;
    this.offset = offset;
  }
}

class Span {
  constructor(file, start, end) {
    this.file = file;
    this.start = start;
    this.end = end;
  }
}

function span_zero() {
  return new Span("<unknown>", new Position(1, 0, 0), new Position(1, 0, 0));
}

class RecordTypeField {
  constructor(name, ty, span) {
    this.name = name;
    this.ty = ty;
    this.span = span;
  }
}

function TypeExpr_Named(name, type_args, span) {
  return { _tag: "Named", name, type_args, span };
}
function TypeExpr_FnType(params, return_type, span) {
  return { _tag: "FnType", params, return_type, span };
}
function TypeExpr_OptionType(inner, span) {
  return { _tag: "OptionType", inner, span };
}
function TypeExpr_RecordType(fields, rest, span) {
  return { _tag: "RecordType", fields, rest, span };
}
function TypeExpr_TupleType(elements, span) {
  return { _tag: "TupleType", elements, span };
}

class EffectExpr {
  constructor(name, type_args, span) {
    this.name = name;
    this.type_args = type_args;
    this.span = span;
  }
}

function LiteralValue_IntVal(_0) {
  return { _tag: "IntVal", _0 };
}
function LiteralValue_FloatVal(_0) {
  return { _tag: "FloatVal", _0 };
}
function LiteralValue_StrVal(_0) {
  return { _tag: "StrVal", _0 };
}
function LiteralValue_BoolVal(_0) {
  return { _tag: "BoolVal", _0 };
}

class NamedPatternField {
  constructor(name, pattern, span) {
    this.name = name;
    this.pattern = pattern;
    this.span = span;
  }
}

function Pattern_Wildcard(span) {
  return { _tag: "Wildcard", span };
}
function Pattern_Binding(name, span) {
  return { _tag: "Binding", name, span };
}
function Pattern_Constructor(name, qualifier, fields, span) {
  return { _tag: "Constructor", name, qualifier, fields, span };
}
function Pattern_NamedConstructor(name, qualifier, fields, rest, span) {
  return { _tag: "NamedConstructor", name, qualifier, fields, rest, span };
}
function Pattern_Literal(value, span) {
  return { _tag: "Literal", value, span };
}
function Pattern_TuplePattern(elements, span) {
  return { _tag: "TuplePattern", elements, span };
}

const BinOp_Add = Object.freeze({ _tag: "Add" });
const BinOp_Sub = Object.freeze({ _tag: "Sub" });
const BinOp_Mul = Object.freeze({ _tag: "Mul" });
const BinOp_Div = Object.freeze({ _tag: "Div" });
const BinOp_Mod = Object.freeze({ _tag: "Mod" });
const BinOp_Eq = Object.freeze({ _tag: "Eq" });
const BinOp_Neq = Object.freeze({ _tag: "Neq" });
const BinOp_Lt = Object.freeze({ _tag: "Lt" });
const BinOp_Lte = Object.freeze({ _tag: "Lte" });
const BinOp_Gt = Object.freeze({ _tag: "Gt" });
const BinOp_Gte = Object.freeze({ _tag: "Gte" });
const BinOp_And = Object.freeze({ _tag: "And" });
const BinOp_Or = Object.freeze({ _tag: "Or" });

const UnaryOp_Neg = Object.freeze({ _tag: "Neg" });
const UnaryOp_Not = Object.freeze({ _tag: "Not" });

class Param {
  constructor(name, is_mutable, type_annotation, span) {
    this.name = name;
    this.is_mutable = is_mutable;
    this.type_annotation = type_annotation;
    this.span = span;
  }
}

class MatchArm {
  constructor(pattern, guard, body, span) {
    this.pattern = pattern;
    this.guard = guard;
    this.body = body;
    this.span = span;
  }
}

class StructFieldInit {
  constructor(name, value, span) {
    this.name = name;
    this.value = value;
    this.span = span;
  }
}

class EffectHandler {
  constructor(effect_name, op_name, params, resume_name, body, span) {
    this.effect_name = effect_name;
    this.op_name = op_name;
    this.params = params;
    this.resume_name = resume_name;
    this.body = body;
    this.span = span;
  }
}

function StringInterpPart_LitPart(_0) {
  return { _tag: "LitPart", _0 };
}
function StringInterpPart_ExprPart(_0) {
  return { _tag: "ExprPart", _0 };
}

function Expr_IntLit(value, span) {
  return { _tag: "IntLit", value, span };
}
function Expr_FloatLit(value, span) {
  return { _tag: "FloatLit", value, span };
}
function Expr_StrLit(value, span) {
  return { _tag: "StrLit", value, span };
}
function Expr_BoolLit(value, span) {
  return { _tag: "BoolLit", value, span };
}
function Expr_Ident(name, qualifier, span) {
  return { _tag: "Ident", name, qualifier, span };
}
function Expr_BinOp(op, left, right, span) {
  return { _tag: "BinOp", op, left, right, span };
}
function Expr_UnaryOp(op, operand, span) {
  return { _tag: "UnaryOp", op, operand, span };
}
function Expr_Call(callee, args, type_args, span) {
  return { _tag: "Call", callee, args, type_args, span };
}
function Expr_MethodCall(receiver, method, args, type_args, span) {
  return { _tag: "MethodCall", receiver, method, args, type_args, span };
}
function Expr_FieldAccess(receiver, field, span) {
  return { _tag: "FieldAccess", receiver, field, span };
}
function Expr_StructLit(name, qualifier, type_args, fields, spread, span) {
  return { _tag: "StructLit", name, qualifier, type_args, fields, spread, span };
}
function Expr_MatchExpr(scrutinee, arms, span) {
  return { _tag: "MatchExpr", scrutinee, arms, span };
}
function Expr_Block(stmts, tail, span) {
  return { _tag: "Block", stmts, tail, span };
}
function Expr_IfExpr(condition, then_branch, else_branch, span) {
  return { _tag: "IfExpr", condition, then_branch, else_branch, span };
}
function Expr_StringInterp(parts, span) {
  return { _tag: "StringInterp", parts, span };
}
function Expr_CatchExpr(expr, arms, span) {
  return { _tag: "CatchExpr", expr, arms, span };
}
function Expr_HandleExpr(body, handlers, span) {
  return { _tag: "HandleExpr", body, handlers, span };
}
function Expr_Lambda(params, return_type, body, span) {
  return { _tag: "Lambda", params, return_type, body, span };
}
function Expr_Range(start, end, inclusive, span) {
  return { _tag: "Range", start, end, inclusive, span };
}
function Expr_ListLit(elements, span) {
  return { _tag: "ListLit", elements, span };
}
function Expr_TupleLit(elements, span) {
  return { _tag: "TupleLit", elements, span };
}

class DestructureBinding {
  constructor(names, spans) {
    this.names = names;
    this.spans = spans;
  }
}

function Stmt_Let(name, name_span, type_annotation, init, span) {
  return { _tag: "Let", name, name_span, type_annotation, init, span };
}
function Stmt_Var(name, name_span, type_annotation, init, span) {
  return { _tag: "Var", name, name_span, type_annotation, init, span };
}
function Stmt_Assign(target, value, span) {
  return { _tag: "Assign", target, value, span };
}
function Stmt_ExprStmt(expr, has_semi, span) {
  return { _tag: "ExprStmt", expr, has_semi, span };
}
function Stmt_Return(value, span) {
  return { _tag: "Return", value, span };
}
function Stmt_While(condition, body, span) {
  return { _tag: "While", condition, body, span };
}
function Stmt_ForIn(binding, binding_span, destructure, iterable, body, span) {
  return { _tag: "ForIn", binding, binding_span, destructure, iterable, body, span };
}
function Stmt_Break(span) {
  return { _tag: "Break", span };
}
function Stmt_Continue(span) {
  return { _tag: "Continue", span };
}
function Stmt_LetDestructure(pattern, init, span) {
  return { _tag: "LetDestructure", pattern, init, span };
}
function Stmt_IfLet(pattern, expr, then_block, else_block, span) {
  return { _tag: "IfLet", pattern, expr, then_block, else_block, span };
}

class UsePath {
  constructor(segments, span) {
    this.segments = segments;
    this.span = span;
  }
}

class NamedImport {
  constructor(name, alias, span) {
    this.name = name;
    this.alias = alias;
    this.span = span;
  }
}

function UseImport_NamedItems(names) {
  return { _tag: "NamedItems", names };
}
const UseImport_Module = Object.freeze({ _tag: "Module" });

class UseDecl {
  constructor(path, imports, alias, is_pub, span) {
    this.path = path;
    this.imports = imports;
    this.alias = alias;
    this.is_pub = is_pub;
    this.span = span;
  }
}

class TypeBound {
  constructor(trait_name, type_args, span) {
    this.trait_name = trait_name;
    this.type_args = type_args;
    this.span = span;
  }
}

class TypeParam {
  constructor(name, bounds, span) {
    this.name = name;
    this.bounds = bounds;
    this.span = span;
  }
}

class StructFieldDecl {
  constructor(name, type_annotation, is_pub, span) {
    this.name = name;
    this.type_annotation = type_annotation;
    this.is_pub = is_pub;
    this.span = span;
  }
}

class NamedEnumField {
  constructor(name, type_expr, span) {
    this.name = name;
    this.type_expr = type_expr;
    this.span = span;
  }
}

class EnumVariantDecl {
  constructor(name, fields, named_fields, span) {
    this.name = name;
    this.fields = fields;
    this.named_fields = named_fields;
    this.span = span;
  }
}

class EffectOpDecl {
  constructor(name, params, return_type, span) {
    this.name = name;
    this.params = params;
    this.return_type = return_type;
    this.span = span;
  }
}

function Decl_Fn(name, type_params, params, return_type, declared_effects, body, is_pub, is_abstract, span) {
  return { _tag: "Fn", name, type_params, params, return_type, declared_effects, body, is_pub, is_abstract, span };
}
function Decl_Struct(name, type_params, fields, is_pub, span) {
  return { _tag: "Struct", name, type_params, fields, is_pub, span };
}
function Decl_Enum(name, type_params, variants, is_pub, span) {
  return { _tag: "Enum", name, type_params, variants, is_pub, span };
}
function Decl_Impl(target_type, type_params, trait_name, methods, span) {
  return { _tag: "Impl", target_type, type_params, trait_name, methods, span };
}
function Decl_Effect(name, type_params, ops, is_pub, span) {
  return { _tag: "Effect", name, type_params, ops, is_pub, span };
}
function Decl_Test(description, body, span) {
  return { _tag: "Test", description, body, span };
}
function Decl_Trait(name, type_params, supertraits, methods, is_pub, span) {
  return { _tag: "Trait", name, type_params, supertraits, methods, is_pub, span };
}
function Decl_ExternFn(name, type_params, params, return_type, declared_effects, is_pub, span) {
  return { _tag: "ExternFn", name, type_params, params, return_type, declared_effects, is_pub, span };
}
function Decl_ExternType(name, type_params, is_pub, span) {
  return { _tag: "ExternType", name, type_params, is_pub, span };
}
function Decl_TypeAlias(name, type_params, type_expr, is_pub, span) {
  return { _tag: "TypeAlias", name, type_params, type_expr, is_pub, span };
}
function Decl_Const(name, type_annotation, init, is_pub, span) {
  return { _tag: "Const", name, type_annotation, init, is_pub, span };
}

class Program {
  constructor(uses, decls, span) {
    this.uses = uses;
    this.decls = decls;
    this.span = span;
  }
}

function __Position_Eq_eq(self, other) {
  return (self.line === other.line) && (self.column === other.column) && (self.offset === other.offset);
}
const __Position_Eq = { eq: __Position_Eq_eq, ne: function(self, other) { return !__Position_Eq_eq(self, other); } };

function __Span_Eq_eq(self, other) {
  return (self.file === other.file) && __Position_Eq.eq(self.start, other.start) && __Position_Eq.eq(self.end, other.end);
}
const __Span_Eq = { eq: __Span_Eq_eq, ne: function(self, other) { return !__Span_Eq_eq(self, other); } };

function __NamedImport_Eq_eq(self, other) {
  return (self.name === other.name) && __Option_Eq.eq(self.alias, other.alias, __Str_Eq) && __Span_Eq.eq(self.span, other.span);
}
const __NamedImport_Eq = { eq: __NamedImport_Eq_eq, ne: function(self, other) { return !__NamedImport_Eq_eq(self, other); } };

function __LiteralValue_Eq_eq(self, other) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "IntVal": return (self._0 === other._0);
    case "FloatVal": return (self._0 === other._0);
    case "StrVal": return (self._0 === other._0);
    case "BoolVal": return (self._0 === other._0);
    default: return true;
  }
}
const __LiteralValue_Eq = { eq: __LiteralValue_Eq_eq, ne: function(self, other) { return !__LiteralValue_Eq_eq(self, other); } };

function __BinOp_Eq_eq(self, other) {
  if (self._tag !== other._tag) return false;
  return true;
}
const __BinOp_Eq = { eq: __BinOp_Eq_eq, ne: function(self, other) { return !__BinOp_Eq_eq(self, other); } };

function __UnaryOp_Eq_eq(self, other) {
  if (self._tag !== other._tag) return false;
  return true;
}
const __UnaryOp_Eq = { eq: __UnaryOp_Eq_eq, ne: function(self, other) { return !__UnaryOp_Eq_eq(self, other); } };

function __Position_Clone_clone(self) {
  return new Position(self.line, self.column, self.offset);
}
const __Position_Clone = { clone: __Position_Clone_clone };

function __Span_Clone_clone(self) {
  return new Span(self.file, __Position_Clone.clone(self.start), __Position_Clone.clone(self.end));
}
const __Span_Clone = { clone: __Span_Clone_clone };

function __DestructureBinding_Clone_clone(self) {
  return new DestructureBinding(__List_Clone.clone(self.names, __Str_Clone), __List_Clone.clone(self.spans, __Span_Clone));
}
const __DestructureBinding_Clone = { clone: __DestructureBinding_Clone_clone };

function __UsePath_Clone_clone(self) {
  return new UsePath(__List_Clone.clone(self.segments, __Str_Clone), __Span_Clone.clone(self.span));
}
const __UsePath_Clone = { clone: __UsePath_Clone_clone };

function __NamedImport_Clone_clone(self) {
  return new NamedImport(self.name, __Option_Clone.clone(self.alias, __Str_Clone), __Span_Clone.clone(self.span));
}
const __NamedImport_Clone = { clone: __NamedImport_Clone_clone };

function __LiteralValue_Clone_clone(self) {
  switch (self._tag) {
    case "IntVal": return LiteralValue_IntVal(self._0);
    case "FloatVal": return LiteralValue_FloatVal(self._0);
    case "StrVal": return LiteralValue_StrVal(self._0);
    case "BoolVal": return LiteralValue_BoolVal(self._0);
    default: return self;
  }
}
const __LiteralValue_Clone = { clone: __LiteralValue_Clone_clone };

function __BinOp_Clone_clone(self) {
  switch (self._tag) {
    case "Add": return BinOp_Add;
    case "Sub": return BinOp_Sub;
    case "Mul": return BinOp_Mul;
    case "Div": return BinOp_Div;
    case "Mod": return BinOp_Mod;
    case "Eq": return BinOp_Eq;
    case "Neq": return BinOp_Neq;
    case "Lt": return BinOp_Lt;
    case "Lte": return BinOp_Lte;
    case "Gt": return BinOp_Gt;
    case "Gte": return BinOp_Gte;
    case "And": return BinOp_And;
    case "Or": return BinOp_Or;
    default: return self;
  }
}
const __BinOp_Clone = { clone: __BinOp_Clone_clone };

function __UnaryOp_Clone_clone(self) {
  switch (self._tag) {
    case "Neg": return UnaryOp_Neg;
    case "Not": return UnaryOp_Not;
    default: return self;
  }
}
const __UnaryOp_Clone = { clone: __UnaryOp_Clone_clone };

function __UseImport_Clone_clone(self) {
  switch (self._tag) {
    case "NamedItems": return UseImport_NamedItems(__List_Clone.clone(self.names, __NamedImport_Clone));
    case "Module": return UseImport_Module;
    default: return self;
  }
}
const __UseImport_Clone = { clone: __UseImport_Clone_clone };

function __UseDecl_Clone_clone(self) {
  return new UseDecl(__UsePath_Clone.clone(self.path), __UseImport_Clone.clone(self.imports), __Option_Clone.clone(self.alias, __Str_Clone), self.is_pub, __Span_Clone.clone(self.span));
}
const __UseDecl_Clone = { clone: __UseDecl_Clone_clone };

function __Position_Ord_cmp(self, other) {
  var c;
  c = (self.line < other.line ? -1 : self.line > other.line ? 1 : 0);
  if (c !== 0) return c;
  c = (self.column < other.column ? -1 : self.column > other.column ? 1 : 0);
  if (c !== 0) return c;
  return (self.offset < other.offset ? -1 : self.offset > other.offset ? 1 : 0);
}
const __Position_Ord = { cmp: __Position_Ord_cmp };

function __Span_Ord_cmp(self, other) {
  var c;
  c = (self.file < other.file ? -1 : self.file > other.file ? 1 : 0);
  if (c !== 0) return c;
  c = __Position_Ord.cmp(self.start, other.start);
  if (c !== 0) return c;
  return __Position_Ord.cmp(self.end, other.end);
}
const __Span_Ord = { cmp: __Span_Ord_cmp };

const __LiteralValue_tag_order = { "IntVal": 0, "FloatVal": 1, "StrVal": 2, "BoolVal": 3 };
function __LiteralValue_Ord_cmp(self, other) {
  var t1 = __LiteralValue_tag_order[self._tag];
  var t2 = __LiteralValue_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  switch (self._tag) {
    case "IntVal": return (self._0 < other._0 ? -1 : self._0 > other._0 ? 1 : 0);
    case "FloatVal": return (self._0 < other._0 ? -1 : self._0 > other._0 ? 1 : 0);
    case "StrVal": return (self._0 < other._0 ? -1 : self._0 > other._0 ? 1 : 0);
    case "BoolVal": return (self._0 < other._0 ? -1 : self._0 > other._0 ? 1 : 0);
    default: return 0;
  }
}
const __LiteralValue_Ord = { cmp: __LiteralValue_Ord_cmp };

const __BinOp_tag_order = { "Add": 0, "Sub": 1, "Mul": 2, "Div": 3, "Mod": 4, "Eq": 5, "Neq": 6, "Lt": 7, "Lte": 8, "Gt": 9, "Gte": 10, "And": 11, "Or": 12 };
function __BinOp_Ord_cmp(self, other) {
  var t1 = __BinOp_tag_order[self._tag];
  var t2 = __BinOp_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  return 0;
}
const __BinOp_Ord = { cmp: __BinOp_Ord_cmp };

const __UnaryOp_tag_order = { "Neg": 0, "Not": 1 };
function __UnaryOp_Ord_cmp(self, other) {
  var t1 = __UnaryOp_tag_order[self._tag];
  var t2 = __UnaryOp_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  return 0;
}
const __UnaryOp_Ord = { cmp: __UnaryOp_Ord_cmp };

function __Position_Debug_debug(self) {
  return "Position { " + "line: " + String(self.line) + ", " + "column: " + String(self.column) + ", " + "offset: " + String(self.offset) + " }";
}
const __Position_Debug = { debug: __Position_Debug_debug };

function __Span_Debug_debug(self) {
  return "Span { " + "file: " + String(self.file) + ", " + "start: " + __Position_Debug.debug(self.start) + ", " + "end: " + __Position_Debug.debug(self.end) + " }";
}
const __Span_Debug = { debug: __Span_Debug_debug };

function __DestructureBinding_Debug_debug(self) {
  return "DestructureBinding { " + "names: " + __List_Debug.debug(self.names, __Str_Debug) + ", " + "spans: " + __List_Debug.debug(self.spans, __Span_Debug) + " }";
}
const __DestructureBinding_Debug = { debug: __DestructureBinding_Debug_debug };

function __UsePath_Debug_debug(self) {
  return "UsePath { " + "segments: " + __List_Debug.debug(self.segments, __Str_Debug) + ", " + "span: " + __Span_Debug.debug(self.span) + " }";
}
const __UsePath_Debug = { debug: __UsePath_Debug_debug };

function __NamedImport_Debug_debug(self) {
  return "NamedImport { " + "name: " + String(self.name) + ", " + "alias: " + __Option_Debug.debug(self.alias, __Str_Debug) + ", " + "span: " + __Span_Debug.debug(self.span) + " }";
}
const __NamedImport_Debug = { debug: __NamedImport_Debug_debug };

function __LiteralValue_Debug_debug(self) {
  switch (self._tag) {
    case "IntVal": return "IntVal(" + String(self._0) + ")";
    case "FloatVal": return "FloatVal(" + String(self._0) + ")";
    case "StrVal": return "StrVal(" + String(self._0) + ")";
    case "BoolVal": return "BoolVal(" + String(self._0) + ")";
    default: return self._tag;
  }
}
const __LiteralValue_Debug = { debug: __LiteralValue_Debug_debug };

function __BinOp_Debug_debug(self) {
  switch (self._tag) {
    case "Add": return "Add";
    case "Sub": return "Sub";
    case "Mul": return "Mul";
    case "Div": return "Div";
    case "Mod": return "Mod";
    case "Eq": return "Eq";
    case "Neq": return "Neq";
    case "Lt": return "Lt";
    case "Lte": return "Lte";
    case "Gt": return "Gt";
    case "Gte": return "Gte";
    case "And": return "And";
    case "Or": return "Or";
    default: return self._tag;
  }
}
const __BinOp_Debug = { debug: __BinOp_Debug_debug };

function __UnaryOp_Debug_debug(self) {
  switch (self._tag) {
    case "Neg": return "Neg";
    case "Not": return "Not";
    default: return self._tag;
  }
}
const __UnaryOp_Debug = { debug: __UnaryOp_Debug_debug };

function __UseImport_Debug_debug(self) {
  switch (self._tag) {
    case "NamedItems": return "NamedItems { " + "names: " + __List_Debug.debug(self.names, __NamedImport_Debug) + " }";
    case "Module": return "Module";
    default: return self._tag;
  }
}
const __UseImport_Debug = { debug: __UseImport_Debug_debug };

function __UseDecl_Debug_debug(self) {
  return "UseDecl { " + "path: " + __UsePath_Debug.debug(self.path) + ", " + "imports: " + __UseImport_Debug.debug(self.imports) + ", " + "alias: " + __Option_Debug.debug(self.alias, __Str_Debug) + ", " + "is_pub: " + String(self.is_pub) + ", " + "span: " + __Span_Debug.debug(self.span) + " }";
}
const __UseDecl_Debug = { debug: __UseDecl_Debug_debug };


export { Position, Span, span_zero, RecordTypeField, TypeExpr_Named, TypeExpr_FnType, TypeExpr_OptionType, TypeExpr_RecordType, TypeExpr_TupleType, EffectExpr, LiteralValue_IntVal, LiteralValue_FloatVal, LiteralValue_StrVal, LiteralValue_BoolVal, NamedPatternField, Pattern_Wildcard, Pattern_Binding, Pattern_Constructor, Pattern_NamedConstructor, Pattern_Literal, Pattern_TuplePattern, BinOp_Add, BinOp_Sub, BinOp_Mul, BinOp_Div, BinOp_Mod, BinOp_Eq, BinOp_Neq, BinOp_Lt, BinOp_Lte, BinOp_Gt, BinOp_Gte, BinOp_And, BinOp_Or, UnaryOp_Neg, UnaryOp_Not, Param, MatchArm, StructFieldInit, EffectHandler, StringInterpPart_LitPart, StringInterpPart_ExprPart, Expr_IntLit, Expr_FloatLit, Expr_StrLit, Expr_BoolLit, Expr_Ident, Expr_BinOp, Expr_UnaryOp, Expr_Call, Expr_MethodCall, Expr_FieldAccess, Expr_StructLit, Expr_MatchExpr, Expr_Block, Expr_IfExpr, Expr_StringInterp, Expr_CatchExpr, Expr_HandleExpr, Expr_Lambda, Expr_Range, Expr_ListLit, Expr_TupleLit, DestructureBinding, Stmt_Let, Stmt_Var, Stmt_Assign, Stmt_ExprStmt, Stmt_Return, Stmt_While, Stmt_ForIn, Stmt_Break, Stmt_Continue, Stmt_LetDestructure, Stmt_IfLet, UsePath, NamedImport, UseImport_NamedItems, UseImport_Module, UseDecl, TypeBound, TypeParam, StructFieldDecl, NamedEnumField, EnumVariantDecl, EffectOpDecl, Decl_Fn, Decl_Struct, Decl_Enum, Decl_Impl, Decl_Effect, Decl_Test, Decl_Trait, Decl_ExternFn, Decl_ExternType, Decl_TypeAlias, Decl_Const, Program, __Position_Eq, __Span_Eq, __NamedImport_Eq, __LiteralValue_Eq, __BinOp_Eq, __UnaryOp_Eq, __Position_Clone, __Span_Clone, __DestructureBinding_Clone, __UsePath_Clone, __NamedImport_Clone, __LiteralValue_Clone, __BinOp_Clone, __UnaryOp_Clone, __UseImport_Clone, __UseDecl_Clone, __Position_Ord, __Span_Ord, __LiteralValue_Ord, __BinOp_Ord, __UnaryOp_Ord, __Position_Debug, __Span_Debug, __DestructureBinding_Debug, __UsePath_Debug, __NamedImport_Debug, __LiteralValue_Debug, __BinOp_Debug, __UnaryOp_Debug, __UseImport_Debug, __UseDecl_Debug };