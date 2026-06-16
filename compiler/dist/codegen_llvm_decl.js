import { __EffectAbort, __ring_raise_fail, Cell, Cell_get, Cell_set, Cell_update, __match_fail, __ring_deep_eq, __ring_tuple_eq, __ring_set_has, __ring_index, __ring_map_index, __ring_str_index, print, assert, panic, exit, json_stringify, __ring_ev_io, Option_some, Option_none, Option_is_some, Option_is_none, Option_unwrap_or, Option_unwrap, Str_len, Str_contains, Str_starts_with, Str_ends_with, Str_slice, Str_trim, Str_to_upper, Str_to_lower, Str_replace, Str_split, Str_char_at, Str_index_of, Str_pad_start, Str_pad_end, Str_repeat, Str_char_code_at, Str_trim_start, Str_trim_end, Str_is_empty, Str_last_index_of, Int_to_str, Float_to_str, parse_int, parse_float, List_len, List_get, List_push, List_concat, List_extend, List_slice, List_reverse, List_join, List_sort_by, List_set, List_pop, List_shift, List_clear, List_find_index, list_clone, map_new, map_from, map_clone, _Map_len, _Map_get, _Map_contains_key, _Map_keys, _Map_values, _Map_entries, _Map_insert, _Map_remove, _Map_clear, set_new, set_from, set_clone, _Set_len, _Set_to_list, _Set_insert, _Set_remove, _Set_union, _Set_intersect, _Set_difference, _Set_clear, string_builder, StringBuilder_add, StringBuilder_line, StringBuilder_add_int, StringBuilder_to_str, StringBuilder_len, read_file, write_file, file_exists, delete_file, path_join, path_resolve, path_dirname, path_basename, path_extname, argv, exit_process, eprintln, cwd, exec_sync, __Int_Eq, __Float_Eq, __Str_Eq, __Bool_Eq, __Option_Eq, __Int_Clone, __Float_Clone, __Str_Clone, __Bool_Clone, __List_Clone, __Map_Clone, __Set_Clone, __Option_Clone, __Int_Ord, __Float_Ord, __Str_Ord, __Bool_Ord, __Int_Debug, __Float_Debug, __Str_Debug, __Bool_Debug, __Option_Debug, __List_Debug, __Map_Debug, __Set_Debug } from "./__ring_runtime.js";
import { ANY as types$ANY, BOOL as types$BOOL, BUILTIN_BOOL as types$BUILTIN_BOOL, BUILTIN_CELL as types$BUILTIN_CELL, BUILTIN_FLOAT as types$BUILTIN_FLOAT, BUILTIN_INT as types$BUILTIN_INT, BUILTIN_LIST as types$BUILTIN_LIST, BUILTIN_MAP as types$BUILTIN_MAP, BUILTIN_OPTION as types$BUILTIN_OPTION, BUILTIN_RANGE as types$BUILTIN_RANGE, BUILTIN_SET as types$BUILTIN_SET, BUILTIN_STR as types$BUILTIN_STR, BUILTIN_STRING_BUILDER as types$BUILTIN_STRING_BUILDER, EMPTY_ROW as types$EMPTY_ROW, FLOAT as types$FLOAT, INT as types$INT, NEVER as types$NEVER, STR as types$STR, UNIT as types$UNIT, effect_kind_name as types$effect_kind_name, effect_row as types$effect_row, effect_row_to_string as types$effect_row_to_string, effect_to_string as types$effect_to_string, effects_equal as types$effects_equal, effects_match_kind as types$effects_match_kind, effects_same_kind as types$effects_same_kind, is_list_type as types$is_list_type, is_map_type as types$is_map_type, is_option_type as types$is_option_type, is_set_type as types$is_set_type, list_element as types$list_element, make_list_type as types$make_list_type, make_map_type as types$make_map_type, make_option_type as types$make_option_type, make_set_type as types$make_set_type, open_effect_row as types$open_effect_row, option_inner as types$option_inner, row_contains as types$row_contains, row_merge as types$row_merge, type_to_builtin_name as types$type_to_builtin_name, type_to_string as types$type_to_string, types_equal as types$types_equal, Effect_IoEffect as types$Effect_IoEffect, Effect_FailEffect as types$Effect_FailEffect, Effect_MutEffect as types$Effect_MutEffect, Effect_CustomEffect as types$Effect_CustomEffect, EffectRow as types$EffectRow, EnumVariant as types$EnumVariant, RecordField as types$RecordField, RowMergeResult as types$RowMergeResult, StructField as types$StructField, Type_IntType as types$Type_IntType, Type_FloatType as types$Type_FloatType, Type_StrType as types$Type_StrType, Type_BoolType as types$Type_BoolType, Type_UnitType as types$Type_UnitType, Type_NeverType as types$Type_NeverType, Type_AnyType as types$Type_AnyType, Type_TypeVar as types$Type_TypeVar, Type_FnType as types$Type_FnType, Type_StructType as types$Type_StructType, Type_EnumType as types$Type_EnumType, Type_GenericType as types$Type_GenericType, Type_RecordType as types$Type_RecordType, Type_EffectRowType as types$Type_EffectRowType, Type_TupleType as types$Type_TupleType, Type_ErrorType as types$Type_ErrorType } from "./types.js";
import { span_zero as ast$span_zero, AssocConstraint as ast$AssocConstraint, BinOp_Add as ast$BinOp_Add, BinOp_Sub as ast$BinOp_Sub, BinOp_Mul as ast$BinOp_Mul, BinOp_Div as ast$BinOp_Div, BinOp_Mod as ast$BinOp_Mod, BinOp_Eq as ast$BinOp_Eq, BinOp_Neq as ast$BinOp_Neq, BinOp_Lt as ast$BinOp_Lt, BinOp_Lte as ast$BinOp_Lte, BinOp_Gt as ast$BinOp_Gt, BinOp_Gte as ast$BinOp_Gte, BinOp_And as ast$BinOp_And, BinOp_Or as ast$BinOp_Or, Decl_Fn as ast$Decl_Fn, Decl_Struct as ast$Decl_Struct, Decl_Enum as ast$Decl_Enum, Decl_Impl as ast$Decl_Impl, Decl_Effect as ast$Decl_Effect, Decl_Test as ast$Decl_Test, Decl_Trait as ast$Decl_Trait, Decl_ExternFn as ast$Decl_ExternFn, Decl_ExternType as ast$Decl_ExternType, Decl_TypeAlias as ast$Decl_TypeAlias, Decl_Const as ast$Decl_Const, Decl_ModBlock as ast$Decl_ModBlock, Decl_Sig as ast$Decl_Sig, Decl_EffectAlias as ast$Decl_EffectAlias, Decl_Delegate as ast$Decl_Delegate, Decl_AssocType as ast$Decl_AssocType, DestructureBinding as ast$DestructureBinding, EffectExpr as ast$EffectExpr, EffectHandler as ast$EffectHandler, EffectOpDecl as ast$EffectOpDecl, EnumVariantDecl as ast$EnumVariantDecl, Expr_IntLit as ast$Expr_IntLit, Expr_FloatLit as ast$Expr_FloatLit, Expr_StrLit as ast$Expr_StrLit, Expr_BoolLit as ast$Expr_BoolLit, Expr_Ident as ast$Expr_Ident, Expr_BinOp as ast$Expr_BinOp, Expr_UnaryOp as ast$Expr_UnaryOp, Expr_Call as ast$Expr_Call, Expr_MethodCall as ast$Expr_MethodCall, Expr_FieldAccess as ast$Expr_FieldAccess, Expr_StructLit as ast$Expr_StructLit, Expr_MatchExpr as ast$Expr_MatchExpr, Expr_Block as ast$Expr_Block, Expr_IfExpr as ast$Expr_IfExpr, Expr_StringInterp as ast$Expr_StringInterp, Expr_CatchExpr as ast$Expr_CatchExpr, Expr_HandleExpr as ast$Expr_HandleExpr, Expr_Lambda as ast$Expr_Lambda, Expr_Range as ast$Expr_Range, Expr_ListLit as ast$Expr_ListLit, Expr_TupleLit as ast$Expr_TupleLit, Expr_IndexExpr as ast$Expr_IndexExpr, Expr_ReturnExpr as ast$Expr_ReturnExpr, LiteralValue_IntVal as ast$LiteralValue_IntVal, LiteralValue_FloatVal as ast$LiteralValue_FloatVal, LiteralValue_StrVal as ast$LiteralValue_StrVal, LiteralValue_BoolVal as ast$LiteralValue_BoolVal, MatchArm as ast$MatchArm, NamedEnumField as ast$NamedEnumField, NamedImport as ast$NamedImport, NamedPatternField as ast$NamedPatternField, Param as ast$Param, Pattern_Wildcard as ast$Pattern_Wildcard, Pattern_Binding as ast$Pattern_Binding, Pattern_Constructor as ast$Pattern_Constructor, Pattern_NamedConstructor as ast$Pattern_NamedConstructor, Pattern_Literal as ast$Pattern_Literal, Pattern_TuplePattern as ast$Pattern_TuplePattern, Pattern_OrPattern as ast$Pattern_OrPattern, Position as ast$Position, Program as ast$Program, RecordTypeField as ast$RecordTypeField, SigMember as ast$SigMember, Span as ast$Span, Stmt_Let as ast$Stmt_Let, Stmt_Var as ast$Stmt_Var, Stmt_Assign as ast$Stmt_Assign, Stmt_ExprStmt as ast$Stmt_ExprStmt, Stmt_Return as ast$Stmt_Return, Stmt_While as ast$Stmt_While, Stmt_ForIn as ast$Stmt_ForIn, Stmt_Break as ast$Stmt_Break, Stmt_Continue as ast$Stmt_Continue, Stmt_LetDestructure as ast$Stmt_LetDestructure, Stmt_IfLet as ast$Stmt_IfLet, StringInterpPart_LitPart as ast$StringInterpPart_LitPart, StringInterpPart_ExprPart as ast$StringInterpPart_ExprPart, StructFieldDecl as ast$StructFieldDecl, StructFieldInit as ast$StructFieldInit, TypeBound as ast$TypeBound, TypeExpr_Named as ast$TypeExpr_Named, TypeExpr_FnType as ast$TypeExpr_FnType, TypeExpr_OptionType as ast$TypeExpr_OptionType, TypeExpr_RecordType as ast$TypeExpr_RecordType, TypeExpr_TupleType as ast$TypeExpr_TupleType, TypeParam as ast$TypeParam, UnaryOp_Neg as ast$UnaryOp_Neg, UnaryOp_Not as ast$UnaryOp_Not, UseDecl as ast$UseDecl, UseImport_NamedItems as ast$UseImport_NamedItems, UseImport_Module as ast$UseImport_Module, UsePath as ast$UsePath, __BinOp_Eq as ast$__BinOp_Eq, __BinOp_Clone as ast$__BinOp_Clone, __BinOp_Ord as ast$__BinOp_Ord, __BinOp_Debug as ast$__BinOp_Debug, __DestructureBinding_Clone as ast$__DestructureBinding_Clone, __DestructureBinding_Debug as ast$__DestructureBinding_Debug, __LiteralValue_Eq as ast$__LiteralValue_Eq, __LiteralValue_Clone as ast$__LiteralValue_Clone, __LiteralValue_Ord as ast$__LiteralValue_Ord, __LiteralValue_Debug as ast$__LiteralValue_Debug, __NamedImport_Eq as ast$__NamedImport_Eq, __NamedImport_Clone as ast$__NamedImport_Clone, __NamedImport_Debug as ast$__NamedImport_Debug, __Position_Eq as ast$__Position_Eq, __Position_Clone as ast$__Position_Clone, __Position_Ord as ast$__Position_Ord, __Position_Debug as ast$__Position_Debug, __Span_Eq as ast$__Span_Eq, __Span_Clone as ast$__Span_Clone, __Span_Ord as ast$__Span_Ord, __Span_Debug as ast$__Span_Debug, __UnaryOp_Eq as ast$__UnaryOp_Eq, __UnaryOp_Clone as ast$__UnaryOp_Clone, __UnaryOp_Ord as ast$__UnaryOp_Ord, __UnaryOp_Debug as ast$__UnaryOp_Debug, __UseDecl_Clone as ast$__UseDecl_Clone, __UseDecl_Debug as ast$__UseDecl_Debug, __UseImport_Clone as ast$__UseImport_Clone, __UseImport_Debug as ast$__UseImport_Debug, __UsePath_Clone as ast$__UsePath_Clone, __UsePath_Debug as ast$__UsePath_Debug } from "./ast.js";
import { BUILTIN_BOOL as hir$BUILTIN_BOOL, BUILTIN_CELL as hir$BUILTIN_CELL, BUILTIN_FLOAT as hir$BUILTIN_FLOAT, BUILTIN_INT as hir$BUILTIN_INT, BUILTIN_LIST as hir$BUILTIN_LIST, BUILTIN_MAP as hir$BUILTIN_MAP, BUILTIN_OPTION as hir$BUILTIN_OPTION, BUILTIN_RANGE as hir$BUILTIN_RANGE, BUILTIN_SET as hir$BUILTIN_SET, BUILTIN_STR as hir$BUILTIN_STR, BUILTIN_STRING_BUILDER as hir$BUILTIN_STRING_BUILDER, CELL_METHODS as hir$CELL_METHODS, ENUM_TAG_FIELD as hir$ENUM_TAG_FIELD, FLOAT_METHODS as hir$FLOAT_METHODS, INT_METHODS as hir$INT_METHODS, LIST_HOF_METHODS as hir$LIST_HOF_METHODS, LIST_NON_HOF_METHODS as hir$LIST_NON_HOF_METHODS, MAP_HOF_METHODS as hir$MAP_HOF_METHODS, MAP_NON_HOF_METHODS as hir$MAP_NON_HOF_METHODS, OPTION_HOF_METHODS as hir$OPTION_HOF_METHODS, OPTION_NONE_TAG as hir$OPTION_NONE_TAG, OPTION_NON_HOF_METHODS as hir$OPTION_NON_HOF_METHODS, OPTION_PAYLOAD_FIELD as hir$OPTION_PAYLOAD_FIELD, OPTION_SOME_TAG as hir$OPTION_SOME_TAG, RUNTIME_EFFECT_ABORT as hir$RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL as hir$RUNTIME_MATCH_FAIL, SET_HOF_METHODS as hir$SET_HOF_METHODS, SET_NON_HOF_METHODS as hir$SET_NON_HOF_METHODS, STRINGBUILDER_METHODS as hir$STRINGBUILDER_METHODS, STR_METHODS as hir$STR_METHODS, collect_extern_type_names as hir$collect_extern_type_names, default_evidence_name as hir$default_evidence_name, default_method_self_name as hir$default_method_self_name, dict_instance_name as hir$dict_instance_name, effect_op_slot as hir$effect_op_slot, evidence_param_name as hir$evidence_param_name, hexpr_effects as hir$hexpr_effects, hexpr_span as hir$hexpr_span, hexpr_type as hir$hexpr_type, is_borrow_returning_call as hir$is_borrow_returning_call, is_extern_handle_type as hir$is_extern_handle_type, is_fresh_owned_bool_value as hir$is_fresh_owned_bool_value, is_rc_excluded_type as hir$is_rc_excluded_type, trait_bound_param_name as hir$trait_bound_param_name, trait_dict_name as hir$trait_dict_name, type_contains_extern_handle as hir$type_contains_extern_handle, variant_js_name as hir$variant_js_name, DerivedField as hir$DerivedField, DerivedImpl as hir$DerivedImpl, DerivedVariant as hir$DerivedVariant, DictDispatchInfo as hir$DictDispatchInfo, DictRef_Simple as hir$DictRef_Simple, DictRef_Wrapped as hir$DictRef_Wrapped, DictRef_Static as hir$DictRef_Static, FieldAction_Identity as hir$FieldAction_Identity, FieldAction_Call as hir$FieldAction_Call, FieldAction_Tuple as hir$FieldAction_Tuple, FieldAction_FnLiteral as hir$FieldAction_FnLiteral, HAssocType as hir$HAssocType, HDecl_Fn as hir$HDecl_Fn, HDecl_Struct as hir$HDecl_Struct, HDecl_Enum as hir$HDecl_Enum, HDecl_Impl as hir$HDecl_Impl, HDecl_Effect as hir$HDecl_Effect, HDecl_Test as hir$HDecl_Test, HDecl_Trait as hir$HDecl_Trait, HDecl_ExternFn as hir$HDecl_ExternFn, HDecl_ExternType as hir$HDecl_ExternType, HDecl_TypeAlias as hir$HDecl_TypeAlias, HDecl_Const as hir$HDecl_Const, HDecl_ModBlock as hir$HDecl_ModBlock, HDecl_Sig as hir$HDecl_Sig, HDictDef as hir$HDictDef, HEffectHandler as hir$HEffectHandler, HEffectOp as hir$HEffectOp, HEnumVariant as hir$HEnumVariant, HExpr_IntLit as hir$HExpr_IntLit, HExpr_FloatLit as hir$HExpr_FloatLit, HExpr_StrLit as hir$HExpr_StrLit, HExpr_BoolLit as hir$HExpr_BoolLit, HExpr_Ident as hir$HExpr_Ident, HExpr_BinOp as hir$HExpr_BinOp, HExpr_UnaryOp as hir$HExpr_UnaryOp, HExpr_Call as hir$HExpr_Call, HExpr_FieldAccess as hir$HExpr_FieldAccess, HExpr_StructLit as hir$HExpr_StructLit, HExpr_NamedVariantConstruct as hir$HExpr_NamedVariantConstruct, HExpr_MatchExpr as hir$HExpr_MatchExpr, HExpr_Block as hir$HExpr_Block, HExpr_IfExpr as hir$HExpr_IfExpr, HExpr_StringInterp as hir$HExpr_StringInterp, HExpr_TryCatch as hir$HExpr_TryCatch, HExpr_HandleExpr as hir$HExpr_HandleExpr, HExpr_Lambda as hir$HExpr_Lambda, HExpr_EffectOp as hir$HExpr_EffectOp, HExpr_RangeExpr as hir$HExpr_RangeExpr, HExpr_ListLit as hir$HExpr_ListLit, HExpr_TupleLit as hir$HExpr_TupleLit, HExpr_IndexExpr as hir$HExpr_IndexExpr, HExpr_DictConstruct as hir$HExpr_DictConstruct, HExpr_Clone as hir$HExpr_Clone, HExpr_ReturnExpr as hir$HExpr_ReturnExpr, HForInDestructure as hir$HForInDestructure, HLetDestructureBinding as hir$HLetDestructureBinding, HMatchArm as hir$HMatchArm, HParam as hir$HParam, HProgram as hir$HProgram, HSigMember as hir$HSigMember, HStmt_Let as hir$HStmt_Let, HStmt_Var as hir$HStmt_Var, HStmt_Assign as hir$HStmt_Assign, HStmt_ExprStmt as hir$HStmt_ExprStmt, HStmt_Return as hir$HStmt_Return, HStmt_While as hir$HStmt_While, HStmt_ForIn as hir$HStmt_ForIn, HStmt_Break as hir$HStmt_Break, HStmt_Continue as hir$HStmt_Continue, HStmt_LetDestructure as hir$HStmt_LetDestructure, HStmt_IfLet as hir$HStmt_IfLet, HStmt_Drop as hir$HStmt_Drop, HStmt_Dup as hir$HStmt_Dup, HStringInterpPart_Literal as hir$HStringInterpPart_Literal, HStringInterpPart_Expression as hir$HStringInterpPart_Expression, HStructField as hir$HStructField, HStructFieldInit as hir$HStructFieldInit, HTraitMethod as hir$HTraitMethod, TraitBound as hir$TraitBound, TraitDispatch_Builtin as hir$TraitDispatch_Builtin, TraitDispatch_Direct as hir$TraitDispatch_Direct, TraitDispatch_Dict as hir$TraitDispatch_Dict, TypeKind_StructKind as hir$TypeKind_StructKind, TypeKind_EnumKind as hir$TypeKind_EnumKind, __DerivedField_Clone as hir$__DerivedField_Clone, __DerivedField_Debug as hir$__DerivedField_Debug, __DerivedImpl_Clone as hir$__DerivedImpl_Clone, __DerivedImpl_Debug as hir$__DerivedImpl_Debug, __DerivedVariant_Clone as hir$__DerivedVariant_Clone, __DerivedVariant_Debug as hir$__DerivedVariant_Debug, __DictDispatchInfo_Eq as hir$__DictDispatchInfo_Eq, __DictDispatchInfo_Clone as hir$__DictDispatchInfo_Clone, __DictDispatchInfo_Ord as hir$__DictDispatchInfo_Ord, __DictDispatchInfo_Debug as hir$__DictDispatchInfo_Debug, __DictRef_Clone as hir$__DictRef_Clone, __DictRef_Debug as hir$__DictRef_Debug, __FieldAction_Clone as hir$__FieldAction_Clone, __FieldAction_Debug as hir$__FieldAction_Debug, __HDictDef_Clone as hir$__HDictDef_Clone, __HDictDef_Debug as hir$__HDictDef_Debug, __HForInDestructure_Eq as hir$__HForInDestructure_Eq, __HForInDestructure_Clone as hir$__HForInDestructure_Clone, __HForInDestructure_Debug as hir$__HForInDestructure_Debug, __TraitBound_Eq as hir$__TraitBound_Eq, __TraitBound_Clone as hir$__TraitBound_Clone, __TraitBound_Ord as hir$__TraitBound_Ord, __TraitBound_Debug as hir$__TraitBound_Debug, __TraitDispatch_Clone as hir$__TraitDispatch_Clone, __TraitDispatch_Debug as hir$__TraitDispatch_Debug, __TypeKind_Eq as hir$__TypeKind_Eq, __TypeKind_Clone as hir$__TypeKind_Clone, __TypeKind_Ord as hir$__TypeKind_Ord, __TypeKind_Debug as hir$__TypeKind_Debug } from "./hir.js";
import { RING_TYPEID_CELL as codegen_llvm_ctx$RING_TYPEID_CELL, RING_TYPEID_CLOSURE_ENV as codegen_llvm_ctx$RING_TYPEID_CLOSURE_ENV, RING_TYPEID_DICT_DYN as codegen_llvm_ctx$RING_TYPEID_DICT_DYN, RING_TYPEID_DICT_STATIC as codegen_llvm_ctx$RING_TYPEID_DICT_STATIC, build_entry_alloca as codegen_llvm_ctx$build_entry_alloca, fresh_name as codegen_llvm_ctx$fresh_name, get_builtin_typeid as codegen_llvm_ctx$get_builtin_typeid, get_or_assign_typeid as codegen_llvm_ctx$get_or_assign_typeid, get_or_declare_runtime_fn as codegen_llvm_ctx$get_or_declare_runtime_fn, get_rt_fn_type as codegen_llvm_ctx$get_rt_fn_type, llvm_mangle_fn as codegen_llvm_ctx$llvm_mangle_fn, llvm_mangle_fn_with_prefix as codegen_llvm_ctx$llvm_mangle_fn_with_prefix, llvm_mangle_method as codegen_llvm_ctx$llvm_mangle_method, llvm_resolve_fn as codegen_llvm_ctx$llvm_resolve_fn, llvm_resolve_method as codegen_llvm_ctx$llvm_resolve_method, EnumTypeInfo as codegen_llvm_ctx$EnumTypeInfo, EnumVariantInfo as codegen_llvm_ctx$EnumVariantInfo, ExternFnInfo as codegen_llvm_ctx$ExternFnInfo, ExternParamMarshall_PassthroughPtr as codegen_llvm_ctx$ExternParamMarshall_PassthroughPtr, ExternParamMarshall_StrToCstr as codegen_llvm_ctx$ExternParamMarshall_StrToCstr, ExternParamMarshall_StrToCstrAndLen as codegen_llvm_ctx$ExternParamMarshall_StrToCstrAndLen, ExternParamMarshall_IntToI32 as codegen_llvm_ctx$ExternParamMarshall_IntToI32, ExternParamMarshall_IntToI64 as codegen_llvm_ctx$ExternParamMarshall_IntToI64, ExternParamMarshall_FloatToDouble as codegen_llvm_ctx$ExternParamMarshall_FloatToDouble, ExternParamMarshall_ListToDataAndCount as codegen_llvm_ctx$ExternParamMarshall_ListToDataAndCount, ExternParamMarshall_ListToDataAndCountI64 as codegen_llvm_ctx$ExternParamMarshall_ListToDataAndCountI64, ExternRetMarshall_RetPtr as codegen_llvm_ctx$ExternRetMarshall_RetPtr, ExternRetMarshall_RetVoid as codegen_llvm_ctx$ExternRetMarshall_RetVoid, ExternRetMarshall_RetIntToBoxed as codegen_llvm_ctx$ExternRetMarshall_RetIntToBoxed, ExternRetMarshall_RetStrFromCstr as codegen_llvm_ctx$ExternRetMarshall_RetStrFromCstr, LlvmCtx as codegen_llvm_ctx$LlvmCtx, StructFieldInfo as codegen_llvm_ctx$StructFieldInfo, __EnumVariantInfo_Clone as codegen_llvm_ctx$__EnumVariantInfo_Clone, __EnumVariantInfo_Debug as codegen_llvm_ctx$__EnumVariantInfo_Debug, __ExternParamMarshall_Eq as codegen_llvm_ctx$__ExternParamMarshall_Eq, __ExternParamMarshall_Clone as codegen_llvm_ctx$__ExternParamMarshall_Clone, __ExternParamMarshall_Ord as codegen_llvm_ctx$__ExternParamMarshall_Ord, __ExternParamMarshall_Debug as codegen_llvm_ctx$__ExternParamMarshall_Debug, __ExternRetMarshall_Eq as codegen_llvm_ctx$__ExternRetMarshall_Eq, __ExternRetMarshall_Clone as codegen_llvm_ctx$__ExternRetMarshall_Clone, __ExternRetMarshall_Ord as codegen_llvm_ctx$__ExternRetMarshall_Ord, __ExternRetMarshall_Debug as codegen_llvm_ctx$__ExternRetMarshall_Debug } from "./codegen_llvm_ctx.js";
import { box_bool as codegen_llvm_expr$box_bool, box_float as codegen_llvm_expr$box_float, box_int as codegen_llvm_expr$box_int, build_cell_alloc as codegen_llvm_expr$build_cell_alloc, build_cell_store as codegen_llvm_expr$build_cell_store, emit_memoised_const_body as codegen_llvm_expr$emit_memoised_const_body, emit_memoised_dict_getter as codegen_llvm_expr$emit_memoised_dict_getter, gen_llvm_expr as codegen_llvm_expr$gen_llvm_expr, get_or_create_dict_global as codegen_llvm_expr$get_or_create_dict_global, is_boxed_def as codegen_llvm_expr$is_boxed_def, unbox_int as codegen_llvm_expr$unbox_int, unbox_to_i1 as codegen_llvm_expr$unbox_to_i1 } from "./codegen_llvm_expr.js";
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
























function is_enum_const_type(ty) {
  __ring_match6: {
    const __ring_m6 = ty;
    if (__ring_m6._tag === "EnumType") {
      return true;
      break __ring_match6;
    }
    return false;
    break __ring_match6;
  }
}

function emit_const_body(ctx, name, init) {
  let __ring_blk0;
  __ring_match7: {
    const __ring_m7 = ctx.module_prefix;
    if (__ring_m7._tag === "some") {
      const prefix = __ring_m7._0;
      __ring_blk0 = codegen_llvm_ctx$llvm_mangle_fn_with_prefix(prefix, name);
      break __ring_match7;
    }
    if (__ring_m7._tag === "none") {
      __ring_blk0 = codegen_llvm_ctx$llvm_mangle_fn(name);
      break __ring_match7;
    }
    __match_fail(__ring_m7);
  }
  const const_fn_name = __ring_blk0;
  __ring_match8: {
    const __ring_m8 = _Map_get(ctx.functions, const_fn_name);
    if (__ring_m8._tag === "some") {
      const fn_val = __ring_m8._0;
      let __ring_blk1;
      __ring_match9: {
        const __ring_m9 = hir$hexpr_type(init);
        if (__ring_m9._tag === "StrType") {
          __ring_blk1 = true;
          break __ring_match9;
        }
        __ring_blk1 = false;
        break __ring_match9;
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
      break __ring_match8;
    }
    if (__ring_m8._tag === "none") {
      break __ring_match8;
    }
    __match_fail(__ring_m8);
  }
}

function emit_dict_method_thunk(ctx, mangled, method_fn) {
  const thunk_name = `${mangled}__dictthunk`;
  __ring_match10: {
    const __ring_m10 = _Map_get(ctx.functions, thunk_name);
    if (__ring_m10._tag === "some") {
      const existing = __ring_m10._0;
      return existing;
      break __ring_match10;
    }
    if (__ring_m10._tag === "none") {
      break __ring_match10;
    }
    __match_fail(__ring_m10);
  }
  const method_arity = LLVMCountParams(method_fn);
  let thunk_param_types = [ctx.ptr_type];
  const __ring_end2 = method_arity;
  for (let i = 0; i < __ring_end2; i++) {
    List_push(thunk_param_types, ctx.ptr_type);
  }
  const thunk_ty = LLVMFunctionType(ctx.ptr_type, thunk_param_types, 0);
  const thunk_fn = LLVMAddFunction(ctx.module, thunk_name, thunk_ty);
  _Map_insert(ctx.functions, thunk_name, thunk_fn);
  _Map_insert(ctx.fn_types, thunk_name, thunk_ty);
  let __ring_blk2;
  __ring_match11: {
    const __ring_m11 = _Map_get(ctx.fn_types, mangled);
    if (__ring_m11._tag === "some") {
      const t = __ring_m11._0;
      __ring_blk2 = t;
      break __ring_match11;
    }
    if (__ring_m11._tag === "none") {
      let method_param_types = [];
      const __ring_end3 = method_arity;
      for (let i = 0; i < __ring_end3; i++) {
        List_push(method_param_types, ctx.ptr_type);
      }
      __ring_blk2 = LLVMFunctionType(ctx.ptr_type, method_param_types, 0);
      break __ring_match11;
    }
    __match_fail(__ring_m11);
  }
  const method_ty = __ring_blk2;
  const saved_block = LLVMGetInsertBlock(ctx.builder);
  const entry = LLVMAppendBasicBlockInContext(ctx.context, thunk_fn, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  let fwd_args = [];
  const __ring_end4 = method_arity;
  for (let i = 0; i < __ring_end4; i++) {
    List_push(fwd_args, LLVMGetParam(thunk_fn, (i + 1)));
  }
  const call_res = LLVMBuildCall2(ctx.builder, method_ty, method_fn, fwd_args, codegen_llvm_ctx$fresh_name(ctx, "tk"));
  LLVMBuildRet(ctx.builder, call_res);
  LLVMPositionBuilderAtEnd(ctx.builder, saved_block);
  return thunk_fn;
}

function emit_dict_method_slot(ctx, target_type, method_name, dict_struct_ty, dict_ptr, closure_ty, closure_size, alloc_fn, alloc_ty, slot_idx) {
  const mangled = codegen_llvm_ctx$llvm_mangle_method(target_type, method_name);
  const closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0);
  __ring_match12: {
    const __ring_m12 = _Map_get(ctx.functions, mangled);
    if (__ring_m12._tag === "some") {
      const method_fn = __ring_m12._0;
      const thunk_fn = emit_dict_method_thunk(ctx, mangled, method_fn);
      const closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], codegen_llvm_ctx$fresh_name(ctx, "cls"));
      const fn_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, codegen_llvm_ctx$fresh_name(ctx, "fps"));
      LLVMBuildStore(ctx.builder, thunk_fn, fn_slot);
      const env_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, codegen_llvm_ctx$fresh_name(ctx, "eps"));
      LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), env_slot);
      const slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (slot_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ds"));
      return LLVMBuildStore(ctx.builder, closure_ptr, slot_ptr);
      break __ring_match12;
    }
    if (__ring_m12._tag === "none") {
      const slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, (slot_idx + 1), codegen_llvm_ctx$fresh_name(ctx, "ds"));
      return LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), slot_ptr);
      break __ring_match12;
    }
    __match_fail(__ring_m12);
  }
}

function emit_enum_constructors(ctx, name, variants) {
  let __ring_blk3;
  __ring_match13: {
    const __ring_m13 = _Map_get(ctx.enum_types, name);
    if (__ring_m13._tag === "some") {
      const info = __ring_m13._0;
      __ring_blk3 = info;
      break __ring_match13;
    }
    if (__ring_m13._tag === "none") {
      __ring_blk3 = panic(`LLVM codegen: enum '${name}' not registered`);
      break __ring_match13;
    }
    __match_fail(__ring_m13);
  }
  const enum_info = __ring_blk3;
  const __ring_iter_5 = __List_Iterable.iter(variants);
  while (true) {
    const __ring_next_5 = __ListIterator_Iterator.next(__ring_iter_5);
    if (__ring_next_5._tag === "none") break;
    const v = __ring_next_5._0;
    const ctor_name = `ring_${name}_${v.name}`;
    let __ring_blk4;
    __ring_match14: {
      const __ring_m14 = _Map_get(enum_info.variants, v.name);
      if (__ring_m14._tag === "some") {
        const vi = __ring_m14._0;
        __ring_blk4 = vi;
        break __ring_match14;
      }
      if (__ring_m14._tag === "none") {
        __ring_blk4 = panic(`LLVM codegen: variant '${v.name}' not found in enum '${name}'`);
        break __ring_match14;
      }
      __match_fail(__ring_m14);
    }
    const variant_info = __ring_blk4;
    let __ring_blk5;
    __ring_match15: {
      const __ring_m15 = _Map_get(ctx.functions, ctor_name);
      if (__ring_m15._tag === "some") {
        const fv = __ring_m15._0;
        __ring_blk5 = fv;
        break __ring_match15;
      }
      if (__ring_m15._tag === "none") {
        __ring_blk5 = panic(`LLVM codegen: enum ctor '${ctor_name}' not forward-declared`);
        break __ring_match15;
      }
      __match_fail(__ring_m15);
    }
    const fn_val = __ring_blk5;
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
    const __ring_end6 = List_len(v.fields);
    for (let i = 0; i < __ring_end6; i++) {
      const param_val = LLVMGetParam(fn_val, i);
      const field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, (i + 1), "ef");
      LLVMBuildStore(ctx.builder, param_val, field_ptr);
    }
    LLVMBuildRet(ctx.builder, enum_ptr);
    ctx.current_fn = saved_fn;
  }
}

function emit_fn_body(ctx, name, params, effects, body, trait_bounds, impl_type) {
  let __ring_blk6;
  __ring_match16: {
    const __ring_m16 = impl_type;
    if (__ring_m16._tag === "some") {
      const t = __ring_m16._0;
      __ring_blk6 = codegen_llvm_ctx$llvm_mangle_method(t, name);
      break __ring_match16;
    }
    if (__ring_m16._tag === "none") {
      let __ring_blk7;
      __ring_match17: {
        const __ring_m17 = ctx.module_prefix;
        if (__ring_m17._tag === "some") {
          const prefix = __ring_m17._0;
          __ring_blk7 = codegen_llvm_ctx$llvm_mangle_fn_with_prefix(prefix, name);
          break __ring_match17;
        }
        if (__ring_m17._tag === "none") {
          __ring_blk7 = codegen_llvm_ctx$llvm_mangle_fn(name);
          break __ring_match17;
        }
        __match_fail(__ring_m17);
      }
      __ring_blk6 = __ring_blk7;
      break __ring_match16;
    }
    __match_fail(__ring_m16);
  }
  const mangled = __ring_blk6;
  let __ring_blk8;
  __ring_match18: {
    const __ring_m18 = _Map_get(ctx.functions, mangled);
    if (__ring_m18._tag === "some") {
      const f = __ring_m18._0;
      __ring_blk8 = f;
      break __ring_match18;
    }
    if (__ring_m18._tag === "none") {
      __ring_blk8 = panic(`LLVM codegen: function '${mangled}' not forward-declared`);
      break __ring_match18;
    }
    __match_fail(__ring_m18);
  }
  const fn_val = __ring_blk8;
  const saved_fn = ctx.current_fn;
  ctx.current_fn = Option_some(fn_val);
  const saved_fn_name = ctx.current_fn_name;
  ctx.current_fn_name = mangled;
  const saved_named = ctx.named_values;
  ctx.named_values = map_new();
  const entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry");
  LLVMPositionBuilderAtEnd(ctx.builder, entry);
  let param_idx = 0;
  const __ring_iter_7 = __List_Iterable.iter(params);
  while (true) {
    const __ring_next_7 = __ListIterator_Iterator.next(__ring_iter_7);
    if (__ring_next_7._tag === "none") break;
    const p = __ring_next_7._0;
    const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, p.name);
    LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca);
    _Map_insert(ctx.named_values, p.name, alloca);
    param_idx = (param_idx + 1);
  }
  const __ring_iter_8 = __List_Iterable.iter(trait_bounds);
  while (true) {
    const __ring_next_8 = __ListIterator_Iterator.next(__ring_iter_8);
    if (__ring_next_8._tag === "none") break;
    const b = __ring_next_8._0;
    const dict_name = hir$trait_bound_param_name(b.type_param, b.trait_name);
    const alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, dict_name);
    LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca);
    _Map_insert(ctx.named_values, dict_name, alloca);
    param_idx = (param_idx + 1);
  }
  let __ring_blk9;
  __ring_match19: {
    const __ring_m19 = _Map_get(ctx.local_fn_effects, name);
    if (__ring_m19._tag === "some") {
      const eff = __ring_m19._0;
      __ring_blk9 = eff;
      break __ring_match19;
    }
    if (__ring_m19._tag === "none") {
      __ring_blk9 = effects;
      break __ring_match19;
    }
    __match_fail(__ring_m19);
  }
  const effective_effects = __ring_blk9;
  const ev_names = codegen_ctx$extract_effect_names(effective_effects);
  const __ring_iter_9 = __List_Iterable.iter(ev_names);
  while (true) {
    const __ring_next_9 = __ListIterator_Iterator.next(__ring_iter_9);
    if (__ring_next_9._tag === "none") break;
    const en = __ring_next_9._0;
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
  __ring_match20: {
    const __ring_m20 = _Map_get(ctx.functions, ctor_name);
    if (__ring_m20._tag === "some") {
      return;
      break __ring_match20;
    }
    if (__ring_m20._tag === "none") {
      break __ring_match20;
    }
    __match_fail(__ring_m20);
  }
  let param_types = [];
  const __ring_iter_10 = __List_Iterable.iter(fields);
  while (true) {
    const __ring_next_10 = __ListIterator_Iterator.next(__ring_iter_10);
    if (__ring_next_10._tag === "none") break;
    const f = __ring_next_10._0;
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
  let __ring_blk10;
  __ring_match21: {
    const __ring_m21 = _Map_get(ctx.struct_types, name);
    if (__ring_m21._tag === "some") {
      const info = __ring_m21._0;
      __ring_blk10 = info;
      break __ring_match21;
    }
    if (__ring_m21._tag === "none") {
      __ring_blk10 = panic(`LLVM codegen: struct '${name}' not registered`);
      break __ring_match21;
    }
    __match_fail(__ring_m21);
  }
  const struct_info = __ring_blk10;
  const size = LLVMSizeOf(struct_info.llvm_type);
  const alloc_fn = codegen_llvm_ctx$get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type);
  const alloc_ty = codegen_llvm_ctx$get_rt_fn_type(ctx, "ring_alloc");
  const typeid_val = LLVMConstInt(ctx.i64_type, codegen_llvm_ctx$get_or_assign_typeid(ctx, name), 0);
  const struct_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, typeid_val], "s");
  const __ring_end11 = List_len(fields);
  for (let i = 0; i < __ring_end11; i++) {
    const param_val = LLVMGetParam(fn_val, i);
    const field_ptr = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, struct_ptr, i, "fp");
    LLVMBuildStore(ctx.builder, param_val, field_ptr);
  }
  LLVMBuildRet(ctx.builder, struct_ptr);
  ctx.current_fn = saved_fn;
}

function emit_trait_dict(ctx, target_type, trait_name, methods) {
  const dict_name = hir$trait_dict_name(target_type, trait_name);
  let impl_methods = [];
  const __ring_iter_12 = __List_Iterable.iter(methods);
  while (true) {
    const __ring_next_12 = __ListIterator_Iterator.next(__ring_iter_12);
    if (__ring_next_12._tag === "none") break;
    const m = __ring_next_12._0;
    __ring_match22: {
      const __ring_m22 = m;
      if (__ring_m22._tag === "Fn") {
        const name = __ring_m22.name;
        List_push(impl_methods, name);
        break __ring_match22;
      }
      break __ring_match22;
    }
  }
  let __ring_blk11;
  __ring_match23: {
    const __ring_m23 = _Map_get(ctx.trait_method_order, trait_name);
    if (__ring_m23._tag === "some") {
      const order = __ring_m23._0;
      __ring_blk11 = order;
      break __ring_match23;
    }
    if (__ring_m23._tag === "none") {
      __ring_blk11 = impl_methods;
      break __ring_match23;
    }
    __match_fail(__ring_m23);
  }
  const method_order = __ring_blk11;
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
  const __ring_end13 = method_count;
  for (let i = 0; i < __ring_end13; i++) {
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
  const __ring_end14 = method_count;
  for (let i = 0; i < __ring_end14; i++) {
    __ring_match24: {
      const __ring_m24 = List_get(method_order, i);
      if (__ring_m24._tag === "some") {
        const method_name = __ring_m24._0;
        const _ = emit_dict_method_slot(ctx, target_type, method_name, dict_struct_ty, dict_ptr, closure_ty, closure_size, alloc_fn, alloc_ty, i);
        break __ring_match24;
      }
      if (__ring_m24._tag === "none") {
        break __ring_match24;
      }
      __match_fail(__ring_m24);
    }
  }
  LLVMBuildRet(ctx.builder, dict_ptr);
  ctx.current_fn = saved_fn;
  const getter = codegen_llvm_expr$emit_memoised_dict_getter(ctx, dict_name, build_fn, build_fn_ty);
  return _Map_insert(ctx.dict_globals, dict_name, getter);
}

function emit_llvm_decl(ctx, decl) {
  __ring_match25: {
    const __ring_m25 = decl;
    if (__ring_m25._tag === "Fn") {
      const name = __ring_m25.name; const params = __ring_m25.params; const effects = __ring_m25.effects; const body = __ring_m25.body; const trait_bounds = __ring_m25.trait_bounds;
      return emit_fn_body(ctx, name, params, effects, body, trait_bounds, Option_none);
      break __ring_match25;
    }
    if (__ring_m25._tag === "Struct") {
      const name = __ring_m25.name; const fields = __ring_m25.fields;
      return emit_struct_constructor(ctx, name, fields);
      break __ring_match25;
    }
    if (__ring_m25._tag === "Enum") {
      const name = __ring_m25.name; const variants = __ring_m25.variants;
      return emit_enum_constructors(ctx, name, variants);
      break __ring_match25;
    }
    if (__ring_m25._tag === "Impl") {
      const target_type = __ring_m25.target_type; const trait_name = __ring_m25.trait_name; const methods = __ring_m25.methods;
      const __ring_iter_15 = __List_Iterable.iter(methods);
      while (true) {
        const __ring_next_15 = __ListIterator_Iterator.next(__ring_iter_15);
        if (__ring_next_15._tag === "none") break;
        const method = __ring_next_15._0;
        __ring_match26: {
          const __ring_m26 = method;
          if (__ring_m26._tag === "Fn") {
            const mn = __ring_m26.name; const mp = __ring_m26.params; const me = __ring_m26.effects; const mb = __ring_m26.body; const mtb = __ring_m26.trait_bounds;
            emit_fn_body(ctx, mn, mp, me, mb, mtb, Option_some(target_type));
            break __ring_match26;
          }
          break __ring_match26;
        }
      }
      __ring_match27: {
        const __ring_m27 = trait_name;
        if (__ring_m27._tag === "some") {
          const tn = __ring_m27._0;
          return emit_trait_dict(ctx, target_type, tn, methods);
          break __ring_match27;
        }
        if (__ring_m27._tag === "none") {
          break __ring_match27;
        }
        __match_fail(__ring_m27);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "Effect") {
      break __ring_match25;
    }
    if (__ring_m25._tag === "Test") {
      break __ring_match25;
    }
    if (__ring_m25._tag === "Trait") {
      break __ring_match25;
    }
    if (__ring_m25._tag === "ExternFn") {
      break __ring_match25;
    }
    if (__ring_m25._tag === "ExternType") {
      break __ring_match25;
    }
    if (__ring_m25._tag === "TypeAlias") {
      break __ring_match25;
    }
    if (__ring_m25._tag === "Const") {
      const name = __ring_m25.name; const init = __ring_m25.init;
      return emit_const_body(ctx, name, init);
      break __ring_match25;
    }
    if (__ring_m25._tag === "ModBlock") {
      const mod_decls = __ring_m25.decls;
      const __ring_iter_16 = __List_Iterable.iter(mod_decls);
      while (true) {
        const __ring_next_16 = __ListIterator_Iterator.next(__ring_iter_16);
        if (__ring_next_16._tag === "none") break;
        const subdecl = __ring_next_16._0;
        emit_llvm_decl(ctx, subdecl);
      }
      break __ring_match25;
    }
    if (__ring_m25._tag === "Sig") {
      break __ring_match25;
    }
    __match_fail(__ring_m25);
  }
}

function register_enum_info(ctx, name, variants) {
  let max_fields = 0;
  let variant_map = map_new();
  let tag = 0;
  const __ring_iter_17 = __List_Iterable.iter(variants);
  while (true) {
    const __ring_next_17 = __ListIterator_Iterator.next(__ring_iter_17);
    if (__ring_next_17._tag === "none") break;
    const v = __ring_next_17._0;
    const fc = List_len(v.fields);
    if ((fc > max_fields)) {
      max_fields = fc;
    }
    let __ring_blk12;
    __ring_match28: {
      const __ring_m28 = v.field_names;
      if (__ring_m28._tag === "some") {
        const names = __ring_m28._0;
        __ring_blk12 = names;
        break __ring_match28;
      }
      if (__ring_m28._tag === "none") {
        let ns = [];
        const __ring_end18 = fc;
        for (let j = 0; j < __ring_end18; j++) {
          List_push(ns, "");
        }
        __ring_blk12 = ns;
        break __ring_match28;
      }
      __match_fail(__ring_m28);
    }
    const fnames = __ring_blk12;
    let frs = [];
    const __ring_iter_19 = __List_Iterable.iter(v.fields);
    while (true) {
      const __ring_next_19 = __ListIterator_Iterator.next(__ring_iter_19);
      if (__ring_next_19._tag === "none") break;
      const ft = __ring_next_19._0;
      List_push(frs, hir$type_contains_extern_handle(ft, ctx.extern_types));
    }
    _Map_insert(variant_map, v.name, new codegen_llvm_ctx$EnumVariantInfo(tag, fc, fnames, frs));
    tag = (tag + 1);
  }
  let elem_types = [ctx.i64_type];
  const __ring_end20 = max_fields;
  for (let i = 0; i < __ring_end20; i++) {
    List_push(elem_types, ctx.ptr_type);
  }
  const enum_ty = LLVMStructTypeInContext(ctx.context, elem_types, 0);
  return _Map_insert(ctx.enum_types, name, new codegen_llvm_ctx$EnumTypeInfo(variant_map, max_fields, enum_ty));
}

function register_struct_info(ctx, name, fields) {
  let field_names = [];
  let field_types = [];
  let field_rc_skip = [];
  const __ring_iter_21 = __List_Iterable.iter(fields);
  while (true) {
    const __ring_next_21 = __ListIterator_Iterator.next(__ring_iter_21);
    if (__ring_next_21._tag === "none") break;
    const f = __ring_next_21._0;
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


export { emit_llvm_decl, register_struct_info, register_enum_info };