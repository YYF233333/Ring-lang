import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { RING_TYPEID_CELL as codegen_llvm_ctx$RING_TYPEID_CELL, RING_TYPEID_CLOSURE_ENV as codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, RING_TYPEID_DICT_DYN as codegen_llvm_ctx$RING_TYPEID_DICT_DYN, RING_TYPEID_DICT_STATIC as codegen_llvm_ctx$RING_TYPEID_DICT_STATIC, build_entry_alloca as codegen_llvm_ctx$build_entry_alloca, fresh_name as codegen_llvm_ctx$fresh_name, get_builtin_typeid as codegen_llvm_ctx$get_builtin_typeid, get_or_assign_typeid as codegen_llvm_ctx$get_or_assign_typeid, get_or_declare_runtime_fn as codegen_llvm_ctx$get_or_declare_runtime_fn, get_rt_fn_type as codegen_llvm_ctx$get_rt_fn_type, llvm_mangle_fn as codegen_llvm_ctx$llvm_mangle_fn, llvm_mangle_fn_with_prefix as codegen_llvm_ctx$llvm_mangle_fn_with_prefix, llvm_mangle_method as codegen_llvm_ctx$llvm_mangle_method, llvm_resolve_fn as codegen_llvm_ctx$llvm_resolve_fn, llvm_resolve_method as codegen_llvm_ctx$llvm_resolve_method, EnumTypeInfo as codegen_llvm_ctx$EnumTypeInfo, EnumVariantInfo as codegen_llvm_ctx$EnumVariantInfo, ExternFnInfo as codegen_llvm_ctx$ExternFnInfo, ExternParamMarshall_PassthroughPtr as codegen_llvm_ctx$ExternParamMarshall_PassthroughPtr, ExternParamMarshall_StrToCstr as codegen_llvm_ctx$ExternParamMarshall_StrToCstr, ExternParamMarshall_StrToCstrAndLen as codegen_llvm_ctx$ExternParamMarshall_StrToCstrAndLen, ExternParamMarshall_IntToI32 as codegen_llvm_ctx$ExternParamMarshall_IntToI32, ExternParamMarshall_IntToI64 as codegen_llvm_ctx$ExternParamMarshall_IntToI64, ExternParamMarshall_FloatToDouble as codegen_llvm_ctx$ExternParamMarshall_FloatToDouble, ExternParamMarshall_ListToDataAndCount as codegen_llvm_ctx$ExternParamMarshall_ListToDataAndCount, ExternParamMarshall_ListToDataAndCountI64 as codegen_llvm_ctx$ExternParamMarshall_ListToDataAndCountI64, ExternRetMarshall_RetPtr as codegen_llvm_ctx$ExternRetMarshall_RetPtr, ExternRetMarshall_RetVoid as codegen_llvm_ctx$ExternRetMarshall_RetVoid, ExternRetMarshall_RetIntToBoxed as codegen_llvm_ctx$ExternRetMarshall_RetIntToBoxed, ExternRetMarshall_RetStrFromCstr as codegen_llvm_ctx$ExternRetMarshall_RetStrFromCstr, LlvmCtx as codegen_llvm_ctx$LlvmCtx, StructFieldInfo as codegen_llvm_ctx$StructFieldInfo, __EnumVariantInfo_Clone as codegen_llvm_ctx$__EnumVariantInfo_Clone, __EnumVariantInfo_Debug as codegen_llvm_ctx$__EnumVariantInfo_Debug, __ExternParamMarshall_Eq as codegen_llvm_ctx$__ExternParamMarshall_Eq, __ExternParamMarshall_Clone as codegen_llvm_ctx$__ExternParamMarshall_Clone, __ExternParamMarshall_Ord as codegen_llvm_ctx$__ExternParamMarshall_Ord, __ExternParamMarshall_Debug as codegen_llvm_ctx$__ExternParamMarshall_Debug, __ExternRetMarshall_Eq as codegen_llvm_ctx$__ExternRetMarshall_Eq, __ExternRetMarshall_Clone as codegen_llvm_ctx$__ExternRetMarshall_Clone, __ExternRetMarshall_Ord as codegen_llvm_ctx$__ExternRetMarshall_Ord, __ExternRetMarshall_Debug as codegen_llvm_ctx$__ExternRetMarshall_Debug } from "./codegen_llvm_ctx.js";
import { emit_llvm_stmt as codegen_llvm_stmt$emit_llvm_stmt } from "./codegen_llvm_stmt.js";
import { LIST_HOF_JS_METHOD as codegen_ctx$LIST_HOF_JS_METHOD, emit as codegen_ctx$emit, emit_raw as codegen_ctx$emit_raw, extract_effect_names as codegen_ctx$extract_effect_names, get_evidence_params as codegen_ctx$get_evidence_params, is_imported_name as codegen_ctx$is_imported_name, new_codegen_ctx as codegen_ctx$new_codegen_ctx, pop_indent as codegen_ctx$pop_indent, push_indent as codegen_ctx$push_indent, qualify as codegen_ctx$qualify, safe_ident as codegen_ctx$safe_ident, CodegenCtx as codegen_ctx$CodegenCtx, HTraitDeclInfo as codegen_ctx$HTraitDeclInfo } from "./codegen_ctx.js";



function List_is_empty(self) {
  return (List_len(self) === 0);
}
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

function List_sort(self, __ring_T_Ord) {
  return self.sort((function(a, b) { return ((__ring_T_Ord.cmp(a, b) < 0) ? (-1) : ((__ring_T_Ord.cmp(a, b) > 0) ? 1 : 0)); }));
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

function Result_and_then(self, f) {
  __ring_match1: {
    const __ring_m1 = self;
    if (__ring_m1._tag === "Ok") {
      const v = __ring_m1._0;
      return f(v);
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
function Result_is_err(self) {
  __ring_match2: {
    const __ring_m2 = self;
    if (__ring_m2._tag === "Ok") {
      return false;
      break __ring_match2;
    }
    if (__ring_m2._tag === "Err") {
      return true;
      break __ring_match2;
    }
    __match_fail(__ring_m2);
  }
}
function Result_is_ok(self) {
  __ring_match3: {
    const __ring_m3 = self;
    if (__ring_m3._tag === "Ok") {
      return true;
      break __ring_match3;
    }
    if (__ring_m3._tag === "Err") {
      return false;
      break __ring_match3;
    }
    __match_fail(__ring_m3);
  }
}
function Result_map(self, f) {
  __ring_match4: {
    const __ring_m4 = self;
    if (__ring_m4._tag === "Ok") {
      const v = __ring_m4._0;
      return Result_Ok(f(v));
      break __ring_match4;
    }
    if (__ring_m4._tag === "Err") {
      const e = __ring_m4._0;
      return Result_Err(e);
      break __ring_match4;
    }
    __match_fail(__ring_m4);
  }
}
function Result_unwrap_or(self, _default) {
  __ring_match5: {
    const __ring_m5 = self;
    if (__ring_m5._tag === "Ok") {
      const v = __ring_m5._0;
      return v;
      break __ring_match5;
    }
    if (__ring_m5._tag === "Err") {
      return _default;
      break __ring_match5;
    }
    __match_fail(__ring_m5);
  }
}

function to_result(f) {
  return (function() { const __ring_ev_fail = { raise: (__ring_err) => { throw new __EffectAbort("fail", __ring_err); } }; try { return Result_Ok(f()); } catch (__ring_e) { if (__ring_e instanceof __EffectAbort && __ring_e.effect === "fail") { const __ring_err = __ring_e.value; if (true) { const e = __ring_err; return Result_Err(e); } else { throw __ring_e; } } throw __ring_e; } })();
}




























































class FnLookupResult {
  constructor(fn_val, fn_mangled) {
    this.fn_val = fn_val;
    this.fn_mangled = fn_mangled;
  }
}

function discard(v) {
}

function find_enum_by_variant(ctx, variant_name, qualifier) {
  __ring_match6: {
    const __ring_m6 = qualifier;
    if (__ring_m6._tag === "some") {
      const q = __ring_m6._0;
      __ring_match7: {
        const __ring_m7 = _Map_get(ctx.enum_types, q);
        if (__ring_m7._tag === "some") {
          const ei = __ring_m7._0;
          return Option_some(ei);
          break __ring_match7;
        }
        if (__ring_m7._tag === "none") {
          break __ring_match7;
        }
        __match_fail(__ring_m7);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
  __ring_match8: {
    const __ring_m8 = _Map_get(ctx.enum_types, variant_name);
    if (__ring_m8._tag === "some") {
      const ei = __ring_m8._0;
      return Option_some(ei);
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
  let sorted_enums = _Map_entries(ctx.enum_types);
  sorted_enums.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_2 = __List_Iterable.iter(sorted_enums);
  while (true) {
    const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
    if (__ring_next_2._tag === "none") break;
    const entry = __ring_next_2._0;
    const __ring_dt0 = entry;
    const ename = __ring_dt0[0];
    const einfo = __ring_dt0[1];
    __ring_match9: {
      const __ring_m9 = _Map_get(einfo.variants, variant_name);
      if (__ring_m9._tag === "some") {
        return Option_some(einfo);
        break __ring_match9;
      }
      if (__ring_m9._tag === "none") {
        break __ring_match9;
      }
      __match_fail(__ring_m9);
    }
  }
  return Option_none;
}

function bind_nested_pattern(ctx, val, pat) {
  __ring_match10: {
    const __ring_m10 = pat;
    if (__ring_m10._tag === "Binding") {
      const name = __ring_m10.name;
      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, name);
      discard(LLVMBuildStore(ctx.builder, val, alloca));
      return _Map_insert(ctx.named_values, name, alloca);
      break __ring_match10;
    }
    if (__ring_m10._tag === "Wildcard") {
      break __ring_match10;
    }
    if (__ring_m10._tag === "Constructor") {
      const name = __ring_m10.name; const qualifier = __ring_m10.qualifier; const fields = __ring_m10.fields;
      const enum_info = find_enum_by_variant(ctx, name, qualifier);
      __ring_match11: {
        const __ring_m11 = enum_info;
        if (__ring_m11._tag === "some") {
          const ei = __ring_m11._0;
          const __ring_end3 = List_len(fields);
          for (let i = 0; i < __ring_end3; i++) {
            __ring_match12: {
              const __ring_m12 = List_get(fields, i);
              if (__ring_m12._tag === "some") {
                const fp = __ring_m12._0;
                const field_ptr = LLVMBuildStructGEP2(ctx.builder, ei.llvm_type, val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "nf"));
                const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "nv"));
                bind_nested_pattern(ctx, field_val, fp);
                break __ring_match12;
              }
              if (__ring_m12._tag === "none") {
                break __ring_match12;
              }
              __match_fail(__ring_m12);
            }
          }
          break __ring_match11;
        }
        if (__ring_m11._tag === "none") {
          break __ring_match11;
        }
        __match_fail(__ring_m11);
      }
      break __ring_match10;
    }
    if (__ring_m10._tag === "TuplePattern") {
      const elements = __ring_m10.elements;
      const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
      const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
      const __ring_end4 = List_len(elements);
      for (let i = 0; i < __ring_end4; i++) {
        __ring_match13: {
          const __ring_m13 = List_get(elements, i);
          if (__ring_m13._tag === "some") {
            const ep = __ring_m13._0;
            const idx = LLVMConstInt(ctx.i64_type, i, 0);
            const elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [val, idx], codegen_llvm_ctx$fresh_name(ctx, "te"));
            bind_nested_pattern(ctx, elem, ep);
            break __ring_match13;
          }
          if (__ring_m13._tag === "none") {
            break __ring_match13;
          }
          __match_fail(__ring_m13);
        }
      }
      break __ring_match10;
    }
    if (__ring_m10._tag === "NamedConstructor") {
      const name = __ring_m10.name; const qualifier = __ring_m10.qualifier; const fields = __ring_m10.fields;
      const enum_info = find_enum_by_variant(ctx, name, qualifier);
      __ring_match14: {
        const __ring_m14 = enum_info;
        if (__ring_m14._tag === "some") {
          const ei = __ring_m14._0;
          let __ring_blk0;
          __ring_match15: {
            const __ring_m15 = _Map_get(ei.variants, name);
            if (__ring_m15._tag === "some") {
              const vi = __ring_m15._0;
              __ring_blk0 = vi.field_names;
              break __ring_match15;
            }
            if (__ring_m15._tag === "none") {
              __ring_blk0 = [];
              break __ring_match15;
            }
            __match_fail(__ring_m15);
          }
          const fnames = __ring_blk0;
          const __ring_end5 = List_len(fields);
          for (let i = 0; i < __ring_end5; i++) {
            __ring_match16: {
              const __ring_m16 = List_get(fields, i);
              if (__ring_m16._tag === "some") {
                const nf = __ring_m16._0;
                let field_idx = i;
                const __ring_end6 = List_len(fnames);
                for (let fi = 0; fi < __ring_end6; fi++) {
                  if ((__ring_index(fnames, fi) === nf.name)) {
                    field_idx = fi;
                  }
                }
                const field_ptr = LLVMBuildStructGEP2(ctx.builder, ei.llvm_type, val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "nf"));
                const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "nv"));
                bind_nested_pattern(ctx, field_val, nf.pattern);
                break __ring_match16;
              }
              if (__ring_m16._tag === "none") {
                break __ring_match16;
              }
              __match_fail(__ring_m16);
            }
          }
          break __ring_match14;
        }
        if (__ring_m14._tag === "none") {
          __ring_match17: {
            const __ring_m17 = _Map_get(ctx.struct_types, name);
            if (__ring_m17._tag === "some") {
              const si = __ring_m17._0;
              const __ring_end7 = List_len(fields);
              for (let i = 0; i < __ring_end7; i++) {
                __ring_match18: {
                  const __ring_m18 = List_get(fields, i);
                  if (__ring_m18._tag === "some") {
                    const nf = __ring_m18._0;
                    let field_idx = i;
                    const __ring_end8 = List_len(si.field_names);
                    for (let fi = 0; fi < __ring_end8; fi++) {
                      if ((__ring_index(si.field_names, fi) === nf.name)) {
                        field_idx = fi;
                      }
                    }
                    const field_ptr = LLVMBuildStructGEP2(ctx.builder, si.llvm_type, val, field_idx, codegen_llvm_ctx$fresh_name(ctx, "sf"));
                    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "sv"));
                    bind_nested_pattern(ctx, field_val, nf.pattern);
                    break __ring_match18;
                  }
                  if (__ring_m18._tag === "none") {
                    break __ring_match18;
                  }
                  __match_fail(__ring_m18);
                }
              }
              break __ring_match17;
            }
            if (__ring_m17._tag === "none") {
              break __ring_match17;
            }
            __match_fail(__ring_m17);
          }
          break __ring_match14;
        }
        __match_fail(__ring_m14);
      }
      break __ring_match10;
    }
    break __ring_match10;
  }
}

function bind_constructor_fields(ctx, scrut_val, cname, qualifier, fields) {
  const ei = find_enum_by_variant(ctx, cname, qualifier);
  __ring_match19: {
    const __ring_m19 = ei;
    if (__ring_m19._tag === "some") {
      const enum_info = __ring_m19._0;
      const __ring_end9 = List_len(fields);
      for (let i = 0; i < __ring_end9; i++) {
        __ring_match20: {
          const __ring_m20 = List_get(fields, i);
          if (__ring_m20._tag === "some") {
            const field_pat = __ring_m20._0;
            __ring_match21: {
              const __ring_m21 = field_pat;
              if (__ring_m21._tag === "Binding") {
                const bname = __ring_m21.name;
                const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                _Map_insert(ctx.named_values, bname, alloca);
                break __ring_match21;
              }
              if (__ring_m21._tag === "Wildcard") {
                break __ring_match21;
              }
              const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
              const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
              bind_nested_pattern(ctx, field_val, field_pat);
              break __ring_match21;
            }
            break __ring_match20;
          }
          if (__ring_m20._tag === "none") {
            break __ring_match20;
          }
          __match_fail(__ring_m20);
        }
      }
      break __ring_match19;
    }
    if (__ring_m19._tag === "none") {
      break __ring_match19;
    }
    __match_fail(__ring_m19);
  }
}

function bind_named_constructor_fields(ctx, scrut_val, cname, qualifier, named_fields) {
  const ei = find_enum_by_variant(ctx, cname, qualifier);
  __ring_match22: {
    const __ring_m22 = ei;
    if (__ring_m22._tag === "some") {
      const enum_info = __ring_m22._0;
      __ring_match23: {
        const __ring_m23 = _Map_get(enum_info.variants, cname);
        if (__ring_m23._tag === "some") {
          const vi = __ring_m23._0;
          const __ring_end10 = List_len(named_fields);
          for (let i = 0; i < __ring_end10; i++) {
            __ring_match24: {
              const __ring_m24 = List_get(named_fields, i);
              if (__ring_m24._tag === "some") {
                const nf = __ring_m24._0;
                let field_idx = i;
                const __ring_end11 = List_len(vi.field_names);
                for (let fi = 0; fi < __ring_end11; fi++) {
                  if ((__ring_index(vi.field_names, fi) === nf.name)) {
                    field_idx = fi;
                  }
                }
                __ring_match25: {
                  const __ring_m25 = nf.pattern;
                  if (__ring_m25._tag === "Binding") {
                    const bname = __ring_m25.name;
                    const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                    const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                    discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                    _Map_insert(ctx.named_values, bname, alloca);
                    break __ring_match25;
                  }
                  if (__ring_m25._tag === "Wildcard") {
                    break __ring_match25;
                  }
                  const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                  const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
                  bind_nested_pattern(ctx, field_val, nf.pattern);
                  break __ring_match25;
                }
                break __ring_match24;
              }
              if (__ring_m24._tag === "none") {
                break __ring_match24;
              }
              __match_fail(__ring_m24);
            }
          }
          break __ring_match23;
        }
        if (__ring_m23._tag === "none") {
          break __ring_match23;
        }
        __match_fail(__ring_m23);
      }
      break __ring_match22;
    }
    if (__ring_m22._tag === "none") {
      break __ring_match22;
    }
    __match_fail(__ring_m22);
  }
}

function box_bool(ctx, raw) {
  const shifted = LLVMBuildShl(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "sh"));
  const tagged = LLVMBuildOr(ctx.builder, shifted, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "tg"));
  return LLVMBuildIntToPtr(ctx.builder, tagged, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "bb"));
}

function box_float(ctx, raw) {
  const box_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_float", [ctx.double_type], ctx.ptr_type);
  const box_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_box_float");
  return LLVMBuildCall2(ctx.builder, box_ty, box_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "bf"));
}

function box_int(ctx, raw) {
  const shifted = LLVMBuildShl(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "sh"));
  const tagged = LLVMBuildOr(ctx.builder, shifted, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "tg"));
  return LLVMBuildIntToPtr(ctx.builder, tagged, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "bi"));
}

function cell_struct_ty(ctx) {
  return LLVMStructTypeInContext(ctx.context, [ctx.ptr_type], 0);
}

function build_cell_alloc(ctx, init_val) {
  const cell_ty = cell_struct_ty(ctx);
  const size = LLVMSizeOf(cell_ty);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const typeid_val = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$RING_TYPEID_CELL, 0);
  const cell_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, typeid_val], codegen_llvm_ctx$fresh_name(ctx, "cell"));
  const value_slot = LLVMBuildStructGEP2(ctx.builder, cell_ty, cell_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "cellv"));
  discard(LLVMBuildStore(ctx.builder, init_val, value_slot));
  return cell_ptr;
}

function build_cell_load(ctx, cell_ptr, name) {
  const cell_ty = cell_struct_ty(ctx);
  const value_slot = LLVMBuildStructGEP2(ctx.builder, cell_ty, cell_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "cellr"));
  return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, value_slot, codegen_llvm_ctx$fresh_name(ctx, name));
}

function build_cell_store(ctx, cell_ptr, new_val) {
  const cell_ty = cell_struct_ty(ctx);
  const value_slot = LLVMBuildStructGEP2(ctx.builder, cell_ty, cell_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "cellw"));
  return discard(LLVMBuildStore(ctx.builder, new_val, value_slot));
}

function consider_capture_name(ctx, name, resolved_name, params, captures) {
  let __ring_blk1;
  __ring_match26: {
    const __ring_m26 = resolved_name;
    if (__ring_m26._tag === "some") {
      const rn = __ring_m26._0;
      __ring_blk1 = rn;
      break __ring_match26;
    }
    if (__ring_m26._tag === "none") {
      __ring_blk1 = name;
      break __ring_match26;
    }
    __match_fail(__ring_m26);
  }
  const lookup_name = __ring_blk1;
  let is_param = false;
  const __ring_iter_12 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
    if (__ring_next_12._tag === "none") break;
    const p = __ring_next_12._0;
    if (((p.name === lookup_name) ? true : (p.name === name))) {
      is_param = true;
    }
  }
  if ((is_param === false)) {
    const mangled = codegen_llvm_ctx$llvm_resolve_fn(ctx, lookup_name);
    let __ring_blk2;
    __ring_match27: {
      const __ring_m27 = _Map_get(ctx.functions, mangled);
      if (__ring_m27._tag === "some") {
        __ring_blk2 = true;
        break __ring_match27;
      }
      if (__ring_m27._tag === "none") {
        const mangled2 = codegen_llvm_ctx$llvm_mangle_fn(name);
        let __ring_blk3;
        __ring_match28: {
          const __ring_m28 = _Map_get(ctx.functions, mangled2);
          if (__ring_m28._tag === "some") {
            __ring_blk3 = true;
            break __ring_match28;
          }
          if (__ring_m28._tag === "none") {
            const mangled3 = codegen_llvm_ctx$llvm_resolve_fn(ctx, name);
            let __ring_blk4;
            __ring_match29: {
              const __ring_m29 = _Map_get(ctx.functions, mangled3);
              if (__ring_m29._tag === "some") {
                __ring_blk4 = true;
                break __ring_match29;
              }
              if (__ring_m29._tag === "none") {
                __ring_blk4 = false;
                break __ring_match29;
              }
              __match_fail(__ring_m29);
            }
            __ring_blk3 = __ring_blk4;
            break __ring_match28;
          }
          __match_fail(__ring_m28);
        }
        __ring_blk2 = __ring_blk3;
        break __ring_match27;
      }
      __match_fail(__ring_m27);
    }
    const is_fn = __ring_blk2;
    if ((is_fn === false)) {
      let __ring_blk5;
      __ring_match30: {
        const __ring_m30 = _Map_get(ctx.named_values, lookup_name);
        if (__ring_m30._tag === "some") {
          __ring_blk5 = true;
          break __ring_match30;
        }
        if (__ring_m30._tag === "none") {
          let __ring_blk6;
          __ring_match31: {
            const __ring_m31 = _Map_get(ctx.named_values, name);
            if (__ring_m31._tag === "some") {
              __ring_blk6 = true;
              break __ring_match31;
            }
            if (__ring_m31._tag === "none") {
              __ring_blk6 = false;
              break __ring_match31;
            }
            __match_fail(__ring_m31);
          }
          __ring_blk5 = __ring_blk6;
          break __ring_match30;
        }
        __match_fail(__ring_m30);
      }
      const is_local = __ring_blk5;
      if (is_local) {
        let already = false;
        const __ring_iter_13 = __List_Iterable.iter(captures);
        while (true) {
          const __ring_next_13 = __ListIterator_Iterator.next(__ring_iter_13);
          if (__ring_next_13._tag === "none") break;
          const c = __ring_next_13._0;
          if (((c === lookup_name) ? true : (c === name))) {
            already = true;
          }
        }
        if ((already === false)) {
          return List_push(captures, lookup_name);
        }
      }
    }
  }
}

function collect_dictref_names(ctx, dr, params, captures) {
  __ring_match32: {
    const __ring_m32 = dr;
    if (__ring_m32._tag === "Simple") {
      const name = __ring_m32._0;
      return consider_capture_name(ctx, name, Option_none, params, captures);
      break __ring_match32;
    }
    if (__ring_m32._tag === "Static") {
      break __ring_match32;
    }
    if (__ring_m32._tag === "Wrapped") {
      const dict = __ring_m32.dict; const inner_dicts = __ring_m32.inner_dicts;
      consider_capture_name(ctx, dict, Option_none, params, captures);
      const __ring_iter_14 = __List_Iterable.iter(inner_dicts);
      while (true) {
        const __ring_next_14 = __ListIterator_Iterator.next(__ring_iter_14);
        if (__ring_next_14._tag === "none") break;
        const inner = __ring_next_14._0;
        collect_dictref_names(ctx, inner, params, captures);
      }
      break __ring_match32;
    }
    __match_fail(__ring_m32);
  }
}

function collect_dispatch_dict(ctx, dispatch, params, captures) {
  __ring_match33: {
    const __ring_m33 = dispatch;
    if (__ring_m33._tag === "some") {
      const d = __ring_m33._0;
      __ring_match34: {
        const __ring_m34 = d;
        if (__ring_m34._tag === "Dict") {
          const param = __ring_m34.param;
          return consider_capture_name(ctx, param, Option_none, params, captures);
          break __ring_match34;
        }
        if (__ring_m34._tag === "Direct") {
          const dict = __ring_m34.dict; const extra_dicts = __ring_m34.extra_dicts;
          consider_capture_name(ctx, dict, Option_none, params, captures);
          const __ring_iter_15 = __List_Iterable.iter(extra_dicts);
          while (true) {
            const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
            if (__ring_next_15._tag === "none") break;
            const ed = __ring_next_15._0;
            collect_dictref_names(ctx, ed, params, captures);
          }
          break __ring_match34;
        }
        if (__ring_m34._tag === "Builtin") {
          break __ring_match34;
        }
        __match_fail(__ring_m34);
      }
      break __ring_match33;
    }
    if (__ring_m33._tag === "none") {
      break __ring_match33;
    }
    __match_fail(__ring_m33);
  }
}

function collect_captures_stmt(ctx, stmt, params, captures) {
  __ring_match35: {
    const __ring_m35 = stmt;
    if (__ring_m35._tag === "Let") {
      const init = __ring_m35.init;
      return collect_captures(ctx, init, params, captures);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Var") {
      const init = __ring_m35.init;
      return collect_captures(ctx, init, params, captures);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Assign") {
      const target = __ring_m35.target; const value = __ring_m35.value;
      collect_captures(ctx, target, params, captures);
      return collect_captures(ctx, value, params, captures);
      break __ring_match35;
    }
    if (__ring_m35._tag === "ExprStmt") {
      const expr = __ring_m35.expr;
      return collect_captures(ctx, expr, params, captures);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Return") {
      const value = __ring_m35.value;
      __ring_match36: {
        const __ring_m36 = value;
        if (__ring_m36._tag === "some") {
          const v = __ring_m36._0;
          return collect_captures(ctx, v, params, captures);
          break __ring_match36;
        }
        if (__ring_m36._tag === "none") {
          break __ring_match36;
        }
        __match_fail(__ring_m36);
      }
      break __ring_match35;
    }
    if (__ring_m35._tag === "While") {
      const condition = __ring_m35.condition; const body = __ring_m35.body;
      collect_captures(ctx, condition, params, captures);
      return collect_captures(ctx, body, params, captures);
      break __ring_match35;
    }
    if (__ring_m35._tag === "ForIn") {
      const iterable = __ring_m35.iterable; const body = __ring_m35.body;
      collect_captures(ctx, iterable, params, captures);
      return collect_captures(ctx, body, params, captures);
      break __ring_match35;
    }
    if (__ring_m35._tag === "LetDestructure") {
      const init = __ring_m35.init;
      return collect_captures(ctx, init, params, captures);
      break __ring_match35;
    }
    if (__ring_m35._tag === "IfLet") {
      const expr = __ring_m35.expr; const then_block = __ring_m35.then_block; const else_block = __ring_m35.else_block;
      collect_captures(ctx, expr, params, captures);
      collect_captures(ctx, then_block, params, captures);
      __ring_match37: {
        const __ring_m37 = else_block;
        if (__ring_m37._tag === "some") {
          const eb = __ring_m37._0;
          return collect_captures(ctx, eb, params, captures);
          break __ring_match37;
        }
        if (__ring_m37._tag === "none") {
          break __ring_match37;
        }
        __match_fail(__ring_m37);
      }
      break __ring_match35;
    }
    if (__ring_m35._tag === "Drop") {
      const name = __ring_m35.name;
      return consider_capture_name(ctx, name, Option_none, params, captures);
      break __ring_match35;
    }
    if (__ring_m35._tag === "Dup") {
      const name = __ring_m35.name;
      return consider_capture_name(ctx, name, Option_none, params, captures);
      break __ring_match35;
    }
    break __ring_match35;
  }
}

function collect_captures(ctx, expr, params, captures) {
  __ring_match38: {
    const __ring_m38 = expr;
    if (__ring_m38._tag === "Ident") {
      const name = __ring_m38.name; const resolved_name = __ring_m38.resolved_name;
      return consider_capture_name(ctx, name, resolved_name, params, captures);
      break __ring_match38;
    }
    if (__ring_m38._tag === "BinOp") {
      const left = __ring_m38.left; const right = __ring_m38.right; const eq_dispatch = __ring_m38.eq_dispatch; const ord_dispatch = __ring_m38.ord_dispatch;
      collect_captures(ctx, left, params, captures);
      collect_captures(ctx, right, params, captures);
      collect_dispatch_dict(ctx, eq_dispatch, params, captures);
      return collect_dispatch_dict(ctx, ord_dispatch, params, captures);
      break __ring_match38;
    }
    if (__ring_m38._tag === "UnaryOp") {
      const operand = __ring_m38.operand;
      return collect_captures(ctx, operand, params, captures);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Call") {
      const callee = __ring_m38.callee; const args = __ring_m38.args; const resolved_dicts = __ring_m38.resolved_dicts; const dict_dispatch = __ring_m38.dict_dispatch;
      collect_captures(ctx, callee, params, captures);
      const __ring_iter_16 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
        if (__ring_next_16._tag === "none") break;
        const a = __ring_next_16._0;
        collect_captures(ctx, a, params, captures);
      }
      const __ring_iter_17 = __List_Iterable.iter(resolved_dicts);
      while (true) {
        const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
        if (__ring_next_17._tag === "none") break;
        const d = __ring_next_17._0;
        collect_dictref_names(ctx, d, params, captures);
      }
      __ring_match39: {
        const __ring_m39 = dict_dispatch;
        if (__ring_m39._tag === "some") {
          const dd = __ring_m39._0;
          return consider_capture_name(ctx, dd.dict_param, Option_none, params, captures);
          break __ring_match39;
        }
        if (__ring_m39._tag === "none") {
          break __ring_match39;
        }
        __match_fail(__ring_m39);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "DictConstruct") {
      const inner = __ring_m38.inner;
      const __ring_iter_18 = __List_Iterable.iter(inner);
      while (true) {
        const __ring_next_18 = __ListIterator_Iterator.next(__ring_iter_18);
        if (__ring_next_18._tag === "none") break;
        const d = __ring_next_18._0;
        collect_dictref_names(ctx, d, params, captures);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "FieldAccess") {
      const receiver = __ring_m38.receiver;
      return collect_captures(ctx, receiver, params, captures);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Block") {
      const stmts = __ring_m38.stmts; const tail = __ring_m38.tail;
      const __ring_iter_19 = __List_Iterable.iter(stmts);
      while (true) {
        const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
        if (__ring_next_19._tag === "none") break;
        const s = __ring_next_19._0;
        collect_captures_stmt(ctx, s, params, captures);
      }
      __ring_match40: {
        const __ring_m40 = tail;
        if (__ring_m40._tag === "some") {
          const t = __ring_m40._0;
          return collect_captures(ctx, t, params, captures);
          break __ring_match40;
        }
        if (__ring_m40._tag === "none") {
          break __ring_match40;
        }
        __match_fail(__ring_m40);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "IfExpr") {
      const condition = __ring_m38.condition; const then_branch = __ring_m38.then_branch; const else_branch = __ring_m38.else_branch;
      collect_captures(ctx, condition, params, captures);
      collect_captures(ctx, then_branch, params, captures);
      __ring_match41: {
        const __ring_m41 = else_branch;
        if (__ring_m41._tag === "some") {
          const eb = __ring_m41._0;
          return collect_captures(ctx, eb, params, captures);
          break __ring_match41;
        }
        if (__ring_m41._tag === "none") {
          break __ring_match41;
        }
        __match_fail(__ring_m41);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "MatchExpr") {
      const scrutinee = __ring_m38.scrutinee; const arms = __ring_m38.arms;
      collect_captures(ctx, scrutinee, params, captures);
      const __ring_iter_20 = __List_Iterable.iter(arms);
      while (true) {
        const __ring_next_20 = __ListIterator_Iterator.next(__ring_iter_20);
        if (__ring_next_20._tag === "none") break;
        const arm = __ring_next_20._0;
        collect_captures(ctx, arm.body, params, captures);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "StringInterp") {
      const parts = __ring_m38.parts;
      const __ring_iter_21 = __List_Iterable.iter(parts);
      while (true) {
        const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
        if (__ring_next_21._tag === "none") break;
        const part = __ring_next_21._0;
        __ring_match42: {
          const __ring_m42 = part;
          if (__ring_m42._tag === "Expression") {
            const e = __ring_m42._0;
            collect_captures(ctx, e, params, captures);
            break __ring_match42;
          }
          break __ring_match42;
        }
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "StructLit") {
      const fields = __ring_m38.fields; const spread = __ring_m38.spread;
      const __ring_iter_22 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_22 = __ListIterator_Iterator.next(__ring_iter_22);
        if (__ring_next_22._tag === "none") break;
        const f = __ring_next_22._0;
        collect_captures(ctx, f.value, params, captures);
      }
      __ring_match43: {
        const __ring_m43 = spread;
        if (__ring_m43._tag === "some") {
          const sp = __ring_m43._0;
          return collect_captures(ctx, sp, params, captures);
          break __ring_match43;
        }
        if (__ring_m43._tag === "none") {
          break __ring_match43;
        }
        __match_fail(__ring_m43);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "ListLit") {
      const elements = __ring_m38.elements;
      const __ring_iter_23 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
        if (__ring_next_23._tag === "none") break;
        const e = __ring_next_23._0;
        collect_captures(ctx, e, params, captures);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "TupleLit") {
      const elements = __ring_m38.elements;
      const __ring_iter_24 = __List_Iterable.iter(elements);
      while (true) {
        const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
        if (__ring_next_24._tag === "none") break;
        const e = __ring_next_24._0;
        collect_captures(ctx, e, params, captures);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "IndexExpr") {
      const receiver = __ring_m38.receiver; const index = __ring_m38.index;
      collect_captures(ctx, receiver, params, captures);
      return collect_captures(ctx, index, params, captures);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Lambda") {
      const lb = __ring_m38.body;
      return collect_captures(ctx, lb, params, captures);
      break __ring_match38;
    }
    if (__ring_m38._tag === "NamedVariantConstruct") {
      const nvc_fields = __ring_m38.fields; const nvc_spread = __ring_m38.spread;
      const __ring_iter_25 = __List_Iterable.iter(nvc_fields);
      while (true) {
        const __ring_next_25 = __ListIterator_Iterator.next(__ring_iter_25);
        if (__ring_next_25._tag === "none") break;
        const f = __ring_next_25._0;
        collect_captures(ctx, f.value, params, captures);
      }
      __ring_match44: {
        const __ring_m44 = nvc_spread;
        if (__ring_m44._tag === "some") {
          const sp = __ring_m44._0;
          return collect_captures(ctx, sp, params, captures);
          break __ring_match44;
        }
        if (__ring_m44._tag === "none") {
          break __ring_match44;
        }
        __match_fail(__ring_m44);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "TryCatch") {
      const tc_body = __ring_m38.body; const tc_arms = __ring_m38.arms;
      collect_captures(ctx, tc_body, params, captures);
      const __ring_iter_26 = __List_Iterable.iter(tc_arms);
      while (true) {
        const __ring_next_26 = __ListIterator_Iterator.next(__ring_iter_26);
        if (__ring_next_26._tag === "none") break;
        const arm = __ring_next_26._0;
        collect_captures(ctx, arm.body, params, captures);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "HandleExpr") {
      const he_body = __ring_m38.body;
      return collect_captures(ctx, he_body, params, captures);
      break __ring_match38;
    }
    if (__ring_m38._tag === "EffectOp") {
      const eo_eff = __ring_m38.effect_name; const eo_args = __ring_m38.args;
      const __ring_iter_27 = __List_Iterable.iter(eo_args);
      while (true) {
        const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
        if (__ring_next_27._tag === "none") break;
        const a = __ring_next_27._0;
        collect_captures(ctx, a, params, captures);
      }
      if ((eo_eff !== "fail")) {
        return consider_capture_name(ctx, hir$evidence_param_name(eo_eff), Option_none, params, captures);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "RangeExpr") {
      const rs = __ring_m38.start; const re = __ring_m38.end;
      collect_captures(ctx, rs, params, captures);
      return collect_captures(ctx, re, params, captures);
      break __ring_match38;
    }
    if (__ring_m38._tag === "Clone") {
      const inner = __ring_m38.inner;
      return collect_captures(ctx, inner, params, captures);
      break __ring_match38;
    }
    if (__ring_m38._tag === "ReturnExpr") {
      const value = __ring_m38.value;
      __ring_match45: {
        const __ring_m45 = value;
        if (__ring_m45._tag === "some") {
          const v = __ring_m45._0;
          return collect_captures(ctx, v, params, captures);
          break __ring_match45;
        }
        if (__ring_m45._tag === "none") {
          break __ring_match45;
        }
        __match_fail(__ring_m45);
      }
      break __ring_match38;
    }
    break __ring_match38;
  }
}

function gen_dup_value(ctx, val) {
  const dup_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_dup", [ctx.ptr_type], ctx.void_type);
  const dup_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_dup");
  discard(LLVMBuildCall2(ctx.builder, dup_ty, dup_fn, [val], ""));
  return val;
}

function emit_wrapped_method_thunk(ctx, mangled, method_fn, method_name, dispatch_arity, inner_count) {
  const thunk_name = `${mangled}__wrapthunk`;
  __ring_match46: {
    const __ring_m46 = _Map_get(ctx.functions, thunk_name);
    if (__ring_m46._tag === "some") {
      const existing = __ring_m46._0;
      return existing;
      break __ring_match46;
    }
    if (__ring_m46._tag === "none") {
      break __ring_match46;
    }
    __match_fail(__ring_m46);
  }
  let thunk_param_types = [ctx.ptr_type];
  const __ring_end28 = dispatch_arity;
  for (let i = 0; i < __ring_end28; i++) {
    List_push(thunk_param_types, ctx.ptr_type);
  }
  const thunk_ty = LLVMFunctionType(ctx.ptr_type, thunk_param_types, 0);
  const thunk_fn = LLVMAddFunction(ctx.module, thunk_name, thunk_ty);
  _Map_insert(ctx.functions, thunk_name, thunk_fn);
  _Map_insert(ctx.fn_types, thunk_name, thunk_ty);
  let env_elem_types = [ctx.i64_type];
  const __ring_end29 = inner_count;
  for (let j = 0; j < __ring_end29; j++) {
    List_push(env_elem_types, ctx.ptr_type);
  }
  const env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0);
  let __ring_blk7;
  __ring_match47: {
    const __ring_m47 = _Map_get(ctx.fn_types, mangled);
    if (__ring_m47._tag === "some") {
      const t = __ring_m47._0;
      __ring_blk7 = t;
      break __ring_match47;
    }
    if (__ring_m47._tag === "none") {
      let mp = [];
      const __ring_end30 = (dispatch_arity + inner_count);
      for (let i = 0; i < __ring_end30; i++) {
        List_push(mp, ctx.ptr_type);
      }
      __ring_blk7 = LLVMFunctionType(ctx.ptr_type, mp, 0);
      break __ring_match47;
    }
    __match_fail(__ring_m47);
  }
  const method_ty = __ring_blk7;
  const saved_block = LLVMGetInsertBlock(ctx.builder);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, thunk_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const env_param = LLVMGetParam(thunk_fn, 0);
  let fwd_args = [];
  const __ring_end31 = dispatch_arity;
  for (let i = 0; i < __ring_end31; i++) {
    List_push(fwd_args, LLVMGetParam(thunk_fn, (i + 1)));
  }
  const __ring_end32 = inner_count;
  for (let j = 0; j < __ring_end32; j++) {
    const s = LLVMBuildStructGEP2(ctx.builder, env_ty, env_param, (j + 1), codegen_llvm_ctx$fresh_name(ctx, "wti"));
    List_push(fwd_args, LLVMBuildLoad2(ctx.builder, ctx.ptr_type, s, codegen_llvm_ctx$fresh_name(ctx, "wtd")));
  }
  const res = LLVMBuildCall2(ctx.builder, method_ty, method_fn, fwd_args, codegen_llvm_ctx$fresh_name(ctx, "wtcall"));
  discard(LLVMBuildRet(ctx.builder, res));
  LLVMPositionBuilderAtEnd(ctx.builder, saved_block);
  return thunk_fn;
}

function gen_str_lit(ctx, value) {
  const global_str = LLVMBuildGlobalStringPtr(ctx.builder, value, codegen_llvm_ctx$fresh_name(ctx, "str"));
  const from_cstr_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type);
  const from_cstr_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_from_cstr");
  return LLVMBuildCall2(ctx.builder, from_cstr_ty, from_cstr_fn, [global_str], codegen_llvm_ctx$fresh_name(ctx, "s"));
}

function get_or_create_dict_global(ctx, name) {
  __ring_match48: {
    const __ring_m48 = _Map_get(ctx.dict_singletons, name);
    if (__ring_m48._tag === "some") {
      const g = __ring_m48._0;
      return g;
      break __ring_match48;
    }
    if (__ring_m48._tag === "none") {
      const g = LLVMAddGlobal(ctx.module, ctx.ptr_type, `__ring_dictg_${name}`);
      LLVMSetInitializer(g, LLVMConstPointerNull(ctx.ptr_type));
      _Map_insert(ctx.dict_singletons, name, g);
      return g;
      break __ring_match48;
    }
    __match_fail(__ring_m48);
  }
}

function wrapped_dict_target_type(dict_name, trait_name) {
  let s = dict_name;
  if (Str_starts_with(s, "__")) {
    s = Str_slice(s, 2, Str_len(s));
  }
  const suffix = `_${trait_name}`;
  if (Str_ends_with(s, suffix)) {
    return Str_slice(s, 0, (Str_len(s) - Str_len(suffix)));
  } else {
    return s;
  }
}

function get_or_create_static_dict_getter(ctx, name) {
  const fname = `ring_dict_init_${name}`;
  __ring_match49: {
    const __ring_m49 = _Map_get(ctx.functions, fname);
    if (__ring_m49._tag === "some") {
      const existing = __ring_m49._0;
      return existing;
      break __ring_match49;
    }
    if (__ring_m49._tag === "none") {
      break __ring_match49;
    }
    __match_fail(__ring_m49);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0);
  const fn_val = LLVMAddFunction(ctx.module, fname, fn_ty);
  _Map_insert(ctx.functions, fname, fn_val);
  _Map_insert(ctx.fn_types, fname, fn_ty);
  const g = get_or_create_dict_global(ctx, name);
  const saved_fn = ctx.current_fn;
  const saved_named = ctx.named_values;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  const build_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "build");
  const done_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "done");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const cached = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "dc"));
  const isnull = LLVMBuildICmp(ctx.builder, 32, cached, LLVMConstPointerNull(ctx.ptr_type), codegen_llvm_ctx$fresh_name(ctx, "dn"));
  discard(LLVMBuildCondBr(ctx.builder, isnull, build_bb, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, build_bb);
  let __ring_blk8;
  __ring_match50: {
    const __ring_m50 = _Map_get(ctx.static_dict_defs, name);
    if (__ring_m50._tag === "some") {
      const def = __ring_m50._0;
      __ring_blk8 = ((List_len(def.inner) > 0) ? Option_some(def) : Option_none);
      break __ring_match50;
    }
    if (__ring_m50._tag === "none") {
      __ring_blk8 = Option_none;
      break __ring_match50;
    }
    __match_fail(__ring_m50);
  }
  const inst_def = __ring_blk8;
  let __ring_blk9;
  __ring_match51: {
    const __ring_m51 = inst_def;
    if (__ring_m51._tag === "some") {
      const def = __ring_m51._0;
      let inner_refs = [];
      const __ring_iter_33 = __List_Iterable.iter(def.inner);
      while (true) {
        const __ring_next_33 = __ListIterator_Iterator.next(__ring_iter_33);
        if (__ring_next_33._tag === "none") break;
        const inn = __ring_next_33._0;
        List_push(inner_refs, hir$DictRef_Static(inn));
      }
      __ring_blk9 = build_wrapped_dict_typed(ctx, def.base_dict, def.trait_name, inner_refs, codegen_llvm_ctx$RING_TYPEID_DICT_STATIC);
      break __ring_match51;
    }
    if (__ring_m51._tag === "none") {
      const name_str = gen_str_lit(ctx, name);
      const bd_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_get_builtin_dict", [ctx.ptr_type], ctx.ptr_type);
      const bd_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_get_builtin_dict");
      __ring_blk9 = LLVMBuildCall2(ctx.builder, bd_ty, bd_fn, [name_str], codegen_llvm_ctx$fresh_name(ctx, "bd"));
      break __ring_match51;
    }
    __match_fail(__ring_m51);
  }
  const value = __ring_blk9;
  discard(LLVMBuildStore(ctx.builder, value, g));
  discard(LLVMBuildBr(ctx.builder, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, done_bb);
  const result = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "dv"));
  discard(LLVMBuildRet(ctx.builder, result));
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
  LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
  return fn_val;
}

function resolve_static_dict_by_name(ctx, name) {
  const init_fn_name = `ring_dict_init_${name}`;
  __ring_match52: {
    const __ring_m52 = _Map_get(ctx.functions, init_fn_name);
    if (__ring_m52._tag === "some") {
      const init_fn = __ring_m52._0;
      let __ring_blk10;
      __ring_match53: {
        const __ring_m53 = _Map_get(ctx.fn_types, init_fn_name);
        if (__ring_m53._tag === "some") {
          const t = __ring_m53._0;
          __ring_blk10 = t;
          break __ring_match53;
        }
        if (__ring_m53._tag === "none") {
          __ring_blk10 = LLVMFunctionType(ctx.ptr_type, [], 0);
          break __ring_match53;
        }
        __match_fail(__ring_m53);
      }
      const init_fn_ty = __ring_blk10;
      return LLVMBuildCall2(ctx.builder, init_fn_ty, init_fn, [], codegen_llvm_ctx$fresh_name(ctx, "dict"));
      break __ring_match52;
    }
    if (__ring_m52._tag === "none") {
      __ring_match54: {
        const __ring_m54 = _Map_get(ctx.dict_globals, name);
        if (__ring_m54._tag === "some") {
          const init_fn = __ring_m54._0;
          const ft = LLVMFunctionType(ctx.ptr_type, [], 0);
          return LLVMBuildCall2(ctx.builder, ft, init_fn, [], codegen_llvm_ctx$fresh_name(ctx, "dict"));
          break __ring_match54;
        }
        if (__ring_m54._tag === "none") {
          const getter = get_or_create_static_dict_getter(ctx, name);
          const ft = LLVMFunctionType(ctx.ptr_type, [], 0);
          return LLVMBuildCall2(ctx.builder, ft, getter, [], codegen_llvm_ctx$fresh_name(ctx, "dict"));
          break __ring_match54;
        }
        __match_fail(__ring_m54);
      }
      break __ring_match52;
    }
    __match_fail(__ring_m52);
  }
}

function resolve_dict_ref(ctx, dr) {
  __ring_match55: {
    const __ring_m55 = dr;
    if (__ring_m55._tag === "Simple") {
      const name = __ring_m55._0;
      __ring_match56: {
        const __ring_m56 = _Map_get(ctx.named_values, name);
        if (__ring_m56._tag === "some") {
          const alloca = __ring_m56._0;
          return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "dict"));
          break __ring_match56;
        }
        if (__ring_m56._tag === "none") {
          return resolve_static_dict_by_name(ctx, name);
          break __ring_match56;
        }
        __match_fail(__ring_m56);
      }
      break __ring_match55;
    }
    if (__ring_m55._tag === "Static") {
      const name = __ring_m55._0;
      return resolve_static_dict_by_name(ctx, name);
      break __ring_match55;
    }
    if (__ring_m55._tag === "Wrapped") {
      const dict = __ring_m55.dict; const trait_name = __ring_m55.trait_name; const inner_dicts = __ring_m55.inner_dicts;
      return build_wrapped_dict(ctx, dict, trait_name, inner_dicts);
      break __ring_match55;
    }
    __match_fail(__ring_m55);
  }
}

function build_wrapped_dict_typed(ctx, dict_name, trait_name, inner_dicts, dict_tid) {
  let inner_vals = [];
  const __ring_iter_34 = __List_Iterable.iter(inner_dicts);
  while (true) {
    const __ring_next_34 = __ListIterator_Iterator.next(__ring_iter_34);
    if (__ring_next_34._tag === "none") break;
    const d = __ring_next_34._0;
    List_push(inner_vals, resolve_dict_ref(ctx, d));
  }
  const target_type = wrapped_dict_target_type(dict_name, trait_name);
  let __ring_blk11;
  __ring_match57: {
    const __ring_m57 = _Map_get(ctx.trait_method_order, trait_name);
    if (__ring_m57._tag === "some") {
      const order = __ring_m57._0;
      __ring_blk11 = order;
      break __ring_match57;
    }
    if (__ring_m57._tag === "none") {
      __ring_blk11 = [];
      break __ring_match57;
    }
    __match_fail(__ring_m57);
  }
  const method_order = __ring_blk11;
  const method_count = List_len(method_order);
  let dict_elem_types = [ctx.i64_type];
  const __ring_end35 = method_count;
  for (let i = 0; i < __ring_end35; i++) {
    List_push(dict_elem_types, ctx.ptr_type);
  }
  const dict_struct_ty = LLVMStructTypeInContext(ctx.context, dict_elem_types, 0);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const dict_size = LLVMSizeOf(dict_struct_ty);
  const dict_typeid = LLVMConstInt(ctx.i64_type, dict_tid, 0);
  const dict_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [dict_size, dict_typeid], codegen_llvm_ctx$fresh_name(ctx, "wdict"));
  const dict_cnt_slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "wdc"));
  discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, method_count, 0), dict_cnt_slot));
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const closure_size = LLVMSizeOf(closure_ty);
  const closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0);
  const inner_count = List_len(inner_vals);
  const __ring_end36 = method_count;
  for (let i = 0; i < __ring_end36; i++) {
    __ring_match58: {
      const __ring_m58 = List_get(method_order, i);
      if (__ring_m58._tag === "some") {
        const method_name = __ring_m58._0;
        const mangled = codegen_llvm_ctx$llvm_mangle_method(target_type, method_name);
        __ring_match59: {
          const __ring_m59 = _Map_get(ctx.functions, mangled);
          if (__ring_m59._tag === "some") {
            const method_fn = __ring_m59._0;
            const base_arity = LLVMCountParams(method_fn);
            const dispatch_arity = (base_arity - inner_count);
            const thunk_fn = emit_wrapped_method_thunk(ctx, mangled, method_fn, method_name, dispatch_arity, inner_count);
            let env_elem_types = [ctx.i64_type];
            const __ring_end37 = inner_count;
            for (let j = 0; j < __ring_end37; j++) {
              List_push(env_elem_types, ctx.ptr_type);
            }
            const env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0);
            const env_size = LLVMSizeOf(env_ty);
            const env_typeid = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, 0);
            const env_alloc = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [env_size, env_typeid], codegen_llvm_ctx$fresh_name(ctx, "wmenv"));
            const cnt_slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, 0, codegen_llvm_ctx$fresh_name(ctx, "wmc"));
            discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, inner_count, 0), cnt_slot));
            let sj = 0;
            const __ring_iter_38 = __List_Iterable.iter(inner_vals);
            while (true) {
              const __ring_next_38 = __ListIterator_Iterator.next(__ring_iter_38);
              if (__ring_next_38._tag === "none") break;
              const iv = __ring_next_38._0;
              discard(gen_dup_value(ctx, iv));
              const s = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, (sj + 1), codegen_llvm_ctx$fresh_name(ctx, "wmi"));
              discard(LLVMBuildStore(ctx.builder, iv, s));
              sj = (sj + 1);
            }
            const closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], codegen_llvm_ctx$fresh_name(ctx, "wmcls"));
            const fp = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "wmfp"));
            discard(LLVMBuildStore(ctx.builder, thunk_fn, fp));
            const ep = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "wmep"));
            discard(LLVMBuildStore(ctx.builder, env_alloc, ep));
            const slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "wmds"));
            discard(LLVMBuildStore(ctx.builder, closure_ptr, slot));
            break __ring_match59;
          }
          if (__ring_m59._tag === "none") {
            const slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "wmds"));
            discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), slot));
            break __ring_match59;
          }
          __match_fail(__ring_m59);
        }
        break __ring_match58;
      }
      if (__ring_m58._tag === "none") {
        break __ring_match58;
      }
      __match_fail(__ring_m58);
    }
  }
  return dict_ptr;
}

function build_wrapped_dict(ctx, dict_name, trait_name, inner_dicts) {
  return build_wrapped_dict_typed(ctx, dict_name, trait_name, inner_dicts, codegen_llvm_ctx$RING_TYPEID_DICT_DYN);
}

function unbox_int(ctx, val) {
  const raw = LLVMBuildPtrToInt(ctx.builder, val, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ui"));
  return LLVMBuildAShr(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "uv"));
}

function gen_bool_binop(ctx, op, lhs, rhs) {
  const lhs_raw = unbox_int(ctx, lhs);
  const rhs_raw = unbox_int(ctx, rhs);
  __ring_match60: {
    const __ring_m60 = op;
    if (__ring_m60._tag === "Eq") {
      const cmp = LLVMBuildICmp(ctx.builder, 32, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "beq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match60;
    }
    if (__ring_m60._tag === "Neq") {
      const cmp = LLVMBuildICmp(ctx.builder, 33, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "bne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match60;
    }
    return panic("LLVM codegen: unsupported bool binop");
    break __ring_match60;
  }
}

function gen_closure_call(ctx, closure_ptr, arg_vals) {
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
  const fn_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, fn_ptr_slot, codegen_llvm_ctx$fresh_name(ctx, "fp"));
  const env_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
  const env_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, env_ptr_slot, codegen_llvm_ctx$fresh_name(ctx, "ep"));
  let call_args = [env_ptr];
  const __ring_iter_39 = __List_Iterable.iter(arg_vals);
  while (true) {
    const __ring_next_39 = __ListIterator_Iterator.next(__ring_iter_39);
    if (__ring_next_39._tag === "none") break;
    const a = __ring_next_39._0;
    List_push(call_args, a);
  }
  let fn_param_types = [ctx.ptr_type];
  const __ring_iter_40 = __List_Iterable.iter(arg_vals);
  while (true) {
    const __ring_next_40 = __ListIterator_Iterator.next(__ring_iter_40);
    if (__ring_next_40._tag === "none") break;
    const a = __ring_next_40._0;
    List_push(fn_param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, fn_param_types, 0);
  return LLVMBuildCall2(ctx.builder, fn_ty, fn_ptr, call_args, codegen_llvm_ctx$fresh_name(ctx, "cc"));
}

function load_dict_method(ctx, dict_ptr, slot) {
  const dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0);
  const slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (slot + 1), codegen_llvm_ctx$fresh_name(ctx, "ms"));
  return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, codegen_llvm_ctx$fresh_name(ctx, "mc"));
}

function resolve_dispatch_dict(ctx, dispatch, trait_name_hint) {
  __ring_match61: {
    const __ring_m61 = dispatch;
    if (__ring_m61._tag === "Dict") {
      const param = __ring_m61.param;
      __ring_match62: {
        const __ring_m62 = _Map_get(ctx.named_values, param);
        if (__ring_m62._tag === "some") {
          const alloca = __ring_m62._0;
          return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "dp"));
          break __ring_match62;
        }
        if (__ring_m62._tag === "none") {
          return LLVMConstPointerNull(ctx.ptr_type);
          break __ring_match62;
        }
        __match_fail(__ring_m62);
      }
      break __ring_match61;
    }
    if (__ring_m61._tag === "Direct") {
      const dict = __ring_m61.dict; const extra_dicts = __ring_m61.extra_dicts;
      if ((List_len(extra_dicts) === 0)) {
        return resolve_dict_ref(ctx, hir$DictRef_Simple(dict));
      } else {
        __ring_match63: {
          const __ring_m63 = trait_name_hint;
          if (__ring_m63._tag === "some") {
            const tn = __ring_m63._0;
            return build_wrapped_dict(ctx, dict, tn, extra_dicts);
            break __ring_match63;
          }
          if (__ring_m63._tag === "none") {
            return resolve_dict_ref(ctx, hir$DictRef_Simple(dict));
            break __ring_match63;
          }
          __match_fail(__ring_m63);
        }
      }
      break __ring_match61;
    }
    if (__ring_m61._tag === "Builtin") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match61;
    }
    __match_fail(__ring_m61);
  }
}

function gen_float_binop(ctx, op, lhs, rhs) {
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
  const lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], codegen_llvm_ctx$fresh_name(ctx, "l"));
  const rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], codegen_llvm_ctx$fresh_name(ctx, "r"));
  __ring_match64: {
    const __ring_m64 = op;
    if (__ring_m64._tag === "Add") {
      const result = LLVMBuildFAdd(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fadd"));
      return box_float(ctx, result);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Sub") {
      const result = LLVMBuildFSub(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fsub"));
      return box_float(ctx, result);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Mul") {
      const result = LLVMBuildFMul(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fmul"));
      return box_float(ctx, result);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Div") {
      const result = LLVMBuildFDiv(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fdiv"));
      return box_float(ctx, result);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Eq") {
      const cmp = LLVMBuildFCmp(ctx.builder, 1, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "feq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Neq") {
      const cmp = LLVMBuildFCmp(ctx.builder, 6, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Lt") {
      const cmp = LLVMBuildFCmp(ctx.builder, 4, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "flt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Lte") {
      const cmp = LLVMBuildFCmp(ctx.builder, 5, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fle"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Gt") {
      const cmp = LLVMBuildFCmp(ctx.builder, 2, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fgt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match64;
    }
    if (__ring_m64._tag === "Gte") {
      const cmp = LLVMBuildFCmp(ctx.builder, 3, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fge"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match64;
    }
    return panic("LLVM codegen: unsupported float binop");
    break __ring_match64;
  }
}

function gen_int_binop(ctx, op, lhs, rhs) {
  const lhs_raw = unbox_int(ctx, lhs);
  const rhs_raw = unbox_int(ctx, rhs);
  __ring_match65: {
    const __ring_m65 = op;
    if (__ring_m65._tag === "Add") {
      const result = LLVMBuildAdd(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "add"));
      return box_int(ctx, result);
      break __ring_match65;
    }
    if (__ring_m65._tag === "Sub") {
      const result = LLVMBuildSub(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "sub"));
      return box_int(ctx, result);
      break __ring_match65;
    }
    if (__ring_m65._tag === "Mul") {
      const result = LLVMBuildMul(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "mul"));
      return box_int(ctx, result);
      break __ring_match65;
    }
    if (__ring_m65._tag === "Div") {
      const result = LLVMBuildSDiv(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "div"));
      return box_int(ctx, result);
      break __ring_match65;
    }
    if (__ring_m65._tag === "Mod") {
      const result = LLVMBuildSRem(ctx.builder, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "mod"));
      return box_int(ctx, result);
      break __ring_match65;
    }
    if (__ring_m65._tag === "Eq") {
      const cmp = LLVMBuildICmp(ctx.builder, 32, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "eq"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match65;
    }
    if (__ring_m65._tag === "Neq") {
      const cmp = LLVMBuildICmp(ctx.builder, 33, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "ne"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match65;
    }
    if (__ring_m65._tag === "Lt") {
      const cmp = LLVMBuildICmp(ctx.builder, 40, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "lt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match65;
    }
    if (__ring_m65._tag === "Lte") {
      const cmp = LLVMBuildICmp(ctx.builder, 41, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "le"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match65;
    }
    if (__ring_m65._tag === "Gt") {
      const cmp = LLVMBuildICmp(ctx.builder, 38, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "gt"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match65;
    }
    if (__ring_m65._tag === "Gte") {
      const cmp = LLVMBuildICmp(ctx.builder, 39, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "ge"));
      const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
      return box_bool(ctx, ext);
      break __ring_match65;
    }
    if (__ring_m65._tag === "And") {
      return panic("LLVM codegen: BinOp::And lowered by andor_lower — unreachable");
      break __ring_match65;
    }
    if (__ring_m65._tag === "Or") {
      return panic("LLVM codegen: BinOp::Or lowered by andor_lower — unreachable");
      break __ring_match65;
    }
    __match_fail(__ring_m65);
  }
}

function gen_str_binop(ctx, op, lhs, rhs) {
  __ring_match66: {
    const __ring_m66 = op;
    if (__ring_m66._tag === "Eq") {
      const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
      const result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "seq"));
      return box_bool(ctx, result);
      break __ring_match66;
    }
    if (__ring_m66._tag === "Neq") {
      const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
      const result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "seq"));
      const one = LLVMConstInt(ctx.i64_type, 1, 0);
      const neg = LLVMBuildSub(ctx.builder, one, result, codegen_llvm_ctx$fresh_name(ctx, "neg"));
      return box_bool(ctx, neg);
      break __ring_match66;
    }
    if (__ring_m66._tag === "Lt") {
      const lt_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_lt", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const lt_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_lt");
      const result = LLVMBuildCall2(ctx.builder, lt_ty, lt_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "slt"));
      return box_bool(ctx, result);
      break __ring_match66;
    }
    if (__ring_m66._tag === "Gt") {
      const lt_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_lt", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const lt_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_lt");
      const result = LLVMBuildCall2(ctx.builder, lt_ty, lt_fn, [rhs, lhs], codegen_llvm_ctx$fresh_name(ctx, "sgt"));
      return box_bool(ctx, result);
      break __ring_match66;
    }
    return panic("LLVM codegen: unsupported str binop");
    break __ring_match66;
  }
}

function is_bool_type(ty) {
  __ring_match67: {
    const __ring_m67 = ty;
    if (__ring_m67._tag === "BoolType") {
      return true;
      break __ring_match67;
    }
    return false;
    break __ring_match67;
  }
}

function is_float_type(ty) {
  __ring_match68: {
    const __ring_m68 = ty;
    if (__ring_m68._tag === "FloatType") {
      return true;
      break __ring_match68;
    }
    return false;
    break __ring_match68;
  }
}

function is_int_type(ty) {
  __ring_match69: {
    const __ring_m69 = ty;
    if (__ring_m69._tag === "IntType") {
      return true;
      break __ring_match69;
    }
    return false;
    break __ring_match69;
  }
}

function is_str_type(ty) {
  __ring_match70: {
    const __ring_m70 = ty;
    if (__ring_m70._tag === "StrType") {
      return true;
      break __ring_match70;
    }
    return false;
    break __ring_match70;
  }
}

function operand_type_from_binop(left) {
  return hir$hexpr_type(left);
}

function gen_bool_lit(ctx, value) {
  const val = (value ? LLVMConstInt(ctx.i64_type, 3, 0) : LLVMConstInt(ctx.i64_type, 1, 0));
  return LLVMBuildIntToPtr(ctx.builder, val, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "bool"));
}

function convert_to_str(ctx, val, ty) {
  if (is_str_type(ty)) {
    return val;
  } else {
    if (is_int_type(ty)) {
      const raw = unbox_int(ctx, val);
      const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.i64_type], ctx.ptr_type);
      const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_int_to_str");
      return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "its"));
    } else {
      if (is_float_type(ty)) {
        const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
        const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
        const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "uf"));
        const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_float_to_str", [ctx.double_type], ctx.ptr_type);
        const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_float_to_str");
        return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "fts"));
      } else {
        if (is_bool_type(ty)) {
          const raw = unbox_int(ctx, val);
          const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_bool_to_str", [ctx.i64_type], ctx.ptr_type);
          const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_bool_to_str");
          return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "bts"));
        } else {
          const raw = unbox_int(ctx, val);
          const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.i64_type], ctx.ptr_type);
          const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_int_to_str");
          return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "ts"));
        }
      }
    }
  }
}

function get_builtin_method_index(method) {
  if ((method === "eq")) {
    return 0;
  } else {
    if ((method === "ne")) {
      return 1;
    } else {
      if ((method === "clone")) {
        return 0;
      } else {
        if ((method === "compare")) {
          return 0;
        } else {
          if ((method === "debug")) {
            return 0;
          } else {
            return 0;
          }
        }
      }
    }
  }
}

function trait_name_from_dict_param(dict_param) {
  const prefix = "__ring_";
  if ((!Str_starts_with(dict_param, prefix))) {
    return Option_none;
  }
  const rest = Str_slice(dict_param, Str_len(prefix), Str_len(dict_param));
  __ring_match71: {
    const __ring_m71 = Str_index_of(rest, "_");
    if (__ring_m71._tag === "some") {
      const us = __ring_m71._0;
      return Option_some(Str_slice(rest, (us + 1), Str_len(rest)));
      break __ring_match71;
    }
    if (__ring_m71._tag === "none") {
      return Option_none;
      break __ring_match71;
    }
    __match_fail(__ring_m71);
  }
}

function get_trait_method_index(ctx, dict_param, method) {
  __ring_match72: {
    const __ring_m72 = trait_name_from_dict_param(dict_param);
    if (__ring_m72._tag === "some") {
      const trait_name = __ring_m72._0;
      __ring_match73: {
        const __ring_m73 = _Map_get(ctx.trait_method_order, trait_name);
        if (__ring_m73._tag === "some") {
          const order = __ring_m73._0;
          let idx = 0;
          const __ring_iter_41 = __List_Iterable.iter(order);
          while (true) {
            const __ring_next_41 = __ListIterator_Iterator.next(__ring_iter_41);
            if (__ring_next_41._tag === "none") break;
            const m = __ring_next_41._0;
            if ((m === method)) {
              return idx;
            }
            idx = (idx + 1);
          }
          return get_builtin_method_index(method);
          break __ring_match73;
        }
        if (__ring_m73._tag === "none") {
          return get_builtin_method_index(method);
          break __ring_match73;
        }
        __match_fail(__ring_m73);
      }
      break __ring_match72;
    }
    if (__ring_m72._tag === "none") {
      return get_builtin_method_index(method);
      break __ring_match72;
    }
    __match_fail(__ring_m72);
  }
}

function extern_fn_to_runtime(name) {
  if ((name === "print")) {
    return Option_some("ring_print");
  } else {
    if ((name === "panic")) {
      return Option_some("ring_panic");
    } else {
      if ((name === "eprintln")) {
        return Option_some("ring_eprintln");
      } else {
        if (((name === "exit") ? true : (name === "exit_process"))) {
          return Option_some("ring_exit");
        } else {
          if ((name === "argv")) {
            return Option_some("ring_args");
          } else {
            if ((name === "string_builder")) {
              return Option_some("ring_sb_new");
            } else {
              if ((name === "map_new")) {
                return Option_some("ring_map_new");
              } else {
                if ((name === "set_new")) {
                  return Option_some("ring_set_new");
                } else {
                  if ((name === "read_file")) {
                    return Option_some("ring_read_file");
                  } else {
                    if ((name === "write_file")) {
                      return Option_some("ring_write_file");
                    } else {
                      if ((name === "file_exists")) {
                        return Option_some("ring_file_exists");
                      } else {
                        if ((name === "delete_file")) {
                          return Option_some("ring_delete_file");
                        } else {
                          if ((name === "path_join")) {
                            return Option_some("ring_path_join");
                          } else {
                            if ((name === "path_resolve")) {
                              return Option_some("ring_path_resolve");
                            } else {
                              if ((name === "path_dirname")) {
                                return Option_some("ring_path_dirname");
                              } else {
                                if ((name === "path_basename")) {
                                  return Option_some("ring_path_basename");
                                } else {
                                  if ((name === "path_extname")) {
                                    return Option_some("ring_path_extname");
                                  } else {
                                    if ((name === "cwd")) {
                                      return Option_some("ring_cwd");
                                    } else {
                                      if ((name === "parse_int")) {
                                        return Option_some("ring_parse_int");
                                      } else {
                                        if ((name === "parse_float")) {
                                          return Option_some("ring_parse_float");
                                        } else {
                                          if ((name === "set_from")) {
                                            return Option_some("ring_set_from_list");
                                          } else {
                                            if ((name === "list_new")) {
                                              return Option_some("ring_list_new");
                                            } else {
                                              if ((name === "map_from")) {
                                                return Option_some("ring_map_from");
                                              } else {
                                                if ((name === "__ring_raise_fail")) {
                                                  return Option_some("__ring_raise_fail");
                                                } else {
                                                  if ((name === "map_int_new")) {
                                                    return Option_some("ring_map_int_new");
                                                  } else {
                                                    if ((name === "set_int_new")) {
                                                      return Option_some("ring_set_int_new");
                                                    } else {
                                                      if ((name === "map_int_from")) {
                                                        return Option_some("ring_map_int_from");
                                                      } else {
                                                        if ((name === "set_int_from")) {
                                                          return Option_some("ring_set_int_from_list");
                                                        } else {
                                                          return Option_none;
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function find_fn_by_prefix_enumeration(ctx, name) {
  let seen_prefixes = set_new();
  let sorted_imports = _Map_entries(ctx.imports_map);
  sorted_imports.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_42 = __List_Iterable.iter(sorted_imports);
  while (true) {
    const __ring_next_42 = __ListIterator_Iterator.next(__ring_iter_42);
    if (__ring_next_42._tag === "none") break;
    const entry = __ring_next_42._0;
    const __ring_dt1 = entry;
    const qualified = __ring_dt1[1];
    const maybe_idx = Str_index_of(qualified, "$$_");
    __ring_match74: {
      const __ring_m74 = maybe_idx;
      if (__ring_m74._tag === "some") {
        const sep_idx = __ring_m74._0;
        const prefix_part = Str_slice(qualified, 0, sep_idx);
        if ((!_Set_contains(seen_prefixes, prefix_part, __Str_Eq))) {
          _Set_insert(seen_prefixes, prefix_part);
          const candidate = `${prefix_part}$$_${name}`;
          const found = _Map_get(ctx.functions, candidate);
          __ring_match75: {
            const __ring_m75 = found;
            if (__ring_m75._tag === "some") {
              const fn_val = __ring_m75._0;
              return Option_some(new FnLookupResult(fn_val, candidate));
              break __ring_match75;
            }
            if (__ring_m75._tag === "none") {
              break __ring_match75;
            }
            __match_fail(__ring_m75);
          }
        }
        break __ring_match74;
      }
      if (__ring_m74._tag === "none") {
        break __ring_match74;
      }
      __match_fail(__ring_m74);
    }
  }
  return Option_none;
}

function find_fn_by_suffix(ctx, name) {
  const suffix = `$$_${name}`;
  let sorted_fns = _Map_entries(ctx.functions);
  sorted_fns.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_43 = __List_Iterable.iter(sorted_fns);
  while (true) {
    const __ring_next_43 = __ListIterator_Iterator.next(__ring_iter_43);
    if (__ring_next_43._tag === "none") break;
    const entry = __ring_next_43._0;
    const __ring_dt2 = entry;
    const fn_name = __ring_dt2[0];
    const fn_val = __ring_dt2[1];
    if (Str_ends_with(fn_name, suffix)) {
      return Option_some(new FnLookupResult(fn_val, fn_name));
    }
  }
  return Option_none;
}

function find_fn_precise(ctx, name) {
  const resolved = codegen_llvm_ctx$llvm_resolve_fn(ctx, name);
  const step1 = _Map_get(ctx.functions, resolved);
  __ring_match76: {
    const __ring_m76 = step1;
    if (__ring_m76._tag === "some") {
      const fn_val = __ring_m76._0;
      return Option_some(new FnLookupResult(fn_val, resolved));
      break __ring_match76;
    }
    if (__ring_m76._tag === "none") {
      break __ring_match76;
    }
    __match_fail(__ring_m76);
  }
  const plain = codegen_llvm_ctx$llvm_mangle_fn(name);
  const step2 = _Map_get(ctx.functions, plain);
  __ring_match77: {
    const __ring_m77 = step2;
    if (__ring_m77._tag === "some") {
      const fn_val = __ring_m77._0;
      return Option_some(new FnLookupResult(fn_val, plain));
      break __ring_match77;
    }
    if (__ring_m77._tag === "none") {
      break __ring_match77;
    }
    __match_fail(__ring_m77);
  }
  const step3 = find_fn_by_prefix_enumeration(ctx, name);
  __ring_match78: {
    const __ring_m78 = step3;
    if (__ring_m78._tag === "some") {
      const result = __ring_m78._0;
      return Option_some(result);
      break __ring_match78;
    }
    if (__ring_m78._tag === "none") {
      break __ring_match78;
    }
    __match_fail(__ring_m78);
  }
  return find_fn_by_suffix(ctx, name);
}

function find_function_in_ctx(ctx, mangled, name) {
  __ring_match79: {
    const __ring_m79 = _Map_get(ctx.functions, mangled);
    if (__ring_m79._tag === "some") {
      const fn_val = __ring_m79._0;
      return Option_some(new FnLookupResult(fn_val, mangled));
      break __ring_match79;
    }
    if (__ring_m79._tag === "none") {
      const bare = codegen_llvm_ctx$llvm_mangle_fn(name);
      __ring_match80: {
        const __ring_m80 = _Map_get(ctx.functions, bare);
        if (__ring_m80._tag === "some") {
          const fn_val = __ring_m80._0;
          return Option_some(new FnLookupResult(fn_val, bare));
          break __ring_match80;
        }
        if (__ring_m80._tag === "none") {
          return find_fn_precise(ctx, name);
          break __ring_match80;
        }
        __match_fail(__ring_m80);
      }
      break __ring_match79;
    }
    __match_fail(__ring_m79);
  }
}

function gen_extern_LLVMAddIncoming(ctx, arg_vals, info) {
  let __ring_blk12;
  __ring_match81: {
    const __ring_m81 = List_get(arg_vals, 0);
    if (__ring_m81._tag === "some") {
      const v = __ring_m81._0;
      __ring_blk12 = v;
      break __ring_match81;
    }
    if (__ring_m81._tag === "none") {
      __ring_blk12 = panic("B-099: AddIncoming missing phi");
      break __ring_match81;
    }
    __match_fail(__ring_m81);
  }
  const phi_val = __ring_blk12;
  let __ring_blk13;
  __ring_match82: {
    const __ring_m82 = List_get(arg_vals, 1);
    if (__ring_m82._tag === "some") {
      const v = __ring_m82._0;
      __ring_blk13 = v;
      break __ring_match82;
    }
    if (__ring_m82._tag === "none") {
      __ring_blk13 = panic("B-099: AddIncoming missing vals");
      break __ring_match82;
    }
    __match_fail(__ring_m82);
  }
  const vals_list = __ring_blk13;
  let __ring_blk14;
  __ring_match83: {
    const __ring_m83 = List_get(arg_vals, 2);
    if (__ring_m83._tag === "some") {
      const v = __ring_m83._0;
      __ring_blk14 = v;
      break __ring_match83;
    }
    if (__ring_m83._tag === "none") {
      __ring_blk14 = panic("B-099: AddIncoming missing blocks");
      break __ring_match83;
    }
    __match_fail(__ring_m83);
  }
  const blocks_list = __ring_blk14;
  const data_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_data", [ctx.ptr_type], ctx.ptr_type);
  const data_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_data");
  const size_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_size_u32", [ctx.ptr_type], ctx.i32_type);
  const size_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_size_u32");
  const vals_data = LLVMBuildCall2(ctx.builder, data_ty, data_fn, [vals_list], codegen_llvm_ctx$fresh_name(ctx, "vdata"));
  const blocks_data = LLVMBuildCall2(ctx.builder, data_ty, data_fn, [blocks_list], codegen_llvm_ctx$fresh_name(ctx, "bdata"));
  const count = LLVMBuildCall2(ctx.builder, size_ty, size_fn, [vals_list], codegen_llvm_ctx$fresh_name(ctx, "cnt"));
  const c_args = [phi_val, vals_data, blocks_data, count];
  LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, "");
  return LLVMConstPointerNull(ctx.ptr_type);
}

function gen_extern_LLVMGetTargetFromTriple(ctx, arg_vals, info) {
  let __ring_blk15;
  __ring_match84: {
    const __ring_m84 = List_get(arg_vals, 0);
    if (__ring_m84._tag === "some") {
      const v = __ring_m84._0;
      __ring_blk15 = v;
      break __ring_match84;
    }
    if (__ring_m84._tag === "none") {
      __ring_blk15 = panic("LLVM codegen B-099: LLVMGetTargetFromTriple missing triple arg");
      break __ring_match84;
    }
    __match_fail(__ring_m84);
  }
  const triple_val = __ring_blk15;
  const cstr_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_to_cstr", [ctx.ptr_type], ctx.ptr_type);
  const cstr_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_to_cstr");
  const triple_cstr = LLVMBuildCall2(ctx.builder, cstr_ty, cstr_fn, [triple_val], codegen_llvm_ctx$fresh_name(ctx, "tcstr"));
  const target_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "target_out"));
  const err_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "err_out"));
  discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), target_alloca));
  discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), err_alloca));
  const c_args = [triple_cstr, target_alloca, err_alloca];
  const result = LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, codegen_llvm_ctx$fresh_name(ctx, "gtt"));
  return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, target_alloca, codegen_llvm_ctx$fresh_name(ctx, "target"));
}

function gen_extern_LLVMRunPasses(ctx, arg_vals, info) {
  let __ring_blk16;
  __ring_match85: {
    const __ring_m85 = List_get(arg_vals, 0);
    if (__ring_m85._tag === "some") {
      const v = __ring_m85._0;
      __ring_blk16 = v;
      break __ring_match85;
    }
    if (__ring_m85._tag === "none") {
      __ring_blk16 = panic("B-099: RP missing module");
      break __ring_match85;
    }
    __match_fail(__ring_m85);
  }
  const m_val = __ring_blk16;
  let __ring_blk17;
  __ring_match86: {
    const __ring_m86 = List_get(arg_vals, 1);
    if (__ring_m86._tag === "some") {
      const v = __ring_m86._0;
      __ring_blk17 = v;
      break __ring_match86;
    }
    if (__ring_m86._tag === "none") {
      __ring_blk17 = panic("B-099: RP missing passes");
      break __ring_match86;
    }
    __match_fail(__ring_m86);
  }
  const passes_val = __ring_blk17;
  let __ring_blk18;
  __ring_match87: {
    const __ring_m87 = List_get(arg_vals, 2);
    if (__ring_m87._tag === "some") {
      const v = __ring_m87._0;
      __ring_blk18 = v;
      break __ring_match87;
    }
    if (__ring_m87._tag === "none") {
      __ring_blk18 = panic("B-099: RP missing tm");
      break __ring_match87;
    }
    __match_fail(__ring_m87);
  }
  const tm_val = __ring_blk18;
  let __ring_blk19;
  __ring_match88: {
    const __ring_m88 = List_get(arg_vals, 3);
    if (__ring_m88._tag === "some") {
      const v = __ring_m88._0;
      __ring_blk19 = v;
      break __ring_match88;
    }
    if (__ring_m88._tag === "none") {
      __ring_blk19 = panic("B-099: RP missing opts");
      break __ring_match88;
    }
    __match_fail(__ring_m88);
  }
  const opts_val = __ring_blk19;
  const cstr_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_to_cstr", [ctx.ptr_type], ctx.ptr_type);
  const cstr_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_to_cstr");
  const passes_cstr = LLVMBuildCall2(ctx.builder, cstr_ty, cstr_fn, [passes_val], codegen_llvm_ctx$fresh_name(ctx, "pcstr"));
  const c_args = [m_val, passes_cstr, tm_val, opts_val];
  const err_ptr = LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, codegen_llvm_ctx$fresh_name(ctx, "rp"));
  const null_ptr = LLVMConstPointerNull(ctx.ptr_type);
  const is_err = LLVMBuildICmp(ctx.builder, 33, err_ptr, null_ptr, codegen_llvm_ctx$fresh_name(ctx, "iserr"));
  const result = LLVMBuildZExt(ctx.builder, is_err, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "rperr"));
  return box_int(ctx, result);
}

function gen_extern_LLVMTargetMachineEmitToFile(ctx, arg_vals, info) {
  let __ring_blk20;
  __ring_match89: {
    const __ring_m89 = List_get(arg_vals, 0);
    if (__ring_m89._tag === "some") {
      const v = __ring_m89._0;
      __ring_blk20 = v;
      break __ring_match89;
    }
    if (__ring_m89._tag === "none") {
      __ring_blk20 = panic("B-099: TMEF missing tm");
      break __ring_match89;
    }
    __match_fail(__ring_m89);
  }
  const tm_val = __ring_blk20;
  let __ring_blk21;
  __ring_match90: {
    const __ring_m90 = List_get(arg_vals, 1);
    if (__ring_m90._tag === "some") {
      const v = __ring_m90._0;
      __ring_blk21 = v;
      break __ring_match90;
    }
    if (__ring_m90._tag === "none") {
      __ring_blk21 = panic("B-099: TMEF missing module");
      break __ring_match90;
    }
    __match_fail(__ring_m90);
  }
  const m_val = __ring_blk21;
  let __ring_blk22;
  __ring_match91: {
    const __ring_m91 = List_get(arg_vals, 2);
    if (__ring_m91._tag === "some") {
      const v = __ring_m91._0;
      __ring_blk22 = v;
      break __ring_match91;
    }
    if (__ring_m91._tag === "none") {
      __ring_blk22 = panic("B-099: TMEF missing filename");
      break __ring_match91;
    }
    __match_fail(__ring_m91);
  }
  const filename_val = __ring_blk22;
  let __ring_blk23;
  __ring_match92: {
    const __ring_m92 = List_get(arg_vals, 3);
    if (__ring_m92._tag === "some") {
      const v = __ring_m92._0;
      __ring_blk23 = v;
      break __ring_match92;
    }
    if (__ring_m92._tag === "none") {
      __ring_blk23 = panic("B-099: TMEF missing filetype");
      break __ring_match92;
    }
    __match_fail(__ring_m92);
  }
  const filetype_val = __ring_blk23;
  const cstr_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_to_cstr", [ctx.ptr_type], ctx.ptr_type);
  const cstr_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_to_cstr");
  const filename_cstr = LLVMBuildCall2(ctx.builder, cstr_ty, cstr_fn, [filename_val], codegen_llvm_ctx$fresh_name(ctx, "fcstr"));
  const filetype_raw = unbox_int(ctx, filetype_val);
  const filetype_i32 = LLVMBuildTrunc(ctx.builder, filetype_raw, ctx.i32_type, codegen_llvm_ctx$fresh_name(ctx, "ft32"));
  const err_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "emit_err"));
  discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), err_alloca));
  const c_args = [tm_val, m_val, filename_cstr, filetype_i32, err_alloca];
  const result = LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, codegen_llvm_ctx$fresh_name(ctx, "emit"));
  const ext = LLVMBuildZExt(ctx.builder, result, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "iext"));
  return box_int(ctx, ext);
}

function gen_extern_LLVMVerifyModule(ctx, arg_vals, info) {
  let __ring_blk24;
  __ring_match93: {
    const __ring_m93 = List_get(arg_vals, 0);
    if (__ring_m93._tag === "some") {
      const v = __ring_m93._0;
      __ring_blk24 = v;
      break __ring_match93;
    }
    if (__ring_m93._tag === "none") {
      __ring_blk24 = panic("B-099: VM missing module");
      break __ring_match93;
    }
    __match_fail(__ring_m93);
  }
  const m_val = __ring_blk24;
  let __ring_blk25;
  __ring_match94: {
    const __ring_m94 = List_get(arg_vals, 1);
    if (__ring_m94._tag === "some") {
      const v = __ring_m94._0;
      __ring_blk25 = v;
      break __ring_match94;
    }
    if (__ring_m94._tag === "none") {
      __ring_blk25 = panic("B-099: VM missing action");
      break __ring_match94;
    }
    __match_fail(__ring_m94);
  }
  const action_val = __ring_blk25;
  const action_raw = unbox_int(ctx, action_val);
  const action_i32 = LLVMBuildTrunc(ctx.builder, action_raw, ctx.i32_type, codegen_llvm_ctx$fresh_name(ctx, "act32"));
  const err_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "verify_err"));
  discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), err_alloca));
  const c_args = [m_val, action_i32, err_alloca];
  const result = LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, codegen_llvm_ctx$fresh_name(ctx, "verify"));
  const ext = LLVMBuildZExt(ctx.builder, result, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "iext"));
  return box_int(ctx, ext);
}

function gen_extern_fn_call(ctx, name, arg_vals, info) {
  if ((info.is_special === "LLVMGetTargetFromTriple")) {
    return gen_extern_LLVMGetTargetFromTriple(ctx, arg_vals, info);
  }
  if ((info.is_special === "LLVMTargetMachineEmitToFile")) {
    return gen_extern_LLVMTargetMachineEmitToFile(ctx, arg_vals, info);
  }
  if ((info.is_special === "LLVMVerifyModule")) {
    return gen_extern_LLVMVerifyModule(ctx, arg_vals, info);
  }
  if ((info.is_special === "LLVMRunPasses")) {
    return gen_extern_LLVMRunPasses(ctx, arg_vals, info);
  }
  if ((info.is_special === "LLVMAddIncoming")) {
    return gen_extern_LLVMAddIncoming(ctx, arg_vals, info);
  }
  let c_args = [];
  let arg_idx = 0;
  const __ring_iter_44 = __List_Iterable.iter(info.param_marshalls);
  while (true) {
    const __ring_next_44 = __ListIterator_Iterator.next(__ring_iter_44);
    if (__ring_next_44._tag === "none") break;
    const marshall = __ring_next_44._0;
    let __ring_blk26;
    __ring_match95: {
      const __ring_m95 = List_get(arg_vals, arg_idx);
      if (__ring_m95._tag === "some") {
        const v = __ring_m95._0;
        __ring_blk26 = v;
        break __ring_match95;
      }
      if (__ring_m95._tag === "none") {
        __ring_blk26 = panic(`LLVM codegen B-099: arg index ${arg_idx} out of bounds for extern fn '${name}'`);
        break __ring_match95;
      }
      __match_fail(__ring_m95);
    }
    const arg_val = __ring_blk26;
    __ring_match96: {
      const __ring_m96 = marshall;
      if (__ring_m96._tag === "PassthroughPtr") {
        List_push(c_args, arg_val);
        break __ring_match96;
      }
      if (__ring_m96._tag === "StrToCstr") {
        const cstr_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_to_cstr", [ctx.ptr_type], ctx.ptr_type);
        const cstr_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_to_cstr");
        const cstr = LLVMBuildCall2(ctx.builder, cstr_ty, cstr_fn, [arg_val], codegen_llvm_ctx$fresh_name(ctx, "cstr"));
        List_push(c_args, cstr);
        break __ring_match96;
      }
      if (__ring_m96._tag === "StrToCstrAndLen") {
        const cstr_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_to_cstr", [ctx.ptr_type], ctx.ptr_type);
        const cstr_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_to_cstr");
        const cstr = LLVMBuildCall2(ctx.builder, cstr_ty, cstr_fn, [arg_val], codegen_llvm_ctx$fresh_name(ctx, "cstr"));
        List_push(c_args, cstr);
        const len_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_len_u32", [ctx.ptr_type], ctx.i32_type);
        const len_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_len_u32");
        const len_val = LLVMBuildCall2(ctx.builder, len_ty, len_fn, [arg_val], codegen_llvm_ctx$fresh_name(ctx, "slen"));
        List_push(c_args, len_val);
        break __ring_match96;
      }
      if (__ring_m96._tag === "IntToI32") {
        const raw = unbox_int(ctx, arg_val);
        const truncated = LLVMBuildTrunc(ctx.builder, raw, ctx.i32_type, codegen_llvm_ctx$fresh_name(ctx, "i32"));
        List_push(c_args, truncated);
        break __ring_match96;
      }
      if (__ring_m96._tag === "IntToI64") {
        const raw = unbox_int(ctx, arg_val);
        List_push(c_args, raw);
        break __ring_match96;
      }
      if (__ring_m96._tag === "FloatToDouble") {
        const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
        const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
        const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [arg_val], codegen_llvm_ctx$fresh_name(ctx, "f64"));
        List_push(c_args, raw);
        break __ring_match96;
      }
      if (__ring_m96._tag === "ListToDataAndCount") {
        const data_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_data", [ctx.ptr_type], ctx.ptr_type);
        const data_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_data");
        const data_ptr = LLVMBuildCall2(ctx.builder, data_ty, data_fn, [arg_val], codegen_llvm_ctx$fresh_name(ctx, "ldata"));
        List_push(c_args, data_ptr);
        const size_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_size_u32", [ctx.ptr_type], ctx.i32_type);
        const size_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_size_u32");
        const size_val = LLVMBuildCall2(ctx.builder, size_ty, size_fn, [arg_val], codegen_llvm_ctx$fresh_name(ctx, "lsize"));
        List_push(c_args, size_val);
        break __ring_match96;
      }
      if (__ring_m96._tag === "ListToDataAndCountI64") {
        const data_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_data", [ctx.ptr_type], ctx.ptr_type);
        const data_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_data");
        const data_ptr = LLVMBuildCall2(ctx.builder, data_ty, data_fn, [arg_val], codegen_llvm_ctx$fresh_name(ctx, "ldata"));
        List_push(c_args, data_ptr);
        const len_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_len", [ctx.ptr_type], ctx.i64_type);
        const len_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_len");
        const len_val = LLVMBuildCall2(ctx.builder, len_ty, len_fn, [arg_val], codegen_llvm_ctx$fresh_name(ctx, "llen"));
        List_push(c_args, len_val);
        break __ring_match96;
      }
      __match_fail(__ring_m96);
    }
    arg_idx = (arg_idx + 1);
  }
  let __ring_blk27;
  __ring_match97: {
    const __ring_m97 = info.ret_marshall;
    if (__ring_m97._tag === "RetVoid") {
      __ring_blk27 = "";
      break __ring_match97;
    }
    __ring_blk27 = codegen_llvm_ctx$fresh_name(ctx, "ext");
    break __ring_match97;
  }
  const call_name = __ring_blk27;
  const c_result = LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, call_name);
  __ring_match98: {
    const __ring_m98 = info.ret_marshall;
    if (__ring_m98._tag === "RetPtr") {
      return c_result;
      break __ring_match98;
    }
    if (__ring_m98._tag === "RetVoid") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match98;
    }
    if (__ring_m98._tag === "RetIntToBoxed") {
      const ext = LLVMBuildZExt(ctx.builder, c_result, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "iext"));
      return box_int(ctx, ext);
      break __ring_match98;
    }
    if (__ring_m98._tag === "RetStrFromCstr") {
      const from_cstr_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type);
      const from_cstr_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_from_cstr");
      return LLVMBuildCall2(ctx.builder, from_cstr_ty, from_cstr_fn, [c_result], codegen_llvm_ctx$fresh_name(ctx, "rstr"));
      break __ring_match98;
    }
    __match_fail(__ring_m98);
  }
}

function is_void_runtime_fn(name) {
  if ((name === "ring_catch_pop")) {
    return true;
  } else {
    if ((name === "ring_raise")) {
      return true;
    } else {
      return false;
    }
  }
}

function gen_runtime_call(ctx, name, args) {
  __ring_match99: {
    const __ring_m99 = _Map_get(ctx.rt_fns, name);
    if (__ring_m99._tag === "some") {
      const fn_val = __ring_m99._0;
      const fn_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, name);
      if (is_void_runtime_fn(name)) {
        LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, "");
        return LLVMConstPointerNull(ctx.ptr_type);
      } else {
        return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, codegen_llvm_ctx$fresh_name(ctx, "rt"));
      }
      break __ring_match99;
    }
    if (__ring_m99._tag === "none") {
      return panic(`LLVM codegen: unknown runtime function '${name}'`);
      break __ring_match99;
    }
    __match_fail(__ring_m99);
  }
}

function lookup_evidence(ctx, ev_param_name) {
  __ring_match100: {
    const __ring_m100 = _Map_get(ctx.named_values, ev_param_name);
    if (__ring_m100._tag === "some") {
      const alloca = __ring_m100._0;
      return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "ev"));
      break __ring_match100;
    }
    if (__ring_m100._tag === "none") {
      const effect_name = Str_slice(ev_param_name, 10, Str_len(ev_param_name));
      __ring_match101: {
        const __ring_m101 = _Map_get(ctx.default_evidence, effect_name);
        if (__ring_m101._tag === "some") {
          const def_ev = __ring_m101._0;
          return def_ev;
          break __ring_match101;
        }
        if (__ring_m101._tag === "none") {
          return LLVMConstPointerNull(ctx.ptr_type);
          break __ring_match101;
        }
        __match_fail(__ring_m101);
      }
      break __ring_match100;
    }
    __match_fail(__ring_m100);
  }
}

function gen_direct_call(ctx, name, arg_vals, dict_vals) {
  const rt_name = extern_fn_to_runtime(name);
  __ring_match102: {
    const __ring_m102 = rt_name;
    if (__ring_m102._tag === "some") {
      const rtn = __ring_m102._0;
      return gen_runtime_call(ctx, rtn, arg_vals);
      break __ring_match102;
    }
    if (__ring_m102._tag === "none") {
      break __ring_match102;
    }
    __match_fail(__ring_m102);
  }
  __ring_match103: {
    const __ring_m103 = _Map_get(ctx.extern_fn_infos, name);
    if (__ring_m103._tag === "some") {
      const info = __ring_m103._0;
      return gen_extern_fn_call(ctx, name, arg_vals, info);
      break __ring_match103;
    }
    if (__ring_m103._tag === "none") {
      break __ring_match103;
    }
    __match_fail(__ring_m103);
  }
  const mangled = codegen_llvm_ctx$llvm_resolve_fn(ctx, name);
  const found_fn = find_function_in_ctx(ctx, mangled, name);
  __ring_match104: {
    const __ring_m104 = found_fn;
    if (__ring_m104._tag === "some") {
      const fn_info = __ring_m104._0;
      const __ring_iter_45 = __List_Iterable.iter(dict_vals);
      while (true) {
        const __ring_next_45 = __ListIterator_Iterator.next(__ring_iter_45);
        if (__ring_next_45._tag === "none") break;
        const dv = __ring_next_45._0;
        List_push(arg_vals, dv);
      }
      __ring_match105: {
        const __ring_m105 = _Map_get(ctx.fn_evidence_params, fn_info.fn_mangled);
        if (__ring_m105._tag === "some") {
          const ev_params = __ring_m105._0;
          const __ring_iter_46 = __List_Iterable.iter(ev_params);
          while (true) {
            const __ring_next_46 = __ListIterator_Iterator.next(__ring_iter_46);
            if (__ring_next_46._tag === "none") break;
            const ep = __ring_next_46._0;
            List_push(arg_vals, lookup_evidence(ctx, ep));
          }
          break __ring_match105;
        }
        if (__ring_m105._tag === "none") {
          break __ring_match105;
        }
        __match_fail(__ring_m105);
      }
      let __ring_blk28;
      __ring_match106: {
        const __ring_m106 = _Map_get(ctx.fn_types, fn_info.fn_mangled);
        if (__ring_m106._tag === "some") {
          const t = __ring_m106._0;
          __ring_blk28 = t;
          break __ring_match106;
        }
        if (__ring_m106._tag === "none") {
          __ring_blk28 = panic(`LLVM codegen: fn type not found for ${fn_info.fn_mangled}`);
          break __ring_match106;
        }
        __match_fail(__ring_m106);
      }
      const fn_ty = __ring_blk28;
      return LLVMBuildCall2(ctx.builder, fn_ty, fn_info.fn_val, arg_vals, codegen_llvm_ctx$fresh_name(ctx, "call"));
      break __ring_match104;
    }
    if (__ring_m104._tag === "none") {
      __ring_match107: {
        const __ring_m107 = _Map_get(ctx.named_values, name);
        if (__ring_m107._tag === "some") {
          const alloca = __ring_m107._0;
          const closure_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "clos"));
          return gen_closure_call(ctx, closure_ptr, arg_vals);
          break __ring_match107;
        }
        if (__ring_m107._tag === "none") {
          const rt_fallback = `ring_${name}`;
          __ring_match108: {
            const __ring_m108 = _Map_get(ctx.rt_fns, rt_fallback);
            if (__ring_m108._tag === "some") {
              return gen_runtime_call(ctx, rt_fallback, arg_vals);
              break __ring_match108;
            }
            if (__ring_m108._tag === "none") {
              break __ring_match108;
            }
            __match_fail(__ring_m108);
          }
          eprintln(`LLVM codegen warning: unknown function '${name}', generating panic`);
          const panic_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_panic", [ctx.ptr_type], ctx.ptr_type);
          const panic_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_panic");
          const msg = LLVMBuildGlobalStringPtr(ctx.builder, `LLVM: missing function '${name}'`, codegen_llvm_ctx$fresh_name(ctx, "panicmsg"));
          const str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type);
          const str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_from_cstr");
          const str_val = LLVMBuildCall2(ctx.builder, str_ty, str_fn, [msg], codegen_llvm_ctx$fresh_name(ctx, "ps"));
          discard(LLVMBuildCall2(ctx.builder, panic_ty, panic_fn, [str_val], ""));
          return LLVMConstPointerNull(ctx.ptr_type);
          break __ring_match107;
        }
        __match_fail(__ring_m107);
      }
      break __ring_match104;
    }
    __match_fail(__ring_m104);
  }
}

function rt_method_int_arg_count(name) {
  if ((name === "ring_list_get")) {
    return 1;
  } else {
    if ((name === "ring_list_get_opt")) {
      return 1;
    } else {
      if ((name === "ring_str_get")) {
        return 1;
      } else {
        if ((name === "ring_str_slice")) {
          return 2;
        } else {
          if ((name === "ring_list_slice")) {
            return 2;
          } else {
            if ((name === "ring_list_set")) {
              return 1;
            } else {
              if ((name === "ring_str_char_at")) {
                return 1;
              } else {
                if ((name === "ring_str_char_code_at")) {
                  return 1;
                } else {
                  if ((name === "ring_str_pad_start")) {
                    return 1;
                  } else {
                    if ((name === "ring_str_pad_end")) {
                      return 1;
                    } else {
                      if ((name === "ring_str_repeat")) {
                        return 1;
                      } else {
                        if ((name === "ring_sb_add_int")) {
                          return 1;
                        } else {
                          return 0;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function ensure_runtime_method(ctx, name, arg_count) {
  __ring_match109: {
    const __ring_m109 = _Map_get(ctx.rt_fns, name);
    if (__ring_m109._tag === "some") {
      const f = __ring_m109._0;
      return f;
      break __ring_match109;
    }
    if (__ring_m109._tag === "none") {
      const ptr = ctx.ptr_type;
      const int_count = rt_method_int_arg_count(name);
      let param_types = [];
      const __ring_end47 = arg_count;
      for (let i = 0; i < __ring_end47; i++) {
        if (((i > 0) ? ((i - 1) < int_count) : false)) {
          List_push(param_types, ctx.i64_type);
        } else {
          List_push(param_types, ptr);
        }
      }
      if (is_void_runtime_fn(name)) {
        return codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, name, param_types, ctx.void_type);
      } else {
        return codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, name, param_types, ptr);
      }
      break __ring_match109;
    }
    __match_fail(__ring_m109);
  }
}

function is_builtin_collection(ty) {
  __ring_match110: {
    const __ring_m110 = ty;
    if (__ring_m110._tag === "StructType") {
      const name = __ring_m110.name; const type_params = __ring_m110.type_params; const fields = __ring_m110.fields;
      if ((name === "List")) {
        if ((List_len(type_params) === 1)) {
          return (List_len(fields) === 0);
        } else {
          return false;
        }
      } else {
        if ((name === "Map")) {
          if ((List_len(type_params) === 2)) {
            return (List_len(fields) === 0);
          } else {
            return false;
          }
        } else {
          if ((name === "Set")) {
            if ((List_len(type_params) === 1)) {
              return (List_len(fields) === 0);
            } else {
              return false;
            }
          } else {
            return false;
          }
        }
      }
      break __ring_match110;
    }
    return false;
    break __ring_match110;
  }
}

function is_int_keyed_map(ty) {
  __ring_match111: {
    const __ring_m111 = ty;
    if (__ring_m111._tag === "StructType") {
      const name = __ring_m111.name; const type_params = __ring_m111.type_params; const fields = __ring_m111.fields;
      if ((((name === "Map") ? (List_len(type_params) === 2) : false) ? (List_len(fields) === 0) : false)) {
        __ring_match112: {
          const __ring_m112 = __ring_index(type_params, 0);
          if (__ring_m112._tag === "IntType") {
            return true;
            break __ring_match112;
          }
          return false;
          break __ring_match112;
        }
      } else {
        return false;
      }
      break __ring_match111;
    }
    return false;
    break __ring_match111;
  }
}

function is_int_set(ty) {
  __ring_match113: {
    const __ring_m113 = ty;
    if (__ring_m113._tag === "StructType") {
      const name = __ring_m113.name; const type_params = __ring_m113.type_params; const fields = __ring_m113.fields;
      if ((((name === "Set") ? (List_len(type_params) === 1) : false) ? (List_len(fields) === 0) : false)) {
        __ring_match114: {
          const __ring_m114 = __ring_index(type_params, 0);
          if (__ring_m114._tag === "IntType") {
            return true;
            break __ring_match114;
          }
          return false;
          break __ring_match114;
        }
      } else {
        return false;
      }
      break __ring_match113;
    }
    return false;
    break __ring_match113;
  }
}

function method_to_runtime(type_name, method) {
  if (((type_name === "Str") ? (method === "len") : false)) {
    return Option_some("ring_str_len");
  } else {
    if (((type_name === "Str") ? (method === "contains") : false)) {
      return Option_some("ring_str_contains");
    } else {
      if (((type_name === "Str") ? (method === "starts_with") : false)) {
        return Option_some("ring_str_starts_with");
      } else {
        if (((type_name === "Str") ? (method === "ends_with") : false)) {
          return Option_some("ring_str_ends_with");
        } else {
          if (((type_name === "Str") ? (method === "slice") : false)) {
            return Option_some("ring_str_slice");
          } else {
            if (((type_name === "Str") ? (method === "split") : false)) {
              return Option_some("ring_str_split");
            } else {
              if (((type_name === "Str") ? (method === "replace") : false)) {
                return Option_some("ring_str_replace");
              } else {
                if (((type_name === "Str") ? (method === "get") : false)) {
                  return Option_some("ring_str_get");
                } else {
                  if (((type_name === "Str") ? (method === "trim") : false)) {
                    return Option_some("ring_str_trim");
                  } else {
                    if (((type_name === "Str") ? (method === "trim_start") : false)) {
                      return Option_some("ring_str_trim_start");
                    } else {
                      if (((type_name === "Str") ? (method === "trim_end") : false)) {
                        return Option_some("ring_str_trim_end");
                      } else {
                        if (((type_name === "Str") ? (method === "to_upper") : false)) {
                          return Option_some("ring_str_to_upper");
                        } else {
                          if (((type_name === "Str") ? (method === "to_lower") : false)) {
                            return Option_some("ring_str_to_lower");
                          } else {
                            if (((type_name === "Str") ? (method === "char_at") : false)) {
                              return Option_some("ring_str_char_at");
                            } else {
                              if (((type_name === "Str") ? (method === "char_code_at") : false)) {
                                return Option_some("ring_str_char_code_at");
                              } else {
                                if (((type_name === "Str") ? (method === "index_of") : false)) {
                                  return Option_some("ring_str_index_of");
                                } else {
                                  if (((type_name === "Str") ? (method === "pad_start") : false)) {
                                    return Option_some("ring_str_pad_start");
                                  } else {
                                    if (((type_name === "Str") ? (method === "pad_end") : false)) {
                                      return Option_some("ring_str_pad_end");
                                    } else {
                                      if (((type_name === "Str") ? (method === "repeat") : false)) {
                                        return Option_some("ring_str_repeat");
                                      } else {
                                        if (((type_name === "Str") ? (method === "is_empty") : false)) {
                                          return Option_some("ring_str_is_empty");
                                        } else {
                                          if (((type_name === "Str") ? (method === "last_index_of") : false)) {
                                            return Option_some("ring_str_last_index_of");
                                          } else {
                                            if (((type_name === "Int") ? (method === "to_str") : false)) {
                                              return Option_some("ring_int_to_str");
                                            } else {
                                              if (((type_name === "Float") ? (method === "to_str") : false)) {
                                                return Option_some("ring_float_to_str");
                                              } else {
                                                if (((type_name === "Bool") ? (method === "to_str") : false)) {
                                                  return Option_some("ring_bool_to_str");
                                                } else {
                                                  if (((type_name === "StringBuilder") ? (method === "add") : false)) {
                                                    return Option_some("ring_sb_add");
                                                  } else {
                                                    if (((type_name === "StringBuilder") ? (method === "to_str") : false)) {
                                                      return Option_some("ring_sb_to_str");
                                                    } else {
                                                      if (((type_name === "StringBuilder") ? (method === "len") : false)) {
                                                        return Option_some("ring_sb_len");
                                                      } else {
                                                        if (((type_name === "StringBuilder") ? (method === "line") : false)) {
                                                          return Option_some("ring_sb_line");
                                                        } else {
                                                          if (((type_name === "StringBuilder") ? (method === "add_int") : false)) {
                                                            return Option_some("ring_sb_add_int");
                                                          } else {
                                                            if (((type_name === "List") ? (method === "push") : false)) {
                                                              return Option_some("ring_list_push");
                                                            } else {
                                                              if (((type_name === "List") ? (method === "len") : false)) {
                                                                return Option_some("ring_list_len");
                                                              } else {
                                                                if (((type_name === "List") ? (method === "get") : false)) {
                                                                  return Option_some("ring_list_get_opt");
                                                                } else {
                                                                  if (((type_name === "List") ? (method === "join") : false)) {
                                                                    return Option_some("ring_list_join");
                                                                  } else {
                                                                    if (((type_name === "List") ? (method === "concat") : false)) {
                                                                      return Option_some("ring_list_concat");
                                                                    } else {
                                                                      if (((type_name === "List") ? (method === "slice") : false)) {
                                                                        return Option_some("ring_list_slice");
                                                                      } else {
                                                                        if (((type_name === "List") ? (method === "reverse") : false)) {
                                                                          return Option_some("ring_list_reverse");
                                                                        } else {
                                                                          if (((type_name === "List") ? (method === "sort_by") : false)) {
                                                                            return Option_some("ring_list_sort");
                                                                          } else {
                                                                            if (((type_name === "List") ? (method === "is_empty") : false)) {
                                                                              return Option_some("ring_list_is_empty");
                                                                            } else {
                                                                              if (((type_name === "List") ? (method === "first") : false)) {
                                                                                return Option_some("ring_list_first");
                                                                              } else {
                                                                                if (((type_name === "List") ? (method === "last") : false)) {
                                                                                  return Option_some("ring_list_last");
                                                                                } else {
                                                                                  if (((type_name === "List") ? (method === "pop") : false)) {
                                                                                    return Option_some("ring_list_pop");
                                                                                  } else {
                                                                                    if (((type_name === "List") ? (method === "set") : false)) {
                                                                                      return Option_some("ring_list_set");
                                                                                    } else {
                                                                                      if (((type_name === "List") ? (method === "map") : false)) {
                                                                                        return Option_some("ring_list_map");
                                                                                      } else {
                                                                                        if (((type_name === "List") ? (method === "filter") : false)) {
                                                                                          return Option_some("ring_list_filter");
                                                                                        } else {
                                                                                          if (((type_name === "List") ? (method === "for_each") : false)) {
                                                                                            return Option_some("ring_list_for_each");
                                                                                          } else {
                                                                                            if (((type_name === "List") ? (method === "any") : false)) {
                                                                                              return Option_some("ring_list_any");
                                                                                            } else {
                                                                                              if (((type_name === "List") ? (method === "all") : false)) {
                                                                                                return Option_some("ring_list_all");
                                                                                              } else {
                                                                                                if (((type_name === "List") ? (method === "find") : false)) {
                                                                                                  return Option_some("ring_list_find");
                                                                                                } else {
                                                                                                  if (((type_name === "List") ? (method === "find_index") : false)) {
                                                                                                    return Option_some("ring_list_find_index");
                                                                                                  } else {
                                                                                                    if (((type_name === "List") ? (method === "fold") : false)) {
                                                                                                      return Option_some("ring_list_fold");
                                                                                                    } else {
                                                                                                      if (((type_name === "List") ? (method === "flat_map") : false)) {
                                                                                                        return Option_some("ring_list_flat_map");
                                                                                                      } else {
                                                                                                        if (((type_name === "List") ? (method === "clear") : false)) {
                                                                                                          return Option_some("ring_list_clear");
                                                                                                        } else {
                                                                                                          if (((type_name === "List") ? (method === "shift") : false)) {
                                                                                                            return Option_some("ring_list_shift");
                                                                                                          } else {
                                                                                                            if (((type_name === "List") ? (method === "extend") : false)) {
                                                                                                              return Option_some("ring_list_extend");
                                                                                                            } else {
                                                                                                              if (((type_name === "Map") ? (method === "get") : false)) {
                                                                                                                return Option_some("ring_map_get_opt");
                                                                                                              } else {
                                                                                                                if (((type_name === "Map") ? (method === "insert") : false)) {
                                                                                                                  return Option_some("ring_map_set");
                                                                                                                } else {
                                                                                                                  if (((type_name === "Map") ? (method === "contains_key") : false)) {
                                                                                                                    return Option_some("ring_map_has");
                                                                                                                  } else {
                                                                                                                    if (((type_name === "Map") ? (method === "keys") : false)) {
                                                                                                                      return Option_some("ring_map_keys");
                                                                                                                    } else {
                                                                                                                      if (((type_name === "Map") ? (method === "values") : false)) {
                                                                                                                        return Option_some("ring_map_values");
                                                                                                                      } else {
                                                                                                                        if (((type_name === "Map") ? (method === "entries") : false)) {
                                                                                                                          return Option_some("ring_map_entries");
                                                                                                                        } else {
                                                                                                                          if (((type_name === "Map") ? (method === "len") : false)) {
                                                                                                                            return Option_some("ring_map_len");
                                                                                                                          } else {
                                                                                                                            if (((type_name === "Map") ? (method === "remove") : false)) {
                                                                                                                              return Option_some("ring_map_delete");
                                                                                                                            } else {
                                                                                                                              if (((type_name === "Map") ? (method === "is_empty") : false)) {
                                                                                                                                return Option_some("ring_map_is_empty");
                                                                                                                              } else {
                                                                                                                                if (((type_name === "Map") ? (method === "for_each") : false)) {
                                                                                                                                  return Option_some("ring_map_for_each");
                                                                                                                                } else {
                                                                                                                                  if (((type_name === "Map") ? (method === "clear") : false)) {
                                                                                                                                    return Option_some("ring_map_clear");
                                                                                                                                  } else {
                                                                                                                                    if (((type_name === "Set") ? (method === "add") : false)) {
                                                                                                                                      return Option_some("ring_set_add");
                                                                                                                                    } else {
                                                                                                                                      if (((type_name === "Set") ? (method === "insert") : false)) {
                                                                                                                                        return Option_some("ring_set_add");
                                                                                                                                      } else {
                                                                                                                                        if (((type_name === "Set") ? (method === "has") : false)) {
                                                                                                                                          return Option_some("ring_set_has");
                                                                                                                                        } else {
                                                                                                                                          if (((type_name === "Set") ? (method === "contains") : false)) {
                                                                                                                                            return Option_some("ring_set_has");
                                                                                                                                          } else {
                                                                                                                                            if (((type_name === "Set") ? (method === "to_list") : false)) {
                                                                                                                                              return Option_some("ring_set_to_list");
                                                                                                                                            } else {
                                                                                                                                              if (((type_name === "Set") ? (method === "len") : false)) {
                                                                                                                                                return Option_some("ring_set_len");
                                                                                                                                              } else {
                                                                                                                                                if (((type_name === "Set") ? (method === "is_empty") : false)) {
                                                                                                                                                  return Option_some("ring_set_is_empty");
                                                                                                                                                } else {
                                                                                                                                                  if (((type_name === "Set") ? (method === "from_list") : false)) {
                                                                                                                                                    return Option_some("ring_set_from_list");
                                                                                                                                                  } else {
                                                                                                                                                    if (((type_name === "Set") ? (method === "for_each") : false)) {
                                                                                                                                                      return Option_some("ring_set_for_each");
                                                                                                                                                    } else {
                                                                                                                                                      if (((type_name === "Set") ? (method === "remove") : false)) {
                                                                                                                                                        return Option_some("ring_set_delete");
                                                                                                                                                      } else {
                                                                                                                                                        if (((type_name === "Set") ? (method === "clear") : false)) {
                                                                                                                                                          return Option_some("ring_set_clear");
                                                                                                                                                        } else {
                                                                                                                                                          if (((type_name === "Set") ? (method === "union") : false)) {
                                                                                                                                                            return Option_some("ring_set_union");
                                                                                                                                                          } else {
                                                                                                                                                            if (((type_name === "Set") ? (method === "intersect") : false)) {
                                                                                                                                                              return Option_some("ring_set_intersect");
                                                                                                                                                            } else {
                                                                                                                                                              if (((type_name === "Set") ? (method === "difference") : false)) {
                                                                                                                                                                return Option_some("ring_set_difference");
                                                                                                                                                              } else {
                                                                                                                                                                if (((type_name === "Option") ? (method === "unwrap_or") : false)) {
                                                                                                                                                                  return Option_some("ring_Option_unwrap_or");
                                                                                                                                                                } else {
                                                                                                                                                                  if (((type_name === "Option") ? (method === "unwrap") : false)) {
                                                                                                                                                                    return Option_some("ring_Option_unwrap");
                                                                                                                                                                  } else {
                                                                                                                                                                    if (((type_name === "Option") ? (method === "is_some") : false)) {
                                                                                                                                                                      return Option_some("ring_Option_is_some");
                                                                                                                                                                    } else {
                                                                                                                                                                      if (((type_name === "Option") ? (method === "is_none") : false)) {
                                                                                                                                                                        return Option_some("ring_Option_is_none");
                                                                                                                                                                      } else {
                                                                                                                                                                        if (((type_name === "Option") ? (method === "map") : false)) {
                                                                                                                                                                          return Option_some("ring_Option_map");
                                                                                                                                                                        } else {
                                                                                                                                                                          if (((type_name === "Option") ? (method === "unwrap_or_else") : false)) {
                                                                                                                                                                            return Option_some("ring_Option_unwrap_or_else");
                                                                                                                                                                          } else {
                                                                                                                                                                            if (((type_name === "Option") ? (method === "to_fail") : false)) {
                                                                                                                                                                              return Option_some("ring_Option_to_fail");
                                                                                                                                                                            } else {
                                                                                                                                                                              return Option_none;
                                                                                                                                                                            }
                                                                                                                                                                          }
                                                                                                                                                                        }
                                                                                                                                                                      }
                                                                                                                                                                    }
                                                                                                                                                                  }
                                                                                                                                                                }
                                                                                                                                                              }
                                                                                                                                                            }
                                                                                                                                                          }
                                                                                                                                                        }
                                                                                                                                                      }
                                                                                                                                                    }
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                              }
                                                                                                                                            }
                                                                                                                                          }
                                                                                                                                        }
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function rt_method_needs_recv_unbox_bool(name) {
  if ((name === "ring_bool_to_str")) {
    return true;
  } else {
    return false;
  }
}

function rt_method_needs_recv_unbox_float(name) {
  if ((name === "ring_float_to_str")) {
    return true;
  } else {
    return false;
  }
}

function rt_method_needs_recv_unbox_int(name) {
  if ((name === "ring_int_to_str")) {
    return true;
  } else {
    return false;
  }
}

function rt_method_returns_bool(name) {
  if ((name === "ring_str_contains")) {
    return true;
  } else {
    if ((name === "ring_str_starts_with")) {
      return true;
    } else {
      if ((name === "ring_str_ends_with")) {
        return true;
      } else {
        if ((name === "ring_list_is_empty")) {
          return true;
        } else {
          if ((name === "ring_map_has")) {
            return true;
          } else {
            if ((name === "ring_set_has")) {
              return true;
            } else {
              if ((name === "ring_list_any")) {
                return true;
              } else {
                if ((name === "ring_list_all")) {
                  return true;
                } else {
                  if ((name === "ring_Option_is_some")) {
                    return true;
                  } else {
                    if ((name === "ring_Option_is_none")) {
                      return true;
                    } else {
                      if ((name === "ring_map_int_has")) {
                        return true;
                      } else {
                        if ((name === "ring_set_int_has")) {
                          return true;
                        } else {
                          if ((name === "ring_map_is_empty")) {
                            return true;
                          } else {
                            if ((name === "ring_set_is_empty")) {
                              return true;
                            } else {
                              if ((name === "ring_map_int_is_empty")) {
                                return true;
                              } else {
                                if ((name === "ring_set_int_is_empty")) {
                                  return true;
                                } else {
                                  if ((name === "ring_str_is_empty")) {
                                    return true;
                                  } else {
                                    return false;
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function rt_method_returns_i64(name) {
  if ((name === "ring_str_len")) {
    return true;
  } else {
    if ((name === "ring_str_contains")) {
      return true;
    } else {
      if ((name === "ring_str_starts_with")) {
        return true;
      } else {
        if ((name === "ring_str_ends_with")) {
          return true;
        } else {
          if ((name === "ring_str_eq")) {
            return true;
          } else {
            if ((name === "ring_str_lt")) {
              return true;
            } else {
              if ((name === "ring_list_len")) {
                return true;
              } else {
                if ((name === "ring_list_is_empty")) {
                  return true;
                } else {
                  if ((name === "ring_map_has")) {
                    return true;
                  } else {
                    if ((name === "ring_map_len")) {
                      return true;
                    } else {
                      if ((name === "ring_set_has")) {
                        return true;
                      } else {
                        if ((name === "ring_set_len")) {
                          return true;
                        } else {
                          if ((name === "ring_sb_len")) {
                            return true;
                          } else {
                            if ((name === "ring_map_int_has")) {
                              return true;
                            } else {
                              if ((name === "ring_map_int_len")) {
                                return true;
                              } else {
                                if ((name === "ring_set_int_has")) {
                                  return true;
                                } else {
                                  if ((name === "ring_set_int_len")) {
                                    return true;
                                  } else {
                                    if ((name === "ring_map_is_empty")) {
                                      return true;
                                    } else {
                                      if ((name === "ring_set_is_empty")) {
                                        return true;
                                      } else {
                                        if ((name === "ring_map_int_is_empty")) {
                                          return true;
                                        } else {
                                          if ((name === "ring_set_int_is_empty")) {
                                            return true;
                                          } else {
                                            return false;
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function gen_method_call(ctx, recv, recv_type, method, args, dict_vals) {
  let __ring_blk29;
  __ring_match115: {
    const __ring_m115 = types$type_to_builtin_name(recv_type);
    if (__ring_m115._tag === "some") {
      const n = __ring_m115._0;
      __ring_blk29 = n;
      break __ring_match115;
    }
    if (__ring_m115._tag === "none") {
      let __ring_blk30;
      __ring_match116: {
        const __ring_m116 = recv_type;
        if (__ring_m116._tag === "StructType") {
          const name = __ring_m116.name;
          __ring_blk30 = name;
          break __ring_match116;
        }
        if (__ring_m116._tag === "EnumType") {
          const name = __ring_m116.name;
          __ring_blk30 = name;
          break __ring_match116;
        }
        __ring_blk30 = "Unknown";
        break __ring_match116;
      }
      __ring_blk29 = __ring_blk30;
      break __ring_match115;
    }
    __match_fail(__ring_m115);
  }
  const type_name = __ring_blk29;
  const rt_method = (((((type_name === "List") ? true : (type_name === "Map")) ? true : (type_name === "Set")) ? (!is_builtin_collection(recv_type)) : false) ? Option_none : method_to_runtime(type_name, method));
  __ring_match117: {
    const __ring_m117 = rt_method;
    if (__ring_m117._tag === "some") {
      const base_rt_name = __ring_m117._0;
      let __ring_blk31;
      __ring_match118: {
        const __ring_m118 = method;
        if (__ring_m118 === "get") {
          __ring_blk31 = "ring_map_int_get_opt";
          break __ring_match118;
        }
        if (__ring_m118 === "insert") {
          __ring_blk31 = "ring_map_int_set";
          break __ring_match118;
        }
        if (__ring_m118 === "contains_key") {
          __ring_blk31 = "ring_map_int_has";
          break __ring_match118;
        }
        if (__ring_m118 === "keys") {
          __ring_blk31 = "ring_map_int_keys";
          break __ring_match118;
        }
        if (__ring_m118 === "values") {
          __ring_blk31 = "ring_map_int_values";
          break __ring_match118;
        }
        if (__ring_m118 === "entries") {
          __ring_blk31 = "ring_map_int_entries";
          break __ring_match118;
        }
        if (__ring_m118 === "len") {
          __ring_blk31 = "ring_map_int_len";
          break __ring_match118;
        }
        if (__ring_m118 === "remove") {
          __ring_blk31 = "ring_map_int_delete";
          break __ring_match118;
        }
        if (__ring_m118 === "for_each") {
          __ring_blk31 = "ring_map_int_for_each";
          break __ring_match118;
        }
        if (__ring_m118 === "clear") {
          __ring_blk31 = "ring_map_int_clear";
          break __ring_match118;
        }
        if (__ring_m118 === "clone") {
          __ring_blk31 = "ring_map_int_clone";
          break __ring_match118;
        }
        if (__ring_m118 === "is_empty") {
          __ring_blk31 = "ring_map_int_is_empty";
          break __ring_match118;
        }
        __ring_blk31 = base_rt_name;
        break __ring_match118;
      }
      let __ring_blk32;
      __ring_match119: {
        const __ring_m119 = method;
        if (__ring_m119 === "add") {
          __ring_blk32 = "ring_set_int_add";
          break __ring_match119;
        }
        if (__ring_m119 === "insert") {
          __ring_blk32 = "ring_set_int_add";
          break __ring_match119;
        }
        if (__ring_m119 === "has") {
          __ring_blk32 = "ring_set_int_has";
          break __ring_match119;
        }
        if (__ring_m119 === "contains") {
          __ring_blk32 = "ring_set_int_has";
          break __ring_match119;
        }
        if (__ring_m119 === "to_list") {
          __ring_blk32 = "ring_set_int_to_list";
          break __ring_match119;
        }
        if (__ring_m119 === "len") {
          __ring_blk32 = "ring_set_int_len";
          break __ring_match119;
        }
        if (__ring_m119 === "from_list") {
          __ring_blk32 = "ring_set_int_from_list";
          break __ring_match119;
        }
        if (__ring_m119 === "for_each") {
          __ring_blk32 = "ring_set_int_for_each";
          break __ring_match119;
        }
        if (__ring_m119 === "remove") {
          __ring_blk32 = "ring_set_int_delete";
          break __ring_match119;
        }
        if (__ring_m119 === "clear") {
          __ring_blk32 = "ring_set_int_clear";
          break __ring_match119;
        }
        if (__ring_m119 === "clone") {
          __ring_blk32 = "ring_set_int_clone";
          break __ring_match119;
        }
        if (__ring_m119 === "is_empty") {
          __ring_blk32 = "ring_set_int_is_empty";
          break __ring_match119;
        }
        if (__ring_m119 === "union") {
          __ring_blk32 = "ring_set_int_union";
          break __ring_match119;
        }
        if (__ring_m119 === "intersect") {
          __ring_blk32 = "ring_set_int_intersect";
          break __ring_match119;
        }
        if (__ring_m119 === "difference") {
          __ring_blk32 = "ring_set_int_difference";
          break __ring_match119;
        }
        __ring_blk32 = base_rt_name;
        break __ring_match119;
      }
      const rt_name = (is_int_keyed_map(recv_type) ? __ring_blk31 : (is_int_set(recv_type) ? __ring_blk32 : base_rt_name));
      let call_args = [];
      if (rt_method_needs_recv_unbox_int(rt_name)) {
        const raw = unbox_int(ctx, recv);
        List_push(call_args, raw);
      } else {
        if (rt_method_needs_recv_unbox_float(rt_name)) {
          const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
          const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
          const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [recv], codegen_llvm_ctx$fresh_name(ctx, "uf"));
          List_push(call_args, raw);
        } else {
          if (rt_method_needs_recv_unbox_bool(rt_name)) {
            const raw = unbox_int(ctx, recv);
            List_push(call_args, raw);
          } else {
            List_push(call_args, recv);
          }
        }
      }
      const int_arg_count = rt_method_int_arg_count(rt_name);
      let ai_idx = 0;
      const __ring_iter_48 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_48 = __ListIterator_Iterator.next(__ring_iter_48);
        if (__ring_next_48._tag === "none") break;
        const a = __ring_next_48._0;
        if ((ai_idx < int_arg_count)) {
          const raw = unbox_int(ctx, a);
          List_push(call_args, raw);
        } else {
          List_push(call_args, a);
        }
        ai_idx = (ai_idx + 1);
      }
      const fn_val = ensure_runtime_method(ctx, rt_name, List_len(call_args));
      const fn_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, rt_name);
      if (is_void_runtime_fn(rt_name)) {
        LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, "");
        return LLVMConstPointerNull(ctx.ptr_type);
      } else {
        if (rt_method_returns_bool(rt_name)) {
          const raw = LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, codegen_llvm_ctx$fresh_name(ctx, "rb"));
          return box_bool(ctx, raw);
        } else {
          if (rt_method_returns_i64(rt_name)) {
            const raw = LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, codegen_llvm_ctx$fresh_name(ctx, "ri"));
            return box_int(ctx, raw);
          } else {
            return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, codegen_llvm_ctx$fresh_name(ctx, "mc"));
          }
        }
      }
      break __ring_match117;
    }
    if (__ring_m117._tag === "none") {
      let call_args = [recv];
      const __ring_iter_49 = __List_Iterable.iter(args);
      while (true) {
        const __ring_next_49 = __ListIterator_Iterator.next(__ring_iter_49);
        if (__ring_next_49._tag === "none") break;
        const a = __ring_next_49._0;
        List_push(call_args, a);
      }
      const mangled = codegen_llvm_ctx$llvm_mangle_method(type_name, method);
      __ring_match120: {
        const __ring_m120 = _Map_get(ctx.functions, mangled);
        if (__ring_m120._tag === "some") {
          const fn_val = __ring_m120._0;
          const __ring_iter_50 = __List_Iterable.iter(dict_vals);
          while (true) {
            const __ring_next_50 = __ListIterator_Iterator.next(__ring_iter_50);
            if (__ring_next_50._tag === "none") break;
            const dv = __ring_next_50._0;
            List_push(call_args, dv);
          }
          __ring_match121: {
            const __ring_m121 = _Map_get(ctx.fn_evidence_params, mangled);
            if (__ring_m121._tag === "some") {
              const ev_params = __ring_m121._0;
              const __ring_iter_51 = __List_Iterable.iter(ev_params);
              while (true) {
                const __ring_next_51 = __ListIterator_Iterator.next(__ring_iter_51);
                if (__ring_next_51._tag === "none") break;
                const ep = __ring_next_51._0;
                List_push(call_args, lookup_evidence(ctx, ep));
              }
              break __ring_match121;
            }
            if (__ring_m121._tag === "none") {
              break __ring_match121;
            }
            __match_fail(__ring_m121);
          }
          let __ring_blk33;
          __ring_match122: {
            const __ring_m122 = _Map_get(ctx.fn_types, mangled);
            if (__ring_m122._tag === "some") {
              const t = __ring_m122._0;
              __ring_blk33 = t;
              break __ring_match122;
            }
            if (__ring_m122._tag === "none") {
              __ring_blk33 = panic(`LLVM codegen: fn type not found for method ${mangled}`);
              break __ring_match122;
            }
            __match_fail(__ring_m122);
          }
          const fn_ty = __ring_blk33;
          return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, codegen_llvm_ctx$fresh_name(ctx, "mc"));
          break __ring_match120;
        }
        if (__ring_m120._tag === "none") {
          eprintln(`LLVM codegen warning: unknown method '${type_name}.${method}' (mangled: ${mangled}), generating panic`);
          const panic_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_panic", [ctx.ptr_type], ctx.ptr_type);
          const panic_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_panic");
          const msg = LLVMBuildGlobalStringPtr(ctx.builder, `LLVM: missing method '${type_name}.${method}'`, codegen_llvm_ctx$fresh_name(ctx, "panicmsg"));
          const str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type);
          const str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_from_cstr");
          const str_val = LLVMBuildCall2(ctx.builder, str_ty, str_fn, [msg], codegen_llvm_ctx$fresh_name(ctx, "ps"));
          discard(LLVMBuildCall2(ctx.builder, panic_ty, panic_fn, [str_val], ""));
          return LLVMConstPointerNull(ctx.ptr_type);
          break __ring_match120;
        }
        __match_fail(__ring_m120);
      }
      break __ring_match117;
    }
    __match_fail(__ring_m117);
  }
}

function is_boxed_def(ctx, def_id) {
  __ring_match123: {
    const __ring_m123 = def_id;
    if (__ring_m123._tag === "some") {
      const did = __ring_m123._0;
      return _Set_contains(ctx.boxed_vars, did, __Int_Eq);
      break __ring_match123;
    }
    if (__ring_m123._tag === "none") {
      return false;
      break __ring_match123;
    }
    __match_fail(__ring_m123);
  }
}

function is_unit_type(ty) {
  __ring_match124: {
    const __ring_m124 = ty;
    if (__ring_m124._tag === "UnitType") {
      return true;
      break __ring_match124;
    }
    return false;
    break __ring_match124;
  }
}

function lookup_call_mut_flags(ctx, callee) {
  __ring_match125: {
    const __ring_m125 = callee;
    if (__ring_m125._tag === "Ident") {
      const name = __ring_m125.name; const resolved_name = __ring_m125.resolved_name;
      let __ring_blk34;
      __ring_match126: {
        const __ring_m126 = resolved_name;
        if (__ring_m126._tag === "some") {
          const rn = __ring_m126._0;
          __ring_blk34 = rn;
          break __ring_match126;
        }
        if (__ring_m126._tag === "none") {
          __ring_blk34 = name;
          break __ring_match126;
        }
        __match_fail(__ring_m126);
      }
      const call_name = __ring_blk34;
      return _Map_get(ctx.fn_mut_params, call_name);
      break __ring_match125;
    }
    if (__ring_m125._tag === "FieldAccess") {
      const receiver = __ring_m125.receiver; const field = __ring_m125.field;
      const recv_type = hir$hexpr_type(receiver);
      let __ring_blk35;
      __ring_match127: {
        const __ring_m127 = types$type_to_builtin_name(recv_type);
        if (__ring_m127._tag === "some") {
          const n = __ring_m127._0;
          __ring_blk35 = n;
          break __ring_match127;
        }
        if (__ring_m127._tag === "none") {
          let __ring_blk36;
          __ring_match128: {
            const __ring_m128 = recv_type;
            if (__ring_m128._tag === "StructType") {
              const name = __ring_m128.name;
              __ring_blk36 = name;
              break __ring_match128;
            }
            if (__ring_m128._tag === "EnumType") {
              const name = __ring_m128.name;
              __ring_blk36 = name;
              break __ring_match128;
            }
            __ring_blk36 = "";
            break __ring_match128;
          }
          __ring_blk35 = __ring_blk36;
          break __ring_match127;
        }
        __match_fail(__ring_m127);
      }
      const type_name = __ring_blk35;
      if ((type_name === "")) {
        return Option_none;
      } else {
        const ufcs_name = `${type_name}_${field}`;
        __ring_match129: {
          const __ring_m129 = _Map_get(ctx.fn_mut_params, ufcs_name);
          if (__ring_m129._tag === "some") {
            const flags = __ring_m129._0;
            let shifted = [];
            let i = 1;
            while ((i < List_len(flags))) {
              __ring_match130: {
                const __ring_m130 = List_get(flags, i);
                if (__ring_m130._tag === "some") {
                  const f = __ring_m130._0;
                  List_push(shifted, f);
                  break __ring_match130;
                }
                if (__ring_m130._tag === "none") {
                  break __ring_match130;
                }
                __match_fail(__ring_m130);
              }
              i = (i + 1);
            }
            return Option_some(shifted);
            break __ring_match129;
          }
          if (__ring_m129._tag === "none") {
            return Option_none;
            break __ring_match129;
          }
          __match_fail(__ring_m129);
        }
      }
      break __ring_match125;
    }
    return Option_none;
    break __ring_match125;
  }
}

function resolve_dict_refs(ctx, dicts) {
  let result = [];
  const __ring_iter_52 = __List_Iterable.iter(dicts);
  while (true) {
    const __ring_next_52 = __ListIterator_Iterator.next(__ring_iter_52);
    if (__ring_next_52._tag === "none") break;
    const d = __ring_next_52._0;
    List_push(result, resolve_dict_ref(ctx, d));
  }
  return result;
}

function gen_float_lit(ctx, value) {
  const raw = LLVMConstReal(ctx.double_type, value);
  const box_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_box_float", [ctx.double_type], ctx.ptr_type);
  const box_fn_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_box_float");
  return LLVMBuildCall2(ctx.builder, box_fn_ty, box_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "flt"));
}

function emit_evidence_drops(ctx, ev_allocas) {
  if ((List_len(ev_allocas) > 0)) {
    const drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
    const drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
    const __ring_iter_53 = __List_Iterable.iter(ev_allocas);
    while (true) {
      const __ring_next_53 = __ListIterator_Iterator.next(__ring_iter_53);
      if (__ring_next_53._tag === "none") break;
      const alloca = __ring_next_53._0;
      const ev_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "ev_drop"));
      discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [ev_ptr], ""));
    }
  }
}

function get_or_declare_frameaddress(ctx) {
  const name = "llvm.frameaddress.p0";
  __ring_match131: {
    const __ring_m131 = _Map_get(ctx.rt_fns, name);
    if (__ring_m131._tag === "some") {
      const f = __ring_m131._0;
      __ring_match132: {
        const __ring_m132 = _Map_get(ctx.rt_fn_types, name);
        if (__ring_m132._tag === "some") {
          const t = __ring_m132._0;
          return [f, t];
          break __ring_match132;
        }
        if (__ring_m132._tag === "none") {
          return panic("LLVM codegen: llvm.frameaddress.p0 type not found");
          break __ring_match132;
        }
        __match_fail(__ring_m132);
      }
      break __ring_match131;
    }
    if (__ring_m131._tag === "none") {
      const fn_ty = LLVMFunctionType(ctx.ptr_type, [ctx.i32_type], 0);
      const fn_val = LLVMAddFunction(ctx.module, name, fn_ty);
      _Map_insert(ctx.rt_fns, name, fn_val);
      _Map_insert(ctx.rt_fn_types, name, fn_ty);
      return [fn_val, fn_ty];
      break __ring_match131;
    }
    __match_fail(__ring_m131);
  }
}

function get_or_declare_setjmp(ctx) {
  const name = "_setjmp";
  __ring_match133: {
    const __ring_m133 = _Map_get(ctx.rt_fns, name);
    if (__ring_m133._tag === "some") {
      const f = __ring_m133._0;
      __ring_match134: {
        const __ring_m134 = _Map_get(ctx.rt_fn_types, name);
        if (__ring_m134._tag === "some") {
          const t = __ring_m134._0;
          return [f, t];
          break __ring_match134;
        }
        if (__ring_m134._tag === "none") {
          return panic("LLVM codegen: _setjmp type not found");
          break __ring_match134;
        }
        __match_fail(__ring_m134);
      }
      break __ring_match133;
    }
    if (__ring_m133._tag === "none") {
      const fn_ty = LLVMFunctionType(ctx.i32_type, [ctx.ptr_type, ctx.ptr_type], 0);
      const fn_val = LLVMAddFunction(ctx.module, name, fn_ty);
      const rt_kind = LLVMGetEnumAttributeKindForName("returns_twice", 13);
      if ((rt_kind > 0)) {
        const rt_attr = LLVMCreateEnumAttribute(ctx.context, rt_kind, 0);
        LLVMAddAttributeAtIndex(fn_val, (0 - 1), rt_attr);
      }
      _Map_insert(ctx.rt_fns, name, fn_val);
      _Map_insert(ctx.rt_fn_types, name, fn_ty);
      return [fn_val, fn_ty];
      break __ring_match133;
    }
    __match_fail(__ring_m133);
  }
}

function call_zero_arg_or_return(ctx, fn_val, mangled) {
  __ring_match135: {
    const __ring_m135 = _Map_get(ctx.fn_types, mangled);
    if (__ring_m135._tag === "some") {
      const fn_ty = __ring_m135._0;
      const param_count = LLVMCountParams(fn_val);
      if ((param_count === 0)) {
        return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, [], codegen_llvm_ctx$fresh_name(ctx, "ctor"));
      } else {
        return fn_val;
      }
      break __ring_match135;
    }
    if (__ring_m135._tag === "none") {
      return fn_val;
      break __ring_match135;
    }
    __match_fail(__ring_m135);
  }
}

function gen_dict_closure_wrapper(ctx, lookup_name, name, dict_names, ty) {
  const mangled = codegen_llvm_ctx$llvm_resolve_fn(ctx, lookup_name);
  const found = find_function_in_ctx(ctx, mangled, name);
  let __ring_blk37;
  __ring_match136: {
    const __ring_m136 = found;
    if (__ring_m136._tag === "some") {
      const fi = __ring_m136._0;
      __ring_blk37 = fi;
      break __ring_match136;
    }
    if (__ring_m136._tag === "none") {
      __ring_blk37 = panic(`LLVM codegen: dict-closure wrapper: function '${name}' not found`);
      break __ring_match136;
    }
    __match_fail(__ring_m136);
  }
  const fn_info = __ring_blk37;
  const real_fn = fn_info.fn_val;
  let __ring_blk38;
  __ring_match137: {
    const __ring_m137 = _Map_get(ctx.fn_types, fn_info.fn_mangled);
    if (__ring_m137._tag === "some") {
      const t = __ring_m137._0;
      __ring_blk38 = t;
      break __ring_match137;
    }
    if (__ring_m137._tag === "none") {
      __ring_blk38 = panic(`LLVM codegen: dict-closure wrapper: fn type not found for ${fn_info.fn_mangled}`);
      break __ring_match137;
    }
    __match_fail(__ring_m137);
  }
  const real_fn_ty = __ring_blk38;
  let __ring_blk39;
  __ring_match138: {
    const __ring_m138 = ty;
    if (__ring_m138._tag === "FnType") {
      const params = __ring_m138.params;
      __ring_blk39 = List_len(params);
      break __ring_match138;
    }
    __ring_blk39 = 0;
    break __ring_match138;
  }
  const param_count = __ring_blk39;
  let dict_vals = [];
  const __ring_iter_54 = __List_Iterable.iter(dict_names);
  while (true) {
    const __ring_next_54 = __ListIterator_Iterator.next(__ring_iter_54);
    if (__ring_next_54._tag === "none") break;
    const dn = __ring_next_54._0;
    List_push(dict_vals, resolve_dict_ref(ctx, hir$DictRef_Simple(dn)));
  }
  let ev_vals = [];
  __ring_match139: {
    const __ring_m139 = _Map_get(ctx.fn_evidence_params, fn_info.fn_mangled);
    if (__ring_m139._tag === "some") {
      const ev_params = __ring_m139._0;
      const __ring_iter_55 = __List_Iterable.iter(ev_params);
      while (true) {
        const __ring_next_55 = __ListIterator_Iterator.next(__ring_iter_55);
        if (__ring_next_55._tag === "none") break;
        const ep = __ring_next_55._0;
        List_push(ev_vals, lookup_evidence(ctx, ep));
      }
      break __ring_match139;
    }
    if (__ring_m139._tag === "none") {
      break __ring_match139;
    }
    __match_fail(__ring_m139);
  }
  const captured_count = (List_len(dict_vals) + List_len(ev_vals));
  let env_elem_types = [ctx.i64_type];
  const __ring_end56 = captured_count;
  for (let i = 0; i < __ring_end56; i++) {
    List_push(env_elem_types, ctx.ptr_type);
  }
  const env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0);
  const thunk_name = codegen_llvm_ctx$fresh_name(ctx, "ring_dictwrap_");
  let thunk_param_types = [ctx.ptr_type];
  const __ring_end57 = param_count;
  for (let i = 0; i < __ring_end57; i++) {
    List_push(thunk_param_types, ctx.ptr_type);
  }
  const thunk_ty = LLVMFunctionType(ctx.ptr_type, thunk_param_types, 0);
  const thunk_fn = LLVMAddFunction(ctx.module, thunk_name, thunk_ty);
  const saved_fn = ctx.current_fn;
  const saved_named = ctx.named_values;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(thunk_fn);
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, thunk_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const env_param = LLVMGetParam(thunk_fn, 0);
  let call_args = [];
  const __ring_end58 = param_count;
  for (let i = 0; i < __ring_end58; i++) {
    List_push(call_args, LLVMGetParam(thunk_fn, (i + 1)));
  }
  const __ring_end59 = captured_count;
  for (let i = 0; i < __ring_end59; i++) {
    const slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_param, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ws"));
    List_push(call_args, LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot, codegen_llvm_ctx$fresh_name(ctx, "wd")));
  }
  const ret = LLVMBuildCall2(ctx.builder, real_fn_ty, real_fn, call_args, codegen_llvm_ctx$fresh_name(ctx, "wcall"));
  discard(LLVMBuildRet(ctx.builder, ret));
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
  LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const env_size = LLVMSizeOf(env_ty);
  const env_typeid = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, 0);
  const env_alloc = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [env_size, env_typeid], codegen_llvm_ctx$fresh_name(ctx, "wenv"));
  const count_slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, 0, codegen_llvm_ctx$fresh_name(ctx, "wcnt"));
  discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, List_len(dict_vals), 0), count_slot));
  let slot_idx = 0;
  const __ring_iter_60 = __List_Iterable.iter(dict_vals);
  while (true) {
    const __ring_next_60 = __ListIterator_Iterator.next(__ring_iter_60);
    if (__ring_next_60._tag === "none") break;
    const dv = __ring_next_60._0;
    discard(gen_dup_value(ctx, dv));
    const slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, (slot_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "wstore"));
    discard(LLVMBuildStore(ctx.builder, dv, slot));
    slot_idx = (slot_idx + 1);
  }
  const __ring_iter_61 = __List_Iterable.iter(ev_vals);
  while (true) {
    const __ring_next_61 = __ListIterator_Iterator.next(__ring_iter_61);
    if (__ring_next_61._tag === "none") break;
    const ev = __ring_next_61._0;
    const slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, (slot_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "wstore"));
    discard(LLVMBuildStore(ctx.builder, ev, slot));
    slot_idx = (slot_idx + 1);
  }
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const closure_size = LLVMSizeOf(closure_ty);
  const closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0);
  const closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], codegen_llvm_ctx$fresh_name(ctx, "wcls"));
  const fp_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "wfp"));
  discard(LLVMBuildStore(ctx.builder, thunk_fn, fp_slot));
  const ep_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "wep"));
  discard(LLVMBuildStore(ctx.builder, env_alloc, ep_slot));
  return closure_ptr;
}

function gen_ident(ctx, name, resolved_name, def_id, dict_closure_dicts, ty) {
  __ring_match140: {
    const __ring_m140 = dict_closure_dicts;
    if (__ring_m140._tag === "some") {
      const dicts = __ring_m140._0;
      if ((List_len(dicts) > 0)) {
        let __ring_blk40;
        __ring_match141: {
          const __ring_m141 = resolved_name;
          if (__ring_m141._tag === "some") {
            const rn = __ring_m141._0;
            __ring_blk40 = rn;
            break __ring_match141;
          }
          if (__ring_m141._tag === "none") {
            __ring_blk40 = name;
            break __ring_match141;
          }
          __match_fail(__ring_m141);
        }
        const lk = __ring_blk40;
        return gen_dict_closure_wrapper(ctx, lk, name, dicts, ty);
      }
      break __ring_match140;
    }
    if (__ring_m140._tag === "none") {
      break __ring_match140;
    }
    __match_fail(__ring_m140);
  }
  let __ring_blk41;
  __ring_match142: {
    const __ring_m142 = resolved_name;
    if (__ring_m142._tag === "some") {
      const rn = __ring_m142._0;
      __ring_blk41 = rn;
      break __ring_match142;
    }
    if (__ring_m142._tag === "none") {
      __ring_blk41 = name;
      break __ring_match142;
    }
    __match_fail(__ring_m142);
  }
  const lookup_name = __ring_blk41;
  const boxed = is_boxed_def(ctx, def_id);
  __ring_match143: {
    const __ring_m143 = _Map_get(ctx.named_values, lookup_name);
    if (__ring_m143._tag === "some") {
      const alloca = __ring_m143._0;
      const cur = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, lookup_name));
      if (boxed) {
        return build_cell_load(ctx, cur, lookup_name);
      } else {
        return cur;
      }
      break __ring_match143;
    }
    if (__ring_m143._tag === "none") {
      __ring_match144: {
        const __ring_m144 = _Map_get(ctx.named_values, name);
        if (__ring_m144._tag === "some") {
          const alloca = __ring_m144._0;
          const cur = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, name));
          if (boxed) {
            return build_cell_load(ctx, cur, name);
          } else {
            return cur;
          }
          break __ring_match144;
        }
        if (__ring_m144._tag === "none") {
          __ring_match145: {
            const __ring_m145 = ty;
            if (__ring_m145._tag === "FnType") {
              return gen_dict_closure_wrapper(ctx, lookup_name, name, [], ty);
              break __ring_match145;
            }
            break __ring_match145;
          }
          const mangled_resolved = codegen_llvm_ctx$llvm_resolve_fn(ctx, lookup_name);
          __ring_match146: {
            const __ring_m146 = _Map_get(ctx.functions, mangled_resolved);
            if (__ring_m146._tag === "some") {
              const fn_val = __ring_m146._0;
              return call_zero_arg_or_return(ctx, fn_val, mangled_resolved);
              break __ring_match146;
            }
            if (__ring_m146._tag === "none") {
              const mangled_bare = codegen_llvm_ctx$llvm_mangle_fn(name);
              __ring_match147: {
                const __ring_m147 = _Map_get(ctx.functions, mangled_bare);
                if (__ring_m147._tag === "some") {
                  const fn_val = __ring_m147._0;
                  return call_zero_arg_or_return(ctx, fn_val, mangled_bare);
                  break __ring_match147;
                }
                if (__ring_m147._tag === "none") {
                  const mangled_name_resolved = codegen_llvm_ctx$llvm_resolve_fn(ctx, name);
                  __ring_match148: {
                    const __ring_m148 = _Map_get(ctx.functions, mangled_name_resolved);
                    if (__ring_m148._tag === "some") {
                      const fn_val = __ring_m148._0;
                      return call_zero_arg_or_return(ctx, fn_val, mangled_name_resolved);
                      break __ring_match148;
                    }
                    if (__ring_m148._tag === "none") {
                      const mangled_lu = codegen_llvm_ctx$llvm_mangle_fn(lookup_name);
                      __ring_match149: {
                        const __ring_m149 = _Map_get(ctx.functions, mangled_lu);
                        if (__ring_m149._tag === "some") {
                          const fn_val = __ring_m149._0;
                          return call_zero_arg_or_return(ctx, fn_val, mangled_lu);
                          break __ring_match149;
                        }
                        if (__ring_m149._tag === "none") {
                          const found = find_fn_precise(ctx, name);
                          __ring_match150: {
                            const __ring_m150 = found;
                            if (__ring_m150._tag === "some") {
                              const fi = __ring_m150._0;
                              return call_zero_arg_or_return(ctx, fi.fn_val, fi.fn_mangled);
                              break __ring_match150;
                            }
                            if (__ring_m150._tag === "none") {
                              const found2 = find_fn_precise(ctx, lookup_name);
                              __ring_match151: {
                                const __ring_m151 = found2;
                                if (__ring_m151._tag === "some") {
                                  const fi2 = __ring_m151._0;
                                  return call_zero_arg_or_return(ctx, fi2.fn_val, fi2.fn_mangled);
                                  break __ring_match151;
                                }
                                if (__ring_m151._tag === "none") {
                                  return panic(`LLVM codegen: undefined variable '${name}' (resolved: '${lookup_name}')`);
                                  break __ring_match151;
                                }
                                __match_fail(__ring_m151);
                              }
                              break __ring_match150;
                            }
                            __match_fail(__ring_m150);
                          }
                          break __ring_match149;
                        }
                        __match_fail(__ring_m149);
                      }
                      break __ring_match148;
                    }
                    __match_fail(__ring_m148);
                  }
                  break __ring_match147;
                }
                __match_fail(__ring_m147);
              }
              break __ring_match146;
            }
            __match_fail(__ring_m146);
          }
          break __ring_match144;
        }
        __match_fail(__ring_m144);
      }
      break __ring_match143;
    }
    __match_fail(__ring_m143);
  }
}

function unbox_to_i1(ctx, val) {
  const raw = LLVMBuildPtrToInt(ctx.builder, val, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ub"));
  const shifted = LLVMBuildAShr(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "sh"));
  return LLVMBuildTrunc(ctx.builder, shifted, ctx.i1_type, codegen_llvm_ctx$fresh_name(ctx, "i1"));
}

function gen_int_lit(ctx, value) {
  const raw = LLVMConstInt(ctx.i64_type, value, 1);
  const shifted = LLVMBuildShl(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "sh"));
  const tagged = LLVMBuildOr(ctx.builder, shifted, LLVMConstInt(ctx.i64_type, 1, 0), codegen_llvm_ctx$fresh_name(ctx, "tg"));
  return LLVMBuildIntToPtr(ctx.builder, tagged, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "int"));
}

function gen_ctor_tag_test(ctx, scrut_val, cname, qualifier, match_bb, miss_bb, current_fn) {
  const ei = find_enum_by_variant(ctx, cname, qualifier);
  __ring_match152: {
    const __ring_m152 = ei;
    if (__ring_m152._tag === "some") {
      const enum_info = __ring_m152._0;
      __ring_match153: {
        const __ring_m153 = _Map_get(enum_info.variants, cname);
        if (__ring_m153._tag === "some") {
          const vi = __ring_m153._0;
          const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, 0, codegen_llvm_ctx$fresh_name(ctx, "tp"));
          const tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "tag"));
          const expected = LLVMConstInt(ctx.i64_type, vi.tag, 0);
          const cmp = LLVMBuildICmp(ctx.builder, 32, tag_val, expected, codegen_llvm_ctx$fresh_name(ctx, "tc"));
          return discard(LLVMBuildCondBr(ctx.builder, cmp, match_bb, miss_bb));
          break __ring_match153;
        }
        if (__ring_m153._tag === "none") {
          return discard(LLVMBuildBr(ctx.builder, match_bb));
          break __ring_match153;
        }
        __match_fail(__ring_m153);
      }
      break __ring_match152;
    }
    if (__ring_m152._tag === "none") {
      return discard(LLVMBuildBr(ctx.builder, match_bb));
      break __ring_match152;
    }
    __match_fail(__ring_m152);
  }
}

function gen_literal_pattern_cond(ctx, scrut_val, scrut_ty, value) {
  __ring_match154: {
    const __ring_m154 = value;
    if (__ring_m154._tag === "IntVal") {
      const n = __ring_m154._0;
      const raw = unbox_int(ctx, scrut_val);
      const lit = LLVMConstInt(ctx.i64_type, n, 1);
      return LLVMBuildICmp(ctx.builder, 32, raw, lit, codegen_llvm_ctx$fresh_name(ctx, "eq"));
      break __ring_match154;
    }
    if (__ring_m154._tag === "BoolVal") {
      const b = __ring_m154._0;
      const raw = unbox_int(ctx, scrut_val);
      const lit = (b ? LLVMConstInt(ctx.i64_type, 1, 0) : LLVMConstInt(ctx.i64_type, 0, 0));
      return LLVMBuildICmp(ctx.builder, 32, raw, lit, codegen_llvm_ctx$fresh_name(ctx, "eq"));
      break __ring_match154;
    }
    if (__ring_m154._tag === "StrVal") {
      const s = __ring_m154._0;
      const lit_str = gen_str_lit(ctx, s);
      const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
      const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
      const result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [scrut_val, lit_str], codegen_llvm_ctx$fresh_name(ctx, "seq"));
      return LLVMBuildTrunc(ctx.builder, result, ctx.i1_type, codegen_llvm_ctx$fresh_name(ctx, "i1"));
      break __ring_match154;
    }
    if (__ring_m154._tag === "FloatVal") {
      const f = __ring_m154._0;
      const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
      const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
      const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [scrut_val], codegen_llvm_ctx$fresh_name(ctx, "uf"));
      const lit = LLVMConstReal(ctx.double_type, f);
      return LLVMBuildFCmp(ctx.builder, 1, raw, lit, codegen_llvm_ctx$fresh_name(ctx, "feq"));
      break __ring_match154;
    }
    __match_fail(__ring_m154);
  }
}

function tuple_element_type(ty, idx) {
  __ring_match155: {
    const __ring_m155 = ty;
    if (__ring_m155._tag === "TupleType") {
      const elements = __ring_m155.elements;
      __ring_match156: {
        const __ring_m156 = List_get(elements, idx);
        if (__ring_m156._tag === "some") {
          const t = __ring_m156._0;
          return t;
          break __ring_match156;
        }
        if (__ring_m156._tag === "none") {
          return types$Type_ErrorType;
          break __ring_match156;
        }
        __match_fail(__ring_m156);
      }
      break __ring_match155;
    }
    return types$Type_ErrorType;
    break __ring_match155;
  }
}

function gen_unaryop(ctx, op, operand, ty) {
  const val = gen_llvm_expr(ctx, operand);
  __ring_match157: {
    const __ring_m157 = op;
    if (__ring_m157._tag === "Neg") {
      if (is_int_type(ty)) {
        const raw = unbox_int(ctx, val);
        const zero = LLVMConstInt(ctx.i64_type, 0, 0);
        const neg = LLVMBuildSub(ctx.builder, zero, raw, codegen_llvm_ctx$fresh_name(ctx, "neg"));
        return box_int(ctx, neg);
      } else {
        const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
        const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
        const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "un"));
        const zero = LLVMConstReal(ctx.double_type, 0);
        const neg = LLVMBuildFSub(ctx.builder, zero, raw, codegen_llvm_ctx$fresh_name(ctx, "fneg"));
        return box_float(ctx, neg);
      }
      break __ring_match157;
    }
    if (__ring_m157._tag === "Not") {
      const raw = unbox_int(ctx, val);
      const one = LLVMConstInt(ctx.i64_type, 1, 0);
      const neg = LLVMBuildSub(ctx.builder, one, raw, codegen_llvm_ctx$fresh_name(ctx, "not"));
      return box_bool(ctx, neg);
      break __ring_match157;
    }
    __match_fail(__ring_m157);
  }
}

function gen_tuple_lit(ctx, elements) {
  return gen_list_lit(ctx, elements);
}

function gen_catch_arms(ctx, error_val, arms) {
  if ((List_len(arms) === 0)) {
    return LLVMConstPointerNull(ctx.ptr_type);
  }
  let has_constructor = false;
  let constructor_count = 0;
  const __ring_iter_62 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_62 = __ListIterator_Iterator.next(__ring_iter_62);
    if (__ring_next_62._tag === "none") break;
    const arm = __ring_next_62._0;
    __ring_match158: {
      const __ring_m158 = arm.pattern;
      if (__ring_m158._tag === "Constructor") {
        has_constructor = true;
        constructor_count = (constructor_count + 1);
        break __ring_match158;
      }
      if (__ring_m158._tag === "NamedConstructor") {
        has_constructor = true;
        constructor_count = (constructor_count + 1);
        break __ring_match158;
      }
      break __ring_match158;
    }
  }
  if (((!has_constructor) ? true : (List_len(arms) === 1))) {
    const arm = __ring_index(arms, 0);
    __ring_match159: {
      const __ring_m159 = arm.pattern;
      if (__ring_m159._tag === "Binding") {
        const name = __ring_m159.name;
        const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, name);
        discard(LLVMBuildStore(ctx.builder, error_val, alloca));
        _Map_insert(ctx.named_values, name, alloca);
        return gen_llvm_expr(ctx, arm.body);
        break __ring_match159;
      }
      if (__ring_m159._tag === "Wildcard") {
        return gen_llvm_expr(ctx, arm.body);
        break __ring_match159;
      }
      if (__ring_m159._tag === "Constructor") {
        const name = __ring_m159.name; const fields = __ring_m159.fields;
        bind_nested_pattern(ctx, error_val, arm.pattern);
        return gen_llvm_expr(ctx, arm.body);
        break __ring_match159;
      }
      if (__ring_m159._tag === "NamedConstructor") {
        const name = __ring_m159.name; const fields = __ring_m159.fields;
        bind_nested_pattern(ctx, error_val, arm.pattern);
        return gen_llvm_expr(ctx, arm.body);
        break __ring_match159;
      }
      return gen_llvm_expr(ctx, arm.body);
      break __ring_match159;
    }
  }
  let enum_info_opt = Option_none;
  const __ring_iter_63 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_63 = __ListIterator_Iterator.next(__ring_iter_63);
    if (__ring_next_63._tag === "none") break;
    const arm = __ring_next_63._0;
    __ring_match160: {
      const __ring_m160 = arm.pattern;
      if (__ring_m160._tag === "Constructor") {
        const name = __ring_m160.name; const qualifier = __ring_m160.qualifier;
        enum_info_opt = find_enum_by_variant(ctx, name, qualifier);
        break __ring_match160;
      }
      if (__ring_m160._tag === "NamedConstructor") {
        const name = __ring_m160.name; const qualifier = __ring_m160.qualifier;
        enum_info_opt = find_enum_by_variant(ctx, name, qualifier);
        break __ring_match160;
      }
      break __ring_match160;
    }
    __ring_match161: {
      const __ring_m161 = enum_info_opt;
      if (__ring_m161._tag === "some") {
        break;
        break __ring_match161;
      }
      if (__ring_m161._tag === "none") {
        break __ring_match161;
      }
      __match_fail(__ring_m161);
    }
  }
  __ring_match162: {
    const __ring_m162 = enum_info_opt;
    if (__ring_m162._tag === "none") {
      bind_nested_pattern(ctx, error_val, __ring_index(arms, 0).pattern);
      return gen_llvm_expr(ctx, __ring_index(arms, 0).body);
      break __ring_match162;
    }
    break __ring_match162;
  }
  let __ring_blk42;
  __ring_match163: {
    const __ring_m163 = enum_info_opt;
    if (__ring_m163._tag === "some") {
      const ei = __ring_m163._0;
      __ring_blk42 = ei;
      break __ring_match163;
    }
    if (__ring_m163._tag === "none") {
      __ring_blk42 = panic("LLVM codegen: catch enum_info unreachable");
      break __ring_match163;
    }
    __match_fail(__ring_m163);
  }
  const enum_info = __ring_blk42;
  let __ring_blk43;
  __ring_match164: {
    const __ring_m164 = ctx.current_fn;
    if (__ring_m164._tag === "some") {
      const f = __ring_m164._0;
      __ring_blk43 = f;
      break __ring_match164;
    }
    if (__ring_m164._tag === "none") {
      __ring_blk43 = panic("LLVM codegen: catch arms outside function");
      break __ring_match164;
    }
    __match_fail(__ring_m164);
  }
  const current_fn = __ring_blk43;
  const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, error_val, 0, codegen_llvm_ctx$fresh_name(ctx, "ct_tp"));
  const tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "ct_tag"));
  const catch_merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "catch.merge");
  const catch_default_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "catch.default");
  const switch_val = LLVMBuildSwitch(ctx.builder, tag_val, catch_default_bb, List_len(arms));
  let phi_vals = [];
  let phi_bbs = [];
  let has_wildcard = false;
  const __ring_iter_64 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_64 = __ListIterator_Iterator.next(__ring_iter_64);
    if (__ring_next_64._tag === "none") break;
    const arm = __ring_next_64._0;
    __ring_match165: {
      const __ring_m165 = arm.pattern;
      if (__ring_m165._tag === "Wildcard") {
        has_wildcard = true;
        LLVMPositionBuilderAtEnd(ctx.builder, catch_default_bb);
        const body_val = gen_llvm_expr(ctx, arm.body);
        const end_bb = LLVMGetInsertBlock(ctx.builder);
        discard(LLVMBuildBr(ctx.builder, catch_merge_bb));
        List_push(phi_vals, body_val);
        List_push(phi_bbs, end_bb);
        break __ring_match165;
      }
      if (__ring_m165._tag === "Binding") {
        const name = __ring_m165.name;
        has_wildcard = true;
        LLVMPositionBuilderAtEnd(ctx.builder, catch_default_bb);
        const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, name);
        discard(LLVMBuildStore(ctx.builder, error_val, alloca));
        _Map_insert(ctx.named_values, name, alloca);
        const body_val = gen_llvm_expr(ctx, arm.body);
        const end_bb = LLVMGetInsertBlock(ctx.builder);
        discard(LLVMBuildBr(ctx.builder, catch_merge_bb));
        List_push(phi_vals, body_val);
        List_push(phi_bbs, end_bb);
        break __ring_match165;
      }
      if (__ring_m165._tag === "Constructor") {
        const name = __ring_m165.name; const fields = __ring_m165.fields;
        __ring_match166: {
          const __ring_m166 = _Map_get(enum_info.variants, name);
          if (__ring_m166._tag === "some") {
            const vi = __ring_m166._0;
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `catch.arm.${name}`);
            LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            const __ring_end65 = List_len(fields);
            for (let i = 0; i < __ring_end65; i++) {
              __ring_match167: {
                const __ring_m167 = List_get(fields, i);
                if (__ring_m167._tag === "some") {
                  const field_pat = __ring_m167._0;
                  __ring_match168: {
                    const __ring_m168 = field_pat;
                    if (__ring_m168._tag === "Binding") {
                      const bname = __ring_m168.name;
                      const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, error_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "cf"));
                      const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                      discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                      _Map_insert(ctx.named_values, bname, alloca);
                      break __ring_match168;
                    }
                    if (__ring_m168._tag === "Wildcard") {
                      break __ring_match168;
                    }
                    const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, error_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "cf"));
                    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
                    bind_nested_pattern(ctx, field_val, field_pat);
                    break __ring_match168;
                  }
                  break __ring_match167;
                }
                if (__ring_m167._tag === "none") {
                  break __ring_match167;
                }
                __match_fail(__ring_m167);
              }
            }
            const body_val = gen_llvm_expr(ctx, arm.body);
            const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
            discard(LLVMBuildBr(ctx.builder, catch_merge_bb));
            List_push(phi_vals, body_val);
            List_push(phi_bbs, arm_end_bb);
            break __ring_match166;
          }
          if (__ring_m166._tag === "none") {
            break __ring_match166;
          }
          __match_fail(__ring_m166);
        }
        break __ring_match165;
      }
      if (__ring_m165._tag === "NamedConstructor") {
        const name = __ring_m165.name; const named_fields = __ring_m165.fields;
        __ring_match169: {
          const __ring_m169 = _Map_get(enum_info.variants, name);
          if (__ring_m169._tag === "some") {
            const vi = __ring_m169._0;
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `catch.arm.${name}`);
            LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            const __ring_end66 = List_len(named_fields);
            for (let i = 0; i < __ring_end66; i++) {
              __ring_match170: {
                const __ring_m170 = List_get(named_fields, i);
                if (__ring_m170._tag === "some") {
                  const nf = __ring_m170._0;
                  let field_idx = i;
                  const __ring_end67 = List_len(vi.field_names);
                  for (let fi = 0; fi < __ring_end67; fi++) {
                    if ((__ring_index(vi.field_names, fi) === nf.name)) {
                      field_idx = fi;
                    }
                  }
                  __ring_match171: {
                    const __ring_m171 = nf.pattern;
                    if (__ring_m171._tag === "Binding") {
                      const bname = __ring_m171.name;
                      const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, error_val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "cf"));
                      const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                      discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                      _Map_insert(ctx.named_values, bname, alloca);
                      break __ring_match171;
                    }
                    if (__ring_m171._tag === "Wildcard") {
                      break __ring_match171;
                    }
                    const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, error_val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "cf"));
                    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
                    bind_nested_pattern(ctx, field_val, nf.pattern);
                    break __ring_match171;
                  }
                  break __ring_match170;
                }
                if (__ring_m170._tag === "none") {
                  break __ring_match170;
                }
                __match_fail(__ring_m170);
              }
            }
            const body_val = gen_llvm_expr(ctx, arm.body);
            const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
            discard(LLVMBuildBr(ctx.builder, catch_merge_bb));
            List_push(phi_vals, body_val);
            List_push(phi_bbs, arm_end_bb);
            break __ring_match169;
          }
          if (__ring_m169._tag === "none") {
            break __ring_match169;
          }
          __match_fail(__ring_m169);
        }
        break __ring_match165;
      }
      break __ring_match165;
    }
  }
  if ((!has_wildcard)) {
    LLVMPositionBuilderAtEnd(ctx.builder, catch_default_bb);
    discard(LLVMBuildUnreachable(ctx.builder));
  }
  LLVMPositionBuilderAtEnd(ctx.builder, catch_merge_bb);
  if ((List_len(phi_vals) > 0)) {
    const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "cv"));
    LLVMAddIncoming(phi, phi_vals, phi_bbs);
    return phi;
  } else {
    return LLVMConstPointerNull(ctx.ptr_type);
  }
}

function gen_try_catch(ctx, body, arms) {
  let __ring_blk44;
  __ring_match172: {
    const __ring_m172 = ctx.current_fn;
    if (__ring_m172._tag === "some") {
      const f = __ring_m172._0;
      __ring_blk44 = f;
      break __ring_match172;
    }
    if (__ring_m172._tag === "none") {
      __ring_blk44 = panic("LLVM codegen: try-catch outside function");
      break __ring_match172;
    }
    __match_fail(__ring_m172);
  }
  const current_fn = __ring_blk44;
  const sj = get_or_declare_setjmp(ctx);
  const push_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_push", [], ctx.ptr_type);
  const push_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_push");
  const frame = LLVMBuildCall2(ctx.builder, push_ty, push_fn, [], codegen_llvm_ctx$fresh_name(ctx, "frame"));
  const getbuf_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_get_buf", [ctx.ptr_type], ctx.ptr_type);
  const getbuf_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_get_buf");
  const buf_ptr = LLVMBuildCall2(ctx.builder, getbuf_ty, getbuf_fn, [frame], codegen_llvm_ctx$fresh_name(ctx, "buf"));
  const fa = get_or_declare_frameaddress(ctx);
  const fp = LLVMBuildCall2(ctx.builder, fa[1], fa[0], [LLVMConstInt(ctx.i32_type, 0, 0)], codegen_llvm_ctx$fresh_name(ctx, "fp"));
  const sjresult = LLVMBuildCall2(ctx.builder, sj[1], sj[0], [buf_ptr, fp], codegen_llvm_ctx$fresh_name(ctx, "sj"));
  const zero = LLVMConstInt(ctx.i32_type, 0, 0);
  const cond = LLVMBuildICmp(ctx.builder, 32, sjresult, zero, codegen_llvm_ctx$fresh_name(ctx, "sjcmp"));
  const normal_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "try.normal");
  const catch_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "try.catch");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "try.merge");
  discard(LLVMBuildCondBr(ctx.builder, cond, normal_bb, catch_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, normal_bb);
  const body_val = gen_llvm_expr(ctx, body);
  const pop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_pop", [], ctx.void_type);
  const pop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_pop");
  discard(LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], ""));
  const normal_end_bb = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, catch_bb);
  const get_err_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_get_error", [ctx.ptr_type], ctx.ptr_type);
  const get_err_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_get_error");
  const error_val = LLVMBuildCall2(ctx.builder, get_err_ty, get_err_fn, [frame], codegen_llvm_ctx$fresh_name(ctx, "err"));
  discard(LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], ""));
  const catch_val = gen_catch_arms(ctx, error_val, arms);
  const catch_end_bb = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "tryv"));
  LLVMAddIncoming(phi, [body_val, catch_val], [normal_end_bb, catch_end_bb]);
  return phi;
}

function gen_struct_lit(ctx, name, fields, spread) {
  __ring_match173: {
    const __ring_m173 = _Map_get(ctx.struct_types, name);
    if (__ring_m173._tag === "some") {
      const info = __ring_m173._0;
      const size = LLVMSizeOf(info.llvm_type);
      const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
      const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
      const typeid_val = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$get_or_assign_typeid(ctx, name), 0);
      const struct_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, typeid_val], codegen_llvm_ctx$fresh_name(ctx, "s"));
      __ring_match174: {
        const __ring_m174 = spread;
        if (__ring_m174._tag === "some") {
          const spread_expr = __ring_m174._0;
          let overridden = set_new();
          const __ring_iter_68 = __List_Iterable.iter(fields);
          while (true) {
            const __ring_next_68 = __ListIterator_Iterator.next(__ring_iter_68);
            if (__ring_next_68._tag === "none") break;
            const f = __ring_next_68._0;
            _Set_insert(overridden, f.name);
          }
          const spread_val = gen_llvm_expr(ctx, spread_expr);
          const __ring_end69 = List_len(info.field_names);
          for (let i = 0; i < __ring_end69; i++) {
            const src_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, spread_val, i, codegen_llvm_ctx$fresh_name(ctx, "sfp"));
            const src_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, src_ptr, codegen_llvm_ctx$fresh_name(ctx, "sfv"));
            if ((_Set_contains(overridden, __ring_index(info.field_names, i), __Str_Eq) === false)) {
              discard(gen_dup_value(ctx, src_val));
            }
            const dst_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, struct_ptr, i, codegen_llvm_ctx$fresh_name(ctx, "dfp"));
            discard(LLVMBuildStore(ctx.builder, src_val, dst_ptr));
          }
          break __ring_match174;
        }
        if (__ring_m174._tag === "none") {
          break __ring_match174;
        }
        __match_fail(__ring_m174);
      }
      const __ring_iter_70 = __List_Iterable.iter(fields);
      while (true) {
        const __ring_next_70 = __ListIterator_Iterator.next(__ring_iter_70);
        if (__ring_next_70._tag === "none") break;
        const f = __ring_next_70._0;
        const val = gen_llvm_expr(ctx, f.value);
        let field_idx = (-1);
        const __ring_end71 = List_len(info.field_names);
        for (let i = 0; i < __ring_end71; i++) {
          if ((__ring_index(info.field_names, i) === f.name)) {
            field_idx = i;
          }
        }
        if ((field_idx < 0)) {
          panic(`LLVM codegen: field '${f.name}' not found in struct '${name}'`);
        }
        const field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, struct_ptr, field_idx, codegen_llvm_ctx$fresh_name(ctx, "fp"));
        LLVMBuildStore(ctx.builder, val, field_ptr);
      }
      return struct_ptr;
      break __ring_match173;
    }
    if (__ring_m173._tag === "none") {
      return panic(`LLVM codegen: struct type '${name}' not registered for literal`);
      break __ring_match173;
    }
    __match_fail(__ring_m173);
  }
}

function gen_string_interp(ctx, parts) {
  const sb_new_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ctx.ptr_type);
  const sb_new_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_new");
  const sb = LLVMBuildCall2(ctx.builder, sb_new_ty, sb_new_fn, [], codegen_llvm_ctx$fresh_name(ctx, "sb"));
  const sb_add_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_add", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
  const sb_add_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_add");
  const drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
  const drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
  const __ring_iter_72 = __List_Iterable.iter(parts);
  while (true) {
    const __ring_next_72 = __ListIterator_Iterator.next(__ring_iter_72);
    if (__ring_next_72._tag === "none") break;
    const part = __ring_next_72._0;
    __ring_match175: {
      const __ring_m175 = part;
      if (__ring_m175._tag === "Literal") {
        const s = __ring_m175._0;
        const str_val = gen_str_lit(ctx, s);
        LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], codegen_llvm_ctx$fresh_name(ctx, "sba"));
        discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [str_val], ""));
        break __ring_match175;
      }
      if (__ring_m175._tag === "Expression") {
        const e = __ring_m175._0;
        const val = gen_llvm_expr(ctx, e);
        const expr_type = hir$hexpr_type(e);
        const str_val = convert_to_str(ctx, val, expr_type);
        LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], codegen_llvm_ctx$fresh_name(ctx, "sba"));
        if ((!is_str_type(expr_type))) {
          discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [str_val], ""));
        }
        break __ring_match175;
      }
      __match_fail(__ring_m175);
    }
  }
  const sb_to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type);
  const sb_to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_to_str");
  const result = LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], codegen_llvm_ctx$fresh_name(ctx, "interp"));
  discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""));
  return result;
}

function gen_range_expr(ctx, start, end, inclusive) {
  const range_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0);
  const size = LLVMSizeOf(range_ty);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const range_typeid = LLVMConstInt(ctx.i64_type, 10, 0);
  const range_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, range_typeid], codegen_llvm_ctx$fresh_name(ctx, "rng"));
  const start_val = gen_llvm_expr(ctx, start);
  const end_val = gen_llvm_expr(ctx, end);
  const incl_val = gen_bool_lit(ctx, inclusive);
  const start_ptr = LLVMBuildStructGEP2(ctx.builder, range_ty, range_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "rs"));
  discard(LLVMBuildStore(ctx.builder, start_val, start_ptr));
  const end_ptr = LLVMBuildStructGEP2(ctx.builder, range_ty, range_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "re"));
  discard(LLVMBuildStore(ctx.builder, end_val, end_ptr));
  const incl_ptr = LLVMBuildStructGEP2(ctx.builder, range_ty, range_ptr, 2, codegen_llvm_ctx$fresh_name(ctx, "ri"));
  discard(LLVMBuildStore(ctx.builder, incl_val, incl_ptr));
  return range_ptr;
}

function gen_named_variant_construct(ctx, enum_name, variant_name, fields) {
  __ring_match176: {
    const __ring_m176 = _Map_get(ctx.enum_types, enum_name);
    if (__ring_m176._tag === "some") {
      const enum_info = __ring_m176._0;
      __ring_match177: {
        const __ring_m177 = _Map_get(enum_info.variants, variant_name);
        if (__ring_m177._tag === "some") {
          const vi = __ring_m177._0;
          const size = LLVMSizeOf(enum_info.llvm_type);
          const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
          const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
          const enum_tid_val = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$get_or_assign_typeid(ctx, enum_name), 0);
          const enum_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, enum_tid_val], codegen_llvm_ctx$fresh_name(ctx, "ev"));
          const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "tag"));
          discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, vi.tag, 0), tag_ptr));
          const __ring_end73 = List_len(fields);
          for (let i = 0; i < __ring_end73; i++) {
            __ring_match178: {
              const __ring_m178 = List_get(fields, i);
              if (__ring_m178._tag === "some") {
                const f = __ring_m178._0;
                const val = gen_llvm_expr(ctx, f.value);
                let field_idx = i;
                const __ring_end74 = List_len(vi.field_names);
                for (let fi = 0; fi < __ring_end74; fi++) {
                  if ((__ring_index(vi.field_names, fi) === f.name)) {
                    field_idx = fi;
                  }
                }
                const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                discard(LLVMBuildStore(ctx.builder, val, field_ptr));
                break __ring_match178;
              }
              if (__ring_m178._tag === "none") {
                break __ring_match178;
              }
              __match_fail(__ring_m178);
            }
          }
          return enum_ptr;
          break __ring_match177;
        }
        if (__ring_m177._tag === "none") {
          return panic(`LLVM codegen: variant '${variant_name}' not found in enum '${enum_name}'`);
          break __ring_match177;
        }
        __match_fail(__ring_m177);
      }
      break __ring_match176;
    }
    if (__ring_m176._tag === "none") {
      const ctor_name = `ring_${enum_name}_${variant_name}`;
      __ring_match179: {
        const __ring_m179 = _Map_get(ctx.functions, ctor_name);
        if (__ring_m179._tag === "some") {
          const fn_val = __ring_m179._0;
          let args = [];
          const __ring_iter_75 = __List_Iterable.iter(fields);
          while (true) {
            const __ring_next_75 = __ListIterator_Iterator.next(__ring_iter_75);
            if (__ring_next_75._tag === "none") break;
            const f = __ring_next_75._0;
            List_push(args, gen_llvm_expr(ctx, f.value));
          }
          let __ring_blk45;
          __ring_match180: {
            const __ring_m180 = _Map_get(ctx.fn_types, ctor_name);
            if (__ring_m180._tag === "some") {
              const t = __ring_m180._0;
              __ring_blk45 = t;
              break __ring_match180;
            }
            if (__ring_m180._tag === "none") {
              __ring_blk45 = panic(`LLVM codegen: fn type not found for ${ctor_name}`);
              break __ring_match180;
            }
            __match_fail(__ring_m180);
          }
          const fn_ty = __ring_blk45;
          return LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, codegen_llvm_ctx$fresh_name(ctx, "vc"));
          break __ring_match179;
        }
        if (__ring_m179._tag === "none") {
          return panic(`LLVM codegen: enum '${enum_name}' not registered for variant construct`);
          break __ring_match179;
        }
        __match_fail(__ring_m179);
      }
      break __ring_match176;
    }
    __match_fail(__ring_m176);
  }
}

function emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs) {
  __ring_match181: {
    const __ring_m181 = arm.guard;
    if (__ring_m181._tag === "some") {
      const g = __ring_m181._0;
      const body_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.body");
      const guard_val = gen_llvm_expr(ctx, g);
      const guard_i1 = unbox_to_i1(ctx, guard_val);
      if (hir$is_fresh_owned_bool_value(g)) {
        const gdrop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
        const gdrop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
        discard(LLVMBuildCall2(ctx.builder, gdrop_ty, gdrop_fn, [guard_val], ""));
      }
      discard(LLVMBuildCondBr(ctx.builder, guard_i1, body_bb, next_bb));
      LLVMPositionBuilderAtEnd(ctx.builder, body_bb);
      break __ring_match181;
    }
    if (__ring_m181._tag === "none") {
      break __ring_match181;
    }
    __match_fail(__ring_m181);
  }
  const body_val = gen_llvm_expr(ctx, arm.body);
  const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  List_push(phi_vals, body_val);
  return List_push(phi_bbs, arm_end_bb);
}

function gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn) {
  let phi_vals = [];
  let phi_bbs = [];
  let open_block = false;
  let remaining_arms = arms;
  const total = List_len(arms);
  const __ring_end76 = total;
  for (let i = 0; i < __ring_end76; i++) {
    __ring_match182: {
      const __ring_m182 = List_get(arms, i);
      if (__ring_m182._tag === "some") {
        const arm = __ring_m182._0;
        const is_last = (i === (total - 1));
        let __ring_blk46;
        __ring_match183: {
          const __ring_m183 = arm.guard;
          if (__ring_m183._tag === "some") {
            __ring_blk46 = true;
            break __ring_match183;
          }
          if (__ring_m183._tag === "none") {
            __ring_blk46 = false;
            break __ring_match183;
          }
          __match_fail(__ring_m183);
        }
        const has_guard = __ring_blk46;
        __ring_match184: {
          const __ring_m184 = arm.pattern;
          if (__ring_m184._tag === "Wildcard") {
            open_block = false;
            const next_bb = ((has_guard ? (is_last === false) : false) ? LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") : default_bb);
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.wild");
            discard(LLVMBuildBr(ctx.builder, arm_bb));
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((has_guard ? (is_last === false) : false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            }
            break __ring_match184;
          }
          if (__ring_m184._tag === "Binding") {
            const bname = __ring_m184.name;
            open_block = false;
            const next_bb = ((has_guard ? (is_last === false) : false) ? LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") : default_bb);
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.bind");
            discard(LLVMBuildBr(ctx.builder, arm_bb));
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
            discard(LLVMBuildStore(ctx.builder, scrut_val, alloca));
            _Map_insert(ctx.named_values, bname, alloca);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((has_guard ? (is_last === false) : false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            }
            break __ring_match184;
          }
          if (__ring_m184._tag === "Literal") {
            const value = __ring_m184.value;
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.lit");
            const next_bb = (is_last ? default_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next"));
            const cond_i1 = gen_literal_pattern_cond(ctx, scrut_val, scrut_ty, value);
            discard(LLVMBuildCondBr(ctx.builder, cond_i1, arm_bb, next_bb));
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((is_last === false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            } else {
              open_block = false;
            }
            break __ring_match184;
          }
          if (__ring_m184._tag === "Constructor") {
            const cname = __ring_m184.name; const qualifier = __ring_m184.qualifier; const fields = __ring_m184.fields;
            const next_bb = (is_last ? default_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next"));
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `match.ctor.${cname}`);
            gen_ctor_tag_test(ctx, scrut_val, cname, qualifier, arm_bb, next_bb, current_fn);
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            bind_constructor_fields(ctx, scrut_val, cname, qualifier, fields);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((is_last === false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            } else {
              open_block = false;
            }
            break __ring_match184;
          }
          if (__ring_m184._tag === "NamedConstructor") {
            const cname = __ring_m184.name; const qualifier = __ring_m184.qualifier; const nfields = __ring_m184.fields;
            const next_bb = (is_last ? default_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next"));
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `match.ctor.${cname}`);
            gen_ctor_tag_test(ctx, scrut_val, cname, qualifier, arm_bb, next_bb, current_fn);
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            bind_named_constructor_fields(ctx, scrut_val, cname, qualifier, nfields);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((is_last === false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            } else {
              open_block = false;
            }
            break __ring_match184;
          }
          if (__ring_m184._tag === "OrPattern") {
            const patterns = __ring_m184.patterns;
            const next_bb = (is_last ? default_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next"));
            const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.or");
            const palts = patterns;
            const nalts = List_len(palts);
            const __ring_end77 = nalts;
            for (let k = 0; k < __ring_end77; k++) {
              __ring_match185: {
                const __ring_m185 = List_get(palts, k);
                if (__ring_m185._tag === "some") {
                  const alt = __ring_m185._0;
                  let __ring_blk47;
                  __ring_match186: {
                    const __ring_m186 = alt;
                    if (__ring_m186._tag === "Constructor") {
                      const an = __ring_m186.name; const aq = __ring_m186.qualifier;
                      __ring_blk47 = Option_some([an, aq]);
                      break __ring_match186;
                    }
                    if (__ring_m186._tag === "NamedConstructor") {
                      const an = __ring_m186.name; const aq = __ring_m186.qualifier;
                      __ring_blk47 = Option_some([an, aq]);
                      break __ring_match186;
                    }
                    __ring_blk47 = Option_none;
                    break __ring_match186;
                  }
                  const alt_ref = __ring_blk47;
                  __ring_match187: {
                    const __ring_m187 = alt_ref;
                    if (__ring_m187._tag === "some") {
                      const ar = __ring_m187._0;
                      const __ring_dt3 = ar;
                      const an = __ring_dt3[0];
                      const aq = __ring_dt3[1];
                      const miss_bb = ((k === (nalts - 1)) ? next_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.or.alt"));
                      gen_ctor_tag_test(ctx, scrut_val, an, aq, arm_bb, miss_bb, current_fn);
                      LLVMPositionBuilderAtEnd(ctx.builder, miss_bb);
                      break __ring_match187;
                    }
                    if (__ring_m187._tag === "none") {
                      break __ring_match187;
                    }
                    __match_fail(__ring_m187);
                  }
                  break __ring_match185;
                }
                if (__ring_m185._tag === "none") {
                  break __ring_match185;
                }
                __match_fail(__ring_m185);
              }
            }
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((is_last === false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            } else {
              open_block = false;
            }
            break __ring_match184;
          }
          if (__ring_m184._tag === "TuplePattern") {
            const elements = __ring_m184.elements;
            const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
            const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
            const next_bb = (is_last ? default_bb : LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next"));
            const __ring_end78 = List_len(elements);
            for (let j = 0; j < __ring_end78; j++) {
              __ring_match188: {
                const __ring_m188 = List_get(elements, j);
                if (__ring_m188._tag === "some") {
                  const elem_pat = __ring_m188._0;
                  let __ring_blk48;
                  __ring_match189: {
                    const __ring_m189 = elem_pat;
                    if (__ring_m189._tag === "Constructor") {
                      const cname = __ring_m189.name; const qualifier = __ring_m189.qualifier;
                      __ring_blk48 = Option_some([cname, qualifier]);
                      break __ring_match189;
                    }
                    if (__ring_m189._tag === "NamedConstructor") {
                      const cname = __ring_m189.name; const qualifier = __ring_m189.qualifier;
                      __ring_blk48 = Option_some([cname, qualifier]);
                      break __ring_match189;
                    }
                    __ring_blk48 = Option_none;
                    break __ring_match189;
                  }
                  const ctor_ref = __ring_blk48;
                  __ring_match190: {
                    const __ring_m190 = ctor_ref;
                    if (__ring_m190._tag === "some") {
                      const cref = __ring_m190._0;
                      const __ring_dt4 = cref;
                      const cname = __ring_dt4[0];
                      const qualifier = __ring_dt4[1];
                      const idx = LLVMConstInt(ctx.i64_type, j, 0);
                      const elem_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], codegen_llvm_ctx$fresh_name(ctx, "tc"));
                      const ei = find_enum_by_variant(ctx, cname, qualifier);
                      __ring_match191: {
                        const __ring_m191 = ei;
                        if (__ring_m191._tag === "some") {
                          const enum_info = __ring_m191._0;
                          __ring_match192: {
                            const __ring_m192 = _Map_get(enum_info.variants, cname);
                            if (__ring_m192._tag === "some") {
                              const vi = __ring_m192._0;
                              const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, elem_val, 0, codegen_llvm_ctx$fresh_name(ctx, "tp"));
                              const tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "tv"));
                              const expected = LLVMConstInt(ctx.i64_type, vi.tag, 0);
                              const cmp = LLVMBuildICmp(ctx.builder, 32, tag_val, expected, codegen_llvm_ctx$fresh_name(ctx, "tc"));
                              const pass_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tuple.check");
                              discard(LLVMBuildCondBr(ctx.builder, cmp, pass_bb, next_bb));
                              LLVMPositionBuilderAtEnd(ctx.builder, pass_bb);
                              break __ring_match192;
                            }
                            if (__ring_m192._tag === "none") {
                              break __ring_match192;
                            }
                            __match_fail(__ring_m192);
                          }
                          break __ring_match191;
                        }
                        if (__ring_m191._tag === "none") {
                          break __ring_match191;
                        }
                        __match_fail(__ring_m191);
                      }
                      break __ring_match190;
                    }
                    if (__ring_m190._tag === "none") {
                      __ring_match193: {
                        const __ring_m193 = elem_pat;
                        if (__ring_m193._tag === "Literal") {
                          const value = __ring_m193.value;
                          const idx = LLVMConstInt(ctx.i64_type, j, 0);
                          const elem_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], codegen_llvm_ctx$fresh_name(ctx, "tl"));
                          const elem_ty = tuple_element_type(scrut_ty, j);
                          const cmp = gen_literal_pattern_cond(ctx, elem_val, elem_ty, value);
                          const pass_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tuple.litcheck");
                          discard(LLVMBuildCondBr(ctx.builder, cmp, pass_bb, next_bb));
                          LLVMPositionBuilderAtEnd(ctx.builder, pass_bb);
                          break __ring_match193;
                        }
                        break __ring_match193;
                      }
                      break __ring_match190;
                    }
                    __match_fail(__ring_m190);
                  }
                  break __ring_match188;
                }
                if (__ring_m188._tag === "none") {
                  break __ring_match188;
                }
                __match_fail(__ring_m188);
              }
            }
            const __ring_end79 = List_len(elements);
            for (let j = 0; j < __ring_end79; j++) {
              __ring_match194: {
                const __ring_m194 = List_get(elements, j);
                if (__ring_m194._tag === "some") {
                  const elem_pat = __ring_m194._0;
                  __ring_match195: {
                    const __ring_m195 = elem_pat;
                    if (__ring_m195._tag === "Binding") {
                      const bname = __ring_m195.name;
                      const idx = LLVMConstInt(ctx.i64_type, j, 0);
                      const field_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], codegen_llvm_ctx$fresh_name(ctx, bname));
                      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                      discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                      _Map_insert(ctx.named_values, bname, alloca);
                      break __ring_match195;
                    }
                    if (__ring_m195._tag === "Wildcard") {
                      break __ring_match195;
                    }
                    const idx = LLVMConstInt(ctx.i64_type, j, 0);
                    const field_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], codegen_llvm_ctx$fresh_name(ctx, "tv"));
                    bind_nested_pattern(ctx, field_val, elem_pat);
                    break __ring_match195;
                  }
                  break __ring_match194;
                }
                if (__ring_m194._tag === "none") {
                  break __ring_match194;
                }
                __match_fail(__ring_m194);
              }
            }
            emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
            if ((is_last === false)) {
              LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
              open_block = true;
            } else {
              open_block = false;
            }
            break __ring_match184;
          }
          open_block = false;
          const next_bb = ((has_guard ? (is_last === false) : false) ? LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") : default_bb);
          const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.other");
          discard(LLVMBuildBr(ctx.builder, arm_bb));
          LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
          bind_nested_pattern(ctx, scrut_val, arm.pattern);
          emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs);
          if ((has_guard ? (is_last === false) : false)) {
            LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
            open_block = true;
          }
          break __ring_match184;
        }
        break __ring_match182;
      }
      if (__ring_m182._tag === "none") {
        break __ring_match182;
      }
      __match_fail(__ring_m182);
    }
  }
  if (open_block) {
    discard(LLVMBuildBr(ctx.builder, default_bb));
  }
  LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
  const panic_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_panic", [ctx.ptr_type], ctx.ptr_type);
  const panic_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_panic");
  const msg = gen_str_lit(ctx, `match exhaustion failure #${ctx.match_counter}`);
  LLVMBuildCall2(ctx.builder, panic_ty, panic_fn, [msg], codegen_llvm_ctx$fresh_name(ctx, "mp"));
  discard(LLVMBuildUnreachable(ctx.builder));
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  if ((List_len(phi_vals) > 0)) {
    const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "mr"));
    LLVMAddIncoming(phi, phi_vals, phi_bbs);
    return phi;
  } else {
    return LLVMConstPointerNull(ctx.ptr_type);
  }
}

function gen_match_arm_wildcard(ctx, arm, scrut_val, default_bb, merge_bb, phi_vals, phi_bbs) {
  LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
  __ring_match196: {
    const __ring_m196 = arm.pattern;
    if (__ring_m196._tag === "Binding") {
      const bname = __ring_m196.name;
      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
      discard(LLVMBuildStore(ctx.builder, scrut_val, alloca));
      _Map_insert(ctx.named_values, bname, alloca);
      break __ring_match196;
    }
    break __ring_match196;
  }
  const body_val = gen_llvm_expr(ctx, arm.body);
  const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  List_push(phi_vals, body_val);
  return List_push(phi_bbs, arm_end_bb);
}

function gen_match_arm_enum(ctx, arm, scrut_val, enum_name, enum_info, switch_val, merge_bb, current_fn, phi_vals, phi_bbs) {
  __ring_match197: {
    const __ring_m197 = arm.pattern;
    if (__ring_m197._tag === "Constructor") {
      const name = __ring_m197.name; const fields = __ring_m197.fields;
      __ring_match198: {
        const __ring_m198 = _Map_get(enum_info.variants, name);
        if (__ring_m198._tag === "some") {
          const vi = __ring_m198._0;
          const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `match.arm.${name}`);
          LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
          LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
          const __ring_end80 = List_len(fields);
          for (let i = 0; i < __ring_end80; i++) {
            __ring_match199: {
              const __ring_m199 = List_get(fields, i);
              if (__ring_m199._tag === "some") {
                const field_pat = __ring_m199._0;
                __ring_match200: {
                  const __ring_m200 = field_pat;
                  if (__ring_m200._tag === "Binding") {
                    const bname = __ring_m200.name;
                    const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                    const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                    discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                    _Map_insert(ctx.named_values, bname, alloca);
                    break __ring_match200;
                  }
                  if (__ring_m200._tag === "Wildcard") {
                    break __ring_match200;
                  }
                  const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                  const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
                  bind_nested_pattern(ctx, field_val, field_pat);
                  break __ring_match200;
                }
                break __ring_match199;
              }
              if (__ring_m199._tag === "none") {
                break __ring_match199;
              }
              __match_fail(__ring_m199);
            }
          }
          const body_val = gen_llvm_expr(ctx, arm.body);
          const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
          discard(LLVMBuildBr(ctx.builder, merge_bb));
          List_push(phi_vals, body_val);
          return List_push(phi_bbs, arm_end_bb);
          break __ring_match198;
        }
        if (__ring_m198._tag === "none") {
          break __ring_match198;
        }
        __match_fail(__ring_m198);
      }
      break __ring_match197;
    }
    if (__ring_m197._tag === "NamedConstructor") {
      const name = __ring_m197.name; const named_fields = __ring_m197.fields;
      __ring_match201: {
        const __ring_m201 = _Map_get(enum_info.variants, name);
        if (__ring_m201._tag === "some") {
          const vi = __ring_m201._0;
          const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `match.arm.${name}`);
          LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
          LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
          const __ring_end81 = List_len(named_fields);
          for (let i = 0; i < __ring_end81; i++) {
            __ring_match202: {
              const __ring_m202 = List_get(named_fields, i);
              if (__ring_m202._tag === "some") {
                const nf = __ring_m202._0;
                let field_idx = i;
                const __ring_end82 = List_len(vi.field_names);
                for (let fi = 0; fi < __ring_end82; fi++) {
                  if ((__ring_index(vi.field_names, fi) === nf.name)) {
                    field_idx = fi;
                  }
                }
                __ring_match203: {
                  const __ring_m203 = nf.pattern;
                  if (__ring_m203._tag === "Binding") {
                    const bname = __ring_m203.name;
                    const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, bname));
                    const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, bname);
                    discard(LLVMBuildStore(ctx.builder, field_val, alloca));
                    _Map_insert(ctx.named_values, bname, alloca);
                    break __ring_match203;
                  }
                  if (__ring_m203._tag === "Wildcard") {
                    break __ring_match203;
                  }
                  const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, (field_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ef"));
                  const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
                  bind_nested_pattern(ctx, field_val, nf.pattern);
                  break __ring_match203;
                }
                break __ring_match202;
              }
              if (__ring_m202._tag === "none") {
                break __ring_match202;
              }
              __match_fail(__ring_m202);
            }
          }
          const body_val = gen_llvm_expr(ctx, arm.body);
          const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
          discard(LLVMBuildBr(ctx.builder, merge_bb));
          List_push(phi_vals, body_val);
          return List_push(phi_bbs, arm_end_bb);
          break __ring_match201;
        }
        if (__ring_m201._tag === "none") {
          break __ring_match201;
        }
        __match_fail(__ring_m201);
      }
      break __ring_match197;
    }
    if (__ring_m197._tag === "Wildcard") {
      break __ring_match197;
    }
    if (__ring_m197._tag === "Binding") {
      const bname = __ring_m197.name;
      break __ring_match197;
    }
    if (__ring_m197._tag === "OrPattern") {
      const patterns = __ring_m197.patterns;
      const arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.arm.or");
      const __ring_iter_83 = __List_Iterable.iter(patterns);
      while (true) {
        const __ring_next_83 = __ListIterator_Iterator.next(__ring_iter_83);
        if (__ring_next_83._tag === "none") break;
        const alt = __ring_next_83._0;
        let __ring_blk49;
        __ring_match204: {
          const __ring_m204 = alt;
          if (__ring_m204._tag === "Constructor") {
            const name = __ring_m204.name;
            __ring_blk49 = Option_some(name);
            break __ring_match204;
          }
          if (__ring_m204._tag === "NamedConstructor") {
            const name = __ring_m204.name;
            __ring_blk49 = Option_some(name);
            break __ring_match204;
          }
          __ring_blk49 = Option_none;
          break __ring_match204;
        }
        const alt_name = __ring_blk49;
        __ring_match205: {
          const __ring_m205 = alt_name;
          if (__ring_m205._tag === "some") {
            const an = __ring_m205._0;
            __ring_match206: {
              const __ring_m206 = _Map_get(enum_info.variants, an);
              if (__ring_m206._tag === "some") {
                const vi = __ring_m206._0;
                LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb);
                break __ring_match206;
              }
              if (__ring_m206._tag === "none") {
                break __ring_match206;
              }
              __match_fail(__ring_m206);
            }
            break __ring_match205;
          }
          if (__ring_m205._tag === "none") {
            break __ring_match205;
          }
          __match_fail(__ring_m205);
        }
      }
      LLVMPositionBuilderAtEnd(ctx.builder, arm_bb);
      const body_val = gen_llvm_expr(ctx, arm.body);
      const arm_end_bb = LLVMGetInsertBlock(ctx.builder);
      discard(LLVMBuildBr(ctx.builder, merge_bb));
      List_push(phi_vals, body_val);
      return List_push(phi_bbs, arm_end_bb);
      break __ring_match197;
    }
    break __ring_match197;
  }
}

function gen_match_expr(ctx, scrutinee, arms, result_ty) {
  let __ring_blk50;
  __ring_match207: {
    const __ring_m207 = ctx.current_fn;
    if (__ring_m207._tag === "some") {
      const f = __ring_m207._0;
      __ring_blk50 = f;
      break __ring_match207;
    }
    if (__ring_m207._tag === "none") {
      __ring_blk50 = panic("LLVM codegen: match expr outside function");
      break __ring_match207;
    }
    __match_fail(__ring_m207);
  }
  const current_fn = __ring_blk50;
  const scrut_val = gen_llvm_expr(ctx, scrutinee);
  const scrut_ty = hir$hexpr_type(scrutinee);
  ctx.match_counter = (ctx.match_counter + 1);
  let __ring_blk51;
  __ring_match208: {
    const __ring_m208 = scrut_ty;
    if (__ring_m208._tag === "EnumType") {
      const name = __ring_m208.name;
      __ring_blk51 = Option_some(name);
      break __ring_match208;
    }
    __ring_blk51 = Option_none;
    break __ring_match208;
  }
  const enum_name = __ring_blk51;
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.merge");
  const default_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.default");
  let any_guard = false;
  const __ring_iter_84 = __List_Iterable.iter(arms);
  while (true) {
    const __ring_next_84 = __ListIterator_Iterator.next(__ring_iter_84);
    if (__ring_next_84._tag === "none") break;
    const arm = __ring_next_84._0;
    __ring_match209: {
      const __ring_m209 = arm.guard;
      if (__ring_m209._tag === "some") {
        any_guard = true;
        break __ring_match209;
      }
      if (__ring_m209._tag === "none") {
        break __ring_match209;
      }
      __match_fail(__ring_m209);
    }
  }
  if (any_guard) {
    return gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn);
  }
  __ring_match210: {
    const __ring_m210 = enum_name;
    if (__ring_m210._tag === "some") {
      const ename = __ring_m210._0;
      __ring_match211: {
        const __ring_m211 = _Map_get(ctx.enum_types, ename);
        if (__ring_m211._tag === "some") {
          const enum_info = __ring_m211._0;
          const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, 0, codegen_llvm_ctx$fresh_name(ctx, "tp"));
          const tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "tag"));
          const switch_val = LLVMBuildSwitch(ctx.builder, tag_val, default_bb, List_len(arms));
          let phi_vals = [];
          let phi_bbs = [];
          let has_wildcard = false;
          const __ring_iter_85 = __List_Iterable.iter(arms);
          while (true) {
            const __ring_next_85 = __ListIterator_Iterator.next(__ring_iter_85);
            if (__ring_next_85._tag === "none") break;
            const arm = __ring_next_85._0;
            let __ring_blk52;
            __ring_match212: {
              const __ring_m212 = arm.pattern;
              if (__ring_m212._tag === "Wildcard") {
                __ring_blk52 = true;
                break __ring_match212;
              }
              if (__ring_m212._tag === "Binding") {
                __ring_blk52 = true;
                break __ring_match212;
              }
              __ring_blk52 = false;
              break __ring_match212;
            }
            const is_wild = __ring_blk52;
            if (is_wild) {
              has_wildcard = true;
              gen_match_arm_wildcard(ctx, arm, scrut_val, default_bb, merge_bb, phi_vals, phi_bbs);
            } else {
              gen_match_arm_enum(ctx, arm, scrut_val, ename, enum_info, switch_val, merge_bb, current_fn, phi_vals, phi_bbs);
            }
          }
          if ((!has_wildcard)) {
            LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
            const mf_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_match_fail", [ctx.ptr_type, ctx.i64_type, ctx.i64_type, ctx.ptr_type], ctx.ptr_type);
            const mf_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_match_fail");
            const ename_str = gen_str_lit(ctx, `${ename} in ${ctx.current_fn_name}`);
            const site_val = LLVMConstInt(ctx.i64_type, ctx.match_counter, 0);
            discard(LLVMBuildCall2(ctx.builder, mf_ty, mf_fn, [ename_str, tag_val, site_val, scrut_val], codegen_llvm_ctx$fresh_name(ctx, "mf")));
            discard(LLVMBuildUnreachable(ctx.builder));
          }
          LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
          if ((List_len(phi_vals) > 0)) {
            const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "mr"));
            LLVMAddIncoming(phi, phi_vals, phi_bbs);
            return phi;
          } else {
            return LLVMConstPointerNull(ctx.ptr_type);
          }
          break __ring_match211;
        }
        if (__ring_m211._tag === "none") {
          return gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn);
          break __ring_match211;
        }
        __match_fail(__ring_m211);
      }
      break __ring_match210;
    }
    if (__ring_m210._tag === "none") {
      return gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn);
      break __ring_match210;
    }
    __match_fail(__ring_m210);
  }
}

function gen_list_lit(ctx, elements) {
  const new_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_new", [], ctx.ptr_type);
  const new_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_new");
  const list = LLVMBuildCall2(ctx.builder, new_ty, new_fn, [], codegen_llvm_ctx$fresh_name(ctx, "ls"));
  const push_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_push", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
  const push_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_push");
  const __ring_iter_86 = __List_Iterable.iter(elements);
  while (true) {
    const __ring_next_86 = __ListIterator_Iterator.next(__ring_iter_86);
    if (__ring_next_86._tag === "none") break;
    const elem = __ring_next_86._0;
    const val = gen_llvm_expr(ctx, elem);
    LLVMBuildCall2(ctx.builder, push_ty, push_fn, [list, val], codegen_llvm_ctx$fresh_name(ctx, "lp"));
  }
  return list;
}

function gen_index_expr(ctx, receiver, index, ty) {
  const recv_val = gen_llvm_expr(ctx, receiver);
  const idx_val = gen_llvm_expr(ctx, index);
  const recv_type = hir$hexpr_type(receiver);
  let __ring_blk53;
  __ring_match213: {
    const __ring_m213 = types$type_to_builtin_name(recv_type);
    if (__ring_m213._tag === "some") {
      const n = __ring_m213._0;
      __ring_blk53 = n;
      break __ring_match213;
    }
    if (__ring_m213._tag === "none") {
      __ring_blk53 = "Unknown";
      break __ring_match213;
    }
    __match_fail(__ring_m213);
  }
  const type_name = __ring_blk53;
  if (((type_name === "List") ? is_builtin_collection(recv_type) : false)) {
    const raw_idx = unbox_int(ctx, idx_val);
    const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
    const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
    return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, raw_idx], codegen_llvm_ctx$fresh_name(ctx, "lg"));
  } else {
    if ((type_name === "Str")) {
      const raw_idx = unbox_int(ctx, idx_val);
      const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
      const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_get");
      return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, raw_idx], codegen_llvm_ctx$fresh_name(ctx, "sg"));
    } else {
      if (((type_name === "Map") ? is_builtin_collection(recv_type) : false)) {
        const map_get_name = (is_int_keyed_map(recv_type) ? "ring_map_int_get" : "ring_map_get");
        const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, map_get_name, [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
        const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, map_get_name);
        return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, idx_val], codegen_llvm_ctx$fresh_name(ctx, "mg"));
      } else {
        const raw_idx = unbox_int(ctx, idx_val);
        const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
        const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
        return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, raw_idx], codegen_llvm_ctx$fresh_name(ctx, "ig"));
      }
    }
  }
}

function gen_if_expr(ctx, condition, then_branch, else_branch) {
  let __ring_blk54;
  __ring_match214: {
    const __ring_m214 = ctx.current_fn;
    if (__ring_m214._tag === "some") {
      const f = __ring_m214._0;
      __ring_blk54 = f;
      break __ring_match214;
    }
    if (__ring_m214._tag === "none") {
      __ring_blk54 = panic("LLVM codegen: if expr outside function");
      break __ring_match214;
    }
    __match_fail(__ring_m214);
  }
  const current_fn = __ring_blk54;
  const cond_val = gen_llvm_expr(ctx, condition);
  const cond_i1 = unbox_to_i1(ctx, cond_val);
  const then_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "if.then");
  const else_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "if.else");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "if.merge");
  LLVMBuildCondBr(ctx.builder, cond_i1, then_bb, else_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, then_bb);
  const then_val = gen_llvm_expr(ctx, then_branch);
  const then_end_bb = LLVMGetInsertBlock(ctx.builder);
  LLVMBuildBr(ctx.builder, merge_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, else_bb);
  let __ring_blk55;
  __ring_match215: {
    const __ring_m215 = else_branch;
    if (__ring_m215._tag === "some") {
      const eb = __ring_m215._0;
      __ring_blk55 = gen_llvm_expr(ctx, eb);
      break __ring_match215;
    }
    if (__ring_m215._tag === "none") {
      __ring_blk55 = LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match215;
    }
    __match_fail(__ring_m215);
  }
  const else_val = __ring_blk55;
  const else_end_bb = LLVMGetInsertBlock(ctx.builder);
  LLVMBuildBr(ctx.builder, merge_bb);
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "if"));
  LLVMAddIncoming(phi, [then_val, else_val], [then_end_bb, else_end_bb]);
  return phi;
}

function build_handler_evidence(ctx, effect_name, hs) {
  let __ring_blk56;
  __ring_match216: {
    const __ring_m216 = _Map_get(ctx.effect_ops, effect_name);
    if (__ring_m216._tag === "some") {
      const ops = __ring_m216._0;
      __ring_blk56 = List_len(ops);
      break __ring_match216;
    }
    if (__ring_m216._tag === "none") {
      __ring_blk56 = List_len(hs);
      break __ring_match216;
    }
    __match_fail(__ring_m216);
  }
  const n_slots = __ring_blk56;
  let slot_types = [ctx.i64_type];
  const __ring_end87 = n_slots;
  for (let i = 0; i < __ring_end87; i++) {
    List_push(slot_types, ctx.ptr_type);
  }
  const ev_ty = LLVMStructTypeInContext(ctx.context, slot_types, 0);
  const ev_size = LLVMSizeOf(ev_ty);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const ev_typeid = LLVMConstInt(ctx.i64_type, 21, 0);
  const ev_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [ev_size, ev_typeid], codegen_llvm_ctx$fresh_name(ctx, "ev_st"));
  const count_ptr = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "evcnt"));
  discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, n_slots, 0), count_ptr));
  const __ring_end88 = n_slots;
  for (let i = 0; i < __ring_end88; i++) {
    const slot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "evs"));
    discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), slot));
  }
  let handled_ops = set_new();
  const __ring_iter_89 = __List_Iterable.iter(hs);
  while (true) {
    const __ring_next_89 = __ListIterator_Iterator.next(__ring_iter_89);
    if (__ring_next_89._tag === "none") break;
    const h = __ring_next_89._0;
    _Set_insert(handled_ops, h.op_name);
    const slot_idx = hir$effect_op_slot(ctx.effect_ops, effect_name, h.op_name);
    const idx = ((slot_idx >= 0) ? slot_idx : 0);
    const arm_ret_ty = hir$hexpr_type(h.body);
    const arm_closure = gen_lambda(ctx, h.params, arm_ret_ty, h.body, arm_ret_ty);
    const slot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, (idx + 1), codegen_llvm_ctx$fresh_name(ctx, "evset"));
    discard(LLVMBuildStore(ctx.builder, arm_closure, slot));
  }
  __ring_match217: {
    const __ring_m217 = _Map_get(ctx.effect_ops, effect_name);
    if (__ring_m217._tag === "some") {
      const all_ops = __ring_m217._0;
      const __ring_iter_90 = __List_Iterable.iter(all_ops);
      while (true) {
        const __ring_next_90 = __ListIterator_Iterator.next(__ring_iter_90);
        if (__ring_next_90._tag === "none") break;
        const op = __ring_next_90._0;
        if ((op.has_default ? (!_Set_contains(handled_ops, op.name, __Str_Eq)) : false)) {
          __ring_match218: {
            const __ring_m218 = op.default_body;
            if (__ring_m218._tag === "some") {
              const dbody = __ring_m218._0;
              const didx = hir$effect_op_slot(ctx.effect_ops, effect_name, op.name);
              const slot_i = ((didx >= 0) ? didx : 0);
              const dret_ty = op.return_type;
              const dclosure = gen_lambda(ctx, op.params, dret_ty, dbody, dret_ty);
              const dslot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, (slot_i + 1), codegen_llvm_ctx$fresh_name(ctx, "evdef"));
              discard(LLVMBuildStore(ctx.builder, dclosure, dslot));
              break __ring_match218;
            }
            if (__ring_m218._tag === "none") {
              break __ring_match218;
            }
            __match_fail(__ring_m218);
          }
        }
      }
      break __ring_match217;
    }
    if (__ring_m217._tag === "none") {
      break __ring_match217;
    }
    __match_fail(__ring_m217);
  }
  return ev_ptr;
}

function gen_handle_expr(ctx, body, handlers) {
  let by_effect = map_new();
  const __ring_iter_91 = __List_Iterable.iter(handlers);
  while (true) {
    const __ring_next_91 = __ListIterator_Iterator.next(__ring_iter_91);
    if (__ring_next_91._tag === "none") break;
    const h = __ring_next_91._0;
    __ring_match219: {
      const __ring_m219 = _Map_get(by_effect, h.effect_name);
      if (__ring_m219._tag === "some") {
        const existing = __ring_m219._0;
        List_push(existing, h);
        break __ring_match219;
      }
      if (__ring_m219._tag === "none") {
        _Map_insert(by_effect, h.effect_name, [h]);
        break __ring_match219;
      }
      __match_fail(__ring_m219);
    }
  }
  let has_fail_abort = false;
  let ev_drop_allocas = [];
  let saved_ev_entries = [];
  let sorted_by_effect = _Map_entries(by_effect);
  sorted_by_effect.sort((function(a, b) { return ((a[0] < b[0]) ? (-1) : ((a[0] > b[0]) ? 1 : 0)); }));
  const __ring_iter_92 = __List_Iterable.iter(sorted_by_effect);
  while (true) {
    const __ring_next_92 = __ListIterator_Iterator.next(__ring_iter_92);
    if (__ring_next_92._tag === "none") break;
    const entry = __ring_next_92._0;
    const __ring_dt5 = entry;
    const effect_name = __ring_dt5[0];
    const hs = __ring_dt5[1];
    const ev_name = hir$evidence_param_name(effect_name);
    let is_fail_abort = false;
    const __ring_iter_93 = __List_Iterable.iter(hs);
    while (true) {
      const __ring_next_93 = __ListIterator_Iterator.next(__ring_iter_93);
      if (__ring_next_93._tag === "none") break;
      const h = __ring_next_93._0;
      if (((effect_name === "fail") ? (h.op_name === "raise") : false)) {
        has_fail_abort = true;
        is_fail_abort = true;
      }
    }
    __ring_match220: {
      const __ring_m220 = _Map_get(ctx.named_values, ev_name);
      if (__ring_m220._tag === "some") {
        const outer_alloca = __ring_m220._0;
        List_push(saved_ev_entries, [ev_name, outer_alloca]);
        break __ring_match220;
      }
      if (__ring_m220._tag === "none") {
        break __ring_match220;
      }
      __match_fail(__ring_m220);
    }
    if (is_fail_abort) {
      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, ev_name);
      discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), alloca));
      _Map_insert(ctx.named_values, ev_name, alloca);
    } else {
      const ev_struct = build_handler_evidence(ctx, effect_name, hs);
      const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, ev_name);
      discard(LLVMBuildStore(ctx.builder, ev_struct, alloca));
      _Map_insert(ctx.named_values, ev_name, alloca);
      List_push(ev_drop_allocas, alloca);
    }
  }
  if (has_fail_abort) {
    let __ring_blk57;
    __ring_match221: {
      const __ring_m221 = ctx.current_fn;
      if (__ring_m221._tag === "some") {
        const f = __ring_m221._0;
        __ring_blk57 = f;
        break __ring_match221;
      }
      if (__ring_m221._tag === "none") {
        __ring_blk57 = panic("LLVM codegen: handle expr outside function");
        break __ring_match221;
      }
      __match_fail(__ring_m221);
    }
    const current_fn = __ring_blk57;
    const sj = get_or_declare_setjmp(ctx);
    const push_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_push", [], ctx.ptr_type);
    const push_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_push");
    const frame = LLVMBuildCall2(ctx.builder, push_ty, push_fn, [], codegen_llvm_ctx$fresh_name(ctx, "frame"));
    const getbuf_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_get_buf", [ctx.ptr_type], ctx.ptr_type);
    const getbuf_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_get_buf");
    const buf_ptr = LLVMBuildCall2(ctx.builder, getbuf_ty, getbuf_fn, [frame], codegen_llvm_ctx$fresh_name(ctx, "buf"));
    const fa = get_or_declare_frameaddress(ctx);
    const fp = LLVMBuildCall2(ctx.builder, fa[1], fa[0], [LLVMConstInt(ctx.i32_type, 0, 0)], codegen_llvm_ctx$fresh_name(ctx, "sj.fp"));
    const sjresult = LLVMBuildCall2(ctx.builder, sj[1], sj[0], [buf_ptr, fp], codegen_llvm_ctx$fresh_name(ctx, "sj"));
    const zero = LLVMConstInt(ctx.i32_type, 0, 0);
    const cond = LLVMBuildICmp(ctx.builder, 32, sjresult, zero, codegen_llvm_ctx$fresh_name(ctx, "sjcmp"));
    const normal_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "hdl.normal");
    const catch_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "hdl.catch");
    const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "hdl.merge");
    discard(LLVMBuildCondBr(ctx.builder, cond, normal_bb, catch_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, normal_bb);
    const body_val = gen_llvm_expr(ctx, body);
    const pop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_pop", [], ctx.void_type);
    const pop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_pop");
    discard(LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], ""));
    emit_evidence_drops(ctx, ev_drop_allocas);
    const normal_end_bb = LLVMGetInsertBlock(ctx.builder);
    discard(LLVMBuildBr(ctx.builder, merge_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, catch_bb);
    const get_err_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_catch_get_error", [ctx.ptr_type], ctx.ptr_type);
    const get_err_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_catch_get_error");
    const error_val = LLVMBuildCall2(ctx.builder, get_err_ty, get_err_fn, [frame], codegen_llvm_ctx$fresh_name(ctx, "err"));
    discard(LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], ""));
    emit_evidence_drops(ctx, ev_drop_allocas);
    const catch_end_bb = LLVMGetInsertBlock(ctx.builder);
    discard(LLVMBuildBr(ctx.builder, merge_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
    const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "hdlv"));
    LLVMAddIncoming(phi, [body_val, error_val], [normal_end_bb, catch_end_bb]);
    const __ring_iter_94 = __List_Iterable.iter(saved_ev_entries);
    while (true) {
      const __ring_next_94 = __ListIterator_Iterator.next(__ring_iter_94);
      if (__ring_next_94._tag === "none") break;
      const saved = __ring_next_94._0;
      const __ring_dt6 = saved;
      const sname = __ring_dt6[0];
      const salloca = __ring_dt6[1];
      _Map_insert(ctx.named_values, sname, salloca);
    }
    return phi;
  } else {
    const result = gen_llvm_expr(ctx, body);
    emit_evidence_drops(ctx, ev_drop_allocas);
    const __ring_iter_95 = __List_Iterable.iter(saved_ev_entries);
    while (true) {
      const __ring_next_95 = __ListIterator_Iterator.next(__ring_iter_95);
      if (__ring_next_95._tag === "none") break;
      const saved = __ring_next_95._0;
      const __ring_dt7 = saved;
      const sname = __ring_dt7[0];
      const salloca = __ring_dt7[1];
      _Map_insert(ctx.named_values, sname, salloca);
    }
    return result;
  }
}

function gen_field_access(ctx, receiver, field, ty) {
  const recv_val = gen_llvm_expr(ctx, receiver);
  const recv_type = hir$hexpr_type(receiver);
  __ring_match222: {
    const __ring_m222 = recv_type;
    if (__ring_m222._tag === "TupleType") {
      let __ring_blk58;
      __ring_match223: {
        const __ring_m223 = parse_int(field);
        if (__ring_m223._tag === "some") {
          const n = __ring_m223._0;
          __ring_blk58 = n;
          break __ring_match223;
        }
        if (__ring_m223._tag === "none") {
          __ring_blk58 = panic(`LLVM codegen: non-numeric tuple field: ${field}`);
          break __ring_match223;
        }
        __match_fail(__ring_m223);
      }
      const field_idx = __ring_blk58;
      const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
      const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
      const idx_val = LLVMConstInt(ctx.i64_type, field_idx, 0);
      return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, idx_val], codegen_llvm_ctx$fresh_name(ctx, "t"));
      break __ring_match222;
    }
    break __ring_match222;
  }
  let __ring_blk59;
  __ring_match224: {
    const __ring_m224 = recv_type;
    if (__ring_m224._tag === "StructType") {
      const name = __ring_m224.name;
      __ring_blk59 = name;
      break __ring_match224;
    }
    if (__ring_m224._tag === "EnumType") {
      const name = __ring_m224.name;
      __ring_blk59 = name;
      break __ring_match224;
    }
    __ring_blk59 = panic(`LLVM codegen: field access on non-struct type: ${types$type_to_string(recv_type)}, field: ${field}`);
    break __ring_match224;
  }
  const type_name = __ring_blk59;
  __ring_match225: {
    const __ring_m225 = _Map_get(ctx.struct_types, type_name);
    if (__ring_m225._tag === "some") {
      const info = __ring_m225._0;
      let field_idx = (-1);
      const __ring_end96 = List_len(info.field_names);
      for (let i = 0; i < __ring_end96; i++) {
        if ((__ring_index(info.field_names, i) === field)) {
          field_idx = i;
        }
      }
      if ((field_idx < 0)) {
        panic(`LLVM codegen: field '${field}' not found in struct '${type_name}'`);
      }
      const field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, recv_val, field_idx, codegen_llvm_ctx$fresh_name(ctx, "fp"));
      return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, field));
      break __ring_match225;
    }
    if (__ring_m225._tag === "none") {
      return panic(`LLVM codegen: struct type '${type_name}' not registered`);
      break __ring_match225;
    }
    __match_fail(__ring_m225);
  }
}

function gen_effect_op(ctx, effect_name, op_name, args) {
  if (((effect_name === "fail") ? (op_name === "raise") : false)) {
    let arg_vals = [];
    const __ring_iter_97 = __List_Iterable.iter(args);
    while (true) {
      const __ring_next_97 = __ListIterator_Iterator.next(__ring_iter_97);
      if (__ring_next_97._tag === "none") break;
      const a = __ring_next_97._0;
      List_push(arg_vals, gen_llvm_expr(ctx, a));
    }
    const raise_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_raise", [ctx.ptr_type], ctx.void_type);
    const raise_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_raise");
    const error_val = ((List_len(arg_vals) > 0) ? __ring_index(arg_vals, 0) : LLVMConstPointerNull(ctx.ptr_type));
    LLVMBuildCall2(ctx.builder, raise_ty, raise_fn, [error_val], "");
    discard(LLVMBuildUnreachable(ctx.builder));
    let __ring_blk60;
    __ring_match226: {
      const __ring_m226 = ctx.current_fn;
      if (__ring_m226._tag === "some") {
        const f = __ring_m226._0;
        __ring_blk60 = f;
        break __ring_match226;
      }
      if (__ring_m226._tag === "none") {
        __ring_blk60 = panic("LLVM codegen: effect op outside function");
        break __ring_match226;
      }
      __match_fail(__ring_m226);
    }
    const current_fn_val = __ring_blk60;
    const dummy_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn_val, "post.raise");
    LLVMPositionBuilderAtEnd(ctx.builder, dummy_bb);
    return LLVMConstPointerNull(ctx.ptr_type);
  } else {
    const ev_name = hir$evidence_param_name(effect_name);
    let arg_vals = [];
    const __ring_iter_98 = __List_Iterable.iter(args);
    while (true) {
      const __ring_next_98 = __ListIterator_Iterator.next(__ring_iter_98);
      if (__ring_next_98._tag === "none") break;
      const a = __ring_next_98._0;
      List_push(arg_vals, gen_llvm_expr(ctx, a));
    }
    const ev_val = lookup_evidence(ctx, ev_name);
    const slot_idx = hir$effect_op_slot(ctx.effect_ops, effect_name, op_name);
    let __ring_blk61;
    __ring_match227: {
      const __ring_m227 = _Map_get(ctx.effect_ops, effect_name);
      if (__ring_m227._tag === "some") {
        const ops = __ring_m227._0;
        __ring_blk61 = List_len(ops);
        break __ring_match227;
      }
      if (__ring_m227._tag === "none") {
        __ring_blk61 = (slot_idx + 1);
        break __ring_match227;
      }
      __match_fail(__ring_m227);
    }
    const n_slots = __ring_blk61;
    const idx = ((slot_idx >= 0) ? slot_idx : 0);
    let slot_types = [ctx.i64_type];
    const __ring_end99 = n_slots;
    for (let i = 0; i < __ring_end99; i++) {
      List_push(slot_types, ctx.ptr_type);
    }
    const ev_ty = LLVMStructTypeInContext(ctx.context, slot_types, 0);
    const slot_ptr = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_val, (idx + 1), codegen_llvm_ctx$fresh_name(ctx, "evslot"));
    const closure_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, codegen_llvm_ctx$fresh_name(ctx, "evcl"));
    return gen_closure_call(ctx, closure_ptr, arg_vals);
  }
}

function gen_clone(ctx, inner) {
  const val = gen_llvm_expr(ctx, inner);
  return gen_dup_value(ctx, val);
}

function gen_mut_arg_llvm(ctx, arg) {
  __ring_match228: {
    const __ring_m228 = arg;
    if (__ring_m228._tag === "Ident") {
      const name = __ring_m228.name; const resolved_name = __ring_m228.resolved_name; const def_id = __ring_m228.def_id;
      if (is_boxed_def(ctx, def_id)) {
        let __ring_blk62;
        __ring_match229: {
          const __ring_m229 = resolved_name;
          if (__ring_m229._tag === "some") {
            const rn = __ring_m229._0;
            __ring_blk62 = rn;
            break __ring_match229;
          }
          if (__ring_m229._tag === "none") {
            __ring_blk62 = name;
            break __ring_match229;
          }
          __match_fail(__ring_m229);
        }
        const lookup_name = __ring_blk62;
        __ring_match230: {
          const __ring_m230 = _Map_get(ctx.named_values, lookup_name);
          if (__ring_m230._tag === "some") {
            const alloca = __ring_m230._0;
            return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "mcell"));
            break __ring_match230;
          }
          if (__ring_m230._tag === "none") {
            __ring_match231: {
              const __ring_m231 = _Map_get(ctx.named_values, name);
              if (__ring_m231._tag === "some") {
                const alloca = __ring_m231._0;
                return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "mcell"));
                break __ring_match231;
              }
              if (__ring_m231._tag === "none") {
                const v = gen_llvm_expr(ctx, arg);
                return build_cell_alloc(ctx, v);
                break __ring_match231;
              }
              __match_fail(__ring_m231);
            }
            break __ring_match230;
          }
          __match_fail(__ring_m230);
        }
      } else {
        const v = gen_llvm_expr(ctx, arg);
        return build_cell_alloc(ctx, v);
      }
      break __ring_match228;
    }
    const v = gen_llvm_expr(ctx, arg);
    return build_cell_alloc(ctx, v);
    break __ring_match228;
  }
}

function gen_dict_dispatch_call(ctx, callee, args, dd) {
  let recv_val = Option_none;
  let other_arg_start = 0;
  __ring_match232: {
    const __ring_m232 = callee;
    if (__ring_m232._tag === "FieldAccess") {
      const receiver = __ring_m232.receiver;
      recv_val = Option_some(gen_llvm_expr(ctx, receiver));
      break __ring_match232;
    }
    __ring_match233: {
      const __ring_m233 = List_get(args, 0);
      if (__ring_m233._tag === "some") {
        const a = __ring_m233._0;
        recv_val = Option_some(gen_llvm_expr(ctx, a));
        other_arg_start = 1;
        break __ring_match233;
      }
      if (__ring_m233._tag === "none") {
        break __ring_match233;
      }
      __match_fail(__ring_m233);
    }
    break __ring_match232;
  }
  let call_args = [];
  __ring_match234: {
    const __ring_m234 = recv_val;
    if (__ring_m234._tag === "some") {
      const rv = __ring_m234._0;
      List_push(call_args, rv);
      break __ring_match234;
    }
    if (__ring_m234._tag === "none") {
      break __ring_match234;
    }
    __match_fail(__ring_m234);
  }
  const __ring_end100 = List_len(args);
  for (let i = other_arg_start; i < __ring_end100; i++) {
    __ring_match235: {
      const __ring_m235 = List_get(args, i);
      if (__ring_m235._tag === "some") {
        const a = __ring_m235._0;
        List_push(call_args, gen_llvm_expr(ctx, a));
        break __ring_match235;
      }
      if (__ring_m235._tag === "none") {
        break __ring_match235;
      }
      __match_fail(__ring_m235);
    }
  }
  let __ring_blk63;
  __ring_match236: {
    const __ring_m236 = _Map_get(ctx.named_values, dd.dict_param);
    if (__ring_m236._tag === "some") {
      const dict_alloca = __ring_m236._0;
      __ring_blk63 = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, dict_alloca, codegen_llvm_ctx$fresh_name(ctx, "dp"));
      break __ring_match236;
    }
    if (__ring_m236._tag === "none") {
      __ring_blk63 = resolve_static_dict_by_name(ctx, dd.dict_param);
      break __ring_match236;
    }
    __match_fail(__ring_m236);
  }
  const dict_ptr = __ring_blk63;
  const method_idx = get_trait_method_index(ctx, dd.dict_param, dd.method);
  const dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0);
  const method_slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (method_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ms"));
  const closure_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, method_slot_ptr, codegen_llvm_ctx$fresh_name(ctx, "cp"));
  return gen_closure_call(ctx, closure_ptr, call_args);
}

function gen_call(ctx, callee, args, resolved_dicts, dict_dispatch, result_ty, effects) {
  __ring_match237: {
    const __ring_m237 = dict_dispatch;
    if (__ring_m237._tag === "some") {
      const dd = __ring_m237._0;
      const raw = gen_dict_dispatch_call(ctx, callee, args, dd);
      if (is_unit_type(result_ty)) {
        return LLVMConstPointerNull(ctx.ptr_type);
      }
      return raw;
      break __ring_match237;
    }
    if (__ring_m237._tag === "none") {
      break __ring_match237;
    }
    __match_fail(__ring_m237);
  }
  const mut_flags = lookup_call_mut_flags(ctx, callee);
  let arg_vals = [];
  let argi = 0;
  const __ring_iter_101 = __List_Iterable.iter(args);
  while (true) {
    const __ring_next_101 = __ListIterator_Iterator.next(__ring_iter_101);
    if (__ring_next_101._tag === "none") break;
    const a = __ring_next_101._0;
    let __ring_blk64;
    __ring_match238: {
      const __ring_m238 = mut_flags;
      if (__ring_m238._tag === "some") {
        const flags = __ring_m238._0;
        let __ring_blk65;
        __ring_match239: {
          const __ring_m239 = List_get(flags, argi);
          if (__ring_m239._tag === "some") {
            const f = __ring_m239._0;
            __ring_blk65 = f;
            break __ring_match239;
          }
          if (__ring_m239._tag === "none") {
            __ring_blk65 = false;
            break __ring_match239;
          }
          __match_fail(__ring_m239);
        }
        __ring_blk64 = __ring_blk65;
        break __ring_match238;
      }
      if (__ring_m238._tag === "none") {
        __ring_blk64 = false;
        break __ring_match238;
      }
      __match_fail(__ring_m238);
    }
    const is_mut = __ring_blk64;
    if (is_mut) {
      List_push(arg_vals, gen_mut_arg_llvm(ctx, a));
    } else {
      List_push(arg_vals, gen_llvm_expr(ctx, a));
    }
    argi = (argi + 1);
  }
  const dict_vals = resolve_dict_refs(ctx, resolved_dicts);
  let __ring_blk66;
  __ring_match240: {
    const __ring_m240 = callee;
    if (__ring_m240._tag === "Ident") {
      const name = __ring_m240.name; const resolved_name = __ring_m240.resolved_name;
      let __ring_blk67;
      __ring_match241: {
        const __ring_m241 = resolved_name;
        if (__ring_m241._tag === "some") {
          const rn = __ring_m241._0;
          __ring_blk67 = rn;
          break __ring_match241;
        }
        if (__ring_m241._tag === "none") {
          __ring_blk67 = name;
          break __ring_match241;
        }
        __match_fail(__ring_m241);
      }
      const call_name = __ring_blk67;
      if (((call_name === "print") ? (List_len(args) === 1) : false)) {
        __ring_match242: {
          const __ring_m242 = List_get(args, 0);
          if (__ring_m242._tag === "some") {
            const arg0 = __ring_m242._0;
            const arg_ty = hir$hexpr_type(arg0);
            if (((is_int_type(arg_ty) ? true : is_float_type(arg_ty)) ? true : is_bool_type(arg_ty))) {
              __ring_match243: {
                const __ring_m243 = List_get(arg_vals, 0);
                if (__ring_m243._tag === "some") {
                  const av = __ring_m243._0;
                  const coerced = convert_to_str(ctx, av, arg_ty);
                  return gen_runtime_call(ctx, "ring_print", [coerced]);
                  break __ring_match243;
                }
                if (__ring_m243._tag === "none") {
                  break __ring_match243;
                }
                __match_fail(__ring_m243);
              }
            }
            break __ring_match242;
          }
          if (__ring_m242._tag === "none") {
            break __ring_match242;
          }
          __match_fail(__ring_m242);
        }
      }
      const final_name = (((call_name === "map_new") ? is_int_keyed_map(result_ty) : false) ? "map_int_new" : (((call_name === "set_new") ? is_int_set(result_ty) : false) ? "set_int_new" : (((call_name === "map_from") ? is_int_keyed_map(result_ty) : false) ? "map_int_from" : (((call_name === "set_from") ? is_int_set(result_ty) : false) ? "set_int_from" : call_name))));
      __ring_blk66 = gen_direct_call(ctx, final_name, arg_vals, dict_vals);
      break __ring_match240;
    }
    if (__ring_m240._tag === "FieldAccess") {
      const receiver = __ring_m240.receiver; const field = __ring_m240.field;
      const recv_val = gen_llvm_expr(ctx, receiver);
      const recv_type = hir$hexpr_type(receiver);
      __ring_blk66 = gen_method_call(ctx, recv_val, recv_type, field, arg_vals, dict_vals);
      break __ring_match240;
    }
    const closure_val = gen_llvm_expr(ctx, callee);
    __ring_blk66 = gen_closure_call(ctx, closure_val, arg_vals);
    break __ring_match240;
  }
  const raw = __ring_blk66;
  if (is_unit_type(result_ty)) {
    return LLVMConstPointerNull(ctx.ptr_type);
  }
  return raw;
}

function gen_block(ctx, stmts, tail) {
  const __ring_iter_102 = __List_Iterable.iter(stmts);
  while (true) {
    const __ring_next_102 = __ListIterator_Iterator.next(__ring_iter_102);
    if (__ring_next_102._tag === "none") break;
    const stmt = __ring_next_102._0;
    codegen_llvm_stmt$emit_llvm_stmt(ctx, stmt);
  }
  __ring_match244: {
    const __ring_m244 = tail;
    if (__ring_m244._tag === "some") {
      const t = __ring_m244._0;
      return gen_llvm_expr(ctx, t);
      break __ring_match244;
    }
    if (__ring_m244._tag === "none") {
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match244;
    }
    __match_fail(__ring_m244);
  }
}

function gen_ord_dispatch_llvm(ctx, op, left, right, dispatch) {
  const lhs = gen_llvm_expr(ctx, left);
  const rhs = gen_llvm_expr(ctx, right);
  const dict_ptr = resolve_dispatch_dict(ctx, dispatch, Option_some("Ord"));
  const cmp_closure = load_dict_method(ctx, dict_ptr, 0);
  const cmp_result = gen_closure_call(ctx, cmp_closure, [lhs, rhs]);
  const raw = unbox_int(ctx, cmp_result);
  const cmp_drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
  const cmp_drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
  discard(LLVMBuildCall2(ctx.builder, cmp_drop_ty, cmp_drop_fn, [cmp_result], ""));
  const zero = LLVMConstInt(ctx.i64_type, 0, 0);
  let __ring_blk68;
  __ring_match245: {
    const __ring_m245 = op;
    if (__ring_m245._tag === "Lt") {
      __ring_blk68 = 40;
      break __ring_match245;
    }
    if (__ring_m245._tag === "Lte") {
      __ring_blk68 = 41;
      break __ring_match245;
    }
    if (__ring_m245._tag === "Gt") {
      __ring_blk68 = 38;
      break __ring_match245;
    }
    if (__ring_m245._tag === "Gte") {
      __ring_blk68 = 39;
      break __ring_match245;
    }
    __ring_blk68 = 32;
    break __ring_match245;
  }
  const pred = __ring_blk68;
  const cmp = LLVMBuildICmp(ctx.builder, pred, raw, zero, codegen_llvm_ctx$fresh_name(ctx, "ocmp"));
  const ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "ext"));
  return box_bool(ctx, ext);
}

function gen_eq_dispatch_llvm(ctx, op, left, right, dispatch) {
  const lhs = gen_llvm_expr(ctx, left);
  const rhs = gen_llvm_expr(ctx, right);
  const dict_ptr = resolve_dispatch_dict(ctx, dispatch, Option_some("Eq"));
  const eq_closure = load_dict_method(ctx, dict_ptr, 0);
  const result = gen_closure_call(ctx, eq_closure, [lhs, rhs]);
  __ring_match246: {
    const __ring_m246 = op;
    if (__ring_m246._tag === "Neq") {
      const raw = unbox_int(ctx, result);
      const drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
      const drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
      discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [result], ""));
      const one = LLVMConstInt(ctx.i64_type, 1, 0);
      const neg = LLVMBuildSub(ctx.builder, one, raw, codegen_llvm_ctx$fresh_name(ctx, "neg"));
      return box_bool(ctx, neg);
      break __ring_match246;
    }
    return result;
    break __ring_match246;
  }
}

function gen_binop(ctx, op, left, right, eq_dispatch, ord_dispatch, result_ty) {
  const op_type = operand_type_from_binop(left);
  __ring_match247: {
    const __ring_m247 = op;
    if (__ring_m247._tag === "And") {
      panic("LLVM codegen: BinOp::And must be lowered by andor_lower");
      break __ring_match247;
    }
    if (__ring_m247._tag === "Or") {
      panic("LLVM codegen: BinOp::Or must be lowered by andor_lower");
      break __ring_match247;
    }
    break __ring_match247;
  }
  let __ring_blk69;
  __ring_match248: {
    const __ring_m248 = op;
    if (__ring_m248._tag === "Eq") {
      __ring_blk69 = true;
      break __ring_match248;
    }
    if (__ring_m248._tag === "Neq") {
      __ring_blk69 = true;
      break __ring_match248;
    }
    __ring_blk69 = false;
    break __ring_match248;
  }
  const is_eq_op = __ring_blk69;
  let __ring_blk70;
  __ring_match249: {
    const __ring_m249 = op;
    if (__ring_m249._tag === "Lt") {
      __ring_blk70 = true;
      break __ring_match249;
    }
    if (__ring_m249._tag === "Lte") {
      __ring_blk70 = true;
      break __ring_match249;
    }
    if (__ring_m249._tag === "Gt") {
      __ring_blk70 = true;
      break __ring_match249;
    }
    if (__ring_m249._tag === "Gte") {
      __ring_blk70 = true;
      break __ring_match249;
    }
    __ring_blk70 = false;
    break __ring_match249;
  }
  const is_ord_op = __ring_blk70;
  if (is_eq_op) {
    __ring_match250: {
      const __ring_m250 = eq_dispatch;
      if (__ring_m250._tag === "some") {
        const d = __ring_m250._0;
        __ring_match251: {
          const __ring_m251 = d;
          if (__ring_m251._tag === "Builtin") {
            break __ring_match251;
          }
          return gen_eq_dispatch_llvm(ctx, op, left, right, d);
          break __ring_match251;
        }
        break __ring_match250;
      }
      if (__ring_m250._tag === "none") {
        break __ring_match250;
      }
      __match_fail(__ring_m250);
    }
  }
  if (is_ord_op) {
    __ring_match252: {
      const __ring_m252 = ord_dispatch;
      if (__ring_m252._tag === "some") {
        const d = __ring_m252._0;
        __ring_match253: {
          const __ring_m253 = d;
          if (__ring_m253._tag === "Builtin") {
            break __ring_match253;
          }
          return gen_ord_dispatch_llvm(ctx, op, left, right, d);
          break __ring_match253;
        }
        break __ring_match252;
      }
      if (__ring_m252._tag === "none") {
        break __ring_match252;
      }
      __match_fail(__ring_m252);
    }
  }
  const lhs = gen_llvm_expr(ctx, left);
  const rhs = gen_llvm_expr(ctx, right);
  if (is_int_type(op_type)) {
    return gen_int_binop(ctx, op, lhs, rhs);
  } else {
    if (is_float_type(op_type)) {
      return gen_float_binop(ctx, op, lhs, rhs);
    } else {
      if (is_str_type(op_type)) {
        return gen_str_binop(ctx, op, lhs, rhs);
      } else {
        if (is_bool_type(op_type)) {
          return gen_bool_binop(ctx, op, lhs, rhs);
        } else {
          return gen_int_binop(ctx, op, lhs, rhs);
        }
      }
    }
  }
}

function gen_llvm_expr(ctx, expr) {
  __ring_match254: {
    const __ring_m254 = expr;
    if (__ring_m254._tag === "IntLit") {
      const value = __ring_m254.value;
      return gen_int_lit(ctx, value);
      break __ring_match254;
    }
    if (__ring_m254._tag === "FloatLit") {
      const value = __ring_m254.value;
      return gen_float_lit(ctx, value);
      break __ring_match254;
    }
    if (__ring_m254._tag === "StrLit") {
      const value = __ring_m254.value;
      return gen_str_lit(ctx, value);
      break __ring_match254;
    }
    if (__ring_m254._tag === "BoolLit") {
      const value = __ring_m254.value;
      return gen_bool_lit(ctx, value);
      break __ring_match254;
    }
    if (__ring_m254._tag === "Ident") {
      const name = __ring_m254.name; const resolved_name = __ring_m254.resolved_name; const def_id = __ring_m254.def_id; const dict_closure_dicts = __ring_m254.dict_closure_dicts; const ty = __ring_m254.ty;
      return gen_ident(ctx, name, resolved_name, def_id, dict_closure_dicts, ty);
      break __ring_match254;
    }
    if (__ring_m254._tag === "BinOp") {
      const op = __ring_m254.op; const left = __ring_m254.left; const right = __ring_m254.right; const eq_dispatch = __ring_m254.eq_dispatch; const ord_dispatch = __ring_m254.ord_dispatch; const ty = __ring_m254.ty;
      return gen_binop(ctx, op, left, right, eq_dispatch, ord_dispatch, ty);
      break __ring_match254;
    }
    if (__ring_m254._tag === "UnaryOp") {
      const op = __ring_m254.op; const operand = __ring_m254.operand; const ty = __ring_m254.ty;
      return gen_unaryop(ctx, op, operand, ty);
      break __ring_match254;
    }
    if (__ring_m254._tag === "Call") {
      const callee = __ring_m254.callee; const args = __ring_m254.args; const resolved_dicts = __ring_m254.resolved_dicts; const dict_dispatch = __ring_m254.dict_dispatch; const ty = __ring_m254.ty; const effects = __ring_m254.effects;
      return gen_call(ctx, callee, args, resolved_dicts, dict_dispatch, ty, effects);
      break __ring_match254;
    }
    if (__ring_m254._tag === "DictConstruct") {
      const base_dict = __ring_m254.base_dict; const trait_name = __ring_m254.trait_name; const inner = __ring_m254.inner;
      return build_wrapped_dict(ctx, base_dict, trait_name, inner);
      break __ring_match254;
    }
    if (__ring_m254._tag === "FieldAccess") {
      const receiver = __ring_m254.receiver; const field = __ring_m254.field; const ty = __ring_m254.ty;
      return gen_field_access(ctx, receiver, field, ty);
      break __ring_match254;
    }
    if (__ring_m254._tag === "StructLit") {
      const name = __ring_m254.name; const fields = __ring_m254.fields; const spread = __ring_m254.spread;
      return gen_struct_lit(ctx, name, fields, spread);
      break __ring_match254;
    }
    if (__ring_m254._tag === "Block") {
      const stmts = __ring_m254.stmts; const tail = __ring_m254.tail;
      return gen_block(ctx, stmts, tail);
      break __ring_match254;
    }
    if (__ring_m254._tag === "IfExpr") {
      const condition = __ring_m254.condition; const then_branch = __ring_m254.then_branch; const else_branch = __ring_m254.else_branch;
      return gen_if_expr(ctx, condition, then_branch, else_branch);
      break __ring_match254;
    }
    if (__ring_m254._tag === "StringInterp") {
      const parts = __ring_m254.parts;
      return gen_string_interp(ctx, parts);
      break __ring_match254;
    }
    if (__ring_m254._tag === "Lambda") {
      const params = __ring_m254.params; const return_type = __ring_m254.return_type; const body = __ring_m254.body; const ty = __ring_m254.ty;
      return gen_lambda(ctx, params, return_type, body, ty);
      break __ring_match254;
    }
    if (__ring_m254._tag === "MatchExpr") {
      const scrutinee = __ring_m254.scrutinee; const arms = __ring_m254.arms; const ty = __ring_m254.ty;
      return gen_match_expr(ctx, scrutinee, arms, ty);
      break __ring_match254;
    }
    if (__ring_m254._tag === "NamedVariantConstruct") {
      const enum_name = __ring_m254.enum_name; const variant_name = __ring_m254.variant_name; const fields = __ring_m254.fields;
      return gen_named_variant_construct(ctx, enum_name, variant_name, fields);
      break __ring_match254;
    }
    if (__ring_m254._tag === "TryCatch") {
      const body = __ring_m254.body; const arms = __ring_m254.arms;
      return gen_try_catch(ctx, body, arms);
      break __ring_match254;
    }
    if (__ring_m254._tag === "HandleExpr") {
      const body = __ring_m254.body; const handlers = __ring_m254.handlers;
      return gen_handle_expr(ctx, body, handlers);
      break __ring_match254;
    }
    if (__ring_m254._tag === "EffectOp") {
      const effect_name = __ring_m254.effect_name; const op_name = __ring_m254.op_name; const args = __ring_m254.args;
      return gen_effect_op(ctx, effect_name, op_name, args);
      break __ring_match254;
    }
    if (__ring_m254._tag === "RangeExpr") {
      const start = __ring_m254.start; const end = __ring_m254.end; const inclusive = __ring_m254.inclusive;
      return gen_range_expr(ctx, start, end, inclusive);
      break __ring_match254;
    }
    if (__ring_m254._tag === "ListLit") {
      const elements = __ring_m254.elements;
      return gen_list_lit(ctx, elements);
      break __ring_match254;
    }
    if (__ring_m254._tag === "TupleLit") {
      const elements = __ring_m254.elements;
      return gen_tuple_lit(ctx, elements);
      break __ring_match254;
    }
    if (__ring_m254._tag === "IndexExpr") {
      const receiver = __ring_m254.receiver; const index = __ring_m254.index; const ty = __ring_m254.ty;
      return gen_index_expr(ctx, receiver, index, ty);
      break __ring_match254;
    }
    if (__ring_m254._tag === "Clone") {
      const inner = __ring_m254.inner;
      return gen_clone(ctx, inner);
      break __ring_match254;
    }
    if (__ring_m254._tag === "ReturnExpr") {
      const value = __ring_m254.value;
      __ring_match255: {
        const __ring_m255 = value;
        if (__ring_m255._tag === "some") {
          const v = __ring_m255._0;
          const val = gen_llvm_expr(ctx, v);
          discard(LLVMBuildRet(ctx.builder, val));
          break __ring_match255;
        }
        if (__ring_m255._tag === "none") {
          const _null = LLVMConstPointerNull(ctx.ptr_type);
          discard(LLVMBuildRet(ctx.builder, _null));
          break __ring_match255;
        }
        __match_fail(__ring_m255);
      }
      __ring_match256: {
        const __ring_m256 = ctx.current_fn;
        if (__ring_m256._tag === "some") {
          const f = __ring_m256._0;
          const dead_bb = LLVMAppendBasicBlockInContext(ctx.context, f, "after.ret");
          LLVMPositionBuilderAtEnd(ctx.builder, dead_bb);
          break __ring_match256;
        }
        if (__ring_m256._tag === "none") {
          break __ring_match256;
        }
        __match_fail(__ring_m256);
      }
      return LLVMConstPointerNull(ctx.ptr_type);
      break __ring_match254;
    }
    __match_fail(__ring_m254);
  }
}

function gen_lambda(ctx, params, return_type, body, ty) {
  let __ring_blk71;
  __ring_match257: {
    const __ring_m257 = ctx.current_fn;
    if (__ring_m257._tag === "some") {
      const f = __ring_m257._0;
      __ring_blk71 = f;
      break __ring_match257;
    }
    if (__ring_m257._tag === "none") {
      __ring_blk71 = panic("LLVM codegen: lambda outside function");
      break __ring_match257;
    }
    __match_fail(__ring_m257);
  }
  const current_fn = __ring_blk71;
  const lambda_name = codegen_llvm_ctx$fresh_name(ctx, "ring_lambda_");
  ctx.lambda_counter = (ctx.lambda_counter + 1);
  let captures = [];
  collect_captures(ctx, body, params, captures);
  let env_elem_types = [ctx.i64_type];
  const __ring_iter_103 = __List_Iterable.iter(captures);
  while (true) {
    const __ring_next_103 = __ListIterator_Iterator.next(__ring_iter_103);
    if (__ring_next_103._tag === "none") break;
    const c = __ring_next_103._0;
    List_push(env_elem_types, ctx.ptr_type);
  }
  const env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0);
  let fn_param_types = [ctx.ptr_type];
  const __ring_iter_104 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_104 = __ListIterator_Iterator.next(__ring_iter_104);
    if (__ring_next_104._tag === "none") break;
    const p = __ring_next_104._0;
    List_push(fn_param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, fn_param_types, 0);
  const lambda_fn = LLVMAddFunction(ctx.module, lambda_name, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_named = ctx.named_values;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(lambda_fn);
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, lambda_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const env_ptr = LLVMGetParam(lambda_fn, 0);
  const __ring_end105 = List_len(captures);
  for (let i = 0; i < __ring_end105; i++) {
    __ring_match258: {
      const __ring_m258 = List_get(captures, i);
      if (__ring_m258._tag === "some") {
        const cap_name = __ring_m258._0;
        const cap_ptr = LLVMBuildStructGEP2(ctx.builder, env_ty, env_ptr, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ce"));
        const cap_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, cap_ptr, codegen_llvm_ctx$fresh_name(ctx, cap_name));
        const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, cap_name);
        discard(LLVMBuildStore(ctx.builder, cap_val, alloca));
        _Map_insert(ctx.named_values, cap_name, alloca);
        break __ring_match258;
      }
      if (__ring_m258._tag === "none") {
        break __ring_match258;
      }
      __match_fail(__ring_m258);
    }
  }
  const __ring_end106 = List_len(params);
  for (let i = 0; i < __ring_end106; i++) {
    __ring_match259: {
      const __ring_m259 = List_get(params, i);
      if (__ring_m259._tag === "some") {
        const p = __ring_m259._0;
        const param_val = LLVMGetParam(lambda_fn, (i + 1));
        const alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, p.name);
        discard(LLVMBuildStore(ctx.builder, param_val, alloca));
        _Map_insert(ctx.named_values, p.name, alloca);
        break __ring_match259;
      }
      if (__ring_m259._tag === "none") {
        break __ring_match259;
      }
      __match_fail(__ring_m259);
    }
  }
  const body_val = gen_llvm_expr(ctx, body);
  discard(LLVMBuildRet(ctx.builder, body_val));
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
  LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
  const env_size = LLVMSizeOf(env_ty);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const env_typeid = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, 0);
  const closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0);
  const env_alloc = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [env_size, env_typeid], codegen_llvm_ctx$fresh_name(ctx, "env"));
  const count_slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, 0, codegen_llvm_ctx$fresh_name(ctx, "cnt"));
  discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, List_len(captures), 0), count_slot));
  const __ring_end107 = List_len(captures);
  for (let i = 0; i < __ring_end107; i++) {
    __ring_match260: {
      const __ring_m260 = List_get(captures, i);
      if (__ring_m260._tag === "some") {
        const cap_name = __ring_m260._0;
        let __ring_blk72;
        __ring_match261: {
          const __ring_m261 = _Map_get(ctx.named_values, cap_name);
          if (__ring_m261._tag === "some") {
            const alloca = __ring_m261._0;
            __ring_blk72 = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "cv"));
            break __ring_match261;
          }
          if (__ring_m261._tag === "none") {
            __ring_blk72 = LLVMConstPointerNull(ctx.ptr_type);
            break __ring_match261;
          }
          __match_fail(__ring_m261);
        }
        const cap_val = __ring_blk72;
        discard(gen_dup_value(ctx, cap_val));
        const cap_ptr = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, (i + 1), codegen_llvm_ctx$fresh_name(ctx, "ep"));
        discard(LLVMBuildStore(ctx.builder, cap_val, cap_ptr));
        break __ring_match260;
      }
      if (__ring_m260._tag === "none") {
        break __ring_match260;
      }
      __match_fail(__ring_m260);
    }
  }
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const closure_size = LLVMSizeOf(closure_ty);
  const closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], codegen_llvm_ctx$fresh_name(ctx, "cls"));
  const fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
  discard(LLVMBuildStore(ctx.builder, lambda_fn, fn_ptr_slot));
  const env_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
  discard(LLVMBuildStore(ctx.builder, env_alloc, env_ptr_slot));
  return closure_ptr;
}

function build_default_evidence_all(ctx) {
  let effect_names = [];
  const __ring_iter_108 = __List_Iterable.iter(_Map_entries(ctx.effect_ops));
  while (true) {
    const __ring_next_108 = __ListIterator_Iterator.next(__ring_iter_108);
    if (__ring_next_108._tag === "none") break;
    const entry = __ring_next_108._0;
    const __ring_dt8 = entry;
    const ename = __ring_dt8[0];
    const ops = __ring_dt8[1];
    let all_have_defaults = true;
    const __ring_iter_109 = __List_Iterable.iter(ops);
    while (true) {
      const __ring_next_109 = __ListIterator_Iterator.next(__ring_iter_109);
      if (__ring_next_109._tag === "none") break;
      const op = __ring_next_109._0;
      if ((!op.has_default)) {
        all_have_defaults = false;
      }
    }
    if ((all_have_defaults ? (List_len(ops) > 0) : false)) {
      List_push(effect_names, ename);
    }
  }
  List_sort(effect_names, __Str_Ord);
  const __ring_iter_110 = __List_Iterable.iter(effect_names);
  while (true) {
    const __ring_next_110 = __ListIterator_Iterator.next(__ring_iter_110);
    if (__ring_next_110._tag === "none") break;
    const ename = __ring_next_110._0;
    __ring_match262: {
      const __ring_m262 = _Map_get(ctx.effect_ops, ename);
      if (__ring_m262._tag === "some") {
        const ops = __ring_m262._0;
        const n_slots = List_len(ops);
        let slot_types = [ctx.i64_type];
        const __ring_end111 = n_slots;
        for (let i = 0; i < __ring_end111; i++) {
          List_push(slot_types, ctx.ptr_type);
        }
        const ev_ty = LLVMStructTypeInContext(ctx.context, slot_types, 0);
        const ev_size = LLVMSizeOf(ev_ty);
        const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
        const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
        const ev_typeid = LLVMConstInt(ctx.i64_type, 21, 0);
        const ev_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [ev_size, ev_typeid], codegen_llvm_ctx$fresh_name(ctx, "defev"));
        const count_ptr = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "defevcnt"));
        discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, n_slots, 0), count_ptr));
        _Map_insert(ctx.default_evidence, ename, ev_ptr);
        const ev_name = hir$evidence_param_name(ename);
        const ev_alloca = codegen_llvm_ctx$build_entry_alloca(ctx, ctx.ptr_type, ev_name);
        discard(LLVMBuildStore(ctx.builder, ev_ptr, ev_alloca));
        _Map_insert(ctx.named_values, ev_name, ev_alloca);
        const __ring_iter_112 = __List_Iterable.iter(ops);
        while (true) {
          const __ring_next_112 = __ListIterator_Iterator.next(__ring_iter_112);
          if (__ring_next_112._tag === "none") break;
          const op = __ring_next_112._0;
          const slot_idx = hir$effect_op_slot(ctx.effect_ops, ename, op.name);
          const idx = ((slot_idx >= 0) ? slot_idx : 0);
          __ring_match263: {
            const __ring_m263 = op.default_body;
            if (__ring_m263._tag === "some") {
              const dbody = __ring_m263._0;
              const arm_ret_ty = op.return_type;
              const arm_closure = gen_lambda(ctx, op.params, arm_ret_ty, dbody, arm_ret_ty);
              const slot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, (idx + 1), codegen_llvm_ctx$fresh_name(ctx, "defevs"));
              discard(LLVMBuildStore(ctx.builder, arm_closure, slot));
              break __ring_match263;
            }
            if (__ring_m263._tag === "none") {
              const slot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, (idx + 1), codegen_llvm_ctx$fresh_name(ctx, "defevs"));
              discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), slot));
              break __ring_match263;
            }
            __match_fail(__ring_m263);
          }
        }
        break __ring_match262;
      }
      if (__ring_m262._tag === "none") {
        break __ring_match262;
      }
      __match_fail(__ring_m262);
    }
  }
}

function emit_memoised_const_body(ctx, fn_val, mangled, init, intern_fn_name) {
  const g = LLVMAddGlobal(ctx.module, ctx.ptr_type, `__ring_constg_${mangled}`);
  LLVMSetInitializer(g, LLVMConstPointerNull(ctx.ptr_type));
  const saved_fn = ctx.current_fn;
  const saved_named = ctx.named_values;
  ctx.current_fn = Option_some(fn_val);
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  const build_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "build");
  const done_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "done");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const cached = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "cc"));
  const isnull = LLVMBuildICmp(ctx.builder, 32, cached, LLVMConstPointerNull(ctx.ptr_type), codegen_llvm_ctx$fresh_name(ctx, "cn"));
  discard(LLVMBuildCondBr(ctx.builder, isnull, build_bb, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, build_bb);
  const built = gen_llvm_expr(ctx, init);
  const intern_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, intern_fn_name, [ctx.ptr_type], ctx.ptr_type);
  const intern_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, intern_fn_name);
  const interned = LLVMBuildCall2(ctx.builder, intern_ty, intern_fn, [built], codegen_llvm_ctx$fresh_name(ctx, "ci"));
  discard(LLVMBuildStore(ctx.builder, interned, g));
  discard(LLVMBuildBr(ctx.builder, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, done_bb);
  const result = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "cv"));
  discard(LLVMBuildRet(ctx.builder, result));
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
}

function emit_memoised_dict_getter(ctx, name, build_fn, build_fn_ty) {
  const fname = `ring_dict_init_${name}`;
  __ring_match264: {
    const __ring_m264 = _Map_get(ctx.functions, fname);
    if (__ring_m264._tag === "some") {
      const existing = __ring_m264._0;
      return existing;
      break __ring_match264;
    }
    if (__ring_m264._tag === "none") {
      break __ring_match264;
    }
    __match_fail(__ring_m264);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0);
  const fn_val = LLVMAddFunction(ctx.module, fname, fn_ty);
  _Map_insert(ctx.functions, fname, fn_val);
  _Map_insert(ctx.fn_types, fname, fn_ty);
  const g = get_or_create_dict_global(ctx, name);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  const build_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "build");
  const done_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "done");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const cached = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "dc"));
  const isnull = LLVMBuildICmp(ctx.builder, 32, cached, LLVMConstPointerNull(ctx.ptr_type), codegen_llvm_ctx$fresh_name(ctx, "dn"));
  discard(LLVMBuildCondBr(ctx.builder, isnull, build_bb, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, build_bb);
  const built = LLVMBuildCall2(ctx.builder, build_fn_ty, build_fn, [], codegen_llvm_ctx$fresh_name(ctx, "db"));
  discard(LLVMBuildStore(ctx.builder, built, g));
  discard(LLVMBuildBr(ctx.builder, done_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, done_bb);
  const result = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, codegen_llvm_ctx$fresh_name(ctx, "dv"));
  discard(LLVMBuildRet(ctx.builder, result));
  ctx.current_fn = saved_fn;
  LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
  return fn_val;
}

function get_tuple_llvm_type(ctx, count) {
  let elem_types = [];
  const __ring_end113 = count;
  for (let i = 0; i < __ring_end113; i++) {
    List_push(elem_types, ctx.ptr_type);
  }
  return LLVMStructTypeInContext(ctx.context, elem_types, 0);
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


export { gen_llvm_expr, is_boxed_def, build_cell_alloc, build_cell_store, resolve_static_dict_by_name, get_or_create_dict_global, emit_memoised_dict_getter, emit_memoised_const_body, box_int, box_float, box_bool, unbox_to_i1, unbox_int, build_default_evidence_all };