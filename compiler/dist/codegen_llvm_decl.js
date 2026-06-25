import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, compare_by_first as hir$compare_by_first, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_FloatIdentity as hir$FieldAction_FloatIdentity, FieldAction_BoolIdentity as hir$FieldAction_BoolIdentity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { RING_TYPEID_CELL as codegen_llvm_ctx$RING_TYPEID_CELL, RING_TYPEID_CLOSURE_ENV as codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, RING_TYPEID_DICT_DYN as codegen_llvm_ctx$RING_TYPEID_DICT_DYN, RING_TYPEID_DICT_STATIC as codegen_llvm_ctx$RING_TYPEID_DICT_STATIC, build_entry_alloca as codegen_llvm_ctx$build_entry_alloca, fresh_name as codegen_llvm_ctx$fresh_name, get_or_assign_typeid as codegen_llvm_ctx$get_or_assign_typeid, get_or_declare_runtime_fn as codegen_llvm_ctx$get_or_declare_runtime_fn, get_rt_fn_type as codegen_llvm_ctx$get_rt_fn_type, llvm_mangle_fn as codegen_llvm_ctx$llvm_mangle_fn, llvm_mangle_fn_with_prefix as codegen_llvm_ctx$llvm_mangle_fn_with_prefix, llvm_mangle_method as codegen_llvm_ctx$llvm_mangle_method, llvm_resolve_fn as codegen_llvm_ctx$llvm_resolve_fn, llvm_resolve_method as codegen_llvm_ctx$llvm_resolve_method, EnumTypeInfo as codegen_llvm_ctx$EnumTypeInfo, EnumVariantInfo as codegen_llvm_ctx$EnumVariantInfo, ExternFnInfo as codegen_llvm_ctx$ExternFnInfo, ExternParamMarshall_PassthroughPtr as codegen_llvm_ctx$ExternParamMarshall_PassthroughPtr, ExternParamMarshall_StrToCstr as codegen_llvm_ctx$ExternParamMarshall_StrToCstr, ExternParamMarshall_StrToCstrAndLen as codegen_llvm_ctx$ExternParamMarshall_StrToCstrAndLen, ExternParamMarshall_IntToI32 as codegen_llvm_ctx$ExternParamMarshall_IntToI32, ExternParamMarshall_IntToI64 as codegen_llvm_ctx$ExternParamMarshall_IntToI64, ExternParamMarshall_FloatToDouble as codegen_llvm_ctx$ExternParamMarshall_FloatToDouble, ExternParamMarshall_ListToDataAndCount as codegen_llvm_ctx$ExternParamMarshall_ListToDataAndCount, ExternParamMarshall_ListToDataAndCountI64 as codegen_llvm_ctx$ExternParamMarshall_ListToDataAndCountI64, ExternRetMarshall_RetPtr as codegen_llvm_ctx$ExternRetMarshall_RetPtr, ExternRetMarshall_RetVoid as codegen_llvm_ctx$ExternRetMarshall_RetVoid, ExternRetMarshall_RetIntToBoxed as codegen_llvm_ctx$ExternRetMarshall_RetIntToBoxed, ExternRetMarshall_RetStrFromCstr as codegen_llvm_ctx$ExternRetMarshall_RetStrFromCstr, HandleCleanup as codegen_llvm_ctx$HandleCleanup, LlvmCtx as codegen_llvm_ctx$LlvmCtx, StructFieldInfo as codegen_llvm_ctx$StructFieldInfo, __EnumVariantInfo_Clone as codegen_llvm_ctx$__EnumVariantInfo_Clone, __EnumVariantInfo_Debug as codegen_llvm_ctx$__EnumVariantInfo_Debug, __ExternParamMarshall_Eq as codegen_llvm_ctx$__ExternParamMarshall_Eq, __ExternParamMarshall_Clone as codegen_llvm_ctx$__ExternParamMarshall_Clone, __ExternParamMarshall_Ord as codegen_llvm_ctx$__ExternParamMarshall_Ord, __ExternParamMarshall_Debug as codegen_llvm_ctx$__ExternParamMarshall_Debug, __ExternRetMarshall_Eq as codegen_llvm_ctx$__ExternRetMarshall_Eq, __ExternRetMarshall_Clone as codegen_llvm_ctx$__ExternRetMarshall_Clone, __ExternRetMarshall_Ord as codegen_llvm_ctx$__ExternRetMarshall_Ord, __ExternRetMarshall_Debug as codegen_llvm_ctx$__ExternRetMarshall_Debug } from "./codegen_llvm_ctx.js";
import { box_bool as codegen_llvm_expr$box_bool, box_float as codegen_llvm_expr$box_float, box_int as codegen_llvm_expr$box_int, build_cell_alloc as codegen_llvm_expr$build_cell_alloc, build_cell_store as codegen_llvm_expr$build_cell_store, build_default_evidence_all as codegen_llvm_expr$build_default_evidence_all, emit_memoised_const_body as codegen_llvm_expr$emit_memoised_const_body, emit_memoised_dict_getter as codegen_llvm_expr$emit_memoised_dict_getter, gen_llvm_expr as codegen_llvm_expr$gen_llvm_expr, get_or_create_dict_global as codegen_llvm_expr$get_or_create_dict_global, is_boxed_def as codegen_llvm_expr$is_boxed_def, resolve_static_dict_by_name as codegen_llvm_expr$resolve_static_dict_by_name, unbox_int as codegen_llvm_expr$unbox_int, unbox_to_i1 as codegen_llvm_expr$unbox_to_i1 } from "./codegen_llvm_expr.js";
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











































function collect_all_supertraits_llvm(ctx, trait_name) {
  let result = [];
  let visited = set_new();
  let stack = [];
  __ring_match6: {
    const __ring_m6 = _Map_get(ctx.trait_supertraits, trait_name);
    if (__ring_m6._tag === "some") {
      const supers = __ring_m6._0;
      const __ring_iter_2 = __List_Iterable.iter(supers);
      while (true) {
        const __ring_next_2 = __ListIterator_Iterator.next(__ring_iter_2);
        if (__ring_next_2._tag === "none") break;
        const st = __ring_next_2._0;
        List_push(stack, st);
      }
      break __ring_match6;
    }
    if (__ring_m6._tag === "none") {
      break __ring_match6;
    }
    __match_fail(__ring_m6);
  }
  while ((List_len(stack) > 0)) {
    const current = Option_unwrap(List_pop(stack));
    if (_Set_contains(visited, current, __Str_Eq)) {
      continue;
    }
    _Set_insert(visited, current);
    List_push(result, current);
    __ring_match7: {
      const __ring_m7 = _Map_get(ctx.trait_supertraits, current);
      if (__ring_m7._tag === "some") {
        const parent_supers = __ring_m7._0;
        const __ring_iter_3 = __List_Iterable.iter(parent_supers);
        while (true) {
          const __ring_next_3 = __ListIterator_Iterator.next(__ring_iter_3);
          if (__ring_next_3._tag === "none") break;
          const ps = __ring_next_3._0;
          List_push(stack, ps);
        }
        break __ring_match7;
      }
      if (__ring_m7._tag === "none") {
        break __ring_match7;
      }
      __match_fail(__ring_m7);
    }
  }
  return result;
}

function collect_trait_dict_params(bounds, trait_name) {
  let params = [];
  const __ring_iter_4 = __List_Iterable.iter(bounds);
  while (true) {
    const __ring_next_4 = __ListIterator_Iterator.next(__ring_iter_4);
    if (__ring_next_4._tag === "none") break;
    const b = __ring_next_4._0;
    if ((b.trait_name === trait_name)) {
      List_push(params, hir$trait_bound_param_name(b.type_param, b.trait_name));
    }
  }
  return params;
}

function discard(v) {
}

function emit_clone_fn(ctx, type_name) {
  const mangled = codegen_llvm_ctx$llvm_mangle_method(type_name, "clone");
  __ring_match8: {
    const __ring_m8 = _Map_get(ctx.functions, mangled);
    if (__ring_m8._tag === "some") {
      return;
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, [ctx.ptr_type], 0);
  const fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty);
  _Map_insert(ctx.functions, mangled, fn_val);
  _Map_insert(ctx.fn_types, mangled, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  const self_val = LLVMGetParam(fn_val, 0);
  const dup_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_dup", [ctx.ptr_type], ctx.void_type);
  const dup_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_dup");
  discard(LLVMBuildCall2(ctx.builder, dup_ty, dup_fn, [self_val], ""));
  LLVMBuildRet(ctx.builder, self_val);
  ctx.current_fn = saved_fn;
  return LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
}

function is_enum_const_type(ty) {
  __ring_match9: {
    const __ring_m9 = ty;
    if (__ring_m9._tag === "EnumType") {
      return true;
      break __ring_match9;
    }
    return false;
    break __ring_match9;
  }
}

function emit_const_body(ctx, name, init) {
  let __ring_blk0;
  __ring_match10: {
    const __ring_m10 = ctx.module_prefix;
    if (__ring_m10._tag === "some") {
      const prefix = __ring_m10._0;
      __ring_blk0 = codegen_llvm_ctx$llvm_mangle_fn_with_prefix(prefix, name);
      break __ring_match10;
    }
    if (__ring_m10._tag === "none") {
      __ring_blk0 = codegen_llvm_ctx$llvm_mangle_fn(name);
      break __ring_match10;
    }
    __match_fail(__ring_m10);
  }
  const const_fn_name = __ring_blk0;
  __ring_match11: {
    const __ring_m11 = _Map_get(ctx.functions, const_fn_name);
    if (__ring_m11._tag === "some") {
      const fn_val = __ring_m11._0;
      let __ring_blk1;
      __ring_match12: {
        const __ring_m12 = hir$hexpr_type(init);
        if (__ring_m12._tag === "StrType") {
          __ring_blk1 = true;
          break __ring_match12;
        }
        __ring_blk1 = false;
        break __ring_match12;
      }
      const is_str_const = __ring_blk1;
      const is_enum_const = is_enum_const_type(hir$hexpr_type(init));
      if (is_str_const) {
        return codegen_llvm_expr$emit_memoised_const_body(ctx, fn_val, const_fn_name, init, "ring_const_intern");
      } else {
        if (is_enum_const) {
          return codegen_llvm_expr$emit_memoised_const_body(ctx, fn_val, const_fn_name, init, "ring_unit_intern");
        } else {
          const saved_fn = ctx.current_fn;
          ctx.current_fn = Option_some(fn_val);
          const saved_named = ctx.named_values;
          ctx.named_values = map_new();
          const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
          LLVMPositionBuilderAtEnd(ctx.builder, entry);
          const val = codegen_llvm_expr$gen_llvm_expr(ctx, init);
          LLVMBuildRet(ctx.builder, val);
          ctx.named_values = saved_named;
          ctx.current_fn = saved_fn;
        }
      }
      break __ring_match11;
    }
    if (__ring_m11._tag === "none") {
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
}

function gen_str_lit_simple(ctx, s) {
  const str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type);
  const str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_from_cstr");
  const c_str = LLVMBuildGlobalStringPtr(ctx.builder, s, codegen_llvm_ctx$fresh_name(ctx, "str"));
  return LLVMBuildCall2(ctx.builder, str_ty, str_fn, [c_str], codegen_llvm_ctx$fresh_name(ctx, "sl"));
}

function resolve_dict_for_derived(ctx, name) {
  __ring_match13: {
    const __ring_m13 = _Map_get(ctx.named_values, name);
    if (__ring_m13._tag === "some") {
      const alloca = __ring_m13._0;
      return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, codegen_llvm_ctx$fresh_name(ctx, "dp"));
      break __ring_match13;
    }
    if (__ring_m13._tag === "none") {
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
  const init_fn_name = `ring_dict_init_${name}`;
  __ring_match14: {
    const __ring_m14 = _Map_get(ctx.functions, init_fn_name);
    if (__ring_m14._tag === "some") {
      const init_fn = __ring_m14._0;
      let __ring_blk2;
      __ring_match15: {
        const __ring_m15 = _Map_get(ctx.fn_types, init_fn_name);
        if (__ring_m15._tag === "some") {
          const t = __ring_m15._0;
          __ring_blk2 = t;
          break __ring_match15;
        }
        if (__ring_m15._tag === "none") {
          __ring_blk2 = LLVMFunctionType(ctx.ptr_type, [], 0);
          break __ring_match15;
        }
        __match_fail(__ring_m15);
      }
      const init_fn_ty = __ring_blk2;
      return LLVMBuildCall2(ctx.builder, init_fn_ty, init_fn, [], codegen_llvm_ctx$fresh_name(ctx, "dict"));
      break __ring_match14;
    }
    if (__ring_m14._tag === "none") {
      __ring_match16: {
        const __ring_m16 = _Map_get(ctx.dict_globals, name);
        if (__ring_m16._tag === "some") {
          const getter_fn = __ring_m16._0;
          const ft = LLVMFunctionType(ctx.ptr_type, [], 0);
          return LLVMBuildCall2(ctx.builder, ft, getter_fn, [], codegen_llvm_ctx$fresh_name(ctx, "dict"));
          break __ring_match16;
        }
        if (__ring_m16._tag === "none") {
          const name_str = gen_str_lit_simple(ctx, name);
          const bd_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_get_builtin_dict", [ctx.ptr_type], ctx.ptr_type);
          const bd_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_get_builtin_dict");
          return LLVMBuildCall2(ctx.builder, bd_ty, bd_fn, [name_str], codegen_llvm_ctx$fresh_name(ctx, "bd"));
          break __ring_match16;
        }
        __match_fail(__ring_m16);
      }
      break __ring_match14;
    }
    __match_fail(__ring_m14);
  }
}

function emit_dict_debug_call(ctx, val, dict_name, extra_dicts) {
  const dict_ptr = resolve_dict_for_derived(ctx, dict_name);
  const dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type], 0);
  const slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "dbs"));
  const debug_closure = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, codegen_llvm_ctx$fresh_name(ctx, "dbc"));
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, debug_closure, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
  const fn_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, fn_ptr_slot, codegen_llvm_ctx$fresh_name(ctx, "fp"));
  const env_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, debug_closure, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
  const env_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, env_slot, codegen_llvm_ctx$fresh_name(ctx, "ep"));
  let call_args = [env_ptr, val];
  let call_param_types = [ctx.ptr_type, ctx.ptr_type];
  const __ring_iter_5 = __List_Iterable.iter(extra_dicts);
  while (true) {
    const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
    if (__ring_next_5._tag === "none") break;
    const ed = __ring_next_5._0;
    List_push(call_args, resolve_dict_for_derived(ctx, ed));
    List_push(call_param_types, ctx.ptr_type);
  }
  const call_fn_ty = LLVMFunctionType(ctx.ptr_type, call_param_types, 0);
  return LLVMBuildCall2(ctx.builder, call_fn_ty, fn_ptr, call_args, codegen_llvm_ctx$fresh_name(ctx, "dbr"));
}

function llvm_and(ctx, lhs, rhs) {
  return LLVMBuildAnd(ctx.builder, lhs, rhs, codegen_llvm_ctx$fresh_name(ctx, "and"));
}

function llvm_ptrtoint(ctx, val) {
  return LLVMBuildPtrToInt(ctx.builder, val, ctx.i64_type, codegen_llvm_ctx$fresh_name(ctx, "p2i"));
}

function emit_identity_to_debug_str(ctx, val) {
  let __ring_blk3;
  __ring_match17: {
    const __ring_m17 = ctx.current_fn;
    if (__ring_m17._tag === "some") {
      const f = __ring_m17._0;
      __ring_blk3 = f;
      break __ring_match17;
    }
    if (__ring_m17._tag === "none") {
      __ring_blk3 = panic("LLVM codegen: emit_identity_to_debug_str outside function");
      break __ring_match17;
    }
    __match_fail(__ring_m17);
  }
  const current_fn = __ring_blk3;
  const val_int = llvm_ptrtoint(ctx, val);
  const one = LLVMConstInt(ctx.i64_type, 1, 0);
  const tag_bit = llvm_and(ctx, val_int, one);
  const is_tagged = LLVMBuildICmp(ctx.builder, 32, tag_bit, one, codegen_llvm_ctx$fresh_name(ctx, "tag"));
  const tagged_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "dbg.tagged");
  const heap_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "dbg.heap");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "dbg.merge");
  discard(LLVMBuildCondBr(ctx.builder, is_tagged, tagged_bb, heap_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, tagged_bb);
  const raw = codegen_llvm_expr$unbox_int(ctx, val);
  const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.i64_type], ctx.ptr_type);
  const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_int_to_str");
  const tagged_result = LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "its"));
  const tagged_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, heap_bb);
  const dup_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_dup", [ctx.ptr_type], ctx.void_type);
  const dup_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_dup");
  discard(LLVMBuildCall2(ctx.builder, dup_ty, dup_fn, [val], ""));
  const heap_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "dstr"));
  LLVMAddIncoming(phi, [tagged_result, val], [tagged_end, heap_end]);
  return phi;
}

function emit_tuple_debug_str(ctx, val, element_actions) {
  if ((List_len(element_actions) === 0)) {
    return gen_str_lit_simple(ctx, "()");
  }
  const sb_new_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ctx.ptr_type);
  const sb_new_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_new");
  const sb = LLVMBuildCall2(ctx.builder, sb_new_ty, sb_new_fn, [], codegen_llvm_ctx$fresh_name(ctx, "sb"));
  const sb_add_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_add", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
  const sb_add_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_add");
  const drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
  const drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
  const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
  const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
  const open_paren = gen_str_lit_simple(ctx, "(");
  discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, open_paren], codegen_llvm_ctx$fresh_name(ctx, "sba")));
  discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [open_paren], ""));
  const __ring_end6 = List_len(element_actions);
  for (let i = 0; i < __ring_end6; i++) {
    if ((i > 0)) {
      const sep = gen_str_lit_simple(ctx, ", ");
      discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, sep], codegen_llvm_ctx$fresh_name(ctx, "sba")));
      discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sep], ""));
    }
    const idx_val = LLVMConstInt(ctx.i64_type, i, 0);
    const elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [val, idx_val], codegen_llvm_ctx$fresh_name(ctx, "te"));
    const elem_str = emit_debug_field_to_str(ctx, elem, __ring_index(element_actions, i));
    discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, elem_str], codegen_llvm_ctx$fresh_name(ctx, "sba")));
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [elem_str], ""));
  }
  const close_paren = gen_str_lit_simple(ctx, ")");
  discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, close_paren], codegen_llvm_ctx$fresh_name(ctx, "sba")));
  discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [close_paren], ""));
  const sb_to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type);
  const sb_to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_to_str");
  const result = LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], codegen_llvm_ctx$fresh_name(ctx, "dbg"));
  discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""));
  return result;
}

function emit_debug_field_to_str(ctx, val, action) {
  __ring_match18: {
    const __ring_m18 = action;
    if (__ring_m18._tag === "Identity") {
      return emit_identity_to_debug_str(ctx, val);
      break __ring_match18;
    }
    if (__ring_m18._tag === "FloatIdentity") {
      const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
      const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
      const raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], codegen_llvm_ctx$fresh_name(ctx, "uf"));
      const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_float_to_str", [ctx.double_type], ctx.ptr_type);
      const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_float_to_str");
      return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "fts"));
      break __ring_match18;
    }
    if (__ring_m18._tag === "BoolIdentity") {
      const raw = codegen_llvm_expr$unbox_int(ctx, val);
      const to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_bool_to_str", [ctx.i64_type], ctx.ptr_type);
      const to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_bool_to_str");
      return LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], codegen_llvm_ctx$fresh_name(ctx, "bts"));
      break __ring_match18;
    }
    if (__ring_m18._tag === "Call") {
      const dict_name = __ring_m18.dict_name; const extra_dicts = __ring_m18.extra_dicts;
      return emit_dict_debug_call(ctx, val, dict_name, extra_dicts);
      break __ring_match18;
    }
    if (__ring_m18._tag === "Tuple") {
      const element_actions = __ring_m18.element_actions;
      return emit_tuple_debug_str(ctx, val, element_actions);
      break __ring_match18;
    }
    if (__ring_m18._tag === "FnLiteral") {
      return gen_str_lit_simple(ctx, "<fn>");
      break __ring_match18;
    }
    __match_fail(__ring_m18);
  }
}

function emit_default_method_stubs(ctx, target_type, trait_name, impl_methods) {
  let impl_method_names = set_new();
  const __ring_iter_7 = __List_Iterable.iter(impl_methods);
  while (true) {
    const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
    if (__ring_next_7._tag === "none") break;
    const m = __ring_next_7._0;
    __ring_match19: {
      const __ring_m19 = m;
      if (__ring_m19._tag === "Fn") {
        const name = __ring_m19.name;
        _Set_insert(impl_method_names, name);
        break __ring_match19;
      }
      break __ring_match19;
    }
  }
  if (Option_is_none(_Map_get(ctx.trait_method_order, trait_name))) {
    return;
  }
  let __ring_blk4;
  __ring_match20: {
    const __ring_m20 = _Map_get(ctx.trait_method_order, trait_name);
    if (__ring_m20._tag === "some") {
      const order = __ring_m20._0;
      __ring_blk4 = order;
      break __ring_match20;
    }
    if (__ring_m20._tag === "none") {
      __ring_blk4 = [];
      break __ring_match20;
    }
    __match_fail(__ring_m20);
  }
  const method_order = __ring_blk4;
  const all_supers = collect_all_supertraits_llvm(ctx, trait_name);
  const super_count = List_len(all_supers);
  const __ring_iter_8 = __List_Iterable.iter(method_order);
  while (true) {
    const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
    if (__ring_next_8._tag === "none") break;
    const method_name = __ring_next_8._0;
    if (_Set_contains(impl_method_names, method_name, __Str_Eq)) {
      continue;
    }
    const default_fn_name = `__${trait_name}_${method_name}`;
    __ring_match21: {
      const __ring_m21 = _Map_get(ctx.functions, default_fn_name);
      if (__ring_m21._tag === "some") {
        const default_fn = __ring_m21._0;
        const mangled = codegen_llvm_ctx$llvm_mangle_method(target_type, method_name);
        if (Option_is_some(_Map_get(ctx.functions, mangled))) {
          continue;
        }
        const default_arity = LLVMCountParams(default_fn);
        const stub_arity = ((default_arity - 1) - super_count);
        let stub_param_types = [];
        const __ring_end9 = stub_arity;
        for (let i = 0; i < __ring_end9; i++) {
          List_push(stub_param_types, ctx.ptr_type);
        }
        const stub_fn_ty = LLVMFunctionType(ctx.ptr_type, stub_param_types, 0);
        const stub_fn = LLVMAddFunction(ctx.module, mangled, stub_fn_ty);
        _Map_insert(ctx.functions, mangled, stub_fn);
        _Map_insert(ctx.fn_types, mangled, stub_fn_ty);
        __ring_match22: {
          const __ring_m22 = _Map_get(ctx.fn_evidence_params, default_fn_name);
          if (__ring_m22._tag === "some") {
            const ev_params = __ring_m22._0;
            _Map_insert(ctx.fn_evidence_params, mangled, ev_params);
            break __ring_match22;
          }
          if (__ring_m22._tag === "none") {
            break __ring_match22;
          }
          __match_fail(__ring_m22);
        }
        const saved_block = LLVMGetInsertBlock(ctx.builder);
        const entry = LLVMAppendBasicBlockInContext(ctx.context, stub_fn, "entry");
        LLVMPositionBuilderAtEnd(ctx.builder, entry);
        const dict_name = hir$trait_dict_name(target_type, trait_name);
        const dict_ptr = codegen_llvm_expr$resolve_static_dict_by_name(ctx, dict_name);
        let __ring_blk5;
        __ring_match23: {
          const __ring_m23 = _Map_get(ctx.fn_types, default_fn_name);
          if (__ring_m23._tag === "some") {
            const t = __ring_m23._0;
            __ring_blk5 = t;
            break __ring_match23;
          }
          if (__ring_m23._tag === "none") {
            let pts = [];
            const __ring_end10 = default_arity;
            for (let i = 0; i < __ring_end10; i++) {
              List_push(pts, ctx.ptr_type);
            }
            __ring_blk5 = LLVMFunctionType(ctx.ptr_type, pts, 0);
            break __ring_match23;
          }
          __match_fail(__ring_m23);
        }
        const default_fn_ty = __ring_blk5;
        let call_args = [dict_ptr];
        const __ring_iter_11 = __List_Iterable.iter(all_supers);
        while (true) {
          const __ring_next_11 = __ListIterator_Iterator.next(__ring_iter_11);
          if (__ring_next_11._tag === "none") break;
          const st = __ring_next_11._0;
          const st_dict_name = hir$trait_dict_name(target_type, st);
          const st_dict_ptr = codegen_llvm_expr$resolve_static_dict_by_name(ctx, st_dict_name);
          List_push(call_args, st_dict_ptr);
        }
        const __ring_end12 = stub_arity;
        for (let i = 0; i < __ring_end12; i++) {
          List_push(call_args, LLVMGetParam(stub_fn, i));
        }
        const result = LLVMBuildCall2(ctx.builder, default_fn_ty, default_fn, call_args, codegen_llvm_ctx$fresh_name(ctx, "dflt"));
        LLVMBuildRet(ctx.builder, result);
        LLVMPositionBuilderAtEnd(ctx.builder, saved_block);
        break __ring_match21;
      }
      if (__ring_m21._tag === "none") {
        break __ring_match21;
      }
      __match_fail(__ring_m21);
    }
  }
}

function emit_default_method_thunk(ctx, default_fn_name, default_fn, target_type, trait_name) {
  const thunk_name = `${default_fn_name}__defaultthunk_${target_type}`;
  __ring_match24: {
    const __ring_m24 = _Map_get(ctx.functions, thunk_name);
    if (__ring_m24._tag === "some") {
      const existing = __ring_m24._0;
      return existing;
      break __ring_match24;
    }
    if (__ring_m24._tag === "none") {
      break __ring_match24;
    }
    __match_fail(__ring_m24);
  }
  const all_supers = collect_all_supertraits_llvm(ctx, trait_name);
  const super_count = List_len(all_supers);
  const default_arity = LLVMCountParams(default_fn);
  const thunk_arity = (default_arity - super_count);
  let thunk_param_types = [];
  const __ring_end13 = thunk_arity;
  for (let i = 0; i < __ring_end13; i++) {
    List_push(thunk_param_types, ctx.ptr_type);
  }
  const thunk_ty = LLVMFunctionType(ctx.ptr_type, thunk_param_types, 0);
  const thunk_fn = LLVMAddFunction(ctx.module, thunk_name, thunk_ty);
  _Map_insert(ctx.functions, thunk_name, thunk_fn);
  _Map_insert(ctx.fn_types, thunk_name, thunk_ty);
  let __ring_blk6;
  __ring_match25: {
    const __ring_m25 = _Map_get(ctx.fn_types, default_fn_name);
    if (__ring_m25._tag === "some") {
      const t = __ring_m25._0;
      __ring_blk6 = t;
      break __ring_match25;
    }
    if (__ring_m25._tag === "none") {
      let pts = [];
      const __ring_end14 = default_arity;
      for (let i = 0; i < __ring_end14; i++) {
        List_push(pts, ctx.ptr_type);
      }
      __ring_blk6 = LLVMFunctionType(ctx.ptr_type, pts, 0);
      break __ring_match25;
    }
    __match_fail(__ring_m25);
  }
  const default_ty = __ring_blk6;
  const saved_block = LLVMGetInsertBlock(ctx.builder);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, thunk_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  let fwd_args = [];
  List_push(fwd_args, LLVMGetParam(thunk_fn, 0));
  const __ring_iter_15 = __List_Iterable.iter(all_supers);
  while (true) {
    const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
    if (__ring_next_15._tag === "none") break;
    const st = __ring_next_15._0;
    const st_dict_name = hir$trait_dict_name(target_type, st);
    const st_dict_ptr = codegen_llvm_expr$resolve_static_dict_by_name(ctx, st_dict_name);
    List_push(fwd_args, st_dict_ptr);
  }
  const __ring_end16 = thunk_arity;
  for (let i = 1; i < __ring_end16; i++) {
    List_push(fwd_args, LLVMGetParam(thunk_fn, i));
  }
  const call_res = LLVMBuildCall2(ctx.builder, default_ty, default_fn, fwd_args, codegen_llvm_ctx$fresh_name(ctx, "dtk"));
  LLVMBuildRet(ctx.builder, call_res);
  LLVMPositionBuilderAtEnd(ctx.builder, saved_block);
  return thunk_fn;
}

function emit_dict_method_thunk(ctx, mangled, method_fn) {
  const thunk_name = `${mangled}__dictthunk`;
  __ring_match26: {
    const __ring_m26 = _Map_get(ctx.functions, thunk_name);
    if (__ring_m26._tag === "some") {
      const existing = __ring_m26._0;
      return existing;
      break __ring_match26;
    }
    if (__ring_m26._tag === "none") {
      break __ring_match26;
    }
    __match_fail(__ring_m26);
  }
  const method_arity = LLVMCountParams(method_fn);
  let thunk_param_types = [ctx.ptr_type];
  const __ring_end17 = method_arity;
  for (let i = 0; i < __ring_end17; i++) {
    List_push(thunk_param_types, ctx.ptr_type);
  }
  const thunk_ty = LLVMFunctionType(ctx.ptr_type, thunk_param_types, 0);
  const thunk_fn = LLVMAddFunction(ctx.module, thunk_name, thunk_ty);
  _Map_insert(ctx.functions, thunk_name, thunk_fn);
  _Map_insert(ctx.fn_types, thunk_name, thunk_ty);
  let __ring_blk7;
  __ring_match27: {
    const __ring_m27 = _Map_get(ctx.fn_types, mangled);
    if (__ring_m27._tag === "some") {
      const t = __ring_m27._0;
      __ring_blk7 = t;
      break __ring_match27;
    }
    if (__ring_m27._tag === "none") {
      let method_param_types = [];
      const __ring_end18 = method_arity;
      for (let i = 0; i < __ring_end18; i++) {
        List_push(method_param_types, ctx.ptr_type);
      }
      __ring_blk7 = LLVMFunctionType(ctx.ptr_type, method_param_types, 0);
      break __ring_match27;
    }
    __match_fail(__ring_m27);
  }
  const method_ty = __ring_blk7;
  const saved_block = LLVMGetInsertBlock(ctx.builder);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, thunk_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  let fwd_args = [];
  const __ring_end19 = method_arity;
  for (let i = 0; i < __ring_end19; i++) {
    List_push(fwd_args, LLVMGetParam(thunk_fn, (i + 1)));
  }
  const call_res = LLVMBuildCall2(ctx.builder, method_ty, method_fn, fwd_args, codegen_llvm_ctx$fresh_name(ctx, "tk"));
  LLVMBuildRet(ctx.builder, call_res);
  LLVMPositionBuilderAtEnd(ctx.builder, saved_block);
  return thunk_fn;
}

function emit_dict_method_slot(ctx, target_type, trait_name, method_name, dict_struct_ty, dict_ptr, closure_ty, closure_size, alloc_fn, alloc_ty, slot_idx) {
  const mangled = codegen_llvm_ctx$llvm_mangle_method(target_type, method_name);
  const closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0);
  __ring_match28: {
    const __ring_m28 = _Map_get(ctx.functions, mangled);
    if (__ring_m28._tag === "some") {
      const method_fn = __ring_m28._0;
      const thunk_fn = emit_dict_method_thunk(ctx, mangled, method_fn);
      const closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], codegen_llvm_ctx$fresh_name(ctx, "cls"));
      const fn_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
      LLVMBuildStore(ctx.builder, thunk_fn, fn_slot);
      const env_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
      LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), env_slot);
      const slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (slot_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ds"));
      return LLVMBuildStore(ctx.builder, closure_ptr, slot_ptr);
      break __ring_match28;
    }
    if (__ring_m28._tag === "none") {
      const default_fn_name = `__${trait_name}_${method_name}`;
      __ring_match29: {
        const __ring_m29 = _Map_get(ctx.functions, default_fn_name);
        if (__ring_m29._tag === "some") {
          const default_fn = __ring_m29._0;
          const thunk_fn = emit_default_method_thunk(ctx, default_fn_name, default_fn, target_type, trait_name);
          const closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], codegen_llvm_ctx$fresh_name(ctx, "cls"));
          const fn_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
          LLVMBuildStore(ctx.builder, thunk_fn, fn_slot);
          const env_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
          LLVMBuildStore(ctx.builder, dict_ptr, env_slot);
          const slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (slot_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ds"));
          return LLVMBuildStore(ctx.builder, closure_ptr, slot_ptr);
          break __ring_match29;
        }
        if (__ring_m29._tag === "none") {
          const slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (slot_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ds"));
          return LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), slot_ptr);
          break __ring_match29;
        }
        __match_fail(__ring_m29);
      }
      break __ring_match28;
    }
    __match_fail(__ring_m28);
  }
}

function emit_derived_trait_dict(ctx, target_type, trait_name) {
  const dict_name = hir$trait_dict_name(target_type, trait_name);
  if (Option_is_none(_Map_get(ctx.trait_method_order, trait_name))) {
    return;
  }
  let __ring_blk8;
  __ring_match30: {
    const __ring_m30 = _Map_get(ctx.trait_method_order, trait_name);
    if (__ring_m30._tag === "some") {
      const order = __ring_m30._0;
      __ring_blk8 = order;
      break __ring_match30;
    }
    if (__ring_m30._tag === "none") {
      __ring_blk8 = panic("unreachable");
      break __ring_match30;
    }
    __match_fail(__ring_m30);
  }
  const method_order = __ring_blk8;
  const method_count = List_len(method_order);
  if ((method_count === 0)) {
    return;
  }
  const build_fn_name = `ring_dict_build_${dict_name}`;
  __ring_match31: {
    const __ring_m31 = _Map_get(ctx.functions, build_fn_name);
    if (__ring_m31._tag === "some") {
      return;
      break __ring_match31;
    }
    if (__ring_m31._tag === "none") {
      break __ring_match31;
    }
    __match_fail(__ring_m31);
  }
  const build_fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0);
  const build_fn = LLVMAddFunction(ctx.module, build_fn_name, build_fn_ty);
  _Map_insert(ctx.functions, build_fn_name, build_fn);
  _Map_insert(ctx.fn_types, build_fn_name, build_fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(build_fn);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, build_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  let dict_elem_types = [ctx.i64_type];
  const __ring_end20 = method_count;
  for (let i = 0; i < __ring_end20; i++) {
    List_push(dict_elem_types, ctx.ptr_type);
  }
  const dict_struct_ty = LLVMStructTypeInContext(ctx.context, dict_elem_types, 0);
  const dict_size = LLVMSizeOf(dict_struct_ty);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const dict_typeid = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$RING_TYPEID_DICT_STATIC, 0);
  const dict_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [dict_size, dict_typeid], "dict");
  const count_slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 0, "dcnt");
  LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, method_count, 0), count_slot);
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const closure_size = LLVMSizeOf(closure_ty);
  const __ring_end21 = method_count;
  for (let i = 0; i < __ring_end21; i++) {
    __ring_match32: {
      const __ring_m32 = List_get(method_order, i);
      if (__ring_m32._tag === "some") {
        const method_name = __ring_m32._0;
        const _ = emit_dict_method_slot(ctx, target_type, trait_name, method_name, dict_struct_ty, dict_ptr, closure_ty, closure_size, alloc_fn, alloc_ty, i);
        break __ring_match32;
      }
      if (__ring_m32._tag === "none") {
        break __ring_match32;
      }
      __match_fail(__ring_m32);
    }
  }
  LLVMBuildRet(ctx.builder, dict_ptr);
  ctx.current_fn = saved_fn;
  const getter = codegen_llvm_expr$emit_memoised_dict_getter(ctx, dict_name, build_fn, build_fn_ty);
  _Map_insert(ctx.dict_globals, dict_name, getter);
  ctx.current_fn = saved_fn;
  return LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
}

function emit_derived_clone_llvm(ctx, di) {
  const type_name = di.type_name;
  emit_clone_fn(ctx, type_name);
  return emit_derived_trait_dict(ctx, type_name, "Clone");
}

function emit_enum_variant_debug_str(ctx, self_val, type_name, variant, enum_info) {
  const sb_new_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ctx.ptr_type);
  const sb_new_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_new");
  const sb = LLVMBuildCall2(ctx.builder, sb_new_ty, sb_new_fn, [], codegen_llvm_ctx$fresh_name(ctx, "sb"));
  const sb_add_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_add", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
  const sb_add_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_add");
  const drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
  const drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
  if (variant.has_named_fields) {
    const prefix = gen_str_lit_simple(ctx, `${variant.name} { `);
    discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, prefix], codegen_llvm_ctx$fresh_name(ctx, "sba")));
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [prefix], ""));
  } else {
    const prefix = gen_str_lit_simple(ctx, `${variant.name}(`);
    discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, prefix], codegen_llvm_ctx$fresh_name(ctx, "sba")));
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [prefix], ""));
  }
  if (Option_is_none(_Map_get(enum_info.variants, variant.name))) {
    const sb_to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type);
    const sb_to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_to_str");
    const result = LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], codegen_llvm_ctx$fresh_name(ctx, "dbg"));
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""));
    return result;
  }
  const __ring_end22 = List_len(variant.fields);
  for (let fi = 0; fi < __ring_end22; fi++) {
    const field = __ring_index(variant.fields, fi);
    if ((fi > 0)) {
      const sep = gen_str_lit_simple(ctx, ", ");
      discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, sep], codegen_llvm_ctx$fresh_name(ctx, "sba")));
      discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sep], ""));
    }
    if (variant.has_named_fields) {
      const label = gen_str_lit_simple(ctx, `${field.name}: `);
      discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, label], codegen_llvm_ctx$fresh_name(ctx, "sba")));
      discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [label], ""));
    }
    const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, self_val, (fi + 1), codegen_llvm_ctx$fresh_name(ctx, "efp"));
    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "efv"));
    const str_val = emit_debug_field_to_str(ctx, field_val, field.action);
    discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], codegen_llvm_ctx$fresh_name(ctx, "sba")));
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [str_val], ""));
  }
  const suffix = (variant.has_named_fields ? gen_str_lit_simple(ctx, " }") : gen_str_lit_simple(ctx, ")"));
  discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, suffix], codegen_llvm_ctx$fresh_name(ctx, "sba")));
  discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [suffix], ""));
  const sb_to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type);
  const sb_to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_to_str");
  const result = LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], codegen_llvm_ctx$fresh_name(ctx, "dbg"));
  discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""));
  return result;
}

function setup_derived_dict_params(ctx, fn_val, dict_params, start_idx) {
  let param_idx = start_idx;
  const __ring_iter_23 = __List_Iterable.iter(dict_params);
  while (true) {
    const __ring_next_23 = __ListIterator_Iterator.next(__ring_iter_23);
    if (__ring_next_23._tag === "none") break;
    const dp = __ring_next_23._0;
    const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, dp);
    LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca);
    _Map_insert(ctx.named_values, dp, alloca);
    param_idx = (param_idx + 1);
  }
}

function emit_enum_debug_fn(ctx, type_name, variants, bounds) {
  const mangled = codegen_llvm_ctx$llvm_mangle_method(type_name, "debug");
  __ring_match33: {
    const __ring_m33 = _Map_get(ctx.functions, mangled);
    if (__ring_m33._tag === "some") {
      return;
      break __ring_match33;
    }
    if (__ring_m33._tag === "none") {
      break __ring_match33;
    }
    __match_fail(__ring_m33);
  }
  const dict_params = collect_trait_dict_params(bounds, "Debug");
  let param_types = [ctx.ptr_type];
  const __ring_iter_24 = __List_Iterable.iter(dict_params);
  while (true) {
    const __ring_next_24 = __ListIterator_Iterator.next(__ring_iter_24);
    if (__ring_next_24._tag === "none") break;
    const dp = __ring_next_24._0;
    List_push(param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0);
  const fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty);
  _Map_insert(ctx.functions, mangled, fn_val);
  _Map_insert(ctx.fn_types, mangled, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  setup_derived_dict_params(ctx, fn_val, dict_params, 1);
  const self_val = LLVMGetParam(fn_val, 0);
  if (Option_is_none(_Map_get(ctx.enum_types, type_name))) {
    const result = gen_str_lit_simple(ctx, type_name);
    LLVMBuildRet(ctx.builder, result);
    ctx.current_fn = saved_fn;
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
    return;
  }
  let __ring_blk9;
  __ring_match34: {
    const __ring_m34 = _Map_get(ctx.enum_types, type_name);
    if (__ring_m34._tag === "some") {
      const info = __ring_m34._0;
      __ring_blk9 = info;
      break __ring_match34;
    }
    if (__ring_m34._tag === "none") {
      __ring_blk9 = panic("unreachable");
      break __ring_match34;
    }
    __match_fail(__ring_m34);
  }
  const enum_info = __ring_blk9;
  const tag_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type], 0);
  const tag_ptr = LLVMBuildStructGEP2(ctx.builder, tag_ty, self_val, 0, codegen_llvm_ctx$fresh_name(ctx, "tp"));
  const tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "tv"));
  const default_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "dbg.default");
  const switch_val = LLVMBuildSwitch(ctx.builder, tag_val, default_bb, List_len(variants));
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "dbg.merge");
  let incoming_vals = [];
  let incoming_bbs = [];
  const __ring_end25 = List_len(variants);
  for (let vi = 0; vi < __ring_end25; vi++) {
    const variant = __ring_index(variants, vi);
    let __ring_blk10;
    __ring_match35: {
      const __ring_m35 = _Map_get(enum_info.variants, variant.name);
      if (__ring_m35._tag === "some") {
        const vinfo = __ring_m35._0;
        __ring_blk10 = vinfo.tag;
        break __ring_match35;
      }
      if (__ring_m35._tag === "none") {
        __ring_blk10 = vi;
        break __ring_match35;
      }
      __match_fail(__ring_m35);
    }
    const var_tag = __ring_blk10;
    const case_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, `dbg.${variant.name}`);
    LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, var_tag, 0), case_bb);
    LLVMPositionBuilderAtEnd(ctx.builder, case_bb);
    const case_result = ((List_len(variant.fields) === 0) ? gen_str_lit_simple(ctx, variant.name) : emit_enum_variant_debug_str(ctx, self_val, type_name, variant, enum_info));
    List_push(incoming_vals, case_result);
    const end_bb = LLVMGetInsertBlock(ctx.builder);
    List_push(incoming_bbs, end_bb);
    discard(LLVMBuildBr(ctx.builder, merge_bb));
  }
  LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
  const default_result = gen_str_lit_simple(ctx, type_name);
  List_push(incoming_vals, default_result);
  List_push(incoming_bbs, default_bb);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "dbgr"));
  LLVMAddIncoming(phi, incoming_vals, incoming_bbs);
  LLVMBuildRet(ctx.builder, phi);
  ctx.current_fn = saved_fn;
  return LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
}

function find_field_index(field_names, target) {
  const __ring_end26 = List_len(field_names);
  for (let i = 0; i < __ring_end26; i++) {
    if ((__ring_index(field_names, i) === target)) {
      return i;
    }
  }
  return (0 - 1);
}

function emit_struct_debug_fn(ctx, type_name, fields, bounds) {
  const mangled = codegen_llvm_ctx$llvm_mangle_method(type_name, "debug");
  __ring_match36: {
    const __ring_m36 = _Map_get(ctx.functions, mangled);
    if (__ring_m36._tag === "some") {
      return;
      break __ring_match36;
    }
    if (__ring_m36._tag === "none") {
      break __ring_match36;
    }
    __match_fail(__ring_m36);
  }
  const dict_params = collect_trait_dict_params(bounds, "Debug");
  let param_types = [ctx.ptr_type];
  const __ring_iter_27 = __List_Iterable.iter(dict_params);
  while (true) {
    const __ring_next_27 = __ListIterator_Iterator.next(__ring_iter_27);
    if (__ring_next_27._tag === "none") break;
    const dp = __ring_next_27._0;
    List_push(param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0);
  const fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty);
  _Map_insert(ctx.functions, mangled, fn_val);
  _Map_insert(ctx.fn_types, mangled, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  setup_derived_dict_params(ctx, fn_val, dict_params, 1);
  const self_val = LLVMGetParam(fn_val, 0);
  if ((List_len(fields) === 0)) {
    const result = gen_str_lit_simple(ctx, type_name);
    LLVMBuildRet(ctx.builder, result);
    ctx.current_fn = saved_fn;
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
    return;
  }
  const sb_new_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ctx.ptr_type);
  const sb_new_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_new");
  const sb = LLVMBuildCall2(ctx.builder, sb_new_ty, sb_new_fn, [], codegen_llvm_ctx$fresh_name(ctx, "sb"));
  const sb_add_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_add", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
  const sb_add_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_add");
  const drop_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type);
  const drop_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_drop");
  const prefix = gen_str_lit_simple(ctx, `${type_name} { `);
  discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, prefix], codegen_llvm_ctx$fresh_name(ctx, "sba")));
  discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [prefix], ""));
  if (Option_is_none(_Map_get(ctx.struct_types, type_name))) {
    const result = gen_str_lit_simple(ctx, type_name);
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""));
    LLVMBuildRet(ctx.builder, result);
    ctx.current_fn = saved_fn;
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
    return;
  }
  let __ring_blk11;
  __ring_match37: {
    const __ring_m37 = _Map_get(ctx.struct_types, type_name);
    if (__ring_m37._tag === "some") {
      const info = __ring_m37._0;
      __ring_blk11 = info;
      break __ring_match37;
    }
    if (__ring_m37._tag === "none") {
      __ring_blk11 = panic("unreachable");
      break __ring_match37;
    }
    __match_fail(__ring_m37);
  }
  const struct_info = __ring_blk11;
  const __ring_end28 = List_len(fields);
  for (let fi = 0; fi < __ring_end28; fi++) {
    const field = __ring_index(fields, fi);
    if ((fi > 0)) {
      const sep = gen_str_lit_simple(ctx, ", ");
      discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, sep], codegen_llvm_ctx$fresh_name(ctx, "sba")));
      discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sep], ""));
    }
    const label = gen_str_lit_simple(ctx, `${field.name}: `);
    discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, label], codegen_llvm_ctx$fresh_name(ctx, "sba")));
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [label], ""));
    const field_idx = find_field_index(struct_info.field_names, field.name);
    if ((field_idx < 0)) {
      continue;
    }
    const field_ptr = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, self_val, field_idx, codegen_llvm_ctx$fresh_name(ctx, "fp"));
    const field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, codegen_llvm_ctx$fresh_name(ctx, "fv"));
    const str_val = emit_debug_field_to_str(ctx, field_val, field.action);
    discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], codegen_llvm_ctx$fresh_name(ctx, "sba")));
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [str_val], ""));
  }
  const suffix = gen_str_lit_simple(ctx, " }");
  discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, suffix], codegen_llvm_ctx$fresh_name(ctx, "sba")));
  discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [suffix], ""));
  const sb_to_str_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type);
  const sb_to_str_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_sb_to_str");
  const result = LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], codegen_llvm_ctx$fresh_name(ctx, "dbg"));
  discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""));
  LLVMBuildRet(ctx.builder, result);
  ctx.current_fn = saved_fn;
  return LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
}

function emit_derived_debug_llvm(ctx, di) {
  const type_name = di.type_name;
  let emitted = false;
  __ring_match38: {
    const __ring_m38 = di.type_kind;
    if (__ring_m38._tag === "StructKind") {
      __ring_match39: {
        const __ring_m39 = di.struct_fields;
        if (__ring_m39._tag === "some") {
          const fields = __ring_m39._0;
          emit_struct_debug_fn(ctx, type_name, fields, di.bounds);
          emitted = true;
          break __ring_match39;
        }
        if (__ring_m39._tag === "none") {
          break __ring_match39;
        }
        __match_fail(__ring_m39);
      }
      break __ring_match38;
    }
    if (__ring_m38._tag === "EnumKind") {
      __ring_match40: {
        const __ring_m40 = di.enum_variants;
        if (__ring_m40._tag === "some") {
          const variants = __ring_m40._0;
          emit_enum_debug_fn(ctx, type_name, variants, di.bounds);
          emitted = true;
          break __ring_match40;
        }
        if (__ring_m40._tag === "none") {
          break __ring_match40;
        }
        __match_fail(__ring_m40);
      }
      break __ring_match38;
    }
    __match_fail(__ring_m38);
  }
  if (emitted) {
    return emit_derived_trait_dict(ctx, type_name, "Debug");
  }
}

function emit_dict_eq_call(ctx, lhs, rhs, dict_name, extra_dicts) {
  const dict_ptr = resolve_dict_for_derived(ctx, dict_name);
  const dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0);
  const slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "eqs"));
  const eq_closure = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, codegen_llvm_ctx$fresh_name(ctx, "eqc"));
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, eq_closure, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
  const fn_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, fn_ptr_slot, codegen_llvm_ctx$fresh_name(ctx, "fp"));
  const env_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, eq_closure, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
  const env_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, env_slot, codegen_llvm_ctx$fresh_name(ctx, "ep"));
  let call_args = [env_ptr, lhs, rhs];
  let call_param_types = [ctx.ptr_type, ctx.ptr_type, ctx.ptr_type];
  const __ring_iter_29 = __List_Iterable.iter(extra_dicts);
  while (true) {
    const __ring_next_29 = __ListIterator_Iterator.next(__ring_iter_29);
    if (__ring_next_29._tag === "none") break;
    const ed = __ring_next_29._0;
    List_push(call_args, resolve_dict_for_derived(ctx, ed));
    List_push(call_param_types, ctx.ptr_type);
  }
  const call_fn_ty = LLVMFunctionType(ctx.ptr_type, call_param_types, 0);
  const result = LLVMBuildCall2(ctx.builder, call_fn_ty, fn_ptr, call_args, codegen_llvm_ctx$fresh_name(ctx, "deq"));
  const raw = codegen_llvm_expr$unbox_int(ctx, result);
  return LLVMBuildICmp(ctx.builder, 33, raw, LLVMConstInt(ctx.i64_type, 0, 0), codegen_llvm_ctx$fresh_name(ctx, "di1"));
}

function emit_float_identity_eq_cmp(ctx, lhs, rhs) {
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
  const lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], codegen_llvm_ctx$fresh_name(ctx, "lf"));
  const rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], codegen_llvm_ctx$fresh_name(ctx, "rf"));
  return LLVMBuildFCmp(ctx.builder, 1, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "feq"));
}

function emit_identity_eq_cmp(ctx, lhs, rhs) {
  let __ring_blk12;
  __ring_match41: {
    const __ring_m41 = ctx.current_fn;
    if (__ring_m41._tag === "some") {
      const f = __ring_m41._0;
      __ring_blk12 = f;
      break __ring_match41;
    }
    if (__ring_m41._tag === "none") {
      __ring_blk12 = panic("LLVM codegen: emit_identity_eq_cmp outside function");
      break __ring_match41;
    }
    __match_fail(__ring_m41);
  }
  const current_fn = __ring_blk12;
  const lhs_int = llvm_ptrtoint(ctx, lhs);
  const rhs_int = llvm_ptrtoint(ctx, rhs);
  const one = LLVMConstInt(ctx.i64_type, 1, 0);
  const lhs_tag = llvm_and(ctx, lhs_int, one);
  const is_tagged = LLVMBuildICmp(ctx.builder, 32, lhs_tag, one, codegen_llvm_ctx$fresh_name(ctx, "tag"));
  const tagged_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "eq.tagged");
  const heap_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "eq.heap");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "eq.merge");
  discard(LLVMBuildCondBr(ctx.builder, is_tagged, tagged_bb, heap_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, tagged_bb);
  const tagged_eq = LLVMBuildICmp(ctx.builder, 32, lhs_int, rhs_int, codegen_llvm_ctx$fresh_name(ctx, "teq"));
  const tagged_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, heap_bb);
  const eq_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type);
  const eq_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_str_eq");
  const heap_result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "heq"));
  const heap_eq = LLVMBuildICmp(ctx.builder, 33, heap_result, LLVMConstInt(ctx.i64_type, 0, 0), codegen_llvm_ctx$fresh_name(ctx, "hne"));
  const heap_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const phi = LLVMBuildPhi(ctx.builder, ctx.i1_type, codegen_llvm_ctx$fresh_name(ctx, "feq"));
  LLVMAddIncoming(phi, [tagged_eq, heap_eq], [tagged_end, heap_end]);
  return phi;
}

function emit_tuple_eq_cmp(ctx, lhs, rhs, element_actions) {
  if ((List_len(element_actions) === 0)) {
    return LLVMBuildICmp(ctx.builder, 32, LLVMConstInt(ctx.i64_type, 0, 0), LLVMConstInt(ctx.i64_type, 0, 0), codegen_llvm_ctx$fresh_name(ctx, "ttrue"));
  }
  let __ring_blk13;
  __ring_match42: {
    const __ring_m42 = ctx.current_fn;
    if (__ring_m42._tag === "some") {
      const f = __ring_m42._0;
      __ring_blk13 = f;
      break __ring_match42;
    }
    if (__ring_m42._tag === "none") {
      __ring_blk13 = panic("LLVM codegen: emit_tuple_eq_cmp outside function");
      break __ring_match42;
    }
    __match_fail(__ring_m42);
  }
  const current_fn = __ring_blk13;
  const get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
  const get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
  const ret_false_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tup.false");
  const ret_true_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tup.true");
  const __ring_end30 = List_len(element_actions);
  for (let i = 0; i < __ring_end30; i++) {
    const idx_val = LLVMConstInt(ctx.i64_type, i, 0);
    const lhs_elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [lhs, idx_val], codegen_llvm_ctx$fresh_name(ctx, "le"));
    const rhs_elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [rhs, idx_val], codegen_llvm_ctx$fresh_name(ctx, "re"));
    const elem_eq = emit_field_eq_cmp(ctx, lhs_elem, rhs_elem, __ring_index(element_actions, i));
    const next_bb = (((i + 1) < List_len(element_actions)) ? LLVMAppendBasicBlockInContext(ctx.context, current_fn, `tup.${(i + 1)}`) : ret_true_bb);
    discard(LLVMBuildCondBr(ctx.builder, elem_eq, next_bb, ret_false_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
  }
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tup.merge");
  const true_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, ret_false_bb);
  const false_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const phi = LLVMBuildPhi(ctx.builder, ctx.i1_type, codegen_llvm_ctx$fresh_name(ctx, "teq"));
  const true_i1 = LLVMBuildICmp(ctx.builder, 32, LLVMConstInt(ctx.i64_type, 0, 0), LLVMConstInt(ctx.i64_type, 0, 0), codegen_llvm_ctx$fresh_name(ctx, "t"));
  const false_i1 = LLVMBuildICmp(ctx.builder, 33, LLVMConstInt(ctx.i64_type, 0, 0), LLVMConstInt(ctx.i64_type, 0, 0), codegen_llvm_ctx$fresh_name(ctx, "f"));
  LLVMAddIncoming(phi, [true_i1, false_i1], [true_end, false_end]);
  return phi;
}

function emit_field_eq_cmp(ctx, lhs, rhs, action) {
  __ring_match43: {
    const __ring_m43 = action;
    if (__ring_m43._tag === "Identity") {
      return emit_identity_eq_cmp(ctx, lhs, rhs);
      break __ring_match43;
    }
    if (__ring_m43._tag === "FloatIdentity") {
      return emit_float_identity_eq_cmp(ctx, lhs, rhs);
      break __ring_match43;
    }
    if (__ring_m43._tag === "BoolIdentity") {
      const lhs_int = llvm_ptrtoint(ctx, lhs);
      const rhs_int = llvm_ptrtoint(ctx, rhs);
      return LLVMBuildICmp(ctx.builder, 32, lhs_int, rhs_int, codegen_llvm_ctx$fresh_name(ctx, "beq"));
      break __ring_match43;
    }
    if (__ring_m43._tag === "Call") {
      const dict_name = __ring_m43.dict_name; const extra_dicts = __ring_m43.extra_dicts;
      return emit_dict_eq_call(ctx, lhs, rhs, dict_name, extra_dicts);
      break __ring_match43;
    }
    if (__ring_m43._tag === "Tuple") {
      const element_actions = __ring_m43.element_actions;
      return emit_tuple_eq_cmp(ctx, lhs, rhs, element_actions);
      break __ring_match43;
    }
    if (__ring_m43._tag === "FnLiteral") {
      return LLVMBuildICmp(ctx.builder, 32, LLVMConstInt(ctx.i64_type, 0, 0), LLVMConstInt(ctx.i64_type, 0, 0), codegen_llvm_ctx$fresh_name(ctx, "ftrue"));
      break __ring_match43;
    }
    __match_fail(__ring_m43);
  }
}

function emit_enum_eq_fn(ctx, type_name, variants, bounds) {
  const mangled = codegen_llvm_ctx$llvm_mangle_method(type_name, "eq");
  __ring_match44: {
    const __ring_m44 = _Map_get(ctx.functions, mangled);
    if (__ring_m44._tag === "some") {
      return;
      break __ring_match44;
    }
    if (__ring_m44._tag === "none") {
      break __ring_match44;
    }
    __match_fail(__ring_m44);
  }
  const dict_params = collect_trait_dict_params(bounds, "Eq");
  let param_types = [ctx.ptr_type, ctx.ptr_type];
  const __ring_iter_31 = __List_Iterable.iter(dict_params);
  while (true) {
    const __ring_next_31 = __ListIterator_Iterator.next(__ring_iter_31);
    if (__ring_next_31._tag === "none") break;
    const dp = __ring_next_31._0;
    List_push(param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0);
  const fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty);
  _Map_insert(ctx.functions, mangled, fn_val);
  _Map_insert(ctx.fn_types, mangled, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  setup_derived_dict_params(ctx, fn_val, dict_params, 2);
  const self_val = LLVMGetParam(fn_val, 0);
  const other_val = LLVMGetParam(fn_val, 1);
  if (Option_is_none(_Map_get(ctx.enum_types, type_name))) {
    LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0)));
    ctx.current_fn = saved_fn;
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
    return;
  }
  let __ring_blk14;
  __ring_match45: {
    const __ring_m45 = _Map_get(ctx.enum_types, type_name);
    if (__ring_m45._tag === "some") {
      const info = __ring_m45._0;
      __ring_blk14 = info;
      break __ring_match45;
    }
    if (__ring_m45._tag === "none") {
      __ring_blk14 = panic("unreachable");
      break __ring_match45;
    }
    __match_fail(__ring_m45);
  }
  const enum_info = __ring_blk14;
  const tag_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type], 0);
  const self_tag_ptr = LLVMBuildStructGEP2(ctx.builder, tag_ty, self_val, 0, codegen_llvm_ctx$fresh_name(ctx, "stp"));
  const self_tag = LLVMBuildLoad2(ctx.builder, ctx.i64_type, self_tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "stv"));
  const other_tag_ptr = LLVMBuildStructGEP2(ctx.builder, tag_ty, other_val, 0, codegen_llvm_ctx$fresh_name(ctx, "otp"));
  const other_tag = LLVMBuildLoad2(ctx.builder, ctx.i64_type, other_tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "otv"));
  const tags_eq = LLVMBuildICmp(ctx.builder, 32, self_tag, other_tag, codegen_llvm_ctx$fresh_name(ctx, "teq"));
  let any_fields = false;
  const __ring_iter_32 = __List_Iterable.iter(variants);
  while (true) {
    const __ring_next_32 = __ListIterator_Iterator.next(__ring_iter_32);
    if (__ring_next_32._tag === "none") break;
    const v = __ring_next_32._0;
    if ((List_len(v.fields) > 0)) {
      any_fields = true;
    }
  }
  if ((!any_fields)) {
    const result = LLVMBuildICmp(ctx.builder, 32, self_tag, other_tag, codegen_llvm_ctx$fresh_name(ctx, "eq"));
    const ext = LLVMBuildSub(ctx.builder, LLVMConstInt(ctx.i64_type, 0, 0), LLVMConstInt(ctx.i64_type, 0, 0), codegen_llvm_ctx$fresh_name(ctx, "z"));
    const _ = ext;
    const tags_equal = LLVMBuildICmp(ctx.builder, 32, self_tag, other_tag, codegen_llvm_ctx$fresh_name(ctx, "te"));
    const as_i64 = LLVMBuildSub(ctx.builder, LLVMConstInt(ctx.i64_type, 1, 0), LLVMConstInt(ctx.i64_type, 0, 0), codegen_llvm_ctx$fresh_name(ctx, "one"));
    const true_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.true");
    const false_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.false");
    const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.merge");
    discard(LLVMBuildCondBr(ctx.builder, tags_eq, true_bb, false_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, true_bb);
    const true_val = codegen_llvm_expr$box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0));
    const true_end = LLVMGetInsertBlock(ctx.builder);
    discard(LLVMBuildBr(ctx.builder, merge_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, false_bb);
    const false_val = codegen_llvm_expr$box_bool(ctx, LLVMConstInt(ctx.i64_type, 0, 0));
    const false_end = LLVMGetInsertBlock(ctx.builder);
    discard(LLVMBuildBr(ctx.builder, merge_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
    const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "res"));
    LLVMAddIncoming(phi, [true_val, false_val], [true_end, false_end]);
    LLVMBuildRet(ctx.builder, phi);
  } else {
    const tags_diff_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.diff");
    const tags_same_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.same");
    discard(LLVMBuildCondBr(ctx.builder, tags_eq, tags_same_bb, tags_diff_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, tags_diff_bb);
    LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_bool(ctx, LLVMConstInt(ctx.i64_type, 0, 0)));
    LLVMPositionBuilderAtEnd(ctx.builder, tags_same_bb);
    const ret_true_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.ret.true");
    const ret_false_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.ret.false");
    const default_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.default");
    const switch_val = LLVMBuildSwitch(ctx.builder, self_tag, default_bb, List_len(variants));
    const __ring_end33 = List_len(variants);
    for (let vi = 0; vi < __ring_end33; vi++) {
      const variant = __ring_index(variants, vi);
      let __ring_blk15;
      __ring_match46: {
        const __ring_m46 = _Map_get(enum_info.variants, variant.name);
        if (__ring_m46._tag === "some") {
          const vinfo = __ring_m46._0;
          __ring_blk15 = vinfo.tag;
          break __ring_match46;
        }
        if (__ring_m46._tag === "none") {
          __ring_blk15 = vi;
          break __ring_match46;
        }
        __match_fail(__ring_m46);
      }
      const var_tag = __ring_blk15;
      const case_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, `eq.v.${variant.name}`);
      LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, var_tag, 0), case_bb);
      LLVMPositionBuilderAtEnd(ctx.builder, case_bb);
      if ((List_len(variant.fields) === 0)) {
        discard(LLVMBuildBr(ctx.builder, ret_true_bb));
      } else {
        const __ring_end34 = List_len(variant.fields);
        for (let fi = 0; fi < __ring_end34; fi++) {
          const field = __ring_index(variant.fields, fi);
          const self_fp = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, self_val, (fi + 1), codegen_llvm_ctx$fresh_name(ctx, "sf"));
          const self_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, self_fp, codegen_llvm_ctx$fresh_name(ctx, "sv"));
          const other_fp = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, other_val, (fi + 1), codegen_llvm_ctx$fresh_name(ctx, "of"));
          const other_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, other_fp, codegen_llvm_ctx$fresh_name(ctx, "ov"));
          const eq_i1 = emit_field_eq_cmp(ctx, self_fv, other_fv, field.action);
          const next_bb = (((fi + 1) < List_len(variant.fields)) ? LLVMAppendBasicBlockInContext(ctx.context, fn_val, `eq.v.${variant.name}.f${(fi + 1)}`) : ret_true_bb);
          discard(LLVMBuildCondBr(ctx.builder, eq_i1, next_bb, ret_false_bb));
          LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
        }
      }
    }
    LLVMPositionBuilderAtEnd(ctx.builder, default_bb);
    discard(LLVMBuildBr(ctx.builder, ret_true_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, ret_true_bb);
    LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0)));
    LLVMPositionBuilderAtEnd(ctx.builder, ret_false_bb);
    LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_bool(ctx, LLVMConstInt(ctx.i64_type, 0, 0)));
  }
  ctx.current_fn = saved_fn;
  return LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
}

function emit_struct_eq_fn(ctx, type_name, fields, bounds) {
  const mangled = codegen_llvm_ctx$llvm_mangle_method(type_name, "eq");
  __ring_match47: {
    const __ring_m47 = _Map_get(ctx.functions, mangled);
    if (__ring_m47._tag === "some") {
      return;
      break __ring_match47;
    }
    if (__ring_m47._tag === "none") {
      break __ring_match47;
    }
    __match_fail(__ring_m47);
  }
  const dict_params = collect_trait_dict_params(bounds, "Eq");
  let param_types = [ctx.ptr_type, ctx.ptr_type];
  const __ring_iter_35 = __List_Iterable.iter(dict_params);
  while (true) {
    const __ring_next_35 = __ListIterator_Iterator.next(__ring_iter_35);
    if (__ring_next_35._tag === "none") break;
    const dp = __ring_next_35._0;
    List_push(param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0);
  const fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty);
  _Map_insert(ctx.functions, mangled, fn_val);
  _Map_insert(ctx.fn_types, mangled, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  setup_derived_dict_params(ctx, fn_val, dict_params, 2);
  const self_val = LLVMGetParam(fn_val, 0);
  const other_val = LLVMGetParam(fn_val, 1);
  if ((List_len(fields) === 0)) {
    LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0)));
    ctx.current_fn = saved_fn;
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
    return;
  }
  if (Option_is_none(_Map_get(ctx.struct_types, type_name))) {
    LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0)));
    ctx.current_fn = saved_fn;
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
    return;
  }
  let __ring_blk16;
  __ring_match48: {
    const __ring_m48 = _Map_get(ctx.struct_types, type_name);
    if (__ring_m48._tag === "some") {
      const info = __ring_m48._0;
      __ring_blk16 = info;
      break __ring_match48;
    }
    if (__ring_m48._tag === "none") {
      __ring_blk16 = panic("unreachable");
      break __ring_match48;
    }
    __match_fail(__ring_m48);
  }
  const struct_info = __ring_blk16;
  const ret_false_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "ret.false");
  const ret_true_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "ret.true");
  const __ring_end36 = List_len(fields);
  for (let fi = 0; fi < __ring_end36; fi++) {
    const field = __ring_index(fields, fi);
    const field_idx = find_field_index(struct_info.field_names, field.name);
    if ((field_idx < 0)) {
      continue;
    }
    const self_fp = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, self_val, field_idx, codegen_llvm_ctx$fresh_name(ctx, "sf"));
    const self_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, self_fp, codegen_llvm_ctx$fresh_name(ctx, "sv"));
    const other_fp = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, other_val, field_idx, codegen_llvm_ctx$fresh_name(ctx, "of"));
    const other_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, other_fp, codegen_llvm_ctx$fresh_name(ctx, "ov"));
    const eq_i1 = emit_field_eq_cmp(ctx, self_fv, other_fv, field.action);
    const next_bb = (((fi + 1) < List_len(fields)) ? LLVMAppendBasicBlockInContext(ctx.context, fn_val, `cmp.${(fi + 1)}`) : ret_true_bb);
    discard(LLVMBuildCondBr(ctx.builder, eq_i1, next_bb, ret_false_bb));
    LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
  }
  LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0)));
  LLVMPositionBuilderAtEnd(ctx.builder, ret_false_bb);
  LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_bool(ctx, LLVMConstInt(ctx.i64_type, 0, 0)));
  ctx.current_fn = saved_fn;
  return LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
}

function emit_struct_ne_fn(ctx, type_name) {
  const mangled_ne = codegen_llvm_ctx$llvm_mangle_method(type_name, "ne");
  __ring_match49: {
    const __ring_m49 = _Map_get(ctx.functions, mangled_ne);
    if (__ring_m49._tag === "some") {
      return;
      break __ring_match49;
    }
    if (__ring_m49._tag === "none") {
      break __ring_match49;
    }
    __match_fail(__ring_m49);
  }
  const mangled_eq = codegen_llvm_ctx$llvm_mangle_method(type_name, "eq");
  if (Option_is_none(_Map_get(ctx.functions, mangled_eq))) {
    return;
  }
  let __ring_blk17;
  __ring_match50: {
    const __ring_m50 = _Map_get(ctx.functions, mangled_eq);
    if (__ring_m50._tag === "some") {
      const f = __ring_m50._0;
      __ring_blk17 = f;
      break __ring_match50;
    }
    if (__ring_m50._tag === "none") {
      __ring_blk17 = panic("unreachable");
      break __ring_match50;
    }
    __match_fail(__ring_m50);
  }
  const eq_fn = __ring_blk17;
  let __ring_blk18;
  __ring_match51: {
    const __ring_m51 = _Map_get(ctx.fn_types, mangled_eq);
    if (__ring_m51._tag === "some") {
      const t = __ring_m51._0;
      __ring_blk18 = t;
      break __ring_match51;
    }
    if (__ring_m51._tag === "none") {
      __ring_blk18 = LLVMFunctionType(ctx.ptr_type, [ctx.ptr_type, ctx.ptr_type], 0);
      break __ring_match51;
    }
    __match_fail(__ring_m51);
  }
  const eq_fn_ty = __ring_blk18;
  const eq_arity = LLVMCountParams(eq_fn);
  let ne_param_types = [];
  const __ring_end37 = eq_arity;
  for (let i = 0; i < __ring_end37; i++) {
    List_push(ne_param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, ne_param_types, 0);
  const fn_val = LLVMAddFunction(ctx.module, mangled_ne, fn_ty);
  _Map_insert(ctx.functions, mangled_ne, fn_val);
  _Map_insert(ctx.fn_types, mangled_ne, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  let eq_args = [];
  const __ring_end38 = eq_arity;
  for (let i = 0; i < __ring_end38; i++) {
    List_push(eq_args, LLVMGetParam(fn_val, i));
  }
  const eq_result = LLVMBuildCall2(ctx.builder, eq_fn_ty, eq_fn, eq_args, codegen_llvm_ctx$fresh_name(ctx, "eqr"));
  const raw = codegen_llvm_expr$unbox_int(ctx, eq_result);
  const one = LLVMConstInt(ctx.i64_type, 1, 0);
  const neg = LLVMBuildSub(ctx.builder, one, raw, codegen_llvm_ctx$fresh_name(ctx, "neg"));
  const result = codegen_llvm_expr$box_bool(ctx, neg);
  LLVMBuildRet(ctx.builder, result);
  ctx.current_fn = saved_fn;
  return LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
}

function emit_derived_eq_llvm(ctx, di) {
  const type_name = di.type_name;
  __ring_match52: {
    const __ring_m52 = di.type_kind;
    if (__ring_m52._tag === "StructKind") {
      __ring_match53: {
        const __ring_m53 = di.struct_fields;
        if (__ring_m53._tag === "some") {
          const fields = __ring_m53._0;
          emit_struct_eq_fn(ctx, type_name, fields, di.bounds);
          emit_struct_ne_fn(ctx, type_name);
          return emit_derived_trait_dict(ctx, type_name, "Eq");
          break __ring_match53;
        }
        if (__ring_m53._tag === "none") {
          break __ring_match53;
        }
        __match_fail(__ring_m53);
      }
      break __ring_match52;
    }
    if (__ring_m52._tag === "EnumKind") {
      __ring_match54: {
        const __ring_m54 = di.enum_variants;
        if (__ring_m54._tag === "some") {
          const variants = __ring_m54._0;
          emit_enum_eq_fn(ctx, type_name, variants, di.bounds);
          emit_struct_ne_fn(ctx, type_name);
          return emit_derived_trait_dict(ctx, type_name, "Eq");
          break __ring_match54;
        }
        if (__ring_m54._tag === "none") {
          break __ring_match54;
        }
        __match_fail(__ring_m54);
      }
      break __ring_match52;
    }
    __match_fail(__ring_m52);
  }
}

function emit_dict_cmp_call(ctx, lhs, rhs, dict_name, extra_dicts) {
  const dict_ptr = resolve_dict_for_derived(ctx, dict_name);
  const dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type], 0);
  const slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "cmps"));
  const cmp_closure = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, codegen_llvm_ctx$fresh_name(ctx, "cmpc"));
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, cmp_closure, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
  const fn_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, fn_ptr_slot, codegen_llvm_ctx$fresh_name(ctx, "fp"));
  const env_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, cmp_closure, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
  const env_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, env_slot, codegen_llvm_ctx$fresh_name(ctx, "ep"));
  let call_args = [env_ptr, lhs, rhs];
  let call_param_types = [ctx.ptr_type, ctx.ptr_type, ctx.ptr_type];
  const __ring_iter_39 = __List_Iterable.iter(extra_dicts);
  while (true) {
    const __ring_next_39 = __ListIterator_Iterator.next(__ring_iter_39);
    if (__ring_next_39._tag === "none") break;
    const ed = __ring_next_39._0;
    List_push(call_args, resolve_dict_for_derived(ctx, ed));
    List_push(call_param_types, ctx.ptr_type);
  }
  const call_fn_ty = LLVMFunctionType(ctx.ptr_type, call_param_types, 0);
  return LLVMBuildCall2(ctx.builder, call_fn_ty, fn_ptr, call_args, codegen_llvm_ctx$fresh_name(ctx, "dcmp"));
}

function emit_float_identity_cmp(ctx, lhs, rhs) {
  let __ring_blk19;
  __ring_match55: {
    const __ring_m55 = ctx.current_fn;
    if (__ring_m55._tag === "some") {
      const f = __ring_m55._0;
      __ring_blk19 = f;
      break __ring_match55;
    }
    if (__ring_m55._tag === "none") {
      __ring_blk19 = panic("LLVM codegen: emit_float_identity_cmp outside function");
      break __ring_match55;
    }
    __match_fail(__ring_m55);
  }
  const current_fn = __ring_blk19;
  const unbox_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type);
  const unbox_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_unbox_float");
  const lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], codegen_llvm_ctx$fresh_name(ctx, "lf"));
  const rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], codegen_llvm_ctx$fresh_name(ctx, "rf"));
  const is_lt = LLVMBuildFCmp(ctx.builder, 4, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "flt"));
  const is_gt = LLVMBuildFCmp(ctx.builder, 2, lhs_raw, rhs_raw, codegen_llvm_ctx$fresh_name(ctx, "fgt"));
  const lt_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "fcmp.lt");
  const gt_check_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "fcmp.gtchk");
  const gt_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "fcmp.gt");
  const eq_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "fcmp.eq");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "fcmp.merge");
  discard(LLVMBuildCondBr(ctx.builder, is_lt, lt_bb, gt_check_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, lt_bb);
  const neg_one = LLVMConstInt(ctx.i64_type, (0 - 1), 1);
  const lt_val = codegen_llvm_expr$box_int(ctx, neg_one);
  const lt_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, gt_check_bb);
  discard(LLVMBuildCondBr(ctx.builder, is_gt, gt_bb, eq_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, gt_bb);
  const gt_val = codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 1, 0));
  const gt_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, eq_bb);
  const eq_val = codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0));
  const eq_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "fcmp"));
  LLVMAddIncoming(phi, [lt_val, gt_val, eq_val], [lt_end, gt_end, eq_end]);
  return phi;
}

function emit_identity_cmp(ctx, lhs, rhs) {
  let __ring_blk20;
  __ring_match56: {
    const __ring_m56 = ctx.current_fn;
    if (__ring_m56._tag === "some") {
      const f = __ring_m56._0;
      __ring_blk20 = f;
      break __ring_match56;
    }
    if (__ring_m56._tag === "none") {
      __ring_blk20 = panic("LLVM codegen: emit_identity_cmp outside function");
      break __ring_match56;
    }
    __match_fail(__ring_m56);
  }
  const current_fn = __ring_blk20;
  const lhs_int = llvm_ptrtoint(ctx, lhs);
  const rhs_int = llvm_ptrtoint(ctx, rhs);
  const one = LLVMConstInt(ctx.i64_type, 1, 0);
  const lhs_tag = llvm_and(ctx, lhs_int, one);
  const is_tagged = LLVMBuildICmp(ctx.builder, 32, lhs_tag, one, codegen_llvm_ctx$fresh_name(ctx, "tag"));
  const tagged_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "cmp.tagged");
  const heap_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "cmp.heap");
  const merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "cmp.merge");
  discard(LLVMBuildCondBr(ctx.builder, is_tagged, tagged_bb, heap_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, tagged_bb);
  const lhs_unboxed = LLVMBuildAShr(ctx.builder, lhs_int, one, codegen_llvm_ctx$fresh_name(ctx, "lu"));
  const rhs_unboxed = LLVMBuildAShr(ctx.builder, rhs_int, one, codegen_llvm_ctx$fresh_name(ctx, "ru"));
  const is_lt = LLVMBuildICmp(ctx.builder, 40, lhs_unboxed, rhs_unboxed, codegen_llvm_ctx$fresh_name(ctx, "lt"));
  const is_gt = LLVMBuildICmp(ctx.builder, 38, lhs_unboxed, rhs_unboxed, codegen_llvm_ctx$fresh_name(ctx, "gt"));
  const t_lt_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "t.lt");
  const t_gt_check_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "t.gtchk");
  const t_gt_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "t.gt");
  const t_eq_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "t.eq");
  const t_merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "t.merge");
  discard(LLVMBuildCondBr(ctx.builder, is_lt, t_lt_bb, t_gt_check_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, t_lt_bb);
  const neg_one = LLVMConstInt(ctx.i64_type, (0 - 1), 1);
  const t_lt_val = codegen_llvm_expr$box_int(ctx, neg_one);
  const t_lt_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, t_merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, t_gt_check_bb);
  discard(LLVMBuildCondBr(ctx.builder, is_gt, t_gt_bb, t_eq_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, t_gt_bb);
  const t_gt_val = codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 1, 0));
  const t_gt_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, t_merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, t_eq_bb);
  const t_eq_val = codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0));
  const t_eq_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, t_merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, t_merge_bb);
  const tagged_result = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "tres"));
  LLVMAddIncoming(tagged_result, [t_lt_val, t_gt_val, t_eq_val], [t_lt_end, t_gt_end, t_eq_end]);
  const tagged_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, heap_bb);
  const cmp_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_cl_cmp_str", [ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], ctx.ptr_type);
  const cmp_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_cl_cmp_str");
  const null_env = LLVMConstPointerNull(ctx.ptr_type);
  const heap_result = LLVMBuildCall2(ctx.builder, cmp_ty, cmp_fn, [null_env, lhs, rhs], codegen_llvm_ctx$fresh_name(ctx, "hcmp"));
  const heap_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, merge_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, merge_bb);
  const phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "fcmp"));
  LLVMAddIncoming(phi, [tagged_result, heap_result], [tagged_end, heap_end]);
  return phi;
}

function emit_tuple_cmp(ctx, lhs, rhs, element_actions) {
  if ((List_len(element_actions) === 0)) {
    return codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0));
  }
  let __ring_blk21;
  __ring_match57: {
    const __ring_m57 = ctx.current_fn;
    if (__ring_m57._tag === "some") {
      const f = __ring_m57._0;
      __ring_blk21 = f;
      break __ring_match57;
    }
    if (__ring_m57._tag === "none") {
      __ring_blk21 = panic("LLVM codegen: emit_tuple_cmp outside function");
      break __ring_match57;
    }
    __match_fail(__ring_m57);
  }
  const current_fn = __ring_blk21;
  const list_get_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type);
  const list_get_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_list_get");
  if ((List_len(element_actions) === 1)) {
    const idx = LLVMConstInt(ctx.i64_type, 0, 0);
    const l_elem = LLVMBuildCall2(ctx.builder, list_get_ty, list_get_fn, [lhs, idx], codegen_llvm_ctx$fresh_name(ctx, "le"));
    const r_elem = LLVMBuildCall2(ctx.builder, list_get_ty, list_get_fn, [rhs, idx], codegen_llvm_ctx$fresh_name(ctx, "re"));
    return emit_field_cmp(ctx, l_elem, r_elem, __ring_index(element_actions, 0));
  }
  const result_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "tcr"));
  const zero_boxed = codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0));
  LLVMBuildStore(ctx.builder, zero_boxed, result_alloca);
  const exit_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tc.exit");
  const __ring_end40 = List_len(element_actions);
  for (let i = 0; i < __ring_end40; i++) {
    const idx = LLVMConstInt(ctx.i64_type, i, 0);
    const l_elem = LLVMBuildCall2(ctx.builder, list_get_ty, list_get_fn, [lhs, idx], codegen_llvm_ctx$fresh_name(ctx, "le"));
    const r_elem = LLVMBuildCall2(ctx.builder, list_get_ty, list_get_fn, [rhs, idx], codegen_llvm_ctx$fresh_name(ctx, "re"));
    const cmp_val = emit_field_cmp(ctx, l_elem, r_elem, __ring_index(element_actions, i));
    LLVMBuildStore(ctx.builder, cmp_val, result_alloca);
    if ((i < (List_len(element_actions) - 1))) {
      const raw = codegen_llvm_expr$unbox_int(ctx, cmp_val);
      const is_zero = LLVMBuildICmp(ctx.builder, 32, raw, LLVMConstInt(ctx.i64_type, 0, 0), codegen_llvm_ctx$fresh_name(ctx, "iz"));
      const next_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, `tc.next.${i}`);
      discard(LLVMBuildCondBr(ctx.builder, is_zero, next_bb, exit_bb));
      LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
    } else {
      discard(LLVMBuildBr(ctx.builder, exit_bb));
    }
  }
  LLVMPositionBuilderAtEnd(ctx.builder, exit_bb);
  return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, result_alloca, codegen_llvm_ctx$fresh_name(ctx, "tcres"));
}

function emit_field_cmp(ctx, lhs, rhs, action) {
  __ring_match58: {
    const __ring_m58 = action;
    if (__ring_m58._tag === "Identity") {
      return emit_identity_cmp(ctx, lhs, rhs);
      break __ring_match58;
    }
    if (__ring_m58._tag === "FloatIdentity") {
      return emit_float_identity_cmp(ctx, lhs, rhs);
      break __ring_match58;
    }
    if (__ring_m58._tag === "BoolIdentity") {
      return emit_identity_cmp(ctx, lhs, rhs);
      break __ring_match58;
    }
    if (__ring_m58._tag === "Call") {
      const dict_name = __ring_m58.dict_name; const extra_dicts = __ring_m58.extra_dicts;
      return emit_dict_cmp_call(ctx, lhs, rhs, dict_name, extra_dicts);
      break __ring_match58;
    }
    if (__ring_m58._tag === "Tuple") {
      const element_actions = __ring_m58.element_actions;
      return emit_tuple_cmp(ctx, lhs, rhs, element_actions);
      break __ring_match58;
    }
    if (__ring_m58._tag === "FnLiteral") {
      return codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0));
      break __ring_match58;
    }
    __match_fail(__ring_m58);
  }
}

function emit_enum_cmp_fn(ctx, type_name, variants, bounds) {
  const mangled = codegen_llvm_ctx$llvm_mangle_method(type_name, "cmp");
  __ring_match59: {
    const __ring_m59 = _Map_get(ctx.functions, mangled);
    if (__ring_m59._tag === "some") {
      return;
      break __ring_match59;
    }
    if (__ring_m59._tag === "none") {
      break __ring_match59;
    }
    __match_fail(__ring_m59);
  }
  const dict_params = collect_trait_dict_params(bounds, "Ord");
  let param_types = [ctx.ptr_type, ctx.ptr_type];
  const __ring_iter_41 = __List_Iterable.iter(dict_params);
  while (true) {
    const __ring_next_41 = __ListIterator_Iterator.next(__ring_iter_41);
    if (__ring_next_41._tag === "none") break;
    const dp = __ring_next_41._0;
    List_push(param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0);
  const fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty);
  _Map_insert(ctx.functions, mangled, fn_val);
  _Map_insert(ctx.fn_types, mangled, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  setup_derived_dict_params(ctx, fn_val, dict_params, 2);
  const self_val = LLVMGetParam(fn_val, 0);
  const other_val = LLVMGetParam(fn_val, 1);
  if (Option_is_none(_Map_get(ctx.enum_types, type_name))) {
    LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0)));
    ctx.current_fn = saved_fn;
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
    return;
  }
  let __ring_blk22;
  __ring_match60: {
    const __ring_m60 = _Map_get(ctx.enum_types, type_name);
    if (__ring_m60._tag === "some") {
      const info = __ring_m60._0;
      __ring_blk22 = info;
      break __ring_match60;
    }
    if (__ring_m60._tag === "none") {
      __ring_blk22 = panic("unreachable");
      break __ring_match60;
    }
    __match_fail(__ring_m60);
  }
  const enum_info = __ring_blk22;
  const tag_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type], 0);
  const self_tag_ptr = LLVMBuildStructGEP2(ctx.builder, tag_ty, self_val, 0, codegen_llvm_ctx$fresh_name(ctx, "stp"));
  const self_tag = LLVMBuildLoad2(ctx.builder, ctx.i64_type, self_tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "stv"));
  const other_tag_ptr = LLVMBuildStructGEP2(ctx.builder, tag_ty, other_val, 0, codegen_llvm_ctx$fresh_name(ctx, "otp"));
  const other_tag = LLVMBuildLoad2(ctx.builder, ctx.i64_type, other_tag_ptr, codegen_llvm_ctx$fresh_name(ctx, "otv"));
  const tags_eq = LLVMBuildICmp(ctx.builder, 32, self_tag, other_tag, codegen_llvm_ctx$fresh_name(ctx, "teq"));
  const tags_diff_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "tags.diff");
  const tags_same_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "tags.same");
  discard(LLVMBuildCondBr(ctx.builder, tags_eq, tags_same_bb, tags_diff_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, tags_diff_bb);
  const self_lt = LLVMBuildICmp(ctx.builder, 40, self_tag, other_tag, codegen_llvm_ctx$fresh_name(ctx, "slt"));
  const lt_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "tag.lt");
  const gt_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "tag.gt");
  const tag_merge = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "tag.merge");
  discard(LLVMBuildCondBr(ctx.builder, self_lt, lt_bb, gt_bb));
  LLVMPositionBuilderAtEnd(ctx.builder, lt_bb);
  const neg_one = LLVMConstInt(ctx.i64_type, (0 - 1), 1);
  const lt_val = codegen_llvm_expr$box_int(ctx, neg_one);
  const lt_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, tag_merge));
  LLVMPositionBuilderAtEnd(ctx.builder, gt_bb);
  const gt_val = codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 1, 0));
  const gt_end = LLVMGetInsertBlock(ctx.builder);
  discard(LLVMBuildBr(ctx.builder, tag_merge));
  LLVMPositionBuilderAtEnd(ctx.builder, tag_merge);
  const tag_phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, codegen_llvm_ctx$fresh_name(ctx, "tcmp"));
  LLVMAddIncoming(tag_phi, [lt_val, gt_val], [lt_end, gt_end]);
  LLVMBuildRet(ctx.builder, tag_phi);
  LLVMPositionBuilderAtEnd(ctx.builder, tags_same_bb);
  const cmp_default_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "cmp.default");
  const cmp_switch = LLVMBuildSwitch(ctx.builder, self_tag, cmp_default_bb, List_len(variants));
  const __ring_end42 = List_len(variants);
  for (let vi = 0; vi < __ring_end42; vi++) {
    const variant = __ring_index(variants, vi);
    let __ring_blk23;
    __ring_match61: {
      const __ring_m61 = _Map_get(enum_info.variants, variant.name);
      if (__ring_m61._tag === "some") {
        const vinfo = __ring_m61._0;
        __ring_blk23 = vinfo.tag;
        break __ring_match61;
      }
      if (__ring_m61._tag === "none") {
        __ring_blk23 = vi;
        break __ring_match61;
      }
      __match_fail(__ring_m61);
    }
    const var_tag = __ring_blk23;
    const case_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, `cmp.v.${variant.name}`);
    LLVMAddCase(cmp_switch, LLVMConstInt(ctx.i64_type, var_tag, 0), case_bb);
    LLVMPositionBuilderAtEnd(ctx.builder, case_bb);
    if ((List_len(variant.fields) === 0)) {
      discard(LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0))));
    } else {
      const __ring_end43 = List_len(variant.fields);
      for (let fi = 0; fi < __ring_end43; fi++) {
        const field = __ring_index(variant.fields, fi);
        const self_fp = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, self_val, (fi + 1), codegen_llvm_ctx$fresh_name(ctx, "sf"));
        const self_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, self_fp, codegen_llvm_ctx$fresh_name(ctx, "sv"));
        const other_fp = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, other_val, (fi + 1), codegen_llvm_ctx$fresh_name(ctx, "of"));
        const other_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, other_fp, codegen_llvm_ctx$fresh_name(ctx, "ov"));
        const cmp_val = emit_field_cmp(ctx, self_fv, other_fv, field.action);
        if ((fi < (List_len(variant.fields) - 1))) {
          const raw = codegen_llvm_expr$unbox_int(ctx, cmp_val);
          const is_zero = LLVMBuildICmp(ctx.builder, 32, raw, LLVMConstInt(ctx.i64_type, 0, 0), codegen_llvm_ctx$fresh_name(ctx, "iz"));
          const ret_nz_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, `cmp.v.${variant.name}.ret.${fi}`);
          const next_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, `cmp.v.${variant.name}.f${(fi + 1)}`);
          discard(LLVMBuildCondBr(ctx.builder, is_zero, next_bb, ret_nz_bb));
          LLVMPositionBuilderAtEnd(ctx.builder, ret_nz_bb);
          discard(LLVMBuildRet(ctx.builder, cmp_val));
          LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
        } else {
          discard(LLVMBuildRet(ctx.builder, cmp_val));
        }
      }
    }
  }
  LLVMPositionBuilderAtEnd(ctx.builder, cmp_default_bb);
  LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0)));
  ctx.current_fn = saved_fn;
  return LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
}

function emit_struct_cmp_fn(ctx, type_name, fields, bounds) {
  const mangled = codegen_llvm_ctx$llvm_mangle_method(type_name, "cmp");
  __ring_match62: {
    const __ring_m62 = _Map_get(ctx.functions, mangled);
    if (__ring_m62._tag === "some") {
      return;
      break __ring_match62;
    }
    if (__ring_m62._tag === "none") {
      break __ring_match62;
    }
    __match_fail(__ring_m62);
  }
  const dict_params = collect_trait_dict_params(bounds, "Ord");
  let param_types = [ctx.ptr_type, ctx.ptr_type];
  const __ring_iter_44 = __List_Iterable.iter(dict_params);
  while (true) {
    const __ring_next_44 = __ListIterator_Iterator.next(__ring_iter_44);
    if (__ring_next_44._tag === "none") break;
    const dp = __ring_next_44._0;
    List_push(param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0);
  const fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty);
  _Map_insert(ctx.functions, mangled, fn_val);
  _Map_insert(ctx.fn_types, mangled, fn_ty);
  const saved_fn = ctx.current_fn;
  const saved_bb = LLVMGetInsertBlock(ctx.builder);
  ctx.current_fn = Option_some(fn_val);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  setup_derived_dict_params(ctx, fn_val, dict_params, 2);
  const self_val = LLVMGetParam(fn_val, 0);
  const other_val = LLVMGetParam(fn_val, 1);
  if ((List_len(fields) === 0)) {
    LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0)));
    ctx.current_fn = saved_fn;
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
    return;
  }
  if (Option_is_none(_Map_get(ctx.struct_types, type_name))) {
    LLVMBuildRet(ctx.builder, codegen_llvm_expr$box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0)));
    ctx.current_fn = saved_fn;
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
    return;
  }
  let __ring_blk24;
  __ring_match63: {
    const __ring_m63 = _Map_get(ctx.struct_types, type_name);
    if (__ring_m63._tag === "some") {
      const info = __ring_m63._0;
      __ring_blk24 = info;
      break __ring_match63;
    }
    if (__ring_m63._tag === "none") {
      __ring_blk24 = panic("unreachable");
      break __ring_match63;
    }
    __match_fail(__ring_m63);
  }
  const struct_info = __ring_blk24;
  const __ring_end45 = List_len(fields);
  for (let fi = 0; fi < __ring_end45; fi++) {
    const field = __ring_index(fields, fi);
    const field_idx = find_field_index(struct_info.field_names, field.name);
    if ((field_idx < 0)) {
      continue;
    }
    const self_fp = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, self_val, field_idx, codegen_llvm_ctx$fresh_name(ctx, "sf"));
    const self_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, self_fp, codegen_llvm_ctx$fresh_name(ctx, "sv"));
    const other_fp = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, other_val, field_idx, codegen_llvm_ctx$fresh_name(ctx, "of"));
    const other_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, other_fp, codegen_llvm_ctx$fresh_name(ctx, "ov"));
    const cmp_val = emit_field_cmp(ctx, self_fv, other_fv, field.action);
    if ((fi < (List_len(fields) - 1))) {
      const raw = codegen_llvm_expr$unbox_int(ctx, cmp_val);
      const is_zero = LLVMBuildICmp(ctx.builder, 32, raw, LLVMConstInt(ctx.i64_type, 0, 0), codegen_llvm_ctx$fresh_name(ctx, "iz"));
      const ret_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, `ret.nz.${fi}`);
      const next_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, `cmp.${(fi + 1)}`);
      discard(LLVMBuildCondBr(ctx.builder, is_zero, next_bb, ret_bb));
      LLVMPositionBuilderAtEnd(ctx.builder, ret_bb);
      discard(LLVMBuildRet(ctx.builder, cmp_val));
      LLVMPositionBuilderAtEnd(ctx.builder, next_bb);
    } else {
      discard(LLVMBuildRet(ctx.builder, cmp_val));
    }
  }
  ctx.current_fn = saved_fn;
  return LLVMPositionBuilderAtEnd(ctx.builder, saved_bb);
}

function emit_derived_ord_llvm(ctx, di) {
  const type_name = di.type_name;
  __ring_match64: {
    const __ring_m64 = di.type_kind;
    if (__ring_m64._tag === "StructKind") {
      __ring_match65: {
        const __ring_m65 = di.struct_fields;
        if (__ring_m65._tag === "some") {
          const fields = __ring_m65._0;
          emit_struct_cmp_fn(ctx, type_name, fields, di.bounds);
          return emit_derived_trait_dict(ctx, type_name, "Ord");
          break __ring_match65;
        }
        if (__ring_m65._tag === "none") {
          break __ring_match65;
        }
        __match_fail(__ring_m65);
      }
      break __ring_match64;
    }
    if (__ring_m64._tag === "EnumKind") {
      __ring_match66: {
        const __ring_m66 = di.enum_variants;
        if (__ring_m66._tag === "some") {
          const variants = __ring_m66._0;
          emit_enum_cmp_fn(ctx, type_name, variants, di.bounds);
          return emit_derived_trait_dict(ctx, type_name, "Ord");
          break __ring_match66;
        }
        if (__ring_m66._tag === "none") {
          break __ring_match66;
        }
        __match_fail(__ring_m66);
      }
      break __ring_match64;
    }
    __match_fail(__ring_m64);
  }
}

function emit_derived_impls_llvm(ctx, derived_impls) {
  const __ring_iter_46 = __List_Iterable.iter(derived_impls);
  while (true) {
    const __ring_next_46 = __ListIterator_Iterator.next(__ring_iter_46);
    if (__ring_next_46._tag === "none") break;
    const di = __ring_next_46._0;
    __ring_match67: {
      const __ring_m67 = di.trait_name;
      if (__ring_m67 === "Eq") {
        emit_derived_eq_llvm(ctx, di);
        break __ring_match67;
      }
      if (__ring_m67 === "Clone") {
        emit_derived_clone_llvm(ctx, di);
        break __ring_match67;
      }
      if (__ring_m67 === "Debug") {
        emit_derived_debug_llvm(ctx, di);
        break __ring_match67;
      }
      if (__ring_m67 === "Ord") {
        emit_derived_ord_llvm(ctx, di);
        break __ring_match67;
      }
      break __ring_match67;
    }
  }
}

function emit_enum_constructors(ctx, name, variants) {
  let __ring_blk25;
  __ring_match68: {
    const __ring_m68 = _Map_get(ctx.enum_types, name);
    if (__ring_m68._tag === "some") {
      const info = __ring_m68._0;
      __ring_blk25 = info;
      break __ring_match68;
    }
    if (__ring_m68._tag === "none") {
      __ring_blk25 = panic(`LLVM codegen: enum '${name}' not registered`);
      break __ring_match68;
    }
    __match_fail(__ring_m68);
  }
  const enum_info = __ring_blk25;
  const __ring_iter_47 = __List_Iterable.iter(variants);
  while (true) {
    const __ring_next_47 = __ListIterator_Iterator.next(__ring_iter_47);
    if (__ring_next_47._tag === "none") break;
    const v = __ring_next_47._0;
    const ctor_name = `ring_${name}_${v.name}`;
    let __ring_blk26;
    __ring_match69: {
      const __ring_m69 = _Map_get(enum_info.variants, v.name);
      if (__ring_m69._tag === "some") {
        const vi = __ring_m69._0;
        __ring_blk26 = vi;
        break __ring_match69;
      }
      if (__ring_m69._tag === "none") {
        __ring_blk26 = panic(`LLVM codegen: variant '${v.name}' not found in enum '${name}'`);
        break __ring_match69;
      }
      __match_fail(__ring_m69);
    }
    const variant_info = __ring_blk26;
    let __ring_blk27;
    __ring_match70: {
      const __ring_m70 = _Map_get(ctx.functions, ctor_name);
      if (__ring_m70._tag === "some") {
        const fv = __ring_m70._0;
        __ring_blk27 = fv;
        break __ring_match70;
      }
      if (__ring_m70._tag === "none") {
        __ring_blk27 = panic(`LLVM codegen: enum ctor '${ctor_name}' not forward-declared`);
        break __ring_match70;
      }
      __match_fail(__ring_m70);
    }
    const fn_val = __ring_blk27;
    const saved_fn = ctx.current_fn;
    ctx.current_fn = Option_some(fn_val);
    const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
    LLVMPositionBuilderAtEnd(ctx.builder, entry);
    const size = LLVMSizeOf(enum_info.llvm_type);
    const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
    const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
    const enum_typeid_val = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$get_or_assign_typeid(ctx, name), 0);
    const enum_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, enum_typeid_val], "e");
    const tag_val = LLVMConstInt(ctx.i64_type, variant_info.tag, 0);
    const tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, 0, "tag");
    LLVMBuildStore(ctx.builder, tag_val, tag_ptr);
    const __ring_end48 = List_len(v.fields);
    for (let i = 0; i < __ring_end48; i++) {
      const param_val = LLVMGetParam(fn_val, i);
      const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, (i + 1), "ef");
      LLVMBuildStore(ctx.builder, param_val, field_ptr);
    }
    LLVMBuildRet(ctx.builder, enum_ptr);
    ctx.current_fn = saved_fn;
  }
}

function emit_fn_body(ctx, name, params, effects, body, trait_bounds, impl_type) {
  let __ring_blk28;
  __ring_match71: {
    const __ring_m71 = impl_type;
    if (__ring_m71._tag === "some") {
      const t = __ring_m71._0;
      __ring_blk28 = codegen_llvm_ctx$llvm_mangle_method(t, name);
      break __ring_match71;
    }
    if (__ring_m71._tag === "none") {
      let __ring_blk29;
      __ring_match72: {
        const __ring_m72 = ctx.module_prefix;
        if (__ring_m72._tag === "some") {
          const prefix = __ring_m72._0;
          __ring_blk29 = codegen_llvm_ctx$llvm_mangle_fn_with_prefix(prefix, name);
          break __ring_match72;
        }
        if (__ring_m72._tag === "none") {
          __ring_blk29 = codegen_llvm_ctx$llvm_mangle_fn(name);
          break __ring_match72;
        }
        __match_fail(__ring_m72);
      }
      __ring_blk28 = __ring_blk29;
      break __ring_match71;
    }
    __match_fail(__ring_m71);
  }
  const mangled = __ring_blk28;
  let __ring_blk30;
  __ring_match73: {
    const __ring_m73 = _Map_get(ctx.functions, mangled);
    if (__ring_m73._tag === "some") {
      const f = __ring_m73._0;
      __ring_blk30 = f;
      break __ring_match73;
    }
    if (__ring_m73._tag === "none") {
      __ring_blk30 = panic(`LLVM codegen: function '${mangled}' not forward-declared`);
      break __ring_match73;
    }
    __match_fail(__ring_m73);
  }
  const fn_val = __ring_blk30;
  const saved_fn = ctx.current_fn;
  ctx.current_fn = Option_some(fn_val);
  const saved_fn_name = ctx.current_fn_name;
  ctx.current_fn_name = mangled;
  const saved_named = ctx.named_values;
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  let param_idx = 0;
  const __ring_iter_49 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_49 = __ListIterator_Iterator.next(__ring_iter_49);
    if (__ring_next_49._tag === "none") break;
    const p = __ring_next_49._0;
    const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, p.name);
    LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca);
    _Map_insert(ctx.named_values, p.name, alloca);
    param_idx = (param_idx + 1);
  }
  const __ring_iter_50 = __List_Iterable.iter(trait_bounds);
  while (true) {
    const __ring_next_50 = __ListIterator_Iterator.next(__ring_iter_50);
    if (__ring_next_50._tag === "none") break;
    const b = __ring_next_50._0;
    const dict_name = hir$trait_bound_param_name(b.type_param, b.trait_name);
    const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, dict_name);
    LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca);
    _Map_insert(ctx.named_values, dict_name, alloca);
    param_idx = (param_idx + 1);
  }
  let __ring_blk31;
  __ring_match74: {
    const __ring_m74 = _Map_get(ctx.local_fn_effects, name);
    if (__ring_m74._tag === "some") {
      const eff = __ring_m74._0;
      __ring_blk31 = eff;
      break __ring_match74;
    }
    if (__ring_m74._tag === "none") {
      __ring_blk31 = effects;
      break __ring_match74;
    }
    __match_fail(__ring_m74);
  }
  const effective_effects = __ring_blk31;
  const ev_names = codegen_ctx$extract_effect_names(effective_effects);
  const __ring_iter_51 = __List_Iterable.iter(ev_names);
  while (true) {
    const __ring_next_51 = __ListIterator_Iterator.next(__ring_iter_51);
    if (__ring_next_51._tag === "none") break;
    const en = __ring_next_51._0;
    const ep_name = hir$evidence_param_name(en);
    const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, ep_name);
    LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca);
    _Map_insert(ctx.named_values, ep_name, alloca);
    param_idx = (param_idx + 1);
  }
  const body_val = codegen_llvm_expr$gen_llvm_expr(ctx, body);
  LLVMBuildRet(ctx.builder, body_val);
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
  ctx.current_fn_name = saved_fn_name;
}

function emit_struct_constructor(ctx, name, fields) {
  const ctor_name = codegen_llvm_ctx$llvm_mangle_fn(name);
  __ring_match75: {
    const __ring_m75 = _Map_get(ctx.functions, ctor_name);
    if (__ring_m75._tag === "some") {
      return;
      break __ring_match75;
    }
    if (__ring_m75._tag === "none") {
      break __ring_match75;
    }
    __match_fail(__ring_m75);
  }
  let param_types = [];
  const __ring_iter_52 = __List_Iterable.iter(fields);
  while (true) {
    const __ring_next_52 = __ListIterator_Iterator.next(__ring_iter_52);
    if (__ring_next_52._tag === "none") break;
    const f = __ring_next_52._0;
    List_push(param_types, ctx.ptr_type);
  }
  const fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0);
  const fn_val = LLVMAddFunction(ctx.module, ctor_name, fn_ty);
  _Map_insert(ctx.functions, ctor_name, fn_val);
  _Map_insert(ctx.fn_types, ctor_name, fn_ty);
  const saved_fn = ctx.current_fn;
  ctx.current_fn = Option_some(fn_val);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  let __ring_blk32;
  __ring_match76: {
    const __ring_m76 = _Map_get(ctx.struct_types, name);
    if (__ring_m76._tag === "some") {
      const info = __ring_m76._0;
      __ring_blk32 = info;
      break __ring_match76;
    }
    if (__ring_m76._tag === "none") {
      __ring_blk32 = panic(`LLVM codegen: struct '${name}' not registered`);
      break __ring_match76;
    }
    __match_fail(__ring_m76);
  }
  const struct_info = __ring_blk32;
  const size = LLVMSizeOf(struct_info.llvm_type);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const typeid_val = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$get_or_assign_typeid(ctx, name), 0);
  const struct_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, typeid_val], "s");
  const __ring_end53 = List_len(fields);
  for (let i = 0; i < __ring_end53; i++) {
    const param_val = LLVMGetParam(fn_val, i);
    const field_ptr = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, struct_ptr, i, "fp");
    LLVMBuildStore(ctx.builder, param_val, field_ptr);
  }
  LLVMBuildRet(ctx.builder, struct_ptr);
  ctx.current_fn = saved_fn;
}

function emit_one_default_method(ctx, fn_val, default_fn_name, trait_name, method, body) {
  const saved_fn = ctx.current_fn;
  ctx.current_fn = Option_some(fn_val);
  const saved_fn_name = ctx.current_fn_name;
  ctx.current_fn_name = default_fn_name;
  const saved_named = ctx.named_values;
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  let param_idx = 0;
  const self_dict_name = hir$default_method_self_name(trait_name);
  const dict_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, self_dict_name);
  LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), dict_alloca);
  _Map_insert(ctx.named_values, self_dict_name, dict_alloca);
  param_idx = (param_idx + 1);
  const all_supers = collect_all_supertraits_llvm(ctx, trait_name);
  const __ring_iter_54 = __List_Iterable.iter(all_supers);
  while (true) {
    const __ring_next_54 = __ListIterator_Iterator.next(__ring_iter_54);
    if (__ring_next_54._tag === "none") break;
    const st = __ring_next_54._0;
    const st_dict_name = hir$default_method_self_name(st);
    const st_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, st_dict_name);
    LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), st_alloca);
    _Map_insert(ctx.named_values, st_dict_name, st_alloca);
    param_idx = (param_idx + 1);
  }
  const __ring_iter_55 = __List_Iterable.iter(method.params);
  while (true) {
    const __ring_next_55 = __ListIterator_Iterator.next(__ring_iter_55);
    if (__ring_next_55._tag === "none") break;
    const p = __ring_next_55._0;
    const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, p.name);
    LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca);
    _Map_insert(ctx.named_values, p.name, alloca);
    param_idx = (param_idx + 1);
  }
  const ev_names = codegen_ctx$extract_effect_names(method.effects);
  const __ring_iter_56 = __List_Iterable.iter(ev_names);
  while (true) {
    const __ring_next_56 = __ListIterator_Iterator.next(__ring_iter_56);
    if (__ring_next_56._tag === "none") break;
    const en = __ring_next_56._0;
    const ep_name = hir$evidence_param_name(en);
    const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, ep_name);
    LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca);
    _Map_insert(ctx.named_values, ep_name, alloca);
    param_idx = (param_idx + 1);
  }
  const body_val = codegen_llvm_expr$gen_llvm_expr(ctx, body);
  LLVMBuildRet(ctx.builder, body_val);
  ctx.named_values = saved_named;
  ctx.current_fn = saved_fn;
  ctx.current_fn_name = saved_fn_name;
}

function emit_trait_default_methods(ctx, trait_name, methods) {
  const __ring_iter_57 = __List_Iterable.iter(methods);
  while (true) {
    const __ring_next_57 = __ListIterator_Iterator.next(__ring_iter_57);
    if (__ring_next_57._tag === "none") break;
    const method = __ring_next_57._0;
    if ((!method.has_default)) {
      continue;
    }
    __ring_match77: {
      const __ring_m77 = method.body;
      if (__ring_m77._tag === "some") {
        const body = __ring_m77._0;
        const default_fn_name = `__${trait_name}_${method.name}`;
        __ring_match78: {
          const __ring_m78 = _Map_get(ctx.functions, default_fn_name);
          if (__ring_m78._tag === "some") {
            const fn_val = __ring_m78._0;
            emit_one_default_method(ctx, fn_val, default_fn_name, trait_name, method, body);
            break __ring_match78;
          }
          if (__ring_m78._tag === "none") {
            break __ring_match78;
          }
          __match_fail(__ring_m78);
        }
        break __ring_match77;
      }
      if (__ring_m77._tag === "none") {
        break __ring_match77;
      }
      __match_fail(__ring_m77);
    }
  }
}

function emit_trait_dict(ctx, target_type, trait_name, methods) {
  const dict_name = hir$trait_dict_name(target_type, trait_name);
  let impl_methods = [];
  const __ring_iter_58 = __List_Iterable.iter(methods);
  while (true) {
    const __ring_next_58 = __ListIterator_Iterator.next(__ring_iter_58);
    if (__ring_next_58._tag === "none") break;
    const m = __ring_next_58._0;
    __ring_match79: {
      const __ring_m79 = m;
      if (__ring_m79._tag === "Fn") {
        const name = __ring_m79.name;
        List_push(impl_methods, name);
        break __ring_match79;
      }
      break __ring_match79;
    }
  }
  let __ring_blk33;
  __ring_match80: {
    const __ring_m80 = _Map_get(ctx.trait_method_order, trait_name);
    if (__ring_m80._tag === "some") {
      const order = __ring_m80._0;
      __ring_blk33 = order;
      break __ring_match80;
    }
    if (__ring_m80._tag === "none") {
      __ring_blk33 = impl_methods;
      break __ring_match80;
    }
    __match_fail(__ring_m80);
  }
  const method_order = __ring_blk33;
  const method_count = List_len(method_order);
  if ((method_count === 0)) {
    return;
  }
  const build_fn_name = `ring_dict_build_${dict_name}`;
  const build_fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0);
  const build_fn = LLVMAddFunction(ctx.module, build_fn_name, build_fn_ty);
  _Map_insert(ctx.functions, build_fn_name, build_fn);
  _Map_insert(ctx.fn_types, build_fn_name, build_fn_ty);
  const saved_fn = ctx.current_fn;
  ctx.current_fn = Option_some(build_fn);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, build_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  let dict_elem_types = [ctx.i64_type];
  const __ring_end59 = method_count;
  for (let i = 0; i < __ring_end59; i++) {
    List_push(dict_elem_types, ctx.ptr_type);
  }
  const dict_struct_ty = LLVMStructTypeInContext(ctx.context, dict_elem_types, 0);
  const dict_size = LLVMSizeOf(dict_struct_ty);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const dict_typeid = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$RING_TYPEID_DICT_STATIC, 0);
  const dict_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [dict_size, dict_typeid], "dict");
  const count_slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 0, "dcnt");
  LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, method_count, 0), count_slot);
  const closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0);
  const closure_size = LLVMSizeOf(closure_ty);
  const __ring_end60 = method_count;
  for (let i = 0; i < __ring_end60; i++) {
    __ring_match81: {
      const __ring_m81 = List_get(method_order, i);
      if (__ring_m81._tag === "some") {
        const method_name = __ring_m81._0;
        const _ = emit_dict_method_slot(ctx, target_type, trait_name, method_name, dict_struct_ty, dict_ptr, closure_ty, closure_size, alloc_fn, alloc_ty, i);
        break __ring_match81;
      }
      if (__ring_m81._tag === "none") {
        break __ring_match81;
      }
      __match_fail(__ring_m81);
    }
  }
  LLVMBuildRet(ctx.builder, dict_ptr);
  ctx.current_fn = saved_fn;
  const getter = codegen_llvm_expr$emit_memoised_dict_getter(ctx, dict_name, build_fn, build_fn_ty);
  return _Map_insert(ctx.dict_globals, dict_name, getter);
}

function emit_llvm_decl(ctx, decl) {
  __ring_match82: {
    const __ring_m82 = decl;
    if (__ring_m82._tag === "Fn") {
      const name = __ring_m82.name; const params = __ring_m82.params; const effects = __ring_m82.effects; const body = __ring_m82.body; const trait_bounds = __ring_m82.trait_bounds;
      return emit_fn_body(ctx, name, params, effects, body, trait_bounds, Option_none);
      break __ring_match82;
    }
    if (__ring_m82._tag === "Struct") {
      const name = __ring_m82.name; const fields = __ring_m82.fields;
      return emit_struct_constructor(ctx, name, fields);
      break __ring_match82;
    }
    if (__ring_m82._tag === "Enum") {
      const name = __ring_m82.name; const variants = __ring_m82.variants;
      return emit_enum_constructors(ctx, name, variants);
      break __ring_match82;
    }
    if (__ring_m82._tag === "Impl") {
      const target_type = __ring_m82.target_type; const trait_name = __ring_m82.trait_name; const methods = __ring_m82.methods;
      const __ring_iter_61 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_61 = __ListIterator_Iterator.next(__ring_iter_61);
        if (__ring_next_61._tag === "none") break;
        const method = __ring_next_61._0;
        __ring_match83: {
          const __ring_m83 = method;
          if (__ring_m83._tag === "Fn") {
            const mn = __ring_m83.name; const mp = __ring_m83.params; const me = __ring_m83.effects; const mb = __ring_m83.body; const mtb = __ring_m83.trait_bounds;
            emit_fn_body(ctx, mn, mp, me, mb, mtb, Option_some(target_type));
            break __ring_match83;
          }
          break __ring_match83;
        }
      }
      __ring_match84: {
        const __ring_m84 = trait_name;
        if (__ring_m84._tag === "some") {
          const tn = __ring_m84._0;
          emit_trait_dict(ctx, target_type, tn, methods);
          return emit_default_method_stubs(ctx, target_type, tn, methods);
          break __ring_match84;
        }
        if (__ring_m84._tag === "none") {
          break __ring_match84;
        }
        __match_fail(__ring_m84);
      }
      break __ring_match82;
    }
    if (__ring_m82._tag === "Effect") {
      break __ring_match82;
    }
    if (__ring_m82._tag === "Test") {
      break __ring_match82;
    }
    if (__ring_m82._tag === "Trait") {
      const trait_name = __ring_m82.name; const trait_methods = __ring_m82.methods;
      return emit_trait_default_methods(ctx, trait_name, trait_methods);
      break __ring_match82;
    }
    if (__ring_m82._tag === "ExternFn") {
      break __ring_match82;
    }
    if (__ring_m82._tag === "ExternType") {
      break __ring_match82;
    }
    if (__ring_m82._tag === "TypeAlias") {
      break __ring_match82;
    }
    if (__ring_m82._tag === "Const") {
      const name = __ring_m82.name; const init = __ring_m82.init;
      return emit_const_body(ctx, name, init);
      break __ring_match82;
    }
    if (__ring_m82._tag === "ModBlock") {
      const mod_decls = __ring_m82.decls;
      const __ring_iter_62 = __List_Iterable.iter(mod_decls);
      while (true) {
        const __ring_next_62 = __ListIterator_Iterator.next(__ring_iter_62);
        if (__ring_next_62._tag === "none") break;
        const subdecl = __ring_next_62._0;
        emit_llvm_decl(ctx, subdecl);
      }
      break __ring_match82;
    }
    if (__ring_m82._tag === "Sig") {
      break __ring_match82;
    }
    __match_fail(__ring_m82);
  }
}

function register_enum_info(ctx, name, variants) {
  let max_fields = 0;
  let variant_map = map_new();
  let tag = 0;
  const __ring_iter_63 = __List_Iterable.iter(variants);
  while (true) {
    const __ring_next_63 = __ListIterator_Iterator.next(__ring_iter_63);
    if (__ring_next_63._tag === "none") break;
    const v = __ring_next_63._0;
    const fc = List_len(v.fields);
    if ((fc > max_fields)) {
      max_fields = fc;
    }
    let __ring_blk34;
    __ring_match85: {
      const __ring_m85 = v.field_names;
      if (__ring_m85._tag === "some") {
        const names = __ring_m85._0;
        __ring_blk34 = names;
        break __ring_match85;
      }
      if (__ring_m85._tag === "none") {
        let ns = [];
        const __ring_end64 = fc;
        for (let j = 0; j < __ring_end64; j++) {
          List_push(ns, "");
        }
        __ring_blk34 = ns;
        break __ring_match85;
      }
      __match_fail(__ring_m85);
    }
    const fnames = __ring_blk34;
    let frs = [];
    const __ring_iter_65 = __List_Iterable.iter(v.fields);
    while (true) {
      const __ring_next_65 = __ListIterator_Iterator.next(__ring_iter_65);
      if (__ring_next_65._tag === "none") break;
      const ft = __ring_next_65._0;
      List_push(frs, hir$type_contains_extern_handle(ft, ctx.extern_types));
    }
    _Map_insert(variant_map, v.name, new codegen_llvm_ctx$EnumVariantInfo(tag, fc, fnames, frs));
    tag = (tag + 1);
  }
  let elem_types = [ctx.i64_type];
  const __ring_end66 = max_fields;
  for (let i = 0; i < __ring_end66; i++) {
    List_push(elem_types, ctx.ptr_type);
  }
  const enum_ty = LLVMStructTypeInContext(ctx.context, elem_types, 0);
  return _Map_insert(ctx.enum_types, name, new codegen_llvm_ctx$EnumTypeInfo(variant_map, max_fields, enum_ty));
}

function register_struct_info(ctx, name, fields) {
  let field_names = [];
  let field_types = [];
  let field_rc_skip = [];
  const __ring_iter_67 = __List_Iterable.iter(fields);
  while (true) {
    const __ring_next_67 = __ListIterator_Iterator.next(__ring_iter_67);
    if (__ring_next_67._tag === "none") break;
    const f = __ring_next_67._0;
    List_push(field_names, f.name);
    List_push(field_types, ctx.ptr_type);
    List_push(field_rc_skip, hir$type_contains_extern_handle(f.ty, ctx.extern_types));
  }
  const struct_ty = LLVMStructTypeInContext(ctx.context, field_types, 0);
  return _Map_insert(ctx.struct_types, name, new codegen_llvm_ctx$StructFieldInfo(field_names, field_rc_skip, struct_ty));
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


export { emit_llvm_decl, register_struct_info, register_enum_info, emit_derived_impls_llvm };