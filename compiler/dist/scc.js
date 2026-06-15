import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";



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

class ListIterator {
  constructor(list, index) {
    this.list = list;
    this.index = index;
  }
}

function __ListIterator_Iterator_next(self) {
  if ((self.index < List_len(self.list))) {
    const v = List_get(self.list, self.index);
    self.index = (self.index + 1);
    return v;
  } else {
    return Option_none;
  }
}
const __ListIterator_Iterator = { next: __ListIterator_Iterator_next };

function __List_Iterable_iter(self) {
  return new ListIterator(self, 0);
}
const __List_Iterable = { iter: __List_Iterable_iter };

function List_contains(self, item, __ring_T_Eq) {
  const __ring_iter_0 = __List_Iterable.iter(self);
  while (true) {
    const __ring_next_0 = __ListIterator_Iterator.next(__ring_iter_0);
    if (__ring_next_0._tag === "none") break;
    const x = __ring_next_0._0;
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

class MapIterator {
  constructor(entries, index) {
    this.entries = entries;
    this.index = index;
  }
}

function __MapIterator_Iterator_next(self) {
  if ((self.index < List_len(self.entries))) {
    const v = List_get(self.entries, self.index);
    self.index = (self.index + 1);
    return v;
  } else {
    return Option_none;
  }
}
const __MapIterator_Iterator = { next: __MapIterator_Iterator_next };

function ___Map_Iterable_iter(self) {
  return new MapIterator(_Map_entries(self), 0);
}
const ___Map_Iterable = { iter: ___Map_Iterable_iter };

function _Map_is_empty(self) {
  return (_Map_len(self) === 0);
}

class SetIterator {
  constructor(items, index) {
    this.items = items;
    this.index = index;
  }
}

function __SetIterator_Iterator_next(self) {
  if ((self.index < List_len(self.items))) {
    const v = List_get(self.items, self.index);
    self.index = (self.index + 1);
    return v;
  } else {
    return Option_none;
  }
}
const __SetIterator_Iterator = { next: __SetIterator_Iterator_next };

function ___Set_Iterable_iter(self) {
  return new SetIterator(_Set_to_list(self), 0);
}
const ___Set_Iterable = { iter: ___Set_Iterable_iter };

function _Set_is_empty(self) {
  return (_Set_len(self) === 0);
}

function _Set_contains(self, item, __ring_T_Eq) {
  const items = _Set_to_list(self);
  const __ring_iter_1 = __List_Iterable.iter(items);
  while (true) {
    const __ring_next_1 = __ListIterator_Iterator.next(__ring_iter_1);
    if (__ring_next_1._tag === "none") break;
    const x = __ring_next_1._0;
    if (__ring_T_Eq.eq(x, item)) {
      return true;
    }
  }
  return false;
}
function _Set_has(self, item, __ring_T_Eq) {
  return _Set_contains(self, item, __ring_T_Eq);
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

function collect_stmt_callees(stmt, registered_fns, callees) {
  __ring_match6: {
    const __ring_m6 = stmt;
    if (__ring_m6._tag === "Let") {
      const init = __ring_m6.init;
      return collect_expr_callees(init, registered_fns, callees);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Var") {
      const init = __ring_m6.init;
      return collect_expr_callees(init, registered_fns, callees);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Assign") {
      const target = __ring_m6.target; const value = __ring_m6.value;
      collect_expr_callees(target, registered_fns, callees);
      return collect_expr_callees(value, registered_fns, callees);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ExprStmt") {
      const expr = __ring_m6.expr;
      return collect_expr_callees(expr, registered_fns, callees);
      break __ring_match6;
    }
    if (__ring_m6._tag === "Return") {
      const value = __ring_m6.value;
      __ring_match7: {
        const __ring_m7 = value;
        if (__ring_m7._tag === "some") {
          const v = __ring_m7._0;
          return collect_expr_callees(v, registered_fns, callees);
          break __ring_match7;
        }
        if (__ring_m7._tag === "none") {
          break __ring_match7;
        }
        __match_fail(__ring_m7);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "While") {
      const condition = __ring_m6.condition; const body = __ring_m6.body;
      collect_expr_callees(condition, registered_fns, callees);
      return collect_expr_callees(body, registered_fns, callees);
      break __ring_match6;
    }
    if (__ring_m6._tag === "ForIn") {
      const iterable = __ring_m6.iterable; const body = __ring_m6.body;
      collect_expr_callees(iterable, registered_fns, callees);
      return collect_expr_callees(body, registered_fns, callees);
      break __ring_match6;
    }
    if (__ring_m6._tag === "LetDestructure") {
      const init = __ring_m6.init;
      return collect_expr_callees(init, registered_fns, callees);
      break __ring_match6;
    }
    if (__ring_m6._tag === "IfLet") {
      const expr = __ring_m6.expr; const then_block = __ring_m6.then_block; const else_block = __ring_m6.else_block;
      collect_expr_callees(expr, registered_fns, callees);
      collect_expr_callees(then_block, registered_fns, callees);
      __ring_match8: {
        const __ring_m8 = else_block;
        if (__ring_m8._tag === "some") {
          const eb = __ring_m8._0;
          return collect_expr_callees(eb, registered_fns, callees);
          break __ring_match8;
        }
        if (__ring_m8._tag === "none") {
          break __ring_match8;
        }
        __match_fail(__ring_m8);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "Break") {
      break __ring_match6;
    }
    if (__ring_m6._tag === "Continue") {
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
}

function collect_expr_callees(expr, registered_fns, callees) {
  __ring_match9: {
    const __ring_m9 = expr;
    if (__ring_m9._tag === "Call") {
      const callee = __ring_m9.callee; const args = __ring_m9.args;
      __ring_match10: {
        const __ring_m10 = callee;
        if (__ring_m10._tag === "Ident") {
          const name = __ring_m10.name;
          if (_Set_contains(registered_fns, name, __Str_Eq)) {
            _Set_insert(callees, name);
          }
          break __ring_match10;
        }
        break __ring_match10;
      }
      collect_expr_callees(callee, registered_fns, callees);
      const __ring_iter_2 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
        if (__ring_next_2._tag === "none") break;
        const arg = __ring_next_2._0;
        collect_expr_callees(arg, registered_fns, callees);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "MethodCall") {
      const receiver = __ring_m9.receiver; const args = __ring_m9.args;
      collect_expr_callees(receiver, registered_fns, callees);
      const __ring_iter_3 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
        if (__ring_next_3._tag === "none") break;
        const arg = __ring_next_3._0;
        collect_expr_callees(arg, registered_fns, callees);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "Ident") {
      break __ring_match9;
    }
    if (__ring_m9._tag === "Block") {
      const stmts = __ring_m9.stmts; const tail = __ring_m9.tail;
      const __ring_iter_4 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
        if (__ring_next_4._tag === "none") break;
        const stmt = __ring_next_4._0;
        collect_stmt_callees(stmt, registered_fns, callees);
      }
      __ring_match11: {
        const __ring_m11 = tail;
        if (__ring_m11._tag === "some") {
          const t = __ring_m11._0;
          return collect_expr_callees(t, registered_fns, callees);
          break __ring_match11;
        }
        if (__ring_m11._tag === "none") {
          break __ring_match11;
        }
        __match_fail(__ring_m11);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "IfExpr") {
      const condition = __ring_m9.condition; const then_branch = __ring_m9.then_branch; const else_branch = __ring_m9.else_branch;
      collect_expr_callees(condition, registered_fns, callees);
      collect_expr_callees(then_branch, registered_fns, callees);
      __ring_match12: {
        const __ring_m12 = else_branch;
        if (__ring_m12._tag === "some") {
          const eb = __ring_m12._0;
          return collect_expr_callees(eb, registered_fns, callees);
          break __ring_match12;
        }
        if (__ring_m12._tag === "none") {
          break __ring_match12;
        }
        __match_fail(__ring_m12);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "MatchExpr") {
      const scrutinee = __ring_m9.scrutinee; const arms = __ring_m9.arms;
      collect_expr_callees(scrutinee, registered_fns, callees);
      const __ring_iter_5 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
        if (__ring_next_5._tag === "none") break;
        const arm = __ring_next_5._0;
        __ring_match13: {
          const __ring_m13 = arm.guard;
          if (__ring_m13._tag === "some") {
            const g = __ring_m13._0;
            collect_expr_callees(g, registered_fns, callees);
            break __ring_match13;
          }
          if (__ring_m13._tag === "none") {
            break __ring_match13;
          }
          __match_fail(__ring_m13);
        }
        collect_expr_callees(arm.body, registered_fns, callees);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "Lambda") {
      const body = __ring_m9.body;
      return collect_expr_callees(body, registered_fns, callees);
      break __ring_match9;
    }
    if (__ring_m9._tag === "BinOp") {
      const left = __ring_m9.left; const right = __ring_m9.right;
      collect_expr_callees(left, registered_fns, callees);
      return collect_expr_callees(right, registered_fns, callees);
      break __ring_match9;
    }
    if (__ring_m9._tag === "UnaryOp") {
      const operand = __ring_m9.operand;
      return collect_expr_callees(operand, registered_fns, callees);
      break __ring_match9;
    }
    if (__ring_m9._tag === "FieldAccess") {
      const receiver = __ring_m9.receiver;
      return collect_expr_callees(receiver, registered_fns, callees);
      break __ring_match9;
    }
    if (__ring_m9._tag === "IndexExpr") {
      const receiver = __ring_m9.receiver; const index = __ring_m9.index;
      collect_expr_callees(receiver, registered_fns, callees);
      return collect_expr_callees(index, registered_fns, callees);
      break __ring_match9;
    }
    if (__ring_m9._tag === "StructLit") {
      const fields = __ring_m9.fields; const spread = __ring_m9.spread;
      const __ring_iter_6 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_6 = __ListIterator_Iterator.next(__ring_iter_6);
        if (__ring_next_6._tag === "none") break;
        const f = __ring_next_6._0;
        collect_expr_callees(f.value, registered_fns, callees);
      }
      __ring_match14: {
        const __ring_m14 = spread;
        if (__ring_m14._tag === "some") {
          const s = __ring_m14._0;
          return collect_expr_callees(s, registered_fns, callees);
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "CatchExpr") {
      const inner = __ring_m9.expr; const arms = __ring_m9.arms;
      collect_expr_callees(inner, registered_fns, callees);
      const __ring_iter_7 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
        if (__ring_next_7._tag === "none") break;
        const arm = __ring_next_7._0;
        __ring_match15: {
          const __ring_m15 = arm.guard;
          if (__ring_m15._tag === "some") {
            const g = __ring_m15._0;
            collect_expr_callees(g, registered_fns, callees);
            break __ring_match15;
          }
          if (__ring_m15._tag === "none") {
            break __ring_match15;
          }
          __match_fail(__ring_m15);
        }
        collect_expr_callees(arm.body, registered_fns, callees);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "HandleExpr") {
      const body = __ring_m9.body; const handlers = __ring_m9.handlers;
      collect_expr_callees(body, registered_fns, callees);
      const __ring_iter_8 = __List_Iterable.iter(handlers);
      while (true) {
        const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
        if (__ring_next_8._tag === "none") break;
        const handler = __ring_next_8._0;
        collect_expr_callees(handler.body, registered_fns, callees);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "StringInterp") {
      const parts = __ring_m9.parts;
      const __ring_iter_9 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
        if (__ring_next_9._tag === "none") break;
        const part = __ring_next_9._0;
        __ring_match16: {
          const __ring_m16 = part;
          if (__ring_m16._tag === "ExprPart") {
            const e = __ring_m16._0;
            collect_expr_callees(e, registered_fns, callees);
            break __ring_match16;
          }
          if (__ring_m16._tag === "LitPart") {
            break __ring_match16;
          }
          __match_fail(__ring_m16);
        }
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "Range") {
      const start = __ring_m9.start; const end = __ring_m9.end;
      collect_expr_callees(start, registered_fns, callees);
      return collect_expr_callees(end, registered_fns, callees);
      break __ring_match9;
    }
    if (__ring_m9._tag === "ListLit") {
      const elements = __ring_m9.elements;
      const __ring_iter_10 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
        if (__ring_next_10._tag === "none") break;
        const el = __ring_next_10._0;
        collect_expr_callees(el, registered_fns, callees);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "TupleLit") {
      const elements = __ring_m9.elements;
      const __ring_iter_11 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
        if (__ring_next_11._tag === "none") break;
        const el = __ring_next_11._0;
        collect_expr_callees(el, registered_fns, callees);
      }
      break __ring_match9;
    }
    if (__ring_m9._tag === "IntLit") {
      break __ring_match9;
    }
    if (__ring_m9._tag === "FloatLit") {
      break __ring_match9;
    }
    if (__ring_m9._tag === "StrLit") {
      break __ring_match9;
    }
    if (__ring_m9._tag === "BoolLit") {
      break __ring_match9;
    }
    if (__ring_m9._tag === "ReturnExpr") {
      const value = __ring_m9.value;
      __ring_match17: {
        const __ring_m17 = value;
        if (__ring_m17._tag === "some") {
          const v = __ring_m17._0;
          return collect_expr_callees(v, registered_fns, callees);
          break __ring_match17;
        }
        if (__ring_m17._tag === "none") {
          break __ring_match17;
        }
        __match_fail(__ring_m17);
      }
      break __ring_match9;
    }
    __match_fail(__ring_m9);
  }
}

function prefix_mod_decl(mod_name, decl) {
  __ring_match18: {
    const __ring_m18 = decl;
    if (__ring_m18._tag === "Fn") {
      const name = __ring_m18.name; const type_params = __ring_m18.type_params; const params = __ring_m18.params; const return_type = __ring_m18.return_type; const declared_effects = __ring_m18.declared_effects; const body = __ring_m18.body; const is_pub = __ring_m18.is_pub; const is_abstract = __ring_m18.is_abstract; const span = __ring_m18.span;
      return ast$Decl_Fn(`${mod_name}::${name}`, type_params, params, return_type, declared_effects, body, is_pub, is_abstract, span);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Impl") {
      const target_type = __ring_m18.target_type; const type_params = __ring_m18.type_params; const trait_name = __ring_m18.trait_name; const methods = __ring_m18.methods; const span = __ring_m18.span;
      let prefixed_methods = [];
      const __ring_iter_12 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
        if (__ring_next_12._tag === "none") break;
        const m = __ring_next_12._0;
        List_push(prefixed_methods, prefix_mod_decl(mod_name, m));
      }
      return ast$Decl_Impl(target_type, type_params, trait_name, prefixed_methods, span);
      break __ring_match18;
    }
    return decl;
    break __ring_match18;
  }
}

function collect_decl_edges(decl, registered_fns, graph, impl_node) {
  __ring_match19: {
    const __ring_m19 = decl;
    if (__ring_m19._tag === "Fn") {
      const name = __ring_m19.name; const body = __ring_m19.body;
      const caller = (function() {
  const __ring_m = impl_node;
  if (__ring_m._tag === "some") { const inode = __ring_m._0; return inode; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
      if ((!_Map_contains_key(graph, caller))) {
        _Map_insert(graph, caller, []);
      }
      let edges = set_new();
      collect_expr_callees(body, registered_fns, edges);
      __ring_match20: {
        const __ring_m20 = _Map_get(graph, caller);
        if (__ring_m20._tag === "some") {
          const existing = __ring_m20._0;
          const __ring_iter_13 = ___Set_Iterable.iter(edges);
          while (true) {
            const __ring_next_13 = __SetIterator_Iterator.next(__ring_iter_13);
            if (__ring_next_13._tag === "none") break;
            const e = __ring_next_13._0;
            if ((e !== caller)) {
              List_push(existing, e);
            }
          }
          break __ring_match20;
        }
        if (__ring_m20._tag === "none") {
          let edge_list = [];
          const __ring_iter_14 = ___Set_Iterable.iter(edges);
          while (true) {
            const __ring_next_14 = __SetIterator_Iterator.next(__ring_iter_14);
            if (__ring_next_14._tag === "none") break;
            const e = __ring_next_14._0;
            if ((e !== caller)) {
              List_push(edge_list, e);
            }
          }
          return _Map_insert(graph, caller, edge_list);
          break __ring_match20;
        }
        __match_fail(__ring_m20);
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "Impl") {
      const target_type = __ring_m19.target_type; const trait_name = __ring_m19.trait_name; const methods = __ring_m19.methods;
      const inode = (function() {
  const __ring_m = trait_name;
  if (__ring_m._tag === "some") { const tn = __ring_m._0; return `impl::${target_type}::${tn}`; }
  if (__ring_m._tag === "none") { return `impl::${target_type}`; }
  __match_fail(__ring_m);
})();
      if ((!_Map_contains_key(graph, inode))) {
        _Map_insert(graph, inode, []);
      }
      const __ring_iter_15 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
        if (__ring_next_15._tag === "none") break;
        const method = __ring_next_15._0;
        collect_decl_edges(method, registered_fns, graph, Option_some(inode));
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "ModBlock") {
      const name = __ring_m19.name; const decls = __ring_m19.decls;
      const __ring_iter_16 = __List_Iterable.iter(decls);
      while (true) {
        const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
        if (__ring_next_16._tag === "none") break;
        const d = __ring_next_16._0;
        const prefixed = prefix_mod_decl(name, d);
        collect_decl_edges(prefixed, registered_fns, graph, impl_node);
      }
      break __ring_match19;
    }
    break __ring_match19;
  }
}

function build_call_graph(decls, registered_fns) {
  let graph = map_new();
  const __ring_iter_17 = ___Set_Iterable.iter(registered_fns);
  while (true) {
    const __ring_next_17 = __SetIterator_Iterator.next(__ring_iter_17);
    if (__ring_next_17._tag === "none") break;
    const name = __ring_next_17._0;
    if ((!_Map_contains_key(graph, name))) {
      _Map_insert(graph, name, []);
    }
  }
  const __ring_iter_18 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
    if (__ring_next_18._tag === "none") break;
    const decl = __ring_next_18._0;
    collect_decl_edges(decl, registered_fns, graph, Option_none);
  }
  return graph;
}

function collect_fn_names_from_decls(decls, names, mod_prefix) {
  const __ring_iter_19 = __List_Iterable.iter(decls);
  while (true) {
    const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
    if (__ring_next_19._tag === "none") break;
    const decl = __ring_next_19._0;
    __ring_match21: {
      const __ring_m21 = decl;
      if (__ring_m21._tag === "Fn") {
        const name = __ring_m21.name;
        const full_name = (function() {
  const __ring_m = mod_prefix;
  if (__ring_m._tag === "some") { const p = __ring_m._0; return `${p}::${name}`; }
  if (__ring_m._tag === "none") { return name; }
  __match_fail(__ring_m);
})();
        _Set_insert(names, full_name);
        break __ring_match21;
      }
      if (__ring_m21._tag === "Impl") {
        const methods = __ring_m21.methods;
        const __ring_iter_20 = __List_Iterable.iter(methods);
        while (true) {
          const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
          if (__ring_next_20._tag === "none") break;
          const method = __ring_next_20._0;
          __ring_match22: {
            const __ring_m22 = method;
            if (__ring_m22._tag === "Fn") {
              const mname = __ring_m22.name;
              const full_name = (function() {
  const __ring_m = mod_prefix;
  if (__ring_m._tag === "some") { const p = __ring_m._0; return `${p}::${mname}`; }
  if (__ring_m._tag === "none") { return mname; }
  __match_fail(__ring_m);
})();
              _Set_insert(names, full_name);
              break __ring_match22;
            }
            break __ring_match22;
          }
        }
        break __ring_match21;
      }
      if (__ring_m21._tag === "ModBlock") {
        const mod_name = __ring_m21.name; const mod_decls = __ring_m21.decls;
        const prefix = (function() {
  const __ring_m = mod_prefix;
  if (__ring_m._tag === "some") { const p = __ring_m._0; return `${p}::${mod_name}`; }
  if (__ring_m._tag === "none") { return mod_name; }
  __match_fail(__ring_m);
})();
        collect_fn_names_from_decls(mod_decls, names, Option_some(prefix));
        break __ring_match21;
      }
      break __ring_match21;
    }
  }
}

function collect_registered_fn_names(decls) {
  let names = set_new();
  collect_fn_names_from_decls(decls, names, Option_none);
  return names;
}

function tarjan_strongconnect(v, graph, index_counter, stack, on_stack, indices, lowlinks, result) {
  const v_index = index_counter.value;
  index_counter.value = (index_counter.value + 1);
  _Map_insert(indices, v, v_index);
  _Map_insert(lowlinks, v, v_index);
  List_push(stack, v);
  _Set_insert(on_stack, v);
  const successors = (function() {
  const __ring_m = _Map_get(graph, v);
  if (__ring_m._tag === "some") { const s = __ring_m._0; return s; }
  if (__ring_m._tag === "none") { return []; }
  __match_fail(__ring_m);
})();
  const __ring_iter_21 = __List_Iterable.iter(successors);
  while (true) {
    const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
    if (__ring_next_21._tag === "none") break;
    const w = __ring_next_21._0;
    if ((!_Map_contains_key(indices, w))) {
      tarjan_strongconnect(w, graph, index_counter, stack, on_stack, indices, lowlinks, result);
      const v_low = Option_unwrap_or(_Map_get(lowlinks, v), 0);
      const w_low = Option_unwrap_or(_Map_get(lowlinks, w), 0);
      if ((w_low < v_low)) {
        _Map_insert(lowlinks, v, w_low);
      }
    } else {
      if (_Set_contains(on_stack, w, __Str_Eq)) {
        const v_low = Option_unwrap_or(_Map_get(lowlinks, v), 0);
        const w_idx = Option_unwrap_or(_Map_get(indices, w), 0);
        if ((w_idx < v_low)) {
          _Map_insert(lowlinks, v, w_idx);
        }
      }
    }
  }
  const v_low = Option_unwrap_or(_Map_get(lowlinks, v), 0);
  const v_idx = Option_unwrap_or(_Map_get(indices, v), 0);
  if ((v_low === v_idx)) {
    let scc = [];
    let done = false;
    while ((!done)) {
      __ring_match23: {
        const __ring_m23 = List_pop(stack);
        if (__ring_m23._tag === "some") {
          const w = __ring_m23._0;
          _Set_remove(on_stack, w);
          List_push(scc, w);
          if ((w === v)) {
            done = true;
          }
          break __ring_match23;
        }
        if (__ring_m23._tag === "none") {
          done = true;
          break __ring_match23;
        }
        __match_fail(__ring_m23);
      }
    }
    return List_push(result, scc);
  }
}

function tarjan_scc(graph) {
  let index_counter = {value: 0};
  let stack = [];
  let on_stack = set_new();
  let indices = map_new();
  let lowlinks = map_new();
  let result = [];
  let all_nodes = set_new();
  let sorted_graph = _Map_entries(graph);
  sorted_graph.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_22 = __List_Iterable.iter(sorted_graph);
  while (true) {
    const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
    if (__ring_next_22._tag === "none") break;
    const entry = __ring_next_22._0;
    const __ring_dt0 = entry;
    const node = __ring_dt0[0];
    const targets = __ring_dt0[1];
    _Set_insert(all_nodes, node);
    const __ring_iter_23 = __List_Iterable.iter(targets);
    while (true) {
      const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
      if (__ring_next_23._tag === "none") break;
      const t = __ring_next_23._0;
      _Set_insert(all_nodes, t);
    }
  }
  const __ring_iter_24 = ___Set_Iterable.iter(all_nodes);
  while (true) {
    const __ring_next_24 = __SetIterator_Iterator.next(__ring_iter_24);
    if (__ring_next_24._tag === "none") break;
    const node = __ring_next_24._0;
    if ((!_Map_contains_key(indices, node))) {
      tarjan_strongconnect(node, graph, index_counter, stack, on_stack, indices, lowlinks, result);
    }
  }
  return result;
}

function __Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq) {
  if (self._tag !== other._tag) return false;
  switch (self._tag) {
    case "Ok": return __ring_T_Eq.eq(self._0, other._0);
    case "Err": return __ring_E_Eq.eq(self._0, other._0);
    default: return true;
  }
}
const __Result_Eq = { eq: __Result_Eq_eq, ne: function(self, other, __ring_T_Eq, __ring_E_Eq) { return !__Result_Eq_eq(self, other, __ring_T_Eq, __ring_E_Eq); } };

function __ListIterator_Clone_clone(self, __ring_T_Clone) {
  return new ListIterator(__List_Clone.clone(self.list, __ring_T_Clone), self.index);
}
const __ListIterator_Clone = { clone: __ListIterator_Clone_clone };

function __SetIterator_Clone_clone(self, __ring_T_Clone) {
  return new SetIterator(__List_Clone.clone(self.items, __ring_T_Clone), self.index);
}
const __SetIterator_Clone = { clone: __SetIterator_Clone_clone };

function __Result_Clone_clone(self, __ring_T_Clone, __ring_E_Clone) {
  switch (self._tag) {
    case "Ok": return Result_Ok(__ring_T_Clone.clone(self._0));
    case "Err": return Result_Err(__ring_E_Clone.clone(self._0));
    default: return self;
  }
}
const __Result_Clone = { clone: __Result_Clone_clone };

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

function __ListIterator_Debug_debug(self, __ring_T_Debug) {
  return "ListIterator { " + "list: " + __List_Debug.debug(self.list, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __ListIterator_Debug = { debug: __ListIterator_Debug_debug };

function __SetIterator_Debug_debug(self, __ring_T_Debug) {
  return "SetIterator { " + "items: " + __List_Debug.debug(self.items, __ring_T_Debug) + ", " + "index: " + String(self.index) + " }";
}
const __SetIterator_Debug = { debug: __SetIterator_Debug_debug };

function __Result_Debug_debug(self, __ring_T_Debug, __ring_E_Debug) {
  switch (self._tag) {
    case "Ok": return "Ok(" + __ring_T_Debug.debug(self._0) + ")";
    case "Err": return "Err(" + __ring_E_Debug.debug(self._0) + ")";
    default: return self._tag;
  }
}
const __Result_Debug = { debug: __Result_Debug_debug };


export { collect_registered_fn_names, build_call_graph, tarjan_scc };