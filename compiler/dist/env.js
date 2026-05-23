import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { BUILTIN_INT as types$BUILTIN_INT, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, INT as types$INT, FLOAT as types$FLOAT, STR as types$STR, BOOL as types$BOOL, UNIT as types$UNIT, NEVER as types$NEVER, ANY as types$ANY, EMPTY_ROW as types$EMPTY_ROW, effect_kind_name as types$effect_kind_name, effects_match_kind as types$effects_match_kind, type_to_builtin_name as types$type_to_builtin_name, make_option_type as types$make_option_type, is_option_type as types$is_option_type, option_inner as types$option_inner, make_list_type as types$make_list_type, is_list_type as types$is_list_type, list_element as types$list_element, make_map_type as types$make_map_type, is_map_type as types$is_map_type, make_set_type as types$make_set_type, is_set_type as types$is_set_type, effect_row as types$effect_row, open_effect_row as types$open_effect_row, row_contains as types$row_contains, row_merge as types$row_merge, effects_equal as types$effects_equal, types_equal as types$types_equal, type_to_string as types$type_to_string, effect_to_string as types$effect_to_string, effect_row_to_string as types$effect_row_to_string, StructField as types$StructField, EnumVariant as types$EnumVariant, RecordField as types$RecordField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, RowMergeResult as types$RowMergeResult } from "./types.js";
import { new_union_find as union_find$new_union_find, uf_find as union_find$uf_find, uf_bind as union_find$uf_bind, uf_lookup as union_find$uf_lookup, uf_union as union_find$uf_union, uf_insert as union_find$uf_insert, UnionFind as union_find$UnionFind } from "./union_find.js";
import { span_zero as ast$span_zero, Position as ast$Position, Span as ast$Span, RecordTypeField as ast$RecordTypeField, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, EffectExpr as ast$EffectExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, NamedPatternField as ast$NamedPatternField, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, Param as ast$Param, MatchArm as ast$MatchArm, StructFieldInit as ast$StructFieldInit, EffectHandler as ast$EffectHandler, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, DestructureBinding as ast$DestructureBinding, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, UsePath as ast$UsePath, NamedImport as ast$NamedImport, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UseDecl as ast$UseDecl, TypeBound as ast$TypeBound, TypeParam as ast$TypeParam, StructFieldDecl as ast$StructFieldDecl, NamedEnumField as ast$NamedEnumField, EnumVariantDecl as ast$EnumVariantDecl, EffectOpDecl as ast$EffectOpDecl, SigMember as ast$SigMember, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Program as ast$Program, __Position_Eq as ast$__Position_Eq, __Span_Eq as ast$__Span_Eq, __NamedImport_Eq as ast$__NamedImport_Eq, __LiteralValue_Eq as ast$__LiteralValue_Eq, __BinOp_Eq as ast$__BinOp_Eq, __UnaryOp_Eq as ast$__UnaryOp_Eq, __Position_Clone as ast$__Position_Clone, __Span_Clone as ast$__Span_Clone, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __UsePath_Clone as ast$__UsePath_Clone, __NamedImport_Clone as ast$__NamedImport_Clone, __LiteralValue_Clone as ast$__LiteralValue_Clone, __BinOp_Clone as ast$__BinOp_Clone, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UseImport_Clone as ast$__UseImport_Clone, __UseDecl_Clone as ast$__UseDecl_Clone, __Position_Ord as ast$__Position_Ord, __Span_Ord as ast$__Span_Ord, __LiteralValue_Ord as ast$__LiteralValue_Ord, __BinOp_Ord as ast$__BinOp_Ord, __UnaryOp_Ord as ast$__UnaryOp_Ord, __Position_Debug as ast$__Position_Debug, __Span_Debug as ast$__Span_Debug, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __UsePath_Debug as ast$__UsePath_Debug, __NamedImport_Debug as ast$__NamedImport_Debug, __LiteralValue_Debug as ast$__LiteralValue_Debug, __BinOp_Debug as ast$__BinOp_Debug, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseImport_Debug as ast$__UseImport_Debug, __UseDecl_Debug as ast$__UseDecl_Debug } from "./ast.js";

function List_first(self) {
  if (List_is_empty(self)) {
    return Option_none;
  }
  return List_get(self, 0);
}
function List_last(self) {
  if (List_is_empty(self)) {
    return Option_none;
  }
  return List_get(self, (List_len(self) - 1));
}
function List_is_empty(self) {
  return (List_len(self) === 0);
}

function List_contains(self, item, __ring_T_Eq) {
  for (const x of self) {
    if (__ring_T_Eq.eq(x, item)) {
      return true;
    }
  }
  return false;
}
function List_index_of(self, item, __ring_T_Eq) {
  let i = 0;
  while ((i < List_len(self))) {
    __ring_match0: {
      const __ring_m0 = List_get(self, i);
      if (__ring_m0._tag === "some") {
        const v = __ring_m0._0;
        if (__ring_T_Eq.eq(v, item)) {
          return Option_some(i);
        }
        break __ring_match0;
      }
      if (__ring_m0._tag === "none") {
        break __ring_match0;
      }
      __match_fail(__ring_m0);
    }
    i = (i + 1);
  }
  return Option_none;
}

function _Map_is_empty(self) {
  return (_Map_len(self) === 0);
}

function _Set_is_empty(self) {
  return (_Set_len(self) === 0);
}

function _Set_contains(self, item, __ring_T_Eq) {
  const items = _Set_to_list(self);
  for (const x of items) {
    if (__ring_T_Eq.eq(x, item)) {
      return true;
    }
  }
  return false;
}

function Result_Ok(_0) {
  return { _tag: "Ok", _0 };
}
function Result_Err(_0) {
  return { _tag: "Err", _0 };
}

function Result_map(self, f) {
  __ring_match1: {
    const __ring_m1 = self;
    if (__ring_m1._tag === "Ok") {
      const v = __ring_m1._0;
      return Result_Ok(f(v));
      break __ring_match1;
    }
    if (__ring_m1._tag === "Err") {
      const e = __ring_m1._0;
      return Result_Err(e);
      break __ring_match1;
    }
    __match_fail(__ring_m1);
  }
}
function Result_and_then(self, f) {
  __ring_match2: {
    const __ring_m2 = self;
    if (__ring_m2._tag === "Ok") {
      const v = __ring_m2._0;
      return f(v);
      break __ring_match2;
    }
    if (__ring_m2._tag === "Err") {
      const e = __ring_m2._0;
      return Result_Err(e);
      break __ring_match2;
    }
    __match_fail(__ring_m2);
  }
}
function Result_unwrap_or(self, _default) {
  __ring_match3: {
    const __ring_m3 = self;
    if (__ring_m3._tag === "Ok") {
      const v = __ring_m3._0;
      return v;
      break __ring_match3;
    }
    if (__ring_m3._tag === "Err") {
      return _default;
      break __ring_match3;
    }
    __match_fail(__ring_m3);
  }
}
function Result_is_ok(self) {
  __ring_match4: {
    const __ring_m4 = self;
    if (__ring_m4._tag === "Ok") {
      return true;
      break __ring_match4;
    }
    if (__ring_m4._tag === "Err") {
      return false;
      break __ring_match4;
    }
    __match_fail(__ring_m4);
  }
}
function Result_is_err(self) {
  __ring_match5: {
    const __ring_m5 = self;
    if (__ring_m5._tag === "Ok") {
      return false;
      break __ring_match5;
    }
    if (__ring_m5._tag === "Err") {
      return true;
      break __ring_match5;
    }
    __match_fail(__ring_m5);
  }
}

function to_result(f) {
  return (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Result_Ok(f()); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { const e = __ring_err; return Result_Err(e); } else { throw __ring_e; } } throw __ring_e; } })();
}

class SchemeBound {
  constructor(type_var, trait_name) {
    this.type_var = type_var;
    this.trait_name = trait_name;
  }
}

class TypeScheme {
  constructor(ty, type_vars, bounds, def_id) {
    this.ty = ty;
    this.type_vars = type_vars;
    this.bounds = bounds;
    this.def_id = def_id;
  }
}

class StructDef {
  constructor(name, type_params, type_param_vars, fields) {
    this.name = name;
    this.type_params = type_params;
    this.type_param_vars = type_param_vars;
    this.fields = fields;
  }
}

class EnumDef {
  constructor(name, type_params, type_param_vars, variants) {
    this.name = name;
    this.type_params = type_params;
    this.type_param_vars = type_param_vars;
    this.variants = variants;
  }
}

class EffectOpDef {
  constructor(name, params, return_type) {
    this.name = name;
    this.params = params;
    this.return_type = return_type;
  }
}

const BuiltInKind_BkIo = Object.freeze({ _tag: "BkIo" });
const BuiltInKind_BkFail = Object.freeze({ _tag: "BkFail" });
const BuiltInKind_BkMut = Object.freeze({ _tag: "BkMut" });

class EffectDef {
  constructor(name, type_params, type_param_vars, ops, built_in_kind) {
    this.name = name;
    this.type_params = type_params;
    this.type_param_vars = type_param_vars;
    this.ops = ops;
    this.built_in_kind = built_in_kind;
  }
}

class TraitMethodDef {
  constructor(name, ty, has_default) {
    this.name = name;
    this.ty = ty;
    this.has_default = has_default;
  }
}

class TraitDef {
  constructor(name, type_params, type_param_vars, methods, supertraits) {
    this.name = name;
    this.type_params = type_params;
    this.type_param_vars = type_param_vars;
    this.methods = methods;
    this.supertraits = supertraits;
  }
}

class ImplEntry {
  constructor(trait_name, target_type_name, type_params, method_names) {
    this.trait_name = trait_name;
    this.target_type_name = target_type_name;
    this.type_params = type_params;
    this.method_names = method_names;
  }
}

class TypeAliasDef {
  constructor(type_params, type_param_vars, ty) {
    this.type_params = type_params;
    this.type_param_vars = type_param_vars;
    this.ty = ty;
  }
}

class EffectAliasDef {
  constructor(name, type_params, effects, span) {
    this.name = name;
    this.type_params = type_params;
    this.effects = effects;
    this.span = span;
  }
}

class FnBound {
  constructor(type_param, trait_name) {
    this.type_param = type_param;
    this.trait_name = trait_name;
  }
}

class SigDef {
  constructor(name, members, is_pub) {
    this.name = name;
    this.members = members;
    this.is_pub = is_pub;
  }
}

class Scope {
  constructor(variables) {
    this.variables = variables;
  }
}

class TypeRegistry {
  constructor(structs, enums, effects, variant_to_enum, type_aliases, sigs, effect_aliases) {
    this.structs = structs;
    this.enums = enums;
    this.effects = effects;
    this.variant_to_enum = variant_to_enum;
    this.type_aliases = type_aliases;
    this.sigs = sigs;
    this.effect_aliases = effect_aliases;
  }
}

class TraitRegistry {
  constructor(traits, trait_impls, impl_methods, mut_methods) {
    this.traits = traits;
    this.trait_impls = trait_impls;
    this.impl_methods = impl_methods;
    this.mut_methods = mut_methods;
  }
}

class ScopeManager {
  constructor(scopes, fn_bounds, var_bounds, def_spans, mutable_vars, let_defs) {
    this.scopes = scopes;
    this.fn_bounds = fn_bounds;
    this.var_bounds = var_bounds;
    this.def_spans = def_spans;
    this.mutable_vars = mutable_vars;
    this.let_defs = let_defs;
  }
}

class IdGen {
  constructor(next_type_var_id, next_def_id) {
    this.next_type_var_id = next_type_var_id;
    this.next_def_id = next_def_id;
  }
}

class TypeEnv {
  constructor(types, trait_reg, scope, ids) {
    this.types = types;
    this.trait_reg = trait_reg;
    this.scope = scope;
    this.ids = ids;
  }
}

function mono(ty) {
  return new TypeScheme(ty, [], [], Option_none);
}

function new_type_env() {
  const initial_scope = new Scope(map_new());
  return new TypeEnv(new TypeRegistry(map_new(), map_new(), map_new(), map_new(), map_new(), map_new(), map_new()), new TraitRegistry(map_new(), [], map_new(), map_new()), new ScopeManager([initial_scope], map_new(), map_new(), map_new(), set_new(), set_new()), new IdGen(0, 0));
}

function TypeEnv_current_var_id(self) {
  return self.ids.next_type_var_id;
}
function TypeEnv_fresh_var(self) {
  const id = self.ids.next_type_var_id;
  self.ids.next_type_var_id = (id + 1);
  return types$Type_TypeVar(id, Option_none);
}
function TypeEnv_fresh_var_id(self) {
  const id = self.ids.next_type_var_id;
  self.ids.next_type_var_id = (id + 1);
  return id;
}
function TypeEnv_fresh_def_id(self) {
  const id = self.ids.next_def_id;
  self.ids.next_def_id = (id + 1);
  return id;
}
function TypeEnv_push_scope(self) {
  return List_push(self.scope.scopes, new Scope(map_new()));
}
function TypeEnv_pop_scope(self) {
  if ((List_len(self.scope.scopes) <= 1)) {
    panic("Cannot pop global scope");
  }
  return List_pop(self.scope.scopes);
}
function TypeEnv_bind(self, name, scheme) {
  const s = (function() {
  const __ring_m = scheme.def_id;
  if (__ring_m._tag === "some") { return scheme; }
  if (__ring_m._tag === "none") { return new TypeScheme(scheme.ty, scheme.type_vars, scheme.bounds, Option_some(TypeEnv_fresh_def_id(self))); }
  __match_fail(__ring_m);
})();
  const idx = (List_len(self.scope.scopes) - 1);
  __ring_match6: {
    const __ring_m6 = List_get(self.scope.scopes, idx);
    if (__ring_m6._tag === "some") {
      const scope = __ring_m6._0;
      return _Map_insert(scope.variables, name, s);
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      return panic("no current scope");
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}
function TypeEnv_bind_mono(self, name, ty) {
  return TypeEnv_bind(self, name, mono(ty));
}
function TypeEnv_record_def_span(self, def_id, span) {
  return _Map_insert(self.scope.def_spans, def_id, span);
}
function TypeEnv_rebind(self, name, scheme) {
  let i = (List_len(self.scope.scopes) - 1);
  while ((i >= 0)) {
    __ring_match7: {
      const __ring_m7 = List_get(self.scope.scopes, i);
      if (__ring_m7._tag === "some") {
        const scope = __ring_m7._0;
        if (_Map_contains_key(scope.variables, name)) {
          _Map_insert(scope.variables, name, scheme);
          return;
        }
        break __ring_match7;
      }
      if (__ring_m7._tag === "none") {
        break __ring_match7;
      }
      __match_fail(__ring_m7);
    }
    i = (i - 1);
  }
  return panic(`internal: rebind failed — variable '${name}' not found in any scope`);
}
function TypeEnv_lookup(self, name) {
  let i = (List_len(self.scope.scopes) - 1);
  while ((i >= 0)) {
    const found = (function() {
  const __ring_m = List_get(self.scope.scopes, i);
  if (__ring_m._tag === "some") { const scope = __ring_m._0; return _Map_get(scope.variables, name); }
  if (__ring_m._tag === "none") { return Option_none; }
  __match_fail(__ring_m);
})();
    if (Option_is_some(found)) {
      return found;
    }
    i = (i - 1);
  }
  return Option_none;
}
function TypeEnv_instantiate(self, scheme) {
  if ((List_len(scheme.type_vars) === 0)) {
    return scheme.ty;
  }
  let mapping = map_new();
  for (const tv of scheme.type_vars) {
    _Map_insert(mapping, tv, TypeEnv_fresh_var(self));
  }
  for (const bound of scheme.bounds) {
    __ring_match8: {
      const __ring_m8 = _Map_get(mapping, bound.type_var);
      if (__ring_m8._tag === "some") {
        const fresh = __ring_m8._0;
        __ring_match9: {
          const __ring_m9 = fresh;
          if (__ring_m9._tag === "TypeVar") {
            const id = __ring_m9.id;
            let existing = (function() {
  const __ring_m = _Map_get(self.scope.var_bounds, id);
  if (__ring_m._tag === "some") { const s = __ring_m._0; return s; }
  if (__ring_m._tag === "none") { return set_new(); }
  __match_fail(__ring_m);
})();
            _Set_insert(existing, bound.trait_name);
            _Map_insert(self.scope.var_bounds, id, existing);
            break __ring_match9;
          }
          break __ring_match9;
        }
        break __ring_match8;
      }
      if (__ring_m8._tag === "none") {
        break __ring_match8;
      }
      __match_fail(__ring_m8);
    }
  }
  return apply_subst_map(mapping, scheme.ty);
}

function chase_type_var_map(subst, id, depth) {
  if ((depth > 100)) {
    return types$Type_TypeVar(id, Option_none);
  }
  __ring_match10: {
    const __ring_m10 = _Map_get(subst, id);
    if (__ring_m10._tag === "some") {
      const resolved = __ring_m10._0;
      __ring_match11: {
        const __ring_m11 = resolved;
        if (__ring_m11._tag === "TypeVar") {
          const next_id = __ring_m11.id;
          return chase_type_var_map(subst, next_id, (depth + 1));
          break __ring_match11;
        }
        return apply_subst_map(subst, resolved);
        break __ring_match11;
      }
      break __ring_match10;
    }
    if (__ring_m10._tag === "none") {
      return types$Type_TypeVar(id, Option_none);
      break __ring_match10;
    }
    __match_fail(__ring_m10);
  }
}

function apply_subst_map(subst, t) {
  __ring_match12: {
    const __ring_m12 = t;
    if (__ring_m12._tag === "IntType") {
      return t;
      break __ring_match12;
    }
    if (__ring_m12._tag === "FloatType") {
      return t;
      break __ring_match12;
    }
    if (__ring_m12._tag === "StrType") {
      return t;
      break __ring_match12;
    }
    if (__ring_m12._tag === "BoolType") {
      return t;
      break __ring_match12;
    }
    if (__ring_m12._tag === "UnitType") {
      return t;
      break __ring_match12;
    }
    if (__ring_m12._tag === "NeverType") {
      return t;
      break __ring_match12;
    }
    if (__ring_m12._tag === "AnyType") {
      return t;
      break __ring_match12;
    }
    if (__ring_m12._tag === "TypeVar") {
      const id = __ring_m12.id;
      return chase_type_var_map(subst, id, 0);
      break __ring_match12;
    }
    if (__ring_m12._tag === "FnType") {
      const params = __ring_m12.params; const return_type = __ring_m12.return_type; const effects = __ring_m12.effects;
      return types$Type_FnType(params.map((function(p) { return apply_subst_map(subst, p); })), apply_subst_map(subst, return_type), apply_subst_row_map(subst, effects));
      break __ring_match12;
    }
    if (__ring_m12._tag === "StructType") {
      const name = __ring_m12.name; const type_params = __ring_m12.type_params; const fields = __ring_m12.fields;
      return types$Type_StructType(name, type_params.map((function(p) { return apply_subst_map(subst, p); })), fields);
      break __ring_match12;
    }
    if (__ring_m12._tag === "EnumType") {
      const name = __ring_m12.name; const type_params = __ring_m12.type_params; const variants = __ring_m12.variants;
      return types$Type_EnumType(name, type_params.map((function(p) { return apply_subst_map(subst, p); })), variants);
      break __ring_match12;
    }
    if (__ring_m12._tag === "GenericType") {
      const base = __ring_m12.base; const args = __ring_m12.args;
      return types$Type_GenericType(apply_subst_map(subst, base), args.map((function(a) { return apply_subst_map(subst, a); })));
      break __ring_match12;
    }
    if (__ring_m12._tag === "RecordType") {
      const fields = __ring_m12.fields; const tail = __ring_m12.tail; const tail_name = __ring_m12.tail_name;
      const mapped_fields = fields.map((function(f) { return new types$RecordField(f.name, apply_subst_map(subst, f.ty)); }));
      __ring_match13: {
        const __ring_m13 = tail;
        if (__ring_m13._tag === "some") {
          const t_id = __ring_m13._0;
          __ring_match14: {
            const __ring_m14 = _Map_get(subst, t_id);
            if (__ring_m14._tag === "some") {
              const resolved = __ring_m14._0;
              const chased = apply_subst_map(subst, resolved);
              __ring_match15: {
                const __ring_m15 = chased;
                if (__ring_m15._tag === "TypeVar") {
                  const new_id = __ring_m15.id; const new_name = __ring_m15.name;
                  return types$Type_RecordType(mapped_fields, Option_some(new_id), new_name);
                  break __ring_match15;
                }
                if (__ring_m15._tag === "RecordType") {
                  const extra_fields = __ring_m15.fields; const extra_tail = __ring_m15.tail; const extra_tn = __ring_m15.tail_name;
                  let all_fields = list_clone(mapped_fields);
                  for (const ef of extra_fields) {
                    List_push(all_fields, new types$RecordField(ef.name, apply_subst_map(subst, ef.ty)));
                  }
                  return types$Type_RecordType(all_fields, extra_tail, extra_tn);
                  break __ring_match15;
                }
                return types$Type_RecordType(mapped_fields, Option_none, Option_none);
                break __ring_match15;
              }
              break __ring_match14;
            }
            if (__ring_m14._tag === "none") {
              return types$Type_RecordType(mapped_fields, Option_some(t_id), tail_name);
              break __ring_match14;
            }
            __match_fail(__ring_m14);
          }
          break __ring_match13;
        }
        if (__ring_m13._tag === "none") {
          return types$Type_RecordType(mapped_fields, Option_none, tail_name);
          break __ring_match13;
        }
        __match_fail(__ring_m13);
      }
      break __ring_match12;
    }
    if (__ring_m12._tag === "EffectRowType") {
      const effects = __ring_m12.effects; const tail = __ring_m12.tail;
      const row = apply_subst_row_map(subst, new types$EffectRow(effects, tail));
      return types$Type_EffectRowType(row.effects, row.tail);
      break __ring_match12;
    }
    if (__ring_m12._tag === "TupleType") {
      const elements = __ring_m12.elements;
      return types$Type_TupleType(elements.map((function(e) { return apply_subst_map(subst, e); })));
      break __ring_match12;
    }
    if (__ring_m12._tag === "ErrorType") {
      return t;
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
}

function apply_subst_effect_map(subst, e) {
  __ring_match16: {
    const __ring_m16 = e;
    if (__ring_m16._tag === "FailEffect") {
      const error_type = __ring_m16.error_type;
      return types$Effect_FailEffect(apply_subst_map(subst, error_type));
      break __ring_match16;
    }
    if (__ring_m16._tag === "MutEffect") {
      const state_type = __ring_m16.state_type;
      return types$Effect_MutEffect(apply_subst_map(subst, state_type));
      break __ring_match16;
    }
    if (__ring_m16._tag === "CustomEffect") {
      const name = __ring_m16.name; const type_args = __ring_m16.type_args;
      return types$Effect_CustomEffect(name, type_args.map((function(a) { return apply_subst_map(subst, a); })));
      break __ring_match16;
    }
    return e;
    break __ring_match16;
  }
}

function apply_subst_row_map(subst, row) {
  const effects = row.effects.map((function(e) { return apply_subst_effect_map(subst, e); }));
  __ring_match17: {
    const __ring_m17 = row.tail;
    if (__ring_m17._tag === "some") {
      const t_id = __ring_m17._0;
      __ring_match18: {
        const __ring_m18 = _Map_get(subst, t_id);
        if (__ring_m18._tag === "some") {
          const resolved = __ring_m18._0;
          const chased = apply_subst_map(subst, resolved);
          __ring_match19: {
            const __ring_m19 = chased;
            if (__ring_m19._tag === "TypeVar") {
              const new_id = __ring_m19.id;
              return new types$EffectRow(effects, Option_some(new_id));
              break __ring_match19;
            }
            if (__ring_m19._tag === "EffectRowType") {
              const extra_effs = __ring_m19.effects; const extra_tail = __ring_m19.tail;
              let merged = list_clone(effects);
              for (const ee of extra_effs) {
                List_push(merged, apply_subst_effect_map(subst, ee));
              }
              return new types$EffectRow(merged, extra_tail);
              break __ring_match19;
            }
            return new types$EffectRow(effects, Option_none);
            break __ring_match19;
          }
          break __ring_match18;
        }
        if (__ring_m18._tag === "none") {
          return new types$EffectRow(effects, Option_some(t_id));
          break __ring_match18;
        }
        __match_fail(__ring_m18);
      }
      break __ring_match17;
    }
    if (__ring_m17._tag === "none") {
      return new types$EffectRow(effects, Option_none);
      break __ring_match17;
    }
    __match_fail(__ring_m17);
  }
}

function apply_subst(subst, t) {
  __ring_match20: {
    const __ring_m20 = t;
    if (__ring_m20._tag === "IntType") {
      return t;
      break __ring_match20;
    }
    if (__ring_m20._tag === "FloatType") {
      return t;
      break __ring_match20;
    }
    if (__ring_m20._tag === "StrType") {
      return t;
      break __ring_match20;
    }
    if (__ring_m20._tag === "BoolType") {
      return t;
      break __ring_match20;
    }
    if (__ring_m20._tag === "UnitType") {
      return t;
      break __ring_match20;
    }
    if (__ring_m20._tag === "NeverType") {
      return t;
      break __ring_match20;
    }
    if (__ring_m20._tag === "AnyType") {
      return t;
      break __ring_match20;
    }
    if (__ring_m20._tag === "TypeVar") {
      const id = __ring_m20.id;
      __ring_match21: {
        const __ring_m21 = union_find$uf_lookup(subst, id);
        if (__ring_m21._tag === "some") {
          const resolved = __ring_m21._0;
          return apply_subst(subst, resolved);
          break __ring_match21;
        }
        if (__ring_m21._tag === "none") {
          const root = union_find$uf_find(subst, id);
          if ((root === id)) {
            return t;
          } else {
            return types$Type_TypeVar(root, Option_none);
          }
          break __ring_match21;
        }
        __match_fail(__ring_m21);
      }
      break __ring_match20;
    }
    if (__ring_m20._tag === "FnType") {
      const params = __ring_m20.params; const return_type = __ring_m20.return_type; const effects = __ring_m20.effects;
      return types$Type_FnType(params.map((function(p) { return apply_subst(subst, p); })), apply_subst(subst, return_type), apply_subst_row(subst, effects));
      break __ring_match20;
    }
    if (__ring_m20._tag === "StructType") {
      const name = __ring_m20.name; const type_params = __ring_m20.type_params; const fields = __ring_m20.fields;
      return types$Type_StructType(name, type_params.map((function(p) { return apply_subst(subst, p); })), fields);
      break __ring_match20;
    }
    if (__ring_m20._tag === "EnumType") {
      const name = __ring_m20.name; const type_params = __ring_m20.type_params; const variants = __ring_m20.variants;
      return types$Type_EnumType(name, type_params.map((function(p) { return apply_subst(subst, p); })), variants);
      break __ring_match20;
    }
    if (__ring_m20._tag === "GenericType") {
      const base = __ring_m20.base; const args = __ring_m20.args;
      return types$Type_GenericType(apply_subst(subst, base), args.map((function(a) { return apply_subst(subst, a); })));
      break __ring_match20;
    }
    if (__ring_m20._tag === "RecordType") {
      const fields = __ring_m20.fields; const tail = __ring_m20.tail; const tail_name = __ring_m20.tail_name;
      const mapped_fields = fields.map((function(f) { return new types$RecordField(f.name, apply_subst(subst, f.ty)); }));
      __ring_match22: {
        const __ring_m22 = tail;
        if (__ring_m22._tag === "some") {
          const t_id = __ring_m22._0;
          const root_id = union_find$uf_find(subst, t_id);
          __ring_match23: {
            const __ring_m23 = union_find$uf_lookup(subst, root_id);
            if (__ring_m23._tag === "some") {
              const resolved = __ring_m23._0;
              const chased = apply_subst(subst, resolved);
              __ring_match24: {
                const __ring_m24 = chased;
                if (__ring_m24._tag === "TypeVar") {
                  const new_id = __ring_m24.id; const new_name = __ring_m24.name;
                  return types$Type_RecordType(mapped_fields, Option_some(new_id), new_name);
                  break __ring_match24;
                }
                if (__ring_m24._tag === "RecordType") {
                  const extra_fields = __ring_m24.fields; const extra_tail = __ring_m24.tail; const extra_tn = __ring_m24.tail_name;
                  let all_fields = list_clone(mapped_fields);
                  for (const ef of extra_fields) {
                    List_push(all_fields, new types$RecordField(ef.name, apply_subst(subst, ef.ty)));
                  }
                  return types$Type_RecordType(all_fields, extra_tail, extra_tn);
                  break __ring_match24;
                }
                return types$Type_RecordType(mapped_fields, Option_none, Option_none);
                break __ring_match24;
              }
              break __ring_match23;
            }
            if (__ring_m23._tag === "none") {
              const actual_id = ((root_id === t_id) ? t_id : root_id);
              return types$Type_RecordType(mapped_fields, Option_some(actual_id), tail_name);
              break __ring_match23;
            }
            __match_fail(__ring_m23);
          }
          break __ring_match22;
        }
        if (__ring_m22._tag === "none") {
          return types$Type_RecordType(mapped_fields, Option_none, tail_name);
          break __ring_match22;
        }
        __match_fail(__ring_m22);
      }
      break __ring_match20;
    }
    if (__ring_m20._tag === "EffectRowType") {
      const effects = __ring_m20.effects; const tail = __ring_m20.tail;
      const row = apply_subst_row(subst, new types$EffectRow(effects, tail));
      return types$Type_EffectRowType(row.effects, row.tail);
      break __ring_match20;
    }
    if (__ring_m20._tag === "TupleType") {
      const elements = __ring_m20.elements;
      return types$Type_TupleType(elements.map((function(e) { return apply_subst(subst, e); })));
      break __ring_match20;
    }
    if (__ring_m20._tag === "ErrorType") {
      return t;
      break __ring_match20;
    }
    __match_fail(__ring_m20);
  }
}

function apply_subst_effect(subst, e) {
  __ring_match25: {
    const __ring_m25 = e;
    if (__ring_m25._tag === "FailEffect") {
      const error_type = __ring_m25.error_type;
      return types$Effect_FailEffect(apply_subst(subst, error_type));
      break __ring_match25;
    }
    if (__ring_m25._tag === "MutEffect") {
      const state_type = __ring_m25.state_type;
      return types$Effect_MutEffect(apply_subst(subst, state_type));
      break __ring_match25;
    }
    if (__ring_m25._tag === "CustomEffect") {
      const name = __ring_m25.name; const type_args = __ring_m25.type_args;
      return types$Effect_CustomEffect(name, type_args.map((function(a) { return apply_subst(subst, a); })));
      break __ring_match25;
    }
    return e;
    break __ring_match25;
  }
}

function apply_subst_row(subst, row) {
  const effects = row.effects.map((function(e) { return apply_subst_effect(subst, e); }));
  __ring_match26: {
    const __ring_m26 = row.tail;
    if (__ring_m26._tag === "some") {
      const t_id = __ring_m26._0;
      const root_id = union_find$uf_find(subst, t_id);
      __ring_match27: {
        const __ring_m27 = union_find$uf_lookup(subst, root_id);
        if (__ring_m27._tag === "some") {
          const resolved = __ring_m27._0;
          const chased = apply_subst(subst, resolved);
          __ring_match28: {
            const __ring_m28 = chased;
            if (__ring_m28._tag === "TypeVar") {
              const new_id = __ring_m28.id;
              return new types$EffectRow(effects, Option_some(new_id));
              break __ring_match28;
            }
            if (__ring_m28._tag === "EffectRowType") {
              const extra_effs = __ring_m28.effects; const extra_tail = __ring_m28.tail;
              let merged = list_clone(effects);
              for (const ee of extra_effs) {
                List_push(merged, apply_subst_effect(subst, ee));
              }
              return new types$EffectRow(merged, extra_tail);
              break __ring_match28;
            }
            return new types$EffectRow(effects, Option_none);
            break __ring_match28;
          }
          break __ring_match27;
        }
        if (__ring_m27._tag === "none") {
          const actual_id = ((root_id === t_id) ? t_id : root_id);
          return new types$EffectRow(effects, Option_some(actual_id));
          break __ring_match27;
        }
        __match_fail(__ring_m27);
      }
      break __ring_match26;
    }
    if (__ring_m26._tag === "none") {
      return new types$EffectRow(effects, Option_none);
      break __ring_match26;
    }
    __match_fail(__ring_m26);
  }
}

function __StringBuilder_Eq_eq(self, other) {
  return true;
}
const __StringBuilder_Eq = { eq: __StringBuilder_Eq_eq, ne: function(self, other) { return !__StringBuilder_Eq_eq(self, other); } };

function __SchemeBound_Eq_eq(self, other) {
  return (self.type_var === other.type_var) && (self.trait_name === other.trait_name);
}
const __SchemeBound_Eq = { eq: __SchemeBound_Eq_eq, ne: function(self, other) { return !__SchemeBound_Eq_eq(self, other); } };

function __FnBound_Eq_eq(self, other) {
  return (self.type_param === other.type_param) && (self.trait_name === other.trait_name);
}
const __FnBound_Eq = { eq: __FnBound_Eq_eq, ne: function(self, other) { return !__FnBound_Eq_eq(self, other); } };

function __IdGen_Eq_eq(self, other) {
  return (self.next_type_var_id === other.next_type_var_id) && (self.next_def_id === other.next_def_id);
}
const __IdGen_Eq = { eq: __IdGen_Eq_eq, ne: function(self, other) { return !__IdGen_Eq_eq(self, other); } };

function __Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return __ring_T_Eq.eq(self._0, other._0);
    case "Err": return __ring_E_Eq.eq(self._0, other._0);
    default: return true;
  }
}
const __Result_Eq = { eq: __Result_Eq_eq, ne: function(self, other, __ring_T_Eq, __ring_E_Eq) { return !__Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq); } };

function __BuiltInKind_Eq_eq(self, other) {
  if (self._tag !== other._tag) return false;
  return true;
}
const __BuiltInKind_Eq = { eq: __BuiltInKind_Eq_eq, ne: function(self, other) { return !__BuiltInKind_Eq_eq(self, other); } };

function __StringBuilder_Clone_clone(self) {
  return new StringBuilder();
}
const __StringBuilder_Clone = { clone: __StringBuilder_Clone_clone };

function __SchemeBound_Clone_clone(self) {
  return new SchemeBound(self.type_var, self.trait_name);
}
const __SchemeBound_Clone = { clone: __SchemeBound_Clone_clone };

function __ImplEntry_Clone_clone(self) {
  return new ImplEntry(self.trait_name, self.target_type_name, __List_Clone.clone(self.type_params, __Str_Clone), __List_Clone.clone(self.method_names, __Str_Clone));
}
const __ImplEntry_Clone = { clone: __ImplEntry_Clone_clone };

function __FnBound_Clone_clone(self) {
  return new FnBound(self.type_param, self.trait_name);
}
const __FnBound_Clone = { clone: __FnBound_Clone_clone };

function __IdGen_Clone_clone(self) {
  return new IdGen(self.next_type_var_id, self.next_def_id);
}
const __IdGen_Clone = { clone: __IdGen_Clone_clone };

function __Result_Clone_clone(self, __ring_T_Clone, __ring_E_Clone) {
  switch (self._tag) {
    case "Ok": return Result_Ok(__ring_T_Clone.clone(self._0));
    case "Err": return Result_Err(__ring_E_Clone.clone(self._0));
    default: return self;
  }
}
const __Result_Clone = { clone: __Result_Clone_clone };

function __BuiltInKind_Clone_clone(self) {
  switch (self._tag) {
    case "BkIo": return BuiltInKind_BkIo;
    case "BkFail": return BuiltInKind_BkFail;
    case "BkMut": return BuiltInKind_BkMut;
    default: return self;
  }
}
const __BuiltInKind_Clone = { clone: __BuiltInKind_Clone_clone };

function __StringBuilder_Ord_cmp(self, other) {
  return 0;
}
const __StringBuilder_Ord = { cmp: __StringBuilder_Ord_cmp };

function __SchemeBound_Ord_cmp(self, other) {
  var c;
  c = (self.type_var < other.type_var ? -1 : self.type_var > other.type_var ? 1 : 0);
  if (c !== 0) return c;
  return (self.trait_name < other.trait_name ? -1 : self.trait_name > other.trait_name ? 1 : 0);
}
const __SchemeBound_Ord = { cmp: __SchemeBound_Ord_cmp };

function __FnBound_Ord_cmp(self, other) {
  var c;
  c = (self.type_param < other.type_param ? -1 : self.type_param > other.type_param ? 1 : 0);
  if (c !== 0) return c;
  return (self.trait_name < other.trait_name ? -1 : self.trait_name > other.trait_name ? 1 : 0);
}
const __FnBound_Ord = { cmp: __FnBound_Ord_cmp };

function __IdGen_Ord_cmp(self, other) {
  var c;
  c = (self.next_type_var_id < other.next_type_var_id ? -1 : self.next_type_var_id > other.next_type_var_id ? 1 : 0);
  if (c !== 0) return c;
  return (self.next_def_id < other.next_def_id ? -1 : self.next_def_id > other.next_def_id ? 1 : 0);
}
const __IdGen_Ord = { cmp: __IdGen_Ord_cmp };

const __Result_tag_order = { "Ok": 0, "Err": 1 };
function __Result_Ord_cmp(self, other, __ring_T_Ord, __ring_E_Ord) {
  var t1 = __Result_tag_order[self._tag];
  var t2 = __Result_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  switch (self._tag) {
    case "Ok": return __ring_T_Ord.cmp(self._0, other._0);
    case "Err": return __ring_E_Ord.cmp(self._0, other._0);
    default: return 0;
  }
}
const __Result_Ord = { cmp: __Result_Ord_cmp };

const __BuiltInKind_tag_order = { "BkIo": 0, "BkFail": 1, "BkMut": 2 };
function __BuiltInKind_Ord_cmp(self, other) {
  var t1 = __BuiltInKind_tag_order[self._tag];
  var t2 = __BuiltInKind_tag_order[other._tag];
  if (t1 !== t2) return (t1 < t2 ? -1 : 1);
  return 0;
}
const __BuiltInKind_Ord = { cmp: __BuiltInKind_Ord_cmp };

function __StringBuilder_Debug_debug(self) {
  return "StringBuilder";
}
const __StringBuilder_Debug = { debug: __StringBuilder_Debug_debug };

function __SchemeBound_Debug_debug(self) {
  return "SchemeBound { " + "type_var: " + String(self.type_var) + ", " + "trait_name: " + String(self.trait_name) + " }";
}
const __SchemeBound_Debug = { debug: __SchemeBound_Debug_debug };

function __ImplEntry_Debug_debug(self) {
  return "ImplEntry { " + "trait_name: " + String(self.trait_name) + ", " + "target_type_name: " + String(self.target_type_name) + ", " + "type_params: " + __List_Debug.debug(self.type_params, __Str_Debug) + ", " + "method_names: " + __List_Debug.debug(self.method_names, __Str_Debug) + " }";
}
const __ImplEntry_Debug = { debug: __ImplEntry_Debug_debug };

function __FnBound_Debug_debug(self) {
  return "FnBound { " + "type_param: " + String(self.type_param) + ", " + "trait_name: " + String(self.trait_name) + " }";
}
const __FnBound_Debug = { debug: __FnBound_Debug_debug };

function __IdGen_Debug_debug(self) {
  return "IdGen { " + "next_type_var_id: " + String(self.next_type_var_id) + ", " + "next_def_id: " + String(self.next_def_id) + " }";
}
const __IdGen_Debug = { debug: __IdGen_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };

function __BuiltInKind_Debug_debug(self) {
  switch (self._tag) {
    case "BkIo": return "BkIo";
    case "BkFail": return "BkFail";
    case "BkMut": return "BkMut";
    default: return self._tag;
  }
}
const __BuiltInKind_Debug = { debug: __BuiltInKind_Debug_debug };


export { SchemeBound, TypeScheme, StructDef, EnumDef, EffectOpDef, BuiltInKind_BkIo, BuiltInKind_BkFail, BuiltInKind_BkMut, EffectDef, TraitMethodDef, TraitDef, ImplEntry, TypeAliasDef, EffectAliasDef, FnBound, SigDef, Scope, TypeRegistry, TraitRegistry, ScopeManager, IdGen, TypeEnv, mono, new_type_env, apply_subst_map, apply_subst_row_map, apply_subst, apply_subst_row, TypeEnv_current_var_id, TypeEnv_fresh_var, TypeEnv_fresh_var_id, TypeEnv_fresh_def_id, TypeEnv_push_scope, TypeEnv_pop_scope, TypeEnv_bind, TypeEnv_bind_mono, TypeEnv_record_def_span, TypeEnv_rebind, TypeEnv_lookup, TypeEnv_instantiate, __SchemeBound_Eq, __FnBound_Eq, __IdGen_Eq, __BuiltInKind_Eq, __SchemeBound_Clone, __ImplEntry_Clone, __FnBound_Clone, __IdGen_Clone, __BuiltInKind_Clone, __SchemeBound_Ord, __FnBound_Ord, __IdGen_Ord, __BuiltInKind_Ord, __SchemeBound_Debug, __ImplEntry_Debug, __FnBound_Debug, __IdGen_Debug, __BuiltInKind_Debug };