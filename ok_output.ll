; ModuleID = 'ring_module'
source_filename = "ring_module"
target datalayout = "e-m:w-p270:32:32-p271:32:32-p272:64:64-i64:64-i128:128-f80:128-n8:16:32:64-S128"
target triple = "x86_64-pc-windows-msvc"

@__ring_dictg___Option_Eq = global ptr null
@str53 = private unnamed_addr constant [6 x i8] c"some(\00", align 1
@str67 = private unnamed_addr constant [2 x i8] c")\00", align 1
@str71 = private unnamed_addr constant [5 x i8] c"none\00", align 1
@str73 = private unnamed_addr constant [7 x i8] c"Option\00", align 1
@__ring_dictg___Option_Debug = global ptr null
@__ring_dictg___Option_Ord = global ptr null
@__ring_dictg___Option_Clone = global ptr null
@__ring_dictg___Result_Eq = global ptr null
@__ring_dictg___ListIterator_Clone = global ptr null
@__ring_dictg___SetIterator_Clone = global ptr null
@__ring_dictg___Result_Clone = global ptr null
@__ring_dictg___Result_Ord = global ptr null
@str276 = private unnamed_addr constant [16 x i8] c"ListIterator { \00", align 1
@str279 = private unnamed_addr constant [7 x i8] c"list: \00", align 1
@str284 = private unnamed_addr constant [13 x i8] c"__List_Debug\00", align 1
@str296 = private unnamed_addr constant [3 x i8] c", \00", align 1
@str299 = private unnamed_addr constant [8 x i8] c"index: \00", align 1
@str312 = private unnamed_addr constant [3 x i8] c" }\00", align 1
@__ring_dictg___ListIterator_Debug = global ptr null
@str326 = private unnamed_addr constant [15 x i8] c"SetIterator { \00", align 1
@str329 = private unnamed_addr constant [8 x i8] c"items: \00", align 1
@str334 = private unnamed_addr constant [13 x i8] c"__List_Debug\00", align 1
@str346 = private unnamed_addr constant [3 x i8] c", \00", align 1
@str349 = private unnamed_addr constant [8 x i8] c"index: \00", align 1
@str362 = private unnamed_addr constant [3 x i8] c" }\00", align 1
@__ring_dictg___SetIterator_Debug = global ptr null
@str378 = private unnamed_addr constant [4 x i8] c"Ok(\00", align 1
@str392 = private unnamed_addr constant [2 x i8] c")\00", align 1
@str397 = private unnamed_addr constant [5 x i8] c"Err(\00", align 1
@str411 = private unnamed_addr constant [2 x i8] c")\00", align 1
@str415 = private unnamed_addr constant [7 x i8] c"Result\00", align 1
@__ring_dictg___Result_Debug = global ptr null
@__ring_dictg___ListIterator_Iterator = global ptr null
@__ring_dictg___List_Iterable = global ptr null
@str684 = private unnamed_addr constant [29 x i8] c"Option in ring_List_index_of\00", align 1
@__ring_dictg___MapIterator_Iterator = global ptr null
@__ring_dictg___Map_Iterable = global ptr null
@__ring_dictg___SetIterator_Iterator = global ptr null
@__ring_dictg___Set_Iterable = global ptr null
@str1060 = private unnamed_addr constant [31 x i8] c"Result in ring_Result_and_then\00", align 1
@str1069 = private unnamed_addr constant [29 x i8] c"Result in ring_Result_is_err\00", align 1
@str1078 = private unnamed_addr constant [28 x i8] c"Result in ring_Result_is_ok\00", align 1
@str1099 = private unnamed_addr constant [26 x i8] c"Result in ring_Result_map\00", align 1
@str1110 = private unnamed_addr constant [32 x i8] c"Result in ring_Result_unwrap_or\00", align 1

define ptr @ring_Option_some(ptr %0) {
entry:
  %opt = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 8)
  %tag = getelementptr inbounds nuw { i64, ptr }, ptr %opt, i32 0, i32 0
  store i64 0, ptr %tag, align 8
  %val = getelementptr inbounds nuw { i64, ptr }, ptr %opt, i32 0, i32 1
  store ptr %0, ptr %val, align 8
  ret ptr %opt
}

declare ptr @ring_Option_none()

declare ptr @ring_alloc(i64, i64)

define ptr @ring_Result_Ok(ptr %0) {
entry:
  %res = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 64)
  %tag = getelementptr inbounds nuw { i64, ptr }, ptr %res, i32 0, i32 0
  store i64 0, ptr %tag, align 8
  %val = getelementptr inbounds nuw { i64, ptr }, ptr %res, i32 0, i32 1
  store ptr %0, ptr %val, align 8
  ret ptr %res

entry1:                                           ; No predecessors!
  %e = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 64)
  %tag2 = getelementptr inbounds nuw { i64, ptr }, ptr %e, i32 0, i32 0
  store i64 0, ptr %tag2, align 8
  %ef = getelementptr inbounds nuw { i64, ptr }, ptr %e, i32 0, i32 1
  store ptr %0, ptr %ef, align 8
  ret ptr %e
}

define ptr @ring_Result_Err(ptr %0) {
entry:
  %res = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 64)
  %tag = getelementptr inbounds nuw { i64, ptr }, ptr %res, i32 0, i32 0
  store i64 1, ptr %tag, align 8
  %val = getelementptr inbounds nuw { i64, ptr }, ptr %res, i32 0, i32 1
  store ptr %0, ptr %val, align 8
  ret ptr %res

entry1:                                           ; No predecessors!
  %e = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 64)
  %tag2 = getelementptr inbounds nuw { i64, ptr }, ptr %e, i32 0, i32 0
  store i64 1, ptr %tag2, align 8
  %ef = getelementptr inbounds nuw { i64, ptr }, ptr %e, i32 0, i32 1
  store ptr %0, ptr %ef, align 8
  ret ptr %e
}

declare ptr @ring_box_int(i64)

declare i64 @ring_unbox_int(ptr)

declare ptr @ring_box_float(double)

declare double @ring_unbox_float(ptr)

declare ptr @ring_box_bool(i64)

declare i64 @ring_unbox_bool(ptr)

declare ptr @ring_str_from_cstr(ptr)

declare i64 @ring_str_len(ptr)

declare ptr @ring_str_concat(ptr, ptr)

declare i64 @ring_str_eq(ptr, ptr)

declare i64 @ring_str_lt(ptr, ptr)

declare ptr @ring_str_get(ptr, i64)

declare i64 @ring_str_contains(ptr, ptr)

declare i64 @ring_str_starts_with(ptr, ptr)

declare i64 @ring_str_ends_with(ptr, ptr)

declare ptr @ring_str_slice(ptr, i64, i64)

declare ptr @ring_str_split(ptr, ptr)

declare ptr @ring_str_replace(ptr, ptr, ptr)

declare ptr @ring_sb_new()

declare ptr @ring_sb_add(ptr, ptr)

declare ptr @ring_sb_to_str(ptr)

declare i64 @ring_sb_len(ptr)

declare ptr @ring_int_to_str(i64)

declare ptr @ring_float_to_str(double)

declare ptr @ring_bool_to_str(i64)

declare ptr @ring_print(ptr)

declare ptr @ring_eprintln(ptr)

declare ptr @ring_panic(ptr)

declare ptr @ring_exit(ptr)

declare void @ring_dup(ptr)

declare void @ring_drop(ptr)

declare void @ring_register_drop(i64, ptr)

declare void @ring_register_never_drop(i64)

declare ptr @ring_list_new()

declare ptr @ring_list_push(ptr, ptr)

declare ptr @ring_list_get(ptr, i64)

declare i64 @ring_list_len(ptr)

declare ptr @ring_list_join(ptr, ptr)

declare ptr @ring_list_concat(ptr, ptr)

declare ptr @ring_list_slice(ptr, i64, i64)

declare ptr @ring_list_reverse(ptr)

declare ptr @ring_list_sort(ptr, ptr)

declare ptr @ring_list_pop(ptr)

declare i64 @ring_list_is_empty(ptr)

declare ptr @ring_list_first(ptr)

declare ptr @ring_list_last(ptr)

declare ptr @ring_list_map(ptr, ptr)

declare ptr @ring_list_filter(ptr, ptr)

declare ptr @ring_list_for_each(ptr, ptr)

declare ptr @ring_list_set(ptr, i64, ptr)

declare i64 @ring_list_any(ptr, ptr)

declare i64 @ring_list_all(ptr, ptr)

declare ptr @ring_list_find(ptr, ptr)

declare ptr @ring_list_flat_map(ptr, ptr)

declare ptr @ring_map_new()

declare ptr @ring_map_get(ptr, ptr)

declare ptr @ring_map_set(ptr, ptr, ptr)

declare i64 @ring_map_has(ptr, ptr)

declare ptr @ring_map_delete(ptr, ptr)

declare ptr @ring_map_keys(ptr)

declare ptr @ring_map_values(ptr)

declare ptr @ring_map_entries(ptr)

declare i64 @ring_map_len(ptr)

declare i64 @ring_map_is_empty(ptr)

declare ptr @ring_map_for_each(ptr, ptr)

declare ptr @ring_map_fold(ptr, ptr, ptr)

declare ptr @ring_map_filter(ptr, ptr)

declare i64 @ring_map_any(ptr, ptr)

declare ptr @ring_map_map_values(ptr, ptr)

declare ptr @ring_map_int_new()

declare ptr @ring_map_int_get(ptr, ptr)

declare ptr @ring_map_int_get_opt(ptr, ptr)

declare ptr @ring_map_int_set(ptr, ptr, ptr)

declare i64 @ring_map_int_has(ptr, ptr)

declare ptr @ring_map_int_delete(ptr, ptr)

declare ptr @ring_map_int_keys(ptr)

declare ptr @ring_map_int_values(ptr)

declare ptr @ring_map_int_entries(ptr)

declare i64 @ring_map_int_len(ptr)

declare i64 @ring_map_int_is_empty(ptr)

declare ptr @ring_map_int_for_each(ptr, ptr)

declare ptr @ring_map_int_clone(ptr)

declare ptr @ring_map_int_from(ptr)

declare ptr @ring_map_int_clear(ptr)

declare ptr @ring_map_int_fold(ptr, ptr, ptr)

declare ptr @ring_set_new()

declare ptr @ring_set_add(ptr, ptr)

declare i64 @ring_set_has(ptr, ptr)

declare ptr @ring_set_delete(ptr, ptr)

declare ptr @ring_set_to_list(ptr)

declare i64 @ring_set_len(ptr)

declare i64 @ring_set_is_empty(ptr)

declare ptr @ring_set_from_list(ptr)

declare ptr @ring_set_for_each(ptr, ptr)

declare ptr @ring_set_fold(ptr, ptr, ptr)

declare ptr @ring_set_filter(ptr, ptr)

declare i64 @ring_set_any(ptr, ptr)

declare i64 @ring_set_all(ptr, ptr)

declare ptr @ring_set_int_new()

declare ptr @ring_set_int_add(ptr, ptr)

declare i64 @ring_set_int_has(ptr, ptr)

declare ptr @ring_set_int_delete(ptr, ptr)

declare ptr @ring_set_int_to_list(ptr)

declare i64 @ring_set_int_len(ptr)

declare i64 @ring_set_int_is_empty(ptr)

declare ptr @ring_set_int_from_list(ptr)

declare ptr @ring_set_int_for_each(ptr, ptr)

declare ptr @ring_set_int_clone(ptr)

declare ptr @ring_set_int_union(ptr, ptr)

declare ptr @ring_set_int_intersect(ptr, ptr)

declare ptr @ring_set_int_difference(ptr, ptr)

declare ptr @ring_set_int_clear(ptr)

declare ptr @ring_set_int_fold(ptr, ptr, ptr)

declare ptr @ring_set_int_filter(ptr, ptr)

declare i64 @ring_set_int_any(ptr, ptr)

declare i64 @ring_set_int_all(ptr, ptr)

declare ptr @ring_catch_push()

declare ptr @ring_catch_get_buf(ptr)

declare void @ring_catch_pop()

declare ptr @ring_catch_get_error(ptr)

declare void @ring_raise(ptr)

declare ptr @ring_args()

declare ptr @ring_read_file(ptr)

declare ptr @ring_write_file(ptr, ptr)

declare ptr @ring_file_exists(ptr)

declare ptr @ring_delete_file(ptr)

declare ptr @ring_path_join(ptr, ptr)

declare ptr @ring_path_resolve(ptr)

declare ptr @ring_path_dirname(ptr)

declare ptr @ring_path_basename(ptr)

declare ptr @ring_path_extname(ptr)

declare ptr @ring_list_clone(ptr)

declare ptr @ring_map_clone(ptr)

declare ptr @ring_set_clone(ptr)

declare ptr @ring_map_from(ptr)

declare ptr @ring_parse_int(ptr)

declare ptr @ring_parse_float(ptr)

declare ptr @ring_str_trim(ptr)

declare ptr @ring_str_trim_start(ptr)

declare ptr @ring_str_trim_end(ptr)

declare ptr @ring_str_to_upper(ptr)

declare ptr @ring_str_to_lower(ptr)

declare ptr @ring_str_char_at(ptr, i64)

declare ptr @ring_str_index_of(ptr, ptr)

declare ptr @ring_str_last_index_of(ptr, ptr)

declare i64 @ring_str_is_empty(ptr)

declare ptr @ring_str_pad_start(ptr, i64, ptr)

declare ptr @ring_str_pad_end(ptr, i64, ptr)

declare ptr @ring_str_repeat(ptr, i64)

declare ptr @ring_str_char_code_at(ptr, i64)

declare ptr @ring_str_join(ptr, ptr)

declare ptr @ring_sb_line(ptr, ptr)

declare ptr @ring_sb_add_int(ptr, i64)

declare ptr @ring_set_union(ptr, ptr)

declare ptr @ring_set_intersect(ptr, ptr)

declare ptr @ring_set_difference(ptr, ptr)

declare ptr @ring_set_clear(ptr)

declare ptr @ring_list_shift(ptr)

declare ptr @ring_list_clear(ptr)

declare ptr @ring_list_extend(ptr, ptr)

declare ptr @ring_map_clear(ptr)

declare ptr @ring_assert(i64, ptr)

declare ptr @ring_json_stringify(ptr)

declare ptr @ring_cwd()

declare ptr @__ring_raise_fail(ptr)

declare ptr @ring_str_to_cstr(ptr)

declare i32 @ring_str_len_u32(ptr)

declare ptr @ring_list_data(ptr)

declare i32 @ring_list_size_u32(ptr)

declare ptr @ring_Option_unwrap_or(ptr, ptr)

declare ptr @ring_Option_unwrap(ptr)

declare i64 @ring_Option_is_some(ptr)

declare i64 @ring_Option_is_none(ptr)

declare ptr @ring_Option_map(ptr, ptr)

declare ptr @ring_Option_unwrap_or_else(ptr, ptr)

; Function Attrs: nounwind
define ptr @ring_List_is_empty(ptr nonnull %0) #0 {
entry:
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_2 = alloca ptr, align 8
  %__anf_1 = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %self427 = load ptr, ptr %self, align 8
  %ri428 = call i64 @ring_list_len(ptr %self427)
  %sh429 = shl i64 %ri428, 1
  %tg430 = or i64 %sh429, 1
  %bi431 = inttoptr i64 %tg430 to ptr
  store ptr %bi431, ptr %__anf_1, align 8
  store ptr inttoptr (i64 1 to ptr), ptr %__anf_2, align 8
  %__anf_1435 = load ptr, ptr %__anf_1, align 8
  %__anf_2436 = load ptr, ptr %__anf_2, align 8
  %ui437 = ptrtoint ptr %__anf_1435 to i64
  %uv438 = ashr i64 %ui437, 1
  %ui439 = ptrtoint ptr %__anf_2436 to i64
  %uv440 = ashr i64 %ui439, 1
  %eq441 = icmp eq i64 %uv438, %uv440
  %ext442 = zext i1 %eq441 to i64
  %sh443 = shl i64 %ext442, 1
  %tg444 = or i64 %sh443, 1
  %bb445 = inttoptr i64 %tg444 to ptr
  store ptr %bb445, ptr %__rc_scope_1, align 8
  %drop_val446 = load ptr, ptr %__anf_1, align 8
  call void @ring_drop(ptr %drop_val446)
  %drop_val447 = load ptr, ptr %__anf_2, align 8
  call void @ring_drop(ptr %drop_val447)
  %__rc_scope_1448 = load ptr, ptr %__rc_scope_1, align 8
  ret ptr %__rc_scope_1448
}

; Function Attrs: nounwind
define ptr @ring_List_first(ptr nonnull %0) #0 {
entry:
  %__rc_scope_2 = alloca ptr, align 8
  %__anf_4 = alloca ptr, align 8
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_3 = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %self449 = load ptr, ptr %self, align 8
  %rb450 = call i64 @ring_list_is_empty(ptr %self449)
  %sh451 = shl i64 %rb450, 1
  %tg452 = or i64 %sh451, 1
  %bb453 = inttoptr i64 %tg452 to ptr
  store ptr %bb453, ptr %__anf_3, align 8
  %__anf_3454 = load ptr, ptr %__anf_3, align 8
  %ub455 = ptrtoint ptr %__anf_3454 to i64
  %sh456 = ashr i64 %ub455, 1
  %i1457 = trunc i64 %sh456 to i1
  br i1 %i1457, label %if.then, label %if.else

if.then:                                          ; preds = %entry
  %ctor458 = call ptr @ring_Option_none()
  call void @ring_dup(ptr %ctor458)
  store ptr %ctor458, ptr %__rc_scope_1, align 8
  %drop_val459 = load ptr, ptr %__anf_3, align 8
  call void @ring_drop(ptr %drop_val459)
  %__rc_scope_1460 = load ptr, ptr %__rc_scope_1, align 8
  ret ptr %__rc_scope_1460

if.else:                                          ; preds = %entry
  br label %if.merge

if.merge:                                         ; preds = %if.else, %after.ret
  %if461 = phi ptr [ null, %after.ret ], [ null, %if.else ]
  store ptr inttoptr (i64 1 to ptr), ptr %__anf_4, align 8
  %__anf_4465 = load ptr, ptr %__anf_4, align 8
  %self466 = load ptr, ptr %self, align 8
  %ui467 = ptrtoint ptr %__anf_4465 to i64
  %uv468 = ashr i64 %ui467, 1
  %mc469 = call ptr @ring_list_get_opt(ptr %self466, i64 %uv468)
  store ptr %mc469, ptr %__rc_scope_2, align 8
  %drop_val470 = load ptr, ptr %__anf_3, align 8
  call void @ring_drop(ptr %drop_val470)
  %drop_val471 = load ptr, ptr %__anf_4, align 8
  call void @ring_drop(ptr %drop_val471)
  %__rc_scope_2472 = load ptr, ptr %__rc_scope_2, align 8
  ret ptr %__rc_scope_2472

after.ret:                                        ; No predecessors!
  br label %if.merge
}

; Function Attrs: nounwind
define ptr @ring_List_last(ptr nonnull %0) #0 {
entry:
  %__rc_scope_2 = alloca ptr, align 8
  %__anf_8 = alloca ptr, align 8
  %__anf_7 = alloca ptr, align 8
  %__anf_6 = alloca ptr, align 8
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_5 = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %self473 = load ptr, ptr %self, align 8
  %rb474 = call i64 @ring_list_is_empty(ptr %self473)
  %sh475 = shl i64 %rb474, 1
  %tg476 = or i64 %sh475, 1
  %bb477 = inttoptr i64 %tg476 to ptr
  store ptr %bb477, ptr %__anf_5, align 8
  %__anf_5478 = load ptr, ptr %__anf_5, align 8
  %ub479 = ptrtoint ptr %__anf_5478 to i64
  %sh480 = ashr i64 %ub479, 1
  %i1481 = trunc i64 %sh480 to i1
  br i1 %i1481, label %if.then, label %if.else

if.then:                                          ; preds = %entry
  %ctor482 = call ptr @ring_Option_none()
  call void @ring_dup(ptr %ctor482)
  store ptr %ctor482, ptr %__rc_scope_1, align 8
  %drop_val483 = load ptr, ptr %__anf_5, align 8
  call void @ring_drop(ptr %drop_val483)
  %__rc_scope_1484 = load ptr, ptr %__rc_scope_1, align 8
  ret ptr %__rc_scope_1484

if.else:                                          ; preds = %entry
  br label %if.merge

if.merge:                                         ; preds = %if.else, %after.ret
  %if485 = phi ptr [ null, %after.ret ], [ null, %if.else ]
  %self486 = load ptr, ptr %self, align 8
  %ri487 = call i64 @ring_list_len(ptr %self486)
  %sh488 = shl i64 %ri487, 1
  %tg489 = or i64 %sh488, 1
  %bi490 = inttoptr i64 %tg489 to ptr
  store ptr %bi490, ptr %__anf_6, align 8
  store ptr inttoptr (i64 3 to ptr), ptr %__anf_7, align 8
  %__anf_6494 = load ptr, ptr %__anf_6, align 8
  %__anf_7495 = load ptr, ptr %__anf_7, align 8
  %ui496 = ptrtoint ptr %__anf_6494 to i64
  %uv497 = ashr i64 %ui496, 1
  %ui498 = ptrtoint ptr %__anf_7495 to i64
  %uv499 = ashr i64 %ui498, 1
  %sub500 = sub i64 %uv497, %uv499
  %sh501 = shl i64 %sub500, 1
  %tg502 = or i64 %sh501, 1
  %bi503 = inttoptr i64 %tg502 to ptr
  store ptr %bi503, ptr %__anf_8, align 8
  %__anf_8504 = load ptr, ptr %__anf_8, align 8
  %self505 = load ptr, ptr %self, align 8
  %ui506 = ptrtoint ptr %__anf_8504 to i64
  %uv507 = ashr i64 %ui506, 1
  %mc508 = call ptr @ring_list_get_opt(ptr %self505, i64 %uv507)
  store ptr %mc508, ptr %__rc_scope_2, align 8
  %drop_val509 = load ptr, ptr %__anf_5, align 8
  call void @ring_drop(ptr %drop_val509)
  %drop_val510 = load ptr, ptr %__anf_6, align 8
  call void @ring_drop(ptr %drop_val510)
  %drop_val511 = load ptr, ptr %__anf_7, align 8
  call void @ring_drop(ptr %drop_val511)
  %drop_val512 = load ptr, ptr %__anf_8, align 8
  call void @ring_drop(ptr %drop_val512)
  %__rc_scope_2513 = load ptr, ptr %__rc_scope_2, align 8
  ret ptr %__rc_scope_2513

after.ret:                                        ; No predecessors!
  br label %if.merge
}

; Function Attrs: nounwind
define ptr @ring_ListIterator_next(ptr nonnull %0) #0 {
entry:
  %__rc_scope_2 = alloca ptr, align 8
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_11 = alloca ptr, align 8
  %v = alloca ptr, align 8
  %__anf_10 = alloca ptr, align 8
  %__anf_9 = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %self514 = load ptr, ptr %self, align 8
  %fp515 = getelementptr inbounds nuw { ptr, ptr }, ptr %self514, i32 0, i32 0
  %list516 = load ptr, ptr %fp515, align 8
  %ri517 = call i64 @ring_list_len(ptr %list516)
  %sh518 = shl i64 %ri517, 1
  %tg519 = or i64 %sh518, 1
  %bi520 = inttoptr i64 %tg519 to ptr
  store ptr %bi520, ptr %__anf_9, align 8
  %self521 = load ptr, ptr %self, align 8
  %fp522 = getelementptr inbounds nuw { ptr, ptr }, ptr %self521, i32 0, i32 1
  %index523 = load ptr, ptr %fp522, align 8
  %__anf_9524 = load ptr, ptr %__anf_9, align 8
  %ui525 = ptrtoint ptr %index523 to i64
  %uv526 = ashr i64 %ui525, 1
  %ui527 = ptrtoint ptr %__anf_9524 to i64
  %uv528 = ashr i64 %ui527, 1
  %lt529 = icmp slt i64 %uv526, %uv528
  %ext530 = zext i1 %lt529 to i64
  %sh531 = shl i64 %ext530, 1
  %tg532 = or i64 %sh531, 1
  %bb533 = inttoptr i64 %tg532 to ptr
  store ptr %bb533, ptr %__anf_10, align 8
  %__anf_10534 = load ptr, ptr %__anf_10, align 8
  %ub535 = ptrtoint ptr %__anf_10534 to i64
  %sh536 = ashr i64 %ub535, 1
  %i1537 = trunc i64 %sh536 to i1
  br i1 %i1537, label %if.then, label %if.else

if.then:                                          ; preds = %entry
  %self538 = load ptr, ptr %self, align 8
  %fp539 = getelementptr inbounds nuw { ptr, ptr }, ptr %self538, i32 0, i32 1
  %index540 = load ptr, ptr %fp539, align 8
  %self541 = load ptr, ptr %self, align 8
  %fp542 = getelementptr inbounds nuw { ptr, ptr }, ptr %self541, i32 0, i32 0
  %list543 = load ptr, ptr %fp542, align 8
  %ui544 = ptrtoint ptr %index540 to i64
  %uv545 = ashr i64 %ui544, 1
  %mc546 = call ptr @ring_list_get_opt(ptr %list543, i64 %uv545)
  store ptr %mc546, ptr %v, align 8
  store ptr inttoptr (i64 3 to ptr), ptr %__anf_11, align 8
  %self550 = load ptr, ptr %self, align 8
  %fp551 = getelementptr inbounds nuw { ptr, ptr }, ptr %self550, i32 0, i32 1
  %index552 = load ptr, ptr %fp551, align 8
  %__anf_11553 = load ptr, ptr %__anf_11, align 8
  %ui554 = ptrtoint ptr %index552 to i64
  %uv555 = ashr i64 %ui554, 1
  %ui556 = ptrtoint ptr %__anf_11553 to i64
  %uv557 = ashr i64 %ui556, 1
  %add558 = add i64 %uv555, %uv557
  %sh559 = shl i64 %add558, 1
  %tg560 = or i64 %sh559, 1
  %bi561 = inttoptr i64 %tg560 to ptr
  %self562 = load ptr, ptr %self, align 8
  %fp563 = getelementptr inbounds nuw { ptr, ptr }, ptr %self562, i32 0, i32 1
  store ptr %bi561, ptr %fp563, align 8
  %v564 = load ptr, ptr %v, align 8
  call void @ring_dup(ptr %v564)
  store ptr %v564, ptr %__rc_scope_1, align 8
  %drop_val565 = load ptr, ptr %v, align 8
  call void @ring_drop(ptr %drop_val565)
  %drop_val566 = load ptr, ptr %__anf_11, align 8
  call void @ring_drop(ptr %drop_val566)
  %__rc_scope_1567 = load ptr, ptr %__rc_scope_1, align 8
  br label %if.merge

if.else:                                          ; preds = %entry
  %ctor568 = call ptr @ring_Option_none()
  call void @ring_dup(ptr %ctor568)
  br label %if.merge

if.merge:                                         ; preds = %if.else, %if.then
  %if569 = phi ptr [ %__rc_scope_1567, %if.then ], [ %ctor568, %if.else ]
  store ptr %if569, ptr %__rc_scope_2, align 8
  %drop_val570 = load ptr, ptr %__anf_9, align 8
  call void @ring_drop(ptr %drop_val570)
  %drop_val571 = load ptr, ptr %__anf_10, align 8
  call void @ring_drop(ptr %drop_val571)
  %__rc_scope_2572 = load ptr, ptr %__rc_scope_2, align 8
  ret ptr %__rc_scope_2572
}

; Function Attrs: nounwind
define ptr @ring_List_iter(ptr nonnull %0) #0 {
entry:
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %s582 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 65)
  %self583 = load ptr, ptr %self, align 8
  call void @ring_dup(ptr %self583)
  %fp584 = getelementptr inbounds nuw { ptr, ptr }, ptr %s582, i32 0, i32 0
  store ptr %self583, ptr %fp584, align 8
  %fp588 = getelementptr inbounds nuw { ptr, ptr }, ptr %s582, i32 0, i32 1
  store ptr inttoptr (i64 1 to ptr), ptr %fp588, align 8
  ret ptr %s582
}

; Function Attrs: nounwind
define ptr @ring_List_contains(ptr nonnull %0, ptr nonnull %1, ptr %2) #0 {
entry:
  %__rc_scope_2 = alloca ptr, align 8
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_12 = alloca ptr, align 8
  %x = alloca ptr, align 8
  %idx600 = alloca i64, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %item = alloca ptr, align 8
  store ptr %1, ptr %item, align 8
  %__ring_T_Eq = alloca ptr, align 8
  store ptr %2, ptr %__ring_T_Eq, align 8
  %self598 = load ptr, ptr %self, align 8
  %len599 = call i64 @ring_list_len(ptr %self598)
  store i64 0, ptr %idx600, align 8
  br label %forl.cond

forl.cond:                                        ; preds = %forl.incr, %entry
  %ci601 = load i64, ptr %idx600, align 8
  %cmp602 = icmp slt i64 %ci601, %len599
  br i1 %cmp602, label %forl.body, label %forl.merge

forl.body:                                        ; preds = %forl.cond
  %el603 = call ptr @ring_list_get(ptr %self598, i64 %ci601)
  store ptr %el603, ptr %x, align 8
  %x604 = load ptr, ptr %x, align 8
  %item605 = load ptr, ptr %item, align 8
  %dp606 = load ptr, ptr %__ring_T_Eq, align 8
  %ms607 = getelementptr inbounds nuw { i64, ptr }, ptr %dp606, i32 0, i32 1
  %mc608 = load ptr, ptr %ms607, align 8
  %fps609 = getelementptr inbounds nuw { ptr, ptr }, ptr %mc608, i32 0, i32 0
  %fp610 = load ptr, ptr %fps609, align 8
  %eps611 = getelementptr inbounds nuw { ptr, ptr }, ptr %mc608, i32 0, i32 1
  %ep612 = load ptr, ptr %eps611, align 8
  %cc613 = call ptr %fp610(ptr %ep612, ptr %x604, ptr %item605)
  store ptr %cc613, ptr %__anf_12, align 8
  %__anf_12614 = load ptr, ptr %__anf_12, align 8
  %ub615 = ptrtoint ptr %__anf_12614 to i64
  %sh616 = ashr i64 %ub615, 1
  %i1617 = trunc i64 %sh616 to i1
  br i1 %i1617, label %if.then, label %if.else

forl.incr:                                        ; preds = %if.merge
  %ci624 = load i64, ptr %idx600, align 8
  %ni625 = add i64 %ci624, 1
  store i64 %ni625, ptr %idx600, align 8
  br label %forl.cond

forl.merge:                                       ; preds = %forl.cond
  ret ptr inttoptr (i64 1 to ptr)

if.then:                                          ; preds = %forl.body
  store ptr inttoptr (i64 3 to ptr), ptr %__rc_scope_1, align 8
  %drop_val619 = load ptr, ptr %__anf_12, align 8
  call void @ring_drop(ptr %drop_val619)
  %__rc_scope_1620 = load ptr, ptr %__rc_scope_1, align 8
  ret ptr %__rc_scope_1620

if.else:                                          ; preds = %forl.body
  br label %if.merge

if.merge:                                         ; preds = %if.else, %after.ret
  %if621 = phi ptr [ null, %after.ret ], [ null, %if.else ]
  store ptr %if621, ptr %__rc_scope_2, align 8
  %drop_val622 = load ptr, ptr %__anf_12, align 8
  call void @ring_drop(ptr %drop_val622)
  %__rc_scope_2623 = load ptr, ptr %__rc_scope_2, align 8
  br label %forl.incr

after.ret:                                        ; No predecessors!
  br label %if.merge
}

; Function Attrs: nounwind
define ptr @ring_List_index_of(ptr nonnull %0, ptr nonnull %1, ptr %2) #0 {
entry:
  %__rc_scope_5 = alloca ptr, align 8
  %__rc_scope_4 = alloca ptr, align 8
  %__anf_16 = alloca ptr, align 8
  %__rc_scope_3 = alloca ptr, align 8
  %__rc_scope_2 = alloca ptr, align 8
  %__anf_15 = alloca ptr, align 8
  %v = alloca ptr, align 8
  %__anf_14 = alloca ptr, align 8
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_13 = alloca ptr, align 8
  %i = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %item = alloca ptr, align 8
  store ptr %1, ptr %item, align 8
  %__ring_T_Eq = alloca ptr, align 8
  store ptr %2, ptr %__ring_T_Eq, align 8
  store ptr inttoptr (i64 1 to ptr), ptr %i, align 8
  br label %while.cond

while.cond:                                       ; preds = %match.merge, %entry
  %self630 = load ptr, ptr %self, align 8
  %ri631 = call i64 @ring_list_len(ptr %self630)
  %sh632 = shl i64 %ri631, 1
  %tg633 = or i64 %sh632, 1
  %bi634 = inttoptr i64 %tg633 to ptr
  store ptr %bi634, ptr %__anf_13, align 8
  %i635 = load ptr, ptr %i, align 8
  %__anf_13636 = load ptr, ptr %__anf_13, align 8
  %ui637 = ptrtoint ptr %i635 to i64
  %uv638 = ashr i64 %ui637, 1
  %ui639 = ptrtoint ptr %__anf_13636 to i64
  %uv640 = ashr i64 %ui639, 1
  %lt641 = icmp slt i64 %uv638, %uv640
  %ext642 = zext i1 %lt641 to i64
  %sh643 = shl i64 %ext642, 1
  %tg644 = or i64 %sh643, 1
  %bb645 = inttoptr i64 %tg644 to ptr
  store ptr %bb645, ptr %__rc_scope_1, align 8
  %drop_val646 = load ptr, ptr %__anf_13, align 8
  call void @ring_drop(ptr %drop_val646)
  %__rc_scope_1647 = load ptr, ptr %__rc_scope_1, align 8
  %ub648 = ptrtoint ptr %__rc_scope_1647 to i64
  %sh649 = ashr i64 %ub648, 1
  %i1650 = trunc i64 %sh649 to i1
  call void @ring_drop(ptr %__rc_scope_1647)
  br i1 %i1650, label %while.body, label %while.merge

while.body:                                       ; preds = %while.cond
  %i651 = load ptr, ptr %i, align 8
  %self652 = load ptr, ptr %self, align 8
  %ui653 = ptrtoint ptr %i651 to i64
  %uv654 = ashr i64 %ui653, 1
  %mc655 = call ptr @ring_list_get_opt(ptr %self652, i64 %uv654)
  store ptr %mc655, ptr %__anf_14, align 8
  %__anf_14656 = load ptr, ptr %__anf_14, align 8
  %tp657 = getelementptr inbounds nuw { i64, ptr }, ptr %__anf_14656, i32 0, i32 0
  %tag658 = load i64, ptr %tp657, align 8
  switch i64 %tag658, label %match.default [
    i64 0, label %match.arm.some
    i64 1, label %match.arm.none
  ]

while.merge:                                      ; preds = %while.cond
  %ctor705 = call ptr @ring_Option_none()
  call void @ring_dup(ptr %ctor705)
  store ptr %ctor705, ptr %__rc_scope_5, align 8
  %drop_val706 = load ptr, ptr %i, align 8
  call void @ring_drop(ptr %drop_val706)
  %__rc_scope_5707 = load ptr, ptr %__rc_scope_5, align 8
  ret ptr %__rc_scope_5707

match.merge:                                      ; preds = %match.arm.none, %if.merge
  %mr687 = phi ptr [ %__rc_scope_3683, %if.merge ], [ null, %match.arm.none ]
  store ptr inttoptr (i64 3 to ptr), ptr %__anf_16, align 8
  %i691 = load ptr, ptr %i, align 8
  %__anf_16692 = load ptr, ptr %__anf_16, align 8
  %ui693 = ptrtoint ptr %i691 to i64
  %uv694 = ashr i64 %ui693, 1
  %ui695 = ptrtoint ptr %__anf_16692 to i64
  %uv696 = ashr i64 %ui695, 1
  %add697 = add i64 %uv694, %uv696
  %sh698 = shl i64 %add697, 1
  %tg699 = or i64 %sh698, 1
  %bi700 = inttoptr i64 %tg699 to ptr
  store ptr %bi700, ptr %__rc_scope_4, align 8
  %drop_val701 = load ptr, ptr %i, align 8
  call void @ring_drop(ptr %drop_val701)
  %__rc_scope_4702 = load ptr, ptr %__rc_scope_4, align 8
  store ptr %__rc_scope_4702, ptr %i, align 8
  %drop_val703 = load ptr, ptr %__anf_14, align 8
  call void @ring_drop(ptr %drop_val703)
  %drop_val704 = load ptr, ptr %__anf_16, align 8
  call void @ring_drop(ptr %drop_val704)
  br label %while.cond

match.default:                                    ; preds = %while.body
  %s685 = call ptr @ring_str_from_cstr(ptr @str684)
  %mf686 = call ptr @ring_match_fail(ptr %s685, i64 %tag658, i64 1, ptr %__anf_14656)
  unreachable

match.arm.some:                                   ; preds = %while.body
  %ef659 = getelementptr inbounds nuw { i64, ptr }, ptr %__anf_14656, i32 0, i32 1
  %v660 = load ptr, ptr %ef659, align 8
  store ptr %v660, ptr %v, align 8
  %v661 = load ptr, ptr %v, align 8
  %item662 = load ptr, ptr %item, align 8
  %dp663 = load ptr, ptr %__ring_T_Eq, align 8
  %ms664 = getelementptr inbounds nuw { i64, ptr }, ptr %dp663, i32 0, i32 1
  %mc665 = load ptr, ptr %ms664, align 8
  %fps666 = getelementptr inbounds nuw { ptr, ptr }, ptr %mc665, i32 0, i32 0
  %fp667 = load ptr, ptr %fps666, align 8
  %eps668 = getelementptr inbounds nuw { ptr, ptr }, ptr %mc665, i32 0, i32 1
  %ep669 = load ptr, ptr %eps668, align 8
  %cc670 = call ptr %fp667(ptr %ep669, ptr %v661, ptr %item662)
  store ptr %cc670, ptr %__anf_15, align 8
  %__anf_15671 = load ptr, ptr %__anf_15, align 8
  %ub672 = ptrtoint ptr %__anf_15671 to i64
  %sh673 = ashr i64 %ub672, 1
  %i1674 = trunc i64 %sh673 to i1
  br i1 %i1674, label %if.then, label %if.else

if.then:                                          ; preds = %match.arm.some
  %i675 = load ptr, ptr %i, align 8
  call void @ring_dup(ptr %i675)
  %call676 = call ptr @ring_Option_some(ptr %i675)
  store ptr %call676, ptr %__rc_scope_2, align 8
  %drop_val677 = load ptr, ptr %i, align 8
  call void @ring_drop(ptr %drop_val677)
  %drop_val678 = load ptr, ptr %__anf_14, align 8
  call void @ring_drop(ptr %drop_val678)
  %drop_val679 = load ptr, ptr %__anf_15, align 8
  call void @ring_drop(ptr %drop_val679)
  %__rc_scope_2680 = load ptr, ptr %__rc_scope_2, align 8
  ret ptr %__rc_scope_2680

if.else:                                          ; preds = %match.arm.some
  br label %if.merge

if.merge:                                         ; preds = %if.else, %after.ret
  %if681 = phi ptr [ null, %after.ret ], [ null, %if.else ]
  store ptr %if681, ptr %__rc_scope_3, align 8
  %drop_val682 = load ptr, ptr %__anf_15, align 8
  call void @ring_drop(ptr %drop_val682)
  %__rc_scope_3683 = load ptr, ptr %__rc_scope_3, align 8
  br label %match.merge

after.ret:                                        ; No predecessors!
  br label %if.merge

match.arm.none:                                   ; preds = %while.body
  br label %match.merge
}

; Function Attrs: nounwind
define ptr @ring_List_sort(ptr nonnull %0, ptr %1) #0 {
entry:
  %__rc_scope_4 = alloca ptr, align 8
  %__anf_20 = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %__ring_T_Ord = alloca ptr, align 8
  store ptr %1, ptr %__ring_T_Ord, align 8
  %env777 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 15)
  %cnt778 = getelementptr inbounds nuw { i64, ptr }, ptr %env777, i32 0, i32 0
  store i64 1, ptr %cnt778, align 8
  %cv779 = load ptr, ptr %__ring_T_Ord, align 8
  call void @ring_dup(ptr %cv779)
  %ep780 = getelementptr inbounds nuw { i64, ptr }, ptr %env777, i32 0, i32 1
  store ptr %cv779, ptr %ep780, align 8
  %cls781 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps782 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls781, i32 0, i32 0
  store ptr @ring_lambda_708, ptr %fps782, align 8
  %eps783 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls781, i32 0, i32 1
  store ptr %env777, ptr %eps783, align 8
  store ptr %cls781, ptr %__anf_20, align 8
  %__anf_20784 = load ptr, ptr %__anf_20, align 8
  %self785 = load ptr, ptr %self, align 8
  %mc786 = call ptr @ring_list_sort(ptr %self785, ptr %__anf_20784)
  store ptr null, ptr %__rc_scope_4, align 8
  %drop_val787 = load ptr, ptr %__anf_20, align 8
  call void @ring_drop(ptr %drop_val787)
  %__rc_scope_4788 = load ptr, ptr %__rc_scope_4, align 8
  ret ptr %__rc_scope_4788
}

; Function Attrs: nounwind
define ptr @ring_MapIterator_next(ptr nonnull %0) #0 {
entry:
  %__rc_scope_2 = alloca ptr, align 8
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_23 = alloca ptr, align 8
  %v = alloca ptr, align 8
  %__anf_22 = alloca ptr, align 8
  %__anf_21 = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %self789 = load ptr, ptr %self, align 8
  %fp790 = getelementptr inbounds nuw { ptr, ptr }, ptr %self789, i32 0, i32 0
  %entries791 = load ptr, ptr %fp790, align 8
  %ri792 = call i64 @ring_list_len(ptr %entries791)
  %sh793 = shl i64 %ri792, 1
  %tg794 = or i64 %sh793, 1
  %bi795 = inttoptr i64 %tg794 to ptr
  store ptr %bi795, ptr %__anf_21, align 8
  %self796 = load ptr, ptr %self, align 8
  %fp797 = getelementptr inbounds nuw { ptr, ptr }, ptr %self796, i32 0, i32 1
  %index798 = load ptr, ptr %fp797, align 8
  %__anf_21799 = load ptr, ptr %__anf_21, align 8
  %ui800 = ptrtoint ptr %index798 to i64
  %uv801 = ashr i64 %ui800, 1
  %ui802 = ptrtoint ptr %__anf_21799 to i64
  %uv803 = ashr i64 %ui802, 1
  %lt804 = icmp slt i64 %uv801, %uv803
  %ext805 = zext i1 %lt804 to i64
  %sh806 = shl i64 %ext805, 1
  %tg807 = or i64 %sh806, 1
  %bb808 = inttoptr i64 %tg807 to ptr
  store ptr %bb808, ptr %__anf_22, align 8
  %__anf_22809 = load ptr, ptr %__anf_22, align 8
  %ub810 = ptrtoint ptr %__anf_22809 to i64
  %sh811 = ashr i64 %ub810, 1
  %i1812 = trunc i64 %sh811 to i1
  br i1 %i1812, label %if.then, label %if.else

if.then:                                          ; preds = %entry
  %self813 = load ptr, ptr %self, align 8
  %fp814 = getelementptr inbounds nuw { ptr, ptr }, ptr %self813, i32 0, i32 1
  %index815 = load ptr, ptr %fp814, align 8
  %self816 = load ptr, ptr %self, align 8
  %fp817 = getelementptr inbounds nuw { ptr, ptr }, ptr %self816, i32 0, i32 0
  %entries818 = load ptr, ptr %fp817, align 8
  %ui819 = ptrtoint ptr %index815 to i64
  %uv820 = ashr i64 %ui819, 1
  %mc821 = call ptr @ring_list_get_opt(ptr %entries818, i64 %uv820)
  store ptr %mc821, ptr %v, align 8
  store ptr inttoptr (i64 3 to ptr), ptr %__anf_23, align 8
  %self825 = load ptr, ptr %self, align 8
  %fp826 = getelementptr inbounds nuw { ptr, ptr }, ptr %self825, i32 0, i32 1
  %index827 = load ptr, ptr %fp826, align 8
  %__anf_23828 = load ptr, ptr %__anf_23, align 8
  %ui829 = ptrtoint ptr %index827 to i64
  %uv830 = ashr i64 %ui829, 1
  %ui831 = ptrtoint ptr %__anf_23828 to i64
  %uv832 = ashr i64 %ui831, 1
  %add833 = add i64 %uv830, %uv832
  %sh834 = shl i64 %add833, 1
  %tg835 = or i64 %sh834, 1
  %bi836 = inttoptr i64 %tg835 to ptr
  %self837 = load ptr, ptr %self, align 8
  %fp838 = getelementptr inbounds nuw { ptr, ptr }, ptr %self837, i32 0, i32 1
  store ptr %bi836, ptr %fp838, align 8
  %v839 = load ptr, ptr %v, align 8
  call void @ring_dup(ptr %v839)
  store ptr %v839, ptr %__rc_scope_1, align 8
  %drop_val840 = load ptr, ptr %v, align 8
  call void @ring_drop(ptr %drop_val840)
  %drop_val841 = load ptr, ptr %__anf_23, align 8
  call void @ring_drop(ptr %drop_val841)
  %__rc_scope_1842 = load ptr, ptr %__rc_scope_1, align 8
  br label %if.merge

if.else:                                          ; preds = %entry
  %ctor843 = call ptr @ring_Option_none()
  call void @ring_dup(ptr %ctor843)
  br label %if.merge

if.merge:                                         ; preds = %if.else, %if.then
  %if844 = phi ptr [ %__rc_scope_1842, %if.then ], [ %ctor843, %if.else ]
  store ptr %if844, ptr %__rc_scope_2, align 8
  %drop_val845 = load ptr, ptr %__anf_21, align 8
  call void @ring_drop(ptr %drop_val845)
  %drop_val846 = load ptr, ptr %__anf_22, align 8
  call void @ring_drop(ptr %drop_val846)
  %__rc_scope_2847 = load ptr, ptr %__rc_scope_2, align 8
  ret ptr %__rc_scope_2847
}

; Function Attrs: nounwind
define ptr @ring_Map_iter(ptr nonnull %0) #0 {
entry:
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %s857 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 66)
  %self858 = load ptr, ptr %self, align 8
  %mc859 = call ptr @ring_map_entries(ptr %self858)
  %fp860 = getelementptr inbounds nuw { ptr, ptr }, ptr %s857, i32 0, i32 0
  store ptr %mc859, ptr %fp860, align 8
  %fp864 = getelementptr inbounds nuw { ptr, ptr }, ptr %s857, i32 0, i32 1
  store ptr inttoptr (i64 1 to ptr), ptr %fp864, align 8
  ret ptr %s857
}

; Function Attrs: nounwind
define ptr @ring_Map_is_empty(ptr nonnull %0) #0 {
entry:
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_25 = alloca ptr, align 8
  %__anf_24 = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %self874 = load ptr, ptr %self, align 8
  %ri875 = call i64 @ring_map_len(ptr %self874)
  %sh876 = shl i64 %ri875, 1
  %tg877 = or i64 %sh876, 1
  %bi878 = inttoptr i64 %tg877 to ptr
  store ptr %bi878, ptr %__anf_24, align 8
  store ptr inttoptr (i64 1 to ptr), ptr %__anf_25, align 8
  %__anf_24882 = load ptr, ptr %__anf_24, align 8
  %__anf_25883 = load ptr, ptr %__anf_25, align 8
  %ui884 = ptrtoint ptr %__anf_24882 to i64
  %uv885 = ashr i64 %ui884, 1
  %ui886 = ptrtoint ptr %__anf_25883 to i64
  %uv887 = ashr i64 %ui886, 1
  %eq888 = icmp eq i64 %uv885, %uv887
  %ext889 = zext i1 %eq888 to i64
  %sh890 = shl i64 %ext889, 1
  %tg891 = or i64 %sh890, 1
  %bb892 = inttoptr i64 %tg891 to ptr
  store ptr %bb892, ptr %__rc_scope_1, align 8
  %drop_val893 = load ptr, ptr %__anf_24, align 8
  call void @ring_drop(ptr %drop_val893)
  %drop_val894 = load ptr, ptr %__anf_25, align 8
  call void @ring_drop(ptr %drop_val894)
  %__rc_scope_1895 = load ptr, ptr %__rc_scope_1, align 8
  ret ptr %__rc_scope_1895
}

; Function Attrs: nounwind
define ptr @ring_SetIterator_next(ptr nonnull %0) #0 {
entry:
  %__rc_scope_2 = alloca ptr, align 8
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_28 = alloca ptr, align 8
  %v = alloca ptr, align 8
  %__anf_27 = alloca ptr, align 8
  %__anf_26 = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %self896 = load ptr, ptr %self, align 8
  %fp897 = getelementptr inbounds nuw { ptr, ptr }, ptr %self896, i32 0, i32 0
  %items898 = load ptr, ptr %fp897, align 8
  %ri899 = call i64 @ring_list_len(ptr %items898)
  %sh900 = shl i64 %ri899, 1
  %tg901 = or i64 %sh900, 1
  %bi902 = inttoptr i64 %tg901 to ptr
  store ptr %bi902, ptr %__anf_26, align 8
  %self903 = load ptr, ptr %self, align 8
  %fp904 = getelementptr inbounds nuw { ptr, ptr }, ptr %self903, i32 0, i32 1
  %index905 = load ptr, ptr %fp904, align 8
  %__anf_26906 = load ptr, ptr %__anf_26, align 8
  %ui907 = ptrtoint ptr %index905 to i64
  %uv908 = ashr i64 %ui907, 1
  %ui909 = ptrtoint ptr %__anf_26906 to i64
  %uv910 = ashr i64 %ui909, 1
  %lt911 = icmp slt i64 %uv908, %uv910
  %ext912 = zext i1 %lt911 to i64
  %sh913 = shl i64 %ext912, 1
  %tg914 = or i64 %sh913, 1
  %bb915 = inttoptr i64 %tg914 to ptr
  store ptr %bb915, ptr %__anf_27, align 8
  %__anf_27916 = load ptr, ptr %__anf_27, align 8
  %ub917 = ptrtoint ptr %__anf_27916 to i64
  %sh918 = ashr i64 %ub917, 1
  %i1919 = trunc i64 %sh918 to i1
  br i1 %i1919, label %if.then, label %if.else

if.then:                                          ; preds = %entry
  %self920 = load ptr, ptr %self, align 8
  %fp921 = getelementptr inbounds nuw { ptr, ptr }, ptr %self920, i32 0, i32 1
  %index922 = load ptr, ptr %fp921, align 8
  %self923 = load ptr, ptr %self, align 8
  %fp924 = getelementptr inbounds nuw { ptr, ptr }, ptr %self923, i32 0, i32 0
  %items925 = load ptr, ptr %fp924, align 8
  %ui926 = ptrtoint ptr %index922 to i64
  %uv927 = ashr i64 %ui926, 1
  %mc928 = call ptr @ring_list_get_opt(ptr %items925, i64 %uv927)
  store ptr %mc928, ptr %v, align 8
  store ptr inttoptr (i64 3 to ptr), ptr %__anf_28, align 8
  %self932 = load ptr, ptr %self, align 8
  %fp933 = getelementptr inbounds nuw { ptr, ptr }, ptr %self932, i32 0, i32 1
  %index934 = load ptr, ptr %fp933, align 8
  %__anf_28935 = load ptr, ptr %__anf_28, align 8
  %ui936 = ptrtoint ptr %index934 to i64
  %uv937 = ashr i64 %ui936, 1
  %ui938 = ptrtoint ptr %__anf_28935 to i64
  %uv939 = ashr i64 %ui938, 1
  %add940 = add i64 %uv937, %uv939
  %sh941 = shl i64 %add940, 1
  %tg942 = or i64 %sh941, 1
  %bi943 = inttoptr i64 %tg942 to ptr
  %self944 = load ptr, ptr %self, align 8
  %fp945 = getelementptr inbounds nuw { ptr, ptr }, ptr %self944, i32 0, i32 1
  store ptr %bi943, ptr %fp945, align 8
  %v946 = load ptr, ptr %v, align 8
  call void @ring_dup(ptr %v946)
  store ptr %v946, ptr %__rc_scope_1, align 8
  %drop_val947 = load ptr, ptr %v, align 8
  call void @ring_drop(ptr %drop_val947)
  %drop_val948 = load ptr, ptr %__anf_28, align 8
  call void @ring_drop(ptr %drop_val948)
  %__rc_scope_1949 = load ptr, ptr %__rc_scope_1, align 8
  br label %if.merge

if.else:                                          ; preds = %entry
  %ctor950 = call ptr @ring_Option_none()
  call void @ring_dup(ptr %ctor950)
  br label %if.merge

if.merge:                                         ; preds = %if.else, %if.then
  %if951 = phi ptr [ %__rc_scope_1949, %if.then ], [ %ctor950, %if.else ]
  store ptr %if951, ptr %__rc_scope_2, align 8
  %drop_val952 = load ptr, ptr %__anf_26, align 8
  call void @ring_drop(ptr %drop_val952)
  %drop_val953 = load ptr, ptr %__anf_27, align 8
  call void @ring_drop(ptr %drop_val953)
  %__rc_scope_2954 = load ptr, ptr %__rc_scope_2, align 8
  ret ptr %__rc_scope_2954
}

; Function Attrs: nounwind
define ptr @ring_Set_iter(ptr nonnull %0) #0 {
entry:
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %s964 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 67)
  %self965 = load ptr, ptr %self, align 8
  %mc966 = call ptr @ring_set_to_list(ptr %self965)
  %fp967 = getelementptr inbounds nuw { ptr, ptr }, ptr %s964, i32 0, i32 0
  store ptr %mc966, ptr %fp967, align 8
  %fp971 = getelementptr inbounds nuw { ptr, ptr }, ptr %s964, i32 0, i32 1
  store ptr inttoptr (i64 1 to ptr), ptr %fp971, align 8
  ret ptr %s964
}

; Function Attrs: nounwind
define ptr @ring_Set_is_empty(ptr nonnull %0) #0 {
entry:
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_30 = alloca ptr, align 8
  %__anf_29 = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %self981 = load ptr, ptr %self, align 8
  %ri982 = call i64 @ring_set_len(ptr %self981)
  %sh983 = shl i64 %ri982, 1
  %tg984 = or i64 %sh983, 1
  %bi985 = inttoptr i64 %tg984 to ptr
  store ptr %bi985, ptr %__anf_29, align 8
  store ptr inttoptr (i64 1 to ptr), ptr %__anf_30, align 8
  %__anf_29989 = load ptr, ptr %__anf_29, align 8
  %__anf_30990 = load ptr, ptr %__anf_30, align 8
  %ui991 = ptrtoint ptr %__anf_29989 to i64
  %uv992 = ashr i64 %ui991, 1
  %ui993 = ptrtoint ptr %__anf_30990 to i64
  %uv994 = ashr i64 %ui993, 1
  %eq995 = icmp eq i64 %uv992, %uv994
  %ext996 = zext i1 %eq995 to i64
  %sh997 = shl i64 %ext996, 1
  %tg998 = or i64 %sh997, 1
  %bb999 = inttoptr i64 %tg998 to ptr
  store ptr %bb999, ptr %__rc_scope_1, align 8
  %drop_val1000 = load ptr, ptr %__anf_29, align 8
  call void @ring_drop(ptr %drop_val1000)
  %drop_val1001 = load ptr, ptr %__anf_30, align 8
  call void @ring_drop(ptr %drop_val1001)
  %__rc_scope_11002 = load ptr, ptr %__rc_scope_1, align 8
  ret ptr %__rc_scope_11002
}

; Function Attrs: nounwind
define ptr @ring_Set_contains(ptr nonnull %0, ptr nonnull %1, ptr %2) #0 {
entry:
  %__rc_scope_3 = alloca ptr, align 8
  %__rc_scope_2 = alloca ptr, align 8
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_31 = alloca ptr, align 8
  %x = alloca ptr, align 8
  %idx1007 = alloca i64, align 8
  %items = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %item = alloca ptr, align 8
  store ptr %1, ptr %item, align 8
  %__ring_T_Eq = alloca ptr, align 8
  store ptr %2, ptr %__ring_T_Eq, align 8
  %self1003 = load ptr, ptr %self, align 8
  %mc1004 = call ptr @ring_set_to_list(ptr %self1003)
  store ptr %mc1004, ptr %items, align 8
  %items1005 = load ptr, ptr %items, align 8
  %len1006 = call i64 @ring_list_len(ptr %items1005)
  store i64 0, ptr %idx1007, align 8
  br label %forl.cond

forl.cond:                                        ; preds = %forl.incr, %entry
  %ci1008 = load i64, ptr %idx1007, align 8
  %cmp1009 = icmp slt i64 %ci1008, %len1006
  br i1 %cmp1009, label %forl.body, label %forl.merge

forl.body:                                        ; preds = %forl.cond
  %el1010 = call ptr @ring_list_get(ptr %items1005, i64 %ci1008)
  store ptr %el1010, ptr %x, align 8
  %x1011 = load ptr, ptr %x, align 8
  %item1012 = load ptr, ptr %item, align 8
  %dp1013 = load ptr, ptr %__ring_T_Eq, align 8
  %ms1014 = getelementptr inbounds nuw { i64, ptr }, ptr %dp1013, i32 0, i32 1
  %mc1015 = load ptr, ptr %ms1014, align 8
  %fps1016 = getelementptr inbounds nuw { ptr, ptr }, ptr %mc1015, i32 0, i32 0
  %fp1017 = load ptr, ptr %fps1016, align 8
  %eps1018 = getelementptr inbounds nuw { ptr, ptr }, ptr %mc1015, i32 0, i32 1
  %ep1019 = load ptr, ptr %eps1018, align 8
  %cc1020 = call ptr %fp1017(ptr %ep1019, ptr %x1011, ptr %item1012)
  store ptr %cc1020, ptr %__anf_31, align 8
  %__anf_311021 = load ptr, ptr %__anf_31, align 8
  %ub1022 = ptrtoint ptr %__anf_311021 to i64
  %sh1023 = ashr i64 %ub1022, 1
  %i11024 = trunc i64 %sh1023 to i1
  br i1 %i11024, label %if.then, label %if.else

forl.incr:                                        ; preds = %if.merge
  %ci1032 = load i64, ptr %idx1007, align 8
  %ni1033 = add i64 %ci1032, 1
  store i64 %ni1033, ptr %idx1007, align 8
  br label %forl.cond

forl.merge:                                       ; preds = %forl.cond
  store ptr inttoptr (i64 1 to ptr), ptr %__rc_scope_3, align 8
  %drop_val1035 = load ptr, ptr %items, align 8
  call void @ring_drop(ptr %drop_val1035)
  %__rc_scope_31036 = load ptr, ptr %__rc_scope_3, align 8
  ret ptr %__rc_scope_31036

if.then:                                          ; preds = %forl.body
  store ptr inttoptr (i64 3 to ptr), ptr %__rc_scope_1, align 8
  %drop_val1026 = load ptr, ptr %items, align 8
  call void @ring_drop(ptr %drop_val1026)
  %drop_val1027 = load ptr, ptr %__anf_31, align 8
  call void @ring_drop(ptr %drop_val1027)
  %__rc_scope_11028 = load ptr, ptr %__rc_scope_1, align 8
  ret ptr %__rc_scope_11028

if.else:                                          ; preds = %forl.body
  br label %if.merge

if.merge:                                         ; preds = %if.else, %after.ret
  %if1029 = phi ptr [ null, %after.ret ], [ null, %if.else ]
  store ptr %if1029, ptr %__rc_scope_2, align 8
  %drop_val1030 = load ptr, ptr %__anf_31, align 8
  call void @ring_drop(ptr %drop_val1030)
  %__rc_scope_21031 = load ptr, ptr %__rc_scope_2, align 8
  br label %forl.incr

after.ret:                                        ; No predecessors!
  br label %if.merge
}

; Function Attrs: nounwind
define ptr @ring_Set_has(ptr nonnull %0, ptr nonnull %1, ptr %2) #0 {
entry:
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %item = alloca ptr, align 8
  store ptr %1, ptr %item, align 8
  %__ring_T_Eq = alloca ptr, align 8
  store ptr %2, ptr %__ring_T_Eq, align 8
  %item1037 = load ptr, ptr %item, align 8
  %dict1038 = load ptr, ptr %__ring_T_Eq, align 8
  %self1039 = load ptr, ptr %self, align 8
  %rb1040 = call i64 @ring_set_has(ptr %self1039, ptr %item1037)
  %sh1041 = shl i64 %rb1040, 1
  %tg1042 = or i64 %sh1041, 1
  %bb1043 = inttoptr i64 %tg1042 to ptr
  ret ptr %bb1043
}

; Function Attrs: nounwind
define ptr @ring_Result_and_then(ptr nonnull %0, ptr nonnull %1) #0 {
entry:
  %e = alloca ptr, align 8
  %v = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %f = alloca ptr, align 8
  store ptr %1, ptr %f, align 8
  %self1044 = load ptr, ptr %self, align 8
  %tp1045 = getelementptr inbounds nuw { i64, ptr }, ptr %self1044, i32 0, i32 0
  %tag1046 = load i64, ptr %tp1045, align 8
  switch i64 %tag1046, label %match.default [
    i64 0, label %match.arm.Ok
    i64 1, label %match.arm.Err
  ]

match.merge:                                      ; preds = %match.arm.Err, %match.arm.Ok
  %mr1063 = phi ptr [ %cc1055, %match.arm.Ok ], [ %call1059, %match.arm.Err ]
  ret ptr %mr1063

match.default:                                    ; preds = %entry
  %s1061 = call ptr @ring_str_from_cstr(ptr @str1060)
  %mf1062 = call ptr @ring_match_fail(ptr %s1061, i64 %tag1046, i64 2, ptr %self1044)
  unreachable

match.arm.Ok:                                     ; preds = %entry
  %ef1047 = getelementptr inbounds nuw { i64, ptr }, ptr %self1044, i32 0, i32 1
  %v1048 = load ptr, ptr %ef1047, align 8
  store ptr %v1048, ptr %v, align 8
  %v1049 = load ptr, ptr %v, align 8
  %clos1050 = load ptr, ptr %f, align 8
  %fps1051 = getelementptr inbounds nuw { ptr, ptr }, ptr %clos1050, i32 0, i32 0
  %fp1052 = load ptr, ptr %fps1051, align 8
  %eps1053 = getelementptr inbounds nuw { ptr, ptr }, ptr %clos1050, i32 0, i32 1
  %ep1054 = load ptr, ptr %eps1053, align 8
  %cc1055 = call ptr %fp1052(ptr %ep1054, ptr %v1049)
  br label %match.merge

match.arm.Err:                                    ; preds = %entry
  %ef1056 = getelementptr inbounds nuw { i64, ptr }, ptr %self1044, i32 0, i32 1
  %e1057 = load ptr, ptr %ef1056, align 8
  store ptr %e1057, ptr %e, align 8
  %e1058 = load ptr, ptr %e, align 8
  call void @ring_dup(ptr %e1058)
  %call1059 = call ptr @ring_Result_Err(ptr %e1058)
  br label %match.merge
}

; Function Attrs: nounwind
define ptr @ring_Result_is_err(ptr nonnull %0) #0 {
entry:
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %self1064 = load ptr, ptr %self, align 8
  %tp1065 = getelementptr inbounds nuw { i64, ptr }, ptr %self1064, i32 0, i32 0
  %tag1066 = load i64, ptr %tp1065, align 8
  switch i64 %tag1066, label %match.default [
    i64 0, label %match.arm.Ok
    i64 1, label %match.arm.Err
  ]

match.merge:                                      ; preds = %match.arm.Err, %match.arm.Ok
  %mr1072 = phi ptr [ inttoptr (i64 1 to ptr), %match.arm.Ok ], [ inttoptr (i64 3 to ptr), %match.arm.Err ]
  ret ptr %mr1072

match.default:                                    ; preds = %entry
  %s1070 = call ptr @ring_str_from_cstr(ptr @str1069)
  %mf1071 = call ptr @ring_match_fail(ptr %s1070, i64 %tag1066, i64 3, ptr %self1064)
  unreachable

match.arm.Ok:                                     ; preds = %entry
  br label %match.merge

match.arm.Err:                                    ; preds = %entry
  br label %match.merge
}

; Function Attrs: nounwind
define ptr @ring_Result_is_ok(ptr nonnull %0) #0 {
entry:
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %self1073 = load ptr, ptr %self, align 8
  %tp1074 = getelementptr inbounds nuw { i64, ptr }, ptr %self1073, i32 0, i32 0
  %tag1075 = load i64, ptr %tp1074, align 8
  switch i64 %tag1075, label %match.default [
    i64 0, label %match.arm.Ok
    i64 1, label %match.arm.Err
  ]

match.merge:                                      ; preds = %match.arm.Err, %match.arm.Ok
  %mr1081 = phi ptr [ inttoptr (i64 3 to ptr), %match.arm.Ok ], [ inttoptr (i64 1 to ptr), %match.arm.Err ]
  ret ptr %mr1081

match.default:                                    ; preds = %entry
  %s1079 = call ptr @ring_str_from_cstr(ptr @str1078)
  %mf1080 = call ptr @ring_match_fail(ptr %s1079, i64 %tag1075, i64 4, ptr %self1073)
  unreachable

match.arm.Ok:                                     ; preds = %entry
  br label %match.merge

match.arm.Err:                                    ; preds = %entry
  br label %match.merge
}

; Function Attrs: nounwind
define ptr @ring_Result_map(ptr nonnull %0, ptr nonnull %1) #0 {
entry:
  %e = alloca ptr, align 8
  %v = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %f = alloca ptr, align 8
  store ptr %1, ptr %f, align 8
  %self1082 = load ptr, ptr %self, align 8
  %tp1083 = getelementptr inbounds nuw { i64, ptr }, ptr %self1082, i32 0, i32 0
  %tag1084 = load i64, ptr %tp1083, align 8
  switch i64 %tag1084, label %match.default [
    i64 0, label %match.arm.Ok
    i64 1, label %match.arm.Err
  ]

match.merge:                                      ; preds = %match.arm.Err, %match.arm.Ok
  %mr1102 = phi ptr [ %call1094, %match.arm.Ok ], [ %call1098, %match.arm.Err ]
  ret ptr %mr1102

match.default:                                    ; preds = %entry
  %s1100 = call ptr @ring_str_from_cstr(ptr @str1099)
  %mf1101 = call ptr @ring_match_fail(ptr %s1100, i64 %tag1084, i64 5, ptr %self1082)
  unreachable

match.arm.Ok:                                     ; preds = %entry
  %ef1085 = getelementptr inbounds nuw { i64, ptr }, ptr %self1082, i32 0, i32 1
  %v1086 = load ptr, ptr %ef1085, align 8
  store ptr %v1086, ptr %v, align 8
  %v1087 = load ptr, ptr %v, align 8
  %clos1088 = load ptr, ptr %f, align 8
  %fps1089 = getelementptr inbounds nuw { ptr, ptr }, ptr %clos1088, i32 0, i32 0
  %fp1090 = load ptr, ptr %fps1089, align 8
  %eps1091 = getelementptr inbounds nuw { ptr, ptr }, ptr %clos1088, i32 0, i32 1
  %ep1092 = load ptr, ptr %eps1091, align 8
  %cc1093 = call ptr %fp1090(ptr %ep1092, ptr %v1087)
  %call1094 = call ptr @ring_Result_Ok(ptr %cc1093)
  br label %match.merge

match.arm.Err:                                    ; preds = %entry
  %ef1095 = getelementptr inbounds nuw { i64, ptr }, ptr %self1082, i32 0, i32 1
  %e1096 = load ptr, ptr %ef1095, align 8
  store ptr %e1096, ptr %e, align 8
  %e1097 = load ptr, ptr %e, align 8
  call void @ring_dup(ptr %e1097)
  %call1098 = call ptr @ring_Result_Err(ptr %e1097)
  br label %match.merge
}

; Function Attrs: nounwind
define ptr @ring_Result_unwrap_or(ptr nonnull %0, ptr nonnull %1) #0 {
entry:
  %v = alloca ptr, align 8
  %self = alloca ptr, align 8
  store ptr %0, ptr %self, align 8
  %default = alloca ptr, align 8
  store ptr %1, ptr %default, align 8
  %self1103 = load ptr, ptr %self, align 8
  %tp1104 = getelementptr inbounds nuw { i64, ptr }, ptr %self1103, i32 0, i32 0
  %tag1105 = load i64, ptr %tp1104, align 8
  switch i64 %tag1105, label %match.default [
    i64 0, label %match.arm.Ok
    i64 1, label %match.arm.Err
  ]

match.merge:                                      ; preds = %match.arm.Err, %match.arm.Ok
  %mr1113 = phi ptr [ %v1108, %match.arm.Ok ], [ %default1109, %match.arm.Err ]
  ret ptr %mr1113

match.default:                                    ; preds = %entry
  %s1111 = call ptr @ring_str_from_cstr(ptr @str1110)
  %mf1112 = call ptr @ring_match_fail(ptr %s1111, i64 %tag1105, i64 6, ptr %self1103)
  unreachable

match.arm.Ok:                                     ; preds = %entry
  %ef1106 = getelementptr inbounds nuw { i64, ptr }, ptr %self1103, i32 0, i32 1
  %v1107 = load ptr, ptr %ef1106, align 8
  store ptr %v1107, ptr %v, align 8
  %v1108 = load ptr, ptr %v, align 8
  call void @ring_dup(ptr %v1108)
  br label %match.merge

match.arm.Err:                                    ; preds = %entry
  %default1109 = load ptr, ptr %default, align 8
  call void @ring_dup(ptr %default1109)
  br label %match.merge
}

define ptr @ring_to_result(ptr nonnull %0) {
entry:
  %e = alloca ptr, align 8
  %f = alloca ptr, align 8
  store ptr %0, ptr %f, align 8
  %frame1114 = call ptr @ring_catch_push()
  %buf1115 = call ptr @ring_catch_get_buf(ptr %frame1114)
  %fp1116 = call ptr @llvm.frameaddress.p0(i32 0)
  %sj1117 = call i32 @_setjmp(ptr %buf1115, ptr %fp1116)
  %sjcmp1118 = icmp eq i32 %sj1117, 0
  br i1 %sjcmp1118, label %try.normal, label %try.catch

try.normal:                                       ; preds = %entry
  %clos1119 = load ptr, ptr %f, align 8
  %fps1120 = getelementptr inbounds nuw { ptr, ptr }, ptr %clos1119, i32 0, i32 0
  %fp1121 = load ptr, ptr %fps1120, align 8
  %eps1122 = getelementptr inbounds nuw { ptr, ptr }, ptr %clos1119, i32 0, i32 1
  %ep1123 = load ptr, ptr %eps1122, align 8
  %cc1124 = call ptr %fp1121(ptr %ep1123)
  %call1125 = call ptr @ring_Result_Ok(ptr %cc1124)
  call void @ring_catch_pop()
  br label %try.merge

try.catch:                                        ; preds = %entry
  %err1126 = call ptr @ring_catch_get_error(ptr %frame1114)
  call void @ring_catch_pop()
  store ptr %err1126, ptr %e, align 8
  %e1127 = load ptr, ptr %e, align 8
  call void @ring_dup(ptr %e1127)
  %call1128 = call ptr @ring_Result_Err(ptr %e1127)
  br label %try.merge

try.merge:                                        ; preds = %try.catch, %try.normal
  %tryv1129 = phi ptr [ %call1125, %try.normal ], [ %call1128, %try.catch ]
  ret ptr %tryv1129
}

; Function Attrs: nounwind
define ptr @ring_main(ptr %0) #0 {
entry:
  %__rc_scope_1 = alloca ptr, align 8
  %x = alloca ptr, align 8
  %__anf_34 = alloca ptr, align 8
  %a = alloca ptr, align 8
  %__anf_33 = alloca ptr, align 8
  %__anf_32 = alloca ptr, align 8
  %__ring_ev_io = alloca ptr, align 8
  store ptr %0, ptr %__ring_ev_io, align 8
  store ptr inttoptr (i64 7 to ptr), ptr %__anf_32, align 8
  store ptr inttoptr (i64 5 to ptr), ptr %__anf_33, align 8
  %__anf_321136 = load ptr, ptr %__anf_32, align 8
  %__anf_331137 = load ptr, ptr %__anf_33, align 8
  %ui1138 = ptrtoint ptr %__anf_321136 to i64
  %uv1139 = ashr i64 %ui1138, 1
  %ui1140 = ptrtoint ptr %__anf_331137 to i64
  %uv1141 = ashr i64 %ui1140, 1
  %mul1142 = mul i64 %uv1139, %uv1141
  %sh1143 = shl i64 %mul1142, 1
  %tg1144 = or i64 %sh1143, 1
  %bi1145 = inttoptr i64 %tg1144 to ptr
  store ptr %bi1145, ptr %a, align 8
  store ptr inttoptr (i64 5 to ptr), ptr %__anf_34, align 8
  %a1149 = load ptr, ptr %a, align 8
  %__anf_341150 = load ptr, ptr %__anf_34, align 8
  %ui1151 = ptrtoint ptr %a1149 to i64
  %uv1152 = ashr i64 %ui1151, 1
  %ui1153 = ptrtoint ptr %__anf_341150 to i64
  %uv1154 = ashr i64 %ui1153, 1
  %mul1155 = mul i64 %uv1152, %uv1154
  %sh1156 = shl i64 %mul1155, 1
  %tg1157 = or i64 %sh1156, 1
  %bi1158 = inttoptr i64 %tg1157 to ptr
  store ptr %bi1158, ptr %x, align 8
  %x1159 = load ptr, ptr %x, align 8
  %ui1160 = ptrtoint ptr %x1159 to i64
  %uv1161 = ashr i64 %ui1160, 1
  %its1162 = call ptr @ring_int_to_str(i64 %uv1161)
  %rt1163 = call ptr @ring_print(ptr %its1162)
  store ptr %rt1163, ptr %__rc_scope_1, align 8
  %drop_val1164 = load ptr, ptr %__anf_32, align 8
  call void @ring_drop(ptr %drop_val1164)
  %drop_val1165 = load ptr, ptr %__anf_33, align 8
  call void @ring_drop(ptr %drop_val1165)
  %drop_val1166 = load ptr, ptr %a, align 8
  call void @ring_drop(ptr %drop_val1166)
  %drop_val1167 = load ptr, ptr %__anf_34, align 8
  call void @ring_drop(ptr %drop_val1167)
  %drop_val1168 = load ptr, ptr %x, align 8
  call void @ring_drop(ptr %drop_val1168)
  %__rc_scope_11169 = load ptr, ptr %__rc_scope_1, align 8
  ret ptr %__rc_scope_11169
}

define ptr @ring_Option_eq(ptr %0, ptr %1, ptr %2) {
entry:
  %__ring_T_Eq = alloca ptr, align 8
  store ptr %2, ptr %__ring_T_Eq, align 8
  %stp0 = getelementptr inbounds nuw { i64 }, ptr %0, i32 0, i32 0
  %stv1 = load i64, ptr %stp0, align 8
  %otp2 = getelementptr inbounds nuw { i64 }, ptr %1, i32 0, i32 0
  %otv3 = load i64, ptr %otp2, align 8
  %teq4 = icmp eq i64 %stv1, %otv3
  br i1 %teq4, label %eq.same, label %eq.diff

eq.diff:                                          ; preds = %entry
  ret ptr inttoptr (i64 1 to ptr)

eq.same:                                          ; preds = %entry
  switch i64 %stv1, label %eq.default [
    i64 0, label %eq.v.some
    i64 1, label %eq.v.none
  ]

eq.ret.true:                                      ; preds = %eq.default, %eq.v.none, %eq.v.some
  ret ptr inttoptr (i64 3 to ptr)

eq.ret.false:                                     ; preds = %eq.v.some
  ret ptr inttoptr (i64 1 to ptr)

eq.default:                                       ; preds = %eq.same
  br label %eq.ret.true

eq.v.some:                                        ; preds = %eq.same
  %sf8 = getelementptr inbounds nuw { i64, ptr }, ptr %0, i32 0, i32 1
  %sv9 = load ptr, ptr %sf8, align 8
  %of10 = getelementptr inbounds nuw { i64, ptr }, ptr %1, i32 0, i32 1
  %ov11 = load ptr, ptr %of10, align 8
  %dp12 = load ptr, ptr %__ring_T_Eq, align 8
  %eqs13 = getelementptr inbounds nuw { i64, ptr, ptr, ptr, ptr }, ptr %dp12, i32 0, i32 1
  %eqc14 = load ptr, ptr %eqs13, align 8
  %fps15 = getelementptr inbounds nuw { ptr, ptr }, ptr %eqc14, i32 0, i32 0
  %fp16 = load ptr, ptr %fps15, align 8
  %eps17 = getelementptr inbounds nuw { ptr, ptr }, ptr %eqc14, i32 0, i32 1
  %ep18 = load ptr, ptr %eps17, align 8
  %deq19 = call ptr %fp16(ptr %ep18, ptr %sv9, ptr %ov11)
  %ui20 = ptrtoint ptr %deq19 to i64
  %uv21 = ashr i64 %ui20, 1
  %di122 = icmp ne i64 %uv21, 0
  br i1 %di122, label %eq.ret.true, label %eq.ret.false

eq.v.none:                                        ; preds = %eq.same
  br label %eq.ret.true
}

define ptr @ring_Option_ne(ptr %0, ptr %1, ptr %2) {
entry:
  %eqr29 = call ptr @ring_Option_eq(ptr %0, ptr %1, ptr %2)
  %ui30 = ptrtoint ptr %eqr29 to i64
  %uv31 = ashr i64 %ui30, 1
  %neg32 = sub i64 1, %uv31
  %sh33 = shl i64 %neg32, 1
  %tg34 = or i64 %sh33, 1
  %bb35 = inttoptr i64 %tg34 to ptr
  ret ptr %bb35
}

define ptr @ring_dict_build___Option_Eq() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr, ptr }, ptr %dict, i32 0, i32 0
  store i64 2, ptr %dcnt, align 8
  %cls37 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps38 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls37, i32 0, i32 0
  store ptr @ring_Option_eq__dictthunk, ptr %fps38, align 8
  %eps39 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls37, i32 0, i32 1
  store ptr null, ptr %eps39, align 8
  %ds40 = getelementptr inbounds nuw { i64, ptr, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls37, ptr %ds40, align 8
  %cls42 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps43 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls42, i32 0, i32 0
  store ptr @ring_Option_ne__dictthunk, ptr %fps43, align 8
  %eps44 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls42, i32 0, i32 1
  store ptr null, ptr %eps44, align 8
  %ds45 = getelementptr inbounds nuw { i64, ptr, ptr }, ptr %dict, i32 0, i32 2
  store ptr %cls42, ptr %ds45, align 8
  ret ptr %dict
}

define ptr @ring_Option_eq__dictthunk(ptr %0, ptr %1, ptr %2, ptr %3) {
entry:
  %tk36 = call ptr @ring_Option_eq(ptr %1, ptr %2, ptr %3)
  ret ptr %tk36
}

define ptr @ring_Option_ne__dictthunk(ptr %0, ptr %1, ptr %2, ptr %3) {
entry:
  %tk41 = call ptr @ring_Option_ne(ptr %1, ptr %2, ptr %3)
  ret ptr %tk41
}

define ptr @ring_dict_init___Option_Eq() {
entry:
  %dc46 = load ptr, ptr @__ring_dictg___Option_Eq, align 8
  %dn47 = icmp eq ptr %dc46, null
  br i1 %dn47, label %build, label %done

build:                                            ; preds = %entry
  %db48 = call ptr @ring_dict_build___Option_Eq()
  store ptr %db48, ptr @__ring_dictg___Option_Eq, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv49 = load ptr, ptr @__ring_dictg___Option_Eq, align 8
  ret ptr %dv49
}

define ptr @ring_Option_debug(ptr %0, ptr %1) {
entry:
  %__ring_T_Debug = alloca ptr, align 8
  store ptr %1, ptr %__ring_T_Debug, align 8
  %tp50 = getelementptr inbounds nuw { i64 }, ptr %0, i32 0, i32 0
  %tv51 = load i64, ptr %tp50, align 8
  switch i64 %tv51, label %dbg.default [
    i64 0, label %dbg.some
    i64 1, label %dbg.none
  ]

dbg.default:                                      ; preds = %entry
  %sl74 = call ptr @ring_str_from_cstr(ptr @str73)
  br label %dbg.merge

dbg.merge:                                        ; preds = %dbg.default, %dbg.none, %dbg.some
  %dbgr75 = phi ptr [ %dbg70, %dbg.some ], [ %sl72, %dbg.none ], [ %sl74, %dbg.default ]
  ret ptr %dbgr75

dbg.some:                                         ; preds = %entry
  %sb52 = call ptr @ring_sb_new()
  %sl54 = call ptr @ring_str_from_cstr(ptr @str53)
  %sba55 = call ptr @ring_sb_add(ptr %sb52, ptr %sl54)
  call void @ring_drop(ptr %sl54)
  %efp56 = getelementptr inbounds nuw { i64, ptr }, ptr %0, i32 0, i32 1
  %efv57 = load ptr, ptr %efp56, align 8
  %dp58 = load ptr, ptr %__ring_T_Debug, align 8
  %dbs59 = getelementptr inbounds nuw { i64, ptr }, ptr %dp58, i32 0, i32 1
  %dbc60 = load ptr, ptr %dbs59, align 8
  %fps61 = getelementptr inbounds nuw { ptr, ptr }, ptr %dbc60, i32 0, i32 0
  %fp62 = load ptr, ptr %fps61, align 8
  %eps63 = getelementptr inbounds nuw { ptr, ptr }, ptr %dbc60, i32 0, i32 1
  %ep64 = load ptr, ptr %eps63, align 8
  %dbr65 = call ptr %fp62(ptr %ep64, ptr %efv57)
  %sba66 = call ptr @ring_sb_add(ptr %sb52, ptr %dbr65)
  call void @ring_drop(ptr %dbr65)
  %sl68 = call ptr @ring_str_from_cstr(ptr @str67)
  %sba69 = call ptr @ring_sb_add(ptr %sb52, ptr %sl68)
  call void @ring_drop(ptr %sl68)
  %dbg70 = call ptr @ring_sb_to_str(ptr %sb52)
  call void @ring_drop(ptr %sb52)
  br label %dbg.merge

dbg.none:                                         ; preds = %entry
  %sl72 = call ptr @ring_str_from_cstr(ptr @str71)
  br label %dbg.merge
}

define ptr @ring_dict_build___Option_Debug() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls77 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps78 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls77, i32 0, i32 0
  store ptr @ring_Option_debug__dictthunk, ptr %fps78, align 8
  %eps79 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls77, i32 0, i32 1
  store ptr null, ptr %eps79, align 8
  %ds80 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls77, ptr %ds80, align 8
  ret ptr %dict
}

define ptr @ring_Option_debug__dictthunk(ptr %0, ptr %1, ptr %2) {
entry:
  %tk76 = call ptr @ring_Option_debug(ptr %1, ptr %2)
  ret ptr %tk76
}

define ptr @ring_dict_init___Option_Debug() {
entry:
  %dc81 = load ptr, ptr @__ring_dictg___Option_Debug, align 8
  %dn82 = icmp eq ptr %dc81, null
  br i1 %dn82, label %build, label %done

build:                                            ; preds = %entry
  %db83 = call ptr @ring_dict_build___Option_Debug()
  store ptr %db83, ptr @__ring_dictg___Option_Debug, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv84 = load ptr, ptr @__ring_dictg___Option_Debug, align 8
  ret ptr %dv84
}

define ptr @ring_Option_cmp(ptr %0, ptr %1, ptr %2) {
entry:
  %__ring_T_Ord = alloca ptr, align 8
  store ptr %2, ptr %__ring_T_Ord, align 8
  %stp85 = getelementptr inbounds nuw { i64 }, ptr %0, i32 0, i32 0
  %stv86 = load i64, ptr %stp85, align 8
  %otp87 = getelementptr inbounds nuw { i64 }, ptr %1, i32 0, i32 0
  %otv88 = load i64, ptr %otp87, align 8
  %teq89 = icmp eq i64 %stv86, %otv88
  br i1 %teq89, label %tags.same, label %tags.diff

tags.diff:                                        ; preds = %entry
  %slt90 = icmp slt i64 %stv86, %otv88
  br i1 %slt90, label %tag.lt, label %tag.gt

tags.same:                                        ; preds = %entry
  switch i64 %stv86, label %cmp.default [
    i64 0, label %cmp.v.some
    i64 1, label %cmp.v.none
  ]

tag.lt:                                           ; preds = %tags.diff
  br label %tag.merge

tag.gt:                                           ; preds = %tags.diff
  br label %tag.merge

tag.merge:                                        ; preds = %tag.gt, %tag.lt
  %tcmp97 = phi ptr [ inttoptr (i64 -1 to ptr), %tag.lt ], [ inttoptr (i64 3 to ptr), %tag.gt ]
  ret ptr %tcmp97

cmp.default:                                      ; preds = %tags.same
  ret ptr inttoptr (i64 1 to ptr)

cmp.v.some:                                       ; preds = %tags.same
  %sf98 = getelementptr inbounds nuw { i64, ptr }, ptr %0, i32 0, i32 1
  %sv99 = load ptr, ptr %sf98, align 8
  %of100 = getelementptr inbounds nuw { i64, ptr }, ptr %1, i32 0, i32 1
  %ov101 = load ptr, ptr %of100, align 8
  %dp102 = load ptr, ptr %__ring_T_Ord, align 8
  %cmps103 = getelementptr inbounds nuw { i64, ptr }, ptr %dp102, i32 0, i32 1
  %cmpc104 = load ptr, ptr %cmps103, align 8
  %fps105 = getelementptr inbounds nuw { ptr, ptr }, ptr %cmpc104, i32 0, i32 0
  %fp106 = load ptr, ptr %fps105, align 8
  %eps107 = getelementptr inbounds nuw { ptr, ptr }, ptr %cmpc104, i32 0, i32 1
  %ep108 = load ptr, ptr %eps107, align 8
  %dcmp109 = call ptr %fp106(ptr %ep108, ptr %sv99, ptr %ov101)
  ret ptr %dcmp109

cmp.v.none:                                       ; preds = %tags.same
  ret ptr inttoptr (i64 1 to ptr)
}

define ptr @ring_dict_build___Option_Ord() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls117 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps118 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls117, i32 0, i32 0
  store ptr @ring_Option_cmp__dictthunk, ptr %fps118, align 8
  %eps119 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls117, i32 0, i32 1
  store ptr null, ptr %eps119, align 8
  %ds120 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls117, ptr %ds120, align 8
  ret ptr %dict
}

define ptr @ring_Option_cmp__dictthunk(ptr %0, ptr %1, ptr %2, ptr %3) {
entry:
  %tk116 = call ptr @ring_Option_cmp(ptr %1, ptr %2, ptr %3)
  ret ptr %tk116
}

define ptr @ring_dict_init___Option_Ord() {
entry:
  %dc121 = load ptr, ptr @__ring_dictg___Option_Ord, align 8
  %dn122 = icmp eq ptr %dc121, null
  br i1 %dn122, label %build, label %done

build:                                            ; preds = %entry
  %db123 = call ptr @ring_dict_build___Option_Ord()
  store ptr %db123, ptr @__ring_dictg___Option_Ord, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv124 = load ptr, ptr @__ring_dictg___Option_Ord, align 8
  ret ptr %dv124
}

define ptr @ring_Option_clone(ptr %0) {
entry:
  call void @ring_dup(ptr %0)
  ret ptr %0
}

define ptr @ring_dict_build___Option_Clone() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls126 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps127 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls126, i32 0, i32 0
  store ptr @ring_Option_clone__dictthunk, ptr %fps127, align 8
  %eps128 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls126, i32 0, i32 1
  store ptr null, ptr %eps128, align 8
  %ds129 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls126, ptr %ds129, align 8
  ret ptr %dict
}

define ptr @ring_Option_clone__dictthunk(ptr %0, ptr %1) {
entry:
  %tk125 = call ptr @ring_Option_clone(ptr %1)
  ret ptr %tk125
}

define ptr @ring_dict_init___Option_Clone() {
entry:
  %dc130 = load ptr, ptr @__ring_dictg___Option_Clone, align 8
  %dn131 = icmp eq ptr %dc130, null
  br i1 %dn131, label %build, label %done

build:                                            ; preds = %entry
  %db132 = call ptr @ring_dict_build___Option_Clone()
  store ptr %db132, ptr @__ring_dictg___Option_Clone, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv133 = load ptr, ptr @__ring_dictg___Option_Clone, align 8
  ret ptr %dv133
}

define ptr @ring_Result_eq(ptr %0, ptr %1, ptr %2, ptr %3) {
entry:
  %__ring_T_Eq = alloca ptr, align 8
  store ptr %2, ptr %__ring_T_Eq, align 8
  %__ring_E_Eq = alloca ptr, align 8
  store ptr %3, ptr %__ring_E_Eq, align 8
  %stp134 = getelementptr inbounds nuw { i64 }, ptr %0, i32 0, i32 0
  %stv135 = load i64, ptr %stp134, align 8
  %otp136 = getelementptr inbounds nuw { i64 }, ptr %1, i32 0, i32 0
  %otv137 = load i64, ptr %otp136, align 8
  %teq138 = icmp eq i64 %stv135, %otv137
  br i1 %teq138, label %eq.same, label %eq.diff

eq.diff:                                          ; preds = %entry
  ret ptr inttoptr (i64 1 to ptr)

eq.same:                                          ; preds = %entry
  switch i64 %stv135, label %eq.default [
    i64 0, label %eq.v.Ok
    i64 1, label %eq.v.Err
  ]

eq.ret.true:                                      ; preds = %eq.default, %eq.v.Err, %eq.v.Ok
  ret ptr inttoptr (i64 3 to ptr)

eq.ret.false:                                     ; preds = %eq.v.Err, %eq.v.Ok
  ret ptr inttoptr (i64 1 to ptr)

eq.default:                                       ; preds = %eq.same
  br label %eq.ret.true

eq.v.Ok:                                          ; preds = %eq.same
  %sf142 = getelementptr inbounds nuw { i64, ptr }, ptr %0, i32 0, i32 1
  %sv143 = load ptr, ptr %sf142, align 8
  %of144 = getelementptr inbounds nuw { i64, ptr }, ptr %1, i32 0, i32 1
  %ov145 = load ptr, ptr %of144, align 8
  %dp146 = load ptr, ptr %__ring_T_Eq, align 8
  %eqs147 = getelementptr inbounds nuw { i64, ptr, ptr, ptr, ptr }, ptr %dp146, i32 0, i32 1
  %eqc148 = load ptr, ptr %eqs147, align 8
  %fps149 = getelementptr inbounds nuw { ptr, ptr }, ptr %eqc148, i32 0, i32 0
  %fp150 = load ptr, ptr %fps149, align 8
  %eps151 = getelementptr inbounds nuw { ptr, ptr }, ptr %eqc148, i32 0, i32 1
  %ep152 = load ptr, ptr %eps151, align 8
  %deq153 = call ptr %fp150(ptr %ep152, ptr %sv143, ptr %ov145)
  %ui154 = ptrtoint ptr %deq153 to i64
  %uv155 = ashr i64 %ui154, 1
  %di1156 = icmp ne i64 %uv155, 0
  br i1 %di1156, label %eq.ret.true, label %eq.ret.false

eq.v.Err:                                         ; preds = %eq.same
  %sf157 = getelementptr inbounds nuw { i64, ptr }, ptr %0, i32 0, i32 1
  %sv158 = load ptr, ptr %sf157, align 8
  %of159 = getelementptr inbounds nuw { i64, ptr }, ptr %1, i32 0, i32 1
  %ov160 = load ptr, ptr %of159, align 8
  %dp161 = load ptr, ptr %__ring_E_Eq, align 8
  %eqs162 = getelementptr inbounds nuw { i64, ptr, ptr, ptr, ptr }, ptr %dp161, i32 0, i32 1
  %eqc163 = load ptr, ptr %eqs162, align 8
  %fps164 = getelementptr inbounds nuw { ptr, ptr }, ptr %eqc163, i32 0, i32 0
  %fp165 = load ptr, ptr %fps164, align 8
  %eps166 = getelementptr inbounds nuw { ptr, ptr }, ptr %eqc163, i32 0, i32 1
  %ep167 = load ptr, ptr %eps166, align 8
  %deq168 = call ptr %fp165(ptr %ep167, ptr %sv158, ptr %ov160)
  %ui169 = ptrtoint ptr %deq168 to i64
  %uv170 = ashr i64 %ui169, 1
  %di1171 = icmp ne i64 %uv170, 0
  br i1 %di1171, label %eq.ret.true, label %eq.ret.false
}

define ptr @ring_Result_ne(ptr %0, ptr %1, ptr %2, ptr %3) {
entry:
  %eqr178 = call ptr @ring_Result_eq(ptr %0, ptr %1, ptr %2, ptr %3)
  %ui179 = ptrtoint ptr %eqr178 to i64
  %uv180 = ashr i64 %ui179, 1
  %neg181 = sub i64 1, %uv180
  %sh182 = shl i64 %neg181, 1
  %tg183 = or i64 %sh182, 1
  %bb184 = inttoptr i64 %tg183 to ptr
  ret ptr %bb184
}

define ptr @ring_dict_build___Result_Eq() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr, ptr }, ptr %dict, i32 0, i32 0
  store i64 2, ptr %dcnt, align 8
  %cls186 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps187 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls186, i32 0, i32 0
  store ptr @ring_Result_eq__dictthunk, ptr %fps187, align 8
  %eps188 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls186, i32 0, i32 1
  store ptr null, ptr %eps188, align 8
  %ds189 = getelementptr inbounds nuw { i64, ptr, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls186, ptr %ds189, align 8
  %cls191 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps192 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls191, i32 0, i32 0
  store ptr @ring_Result_ne__dictthunk, ptr %fps192, align 8
  %eps193 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls191, i32 0, i32 1
  store ptr null, ptr %eps193, align 8
  %ds194 = getelementptr inbounds nuw { i64, ptr, ptr }, ptr %dict, i32 0, i32 2
  store ptr %cls191, ptr %ds194, align 8
  ret ptr %dict
}

define ptr @ring_Result_eq__dictthunk(ptr %0, ptr %1, ptr %2, ptr %3, ptr %4) {
entry:
  %tk185 = call ptr @ring_Result_eq(ptr %1, ptr %2, ptr %3, ptr %4)
  ret ptr %tk185
}

define ptr @ring_Result_ne__dictthunk(ptr %0, ptr %1, ptr %2, ptr %3, ptr %4) {
entry:
  %tk190 = call ptr @ring_Result_ne(ptr %1, ptr %2, ptr %3, ptr %4)
  ret ptr %tk190
}

define ptr @ring_dict_init___Result_Eq() {
entry:
  %dc195 = load ptr, ptr @__ring_dictg___Result_Eq, align 8
  %dn196 = icmp eq ptr %dc195, null
  br i1 %dn196, label %build, label %done

build:                                            ; preds = %entry
  %db197 = call ptr @ring_dict_build___Result_Eq()
  store ptr %db197, ptr @__ring_dictg___Result_Eq, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv198 = load ptr, ptr @__ring_dictg___Result_Eq, align 8
  ret ptr %dv198
}

define ptr @ring_ListIterator_clone(ptr %0) {
entry:
  call void @ring_dup(ptr %0)
  ret ptr %0
}

define ptr @ring_dict_build___ListIterator_Clone() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls200 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps201 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls200, i32 0, i32 0
  store ptr @ring_ListIterator_clone__dictthunk, ptr %fps201, align 8
  %eps202 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls200, i32 0, i32 1
  store ptr null, ptr %eps202, align 8
  %ds203 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls200, ptr %ds203, align 8
  ret ptr %dict
}

define ptr @ring_ListIterator_clone__dictthunk(ptr %0, ptr %1) {
entry:
  %tk199 = call ptr @ring_ListIterator_clone(ptr %1)
  ret ptr %tk199
}

define ptr @ring_dict_init___ListIterator_Clone() {
entry:
  %dc204 = load ptr, ptr @__ring_dictg___ListIterator_Clone, align 8
  %dn205 = icmp eq ptr %dc204, null
  br i1 %dn205, label %build, label %done

build:                                            ; preds = %entry
  %db206 = call ptr @ring_dict_build___ListIterator_Clone()
  store ptr %db206, ptr @__ring_dictg___ListIterator_Clone, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv207 = load ptr, ptr @__ring_dictg___ListIterator_Clone, align 8
  ret ptr %dv207
}

define ptr @ring_SetIterator_clone(ptr %0) {
entry:
  call void @ring_dup(ptr %0)
  ret ptr %0
}

define ptr @ring_dict_build___SetIterator_Clone() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls209 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps210 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls209, i32 0, i32 0
  store ptr @ring_SetIterator_clone__dictthunk, ptr %fps210, align 8
  %eps211 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls209, i32 0, i32 1
  store ptr null, ptr %eps211, align 8
  %ds212 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls209, ptr %ds212, align 8
  ret ptr %dict
}

define ptr @ring_SetIterator_clone__dictthunk(ptr %0, ptr %1) {
entry:
  %tk208 = call ptr @ring_SetIterator_clone(ptr %1)
  ret ptr %tk208
}

define ptr @ring_dict_init___SetIterator_Clone() {
entry:
  %dc213 = load ptr, ptr @__ring_dictg___SetIterator_Clone, align 8
  %dn214 = icmp eq ptr %dc213, null
  br i1 %dn214, label %build, label %done

build:                                            ; preds = %entry
  %db215 = call ptr @ring_dict_build___SetIterator_Clone()
  store ptr %db215, ptr @__ring_dictg___SetIterator_Clone, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv216 = load ptr, ptr @__ring_dictg___SetIterator_Clone, align 8
  ret ptr %dv216
}

define ptr @ring_Result_clone(ptr %0) {
entry:
  call void @ring_dup(ptr %0)
  ret ptr %0
}

define ptr @ring_dict_build___Result_Clone() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls218 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps219 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls218, i32 0, i32 0
  store ptr @ring_Result_clone__dictthunk, ptr %fps219, align 8
  %eps220 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls218, i32 0, i32 1
  store ptr null, ptr %eps220, align 8
  %ds221 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls218, ptr %ds221, align 8
  ret ptr %dict
}

define ptr @ring_Result_clone__dictthunk(ptr %0, ptr %1) {
entry:
  %tk217 = call ptr @ring_Result_clone(ptr %1)
  ret ptr %tk217
}

define ptr @ring_dict_init___Result_Clone() {
entry:
  %dc222 = load ptr, ptr @__ring_dictg___Result_Clone, align 8
  %dn223 = icmp eq ptr %dc222, null
  br i1 %dn223, label %build, label %done

build:                                            ; preds = %entry
  %db224 = call ptr @ring_dict_build___Result_Clone()
  store ptr %db224, ptr @__ring_dictg___Result_Clone, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv225 = load ptr, ptr @__ring_dictg___Result_Clone, align 8
  ret ptr %dv225
}

define ptr @ring_Result_cmp(ptr %0, ptr %1, ptr %2, ptr %3) {
entry:
  %__ring_T_Ord = alloca ptr, align 8
  store ptr %2, ptr %__ring_T_Ord, align 8
  %__ring_E_Ord = alloca ptr, align 8
  store ptr %3, ptr %__ring_E_Ord, align 8
  %stp226 = getelementptr inbounds nuw { i64 }, ptr %0, i32 0, i32 0
  %stv227 = load i64, ptr %stp226, align 8
  %otp228 = getelementptr inbounds nuw { i64 }, ptr %1, i32 0, i32 0
  %otv229 = load i64, ptr %otp228, align 8
  %teq230 = icmp eq i64 %stv227, %otv229
  br i1 %teq230, label %tags.same, label %tags.diff

tags.diff:                                        ; preds = %entry
  %slt231 = icmp slt i64 %stv227, %otv229
  br i1 %slt231, label %tag.lt, label %tag.gt

tags.same:                                        ; preds = %entry
  switch i64 %stv227, label %cmp.default [
    i64 0, label %cmp.v.Ok
    i64 1, label %cmp.v.Err
  ]

tag.lt:                                           ; preds = %tags.diff
  br label %tag.merge

tag.gt:                                           ; preds = %tags.diff
  br label %tag.merge

tag.merge:                                        ; preds = %tag.gt, %tag.lt
  %tcmp238 = phi ptr [ inttoptr (i64 -1 to ptr), %tag.lt ], [ inttoptr (i64 3 to ptr), %tag.gt ]
  ret ptr %tcmp238

cmp.default:                                      ; preds = %tags.same
  ret ptr inttoptr (i64 1 to ptr)

cmp.v.Ok:                                         ; preds = %tags.same
  %sf239 = getelementptr inbounds nuw { i64, ptr }, ptr %0, i32 0, i32 1
  %sv240 = load ptr, ptr %sf239, align 8
  %of241 = getelementptr inbounds nuw { i64, ptr }, ptr %1, i32 0, i32 1
  %ov242 = load ptr, ptr %of241, align 8
  %dp243 = load ptr, ptr %__ring_T_Ord, align 8
  %cmps244 = getelementptr inbounds nuw { i64, ptr }, ptr %dp243, i32 0, i32 1
  %cmpc245 = load ptr, ptr %cmps244, align 8
  %fps246 = getelementptr inbounds nuw { ptr, ptr }, ptr %cmpc245, i32 0, i32 0
  %fp247 = load ptr, ptr %fps246, align 8
  %eps248 = getelementptr inbounds nuw { ptr, ptr }, ptr %cmpc245, i32 0, i32 1
  %ep249 = load ptr, ptr %eps248, align 8
  %dcmp250 = call ptr %fp247(ptr %ep249, ptr %sv240, ptr %ov242)
  ret ptr %dcmp250

cmp.v.Err:                                        ; preds = %tags.same
  %sf251 = getelementptr inbounds nuw { i64, ptr }, ptr %0, i32 0, i32 1
  %sv252 = load ptr, ptr %sf251, align 8
  %of253 = getelementptr inbounds nuw { i64, ptr }, ptr %1, i32 0, i32 1
  %ov254 = load ptr, ptr %of253, align 8
  %dp255 = load ptr, ptr %__ring_E_Ord, align 8
  %cmps256 = getelementptr inbounds nuw { i64, ptr }, ptr %dp255, i32 0, i32 1
  %cmpc257 = load ptr, ptr %cmps256, align 8
  %fps258 = getelementptr inbounds nuw { ptr, ptr }, ptr %cmpc257, i32 0, i32 0
  %fp259 = load ptr, ptr %fps258, align 8
  %eps260 = getelementptr inbounds nuw { ptr, ptr }, ptr %cmpc257, i32 0, i32 1
  %ep261 = load ptr, ptr %eps260, align 8
  %dcmp262 = call ptr %fp259(ptr %ep261, ptr %sv252, ptr %ov254)
  ret ptr %dcmp262
}

define ptr @ring_dict_build___Result_Ord() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls267 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps268 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls267, i32 0, i32 0
  store ptr @ring_Result_cmp__dictthunk, ptr %fps268, align 8
  %eps269 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls267, i32 0, i32 1
  store ptr null, ptr %eps269, align 8
  %ds270 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls267, ptr %ds270, align 8
  ret ptr %dict
}

define ptr @ring_Result_cmp__dictthunk(ptr %0, ptr %1, ptr %2, ptr %3, ptr %4) {
entry:
  %tk266 = call ptr @ring_Result_cmp(ptr %1, ptr %2, ptr %3, ptr %4)
  ret ptr %tk266
}

define ptr @ring_dict_init___Result_Ord() {
entry:
  %dc271 = load ptr, ptr @__ring_dictg___Result_Ord, align 8
  %dn272 = icmp eq ptr %dc271, null
  br i1 %dn272, label %build, label %done

build:                                            ; preds = %entry
  %db273 = call ptr @ring_dict_build___Result_Ord()
  store ptr %db273, ptr @__ring_dictg___Result_Ord, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv274 = load ptr, ptr @__ring_dictg___Result_Ord, align 8
  ret ptr %dv274
}

define ptr @ring_ListIterator_debug(ptr %0, ptr %1) {
entry:
  %__ring_T_Debug = alloca ptr, align 8
  store ptr %1, ptr %__ring_T_Debug, align 8
  %sb275 = call ptr @ring_sb_new()
  %sl277 = call ptr @ring_str_from_cstr(ptr @str276)
  %sba278 = call ptr @ring_sb_add(ptr %sb275, ptr %sl277)
  call void @ring_drop(ptr %sl277)
  %sl280 = call ptr @ring_str_from_cstr(ptr @str279)
  %sba281 = call ptr @ring_sb_add(ptr %sb275, ptr %sl280)
  call void @ring_drop(ptr %sl280)
  %fp282 = getelementptr inbounds nuw { ptr, ptr }, ptr %0, i32 0, i32 0
  %fv283 = load ptr, ptr %fp282, align 8
  %sl285 = call ptr @ring_str_from_cstr(ptr @str284)
  %bd286 = call ptr @ring_get_builtin_dict(ptr %sl285)
  %dbs287 = getelementptr inbounds nuw { i64, ptr }, ptr %bd286, i32 0, i32 1
  %dbc288 = load ptr, ptr %dbs287, align 8
  %fps289 = getelementptr inbounds nuw { ptr, ptr }, ptr %dbc288, i32 0, i32 0
  %fp290 = load ptr, ptr %fps289, align 8
  %eps291 = getelementptr inbounds nuw { ptr, ptr }, ptr %dbc288, i32 0, i32 1
  %ep292 = load ptr, ptr %eps291, align 8
  %dp293 = load ptr, ptr %__ring_T_Debug, align 8
  %dbr294 = call ptr %fp290(ptr %ep292, ptr %fv283, ptr %dp293)
  %sba295 = call ptr @ring_sb_add(ptr %sb275, ptr %dbr294)
  call void @ring_drop(ptr %dbr294)
  %sl297 = call ptr @ring_str_from_cstr(ptr @str296)
  %sba298 = call ptr @ring_sb_add(ptr %sb275, ptr %sl297)
  call void @ring_drop(ptr %sl297)
  %sl300 = call ptr @ring_str_from_cstr(ptr @str299)
  %sba301 = call ptr @ring_sb_add(ptr %sb275, ptr %sl300)
  call void @ring_drop(ptr %sl300)
  %fp302 = getelementptr inbounds nuw { ptr, ptr }, ptr %0, i32 0, i32 1
  %fv303 = load ptr, ptr %fp302, align 8
  %p2i304 = ptrtoint ptr %fv303 to i64
  %and305 = and i64 %p2i304, 1
  %tag306 = icmp eq i64 %and305, 1
  br i1 %tag306, label %dbg.tagged, label %dbg.heap

dbg.tagged:                                       ; preds = %entry
  %ui307 = ptrtoint ptr %fv303 to i64
  %uv308 = ashr i64 %ui307, 1
  %its309 = call ptr @ring_int_to_str(i64 %uv308)
  br label %dbg.merge

dbg.heap:                                         ; preds = %entry
  call void @ring_dup(ptr %fv303)
  br label %dbg.merge

dbg.merge:                                        ; preds = %dbg.heap, %dbg.tagged
  %dstr310 = phi ptr [ %its309, %dbg.tagged ], [ %fv303, %dbg.heap ]
  %sba311 = call ptr @ring_sb_add(ptr %sb275, ptr %dstr310)
  call void @ring_drop(ptr %dstr310)
  %sl313 = call ptr @ring_str_from_cstr(ptr @str312)
  %sba314 = call ptr @ring_sb_add(ptr %sb275, ptr %sl313)
  call void @ring_drop(ptr %sl313)
  %dbg315 = call ptr @ring_sb_to_str(ptr %sb275)
  call void @ring_drop(ptr %sb275)
  ret ptr %dbg315
}

declare ptr @ring_get_builtin_dict(ptr)

define ptr @ring_dict_build___ListIterator_Debug() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls317 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps318 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls317, i32 0, i32 0
  store ptr @ring_ListIterator_debug__dictthunk, ptr %fps318, align 8
  %eps319 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls317, i32 0, i32 1
  store ptr null, ptr %eps319, align 8
  %ds320 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls317, ptr %ds320, align 8
  ret ptr %dict
}

define ptr @ring_ListIterator_debug__dictthunk(ptr %0, ptr %1, ptr %2) {
entry:
  %tk316 = call ptr @ring_ListIterator_debug(ptr %1, ptr %2)
  ret ptr %tk316
}

define ptr @ring_dict_init___ListIterator_Debug() {
entry:
  %dc321 = load ptr, ptr @__ring_dictg___ListIterator_Debug, align 8
  %dn322 = icmp eq ptr %dc321, null
  br i1 %dn322, label %build, label %done

build:                                            ; preds = %entry
  %db323 = call ptr @ring_dict_build___ListIterator_Debug()
  store ptr %db323, ptr @__ring_dictg___ListIterator_Debug, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv324 = load ptr, ptr @__ring_dictg___ListIterator_Debug, align 8
  ret ptr %dv324
}

define ptr @ring_SetIterator_debug(ptr %0, ptr %1) {
entry:
  %__ring_T_Debug = alloca ptr, align 8
  store ptr %1, ptr %__ring_T_Debug, align 8
  %sb325 = call ptr @ring_sb_new()
  %sl327 = call ptr @ring_str_from_cstr(ptr @str326)
  %sba328 = call ptr @ring_sb_add(ptr %sb325, ptr %sl327)
  call void @ring_drop(ptr %sl327)
  %sl330 = call ptr @ring_str_from_cstr(ptr @str329)
  %sba331 = call ptr @ring_sb_add(ptr %sb325, ptr %sl330)
  call void @ring_drop(ptr %sl330)
  %fp332 = getelementptr inbounds nuw { ptr, ptr }, ptr %0, i32 0, i32 0
  %fv333 = load ptr, ptr %fp332, align 8
  %sl335 = call ptr @ring_str_from_cstr(ptr @str334)
  %bd336 = call ptr @ring_get_builtin_dict(ptr %sl335)
  %dbs337 = getelementptr inbounds nuw { i64, ptr }, ptr %bd336, i32 0, i32 1
  %dbc338 = load ptr, ptr %dbs337, align 8
  %fps339 = getelementptr inbounds nuw { ptr, ptr }, ptr %dbc338, i32 0, i32 0
  %fp340 = load ptr, ptr %fps339, align 8
  %eps341 = getelementptr inbounds nuw { ptr, ptr }, ptr %dbc338, i32 0, i32 1
  %ep342 = load ptr, ptr %eps341, align 8
  %dp343 = load ptr, ptr %__ring_T_Debug, align 8
  %dbr344 = call ptr %fp340(ptr %ep342, ptr %fv333, ptr %dp343)
  %sba345 = call ptr @ring_sb_add(ptr %sb325, ptr %dbr344)
  call void @ring_drop(ptr %dbr344)
  %sl347 = call ptr @ring_str_from_cstr(ptr @str346)
  %sba348 = call ptr @ring_sb_add(ptr %sb325, ptr %sl347)
  call void @ring_drop(ptr %sl347)
  %sl350 = call ptr @ring_str_from_cstr(ptr @str349)
  %sba351 = call ptr @ring_sb_add(ptr %sb325, ptr %sl350)
  call void @ring_drop(ptr %sl350)
  %fp352 = getelementptr inbounds nuw { ptr, ptr }, ptr %0, i32 0, i32 1
  %fv353 = load ptr, ptr %fp352, align 8
  %p2i354 = ptrtoint ptr %fv353 to i64
  %and355 = and i64 %p2i354, 1
  %tag356 = icmp eq i64 %and355, 1
  br i1 %tag356, label %dbg.tagged, label %dbg.heap

dbg.tagged:                                       ; preds = %entry
  %ui357 = ptrtoint ptr %fv353 to i64
  %uv358 = ashr i64 %ui357, 1
  %its359 = call ptr @ring_int_to_str(i64 %uv358)
  br label %dbg.merge

dbg.heap:                                         ; preds = %entry
  call void @ring_dup(ptr %fv353)
  br label %dbg.merge

dbg.merge:                                        ; preds = %dbg.heap, %dbg.tagged
  %dstr360 = phi ptr [ %its359, %dbg.tagged ], [ %fv353, %dbg.heap ]
  %sba361 = call ptr @ring_sb_add(ptr %sb325, ptr %dstr360)
  call void @ring_drop(ptr %dstr360)
  %sl363 = call ptr @ring_str_from_cstr(ptr @str362)
  %sba364 = call ptr @ring_sb_add(ptr %sb325, ptr %sl363)
  call void @ring_drop(ptr %sl363)
  %dbg365 = call ptr @ring_sb_to_str(ptr %sb325)
  call void @ring_drop(ptr %sb325)
  ret ptr %dbg365
}

define ptr @ring_dict_build___SetIterator_Debug() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls367 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps368 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls367, i32 0, i32 0
  store ptr @ring_SetIterator_debug__dictthunk, ptr %fps368, align 8
  %eps369 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls367, i32 0, i32 1
  store ptr null, ptr %eps369, align 8
  %ds370 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls367, ptr %ds370, align 8
  ret ptr %dict
}

define ptr @ring_SetIterator_debug__dictthunk(ptr %0, ptr %1, ptr %2) {
entry:
  %tk366 = call ptr @ring_SetIterator_debug(ptr %1, ptr %2)
  ret ptr %tk366
}

define ptr @ring_dict_init___SetIterator_Debug() {
entry:
  %dc371 = load ptr, ptr @__ring_dictg___SetIterator_Debug, align 8
  %dn372 = icmp eq ptr %dc371, null
  br i1 %dn372, label %build, label %done

build:                                            ; preds = %entry
  %db373 = call ptr @ring_dict_build___SetIterator_Debug()
  store ptr %db373, ptr @__ring_dictg___SetIterator_Debug, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv374 = load ptr, ptr @__ring_dictg___SetIterator_Debug, align 8
  ret ptr %dv374
}

define ptr @ring_Result_debug(ptr %0, ptr %1, ptr %2) {
entry:
  %__ring_T_Debug = alloca ptr, align 8
  store ptr %1, ptr %__ring_T_Debug, align 8
  %__ring_E_Debug = alloca ptr, align 8
  store ptr %2, ptr %__ring_E_Debug, align 8
  %tp375 = getelementptr inbounds nuw { i64 }, ptr %0, i32 0, i32 0
  %tv376 = load i64, ptr %tp375, align 8
  switch i64 %tv376, label %dbg.default [
    i64 0, label %dbg.Ok
    i64 1, label %dbg.Err
  ]

dbg.default:                                      ; preds = %entry
  %sl416 = call ptr @ring_str_from_cstr(ptr @str415)
  br label %dbg.merge

dbg.merge:                                        ; preds = %dbg.default, %dbg.Err, %dbg.Ok
  %dbgr417 = phi ptr [ %dbg395, %dbg.Ok ], [ %dbg414, %dbg.Err ], [ %sl416, %dbg.default ]
  ret ptr %dbgr417

dbg.Ok:                                           ; preds = %entry
  %sb377 = call ptr @ring_sb_new()
  %sl379 = call ptr @ring_str_from_cstr(ptr @str378)
  %sba380 = call ptr @ring_sb_add(ptr %sb377, ptr %sl379)
  call void @ring_drop(ptr %sl379)
  %efp381 = getelementptr inbounds nuw { i64, ptr }, ptr %0, i32 0, i32 1
  %efv382 = load ptr, ptr %efp381, align 8
  %dp383 = load ptr, ptr %__ring_T_Debug, align 8
  %dbs384 = getelementptr inbounds nuw { i64, ptr }, ptr %dp383, i32 0, i32 1
  %dbc385 = load ptr, ptr %dbs384, align 8
  %fps386 = getelementptr inbounds nuw { ptr, ptr }, ptr %dbc385, i32 0, i32 0
  %fp387 = load ptr, ptr %fps386, align 8
  %eps388 = getelementptr inbounds nuw { ptr, ptr }, ptr %dbc385, i32 0, i32 1
  %ep389 = load ptr, ptr %eps388, align 8
  %dbr390 = call ptr %fp387(ptr %ep389, ptr %efv382)
  %sba391 = call ptr @ring_sb_add(ptr %sb377, ptr %dbr390)
  call void @ring_drop(ptr %dbr390)
  %sl393 = call ptr @ring_str_from_cstr(ptr @str392)
  %sba394 = call ptr @ring_sb_add(ptr %sb377, ptr %sl393)
  call void @ring_drop(ptr %sl393)
  %dbg395 = call ptr @ring_sb_to_str(ptr %sb377)
  call void @ring_drop(ptr %sb377)
  br label %dbg.merge

dbg.Err:                                          ; preds = %entry
  %sb396 = call ptr @ring_sb_new()
  %sl398 = call ptr @ring_str_from_cstr(ptr @str397)
  %sba399 = call ptr @ring_sb_add(ptr %sb396, ptr %sl398)
  call void @ring_drop(ptr %sl398)
  %efp400 = getelementptr inbounds nuw { i64, ptr }, ptr %0, i32 0, i32 1
  %efv401 = load ptr, ptr %efp400, align 8
  %dp402 = load ptr, ptr %__ring_E_Debug, align 8
  %dbs403 = getelementptr inbounds nuw { i64, ptr }, ptr %dp402, i32 0, i32 1
  %dbc404 = load ptr, ptr %dbs403, align 8
  %fps405 = getelementptr inbounds nuw { ptr, ptr }, ptr %dbc404, i32 0, i32 0
  %fp406 = load ptr, ptr %fps405, align 8
  %eps407 = getelementptr inbounds nuw { ptr, ptr }, ptr %dbc404, i32 0, i32 1
  %ep408 = load ptr, ptr %eps407, align 8
  %dbr409 = call ptr %fp406(ptr %ep408, ptr %efv401)
  %sba410 = call ptr @ring_sb_add(ptr %sb396, ptr %dbr409)
  call void @ring_drop(ptr %dbr409)
  %sl412 = call ptr @ring_str_from_cstr(ptr @str411)
  %sba413 = call ptr @ring_sb_add(ptr %sb396, ptr %sl412)
  call void @ring_drop(ptr %sl412)
  %dbg414 = call ptr @ring_sb_to_str(ptr %sb396)
  call void @ring_drop(ptr %sb396)
  br label %dbg.merge
}

define ptr @ring_dict_build___Result_Debug() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls419 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps420 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls419, i32 0, i32 0
  store ptr @ring_Result_debug__dictthunk, ptr %fps420, align 8
  %eps421 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls419, i32 0, i32 1
  store ptr null, ptr %eps421, align 8
  %ds422 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls419, ptr %ds422, align 8
  ret ptr %dict
}

define ptr @ring_Result_debug__dictthunk(ptr %0, ptr %1, ptr %2, ptr %3) {
entry:
  %tk418 = call ptr @ring_Result_debug(ptr %1, ptr %2, ptr %3)
  ret ptr %tk418
}

define ptr @ring_dict_init___Result_Debug() {
entry:
  %dc423 = load ptr, ptr @__ring_dictg___Result_Debug, align 8
  %dn424 = icmp eq ptr %dc423, null
  br i1 %dn424, label %build, label %done

build:                                            ; preds = %entry
  %db425 = call ptr @ring_dict_build___Result_Debug()
  store ptr %db425, ptr @__ring_dictg___Result_Debug, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv426 = load ptr, ptr @__ring_dictg___Result_Debug, align 8
  ret ptr %dv426
}

declare ptr @ring_list_get_opt(ptr, i64)

define ptr @ring_ListIterator(ptr %0, ptr %1) {
entry:
  %s = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 65)
  %fp = getelementptr inbounds nuw { ptr, ptr }, ptr %s, i32 0, i32 0
  store ptr %0, ptr %fp, align 8
  %fp1 = getelementptr inbounds nuw { ptr, ptr }, ptr %s, i32 0, i32 1
  store ptr %1, ptr %fp1, align 8
  ret ptr %s
}

define ptr @ring_dict_build___ListIterator_Iterator() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls574 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps575 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls574, i32 0, i32 0
  store ptr @ring_ListIterator_next__dictthunk, ptr %fps575, align 8
  %eps576 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls574, i32 0, i32 1
  store ptr null, ptr %eps576, align 8
  %ds577 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls574, ptr %ds577, align 8
  ret ptr %dict
}

define ptr @ring_ListIterator_next__dictthunk(ptr %0, ptr %1) {
entry:
  %tk573 = call ptr @ring_ListIterator_next(ptr %1)
  ret ptr %tk573
}

define ptr @ring_dict_init___ListIterator_Iterator() {
entry:
  %dc578 = load ptr, ptr @__ring_dictg___ListIterator_Iterator, align 8
  %dn579 = icmp eq ptr %dc578, null
  br i1 %dn579, label %build, label %done

build:                                            ; preds = %entry
  %db580 = call ptr @ring_dict_build___ListIterator_Iterator()
  store ptr %db580, ptr @__ring_dictg___ListIterator_Iterator, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv581 = load ptr, ptr @__ring_dictg___ListIterator_Iterator, align 8
  ret ptr %dv581
}

define ptr @ring_dict_build___List_Iterable() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls590 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps591 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls590, i32 0, i32 0
  store ptr @ring_List_iter__dictthunk, ptr %fps591, align 8
  %eps592 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls590, i32 0, i32 1
  store ptr null, ptr %eps592, align 8
  %ds593 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls590, ptr %ds593, align 8
  ret ptr %dict
}

define ptr @ring_List_iter__dictthunk(ptr %0, ptr %1) {
entry:
  %tk589 = call ptr @ring_List_iter(ptr %1)
  ret ptr %tk589
}

define ptr @ring_dict_init___List_Iterable() {
entry:
  %dc594 = load ptr, ptr @__ring_dictg___List_Iterable, align 8
  %dn595 = icmp eq ptr %dc594, null
  br i1 %dn595, label %build, label %done

build:                                            ; preds = %entry
  %db596 = call ptr @ring_dict_build___List_Iterable()
  store ptr %db596, ptr @__ring_dictg___List_Iterable, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv597 = load ptr, ptr @__ring_dictg___List_Iterable, align 8
  ret ptr %dv597
}

declare ptr @ring_match_fail(ptr, i64, i64, ptr)

define ptr @ring_lambda_708(ptr %0, ptr %1, ptr %2) {
entry:
  %__rc_scope_3 = alloca ptr, align 8
  %__rc_scope_2 = alloca ptr, align 8
  %__anf_19 = alloca ptr, align 8
  %__rc_scope_1 = alloca ptr, align 8
  %__anf_18 = alloca ptr, align 8
  %__anf_17 = alloca ptr, align 8
  %b = alloca ptr, align 8
  %a = alloca ptr, align 8
  %__ring_T_Ord = alloca ptr, align 8
  %ce709 = getelementptr inbounds nuw { i64, ptr }, ptr %0, i32 0, i32 1
  %__ring_T_Ord710 = load ptr, ptr %ce709, align 8
  store ptr %__ring_T_Ord710, ptr %__ring_T_Ord, align 8
  store ptr %1, ptr %a, align 8
  store ptr %2, ptr %b, align 8
  %a711 = load ptr, ptr %a, align 8
  %b712 = load ptr, ptr %b, align 8
  %dp713 = load ptr, ptr %__ring_T_Ord, align 8
  %ms714 = getelementptr inbounds nuw { i64, ptr }, ptr %dp713, i32 0, i32 1
  %mc715 = load ptr, ptr %ms714, align 8
  %fps716 = getelementptr inbounds nuw { ptr, ptr }, ptr %mc715, i32 0, i32 0
  %fp717 = load ptr, ptr %fps716, align 8
  %eps718 = getelementptr inbounds nuw { ptr, ptr }, ptr %mc715, i32 0, i32 1
  %ep719 = load ptr, ptr %eps718, align 8
  %cc720 = call ptr %fp717(ptr %ep719, ptr %a711, ptr %b712)
  %ui721 = ptrtoint ptr %cc720 to i64
  %uv722 = ashr i64 %ui721, 1
  call void @ring_drop(ptr %cc720)
  %ocmp723 = icmp slt i64 %uv722, 0
  %ext724 = zext i1 %ocmp723 to i64
  %sh725 = shl i64 %ext724, 1
  %tg726 = or i64 %sh725, 1
  %bb727 = inttoptr i64 %tg726 to ptr
  store ptr %bb727, ptr %__anf_17, align 8
  %__anf_17728 = load ptr, ptr %__anf_17, align 8
  %ub729 = ptrtoint ptr %__anf_17728 to i64
  %sh730 = ashr i64 %ub729, 1
  %i1731 = trunc i64 %sh730 to i1
  br i1 %i1731, label %if.then, label %if.else

if.then:                                          ; preds = %entry
  store ptr inttoptr (i64 3 to ptr), ptr %__anf_18, align 8
  %__anf_18735 = load ptr, ptr %__anf_18, align 8
  %ui736 = ptrtoint ptr %__anf_18735 to i64
  %uv737 = ashr i64 %ui736, 1
  %neg738 = sub i64 0, %uv737
  %sh739 = shl i64 %neg738, 1
  %tg740 = or i64 %sh739, 1
  %bi741 = inttoptr i64 %tg740 to ptr
  store ptr %bi741, ptr %__rc_scope_1, align 8
  %drop_val742 = load ptr, ptr %__anf_18, align 8
  call void @ring_drop(ptr %drop_val742)
  %__rc_scope_1743 = load ptr, ptr %__rc_scope_1, align 8
  br label %if.merge

if.else:                                          ; preds = %entry
  %a744 = load ptr, ptr %a, align 8
  %b745 = load ptr, ptr %b, align 8
  %dp746 = load ptr, ptr %__ring_T_Ord, align 8
  %ms747 = getelementptr inbounds nuw { i64, ptr }, ptr %dp746, i32 0, i32 1
  %mc748 = load ptr, ptr %ms747, align 8
  %fps749 = getelementptr inbounds nuw { ptr, ptr }, ptr %mc748, i32 0, i32 0
  %fp750 = load ptr, ptr %fps749, align 8
  %eps751 = getelementptr inbounds nuw { ptr, ptr }, ptr %mc748, i32 0, i32 1
  %ep752 = load ptr, ptr %eps751, align 8
  %cc753 = call ptr %fp750(ptr %ep752, ptr %a744, ptr %b745)
  %ui754 = ptrtoint ptr %cc753 to i64
  %uv755 = ashr i64 %ui754, 1
  call void @ring_drop(ptr %cc753)
  %ocmp756 = icmp sgt i64 %uv755, 0
  %ext757 = zext i1 %ocmp756 to i64
  %sh758 = shl i64 %ext757, 1
  %tg759 = or i64 %sh758, 1
  %bb760 = inttoptr i64 %tg759 to ptr
  store ptr %bb760, ptr %__anf_19, align 8
  %__anf_19761 = load ptr, ptr %__anf_19, align 8
  %ub762 = ptrtoint ptr %__anf_19761 to i64
  %sh763 = ashr i64 %ub762, 1
  %i1764 = trunc i64 %sh763 to i1
  br i1 %i1764, label %if.then1, label %if.else2

if.merge:                                         ; preds = %if.merge3, %if.then
  %if774 = phi ptr [ %__rc_scope_1743, %if.then ], [ %__rc_scope_2773, %if.merge3 ]
  store ptr %if774, ptr %__rc_scope_3, align 8
  %drop_val775 = load ptr, ptr %__anf_17, align 8
  call void @ring_drop(ptr %drop_val775)
  %__rc_scope_3776 = load ptr, ptr %__rc_scope_3, align 8
  ret ptr %__rc_scope_3776

if.then1:                                         ; preds = %if.else
  br label %if.merge3

if.else2:                                         ; preds = %if.else
  br label %if.merge3

if.merge3:                                        ; preds = %if.else2, %if.then1
  %if771 = phi ptr [ inttoptr (i64 3 to ptr), %if.then1 ], [ inttoptr (i64 1 to ptr), %if.else2 ]
  store ptr %if771, ptr %__rc_scope_2, align 8
  %drop_val772 = load ptr, ptr %__anf_19, align 8
  call void @ring_drop(ptr %drop_val772)
  %__rc_scope_2773 = load ptr, ptr %__rc_scope_2, align 8
  br label %if.merge
}

define ptr @ring_MapIterator(ptr %0, ptr %1) {
entry:
  %s = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 66)
  %fp = getelementptr inbounds nuw { ptr, ptr }, ptr %s, i32 0, i32 0
  store ptr %0, ptr %fp, align 8
  %fp1 = getelementptr inbounds nuw { ptr, ptr }, ptr %s, i32 0, i32 1
  store ptr %1, ptr %fp1, align 8
  ret ptr %s
}

define ptr @ring_dict_build___MapIterator_Iterator() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls849 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps850 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls849, i32 0, i32 0
  store ptr @ring_MapIterator_next__dictthunk, ptr %fps850, align 8
  %eps851 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls849, i32 0, i32 1
  store ptr null, ptr %eps851, align 8
  %ds852 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls849, ptr %ds852, align 8
  ret ptr %dict
}

define ptr @ring_MapIterator_next__dictthunk(ptr %0, ptr %1) {
entry:
  %tk848 = call ptr @ring_MapIterator_next(ptr %1)
  ret ptr %tk848
}

define ptr @ring_dict_init___MapIterator_Iterator() {
entry:
  %dc853 = load ptr, ptr @__ring_dictg___MapIterator_Iterator, align 8
  %dn854 = icmp eq ptr %dc853, null
  br i1 %dn854, label %build, label %done

build:                                            ; preds = %entry
  %db855 = call ptr @ring_dict_build___MapIterator_Iterator()
  store ptr %db855, ptr @__ring_dictg___MapIterator_Iterator, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv856 = load ptr, ptr @__ring_dictg___MapIterator_Iterator, align 8
  ret ptr %dv856
}

define ptr @ring_dict_build___Map_Iterable() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls866 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps867 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls866, i32 0, i32 0
  store ptr @ring_Map_iter__dictthunk, ptr %fps867, align 8
  %eps868 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls866, i32 0, i32 1
  store ptr null, ptr %eps868, align 8
  %ds869 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls866, ptr %ds869, align 8
  ret ptr %dict
}

define ptr @ring_Map_iter__dictthunk(ptr %0, ptr %1) {
entry:
  %tk865 = call ptr @ring_Map_iter(ptr %1)
  ret ptr %tk865
}

define ptr @ring_dict_init___Map_Iterable() {
entry:
  %dc870 = load ptr, ptr @__ring_dictg___Map_Iterable, align 8
  %dn871 = icmp eq ptr %dc870, null
  br i1 %dn871, label %build, label %done

build:                                            ; preds = %entry
  %db872 = call ptr @ring_dict_build___Map_Iterable()
  store ptr %db872, ptr @__ring_dictg___Map_Iterable, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv873 = load ptr, ptr @__ring_dictg___Map_Iterable, align 8
  ret ptr %dv873
}

define ptr @ring_SetIterator(ptr %0, ptr %1) {
entry:
  %s = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 67)
  %fp = getelementptr inbounds nuw { ptr, ptr }, ptr %s, i32 0, i32 0
  store ptr %0, ptr %fp, align 8
  %fp1 = getelementptr inbounds nuw { ptr, ptr }, ptr %s, i32 0, i32 1
  store ptr %1, ptr %fp1, align 8
  ret ptr %s
}

define ptr @ring_dict_build___SetIterator_Iterator() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls956 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps957 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls956, i32 0, i32 0
  store ptr @ring_SetIterator_next__dictthunk, ptr %fps957, align 8
  %eps958 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls956, i32 0, i32 1
  store ptr null, ptr %eps958, align 8
  %ds959 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls956, ptr %ds959, align 8
  ret ptr %dict
}

define ptr @ring_SetIterator_next__dictthunk(ptr %0, ptr %1) {
entry:
  %tk955 = call ptr @ring_SetIterator_next(ptr %1)
  ret ptr %tk955
}

define ptr @ring_dict_init___SetIterator_Iterator() {
entry:
  %dc960 = load ptr, ptr @__ring_dictg___SetIterator_Iterator, align 8
  %dn961 = icmp eq ptr %dc960, null
  br i1 %dn961, label %build, label %done

build:                                            ; preds = %entry
  %db962 = call ptr @ring_dict_build___SetIterator_Iterator()
  store ptr %db962, ptr @__ring_dictg___SetIterator_Iterator, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv963 = load ptr, ptr @__ring_dictg___SetIterator_Iterator, align 8
  ret ptr %dv963
}

define ptr @ring_dict_build___Set_Iterable() {
entry:
  %dict = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ i64, ptr }, ptr null, i32 1) to i64), i64 16)
  %dcnt = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 0
  store i64 1, ptr %dcnt, align 8
  %cls973 = call ptr @ring_alloc(i64 ptrtoint (ptr getelementptr ({ ptr, ptr }, ptr null, i32 1) to i64), i64 7)
  %fps974 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls973, i32 0, i32 0
  store ptr @ring_Set_iter__dictthunk, ptr %fps974, align 8
  %eps975 = getelementptr inbounds nuw { ptr, ptr }, ptr %cls973, i32 0, i32 1
  store ptr null, ptr %eps975, align 8
  %ds976 = getelementptr inbounds nuw { i64, ptr }, ptr %dict, i32 0, i32 1
  store ptr %cls973, ptr %ds976, align 8
  ret ptr %dict
}

define ptr @ring_Set_iter__dictthunk(ptr %0, ptr %1) {
entry:
  %tk972 = call ptr @ring_Set_iter(ptr %1)
  ret ptr %tk972
}

define ptr @ring_dict_init___Set_Iterable() {
entry:
  %dc977 = load ptr, ptr @__ring_dictg___Set_Iterable, align 8
  %dn978 = icmp eq ptr %dc977, null
  br i1 %dn978, label %build, label %done

build:                                            ; preds = %entry
  %db979 = call ptr @ring_dict_build___Set_Iterable()
  store ptr %db979, ptr @__ring_dictg___Set_Iterable, align 8
  br label %done

done:                                             ; preds = %build, %entry
  %dv980 = load ptr, ptr @__ring_dictg___Set_Iterable, align 8
  ret ptr %dv980
}

; Function Attrs: returns_twice
declare i32 @_setjmp(ptr, ptr) #1

; Function Attrs: nocallback nofree nosync nounwind willreturn memory(none)
declare ptr @llvm.frameaddress.p0(i32 immarg) #2

define void @ring_drop_ListIterator(ptr %0) {
entry:
  %fp1170 = getelementptr inbounds nuw { ptr, ptr }, ptr %0, i32 0, i32 0
  %fv1171 = load ptr, ptr %fp1170, align 8
  call void @ring_drop(ptr %fv1171)
  %fp1172 = getelementptr inbounds nuw { ptr, ptr }, ptr %0, i32 0, i32 1
  %fv1173 = load ptr, ptr %fp1172, align 8
  call void @ring_drop(ptr %fv1173)
  ret void
}

define void @ring_drop_MapIterator(ptr %0) {
entry:
  %fp1174 = getelementptr inbounds nuw { ptr, ptr }, ptr %0, i32 0, i32 0
  %fv1175 = load ptr, ptr %fp1174, align 8
  call void @ring_drop(ptr %fv1175)
  %fp1176 = getelementptr inbounds nuw { ptr, ptr }, ptr %0, i32 0, i32 1
  %fv1177 = load ptr, ptr %fp1176, align 8
  call void @ring_drop(ptr %fv1177)
  ret void
}

define void @ring_drop_SetIterator(ptr %0) {
entry:
  %fp1178 = getelementptr inbounds nuw { ptr, ptr }, ptr %0, i32 0, i32 0
  %fv1179 = load ptr, ptr %fp1178, align 8
  call void @ring_drop(ptr %fv1179)
  %fp1180 = getelementptr inbounds nuw { ptr, ptr }, ptr %0, i32 0, i32 1
  %fv1181 = load ptr, ptr %fp1180, align 8
  call void @ring_drop(ptr %fv1181)
  ret void
}

define i32 @main(i32 %0, ptr %1) {
entry:
  call void @ring_runtime_init(i32 %0, ptr %1)
  call void @ring_register_drop(i64 65, ptr @ring_drop_ListIterator)
  call void @ring_register_drop(i64 66, ptr @ring_drop_MapIterator)
  call void @ring_register_drop(i64 67, ptr @ring_drop_SetIterator)
  %2 = call ptr @ring_main(ptr null)
  ret i32 0
}

declare void @ring_runtime_init(i32, ptr)

attributes #0 = { nounwind }
attributes #1 = { returns_twice }
attributes #2 = { nocallback nofree nosync nounwind willreturn memory(none) }
